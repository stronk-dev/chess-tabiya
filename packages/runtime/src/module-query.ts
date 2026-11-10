// rfc/module-registration.md §2.5.2/§5 + rfc/evidence-presentation.md Checkpoint B +
// rfc/intent-presets.md Checkpoint B — the one module query operation (`RunService.queryModules`).
//
// For one run, one timing subject and the FINALIZED assistance (the digest-bound output of the
// preset compiler), it delivers exactly the modules that compilation made effective at that timing:
// proactive modules automatically, on-request/explicit modules only when the request names their
// opened door. Per module it:
//   1. acquires the module's sealed sources for the timing subject (the exact value routes — no
//      module invokes a raw detector or provider directly; §2.5),
//   2. runs `compileModulePacket` (admission, reducers, novelty, fact backstop),
//   3. re-admits the survivors for the module consumer and presents them through the exact
//      pair-keyed adapters (`presentEvidenceItems`) into sealed components,
//   4. fits the post-adapter budget over atomic fact bundles (`fitModulePresentation`, §5.1), and
//   5. seals a `presentation.receipt@1` plus a `ModuleDisclosureReceipt` that binds the run, the
//      decision stamp, the subject, the module, the requested and effective (final) assistance
//      digests and the ordered component digests.
// Nothing here renders prose of its own: every learner string is a registered renderer's output.

import type { Color, SquareName } from "chessops/types";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import type { FinalizedAssistanceV1 } from "./assistance-exchange.js";
import { branchPath } from "./branch-path.js";
import { presentationWordCount as words } from "./presentation-word-count.js";
import { compareBranches, type BranchComparison } from "./compare.js";
import { ENDGAME_SETUP_CONVENTIONS } from "./endgame-setup.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { compileEvidenceConsumerExecution, compileEvidenceConsumerExecutionV2 } from "./evidence-binding-execution.js";
import { collectComparisonStructuralPopulation } from "./comparison-structural-population.js";
import { recordedComparisonData, recordedComparisonColumnsForSubject, type RecordedComparisonSource } from "./recorded-comparison.js";
import { recordedComparisonEvalTrail } from "./recorded-comparison-eval.js";
import { readRecordedComparisonPointSource, type RecordedComparisonPointSource } from "./recorded-comparison-point.js";
import { digestRunEvidenceItem, resolveRunSubject } from "./run-subject.js";
import { evidenceDigest } from "./evidence-contract.js";
import type { OpeningCatalogueAvailability } from "./opening-catalogue.js";
import { assertRecordedPositionInvocation, readRecordedOpeningPointResult } from "./internal/evidence-value-routes.js";
import { assertDeclaredEvidence, evidenceForConsumer, evidenceValueReceipt, type DeclaredEvidence, type EvidenceRole, type VersionedEvidenceId } from "./evidence-contract.js";
import type { AuthoredFeedbackItemRecord } from "./evidence-factories.js";
import { feedbackDeliveryOpen } from "./feedback.js";
import { exactLegalMoves, exactMoveDestination } from "./legal-moves.js";
import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { MODULE_QUERY_OPERATION, SIGHT_SOURCE_ROUTES } from "./module-query-sources.js";
import { MODULE_IDS, type InspectorFamilyId, type ModuleBudgets, type ModuleId, type ModuleTiming } from "./module-contract.js";
import { compileModulePacket } from "./module-packets.js";
import { MODULE_CONSUMER_ACCEPTS, MODULE_OPERATIONS, MODULE_REGISTRY, moduleDeclaration } from "./module-registry.js";
import { NULL_REDUCTION_QUALITY_RECORDER, type ModuleFact, type ReductionQualityRecorder } from "./module-reducers.js";
import {
  presentEvidenceItems,
  presentationDigest,
  presentedSentence,
  presentedItemOwner,
  serializePresentedEvidence,
  type PresentationReceipt,
  type PresentedEvidenceItem,
} from "./presentation-contract.js";
import { hasKingZoneWitness, hasPostcommitChangeWitness, postcommitEdgeEvidence, postcommitSubjectBranch } from "./postcommit-nudge.js";
import type { RecordedGradeSource } from "./recorded-grade-source.js";
import { collectRecordedSequenceWindow, type prepareRecordedSemanticWindowPopulation } from "./recorded-sequence-window.js";
import { readRegisteredShapeScan, type RegisteredShapeScan } from "./internal/registered-shape-scan.js";
import { readCurrentShapeFiringInvocation } from "./internal/evidence-value-routes.js";
import type { DrillRun, Node } from "./types.js";
import { transposeKey } from "./chess.js";
import { moduleDecisionStamp, type ModuleDecisionStamp } from "./module-decision.js";
export { moduleDecisionStamp, type ModuleDecisionStamp } from "./module-decision.js";
import type { ExplorerPopulationSummary } from "./explorer-summary.js";

export const MODULE_QUERY_PROTOCOL = "module.query_page@1" as const;

// ---------------------------------------------------------------------------------------------
// The closed request union (§2.5.2), plus the opened on-request doors
// ---------------------------------------------------------------------------------------------

/**
 * Inline correction (2026-09-24): the §2.5.2 request union carries no module list, so an on-request
 * module could only render by being queried unsolicited. `requested` names exactly the on-request
 * or explicit doors the learner opened for this subject; proactive modules never need naming.
 */
export type ModuleQueryRequest =
  | { readonly timing: "pre_commit"; readonly nodeId: string; readonly selectedSquare?: string; readonly requested: readonly ModuleId[] }
  | { readonly timing: "at_commit"; readonly nodeId: string; readonly candidateUci: string; readonly generation: number }
  | { readonly timing: "post_commit"; readonly subjectNodeId: string; readonly requested: readonly ModuleId[] }
  | { readonly timing: "checkpoint"; readonly nodeId: string; readonly requested: readonly ModuleId[] }
  | { readonly timing: "review"; readonly nodeId: string; readonly requested: readonly ModuleId[] };

export type ModuleQueryErrorCode =
  | "MODULE_QUERY_INVALID" | "MODULE_QUERY_SUBJECT" | "MODULE_QUERY_SQUARE" | "MODULE_QUERY_CANDIDATE" | "MODULE_QUERY_WITHHELD" | "MODULE_QUERY_STALE" | "MODULE_QUERY_SOURCE_PAGE_REQUIRED";

export class ModuleQueryError extends TypeError {
  readonly code: ModuleQueryErrorCode;
  constructor(code: ModuleQueryErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "ModuleQueryError";
    this.code = code;
  }
}

