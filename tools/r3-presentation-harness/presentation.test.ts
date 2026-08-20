// DISPOSABLE research harness — platform-alignment R3. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

import { parseFen } from "chessops/fen";
import { makeSquare } from "chessops/util";
import { describe, expect, it } from "vitest";

import { structuralReading } from "@chess-tabiya/runtime";

import { transitions } from "../r1r2-primitives-harness/corpus.js";
import { MODULES, compileModulePacket, type EvidenceFact } from "./module-contract.js";

const ROOT = new URL("../../", import.meta.url);
const OUTPUT = new URL("./output.md", import.meta.url).pathname;

function source(path: string): string {
  return readFileSync(new URL(path, ROOT), "utf8");
}

function percentile(values: readonly number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))]!;
}

function fixture(overrides: Partial<EvidenceFact> = {}): EvidenceFact {
  return {
    id: "fact-1",
    kind: "fixture_exact_relation",
    eligible: true,
    allowedConsumers: ["postcommit_nudge", "guided_hint", "compare_coach", "review_map", "full_inspector"],
    availableAt: "postcommit",
    sourceRung: 0,
    exactness: "exact",
    sign: "gained",
    squares: ["c3", "d5"],
    text: "Fixture fact; no chess claim.",
    ...overrides,
  };
}

