// DISPOSABLE D3841 source-origin experiment. Not evidence factories, access grants or an API.
// Existing sealed history is the authority; fixture labels never establish a provider exchange.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { materialRoleSignatureReading, type MaterialRole, type MaterialRoleSignatureReading, type MaterialRoleAsymmetryEvent } from "../../packages/runtime/src/material-state.js";
import type { TransitionSemanticEventOperands } from "../../packages/runtime/src/semantic-evidence.js";
import { captureTargetSquare, type TransitionSemanticFact } from "../../packages/runtime/src/transition.js";
import { promotionPressureReading } from "../../packages/runtime/src/tactics.js";
import type { StructuralObservation } from "../../packages/runtime/src/structure.js";
import { createRun, canonicalRunStart, appendOpponentPly, attachEvidence, rewind, fork, branchPath, commitMove,
  type DrillRun, type EvidenceAttachedEvent, type EvidenceKind, type OpponentMoveSelectedEvent,
} from "../../packages/runtime/src/index.js";
import { resolveRunSubject, resolveRunEvidenceItem, assertResolvedRunSubject,
  digestRunEventHead, digestRunEvidenceItem, type ResolvedRunSubject, type RunEvidenceItemDigest,
} from "../../packages/runtime/src/run-subject.js";
import { PRIMARY_EVIDENCE_MANIFEST, EVIDENCE_CONTRACT_DECLARATIONS } from "../../packages/runtime/src/evidence-catalog.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, compileEvidenceManifest, type DeclaredEvidence, type ProjectionDeclaration,
  type ProducerDeclaration } from "../../packages/runtime/src/evidence-contract.js";
import { compileProjectionExecution } from "../../packages/runtime/src/evidence-execution.js";
import { deriveProjectionConventionTable } from "../../packages/runtime/src/evidence-convention-closure.js";
import { reviewStoryMoments, rankStoryMoments } from "../../packages/runtime/src/story.js";
import { reviewPacketForRun, reviewSubjectPath, type ReviewProviderNodeState } from "../../packages/runtime/src/review-evidence.js";
import { importedRun, importRecord, evaluationDelivery, attachDelivery } from "../../packages/runtime/src/testing/review-evidence-fixture.js";
import type { ReviewEnginePoint } from "../../packages/runtime/src/review-points.js";

const at = "2026-10-15T00:00:00.000Z";
let checks = 0;
const check = (run: () => void) => { run(); checks++; };
const head = (run: DrillRun) => digestRunEventHead({ runId: run.id, events: run.events, headSeq: run.events.length });
function subject(run: DrillRun, branchId: string, nodeId: string): ResolvedRunSubject {
  return resolveRunSubject(run, { kind: "run_node", runId: run.id, eventHeadDigest: head(run), branchId, nodeId });
}
function item(run: DrillRun, event: EvidenceAttachedEvent): RunEvidenceItemDigest {
  return digestRunEvidenceItem({ runId: run.id, eventHeadDigest: head(run), eventSeq: event.seq, event });
}

// Feasibility only: establishes occurrence membership, not the proposed F2 payload/receipt.
function packet(resolved: ResolvedRunSubject, digest: RunEvidenceItemDigest, kind: EvidenceKind) {
  assertResolvedRunSubject(resolved);
  assert.equal(resolved.subject.kind, "run_node");
  if (resolved.subject.kind !== "run_node") throw new TypeError("not a node");
  const event = resolveRunEvidenceItem(resolved, digest);
  assert.equal(event.data.nodeId, resolved.subject.nodeId, "attachment is from another occurrence");
  assert.equal(event.data.payload.kind, kind, "wrong packet kind");
  assert.notEqual(event.data.payload.source, "human_model_predicted", "model packet is not an engine/tablebase report");
  return Object.freeze({ origin: "recorded_packet" as const, subject: resolved.subject,
    event, itemDigest: digest, providerExchange: "not_established" as const });
}
function selection(resolved: ResolvedRunSubject, eventSeq: number) {
  assertResolvedRunSubject(resolved);
  assert.equal(resolved.subject.kind, "run_node");
  if (resolved.subject.kind !== "run_node") throw new TypeError("not a node");
  assert(Number.isSafeInteger(eventSeq) && eventSeq > 0);
  const event = resolved.run.events[eventSeq - 1];
  assert.equal(event?.type, "opponent.move_selected");
  if (event?.type !== "opponent.move_selected") throw new TypeError("not a selection");
  assert.equal(event.data.nodeId, resolved.subject.nodeId, "selection is from another occurrence");
  assert.equal(event.data.branchId, resolved.subject.branchId, "selection is from another branch");
  assert.equal(event.data.selection.policyModeApplied, "human_common");
  assert(event.data.selection.candidates !== undefined, "recorded candidate window is absent");
  return Object.freeze({ origin: "recorded_selection" as const, subject: resolved.subject,
    event, requestedTargetElo: resolved.run.opponentPolicy.targetElo ?? null,
    providerExchange: "not_established" as const });
}
// Pure scope feasibility, not a genuine RecordedPivotalSource issuer or access grant.
function observations(run: DrillRun, requestedBranch: string, throughNode: string) {
  const path = branchPath(run, requestedBranch), index = path.findIndex(node => node.id === throughNode);
  assert(index >= 0, "endpoint is not on requested branch");
  const nodes = new Set(path.slice(0, index + 1).map(node => node.id));
  return run.events.flatMap(event => event.type === "opponent.move_selected" && nodes.has(event.data.nodeId)
    && event.data.selection.policyModeApplied === "human_common" && event.data.selection.candidates !== undefined
    ? [{ requestedBranch, throughNode, observation: selection(subject(run, event.data.branchId, event.data.nodeId), event.seq),
      position: invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: event.data.nodeId }) as DeclaredEvidence<unknown> }] : []);
}

