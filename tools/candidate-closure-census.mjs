#!/usr/bin/env node
// Candidate packet closure census (rfc/shared-candidate-evidence-packet.md §5.3, §10).
// Governance tool, not production: reports observed prevalence and compile cost over a fixed
// sample. It never defines the closure; the generated projection map does.
//   node tools/candidate-closure-census.mjs [positions.txt]
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const work = mkdtempSync(join(tmpdir(), "candidate-closure-census-"));
try {
  const outfile = join(work, "census.mjs");
  await build({
    entryPoints: [join(root, "tools/candidate-packet-projections/census.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const args = process.argv[2] === undefined ? [] : [resolve(process.argv[2])];
  const run = spawnSync(process.execPath, [outfile, ...args], { stdio: "inherit" });
  process.exitCode = run.status ?? 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
