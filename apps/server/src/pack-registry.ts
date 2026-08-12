import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  digestDrillPack,
  type DrillPackDefinition,
  type SpineNode,
} from "@chess-tabiya/schema/drill-pack";

import { ServerError } from "./errors.js";
import { validatePackDocument } from "./pack-validation.js";

export type FeedbackPolicy = "delayed_checkpoint" | "segment_end";

export interface PackSummary {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly title: string;
  readonly mode: string;
  readonly difficulty: unknown;
  readonly reviewStatus: string;
}

export interface PackRecord {
  readonly document: DrillPackDefinition;
  readonly digest: string;
  readonly summary: PackSummary;
  readonly feedbackPolicy: FeedbackPolicy;
}

function projectSpineNode(node: SpineNode): unknown {
  return freeze({
    id: node.id,
    moveUci: node.moveUci,
    moveSan: node.moveSan,
    children: node.children.map(projectSpineNode),
  });
}

/**
 * Browser-safe pack shape. Authored feedback stays in the stored document until
 * a server-side, per-scope reveal contract exists.
 */
export function projectPackDocument(
  document: DrillPackDefinition,
): Readonly<Record<string, unknown>> {
  const raw = document as unknown as Record<string, unknown>;
  return freeze({
    id: document.id,
    version: document.version,
    title: raw.title,
    mode: raw.mode,
    phase: raw.phase,
    difficulty: raw.difficulty,
    provenance: raw.provenance,
    start: document.start,
    objective: {
      type: document.objective.type,
      summary: document.objective.summary,
    },
    feedbackPolicy: raw.feedbackPolicy,
    opponentPolicy: raw.opponentPolicy,
    spine: (document.spine ?? []).map(projectSpineNode),
    checkpoints: document.checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      label:
        typeof checkpoint.label === "string" ? checkpoint.label : checkpoint.id,
      actions: Array.isArray(checkpoint.actions) ? checkpoint.actions : [],
    })),
  });
}

function validatedDocument(value: unknown, source: string): DrillPackDefinition {
  const result = validatePackDocument(value);
  if (!result.valid || result.document === undefined) {
    const errors = result.issues.filter((issue) => issue.severity === "error");
    throw new ServerError(
      "PACK_INVALID",
      `Pack ${source} is invalid: ${errors.map((issue) => issue.message).join("; ")}`,
      { details: { source, issues: errors } },
    );
  }
  return result.document;
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

async function jsonFiles(directory: string): Promise<readonly string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await jsonFiles(path)));
    else if (entry.isFile() && extname(entry.name) === ".json") files.push(path);
  }
  return files.sort();
}

export class PackRegistry {
  readonly #records: ReadonlyMap<string, PackRecord>;

  private constructor(records: ReadonlyMap<string, PackRecord>) {
    this.#records = records;
  }

  static async fromDocuments(
    documents: readonly { readonly source: string; readonly value: unknown }[],
    options: { readonly replaceDuplicates?: boolean } = {},
  ): Promise<PackRegistry> {
    const records = new Map<string, PackRecord>();
    for (const { source, value } of documents) {
      const document = freeze(validatedDocument(value, source));
      if (records.has(document.id) && options.replaceDuplicates !== true) {
        throw new ServerError(
          "PACK_INVALID",
          `Duplicate pack id ${document.id} from ${source}`,
        );
      }
      const raw = document as unknown as Record<string, unknown>;
      const provenance = raw.provenance as Record<string, unknown>;
      const feedbackPolicy = raw.feedbackPolicy as FeedbackPolicy;
      const digest = await digestDrillPack(document);
      const summary: PackSummary = freeze({
        id: document.id,
        version: document.version,
        digest,
        title: raw.title as string,
        mode: raw.mode as string,
        difficulty: raw.difficulty ?? null,
        reviewStatus: provenance.reviewStatus as string,
      });
      records.set(
        document.id,
        freeze({ document, digest, summary, feedbackPolicy }),
      );
    }
    return new PackRegistry(records);
  }

  static async loadDefault(
    options: {
      readonly development?: boolean;
      readonly draftFile?: string;
      readonly draftsDirectory?: string;
    } = {},
  ): Promise<PackRegistry> {
    const fixture = fileURLToPath(
      new URL("../../../schemas/drill_pack.example.json", import.meta.url),
    );
    const contentDirectory = fileURLToPath(
      new URL("../../../content/packs/", import.meta.url),
    );
    const draftsDirectory =
      options.draftsDirectory ??
      fileURLToPath(new URL("../../../content/drafts/", import.meta.url));
    if (options.draftFile !== undefined && options.development !== true) {
      throw new TypeError("Draft packs may only be loaded in development mode");
    }
    const productionPaths = [fixture, ...(await jsonFiles(contentDirectory))];
    const draftPaths =
      options.development === true
        ? [
            ...(await jsonFiles(draftsDirectory)),
            ...(options.draftFile === undefined ? [] : [options.draftFile]),
          ]
        : [];
    const paths = [
      ...productionPaths,
      ...draftPaths.filter(
        (path, index, candidates) => candidates.indexOf(path) === index,
      ),
    ];
    const documents = await Promise.all(
      paths.map(async (path) => ({
        source: path,
        value: JSON.parse(await readFile(path, "utf8")) as unknown,
      })),
    );
    return PackRegistry.fromDocuments(documents, {
      replaceDuplicates: options.development === true,
    });
  }

  list(): readonly PackSummary[] {
    return freeze([...this.#records.values()].map((record) => record.summary));
  }

  get(packId: string): PackRecord | undefined {
    return this.#records.get(packId);
  }

  required(packId: string): PackRecord {
    const record = this.get(packId);
    if (record === undefined) {
      throw new ServerError("PACK_NOT_FOUND", `Unknown pack: ${packId}`);
    }
    return record;
  }
}
