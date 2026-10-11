// DISPOSABLE research instrument for D3300, not a production projector or narrower evidence path.
// Measure the actual complete semantic population. Raw CPU recordings never leave memory.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Session } from "node:inspector";
import { arch, cpus, loadavg, platform } from "node:os";
import { performance } from "node:perf_hooks";
import { localSemanticEvents } from "@chess-tabiya/runtime";

import { projectObservations, RUNTIME_POPULATION_DEPENDENCIES } from "../apps/server/src/longitudinal-projector.js";
import { OBSERVATION_DERIVATION_REV } from "../apps/server/src/longitudinal-registry.js";
import { sealLongitudinalSourceImageV4 } from "../apps/server/src/longitudinal-source.js";
import { importedRun } from "../apps/server/src/longitudinal-test-fixtures.js";
import { parsePgnMainline } from "../apps/server/src/pgn-import.js";
import { evidenceValueReceipt } from "../packages/runtime/src/evidence-contract.js";

type ProfileNode = { id: number; callFrame: { functionName: string }; children?: number[] };
type Profile = { nodes: ProfileNode[]; samples: number[]; timeDeltas: number[] };

function summarize(profile: Profile) {
  const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
  const parents = new Map<number, number>();
  for (const node of profile.nodes) for (const child of node.children ?? []) parents.set(child, node.id);
  const self = new Map<string, number>(), inclusive = new Map<string, number>();
  let sampledUs = 0;
  profile.samples.forEach((id, index) => {
    const us = profile.timeDeltas[index] ?? 0;
    sampledUs += us;
    const name = nodes.get(id)?.callFrame.functionName || "(anonymous)";
    self.set(name, (self.get(name) ?? 0) + us);
    const seen = new Set<string>();
    for (let current: number | undefined = id; current !== undefined; current = parents.get(current)) {
      const ancestor = nodes.get(current)?.callFrame.functionName || "(anonymous)";
      if (!seen.has(ancestor)) inclusive.set(ancestor, (inclusive.get(ancestor) ?? 0) + us);
      seen.add(ancestor);
    }
  });
  const top = (entries: Map<string, number>) => [...entries].sort((a, b) => b[1] - a[1]).slice(0, 25)
    .map(([functionName, us]) => ({ functionName, sampledMs: us / 1000, share: us / sampledUs }));
  return { sampledMs: sampledUs / 1000, self: top(self), inclusive: top(inclusive) };
}

