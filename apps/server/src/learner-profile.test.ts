// rfc/player-style.md criteria 7, 11, 14, 15 and rfc/skills.md criteria 9, 12, 13 through the real
// longitudinal store: file-backed SQLite, real decision attribution/default batch, GAME/choice
// factories, source coverage and card arithmetic. This card-math cohort memoizes genuine flat
// source results for repeated exact positions; unmocked worker/storage/upgrade/cost cohorts own
// acquisition count, source lifecycle and production throughput proof.
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import * as runtime from "@chess-tabiya/runtime";
import { appendOpponentPly, commitMove, STYLE_METRICS, type DrillRun, type MeasuredHabitCard } from "@chess-tabiya/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { serializeAccountBundle } from "./account-data.js";
import { readPortableAccountBundle, planAccountRestore } from "./account-import.js";
import { assertLongitudinalStorePresent, LearnerProfileService } from "./learner-profile.js";
import { projectObservations } from "./longitudinal-projector.js";
import { OBSERVATION_DERIVATION_REV } from "./longitudinal-registry.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { AT, FIXTURE_DEPENDENCIES, fileFixture, importedRun, learner, positionRun, type FileFixture } from "./longitudinal-test-fixtures.js";
import { loadOpeningCatalogue } from "./opening-catalogue.js";
import { LONGITUDINAL_TABLES, type LongitudinalStore } from "./longitudinal-store.js";
import * as subjectBridge from "../../../packages/runtime/src/internal/profile-subject-facts.js";
const realSubjectPopulation = subjectBridge.collectProfileSubjectPopulation;
const subjectPopulations = new Map<string, ReturnType<typeof realSubjectPopulation>>();
// These cohorts publish and read durable evidence before asserting Profile behavior.
// Use the same integration budget as the GAME and choice source cohorts.
const PROFILE_INTEGRATION_TIMEOUT_MS = 30_000;
beforeEach(() => {
  vi.spyOn(subjectBridge, "collectProfileSubjectPopulation").mockImplementation((fen,move) => {
    const key = JSON.stringify([fen,move]);
    let result = subjectPopulations.get(key);
    if (result === undefined) { result = realSubjectPopulation(fen,move); subjectPopulations.set(key,result); }
    return result;
  });
});


const fixtures: FileFixture[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of fixtures.splice(0)) {
    try { fixture.storage.close(); } catch { /* closed */ }
    rmSync(dirname(fixture.path), { recursive: true, force: true });
  }
});

function drain(store: LongitudinalStore): void {
  for (;;) if (runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "profile-test").claimed === 0) return;
}

function selection(moveUci: string) {
  return { moveUci, policyModeApplied: "enumerated" as const, candidates: [{ moveUci, rank: 1 }], engine: { id: "fixture", name: "fixture", version: "1", seedHonored: true } };
}

/** A game from the standard start: the learner plays `side`, the opponent the other colour. */
function game(id: string, moves: readonly string[], side: "white" | "black" = "white", options: { readonly at?: string } = {}): DrillRun {
  let run = positionRun(id, undefined, side, options.at ?? AT);
  moves.forEach((move, index) => {
    const learnerTurn = (index % 2 === 0) === (side === "white");
    run = learnerTurn ? commitMove(run, move, { at: options.at ?? AT }).run : appendOpponentPly(run, selection(move), { at: options.at ?? AT }).run;
  });
  return run;
}

const ITALIAN_CASTLE = ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "e1h1"];
const FIANCHETTO = ["g2g3", "d7d5", "f1g2", "g8f6", "g1f3", "e7e6"];
const QUEEN_EARLY = ["d2d4", "d7d5", "d1d3", "g8f6"];
/** Scholar's mate: the runtime records the terminal outcome itself (a win for White). */
const SCHOLAR = ["e2e4", "e7e5", "f1c4", "b8c6", "d1h5", "g8f6", "h5f7"];
/** Fool's mate: a loss for White. */
const FOOL = ["f2f3", "e7e5", "g2g4", "d8h4"];

