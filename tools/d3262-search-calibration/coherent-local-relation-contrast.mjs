// Corrected-frame local target contrast. This is a bounded counterfactual
// comparison of declared relations, not a move grade or search proof.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { compileLocalRelationContrast } from "./local-relation-contrast.mjs";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-immediate-and-witness.json"];
const sha = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
function check(value, message) { if (!value) throw new Error(message); }

export function compileCoherentLocalContrast(comparisons, immediate) {
  check(comparisons.profile === "d3262-coherent-target-comparison-v1"
    && immediate.profile === "d3262-coherent-immediate-and-witness-v1", "Crossed corrected local population");
  const result = compileLocalRelationContrast(comparisons, immediate.material, immediate.destinationWitness, {
    targets: 64, material: 94, destination: 88, unpaired: 17, pairs: 116,
  });
  return { ...result, profile: "d3262-coherent-local-relation-contrast-v1" };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileCoherentLocalContrast(...bytes.map((value) => JSON.parse(value.toString()))),
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-local-relation-contrast.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Corrected local target contrast differs from sealed inputs");
  const summary = Object.fromEntries(["material", "destination"].map((family) => [family,
    Object.fromEntries(["source_only_local_relation", "alternative_only_local_relation", "same_local_relation", "not_comparable_minor_absent"]
      .map((status) => [status, artifact.rows.filter((row) => row.family === family && row.contrast === status).length]))]));
  process.stdout.write(`${JSON.stringify({ digest: sha(output), pairs: artifact.rows.length,
    unpairedTargets: artifact.unpairedTargets.length, summary }, null, 2)}\n`);
}
