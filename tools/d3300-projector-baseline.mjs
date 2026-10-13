// Disposable D3763/D3300 comparison: replace only the structural reader in the existing
// benchmark bundle. No checkout, source rewrite, historical receipt claim or raw recording.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

assert.match(process.version, /^v24\./u, "use the pinned Make toolchain");
const ref = process.argv[2];
assert(ref, "BASELINE_REF must name the committed structural reader");
const commit = execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { encoding: "utf8" }).trim();
const sourcePath = "packages/runtime/src/structure.ts";
const contents = execFileSync("git", ["show", `${commit}:${sourcePath}`], { encoding: "utf8" });
let replaced = false;
await build({
  entryPoints: ["tools/d3300-projector-profile.ts"], bundle: true, platform: "node", format: "esm",
  outfile: "tools/dist/d3300-projector-before.mjs", logLevel: "warning",
  plugins: [{ name: "committed-structural-reader", setup(builder) {
    builder.onLoad({ filter: /\/structure\.ts$/ }, ({ path }) => {
      if (path !== resolve(sourcePath)) return undefined;
      replaced = true;
      return { contents, loader: "ts", resolveDir: dirname(path) };
    });
  } }],
});
assert(replaced, "baseline must load the committed reader, not compare the current reader to itself");
console.log(`Baseline: structural reader from ${commit}; all other modules and benchmark inputs are current.`);
