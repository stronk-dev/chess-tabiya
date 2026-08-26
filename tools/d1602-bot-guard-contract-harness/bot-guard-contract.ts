import { createHash } from "node:crypto";

import { exactLegalMoves, exactMoveIdentity } from "../../packages/runtime/src/legal-moves.js";

export const BOT_TRAIT_CLASSIFIERS = Object.freeze({
  "pawn_move@1": "pawn_move",
} as const);

export type BotTraitClassifierId = keyof typeof BOT_TRAIT_CLASSIFIERS;
export type BotTraitId = (typeof BOT_TRAIT_CLASSIFIERS)[BotTraitClassifierId];

export const STOCKFISH_GUARD_PROFILE = Object.freeze({
  id: "stockfish-guard@1",
  engine: "stockfish",
  engineVersion: "18",
  threads: 1,
  hashMb: 16,
  clearHashBeforeRequest: true,
  multiPv: "candidate_count",
  searchMoves: "exact_candidate_set",
  bound: Object.freeze({ kind: "depth", value: 8 }),
  scorePerspective: "root_side",
  scoreRows: "final_only",
} as const);

export type GuardAbstentionReason =
  | "provider_unavailable"
  | "deadline_exceeded"
  | "candidate_set_mismatch"
  | "duplicate_row"
  | "missing_row"
  | "bounded_row"
  | "mixed_score_domain"
  | "non_cp_score_domain"
  | "root_mismatch"
  | "empty_after_mask";

export type GuardScore =
  | Readonly<{ readonly kind: "cp"; readonly value: number; readonly bound: "exact" }>
  | Readonly<{ readonly kind: "cp"; readonly value: number; readonly bound: "lower" | "upper" }>
  | Readonly<{ readonly kind: "mate"; readonly plies: number; readonly bound: "exact" }>;

export interface GuardRoot {
  readonly fen: string;
  readonly historyDigest: `sha256:${string}`;
  readonly sideToMove: "white" | "black";
}

export interface GuardRequest {
  readonly root: GuardRoot;
  readonly candidateMoves: readonly string[];
  readonly profile: typeof STOCKFISH_GUARD_PROFILE;
}

export type GuardProviderResult =
  | Readonly<{ readonly state: "provider_unavailable" }>
  | Readonly<{ readonly state: "deadline_exceeded"; readonly elapsedMs: number }>
  | Readonly<{
    readonly state: "complete";
    readonly elapsedMs: number;
    readonly rows: readonly Readonly<{ readonly moveUci: string; readonly score: GuardScore }>[];
  }>;

interface GuardReceiptBase {
  readonly root: GuardRoot;
  readonly candidateMoves: readonly string[];
  readonly profile: typeof STOCKFISH_GUARD_PROFILE;
  readonly elapsedMs?: number;
}

export type GuardReceipt =
  | (GuardReceiptBase & Readonly<{
    readonly state: "applied";
    readonly lossesCp: Readonly<Record<string, number>>;
  }>)
  | (GuardReceiptBase & Readonly<{
    readonly state: "abstained";
    readonly reason: Exclude<GuardAbstentionReason, "root_mismatch" | "empty_after_mask">;
  }>);

export interface GuardApplication {
  readonly state: "applied" | "abstained";
  readonly admittedMoves: readonly string[];
  readonly reason?: GuardAbstentionReason;
}

export interface TraitView {
  readonly rootFen: string;
  readonly candidateMoves: readonly string[];
  readonly byMove: Readonly<Record<string, readonly BotTraitId[]>>;
}

export interface GuardedTraitComposition {
  readonly masses: Readonly<Record<string, number>>;
  readonly guard: Readonly<{ readonly action: "applied" | "abstained"; readonly reason?: GuardAbstentionReason }>;
  readonly trait: Readonly<{ readonly action: "applied" | "abstained"; readonly reason?: string }>;
}

const sealedReceipts = new WeakSet<object>();
const sealedTraitViews = new WeakSet<object>();

