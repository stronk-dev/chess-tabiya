import { INITIAL_FEN } from "chessops/fen";
import {
  readBackReplay,
  type CreateRunInput,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  EngineHealth,
  EngineIdentity,
  EngineRequest,
} from "./engine-supervisor.js";
import {
  OpponentSelector,
  type SelectMoveRequest,
  type SelectorEngineClient,
  type SelectorSpineNode,
} from "./opponent-selector.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { SQLiteRunStorage } from "./storage.js";
import {
  DEFAULT_STRONG_ENGINE_PROFILE,
  stockfishPlaySpec,
} from "./strong-engine.js";

const at = "2026-08-12T18:00:00.000Z";
const digest = `sha256:${"4".repeat(64)}`;

const maiaIdentity: EngineIdentity = {
  id: "maia-5m",
  kind: "opponent",
  name: "Maia3",
  version: "maia-test",
  modelId: "maia3-5m@test",
  containerDigest: `sha256:${"5".repeat(64)}`,
  seedHonored: false,
};
const stockfishIdentity: EngineIdentity = {
  id: "stockfish-play",
  kind: "judge",
  name: "Stockfish",
  version: "18",
  seedHonored: false,
};

class FakeEngineClient implements SelectorEngineClient {
  readonly calls: { readonly engineId: string; readonly request: EngineRequest }[] = [];

  constructor(
    private readonly respond: (
      engineId: string,
      request: EngineRequest,
    ) => readonly string[],
  ) {}

  async execute(
    engineId: string,
    request: EngineRequest,
  ): Promise<readonly string[]> {
    this.calls.push({ engineId, request });
    return this.respond(engineId, request);
  }

  health(engineId: string): EngineHealth {
    const identity = engineId === "maia-5m" ? maiaIdentity : stockfishIdentity;
    return { id: engineId, status: "ready", restartCount: 0, identity };
  }
}

function request(
  mode: string,
  overrides: Partial<SelectMoveRequest> = {},
): SelectMoveRequest {
  return {
    startFen: INITIAL_FEN,
    historyUci: ["e2e4"],
    policy: { mode, policyConfigDigest: digest },
    seed: 42,
    ...overrides,
  };
}

function maiaLines(
  best: string,
  candidates: readonly { move: string; mass: number }[],
): readonly string[] {
  return [
    ...candidates.map(
      (candidate, index) =>
        `info depth 1 multipv ${index + 1} score cp 0 wdl 300 400 300 policy ${candidate.mass} pv ${candidate.move}`,
    ),
    `bestmove ${best}`,
  ];
}

const transposingSpine: readonly SelectorSpineNode[] = [
  {
    id: "nf3",
    moveUci: "g1f3",
    children: [
      {
        id: "d5",
        moveUci: "d7d5",
        children: [
          {
            id: "g3",
            moveUci: "g2g3",
            children: [{ id: "c5", moveUci: "c7c5", children: [] }],
          },
        ],
      },
    ],
  },
];

