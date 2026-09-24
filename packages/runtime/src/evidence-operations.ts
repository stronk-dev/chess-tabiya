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
import type { AuthoredFeedbackItemRecord } from "./evidence-factories.js";
import type { CandidateFeatureInput, CandidateFeatureVector } from "./candidate-feature-vector.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { pivotalMarkerEvidenceItems } from "./pivotal.js";
import type { SourcingLedgerRecord } from "./recorded-reading.js";
import type { ShapeTriggerSource } from "./shape-firing.js";
import { STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";
import type { DrillRun, EvidencePayload, Node, SelectionEngineIdentity } from "./types.js";
import type { RecordedReading } from "./voice.js";
import type { RecordedEdge } from "./recorded-edge.js";

const READING_KINDS = Object.freeze(STRUCTURAL_FEATURE_KINDS.filter((kind) => kind !== "pawn_count" && kind !== "named_structure"));

export interface PositionGuidanceEvidenceInput {
  readonly run: DrillRun;
  readonly node: Node;
  readonly pack?: DrillPackDefinition;
  readonly shapes?: readonly (ShapeTriggerSource & { readonly name?: string })[];
  readonly authored?: readonly AuthoredFeedbackItemRecord[];
  readonly recorded?: readonly DeclaredEvidence<RecordedReading>[];
}

/**
 * The guidance packet's sealed evidence at one recorded node: phase@2, pack phase, named
 * structure@2, structural readings, the node's four-kind pivotal markers, endgame classification,
 * matching shape firings, authored claims and already-sealed recorded readings.
 */
export function positionGuidanceEvidence(input: PositionGuidanceEvidenceInput): readonly DeclaredEvidence<unknown>[] {
  const fen = input.node.fen;
  return Object.freeze([
    invokeEvidenceValueRoute("rules.phase.reading@2", { fen }),
    ...(input.pack === undefined ? [] : [invokeEvidenceValueRoute("pack.authored.phase@1", { pack: input.pack })]),
    ...invokeEvidenceValueRoute("rules.structural.reading.named_structure@2", { fen }),
    ...READING_KINDS.flatMap((kind) => invokeEvidenceValueRoute(`rules.structural.reading.${kind}@1`, { fen })),
    ...pivotalMarkerEvidenceItems(input.run, input.node.branchId).filter((item) => item.payload.nodeId === input.node.id),
    ...invokeEvidenceValueRoute("rules.endgame.classification@1", { fen }),
    ...(input.shapes === undefined || input.shapes.length === 0 ? [] : invokeEvidenceValueRoute("theory.shapes.firing@1", { entries: input.shapes.map((shape) => ({ id: shape.id, trigger: shape.trigger })), path: [{ id: input.node.id, fen }] })),
    ...(input.authored ?? []).flatMap((item) => invokeEvidenceValueRoute("pack.authored.claim@1", { item })),
    ...(input.recorded ?? []),
  ]);
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

/** One exact recorded parent/child edge (`run.record.edge@1`) of an actual run. */
export function recordedEdgeEvidence(run: DrillRun, parent: Node, child: Node): DeclaredEvidence<RecordedEdge> {
  return invokeEvidenceValueRoute("run.record.edge@1", { run, parent, child });
}

/** Authored structural condition from its pack/shape document pointer. */
export type AuthoredConditionSource = { readonly source: "pack" | "shape"; readonly documentId: string; readonly pointer: string; readonly expression: StructuralExpression };