async function service(fixture: FileFixture) {
  return new LearnerProfileService({
    storage: fixture.storage,
    longitudinalStatus: () => "ready",
    openingCatalogue: await loadOpeningCatalogue(join(process.cwd(), "apps", "server", "artifacts", "runtime-opening-catalogue.json")),
    packs: () => [{ id: "fixture-italian", title: "Italian fixture pack", startFen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3" }],
    shapes: () => [{ id: "carlsbad", name: "Carlsbad structure" }],
  });
}

function setup(): FileFixture {
  const fixture = fileFixture("tabiya-profile-");
  fixtures.push(fixture);
  return fixture;
}

describe("player-style criterion 14 — the store precondition is asserted, not assumed", () => {
  it("fails while learner_observations is absent, naming D973/D1011 and migration 26", () => {
    const present = ["drill_runs", "learners", ...LONGITUDINAL_TABLES];
    expect(() => assertLongitudinalStorePresent(present)).not.toThrow();
    expect(() => assertLongitudinalStorePresent(present.filter((table) => table !== "learner_observations")))
      .toThrow(/LEARNER_PROFILE_STORE_ABSENT: learner_observations is missing.*migration 26.*D973\/D1011/u);
  });
});

describe("the profile abstains until each card's own denominator clears", () => {
  it.each(["white", "black"] as const)("D3772 excludes a %s source-refused run from both counted totals and history while preserving valid runs", async side => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    fixture.storage.create(game("valid-source", FIANCHETTO, side), owner);
    fixture.storage.create(game("mismatched-source", FIANCHETTO, side), owner);
    drain(fixture.workerStore());
    const profileService = await service(fixture);
    const before = profileService.profile({ learnerId: "owner", handle: "owner" });
    expect(before.store).toMatchObject({ runs: 2, counted: 2, unavailable: 0 });
    const inspection = new DatabaseSync(fixture.path);
    try {
      const changed = inspection.prepare("UPDATE learner_observation_denominators SET decisions = decisions + 1 WHERE run_id = ? AND decision_class = 'played'").run("mismatched-source");
      expect(changed.changes).toBeGreaterThan(0);
    } finally { inspection.close(); }
    const profile = profileService.profile({ learnerId: "owner", handle: "owner" });
    expect(profile.population).toMatchObject({ measuredGames: 1, playedDecisions: 3 });
    expect(profile.store).toMatchObject({ runs: 2, counted: 1, unavailable: 1, pending: 0, failed: 0 });
    expect(profile.store.statement).toContain("1 of your 2 saved runs is counted");
    expect(profile.store.statement).toContain("1 is not counted");
    const history = profile.history.items.find(row => row.runId === "mismatched-source")!;
    expect(history).toMatchObject({ state: "unavailable", status: "store_mismatch", playedDecisions: null, opening: null, outcome: null });
    expect(history.detail).toContain("Recorded counts do not match the saved moves");
    expect(profile.history.items.find(row => row.runId === "valid-source")).toMatchObject({ state: "counted", status: "counted_game", playedDecisions: 3 });
    for (const card of profile.style.cards) expect(card.contributors.shown.every(ref => ref.runId !== "mismatched-source")).toBe(true);
    expect(profileService.historyPage({ learnerId: "owner", handle: "owner" }, 0, 25).items).toEqual(profile.history.items);
  });

  it.each(["all complete", "ready subset"] as const)("D4212 isolates corrupt rows on the %s read", async (scenario) => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    for (const id of ["bad-denominator", "missing-coverage", "healthy"]) {
      fixture.storage.create(game(id, FIANCHETTO), owner);
    }
    drain(fixture.workerStore());
    if (scenario === "ready subset") fixture.storage.create(positionRun("pending"), owner);
    const inspection = new DatabaseSync(fixture.path);
    try {
      const count = inspection.prepare("UPDATE learner_observation_denominators SET decisions=decisions+1 WHERE run_id='bad-denominator'").run();
      const malformed = scenario === "ready subset"
        ? "UPDATE learner_subject_evaluations SET unavailable_json='[1e999]' WHERE run_id='missing-coverage'"
        : "DELETE FROM learner_subject_evaluations WHERE run_id='missing-coverage'";
      const missing = inspection.prepare(malformed).run();
      expect(count.changes).toBeGreaterThan(0);
      expect(missing.changes).toBeGreaterThan(0);
    } finally { inspection.close(); }
    const profileService = await service(fixture);
    const read = vi.spyOn(fixture.storage, "readLongitudinalSnapshot");
    try {
      const overview = profileService.profile({ learnerId: "owner", handle: "owner" });
      expect(overview.store).toMatchObject({ counted: 1, unavailable: 2, pending: scenario === "ready subset" ? 1 : 0 });
      for (const id of ["bad-denominator", "missing-coverage"]) {
        expect(overview.history.items.find(row => row.runId === id)).toMatchObject({
          state: "unavailable", status: "store_mismatch", playedDecisions: null,
        });
      }
      expect(overview.history.items.find(row => row.runId === "healthy")).toMatchObject({ state: "counted", playedDecisions: 3 });
      expect(overview.observations).toEqual([]);
      expect(overview).not.toHaveProperty("coverage");
      const rejected = read.mock.results.find(result => result.type === "throw");
      expect(rejected?.value).toMatchObject({ invalidRunIds: ["bad-denominator", "missing-coverage"] });
      expect(rejected?.value).not.toHaveProperty("coverage");
      const retry = read.mock.results.at(-1);
      expect(retry).toMatchObject({ type: "return", value: { kind: "complete" } });
      expect(retry?.value.coverage.sources).toHaveLength(34);
      expect(retry?.value.coverage.decisions.map((row: { runId: string }) => row.runId)).toEqual(["healthy", "healthy", "healthy"]);
      expect(read.mock.calls.map(([, query]) => query.through.kind)).toEqual(
        scenario === "ready subset" ? ["all_complete", "runs", "runs"] : ["all_complete", "runs"],
      );
      const healthyHead = fixture.storage.read("healthy")!.run.events.length;
      expect(read.mock.calls.at(-1)?.[1].through).toEqual({ kind: "runs", cuts: [{ runId: "healthy", requestedSeq: healthyHead }] });
    } finally { read.mockRestore(); }
  });

  it("D3772 does not call an unread complete cut counted after another cut advances during the subset read", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    fixture.storage.create(game("advance-during-read", FIANCHETTO), owner);
    fixture.storage.create(game("ready-but-unread", FIANCHETTO), owner);
    drain(fixture.workerStore());
    fixture.storage.create(positionRun("still-pending"), owner);
    const original = fixture.storage.readLongitudinalSnapshot.bind(fixture.storage);
    let calls = 0;
    const read = vi.spyOn(fixture.storage, "readLongitudinalSnapshot").mockImplementation((actor, query) => {
      if (calls++ === 1) {
        const before = fixture.storage.read("advance-during-read")!.run;
        fixture.storage.save(commitMove(before, "e2e4", { at: AT }).run, owner);
      }
      return original(actor, query);
    });
    try {
      const profileService = await service(fixture);
      const first = profileService.profile({ learnerId: "owner", handle: "owner" });
      expect(read).toHaveBeenCalledTimes(2);
      expect(first.store).toMatchObject({ runs: 3, counted: 0, pending: 1, unavailable: 2 });
      expect(first.population.measuredGames).toBe(0);
      expect(first.observations).toEqual([]);
      expect(first.history.items.find(row => row.runId === "ready-but-unread")).toMatchObject({ state: "unavailable", status: null, detail: "We couldn't load this run's counts for this profile. Refresh the profile to check again." });
      const refreshed = profileService.profile({ learnerId: "owner", handle: "owner" });
      expect(refreshed.store).toMatchObject({ runs: 3, counted: 1, pending: 2, unavailable: 0 });
      expect(refreshed.history.items.find(row => row.runId === "ready-but-unread")).toMatchObject({ state: "counted", status: "counted_game" });
    } finally { read.mockRestore(); }
  });

  it("D4212 retires a ready cut republished at the same sequence during Profile recovery", async () => {
    const f = setup();
    const owner = learner(f.storage, "owner");
    const guest = learner(f.storage, "guest");
    for (const id of ["same-head", "healthy"]) f.storage.create(game(id, FIANCHETTO), owner);
    const store = f.workerStore();
    drain(store);
    const before = store.job("same-head")!;
    f.storage.create(positionRun("pending"), owner);
    const original = f.storage.readLongitudinalSnapshot.bind(f.storage);
    let reads = 0;
    const read = vi.spyOn(f.storage, "readLongitudinalSnapshot").mockImplementation((actor, query) => {
      if (reads++ === 1) {
        f.storage.grantRole("same-head", guest.learnerId, "participant", owner, AT);
        drain(store);
        const current = store.job("same-head")!;
        expect(current).toMatchObject({ state: "complete", completedSeq: before.completedSeq });
        expect(current.requestedSourceDigest).not.toBe(before.requestedSourceDigest);
      }
      return original(actor, query);
    });
    try {
      const overview = (await service(f)).profile({ learnerId: "owner", handle: "owner" });
      expect(overview.store).toMatchObject({ counted: 1, unavailable: 1 });
      expect(overview.history.items.find(row => row.runId === "same-head")).toMatchObject({
        state: "unavailable", playedDecisions: null, detail: "Not counted (cut superseded).",
      });
      expect(overview.history.items.find(row => row.runId === "healthy")).toMatchObject({ state: "counted" });
      expect(read).toHaveBeenCalledTimes(3);
    } finally { read.mockRestore(); }
  });

  it("renders reason and distance below the floor, blocked reasons for unlanded inputs, and the games measured so far", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    fixture.storage.create(game("g1", ITALIAN_CASTLE), owner);
    fixture.storage.create(game("g2", FIANCHETTO), owner);
    fixture.storage.create(game("g3", QUEEN_EARLY), owner);
    drain(fixture.workerStore());
    const profile = (await service(fixture)).profile({ learnerId: "owner", handle: "owner" });

    expect(profile.store).toMatchObject({ runs: 3, counted: 3, pending: 0, statement: "All 3 of your saved runs are counted." });
    expect(profile.population).toMatchObject({ measuredGames: 3, playedDecisions: 4 + 3 + 2 });
    const cards = new Map(profile.style.cards.map((card) => [card.metricId, card]));
    expect([...cards.keys()].sort()).toEqual(STYLE_METRICS.map((row) => row.metricId).sort());
    expect(profile.style.cards.every((card) => card.state === "abstained")).toBe(true);
    expect(cards.get("fianchetto_setup_rate")!.sentence).toBe("This card's floor is 25 games; 3 measured.");
    expect(cards.get("fianchetto_knight_screen_rate")!.sentence).toBe("This card's floor is 200 games; 3 measured.");
    // Criterion 15: the abstaining drill-down lists the measured games, never the occurrences.
    expect(cards.get("fianchetto_setup_rate")!.contributors.total).toBe(3);
    expect(cards.get("castle_kingside_rate")!.contributors.total).toBe(3);
    expect(cards.get("opening_surprisal")).toMatchObject({ abstention: { code: "blocked", blocked: "reference_population_unpinned" } });
    for (const phase of ["opening", "middlegame", "endgame"]) {
      expect(cards.get(`clock_spend_share:${phase}`)).toMatchObject({ abstention: { code: "blocked", blocked: "clock_readings_unrecorded", home: "rfc/recorded-clocks.md Discharge D4" } });
    }
    expect(profile.style.cards.some((card) => card.state === "abstained" && /\d+ of \d+/u.test(card.sentence))).toBe(false);
  });
});

