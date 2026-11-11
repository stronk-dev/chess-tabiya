// DISPOSABLE D4223/D4175 research. Calls actual current factories; never a learner issuer,
// consumer binding, chess oracle, UI renderer or production timing policy. No raw dumps.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CandidatePopulationService } from "../../apps/server/src/candidate-population-service.js";
import { GUIDED_HINT_PROFILE } from "../../apps/server/src/application.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { assertCandidatePopulationReceipt, type CandidatePopulationReceipt, type CandidateWideScope } from "../../packages/runtime/src/candidate-population.js";
import { selectSemanticEvidence, subjectOutcomeSemanticEvents, type SemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";
import { SUBJECT_OUTCOME_FAMILIES, type SubjectOutcomeFamily } from "../../packages/runtime/src/semantic-subject-types.js";
import { admitValidatedSemanticInstance } from "../../packages/runtime/src/semantic-validation-registry.js";
import { importedPopulation } from "../research-chess/populations.js";

interface Position { readonly id: string; readonly fen: string; readonly move: string | null; readonly source: string }
const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
export const LITERAL_POSITIONS: readonly Position[] = [
  { id: "start.white", fen: `${start} w KQkq - 0 1`, move: "e2e4", source: "semantic-validation-control-outcome-sources.ts" },
  { id: "start.black", fen: `${start} b KQkq - 0 1`, move: "e7e5", source: "semantic-validation-control-outcome-sources.ts" },
  { id: "bishop-knight.white", fen: "7k/8/8/3q4/8/5N2/6B1/7K w - - 0 1", move: "f3h4", source: "semantic-validation-control-outcome-sources.ts" },
  { id: "bishop-knight.black", fen: "7k/6b1/5n2/8/3Q4/8/8/7K b - - 0 1", move: "f6h5", source: "semantic-validation-control-outcome-sources.ts" },
  { id: "ep.white", fen: "7k/8/8/3pP3/8/8/8/7K w - d6 0 1", move: "e5d6", source: "semantic-validation-count-population-sources.ts" },
  { id: "ep.black", fen: "7k/8/8/8/3Pp3/8/8/7K b - d3 0 1", move: "e4d3", source: "semantic-validation-count-population-sources.ts" },
  { id: "promotion.white", fen: "8/P7/7k/8/8/8/8/7K w - - 0 1", move: "a7a8q", source: "semantic-validation-count-population-sources.ts" },
  { id: "promotion.black", fen: "7k/8/8/8/8/7K/p7/8 b - - 0 1", move: "a2a1q", source: "semantic-validation-count-population-sources.ts" },
  { id: "forced.white", fen: "8/8/8/8/8/1r6/2k5/K7 w - - 0 1", move: "a1a2", source: "semantic-subject-population.test.ts" },
  { id: "forced.black", fen: "k7/2K5/1R6/8/8/8/8/8 b - - 0 1", move: "a8a7", source: "vertical/color mirror of forced.white" },
  { id: "unavailable-risk.white", fen: "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", move: "e1e2", source: "semantic-subject-population.test.ts" },
  { id: "unavailable-risk.black", fen: "4k3/4R3/8/8/8/8/8/4K3 b - - 0 1", move: "e8e7", source: "vertical/color mirror of unavailable-risk.white" },
  { id: "castle.white", fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", move: "e1h1", source: "standard board, original rook-square move convention" },
  { id: "castle.black", fen: "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1", move: "e8h8", source: "standard board, original rook-square move convention" },
  { id: "terminal.checkmate", fen: "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1", move: null, source: "literal legal-move boundary" },
  { id: "terminal.stalemate", fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", move: null, source: "literal legal-move boundary" },
];

function positions(smoke: boolean): readonly Position[] {
  if (smoke) return [LITERAL_POSITIONS[0]!, LITERAL_POSITIONS[8]!, LITERAL_POSITIONS[10]!, LITERAL_POSITIONS[14]!];
  const games = importedPopulation(resolve("tools/r2-selection-harness/imported-sample.pgn")).paths.filter(path => path.length >= 41);
  assert(games.length >= 9, "The existing imported fixture must supply nine complete games");
  const sampled = Array.from({ length: 9 }, (_, i) => {
    const game = games[Math.floor(i * (games.length - 1) / 8)]!, ply = [12, 24, 40][i % 3]!;
    return [game[ply - 1]!, game[ply]!].map(row => ({ id: `imported.${i}.${row.id}`, fen: row.parentFen,
      move: row.uci, source: `tools/r2-selection-harness/imported-sample.pgn:${row.id}` }));
  }).flat();
  return [...LITERAL_POSITIONS, ...sampled];
}

function reviewPositions(): readonly Position[] {
  const game = importedPopulation(resolve("tools/r2-selection-harness/imported-sample.pgn")).paths.find(path => path.length >= 41);
  assert(game);
  return game.slice(8, 40).map(row => ({ id: `review-page.${row.id}`, fen: row.parentFen, move: row.uci,
    source: `tools/r2-selection-harness/imported-sample.pgn:${row.id}` }));
}

type Receipt = CandidatePopulationReceipt<CandidateWideScope>;
interface Family { readonly family: SubjectOutcomeFamily; readonly kind: "available" | "unavailable"; readonly events: number; readonly sourceMs: number; readonly admissionMs: number }
interface Pass { readonly lookupMs: number; readonly totalMs: number; readonly families: readonly Family[] }
export interface Sample {
  readonly position: Position; readonly legalMoves: number; readonly terminal: string | null;
  readonly cold: Pass; readonly warm: readonly Pass[]; readonly stats: { readonly hits: number; readonly misses: number; readonly retained: number; readonly capacity: number };
  readonly rawOutcomePayloadBytes: number; readonly largestOutcomePayloadBytes: number;
  readonly selector: { readonly ms: number; readonly selected: number; readonly refused: readonly string[] } | null;
}
export function assertWarmReuse(original: Receipt, cached: Receipt): void {
  assert.strictEqual(cached, original, "Repeated consumers must receive the ORIGINAL shared receipt");
}
export function assertRepeatedSources(before: readonly SemanticEvidenceEvent[], after: readonly SemanticEvidenceEvent[]): void {
  assert.deepEqual(after.map(event => event.operands), before.map(event => event.operands));
  after.forEach((event, at) => {
    assert.equal(event.derivationInputs.length, before[at]!.derivationInputs.length, "Complete prerequisite vector required");
    event.derivationInputs.forEach((input, i) => assert.strictEqual(input, before[at]!.derivationInputs[i]));
  });
}
export function assertWide(receipt: CandidatePopulationReceipt): asserts receipt is Receipt {
  assertCandidatePopulationReceipt(receipt);
  assert.equal(receipt.packet.scope.events, true); assert.equal(receipt.packet.scope.readings, true);
  assert.equal(receipt.selectedMember, "events_and_readings");
}
function collect(receipt: Receipt, move: string): { readonly families: readonly Family[]; readonly events: readonly SemanticEvidenceEvent[] } {
  const events: SemanticEvidenceEvent[] = [];
  const families = SUBJECT_OUTCOME_FAMILIES.map(family => {
    const began = performance.now(), result = subjectOutcomeSemanticEvents(PRIMARY_EVIDENCE_MANIFEST, family, receipt, move), sourceMs = performance.now() - began;
    const admissionStart = performance.now();
    if (result.kind === "available") for (const event of result.events) {
      assert.equal(admitValidatedSemanticInstance("event", event.evidence).kind, "admitted", `Exact ${family} source must qualify`);
      events.push(event);
    }
    return { family, kind: result.kind, events: result.kind === "available" ? result.events.length : 0,
      sourceMs, admissionMs: performance.now() - admissionStart };
  });
  return { families, events };
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
async function measureMemoryCase(workload: readonly Position[], capacity: number, clearOrder?: readonly MemoName[]): Promise<MemoryCase> {
  const probes = clearOrder === undefined ? undefined : memoProbes(); // Refuse absent hooks BEFORE any source work.
  if (clearOrder !== undefined) assert.deepEqual([...clearOrder].sort(), [...MEMO_NAMES].sort());
  assert.equal(new Set(workload.map(row => row.fen)).size, workload.length);
  let control: object | undefined = Object.freeze({ observerControl: true });
  const weakControl = new WeakRef(control);
  await collectedMemory(); assert.strictEqual(weakControl.deref(), control, "Observer must see a genuinely held target");
  control = undefined;
  await collectedMemory(); assert.equal(weakControl.deref(), undefined, "Observer must not retain its own released target");
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
  const result = { capacity, workMs, observer: { held: true as const, released: true as const }, stats, aliveRetained, aliveReleased,
    memory: { before, afterWork, retainedGc, releasedGc }, rows, ...(probes === undefined ? {} : { memoClears }) };
  assertMemoryCase(result, workload.length); return result;
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
  if (process.argv.includes("--memory-worker")) {
    const input = JSON.parse(readFileSync(0, "utf8")) as { readonly workload: readonly Position[]; readonly capacity: number; readonly clearOrder?: readonly MemoName[] };
    process.stdout.write(JSON.stringify(await measureMemoryCase(input.workload, input.capacity, input.clearOrder)));
  } else if (process.argv.includes("--memory") || process.argv.includes("--memo-probe")) {
    const probeMode = process.argv.includes("--memo-probe");
    if (probeMode) memoProbes();
    const workload = process.argv.includes("--smoke") ? LITERAL_POSITIONS.slice(0, 2) : reviewPositions();
    const runs: readonly { readonly capacity: number; readonly clearOrder?: readonly MemoName[] }[] = probeMode
      ? [{ capacity: GUIDED_HINT_PROFILE.packetCapacity, clearOrder: MEMO_NAMES }, { capacity: GUIDED_HINT_PROFILE.packetCapacity, clearOrder: ["factories", "readings", "positions"] }]
      : [...new Set([1, 4, GUIDED_HINT_PROFILE.packetCapacity])].map(capacity => ({ capacity }));
    const cases = runs.map(run => {
      const { capacity } = run;
      const result = JSON.parse(execFileSync(process.execPath, ["--expose-gc", fileURLToPath(import.meta.url), "--memory-worker"], {
        input: JSON.stringify({ workload, ...run }), encoding: "utf8", timeout: 60_000, maxBuffer: 256 * 1024,
      })) as MemoryCase;
      assertMemoryCase(result, workload.length);
      if (run.clearOrder !== undefined) assertMemoCase(result, run.clearOrder);
      process.stderr.write(`capacity${capacity}: retained heap ${(result.memory.retainedGc.heapUsed / 1024 ** 2).toFixed(1)}MiB, released ${(result.memory.releasedGc.heapUsed / 1024 ** 2).toFixed(1)}MiB; live receipts ${result.aliveRetained}→${result.aliveReleased}\n`);
      return result;
    });
    for (const result of cases) assert.deepEqual(result.rows, cases[0]!.rows, "All13 family availability/event counts must survive every capacity");
    const report = { question: probeMode ? "D4225 actual global-memo intervention" : "D4225", node: process.version, platform: process.platform, architecture: process.arch,
      scope: "fresh processes; identical source stream; forced GC only before/after work; service kept live then released; WeakRef observers cross jobs before GC; workMs/afterWork are observer-influenced",
      exclusions: ["production GC behavior", "peak/appliance footprint", "natural transient timing/memory (WeakRef creation keeps targets alive for the current job)", "exhaustive reachability/leak proof from surviving WeakRefs", "full semantic equality from counts alone", "production cache/default change"],
      workload, familyOrder: SUBJECT_OUTCOME_FAMILIES,
      familyResults: cases[0]!.rows.map(row => ({ id: row.id, legalMoves: row.legalMoves, families: row.families.map(family => [family.kind, family.events]) })),
      cases: cases.map(({ rows: _rows, ...result }) => result) };
    const text = JSON.stringify(report, null, 2) + "\n";
    assert(Buffer.byteLength(text) < (probeMode ? 64 : 48) * 1024, "Memory report exceeds its compact bound; never retain heap or event dumps");
    if (process.argv.includes("--write")) writeFileSync(`planning/foundation-source-identity/outcome-${probeMode ? "global-memos" : "memory"}-2026-11-11.json`, text);
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
