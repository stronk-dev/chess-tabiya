// Disposable D3722 investigation, not a CI/release gate or a production configuration.
// Uses the installed Vite build/configuration without writing assets or source maps.
import assert from "node:assert/strict";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const web = fileURLToPath(new URL("../", import.meta.url));
// Match the workspace build's working directory as well as its configuration.
process.chdir(web);
const display = (id) => id.startsWith(root) ? relative(root, id) : id;
const area = (id) => id.includes("/packages/runtime/") ? "runtime"
  : id.includes("/packages/schema/") ? "schema"
  : id.includes("/apps/web/src/") ? "web"
  : id.includes("/svelte/") ? "svelte"
  : id.includes("/chessops/") ? "chessops"
  : id.includes("/node_modules/") ? "other_dependencies" : "virtual";
const report = [];
const result = await build({
  root: web,
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  build: { write: false },
  plugins: [{
    name: "d3722-observe-bundle",
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;
        const modules = Object.entries(chunk.modules).map(([id, module]) => {
          assert(Number.isFinite(module.renderedLength) && module.renderedLength >= 0, "bundler must expose rendered module lengths");
          return { id, renderedCharacters: module.renderedLength };
        }).sort((a, b) => b.renderedCharacters - a.renderedCharacters || a.id.localeCompare(b.id));
        const groups = {};
        for (const module of modules) groups[area(module.id)] = (groups[area(module.id)] ?? 0) + module.renderedCharacters;
        report.push({
          file: chunk.fileName, entry: chunk.isEntry,
          moduleCount: modules.length, staticImports: chunk.imports, dynamicImports: chunk.dynamicImports,
          renderedCharactersByArea: groups,
          // Module lengths are not per-module gzip sizes or a measured user latency.
          largestModules: modules.slice(0, 12).map((module) => ({
            module: display(module.id), renderedCharacters: module.renderedCharacters,
            importers: (this.getModuleInfo(module.id)?.importers ?? []).map(display).sort().slice(0, 8),
          })),
        });
      }
    },
  }],
});
assert(report.length > 0 && report.some((chunk) => chunk.entry), "must observe the real entry");
// Other generateBundle hooks may still change code. Measure the final returned
// output, not the intermediate code observed by our dependency-inspection hook.
const outputs = (Array.isArray(result) ? result : [result]).flatMap((output) => output.output);
const chunks = report.map((observed) => {
  const final = outputs.find((output) => output.type === "chunk" && output.fileName === observed.file);
  assert(final?.type === "chunk", `missing final output for ${observed.file}`);
  return { ...observed, bytes: Buffer.byteLength(final.code) };
});
console.log(JSON.stringify({ purpose: "D3722 disposable production-bundle diagnosis", assetsWritten: false, chunks }, null, 2));