const SQUARE = /^[a-h][1-8]$/u;
const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/u;
const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === "object" && value !== null && !Array.isArray(value);
const refuse = (message: string): never => { throw new ModuleQueryError("MODULE_QUERY_INVALID", message); };
function exactKeys(value: Readonly<Record<string, unknown>>, required: readonly string[], optional: readonly string[] = []): void {
  for (const key of Object.keys(value)) if (!required.includes(key) && !optional.includes(key)) refuse(`unknown request key ${key}`);
  for (const key of required) if (!(key in value)) refuse(`request omits ${key}`);
}
const text = (value: unknown, label: string): string => (typeof value === "string" && value.trim() !== "" ? value : refuse(`${label} must be a non-empty string`));
function moduleList(value: unknown): readonly ModuleId[] {
  if (!Array.isArray(value) || value.length > MODULE_IDS.length) return refuse("requested must be a module id array");
  const ids = value.map((entry) => ((MODULE_IDS as readonly unknown[]).includes(entry) ? entry as ModuleId : refuse("requested names an unregistered module")));
  if (new Set(ids).size !== ids.length) refuse("requested repeats a module");
  if (ids.includes("full_inspector")) throw new ModuleQueryError("MODULE_QUERY_SOURCE_PAGE_REQUIRED", "Full Inspector requires the explicit source-page operation");
  return Object.freeze(ids);
}

/** The strict boundary parser; a browser-normalized value is never server authority (§2.5.2). */
export function parseModuleQueryRequest(value: unknown): ModuleQueryRequest {
  if (!isRecord(value)) return refuse("request must be an object");
  switch (value.timing) {
    case "pre_commit":
      exactKeys(value, ["timing", "nodeId", "requested"], ["selectedSquare"]);
      if (value.selectedSquare !== undefined && (typeof value.selectedSquare !== "string" || !SQUARE.test(value.selectedSquare))) throw new ModuleQueryError("MODULE_QUERY_SQUARE", "selectedSquare is not a square");
      return Object.freeze({ timing: "pre_commit", nodeId: text(value.nodeId, "nodeId"), requested: moduleList(value.requested), ...(value.selectedSquare === undefined ? {} : { selectedSquare: value.selectedSquare as string }) });
    case "at_commit":
      exactKeys(value, ["timing", "nodeId", "candidateUci", "generation"]);
      if (typeof value.candidateUci !== "string" || !UCI.test(value.candidateUci)) throw new ModuleQueryError("MODULE_QUERY_CANDIDATE", "candidateUci is not canonical UCI");
      if (!Number.isSafeInteger(value.generation) || (value.generation as number) < 0) refuse("generation must be a non-negative safe integer");
      return Object.freeze({ timing: "at_commit", nodeId: text(value.nodeId, "nodeId"), candidateUci: value.candidateUci, generation: value.generation as number });
    case "post_commit":
      exactKeys(value, ["timing", "subjectNodeId", "requested"]);
      return Object.freeze({ timing: "post_commit", subjectNodeId: text(value.subjectNodeId, "subjectNodeId"), requested: moduleList(value.requested) });
    case "checkpoint":
    case "review":
      exactKeys(value, ["timing", "nodeId", "requested"]);
      return Object.freeze({ timing: value.timing, nodeId: text(value.nodeId, "nodeId"), requested: moduleList(value.requested) });
    default:
      return refuse("timing is outside the closed union");
  }
}

// ---------------------------------------------------------------------------------------------
// The decision stamp (§2.5.2 / evidence-presentation §3.11) — derived, never an invented revision
// ---------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------
// Source acquisition — the exact value routes over the timing subject (§2.5 timing frames)
// ---------------------------------------------------------------------------------------------

/** Server-owned inputs the catalogue pool needs (released authored items, registered shapes). */
export interface ModuleSourceContext {
  readonly postcommitAt?: (nodeId: string) => Readonly<{ grade: RecordedGradeSource; windows: ReturnType<typeof prepareRecordedSemanticWindowPopulation> }>;
  readonly opening?: OpeningCatalogueAvailability | undefined;
  readonly comparison?: Readonly<{ comparison: RecordedComparisonSource; points: readonly RecordedComparisonPointSource[] }> | undefined;
  /** Actual complete singleton scan over this exact recorded timing node; no raw catalogue matcher. */
  readonly shapeAt?: (nodeId: string) => Readonly<{ kind: "available"; scan: RegisteredShapeScan } | { kind: "unavailable"; reason: "authored_source_absent" | "source_dependency_unavailable" }>;
  readonly authoredAt?: (nodeId: string) => readonly AuthoredFeedbackItemRecord[];
  /** Server-acquired source over the exact timing subject, never a browser payload. */
  readonly explorerSummary?: DeclaredEvidence<ExplorerPopulationSummary>;
  readonly explorerUnavailable?: string;
}

/** One demanded source's closed result (§2.5.2 `ModuleSourceResult`). */
export type ModuleSourceResult =
  | { readonly kind: "available"; readonly projection: string; readonly items: readonly DeclaredEvidence<unknown>[] }
  | { readonly kind: "no_witness"; readonly projection: string }
  | { readonly kind: "unavailable"; readonly projection: string; readonly reason: string; readonly nodeId?: string };

/** Flip the side to move with en passant cleared (the shipped `mover-turn` pass convention). */
export function passFen(fen: string): string | undefined {
  const setup = parseFen(fen);
  if (setup.isErr) return undefined;
  const flipped = { ...setup.value, turn: setup.value.turn === "white" ? "black" as const : "white" as const, epSquare: undefined };
  const position = Chess.fromSetup(flipped);
  return position.isOk ? makeFen(position.value.toSetup()) : undefined;
}

const turnOf = (fen: string): Color => (fen.split(" ")[1] === "b" ? "black" : "white");

function flatten(route: string, result: unknown): ModuleSourceResult {
  const collect = (value: unknown): readonly DeclaredEvidence<unknown>[] => {
    if (Array.isArray(value)) return value.flatMap((entry) => collect(entry));
    if (isRecord(value) && "evidence" in value && !("payload" in value)) return collect(value.evidence);
    return [value as DeclaredEvidence<unknown>];
  };
  if (isRecord(result) && (result.kind === "available" || result.kind === "unavailable" || result.kind === "not_matched") && !("payload" in result)) {
    if (result.kind === "unavailable") return Object.freeze({ kind: "unavailable", projection: route, reason: typeof result.reason === "string" ? result.reason : "source_unavailable" });
    if (result.kind === "not_matched") return Object.freeze({ kind: "no_witness", projection: route });
    const items = collect(result.value);
    return items.length === 0 ? Object.freeze({ kind: "no_witness", projection: route }) : Object.freeze({ kind: "available", projection: route, items });
  }
  const items = collect(result);
  return items.length === 0 ? Object.freeze({ kind: "no_witness", projection: route }) : Object.freeze({ kind: "available", projection: route, items });
}

function route(name: string, input: Readonly<Record<string, unknown>>): ModuleSourceResult {
  return flatten(name, invokeEvidenceValueRoute(name as EvidenceValueRoute, input as never));
}

/** The squares one sealed reading is scoped to (sight's square selector); empty = position-wide. */
export function sightScope(evidence: DeclaredEvidence<unknown>): readonly SquareName[] {
  const payload = evidence.payload as Readonly<Record<string, unknown>>;
  const id = evidence.projection.id;
  if (id.startsWith("rules.structural.reading.")) return (payload.squares as readonly SquareName[] | undefined) ?? [];
  if (id === "rules.castling.reading.legality") return [payload.kingSquare, payload.rookSquare, ...(payload.blockedSquares as readonly string[]), ...(payload.attackedSquares as readonly string[])] as SquareName[];
  if (id === "rules.tactic.reading.rook_on_seventh") return (payload.rooks as readonly { readonly rook: { readonly square: SquareName } }[]).map((rook) => rook.rook.square);
  return [];
}

