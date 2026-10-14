// D3819 disposable source observer: one guarded instrumentation site, no production file edit.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

mkdirSync(".cache/d3792-inspector-demand", { recursive: true });
let sites = 0;
await build({
  entryPoints: [resolve("tools/d3792-inspector-demand/review-scope.ts")],
  outfile: resolve(".cache/d3792-inspector-demand/review-scope.mjs"),
  bundle: true, platform: "node", format: "esm", external: ["typescript"],
  nodePaths: [resolve("packages/runtime/node_modules")],
  // The observed application loads its normal compiled-location assets/worker. Cache placement
  // must not accidentally point catalogue loaders at an empty .cache/content directory.
  define: { "import.meta.url": JSON.stringify(pathToFileURL(resolve("apps/server/dist/main.js")).href) },
  plugins: [{ name: "d3819-private-review-observation", setup(builder) {
    builder.onLoad({ filter: /\/apps\/server\/src\/service\.ts$/ }, args => {
      let source = readFileSync(args.path, "utf8");
      const before = "    const outcome = packet.subject.outcome;\n    return {\n      run, role, branchId, record, pass, projection, packet,";
      assert.equal(source.split(before).length, 2, "private Review capture anchor changed");
      source = 'import { observeReviewForResearch } from "../../../tools/d3792-inspector-demand/review-observer.js";\n' +
        source.replace(before, "    observeReviewForResearch({ run, role, branchId, principal, projection, packet });\n" + before);
      sites++;
      return { contents: source, loader: "ts", resolveDir: resolve(args.path, "..") };
    });
  } }],
});
assert.equal(sites, 1, "observer must instrument exactly one real service module");
console.log("D3819: guarded private Review observer built; production unchanged");
