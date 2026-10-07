// rfc/player-style.md + rfc/skills.md — the production API: `createApplication` composes the
// profile over the real file-backed store and its worker thread, and every route is the
// authenticated learner's own.
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { appendOpponentPly, commitMove, type DrillRun } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { createApplication, loadValenceRegister, type ChessTabiyaApplication } from "./application.js";
import type { LearnerProfileView } from "./learner-profile.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { AT, positionRun } from "./longitudinal-test-fixtures.js";
import { SQLiteRunStorage } from "./storage.js";

const directories: string[] = [];
let application: ChessTabiyaApplication | undefined;
// Detach before awaiting: a late teardown must never close or delete the next test's database (D3300).
afterEach(async () => {
  const closing = application;
  const removing = directories.splice(0);
  application = undefined;
  try {
    await closing?.close();
  } finally {
    for (const directory of removing) rmSync(directory, { recursive: true, force: true });
  }
});

function temp(): string {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-profile-app-"));
  directories.push(directory);
  return directory;
}

async function until<T>(read: () => Promise<T | undefined>, timeoutMs = 60_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await read();
    if (value !== undefined) return value;
    if (Date.now() > deadline) throw new Error("condition not reached");
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
}

function game(id: string, moves: readonly string[]): DrillRun {
  let run = positionRun(id);
  moves.forEach((move, index) => {
    run = index % 2 === 0
      ? commitMove(run, move, { at: AT }).run
      : appendOpponentPly(run, { moveUci: move, policyModeApplied: "enumerated", candidates: [{ moveUci: move, rank: 1 }], engine: { id: "fixture", name: "fixture", version: "1", seedHonored: true } }, { at: AT }).run;
  });
  return run;
}

async function register(origin: string, handle: string): Promise<string> {
  const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
  expect(response.status).toBe(201);
  return response.headers.get("set-cookie")!.split(";", 1)[0]!;
}

