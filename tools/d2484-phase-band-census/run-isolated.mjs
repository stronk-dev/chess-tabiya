import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export function runWithoutMutating({ protectedFile, executable, args = [], node = process.execPath }) {
  const before = readFileSync(protectedFile);
  const result = spawnSync(node, [executable, ...args], { encoding: "utf8" });
  const after = readFileSync(protectedFile);
  if (!before.equals(after)) throw new Error(`research CLI mutated protected prior result: ${protectedFile}`);
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `research CLI exited ${result.status}`);
  return result.stdout;
}

function main() {
  const [protectedFile, executable, ...args] = process.argv.slice(2);
  if (!protectedFile || !executable) throw new Error("usage: run-isolated.mjs <protected-result> <executable> [...args]");
  process.stdout.write(runWithoutMutating({ protectedFile, executable, args }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