/**
 * A reading carries a concrete witness only when its population is non-empty: an empty population
 * is never presented as a fact (no all-clear), it stays the module's declared empty state.
 */
export function witnessedEvidence(evidence: DeclaredEvidence<unknown>): boolean {
  const payload = evidence.payload as Readonly<Record<string, unknown>>;
  const nonEmpty = (field: string): boolean => !Array.isArray(payload[field]) || (payload[field] as readonly unknown[]).length > 0;
  switch (evidence.projection.id) {
    case "derived.tactic.nonterminal_fork_survival": return payload.matched === true;
    case "rules.tactic.consequence.threat": return payload.kind === "threats" && nonEmpty("threats");
    case "rules.tactic.consequence.mate_in_one": return nonEmpty("mates");
    // An undefended but unattacked piece is not a threat: only a piece capturable at a gain is.
    case "rules.tactic.reading.loose_piece": return (payload.pieces as readonly { readonly enPrise: boolean }[]).some((entry) => entry.enPrise);
    case "rules.tactic.reading.back_rank": return (payload.susceptible as readonly { readonly accessingHeavyPieces: readonly unknown[] }[]).some((entry) => entry.accessingHeavyPieces.length > 0);
    case "rules.tactic.reading.trapped_piece": return payload.kind === "pieces" && (payload.pieces as readonly { readonly attackers: readonly unknown[] }[]).some((entry) => entry.attackers.length > 0);
    case "rules.tactic.reading.ray_classification": return nonEmpty("rays");
    case "rules.tactic.reading.rook_on_seventh": return nonEmpty("rooks");
    case "rules.pawn.reading.contacts": return nonEmpty("contacts");
    case "rules.pawn.reading.candidate_majority": return nonEmpty("candidates");
    case "rules.tactic.reading.discovered_latency": return nonEmpty("screens");
    case "derived.tactic.promotion_pressure": return nonEmpty("pawns");
    case "rules.structural.reading.space": return (payload.colors as readonly { readonly zones: readonly { readonly squares: readonly unknown[] }[] }[]).some((entry) => entry.zones.some((zone) => zone.squares.length > 0));
    case "rules.phase.development": { const undeveloped = payload.undeveloped as { readonly white: readonly unknown[]; readonly black: readonly unknown[] }; return undeveloped.white.length + undeveloped.black.length > 0; }
    // This adapter lights movable pieces, not an all-clear verdict. A complete terminal
    // legal map remains valid source evidence but has no square for this presentation.
    case "rules.mobility.reading.legal_moves": return (payload.pieces as readonly { readonly moves: readonly unknown[] }[]).some((entry) => entry.moves.length > 0);
    case "rules.mobility.reading.piece_destinations": return (payload.colors as readonly { readonly kind: string; readonly pieces?: readonly { readonly legal: readonly unknown[] }[] }[]).some((entry) => entry.kind === "available" && (entry.pieces ?? []).some((unit) => unit.legal.length > 0));
    case "rules.structural.reading.pawn_connectivity": return (payload.colors as readonly { readonly islandCount: number }[]).some((entry) => entry.islandCount > 0);
    case "rules.tactic.reading.defender_duty_set": return nonEmpty("duties");
    case "rules.king.reading.zone_state": return nonEmpty("kings");
    // Both king event vocabularies must obey the same no-change exclusion.
    case "rules.structural.event.king_zone":
    case "rules.king.event.zone_state": return hasKingZoneWitness(evidence);
    case "human.explorer.population": return (payload.result as { readonly kind: string }).kind === "stats";
    default: return true;
  }
}
const witnessed = witnessedEvidence;
/** Module-local selection belongs before both current and ancestor packet admission. */
const moduleWitnessed = (module: ModuleId, evidence: DeclaredEvidence<unknown>): boolean =>
  witnessed(evidence) && (module !== "postcommit_nudge" || hasPostcommitChangeWitness(evidence));

const SIGHT_READINGS = SIGHT_SOURCE_ROUTES;

export interface ModuleSubject {
  readonly node: Node;
  /** The exact incoming edge (post-commit) or the staged candidate edge (at-commit). */
  readonly edge?: { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string };
  /** The position the module reads (the staged child at at-commit). */
  readonly fen: string;
  readonly learner: Color;
  readonly square?: SquareName;
}

function shapePointSource(subject: ModuleSubject, context: ModuleSourceContext): ModuleSourceResult {
  const projection = "theory.shapes.firing@3", point = context.shapeAt?.(subject.node.id);
  if (point === undefined || point.kind === "unavailable") return Object.freeze({ kind: "unavailable", projection,
    reason: point?.reason ?? "authored_source_absent" });
  const data = readRegisteredShapeScan(point.scan);
  if (data.path.length !== 1 || data.path[0]!.id !== subject.node.id || data.path[0]!.fen !== subject.fen) throw new TypeError("Module shape scan is not its exact original singleton subject");
  const result = invokeEvidenceValueRoute(projection, { scan: point.scan });
  readCurrentShapeFiringInvocation(result, point.scan);
  return flatten(projection, result);
}