for (const side of ["white", "black"] as const) {
  const fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${side === "white" ? "w" : "b"} KQkq - 0 1`;
  let run = createRun({ id: `d3841-origin-${side}`, session: { kind: "position",
    start: canonicalRunStart({ fen, side: side === "white" ? "black" : "white" }),
    opponentPolicy: { mode: "human_common", targetElo: side === "white" ? 1400 : 1700 }, feedbackPolicy: "attempt_end" },
    sessionDigest: `sha256:${"a".repeat(64)}`, seed: 1, createdAt: at,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  const root = run.activeCursor.nodeId, main = run.activeCursor.branchId;
  const move = side === "white" ? "e2e4" : "e7e5";
  // Explicit legacy test reports; no real engine/model/tablebase output is claimed.
  for (const [kind, values] of [
    ["eval", { centipawns: 31, mateIn: null }], ["wdl", { win: 200, draw: 700, loss: 100 }],
    ["bestline", { moves: [move], legacyNotation: "retained verbatim" }],
    ["tablebase", { category: "draw", dtz: 0, preciseDtz: null }],
  ] as const) run = attachEvidence(run, root, [`fixture:${kind}`], {
    kind, source: kind === "tablebase" ? "tablebase_exact" : "engine_validated", values,
  }, at).run;
  const beforeSelection = run;
  run = appendOpponentPly(run, { moveUci: move, policyModeApplied: "human_common",
    engine: { id: "fixture-maia", name: "Recorded fixture", version: "fixture", seedHonored: false },
    candidates: [{ moveUci: move, mass: 0.4, rank: 1, wdl: { win: 300, draw: 500, loss: 200 } },
      { moveUci: side === "white" ? "d2d4" : "d7d5", mass: 0.3, rank: 2 },
      { moveUci: side === "white" ? "c2c4" : "c7c5", mass: 0.3, rank: 3 }],
  }, { at }).run;
  const mainNode = run.activeCursor.nodeId;
  const firstSelection = run.events.find((event): event is OpponentMoveSelectedEvent => event.type === "opponent.move_selected")!;
  run = rewind(run, root, at).run;
  run = fork(run, root, { at }).run;
  const peer = run.activeCursor.branchId;
  run = appendOpponentPly(run, { moveUci: move, policyModeApplied: "human_common",
    engine: { id: "fixture-maia", name: "Recorded fixture", version: "fixture", seedHonored: false },
    candidates: [{ moveUci: move, mass: 1, rank: 1 }],
  }, { at }).run;
  const peerNode = run.activeCursor.nodeId;
  const laterSelection = run.events.filter((event): event is OpponentMoveSelectedEvent => event.type === "opponent.move_selected").at(-1)!;
  const mainSubject = subject(run, main, root), peerSubject = subject(run, peer, root);
  const original = JSON.stringify(run);
  const attachments = run.events.filter((event): event is EvidenceAttachedEvent => event.type === "evidence.attached");
  check(() => assert.equal(run.nodes.find(node => node.id === mainNode)!.fen, run.nodes.find(node => node.id === peerNode)!.fen));
  for (const event of attachments) {
    const digest = item(run, event), result = packet(mainSubject, digest, event.data.payload.kind);
    check(() => assert.deepEqual(result.event, event));
    check(() => assert.equal(result.providerExchange, "not_established"));
    check(() => assert(Object.isFrozen(result.event.data.payload.values)));
    check(() => assert.deepEqual(packet(peerSubject, digest, event.data.payload.kind).event, event)); // Same inherited node is legitimate.
    check(() => assert.throws(() => packet(subject(run, main, mainNode), digest, event.data.payload.kind), /another occurrence/u));
    check(() => assert.throws(() => packet(subject(run, peer, peerNode), digest, event.data.payload.kind), /another occurrence/u));
    check(() => assert.throws(() => packet(subject(beforeSelection, main, root), digest, event.data.payload.kind), /absent or ambiguous/u));
    check(() => assert.throws(() => packet(mainSubject, item(run, { ...event, at: "2026-10-15T00:00:01.000Z" }), event.data.payload.kind), /absent or ambiguous/u));
    check(() => assert.throws(() => packet(mainSubject, digest, event.data.payload.kind === "eval" ? "wdl" : "eval"), /wrong packet kind/u));
  }
  const first = selection(mainSubject, firstSelection.seq), second = selection(peerSubject, laterSelection.seq);
  check(() => assert.deepEqual(first.event.data.selection.candidates, firstSelection.data.selection.candidates));
  check(() => assert.equal(first.event.data.selection.candidates!.length, 3));
  check(() => assert.equal(second.event.data.selection.candidates!.length, 1));
  check(() => assert.equal(first.event.data.selection.candidates![1]!.wdl, undefined));
  check(() => assert.equal(first.providerExchange, "not_established"));
  check(() => assert.equal(first.requestedTargetElo, run.opponentPolicy.targetElo));
  check(() => assert(Object.isFrozen(first.event.data.selection.candidates![0]!.wdl)));
  check(() => assert.throws(() => selection(mainSubject, laterSelection.seq), /another branch/u));
  check(() => assert.throws(() => selection(peerSubject, firstSelection.seq), /another branch/u));
  check(() => assert.throws(() => selection(subject(run, main, mainNode), firstSelection.seq), /another occurrence/u));
  check(() => assert.throws(() => selection(subject(beforeSelection, main, root), firstSelection.seq), /opponent.move_selected/u));
  check(() => assert.throws(() => selection(mainSubject, attachments[0]!.seq), /opponent.move_selected/u));
  check(() => assert.throws(() => selection({ ...mainSubject } as ResolvedRunSubject, firstSelection.seq), /Unresolved run subject/u));
  check(() => assert.throws(() => packet({ ...mainSubject } as ResolvedRunSubject, item(run, attachments[0]!), "eval"), /Unresolved run subject/u));
  const model = attachEvidence(run, root, ["fixture:model-not-engine"], {
    kind: "eval", source: "human_model_predicted", values: { centipawns: 31 },
  }, at).run;
  const modelEvent = model.events.at(-1)! as EvidenceAttachedEvent;
  check(() => assert.throws(() => packet(subject(model, main, root), item(model, modelEvent), "eval"), /model packet/u));
  const duplicate = attachEvidence(run, root, attachments[0]!.data.evidenceRefs, attachments[0]!.data.payload, at).run;
  const duplicateEvent = duplicate.events.at(-1)! as EvidenceAttachedEvent;
  const duplicateSubject = subject(duplicate, main, root);
  check(() => assert.deepEqual(packet(duplicateSubject, item(duplicate, duplicateEvent), "eval").event.data.payload,
    packet(duplicateSubject, item(duplicate, attachments[0]!), "eval").event.data.payload));
  check(() => assert.notEqual(item(duplicate, duplicateEvent), item(duplicate, attachments[0]!)));
  check(() => assert.equal(JSON.stringify(run), original));
  check(() => assert.notDeepEqual(first.event.data.selection.candidates, second.event.data.selection.candidates));
  const mainObservations = observations(run, main, root), peerObservations = observations(run, peer, root);
  check(() => assert.equal(mainObservations.length, 2));
  check(() => assert.equal(peerObservations.length, 2));
  check(() => assert.deepEqual(mainObservations.map(row => row.observation.event.seq), peerObservations.map(row => row.observation.event.seq)));
  check(() => assert.equal(peerObservations[0]!.observation.subject.kind === "run_node" && peerObservations[0]!.observation.subject.branchId, main));
  check(() => assert.equal(mainObservations[1]!.observation.subject.kind === "run_node" && mainObservations[1]!.observation.subject.branchId, peer));
  check(() => assert.equal(peerObservations[0]!.requestedBranch, peer));
  check(() => assert.deepEqual(mainObservations[0]!.position.payload, peerObservations[0]!.position.payload));
  check(() => assert.throws(() => observations(run, main, peerNode), /endpoint is not/u));
  check(() => assert.notEqual(observations(run, main, mainNode)[0]!.throughNode, mainObservations[0]!.throughNode));
  const foreignId = `${run.id}-foreign`;
  const foreign = { ...run, id: foreignId, events: run.events.map(event => event.type === "run.started"
    ? { ...event, data: { ...event.data, id: foreignId } } : event) };
  const foreignSubject = subject(foreign, main, root);
  const foreignPosition = invokeEvidenceValueRoute("run.record.position@1", { run: foreignSubject.run, nodeId: root }) as DeclaredEvidence<unknown>;
  check(() => assert.deepEqual(foreignPosition.payload, mainObservations[0]!.position.payload));
  check(() => assert.notEqual(evidenceValueReceipt(foreignPosition).inputDigest, evidenceValueReceipt(mainObservations[0]!.position).inputDigest));
  check(() => assert.throws(() => packet(mainSubject, item(foreign, attachments[0]!), "eval"), /absent or ambiguous/u));
}
console.log(JSON.stringify({ scope: "D3841 historical occurrence feasibility, not F2 factories, access or modern provider proof", sides: 2, checks,
  packetKinds: 4, inspectorPacketObligations: 6, providerCalls: 0, productionChanges: 0 }));

// D3845 diagnostic, NOT a passing derivation conformance criterion. Current empty rank is legal
// product behavior; the declared fixed input member does not describe its actual empty receipt.
const emptyRank = invokeEvidenceValueRoute("derived.story.rank@2", { moments: [] }) as DeclaredEvidence<unknown>;
const rankDeclaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.story.rank" && row.version === 2)!;
assert.equal(rankDeclaration.derivation!.inputs!.length, 11);
assert.deepEqual(emptyRank.payload, { rank: [] });
assert.deepEqual(evidenceValueReceipt(emptyRank).sourceDigests, []);
console.log(JSON.stringify({ scope: "D3845 current empty-rank diagnostic, not F2 conformance or replacement semantics",
  declaredInputs: rankDeclaration.derivation!.inputs!.length, actualSourceDigests: evidenceValueReceipt(emptyRank).sourceDigests.length,
  successfulEmptyRank: true, literalMemberMatchesActualEmptyInputs: false }));

// Measure real Story collections as legal path length grows. No invented moments, provider
// deliveries or evidence wrappers: use the unchanged packet/Story compiler and its actual receipts.
const rankCases: { learnerSide: string; plies: number; moments: number; inputCount: number;
  refs: readonly string[]; repeatedRefs: boolean; fixedDeclarationMatches: boolean }[] = [];
const emptyStateCases: { learnerSide: string; states: number; distinctPackets: number;
  distinctRankInputs: number; pendingRemainsVisible: boolean; degradationRemainsVisible: boolean }[] = [];
for (const learnerSide of ["white", "black"] as const) {
  let run = createRun({ id: `d3845-story-${learnerSide}`, session: { kind: "position",
    start: canonicalRunStart({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: learnerSide }),
    opponentPolicy: { mode: "human_common" }, feedbackPolicy: "attempt_end" },
    sessionDigest: `sha256:${"b".repeat(64)}`, seed: 1, createdAt: at,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  const moves = ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4", "f3d4", "g8f6"];
  for (let plies = 0; plies <= moves.length; plies++) {
    if (plies > 0) run = commitMove(run, moves[plies - 1]!, { at }).run;
    const packet = reviewPacketForRun(run, run.activeCursor.branchId);
    const story = reviewStoryMoments(packet);
    const rank = story.evidence.find(value => value.projection.id === "derived.story.rank" && value.projection.version === 2)!;
    assert(rank, "actual Story must retain its rank evidence even with no moments");
    const inputs = story.moments.flatMap(moment => moment.evidence);
    const refs = inputs.map(value => `${value.projection.id}@${value.projection.version}`);
    assert.deepEqual(evidenceValueReceipt(rank).sourceDigests, inputs.map(value => evidenceValueReceipt(value).payloadDigest),
      "all actual moment evidence inputs, including repeated refs, survive in receipt order");
    assert.deepEqual((rank.payload as { rank: readonly string[] }).rank, story.rank);
    assert.deepEqual(story.rank, rankStoryMoments(story.moments));
    assert(evidenceValueReceipt(rank).convention!.refs.some(ref => ref.id === "story-rank" && ref.version === 1),
      "empty and nonempty rank values already retain the genuine registered presentation convention");
    rankCases.push({ learnerSide, plies, moments: story.moments.length, inputCount: refs.length, refs,
      repeatedRefs: new Set(refs).size < refs.length,
      fixedDeclarationMatches: JSON.stringify(refs) === JSON.stringify(rankDeclaration.derivation!.inputs!.map(ref => `${ref.id}@${ref.version}`)) });
    if (plies === 0) {
      // Explicit source-state fixtures, NOT actual queued jobs or provider failures. Equal empty
      // lists need not mean equal coverage, so inspect the original packet separately from rank.
      const fixtureStates: readonly ReviewProviderNodeState[] = [
        { kind: "not_requested" }, { kind: "pending", jobCount: 1, retrying: 0 },
        { kind: "unavailable", reason: "provider_off" },
      ];
      const images = fixtureStates.map(state => {
        const packet = reviewPacketForRun(run, run.activeCursor.branchId,
          { engine: new Map(run.nodes.map(node => [node.id, state])) });
        const story = reviewStoryMoments(packet);
        assert.deepEqual(story.rank, []);
        const rank = story.evidence.find(item => item.projection.id === "derived.story.rank")!;
        assert.deepEqual(evidenceValueReceipt(rank).sourceDigests, []);
        return { packet, rankInput: evidenceValueReceipt(rank).inputDigest };
      });
      assert.equal(new Set(images.map(image => image.packet.packetDigest)).size, 3);
      assert.equal(new Set(images.map(image => image.rankInput)).size, 1,
        "old pure rank has no source-state authority; never reuse it as a scoped source grant");
      assert.equal(images[1]!.packet.completion.progress.kind, "progressive");
      assert.equal(images[2]!.packet.completion.degradation.kind, "degraded");
      emptyStateCases.push({ learnerSide, states: images.length, distinctPackets: 3, distinctRankInputs: 1,
        pendingRemainsVisible: true, degradationRemainsVisible: true });
    }
  }
}
assert.equal(rankCases.length, 18);
assert(rankCases.some(row => row.inputCount === 0), "retain a real successful empty Story");
assert(rankCases.some(row => row.inputCount === 1), "measure a real singleton input");
assert(rankCases.some(row => row.repeatedRefs), "measure genuine repeated projection occurrences");
console.log(JSON.stringify({ scope: "D3845 actual whole-tip Story cardinality diagnostic; no replacement contract, provider or HTTP proof",
  cases: rankCases.length, successfulEmpty: rankCases.filter(row => row.inputCount === 0).length,
  singleton: rankCases.filter(row => row.inputCount === 1).length,
  repeatedProjectionCases: rankCases.filter(row => row.repeatedRefs).length,
  inputCounts: [...new Set(rankCases.map(row => row.inputCount))],
  observedRefs: [...new Set(rankCases.flatMap(row => row.refs))],
  exactFixedDeclarationMatches: rankCases.filter(row => row.fixedDeclarationMatches).length,
  allActualSourcesRetainedInOrder: true, unchangedOrdering: true,
  registeredRankingConventionRetained: true, emptyStateCases,
  sourceStateFixtureScope: "not real provider/job proof; original packets distinguish the three states" }));

// D3846: exact tuple dependencies must be checked before a collection extension can use them.
// These are the existing permanent legal positive fixtures, not disconnected synthetic FENs.
const pivotalTupleCases: { kind: string; learnerSide: string; declared: readonly string[];
  actual: readonly string[]; values: number; directInspectorTopic: boolean }[] = [];
for (const learnerSide of ["white", "black"] as const) for (const fixture of [
  { kind: "phase_change" as const, fen: "r2qk2r/8/8/8/8/8/8/R2QK2R w - - 0 1", moves: ["d1d8", "e8d8"],
    actualRefs: ["rules.phase.reading@2", "run.record.position@1", "rules.phase.reading@2", "run.record.position@1"] },
  { kind: "option_collapse" as const, fen: "8/3r3k/p3qr1p/1p5Q/8/P6R/1PP1p3/1K5R w - - 0 37", moves: ["h1e1", "d7d1", "e1d1", "e2d1q"],
    actualRefs: ["rules.mobility.reading.legal_moves@1", "run.record.position@1", "rules.mobility.reading.legal_moves@1", "run.record.position@1", "rules.mobility.reading.legal_moves@1", "run.record.position@1"] },
]) {
  let run = createRun({ id: `d3846-${fixture.kind}-${learnerSide}`, session: { kind: "position",
    start: canonicalRunStart({ fen: fixture.fen, side: learnerSide }),
    opponentPolicy: { mode: "human_common" }, feedbackPolicy: "attempt_end" },
    sessionDigest: `sha256:${"c".repeat(64)}`, seed: 1, createdAt: at,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  for (const move of fixture.moves) run = commitMove(run, move, { at }).run;
  const route = `derived.pivotal.${fixture.kind}@1` as const;
  const values = invokeEvidenceValueRoute(route, { run, branchId: run.activeCursor.branchId });
  assert(values.length > 0, `${route} positive must actually emit`);
  const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === `derived.pivotal.${fixture.kind}` && row.version === 1)!;
  const declared = declaration.derivation!.inputs!.map(ref => `${ref.id}@${ref.version}`);
  assert.equal(declared.length, 2);
  for (const value of values) {
    const actual = value.inputs.map(input => `${input.projection.id}@${input.projection.version}`);
    assert.deepEqual(actual, fixture.actualRefs);
    assert.deepEqual(evidenceValueReceipt(value.evidence).sourceDigests, value.inputs.map(input => evidenceValueReceipt(input).payloadDigest));
    assert.notDeepEqual(actual, declared, "current exact tuple mismatch must remain visible");
  }
  pivotalTupleCases.push({ kind: fixture.kind, learnerSide, declared, actual: fixture.actualRefs, values: values.length,
    directInspectorTopic: PRIMARY_EVIDENCE_MANIFEST.consumers.find(row => row.id === "module.full_inspector" && row.version === 1)!
      .accepts.some(ref => `${ref.id}@${ref.version}` === route) });
}
console.log(JSON.stringify({ scope: "D3846 current fixed pivotal tuple diagnostics; not versioned source adoption or HTTP proof",
  legalFixtureCases: pivotalTupleCases.length, cases: pivotalTupleCases,
  inputOrderAndMultiplicityRetained: true, oldFactoryOrManifestChanged: false }));

const pivotalSuccessors = ["phase_change", "option_collapse"].map(kind => {
  const old = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === `derived.pivotal.${kind}` && row.version === 1)!;
  const actual = pivotalTupleCases.find(row => row.kind === kind)!.actual;
  const draft = readFileSync("rfc/evidence-value-authority.md", "utf8").split("#### 2.3b Draft D3846")[1]!.split("#### 2.4")[0]!;
  const row = draft.split("\n").find(line => line.startsWith(`| \`${old.id}@2\` |`));
  assert(row, "the explicit upstream tuple declaration must exist");
  const draftInputs = [...row.split(" | ")[2]!.matchAll(/`([^`]+@\d+)`/gu)].map(match => match[1]!);
  assert.deepEqual(draftInputs, actual, "upstream draft must retain every actual ordered input occurrence");
  return { ...old, version: 2,
    derivation: { inputs: actual.map(key => { const [id, version] = key.split("@"); return { id: id!, version: Number(version) }; }) },
    disposition: { kind: "inspector_only" as const, reason: "D3846 isolated prospective tuple, not registered source adoption" } };
});
const pivotalCompiled = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
  producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => producer.id === "derived.pivotal"
    ? { ...producer, outputs: [...producer.outputs, ...pivotalSuccessors] } : producer) });
for (const declaration of pivotalSuccessors) {
  const path = compileProjectionExecution(pivotalCompiled, { id: declaration.id, version: 2 });
  assert.equal(path.paths.length, 1);
  const expected = declaration.id.endsWith("phase_change") ? [1, 3] : [1, 3, 5];
  assert.deepEqual(path.paths[0]!.sourceRequirements.map(source => source.occurrence), expected.map(index => [index]));
  assert(path.paths[0]!.sourceRequirements.every(source => source.projection.id === "run.record.position"
    && source.projection.version === 1 && source.availability === "recorded" && source.providerOperation === null));
}
console.log(JSON.stringify({ scope: "D3846 prospective fixed tuples compile in unchanged F1; not factories or consumer adoption",
  successorDeclarations: 2, phaseRecordedOccurrences: [[1], [3]], collapseRecordedOccurrences: [[1], [3], [5]],
  providerOperations: 0, oldDeclarationsChanged: false }));

// D3847's strict overload computes hypothetical exchanges internally. Its literal sealed
// inputs are duties/capture, not an invented single exchange for every legal recapture.
const overloadOld = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.tactic.overloaded_defender_response_conflict" && row.version === 1)!;
const overloadInputs = [{ id: "rules.tactic.reading.defender_duty_set", version: 1 }, { id: "rules.transition.event.capture", version: 1 }];
const overloadDraft = readFileSync("rfc/evidence-value-authority.md", "utf8").split("#### 2.3e Draft D3847")[1]!.split("#### 2.4")[0]!;
const overloadComputedRef = { id: "rules.tactic.predicate.overload_conflict", version: 1 };
const overloadRow = overloadDraft.split("\n").find(line => line.startsWith(`| \`${overloadComputedRef.id}@1\` |`));
assert(overloadRow);
assert.equal(overloadRow.split(" | ")[3]!.replace(/ \|$/u, ""), "none — computed");
const overloadProposed: ProjectionDeclaration = { ...overloadOld, version: 2,
  dependsOn: overloadInputs, derivation: { inputs: overloadInputs },
  disposition: { kind: "inspector_only", reason: "D3847 isolated two-input proposal, not source adoption" } };
