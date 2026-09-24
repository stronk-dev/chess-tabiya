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

import type { FinalizedAssistanceV1 } from "./assistance-exchange.js";
import { branchPath } from "./branch-path.js";
import { compareBranches } from "./compare.js";
import { ENDGAME_SETUP_CONVENTIONS } from "./endgame-setup.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, evidenceValueReceipt, type DeclaredEvidence, type EvidenceRole, type VersionedEvidenceId } from "./evidence-contract.js";
import type { AuthoredFeedbackItemRecord } from "./evidence-factories.js";
import { feedbackDeliveryOpen } from "./feedback.js";
import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { MODULE_QUERY_OPERATION, PACKET_ROUTE_KINDS, SIGHT_SOURCE_ROUTES, moduleQuerySourceRoutes, routeReads } from "./module-query-sources.js";
import { MODULE_IDS, type InspectorFamilyId, type ModuleId, type ModuleTiming } from "./module-contract.js";
import { compileModulePacket } from "./module-packets.js";
import { MODULE_CONSUMER_ACCEPTS, MODULE_REGISTRY, moduleDeclaration } from "./module-registry.js";
import { NULL_REDUCTION_QUALITY_RECORDER, type ModuleFact, type ReductionQualityRecorder } from "./module-reducers.js";
import {
  presentEvidenceItems,
  presentationDigest,
  presentedSentence,
  serializePresentedEvidence,
  type PresentationReceipt,
  type PresentedEvidenceItem,
} from "./presentation-contract.js";
import { postcommitEdgeEvidence } from "./postcommit-nudge.js";
import type { ShapeTriggerSource } from "./shape-firing.js";
import type { DrillRun, Node } from "./types.js";

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
  | "MODULE_QUERY_INVALID" | "MODULE_QUERY_SUBJECT" | "MODULE_QUERY_SQUARE" | "MODULE_QUERY_CANDIDATE" | "MODULE_QUERY_WITHHELD" | "MODULE_QUERY_STALE";

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

export interface ModuleDecisionStamp {
  readonly eventHeadSeq: number;
  readonly cursor: { readonly branchId: string; readonly nodeId: string };
  readonly disclosureBoundarySeq: number | null;
  readonly digest: string;
}

/** The last open feedback-disclosure boundary event, or null when delivery is closed. */
function disclosureBoundary(run: DrillRun): number | null {
  if (!feedbackDeliveryOpen(run)) return null;
  const boundary = [...run.events].reverse().find((event) => event.type === "feedback.revealed" || event.type === "outcome.reached" || event.type === "checkpoint.reached" || event.type === "segment.completed");
  return boundary?.seq ?? run.events.at(-1)?.seq ?? 0;
}

export function moduleDecisionStamp(run: DrillRun): ModuleDecisionStamp {
  const body = { eventHeadSeq: run.events.at(-1)?.seq ?? 0, cursor: { branchId: run.activeCursor.branchId, nodeId: run.activeCursor.nodeId }, disclosureBoundarySeq: disclosureBoundary(run) };
  return Object.freeze({ ...body, cursor: Object.freeze(body.cursor), digest: presentationDigest("module.decision_stamp@1", body) });
}

// ---------------------------------------------------------------------------------------------
// Source acquisition — the exact value routes over the timing subject (§2.5 timing frames)
// ---------------------------------------------------------------------------------------------

/** Server-owned inputs the catalogue pool needs (released authored items, registered shapes). */
export interface ModuleSourceContext {
  readonly shapes?: readonly ShapeTriggerSource[];
  readonly authoredAt?: (nodeId: string) => readonly AuthoredFeedbackItemRecord[];
}

/** One demanded source's closed result (§2.5.2 `ModuleSourceResult`). */
export type ModuleSourceResult =
  | { readonly kind: "available"; readonly projection: string; readonly items: readonly DeclaredEvidence<unknown>[] }
  | { readonly kind: "no_witness"; readonly projection: string }
  | { readonly kind: "unavailable"; readonly projection: string; readonly reason: string };

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
    case "rules.mobility.reading.piece_destinations": return (payload.colors as readonly { readonly kind: string; readonly pieces?: readonly { readonly legal: readonly unknown[] }[] }[]).some((entry) => entry.kind === "available" && (entry.pieces ?? []).some((unit) => unit.legal.length > 0));
    case "rules.structural.reading.pawn_connectivity": return (payload.colors as readonly { readonly islandCount: number }[]).some((entry) => entry.islandCount > 0);
    case "rules.tactic.reading.defender_duty_set": return nonEmpty("duties");
    case "rules.king.reading.zone_state": return nonEmpty("kings");
    // A king-zone event with no change is not an event: it would read as an all-clear.
    case "rules.king.event.zone_state": {
      const event = payload as { readonly king: { readonly relocated: boolean }; readonly attackers: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] }; readonly defenders: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] }; readonly shelter: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] }; readonly escapes: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] } };
      return event.king.relocated || [event.attackers, event.defenders, event.shelter, event.escapes].some((change) => change.gained.length + change.lost.length > 0);
    }
    case "human.explorer.population": return (payload.result as { readonly kind: string }).kind === "stats";
    default: return true;
  }
}
const witnessed = witnessedEvidence;

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

