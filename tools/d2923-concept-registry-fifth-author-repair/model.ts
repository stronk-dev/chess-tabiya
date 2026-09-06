// DISPOSABLE author contract for D2923-D2928. Not production code.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { type DatabaseSync } from "node:sqlite";

import { canonicalizeJson, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { validatePackDocument } from "../../apps/server/src/pack-validation.js";
import { parse as parseSvelte } from "svelte/compiler";
import ts from "typescript";

const snapshotAuthority = new WeakSet<object>();
const readyAuthority = new WeakMap<object, DatabaseSync>();
const digestPattern = /^sha256:[0-9a-f]{64}$/u;

export const LIVE_CONSUMERS = Object.freeze({
  "apps/server/src/account-data.ts": "validateConceptExport",
  "apps/server/src/pack-validation.ts": "validatePackConcepts",
  "apps/server/src/pack-studio.ts": "listActiveConcepts",
  "apps/server/src/progress.ts": "resolveAttemptConcept",
  "apps/server/src/storage.ts": "queryRelatedAttempts",
  "apps/web/src/lib/api.ts": "renderConceptLabel",
} as const);

export const CONSUMER_BOUNDARIES = Object.freeze({
  "apps/server/src/account-data.ts": "publishConceptExport",
  "apps/server/src/pack-validation.ts": "publishValidatedPack",
  "apps/server/src/pack-studio.ts": "renderPackStudioConcepts",
  "apps/server/src/progress.ts": "persistResolvedConcept",
  "apps/server/src/storage.ts": "serveRelatedAttempts",
  "apps/web/src/lib/api.ts": "serializeConceptLabel",
} as const);

export interface PackArtifactInput {
  readonly source: string;
  readonly document: unknown;
  readonly claimedDigest: string;
}

type PackRecord = Readonly<{ document: DrillPackDefinition; digest: string }>;

export class ValidatedPackArtifactSnapshot {
  readonly #records: ReadonlyMap<string, PackRecord>;
  readonly populationDigest: string;

  private constructor(records: ReadonlyMap<string, PackRecord>) {
    this.#records = records;
    this.populationDigest = digestJson([...records].map(([digest, record]) => ({ digest, document: record.document })));
    snapshotAuthority.add(this);
    deepFreeze(this);
  }

  static compile(inputs: readonly PackArtifactInput[]): ValidatedPackArtifactSnapshot {
    const records = new Map<string, PackRecord>();
    for (const input of inputs) {
      const validation = validatePackDocument(structuredClone(input.document));
      if (!validation.valid || validation.document === undefined) {
        const codes = validation.issues.filter((issue) => issue.severity === "error").map((issue) => issue.code).sort(compare);
        fail(`pack-artifact:invalid:${input.source}:${codes.join(",")}`);
      }
      const document = deepFreeze(structuredClone(validation.document));
      const digest = digestPack(document);
      if (digest !== input.claimedDigest) fail(`pack-artifact:digest:${input.source}`);
      if (records.has(digest)) fail("pack-artifact:duplicate-digest");
      records.set(digest, deepFreeze({ document, digest }));
    }
    return new ValidatedPackArtifactSnapshot(records);
  }

  byDigest(digest: string): PackRecord | undefined {
    if (!snapshotAuthority.has(this)) fail("pack-artifact:authority");
    return this.#records.get(digest);
  }
}

/** Opaque at runtime: no public class, constructor or issuer exists. */
export interface ReadyStorage {
  readonly kind: "concept-storage-ready";
}

function issueReadyStorage(database: DatabaseSync): ReadyStorage {
  const ready = Object.freeze({ kind: "concept-storage-ready" as const });
  readyAuthority.set(ready, database);
  return ready;
}

export function readyStorageVersion(storage: ReadyStorage): number {
  const database = readyAuthority.get(storage as object);
  if (database === undefined) fail("storage:not-ready");
  return pragmaVersion(database);
}

export interface ConceptMigrationRepository {
  readonly insertEffect: (value: string) => void;
}

type RegistryAuthority = Readonly<{ currentDigest: string }>;
type StartupReceipt = Readonly<{
  version: 1;
  registryDigest: string;
  inputDigest: string;
  artifactDigest: string;
  outputDigest: string;
}>;

export interface ConceptStartupOptions<TRegistry extends RegistryAuthority> {
  readonly database: DatabaseSync;
  readonly prerequisiteVersion: number;
  readonly conceptVersion: number;
  readonly compileRegistry: () => TRegistry;
  readonly loadPackArtifacts: () => readonly PackArtifactInput[];
  readonly migrateInsideTransaction: (
    repository: ConceptMigrationRepository,
    registry: TRegistry,
    packs: ValidatedPackArtifactSnapshot,
  ) => void;
  readonly afterCommit?: (storage: ReadyStorage) => void;
}

/** The only lexical path that can mint service-ready storage. */
export function finishConceptStartup<TRegistry extends RegistryAuthority>(options: ConceptStartupOptions<TRegistry>): ReadyStorage {
  const before = pragmaVersion(options.database);
  if (before !== options.prerequisiteVersion && before !== options.conceptVersion) fail("startup:version");
  const registry = options.compileRegistry();
  if (!digestPattern.test(registry.currentDigest)) fail("startup:registry-digest");
  options.database.exec("BEGIN IMMEDIATE");
  try {
    const packs = ValidatedPackArtifactSnapshot.compile(options.loadPackArtifacts());
    const inputDigest = migrationInputDigest(options.database);
    if (before === options.prerequisiteVersion) {
      options.migrateInsideTransaction(repositoryCapability(options.database), registry, packs);
      const receipt = deepFreeze({
        version: 1 as const,
        registryDigest: registry.currentDigest,
        inputDigest,
        artifactDigest: packs.populationDigest,
        outputDigest: migrationOutputDigest(options.database),
      });
      options.database.prepare("INSERT INTO concept_migration_receipts (version,receipt_json) VALUES (1,?)")
        .run(canonicalizeJson(receipt));
      options.database.exec(`PRAGMA user_version = ${options.conceptVersion}`);
    } else {
      const row = options.database.prepare("SELECT receipt_json FROM concept_migration_receipts WHERE version=1").get() as { receipt_json?: unknown } | undefined;
      const receipt = parseReceipt(row?.receipt_json);
      if (receipt.registryDigest !== registry.currentDigest
        || receipt.inputDigest !== inputDigest
        || receipt.artifactDigest !== packs.populationDigest
        || receipt.outputDigest !== migrationOutputDigest(options.database)) fail("startup:restart-preimage-changed");
    }
    options.database.exec("COMMIT");
  } catch (error) {
    try { options.database.exec("ROLLBACK"); } catch { /* preserve primary failure */ }
    throw error;
  }
  const ready = issueReadyStorage(options.database);
  options.afterCommit?.(ready);
  return ready;
}

function repositoryCapability(database: DatabaseSync): ConceptMigrationRepository {
  return Object.freeze({
    insertEffect(value: string): void {
      if (!database.isTransaction) fail("migration:transaction-required");
      database.prepare("INSERT INTO migration_effects VALUES (?)").run(value);
    },
  });
}

function parseReceipt(value: unknown): StartupReceipt {
  if (typeof value !== "string") fail("startup:receipt-missing");
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { fail("startup:receipt-json"); }
  exactKeys(parsed, ["artifactDigest", "inputDigest", "outputDigest", "registryDigest", "version"], "startup:receipt");
  if (parsed.version !== 1 || ![parsed.registryDigest, parsed.inputDigest, parsed.artifactDigest, parsed.outputDigest]
    .every((item) => typeof item === "string" && digestPattern.test(item))) fail("startup:receipt-shape");
  if (value !== canonicalizeJson(parsed)) fail("startup:receipt-noncanonical");
  return deepFreeze(structuredClone(parsed)) as StartupReceipt;
}

export function assertReachableConsumerOperationsFromRepository(
  repositoryRoot: string,
  revision: string,
): Readonly<{ repositoryCommit: string; operations: readonly string[] }> {
  const commit = git(repositoryRoot, ["rev-parse", "--verify", `${revision}^{commit}`]).trim();
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail("consumer-graph:commit");
  const paths = git(repositoryRoot, ["ls-tree", "-r", "--name-only", "-z", commit])
    .split("\0")
    .filter((item) => item.endsWith(".ts") || item.endsWith(".json") || item.endsWith(".svelte"));
  const files = new Map(paths.map((file) => [file, git(repositoryRoot, ["show", `${commit}:${file}`])]));
  const virtualSvelteModules = new Map(
    paths.filter((file) => file.endsWith(".svelte")).map((file) => [`${file}.d.ts`, "declare const component: unknown; export default component;\n"]),
  );
  for (const [file, bytes] of virtualSvelteModules) files.set(file, bytes);
  const base = parseConfig(files.get("tsconfig.base.json"), "tsconfig.base.json");
  const server = parseConfig(files.get("apps/server/tsconfig.json"), "apps/server/tsconfig.json");
  const web = parseConfig(files.get("apps/web/tsconfig.json"), "apps/web/tsconfig.json");
  const converted = ts.convertCompilerOptionsFromJson(
    { ...(base.compilerOptions ?? {}), ...(server.compilerOptions ?? {}), ...(web.compilerOptions ?? {}) },
    repositoryRoot,
  );
  if (converted.errors.length > 0) fail("consumer-graph:config-diagnostics");
  const options = converted.options;
  const sourcePaths = [...files.keys()].filter((file) => file.endsWith(".ts"));
  const host = ts.createCompilerHost(options);
  const normalize = (file: string) => normalizePath(path.relative(repositoryRoot, file));
  const baseFileExists = host.fileExists.bind(host);
  const baseReadFile = host.readFile.bind(host);
  const baseGetSourceFile = host.getSourceFile.bind(host);
  host.fileExists = (file) => files.has(normalize(file)) || baseFileExists(file);
  host.readFile = (file) => files.get(normalize(file)) ?? baseReadFile(file);
  host.getSourceFile = (file, language) => {
    const key = normalize(file);
    const text = files.get(key);
    return text === undefined ? baseGetSourceFile(file, language) : ts.createSourceFile(key, text, language, true);
  };
  host.resolveModuleNames = (names, containingFile) => names.map((name) => {
    const target = resolveTypeModule(normalize(containingFile), name);
    return target === undefined || !files.has(target) ? undefined : {
      resolvedFileName: target,
      extension: target.endsWith(".d.ts") ? ts.Extension.Dts : ts.Extension.Ts,
    };
  });
  const program = ts.createProgram(sourcePaths, options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) {
    const detail = ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => repositoryRoot,
      getNewLine: () => "\n",
    });
    fail(`consumer-graph:compiler-diagnostics:${detail}`);
  }
  const checker = program.getTypeChecker();
  const graph = moduleGraph(program, files, paths.filter((file) => file.endsWith(".svelte")));
  const reachable = reachableFrom(graph, ["apps/server/src/main.ts", "apps/web/src/main.ts"]);
  const found: string[] = [];

  for (const [file, operation] of Object.entries(LIVE_CONSUMERS)) {
    if (!reachable.has(file)) fail("consumer-graph:unreachable-module");
    const source = program.getSourceFile(file);
    if (source === undefined) fail("consumer-graph:missing-consumer");
    const owner = returnedOperationOwner(source, checker, operation);
    if (owner === undefined) fail("consumer-graph:operation-result-not-returned");
    const boundary = CONSUMER_BOUNDARIES[file as keyof typeof CONSUMER_BOUNDARIES];
    if (!resultReachesBoundary(owner.name!.text, file, boundary, reachable, files)) {
      fail("consumer-graph:operation-result-not-consumed");
    }
    found.push(`${file}#${operation}->${boundary}`);
  }
  return deepFreeze({ repositoryCommit: commit, operations: found.sort(compare) });
}

