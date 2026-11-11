// Disposable instrument falsifiers, outside software/release CI.
import { describe, expect, it } from "vitest";
import { CandidatePopulationService } from "../../apps/server/src/candidate-population-service.js";
import { compileCandidatePopulation, CANDIDATE_EVENTS_SCOPE } from "../../packages/runtime/src/candidate-population.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { subjectOutcomeSemanticEvents } from "../../packages/runtime/src/semantic-evidence.js";
import { importedPopulation } from "../research-chess/populations.js";
import { resolve } from "node:path";
import { assertSample, assertWarmReuse, assertWide, assertRepeatedSources, assertMemoryCase, assertMemoCase, MEMO_NAMES, memoProbes, LITERAL_POSITIONS, measurePosition } from "./measure.js";

describe("D4223 actual-source cost instrument", () => {
  it("uninstrumented runtime cannot claim private cache observations", () => {
    expect(() => memoProbes()).toThrow(/probes are absent/);
  });
  it("explicit bundled fixture location preserves the original imported population exactly", () => {
    expect(importedPopulation(resolve("tools/r2-selection-harness/imported-sample.pgn"))).toEqual(importedPopulation());
  });
  it("executes all thirteen genuine empty-source families and the terminal boundary", () => {
    const sample = measurePosition(LITERAL_POSITIONS.find(row => row.id === "forced.white")!);
    expect(sample.cold.families).toHaveLength(13);
    expect(sample.cold.families.every(row => row.kind === "available" && row.events === 0)).toBe(true);
    const terminal = measurePosition(LITERAL_POSITIONS.find(row => row.id === "terminal.checkmate")!);
    expect(terminal.cold.families).toEqual([]); expect(terminal.terminal).toBe("checkmate");
  });
  it("retains genuine source-local risk unavailability alongside twelve complete families", () => {
    const sample = measurePosition(LITERAL_POSITIONS.find(row => row.id === "unavailable-risk.white")!);
    expect(sample.cold.families.filter(row => row.kind === "unavailable").map(row => row.family)).toEqual(["loose_piece"]);
    expect(sample.cold.families.filter(row => row.family !== "loose_piece").every(row => row.kind === "available")).toBe(true);
  });
  it("rejects shortened emitted-event prerequisites and empty-to-nonempty replacement", () => {
    const owner = new CandidatePopulationService({ capacity: 1 }).wide("7k/8/8/8/8/8/8/7K w - - 0 1");
    if (owner.kind !== "ready") throw Error("Original owner required"); assertWide(owner.receipt);
    const result = subjectOutcomeSemanticEvents(PRIMARY_EVIDENCE_MANIFEST, "king_zone", owner.receipt, "h1g1");
    if (result.kind !== "available" || result.events.length === 0) throw Error("Nonempty original event required");
    expect(() => assertRepeatedSources(result.events, result.events)).not.toThrow();
    expect(result.events[0]!.derivationInputs.length).toBeGreaterThan(0);
    const short = result.events.map(event => ({ ...event, derivationInputs: [] }));
    expect(() => assertRepeatedSources(result.events, short)).toThrow(/prerequisite/);
    expect(() => assertRepeatedSources([], result.events)).toThrow();
    expect(() => assertRepeatedSources([], [])).not.toThrow();
  });
  it("rejects omitted/duplicated families, unavailable-as-positive, broken reuse and fake clocks", () => {
    const real = measurePosition(LITERAL_POSITIONS.find(row => row.id === "forced.white")!);
    for (const mutate of [
      (s: typeof real) => { (s.cold.families as unknown[]).pop(); },
      (s: typeof real) => { (s.cold.families as unknown[])[0] = s.cold.families[1]; },
      (s: typeof real) => { Object.assign(s.cold.families[0]!, { kind: "unavailable", events: 1 }); },
      (s: typeof real) => { Object.assign(s.stats, { misses: 4, hits: 0 }); },
      (s: typeof real) => { Object.assign(s.cold, { totalMs: NaN }); },
      (s: typeof real) => { Object.assign(s.cold, { lookupMs: -1 }); },
      (s: typeof real) => { Object.assign(s.selector!, { ms: NaN }); },
    ]) { const bad = structuredClone(real); mutate(bad); expect(() => assertSample(bad)).toThrow(); }
    const one = new CandidatePopulationService({ capacity: 1 }).wide(real.position.fen);
    const two = new CandidatePopulationService({ capacity: 1 }).wide(real.position.fen);
    if (one.kind !== "ready" || two.kind !== "ready") throw Error("Original available receipts required");
    const left = one.receipt, right = two.receipt; assertWide(left); assertWide(right);
    expect(left.packet.id).toBe(right.packet.id);
    expect(() => assertWarmReuse(left, right)).toThrow(/ORIGINAL/);
    const narrow = compileCandidatePopulation({ beforeFen: real.position.fen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    if (narrow.kind !== "ready") throw Error("Original events-only control required");
    expect(() => assertWide(narrow.receipt)).toThrow();
  });
  it("refuses impossible memory counters, missing families and an observer that retains its own target", () => {
    const source = measurePosition(LITERAL_POSITIONS.find(row => row.id === "forced.white")!);
    const memory = { rss: 100, heapUsed: 50, heapTotal: 80, external: 10, arrayBuffers: 5 };
    const good = { capacity: 1, workMs: 1, observer: { held: true as const, released: true as const },
      stats: { capacity: 1, retained: 1, hits: 0, misses: 1 }, aliveRetained: 1, aliveReleased: 0,
      memory: { before: { ...memory }, afterWork: { ...memory }, retainedGc: { ...memory }, releasedGc: { ...memory } },
      rows: [{ id: source.position.id, legalMoves: source.legalMoves,
        families: source.cold.families.map(({ family, kind, events }) => ({ family, kind, events })) }] };
    expect(() => assertMemoryCase(good, 1)).not.toThrow();
    for (const mutate of [
      (v: typeof good) => { v.stats.retained = 2; },
      (v: typeof good) => { v.aliveRetained = 0; },
      (v: typeof good) => { v.aliveReleased = 2; },
      (v: typeof good) => { v.memory.retainedGc.heapUsed = NaN; },
      (v: typeof good) => { v.rows[0]!.families.pop(); },
      (v: typeof good) => { Object.assign(v.observer, { released: false }); },
    ]) { const bad = structuredClone(good); mutate(bad); expect(() => assertMemoryCase(bad, 1)).toThrow(); }
    const counts = { readings: [{ name: "r", entries: 1 }], factories: [{ name: "f", entries: 1 }], positions: [{ name: "p", entries: 1 }] };
    const memoClears = MEMO_NAMES.map(cleared => {
      const before = structuredClone(counts); counts[cleared] = [];
      return { cleared, before, after: structuredClone(counts), memory: { ...memory }, aliveReceipts: 0 };
    });
    const memo = { ...good, memoClears }; expect(() => assertMemoCase(memo, MEMO_NAMES)).not.toThrow();
    for (const mutate of [
      (v: typeof memo) => { v.memoClears.pop(); },
      (v: typeof memo) => { v.memoClears[0]!.before.readings = []; },
      (v: typeof memo) => { v.memoClears[0]!.after.factories = []; },
      (v: typeof memo) => { v.memoClears[1]!.before.readings = [{ name: "r", entries: 1 }]; },
      (v: typeof memo) => { v.memoClears[2]!.memory.heapUsed = NaN; },
    ]) { const bad = structuredClone(memo); mutate(bad); expect(() => assertMemoCase(bad, MEMO_NAMES)).toThrow(); }
  });
});