function sources(module: ModuleId, subject: ModuleSubject, run: DrillRun, context: ModuleSourceContext): readonly ModuleSourceResult[] {
  const fen = subject.fen;
  // "What can the opponent do to me": the threat convention reads the position with the learner to
  // move (it passes the turn itself); a mate/loose reading needs the named side to move.
  const learnerToMove = turnOf(fen) === subject.learner ? fen : passFen(fen);
  const opponentToMove = turnOf(fen) === subject.learner ? passFen(fen) : fen;
  const at = (name: string, position: string | undefined): ModuleSourceResult => position === undefined ? Object.freeze({ kind: "unavailable", projection: name, reason: "invalid_turn_clone" }) : route(name, { fen: position });
  switch (module) {
    case "sight_on_request": return SIGHT_READINGS.map((name) => route(name, { fen }));
    case "threat_radar": return [
      at("rules.tactic.consequence.threat@1", learnerToMove),
      at("rules.tactic.consequence.mate_in_one@1", opponentToMove),
      at("rules.tactic.reading.loose_piece@1", learnerToMove),
      route("rules.tactic.reading.back_rank@1", { fen }),
      at("rules.tactic.reading.trapped_piece@1", learnerToMove),
      route("rules.tactic.reading.ray_classification@1", { fen }),
      ...(subject.edge === undefined ? [] : [route("derived.tactic.defender_exposure@1", subject.edge)]),
    ];
    case "blunder_prevention": return [
      at("rules.tactic.consequence.threat@1", learnerToMove),
      at("rules.tactic.consequence.mate_in_one@1", opponentToMove),
      at("rules.tactic.reading.loose_piece@1", learnerToMove),
    ];
    case "structure_nudge": return [
      route("rules.structural.reading.named_structure@2", { fen }),
      route("rules.phase.reading@2", { fen }),
      route("rules.endgame.classification@1", { fen }),
      route("rules.structural.reading.space@1", { fen }),
      route("rules.structural.reading.pawn_connectivity@1", { fen }),
      ...ENDGAME_SETUP_CONVENTIONS.map((convention) => route("theory.endgame.setup_match@1", { fen, convention: { id: convention.id, version: convention.version } })),
      ...(context.shapes === undefined || context.shapes.length === 0 ? [] : [route("theory.shapes.firing@1", { entries: context.shapes.map((shape) => ({ id: shape.id, trigger: shape.trigger })), path: [{ id: subject.node.id, fen }] })]),
    ];
    case "theory_breadcrumb": return [
      ...(context.authoredAt?.(subject.node.id) ?? []).map((item) => route("pack.authored.claim@1", { item })),
      ...(context.shapes === undefined || context.shapes.length === 0 ? [] : [route("theory.shapes.firing@1", { entries: context.shapes.map((shape) => ({ id: shape.id, trigger: shape.trigger })), path: [{ id: subject.node.id, fen }] })]),
      route("theory.opening.current_endpoint@1", { fen }),
    ];
    case "compare_coach": return compareSources(run, subject);
    case "postcommit_nudge": {
      const parent = subject.node.parentId === null ? undefined : run.nodes.find((candidate) => candidate.id === subject.node.parentId);
      if (parent === undefined) return [];
      const items = postcommitEdgeEvidence(run, parent, subject.node);
      return items.length === 0 ? [Object.freeze({ kind: "no_witness", projection: "postcommit.edge" })] : [Object.freeze({ kind: "available", projection: "postcommit.edge", items })];
    }
    case "full_inspector": return inspectorSources(run, subject);
    default: return [];
  }
}


/**
 * Full Inspector (explicit mode, review timing): the complete census of what the node's exact
 * sources can seal — every accepted projection whose value route reads the node's FEN, its incoming
 * edge, or an engine/tablebase packet recorded at the node. Every other accepted projection is a
 * `not_requested` family state (a provider page or multi-edge window the explicit surface did not
 * demand), never an empty fact.
 */
