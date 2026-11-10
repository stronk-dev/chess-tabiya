// Accepted shared-candidate-evidence-packet §3.1c. Demand-only original selected source joins.
import { castlingSide, normalizeMove } from "chessops/chess";
import { kingCastlesTo, makeSquare, parseUci } from "chessops/util";
import type { DeclaredEvidence } from "./evidence-contract.js";
import type { FoundationEdge } from "./foundation-position-sources.js";
import { positionFromFen } from "./position-cache.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

export type FoundationSnapshotSourceRef =
  | "rules.structural.reading.king_opposition@3"
  | "rules.structural.reading.backward_pawn@3"
  | "derived.structural.reading.pawn_file_group@1"
  | "derived.activity.reading.file_state@1"
  | "derived.square.reading.future_file_challenge@1"
  | "derived.square.reading.capture_migration_reach@1"
  | "derived.structural.reading.outpost_candidate@1"
  | "derived.structural.reading.occupied_outpost@1";
function available<T>(result: { readonly kind: "available"; readonly value: T } | { readonly kind: "unavailable"; readonly reason: string }): T {
  if (result.kind !== "available") throw new TypeError(`Selected foundation source unavailable: ${result.reason}`);
  return result.value;
}
export function collectFoundationSnapshotSource(projection: FoundationSnapshotSourceRef, fen: string): readonly DeclaredEvidence<unknown>[] {
  if (projection === "derived.structural.reading.pawn_file_group@1" || projection === "derived.activity.reading.file_state@1") {
    const source = invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen });
    return Object.freeze([available<DeclaredEvidence<unknown>>(invokeEvidenceValueRoute(projection, { source }))]);
  }
  const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
  switch (projection) {
    case "rules.structural.reading.king_opposition@3":
    case "rules.structural.reading.backward_pawn@3":
    case "derived.square.reading.future_file_challenge@1":
    case "derived.square.reading.capture_migration_reach@1":
      return Object.freeze([available<DeclaredEvidence<unknown>>(invokeEvidenceValueRoute(projection, { position }))]);
    case "derived.structural.reading.outpost_candidate@1":
    case "derived.structural.reading.occupied_outpost@1": {
      const control = invokeEvidenceValueRoute("rules.square.reading.control@1", { fen });
      const future = available(invokeEvidenceValueRoute("derived.square.reading.future_file_challenge@1", { position }));
      const source = available(invokeEvidenceValueRoute("derived.structural.reading.outpost_candidate@1", { control, future }));
      return Object.freeze([projection === "derived.structural.reading.outpost_candidate@1" ? source
        : available(invokeEvidenceValueRoute("derived.structural.reading.occupied_outpost@1", { source }))]);
    }
    default: throw new TypeError("Unsupported exact selected foundation snapshot");
  }
}

export function collectFoundationAdvanceSource(edge: FoundationEdge): readonly DeclaredEvidence<unknown>[] {
  const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: edge.beforeFen });
  const source = available(invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position }));
  const before = positionFromFen(edge.beforeFen), raw = parseUci(edge.moveUci);
  if (raw === undefined || !("from" in raw)) throw new TypeError("Selected advance requires a board move");
  const move = normalizeMove(before, raw);
  if (!("from" in move) || !before.isLegal(move)) throw new TypeError("Selected advance requires its original legal edge");
  const castle = castlingSide(before, move);
  const landingSquare = makeSquare(castle === undefined ? move.to : kingCastlesTo(before.turn, castle));
  const landing = invokeEvidenceValueRoute("rules.exchange.reading.landing_captures@1", { fen: edge.afterFen, landingSquare });
  return available(invokeEvidenceValueRoute("derived.pawn.consequence.backward_pawn_legal_advance@1", { source, moveUci: edge.moveUci, landing }));
}
