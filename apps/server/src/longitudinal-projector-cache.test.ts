import { performance } from "node:perf_hooks";
import { mkdirSync, writeFileSync } from "node:fs";

import { afterEach, expect, it, vi } from "vitest";

const collection = vi.hoisted(() => ({ edges: [] as string[] }));
vi.mock("@chess-tabiya/runtime", async (importOriginal) => {
  const runtime = await importOriginal<typeof import("@chess-tabiya/runtime")>();
  return {
    ...runtime,
    localSemanticEvents: (...args: Parameters<typeof runtime.localSemanticEvents>) => {
      collection.edges.push(JSON.stringify(args));
      return runtime.localSemanticEvents(...args);
    },
  };
});

import { decisionPopulation, projectObservations, RUNTIME_POPULATION_DEPENDENCIES } from "./longitudinal-projector.js";
import { sealLongitudinalSourceImageV4 } from "./longitudinal-source.js";
import { importedRun } from "./longitudinal-test-fixtures.js";

afterEach(() => { collection.edges.length = 0; });

it("reuses genuine complete edge memberships across a growing prefix without changing any derived row", () => {
  const moves = ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5c6", "d7c6"];
  const run = importedRun("prefix-cache", moves);
  const image = (cut: number, owner = "owner") => sealLongitudinalSourceImageV4(Object.freeze({ fixture: "prefix-cache" }), {
    runId: run.id, requestedSeq: cut, storedEvents: run.events, ownerLearnerId: owner,
    structureAttribution: "single_player",
    moveAuthorship: run.events.slice(0, cut).flatMap((event) => event.type === "move.committed" && event.data.node.actor === "user"
      ? [{ eventSeq: event.seq, nodeId: event.data.node.id, learnerId: owner }]
      : []),
  });
  // An injected wrapper is deliberately uncached, but still collects actual sealed runtime events.
  const uncached = Object.freeze({ ...RUNTIME_POPULATION_DEPENDENCIES });
  const first = image(5);
  const extended = image(run.events.length);
  const expectedFirst = projectObservations(first, { dependencies: uncached });
  const uncachedAt = performance.now();
  const expectedFull = projectObservations(extended, { dependencies: uncached });
  const uncachedMs = performance.now() - uncachedAt;
  expect(expectedFull.observations.length).toBeGreaterThan(0);
  collection.edges.length = 0;
  const checkpoints: number[] = [];
  const coldAt = performance.now();
  const cold = projectObservations(first);
  const coldMs = performance.now() - coldAt;
  const oldEdges = new Set(collection.edges);
  expect(oldEdges.size).toBe(collection.edges.length);
  expect(oldEdges.size).toBeGreaterThan(0);
  expect(JSON.stringify(cold)).toBe(JSON.stringify(expectedFirst));
  collection.edges.length = 0;
  const incrementalAt = performance.now();
  const full = projectObservations(extended, { checkpoint: (done) => { checkpoints.push(done); } });
  const incrementalMs = performance.now() - incrementalAt;
  const newlyCollectedEdges = collection.edges.length;
  expect(JSON.stringify(full)).toBe(JSON.stringify(expectedFull));
  expect(checkpoints).toEqual([1, 2, 3, 4]);
  expect(collection.edges.length).toBeGreaterThan(0);
  expect(collection.edges.some((edge) => oldEdges.has(edge))).toBe(false);
  collection.edges.length = 0;
  const warmAt = performance.now();
  const warmCheckpoints: number[] = [];
  expect(JSON.stringify(projectObservations(extended, { checkpoint: (done) => { warmCheckpoints.push(done); } }))).toBe(JSON.stringify(expectedFull));
  const warmMs = performance.now() - warmAt;
  expect(warmCheckpoints).toEqual(checkpoints);
  expect(collection.edges).toEqual([]);
  // Cached chess facts do not carry source ownership, references, or derived rows across images.
  const changedOwner = projectObservations(image(run.events.length, "different-owner"));
  expect(JSON.stringify(changedOwner)).toBe(JSON.stringify(expectedFull).replaceAll('"owner"', '"different-owner"'));
  expect(collection.edges).toEqual([]);
  const receipt = { event: "longitudinal_prefix_membership_reuse", coldMs, incrementalMs, warmMs, uncachedMs,
    firstPrefixEdges: oldEdges.size, newlyCollectedEdges, warmCollectedEdges: collection.edges.length,
    ownerDecisions: checkpoints.length, derivedRowsByteIdentical: true };
  mkdirSync(new URL("../../../.cache/", import.meta.url), { recursive: true });
  writeFileSync(new URL("../../../.cache/longitudinal-prefix-reuse.json", import.meta.url), `${JSON.stringify(receipt, null, 2)}\n`);
});

it("does not cache or replace injected population absence, even after the real population was collected", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  expect(decisionPopulation(fen, "d2d4").kind).toBe("available");
  const events = vi.fn(() => undefined);
  const dependencies = { ...RUNTIME_POPULATION_DEPENDENCIES, events };
  expect(decisionPopulation(fen, "d2d4", undefined, dependencies)).toEqual({ kind: "unavailable", reason: "population_incomplete" });
  expect(decisionPopulation(fen, "d2d4", undefined, dependencies)).toEqual({ kind: "unavailable", reason: "population_incomplete" });
  expect(events).toHaveBeenCalledTimes(2);
});
