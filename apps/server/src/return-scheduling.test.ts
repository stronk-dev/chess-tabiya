import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { commitMove, createRun, type OpponentSelection } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import type { CorpusQuery, CorpusResult, CorpusSource } from "./corpus.js";
import {
  automaticScheduleDecision,
  DUE_INTAKE_LIMIT,
  isOffScheduleAttempt,
  orderDueByFrequency,
  projectAttempts,
  RETURN_STANDING_MIN_RUNG,
  RETURN_STANDINGS,
  returnStanding,
  rotatedRetryVariant,
  VARIED_LADDER_DAYS,
  type AttemptOrigin,
  type AttemptRow,
  type ConceptTagRow,
} from "./progress.js";
import { IMPORTED_GAME_PREDICTION_CHECKPOINT, RunService } from "./service.js";
import {
  DIFFICULT_ROOT_RUNS_SQL,
  DIFFICULT_ROOTS_SQL,
  SQLiteRunStorage,
  type RetryVariantKinds,
} from "./storage.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-09-01T12:00:00.000Z";
const DAY = 86_400_000;
const principal = { learnerId: "__legacy", handle: "__legacy" } as const;

type Result = "stable" | "unstable" | "ungraded";
interface Step {
  readonly result: Result;
  readonly origin?: AttemptOrigin;
  /** Offset in ms from the attempt's start to the root's pending due time; positive = reviewed early. */
  readonly dueAheadMs?: number;
}

function run(id: string, packId = "ladder-pack") {
  return createRun({
    id,
    packId,
    packDigest: `sha256:${"b".repeat(64)}`,
    startFen: FEN,
    policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 7,
    createdAt: at,
  });
}

/** Drives the real storage projection and `#refreshAutoSchedule` over a verdict history. */
function play(storage: SQLiteRunStorage, name: string, steps: readonly Step[], options: {
  readonly packId?: string;
  readonly retryVariants?: RetryVariantKinds;
  readonly startIndex?: number;
} = {}) {
  let latestEndedAt = at;
  let rootKey = "";
  for (const [offset, step] of steps.entries()) {
    const index = (options.startIndex ?? 0) + offset;
    latestEndedAt = new Date(Date.parse(at) + index * 60_000).toISOString();
    const played = commitMove(run(`${name}-${index}`, options.packId), "e2e4", { at: latestEndedAt }).run;
    storage.create(played, `writer-${name}-${index}`, "Ladder pack");
    const base = projectAttempts({ run: played, learnerId: "__legacy" }).attempts[0]!;
    rootKey = base.rootKey;
    const attempt: AttemptRow = Object.freeze({
      ...base,
      countable: true,
      graded: step.result !== "ungraded",
      objectiveState: step.result === "stable" ? "achieved" : step.result === "unstable" ? "failed" : "active",
      verdict: step.result === "ungraded" ? "open" : step.result,
      origin: step.origin ?? "fresh",
      rootDueAtStart: step.dueAheadMs === undefined ? null : new Date(Date.parse(latestEndedAt) + step.dueAheadMs).toISOString(),
      startedAt: latestEndedAt,
      endedAt: latestEndedAt,
    });
    storage.upsertAttempts([attempt], [] as ConceptTagRow[], options.retryVariants);
  }
  const schedule = storage.pendingScheduleForRoot("__legacy", rootKey)!;
  return { schedule, rootKey, days: (Date.parse(schedule.dueAt) - Date.parse(latestEndedAt)) / DAY };
}

function repeat(result: Result, count: number, origin?: AttemptOrigin): Step[] {
  return Array.from({ length: count }, () => (origin === undefined ? { result } : { result, origin }));
}

