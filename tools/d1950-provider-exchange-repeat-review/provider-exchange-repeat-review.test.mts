import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync(new URL("../../rfc/provider-exchange-and-execution.md", import.meta.url), "utf8");

type Receipt = Readonly<{ provider: "maia" | "lichess_explorer"; actualIdentity: string; generation: number | null; normalizedRequestDigest: string; responseDigest: string }>;
type Delivery<T> = Readonly<{ kind: "live" | "retained_exact"; acquisition: Receipt; payload: T }>;
type Declared<T> = Readonly<{ projection: string; payload: T }>;
const sealed = new WeakSet<object>();
function declare<T>(projection: string, payload: T): Declared<T> { const value = Object.freeze({ projection, payload }); sealed.add(value); return value; }
function admitted<T>(value: unknown, projection: string): Declared<T> { if (typeof value !== "object" || value === null || !sealed.has(value)) throw new TypeError("unsealed evidence"); const item = value as Declared<T>; if (item.projection !== projection) throw new TypeError("wrong projection"); return item; }

test("D1950: Maia occurrences retain the sealed delivery, not a bare page", () => {
  const delivery: Delivery<{ request: { kind: "history_conditioned" } }> = Object.freeze({ kind: "live", acquisition: Object.freeze({ provider: "maia", actualIdentity: "maia-v3", generation: 7, normalizedRequestDigest: "request", responseDigest: "response" }), payload: Object.freeze({ request: Object.freeze({ kind: "history_conditioned" as const }) }) });
  const page = declare("human.maia.policy_page@1", delivery);
  const occurrence = Object.freeze({ page: admitted<typeof delivery>(page, "human.maia.policy_page@1"), runId: "run" });
  assert.equal(occurrence.page, page); assert.equal(occurrence.page.payload.acquisition.generation, 7);
  assert.throws(() => admitted(delivery, "human.maia.policy_page@1"), /unsealed/u);
  assert.match(rfc, /DeclaredEvidence<\s*ProviderEvidenceDelivery<MaiaPolicyPage, "maia\.policy_page@1">\s*>/u); assert.doesNotMatch(rfc, /readonly page: MaiaPolicyPage;/u);
});

type HistoryRequest = Readonly<{ kind: "disabled" }> | Readonly<{ kind: "requested" }>;
function historyResult(request: HistoryRequest, rows: readonly string[]): Readonly<{ kind: "not_requested" } | { kind: "reported"; rows: readonly string[] }> { if (request.kind === "disabled") return Object.freeze({ kind: "not_requested" as const }); return Object.freeze({ kind: "reported" as const, rows: Object.freeze([...rows]) }); }

