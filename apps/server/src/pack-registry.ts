import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  digestDrillPack,
  type DrillPackDefinition,
  type FeedbackPolicy,
  type PackPhase,
  type SpineNode,
} from "@chess-tabiya/schema/drill-pack";

import { ServerError } from "./errors.js";
import { validatePackDocument } from "./pack-validation.js";
import { assessmentGrounding } from "./sourcing/ledger-validation.js";

export const SIDECAR_BASENAMES = Object.freeze([
  "evidence.json",
  "sources.json",
  "job.json",
  "priority.json",
] as const);

export type AssessmentGrounding = "ledger_verified" | "unverified";

export type { FeedbackPolicy } from "@chess-tabiya/schema/drill-pack";

export interface PackSummary {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly title: string;
  readonly mode: string;
  readonly phase: PackPhase | null;
  readonly difficulty: unknown;
  readonly reviewStatus: string;
  readonly channel: "official" | "community";
  readonly publisherHandle?: string;
}

export interface PackRecord {
  readonly document: DrillPackDefinition;
  readonly digest: string;
  readonly summary: PackSummary;
  readonly feedbackPolicy: FeedbackPolicy;
  readonly assessmentGrounding: AssessmentGrounding;
  readonly channel: "official" | "community";
  readonly publisherHandle?: string;
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
 * Browser-safe pack shape. Authored feedback is never part of this response;
 * the run-scoped authored-feedback projection releases eligible prose only
 * after its checkpoint occurrence.
 */
export function projectPackDocument(
  document: DrillPackDefinition,
  grounding: AssessmentGrounding = "unverified",
  channel: "official" | "community" = "official",
  publisherHandle?: string,
): Readonly<Record<string, unknown>> {
  const raw = document as unknown as Record<string, unknown>;
  return freeze({
    id: document.id,
    version: document.version,
    title: raw.title,
    mode: raw.mode,
    phase: raw.phase,
    difficulty: raw.difficulty,
    provenance: (() => {
      const source = raw.provenance as Record<string, unknown>;
      return {
        reviewStatus: source.reviewStatus,
        ...(Array.isArray(source.sources) ? { sources: source.sources } : {}),
        ...(typeof source.licence === "string" ? { licence: source.licence } : {}),
        ...(Array.isArray(source.graduationBlockers) ? { graduationBlockers: source.graduationBlockers } : {}),
      };
    })(),
    channel,
    ...(publisherHandle === undefined ? {} : { publisherHandle }),
    start: document.start,
    objective: {
      type: document.objective.type,
      summary: document.objective.summary,
      ...(document.objective.grading === undefined
        ? {}
        : { grading: { ...document.objective.grading, grounding } }),
    },
    ...(document.legs === undefined ? {} : {
      legs: document.legs.map((leg) => ({
        id: leg.id,
        ...(leg.entryCheckpointId === undefined ? {} : { entryCheckpointId: leg.entryCheckpointId }),
        objective: { type: leg.objective.type, summary: leg.objective.summary },
      })),
    }),
    feedbackPolicy: raw.feedbackPolicy,
    opponentPolicy: raw.opponentPolicy,
    spine: raw.mode === "line" ? [] : (document.spine ?? []).map(projectSpineNode),
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
    else if (
      entry.isFile() &&
      extname(entry.name) === ".json" &&
      !isSidecarName(entry.name)
    ) {
      files.push(path);
    }
  }
  return files.sort();
}

export function isSidecarName(name: string): boolean {
  return SIDECAR_BASENAMES.some(
    (reserved) => name === reserved || name.endsWith(`.${reserved}`),
  );
}

async function optionalJson(path: string): Promise<unknown | undefined> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    // A malformed optional sidecar cannot earn grounding, but must not turn a
    // loadable draft pack into a server-startup failure.
    return undefined;
  }
}

