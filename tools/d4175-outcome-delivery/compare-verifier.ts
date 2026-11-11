// DISPOSABLE D4226 ordinary-source comparison, never production policy or an evidence issuer.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CandidatePopulationService } from "../../apps/server/src/candidate-population-service.js";
import { GUIDED_HINT_PROFILE } from "../../apps/server/src/application.js";
import { assertWide, collect, LITERAL_POSITIONS, reviewPositions } from "./workload.js";
import { completeEquality } from "./source-equality.js";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const workload = (smoke: boolean) => smoke ? LITERAL_POSITIONS.slice(0, 2) : reviewPositions();
async function memory(): Promise<NodeJS.MemoryUsage> {
  assert(typeof global.gc === "function");
  for (let i = 0; i < 3; i++) { await new Promise<void>(done => setImmediate(done)); global.gc(); }
  return process.memoryUsage();
}

function sourceStream(service: CandidatePopulationService, positions: ReturnType<typeof workload>) {
  return positions.map(position => {
    const lookup = service.wide(position.fen); assert.equal(lookup.kind, "ready");
    if (lookup.kind !== "ready") throw Error("Actual complete source required");
    assertWide(lookup.receipt); assert(position.move !== null);
    const result = collect(lookup.receipt, position.move);
    return { id: position.id, candidates: lookup.receipt.packet.candidates.length,
      families: result.families.map(({ family, kind, events }) => ({ family, kind, events })) };
  });
}


async function timed(smoke: boolean) {
  const positions = workload(smoke);
  assert.equal(positions.length, smoke ? 2 : 32);
  let service: CandidatePopulationService | undefined = new CandidatePopulationService({ capacity: GUIDED_HINT_PROFILE.packetCapacity });
  const before = await memory(), start = performance.now();
  const rows = sourceStream(service, positions), sourceMs = performance.now() - start;
  const held = await memory(), stats = service.stats(); // Genuine owner remains live through held GC.
  service = undefined;
  const released = await memory();
  assert.equal(stats.retained, rows.length); assert.equal(stats.capacity, GUIDED_HINT_PROFILE.packetCapacity);
  return { sourceMs, stats, sourceSummary: hash(rows), positions: rows.length,
    candidates: rows.reduce((n, row) => n + row.candidates, 0),
    outcomes: rows.reduce((n, row) => n + row.families.reduce((n, family) => n + family.events, 0), 0),
    memory: { before, held, released } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const smoke = process.argv.includes("--smoke");
  if (process.argv.includes("--equality-worker")) process.stdout.write(JSON.stringify(completeEquality(smoke)));
  else if (process.argv.includes("--timing-worker")) process.stdout.write(JSON.stringify(await timed(smoke)));
  else {
    const paths = { baseline: resolve(".cache/outcome-delivery-cost/verifier-baseline.mjs"), candidate: resolve(".cache/outcome-delivery-cost/verifier-candidate.mjs") };
    const run = <T>(variant: keyof typeof paths, mode: string): T => JSON.parse(execFileSync(process.execPath,
      ["--expose-gc", paths[variant], mode, ...(smoke ? ["--smoke"] : [])], { encoding: "utf8", timeout: 60_000, maxBuffer: 128 * 1024 })) as T;
    const baseline = run<ReturnType<typeof completeEquality>>("baseline", "--equality-worker");
    assert.equal(baseline.length, smoke ? 2 : 32);
    const candidate = run<ReturnType<typeof completeEquality>>("candidate", "--equality-worker");
    assert.deepEqual(candidate, baseline, "Complete packet/foundation/outcome payloads and all traversed receipts must match");
    process.stderr.write(`Complete equality matches${baseline.length} actual source decisions before timing.\n`);
    const pairs = [];
    for (let pair = 0; pair < (smoke ? 2 : 4); pair++) {
      const order = pair % 2 === 0 ? ["baseline", "candidate"] as const : ["candidate", "baseline"] as const;
      const samples = {} as Record<keyof typeof paths, Awaited<ReturnType<typeof timed>>>;
      for (const variant of order) samples[variant] = run(variant, "--timing-worker");
      assert.equal(samples.candidate.sourceSummary, samples.baseline.sourceSummary);
      assert.equal(samples.candidate.positions, baseline.length);
      pairs.push({ pair, order, ...samples });
      process.stderr.write(`pair${pair}: baseline${samples.baseline.sourceMs.toFixed(1)}ms/candidate${samples.candidate.sourceMs.toFixed(1)}ms\n`);
    }
    const report = { question: "D4226 ordinary-source bounded-verifier comparison", baselineCommit: "130f4973",
      candidate: "actual current ordinary production-source build,262144 adds per weak generation",
      node: process.version, v8: process.versions.v8, platform: process.platform, architecture: process.arch,
      scope: `same actual${baseline.length}-decision source workload/capacity64; PGN/workload prepared before checkpoints/clock; separate complete-equality workers; ${smoke ? "two smoke counterbalanced pairs" : "four fresh sequential counterbalanced source pairs"}; no WeakRefs/profiler/reset/clear hooks; GC only in explicit before/held/released checkpoints`,
      exclusions: ["natural peak/RSS return", "production API/DOM latency", "complete cache/ownership census", "whole D4224/D4225 or ordinary adoption"],
      equality: baseline, pairs };
    const text = JSON.stringify(report, null, 2) + "\n"; assert(Buffer.byteLength(text) < 48 * 1024);
    if (process.argv.includes("--write")) writeFileSync("planning/foundation-source-identity/bounded-verifier-cost-2026-11-11.json", text);
    else process.stdout.write(text);
  }
}