describe("the learner profile crosses the production application boundary", { timeout: 120_000 }, () => {
  it("serves the profile, drill-downs and consented share to its owner only, after the worker counts the runs", async () => {
    const directory = temp();
    const databasePath = join(directory, "app.sqlite");
    application = await createApplication({ engineMode: "mock", cookieSecure: false, databasePath, longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
    await new Promise<void>((resolveListen, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolveListen); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;

    expect((await fetch(`${origin}/learner-profile`)).status).toBe(401);
    const cookie = await register(origin, "profiler");
    const otherCookie = await register(origin, "bystander");
    const inspection = new DatabaseSync(databasePath);
    const learnerId = String((inspection.prepare("SELECT id FROM learners WHERE handle = 'profiler'").get() as { id: string }).id);
    inspection.close();

    const writer = new SQLiteRunStorage(databasePath, { onMigration: () => {} });
    try {
      writer.create(game("app-g1", ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "e1h1"]), { writerId: "writer-profiler", learnerId });
      writer.create(game("app-g2", ["g2g3", "d7d5", "f1g2", "g8f6"]), { writerId: "writer-profiler", learnerId });
      writer.create(game("app-g3", ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "e1h1"]), { writerId: "writer-profiler", learnerId });
    } finally { writer.close(); }

    const profile = await until(async () => {
      const response = await fetch(`${origin}/learner-profile`, { headers: { cookie } });
      expect(response.status).toBe(200);
      const body = await response.json() as { profile: LearnerProfileView };
      return body.profile.store.counted === 3 ? body.profile : undefined;
    });
    expect(profile.store).toMatchObject({ status: "ready", runs: 3, counted: 3, pending: 0 });
    expect(profile.population.measuredGames).toBe(3);
    expect(profile.privacy.visibility).toBe("private");
    expect(profile.style.cards.find((card) => card.metricId === "fianchetto_setup_rate")).toMatchObject({ state: "abstained", sentence: "This card's floor is 25 games; 3 measured." });
    expect(profile.openings.rows.length).toBeGreaterThan(0);
    expect(profile.observations.rows.length).toBeGreaterThan(0);
    expect(profile.skills.categories).toHaveLength(5);

    const card = await (await fetch(`${origin}/learner-profile/style/fianchetto_setup_rate?limit=1`, { headers: { cookie } })).json() as { contributors: { total: number; shown: unknown[]; hiddenCount: number } };
    expect(card.contributors).toMatchObject({ total: 3, hiddenCount: 2 });
    const opening = profile.openings.rows.find(row => row.games === 2)!;
    expect(opening).toBeDefined();
    const openedGames: string[] = [];
    for (const offset of [0, 1]) {
      const response = await fetch(`${origin}/learner-profile/openings/${encodeURIComponent(opening.key)}?offset=${offset}&limit=1`, { headers: { cookie } });
      expect(response.status).toBe(200);
      const detail = await response.json() as { games: { total: number; offset: number; items: { runId: string }[]; hiddenCount: number } };
      expect(detail.games).toMatchObject({ total: 2, offset, hiddenCount: 1 - offset });
      openedGames.push(...detail.games.items.map(row => row.runId));
    }
    expect(new Set(openedGames)).toEqual(new Set(["app-g1", "app-g3"]));
    const observation = profile.observations.rows.find(row => row.occurred >= 2)!;
    expect(observation).toBeDefined();
    const occurred: { runId: string; nodeId: string }[] = [];
    for (let offset = 0; offset < observation.occurred; offset += 1) {
      const response = await fetch(`${origin}/learner-profile/observations/${encodeURIComponent(observation.key)}?offset=${offset}&limit=1`, { headers: { cookie } });
      expect(response.status).toBe(200);
      const detail = await response.json() as { occurred: { total: number; offset: number; items: { runId: string; nodeId: string }[]; hiddenCount: number } };
      expect(detail.occurred).toMatchObject({ total: observation.occurred, offset, hiddenCount: observation.occurred - offset - 1 });
      occurred.push(...detail.occurred.items);
    }
    expect(new Set(occurred.map(ref => `${ref.runId}:${ref.nodeId}`)).size).toBe(observation.occurred);
    const history = await (await fetch(`${origin}/learner-profile/history?limit=1&offset=1`, { headers: { cookie } })).json() as { history: { total: number; items: unknown[]; hiddenCount: number } };
    expect(history.history).toMatchObject({ total: 3, hiddenCount: 1 });
    expect(history.history.items).toHaveLength(1);

    // Profile counts unfinished games. Reading their line must not fabricate a result or
    // change the board, and must honor the current disclosure window.
    const reviewUrl = `${origin}/runs/app-g2/review?branch=app-g2%3Abranch%3A0`;
    const post = (path: string, body: unknown) => fetch(`${origin}${path}`, {
      method: "POST", headers: { cookie, "content-type": "application/json", "x-writer-id": "writer-profiler" }, body: JSON.stringify(body),
    });
    const withheld = await fetch(reviewUrl, { headers: { cookie } });
    expect(withheld.status).toBe(409);
    expect(await withheld.json()).toMatchObject({ error: { code: "ASSISTANCE_WITHHELD" } });
    const revealed = await post("/runs/app-g2/reveal", {});
    expect(revealed.status, await revealed.clone().text()).toBe(200);
    const readRun = () => {
      const db = new DatabaseSync(databasePath, { readOnly: true });
      try { return JSON.parse(String(db.prepare("SELECT snapshot_json FROM drill_runs WHERE id='app-g2'").get()!.snapshot_json)) as DrillRun; }
      finally { db.close(); }
    };
    const beforeReview = readRun();
    const reviewed = await fetch(reviewUrl, { headers: { cookie } });
    expect(reviewed.status, await reviewed.clone().text()).toBe(200);
    const map = await reviewed.json() as { branchId: string; rows: { nodeId: string }[] };
    expect(map.branchId).toBe("app-g2:branch:0");
    expect(map.rows.map(row => row.nodeId)).toEqual(beforeReview.nodes.filter(node => node.ply > 0).map(node => node.id));
    expect(readRun()).toEqual(beforeReview);
    const story = await fetch(`${origin}/runs/app-g2/story?branch=app-g2%3Abranch%3A0`, { headers: { cookie } });
    expect(story.status, await story.clone().text()).toBe(200);
    expect(await story.json()).toMatchObject({ subject: { outcome: { kind: "unfinished" } } });
    expect((await fetch(reviewUrl, { headers: { cookie: otherCookie } })).status).toBe(404);
    const missingBranch = await fetch(`${origin}/runs/app-g2/review?branch=missing`, { headers: { cookie } });
    expect(missingBranch.status).toBe(409);
    expect(await missingBranch.json()).toMatchObject({ error: { code: "STORY_UNAVAILABLE" } });
    const moved = await post("/runs/app-g2/moves", { uci: "b1c3" });
    expect(moved.status, await moved.clone().text()).toBe(200);
    const reclosed = await fetch(reviewUrl, { headers: { cookie } });
    expect(reclosed.status).toBe(409);
    expect(await reclosed.json()).toMatchObject({ error: { code: "ASSISTANCE_WITHHELD" } });

    expect((await fetch(`${origin}/learner-profile/style/no_such_metric`, { headers: { cookie } })).status).toBe(400);
    expect((await fetch(`${origin}/learner-profile`, { method: "POST", headers: { cookie } })).status).toBe(405);
    expect((await fetch(`${origin}/learner-profile/unknown`, { headers: { cookie } })).status).toBe(404);
    const unconsented = await fetch(`${origin}/learner-profile/share-card`, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ metricId: "fianchetto_setup_rate" }) });
    expect(unconsented.status).toBe(400);
    const abstaining = await fetch(`${origin}/learner-profile/share-card`, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ metricId: "fianchetto_setup_rate", consent: true }) });
    expect(abstaining.status).toBe(400);

    const bystander = await (await fetch(`${origin}/learner-profile`, { headers: { cookie: otherCookie } })).json() as { profile: LearnerProfileView };
    expect(bystander.profile.store.runs).toBe(0);
    expect(bystander.profile.history.items).toEqual([]);
    for (const family of ["openings", "observations"] as const) {
      const key = family === "openings" ? opening.key : observation.key;
      const response = await fetch(`${origin}/learner-profile/${family}/${encodeURIComponent(key)}?offset=1&limit=1`, { headers: { cookie: otherCookie } });
      expect(response.status).toBe(400);
      await response.arrayBuffer();
    }
  });

  it("fails startup on an invalid valence register and reads an absent one as empty", async () => {
    const directory = temp();
    expect(await loadValenceRegister(join(directory, "absent.json"))).toEqual({ formatVersion: "tabiya.valence-register.v1", declarations: [] });
    const invalid = join(directory, "invalid.json");
    const { writeFileSync } = await import("node:fs");
    writeFileSync(invalid, JSON.stringify({ formatVersion: "tabiya.valence-register.v1", declarations: [{ projectionId: "x", projectionVersion: 1, authorityId: "x", authorityVersion: 1, declarer: "a", declaredAt: "d", scope: "s", basis: "human_corpus", note: "n" }] }));
    await expect(loadValenceRegister(invalid)).rejects.toThrow(/VALENCE_REGISTER_INVALID.*VALENCE_BASIS_INADMISSIBLE/u);
  });
});
