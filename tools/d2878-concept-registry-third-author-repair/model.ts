// DISPOSABLE author contract for D2878-D2884. Not production code.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { type DatabaseSync } from "node:sqlite";

import { readBackReplay } from "@chess-tabiya/runtime";
import ts from "typescript";

import { PackRegistry } from "../../apps/server/src/pack-registry.js";

const utf8 = new TextEncoder();
const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const conceptPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export const CONSUMER_OPERATIONS = Object.freeze({
  "apps/server/src/account-data.ts": "validateConceptExport",
  "apps/server/src/pack-validation.ts": "validatePackConcepts",
  "apps/server/src/pack-studio.ts": "listActiveConcepts",
  "apps/server/src/progress.ts": "resolveAttemptConcept",
  "apps/server/src/storage.ts": "queryRelatedAttempts",
  "apps/web/src/lib/client.ts": "renderConceptLabel",
} as const);

export type ConceptEntry = Readonly<{ id: string; label: string; status: "active" | "retired" }>;
type Revision = Readonly<{ schemaVersion: 1; previousDigest: string | null; entries: readonly ConceptEntry[] }>;
type ConceptRef = Readonly<{ id: string; registrySchemaVersion: 1; registryDigest: string }>;
type ResolvedConcept = Readonly<
  | { kind: "resolved"; ref: ConceptRef; label: string; status: "active" | "retired" }
  | { kind: "registry_revision_unavailable"; ref: ConceptRef }
>;

export function digestBytes(bytes: string): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort(compareCodeUnits).map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

export function labelCollisionKey(value: string): string {
  if (process.versions.unicode !== "17.0") fail("registry-label:unicode-version");
  const normalized = value.normalize("NFKC").toLowerCase();
  return [...normalized].map((character) => character === "ß" ? "ss" : character === "ς" ? "σ" : character).join("").normalize("NFC");
}

export function revisionBytes(previousDigest: string | null, entries: readonly ConceptEntry[]): string {
  return canonical({ entries: [...entries].sort((left, right) => compareCodeUnits(left.id, right.id)), previousDigest, schemaVersion: 1 });
}

export function headBytes(digest: string): string {
  return canonical({ digest, schemaVersion: 1 });
}

export class CompiledConceptRegistry {
  readonly #history: ReadonlyMap<string, Revision>;
  readonly currentDigest: string;

  constructor(currentDigest: string, history: ReadonlyMap<string, Revision>) {
    this.currentDigest = currentDigest;
    this.#history = history;
    deepFreeze(this);
  }

  resolve(input: unknown): ResolvedConcept {
    const ref = parseConceptRef(input);
    const revision = this.#history.get(ref.registryDigest);
    if (revision === undefined) return deepFreeze({ kind: "registry_revision_unavailable", ref });
    const entry = revision.entries.find((candidate) => candidate.id === ref.id);
    if (entry === undefined) fail("concept-ref:absent");
    return deepFreeze({ kind: "resolved", ref, label: entry.label, status: entry.status });
  }

  currentRef(id: string): Readonly<{ ref: ConceptRef; label: string; status: "active" | "retired" }> {
    const resolved = this.resolve({ id, registrySchemaVersion: 1, registryDigest: this.currentDigest });
    if (resolved.kind !== "resolved") fail("registry:concept-unknown");
    return deepFreeze({ ref: resolved.ref, label: resolved.label, status: resolved.status });
  }
}

function parseConceptRef(input: unknown): ConceptRef {
  exactKeys(input, ["id", "registryDigest", "registrySchemaVersion"], "concept-ref");
  if (input.registrySchemaVersion !== 1 || typeof input.registryDigest !== "string" || !digestPattern.test(input.registryDigest)) fail("concept-ref:shape");
  const id = boundedScalar(input.id, "concept-ref:id", 1, 80);
  if (!conceptPattern.test(id)) fail("concept-ref:id");
  return deepFreeze({ id, registrySchemaVersion: 1, registryDigest: input.registryDigest });
}

