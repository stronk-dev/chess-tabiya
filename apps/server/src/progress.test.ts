import { commitMove, createRun, fork } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { projectAttempts } from "./progress.js";
import { EvidenceJobQueue } from "./evidence-queue.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-13T12:00:00.000Z";

function run(id = "progress-run") {
  return createRun({
    id,
    packId: "progress-pack",
    packDigest: `sha256:${"a".repeat(64)}`,
    startFen: FEN,
    policyConfig: {
      seedMode: "per_branch",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    seed: 7,
    createdAt: at,
  });
}

describe("return and progression projection", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => stores.splice(0).forEach((store) => store.close()));

  it("counts played branches as attempts and leaves empty forks uncountable", () => {
    const main = commitMove(run(), "e2e4", { at }).run;
    const branched = fork(main, main.nodes[0]!.id, { at }).run;
    const projected = projectAttempts({ run: branched, learnerId: "learner-a" });

    expect(projected.attempts.map((attempt) => ({
      branch: attempt.branchLabel,
      countable: attempt.countable,
      verdict: attempt.verdict,
    }))).toEqual([
      { branch: "main", countable: true, verdict: "open" },
      { branch: "alt-1", countable: false, verdict: "open" },
    ]);
  });

  it("assigns a stable ordinal and keeps one automatic schedule across re-projection", () => {
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    const played = commitMove(run(), "e2e4", { at }).run;
    storage.create(played, "writer-a", "Progress pack");
    const projection = projectAttempts({ run: played, learnerId: "__legacy" });

    for (let index = 0; index < 5; index += 1) {
      storage.upsertAttempts(projection.attempts, projection.conceptTags);
    }

    expect(storage.progress("__legacy")).toMatchObject([{
      attemptNo: 1,
      countable: true,
      verdict: "open",
      origin: "fresh",
    }]);
    expect(storage.dueSchedules("__legacy", "9999-12-31T23:59:59.999Z")).toHaveLength(1);
    expect(storage.dueSchedules("__legacy", "9999-12-31T23:59:59.999Z")[0]).toMatchObject({
      kind: "varied",
      origin: "auto",
      state: "pending",
    });
  });

  it("keeps learner-owned schedules isolated", () => {
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    const played = commitMove(run(), "e2e4", { at }).run;
    storage.create(played, "writer-a", "Progress pack");
    const root = played.nodes[0]!;
    storage.createSchedule({
      id: "schedule-a",
      learnerId: "__legacy",
      rootKey: `pack|progress-pack|${root.transposeKey}`,
      sessionKind: "pack",
      packId: "progress-pack",
      rootTransposeKey: root.transposeKey,
      kind: "blocked",
      variant: null,
      origin: "learner",
      dueAt: at,
      createdAt: at,
      sourceRunId: played.id,
      sourceNodeId: root.id,
    });
    expect(() => storage.dismissSchedule("schedule-a", "someone-else")).toThrow(/Unknown pending schedule/);
    expect(storage.dueSchedules("__legacy", at)).toHaveLength(1);
  });

  it("projects every service mutation and produces a visible transfer schedule", async () => {
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    const service = new RunService(storage, {
      progressStorage: storage,
      evidenceQueue: new EvidenceJobQueue({
        async execute() {
          return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } };
        },
      }),
    });
    const principal = { learnerId: "__legacy", handle: "__legacy" } as const;
    const created = await service.create({
      id: "service-progress",
      session: {
        kind: "position",
        start: { fen: FEN, side: "white" },
        feedbackPolicy: "attempt_end",
        opponentPolicy: { mode: "human_common" },
      },
      policyConfig: {
        seedMode: "per_branch",
        locus: { executedAt: "server", engineIds: [], modelIds: [] },
      },
      seed: 11,
      createdAt: at,
    }, { writerId: "writer-a", learnerId: "__legacy" });
    service.move(created.id, principal, "writer-a", "e2e4", { at });
    expect(service.progress(principal)[0]).toMatchObject({ countable: true, userPlyCount: 1 });

    expect(() => service.schedule(created.id, principal, "writer-b", {
      nodeId: created.nodes[0]!.id,
      kind: "blocked",
      at,
    })).toThrow(/run lease/i);
    const scheduled = service.schedule(created.id, principal, "writer-a", {
      nodeId: created.nodes[0]!.id,
      kind: "blocked",
      at,
    });
    expect(scheduled.result.emitted).toMatchObject([{
      type: "transfer.scheduled",
      data: { scheduleId: scheduled.schedule.id },
    }]);
    expect(service.due(principal, at).some((item) => item.id === scheduled.schedule.id)).toBe(true);

    const duplicate = await service.duplicate(created.id, principal, {
      id: "service-progress-copy",
      writerId: "writer-copy",
      seed: 12,
      createdAt: at,
    });
    expect(duplicate.id).toBe("service-progress-copy");
    expect(service.progress(principal).find((item) => item.runId === duplicate.id)).toMatchObject({
      countable: false,
      origin: "duplicate",
      derivedFromRunId: created.id,
    });
  });
});
