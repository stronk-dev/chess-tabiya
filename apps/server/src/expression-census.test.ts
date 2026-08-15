import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";

import type { StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { runExpressionCensus } from "./expression-census.js";
import { checkShapeFile } from "./shape-check.js";
import { validateShapeEntry } from "./shape-validation.js";

function packFiles(): string[] {
  return readdirSync("content/drafts").filter((name) => name.endsWith(".json") && !/\.(?:evidence|job|sources)\.json$/u.test(name));
}

const witnesses = JSON.parse(readFileSync("content/witnesses/expression-witnesses.json", "utf8"));
const fullReport = runExpressionCensus({ witnesses });

describe("expression census", () => {
  it("walks every pack including root-only fixtures and reports the fixture split", () => {
    const report = fullReport;
    expect(report.corpus.packs).toBe(packFiles().length);
    expect(report.corpus.positions).toBeGreaterThan(report.corpus.packs);
    expect(report.corpus.packsWithoutSpine).toContain("trajectory-legs-browser");
    expect(report.corpus.fixturePacks).toEqual(packFiles().filter((name) => name.endsWith(".browser.json")).map((name) => JSON.parse(readFileSync(`content/drafts/${name}`, "utf8")).id).sort());
  });

  it("separates zero coverage from satisfiability and preserves empty denominators", () => {
    const report = fullReport;
    const anchor = report.subjects.find((subject: any) => subject.site.subject.plan === "black-anchor-the-knight");
    expect(anchor.coverage.corpus.fires).toBe(0);
    expect(anchor.satisfiability.verdict).toBe("satisfiable");
    expect(anchor.observations).toContain("NEVER_FIRES_IN_CORPUS");
    expect(anchor.observations).not.toContain("UNSATISFIABLE");
    const race = report.subjects.filter((subject: any) => subject.site.subject.shape === "opposite-castling-race");
    expect(race).toHaveLength(5);
    expect(race.every((subject: any) => subject.observations.includes("IN_SHAPE_DENOMINATOR_EMPTY"))).toBe(true);
    for (const plan of ["black-central-counter", "white-build-the-bridge"]) {
      expect(report.subjects.find((subject: any) => subject.site.subject.plan === plan).observations).toContain("FIRES_ONLY_OUTSIDE_SHAPE");
    }
  });

  it("reports vacuous degeneracy without turning it into an error", () => {
    const expression: StructuralExpression = { kind: "feature", feature: { kind: "piece_reach_count", color: "white", role: "bishop", scope: "every", comparison: "atLeast", count: 0 } };
    const report = runExpressionCensus({ expression, witnesses: {} });
    expect(report.subjects[0].observations).toContain("FIRES_ON_DEGENERATE");
    expect(report.subjects[0].degenerate).toContain("bare_kings");
    expect(report.subjects[0].observations).not.toContain("UNSATISFIABLE");
  });

  it("is deterministic and does not mutate content", () => {
    const before = packFiles().map((name) => [name, statSync(`content/drafts/${name}`).mtimeMs, createHash("sha256").update(readFileSync(`content/drafts/${name}`)).digest("hex")] as const);
    const one = canonicalizeJson(runExpressionCensus({ witnesses }));
    const two = canonicalizeJson(runExpressionCensus({ witnesses }));
    expect(two).toBe(one);
    expect(packFiles().map((name) => [name, statSync(`content/drafts/${name}`).mtimeMs, createHash("sha256").update(readFileSync(`content/drafts/${name}`)).digest("hex")])).toEqual(before);
  }, 20_000);

  it("reuses the shipped walker and leaves the verification gate report-free", () => {
    const source = readFileSync(new URL("./expression-census.ts", import.meta.url), "utf8");
    expect(source).toContain('import { authoredSpineFens } from "./pack-validation.js"');
    expect(source).toContain('import { matchesStructuralExpression } from "@chess-tabiya/runtime"');
    expect(source).toContain('resolve("content/witnesses/expression-witnesses.json")');
    expect(source).not.toContain('resolve("apps/server/src/fixtures/expression-witnesses.json")');
    expect(source).not.toMatch(/chessops\/(?:util|chess)|\.spine|moveUci|parseUci/u);
    const makefile = readFileSync("Makefile", "utf8");
    expect(makefile.match(/^verify:.*$/mu)?.[0]).not.toContain("expression-census");
  });

  it("refuses a proven impossibility without dropping probeMatches", () => {
    const entry = JSON.parse(readFileSync("content/shapes/carlsbad.json", "utf8"));
    entry.trigger = { kind: "feature", feature: { kind: "piece_count", color: "white", role: "king", basis: "count", comparison: "equal", count: 0 } };
    const result = validateShapeEntry(entry, { probeFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("STRUCTURAL_EXPRESSION_UNSATISFIABLE");
    expect(result).toHaveProperty("probeMatches", false);
  });

  it("adds opt-in corpus warnings without making shape-check fail", async () => {
    const result = await checkShapeFile("content/shapes/knight-vs-bishop.json", { corpus: ["content/drafts", "content/packs"] });
    expect(result.valid).toBe(true);
    expect(result.issues.some((issue) => issue.severity === "warning" && issue.code === "SHAPE_TRIGGER_NEVER_FIRES_IN_CORPUS")).toBe(true);
  }, 10_000);
});
