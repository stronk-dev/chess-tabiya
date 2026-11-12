import { describe, expect, it, vi } from "vitest";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { RECORDED_GRADE_SOURCE_AUTHORITY, readRecordedGradeSource } from "./recorded-grade-source.js";
import { recordedGradeFixture } from "./testing/recorded-grade-fixture.js";
import { renderMoveQualityGrade } from "./grade.js";
import { comparisonAssistance } from "./testing/recorded-comparison-point-fixture.js";
import { compileEvidenceConsumerExecutionV2 } from "./evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { readdirSync, readFileSync } from "node:fs";
import { revealFeedback } from "./runtime.js";
import { reviewFixtureRun } from "./testing/review-map-fixture.js";
import { recordedReviewFixtureSources } from "./testing/recorded-grade-fixture.js";
import { reviewMapProjection } from "./review-map.js";
import * as engineNodes from "./internal/recorded-engine-node.js";
import { recordedLastLevelFixture } from "./testing/recorded-last-level-fixture.js";
import { attachDelivery, evaluationDelivery } from "./testing/review-evidence-fixture.js";
import { beginRecordedEngineAttachmentCollection, advanceRecordedEngineAttachmentCollection, cancelRecordedEngineAttachmentCollection,
  recordedEngineAttachmentNode, collectRecordedEngineAttachments, collectRecordedEngineEdge, finishRecordedEngineAttachmentCollection } from "./internal/recorded-engine-attachments.js";

