import { afterEach, describe, expect, it, vi } from "vitest";
import * as execution from "./evidence-binding-execution.js";
import * as routes from "./internal/evidence-value-routes.js";
import { moveTransitionEvidence, positionStructureEvidence, selectedSquareSightEvidence } from "./reading-evidence.js";
import { shapeFiringEvidence, shapeFirings, type ShapeTriggerSource } from "./shape-firing.js";
import { structuralReading } from "./structure.js";
import { transitionReading } from "./transition.js";

const BEFORE = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const PATH = [{ id: "root", fen: BEFORE }, { id: "move", fen: AFTER }];
const SHAPES: readonly ShapeTriggerSource[] = [{ id: "occupied-e4", trigger: { kind: "pieceOnSquare", square: "e4", piece: { color: "white", role: "pawn" } } }];
const operations = [
  { consumer: "inspector.position_structure", run: () => positionStructureEvidence({ fen: BEFORE }) },
  { consumer: "board.selected_square_sight", run: () => selectedSquareSightEvidence({ fen: BEFORE }) },
  { consumer: "inspector.move_transition", run: () => moveTransitionEvidence({ before: BEFORE, moveUci: "e2e4", after: AFTER }) },
  { consumer: "theory.shape_firing", run: () => shapeFiringEvidence(SHAPES, PATH) },
] as const;
const faults = ["missing_policy", "impossible_latency", "raw_source", "duplicate_adapter", "missing_bindings"] as const;
type Fault = typeof faults[number];
const originalCompile = execution.compileEvidenceConsumerExecution;
const originalRoute = routes.invokeEvidenceValueRoute;

function observe(consumer: string, fault?: Fault) {
  const trace: string[] = [];
  const compile = vi.spyOn(execution, "compileEvidenceConsumerExecution").mockImplementation((manifest, requested) => {
    trace.push(`compile:${requested.id}`);
    if (requested.id !== consumer || fault === undefined) return originalCompile(manifest, requested);
    const first = manifest.bindings.find(row => row.consumer.id === consumer)!;
    const { sourceAbsence: _absence, ...base } = first;
    const added = {
      ...base, adapter: { id: "adapter.fixture.reading_execution", version: 1 },
      producer: { id: "live.stockfish", version: 1 },
      projection: { id: fault === "raw_source" ? "live.stockfish.uci_response" : "live.stockfish.position_eval", version: 1 },
      latency: { mode: fault === "impossible_latency" ? "sync" as const : "interactive" as const, maxMs: 1000 },
      ...(fault === "missing_policy" ? {} : { sourceAbsence: { necessity: "required" as const, whenNoPath: "operation_unavailable" as const } }),
    };
    const bindings = fault === "missing_bindings" ? manifest.bindings.filter(row => row.consumer.id !== consumer)
      : fault === "duplicate_adapter" ? [...manifest.bindings, first] : [...manifest.bindings, added];
    // The actual compiler rejects a complete invalid contract; no stubbed throw or filtered subset.
    return originalCompile({ ...manifest, bindings }, requested);
  });
  const factory = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => {
    trace.push("factory");
    return originalRoute(...args);
  });
  return { trace, compile, factory };
}

afterEach(() => vi.restoreAllMocks());

describe.each(operations)("$consumer complete execution before collection", operation => {
  it.each(faults)("refuses %s before any factory", fault => {
    const observed = observe(operation.consumer, fault);
    expect(operation.run).toThrow(/BINDING_|EXECUTION_/u);
    expect(observed.factory).not.toHaveBeenCalled();
    expect(observed.trace).toEqual([`compile:${operation.consumer}`]);
  });

  it("preflights every invocation and retains actual payloads", () => {
    const expected = operation.run();
    const observed = observe(operation.consumer);
    expect(operation.run()).toEqual(expected);
    expect(observed.trace[0]).toBe(`compile:${operation.consumer}`);
    expect(observed.factory).toHaveBeenCalled();
    observed.trace.length = 0;
    expect(operation.run()).toEqual(expected);
    expect(observed.trace[0]).toBe(`compile:${operation.consumer}`);
    expect(observed.compile).toHaveBeenCalledTimes(2);
  });
});

describe("local reading compatibility", () => {
  it("retains structural, selected-square, transition and shape semantics", () => {
    expect(positionStructureEvidence({ fen: BEFORE })).toEqual(structuralReading(BEFORE).features);
    expect(selectedSquareSightEvidence({ fen: BEFORE })).toEqual(structuralReading(BEFORE).features);
    // The registered leaf order differs from the detector's color order, already before repair.
    const census = (items: readonly unknown[]) => items.map(item => JSON.stringify(item)).sort();
    expect(census(moveTransitionEvidence({ before: BEFORE, moveUci: "e2e4", after: AFTER }))).toEqual(census(transitionReading(BEFORE, "e2e4", AFTER)!.observations));
    expect(shapeFiringEvidence(SHAPES, PATH)).toEqual(shapeFirings(SHAPES, PATH));
    expect(shapeFiringEvidence(SHAPES, PATH)).toHaveLength(1);
  });

  it.each(faults)("refuses %s even when a shape path would be empty", fault => {
    const observed = observe("theory.shape_firing", fault);
    expect(() => shapeFiringEvidence([], [])).toThrow(/BINDING_|EXECUTION_/u);
    expect(observed.factory).not.toHaveBeenCalled();
  });

  it("preflights a valid empty shape request rather than skipping admission", () => {
    const observed = observe("theory.shape_firing");
    expect(shapeFiringEvidence([], [])).toEqual([]);
    expect(observed.trace).toEqual(["compile:theory.shape_firing", "factory"]);
  });
});
