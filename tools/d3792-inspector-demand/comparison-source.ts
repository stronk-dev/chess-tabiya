// DISPOSABLE D3820 source-boundary experiment, not a scoped factory, access grant or HTTP/UI.
import assert from "node:assert/strict";
import { createRun, canonicalRunStart, commitMove, rewind, fork, revealFeedback, branchPath,
  compareBranches, attachEvidence, reachCheckpoint, transitionObjective, structuralReading, readBackReplay,
  observationIdentity, type BranchComparison, type DrillRun, type StructuralObservation,
} from "../../packages/runtime/src/index.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import type { RunEvidenceItem } from "../../packages/runtime/src/evidence-factories.js";
import { evidenceValueReceipt, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { STORY_PIVOT_CP } from "../../packages/runtime/src/story.js";
const at = "2026-10-14T00:00:00.000Z";
type ResearchCompare = (run: DrillRun, branches: readonly string[], options: { researchThroughNodeIds: readonly string[] }) => BranchComparison;
// The extra argument exists only in the guarded transpiled candidate; this is not production typing.
const scoped = compareBranches as ResearchCompare;
let checks = 0, requests = 0, legacyLaterItems = 0, boundedStructuralItems = 0;
let boundedEvalDeltaItems = 0, oldArmScopeCollisions = 0, invalidOriginalFens = 0, terminalReplayRefusals = 0;
const structuralExperiment = process.argv[2] === "structural";
function check(callback: () => void) { callback(); checks++; }
// Scope oracle only, not a validation oracle for the underlying chess predicates:
// derive the complete population from BOTH explicit prefixes before their intersection.
function expectedStructure(paths: readonly (readonly DrillRun["nodes"][number][])[], index: number, forkId: string) {
  const fork = paths[0]!.find(node => node.id === forkId)!;
  const features = paths.map(path => path.map(node => ({ node, values: structuralReading(node.fen).features })));
  const populations = features.map(path => new Set(path.filter(value => value.node.ply > fork.ply).flatMap(value => value.values.map(observationIdentity))));
  const common = new Set([...populations[0]!].filter(key => populations.slice(1).every(population => population.has(key))));
  const result: { nodeId: string; plyOffset: number; observation: StructuralObservation }[] = [];
  let previous = new Set<string>();
  for (const value of features[index]!.filter(value => value.node.ply >= fork.ply)) {
    if (value.node.id !== forkId) for (const observation of value.values)
      if (!previous.has(observationIdentity(observation)) && !common.has(observationIdentity(observation)))
        result.push({ nodeId: value.node.id, plyOffset: value.node.ply - fork.ply, observation });
    previous = new Set(value.values.map(observationIdentity));
  }
  return result;
}
// Scope oracle from actual original events, not the candidate BranchComparison's claimed trail.
// Reuses the current scalar convention deliberately; this is not engine/chess qualification.
function expectedEvalDeltas(run: DrillRun, path: readonly DrillRun["nodes"][number][], forkId: string) {
  const forkPly = path.find(node => node.id === forkId)!.ply;
  const trail = run.events.flatMap(event => {
    if (event.type !== "evidence.attached" || event.data.payload.kind !== "eval" || event.data.payload.source !== "engine_validated") return [];
    const node = path.find(value => value.id === event.data.nodeId);
    if (!node || node.ply < forkPly) return [];
    const values = event.data.payload.values;
    return [{ plyOffset: node.ply - forkPly, cp: Number.isSafeInteger(values.centipawns) ? values.centipawns as number : null }];
  }).sort((left, right) => left.plyOffset - right.plyOffset);
  return trail.flatMap((after, index) => {
    const before = trail[index - 1];
    return before?.cp !== null && before?.cp !== undefined && after.cp !== null && Math.abs(after.cp - before.cp) >= STORY_PIVOT_CP
      ? [{ delta: after.cp - before.cp, plyOffset: after.plyOffset }] : [];
  });
}
function fixture(black: boolean, terminal: boolean) {
  const fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${black ? "b" : "w"} KQkq - 0 1`;
  let run = createRun({ id: `d3820-${black}-${terminal}`, session: { kind: "position",
    start: canonicalRunStart({ fen, side: black ? "black" : "white" }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"d".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  const main = run.activeCursor.branchId;
  const moves = terminal ? black ? ["f7f6", "e2e4", "g7g5", "d1h5"] : ["f2f3", "e7e5", "g2g4", "d8h4"]
    : black ? ["e7e5", "e2e4", "g8f6", "b1c3", "d7d5", "e4d5"] : ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4"];
  for (const move of moves) run = commitMove(run, move, { at }).run;
  const mainPath = branchPath(run, main), shared = mainPath[terminal ? 1 : 2]!;
  // Explicit recorded test evidence, not live Stockfish, and a simulated authored checkpoint.
  run = attachEvidence(run, mainPath[3]!.id, ["fixture:early-eval"], { kind: "eval", source: "engine_validated", values: { centipawns: 20 } }, at).run;
  run = attachEvidence(run, mainPath.at(-1)!.id, ["fixture:later-eval"], { kind: "eval", source: "engine_validated", values: { centipawns: 400 } }, at).run;
  run = attachEvidence(run, mainPath.at(-1)!.id, ["fixture:later-line"], { kind: "bestline", source: "engine_validated", values: { moves: [] } }, at).run;
  run = reachCheckpoint(run, "fixture:later-checkpoint", at).run;
  if (!terminal) run = transitionObjective(run, "preserved", ["fixture:objective"], at).run;
  run = rewind(run, shared.id, at, undefined, main).run;
  run = fork(run, shared.id, { at }).run;
  const peer = run.activeCursor.branchId;
  const peerMoves = terminal ? black ? ["e2e3", "e7e5", "b2b3"] : ["e7e6", "e2e4", "b7b6"]
    : black ? ["f8c5", "g1f3"] : ["f1c4", "g8f6"];
  for (const move of peerMoves) run = commitMove(run, move, { at }).run;
  run = revealFeedback(run, at).run;
  return { run, main, peer, shared, mainPath: branchPath(run, main), peerPath: branchPath(run, peer) };
}
for (const black of [false, true]) for (const terminal of [false, true]) {
  const value = fixture(black, terminal), { run, main, peer, shared, mainPath, peerPath } = value;
  const original = JSON.stringify(run), selected = mainPath[3]!.id, peerSelected = peerPath.at(-2)!.id;
  const first = scoped(run, [main, peer], { researchThroughNodeIds: [selected, peerSelected] });
  if (process.argv[2] === "baseline") assert.equal(first.columns[0]!.leafNodeId, selected,
    "whole-tip comparison is not requested-prefix acquisition");
  const whole = compareBranches(run, [main, peer]);
  const oldInputScopes = new Map<string, string>();
  check(() => assert.deepEqual(scoped(run, [main, peer], { researchThroughNodeIds: [mainPath.at(-1)!.id, peerPath.at(-1)!.id] }), whole));
  if (structuralExperiment) for (const [index, branchId] of [main, peer].entries()) {
    const items = invokeEvidenceValueRoute("derived.compare.structure_delta@1", { run, comparison: whole, branchId }) as readonly RunEvidenceItem<{ observation: StructuralObservation }>[];
    check(() => assert.deepEqual(items.map(item => ({ nodeId: item.nodeId, plyOffset: item.plyOffset, observation: item.evidence.payload.observation })),
      expectedStructure([mainPath, peerPath], index, whole.forkNodeId)));
  }
  for (let left = mainPath.findIndex(node => node.id === shared.id); left < mainPath.length; left++) {
    for (let right = peerPath.findIndex(node => node.id === shared.id); right < peerPath.length; right++) {
      const endpoints = [mainPath[left]!.id, peerPath[right]!.id];
      const result = scoped(run, [main, peer], { researchThroughNodeIds: endpoints });
      requests++;
      check(() => {
        assert.deepEqual(result.columns.map(column => column.branchId), [main, peer]);
        assert.deepEqual(result.columns.map(column => column.leafNodeId), endpoints);
        for (const [index, path] of [mainPath.slice(0, left + 1), peerPath.slice(0, right + 1)].entries()) {
          const id = index === 0 ? main : peer, allowed = new Set(path.map(node => node.id));
          for (const row of result.rows) if (row.nodes[id]) assert(allowed.has(row.nodes[id]!.id));
          for (const collection of [result.objectiveTimelines[id]!, result.checkpointHits[id]!, result.evidence[id]!, result.lines[id]!])
            for (const item of collection) assert(allowed.has(item.nodeId));
          assert.equal(result.consequences[id]!.plies, path.filter(node => node.ply > shared.ply).length);
          const outcome = [...run.events].reverse().find(event => event.type === "outcome.reached" && allowed.has(event.data.nodeId) && path.find(node => node.id === event.data.nodeId)!.ply > shared.ply);
          assert.deepEqual(result.consequences[id]!.outcome, outcome?.type === "outcome.reached" ? outcome.data.outcome : null);
        }
      });
      for (const [index, branchId] of [main, peer].entries()) {
        const path = index === 0 ? mainPath.slice(0, left + 1) : peerPath.slice(0, right + 1);
        const values = invokeEvidenceValueRoute("derived.compare.eval_delta@1", { run, comparison: result, branchId }) as readonly DeclaredEvidence<{ delta: number; plyOffset: number }>[];
        check(() => assert.deepEqual(values.map(value => value.payload), expectedEvalDeltas(run, path, result.forkNodeId)));
        boundedEvalDeltaItems += values.length;
        for (const value of values) {
          const input = evidenceValueReceipt(value).inputDigest;
          const scope = JSON.stringify({ columns: [main, peer], endpoints, branchId });
          const previous = oldInputScopes.get(input);
          if (previous !== undefined && previous !== scope) oldArmScopeCollisions++;
          else oldInputScopes.set(input, scope);
        }
      }
      if (structuralExperiment) for (const [index, branchId] of [main, peer].entries()) {
        const allowed = new Set((index === 0 ? mainPath.slice(0, left + 1) : peerPath.slice(0, right + 1)).map(node => node.id));
        const items = invokeEvidenceValueRoute("derived.compare.structure_delta@1", { run, comparison: result, branchId }) as readonly RunEvidenceItem<{ observation: StructuralObservation }>[];
        check(() => {
          for (const item of items) assert(allowed.has(item.nodeId));
          assert.deepEqual(items.map(item => ({ nodeId: item.nodeId, plyOffset: item.plyOffset, observation: item.evidence.payload.observation })),
            expectedStructure([mainPath.slice(0, left + 1), peerPath.slice(0, right + 1)], index, result.forkNodeId));
        });
        boundedStructuralItems += items.length;
      }
    }
  }
  check(() => {
    assert(first.checkpointHits[main]!.every(hit => hit.nodeId !== mainPath.at(-1)!.id));
    assert(first.evidence[main]!.every(item => item.nodeId !== mainPath.at(-1)!.id));
    assert(first.lines[main]!.every(item => item.nodeId !== mainPath.at(-1)!.id));
    assert(first.objectiveTimelines[main]!.every(item => item.nodeId !== mainPath.at(-1)!.id));
    assert(whole.lines[main]!.length > 0);
    if (!terminal) assert(whole.objectiveTimelines[main]!.length > 0);
    if (terminal) { assert(whole.consequences[main]!.outcome); assert.equal(first.consequences[main]!.outcome, null); }
  });
  const swapped = scoped(run, [peer, main], { researchThroughNodeIds: [peerSelected, selected] });
  check(() => assert.deepEqual(swapped.columns.map(column => column.branchId), [peer, main]));
  // D3842: a parser-admitted stored replay is not proof that every original FEN is valid.
  // The corrupt node is later than the requested endpoint, in either original column.
  for (const path of [mainPath, peerPath]) for (const fen of ["not-a-fen", "8/8/8/8/8/8/8/8 w - - 0 1"]) {
    const later = path.at(-1)!.id;
    const events = run.events.map(event => event.type === "move.committed" && event.data.node.id === later
      ? { ...event, data: { ...event.data, node: { ...event.data.node, fen } } } : event);
    // Terminal-event replay already checks its referenced final FEN; do not claim those
    // refused images were admitted source inputs. Non-terminal and peer images still exercise it.
    if (run.events.some(event => event.type === "outcome.reached" && event.data.nodeId === later)) {
      check(() => assert.throws(() => readBackReplay(events)));
      terminalReplayRefusals++;
      continue;
    }
    const damaged = readBackReplay(events).run;
    const damagedBytes = JSON.stringify(damaged);
    for (const branch of [main, peer]) check(() => assert(branchPath(damaged, branch).length > 1));
    const legacy = compareBranches(damaged, [main, peer]);
    check(() => assert.throws(() => invokeEvidenceValueRoute("derived.compare.structure_delta@1",
      { run: damaged, comparison: legacy, branchId: main }), "the original whole-path source must actually refuse"));
    Reflect.set(globalThis, "__d3842StructuralReads", 0);
    check(() => assert.throws(() => scoped(damaged, [main, peer], { researchThroughNodeIds: [selected, peerSelected] }),
      "D3842 original-path FEN must refuse before comparison narrowing"));
    check(() => assert.equal(Reflect.get(globalThis, "__d3842StructuralReads"), 0));
    if (structuralExperiment) {
      Reflect.set(globalThis, "__d3842StructuralReads", 0);
      check(() => assert.throws(() => invokeEvidenceValueRoute("derived.compare.structure_delta@1",
        { run: damaged, comparison: first, branchId: main }), "D3842 the structural owner must preserve original FEN refusal"));
      check(() => assert.equal(Reflect.get(globalThis, "__d3842StructuralReads"), 0));
    }
    check(() => assert.equal(JSON.stringify(damaged), damagedBytes));
    invalidOriginalFens++;
  }
  for (const action of [() => scoped(run, [main, peer], { researchThroughNodeIds: [selected] }),
    () => scoped(run, [main, peer], { researchThroughNodeIds: [peerSelected, selected] }),
    () => scoped(run, [main, peer], { researchThroughNodeIds: [selected, run.nodes[0]!.id] }),
    () => scoped(run, [main, main], { researchThroughNodeIds: [selected, selected] }),
    () => scoped({ ...run, nodes: [...run.nodes, mainPath.at(-1)!] }, [main, peer], { researchThroughNodeIds: [selected, peerSelected] }),
    () => scoped({ ...run, nodes: run.nodes.map(node => node.id === mainPath.at(-1)!.id ? { ...node, parentId: node.id } : node) }, [main, peer], { researchThroughNodeIds: [selected, peerSelected] }),
    () => scoped({ ...run, nodes: run.nodes.map(node => node.id === mainPath.at(-1)!.id ? { ...node, parentId: "missing-later-parent" } : node) }, [main, peer], { researchThroughNodeIds: [selected, peerSelected] }),
    () => scoped(run, [main, peer], { researchThroughNodeIds: ["not-a-node", peerSelected] }),
    () => scoped(run, [main, "not-a-branch"], { researchThroughNodeIds: [selected, peerSelected] })]) check(() => assert.throws(action));
  // Crucial non-closure: legacy factories still recompute the full original path, not this grant.
  if (!terminal && !structuralExperiment) {
    const items = invokeEvidenceValueRoute("derived.compare.structure_delta@1", { run, comparison: first, branchId: main }) as readonly RunEvidenceItem<unknown>[];
    const prefix = new Set(mainPath.slice(0, 4).map(node => node.id));
    const later = items.filter(item => !prefix.has(item.nodeId));
    check(() => assert(later.length > 0, "the legacy-factory boundary must have an actual later observation"));
    legacyLaterItems += later.length;
  }
  check(() => assert.equal(JSON.stringify(run), original));
}
if (structuralExperiment) assert(boundedStructuralItems > 0, "source-side narrowing cannot pass by returning an empty population");
else assert(legacyLaterItems > 0);
assert(boundedEvalDeltaItems > 0, "eval scope cannot pass using only empty populations");
assert(oldArmScopeCollisions > 0, "old full-tip input arms must not be mistaken for endpoint-bound source identity");
assert.equal(invalidOriginalFens, 12);
assert.equal(terminalReplayRefusals, 4);
console.log(JSON.stringify({ scope: "D3820 disposable source-owner prefix algorithm; NOT scoped factories, authorization, production types or HTTP/native proof",
  legalFixtures: 4, prefixPairs: requests, checks, actualMateOutcomesBounded: true, retainedOriginalGraph: true,
  recordedProviderFixtures: "synthetic eval/checkpoint controls, not live providers or qualification", legacyLaterItems,
  legacyFactoriesInProductionStillUnscoped: true, sourceOwnerStructuralExperiment: structuralExperiment,
  boundedStructuralItems, boundedEvalDeltaItems, oldArmScopeCollisions,
  invalidOriginalFens, terminalReplayRefusals, originalFenRefusalBeforeDetectors: true,
  oldArmIdentityIsNotScopedAuthority: true, savedBytesUnchanged: true }));
