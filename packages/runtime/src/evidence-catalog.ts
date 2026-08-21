import { STRUCTURAL_FEATURE_KINDS, TRANSITION_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";

import type {
  AdapterDeclaration,
  AnswerDistance,
  ConsumerDeclaration,
  EvidenceContractDeclarations,
  EvidenceDispositionDeclaration,
  EvidenceForm,
  EvidenceGrounding,
  EvidencePlane,
  EvidenceRole,
  EvidenceTiming,
  ProducerDeclaration,
  ProjectionDeclaration,
  ProjectionRole,
  ProviderOffBehavior,
  VersionedEvidenceId,
} from "./evidence-contract.js";

const ref = (id: string): VersionedEvidenceId => Object.freeze({ id, version: 1 });
const retired = (reason: string): EvidenceDispositionDeclaration => Object.freeze({ kind: "retired", reason });
const producer = (id: string, plane: EvidencePlane, implementation: string, availability: ProducerDeclaration["availability"], outputs: readonly ProjectionDeclaration[]): ProducerDeclaration => Object.freeze({ id, version: 1, plane, implementation, availability, latency: availability === "provider" ? "interactive" : availability === "build_time" ? "offline" : "sync", outputs: Object.freeze(outputs) });

interface ProjectionOptions {
  readonly role?: ProjectionRole;
  readonly grounding?: EvidenceGrounding;
  readonly payloadType?: string;
  readonly semantics?: string;
  readonly operands?: readonly string[];
  readonly signs?: ProjectionDeclaration["signs"];
  readonly exactness?: ProjectionDeclaration["exactness"];
  readonly confidence?: ProjectionDeclaration["confidence"];
  readonly abstention?: ProjectionDeclaration["abstention"];
  readonly answerContent?: readonly AnswerDistance[];
  readonly forms?: readonly EvidenceForm[];
  readonly dependsOn?: readonly VersionedEvidenceId[];
  readonly limitations?: readonly string[];
  readonly disposition?: EvidenceDispositionDeclaration;
}

function projection(producerId: string, id: string, plane: EvidencePlane, options: ProjectionOptions = {}): ProjectionDeclaration {
  const signs: ProjectionDeclaration["signs"] = options.signs ?? ["state"];
  const answers: readonly AnswerDistance[] = options.answerContent ?? ["fact"];
  const forms: readonly EvidenceForm[] = options.forms ?? ["list", "panel"];
  return Object.freeze({
    id,
    version: 1,
    producer: ref(producerId),
    role: options.role ?? "reading",
    plane,
    payloadType: options.payloadType ?? "unknown",
    semantics: options.semantics ?? `${id} retains the source implementation's documented literal value.`,
    operands: Object.freeze(options.operands ?? []),
    signs: Object.freeze(signs),
    grounding: options.grounding ?? "position_rules",
    exactness: options.exactness ?? "exact",
    confidence: options.confidence ?? "not_applicable",
    abstention: Object.freeze(options.abstention ?? { possible: false, reasons: Object.freeze([]) }),
    answerContent: Object.freeze(answers),
    forms: Object.freeze(forms),
    dependsOn: Object.freeze(options.dependsOn ?? []),
    limitations: Object.freeze(options.limitations ?? []),
    ...(options.disposition === undefined ? {} : { disposition: options.disposition }),
  });
}

export const EVIDENCE_PRODUCER_IDS = Object.freeze([
  "rules.structural", "rules.transition", "rules.phase", "rules.pivotal", "rules.endgame",
  "theory.shapes", "pack.authored", "recorded.engine", "recorded.tablebase", "live.stockfish",
  "live.syzygy", "human.maia", "human.explorer", "theory.opening_identity",
] as const);

export const CURRENT_CONSUMER_OPERATION_IDS = Object.freeze([
  "authoring.predicate", "runtime.objective_condition", "runtime.guard_condition", "guidance.packet",
  "guidance.deterministic", "guidance.voice", "guidance.recorded_reading", "runtime.evidence_ref",
  "inspector.position_structure", "inspector.move_transition", "board.selected_square_sight",
  "theory.shape_firing", "compare.structure_strip", "compare.engine_trajectory", "inspector.human_split",
  "inspector.corpus", "analysis.engine", "opponent.selection", "guidance.authored_claim",
  "board.pivotal_marker", "review.story", "runtime.repertoire_scan", "authoring.claim_binding",
] as const);

export const EVIDENCE_CONSUMER_IDS = Object.freeze([...CURRENT_CONSUMER_OPERATION_IDS, "assistance.arrows"] as const);

const STRUCTURAL_READER_WITNESSES = Object.freeze(STRUCTURAL_FEATURE_KINDS.filter((kind) => kind !== "pawn_count"));
const TRANSITION_READING_LEAVES = Object.freeze([
  "attacked_squares_changed.gained", "attacked_squares_changed.lost",
  "defended_squares_changed.gained", "defended_squares_changed.lost",
  "slider_lines_changed.opened", "slider_lines_changed.closed",
  "escape_squares_changed.gained", "escape_squares_changed.lost",
  "defended_duties_changed.acquired", "defended_duties_changed.released",
  "move_irreversibility.castled", "move_irreversibility.clock_zeroed",
  "move_irreversibility.last_of_role", "move_irreversibility.pawn_break",
] as const);

export const STRUCTURAL_PREDICATE_PROJECTION_IDS = Object.freeze(STRUCTURAL_FEATURE_KINDS.map((kind) => `rules.structural.predicate.${kind}`));
export const STRUCTURAL_READING_PROJECTION_IDS = Object.freeze(STRUCTURAL_FEATURE_KINDS.map((kind) => `rules.structural.reading.${kind}`));
export const TRANSITION_READING_PROJECTION_IDS = Object.freeze(TRANSITION_READING_LEAVES.map((leaf) => `rules.transition.reading.${leaf}`));

const structuralOutputs = [
  ...STRUCTURAL_FEATURE_KINDS.map((kind) => projection("rules.structural", `rules.structural.predicate.${kind}`, "rules", {
    role: "predicate",
    payloadType: "StructuralExpression",
    semantics: `Boolean authored-condition predicate for structural family ${kind}.`,
    operands: ["fen", "expression"],
    forms: ["machine_condition"],
    dependsOn: kind === "outpost" ? [ref("rules.structural.predicate.pawn_safe_square")] : [],
    limitations: kind === "pawn_safe_square" ? ["Enemy-pawn projection is a Tabiya convention, not legal-move safety."] : [],
  })),
  ...STRUCTURAL_FEATURE_KINDS.map((kind) => projection("rules.structural", `rules.structural.reading.${kind}`, "rules", {
    payloadType: "StructuralObservation",
    semantics: `Position reading emitted by structuralReading for family ${kind}.`,
    operands: kind === "named_structure" ? ["fen", "structure_id"] : ["fen"],
    forms: kind === "named_structure" ? ["sentence", "list", "panel", "lit_squares", "piece_halo"] : ["list", "panel", "lit_squares", "piece_halo"],
    limitations: kind === "pawn_count" ? ["The committed emission census reports zero observations; structuralReading cannot emit this kind."] : ["State alone does not establish relevance or learner valence."],
    ...(kind === "pawn_count" ? { disposition: retired("Zero emitted observations over the executable committed-corpus census; matcher-only at F1.") } : {}),
  })),
];

const transitionOutputs = TRANSITION_READING_LEAVES.map((leaf) => projection("rules.transition", `rules.transition.reading.${leaf}`, "transition", {
  payloadType: "TransitionObservation",
  semantics: `Count/direction transition reading for ${leaf}.`,
  operands: ["before_fen", "move_uci", "after_fen", "count"],
  signs: leaf.endsWith("gained") || leaf.endsWith("acquired") || leaf.endsWith("opened") ? ["gained"] : leaf.endsWith("lost") || leaf.endsWith("released") || leaf.endsWith("closed") ? ["lost"] : ["state"],
  forms: ["sentence", "list", "panel"],
  limitations: ["Affected square, subject and object identities are not retained; this projection is not a semantic learner event."],
}));

export const EVIDENCE_PRODUCERS: readonly ProducerDeclaration[] = Object.freeze([
  producer("rules.structural", "rules", "packages/runtime/src/structure.ts", "local", structuralOutputs),
  producer("rules.transition", "transition", "packages/runtime/src/transition.ts", "local", transitionOutputs),
  producer("rules.phase", "rules", "packages/runtime/src/phase.ts", "local", [projection("rules.phase", "rules.phase.reading", "rules", { payloadType: "PhaseReading", forms: ["sentence", "panel"] })]),
  producer("rules.pivotal", "rules", "packages/runtime/src/pivotal.ts", "local", [projection("rules.pivotal", "rules.pivotal.marker", "rules", { payloadType: "PivotalMarker", forms: ["timeline_marker", "sentence", "panel"] })]),
  producer("rules.endgame", "rules", "packages/runtime/src/endgame.ts", "local", [projection("rules.endgame", "rules.endgame.reading", "rules", { payloadType: "EndgameReading", forms: ["sentence", "panel"] })]),
  producer("theory.shapes", "theory", "packages/runtime/src/shape-firing.ts; apps/server/src/shape-registry.ts", "local", [projection("theory.shapes", "theory.shapes.firing", "theory", { payloadType: "ShapeFiring", grounding: "authored_claim", exactness: "authored", answerContent: ["pattern", "theory", "plan"], forms: ["sentence", "panel", "timeline_marker"], limitations: ["A trigger match does not infer an uncited strategic consequence."] })]),
  producer("pack.authored", "authored", "apps/server/src/authored-feedback.ts", "recorded", [projection("pack.authored", "pack.authored.claim", "authored", { payloadType: "AuthoredFeedbackItem", grounding: "authored_claim", exactness: "authored", answerContent: ["fact", "pattern", "theory", "principle", "plan"], forms: ["sentence", "panel"] })]),
  producer("recorded.engine", "search", "apps/server/src/position-evidence.ts", "recorded", [projection("recorded.engine", "recorded.engine.eval", "search", { role: "source_record", payloadType: "EngineReadingValues", grounding: "bounded_search", exactness: "measured", confidence: "reported", answerContent: ["evaluation"], forms: ["sentence", "panel"], limitations: ["Single-line recorded score only; best move and principal variation are absent."] })]),
  producer("recorded.tablebase", "search", "apps/server/src/position-evidence.ts", "recorded", [projection("recorded.tablebase", "recorded.tablebase.result", "search", { role: "source_record", payloadType: "TablebaseReadingValues", grounding: "tablebase_exact", answerContent: ["fact", "evaluation"], forms: ["sentence", "panel"], abstention: { possible: true, reasons: ["outside_tablebase_domain"] } })]),
  producer("live.stockfish", "search", "apps/server/src/evidence-queue.ts; apps/server/src/rest.ts", "provider", [
    projection("live.stockfish", "live.stockfish.eval", "search", { role: "event", payloadType: "EvidencePayload.eval", grounding: "bounded_search", exactness: "measured", confidence: "reported", answerContent: ["evaluation"], forms: ["panel", "machine_condition"], abstention: { possible: true, reasons: ["provider_unavailable"] }, limitations: ["Adapter excludes bestMoveUci from fact-only consumers."] }),
    projection("live.stockfish", "live.stockfish.wdl", "search", { role: "event", payloadType: "EvidencePayload.wdl", grounding: "bounded_search", exactness: "measured", confidence: "reported", answerContent: ["evaluation"], forms: ["panel", "machine_condition"], abstention: { possible: true, reasons: ["provider_unavailable"] } }),
    projection("live.stockfish", "live.stockfish.pv", "search", { role: "event", payloadType: "EvidencePayload.bestline", grounding: "bounded_search", exactness: "measured", confidence: "reported", answerContent: ["move", "principal_variation"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["provider_unavailable"] }, limitations: ["Explicit Analyze consumer only; never a guidance binding."] }),
  ]),
  producer("live.syzygy", "search", "apps/server/src/tablebase.ts; apps/server/src/evidence-queue.ts", "provider", [
    projection("live.syzygy", "live.syzygy.category", "search", { role: "event", payloadType: "Tablebase category", grounding: "tablebase_exact", answerContent: ["fact", "evaluation"], forms: ["panel", "machine_condition"], abstention: { possible: true, reasons: ["outside_tablebase_domain", "provider_unavailable"] } }),
    projection("live.syzygy", "live.syzygy.distance", "search", { role: "event", payloadType: "Tablebase distances", grounding: "tablebase_exact", answerContent: ["fact", "evaluation"], forms: ["panel", "machine_condition"], abstention: { possible: true, reasons: ["outside_tablebase_domain", "provider_unavailable"] }, limitations: ["Distance is a measurement; no optimality-boundary verdict is inferred."] }),
  ]),
  producer("human.maia", "human", "apps/server/src/opponent-selector.ts; apps/server/src/rest.ts", "provider", [projection("human.maia", "human.maia.policy", "human", { role: "source_record", payloadType: "HumanSplitPage", grounding: "human_model", exactness: "measured", confidence: "reported", answerContent: ["candidate_moves"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["provider_unavailable", "model_failure"] }, limitations: ["Policy mass describes model choice, not move quality."] })]),
  producer("human.explorer", "human", "apps/server/src/corpus.ts; apps/server/src/rest.ts", "provider", [projection("human.explorer", "human.explorer.population", "human", { role: "source_record", payloadType: "CorpusPage", grounding: "human_corpus", exactness: "measured", confidence: "reported", answerContent: ["fact", "candidate_moves"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["source_unavailable", "empty_population"] }, limitations: ["Population counts do not grade or recommend a move."] })]),
  producer("theory.opening_identity", "theory", "apps/server/src/sourcing/openings.ts", "build_time", [projection("theory.opening_identity", "theory.opening_identity.record", "theory", { role: "source_record", payloadType: "opening_identity EvidenceRecord", grounding: "cited_theory", exactness: "measured", confidence: "reported", answerContent: ["theory"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["no_catalogue_match"] }, limitations: ["Authoring provenance only at F1; not a runtime guidance sentence."] })]),
]);

interface ConsumerSpec {
  readonly id: string;
  readonly implementation: string;
  readonly projections?: readonly string[];
  readonly timing?: ConsumerDeclaration["timing"];
  readonly roles?: ConsumerDeclaration["roles"];
  readonly sessions?: readonly string[];
  readonly forms?: readonly EvidenceForm[];
  readonly answerContent?: readonly AnswerDistance[];
  readonly latency?: ConsumerDeclaration["latency"];
  readonly budget?: ConsumerDeclaration["budget"];
  readonly providerOff?: ProviderOffBehavior;
  readonly disposition?: EvidenceDispositionDeclaration;
}

const DEFAULT_TIMING: readonly EvidenceTiming[] = Object.freeze(["postcommit", "checkpoint", "attempt_end", "terminal", "review", "analysis"]);
const DEFAULT_ROLES: readonly EvidenceRole[] = Object.freeze(["learner", "host", "participant", "spectator", "author", "operator"]);
const DEFAULT_SESSIONS: readonly string[] = Object.freeze(["pack", "position", "imported"]);
const DEFAULT_FORMS: readonly EvidenceForm[] = Object.freeze(["list", "panel"]);
const DEFAULT_ANSWERS: readonly AnswerDistance[] = Object.freeze(["fact"]);
const DEFAULT_LATENCY: ConsumerDeclaration["latency"] = Object.freeze({ mode: "interactive", maxMs: 4_000 });
const DEFAULT_BUDGET: ConsumerDeclaration["budget"] = Object.freeze({ maxFacts: 64, maxForms: 4 });

const allPredicateIds = STRUCTURAL_PREDICATE_PROJECTION_IDS;
const allStructuralReadingIds = STRUCTURAL_READING_PROJECTION_IDS.filter((id) => !id.endsWith(".pawn_count"));
const allTransitionReadingIds = TRANSITION_READING_PROJECTION_IDS;
const CONSUMER_SPECS: readonly ConsumerSpec[] = [
  { id: "authoring.predicate", implementation: "matchesStructuralExpression; validators; expression census", projections: allPredicateIds, timing: ["analysis"], roles: ["author"], forms: ["machine_condition"], answerContent: ["fact"] },
  { id: "runtime.objective_condition", implementation: "packages/runtime/src/objective.ts; apps/server/src/pack-orchestrator.ts", projections: [...allPredicateIds, "live.stockfish.eval", "live.syzygy.category"], forms: ["machine_condition"], answerContent: ["fact", "evaluation"] },
  { id: "runtime.guard_condition", implementation: "packages/runtime/src/guard.ts", projections: ["live.stockfish.eval", "live.syzygy.category", "live.syzygy.distance"], forms: ["machine_condition"], answerContent: ["fact", "evaluation"] },
  { id: "guidance.packet", implementation: "apps/server/src/guidance.ts:evidencePacket", disposition: { kind: "operator_only", reason: "Internal typed transport aggregate; it is never passed wholesale to a renderer." } },
  { id: "guidance.deterministic", implementation: "apps/server/src/guidance.ts sentence assembly", projections: ["rules.phase.reading", "rules.structural.reading.named_structure", "rules.pivotal.marker", "rules.endgame.reading", "pack.authored.claim"], forms: ["sentence"], answerContent: ["fact", "pattern", "theory", "principle", "plan"] },
  { id: "guidance.voice", implementation: "renderVoice; voiceCheck; external-voice.ts", projections: ["rules.phase.reading", "rules.structural.reading.named_structure", "rules.pivotal.marker", "rules.endgame.reading", "pack.authored.claim"], forms: ["sentence", "audio"], answerContent: ["fact", "pattern", "theory", "principle", "plan"], providerOff: "available" },
  { id: "guidance.recorded_reading", implementation: "appendRecordedReadings; renderRecordedReading", projections: ["recorded.engine.eval", "recorded.tablebase.result"], timing: ["postcommit", "checkpoint", "attempt_end", "terminal", "review"], forms: ["sentence"], answerContent: ["fact", "evaluation"] },
  { id: "runtime.evidence_ref", implementation: "packages/runtime/src/evidence-ref.ts; apps/web/src/lib/evidence-sentences.ts", projections: [...allPredicateIds, ...TRANSITION_READING_PROJECTION_IDS, "live.stockfish.eval", "live.syzygy.category", "pack.authored.claim"], forms: ["sentence", "machine_condition"], answerContent: ["fact", "evaluation"] },
  { id: "inspector.position_structure", implementation: "apps/web/src/lib/DrillScreen.svelte structural section", projections: allStructuralReadingIds },
  { id: "inspector.move_transition", implementation: "apps/web/src/lib/DrillScreen.svelte What changed section", projections: allTransitionReadingIds },
  { id: "board.selected_square_sight", implementation: "DrillScreen.svelte:selectedObservations; boardOverlays", projections: allStructuralReadingIds, timing: ["precommit", "postcommit"], forms: ["lit_squares", "piece_halo"], answerContent: ["fact"], budget: { maxFacts: 16, maxForms: 2 } },
  { id: "theory.shape_firing", implementation: "shapeFirings; ShapePanel.svelte", projections: ["theory.shapes.firing"], forms: ["sentence", "panel", "timeline_marker"], answerContent: ["pattern", "theory", "plan"] },
  { id: "compare.structure_strip", implementation: "compare-strips.ts; CompareView.svelte", projections: allStructuralReadingIds, timing: ["review"], forms: ["list", "panel"], answerContent: ["fact"] },
  { id: "compare.engine_trajectory", implementation: "CompareView.svelte trajectory evidence", projections: ["live.stockfish.eval", "live.stockfish.wdl"], timing: ["review"], forms: ["list", "panel"], answerContent: ["evaluation"] },
  { id: "inspector.human_split", implementation: "rest.ts human-split; DrillScreen.svelte", projections: ["human.maia.policy"], timing: ["postcommit", "review", "analysis"], forms: ["list", "panel"], answerContent: ["candidate_moves"], providerOff: "unavailable" },
  { id: "inspector.corpus", implementation: "rest.ts corpus; renderCorpusPage; DrillScreen.svelte", projections: ["human.explorer.population"], timing: ["postcommit", "review", "analysis"], forms: ["list", "panel"], answerContent: ["fact", "candidate_moves"], providerOff: "honest_empty" },
  { id: "analysis.engine", implementation: "rest.ts /analysis; service.analysis; evidence jobs", projections: ["live.stockfish.eval", "live.stockfish.wdl", "live.stockfish.pv", "live.syzygy.category", "live.syzygy.distance"], timing: ["analysis"], forms: ["list", "panel"], answerContent: ["fact", "evaluation", "move", "principal_variation"], budget: { maxFacts: null, maxForms: null }, providerOff: "unavailable" },
  { id: "opponent.selection", implementation: "selectMove; opponent-selector", projections: ["human.maia.policy", "live.stockfish.pv", "live.syzygy.category", "live.syzygy.distance"], timing: ["analysis"], roles: ["operator"], forms: ["list", "panel"], answerContent: ["fact", "evaluation", "candidate_moves", "move", "principal_variation"], budget: { maxFacts: null, maxForms: null }, providerOff: "unavailable" },
  { id: "guidance.authored_claim", implementation: "claim-presentation.ts; CheckpointSheet.svelte; TerminalSheet.svelte", projections: ["pack.authored.claim"], forms: ["sentence", "panel"], answerContent: ["fact", "pattern", "theory", "principle", "plan"] },
  { id: "board.pivotal_marker", implementation: "DrillScreen.svelte; renderPivotalMarker", projections: ["rules.pivotal.marker"], forms: ["timeline_marker", "sentence", "panel"], answerContent: ["fact"] },
  { id: "review.story", implementation: "storyMoments; service.story; GameStoryScreen.svelte", projections: ["rules.pivotal.marker", "theory.shapes.firing", "live.stockfish.eval"], timing: ["review"], roles: ["learner", "host", "participant", "spectator"], forms: ["sentence", "timeline_marker", "panel"], answerContent: ["fact", "pattern", "evaluation"] },
  { id: "runtime.repertoire_scan", implementation: "repertoire.ts:scanRepertoire; corpusPopulation", projections: ["human.explorer.population"], timing: ["analysis"], roles: ["operator"], forms: ["list", "panel"], answerContent: ["fact"], budget: { maxFacts: null, maxForms: null }, providerOff: "honest_empty" },
  { id: "authoring.claim_binding", implementation: "sourcing/claim-binding.ts:validateClaimBindings", projections: ["recorded.engine.eval", "recorded.tablebase.result", "human.explorer.population", "theory.opening_identity.record"], timing: ["analysis"], roles: ["author"], forms: ["list", "panel"], answerContent: ["fact", "theory", "evaluation"], latency: { mode: "offline", maxMs: null }, budget: { maxFacts: null, maxForms: null }, providerOff: "honest_empty" },
  { id: "assistance.arrows", implementation: "apps/web/src/lib/assistance-preference.ts; AssistanceSettings.svelte", disposition: { kind: "experimental", reason: "D546: migrated preference has no producer and no renderer; F5 or an owner ruling decides activation or retirement." } },
];

export const EVIDENCE_CONSUMERS: readonly ConsumerDeclaration[] = Object.freeze(CONSUMER_SPECS.map((spec) => Object.freeze({
  id: spec.id,
  version: 1,
  implementation: spec.implementation,
  accepts: Object.freeze((spec.projections ?? []).map(ref)),
  timing: Object.freeze(spec.timing ?? DEFAULT_TIMING),
  roles: Object.freeze(spec.roles ?? DEFAULT_ROLES),
  sessions: Object.freeze(spec.sessions ?? DEFAULT_SESSIONS),
  forms: Object.freeze(spec.forms ?? DEFAULT_FORMS),
  answerContent: Object.freeze(spec.answerContent ?? DEFAULT_ANSWERS),
  latency: Object.freeze(spec.latency ?? DEFAULT_LATENCY),
  budget: Object.freeze(spec.budget ?? DEFAULT_BUDGET),
  providerOff: spec.providerOff ?? "available",
  ...(spec.disposition === undefined ? {} : { disposition: Object.freeze(spec.disposition) }),
})));

const producerByProjection = new Map(EVIDENCE_PRODUCERS.flatMap((item) => item.outputs.map((output) => [output.id, item] as const)));

export const EVIDENCE_ADAPTERS: readonly AdapterDeclaration[] = Object.freeze(CONSUMER_SPECS.flatMap((spec) => (spec.projections ?? []).map((projectionId, index) => {
  const source = producerByProjection.get(projectionId);
  if (source === undefined) throw new TypeError(`Catalogue consumer ${spec.id} names missing projection ${projectionId}`);
  const projectionValue = source.outputs.find((value) => value.id === projectionId)!;
  const forms = (spec.forms ?? DEFAULT_FORMS).filter((form) => projectionValue.forms.includes(form));
  const answers = (spec.answerContent ?? DEFAULT_ANSWERS).filter((answer) => projectionValue.answerContent.includes(answer));
  return Object.freeze({
    id: `adapter.${spec.id}.${index + 1}`,
    version: 1,
    implementation: spec.implementation,
    producer: ref(source.id),
    projection: ref(projectionId),
    consumer: ref(spec.id),
    timing: Object.freeze(spec.timing ?? DEFAULT_TIMING),
    roles: Object.freeze(spec.roles ?? DEFAULT_ROLES),
    sessions: Object.freeze(spec.sessions ?? DEFAULT_SESSIONS),
    forms: Object.freeze(forms.length === 0 ? [projectionValue.forms[0]!] : forms),
    answerContent: Object.freeze(answers.length === 0 ? [projectionValue.answerContent[0]!] : answers),
    latency: Object.freeze(spec.latency ?? DEFAULT_LATENCY),
    budget: Object.freeze(spec.budget ?? DEFAULT_BUDGET),
    ...(source.availability === "provider" ? { providerOff: spec.providerOff ?? "available" } : {}),
  });
})));

export const EVIDENCE_CONTRACT_DECLARATIONS: EvidenceContractDeclarations = Object.freeze({
  producers: EVIDENCE_PRODUCERS,
  consumers: EVIDENCE_CONSUMERS,
  adapters: EVIDENCE_ADAPTERS,
});