const overloadCandidate = (grounding: ProjectionDeclaration["grounding"]) => compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
  producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => producer.id === "derived.tactic"
    ? { ...producer, outputs: [...producer.outputs, { ...overloadProposed, grounding }] } : producer) });
// D3852: retain the real authoring failure. The contrasting metadata is NOT a proposed
// authority correction; a green manifest cannot decide whether its primary label is truthful.
assert.throws(() => overloadCandidate("declared_convention"), /EVIDENCE_DERIVATION_WIDENS/u);
const overloadCompiled = overloadCandidate("position_rules");
const overloadPath = compileProjectionExecution(overloadCompiled, { id: overloadOld.id, version: 2 });
assert.equal(overloadPath.paths.length, 1);
assert.deepEqual(overloadPath.paths[0]!.derivationChoices.find(choice => choice.projection.id === overloadOld.id)!.inputs, overloadInputs);
assert.deepEqual(overloadPath.paths[0]!.sourceRequirements, [], "local computations are not non-local execution leaves");
console.log(JSON.stringify({ scope: "D3852 rejected strict-overload proposal and counterfactual metadata, NOT authority correction/adoption",
  literalInputRefs: overloadInputs.map(ref => `${ref.id}@${ref.version}`), proposedGroundingRefused: true,
  counterfactualPositionGroundingCompiles: true, nonLocalSourceRequirements: 0, providerOperations: 0, oldDeclarationsChanged: false }));