describe("a card measures exactly at its floor", { timeout: PROFILE_INTEGRATION_TIMEOUT_MS }, () => {
  it("measures fianchetto at 25 games with numerator, denominator, interval, window, scope and drill-down; abstains at 24", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    for (let index = 0; index < 24; index += 1) {
      fixture.storage.create(game(`g${index}`, index < 10 ? FIANCHETTO : ITALIAN_CASTLE, "white", { at: new Date(Date.parse(AT) + index * 60_000).toISOString() }), owner);
    }
    drain(fixture.workerStore());
    const profiles = await service(fixture);
    const below = profiles.profile({ learnerId: "owner", handle: "owner" }).style.cards.find((card) => card.metricId === "fianchetto_setup_rate")!;
    expect(below).toMatchObject({ state: "abstained", sentence: "This card's floor is 25 games; 24 measured." });

    fixture.storage.create(game("g24", ITALIAN_CASTLE, "white", { at: new Date(Date.parse(AT) + 24 * 60_000).toISOString() }), owner);
    drain(fixture.workerStore());
    const view = profiles.profile({ learnerId: "owner", handle: "owner" });
    const card = view.style.cards.find((item) => item.metricId === "fianchetto_setup_rate") as MeasuredHabitCard;
    expect(card.state).toBe("measured");
    expect(card).toMatchObject({ numerator: 10, eligibleGames: 25, games: 25, floor: 25, timeControlScope: "all_recorded_games", reference: null, tier: { state: "established" } });
    expect(card.sentence).toMatch(/^You reached the declared fianchetto setup in 10 of 25 measured games \(95% interval 0\.\d\d to 0\.\d\d\)\. This card's floor is 25 games\.$/u);
    expect(card.interval.lower).toBeLessThan(0.4);
    expect(card.interval.upper).toBeGreaterThan(0.4);
    expect(card.window).toEqual({ from: AT, to: new Date(Date.parse(AT) + 24 * 60_000).toISOString() });
    expect(card.contributors).toMatchObject({ total: 10, hiddenCount: 5 });
    expect(card.contributors.shown[0]).toMatchObject({ runId: "g0", moveSan: "Bg2", ply: 3 });
    // Other cards keep their own floors: a single global confidence is not representable.
    expect(view.style.cards.find((item) => item.metricId === "fianchetto_knight_screen_rate")!.sentence).toBe("This card's floor is 200 games; 25 measured.");
    expect(view.style.cards.find((item) => item.metricId === "castle_kingside_rate")!.sentence).toBe("This card's floor is 50 games; 25 measured.");

    const page = profiles.styleCard({ learnerId: "owner", handle: "owner" }, "fianchetto_setup_rate", 5, 100);
    expect(page.contributors).toMatchObject({ total: 10, hiddenCount: 0 });
    expect(page.contributors.shown).toHaveLength(5);
    expect(page.contributors.shown[0]!.runId).toBe("g5");
  });
});

