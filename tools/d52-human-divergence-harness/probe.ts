// DISPOSABLE research harness — D52. Not production code.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";
import { OpponentSelector } from "../../apps/server/src/opponent-selector.js";

import type { MeasurementJob } from "./prepare.js";

async function main(): Promise<void> {
  const jobs = (JSON.parse(readFileSync(process.argv[2]!, "utf8")) as { jobs: MeasurementJob[] }).jobs;
  const outPath = process.argv[3]!;
  writeFileSync(outPath, "");
  const supervisor = new EngineSupervisor([
    maiaDockerSpec({ image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE, transcriptCapacity: 8_192 }),
  ]);
  try {
    const identity = await supervisor.start("maia-5m");
    appendFileSync(outPath, `${JSON.stringify({ kind: "identity", identity, jobs: jobs.length })}\n`);
    const selector = new OpponentSelector(supervisor);
    for (const [index, job] of jobs.entries()) {
      const startedAt = performance.now();
      try {
        const selection = await selector.select({
          startFen: job.startFen,
          historyUci: [...job.historyUci],
          policy: {
            mode: "human_common",
            targetElo: job.band,
            policyConfigDigest: `sha256:${"d".repeat(64)}`,
          },
          seed: index + 1,
        });
        appendFileSync(outPath, `${JSON.stringify({
          kind: "probe",
          job,
          latencyMs: Number((performance.now() - startedAt).toFixed(1)),
          candidates: selection.candidates,
          selectedMoveUci: selection.moveUci,
          engine: selection.engine,
        })}\n`);
      } catch (error) {
        appendFileSync(outPath, `${JSON.stringify({
          kind: "probe",
          job,
          latencyMs: Number((performance.now() - startedAt).toFixed(1)),
          error: error instanceof Error ? error.message : String(error),
        })}\n`);
      }
      if ((index + 1) % 100 === 0) process.stderr.write(`${index + 1}/${jobs.length}\n`);
    }
  } finally {
    await supervisor.shutdown();
  }
}

void main();
