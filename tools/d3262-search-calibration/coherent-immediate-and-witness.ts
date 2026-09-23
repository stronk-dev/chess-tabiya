// D3262 corrected-frame immediate readings and exact named destination witness.
// These are bounded observations, not all-defence proofs or move grades.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { compileMaterialImmediate } from "./material-immediate.js";
import { compileDestinationImmediate } from "./destination-immediate.js";
import { compileDestinationReplyWitness } from "./destination-reply-witness.js";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json", "d3262-coherent-exact-replies.json"];
const sourcePath = "tools/d1023-bounded-policy-harness/provider-sample.json";
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function sha(bytes: Buffer | string): string { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function compileCoherentImmediateAndWitness(comparisons: any, roots: any, graph: any, source: any): any {
  check(comparisons.profile === "d3262-coherent-target-comparison-v1"
    && roots.profile === "d3262-coherent-root-v1"
    && graph.profile === "d3262-coherent-root-v1", "Crossed corrected population");
  check(comparisons.comparisons.length === 182, "Corrected comparison denominator changed");
  const options = {
    rootAuthority: "coherent_root_candidate_population_not_move_grade",
    replyAuthority: "coherent_root_complete_legal_reply_edges_not_semantic_proof",
  };
  const material = compileMaterialImmediate(comparisons, roots, source, graph, options);
  const destination = compileDestinationImmediate(comparisons, roots, source, graph, options);
  const destinationWitness = compileDestinationReplyWitness(comparisons, destination, graph, {
    replyAuthority: options.replyAuthority,
    expectedComparisons: 88,
  });
  check(material.rows.length === 94 && destination.rows.length === 88
    && material.sourceControls + destination.sourceControls === 96, "Corrected target partition or source controls changed");
  return {
    version: 1,
    profile: "d3262-coherent-immediate-and-witness-v1",
    authority: "corrected_immediate_readings_and_named_witness_not_all_defences_or_move_grade",
    manifest: comparisons.manifest,
    material,
    destination,
    destinationWitness,
  };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const sourceBytes = readFileSync(sourcePath);
  const artifact = {
    ...compileCoherentImmediateAndWitness(...inputs.map((bytes) => JSON.parse(bytes.toString())) as [any, any, any], JSON.parse(sourceBytes.toString())),
    inputDigests: {
      ...Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])),
      [sourcePath]: sha(sourceBytes),
    },
  };
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-immediate-and-witness.json`;
  if (process.argv.includes("--write")) writeFileSync(target, bytes, { flag: "wx" });
  else check(readFileSync(target, "utf8") === bytes, "Corrected immediate/witness output differs from sealed inputs");
  const counts = (rows: any[], field: string): Record<string, number> => Object.fromEntries([...new Set(rows.map((row) => row[field]))].sort()
    .map((value) => [value, rows.filter((row) => row[field] === value).length]));
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), material: counts(artifact.material.rows, "cause"),
    destination: counts(artifact.destination.rows, "cause"), witness: counts(artifact.destinationWitness.rows, "status") }, null, 2)}\n`);
}
