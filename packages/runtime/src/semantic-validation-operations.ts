/**
 * The closed production-operation registry (rfc/semantic-validation-authority.md §4.3).
 *
 * Each versioned operation id maps to one production export already used by the application, its
 * result adapter, its implementation entry files (whose static import closure is digested by the
 * build) and one declared application reach. A case supplies only a serializable input; it cannot
 * replace the function. `compileSemanticEvidenceEvent` and `declareEvidence` are refused targets:
 * they check sealed structure after a predicate already decided what to emit.
 *
 * Never exported from the runtime barrel: it is imported by the validation runner, the build tool
 * and tests only.
 */
import { makeUci, parseUci } from "chessops/util";
import { normalizeMove } from "chessops/chess";

import { compileCandidatePopulation, CANDIDATE_EVENTS_SCOPE } from "./candidate-population.js";
import { PRIMARY_EVIDENCE_MANIFEST, STRUCTURAL_EVENT_FAMILIES, TRANSITION_GEOMETRY_EVENT_FAMILIES, TRANSITION_RULE_EVENT_FAMILIES } from "./evidence-catalog.js";
import type { DeclaredEvidence, VersionedEvidenceId } from "./evidence-contract.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { recordedSemanticPath } from "./recorded-semantic-path.js";
import { commitMove, createRun } from "./runtime.js";
import {
  breadthSemanticEvents,
  localSemanticEventClosure,
  selectSemanticEvidence,
  semanticDutyEvents,
  structuralSemanticEvents,
  pawnIslandSemanticEvents,
  transitionSemanticEvents,
  type SemanticEvidenceEvent,
} from "./semantic-evidence.js";
import {
  SemanticValidationError,
  semanticValidationOperationRef,
  type SemanticCompleteAlternativesInput,
  type SemanticEdgeInput,
  type SemanticRecordedPathInput,
  type SemanticRecordedSequenceInput,
  type SemanticSequenceFamily,
  type SemanticValidationOperationId,
  type SemanticValidationOperationInput,
  type SemanticValidationOperationRef,
  type SemanticValidationUnavailableReason,
} from "./semantic-validation.js";

// ---------------------------------------------------------------------------------------------
// §R1 The one observation/result algebra
// ---------------------------------------------------------------------------------------------

export type SemanticValidationObservation =
  | { readonly kind: "event"; readonly item: SemanticEvidenceEvent<unknown> }
  | { readonly kind: "reading"; readonly item: DeclaredEvidence<unknown> };

/** A projection whose own source abstained inside an otherwise completed invocation. */
export interface SemanticValidationProjectionAbstention {
  readonly projection: VersionedEvidenceId;
  readonly reason: SemanticValidationUnavailableReason;
}

/**
 * Closed result algebra (§4.2/R1; changelog 2026-09-24): `completed` additionally names every
 * projection whose own collector abstained, so one collector's typed abstention (the loose-piece
 * `invalid_turn_clone` arm) neither erases the whole edge nor becomes an empty target population.
 */
export type SemanticValidationOperationResult =
  | { readonly kind: "completed"; readonly observations: readonly SemanticValidationObservation[]; readonly abstentions: readonly SemanticValidationProjectionAbstention[] }
  | { readonly kind: "unavailable"; readonly reason: SemanticValidationUnavailableReason };

export type SemanticValidationApplicationReach =
  | { readonly kind: "direct"; readonly callers: readonly string[] }
  | { readonly kind: "exact_projection_multiset"; readonly through: SemanticValidationOperationRef; readonly projections: readonly VersionedEvidenceId[] }
  | { readonly kind: "required"; readonly owner: string; readonly discharge: string };

export type SemanticValidationPopulationProjection = "sampled_edges" | "recorded_paths" | "complete_alternatives" | "bounded_target_sources";

