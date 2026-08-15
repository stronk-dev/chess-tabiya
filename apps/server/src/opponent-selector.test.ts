import { readFileSync } from "node:fs";

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
import { createRestHandler, errorResponse } from "./rest.js";
import { RunService } from "./service.js";
import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { SQLiteRunStorage } from "./storage.js";
import {
  DEFAULT_STRONG_ENGINE_PROFILE,
  stockfishPlaySpec,
} from "./strong-engine.js";
import { FixtureTablebaseSource, parseTablebasePosition } from "./tablebase.js";
import { DEFAULT_MAIA_IMAGE, MAIA3_MODEL_ID } from "./maia.js";

const at = "2026-08-12T18:00:00.000Z";
const digest = `sha256:${"4".repeat(64)}`;

interface MaiaPolicyFixture {
  readonly provenance: { readonly image: string; readonly modelId: string };
  readonly candidates: readonly { readonly moveUci: string; readonly mass: number }[];
}

const maiaPolicyFixture = JSON.parse(readFileSync(
  new URL("../../../packages/runtime/src/fixtures/maia-policy-mass-near-boundary.fixture.json", import.meta.url),
  "utf8",
)) as MaiaPolicyFixture;

const maiaIdentity: EngineIdentity = {
  id: "maia-5m",
  kind: "opponent",
  name: "Maia3",
  version: "maia-test",
  modelId: "maia3-5m@test",
  containerDigest: `sha256:${"5".repeat(64)}`,
  seedHonored: false,
  eloHonored: true,
};
const stockfishIdentity: EngineIdentity = {
  id: "stockfish-play",
  kind: "judge",
  name: "Stockfish",
  version: "18",
  seedHonored: false,
  eloHonored: false,
};

class FakeEngineClient implements SelectorEngineClient {
  readonly calls: { readonly engineId: string; readonly request: EngineRequest }[] = [];

  constructor(
    private readonly respond: (
      engineId: string,
      request: EngineRequest,
    ) => readonly string[],
    private readonly identities: Readonly<Record<string, EngineIdentity>> = {},
    private readonly healthOverrides: Readonly<Record<string, EngineHealth>> = {},
  ) {}

  async execute(
    engineId: string,
    request: EngineRequest,
  ): Promise<readonly string[]> {
    this.calls.push({ engineId, request });
    return this.respond(engineId, request);
  }

