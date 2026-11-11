// DISPOSABLE D4223/D4175 research. Calls actual current factories; never a learner issuer,
// consumer binding, chess oracle, UI renderer or production timing policy. No raw dumps.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { Session } from "node:inspector/promises";
import { fileURLToPath } from "node:url";
import { CandidatePopulationService } from "../../apps/server/src/candidate-population-service.js";
import { GUIDED_HINT_PROFILE } from "../../apps/server/src/application.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";
import { selectSemanticEvidence, type SemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";
import { SUBJECT_OUTCOME_FAMILIES } from "../../packages/runtime/src/semantic-subject-types.js";
import { admitValidatedSemanticInstance } from "../../packages/runtime/src/semantic-validation-registry.js";
import { withRetainedSampling, type RetainedSampler } from "./sampling.js";
import { positions, reviewPositions, LITERAL_POSITIONS, assertWarmReuse, assertRepeatedSources, assertWide, collect, type Position, type Receipt, type Family } from "./workload.js";
export { LITERAL_POSITIONS, assertWarmReuse, assertRepeatedSources, assertWide } from "./workload.js";

interface Pass { readonly lookupMs: number; readonly totalMs: number; readonly families: readonly Family[] }
export interface Sample {
  readonly position: Position; readonly legalMoves: number; readonly terminal: string | null;
  readonly cold: Pass; readonly warm: readonly Pass[]; readonly stats: { readonly hits: number; readonly misses: number; readonly retained: number; readonly capacity: number };
  readonly rawOutcomePayloadBytes: number; readonly largestOutcomePayloadBytes: number;
  readonly selector: { readonly ms: number; readonly selected: number; readonly refused: readonly string[] } | null;
}
export function measurePosition(position: Position): Sample {
  const service = new CandidatePopulationService({ capacity: GUIDED_HINT_PROFILE.packetCapacity });
  let original: Receipt | undefined, originalEvents: readonly SemanticEvidenceEvent[] = [], initialized = false;
  const pass = (): Pass => {
    const start = performance.now(), lookup = service.wide(position.fen), lookupMs = performance.now() - start;
    if (lookup.kind !== "ready") throw Error(`${position.id}: ${JSON.stringify(lookup.error)}`);
    const receipt = lookup.receipt;
    assertWide(receipt);
    if (original === undefined) original = receipt; else assertWarmReuse(original, receipt);
    if (position.move === null) {
      assert.equal(receipt.packet.candidates.length, 0); assert(receipt.packet.terminal);
      return { lookupMs, totalMs: performance.now() - start, families: [] };
    }
    assert(receipt.packet.candidates.some(row => row.moveUci === position.move), `${position.id}: recorded move is not an original legal member`);
    const result = collect(receipt, position.move), totalMs = performance.now() - start;
    // Equality checking is diagnostic work AFTER the timed source/admission operation.
    if (!initialized) { originalEvents = result.events; initialized = true; }
    else assertRepeatedSources(originalEvents, result.events);
    return { lookupMs, totalMs, families: result.families };
  };
  const cold = pass(), warm = [pass(), pass(), pass()];
  assert(original);
  const payloads = originalEvents.map(event => JSON.stringify(event.operands));
  let selector: Sample["selector"] = null;
  if (position.move !== null) {
    const start = performance.now(), result = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, { id: "research.r2_candidate", version: 3 }, { receipt: original, moveUci: position.move });
    const ms = performance.now() - start;
    selector = { ms, selected: result.selected.length,
      refused: result.selected.filter(fact => admitValidatedSemanticInstance("event", fact.event.evidence).kind !== "admitted").map(fact => `${fact.event.projection.id}@${fact.event.projection.version}`) };
  }
  const sample: Sample = { position, legalMoves: original.packet.candidates.length, terminal: original.packet.terminal?.reason ?? null,
    cold, warm, stats: service.stats(), rawOutcomePayloadBytes: Buffer.byteLength(`[${payloads.join(",")}]`),
    largestOutcomePayloadBytes: Math.max(0, ...payloads.map(payload => Buffer.byteLength(payload))), selector };
  assertSample(sample); return sample;
}

