// Test-only fixtures for rfc/hint-distance.md: scheduler-equivalent sealed Stockfish principal
// variations (through the provider exchange authority, never a hand-built payload), the complete
// wide candidate packets the selector needs, and one permanent positive position per hint family.

import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, type CandidatePopulationReceipt } from "../candidate-population.js";
import type { DeclaredEvidence } from "../evidence-contract.js";
import { hintPacketRoots, selectHintHorizon, type HintHorizonSelection } from "../hint-distance.js";
import type { HintFamily } from "../hint-registry.js";
import { invokeEvidenceValueRoute } from "../internal/evidence-value-routes.js";
import { PROVIDER_EXCHANGE_AUTHORITY } from "../provider-exchange.js";
import { normalizeProviderRequest } from "../provider-requests.js";
import { FIXTURE_AT, principalVariationCapture, principalVariationRequest } from "../provider-test-fixtures.js";
import type { StockfishPrincipalVariationRequest } from "../provider-types.js";

/** One sealed `live.stockfish.principal_variation@1` source for `fen` whose line is exactly `moves`. */
export function sealedHintLine(fen: string, moves: readonly string[], bound: StockfishPrincipalVariationRequest["bound"] = { kind: "depth", requestedDepth: 12 }): DeclaredEvidence<unknown> {
  const identity = normalizeProviderRequest("stockfish.principal_variation@1", principalVariationRequest(fen, bound, 4));
  const capture = principalVariationCapture(identity, [`info depth 12 seldepth 12 multipv 1 score cp 20 nodes 1 pv ${moves.join(" ")}`, `bestmove ${moves[0]}`]);
  const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt({ operation: "stockfish.principal_variation@1", requestedIdentity: identity, capture, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
  const { payload, payloadReceipt } = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
  const delivery = PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition, payload, payloadReceipt, servedAt: FIXTURE_AT });
  return invokeEvidenceValueRoute("live.stockfish.principal_variation@1", { delivery } as never) as DeclaredEvidence<unknown>;
}

/** The complete wide packets for every scanned root-side before position of a line. */
export function hintPackets(line: DeclaredEvidence<unknown>): readonly CandidatePopulationReceipt[] {
  return hintPacketRoots(line).map((beforeFen) => {
    const result = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (result.kind !== "ready") throw new TypeError(`fixture packet failed for ${beforeFen}`);
    return result.receipt;
  });
}

export const HINT_ROOT = Object.freeze({ runId: "hint-run", branchId: "main", nodeId: "n0", eventHeadSeq: 0 });

export function selectFixture(fen: string, moves: readonly string[]): HintHorizonSelection {
  const line = sealedHintLine(fen, moves);
  return selectHintHorizon({ root: { ...HINT_ROOT, fen }, line, packets: hintPackets(line) });
}

/** One permanent root-direct positive per family (criterion 4). */
export const HINT_FAMILY_POSITIVES: Readonly<Record<HintFamily, { readonly fen: string; readonly moves: readonly string[] }>> = Object.freeze({
  mate_in_one: { fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", moves: ["f7g7"] },
  forced_mate: { fen: "7k/8/5K2/8/8/8/8/R7 w - - 0 1", moves: ["f6g6"] },
  double_attack: { fen: "4k3/8/8/8/1n6/8/8/R3K3 b - - 0 1", moves: ["b4c2"] },
  fork_survives_reply: { fen: "4k3/8/8/8/1n6/8/8/R3K3 b - - 0 1", moves: ["b4c2"] },
  discovered_executed: { fen: "7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1", moves: ["f3h4"] },
  loose_piece: { fen: "4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1", moves: ["e4c3"] },
  promotion_pressure: { fen: "8/P7/8/8/8/8/8/k6K w - - 0 1", moves: ["h1g2"] },
});

/** The root side's own ply-3 double attack (root_followup_in_line). */
export const HINT_FOLLOWUP = Object.freeze({ fen: "4k3/7p/8/8/1n6/8/7P/R3K3 b - - 0 1", moves: ["h7h6", "h2h3", "b4c2"] });
/** An opponent-line fork on ply 2 (refused from Guided Hint). */
export const HINT_OPPONENT_LINE = Object.freeze({ fen: "4k3/8/8/8/1n6/8/7P/R3K3 w - - 0 1", moves: ["h2h3", "b4c2"] });
/** A hard negative: the mover creates its own loose piece (`loose_piece:gained`). */
export const HINT_SELF_EXPOSURE = Object.freeze({ fen: "4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1", moves: ["c3e4"] });
