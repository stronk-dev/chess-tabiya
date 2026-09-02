// DISPOSABLE author falsifier — D2402-D2406. Not production code.
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vitest";

import { commitMove, createRun, rewind } from "../../packages/runtime/src/index.js";
import {
  DurableJobProtocol,
  LONGITUDINAL_EVENT_LOOP_BUDGET,
  LONGITUDINAL_EXECUTION_CONTRACT,
  LONGITUDINAL_MIGRATION_SQL,
  LONGITUDINAL_RETRY_LIMITS,
  assertLongitudinalExecutionContract,
  classifyLongitudinalCut,
  projectNormativeRun,
  reconcileLongitudinalJobs,
  type LongitudinalJobState,
  type ReconciliationJob,
} from "../d1612-longitudinal-contract-harness/longitudinal-contract.js";

const digest = (char: string): string => `sha256:${char.repeat(64)}`;
const rfc = readFileSync("rfc/longitudinal-store.md", "utf8");

function reconciliationJob(state: LongitudinalJobState, revision = 1): ReconciliationJob {
  return {
    runId: `run-${state}`,
    learnerId: "learner",
    requestedSeq: 8,
    requestedSourceDigest: digest("a"),
    completedSeq: state === "complete" ? 8 : 3,
    derivedRev: revision,
    state,
    claimGeneration: 4,
    failureCode: state === "retry_wait" ? "derivation_failed" : state === "quarantined" ? "snapshot_invalid" : null,
    retryCount: state === "retry_wait" ? 1 : state === "quarantined" ? 1 : 0,
  };
}

