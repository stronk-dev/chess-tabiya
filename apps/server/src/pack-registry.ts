import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizeJson,
  digestDrillPack,
  type DrillPackDefinition,
  type FeedbackPolicy,
  type PackPhase,
  type SpineNode,
} from "@chess-tabiya/schema/drill-pack";
import {
  isPackDocumentFileName,
  isPackSidecarName,
  PACK_SIDECAR_BASENAMES,
} from "@chess-tabiya/schema/pack-path";
import { assertCompiledConceptRegistry, type CompiledConceptRegistry, type PositionEvidenceIndex } from "@chess-tabiya/runtime";

import { capabilityKey, type CapabilityId } from "@chess-tabiya/schema";

import { runtimeSupportedCapabilities, unmetRequirements, type RuntimeCapabilitySupport } from "./capability/pack-capabilities.js";
import { installedConceptRegistry } from "./concept-registry-loader.js";
import { ServerError } from "./errors.js";
import { packVariantIssues, validatePackDocument, type PackPrincipleLookup, type PackShapeLookup } from "./pack-validation.js";
import { buildPositionEvidenceIndex } from "./position-evidence.js";
import { assessmentGrounding, linkage, validateLedger, validateManifest } from "./sourcing/ledger-validation.js";
import { MACHINE_LABEL_EVIDENCE_KINDS, validateClaimBindings } from "./sourcing/claim-binding.js";
import type { EvidenceAbstention, EvidenceLedger, EvidenceRecord, SourceEntry, SourceManifest, SourcingIssue } from "./sourcing/types.js";

export const SIDECAR_BASENAMES = PACK_SIDECAR_BASENAMES;

export type AssessmentGrounding = "ledger_verified" | "unverified";

type SidecarRead =
  | { readonly kind: "missing" }
  | { readonly kind: "loaded"; readonly value: unknown }
  | { readonly kind: "parse_failed" }
  | { readonly kind: "read_failed" };
interface SidecarImage {
  readonly origin: { readonly kind: "provided" } | { readonly kind: "file"; readonly path: string };
  readonly read: SidecarRead;
}
interface MeasurementArtifacts { readonly ledger: SidecarImage; readonly manifest: SidecarImage }
declare const measurementSourceBrand: unique symbol;
/** Server-private original registry artifact authority, never a provider or access receipt. */
export interface RecordedMeasurementSource { readonly [measurementSourceBrand]: true }
export type RecordedMeasurementAdmission =
  | { readonly kind: "available"; readonly source: RecordedMeasurementSource }
  | { readonly kind: "unavailable"; readonly reason: "source_absent" }
  | { readonly kind: "failed"; readonly reason: "source_contract_invalid" | "source_lookup_failed" };
interface MeasurementSourceImage {
  readonly document: DrillPackDefinition;
  readonly packDigest: string;
  readonly sidecars: MeasurementArtifacts;
  readonly ledger: EvidenceLedger;
  readonly manifest: SourceManifest;
  readonly ledgerDigest: string;
  readonly manifestDigest: string;
  readonly records: readonly { readonly ordinal: number; readonly record: EvidenceRecord; readonly sourceOrdinal: number; readonly source: SourceEntry }[];
  readonly abstentions: readonly { readonly ordinal: number; readonly abstention: EvidenceAbstention; readonly sourceOrdinal: number; readonly source: SourceEntry }[];
}
interface RegistrationInput {
  readonly source: string; readonly value: unknown; readonly sidecars: MeasurementArtifacts;
  readonly channel: "official" | "community";
}
interface RegistrationOptions {
  readonly replaceDuplicates?: boolean; readonly shapes?: PackShapeLookup; readonly principles?: PackPrincipleLookup;
  readonly concepts?: CompiledConceptRegistry; readonly capabilities?: RuntimeCapabilitySupport;
}

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
  /** Current-catalogue label projection of `concepts[]` (rfc/concept-registry.md §6). */
  readonly concepts: readonly PackConceptLabel[];
  readonly reviewStatus: string;
  readonly channel: "official" | "community";
  readonly publisherHandle?: string;
}

