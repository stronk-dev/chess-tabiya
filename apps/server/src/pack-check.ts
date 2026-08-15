import { readFile, readdir } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";

import {
  validatePackDocument,
  type PackValidationIssue,
} from "./pack-validation.js";
import { isSidecarName } from "./pack-registry.js";
import { ShapeRegistry } from "./shape-registry.js";

export interface PackCheckResult {
  readonly file: string;
  readonly valid: boolean;
  readonly issues: readonly PackValidationIssue[];
}

function fileIssue(code: string, message: string): PackValidationIssue {
  return Object.freeze({
    severity: "error",
    source: "schema",
    code,
    path: "/",
    message,
  });
}

async function packJsonFiles(directory: string): Promise<readonly string[]> {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await packJsonFiles(path));
    else if (entry.isFile() && extname(entry.name) === ".json" && !isSidecarName(entry.name)) files.push(path);
  }
  return files;
}

async function siblingLookup(): Promise<Map<string, { readonly start: { readonly fen: string; readonly side: "white" | "black" }; readonly objective: { readonly type: string } }>> {
  const files = [
    ...await packJsonFiles(resolve("content/drafts")),
    ...await packJsonFiles(resolve("content/packs")),
  ];
  const result = new Map<string, { start: { fen: string; side: "white" | "black" }; objective: { type: string } }>();
  for (const file of files) {
    try {
      const value = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
      const start = value.start as Record<string, unknown> | undefined;
      const objective = value.objective as Record<string, unknown> | undefined;
      if (typeof value.id === "string" && typeof start?.fen === "string" && (start.side === "white" || start.side === "black") && typeof objective?.type === "string") {
        result.set(value.id, { start: { fen: start.fen, side: start.side }, objective: { type: objective.type } });
      }
    } catch { /* A malformed unrelated pack is absent from this narrow lookup. */ }
  }
  return result;
}

export async function checkPackFile(file: string): Promise<PackCheckResult> {
  const absolute = resolve(file);
  if (isSidecarName(basename(absolute))) {
    return Object.freeze({
      file: absolute,
      valid: false,
      issues: Object.freeze([
        fileIssue(
          "PACK_FILE_IS_RESERVED_SIDECAR_NAME",
          `${basename(absolute)} is a reserved sourcing sidecar name, not a pack filename`,
        ),
      ]),
    });
  }
  let text: string;
  try {
    text = await readFile(absolute, "utf8");
  } catch (error) {
    return Object.freeze({
      file: absolute,
      valid: false,
      issues: Object.freeze([
        fileIssue(
          "FILE_READ_ERROR",
          error instanceof Error ? error.message : String(error),
        ),
      ]),
    });
  }

  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch (error) {
    return Object.freeze({
      file: absolute,
      valid: false,
      issues: Object.freeze([
        fileIssue(
          "INVALID_JSON",
          error instanceof Error ? error.message : String(error),
        ),
      ]),
    });
  }
  const shapes = await ShapeRegistry.loadDefault();
  const packs = await siblingLookup();
  const result = validatePackDocument(value, { shapes, packs });
  return Object.freeze({ file: absolute, valid: result.valid, issues: result.issues });
}

export function formatPackIssue(issue: PackValidationIssue): string {
  return `${issue.severity.toUpperCase()} ${issue.path} [${issue.code}] ${issue.message}`;
}

async function main(): Promise<number> {
  const file = process.argv[2];
  if (file === undefined || file.trim() === "") {
    console.error("Usage: make pack-check FILE=<path-to-pack.json>");
    return 2;
  }
  const result = await checkPackFile(file);
  for (const issue of result.issues) {
    const line = formatPackIssue(issue);
    if (issue.severity === "error") console.error(line);
    else console.warn(line);
  }
  if (!result.valid) {
    console.error(`Pack check failed: ${result.file}`);
    return 1;
  }
  console.log(`Pack check passed: ${result.file}`);
  return 0;
}

if (process.argv[1]?.endsWith("pack-check.js")) {
  process.exitCode = await main();
}
