// Disposable D3262 comparison population. A source target may be tested against
// every selected move at its root, but its observed outcome never transfers.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const targetPath = new URL("../../planning/semantic-consequence-search/d3262-target-register.json", import.meta.url);
const framePath = new URL("../../planning/semantic-consequence-search/d3262-root-frame.json", import.meta.url);
const outputPath = new URL("../../planning/semantic-consequence-search/d3262-target-comparison-frame.json", import.meta.url);
const targetBytes = readFileSync(targetPath);
const frameBytes = readFileSync(framePath);
const targets = JSON.parse(targetBytes.toString("utf8"));
const frame = JSON.parse(frameBytes.toString("utf8"));

function check(value, message) { if (!value) throw new Error(message); }
function targetKey(row) { return JSON.stringify([row.rootId, row.targetFamily, row.target]); }
function targetId(key) { return `target:${createHash("sha256").update(key).digest("hex")}`; }

export function compileTargetComparisonFrame(register, rootFrame) {
  check(register.authority === "source_named_target_identity_not_search_verdict", "Target register has the wrong authority");
  check(rootFrame.authority === "shared_candidate_population_not_move_grade", "Root frame has the wrong authority");
  check(register.manifest === rootFrame.manifest, "Target register and root frame disagree on the frozen manifest");
  const rootById = new Map(rootFrame.roots.map((root) => [root.rootId, root]));
  check(rootById.size === rootFrame.roots.length, "Duplicate root identity");
  const grouped = new Map();
  for (const row of register.targetRows) {
    const root = rootById.get(row.rootId);
    check(root !== undefined, `Target has no root: ${row.rootId}`);
    check(root.candidates.some((candidate) => candidate.moveUci === row.candidateUci), `Source candidate absent from root frame: ${row.rootId}/${row.candidateUci}`);
    const key = targetKey(row);
    const record = grouped.get(key) ?? { id: targetId(key), rootId: row.rootId, family: row.targetFamily, target: row.target, sources: [] };
    record.sources.push({ sourceId: row.sourceId, population: row.population, candidateUci: row.candidateUci, played: row.played });
    grouped.set(key, record);
  }
  const definitions = [...grouped.values()].sort((left, right) => left.id.localeCompare(right.id));
  check(new Set(definitions.map((row) => row.id)).size === definitions.length, "Target identity collision");
  const comparisons = definitions.flatMap((definition) => rootById.get(definition.rootId).candidates.map((candidate) => ({
    rootId: definition.rootId,
    targetId: definition.id,
    candidateUci: candidate.moveUci,
    sourceObserved: definition.sources.some((source) => source.candidateUci === candidate.moveUci),
  })));
  const controls = register.controls.map((control) => {
    const root = rootById.get(control.rootId);
    check(root !== undefined, `Control has no root: ${control.rootId}`);
    return { ...control, selectedCandidates: root.candidates.map((candidate) => candidate.moveUci) };
  });
  check(definitions.every((row) => !controls.some((control) => control.rootId === row.rootId)), "Source and special-control targets crossed");
  return {
    version: 1,
    manifest: register.manifest,
    targetRegisterDigest: `sha256:${createHash("sha256").update(targetBytes).digest("hex")}`,
    rootFrameDigest: `sha256:${createHash("sha256").update(frameBytes).digest("hex")}`,
    authority: "target_candidate_comparison_population_not_outcome_or_move_grade",
    definitions,
    comparisons,
    controls,
  };
}

if (process.argv[1]?.endsWith("target-comparison-frame.mjs")) {
  const artifact = compileTargetComparisonFrame(targets, frame);
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  if (process.argv.includes("--write")) writeFileSync(outputPath, bytes, { flag: "wx" });
  else check(readFileSync(outputPath, "utf8") === bytes, "D3262 target comparison frame differs from its sealed inputs");
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, targets: artifact.definitions.length, comparisons: artifact.comparisons.length, sourceObserved: artifact.comparisons.filter((row) => row.sourceObserved).length, naturalAlternatives: artifact.comparisons.filter((row) => !row.sourceObserved).length, controls: artifact.controls.length }, null, 2)}\n`);
}