  health(engineId: string): EngineHealth {
    const override = this.healthOverrides[engineId];
    if (override !== undefined) return override;
    const identity = this.identities[engineId] ?? (engineId === "maia-5m" ? maiaIdentity : stockfishIdentity);
    return {
      id: engineId,
      status: "ready",
      restartCount: 0,
      identity,
      ...(identity.eloHonored === true
        ? {
            bandOption: "Elo",
            options: [
              { name: "Elo", type: "spin" as const, default: "1500", min: 0, max: 5000 },
              { name: "SelfElo", type: "spin" as const, default: "1500", min: 0, max: 5000 },
              { name: "OppoElo", type: "spin" as const, default: "1500", min: 0, max: 5000 },
              { name: "MultiPV", type: "spin" as const, default: "5", min: 1, max: 20 },
            ],
          }
        : {}),
    };
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

const practicalFen = "8/8/8/8/8/2k5/4K3/7R b - - 0 1";
const practicalB3 = "8/8/8/8/8/1k6/4K3/7R w - - 1 2";
const practicalC2 = "8/8/8/8/8/8/2k1K3/7R w - - 1 2";

function practicalTablebase(conceding = true): FixtureTablebaseSource {
  return new FixtureTablebaseSource({
    [practicalFen]: parseTablebasePosition({
      category: "loss", dtz: -20,
      moves: [
        { uci: "c3b3", san: "Kb3", category: "win", dtz: 19, precise_dtz: 19 },
        { uci: "c3c2", san: "Kc2", category: "win", dtz: 17, precise_dtz: 17 },
      ],
    }),
    [practicalB3]: parseTablebasePosition({
      category: "win", dtz: 19,
      moves: [
        { uci: "h1h3", san: "Rh3", category: conceding ? "draw" : "loss", dtz: 0, precise_dtz: 0 },
        { uci: "e2f2", san: "Kf2", category: "loss", dtz: -18, precise_dtz: -18 },
      ],
    }),
    [practicalC2]: parseTablebasePosition({
      category: "win", dtz: 17,
      moves: [
        { uci: "h1h2", san: "Rh2", category: "loss", dtz: -16, precise_dtz: -16 },
        { uci: "e2f2", san: "Kf2", category: conceding ? "draw" : "loss", dtz: 0, precise_dtz: 0 },
      ],
    }),
  });
}

describe("pure opponent selector", () => {
  it("pins captured Maia fixture identity to the deployed instrument", () => {
    expect(maiaPolicyFixture.provenance.image).toBe(DEFAULT_MAIA_IMAGE);
    expect(maiaPolicyFixture.provenance.modelId).toBe(MAIA3_MODEL_ID);
  });

  it("chooses the category-preserving reply with greatest measured concession mass", async () => {
    const client = new FakeEngineClient((_engineId, engineRequest) => {
      const position = engineRequest.commands.find((command) => command.startsWith("position fen ")) ?? "";
      return position.endsWith("moves c3b3")
        ? maiaLines("e2f2", [{ move: "h1h3", mass: 0.1 }, { move: "e2f2", mass: 0.9 }])
        : maiaLines("e2f2", [{ move: "h1h2", mass: 0.1 }, { move: "e2f2", mass: 0.9 }]);
    });
    const selector = new OpponentSelector(client, { tablebaseSource: practicalTablebase() });

    const requestValue = {
      ...request("practical_resistance"),
      startFen: practicalFen,
      historyUci: [],
      policy: { mode: "practical_resistance", policyConfigDigest: digest, targetElo: 1800 },
    };
    await expect(selector.select(requestValue)).resolves.toMatchObject({
      moveUci: "c3c2",
      policyModeApplied: "practical_resistance",
      candidates: [
        { moveUci: "c3b3", rank: 1, concessionRatio: 0.1 },
        { moveUci: "c3c2", rank: 2, concessionRatio: 0.9 },
      ],
      engine: { eloHonored: true, eloApplied: 1800 },
    });
    await expect(selector.select({
      ...requestValue,
      policy: { mode: "perfect_tablebase", policyConfigDigest: `sha256:${"6".repeat(64)}` },
    })).resolves.toMatchObject({ moveUci: "c3b3", policyModeApplied: "perfect_tablebase" });
    expect(selector.availableModes()).toContain("practical_resistance");
  });

  it("refuses vacuous practical resistance instead of playing alphabetically", async () => {
    const client = new FakeEngineClient((_engineId, engineRequest) => {
      const position = engineRequest.commands.find((command) => command.startsWith("position fen ")) ?? "";
      return position.endsWith("moves c3b3")
        ? maiaLines("h1h3", [{ move: "h1h3", mass: 0.7 }, { move: "e2f2", mass: 0.3 }])
        : maiaLines("h1h2", [{ move: "h1h2", mass: 0.9 }, { move: "e2f2", mass: 0.1 }]);
    });
    const selector = new OpponentSelector(client, { tablebaseSource: practicalTablebase(false) });
    await expect(selector.select({
      ...request("practical_resistance"), startFen: practicalFen, historyUci: [],
    })).rejects.toMatchObject({ code: "PRACTICAL_RESISTANCE_UNDECIDABLE" });
  });

  it("converts materially invalid Maia policy mass into a 422 refusal", async () => {
    const selector = new OpponentSelector(new FakeEngineClient(() => maiaLines("e2f2", [
      { move: "h1h3", mass: 0.6 },
      { move: "e2f2", mass: 0.41 },
    ])), { tablebaseSource: practicalTablebase() });
    let refusal: unknown;
    try {
      await selector.select({
        ...request("practical_resistance"), startFen: practicalFen, historyUci: [],
      });
    } catch (error) {
      refusal = error;
    }
    expect(refusal).toMatchObject({ code: "PRACTICAL_RESISTANCE_POLICY_MASS_INVALID" });
    const response = errorResponse(refusal);
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "PRACTICAL_RESISTANCE_POLICY_MASS_INVALID" },
    });
  });

  it("drives a captured float32 policy vector through practical selection", async () => {
    const lines = maiaPolicyFixture.candidates.map(({ moveUci: move, mass }) => ({ move, mass }));
    const selector = new OpponentSelector(
      new FakeEngineClient(() => maiaLines(lines[0]!.move, lines)),
      { tablebaseSource: practicalTablebase() },
    );
    await expect(selector.select({
      ...request("practical_resistance"), startFen: practicalFen, historyUci: [],
    })).rejects.toMatchObject({ code: "PRACTICAL_RESISTANCE_UNDECIDABLE" });
  });

