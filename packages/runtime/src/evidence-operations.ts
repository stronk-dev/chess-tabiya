/**
 * Production evidence operations for server and web callers (rfc/evidence-value-authority.md §1).
 *
 * Server and web modules never mint: they call these runtime operations, each of which passes only
 * authority inputs (a FEN, a recorded run/node, a pack/authored record, a typed provider response
 * or a validated ledger record) to the one dispatcher `invokeEvidenceValueRoute`. None accepts an
 * output payload, and none is a generic mint API: every operation names its exact projections.
 */
import type { DrillPackDefinition, StructuralExpression } from "@chess-tabiya/schema/drill-pack";

import type { DeclaredEvidence } from "./evidence-contract.js";
import type { AuthoredFeedbackItemRecord, BoundedTargetPolicyBoundsFactoryResult, EngineTargetPolicyFactoryResult, PackConceptReferencePayload } from "./evidence-factories.js";
import type { CompiledConceptRegistry } from "./concept-registry.js";

export type { PackConceptReferencePayload } from "./evidence-factories.js";
import type { CandidateFeatureInput, CandidateFeatureVector } from "./candidate-feature-vector.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { positiveMaterialThreatExchanges, type LegalExchangeEvidence, type SourceLegalMovesEvidence, type ThreatEvidence } from "./bounded-target-chess.js";
import { threatEvidencePassAnchor } from "./threat-pass-authority.js";
import type { PhaseBandReadingV2 } from "./phase.js";
import type { EndgameClassification } from "./endgame.js";
import { pivotalMarkerEvidenceItems } from "./pivotal.js";
import type { SourcingLedgerRecord } from "./recorded-reading.js";
import type { ShapeTriggerSource } from "./shape-firing.js";
import { STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";
import type { DrillRun, EvidencePayload, Node, SelectionEngineIdentity } from "./types.js";
import type { RecordedReading } from "./voice.js";
import type { RecordedEdge } from "./recorded-edge.js";
import type { ExplorerPopulationSummary } from "./explorer-summary.js";
import type { MaiaExactFenMoveOccurrence, MaiaOccurrencePageEvidence, MaiaRunMoveOccurrence } from "./maia-occurrence.js";
import { assertResolvedRunSubject, type ResolvedRunSubject } from "./run-subject.js";
import type { ExplorerPositionPage } from "./provider-types.js";
import type { ProviderDelivery, ProviderEvidenceDelivery, ProviderLocalDomainResult, ProviderOperationId, ProviderOperationResultMap } from "./provider-types.js";
import { providerProtocolRow } from "./provider-protocol.js";

/**
 * rfc/bounded-policy-targets.md §1: the complete sealed authority set a bounded-target batch owns,
 * minted from one source FEN through the sole value routes — the FEN-owning threat reading (with
 * its bound pass anchor), one legal-exchange item per positive material threat capture on the
 * passed position, and the exact source legal-move map. The caller never supplies a payload.
 */
export function boundedTargetSourceEvidence(fen: string): { readonly threat: ThreatEvidence; readonly exchanges: readonly LegalExchangeEvidence[]; readonly sourcePosition: SourceLegalMovesEvidence } {
  const threat = invokeEvidenceValueRoute("rules.tactic.consequence.threat@1", { fen }) as ThreatEvidence;
  const passed = threatEvidencePassAnchor(threat);
  const exchanges = passed.kind !== "available" ? [] : positiveMaterialThreatExchanges(threat.payload).flatMap((exchange) => invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", { fen: passed.anchor.passedFen, captureUci: exchange.captureUci }) as readonly LegalExchangeEvidence[]);
  const sourcePosition = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen }) as SourceLegalMovesEvidence;
  return Object.freeze({ threat, exchanges: Object.freeze(exchanges), sourcePosition });
}

/**
 * rfc/bounded-target-policy-composition.md §5: the two reported policy derivations over sealed local
 * facts and sealed raw provider receipts. The server operation passes only authority inputs; the
 * runtime value routes compute and seal the payload.
 */
