import { afterEach, describe, expect, it } from "vitest";

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