function returnedOperationOwner(source: ts.SourceFile, checker: ts.TypeChecker, operation: string): ts.FunctionDeclaration | undefined {
  let found: ts.FunctionDeclaration | undefined;
  const visit = (node: ts.Node): void => {
    if (found !== undefined) return;
    if (ts.isCallExpression(node)) {
      const symbol = resolvedSymbol(checker, checker.getSymbolAtLocation(node.expression));
      const returned = ts.isReturnStatement(node.parent) && node.parent.expression === node;
      if (returned && symbol?.getName() === operation
        && symbol.declarations?.some((item) => normalizePath(item.getSourceFile().fileName) === "packages/runtime/src/concepts.ts")) {
        found = containingNamedFunction(node);
      }
    }
    node.forEachChild(visit);
  };
  source.forEachChild(visit);
  return found;
}

function resultReachesBoundary(
  wrapper: string,
  wrapperFile: string,
  boundary: string,
  reachable: ReadonlySet<string>,
  files: ReadonlyMap<string, string>,
): boolean {
  for (const file of reachable) {
    if (file === wrapperFile) continue;
    const bytes = files.get(file);
    if (bytes === undefined) continue;
    const script = file.endsWith(".svelte") ? svelteInstanceScript(bytes) : bytes;
    if (script === undefined) continue;
    const source = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const imported = importedNamesFrom(source, file, wrapperFile);
    const local = imported.get(wrapper);
    if (local === undefined) continue;
    let consumed = false;
    const visit = (node: ts.Node): void => {
      if (consumed) return;
      if (ts.isCallExpression(node) && calledName(node.expression) === boundary
        && node.arguments.some((argument) => ts.isCallExpression(argument) && calledName(argument.expression) === local)) consumed = true;
      node.forEachChild(visit);
    };
    source.forEachChild(visit);
    if (consumed) return true;
  }
  return false;
}