/**
 * One pack concept reference labelled from the compiled registry. `unregistered` marks a stored
 * pre-registry community pack's id that the registry does not carry; it renders its raw id and is
 * never promoted to registered identity.
 */
export interface PackConceptLabel {
  readonly id: string;
  readonly label: string;
  readonly status: "active" | "retired" | "unregistered";
}

function conceptLabels(document: DrillPackDefinition, registry: CompiledConceptRegistry): readonly PackConceptLabel[] {
  return freeze((document.concepts ?? []).map((id) => {
    const entry = registry.get(id);
    return freeze(entry === undefined ? { id, label: id, status: "unregistered" as const } : { id, label: entry.label, status: entry.status });
  }));
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
  /**
   * rfc/phase-source-composition.md §2.2: the recorded-evidence source state behind
   * `positionEvidence`, so an unverified or invalid ledger is never read as recorded absence.
   */
  readonly recordedEvidence: { readonly state: "verified"; readonly ledgerDigest: string } | { readonly state: "unverified" } | { readonly state: "invalid" };
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
  return document.objective.summary.trim();
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
    ...(document.variantOf == null ? {} : { variantOf: document.variantOf }),
    spine: raw.mode === "line" ? [] : (document.spine ?? []).map(projectSpineNode),
    checkpoints: document.checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      ...(typeof checkpoint.label === "string" && checkpoint.label.trim() !== ""
        ? { label: checkpoint.label }
        : {}),
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

function validatedDocument(value: unknown, source: string, shapes: PackShapeLookup | undefined, principles: PackPrincipleLookup | undefined, concepts: CompiledConceptRegistry): DrillPackDefinition {
  const result = validatePackDocument(value, { ...(shapes === undefined ? {} : { shapes }), ...(principles === undefined ? {} : { principles }), concepts });
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
  return isPackSidecarName(name);
}

export function isPackDocumentName(name: string): boolean {
  return isPackDocumentFileName(name);
}

async function readSidecar(path: string): Promise<SidecarImage> {
  const origin = Object.freeze({ kind: "file" as const, path });
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    return freeze({ origin, read: { kind: (error as NodeJS.ErrnoException).code === "ENOENT" ? "missing" as const : "read_failed" as const } });
  }
  try { return freeze({ origin, read: { kind: "loaded" as const, value: JSON.parse(text) as unknown } }); }
  catch { return freeze({ origin, read: { kind: "parse_failed" as const } }); }
}

function providedSidecar(value: unknown): SidecarImage {
  const origin = Object.freeze({ kind: "provided" as const });
  if (value === undefined) return freeze({ origin, read: { kind: "missing" as const } });
  try {
    assertJsonArtifact(value, new Set());
    // Check canonical JSON validity, but preserve insertion order for existing byte-sensitive
    // JSON.stringify consumers. Canonical identities are computed separately at admission.
    canonicalizeJson(value);
    return freeze({ origin, read: { kind: "loaded" as const, value: structuredClone(value) } });
  } catch {
    return freeze({ origin, read: { kind: "parse_failed" as const } });
  }
}

/** Supplied artifacts are JSON data, not executable accessors or clone-normalized objects. */
function assertJsonArtifact(value: unknown, parents: Set<object>): void {
  if (value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return;
  if (typeof value !== "object" || parents.has(value)) throw new TypeError("Sidecar is not JSON data");
  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) throw new TypeError("Sidecar is not a plain JSON object/array");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).some(key => typeof key !== "string") || (array && Object.keys(descriptors).length !== value.length + 1)) throw new TypeError("Sidecar has non-JSON properties");
  parents.add(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (array && key === "length") continue;
    if (!descriptor.enumerable || !("value" in descriptor) || (array && (!/^(0|[1-9][0-9]*)$/u.test(key) || Number(key) >= value.length))) throw new TypeError("Sidecar has non-JSON properties");
    assertJsonArtifact(descriptor.value, parents);
  }
  parents.delete(value);
}
/** Preserve the old optional-sidecar view, not its former loss of original failure states. */
function optionalValue(sidecar: SidecarImage): unknown | undefined { return sidecar.read.kind === "loaded" ? sidecar.read.value : undefined; }

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

