// Permanent production-boundary controls for profile-game-facts §1–2. No fake source owner.
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { dirname } from "node:path";
import { rmSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { fork, reachCheckpoint, readBackReplay, type DrillRun } from "@chess-tabiya/runtime";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { readFoundationRecordedPrefix } from "../../../packages/runtime/src/recorded-foundation-source.js";
import { RECORDED_FOUNDATION_SOURCE_AUTHORITY } from "../../../packages/runtime/src/recorded-foundation-source-authority.js";
import { RECORDED_CLOCK_SOURCE_AUTHORITY } from "../../../packages/runtime/src/recorded-clock-source-authority.js";
import { LongitudinalStore } from "./longitudinal-store.js";
import { projectObservations } from "./longitudinal-projector.js";
import { readProfileGameSource, type ProfileGameSource } from "./profile-game-source.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { AT, FIXTURE_DEPENDENCIES, fileFixture, learner, play, positionRun, type FileFixture } from "./longitudinal-test-fixtures.js";

const fixtures: FileFixture[] = [], databases: DatabaseSync[] = [];
afterEach(() => {
  for (const db of databases.splice(0)) db.close();
  for (const f of fixtures.splice(0)) { f.storage.close(); rmSync(dirname(f.path), { recursive: true, force: true }); }
});
function fixture(run: DrillRun = play(positionRun("game-source"), "e2e4")) {
  const f = fileFixture("tabiya-game-source-"); fixtures.push(f);
  const lease = learner(f.storage, "game-source-owner"); f.storage.create(run, lease);
  const db = new DatabaseSync(f.path); db.exec("PRAGMA foreign_keys=ON"); databases.push(db);
  const store = new LongitudinalStore(db, { now: () => f.clock.now });
  return { ...f, run, lease, db, store };
}
function acquire(f: ReturnType<typeof fixture>) {
  const claim = f.store.claimBatch({ workerId: "game-source-worker", scanLimit: 1, slots: 1, leaseMs: 60_000 })[0]!;
  expect(claim).toBeDefined();
  const image = f.store.claimSourceImage(claim)!;
  expect(image).toBeDefined();
  return { claim, image, scope: f.store.openClaimedGameSource(claim, image) };
}
const project = (image: Parameters<typeof projectObservations>[0], checkpoint: () => void, gameSource: ProfileGameSource) =>
  projectObservations(image, { checkpoint, gameSource, dependencies: FIXTURE_DEPENDENCIES });
function restoreJob(db: DatabaseSync, row: Record<string, SQLInputValue>): void {
  const keys = Object.keys(row).filter(key => key !== "run_id");
  db.prepare(`UPDATE learner_observation_jobs SET ${keys.map(key => `${key}=?`).join(",")} WHERE run_id=?`)
    .run(...keys.map(key => row[key]!), row.run_id!);
}

describe("genuine claimed-cut GAME source", () => {
  for (const side of ["white", "black"] as const) it(`preserves original ${side} path/head and first-rights factory`, () => {
    const f = fixture(play(positionRun("game-source", undefined, side), "e2e4", "e7e5"));
    const { image, scope } = acquire(f), actual = readProfileGameSource(scope);
    expect(actual.image).toBe(image); expect(actual.mode).toBe("claim");
    const prefix = readFoundationRecordedPrefix(actual.prefix);
    expect(prefix.kind).toBe("claimed_game"); expect(prefix.authority.learnerSide).toBe(side);
    expect(prefix.authority.eventHead.seq).toBe(image.runPrefix.requestedSeq);
    expect(actual.path.map(member => [member.nodeId, member.sourcePly, member.creation.seq]))
      .toEqual(f.run.nodes.map((node, index) => [node.id, index, index + 1]));
    const rights = invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix: actual.prefix });
    expect(rights.kind).toBe("available");
    if (rights.kind === "available") expect(rights.value.payload).toMatchObject({ learnerColor: side,
      firstDecisionNodeId: f.run.nodes[side === "white" ? 0 : 1]!.id, rights: { kingside: true, queenside: true } });
  });
  it("does not mistake genuine later checkpoint annotations for altered creation bytes", () => {
    const run = reachCheckpoint(play(positionRun("game-source"), "e2e4"), "genuine-checkpoint", AT).run;
    const f = fixture(run), { scope } = acquire(f), actual = readProfileGameSource(scope);
    expect(actual.run.nodes.at(-1)!.checkpointRefs).toContain("genuine-checkpoint");
    expect(actual.path.at(-1)!.creation.seq).toBe(2);
  });
  it("refuses copied claims/images, separately acquired images, other-store images and forged scopes", () => {
    const f = fixture(), { claim, image, scope } = acquire(f);
    expect(() => f.store.openClaimedGameSource({ ...claim }, image)).toThrow();
    expect(() => f.store.openClaimedGameSource(claim, { ...image })).toThrow();
    expect(() => f.store.openClaimedGameSource(claim, f.store.longitudinalSourceImageV4(f.run.id, claim.claimedRequestedSeq))).toThrow();
    const other = new LongitudinalStore(f.db, { now: () => f.clock.now });
    expect(() => other.openClaimedGameSource(claim, image)).toThrow();
    expect(() => other.closeGameSource(scope)).toThrow();
    expect(() => readProfileGameSource({ ...scope } as ProfileGameSource)).toThrow();
    expect(() => projectObservations({ ...image }, { gameSource: scope, dependencies: FIXTURE_DEPENDENCIES })).toThrow(/IMAGE_MISMATCH/u);
  });
  it("survives genuine heartbeat renewal, then permanently retires after observed claim loss", () => {
    const f = fixture(), { claim, scope } = acquire(f);
    f.clock.now += 1_000;
    const renewed = f.store.renew(claim, 60_000)!; expect(renewed.leaseExpiresAt).not.toBe(claim.leaseExpiresAt);
    expect(readProfileGameSource(scope).image.runPrefix.runId).toBe(f.run.id);
    const before = f.db.prepare("SELECT * FROM learner_observation_jobs WHERE run_id=?").get(f.run.id) as Record<string, SQLInputValue>;
    expect(f.store.abandon(renewed)).toBe(true);
    expect(() => readProfileGameSource(scope)).toThrow(/RETIRED/u);
    restoreJob(f.db, before);
    expect(() => readProfileGameSource(scope)).toThrow(/active original/u);
  });
  it("expiry and explicit close retire both scope and its genuine castling prefix", () => {
    const f = fixture(), { scope } = acquire(f), prefix = readProfileGameSource(scope).prefix;
    f.clock.now += 60_001;
    expect(() => readFoundationRecordedPrefix(prefix)).toThrow(/RETIRED/u);
    f.clock.now -= 60_001;
    expect(() => readFoundationRecordedPrefix(prefix)).toThrow(/active original/u);
    f.store.closeGameSource(scope);
    expect(() => readProfileGameSource(scope)).toThrow();
  });
  it("cannot issue live decisions, actor occurrences or clock sources from a claimed GAME prefix", () => {
    const f = fixture(), { scope } = acquire(f), prefix = readProfileGameSource(scope).prefix;
    expect(() => RECORDED_FOUNDATION_SOURCE_AUTHORITY.issueDecision(prefix, f.run.nodes[0]!.id)).toThrow(/GAME/u);
    expect(() => RECORDED_FOUNDATION_SOURCE_AUTHORITY.issueOccurrenceContext({} as never, { kind: "baseline" }, "learner", () => {})).toThrow();
    expect(() => RECORDED_CLOCK_SOURCE_AUTHORITY.issueClockSource(prefix, {} as never, {} as never, {}, new AbortController().signal, () => {})).toThrow(/GAME/u);
  });
  it("retires on actual source watermark change and account deletion", () => {
    const f = fixture(), { scope } = acquire(f);
    f.storage.save(play(f.run, "e7e5"), f.lease);
    expect(() => readProfileGameSource(scope)).toThrow(/RETIRED/u);
    const next = acquire(f);
    f.storage.deleteLearner(f.lease.learnerId, AT);
    expect(() => readProfileGameSource(next.scope)).toThrow();
  });
  for (const mutation of ["illegal move", "false SAN", "wrong FEN", "undeclared branch with illegal move"] as const) it(`validates an unrelated branch before narrowing: ${mutation}`, () => {
    let run = play(positionRun("game-source"), "e2e4", "e7e5");
    run = play(fork(run, run.nodes[0]!.id, { at: AT }).run, "d2d4");
    const events = structuredClone(run.events);
    const last = [...events].reverse().find(event => event.type === "move.committed")!;
    if (last.type !== "move.committed") throw Error("missing move");
    const changed = mutation === "undeclared branch with illegal move" ? { ...last.data.node, branchId: "never-declared", moveUci: "d2d5" }
      : mutation === "illegal move" ? { ...last.data.node, moveUci: "d2d5" }
      : mutation === "false SAN" ? { ...last.data.node, moveSan: "e4" }
        : { ...last.data.node, fen: run.start.fen };
    const invalid = readBackReplay(events.map(event => event === last ? { ...last, data: { node: changed } } : event)).run;
    const f = fixture(invalid);
    expect(() => acquire(f)).toThrow();
  });
  it("the actual batch supplies the exact scope and closes it after publication", () => {
    const f = fixture(); let captured: ProfileGameSource | undefined;
    const result = runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, "actual-batch", {
      project: (image, checkpoint, scope) => { captured = scope; expect(readProfileGameSource(scope).image).toBe(image); return project(image, checkpoint, scope); },
    });
    expect(result.completed).toBe(1); expect(captured).toBeDefined();
    expect(() => readProfileGameSource(captured!)).toThrow(/active original/u);
  });
  it("closes after an actual N-to-N+1 publication conflict without overwriting the writer", () => {
    const f = fixture(); let captured: ProfileGameSource | undefined;
    const result = runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, "actual-conflict", {
      project: (image, checkpoint, scope) => {
        captured = scope; const output = project(image, checkpoint, scope);
        f.storage.save(play(f.run, "e7e5"), f.lease); return output;
      },
    });
    expect(result.conflicts).toBe(1); expect(result.completed).toBe(0);
    expect(f.storage.read(f.run.id)!.run.nodes).toHaveLength(3);
    expect(() => readProfileGameSource(captured!)).toThrow(/active original/u);
  });
  for (const outcome of ["failure", "drain"] as const) it(`the actual batch closes after ${outcome}`, () => {
    const f = fixture(); let captured: ProfileGameSource | undefined, drain = false;
    const result = runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, "actual-batch", {
      drainRequested: () => drain,
      project: (_image, checkpoint, scope) => { captured = scope; if (outcome === "failure") throw Error("actual controlled projector failure"); drain = true; checkpoint(); throw Error("unreachable"); },
    });
    expect(outcome === "failure" ? result.failed : result.abandoned).toBe(1);
    expect(() => readProfileGameSource(captured!)).toThrow(/active original/u);
  });
});

