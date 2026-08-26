// DISPOSABLE research harness — D1612–D1617. Not production code.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  DurableJobProtocol,
  IntervalAggregate,
  LONGITUDINAL_INGEST_REGISTRY,
  RUN_WRITE_OPERATIONS,
  assertRunWriteOperationClosure,
  ingestRegistryDigest,
  personalPlayAdmitted,
  snapshotPrefix,
  validateIngestRegistry,
  type LongitudinalConstructor,
} from "./longitudinal-contract.js";

describe("D1612 exact constructor registry", () => {
  it("publishes all 67 literal rows with the exact 46/13/8 disposition", () => {
    validateIngestRegistry(LONGITUDINAL_INGEST_REGISTRY);
    expect(LONGITUDINAL_INGEST_REGISTRY).toHaveLength(67);
    expect(LONGITUDINAL_INGEST_REGISTRY.filter((row) => row.kind === "edge")).toHaveLength(46);
    expect(LONGITUDINAL_INGEST_REGISTRY.filter((row) => row.kind === "population")).toHaveLength(13);
    expect(LONGITUDINAL_INGEST_REGISTRY.filter((row) => row.kind === "path")).toHaveLength(8);
    expect(ingestRegistryDigest(LONGITUDINAL_INGEST_REGISTRY)).toMatch(/^sha256:[0-9a-f]{64}$/u);
  });

  it("refuses a count-preserving swap of two valid avoidance bases", () => {
    const population = LONGITUDINAL_INGEST_REGISTRY.filter((row): row is Extract<LongitudinalConstructor, { kind: "population" }> => row.kind === "population");
    const [first, second] = population;
    const mutated = LONGITUDINAL_INGEST_REGISTRY.map((row) => row === first ? { ...row, baseProjection: second!.baseProjection } : row === second ? { ...row, baseProjection: first!.baseProjection } : row);
    expect(() => validateIngestRegistry(mutated)).toThrow(/LONGITUDINAL_POPULATION_BASE_MISMATCH/u);
    const loose = population.find((row) => row.projection.id.endsWith("loose_piece"))!;
    expect(loose.baseProjection.id).toBe("rules.tactic.event.loose_piece");
  });
});

describe("D1613/D1615 durable claim and exact snapshot cut", () => {
  it("allows one live claimant, reclaims only after expiry, and rejects the stale publisher", () => {
    const jobs = new DurableJobProtocol("run-1", 3, 1);
    const first = jobs.claim("worker-a", 100, 10)!;
    expect(jobs.claim("worker-b", 100, 10)).toBeNull();
    const second = jobs.claim("worker-b", 110, 10)!;
    expect(second.generation).toBe(first.generation + 1);
    expect(jobs.publish(first, 3, 111)).toBe(false);
    expect(jobs.publish(second, 3, 111)).toBe(true);
    expect(jobs.job.state).toBe("complete");
  });

  it("pins N even when the current snapshot has advanced to M and reopens a newer request", () => {
    const events = [1, 2, 3, 4].map((seq) => ({ seq, value: `e${seq}` }));
    const jobs = new DurableJobProtocol("run-2", 3, 1);
    const claim = jobs.claim("worker-a", 0, 20)!;
    jobs.request(4);
    expect(snapshotPrefix(events, claim.requestedSeq).map((event) => event.seq)).toEqual([1, 2, 3]);
    expect(jobs.publish(claim, 3, 1)).toBe(true);
    expect(jobs.job).toMatchObject({ completedSeq: 3, requestedSeq: 4, state: "pending" });
    expect(jobs.publishedCut).toBe(3);
  });

  it("recovers crash-before-publish, treats crash-after-publish as complete, and closes failure codes", () => {
    const before = new DurableJobProtocol("run-before", 1, 1);
    before.claim("dead-worker", 0, 5);
    const recovered = before.claim("new-worker", 5, 5)!;
    expect(before.publish(recovered, 1, 6)).toBe(true);

    const after = new DurableJobProtocol("run-after", 1, 1);
    const claim = after.claim("worker", 0, 5)!;
    expect(after.publish(claim, 1, 1)).toBe(true);
    expect(after.claim("other", 10, 5)).toBeNull();

    const failed = new DurableJobProtocol("run-failed", 1, 1);
    const failedClaim = failed.claim("worker", 0, 5)!;
    expect(failed.fail(failedClaim, "derivation_failed", 1)).toBe(true);
    expect(failed.job.failureCode).toBe("derivation_failed");
    expect(failed.claim("retry", 2, 5)).not.toBeNull();
    expect(failed.fail(failedClaim, "not_closed" as never, 2)).toBe(false);
  });

  it("refuses a non-contiguous or incomplete event prefix", () => {
    expect(() => snapshotPrefix([{ seq: 1, value: "a" }, { seq: 3, value: "c" }], 3)).toThrow(/LONGITUDINAL_SNAPSHOT_CUT_INVALID/u);
  });
});