describe("pure opponent selector", () => {
  it("ships the ratified 100 ms, one-thread, 16 MB strong-engine profile", async () => {
    const client = new FakeEngineClient(() => ["bestmove c7c5"]);
    const selector = new OpponentSelector(client);

    const selection = await selector.select(request("strong_engine"));
    expect(selection.policyModeApplied).toBe("strong_engine");

    expect(DEFAULT_STRONG_ENGINE_PROFILE).toEqual({
      movetimeMs: 100,
      threads: 1,
      hashMb: 16,
      multiPv: 1,
    });
    expect(client.calls[0]?.request.commands.at(-1)).toBe("go movetime 100");
    expect(stockfishPlaySpec()).toMatchObject({
      id: "stockfish-play",
      kind: "opponent",
      command: "stockfish",
      options: { Threads: 1, Hash: 16, MultiPV: 1 },
    });
    expect(
      stockfishPlaySpec({
        command: "/opt/stockfish",
        profile: { movetimeMs: 250, threads: 2, hashMb: 64 },
      }),
    ).toMatchObject({
      command: "/opt/stockfish",
      options: { Threads: 2, Hash: 64, MultiPV: 1 },
    });
  });

  it("selects human-common Maia output with mapped policy knobs", async () => {
    const client = new FakeEngineClient(() =>
      maiaLines("e7e5", [
        { move: "e7e5", mass: 0.65 },
        { move: "c7c5", mass: 0.2 },
      ]),
    );
    const selector = new OpponentSelector(client);

    const selection = await selector.select({
      ...request("human_common"),
      policy: {
        mode: "human_common",
        policyConfigDigest: digest,
        targetElo: 1800,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    expect(selection).toMatchObject({
      moveUci: "e7e5",
      candidates: [
        { moveUci: "e7e5", mass: 0.65, rank: 1 },
        { moveUci: "c7c5", mass: 0.2, rank: 2 },
      ],
      engine: { id: "maia-5m", modelId: "maia3-5m@test", seedHonored: false },
    });
    expect(client.calls[0]?.request.commands).toEqual([
      "setoption name Elo value 1800",
      "setoption name Temperature value 0.7",
      "setoption name TopP value 0.9",
      "setoption name MultiPV value 8",
      `position fen ${INITIAL_FEN} moves e2e4`,
      "go",
    ]);
  });

  it("uses movetime-limited Stockfish for strong_engine", async () => {
    const client = new FakeEngineClient((engineId) => {
      expect(engineId).toBe("stockfish-play");
      return ["info depth 4 multipv 1 score cp 25 pv c7c5", "bestmove c7c5"];
    });
    const selector = new OpponentSelector(client, { strongEngineMovetimeMs: 125 });

    await expect(selector.select(request("strong_engine"))).resolves.toMatchObject({
      moveUci: "c7c5",
      engine: { id: "stockfish-play", name: "Stockfish" },
    });
    expect(client.calls[0]?.request.commands.at(-1)).toBe("go movetime 125");
  });

  it("recognizes a transposition back by transposeKey and restricts Maia mass to spine children", async () => {
    const client = new FakeEngineClient(() =>
      maiaLines("e7e6", [
        { move: "e7e6", mass: 0.9 },
        { move: "c7c5", mass: 0.1 },
      ]),
    );
    const selector = new OpponentSelector(client);
    const selection = await selector.select({
      ...request("theory_strict"),
      historyUci: ["g2g3", "d7d5", "g1f3"],
      policy: {
        mode: "theory_strict",
        policyConfigDigest: digest,
        spine: transposingSpine,
      },
    });

    expect(selection.moveUci).toBe("c7c5");
    expect(selection.policyModeApplied).toBe("theory_strict");
    expect(selection.candidates).toEqual([
      { moveUci: "c7c5", mass: 0.1, rank: 2 },
    ]);
    expect(client.calls[0]?.request.commands).toContain(
      "setoption name MultiPV value 8",
    );
  });

  it("falls back uniformly when legal spine candidates have zero policy mass", async () => {
    const spine: readonly SelectorSpineNode[] = [
      {
        id: "e4",
        moveUci: "e2e4",
        children: [
          { id: "e5", moveUci: "e7e5", children: [] },
          { id: "c5", moveUci: "c7c5", children: [] },
        ],
      },
    ];
    const client = new FakeEngineClient(() =>
      maiaLines("g8f6", [
        { move: "e7e5", mass: 0 },
        { move: "c7c5", mass: 0 },
      ]),
    );
    const selection = await new OpponentSelector(client).select({
      ...request("theory_strict"),
      policy: { mode: "theory_strict", policyConfigDigest: digest, spine },
    });

    expect(["e7e5", "c7c5"]).toContain(selection.moveUci);
    expect(selection.candidates).toEqual([
      { moveUci: "e7e5", mass: 0, rank: 1 },
      { moveUci: "c7c5", mass: 0, rank: 2 },
    ]);
  });

  it("samples legal spine children proportionally to patched Maia policy mass", async () => {
    const spine: readonly SelectorSpineNode[] = [
      {
        id: "e4",
        moveUci: "e2e4",
        children: [
          { id: "e5", moveUci: "e7e5", children: [] },
          { id: "c5", moveUci: "c7c5", children: [] },
        ],
      },
    ];
    const client = new FakeEngineClient(() =>
      maiaLines("e7e5", [
        { move: "e7e5", mass: 0.9 },
        { move: "c7c5", mass: 0.1 },
      ]),
    );
    const selector = new OpponentSelector(client);
    const selections = await Promise.all(
      Array.from({ length: 100 }, (_, seed) =>
        selector.select({
          ...request("theory_strict"),
          seed,
          policy: { mode: "theory_strict", policyConfigDigest: digest, spine },
        }),
      ),
    );
    const common = selections.filter((selection) => selection.moveUci === "e7e5");
    const alternative = selections.filter(
      (selection) => selection.moveUci === "c7c5",
    );

    expect(common.length).toBeGreaterThan(75);
    expect(alternative.length).toBeGreaterThan(0);
  });

  it("logs degradation and uses rank weighting if a future Maia pin loses policy mass", async () => {
    const spine: readonly SelectorSpineNode[] = [
      {
        id: "e4",
        moveUci: "e2e4",
        children: [
          { id: "e5", moveUci: "e7e5", children: [] },
          { id: "c5", moveUci: "c7c5", children: [] },
        ],
      },
    ];
    const client = new FakeEngineClient(() => [
      "info depth 1 multipv 1 score cp 0 wdl 300 400 300 pv e7e5",
      "info depth 1 multipv 2 score cp 0 wdl 300 400 300 pv c7c5",
      "bestmove e7e5",
    ]);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const selection = await new OpponentSelector(client).select({
        ...request("theory_strict"),
        policy: { mode: "theory_strict", policyConfigDigest: digest, spine },
      });

      expect(["e7e5", "c7c5"]).toContain(selection.moveUci);
      expect(warning).toHaveBeenCalledWith(expect.stringContaining("DEGRADED_POLICY_MASS"));
    } finally {
      warning.mockRestore();
    }
  });

  it("falls back to human_common off-spine", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const client = new FakeEngineClient(() =>
      maiaLines("g8f6", [{ move: "g8f6", mass: 0.5 }]),
    );
    try {
      const selection = await new OpponentSelector(client).select({
        ...request("theory_strict"),
        historyUci: ["d2d4"],
        policy: {
          mode: "theory_strict",
          policyConfigDigest: digest,
          spine: [{ id: "e4", moveUci: "e2e4", children: [] }],
        },
      });

      expect(selection.moveUci).toBe("g8f6");
      expect(selection.policyModeApplied).toBe("human_common");
      expect(client.calls[0]?.request.commands).toContain(
        "setoption name MultiPV value 8",
      );
      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining("DEGRADED_THEORY_SPINE"),
      );
    } finally {
      warning.mockRestore();
    }
  });

  it("caches by policy digest, branch seed, and complete history hash", async () => {
    const client = new FakeEngineClient(() =>
      maiaLines("e7e5", [{ move: "e7e5", mass: 0.5 }]),
    );
    const selector = new OpponentSelector(client);
    const base = request("human_common");

    const first = await selector.select(base);
    const retry = await selector.select({ ...base });
    expect(retry).toBe(first);
    expect(client.calls).toHaveLength(1);

    await selector.select({ ...base, seed: 43 });
    await selector.select({ ...base, historyUci: ["d2d4"] });
    await selector.select({ ...base, packId: "pack-a" });
    await selector.select({ ...base, packId: "pack-b" });
    expect(client.calls).toHaveLength(5);
    expect(selector.cacheSize()).toBe(5);
  });
});