describe("current recorded grade source and sole factory", () => {
  it.each(["white", "black"] as const)("issues the unchanged original %s grade before later attachment nodes have been acquired", side => {
    const f = recordedLastLevelFixture(side), permission = recordedGradeFixture({ workflow: "imported" }).capture.permission;
    let run = f.run;
    for (const node of f.path) run = attachDelivery(run, node.id, evaluationDelivery(node.fen, "cp 100"));
    f.setRun(run);
    const boundary = f.boundary(), full = collectRecordedEngineAttachments({ boundary }), work = beginRecordedEngineAttachmentCollection({ boundary });
    const foreign = beginRecordedEngineAttachmentCollection({ boundary }), signal = new AbortController(), parent = f.path[0]!, child = f.path[1]!;
    const assertCurrent = () => { f.owner.assertCurrent(boundary); };
    const base = { permission, signal: signal.signal, origins: ["provider_delivery", "provider_delivery"] as const,
      before: { attachments: full, nodeId: parent.id, offline: null, pending: null },
      after: { attachments: full, nodeId: child.id, offline: null, pending: null }, edge: collectRecordedEngineEdge(full, child.id) };
    const expected = RECORDED_GRADE_SOURCE_AUTHORITY.issue(base, assertCurrent);
    try {
      for (const handle of [work, foreign]) { advanceRecordedEngineAttachmentCollection(handle); advanceRecordedEngineAttachmentCollection(handle); }
      const before = { ...base.before, attachments: recordedEngineAttachmentNode(work, parent.id) };
      const after = { ...base.after, attachments: recordedEngineAttachmentNode(work, child.id) };
      expect(() => finishRecordedEngineAttachmentCollection(work)).toThrow(/incomplete/u);
      expect(() => recordedEngineAttachmentNode(work, f.path[2]!.id)).toThrow(/not been acquired/u);
      const capture = { ...base, before, after, edge: collectRecordedEngineEdge(after.attachments, child.id) };
      const actual = RECORDED_GRADE_SOURCE_AUTHORITY.issue(capture, assertCurrent);
      expect(JSON.stringify(readRecordedGradeSource(actual).authority)).toBe(JSON.stringify(readRecordedGradeSource(expected).authority));
      const grade = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: actual });
      expect(grade).toEqual(invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: expected }));
      if (grade.kind !== "available" || grade.value.length !== 1) throw new Error("Expected the unchanged original grade");
      const original = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: expected });
      if (original.kind !== "available") throw new Error("Missing complete original grade");
      expect(evidenceValueReceipt(grade.value[0]!)).toEqual(evidenceValueReceipt(original.value[0]!));
      expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue({ ...capture, after: { ...after,
        attachments: recordedEngineAttachmentNode(foreign, child.id) } }, assertCurrent)).toThrow(/different original storage/u);
      expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue({ ...capture, before: { ...before, attachments: { ...before.attachments } } }, assertCurrent)).toThrow();
      expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue({ ...capture, before: { ...before, attachments: work as never } }, assertCurrent)).toThrow();
      signal.abort(); expect(() => readRecordedGradeSource(actual)).toThrow();
    } finally { cancelRecordedEngineAttachmentCollection(work); cancelRecordedEngineAttachmentCollection(foreign); }
  });

  it("D3934 requires an owner lifetime check without accepting its Boolean as source authority", () => {
    const f = recordedGradeFixture({ before: null, after: null });
    expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue(f.capture, undefined as never)).toThrow(/owner/u);
    expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue(f.capture, () => true)).toThrow(/owner/u);
    expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue(f.capture, () => false)).toThrow(/owner/u);
    const invalid = { ...f.capture, before: { ...f.capture.before, nodeId: "foreign-node" } };
    expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue(invalid, f.assertCurrent)).toThrow();
  });

  it("retains its validated immutable pair while still refusing changed live storage before mint", () => {
    const f = recordedGradeFixture(), nodes = vi.spyOn(engineNodes, "readRecordedEngineNode");
    try {
      const original = readRecordedGradeSource(f.source);
      expect(readRecordedGradeSource(f.source)).toBe(original);
      expect(nodes.mock.calls.length).toBe(0);
      f.replaceRun(revealFeedback(f.run, "2026-11-02T00:00:00.000Z").run);
      expect(() => invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: f.source })).toThrow(/no longer/u);
    } finally { nodes.mockRestore(); }
  });
  it("keeps the full long recorded Review population", () => {
    const run = reviewFixtureRun({ id: "long-grade-source", plies: 70 });
    const sources = recordedReviewFixtureSources(run);
    const projection = reviewMapProjection({ run, branchId: run.activeCursor.branchId, ...sources,
      story: { moments: [], rank: [] }, context: "imported_analysis", viewer: { role: "learner", session: "imported" } });
    expect(projection.rows).toHaveLength(70);
  });
  for (const black of [false, true]) for (const timing of ["post_commit", "review"] as const) {
    it.each([{ kind: "depth", requestedDepth: 12 }, { kind: "movetime", requestedMs: 100 }, { kind: "nodes", requestedNodes: 2000 }] as const)(
      `retains the genuine requested $kind budget for black=${black}/${timing}`, bound => {
        const f = recordedGradeFixture({ black, timing, budget: { bound } });
        const result = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: f.source });
        if (result.kind !== "available" || result.value[0] === undefined) throw new Error("Expected a grade over the original requested budget");
        expect(result.value[0].payload.bound).toEqual(bound);
        expect(result.value[0].payload.instrument).toMatchObject({ origin: "provider_delivery", engineVersion: "19", generation: 1 });
      });
  }
  for (const black of [false, true]) for (const timing of ["post_commit", "review"] as const) {
    it(`retains the original ordered operands and unified grade for ${black ? "Black" : "White"}/${timing}`, () => {
      const f = recordedGradeFixture({ black, timing }), source = readRecordedGradeSource(f.source);
      expect(source.mover).toBe(black ? "black" : "white");
      const consumerId = timing === "post_commit" ? "module.postcommit_nudge" : "module.review_map";
      const expected = PRIMARY_EVIDENCE_MANIFEST.bindings.filter(value => value.consumer.id === consumerId && value.consumer.version === 2)
        .map(value => `${value.projection.id}@${value.projection.version}`).sort();
      expect(f.capture.permission.execution.bindings.map(value => `${value.binding.projection.id}@${value.binding.projection.version}`).sort()).toEqual(expected);
      expect(expected).toContain("rules.structural.event.king_opposition@2");
      expect(expected).toContain("derived.activity.event.file_access_revealed@1");
      const result = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: f.source });
      if (result.kind !== "available" || result.value.length !== 1) throw new Error("Expected one admitted synthetic grade");
      const value = result.value[0]!, receipt = evidenceValueReceipt(value);
      expect(value.payload).toMatchObject({ klass: "blunder", lane: "recorded", convention: { id: "grade-convention", version: 2 } });
      expect(source.inputs.map(value => `${value.projection.id}@${value.projection.version}`))
        .toEqual(["derived.review.eval_point@1", "derived.review.eval_point@1", "run.record.edge@1"]);
      expect(receipt.sourceDigests).toEqual(source.inputs.map(input => evidenceValueReceipt(input).payloadDigest));
      expect(receipt.convention).toBeDefined();
      expect(receipt.convention!.refs.filter(ref => ref.id === "grade-convention")).toEqual([{ id: "grade-convention", version: 2 }]);
      expect(renderMoveQualityGrade(value.payload)).toContain("single move-loss convention, version 2");
    });
  }
  it("gives identical full payload and full prose in Nudge and Review, not just an equal class", () => {
    const receipts: string[] = [];
    const outputs = ([{ timing: "post_commit", workflow: "position" }, { timing: "review", workflow: "position" }, { timing: "review", workflow: "imported" }] as const).map(options => {
      const f = recordedGradeFixture(options);
      const result = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: f.source });
      if (result.kind !== "available" || result.value[0] === undefined) throw new Error("missing synthetic grade");
      receipts.push(evidenceValueReceipt(result.value[0]).inputDigest);
      return { payload: JSON.stringify(result.value[0].payload), sentence: renderMoveQualityGrade(result.value[0].payload) };
    });
    expect(outputs[0]).toEqual(outputs[1]); expect(outputs[1]).toEqual(outputs[2]);
    expect(new Set(receipts).size).toBe(3); // Equal public bytes never make the grants equivalent.
  });
  it("rejects Compare permission and a same-name complete plan from a foreign manifest before absence", () => {
    const f = recordedGradeFixture({ before: null, after: null });
    expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue({ ...f.capture, permission: { ...f.capture.permission, execution: comparisonAssistance().execution } }, f.assertCurrent)).toThrow();
    const execution = compileEvidenceConsumerExecutionV2({ ...PRIMARY_EVIDENCE_MANIFEST }, { id: "module.review_map", version: 2 });
    expect(execution.bindings.map(value => value.binding.projection)).toEqual(f.capture.permission.execution.bindings.map(value => value.binding.projection));
    expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue({ ...f.capture, permission: { ...f.capture.permission, execution } }, f.assertCurrent)).toThrow(/different manifest/u);
  });
  it.each(["post_commit", "review"] as const)("D4178 rejects copied/truncated/crossed %s plans while accepting the complete current plan", timing => {
    const f = recordedGradeFixture({ timing });
    expect(() => readRecordedGradeSource(f.source)).not.toThrow();
    for (const bindings of [f.capture.permission.execution.bindings.slice(1), [...f.capture.permission.execution.bindings].reverse(), f.capture.permission.execution.bindings]) {
      const execution = { ...f.capture.permission.execution, bindings };
      expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue({ ...f.capture, permission: { ...f.capture.permission, execution } }, f.assertCurrent)).toThrow();
    }
  });
  it("keeps missing endpoints as local absence and below-floor silence as evaluated data", () => {
    const missing = recordedGradeFixture({ before: null, after: null });
    expect(invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: missing.source }))
      .toEqual({ kind: "unavailable", reason: "missing_eval" });
    const quiet = recordedGradeFixture({ before: "cp 0", after: "cp 0" });
    expect(readRecordedGradeSource(quiet.source).state.kind).toBe("available");
    expect(invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: quiet.source })).toEqual({ kind: "available", value: [] });
  });
  it("refuses copied handles, extra operands, corrupt ceilings and a changed run before absence", () => {
    const f = recordedGradeFixture({ before: null, after: null });
    for (const source of [{}, { ...f.source }]) expect(() => readRecordedGradeSource(source as typeof f.source)).toThrow();
    expect(() => invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: f.source, mover: "white" } as never)).toThrow();
    expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue({ ...f.capture, permission: { ...f.capture.permission,
      assistance: { ...f.capture.permission.assistance!, modules: [] } } }, f.assertCurrent)).toThrow();
    f.signal.abort(); expect(() => invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: f.source })).toThrow();
    const changed = recordedGradeFixture({ before: null, after: null });
    changed.replaceRun(revealFeedback(changed.run, "2026-11-02T00:00:00.000Z").run);
    expect(() => invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: changed.source })).toThrow();
  });
  it("validates the finalized ceiling before reading private endpoint properties", () => {
    const f = recordedGradeFixture({ before: null, after: null }); let reads = 0;
    const before = { get attachments(): never { reads += 1; throw new Error("private source must not be read"); },
      nodeId: f.parent.id, offline: null, pending: null };
    expect(() => RECORDED_GRADE_SOURCE_AUTHORITY.issue({ ...f.capture, before, permission: { ...f.capture.permission,
      assistance: { ...f.capture.permission.assistance!, modules: [] } } }, f.assertCurrent)).toThrow(/digest/u);
    expect(reads).toBe(0);
  });
  it("keeps the private constructor out of barrels and restricts production issuance to the service owner", () => {
    const root = new URL("../../../", import.meta.url), found: string[] = [];
    function walk(relative: string) {
      for (const entry of readdirSync(new URL(relative, root), { withFileTypes: true })) {
        const path = `${relative}/${entry.name}`;
        if (entry.isDirectory()) { if (!["dist", "node_modules", "testing", "fixtures"].includes(entry.name)) walk(path); }
        else if (/\.(?:ts|svelte)$/u.test(path) && !/\.test\.ts$/u.test(path)) {
          const source = readFileSync(new URL(path, root), "utf8");
          if (source.includes("RECORDED_GRADE_SOURCE_AUTHORITY") || /(?:from\s*|import\s*\()["'][^"']*recorded-grade-source-authority/u.test(source)) found.push(path);
        }
      }
    }
    walk("packages/runtime/src"); walk("apps/server/src"); walk("apps/web/src");
    expect(found.sort()).toEqual(["apps/server/src/recorded-grade-sources.ts", "packages/runtime/src/recorded-grade-source-authority.ts", "packages/runtime/src/recorded-grade-source.ts"]);
    for (const barrel of ["packages/runtime/src/index.ts", "packages/runtime/src/client.ts"]) expect(readFileSync(new URL(barrel, root), "utf8")).not.toContain("recorded-grade-source");
  });
});
