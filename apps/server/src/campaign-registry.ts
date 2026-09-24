import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalizeJson, digestCanonicalJson } from "@chess-tabiya/schema/drill-pack";
import type { CampaignDocument } from "@chess-tabiya/runtime";

import { validateCampaignDocument, type CampaignPackLookup } from "./campaign-validation.js";

// rfc/campaign-core.md §6.0: the installed registry keys by {id, version, digest}. It is needed for
// NEW creation and current source availability; historical replay reads the run's pinned snapshot.

export type CampaignRegistryErrorCode =
  | "CAMPAIGN_DOCUMENT_INVALID"
  | "CAMPAIGN_DOCUMENT_DUPLICATE"
  | "CAMPAIGN_DOCUMENT_VERSION_MUTATED"
  | "CAMPAIGN_DOCUMENT_NOT_FOUND";

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
  readonly channel: "community" | "official";
}

export interface CampaignRecord {
  readonly source: string;
  readonly document: CampaignDocument;
  /** RFC-8785 canonical bytes of the validated document — what a CampaignRun pins. */
  readonly canonical: string;
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
        throw new CampaignRegistryError("CAMPAIGN_DOCUMENT_INVALID", `campaign ${entry.source} is invalid: ${result.issues.filter((item) => item.severity === "error").map((item) => `${item.code} at ${item.path} (${item.message})`).join("; ")}`, Object.freeze({ source: entry.source, issues: result.issues }));
      }
      const document = freeze(structuredClone(result.document));
      const identity = key(document.id, document.version);
      const canonical = canonicalizeJson(document);
      const digest = await digestCanonicalJson(document);
      const previous = records.get(identity);
      if (previous !== undefined) {
        throw previous.digest === digest
          ? new CampaignRegistryError("CAMPAIGN_DOCUMENT_DUPLICATE", `duplicate campaign ${identity}`)
          : new CampaignRegistryError("CAMPAIGN_DOCUMENT_VERSION_MUTATED", `campaign ${identity} has two different byte images`);
      }
      const summary = freeze({
        id: document.id,
        version: document.version,
        title: document.title,
        digest,
        nodeCount: document.acts.reduce((sum, act) => sum + act.layers.reduce((layerSum, layer) => layerSum + layer.choices.length, 0), 0),
        channel: document.publication.channel,
      });
      records.set(identity, freeze({ source: entry.source, document, canonical, digest, summary }));
    }
    return new CampaignRegistry(records);
  }

  static async loadDefault(
    packs: CampaignPackLookup,
    directory = fileURLToPath(new URL("../../../content/campaigns/", import.meta.url)),
    extraFiles: readonly string[] = [],
  ): Promise<CampaignRegistry> {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      entries = [];
    }
    const paths = [
      ...entries.filter((entry) => entry.isFile() && extname(entry.name) === ".json").map((entry) => join(directory, entry.name)).sort(),
      ...extraFiles,
    ];
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
