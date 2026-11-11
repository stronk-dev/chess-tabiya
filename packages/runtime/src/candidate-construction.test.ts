import { describe, expect, it, vi } from "vitest";
import {
  beginCandidateConstruction, advanceCandidateConstruction, readCandidateConstruction,
  readCandidateOutcomeSources, readCandidateFoundationSources, candidateOutcomeFoundationId,
  assertCandidatePopulationReceipt, compileCandidateFoundation, CANDIDATE_EVENTS_SCOPE,
  projectCandidatePopulationReceipt, type CandidateConstruction, type CandidateAcquisitionScope,
  type CandidateAcquisitionReceipt,
} from "./candidate-population.js";
import { computeSubjectOutcomes } from "./semantic-subject-outcomes.js";
import { SUBJECT_OUTCOME_FAMILIES } from "./semantic-subject-types.js";
import { readCandidateRequiredUnavailableSources, readCandidateUnavailableSources } from "./semantic-source-availability.js";
import * as routes from "./internal/evidence-value-routes.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { LocalSemanticCollection } from "./semantic-evidence.js";
import type { FoundationPositionTuple } from "./foundation-position-cells.js";

const PAWNS = "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1";
const FORK = "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1";
function begin(fen = PAWNS): CandidateConstruction {
  const started = beginCandidateConstruction({ beforeFen: fen, ruleset: "standard" });
  if (started.kind !== "started") throw Error(JSON.stringify(started)); return started.construction;
}
function finish<S extends CandidateAcquisitionScope>(owner: CandidateConstruction, scope: S): CandidateAcquisitionReceipt<S> {
  for (let steps = 0; steps < 1000; steps++) {
    const result = advanceCandidateConstruction(owner, scope);
    if (result.kind === "ready") return result.receipt;
    if (result.kind === "failed") throw Error(JSON.stringify(result.error));
  }
  throw Error("A finite legal population must finish");
}

