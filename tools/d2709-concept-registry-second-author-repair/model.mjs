import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import ts from "typescript";

export const LIVE_CONSUMER_PATHS = Object.freeze([
  "apps/server/src/account-data.ts",
  "apps/server/src/pack-validation.ts",
  "apps/server/src/pack-studio.ts",
  "apps/server/src/progress.ts",
  "apps/server/src/storage.ts",
  "apps/web/src/lib/client.ts",
]);

export const SUCCESSOR_CONSUMERS = Object.freeze([
  "campaign.catalogue",
  "skills.credit",
]);

const utf8 = new TextEncoder();

function fail(message) {
  throw new TypeError(message);
}

function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label}:object`);
  const actual = Object.keys(value).sort().join("\0");
  const expected = [...keys].sort().join("\0");
  if (actual !== expected) fail(`${label}:keys`);
}

function scalarString(value, label, minimumBytes, maximumBytes) {
  if (typeof value !== "string" || value !== value.trim()) fail(`${label}:string`);
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) fail(`${label}:unicode-scalar`);
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      fail(`${label}:unicode-scalar`);
    }
  }
  const bytes = utf8.encode(value).byteLength;
  if (bytes < minimumBytes || bytes > maximumBytes) fail(`${label}:bytes`);
  return value;
}

function parseJsonWithoutDuplicateKeys(bytes, label) {
  if (typeof bytes !== "string") fail(`${label}:bytes`);
  const source = ts.parseJsonText(`${label}.json`, bytes);
  if (source.parseDiagnostics.length > 0 || source.statements.length !== 1 || !ts.isExpressionStatement(source.statements[0])) fail(`${label}:json`);
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const names = new Set();
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) fail(`${label}:shape`);
        if (names.has(property.name.text)) fail(`${label}:duplicate-key`);
        names.add(property.name.text);
      }
    }
    node.forEachChild(visit);
  };
  visit(source);
  try {
    return JSON.parse(bytes);
  } catch {
    fail(`${label}:json`);
  }
}

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function digestBytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function digestValue(value) {
  return digestBytes(canonical(value));
}

function conceptId(value, label = "concept-id") {
  const id = scalarString(value, label, 1, 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) fail(`${label}:grammar`);
  return id;
}

function digest(value, label) {
  if (typeof value !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(value)) fail(`${label}:digest`);
  return value;
}

export function revisionBytes(previousDigest, entries) {
  return canonical({
    entries: [...entries].sort((left, right) => left.id.localeCompare(right.id)),
    previousDigest,
    schemaVersion: 1,
  });
}

function parsedRevision(bytes) {
  const document = parseJsonWithoutDuplicateKeys(bytes, "registry-revision");
  exactKeys(document, ["schemaVersion", "previousDigest", "entries"], "registry-revision");
  if (document.schemaVersion !== 1 || !(document.previousDigest === null || /^sha256:[0-9a-f]{64}$/u.test(document.previousDigest)) || !Array.isArray(document.entries)) fail("registry-revision:shape");
  const ids = new Set();
  const labels = new Set();
  let previousId = null;
  const entries = document.entries.map((input, index) => {
    exactKeys(input, ["id", "label", "status"], `registry-entry:${index}`);
    const id = conceptId(input.id, `registry-entry:${index}:id`);
    const label = scalarString(input.label, `registry-entry:${index}:label`, 1, 100);
    if (!(["active", "retired"].includes(input.status))) fail(`registry-entry:${index}:status`);
    if (previousId !== null && previousId.localeCompare(id) >= 0) fail("registry-revision:order");
    previousId = id;
    const folded = label.toLocaleLowerCase("en-US");
    if (ids.has(id) || labels.has(folded)) fail("registry-revision:duplicate-identity");
    ids.add(id);
    labels.add(folded);
    return { id, label, status: input.status };
  });
  const parsed = { schemaVersion: 1, previousDigest: document.previousDigest, entries };
  if (bytes !== canonical(parsed)) fail("registry-revision:noncanonical");
  return deepFreeze(parsed);
}

export function parseConceptRef(input) {
  exactKeys(input, ["id", "registrySchemaVersion", "registryDigest"], "concept-ref");
  if (input.registrySchemaVersion !== 1) fail("concept-ref:schema");
  return deepFreeze({
    id: conceptId(input.id),
    registrySchemaVersion: 1,
    registryDigest: digest(input.registryDigest, "concept-ref"),
  });
}

export class RevisionCatalogue {
  #documents = new Map();
  #current = null;

  publish(bytes) {
    const document = parsedRevision(bytes);
    const revisionDigest = digestBytes(bytes);
    if (this.#documents.has(revisionDigest)) fail("registry-revision:exists");
    if (document.previousDigest !== this.#current) fail("registry-revision:head");
    if (this.#current !== null) {
      const prior = this.#documents.get(this.#current);
      const next = new Map(document.entries.map((entry) => [entry.id, entry]));
      for (const oldEntry of prior.entries) {
        const newEntry = next.get(oldEntry.id);
        if (newEntry === undefined) fail("registry-revision:append-only");
        if (oldEntry.status === "retired" && newEntry.status !== "retired") fail("registry-revision:reactivation");
      }
    }
    this.#documents.set(revisionDigest, document);
    this.#current = revisionDigest;
    return deepFreeze({ schemaVersion: 1, digest: revisionDigest });
  }

  resolve(input) {
    const ref = parseConceptRef(input);
    const document = this.#documents.get(ref.registryDigest);
    if (document === undefined) return deepFreeze({ kind: "registry_revision_unavailable", ref });
    const entry = document.entries.find((candidate) => candidate.id === ref.id);
    if (entry === undefined) fail("concept-ref:absent");
    return deepFreeze({ kind: "resolved", ref, label: entry.label, status: entry.status });
  }

  currentRef(id) {
    if (this.#current === null) fail("registry:empty");
    const ref = parseConceptRef({ id, registrySchemaVersion: 1, registryDigest: this.#current });
    const resolved = this.resolve(ref);
    if (resolved.kind !== "resolved") fail("registry:unavailable");
    return resolved;
  }

  get currentDigest() { return this.#current; }
}

function parseLegacyKey(key) {
  if (typeof key !== "string") return null;
  const match = /^pack:([^#]+)#([a-z0-9]+(?:-[a-z0-9]+)*)$/u.exec(key);
  return match === null ? null : { packId: match[1], rawId: match[2] };
}

function parsePackInventoryProjection(bytes, expectedDigest, expectedPackId) {
  if (digestBytes(bytes) !== expectedDigest) fail("pack-inventory:digest");
  const value = parseJsonWithoutDuplicateKeys(bytes, "pack-inventory");
  exactKeys(value, ["id", "concepts"], "pack-inventory");
  if (value.id !== expectedPackId || !Array.isArray(value.concepts)) fail("pack-inventory:identity");
  const concepts = value.concepts.map((item, index) => conceptId(item, `pack-inventory:concept:${index}`));
  if (new Set(concepts).size !== concepts.length) fail("pack-inventory:duplicate-concept");
  const parsed = { concepts, id: value.id };
  if (bytes !== canonical(parsed)) fail("pack-inventory:noncanonical");
  return deepFreeze(parsed);
}

function parseRunSnapshot(bytes) {
  const value = parseJsonWithoutDuplicateKeys(bytes, "run-snapshot");
  exactKeys(value, ["id", "packId", "packDigest", "branchIds"], "run-snapshot");
  if (typeof value.id !== "string" || typeof value.packId !== "string" || !Array.isArray(value.branchIds) || !value.branchIds.every((item) => typeof item === "string") || new Set(value.branchIds).size !== value.branchIds.length) fail("run-snapshot:shape");
  digest(value.packDigest, "run-snapshot");
  return deepFreeze(structuredClone(value));
}

function migrationInput(database) {
  return database.prepare(`
    SELECT c.row_id, c.run_id, c.branch_id, c.pack_id, c.concept_key, c.label,
           a.pack_digest, r.snapshot_json
    FROM attempt_concepts c
    LEFT JOIN attempts a ON a.run_id=c.run_id AND a.branch_id=c.branch_id
    LEFT JOIN drill_runs r ON r.id=c.run_id
    ORDER BY c.row_id
  `).all();
}

function classifyRow(database, row, registry) {
  const base = { rowId: row.row_id, runId: row.run_id, branchId: row.branch_id, packId: row.pack_id, rawKey: row.concept_key, storedLabel: row.label };
  const quarantine = (reason) => ({ kind: "legacy_unverified", reason, ...base });
  if (typeof row.pack_digest !== "string" || typeof row.snapshot_json !== "string") return quarantine("occurrence_unavailable");
  let run;
  try { run = parseRunSnapshot(row.snapshot_json); } catch { return quarantine("run_snapshot_invalid"); }
  if (run.id !== row.run_id || run.packId !== row.pack_id || run.packDigest !== row.pack_digest || !run.branchIds.includes(row.branch_id)) return quarantine("occurrence_mismatch");
  const parsed = parseLegacyKey(row.concept_key);
  if (parsed === null) return quarantine("malformed_key");
  if (parsed.packId !== row.pack_id) return quarantine("pack_mismatch");
  const artifact = database.prepare("SELECT projection_json FROM installed_pack_artifacts WHERE pack_id=? AND digest=?").get(row.pack_id, row.pack_digest);
  if (artifact === undefined || typeof artifact.projection_json !== "string") return quarantine("pack_artifact_unavailable");
  let pack;
  try { pack = parsePackInventoryProjection(artifact.projection_json, row.pack_digest, row.pack_id); } catch { return quarantine("pack_artifact_invalid"); }
  if (!pack.concepts.includes(parsed.rawId)) return quarantine("concept_absent_from_exact_pack");
  let resolved;
  try { resolved = registry.currentRef(parsed.rawId); } catch { return quarantine("concept_unknown"); }
  if (resolved.status !== "active" && resolved.status !== "retired") fail("registry:status");
  return deepFreeze({
    kind: "registered",
    rowId: row.row_id,
    runId: row.run_id,
    branchId: row.branch_id,
    packId: row.pack_id,
    packDigest: row.pack_digest,
    conceptKey: `concept:${parsed.rawId}@1`,
    ref: resolved.ref,
    historicalLabel: resolved.label,
  });
}

export function migrateLegacyConceptBatch(database, registry, options = {}) {
  const existing = database.prepare("SELECT input_digest, receipt_json FROM concept_migration_receipts WHERE version=1").get();
  const rows = migrationInput(database);
  const inputDigest = digestValue(rows);
  if (existing !== undefined) {
    if (existing.input_digest !== inputDigest) fail("migration:restart-input-changed");
    return deepFreeze(JSON.parse(existing.receipt_json));
  }
  database.exec("BEGIN IMMEDIATE");
  try {
    const registered = [];
    const quarantined = [];
    const keys = new Set();
    let writes = 0;
    for (const row of rows) {
      const projected = classifyRow(database, row, registry);
      if (projected.kind === "registered") {
        const collisionKey = `${projected.runId}\0${projected.branchId}\0${projected.conceptKey}`;
        if (keys.has(collisionKey)) fail("migration:key-collision");
        keys.add(collisionKey);
        database.prepare("INSERT INTO registered_attempt_concepts (source_row_id,run_id,branch_id,pack_id,pack_digest,concept_key,concept_ref_json,historical_label) VALUES (?,?,?,?,?,?,?,?)").run(projected.rowId, projected.runId, projected.branchId, projected.packId, projected.packDigest, projected.conceptKey, canonical(projected.ref), projected.historicalLabel);
        registered.push(projected.rowId);
      } else {
        database.prepare("INSERT INTO attempt_concept_legacy (source_row_id,run_id,branch_id,pack_id,raw_key,stored_label,reason) VALUES (?,?,?,?,?,?,?)").run(projected.rowId, projected.runId, projected.branchId, projected.packId, projected.rawKey, projected.storedLabel, projected.reason);
        quarantined.push(projected.rowId);
      }
      writes += 1;
      if (options.failAfterWrites === writes) fail("migration:injected-write-failure");
    }
    const inputIds = rows.map((row) => row.row_id);
    const outputIds = [...registered, ...quarantined].sort((left, right) => left - right);
    if (registered.some((id) => quarantined.includes(id)) || canonical(inputIds) !== canonical(outputIds)) fail("migration:partition");
    const receipt = deepFreeze({
      version: 1,
      registryDigest: registry.currentDigest,
      inputDigest,
      inputRowIds: inputIds,
      registeredRowIds: registered,
      quarantinedRowIds: quarantined,
      partitionDigest: digestValue({ inputIds, registered, quarantined }),
    });
    database.prepare("INSERT INTO concept_migration_receipts (version,input_digest,receipt_json) VALUES (1,?,?)").run(inputDigest, canonical(receipt));
    database.exec("COMMIT");
    return receipt;
  } catch (error) {
    try { database.exec("ROLLBACK"); } catch { /* retain primary error */ }
    throw error;
  }
}

function git(repositoryRoot, args) {
  try {
    return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    fail(`consumer-graph:git-${args[0]}`);
  }
}

function importsConceptAuthority(sourceText, fileName) {
  const source = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, fileName.endsWith(".svelte") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  let imports = 0;
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === "@chess-tabiya/runtime/concepts") imports += 1;
    node.forEachChild(visit);
  };
  visit(source);
  return imports;
}

export function assertConsumerClosureFromRepository(repositoryRoot, revision) {
  const commit = git(repositoryRoot, ["rev-parse", "--verify", `${revision}^{commit}`]).trim();
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail("consumer-graph:commit");
  const paths = git(repositoryRoot, ["ls-tree", "-r", "--name-only", "-z", commit]).split("\0").filter((item) => /\.(?:ts|svelte)$/u.test(item));
  const importers = [];
  for (const file of paths) {
    const text = git(repositoryRoot, ["show", `${commit}:${file}`]);
    const imports = importsConceptAuthority(text, file);
    if (imports > 1) fail(`consumer-graph:duplicate-import:${file}`);
    if (imports === 1) importers.push(file);
    if (file !== "packages/runtime/src/concepts.ts" && /class\s+PackScopedConceptResolver\b|pack:\$\{|content\/concepts\/(?:current|revisions)/u.test(text)) fail(`consumer-graph:local-authority:${file}`);
  }
  const actual = [...importers].sort();
  const expected = [...LIVE_CONSUMER_PATHS].sort();
  if (canonical(actual) !== canonical(expected)) fail("consumer-graph:closure");
  return deepFreeze({ repositoryCommit: commit, live: actual, pendingSuccessors: SUCCESSOR_CONSUMERS });
}

export function canonicalPackProjection(packId, concepts) {
  return canonical({ concepts, id: packId });
}

export function canonicalRunSnapshot(id, packId, packDigest, branchIds) {
  return canonical({ branchIds, id, packDigest, packId });
}