function createBody(id: string) {
  return {
    id,
    session: {
      kind: "position" as const,
      start: { fen: INITIAL_FEN, side: "white" as const },
      feedbackPolicy: "attempt_end" as const,
      opponentPolicy: { mode: "human_common" as const },
    },
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    seed: 42,
    createdAt: at,
  };
}

async function httpRequest(
  handler: ReturnType<typeof createRestHandler>,
  method: string,
  path: string,
  value?: unknown,
  writer = "writer-a",
): Promise<Response> {
  return handler(
    new Request(`http://server.test${path}`, {
      method,
      headers: {
        ...(writer === "" ? {} : { "x-writer-id": writer }),
        ...(value === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    }),
  );
}

describe("selector/writer REST seam", () => {
  const stores: SQLiteRunStorage[] = [];

  afterEach(() => {
    for (const store of stores.splice(0)) store.close();
  });

  it("keeps selection pure, rejects a server writer, and appends an adjacent replayable ply", async () => {
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    const client = new FakeEngineClient(() =>
      maiaLines("e7e5", [{ move: "e7e5", mass: 0.7 }]),
    );
    const handler = createRestHandler(
      new RunService(storage, {
        evidenceQueue: new EvidenceJobQueue({
          async execute() {
            return {
              kind: "eval",
              source: "engine_validated",
              values: { centipawns: 0 },
            };
          },
        } satisfies EvidenceExecutor),
      }),
      new OpponentSelector(client),
    );

    expect(
      (await httpRequest(handler, "POST", "/runs", createBody("seam-run"))).status,
    ).toBe(201);
    expect(
      (
        await httpRequest(handler, "POST", "/runs/seam-run/moves", {
          uci: "e2e4",
          at,
        })
      ).status,
    ).toBe(200);

    const beforeSelection = storage.read("seam-run")!.run.events.length;
    const rejectedSpine = await httpRequest(
      handler,
      "POST",
      "/select-move",
      {
        ...request("theory_strict"),
        policy: {
          ...request("theory_strict").policy,
          spine: [{ id: "client-answer", moveUci: "e2e4", children: [] }],
        },
      },
      "",
    );
    expect(rejectedSpine.status).toBe(400);
    const selected = await httpRequest(
      handler,
      "POST",
      "/select-move",
      request("human_common"),
      "",
    );
    expect(selected.status).toBe(200);
    const selection = (await selected.json()) as OpponentSelection;
    expect(selection).toMatchObject({ moveUci: "e7e5", policyModeApplied: "human_common", engine: { id: "maia-5m" } });
    expect(storage.read("seam-run")!.run.events).toHaveLength(beforeSelection);

    const { policyModeApplied: _missing, ...legacySelection } = selection;
    const rejected = await httpRequest(
      handler,
      "POST",
      "/runs/seam-run/moves",
      { selection: legacySelection, at },
    );
    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toMatchObject({ error: { code: "INVALID_REQUEST" } });
    expect(storage.read("seam-run")!.run.events).toHaveLength(beforeSelection);

    const forbidden = await httpRequest(
      handler,
      "POST",
      "/runs/seam-run/moves",
      { selection, at },
      "server-opponent-selector",
    );
    expect(forbidden.status).toBe(409);
    expect(await forbidden.json()).toMatchObject({
      error: { code: "NOT_ACTIVE_WRITER" },
    });

    const committed = await httpRequest(
      handler,
      "POST",
      "/runs/seam-run/moves",
      { selection, at },
    );
    expect(committed.status).toBe(200);
    const stored = storage.read("seam-run")!.run;
    expect(stored.events.slice(-2).map((event) => event.type)).toEqual([
      "opponent.move_selected",
      "move.committed",
    ]);
    expect(readBackReplay(stored.events).opponentMoves.at(-1)).toMatchObject({
      moveUci: "e7e5",
      policyModeApplied: "human_common",
    });
  });
});