function inspectorSources(run: DrillRun, subject: ModuleSubject): readonly ModuleSourceResult[] {
  const parent = subject.node.parentId === null ? undefined : run.nodes.find((candidate) => candidate.id === subject.node.parentId);
  const edge = parent === undefined || subject.node.moveUci === null ? undefined : { beforeFen: parent.fen, moveUci: subject.node.moveUci, afterFen: subject.node.fen };
  const packets = run.events.flatMap((event) => event.type === "evidence.attached" && event.data.nodeId === subject.node.id ? [event.data.payload] : []);
  return (MODULE_CONSUMER_ACCEPTS.full_inspector as readonly VersionedEvidenceId[]).map((ref): ModuleSourceResult => {
    const name = `${ref.id}@${ref.version}`;
    try {
      if (routeReads(name, "fen")) return route(name, { fen: subject.fen });
      if (routeReads(name, "afterFen|beforeFen|moveUci")) return edge === undefined ? Object.freeze({ kind: "no_witness", projection: name }) : route(name, edge);
      const kind = PACKET_ROUTE_KINDS[name];
      if (kind !== undefined && routeReads(name, "packet")) {
        const matching = packets.filter((packet) => packet.kind === kind);
        const results = matching.map((packet) => route(name, { packet: { kind: packet.kind, source: packet.source, values: packet.values } }));
        const items = results.flatMap((result) => result.kind === "available" ? result.items : []);
        return items.length === 0 ? Object.freeze({ kind: "no_witness", projection: name }) : Object.freeze({ kind: "available", projection: name, items });
      }
    } catch (error) {
      if (error instanceof TypeError) return Object.freeze({ kind: "unavailable", projection: name, reason: "input_abstained" });
      throw error;
    }
    return Object.freeze({ kind: "unavailable", projection: name, reason: "not_requested" });
  });
}

/** The other attempt: the newest branch other than the subject's, compared at their fork. */
function otherAttempt(run: DrillRun, branchId: string): string | undefined {
  return [...run.branches].reverse().find((branch) => branch.id !== branchId)?.id;
}

