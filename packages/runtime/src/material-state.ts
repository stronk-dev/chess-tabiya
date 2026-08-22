import { normalizeMove } from "chessops/chess";
import type { Color, Role } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { structuralReading, type StructuralObservation } from "./structure.js";
import { transitionSemanticFacts, type TransitionSemanticFact } from "./transition.js";

export const MATERIAL_ROLE_SIGNATURE_CONVENTION = "material-role-signature@1" as const;
const COLORS = Object.freeze(["white", "black"] as const);
const MATERIAL_ROLES = Object.freeze(["pawn", "knight", "bishop", "rook", "queen"] as const);
export type MaterialRole = (typeof MATERIAL_ROLES)[number];
export type MaterialRoleVector = Readonly<Record<MaterialRole, number>>;

export interface MaterialRoleSignatureReading {
  readonly fen: string;
  readonly conventionId: typeof MATERIAL_ROLE_SIGNATURE_CONVENTION;
  readonly colors: readonly {
    readonly color: Color;
    readonly counts: MaterialRoleVector;
    readonly sources: readonly StructuralObservation[];
  }[];
  readonly asymmetry: MaterialRoleVector;
  readonly magnitude: number;
}

export interface MaterialRoleAsymmetryEvent {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly conventionId: typeof MATERIAL_ROLE_SIGNATURE_CONVENTION;
  readonly before: { readonly vector: MaterialRoleVector; readonly magnitude: number };
  readonly after: { readonly vector: MaterialRoleVector; readonly magnitude: number };
  readonly changedRoles: readonly MaterialRole[];
  readonly increased: boolean;
  readonly sourceEvents: readonly TransitionSemanticFact[];
}

function vector(entries: readonly StructuralObservation[], color: Color): MaterialRoleVector {
  const counts = Object.fromEntries(MATERIAL_ROLES.map((role) => {
    const source = entries.find((entry) => entry.kind === "piece_count" && entry.color === color && entry.role === role);
    if (source?.count === undefined) throw new TypeError(`piece_count authority omitted ${color} ${role}`);
    return [role, source.count];
  })) as Record<MaterialRole, number>;
  return Object.freeze(counts);
}

function difference(white: MaterialRoleVector, black: MaterialRoleVector): MaterialRoleVector {
  return Object.freeze(Object.fromEntries(MATERIAL_ROLES.map((role) => [role, Math.abs(white[role] - black[role])])) as Record<MaterialRole, number>);
}

function magnitude(value: MaterialRoleVector): number {
  return MATERIAL_ROLES.reduce((sum, role) => sum + value[role], 0);
}

/** Exact P/N/B/R/Q count vectors projected from structuralReading's piece_count authority. */
export function materialRoleSignatureReading(fen: string): MaterialRoleSignatureReading {
  const reading = structuralReading(fen);
  const colors = COLORS.map((color) => {
    const sources = reading.features.filter((entry) => entry.kind === "piece_count" && entry.color === color && MATERIAL_ROLES.includes(entry.role as MaterialRole));
    return Object.freeze({ color, counts: vector(sources, color), sources: Object.freeze(sources) });
  });
  const asymmetry = difference(colors[0]!.counts, colors[1]!.counts);
  return Object.freeze({ fen: reading.fen, conventionId: MATERIAL_ROLE_SIGNATURE_CONVENTION, colors: Object.freeze(colors), asymmetry, magnitude: magnitude(asymmetry) });
}

/** Role-count change with exact capture/promotion source facts; no scalar material verdict. */
export function materialRoleAsymmetryEvent(beforeFen: string, moveUci: string, afterFen: string): MaterialRoleAsymmetryEvent | undefined {
  const position = positionFromFen(beforeFen);
  const parsed = parseUci(moveUci.toLowerCase());
  if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid move UCI ${moveUci}`);
  const move = normalizeMove(position, parsed);
  if (!("from" in move) || !position.isLegal(move)) throw new TypeError(`Illegal move UCI ${moveUci}`);
  const canonicalBefore = canonicalFen(position);
  position.play(move);
  const canonicalAfter = canonicalFen(position);
  if (canonicalAfter !== canonicalFen(positionFromFen(afterFen))) throw new TypeError(`After FEN does not match ${moveUci}`);
  const canonicalMove = makeUci(move);
  const before = materialRoleSignatureReading(canonicalBefore);
  const after = materialRoleSignatureReading(canonicalAfter);
  const changedRoles = MATERIAL_ROLES.filter((role) => before.asymmetry[role] !== after.asymmetry[role]);
  if (changedRoles.length === 0) return undefined;
  const sourceEvents = transitionSemanticFacts(canonicalBefore, canonicalMove, canonicalAfter).filter((fact) => fact.family === "capture" || fact.family === "promotion");
  if (sourceEvents.length === 0) throw new TypeError("Material-role asymmetry changed without a capture or promotion authority");
  return Object.freeze({
    beforeFen: canonicalBefore,
    moveUci: canonicalMove,
    afterFen: canonicalAfter,
    conventionId: MATERIAL_ROLE_SIGNATURE_CONVENTION,
    before: Object.freeze({ vector: before.asymmetry, magnitude: before.magnitude }),
    after: Object.freeze({ vector: after.asymmetry, magnitude: after.magnitude }),
    changedRoles: Object.freeze(changedRoles),
    increased: after.magnitude > before.magnitude,
    sourceEvents: Object.freeze(sourceEvents),
  });
}

export function isMaterialRole(role: Role): role is MaterialRole {
  return MATERIAL_ROLES.includes(role as MaterialRole);
}