describe("opening performance uses the runtime opening identity", { timeout: PROFILE_INTEGRATION_TIMEOUT_MS }, () => {
  it("groups games by deepest named endpoint with recorded results, drill-down and registered related packs", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    for (const id of ["s1", "s2", "s3"]) fixture.storage.create(game(id, SCHOLAR), owner);
    fixture.storage.create(game("f1", FOOL), owner);
    fixture.storage.create(game("i1", ITALIAN_CASTLE), owner);
    drain(fixture.workerStore());
    const profiles = new LearnerProfileService({
      storage: fixture.storage,
      longitudinalStatus: () => "ready",
      openingCatalogue: await loadOpeningCatalogue(join(process.cwd(), "apps", "server", "artifacts", "runtime-opening-catalogue.json")),
      packs: () => [{ id: "fixture-italian", title: "Italian fixture pack", startFen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3" }],
      // A rated game's sealed result takes precedence (it also covers resignation and abandonment).
      ratedResults: () => new Map([["s3", "draw" as const]]),
    });
    const openings = profiles.profile({ learnerId: "owner", handle: "owner" }).openings;
    expect(openings.available).toBe(true);
    expect(openings.rateStatement).toMatch(/No win rate is shown/u);
    const scholar = openings.rows.find((row) => row.contributors.shown.some((ref) => ref.runId === "s1"))!;
    expect(scholar.games).toBe(3);
    expect(scholar.results).toEqual({ win: 2, draw: 1, loss: 0, noResult: 0 });
    const fool = openings.rows.find((row) => row.contributors.shown.some((ref) => ref.runId === "f1"))!;
    expect(fool.results).toEqual({ win: 0, draw: 0, loss: 1, noResult: 0 });
    const italian = openings.rows.find((row) => row.contributors.shown.some((ref) => ref.runId === "i1"))!;
    expect(italian.eco).toMatch(/^C5\d$/u);
    expect(italian.results).toEqual({ win: 0, draw: 0, loss: 0, noResult: 1 });
    expect(openings.rows.reduce((sum, row) => sum + row.games, 0) + openings.unresolvedGames).toBe(5);
    expect(openings.rows.every((row, index, rows) => index === 0 || rows[index - 1]!.eco.localeCompare(row.eco) <= 0)).toBe(true);
    const detail = profiles.opening({ learnerId: "owner", handle: "owner" }, scholar.key, 0, 50);
    expect(detail.games.items.map((row) => row.runId).sort()).toEqual(["s1", "s2", "s3"]);
    expect(detail.games.items.find((row) => row.runId === "s3")!.outcome).toBe("draw");
  });
});

describe("unadopted subject metrics are explicitly withheld", () => {
  it("does not expose old pooled prevalence as habits or a known-zero read", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    fixture.storage.create(game("o1", ITALIAN_CASTLE), owner);
    drain(fixture.workerStore());
    const profiles = await service(fixture), overview = profiles.profile({ learnerId: "owner", handle: "owner" });
    expect(overview.observations).toEqual([]);
    expect(overview.observationStatus).toEqual({ kind: "unavailable", reason: "subject_metrics_not_adopted" });
    expect(() => profiles.observation({ learnerId: "owner", handle: "owner" }, "rules.structural.event.open_file@1:gained:gained", 0, 50)).toThrow("Detailed structure statistics are unavailable.");
  });
});

describe("history, pending work and attribution", () => {
  it("counts pending runs honestly, excludes imported games' moves and never reads another learner", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    const other = learner(fixture.storage, "other");
    fixture.storage.create(game("mine", ITALIAN_CASTLE), owner);
    fixture.storage.createImportedRun(importedRun("imported", ["e2e4", "e7e5", "g1f3"]), owner, "Imported", {
      runId: "imported", sourceKind: "pgn_paste", sourceUrl: null, movetextDigest: `sha256:${"b".repeat(64)}`, headers: {}, result: "*", pgn: "1. e4 e5 2. Nf3 *", licenceNote: "fixture", importedAt: AT, clockDocument: null,
    });
    fixture.storage.create(game("theirs", FIANCHETTO), other);
    drain(fixture.workerStore());
    fixture.storage.create(game("later", QUEEN_EARLY), owner);
    const profiles = await service(fixture);
    const profile = profiles.profile({ learnerId: "owner", handle: "owner" });
    expect(profile.store).toMatchObject({ runs: 3, counted: 2, pending: 1 });
    expect(profile.store.statement).toBe("2 of your 3 saved runs are counted; 1 is still being processed.");
    expect(profile.population.measuredGames).toBe(1);
    const rows = new Map(profile.history.items.map((row) => [row.runId, row]));
    expect(rows.get("imported")).toMatchObject({ state: "counted", status: "no_decisions_of_yours" });
    expect(rows.get("later")).toMatchObject({ state: "pending" });
    expect(rows.has("theirs")).toBe(false);
    const theirs = profiles.profile({ learnerId: "other", handle: "other" });
    expect(theirs.history.items.map((row) => row.runId)).toEqual(["theirs"]);
  });
});

