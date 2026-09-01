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
import type { PositionEvidenceIndex } from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";
import { validatePackDocument, type PackPrincipleLookup, type PackShapeLookup } from "./pack-validation.js";
import { buildPositionEvidenceIndex } from "./position-evidence.js";
import { assessmentGrounding } from "./sourcing/ledger-validation.js";
import { validateLedger } from "./sourcing/ledger-validation.js";
import { MACHINE_LABEL_EVIDENCE_KINDS, validateClaimBindings } from "./sourcing/claim-binding.js";
import type { SourcingIssue } from "./sourcing/types.js";

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
  readonly objectiveSummary: string;
  readonly consequenceHorizon: { readonly kind: "declared" | "authored"; readonly plies: number } | null;
  readonly concepts: readonly string[];
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
  readonly positionEvidence: PositionEvidenceIndex;
  readonly boundClaimIds: ReadonlySet<string>;
  readonly claimBackings: ReadonlyMap<string, {
    readonly binding: "ledger_bound" | "author_attributed" | "self_declared";
    readonly instrumentKinds: readonly import("./sourcing/types.js").EvidenceRecord["kind"][];
    readonly rendered: readonly string[];
    readonly authorSpans: readonly string[];
    readonly principles: readonly { readonly id: string; readonly name: string; readonly statement: string; readonly standsOn: string; readonly counterCase: string }[];
  }>;
}

function objectiveSummary(document: DrillPackDefinition): string {
  return document.objective.summary?.trim() || document.objective.type.replaceAll("_", " ");
}

function consequenceHorizon(document: DrillPackDefinition): PackSummary["consequenceHorizon"] {
  const declared = document.authoredBoundary?.plyHorizon;
  if (Number.isSafeInteger(declared) && declared! > 0) return freeze({ kind: "declared" as const, plies: declared! });
  const depth = (node: SpineNode): number => 1 + Math.max(0, ...node.children.map(depth));
  const spine = Math.max(0, ...(document.spine ?? []).map(depth));
  const leg = Math.max(0, ...(document.legs ?? []).map((item) => item.branchLengthTarget ?? 0));
  const plies = Math.max(spine, leg);
  return plies > 0 ? freeze({ kind: "authored" as const, plies }) : null;
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
        ...(leg.branchLengthTarget === undefined ? {} : { branchLengthTarget: leg.branchLengthTarget }),
        objective: { type: leg.objective.type, summary: leg.objective.summary },
      })),
    }),
    feedbackPolicy: raw.feedbackPolicy,
    opponentPolicy: raw.opponentPolicy,
    ...(document.shapes === undefined ? {} : { shapes: document.shapes }),
    ...(document.variantOf === undefined ? {} : { variantOf: document.variantOf }),
    spine: raw.mode === "line" ? [] : (document.spine ?? []).map(projectSpineNode),
    checkpoints: document.checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      label:
        typeof checkpoint.label === "string" ? checkpoint.label : checkpoint.id,
      actions: Array.isArray(checkpoint.actions) ? checkpoint.actions : [],
      ...(checkpoint.interaction?.type === "prediction" ? {
        interaction: {
          type: "prediction",
          ...(checkpoint.interaction.flipBoard === undefined ? {} : { flipBoard: checkpoint.interaction.flipBoard }),
        },
      } : checkpoint.interaction?.type === "stated_reasoning" ? { interaction: { type: "stated_reasoning" } } : {}),
    })),
  });
}

