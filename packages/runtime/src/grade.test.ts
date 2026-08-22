import { describe, expect, it } from "vitest";

import type { GradeContext, GradeEvaluation, GradeSide, MoveQualityGrade } from "./grade.js";
import {
  GRADE_CONVENTION,
  assertMoveQualityGradeSentence,
  moveQualityGrade,
  renderMoveQualityGrade,
  renderMoveQualityResult,
  winPercentFromCp,
} from "./grade.js";

type GradeEvaluationExtras = Partial<Omit<GradeEvaluation, "lane" | "perspective" | "score" | "sideToMove">>;
const recorded = (score: GradeEvaluation["score"], extras: GradeEvaluationExtras = {}): GradeEvaluation => ({
  lane: "recorded", engineId: "stockfish-17", score, sideToMove: "white", perspective: "white", depth: 18, ...extras,
});
const live = (score: GradeEvaluation["score"], sideToMove: GradeSide, extras: GradeEvaluationExtras = {}): GradeEvaluation => ({
  lane: "live", engineId: "stockfish-17", score, sideToMove, perspective: "side_to_move", depth: 18, ...extras,
});
const classify = (before: number, after: number, context: GradeContext) => moveQualityGrade(recorded({ kind: "cp", value: before }), recorded({ kind: "cp", value: after }), context, "white");

