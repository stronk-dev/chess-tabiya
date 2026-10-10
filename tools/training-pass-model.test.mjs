// DISPOSABLE AUTHOR MODEL — D3535, rfc/pack-training-forms.md §4.4–§4.10 (draft).
// Executes the draft DDL, not RunService/HTTP/chess/UX. Fabricated attempts below cannot
// validate chess truth, satisfy production acceptance, or authorize implementation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { isDeepStrictEqual } from "node:util";

import { passMarkCompletion, scaledLuxuryBudget } from "../packages/runtime/src/training-forms.ts";

const rfc = readFileSync(new URL("../rfc/pack-training-forms.md", import.meta.url), "utf8");
const ddl = rfc.match(/```sql\n(CREATE TABLE training_passes[\s\S]*?)\n```/u)?.[1];
assert.ok(ddl, "draft must contain the two-table DDL exercised by this disposable model");

function example({ subset = false, tempo = true } = {}) {
  return {
    id: "chapter", title: "Authored chapter", formatVersion: "0.1",
    members: [{ packId: "one", ordinal: 1 }, { packId: "two", ordinal: 2 }],
    passMark: { require: subset ? 1 : 2, of: subset ? ["one"] : "all", onFail: "repeat_set" },
    ...(tempo ? { tempo: { cycles: [{ ordinal: 1, budgetScale: 1 }, { ordinal: 2, budgetScale: .5 }] } } : {}),
  };
}

class DisposablePassModel {
  constructor(t, set = example()) {
    this.set = set;
    this.packs = new Map(["one", "two"].map(id => [id, { document: { id, budget: 4 }, channel: "community" }]));
    this.db = new DatabaseSync(":memory:");
    t.after(() => this.db.close());
    this.db.exec(`PRAGMA foreign_keys=ON;
      CREATE TABLE learners(id TEXT PRIMARY KEY) STRICT;
      INSERT INTO learners VALUES ('learner'), ('other');
      CREATE TABLE drill_runs(id TEXT PRIMARY KEY, snapshot_json TEXT NOT NULL) STRICT;`);
    this.db.exec(ddl);
  }

  transaction(work) {
    this.db.exec("BEGIN IMMEDIATE");
    try { const value = work(); this.db.exec("COMMIT"); return value; }
    catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }

  pass(id, owner = "learner") {
    const row = this.db.prepare("SELECT * FROM training_passes WHERE id=? AND learner_id=?").get(id, owner);
    if (!row) throw new Error("not_found");
    return row;
  }

  members(id) {
    return this.db.prepare("SELECT * FROM training_pass_members WHERE pass_id=? ORDER BY ordinal").all(id);
  }

  replay(row, field, request) {
    const saved = row[`${field}_request`];
    if (saved === null) return undefined;
    const prior = JSON.parse(saved);
    if (prior.commandId !== request.commandId) throw new Error("already_applied");
    if (!isDeepStrictEqual(prior, request)) throw new Error("command_conflict");
    return JSON.parse(row[`${field}_result`]);
  }

  create(request, { parentId, action, failAfterRun = false } = {}) {
    // Include route/action operands in the replay image, not only the child body.
    request = { ...request, ...(parentId === undefined ? {} : { parentId, action }) };
    return this.transaction(() => {
      const old = this.db.prepare("SELECT * FROM training_passes WHERE id=? AND learner_id=?").get(request.passId, "learner");
      if (old) return this.replay(old, "creation", request);
      let set = this.set;
      let inputs = [...this.packs.values()];
      let cycle = set.tempo?.cycles[0];
      if (parentId !== undefined) {
        const parent = this.pass(parentId);
        const child = this.db.prepare("SELECT * FROM training_passes WHERE parent_pass_id=? AND learner_id=?").get(parentId, "learner");
        if (child) return this.replay(child, "creation", request);
        assert.equal(parent.status, "complete");
        assert.equal(request.expectedRevision, parent.revision, "revision_conflict");
        set = JSON.parse(parent.set_document);
        inputs = this.members(parentId).map(row => JSON.parse(row.pack_input));
        const previous = set.tempo?.cycles.findIndex(item => item.ordinal === parent.cycle_ordinal);
        if (action === "next_cycle") {
          assert.notEqual(JSON.parse(parent.completion).passed, false, "failed_pass");
          cycle = set.tempo?.cycles[previous + 1];
          assert.ok(cycle, "last_cycle");
        } else cycle = set.tempo?.cycles[previous];
      }
      const runId = `${request.passId}-member-1`;
      const receipt = { passId: request.passId, ordinal: 1, runId };
      this.db.prepare(`INSERT INTO training_passes
        (id,learner_id,set_document,set_digest,cycle_ordinal,budget_scale,parent_pass_id,
         transition_kind,creation_request,creation_result,status,revision,created_at)
        VALUES (?,'learner',?,'model-only',?,?,?, ?,?,?,'active',1,'model-time')`).run(
        request.passId, JSON.stringify(set), cycle?.ordinal ?? null, cycle?.budgetScale ?? 1,
        parentId ?? null, action ?? "start", JSON.stringify(request), JSON.stringify(receipt));
      for (const member of set.members) this.db.prepare(`INSERT INTO training_pass_members
        (pass_id,ordinal,pack_input,pack_digest,state) VALUES (?,?,?,'model-only','pending')`).run(
        request.passId, member.ordinal, JSON.stringify(inputs.find(item => item.document.id === member.packId)));
      this.insertRun(request.passId, 1, runId, request);
      if (failAfterRun) throw new Error("injected_failure");
      if (parentId !== undefined) this.db.prepare("UPDATE training_passes SET revision=revision+1 WHERE id=?").run(parentId);
      return receipt;
    });
  }

