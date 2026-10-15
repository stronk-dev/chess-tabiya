// DISPOSABLE D3820 source-boundary experiment, not a scoped factory, access grant or HTTP/UI.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRun, canonicalRunStart, commitMove, rewind, fork, revealFeedback, branchPath,
  compareBranches, attachEvidence, reachCheckpoint, transitionObjective, structuralReading, readBackReplay,
  observationIdentity, STRUCTURAL_FEATURE_KINDS, type BranchComparison, type DrillRun, type StructuralObservation,
} from "../../packages/runtime/src/index.js";
import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import type { RunEvidenceItem } from "../../packages/runtime/src/evidence-factories.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
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
function expectedStructure(paths: readonly (readonly DrillRun["nodes"][number][])[], index: number, forkId: string,
  readFeatures: (fen: string) => readonly StructuralObservation[] = fen => structuralReading(fen).features) {
  const fork = paths[0]!.find(node => node.id === forkId)!;
  const features = paths.map(path => path.map(node => ({ node, values: readFeatures(node.fen) })));
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
// D3847: reconstruct the entire observation population from actual named factories. Empty
// family results remain explicit rows in this experiment, NOT fabricated sealed absence facts.
const structuralRefs = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.compare.structure_delta")!.derivation!.inputs!;
// Domain-table consistency only; this is NOT a collection/reduction implementation.
const sourceDraft = readFileSync("rfc/evidence-value-authority.md", "utf8");
function checkStructuralFamilyTable(text: string) {
  const table = text.split("| rules.structural.reading suffix | Exact version |")[1]!.split("\n\n")[0]!;
  const refs = [...table.matchAll(/^\| ([a-z_]+) \| ([1-9][0-9]*) \|$/gmu)]
    .map(row => ({ id: `rules.structural.reading.${row[1]!}`, version: Number(row[2]) }));
  assert.deepEqual(refs, structuralRefs, "the draft must keep the actual ordered exact17-family vocabulary");
}
checkStructuralFamilyTable(sourceDraft);
assert.throws(() => checkStructuralFamilyTable(sourceDraft.replace("| named_structure | 2 |", "| named_structure | 1 |")));
assert.throws(() => checkStructuralFamilyTable(sourceDraft.replace("| outpost | 1 |\n", "")));
const sourcePopulations = new Map<string, { features: readonly StructuralObservation[]; sizes: readonly number[] }>();
function sourceFeatures(fen: string): readonly StructuralObservation[] {
  const known = sourcePopulations.get(fen);
  if (known) return known.features;
  const populations = structuralRefs.map(ref => {
    const values = invokeEvidenceValueRoute(`${ref.id}@${ref.version}` as EvidenceValueRoute, { fen }) as readonly DeclaredEvidence<unknown>[];
    return values.map(value => {
      assertDeclaredEvidence(value); assert.deepEqual(value.projection, ref);
      assert.equal(evidenceValueReceipt(value).inputDigest, evidenceDigest({ fen }));
      if (ref.id === "rules.structural.reading.named_structure") {
        const payload = value.payload as { id: string; name: string; squares: StructuralObservation["squares"]; provenanceNote: string };
        assert.equal(typeof payload.id, "string"); assert.equal(typeof payload.name, "string");
        // Closed legacy observation projection: no id/name fields are silently appended.
        return { kind: "named_structure", squares: payload.squares, provenanceNote: payload.provenanceNote } as StructuralObservation;
      }
      return value.payload as StructuralObservation;
    });
  });
  const features = populations.flat().sort((a, b) => STRUCTURAL_FEATURE_KINDS.indexOf(a.kind) - STRUCTURAL_FEATURE_KINDS.indexOf(b.kind)
    || JSON.stringify(a).localeCompare(JSON.stringify(b)));
  assert.deepEqual(features, structuralReading(fen).features, "complete sealed-family reconstruction must preserve legacy observation bytes/order");
  sourcePopulations.set(fen, { features, sizes: populations.map(values => values.length) });
  return features;
}
let sourceReconstructionCases = 0, peerExtensionSuppressions = 0, laterPeerSuppressions = 0, repeatedAppearanceItems = 0;
const structuralInputCounts = new Set<number>();
const entryKey = (entry: { nodeId: string; observation: StructuralObservation }) => `${entry.nodeId}|${observationIdentity(entry.observation)}`;
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
  const peerPrefixes = new Map<number, Set<string>>();
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
        check(() => assert.deepEqual(items.map(item => ({ nodeId: item.nodeId, plyOffset: item.plyOffset, observation: item.evidence.payload.observation })),
          expectedStructure([mainPath.slice(0, left + 1), peerPath.slice(0, right + 1)], index, result.forkNodeId, sourceFeatures)));
        for (const item of items) structuralInputCounts.add(evidenceValueReceipt(item.evidence).sourceDigests.length);
        sourceReconstructionCases++;
        if (index === 0) {
          const keys = new Set(items.map(item => entryKey({ nodeId: item.nodeId, observation: item.evidence.payload.observation })));
          const previous = peerPrefixes.get(left);
          if (previous) {
            const removed = [...previous].filter(key => !keys.has(key));
            peerExtensionSuppressions += removed.length;
            if (right > peerPath.findIndex(node => node.id === shared.id) + 1)
              laterPeerSuppressions += removed.filter(key => {
                const node = mainPath.find(node => key.startsWith(`${node.id}|`))!;
                return peerPath[right]!.ply > node.ply;
              }).length;
          }
          peerPrefixes.set(left, keys);
        }
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
if (structuralExperiment) {
  // A genuine appearance/disappearance/reappearance is not a first-ever occurrence selector.
  let run = createRun({ id: "d3847-reappearance", session: { kind: "position",
    start: canonicalRunStart({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" }),
    feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"e".repeat(64)}`, seed: 1, createdAt: at,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  const main = run.activeCursor.branchId, root = run.activeCursor.nodeId;
  for (const move of ["g1f3", "g8f6", "f3g1", "f6g8", "g1f3"]) run = commitMove(run, move, { at }).run;
  run = rewind(run, root, at).run; run = fork(run, root, { at }).run;
  const peer = run.activeCursor.branchId;
  for (const move of ["b1c3", "b8c6"]) run = commitMove(run, move, { at }).run;
  run = revealFeedback(run, at).run;
  const comparison = compareBranches(run, [main, peer]);
  const items = invokeEvidenceValueRoute("derived.compare.structure_delta@1", { run, comparison, branchId: main }) as readonly RunEvidenceItem<{ observation: StructuralObservation }>[];
  check(() => assert.deepEqual(items.map(item => ({ nodeId: item.nodeId, plyOffset: item.plyOffset, observation: item.evidence.payload.observation })),
    expectedStructure([branchPath(run, main), branchPath(run, peer)], 0, comparison.forkNodeId, sourceFeatures)));
  const seen = new Set<string>();
  for (const item of items) { const key = observationIdentity(item.evidence.payload.observation); if (seen.has(key)) repeatedAppearanceItems++; seen.add(key); }
  assert(repeatedAppearanceItems > 0, "actual legacy selection must retain genuine repeated appearances");
  const mainPath = branchPath(run, main);
  assert(items.some(first => items.some(last => first.nodeId !== last.nodeId
    && observationIdentity(first.evidence.payload.observation) === observationIdentity(last.evidence.payload.observation)
    && mainPath.some(node => node.ply > run.nodes.find(node => node.id === first.nodeId)!.ply
      && node.ply < run.nodes.find(node => node.id === last.nodeId)!.ply
      && !sourceFeatures(node.fen).some(value => observationIdentity(value) === observationIdentity(first.evidence.payload.observation))))),
  "pin a real distinct-node recurrence with an absent-between witness");
  // The fixed62 pairs do not cover this strict timing case. Pin a deliberate legal peer:
  // the main's Nf3 at ply1 is suppressed only when the nonempty peer reaches Nf3 at ply3.
  run = rewind(run, root, at).run; run = fork(run, root, { at }).run;
  const latePeer = run.activeCursor.branchId;
  for (const move of ["a2a3", "a7a6"]) run = commitMove(run, move, { at }).run;
  const earlierPeer = run.activeCursor.nodeId;
  run = commitMove(run, "g1f3", { at }).run; run = revealFeedback(run, at).run;
  const laterPeer = run.activeCursor.nodeId;
  const images = [earlierPeer, laterPeer].map(endpoint => {
    const comparison = scoped(run, [main, latePeer], { researchThroughNodeIds: [mainPath[1]!.id, endpoint] });
    const entries = invokeEvidenceValueRoute("derived.compare.structure_delta@1", { run, comparison, branchId: main }) as readonly RunEvidenceItem<{ observation: StructuralObservation }>[];
    const peerPath = branchPath(run, latePeer), end = peerPath.findIndex(node => node.id === endpoint);
    check(() => assert.deepEqual(entries.map(item => ({ nodeId: item.nodeId, plyOffset: item.plyOffset, observation: item.evidence.payload.observation })),
      expectedStructure([mainPath.slice(0, 2), peerPath.slice(0, end + 1)], 0, comparison.forkNodeId, sourceFeatures)));
    sourceReconstructionCases++;
    return new Set(entries.map(item => entryKey({ nodeId: item.nodeId, observation: item.evidence.payload.observation })));
  });
  const strictRemoved = [...images[0]!].filter(key => !images[1]!.has(key));
  assert(strictRemoved.length > 0, "the deliberate later-peer case must actually suppress selected-node facts");
  laterPeerSuppressions += strictRemoved.length;
  for (const fen of ["4k3/8/8/8/3P4/8/8/4K3 w - - 0 1", "4k3/8/8/3p4/8/8/8/4K3 b - - 0 1"]) {
    const features = sourceFeatures(fen);
    assert(features.some(value => value.kind === "named_structure"), "named-structure conversion needs a real positive");
    assert.notDeepEqual(features.filter(value => value.kind !== "named_structure"), structuralReading(fen).features);
  }
  assert(peerExtensionSuppressions > 0, "a later peer observation must actually change earlier selected-column membership");
  assert(laterPeerSuppressions > 0, "suppression must also occur past an already nonempty peer prefix and after the selected observation's ply");
  assert.deepEqual([...structuralInputCounts], [0]);
  assert([...sourcePopulations.values()].some(row => row.sizes.some(size => size === 0)));
  console.log(JSON.stringify({ scope: "D3847 complete structural source reconstruction/negative selection; not successor receipts or qualification",
    draftExactFamilyTableChecked: true, missingOrOldNamedVersionTableRefused: true,
    familyRefs: structuralRefs.length, distinctFenPopulations: sourcePopulations.size, sourceReconstructionCases,
    additionalStrictPeerPairs: 2, distinctNodeAbsentBetweenWitness: true,
    peerExtensionSuppressions, laterPeerSuppressions, repeatedAppearanceItems, namedStructurePositiveCases: 2,
    successfulEmptyFamilyRows: [...sourcePopulations.values()].reduce((sum, row) => sum + row.sizes.filter(size => size === 0).length, 0),
    legacySealedInputCounts: [...structuralInputCounts], productionChanges: 0 }));
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
