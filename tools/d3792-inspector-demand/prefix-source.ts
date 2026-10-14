// DISPOSABLE D3815: actual compiler/window/factories over a prefix of the ORIGINAL run.
// Bundled source variant only; NOT a new production API, receipt or qualified semantic subject.
import assert from "node:assert/strict";
import { commitMove, rewind, fork, branchPath,
  recordedSemanticPathExecution, assertDeclaredEvidence, type DrillRun } from "../../packages/runtime/src/index.js";
import { evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../packages/runtime/src/semantic-validation.js";
import { RECORDED_SEQUENCE_POSITIVES } from "../../packages/runtime/src/testing/recorded-sequence-fixtures.js";
import { RECORDED_SOURCE_CASES as families, recordedSourceRun as recorded } from "./recorded-source-cases.js";
import type { RecordedSemanticPathExecution, RecordedPathWindowReceipt } from "../../packages/runtime/src/recorded-semantic-path.js";
import type { SemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";

type PrefixExecution = Omit<RecordedSemanticPathExecution, "result"> & { readonly result:
  | (Extract<RecordedSemanticPathExecution["result"], { kind: "available" }> & {
    readonly researchScope: Readonly<{ protocol: "research.recorded-prefix@0"; throughNodeId: string }>;
  })
  | Readonly<{ kind: "refused"; reason: string }> };
const at = "2026-10-14T00:00:00.000Z";
function prefix(run: DrillRun, branchId: string, throughNodeId: string): PrefixExecution {
  // Deliberately not an accepted public signature: only the guarded research bundle handles it.
  return Reflect.apply(recordedSemanticPathExecution, undefined, [run, branchId,
    { preparation: "exact", researchThroughNodeId: throughNodeId }]) as PrefixExecution;
}
const mode = process.argv[2];
assert(mode === "baseline" || mode === "candidate");
const first = recorded("d3815-first", RECORDED_SEQUENCE_POSITIVES[0]!.fen, RECORDED_SEQUENCE_POSITIVES[0]!.moves);
const firstPath = branchPath(first, first.activeCursor.branchId);
if (mode === "baseline") {
  // The unchanged operation ignores the extra JS option and computes the whole branch.
  const result = prefix(first, first.activeCursor.branchId, firstPath[0]!.id);
  assert.equal(result.work.preparedEdges, 0, "whole-tip source is not prefix acquisition");
  throw new Error("baseline unexpectedly behaved like a scoped supplier");
}
let runs = 0, prefixes = 0, events = 0, insufficient = 0, graphRefusals = 0, checks = 0;
const positiveRefs = new Set<string>();
for (const [fixtureIndex, fixture] of families.entries()) {
  for (const mirrored of [false, true]) {
    const fen = mirrored ? mirrorSemanticFen(fixture.fen, "color_and_vertical") : fixture.fen;
    const moves = mirrored ? fixture.moves.map(move => mirrorSemanticUci(move, "color_and_vertical")) : fixture.moves;
    const run = recorded(`d3815-${fixtureIndex}-${mirrored}`, fen, moves);
    const branchId = run.activeCursor.branchId, path = branchPath(run, branchId), saved = JSON.stringify(run);
    const full = recordedSemanticPathExecution(run, branchId);
    assert.equal(full.result.kind, "available");
    if (full.result.kind !== "available") assert.fail("canonical whole source refused");
    const finalEvents = full.result.events.filter(event => event.projection.id === fixture.projection && event.anchor.nodeId === path.at(-1)!.id);
    assert.equal(finalEvents.length > 0, fixture.emits, `actual family control ${fixtureIndex}/${mirrored} changed`);
    if (fixture.emits) positiveRefs.add(fixture.projection);
    for (let end = 0; end < path.length; end++) {
      const endpoint = path[end]!.id;
      const actual = prefix(run, branchId, endpoint);
      assert.equal(actual.result.kind, "available");
      if (actual.result.kind !== "available") assert.fail(`prefix ${endpoint} refused`);
      const scoped = actual.result;
      assert.deepEqual(scoped.researchScope, { protocol: "research.recorded-prefix@0", throughNodeId: endpoint });
      assert.deepEqual(scoped.pathNodeIds, path.slice(0, end + 1).map(node => node.id));
      assert.equal(actual.work.preparedEdges, end, "source prepared an edge after the grant");
      assert.equal(actual.work.transitionCompiles, end, "source ran semantic preparation outside the grant");
      const allowed = new Set(scoped.pathNodeIds);
      const eligibleWindows: readonly RecordedPathWindowReceipt[] = full.result.windows.filter(window => window.endNodeId !== null && allowed.has(window.endNodeId));
      const wanted = new Set<string>(eligibleWindows.flatMap(window => window.eventIds));
      const expectedEvents: readonly SemanticEvidenceEvent[] = full.result.events.filter(event => wanted.has(event.id));
      assert.deepEqual(scoped.events, expectedEvents, "bounded execution changed or borrowed a complete source witness");
      assert.deepEqual(scoped.windows.filter(window => window.endNodeId !== null), eligibleWindows);
      for (const window of scoped.windows) {
        assert(allowed.has(window.startNodeId));
        if (window.endNodeId === null) {
          assert.equal(window.status, "insufficient_continuation"); assert.deepEqual(window.eventIds, []); insufficient++;
        } else assert(allowed.has(window.endNodeId));
      }
      for (const event of scoped.events) {
        assertDeclaredEvidence(event.evidence); assert(evidenceValueReceipt(event.evidence)); events++;
      }
      if (end === path.length - 1) {
        assert.deepEqual(scoped.events, full.result.events);
        assert.deepEqual(scoped.windows, full.result.windows);
        assert.deepEqual(scoped.conventionReceipt, full.result.conventionReceipt);
        assert.notEqual(scoped.digest, full.result.digest, "prototype scope reused a production whole-branch identity");
      }
      assert.equal(JSON.stringify(run), saved); prefixes++;
    }
    // Graph corruption AFTER an early endpoint must not disappear through pre-validation clipping.
    const early = path[0]!.id, tip = path.at(-1)!;
    for (const [invalid, reason] of [
      [{ ...run, nodes: [...run.nodes, tip] }, "duplicate_node_id"],
      [{ ...run, nodes: run.nodes.map(node => node.id === tip.id ? { ...node, parentId: "missing" } : node) }, "missing_parent"],
      [{ ...run, nodes: run.nodes.map(node => node.id === tip.id ? { ...node, parentId: node.id } : node) }, "parent_cycle"],
    ] as const) {
      const refused = prefix(invalid, branchId, early);
      assert.equal(refused.result.kind, "refused");
      if (refused.result.kind === "refused") assert.equal(refused.result.reason, reason);
      assert.equal(refused.work.preparedEdges, 0); graphRefusals++;
    }
    runs++;
  }
}

// Full run and exact nodes remain in scope even when the selected branch inherits another's prefix.
let branches = recorded("d3815-branches", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4"]);
const main = branches.activeCursor.branchId, mainPath = branchPath(branches, main), shared = mainPath[2]!.id;
branches = rewind(branches, shared, at).run; branches = fork(branches, shared, { at }).run;
const child = branches.activeCursor.branchId;
for (const move of ["f1c4", "g8f6"]) branches = commitMove(branches, move, { at }).run;
const inherited = prefix(branches, child, shared);
assert.equal(inherited.result.kind, "available");
if (inherited.result.kind === "available") {
  assert.equal(inherited.result.branchId, child);
  assert.deepEqual(inherited.result.pathNodeIds, mainPath.slice(0, 3).map(node => node.id));
}
assert.equal(inherited.work.preparedEdges, 2); checks++;
const offBranch = prefix(branches, child, mainPath[3]!.id);
assert.equal(offBranch.result.kind, "refused");
if (offBranch.result.kind === "refused") assert.equal(offBranch.result.reason, "research_endpoint_not_on_branch");
assert.equal(offBranch.work.preparedEdges, 0); checks++;
const unknown = prefix(branches, "missing", shared);
assert.equal(unknown.result.kind, "refused");
if (unknown.result.kind === "refused") assert.equal(unknown.result.reason, "unknown_branch"); checks++;
assert.equal(positiveRefs.size, 11, "not every canonical recorded family has a positive");
console.log(JSON.stringify({ scope: "D3815 original-source prefix prototype; NOT a production operation, receipt or qualification",
  runs, prefixes, events, insufficientContinuations: insufficient, graphRefusals, branchControls: checks,
  canonicalPositiveFamilies: positiveRefs.size, preparationNeverPassesEndpoint: true,
  exactCompleteWindowsAndValueReceipts: true, prototypeIdentitySeparate: true, providerOrHTTPProof: false }));
