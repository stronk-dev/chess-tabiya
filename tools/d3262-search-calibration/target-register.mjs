// Disposable D3262 source-target join. It restores the exact identities from
// the sealed predecessor input without changing the frozen 66-root manifest.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { manifestIdentity, manifestRows } from "./manifest.mjs";

const sourcePath = new URL("../d1023-bounded-policy-harness/provider-sample.json", import.meta.url);
const outputPath = new URL("../../planning/semantic-consequence-search/d3262-target-register.json", import.meta.url);
const sourceBytes = readFileSync(sourcePath);
const source = JSON.parse(sourceBytes.toString("utf8"));

function check(value, message) { if (!value) throw new Error(message); }
function key(row) {
  return JSON.stringify([row.population, row.parentFen ?? row.fen, row.sourceId, row.candidateUci, row.played, row.targetFamily]);
}
function validTarget(row) {
  const target = row.target;
  if (row.targetFamily === "material") return target?.attacker?.square && target?.attacker?.role && target?.target?.square && target?.target?.role && target?.baselineMoveUci;
  if (row.targetFamily === "destination") return target?.minor?.square && target?.minor?.role && target?.controllingPawn?.square && target?.square;
  return false;
}

export function compileTargetRegister(populations, roots) {
  const indexed = new Map();
  for (const population of populations) for (const row of population.rows) {
    const full = { ...row, population: population.population };
    check(validTarget(full), `Incomplete or unknown target for ${key(full)}`);
    check(!indexed.has(key(full)), `Duplicate target identity for ${key(full)}`);
    indexed.set(key(full), full);
  }
  const targetRows = [];
  for (const root of roots) for (const manifestRow of root.sourceRows ?? []) {
    const sourceRow = indexed.get(key({ ...manifestRow, fen: root.fen }));
    check(sourceRow !== undefined, `Missing source target for ${root.id}: ${key({ ...manifestRow, fen: root.fen })}`);
    indexed.delete(key(sourceRow));
    targetRows.push({ rootId: root.id, sourceId: sourceRow.sourceId, population: sourceRow.population, candidateUci: sourceRow.candidateUci, played: sourceRow.played, targetFamily: sourceRow.targetFamily, target: sourceRow.target });
  }
  check(indexed.size === 0, `${indexed.size} source target rows were not joined`);
  const controls = [
    { rootId: "pressure:bg4-h3-bh5", status: "declared_relation_control", declaration: "tools/d3262-search-calibration/bishop-pressure-control.mjs#bishopPressureDeclaration" },
    { rootId: "quiet-plan:carlsbad-nf8", status: "no_autonomous_semantic_target", declaration: "content/drafts/carlsbad-minority-attack.json#nf8-regroup" },
    { rootId: "tactical:fork-parried", status: "declared_relation_control", declaration: "tools/d3262-search-calibration/fork-control-identity.mjs#controls" },
    { rootId: "tactical:fork-survives", status: "declared_relation_control", declaration: "tools/d3262-search-calibration/fork-control-identity.mjs#controls" },
  ];
  for (const control of controls) check(roots.some((root) => root.id === control.rootId && root.sourceRows === undefined), `Missing special control ${control.rootId}`);
  return {
    version: 1,
    manifest: manifestIdentity.manifestDigest,
    sourceDigest: `sha256:${createHash("sha256").update(sourceBytes).digest("hex")}`,
    authority: "source_named_target_identity_not_search_verdict",
    targetRows,
    controls,
  };
}

if (process.argv[1]?.endsWith("target-register.mjs")) {
  const artifact = compileTargetRegister(source.populations, manifestRows);
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  if (process.argv.includes("--write")) writeFileSync(outputPath, bytes, { flag: "wx" });
  else check(readFileSync(outputPath, "utf8") === bytes, "D3262 target register differs from the sealed source and manifest");
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, targetRows: artifact.targetRows.length, distinctSourceCandidates: new Set(artifact.targetRows.map((row) => JSON.stringify([row.rootId, row.candidateUci]))).size, controls: artifact.controls }, null, 2)}\n`);
}