function sources(module: ModuleId, subject: ModuleSubject, run: DrillRun, context: ModuleSourceContext): readonly ModuleSourceResult[] {
  const fen = subject.fen;
  // "What can the opponent do to me": the threat convention reads the position with the learner to
  // move (it passes the turn itself); mate/loose readings need the opponent to move.
  // loosePieceReading reports victims opposite the side to move, i.e. the learner here.
  const learnerToMove = turnOf(fen) === subject.learner ? fen : passFen(fen);
  const opponentToMove = turnOf(fen) === subject.learner ? passFen(fen) : fen;
  const at = (name: string, position: string | undefined): ModuleSourceResult => position === undefined ? Object.freeze({ kind: "unavailable", projection: name, reason: "invalid_turn_clone" }) : route(name, { fen: position });
  switch (module) {
    case "sight_on_request": return SIGHT_READINGS.map((name) => route(name, { fen }));
    case "threat_radar": return [
      at("rules.tactic.consequence.threat@1", learnerToMove),
      at("rules.tactic.consequence.mate_in_one@1", opponentToMove),
      at("rules.tactic.reading.loose_piece@1", opponentToMove),
      route("rules.tactic.reading.back_rank@1", { fen }),
      at("rules.tactic.reading.trapped_piece@1", learnerToMove),
      route("rules.tactic.reading.ray_classification@1", { fen }),
      ...(subject.edge === undefined ? [] : [route("derived.tactic.defender_exposure@2", subject.edge)]),
    ];
    case "blunder_prevention": return [
      at("rules.tactic.consequence.threat@1", learnerToMove),
      at("rules.tactic.consequence.mate_in_one@1", opponentToMove),
      at("rules.tactic.reading.loose_piece@1", opponentToMove),
    ];
    case "structure_nudge": return [
      route("rules.structural.reading.named_structure@2", { fen }),
      route("rules.phase.reading@2", { fen }),
      route("rules.endgame.classification@1", { fen }),
      route("rules.structural.reading.space@1", { fen }),
      route("rules.structural.reading.pawn_connectivity@1", { fen }),
      ...ENDGAME_SETUP_CONVENTIONS.map((convention) => route("theory.endgame.setup_match@1", { fen, convention: { id: convention.id, version: convention.version } })),
      shapePointSource(subject, context),
    ];
    case "theory_breadcrumb": {
      const explorer = context.explorerSummary;
      if (explorer !== undefined) {
        assertDeclaredEvidence(explorer);
        if (explorer.projection.id !== "derived.explorer.population_summary" || explorer.projection.version !== 1) throw new TypeError("Expected exact Explorer summary authority");
      }
      return [
        ...(context.authoredAt?.(subject.node.id) ?? []).map((item) => route("pack.authored.claim@1", { item })),
        shapePointSource(subject, context),
        openingEndpointSource(run, subject, context.opening),
        ...(explorer === undefined
          ? [Object.freeze({ kind: "unavailable" as const, projection: "derived.explorer.population_summary@1", reason: context.explorerUnavailable ?? "not_requested" })]
          : explorer.payload.position.positionFen4 !== transposeKey(fen)
            ? [Object.freeze({ kind: "unavailable" as const, projection: "derived.explorer.population_summary@1", reason: "position_mismatch" })]
            : [route("derived.explorer.population_summary@1", { page: explorer.payload.page })]),
      ];
    }
    case "compare_coach": return compareSources(run, subject, context.comparison);
    case "postcommit_nudge": {
      const parent = subject.node.parentId === null ? undefined : run.nodes.find((candidate) => candidate.id === subject.node.parentId);
      if (parent === undefined) return [];
      const items = postcommitEdgeEvidence(run, parent, subject.node);
      const captured = context.postcommitAt?.(subject.node.id);
      const values: ModuleSourceResult[] = [items.length === 0 ? Object.freeze({ kind: "no_witness", projection: "postcommit.edge" }) : Object.freeze({ kind: "available", projection: "postcommit.edge", items })];
      values.push(captured === undefined ? Object.freeze({ kind: "unavailable", projection: "derived.grade.move_quality@2", reason: "source_not_requested" })
        : route("derived.grade.move_quality@2", { recordedGrade: captured.grade }));
      if (captured !== undefined) for (const [projection, prepared] of captured.windows) {
        if (prepared.omittedHorizons.length > 0) values.push(Object.freeze({ kind: "unavailable", projection, reason: "no_recorded_window" }));
        for (const window of prepared.windows) values.push(flatten(projection, collectRecordedSequenceWindow(window)));
      }
      return Object.freeze(values);
    }
    case "full_inspector": throw new ModuleQueryError("MODULE_QUERY_SOURCE_PAGE_REQUIRED", "Full Inspector is owned by the explicit source-page operation");
    default: return [];
  }
}

/** The exact installed pair is applicability proof; membership is not an extra learner fact. */
function openingEndpointSource(run: DrillRun, subject: ModuleSubject, installation: OpeningCatalogueAvailability | undefined): ModuleSourceResult {
  const projection = "theory.opening.current_endpoint@1";
  if (installation === undefined || installation.kind === "unavailable") return Object.freeze({ kind: "unavailable", projection, reason: installation?.reason ?? "artifact_missing" });
  const position = invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: subject.node.id });
  assertRecordedPositionInvocation(position, run, subject.node.id);
  if (position.payload.fen !== subject.fen) throw new TypeError("Opening source crosses its exact recorded position");
  const input = { source: installation.source, position };
  const named = invokeEvidenceValueRoute(projection, input);
  const member = invokeEvidenceValueRoute("theory.opening.catalogue_membership@1", input);
  if (named.kind !== "available" || member.kind !== "available") throw new TypeError("Admitted installed opening source unexpectedly unavailable");
  const endpoint = readRecordedOpeningPointResult(named.value, input, projection);
  const membership = readRecordedOpeningPointResult(member.value, input, "theory.opening.catalogue_membership@1");
  if (endpoint.invocation !== membership.invocation || (named.value.length > 0 && member.value.length !== 1)) throw new TypeError("Opening endpoint lost its actual paired catalogue applicability proof");
  return named.value.length === 0 ? Object.freeze({ kind: "no_witness", projection }) : Object.freeze({ kind: "available", projection, items: named.value });
}



/** The recorded pair used by both Compare's facts and its enter-other-attempt action. */
export function moduleComparisonForSubject(run: DrillRun, nodeId: string): BranchComparison | undefined {
  if (!run.nodes.some(node => node.id === nodeId)) return undefined;
  const columns = recordedComparisonColumnsForSubject(run, nodeId);
  return columns === undefined ? undefined : compareBranches(run, columns.map(column => column.branchId));
}

function compareSources(run: DrillRun, subject: ModuleSubject, captured: ModuleSourceContext["comparison"], viewer?: Pick<ModuleQueryInput, "assistance" | "role"> & { readonly timing: ModuleTiming }): readonly ModuleSourceResult[] {
  const expected = recordedComparisonColumnsForSubject(run, subject.node.id);
  if (expected === undefined) return [Object.freeze({ kind: "unavailable", projection: "run.record.fork@1", reason: "no_second_attempt" })];
  if (captured === undefined) return MODULE_CONSUMER_ACCEPTS.compare_coach.map(ref => Object.freeze({ kind: "unavailable", projection: ref.id + "@" + ref.version, reason: "source_unavailable" }));
  const data = recordedComparisonData(captured.comparison);
  if (evidenceDigest(data.run.events) !== evidenceDigest(run.events) || data.run.id !== run.id
    || evidenceDigest(expected) !== evidenceDigest(data.authority.columns)) throw new TypeError("Compare capture crosses the current subject/head/full tips");
  const peer = data.authority.paths[1], span = peer.slice(peer.findIndex(entry => entry.node.id === data.authority.forkNodeId));
  if (span.length !== captured.points.length) throw new TypeError("Compare capture omits original peer points");
  for (const [index, source] of captured.points.entries()) {
    const point = readRecordedComparisonPointSource(source);
    if (point.authority.comparison !== data.authority || point.authority.node.node.id !== span[index]!.node.id
      || viewer === undefined || point.authority.permission.role !== viewer.role
      || point.authority.permission.assistance.finalDigest !== viewer.assistance.finalDigest || point.authority.permission.timing !== viewer.timing) throw new TypeError("Compare point crosses its exact scope or current consumer");
  }
  const branchId = expected[1].branchId;
  const comparison = compareBranches(data.run, expected.map(column => column.branchId));
  const branchInput = { run: data.run, comparison, branchId };
  const population = collectComparisonStructuralPopulation({ comparison: captured.comparison });
  const path = invokeEvidenceValueRoute("run.record.comparison_path@1", { comparison: captured.comparison, branchId });
  const packets = recordedComparisonEvalTrail(captured.comparison, branchId).map(({ event }) => {
    const resolved = resolveRunSubject(data.run, { kind: "run_node", runId: data.run.id, eventHeadDigest: data.authority.eventHeadDigest, branchId, nodeId: event.data.nodeId });
    const itemDigest = digestRunEvidenceItem({ runId: data.run.id, eventHeadDigest: resolved.subject.eventHeadDigest, eventSeq: event.seq, event });
    return { event, packet: invokeEvidenceValueRoute("recorded.inspector.eval_packet@1", { resolved, itemDigest }) };
  });
  const deltas = packets.slice(1).map((after, index) => route("derived.compare.eval_delta@2", { comparison: captured.comparison, branchId, before: packets[index]!.packet, after: after.packet }));
  return [route("run.record.fork@1", { run: data.run, comparison }), route("run.record.consequence@1", branchInput),
    route("run.record.objective_transition@1", branchInput), route("run.record.checkpoint_hit@1", branchInput),
    route("derived.compare.structure_delta@2", { population, branchId }),
    ...(deltas.length === 0 ? [Object.freeze({ kind: "no_witness" as const, projection: "derived.compare.eval_delta@2" })] : deltas),
    ...captured.points.map(comparisonPoint => {
      const result = route("derived.compare.engine_trajectory@2", { comparisonPoint });
      return result.kind === "unavailable" ? Object.freeze({ ...result, nodeId: readRecordedComparisonPointSource(comparisonPoint).authority.node.node.id }) : result;
    }),
    route("derived.compare.piece_route@2", { comparison: captured.comparison, branchId, path })];
}

