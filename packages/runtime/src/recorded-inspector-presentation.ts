// Accepted Full Inspector successor: fixed readable fields of historical reports, not modern
// provider validation. Unknown report fields/prose never enter a component or its sentence.
import { normalizeMove } from "chessops/chess";
import { makeSanAndPlay } from "chessops/san";
import { parseUci } from "chessops/util";
import { positionFromFen } from "./chess.js";
import { assertDeclaredEvidence, type DeclaredEvidence } from "./evidence-contract.js";
import { SYZYGY_TABLEBASE_CATEGORIES, type SyzygyTablebaseCategory } from "./provider-types.js";
import type { RecordedInspectorPacket, RecordedInspectorTablebaseDistance, RecordedInspectorTablebaseCategory, ReportedInspectorField } from "./recorded-inspector.js";
import { PresentationSchemaError, s, type Parser } from "./presentation-schema.js";

const field = <T>(parse: Parser<T>) => s.union("kind", {
  reported: s.obj({ kind: s.lit("reported"), value: parse }),
  not_recorded: s.obj({ kind: s.lit("not_recorded") }),
  uninterpretable: s.obj({ kind: s.lit("uninterpretable") }),
});
const report = { reportSeq: ((value, label) => { const seq = s.nat(value, label); if (seq < 1) throw new PresentationSchemaError(`${label} must name a recorded event`); return seq; }) as Parser<number> };
const reportedPerMille: Parser<number> = (value, label) => { const count = s.nat(value, label); if (count > 1000) throw new PresentationSchemaError(`${label} exceeds a reported per-mille value`); return count; };
export const recordedEvalOperands = s.obj({ ...report, centipawns: field(s.int), mateIn: field(s.int), perspective: field(s.lit("white", "side_to_move")) });
export const recordedWdlOperands = s.obj({ ...report, win: field(reportedPerMille), draw: field(reportedPerMille), loss: field(reportedPerMille) });
export const recordedPvOperands = s.obj({ ...report, line: field(s.arr(s.san)) });
export const recordedTablebaseCategoryOperands = s.obj({ ...report, category: field(s.lit(...SYZYGY_TABLEBASE_CATEGORIES)) });
export const recordedTablebaseDistanceOperands = s.obj({ ...report, category: field(s.lit(...SYZYGY_TABLEBASE_CATEGORIES)),
  dtz: field(s.nullable(s.int)), preciseDtz: field(s.nullable(s.int)), dtm: field(s.nullable(s.int)) });
export const recordedTablebaseOperands = s.obj({ ...report, category: field(s.lit(...SYZYGY_TABLEBASE_CATEGORIES)),
  dtz: field(s.nullable(s.int)), preciseDtz: field(s.nullable(s.int)), dtm: field(s.nullable(s.int)), pieceCount: field(s.nat) });