export function compileConceptRegistry(headSource: string, revisionFiles: Readonly<Record<string, string>>): CompiledConceptRegistry {
  const head = parseJson(headSource, "registry-head");
  exactKeys(head, ["digest", "schemaVersion"], "registry-head");
  if (head.schemaVersion !== 1 || typeof head.digest !== "string" || !digestPattern.test(head.digest)) fail("registry-head:shape");
  if (headSource !== canonical(head)) fail("registry-head:noncanonical");

  const chain: readonly { digest: string; revision: Revision }[] = (() => {
    const rows: { digest: string; revision: Revision }[] = [];
    const visited = new Set<string>();
    let cursor: string | null = head.digest;
    while (cursor !== null) {
      if (visited.has(cursor)) fail("registry-history:cycle");
      visited.add(cursor);
      const file = `${cursor.slice("sha256:".length)}.json`;
      const bytes = revisionFiles[file];
      if (bytes === undefined) fail("registry-history:missing-revision");
      if (digestBytes(bytes) !== cursor) fail("registry-history:misnamed-revision");
      const revision = parseRevision(bytes);
      rows.push({ digest: cursor, revision });
      cursor = revision.previousDigest;
    }
    if (Object.keys(revisionFiles).some((file) => !visited.has(`sha256:${file.replace(/\.json$/u, "")}`))) fail("registry-history:orphan-revision");
    return rows;
  })();

  const history = new Map<string, Revision>();
  let prior: Revision | undefined;
  for (const row of [...chain].reverse()) {
    if (prior !== undefined) {
      const current = new Map(row.revision.entries.map((entry) => [entry.id, entry]));
      for (const oldEntry of prior.entries) {
        const next = current.get(oldEntry.id);
        if (next === undefined) fail("registry-history:id-removed");
        if (oldEntry.status === "retired" && next.status !== "retired") fail("registry-history:reactivated");
      }
    }
    history.set(row.digest, row.revision);
    prior = row.revision;
  }
  return new CompiledConceptRegistry(head.digest, history);
}

function parseRevision(bytes: string): Revision {
  const value = parseJson(bytes, "registry-revision");
  exactKeys(value, ["entries", "previousDigest", "schemaVersion"], "registry-revision");
  if (value.schemaVersion !== 1 || !(value.previousDigest === null || (typeof value.previousDigest === "string" && digestPattern.test(value.previousDigest))) || !Array.isArray(value.entries)) fail("registry-revision:shape");
  const ids = new Set<string>();
  const labels = new Set<string>();
  let previousId: string | null = null;
  const entries = value.entries.map((raw, index): ConceptEntry => {
    exactKeys(raw, ["id", "label", "status"], `registry-entry:${index}`);
    const id = boundedScalar(raw.id, `registry-entry:${index}:id`, 1, 80);
    const label = boundedScalar(raw.label, `registry-entry:${index}:label`, 1, 100);
    if (!conceptPattern.test(id) || !["active", "retired"].includes(String(raw.status))) fail(`registry-entry:${index}:shape`);
    if (previousId !== null && compareCodeUnits(previousId, id) >= 0) fail("registry-revision:order");
    previousId = id;
    const folded = labelCollisionKey(label);
    if (ids.has(id) || labels.has(folded)) fail("registry-revision:duplicate-identity");
    ids.add(id);
    labels.add(folded);
    return deepFreeze({ id, label, status: raw.status as "active" | "retired" });
  });
  const parsed = deepFreeze({ schemaVersion: 1 as const, previousDigest: value.previousDigest as string | null, entries });
  if (bytes !== canonical(parsed)) fail("registry-revision:noncanonical");
  return parsed;
}

type SourceKey = Readonly<{ runId: string; branchId: string; conceptKey: string }>;
type ProjectedRow = Readonly<{
  source: SourceKey;
  packId: string;
  packDigest: string | null;
  storedLabel: string;
  kind: "registered" | "legacy_unverified";
  reason?: string;
  targetKey?: string;
  ref?: ConceptRef;
  historicalLabel?: string;
}>;

