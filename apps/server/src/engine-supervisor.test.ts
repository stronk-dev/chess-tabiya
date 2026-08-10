import { existsSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

import { EngineSupervisor } from "./engine-supervisor.js";
import {
  engineUnavailable,
  policyModeUnsupported,
  type ServerError,
} from "./errors.js";
import { errorResponse } from "./rest.js";

interface CommandLine {
  readonly command: string;
  readonly args: readonly string[];
}

function stockfishCommand(): CommandLine | undefined {
  const configured = process.env.SF_CMD?.trim();
  if (configured !== undefined && configured !== "") {
    let args: unknown = [];
    try {
      args = JSON.parse(process.env.SF_ARGS ?? "[]");
    } catch (error) {
      throw new Error("SF_ARGS must be a JSON array of strings", { cause: error });
    }
    if (!Array.isArray(args) || args.some((value) => typeof value !== "string")) {
      throw new Error("SF_ARGS must be a JSON array of strings");
    }
    return { command: configured, args: args as string[] };
  }

  for (const candidate of [
    "/usr/games/stockfish",
    "/opt/homebrew/bin/stockfish",
    "/usr/local/bin/stockfish",
  ]) {
    if (existsSync(candidate)) return { command: candidate, args: [] };
  }

  return undefined;
}

const stockfish = stockfishCommand();
if (stockfish === undefined) {
  const warning =
    "⚠ ENGINE TESTS SKIPPED: install Stockfish or set SF_CMD/JSON SF_ARGS";
  if (process.env.ENGINES_REQUIRED === "1") throw new Error(warning);
  console.warn(`\n${warning}\n`);
}
const stockfishIt = stockfish === undefined ? it.skip : it;

function stockfishSupervisor(
  overrides: Partial<ConstructorParameters<typeof EngineSupervisor>[0][number]> = {},
): EngineSupervisor {
  if (stockfish === undefined) throw new Error("Stockfish test was not skipped");
  return new EngineSupervisor([
    {
      id: "stockfish-analysis",
      kind: "judge",
      command: stockfish.command,
      args: stockfish.args,
      options: { Threads: 1, Hash: 16 },
      transcriptCapacity: 64,
      handshakeTimeoutMs: 15_000,
      restartBackoff: { initialMs: 20, maximumMs: 100, maximumAttempts: 3 },
      ...overrides,
    },
  ]);
}

async function waitForReady(
  supervisor: EngineSupervisor,
  timeoutMs = 15_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (supervisor.health("stockfish-analysis").status === "ready") return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(
    `Stockfish did not restart: ${JSON.stringify(supervisor.health("stockfish-analysis"))}`,
  );
}

describe("UCI engine supervisor", () => {
  const supervisors: EngineSupervisor[] = [];

  afterEach(async () => {
    await Promise.all(supervisors.splice(0).map((supervisor) => supervisor.shutdown()));
  });

  stockfishIt("handshakes, warms, configures, identifies, queries, and shuts down real Stockfish", async () => {
    const supervisor = stockfishSupervisor({
      modelId: "test-nnue-identity",
      containerDigest: `sha256:${"0".repeat(64)}`,
    });
    supervisors.push(supervisor);

    const identity = await supervisor.start("stockfish-analysis");
    expect(identity).toMatchObject({
      id: "stockfish-analysis",
      kind: "judge",
      name: "Stockfish",
      modelId: "test-nnue-identity",
      containerDigest: `sha256:${"0".repeat(64)}`,
      seedHonored: false,
    });
    expect(identity.version).not.toBe("unknown");

    const response = await supervisor.execute("stockfish-analysis", {
      commands: ["position startpos", "go depth 2"],
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: 15_000,
    });
    expect(response.at(-1)).toMatch(/^bestmove [a-h][1-8][a-h][1-8]/);
    expect(await supervisor.checkHealth("stockfish-analysis")).toMatchObject({
      status: "ready",
      identity,
    });

    const transcript = supervisor.transcript("stockfish-analysis");
    expect(transcript.length).toBeLessThanOrEqual(64);
    expect(transcript).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ direction: "sent", line: "uci" }),
        expect.objectContaining({
          direction: "sent",
          line: "setoption name Threads value 1",
        }),
        expect.objectContaining({ direction: "received", line: "uciok" }),
      ]),
    );

    for (let index = 0; index < 40; index += 1) {
      await supervisor.checkHealth("stockfish-analysis");
    }
    const boundedTranscript = supervisor.transcript("stockfish-analysis");
    expect(boundedTranscript).toHaveLength(64);
    expect(boundedTranscript).not.toContainEqual(
      expect.objectContaining({ direction: "sent", line: "uci" }),
    );

    await supervisor.shutdown();
    expect(supervisor.health("stockfish-analysis").status).toBe("stopped");
  });

  stockfishIt("restarts real Stockfish with backoff after an unexpected exit", async () => {
    const supervisor = stockfishSupervisor();
    supervisors.push(supervisor);
    await supervisor.start("stockfish-analysis");

    await expect(
      supervisor.execute("stockfish-analysis", {
        commands: ["quit"],
        until: () => false,
        timeoutMs: 2_000,
      }),
    ).rejects.toMatchObject({ code: "ENGINE_UNAVAILABLE" });

    await waitForReady(supervisor);
    expect(supervisor.health("stockfish-analysis")).toMatchObject({
      status: "ready",
      restartCount: 1,
    });
    expect(await supervisor.checkHealth("stockfish-analysis")).toMatchObject({
      status: "ready",
    });
  });
});

describe("engine error contract", () => {
  it("maps unavailable and unsupported-policy errors without silent fallback", async () => {
    const unavailable = engineUnavailable("maia-1800", 750);
    expect(unavailable).toMatchObject({
      code: "ENGINE_UNAVAILABLE",
      details: { engineId: "maia-1800", retryAfterMs: 750 },
    });
    const unavailableResponse = errorResponse(unavailable);
    expect(unavailableResponse.status).toBe(503);
    expect(await unavailableResponse.json()).toEqual({
      error: {
        code: "ENGINE_UNAVAILABLE",
        message: "Engine unavailable: maia-1800",
        engineId: "maia-1800",
        retryAfterMs: 750,
      },
    });

    const unsupported = policyModeUnsupported("plan_defense");
    expect(unsupported).toMatchObject({ code: "POLICY_MODE_UNSUPPORTED" });
    const unsupportedResponse = errorResponse(unsupported);
    expect(unsupportedResponse.status).toBe(422);
    expect(await unsupportedResponse.json()).toMatchObject({
      error: {
        code: "POLICY_MODE_UNSUPPORTED",
        policyMode: "plan_defense",
      },
    });
  });

  it("returns ENGINE_UNAVAILABLE with a retry hint when spawn fails", async () => {
    const supervisor = new EngineSupervisor([
      {
        id: "missing-engine",
        kind: "judge",
        command: "definitely-not-a-real-engine-binary",
        restartBackoff: { initialMs: 7, maximumMs: 7, maximumAttempts: 0 },
      },
    ]);
    try {
      await expect(supervisor.start("missing-engine")).rejects.toMatchObject({
        code: "ENGINE_UNAVAILABLE",
        details: { engineId: "missing-engine", retryAfterMs: 7 },
      } satisfies Partial<ServerError>);
    } finally {
      await supervisor.shutdown();
    }
  });
});