describe("D1614 denominator algebra", () => {
  const d1 = { id: "d1", phase: "opening" as const, decisionClass: "move" as const, families: [] };
  const d2 = { id: "d2", phase: "opening" as const, decisionClass: "move" as const, families: [{ projectionId: "F", opportunity: true, occurred: true }] };
  const d3 = { id: "d3", phase: "opening" as const, decisionClass: "move" as const, families: [] };
  const d4 = { id: "d4", phase: "middlegame" as const, decisionClass: "move" as const, families: [{ projectionId: "F", opportunity: true, occurred: false }] };

  it("seeds a late family with prior decisions and advances it on later no-opportunity decisions", () => {
    const aggregate = new IntervalAggregate();
    aggregate.apply("1", [d1]);
    aggregate.apply("2", [d2]);
    expect(aggregate.rows()).toEqual([{ key: "opening:move:F", decisions: 2, opportunities: 1, occurred: 1 }]);
    aggregate.apply("3", [d3]);
    expect(aggregate.rows()[0]).toMatchObject({ decisions: 3, opportunities: 1, occurred: 1 });
  });

  it("makes interval retry idempotent, separates phases, and equals a complete rebuild", () => {
    const incremental = new IntervalAggregate();
    incremental.apply("1", [d1]);
    incremental.apply("2", [d2]);
    incremental.apply("2", [d2]);
    incremental.apply("3", [d3, d4]);
    const rebuilt = new IntervalAggregate();
    rebuilt.apply("complete", [d1, d2, d3, d4]);
    expect(incremental.rows()).toEqual(rebuilt.rows());
    expect(incremental.rows()).toHaveLength(2);
    expect(incremental.rows().find((row) => row.key.startsWith("middlegame"))?.decisions).toBe(1);
  });
});

describe("D1616 run-write closure", () => {
  it("names all seven production storage operations and refuses omission", () => {
    const source = readFileSync(new URL("../../apps/server/src/storage.ts", import.meta.url), "utf8");
    expect(RUN_WRITE_OPERATIONS.every((name) => new RegExp(`\\b${name}\\s*\\(`, "u").test(source))).toBe(true);
    assertRunWriteOperationClosure(RUN_WRITE_OPERATIONS);
    expect(() => assertRunWriteOperationClosure(RUN_WRITE_OPERATIONS.slice(1))).toThrow(/LONGITUDINAL_RUN_WRITE_OPERATION_MISMATCH/u);
  });
});

describe("D1617 imported-game subject boundary", () => {
  it("admits the same PGN only under a durable learner assertion", () => {
    const learner = { kind: "learner_asserted" as const, selectedSide: "black" as const, assertedHandle: "marco" };
    const famous = { kind: "observed_other" as const, selectedSide: "black" as const, assertedHandle: null };
    const legacy = { kind: "unknown" as const, selectedSide: "black" as const, assertedHandle: null };
    expect(personalPlayAdmitted(learner)).toBe(true);
    expect(personalPlayAdmitted(famous)).toBe(false);
    expect(personalPlayAdmitted(legacy)).toBe(false);
    expect(personalPlayAdmitted({ ...learner, assertedHandle: "" })).toBe(false);
  });
});
