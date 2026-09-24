// `make concept-registry-census` / `make concept-registry-revise` (rfc/concept-registry.md §1).
//
// census: prints the pack-reference census and fails unless the referenced ids are set-equal
//         to the registered active-or-retired ids under the declared legacy policy (criterion 3).
// revise: writes the next immutable revision that adds every referenced-but-unregistered id with
//         its deterministic seed label, then moves `current.json`. Existing entries, labels and
//         statuses are carried verbatim; the tool never renames, retires or deletes. Every seeded
//         label is reviewed in the same content change (Discharge D2).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  conceptRegistryDigest,
  conceptRegistryHeadBytes,
  conceptRegistryRevisionBytes,
  conceptSlugToLabel,
  type ConceptStatus,
} from "@chess-tabiya/runtime";

import { CONCEPT_REGISTRY_DIRECTORY, loadConceptRegistry, packConceptCensus, readConceptRegistryFiles } from "./concept-registry-loader.js";

function main(): void {
  const command = process.argv[2] ?? "census";
  const directory = process.argv[3] ?? CONCEPT_REGISTRY_DIRECTORY;
  const census = packConceptCensus();
  const files = readConceptRegistryFiles(directory);
  const registry = files === undefined ? undefined : loadConceptRegistry(directory);
  const registered = new Set(registry?.entries.map((entry) => entry.id as string) ?? []);
  const referenced = new Set(census.references.map((reference) => reference.conceptId));
  const unregistered = [...referenced].filter((id) => !registered.has(id)).sort();
  const unreferenced = [...registered].filter((id) => !referenced.has(id)).sort();
  console.log(`packs ${census.packs}; packs declaring concepts ${census.packsWithConcepts}; references ${census.references.length}; distinct ids ${referenced.size}; registered ${registered.size}${registry === undefined ? "" : ` (${registry.digest})`}`);
  if (command === "census") {
    if (unregistered.length > 0) console.error(`unregistered pack references: ${unregistered.join(", ")}`);
    // Retired and unreferenced ids stay registered forever (§1.1); only active unreferenced ids are
    // reported, and only as information.
    if (unreferenced.length > 0) console.log(`registered ids no current pack references: ${unreferenced.join(", ")}`);
    if (unregistered.length > 0) process.exitCode = 1;
    return;
  }
  if (command !== "revise") throw new TypeError(`Unknown command ${command}; use census or revise`);
  if (unregistered.length === 0) {
    console.log("registry already covers every pack reference; no revision written");
    return;
  }
  const entries: { id: string; label: string; status: ConceptStatus }[] = [
    ...(registry?.entries.map((entry) => ({ id: entry.id as string, label: entry.label, status: entry.status })) ?? []),
    ...unregistered.map((id) => ({ id, label: conceptSlugToLabel(id), status: "active" as const })),
  ];
  const bytes = conceptRegistryRevisionBytes(registry?.digest ?? null, entries);
  const digest = conceptRegistryDigest(bytes);
  mkdirSync(join(directory, "revisions"), { recursive: true });
  writeFileSync(join(directory, "revisions", `${digest.slice("sha256:".length)}.json`), bytes);
  writeFileSync(join(directory, "current.json"), conceptRegistryHeadBytes(digest));
  const compiled = loadConceptRegistry(directory);
  console.log(`wrote revision ${compiled.digest} adding ${unregistered.length} ids: ${unregistered.join(", ")}`);
}

main();
