import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";

import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "../evidence-contract.js";
import { canonicalFen, positionFromFen } from "../position-cache.js";
import { MATERIAL_ROLE_SIGNATURE_CONVENTION, type MaterialRoleSignatureReading, type MaterialRoleAsymmetryEvent, type MaterialRoleVector } from "../material-state.js";
import type { EvidenceEdge } from "../evidence-factories.js";
import type { StructuralObservation } from "../structure.js";
import type { TransitionSemanticEventOperands } from "../semantic-evidence.js";
import type { TransitionSemanticFact } from "../transition.js";

const roles = ["pawn", "knight", "bishop", "rook", "queen"] as const;
const colors = ["white", "black"] as const;
export const MATERIAL_COUNT_SLOTS = Object.freeze(colors.flatMap(color => roles.map(role => Object.freeze({ color, role }))));

function assertSource(value: DeclaredEvidence<unknown>, route: string, factory: string, authority: unknown): void {
  assertDeclaredEvidence(value);
  const receipt = evidenceValueReceipt(value);
  if (`${value.projection.id}@${value.projection.version}` !== route || receipt.factory !== factory || receipt.inputDigest !== evidenceDigest(authority)) {
    throw new TypeError(`Material input must be ${route} from its exact source authority`);
  }
}

/** Pure reconstruction: no board-derived substitute counts and no ability to mint evidence. */
export function materialSignatureValue(fen: string, inputs: readonly DeclaredEvidence<StructuralObservation>[]): MaterialRoleSignatureReading {
  if (canonicalFen(positionFromFen(fen)) !== fen) throw new TypeError("Material signature requires canonical FEN authority");
  if (inputs.length !== 10) throw new TypeError("Material signature requires all ten non-king count occurrences");
  inputs.forEach((value, index) => {
    assertSource(value, "rules.structural.reading.piece_count@1", "createRulesStructuralReadingPieceCountV1Evidence", { fen });
    const payload = value.payload, slot = MATERIAL_COUNT_SLOTS[index]!;
    if (payload.kind !== "piece_count" || payload.color !== slot.color || payload.role !== slot.role || !Number.isSafeInteger(payload.count) || payload.count! < 0) {
      throw new TypeError("Material count has the wrong role, color, order or count");
    }
  });
  const readings = colors.map(color => {
    const sources = inputs.filter(value => value.payload.color === color).map(value => value.payload)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const counts = Object.fromEntries(roles.map(role => [role, sources.find(source => source.role === role)!.count!])) as MaterialRoleVector;
    return { color, counts, sources };
  });
  const asymmetry = Object.fromEntries(roles.map(role => [role, Math.abs(readings[0]!.counts[role] - readings[1]!.counts[role])])) as MaterialRoleVector;
  return { fen, conventionId: MATERIAL_ROLE_SIGNATURE_CONVENTION, colors: readings, asymmetry, magnitude: roles.reduce((sum, role) => sum + asymmetry[role], 0) };
}

/** Complete expected cause kinds from one legal move, not another transition/detector fan-out. */
export function materialCauseFamilies(edge: EvidenceEdge): readonly ("capture" | "promotion")[] {
  const position = positionFromFen(edge.beforeFen), parsed = parseUci(edge.moveUci);
  if (parsed === undefined || !("from" in parsed)) throw new TypeError("Material cause requires a legal move");
  const move = normalizeMove(position, parsed);
  if (!("from" in move) || !position.isLegal(move)) throw new TypeError("Material cause requires a legal move");
  const mover = position.board.get(move.from)!, landing = position.board.get(move.to);
  const capture = (landing !== undefined && landing.color !== mover.color) || (mover.role === "pawn" && move.to === position.epSquare);
  position.play(move);
  if (canonicalFen(position) !== edge.afterFen) throw new TypeError("Material cause belongs to another after position");
  return [...(capture ? ["capture" as const] : []), ...(move.promotion !== undefined ? ["promotion" as const] : [])];
}

/** Validate complete populations even on quiet edges, before any successful-empty shortcut. */
export function assertMaterialCauses(edge: EvidenceEdge, causes: readonly DeclaredEvidence<TransitionSemanticEventOperands>[]): void {
  const expected = materialCauseFamilies(edge);
  if (expected.length !== causes.length) throw new TypeError("Material causes must include the complete capture/promotion populations");
  causes.forEach((value, index) => {
    const family = expected[index]!;
    assertSource(value, `rules.transition.event.${family}@1`, family === "capture" ? "createRulesTransitionEventCaptureV1Evidence" : "createRulesTransitionEventPromotionV1Evidence", edge);
    const payload = value.payload;
    if (payload.family !== family || payload.before_fen !== edge.beforeFen || payload.move_uci !== edge.moveUci || payload.after_fen !== edge.afterFen) {
      throw new TypeError("Material cause belongs to another edge or family");
    }
  });
}

/** Join only admitted signatures and closed capture/promotion fields; no FEN event recomputation. */
export function materialAsymmetryValue(edge: EvidenceEdge, before: DeclaredEvidence<MaterialRoleSignatureReading>, after: DeclaredEvidence<MaterialRoleSignatureReading>, causes: readonly DeclaredEvidence<TransitionSemanticEventOperands>[]): MaterialRoleAsymmetryEvent {
  assertMaterialCauses(edge, causes);
  for (const [source, fen] of [[before, edge.beforeFen], [after, edge.afterFen]] as const) {
    assertSource(source, "derived.material.reading.role_signature@2", "createDerivedMaterialReadingRoleSignatureV2Evidence", { fen });
    if (source.payload.fen !== fen) throw new TypeError("Material signature belongs to another position");
  }
  if (causes.length === 0) throw new TypeError("Quiet edges have an empty population, not a no-change material event");
  const sourceEvents: TransitionSemanticFact[] = causes.map(({ payload }) => {
    if (payload.family === "capture") return { family: "capture", sign: payload.sign, mover: payload.mover, from: payload.from, to: payload.to, captured: payload.captured, enPassant: payload.enPassant };
    if (payload.family === "promotion") return { family: "promotion", sign: payload.sign, mover: payload.mover, from: payload.from, to: payload.to, detail: payload.detail };
    throw new TypeError("Unexpected material cause family");
  });
  return { ...edge, conventionId: MATERIAL_ROLE_SIGNATURE_CONVENTION,
    before: { vector: before.payload.asymmetry, magnitude: before.payload.magnitude },
    after: { vector: after.payload.asymmetry, magnitude: after.payload.magnitude },
    changedRoles: roles.filter(role => before.payload.asymmetry[role] !== after.payload.asymmetry[role]),
    increased: after.payload.magnitude > before.payload.magnitude, sourceEvents };
}