  insertRun(passId, ordinal, runId, request) {
    this.db.prepare("INSERT INTO drill_runs VALUES (?,?)").run(runId,
      JSON.stringify({ verdict: "open", branchId: "main", nodeId: "tip", eventSequence: 1, countable: true }));
    const receipt = { passId, ordinal, runId };
    this.db.prepare(`UPDATE training_pass_members SET run_id=?, original_run_id=?,state='active',
      start_request=?,start_result=? WHERE pass_id=? AND ordinal=?`).run(
      runId, runId, JSON.stringify(request), JSON.stringify(receipt), passId, ordinal);
    return receipt;
  }

  start(request, owner = "learner") {
    return this.transaction(() => {
      const pass = this.pass(request.passId, owner);
      const members = this.members(pass.id);
      const slot = members.find(row => row.ordinal === request.ordinal);
      assert.ok(slot, "unknown_member");
      if (slot.start_request !== null) return this.replay(slot, "start", request);
      assert.equal(pass.status, "active");
      assert.equal(pass.revision, request.expectedRevision, "revision_conflict");
      assert.ok(members.filter(row => row.ordinal < slot.ordinal).every(row => row.state === "submitted"), "order");
      const receipt = this.insertRun(pass.id, slot.ordinal, `${pass.id}-member-${slot.ordinal}`, request);
      this.db.prepare("UPDATE training_passes SET revision=revision+1 WHERE id=?").run(pass.id);
      return receipt;
    });
  }

  move(runId, patch) {
    const row = this.db.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(runId);
    this.db.prepare("UPDATE drill_runs SET snapshot_json=? WHERE id=?").run(
      JSON.stringify({ ...JSON.parse(row.snapshot_json), ...patch }), runId);
  }

  submit(request, owner = "learner") {
    return this.transaction(() => {
      const pass = this.pass(request.passId, owner);
      const slot = this.members(pass.id).find(row => row.ordinal === request.ordinal);
      assert.ok(slot, "unknown_member");
      if (slot.submit_request !== null) return this.replay(slot, "submit", request);
      assert.equal(pass.status, "active");
      assert.equal(slot.state, "active");
      assert.equal(slot.run_id, request.runId, "crossed_run");
      assert.equal(pass.revision, request.expectedRevision, "revision_conflict");
      const attempt = JSON.parse(this.db.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(slot.run_id).snapshot_json);
      assert.equal(attempt.branchId, request.branchId, "crossed_branch");
      assert.equal(attempt.nodeId, request.nodeId, "crossed_tip");
      assert.equal(attempt.eventSequence, request.expectedEventSequence, "stale_run");
      assert.ok(attempt.countable, "empty_attempt");
      const receipt = { passId: pass.id, ordinal: slot.ordinal, runId: slot.run_id,
        branchId: attempt.branchId, nodeId: attempt.nodeId, verdict: attempt.verdict };
      this.db.prepare(`UPDATE training_pass_members SET state='submitted',attempt=?,submit_request=?,submit_result=?
        WHERE pass_id=? AND ordinal=?`).run(JSON.stringify(attempt), JSON.stringify(request), JSON.stringify(receipt), pass.id, slot.ordinal);
      const members = this.members(pass.id);
      const complete = members.every(row => row.state === "submitted");
      const set = JSON.parse(pass.set_document);
      const completion = complete ? (set.passMark === undefined ? { kind: "set_finished", setId: set.id }
        : passMarkCompletion(set, new Map(members.map(row => [JSON.parse(row.pack_input).document.id, JSON.parse(row.attempt).verdict])))) : null;
      this.db.prepare("UPDATE training_passes SET revision=revision+1,status=?,completion=? WHERE id=?").run(
        complete ? "complete" : "active", completion === null ? null : JSON.stringify(completion), pass.id);
      return receipt;
    });
  }

