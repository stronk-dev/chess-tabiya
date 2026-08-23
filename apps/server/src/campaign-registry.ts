import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { digestCanonicalJson } from "@chess-tabiya/schema/drill-pack";
import type { CampaignDocument } from "@chess-tabiya/runtime";

import { validateCampaignDocument, type CampaignPackLookup } from "./campaign-validation.js";

export type CampaignRegistryErrorCode = "CAMPAIGN_DOCUMENT_INVALID" | "CAMPAIGN_DOCUMENT_DUPLICATE" | "CAMPAIGN_DOCUMENT_NOT_FOUND";

export class CampaignRegistryError extends TypeError {
  readonly code: CampaignRegistryErrorCode;
  readonly details?: unknown;

  constructor(code: CampaignRegistryErrorCode, message: string, details?: unknown) {
    super(`${code}: ${message}`);
    this.name = "CampaignRegistryError";
    this.code = code;
    this.details = details;
  }
}

export interface CampaignSummary {
  readonly id: string;
  readonly version: number;
  readonly title: string;
  readonly digest: string;
  readonly nodeCount: number;
}

export interface CampaignRecord {
  readonly source: string;
  readonly document: CampaignDocument;
  readonly digest: string;
  readonly summary: CampaignSummary;
}

function key(id: string, version: number): string {
  return `${id}@${version}`;
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export class CampaignRegistry {
  readonly #records: ReadonlyMap<string, CampaignRecord>;

  private constructor(records: ReadonlyMap<string, CampaignRecord>) {
    this.#records = new Map(records);
  }

  static async fromDocuments(
    documents: readonly { readonly source: string; readonly value: unknown }[],
    packs: CampaignPackLookup,
  ): Promise<CampaignRegistry> {
    const records = new Map<string, CampaignRecord>();
    for (const entry of documents) {
      const result = validateCampaignDocument(entry.value, packs);
      if (!result.valid || result.document === undefined) {
        throw new CampaignRegistryError("CAMPAIGN_DOCUMENT_INVALID", `campaign ${entry.source} is invalid`, Object.freeze({ source: entry.source, issues: result.issues }));
      }
      const document = freeze(structuredClone(result.document));
      const identity = key(document.id, document.version);
      if (records.has(identity)) throw new CampaignRegistryError("CAMPAIGN_DOCUMENT_DUPLICATE", `duplicate campaign ${identity}`);
      const digest = await digestCanonicalJson(document);
      const summary = freeze({
        id: document.id,
        version: document.version,
        title: document.title,
        digest,
        nodeCount: document.acts.reduce((sum, act) => sum + act.layers.reduce((layerSum, layer) => layerSum + layer.choices.length, 0), 0),
      });
      records.set(identity, freeze({ source: entry.source, document, digest, summary }));
    }
    return new CampaignRegistry(records);
  }

  static async loadDefault(
    packs: CampaignPackLookup,
    directory = fileURLToPath(new URL("../../../content/campaigns/", import.meta.url)),
  ): Promise<CampaignRegistry> {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return new CampaignRegistry(new Map());
      throw error;
    }
    const paths = entries.filter((entry) => entry.isFile() && extname(entry.name) === ".json").map((entry) => join(directory, entry.name)).sort();
    const documents = await Promise.all(paths.map(async (path) => ({ source: path, value: JSON.parse(await readFile(path, "utf8")) as unknown })));
    return CampaignRegistry.fromDocuments(documents, packs);
  }

  list(): readonly CampaignSummary[] {
    return Object.freeze([...this.#records.values()].map((record) => record.summary).sort((left, right) => left.id.localeCompare(right.id) || left.version - right.version));
  }

  get(id: string, version: number): CampaignRecord | undefined {
    return this.#records.get(key(id, version));
  }

  required(id: string, version: number): CampaignRecord {
    const record = this.get(id, version);
    if (record === undefined) throw new CampaignRegistryError("CAMPAIGN_DOCUMENT_NOT_FOUND", `unknown campaign ${key(id, version)}`);
    return record;
  }

  versions(id: string): readonly CampaignRecord[] {
    return Object.freeze([...this.#records.values()].filter((record) => record.document.id === id).sort((left, right) => left.document.version - right.document.version));
  }
}
