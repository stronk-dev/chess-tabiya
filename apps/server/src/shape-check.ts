import { readFile } from "node:fs/promises";
import { readdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

import { validateShapeEntry, type ShapeValidationResult } from "./shape-validation.js";
import { formatPackIssue } from "./pack-check.js";
import type { PackValidationIssue } from "./pack-validation.js";
import { censusFilePath, runExpressionCensus, type ExpressionCensusReport } from "./expression-census.js";

function censusWarnings(report: Pick<ExpressionCensusReport, "subjects">): readonly PackValidationIssue[] {
  const warningCode = (subject: any, label: string): string | undefined => {
    if (label === "EVALUATION_FAULT") return "STRUCTURAL_SOURCE_UNAVAILABLE";
    if (label === "FIRES_ON_DEGENERATE") return "EXPRESSION_FIRES_ON_DEGENERATE";
    if (subject.site.subject.kind === "shape_trigger" && label === "NEVER_FIRES_IN_CORPUS") return "SHAPE_TRIGGER_NEVER_FIRES_IN_CORPUS";
    if (subject.site.subject.kind === "shape_plan_signature" && label === "NEVER_FIRES_IN_SHAPE") return "PLAN_SIGNATURE_NEVER_FIRES_IN_SHAPE";
    if (subject.site.subject.kind === "shape_plan_signature" && label === "FIRES_ONLY_OUTSIDE_SHAPE") return "PLAN_SIGNATURE_FIRES_ONLY_OUTSIDE_SHAPE";
    return undefined;
  };
  return Object.freeze(report.subjects.flatMap((subject: any) => subject.observations.flatMap((label: string) => warningCode(subject, label) === undefined ? [] : [{
    severity: label === "EVALUATION_FAULT" ? "error" as const : "warning" as const, source: "runtime" as const, code: warningCode(subject, label)!, path: subject.site.pointer,
    message: label === "EVALUATION_FAULT" ? subject.coverage.corpus.faults?.first ?? subject.satisfiabilityError ?? subject.coverage.inShape?.faults?.first ?? subject.satisfiability.witnesses?.find((witness: { code?: string }) => witness.code === "WITNESS_EVALUATION_FAILED")?.error ?? "Structural evaluation unavailable" : `${label} in the selected corpus`,
  }])));
}

/** Same canonical file join for in-tree and external draft callers, including the CLI. */
export function censusIssuesForFile(report: Pick<ExpressionCensusReport, "subjects">, file: string): readonly PackValidationIssue[] {
  const path = censusFilePath(resolve(file));
  return censusWarnings({ subjects: report.subjects.filter(subject => subject.site.file === path) });
}

export async function checkShapeFile(file: string, options: { readonly probeFen?: string; readonly corpus?: readonly string[] } = {}): Promise<ShapeValidationResult & { readonly file: string }> {
  const absolute = resolve(file);
  let raw: unknown;
  try { raw = JSON.parse(await readFile(absolute, "utf8")); }
  catch (error) {
    const issue: PackValidationIssue = Object.freeze({ severity: "error", source: "schema", code: "FILE_READ_ERROR", path: "/", message: error instanceof Error ? error.message : String(error) });
    return Object.freeze({ file: absolute, valid: false, issues: Object.freeze([issue]) });
  }
  let result: ShapeValidationResult | undefined;
  try {
    result = validateShapeEntry(raw, options.probeFen === undefined ? {} : { probeFen: options.probeFen });
    if (options.corpus === undefined) return Object.freeze({ file: absolute, ...result });
    const report = await runExpressionCensus({ roots: options.corpus, files: [absolute] });
    const warnings = censusWarnings(report);
    return Object.freeze({ file: absolute, ...result, valid: result.valid && !warnings.some(issue => issue.severity === "error"), issues: Object.freeze([...result.issues, ...warnings]) });
  } catch (error) {
    const issue: PackValidationIssue = Object.freeze({ severity: "error", source: "runtime", code: "STRUCTURAL_SOURCE_UNAVAILABLE", path: "/", message: error instanceof Error ? error.message : String(error) });
    return Object.freeze({ file: absolute, ...result, valid: false, issues: Object.freeze([...(result?.issues ?? []), issue]) });
  }
}

export function formatProbeResult(file: string, probeMatches: boolean): string {
  return `PROBE ${probeMatches ? "FIRES" : "DOES NOT FIRE"}: ${file}#/trigger`;
}

async function main(): Promise<number> {
  const expand = (value: string): readonly string[] => {
    if (!value.includes("*")) return [value];
    const directory = dirname(value), pattern = new RegExp(`^${basename(value).replaceAll(".", "\\.").replaceAll("*", ".*")}$`, "u");
    return readdirSync(directory).filter((name) => pattern.test(name)).map((name) => resolve(directory, name)).sort();
  };
  const files = process.argv[2]?.split(",").filter(Boolean).flatMap(expand) ?? [];
  if (files.length === 0) { console.error("Usage: make shape-check FILE=<path[,path...]> [PROBE=<fen>] [CORPUS=<roots>]"); return 2; }
  const corpus = process.argv[4]?.split(",").filter(Boolean);
  let failed = false;
  const probeFen = process.argv[3] || undefined;
  const results = await Promise.all(files.map((file) => checkShapeFile(file, probeFen === undefined ? {} : { probeFen })));
  const warningsByFile = new Map<string, readonly PackValidationIssue[]>();
  if (corpus !== undefined) {
    const report = await runExpressionCensus({ roots: corpus, files });
    for (const file of files) {
      warningsByFile.set(resolve(file), censusIssuesForFile(report, file));
    }
  }
  for (const result of results) {
    const issues = [...result.issues, ...(warningsByFile.get(result.file) ?? [])];
    for (const candidate of issues) (candidate.severity === "warning" ? console.warn : console.error)(formatPackIssue(candidate));
    if (result.probeMatches !== undefined) console.log(formatProbeResult(result.file, result.probeMatches));
    if (!result.valid || issues.some(issue => issue.severity === "error")) { console.error(`Shape check failed: ${result.file}`); failed = true; }
    else console.log(`Shape check passed: ${result.file}`);
  }
  return failed ? 1 : 0;
}

if (process.argv[1]?.endsWith("shape-check.js")) process.exitCode = await main();
