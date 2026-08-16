// DISPOSABLE research harness — does Maia's per-move WDL agree with human outcomes?
// Not production code. Nothing imports it.
//
// Drives the repo's own EngineSupervisor + maiaDockerSpec and reproduces the
// command shape of OpponentSelector#maia (opponent-selector.ts:494-520) exactly.
// It parses the same MultiPV `info` lines candidateLines() parses and keeps the
// two fields that reach SelectionCandidate but no consumer: `score cp` and `wdl`.
//
// Three command shapes, selected by argv[5]:
//   history  — production: `position fen <startFen> moves <history>`, band defaults
//              then `Elo` (the shipped order at HEAD, after 0985fa4).
//   bare     — the same, but `position fen <fen>` with no history. The explorer's
//              unit is the POSITION, so this arm measures what history conditioning
//              costs in commensurability.
//   eloonly  — `Elo` alone, no SelfElo/OppoElo defaults. The control for the
//              regression `engine-layer-capability-audit.md` measured before 0985fa4.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";

interface Position {
  readonly fen: string;
  readonly ply: number;
  readonly phase: string;
  readonly packId: string;
  readonly legalCount: number;
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

// Production defaults (opponent-selector.ts:74-75). R5 measured that neither
// changes any policy or value scalar; both only steer the `bestmove` sample.
const TEMPERATURE = Number(process.env.MAIA_TEMPERATURE ?? "0.8");
const TOP_P = Number(process.env.MAIA_TOPP ?? "0.92");
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
  readonly bestmove: string | null;
} {
  const byMove = new Map<string, Candidate>();
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
  const [, , probeSetPath, outPath, bandsRaw = "1400,1600,1800", arm = "history", limitRaw = "0"] =
    process.argv;
  const positions = (
    JSON.parse(readFileSync(probeSetPath!, "utf8")) as { positions: Position[] }
  ).positions;
  const bands = bandsRaw.split(",").map(Number);
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

  // The shipped band defaults, read off the handshake exactly as #maia does.
  const optionDefault = (name: string) =>
    health.options?.find((item) => item.name === name)?.default;
  const bandDefaults = ["SelfElo", "OppoElo"].flatMap((name) => {
    const value = optionDefault(name);
    return value === undefined ? [] : [`setoption name ${name} value ${value}`];
  });

  let probes = 0;
  const started = Date.now();
  for (const position of chosen) {
    for (const elo of bands) {
      const positionCommand =
        arm === "bare"
          ? `position fen ${position.fen}`
          : `position fen ${position.startFen}${
              position.historyUci.length === 0 ? "" : ` moves ${position.historyUci.join(" ")}`
            }`;
      const lines = await supervisor.execute("maia-5m", {
        commands: [
          // D58 (R5): an Elo-less request inherits the previous request's band,
          // so `Elo` is sent on EVERY probe without exception.
          ...(arm === "eloonly" ? [] : bandDefaults),
          `setoption name Elo value ${elo}`,
          `setoption name Temperature value ${TEMPERATURE}`,
          `setoption name TopP value ${TOP_P}`,
          `setoption name MultiPV value ${MULTIPV}`,
          positionCommand,
          "go",
        ],
        until: (line) => line.startsWith("bestmove "),
        timeoutMs: 60_000,
      });
      const parsed = parse(lines);
      appendFileSync(
        outPath!,
        `${JSON.stringify({
          fen: position.fen,
          packId: position.packId,
          phase: position.phase,
          ply: position.ply,
          legalCount: position.legalCount,
          historyPlies: arm === "bare" ? 0 : position.historyUci.length,
          arm,
          elo,
          bestmove: parsed.bestmove,
          candidates: parsed.candidates,
        })}\n`,
      );
      probes += 1;
      if (probes % 50 === 0) {
        const rate = (Date.now() - started) / probes;
        console.log(`probes=${probes} ${rate.toFixed(0)}ms/probe`);
      }
    }
  }
  console.log(`done arm=${arm} probes=${probes} positions=${chosen.length}`);
  await supervisor.shutdown();
}

void main();