export interface SemanticValidationOperationDeclaration<K extends SemanticValidationOperationId = SemanticValidationOperationId> {
  readonly ref: SemanticValidationOperationRef<K>;
  /** The production export the adapter calls (never a compiler or mint helper). */
  readonly productionSymbol: string;
  /** Adapter name, digested with the implementation. */
  readonly resultAdapter: string;
  /** Entry files; the build digests their complete static local import closure. */
  readonly implementationEntries: readonly string[];
  readonly reach: SemanticValidationApplicationReach;
  readonly population: SemanticValidationPopulationProjection;
  readonly invoke: (input: SemanticValidationOperationInput<K>) => SemanticValidationOperationResult | Promise<SemanticValidationOperationResult>;
}

const ref = (id: string, version = 1): VersionedEvidenceId => Object.freeze({ id, version });
const completed = (events: readonly SemanticEvidenceEvent<unknown>[], abstentions: readonly SemanticValidationProjectionAbstention[] = []): SemanticValidationOperationResult => Object.freeze({ kind: "completed", observations: Object.freeze(events.map((item) => Object.freeze({ kind: "event" as const, item }))), abstentions: Object.freeze([...abstentions]) });
const unavailable = (reason: SemanticValidationUnavailableReason): SemanticValidationOperationResult => Object.freeze({ kind: "unavailable", reason });

/** Refused operation targets (§4.3): structure checks, not chess predicates. */
export const SEMANTIC_VALIDATION_FORBIDDEN_TARGETS: readonly string[] = Object.freeze(["compileSemanticEvidenceEvent", "declareEvidence"]);

// ---------------------------------------------------------------------------------------------
// Literal projection families of the narrower one-edge emitters
// ---------------------------------------------------------------------------------------------

export const STRUCTURAL_EDGE_PROJECTIONS: readonly VersionedEvidenceId[] = Object.freeze([
  ...STRUCTURAL_EVENT_FAMILIES.map((family) => ref(`rules.structural.event.${family}`)),
  ref("rules.structural.event.pawn_islands"),
]);
export const TRANSITION_EDGE_PROJECTIONS: readonly VersionedEvidenceId[] = Object.freeze([...TRANSITION_GEOMETRY_EVENT_FAMILIES, ...TRANSITION_RULE_EVENT_FAMILIES].map((family) => ref(`rules.transition.event.${family}`)));
export const BREADTH_EDGE_PROJECTIONS: readonly VersionedEvidenceId[] = Object.freeze([
  "rules.square.event.control", "rules.mobility.event.piece_destinations", "rules.pawn.event.dynamics", "derived.pawn.event.transitions",
  "derived.tactic.defender_exposure", "derived.material.event.role_asymmetry", "rules.king.event.zone_state", "derived.king.captured_zone_defender",
  "derived.activity.event.open_file_occupancy",
].map((id) => ref(id)));
export const DUTY_EDGE_PROJECTIONS: readonly VersionedEvidenceId[] = Object.freeze([ref("rules.tactic.event.defender_removed"), ref("rules.tactic.event.defender_duty_relocated")]);

// ---------------------------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------------------------

function localEdge(input: SemanticEdgeInput): SemanticValidationOperationResult {
  const closure = localSemanticEventClosure(input.beforeFen, input.moveUci, input.afterFen);
  // The closure publishes its typed loose-piece abstention; it is never erased to an empty list.
  return completed(closure.events, closure.abstentions.map((abstention) => {
    const [projectionId, projectionVersion] = abstention.projection.split("@") as [string, string];
    return Object.freeze({ projection: ref(projectionId, Number(projectionVersion)), reason: "source_predicate_unavailable" as const });
  }));
}

