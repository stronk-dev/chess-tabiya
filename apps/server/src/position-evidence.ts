import {
  recordedReadingEvidence,
  transposeKey,
  type DeclaredEvidence,
  type DrillRun,
  type Node,
  type PositionEvidenceIndex,
  type RecordedReading,
} from "@chess-tabiya/runtime";

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
  { kind: "citable_text", disposition: "refused", reason: "Citable text grounds authored prose and is not a position measurement" },
] as const);

export function assertRecordedReadingDispositions(): void {
  const kinds = new Set(RECORDED_READING_DISPOSITIONS.map((row) => row.kind));
  const missing = EVIDENCE_KINDS.filter((kind) => !kinds.has(kind));
  const extra = RECORDED_READING_DISPOSITIONS.map((row) => row.kind).filter((kind) => !EVIDENCE_KINDS.includes(kind));
  if (missing.length > 0 || extra.length > 0 || kinds.size !== RECORDED_READING_DISPOSITIONS.length) {
    throw new TypeError(`Recorded-reading dispositions do not cover the evidence registry: missing=${missing.join(",")} extra=${extra.join(",")}`);
  }
}

/**
 * [[D2327]]: each admitted ledger record is sealed as exact `sourcing.ledger.*` evidence and the
 * runtime recorded reading is derived from exactly that sealed record (runtime factory).
 */
function admittedReading(record: EvidenceRecord): readonly [string, DeclaredEvidence<RecordedReading>] | undefined {
  const reading = recordedReadingEvidence(record);
  if (reading === undefined) return undefined;
  return [transposeKey(reading.payload.fen), reading];
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
  const rows = new Map<string, DeclaredEvidence<RecordedReading>[]>();
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
): readonly DeclaredEvidence<RecordedReading>[] {
  const liveKinds = new Set(run.events.flatMap((event) => {
    if (event.type !== "evidence.attached" || event.data.nodeId !== node.id) return [];
    if (event.data.payload.kind === "tablebase") return ["tablebase_result" as const];
    if (event.data.payload.kind === "eval") return ["engine_eval" as const];
    return [];
  }));
  return Object.freeze((index?.get(node.transposeKey) ?? []).filter(({ payload: reading }) =>
    !liveKinds.has(reading.kind) &&
    (reading.kind !== "tablebase_result" || halfmoveClock(reading.fen) === halfmoveClock(node.fen)),
  ));
}
