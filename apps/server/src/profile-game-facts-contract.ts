// profile-game-facts §5: the closed GAME-unit row, separate from decision opportunities.
export interface GameNodeRef { readonly nodeId: string; readonly eventSeq: number; readonly sourcePly: number }
export type GameConfiguration = { readonly kind: "observed"; readonly first: GameNodeRef | null }
  | { readonly kind: "unavailable"; readonly reason: "role_unavailable" | "worker_context_unavailable" };
export type GameInitialRights = { readonly kind: "observed"; readonly before: GameNodeRef; readonly kingside: boolean; readonly queenside: boolean }
  | { readonly kind: "unavailable"; readonly reason: "role_unavailable" | "worker_context_unavailable" | "source_unavailable" | "source_subject_mismatch" };
export type ProfileGame = { readonly kind: "ineligible"; readonly reason: "not_standard_start" | "no_primary_played_decision" }
  | { readonly kind: "eligible"; readonly firstOwnerDecision: GameNodeRef; readonly fianchetto: GameConfiguration;
      readonly knightScreen: GameConfiguration; readonly castling: GameInitialRights };
export interface LongitudinalGameFactRow {
  readonly learnerId: string; readonly runId: string; readonly completedSeq: number; readonly derivedRev: number;
  readonly observedAt: string; readonly primaryBranchId: string; readonly learnerSide: "white" | "black"; readonly game: ProfileGame;
}
export type GameFactReadOutcome = { readonly kind: "available"; readonly row: LongitudinalGameFactRow }
  | { readonly kind: "unavailable"; readonly runId: string; readonly completedSeq: number;
      readonly reason: "game_facts_missing" | "game_facts_invalid" };
const fail = (): never => { throw new TypeError("LONGITUDINAL_GAME_ROW_INVALID"); };
function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return fail();
  if (Reflect.ownKeys(value).length !== keys.length || !keys.every(key => {
    const d = Object.getOwnPropertyDescriptor(value, key); return d?.enumerable && "value" in d;
  })) return fail();
  return value as Record<string, unknown>;
}
const string = (v: unknown): string => typeof v === "string" && v.length > 0 ? v : fail();
const integer = (v: unknown, min: number): number => typeof v === "number" && Number.isSafeInteger(v) && v >= min ? v : fail();
const boolean = (v: unknown): boolean => typeof v === "boolean" ? v : fail();
function kind(v: unknown): unknown {
  if (v === null || typeof v !== "object") return fail();
  const d = Object.getOwnPropertyDescriptor(v, "kind"); return d !== undefined && "value" in d ? d.value : fail();
}
function ref(v: unknown): GameNodeRef {
  const r = object(v, ["nodeId", "eventSeq", "sourcePly"]);
  return Object.freeze({ nodeId: string(r.nodeId), eventSeq: integer(r.eventSeq, 1), sourcePly: integer(r.sourcePly, 0) });
}
function configuration(v: unknown): GameConfiguration {
  if (kind(v) === "observed") { const r = object(v, ["kind", "first"]); return Object.freeze({ kind: "observed", first: r.first === null ? null : ref(r.first) }); }
  const r = object(v, ["kind", "reason"]);
  if (r.kind !== "unavailable" || (typeof r.reason !== "string" || !["role_unavailable", "worker_context_unavailable"].includes(r.reason))) return fail();
  return Object.freeze({ kind: "unavailable", reason: r.reason as "role_unavailable" | "worker_context_unavailable" });
}
function rights(v: unknown): GameInitialRights {
  if (kind(v) === "observed") {
    const r = object(v, ["kind", "before", "kingside", "queenside"]);
    return Object.freeze({ kind: "observed", before: ref(r.before), kingside: boolean(r.kingside), queenside: boolean(r.queenside) });
  }
  const r = object(v, ["kind", "reason"]);
  if (r.kind !== "unavailable" || (typeof r.reason !== "string" || !["role_unavailable", "worker_context_unavailable", "source_unavailable", "source_subject_mismatch"].includes(r.reason))) return fail();
  return Object.freeze({ kind: "unavailable", reason: r.reason as Extract<GameInitialRights, {kind:"unavailable"}>["reason"] });
}
export function parseLongitudinalGameFactRow(value: unknown): LongitudinalGameFactRow {
  const r = object(value, ["learnerId", "runId", "completedSeq", "derivedRev", "observedAt", "primaryBranchId", "learnerSide", "game"]);
  const observedAt = string(r.observedAt), epoch = Date.parse(observedAt);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== observedAt || (typeof r.learnerSide !== "string" || !["white", "black"].includes(r.learnerSide))) return fail();
  let game: ProfileGame;
  if (kind(r.game) === "ineligible") {
    const g = object(r.game, ["kind", "reason"]);
    if ((typeof g.reason !== "string" || !["not_standard_start", "no_primary_played_decision"].includes(g.reason))) return fail();
    game = Object.freeze({ kind: "ineligible", reason: g.reason as "not_standard_start" | "no_primary_played_decision" });
  } else {
    const g = object(r.game, ["kind", "firstOwnerDecision", "fianchetto", "knightScreen", "castling"]);
    if (g.kind !== "eligible") return fail();
    game = Object.freeze({ kind: "eligible", firstOwnerDecision: ref(g.firstOwnerDecision), fianchetto: configuration(g.fianchetto),
      knightScreen: configuration(g.knightScreen), castling: rights(g.castling) });
  }
  return Object.freeze({ learnerId: string(r.learnerId), runId: string(r.runId), completedSeq: integer(r.completedSeq, 1), derivedRev: integer(r.derivedRev, 1),
    observedAt, primaryBranchId: string(r.primaryBranchId), learnerSide: r.learnerSide as "white" | "black", game });
}
export function gameFactFromSql(r: Readonly<Record<string, unknown>>): LongitudinalGameFactRow {
  return parseLongitudinalGameFactRow({ learnerId: r.learner_id, runId: r.run_id, completedSeq: r.completed_seq, derivedRev: r.derived_rev,
    observedAt: r.observed_at, primaryBranchId: r.primary_branch_id, learnerSide: r.learner_side, game: JSON.parse(String(r.game_json)) });
}