const { derivation: discardedOverloadDerivation, ...overloadComputedBase } = overloadOld;
assert(discardedOverloadDerivation !== undefined);
const overloadComputed: ProjectionDeclaration = { ...overloadComputedBase, ...overloadComputedRef,
  producer: { id: "rules.tactic", version: 1 }, plane: "rules", dependsOn: [],
  semantics: `${overloadOld.semantics} Computed from one legal edge under overload-conflict@1, defence-duty@1 and legal-exchange@1.`,
  abstention: { possible: true, reasons: ["no_legal_recapture"] },
  disposition: { kind: "inspector_only", reason: "D3852 isolated direct computed proposal, not registered source adoption" } };
const overloadComputedManifest = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
  producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => producer.id === "rules.tactic"
    ? { ...producer, outputs: [...producer.outputs, overloadComputed] } : producer) });
const overloadComputedPath = compileProjectionExecution(overloadComputedManifest, overloadComputedRef);
assert.equal(overloadComputedPath.paths.length, 1);
assert.deepEqual(overloadComputedPath.paths[0]!.derivationChoices, []);
assert.deepEqual(overloadComputedPath.paths[0]!.sourceRequirements, []);
const overloadDirectConventions = deriveProjectionConventionTable(overloadComputedManifest).get(`${overloadComputedRef.id}@1`)!;
assert.deepEqual(overloadDirectConventions.refs.map(ref => `${ref.id}@${ref.version}`),
  ["defence-duty@1", "legal-exchange@1", "overload-conflict@1"]);
console.log(JSON.stringify({ scope: "D3852 direct computed conventional metadata only; no factory/receipt/consumer qualification",
  grounding: overloadComputed.grounding, exactness: overloadComputed.exactness,
  sealedInputs: 0, directConventions: overloadDirectConventions.refs, providerOperations: 0, oldDeclarationsChanged: false }));

// Hypothetical declaration ONLY, compiled by the real unchanged F1 guard; never source adoption.
const positionDeclaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "run.record.position")!;
const oldMarker = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.pivotal.human_divergence")!;
const selectionDeclaration: ProjectionDeclaration = { ...positionDeclaration,
  id: "recorded.inspector.maia_selection", producer: { id: "recorded.inspector", version: 1 },
  role: "source_record", payloadType: "RecordedInspectorSelection", exactness: "measured", confidence: "reported",
  operands: ["subject", "event", "requestedTargetElo", "authority"], answerContent: ["candidate_moves"],
};
const recordedProducer: ProducerDeclaration = { id: "recorded.inspector", version: 1, plane: "record",
  implementation: "UNIMPLEMENTED D3841 draft", availability: "recorded", latency: "sync", outputs: [selectionDeclaration] };
const successor = (grounding: "recorded_run" | "declared_convention"): ProjectionDeclaration => ({ ...oldMarker,
  version: 2, payloadType: "RecordedHumanDivergenceMarker", grounding,
  disposition: { kind: "inspector_only", reason: "D3841 isolated prospective declaration; current consumer migration remains unaccepted" },
  derivation: { inputs: [{ id: selectionDeclaration.id, version: 1 }, { id: positionDeclaration.id, version: 1 }] },
});
function candidate(grounding: "recorded_run" | "declared_convention") {
  return compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
    producers: [...EVIDENCE_CONTRACT_DECLARATIONS.producers.map(row => row.id === "derived.pivotal"
      ? { ...row, outputs: [...row.outputs, successor(grounding)] } : row), recordedProducer],
  });
}
assert.throws(() => candidate("declared_convention"), /EVIDENCE_DERIVATION_WIDENS/u);
const compiled = candidate("recorded_run");
const path = compileProjectionExecution(compiled, { id: oldMarker.id, version: 2 });
assert.equal(path.paths.length, 1);
assert.deepEqual(path.paths[0]!.sourceRequirements.map(source => ({ projection: source.projection, availability: source.availability, operation: source.providerOperation })),
  [{ projection: { id: selectionDeclaration.id, version: 1 }, availability: "recorded", operation: null },
    { projection: { id: positionDeclaration.id, version: 1 }, availability: "recorded", operation: null }]);
console.log(JSON.stringify({ scope: "D3841 hypothetical marker declaration, not production registration or minted source",
  wrongGroundingRefused: true, correctedGroundingCompiles: true, recordedLeafRequirements: 2, providerOperations: 0 }));

// Existing alternatives do not describe a collection. Test the tempting repairs against F1,
// rather than weakening its empty/answer guards or calling a union a fixed occurrence tuple.
function rankCandidate(derivation: NonNullable<ProjectionDeclaration["derivation"]>, answers = rankDeclaration.answerContent) {
  const successor: ProjectionDeclaration = { ...rankDeclaration, version: 3, derivation, answerContent: answers,
    disposition: { kind: "inspector_only", reason: "D3845 isolated representation experiment, not a successor registration" } };
  return compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
    producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => producer.id === "derived.story"
      ? { ...producer, outputs: [...producer.outputs, successor] } : producer) });
}
assert.throws(() => rankCandidate({ anyOf: [[]] }), /EVIDENCE_PROJECTION_INCOMPLETE/u);
assert.throws(() => rankCandidate({ anyOf: [[{ id: "derived.pivotal.irreversibility", version: 1 }]] }),
  /EVIDENCE_DERIVATION_WIDENS/u, "a fixed singleton cannot support the aggregate's full declared answer union");
rankCandidate({ anyOf: [[{ id: "derived.pivotal.irreversibility", version: 1 }]] }, ["fact"]);
console.log(JSON.stringify({ scope: "D3845 existing alternative-declaration controls, not a collection implementation",
  emptyMemberRefused: true, singletonFullAnswerUnionRefused: true,
  factOnlySingletonCompiles: true, emptyAndVariableCollectionStillUnrepresented: true }));