describe("R3 shipped-surface census", () => {
  it("measures source-facing controls and square-triggered raw evidence", () => {
    const settings = source("apps/web/src/lib/AssistanceSettings.svelte");
    const drill = source("apps/web/src/lib/DrillScreen.svelte");
    const guidance = source("apps/server/src/guidance.ts");
    const profiles = [...settings.matchAll(/\b(pack|position|imported|match|stream|onramp):\s*"/g)].map((match) => match[1]);
    const settingsBlock = settings.slice(settings.indexOf("{#each ASSISTANCE_PROFILES"), settings.indexOf("</fieldset>") + "</fieldset>".length);
    const axesPerProfile = (settingsBlock.match(/<label(?:>|\s)/g) ?? []).length;
    expect(new Set(profiles).size).toBe(6);
    expect(axesPerProfile).toBe(9);
    expect(settings).toContain("Human move split on request");
    expect(drill).toContain("`${candidate.moveUci} ");
    expect(drill).toContain("structure.features.filter");
    expect(drill).not.toContain("assistance.arrows ===");
    const ambientTag = drill.match(/<button class="ambient"[^>]*>/)?.[0] ?? "";
    expect(ambientTag).not.toContain("onclick");
    expect(guidance).toContain("observations: reading.features");
    expect(guidance).not.toContain("allowedConsumers");

    const fens = [...new Set(transitions().map((row) => row.fen))];
    const captionCounts: number[] = [];
    const drawnMarkCounts: number[] = [];
    const uniqueMarkCounts: number[] = [];
    let worst = { fen: "", square: "", captions: 0, marks: 0, unique: 0, kinds: [] as string[] };
    for (const fen of fens) {
      const reading = structuralReading(fen);
      const setup = parseFen(fen).unwrap();
      for (const [square] of setup.board) {
        const name = makeSquare(square);
        const selected = reading.features.filter((item) => item.squares.includes(name));
        const marks = selected.flatMap((item) => item.squares);
        const unique = new Set(marks);
        captionCounts.push(selected.length);
        drawnMarkCounts.push(marks.length);
        uniqueMarkCounts.push(unique.size);
        if (selected.length > worst.captions || (selected.length === worst.captions && marks.length > worst.marks)) {
          worst = { fen, square: name, captions: selected.length, marks: marks.length, unique: unique.size, kinds: selected.map((item) => item.kind) };
        }
      }
    }

    const rows = [
      "# R3 mechanical presentation output",
      "",
      "Disposable research output; not a product specification.",
      "",
      "## Shipped-surface census",
      "",
      `- Assistance profiles: ${new Set(profiles).size}`,
      `- Primary axes per profile: ${axesPerProfile}`,
      `- Primary assistance controls: ${new Set(profiles).size * axesPerProfile}`,
      `- Unique authored-spine positions inspected: ${fens.length}`,
      `- Occupied-square queries inspected: ${captionCounts.length}`,
      `- Captions per selected occupied square: median ${percentile(captionCounts, 0.5)}, p90 ${percentile(captionCounts, 0.9)}, p95 ${percentile(captionCounts, 0.95)}, max ${Math.max(...captionCounts)}`,
      `- Drawn marks per selected occupied square: median ${percentile(drawnMarkCounts, 0.5)}, p90 ${percentile(drawnMarkCounts, 0.9)}, p95 ${percentile(drawnMarkCounts, 0.95)}, max ${Math.max(...drawnMarkCounts)}`,
      `- Unique marked squares: median ${percentile(uniqueMarkCounts, 0.5)}, p95 ${percentile(uniqueMarkCounts, 0.95)}, max ${Math.max(...uniqueMarkCounts)}`,
      `- Worst query: ${worst.square} in \`${worst.fen}\` → ${worst.captions} captions / ${worst.marks} marks / ${worst.unique} unique squares; kinds ${worst.kinds.join(", ")}`,
      "- Static controls: human-model rows expose UCI/mass; arrows have no renderer; ambient button has no action; the LLM packet has no consumer admission field.",
      "",
      "## Disposable module contract",
      "",
      "| Module | Intent | Timing | Activation | Fact cap | Move recommendation | Status |",
      "|---|---|---|---|---:|---|---|",
      ...MODULES.map((item) => `| ${item.id} | ${item.intent} | ${item.timing} | ${item.activation} | ${item.maxFacts} | ${item.allowsRecommendedMove ? "allowed only at this boundary" : "refused"} | ${item.status} |`),
      "",
      "`sight_on_request` is marked `owner_ruled_candidate`: D619 permits requested exact sight before commitment without ranking a move. R3 must still validate the workflow, and this harness is not product authority.",
      "",
    ];
    writeFileSync(OUTPUT, `${rows.join("\n")}\n`);
  });
});

describe("R3 disposable module compiler", () => {
  const module = (id: string) => MODULES.find((candidate) => candidate.id === id)!;

  it("abstains honestly for zero eligible facts", () => {
    expect(compileModulePacket(module("postcommit_nudge"), [])).toEqual({ moduleId: "postcommit_nudge", facts: [], abstained: true, reason: "no_eligible_fact" });
    expect(compileModulePacket(module("postcommit_nudge"), [fixture({ eligible: false })]).abstained).toBe(true);
  });

  it("keeps one fact and caps a noisy packet at two", () => {
    expect(compileModulePacket(module("postcommit_nudge"), [fixture()]).facts).toHaveLength(1);
    const noisy = Array.from({ length: 12 }, (_, index) => fixture({ id: `fact-${index}` }));
    expect(compileModulePacket(module("postcommit_nudge"), noisy).facts).toHaveLength(2);
  });

  it("refuses consumer mismatch and facts from a later disclosure boundary", () => {
    expect(compileModulePacket(module("postcommit_nudge"), [fixture({ allowedConsumers: ["full_inspector"] })]).abstained).toBe(true);
    expect(compileModulePacket(module("postcommit_nudge"), [fixture({ availableAt: "analysis" })]).abstained).toBe(true);
  });

  it("prevents a recommendation or PV from leaking into non-recommending modules", () => {
    expect(compileModulePacket(module("postcommit_nudge"), [fixture({ recommendedMoveUci: "e2e4" })]).abstained).toBe(true);
    expect(compileModulePacket(module("compare_coach"), [fixture({ availableAt: "disclosed", principalVariation: ["e2e4", "e7e5"] })]).abstained).toBe(true);
    expect(compileModulePacket(module("guided_hint"), [fixture({ availableAt: "disclosed", recommendedMoveUci: "e2e4" })]).facts).toHaveLength(1);
  });
});
