// DISPOSABLE D3841 source-origin experiment. Not evidence factories, access grants or an API.
// Existing sealed history is the authority; fixture labels never establish a provider exchange.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRun, canonicalRunStart, appendOpponentPly, attachEvidence, rewind, fork, branchPath, commitMove,
  type DrillRun, type EvidenceAttachedEvent, type EvidenceKind, type OpponentMoveSelectedEvent,
} from "../../packages/runtime/src/index.js";
import { resolveRunSubject, resolveRunEvidenceItem, assertResolvedRunSubject,
  digestRunEventHead, digestRunEvidenceItem, type ResolvedRunSubject, type RunEvidenceItemDigest,
} from "../../packages/runtime/src/run-subject.js";
import { PRIMARY_EVIDENCE_MANIFEST, EVIDENCE_CONTRACT_DECLARATIONS } from "../../packages/runtime/src/evidence-catalog.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { evidenceValueReceipt, compileEvidenceManifest, type DeclaredEvidence, type ProjectionDeclaration,
  type ProducerDeclaration } from "../../packages/runtime/src/evidence-contract.js";
import { compileProjectionExecution } from "../../packages/runtime/src/evidence-execution.js";
import { reviewStoryMoments, rankStoryMoments } from "../../packages/runtime/src/story.js";
import { reviewPacketForRun, type ReviewProviderNodeState } from "../../packages/runtime/src/review-evidence.js";

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
function checkMap(text: string) {
  const section = text.split("**D3841 exact affected-source map — unaccepted author image:**")[1]!
    .split("**D3841 exact-version closure")[0]!;
  const rows = [...section.matchAll(/^\| `([^`]+@\d+)` \| `([^`]+@\d+)` \|/gmu)].map(match => [match[1]!, match[2]!] as const);
  assert.equal(rows.length, 14);
  assert.equal(new Set(rows.map(row => row[0])).size, 14);
  assert.equal(new Set(rows.map(row => row[1])).size, 14);
  const tupleRepairs = pivotalSuccessors.map(row => `${row.id}@1`);
  assert.deepEqual(rows.map(row => row[0]).sort(), [...failedRefs, ...tupleRepairs].sort());
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
const presentationDraft = readFileSync("rfc/evidence-presentation.md", "utf8");
const detailTable = presentationDraft.split("| Projection suffix after `derived.inspector.detail.` | Sole source | Proposed factory | Registered renderer |")[1]!.split("\n\n")[0]!;
const detailRefs = [...detailTable.matchAll(/^\| `([^`]+)` \|/gmu)].map(match => `derived.inspector.detail.${match[1]}@1`);
assert.equal(detailRefs.length, 6);
assert.equal(new Set([...mapped.topics, ...detailRefs]).size, 81);
console.log(JSON.stringify({ scope: "D3841 draft inventory requirements only, NOT compiled successor bindings",
  currentTopics: originalRefs.length, exactAffectedMappings: mapped.rows.length, originalExecutionFailures: failedRefs.length,
  additionalFixedTupleRepairs: pivotalSuccessors.length, unchangedTopics: originalRefs.length - mapped.rows.length,
  proposedTopics: mapped.topics.length, proposedAcceptedRefs: mapped.topics.length + detailRefs.length,
  negativeMapControls: 5, rankInputContract: "held_D3845", productionRegistration: false }));
