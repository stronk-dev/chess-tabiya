// DISPOSABLE research harness — D1612–D1617. Not production code.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import {
  DurableJobProtocol,
  IntervalAggregate,
  LONGITUDINAL_INGEST_REGISTRY,
  LONGITUDINAL_MIGRATION_SQL,
  LONGITUDINAL_WORKER_DEFAULTS,
  LONGITUDINAL_WORKER_ONCE_ENTRY,
  LongitudinalProjectionWorker,
  RUN_WRITE_OPERATIONS,
  assertRunWriteOperationClosure,
  ingestRegistryDigest,
  deleteLearnerProfile,
  personalPlayAdmitted,
  projectDecisionPopulation,
  rebuildProfileOwner,
  snapshotPrefix,
  validateIngestRegistry,
  type LongitudinalConstructor,
} from "./longitudinal-contract.js";

describe("D1612 exact constructor registry", () => {
  it("publishes all 67 literal rows with the exact 46/13/8 disposition", () => {
    const registryBytes = readFileSync(new URL("../../rfc/contracts/longitudinal-ingest-registry-v1.json", import.meta.url));
    const signBytes = readFileSync(new URL("../../rfc/contracts/longitudinal-sign-subsets-v1.json", import.meta.url));
    const signSubsets = JSON.parse(signBytes.toString("utf8")) as Readonly<Record<string, readonly string[]>>;
    const publishedBase = JSON.parse(registryBytes.toString("utf8")) as readonly Record<string, unknown>[];
    const published = publishedBase.map((row) => {
      const projection = row.projection as { readonly id: string };
      const baseProjection = row.baseProjection as { readonly id: string } | undefined;
      return { ...row, signs: signSubsets[projection.id], ...(baseProjection === undefined ? {} : { baseSigns: signSubsets[baseProjection.id] }) };
    }) as unknown as readonly LongitudinalConstructor[];
    expect(published).toEqual(LONGITUDINAL_INGEST_REGISTRY);
    expect(createHash("sha256").update(registryBytes).digest("hex")).toBe("e12147750b512c83872f61dd7dc333e94e20c151876a3c2d3ef5f91c7e7fc21a");
    expect(createHash("sha256").update(signBytes).digest("hex")).toBe("4294461656e2da32106c6ba9e0753fe58e49ea74dcb907d41f9ab1e46476b32f");
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

  it("retains exact sign subsets and refuses impossible projection/sign pairs", () => {
    const structural = LONGITUDINAL_INGEST_REGISTRY.find((row) => row.projection.id === "rules.structural.event.backward_pawn")!;
    const stateOnly = LONGITUDINAL_INGEST_REGISTRY.find((row) => row.projection.id === "rules.transition.event.castled")!;
    expect(structural.signs).toEqual(["gained", "lost", "preserved"]);
    expect(stateOnly.signs).toEqual(["state"]);
    const changed = LONGITUDINAL_INGEST_REGISTRY.map((row) => row === stateOnly ? { ...row, signs: ["gained"] as const } : row);
    expect(() => validateIngestRegistry(changed)).toThrow(/LONGITUDINAL_SIGN_SUBSET_MISMATCH/u);
  });
});

describe("D2064/D2068 literal SQLite authority", () => {
  const database = () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys=ON; CREATE TABLE learners(id TEXT PRIMARY KEY) STRICT; CREATE TABLE drill_runs(id TEXT PRIMARY KEY, owner_learner_id TEXT NOT NULL) STRICT;");
    db.exec(LONGITUDINAL_MIGRATION_SQL);
    db.prepare("INSERT INTO learners(id) VALUES (?)").run("learner-1");
    db.prepare("INSERT INTO drill_runs(id,owner_learner_id) VALUES (?,?)").run("run-1", "learner-1");
    return db;
  };

  it("persists a claimed cut distinct from a newer requested high-water", () => {
    const db = database();
    db.prepare(`INSERT INTO learner_observation_jobs
      (run_id,learner_id,requested_seq,completed_seq,derived_rev,state,claim_generation,claimed_requested_seq,claim_token,claimed_by,lease_expires_at,failure_code,updated_at)
      VALUES (?,?,?,?,?,'running',?,?,?,?,?,NULL,?)`).run("run-1", "learner-1", 3, 0, 1, 1, 3, "token", "worker", "9999", "now");
    db.prepare("UPDATE learner_observation_jobs SET requested_seq=4 WHERE run_id=?").run("run-1");
    const wrongRevision = db.prepare(`UPDATE learner_observation_jobs SET completed_seq=claimed_requested_seq
      WHERE run_id=? AND state='running' AND claimed_requested_seq=? AND derived_rev=? AND claim_generation=?`).run("run-1", 3, 2, 1);
    const wrongGeneration = db.prepare(`UPDATE learner_observation_jobs SET completed_seq=claimed_requested_seq
      WHERE run_id=? AND state='running' AND claimed_requested_seq=? AND derived_rev=? AND claim_generation=?`).run("run-1", 3, 1, 2);
    expect(wrongRevision.changes).toBe(0);
    expect(wrongGeneration.changes).toBe(0);
    const changed = db.prepare(`UPDATE learner_observation_jobs SET completed_seq=claimed_requested_seq,state='pending',
      claimed_requested_seq=NULL,claim_token=NULL,claimed_by=NULL,lease_expires_at=NULL
      WHERE run_id=? AND state='running' AND requested_seq>=? AND claimed_requested_seq=? AND derived_rev=? AND claim_generation=? AND claim_token=? AND claimed_by=?`).run("run-1", 3, 3, 1, 1, "token", "worker");
    expect(changed.changes).toBe(1);
    expect(db.prepare("SELECT requested_seq,completed_seq,state FROM learner_observation_jobs").get()).toEqual({ requested_seq: 4, completed_seq: 3, state: "pending" });
    const stale = db.prepare("UPDATE learner_observation_jobs SET completed_seq=4 WHERE run_id=? AND state='running' AND claim_generation=?").run("run-1", 1);
    expect(stale.changes).toBe(0);
    db.close();
  });

  it("refuses negative/crossed facts, invalid pack provenance and missing indexes", () => {
    const db = database();
    db.prepare("INSERT INTO learner_observation_denominators VALUES (?,?,?,?,?,?,?)").run("learner-1", "run-1", "opening", "played", 1, "at", 1);
    const insertObservation = db.prepare(`INSERT INTO learner_observations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const base = ["learner-1", "run-1", "rules.structural.event.backward_pawn", 1, "gained", "gained", "opening", "played", "pack", "pack-1", 1, 1, 0.5, "[]", "[]", "at", 1];
    insertObservation.run(...base);
    expect(() => insertObservation.run(...base.map((value, index) => index === 11 ? -1 : index === 4 || index === 5 ? "lost" : value))).toThrow();
    expect(() => insertObservation.run(...base.map((value, index) => index === 12 ? 2 : index === 4 ? "lost" : value))).toThrow();
    expect(() => insertObservation.run(...base.map((value, index) => index === 9 ? null : index === 4 ? "preserved" : index === 5 ? "preserved" : value))).toThrow();
    expect(() => db.prepare("INSERT INTO learner_structure_stats VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").run("learner-1", "run-1", "root", "n1", "position", null, -1, 0, 0, 0, 0, "at", 1)).toThrow();
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'learner_%' ORDER BY name").all().map((row) => String((row as Record<string, unknown>).name));
    expect(indexes).toEqual(["learner_observation_denominators_by_learner", "learner_observation_jobs_work", "learner_observations_by_family", "learner_observations_by_run", "learner_structure_stats_by_learner"]);
    db.close();
  });
});

describe("D2065 deletion suppression and D2067/D2069 boundaries", () => {
  it("keeps a shared run readable while delete-rebuild remains permanently profile-empty", () => {
    const shared = { id: "shared", ownerLearnerId: "learner-1", shared: true, disposition: "profileable" as const };
    const deleted = deleteLearnerProfile(shared, "learner-1")!;
    expect(deleted).toEqual({ ...shared, ownerLearnerId: "__legacy", disposition: "account_deleted" });
    expect(rebuildProfileOwner(deleted)).toBeNull();
    expect(rebuildProfileOwner({ ...shared, ownerLearnerId: "__legacy" })).toBe("__legacy");
    expect(rebuildProfileOwner({ ...shared, ownerLearnerId: "learner-2" })).toBe("learner-2");
    expect(deleteLearnerProfile({ ...shared, shared: false }, "learner-1")).toBeNull();
  });

  it("has bounded provider-free lifecycle defaults and drains in-flight work on stop", () => {
    expect(LONGITUDINAL_WORKER_ONCE_ENTRY).toBe("apps/server/src/longitudinal-worker-once.ts");
    expect(LONGITUDINAL_WORKER_DEFAULTS).toEqual({ workerBatchSize: 4, workerPollMs: 1_000, workerLeaseMs: 30_000 });
    const worker = new LongitudinalProjectionWorker();
    worker.start();
    expect(worker.beginBatch(99)).toBe(4);
    expect(worker.stop()).toBe("stopping");
    expect(worker.beginBatch(1)).toBe(0);
    for (let index = 0; index < 4; index += 1) worker.finishOne();
    expect(worker.state).toBe("stopped");
    expect(() => new LongitudinalProjectionWorker({ workerBatchSize: 0, workerPollMs: 1_000, workerLeaseMs: 30_000 })).toThrow(/OPTIONS_INVALID/u);
  });

  it("binds the executable model to the exact RFC reader and worker operation", () => {
    const rfc = readFileSync(new URL("../../rfc/longitudinal-store.md", import.meta.url), "utf8");
    expect(rfc).toMatch(/interface LongitudinalReadQuery/u);
    expect(rfc).toMatch(/type LongitudinalReadResult/u);
    expect(rfc).toMatch(/readLongitudinalSnapshot\(/u);
    expect(rfc).toMatch(/LongitudinalProjectionWorker/u);
    expect(rfc).toMatch(/make longitudinal-worker-once/u);
    expect(rfc).toMatch(/workerBatchSize: 4, workerPollMs: 1000,[\s\S]*workerLeaseMs: 30000/u);
    expect(rfc).toMatch(/longitudinal_profile_disposition='profileable'/u);
  });
});

describe("D2063/D2066 complete-population semantic algebra", () => {
  const edge = LONGITUDINAL_INGEST_REGISTRY.find((row): row is Extract<LongitudinalConstructor, { kind: "edge" }> => row.kind === "edge" && row.projection.id === "rules.structural.event.backward_pawn")!;
  const avoidance = LONGITUDINAL_INGEST_REGISTRY.find((row): row is Extract<LongitudinalConstructor, { kind: "population" }> => row.kind === "population" && row.projection.id === "derived.semantic_avoidance.backward_pawn")!;
  const input = { beforeFen: "before", moveUci: "played", afterFen: "after", constructor: edge, semanticSign: "gained" as const, sourceSign: "gained" as const };
  const alternatives = () => [{ beforeFen: "before", moveUci: "alt-a", afterFen: "a" }, { beforeFen: "before", moveUci: "alt-b", afterFen: "b" }];
  const event = (moveUci: string, projection = edge.projection.id, sign = "gained") => ({ projection: { id: projection, version: 1 }, sign, anchor: { moveUci } }) as never;

  it("deduplicates operands per edge and separates gained from lost identities", () => {
    const events = (_before: string, move: string) => move === "played" ? [event(move), event(move)] : move === "alt-a" ? [] : [event(move)];
    const gained = projectDecisionPopulation(input, { alternatives, events });
    expect(gained).toMatchObject({ kind: "available", opportunity: true, occurred: true, alternativeShare: 0.5,
      identity: { semanticSign: "gained", sourceSign: "gained" } });
    const lost = projectDecisionPopulation({ ...input, semanticSign: "lost", sourceSign: "lost" }, { alternatives, events: (_before, move) => move === "alt-a" ? [event(move, edge.projection.id, "lost")] : [] });
    expect(lost).toMatchObject({ kind: "available", opportunity: true, occurred: false, identity: { semanticSign: "lost", sourceSign: "lost" } });
    expect(gained.kind === "available" && lost.kind === "available" && gained.identity).not.toEqual(lost.kind === "available" && lost.identity);
  });

  it("makes only mixed, complete, non-forced populations declinable", () => {
    const all = projectDecisionPopulation(input, { alternatives, events: (_before, move) => [event(move)] });
    const none = projectDecisionPopulation(input, { alternatives, events: () => [] });
    const forced = projectDecisionPopulation(input, { alternatives: () => [], events: () => [] });
    const unavailable = projectDecisionPopulation(input, { alternatives, events: (_before, move) => move === "alt-b" ? undefined : [] });
    expect(all).toMatchObject({ kind: "available", opportunity: false });
    expect(none).toMatchObject({ kind: "available", opportunity: false });
    expect(forced).toEqual({ kind: "unavailable", reason: "forced_move" });
    expect(unavailable).toEqual({ kind: "unavailable", reason: "population_incomplete" });
  });

  it("ties avoidance occurrence and share to the base projection and source sign", () => {
    const result = projectDecisionPopulation({ ...input, constructor: avoidance, semanticSign: "avoided", sourceSign: "gained" }, {
      alternatives, events: (_before, move) => move === "played" ? [] : [event(move)],
    });
    expect(result).toMatchObject({ kind: "available", opportunity: true, occurred: true, alternativeShare: 1,
      identity: { projectionId: avoidance.projection.id, semanticSign: "avoided", sourceSign: "gained" } });
    expect(() => projectDecisionPopulation({ ...input, constructor: avoidance, semanticSign: "state", sourceSign: "gained" }, { alternatives, events: () => [] })).toThrow(/PROJECTION_SIGN_IMPOSSIBLE/u);
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
    expect(snapshotPrefix(events, claim.claimedRequestedSeq).map((event) => event.seq)).toEqual([1, 2, 3]);
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
