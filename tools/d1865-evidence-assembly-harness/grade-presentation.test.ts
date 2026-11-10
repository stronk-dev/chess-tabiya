// Disposable D3767 research instrument: synthetic engine reports through existing source-owned
// grade factories and actual presentation/fit. This is not API/UI delivery or chess qualification.
import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { evidenceForConsumer } from "../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { recordedGradeFixture } from "../../packages/runtime/src/testing/recorded-grade-fixture.js";
import { presentEvidenceItems, presentedSentence, presentedGradeMeasurementReport, parsePresentationReceipt, serializePresentedEvidence } from "../../packages/runtime/src/presentation-contract.js";
import { assertMoveQualityGradeSentence, renderMoveQualityGrade, type MoveQualityGrade } from "../../packages/runtime/src/grade.js";
import { fitModulePresentation, modulePresentationBundleCost } from "../../packages/runtime/src/module-query.js";
import { compileModulePacket } from "../../packages/runtime/src/module-packets.js";
import { GRADE_PRESENTATION_CASES as cases } from "./grade-cases.js";
import { offlineGradeFixture } from "./grade-offline-fixture.js";
const rows: unknown[] = [];
const bounds = [{ kind: "depth", requestedDepth: 12 }, { kind: "movetime", requestedMs: 100 }, { kind: "nodes", requestedNodes: 2000 }] as const;
describe("D3767 complete grade alone under the unchanged Nudge presentation budget", () => {
  for (const origin of ["provider", "offline"] as const) for (const black of [false, true]) for (const bound of bounds) for (const c of cases) {
    if (origin === "offline" && bound.kind === "nodes") continue; // Current offline source has depth/time, no invented nodes report.
    it(`${origin}/${black ? "Black" : "White"} ${bound.kind}/${c.arm}/${c.klass} retains source, text, fit and strict receipt`, async () => {
      const fixture = origin === "offline" && bound.kind !== "nodes" ? await offlineGradeFixture({ black, before: c.before, after: c.after, bound })
        : recordedGradeFixture({ black, timing: "post_commit", before: c.before, after: c.after, budget: { bound } });
      try {
      const source = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: fixture.source });
      if (source.kind !== "available" || source.value.length !== 1) throw Error(`Expected original available grade: ${JSON.stringify(source)}`);
      const grade = source.value[0]!;
      expect(grade.payload).toMatchObject({ arm: c.arm, klass: c.klass, instrument: { origin: origin === "offline" ? "offline_engine" : "provider_delivery" }, bound });
      const packet = compileModulePacket({ module: "postcommit_nudge", timing: "post_commit", role: "learner", session: "workflow" in fixture ? fixture.workflow : fixture.run.sessionKind, evidence: [grade] });
      if (packet.kind !== "packet") throw Error("Original current Nudge rejected grade-only measurement");
      expect(packet.facts.map(fact => fact.evidence)).toEqual([grade]);
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 2 }, [grade]));
      const sentence = presentedSentence(items[0]!);
      expect(items[0]!.component.id === "fact_statement" && items[0]!.component.operand.rendererId).toBe("play.move_quality_summary@1");
      const report = presentedGradeMeasurementReport(items[0]!);
      if (report?.kind !== "available") throw Error("Ordinary complete source must have a whole measurement report");
      const full = renderMoveQualityGrade(grade.payload as MoveQualityGrade);
      expect(report.sentence).toBe(full);
      expect(() => assertMoveQualityGradeSentence(grade.payload as MoveQualityGrade, sentence)).toThrow(/GRADE_RENDER_INCOMPLETE/);
      const reviewItems = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 2 }, [grade]));
      expect(presentedSentence(reviewItems[0]!)).toBe(full);
      expect(presentedGradeMeasurementReport(reviewItems[0]!)).toBeNull();
      expect(() => presentedGradeMeasurementReport({ ...items[0]! })).toThrow(/PRESENTATION_UNSEALED/);
      expect(parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))))).toEqual(items);
      const cost = modulePresentationBundleCost(items), fit = fitModulePresentation("postcommit_nudge", items);
      expect(cost.facts).toBe(1); expect(cost.marks).toBe(0); expect(cost.arrows).toBe(0);
      expect(cost.words).toBeLessThanOrEqual(50);
      expect([...fit.budget.kept, ...fit.budget.dropped.map(row => row.fact)]).toHaveLength(1);
      expect(fit.items).toEqual(cost.words <= 50 ? items : []);
      expect(fit.budget.dropped.map(row => row.exceeded)).toEqual(cost.words <= 50 ? [] : [["words"]]);
      rows.push({ mover: black ? "black" : "white", arm: c.arm, klass: c.klass, source: origin === "offline" ? "synthetic_pinned_pack_report" : "synthetic_provider_delivery", requested: bound, cost, displayed: fit.items.length > 0, dropped: fit.budget.dropped.map(row => row.exceeded), sentence, report });
      } finally { if ("storage" in fixture) fixture.storage.close(); }
    });
  }
  it("writes the ignored compact measurements without changing product policy", () => {
    expect(rows).toHaveLength(90);
    mkdirSync(new URL("../../.cache/", import.meta.url), { recursive: true });
    writeFileSync(new URL("../../.cache/d3767-grade-alone.json", import.meta.url), JSON.stringify({ instrument: "D3767 synthetic source-owned grade-alone presentation", qualification: "none", apiUiProof: false, rows }, null, 2) + "\n");
  });
});
