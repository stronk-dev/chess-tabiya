// rfc/module-registration.md §4.5 and rfc/move-quality-grades.md D1: the two production module
// consumers route derived.grade.move_quality@1 through compileModulePacket.
import { describe, expect, it } from "vitest";

import { branchPath } from "./branch-path.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { renderMoveQualityGrade, type MoveQualityGrade } from "./grade.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { compileModulePacket } from "./module-packets.js";
import { ArrayReductionQualityRecorder } from "./module-reducers.js";
import { POSTCOMMIT_NUDGE_TEMPLATES, postcommitNudgePacket } from "./postcommit-nudge.js";
import { reviewMapProjection } from "./review-map.js";
import { reviewText } from "./review-map-templates.js";
import { storyMomentsForRun } from "./story.js";
import { reviewFixtureRun } from "./testing/review-map-fixture.js";
import type { DrillRun, EvidencePayload } from "./types.js";

const LEARNER = Object.freeze({ role: "learner" as const, session: "position" });

function evalPacket(run: DrillRun, nodeId: string): EvidencePayload {
  const event = [...run.events].reverse().find((candidate) => candidate.type === "evidence.attached" && candidate.data.nodeId === nodeId);
  if (event?.type !== "evidence.attached") throw new Error("fixture node lacks an evaluation");
  return event.data.payload;
}

/** A sealed grade for the White move ending at path index `index`, minted by the production factory. */
function gradeAt(run: DrillRun, index: number): DeclaredEvidence<MoveQualityGrade> {
  const path = branchPath(run, run.activeCursor.branchId);
  const graded = invokeEvidenceValueRoute("derived.grade.move_quality@1", {
    before: invokeEvidenceValueRoute("live.stockfish.eval@1", { packet: evalPacket(run, path[index - 1]!.id) }),
    after: invokeEvidenceValueRoute("live.stockfish.eval@1", { packet: evalPacket(run, path[index]!.id) }),
    mover: "white", context: "drill",
  });
  if (graded.kind !== "available" || graded.value.length !== 1) throw new Error(`fixture index ${index} did not grade`);
  return graded.value[0] as DeclaredEvidence<MoveQualityGrade>;
}

describe("the grade reaches exactly its two module consumers", () => {
  const run = reviewFixtureRun({ id: "nudge-grade", kind: "position", plies: 12 });
  const grade = gradeAt(run, 3);

  it("[move-quality-grades D1] admits the grade to Post-commit Nudge and Review Map", () => {
    const nudge = compileModulePacket({ module: "postcommit_nudge", timing: "post_commit", ...LEARNER, evidence: [grade] });
    expect(nudge.kind === "packet" && nudge.facts.map((fact) => fact.evidence)).toEqual([grade]);
    const review = compileModulePacket({ module: "review_map", timing: "review", role: "spectator", session: "imported", evidence: [grade], mode: "admit" });
    expect(review.kind === "packet" && review.facts.map((fact) => fact.evidence)).toEqual([grade]);
  });

  it("refuses the grade everywhere the contracts do not allow it", () => {
    // Threat-only and theory-only modules have no binding for it: the exact consumer view drops it.
    for (const module of ["blunder_prevention", "threat_radar"] as const) {
      const timing = module === "blunder_prevention" ? "at_commit" as const : "pre_commit" as const;
      const packet = compileModulePacket({ module, timing, ...LEARNER, evidence: [grade] });
      expect(packet.kind === "packet" && [packet.offered, packet.facts.length]).toEqual([0, 0]);
    }
    const theory = compileModulePacket({ module: "structure_nudge", timing: "post_commit", ...LEARNER, evidence: [grade] });
    expect(theory.kind === "packet" && theory.facts).toEqual([]);
    // Ceilings: a spectator at post-commit, a Match session, the wrong timing, a blocked module.
    expect(compileModulePacket({ module: "postcommit_nudge", timing: "post_commit", role: "spectator", session: "position", evidence: [grade] })).toMatchObject({ kind: "refused", reason: "role_outside_ceiling" });
    expect(compileModulePacket({ module: "postcommit_nudge", timing: "post_commit", role: "learner", session: "match", evidence: [grade] })).toMatchObject({ kind: "refused", reason: "session_outside_ceiling" });
    expect(compileModulePacket({ module: "postcommit_nudge", timing: "review", ...LEARNER, evidence: [grade] })).toMatchObject({ kind: "refused", reason: "timing_outside_module" });
    expect(compileModulePacket({ module: "guided_hint", timing: "checkpoint", ...LEARNER, evidence: [grade] })).toMatchObject({ kind: "refused", reason: "module_blocked" });
    expect(compileModulePacket({ module: "rules_floor", timing: "pre_commit", ...LEARNER, evidence: [grade] })).toMatchObject({ kind: "refused", reason: "module_has_no_evidence" });
  });
});

