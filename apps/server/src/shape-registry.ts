import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { digestShapeEntry, type ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";

import { ServerError } from "./errors.js";
import { validateShapeEntry } from "./shape-validation.js";

export type ShapeChannel = "official" | "community";

export interface ShapeSummary {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly name: string;
  readonly phases: ShapeEntryDefinition["phases"];
  readonly licence: string;
  readonly channel: ShapeChannel;
  readonly publisherHandle?: string;
}

export interface ShapeRecord {
  readonly document: ShapeEntryDefinition;
  readonly digest: string;
  readonly summary: ShapeSummary;
  readonly channel: ShapeChannel;
  readonly publisherHandle?: string;
}

function freeze<T>(value: T): T { return Object.freeze(value); }

function projectDocument(document: ShapeEntryDefinition): ShapeEntryDefinition {
  return freeze({
    id: document.id, version: document.version, name: document.name,
    phases: freeze([...document.phases]), trigger: structuredClone(document.trigger),
    plans: freeze(document.plans.map((plan) => freeze({ ...structuredClone(plan) }))),
    watch: freeze([...document.watch]), typicalMistakes: freeze([...document.typicalMistakes]),
    provenance: freeze({ licence: document.provenance.licence, sources: freeze([...document.provenance.sources]), attribution: freeze(document.provenance.attribution.map((row) => freeze({ ...row }))) }),
  });
}

export function projectShapeEntry(record: ShapeRecord): Readonly<Record<string, unknown>> {
  return freeze({ ...projectDocument(record.document), channel: record.channel, ...(record.publisherHandle === undefined ? {} : { publisherHandle: record.publisherHandle }) });
}

export class ShapeRegistry {
  readonly #records = new Map<string, ShapeRecord>();
  readonly #digests = new Map<string, ShapeRecord>();

  static async loadDefault(directory = fileURLToPath(new URL("../../../content/shapes/", import.meta.url))): Promise<ShapeRegistry> {
    const registry = new ShapeRegistry();
    const files = (await readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile() && extname(entry.name) === ".json").map((entry) => join(directory, entry.name)).sort();
    for (const file of files) {
      const raw = JSON.parse(await readFile(file, "utf8"));
      const result = validateShapeEntry(raw);
      if (!result.valid || result.document === undefined) throw new ServerError("PACK_INVALID", `Invalid shape entry ${file}`, { details: { issues: result.issues } });
      await registry.add(result.document, "official");
    }
    return registry;
  }

  list(): readonly ShapeSummary[] { return freeze([...this.#records.values()].map((record) => record.summary).sort((a, b) => a.id.localeCompare(b.id))); }
  get(id: string): ShapeRecord | undefined { return this.#records.get(id); }
  required(id: string): ShapeRecord { const record = this.get(id); if (record === undefined) throw new ServerError("SHAPE_NOT_FOUND", `Unknown shape: ${id}`); return record; }
  byDigest(digest: string): ShapeRecord | undefined { return this.#digests.get(digest); }

  async add(document: ShapeEntryDefinition, channel: ShapeChannel, publisherHandle?: string, suppliedDigest?: string): Promise<ShapeRecord> {
    const digest = suppliedDigest ?? await digestShapeEntry(document);
    const frozen = projectDocument(structuredClone(document));
    const record: ShapeRecord = freeze({
      document: frozen, digest, channel,
      summary: freeze({ id: frozen.id, version: frozen.version, digest, name: frozen.name, phases: frozen.phases, licence: frozen.provenance.licence, channel, ...(publisherHandle === undefined ? {} : { publisherHandle }) }),
      ...(publisherHandle === undefined ? {} : { publisherHandle }),
    });
    if (channel === "official" || this.#records.get(document.id)?.channel !== "official") this.#records.set(document.id, record);
    this.#digests.set(digest, record);
    return record;
  }
}
