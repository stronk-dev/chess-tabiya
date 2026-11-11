// Accepted subject-safe-semantic-selection §1: finite, invocation-local source sharing.
// This is computation reuse, not an evidence issuer, cache, registry or caller callback API.
import { assertDeclaredEvidence, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import type { ExactLegalMoveMap } from "./legal-moves.js";
import type { PawnConnectivityReading } from "./structure.js";
import type { BackwardPawnSnapshot, UnobstructedOppositionSnapshot } from "./foundation-position-sources.js";
import type { FileStateSnapshot, PawnFileGroupSnapshot } from "./foundation-pawn-sources.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { evidenceFactorySymbol, invokeEvidenceValueRoute, readFoundationPositionTuple, readLocalReadingInvocation } from "./internal/evidence-value-routes.js";

export type FoundationPositionTuple = readonly [
  DeclaredEvidence<ExactLegalMoveMap>, DeclaredEvidence<PawnConnectivityReading>,
  DeclaredEvidence<UnobstructedOppositionSnapshot>, DeclaredEvidence<BackwardPawnSnapshot>,
  DeclaredEvidence<PawnFileGroupSnapshot>, DeclaredEvidence<FileStateSnapshot>,
];

function once<T>(build: () => T) {
  let ready = false, value: T, failed: Readonly<{ error: unknown }> | undefined;
  return Object.freeze(Object.assign((): T => {
    if (failed !== undefined) throw failed.error;
    if (!ready) {
      try { value = build(); ready = true; }
      catch (error) { failed = Object.freeze({ error }); throw error; }
    }
    return value;
  }, { failure: () => failed }));
}

function available<T>(result: { readonly kind: "available"; readonly value: T } | { readonly kind: "unavailable"; readonly reason: string }): T {
  if (result.kind !== "available") throw new TypeError(`Foundation position source unavailable: ${result.reason}`);
  return result.value;
}

/** A position's six fixed source cells. The only supplied source may be its original legal map.
 * Keep acquisition lazy: a pawn-file request needs connectivity, not opposition or legal moves.
 * Independent invocations never share newly minted evidence, even at an identical FEN. */
export function foundationPositionCells(fen: string, originalLegal?: DeclaredEvidence<ExactLegalMoveMap>) {
  const canonical = canonicalFen(positionFromFen(fen));
  if (originalLegal !== undefined) {
    assertDeclaredEvidence(originalLegal);
    const original = readLocalReadingInvocation(originalLegal);
    const route = "rules.mobility.reading.legal_moves@1";
    if (originalLegal.projection.id !== "rules.mobility.reading.legal_moves" || originalLegal.projection.version !== 1
      || evidenceValueReceipt(originalLegal).factory !== evidenceFactorySymbol(route)
      || original.kind !== "fen" || canonicalFen(positionFromFen(original.fen)) !== canonical || originalLegal.payload.fen !== canonical) {
      throw new TypeError("Foundation position cells require their original exact legal-position source");
    }
  }
  const legal = once(() => originalLegal ?? invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: canonical }));
  const connectivity = once(() => invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen: canonical }));
  const opposition = once(() => available(invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: legal() })));
  const backward = once(() => available(invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position: legal() })));
  const groups = once(() => available(invokeEvidenceValueRoute("derived.structural.reading.pawn_file_group@1", { source: connectivity() })));
  const files = once(() => available(invokeEvidenceValueRoute("derived.activity.reading.file_state@1", { source: connectivity() })));
  const control = once(() => invokeEvidenceValueRoute("rules.square.reading.control@1", { fen: canonical }));
  const values = once((): FoundationPositionTuple => readFoundationPositionTuple(
    Object.freeze([legal(), connectivity(), opposition(), backward(), groups(), files()] as const)));
  return Object.freeze({ fen: canonical, legal, connectivity, opposition, backward, groups, files, control, values,
    commonFailure: () => legal.failure() ?? connectivity.failure() ?? opposition.failure() ?? backward.failure() ?? groups.failure() ?? files.failure() ?? values.failure(),
    controlFailure: control.failure,
  });
}
