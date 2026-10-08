import { afterEach, describe, expect, it, vi } from "vitest";

import { digestEngineBinary, digestEngineOptionImage, providerUtf8 } from "@chess-tabiya/runtime";

import { EngineSupervisor, type EngineArtifactProbe } from "./engine-supervisor.js";

/**
 * A scripted UCI engine: logs every command it receives on stderr-free stdout lines prefixed
 * `info string got`, answers go with a fixed line, and (optionally) never answers isready after a
 * search so the reset fails.
 */
function engineScript(options: { readonly hangAfterSearch?: boolean } = {}): string {
  return [
    "const r=require('readline').createInterface({input:process.stdin});let searched=false;",
    "r.on('line',l=>{",
    "if(l==='uci'){console.log('id name Fixture 1');console.log('option name MultiPV type spin default 1 min 1 max 500');console.log('uciok')}",
    `else if(l==='isready'){if(!(searched&&${options.hangAfterSearch === true}))console.log('readyok')}`,
    "else if(l.startsWith('go')){searched=true;console.log('info depth 3 multipv 1 score cp 12 pv e2e4');console.log('bestmove e2e4')}",
    "else if(l==='quit'){process.exit(0)}",
    "else{console.log('info string got '+l)}",
    "});",
  ].join("");
}

const probe: EngineArtifactProbe = async () => ({ kind: "binary", binaryDigest: digestEngineBinary(providerUtf8("fixture executable")) });

