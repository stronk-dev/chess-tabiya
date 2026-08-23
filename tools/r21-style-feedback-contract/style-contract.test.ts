// DISPOSABLE research instrument — platform-alignment R21. Not production code.
import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PRESENTATION_CONTRACT, STYLE_METRICS, TWO_GATE_RULE } from "./registry.js";

const RESULTS = JSON.parse(readFileSync(new URL("../../planning/platform-alignment/player-style/results.json", import.meta.url), "utf8")) as {
  persistentFloors: Record<string, number | null>;
  vector: { dimensions: number; selfReidentification: number; archetypePass: boolean; clusterMedianAri: Record<string, number> };
};
const OUTPUT = new URL("./output.md", import.meta.url).pathname;

describe("R21 longitudinal style-feedback desk contract", () => {
  it("is set-equal to the twelve persistently retained R12 metrics and inherits every measured floor", () => {
    const retained = Object.entries(RESULTS.persistentFloors).filter((entry): entry is [string, number] => entry[1] !== null);
    expect(retained).toHaveLength(RESULTS.vector.dimensions);
    expect(STYLE_METRICS.map((row) => row.metricId).sort()).toEqual(retained.map(([id]) => id).sort());
    for (const [id, floor] of retained) {
      expect(STYLE_METRICS.find((row) => row.metricId === id)?.measuredFloorGames).toBe(floor);
    }
  });

  it("admits no production-ready metric from short-session blitz evidence", () => {
    expect(STYLE_METRICS).toHaveLength(12);
    expect(STYLE_METRICS.every((row) => row.productionGap.length > 0)).toBe(true);
    expect(new Set(STYLE_METRICS.map((row) => row.productionGap))).toEqual(new Set([
      "reference_and_runtime_identity", "denominator_projection_mismatch", "collector_and_store_extension",
    ]));
  });

  it("keeps one feature meaning but two independent consumer gates", () => {
    expect(new Set(STYLE_METRICS.map((row) => row.featureId)).size).toBeLessThan(STYLE_METRICS.length);
    expect(STYLE_METRICS.filter((row) => row.botUse === "refused_without_time_model")).toHaveLength(3);
    expect(TWO_GATE_RULE.runtimeWall).toMatch(/never reads/u);
  });

  it("requires inspectable uncertainty and refuses generated personality judgements", () => {
    expect(PRESENTATION_CONTRACT.required).toContain("95% game-bootstrap interval");
    expect(PRESENTATION_CONTRACT.required).toContain("exact contributing game/ply references");
    expect(PRESENTATION_CONTRACT.llmAuthority).toMatch(/paraphrase one sealed admitted metric card/u);
    expect(PRESENTATION_CONTRACT.refusedLabels).toContain("grandmaster twin");
    expect(RESULTS.vector.selfReidentification).toBeCloseTo(0.9722);
    expect(RESULTS.vector.archetypePass).toBe(false);
  });

  it("emits the auditable twelve-row handoff", () => {
    const gaps = new Map<string, number>();
    for (const row of STYLE_METRICS) gaps.set(row.productionGap, (gaps.get(row.productionGap) ?? 0) + 1);
    const lines = [
      "# R21 longitudinal style-feedback contract output", "",
      `R12 retained metrics: ${STYLE_METRICS.length}; production-ready: 0. Production gaps: ${[...gaps].map(([gap, count]) => `${gap} ${count}`).join("; ")}.`,
      "The measured floors are short-session high-activity blitz floors. Every metric still requires longitudinal and cross-time-control transfer before a 1.0 default.", "",
      "| metric | shared feature | floor games | denominator | production gap | bot use |", "|---|---|---:|---|---|---|",
      ...STYLE_METRICS.map((row) => `| \`${row.metricId}@1\` | \`${row.featureId}\` | ${row.measuredFloorGames} | ${row.denominator} | ${row.productionGap} | ${row.botUse} |`),
      "", "Presentation: deterministic first; show the value, interval, population, floor, window, source/reference version and exact contributors. An optional LLM may paraphrase one sealed admitted card and gains no selection, diagnosis, advice, archetype, grading or recommendation authority.",
      "", "Shared-vocabulary wall: feature identity is common; proof and state are not. Style reads learner-owned history under R12. Bot policy reads current candidate features under its controlled-trait gate and never learner history.", "",
    ];
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");
    expect(lines.join("\n")).not.toMatch(/production-ready: [1-9]/u);
  });
});