function reported<T>(values: Readonly<Record<string, unknown>>, key: string, accepts: (value: unknown) => value is T): ReportedInspectorField<T> {
  if (!Object.hasOwn(values, key)) return Object.freeze({ kind: "not_recorded" });
  const value = values[key];
  return accepts(value) ? Object.freeze({ kind: "reported", value }) : Object.freeze({ kind: "uninterpretable" });
}
const integer = (value: unknown): value is number => Number.isSafeInteger(value);
const distance = (value: unknown): value is number | null => value === null || integer(value);
const nonnegative = (value: unknown): value is number => integer(value) && value >= 0;
const perMille = (value: unknown): value is number => nonnegative(value) && value <= 1000;
const category = (value: unknown): value is SyzygyTablebaseCategory => typeof value === "string" && (SYZYGY_TABLEBASE_CATEGORIES as readonly string[]).includes(value);
function packet(evidence: DeclaredEvidence<unknown>, kind: "eval" | "wdl" | "pv" | "tablebase"): RecordedInspectorPacket {
  assertDeclaredEvidence(evidence);
  if (evidence.projection.id !== `recorded.inspector.${kind}_packet` || evidence.projection.version !== 1) throw new TypeError("Historical renderer requires its exact original packet");
  const value = evidence.payload as RecordedInspectorPacket;
  if (value.authority !== "recorded_report_only" || value.event.type !== "evidence.attached"
    || value.event.data.nodeId !== value.subject.nodeId || value.event.data.payload.kind !== (kind === "pv" ? "bestline" : kind)) throw new TypeError("Historical renderer lost its recorded occurrence");
  return value;
}
export function recordedInspectorEvalOperands(evidence: DeclaredEvidence<unknown>) {
  const source = packet(evidence, "eval"), values = source.event.data.payload.values;
  return recordedEvalOperands({ reportSeq: source.event.seq, centipawns: reported(values, "centipawns", integer), mateIn: reported(values, "mateIn", integer),
    perspective: reported(values, "perspective", (value): value is "white" | "side_to_move" => value === "white" || value === "side_to_move") }, "historical evaluation");
}
export function recordedInspectorWdlOperands(evidence: DeclaredEvidence<unknown>) {
  const source = packet(evidence, "wdl"), values = source.event.data.payload.values;
  return recordedWdlOperands({ reportSeq: source.event.seq, win: reported(values, "win", perMille), draw: reported(values, "draw", perMille), loss: reported(values, "loss", perMille) }, "historical WDL");
}
export function recordedInspectorPvOperands(evidence: DeclaredEvidence<unknown>) {
  const source = packet(evidence, "pv"), values = source.event.data.payload.values;
  let line: ReportedInspectorField<readonly string[]> = Object.freeze({ kind: "not_recorded" });
  if (Object.hasOwn(values, "movesUci")) {
    try {
      const input = values.movesUci;
      if (!Array.isArray(input)) throw new TypeError("Historical line is not an array");
      const position = positionFromFen(source.subject.fen), san: string[] = [];
      for (const token of input) {
        if (typeof token !== "string") throw new TypeError("Historical line contains a non-move");
        const parsed = parseUci(token);
        if (parsed === undefined) throw new TypeError("Historical line has malformed move identity");
        const move = normalizeMove(position, parsed);
        if (!position.isLegal(move)) throw new TypeError("Historical line is not legal from its recorded position");
        san.push(makeSanAndPlay(position, move));
      }
      line = Object.freeze({ kind: "reported", value: Object.freeze(san) });
    } catch { line = Object.freeze({ kind: "uninterpretable" }); }
  }
  return recordedPvOperands({ reportSeq: source.event.seq, line }, "historical line");
}
export function recordedInspectorTablebaseOperands(evidence: DeclaredEvidence<unknown>) {
  const source = packet(evidence, "tablebase"), values = source.event.data.payload.values;
  return recordedTablebaseOperands({ reportSeq: source.event.seq, category: reported(values, "category", category), dtz: reported(values, "dtz", distance),
    preciseDtz: reported(values, "preciseDtz", distance), dtm: reported(values, "dtm", distance), pieceCount: reported(values, "pieceCount", nonnegative) }, "historical tablebase");
}
export function recordedInspectorTablebaseViewOperands(evidence: DeclaredEvidence<unknown>) {
  assertDeclaredEvidence(evidence);
  if (evidence.projection.version !== 1 || !["derived.inspector.tablebase_category", "derived.inspector.tablebase_distance"].includes(evidence.projection.id)) throw new TypeError("Historical tablebase view requires its exact fixed-field source");
  const value = evidence.payload as RecordedInspectorTablebaseDistance | RecordedInspectorTablebaseCategory;
  const result = { reportSeq: value.record.event.seq, category: value.category };
  return evidence.projection.id === "derived.inspector.tablebase_category" ? recordedTablebaseCategoryOperands(result, "historical category")
    : recordedTablebaseDistanceOperands({ ...result, dtz: (value as RecordedInspectorTablebaseDistance).dtz,
      preciseDtz: (value as RecordedInspectorTablebaseDistance).preciseDtz, dtm: (value as RecordedInspectorTablebaseDistance).dtm }, "historical distances");
}
export function recordedFieldText<T>(value: ReportedInspectorField<T>, display: (value: T) => string): string {
  return value.kind === "reported" ? display(value.value) : value.kind === "not_recorded" ? "not recorded" : "recorded value cannot be interpreted";
}
/** Names only, no inferred outcome, optimality or fifty-move-rule judgement. */
export const RECORDED_TABLEBASE_LABELS: Readonly<Record<SyzygyTablebaseCategory, string>> = Object.freeze({
  win: "win", loss: "loss", draw: "draw", "cursed-win": "cursed win", "blessed-loss": "blessed loss",
  "maybe-win": "possible win", "maybe-loss": "possible loss", "syzygy-win": "Syzygy win", "syzygy-loss": "Syzygy loss", unknown: "unknown",
});
