// DISPOSABLE research harness — the engine-layer capability audit.
// Not production code. Nothing imports it.
//
// Question: does the shipped `#maia` command order still apply the requested
// band? `engine-request-contract` §8 added `SelfElo`/`OppoElo` at their
// advertised defaults (1500) AFTER `Elo` (opponent-selector.ts:493-506). If the
// pinned image derives its conditioning from SelfElo/OppoElo, the later pair
// overwrites the earlier `Elo` and every selection runs at 1500 while recording
// `eloApplied` as the requested band.
//
// Four arms per position x band, all else identical:
//   elo-only     : setoption Elo <band>                      (R10's shape)
//   shipped      : setoption Elo <band>, SelfElo 1500, OppoElo 1500  (HEAD's shape)
//   elo-last     : SelfElo 1500, OppoElo 1500, setoption Elo <band>
//   self-oppo    : setoption SelfElo <band>, OppoElo <band>
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";

interface Position {
  readonly fen: string;
  readonly phase: string;
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

const TEMPERATURE = 0.8;
const TOP_P = 0.92;
const MULTIPV = 20;

function bandCommands(arm: string, band: number): string[] {
  switch (arm) {
    case "elo-only":
      return [`setoption name Elo value ${band}`];
    case "shipped":
      return [
        `setoption name Elo value ${band}`,
        "setoption name SelfElo value 1500",
        "setoption name OppoElo value 1500",
      ];
    case "elo-last":
      return [
        "setoption name SelfElo value 1500",
        "setoption name OppoElo value 1500",
        `setoption name Elo value ${band}`,
      ];
    case "self-oppo":
      return [
        `setoption name SelfElo value ${band}`,
        `setoption name OppoElo value ${band}`,
      ];
    default:
      throw new Error(`unknown arm ${arm}`);
  }
}

function parse(lines: readonly string[]) {
  const byMove = new Map<string, { uci: string; rank: number; policy: number | null; cp: number | null; wdl: [number, number, number] | null }>();
  let bestmove: string | null = null;
  for (const line of lines) {
    if (line.startsWith("bestmove ")) {
      bestmove = /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line)?.[1] ?? null;
      continue;
    }
    if (!line.startsWith("info ")) continue;
    const rank = /\bmultipv (\d+)\b/.exec(line);
    const move = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line);
    if (rank === null || move === null) continue;
    const policy = /\bpolicy ([0-9]+(?:\.[0-9]+)?(?:e[+-]?\d+)?)\b/i.exec(line);
    const cp = /\bscore cp (-?\d+)\b/.exec(line);
    const wdl = /\bwdl (\d+) (\d+) (\d+)\b/.exec(line);
    byMove.set(move[1]!, {
      uci: move[1]!,
      rank: Number(rank[1]),
      policy: policy === null ? null : Number(policy[1]),
      cp: cp === null ? null : Number(cp[1]),
      wdl: wdl === null ? null : [Number(wdl[1]), Number(wdl[2]), Number(wdl[3])],
    });
  }
  return { candidates: [...byMove.values()].sort((a, b) => a.rank - b.rank), bestmove };
}

async function main(): Promise<void> {
  const [, , probeSetPath, outPath, bandsRaw = "1000,1500,2400", limitRaw = "12"] = process.argv;
  const positions = (JSON.parse(readFileSync(probeSetPath!, "utf8")) as { positions: Position[] }).positions;
  const bands = bandsRaw.split(",").map(Number);
  const limit = Number(limitRaw);
  const chosen = limit > 0 ? positions.slice(0, limit) : positions;
  const arms = ["elo-only", "shipped", "elo-last", "self-oppo"];

  const supervisor = new EngineSupervisor([maiaDockerSpec({ image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE })]);
  await supervisor.start("maia-5m");
  writeFileSync(outPath!, "");

  let probes = 0;
  for (const position of chosen) {
    for (const band of bands) {
      for (const arm of arms) {
        const lines = await supervisor.execute("maia-5m", {
          commands: [
            ...bandCommands(arm, band),
            `setoption name Temperature value ${TEMPERATURE}`,
            `setoption name TopP value ${TOP_P}`,
            `setoption name MultiPV value ${MULTIPV}`,
            `position fen ${position.startFen}${position.historyUci.length === 0 ? "" : ` moves ${position.historyUci.join(" ")}`}`,
            "go",
          ],
          until: (line) => line.startsWith("bestmove "),
          timeoutMs: 60_000,
        });
        const parsed = parse(lines);
        appendFileSync(outPath!, `${JSON.stringify({ fen: position.fen, phase: position.phase, band, arm, ...parsed })}\n`);
        probes += 1;
      }
    }
  }
  console.log(`done probes=${probes} positions=${chosen.length} bands=${bands.join(",")} arms=${arms.join(",")}`);
  await supervisor.shutdown();
}

void main();