// ---------------------------------------------------------------------------------------------
// §5.1 — the post-adapter budget fit over atomic fact bundles
// ---------------------------------------------------------------------------------------------

export interface ModuleBudgetTuple { readonly facts: number; readonly words: number; readonly marks: number; readonly arrows: number }
export interface ModuleBudgetReceipt {
  readonly before: ModuleBudgetTuple;
  readonly after: ModuleBudgetTuple;
  readonly kept: readonly string[];
  readonly dropped: readonly { readonly fact: string; readonly exceeded: readonly ("facts" | "words" | "marks" | "arrows")[] }[];
}

export function modulePresentationBundleCost(items: readonly PresentedEvidenceItem[]): ModuleBudgetTuple {
  const sentences = new Set(items.map((item) => presentedSentence(item)));
  const marks = new Set<string>();
  const arrows = new Set<string>();
  for (const item of items) {
    const component = item.component;
    if (component.id === "square_set") for (const square of component.operand.squares) marks.add(`${component.id}:${square}:${component.operand.brush}`);
    // Charge all encoded ordered edges even where a receiver currently renders only the list.
    // The closed mark units are square sets and relation nodes, not move-path endpoints.
    // Counting is not permission to paint future plies over the current board.
    if (component.id === "move_path") for (const ply of component.operand.plies) {
      const from = ply.uci.slice(0, 2), to = ply.uci.slice(2, 4);
      arrows.add(`${component.id}:${from}${to}`);
    }
    if (component.id === "relation_overlay") {
      for (const node of component.operand.nodes) marks.add(`${component.id}:${node.square}:${node.emphasis}`);
      for (const edge of component.operand.edges) arrows.add(`${component.id}:${edge.from}${edge.to}${edge.relation}${edge.sign}`);
    }
  }
  return { facts: 1, words: [...sentences].reduce((sum, sentence) => sum + words(sentence), 0), marks: marks.size, arrows: arrows.size };
}

const addBudget = (a: ModuleBudgetTuple, b: ModuleBudgetTuple): ModuleBudgetTuple =>
  ({ facts: a.facts + b.facts, words: a.words + b.words, marks: a.marks + b.marks, arrows: a.arrows + b.arrows });
const exceededBudget = (budgets: ModuleBudgets, next: ModuleBudgetTuple): readonly (keyof ModuleBudgetTuple)[] => [
  ...(next.facts > budgets.maxFacts ? ["facts" as const] : []),
  ...(next.words > budgets.maxWords ? ["words" as const] : []),
  ...(budgets.maxMarks !== null && next.marks > budgets.maxMarks ? ["marks" as const] : []),
  ...(next.arrows > budgets.maxArrows ? ["arrows" as const] : []),
];

/**
 * Keeps whole bundles in reducer order while the cumulative tuple fits all four maxima; a bundle
 * exceeding any remaining dimension is dropped whole and the scan continues. Never back-fills.
 */
export function fitModulePresentation(module: ModuleId, items: readonly PresentedEvidenceItem[]): { readonly items: readonly PresentedEvidenceItem[]; readonly budget: ModuleBudgetReceipt } {
  const budgets = moduleDeclaration(module).budgets;
  const bundles = new Map<string, PresentedEvidenceItem[]>();
  for (const item of items) {
    const key = item.evidenceRef === null ? item.componentDigest : `${item.evidenceRef.projection.id}@${item.evidenceRef.projection.version}#${item.evidenceRef.evidenceDigest}`;
    bundles.set(key, [...(bundles.get(key) ?? []), item]);
  }
  const zero: ModuleBudgetTuple = { facts: 0, words: 0, marks: 0, arrows: 0 };
  let before = zero, after = zero;
  const kept: PresentedEvidenceItem[] = [], keptIds: string[] = [];
  const dropped: ModuleBudgetReceipt["dropped"][number][] = [];
  for (const [fact, bundle] of bundles) {
    const cost = modulePresentationBundleCost(bundle);
    before = addBudget(before, cost);
    const next = addBudget(after, cost), exceeded = exceededBudget(budgets, next);
    if (exceeded.length > 0) { dropped.push(Object.freeze({ fact, exceeded: Object.freeze(exceeded) })); continue; }
    after = next;
    kept.push(...bundle);
    keptIds.push(fact);
  }
  return { items: Object.freeze(kept), budget: Object.freeze({ before: Object.freeze(before), after: Object.freeze(after), kept: Object.freeze(keptIds), dropped: Object.freeze(dropped) }) };
}

export type InspectorOccurrenceFit =
  | Readonly<{ ordinal: number; kind: "presented"; items: readonly PresentedEvidenceItem[] }>
  | Readonly<{ ordinal: number; kind: "deferred"; exceeded: readonly ("facts" | "words" | "marks" | "arrows")[] }>;

/**
 * Budget only, not source admission or a consumer operation. The source-page caller must first
 * admit the complete immutable original collection and construct each whole registered bundle.
 * Unlike ordinary module factIdentity reduction, original occurrence ordinals never coalesce.
 * A deferred occurrence advances the page but exposes none of its components or sentences.
 */