describe("player-style criterion 11 — privacy and sharing", { timeout: PROFILE_INTEGRATION_TIMEOUT_MS }, () => {
  it("is private by default, refuses a share without consent or for an abstaining card, and shares measured rows only", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    for (let index = 0; index < 25; index += 1) fixture.storage.create(game(`s${index}`, index % 2 === 0 ? FIANCHETTO : ITALIAN_CASTLE), owner);
    drain(fixture.workerStore());
    const profiles = await service(fixture);
    const principal = { learnerId: "owner", handle: "owner" };
    const view = profiles.profile(principal);
    expect(view.privacy.visibility).toBe("private");
    expect(() => profiles.shareCard(principal, "fianchetto_setup_rate", undefined)).toThrow(/explicit consent/u);
    expect(() => profiles.shareCard(principal, "fianchetto_setup_rate", "yes")).toThrow(/explicit consent/u);
    expect(() => profiles.shareCard(principal, "castle_kingside_rate", true)).toThrow(/Only a measured card/u);
    const { share } = profiles.shareCard(principal, "fianchetto_setup_rate", true);
    expect(share.text).toMatch(/13 of 25 measured games/u);
    expect(JSON.stringify(share)).not.toMatch(/"s\d+"|runId|nodeId/u);
    expect(Object.keys(share).sort()).toEqual(["decisions", "floor", "games", "interval", "metric", "scope", "sentence", "text", "title", "window"]);
  });
});

