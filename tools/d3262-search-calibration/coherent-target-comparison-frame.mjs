// Corrected D3262 comparison population. The source-named target is a question
// asked of every selected root move, never a transferred outcome or move grade.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { compileTargetComparisonFrame } from "./target-comparison-frame.mjs";

const directory = "planning/semantic-consequence-search";
const targetName = "d3262-target-register.json";
const frameName = "d3262-coherent-root-frame.json";
const outputName = "d3262-coherent-target-comparison-frame.json";
const targetBytes = readFileSync(`${directory}/${targetName}`);
const frameBytes = readFileSync(`${directory}/${frameName}`);
const targets = JSON.parse(targetBytes);
const frame = JSON.parse(frameBytes);
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function compileCoherentTargetComparisonFrame(register, rootFrame, registerBytes, rootBytes) {
  check(rootFrame.profile === "d3262-coherent-root-v1" && rootFrame.roots.length === 66,
    "Corrected candidate profile changed");
  const artifact = compileTargetComparisonFrame(register, rootFrame, {
    targetRegisterBytes: registerBytes,
    rootFrameBytes: rootBytes,
    rootFrameAuthority: "coherent_root_candidate_population_not_move_grade",
  });
  const sourceObserved = artifact.comparisons.filter((row) => row.sourceObserved).length;
  check(artifact.definitions.length === 64 && sourceObserved === 96 && artifact.controls.length === 4,
    "Named target or source coverage changed");
  return { ...artifact, profile: "d3262-coherent-target-comparison-v1" };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const artifact = compileCoherentTargetComparisonFrame(targets, frame, targetBytes, frameBytes);
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const outputPath = `${directory}/${outputName}`;
  if (process.argv.includes("--write")) writeFileSync(outputPath, bytes, { flag: "wx" });
  else check(readFileSync(outputPath, "utf8") === bytes, "Corrected target comparison frame differs from sealed sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), targets: artifact.definitions.length,
    comparisons: artifact.comparisons.length,
    sourceObserved: artifact.comparisons.filter((row) => row.sourceObserved).length,
    naturalAlternatives: artifact.comparisons.filter((row) => !row.sourceObserved).length,
    controls: artifact.controls.length }, null, 2)}\n`);
}