/** A resolved shape/principle capability is carried by the registry this catalogue loaded, at that exact version. */
function loadedEntry(capability: CapabilityId, shapes: PackShapeLookup | undefined, principles: PackPrincipleLookup | undefined): boolean {
  if (capability.version.kind !== "semver") return false;
  const [kind, ...rest] = capability.id.split(".");
  const lookup = kind === "shape" ? shapes : kind === "principle" ? principles : undefined;
  const version = (lookup?.get(rest.join("."))?.document as { readonly version?: unknown } | undefined)?.version;
  return version === capability.version.value;
}

/** A pack the handshake refused at registration because this deployment does not carry what it requires. */
export interface CapabilityRefusal {
  readonly source: string;
  readonly packId: string;
  readonly unmet: readonly CapabilityId[];
}

export class PackRegistry {
  readonly #records: Map<string, PackRecord>;
  readonly #digests: Map<string, PackRecord>;
  readonly #concepts: CompiledConceptRegistry;
  readonly #capabilities: RuntimeCapabilitySupport;
  readonly #capabilityRefusals: readonly CapabilityRefusal[];
  readonly #shapes: PackShapeLookup | undefined;
  readonly #principles: PackPrincipleLookup | undefined;
  readonly #measurementArtifacts: Map<string, MeasurementArtifacts>;
  readonly #measurementAdmissions = new Map<string, RecordedMeasurementAdmission>();
  readonly #measurementSources = new WeakMap<RecordedMeasurementSource, MeasurementSourceImage>();