export type MigrationReceipt = Readonly<{
  version: 1;
  registryDigest: string;
  inputDigest: string;
  artifactDigest: string;
  sourceKeys: readonly string[];
  registeredKeys: readonly string[];
  quarantinedKeys: readonly string[];
  outputDigest: string;
}>;

export function migrateLegacyConceptBatch(
  database: DatabaseSync,
  registry: CompiledConceptRegistry,
  packs: PackRegistry,
  options: Readonly<{ failAfterWrites?: number; afterBegin?: () => void }> = {},
): MigrationReceipt {
  if (!(registry instanceof CompiledConceptRegistry) || !(packs instanceof PackRegistry)) fail("migration:authority");
  database.exec("BEGIN IMMEDIATE");
  try {
    options.afterBegin?.();
    const rows = migrationInput(database);
    const projected = rows.map((row) => classifyRow(row, registry, packs));
    const sourceKeys = rows.map(sourceKeyText);
    const artifacts = [...new Set(rows.map((row) => row.pack_digest).filter((value): value is string => typeof value === "string"))]
      .sort(compareCodeUnits)
      .map((digest) => {
        const record = packs.byDigest(digest);
        return record === undefined ? { digest, document: null } : { digest, document: record.document };
      });
    const inputDigest = digestBytes(canonical(rows));
    const artifactDigest = digestBytes(canonical(artifacts));
    const existing = database.prepare("SELECT input_digest,registry_digest,artifact_digest,receipt_json FROM concept_migration_receipts WHERE version=1").get() as Record<string, unknown> | undefined;
    if (existing !== undefined) {
      const receipt = parseReceipt(existing.receipt_json);
      if (existing.input_digest !== inputDigest || existing.registry_digest !== registry.currentDigest || existing.artifact_digest !== artifactDigest
        || receipt.inputDigest !== inputDigest || receipt.registryDigest !== registry.currentDigest || receipt.artifactDigest !== artifactDigest) fail("migration:restart-preimage-changed");
      validateOutputs(database, receipt);
      database.exec("COMMIT");
      return receipt;
    }

    const registeredKeys: string[] = [];
    const quarantinedKeys: string[] = [];
    const targets = new Set<string>();
    let writes = 0;
    for (const row of projected) {
      const source = sourceKeyText(row.source);
      if (row.kind === "registered") {
        if (row.targetKey === undefined || row.ref === undefined || row.historicalLabel === undefined || targets.has(`${row.source.runId}\0${row.source.branchId}\0${row.targetKey}`)) fail("migration:key-collision");
        targets.add(`${row.source.runId}\0${row.source.branchId}\0${row.targetKey}`);
        database.prepare("INSERT INTO registered_attempt_concepts (source_run_id,source_branch_id,source_concept_key,run_id,branch_id,pack_id,pack_digest,concept_key,concept_ref_json,historical_label) VALUES (?,?,?,?,?,?,?,?,?,?)")
          .run(row.source.runId, row.source.branchId, row.source.conceptKey, row.source.runId, row.source.branchId, row.packId, row.packDigest, row.targetKey, canonical(row.ref), row.historicalLabel);
        registeredKeys.push(source);
      } else {
        if (row.reason === undefined) fail("migration:quarantine-reason");
        database.prepare("INSERT INTO attempt_concept_legacy (source_run_id,source_branch_id,source_concept_key,run_id,branch_id,pack_id,raw_key,stored_label,reason) VALUES (?,?,?,?,?,?,?,?,?)")
          .run(row.source.runId, row.source.branchId, row.source.conceptKey, row.source.runId, row.source.branchId, row.packId, row.source.conceptKey, row.storedLabel, row.reason);
        quarantinedKeys.push(source);
      }
      writes += 1;
      if (options.failAfterWrites === writes) fail("migration:injected-write-failure");
    }
    const sortedRegistered = registeredKeys.sort(compareCodeUnits);
    const sortedQuarantined = quarantinedKeys.sort(compareCodeUnits);
    const partition = [...sortedRegistered, ...sortedQuarantined].sort(compareCodeUnits);
    if (canonical(partition) !== canonical(sourceKeys) || sortedRegistered.some((key) => sortedQuarantined.includes(key))) fail("migration:partition");
    const outputDigest = outputsDigest(database);
    const receipt = deepFreeze({ version: 1 as const, registryDigest: registry.currentDigest, inputDigest, artifactDigest, sourceKeys, registeredKeys: sortedRegistered, quarantinedKeys: sortedQuarantined, outputDigest });
    database.prepare("INSERT INTO concept_migration_receipts (version,input_digest,registry_digest,artifact_digest,receipt_json) VALUES (1,?,?,?,?)")
      .run(inputDigest, registry.currentDigest, artifactDigest, canonical(receipt));
    validateOutputs(database, receipt);
    database.exec("COMMIT");
    return receipt;
  } catch (error) {
    try { database.exec("ROLLBACK"); } catch { /* keep primary failure */ }
    throw error;
  }
}

