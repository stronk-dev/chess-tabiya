// DISPOSABLE research harness — the engine-layer capability audit.
// Not production code. Nothing imports it.
//
// Question: what does Maia put on the wire that `candidateLines()`
// (apps/server/src/opponent-selector.ts:234-256) throws away?
//
// It drives the repo's own EngineSupervisor + maiaDockerSpec and reproduces the
// command shape of OpponentSelector#maia (opponent-selector.ts:482-520) exactly:
// setoption Elo / SelfElo / OppoElo / Temperature / TopP / MultiPV, a
// history-conditioned `position fen <start> moves <history>`, and a bare `go`.
// It parses the SAME info lines the shipped selector parses; the only difference
// is that it keeps `score cp` and `wdl` instead of discarding them.
//
// D58 (R5): an Elo-less request inherits the previous request's band, so `Elo`
// is sent on EVERY probe without exception.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";

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

// Production defaults (opponent-selector.ts:74-75).
const TEMPERATURE = Number(process.env.MAIA_TEMPERATURE ?? "0.8");
const TOP_P = Number(process.env.MAIA_TOPP ?? "0.92");
// R5/R10: the engine's advertised MultiPV maximum, and the width at which the
// listed policy mass is maximal. Widening the window changes no scalar.
const MULTIPV = 20;

interface Candidate {
  readonly uci: string;
  readonly rank: number;
  readonly policy: number | null;
  readonly cp: number | null;
  readonly wdl: readonly [number, number, number] | null;
}

function parse(lines: readonly string[]): {
  readonly candidates: Candidate[];
  readonly infoCount: number;
  readonly bestmove: string | null;
} {
  const byMove = new Map<string, Candidate>();
  let infoCount = 0;
  let bestmove: string | null = null;
  for (const line of lines) {
    if (line.startsWith("bestmove ")) {
      bestmove = /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line)?.[1] ?? null;
      continue;
    }
    if (!line.startsWith("info ")) continue;
    // Exactly the two fields candidateLines() requires (opponent-selector.ts:238-240).
    const rank = /\bmultipv (\d+)\b/.exec(line);
    const move = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line);
    if (rank === null || move === null) continue;
    infoCount += 1;
    const policy = /\bpolicy ([0-9]+(?:\.[0-9]+)?(?:e[+-]?\d+)?)\b/i.exec(line);
    // The two fields candidateLines() never looks at.
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
  return {
    candidates: [...byMove.values()].sort((left, right) => left.rank - right.rank),
    infoCount,
    bestmove,
  };
}

async function main(): Promise<void> {
  const [, , probeSetPath, outPath, bandsRaw = "1000,1500,1900,2400", limitRaw = "0"] =
    process.argv;
  const positions = (
    JSON.parse(readFileSync(probeSetPath!, "utf8")) as { positions: Position[] }
  ).positions;
  const bands = bandsRaw.split(",").map((value) => Number(value));
  const limit = Number(limitRaw);
  const chosen = limit > 0 ? positions.slice(0, limit) : positions;

  const supervisor = new EngineSupervisor([
    maiaDockerSpec({ image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE }),
  ]);
  await supervisor.start("maia-5m");
  const health = supervisor.health("maia-5m");
  writeFileSync(
    `${outPath}.identity.json`,
    `${JSON.stringify({ identity: health.identity, options: health.options, bandRange: health.bandRange }, null, 2)}\n`,
  );
  writeFileSync(outPath!, "");

  let probes = 0;
  for (const position of chosen) {
    for (const elo of bands) {
      const started = process.hrtime.bigint();
      const lines = await supervisor.execute("maia-5m", {
        commands: [
          // `Elo` ONLY. probe-band-order.ts measured that the shipped order —
          // `Elo` followed by `SelfElo`/`OppoElo` at their advertised default
          // 1500 (opponent-selector.ts:493-500) — pins every request to 1500,
          // because `Elo` is an alias for the pair. Sending the pair here would
          // measure band 1500 four times over.
          `setoption name Elo value ${elo}`,
          `setoption name Temperature value ${TEMPERATURE}`,
          `setoption name TopP value ${TOP_P}`,
          `setoption name MultiPV value ${MULTIPV}`,
          `position fen ${position.startFen}${
            position.historyUci.length === 0 ? "" : ` moves ${position.historyUci.join(" ")}`
          }`,
          "go",
        ],
        until: (line) => line.startsWith("bestmove "),
        timeoutMs: 60_000,
      });
      const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
      const parsed = parse(lines);
      appendFileSync(
        outPath!,
        `${JSON.stringify({
          fen: position.fen,
          packId: position.packId,
          phase: position.phase,
          cell: position.cell,
          pieceCount: position.pieceCount,
          legalCount: position.legalUci.length,
          elo,
          elapsedMs,
          infoCount: parsed.infoCount,
          bestmove: parsed.bestmove,
          candidates: parsed.candidates,
        })}\n`,
      );
      probes += 1;
      if (probes % 20 === 0) console.log(`probes=${probes}`);
    }
  }
  console.log(`done probes=${probes} positions=${chosen.length} bands=${bands.join(",")}`);
  await supervisor.shutdown();
}

void main();
