import { createHash, randomUUID } from "node:crypto";

import { canonicalizeJson, type DrillPackDefinition, type JsonValue } from "@chess-tabiya/schema/drill-pack";
import { conceptCatalogueView, type ConceptCatalogueView } from "@chess-tabiya/runtime";

import type { Principal } from "./authorization.js";
import { ServerError } from "./errors.js";
import { PackRegistry } from "./pack-registry.js";
import {
  graduationEntryIsBlocking,
  validatePackDocument,
  type PackPrincipleLookup,
  type PackShapeLookup,
  type PackSiblingLookup,
  type PackValidationResult,
} from "./pack-validation.js";
import { SQLiteRunStorage, type StoredPackDraft } from "./storage.js";
import { withDerivedRequires, type CapabilityEntryLookup } from "./capability/pack-capabilities.js";
import type { ShapeRegistry } from "./shape-registry.js";

function digest(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value as JsonValue)).digest("hex")}`;
}

function draftStatus(document: unknown): string | undefined {
  const provenance = (document as Record<string, unknown>)?.provenance;
  return provenance !== null && typeof provenance === "object"
    ? String((provenance as Record<string, unknown>).reviewStatus ?? "")
    : undefined;
}

function semver(value: string): readonly number[] {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(value);
  if (match === null) throw new ServerError("INVALID_REQUEST", `Invalid semver: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function greater(a: string, b: string): boolean {
  const left = semver(a); const right = semver(b);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index]! > right[index]!;
  }
  return false;
}

export interface StudioDraftView extends StoredPackDraft {
  readonly validation: PackValidationResult;
  /** The exact concept registry the validation resolved `concepts[]` against (rfc/concept-registry.md §3). */
  readonly conceptRegistryDigest: string;
}

export interface PackHydrationRefusal {
  readonly source: "playtest" | "community";
  readonly digest: string;
  readonly code: "PACK_INVALID" | "PACK_CAPABILITY_UNSUPPORTED";
}

export class PackStudio {
  readonly #storage: SQLiteRunStorage;
  readonly #registry: PackRegistry;
  readonly #shapes: PackShapeLookup | undefined;
  readonly #principles: PackPrincipleLookup;
  readonly #packs: PackSiblingLookup;

  constructor(
    storage: SQLiteRunStorage,
    registry: PackRegistry,
    shapes: ShapeRegistry | undefined,
    principles: PackPrincipleLookup,
  ) {
    this.#storage = storage;
    this.#registry = registry;
    this.#shapes = shapes;
    this.#principles = principles;
    this.#packs = Object.freeze({ get: (id: string) => registry.get(id)?.document });
  }

