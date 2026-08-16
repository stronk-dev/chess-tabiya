import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { validatePackDocument } from "./pack-validation.js";

function sourceFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:svelte|ts)$/u.test(entry.name) && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

describe("opponent contracts", () => {
  it("keeps resistance measurements at mode scope and unordered ranks non-presentational", () => {
    const runtimeTypes = readFileSync("packages/runtime/src/types.ts", "utf8");
    const selectionContract = runtimeTypes.slice(
      runtimeTypes.indexOf("export interface SelectionCandidate"),
      runtimeTypes.indexOf("export interface Node"),
    );
    expect(selectionContract).not.toMatch(/\b(?:dtz|dtzPercentile|resistance|slowestLosing)\b/u);

    const renderingSources = sourceFiles("apps/web/src")
      .filter((path) => path.endsWith(".svelte") || /(?:presentation|sentences)\.ts$/u.test(path))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    expect(renderingSources).not.toMatch(/\b(?:0\.719|0\.751|0\.611|0\.689|0\.227|0\.313)\b/u);
    expect(renderingSources).not.toMatch(/candidates?[^\n]{0,80}\.rank\b/u);
    expect(renderingSources).not.toMatch(/orderingBasis[^\n]{0,120}(?:best|prefer|ordinal)/iu);
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
