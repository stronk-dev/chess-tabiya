import { existsSync, readFileSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

import { EngineSupervisor, parseEngineOptions } from "./engine-supervisor.js";
import { assertAdvertisedCapabilityDispositions } from "./capabilities.js";
import { OpponentSelector } from "./opponent-selector.js";
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
const strongEngineCorpus = JSON.parse(
  readFileSync(new URL("./fixtures/strong-engine-51.json", import.meta.url), "utf8"),
) as {
  readonly positions: readonly {
    readonly startFen: string;
    readonly historyUci: readonly string[];
    readonly fen: string;
  }[];
};

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

function identitySupervisor(
  advertised: string,
  configured: { readonly name?: string; readonly version?: string; readonly bandOption?: string } = {},
  optionNames: readonly string[] = [],
): EngineSupervisor {
  const optionLines = optionNames.map((name) => `option name ${name} type spin default 1500 min 1100 max 2000`);
  const script = [
    "const r=require('readline').createInterface({input:process.stdin});",
    `r.on('line',l=>{if(l==='uci'){console.log(${JSON.stringify(`id name ${advertised}`)});for(const x of ${JSON.stringify(optionLines)})console.log(x);console.log('uciok')}else if(l==='isready'){console.log('readyok')}else if(l==='quit'){process.exit(0)}});`,
  ].join("");
  return new EngineSupervisor([
    {
      id: "identity-test",
      kind: "judge",
      command: process.execPath,
      args: ["-e", script],
      ...configured,
      restartBackoff: { initialMs: 1, maximumMs: 1, maximumAttempts: 0 },
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

  it("parses the full advertised UCI option contract", () => {
    expect(parseEngineOptions([
      "option name Clear Hash type button",
      "option name Elo type spin default 1500 min 0 max 5000",
      "option name Temperature type string default 1.0",
      "option name Style type combo default Normal var Normal var Risky Attack",
      "option name Ponder type check default false",
    ])).toEqual([
      { name: "Clear Hash", type: "button" },
      { name: "Elo", type: "spin", default: "1500", min: 0, max: 5000 },
      { name: "Temperature", type: "string", default: "1.0" },
      { name: "Style", type: "combo", default: "Normal", vars: ["Normal", "Risky Attack"] },
      { name: "Ponder", type: "check", default: "false" },
    ]);
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
    expect(supervisor.health("stockfish-analysis").options).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Clear Hash", type: "button" }),
      expect.objectContaining({ name: "MultiPV", type: "spin", min: 1 }),
    ]));
    expect(() => assertAdvertisedCapabilityDispositions([
      supervisor.health("stockfish-analysis"),
    ])).not.toThrow();

    const response = await supervisor.execute("stockfish-analysis", {
      commands: ["position startpos", "go depth 2"],
      resetSearchState: true,
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
    const sent = transcript.filter((entry) => entry.direction === "sent").map((entry) => entry.line);
    const reset = sent.lastIndexOf("ucinewgame");
    expect(sent.slice(reset, reset + 5)).toEqual([
      "ucinewgame",
      "setoption name Clear Hash",
      "isready",
      "position startpos",
      "go depth 2",
    ]);

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

  stockfishIt("runs the 51-position reproducibility corpus at the recorded 50000-node bound", async () => {
    const supervisor = stockfishSupervisor();
    supervisors.push(supervisor);
    await supervisor.start("stockfish-analysis");
    const durations: number[] = [];
    expect(strongEngineCorpus.positions).toHaveLength(51);
    for (const [positionIndex, position] of strongEngineCorpus.positions.entries()) {
      const selections = [];
      for (let repeat = 0; repeat < 2; repeat += 1) {
        const selector = new OpponentSelector(supervisor, { strongEngineId: "stockfish-analysis" });
        const started = performance.now();
        selections.push(await selector.select({
          startFen: position.startFen,
          historyUci: position.historyUci,
          policy: {
            mode: "strong_engine" as const,
            policyConfigDigest: `sha256:${"c".repeat(64)}`,
          },
          seed: positionIndex + 1,
        }));
        durations.push(performance.now() - started);
      }
      expect(selections[0]!.moveUci, position.fen).toBe(selections[1]!.moveUci);
      expect(selections[0]!.candidates?.[0]?.scoreCp, position.fen).toBe(selections[1]!.candidates?.[0]?.scoreCp);
      expect(selections[0]!.engine.searchBound).toEqual({ kind: "nodes", value: 50_000 });
      expect(selections[1]!.engine.searchBound).toEqual({ kind: "nodes", value: 50_000 });
    }
    const sent = supervisor.transcript("stockfish-analysis").filter((entry) => entry.direction === "sent");
    expect(sent.some((entry) => entry.line === "go nodes 50000")).toBe(true);
    const ordered = [...durations].sort((left, right) => left - right);
    console.info(
      `STRONG_ENGINE_50000_NODES calls=${durations.length} median=${ordered[Math.floor(ordered.length / 2)]!.toFixed(1)}ms p95=${ordered[Math.floor(ordered.length * 0.95)]!.toFixed(1)}ms max=${ordered.at(-1)!.toFixed(1)}ms over500=${durations.filter((value) => value > 500).length}`,
    );
  }, 30_000);

  it("derives advertised versions without overriding configured identity", async () => {
    const derived = identitySupervisor("Stockfish 17.1", { name: "Stockfish" });
    const pinned = identitySupervisor("Stockfish 17.1", {
      name: "Stockfish",
      version: "pinned",
    });
    const mismatch = identitySupervisor("Lc0 v0.31.2", { name: "Stockfish" });
    const unnamed = identitySupervisor("Lc0 v0.31.2");
    supervisors.push(derived, pinned, mismatch, unnamed);

    await expect(derived.start("identity-test")).resolves.toMatchObject({
      name: "Stockfish",
      version: "17.1",
    });
    await expect(pinned.start("identity-test")).resolves.toMatchObject({
      name: "Stockfish",
      version: "pinned",
    });
    await expect(mismatch.start("identity-test")).resolves.toMatchObject({
      name: "Stockfish",
      version: "unknown",
    });
    expect(mismatch.transcript("identity-test")).toContainEqual(
      expect.objectContaining({ direction: "lifecycle", line: expect.stringContaining("identity mismatch") }),
    );
    await expect(unnamed.start("identity-test")).resolves.toMatchObject({
      name: "Lc0",
      version: "v0.31.2",
    });
  });

  it("publishes whether the configured rating-band option was actually advertised", async () => {
    const honored = identitySupervisor("Maia3 1", { bandOption: "Elo" }, ["Elo"]);
    const absent = identitySupervisor("Fixture 1", { bandOption: "Elo" });
    supervisors.push(honored, absent);
    await expect(honored.start("identity-test")).resolves.toMatchObject({ eloHonored: true });
    await expect(absent.start("identity-test")).resolves.toMatchObject({ eloHonored: false });
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

  stockfishIt("preempts a running search when its evidence job is cancelled", async () => {
    const supervisor = stockfishSupervisor();
    supervisors.push(supervisor);
    await supervisor.start("stockfish-analysis");
    const controller = new AbortController();
    const search = supervisor.execute("stockfish-analysis", {
      commands: ["position startpos", "go infinite"],
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: 15_000,
      signal: controller.signal,
    });
    const deadline = Date.now() + 2_000;
    while (
      !supervisor
        .transcript("stockfish-analysis")
        .some((entry) => entry.direction === "sent" && entry.line === "go infinite")
    ) {
      if (Date.now() >= deadline) throw new Error("Stockfish search did not start");
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    controller.abort();

    await expect(search).rejects.toMatchObject({ name: "AbortError" });
    expect(supervisor.transcript("stockfish-analysis")).toContainEqual(
      expect.objectContaining({ direction: "sent", line: "stop" }),
    );
    expect((await supervisor.checkHealth("stockfish-analysis")).status).toBe("ready");
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