  hydrate(): readonly PackHydrationRefusal[] {
    const refusals: PackHydrationRefusal[] = [];
    const admit = (source: PackHydrationRefusal["source"], digest: string, insert: () => void): void => {
      try {
        insert();
      } catch (error) {
        // A persisted pre-contract document is retained, not silently restamped or served.
        // Provider outages do not remove configured identities and cannot trigger this refusal.
        if (!(error instanceof ServerError) || (error.code !== "PACK_INVALID" && error.code !== "PACK_CAPABILITY_UNSUPPORTED")) throw error;
        refusals.push(Object.freeze({ source, digest, code: error.code }));
      }
    };
    for (const row of this.#storage.playtestDocuments()) {
      admit("playtest", row.digest, () => { this.#registry.addPlaytest(row.document as DrillPackDefinition, row.digest); });
    }
    for (const row of this.#storage.registeredPacks()) {
      admit("community", row.digest, () => { this.#registry.addCommunity(row.document as DrillPackDefinition, row.digest, row.publisherHandle); });
    }
    return Object.freeze(refusals);
  }

  list(principal: Principal): readonly StudioDraftView[] {
    return Object.freeze(this.#storage.packDrafts(principal.learnerId).map((row) => this.#view(row)));
  }

  required(id: string, principal: Principal): StudioDraftView {
    const row = this.#storage.packDraft(id, principal.learnerId);
    if (row === undefined) throw new ServerError("RUN_NOT_FOUND", `Unknown draft: ${id}`);
    return this.#view(row);
  }

  create(principal: Principal, input: { readonly document: unknown; readonly seedKind?: StoredPackDraft["seedKind"]; readonly seedRef?: string }, at = new Date().toISOString()): StudioDraftView {
    if (draftStatus(input.document) !== "draft") {
      throw new ServerError("PROVENANCE_STATUS_NOT_WRITABLE", "Studio documents must remain draft until registration");
    }
    const document = this.#stamp(structuredClone(input.document)) as Record<string, unknown>;
    const id = randomUUID();
    const row: StoredPackDraft = Object.freeze({
      id, packId: String(document.id ?? "untitled"), ownerLearnerId: principal.learnerId,
      document, digest: digest(document), state: "draft", seedKind: input.seedKind ?? "blank",
      seedRef: input.seedRef ?? null, createdAt: at, updatedAt: at,
    });
    this.#storage.createPackDraft(row);
    return this.#view(row);
  }

  lint(document: unknown): PackValidationResult & { readonly conceptRegistryDigest: string } {
    return Object.freeze({ ...validatePackDocument(this.#stamp(document), this.#validationOptions()), conceptRegistryDigest: this.#registry.concepts.digest });
  }

  /**
   * Consumer 2 of rfc/concept-registry.md §2: the picker's catalogue, projected from the one
   * compiled registry. Active entries are offered; retired ones are shown only as retired.
   */
  conceptCatalogue(): ConceptCatalogueView {
    return conceptCatalogueView(this.#registry.concepts);
  }

  update(id: string, principal: Principal, expectedDigest: string, input: unknown, at = new Date().toISOString()): StudioDraftView {
    const current = this.required(id, principal);
    const document = this.#stamp(input);
    if (draftStatus(document) !== "draft") {
      throw new ServerError("PROVENANCE_STATUS_NOT_WRITABLE", "Studio documents must remain draft until registration");
    }
    const nextDigest = digest(document);
    if (!this.#storage.updatePackDraft(id, principal.learnerId, expectedDigest, document, nextDigest, at)) {
      throw new ServerError("DRAFT_STALE", "Draft changed in another editor", { details: { digest: current.digest } });
    }
    return this.required(id, principal);
  }

  withdraw(id: string, principal: Principal): void {
    if (!this.#storage.withdrawPackDraft(id, principal.learnerId)) {
      throw new ServerError("RUN_NOT_FOUND", `Unknown mutable draft: ${id}`);
    }
  }

  playtest(id: string, principal: Principal, at = new Date().toISOString()) {
    const draft = this.required(id, principal);
    if (!draft.validation.valid || draft.validation.document === undefined) {
      throw new ServerError("PACK_INVALID", "Only a validation-clean draft can be playtested", { details: { issues: draft.validation.issues } });
    }
    const record = this.#registry.addPlaytest(draft.validation.document, draft.digest);
    this.#storage.storePlaytestDocument(draft.digest, draft.id, draft.document, at);
    return record;
  }

  register(id: string, principal: Principal, at = new Date().toISOString()) {
    const draft = this.required(id, principal);
    const raw = structuredClone(draft.document) as Record<string, unknown>;
    const provenance = raw.provenance as Record<string, unknown>;
    const blockers = provenance.graduationBlockers;
    if (Array.isArray(blockers) && blockers.some(graduationEntryIsBlocking)) {
      throw new ServerError("GRADUATION_BLOCKERS_OUTSTANDING", "Clear declared graduation blockers before registration");
    }
    provenance.reviewStatus = "published";
    // The review status is a closed member, so publication re-derives the stamp.
    const stamped = this.#stamp(raw) as Record<string, unknown>;
    for (const key of Object.keys(raw)) delete raw[key];
    Object.assign(raw, stamped);
    const validation = validatePackDocument(raw, this.#validationOptions());
    if (!validation.valid || validation.document === undefined) {
      throw new ServerError("PACK_INVALID", "Draft cannot be registered while validation errors remain", { details: { issues: validation.issues } });
    }
    // rfc/pack-capability-contract.md §4.3: refuse, on the 422 arm, a pack this deployment cannot carry.
    this.#registry.assertSupported(validation.document);
    if (raw.id === "drafts" || this.#registry.get(String(raw.id))?.channel === "official") {
      throw new ServerError("PACK_ID_RESERVED", `Pack id ${String(raw.id)} is reserved by the official catalogue`);
    }
    const existing = this.#storage.registeredPacks().filter((row) => row.packId === raw.id);
    if (existing.some((row) => row.version === raw.version)) throw new ServerError("PACK_VERSION_EXISTS", "That pack version already exists");
    if (existing.some((row) => row.publisherLearnerId !== principal.learnerId)) throw new ServerError("PACK_ID_NOT_YOURS", "This pack id belongs to another publisher");
    if (existing.length > 0 && !existing.every((row) => greater(String(raw.version), row.version))) {
      throw new ServerError("PACK_VERSION_NOT_INCREASING", "A new version must be greater than every registered version");
    }
    const nextDigest = digest(raw);
    this.#storage.registerPackDraft({
      packId: String(raw.id), version: String(raw.version), digest: nextDigest,
      document: raw, publisherHandle: principal.handle, publisherLearnerId: principal.learnerId,
      draftId: id, registeredAt: at,
    });
    return this.#registry.addCommunity(validation.document, nextDigest, principal.handle);
  }

  export(packId: string, principal: Principal) {
    const row = [...this.#storage.registeredPacks()].reverse().find((candidate) => candidate.packId === packId);
    if (row !== undefined) return Object.freeze({ format: "chess-tabiya-pack", version: 1, document: row.document, digest: row.digest, publisherHandle: row.publisherHandle });
    const served = this.#registry.get(packId);
    if (served === undefined) throw new ServerError("PACK_NOT_FOUND", `Unknown served pack: ${packId}`);
    return Object.freeze({ format: "chess-tabiya-pack", version: 1, document: served.document, digest: served.digest, ...(served.publisherHandle === undefined ? {} : { publisherHandle: served.publisherHandle }) });
  }

  /**
   * rfc/pack-capability-contract.md §4.1: `requires` is derived, never authored, and every writer calls
   * the one stamping function before digesting. A document the derivation cannot walk (malformed, an
   * unknown shape) is stored as sent; validation then names its defect.
   */
  #stamp(document: unknown): unknown {
    if (document === null || typeof document !== "object" || Array.isArray(document)) return document;
    try {
      return withDerivedRequires(document as Record<string, unknown>, {
        ...(this.#shapes === undefined ? {} : { shapes: this.#shapes }),
        principles: this.#principles as unknown as CapabilityEntryLookup,
      });
    } catch {
      return document;
    }
  }

  #validationOptions() {
    return {
      ...(this.#shapes === undefined ? {} : { shapes: this.#shapes }),
      principles: this.#principles,
      packs: this.#packs,
      concepts: this.#registry.concepts,
    };
  }

  #view(row: StoredPackDraft): StudioDraftView {
    return Object.freeze({ ...row, validation: validatePackDocument(row.document, this.#validationOptions()), conceptRegistryDigest: this.#registry.concepts.digest });
  }
}