export function assertSample(sample: Sample): void {
  const finite = (n: number) => assert(Number.isFinite(n) && n >= 0, "Timing/count must be finite and nonnegative");
  assert.equal(sample.stats.misses, 1); assert.equal(sample.stats.hits, 3); assert.equal(sample.stats.retained, 1);
  assert.equal(sample.stats.capacity, GUIDED_HINT_PROFILE.packetCapacity);
  assert.equal(sample.warm.length, 3);
  const expected = sample.position.move === null ? [] : [...SUBJECT_OUTCOME_FAMILIES];
  for (const pass of [sample.cold, ...sample.warm]) {
    finite(pass.lookupMs); finite(pass.totalMs); assert(pass.totalMs >= pass.lookupMs);
    assert.deepEqual(pass.families.map(row => row.family), expected, "Every nonterminal pass must execute all13 families in order");
    for (const row of pass.families) {
      assert(["available", "unavailable"].includes(row.kind)); finite(row.events); assert(Number.isSafeInteger(row.events));
      finite(row.sourceMs); finite(row.admissionMs); if (row.kind === "unavailable") assert.equal(row.events, 0);
    }
    assert.deepEqual(pass.families.map(({ family, kind, events }) => ({ family, kind, events })), sample.cold.families.map(({ family, kind, events }) => ({ family, kind, events })));
  }
  if (sample.position.move === null) { assert.equal(sample.legalMoves, 0); assert(sample.terminal); assert.equal(sample.selector, null); }
  else {
    assert(sample.legalMoves > 0); assert.equal(sample.terminal, null); assert(sample.selector);
    finite(sample.selector.ms); finite(sample.selector.selected); assert(Number.isSafeInteger(sample.selector.selected));
    assert(sample.selector.refused.length <= sample.selector.selected);
  }
  finite(sample.rawOutcomePayloadBytes); finite(sample.largestOutcomePayloadBytes);
}

/** One real game's32 consecutive decisions in ONE process/service. Source-only cost, not
 * an implemented Review query or budget waiver. No artificial warm repetitions between rows. */
function measureReviewBatch(workload: readonly Position[]) {
  assert.equal(workload.length, 32); assert.equal(new Set(workload.map(row => row.fen)).size, 32);
  const service = new CandidatePopulationService({ capacity: GUIDED_HINT_PROFILE.packetCapacity });
  const rssBeforeBytes = process.memoryUsage.rss(), start = performance.now();
  const rows = workload.map(position => {
    assert(position.move !== null);
    const began = performance.now(), lookup = service.wide(position.fen), lookupMs = performance.now() - began;
    if (lookup.kind !== "ready") throw Error(JSON.stringify(lookup.error)); assertWide(lookup.receipt);
    const result = collect(lookup.receipt, position.move);
    const totalMs = performance.now() - began;
    return { id: position.id, lookupMs, totalMs, rssAfterBytes: process.memoryUsage.rss(),
      legalMoves: lookup.receipt.packet.candidates.length, events: result.events.length,
      unavailable: result.families.filter(row => row.kind === "unavailable").map(row => row.family) };
  });
  const totalMs = performance.now() - start;
  assert.equal(service.stats().misses, 32); assert.equal(service.stats().hits, 0);
  return { scope: "one imported game, plies9–40, current application cache capacity, all13 sources/admission per decision; sampled RSS after each row; no selection/API/DOM", totalMs, rssBeforeBytes, stats: service.stats(), rows };
}

