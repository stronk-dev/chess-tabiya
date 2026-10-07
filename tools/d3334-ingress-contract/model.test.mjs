// Disposable authoring tests, intentionally outside ordinary production CI. See RFC-0000.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { createRestHandler, ACCOUNT_IMPORT_MAX_BYTES, ServerError } from "../../.cache/d3334-ingress-contract/handler.mjs";
import { AdmissionRefusal, LIMITS, compileModel, draftIds, readRaw, tableRows } from "./model.mjs";
import { fixture, requestFor, tracedHandler } from "./fixtures.mjs";

const rows = tableRows();
test("literal population, independent partition and actual import ceiling are exact", () => {
  const model = compileModel();
  assert.equal(model.rows.length, 112); assert.equal(draftIds().length, 112);
  assert.equal(ACCOUNT_IMPORT_MAX_BYTES, LIMITS.account_32m);
  assert.deepEqual(Object.fromEntries(Object.keys(LIMITS).map(budget => [budget, rows.filter(row => row.budget === budget).length])), { none: 4, json_256k: 96, document_8m: 10, account_32m: 2 });
  assert.equal(createHash("sha256").update(readFileSync("apps/server/src/rest.ts")).digest("hex"), "4d6b3cfaf4f2fdd0afad9b8d21131714e0638d8948afc744eef9552d4b16827c", "Production changed: re-audit witnesses, do not silently restamp this guard");
});

for (const row of rows) {
  test(`actual route cutpoint and proposed permit: ${row.id}`, async () => {
    const item = fixture(row), traced = tracedHandler(createRestHandler, ServerError);
    const response = await traced.handler(requestFor(item));
    assert.equal(traced.calls.length, 1, `${item.id}: no unique service entry reached: ${await response.text()}`);
    assert.equal(traced.calls[0].target, item.target, `${item.id}: crossed dispatch`);
    const { args } = traced.calls[0];
    if (["classroom.member_accept", "classroom.member_decline", "classroom.member_leave"].includes(item.id)) {
      assert.equal(args[2], item.body.op, "Shared respond entry must preserve the exact selector");
    }
    if (item.id.startsWith("live.board.")) assert.equal(args[3].op, item.body.op);
    if (item.id.startsWith("live.match.")) assert.equal(args[3], item.body.op);
    if (["live.proposal.apply", "live.proposal.decline"].includes(item.id)) assert.equal(args.at(-1), item.body.op);
    if (["cohort_standing.close", "cohort_standing.window"].includes(item.id)) assert.equal(args[2].op, item.body.op);
    if (["cohort_standing.show_rating", "cohort_standing.hide_rating", "cohort_standing.show_record", "cohort_standing.hide_record"].includes(item.id)) {
      assert.equal(args[2], item.id.endsWith("rating") ? "rating" : "record");
      assert.equal(args[3], item.body.op.startsWith("show"));
    }
    const model = compileModel(), request = requestFor(item), permit = await model.admit(request);
    assert.equal(permit.operation.id, item.id);
    let invoked = 0;
    model.dispatch(permit, request, value => { invoked++; assert.equal(value.operation.id, item.id); });
    assert.equal(invoked, 1);
  });
}

test("missing, duplicate, extra, same-count identity, method, path and budget mutations fail", () => {
  const change = mutate => { const copy = rows.map(row => ({ ...row })); mutate(copy); return copy; };
  for (const mutation of [
    value => value.pop(), value => value.push({ ...value[0] }), value => { value[0].id = "auth.invented"; },
    value => { value[0].method = "DELETE"; }, value => { value[0].template = "/auth/import"; },
    value => { value.find(row => row.id === "auth.import").budget = "document_8m"; },
    value => { value.find(row => row.id === "classroom.create").budget = "account_32m"; },
  ]) assert.throws(() => compileModel(change(mutation)));
});

test("permits cannot be forged, crossed between requests/compilers, replayed or mutated", async () => {
  const model = compileModel(), other = compileModel(), item = fixture(rows.find(row => row.id === "classroom.create"));
  const request = requestFor(item), permit = await model.admit(request), target = () => assert.fail("Unadmitted callback ran");
  assert.throws(() => model.dispatch({ ...permit }, request, target), AdmissionRefusal);
  assert.throws(() => other.dispatch(permit, request, target), AdmissionRefusal);
  assert.throws(() => model.dispatch(permit, requestFor(item), target), AdmissionRefusal);
  assert.throws(() => { permit.parsed.name = "changed"; }, TypeError);
  assert.throws(() => { permit.operation.budget = "account_32m"; }, TypeError);
  model.dispatch(permit, request, () => {});
  assert.throws(() => model.dispatch(permit, request, target), AdmissionRefusal);
});

