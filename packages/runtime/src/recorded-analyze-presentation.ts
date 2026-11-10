// Accepted Review §7a.2: closed prose operands only. Parsing/rendering is not source issuance,
// source selection, assistance permission or a substitute for the registered source factory.
import { PresentationSchemaError, s, type Parser } from "./presentation-schema.js";
import { reviewText } from "./review-map-templates.js";
import type { AnalyzeLineOperands, AnalyzeMoveOperand } from "./recorded-analyze-line.js";

const positive: Parser<number> = (value, label) => {
  const number = s.nat(value, label);
  if (number < 1) throw new PresentationSchemaError(`${label} must be positive`);
  return number;
};
const move = s.obj({ fullmove: positive, side: s.color, san: s.san });
const sourceArm = s.lit("typed_pv", "recorded_bestline", "recorded_search_first");
const bound = s.union("kind", {
  movetime: s.obj({ kind: s.lit("movetime"), requestedMs: positive }),
  depth: s.obj({ kind: s.lit("depth"), requestedDepth: positive }),
  nodes: s.obj({ kind: s.lit("nodes"), requestedNodes: positive }),
});
const lineScope = s.union("kind", {
  typed_request: s.obj({ kind: s.lit("typed_request"), maxPlies: positive, truncated: s.bool }),
  recorded_report: s.obj({ kind: s.lit("recorded_report") }),
});
const operands = s.union("kind", {
  line: s.obj({ kind: s.lit("line"), sourceArm, reviewedMove: move,
    engine: s.obj({ id: s.str, name: s.nullable(s.str), version: s.nullable(s.str) }),
    bound, lineScope, line: s.arr(move, { min: 1 }) }),
  unattributed: s.obj({ kind: s.lit("unattributed"), sourceArm, reviewedMove: move,
    reason: s.lit("engine_unusable", "bound_unusable", "engine_and_bound_unusable") }),
});
/** Do not let the operand schema read a getter, inherited value or hidden private field. */
function assertData(value: unknown, label: string, ancestors = new WeakSet<object>()): void {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value !== "object" || ancestors.has(value)) throw new PresentationSchemaError(`${label} must be acyclic JSON data`);
  const array = Array.isArray(value), prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) throw new PresentationSchemaError(`${label} must be plain data`);
  const keys = Reflect.ownKeys(value);
  if (array && (keys.length !== value.length + 1 || !Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean))) throw new PresentationSchemaError(`${label} must be a dense plain array`);
  ancestors.add(value);
  try {
    for (const key of keys) {
      if (array && key === "length") continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      if (typeof key !== "string" || !descriptor.enumerable || !("value" in descriptor)) throw new PresentationSchemaError(`${label} must contain only declared data fields`);
      assertData(descriptor.value, `${label}.${key}`, ancestors);
    }
  } finally { ancestors.delete(value); }
}

export const parseRecordedAnalyzeLineOperands: Parser<AnalyzeLineOperands> = (input, label) => {
  assertData(input, label);
  const value = operands(input, label);
  if (value.kind === "line") {
    if (value.sourceArm === "typed_pv") {
      if (value.engine.name === null || value.engine.version === null || value.lineScope.kind !== "typed_request"
        || value.line.length > value.lineScope.maxPlies) throw new PresentationSchemaError(`${label} crosses its typed engine or original recorded ply scope`);
    } else if (value.engine.name !== null || value.engine.version !== null || value.lineScope.kind !== "recorded_report"
      || value.sourceArm === "recorded_search_first" && value.line.length !== 1) throw new PresentationSchemaError(`${label} invents historical attribution, scope or continuation`);
    let fullmove = value.reviewedMove.fullmove, side = value.reviewedMove.side;
    for (const item of value.line) {
      if (item.fullmove !== fullmove || item.side !== side) throw new PresentationSchemaError(`${label} has crossed recorded move numbering`);
      if (side === "black") fullmove++;
      side = side === "white" ? "black" : "white";
    }
  }
  return value;
};
const numbered = (move: AnalyzeMoveOperand) => `${move.fullmove}${move.side === "white" ? "." : "…"} ${move.san}`;
export function renderRecordedAnalyzeLine(value: AnalyzeLineOperands): string {
  const reviewed = numbered(value.reviewedMove);
  if (value.kind === "unattributed") return reviewText(`analysis.unattributed.${value.reason}`, { move: reviewed });
  const boundText = value.bound.kind === "movetime" ? reviewText("analysis.bound.movetime", { ms: value.bound.requestedMs })
    : value.bound.kind === "depth" ? reviewText("analysis.bound.depth", { depth: value.bound.requestedDepth }) : reviewText("analysis.bound.nodes", { nodes: value.bound.requestedNodes });
  const line = value.line.map((move, index) => move.side === "white" || index === 0 ? numbered(move) : move.san).join(" ");
  if (value.sourceArm === "typed_pv") {
    if (value.lineScope.kind !== "typed_request") throw new PresentationSchemaError("Analyze typed renderer lost its recorded scope");
    return `${reviewText("analysis.line", { engine: `${value.engine.name} ${value.engine.version}`, bound: boundText, move: reviewed, line })} ${reviewText(value.lineScope.truncated ? "analysis.scope.truncated" : "analysis.scope.recorded", { plies: value.lineScope.maxPlies })} ${reviewText("analysis.caveat")}`;
  }
  return `${reviewText(value.sourceArm === "recorded_bestline" ? "analysis.saved.line" : "analysis.saved.first", { engine: value.engine.id, bound: boundText, move: reviewed, line })} ${reviewText("analysis.saved.caveat")}`;
}
