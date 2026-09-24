// Test-only fixtures for rfc/review-evidence-compiler.md: scheduler-equivalent sealed Stockfish
// position-evaluation deliveries (through the provider exchange authority, never a hand-built
// payload), durable attachment through the production payload builder, and small legal games.

import { attachEvidence } from "../evidence.js";
import { exactLegalMoves } from "../legal-moves.js";
import { PROVIDER_EXCHANGE_AUTHORITY } from "../provider-exchange.js";
import { normalizeProviderRequest } from "../provider-requests.js";
import { FIXTURE_AT, evaluationCapture, evaluationRequest, principalVariationCapture, principalVariationRequest } from "../provider-test-fixtures.js";
import type { StockfishPositionEvaluationRequest } from "../provider-types.js";
import { reviewDeliveryEvidencePayload, type ReviewImportRecordImage } from "../review-evidence.js";
import type { StockfishPositionEvaluation, StockfishPrincipalVariation } from "../review-points.js";
import { commitMove, createRun } from "../runtime.js";
import type { DrillRun } from "../types.js";

export const REVIEW_AT = "2026-09-24T12:00:00.000Z";
export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const DIGEST = `sha256:${"d".repeat(64)}`;
const CONFIG = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };

export interface DeliveryOptions {
  readonly bound?: StockfishPositionEvaluationRequest["bound"];
  readonly version?: string;
  readonly generation?: number;
  /** Raw side-to-move WDL per-mille; must sum to 1000. */
  readonly wdl?: readonly [number, number, number];
}

/**
 * One sealed `stockfish.position_evaluation@1` delivery. `score` is the raw UCI side-to-move score
 * (`cp 35` or `mate 3`), exactly as an engine reports it; the parser normalizes it to White.
 */
export function evaluationDelivery(fen: string, score: string, options: DeliveryOptions = {}): StockfishPositionEvaluation {
  const request = { ...evaluationRequest(fen, options.bound ?? { kind: "depth", requestedDepth: 12 }), requestedEngine: { id: "stockfish-analysis", version: options.version ?? "19" } };
  const requested = normalizeProviderRequest("stockfish.position_evaluation@1", request);
  const [win, draw, loss] = options.wdl ?? [400, 400, 200];
  const move = exactLegalMoves(fen)[0]!.uci;
  const depth = requested.request.bound.kind === "depth" ? requested.request.bound.requestedDepth : 12;
  const capture = evaluationCapture(requested, [`info depth ${depth} seldepth ${depth + 2} score ${score} wdl ${win} ${draw} ${loss} nodes 100 pv ${move}`, `bestmove ${move}`], options.generation ?? 1);
  const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt({ operation: "stockfish.position_evaluation@1", requestedIdentity: requested, capture, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
  const { payload, payloadReceipt } = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
  return PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition, payload, payloadReceipt, servedAt: FIXTURE_AT }) as StockfishPositionEvaluation;
}

/** One sealed `stockfish.principal_variation@1` delivery whose engine reported `pv` (UCI) at the bound. */
export function lineDelivery(fen: string, pv: readonly string[], options: { readonly bound?: StockfishPositionEvaluationRequest["bound"]; readonly maxPlies?: number } = {}): StockfishPrincipalVariation {
  const requested = normalizeProviderRequest("stockfish.principal_variation@1", principalVariationRequest(fen, options.bound ?? { kind: "movetime", requestedMs: 100 }, options.maxPlies ?? 8));
  const capture = principalVariationCapture(requested, [`info depth 14 seldepth 16 score cp 20 nodes 100 pv ${pv.join(" ")}`, `bestmove ${pv[0]}`]);
  const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt({ operation: "stockfish.principal_variation@1", requestedIdentity: requested, capture, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
  const { payload, payloadReceipt } = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
  return PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition, payload, payloadReceipt, servedAt: FIXTURE_AT }) as StockfishPrincipalVariation;
}

/** Attaches a delivery (and optionally its line) exactly as the Review coordinator does. */
export function attachDelivery(run: DrillRun, nodeId: string, delivery: StockfishPositionEvaluation, line?: StockfishPrincipalVariation): DrillRun {
  return attachEvidence(run, nodeId, [`engine:review-${nodeId}`], reviewDeliveryEvidencePayload(delivery, line), REVIEW_AT).run;
}

export function importedRun(id: string, side: "white" | "black" = "white", fen = START_FEN): DrillRun {
  return createRun({ id, session: { kind: "imported", start: { fen, side }, movetextDigest: DIGEST, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: DIGEST, policyConfig: CONFIG, seed: 1, createdAt: REVIEW_AT });
}

export function importRecord(run: DrillRun, result: ReviewImportRecordImage["result"]): ReviewImportRecordImage {
  return Object.freeze({ runId: run.id, result, movetextDigest: DIGEST });
}

/** Plays a legal UCI line from the run's start; the learner side alternates with the start side. */
export function play(run: DrillRun, moves: readonly string[]): DrillRun {
  let next = run;
  for (const [index, move] of moves.entries()) next = commitMove(next, move, { actor: index % 2 === 0 ? "user" : "system", at: REVIEW_AT }).run;
  return next;
}

/** The ordered main-branch nodes of a linear fixture run. */
export function mainPath(run: DrillRun): readonly DrillRun["nodes"][number][] {
  return [...run.nodes].filter((node) => node.branchId === run.activeCursor.branchId || node.parentId === null).sort((left, right) => left.ply - right.ply);
}