export function derivedBoundedTargetPolicyEvidence(arm: "engine", input: { readonly target: DeclaredEvidence<unknown>; readonly immediate: DeclaredEvidence<unknown>; readonly boundedReturn?: DeclaredEvidence<unknown>; readonly counterfactualUci: string; readonly tables: readonly DeclaredEvidence<unknown>[] }): EngineTargetPolicyFactoryResult;
export function derivedBoundedTargetPolicyEvidence(arm: "maia", input: { readonly target: DeclaredEvidence<unknown>; readonly immediate: DeclaredEvidence<unknown>; readonly boundedReturn?: DeclaredEvidence<unknown>; readonly counterfactualUci: string; readonly band: number; readonly root: DeclaredEvidence<unknown>; readonly second: readonly DeclaredEvidence<unknown>[] }): BoundedTargetPolicyBoundsFactoryResult;
export function derivedBoundedTargetPolicyEvidence(arm: "engine" | "maia", input: object): EngineTargetPolicyFactoryResult | BoundedTargetPolicyBoundsFactoryResult {
  return arm === "engine"
    ? invokeEvidenceValueRoute("derived.bounded_target.engine_target_policy@1", input as never) as EngineTargetPolicyFactoryResult
    : invokeEvidenceValueRoute("derived.bounded_target.policy_bounds@1", input as never) as BoundedTargetPolicyBoundsFactoryResult;
}

/**
 * rfc/phase-source-composition.md §2: the two rules-only phase sources at one exact FEN through
 * their sole value routes — `rules.phase.reading@2` and the (0-or-1) `rules.endgame.classification@1`.
 */
export function phaseReadingEvidence(fen: string): { readonly phase: DeclaredEvidence<PhaseBandReadingV2>; readonly endgame: readonly DeclaredEvidence<EndgameClassification>[] } {
  return Object.freeze({
    phase: invokeEvidenceValueRoute("rules.phase.reading@2", { fen }) as DeclaredEvidence<PhaseBandReadingV2>,
    endgame: invokeEvidenceValueRoute("rules.endgame.classification@1", { fen }) as readonly DeclaredEvidence<EndgameClassification>[],
  });
}

/** The exact `run.record.position@1` item for one recorded node (the phase-source join authority). */
export function invokeRunRecordPosition(run: DrillRun, nodeId: string): DeclaredEvidence<{ readonly nodeId: string; readonly ply: number; readonly fen: string }> {
  return invokeEvidenceValueRoute("run.record.position@1", { run, nodeId }) as DeclaredEvidence<{ readonly nodeId: string; readonly ply: number; readonly fen: string }>;
}

const READING_KINDS = Object.freeze(STRUCTURAL_FEATURE_KINDS.filter((kind) => kind !== "pawn_count" && kind !== "named_structure"));

export interface PositionGuidanceEvidenceInput {
  readonly run: DrillRun;
  readonly node: Node;
  readonly pack?: DrillPackDefinition;
  readonly shapes?: readonly (ShapeTriggerSource & { readonly name?: string })[];
  readonly authored?: readonly AuthoredFeedbackItemRecord[];
  readonly recorded?: readonly DeclaredEvidence<RecordedReading>[];
  /**
   * rfc/phase-source-composition.md §5: the Support call site passes the compiled point's exact
   * rules-phase and endgame items; they are retained, never re-minted beside the point.
   */
  readonly phaseSources?: { readonly phase: DeclaredEvidence<unknown>; readonly endgame: readonly DeclaredEvidence<unknown>[] };
}

/**
 * The guidance packet's sealed evidence at one recorded node: phase@2, pack phase, named
 * structure@2, structural readings, the node's four-kind pivotal markers, endgame classification,
 * matching shape firings, authored claims and already-sealed recorded readings.
 */
