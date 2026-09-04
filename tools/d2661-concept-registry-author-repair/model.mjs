import { createHash } from "node:crypto";

export const LIVE_CONSUMERS = Object.freeze([
  "account.export",
  "pack.validation",
  "pack_studio.picker",
  "progress.related",
  "progress.write",
  "web.concept_label",
]);

export const SUCCESSOR_CONSUMERS = Object.freeze([
  "campaign.catalogue",
  "skills.credit",
]);

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

export function revisionBytes(previousDigest, entries) {
  return canonical({ schemaVersion: 1, previousDigest, entries: [...entries].sort((a, b) => a.id.localeCompare(b.id)) });
}

export function digestBytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function parsedRevision(bytes) {
  const document = JSON.parse(bytes);
  if (document.schemaVersion !== 1 || !(document.previousDigest === null || /^sha256:[a-f0-9]{64}$/u.test(document.previousDigest)) || !Array.isArray(document.entries)) {
    throw new TypeError("invalid registry revision");
  }
  const ids = new Set();
  const labels = new Set();
  for (const entry of document.entries) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(entry.id) || !["active", "retired"].includes(entry.status)) throw new TypeError("invalid registry entry");
    const label = entry.label.trim();
    if (label.length === 0 || ids.has(entry.id) || labels.has(label.toLocaleLowerCase("en-US"))) throw new TypeError("duplicate registry identity");
    ids.add(entry.id);
    labels.add(label.toLocaleLowerCase("en-US"));
  }
  return Object.freeze({ ...document, entries: Object.freeze(document.entries.map((entry) => Object.freeze({ ...entry }))) });
}

export class RevisionCatalogue {
  #bytes = new Map();
  #documents = new Map();
  #current = null;

  publish(bytes) {
    const document = parsedRevision(bytes);
    const digest = digestBytes(bytes);
    if (this.#bytes.has(digest)) throw new TypeError("registry revision already exists");
    if (document.previousDigest !== this.#current) throw new TypeError("registry revision does not extend current head");
    if (this.#current !== null) {
      const previous = this.#documents.get(this.#current);
      if (previous === undefined) throw new TypeError("missing previous registry revision");
      const currentById = new Map(document.entries.map((entry) => [entry.id, entry]));
      for (const oldEntry of previous.entries) {
        const next = currentById.get(oldEntry.id);
        if (next === undefined) throw new TypeError("registry ids are append-only");
        if (oldEntry.status === "retired" && next.status !== "retired") throw new TypeError("retired ids cannot reactivate");
      }
    }
    this.#bytes.set(digest, bytes);
    this.#documents.set(digest, document);
    this.#current = digest;
    return Object.freeze({ schemaVersion: 1, digest });
  }

  resolve(ref) {
    if (ref.registrySchemaVersion !== 1) throw new TypeError("unsupported registry schema");
    const document = this.#documents.get(ref.registryDigest);
    if (document === undefined) return Object.freeze({ kind: "registry_revision_unavailable", ref });
    const entry = document.entries.find((candidate) => candidate.id === ref.id);
    if (entry === undefined) throw new TypeError("concept absent from exact registry revision");
    return Object.freeze({ kind: "resolved", ref, label: entry.label, status: entry.status });
  }

  get currentDigest() { return this.#current; }
}

function parseLegacyKey(key) {
  const match = /^pack:([^#]+)#([a-z0-9]+(?:-[a-z0-9]+)*)$/u.exec(key);
  return match === null ? null : Object.freeze({ packId: match[1], rawId: match[2] });
}

const occurrenceReceipts = new WeakSet();
const packReceipts = new WeakSet();

export function compileHistoricalPack(bytes) {
  const document = JSON.parse(bytes);
  if (typeof document.id !== "string" || !Array.isArray(document.concepts) || !document.concepts.every((id) => typeof id === "string")) {
    throw new TypeError("invalid historical pack artifact");
  }
  const receipt = Object.freeze({ id: document.id, digest: digestBytes(bytes), concepts: Object.freeze([...document.concepts]) });
  packReceipts.add(receipt);
  return receipt;
}

export function recordHistoricalOccurrence(attempt, runSnapshot) {
  if (runSnapshot.id !== attempt.runId || runSnapshot.packId !== attempt.packId || runSnapshot.packDigest !== attempt.packDigest || !runSnapshot.branchIds.includes(attempt.branchId)) {
    throw new TypeError("attempt does not match recorded run occurrence");
  }
  const receipt = Object.freeze({ runId: attempt.runId, branchId: attempt.branchId, packId: attempt.packId, packDigest: attempt.packDigest });
  occurrenceReceipts.add(receipt);
  return receipt;
}

export function migrateLegacyConcept(row, occurrence, packArtifact, registry) {
  if (!occurrenceReceipts.has(occurrence)) throw new TypeError("unasserted historical occurrence");
  if (packArtifact !== null && !packReceipts.has(packArtifact)) throw new TypeError("unasserted historical pack artifact");
  const parsed = parseLegacyKey(row.conceptKey);
  const base = Object.freeze({ runId: row.runId, branchId: row.branchId, packId: row.packId, rawKey: row.conceptKey, storedLabel: row.label });
  const quarantine = (reason) => Object.freeze({ kind: "legacy_unverified", reason, ...base });
  if (parsed === null) return quarantine("malformed_key");
  if (parsed.packId !== row.packId) return quarantine("pack_mismatch");
  if (occurrence.runId !== row.runId || occurrence.branchId !== row.branchId || occurrence.packId !== row.packId) return quarantine("occurrence_mismatch");
  if (packArtifact === null || packArtifact.id !== occurrence.packId || packArtifact.digest !== occurrence.packDigest) return quarantine("pack_artifact_unavailable");
  if (!packArtifact.concepts.includes(parsed.rawId)) return quarantine("concept_absent_from_exact_pack");
  const resolved = registry.resolve({ id: parsed.rawId, registrySchemaVersion: 1, registryDigest: registry.currentDigest });
  if (resolved.kind !== "resolved") return quarantine("registry_revision_unavailable");
  return Object.freeze({
    kind: "registered",
    runId: row.runId,
    branchId: row.branchId,
    packId: row.packId,
    packDigest: occurrence.packDigest,
    conceptKey: `concept:${parsed.rawId}@1`,
    ref: resolved.ref,
    historicalLabel: resolved.label,
  });
}

export function assertConsumerClosure(imports) {
  const actual = [...new Set(imports)].sort();
  if (JSON.stringify(actual) !== JSON.stringify(LIVE_CONSUMERS)) throw new TypeError("live concept consumer set is not closed");
  return Object.freeze({ live: LIVE_CONSUMERS, pendingSuccessors: SUCCESSOR_CONSUMERS });
}
