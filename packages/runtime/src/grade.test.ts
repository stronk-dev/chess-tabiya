import { describe, expect, it } from "vitest";
import { evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { importedRun, play } from "./testing/review-evidence-fixture.js";

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
function assertCitedConstants(constants: Readonly<Record<string, unknown>>): void {
  expect(Object.keys(constants)).toHaveLength(12);
  for (const record of Object.values(constants)) {
    expect(record).toMatchObject({ value: expect.any(Number), source: expect.stringMatching(/^https:\/\//u), pinnedAt: "2026-08-22" });
    expect(Number.isFinite((record as { value: number }).value)).toBe(true);
  }
}
const recorded = (score: GradeEvaluation["score"], extras: GradeEvaluationExtras = {}): GradeEvaluation => ({
  lane: "recorded", engineId: "stockfish-17", score, sideToMove: "white", perspective: "white", depth: 18, ...extras,
});
const live = (score: GradeEvaluation["score"], sideToMove: GradeSide, extras: GradeEvaluationExtras = {}): GradeEvaluation => ({
  lane: "live", engineId: "stockfish-17", score, sideToMove, perspective: "side_to_move", depth: 18, ...extras,
});
const classify = (before: number, after: number, context: GradeContext) => moveQualityGrade(recorded({ kind: "cp", value: before }), recorded({ kind: "cp", value: after }), context, "white");

describe("D3860 sealed grade source pairing", () => {
  function pair(mover: GradeSide, beforeCp: number, afterCp: number) {
    const run = play(importedRun(`grade-pair-${mover}`, mover,
      `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${mover === "white" ? "w" : "b"} KQkq - 0 1`),
    [mover === "white" ? "e2e4" : "e7e5"]);
    const parent = run.nodes.find(node => node.parentId === null)!, child = run.nodes.find(node => node.parentId === parent.id)!;
    const source = (fen: string, centipawns: number) => {
      // Synthetic recorded reports, not engine performance or modern provider authority.
      const values = { fen, centipawns, perspective: "white", engineId: "synthetic", engineName: "Synthetic test",
        engineVersion: "fixture", depth: 12, requestedDepth: 12, multiPv: 1 };
      const ledger = invokeEvidenceValueRoute("sourcing.ledger.engine_eval@1", { record: {
        kind: "engine_eval", sourceId: "synthetic-report", retrievedAt: "2026-10-15T00:00:00.000Z",
        grounds: "machine_validation", anchor: { fen }, supports: [], values } });
      const reading = invokeEvidenceValueRoute("recorded.engine.eval@1", { ledger });
      if (reading.kind !== "available") throw new Error("valid synthetic ledger fixture refused");
      return [reading.value, invokeEvidenceValueRoute("live.stockfish.eval@1", {
        packet: { kind: "eval", source: "engine_validated", values } })] as const;
    };
    return { before: source(parent.fen, beforeCp), after: source(child.fen, afterCp) };
  }

  it("declares the two actual ordered occurrences for each permitted same-source alternative", () => {
    const grade = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.grade.move_quality")!;
    expect(grade.derivation).toEqual({ anyOf: [
      [{ id: "recorded.engine.eval", version: 1 }, { id: "recorded.engine.eval", version: 1 }],
      [{ id: "live.stockfish.eval", version: 1 }, { id: "live.stockfish.eval", version: 1 }],
    ] });
  });

  const cases = (["white", "black"] as const).flatMap(mover =>
    (["drill", "review", "imported_analysis"] as const).flatMap(context =>
      ([0, 1] as const).flatMap(beforeIndex => ([0, 1] as const).map(afterIndex => ({ mover, context, beforeIndex, afterIndex })))));
  it.each(cases)("pairs exact sources for $mover/$context/$beforeIndex→$afterIndex", ({ mover, context, beforeIndex, afterIndex }) => {
    const sign = mover === "white" ? 1 : -1;
    const inputs = pair(mover, sign * 200, -sign * 200);
    const before = inputs.before[beforeIndex], after = inputs.after[afterIndex];
    const result = invokeEvidenceValueRoute("derived.grade.move_quality@1", { before, after, mover, context });
    if (beforeIndex !== afterIndex) {
      expect(result).toEqual({ kind: "unavailable", reason: "unequal_instrument" });
      return;
    }
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("same-source grade unavailable");
    expect(result.value).toHaveLength(1);
    const value = result.value[0] as DeclaredEvidence<MoveQualityGrade>;
    expect(value.payload).toMatchObject({ klass: "blunder", convention: { context }, engineId: "synthetic" });
    expect(evidenceValueReceipt(value).sourceDigests).toEqual([
      evidenceValueReceipt(before).payloadDigest, evidenceValueReceipt(after).payloadDigest,
    ]);
    const members = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.grade.move_quality")!.derivation!.anyOf!;
    expect(members.some(member => member.length === 2 && member.every(ref => ref.id === before.projection.id && ref.version === before.projection.version))).toBe(true);
  });

  it("rejects mixed source origins even when arithmetic would return below-threshold silence", () => {
    const inputs = pair("white", 0, 0);
    for (const [before, after] of [[inputs.before[0], inputs.after[1]], [inputs.before[1], inputs.after[0]]] as const) {
      expect(invokeEvidenceValueRoute("derived.grade.move_quality@1", { before, after, mover: "white", context: "review" }))
        .toEqual({ kind: "unavailable", reason: "unequal_instrument" });
    }
    for (const index of [0, 1] as const) {
      expect(invokeEvidenceValueRoute("derived.grade.move_quality@1", {
        before: inputs.before[index], after: inputs.after[index], mover: "white", context: "review",
      })).toEqual({ kind: "available", value: [] });
    }
  });
});

describe("move-quality grades", () => {
  it("pins all twelve convention constants to a source and date", () => {
    assertCitedConstants(GRADE_CONVENTION.constants);
  });

  it.each(["value", "source", "pinnedAt"] as const)("D3765 citation check rejects a missing %s on every constant", field => {
    for (const [key, constant] of Object.entries(GRADE_CONVENTION.constants)) {
      const missing: Record<string, unknown> = { ...constant };
      delete missing[field];
      expect(() => assertCitedConstants({ ...GRADE_CONVENTION.constants, [key]: missing }), key).toThrow();
      const invalid = { ...constant, [field]: field === "value" ? Number.NaN : "" };
      expect(() => assertCitedConstants({ ...GRADE_CONVENTION.constants, [key]: invalid }), key).toThrow();
    }
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