describe("separate complete-job rebuild GAME scope", () => {
  it("projects with an actual complete source and closes after comparison", () => {
    const f = fixture(); runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, "complete", { project });
    let captured: ProfileGameSource | undefined;
    const report = f.store.rebuild({ write: false, project: (image, { gameSource }) => {
      captured = gameSource; expect(readProfileGameSource(gameSource)).toMatchObject({ mode: "rebuild", image });
      return projectObservations(image, { gameSource, dependencies: FIXTURE_DEPENDENCIES });
    } });
    expect(report.checked).toBe(1); expect(report.mismatches).toEqual([]);
    expect(() => readProfileGameSource(captured!)).toThrow(/active original/u);
  });
  it("holds no read lock and refuses source movement before comparison or repair", () => {
    const f = fixture(); runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, "complete", { project });
    let captured: ProfileGameSource | undefined;
    expect(() => f.store.rebuild({ write: true, project: (image, { gameSource }) => {
      captured = gameSource;
      const result = projectObservations(image, { gameSource, dependencies: FIXTURE_DEPENDENCIES });
      // A real writer through a second connection must succeed; the following check must refuse.
      f.storage.save(play(f.run, "e7e5"), f.lease);
      return result;
    } })).toThrow(/SOURCE_MOVED/u);
    expect(f.storage.read(f.run.id)!.run.nodes).toHaveLength(3);
    expect(() => readProfileGameSource(captured!)).toThrow(/active original/u);
  });
  it("cannot acquire from a running job and closes on a rebuild exception", () => {
    const f = fixture(), { claim } = acquire(f);
    expect(f.store.openRebuildGameSource(f.run.id)).toBeUndefined();
    f.store.abandon(claim);
    runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, "complete", { project });
    let captured: ProfileGameSource | undefined;
    expect(() => f.store.rebuild({ write: false, project: (_image, { gameSource }) => { captured = gameSource; throw Error("controlled rebuild failure"); } })).toThrow(/controlled/u);
    expect(() => readProfileGameSource(captured!)).toThrow(/active original/u);
  });
  it("rechecks the actual source digest inside repair and rolls back before inserting derived rows", () => {
    const f = fixture(); runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, "complete", { project });
    f.db.prepare("DELETE FROM learner_observations WHERE run_id=?").run(f.run.id);
    let captured: ProfileGameSource | undefined;
    expect(() => f.store.rebuild({ write: true, project: (image, { gameSource }) => {
      captured = gameSource;
      const output = projectObservations(image, { gameSource, dependencies: FIXTURE_DEPENDENCIES });
      // Deliberate low-level corruption bypasses watermark: the final digest check still fences it.
      const changed = structuredClone(f.run);
      const events = changed.events.map((event, index) => index === 1 ? { ...event, at: "2026-09-24T10:00:01.000Z" } : event);
      f.db.prepare("UPDATE drill_runs SET snapshot_json=? WHERE id=?").run(JSON.stringify({ ...changed, events }), f.run.id);
      return output;
    } })).toThrow(/SOURCE_MOVED/u);
    expect(f.db.prepare("SELECT count(*) AS n FROM learner_observations WHERE run_id=?").get(f.run.id)).toMatchObject({ n: 0 });
    expect(f.store.jobs()[0]!.state).toBe("complete");
    expect(() => readProfileGameSource(captured!)).toThrow(/active original/u);
  });
});