// D4205: durable source/storage/Profile correctness; separate performance limits stay unchanged.
describe("profile-game-facts — current durable evidence across every profile path", { timeout: PROFILE_INTEGRATION_TIMEOUT_MS }, () => {
  it("warm overview/detail/share cannot reuse stale source fields or hide the counted cohort", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), principal = { learnerId: "owner", handle: "owner" };
    for (let index = 0; index < 25; index++) f.storage.create(game(`evidence-${index}`, FIANCHETTO), owner);
    drain(f.workerStore());
    const profiles = await service(f);
    expect(profiles.profile(principal).style.cards.find(card => card.metricId === "fianchetto_setup_rate")).toMatchObject({ state: "measured", numerator: 25, games: 25 });
    expect(profiles.styleCard(principal, "fianchetto_setup_rate", 0, 50).contributors.total).toBe(25);
    expect(profiles.shareCard(principal, "fianchetto_setup_rate", true).share.games).toBe(25);
    const readImage = vi.spyOn(f.storage, "longitudinalSourceImageV4");
    const db = new DatabaseSync(f.path);
    try {
      db.prepare("DELETE FROM learner_game_facts WHERE run_id=?").run("evidence-0");
      const view = profiles.profile(principal);
      expect(view.population.measuredGames).toBe(25);
      expect(view.store.counted).toBe(25);
      expect(view.style.cards.map(card => card.sentence).join(" ")).not.toMatch(/castlingEligible|knightScreen/u);
      expect(view.history.items.every(row => row.state === "counted")).toBe(true);
      for (const id of ["fianchetto_setup_rate", "fianchetto_knight_screen_rate", "castle_kingside_rate", "castle_queenside_rate"]) {
        expect(view.style.cards.find(card => card.metricId === id)).toMatchObject({ state: "abstained", games: 25, abstention: { code: "incomplete_card" } });
        const detail = profiles.styleCard(principal, id, 0, 50);
        expect(detail.contributors.total).toBe(24);
        expect(detail.contributors.shown.every(ref => ref.runId !== "evidence-0")).toBe(true);
        expect(() => profiles.shareCard(principal, id, true)).toThrow(/Only a measured card/u);
      }
      expect(readImage).not.toHaveBeenCalled();
      const project = (image: Parameters<typeof projectObservations>[0], options: Parameters<typeof projectObservations>[1]) => projectObservations(image, { ...options, dependencies: FIXTURE_DEPENDENCIES });
      f.workerStore().rebuild({ write: true, project });
      expect(profiles.profile(principal).style.cards.find(card => card.metricId === "fianchetto_setup_rate")).toMatchObject({ state: "measured", numerator: 25 });
      expect(profiles.shareCard(principal, "fianchetto_setup_rate", true).share.games).toBe(25);
    } finally { db.close(); }
  });
  it("refreshes cached attribution after a real same-head write-capable sharing grant", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), guest = learner(f.storage, "guest"), principal = { learnerId: "owner", handle: "owner" };
    const run = game("same-head-sharing", FIANCHETTO); f.storage.create(run, owner); drain(f.workerStore());
    const warm = await service(f);
    expect(warm.profile(principal).population.measuredGames).toBe(1);
    f.storage.grantRole(run.id, guest.learnerId, "participant", owner, AT);
    drain(f.workerStore());
    expect(f.storage.read(run.id)!.run.events).toEqual(run.events);
    const after = warm.profile(principal), cold = (await service(f)).profile(principal);
    expect(after).toEqual(cold);
    expect(after.store).toMatchObject({ counted: 1, unavailable: 0 });
    expect(after.population.measuredGames).toBe(0);
    expect(after.history.items[0]).toMatchObject({ state: "counted", status: "no_decisions_of_yours" });
  });
  it("cannot reuse cached facts after deleting and recreating an id/cut with a reset job generation", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), principal = { learnerId: "owner", handle: "owner" };
    const first = game("reused-id", FIANCHETTO); f.storage.create(first, owner); const store = f.workerStore(); drain(store);
    const profiles = await service(f); profiles.profile(principal);
    const before = store.jobs().find(job => job.runId === first.id)!;
    const preview = f.storage.deletionPreview(owner.learnerId, { kind: "run", runId: first.id }, AT);
    f.storage.deleteOwnedRun(owner.learnerId, first.id, AT, preview.digest);
    const replacement = game(first.id, ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6"]);
    expect(replacement.events.length).toBe(first.events.length);
    f.storage.create(replacement, owner); drain(store);
    const after = store.jobs().find(job => job.runId === first.id)!;
    expect(after.claimGeneration).toBe(before.claimGeneration);
    expect(after.requestedSourceDigest).not.toBe(before.requestedSourceDigest);
    expect(profiles.profile(principal)).toEqual((await service(f)).profile(principal));
  });
  it("refuses a cold source change with unchanged decision counts and recovers without caching it", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), guest = learner(f.storage, "guest"), principal = { learnerId: "owner", handle: "owner" };
    const run = positionRun("cold-race"); f.storage.create(run, owner); drain(f.workerStore());
    const profiles = await service(f), read = f.storage.longitudinalSourceImageV4.bind(f.storage);
    let first = true;
    const capture = vi.spyOn(f.storage, "longitudinalSourceImageV4").mockImplementation((id, seq) => {
      if (first) { first = false; f.storage.grantRole(run.id, guest.learnerId, "participant", owner, AT); }
      return read(id, seq);
    });
    try {
      const raced = profiles.profile(principal);
      expect(raced.store).toMatchObject({ counted: 0, unavailable: 1 });
      expect(raced.population.playedDecisions).toBe(0);
      drain(f.workerStore());
      expect(profiles.profile(principal)).toEqual((await service(f)).profile(principal));
      const reads = capture.mock.calls.length;
      profiles.profile(principal); expect(capture).toHaveBeenCalledTimes(reads);
    } finally { capture.mockRestore(); }
  });
  it("reuses the service safely when another owner restores the same exact run and reset job generation", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), restored = learner(f.storage, "restored"), principal = { learnerId: "owner", handle: "owner" };
    const run = game("restored-id", FIANCHETTO); f.storage.create(run, owner); drain(f.workerStore());
    const profiles = await service(f); profiles.profile(principal);
    const bundle = readPortableAccountBundle(JSON.parse(new TextDecoder().decode(serializeAccountBundle(f.storage.accountBundle(owner.learnerId)).bytes)));
    const preview = f.storage.deletionPreview(owner.learnerId, { kind: "run", runId: run.id }, AT);
    f.storage.deleteOwnedRun(owner.learnerId, run.id, AT, preview.digest);
    f.storage.restoreAccountBundle(restored.learnerId, planAccountRestore(bundle), { commit: true, at: AT });
    drain(f.workerStore());
    const next = { learnerId: restored.learnerId, handle: "restored" };
    expect(profiles.profile(next)).toEqual((await service(f)).profile(next));
    expect(profiles.profile(next).style.cards.find(card => card.metricId === "fianchetto_setup_rate")).toMatchObject({ state: "abstained", abstention: { code: "below_floor" } });
  });
  it("choice absence cannot retarget the raw first-owner BEFORE or first public metadata CHILD", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), principal = { learnerId: "owner", handle: "owner" };
    const run = game("filtered-first", ["e2e4", "e7e5", "g1f3"]);
    f.storage.create(run, owner); drain(f.workerStore());
    const collect = vi.spyOn(runtime, "decisionTraitPopulation").mockImplementation(() => { throw Error("HTTP choice collection is retired"); });
    const db = new DatabaseSync(f.path);
    try {
      const stored = db.prepare("SELECT cohort_json FROM learner_choice_facts WHERE run_id=?").get(run.id) as { cohort_json: string };
      const row = JSON.parse(stored.cohort_json);
      row.decisions[0].result = { kind: "unavailable", reason: "source_context_unavailable" };
      db.prepare("UPDATE learner_choice_facts SET cohort_json=? WHERE run_id=?").run(JSON.stringify(row), run.id);
      const profiles = await service(f), view = profiles.profile(principal);
      expect(view.population.measuredGames).toBe(1); expect(view.store.counted).toBe(1);
      expect(view.style.cards.find(card => card.metricId === "pawn_choice_residual")).toMatchObject({ state: "abstained", games: 1, abstention: { code: "incomplete_card" } });
      expect(view.style.cards.find(card => card.metricId === "castle_kingside_rate")).toMatchObject({ state: "abstained", games: 1, abstention: { code: "below_floor" } });
      const detail = profiles.styleCard(principal, "castle_kingside_rate", 0, 50);
      expect(detail.contributors.shown).toMatchObject([{ nodeId: run.nodes[1]!.id }]);
      const gameRow = JSON.parse(String(db.prepare("SELECT game_json FROM learner_game_facts WHERE run_id=?").get(run.id)!.game_json));
      expect(gameRow.castling.before.nodeId).toBe(run.nodes[0]!.id);
      expect(collect).not.toHaveBeenCalled();
    } finally { collect.mockRestore(); db.close(); }
  });
  it("a wrong creation sequence in the received GAME lane abstains cards before below-floor math", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), principal = { learnerId: "owner", handle: "owner" };
    f.storage.create(game("bad-ref", FIANCHETTO), owner); drain(f.workerStore());
    const profiles = await service(f); profiles.profile(principal);
    const db = new DatabaseSync(f.path);
    try {
      const stored = db.prepare("SELECT game_json FROM learner_game_facts WHERE run_id=?").get("bad-ref") as { game_json: string };
      const row = JSON.parse(stored.game_json); row.firstOwnerDecision.eventSeq = 2;
      db.prepare("UPDATE learner_game_facts SET game_json=? WHERE run_id=?").run(JSON.stringify(row), "bad-ref");
      const view = profiles.profile(principal);
      expect(view.population.measuredGames).toBe(1); expect(view.store.counted).toBe(1);
      expect(view.style.cards.find(card => card.metricId === "castle_kingside_rate")).toMatchObject({ state: "abstained", games: 1, abstention: { code: "incomplete_card" } });
      expect(profiles.styleCard(principal, "castle_kingside_rate", 0, 50).contributors.total).toBe(0);
      expect(view.style.cards.find(card => card.metricId === "pawn_choice_residual")).toMatchObject({ state: "abstained", abstention: { code: "below_floor" } });
    } finally { db.close(); }
  });
});

