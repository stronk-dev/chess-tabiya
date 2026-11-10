import { progressRecommendationSentence } from "../../web/src/lib/progress-response.js";
import { readFileSync } from "node:fs";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { registeredShapeFixture } from "../../../packages/runtime/src/testing/registered-shape-fixture.js";
import { commitMove, createRun, fork } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { automaticScheduleDecision, projectAttempts, type AttemptRow } from "./progress.js";
import { EvidenceJobQueue } from "./evidence-queue.js";
import { PackRegistry } from "./pack-registry.js";
import { ShapeRegistry } from "./shape-registry.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-13T12:00:00.000Z";

function run(id = "progress-run", packId = "progress-pack") {
  return createRun({
    id,
    packId,
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

  it("schedules graded histories by their stable streak and ungraded histories by attempt count", () => {
    type Result = "stable" | "unstable" | "ungraded";
    const histories: readonly { readonly name: string; readonly results: readonly Result[]; readonly expectedDays: number }[] = [
      { name: "two stable", results: ["stable", "stable"], expectedDays: 1 },
      { name: "three stable", results: ["stable", "stable", "stable"], expectedDays: 3 },
      { name: "six stable", results: Array<Result>(6).fill("stable"), expectedDays: 35 },
      { name: "four lapses then two stable", results: ["unstable", "unstable", "unstable", "unstable", "stable", "stable"], expectedDays: 1 },
      { name: "one lapse then two stable", results: ["unstable", "stable", "stable"], expectedDays: 1 },
      { name: "five stable then lapse", results: ["stable", "stable", "stable", "stable", "stable", "unstable"], expectedDays: 0 },
      { name: "three ungraded", results: Array<Result>(3).fill("ungraded"), expectedDays: 7 },
      { name: "eight ungraded", results: Array<Result>(8).fill("ungraded"), expectedDays: 35 },
    ];

    for (const history of histories) {
      const storage = new SQLiteRunStorage();
      stores.push(storage);
      let latestEndedAt = at;
      for (const [index, result] of history.results.entries()) {
        latestEndedAt = new Date(Date.parse(at) + index * 60_000).toISOString();
        const played = commitMove(run(`ladder-${history.name.replaceAll(" ", "-")}-${index}`), "e2e4", { at: latestEndedAt }).run;
        storage.create(played, `writer-${index}`, "Progress pack");
        const base = projectAttempts({ run: played, learnerId: "__legacy" }).attempts[0]!;
        const attempt: AttemptRow = Object.freeze({
          ...base,
          countable: true,
          graded: result !== "ungraded",
          objectiveState: result === "stable" ? "achieved" : result === "unstable" ? "failed" : "active",
          verdict: result === "ungraded" ? "open" : result,
          startedAt: latestEndedAt,
          endedAt: latestEndedAt,
        });
        storage.upsertAttempts([attempt], []);
      }
      const schedule = storage.pendingScheduleForRoot("__legacy", projectAttempts({
        run: commitMove(run(`probe-${history.name.replaceAll(" ", "-")}`), "e2e4", { at: latestEndedAt }).run,
        learnerId: "__legacy",
      }).attempts[0]!.rootKey)!;
      expect({ name: history.name, kind: schedule.kind, days: (Date.parse(schedule.dueAt) - Date.parse(latestEndedAt)) / 86_400_000 }).toEqual({
        name: history.name,
        kind: history.expectedDays === 0 ? "blocked" : "varied",
        days: history.expectedDays,
      });
    }

    expect(automaticScheduleDecision(Array.from({ length: 6 }, () => ({ graded: true, verdict: "stable" as const })))).toMatchObject({
      kind: "varied",
      days: 35,
      ladderIndex: 4,
      trailingStable: 6,
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

  it("recommends only packs where an encountered shape is present", async () => {
    const storage = new SQLiteRunStorage(); stores.push(storage);
    const shapeRegistry = new ShapeRegistry();
    await shapeRegistry.add({ ...registeredShapeFixture("encountered-shape"), trigger: {
      kind: "pieceOnSquare", square: "c3", piece: { color: "white", role: "knight" } } }, "community", "fixture-author");
    const example = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
    const packRegistry = await PackRegistry.fromDocuments(["z-present-pack", "present-pack", "a-present-pack", "prospective-pack"].map(id => ({
      source: `mechanical-${id}`, channel: "community" as const, value: withDerivedRequires({ ...example,
        id, shapes: [{ shape: "encountered-shape", relation: id === "prospective-pack" ? "prospective" : "present" }] }, { shapes: shapeRegistry }) })), { shapes: shapeRegistry });
    const pack = packRegistry.required("prospective-pack");
    const start = createRun({ id: "prospective-attempt", packId: pack.document.id, packDigest: pack.digest, startFen: pack.document.start.fen,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 12, createdAt: at });
    const played = commitMove(start, "c1e3", { at }).run;
    storage.create(played, "writer-a", "Prospective reference");
    const projected = projectAttempts({ run: played, learnerId: "__legacy" });
    storage.upsertAttempts(projected.attempts, projected.conceptTags);
    const service = new RunService(storage, { progressStorage: storage, packRegistry, shapeRegistry });
    expect(await service.shapeRecommendations({ learnerId: "__legacy", handle: "__legacy" })).toMatchObject({ total: 1,
      recommendations: [{ shapeId: "encountered-shape", packIds: ["a-present-pack", "present-pack", "z-present-pack"] }] });
    expect(storage.progress("__legacy").find(row => row.runId === played.id)).toMatchObject({ countable: true, packId: "prospective-pack" });
    const offered = await service.shapeRecommendations({ learnerId: "__legacy", handle: "__legacy" });
    expect(offered.recommendations[0]!.sentence).toBe("You met Mechanical test occupancy in 1 of your preserved runs.");
    expect(progressRecommendationSentence(offered.recommendations[0]!)).toBe(offered.recommendations[0]!.sentence);
    const present = packRegistry.required("present-pack");
    const unplayed = createRun({ id: "unplayed-present", packId: present.document.id, packDigest: present.digest, startFen: present.document.start.fen,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 14, createdAt: at });
    storage.create(unplayed, "unplayed-writer");
    const empty = projectAttempts({ run: unplayed, learnerId: "__legacy" }); storage.upsertAttempts(empty.attempts, empty.conceptTags);
    expect(storage.progress("__legacy").find(row => row.runId === unplayed.id)?.countable).toBe(false);
    expect((await service.shapeRecommendations({ learnerId: "__legacy", handle: "__legacy" })).total).toBe(1);
    const attempted = commitMove(unplayed, "c1e3", { at }).run; storage.save(attempted, "unplayed-writer");
    const counted = projectAttempts({ run: attempted, learnerId: "__legacy" }); storage.upsertAttempts(counted.attempts, counted.conceptTags);
    expect(storage.progress("__legacy").find(row => row.runId === attempted.id)?.countable).toBe(true);
    expect(await service.shapeRecommendations({ learnerId: "__legacy", handle: "__legacy" })).toEqual({ recommendations: [], total: 0 });
  });
});
