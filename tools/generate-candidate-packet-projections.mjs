#!/usr/bin/env node
// Generator/checker for packages/runtime/src/candidate-population-projections.generated.ts
// (rfc/shared-candidate-evidence-packet.md §12 row 1a). Governance tool, not production.
//   node tools/generate-candidate-packet-projections.mjs          # rewrite the generated file
//   node tools/generate-candidate-packet-projections.mjs --check  # fail on any byte drift
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "packages/runtime/src/candidate-population-projections.generated.ts");
const work = mkdtempSync(join(tmpdir(), "candidate-packet-projections-"));
try {
  const outfile = join(work, "derive.mjs");
  await build({
    entryPoints: [join(root, "tools/candidate-packet-projections/derive.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const { renderCandidatePacketProjections } = await import(pathToFileURL(outfile).href);
  const rendered = renderCandidatePacketProjections();
  if (process.argv.includes("--check")) {
    const current = readFileSync(target, "utf8");
    if (current !== rendered) {
      console.error(`${target} is stale: regenerate with node tools/generate-candidate-packet-projections.mjs`);
      process.exitCode = 1;
    } else console.log("candidate packet projections: generated file matches the compiled manifest");
  } else {
    writeFileSync(target, rendered);
    console.log(`wrote ${target}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
