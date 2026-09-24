import type { AssessmentCategory } from "@chess-tabiya/schema/drill-pack";

import { transposeKey } from "./chess.js";
import type { RecordedReading } from "./voice.js";

/**
 * Structural shape of one validated sourcing-ledger record (the server owns validation). The
 * runtime reading projection below is the pure operation behind [[D2327]]: a recorded reading is
 * derived only from the exact same-record `sourcing.ledger.*` evidence.
 */
export interface SourcingLedgerRecord {
  readonly kind: string;
  readonly anchor: Readonly<Record<string, string>>;
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly grounds?: string;
  readonly values: Readonly<Record<string, unknown>>;
  readonly supports?: readonly string[];
  readonly templateId?: string;
}

export const RECORDED_ASSESSMENT_CATEGORIES = Object.freeze(["win", "loss", "draw", "cursed-win", "blessed-loss"] as const satisfies readonly AssessmentCategory[]);

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
function nullableFinite(value: unknown): value is number | null {
  return value === null || finite(value);
}
function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function engineReading(record: SourcingLedgerRecord, fen: string): RecordedReading | undefined {
  const values = record.values;
  const hasCp = finite(values.centipawns) && values.mateIn === undefined;
  const hasMate = finite(values.mateIn) && values.centipawns === undefined;
  if ((!hasCp && !hasMate) || !finite(values.depth) || values.multiPv !== 1 || values.perspective !== "white" ||
      !nonEmpty(values.engineId) || !nonEmpty(values.engineName) || !nonEmpty(values.engineVersion)) return undefined;
  return Object.freeze({
    kind: "engine_eval",
    fen,
    sourceId: record.sourceId,
    retrievedAt: record.retrievedAt,
    values: Object.freeze({
      ...(hasCp ? { centipawns: values.centipawns as number } : { mateIn: values.mateIn as number }),
      depth: values.depth,
      multiPv: 1,
      perspective: "white",
      engineId: values.engineId,
      engineName: values.engineName,
      engineVersion: values.engineVersion,
    }),
  });
}

function tablebaseReading(record: SourcingLedgerRecord, fen: string): RecordedReading | undefined {
  const values = record.values;
  if (!RECORDED_ASSESSMENT_CATEGORIES.includes(values.category as never) || !nullableFinite(values.dtz) ||
      !nullableFinite(values.precise_dtz) || !nullableFinite(values.dtm) || !finite(values.pieceCount) ||
      typeof values.checkmate !== "boolean" || typeof values.stalemate !== "boolean" ||
      typeof values.insufficient_material !== "boolean") return undefined;
  return Object.freeze({
    kind: "tablebase_result",
    fen,
    sourceId: record.sourceId,
    retrievedAt: record.retrievedAt,
    values: Object.freeze({
      category: values.category as AssessmentCategory,
      dtz: values.dtz,
      preciseDtz: values.precise_dtz,
      dtm: values.dtm,
      pieceCount: values.pieceCount,
      checkmate: values.checkmate,
      stalemate: values.stalemate,
      insufficientMaterial: values.insufficient_material,
    }),
  });
}

/**
 * Projects one machine-validation ledger record to the runtime recorded reading, or `undefined`
 * when the record is not an admitted engine/tablebase measurement at a legal anchor FEN.
 */
export function recordedReadingFromLedgerRecord(record: SourcingLedgerRecord): RecordedReading | undefined {
  if (record.grounds !== "machine_validation" || record.templateId !== undefined) return undefined;
  if (record.kind !== "engine_eval" && record.kind !== "tablebase_result") return undefined;
  const fen = record.anchor.fen;
  if (typeof fen !== "string") return undefined;
  try {
    transposeKey(fen);
  } catch {
    return undefined;
  }
  return record.kind === "engine_eval" ? engineReading(record, fen) : tablebaseReading(record, fen);
}
