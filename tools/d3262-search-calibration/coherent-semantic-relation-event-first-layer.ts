// D3262 corrected source-blind target-event census. Target declarations and
// exact legal geometry select events; provider preference and held-out named
// outcomes do not enter this stage.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { compileSemanticRelationEventFirstLayer } from "./semantic-relation-event-first-layer.js";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-exact-replies.json"];
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function sha(bytes: Buffer | string): string { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function compileCoherentRelationEvents(comparisons: any, graph: any): any {
  check(comparisons.profile === "d3262-coherent-target-comparison-v1"
    && graph.profile === "d3262-coherent-root-v1", "Crossed corrected semantic population");
  const artifact = compileSemanticRelationEventFirstLayer(comparisons, graph, {
    comparisonAuthority: "target_candidate_comparison_population_not_outcome_or_move_grade",
    graphAuthority: "coherent_root_complete_legal_reply_edges_not_semantic_proof",
    expectedComparisons: 182,
  });
  return { ...artifact, profile: "d3262-coherent-relation-event-v1" };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileCoherentRelationEvents(JSON.parse(inputs[0].toString()), JSON.parse(inputs[1].toString())),
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])) };
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-relation-event-first-layer.json`;
  if (process.argv.includes("--write")) writeFileSync(target, bytes, { flag: "wx" });
  else check(readFileSync(target, "utf8") === bytes, "Corrected source-blind relation events differ from sealed inputs");
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), comparisons: artifact.rows.length,
    status: Object.fromEntries(["event_available", "no_legal_event", "operand_absent"].map((status) => [status,
      artifact.rows.filter((row: any) => row.status === status).length])),
    events: artifact.rows.reduce((sum: number, row: any) => sum + row.eventReplies.length, 0) }, null, 2)}\n`);
}
