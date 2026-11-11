/** Build/test-only case storage. Never import this module into an application runtime graph. */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SEMANTIC_VALIDATION_CASES_PATH, parseSemanticValidationCase } from "./semantic-validation.js";

export type SemanticValidationTreeReader = (path: string) => string | undefined;
export interface SemanticValidationCaseDocument {
  readonly schemaVersion: 1;
  readonly cases: readonly Record<string, unknown>[];
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const invalid = (message: string): never => { throw new TypeError(`SEMANTIC_VALIDATION_CASE_STORAGE_INVALID: ${message}`); };

function envelope(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
    || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    return invalid(`${label} must contain exactly ${keys.join(", ")}`);
  }
  return value as Record<string, unknown>;
}

function json(tree: SemanticValidationTreeReader, path: string): unknown {
  const text = tree(path);
  if (text === undefined) return invalid(`missing ${path}`);
  try { return JSON.parse(text); }
  catch { return invalid(`malformed JSON in ${path}`); }
}

/** Schema-1 part grammar, also used by the temporal guard's historical BASE-only decoder. */
export function parseSemanticValidationCasePart(value: unknown, label: string): readonly Record<string, unknown>[] {
  const record = envelope(value, ["schemaVersion", "cases"], label);
  if (record.schemaVersion !== 1 || !Array.isArray(record.cases)) return invalid(`${label} needs schemaVersion 1 and a cases array`);
  // Preserve the recorded objects exactly; callers may use the parsed runtime case grammar.
  const identities = new Set<string>();
  for (const value of record.cases) {
    const parsed = parseSemanticValidationCase(value), key = `${parsed.id}@${parsed.version}`;
    if (identities.has(key)) return invalid(`duplicate case ${key}`);
    identities.add(key);
  }
  return Object.freeze(record.cases as Record<string, unknown>[]);
}

/** One reader owns the complete index and all its parts; there is no fallback registry. */
export function readSemanticValidationCases(tree: SemanticValidationTreeReader): SemanticValidationCaseDocument {
  const index = envelope(json(tree, SEMANTIC_VALIDATION_CASES_PATH), ["schemaVersion", "parts"], "case index");
  if (index.schemaVersion !== 2 || !Array.isArray(index.parts) || index.parts.length === 0) {
    return invalid("case index needs schemaVersion 2 and a nonempty parts array");
  }
  const paths = new Set<string>();
  // Validate every reference before performing any part reads.
  for (const path of index.parts) {
    if (typeof path !== "string" || !/^semantic-validation-cases\/[^/\\\u0000]+\.json$/u.test(path)) {
      return invalid(`invalid case part path ${String(path)}`);
    }
    if (paths.has(path)) return invalid(`duplicate case part ${path}`);
    paths.add(path);
  }
  const cases: Record<string, unknown>[] = [], identities = new Set<string>();
  for (const path of paths) {
    const fullPath = `packages/runtime/src/${path}`;
    for (const value of parseSemanticValidationCasePart(json(tree, fullPath), fullPath)) {
      const key = `${value.id}@${value.version}`;
      if (identities.has(key)) return invalid(`duplicate case ${key}`);
      identities.add(key); cases.push(value);
    }
  }
  return Object.freeze({ schemaVersion: 1, cases: Object.freeze(cases) });
}

/** Filesystem convenience wrapper; Git callers supply their own tree reader above. */
export function loadSemanticValidationCases(root = ROOT): SemanticValidationCaseDocument {
  return readSemanticValidationCases(path => {
    try { return readFileSync(resolve(root, path), "utf8"); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  });
}