function importedNamesFrom(source: ts.SourceFile, containing: string, target: string): ReadonlyMap<string, string> {
  const names = new Map<string, string>();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)
      || resolveGraphModule(containing, statement.moduleSpecifier.text) !== target) continue;
    for (const element of statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)
      ? statement.importClause.namedBindings.elements : []) {
      names.set(element.propertyName?.text ?? element.name.text, element.name.text);
    }
  }
  return names;
}

function calledName(expression: ts.LeftHandSideExpression): string | undefined {
  return ts.isIdentifier(expression) ? expression.text : undefined;
}

function moduleGraph(
  program: ts.Program,
  files: ReadonlyMap<string, string>,
  sveltePaths: readonly string[],
): ReadonlyMap<string, readonly string[]> {
  const graph = new Map<string, readonly string[]>();
  for (const source of program.getSourceFiles()) {
    const file = normalizePath(source.fileName);
    if (!files.has(file) || file.endsWith(".d.ts")) continue;
    graph.set(file, graphTargets(file, source.statements, files));
  }
  for (const file of sveltePaths) {
    const script = svelteInstanceScript(files.get(file)!);
    const source = ts.createSourceFile(file, script ?? "", ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    graph.set(file, graphTargets(file, source.statements, files));
  }
  return graph;
}

function graphTargets(containing: string, statements: readonly ts.Statement[], files: ReadonlyMap<string, string>): readonly string[] {
  const targets: string[] = [];
  for (const statement of statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const target = resolveGraphModule(containing, statement.moduleSpecifier.text);
    if (target !== undefined && files.has(target)) targets.push(target);
  }
  return deepFreeze(targets);
}

function svelteInstanceScript(bytes: string): string | undefined {
  const ast = parseSvelte(bytes, { modern: true }) as unknown as { instance?: { content?: { start: number; end: number } } };
  const content = ast.instance?.content;
  return content === undefined ? undefined : bytes.slice(content.start, content.end);
}

function reachableFrom(graph: ReadonlyMap<string, readonly string[]>, roots: readonly string[]): ReadonlySet<string> {
  const reached = new Set<string>();
  const pending = [...roots];
  while (pending.length > 0) {
    const file = pending.pop()!;
    if (reached.has(file)) continue;
    reached.add(file);
    pending.push(...(graph.get(file) ?? []));
  }
  return reached;
}

function containingNamedFunction(node: ts.Node): ts.FunctionDeclaration | undefined {
  let cursor: ts.Node | undefined = node.parent;
  while (cursor !== undefined) {
    if (ts.isFunctionDeclaration(cursor)) return cursor.name === undefined ? undefined : cursor;
    cursor = cursor.parent;
  }
  return undefined;
}

function resolvedSymbol(checker: ts.TypeChecker, symbol: ts.Symbol | undefined): ts.Symbol | undefined {
  return symbol !== undefined && (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol;
}

function resolveTypeModule(containing: string, specifier: string): string | undefined {
  const graph = resolveGraphModule(containing, specifier);
  return graph?.endsWith(".svelte") ? `${graph}.d.ts` : graph;
}

function resolveGraphModule(containing: string, specifier: string): string | undefined {
  if (specifier === "@chess-tabiya/runtime" || specifier === "@chess-tabiya/runtime/concepts") return "packages/runtime/src/concepts.ts";
  if (!specifier.startsWith(".")) return undefined;
  const joined = path.posix.normalize(path.posix.join(path.posix.dirname(containing), specifier));
  if (joined.endsWith(".svelte")) return joined;
  return joined.replace(/\.js$/u, ".ts");
}

function migrationInputDigest(database: DatabaseSync): string {
  return digestJson(database.prepare("SELECT value FROM migration_inputs ORDER BY value").all());
}

function migrationOutputDigest(database: DatabaseSync): string {
  return digestJson(database.prepare("SELECT value FROM migration_effects ORDER BY value").all());
}

function digestPack(document: DrillPackDefinition): string {
  return digestJson(document);
}

function digestJson(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function pragmaVersion(database: DatabaseSync): number {
  return Number((database.prepare("PRAGMA user_version").get() as { user_version: number }).user_version);
}

function parseConfig(bytes: string | undefined, label: string): Record<string, any> {
  if (bytes === undefined) fail(`consumer-graph:missing-${label}`);
  const parsed = ts.parseConfigFileTextToJson(label, bytes);
  if (parsed.error !== undefined || parsed.config === undefined) fail("consumer-graph:config-diagnostics");
  return parsed.config as Record<string, any>;
}

function exactKeys(value: unknown, keys: readonly string[], code: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || JSON.stringify(Object.keys(value).sort(compare)) !== JSON.stringify([...keys].sort(compare))) fail(`${code}:keys`);
}

function git(root: string, args: readonly string[]): string {
  try { return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); }
  catch { fail(`consumer-graph:git-${args[0]}`); }
}

function normalizePath(file: string): string { return file.replaceAll("\\", "/").replace(/^.*?\/(apps|packages|tsconfig\.base\.json)/u, "$1"); }
function compare(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }
function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T { if (value === null || typeof value !== "object" || seen.has(value)) return value; seen.add(value); for (const child of Object.values(value as object)) deepFreeze(child, seen); return Object.isFrozen(value) ? value : Object.freeze(value); }
function fail(code: string): never { throw new TypeError(code); }
