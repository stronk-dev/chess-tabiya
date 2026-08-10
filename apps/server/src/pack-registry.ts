import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  digestDrillPack,
  lintDrillPack,
  type DrillPackDefinition,
} from "@chess-tabiya/schema/drill-pack";

import { ServerError } from "./errors.js";

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

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ServerError("PACK_INVALID", `${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ServerError("PACK_INVALID", `${label} must be a non-empty string`);
  }
  return value;
}

function validatedDocument(value: unknown, source: string): DrillPackDefinition {
  const pack = object(value, `Pack ${source}`);
  const start = object(pack.start, `${source}.start`);
  const objective = object(pack.objective, `${source}.objective`);
  if (!Array.isArray(pack.checkpoints)) {
    throw new ServerError("PACK_INVALID", `${source}.checkpoints must be an array`);
  }
  string(pack.id, `${source}.id`);
  string(pack.version, `${source}.version`);
  string(pack.title, `${source}.title`);
  string(pack.mode, `${source}.mode`);
  string(start.fen, `${source}.start.fen`);
  string(objective.type, `${source}.objective.type`);
  const checkpointIds = new Set(
    pack.checkpoints.map((value, index) => {
      const checkpoint = object(value, `${source}.checkpoints[${index}]`);
      object(checkpoint.trigger, `${source}.checkpoints[${index}].trigger`);
      return string(checkpoint.id, `${source}.checkpoints[${index}].id`);
    }),
  );
  if (objective.successConditions !== undefined) {
    if (!Array.isArray(objective.successConditions)) {
      throw new ServerError(
        "PACK_INVALID",
        `${source}.objective.successConditions must be an array`,
      );
    }
    for (const [index, value] of objective.successConditions.entries()) {
      const condition = object(
        value,
        `${source}.objective.successConditions[${index}]`,
      );
      if (
        condition.kind !== "reach_checkpoint" ||
        typeof condition.checkpointId !== "string" ||
        !checkpointIds.has(condition.checkpointId)
      ) {
        throw new ServerError(
          "PACK_INVALID",
          `${source}.objective.successConditions[${index}] is not a supported v1 checkpoint rule`,
        );
      }
    }
  }
  const feedbackPolicy = string(pack.feedbackPolicy, `${source}.feedbackPolicy`);
  if (feedbackPolicy === "immediate_blunder_guard") {
    throw new ServerError(
      "PACK_INVALID",
      `${source} uses immediate_blunder_guard, which is not supported in v1`,
    );
  }
  if (feedbackPolicy !== "delayed_checkpoint" && feedbackPolicy !== "segment_end") {
    throw new ServerError(
      "PACK_INVALID",
      `${source}.feedbackPolicy is not a supported v1 policy`,
    );
  }
  const provenance = object(pack.provenance, `${source}.provenance`);
  string(provenance.reviewStatus, `${source}.provenance.reviewStatus`);

  const document = structuredClone(pack) as unknown as DrillPackDefinition;
  const errors = lintDrillPack(document).filter((issue) => issue.severity === "error");
  if (errors.length > 0) {
    throw new ServerError(
      "PACK_INVALID",
      `Pack ${source} failed lint: ${errors.map((issue) => issue.code).join(", ")}`,
      { details: { source, issues: errors } },
    );
  }
  return document;
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
  ): Promise<PackRegistry> {
    const records = new Map<string, PackRecord>();
    for (const { source, value } of documents) {
      const document = freeze(validatedDocument(value, source));
      if (records.has(document.id)) {
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

  static async loadDefault(): Promise<PackRegistry> {
    const fixture = fileURLToPath(
      new URL("../../../schemas/drill_pack.example.json", import.meta.url),
    );
    const contentDirectory = fileURLToPath(
      new URL("../../../content/packs/", import.meta.url),
    );
    const paths = [fixture, ...(await jsonFiles(contentDirectory))];
    const documents = await Promise.all(
      paths.map(async (path) => ({
        source: path,
        value: JSON.parse(await readFile(path, "utf8")) as unknown,
      })),
    );
    return PackRegistry.fromDocuments(documents);
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
