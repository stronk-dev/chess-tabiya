import type { EvidencePage } from "./api.js";

type RecordValue = Readonly<Record<string, unknown>>;

function record(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as RecordValue;
}

function exact(value: RecordValue, required: readonly string[], label: string): void {
  const allowed = new Set(required);
  if (required.some((key) => !(key in value)) || Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError(`${label} has an invalid shape`);
}

function integer(value: unknown, label: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) throw new TypeError(`${label} must be a bounded safe integer`);
  return Number(value);
}

export function parseEvidencePage(value: unknown, sinceSeq: number): EvidencePage {
  integer(sinceSeq, "evidence-page/requestedSinceSeq");
  const page = record(value, "evidence-page"); exact(page, ["results", "nextSeq"], "evidence-page");
  const nextSeq = integer(page.nextSeq, "evidence-page/nextSeq", sinceSeq);
  if (!Array.isArray(page.results)) throw new TypeError("evidence-page/results must be an array");
  let prior = sinceSeq;
  const results = page.results.map((raw, index) => {
    const item = record(raw, `evidence-page/results/${index}`); exact(item, ["seq"], `evidence-page/results/${index}`);
    const seq = integer(item.seq, `evidence-page/results/${index}/seq`, sinceSeq + 1);
    if (seq <= prior || seq > nextSeq) throw new TypeError("evidence-page result sequence is not a unique ordered cursor");
    prior = seq;
    return Object.freeze({ seq });
  });
  return Object.freeze({ results: Object.freeze(results), nextSeq });
}
