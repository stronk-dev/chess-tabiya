import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { digestPrincipleEntry, type PrincipleEntryDefinition } from "@chess-tabiya/schema/principle-entry";

import { ServerError } from "./errors.js";
import { validatePrincipleEntry } from "./principle-validation.js";

export interface PrincipleSummary {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly name: string;
  readonly statement: string;
  readonly phases: PrincipleEntryDefinition["phases"];
  readonly licence: string;
}

export interface PrincipleRecord {
  readonly document: PrincipleEntryDefinition;
  readonly digest: string;
  readonly summary: PrincipleSummary;
}

function freeze<T>(value: T): T { return Object.freeze(value); }

function project(document: PrincipleEntryDefinition): PrincipleEntryDefinition {
  return freeze({
    id: document.id,
    version: document.version,
    name: document.name,
    statement: document.statement,
    phases: freeze([...document.phases]),
    standsOn: document.standsOn,
    counterCase: document.counterCase,
    provenance: freeze({
      licence: document.provenance.licence,
      sources: freeze([...document.provenance.sources]),
      attribution: freeze(document.provenance.attribution.map((row) => freeze({ ...row }))),
    }),
  });
}

export class PrincipleRegistry {
  readonly #records = new Map<string, PrincipleRecord>();
  readonly #digests = new Map<string, PrincipleRecord>();

  static async loadDefault(directory = fileURLToPath(new URL("../../../content/principles/", import.meta.url))): Promise<PrincipleRegistry> {
    const registry = new PrincipleRegistry();
    const files = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && extname(entry.name) === ".json")
      .map((entry) => join(directory, entry.name))
      .sort();
    for (const file of files) {
      const raw = JSON.parse(await readFile(file, "utf8"));
      const result = validatePrincipleEntry(raw);
      if (!result.valid || result.document === undefined) throw new ServerError("PACK_INVALID", `Invalid principle entry ${file}`, { details: { issues: result.issues } });
      await registry.add(result.document);
    }
    return registry;
  }

  list(): readonly PrincipleSummary[] { return freeze([...this.#records.values()].map((record) => record.summary).sort((a, b) => a.id.localeCompare(b.id))); }
  get(id: string): PrincipleRecord | undefined { return this.#records.get(id); }
  required(id: string): PrincipleRecord { const record = this.get(id); if (record === undefined) throw new ServerError("PACK_INVALID", `Unknown principle: ${id}`); return record; }
  byDigest(digest: string): PrincipleRecord | undefined { return this.#digests.get(digest); }

  async add(document: PrincipleEntryDefinition): Promise<PrincipleRecord> {
    const digest = await digestPrincipleEntry(document);
    const frozen = project(structuredClone(document));
    const record = freeze({
      document: frozen,
      digest,
      summary: freeze({ id: frozen.id, version: frozen.version, digest, name: frozen.name, statement: frozen.statement, phases: frozen.phases, licence: frozen.provenance.licence }),
    });
    if (this.#records.has(frozen.id)) throw new ServerError("PACK_INVALID", `Duplicate principle id ${frozen.id}`);
    this.#records.set(frozen.id, record);
    this.#digests.set(digest, record);
    return record;
  }
}