// D4205: durable source/storage/Profile correctness; separate performance limits stay unchanged.
describe("profile-choice-facts — current parsed source rows across every Profile path", { timeout: PROFILE_INTEGRATION_TIMEOUT_MS }, () => {
  it("weights all retained decisions rather than averaging unequal-length game means", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), principal = { learnerId: "owner", handle: "owner" };
    const short = game("weight-short", ["e2e4"]), long = game("weight-long", ["e2e4", "e7e5", "g1f3"]);
    // Independent old helper over actual original owner moves; no stored choice row/card is oracle.
    const sums = [short, long].map(run => {
      const ownerNodes = run.nodes.filter(node => node.actor === "user" && node.parentId !== null);
      return { count: ownerNodes.length, sum: ownerNodes.reduce((sum, node) => {
        const before = run.nodes.find(parent => parent.id === node.parentId)!;
        const old = runtime.decisionTraitPopulation(before.fen, node.moveUci!)!;
        return sum + Number(old.played.pawn) - old.share.pawn;
      }, 0) };
    });
    const weighted = (sums[0]!.sum + sums[1]!.sum) / (sums[0]!.count + sums[1]!.count);
    const meanOfMeans = (sums[0]!.sum / sums[0]!.count + sums[1]!.sum / sums[1]!.count) / 2;
    expect(Math.abs(weighted - meanOfMeans)).toBeGreaterThan(0.01);
    for (let index = 0; index < 100; index++)
      f.storage.create(game(`weighted-${index}`, index % 2 === 0 ? ["e2e4"] : ["e2e4", "e7e5", "g1f3"]), owner);
    drain(f.workerStore());
    const profiles = await service(f), card = profiles.profile(principal).style.cards.find(card => card.metricId === "pawn_choice_residual")!;
    expect(card).toMatchObject({ state: "measured", games: 100, decisions: 150 });
    if (card.state !== "measured") throw Error("Existing100game floor must clear");
    expect(card.value).toBeCloseTo(weighted, 12);
    expect(card.value).not.toBeCloseTo(meanOfMeans, 3);
    expect(profiles.styleCard(principal, "pawn_choice_residual", 0, 100).contributors.total).toBe(100);
    expect(profiles.shareCard(principal, "pawn_choice_residual", true).share).toMatchObject({ games: 100, decisions: 150 });
  });

  it("warm cards/details/shares cannot hide missing choices or collect them on the request", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), principal = { learnerId: "owner", handle: "owner" };
    // One real owner move per game reaches the genuine floor without re-running a whole
    // repertoire here. Rebuild/repair has its own real-store controls in profile-choice-store.
    for (let index = 0; index < 100; index++) f.storage.create(game(`choices-${index}`, ["g2g3"]), owner);
    drain(f.workerStore());
    const profiles = await service(f);
    expect(profiles.profile(principal).style.cards.find(card => card.metricId === "pawn_choice_residual")).toMatchObject({ state: "measured", games: 100 });
    expect(profiles.shareCard(principal, "pawn_choice_residual", true).share.games).toBe(100);
    const image = vi.spyOn(f.storage, "longitudinalSourceImageV4");
    const collect = vi.spyOn(runtime, "decisionTraitPopulation").mockImplementation(() => { throw Error("No request-time choice collection"); });
    const db = new DatabaseSync(f.path);
    try {
      const original = db.prepare("SELECT * FROM learner_choice_facts WHERE run_id=?").get("choices-0")!;
      db.prepare("DELETE FROM learner_choice_facts WHERE run_id=?").run("choices-0");
      const view = profiles.profile(principal);
      expect(view.population.measuredGames).toBe(100); expect(view.store.counted).toBe(100);
      expect(view.history.items.every(row => row.state === "counted")).toBe(true);
      expect(view.style.cards.find(card => card.metricId === "fianchetto_setup_rate")).toMatchObject({ state: "measured", numerator: 0 });
      for (const id of ["pawn_choice_residual", "center_pawn_choice_residual", "early_queen_choice_residual"]) {
        expect(view.style.cards.find(card => card.metricId === id)).toMatchObject({ state: "abstained", games: 100, abstention: { code: "incomplete_card" } });
        const detail = profiles.styleCard(principal, id, 0, 100);
        expect(detail.contributors.total).toBe(99);
        expect(detail.contributors.shown.some(ref => ref.runId === "choices-0")).toBe(false);
        expect(() => profiles.shareCard(principal, id, true)).toThrow(/Only a measured card/u);
      }
      expect(view.skills.marksStatement).toContain("lack verified choice");
      expect(view.style.cards.map(card => card.sentence).join(" ")).not.toMatch(/choice_facts|source_context|derivedRev/u);
      expect(image).not.toHaveBeenCalled(); expect(collect).not.toHaveBeenCalled();
      // Restore exactly the genuine worker row removed above: test fresh receiving reads,
      // not another 100-game rebuild (covered independently by the persistence tests).
      db.prepare("INSERT INTO learner_choice_facts(learner_id,run_id,completed_seq,derived_rev,observed_at,primary_branch_id,cohort_json) VALUES(?,?,?,?,?,?,?)")
        .run(original.learner_id!, original.run_id!, original.completed_seq!, original.derived_rev!, original.observed_at!, original.primary_branch_id!, original.cohort_json!);
      expect(profiles.profile(principal).style.cards.find(card => card.metricId === "pawn_choice_residual")).toMatchObject({ state: "measured", games: 100 });
      expect(profiles.shareCard(principal, "pawn_choice_residual", true).share.games).toBe(100);
      expect(image).not.toHaveBeenCalled(); expect(collect).not.toHaveBeenCalled();
    } finally { collect.mockRestore(); image.mockRestore(); db.close(); }
    expect(profiles.profile(principal)).toEqual((await service(f)).profile(principal));
  });

  it("invalid current choice references keep the game/history and independent GAME cards", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), principal = { learnerId: "owner", handle: "owner" };
    f.storage.create(game("wrong-choice-ref", FIANCHETTO), owner); drain(f.workerStore());
    const profiles = await service(f); profiles.profile(principal);
    const db = new DatabaseSync(f.path);
    try {
      db.prepare("UPDATE learner_choice_facts SET cohort_json=json_set(cohort_json,'$.decisions[0].ref.eventSeq',3) WHERE run_id=?").run("wrong-choice-ref");
      const view = profiles.profile(principal);
      expect(view.population.measuredGames).toBe(1); expect(view.store.counted).toBe(1);
      expect(view.style.cards.find(card => card.metricId === "pawn_choice_residual")).toMatchObject({ state: "abstained", abstention: { code: "incomplete_card" } });
      expect(profiles.styleCard(principal, "pawn_choice_residual", 0, 50).contributors.total).toBe(0);
      expect(view.style.cards.find(card => card.metricId === "fianchetto_setup_rate")).toMatchObject({ state: "abstained", abstention: { code: "below_floor" } });
    } finally { db.close(); }
  });

  it("a missing choice at rooted16 cannot block the early-queen metric's complete earlier scope", async () => {
    const f = setup(), owner = learner(f.storage, "owner"), principal = { learnerId: "owner", handle: "owner" };
    const line = ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "d2d3", "d7d6", "b1c3", "g8f6", "a2a3", "a7a6", "h2h3", "h7h6", "d1e2", "d8e7", "e2d1"];
    f.storage.create(game("late-choice-unknown", line), owner); drain(f.workerStore());
    const db = new DatabaseSync(f.path);
    try {
      const row = JSON.parse(String(db.prepare("SELECT cohort_json FROM learner_choice_facts WHERE run_id=?").get("late-choice-unknown")!.cohort_json));
      const late = row.decisions.find((value: { ref: { sourcePly: number } }) => value.ref.sourcePly === 16);
      expect(late).toBeDefined(); late.result = { kind: "unavailable", reason: "source_context_unavailable" };
      db.prepare("UPDATE learner_choice_facts SET cohort_json=? WHERE run_id=?").run(JSON.stringify(row), "late-choice-unknown");
      const profiles = await service(f), view = profiles.profile(principal);
      expect(view.style.cards.find(card => card.metricId === "pawn_choice_residual")).toMatchObject({ state: "abstained", abstention: { code: "incomplete_card" } });
      expect(view.style.cards.find(card => card.metricId === "early_queen_choice_residual")).toMatchObject({ state: "abstained", games: 1, abstention: { code: "below_floor" } });
      expect(profiles.styleCard(principal, "early_queen_choice_residual", 0, 50).contributors.total).toBe(1);
    } finally { db.close(); }
  });
});

