// Accepted profile-choice-facts §3. Closed data only; genuine source ownership is checked separately.
import { LONGITUDINAL_PHASES, type LongitudinalPhase } from "./longitudinal-contract.js";
export interface ChoiceDecisionRef { readonly nodeId: string; readonly eventSeq: number; readonly beforeNodeId: string; readonly sourcePly: number }
export type ChoiceResult = { readonly kind: "available"; readonly legalUcis: readonly string[];
  readonly counts: Readonly<{ pawn: number; centerPawn: number; queen: number }>;
  readonly chosen: Readonly<{ pawn: boolean; centerPawn: boolean; queen: boolean }> }
  | { readonly kind: "unavailable"; readonly reason: "source_context_unavailable" | "role_unavailable" };
export interface ChoiceDecision {
  readonly ref: ChoiceDecisionRef; readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string;
  readonly moverColor: "white" | "black"; readonly phase: LongitudinalPhase; readonly result: ChoiceResult;
}
export type ProfileChoiceCohort = { readonly kind: "ineligible"; readonly reason: "not_standard_start" | "no_primary_played_decision" }
  | { readonly kind: "eligible"; readonly decisions: readonly ChoiceDecision[] };
export interface LongitudinalChoiceFactRow {
  readonly learnerId: string; readonly runId: string; readonly completedSeq: number; readonly derivedRev: number;
  readonly observedAt: string; readonly primaryBranchId: string; readonly cohort: ProfileChoiceCohort;
}
export type ChoiceFactReadOutcome = { readonly kind: "available"; readonly row: LongitudinalChoiceFactRow }
  | { readonly kind: "unavailable"; readonly runId: string; readonly completedSeq: number; readonly reason: "choice_facts_missing" | "choice_facts_invalid" };
