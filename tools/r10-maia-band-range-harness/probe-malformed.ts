// DISPOSABLE research harness — R10 (Maia's usable `Elo` range).
// Not production code. Companion to probe-sweep.ts: the sweep can only send
// integers, but `targetElo` is typed as an unbounded integer in the schema and
// the request path stringifies whatever it is given. This probe sends the
// non-integer and garbage forms as ordered PAIRS — a known band first, then the
// candidate value — so the recorded digest says whether the engine applied the
// value, ignored it, or reset.
//
// Same command shape as OpponentSelector #maia (opponent-selector.ts:469-499).
import { createHash } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";

interface Position {
  readonly fen: string;
  readonly cell: string;
  readonly legalUci: readonly string[];
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

// Each entry is a two-step sequence: prime with the first value, then send the
// second. Comparing step 2's digest against the pure-band references tells us
// which band actually took effect.
const SEQUENCES: readonly (readonly [string, string])[] = [
  ["1500", "2000.0"],
  ["1500", "1500.5"],
  ["1500", "2000.7"],
  ["1500", "abc"],
  ["1500", ""],
  ["1500", "2e3"],
  ["1500", "+2000"],
  ["1500", " 2000 "],
  ["1500", "0x7d0"],
  ["1500", "NaN"],
  ["1500", "Infinity"],
  ["1500", "9007199254740993"],
];

// Pure references: what each band looks like when requested cleanly.
const REFERENCES: readonly string[] = ["0", "1500", "2000", "5000"];

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function infoDigest(lines: readonly string[]): { digest: string; count: number } {
  const info = lines.filter((line) => line.startsWith("info ") && / pv /u.test(line));
  return { digest: digest(info.join("\n")), count: info.length };
}

async function main(): Promise<void> {
  const probeSetPath = process.argv[2]!;
  const outPath = process.argv[3]!;
  const positionLimit = Number(process.argv[4] ?? "5");

  const positions = (
    JSON.parse(readFileSync(probeSetPath, "utf8")) as { positions: Position[] }
  ).positions.slice(0, positionLimit);

  writeFileSync(outPath, "");
  const supervisor = new EngineSupervisor([
    maiaDockerSpec({
      image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE,
      transcriptCapacity: 8_192,
    }),
  ]);
  const identity = await supervisor.start("maia-5m");
  appendFileSync(outPath, `${JSON.stringify({ kind: "identity", identity })}\n`);

  const run = async (position: Position, raw: string): Promise<{ digest: string; count: number }> => {
    const lines = await supervisor.execute("maia-5m", {
      commands: [
        `setoption name Elo value ${raw}`,
        "setoption name Temperature value 0.8",
        "setoption name TopP value 0.92",
        "setoption name MultiPV value 20",
        `position fen ${position.startFen}${
          position.historyUci.length === 0 ? "" : ` moves ${position.historyUci.join(" ")}`
        }`,
        "go",
      ],
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: 120_000,
    });
    return infoDigest(lines);
  };

  for (const position of positions) {
    for (const reference of REFERENCES) {
      const result = await run(position, reference);
      appendFileSync(
        outPath,
        `${JSON.stringify({ kind: "reference", fen: position.fen, band: reference, ...result })}\n`,
      );
    }
    for (const [prime, candidate] of SEQUENCES) {
      await run(position, prime);
      const result = await run(position, candidate);
      appendFileSync(
        outPath,
        `${JSON.stringify({
          kind: "sequence",
          fen: position.fen,
          prime,
          candidate,
          ...result,
        })}\n`,
      );
    }
  }
  await supervisor.shutdown();
}

void main();