export function positionGuidanceEvidence(input: PositionGuidanceEvidenceInput): readonly DeclaredEvidence<unknown>[] {
  const fen = input.node.fen;
  return Object.freeze([
    input.phaseSources?.phase ?? invokeEvidenceValueRoute("rules.phase.reading@2", { fen }),
    ...(input.pack === undefined ? [] : [invokeEvidenceValueRoute("pack.authored.phase@1", { pack: input.pack })]),
    ...invokeEvidenceValueRoute("rules.structural.reading.named_structure@2", { fen }),
    ...READING_KINDS.flatMap((kind) => invokeEvidenceValueRoute(`rules.structural.reading.${kind}@1`, { fen })),
    ...pivotalMarkerEvidenceItems(input.run, input.node.branchId).filter((item) => item.payload.nodeId === input.node.id),
    ...(input.phaseSources?.endgame ?? invokeEvidenceValueRoute("rules.endgame.classification@1", { fen })),
    ...(input.shapes === undefined || input.shapes.length === 0 ? [] : invokeEvidenceValueRoute("theory.shapes.firing@1", { entries: input.shapes.map((shape) => ({ id: shape.id, trigger: shape.trigger })), path: [{ id: input.node.id, fen }] })),
    ...(input.authored ?? []).flatMap((item) => invokeEvidenceValueRoute("pack.authored.claim@1", { item })),
    ...(input.recorded ?? []),
  ]);
}

/**
 * rfc/concept-registry.md §3: the identity-only `pack.authored.concept_reference@1` population of
 * one validated pack — the input Skills and Campaign consume instead of parsing pack JSON. The
 * registry must be the private compiled registry and the digest the pack's complete-document one.
 */
export function packConceptReferenceEvidence(input: {
  readonly pack: DrillPackDefinition;
  readonly packDigest: string;
  readonly registry: CompiledConceptRegistry;
}): readonly DeclaredEvidence<PackConceptReferencePayload>[] {
  return invokeEvidenceValueRoute("pack.authored.concept_reference@1", { pack: input.pack, packDigest: input.packDigest, registry: input.registry }) as readonly DeclaredEvidence<PackConceptReferencePayload>[];
}

/**
 * [[D2327]]: seals one validated ledger record as `sourcing.ledger.*` evidence and derives the
 * runtime recorded reading from exactly that sealed record, or `undefined` when not admitted.
 */
export function recordedReadingEvidence(record: SourcingLedgerRecord): DeclaredEvidence<RecordedReading> | undefined {
  if (record.kind === "engine_eval") {
    const ledger = invokeEvidenceValueRoute("sourcing.ledger.engine_eval@1", { record });
    const reading = invokeEvidenceValueRoute("recorded.engine.eval@1", { ledger });
    return reading.kind === "available" ? reading.value as DeclaredEvidence<RecordedReading> : undefined;
  }
  if (record.kind === "tablebase_result") {
    const ledger = invokeEvidenceValueRoute("sourcing.ledger.tablebase_result@1", { record });
    const reading = invokeEvidenceValueRoute("recorded.tablebase.result@1", { ledger });
    return reading.kind === "available" ? reading.value as DeclaredEvidence<RecordedReading> : undefined;
  }
  return undefined;
}

/** A sourcing-ledger record sealed under the exact projection its own kind names. */
export function sourcingRecordEvidence<T extends SourcingLedgerRecord>(record: T): DeclaredEvidence<T> | undefined {
  return sourcingRecordEvidenceUntyped(record) as DeclaredEvidence<T> | undefined;
}

function sourcingRecordEvidenceUntyped(record: SourcingLedgerRecord): DeclaredEvidence<SourcingLedgerRecord> | undefined {
  switch (record.kind) {
    case "engine_eval": return invokeEvidenceValueRoute("sourcing.ledger.engine_eval@1", { record });
    case "tablebase_result": return invokeEvidenceValueRoute("sourcing.ledger.tablebase_result@1", { record });
    case "explorer_position_census": return invokeEvidenceValueRoute("sourcing.ledger.explorer_position_census@1", { record });
    case "citable_text": return invokeEvidenceValueRoute("sourcing.ledger.citable_text@1", { record });
    case "opening_identity": return invokeEvidenceValueRoute("theory.opening_identity.record@1", { record });
    default: return undefined;
  }
}