function sidecarPaths(source: string): {
  readonly ledger: string;
  readonly manifest: string;
} {
  const directory = dirname(source);
  const name = basename(source);
  if (name === "pack.json") {
    return {
      ledger: join(directory, SIDECAR_BASENAMES[0]),
      manifest: join(directory, SIDECAR_BASENAMES[1]),
    };
  }
  const stem = name.slice(0, -extname(name).length);
  return {
    ledger: join(directory, `${stem}.${SIDECAR_BASENAMES[0]}`),
    manifest: join(directory, `${stem}.${SIDECAR_BASENAMES[1]}`),
  };
}

export class PackRegistry {
  readonly #records: Map<string, PackRecord>;
  readonly #digests: Map<string, PackRecord>;

  private constructor(records: ReadonlyMap<string, PackRecord>) {
    this.#records = new Map(records);
    this.#digests = new Map([...records.values()].map((record) => [record.digest, record]));
  }

  static async fromDocuments(
    documents: readonly {
      readonly source: string;
      readonly value: unknown;
      readonly ledger?: unknown;
      readonly manifest?: unknown;
    }[],
    options: { readonly replaceDuplicates?: boolean } = {},
  ): Promise<PackRegistry> {
    const records = new Map<string, PackRecord>();
    for (const { source, value, ledger, manifest } of documents) {
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
      const grounding = assessmentGrounding({ document, ledger, manifest });
      const summary: PackSummary = freeze({
        id: document.id,
        version: document.version,
        digest,
        title: raw.title as string,
        mode: raw.mode as string,
        phase: typeof raw.phase === "string" ? (raw.phase as PackPhase) : null,
        difficulty: raw.difficulty ?? null,
        reviewStatus: provenance.reviewStatus as string,
        channel: "official",
      });
      records.set(
        document.id,
        freeze({
          document,
          digest,
          summary,
          feedbackPolicy,
          assessmentGrounding: grounding,
          channel: "official",
        }),
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
      paths.map(async (path) => {
        const sidecars = sidecarPaths(path);
        return {
          source: path,
          value: JSON.parse(await readFile(path, "utf8")) as unknown,
          ledger: await optionalJson(sidecars.ledger),
          manifest: await optionalJson(sidecars.manifest),
        };
      }),
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

  byDigest(digest: string): PackRecord | undefined {
    return this.#digests.get(digest);
  }

  addCommunity(
    document: DrillPackDefinition,
    digest: string,
    publisherHandle: string,
  ): PackRecord {
    const raw = document as unknown as Record<string, unknown>;
    const provenance = raw.provenance as Record<string, unknown>;
    const record: PackRecord = freeze({
      document: freeze(structuredClone(document)),
      digest,
      summary: freeze({
        id: document.id,
        version: document.version,
        digest,
        title: String(raw.title),
        mode: String(raw.mode),
        phase: typeof raw.phase === "string" ? raw.phase as PackPhase : null,
        difficulty: raw.difficulty ?? null,
        reviewStatus: String(provenance.reviewStatus),
        channel: "community",
        publisherHandle,
      }),
      feedbackPolicy: raw.feedbackPolicy as FeedbackPolicy,
      assessmentGrounding: "unverified",
      channel: "community",
      publisherHandle,
    });
    if (this.#records.get(document.id)?.channel !== "official") this.#records.set(document.id, record);
    this.#digests.set(digest, record);
    return record;
  }

  addPlaytest(document: DrillPackDefinition, digest: string): PackRecord {
    const raw = document as unknown as Record<string, unknown>;
    const provenance = raw.provenance as Record<string, unknown>;
    const record: PackRecord = freeze({
      document: freeze(structuredClone(document)),
      digest,
      summary: freeze({
        id: document.id, version: document.version, digest,
        title: String(raw.title), mode: String(raw.mode),
        phase: typeof raw.phase === "string" ? raw.phase as PackPhase : null,
        difficulty: raw.difficulty ?? null, reviewStatus: String(provenance.reviewStatus),
        channel: "community",
      }),
      feedbackPolicy: raw.feedbackPolicy as FeedbackPolicy,
      assessmentGrounding: "unverified",
      channel: "community",
    });
    this.#digests.set(digest, record);
    return record;
  }
}
