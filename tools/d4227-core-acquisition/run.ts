// DISPOSABLE D4227 raw source feasibility. Nothing here issues candidate/outcome authority.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { CandidatePopulationService } from "../../apps/server/src/candidate-population-service.js";
import { GUIDED_HINT_PROFILE } from "../../apps/server/src/application.js";
import { assertCandidatePopulationReceipt, readCandidateFoundationSources } from "../../packages/runtime/src/candidate-population.js";
import { evidenceValueReceipt, isDeclaredEvidence, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { SUBJECT_OUTCOME_FACTORIES, readSubjectOutcomeInvocation, readSubjectOutcomePopulation } from "../../packages/runtime/src/evidence-factories.js";
import { readCandidateUnavailableSources } from "../../packages/runtime/src/semantic-source-availability.js";
import { computeSubjectOutcomes, type ComputedSubjectOutcomes } from "../../packages/runtime/src/semantic-subject-outcomes.js";
import { SUBJECT_OUTCOME_FAMILIES, type SubjectOutcomeFamily } from "../../packages/runtime/src/semantic-subject-types.js";
import { assertWide, LITERAL_POSITIONS, reviewPositions, type Position, type Receipt } from "../d4175-outcome-delivery/workload.js";
import { HOOK_KEY, type RawCoreFrame, type ResearchHooks } from "./types.js";

const hooks = Reflect.get(globalThis, HOOK_KEY) as ResearchHooks | undefined;
assert(hooks && typeof hooks.acquire === "function" && typeof hooks.compute === "function", "Actual append-only research bundle required");
const research: ResearchHooks = hooks;
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
function wide(service: CandidatePopulationService, fen: string): Receipt {
  const result = service.wide(fen);
  if (result.kind !== "ready") throw Error(JSON.stringify(result.error)); assertWide(result.receipt); return result.receipt;
}
function requiredGraph(frame: RawCoreFrame) {
  return { legal: frame.legalMovesInput, root: frame.root,
    candidates: frame.candidates.map(row => ({ move: row.move, row: { moveUci: row.row.moveUci, afterFen: row.row.afterFen }, position: row.position })) };
}
function receiptsAndValues(value: unknown) {
  const seen = new Set<object>(), receipts: unknown[] = [];
  const walk = (current: unknown): void => {
    if (current === null || typeof current !== "object" || seen.has(current)) return;
    seen.add(current); if (isDeclaredEvidence(current)) receipts.push(evidenceValueReceipt(current));
    Object.values(current).forEach(walk);
  };
  walk(value); return { value, receipts };
}
function inputMembers(frame: RawCoreFrame): Set<DeclaredEvidence<unknown>> {
  const values = new Set<DeclaredEvidence<unknown>>(), seen = new Set<object>();
  const walk = (current: unknown): void => {
    if (current === null || typeof current !== "object" || seen.has(current)) return;
    seen.add(current); if (isDeclaredEvidence(current)) values.add(current);
    Object.values(current).forEach(walk);
  }; walk(frame); return values;
}
function summary(family: SubjectOutcomeFamily, computed: ComputedSubjectOutcomes<SubjectOutcomeFamily>) {
  return computed.kind === "unavailable" ? { family, kind: computed.kind, reason: computed.reason }
    : { family, kind: computed.kind, payloads: computed.payloads.length, subjects: computed.population.subjects.length, inputs: computed.inputs.length };
}
function equality(smoke: boolean) {
  const rows = smoke ? LITERAL_POSITIONS : [...LITERAL_POSITIONS, ...reviewPositions()];
  const service = new CandidatePopulationService({ capacity: GUIDED_HINT_PROFILE.packetCapacity });
  let unavailableFamilies = 0, quietFamilies = 0, positiveFamilies = 0, legacyFailures = 0;
  const records = rows.map(row => {
    const receipt = wide(service, row.fen), full = readCandidateFoundationSources(receipt), core = research.acquire(row.fen);
    const fullFrame = { legalMovesInput: receipt.legalMovesInput, ...full };
    const coreGraph = receiptsAndValues(requiredGraph(core)), fullGraph = receiptsAndValues(requiredGraph(fullFrame));
    assert.deepEqual(coreGraph, fullGraph, `${row.id}: complete required foundation graph/value receipts`);
    assert.strictEqual(core.root.common[0], core.legalMovesInput);
    const originalMoves = core.legalMovesInput.payload.pieces.flatMap(piece => piece.moves);
    assert.equal(core.candidates.length, originalMoves.length);
    core.candidates.forEach((candidate, index) => assert.strictEqual(candidate.move, originalMoves[index]));
    assert.throws(() => assertCandidatePopulationReceipt(core), "Raw research frame must never be a candidate receipt");
    const failures = readCandidateUnavailableSources(receipt);
    legacyFailures += failures.filter(failure => failure.cause.kind === "candidate_collector").length;
    const members = inputMembers(core), outcomeDigest = createHash("sha256");
    const families = SUBJECT_OUTCOME_FAMILIES.map(family => {
      const route = `derived.semantic_avoidance.${family}@2` as const, factory = SUBJECT_OUTCOME_FACTORIES[route];
      const move = row.move ?? "a1a2";
      assert.throws(() => factory({ receipt: core as never, moveUci: move }), "Raw frame cannot authorize a real factory");
      if (row.move === null) {
        assert.equal(core.candidates.length, 0);
        assert.throws(() => computeSubjectOutcomes(family, receipt, move));
        assert.throws(() => research.compute(family, core, move));
        outcomeDigest.update(JSON.stringify({ family, kind: "no_played_member" }));
        return { family, kind: "no_played_member" as const };
      }
      const original = computeSubjectOutcomes(family, receipt, move), raw = research.compute(family, core, move);
      assert.deepEqual(receiptsAndValues(raw), receiptsAndValues(original), `${row.id}/${family}: all raw payload/input/population bytes and receipts`);
      outcomeDigest.update(JSON.stringify({ family, result: receiptsAndValues(raw) }));
      const result = factory({ receipt, moveUci: move }), population = readSubjectOutcomePopulation(family, result);
      assert.equal(result.kind, original.kind); assert.equal(population.kind, original.kind);
      if (original.kind === "available" && raw.kind === "available" && result.kind === "available" && population.kind === "available") {
        assert.deepEqual(result.values.map(value => value.payload), original.payloads);
        assert.deepEqual(population.population, original.population);
        assert.deepEqual(readSubjectOutcomeInvocation(result).inputs, original.inputs);
        const repeated = research.compute(family, core, move); assert.equal(repeated.kind, "available");
        if (repeated.kind !== "available") throw Error("Repeated raw result unavailable");
        raw.inputs.forEach((input, index) => {
          assert(members.has(input), "Raw result must use the core's ORIGINAL prerequisite objects");
          assert.strictEqual(repeated.inputs[index], input);
        });
        for (const payload of raw.payloads) assert(!isDeclaredEvidence(payload), "Raw calculation must not mint evidence");
        assert.throws(() => readSubjectOutcomeInvocation(raw as never), "Raw result has no factory membership");
        if (raw.payloads.length === 0) quietFamilies++; else positiveFamilies++;
      } else {
        assert.equal(raw.kind, "unavailable"); unavailableFamilies++;
      }
      return summary(family, raw);
    });
    return { id: row.id, candidates: core.candidates.length, graphDigest: hash(coreGraph), outcomeDigest: outcomeDigest.digest("hex"),
      requiredRiskFailures: [core.root, ...core.candidates.map(candidate => candidate.position)].filter(position => position.risk.kind === "unavailable").length,
      legacyCollectorFailureGroups: failures.filter(failure => failure.cause.kind === "candidate_collector").length, families };
  });
  assert(unavailableFamilies > 0 && quietFamilies > 0 && positiveFamilies > 0 && legacyFailures > 0);
  assert.throws(() => research.acquire("not a fen"));
  assert.equal(service.wide("not a fen").kind, "failed");
  const extra = research.acquire(LITERAL_POSITIONS[0]!.fen);
  assert.throws(() => research.compute("open_file", extra, "a1a8"));
  return { records, totals: { positions: rows.length, unavailableFamilies, quietFamilies, positiveFamilies, legacyCollectorFailureGroups: legacyFailures },
    limits: "Required core graph and all thirteen raw/factory outputs match this workload. Unrequested legacy event/readings/failure images are NOT reproduced or authorized." };
}
async function settledHeap() {
  assert(typeof globalThis.gc === "function", "Run the named Make command with its explicit measurement GC setup");
  globalThis.gc(); await new Promise<void>(resolve => setImmediate(resolve)); globalThis.gc();
  return process.memoryUsage().heapUsed / 1024 / 1024;
}
async function timed(arm: "full" | "core", smoke: boolean) {
  const rows: readonly Position[] = smoke ? LITERAL_POSITIONS.filter(row => row.move !== null).slice(0, 2) : reviewPositions();
  assert.equal(rows.length, smoke ? 2 : 32);
  const initialHeapMiB = await settledHeap();
  let service: CandidatePopulationService | undefined = arm === "full" ? new CandidatePopulationService({ capacity: GUIDED_HINT_PROFILE.packetCapacity }) : undefined;
  const retained: RawCoreFrame[] = [];
  const start = performance.now();
  const decisions = rows.map(row => {
    assert(row.move !== null);
    const receipt = service === undefined ? undefined : wide(service, row.fen);
    const core = receipt === undefined ? research.acquire(row.fen) : undefined;
    if (core !== undefined) retained.push(core);
    return { id: row.id, candidates: receipt?.packet.candidates.length ?? core!.candidates.length,
      families: SUBJECT_OUTCOME_FAMILIES.map(family => summary(family,
        receipt === undefined ? research.compute(family, core!, row.move!) : computeSubjectOutcomes(family, receipt, row.move!))) };
  });
  const sourceMs = performance.now() - start;
  const heldHeapMiB = await settledHeap();
  // Read the ACTUAL owner after held GC, establishing liveness through that checkpoint.
  const retainedFrames = service?.stats().retained ?? retained.length; assert.equal(retainedFrames, rows.length);
  service = undefined; retained.length = 0;
  const releasedHeapMiB = await settledHeap();
  return { arm, decisions, sourceMs, retainedFrames, initialHeapMiB, heldHeapMiB, releasedHeapMiB };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const smoke = process.argv.includes("--smoke");
  if (process.argv.includes("--equality")) process.stdout.write(JSON.stringify(equality(smoke)));
  else if (process.argv.includes("--full") || process.argv.includes("--core"))
    process.stdout.write(JSON.stringify(await timed(process.argv.includes("--core") ? "core" : "full", smoke)));
  else {
    const run = <T>(mode: string): T => JSON.parse(execFileSync(process.execPath,
      ["--expose-gc", fileURLToPath(import.meta.url), mode, ...(smoke ? ["--smoke"] : [])],
      { encoding: "utf8", timeout: 120_000, maxBuffer: 256 * 1024 })) as T;
    const equal = run<ReturnType<typeof equality>>("--equality");
    process.stderr.write(`Complete required-core/raw/factory equality: ${equal.totals.positions} positions, all13 families.\n`);
    type Timed = Awaited<ReturnType<typeof timed>>;
    const pairs = [];
    for (let pair = 0; pair < (smoke ? 1 : 4); pair++) {
      const order: ("full" | "core")[] = pair % 2 === 0 ? ["full", "core"] : ["core", "full"];
      const a = run<Timed>(`--${order[0]}`), b = run<Timed>(`--${order[1]}`);
      assert.deepEqual(a.decisions, b.decisions); assert.equal(a.retainedFrames, b.retainedFrames);
      const full = a.arm === "full" ? a : b, core = a.arm === "core" ? a : b;
      const { decisions: _full, ...fullMetrics } = full, { decisions: _core, ...coreMetrics } = core;
      pairs.push({ pair: pair + 1, order, full: fullMetrics, core: coreMetrics });
      process.stderr.write(`Pair${pair + 1}: full ${full.sourceMs.toFixed(1)}ms / raw core ${core.sourceMs.toFixed(1)}ms.\n`);
    }
    const compactEquality = { ...equal, familyOrder: SUBJECT_OUTCOME_FAMILIES,
      familyEncoding: "available:<payload count>/<complete subject count>/<input count>; unavailable:counterfactual_population_incomplete; no_played_member",
      records: equal.records.map(({ families, ...row }) => ({ ...row, families: families.map(family => family.kind === "available"
        ? `available:${family.payloads}/${family.subjects}/${family.inputs}` : family.kind === "unavailable" ? `unavailable:${family.reason}` : family.kind) })) };
    const report = { question: "D4227 complete required-core/raw-algebra feasibility", sourceCommit: "c6fa6266", node: process.version,
      platform: process.platform, architecture: process.arch, equality: compactEquality, pairs,
      scope: "Unchanged production bodies, append-only core access and guarded raw algebra; full and core BOTH stop before outcome mint/admission; fixed original source order; paired fresh workers",
      limits: ["No candidate/factory/admission authority for raw frames or raw output", "Unrequested collector event/readings/failure images are unclaimed", "Future source-group identity/coverage/failure contract requires independent acceptance", "Research retention array is not a production service/cache", "Forced-GC heaps are not natural peaks, RSS, exact root attribution or appliance footprint", "Raw-stage source intervals are not D4224's admitted event workload or Review/API/DOM latency", "No required core/all13 outcome family omitted; no budget raised", "No raw payload recording"] };
    const text = JSON.stringify(report, null, 2) + "\n"; assert(Buffer.byteLength(text) < 64 * 1024);
    if (process.argv.includes("--write")) writeFileSync("planning/foundation-source-identity/core-acquisition-2026-11-11.json", text);
    else process.stdout.write(text);
  }
}
