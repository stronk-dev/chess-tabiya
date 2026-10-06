import assert from "node:assert/strict";
import test from "node:test";
import { sha } from "./cost-contract.mjs";
import { parseMaiaReceipt } from "./cost-maia.mjs";
import { syntheticMaiaLine } from "./cost-maia-fixture.mjs";
import { SourceFailure } from "./cost-stockfish.mjs";
import { executeCostCase } from "./cost-execution.mjs";
import { checkRawCapture } from "./cost-batch.mjs";
import { selectedPrefix } from "./coherent-horizon-policy.mjs";
import { executeModelFrontier } from "./cost-model.mjs";

const rootFen = "4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1", sourceDigest = sha("synthetic model traversal control");
const piece = (color, role, square) => ({ color, role, square });
const definition = { id: "ep-target", family: "material", target: { attacker: piece("black", "pawn", "d4"), target: piece("white", "pawn", "e2") } };
function adapter({ failAt = Infinity, failure = "unavailable", mutate } = {}) {
  let calls = 0;
  return { sourceDigest, get calls() { return calls; }, admitReceipt: parseMaiaReceipt,
    async execute(operands) {
      if (++calls >= failAt) throw new SourceFailure(failure, "synthetic model source refusal");
      const started = performance.now(), response = JSON.parse(syntheticMaiaLine(operands, calls));
      mutate?.(response);
      const lines = [JSON.stringify(response)], result = parseMaiaReceipt(operands, lines);
      return { operands, lines, result, started, ended: performance.now(), modelName: "synthetic" };
    } };
}
const run = (overrides = {}) => {
  const { id = "maia:prefix0.80", cell, ...args } = overrides;
  return executeCostCase({ cell: { rootId: "synthetic", candidateUci: "e2e4", setting: id, horizon: 4, regime: "cold", ...cell },
    setting: { id, family: "configured_model" }, subject: { rootFen, definitions: [definition] },
    planDigest: sha("synthetic control plan"), adapter: adapter(), ...args });
};
test("exploration prefix includes overshooting move and never widens the frozen eight-move cap", () => {
  assert.deepEqual(selectedPrefix([{ legalUci: "a", mass: 0.55 }, { legalUci: "b", mass: 0.4 }], 0.8).map(x => x.legalUci), ["a", "b"]);
  assert.equal(selectedPrefix(Array.from({ length: 12 }, (_, i) => ({ legalUci: String(i), mass: 1 / 12 })), 0.9).length, 8);
});
for (const id of ["maia:prefix0.80", "maia:prefix0.90"]) test(`${id} executes all three literal-history policy layers`, async () => {
  const source = adapter(), value = await run({ id, adapter: source });
  assert.equal(value.row.kind, "available"); assert.ok(source.calls > 2); assert.equal(checkRawCapture(value), true);
  assert.ok(value.raw.result.observations.some(x => x.history.length === 4));
  assert.deepEqual(new Set(value.row.providerQueries.map(x => x.operands.historyUci.length)), new Set([1, 2, 3]));
  assert.ok(value.row.providerQueries.every(x => x.operands.provider === "maia" && x.operands.rootFen === rootFen && x.operands.historyUci[0] === "e2e4"));
  const f = value.raw.result.modelFrontier;
  assert.equal(f.coverage.complete, true); assert.equal(f.coverage.observedLayerMasses.length, 3);
  for (const edge of f.edges) {
    const parent = f.nodes.find(x => JSON.stringify(x.history) === JSON.stringify(edge.history.slice(0, -1)));
    assert.equal(edge.jointMass, parent.parentJointMass * edge.conditionalMass);
  }
  assert.ok(f.nodes.every(x => x.selected.length <= 8));
  assert.equal(value.raw.result.moveReason, "not_an_engine_reason");
});
test("horizon two stops before either deeper model layer and carries no borrowed joint coverage", async () => {
  const source = adapter(), v = await run({ adapter: source, cell: { horizon: 2 } });
  assert.equal(source.calls, 1); assert.ok(v.raw.result.observations.every(x => x.history.length === 2));
  assert.equal(v.raw.result.modelFrontier.coverage.observedLayerMasses.length, 1);
});
test("matching warm dependencies re-execute model observations/compilation without source calls", async () => {
  const source = adapter(), cold = await run({ adapter: source }), calls = source.calls;
  const warm = await run({ adapter: source, cell: { regime: "warm" }, initialCache: cold.cache });
  assert.equal(source.calls, calls); assert.equal(warm.row.cacheHits, cold.row.providerQueries.length);
  assert.deepEqual(warm.raw.result.observations, cold.raw.result.observations);
  assert.deepEqual(warm.raw.result.modelFrontier.edges, cold.raw.result.modelFrontier.edges);
  assert.equal(checkRawCapture(warm), true);
});
test("offline is unknown coverage, not empty/zero model support", async () => {
  const source = adapter(), v = await run({ adapter: source, cell: { regime: "provider_offline" } });
  assert.equal(source.calls, 0); assert.equal(v.row.kind, "source_unavailable");
  assert.equal(v.raw.result.modelFrontier.nodes[0].selected, null);
  assert.equal(v.raw.result.modelFrontier.coverage.frontierMass, null);
  assert.equal(v.raw.result.modelFrontier.coverage.stopRule.status, "partial_traversal_abstain");
});
for (const failure of ["unavailable", "invalid", "timed_out"]) test(`later ${failure} keeps witnessed paths without complete coverage`, async () => {
  const v = await run({ adapter: adapter({ failAt: 2, failure }) });
  assert.equal(v.row.kind, { unavailable: "source_unavailable", invalid: "invalid_source", timed_out: "budget_exhausted" }[failure]);
  assert.ok(v.raw.result.observations.length > 0);
  assert.equal(v.raw.result.modelFrontier.coverage.complete, false);
  assert.equal(v.raw.result.modelFrontier.coverage.frontierMass, null);
});
test("node exhaustion preserves selected-but-unvisited omissions and cannot satisfy joint coverage", async () => {
  const v = await run({ nodeCap: 1 }); assert.equal(v.row.kind, "budget_exhausted");
  assert.equal(v.raw.result.modelFrontier.edges.length, 1);
  assert.equal(v.raw.result.modelFrontier.coverage.frontierMass, null);
  assert.ok(v.raw.result.modelFrontier.nodes.some(x => x.selected.length > 1));
});
test("targets share actual policy queries while keeping exact target-bound observations", async () => {
  const source = adapter(), v = await run({ adapter: source, subject: { rootFen, definitions: [definition, { ...definition, id: "second" }] } });
  assert.equal(source.calls, v.raw.result.modelFrontier.nodes.length);
  assert.equal(v.raw.result.observations.length, v.raw.result.modelFrontier.edges.length * 2);
});
test("absorbing candidate carries unit mass without invented model queries", async () => {
  const source = adapter();
  const target = { id: "mate-control", family: "material", target: { attacker: piece("black", "king", "h8"), target: piece("white", "queen", "g6") } };
  const v = await run({ adapter: source, cell: { candidateUci: "g6g7" }, subject: { rootFen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", definitions: [target] } });
  assert.equal(v.row.kind, "absorbing_terminal"); assert.equal(source.calls, 0);
  assert.deepEqual(v.raw.result.modelFrontier.coverage.observedLayerMasses, [1, 1, 1]);
  assert.equal(v.raw.result.modelFrontier.coverage.stopRule.status, "joint_rule_satisfied");
});
test("synthetic early terminal branch carries mass to the remaining layer without a policy query", async () => {
  const histories = [], seen = [];
  const frontier = await executeModelFrontier({ rootFen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    candidateUci: "g6h6", horizon: 4, threshold: 0.8, sourceDigest,
    collect: fn => fn(), visit: () => true, observe: history => seen.push(history),
    dependencies: { async query(q) {
      histories.push(q.historyUci);
      return { state: "executed", result: { configuredSupport: [{
        legalUci: q.historyUci.length === 1 ? "h8g8" : "h6g7", mass: 1,
      }] } };
    } } });
  assert.deepEqual(histories.map(x => x.length), [1, 2]);
  assert.equal(frontier.edges.at(-1).terminalReason, "CHECKMATE");
  assert.deepEqual(frontier.coverage.observedLayerMasses, [1, 1, 1]);
  assert.equal(frontier.coverage.stopRule.status, "joint_rule_satisfied");
  assert.equal(seen.length, 2);
});
test("no-target candidate is retained without a manufactured policy or coverage claim", async () => {
  const source = adapter(), v = await run({ adapter: source, subject: { rootFen, definitions: [] } });
  assert.equal(v.row.kind, "no_target"); assert.equal(source.calls, 0);
  assert.equal(v.raw.result.modelFrontier.coverage.status, "not_requested_no_target");
});
test("original floating-point hash inputs are retained, not regenerated by another serializer", async () => {
  const v = await run();
  for (const mutate of [x => { delete x.rawLiteral; }, x => { x.receiptLiterals.pop(); }, x => { x.rawLiteral += " "; }]) {
    const changed = structuredClone({ row: v.row, raw: v.raw, rawLiteral: v.rawLiteral, receiptLiterals: v.receiptLiterals });
    mutate(changed); assert.throws(() => checkRawCapture(changed));
  }
});