interface MemoryCase {
  readonly capacity: number; readonly workMs: number;
  readonly observer: { readonly held: true; readonly released: true };
  readonly stats: ReturnType<CandidatePopulationService["stats"]>;
  readonly aliveRetained: number; readonly aliveReleased: number;
  readonly memory: Readonly<Record<"before" | "afterWork" | "retainedGc" | "releasedGc", NodeJS.MemoryUsage>>;
  readonly rows: readonly { readonly id: string; readonly legalMoves: number; readonly families: readonly Pick<Family, "family" | "kind" | "events">[] }[];
  readonly memoClears?: readonly MemoClear[];
  readonly allocationSampling?: { readonly control: { readonly heldBytes: number; readonly releasedBytes: number }; readonly result: Awaited<ReturnType<RetainedSampler["stop"]>> };
  readonly immutablePulse?: { readonly before: NodeJS.MemoryUsage; readonly afterNoop: NodeJS.MemoryUsage; readonly afterPulse: NodeJS.MemoryUsage; readonly afterReset?: NodeJS.MemoryUsage; readonly counts: CacheCounts };
}
export const MEMO_NAMES = ["readings", "factories", "positions"] as const;
type MemoName = (typeof MEMO_NAMES)[number];
type CacheCounts = Readonly<Record<MemoName, readonly { readonly name: string; readonly entries: number }[]>>;
interface MemoProbe { readonly counts: () => CacheCounts[MemoName]; readonly clear: () => void }
interface MemoClear { readonly cleared: MemoName; readonly before: CacheCounts; readonly after: CacheCounts; readonly memory: NodeJS.MemoryUsage; readonly aliveReceipts: number }
export function memoProbes(): Readonly<Record<MemoName, MemoProbe>> {
  const raw = Reflect.get(globalThis, "__TABIYA_RESEARCH_MEMO_PROBES__") as Partial<Record<MemoName, MemoProbe>> | undefined;
  assert(raw, "D4225 actual private-cache probes are absent; use the diagnostic build");
  assert.deepEqual(Object.keys(raw).sort(), [...MEMO_NAMES].sort());
  for (const name of MEMO_NAMES) assert(typeof raw[name]?.counts === "function" && typeof raw[name]?.clear === "function");
  return raw as Readonly<Record<MemoName, MemoProbe>>;
}
function cacheCounts(probes: Readonly<Record<MemoName, MemoProbe>>): CacheCounts {
  return { readings: probes.readings.counts(), factories: probes.factories.counts(), positions: probes.positions.counts() };
}
function memoryStream(service: CandidatePopulationService, workload: readonly Position[]) {
  const references: WeakRef<Receipt>[] = [];
  const rows = workload.map(position => {
    assert(position.move !== null);
    const lookup = service.wide(position.fen); if (lookup.kind !== "ready") throw Error(JSON.stringify(lookup.error));
    assertWide(lookup.receipt); references.push(new WeakRef(lookup.receipt));
    const result = collect(lookup.receipt, position.move);
    return { id: position.id, legalMoves: lookup.receipt.packet.candidates.length,
      families: result.families.map(({ family, kind, events }) => ({ family, kind, events })) };
  });
  // Rows retain no receipt/event/closure. WeakRef CREATION temporarily keeps targets alive
  // until this synchronous job ends, so workMs/afterWork are observer-influenced diagnostics.
  return { rows, references };
}
async function collectedMemory(): Promise<NodeJS.MemoryUsage> {
  assert(typeof global.gc === "function", "Memory worker requires --expose-gc");
  // WeakRef creation AND dereference keep a target alive until the job ends. End the job
  // BEFORE each GC; do not confuse this research observer with a retaining source cache.
  for (let i = 0; i < 3; i++) { await new Promise<void>(resolve => setImmediate(resolve)); global.gc(); }
  return process.memoryUsage();
}
async function measureMemoryCase(workload: readonly Position[], capacity: number, clearOrder?: readonly MemoName[], sampleLive = false, metadataPulse = false, metadataReset = false): Promise<MemoryCase> {
  const probes = clearOrder === undefined ? undefined : memoProbes(); // Refuse absent hooks BEFORE any source work.
  const pulse = metadataPulse ? Reflect.get(globalThis, "__TABIYA_RESEARCH_IMMUTABLE_PULSE__") as (() => boolean) | undefined : undefined;
  if (metadataPulse) assert(probes && typeof pulse === "function", "Actual immutable-data pulse hook must exist before source work");
  const reset = metadataReset ? immutableReset() : undefined;
  if (clearOrder !== undefined) assert.deepEqual([...clearOrder].sort(), [...MEMO_NAMES].sort());
  assert.equal(new Set(workload.map(row => row.fen)).size, workload.length);
  let control: object | undefined = Object.freeze({ observerControl: true });
  const weakControl = new WeakRef(control);
  await collectedMemory(); assert.strictEqual(weakControl.deref(), control, "Observer must see a genuinely held target");
  control = undefined;
  await collectedMemory(); assert.equal(weakControl.deref(), undefined, "Observer must not retain its own released target");
  const work = async (sampler?: RetainedSampler): Promise<MemoryCase> => {
    let service: CandidatePopulationService | undefined = new CandidatePopulationService({ capacity });
    const before = await collectedMemory(), start = performance.now();
    const { rows, references } = memoryStream(service, workload), workMs = performance.now() - start;
    const afterWork = process.memoryUsage(), retainedGc = await collectedMemory();
    const stats = service.stats(); // Keep the actual service reachable THROUGH the retained GC.
    const aliveRetained = references.filter(ref => ref.deref() !== undefined).length;
    service = undefined;
    const releasedGc = await collectedMemory(), aliveReleased = references.filter(ref => ref.deref() !== undefined).length;
    const memoClears: MemoClear[] = [];
    if (probes !== undefined && clearOrder !== undefined) for (const cleared of clearOrder) {
      const before = cacheCounts(probes); probes[cleared].clear();
      const memory = await collectedMemory(), after = cacheCounts(probes);
      assert.equal(after[cleared].reduce((n, group) => n + group.entries, 0), 0, "Actual target cache was not cleared");
      for (const other of MEMO_NAMES) if (other !== cleared) assert.deepEqual(after[other], before[other], "Intervention changed another cache");
      memoClears.push({ cleared, before, after, memory, aliveReceipts: references.filter(ref => ref.deref() !== undefined).length });
    }
    const allocationSampling = sampler === undefined ? undefined : { control: sampler.control,
      result: await sampler.stop(import.meta.url, () => readFileSync(fileURLToPath(import.meta.url), "utf8")) };
    let immutablePulse: MemoryCase["immutablePulse"];
    if (pulse !== undefined && probes !== undefined) {
      const before = await collectedMemory(), counts = cacheCounts(probes);
      const afterNoop = await collectedMemory();
      assert.equal(pulse(), true, "Real immutable-data verifier refused the non-chess insertion");
      const afterPulse = await collectedMemory();
      reset?.();
      const afterReset = reset === undefined ? undefined : await collectedMemory();
      assert.deepEqual(cacheCounts(probes), counts, "Metadata insertion changed source-map entries");
      immutablePulse = { before, afterNoop, afterPulse, ...(afterReset === undefined ? {} : { afterReset }), counts };
    }
    const result = { capacity, workMs, observer: { held: true as const, released: true as const }, stats, aliveRetained, aliveReleased,
      memory: { before, afterWork, retainedGc, releasedGc }, rows, ...(probes === undefined ? {} : { memoClears }),
      ...(allocationSampling === undefined ? {} : { allocationSampling }), ...(immutablePulse === undefined ? {} : { immutablePulse }) };
    assertMemoryCase(result, workload.length); return result;
  };
  return sampleLive ? withRetainedSampling(collectedMemory, work) : work();
}
function immutableReset(): () => void {
  const reset = Reflect.get(globalThis, "__TABIYA_RESEARCH_IMMUTABLE_RESET__") as (() => void) | undefined;
  assert(typeof reset === "function", "Actual immutable-data reset hook must exist before source work");
  return reset;
}