function compareSources(run: DrillRun, subject: ModuleSubject): readonly ModuleSourceResult[] {
  const other = otherAttempt(run, subject.node.branchId);
  if (other === undefined) return [Object.freeze({ kind: "unavailable", projection: "run.record.fork@1", reason: "no_second_attempt" })];
  const comparison = compareBranches(run, [subject.node.branchId, other]);
  const branchInput = { run, comparison, branchId: other };
  return [
    route("run.record.fork@1", { run, comparison }),
    route("run.record.consequence@1", branchInput),
    route("run.record.objective_transition@1", branchInput),
    route("run.record.checkpoint_hit@1", branchInput),
    route("derived.compare.structure_delta@1", branchInput),
    route("derived.compare.eval_delta@1", branchInput),
    route("derived.compare.engine_trajectory@1", branchInput),
    route("derived.compare.piece_route@1", branchInput),
  ];
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

const WORD = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
const words = (sentence: string): number => sentence.normalize("NFKC").match(WORD)?.length ?? 0;

function bundleCost(items: readonly PresentedEvidenceItem[]): ModuleBudgetTuple {
  const sentences = new Set(items.map((item) => presentedSentence(item)));
  const marks = new Set<string>();
  const arrows = new Set<string>();
  for (const item of items) {
    const component = item.component;
    if (component.id === "square_set") for (const square of component.operand.squares) marks.add(`${component.id}:${square}`);
    if (component.id === "relation_overlay") {
      for (const node of component.operand.nodes) marks.add(`${component.id}:${node.square}:${node.emphasis}`);
      for (const edge of component.operand.edges) arrows.add(`${edge.from}${edge.to}${edge.relation}${edge.sign}`);
    }
  }
  return { facts: 1, words: [...sentences].reduce((sum, sentence) => sum + words(sentence), 0), marks: marks.size, arrows: arrows.size };
}

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
    const cost = bundleCost(bundle);
    before = { facts: before.facts + cost.facts, words: before.words + cost.words, marks: before.marks + cost.marks, arrows: before.arrows + cost.arrows };
    const next = { facts: after.facts + cost.facts, words: after.words + cost.words, marks: after.marks + cost.marks, arrows: after.arrows + cost.arrows };
    const exceeded = [
      ...(next.facts > budgets.maxFacts ? ["facts" as const] : []),
      ...(next.words > budgets.maxWords ? ["words" as const] : []),
      ...(budgets.maxMarks !== null && next.marks > budgets.maxMarks ? ["marks" as const] : []),
      ...(next.arrows > budgets.maxArrows ? ["arrows" as const] : []),
    ];
    if (exceeded.length > 0) { dropped.push(Object.freeze({ fact, exceeded: Object.freeze(exceeded) })); continue; }
    after = next;
    kept.push(...bundle);
    keptIds.push(fact);
  }
  return { items: Object.freeze(kept), budget: Object.freeze({ before: Object.freeze(before), after: Object.freeze(after), kept: Object.freeze(keptIds), dropped: Object.freeze(dropped) }) };
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
  readonly unavailable: readonly { readonly projection: string; readonly reason: string }[];
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
      const position = Chess.fromSetup(parseFen(at.fen).unwrap()).unwrap();
      const legal = [...position.allDests()].flatMap(([from, destinations]) => [...destinations].map((to) => [from, to] as const));
      const [from, to] = [request.candidateUci.slice(0, 2), request.candidateUci.slice(2, 4)];
      const squareIndex = (name: string): number => "abcdefgh".indexOf(name[0]!) + (Number(name[1]) - 1) * 8;
      if (!legal.some(([origin, destination]) => origin === squareIndex(from) && destination === squareIndex(to))) throw new ModuleQueryError("MODULE_QUERY_CANDIDATE", "candidateUci is not legal in the subject position");
      const child = position.clone();
      const promotion = request.candidateUci[4] as "q" | "r" | "b" | "n" | undefined;
      const roles = { q: "queen", r: "rook", b: "bishop", n: "knight" } as const;
      child.play({ from: squareIndex(from), to: squareIndex(to), ...(promotion === undefined ? {} : { promotion: roles[promotion] }) });
      const afterFen = makeFen(child.toSetup());
      return { node: at, fen: afterFen, learner: turnOf(at.fen), edge: { beforeFen: at.fen, moveUci: request.candidateUci, afterFen } };
    }
    case "post_commit": {
      const at = node(request.subjectNodeId);
      const parent = at.parentId === null ? undefined : node(at.parentId);
      if (parent === undefined || at.moveUci === null || at.actor !== "user") throw new ModuleQueryError("MODULE_QUERY_SUBJECT", "the post-commit subject is not a learner move");
      return { node: at, fen: at.fen, learner: turnOf(parent.fen), edge: { beforeFen: parent.fen, moveUci: at.moveUci, afterFen: at.fen }, square: at.moveUci.slice(2, 4) as SquareName };
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

/** The admitted facts of earlier learner edges on the path (bounded novelty, §1.5). */
function ancestorFacts(run: DrillRun, module: ModuleId, subject: ModuleSubject, input: ModuleQueryInput): readonly (readonly ModuleFact[])[] {
  const window = moduleDeclaration(module).noveltyWindow;
  if (window === 0) return [];
  const path = branchPath(run, subject.node.branchId);
  const index = path.findIndex((candidate) => candidate.id === subject.node.id);
  const result: (readonly ModuleFact[])[] = [];
  for (let cursor = index - 1; cursor >= 1 && result.length < window; cursor -= 1) {
    const node = path[cursor]!;
    const parent = path[cursor - 1]!;
    if (node.actor !== "user" || node.moveUci === null) continue;
    const prior: ModuleSubject = { node, fen: node.fen, learner: subject.learner, edge: { beforeFen: parent.fen, moveUci: node.moveUci, afterFen: node.fen }, square: node.moveUci.slice(2, 4) as SquareName };
    const evidence = sources(module, prior, run, input.sources ?? {}).flatMap((result) => result.kind === "available" ? result.items.filter(witnessed) : []);
    const packet = compileModulePacket({ module, timing: "post_commit", role: input.role, session: input.session, evidence, mode: "admit" });
    result.push(packet.kind === "packet" ? packet.facts : Object.freeze([]));
  }
  return Object.freeze(result);
}

/** One state per family in registry order; mixed availability never collapses (§5.2). */
function inspectorFamilies(results: readonly ModuleSourceResult[], items: readonly PresentedEvidenceItem[]): readonly InspectorFamilyState[] {
  const facts = new Map<InspectorFamilyId, Set<string>>();
  for (const item of items) if (item.evidenceRef !== null) {
    const family = inspectorFamily(item.evidenceRef.projection.id);
    facts.set(family, (facts.get(family) ?? new Set()).add(item.evidenceRef.evidenceDigest));
  }
  const families = moduleDeclaration("full_inspector").emptyBehavior;
  const ids = families.kind === "family_partitioned" ? families.families : [];
  return Object.freeze(ids.map((family): InspectorFamilyState => {
    const count = facts.get(family)?.size ?? 0;
    if (count > 0) return Object.freeze({ family, kind: "available", factCount: count });
    const own = results.filter((result) => inspectorFamily(result.projection.split("@")[0]!) === family);
    const unavailable = own.find((result) => result.kind === "unavailable" && result.reason !== "not_requested");
    if (unavailable !== undefined && unavailable.kind === "unavailable") return Object.freeze({ family, kind: "unavailable", reason: unavailable.reason });
    if (own.some((result) => result.kind === "no_witness" || result.kind === "available")) return Object.freeze({ family, kind: "no_witness" });
    return Object.freeze({ family, kind: "not_requested" });
  }));
}

const EMPTY_STATE = (module: ModuleId): ModuleEmptyState => {
  const behavior = moduleDeclaration(module).emptyBehavior;
  if (behavior.kind === "family_partitioned") return Object.freeze({ kind: "family_partitioned", families: Object.freeze(behavior.families.map((family) => Object.freeze({ family, kind: "not_requested" as const }))) });
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
export function queryModules(input: ModuleQueryInput): { readonly page: ModuleQueryPage; readonly items: ReadonlyMap<ModuleId, readonly PresentedEvidenceItem[]> } {
  const { run, assistance, request } = input;
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
  const packets: ModuleQueryPacket[] = [];
  const suppressions: ModuleQueryPage["suppressions"][number][] = [];
  const itemsByModule = new Map<ModuleId, readonly PresentedEvidenceItem[]>();
  for (const module of MODULE_IDS) {
    const declared = moduleDeclaration(module).timings.find((entry) => entry.timing === timing);
    if (declared === undefined) { if (requested.has(module)) suppressions.push({ module, reason: "timing_outside_module" }); continue; }
    if (module === "guided_hint") { if (requested.has(module)) suppressions.push({ module, reason: "guided_hint_owned_elsewhere" }); continue; }
    if (module === "review_map" || module === "rules_floor" || module === "postcommit_nudge" && timing !== "post_commit") continue;
    const effect = assistance.modules.includes(module) && assistance.effects.some((entry) => entry.moduleId === module && entry.timing === timing && entry.subSurface === undefined);
    if (declared.initiative !== "proactive" && !requested.has(module)) continue;
    if (!effect) { suppressions.push({ module, reason: "not_effective" }); continue; }
    if (module === "sight_on_request" && subject.square === undefined) { suppressions.push({ module, reason: "no_square" }); continue; }
    const results = sources(module, subject, run, input.sources ?? {});
    if (module === "compare_coach" && results.some((result) => result.kind === "unavailable" && result.reason === "no_second_attempt")) { suppressions.push({ module, reason: "no_second_attempt" }); continue; }
    const available = results.flatMap((result) => result.kind === "available" ? result.items : []);
    const scoped = module === "sight_on_request" ? available.filter((item) => sightScope(item).includes(subject.square!)) : available;
    const evidence = scoped.filter(witnessed);
    const packet = compileModulePacket({ module, timing, role: input.role, session: input.session, evidence, ancestorFacts: ancestorFacts(run, module, subject, input), recorder: input.recorder ?? NULL_REDUCTION_QUALITY_RECORDER });
    if (packet.kind === "refused") { suppressions.push({ module, reason: "not_effective" }); continue; }
    const survivors = packet.facts.map((fact) => fact.evidence);
    const presented = survivors.length === 0 ? [] : presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: `module.${module}`, version: 1 }, survivors));
    assertAnswerCeiling(module, presented);
    const fitted = fitModulePresentation(module, presented);
    itemsByModule.set(module, fitted.items);
    const receipt = serializePresentedEvidence(fitted.items);
    const unavailable = results.flatMap((result) => result.kind === "unavailable" ? [Object.freeze({ projection: result.projection, reason: result.reason })] : []);
    const empty: ModuleEmptyState | null = module === "full_inspector"
      ? Object.freeze({ kind: "family_partitioned", families: inspectorFamilies(results, fitted.items) })
      : fitted.items.length === 0 ? EMPTY_STATE(module) : null;
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
  const accepted = ((MODULE_CONSUMER_ACCEPTS as Readonly<Record<string, readonly VersionedEvidenceId[]>>)[module] ?? []);
  const acquired = new Set(moduleQuerySourceRoutes(module, accepted.map((ref) => `${ref.id}@${ref.version}`)));
  return Object.freeze(accepted.filter((ref) => acquired.has(`${ref.id}@${ref.version}`)));
}
export { MODULE_QUERY_OPERATION };

/** Evidence digests of a sealed item, for tests and the disclosure trace. */
export function presentedFactDigest(item: PresentedEvidenceItem): string | null {
  return item.evidenceRef === null ? null : item.evidenceRef.evidenceDigest;
}

export { evidenceValueReceipt };
