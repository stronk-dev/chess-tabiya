import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { branchPath } from "./branch-path.js";
import { GRADE_CONVENTION, assertMoveQualityGradeSentence, moveQualityGrade, winPercentFromCp } from "./grade.js";
import { recordedSemanticPath } from "./recorded-semantic-path.js";
import { REVIEW_MOMENT_BUDGET, reviewMapProjection, selectReviewMoments, type ReviewMapProjection } from "./review-map.js";
import { REVIEW_MAP_TEMPLATES, reviewText } from "./review-map-templates.js";
import { storyMoments, type StoryMoment } from "./story.js";
import { fixtureCentipawns, reviewFixtureRun } from "./testing/review-map-fixture.js";
import { BANNED_JUDGEMENTS, judgementWordsOutsideGrounding, ungroundedResidue } from "./voice.js";
import type { DrillRun } from "./types.js";

const ROOT = new URL("../../../", import.meta.url);

function projectionOf(run: DrillRun, context: "review" | "imported_analysis" = "imported_analysis", withSemantic = false): ReviewMapProjection {
  const branchId = run.activeCursor.branchId;
  const story = storyMoments(run, branchId, context === "imported_analysis" ? { recordedResult: "1-0" } : {});
  return reviewMapProjection({ run, branchId, story, context, ...(withSemantic ? { semanticPath: recordedSemanticPath(run, branchId) } : {}) });
}

/** Every string the projection would put on screen. */
function surfaceText(projection: ReviewMapProjection): readonly string[] {
  return [
    ...projection.rows.flatMap((row) => [row.label, ...(row.grade === undefined ? [] : [row.grade.sentence]), ...row.facts]),
    ...projection.moments.flatMap((moment) => [moment.heading, moment.moveLabel, ...moment.sentences, moment.sourcesSentence]),
    projection.momentsSentence, projection.accuracy.white.sentence, projection.accuracy.black.sentence,
    projection.coverage.sentence, projection.footer.sentence,
  ];
}

function files(directory: URL): string[] {
  const out: string[] = [];
  const walk = (path: string): void => {
    for (const entry of readdirSync(path)) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      const full = join(path, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(?:ts|svelte|mjs|js|json)$/u.test(entry)) out.push(full);
    }
  };
  walk(directory.pathname);
  return out;
}

