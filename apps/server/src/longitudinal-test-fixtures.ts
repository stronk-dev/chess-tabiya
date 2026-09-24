// TEST-ONLY fixtures for rfc/longitudinal-store.md acceptance tests: real runtime-created runs, a
// cheap deterministic population dependency (so decision/row algebra fixtures do not pay the real
// semantic census per edge), and file-backed storage/worker-store pairs over one database identity.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  appendEvents,
  commitMove,
  createRun,
  legalAlternativeEdges,
  type DrillRun,
} from "@chess-tabiya/runtime";

import type { PopulationDependencies } from "./longitudinal-projector.js";
import { LongitudinalStore } from "./longitudinal-store.js";
import { fileBackedDatabaseIdentity, openLongitudinalDatabase } from "./longitudinal-worker-config.js";
import { SQLiteRunStorage, STORAGE_VERSION, type LeaseHolder } from "./storage.js";

export const AT = "2026-09-24T10:00:00.000Z";
export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function positionRun(id: string, fen = START_FEN, side: "white" | "black" = "white", createdAt = AT): DrillRun {
  return createRun({
    id,
    session: { kind: "position", start: { fen, side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 } },
    sessionDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 1,
    createdAt,
  });
}

export function packRun(id: string, packId = "fixture-pack"): DrillRun {
  return createRun({
    id,
    packId,
    packDigest: `sha256:${"7".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    startFen: START_FEN,
    seed: 11,
    createdAt: AT,
  });
}

/** An imported run as `RunService.importGame` builds it: the chosen side commits as `user`. */
export function importedRun(id: string, moves: readonly string[], side: "white" | "black" = "white"): DrillRun {
  let run = createRun({
    id,
    session: {
      kind: "imported", start: { fen: START_FEN, side }, movetextDigest: `sha256:${"b".repeat(64)}`,
      feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 },
    },
    sessionDigest: `sha256:${"c".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 2,
    createdAt: AT,
  });
  for (const move of moves) {
    const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId)!;
    const actor = node.fen.split(" ")[1] === side[0] ? "user" : "system";
    run = commitMove(run, move, { actor, at: AT }).run;
  }
  return run;
}

export function play(run: DrillRun, ...moves: readonly string[]): DrillRun {
  let next = run;
  for (const move of moves) next = commitMove(next, move, { at: AT }).run;
  return next;
}

export function predict(run: DrillRun, nodeId: string, checkpointId: string, predictedUci: string): DrillRun {
  return appendEvents(run, [{
    type: "prediction.recorded",
    at: AT,
    data: {
      nodeId, checkpointId, predictedUci, predictedMass: null, predictedRank: 1, candidateCount: 1,
      distribution: { moveUci: predictedUci, policyModeApplied: "enumerated", candidates: [{ moveUci: predictedUci, rank: 1 }], engine: { id: "fixture", name: "fixture", version: "1", seedHonored: true } },
    },
  }]);
}

/**
 * A cheap deterministic stand-in for `localSemanticEvents`: e2e4 and d2d4 exhibit
 * `rules.structural.event.open_file` gained; everything else exhibits nothing. The real legal
 * alternative enumerator stays in place, so population completeness is still exact.
 */
export const FIXTURE_DEPENDENCIES: PopulationDependencies = Object.freeze({
  alternatives: legalAlternativeEdges,
  events: (_before: string, moveUci: string) => (moveUci === "e2e4" || moveUci === "d2d4" || moveUci === "e7e5" || moveUci === "d7d5")
    ? [{ projection: { id: "rules.structural.event.open_file", version: 1 }, sign: "gained" }]
    : [],
});

export interface Clock { now: number }

export interface FileFixture {
  readonly path: string;
  readonly clock: Clock;
  readonly storage: SQLiteRunStorage;
  /** A second connection to the same file, the worker capability. */
  workerStore(): LongitudinalStore;
  reopen(): SQLiteRunStorage;
}

export function fileFixture(prefix = "tabiya-longitudinal-"): FileFixture {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  const path = join(directory, "store.sqlite");
  const clock: Clock = { now: Date.parse(AT) };
  const options = { onMigration: () => {}, longitudinalNow: () => clock.now, now: () => new Date(clock.now).toISOString() };
  const storage = new SQLiteRunStorage(path, options);
  return {
    path,
    clock,
    storage,
    workerStore: () => new LongitudinalStore(openLongitudinalDatabase(fileBackedDatabaseIdentity(path), STORAGE_VERSION), { now: () => clock.now }),
    reopen: () => new SQLiteRunStorage(path, options),
  };
}

export function learner(storage: SQLiteRunStorage, id: string): LeaseHolder {
  storage.createLearner({ id, handle: id, passwordHash: "!", createdAt: AT });
  return Object.freeze({ writerId: `writer-${id}`, learnerId: id });
}