/** An attached run evidence packet sealed under the exact live projection its kind/source names. */
export function attachedPacketEvidence(packet: EvidencePayload): DeclaredEvidence<unknown> {
  if (packet.source === "human_model_predicted") return invokeEvidenceValueRoute("human.maia.event@1", { packet });
  if (packet.kind === "tablebase") return invokeEvidenceValueRoute("live.syzygy.result@1", { packet });
  if (packet.kind === "eval") return invokeEvidenceValueRoute("live.stockfish.eval@1", { packet });
  if (packet.kind === "wdl") return invokeEvidenceValueRoute("live.stockfish.wdl@1", { packet });
  if (packet.kind === "bestline") return invokeEvidenceValueRoute("live.stockfish.pv@1", { packet });
  throw new TypeError(`Unsupported attached evidence packet kind ${String(packet.kind)}`);
}

/** Guard-condition readings from attached engine/tablebase packets. */
export function guardConditionEvidence(kind: "engine_eval" | "tablebase_category" | "tablebase_distance", packet: EvidencePayload): DeclaredEvidence<unknown> {
  if (kind === "engine_eval") return invokeEvidenceValueRoute("live.stockfish.eval@1", { packet });
  if (kind === "tablebase_category") return invokeEvidenceValueRoute("live.syzygy.category@1", { packet });
  return invokeEvidenceValueRoute("live.syzygy.distance@1", { packet });
}

/** Opponent-selection provider responses (typed response bytes). */
export function opponentProviderEvidence<T extends object>(source: "maia" | "stockfish" | "syzygy", payload: T): DeclaredEvidence<T> {
  if (source === "maia") return invokeEvidenceValueRoute("human.maia.uci_response@1", { lines: payload as unknown as readonly string[] }) as unknown as DeclaredEvidence<T>;
  if (source === "stockfish") return invokeEvidenceValueRoute("live.stockfish.uci_response@1", { lines: payload as unknown as readonly string[] }) as unknown as DeclaredEvidence<T>;
  return invokeEvidenceValueRoute("live.syzygy.probe_result@1", { position: payload as unknown as Readonly<Record<string, unknown>> }) as unknown as DeclaredEvidence<T>;
}

/** Explorer per-position result used by repertoire scanning. */
export function corpusPositionEvidence<T extends object>(result: T): DeclaredEvidence<T> {
  return invokeEvidenceValueRoute("human.explorer.position_stats@1", { result: result as Readonly<Record<string, unknown>> }) as DeclaredEvidence<T>;
}

/** On-request inspector pages. */
export function humanSplitPageEvidence<T extends object>(page: T): DeclaredEvidence<T> {
  return invokeEvidenceValueRoute("human.maia.policy@1", { page: page as Readonly<Record<string, unknown>> }) as DeclaredEvidence<T>;
}
export function corpusPageEvidence<T extends object>(page: T): DeclaredEvidence<T> {
  return invokeEvidenceValueRoute("human.explorer.population@1", { page: page as Readonly<Record<string, unknown>> }) as DeclaredEvidence<T>;
}

/** The authored delivery-sheet claim item. */
export function claimDeliveryEvidence<T extends object>(item: T): DeclaredEvidence<T> {
  return invokeEvidenceValueRoute("pack.authored.claim_delivery@1", { item: item as never }) as DeclaredEvidence<T>;
}

/** The evidence-reference resolution plus the attached packet it names, if any. */
export function evidenceReferenceEvidence(reference: string, pack?: DrillPackDefinition, payloads?: ReadonlyMap<string, EvidencePayload>): readonly DeclaredEvidence<unknown>[] {
  const resolution = invokeEvidenceValueRoute("run.record.evidence_ref_resolution@1", { reference, ...(pack === undefined ? {} : { pack }), ...(payloads === undefined ? {} : { payloads }) });
  const packet = payloads?.get(reference);
  const attached = packet !== undefined && (reference.startsWith("engine:") || reference.startsWith("tablebase:")) ? [attachedPacketEvidence(packet)] : [];
  return Object.freeze([resolution, ...attached]);
}

