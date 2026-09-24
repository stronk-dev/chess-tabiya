import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createApplication, type ChessTabiyaApplication } from "./application.js";
import { IMPORTED_GAME_PREDICTION_CHECKPOINT } from "./service.js";

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
  afterEach(async () => { await application?.close(); application = undefined; });

  async function start() {
    application = await createApplication({ development: true, engineMode: "mock", cookieSecure: false });
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
    const call = async (method: string, path: string, body?: unknown) => {
      const response = await fetch(`${origin}${path}`, {
        method,
        headers: { cookie, "x-writer-id": "writer-return", ...(body === undefined ? {} : { "content-type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const text = await response.text();
      return { status: response.status, body: text.length === 0 ? undefined : JSON.parse(text) as Record<string, unknown>, text };
    };
    return { call };
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
    expect(Object.keys(schedules[0]!).sort()).toEqual(["dueAt", "frequency", "id", "kind", "packId", "sessionKind", "sourceRunId", "variant"]);
    // The mock corpus reports the start position; frequency is a population count with its population.
    expect(schedules[0]).toMatchObject({ kind: "varied", variant: null, frequency: { games: 120, population: { source: "lichess-explorer" } } });

    const difficult = await call("GET", "/progress/difficult");
    expect(difficult.status, difficult.text).toBe(200);
    expect(difficult.body).toEqual({ threshold: 3, total: 0, roots: [] });

    const progress = await call("GET", "/progress");
    for (const payload of [due.body, difficult.body, progress.body]) {
      const { keys, strings } = scan(payload);
      expect(keys.filter((key) => MASTERY_KEY.test(key))).toEqual([]);
      expect(strings.filter((value) => value.includes("%"))).toEqual([]);
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
      policy: { mode: "human_common", policyConfigDigest: `sha256:${"c".repeat(64)}`, targetElo: 1500 },
      seed: 4, checkpointId: IMPORTED_GAME_PREDICTION_CHECKPOINT, nodeId: nodes[1]!.id, predictedUci: "e7e5",
    });
    expect(predicted.status, predicted.text).toBe(200);
    const emitted = predicted.body!.emitted as { type: string; data: Record<string, unknown> }[];
    expect(emitted.map((event) => event.type)).toEqual(["prediction.recorded"]);
    expect(Object.keys(emitted[0]!.data)).toEqual(expect.arrayContaining(["predictedMass", "predictedRank"]));
    expect(predicted.text).not.toContain("Unknown prediction checkpoint");
  });
});