describe("skills — the taxonomy renders with named blockers and no number about the learner", () => {
  it("names five categories, gives Openings and Strategy their reason, lists candidate leaves with blockers and derives no mark", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    fixture.storage.create(game("k1", ITALIAN_CASTLE), owner);
    drain(fixture.workerStore());
    const skills = (await service(fixture)).profile({ learnerId: "owner", handle: "owner" }).skills;
    expect(skills.categories.map((category) => category.label)).toEqual(["Fundamentals", "Openings", "Tactics", "Strategy", "Endgame"]);
    expect(skills.categories.find((category) => category.category === "openings")!.emptyReason).toMatch(/not whether a move in it was good/u);
    expect(skills.categories.find((category) => category.category === "strategy")!.emptyReason).toMatch(/neutral/u);
    expect(skills.categories.every((category) => category.marks.length === 0)).toBe(true);
    expect(skills.candidateLeaves).toEqual([expect.objectContaining({ leafId: "shape:carlsbad", category: null, blockers: ["category_unassigned", "valence_unruled", "opportunity_definition_missing"] })]);
    expect(skills.valence).toMatchObject({ declarations: 0, issues: 0 });
    expect(JSON.stringify(skills)).not.toMatch(/%|\bscore\b|\bstreak\b|\branking\b|\d+\s*\/\s*\d+/iu);
  });

  it("criterion 9 — a concept mark is never written to learner_marks", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    fixture.storage.create(game("k1", ITALIAN_CASTLE), owner);
    drain(fixture.workerStore());
    (await service(fixture)).profile({ learnerId: "owner", handle: "owner" });
    expect(fixture.storage.learnerMarks("owner")).toEqual([]);
  });
});
