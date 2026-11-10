// Current literal source contract only; this writes no learner data or historical v1/v2 artifact.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { LONGITUDINAL_INGEST_REGISTRY, LONGITUDINAL_REGISTRY_DIGEST } from "../apps/server/src/longitudinal-registry.js";
const files = [
  ["rfc/contracts/longitudinal-ingest-registry-v3.json", `${JSON.stringify(LONGITUDINAL_INGEST_REGISTRY, null, 2)}\n`],
  ["rfc/contracts/longitudinal-sign-subsets-v3.json", `${JSON.stringify(Object.fromEntries(LONGITUDINAL_INGEST_REGISTRY.map(row => [`${row.projection.id}@${row.projection.version}`, row.signs])), null, 2)}\n`],
] as const;
if (process.argv.includes("--write")) for (const [path, bytes] of files) writeFileSync(path, bytes);
else {
  const stale = files.filter(([path, bytes]) => !existsSync(path) || readFileSync(path, "utf8") !== bytes);
  if (stale.length !== 0) throw Error(`Current longitudinal source artifacts differ: ${stale.map(([path]) => path).join(", ")}; run make longitudinal-registry-update`);
}
console.log(`longitudinal source registry: ${LONGITUDINAL_INGEST_REGISTRY.length} exact rows, ${LONGITUDINAL_REGISTRY_DIGEST}`);