function migrationInput(database: DatabaseSync): readonly Record<string, unknown>[] {
  return database.prepare(`
    SELECT c.run_id,c.branch_id,c.concept_key,c.pack_id,c.label,
           a.pack_id AS attempt_pack_id,a.pack_digest,r.snapshot_json
    FROM attempt_concepts c
    LEFT JOIN attempts a ON a.run_id=c.run_id AND a.branch_id=c.branch_id
    LEFT JOIN drill_runs r ON r.id=c.run_id
    ORDER BY c.run_id,c.branch_id,c.concept_key
  `).all() as Record<string, unknown>[];
}

function classifyRow(row: Record<string, unknown>, registry: CompiledConceptRegistry, packs: PackRegistry): ProjectedRow {
  const source = deepFreeze({ runId: String(row.run_id), branchId: String(row.branch_id), conceptKey: String(row.concept_key) });
  const base = { source, packId: String(row.pack_id), packDigest: typeof row.pack_digest === "string" ? row.pack_digest : null, storedLabel: String(row.label) };
  const quarantine = (reason: string): ProjectedRow => deepFreeze({ ...base, kind: "legacy_unverified", reason });
  if (typeof row.snapshot_json !== "string" || typeof row.pack_digest !== "string" || row.attempt_pack_id !== row.pack_id) return quarantine("occurrence_unavailable");
  let run;
  try {
    const parsed = parseJson(row.snapshot_json, "run-snapshot");
    if (!Array.isArray(parsed.events)) return quarantine("run_snapshot_invalid");
    run = readBackReplay(parsed.events as never).run;
  } catch { return quarantine("run_snapshot_invalid"); }
  if (run.id !== row.run_id || run.packId !== row.pack_id || run.packDigest !== row.pack_digest || !run.branches.some((branch) => branch.id === row.branch_id)) return quarantine("occurrence_mismatch");
  const key = /^pack:([^#]+)#([a-z0-9]+(?:-[a-z0-9]+)*)$/u.exec(String(row.concept_key));
  if (key === null) return quarantine("malformed_key");
  if (key[1] !== row.pack_id) return quarantine("pack_mismatch");
  const pack = packs.byDigest(row.pack_digest);
  if (pack === undefined || pack.document.id !== row.pack_id) return quarantine("pack_artifact_unavailable");
  if (!(pack.document.concepts ?? []).includes(key[2]!)) return quarantine("concept_absent_from_exact_pack");
  let resolved;
  try { resolved = registry.currentRef(key[2]!); } catch { return quarantine("concept_unknown"); }
  return deepFreeze({ ...base, kind: "registered", targetKey: `concept:${key[2]}@1`, ref: resolved.ref, historicalLabel: resolved.label });
}

function parseReceipt(value: unknown): MigrationReceipt {
  if (typeof value !== "string") fail("migration:receipt-bytes");
  const parsed = parseJson(value, "migration-receipt");
  exactKeys(parsed, ["artifactDigest", "inputDigest", "outputDigest", "quarantinedKeys", "registeredKeys", "registryDigest", "sourceKeys", "version"], "migration-receipt");
  if (parsed.version !== 1 || ![parsed.artifactDigest, parsed.inputDigest, parsed.outputDigest, parsed.registryDigest].every((item) => typeof item === "string" && digestPattern.test(item))
    || ![parsed.sourceKeys, parsed.registeredKeys, parsed.quarantinedKeys].every((item) => Array.isArray(item) && item.every((key) => typeof key === "string"))) fail("migration:receipt-shape");
  if (value !== canonical(parsed)) fail("migration:receipt-noncanonical");
  return deepFreeze(structuredClone(parsed)) as MigrationReceipt;
}

function validateOutputs(database: DatabaseSync, receipt: MigrationReceipt): void {
  const registered = outputSourceKeys(database, "registered_attempt_concepts");
  const quarantined = outputSourceKeys(database, "attempt_concept_legacy");
  if (canonical(registered) !== canonical(receipt.registeredKeys)) fail("migration:restart-registered-changed");
  if (canonical(quarantined) !== canonical(receipt.quarantinedKeys)) fail("migration:restart-quarantine-changed");
  if (canonical([...registered, ...quarantined].sort(compareCodeUnits)) !== canonical(receipt.sourceKeys)) fail("migration:restart-partition-changed");
  if (outputsDigest(database) !== receipt.outputDigest) fail("migration:restart-output-changed");
}

function outputSourceKeys(database: DatabaseSync, table: string): string[] {
  return (database.prepare(`SELECT source_run_id,source_branch_id,source_concept_key FROM ${table} ORDER BY source_run_id,source_branch_id,source_concept_key`).all() as Record<string, unknown>[])
    .map((row) => canonical([row.source_run_id, row.source_branch_id, row.source_concept_key]));
}

function outputsDigest(database: DatabaseSync): string {
  const registered = database.prepare("SELECT * FROM registered_attempt_concepts ORDER BY source_run_id,source_branch_id,source_concept_key").all();
  const quarantined = database.prepare("SELECT * FROM attempt_concept_legacy ORDER BY source_run_id,source_branch_id,source_concept_key").all();
  return digestBytes(canonical({ quarantined, registered }));
}

function sourceKeyText(row: Record<string, unknown> | SourceKey): string {
  const value = "runId" in row ? row : { runId: row.run_id, branchId: row.branch_id, conceptKey: row.concept_key };
  return canonical([value.runId, value.branchId, value.conceptKey]);
}

export function assertConsumerOperationsFromRepository(repositoryRoot: string, revision: string): Readonly<{ repositoryCommit: string; operations: readonly string[] }> {
  const commit = git(repositoryRoot, ["rev-parse", "--verify", `${revision}^{commit}`]).trim();
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail("consumer-graph:commit");
  const paths = git(repositoryRoot, ["ls-tree", "-r", "--name-only", "-z", commit]).split("\0").filter((item) => item.endsWith(".ts"));
  const files = new Map(paths.map((file) => [file, git(repositoryRoot, ["show", `${commit}:${file}`])]));
  const options: ts.CompilerOptions = { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, strict: true };
  const host = ts.createCompilerHost(options);
  host.fileExists = (file) => files.has(normalize(file));
  host.readFile = (file) => files.get(normalize(file));
  host.getSourceFile = (file, language) => {
    const text = files.get(normalize(file));
    return text === undefined ? undefined : ts.createSourceFile(normalize(file), text, language, true);
  };
  host.resolveModuleNames = (names, containingFile) => names.map((name) => {
    const relative = name.startsWith(".")
      ? normalize(path.posix.join(path.posix.dirname(normalize(containingFile)), name.replace(/\.js$/u, ".ts")))
      : undefined;
    const resolvedFileName = name === "@chess-tabiya/runtime/concepts" ? "packages/runtime/src/concepts.ts"
      : name === "@chess-tabiya/runtime" ? "packages/runtime/src/index.ts" : relative;
    return resolvedFileName === undefined ? undefined : { resolvedFileName, extension: ts.Extension.Ts };
  });
  const program = ts.createProgram([...files.keys()], options, host);
  const checker = program.getTypeChecker();
  const found = new Set<string>();
  for (const source of program.getSourceFiles().filter((file) => files.has(normalize(file.fileName)))) {
    const expected = CONSUMER_OPERATIONS[normalize(source.fileName) as keyof typeof CONSUMER_OPERATIONS];
    if (expected === undefined) continue;
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        let symbol = checker.getSymbolAtLocation(node.expression);
        if (symbol !== undefined && (symbol.flags & ts.SymbolFlags.Alias) !== 0) symbol = checker.getAliasedSymbol(symbol);
        if (symbol?.getName() === expected && symbol.declarations?.some((declaration) => normalize(declaration.getSourceFile().fileName) === "packages/runtime/src/concepts.ts")) found.add(`${normalize(source.fileName)}#${expected}`);
      }
      node.forEachChild(visit);
    };
    source.forEachChild(visit);
  }
  const expected = Object.entries(CONSUMER_OPERATIONS).map(([file, operation]) => `${file}#${operation}`).sort(compareCodeUnits);
  const actual = [...found].sort(compareCodeUnits);
  if (canonical(actual) !== canonical(expected)) fail("consumer-graph:operation-closure");
  return deepFreeze({ repositoryCommit: commit, operations: actual });
}

