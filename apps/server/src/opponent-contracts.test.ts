import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { HUMAN_COMMON_RESISTANCE_PROFILE } from "./capabilities.js";
import { validatePackDocument } from "./pack-validation.js";

function sourceFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:svelte|ts)$/u.test(entry.name) && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

describe("opponent contracts", () => {
  it("binds the resistance profile to the dossier table instead of copied test literals", () => {
    const dossier = readFileSync("design/research/maia-endgame-fidelity.md", "utf8");
    const start = dossier.indexOf("## 6. Arm B");
    const section = dossier.slice(start, dossier.indexOf("\n---", start));
    const rows = section
      .split("\n")
      .filter((line) => /^\|\s*(?:1100|1500|1900)\s*\|/u.test(line))
      .map((line) => {
        const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
        const value = (cell: string): number => {
          const match = cell.match(/(\d+(?:\.\d+)?)(%?)/u);
          if (match === null) throw new TypeError(`Missing measurement in ${cell}`);
          const parsed = Number(match[1]);
          return match[2] === "%" ? Number((parsed / 100).toFixed(6)) : parsed;
        };
        return {
          band: value(cells[0]!),
          dtz: value(cells[1]!),
          dtzUniform: value(cells[2]!),
          fastest: value(cells[3]!),
          fastestUniform: value(cells[4]!),
          slowest: value(cells[5]!),
          slowestUniform: value(cells[6]!),
        };
      });
    const probeCount = section.match(/^(\d+) lost positions[^\n]+\*\*(\d+)\s+probes\*\*/mu);

    expect(rows).toHaveLength(3);
    expect(probeCount).not.toBeNull();
    expect(HUMAN_COMMON_RESISTANCE_PROFILE.corpus.positions).toBe(Number(probeCount![1]));
    expect(HUMAN_COMMON_RESISTANCE_PROFILE.corpus.probes).toBe(Number(probeCount![2]));
    expect(HUMAN_COMMON_RESISTANCE_PROFILE.bands).toEqual(rows.map((row) => row.band));
    expect(HUMAN_COMMON_RESISTANCE_PROFILE.dtzPercentile).toEqual({
      min: Math.min(...rows.map((row) => row.dtz)),
      max: Math.max(...rows.map((row) => row.dtz)),
      uniformBaseline: rows[0]!.dtzUniform,
    });
    expect(HUMAN_COMMON_RESISTANCE_PROFILE.slowestLosingRate).toEqual({
      min: Math.min(...rows.map((row) => row.slowest)),
      max: Math.max(...rows.map((row) => row.slowest)),
      uniformBaseline: rows[0]!.slowestUniform,
    });
    expect(HUMAN_COMMON_RESISTANCE_PROFILE.fastestLosingRate).toEqual({
      value: rows[0]!.fastest,
      uniformBaseline: rows[0]!.fastestUniform,
    });
    expect(new Set(rows.map((row) => row.dtzUniform))).toEqual(new Set([rows[0]!.dtzUniform]));
    expect(new Set(rows.map((row) => row.fastest))).toEqual(new Set([rows[0]!.fastest]));
    expect(new Set(rows.map((row) => row.fastestUniform))).toEqual(new Set([rows[0]!.fastestUniform]));
    expect(new Set(rows.map((row) => row.slowestUniform))).toEqual(new Set([rows[0]!.slowestUniform]));
  });

  it("keeps resistance measurements at mode scope and unordered ranks non-presentational", () => {
    const runtimeTypes = readFileSync("packages/runtime/src/types.ts", "utf8");
    const selectionContract = runtimeTypes.slice(
      runtimeTypes.indexOf("export interface SelectionCandidate"),
      runtimeTypes.indexOf("export interface Node"),
    );
    expect(selectionContract).not.toMatch(/\b(?:dtz|dtzPercentile|resistance|slowestLosing)\b/u);

    expect(selectionContract).toMatch(/\borderingBasis\?:/u);

    const renderingSources = sourceFiles("apps/web/src")
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    expect(renderingSources).not.toMatch(/\b(?:0\.719|0\.751|0\.611|0\.689|0\.227|0\.313)\b/u);
    expect(renderingSources).not.toMatch(/candidates?[^\n]{0,80}\.rank\b/u);
    expect(renderingSources).not.toMatch(/\borderingBasis\b/u);
  });

  it("warns only when perfect tablebase is paired with a hold objective", () => {
    const source = JSON.parse(readFileSync("content/drafts/outcome-hold.browser.json", "utf8")) as DrillPackDefinition;
    for (const objectiveType of ["hold", "save", "resist", "win"] as const) {
      const candidate = structuredClone(source) as any;
      candidate.objective.type = objectiveType;
      candidate.opponentPolicy = { mode: "perfect_tablebase", seedMode: "fixed" };
      const warnings = validatePackDocument(candidate).issues.filter(
        (issue) => issue.code === "PERFECT_TABLEBASE_UNORDERED_OBJECTIVE",
      );
      expect(warnings, objectiveType).toHaveLength(objectiveType === "hold" ? 1 : 0);
      if (objectiveType === "hold") {
        expect(warnings[0]).toMatchObject({ severity: "warning", path: "/opponentPolicy/mode" });
      }
    }
  });

  it("adds no unordered-objective warning to committed packs", () => {
    const warnings = readdirSync("content/drafts")
      .filter((name) => name.endsWith(".json") && !/\.(?:browser|evidence|job|sources)\.json$/u.test(name))
      .flatMap((name) => {
        const value = JSON.parse(readFileSync(join("content/drafts", name), "utf8")) as Record<string, unknown>;
        if (value.start === undefined || value.objective === undefined || value.opponentPolicy === undefined) return [];
        return validatePackDocument(value).issues
          .filter((issue) => issue.code === "PERFECT_TABLEBASE_UNORDERED_OBJECTIVE")
          .map((issue) => ({ name, issue }));
      });
    expect(warnings).toEqual([]);
  });
});