export function fitInspectorSourceOccurrences(bundles: readonly (readonly PresentedEvidenceItem[])[], start: number): {
  readonly range: Readonly<{ start: number; count: number; total: number; next: number | null }>;
  readonly occurrences: readonly InspectorOccurrenceFit[];
  readonly budget: Readonly<{ before: ModuleBudgetTuple; after: ModuleBudgetTuple }>;
} {
  if (!Array.isArray(bundles) || !Number.isSafeInteger(start) || start < 0
    || (bundles.length === 0 ? start !== 0 : start >= bundles.length)) throw new TypeError("Invalid Inspector occurrence page index");
  const budgets = moduleDeclaration("full_inspector").budgets, count = Math.min(8, bundles.length - start);
  let before: ModuleBudgetTuple = { facts: 0, words: 0, marks: 0, arrows: 0 }, after = before;
  const occurrences: InspectorOccurrenceFit[] = [];
  for (let ordinal = start; ordinal < start + count; ordinal++) {
    const bundle = bundles[ordinal];
    if (!Array.isArray(bundle) || bundle.length === 0) throw new TypeError("Inspector occurrence needs its complete rendered bundle");
    const owner = presentedItemOwner(bundle[0]!);
    if (bundle.some(item => presentedItemOwner(item) !== owner)) throw new TypeError("Inspector occurrence crosses original component owners");
    const cost = modulePresentationBundleCost(bundle);
    before = addBudget(before, cost);
    const next = addBudget(after, cost), exceeded = exceededBudget(budgets, next);
    if (exceeded.length !== 0) occurrences.push(Object.freeze({ ordinal, kind: "deferred", exceeded: Object.freeze(exceeded) }));
    else {
      after = next;
      occurrences.push(Object.freeze({ ordinal, kind: "presented", items: Object.freeze([...bundle]) }));
    }
  }
  return Object.freeze({ range: Object.freeze({ start, count, total: bundles.length, next: start + count === bundles.length ? null : start + count }),
    occurrences: Object.freeze(occurrences), budget: Object.freeze({ before: Object.freeze(before), after: Object.freeze(after) }) });
}

// ---------------------------------------------------------------------------------------------
// Inspector family partition (§5.2)
// ---------------------------------------------------------------------------------------------

export type InspectorFamilyState =
  | { readonly family: InspectorFamilyId; readonly kind: "available"; readonly factCount: number }
  | { readonly family: InspectorFamilyId; readonly kind: "no_witness" }
  | { readonly family: InspectorFamilyId; readonly kind: "unavailable"; readonly reason: string }
  | { readonly family: InspectorFamilyId; readonly kind: "not_requested" };

export function inspectorFamily(projection: string): InspectorFamilyId {
  if (projection.startsWith("live.stockfish") || projection.startsWith("recorded.engine")) return "stockfish";
  if (projection.startsWith("live.syzygy") || projection.startsWith("recorded.tablebase")) return "syzygy";
  if (projection.startsWith("human.maia")) return "maia";
  if (projection.startsWith("human.explorer")) return "explorer";
  if (projection.startsWith("run.record")) return "recorded_run";
  if (projection.startsWith("theory.") || projection.startsWith("pack.")) return "authored_theory";
  if (projection.startsWith("rules.")) return "local_rules";
  return "derived";
}

// ---------------------------------------------------------------------------------------------
// The packet, the disclosure receipt and the page
// ---------------------------------------------------------------------------------------------

export type ModuleEmptyState =
  | { readonly kind: "silent" }
  | { readonly kind: "stated_absence"; readonly sentence: string }
  | { readonly kind: "unavailable_source"; readonly sentence: string }
  | { readonly kind: "family_partitioned"; readonly families: readonly InspectorFamilyState[] };

/**
 * intent-presets D5 / module-registration §2.5.2: binds one delivery to the run, the decision stamp,
 * the subject, the module, both assistance digests and the ordered component digests. Post-commit,
 * checkpoint and review receipts join a durable boundary event; pre-/at-commit receipts are the
 * narrow ephemeral request receipts ([[D1866]]) and never satisfy novelty, history or credit.
 */
export interface ModuleDisclosureReceipt {
  readonly runId: string;
  readonly decisionDigest: string;
  readonly subject: { readonly nodeId: string; readonly selectedSquare: string | null; readonly candidateUci: string | null; readonly generation: number | null };
  readonly timing: ModuleTiming;
  readonly module: ModuleId;
  readonly requestedConfigDigest: string;
  readonly effectiveConfigDigest: string;
  readonly componentDigests: readonly string[];
  readonly boundary: { readonly kind: "durable_event"; readonly eventSeq: number } | { readonly kind: "ephemeral_request" };
  readonly digest: string;
}

export interface ModuleQueryPacket {
  readonly module: ModuleId;
  readonly timing: ModuleTiming;
  readonly initiative: "proactive" | "on_request" | "explicit_mode";
  readonly receipt: PresentationReceipt;
  readonly budget: ModuleBudgetReceipt;
  readonly noveltyAbstained: boolean;
  /** Present exactly when no component survived: the module's declared empty behaviour. */
  readonly empty: ModuleEmptyState | null;
  /** Source results the operation could not acquire (never flattened into an empty fact). */
  readonly unavailable: readonly { readonly projection: string; readonly reason: string; readonly nodeId?: string }[];
  readonly disclosure: ModuleDisclosureReceipt;
}

export type ModuleSuppressionReason = "not_effective" | "timing_outside_module" | "not_requested" | "no_square" | "no_second_attempt" | "guided_hint_owned_elsewhere";

export interface ModuleQueryPage {
  readonly protocol: typeof MODULE_QUERY_PROTOCOL;
  readonly runId: string;
  readonly timing: ModuleTiming;
  readonly subjectNodeId: string;
  readonly decision: ModuleDecisionStamp;
  readonly requestedConfigDigest: string;
  readonly effectiveConfigDigest: string;
  readonly packets: readonly ModuleQueryPacket[];
  readonly suppressions: readonly { readonly module: ModuleId; readonly reason: ModuleSuppressionReason }[];
}

export interface ModuleQueryInput {
  readonly run: DrillRun;
  /** The finalized (digest-bound) assistance the server just compiled for this viewer. */
  readonly assistance: FinalizedAssistanceV1;
  readonly role: EvidenceRole;
  readonly session: string;
  readonly request: ModuleQueryRequest;
  readonly sources?: ModuleSourceContext;
  readonly recorder?: ReductionQualityRecorder;
}

function disclosureReceipt(body: Omit<ModuleDisclosureReceipt, "digest">): ModuleDisclosureReceipt {
  return Object.freeze({ ...body, digest: presentationDigest("module.disclosure_receipt@1", body) });
}

/** Recomputes a disclosure receipt digest (the client asserts it before rendering). */
export function moduleDisclosureDigest(receipt: Omit<ModuleDisclosureReceipt, "digest">): string {
  return presentationDigest("module.disclosure_receipt@1", receipt);
}