  submitCurrent(passId, ordinal, verdict = "stable") {
    const slot = this.members(passId).find(row => row.ordinal === ordinal);
    this.move(slot.run_id, { verdict });
    const request = { passId, ordinal, commandId: `submit-${passId}-${ordinal}`, expectedRevision: this.pass(passId).revision,
      runId: slot.run_id, branchId: "main", nodeId: "tip", expectedEventSequence: 1 };
    return { request, receipt: this.submit(request) };
  }

  finish(passId, verdicts = ["stable", "stable"]) {
    this.submitCurrent(passId, 1, verdicts[0]);
    this.start({ passId, ordinal: 2, commandId: `start-${passId}-2`, expectedRevision: this.pass(passId).revision });
    this.submitCurrent(passId, 2, verdicts[1]);
  }

  budget(passId, ordinal) {
    const pass = this.pass(passId);
    const set = JSON.parse(pass.set_document);
    const cycle = set.tempo?.cycles.find(item => item.ordinal === pass.cycle_ordinal);
    assert.equal(pass.budget_scale, cycle?.budgetScale ?? 1, "scale_not_authored");
    assert.equal(pass.cycle_ordinal, cycle?.ordinal ?? null, "cycle_not_authored");
    const slot = this.members(passId).find(row => row.ordinal === ordinal);
    return scaledLuxuryBudget(JSON.parse(slot.pack_input).document.budget, pass.budget_scale);
  }
}

test("draft DDL permits exact replay and rolls back failed linked run creation", t => {
  const model = new DisposablePassModel(t);
  const request = { passId: "first", commandId: "create-first" };
  assert.throws(() => model.create(request, { failAfterRun: true }), /injected_failure/);
  for (const table of ["training_passes", "training_pass_members", "drill_runs"]) {
    assert.equal(model.db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n, 0);
  }
  const original = model.create(request);
  model.submitCurrent("first", 1);
  assert.deepEqual(model.create(request), original);
  assert.throws(() => model.create({ ...request, writerId: "changed" }), /command_conflict/);
  assert.equal(model.members("first").length, 2);
});

test("two passes of the same packs retain independent frozen results", t => {
  const model = new DisposablePassModel(t);
  model.create({ passId: "first", commandId: "first" });
  model.create({ passId: "second", commandId: "second" });
  const { request, receipt } = model.submitCurrent("first", 1, "unstable");
  model.move(request.runId, { verdict: "stable", eventSequence: 5 });
  model.submitCurrent("second", 1, "stable");
  assert.deepEqual(model.submit(request), receipt, "replay precedes current revision and run changes");
  assert.equal(JSON.parse(model.members("first")[0].attempt).verdict, "unstable");
  assert.equal(JSON.parse(model.members("second")[0].attempt).verdict, "stable");
});

test("owned ordered slots reject foreign readers, crossed runs, stale tips and empty attempts", t => {
  const model = new DisposablePassModel(t);
  model.create({ passId: "first", commandId: "first" });
  model.create({ passId: "other-pass", commandId: "other-pass" });
  assert.throws(() => model.start({ passId: "first", ordinal: 2, expectedRevision: 1 }), /order/);
  const request = { passId: "first", ordinal: 1, commandId: "submit", expectedRevision: 1,
    runId: "first-member-1", branchId: "main", nodeId: "tip", expectedEventSequence: 1 };
  for (const [patch, reason] of [[{ runId: "other-pass-member-1" }, /crossed_run/],
    [{ branchId: "invented" }, /crossed_branch/], [{ nodeId: "old" }, /crossed_tip/],
    [{ expectedEventSequence: 0 }, /stale_run/], [{ expectedRevision: 0 }, /revision_conflict/]]) {
    assert.throws(() => model.submit({ ...request, ...patch }), reason);
  }
  assert.throws(() => model.submit(request, "other"), /not_found/);
  model.move(request.runId, { countable: false });
  assert.throws(() => model.submit(request), /empty_attempt/);
  assert.equal(model.pass("first").revision, 1);
});

test("subset pass marks still wait for every ordinal; open is not stable", t => {
  const model = new DisposablePassModel(t, example({ subset: true }));
  model.create({ passId: "subset", commandId: "subset" });
  model.submitCurrent("subset", 1, "stable");
  assert.equal(model.pass("subset").completion, null);
  assert.equal(model.pass("subset").status, "active");
  model.start({ passId: "subset", ordinal: 2, commandId: "next", expectedRevision: 2 });
  model.submitCurrent("subset", 2, "open");
  assert.deepEqual(JSON.parse(model.pass("subset").completion), { kind: "set_completion", setId: "chapter", passed: true, reoffer: false });
  model.create({ passId: "failed", commandId: "failed" });
  model.finish("failed", ["open", "stable"]);
  assert.equal(JSON.parse(model.pass("failed").completion).passed, false);
});