describe("move-quality grades", () => {
  it("pins all twelve convention constants to a source and date", () => {
    expect(Object.values(GRADE_CONVENTION.constants)).toHaveLength(12);
    for (const constant of Object.values(GRADE_CONVENTION.constants)) {
      expect(constant.value).toEqual(expect.any(Number));
      expect(constant.source).toMatch(/^https:\/\//u);
      expect(constant.pinnedAt).toBe("2026-08-22");
    }
    expect({ ...GRADE_CONVENTION.constants.reportInaccuracy, source: "" }).not.toEqual(GRADE_CONVENTION.constants.reportInaccuracy);
  });

  it("pins both ladders on both sides of every boundary and clamps before conversion", () => {
    expect(winPercentFromCp(0)).toBeCloseTo(50, 8);
    expect([[0, -54], [0, -110], [0, -168]].map(([a, b]) => (classify(a!, b!, "review") as { klass?: string } | undefined)?.klass)).toEqual([undefined, "inaccuracy", "mistake"]);
    expect([[0, -55], [0, -111], [0, -169]].map(([a, b]) => (classify(a!, b!, "review") as { klass?: string })?.klass)).toEqual(["inaccuracy", "mistake", "blunder"]);
    expect([[0, -27], [0, -65], [0, -156]].map(([a, b]) => (classify(a!, b!, "drill") as { klass?: string } | undefined)?.klass)).toEqual([undefined, "inaccuracy", "mistake"]);
    expect([[0, -28], [0, -66], [0, -157]].map(([a, b]) => (classify(a!, b!, "drill") as { klass?: string })?.klass)).toEqual(["inaccuracy", "mistake", "blunder"]);
    expect((classify(3000, 530, "review") as { klass: string }).klass).toBe("inaccuracy");
  });

  it("uses the practice ladder only for drills", () => {
    expect((classify(0, -28, "drill") as { klass: string }).klass).toBe("inaccuracy");
    expect(classify(0, -28, "review")).toBeUndefined();
    expect(classify(0, -28, "imported_analysis")).toBeUndefined();
  });

  it("grades the complete mate table without coercing mate to centipawns", () => {
    const result = (before: GradeEvaluation["score"], after: GradeEvaluation["score"]) => moveQualityGrade(recorded(before), recorded(after), "review", "white") as { klass?: string; arm?: string } | undefined;
    expect(result({ kind: "mate", movesTo: 2 }, { kind: "cp", value: 1100 })).toMatchObject({ klass: "inaccuracy", arm: "mate_lost" });
    expect(result({ kind: "mate", movesTo: 2 }, { kind: "cp", value: 800 })).toMatchObject({ klass: "mistake", arm: "mate_lost" });
    expect(result({ kind: "mate", movesTo: 3 }, { kind: "cp", value: 200 })).toMatchObject({ klass: "blunder", arm: "mate_lost" });
    expect(result({ kind: "mate", movesTo: 2 }, { kind: "mate", movesTo: -4 })).toMatchObject({ klass: "blunder", arm: "mate_lost" });
    expect(result({ kind: "cp", value: 0 }, { kind: "mate", movesTo: -3 })).toMatchObject({ klass: "blunder", arm: "mate_allowed" });
    expect(result({ kind: "cp", value: -800 }, { kind: "mate", movesTo: -2 })).toMatchObject({ klass: "mistake", arm: "mate_allowed" });
    expect(result({ kind: "cp", value: -1200 }, { kind: "mate", movesTo: -2 })).toMatchObject({ klass: "inaccuracy", arm: "mate_allowed" });
    expect(result({ kind: "mate", movesTo: 2 }, { kind: "mate", movesTo: 5 })).toBeUndefined();
    const lost = result({ kind: "mate", movesTo: 2 }, { kind: "cp", value: 800 });
    if (lost !== undefined && "klass" in lost) expect(renderMoveQualityGrade(lost as MoveQualityGrade)).toContain("inside +7.00..+9.99");
  });

  it("abstains on missing, abstained, mixed or inconsistent readings and renders silence", () => {
    const after = recorded({ kind: "cp", value: -200 });
    expect(moveQualityGrade(undefined, after, "review", "white")).toEqual({ abstained: true, reason: "missing_eval" });
    expect(moveQualityGrade({ abstained: true }, after, "review", "white")).toEqual({ abstained: true, reason: "input_abstained" });
    expect(moveQualityGrade(recorded({ kind: "cp", value: 0 }), live({ kind: "cp", value: -200 }, "black"), "review", "white")).toEqual({ abstained: true, reason: "unequal_instrument" });
    expect(moveQualityGrade(recorded({ kind: "cp", value: 0 }, { depth: 12 }), after, "review", "white")).toEqual({ abstained: true, reason: "unequal_instrument" });
    const inconsistent = moveQualityGrade(recorded({ kind: "mate", movesTo: -2 }), recorded({ kind: "cp", value: -900 }), "review", "white");
    expect(inconsistent).toEqual({ abstained: true, reason: "mate_score_inconsistent" });
    expect(renderMoveQualityResult(inconsistent)).toEqual([]);
  });

  it("normalizes recorded White POV and live side-to-move POV to the same learner view", () => {
    const recordedGrade = moveQualityGrade(recorded({ kind: "cp", value: -100 }), recorded({ kind: "cp", value: 100 }), "review", "black");
    const liveGrade = moveQualityGrade(live({ kind: "cp", value: 100 }, "black"), live({ kind: "cp", value: 100 }, "white"), "review", "black");
    expect(recordedGrade).toEqual(liveGrade && "abstained" in liveGrade ? liveGrade : { ...liveGrade, lane: "recorded" });
  });

  it("co-renders the class, operands, drop, threshold and convention, rejecting a word-only sentence", () => {
    const value = classify(100, -100, "review");
    expect(value).toBeDefined();
    if (value === undefined || "abstained" in value) return;
    const sentence = renderMoveQualityGrade(value);
    expect(sentence).toContain("Blunder");
    expect(sentence).toContain("+1.00 (59.1%)");
    expect(sentence).toContain("−1.00 (40.9%)");
    expect(sentence).toContain("18.2 win-points");
    expect(sentence).toContain("threshold of 15");
    expect(sentence).toContain("grade-convention@1/review");
    expect(() => assertMoveQualityGradeSentence(value, "Blunder.")).toThrow(/GRADE_RENDER_INCOMPLETE/u);
    expect(() => assertMoveQualityGradeSentence(value, sentence)).not.toThrow();
  });
});