// Check the author's table against the CURRENT refused source set; never rewrite the catalogue.
const specification = readFileSync("rfc/module-registration.md", "utf8");
const key = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
const originalRefs = PRIMARY_EVIDENCE_MANIFEST.consumers.find(row => row.id === "module.full_inspector" && row.version === 1)!.accepts.map(key);
const failedRefs = originalRefs.filter(id => {
  const [name, version] = id.split("@");
  try { compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, { id: name!, version: Number(version) }); return false; }
  catch (error) { assert.match(String(error), /EXECUTION_SOURCE_UNREGISTERED/u); return true; }
});
const localSourceRebases = [
  ["derived.material.reading.role_signature@1", "derived.material.reading.role_signature@2"],
  ["derived.material.event.role_asymmetry@1", "derived.material.event.role_asymmetry@2"],
  ["derived.tactic.promotion_pressure@1", "rules.tactic.reading.promotion_pressure@1"],
  ["derived.tactic.overloaded_defender_response_conflict@1", "rules.tactic.predicate.overload_conflict@1"],
  ["derived.tactic.fork_survives_reply@1", "derived.tactic.nonterminal_fork_survival@1"],
  ["derived.compare.structure_delta@1", "derived.compare.structure_delta@2"],
] as const;
function checkMap(text: string) {
  const section = text.split("**D3841 exact affected-source map — unaccepted author image:**")[1]!
    .split("**D3841 exact-version closure")[0]!;
  const rows = [...section.matchAll(/^\| `([^`]+@\d+)` \| `([^`]+@\d+)` \|/gmu)].map(match => [match[1]!, match[2]!] as const);
  assert.equal(rows.length, 20);
  assert.equal(new Set(rows.map(row => row[0])).size, 20);
  assert.equal(new Set(rows.map(row => row[1])).size, 20);
  const tupleRepairs = pivotalSuccessors.map(row => `${row.id}@1`);
  assert.deepEqual(rows.map(row => row[0]).sort(), [...failedRefs, ...tupleRepairs, ...localSourceRebases.map(row => row[0])].sort());
  for (const [old, successor] of localSourceRebases) assert(rows.some(row => row[0] === old && row[1] === successor));
  for (const successor of pivotalSuccessors) assert(rows.some(row => row[0] === `${successor.id}@1` && row[1] === `${successor.id}@2`),
    "a tuple repair cannot retain the false @1 declaration");
  for (const old of rows.map(row => row[0])) assert(originalRefs.includes(old), "no new source obligation may silently replace an unknown old topic");
  const replacements = new Map(rows);
  const topics = originalRefs.map(id => replacements.get(id) ?? id);
  assert.equal(new Set(topics).size, 75);
  return { rows, topics };
}
const mapped = checkMap(specification);
assert.throws(() => checkMap(specification.replace(/^\| `live.stockfish.eval@1` \|.*\n/mu, "")));
assert.throws(() => checkMap(specification.replace("| `live.stockfish.eval@1` |", "| `unknown.source@1` |")));
assert.throws(() => checkMap(specification.replace("| `recorded.inspector.wdl_packet@1` |", "| `recorded.inspector.eval_packet@1` |")));
assert.throws(() => checkMap(specification.replace(/^\| `derived.pivotal.phase_change@1` \|.*\n/mu, "")));
assert.throws(() => checkMap(specification.replace("| `derived.pivotal.phase_change@1` | `derived.pivotal.phase_change@2` |",
  "| `derived.pivotal.phase_change@1` | `derived.pivotal.phase_change@1` |")));
for (const [old] of localSourceRebases) assert.throws(() => checkMap(specification.split("\n").filter(line => !line.startsWith(`| \`${old}\` |`)).join("\n")));
assert.throws(() => checkMap(specification.replace("| `derived.tactic.promotion_pressure@1` | `rules.tactic.reading.promotion_pressure@1` |",
  "| `derived.tactic.promotion_pressure@1` | `derived.tactic.promotion_pressure@1` |")));