describe("return scheduling (rfc/return-scheduling.md)", () => {
  const stores: SQLiteRunStorage[] = [];
  const directories: string[] = [];
  const storage = (filename = ":memory:") => {
    const created = new SQLiteRunStorage(filename);
    stores.push(created);
    return created;
  };
  afterEach(() => {
    stores.splice(0).forEach((store) => store.close());
    directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
  });

  it("criterion 1: the real refresh returns the accepted day delta for all eight §1.3 histories", () => {
    const histories: readonly { readonly name: string; readonly steps: readonly Step[]; readonly days: number }[] = [
      { name: "two-stable", steps: repeat("stable", 2), days: 1 },
      { name: "three-stable", steps: repeat("stable", 3), days: 3 },
      { name: "six-stable", steps: repeat("stable", 6), days: 35 },
      { name: "four-lapses-two-stable", steps: [...repeat("unstable", 4), ...repeat("stable", 2)], days: 1 },
      { name: "one-lapse-two-stable", steps: [{ result: "unstable" }, ...repeat("stable", 2)], days: 1 },
      { name: "five-stable-lapse", steps: [...repeat("stable", 5), { result: "unstable" }], days: 0 },
      { name: "three-ungraded", steps: repeat("ungraded", 3), days: 7 },
      { name: "eight-ungraded", steps: repeat("ungraded", 8), days: 35 },
    ];
    for (const history of histories) {
      const { schedule, days } = play(storage(), history.name, history.steps);
      expect({ name: history.name, kind: schedule.kind, days }).toEqual({
        name: history.name, kind: history.days === 0 ? "blocked" : "varied", days: history.days,
      });
    }
  });

  it("criterion 2: an all-stable history counts its whole streak rather than -1", () => {
    const decision = automaticScheduleDecision(repeat("stable", 6).map(() => ({ graded: true, verdict: "stable" as const })));
    expect(decision).toMatchObject({ trailingStable: 6, ladderIndex: 4, days: 35 });
    expect(play(storage(), "masking", repeat("stable", 7)).days).toBe(35);
  });

  it("criterion 3: step-down retains one rung below the peak and never weakens the repair", () => {
    // Reached k = 3 (16 days) at the fifth stable, lapsed, recovered with two stables.
    const retained = play(storage(), "retained", [...repeat("stable", 5), { result: "unstable" }, ...repeat("stable", 2)]);
    expect(retained).toMatchObject({ days: 7, schedule: { kind: "varied" } });
    expect(automaticScheduleDecision([...repeat("stable", 5), { result: "unstable" as const }, ...repeat("stable", 2)]
      .map((step) => ({ graded: true, verdict: step.result as "stable" | "unstable" })))).toMatchObject({ floor: 2, ladderIndex: 2 });
    // Never climbed: §1.3's fourth row still resolves to one day.
    expect(play(storage(), "never-climbed", [...repeat("unstable", 4), ...repeat("stable", 2)]).days).toBe(1);
    // Re-reaching the peak clears the lapse: continued recovery climbs normally past the floor.
    expect(play(storage(), "re-climbed", [...repeat("stable", 5), { result: "unstable" }, ...repeat("stable", 5)]).days).toBe(16);
  });

  it("criterion 4: an off-schedule attempt may demote but never advance the ladder", () => {
    const early = 12 * 60 * 60 * 1000;
    const fixtures: readonly { readonly name: string; readonly before: readonly Step[]; readonly last: Result; readonly origin: AttemptOrigin }[] = [
      { name: "early-stable", before: repeat("stable", 3, "scheduled"), last: "stable", origin: "fresh" },
      { name: "early-lapse", before: repeat("stable", 3, "scheduled"), last: "unstable", origin: "fresh" },
      { name: "rewind-stable", before: [{ result: "stable" }], last: "stable", origin: "in_run_retry" },
      { name: "duplicate-early", before: repeat("stable", 4, "scheduled"), last: "stable", origin: "duplicate" },
    ];
    const differences: string[] = [];
    for (const fixture of fixtures) {
      const scheduled = play(storage(), `${fixture.name}-s`, [...fixture.before, { result: fixture.last, origin: "scheduled", dueAheadMs: early }]);
      const off = play(storage(), `${fixture.name}-o`, [...fixture.before, { result: fixture.last, origin: fixture.origin, dueAheadMs: early }]);
      expect(off.days, fixture.name).toBeLessThanOrEqual(scheduled.days);
      if (off.days !== scheduled.days) differences.push(fixture.name);
    }
    expect(differences).toEqual(["early-stable", "rewind-stable", "duplicate-early"]);
    // A fresh attempt started after the root came due is on schedule and advances normally.
    expect(isOffScheduleAttempt({ graded: true, verdict: "stable", origin: "fresh", rootDueAtStart: at, startedAt: at })).toBe(false);
    expect(play(storage(), "pack-shelf-return", [...repeat("stable", 3, "scheduled"), { result: "stable", dueAheadMs: -early }]).days).toBe(7);
  });

  it("criterion 5: difficult roots read attempts, not learner_position_stats", () => {
    expect(DIFFICULT_ROOTS_SQL).toMatch(/\bFROM attempts\b/u);
    expect(DIFFICULT_ROOTS_SQL).not.toMatch(/learner_position_stats/u);
    expect(DIFFICULT_ROOT_RUNS_SQL).not.toMatch(/learner_position_stats/u);
    const directory = mkdtempSync(join(tmpdir(), "tabiya-difficult-"));
    directories.push(directory);
    const filename = join(directory, "progress.sqlite");
    const store = storage(filename);
    play(store, "hard", [...repeat("unstable", 3), { result: "stable" }], { packId: "hard-pack" });
    play(store, "easy", [...repeat("unstable", 2), ...repeat("stable", 3)], { packId: "easy-pack", startIndex: 10 });
    const database = new DatabaseSync(filename);
    database.prepare("UPDATE learner_position_stats SET seen_count = 0").run();
    expect(database.prepare("SELECT MAX(seen_count) AS seen FROM learner_position_stats").get()).toEqual({ seen: 0 });
    database.close();
    const page = store.difficultRoots("__legacy");
    expect(page).toMatchObject({ threshold: 3, total: 1 });
    expect(page.roots.map((root) => ({ packId: root.packId, unstableCount: root.unstableCount, runs: root.runs.length }))).toEqual([
      { packId: "hard-pack", unstableCount: 3, runs: 3 },
    ]);
    expect(page.roots[0]!.runs.map((entry) => entry.runId)).toEqual(["hard-2", "hard-1", "hard-0"]);
    expect(store.difficultRoots("someone-else")).toMatchObject({ total: 0, roots: [] });
  });

  it("criterion 6: frequency orders only within one due date and never across dates", () => {
    const item = (id: string, dueAt: string, kind: "blocked" | "varied" = "varied") => ({ id, dueAt, kind });
    const games: Record<string, number> = { rareEarly: 150, commonLater: 90_000, sameDayRare: 200, sameDayCommon: 50_000 };
    const ordered = orderDueByFrequency([
      item("rareEarly", "2026-09-01T09:00:00.000Z"),
      item("sameDayRare", "2026-09-02T08:00:00.000Z"),
      item("sameDayCommon", "2026-09-02T20:00:00.000Z"),
      item("commonLater", "2026-09-03T09:00:00.000Z"),
    ], (schedule) => games[schedule.id]);
    expect(ordered.map((schedule) => schedule.id)).toEqual(["rareEarly", "sameDayCommon", "sameDayRare", "commonLater"]);
    // Blocked repairs stay ahead of varied returns whatever their frequency.
    expect(orderDueByFrequency([item("blocked", at, "blocked"), item("varied", at)], (schedule) => (schedule.id === "varied" ? 10 ** 6 : 1))
      .map((schedule) => schedule.id)).toEqual(["blocked", "varied"]);
  });

  it("criterion 6 through the service: the served queue tie-breaks by corpus frequency at band", async () => {
    const store = storage();
    const service = new RunService(store, { progressStorage: store });
    const played = commitMove(run("frequency-source"), "e2e4", { at }).run;
    store.create(played, "writer-frequency", "Ladder pack");
    const keys = { rare: "8/8/8/8/8/8/8/K1k5 w - -", common: "8/8/8/8/8/8/8/K2k4 w - -", earlier: "8/8/8/8/8/8/8/K3k3 w - -" };
    const create = (id: string, key: string, dueAt: string) => store.createSchedule({
      id, learnerId: "__legacy", rootKey: `position||${key}`, sessionKind: "position", packId: null,
      rootTransposeKey: key, kind: "varied", variant: null, origin: "learner", dueAt, createdAt: at,
      sourceRunId: null, sourceNodeId: null,
    });
    create("earlier-rare", keys.earlier, "2026-08-30T10:00:00.000Z");
    create("same-day-rare", keys.rare, "2026-08-31T08:00:00.000Z");
    create("same-day-common", keys.common, "2026-08-31T09:00:00.000Z");
    const totals: Record<string, number> = { [keys.rare]: 120, [keys.common]: 70_000, [keys.earlier]: 101 };
    const queries: CorpusQuery[] = [];
    const corpus: CorpusSource = {
      async stats(query): Promise<CorpusResult> {
        queries.push(query);
        const key = query.fen.split(" ").slice(0, 4).join(" ");
        const population = { source: "lichess-explorer" as const, ratings: query.ratings, speeds: query.speeds, since: query.since, until: query.until };
        return { kind: "stats", total: totals[key]!, white: totals[key]!, draws: 0, black: 0, moves: [], recency: { kind: "absent" }, population };
      },
    };
    const queue = await service.dueQueue(principal, at, corpus);
    expect(queue.schedules.map((schedule) => [schedule.id, schedule.frequency?.games])).toEqual([
      ["earlier-rare", 101], ["same-day-common", 70_000], ["same-day-rare", 120],
    ]);
    expect(queries).toHaveLength(3);
    const withoutCorpus = await service.dueQueue(principal, at);
    expect(withoutCorpus.schedules.map((schedule) => [schedule.id, schedule.frequency])).toEqual([
      ["earlier-rare", null], ["same-day-rare", null], ["same-day-common", null],
    ]);
  });

  it("§6 vacation safety: intake is bounded, the rest wait in order and nothing is dropped", async () => {
    const store = storage();
    const service = new RunService(store, { progressStorage: store });
    store.create(commitMove(run("vacation-source"), "e2e4", { at }).run, "writer-vacation", "Ladder pack");
    for (let index = 0; index < DUE_INTAKE_LIMIT + 5; index += 1) {
      store.createSchedule({
        id: `vacation-${String(index).padStart(2, "0")}`, learnerId: "__legacy", rootKey: `position||root-${index}`,
        sessionKind: "position", packId: null, rootTransposeKey: `root-${index}`, kind: index % 7 === 0 ? "blocked" : "varied",
        variant: null, origin: "learner", dueAt: new Date(Date.parse(at) - (40 - index) * DAY).toISOString(), createdAt: at,
        sourceRunId: null, sourceNodeId: null,
      });
    }
    const queue = await service.dueQueue(principal, at);
    expect(queue).toMatchObject({ waiting: 5, intakeLimit: DUE_INTAKE_LIMIT });
    expect(queue.schedules).toHaveLength(DUE_INTAKE_LIMIT);
    expect(queue.schedules.map((schedule) => schedule.id)).toEqual(service.due(principal, at).slice(0, DUE_INTAKE_LIMIT).map((schedule) => schedule.id));
    expect(service.due(principal, at)).toHaveLength(DUE_INTAKE_LIMIT + 5);
  });

  it("criterion 8: a varied return names the pack's retry variant, rotating with k; none names NULL", () => {
    const kinds = { "variant-pack": ["same_root_new_defense", "opposite_side"] } as const;
    const names = [2, 3, 4].map((stables) => play(storage(), `rotate-${stables}`, repeat("stable", stables), { packId: "variant-pack", retryVariants: kinds }).schedule.variant);
    expect(names).toEqual(["same_root_new_defense", "opposite_side", "same_root_new_defense"]);
    expect(play(storage(), "no-variants", repeat("stable", 3), { packId: "plain-pack", retryVariants: kinds }).schedule.variant).toBeNull();
    expect(play(storage(), "blocked-variant", [{ result: "unstable" }], { packId: "variant-pack", retryVariants: kinds }).schedule).toMatchObject({ kind: "blocked", variant: null });
    // A lapse after a named varied return clears the name on the re-projected pending row.
    const store = storage();
    expect(play(store, "cleared", repeat("stable", 2), { packId: "variant-pack", retryVariants: kinds }).schedule.variant).toBe("same_root_new_defense");
    expect(play(store, "cleared", [{ result: "unstable" }], { packId: "variant-pack", retryVariants: kinds, startIndex: 2 }).schedule).toMatchObject({ kind: "blocked", variant: null });
    expect(rotatedRetryVariant({ kind: "varied", ladderIndex: 1 }, [])).toBeNull();
  });

  it("criterion 8 through the service: projection forwards the registered pack's declared kinds", async () => {
    const { PackRegistry } = await import("./pack-registry.js");
    const { readFileSync } = await import("node:fs");
    const { resolvePackPath } = await import("@chess-tabiya/schema/pack-path");
    const base = JSON.parse(readFileSync(new URL(resolvePackPath("anti-caro-advance"), import.meta.url), "utf8")) as Record<string, unknown>;
    const document = { ...base, id: "retry-variant-pack", retryVariants: [{ kind: "alternate_plan_class" }, { kind: "opposite_side" }] };
    const registry = await PackRegistry.fromDocuments([{ source: "retry-variant-test", value: document }]);
    const record = registry.required("retry-variant-pack");
    const store = storage();
    const forwarded: (RetryVariantKinds | undefined)[] = [];
    const progress = new Proxy(store, {
      get(target, property, receiver) {
        if (property === "upsertAttempts") {
          return (attempts: readonly AttemptRow[], concepts: readonly ConceptTagRow[], retryVariants?: RetryVariantKinds) => {
            forwarded.push(retryVariants);
            target.upsertAttempts(attempts, concepts, retryVariants);
          };
        }
        const value = Reflect.get(target, property, receiver) as unknown;
        return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(target) : value;
      },
    });
    const service = new RunService(store, { progressStorage: progress, packRegistry: registry });
    await service.create({
      id: "retry-variant-run",
      session: { kind: "pack", packId: record.document.id, packDigest: record.digest },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 3,
      createdAt: at,
    }, { writerId: "writer-rv", learnerId: "__legacy" });
    expect(forwarded.at(-1)).toEqual({ "retry-variant-pack": ["alternate_plan_class", "opposite_side"] });
  });

  it("criterion 9: an imported game reaches a guess-the-move checkpoint and records mass and rank", async () => {
    const store = storage();
    const service = new RunService(store, { progressStorage: store });
    const imported = await service.importGame({
      id: "solitaire",
      side: "white",
      opponentPolicy: { mode: "human_common", targetElo: 1700 },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 5,
      source: { kind: "pgn", pgn: `[White "A"]\n[Black "B"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 *` },
      createdAt: at,
    }, "writer-solitaire");
    const afterE4 = imported.run.nodes[1]!;
    service.rewind("solitaire", principal, "writer-solitaire", { nodeId: afterE4.id });
    const distribution: OpponentSelection = {
      moveUci: "e7e5",
      policyModeApplied: "human_common",
      candidates: [{ moveUci: "c7c5", mass: 0.41, rank: 1 }, { moveUci: "e7e5", mass: 0.33, rank: 2 }],
      engine: { id: "maia", name: "Maia", version: "3", seedHonored: true },
    };
    const recorded = service.recordPrediction("solitaire", principal, "writer-solitaire", {
      nodeId: afterE4.id, checkpointId: IMPORTED_GAME_PREDICTION_CHECKPOINT, predictedUci: "e7e5", distribution, at,
    });
    expect(recorded.emitted).toMatchObject([{ type: "prediction.recorded", data: { predictedMass: 0.33, predictedRank: 2, candidateCount: 2 } }]);
    // Negative arm: the pack refusal string is unreachable on the imported path.
    const attempts = [
      () => service.recordPrediction("solitaire", principal, "writer-solitaire", { nodeId: afterE4.id, checkpointId: "authored-checkpoint", predictedUci: "e7e5", distribution }),
      () => service.recordPrediction("solitaire", principal, "writer-solitaire", { nodeId: imported.run.nodes.at(-1)!.id, checkpointId: IMPORTED_GAME_PREDICTION_CHECKPOINT, predictedUci: "e7e5", distribution }),
    ];
    for (const attempt of attempts) {
      expect(attempt).toThrow();
      expect(attempt).not.toThrow(/Unknown prediction checkpoint/u);
    }
    // The source tip has no played next move, so it cannot be a guess-the-move position.
    service.rewind("solitaire", principal, "writer-solitaire", { nodeId: imported.run.nodes.at(-1)!.id });
    expect(() => service.recordPrediction("solitaire", principal, "writer-solitaire", {
      nodeId: imported.run.nodes.at(-1)!.id, checkpointId: IMPORTED_GAME_PREDICTION_CHECKPOINT, predictedUci: "e7e5", distribution,
    })).toThrow(/played next move/u);
  });

  it("D2: the standing word is a closed three-word map over explicit rung thresholds", () => {
    expect(RETURN_STANDINGS).toEqual(["new", "learning", "established"]);
    expect(RETURN_STANDING_MIN_RUNG).toEqual({ learning: 1, established: 3 });
    // Every rung the ladder can serve, plus "no rung" (blocked, or no countable history).
    expect([null, undefined, ...VARIED_LADDER_DAYS.keys()].map((rung) => [rung, returnStanding(rung)])).toEqual([
      [null, "new"], [undefined, "new"], [0, "new"], [1, "learning"], [2, "learning"], [3, "established"], [4, "established"],
    ]);
    for (const invalid of [-1, VARIED_LADDER_DAYS.length, 1.5, Number.NaN]) expect(() => returnStanding(invalid)).toThrow(RangeError);
  });

  it("D2: storage replays the standing from attempts through the same ladder the schedule reads", () => {
    const histories: readonly { readonly name: string; readonly steps: readonly Step[]; readonly standing: string }[] = [
      { name: "one-stable", steps: repeat("stable", 1), standing: "new" },
      { name: "two-stable", steps: repeat("stable", 2), standing: "new" },
      { name: "three-stable", steps: repeat("stable", 3), standing: "learning" },
      { name: "four-stable", steps: repeat("stable", 4), standing: "learning" },
      { name: "five-stable", steps: repeat("stable", 5), standing: "established" },
      { name: "six-stable", steps: repeat("stable", 6), standing: "established" },
      // A lapse from the top rung repeats blocked: no rung, so the root is new to spacing again.
      { name: "five-stable-lapse", steps: [...repeat("stable", 5), { result: "unstable" }], standing: "new" },
      // Recovery resumes at the retained floor (rung 2), not at the old peak.
      { name: "lapse-recovered", steps: [...repeat("stable", 5), { result: "unstable" }, ...repeat("stable", 2)], standing: "learning" },
      // Overstudy cannot advance the ladder, so it cannot advance the word either.
      { name: "overstudied", steps: [...repeat("stable", 3), ...repeat("stable", 3, "in_run_retry")], standing: "learning" },
      { name: "three-ungraded", steps: repeat("ungraded", 3), standing: "learning" },
    ];
    for (const history of histories) {
      const store = storage();
      const { rootKey, days } = play(store, history.name, history.steps);
      const standing = store.returnStanding("__legacy", rootKey);
      expect({ name: history.name, standing }).toEqual({ name: history.name, standing: history.standing });
      const rung = VARIED_LADDER_DAYS.indexOf(days as (typeof VARIED_LADDER_DAYS)[number]);
      expect(standing, history.name).toBe(returnStanding(rung === -1 ? null : rung));
    }
    const empty = storage();
    expect(empty.returnStanding("__legacy", "position||no-history")).toBe("new");
    // Learner isolation: another learner's history never lends a root its standing.
    const isolated = storage();
    const { rootKey } = play(isolated, "isolated", repeat("stable", 6));
    expect(isolated.returnStanding("someone-else", rootKey)).toBe("new");
  });

  it("D2 through the service: every served return carries its root's standing word and no rung", async () => {
    const store = storage();
    const service = new RunService(store, { progressStorage: store });
    play(store, "served-established", repeat("stable", 5));
    play(store, "served-learning", repeat("stable", 3), { packId: "second-pack" });
    const queue = await service.dueQueue(principal, "9999-12-31T23:59:59.999Z");
    expect(queue.schedules.map((schedule) => [schedule.packId, schedule.standing]).sort()).toEqual([
      ["ladder-pack", "established"], ["second-pack", "learning"],
    ]);
    for (const schedule of queue.schedules) {
      expect(Object.keys(schedule).filter((key) => /ladder|rung|index|level|mastery|ratio|percent|streak/iu.test(key))).toEqual([]);
    }
  });

  it("criterion 11: no attempts or schedules column is added", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-columns-"));
    directories.push(directory);
    const filename = join(directory, "columns.sqlite");
    storage(filename);
    const database = new DatabaseSync(filename);
    const columns = (table: string) => (database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((row) => row.name);
    expect(columns("attempts")).toEqual([
      "run_id", "branch_id", "learner_id", "session_kind", "pack_id", "pack_digest", "root_key", "root_node_id",
      "root_transpose_key", "branch_label", "branch_intent", "branch_seed", "attempt_no", "countable", "graded",
      "objective_state", "verdict", "result", "user_ply_count", "checkpoint_ids", "origin", "schedule_id",
      "root_due_at_start", "derived_from_run_id", "started_at", "ended_at",
    ]);
    expect(columns("schedules")).toEqual([
      "id", "learner_id", "root_key", "session_kind", "pack_id", "root_transpose_key", "kind", "variant", "origin",
      "state", "due_at", "created_at", "source_run_id", "source_node_id", "started_run_id",
    ]);
    database.close();
  });
});