function streamed(path, chunks, { method = "POST", headers = {}, signal, cancel } = {}) {
  let reads = 0, cancelled = 0;
  const stream = new ReadableStream({ pull(controller) {
    reads++; const chunk = chunks.shift(); if (chunk === undefined) controller.close(); else controller.enqueue(chunk);
  }, cancel() { cancelled++; return cancel?.(); } }, { highWaterMark: 0 });
  const request = new Request(`http://localhost${path}`, { method, headers: { "content-type": "application/json", ...headers }, body: stream, duplex: "half", ...(signal === undefined ? {} : { signal }) });
  return { request, reads: () => reads, cancelled: () => cancelled };
}
const bytes = text => new TextEncoder().encode(text);
test("known unknown path/method refuses before producer pull; no JSON/side effect", async () => {
  const model = compileModel();
  for (const [path, method] of [["/auth/unknown", "POST"], ["/classrooms", "PUT"], ["/runs/r/graph", "POST"], ["/runs/r/modules/wrong", "POST"]]) {
    const source = streamed(path, [bytes("{}")], { method });
    await assert.rejects(model.admit(source.request), AdmissionRefusal);
    assert.equal(source.reads(), 0);
  }
});
test("equal pre-body identity does not distinguish valid/invalid body selector", async () => {
  const model = compileModel(), results = [];
  for (const op of ["leave", "bogus"]) {
    const source = streamed("/classrooms/c/members", [bytes(JSON.stringify({ op }))], { headers: { "content-length": "14" } });
    try { results.push((await model.admit(source.request)).operation.id); } catch (error) { assert.equal(error.code, "INVALID_REQUEST"); results.push(error.code); }
    assert.equal(source.reads(), 2, "Selector requires bounded body and EOF, not zero reads");
  }
  assert.deepEqual(results, ["classroom.member_leave", "INVALID_REQUEST"]);
});
test("invalid selector shapes never get a dispatch permit", async () => {
  const model = compileModel();
  for (const [path, method, body] of [["/runs/r/moves", "POST", { selection: null }], ["/runs/r/moves", "POST", { selection: {}, actor: "opponent" }], ["/runs/r/moves", "POST", { actor: "opponent" }], ["/runs/r/grants", "POST", { op: "invented" }], ["/runs/r/marks", "PUT", { rescopeFrom: null }], ["/assignments/a/submissions", "POST", { op: null }]]) {
    await assert.rejects(model.admit(new Request(`http://localhost${path}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) })), error => error.code === "INVALID_REQUEST");
  }
  for (const id of ["classroom.archive", "assignment.withdraw", "progress.schedule_dismiss", "live.session.close", "live.link.revoke"]) {
    const item = fixture(rows.find(row => row.id === id));
    for (const op of [undefined, null, "invented"]) {
      await assert.rejects(model.admit(requestFor({ ...item, body: { op } })), error => error.code === "INVALID_REQUEST");
    }
  }
});
test("the source-reachable aliases are positive predecessor controls and draft refusals", async () => {
  const model = compileModel();
  for (const [id, path] of [["live.board.offer", "/sessions/s/board/extra/pgn"], ["live.vote.close", "/sessions/s/votes/extra"], ["repertoire.scan", "/repertoires/r/scan/enter"], ["repertoire.delete", "/repertoires/r/enter"]]) {
    const item = { ...fixture(rows.find(row => row.id === id)), path }, traced = tracedHandler(createRestHandler, ServerError);
    await traced.handler(requestFor(item)); assert.equal(traced.calls[0]?.target, item.target);
    const source = streamed(path, [bytes(JSON.stringify(item.body))], { method: item.method });
    await assert.rejects(model.admit(source.request), error => error.code === "INVALID_REQUEST" && error.status === 400);
    assert.equal(source.reads(), 0); assert.equal(source.cancelled(), 1);
  }
});
test("declared overage is pre-pull; unknown/chunked overage stops before retention/decode", async () => {
  const declared = streamed("/x", [bytes("abcdefgh")], { headers: { "content-length": "9" } });
  await assert.rejects(readRaw(declared.request, 8), error => error.code === "BODY_TOO_LARGE" && error.status === 413);
  assert.equal(declared.reads(), 0);
  const chunked = streamed("/x", [bytes("abcd"), bytes("efgh"), bytes("i"), bytes("never read")]);
  await assert.rejects(readRaw(chunked.request, 8), error => error.code === "BODY_TOO_LARGE");
  assert.equal(chunked.reads(), 3); assert.equal(chunked.cancelled(), 1);
});
test("exact incremental boundary succeeds and retained chunks cannot be changed by their producer", async () => {
  const boundary = streamed("/x", [bytes("abcd"), bytes("efgh")]);
  assert.equal(new TextDecoder().decode(await readRaw(boundary.request, 8)), "abcdefgh");
  assert.equal(boundary.reads(), 3); assert.equal(boundary.cancelled(), 0);
  const buffer = bytes("abcd"); let reads = 0;
  const stream = new ReadableStream({ pull(controller) {
    if (++reads === 1) controller.enqueue(buffer);
    else { buffer.fill(0); controller.close(); }
  } }, { highWaterMark: 0 });
  const request = new Request("http://localhost/x", { method: "POST", body: stream, duplex: "half" });
  assert.equal(new TextDecoder().decode(await readRaw(request, 4)), "abcd");
  assert.equal(request.body.locked, false);
});
test("zero body means zero payload; chunked first-byte observation precedes refusal", async () => {
  const model = compileModel(), empty = fixture(rows.find(row => row.id === "shared.join_accept"));
  assert.equal((await model.admit(requestFor(empty))).rawBytes, 0);
  const source = streamed(empty.path, [bytes("x"), bytes("never read")]);
  await assert.rejects(model.admit(source.request), error => error.code === "BODY_TOO_LARGE");
  assert.equal(source.reads(), 1); assert.equal(source.cancelled(), 1);
});
test("split UTF-8 is preserved, invalid UTF-8/JSON/type/content encoding refused", async () => {
  const model = compileModel(), raw = bytes('{"name":"♞"}'), index = raw.indexOf(0xe2), source = streamed("/classrooms", [raw.slice(0, index + 1), raw.slice(index + 1)]);
  assert.equal((await model.admit(source.request)).parsed.name, "♞");
  for (const raw of [new Uint8Array([0xff]), bytes("{"), bytes("[]"), bytes("null")]) {
    const broken = streamed("/classrooms", [raw]); await assert.rejects(model.admit(broken.request), error => error.code === "INVALID_REQUEST");
  }
  const compressed = streamed("/classrooms", [bytes("{}")], { headers: { "content-encoding": "gzip" } });
  await assert.rejects(model.admit(compressed.request), AdmissionRefusal); assert.equal(compressed.reads(), 0);
});
test("abort breaks a pending read without waiting for producer cancellation acknowledgement", async () => {
  const controller = new AbortController();
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  const stream = new ReadableStream({ pull() { started(); return new Promise(() => {}); }, cancel() { return new Promise(() => {}); } }, { highWaterMark: 0 });
  const request = new Request("http://localhost/x", { method: "POST", body: stream, duplex: "half", signal: controller.signal });
  const pending = readRaw(request, 8); await ready; controller.abort();
  await assert.rejects(pending, error => error.name === "AbortError");
});
test("pre-read refusals cancel ownership; invalid native chunks do not leak a reader", async () => {
  const controller = new AbortController(); controller.abort();
  const aborted = streamed("/classrooms", [bytes("{}")], { signal: controller.signal });
  await assert.rejects(readRaw(aborted.request, 8), error => error.name === "AbortError");
  assert.equal(aborted.reads(), 0); assert.equal(aborted.cancelled(), 1);
  const malformed = streamed("/x", [bytes("{}")], { headers: { "content-length": "01" } });
  await assert.rejects(readRaw(malformed.request, 8), AdmissionRefusal);
  assert.equal(malformed.reads(), 0); assert.equal(malformed.cancelled(), 1);
  const wrongChunk = streamed("/x", ["not bytes", bytes("never read")]);
  await assert.rejects(readRaw(wrongChunk.request, 8), error => error.code === "INVALID_REQUEST");
  assert.equal(wrongChunk.reads(), 1); assert.equal(wrongChunk.cancelled(), 1);
  assert.equal(wrongChunk.request.body.locked, false);
  const wrongType = streamed("/classrooms", [bytes("{}")], { headers: { "content-type": "text/plain" } });
  await assert.rejects(compileModel().admit(wrongType.request), AdmissionRefusal);
  assert.equal(wrongType.reads(), 0); assert.equal(wrongType.cancelled(), 1);
});
test("canonical limits are observed without allocating large files: declared account overage and normal command cap", async () => {
  const model = compileModel();
  for (const [id, limit, code] of [["auth.import", LIMITS.account_32m, "ACCOUNT_IMPORT_TOO_LARGE"], ["pack_draft.create", LIMITS.document_8m, "BODY_TOO_LARGE"], ["classroom.create", LIMITS.json_256k, "BODY_TOO_LARGE"]]) {
    const item = fixture(rows.find(row => row.id === id)), source = streamed(item.path, [bytes("{}")], { headers: { "content-length": String(limit + 1) } });
    await assert.rejects(model.admit(source.request), error => error.code === code && error.detail.maxBytes === limit);
    assert.equal(source.reads(), 0);
  }
});
test("actual legacy handler still reads unknown auth and accepts an oversized ordinary command", async () => {
  const unknown = streamed("/auth/unknown", [bytes("{}")]), traced = tracedHandler(createRestHandler, ServerError);
  assert.equal((await traced.handler(unknown.request)).status, 404); assert.equal(unknown.reads(), 2);
  const item = fixture(rows.find(row => row.id === "classroom.create"));
  item.body = { name: "x".repeat(LIMITS.json_256k) };
  const oversized = requestFor(item); await traced.handler(oversized);
  assert.equal(traced.calls.at(-1).target, "classrooms.create", "Existing handler lacks the proposed command limit");
  await assert.rejects(compileModel().admit(requestFor(item)), error => error.code === "BODY_TOO_LARGE");
});
