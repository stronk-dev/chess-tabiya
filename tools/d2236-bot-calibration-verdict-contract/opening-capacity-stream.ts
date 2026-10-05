import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import manifest from "./manifest.json";
import { countOpeningCapacity, openingCapacityArtifact, openingCapacityReceipt } from "./opening-capacity.js";

const output = process.argv[2];
if (!output) throw new TypeError("usage: opening-capacity-stream OUTPUT.json");
const artifact = openingCapacityArtifact(await countOpeningCapacity(process.stdin, manifest.humanReference));
const receipt = openingCapacityReceipt(artifact);
await mkdir(dirname(output), { recursive: true });
const temporary = `${output}.${process.pid}.tmp`;
await writeFile(temporary, `${JSON.stringify(artifact)}\n`, { flag: "wx" });
await rename(temporary, output);
console.log(JSON.stringify(receipt, null, 2));
