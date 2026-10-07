import assert from "node:assert/strict";
import test from "node:test";
import { auditTimedTable } from "./cost-timed-table-audit.mjs";
import { parseProbe } from "./cost-stockfish.mjs";
import { sha } from "./cost-contract.mjs";

const operands = { provider: "stockfish", sourceDigest: sha("synthetic audit control"),
  fen: "4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1", budget: "movetime100", multiPv: 2 };
const lines = [
  "info depth 8 multipv 1 score cp 20 pv e2e4",
  "info depth 8 multipv 2 score cp 10 pv e2e3",
  "info depth 9 multipv 1 score cp 25 lowerbound pv e2e4",
  "info depth 9 multipv 2 score cp 10 pv e2e3",
  "bestmove e2e4",
];

test("the frozen parser still refuses a complete bound-bearing newest table", () => {
  assert.throws(() => parseProbe(operands, lines), /Bound-only/);
  const before = JSON.stringify({ operands, lines }), value = auditTimedTable(operands, lines);
  assert.equal(JSON.stringify({ operands, lines }), before);
  assert.equal(value.originalSourceAdmissionChanged, false);
  assert.equal(value.moveRecommendationLicensed, false);
  assert.equal(value.boundForDelimiterBestmoveLicensed, false);
  assert.equal(value.earlierExactFrame.coherentDepth, 8);
  assert.equal(value.earlierExactFrame.latestReportedDepth, 9);
  assert.deepEqual(value.earlierExactFrame.rankLineIndexes, [0, 1]);
  assert.equal(value.earlierExactFrame.status, "earlier_exact_literal_table_observed_not_admitted");
  assert.throws(() => parseProbe(operands, lines), /Bound-only/);
});

test("a different literal bestmove stays distinct from the earlier exact ranking", () => {
  const value = auditTimedTable(operands, [...lines.slice(0, -1), "bestmove e2e3"]);
  assert.equal(value.earlierExactFrame.literalDelimiterBestmove, "e2e3");
  assert.equal(value.earlierExactFrame.entries[0].moveUci, "e2e4");
  assert.equal(value.earlierExactFrame.delimiterMatchesFrameRankOne, false);
  assert.equal(value.boundForDelimiterBestmoveLicensed, false);
});

test("an exact latest table remains current admission, not a manufactured fallback", () => {
  const exact = lines.map(x => x.replace(" lowerbound", ""));
  const value = auditTimedTable(operands, exact);
  assert.equal(value.original.kind, "admitted_by_unchanged_reader");
  assert.equal(value.earlierExactFrame, null);
});

for (const [name, change] of [
  ["fixed depth cannot be downgraded", () => [{ ...operands, budget: "depth9" }, lines]],
  ["no earlier frame", () => [operands, lines.slice(2)]],
  ["incomplete earlier population", () => [operands, lines.filter((_, i) => i !== 1)]],
  ["earlier frame is also bound-only", () => [operands, lines.map((x, i) => i === 0 ? x.replace("cp 20", "cp 20 upperbound") : x)]],
  ["missing bestmove", () => [operands, lines.slice(0, -1)]],
  ["duplicate delimiter", () => [operands, [...lines, lines.at(-1)]]],
  ["illegal final bestmove", () => [operands, [...lines.slice(0, -1), "bestmove a1a8"]]],
  ["illegal trailing scored PV", () => [operands, lines.map((x, i) => i === 2 ? x + " a1a8" : x)]],
  ["foreign provider", () => [{ ...operands, provider: "invented" }, lines]],
  ["unknown budget", () => [{ ...operands, budget: "movetime200" }, lines]],
]) test(`earlier-frame audit refuses ${name}`, () => {
  const value = auditTimedTable(...change());
  assert.equal(value.original.kind, "refused_by_unchanged_reader");
  assert.equal(value.earlierExactFrame, null);
  assert.equal(value.originalSourceAdmissionChanged, false);
});

test("literal-source digest changes even when the claimed score stays the same", () => {
  const one = auditTimedTable(operands, lines);
  const two = auditTimedTable(operands, ["info string diagnostic retained", ...lines]);
  assert.notEqual(one.inputDigest, two.inputDigest);
  assert.deepEqual(one.earlierExactFrame.entries, two.earlierExactFrame.entries);
  assert.deepEqual(two.earlierExactFrame.rankLineIndexes, [1, 2]);
});
