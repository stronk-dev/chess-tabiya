// DISPOSABLE author-repair contract for D2097-D2104. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return rfc.slice(from, to);
}

function scopeProjectable(source, target) {
  if (source === "wide") return ["wide", "events", "readings"].includes(target);
  return source === target;
}

class AdmissionModel {
  constructor(maxConcurrent, maxPending) {
    this.maxConcurrent = maxConcurrent;
    this.maxPending = maxPending;
    this.active = [];
    this.pending = [];
    this.closed = false;
  }
  get(key) {
    if (this.closed) return "service_closed";
    if (this.active.includes(key) || this.pending.includes(key)) return "joined";
    if (this.active.length < this.maxConcurrent) { this.active.push(key); return "started"; }
    if (this.pending.length < this.maxPending) { this.pending.push(key); return "queued"; }
    return "overloaded";
  }
  settle(key) {
    this.active = this.active.filter((item) => item !== key);
    const next = this.pending.shift();
    if (next !== undefined) this.active.push(next);
    return next;
  }
  close() {
    this.closed = true;
    const settled = [...this.active, ...this.pending];
    this.active = [];
    this.pending = [];
    return settled;
  }
}

const OUTCOMES = new WeakSet();
function sealOutcome(input) {
  const value = Object.freeze({ ...input });
  OUTCOMES.add(value);
  return value;
}
function admitsAbstention(outcome, row) {
  return OUTCOMES.has(outcome)
    && outcome.kind === "unavailable"
    && outcome.moveUci === row.moveUci
    && outcome.projection === row.projection
    && outcome.reason === row.reason;
}

test("D2097: request, service result and projector are one literal-scope map", () => {
  assert.match(rfc, /CandidatePopulationRequest<S extends CandidatePacketScope>/u);
  assert.match(rfc, /get<S extends CandidatePacketScope>\([\s\S]*CandidatePopulationResult<S>/u);
  assert.match(rfc, /S extends CandidatePacketScope,[\s\S]*T extends ProjectableCandidateScope<S>/u);
  assert.equal(scopeProjectable("wide", "events"), true);
  assert.equal(scopeProjectable("events", "readings"), false);
  assert.equal(scopeProjectable("readings", "wide"), false);
});

test("D2098: provider handoff is absent whole from the foundation surface", () => {
  const surface = section("### §12 — Implementation surface", "### §13 — Where each finding");
  assert.doesNotMatch(surface, /candidate-score-handoff\.ts|CandidateScoreJoinInput|ProviderEvidenceDelivery/u);
  assert.match(rfc, /creates no `candidate-score-handoff\.ts`/u);
  assert.match(rfc, /ProviderEvidenceDelivery<StockfishLegalRootTable, "stockfish\.legal_root_table">/u);
});

test("D2099: one exported factory fixes production authorities and isolates test hooks", () => {
  assert.match(rfc, /export interface CandidatePopulationService\s*\{/u);
  assert.match(rfc, /export function createCandidatePopulationService\(input:/u);
  assert.match(rfc, /product factory fixes `exactLegalMoves`, `CANDIDATE_COLLECTOR_EXECUTION`/u);
  assert.match(rfc, /module-private\s+`createCandidatePopulationServiceForTest`/u);
});

test("D2100: collector registry is a complete callable DAG, not a projection-id list", () => {
  const registry = section("export const CANDIDATE_COLLECTOR_EXECUTION", "] as const satisfies");
  const rows = [...registry.matchAll(/id: "([^"]+)"[\s\S]*?operation: ([A-Za-z]+)[\s\S]*?dependencies: \[([^\]]*)\]/gu)]
    .map((match) => ({ id: match[1], operation: match[2], dependencies: [...match[3].matchAll(/"([^"]+)"/gu)].map((item) => item[1]) }));
  assert.equal(rows.length, 13);
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
  const seen = new Set();
  for (const row of rows) {
    assert(row.operation.length > 0);
    assert(row.dependencies.every((dependency) => seen.has(dependency)), `${row.id} has forward/unknown dependency`);
    seen.add(row.id);
  }
});

test("D2101: unique work has active, FIFO pending, overload and shutdown bounds", () => {
  const model = new AdmissionModel(1, 2);
  assert.equal(model.get("a"), "started");
  assert.equal(model.get("a"), "joined");
  assert.equal(model.get("b"), "queued");
  assert.equal(model.get("c"), "queued");
  assert.equal(model.get("d"), "overloaded");
  assert.equal(model.settle("a"), "b");
  assert.deepEqual(model.close(), ["b", "c"]);
  assert.equal(model.get("e"), "service_closed");
  assert.match(rfc, /absolute enqueue deadline/u);
  assert.match(rfc, /New waiters never refresh either\s+deadline/u);
});

test("D2102: scheduler and collector failures are closed over registry identity", async () => {
  const collectorType = section("export type CandidateCollectorResult", "export type CandidatePopulationResult");
  assert.doesNotMatch(collectorType, /readonly projection: string/u);
  assert.match(collectorType, /projection: CandidateCollectorProjection/u);
  assert.match(rfc, /readonly code: "scheduler_failed"/u);
  const runYield = async (yieldControl) => {
    try { await yieldControl(); return { kind: "ready" }; }
    catch { return { kind: "failed", code: "scheduler_failed" }; }
  };
  assert.deepEqual(await runYield(async () => { throw new Error("boom"); }), { kind: "failed", code: "scheduler_failed" });
});

test("D2103: standard ruleset is explicit before FEN, job and cache construction", () => {
  const request = section("export interface CandidatePopulationRequest", "export interface CandidatePopulationReceipt");
  assert.match(request, /readonly ruleset: "standard"/u);
  assert.match(rfc, /before FEN parsing, key construction/u);
  assert.match(rfc, /ruleset = "standard"/u);
  const admit = (input) => input?.ruleset === "standard" ? "ready" : "unsupported_ruleset";
  assert.equal(admit({ ruleset: "standard" }), "ready");
  assert.equal(admit({ ruleset: "chess960" }), "unsupported_ruleset");
  assert.equal(admit({}), "unsupported_ruleset");
});

test("D2104: exact sealed outcomes authorize abstentions by move and projection", () => {
  const exact = sealOutcome({ kind: "unavailable", collectorId: "event.loose_piece", moveUci: "e2e4", projection: "rules.tactic.event.loose_piece@1", reason: "invalid_turn_clone" });
  const row = { moveUci: "e2e4", projection: "rules.tactic.event.loose_piece@1", reason: "invalid_turn_clone" };
  assert.equal(admitsAbstention(exact, row), true);
  assert.equal(admitsAbstention(exact, { ...row, moveUci: "d2d4" }), false);
  assert.equal(admitsAbstention({ ...exact }, row), false);
  assert.match(rfc, /CANDIDATE_COLLECTOR_OUTCOMES = new WeakSet/u);
  assert.match(rfc, /collectorOutcomes: readonly SealedCandidateCollectorOutcome\[\]/u);
});
