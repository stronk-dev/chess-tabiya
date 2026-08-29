// DISPOSABLE author harness — D2000-D2008. Not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync(new URL("../../rfc/provider-exchange-and-execution.md", import.meta.url), "utf8");

function section(start: string, end: string): string {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section start ${start}`);
  assert.notEqual(to, -1, `missing section end ${end}`);
  return rfc.slice(from, to);
}

test("D2000: result union distributes and retains its operation discriminator", () => {
  const protocol = section("type TypedProviderRequest", "interface ProviderExecutionContext");
  assert.match(protocol, /type ProviderSuccess<K extends ProviderOperationId> = K extends ProviderOperationId/u);
  assert.match(protocol, /kind: "success";\s*operation: K;/u);
  assert.match(protocol, /type TypedProviderResult<K extends ProviderOperationId = ProviderOperationId> =\s*K extends ProviderOperationId \? ProviderSuccess<K> \| ProviderSourceFailure<K> : never;/u);
  const payloadFor = new Map([
    ["stockfish.legal_root_table@1", "StockfishLegalRootTable"],
    ["stockfish.position_evaluation@1", "FixedBoundPositionEvaluation"],
    ["maia.policy_page@1", "MaiaPolicyPage"],
    ["syzygy.position@1", "LiveSyzygyPosition"],
    ["lichess_explorer.position_page@1", "ExplorerPositionPage"],
  ]);
  let crossed = 0;
  for (const [operation, payload] of payloadFor) for (const [otherOperation, otherPayload] of payloadFor) {
    if (operation === otherOperation) assert.equal(payload, otherPayload);
    else { assert.notEqual(payload, otherPayload); crossed += 1; }
  }
  assert.equal(crossed, 20);
});

type Operation = "stockfish.position_evaluation@1" | "maia.policy_page@1";
const providerFor = Object.freeze({
  "stockfish.position_evaluation@1": "stockfish",
  "maia.policy_page@1": "maia",
} as const);
function sealReceipt<K extends Operation>(operation: K, provider: (typeof providerFor)[K]) {
  assert.equal(provider, providerFor[operation], "operation/provider mismatch");
  return Object.freeze({ operation, provider });
}

function validateCapturedIdentity(value: Readonly<{
  provider: string; requestedId: string; requestedVersion: string; actualId: string;
  actualVersion: string; endpoint: string; actualEndpoint?: string; generation: number | null;
}>): void {
  assert.equal(value.provider === "stockfish" || value.provider === "maia", value.generation !== null);
  assert.equal(value.requestedId, value.actualId);
  assert.equal(value.requestedVersion, value.actualVersion);
  if (value.actualEndpoint !== undefined) assert.equal(value.endpoint, value.actualEndpoint);
}

test("D2001: one operation-keyed private constructor rejects crossed receipts", () => {
  assert.deepEqual(sealReceipt("maia.policy_page@1", "maia"), { operation: "maia.policy_page@1", provider: "maia" });
  assert.throws(() => sealReceipt("maia.policy_page@1", "stockfish" as never), /mismatch/u);
  assert.doesNotThrow(() => validateCapturedIdentity({ provider: "stockfish", requestedId: "sf", requestedVersion: "18", actualId: "sf", actualVersion: "18", endpoint: "uci", generation: 3 }));
  assert.throws(() => validateCapturedIdentity({ provider: "stockfish", requestedId: "sf", requestedVersion: "18", actualId: "other", actualVersion: "18", endpoint: "uci", generation: 3 }));
  assert.throws(() => validateCapturedIdentity({ provider: "lichess_explorer", requestedId: "explorer", requestedVersion: "1", actualId: "explorer", actualVersion: "1", endpoint: "a", actualEndpoint: "b", generation: null }));
  assert.throws(() => validateCapturedIdentity({ provider: "maia", requestedId: "maia", requestedVersion: "3", actualId: "maia", actualVersion: "3", endpoint: "uci", generation: null }));
  const receipt = section("type ProviderOperationProviderMap", "type ProviderDelivery");
  assert.match(receipt, /type ProviderRequestedIdentityMap/u);
  assert.match(receipt, /type ProviderActualIdentityMap/u);
  assert.match(receipt, /operation: K;[\s\S]*provider: ProviderOperationProviderMap\[K\]/u);
  assert.match(rfc, /module-private constructor[\s\S]*makeProviderAcquisitionReceipt/u);
  assert.doesNotMatch(receipt, /Readonly<Record/u);
});

class SharedWaiters {
  readonly deadlines = new Map<string, number>();
  aborted = false;
  add(id: string, arrival: number, budget: number): void {
    assert.ok(Number.isSafeInteger(budget) && budget > 0);
    this.deadlines.set(id, arrival + budget);
  }
  settleExpired(now: number): readonly string[] {
    const expired = [...this.deadlines].filter(([, deadline]) => deadline <= now).map(([id]) => id);
    for (const id of expired) this.deadlines.delete(id);
    if (this.deadlines.size === 0) this.aborted = true;
    return expired;
  }
  cancel(id: string): void {
    this.deadlines.delete(id);
    if (this.deadlines.size === 0) this.aborted = true;
  }
}

test("D2002: crossed waiter deadlines and cancellation settle locally", () => {
  const work = new SharedWaiters();
  work.add("short", 100, 10); work.add("long", 101, 100);
  assert.deepEqual(work.settleExpired(110), ["short"]);
  assert.equal(work.aborted, false); assert.deepEqual([...work.deadlines.keys()], ["long"]);
  work.cancel("missing"); assert.equal(work.aborted, false);
  work.cancel("long"); assert.equal(work.aborted, true);
  const reversed = new SharedWaiters();
  reversed.add("long-first", 200, 100); reversed.add("short-after-dispatch", 220, 5);
  assert.deepEqual(reversed.settleExpired(225), ["short-after-dispatch"]);
  assert.equal(reversed.aborted, false); assert.deepEqual([...reversed.deadlines.keys()], ["long-first"]);
  const scheduler = section("### 4. Shared bounded scheduler", "### 5. Stockfish legal-root source");
  assert.match(scheduler, /retained entry; otherwise join an equal pending key;\s*otherwise reject when the new-job queue is full/u);
  assert.match(scheduler, /firstArrival \+ request\.timeoutMs/u);
  assert.match(scheduler, /shorter waiter[\s\S]*longer waiter remains joined/u);
});

type Entry = { key: string; weight: number; served: number; stale?: boolean; expired?: boolean };
function admit(entries: readonly Entry[], candidate: Entry, maxEntries: number, maxWeight: number): readonly Entry[] {
  assert.ok(Number.isSafeInteger(candidate.weight) && candidate.weight >= 1);
  let kept = entries.filter((entry) => !entry.stale && !entry.expired);
  if (candidate.weight > maxWeight) return kept;
  kept = [...kept, candidate];
  const order = (a: Entry, b: Entry) => a.served - b.served || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  while (kept.length > maxEntries || kept.reduce((sum, entry) => sum + entry.weight, 0) > maxWeight) {
    const victim = [...kept].sort(order)[0]!;
    kept = kept.filter((entry) => entry !== victim);
  }
  return kept;
}

test("D2003: retention enforces positive weight plus deterministic entry and weight caps", () => {
  const initial = [{ key: "b", weight: 2, served: 1 }, { key: "a", weight: 2, served: 1 }];
  assert.deepEqual(admit(initial, { key: "c", weight: 1, served: 2 }, 2, 10).map((entry) => entry.key), ["b", "c"]);
  assert.deepEqual(admit(initial, { key: "c", weight: 3, served: 2 }, 3, 5).map((entry) => entry.key), ["b", "c"]);
  assert.deepEqual(admit([{ key: "stale", weight: 1, served: 0, stale: true }], { key: "new", weight: 1, served: 1 }, 1, 1).map((entry) => entry.key), ["new"]);
  assert.throws(() => admit([], { key: "zero", weight: 0, served: 0 }, 1, 1));
  assert.deepEqual(admit([], { key: "heavy", weight: 2, served: 0 }, 1, 1), []);
  assert.match(rfc, /maxRetainedEntries/u); assert.match(rfc, /positive safe integer \(`>= 1`\)/u);
});

type SyzygyDomain = { kind: "outside_domain"; pieceCount: number; maximumPieceCount: 7 } | { kind: "in_domain"; position: "win" | "draw" | "loss" };
function syzygy(pieceCount: number, outcome: "win" | "draw" | "loss"): SyzygyDomain {
  return pieceCount > 7 ? { kind: "outside_domain", pieceCount, maximumPieceCount: 7 } : { kind: "in_domain", position: outcome };
}

test("D2004: Syzygy domain abstention is a result arm, not failure or outcome", () => {
  const outside = syzygy(8, "draw"); const draw = syzygy(7, "draw");
  const failure = { kind: "source_failure", reason: "provider_unavailable" } as const;
  assert.deepEqual(outside, { kind: "outside_domain", pieceCount: 8, maximumPieceCount: 7 });
  assert.deepEqual(draw, { kind: "in_domain", position: "draw" });
  assert.notEqual(outside.kind, draw.kind); assert.notEqual(outside.kind, failure.kind); assert.notEqual(draw.kind, failure.kind);
  const syzygySection = section("### 7. Syzygy position source", "### 8. Explorer position source");
  assert.match(syzygySection, /type SyzygyPositionDomainResult[\s\S]*kind: "outside_domain"/u);
  assert.match(syzygySection, /without calling Syzygy/u);
});

test("D2005: Explorer source discloses population limits without deciding suitability", () => {
  const explorer = section("interface ExplorerPopulationSummary", "type ExplorerPopulationSummaryWire");
  assert.match(explorer, /readonly disclosure:[\s\S]*guard: "CORPUS_GUARD"[\s\S]*statement: typeof CORPUS_GUARD/u);
  assert.doesNotMatch(explorer, /accepted|suitability|threshold/u);
  assert.match(rfc, /consumers must each name and test any population threshold/u);
});

function fixedCommands(fen: string, go: string): readonly string[] {
  return Object.freeze([
    "setoption name MultiPV value 1",
    "setoption name UCI_ShowWDL value true",
    `position fen ${fen}`,
    `go ${go}`,
  ]);
}
function requireCommands(actual: readonly string[], expected: readonly string[]): void {
  assert.deepEqual(actual, expected);
}

test("D2006: descriptors own exact Stockfish command and reset images", () => {
  const expected = [
    "setoption name MultiPV value 1", "setoption name UCI_ShowWDL value true",
    "position fen 8/8/8/8/8/8/K6k/8 w - - 0 1", "go depth 12",
  ];
  requireCommands(fixedCommands("8/8/8/8/8/8/K6k/8 w - - 0 1", "depth 12"), expected);
  assert.throws(() => requireCommands(expected.filter((line) => !line.includes("UCI_ShowWDL")), expected));
  assert.throws(() => requireCommands(expected.map((line) => line.replace("value true", "value false")), expected));
  const stockfish = section("### 5. Stockfish legal-root source", "### 6. Maia policy-page source");
  assert.doesNotMatch(stockfish, /readonly normalizedCommandsDigest/u);
  assert.match(stockfish, /setoption name UCI_ShowWDL value true/u);
  assert.match(stockfish, /finally[\s\S]*MultiPV 1[\s\S]*UCI_ShowWDL false[\s\S]*readyok/u);
});

type Info = { task: number; depth: number; multipv: number; score?: number; wdl?: readonly [number, number, number]; bounded?: boolean; afterBestmove?: boolean; order: number };
function reduce(lines: readonly Info[], task: number, bound: { kind: "depth"; value: number } | { kind: "time" }): Info {
  const admissible = lines.filter((line) => line.task === task && !line.afterBestmove && line.multipv === 1 && !line.bounded && line.score !== undefined && line.wdl !== undefined);
  const candidates = bound.kind === "depth" ? admissible.filter((line) => line.depth === bound.value) : admissible;
  candidates.sort((a, b) => a.depth - b.depth || a.order - b.order);
  assert.ok(candidates.length > 0, "no completed line");
  return candidates.at(-1)!;
}

test("D2007: iterative reducer selects one same-line score/WDL and excludes other tasks", () => {
  const lines: Info[] = [
    { task: 1, depth: 20, multipv: 1, score: 99, wdl: [1, 2, 997], order: 0 },
    { task: 2, depth: 10, multipv: 1, score: 10, wdl: [400, 300, 300], order: 1 },
    { task: 2, depth: 12, multipv: 2, score: 20, wdl: [500, 250, 250], order: 2 },
    { task: 2, depth: 12, multipv: 1, score: 30, wdl: [600, 200, 200], order: 3 },
    { task: 2, depth: 12, multipv: 1, score: 40, wdl: [650, 175, 175], order: 4 },
    { task: 2, depth: 13, multipv: 1, score: 45, wdl: [675, 162, 163], bounded: true, order: 5 },
    { task: 2, depth: 14, multipv: 1, score: 46, order: 6 },
    { task: 2, depth: 14, multipv: 1, wdl: [680, 160, 160], order: 7 },
    { task: 2, depth: 15, multipv: 1, score: 50, wdl: [700, 150, 150], afterBestmove: true, order: 8 },
  ];
  assert.equal(reduce(lines, 2, { kind: "depth", value: 12 }).score, 40);
  assert.equal(reduce(lines, 2, { kind: "time" }).score, 40);
  assert.throws(() => reduce(lines, 3, { kind: "time" }), /no completed/u);
  assert.match(rfc, /greatest reported depth, breaking equal-depth ties by latest arrival/u);
});

function canonical(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    assert.ok(Number.isFinite(value));
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  assert.equal(Object.getPrototypeOf(value), Object.prototype);
  return `{${Object.keys(value as object).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
}
function providerDigest(domain: string, image: unknown): string {
  return `sha256:${createHash("sha256").update(`tabiya/${domain}\0${canonical(image)}`, "utf8").digest("hex")}`;
}

test("D2008: provider digest bytes are canonical and domain separated", () => {
  const a = providerDigest("provider.request.v1", { operation: "maia", request: { b: 2, a: 1 } });
  const reordered = providerDigest("provider.request.v1", { request: { a: 1, b: 2 }, operation: "maia" });
  assert.equal(a, reordered);
  assert.notEqual(a, providerDigest("provider.actual.v1", { operation: "maia", request: { a: 1, b: 2 } }));
  assert.notEqual(a, providerDigest("provider.request.v1", { operation: "syzygy", request: { a: 1, b: 2 } }));
  const decimal = providerDigest("provider.request.v1", { operation: "maia", temperature: 0.8, topP: 0.95, zero: -0 });
  assert.equal(decimal, providerDigest("provider.request.v1", { zero: 0, topP: 0.95, temperature: 0.8, operation: "maia" }));
  assert.notEqual(decimal, providerDigest("provider.request.v1", { operation: "maia", temperature: 0.81, topP: 0.95, zero: 0 }));
  const response = providerDigest("provider.response.v1", { operation: "maia", provider: "maia", contentEncoding: "http-body", bodyBase64: "YQ==" });
  assert.notEqual(response, providerDigest("provider.response.v1", { operation: "maia", provider: "maia", contentEncoding: "http-body", bodyBase64: "Yg==" }));
  assert.notEqual(response, providerDigest("provider.request.v1", { operation: "maia", provider: "maia", contentEncoding: "http-body", bodyBase64: "YQ==" }));
  assert.match(a, /^sha256:[0-9a-f]{64}$/u);
  assert.match(rfc, /UTF8\("tabiya\/" \+ domain \+ "\\u0000"\)/u);
  assert.match(rfc, /RFC 8785 JSON Canonicalization Scheme/u);
  for (const domain of ["commands", "request", "pending", "actual", "response", "path"]) assert.match(rfc, new RegExp(`provider\\.${domain}\\.v1`));
});
