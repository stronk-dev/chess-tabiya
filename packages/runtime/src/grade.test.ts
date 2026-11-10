import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GRADE_CONVENTION, assertMoveQualityGradeSentence, classifyWinPercentLoss, moveQualityGrade,
  recordedGradeScore, renderMoveQualityGrade, renderMoveQualityResult, winPercentFromCp, type GradeSide } from "./grade.js";
import type { ComparisonScore } from "./compare.js";
import type { RecordedEngineAvailable, RecordedEngineInstrument, RecordedEngineRequestedBound } from "./internal/recorded-engine-endpoint-values.js";

const provider = Object.freeze({ origin: "provider_delivery" as const, engineVersion: "18", generation: 2 });
const offline = Object.freeze({ origin: "offline_engine" as const, engineVersion: "18", profile: Object.freeze({ threads: 1, hashMb: 16, multiPv: 1 as const }) });
function reading(score: ComparisonScore, mover: GradeSide = "white", instrument: RecordedEngineInstrument = provider,
  bound: RecordedEngineRequestedBound = { kind: "depth", requestedDepth: 18 }): RecordedEngineAvailable {
  return Object.freeze({ kind: "available", engineId: "Stockfish", instrument, bound: Object.freeze(bound),
    score: Object.freeze(score.kind === "cp" ? { kind: "centipawns", value: score.value * (mover === "white" ? 1 : -1) }
      : { kind: "mate", side: score.movesTo > 0 ? mover : mover === "white" ? "black" : "white", distance: Math.abs(score.movesTo), unit: "moves" }) });
}
const cp = (value: number) => ({ kind: "cp" as const, value });
const mate = (movesTo: number) => ({ kind: "mate" as const, movesTo });
const classify = (before: number, after: number, mover: GradeSide = "white") => moveQualityGrade(reading(cp(before), mover), reading(cp(after), mover), mover);
function assertCitedConstants(constants: Readonly<Record<string, unknown>>) {
  expect(Object.keys(constants).sort()).toEqual(["inaccuracy", "mistake", "blunder", "mateLostInaccuracy", "mateLostMistake", "mateAllowedInaccuracy", "mateAllowedMistake", "centipawnClamp", "logisticCoefficient"].sort());
  for (const record of Object.values(constants)) {
    expect(Object.keys(record as object).sort()).toEqual(["pinnedAt", "source", "value"]);
    expect(record).toMatchObject({ value: expect.any(Number), source: expect.stringMatching(/^https:\/\//u), pinnedAt: "2026-08-22" });
    expect(Number.isFinite((record as { value: number }).value)).toBe(true);
  }
}
describe("accepted single move-quality convention", () => {
  it("retires the loose predecessor parser and its unused public input types", () => {
    expect(existsSync(new URL("./grade-reading.ts", import.meta.url))).toBe(false);
    for (const file of ["./grade.ts", "./index.ts"]) {
      expect(readFileSync(new URL(file, import.meta.url), "utf8")).not.toMatch(/\bGradeEvaluation(?:Base)?\b|\bGradeLane\b/u);
    }
  });
  it.each(["white", "black"] as const)("keeps zero scores byte-stable through JSON for %s", mover => {
    for (const value of [0, -0]) {
      const score = recordedGradeScore(reading(cp(value), mover), mover);
      expect(score).toEqual(JSON.parse(JSON.stringify(score)));
      expect(Object.is(score.score.kind === "cp" ? score.score.value : undefined, -0)).toBe(false);
    }
  });
  it("has exactly nine cited constants and no workflow-selected ladder", () => {
    assertCitedConstants(GRADE_CONVENTION.constants);
    expect(Object.keys(GRADE_CONVENTION).sort()).toEqual(["constants", "id", "version"]);
    expect(GRADE_CONVENTION.version).toBe(2);
    expect(Object.fromEntries(Object.entries(GRADE_CONVENTION.constants).map(([key, value]) => [key, value.value])))
      .toEqual({ inaccuracy: 2.5, mistake: 10, blunder: 15, mateLostInaccuracy: 999, mateLostMistake: 700,
        mateAllowedInaccuracy: -999, mateAllowedMistake: -700, centipawnClamp: 1000, logisticCoefficient: 0.00368208 });
  });
  it.each(["value", "source", "pinnedAt"] as const)("rejects missing/invalid/extra %s on every cited constant", field => {
    for (const [key, record] of Object.entries(GRADE_CONVENTION.constants)) {
      const missing: Record<string, unknown> = { ...record }; delete missing[field];
      expect(() => assertCitedConstants({ ...GRADE_CONVENTION.constants, [key]: missing })).toThrow();
      expect(() => assertCitedConstants({ ...GRADE_CONVENTION.constants, [key]: { ...record, [field]: field === "value" ? NaN : "" } })).toThrow();
      expect(() => assertCitedConstants({ ...GRADE_CONVENTION.constants, [key]: { ...record, extra: true } })).toThrow();
    }
  });
  it.each(["white", "black"] as const)("pins every cp boundary and input clamp for %s", mover => {
    expect([-27, -28, -110, -111, -168, -169].map(after => {
      const result = classify(0, after, mover); return result === undefined || "abstained" in result ? undefined : result.klass;
    })).toEqual([undefined, "inaccuracy", "inaccuracy", "mistake", "mistake", "blunder"]);
    expect(classify(3000, 530, mover)).toMatchObject({ klass: "inaccuracy" });
    expect(classify(2500, 1200, mover)).toBeUndefined();
    expect(classify(0, -66, mover)).toMatchObject({ klass: "inaccuracy" });
    expect(classify(0, -157, mover)).toMatchObject({ klass: "mistake" });
    expect(winPercentFromCp(0)).toBe(50);
  });
  it.each([[2.5, undefined, "inaccuracy"], [10, "inaccuracy", "mistake"], [15, "mistake", "blunder"]] as const)("uses an inclusive unrounded threshold %s", (threshold, below, at) => {
    expect(classifyWinPercentLoss(threshold - 1e-12)?.klass).toBe(below);
    expect(classifyWinPercentLoss(threshold)?.klass).toBe(at);
    expect(classifyWinPercentLoss(threshold + 1e-12)?.klass).toBe(at);
  });
  it.each([NaN, Infinity, -Infinity])("refuses nonfinite loss: %s", value => expect(() => classifyWinPercentLoss(value)).toThrow());
  const mates = [
    [mate(2), cp(1100), "inaccuracy", "mate_lost"], [mate(2), cp(999), "mistake", "mate_lost"],
    [mate(2), cp(800), "mistake", "mate_lost"], [mate(2), cp(700), "blunder", "mate_lost"],
    [mate(2), mate(-4), "blunder", "mate_lost"], [cp(0), mate(-3), "blunder", "mate_allowed"],
    [cp(-800), mate(-2), "mistake", "mate_allowed"], [cp(-999), mate(-2), "mistake", "mate_allowed"],
    [cp(-700), mate(-2), "blunder", "mate_allowed"], [cp(-1200), mate(-2), "inaccuracy", "mate_allowed"],
  ] as const;
  for (const mover of ["white", "black"] as const) it.each(mates)(`${mover} preserves typed mate tiers (%j → %j)`, (before, after, klass, arm) => {
    expect(moveQualityGrade(reading(before, mover), reading(after, mover), mover)).toMatchObject({ klass, arm,
      before: { score: before }, after: { score: after }, convention: { id: "grade-convention", version: 2 } });
  });
  it.each(["white", "black"] as const)("distinguishes inconsistent mates from ungraded continuations for %s", mover => {
    for (const [before, after] of [[mate(2), mate(5)], [mate(5), mate(2)], [mate(-2), mate(-5)], [cp(0), mate(2)]]) {
      expect(moveQualityGrade(reading(before!, mover), reading(after!, mover), mover)).toBeUndefined();
    }
    const result = moveQualityGrade(reading(mate(-2), mover), reading(cp(-900), mover), mover);
    expect(result).toEqual({ abstained: true, reason: "mate_score_inconsistent" }); expect(renderMoveQualityResult(result)).toEqual([]);
    expect(recordedGradeScore(reading(mate(-2), mover), mover).winPercent).toBe(0);
  });
  for (const instrument of [provider, offline]) for (const bound of [{ kind: "depth", requestedDepth: 18 }, { kind: "movetime", requestedMs: 100 }, { kind: "nodes", requestedNodes: 1000 }] as const) {
    it(`retains actual ${instrument.origin}/${bound.kind} in complete payload and prose`, () => {
      const result = moveQualityGrade(reading(cp(100), "white", instrument, bound), reading(cp(-100), "white", instrument, bound), "white");
      if (result === undefined || "abstained" in result) throw new Error("expected synthetic loss grade");
      expect(result).toMatchObject({ instrument, bound, lane: "recorded", engineId: "Stockfish" });
      expect(Object.keys(result).sort()).toEqual(["klass", "arm", "before", "after", "dropWinPercent", "thresholdCrossed", "convention", "engineId", "lane", "bound", "instrument"].sort());
      const sentence = renderMoveQualityGrade(result);
      expect(sentence).toContain("Stockfish 18"); expect(sentence).toContain("single move-loss convention, version 2");
      expect(sentence.split(/\s+/u).length).toBeLessThanOrEqual(50);
      expect(sentence).toContain(bound.kind === "depth" ? "requested depth 18" : bound.kind === "movetime" ? "requested 100 ms" : "requested 1000 nodes");
      expect(() => assertMoveQualityGradeSentence(result, sentence)).not.toThrow();
      expect(() => assertMoveQualityGradeSentence(result, "Blunder")).toThrow();
    });
  }
  it("abstains on absent, mixed-origin, different generation/profile/version/budget inputs", () => {
    const before = reading(cp(0)), after = reading(cp(-200));
    expect(moveQualityGrade(undefined, after, "white")).toEqual({ abstained: true, reason: "missing_eval" });
    expect(moveQualityGrade({ abstained: true }, after, "white")).toEqual({ abstained: true, reason: "input_abstained" });
    for (const changed of [reading(cp(-200), "white", offline), { ...after, engineId: "Other" },
      { ...after, instrument: { ...provider, generation: 3 } }, { ...after, instrument: { ...provider, engineVersion: "19" } },
      reading(cp(-200), "white", provider, { kind: "depth", requestedDepth: 20 }), reading(cp(-200), "white", provider, { kind: "nodes", requestedNodes: 18 })]) {
      expect(moveQualityGrade(before, changed, "white")).toEqual({ abstained: true, reason: "unequal_instrument" });
    }
    expect(moveQualityGrade(reading(cp(0), "white", offline), reading(cp(-200), "white", { ...offline, profile: { ...offline.profile, hashMb: 32 } }), "white"))
      .toEqual({ abstained: true, reason: "unequal_instrument" });
  });
});
