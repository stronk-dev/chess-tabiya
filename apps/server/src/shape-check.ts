import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateShapeEntry, type ShapeValidationResult } from "./shape-validation.js";
import { formatPackIssue } from "./pack-check.js";
import type { PackValidationIssue } from "./pack-validation.js";

export async function checkShapeFile(file: string): Promise<ShapeValidationResult & { readonly file: string }> {
  const absolute = resolve(file);
  try {
    const result = validateShapeEntry(JSON.parse(await readFile(absolute, "utf8")));
    return Object.freeze({ file: absolute, ...result });
  } catch (error) {
    const issue: PackValidationIssue = Object.freeze({ severity: "error", source: "schema", code: "FILE_READ_ERROR", path: "/", message: error instanceof Error ? error.message : String(error) });
    return Object.freeze({ file: absolute, valid: false, issues: Object.freeze([issue]) });
  }
}

async function main(): Promise<number> {
  const file = process.argv[2];
  if (file === undefined || file.trim() === "") { console.error("Usage: make shape-check FILE=<path-to-shape.json>"); return 2; }
  const result = await checkShapeFile(file);
  for (const candidate of result.issues) console.error(formatPackIssue(candidate));
  if (!result.valid) { console.error(`Shape check failed: ${result.file}`); return 1; }
  console.log(`Shape check passed: ${result.file}`);
  return 0;
}

if (process.argv[1]?.endsWith("shape-check.js")) process.exitCode = await main();
