// DISPOSABLE controlled compiler-file comparison. Production files stay untouched.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { build } from "esbuild";

const path = "packages/runtime/src/candidate-population.ts";
const baseline = execFileSync("git", ["show", `0e5057d0:${path}`], { encoding: "utf8" });
assert(baseline.includes("CANDIDATE_PACKET_COMPILER_VERSION = 7 as const"));
const common = { entryPoints: ["tools/d4175-outcome-delivery/compare-owner.ts"], bundle: true,
  platform: "node", format: "esm", external: ["typescript"], logLevel: "warning" };
let loaded = 0;
await build({ ...common, outfile: ".cache/outcome-delivery-cost/owner-baseline.mjs", plugins: [{ name: "D4224-original-compiler", setup(build) {
  build.onLoad({ filter: /candidate-population\.ts$/ }, args => {
    assert.equal(args.path, resolve(path)); loaded++;
    return { contents: baseline, loader: "ts" };
  });
} }] });
assert.equal(loaded, 1);
await build({ ...common, outfile: ".cache/outcome-delivery-cost/owner-candidate.mjs" });