function subjectFor(run: DrillRun, request: ModuleQueryRequest): ModuleSubject {
  const node = (id: string): Node => run.nodes.find((candidate) => candidate.id === id) ?? (() => { throw new ModuleQueryError("MODULE_QUERY_SUBJECT", `unknown node ${id}`); })();
  const root = run.nodes.find((candidate) => candidate.parentId === null);
  const learnerColor: Color = root === undefined ? "white" : turnOf(root.fen);
  switch (request.timing) {
    case "pre_commit": {
      const at = node(request.nodeId);
      return { node: at, fen: at.fen, learner: turnOf(at.fen), ...(request.selectedSquare === undefined ? {} : { square: request.selectedSquare as SquareName }) };
    }
    case "at_commit": {
      const at = node(request.nodeId);
      // A legal square pair is not a legal move: promotions require the exact role,
      // and the shared move authority owns Chess960-safe castling identities too.
      if (!exactLegalMoves(at.fen).some(move => move.uci === request.candidateUci)) {
        throw new ModuleQueryError("MODULE_QUERY_CANDIDATE", "candidateUci is not legal in the subject position");
      }
      const position = Chess.fromSetup(parseFen(at.fen).unwrap()).unwrap();
      const child = position.clone();
      child.play(parseUci(request.candidateUci)!);
      const afterFen = makeFen(child.toSetup());
      return { node: at, fen: afterFen, learner: turnOf(at.fen), edge: { beforeFen: at.fen, moveUci: request.candidateUci, afterFen } };
    }
    case "post_commit": {
      const at = node(request.subjectNodeId);
      const parent = at.parentId === null ? undefined : node(at.parentId);
      if (parent === undefined || at.moveUci === null || at.actor !== "user") throw new ModuleQueryError("MODULE_QUERY_SUBJECT", "the post-commit subject is not a learner move");
      return { node: at, fen: at.fen, learner: turnOf(parent.fen), edge: { beforeFen: parent.fen, moveUci: at.moveUci, afterFen: at.fen }, square: exactMoveDestination(parent.fen, at.moveUci) };
    }
    case "checkpoint":
    case "review": {
      const at = node(request.nodeId);
      return { node: at, fen: at.fen, learner: learnerColor };
    }
  }
}

function boundaryFor(run: DrillRun, request: ModuleQueryRequest, subject: ModuleSubject): ModuleDisclosureReceipt["boundary"] {
  if (request.timing === "pre_commit" || request.timing === "at_commit") return { kind: "ephemeral_request" };
  if (request.timing === "post_commit") {
    const committed = run.events.find((event) => event.type === "move.committed" && event.data.node.id === subject.node.id);
    return { kind: "durable_event", eventSeq: committed?.seq ?? run.events.at(-1)?.seq ?? 0 };
  }
  return { kind: "durable_event", eventSeq: run.events.at(-1)?.seq ?? 0 };
}

/** The exact earlier learner timing subjects used by the existing bounded novelty filter. */
function ancestorSubjects(run: DrillRun, module: ModuleId, subject: ModuleSubject): readonly ModuleSubject[] {
  const window = moduleDeclaration(module).noveltyWindow;
  if (window === 0) return [];
  const path = branchPath(run, postcommitSubjectBranch(run, subject.node));
  const index = path.findIndex(candidate => candidate.id === subject.node.id), result: ModuleSubject[] = [];
  for (let cursor = index - 1; cursor >= 1 && result.length < window; cursor -= 1) {
    const node = path[cursor]!, parent = path[cursor - 1]!;
    if (node.actor !== "user" || node.moveUci === null) continue;
    result.push({ node, fen: node.fen, learner: subject.learner,
      edge: { beforeFen: parent.fen, moveUci: node.moveUci, afterFen: node.fen }, square: exactMoveDestination(parent.fen, node.moveUci) });
  }
  return Object.freeze(result);
}

/** The admitted facts of earlier learner edges on the path (bounded novelty, §1.5). */
function ancestorFacts(run: DrillRun, module: ModuleId, subject: ModuleSubject, input: ModuleQueryInput): readonly (readonly ModuleFact[])[] {
  return Object.freeze(ancestorSubjects(run, module, subject).map(prior => {
    const evidence = sources(module, prior, run, input.sources ?? {}).flatMap(result => result.kind === "available" ? result.items.filter(item => moduleWitnessed(module, item)) : []);
    const packet = compileModulePacket({ module, timing: "post_commit", role: input.role, session: input.session, evidence, mode: "admit" });
    return packet.kind === "packet" ? packet.facts : Object.freeze([]);
  }));
}


const EMPTY_STATE = (module: ModuleId): ModuleEmptyState => {
  const behavior = moduleDeclaration(module).emptyBehavior;
  if (behavior.kind === "family_partitioned") throw new ModuleQueryError("MODULE_QUERY_SOURCE_PAGE_REQUIRED", "Source states belong to the explicit Inspector source page");
  return behavior as ModuleEmptyState;
};

/**
 * evidence-presentation §3.6/criterion 13: an ordered component (a line or a directed relation)
 * whose answer distance exceeds the seat's module answer image is refused at the render boundary —
 * the last place a principal variation could leak. It is never truncated into a shorter line.
 */
export function assertAnswerCeiling(module: ModuleId, items: readonly PresentedEvidenceItem[]): void {
  const image = MODULE_REGISTRY.answerImages.get(module) ?? [];
  for (const item of items) {
    const component = item.component;
    if ((component.id === "move_path" || component.id === "relation_overlay") && !image.includes(component.operand.answerDistance)) {
      throw new ModuleQueryError("MODULE_QUERY_INVALID", `${module} may not render a ${component.id} at answer distance ${component.operand.answerDistance}`);
    }
  }
}

/**
 * The one module query operation. Pure over the run and the finalized assistance: the server
 * derives role/session/context and the finalized digest itself and passes them here.
 */
function preflightModuleQuery(input: ModuleQueryInput) {
  const { run, assistance, request } = input;
  if ("requested" in request) moduleList(request.requested);
  const decision = moduleDecisionStamp(run);
  const subject = subjectFor(run, request);
  // A16: post-commit output is bound to the durable feedback-delivery boundary. Pre-/at-commit
  // requests are explicit Support/sight gestures over local rules readings (the shipped sight
  // caption is not delivery-gated either); checkpoint/review surfaces are explicit entries.
  // Post-commit, checkpoint and review deliveries read recorded evidence and are bound to the durable
  // disclosure boundary (A16): withheld until the run opens feedback (an outcome opens it too).
  if (request.timing !== "pre_commit" && request.timing !== "at_commit" && !feedbackDeliveryOpen(run)) throw new ModuleQueryError("MODULE_QUERY_WITHHELD", `${request.timing} module output is withheld until this run opens feedback`);
  const timing: ModuleTiming = request.timing;
  const requested = new Set<ModuleId>("requested" in request ? request.requested : []);
  const suppressions: ModuleQueryPage["suppressions"][number][] = [];
  const selected: { readonly module: ModuleId; readonly declared: ReturnType<typeof moduleDeclaration>["timings"][number] }[] = [];
  for (const module of MODULE_IDS) {
    const declared = moduleDeclaration(module).timings.find((entry) => entry.timing === timing);
    if (declared === undefined) { if (requested.has(module)) suppressions.push({ module, reason: "timing_outside_module" }); continue; }
    if (module === "guided_hint") { if (requested.has(module)) suppressions.push({ module, reason: "guided_hint_owned_elsewhere" }); continue; }
    if (module === "review_map" || module === "rules_floor" || module === "full_inspector" || module === "postcommit_nudge" && timing !== "post_commit") continue;
    const effect = assistance.modules.includes(module) && assistance.effects.some((entry) => entry.moduleId === module && entry.timing === timing && entry.subSurface === undefined);
    if (declared.initiative !== "proactive" && !requested.has(module)) continue;
    if (!effect || !moduleDeclaration(module).ceilings.roles.includes(input.role)
      || !moduleDeclaration(module).ceilings.sessions.includes(input.session)) { suppressions.push({ module, reason: "not_effective" }); continue; }
    if (module === "sight_on_request" && subject.square === undefined) { suppressions.push({ module, reason: "no_square" }); continue; }
    selected.push({ module, declared });
  }
  // Validate every migrated effective consumer before the first selected module reads sources.
  // Theory's local preview is acquisition too: its complete optional-provider binding must
  // compile before shape/authored reads, not only before the later online request.
  // Other consumers retain their explicit source-migration obligations; a successful local
  // preflight is not a filtered whole-manifest execution image or a provider satisfaction claim.
  for (const { module } of selected) {
    if (module === "compare_coach" || module === "postcommit_nudge") compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, moduleDeclaration(module).consumer!);
    if (module === "sight_on_request" || module === "threat_radar" || module === "blunder_prevention" || module === "structure_nudge" || module === "theory_breadcrumb") {
      compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, moduleDeclaration(module).consumer!);
    }
  }
  return { run, assistance, request, decision, subject, timing, suppressions, selected };
}

