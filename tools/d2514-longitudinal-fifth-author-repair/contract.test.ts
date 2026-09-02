// DISPOSABLE author falsifier — D2514-D2517. Not production code.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import {
  LONGITUDINAL_APPLICATION_CONTRACT,
  assembleLongitudinalRead,
  assertLongitudinalApplicationContract,
  fileBackedDatabaseIdentity,
  longitudinalSourceDigestV1,
  type LongitudinalCutOutcome,
  type LongitudinalSourceImageV1,
} from "./contract.js";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

function sourceImage(overrides: Partial<LongitudinalSourceImageV1> = {}): LongitudinalSourceImageV1 {
  return {
    version: 1,
    runPrefix: { id: "run", events: [{ seq: 1, type: "run.started" }] },
    ownerLearnerId: "learner",
    moveAuthorship: [{ eventSeq: 2, nodeId: "node", learnerId: "learner" }],
    importedMainlinePlies: null,
    structureAttribution: "single_player",
    ...overrides,
  };
}

describe("D2514-D2517 longitudinal fifth author repair", () => {
  it("D2514 retains exact mixed cut truth and emits rows only for an all-complete vector", () => {
    const failed: readonly LongitudinalCutOutcome[] = [
      { kind: "failed", runId: "b", requestedSeq: 8, completedSeq: 3, derivedRev: 1, failureCode: "derivation_failed", attempts: 3 },
      { kind: "failed", runId: "a", requestedSeq: 5, completedSeq: 0, derivedRev: 1, failureCode: "snapshot_invalid", attempts: 1 },
      { kind: "pending", runId: "c", requestedSeq: 7, completedSeq: 4, derivedRev: 1, retryAt: "2026-09-02T12:00:00.000Z" },
      { kind: "unavailable", runId: "d", requestedSeq: 2, reason: "revision_mismatch" },
    ];
    expect(assembleLongitudinalRead(failed, { denominators: ["must-not-leak"], observations: [], structureStats: [] })).toEqual({
      kind: "incomplete",
      cuts: [failed[1], failed[0], failed[2], failed[3]],
    });

    const complete = assembleLongitudinalRead([
      { kind: "complete", runId: "b", requestedSeq: 4, completedSeq: 4, derivedRev: 1 },
      { kind: "complete", runId: "a", requestedSeq: 3, completedSeq: 3, derivedRev: 1 },
    ], { denominators: ["d"], observations: ["o"], structureStats: ["s"] });
    expect(complete).toMatchObject({ kind: "complete", cuts: [{ runId: "a" }, { runId: "b" }], observations: ["o"] });
    expect(() => assembleLongitudinalRead([failed[0]!, { ...failed[0]! }], { denominators: [], observations: [], structureStats: [] })).toThrow(/DUPLICATE_CUT/u);
  });

  it("D2515 gives HTTP and worker connections one observable file identity", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-longitudinal-author-"));
    directories.push(directory);
    const identity = fileBackedDatabaseIdentity("store.sqlite", directory);
    const http = new DatabaseSync(identity.absolutePath);
    const worker = new DatabaseSync(identity.absolutePath);
    http.exec("CREATE TABLE jobs(id TEXT PRIMARY KEY) STRICT; INSERT INTO jobs VALUES ('run');");
    expect(worker.prepare("SELECT id FROM jobs").all()).toEqual([{ id: "run" }]);
    http.close(); worker.close();
    expect(() => fileBackedDatabaseIdentity(":memory:", directory)).toThrow(/FILE_DATABASE_REQUIRED/u);
    expect(fileBackedDatabaseIdentity(undefined, directory).absolutePath).toBe(join(directory, "data", "chess-tabiya.sqlite"));
  });

  it("D2516 seals one domain-separated canonical source image", () => {
    const first = sourceImage({ runPrefix: { z: 2, a: { y: true, b: null } } });
    const reordered = sourceImage({ runPrefix: { a: { b: null, y: true }, z: 2 } });
    expect(longitudinalSourceDigestV1(first)).toBe(longitudinalSourceDigestV1(reordered));
    for (const changed of [
      sourceImage({ ownerLearnerId: "other" }),
      sourceImage({ moveAuthorship: [{ eventSeq: 2, nodeId: "node", learnerId: "other" }] }),
      sourceImage({ importedMainlinePlies: 1 }),
      sourceImage({ structureAttribution: "unattributable_shared" }),
      sourceImage({ runPrefix: { id: "run", events: [{ seq: 1 }, { seq: 2 }] } }),
    ]) expect(longitudinalSourceDigestV1(changed)).not.toBe(longitudinalSourceDigestV1(sourceImage()));
    expect(longitudinalSourceDigestV1(sourceImage())).toMatch(/^sha256:[0-9a-f]{64}$/u);
  });

  it("D2517 closes lifecycle, health and built-artifact obligations", () => {
    expect(LONGITUDINAL_APPLICATION_CONTRACT).toEqual({
      productionDatabase: "one_absolute_file_identity",
      startup: "reconcile_then_worker_ready_then_listen",
      shutdown: "http_close_then_worker_drain_then_worker_db_then_engine_then_http_db",
      health: "closed_longitudinal_readiness_projection",
      testMemory: "disabled_test_no_worker",
      workerEntrypoint: "apps/server/dist/longitudinal-worker-thread.js",
    });
    expect(() => assertLongitudinalApplicationContract({ ...LONGITUDINAL_APPLICATION_CONTRACT, health: "always_ok" as never })).toThrow(/CONTRACT_INVALID/u);
    const rfc = readFileSync("rfc/longitudinal-store.md", "utf8");
    for (const token of ["createInMemoryTestApplication", "disabled_test", "dist/longitudinal-worker-thread.js", "worker_exited", "HTTP 503"]) expect(rfc).toContain(token);
  });
});