function sha256(value: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function guardHistoryDigest(moves: readonly string[]): `sha256:${string}` {
  return sha256(moves.join("\0"));
}

function sideFromFen(fen: string): "white" | "black" {
  const side = fen.trim().split(/\s+/u)[1];
  if (side === "w") return "white";
  if (side === "b") return "black";
  throw new TypeError("guard root has no valid side to move");
}

function canonicalCandidateSet(fen: string, moves: readonly string[]): readonly string[] {
  if (moves.length === 0) throw new TypeError("guard request has no candidates");
  const canonical = moves.map((move) => exactMoveIdentity(fen, move)).sort();
  if (new Set(canonical).size !== canonical.length) throw new TypeError("guard request has duplicate candidates");
  return Object.freeze(canonical);
}

export function makeGuardRequest(input: {
  readonly fen: string;
  readonly history: readonly string[];
  readonly candidateMoves: readonly string[];
}): GuardRequest {
  return Object.freeze({
    root: Object.freeze({
      fen: input.fen,
      historyDigest: guardHistoryDigest(input.history),
      sideToMove: sideFromFen(input.fen),
    }),
    candidateMoves: canonicalCandidateSet(input.fen, input.candidateMoves),
    profile: STOCKFISH_GUARD_PROFILE,
  });
}

function abstainedReceipt(
  request: GuardRequest,
  reason: Exclude<GuardAbstentionReason, "root_mismatch" | "empty_after_mask">,
  elapsedMs?: number,
): GuardReceipt {
  const receipt = Object.freeze({
    state: "abstained" as const,
    reason,
    root: request.root,
    candidateMoves: request.candidateMoves,
    profile: request.profile,
    ...(elapsedMs === undefined ? {} : { elapsedMs }),
  });
  sealedReceipts.add(receipt);
  return receipt;
}

export function compileGuardReceipt(request: GuardRequest, result: GuardProviderResult): GuardReceipt {
  if (result.state === "provider_unavailable") return abstainedReceipt(request, result.state);
  if (result.state === "deadline_exceeded") return abstainedReceipt(request, result.state, result.elapsedMs);

  const requested = new Set(request.candidateMoves);
  const rowMoves: string[] = [];
  for (const row of result.rows) {
    let canonical: string;
    try {
      canonical = exactMoveIdentity(request.root.fen, row.moveUci);
    } catch {
      return abstainedReceipt(request, "candidate_set_mismatch", result.elapsedMs);
    }
    if (rowMoves.includes(canonical)) return abstainedReceipt(request, "duplicate_row", result.elapsedMs);
    rowMoves.push(canonical);
    if (!requested.has(canonical)) return abstainedReceipt(request, "candidate_set_mismatch", result.elapsedMs);
  }
  if (rowMoves.length !== request.candidateMoves.length) return abstainedReceipt(request, "missing_row", result.elapsedMs);

  const domains = new Set(result.rows.map((row) => row.score.kind));
  if (domains.size > 1) return abstainedReceipt(request, "mixed_score_domain", result.elapsedMs);
  if (domains.has("mate")) return abstainedReceipt(request, "non_cp_score_domain", result.elapsedMs);
  if (result.rows.some((row) => row.score.bound !== "exact")) return abstainedReceipt(request, "bounded_row", result.elapsedMs);

  const cpByMove = new Map(result.rows.map((row) => [exactMoveIdentity(request.root.fen, row.moveUci), "value" in row.score ? row.score.value : 0]));
  const best = Math.max(...cpByMove.values());
  const lossesCp = Object.freeze(Object.fromEntries(request.candidateMoves.map((move) => [move, best - cpByMove.get(move)!])));
  const receipt = Object.freeze({
    state: "applied" as const,
    root: request.root,
    candidateMoves: request.candidateMoves,
    profile: request.profile,
    elapsedMs: result.elapsedMs,
    lossesCp,
  });
  sealedReceipts.add(receipt);
  return receipt;
}

export function applyGuard(input: {
  readonly receipt: GuardReceipt;
  readonly request: GuardRequest;
  readonly thresholdCp: number;
}): GuardApplication {
  if (!sealedReceipts.has(input.receipt)) throw new TypeError("unsealed guard receipt");
  if (!(input.thresholdCp >= 0 && Number.isFinite(input.thresholdCp))) throw new TypeError("invalid guard threshold");
  const sameRoot = input.receipt.root.fen === input.request.root.fen
    && input.receipt.root.historyDigest === input.request.root.historyDigest
    && input.receipt.root.sideToMove === input.request.root.sideToMove;
  const sameCandidates = input.receipt.candidateMoves.join("\0") === input.request.candidateMoves.join("\0");
  if (!sameRoot || !sameCandidates) {
    return Object.freeze({ state: "abstained", admittedMoves: Object.freeze([]), reason: "root_mismatch" });
  }
  if (input.receipt.state === "abstained") {
    return Object.freeze({ state: "abstained", admittedMoves: Object.freeze([]), reason: input.receipt.reason });
  }
  const admittedMoves = Object.freeze(input.receipt.candidateMoves.filter((move) => input.receipt.lossesCp[move]! < input.thresholdCp));
  if (admittedMoves.length === 0) {
    return Object.freeze({ state: "abstained", admittedMoves, reason: "empty_after_mask" });
  }
  return Object.freeze({ state: "applied", admittedMoves });
}

export function classifyBotTraits(input: { readonly fen: string; readonly candidateMoves: readonly string[] }): TraitView {
  const candidates = canonicalCandidateSet(input.fen, input.candidateMoves);
  const legal = new Map(exactLegalMoves(input.fen).map((move) => [move.uci, move]));
  const byMove = Object.freeze(Object.fromEntries(candidates.map((move) => {
    const traits: readonly BotTraitId[] = legal.get(move)?.role === "pawn" ? Object.freeze(["pawn_move" as const]) : Object.freeze([]);
    return [move, traits];
  })));
  const view = Object.freeze({ rootFen: input.fen, candidateMoves: candidates, byMove });
  sealedTraitViews.add(view);
  return view;
}

function normalizeMasses(masses: Readonly<Record<string, number>>): Readonly<Record<string, number>> {
  const entries = Object.entries(masses).sort(([left], [right]) => left.localeCompare(right));
  if (entries.length === 0 || entries.some(([, mass]) => !Number.isFinite(mass) || mass < 0)) throw new TypeError("invalid base mass");
  const total = entries.reduce((sum, [, mass]) => sum + mass, 0);
  if (!(total > 0)) throw new TypeError("empty base distribution");
  return Object.freeze(Object.fromEntries(entries.map(([move, mass]) => [move, mass / total])));
}

export function composeGuardedPawnTrait(input: {
  readonly baseMasses: Readonly<Record<string, number>>;
  readonly guard: GuardApplication;
  readonly traits: TraitView;
  readonly multiplier: number;
}): GuardedTraitComposition {
  if (!sealedTraitViews.has(input.traits)) throw new TypeError("unsealed trait view");
  if (!(input.multiplier > 0 && Number.isFinite(input.multiplier))) throw new TypeError("invalid trait multiplier");
  const base = normalizeMasses(input.baseMasses);
  const baseMoves = Object.keys(base).sort();
  if (baseMoves.join("\0") !== input.traits.candidateMoves.join("\0")) throw new TypeError("trait view candidate mismatch");
  if (input.guard.state === "abstained") {
    return Object.freeze({
      masses: base,
      guard: Object.freeze({ action: "abstained", reason: input.guard.reason }),
      trait: Object.freeze({ action: "abstained", reason: "guard_dependency_unmet" }),
    });
  }
  const admitted = new Set(input.guard.admittedMoves);
  const weighted = Object.fromEntries(baseMoves.map((move) => [
    move,
    admitted.has(move) ? base[move]! * (input.traits.byMove[move]?.includes("pawn_move") === true ? input.multiplier : 1) : 0,
  ]));
  return Object.freeze({
    masses: normalizeMasses(weighted),
    guard: Object.freeze({ action: "applied" }),
    trait: Object.freeze({ action: "applied" }),
  });
}
