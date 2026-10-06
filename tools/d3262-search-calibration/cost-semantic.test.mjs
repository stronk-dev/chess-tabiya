import assert from "node:assert/strict";
import test from "node:test";
import { firstReplyEvents, reserveFirstReply, reserveRecursiveLayer } from "./cost-semantic.mjs";
import { executeCostCase } from "./cost-execution.mjs";
import { parseProbe, position, SourceFailure } from "./cost-stockfish.mjs";
import { enumerateCandidate, legalMoves } from "./exact-reply-enumeration.mjs";
import { sha } from "./cost-contract.mjs";

const piece = (color, role, square) => ({ color, role, square });
const rootFen = "4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1";
const definition = { id: "ep", rootId: "synthetic", family: "material",
  target: { attacker: piece("black", "pawn", "d4"), target: piece("white", "pawn", "e2") } };
const subject = { rootFen, definitions: [definition] };
const sourceDigest = sha("synthetic source, not measurement");
function adapter() {
  return { sourceDigest, async execute(q) {
    const started = performance.now(), legal = legalMoves(position(q.fen)), n = Math.min(q.multiPv, legal.length);
    const lines = [...legal.slice(0, n).map((x, i) => `info depth ${q.budget.startsWith("depth") ? q.budget.slice(5) : 8} multipv ${i + 1} score cp ${10 - i} pv ${x.uci}`),
      `bestmove ${legal[0].uci}`];
    return { operands: q, lines, result: parseProbe(q, lines), started, ended: performance.now(), engineName: "synthetic" };
  } };
}
const legal = ["a1a2", "a1b1", "b1b2", "b1c1", "c1c2", "c1d1", "d1d2", "d1e1", "e1e2", "e1f1"];
test("first-layer top-eight refuses unranked event, all-legal rank admits it without changing width", () => {
  const narrow = reserveFirstReply(legal, legal.slice(0, 8), legal.slice(0, 8), [legal[8]], 2);
  assert.equal(narrow.status, "event_outside_source_width"); assert.deepEqual(narrow.selected, legal.slice(0, 2));
  const full = reserveFirstReply(legal, legal.slice(0, 8), legal, [legal[8]], 2);
  assert.deepEqual(full.selected, [legal[0], legal[8]]); assert.equal(full.reservedRank, 9);
});
test("later recursive layer retains canonical unranked event, never fabricates engine rank", () => {
  const v = reserveRecursiveLayer(legal, legal.slice(0, 8), [legal[9], legal[8]], 2);
  assert.deepEqual(v.selected, [legal[0], legal[8]]); assert.equal(v.reservedRank, null);
  assert.equal(v.eventOrderAuthority, "canonical_uci_unranked_tie_not_engine_rank");
});
test("first-layer EP geometry follows captured-square identity without reading SEE or outcome", () => {
  const c = enumerateCandidate(rootFen, "e2e4"), event = firstReplyEvents(rootFen, c, definition);
  assert.deepEqual(event.eventReplies.map(x => x.uci), ["d4e3"]);
  assert.equal(event.status, "event_available");
  const extra = { ...definition, heldOutPositive: false, recommended: "e8d8", profit: -99 };
  assert.deepEqual(firstReplyEvents(rootFen, c, extra), event);
});
for (const family of ["semantic", "recursive"]) for (const budget of ["depth8", "depth12", "movetime100"])
  for (const width of [2, 4, 8]) for (const eventWidth of ["top8", "all_legal"]) {
    const id = `${family}:${budget}:top${width}:${eventWidth}`;
    test(`${id} executes declared semantic layers and exact cache identity`, async () => {
      const setting = { id, family: family === "semantic" ? "first_reply_reserve_diagnostic" : "recursive_semantic" };
      const cell = { rootId: "synthetic", candidateUci: "e2e4", setting: id, horizon: 4, regime: "cold" };
      const args = { cell, setting, subject, adapter: adapter(), planDigest: sha("synthetic plan") };
      const cold = await executeCostCase(args);
      assert.equal(cold.row.kind, "available"); assert.ok(cold.raw.result.observations.some(x => x.history.length === 4));
      assert.ok(cold.raw.result.selections.some(x => x.history.length === 1));
      assert.ok(cold.raw.result.selections.every(x => x.selected.length === Math.min(width, x.history.length === 1 ?
        enumerateCandidate(rootFen, cell.candidateUci).replyCount : x.events.legal.length)));
      if (family === "recursive") assert.ok(cold.raw.result.selections.some(x => x.history.length === 2)
        && cold.raw.result.selections.some(x => x.history.length === 3));
      else assert.ok(cold.raw.result.selections.every(x => x.history.length === 1));
      assert.ok(cold.row.providerQueries.every(q => q.operands.budget === budget));
      const warm = await executeCostCase({ ...args, cell: { ...cell, regime: "warm" }, initialCache: cold.cache });
      assert.equal(warm.row.kind, "available"); assert.equal(warm.row.cacheHits, cold.row.providerQueries.length);
      assert.deepEqual(warm.raw.result.observations, cold.raw.result.observations);
      const offline = await executeCostCase({ ...args, cell: { ...cell, regime: "provider_offline" } });
      assert.equal(offline.row.kind, "source_unavailable"); assert.equal(offline.raw.result.selections.length, 0);
    });
  }
