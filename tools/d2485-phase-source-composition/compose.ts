import {
  compileLoadedOpeningCatalogue,
  deepestOpeningReached,
  openingIdentityAt,
  recordedOpeningPosition,
  type DeepestOpeningReached,
  type OpeningCatalogueAvailability,
} from "../../apps/server/src/opening-catalogue.js";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { endgameReading } from "../../packages/runtime/src/endgame.js";
import { classifyPhase } from "../../packages/runtime/src/phase.js";
import { phaseDecision } from "../d2484-phase-band-census/bands.js";

export interface RecordedTablebaseFact {
  readonly fen: string;
  readonly pieceCount: number;
  readonly category: string;
  readonly sourceId: string;
}

export function absolutePly(fen: string): number {
  const fields = canonicalFen(positionFromFen(fen)).split(" ");
  const fullmove = Number(fields[5]);
  if (!Number.isSafeInteger(fullmove) || fullmove < 1) throw new TypeError("FEN fullmove must be positive");
  return (fullmove - 1) * 2 + (fields[1] === "b" ? 1 : 0);
}

export function measuredPhaseSourcePoint(
  opening: OpeningCatalogueAvailability,
  nodeId: string,
  fen: string,
  tablebase: RecordedTablebaseFact | undefined,
) {
  const canonical = canonicalFen(positionFromFen(fen));
  const ply = absolutePly(canonical);
  const position = positionFromFen(canonical);
  const pieceCount = [...position.board].length;
  const phase = classifyPhase(canonical);
  const identity = openingIdentityAt(opening, canonical, ply);
  const endgame = endgameReading(canonical);
  const recordedTablebase = pieceCount > 7
    ? Object.freeze({ kind: "outside_domain" as const, pieceCount })
    : tablebase === undefined
      ? Object.freeze({ kind: "in_domain_unrecorded" as const, pieceCount })
      : Object.freeze({ kind: "recorded" as const, pieceCount, category: tablebase.category, sourceId: tablebase.sourceId });
  if (tablebase !== undefined && (pieceCount > 7 || tablebase.pieceCount !== pieceCount || canonicalFen(positionFromFen(tablebase.fen)) !== canonical)) {
    throw new TypeError("recorded tablebase fact does not bind the measured FEN/domain");
  }
  if ((phase.phase === "endgame") !== (endgame !== null)) throw new TypeError("rules phase and endgame classifier applicability diverged");
  if (identity.currentEndpoint.kind === "matched" && identity.catalogueMembership.kind !== "member") {
    throw new TypeError("named opening endpoint is absent from its catalogue path membership");
  }
  return Object.freeze({
    position: Object.freeze({ nodeId, ply, fen: canonical }),
    opening: identity,
    rulesPhase: Object.freeze({ reading: phase, decision: phaseDecision(phase) }),
    rulesEndgame: endgame === null ? Object.freeze({ kind: "not_applicable" as const }) : Object.freeze({ kind: "classified" as const, reading: endgame }),
    recordedTablebase,
  });
}

export function measuredOpeningHistory(opening: OpeningCatalogueAvailability, points: readonly ReturnType<typeof measuredPhaseSourcePoint>[]): DeepestOpeningReached {
  return deepestOpeningReached(opening, points.map((point) => recordedOpeningPosition(point.position.nodeId, point.position.ply, point.position.fen)));
}

export { compileLoadedOpeningCatalogue };
