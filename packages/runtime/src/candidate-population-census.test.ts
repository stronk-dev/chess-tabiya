// Repository census for rfc/shared-candidate-evidence-packet.md criteria 15, 17-20, 22 and 23.
// Source-graph assertions: they fail on a tree state, not on a comment convention.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { CANDIDATE_EVENTS_SCOPE, compileCandidatePopulation } from "./candidate-population.js";
import { renderEvidenceItems } from "./evidence-contract.js";
import { voiceCheck } from "./voice.js";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PACKET_SYMBOLS = /\b(compileCandidatePopulation|CandidatePopulationReceipt|CandidateEventPopulation|candidatePlayedRow|candidateAlternatives|projectCandidatePopulationReceipt|assertCandidatePopulationReceipt|assertCandidatePacketEvent)\b/u;

function productionSources(): readonly string[] {
  const files: string[] = [];
  for (const base of ["apps", "packages"]) {
    for (const entry of readdirSync(join(ROOT, base), { recursive: true, withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const path = join(entry.parentPath, entry.name);
      const rel = relative(ROOT, path);
      if (/(^|\/)(node_modules|dist|build|\.svelte-kit)\//u.test(rel)) continue;
      if (!/\.(ts|svelte)$/u.test(rel) || /\.(test|typecheck)\.ts$/u.test(rel)) continue;
      files.push(rel);
    }
  }
  return files.sort();
}

const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("candidate packet repository census", () => {
  const sources = productionSources();

  it("criteria 18/19/23: zero product consumers — only the compiler, the research selection contract, the barrel and the verification CLI name the packet", () => {
    const readers = sources.filter((rel) => PACKET_SYMBOLS.test(read(rel)));
    expect(readers).toEqual([
      "apps/server/src/semantic-evidence-check.ts",
      "packages/runtime/src/candidate-population.ts",
      "packages/runtime/src/index.ts",
      "packages/runtime/src/semantic-evidence.ts",
    ]);
    for (const rel of ["apps/server/src/application.ts", "apps/server/src/rest.ts", "apps/server/src/main.ts", "apps/server/src/opponent-selector.ts", "packages/runtime/src/voice.ts", "packages/runtime/src/evidence-contract.ts"]) {
      expect(PACKET_SYMBOLS.test(read(rel))).toBe(false);
    }
    expect(sources.filter((rel) => rel.startsWith("apps/web/") && PACKET_SYMBOLS.test(read(rel)))).toEqual([]);
  });

  it("criterion 19: the renderer and voice boundaries refuse a packet receipt at runtime", () => {
    const compiled = compileCandidatePopulation({ beforeFen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1", ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    if (compiled.kind !== "ready") throw new Error("expected packet");
    expect(() => renderEvidenceItems(compiled.receipt as never, {})).toThrow();
    expect(() => voiceCheck(compiled.receipt as never, "anything")).toThrow();
    expect(() => voiceCheck(compiled.receipt.packet as never, "anything")).toThrow();
  });

  it("criteria 15/17: the held score join has zero foundation API, and D10 enumerates every provider arm", () => {
    expect(sources.filter((rel) => /candidate-score-handoff/u.test(rel))).toEqual([]);
    const compiler = read("packages/runtime/src/candidate-population.ts");
    for (const forbidden of [/ProviderEvidenceDelivery/u, /provider-exchange/u, /legal_root_table/u, /evaluated_subset/u, /scoreCp/u, /from "\.\/maia/u, /stockfish/iu]) expect(compiler).not.toMatch(forbidden);
    const rfc = read("rfc/shared-candidate-evidence-packet.md");
    const d10 = rfc.split("\n").find((line) => line.startsWith("| D10 |"))!;
    for (const arm of ["legal-root", "aggregate deadline", "root_side_to_move", "mate", "mixed-domain abstention", "evaluated_subset", "position_eval", "Test-created profiles"]) expect(d10).toContain(arm);
  });

  it("criterion 20: the implementation surface is derived — one definition per §12 symbol and no successor module", () => {
    const definitions: Record<string, RegExp> = {
      compileCandidatePopulation: /export function compileCandidatePopulation\b/u,
      assertCandidatePopulationReceipt: /export function assertCandidatePopulationReceipt\b/u,
      projectCandidatePopulationReceipt: /export function projectCandidatePopulationReceipt\b/u,
      candidateChildReadings: /export function candidateChildReadings\b/u,
      localSemanticEventClosure: /export function localSemanticEventClosure\b/u,
      CANDIDATE_PACKET_COMPILER_VERSION: /export const CANDIDATE_PACKET_COMPILER_VERSION\b/u,
      CANDIDATE_COLLECTOR_PROJECTION_KEYS: /export const CANDIDATE_COLLECTOR_PROJECTION_KEYS\b/u,
      CANDIDATE_PACKET_ABSTENTION_REASONS: /export const CANDIDATE_PACKET_ABSTENTION_REASONS\b/u,
    };
    for (const [symbol, pattern] of Object.entries(definitions)) expect(sources.filter((rel) => pattern.test(read(rel))), symbol).toHaveLength(1);
    expect(sources.filter((rel) => rel.startsWith("apps/server/") && /function childReadings\b/u.test(read(rel)))).toEqual([]);
    expect(sources.filter((rel) => rel.startsWith("packages/runtime/") && /from "[^"]*(apps\/server|@chess-tabiya\/server)/u.test(read(rel)))).toEqual([]);
    expect(sources.filter((rel) => !rel.startsWith("packages/runtime/") && /from "[^"]*packages\/runtime\/src\/candidate-population/u.test(read(rel)))).toEqual([]);
    for (const successor of ["candidate-population-cache.ts", "cooperative-yield.ts", "candidate-collector-registry.ts", "candidate-population-service.ts"]) {
      expect(existsSync(join(ROOT, "packages/runtime/src", successor)), successor).toBe(false);
    }
    const generated = read("packages/runtime/src/candidate-population-projections.generated.ts");
    expect(generated.startsWith("// GENERATED by tools/generate-candidate-packet-projections.mjs")).toBe(true);
  });

  it("criteria 22/23/24: no aggregate evidence identity, no consumer view, and no module or per-request cache", () => {
    expect(read("packages/runtime/src/evidence-catalog.ts")).not.toContain("derived.candidate.event_population");
    expect(sources.filter((rel) => /ConsumerEvidenceView<\s*CandidateEventPopulation/u.test(read(rel)))).toEqual([]);
    expect(sources.filter((rel) => /new CandidatePopulationCache\b|CandidatePopulationService\b/u.test(read(rel)))).toEqual([]);
    const topLevel = read("packages/runtime/src/candidate-population.ts").split("\n").filter((line) => /^(const|let|var|export const|export let)\b/u.test(line));
    const state = topLevel.filter((line) => /new Map\b|^let\b|^var\b|^export let\b/u.test(line));
    expect(state).toEqual([]);
    const opponentSelector = read("apps/server/src/opponent-selector.ts");
    expect(opponentSelector).not.toMatch(/candidate-population|CandidatePopulation/u);
  });

  it("criterion 12 is owed to the service: this landing publishes no latency or memory default", () => {
    const compiler = read("packages/runtime/src/candidate-population.ts");
    expect(compiler).not.toMatch(/maxRetained|56[_,]?000|maxEntries/u);
    const compiled = compileCandidatePopulation({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    expect(compiled.kind).toBe("ready");
  });
});
