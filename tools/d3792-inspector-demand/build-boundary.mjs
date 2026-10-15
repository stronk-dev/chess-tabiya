// Disposable source experiment: retain the production server's asset resolution when bundled.
// No production file is rewritten and no raw research output is written or committed.
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

mkdirSync(".cache/d3792-inspector-demand", { recursive: true });
await build({
  entryPoints: [resolve("tools/d3792-inspector-demand/review-boundary.ts")],
  outfile: resolve(".cache/d3792-inspector-demand/review-boundary.mjs"),
  bundle: true, platform: "node", format: "esm", external: ["typescript"],
  define: { "import.meta.url": JSON.stringify(pathToFileURL(resolve("apps/server/dist/main.js")).href) },
  logLevel: "warning",
});
