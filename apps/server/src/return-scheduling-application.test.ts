import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChessTabiyaApplication } from "./application.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { IMPORTED_GAME_PREDICTION_CHECKPOINT } from "./service.js";
import { OpponentSelector } from "./opponent-selector.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;
const MASTERY_KEY = /percent|pct|ratio|ladder|index|level|mastery|score|rung|streak|maturity/iu;

/** Every key in a payload, recursively, with every string value — the §9.2 assertion is over the payload, not the template. */
function scan(value: unknown, keys: string[] = [], strings: string[] = []): { keys: string[]; strings: string[] } {
  if (Array.isArray(value)) value.forEach((item) => scan(item, keys, strings));
  else if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) { keys.push(key); scan(item, keys, strings); }
  } else if (typeof value === "string") strings.push(value);
  return { keys, strings };
}

describe("return scheduling through the production application", { timeout: 20_000 }, () => {
  let application: ChessTabiyaApplication | undefined;
  afterEach(async () => { await application?.close(); application = undefined; vi.restoreAllMocks(); });

  async function start() {
    application = await createInMemoryTestApplication({ development: true, engineMode: "mock", cookieSecure: false });
    await new Promise<void>((resolve, reject) => {
      application!.server.once("error", reject);
      application!.server.listen(0, "127.0.0.1", resolve);
    });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    const registered = await fetch(`${origin}/auth/register`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "return_learner", password: "return-learner-password" }),
    });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const call = async (method: string, path: string, body?: unknown, writer = "writer-return") => {
      const response = await fetch(`${origin}${path}`, {
        method,
        headers: { cookie, "x-writer-id": writer, ...(body === undefined ? {} : { "content-type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const text = await response.text();
      return { status: response.status, body: text.length === 0 ? undefined : JSON.parse(text) as Record<string, unknown>, text };
    };
    return { call, origin, cookie };
  }

  it("serves the due queue with frequency and intake, difficult roots, and no mastery number", async () => {
    const { call } = await start();
    const created = await call("POST", "/runs", {
      id: "return-position",
      session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      policyConfig, seed: 3,
    });
    expect(created.status, created.text).toBe(201);
    const moved = await call("POST", "/runs/return-position/moves", { uci: "e2e4" });
    expect(moved.status, moved.text).toBe(200);

    const due = await call("GET", "/progress/due?at=9999-12-31T23:59:59.999Z");
    expect(due.status, due.text).toBe(200);
    expect(Object.keys(due.body!).sort()).toEqual(["intakeLimit", "schedules", "waiting"]);
    expect(due.body).toMatchObject({ waiting: 0, intakeLimit: 20 });
    const schedules = due.body!.schedules as Record<string, unknown>[];
    expect(schedules).toHaveLength(1);
    expect(Object.keys(schedules[0]!).sort()).toEqual(["dueAt", "frequency", "id", "kind", "packId", "sessionKind", "sourceRunId", "standing", "variant"]);
    // The mock corpus reports the start position; frequency is a population count with its population.
    expect(schedules[0]).toMatchObject({ kind: "varied", variant: null, frequency: { games: 120, population: { source: "lichess-explorer" } } });
    // Discharge D2: one ungraded attempt serves rung 0, which is the word "new" — a word, never the rung.
    expect(schedules[0]!.standing).toBe("new");

    // An early fresh attempt is overstudy: it cannot advance the ladder, so the word stays "new".
    const early = await call("POST", "/runs", {
      id: "return-position-early",
      session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      policyConfig, seed: 5,
    });
    expect(early.status, early.text).toBe(201);
    expect((await call("POST", "/runs/return-position-early/moves", { uci: "e2e4" })).status).toBe(200);
    const overstudied = await call("GET", "/progress/due?at=9999-12-31T23:59:59.999Z");
    const pending = overstudied.body!.schedules as Record<string, unknown>[];
    expect(pending.map((schedule) => schedule.standing)).toEqual(["new"]);

    // Taking the return from the queue is on schedule: the ladder climbs to rung 1 and the word follows the replay.
    const again = await call("POST", "/runs/return-position/duplicate", { id: "return-position-again", seed: 6, scheduleId: pending[0]!.id });
    expect(again.status, again.text).toBe(201);
    expect((await call("POST", "/runs/return-position-again/moves", { uci: "e2e4" })).status).toBe(200);
    const climbed = await call("GET", "/progress/due?at=9999-12-31T23:59:59.999Z");
    const climbedSchedules = climbed.body!.schedules as Record<string, unknown>[];
    expect(climbedSchedules.map((schedule) => schedule.standing)).toEqual(["learning"]);
    for (const schedule of climbedSchedules) expect(["new", "learning", "established"]).toContain(schedule.standing);

    const difficult = await call("GET", "/progress/difficult");
    expect(difficult.status, difficult.text).toBe(200);
    expect(difficult.body).toEqual({ threshold: 3, total: 0, roots: [] });

    const progress = await call("GET", "/progress");
    for (const payload of [due.body, climbed.body, difficult.body, progress.body]) {
      const { keys, strings } = scan(payload);
      expect(keys.filter((key) => MASTERY_KEY.test(key))).toEqual([]);
      expect(strings.filter((value) => value.includes("%"))).toEqual([]);
      expect(strings.filter((value) => /^\d+(\.\d+)?$/u.test(value))).toEqual([]);
    }
  });

  it("records guess-the-move on an imported game through the REST prediction route", async () => {
    const { call } = await start();
    const imported = await call("POST", "/runs/import", {
      id: "solitaire-game", side: "white", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig, seed: 4,
      source: { kind: "pgn", pgn: `[White "A"]\n[Black "B"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 *` },
    });
    expect(imported.status, imported.text).toBe(201);
    const nodes = (imported.body!.run as { nodes: { id: string }[] }).nodes;
    const rewound = await call("POST", "/runs/solitaire-game/rewind", { nodeId: nodes[1]!.id });
    expect(rewound.status, rewound.text).toBe(200);
    const predicted = await call("POST", "/runs/solitaire-game/prediction", {
      startFen: FEN, historyUci: ["e2e4"],
      policy: { mode: "human_common", policyConfigDigest: (imported.body!.run as { sessionDigest: string }).sessionDigest, targetElo: 1500 },
      seed: 4, checkpointId: IMPORTED_GAME_PREDICTION_CHECKPOINT, nodeId: nodes[1]!.id, predictedUci: "e7e5",
    });
    expect(predicted.status, predicted.text).toBe(200);
    const emitted = predicted.body!.emitted as { type: string; data: Record<string, unknown> }[];
    expect(emitted.map((event) => event.type)).toEqual(["prediction.recorded"]);
    expect(Object.keys(emitted[0]!.data)).toEqual(expect.arrayContaining(["predictedMass", "predictedRank"]));
    expect(predicted.text).not.toContain("Unknown prediction checkpoint");
  });

  it("D3694 admits only the authorized recorded imported position before the real selector", async () => {
    const { call, origin } = await start();
    const imported = await call("POST", "/runs/import", {
      id: "prediction-source", side: "white", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig, seed: 4,
      source: { kind: "pgn", pgn: `1. e4 e5 2. Nf3 Nc6 *` },
    });
    expect(imported.status, imported.text).toBe(201);
    const run = imported.body!.run as { sessionDigest: string; nodes: { id: string }[] };
    expect((await call("POST", "/runs/prediction-source/rewind", { nodeId: run.nodes[1]!.id })).status).toBe(200);
    const request = { startFen: FEN, historyUci: ["e2e4"], seed: 4,
      policy: { mode: "human_common", policyConfigDigest: run.sessionDigest, targetElo: 1500 },
      checkpointId: IMPORTED_GAME_PREDICTION_CHECKPOINT, nodeId: run.nodes[1]!.id, predictedUci: "e7e5" };
    const select = vi.spyOn(OpponentSelector.prototype, "select");
    const before = await call("GET", "/runs/prediction-source/graph");
    for (const bad of [{ ...request, historyUci: [] }, { ...request, seed: 9 },
      { ...request, predictedUci: "e7e4" }, { ...request, packId: "unrelated-pack" },
      { ...request, checkpointId: "unreached-pack-checkpoint" },
      { ...request, policy: { ...request.policy, policyConfigDigest: `sha256:${"0".repeat(64)}` } }]) {
      const refused = await call("POST", "/runs/prediction-source/prediction", bad);
      expect(refused.status, refused.text).toBe(400);
    }
    expect((await call("POST", "/runs/prediction-source/prediction", request, "other-device")).status).toBe(409);
    const outsider = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "prediction_outsider", password: "prediction-outsider-password" }) });
    expect(outsider.status).toBe(201);
    const otherCookie = outsider.headers.get("set-cookie")!.split(";", 1)[0]!;
    const asOutsider = () => fetch(`${origin}/runs/prediction-source/prediction`, { method: "POST",
      headers: { cookie: otherCookie, "x-writer-id": "writer-return", "content-type": "application/json" }, body: JSON.stringify(request) });
    expect((await asOutsider()).status).toBe(404);
    expect((await call("POST", "/runs/prediction-source/grants", { op: "grant", handle: "prediction_outsider", role: "spectator" })).status).toBe(200);
    expect((await asOutsider()).status).toBe(403);
    expect(select).not.toHaveBeenCalled();
    expect((await call("GET", "/runs/prediction-source/graph")).body).toEqual(before.body);
    const first = await call("POST", "/runs/prediction-source/prediction", request);
    expect(first.status, first.text).toBe(200);
    const retry = await call("POST", "/runs/prediction-source/prediction", request);
    expect(retry.status, retry.text).toBe(200);
    expect(retry.body).toEqual(first.body);
    const changed = await call("POST", "/runs/prediction-source/prediction", { ...request, predictedUci: "c7c5" });
    expect(changed.status, changed.text).toBe(400);
    expect(select).toHaveBeenCalledTimes(1);
    // Revisiting a source position is another solitaire attempt, not a permanent lock on that node.
    expect((await call("POST", "/runs/prediction-source/rewind", { nodeId: run.nodes[1]!.id })).status).toBe(200);
    expect((await call("POST", "/runs/prediction-source/prediction", { ...request, predictedUci: "c7c5" })).status).toBe(200);
    expect(select).toHaveBeenCalledTimes(2);
  });
});