function git(root: string, args: readonly string[]): string {
  try { return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); }
  catch { fail(`consumer-graph:git-${args[0]}`); }
}

function parseJson(bytes: string, label: string): Record<string, any> {
  if (typeof bytes !== "string") fail(`${label}:bytes`);
  const source = ts.parseJsonText(`${label}.json`, bytes);
  const diagnostics = (source as unknown as { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics;
  const statement = source.statements[0];
  if (diagnostics.length > 0 || source.statements.length !== 1 || statement === undefined || !ts.isExpressionStatement(statement)) fail(`${label}:json`);
  const visit = (node: ts.Node): void => {
    if (ts.isObjectLiteralExpression(node)) {
      const names = new Set<string>();
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) fail(`${label}:shape`);
        if (names.has(property.name.text)) fail(`${label}:duplicate-key`);
        names.add(property.name.text);
      }
    }
    node.forEachChild(visit);
  };
  visit(source);
  try { return JSON.parse(bytes) as Record<string, any>; } catch { fail(`${label}:json`); }
}

function exactKeys(value: unknown, keys: readonly string[], label: string): asserts value is Record<string, any> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label}:object`);
  if (Object.keys(value).sort(compareCodeUnits).join("\0") !== [...keys].sort(compareCodeUnits).join("\0")) fail(`${label}:keys`);
}

function boundedScalar(value: unknown, label: string, minimum: number, maximum: number): string {
  if (typeof value !== "string" || value !== value.trim()) fail(`${label}:string`);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) fail(`${label}:unicode-scalar`);
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) fail(`${label}:unicode-scalar`);
  }
  const length = utf8.encode(value).byteLength;
  if (length < minimum || length > maximum) fail(`${label}:bytes`);
  return value;
}

function normalize(file: string): string { return file.replaceAll("\\", "/").replace(/^.*?\/(?:apps|packages)\//u, (match) => match.slice(match.search(/(?:apps|packages)\//u))); }
function compareCodeUnits(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }
function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T { if (value === null || typeof value !== "object" || seen.has(value)) return value; seen.add(value); for (const child of Object.values(value as object)) deepFreeze(child, seen); return Object.isFrozen(value) ? value : Object.freeze(value); }
function fail(code: string): never { throw new TypeError(code); }
