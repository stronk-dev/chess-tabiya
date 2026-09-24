// rfc/concept-registry.md §1 — the server's one reader of `content/concepts/`.
//
// This module reads bytes only; `compileConceptRegistry` (packages/runtime) is the sole parser and
// mint. Server, Pack Studio, the progress resolver, account export and the web wire all consume
// the compiled registry or a typed projection of it, never these files.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { compileConceptRegistry, type CompiledConceptRegistry } from "@chess-tabiya/runtime";

export const CONCEPT_REGISTRY_DIRECTORY = fileURLToPath(new URL("../../../content/concepts/", import.meta.url));
const CONTENT_DIRECTORY = fileURLToPath(new URL("../../../content/", import.meta.url));

export interface ConceptRegistryFiles {
  readonly head: Uint8Array;
  readonly revisions: Readonly<Record<string, Uint8Array>>;
}

/** The raw registry bytes, or `undefined` when no head exists yet (the generator's first run). */
export function readConceptRegistryFiles(directory = CONCEPT_REGISTRY_DIRECTORY): ConceptRegistryFiles | undefined {
  const headPath = join(directory, "current.json");
  if (!existsSync(headPath)) return undefined;
  const revisionDirectory = join(directory, "revisions");
  const revisions: Record<string, Uint8Array> = {};
  for (const name of existsSync(revisionDirectory) ? readdirSync(revisionDirectory).sort() : []) {
    if (name.startsWith(".")) continue;
    revisions[name] = readFileSync(join(revisionDirectory, name));
  }
  return Object.freeze({ head: readFileSync(headPath), revisions: Object.freeze(revisions) });
}

/** Compiles the registry at `directory`; a missing or invalid artifact fails closed. */
export function loadConceptRegistry(directory = CONCEPT_REGISTRY_DIRECTORY): CompiledConceptRegistry {
  const files = readConceptRegistryFiles(directory);
  if (files === undefined) throw new TypeError(`CONCEPT_REGISTRY_MISSING: ${join(directory, "current.json")} does not exist`);
  return compileConceptRegistry(files.head, files.revisions);
}

let installed: CompiledConceptRegistry | undefined;

/** The installed registry this build ships (`content/concepts/`), compiled once per process. */
export function installedConceptRegistry(): CompiledConceptRegistry {
  installed ??= loadConceptRegistry();
  return installed;
}

export interface PackConceptReference {
  readonly source: string;
  readonly packId: string;
  readonly conceptId: string;
}

function packFiles(directory: string): readonly string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return packFiles(path);
    return entry.isFile() && extname(entry.name) === ".json" ? [path] : [];
  }).sort();
}

/**
 * Every `concepts[]` reference in the official (`content/packs/`) and community (`content/drafts/`)
 * pack documents — objects carrying `mode`, `objective` and `opponentPolicy`.
 */
export function packConceptCensus(contentDirectory = CONTENT_DIRECTORY): { readonly packs: number; readonly packsWithConcepts: number; readonly references: readonly PackConceptReference[] } {
  let packs = 0;
  let packsWithConcepts = 0;
  const references: PackConceptReference[] = [];
  for (const file of [...packFiles(join(contentDirectory, "packs")), ...packFiles(join(contentDirectory, "drafts"))]) {
    const value = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    if (value === null || typeof value !== "object" || !("mode" in value) || !("objective" in value) || !("opponentPolicy" in value)) continue;
    packs += 1;
    const concepts = Array.isArray(value.concepts) ? value.concepts : [];
    if (concepts.length > 0) packsWithConcepts += 1;
    for (const concept of concepts) references.push(Object.freeze({ source: file, packId: String(value.id), conceptId: String(concept) }));
  }
  return Object.freeze({ packs, packsWithConcepts, references: Object.freeze(references) });
}