const presentationDraft = readFileSync("rfc/evidence-presentation.md", "utf8");
const detailTable = presentationDraft.split("| Projection suffix after `derived.inspector.detail.` | Sole source | Proposed factory | Registered renderer |")[1]!.split("\n\n")[0]!;
const detailRefs = [...detailTable.matchAll(/^\| `([^`]+)` \|/gmu)].map(match => `derived.inspector.detail.${match[1]}@1`);
assert.equal(detailRefs.length, 6);
assert.equal(new Set([...mapped.topics, ...detailRefs]).size, 81);
console.log(JSON.stringify({ scope: "D3841 draft inventory requirements only, NOT compiled successor bindings",
  currentTopics: originalRefs.length, exactAffectedMappings: mapped.rows.length, originalExecutionFailures: failedRefs.length,
  additionalFixedTupleRepairs: pivotalSuccessors.length, unchangedTopics: originalRefs.length - mapped.rows.length,
  proposedTopics: mapped.topics.length, proposedAcceptedRefs: mapped.topics.length + detailRefs.length,
  localSourceRepairs: localSourceRebases.length, negativeMapControls: 12, rankInputContract: "held_D3845", productionRegistration: false }));

// D3847/D3850 disposable input reconstruction. No new factory, seal or runtime declaration.
const materialRoles = ["pawn", "knight", "bishop", "rook", "queen"] as const;
const materialColors = ["white", "black"] as const;
const countSlots = materialColors.flatMap(color => materialRoles.map(role => ({ color, role })));
type CountEvidence = DeclaredEvidence<StructuralObservation>;
function countInputs(fen: string): readonly CountEvidence[] {
  const population = invokeEvidenceValueRoute("rules.structural.reading.piece_count@1", { fen }) as readonly CountEvidence[];
  assert.equal(population.length, 12);
  return countSlots.map(slot => population.find(value => value.payload.color === slot.color && value.payload.role === slot.role)!);
}
function signatureFromCounts(fen: string, counts: readonly CountEvidence[]): MaterialRoleSignatureReading {
  assert.equal(fen, canonicalFen(positionFromFen(fen)), "research input must retain exact canonical FEN bytes");
  assert.equal(counts.length, 10, "ten non-king role counts are required");
  counts.forEach((value, index) => {
    assertDeclaredEvidence(value);
    assert.deepEqual(value.projection, { id: "rules.structural.reading.piece_count", version: 1 });
    const receipt = evidenceValueReceipt(value);
    assert.equal(receipt.factory, "createRulesStructuralReadingPieceCountV1Evidence");
    assert.equal(receipt.inputDigest, evidenceDigest({ fen }), "equal count bytes do not establish the same FEN authority");
    const observation = value.payload, slot = countSlots[index]!;
    assert.equal(observation.kind, "piece_count");
    assert.equal(observation.color, slot.color);
    assert.equal(observation.role, slot.role);
    assert(Number.isSafeInteger(observation.count) && observation.count! >= 0);
  });
  const colors = materialColors.map(color => {
    // Preserve the old payload's canonical observation order, separately from tuple-slot order.
    const sources = counts.filter(value => value.payload.color === color).map(value => value.payload)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const vector = Object.freeze(Object.fromEntries(materialRoles.map(role =>
      [role, sources.find(source => source.role === role)!.count!]))) as Readonly<Record<MaterialRole, number>>;
    return Object.freeze({ color, counts: vector, sources: Object.freeze(sources) });
  });
  const asymmetry = Object.freeze(Object.fromEntries(materialRoles.map(role =>
    [role, Math.abs(colors[0]!.counts[role] - colors[1]!.counts[role])]))) as Readonly<Record<MaterialRole, number>>;
  return Object.freeze({ fen, conventionId: "material-role-signature@1", colors: Object.freeze(colors),
    asymmetry, magnitude: materialRoles.reduce((sum, role) => sum + asymmetry[role], 0) });
}
const initialMaterialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const otherTurnMaterialFen = initialMaterialFen.replace(" w ", " b ");
const completeCounts = countInputs(initialMaterialFen), otherTurnCounts = countInputs(otherTurnMaterialFen);
assert.deepEqual(completeCounts.map(value => value.payload), otherTurnCounts.map(value => value.payload));
assert.deepEqual(completeCounts.map(value => evidenceValueReceipt(value).payloadDigest), otherTurnCounts.map(value => evidenceValueReceipt(value).payloadDigest));
assert.notEqual(evidenceValueReceipt(completeCounts[0]!).inputDigest, evidenceValueReceipt(otherTurnCounts[0]!).inputDigest);
const countNegatives = [completeCounts.slice(1), [...completeCounts, completeCounts[0]!],
  [completeCounts[0]!, completeCounts[0]!, ...completeCounts.slice(2)], [...completeCounts].reverse(),
  [...completeCounts.slice(0, 9), otherTurnCounts[9]!], otherTurnCounts];
for (const values of countNegatives) assert.throws(() => signatureFromCounts(initialMaterialFen, values));
const king = (invokeEvidenceValueRoute("rules.structural.reading.piece_count@1", { fen: initialMaterialFen }) as readonly CountEvidence[])
  .find(value => value.payload.role === "king")!;
assert.throws(() => signatureFromCounts(initialMaterialFen, [king, ...completeCounts.slice(1)]));

const materialEdges = [
  ["7k/8/8/3pP3/8/8/8/K7 w - d6 0 1", "e5d6"],
  ["7k/8/8/8/3Pp3/8/8/K7 b - d3 0 1", "e4d3"],
  ["4k3/8/8/3q4/8/8/3Q4/4K3 w - - 0 1", "d2d5"],
  ["4k3/3q4/8/8/3Q4/8/8/4K3 b - - 0 1", "d7d4"],
  ["4k3/8/8/8/8/8/n7/R3K3 w - - 7 1", "a1a2"],
  ["r3k3/N7/8/8/8/8/8/4K3 b - - 7 1", "a8a7"],
  ...["q", "r", "b", "n"].flatMap(role => [
    ["7k/P7/8/8/8/8/8/7K w - - 7 1", `a7a8${role}`],
    ["7k/8/8/8/8/8/p7/7K b - - 7 1", `a2a1${role}`],
    ["1r5k/P7/8/8/8/8/8/7K w - - 7 1", `a7b8${role}`],
    ["7k/8/8/8/8/8/p7/1R5K b - - 7 1", `a2b1${role}`],
  ]),
] as const;
const materialArms = new Set<string>();
let signatureChecks = 0, increased = 0, decreased = 0, unchangedMagnitude = 0;
function rawMaterialCause(edge: { beforeFen: string; moveUci: string; afterFen: string }, cause: DeclaredEvidence<unknown>): TransitionSemanticFact {
  assertDeclaredEvidence(cause);
  assert.equal(evidenceValueReceipt(cause).inputDigest, evidenceDigest(edge));
  const fact = cause.payload as TransitionSemanticEventOperands;
  assert.equal(fact.before_fen, edge.beforeFen); assert.equal(fact.move_uci, edge.moveUci); assert.equal(fact.after_fen, edge.afterFen);
  assert.equal(`${cause.projection.id}@${cause.projection.version}`, `rules.transition.event.${fact.family}@1`);
  if (fact.family === "capture") return Object.freeze({ family: fact.family, sign: fact.sign,
    mover: fact.mover, from: fact.from, to: fact.to, captured: fact.captured, enPassant: fact.enPassant });
  assert.equal(fact.family, "promotion");
  if (fact.family !== "promotion") throw new TypeError("not a material source family");
  return Object.freeze({ family: fact.family, sign: fact.sign, mover: fact.mover, from: fact.from, to: fact.to, detail: fact.detail });
}
let firstMaterialCause: DeclaredEvidence<unknown> | undefined;
let wrongEdgeCauseRefusals = 0, enPassantCases = 0;
for (const fen of [initialMaterialFen, otherTurnMaterialFen, "7k/8/8/8/8/8/8/K7 w - - 0 1", "7k/8/8/8/8/8/8/K7 b - - 0 1"]) {
  assert.deepEqual(signatureFromCounts(fen, countInputs(fen)), materialRoleSignatureReading(fen));
  signatureChecks++;
}
for (const [beforeFen, uci] of materialEdges) {
  const position = positionFromFen(beforeFen), move = normalizeMove(position, parseUci(uci)!);
  assert(position.isLegal(move)); position.play(move);
  const edge = { beforeFen, moveUci: uci, afterFen: canonicalFen(position) };
  const reconstructed = [beforeFen, edge.afterFen].map(fen => {
    const recipe = signatureFromCounts(fen, countInputs(fen));
    assert.deepEqual(recipe, materialRoleSignatureReading(fen));
    const old = invokeEvidenceValueRoute("derived.material.reading.role_signature@1", { fen });
    assert.deepEqual(recipe, old.payload);
    assert.equal(evidenceValueReceipt(old).sourceDigests.length, 0);
    signatureChecks++;
    return recipe;
  });
  const emitted = invokeEvidenceValueRoute("derived.material.event.role_asymmetry@1", edge);
  assert.equal(emitted.length, 1);
  const value = emitted[0]!;
  const refs = value.inputs.map(input => `${input.projection.id}@${input.projection.version}`);
  assert.deepEqual(refs.slice(0, 2), ["derived.material.reading.role_signature@1", "derived.material.reading.role_signature@1"]);
  assert.equal((value.inputs[0]!.payload as MaterialRoleSignatureReading).fen, beforeFen);
  assert.equal((value.inputs[1]!.payload as MaterialRoleSignatureReading).fen, edge.afterFen);
  materialArms.add(refs.slice(2).join(","));
  // The proposed self-sourcing factory owns both COMPLETE event-family populations. A caller
  // cannot select capture-only on a capture-promotion. Existing caches preserve genuine sources.
  const causes = ["capture", "promotion"].flatMap(family => invokeEvidenceValueRoute(
    `rules.transition.event.${family}@1` as "rules.transition.event.capture@1" | "rules.transition.event.promotion@1", edge));
  assert.deepEqual(causes.map(cause => cause.projection), value.inputs.slice(2).map(cause => cause.projection));
  const sourceEvents = causes.map(cause => rawMaterialCause(edge, cause));
  if (firstMaterialCause === undefined) firstMaterialCause = causes[0]!;
  else { assert.throws(() => rawMaterialCause(edge, firstMaterialCause!)); wrongEdgeCauseRefusals++; }
  for (const fact of sourceEvents) if (fact.family === "capture" && fact.enPassant) {
    assert.equal(captureTargetSquare(fact), beforeFen.includes(" w ") ? "d5" : "d4");
    assert.notEqual(captureTargetSquare(fact), fact.to);
    enPassantCases++;
  }
  const [before, after] = reconstructed as [MaterialRoleSignatureReading, MaterialRoleSignatureReading];
  const reconstructedEvent: MaterialRoleAsymmetryEvent = { ...edge, conventionId: "material-role-signature@1",
    before: { vector: before.asymmetry, magnitude: before.magnitude },
    after: { vector: after.asymmetry, magnitude: after.magnitude },
    changedRoles: materialRoles.filter(role => before.asymmetry[role] !== after.asymmetry[role]),
    increased: after.magnitude > before.magnitude, sourceEvents };
  assert.deepEqual(reconstructedEvent, value.evidence.payload);
  const payload = value.evidence.payload as { before: { magnitude: number }; after: { magnitude: number }; increased: boolean };
  assert.equal(payload.increased, payload.after.magnitude > payload.before.magnitude);
  if (payload.increased) increased++;
  if (payload.after.magnitude < payload.before.magnitude) decreased++;
  if (payload.after.magnitude === payload.before.magnitude) unchangedMagnitude++;
}
assert.deepEqual([...materialArms].sort(), ["rules.transition.event.capture@1", "rules.transition.event.capture@1,rules.transition.event.promotion@1", "rules.transition.event.promotion@1"].sort());
assert(increased > 0 && decreased > 0 && unchangedMagnitude > 0, "D3850 must observe all three magnitude directions");
assert.equal(enPassantCases, 2);
assert.equal(wrongEdgeCauseRefusals, materialEdges.length - 1);
let emptyCauseCases = 0;
for (const [beforeFen, moveUci] of [
  [initialMaterialFen, "e2e4"], [otherTurnMaterialFen, "e7e5"],
  ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 7 1", "e1h1"],
  ["r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 7 1", "e8h8"],
] as const) {
  const position = positionFromFen(beforeFen), move = normalizeMove(position, parseUci(moveUci)!);
  assert(position.isLegal(move)); position.play(move);
  const edge = { beforeFen, moveUci, afterFen: canonicalFen(position) };
  assert.deepEqual(invokeEvidenceValueRoute("rules.transition.event.capture@1", edge), []);
  assert.deepEqual(invokeEvidenceValueRoute("rules.transition.event.promotion@1", edge), []);
  assert.deepEqual(invokeEvidenceValueRoute("derived.material.event.role_asymmetry@1", edge), []);
  emptyCauseCases++;
}

const signatureDeclaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.material.reading.role_signature")!;
const materialDeclaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.material.event.role_asymmetry")!;
const countRef = { id: "rules.structural.reading.piece_count", version: 1 };
const signatureSuccessor: ProjectionDeclaration = { ...signatureDeclaration, version: 2,
  derivation: { inputs: countSlots.map(() => countRef) },
  disposition: { kind: "operator_only", reason: "D3847 prospective declaration only; no factory or consumer" } };
const signatureRef = { id: signatureSuccessor.id, version: 2 };
const materialSuccessor: ProjectionDeclaration = { ...materialDeclaration, version: 2,
  semantics: "All exact role-vector changes with a strictly-increased unweighted-magnitude flag; no material value or advice.",
  derivation: { anyOf: [...materialArms].sort().map(arm => [signatureRef, signatureRef, ...arm.split(",").map(ref => {
    const [id, version] = ref.split("@"); return { id: id!, version: Number(version) };
  })]) },
  disposition: { kind: "operator_only", reason: "D3847 prospective declaration only; no factory or consumer" } };
const materialManifest = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
  producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => producer.id === "derived.material"
    ? { ...producer, outputs: [...producer.outputs, signatureSuccessor, materialSuccessor] } : producer) });
const materialPaths = compileProjectionExecution(materialManifest, materialSuccessor).paths;
assert.equal(materialPaths.length, 3);
for (const path of materialPaths) {
  const signatures = path.derivationChoices.filter(choice => choice.projection.id === signatureSuccessor.id);
  assert.deepEqual(signatures.map(choice => choice.occurrence), [[0], [1]]);
  assert(signatures.every(choice => choice.inputs.length === 10));
  assert.equal(path.sourceRequirements.length, 0);
}
console.log(JSON.stringify({ scope: "D3847/D3850 reconstruction and prospective F1 only; no successor mints or runtime adoption",
  materialEdges: materialEdges.length, completeEventPayloadComparisons: materialEdges.length,
  signaturePayloadComparisons: signatureChecks, countSlots: countSlots.length,
  wrongCountOrderRoleOrFenRefusals: countNegatives.length + 1, equalPayloadForeignFenRefused: true,
  actualMaterialArms: [...materialArms].sort(), increased, decreased, unchangedMagnitude,
  enPassantCases, wrongEdgeCauseRefusals, emptyCauseCases,
  prospectiveMaterialPaths: materialPaths.length, exactSignatureOccurrences: [[0], [1]], oldDeclarationsChanged: false }));

// Promotion pressure actually computes from one FEN. A real computed rules source is different
// from disguising Story's variable collection as a computed leaf; preserve every inner state.
const promotionDeclaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.tactic.promotion_pressure")!;
const promotionFens = ["7k/P7/8/8/8/8/8/7K b - - 0 1", "4k3/P6r/8/8/8/8/8/6K1 b - - 0 1",
  "7k/6P1/8/8/8/8/8/7K b - - 0 1", "7k/P4K2/6Q1/8/8/8/8/8 b - - 0 1",
  "7k/8/8/8/8/8/p7/7K w - - 0 1", initialMaterialFen];
for (const fen of promotionFens) {
  const current = invokeEvidenceValueRoute("derived.tactic.promotion_pressure@1", { fen });
  assert.deepEqual(current.payload, promotionPressureReading(fen));
  assert.equal(evidenceValueReceipt(current).sourceDigests.length, 0);
}
assert.deepEqual(promotionPressureReading(promotionFens[2]!).pawns[0]!.passAvailability,
  { kind: "unavailable", reason: "invalid_turn_clone" });
assert.deepEqual(promotionPressureReading(promotionFens[3]!).pawns[0]!.replyPersistence, { kind: "available", value: false });
assert.equal(promotionPressureReading(initialMaterialFen).pawns.length, 0);
const { derivation: previousPromotionDerivation, ...promotionBase } = promotionDeclaration;
assert.equal(previousPromotionDerivation!.inputs!.length, 3);
assert.throws(() => compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
  producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => producer.id === "derived.tactic"
    ? { ...producer, outputs: [...producer.outputs, { ...promotionBase, version: 2,
      disposition: { kind: "operator_only", reason: "D3847 intentionally invalid empty derived declaration" } }] } : producer) }),
  /EVIDENCE_PROJECTION_INCOMPLETE/u);
const promotionSuccessor: ProjectionDeclaration = { ...promotionBase, id: "rules.tactic.reading.promotion_pressure",
  producer: { id: "rules.tactic", version: 1 }, plane: "rules",
  disposition: { kind: "operator_only", reason: "D3847 prospective computed source only; no factory or consumer" } };
const promotionManifest = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
  producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => producer.id === "rules.tactic"
    ? { ...producer, outputs: [...producer.outputs, promotionSuccessor] } : producer) });
const promotionExecution = compileProjectionExecution(promotionManifest, promotionSuccessor);
assert.equal(promotionExecution.paths.length, 1);
assert.equal(promotionExecution.own.availability, "local");
assert.equal(promotionExecution.worstCaseLatency, "sync");
assert.deepEqual(promotionExecution.paths[0]!.derivationChoices, []);
assert.deepEqual(promotionExecution.paths[0]!.sourceRequirements, []);
console.log(JSON.stringify({ scope: "D3847 actual promotion source and prospective computed declaration; no successor mints/adoption",
  actualFenCases: promotionFens.length, declaredOldInputs: previousPromotionDerivation!.inputs!.length,
  actualSourceDigests: 0, invalidTurnCloneRetained: true, terminalPersistenceFalseRetained: true,
  emptyDerivedRefused: true, computedRulesDeclarationCompiles: true, providerOperations: 0, oldDeclarationsChanged: false }));

// D3847: "last" is selection over the entire recorded available point population. All engine
// deliveries below are explicitly synthetic parser/seal fixtures, not a live provider experiment.
let lastLevelCases = 0, sameSelectedDifferentPopulation = 0, laterPointChangesSelection = 0;
let lastLevelEmptyCases = 0, terminalGateCases = 0, sameSelectionDistinctCoverage = 0, rejectedDeliveryContrasts = 0;
let lastLevelThresholdCases = 0, primitiveRootStoryExclusions = 0, lastLevelNonlossCases = 0;
const lastLevelDeclared = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.story.last_level")!.derivation!.inputs!;
function packetPoints(packet: ReturnType<typeof reviewPacketForRun>): readonly DeclaredEvidence<ReviewEnginePoint>[] {
  // Reinspect actual old packet slots; this is not the proposed boundary/population constructor.
  assert.deepEqual(packet.nodes.map(node => node.nodeId), packet.subject.pathNodeIds);
  const originalPath = reviewSubjectPath(packet.subject).path;
  return packet.nodes.flatMap((node, index) => {
    const original = originalPath[index]!;
    assert.equal(original.id, node.nodeId);
    const slots = node.families.engine_eval.sources.filter(slot => slot.adapterId === "review.source.eval_point@1");
    assert.equal(slots.length, 1, "one source-owned point slot per path occurrence");
    const slot = slots[0]!;
    const points = node.items.filter(value => value.projection.id === "derived.review.eval_point") as readonly DeclaredEvidence<ReviewEnginePoint>[];
    assert.equal(points.length, slot.state.kind === "available" ? 1 : 0);
    if (slot.state.kind === "available") assert.equal(slot.state.itemCount, 1);
    for (const point of points) {
      assertDeclaredEvidence(point);
      assert.deepEqual(point.projection, { id: "derived.review.eval_point", version: 1 });
      assert.equal(evidenceValueReceipt(point).factory, "createDerivedReviewEvalPointV1Evidence");
      assert.deepEqual(point.payload.position.payload, { nodeId: original.id, ply: original.ply, fen: original.fen });
      assert.deepEqual(evidenceValueReceipt(point).sourceDigests,
        [point.payload.evaluation, point.payload.position].map(value => evidenceValueReceipt(value).payloadDigest));
    }
    return points;
  });
}
function lastLevel(packet: ReturnType<typeof reviewPacketForRun>, points = packetPoints(packet)) {
  assert.equal(packet.subject.outcome.kind, "recorded_result");
  if (packet.subject.outcome.kind !== "recorded_result") throw new TypeError("no imported-result gate");
  return invokeEvidenceValueRoute("derived.story.last_level@1", { path: packet.subject.pathNodeIds,
    side: packet.subject.learnerSide, recordedResult: packet.subject.outcome.result, points });
}
for (const side of ["white", "black"] as const) {
  let base = importedRun(`d3847-last-level-${side}`, side);
  for (const move of ["e2e4", "e7e5", "g1f3"]) base = commitMove(base, move, { at }).run;
  const path = branchPath(base, base.activeCursor.branchId), result = side === "white" ? "0-1" : "1-0";
  const deliveries = path.map((node, index) => {
    const learnerCp = [0, -250, 50, -350][index]!;
    const whiteCp = side === "white" ? learnerCp : -learnerCp;
    return evaluationDelivery(node.fen, `cp ${node.fen.split(" ")[1] === "w" ? whiteCp : -whiteCp}`);
  });
  let run = base;
  for (const [index, node] of path.entries()) run = attachDelivery(run, node.id, deliveries[index]!);
  const packet = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, result) });
  const points = packetPoints(packet), full = lastLevel(packet);
  assert.equal(points.length, 4); assert.equal(full.length, 1); assert.equal(full[0]!.nodeId, path[2]!.id);
  assert(reviewStoryMoments(packet).moments.some(moment => moment.kinds.includes("last_level") && moment.nodeId === path[2]!.id));
  const selected = points.find(point => point.payload.position.payload.nodeId === path[2]!.id)!;
  assert.deepEqual(evidenceValueReceipt(full[0]!.evidence).sourceDigests, [evidenceValueReceipt(selected).payloadDigest]);
  assert.equal(lastLevelDeclared.length, 2);
  const singleton = lastLevel(packet, [selected]);
  assert.deepEqual(singleton[0]!.evidence.payload, full[0]!.evidence.payload);
  assert.deepEqual(evidenceValueReceipt(singleton[0]!.evidence).sourceDigests, evidenceValueReceipt(full[0]!.evidence).sourceDigests);
  assert.notEqual(evidenceValueReceipt(singleton[0]!.evidence).inputDigest, evidenceValueReceipt(full[0]!.evidence).inputDigest,
    "the old raw authority does bind all supplied points; identical positive lineage does not establish population completeness");
  sameSelectedDifferentPopulation++;
  const final = path.at(-1)!, learnerCp = 75, whiteCp = side === "white" ? learnerCp : -learnerCp;
  const changedRun = attachDelivery(run, final.id, evaluationDelivery(final.fen, `cp ${final.fen.split(" ")[1] === "w" ? whiteCp : -whiteCp}`));
  const changedPacket = reviewPacketForRun(changedRun, changedRun.activeCursor.branchId, { importRecord: importRecord(changedRun, result) });
  assert.equal(lastLevel(changedPacket)[0]!.nodeId, final.id); laterPointChangesSelection++;
  const states: readonly ReviewProviderNodeState[] = [{ kind: "not_requested" },
    { kind: "pending", jobCount: 1, retrying: 0 }, { kind: "unavailable", reason: "provider_off" }];
  const coverage = states.map(state => {
    const engine = new Map<string, ReviewProviderNodeState>(path.map((node, index) => [node.id,
      index === path.length - 1 ? state : { kind: "delivered", delivery: invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: deliveries[index]! }) }]));
    const packet = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, result), engine });
    const level = lastLevel(packet);
    assert.equal(level[0]!.nodeId, path[2]!.id);
    return { packet, input: evidenceValueReceipt(level[0]!.evidence).inputDigest };
  });
  assert.equal(new Set(coverage.map(value => value.packet.packetDigest)).size, 3);
  assert.equal(new Set(coverage.map(value => value.input)).size, 1);
  assert.equal(coverage[1]!.packet.completion.progress.kind, "progressive");
  assert.equal(coverage[2]!.packet.completion.degradation.kind, "degraded");
  sameSelectionDistinctCoverage += coverage.length;
  // Genuine synthetic deliveries for the wrong original FEN: conversion folds both to the same
  // unavailable state. A prospective population must retain the captured input, not that fold alone.
  const rejected = ["cp 11", "cp 22"].map(score => {
    const delivery = invokeEvidenceValueRoute("live.stockfish.position_eval@1", {
      delivery: evaluationDelivery(path[0]!.fen, score),
    });
    const engine = new Map<string, ReviewProviderNodeState>(path.map((node, index) => [node.id,
      { kind: "delivered", delivery: index === path.length - 1 ? delivery
        : invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: deliveries[index]! }) }]));
    const packet = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, result), engine });
    const finalNode = packet.nodes.at(-1)!;
    const slot = finalNode.families.engine_eval.sources.find(value => value.adapterId === "review.source.eval_point@1")!;
    assert.deepEqual(slot.state, { kind: "unavailable", reason: "input_abstained" });
    assert(!packetPoints(packet).some(value => value.payload.position.payload.nodeId === final.id));
    assert.equal(lastLevel(packet)[0]!.nodeId, path[2]!.id);
    return { state: slot.state, input: evidenceValueReceipt(delivery).inputDigest };
  });
  assert.deepEqual(rejected[0]!.state, rejected[1]!.state);
  assert.notEqual(rejected[0]!.input, rejected[1]!.input);
  rejectedDeliveryContrasts++;
  // Preserve the actual lower threshold, including positive scores outside an absolute one-pawn
  // interval. This is old-factory/Story behavior, not the proposed population/result sidecar.
  for (const learnerCp of [-101, -100, -99, 250]) {
    const engine = new Map<string, ReviewProviderNodeState>(path.map((node, index) => {
      const cp = index === 0 ? learnerCp : -400;
      const whiteCp = side === "white" ? cp : -cp;
      return [node.id, { kind: "delivered", delivery: invokeEvidenceValueRoute("live.stockfish.position_eval@1", {
        delivery: evaluationDelivery(node.fen, `cp ${node.fen.split(" ")[1] === "w" ? whiteCp : -whiteCp}`),
      }) }];
    }));
    const packet = reviewPacketForRun(base, base.activeCursor.branchId, { importRecord: importRecord(base, result), engine });
    const level = lastLevel(packet);
    if (learnerCp < -100) assert.deepEqual(level, []);
    else {
      const root = path[0]!;
      assert.equal(level.length, 1);
      assert.equal(level[0]!.nodeId, root.id);
      assert.equal(level[0]!.plyOffset, root.ply);
      assert.deepEqual(level[0]!.evidence.payload, { recordedResult: result, evaluation: {
        nodeId: root.id, whiteCentipawns: side === "white" ? learnerCp : -learnerCp, learnerCentipawns: learnerCp, side,
      } });
      assert(!reviewStoryMoments(packet).moments.some(moment => moment.kinds.includes("last_level")),
        "primitive root selection must not manufacture a Story decision edge");
      primitiveRootStoryExclusions++;
    }
    for (const nonloss of [side === "white" ? "1-0" : "0-1", "1/2-1/2"] as const) {
      if (learnerCp !== 250) continue;
      const nonlossPacket = reviewPacketForRun(base, base.activeCursor.branchId, { importRecord: importRecord(base, nonloss), engine });
      assert.deepEqual(lastLevel(nonlossPacket), []);
      lastLevelNonlossCases++;
    }
    lastLevelThresholdCases++;
  }
  const noPoints = reviewPacketForRun(base, base.activeCursor.branchId, { importRecord: importRecord(base, result) });
  assert.deepEqual(lastLevel(noPoints), []); lastLevelEmptyCases++;
  let mateOnly = base;
  for (const node of path) mateOnly = attachDelivery(mateOnly, node.id, evaluationDelivery(node.fen, "mate 2"));
  const matePacket = reviewPacketForRun(mateOnly, mateOnly.activeCursor.branchId, { importRecord: importRecord(mateOnly, result) });
  assert.equal(packetPoints(matePacket).length, 4); assert.deepEqual(lastLevel(matePacket), []); lastLevelEmptyCases++;
  let terminal = importedRun(`d3847-terminal-gate-${side}`, side,
    `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${side === "white" ? "w" : "b"} KQkq - 0 1`);
  const moves = side === "white" ? ["f2f3", "e7e5", "g2g4", "d8h4"] : ["f7f6", "e2e4", "g7g5", "d1h5"];
  for (const move of moves.slice(0, -1)) terminal = commitMove(terminal, move, { at }).run;
  const measuredNode = terminal.nodes.find(node => node.id === terminal.activeCursor.nodeId)!;
  terminal = attachDelivery(terminal, measuredNode.id, evaluationDelivery(measuredNode.fen, "cp 0"));
  terminal = commitMove(terminal, moves.at(-1)!, { at }).run;
  const terminalPacket = reviewPacketForRun(terminal, terminal.activeCursor.branchId, { importRecord: importRecord(terminal, result) });
  assert.equal(terminalPacket.subject.outcome.kind, "board_terminal");
  assert(packetPoints(terminalPacket).length > 0);
  assert(!reviewStoryMoments(terminalPacket).moments.some(moment => moment.kinds.includes("last_level")),
    "a board-terminal loss must not be broadened into the recorded-result last-level gate");
  terminalGateCases++; lastLevelCases++;
}
console.log(JSON.stringify({ scope: "D3847 actual Story selection and recorded coverage; synthetic deliveries, no successor or provider proof",
  oneActualPointSlotPerPathNodeChecked: true, exactActualPointSourceOrderChecked: true,
  sides: lastLevelCases, declaredFixedInputs: lastLevelDeclared.length, actualSelectedInputCount: 1,
  sameSelectedDifferentPopulation, laterPointChangesSelection, sameSelectionDistinctCoverage,
  rejectedDeliveryContrasts,
  lastLevelThresholdCases, primitiveRootStoryExclusions, lastLevelNonlossCases,
  successfulEmptyCases: lastLevelEmptyCases, terminalGateCases, oldInputAuthorityBindsPopulation: true,
  sourceCoverageNotInSelectedLineage: true, liveProviderCalls: 0, productionChanges: 0 }));
