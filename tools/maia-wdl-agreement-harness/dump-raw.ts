// DISPOSABLE research harness — Maia WDL vs human outcome. Not production code.
// Arm 0: dump the raw info lines for a handful of positions so the encoding,
// the frame and the per-mille claim (D236) can be read off the wire directly.
import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";

const FENS = process.argv.slice(2);

async function main(): Promise<void> {
  const supervisor = new EngineSupervisor([
    maiaDockerSpec({ image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE }),
  ]);
  await supervisor.start("maia-5m");
  const health = supervisor.health("maia-5m");
  console.log(JSON.stringify({ identity: health.identity, bandRange: health.bandRange }));
  for (const fen of FENS) {
    const lines = await supervisor.execute("maia-5m", {
      commands: [
        "setoption name Elo value 1600",
        "setoption name Temperature value 0.8",
        "setoption name TopP value 0.92",
        "setoption name MultiPV value 20",
        `position fen ${fen}`,
        "go",
      ],
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: 60_000,
    });
    console.log(`### ${fen}`);
    for (const line of lines) console.log(line);
  }
  await supervisor.shutdown();
}
void main();
