import { Buffer } from "node:buffer";

export const RETAINED_CATEGORIES = Object.freeze([
  "packet",
  "legal_moves_input",
  "legal_move",
  "candidate_row",
  "event",
  "reading",
  "abstention",
  "retained_collector_outcome",
  "execution_collector_outcome",
]);

function scalarBytes(value) {
  if (value === null) return Buffer.byteLength("null");
  if (typeof value === "string") return Buffer.byteLength(value);
  if (typeof value === "number") return Buffer.byteLength(String(value));
  if (typeof value === "boolean") return Buffer.byteLength(value ? "true" : "false");
  if (typeof value === "undefined") return 0;
  throw new Error(`UNSUPPORTED_RETAINED_VALUE:${typeof value}`);
}

export function measureRetainedGraph(references) {
  const roots = [
    ["packet", references.packet],
    ["legal_moves_input", references.legalMovesInput],
    ...references.legalMoves.map((value) => ["legal_move", value]),
    ...references.candidateInputs.flatMap((input) => [
      ["candidate_row", input.row],
      ...input.events.map((value) => ["event", value]),
      ...input.readings.map((value) => ["reading", value]),
      ...input.abstentions.map((value) => ["abstention", value]),
      ...input.collectorOutcomes.map((value) => ["retained_collector_outcome", value]),
      ...input.executionOutcomes.map((value) => ["execution_collector_outcome", value]),
    ]),
  ];
  const counts = Object.fromEntries(RETAINED_CATEGORIES.map((category) => [category, 0]));
  const seen = new WeakSet();
  let logicalUtf8Bytes = 0;
  let uniqueObjects = 0;

  function visit(value) {
    if (value === null || typeof value !== "object") {
      logicalUtf8Bytes += scalarBytes(value);
      return;
    }
    if (seen.has(value)) return;
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
      throw new Error("NON_PLAIN_RETAINED_OBJECT");
    }
    seen.add(value);
    uniqueObjects += 1;
    const keys = Object.keys(value).sort();
    for (const key of keys) {
      logicalUtf8Bytes += Buffer.byteLength(key);
      visit(value[key]);
    }
  }

  for (const [category, value] of roots) {
    if (!(category in counts)) throw new Error(`UNKNOWN_CATEGORY:${category}`);
    counts[category] += 1;
    visit(value);
  }
  if (Object.keys(counts).sort().join("\0") !== [...RETAINED_CATEGORIES].sort().join("\0")) {
    throw new Error("CATEGORY_SET_MISMATCH");
  }
  return Object.freeze({
    logicalUtf8Bytes,
    uniqueObjects,
    categoryCounts: Object.freeze(counts),
  });
}

export function compileScopeInvariant(collector, scope) {
  const context = Object.freeze({
    beforeFen: "root",
    moveUci: "e2e4",
    afterFen: "child",
    memo: Object.freeze({}),
  });
  const values = Object.freeze(collector(context));
  return Object.freeze({ scope, values });
}

export function projectNarrow(compiled, scope) {
  return Object.freeze({ scope, values: compiled.values });
}