  it("uses the deterministic UCI tiebreak when every Maia reading abstains", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const selector = new OpponentSelector(new FakeEngineClient(() => [
        "info depth 1 multipv 1 score cp 0 pv e2f2",
        "bestmove e2f2",
      ]), { tablebaseSource: practicalTablebase() });
      await expect(selector.select({
        ...request("practical_resistance"), startFen: practicalFen, historyUci: [],
      })).resolves.toMatchObject({ moveUci: "c3b3", candidates: [
        { moveUci: "c3b3", rank: 1 },
        { moveUci: "c3c2", rank: 2 },
      ] });
      expect(warning).toHaveBeenCalledWith(expect.stringContaining("DEGRADED_POLICY_MASS"));
    } finally {
      warning.mockRestore();
    }
  });

  it("refuses when no legal reply preserves the tablebase category", async () => {
    const noPreserving = new FixtureTablebaseSource({
      [practicalFen]: parseTablebasePosition({
        category: "loss", dtz: -20,
        moves: [{ uci: "c3b3", san: "Kb3", category: "draw", dtz: 0, precise_dtz: 0 }],
      }),
    });
    const selector = new OpponentSelector(new FakeEngineClient(() => []), { tablebaseSource: noPreserving });
    await expect(selector.select({
      ...request("practical_resistance"), startFen: practicalFen, historyUci: [],
    })).rejects.toMatchObject({ code: "PRACTICAL_RESISTANCE_UNAVAILABLE" });
  });
  it("inverts result-position categories and selects deterministic DTZ-perfect play", async () => {
    const fen = "4k3/6KP/8/8/8/8/8/8 w - - 0 1";
    const payload = parseTablebasePosition({
      category: "win",
      dtz: 1,
      moves: [
        { uci: "h7h8r", san: "h8=R+", category: "loss", dtz: -1, precise_dtz: -1 },
        { uci: "h7h8q", san: "h8=Q+", category: "loss", dtz: -1, precise_dtz: -1 },
        { uci: "g7f6", san: "Kf6", category: "draw", dtz: 0, precise_dtz: 0 },
      ],
    });
    const selector = new OpponentSelector(new FakeEngineClient(() => []), {
      tablebaseSource: new FixtureTablebaseSource({ [fen]: payload }),
    });

    const input = request("perfect_tablebase", { startFen: fen, historyUci: [] });
    const first = await selector.select(input);
    const second = await selector.select(input);
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      moveUci: "h7h8q",
      policyModeApplied: "perfect_tablebase",
      engine: { id: "lichess-tablebase", version: "7man", seedHonored: true },
      candidates: [
        { moveUci: "h7h8q", rank: 1 },
        { moveUci: "h7h8r", rank: 2 },
      ],
    });
    expect(selector.availableModes()).toContain("perfect_tablebase");
  });

  it("refuses perfect play by name when the provider is absent", async () => {
    const selector = new OpponentSelector(new FakeEngineClient(() => []));
    expect(selector.availableModes()).not.toContain("perfect_tablebase");
    await expect(selector.select(request("perfect_tablebase"))).rejects.toMatchObject({
      code: "TABLEBASE_UNAVAILABLE",
    });
  });
  it("ships the ratified 50000-node, one-thread, 16 MB strong-engine profile", async () => {
    const client = new FakeEngineClient(() => ["bestmove c7c5"]);
    const selector = new OpponentSelector(client);

    const selection = await selector.select(request("strong_engine"));
    expect(selection.policyModeApplied).toBe("strong_engine");

    expect(DEFAULT_STRONG_ENGINE_PROFILE).toEqual({
      movetimeMs: 100,
      nodes: 50_000,
      threads: 1,
      hashMb: 16,
      multiPv: 1,
    });
    expect(client.calls[0]?.request.commands[0]).toBe("setoption name MultiPV value 1");
    expect(client.calls[0]?.request.resetSearchState).toBe(true);
    expect(client.calls[0]?.request.commands.at(-1)).toBe("go nodes 50000");
    expect(selection.engine.searchBound).toEqual({ kind: "nodes", value: 50_000 });
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
      "setoption name SelfElo value 1500",
      "setoption name OppoElo value 1500",
      "setoption name Elo value 1800",
      "setoption name Temperature value 0.7",
      "setoption name TopP value 0.9",
      "setoption name MultiPV value 20",
      `position fen ${INITIAL_FEN} moves e2e4`,
      "go",
    ]);
  });

  it("does not send or record a requested Elo band when the engine does not advertise it", async () => {
    const unbanded = { ...maiaIdentity, eloHonored: false };
    const client = new FakeEngineClient(
      () => maiaLines("e7e5", [{ move: "e7e5", mass: 1 }]),
      { "maia-5m": unbanded },
    );
    const selector = new OpponentSelector(client);
    const selection = await selector.select({
      ...request("human_common"),
      policy: { mode: "human_common", policyConfigDigest: digest, targetElo: 1800 },
    });
    expect(client.calls[0]?.request.commands).not.toContain("setoption name Elo value 1800");
    expect(selection.engine).toMatchObject({ eloHonored: false });
    expect(selection.engine.eloApplied).toBeUndefined();
  });

  it("states and records the engine-advertised default band when targetElo is omitted", async () => {
    const client = new FakeEngineClient(() => maiaLines("e7e5", [{ move: "e7e5", mass: 1 }]));
    const selection = await new OpponentSelector(client).select(request("human_common"));
    expect(selection.engine).toMatchObject({ eloHonored: true, eloApplied: 1500 });
    expect(client.calls[0]?.request.commands).toContain("setoption name Elo value 1500");
  });

  it("refuses target bands outside the effective published range", () => {
    const selector = new OpponentSelector(new FakeEngineClient(() => []));
    expect(() => selector.select(request("human_common", {
      policy: { mode: "human_common", policyConfigDigest: digest, targetElo: 5001 },
    }))).toThrow(expect.objectContaining({ code: "TARGET_ELO_OUT_OF_RANGE" }));
  });

  it("retries a sampled move outside the requested window and records the residual", async () => {
    let calls = 0;
    const client = new FakeEngineClient(() => {
      calls += 1;
      return maiaLines(calls === 1 ? "g8f6" : "b8c6", [{ move: "e7e5", mass: 0.6 }]);
    });
    const selection = await new OpponentSelector(client).select(request("human_common"));
    expect(client.calls).toHaveLength(2);
    expect(selection).toMatchObject({
      moveUci: "b8c6",
      candidates: [
        { moveUci: "e7e5", rank: 1, mass: 0.6 },
        { moveUci: "b8c6", rank: 2, offWindow: true },
      ],
    });
  });

  it("uses movetime-limited Stockfish for strong_engine", async () => {
    const client = new FakeEngineClient((engineId) => {
      expect(engineId).toBe("stockfish-play");
      return ["info depth 4 multipv 1 score cp 25 pv c7c5", "bestmove c7c5"];
    });
    const selector = new OpponentSelector(client, { strongEngineMovetimeMs: 125, strongEngineProfile: { nodes: null } });

    await expect(selector.select(request("strong_engine"))).resolves.toMatchObject({
      moveUci: "c7c5",
      engine: { id: "stockfish-play", name: "Stockfish", searchBound: { kind: "movetime", value: 125 } },
    });
    expect(client.calls[0]?.request.commands.at(-1)).toBe("go movetime 125");
    expect(client.calls[0]?.request.commands[0]).toBe("setoption name MultiPV value 1");
  });

  it("enumerates strong-engine candidates without relying on a later restore", async () => {
    const client = new FakeEngineClient(() => [
      "info depth 8 multipv 1 score cp 35 pv c7c5",
      "info depth 8 multipv 2 score cp 20 pv e7e5",
      "info depth 8 multipv 3 score cp 5 pv g8f6",
      "bestmove c7c5",
    ]);
    const selector = new OpponentSelector(client, {
      strongEngineProfile: { multiPv: 1 },
    });

    await expect(selector.enumerate(request("strong_engine"), 3)).resolves.toMatchObject({
      moveUci: "c7c5",
      policyModeApplied: "strong_engine",
      candidates: [
        { moveUci: "c7c5", rank: 1 },
        { moveUci: "e7e5", rank: 2 },
        { moveUci: "g8f6", rank: 3 },
      ],
    });
    expect(client.calls[0]?.request.commands).toEqual([
      "setoption name MultiPV value 3",
      `position fen ${INITIAL_FEN} moves e2e4`,
      "go movetime 100",
    ]);
    expect(client.calls[0]?.request.afterCommands).toBeUndefined();
    expect(client.calls[0]?.request.resetSearchState).toBe(true);
    expect(selector.availableModes()).toEqual([
      "human_common",
      "theory_strict",
      "strong_engine",
    ]);
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
      {
        moveUci: "c7c5",
        mass: 0.1,
        rank: 2,
        scoreCp: 0,
        wdl: { win: 300, draw: 400, loss: 300 },
      },
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
      {
        moveUci: "e7e5",
        mass: 0,
        rank: 1,
        scoreCp: 0,
        wdl: { win: 300, draw: 400, loss: 300 },
      },
      {
        moveUci: "c7c5",
        mass: 0,
        rank: 2,
        scoreCp: 0,
        wdl: { win: 300, draw: 400, loss: 300 },
      },
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
        "setoption name MultiPV value 20",
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

    expect((await httpRequest(handler, "POST", "/runs/seam-run/moves", { uci: "g1f3", at })).status).toBe(200);
    const enumerated = {
      ...selection,
      moveUci: "b8c6",
      policyModeApplied: "enumerated" as const,
      candidates: [{ moveUci: "b8c6", rank: 1, concessionRatio: 0.25 }],
    };
    expect((await httpRequest(handler, "POST", "/runs/seam-run/moves", { selection: enumerated, at })).status).toBe(200);
    expect(readBackReplay(storage.read("seam-run")!.run.events).opponentMoves.at(-1)).toMatchObject({
      moveUci: "b8c6",
      policyModeApplied: "enumerated",
    });
  });
});