describe("review map projection (rfc/review-map.md)", () => {
  const run = reviewFixtureRun();
  const path = branchPath(run, run.activeCursor.branchId);
  const projection = projectionOf(run, "imported_analysis", true);

  it("[criterion 1] lists every ply of the mainline with SAN, ply and side — no cap, slice or moment filter", () => {
    expect(path.length - 1).toBeGreaterThan(40);
    expect(projection.rows.map((row) => row.nodeId)).toEqual(path.slice(1).map((node) => node.id));
    expect(projection.rows.map((row) => row.ply)).toEqual(path.slice(1).map((node) => node.ply));
    expect(projection.rows.map((row) => row.san)).toEqual(path.slice(1).map((node) => node.moveSan));
    expect(projection.rows.map((row) => row.side)).toEqual(path.slice(1).map((node) => node.ply % 2 === 1 ? "white" : "black"));
    expect(projection.rows.length).toBeGreaterThan(8 * 4);
  });

  it("[criterion 2] emits exactly the grades an independent Win%-drop computation says cross the report ladder; most rows carry none", () => {
    const threshold = GRADE_CONVENTION.constants.reportInaccuracy.value;
    let expected = 0;
    for (let index = 1; index < path.length; index += 1) {
      const sign = index % 2 === 1 ? 1 : -1; // odd ply = White moved
      const drop = winPercentFromCp(fixtureCentipawns(index - 1) * sign) - winPercentFromCp(fixtureCentipawns(index) * sign);
      if (drop >= threshold) expected += 1;
    }
    const graded = projection.rows.filter((row) => row.grade !== undefined);
    expect(expected).toBeGreaterThan(0);
    expect(graded.length).toBe(expected);
    expect(graded.length).toBeLessThan(projection.rows.length / 2);
    expect(new Set(graded.map((row) => row.grade!.klass))).toEqual(new Set(graded.map((row) => row.grade!.klass).filter((klass) => ["inaccuracy", "mistake", "blunder"].includes(klass))));
    expect(JSON.stringify(projection)).not.toMatch(/"klass":"(?:ok|good|best|excellent|great|brilliant)"/u);
  });

  it("[criterion 3] renders every grade word only inside its full operand sentence, and a word-only rendering is red", () => {
    const graded = projection.rows.filter((row) => row.grade !== undefined);
    for (const row of graded) {
      const sentence = row.grade!.sentence;
      expect(sentence).toMatch(/moved [+−]\d+\.\d{2} \(\d+\.\d%\) → [+−]\d+\.\d{2} \(\d+\.\d%\)/u);
      expect(sentence).toMatch(/a drop of \d+\.\d win-points against a threshold of \d+(?:\.\d+)? \(grade-convention@1\/imported_analysis\)\.$/u);
      expect(row.facts[0]).toBe(sentence);
      const word = sentence.split(" ")[0]!;
      // F-COR-1 on this surface: printing the word alone launders a convention as a fact.
      expect(judgementWordsOutsideGrounding([sentence], word)).toEqual([word.toLowerCase()]);
      expect(judgementWordsOutsideGrounding([sentence], sentence)).toEqual([]);
    }
    expect(graded.length).toBeGreaterThan(0);
    const evaluation = (value: number, sideToMove: "white" | "black") => ({ engineId: "sf", score: { kind: "cp" as const, value }, sideToMove, lane: "recorded" as const, perspective: "white" as const, requestedMovetimeMs: 100 });
    const grade = moveQualityGrade(evaluation(100, "white"), evaluation(-100, "black"), "imported_analysis", "white");
    if (grade === undefined || "abstained" in grade) throw new Error("fixture must grade");
    expect(() => assertMoveQualityGradeSentence(grade, "Mistake")).toThrow(/GRADE_RENDER_INCOMPLETE/u);
  });

  it("[criterion 6] renders accuracy only at full coverage, with the side's decision denominator stated", () => {
    expect(projection.coverage).toMatchObject({ evaluated: path.length, positions: path.length });
    const white = projection.accuracy.white;
    expect(white.kind).toBe("rendered");
    if (white.kind !== "rendered") throw new Error("unreachable");
    expect(white.decisions).toBe(Math.ceil((path.length - 1) / 2));
    expect(white.sentence).toContain(`across all ${white.decisions} of White's evaluated decisions`);
    expect(white.sentence).toContain("grade-convention@1");
    expect(white.sentence).toContain("not comparable to another site's accuracy figure");
    // Independent recomputation of 100 − mean(max(0, drop)).
    const drops: number[] = [];
    for (let index = 1; index < path.length; index += 2) drops.push(Math.max(0, winPercentFromCp(fixtureCentipawns(index - 1)) - winPercentFromCp(fixtureCentipawns(index))));
    expect(white.value).toBeCloseTo(100 - drops.reduce((sum, drop) => sum + drop, 0) / drops.length, 1);
    expect(white.value).toBeLessThanOrEqual(100);

    // A native middlegame run whose recorded evaluations stop after the opening: abstain, state the fraction.
    const native = reviewFixtureRun({ id: "native-partial", kind: "position", evaluated: (index) => index <= 12 });
    const partial = projectionOf(native, "review");
    for (const side of ["white", "black"] as const) {
      const accuracy = partial.accuracy[side];
      expect(accuracy.kind).toBe("abstained");
      expect("value" in accuracy).toBe(false);
      expect(accuracy.evaluated).toBe(6);
      expect(accuracy.sentence).toContain(`${accuracy.evaluated} of ${accuracy.decisions} of ${side === "white" ? "White" : "Black"}'s decisions`);
    }
    expect(partial.coverage.sentence).toBe(`Evaluation coverage: 13 of ${branchPath(native, native.activeCursor.branchId).length} positions on this line carry a recorded engine evaluation.`);
  });

  it("[criterion 7] introduces no second logistic and no second coefficient", () => {
    const needle = ["0.0036", "8208"].join("");
    const hits = ["apps/", "packages/", "tools/", "tests/"].flatMap((tree) => files(new URL(tree, ROOT)))
      .filter((file) => readFileSync(file, "utf8").includes(needle))
      .map((file) => file.slice(new URL(".", ROOT).pathname.length));
    expect(hits).toEqual(["packages/runtime/src/grade.ts"]);
    for (const file of ["packages/runtime/src/review-map.ts", "packages/runtime/src/grade-reading.ts"]) {
      const source = readFileSync(new URL(file, ROOT), "utf8");
      expect(source).not.toMatch(/Math\.exp|1\s*\+\s*Math/u);
    }
    expect(readFileSync(new URL("packages/runtime/src/grade-reading.ts", ROOT), "utf8")).toContain("winPercentFromCp(");
    expect(readFileSync(new URL("packages/runtime/src/review-map.ts", ROOT), "utf8")).toContain("moverWinPercent(");
  });

  it("keeps the shipped grader's only production caller the derived.grade.move_quality@1 producer", () => {
    const callers = files(new URL("packages/", ROOT)).concat(files(new URL("apps/", ROOT)))
      .filter((file) => !/\.test\.ts$|\/testing\//u.test(file) && !file.endsWith("/grade.ts"))
      .filter((file) => /\bmoveQualityGrade\s*\(/u.test(readFileSync(file, "utf8")))
      .map((file) => file.slice(new URL(".", ROOT).pathname.length));
    expect(callers).toEqual(["packages/runtime/src/evidence-factories.ts"]);
  });

  it("[criterion 11] renders abstention as sentences: zero moments, missing evaluations, no decisions", () => {
    const bare = reviewFixtureRun({ id: "bare", kind: "position", plies: 6, evaluated: () => false });
    const empty = reviewMapProjection({ run: bare, branchId: bare.activeCursor.branchId, story: { moments: [], rank: [] }, context: "review" });
    expect(empty.moments).toEqual([]);
    expect(empty.momentsSentence).toBe(reviewText("moments.none"));
    expect(empty.coverage.evaluated).toBe(0);
    for (const row of empty.rows) {
      expect(row.facts).toContain(reviewText("evidence.eval.missing"));
      expect(row.facts).toContain(reviewText("evidence.grade.abstained", { reason: reviewText("grade.abstention.missing_eval") }));
      expect(row.facts).toContain(reviewText("evidence.packet.abstained"));
      expect(row.facts).toContain(reviewText("evidence.relation.absent"));
    }
    expect(empty.accuracy.white.sentence).toContain("no accuracy figure");
    const one = reviewFixtureRun({ id: "one-ply", kind: "position", plies: 1 });
    expect(projectionOf(one, "review").accuracy.black).toMatchObject({ kind: "no_decisions", sentence: "Black: no accuracy figure, because Black made no move on this line." });
    for (const text of surfaceText(empty)) expect(text.trim()).not.toBe("");
  });

  it("[criterion 12] carries no move recommendation, principal variation or praise in the ordinary map", () => {
    const withBest = reviewFixtureRun({ id: "leak-probe", extraValues: { bestMoveUci: "a2a4", pv: ["a2a4", "a7a5"] } });
    const leaked = projectionOf(withBest, "imported_analysis", true);
    const serialized = JSON.stringify(leaked);
    expect(serialized).not.toMatch(/bestMove|"pv"|principal|bestline|a2a4|\bbest\b|should/iu);
    for (const praise of ["brilliant", "excellent", "great", "good move", "best move", "perfect"]) expect(serialized.toLowerCase()).not.toContain(praise);
  });

  it("[D1409] a judgement word on the surface appears only inside the exact sentence that grounds it", () => {
    const grounding = [
      ...projection.rows.flatMap((row) => row.grade === undefined ? [] : [row.grade.sentence]),
      ...storyMoments(run, run.activeCursor.branchId, { recordedResult: "1-0" }).moments.flatMap((moment) => moment.sentences),
    ];
    const surface = surfaceText(projection).join("\n");
    expect(judgementWordsOutsideGrounding(grounding, surface)).toEqual([]);
    // A caption naming the closed class would free every class word — the escalation vector [[D1418]].
    expect(judgementWordsOutsideGrounding(grounding, `${surface}\nClasses: inaccuracy, mistake, blunder.`)).toEqual(["blunder", "inaccuracy", "mistake"]);
    expect(ungroundedResidue(["A mistake here."], "A mistake here.").trim()).toBe("");
  });

  it("[criterion 9 / D1409] no registered template carries a judgement word", () => {
    for (const [id, template] of Object.entries(REVIEW_MAP_TEMPLATES)) {
      expect(judgementWordsOutsideGrounding([], template), id).toEqual([]);
    }
    expect(BANNED_JUDGEMENTS.length).toBeGreaterThan(20);
    expect(() => reviewText("moves.row.white", { number: 1 })).toThrow(/missing operand san/u);
    expect(() => reviewText("moves.title", { extra: 1 })).toThrow(/does not take operand/u);
    expect(reviewText("header.title.imported", { white: "{black}", black: "B" })).toBe("{black} – B");
  });

  it("uses recorded-semantic-path events in the per-move evidence panel and abstains on the draft packet", () => {
    const semantic = recordedSemanticPath(run, run.activeCursor.branchId);
    expect(semantic.kind).toBe("available");
    if (semantic.kind !== "available") throw new Error("unreachable");
    expect(semantic.events.length).toBeGreaterThan(0);
    const first = semantic.events[0]!;
    const row = projection.rows.find((candidate) => candidate.nodeId === first.anchor.nodeId)!;
    expect(row.facts.some((fact) => fact.includes(`${first.projection.id}@${first.projection.version}`))).toBe(true);
    expect(projection.rows.every((candidate) => candidate.facts.includes(reviewText("evidence.packet.abstained")))).toBe(true);
    expect(projection.footer.labels).toEqual(expect.arrayContaining(["Recorded game", "Recorded engine analysis"]));
  });
});

describe("the whole-game moment selector (§5)", () => {
  const moment = (nodeId: string, ply: number, phase: StoryMoment["phase"], sentences: readonly string[] = ["A recorded fact."]): StoryMoment => ({
    nodeId, entryNodeId: nodeId, ply, san: null, fen: "8/8/8/8/8/8/8/K6k w - - 0 1", kinds: ["eval_pivot"], sentences, evidence: [], phase,
  });

  it("keeps at most one moment per phase, in rank order, then restores chronology, with a declared budget", () => {
    const moments = [moment("o1", 3, "opening"), moment("o2", 5, "opening"), moment("m1", 20, "middlegame"), moment("e1", 50, "endgame"), moment("u1", 60, "unclear"), moment("silent", 7, "middlegame", [])];
    const selection = selectReviewMoments({ moments, rank: ["silent", "e1", "o2", "m1", "o1", "u1"] });
    expect(selection.moments.map((item) => item.nodeId)).toEqual(["o2", "m1", "e1"]);
    expect(selection.moments.length).toBeLessThanOrEqual(REVIEW_MOMENT_BUDGET);
    expect(selection.considered).toBe(5);
    expect(selectReviewMoments({ moments: [], rank: [] })).toEqual({ moments: [], considered: 0 });
  });

  it("[criterion 1 guard] never lets the moment budget reduce the move list", () => {
    const run = reviewFixtureRun({ id: "budget" });
    const projection = projectionOf(run);
    expect(projection.moments.length).toBeLessThanOrEqual(3);
    expect(projection.rows.length).toBe(branchPath(run, run.activeCursor.branchId).length - 1);
    expect(projection.rows.filter((row) => row.moment).map((row) => row.nodeId)).toEqual(projection.moments.map((item) => item.nodeId));
  });
});
