// DISPOSABLE review harness — D2000-D2008. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/provider-exchange-and-execution.md");
const engine = read("apps/server/src/engine-supervisor.ts");
const evidenceQueue = read("apps/server/src/evidence-queue.ts");
const corpusGuard = read("packages/runtime/src/population-guard.ts");
const tablebase = read("apps/server/src/tablebase.ts");
const schemaDigest = read("packages/schema/src/drill-pack/digest.ts");
const evidenceDigest = read("packages/runtime/src/evidence-contract.ts");

function section(start: string, end: string): string {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section start ${start}`);
  assert.notEqual(to, -1, `missing section end ${end}`);
  return rfc.slice(from, to);
}

test("D2000: success results are not distributive or operation-discriminated", () => {
  const protocol = section("type TypedProviderRequest", "interface ProviderExecutionContext");
  assert.match(protocol, /type TypedProviderRequest<[\s\S]*K extends ProviderOperationId/);
  assert.match(protocol, /type TypedProviderResult<K extends ProviderOperationId>\s*=\s*\|/);
  assert.doesNotMatch(protocol, /type TypedProviderResult<[\s\S]*K extends ProviderOperationId\s*\?/);
  const success = protocol.match(/kind: "success"[^\n]+/u)?.[0] ?? "";
  assert.doesNotMatch(success, /operation:/);
});

test("D2001: a descriptor receipt is open and not mapped to its operation", () => {
  const receipt = section("interface ProviderAcquisitionReceipt", "type ProviderDelivery");
  const descriptor = section("interface ProviderOperationDescriptor", "type ProviderOperationDescriptors");
  assert.match(receipt, /provider: "stockfish" \| "maia" \| "syzygy" \| "lichess_explorer"/);
  assert.match(receipt, /requestedIdentity: Readonly<Record<string, string \| number \| boolean>>/);
  assert.match(receipt, /actualIdentity: Readonly<Record<string, string \| number \| boolean>>/);
  assert.doesNotMatch(descriptor, /readonly provider:/);
  assert.doesNotMatch(rfc, /ProviderOperationReceiptMap|ProviderRequestedIdentityMap|ProviderActualIdentityMap/);
});

test("D2002: coalesced callers have no crossed-deadline waiter algebra", () => {
  const scheduler = section("### 4. Shared bounded scheduler", "### 5. Stockfish legal-root source");
  assert.match(scheduler, /readonly deadlineAt: number/);
  assert.match(scheduler, /readonly remainingMs: number/);
  assert.match(scheduler, /Active work aborts when its final subscriber leaves/);
  assert.doesNotMatch(scheduler, /per-waiter deadline|waiter-local deadline|shorter-deadline|longer-deadline|scheduler mints.*deadline/is);
});

test("D2003: entry-bounded retention has no entry bound or positive weight rule", () => {
  const scheduler = section("### 4. Shared bounded scheduler", "### 5. Stockfish legal-root source");
  assert.match(scheduler, /maxRetainedWeight/);
  assert.match(scheduler, /weight-bounded as well as entry-bounded/);
  assert.doesNotMatch(scheduler, /maxRetainedEntries/);
  assert.doesNotMatch(scheduler, /retainedWeight[^\n]*(?:positive safe integer|>= 1|greater than zero)/i);
});

test("D2004: Syzygy outside-domain is promised but absent from the result type", () => {
  const syzygy = section("### 7. Syzygy position source", "### 8. Explorer position source");
  assert.match(syzygy, /Outside-domain is a typed domain abstention/);
  assert.match(syzygy, /interface LiveSyzygyPosition \{[\s\S]*readonly result: TablebasePosition/);
  assert.doesNotMatch(syzygy, /kind: "outside_domain"|kind: "outside_tablebase_domain"/);
  assert.match(tablebase, /TABLEBASE_OUT_OF_RANGE/);
});

test("D2005: CORPUS_GUARD is prose, not the summary suitability predicate", () => {
  const explorer = section("interface ExplorerPopulationSummary", "type ExplorerPopulationSummaryWire");
  assert.match(corpusGuard, /These counts say what this population played, not what is good/);
  assert.match(explorer, /suitability: \{ readonly guard: "CORPUS_GUARD"; readonly accepted: boolean \}/);
  assert.match(rfc, /parser-level 100-game\s+threshold is deleted; each consumer owns its explicit sample suitability policy/);
  assert.doesNotMatch(rfc, /function CORPUS_GUARD|CORPUS_GUARD\s*=\s*\([^)]*\)\s*=>/);
});

test("D2006: Stockfish command identity is caller-authored and ShowWDL is not normative", () => {
  const fixed = section("interface StockfishPositionEvaluationRequest", "The pending key is exact");
  assert.match(fixed, /readonly normalizedCommandsDigest: string/);
  assert.doesNotMatch(fixed, /UCI_ShowWDL/);
  assert.match(evidenceQueue, /setoption name UCI_ShowWDL value \$\{job\.kind === "wdl" \? "true" : "false"\}/);
  assert.doesNotMatch(rfc, /descriptor-owned command|recomputes? normalizedCommandsDigest|rejects? a mismatched command digest/i);
});

test("D2007: iterative score/WDL output has no normative final-line reducer", () => {
  const fixed = section("#### 5.1 Fixed-bound position evaluation", "### 6. Maia policy-page source");
  assert.match(fixed, /parses exactly one completed score/);
  assert.doesNotMatch(fixed, /last admissible|last matching|highest reached depth|latest completed|final info line/i);
  assert.match(evidenceQueue, /function lastInfo/);
  assert.match(evidenceQueue, /\[\.\.\.lines\]\.reverse\(\)\.find/);
  assert.match(engine, /waiter\.lines\.push\(line\)/);
});

test("D2008: provider digests do not select one canonical byte/domain authority", () => {
  assert.match(rfc, /normalizedRequestDigest/);
  assert.match(rfc, /actualIdentityDigest/);
  assert.match(rfc, /responseDigest/);
  assert.match(rfc, /pendingKey` is the canonical digest/);
  assert.doesNotMatch(rfc, /canonicalizeJson|digestCanonicalJson|RFC 8785|JCS|domain-separated|domain tag/i);
  assert.match(schemaDigest, /export function canonicalizeJson/);
  assert.match(evidenceDigest, /function canonical\(/);
});