describe("Post-commit Nudge — the post_commit production operation", () => {
  const run = reviewFixtureRun({ id: "nudge", kind: "position", plies: 12 });
  const path = branchPath(run, run.activeCursor.branchId);

  it("packets one committed learner move: at most two admitted facts, each a grounded sentence", () => {
    const recorder = new ArrayReductionQualityRecorder();
    const packet = postcommitNudgePacket({ run, nodeId: path[3]!.id, ...LEARNER, recorder });
    expect(packet.kind).toBe("packet");
    if (packet.kind !== "packet") return;
    expect(packet.facts.length).toBeGreaterThan(0);
    expect(packet.facts.length).toBeLessThanOrEqual(2);
    expect(packet.receipt.admitted).toBeGreaterThanOrEqual(packet.facts.length);
    expect([packet.headline, packet.closing]).toEqual([POSTCOMMIT_NUDGE_TEMPLATES.headline, POSTCOMMIT_NUDGE_TEMPLATES.closing]);
    const gradeSentence = renderMoveQualityGrade(gradeAt(run, 3).payload);
    for (const fact of packet.facts) {
      if (fact.projection === "derived.grade.move_quality@1") expect(fact.sentence).toBe(gradeSentence);
      else expect(fact.sentence).toMatch(/^Recorded from this move: [a-z ]+ \([a-z_.]+@1; [A-Za-z -]+\)\.$/u);
    }
    // Overflow is loud: the fact backstop emits exactly one reduction_quality@1 observation.
    if (packet.receipt.afterReducers > 2) {
      expect(recorder.observations).toHaveLength(1);
      expect(recorder.observations[0]).toMatchObject({ moduleId: "postcommit_nudge", backstop: 2, dropped: packet.receipt.afterReducers - 2 });
    } else {
      expect(recorder.observations).toEqual([]);
    }
    // Novelty honestly abstains until the D1164 identity closure lands, rather than faking cross-node matches.
    expect(packet.receipt.noveltyAbstained).toBe(true);
  });

  it("admits the grade as a module fact on a move that crosses a report threshold", () => {
    const packet = compileModulePacket({ module: "postcommit_nudge", timing: "post_commit", ...LEARNER, evidence: [gradeAt(run, 3)] });
    expect(packet.kind === "packet" && packet.admitted).toBe(1);
  });

  it("is silent on an unknown or non-learner node and refuses outside its ceilings", () => {
    expect(postcommitNudgePacket({ run, nodeId: path[2]!.id, ...LEARNER })).toMatchObject({ kind: "refused", reason: "not_a_learner_move" });
    expect(postcommitNudgePacket({ run, nodeId: path[0]!.id, ...LEARNER })).toMatchObject({ kind: "refused", reason: "not_a_learner_move" });
    expect(postcommitNudgePacket({ run, nodeId: "missing", ...LEARNER })).toMatchObject({ kind: "refused", reason: "unknown_node" });
    expect(postcommitNudgePacket({ run, nodeId: path[3]!.id, role: "participant", session: "position" })).toMatchObject({ kind: "refused", reason: "role_outside_ceiling" });
    expect(postcommitNudgePacket({ run, nodeId: path[3]!.id, role: "learner", session: "match" })).toMatchObject({ kind: "refused", reason: "session_outside_ceiling" });
  });

  it("offers no grade without both recorded evaluations, and never an all-clear", () => {
    const bare = reviewFixtureRun({ id: "nudge-bare", kind: "position", plies: 6, evaluated: () => false });
    const barePath = branchPath(bare, bare.activeCursor.branchId);
    const packet = postcommitNudgePacket({ run: bare, nodeId: barePath[1]!.id, ...LEARNER });
    expect(packet.kind === "packet" && packet.facts.every((fact) => fact.projection !== "derived.grade.move_quality@1")).toBe(true);
    if (packet.kind === "packet" && packet.facts.length === 0) expect([packet.headline, packet.closing]).toEqual([null, null]);
  });
});

describe("Review Map — module.review_map@1 admits everything it shows", () => {
  const run = reviewFixtureRun({ id: "review-admission", plies: 20 });
  const branchId = run.activeCursor.branchId;
  const story = storyMomentsForRun(run, branchId, { recordedResult: "1-0" });

  it("renders grades for every Review Map role and withholds them where the context ceiling refuses the module", () => {
    for (const role of ["learner", "host", "participant", "spectator"] as const) {
      const projection = reviewMapProjection({ run, branchId, story, context: "imported_analysis", viewer: { role, session: "imported" } });
      expect(projection.rows.some((row) => row.grade !== undefined)).toBe(true);
    }
    const refused = reviewMapProjection({ run, branchId, story, context: "imported_analysis", viewer: { role: "learner", session: "match" } });
    expect(refused.rows.every((row) => row.grade === undefined)).toBe(true);
    const sentence = reviewText("evidence.module.withheld", { reason: reviewText("module.refusal.session_outside_ceiling") });
    expect(refused.rows.every((row) => row.facts.includes(sentence))).toBe(true);
    // An operator is not a Review Map role (§1.2): the module refuses rather than rendering.
    // The eval graph draws recorded evaluations, so it is gated by the same module.
    expect(refused.evalGraph.points.every((point) => point.kind === "missing")).toBe(true);
    expect(refused.evalGraph.caption).toBe(reviewText("graph.module.withheld", { reason: reviewText("module.refusal.session_outside_ceiling") }));
    const operator = reviewMapProjection({ run, branchId, story, context: "imported_analysis", viewer: { role: "operator", session: "imported" } });
    expect(operator.rows.every((row) => row.grade === undefined && row.facts.includes(reviewText("evidence.module.withheld", { reason: reviewText("module.refusal.role_outside_ceiling") })))).toBe(true);
  });
});