const fail = (): never => { throw new TypeError("LONGITUDINAL_CHOICE_ROW_INVALID"); };
function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    || Reflect.ownKeys(value).length !== keys.length || !keys.every(key => { const d = Object.getOwnPropertyDescriptor(value, key); return d?.enumerable && "value" in d; })) return fail();
  return value as Record<string, unknown>;
}
const string = (value: unknown): string => typeof value === "string" && value.length > 0 ? value : fail();
const integer = (value: unknown, min: number): number => Number.isSafeInteger(value) && (value as number) >= min ? value as number : fail();
const boolean = (value: unknown): boolean => typeof value === "boolean" ? value : fail();
function array(value: unknown): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || Reflect.ownKeys(value).length !== value.length + 1) return fail();
  for (let index = 0; index < value.length; index++) {
    const d = Object.getOwnPropertyDescriptor(value, String(index));
    if (d === undefined || !d.enumerable || !("value" in d)) return fail();
  }
  return value;
}
function kind(value: unknown): unknown { if (value === null || typeof value !== "object") return fail(); const d = Object.getOwnPropertyDescriptor(value, "kind"); return d && "value" in d ? d.value : fail(); }
function result(value: unknown, moveUci: string): ChoiceResult {
  if (kind(value) === "unavailable") {
    const r = object(value, ["kind", "reason"]);
    if (r.reason !== "source_context_unavailable" && r.reason !== "role_unavailable") return fail();
    return Object.freeze({ kind: "unavailable", reason: r.reason });
  }
  const r = object(value, ["kind", "legalUcis", "counts", "chosen"]);
  if (r.kind !== "available" || !Array.isArray(r.legalUcis) || r.legalUcis.length === 0) return fail();
  const legal = array(r.legalUcis).map(v => string(v));
  if (legal.some((v, i) => !/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(v) || i > 0 && legal[i - 1]!.localeCompare(v) >= 0)
    || legal.filter(v => v === moveUci).length !== 1) return fail();
  const n = legal.length, rawCounts = object(r.counts, ["pawn", "centerPawn", "queen"]), rawChosen = object(r.chosen, ["pawn", "centerPawn", "queen"]);
  const counts = { pawn: integer(rawCounts.pawn, 0), centerPawn: integer(rawCounts.centerPawn, 0), queen: integer(rawCounts.queen, 0) };
  const chosen = { pawn: boolean(rawChosen.pawn), centerPawn: boolean(rawChosen.centerPawn), queen: boolean(rawChosen.queen) };
  if (counts.centerPawn > counts.pawn || counts.pawn + counts.queen > n || chosen.centerPawn && !chosen.pawn || chosen.pawn && chosen.queen
    || (["pawn", "centerPawn", "queen"] as const).some(key => counts[key] > n || chosen[key] && counts[key] === 0 || !chosen[key] && counts[key] === n)) return fail();
  return Object.freeze({ kind: "available", legalUcis: Object.freeze(legal), counts: Object.freeze(counts), chosen: Object.freeze(chosen) });
}
function decision(value: unknown): ChoiceDecision {
  const r = object(value, ["ref", "beforeFen", "moveUci", "afterFen", "moverColor", "phase", "result"]), ref = object(r.ref, ["nodeId", "eventSeq", "beforeNodeId", "sourcePly"]);
  if (r.moverColor !== "white" && r.moverColor !== "black" || typeof r.phase !== "string" || !LONGITUDINAL_PHASES.includes(r.phase as LongitudinalPhase)) return fail();
  const moveUci = string(r.moveUci);
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(moveUci)) return fail();
  return Object.freeze({ ref: Object.freeze({ nodeId: string(ref.nodeId), eventSeq: integer(ref.eventSeq, 1), beforeNodeId: string(ref.beforeNodeId), sourcePly: integer(ref.sourcePly, 0) }),
    beforeFen: string(r.beforeFen), moveUci, afterFen: string(r.afterFen), moverColor: r.moverColor,
    phase: r.phase as ChoiceDecision["phase"], result: result(r.result, moveUci) });
}
export function parseLongitudinalChoiceFactRow(value: unknown): LongitudinalChoiceFactRow {
  const r = object(value, ["learnerId", "runId", "completedSeq", "derivedRev", "observedAt", "primaryBranchId", "cohort"]);
  let cohort: ProfileChoiceCohort;
  if (kind(r.cohort) === "ineligible") {
    const c = object(r.cohort, ["kind", "reason"]);
    if (c.reason !== "not_standard_start" && c.reason !== "no_primary_played_decision") return fail();
    cohort = Object.freeze({ kind: "ineligible", reason: c.reason });
  } else {
    const c = object(r.cohort, ["kind", "decisions"]);
    if (c.kind !== "eligible" || !Array.isArray(c.decisions) || c.decisions.length === 0) return fail();
    const decisions = array(c.decisions).map(decision);
    if (decisions.some((d, i) => i > 0 && (decisions[i - 1]!.ref.sourcePly >= d.ref.sourcePly || decisions[i - 1]!.ref.eventSeq >= d.ref.eventSeq))
      || new Set(decisions.map(d => d.ref.nodeId)).size !== decisions.length) return fail();
    cohort = Object.freeze({ kind: "eligible", decisions: Object.freeze(decisions) });
  }
  const observedAt = string(r.observedAt), epoch = Date.parse(observedAt);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== observedAt) return fail();
  return Object.freeze({ learnerId: string(r.learnerId), runId: string(r.runId), completedSeq: integer(r.completedSeq, 1), derivedRev: integer(r.derivedRev, 1),
    observedAt, primaryBranchId: string(r.primaryBranchId), cohort });
}
export function choiceFactFromSql(r: Readonly<Record<string, unknown>>): LongitudinalChoiceFactRow {
  return parseLongitudinalChoiceFactRow({ learnerId: r.learner_id, runId: r.run_id, completedSeq: r.completed_seq, derivedRev: r.derived_rev,
    observedAt: r.observed_at, primaryBranchId: r.primary_branch_id, cohort: JSON.parse(String(r.cohort_json)) });
}