test("failed Repeat keeps scale; successful Next uses retained content and stops at last cycle", t => {
  const model = new DisposablePassModel(t);
  model.create({ passId: "failed", commandId: "failed" });
  model.finish("failed", ["unstable", "stable"]);
  assert.throws(() => model.create({ passId: "bad-next", commandId: "bad-next", expectedRevision: 4 },
    { parentId: "failed", action: "next_cycle" }), /failed_pass/);
  model.create({ passId: "repeat", commandId: "repeat", expectedRevision: 4 }, { parentId: "failed", action: "repeat" });
  assert.equal(model.budget("repeat", 1), 4);
  model.finish("repeat");
  model.packs.clear();
  model.set.title = "Changed catalogue";
  const next = { passId: "cycle-two", commandId: "cycle-two", expectedRevision: 4 };
  model.create(next, { parentId: "repeat", action: "next_cycle" });
  assert.equal(model.budget("cycle-two", 1), 2);
  assert.equal(JSON.parse(model.pass("cycle-two").set_document).title, "Authored chapter");
  model.finish("cycle-two");
  assert.deepEqual(model.create(next, { parentId: "repeat", action: "next_cycle" }), { passId: "cycle-two", ordinal: 1, runId: "cycle-two-member-1" });
  assert.throws(() => model.create(next, { parentId: "repeat", action: "repeat" }), /command_conflict/);
  assert.throws(() => model.create({ passId: "cycle-three", commandId: "three", expectedRevision: 4 },
    { parentId: "cycle-two", action: "next_cycle" }), /last_cycle/);
});

test("a raced alternative continuation cannot allocate another child or run", t => {
  const model = new DisposablePassModel(t);
  model.create({ passId: "parent", commandId: "parent" });
  model.finish("parent");
  model.create({ passId: "next", commandId: "next", expectedRevision: 4 }, { parentId: "parent", action: "next_cycle" });
  assert.throws(() => model.create({ passId: "repeat", commandId: "repeat", expectedRevision: 4 },
    { parentId: "parent", action: "repeat" }), /already_applied/);
  assert.equal(model.pass("parent").revision, 5);
  assert.equal(model.db.prepare("SELECT count(*) AS n FROM drill_runs").get().n, 3);
  assert.throws(() => model.pass("repeat"), /not_found/);
});

test("ungraded ordinary completion is not a manufactured successful threshold", t => {
  const set = example({ tempo: false });
  delete set.passMark;
  const model = new DisposablePassModel(t, set);
  model.create({ passId: "ordinary", commandId: "ordinary" });
  model.finish("ordinary", ["open", "open"]);
  assert.deepEqual(JSON.parse(model.pass("ordinary").completion), { kind: "set_finished", setId: "chapter" });
  assert.equal(model.pass("ordinary").cycle_ordinal, null);
  assert.equal(model.pass("ordinary").budget_scale, 1);
});

test("stored inputs stay original and zero/odd budgets use the shipped floor arithmetic", t => {
  const model = new DisposablePassModel(t);
  model.set.tempo.cycles[0].budgetScale = .5;
  model.create({ passId: "one", commandId: "one" });
  const original = model.members("one")[0].pack_input;
  assert.equal(model.budget("one", 1), 2);
  assert.equal(model.budget("one", 1), 2, "resolving twice cannot scale twice");
  assert.equal(model.members("one")[0].pack_input, original);
  assert.equal(scaledLuxuryBudget(3, .5), 1);
  assert.equal(scaledLuxuryBudget(1, .5), 0);
  assert.equal(scaledLuxuryBudget(0, .5), 0);
  model.db.prepare("UPDATE training_passes SET budget_scale=.75 WHERE id='one'").run();
  assert.throws(() => model.budget("one", 1), /scale_not_authored/);
});

test("linked run deletion cannot silently submit a member; submitted frozen history survives", t => {
  const model = new DisposablePassModel(t);
  model.create({ passId: "active", commandId: "active" });
  model.transaction(() => {
    model.db.prepare("UPDATE training_pass_members SET state='unavailable' WHERE run_id='active-member-1'").run();
    model.db.prepare("UPDATE training_passes SET status='unavailable' WHERE id='active'").run();
    model.db.prepare("DELETE FROM drill_runs WHERE id='active-member-1'").run();
  });
  assert.equal(model.members("active")[0].run_id, null);
  assert.equal(model.members("active")[0].original_run_id, "active-member-1");
  assert.equal(model.pass("active").completion, null);
  model.create({ passId: "submitted", commandId: "submitted" });
  model.submitCurrent("submitted", 1);
  model.db.prepare("DELETE FROM drill_runs WHERE id='submitted-member-1'").run();
  assert.equal(model.members("submitted")[0].state, "submitted");
  assert.equal(JSON.parse(model.members("submitted")[0].attempt).verdict, "stable");
});
