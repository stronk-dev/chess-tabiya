// Disposable D3406/D2236 offline sampling. Publishing occurs only after source/capacity checks.
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import manifest from "./manifest.json";
import { validateManifest } from "./contract.mjs";
import { assertReference, digest, selectReference } from "./population.js";

validateManifest(manifest);
const output = process.argv[2];
if (!output) throw new TypeError("usage: extract-stream OUTPUT.json");
const result = await selectReference(process.stdin, manifest.humanReference);
assertReference(result, manifest.humanReference.decompressedSha256);
const populationDigest = digest(JSON.stringify(result.rows));
const artifact = {
  schema: "tabiya.research.bot-human-reference-population.v1",
  manifestDigest: digest(JSON.stringify(manifest)),
  source: manifest.humanReference,
  populationDigest,
  ...result,
  state: "selected_not_evaluated",
};
await mkdir(dirname(output), { recursive: true });
const temporary = `${output}.${process.pid}.tmp`;
await writeFile(temporary, `${JSON.stringify(artifact, null, 2)}\n`, { flag: "wx" });
await rename(temporary, output);
console.log(JSON.stringify({ state: artifact.state, populationDigest, ...result, rows: undefined }, null, 2));