/** Complete admission before service-owned cooperative source preparation; no sources are read here. */
export function moduleShapeScanSubjects(input: ModuleQueryInput): readonly Readonly<{ id: string; fen: string }>[] {
  const { run, subject, selected } = preflightModuleQuery(input), nodes = new Map<string, Readonly<{ id: string; fen: string }>>();
  for (const { module } of selected) {
    if (module !== "structure_nudge" && module !== "theory_breadcrumb") continue;
    for (const point of [subject, ...ancestorSubjects(run, module, subject)]) nodes.set(point.node.id, Object.freeze({ id: point.node.id, fen: point.fen }));
  }
  return Object.freeze([...nodes.values()]);
}

export function queryModules(input: ModuleQueryInput): { readonly page: ModuleQueryPage; readonly items: ReadonlyMap<ModuleId, readonly PresentedEvidenceItem[]> } {
  const { run, assistance, request, decision, subject, timing, suppressions, selected } = preflightModuleQuery(input);
  const packets: ModuleQueryPacket[] = [], itemsByModule = new Map<ModuleId, readonly PresentedEvidenceItem[]>();
  for (const { module, declared } of selected) {
    const results = module === "compare_coach" ? compareSources(run, subject, input.sources?.comparison, { assistance, role: input.role, timing })
      : sources(module, subject, run, input.sources ?? {});
    if (module === "compare_coach" && results.some((result) => result.kind === "unavailable" && result.reason === "no_second_attempt")) { suppressions.push({ module, reason: "no_second_attempt" }); continue; }
    const available = results.flatMap((result) => result.kind === "available" ? result.items : []);
    const scoped = module === "sight_on_request" ? available.filter((item) => sightScope(item).includes(subject.square!)) : available;
    const evidence = scoped.filter(item => moduleWitnessed(module, item));
    const packet = compileModulePacket({ module, timing, role: input.role, session: input.session, evidence, ancestorFacts: ancestorFacts(run, module, subject, input), recorder: input.recorder ?? NULL_REDUCTION_QUALITY_RECORDER });
    if (packet.kind === "refused") { suppressions.push({ module, reason: "not_effective" }); continue; }
    const survivors = packet.facts.map((fact) => fact.evidence);
    const presented = survivors.length === 0 ? [] : presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, moduleDeclaration(module).consumer!, survivors));
    assertAnswerCeiling(module, presented);
    const fitted = fitModulePresentation(module, presented);
    itemsByModule.set(module, fitted.items);
    const receipt = serializePresentedEvidence(fitted.items);
    const unavailable = results.flatMap((result) => result.kind === "unavailable" ? [Object.freeze({ projection: result.projection, reason: result.reason, ...(result.nodeId === undefined ? {} : { nodeId: result.nodeId }) })] : []);
    const empty: ModuleEmptyState | null = fitted.items.length === 0 ? module === "threat_radar" && unavailable.length > 0
        ? Object.freeze({ kind: "unavailable_source", sentence: "Some threat checks could not be completed for this position." })
        : (module === "structure_nudge" || module === "theory_breadcrumb") && unavailable.some(source => source.projection === "theory.shapes.firing@3")
          ? Object.freeze({ kind: "unavailable_source", sentence: "Named-pattern recognition could not be checked for this position." })
          : (module === "structure_nudge" || module === "theory_breadcrumb") && fitted.budget.dropped.length > 0
            ? Object.freeze({ kind: "stated_absence", sentence: "More detail is available than fits in this compact hint." })
            : EMPTY_STATE(module) : null;
    const disclosure = disclosureReceipt({
      runId: run.id, decisionDigest: decision.digest,
      subject: { nodeId: subject.node.id, selectedSquare: request.timing === "pre_commit" ? request.selectedSquare ?? null : null, candidateUci: request.timing === "at_commit" ? request.candidateUci : null, generation: request.timing === "at_commit" ? request.generation : null },
      timing, module, requestedConfigDigest: assistance.requestedDigest, effectiveConfigDigest: assistance.finalDigest,
      componentDigests: receipt.items.map((item) => item.componentDigest), boundary: boundaryFor(run, request, subject),
    });
    packets.push(Object.freeze({
      module, timing, initiative: declared.initiative === "ambient" ? "proactive" : declared.initiative,
      receipt, budget: fitted.budget, noveltyAbstained: packet.noveltyAbstained,
      empty,
      unavailable: Object.freeze(unavailable), disclosure,
    }));
  }
  const page: ModuleQueryPage = Object.freeze({
    protocol: MODULE_QUERY_PROTOCOL, runId: run.id, timing, subjectNodeId: subject.node.id, decision,
    requestedConfigDigest: assistance.requestedDigest, effectiveConfigDigest: assistance.finalDigest,
    packets: Object.freeze(packets), suppressions: Object.freeze(suppressions),
  });
  return { page, items: itemsByModule };
}

/** The exact projections this operation acquires for one module (`MODULE_PAIR_EXECUTION`'s source image). */
export function moduleQueryProjections(module: ModuleId): readonly VersionedEvidenceId[] {
  return MODULE_OPERATIONS.find(operation => operation.module === module && operation.operation === MODULE_QUERY_OPERATION)?.projections ?? Object.freeze([]);
}
export { MODULE_QUERY_OPERATION };

/** Evidence digests of a sealed item, for tests and the disclosure trace. */
export function presentedFactDigest(item: PresentedEvidenceItem): string | null {
  return item.evidenceRef === null ? null : item.evidenceRef.evidenceDigest;
}

export { evidenceValueReceipt };
