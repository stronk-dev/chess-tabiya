import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compileEvidenceConsumerExecutionV2 } from "./evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { createRecordedComparisonSource } from "./recorded-comparison.js";
import { RECORDED_COMPARISON_POINT_AUTHORITY, readRecordedComparisonPointSource } from "./recorded-comparison-point.js";
import { comparisonAssistance, comparisonSourcesForRun, recordedComparisonPointFixture as fixture } from "./testing/recorded-comparison-point-fixture.js";
import { recordedInspectorRun } from "./testing/recorded-inspector-fixture.js";
import { attachDelivery, evaluationDelivery } from "./testing/review-evidence-fixture.js";
import { fork } from "./runtime.js";

const route = "derived.compare.engine_trajectory@2";
describe("nominal exact comparison engine points", () => {
  for (const black of [false, true]) for (const bound of [{ kind: "depth", requestedDepth: 12 }, { kind: "movetime", requestedMs: 100 }, { kind: "nodes", requestedNodes: 2048 }] as const) {
    it(`retains original modern White score and requested ${bound.kind}, black=${black}`, () => {
      const f = fixture(black, "cp 25", { bound }), source = readRecordedComparisonPointSource(f.source);
      const result = invokeEvidenceValueRoute(route, { comparisonPoint: f.source });
      expect(result.kind).toBe("available");
      if (result.kind !== "available") throw new Error("Expected actual point");
      expect(result.value.payload).toEqual({ nodeId: f.capture.nodeId, plyOffset: 2,
        whiteScore: { kind: "centipawns", value: black ? -25 : 25 }, engineId: "stockfish-analysis",
        instrument: { origin: "provider_delivery", engineVersion: "19", generation: 1 }, bound });
      expect(evidenceValueReceipt(result.value).sourceDigests).toEqual(source.inputs.map(input => evidenceValueReceipt(input).payloadDigest));
      expect(source.inputs.map(input => `${input.projection.id}@${input.projection.version}`)).toEqual(["derived.review.eval_point@1", "run.record.position@1"]);
    });
  }
  it.each(["mate 3", "mate -3"])("keeps a typed mate, never centipawns: %s", score => {
    const f = fixture(false, score), payload = readRecordedComparisonPointSource(f.source).payload!;
    expect(payload.whiteScore).toEqual({ kind: "mate", side: score === "mate 3" ? "white" : "black", distance: 3, unit: "moves" });
  });
  it("refuses a forged handle, crossed original comparison, primary column and truncated tip", () => {
    const f = fixture();
    for (const comparisonPoint of [{}, { ...f.source }]) {
      // @ts-expect-error deliberately unbranded source
      expect(() => invokeEvidenceValueRoute(route, { comparisonPoint })).toThrow();
    }
    expect(() => RECORDED_COMPARISON_POINT_AUTHORITY.issue({ ...f.capture, comparison: { ...f.comparison } })).toThrow();
    expect(() => RECORDED_COMPARISON_POINT_AUTHORITY.issue({ ...f.capture, branchId: f.main })).toThrow();
    const comparison = createRecordedComparisonSource({ run: f.run, columns: [f.columns[0], { branchId: f.peer, throughNodeId: f.shared.id }] });
    expect(() => RECORDED_COMPARISON_POINT_AUTHORITY.issue({ ...f.capture, comparison })).toThrow();
    const extra = { comparisonPoint: f.source, score: 99 };
    expect(() => invokeEvidenceValueRoute(route, extra)).toThrow();
  });
  it("D3896 refuses a genuine same-name/eight-binding plan from a foreign manifest", () => {
    const f = fixture();
    const execution = compileEvidenceConsumerExecutionV2({ ...PRIMARY_EVIDENCE_MANIFEST }, { id: "module.compare_coach", version: 2 });
    expect(execution.bindings).toHaveLength(8);
    expect(() => RECORDED_COMPARISON_POINT_AUTHORITY.issue({ ...f.capture, permission: { ...f.capture.permission, execution } })).toThrow(/different manifest/u);
    expect(() => RECORDED_COMPARISON_POINT_AUTHORITY.issue(f.capture)).not.toThrow();
  });
  it("binds cancellation, current role and assistance before a missing-point shortcut", () => {
    const f = fixture(), missing = { ...f.capture, nodeId: f.shared.id };
    expect(readRecordedComparisonPointSource(RECORDED_COMPARISON_POINT_AUTHORITY.issue(missing))).toMatchObject({ payload: null, unavailable: "missing_eval" });
    expect(() => RECORDED_COMPARISON_POINT_AUTHORITY.issue({ ...missing, permission: { ...missing.permission, role: "author" } })).toThrow();
    expect(() => RECORDED_COMPARISON_POINT_AUTHORITY.issue({ ...missing, permission: { ...missing.permission, assistance: { ...missing.permission.assistance, modules: [] } } })).toThrow();
    f.controller.abort(); expect(() => invokeEvidenceValueRoute(route, { comparisonPoint: f.source })).toThrow();
  });
  it("D3897 owns permission envelopes without freezing caller objects", () => {
    const f = fixture(), capture = f.capture, permission = capture.permission, principal = permission.principal;
    const before = readRecordedComparisonPointSource(f.source);
    expect(Object.isFrozen(capture)).toBe(false); expect(Object.isFrozen(permission)).toBe(false); expect(Object.isFrozen(principal)).toBe(false);
    (principal as { handle: string }).handle = "changed";
    expect(readRecordedComparisonPointSource(f.source)).toBe(before);
    expect(before.authority.permission.principal.handle).toBe("__legacy");
  });
  it("retains a real root/fork point at zero edges without fabricating an incoming move", () => {
    let run = recordedInspectorRun(); const root = run.nodes[0]!;
    run = fork(run, root.id, { at: root.createdAt }).run;
    run = attachDelivery(run, root.id, evaluationDelivery(root.fen, "cp 25"));
    const sources = comparisonSourcesForRun(run, comparisonAssistance().assistance, root.id, "review");
    expect(sources.points).toHaveLength(1);
    expect(readRecordedComparisonPointSource(sources.points[0]!).payload).toMatchObject({ nodeId: root.id, plyOffset: 0, whiteScore: { kind: "centipawns", value: 25 } });
    expect(run.nodes).toHaveLength(1);
  });
  it("keeps the constructor out of public barrels and restricts production imports to the service source owner", () => {
    const root = new URL("../../../", import.meta.url), found: string[] = [];
    function walk(relative: string) {
      for (const entry of readdirSync(new URL(relative, root), { withFileTypes: true })) {
        const path = `${relative}/${entry.name}`;
        if (entry.isDirectory()) { if (!["dist", "node_modules", "testing", "fixtures"].includes(entry.name)) walk(path); }
        else if (/\.(?:ts|svelte)$/u.test(path) && !/\.test\.ts$/u.test(path)) {
          const source = readFileSync(new URL(path, root), "utf8");
          if (source.includes("RECORDED_COMPARISON_POINT_AUTHORITY") || /(?:from\s*|import\s*\()["'][^"']*recorded-comparison-point-authority/u.test(source)) found.push(path);
        }
      }
    }
    walk("packages/runtime/src"); walk("apps/server/src"); walk("apps/web/src");
    expect(found.sort()).toEqual(["apps/server/src/recorded-comparison-points.ts", "packages/runtime/src/recorded-comparison-point-authority.ts", "packages/runtime/src/recorded-comparison-point.ts"]);
    for (const barrel of ["packages/runtime/src/index.ts", "packages/runtime/src/client.ts"]) expect(readFileSync(new URL(barrel, root), "utf8")).not.toContain("recorded-comparison-point");
  });
});