function verifyImmutableReset(): void {
  const reset = immutableReset(); let cases = 0, emitted = 0;
  for (const position of LITERAL_POSITIONS.filter(row => row.move !== null)) {
    const lookup = new CandidatePopulationService({ capacity: 1 }).wide(position.fen);
    assert.equal(lookup.kind, "ready"); if (lookup.kind !== "ready") throw Error("Control needs real source");
    assertWide(lookup.receipt);
    const before = collect(lookup.receipt, position.move!);
    const receipts = before.events.map(event => evidenceValueReceipt(event.evidence));
    reset();
    // A verifier-cache miss must not revoke an original evidence value or change its receipt.
    before.events.forEach((event, index) => {
      assert.equal(admitValidatedSemanticInstance("event", event.evidence).kind, "admitted");
      assert.strictEqual(evidenceValueReceipt(event.evidence), receipts[index]);
    });
    const after = collect(lookup.receipt, position.move!);
    assertRepeatedSources(before.events, after.events);
    assert.deepEqual(after.events.map(event => evidenceValueReceipt(event.evidence)), receipts);
    const summary = (families: readonly Family[]) => families.map(({ family, kind, events }) => ({ family, kind, events }));
    assert.deepEqual(summary(after.families), summary(before.families));
    if (before.events.length > 0) assert.notStrictEqual(after.events[0]!.evidence, before.events[0]!.evidence);
    cases++; emitted += before.events.length;
  }
  assert.equal(cases, 14); assert(emitted > 0);
  process.stdout.write(`Actual verifier reset preserves all13 families across${cases} both-color controls/${emitted} emitted values.\n`);
}
export function assertMemoryCase(value: MemoryCase, subjects: number): void {
  assert(Number.isSafeInteger(value.capacity) && value.capacity > 0);
  assert.equal(value.stats.capacity, value.capacity); assert.equal(value.stats.misses, subjects); assert.equal(value.stats.hits, 0);
  assert.equal(value.stats.retained, Math.min(subjects, value.capacity));
  assert(Number.isFinite(value.workMs) && value.workMs >= 0);
  assert.equal(value.observer.held, true); assert.equal(value.observer.released, true);
  assert.equal(value.rows.length, subjects); assert.equal(new Set(value.rows.map(row => row.id)).size, subjects);
  assert(value.aliveRetained >= value.stats.retained && value.aliveRetained <= subjects);
  assert(value.aliveReleased >= 0 && value.aliveReleased <= value.aliveRetained);
  assert(Number.isSafeInteger(value.aliveRetained) && Number.isSafeInteger(value.aliveReleased));
  for (const phase of ["before", "afterWork", "retainedGc", "releasedGc"] as const) {
    const memory = value.memory[phase]; assert(memory);
    for (const field of ["rss", "heapUsed", "heapTotal", "external", "arrayBuffers"] as const) {
      assert(Number.isFinite(memory[field]) && memory[field] >= 0);
    }
  }
  for (const row of value.rows) {
    assert(Number.isSafeInteger(row.legalMoves) && row.legalMoves > 0);
    assert.deepEqual(row.families.map(family => family.family), [...SUBJECT_OUTCOME_FAMILIES]);
    for (const family of row.families) {
      assert(["available", "unavailable"].includes(family.kind)); assert(Number.isSafeInteger(family.events) && family.events >= 0);
      if (family.kind === "unavailable") assert.equal(family.events, 0);
    }
  }
}
export function assertMemoCase(value: Pick<MemoryCase, "memoClears" | "rows">, order: readonly MemoName[]): void {
  assert.deepEqual([...order].sort(), [...MEMO_NAMES].sort());
  assert.deepEqual(value.memoClears?.map(row => row.cleared), order, "Every requested actual-map intervention must execute");
  let previous: CacheCounts | undefined;
  for (const row of value.memoClears!) {
    for (const counts of [row.before, row.after]) {
      assert.deepEqual(Object.keys(counts).sort(), [...MEMO_NAMES].sort());
      for (const name of MEMO_NAMES) {
        assert(Array.isArray(counts[name]));
        assert.equal(new Set(counts[name].map(group => group.name)).size, counts[name].length);
        for (const group of counts[name]) assert(typeof group.name === "string" && group.name.length > 0 && Number.isSafeInteger(group.entries) && group.entries >= 0);
      }
    }
    if (previous !== undefined) assert.deepEqual(row.before, previous, "Cache observations must join consecutively");
    assert(row.before[row.cleared].reduce((n, group) => n + group.entries, 0) > 0, "An empty target cannot establish memory attribution");
    assert.equal(row.after[row.cleared].reduce((n, group) => n + group.entries, 0), 0);
    for (const other of MEMO_NAMES) if (other !== row.cleared) assert.deepEqual(row.after[other], row.before[other]);
    for (const field of ["rss", "heapUsed", "heapTotal", "external", "arrayBuffers"] as const) assert(Number.isFinite(row.memory[field]) && row.memory[field] >= 0);
    assert(Number.isSafeInteger(row.aliveReceipts) && row.aliveReceipts >= 0 && row.aliveReceipts <= value.rows.length);
    previous = row.after;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--immutable-reset-control")) {
    verifyImmutableReset();
  } else if (process.argv.includes("--sampler-failure-control")) {
    const session = new Session();
    await assert.rejects(withRetainedSampling(collectedMemory, async () => {
      throw new Error("controlled source-work failure after sampler startup");
    }, session), /controlled source-work failure/);
    await assert.rejects(session.post("HeapProfiler.getSamplingProfile"), { code: "ERR_INSPECTOR_NOT_CONNECTED" });
    process.stdout.write("Actual sampler disconnects after controlled work failure.\n");
  } else if (process.argv.includes("--memory-worker")) {
    const input = JSON.parse(readFileSync(0, "utf8")) as { readonly workload: readonly Position[]; readonly capacity: number; readonly clearOrder?: readonly MemoName[]; readonly sampleLive?: boolean; readonly metadataPulse?: boolean; readonly metadataReset?: boolean };
    process.stdout.write(JSON.stringify(await measureMemoryCase(input.workload, input.capacity, input.clearOrder, input.sampleLive, input.metadataPulse, input.metadataReset)));
  } else if (process.argv.includes("--memory") || process.argv.includes("--memo-probe")) {
    const probeMode = process.argv.includes("--memo-probe");
    const sampleLive = process.argv.includes("--sample-live"); assert(!sampleLive || probeMode);
    const metadataPulse = process.argv.includes("--metadata-pulse"); assert(!metadataPulse || sampleLive);
    const metadataReset = process.argv.includes("--metadata-reset"); assert(!metadataReset || metadataPulse);
    if (metadataReset) immutableReset();
    if (probeMode) memoProbes();
    const workload = process.argv.includes("--smoke") ? LITERAL_POSITIONS.slice(0, 2) : reviewPositions();
    const runs: readonly { readonly capacity: number; readonly clearOrder?: readonly MemoName[] }[] = probeMode
      ? [{ capacity: GUIDED_HINT_PROFILE.packetCapacity, clearOrder: MEMO_NAMES }, ...(sampleLive ? [] : [{ capacity: GUIDED_HINT_PROFILE.packetCapacity, clearOrder: ["factories", "readings", "positions"] as const }])]
      : [...new Set([1, 4, GUIDED_HINT_PROFILE.packetCapacity])].map(capacity => ({ capacity }));
    const cases = runs.map(run => {
      const { capacity } = run;
      const result = JSON.parse(execFileSync(process.execPath, ["--expose-gc", fileURLToPath(import.meta.url), "--memory-worker"], {
        input: JSON.stringify({ workload, ...run, sampleLive, metadataPulse, metadataReset }), encoding: "utf8", timeout: 60_000, maxBuffer: 256 * 1024,
      })) as MemoryCase;
      assertMemoryCase(result, workload.length);
      if (run.clearOrder !== undefined) assertMemoCase(result, run.clearOrder);
      if (sampleLive) {
        assert(result.allocationSampling); assert(result.allocationSampling.control.heldBytes > 0);
        assert.equal(result.allocationSampling.control.releasedBytes, 0); assert(result.allocationSampling.result.sampledLiveBytes > 0);
      }
      if (metadataPulse) assert(result.immutablePulse, "Actual metadata insertion/collection observations are absent");
      if (metadataReset) assert(result.immutablePulse?.afterReset, "Actual verifier reset/collection observations are absent");
      process.stderr.write(`capacity${capacity}: retained heap ${(result.memory.retainedGc.heapUsed / 1024 ** 2).toFixed(1)}MiB, released ${(result.memory.releasedGc.heapUsed / 1024 ** 2).toFixed(1)}MiB; live receipts ${result.aliveRetained}→${result.aliveReleased}\n`);
      return result;
    });
    for (const result of cases) assert.deepEqual(result.rows, cases[0]!.rows, "All13 family availability/event counts must survive every capacity");
    const report = { question: metadataReset ? "D4225 actual frozen-data verification-memo reset" : metadataPulse ? "D4225 real immutable-data metadata insertion" : sampleLive ? "D4225 retained allocation origins" : probeMode ? "D4225 actual global-memo intervention" : "D4225", node: process.version, v8: process.versions.v8, platform: process.platform, architecture: process.arch,
      scope: "fresh processes; identical source stream; forced GC only before/after work; service kept live then released; WeakRef observers cross jobs before GC; workMs/afterWork are observer-influenced",
      exclusions: ["production GC behavior", "peak/appliance footprint", "natural transient timing/memory (WeakRef creation keeps targets alive for the current job)", "exhaustive reachability/leak proof from surviving WeakRefs", "full semantic equality from counts alone", "production cache/default change"],
      workload, familyOrder: SUBJECT_OUTCOME_FAMILIES,
      familyResults: cases[0]!.rows.map(row => ({ id: row.id, legalMoves: row.legalMoves, families: row.families.map(family => [family.kind, family.events]) })),
      cases: cases.map(({ rows: _rows, ...result }) => result) };
    const text = JSON.stringify(report, null, 2) + "\n";
    assert(Buffer.byteLength(text) < (probeMode ? 64 : 48) * 1024, "Memory report exceeds its compact bound; never retain heap or event dumps");
    if (process.argv.includes("--write")) writeFileSync(`planning/foundation-source-identity/outcome-${metadataReset ? "immutable-reset" : metadataPulse ? "immutable-pulse" : sampleLive ? "live-allocations" : probeMode ? "global-memos" : "memory"}-2026-11-11.json`, text);
    else process.stdout.write(text);
  } else if (process.argv.includes("--worker")) {
    const input: unknown = JSON.parse(readFileSync(0, "utf8"));
    process.stdout.write(JSON.stringify(process.argv.includes("--batch") ? measureReviewBatch(input as readonly Position[]) : measurePosition(input as Position)));
  } else {
    const workload = positions(process.argv.includes("--smoke"));
    const samples = workload.map((position, i) => {
      const text = execFileSync(process.execPath, [fileURLToPath(import.meta.url), "--worker"], {
        input: JSON.stringify(position), encoding: "utf8", timeout: 60_000, maxBuffer: 256 * 1024,
      });
      const sample = JSON.parse(text) as Sample; assertSample(sample);
      process.stderr.write(`${i + 1}/${workload.length} ${position.id}: cold ${sample.cold.totalMs.toFixed(1)}ms, warm ${Math.max(...sample.warm.map(pass => pass.totalMs)).toFixed(1)}ms\n`);
      return sample;
    });
    // Retain only bounded numeric summaries. Full event payloads/receipts NEVER leave workers.
    const reviewBatch = process.argv.includes("--smoke") ? null : JSON.parse(execFileSync(process.execPath, [fileURLToPath(import.meta.url), "--worker", "--batch"], {
      input: JSON.stringify(reviewPositions()), encoding: "utf8", timeout: 60_000, maxBuffer: 256 * 1024,
    }));
    const report = { question: "D4223 / D4175", node: process.version, platform: process.platform, architecture: process.arch,
      scope: "fresh process after module initialization; acquisition, wide/member checks, all13 outcome factories/admission and instrument overhead; three shared-receipt repeats; selector is separate warm diagnostic",
      exclusions: ["module preflight/API/DOM/voice", "ordinary consumer activation", "usefulness or population-wide latency guarantee"],
      familyOrder: SUBJECT_OUTCOME_FAMILIES,
      familyColumns: ["availability", "eventCount", "sourceMs", "admissionMs"],
      reviewBatch,
      samples: samples.map(sample => ({ ...sample, cold: { lookupMs: sample.cold.lookupMs, totalMs: sample.cold.totalMs,
        families: sample.cold.families.map(row => [row.kind, row.events, +row.sourceMs.toFixed(3), +row.admissionMs.toFixed(3)]) },
        warm: sample.warm.map(pass => ({ lookupMs: pass.lookupMs, totalMs: pass.totalMs })) })) };
    const output = JSON.stringify(report, null, 2) + "\n";
    assert(Buffer.byteLength(output) < 96 * 1024, "Research summary exceeds96KiB; do not dump populations");
    if (process.argv.includes("--write")) writeFileSync("planning/foundation-source-identity/outcome-delivery-cost-2026-11-11.json", output);
    else process.stdout.write(output);
  }
}
