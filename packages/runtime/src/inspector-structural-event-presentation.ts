// D4060: complete original structural observations for explicit Inspector only.
// This is a closed renderer operand parser, never a collector or move judgement.
import { STRUCTURAL_EVENT_FAMILIES } from "./evidence-catalog.js";
import type { StructuralObservation } from "./structure.js";
import { PresentationSchemaError, s, side } from "./presentation-schema.js";

type Family = (typeof STRUCTURAL_EVENT_FAMILIES)[number];
const file = s.lit("a", "b", "c", "d", "e", "f", "g", "h");
const empty = s.arr(s.square, { max: 0 });
const one = s.arr(s.square, { min: 1, max: 1 });
const two = s.arr(s.square, { min: 2, max: 2 });
const observationSchemas = {
  backward_pawn: s.obj({ kind: s.lit("backward_pawn"), color: s.color, file, squares: empty }),
  doubled_pawn: s.obj({ kind: s.lit("doubled_pawn"), color: s.color, file, squares: empty }),
  half_open_file: s.obj({ kind: s.lit("half_open_file"), color: s.color, file, squares: empty }),
  isolated_pawn: s.obj({ kind: s.lit("isolated_pawn"), color: s.color, file, squares: empty }),
  king_opposition: s.obj({ kind: s.lit("king_opposition"), color: s.color, form: s.lit("direct", "distant"), squares: two }),
  king_zone: s.obj({ kind: s.lit("king_zone"), color: s.color, zone: s.lit("edge", "corner"), squares: one }),
  line_blockers: s.obj({ kind: s.lit("line_blockers"), count: s.nat, squares: two }),
  open_file: s.obj({ kind: s.lit("open_file"), file, squares: empty }),
  passed_pawn: s.obj({ kind: s.lit("passed_pawn"), color: s.color, squares: one }),
  piece_count: s.obj({ kind: s.lit("piece_count"), color: s.color, role: s.role, count: s.nat, squares: empty }),
  direct_attack_count: s.obj({ kind: s.lit("direct_attack_count"), color: s.color, count: s.nat, squares: one }),
} satisfies Record<Family, (value: unknown, label: string) => StructuralObservation>;

function invalid(message: string): never { throw new PresentationSchemaError(message); }
function observation(value: unknown, label: string): StructuralObservation {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return invalid(`${label} requires a structural observation`);
  const kind = s.lit(...STRUCTURAL_EVENT_FAMILIES)((value as Record<string, unknown>).kind, `${label}.kind`);
  const parsed = observationSchemas[kind](value, label);
  if (kind === "direct_attack_count" && (parsed as StructuralObservation).count === 0) return invalid(`${label} cannot invent a zero attack observation`);
  if (kind === "king_opposition" || kind === "line_blockers") {
    if (parsed.squares[0] === parsed.squares[1]) return invalid(`${label} requires distinct squares`);
  }
  return parsed;
}
const operands = s.obj({ san: s.san, family: s.lit(...STRUCTURAL_EVENT_FAMILIES), before: s.nullable(observation), after: s.nullable(observation) });
export type InspectorStructuralBeforeAfterOperands = ReturnType<typeof operands>;

export function parseInspectorStructuralBeforeAfterOperands(value: unknown, label = "Structural before/after"): InspectorStructuralBeforeAfterOperands {
  const parsed = operands(value, label);
  const { family, before, after } = parsed;
  if (before === null && after === null) return invalid(`${label} requires at least one original observation`);
  for (const state of [before, after]) if (state !== null && state.kind !== family) return invalid(`${label} crosses its family`);
  if (before !== null && after !== null) {
    // Match structuralSubject's original join, including its king-zone relocation exception.
    for (const key of ["kind", "color", "role", "file", "form", "zone"] as const) {
      if (before[key] !== after[key]) return invalid(`${label} crosses its original subject`);
    }
    if (family !== "king_zone" && (before.squares.length !== after.squares.length || before.squares.some((square, index) => square !== after.squares[index]))) return invalid(`${label} crosses its ordered subject squares`);
  }
  return parsed;
}

const fileNames = { backward_pawn: "backward-pawn condition", doubled_pawn: "doubled pawns", half_open_file: "half-open file", isolated_pawn: "isolated pawn" } as const;
const roles = { pawn: "pawns", knight: "knights", bishop: "bishops", rook: "rooks", queen: "queens", king: "kings" } as const;
function text(value: StructuralObservation | null): string {
  if (value === null) return "not observed for this subject";
  switch (value.kind) {
    case "backward_pawn": case "doubled_pawn": case "half_open_file": case "isolated_pawn":
      return `${side(value.color!)} ${fileNames[value.kind]} on the ${value.file}-file`;
    case "open_file": return `open ${value.file}-file`;
    case "passed_pawn": return `${side(value.color!)} passed pawn on ${value.squares[0]}`;
    case "king_zone": return `${side(value.color!)} king on ${value.squares[0]} in the ${value.zone} zone`;
    case "king_opposition": return `${side(value.color!)} ${value.form} opposition with king squares ${value.squares.join(", ")}`;
    case "piece_count": return `${side(value.color!)} ${roles[value.role!]}: ${value.count}`;
    case "direct_attack_count": return `${side(value.color!)} geometric attacks on ${value.squares[0]}: ${value.count}`;
    case "line_blockers": return `ray ${value.squares[0]} to ${value.squares[1]}: ${value.count} intervening pieces`;
    default: return invalid("Unsupported structural observation renderer");
  }
}
export function renderInspectorStructuralBeforeAfter(value: InspectorStructuralBeforeAfterOperands): string {
  return `After ${value.san}. Before: ${text(value.before)}; after: ${text(value.after)}.`;
}
