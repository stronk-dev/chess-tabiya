/** Build/test-only lossless storage2 codec. Never exported from the runtime barrel.
 * Complete execution semantics remain schema1 and belong to the canonical writer.
 */
import type { SemanticValidationReceiptDocument } from "./semantic-validation.js";

const documentKeys = ["schemaVersion", "writer", "rootDigest", "profileDigest", "caseDigest", "externalDigest",
  "operations", "population", "cases", "populations", "externals", "verdicts"];
const caseKeys = ["case", "subject", "arm", "operation", "inputDigest", "invocations", "resultKind", "unavailableReason",
  "targetCount", "otherCount", "targets", "reach", "authority", "status", "failure"];
const targetKeys = ["projection", "operandDigest", "factory", "inputDigest", "payloadDigest"];
const invalid = (message: string): never => { throw new TypeError(`SEMANTIC_VALIDATION_RECEIPT_STORAGE_INVALID: ${message}`); };
const hash = /^[0-9a-f]{64}$/u;
function record(value: unknown, keys: readonly string[], name: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype
    || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) return invalid(`invalid ${name} fields`);
  return value as Record<string, unknown>;
}
function vector(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.some(digest => typeof digest !== "string" || digest.length !== 64 || !hash.test(digest))) return invalid("invalid input digest vector");
  return Object.freeze([...value] as string[]);
}

/** Ordered vectors are interned as whole values: duplicate entries/order remain evidence. */
export function encodeSemanticValidationReceipt(document: SemanticValidationReceiptDocument): string {
  record(document, documentKeys, "document");
  if (document.schemaVersion !== 1) return invalid("encoder requires complete schema1");
  const vectors: (readonly string[])[] = [], indices = new Map<string, number>();
  const cases = document.cases.map(raw => {
    const row = record(raw, caseKeys, "case");
    if (!Array.isArray(row.targets)) return invalid("case targets must be an array");
    return { ...row, targets: row.targets.map(raw => {
      const target = record(raw, [...targetKeys, "sourceDigests"], "target"), values = vector(target.sourceDigests), key = JSON.stringify(values);
      let at = indices.get(key);
      if (at === undefined) { at = vectors.length; vectors.push(values); indices.set(key, at); }
      const { sourceDigests: _sourceDigests, ...fields } = target;
      return { ...fields, sourceDigestVector: at };
    }) };
  });
  const stored = { ...document, schemaVersion: 2, cases, sourceDigestVectors: vectors };
  const fields = Object.entries(stored).map(([key, value]) => {
    const serialized = key === "cases" ? `[\n${cases.map(row => `    ${JSON.stringify(row)}`).join(",\n")}\n  ]`
      : JSON.stringify(value, null, 2).replaceAll("\n", "\n  ");
    return `  ${JSON.stringify(key)}: ${serialized}`;
  });
  return `{\n${fields.join(",\n")}\n}\n`;
}

/** Current storage is strictly2. Historical schema1 reads are confined to their Git tool. */
export function decodeSemanticValidationReceipt(text: string): SemanticValidationReceiptDocument {
  if (typeof text !== "string") return invalid("receipt must be JSON text");
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return invalid("malformed JSON"); }
  const stored = record(parsed, [...documentKeys, "sourceDigestVectors"], "storage document");
  if (stored.schemaVersion !== 2) return invalid("current receipt needs storage2");
  if (!Array.isArray(stored.sourceDigestVectors) || !Array.isArray(stored.cases)) return invalid("receipt arrays missing");
  const vectors = stored.sourceDigestVectors.map(vector), keys = vectors.map(value => JSON.stringify(value));
  if (new Set(keys).size !== keys.length) return invalid("duplicate input digest vectors");
  const used = new Set<number>();
  const cases = stored.cases.map(raw => {
    const row = record(raw, caseKeys, "case");
    if (!Array.isArray(row.targets)) return invalid("case targets must be an array");
    return { ...row, targets: row.targets.map(raw => {
      const target = record(raw, [...targetKeys, "sourceDigestVector"], "target"), at = target.sourceDigestVector;
      if (typeof at !== "number" || !Number.isSafeInteger(at) || Object.is(at, -0) || at < 0 || at >= vectors.length) return invalid("invalid input digest vector index");
      used.add(at);
      const { sourceDigestVector: _sourceDigestVector, ...fields } = target;
      return { ...fields, sourceDigests: vectors[at]! };
    }) };
  });
  if (used.size !== vectors.length) return invalid("unreferenced input digest vector");
  const { sourceDigestVectors: _sourceDigestVectors, ...fields } = stored;
  // The storage grammar is closed above. Unchanged semantic metadata is checked by the writer.
  return { ...fields, schemaVersion: 1, cases } as unknown as SemanticValidationReceiptDocument;
}