assert.match(process.version, /^v24\./u, "use the pinned Make toolchain");
assert.equal(RUNTIME_POPULATION_DEPENDENCIES.events, localSemanticEvents, "the instrument must use the production closure");
const pgn = readFileSync("tools/r2-selection-harness/imported-sample.pgn", "utf8");
let moves: string[] | undefined;
for (const game of pgn.split(/\n(?=\[Event )/u)) {
  try {
    const parsed = parsePgnMainline(game, { requireMoves: true });
    if (parsed.moves.length >= 80) { moves = parsed.moves.slice(0, 80).map((move) => move.uci); break; }
  } catch { /* same fixed-corpus selection as the worker performance contract */ }
}
assert(moves, "the retained corpus must contain the real 80-ply performance arm");
if (process.argv[2] === "compare") {
  const baseline = "tools/dist/d3300-projector-before.mjs";
  const rows = [];
  for (const side of ["white", "black"] as const) {
    const samples = [];
    for (const order of [[baseline, process.argv[1]!], [process.argv[1]!, baseline], [baseline, process.argv[1]!], [process.argv[1]!, baseline]]) {
      const pair = order.map((entry) => ({ entry, result: JSON.parse(execFileSync(process.execPath, [entry, "measure", side], {
        encoding: "utf8", timeout: 60_000,
      })) }));
      const before = pair.find((sample) => sample.entry === baseline)!.result;
      const after = pair.find((sample) => sample.entry !== baseline)!.result;
      assert.equal(after.outputDigest, before.outputDigest, "whole projected rows changed");
      assert.equal(after.populationDigest, before.populationDigest, "complete events/receipts changed");
      assert.equal(after.edges, before.edges);
      assert.equal(after.semanticEvents, before.semanticEvents);
      assert.equal(after.decisions, before.decisions);
      samples.push({ beforeMs: before.coldMs, afterMs: after.coldMs, ratio: after.coldMs / before.coldMs });
      console.log(JSON.stringify({ side, ...samples.at(-1), exactRowsEventsAndReceipts: true }));
    }
    rows.push({ side, samples });
  }
  mkdirSync(".cache", { recursive: true });
  writeFileSync(".cache/d3300-projector-comparison.json", `${JSON.stringify({ measuredAt: new Date().toISOString(), rows }, null, 2)}\n`);
  process.exit(0);
}
// Cold means a fresh process, not merely an empty membership cache after warming all readings.
// Separate profiled/unprofiled children prevent profiler overhead being mistaken for latency.
if (process.argv[2] === undefined) {
  const rows = (["white", "black"] as const).map((side) => {
    const measure = JSON.parse(execFileSync(process.execPath, [process.argv[1]!, "measure", side], { encoding: "utf8", timeout: 60_000 }));
    const profile = JSON.parse(execFileSync(process.execPath, [process.argv[1]!, "profile", side], { encoding: "utf8", timeout: 60_000 }));
    const row = { ...measure, profiledMs: profile.profiledMs, cpu: profile.cpu };
    console.log(JSON.stringify({ side, edges: row.edges, semanticEvents: row.semanticEvents,
      coldMs: row.coldMs, warmMs: row.warmMs, uncachedVerificationMs: row.uncachedVerificationMs }));
    return row;
  });
  const report = { purpose: "D3300 full-population CPU measurement, not release proof", measuredAt: new Date().toISOString(),
    derivationRevision: OBSERVATION_DERIVATION_REV,
    node: process.version, platform: platform(), arch: arch(), logicalCpus: cpus().length, loadAverage: loadavg(), rows };
  mkdirSync(".cache", { recursive: true });
  writeFileSync(".cache/d3300-projector-profile.json", `${JSON.stringify(report, null, 2)}\n`);
  console.log("Compact aggregate: .cache/d3300-projector-profile.json; raw CPU profiles discarded.");
  process.exit(0);
}
assert(process.argv[2] === "measure" || process.argv[2] === "profile");
assert(process.argv[3] === "white" || process.argv[3] === "black");
const profiling = process.argv[2] === "profile";
const side = process.argv[3];
const session = new Session();
session.connect();
const post = <T = unknown>(method: string, parameters: object = {}) => new Promise<T>((resolve, reject) => {
  session.post(method, parameters, (error, result) => error ? reject(error) : resolve(result as T));
});
try {
  if (profiling) await post("Profiler.enable");
  const run = importedRun(`d3300-${side}`, moves, side);
  const image = sealLongitudinalSourceImageV4(Object.freeze({ fixture: "D3300 profile" }), {
    runId: run.id, requestedSeq: run.events.length, storedEvents: run.events,
    ownerLearnerId: "profile-owner", structureAttribution: "single_player",
    moveAuthorship: run.events.flatMap((event) => event.type === "move.committed" && event.data.node.actor === "user"
      ? [{ eventSeq: event.seq, nodeId: event.data.node.id, learnerId: "profile-owner" }] : []),
  });
  let edges = 0, events = 0;
  let fingerprinting = false;
  const populationHash = createHash("sha256");
  const dependencies = Object.freeze({ ...RUNTIME_POPULATION_DEPENDENCIES,
    events: (...args: Parameters<typeof RUNTIME_POPULATION_DEPENDENCIES.events>) => {
      const result = localSemanticEvents(...args);
      edges++; events += result?.length ?? 0;
      if (fingerprinting) {
        // Compare actual results, not source files or tracking metadata. No dumps are stored.
        populationHash.update(JSON.stringify({ edge: args, events: result.map((event) => ({
          event, receipt: evidenceValueReceipt(event.evidence),
          inputs: event.derivationInputs.map((input) => evidenceValueReceipt(input)),
        })) }));
      }
      return result;
    },
  });
  if (profiling) await post("Profiler.start");
  let started = performance.now();
  const checkpoints: number[] = [];
  const cold = projectObservations(image, { checkpoint: (done) => checkpoints.push(done), ...(profiling ? { dependencies } : {}) });
  const coldMs = performance.now() - started;
  const profile = profiling ? (await post<{ profile: Profile }>("Profiler.stop")).profile : undefined;
  const warmCheckpoints: number[] = [];
  started = performance.now();
  const warm = projectObservations(image, { checkpoint: (done) => warmCheckpoints.push(done) });
  const warmMs = performance.now() - started;
  started = performance.now();
  edges = 0; events = 0;
  fingerprinting = true;
  const uncached = projectObservations(image, { dependencies });
  const uncachedMs = performance.now() - started;
  assert.equal(JSON.stringify(uncached), JSON.stringify(cold));
  assert.equal(JSON.stringify(warm), JSON.stringify(cold));
  assert.deepEqual(warmCheckpoints, checkpoints);
  assert.equal(checkpoints.length, 40);
  assert(edges > checkpoints.length && events > edges, "a complete real semantic population must actually be collected");
  assert(cold.observations.length > 0 && cold.denominators.length > 0, "do not profile an empty/ineligible history");
  console.log(JSON.stringify({ side, plies: moves.length, decisions: checkpoints.length, edges, semanticEvents: events,
    uncachedVerificationMs: uncachedMs, coldMs, warmMs, rowsByteIdentical: true, checkpointsPreserved: true,
    outputDigest: createHash("sha256").update(JSON.stringify(cold)).digest("hex"), populationDigest: populationHash.digest("hex"),
    ...(profile === undefined ? {} : { profiledMs: coldMs, cpu: summarize(profile) }) }));
} finally { session.disconnect(); }