test("two-ply reserve stops before recursive learner/final-source discovery", async () => {
  const id = "recursive:depth8:top2:all_legal";
  const value = await executeCostCase({ cell: { rootId: "synthetic", candidateUci: "e2e4", setting: id, horizon: 2, regime: "cold" },
    setting: { id, family: "recursive_semantic" }, subject, adapter: adapter(), planDigest: sha("synthetic plan") });
  assert.ok(value.raw.result.selections.every(x => x.history.length === 1));
  assert.ok(value.raw.result.observations.every(x => x.history.length === 2));
});
test("malformed cardinality, legal/rank lists and duplicate events refuse", () => {
  for (const args of [[legal, legal.slice(0, 7), legal, [], 2], [legal, legal.slice(0, 8), legal, ["h8h7"], 2],
    [legal, legal.slice(0, 8), legal, [legal[1], legal[1]], 2], [legal, legal.slice(0, 8), legal, [], 3]])
    assert.throws(() => reserveFirstReply(...args));
});
for (const family of ["semantic", "recursive"]) {
  test(`${family} retains partial observations when a later dependency is unavailable`, async () => {
    const id = `${family}:depth8:top2:top8`, base = adapter(); let calls = 0;
    const source = { sourceDigest, async execute(q) {
      if (++calls === 2) throw new SourceFailure("unavailable", "synthetic later dependency absence");
      return base.execute(q);
    } };
    const value = await executeCostCase({ cell: { rootId: "synthetic", candidateUci: "e2e4", setting: id, horizon: 4, regime: "cold" },
      setting: { id, family: family === "semantic" ? "first_reply_reserve_diagnostic" : "recursive_semantic" },
      subject, adapter: source, planDigest: sha("synthetic plan") });
    assert.equal(value.row.kind, "source_unavailable");
    assert.ok(value.raw.result.observations.some(x => x.history.length === 2));
    assert.ok(value.row.providerQueries.some(x => x.state === "unavailable"));
    assert.equal(value.raw.result.productionProfileSelected, false);
  });
  test(`${family} node exhaustion does not promote its selected frontier to available`, async () => {
    const id = `${family}:depth8:top2:top8`;
    const value = await executeCostCase({ cell: { rootId: "synthetic", candidateUci: "e2e4", setting: id, horizon: 4, regime: "cold" },
      setting: { id, family: family === "semantic" ? "first_reply_reserve_diagnostic" : "recursive_semantic" },
      subject, adapter: adapter(), planDigest: sha("synthetic plan"), nodeCap: 1 });
    assert.equal(value.row.kind, "budget_exhausted");
    assert.ok(value.raw.result.projections.every(x => x.completeness === "budget_exhausted"));
    assert.equal(value.raw.result.observations.length, 1);
  });
}
