import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync(
  new URL("../../rfc/provider-exchange-and-execution.md", import.meta.url),
  "utf8",
);
const executionResearch = readFileSync(
  new URL("../../design/research/evidence-execution-and-confidence-closure.md", import.meta.url),
  "utf8",
);

test("D1950: Maia occurrences drop the provider delivery envelope", () => {
  assert.match(rfc, /payload `ProviderEvidenceDelivery<MaiaPolicyPage>`/u);
  assert.equal((rfc.match(/readonly page: MaiaPolicyPage;/gu) ?? []).length, 2);
  assert.doesNotMatch(rfc, /readonly page: ProviderEvidenceDelivery<MaiaPolicyPage>;/u);
});

test("D1951: Explorer history not_requested is unreachable from the request", () => {
  assert.match(rfc, /readonly historyWidth: number;/u);
  assert.match(rfc, /readonly kind: "not_requested"/u);
  assert.match(rfc, /Normalization rejects[\s\S]{0,240}non-positive widths/u);
  assert.doesNotMatch(rfc, /history(?:Mode|Requested):/u);
});

test("D1952: operation execution has context and signal signatures", () => {
  assert.match(rfc, /context: ProviderExecutionContext,/u);
  assert.match(rfc, /StockfishPositionEvaluationOperation\.execute\(request, signal\)/u);
  assert.match(rfc, /SyzygyPositionOperation\.execute\(request, signal\)/u);
});

test("D1953: one path state has no mixed-leaf aggregation rule", () => {
  assert.match(rfc, /readonly state: "satisfied_local"[\s\S]*"unsatisfied";/u);
  assert.match(executionResearch, /Stockfish \+ recorded engine point/u);
  assert.doesNotMatch(rfc, /mixed[^\n]*source[^\n]*state[^\n]*precedence/iu);
});

test("D1954: Maia key both includes and excludes actual exchange identity", () => {
  assert.match(rfc, /complete key includes request kind and every request byte, requested\/actual model identity/u);
  assert.match(rfc, /pending\/deduplication key[\s\S]{0,180}never contains an[\s\S]{0,40}actual generation/u);
});

test("D1955: Explorer migration projections have no literal payload contracts", () => {
  assert.match(rfc, /derived\.explorer\.population_summary@1/u);
  assert.match(rfc, /derived\.explorer\.played_move_occurrence@1/u);
  assert.doesNotMatch(rfc, /interface ExplorerPopulationSummary/u);
  assert.doesNotMatch(rfc, /interface ExplorerPlayedMoveOccurrence/u);
});
