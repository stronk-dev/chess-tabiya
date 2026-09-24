#!/usr/bin/env node
// Checked one-time source-recovery generator (rfc/semantic-convention-provenance.md §1.2).
//
//   planning/semantic-convention-provenance/initial-declarations.json
//     -> this generator
//     -> packages/runtime/src/evidence-conventions.ts#CONVENTION_DECLARATIONS (generated prefix)
//
// It expands each reviewed row without authoring or paraphrasing it. The planning JSON is immutable
// initial source evidence; after landing, the TypeScript array is the runtime authority. Later
// declarations are authored directly below the generated region and never rewrite it.
//
//   node tools/generate-initial-convention-declarations.mjs          # rewrite the generated region
//   node tools/generate-initial-convention-declarations.mjs --check  # fail on any byte drift
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "planning/semantic-convention-provenance/initial-declarations.json";
const TARGET = "packages/runtime/src/evidence-conventions.ts";
export const BEGIN = "  // BEGIN GENERATED initial declarations: node tools/generate-initial-convention-declarations.mjs (do not edit)";
export const END = "  // END GENERATED initial declarations";
const REF = /^([a-z][a-z0-9_-]*)@([1-9][0-9]*)$/u;
const ENVELOPE_KEYS = ["schemaVersion", "snapshotRef", "authorityKind", "disclosureKind", "declarations"];
const ROW_KEYS = ["ref", "definition", "limitations", "witnesses"];

const sameKeys = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const text = (value) => typeof value === "string" && value.trim() !== "";

/** Validates the reviewed envelope; refuses a missing/extra key, blank field or malformed ref. */
export function parseInitialDeclarations(source) {
  if (!sameKeys(source, ENVELOPE_KEYS) || source.schemaVersion !== 1 || !/^[0-9a-f]{7,40}$/u.test(source.snapshotRef)
    || source.authorityKind !== "landed_contract" || source.disclosureKind !== "definition_and_limitations" || !Array.isArray(source.declarations)) {
    throw new Error(`${SOURCE}: malformed envelope`);
  }
  const seen = new Set();
  for (const row of source.declarations) {
    if (!sameKeys(row, ROW_KEYS)) throw new Error(`${SOURCE}: row keys must be exactly ${ROW_KEYS.join(", ")}`);
    if (!REF.test(row.ref)) throw new Error(`${SOURCE}: malformed ref ${row.ref}`);
    if (seen.has(row.ref)) throw new Error(`${SOURCE}: duplicate ref ${row.ref}`);
    seen.add(row.ref);
    if (!text(row.definition)) throw new Error(`${SOURCE}: ${row.ref} has a blank definition`);
    if (!Array.isArray(row.limitations) || row.limitations.length === 0 || !row.limitations.every(text)) throw new Error(`${SOURCE}: ${row.ref} needs at least one non-blank limitation`);
    if (!Array.isArray(row.witnesses) || row.witnesses.length === 0 || !row.witnesses.every(text)) throw new Error(`${SOURCE}: ${row.ref} needs at least one witness`);
  }
  return source;
}

/** Renders the generated region (markers included) exactly as it must appear in the array literal. */
export function renderInitialDeclarations(source) {
  const envelope = parseInitialDeclarations(source);
  const lines = [BEGIN];
  for (const row of envelope.declarations) {
    const [, id, version] = row.ref.match(REF);
    lines.push("  {");
    lines.push(`    ref: { id: ${JSON.stringify(id)}, version: ${Number(version)} },`);
    lines.push(`    definition: ${JSON.stringify(row.definition)},`);
    lines.push(`    limitations: [${row.limitations.map((item) => JSON.stringify(item)).join(", ")}],`);
    lines.push(`    authority: [{ kind: ${JSON.stringify(envelope.authorityKind)}, witnesses: [${row.witnesses.map((item) => JSON.stringify(item)).join(", ")}], snapshotRef: ${JSON.stringify(envelope.snapshotRef)} }],`);
    lines.push(`    disclosure: { kind: ${JSON.stringify(envelope.disclosureKind)} },`);
    lines.push("  },");
  }
  lines.push(END);
  return `${lines.join("\n")}\n`;
}

/** Replaces the generated region inside the target text; refuses a missing or duplicated marker. */
export function spliceGeneratedRegion(target, region) {
  const begin = target.indexOf(`${BEGIN}\n`);
  const end = target.indexOf(`${END}\n`);
  if (begin < 0 || end < begin || target.indexOf(`${BEGIN}\n`, begin + 1) >= 0 || target.indexOf(`${END}\n`, end + 1) >= 0) {
    throw new Error(`${TARGET}: expected exactly one generated region`);
  }
  return `${target.slice(0, begin)}${region}${target.slice(end + END.length + 1)}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = JSON.parse(readFileSync(join(root, SOURCE), "utf8"));
  const current = readFileSync(join(root, TARGET), "utf8");
  const rendered = spliceGeneratedRegion(current, renderInitialDeclarations(source));
  if (process.argv.includes("--check")) {
    if (rendered !== current) {
      console.error(`semantic-convention-source-check: ${TARGET} generated region drifted from ${SOURCE}; run node tools/generate-initial-convention-declarations.mjs`);
      process.exit(1);
    }
    console.log(`semantic-convention-source-check: ${parseInitialDeclarations(source).declarations.length} initial declarations byte-equal to ${SOURCE}`);
  } else {
    writeFileSync(join(root, TARGET), rendered);
    console.log(`wrote ${TARGET}`);
  }
}