describe("engine supervisor provider exchange (§3 same-exchange capture)", () => {
  const supervisors: EngineSupervisor[] = [];
  afterEach(async () => { await Promise.all(supervisors.splice(0).map((supervisor) => supervisor.shutdown())); });

  const supervisor = (script: string, artifactProbe: EngineArtifactProbe | null = probe) => {
    const value = new EngineSupervisor([{ id: "stockfish-analysis", kind: "judge", command: process.execPath, args: ["-e", script], options: { Threads: 1 }, restartBackoff: { initialMs: 1, maximumMs: 1, maximumAttempts: 3 } }], artifactProbe === null ? {} : { artifactProbe });
    supervisors.push(value);
    return value;
  };

  it("does not spawn when an artifact probe completes after shutdown", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let entered!: () => void;
    const probing = new Promise<void>((resolve) => { entered = resolve; });
    const engines = supervisor(engineScript(), async (spec) => { entered(); await gate; return probe(spec); });
    const started = engines.start("stockfish-analysis").then(() => "ready", () => "cancelled");
    await probing;
    await engines.shutdown();
    release();
    expect(await started).toBe("cancelled");
    // Let the released probe's continuation run before asserting absence of a late spawn.
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(engines.health("stockfish-analysis").status).toBe("stopped");
    expect(engines.establishedGeneration("stockfish-analysis")).toBeNull();
    expect(engines.transcript("stockfish-analysis").some(({ line }) => line.startsWith("spawn "))).toBe(false);
  });

  it("settles cancellation without waiting for a stalled probe and isolates a new startup", async () => {
    let releaseFirst!: () => void;
    let releaseSecond!: () => void;
    const first = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const second = new Promise<void>((resolve) => { releaseSecond = resolve; });
    let calls = 0;
    let entered!: () => void;
    const probing = new Promise<void>((resolve) => { entered = resolve; });
    const engines = supervisor(engineScript(), async (spec) => {
      entered();
      await (++calls === 1 ? first : second);
      return probe(spec);
    });
    let cancelled = false;
    const old = engines.start("stockfish-analysis").then(() => false, (error: unknown) => {
      expect(error).toMatchObject({ code: "ENGINE_UNAVAILABLE" });
      cancelled = true;
      return true;
    });
    try {
      await probing;
      await engines.shutdown();
      expect(cancelled).toBe(true);
      const next = engines.start("stockfish-analysis");
      releaseFirst();
      expect(await old).toBe(true);
      await new Promise<void>((resolve) => setImmediate(resolve));
      const shared = engines.start("stockfish-analysis");
      releaseSecond();
      const [a, b] = await Promise.all([next, shared]);
      expect(a).toEqual(b);
      expect(calls).toBe(2);
      expect(engines.establishedGeneration("stockfish-analysis")).toBe(1);
      expect(engines.transcript("stockfish-analysis").filter(({ line }) => line.startsWith("spawn "))).toHaveLength(1);
    } finally {
      releaseFirst();
      releaseSecond();
      await old;
    }
  });

  it.each(["execute", "exchange"] as const)("refuses a queued %s accepted before shutdown without respawning", async (operation) => {
    const engines = supervisor(engineScript());
    const request = { commands: ["go depth 3"], resetCommands: ["ucinewgame"], until: (line: string) => line.startsWith("bestmove"), timeoutMs: 1_000 };
    const result = engines[operation]("stockfish-analysis", request).then(() => "completed", () => "cancelled");
    await engines.shutdown();
    expect(await result).toBe("cancelled");
    expect(engines.health("stockfish-analysis").status).toBe("stopped");
    expect(engines.transcript("stockfish-analysis").some(({ line }) => line.startsWith("spawn "))).toBe(false);
  });

  it.each(["execute", "exchange"] as const)("cancels an active and queued %s without resetting or restarting the stopped child", async (operation) => {
    const engines = supervisor(engineScript().replace("console.log('bestmove e2e4')", "console.log('search-held')"));
    await engines.start("stockfish-analysis");
    const request = { commands: ["go depth 3"], resetCommands: ["ucinewgame"], until: (line: string) => line.startsWith("bestmove"), timeoutMs: 1_000 };
    const active = engines[operation]("stockfish-analysis", request).then(() => "completed", () => "cancelled");
    const queued = engines[operation]("stockfish-analysis", request).then(() => "completed", () => "cancelled");
    await vi.waitFor(() => expect(engines.transcript("stockfish-analysis").some(({ line }) => line === "search-held")).toBe(true));
    await engines.shutdown();
    expect(await Promise.all([active, queued])).toEqual(["cancelled", "cancelled"]);
    expect(engines.health("stockfish-analysis").status).toBe("stopped");
    expect(engines.transcript("stockfish-analysis").filter(({ direction }) => direction === "sent").map(({ line }) => line)).toEqual(["uci", "setoption name Threads value 1", "isready", "go depth 3", "quit"]);
    expect(engines.transcript("stockfish-analysis").some(({ line }) => line.startsWith("restart scheduled"))).toBe(false);
  });

  it("coalesces shutdown and refuses startup while the child is draining", async () => {
    // The engine deliberately retains the pipe after quit until the test's next event turn.
    const engines = supervisor(engineScript().replace("process.exit(0)", "setTimeout(()=>process.exit(0),20)"));
    await engines.start("stockfish-analysis");
    const a = engines.shutdown();
    const b = engines.shutdown();
    const during = engines.start("stockfish-analysis").then(() => "ready", () => "cancelled");
    expect(await during).toBe("cancelled");
    await Promise.all([a, b]);
    expect(engines.health("stockfish-analysis").status).toBe("stopped");
    expect(engines.transcript("stockfish-analysis").filter(({ line }) => line === "quit")).toHaveLength(1);
    await engines.start("stockfish-analysis");
    expect(engines.establishedGeneration("stockfish-analysis")).toBe(2);
    await engines.shutdown();
    expect(await engines.execute("stockfish-analysis", { commands: ["isready"], until: (line) => line === "readyok" })).toEqual(["readyok"]);
    expect(engines.establishedGeneration("stockfish-analysis")).toBe(3);
  });

  it("cancels an in-flight handshake without publishing ready or scheduling a restart", async () => {
    const engines = supervisor(engineScript().replace("console.log('uciok')", "console.log('handshake-held')"));
    const result = engines.start("stockfish-analysis").then(() => "ready", () => "cancelled");
    await vi.waitFor(() => expect(engines.transcript("stockfish-analysis").some(({ line }) => line === "handshake-held")).toBe(true));
    await engines.shutdown();
    expect(await result).toBe("cancelled");
    expect(engines.health("stockfish-analysis").status).toBe("stopped");
    expect(engines.establishedGeneration("stockfish-analysis")).toBeNull();
    expect(engines.transcript("stockfish-analysis").some(({ line }) => line.startsWith("restart scheduled"))).toBe(false);
  });

  it("captures generation, identity, handshake option image, artifact and the task transcript in one task", async () => {
    const engines = supervisor(engineScript());
    const capture = await engines.exchange("stockfish-analysis", { commands: ["position fen 8/8/8/8/8/8/8/K6k w - - 0 1", "go depth 3"], resetCommands: ["setoption name MultiPV value 1"], until: (line) => line.startsWith("bestmove"), timeoutMs: 5_000 });
    expect(capture.generation).toBe(1);
    expect(capture.identity).toMatchObject({ id: "stockfish-analysis", name: "Fixture", version: "1" });
    expect(capture.optionImage).toEqual({ advertisedUciOptionLines: ["option name MultiPV type spin default 1 min 1 max 500"], appliedSetoptionCommands: ["setoption name Threads value 1"] });
    expect(capture.optionImageDigest).toBe(digestEngineOptionImage(capture.optionImage));
    expect(capture.artifact).toEqual({ kind: "binary", binaryDigest: digestEngineBinary(providerUtf8("fixture executable")) });
    expect(capture.transcript).toEqual([
      "> position fen 8/8/8/8/8/8/8/K6k w - - 0 1",
      "> go depth 3",
      "< info string got position fen 8/8/8/8/8/8/8/K6k w - - 0 1",
      "< info depth 3 multipv 1 score cp 12 pv e2e4",
      "< bestmove e2e4",
    ]);
    expect(engines.transcript("stockfish-analysis").map((entry) => entry.line)).toContain("setoption name MultiPV value 1");
    expect(engines.establishedGeneration("stockfish-analysis")).toBe(1);
  });

  it("retires a generation whose finally-reset fails, so the next exchange runs under a new generation", async () => {
    const engines = supervisor(engineScript({ hangAfterSearch: true }));
    await expect(engines.exchange("stockfish-analysis", { commands: ["go depth 3"], resetCommands: ["setoption name MultiPV value 1"], until: (line) => line.startsWith("bestmove"), timeoutMs: 5_000 })).rejects.toThrow();
    expect(engines.establishedGeneration("stockfish-analysis")).not.toBe(1);
    const deadline = Date.now() + 10_000;
    while (engines.establishedGeneration("stockfish-analysis") === null && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 20));
    expect(engines.establishedGeneration("stockfish-analysis")).toBe(2);
  }, 20_000);

  it("reports no artifact when none is captured, and an aborted exchange never returns a capture", async () => {
    const engines = supervisor(engineScript(), null);
    const capture = await engines.exchange("stockfish-analysis", { commands: ["go depth 3"], resetCommands: [], until: (line) => line.startsWith("bestmove"), timeoutMs: 5_000 });
    expect(capture.artifact).toBeNull();
    const controller = new AbortController();
    controller.abort();
    await expect(engines.exchange("stockfish-analysis", { commands: ["go depth 3"], resetCommands: [], until: (line) => line.startsWith("bestmove"), timeoutMs: 5_000, signal: controller.signal })).rejects.toThrow(/aborted/u);
  });
});
