// DISPOSABLE research harness — the engine-layer capability audit.
// Not production code. Nothing imports it.
//
// Question: is a fixed-depth (or fixed-node) `strong_engine` viable inside the
// per-instrument-call budget (design/02-product-shape.md:159-180), and is
// `go movetime` reproducible now that the reset prologue has landed?
//
// It drives the repo's own EngineSupervisor + stockfishPlaySpec and reproduces
// the command shape of OpponentSelector#strongEngine
// (apps/server/src/opponent-selector.ts:551-568) exactly: setoption MultiPV,
// a history-conditioned `position fen <start> moves <history>`, a `go`, and
// `resetSearchState: true` — the prologue the engine-request-contract shipped.
// The only thing varied is the search bound.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { stockfishPlaySpec, DEFAULT_STRONG_ENGINE_PROFILE } from "../../apps/server/src/strong-engine.js";

interface Position {
  readonly packId: string;
  readonly phase: string;
  readonly cell: string;
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

function bestmove(lines: readonly string[]): string | null {
  return (
    lines
      .map((line) => /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line))
      .find((match) => match !== null)?.[1] ?? null
  );
}

function topScore(lines: readonly string[]): { cp: number | null; mate: number | null; depth: number | null } {
  const line = [...lines].reverse().find((candidate) => /\bmultipv 1\b.*\bscore (cp|mate) -?\d+\b/.test(candidate));
  if (line === undefined) return { cp: null, mate: null, depth: null };
  const score = /\bscore (cp|mate) (-?\d+)\b/.exec(line)!;
  const depth = /\bdepth (\d+)\b/.exec(line);
  return {
    cp: score[1] === "cp" ? Number(score[2]) : null,
    mate: score[1] === "mate" ? Number(score[2]) : null,
    depth: depth === null ? null : Number(depth[1]),
  };
}

function nodes(lines: readonly string[]): number | null {
  const line = [...lines].reverse().find((candidate) => /\bnodes (\d+)\b/.test(candidate));
  return line === undefined ? null : Number(/\bnodes (\d+)\b/.exec(line)![1]);
}

async function main(): Promise<void> {
  const [, , probeSetPath, outPath, armsRaw = "movetime:100,depth:8,depth:10,depth:12,depth:14,depth:16,nodes:100000", repeatsRaw = "2"] =
    process.argv;
  const positions = (
    JSON.parse(readFileSync(probeSetPath!, "utf8")) as { positions: Position[] }
  ).positions;
  const arms = armsRaw.split(",").map((value) => {
    const [kind, amount] = value.split(":");
    return { kind: kind!, amount: Number(amount), label: value };
  });
  const repeats = Number(repeatsRaw);

  const supervisor = new EngineSupervisor([stockfishPlaySpec()]);
  await supervisor.start("stockfish-play");
  const health = supervisor.health("stockfish-play");
  writeFileSync(
    `${outPath}.identity.json`,
    `${JSON.stringify({ identity: health.identity, profile: DEFAULT_STRONG_ENGINE_PROFILE, optionCount: health.options?.length ?? 0 }, null, 2)}\n`,
  );
  writeFileSync(outPath!, "");

  let probes = 0;
  for (const position of positions) {
    for (const arm of arms) {
      for (let repeat = 0; repeat < repeats; repeat += 1) {
        const go =
          arm.kind === "movetime"
            ? `go movetime ${arm.amount}`
            : arm.kind === "depth"
              ? `go depth ${arm.amount}`
              : `go nodes ${arm.amount}`;
        const started = process.hrtime.bigint();
        const lines = await supervisor.execute("stockfish-play", {
          commands: [
            `setoption name MultiPV value ${DEFAULT_STRONG_ENGINE_PROFILE.multiPv}`,
            `position fen ${position.startFen}${
              position.historyUci.length === 0 ? "" : ` moves ${position.historyUci.join(" ")}`
            }`,
            go,
          ],
          resetSearchState: true,
          until: (line) => line.startsWith("bestmove "),
          timeoutMs: 300_000,
        });
        const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
        const score = topScore(lines);
        appendFileSync(
          outPath!,
          `${JSON.stringify({
            fen: position.fen,
            packId: position.packId,
            phase: position.phase,
            pieceCount: position.pieceCount,
            legalCount: position.legalUci.length,
            arm: arm.label,
            repeat,
            elapsedMs,
            bestmove: bestmove(lines),
            ...score,
            nodes: nodes(lines),
          })}\n`,
        );
        probes += 1;
        if (probes % 50 === 0) console.log(`probes=${probes}`);
      }
    }
  }
  console.log(`done probes=${probes} positions=${positions.length} arms=${arms.map((arm) => arm.label).join(",")}`);
  await supervisor.shutdown();
}

void main();