describe("original scoped candidate construction", () => {
  it("a retained tactical collection cannot have its edge rewritten through runtime properties", () => {
    const original = readCandidateOutcomeSources(finish(begin(FORK), "foundation"));
    const move = original.candidates.find(row => row.move.uci === "b5c7")!.row;
    const collection = new LocalSemanticCollection(FORK, move.moveUci, move.afterFen);
    expect(collection.tactical().length).toBeGreaterThan(0);
    const other = readCandidateOutcomeSources(finish(begin(), "foundation")).candidates.find(row => row.move.uci === "h1g1")!.row;
    try { Object.assign(collection, { beforeFen: PAWNS, moveUci: other.moveUci, afterFen: other.afterFen }); } catch { /* sealed instances may refuse outright */ }
    expect(collection.collect().events.every(event => event.anchor.beforeFen === FORK && event.anchor.moveUci === move.moveUci)).toBe(true);
  });

  it("a mutable outer tuple cannot rewrite the cached original-source binding", () => {
    const frame = readCandidateOutcomeSources(finish(begin(), "foundation"));
    const child = frame.candidates.find(row => row.move.uci === "h1g1")!;
    const collection = new LocalSemanticCollection(PAWNS, child.move.uci, child.row.afterFen);
    const pair: [FoundationPositionTuple, FoundationPositionTuple] = [frame.root.common, child.position.common];
    collection.collect(pair);
    const foreign = readCandidateOutcomeSources(finish(begin(), "foundation"));
    pair[0] = foreign.root.common; pair[1] = foreign.candidates.find(row => row.move.uci === child.move.uci)!.position.common;
    expect(() => collection.collect(pair)).toThrow(/replace/);
  });

  it("rejects accessor and sparse source pairs without reading getters or collecting", () => {
    const frame = readCandidateOutcomeSources(finish(begin(), "foundation"));
    const child = frame.candidates.find(row => row.move.uci === "h1g1")!;
    const collection = new LocalSemanticCollection(PAWNS, child.move.uci, child.row.afterFen);
    const accessor = [frame.root.common, child.position.common];
    const getter = vi.fn(() => frame.root.common);
    Object.defineProperty(accessor, "0", { get: getter });
    const sparse = new Array(2);
    sparse[1] = child.position.common;
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      expect(() => collection.collect(accessor as [FoundationPositionTuple, FoundationPositionTuple])).toThrow(/data-only/);
      expect(() => collection.collect(sparse as [FoundationPositionTuple, FoundationPositionTuple])).toThrow(/data-only/);
      expect(getter).not.toHaveBeenCalled();
      expect(calls).not.toHaveBeenCalled();
      expect(() => Object.defineProperty(collection, "collect", { value: () => ({ events: [] }) })).toThrow();
    } finally { calls.mockRestore(); }
    expect(collection.collect([frame.root.common, child.position.common]).events).toBeDefined();
  });

  it("begin/pending/final reads do not acquire sources or silently upgrade to a full packet", () => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const owner = begin();
      expect(readCandidateConstruction(owner, "foundation")).toEqual({ kind: "pending" });
      expect(readCandidateConstruction(owner, "events_and_readings")).toEqual({ kind: "pending" });
      expect(calls).not.toHaveBeenCalled();
      const core = finish(owner, "foundation");
      expect(Object.keys(core).sort()).toEqual(["beforeFen", "compilerVersion", "id", "kind", "legalMovesInput"]);
      expect(core.compilerVersion).toBe(8);
      expect(calls.mock.calls.some(([route]) => route.includes(".event.") || route === "rules.structural.reading.fianchetto_setup@1")).toBe(false);
      calls.mockClear();
      expect(readCandidateConstruction(owner, "foundation")).toEqual({ kind: "ready", receipt: core });
      expect(readCandidateConstruction(owner, "events_and_readings")).toEqual({ kind: "pending" });
      expect(calls).not.toHaveBeenCalled();
      expect(() => assertCandidatePopulationReceipt(core)).toThrow(/process/);
      expect(() => readCandidateOutcomeSources({ ...core })).toThrow();
      expect(() => routes.invokeEvidenceValueRoute("derived.semantic_avoidance.open_file@2", { receipt: { ...core }, moveUci: "h1g1" })).toThrow();
    } finally { calls.mockRestore(); }
  });

  it.each(["core-first", "wide-first"] as const)("%s shares every original prerequisite across all13 real factories", order => {
    const owner = begin();
    const first = order === "core-first" ? finish(owner, "foundation") : finish(owner, "events_and_readings");
    const core = finish(owner, "foundation"), full = finish(owner, "events_and_readings");
    const frame = readCandidateOutcomeSources(core), fullFrame = readCandidateFoundationSources(full);
    expect(readCandidateOutcomeSources(full)).toBe(frame);
    expect(candidateOutcomeFoundationId(full)).toBe(core.id);
    expect(fullFrame.root).toBe(frame.root);
    frame.candidates.forEach((row, index) => {
      expect(fullFrame.candidates[index]!.position).toBe(row.position);
      expect(fullFrame.candidates[index]!.move).toBe(row.move);
      expect(full.packet.candidates[index]!.afterFen).toBe(row.row.afterFen);
    });
    expect(first).toBe(order === "core-first" ? core : full);
    for (const family of SUBJECT_OUTCOME_FAMILIES) {
      const a = routes.invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: core, moveUci: "h1g1" });
      const b = routes.invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: full, moveUci: "h1g1" });
      expect(b).toEqual(a);
      expect(routes.readSubjectOutcomePopulation(family, b)).toEqual(routes.readSubjectOutcomePopulation(family, a));
      const ai = routes.readSubjectOutcomeInvocation(a).inputs, bi = routes.readSubjectOutcomeInvocation(b).inputs;
      expect(bi).toHaveLength(ai.length); bi.forEach((input, index) => expect(input).toBe(ai[index]));
    }
    const narrow = projectCandidatePopulationReceipt(full, CANDIDATE_EVENTS_SCOPE);
    if (narrow.kind !== "ready") throw Error("Expected genuine projection");
    expect(() => readCandidateOutcomeSources(narrow.receipt as never)).toThrow(/foundation or wide/);
  });

  it("readings-first full upgrade retains the actual private tactical values without reacquisition", () => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const owner = begin(FORK), readings = finish(owner, "readings");
      expect(calls.mock.calls.filter(([route, input]) => route === "rules.structural.reading.pawn_connectivity@1" && "fen" in input && input.fen === FORK)).toHaveLength(0);
      const acquired = new Map<string, readonly DeclaredEvidence<unknown>[]>();
      for (const [index, [route, input]] of calls.mock.calls.entries()) {
        if (route === "rules.tactic.event.double_attack@1" && "moveUci" in input)
          acquired.set(input.moveUci as string, calls.mock.results[index]!.value as readonly DeclaredEvidence<unknown>[]);
      }
      const before = calls.mock.calls.filter(([route]) => route === "rules.tactic.event.double_attack@1").length;
      expect(before).toBe(readings.packet.candidates.length);
      const full = finish(owner, "events_and_readings");
      expect(calls.mock.calls.filter(([route]) => route === "rules.tactic.event.double_attack@1")).toHaveLength(before);
      let positives = 0;
      for (const row of full.packet.candidates) {
        const originals = acquired.get(row.moveUci)!;
        const actual = row.events.filter(event => event.projection.id === "rules.tactic.event.double_attack");
        expect(actual).toHaveLength(originals.length);
        actual.forEach((event, index) => { expect(event.evidence).toBe(originals[index]); positives++; });
      }
      expect(positives).toBeGreaterThan(0);
    } finally { calls.mockRestore(); }
  });

  it.each([
    ["white", "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", "e1e2"],
    ["black", "4k3/4R3/8/8/8/8/8/4K3 b - - 0 1", "e8e7"],
  ])("%s required risk stays unavailable while independent totals and unrequested groups stay distinct", (_color, fen, move) => {
    const owner = begin(fen), core = finish(owner, "foundation");
    const failures = readCandidateRequiredUnavailableSources(core);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.every(failure => failure.cause.kind === "required_total")).toBe(true);
    expect(computeSubjectOutcomes("loose_piece", core, move).kind).toBe("unavailable");
    expect(computeSubjectOutcomes("piece_count", core, move).kind).toBe("available");
    const full = finish(owner, "events_and_readings");
    expect(readCandidateUnavailableSources(full).some(failure => failure.cause.kind === "candidate_collector")).toBe(true);
    expect(readCandidateRequiredUnavailableSources(core)).toEqual(failures);
  });

  it("a full collector failure cannot erase a valid original foundation", () => {
    const owner = begin(), core = finish(owner, "foundation"), frame = readCandidateOutcomeSources(core);
    const actual = routes.invokeEvidenceValueRoute;
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: unknown) => {
      if (route === "rules.tactic.event.check@1") throw Error("controlled full-group failure");
      return actual(route as never, input as never);
    }) as typeof actual);
    try {
      let result = advanceCandidateConstruction(owner, "events_and_readings");
      while (result.kind === "pending") result = advanceCandidateConstruction(owner, "events_and_readings");
      expect(result.kind).toBe("failed");
      expect(readCandidateConstruction(owner, "foundation")).toEqual({ kind: "ready", receipt: core });
      expect(readCandidateOutcomeSources(core)).toBe(frame);
      expect(computeSubjectOutcomes("open_file", core, "h1g1").kind).toBe("available");
    } finally { calls.mockRestore(); }
  });

  it.each([
    ["events", "events_and_readings", "rules.tactic.event.check@1"],
    ["events_and_readings", "events", "rules.tactic.event.check@1"],
    ["foundation", "events_and_readings", "rules.tactic.reading.mover_piece_risk@1"],
    ["events_and_readings", "foundation", "rules.tactic.reading.mover_piece_risk@1"],
    ["events", "foundation", "rules.structural.reading.pawn_connectivity@1"],
  ] as const)("%s failure is retained for requiring %s without recollection (%s)", (first, second, target) => {
    const owner = begin(), actual = routes.invokeEvidenceValueRoute;
    let targetCalls = 0;
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: unknown) => {
      if (route === target && ++targetCalls === 1) throw Error("one-shot producer failure");
      return actual(route as never, input as never);
    }) as typeof actual);
    try {
      let result = advanceCandidateConstruction(owner, first);
      while (result.kind === "pending") result = advanceCandidateConstruction(owner, first);
      expect(result.kind).toBe("failed"); expect(targetCalls).toBe(1);
      expect(readCandidateConstruction(owner, second).kind).toBe("failed");
      expect(advanceCandidateConstruction(owner, second).kind).toBe("failed");
      expect(targetCalls).toBe(1);
      if (target === "rules.tactic.event.check@1") expect(finish(owner, "foundation").kind).toBe("foundation");
    } finally { calls.mockRestore(); }
  });

  it("copied constructors and unknown scopes refuse before collection; invalid roots fail honestly", () => {
    const owner = begin(), calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      expect(() => advanceCandidateConstruction({ ...owner }, "foundation")).toThrow(/original/);
      expect(() => advanceCandidateConstruction(owner, "invented" as never)).toThrow(/scope/);
      expect(calls).not.toHaveBeenCalled();
      expect(compileCandidateFoundation({ beforeFen: "not a fen", ruleset: "standard" }).kind).toBe("failed");
    } finally { calls.mockRestore(); }
  });
});