function validatedDocument(value: unknown, source: string, shapes?: PackShapeLookup, principles?: PackPrincipleLookup): DrillPackDefinition {
  const result = validatePackDocument(value, { ...(shapes === undefined ? {} : { shapes }), ...(principles === undefined ? {} : { principles }) });
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
    else if (entry.isFile() && isPackDocumentName(entry.name)) {
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

export function isPackDocumentName(name: string): boolean {
  return (
    extname(name) === ".json" &&
    !name.endsWith(".browser.json") &&
    !isSidecarName(name)
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
      readonly channel?: "official" | "community";
    }[],
    options: { readonly replaceDuplicates?: boolean; readonly shapes?: PackShapeLookup; readonly principles?: PackPrincipleLookup } = {},
  ): Promise<PackRegistry> {
    const records = new Map<string, PackRecord>();
    const validated = documents.map(({ source, value, ledger, manifest, channel = "official" }) => ({
      source,
      ledger,
      manifest,
      channel,
      document: validatedDocument(value, source, options.shapes, options.principles),
    }));
    const siblings = new Map(validated.map(({ document }) => [document.id, {
      start: document.start,
      objective: { type: document.objective.type },
    }]));
    for (const entry of validated) {
      const checked = validatePackDocument(entry.document, { ...(options.shapes === undefined ? {} : { shapes: options.shapes }), ...(options.principles === undefined ? {} : { principles: options.principles }), packs: siblings });
      if (!checked.valid || checked.document === undefined) {
        const errors = checked.issues.filter((issue) => issue.severity === "error");
        throw new ServerError("PACK_INVALID", `Pack ${entry.source} is invalid: ${errors.map((issue) => issue.message).join("; ")}`, { details: { source: entry.source, issues: errors } });
      }
      const document = freeze(checked.document);
      const { source, ledger, manifest, channel } = entry;
      const previous = records.get(document.id);
      if (previous !== undefined && previous.channel === "official" && channel === "community" && options.replaceDuplicates !== true) continue;
      if (previous !== undefined && previous.channel === channel && options.replaceDuplicates !== true) {
        throw new ServerError(
          "PACK_INVALID",
          `Duplicate pack id ${document.id} from ${source}`,
        );
      }
      const raw = document as unknown as Record<string, unknown>;
      const provenance = raw.provenance as Record<string, unknown>;
      const feedbackPolicy = raw.feedbackPolicy as FeedbackPolicy;
      const digest = await digestDrillPack(document);
      const grounding = assessmentGrounding({ document, documentDigest: digest, ledger, manifest });
      const positionEvidence = buildPositionEvidenceIndex({ ledger, grounding, packDigest: digest });
      const bindingIssues: SourcingIssue[] = [];
      const validatedLedger = validateLedger(ledger, bindingIssues);
      const validBindings = validatedLedger === undefined ? [] : validateClaimBindings(document, validatedLedger, bindingIssues);
      const claimBackings = new Map<string, PackRecord["claimBackings"] extends ReadonlyMap<string, infer V> ? V : never>();
      const principleRows = (ids: readonly string[] | undefined) => Object.freeze((ids ?? []).flatMap((id) => {
        const principle = options.principles?.get(id)?.document as { readonly id?: string; readonly name?: string; readonly statement?: string; readonly standsOn?: string; readonly counterCase?: string } | undefined;
        return principle?.id === undefined || principle.name === undefined || principle.statement === undefined || principle.standsOn === undefined || principle.counterCase === undefined ? [] : [Object.freeze({ id: principle.id, name: principle.name, statement: principle.statement, standsOn: principle.standsOn, counterCase: principle.counterCase })];
      }));
      for (const claim of document.feedbackClaims ?? []) {
        const binding = validBindings.find((candidate) => candidate.claimId === claim.id);
        if (binding !== undefined) claimBackings.set(claim.id, Object.freeze({ binding: binding.disposition, instrumentKinds: binding.instrumentKinds, rendered: binding.rendered, authorSpans: binding.authorSpans, principles: principleRows(claim.principles) }));
        else if (!claim.evidenceTypes.some((label) => MACHINE_LABEL_EVIDENCE_KINDS[label] !== undefined)) claimBackings.set(claim.id, Object.freeze({ binding: "self_declared", instrumentKinds: Object.freeze([]), rendered: Object.freeze([]), authorSpans: Object.freeze(claim.evidenceTypes.includes("author_principle") ? [claim.text] : []), principles: principleRows(claim.principles) }));
      }
      const summary: PackSummary = freeze({
        id: document.id,
        version: document.version,
        digest,
        title: raw.title as string,
        mode: raw.mode as string,
        phase: typeof raw.phase === "string" ? (raw.phase as PackPhase) : null,
        difficulty: raw.difficulty ?? null,
        objectiveSummary: objectiveSummary(document),
        consequenceHorizon: consequenceHorizon(document),
        concepts: Object.freeze([...(document.concepts ?? [])]),
        reviewStatus: provenance.reviewStatus as string,
        channel,
      });
      records.set(
        document.id,
        freeze({
          document,
          digest,
          summary,
          feedbackPolicy,
          assessmentGrounding: grounding,
          positionEvidence,
          boundClaimIds: Object.freeze(new Set(validBindings.map((binding) => binding.claimId))),
          claimBackings,
          channel,
        }),
      );
    }
    return new PackRegistry(records);
  }

  static async loadDefault(
    options: {
      readonly development?: boolean;
      readonly draftFile?: string;
      readonly draftFiles?: readonly string[];
      readonly draftsDirectory?: string;
      readonly shapes?: PackShapeLookup;
      readonly principles?: PackPrincipleLookup;
    } = {},
  ): Promise<PackRegistry> {
    const contentDirectory = fileURLToPath(
      new URL("../../../content/packs/", import.meta.url),
    );
    const draftsDirectory =
      options.draftsDirectory ??
      fileURLToPath(new URL("../../../content/drafts/", import.meta.url));
    if ((options.draftFile !== undefined || (options.draftFiles?.length ?? 0) > 0) && options.development !== true) {
      throw new TypeError("Draft packs may only be loaded in development mode");
    }
    const productionPaths = await jsonFiles(contentDirectory);
    const draftPaths = [
      ...(await jsonFiles(draftsDirectory)),
      ...(options.draftFile === undefined ? [] : [options.draftFile]),
      ...(options.draftFiles ?? []),
    ];
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
          channel: productionPaths.includes(path) ? "official" as const : "community" as const,
        };
      }),
    );
    return PackRegistry.fromDocuments(documents, {
      replaceDuplicates: options.development === true,
      ...(options.shapes === undefined ? {} : { shapes: options.shapes }),
      ...(options.principles === undefined ? {} : { principles: options.principles }),
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
        objectiveSummary: objectiveSummary(document),
        consequenceHorizon: consequenceHorizon(document),
        concepts: Object.freeze([...(document.concepts ?? [])]),
        reviewStatus: String(provenance.reviewStatus),
        channel: "community",
        publisherHandle,
      }),
      feedbackPolicy: raw.feedbackPolicy as FeedbackPolicy,
      assessmentGrounding: "unverified",
      positionEvidence: new Map(),
      boundClaimIds: Object.freeze(new Set<string>()),
      claimBackings: new Map<string, never>(),
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
        difficulty: raw.difficulty ?? null,
        objectiveSummary: objectiveSummary(document),
        consequenceHorizon: consequenceHorizon(document),
        concepts: Object.freeze([...(document.concepts ?? [])]),
        reviewStatus: String(provenance.reviewStatus),
        channel: "community",
      }),
      feedbackPolicy: raw.feedbackPolicy as FeedbackPolicy,
      assessmentGrounding: "unverified",
      positionEvidence: new Map(),
      boundClaimIds: Object.freeze(new Set<string>()),
      claimBackings: new Map<string, never>(),
      channel: "community",
    });
    this.#digests.set(digest, record);
    return record;
  }
}
