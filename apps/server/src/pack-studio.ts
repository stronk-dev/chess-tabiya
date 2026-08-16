import { createHash, randomUUID } from "node:crypto";

import { canonicalizeJson, type DrillPackDefinition, type JsonValue } from "@chess-tabiya/schema/drill-pack";

import type { Principal } from "./authorization.js";
import { ServerError } from "./errors.js";
import { PackRegistry } from "./pack-registry.js";
import { graduationEntryIsBlocking, validatePackDocument, type PackValidationResult } from "./pack-validation.js";
import { SQLiteRunStorage, type StoredPackDraft } from "./storage.js";
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
}

export class PackStudio {
  readonly #storage: SQLiteRunStorage;
  readonly #registry: PackRegistry;
  readonly #shapes: ShapeRegistry | undefined;

  constructor(storage: SQLiteRunStorage, registry: PackRegistry, shapes?: ShapeRegistry) {
    this.#storage = storage;
    this.#registry = registry;
    this.#shapes = shapes;
  }

  hydrate(): void {
    for (const row of this.#storage.playtestDocuments()) {
      this.#registry.addPlaytest(row.document as DrillPackDefinition, row.digest);
    }
    for (const row of this.#storage.registeredPacks()) {
      this.#registry.addCommunity(row.document as DrillPackDefinition, row.digest, row.publisherHandle);
    }
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
    const document = structuredClone(input.document) as Record<string, unknown>;
    const id = randomUUID();
    const row: StoredPackDraft = Object.freeze({
      id, packId: String(document.id ?? "untitled"), ownerLearnerId: principal.learnerId,
      document, digest: digest(document), state: "draft", seedKind: input.seedKind ?? "blank",
      seedRef: input.seedRef ?? null, createdAt: at, updatedAt: at,
    });
    this.#storage.createPackDraft(row);
    return this.#view(row);
  }

  lint(document: unknown): PackValidationResult {
    return validatePackDocument(document, { ...(this.#shapes === undefined ? {} : { shapes: this.#shapes }) });
  }

  update(id: string, principal: Principal, expectedDigest: string, document: unknown, at = new Date().toISOString()): StudioDraftView {
    const current = this.required(id, principal);
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
    this.#storage.storePlaytestDocument(draft.digest, draft.id, draft.document, at);
    return this.#registry.addPlaytest(draft.validation.document, draft.digest);
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
    const validation = validatePackDocument(raw, { ...(this.#shapes === undefined ? {} : { shapes: this.#shapes }) });
    if (!validation.valid || validation.document === undefined) {
      throw new ServerError("PACK_INVALID", "Draft cannot be registered while validation errors remain", { details: { issues: validation.issues } });
    }
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
    if (row === undefined) throw new ServerError("PACK_NOT_FOUND", `Unknown community pack: ${packId}`);
    return Object.freeze({ format: "chess-tabiya-pack", version: 1, document: row.document, digest: row.digest, publisherHandle: row.publisherHandle });
  }

  #view(row: StoredPackDraft): StudioDraftView {
    return Object.freeze({ ...row, validation: validatePackDocument(row.document, { ...(this.#shapes === undefined ? {} : { shapes: this.#shapes }) }) });
  }
}
