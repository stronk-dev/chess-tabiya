// DISPOSABLE third fresh independent review harness — D2402-D2406. Not production code.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { commitMove, createRun, rewind } from "../../packages/runtime/src/index.js";
import {
  DurableJobProtocol,
  LONGITUDINAL_WORKER_DEFAULTS,
  projectNormativeRun,
  reconcileLongitudinalJobs,
} from "../d1612-longitudinal-contract-harness/longitudinal-contract.js";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/longitudinal-store.md");
const model = read("tools/d1612-longitudinal-contract-harness/longitudinal-contract.ts");
const cost = read("tools/d1405-longitudinal-cost-harness/cost.test.ts");
const semantic = read("packages/runtime/src/semantic-evidence.ts");

describe("D2402-D2406 third fresh longitudinal review", () => {
  it("D2402: revision reconciliation can report reset without resetting completion state", () => {
    const jobs = reconcileLongitudinalJobs({
      runs: [{ id: "run", ownerLearnerId: "learner", shared: false, disposition: "profileable", eventHead: 8 }],
      jobs: [{ runId: "run", learnerId: "learner", requestedSeq: 8, derivedRev: 1 }],
      derivedRev: 2,
    });
    expect(jobs.receipt.revisionReset).toBe(1);
    expect(jobs.jobs[0]).toEqual({ runId: "run", learnerId: "learner", requestedSeq: 8, derivedRev: 2 });
    expect(model).toMatch(/interface ReconciliationJob \{[^}]*requestedSeq[^}]*derivedRev[^}]*\}/su);
    expect(model).not.toMatch(/interface ReconciliationJob \{[^}]*(?:completedSeq|state|claimGeneration|failureCode)/su);
    expect(rfc).not.toMatch(/wrong `derived_rev`[\s\S]{0,800}completed_seq\s*=\s*0[\s\S]{0,400}state\s*=\s*['"]pending/iu);
  });

  it("D2403: the reader accepts arbitrary cuts while the tables retain only one row set", () => {
    expect(rfc).toMatch(/kind: "runs"; cuts: readonly \{ runId: string; requestedSeq: number \}\[\]/u);
    expect(rfc).toMatch(/Publication replaces all three derived data classes for the exact cut/u);
    expect(rfc).not.toMatch(/reason: [^;]*(?:cut_mismatch|cut_superseded|requested_cut_unavailable)/u);
    const ddl = rfc.slice(rfc.indexOf("CREATE TABLE learner_observation_denominators"), rfc.indexOf("CREATE TABLE learner_observation_jobs"));
    expect(ddl).not.toMatch(/published_seq|completed_seq|projection_cut/u);
  });

  it("D2404: the measured projector is synchronous and the RFC supplies no isolation or yield contract", () => {
    expect(cost).toMatch(/function project\([^)]*\): ProjectionMeasure \{[\s\S]*for \(const row of path\)[\s\S]*legalAlternativeEdges[\s\S]*localSemanticEvents/u);
    expect(semantic).toMatch(/export function legalAlternativeEdges\(/u);
    expect(semantic).toMatch(/export function localSemanticEvents\(/u);
    expect(rfc).toMatch(/composed once by[\s\S]{0,120}`createApplication` beside storage/u);
    expect(rfc).not.toMatch(/worker_threads|Worker\(|child_process|setImmediate|event-loop delay|cooperative yield/iu);
    expect(rfc).toMatch(/47\.29 seconds/u);
  });

  it("D2405: shared structure stats survive when no move belongs to the owner", () => {
    const at = "2026-08-31T10:00:00.000Z";
    let run = createRun({
      id: "shared-history",
      session: {
        kind: "position",
        start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" },
        feedbackPolicy: "attempt_end",
        opponentPolicy: { mode: "human_common", targetElo: 1500 },
      },
      sessionDigest: `sha256:${"a".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    run = commitMove(run, "e2e4", { at }).run;
    run = rewind(run, run.nodes[0]!.id, at).run;
    run = commitMove(run, "d2d4", { at }).run;
    const authorship = Object.fromEntries(
      run.events.filter((event) => event.type === "move.committed").map((event) => [event.seq, "other" as const]),
    );
    const projected = projectNormativeRun({ run, shared: true, importedMainlinePlies: null, moveAuthorshipByEventSeq: authorship });
    expect(projected.decisions).toEqual([]);
    expect(projected.structureStats).toHaveLength(1);
    expect(projected.structureStats[0]).toMatchObject({ branchCount: 2, rewoundCount: 1, forkedCount: 1 });
  });

  it("D2406: a failed expensive job is immediately claimable with no retry budget", () => {
    const jobs = new DurableJobProtocol("corrupt", 80, 1);
    const first = jobs.claim("worker-a", 0, LONGITUDINAL_WORKER_DEFAULTS.workerLeaseMs)!;
    expect(jobs.fail(first, "snapshot_invalid", 1)).toBe(true);
    const retry = jobs.claim("worker-b", 2, LONGITUDINAL_WORKER_DEFAULTS.workerLeaseMs);
    expect(retry).not.toBeNull();
    expect(model).not.toMatch(/nextAttemptAt|retryCount|maxAttempts|quarantined/u);
    expect(rfc).not.toMatch(/next_attempt_at|retry_count|max_attempts|quarantin|terminal_failure/iu);
  });
});