test("D1951: Explorer history is an explicit disabled/requested union", () => {
  assert.deepEqual(historyResult({ kind: "disabled" }, ["sentinel"]), { kind: "not_requested" });
  assert.deepEqual(historyResult({ kind: "requested" }, []), { kind: "reported", rows: [] });
  assert.deepEqual(historyResult({ kind: "requested" }, ["2026-08"]), { kind: "reported", rows: ["2026-08"] });
  assert.match(rfc, /type ExplorerHistoryRequest =[\s\S]*kind: "disabled"[\s\S]*kind: "requested"/u); assert.doesNotMatch(rfc, /historyWidth|requested"; readonly width/u);
  assert.match(rfc, /literal `history=false\|true`/u);
});

test("D1952: all five operations have one context-bearing descriptor entry", () => {
  assert.match(rfc, /Each of the five named `\*Operation` exports implements its exact/u);
  assert.match(rfc, /There is no second public `execute\(identity,[\s\S]*signal\)` overload/u);
  assert.doesNotMatch(rfc, /Operation\.execute\(request, signal\)/u);
});

type LeafState = "satisfied_build_time" | "satisfied_recorded" | "satisfied_live" | "satisfied_retained" | "reachable_live" | "unsatisfied";
type PathState = "satisfied_local" | "satisfied_sources" | "reachable_live" | "unsatisfied";
function pathState(states: readonly LeafState[]): PathState { if (states.length === 0) return "satisfied_local"; if (states.every((state) => state.startsWith("satisfied_"))) return "satisfied_sources"; if (states.every((state) => state.startsWith("satisfied_") || state === "reachable_live") && states.includes("reachable_live")) return "reachable_live"; return "unsatisfied"; }

test("D1953: mixed-source availability reduces totally without hiding leaves", () => {
  assert.equal(pathState([]), "satisfied_local"); assert.equal(pathState(["satisfied_recorded", "satisfied_retained"]), "satisfied_sources");
  assert.equal(pathState(["satisfied_recorded", "reachable_live"]), "reachable_live"); assert.equal(pathState(["satisfied_retained", "unsatisfied"]), "unsatisfied"); assert.equal(pathState(["reachable_live", "unsatisfied"]), "unsatisfied");
  assert.match(rfc, /readonly sources: readonly \{/u); assert.match(rfc, /any `unsatisfied` leaf makes the path `unsatisfied`/u);
});

const digest = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");
function pendingIdentity(request: unknown): Readonly<{ operation: "maia.policy_page@1"; normalizedRequestDigest: string }> { return Object.freeze({ operation: "maia.policy_page@1", normalizedRequestDigest: digest(request) }); }
function retainedIdentity(pending: ReturnType<typeof pendingIdentity>, actualIdentity: string, generation: number): Readonly<{ pending: ReturnType<typeof pendingIdentity>; actualIdentityDigest: string; generation: number }> { return Object.freeze({ pending, actualIdentityDigest: digest(actualIdentity), generation }); }

test("D1954: pending request identity and retained actual identity cannot alias", () => {
  const pending = pendingIdentity(Object.freeze({ model: "requested-v3", fen: "fen", width: 8 })); const first = retainedIdentity(pending, "actual-a", 1); const restarted = retainedIdentity(pending, "actual-a", 2); const changedModel = retainedIdentity(pending, "actual-b", 1);
  assert.deepEqual(first.pending, restarted.pending); assert.notEqual(first.generation, restarted.generation); assert.notEqual(first.actualIdentityDigest, changedModel.actualIdentityDigest);
  assert.match(rfc, /interface ProviderPendingIdentity/u); assert.match(rfc, /interface ProviderRetainedIdentity/u); assert.match(rfc, /Actual identity is never part of request coalescing/u);
});

test("D1955: Explorer summary retains internal provenance while exact wire drops move rows", () => {
  const delivery: Delivery<{ result: { totals: { white: number; draws: number; black: number; total: number }; moves: readonly { canonicalSan: string }[] } }> = Object.freeze({ kind: "retained_exact", acquisition: Object.freeze({ provider: "lichess_explorer", actualIdentity: "https://explorer", generation: null, normalizedRequestDigest: "request", responseDigest: "response" }), payload: Object.freeze({ result: Object.freeze({ totals: Object.freeze({ white: 1, draws: 2, black: 3, total: 6 }), moves: Object.freeze([Object.freeze({ canonicalSan: "RAW_MOVE_SENTINEL" })]) }) }) });
  const page = declare("human.explorer.position_page@1", delivery); const summary = Object.freeze({ page, totals: delivery.payload.result.totals }); const wire = Object.freeze({ totals: summary.totals, source: Object.freeze({ provider: delivery.acquisition.provider, normalizedRequestDigest: delivery.acquisition.normalizedRequestDigest, responseDigest: delivery.acquisition.responseDigest, delivery: delivery.kind }) });
  assert.equal(summary.page, page); assert.doesNotMatch(JSON.stringify(wire), /RAW_MOVE_SENTINEL/u); assert.doesNotMatch(JSON.stringify(wire), /moves/u);
  assert.match(rfc, /interface ExplorerPopulationSummary/u); assert.match(rfc, /type ExplorerPopulationSummaryWire/u); assert.match(rfc, /function explorerPopulationSummaryWire/u);
});

test("D1956: played occurrence is ordered after the exact recorded edge", () => {
  assert.match(rfc, /played_move_occurrence@1` does \*\*not\*\* land here \(\[\[D1956\]\]\)/u); assert.match(rfc, /successor join depends on[\s\S]*`run\.record\.edge@1`/u); assert.doesNotMatch(rfc, /function deriveExplorerPlayedMoveOccurrence/u);
});
