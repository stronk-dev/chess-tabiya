// DISPOSABLE D4226: ordinary builds, one controlled source-file difference, no runtime hooks.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { build } from "esbuild";

const path = "packages/runtime/src/evidence-contract.ts";
const original = execFileSync("git", ["show", `130f4973:${path}`], { encoding: "utf8" });
assert(original.includes("const IMMUTABLE_DATA = new WeakSet<object>();"));
const common = { entryPoints: ["tools/d4175-outcome-delivery/compare-verifier.ts"], bundle: true,
  platform: "node", format: "esm", external: ["typescript"], logLevel: "warning" };
await build({ ...common, outfile: ".cache/outcome-delivery-cost/verifier-baseline.mjs",
  plugins: [{ name: "D4226-committed-original-verifier", setup(build) {
    build.onLoad({ filter: /evidence-contract\.ts$/ }, args => {
      assert.equal(args.path, resolve(path)); return { contents: original, loader: "ts" };
    });
  } }] });
await build({ ...common, outfile: ".cache/outcome-delivery-cost/verifier-candidate.mjs" });