  private constructor(records: ReadonlyMap<string, PackRecord>, concepts: CompiledConceptRegistry, capabilities: RuntimeCapabilitySupport, refusals: readonly CapabilityRefusal[], shapes: PackShapeLookup | undefined, principles: PackPrincipleLookup | undefined, artifacts: ReadonlyMap<string, MeasurementArtifacts>) {
    this.#records = new Map(records);
    this.#digests = new Map([...records.values()].map((record) => [record.digest, record]));
    this.#concepts = concepts;
    this.#capabilities = capabilities;
    this.#capabilityRefusals = Object.freeze([...refusals]);
    this.#shapes = shapes;
    this.#principles = principles;
    this.#measurementArtifacts = new Map(artifacts);
    for (const record of this.#digests.values()) this.#admitMeasurements(record);
  }

  #admitMeasurements(record: PackRecord): void {
    const sidecars = this.#measurementArtifacts.get(record.digest);
    const failed = (reason: "source_contract_invalid" | "source_lookup_failed") => Object.freeze({ kind: "failed" as const, reason });
    let admission: RecordedMeasurementAdmission;
    const reads = sidecars === undefined ? [] : [sidecars.ledger.read, sidecars.manifest.read];
    if (reads.some(read => read.kind === "read_failed")) admission = failed("source_lookup_failed");
    else if (reads.some(read => read.kind === "parse_failed")) admission = failed("source_contract_invalid");
    else if (sidecars === undefined) admission = Object.freeze({ kind: "unavailable", reason: "source_absent" });
    else {
      let ledgerDigest: string | undefined, manifestDigest: string | undefined;
      try {
        const digest = (value: unknown) => `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
        if (sidecars.ledger.read.kind === "loaded") ledgerDigest = digest(sidecars.ledger.read.value);
        if (sidecars.manifest.read.kind === "loaded") manifestDigest = digest(sidecars.manifest.read.value);
      } catch {
        // Each loaded artifact must be canonical JSON even when its counterpart is missing.
        this.#measurementAdmissions.set(record.digest, failed("source_contract_invalid"));
        return;
      }
      const issues: SourcingIssue[] = [];
      const ledger = sidecars.ledger.read.kind === "loaded" ? validateLedger(sidecars.ledger.read.value, issues) : undefined;
      const manifest = sidecars.manifest.read.kind === "loaded" ? validateManifest(sidecars.manifest.read.value, issues) : undefined;
      if (ledger !== undefined && manifest !== undefined) linkage(manifest, ledger, issues);
      if (issues.length > 0 || (ledger !== undefined
        && (ledger.packId !== record.document.id || ledger.packVersion !== record.document.version || ledger.packDigest !== record.digest))) admission = failed("source_contract_invalid");
      else if (ledger === undefined || manifest === undefined || ledgerDigest === undefined || manifestDigest === undefined) admission = Object.freeze({ kind: "unavailable", reason: "source_absent" });
      else {
        const link = (row: EvidenceRecord | EvidenceAbstention) => {
          const sourceOrdinal = manifest.entries.findIndex(entry => entry.sourceId === row.sourceId && entry.retrievedAt === row.retrievedAt);
          if (sourceOrdinal < 0) throw new TypeError("Validated measurement lost its original source linkage");
          return { sourceOrdinal, source: manifest.entries[sourceOrdinal]! };
        };
        const image: MeasurementSourceImage = freeze({ document: record.document, packDigest: record.digest, sidecars, ledger, manifest,
          ledgerDigest, manifestDigest,
          records: ledger.records.map((row, ordinal) => ({ ordinal, record: row, ...link(row) })),
          abstentions: ledger.abstentions.map((row, ordinal) => ({ ordinal, abstention: row, ...link(row) })),
        });
        const source = Object.freeze({}) as RecordedMeasurementSource;
        this.#measurementSources.set(source, image); admission = Object.freeze({ kind: "available", source });
      }
    }
    this.#measurementAdmissions.set(record.digest, admission);
  }

  /** Actual retained registration state only. Never reads disk, borrows a same-id pack or grades. */
  resolveRecordedMeasurementSource(packDigest: string): RecordedMeasurementAdmission {
    if (typeof packDigest !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(packDigest)) throw new TypeError("Measurement source requires an exact pack digest");
    return this.#measurementAdmissions.get(packDigest) ?? Object.freeze({ kind: "unavailable", reason: "source_absent" });
  }

  /** Issuing-registry/current-artifact membership, not digest equality or current permission. */
  readRecordedMeasurementSource(source: RecordedMeasurementSource): MeasurementSourceImage {
    const image = this.#measurementSources.get(source), current = image === undefined ? undefined : this.#measurementAdmissions.get(image.packDigest);
    if (image === undefined || current?.kind !== "available" || current.source !== source
      || this.#digests.get(image.packDigest)?.document !== image.document) throw new TypeError("Measurement source is foreign or no longer the registry's original artifact image");
    return image;
  }

  /** The configured capability identities this catalogue registered packs against (§4.2/§4.3). */
  get capabilities(): RuntimeCapabilitySupport {
    return this.#capabilities;
  }

  /**
   * The startup report of rfc/pack-capability-contract.md §5.1: packs excluded from the listing
   * because a required capability is `unsupported` on this deployment. The boot survives them.
   */
  capabilityRefusals(): readonly CapabilityRefusal[] {
    return this.#capabilityRefusals;
  }

  /**
   * §4.3 handshake for a registration after boot: refuses with PACK_CAPABILITY_UNSUPPORTED (HTTP 422)
   * carrying the exact unmet set. A `temporarily_unavailable` provider never reaches here — transient
   * health does not remove an identity from the supported set.
   */
  assertSupported(document: DrillPackDefinition): void {
    const unmet = unmetRequirements(document.requires ?? [], this.#capabilities);
    if (unmet.length > 0) {
      throw new ServerError("PACK_CAPABILITY_UNSUPPORTED", `Pack ${document.id} requires ${unmet.length} capabilit${unmet.length === 1 ? "y" : "ies"} this deployment does not carry: ${unmet.map(capabilityKey).join(", ")}`, { details: { packId: document.id, unmet } });
    }
  }

  /** The compiled concept registry every pack in this catalogue was validated against. */
  get concepts(): CompiledConceptRegistry {
    return this.#concepts;
  }

  /**
   * The complete-document artifacts this catalogue loaded from disk, as the concept migration's
   * built-in inventory (rfc/concept-registry.md §4). Hydrated stored packs are read by the
   * migration from their own rows, never from this mutable catalogue.
   */
  artifactInventory(): readonly { readonly digest: string; readonly document: DrillPackDefinition }[] {
    return freeze([...this.#digests.values()].map((record) => freeze({ digest: record.digest, document: record.document })));
  }

  static async fromDocuments(
    documents: readonly {
      readonly source: string;
      readonly value: unknown;
      readonly ledger?: unknown;
      readonly manifest?: unknown;
      readonly channel?: "official" | "community";
    }[],
    options: RegistrationOptions = {},
  ): Promise<PackRegistry> {
    return PackRegistry.#fromRegistrations(documents.map(({ source, value, ledger, manifest, channel = "official" }) => ({
      source, value, channel, sidecars: { ledger: providedSidecar(ledger), manifest: providedSidecar(manifest) },
    })), options);
  }

  static async #fromRegistrations(documents: readonly RegistrationInput[], options: RegistrationOptions): Promise<PackRegistry> {
    const concepts = options.concepts ?? installedConceptRegistry();
    assertCompiledConceptRegistry(concepts);
    const capabilities = options.capabilities ?? runtimeSupportedCapabilities();
    const refusals: CapabilityRefusal[] = [];
    const records = new Map<string, PackRecord>();
    const artifacts = new Map<string, MeasurementArtifacts>();
    const validated = documents.map(({ source, value, sidecars, channel }) => ({
      source, sidecars, channel,
      ledger: optionalValue(sidecars.ledger), manifest: optionalValue(sidecars.manifest),
      document: validatedDocument(structuredClone(value), source, options.shapes, options.principles, concepts),
    }));
    const siblings = new Map(validated.map(({ document }) => [document.id, {
      start: document.start,
      objective: { type: document.objective.type },
    }]));
    for (const entry of validated) {
      // Every document is fully validated above. Only sibling relations need the completed
      // catalogue; replaying schema/lint/objectives and the entire authored line here doubled boot work.
      const errors = packVariantIssues(entry.document, siblings).filter(issue => issue.severity === "error");
      if (errors.length > 0) {
        throw new ServerError("PACK_INVALID", `Pack ${entry.source} is invalid: ${errors.map((issue) => issue.message).join("; ")}`, { details: { source: entry.source, issues: errors } });
      }
      const document = freeze(entry.document);
      const { source, ledger, manifest, channel } = entry;
      // §4.3 / [[D1077]]: an `unsupported` requirement is a static deployment fact. The pack is
      // excluded from the listing and named in the startup report; the boot survives it ([[D468]]).
      const unmet = unmetRequirements(document.requires, capabilities).filter((capability) => !loadedEntry(capability, options.shapes, options.principles));
      if (unmet.length > 0) {
        refusals.push(freeze({ source, packId: document.id, unmet }));
        continue;
      }
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
      artifacts.set(digest, entry.sidecars);
      const grounding = assessmentGrounding({ document, documentDigest: digest, ledger, manifest });
      const positionEvidence = buildPositionEvidenceIndex({ ledger, grounding, packDigest: digest });
      const bindingIssues: SourcingIssue[] = [];
      const validatedLedger = validateLedger(ledger, bindingIssues);
      const recordedEvidence: PackRecord["recordedEvidence"] = grounding !== "ledger_verified"
        ? { state: "unverified" }
        : validatedLedger === undefined || bindingIssues.length > 0 || validatedLedger.packDigest !== digest
          ? { state: "invalid" }
          : { state: "verified", ledgerDigest: `sha256:${createHash("sha256").update(JSON.stringify(ledger)).digest("hex")}` };
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
        concepts: conceptLabels(document, concepts),
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
          recordedEvidence: freeze(recordedEvidence),
          boundClaimIds: Object.freeze(new Set(validBindings.map((binding) => binding.claimId))),
          claimBackings,
          channel,
        }),
      );
    }
    return new PackRegistry(records, concepts, capabilities, refusals, options.shapes, options.principles, artifacts);
  }

  static async loadDefault(
    options: {
      readonly development?: boolean;
      readonly draftFile?: string;
      readonly draftFiles?: readonly string[];
      readonly draftsDirectory?: string;
      readonly shapes?: PackShapeLookup;
      readonly principles?: PackPrincipleLookup;
      readonly concepts?: CompiledConceptRegistry;
      readonly capabilities?: RuntimeCapabilitySupport;
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
          sidecars: { ledger: await readSidecar(sidecars.ledger), manifest: await readSidecar(sidecars.manifest) },
          channel: productionPaths.includes(path) ? "official" as const : "community" as const,
        };
      }),
    );
    return PackRegistry.#fromRegistrations(documents, {
      replaceDuplicates: options.development === true,
      ...(options.shapes === undefined ? {} : { shapes: options.shapes }),
      ...(options.principles === undefined ? {} : { principles: options.principles }),
      ...(options.concepts === undefined ? {} : { concepts: options.concepts }),
      ...(options.capabilities === undefined ? {} : { capabilities: options.capabilities }),
    });
  }

  list(): readonly PackSummary[] {
    return freeze([...this.#records.values()].map((record) => record.summary).sort((left, right) => left.id.localeCompare(right.id)));
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

  /** Stored bytes and caller assertions are not validation authority. Every dynamic door uses the same reader. */
  #assertDynamicAdmission(document: DrillPackDefinition): void {
    const checked = validatePackDocument(document, {
      concepts: this.#concepts,
      ...(this.#shapes === undefined ? {} : { shapes: this.#shapes }),
      ...(this.#principles === undefined ? {} : { principles: this.#principles }),
      packs: { get: (id: string) => this.#records.get(id)?.document },
    });
    if (!checked.valid || checked.document === undefined) {
      const packId = typeof document?.id === "string" ? document.id : undefined;
      throw new ServerError("PACK_INVALID", `PACK_INVALID: Pack ${packId ?? "without a valid id"} cannot be admitted`, {
        details: { ...(packId === undefined ? {} : { packId }), issues: checked.issues.filter((issue) => issue.severity === "error") },
      });
    }
    this.assertSupported(checked.document);
  }

  addCommunity(
    document: DrillPackDefinition,
    digest: string,
    publisherHandle: string,
  ): PackRecord {
    this.#assertDynamicAdmission(document);
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
        concepts: conceptLabels(document, this.#concepts),
        reviewStatus: String(provenance.reviewStatus),
        channel: "community",
        publisherHandle,
      }),
      feedbackPolicy: raw.feedbackPolicy as FeedbackPolicy,
      assessmentGrounding: "unverified",
      positionEvidence: new Map(),
      recordedEvidence: freeze({ state: "unverified" as const }),
      boundClaimIds: Object.freeze(new Set<string>()),
      claimBackings: new Map<string, never>(),
      channel: "community",
      publisherHandle,
    });
    if (this.#records.get(document.id)?.channel !== "official") this.#records.set(document.id, record);
    this.#digests.set(digest, record);
    this.#measurementArtifacts.delete(digest);
    this.#admitMeasurements(record);
    return record;
  }

  addPlaytest(document: DrillPackDefinition, digest: string): PackRecord {
    this.#assertDynamicAdmission(document);
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
        concepts: conceptLabels(document, this.#concepts),
        reviewStatus: String(provenance.reviewStatus),
        channel: "community",
      }),
      feedbackPolicy: raw.feedbackPolicy as FeedbackPolicy,
      assessmentGrounding: "unverified",
      positionEvidence: new Map(),
      recordedEvidence: freeze({ state: "unverified" as const }),
      boundClaimIds: Object.freeze(new Set<string>()),
      claimBackings: new Map<string, never>(),
      channel: "community",
    });
    this.#digests.set(digest, record);
    this.#measurementArtifacts.delete(digest);
    this.#admitMeasurements(record);
    return record;
  }
}
