// rfc/player-style.md criteria 7, 11, 14, 15 and rfc/skills.md criteria 9, 12, 13 through the real
// longitudinal store: file-backed SQLite, the real decision algebra, the worker's batch executor.
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";

import { appendOpponentPly, commitMove, STYLE_METRICS, type DrillRun, type MeasuredHabitCard } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { assertLongitudinalStorePresent, LearnerProfileService } from "./learner-profile.js";
import { projectObservations } from "./longitudinal-projector.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { AT, FIXTURE_DEPENDENCIES, fileFixture, importedRun, learner, positionRun, type FileFixture } from "./longitudinal-test-fixtures.js";
import { loadOpeningCatalogue } from "./opening-catalogue.js";
import { LONGITUDINAL_TABLES, type LongitudinalStore } from "./longitudinal-store.js";

const fixtures: FileFixture[] = [];
afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    try { fixture.storage.close(); } catch { /* closed */ }
    rmSync(dirname(fixture.path), { recursive: true, force: true });
  }
});

const FAST = { project: (image: Parameters<typeof projectObservations>[0], checkpoint: () => void) => projectObservations(image, { checkpoint, dependencies: FIXTURE_DEPENDENCIES }) };

function drain(store: LongitudinalStore): void {
  for (;;) if (runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "profile-test", FAST).claimed === 0) return;
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

describe("a card measures exactly at its floor", () => {
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

describe("opening performance uses the runtime opening identity", () => {
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

describe("the observation ledger carries occurrence and opportunity denominators with drill-down", () => {
  it("sums store rows for played decisions only and resolves each occurred ref to its move", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    fixture.storage.create(game("o1", ITALIAN_CASTLE), owner);
    drain(fixture.workerStore());
    const profiles = await service(fixture);
    const ledger = profiles.profile({ learnerId: "owner", handle: "owner" }).observations;
    expect(ledger.statement).toMatch(/No rate, trend or comparison is shown/u);
    const openFile = ledger.rows.find((row) => row.projectionId === "rules.structural.event.open_file")!;
    expect(openFile).toMatchObject({ occurred: 1, runs: 1, decisions: 4, derivedRev: 1 });
    expect(openFile.opportunities).toBeGreaterThanOrEqual(1);
    const detail = profiles.observation({ learnerId: "owner", handle: "owner" }, openFile.key, 0, 50);
    expect(detail.occurred.items).toEqual([expect.objectContaining({ runId: "o1", moveSan: "e4", ply: 1 })]);
  });
});

describe("history, pending work and attribution", () => {
  it("counts pending runs honestly, excludes imported games' moves and never reads another learner", async () => {
    const fixture = setup();
    const owner = learner(fixture.storage, "owner");
    const other = learner(fixture.storage, "other");
    fixture.storage.create(game("mine", ITALIAN_CASTLE), owner);
    fixture.storage.createImportedRun(importedRun("imported", ["e2e4", "e7e5", "g1f3"]), owner, "Imported", {
      runId: "imported", sourceKind: "pgn_paste", sourceUrl: null, movetextDigest: `sha256:${"b".repeat(64)}`, headers: {}, result: "*", pgn: "1. e4 e5 2. Nf3 *", licenceNote: "fixture", importedAt: AT,
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

describe("player-style criterion 11 — privacy and sharing", () => {
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
