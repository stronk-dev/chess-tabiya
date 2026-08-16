import {
  transposeKey,
  type DrillRun,
  type Node,
  type PositionEvidenceIndex,
  type RecordedReading,
} from "@chess-tabiya/runtime";

import { ASSESSMENT_CATEGORIES } from "./tablebase.js";
import { validateLedger } from "./sourcing/ledger-validation.js";
import {
  EVIDENCE_KINDS,
  type EvidenceKind,
  type EvidenceRecord,
  type SourcingIssue,
} from "./sourcing/types.js";

export type RecordedReadingDisposition = Readonly<{
  kind: EvidenceKind;
  disposition: "admitted" | "refused";
  reason: string;
}>;

export const RECORDED_READING_DISPOSITIONS: readonly RecordedReadingDisposition[] = Object.freeze([
  { kind: "opening_identity", disposition: "refused", reason: "Opening identity is position naming, not a recorded measurement" },
  { kind: "position_legality", disposition: "refused", reason: "Position legality and piece count are recomputed exactly at rung 0" },
  { kind: "explorer_frequency", disposition: "refused", reason: "No loadable pack producer emits this move-frequency record kind" },
  { kind: "explorer_position_census", disposition: "refused", reason: "No loadable pack producer emits this position-census record kind" },
  { kind: "tablebase_result", disposition: "admitted", reason: "Exact Syzygy category and distance readings are recorded at authored positions" },
  { kind: "engine_eval", disposition: "admitted", reason: "Single-line white-perspective engine readings are recorded at authored positions" },
  { kind: "puzzle_provenance", disposition: "refused", reason: "Puzzle provenance is a citation, not a recorded measurement" },
] as const);

export function assertRecordedReadingDispositions(): void {
  const kinds = new Set(RECORDED_READING_DISPOSITIONS.map((row) => row.kind));
  const missing = EVIDENCE_KINDS.filter((kind) => !kinds.has(kind));
  const extra = RECORDED_READING_DISPOSITIONS.map((row) => row.kind).filter((kind) => !EVIDENCE_KINDS.includes(kind));
  if (missing.length > 0 || extra.length > 0 || kinds.size !== RECORDED_READING_DISPOSITIONS.length) {
    throw new TypeError(`Recorded-reading dispositions do not cover the evidence registry: missing=${missing.join(",")} extra=${extra.join(",")}`);
  }
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function nullableFinite(value: unknown): value is number | null {
  return value === null || finite(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function engineReading(record: EvidenceRecord, fen: string): RecordedReading | undefined {
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

function tablebaseReading(record: EvidenceRecord, fen: string): RecordedReading | undefined {
  const values = record.values;
  if (!ASSESSMENT_CATEGORIES.includes(values.category as never) || !nullableFinite(values.dtz) ||
      !nullableFinite(values.precise_dtz) || !nullableFinite(values.dtm) || !finite(values.pieceCount) ||
      typeof values.checkmate !== "boolean" || typeof values.stalemate !== "boolean" ||
      typeof values.insufficient_material !== "boolean") return undefined;
  return Object.freeze({
    kind: "tablebase_result",
    fen,
    sourceId: record.sourceId,
    retrievedAt: record.retrievedAt,
    values: Object.freeze({
      category: values.category as (typeof ASSESSMENT_CATEGORIES)[number],
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

function admittedReading(record: EvidenceRecord): readonly [string, RecordedReading] | undefined {
  if (record.grounds !== "machine_validation" || record.templateId !== undefined) return undefined;
  if (record.kind !== "engine_eval" && record.kind !== "tablebase_result") return undefined;
  const fen = record.anchor.fen;
  if (typeof fen !== "string") return undefined;
  let key: string;
  try {
    key = transposeKey(fen);
  } catch {
    return undefined;
  }
  const reading = record.kind === "engine_eval" ? engineReading(record, fen) : tablebaseReading(record, fen);
  return reading === undefined ? undefined : [key, reading];
}

export function buildPositionEvidenceIndex(input: {
  readonly ledger?: unknown;
  readonly grounding: "ledger_verified" | "unverified";
  readonly packDigest: string;
}): PositionEvidenceIndex {
  if (input.grounding !== "ledger_verified") return new Map();
  const issues: SourcingIssue[] = [];
  const ledger = validateLedger(input.ledger, issues);
  if (ledger === undefined || issues.length > 0 || ledger.packDigest !== input.packDigest) return new Map();
  const rows = new Map<string, RecordedReading[]>();
  for (const record of ledger.records) {
    const admitted = admittedReading(record);
    if (admitted === undefined) continue;
    const [key, reading] = admitted;
    rows.set(key, [...(rows.get(key) ?? []), reading]);
  }
  return new Map([...rows].map(([key, readings]) => [key, Object.freeze(readings)]));
}

function halfmoveClock(fen: string): string | undefined {
  return fen.trim().split(/\s+/u)[4];
}

export function recordedReadingsAt(
  index: PositionEvidenceIndex | undefined,
  node: Node,
  run: DrillRun,
): readonly RecordedReading[] {
  const liveKinds = new Set(run.events.flatMap((event) => {
    if (event.type !== "evidence.attached" || event.data.nodeId !== node.id) return [];
    if (event.data.payload.kind === "tablebase") return ["tablebase_result" as const];
    if (event.data.payload.kind === "eval") return ["engine_eval" as const];
    return [];
  }));
  return Object.freeze((index?.get(node.transposeKey) ?? []).filter((reading) =>
    !liveKinds.has(reading.kind) &&
    (reading.kind !== "tablebase_result" || halfmoveClock(reading.fen) === halfmoveClock(node.fen)),
  ));
}
