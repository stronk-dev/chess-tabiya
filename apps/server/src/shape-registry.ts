import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { digestShapeEntry, type ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";

import { ServerError } from "./errors.js";
import { validateShapeEntry } from "./shape-validation.js";
import { captureRegisteredShapeStructuralDocument, selectAuthoredStructuralCondition, type AuthoredStructuralDocument } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import { createRegisteredShapeScanOwner, type RegisteredShapePath, type RegisteredShapeScanBuilder, type RegisteredShapeScan } from "../../../packages/runtime/src/internal/registered-shape-scan.js";
import { assertRegisteredShapeRecordsCurrent, createRegisteredShapeSourceOwner, snapshotRegisteredShapeRecords,
  type RegisteredShapeRecordImage, type RegisteredShapeSource } from "../../../packages/runtime/src/registered-shape-source.js";

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

function freeze<T>(value: T): T {
  // JSON documents may already have a frozen parent around mutable nested expressions.
  // Visit descendants even in that case; readonly types alone cannot protect the digest.
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
  }
  return Object.freeze(value);
}

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
  readonly #authoredDocuments = new WeakMap<ShapeRecord, AuthoredStructuralDocument>();
  readonly #records = new Map<string, ShapeRecord>();
  readonly #digests = new Map<string, ShapeRecord>();
  readonly #currentScans = createRegisteredShapeScanOwner({
    capture: signal => this.captureRegisteredTriggers(signal),
    assertCurrent: source => this.assertRegisteredTriggersCurrent(source),
    trigger: identity => {
      const record = [...this.#records.values()].find(record => record === identity);
      if (record === undefined) throw new TypeError("Shape trigger record is not active in this registry");
      return selectAuthoredStructuralCondition(this.captureAuthoredStructuralDocument(record.document.id)!, "/trigger");
    },
  });
  readonly #registeredSources = createRegisteredShapeSourceOwner({
    capture: signal => this.#captureRegisteredRecords(signal), current: () => this.#registeredRecords(),
  });

  #registeredRecords(): readonly RegisteredShapeRecordImage[] {
    return [...this.#records.values()].sort((a, b) => a.document.id.localeCompare(b.document.id)).map(record => ({
      recordIdentity: record, document: record.document, digest: record.digest,
      summary: { id: record.summary.id, version: record.summary.version, digest: record.summary.digest },
      channel: record.channel, publisherHandle: record.publisherHandle ?? null,
    }));
  }

  async #captureRegisteredRecords(signal: AbortSignal): Promise<readonly RegisteredShapeRecordImage[]> {
    signal.throwIfAborted(); const records = snapshotRegisteredShapeRecords(this.#registeredRecords());
    // All document/summary/JSON and digest checks precede the existing validator's admission probes.
    for (const row of records) {
      const digest = await digestShapeEntry(row.document); signal.throwIfAborted();
      assertRegisteredShapeRecordsCurrent(records, this.#registeredRecords());
      if (digest !== row.digest) throw new TypeError("Registered shape document digest mismatch");
    }
    for (const row of records) {
      signal.throwIfAborted(); const validation = validateShapeEntry(row.document);
      if (!validation.valid) throw new ServerError("PACK_INVALID", `Invalid registered shape ${row.document.id}`, { details: { issues: validation.issues } });
      assertRegisteredShapeRecordsCurrent(records, this.#registeredRecords());
    }
    return records;
  }

  captureRegisteredTriggers(signal: AbortSignal): Promise<RegisteredShapeSource> { return this.#registeredSources.capture(signal); }
  assertRegisteredTriggersCurrent(source: RegisteredShapeSource): void { this.#registeredSources.assertCurrent(source); }
  beginCurrentShapeScan(path: RegisteredShapePath, signal: AbortSignal): Promise<RegisteredShapeScanBuilder> { return this.#currentScans.begin(path, signal); }
  advanceCurrentShapeScan(builder: RegisteredShapeScanBuilder) { return this.#currentScans.advance(builder); }
  sourceForCurrentShapeScan(builder: RegisteredShapeScanBuilder): RegisteredShapeSource { return this.#currentScans.source(builder); }
  assertCurrentShapeScan(scan: RegisteredShapeScan): void { this.#currentScans.assertCurrent(scan); }

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
  captureAuthoredStructuralDocument(id: string): AuthoredStructuralDocument | undefined {
    const record = this.#records.get(id);
    if (record === undefined) return undefined;
    let source = this.#authoredDocuments.get(record);
    if (source === undefined) {
      source = captureRegisteredShapeStructuralDocument(record, () => this.#records.get(id));
      this.#authoredDocuments.set(record, source);
    }
    return source;
  }
  required(id: string): ShapeRecord { const record = this.get(id); if (record === undefined) throw new ServerError("SHAPE_NOT_FOUND", `Unknown shape: ${id}`); return record; }
  byDigest(digest: string): ShapeRecord | undefined { return this.#digests.get(digest); }

  async add(document: ShapeEntryDefinition, channel: ShapeChannel, publisherHandle?: string, suppliedDigest?: string): Promise<ShapeRecord> {
    // Capture once before the asynchronous digest; the caller still owns its input.
    const snapshot = structuredClone(document);
    const validation = validateShapeEntry(snapshot);
    if (!validation.valid) throw new ServerError("PACK_INVALID", `Invalid shape entry ${snapshot.id}`, { details: { issues: validation.issues } });
    const digest = suppliedDigest ?? await digestShapeEntry(snapshot);
    const frozen = projectDocument(snapshot);
    const record: ShapeRecord = freeze({
      document: frozen, digest, channel,
      summary: freeze({ id: frozen.id, version: frozen.version, digest, name: frozen.name, phases: frozen.phases, licence: frozen.provenance.licence, channel, ...(publisherHandle === undefined ? {} : { publisherHandle }) }),
      ...(publisherHandle === undefined ? {} : { publisherHandle }),
    });
    if (channel === "official" || this.#records.get(frozen.id)?.channel !== "official") this.#records.set(frozen.id, record);
    this.#digests.set(digest, record);
    return record;
  }
}
