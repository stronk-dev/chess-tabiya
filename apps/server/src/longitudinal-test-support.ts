// TEST-ONLY: bundles the longitudinal worker thread the way `pnpm build` does, so Vitest (which
// executes TypeScript sources) can start the real `worker_threads` executor. Production uses the
// sibling `dist/longitudinal-worker-thread.js` and never imports this module.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildSync } from "esbuild";

let cached: URL | undefined;

export function longitudinalThreadEntryForTests(): URL {
  if (cached !== undefined) return cached;
  const source = resolve(dirname(fileURLToPath(import.meta.url)), "longitudinal-worker-thread.ts");
  const directory = mkdtempSync(join(tmpdir(), "tabiya-longitudinal-thread-"));
  process.once("exit", () => rmSync(directory, { recursive: true, force: true }));
  const outfile = join(directory, "longitudinal-worker-thread.js");
  buildSync({ entryPoints: [source], bundle: true, platform: "node", format: "esm", external: ["typescript"], outfile, logLevel: "silent" });
  cached = pathToFileURL(outfile);
  return cached;
}