/** The candidate feature vector recomputed through the collector factories. */
export function candidateFeatureVectorEvidence(input: { readonly beforeFen: string; readonly engine: SelectionEngineIdentity; readonly candidates: readonly CandidateFeatureInput[] }): DeclaredEvidence<CandidateFeatureVector> {
  return invokeEvidenceValueRoute("derived.opponent.candidate_feature_vector@1", input);
}

/** The sole move-free Explorer derivation; callers supply only the admitted source page. */
export function deriveExplorerPopulationSummary(page: DeclaredEvidence<ProviderEvidenceDelivery<ExplorerPositionPage, "lichess_explorer.position_page@1">>): DeclaredEvidence<ExplorerPopulationSummary> {
  return invokeEvidenceValueRoute("derived.explorer.population_summary@1", { page });
}

/** History and move bytes come only from the selected, sealed historical run edge. */
export function deriveMaiaRunMoveOccurrence(page: MaiaOccurrencePageEvidence, resolved: ResolvedRunSubject): DeclaredEvidence<MaiaRunMoveOccurrence> {
  assertResolvedRunSubject(resolved);
  if (resolved.subject.kind !== "run_edge") throw new TypeError("Maia run occurrence requires a run edge");
  const { run, subject } = resolved;
  const parent = run.nodes.find(node => node.id === subject.beforeNodeId)!;
  const child = run.nodes.find(node => node.id === subject.afterNodeId)!;
  const edge = recordedEdgeEvidence(run, parent, child);
  return invokeEvidenceValueRoute("derived.maia.run_move_occurrence@1", { page, resolved, edge });
}

export function deriveMaiaExactFenMoveOccurrence(page: MaiaOccurrencePageEvidence, observedMoveUci: string): DeclaredEvidence<MaiaExactFenMoveOccurrence> {
  return invokeEvidenceValueRoute("derived.maia.exact_fen_move_occurrence@1", { page, observedMoveUci });
}

/**
 * The exact operation-keyed provider source projection for one scheduler-sealed delivery
 * (rfc/provider-exchange-and-execution.md §9). The route is chosen by the operation, never by
 * the caller; a delivery of another operation fails the route's seal assertion.
 */
export function providerSourceEvidence<K extends ProviderOperationId>(operation: K, delivery: ProviderDelivery<ProviderOperationResultMap[K], K>): DeclaredEvidence<ProviderEvidenceDelivery<ProviderOperationResultMap[K], K>> {
  const route = providerProtocolRow(operation).sourceProjection;
  return invokeEvidenceValueRoute(route, { delivery } as never) as unknown as DeclaredEvidence<ProviderEvidenceDelivery<ProviderOperationResultMap[K], K>>;
}

/** The local rules fact for one scheduler-sealed Syzygy outside-domain envelope (§7). */
export function syzygyTablebaseDomainEvidence(result: ProviderLocalDomainResult<"syzygy.position@1">): DeclaredEvidence<ProviderLocalDomainResult<"syzygy.position@1">> {
  return invokeEvidenceValueRoute("rules.endgame.tablebase_domain@1", { result }) as DeclaredEvidence<ProviderLocalDomainResult<"syzygy.position@1">>;
}

/** One exact recorded parent/child edge (`run.record.edge@1`) of an actual run. */
export function recordedEdgeEvidence(run: DrillRun, parent: Node, child: Node): DeclaredEvidence<RecordedEdge> {
  return invokeEvidenceValueRoute("run.record.edge@1", { run, parent, child });
}

/** Authored structural condition from its pack/shape document pointer. */
export type AuthoredConditionSource = { readonly source: "pack" | "shape"; readonly documentId: string; readonly pointer: string; readonly expression: StructuralExpression };