/** A contiguous recorded run built from exact edges; the production operation owns the path. */
function recordedRun(path: SemanticRecordedPathInput) {
  const first = path.edges[0]!;
  const at = "2026-09-24T00:00:00.000Z";
  let run = createRun({ id: `semantic-validation:${path.pathDigest.slice(0, 16)}`, packId: "semantic-validation", packDigest: `sha256:${"0".repeat(64)}`, startFen: first.beforeFen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  for (const edge of path.edges) run = commitMove(run, edge.moveUci, { at }).run;
  return run;
}

function recordedPathOperation(input: SemanticRecordedPathInput): SemanticValidationOperationResult {
  const run = recordedRun(input);
  const result = recordedSemanticPath(run, run.activeCursor.branchId);
  return result.kind === "available" ? completed(result.events) : unavailable("recorded_path_incomplete");
}

const SEQUENCE_PROJECTION: Readonly<Record<SemanticSequenceFamily, string>> = Object.freeze({
  trade_completed: "derived.exchange.trade_completed",
  pawn_contact_timing: "derived.pawn.sequence.contact_timing",
  harassment_pressure: "derived.pawn.sequence.harassment_pressure",
  defender_consequence: "derived.tactic.sequence.defender_consequence",
  deflection: "derived.tactic.deflection_observed",
  attraction: "derived.tactic.attraction_observed",
  line_clearance: "derived.tactic.line_blocker_clearance_observed",
  square_clearance: "derived.tactic.square_clearance_observed",
  interference: "derived.tactic.interference_observed",
  checking_zwischenzug: "derived.tactic.check_zwischenzug_observed",
  overload_exploitation: "derived.tactic.overload_exploitation_observed",
});

export const RECORDED_SEQUENCE_PROJECTIONS: readonly VersionedEvidenceId[] = Object.freeze(Object.values(SEQUENCE_PROJECTION).map((id) => ref(id, 2)));

/** The sequence dispatcher: one family's exact window over the sealed recorded path. */
function recordedSequenceOperation(input: SemanticRecordedSequenceInput): SemanticValidationOperationResult {
  const run = recordedRun(input.path);
  const result = recordedSemanticPath(run, run.activeCursor.branchId);
  if (result.kind !== "available") return unavailable("recorded_path_incomplete");
  const projection = SEQUENCE_PROJECTION[input.family];
  const startNodeId = result.pathNodeIds[input.fromPly];
  const window = result.windows.find((value) => value.projection.id === projection && value.startNodeId === startNodeId && value.horizon === input.horizon);
  if (window === undefined || window.status === "insufficient_continuation") return unavailable("recorded_path_incomplete");
  const ids = new Set(window.eventIds);
  return completed(result.events.filter((event) => ids.has(event.id)));
}

/**
 * Complete-alternative avoidance through the production selection over the compiled candidate
 * population. Its reach stays `required`: the D1716 subject-identity successor is unlanded.
 */
function completeAlternativesOperation(input: SemanticCompleteAlternativesInput): SemanticValidationOperationResult {
  const compiled = compileCandidatePopulation({ beforeFen: input.rootFen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
  if (compiled.kind !== "ready") return unavailable("complete_alternative_population_unavailable");
  const selection = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate"), { receipt: compiled.receipt, moveUci: input.played.moveUci });
  return completed(selection.selected.filter((fact) => fact.kind === "counterfactual_absence").map((fact) => fact.event));
}

// ---------------------------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------------------------

const LOCAL = semanticValidationOperationRef("runtime.semantic.local_edge");
const PATH = semanticValidationOperationRef("runtime.semantic.recorded_path");
const SEMANTIC_ENTRY = "packages/runtime/src/semantic-evidence.ts";

type Registry = { readonly [K in SemanticValidationOperationId]: SemanticValidationOperationDeclaration<K> };

export const SEMANTIC_VALIDATION_OPERATIONS: Registry = Object.freeze({
  "runtime.semantic.local_edge": Object.freeze({
    ref: LOCAL, productionSymbol: "localSemanticEventClosure", resultAdapter: "localEdge", implementationEntries: Object.freeze([SEMANTIC_ENTRY]),
    reach: Object.freeze({ kind: "direct" as const, callers: Object.freeze(["packages/runtime/src/candidate-population.ts", "packages/runtime/src/postcommit-nudge.ts"]) }),
    population: "sampled_edges" as const, invoke: localEdge,
  }),
  "runtime.semantic.structural_edge": Object.freeze({
    ref: semanticValidationOperationRef("runtime.semantic.structural_edge"), productionSymbol: "structuralSemanticEvents", resultAdapter: "structuralEdge", implementationEntries: Object.freeze([SEMANTIC_ENTRY]),
    reach: Object.freeze({ kind: "exact_projection_multiset" as const, through: LOCAL, projections: STRUCTURAL_EDGE_PROJECTIONS }),
    population: "sampled_edges" as const,
    invoke: (input: SemanticEdgeInput) => completed([...structuralSemanticEvents(input.beforeFen, input.moveUci, input.afterFen), ...pawnIslandSemanticEvents(input.beforeFen, input.moveUci, input.afterFen)]),
  }),
  "runtime.semantic.transition_edge": Object.freeze({
    ref: semanticValidationOperationRef("runtime.semantic.transition_edge"), productionSymbol: "transitionSemanticEvents", resultAdapter: "transitionEdge", implementationEntries: Object.freeze([SEMANTIC_ENTRY]),
    reach: Object.freeze({ kind: "exact_projection_multiset" as const, through: LOCAL, projections: TRANSITION_EDGE_PROJECTIONS }),
    population: "sampled_edges" as const,
    invoke: (input: SemanticEdgeInput) => completed(transitionSemanticEvents(input.beforeFen, input.moveUci, input.afterFen)),
  }),
  "runtime.semantic.breadth_edge": Object.freeze({
    ref: semanticValidationOperationRef("runtime.semantic.breadth_edge"), productionSymbol: "breadthSemanticEvents", resultAdapter: "breadthEdge", implementationEntries: Object.freeze([SEMANTIC_ENTRY]),
    reach: Object.freeze({ kind: "exact_projection_multiset" as const, through: LOCAL, projections: BREADTH_EDGE_PROJECTIONS }),
    population: "sampled_edges" as const,
    invoke: (input: SemanticEdgeInput) => completed(breadthSemanticEvents(input.beforeFen, input.moveUci, input.afterFen)),
  }),
  "runtime.semantic.duty_edge": Object.freeze({
    ref: semanticValidationOperationRef("runtime.semantic.duty_edge"), productionSymbol: "semanticDutyEvents", resultAdapter: "dutyEdge", implementationEntries: Object.freeze([SEMANTIC_ENTRY]),
    reach: Object.freeze({ kind: "exact_projection_multiset" as const, through: LOCAL, projections: DUTY_EDGE_PROJECTIONS }),
    population: "sampled_edges" as const,
    invoke: (input: SemanticEdgeInput) => completed(semanticDutyEvents(input.beforeFen, input.moveUci, input.afterFen)),
  }),
  "runtime.semantic.recorded_path": Object.freeze({
    ref: PATH, productionSymbol: "recordedSemanticPath", resultAdapter: "recordedPathOperation", implementationEntries: Object.freeze(["packages/runtime/src/recorded-semantic-path.ts"]),
    reach: Object.freeze({ kind: "direct" as const, callers: Object.freeze(["apps/server/src/recorded-semantic-path.ts"]) }),
    population: "recorded_paths" as const, invoke: recordedPathOperation,
  }),
  "runtime.semantic.recorded_sequence": Object.freeze({
    ref: semanticValidationOperationRef("runtime.semantic.recorded_sequence"), productionSymbol: "recordedSemanticPath", resultAdapter: "recordedSequenceOperation", implementationEntries: Object.freeze(["packages/runtime/src/recorded-semantic-path.ts"]),
    reach: Object.freeze({ kind: "exact_projection_multiset" as const, through: PATH, projections: RECORDED_SEQUENCE_PROJECTIONS }),
    population: "recorded_paths" as const, invoke: recordedSequenceOperation,
  }),
  "runtime.semantic.complete_alternatives": Object.freeze({
    ref: semanticValidationOperationRef("runtime.semantic.complete_alternatives"), productionSymbol: "selectSemanticEvidence", resultAdapter: "completeAlternativesOperation", implementationEntries: Object.freeze([SEMANTIC_ENTRY, "packages/runtime/src/candidate-population.ts"]),
    reach: Object.freeze({ kind: "required" as const, owner: "D1716", discharge: "The avoidance subject/outcome identity successor is unlanded; the current projection-and-sign relation is known unsound, so no avoidance event can pass through this operation." }),
    population: "complete_alternatives" as const, invoke: completeAlternativesOperation,
  }),
}) as Registry;

// ---------------------------------------------------------------------------------------------
// Subject → population operation (§5.1): each operation names exactly one compatible population
// ---------------------------------------------------------------------------------------------

/** v1 multi-edge window events: no production operation emits them (only their v2 successors). */
export const V1_WINDOW_EVENT_IDS: readonly string[] = Object.freeze(Object.values(SEQUENCE_PROJECTION));

export interface SemanticValidationBlockedFamily {
  readonly owner: string;
  readonly discharge: string;
  readonly matches: (projection: VersionedEvidenceId) => boolean;
}

/** Families whose accepted successors are unlanded: every arm abstains, named by owner. */
export const SEMANTIC_VALIDATION_BLOCKED_FAMILIES: readonly SemanticValidationBlockedFamily[] = Object.freeze([
  Object.freeze({ owner: "D1716", discharge: "avoidance subject/outcome identity successor (semantic-validation D1): the projection-and-sign-only relation is known unsound", matches: (projection: VersionedEvidenceId) => projection.id.startsWith("derived.semantic_avoidance.") }),
  Object.freeze({ owner: "D1717", discharge: "blocker-blind king opposition successor (semantic-validation D2): distant opposition ignores occupied intervening squares", matches: (projection: VersionedEvidenceId) => projection.id === "rules.structural.event.king_opposition" }),
]);

export function semanticValidationBlockedFamily(projection: VersionedEvidenceId): SemanticValidationBlockedFamily | undefined {
  return SEMANTIC_VALIDATION_BLOCKED_FAMILIES.find((family) => family.matches(projection));
}

/** The operation whose population execution census a subject's imported-population arm names. */
export function semanticValidationPopulationOperation(subject: { readonly kind: "event" | "reading"; readonly projection: VersionedEvidenceId }): SemanticValidationOperationId | undefined {
  const { projection } = subject;
  if (semanticValidationBlockedFamily(projection) !== undefined) return undefined;
  if (projection.version === 2 && RECORDED_SEQUENCE_PROJECTIONS.some((value) => value.id === projection.id)) return "runtime.semantic.recorded_path";
  if (subject.kind === "event" && projection.version === 1 && !V1_WINDOW_EVENT_IDS.includes(projection.id)) return "runtime.semantic.local_edge";
  return undefined;
}

/** Canonical successor of an edge input (used by fixture validation and mirror partners). */
export function canonicalSemanticEdge(input: SemanticEdgeInput): SemanticEdgeInput {
  const position = positionFromFen(input.beforeFen);
  const beforeFen = canonicalFen(position);
  const parsed = parseUci(input.moveUci);
  if (parsed === undefined) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `move ${input.moveUci} is not a UCI`);
  const move = normalizeMove(position, parsed);
  if (!position.isLegal(move)) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `move ${input.moveUci} is illegal in ${beforeFen}`);
  const child = position.clone();
  child.play(move);
  return Object.freeze({ kind: "edge", beforeFen, moveUci: makeUci(move), afterFen: canonicalFen(child) });
}
