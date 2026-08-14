import type { Color } from "chessops/types";

import { positionFromFen } from "./chess.js";
import { classifyPhase } from "./phase.js";

export type EndgameTypeId = "pawn" | "rook-and-pawn-vs-rook" | "rook" | "queen" | "minor";
export interface TechniqueRef { readonly id: "lucena" | "philidor" | "vancura"; readonly name: string; readonly forSide: "attacker" | "defender"; readonly provenance: { readonly note: string }; readonly shapeEntryId: string; }
export interface EndgameReading { readonly type: { readonly id: EndgameTypeId; readonly label: string } | null; readonly techniques: readonly TechniqueRef[]; readonly provenanceNote: string; }

const PROVENANCE = "Tabiya's material-census convention";
const BASE = Object.freeze([
  Object.freeze({ id: "lucena" as const, name: "Lucena", forSide: "attacker" as const, provenance: Object.freeze({ note: `Standard endgame-literature name; ${PROVENANCE}.` }), shapeEntryId: "lucena" }),
  Object.freeze({ id: "philidor" as const, name: "Philidor", forSide: "defender" as const, provenance: Object.freeze({ note: `Standard endgame-literature name; ${PROVENANCE}.` }), shapeEntryId: "philidor" }),
]);

function material(position: ReturnType<typeof positionFromFen>, color: Color): readonly string[] {
  return [...position.board].filter(([, piece]) => piece.color === color && piece.role !== "king" && piece.role !== "pawn").map(([, piece]) => piece.role).sort();
}
function pawnCount(position: ReturnType<typeof positionFromFen>, color: Color): number { return position.board.pieces(color, "pawn").size(); }

export function endgameReading(fen: string): EndgameReading | null {
  if (classifyPhase(fen).phase !== "endgame") return null;
  const position = positionFromFen(fen);
  const white = material(position, "white"), black = material(position, "black");
  let id: EndgameTypeId | null = null;
  let label = "";
  const bare = white.length === 0 && black.length === 0;
  if (bare) { id = "pawn"; label = "Pawn ending"; }
  const krpkr = (white.join() === "rook" && black.join() === "rook") && ((pawnCount(position, "white") === 1 && pawnCount(position, "black") === 0) || (pawnCount(position, "black") === 1 && pawnCount(position, "white") === 0));
  if (krpkr) { id = "rook-and-pawn-vs-rook"; label = "Rook and pawn versus rook"; }
  else if (white.join() === "rook" && black.join() === "rook") { id = "rook"; label = "Rook ending"; }
  else if (white.join() === "queen" && black.join() === "queen") { id = "queen"; label = "Queen ending"; }
  else if (white.length === 1 && black.length === 1 && ["bishop", "knight"].includes(white[0]!) && ["bishop", "knight"].includes(black[0]!)) { id = "minor"; label = "Minor-piece ending"; }
  const techniques: TechniqueRef[] = [];
  if (id === "rook-and-pawn-vs-rook") {
    techniques.push(...BASE);
    const pawnSquare = [...position.board].find(([, piece]) => piece.role === "pawn")?.[0];
    if (pawnSquare !== undefined && (pawnSquare % 8 === 0 || pawnSquare % 8 === 7)) techniques.push(Object.freeze({ id: "vancura", name: "Vancura", forSide: "defender", provenance: Object.freeze({ note: `Standard endgame-literature name; ${PROVENANCE}.` }), shapeEntryId: "vancura" }));
  }
  return Object.freeze({ type: id === null ? null : Object.freeze({ id, label }), techniques: Object.freeze(techniques), provenanceNote: PROVENANCE });
}

export function renderEndgameReading(reading: EndgameReading | null): readonly string[] {
  if (reading === null) return Object.freeze([]);
  if (reading.type === null) return Object.freeze([`Endgame; the material is outside ${PROVENANCE}.`]);
  if (reading.techniques.length === 0) return Object.freeze([`${reading.type.label} under ${PROVENANCE}.`, "Technique entries: none in Tabiya's index."]);
  return Object.freeze([`${reading.type.label} under ${PROVENANCE}.`, ...reading.techniques.map((item) => `Named technique: ${item.name} (${item.provenance.note}) No technique entry is available yet.`)]);
}
