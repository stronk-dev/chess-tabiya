// DISPOSABLE D4018 predecessor fixture capture. Not used by production or permanent tests.
// Run only through the pinned Make target. Retain the small JSON, not this extraction/bundle.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { build } from "esbuild";

assert.equal(process.version, "v24.22.1");
const commit = "48a6e0f5175a47e65b48a4fc8823940db0980102";
const directory = mkdtempSync(join(tmpdir(), "tabiya-d4018-predecessor-"));
try {
  const archive = execFileSync("git", ["archive", commit, "apps/server/src", "packages/runtime", "packages/schema", "schemas", "tsconfig.base.json"], { maxBuffer: 40 * 1024 * 1024 });
  execFileSync("tar", ["-x", "-C", directory], { input: archive });
  symlinkSync(resolve("node_modules"), join(directory, "node_modules"), "dir");
  for (const root of ["packages/runtime", "packages/schema", "apps/server"]) symlinkSync(resolve(root, "node_modules"), join(directory, root, "node_modules"), "dir");
  const registry = readFileSync(join(directory, "apps/server/src/longitudinal-registry.ts"), "utf8");
  assert.match(registry, /OBSERVATION_DERIVATION_REV = 5 as const/u);
  const catalogue = readFileSync(join(directory, "packages/runtime/src/evidence-catalog.ts"), "utf8");
  assert(catalogue.includes("...BREADTH_EVENT_PROJECTION_IDS, ...SEMANTIC_WAVE_EVENT_PROJECTION_IDS"));
  const input = `
import assert from "node:assert/strict";
import { positionRun, play } from "./apps/server/src/longitudinal-test-fixtures.js";
import { projectObservations } from "./apps/server/src/longitudinal-projector.js";
import { sealLongitudinalSourceImageV4 } from "./apps/server/src/longitudinal-source.js";
import { LONGITUDINAL_INGEST_REGISTRY, OBSERVATION_DERIVATION_REV } from "./apps/server/src/longitudinal-registry.js";
assert.equal(OBSERVATION_DERIVATION_REV, 5);
assert.equal(LONGITUDINAL_INGEST_REGISTRY.length, 67);
const configurations = [
  ["material-white", "4k3/8/8/8/8/8/n7/R3K3 w - - 0 1", "a1a2", "white"],
  ["material-black", "r3k3/N7/8/8/8/8/8/4K3 b - - 0 1", "a8a7", "black"],
  ["exposure-white", "rn2k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6", "white"],
  ["exposure-black", "3k3r/8/8/8/5b2/6N1/8/3K2BR b - - 0 1", "f4g3", "black"],
  ["unavailable-alternative", "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6", "white"],
];
const fixtures = configurations.map(([name, fen, uci, side]) => {
  const run = play(positionRun("successor-" + name, fen, side), uci);
  const image = sealLongitudinalSourceImageV4(Object.freeze({ predecessor: true }), {
    runId: run.id, requestedSeq: run.events.length, storedEvents: run.events,
    ownerLearnerId: "successor-owner", structureAttribution: "single_player",
    moveAuthorship: run.events.flatMap(event => event.type === "move.committed" && event.data.node.actor === "user"
      ? [{ eventSeq: event.seq, nodeId: event.data.node.id, learnerId: "successor-owner" }] : []),
  });
  const projection = projectObservations(image);
  const expected = name.startsWith("material") ? "derived.material.event.role_asymmetry" : "derived.tactic.defender_exposure";
  assert(projection.observations.some(row => row.projectionId === expected && row.projectionVersion === 1 && row.occurred > 0), name + " must contain the actual predecessor observation");
  assert(projection.observations.some(row => row.projectionId !== expected), name + " must retain unaffected observations");
  return { name, run, projection };
});
console.log(JSON.stringify({ sourceCommit: ${JSON.stringify(commit)}, derivationRevision: 5, fixtures }, null, 2));
`;
  const outfile = join(directory, "capture.mjs");
  const alias = {};
  for (const name of ["runtime", "schema"]) {
    const root = join(directory, "packages", name);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    for (const [entry, path] of Object.entries(pkg.exports)) alias[`@chess-tabiya/${name}${entry === "." ? "" : entry.slice(1)}`] = resolve(root, path);
  }
  await build({ stdin: { contents: input, resolveDir: directory, loader: "ts" }, absWorkingDir: directory,
    bundle: true, platform: "node", format: "esm", outfile, logLevel: "warning",
    alias });
  const output = execFileSync(process.execPath, [outfile], { cwd: directory, encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  const fixture = JSON.parse(output);
  assert.equal(fixture.fixtures.length, 5);
  const destination = "apps/server/src/fixtures/longitudinal-successor-rev5.json";
  writeFileSync(destination, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`Captured ${fixture.fixtures.length} authentic revision-5 projections from ${commit}; ${Buffer.byteLength(output)} JSON bytes.`);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