describe("D2402-D2406 fourth longitudinal author repair", () => {
  it("D2402 resets complete, running, retry-wait and quarantined revisions to one pending shape", () => {
    const states = ["complete", "running", "retry_wait", "quarantined"] as const;
    for (const state of states) {
      const prior = reconciliationJob(state);
      const result = reconcileLongitudinalJobs({
        runs: [{ id: prior.runId, ownerLearnerId: "learner", shared: false, disposition: "profileable", eventHead: 9, sourceDigest: digest("b") }],
        jobs: [prior],
        derivedRev: 2,
      });
      expect(result.jobs[0]).toEqual({
        runId: prior.runId,
        learnerId: "learner",
        requestedSeq: 9,
        requestedSourceDigest: digest("b"),
        completedSeq: 0,
        derivedRev: 2,
        state: "pending",
        claimGeneration: 5,
        failureCode: null,
        retryCount: 0,
      });
      expect(result.receipt.revisionReset).toBe(1);
      expect(reconcileLongitudinalJobs({ runs: [{ id: prior.runId, ownerLearnerId: "learner", shared: false, disposition: "profileable", eventHead: 9, sourceDigest: digest("b") }], jobs: result.jobs, derivedRev: 2 }).jobs).toEqual(result.jobs);
    }
  });

  it("D2402 makes old-row deletion and revision reset one SQLite transaction", () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys=ON; CREATE TABLE learners(id TEXT PRIMARY KEY) STRICT; CREATE TABLE drill_runs(id TEXT PRIMARY KEY, owner_learner_id TEXT NOT NULL) STRICT;");
    db.exec(LONGITUDINAL_MIGRATION_SQL);
    db.exec("INSERT INTO learners VALUES ('learner'); INSERT INTO drill_runs(id,owner_learner_id) VALUES ('run','learner');");
    db.prepare("INSERT INTO learner_observation_denominators VALUES (?,?,?,?,?,?,?)").run("learner", "run", "opening", "played", 1, "at", 1);
    db.prepare("INSERT INTO learner_observation_jobs(run_id,learner_id,requested_seq,requested_source_digest,completed_seq,derived_rev,state,claim_generation,retry_count,updated_at) VALUES (?,?,?,?,?,?,?,4,0,'at')").run("run", "learner", 8, digest("a"), 8, 1, "complete");
    const reset = () => {
      db.prepare("DELETE FROM learner_observation_denominators WHERE run_id=? AND learner_id=? AND derived_rev=?").run("run", "learner", 1);
      db.prepare("DELETE FROM learner_structure_stats WHERE run_id=? AND learner_id=? AND derived_rev=?").run("run", "learner", 1);
      return db.prepare(`UPDATE learner_observation_jobs SET requested_seq=9,requested_source_digest=?,completed_seq=0,
        derived_rev=2,state='pending',claim_generation=claim_generation+1,claimed_requested_seq=NULL,
        claimed_source_digest=NULL,claim_token=NULL,claimed_by=NULL,lease_expires_at=NULL,
        retry_count=0,next_attempt_at=NULL,failure_code=NULL,updated_at='now'
        WHERE run_id='run' AND learner_id='learner' AND derived_rev=1`).run(digest("b"));
    };
    db.exec("BEGIN IMMEDIATE");
    expect(reset().changes).toBe(1);
    db.exec("ROLLBACK");
    expect(db.prepare("SELECT derived_rev,state,completed_seq FROM learner_observation_jobs").get()).toEqual({ derived_rev: 1, state: "complete", completed_seq: 8 });
    expect(db.prepare("SELECT count(*) AS n FROM learner_observation_denominators").get()).toEqual({ n: 1 });
    db.exec("BEGIN IMMEDIATE");
    expect(reset().changes).toBe(1);
    db.exec("COMMIT");
    expect(db.prepare("SELECT derived_rev,state,completed_seq,claim_generation FROM learner_observation_jobs").get()).toEqual({ derived_rev: 2, state: "pending", completed_seq: 0, claim_generation: 5 });
    expect(db.prepare("SELECT count(*) AS n FROM learner_observation_denominators").get()).toEqual({ n: 0 });
    db.close();
  });

  it("D2403 refuses a retained N cut throughout N-complete to M-pending to M-complete", () => {
    const jobs = new DurableJobProtocol("cut", 3, 1);
    const first = jobs.claim("worker", 0, 10)!;
    expect(jobs.publish(first, 3, 1)).toBe(true);
    expect(classifyLongitudinalCut(3, 1, jobs.job)).toBe("complete");
    jobs.request(4, digest("b"));
    expect(classifyLongitudinalCut(3, 1, jobs.job)).toBe("cut_superseded");
    expect(classifyLongitudinalCut(4, 1, jobs.job)).toBe("pending");
    const second = jobs.claim("worker", 2, 10)!;
    expect(jobs.publish(second, 4, 3)).toBe(true);
    expect(classifyLongitudinalCut(3, 1, jobs.job)).toBe("cut_superseded");
    expect(classifyLongitudinalCut(4, 1, jobs.job)).toBe("complete");
  });

  it("D2404 seals worker-thread execution, checkpoint renewal and event-loop budgets", () => {
    expect(LONGITUDINAL_EXECUTION_CONTRACT).toEqual({ executor: "node_worker_thread", databaseOwner: "worker_thread", renewal: "synchronous_decision_checkpoint", payloadCrossing: "closed_progress_only" });
    expect(LONGITUDINAL_EVENT_LOOP_BUDGET).toEqual({ probeHz: 20, p95Ms: 50, maxDelayMs: 250, maxProbeMs: 500 });
    expect(() => assertLongitudinalExecutionContract({ ...LONGITUDINAL_EXECUTION_CONTRACT, renewal: "timer" as never })).toThrow(/EXECUTION_CONTRACT_INVALID/u);
    expect(rfc).toContain("`node:worker_threads`");
    expect(rfc).toMatch(/progress checkpoint after every decision/iu);
    expect(rfc).toMatch(/20 Hz[\s\S]{0,200}p95 \*\*<50 ms\*\*[\s\S]{0,120}max \*\*<250 ms\*\*/u);
  });

  it("D2405 keeps unattributable shared structure as honest absence", () => {
    const at = "2026-09-02T09:00:00.000Z";
    let run = createRun({ id: "shared", session: { kind: "position", start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 } }, sessionDigest: digest("c"), policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    run = commitMove(run, "e2e4", { at }).run;
    run = rewind(run, run.nodes[0]!.id, at).run;
    run = commitMove(run, "d2d4", { at }).run;
    const authorship = Object.fromEntries(run.events.filter((event) => event.type === "move.committed").map((event) => [event.seq, "other" as const]));
    const shared = projectNormativeRun({ run, shared: true, importedMainlinePlies: null, moveAuthorshipByEventSeq: authorship });
    const privateRun = projectNormativeRun({ run, shared: false, importedMainlinePlies: null });
    expect(shared).toEqual({ decisions: [], structureStats: [] });
    expect(privateRun.structureStats[0]).toMatchObject({ branchCount: 2, rewoundCount: 1, forkedCount: 1 });
  });

  it("D2406 bounds retries, quarantines permanent failure and reopens only on changed truth", () => {
    expect(LONGITUDINAL_RETRY_LIMITS).toEqual({ snapshot_invalid: 1, derivation_failed: 3, publication_conflict: 5 });
    const corrupt = new DurableJobProtocol("corrupt", 8, 1);
    const corruptClaim = corrupt.claim("worker", 0, 10)!;
    expect(corrupt.fail(corruptClaim, "snapshot_invalid", 1)).toBe(true);
    expect(corrupt.job).toMatchObject({ state: "quarantined", retryCount: 1, nextAttemptAt: null });
    expect(corrupt.claim("poll", 1_000_000, 10)).toBeNull();
    corrupt.request(8);
    expect(corrupt.job.state).toBe("quarantined");
    corrupt.request(8, digest("b"));
    expect(corrupt.job).toMatchObject({ state: "pending", retryCount: 0, failureCode: null });

    const transient = new DurableJobProtocol("transient", 8, 1);
    for (const [claimAt, failAt] of [[0, 1], [5_001, 5_002], [15_002, 15_003]] as const) {
      const claim = transient.claim("worker", claimAt, 100)!;
      expect(transient.fail(claim, "derivation_failed", failAt)).toBe(true);
    }
    expect(transient.job).toMatchObject({ state: "quarantined", retryCount: 3, nextAttemptAt: null });
  });

  it("D2406 binds source digest into renewal/publication ownership", () => {
    const jobs = new DurableJobProtocol("source", 4, 1, "learner", digest("a"));
    const stale = jobs.claim("worker-a", 0, 100)!;
    jobs.request(4, digest("b"));
    expect(jobs.renew(stale, 1, 100)).toBeNull();
    expect(jobs.publish(stale, 4, 1)).toBe(false);
    const fresh = jobs.claim("worker-b", 100, 100)!;
    expect(fresh.claimedSourceDigest).toBe(digest("b"));
  });

  it("closes status, DDL and reader vocabulary over all five repairs", () => {
    expect(rfc).toMatch(/fourth author repair complete 2026-09-02/u);
    for (const token of ["requested_source_digest", "claimed_source_digest", "retry_wait", "quarantined", "cut_superseded", "worker_threads"]) expect(rfc).toContain(token);
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE learners(id TEXT PRIMARY KEY) STRICT; CREATE TABLE drill_runs(id TEXT PRIMARY KEY, owner_learner_id TEXT NOT NULL) STRICT;");
    db.exec(LONGITUDINAL_MIGRATION_SQL);
    const columns = db.prepare("PRAGMA table_info(learner_observation_jobs)").all().map((row) => String((row as Record<string, unknown>).name));
    for (const column of ["requested_source_digest", "claimed_source_digest", "retry_count", "next_attempt_at"]) expect(columns).toContain(column);
    db.close();
  });
});
