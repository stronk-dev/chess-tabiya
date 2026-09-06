// DISPOSABLE author contract for D2904-D2908. Not production code.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { type DatabaseSync } from "node:sqlite";

import { canonicalizeJson, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import ts from "typescript";

const snapshotAuthority = new WeakSet<object>();
const readyAuthority = new WeakSet<object>();

export const LIVE_CONSUMERS = Object.freeze({
  "apps/server/src/account-data.ts": "validateConceptExport",
  "apps/server/src/pack-validation.ts": "validatePackConcepts",
  "apps/server/src/pack-studio.ts": "listActiveConcepts",
  "apps/server/src/progress.ts": "resolveAttemptConcept",
  "apps/server/src/storage.ts": "queryRelatedAttempts",
  "apps/web/src/lib/api.ts": "renderConceptLabel",
} as const);

export interface PackArtifactInput {
  readonly source: string;
  readonly document: DrillPackDefinition;
  readonly claimedDigest: string;
}

export class ValidatedPackArtifactSnapshot {
  readonly #records: ReadonlyMap<string, Readonly<{ document: DrillPackDefinition; digest: string }>>;

  private constructor(records: ReadonlyMap<string, Readonly<{ document: DrillPackDefinition; digest: string }>>) {
    this.#records = records;
    snapshotAuthority.add(this);
    Object.freeze(this);
  }

  static compile(inputs: readonly PackArtifactInput[]): ValidatedPackArtifactSnapshot {
    const records = new Map<string, Readonly<{ document: DrillPackDefinition; digest: string }>>();
    for (const input of inputs) {
      const document = deepFreeze(structuredClone(input.document));
      const digest = digestPack(document);
      if (digest !== input.claimedDigest) fail(`pack-artifact:digest:${input.source}`);
      if (records.has(digest)) fail("pack-artifact:duplicate-digest");
      records.set(digest, deepFreeze({ document, digest }));
    }
    return new ValidatedPackArtifactSnapshot(records);
  }

  byDigest(digest: string): Readonly<{ document: DrillPackDefinition; digest: string }> | undefined {
    if (!snapshotAuthority.has(this)) fail("pack-artifact:authority");
    return this.#records.get(digest);
  }
}

export class ReadyStorage {
  readonly #database: DatabaseSync;
  private constructor(database: DatabaseSync) {
    this.#database = database;
    readyAuthority.add(this);
    Object.freeze(this);
  }

  static issue(database: DatabaseSync): ReadyStorage {
    return new ReadyStorage(database);
  }

  userVersion(): number {
    if (!readyAuthority.has(this)) fail("storage:not-ready");
    return pragmaVersion(this.#database);
  }
}

export interface ConceptStartupOptions<TRegistry> {
  readonly database: DatabaseSync;
  readonly prerequisiteVersion: number;
  readonly conceptVersion: number;
  readonly compileRegistry: () => TRegistry;
  readonly loadPackArtifacts: (database: DatabaseSync) => readonly PackArtifactInput[];
  readonly migrateInsideTransaction: (
    database: DatabaseSync,
    registry: TRegistry,
    packs: ValidatedPackArtifactSnapshot,
  ) => void;
  readonly afterCommit?: (storage: ReadyStorage) => void;
}

/** The only boot path that may mint service-ready storage. */
export function finishConceptStartup<TRegistry>(options: ConceptStartupOptions<TRegistry>): ReadyStorage {
  const before = pragmaVersion(options.database);
  if (before !== options.prerequisiteVersion && before !== options.conceptVersion) fail("startup:version");
  const registry = options.compileRegistry();
  options.database.exec("BEGIN IMMEDIATE");
  try {
    const packs = ValidatedPackArtifactSnapshot.compile(options.loadPackArtifacts(options.database));
    options.migrateInsideTransaction(options.database, registry, packs);
    options.database.exec(`PRAGMA user_version = ${options.conceptVersion}`);
    options.database.exec("COMMIT");
  } catch (error) {
    try { options.database.exec("ROLLBACK"); } catch { /* preserve primary failure */ }
    throw error;
  }
  const ready = ReadyStorage.issue(options.database);
  options.afterCommit?.(ready);
  return ready;
}

export function assertReachableConsumerOperationsFromRepository(
  repositoryRoot: string,
  revision: string,
): Readonly<{ repositoryCommit: string; operations: readonly string[] }> {
  const commit = git(repositoryRoot, ["rev-parse", "--verify", `${revision}^{commit}`]).trim();
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail("consumer-graph:commit");
  const paths = git(repositoryRoot, ["ls-tree", "-r", "--name-only", "-z", commit])
    .split("\0")
    .filter((item) => item.endsWith(".ts") || item.endsWith(".json"));
  const files = new Map(paths.map((file) => [file, git(repositoryRoot, ["show", `${commit}:${file}`])]));
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
    const target = resolveModule(normalize(containingFile), name);
    return target === undefined || !files.has(target) ? undefined : { resolvedFileName: target, extension: ts.Extension.Ts };
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
  const graph = moduleGraph(program, files);
  const reachable = reachableFrom(graph, ["apps/server/src/main.ts", "apps/web/src/main.ts"]);
  const found: string[] = [];

  for (const [file, operation] of Object.entries(LIVE_CONSUMERS)) {
    if (!reachable.has(file)) fail("consumer-graph:unreachable-module");
    const source = program.getSourceFile(file);
    if (source === undefined) fail("consumer-graph:missing-consumer");
    let used = false;
    const visit = (node: ts.Node): void => {
      if (used) return;
      if (ts.isCallExpression(node)) {
        const symbol = resolvedSymbol(checker, checker.getSymbolAtLocation(node.expression));
        if (symbol?.getName() === operation && symbol.declarations?.some((item) => normalizePath(item.getSourceFile().fileName) === "packages/runtime/src/concepts.ts")) {
          const owner = containingNamedFunction(node);
          if (owner === undefined || calledFromAnotherReachableFile(program, checker, owner, source.fileName, reachable)) used = true;
        }
      }
      node.forEachChild(visit);
    };
    source.forEachChild(visit);
    if (!used) fail("consumer-graph:unused-operation");
    found.push(`${file}#${operation}`);
  }
  return deepFreeze({ repositoryCommit: commit, operations: found.sort(compare) });
}

function moduleGraph(program: ts.Program, files: ReadonlyMap<string, string>): ReadonlyMap<string, readonly string[]> {
  const graph = new Map<string, readonly string[]>();
  for (const source of program.getSourceFiles()) {
    const file = normalizePath(source.fileName);
    if (!files.has(file)) continue;
    const targets: string[] = [];
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const target = resolveModule(file, statement.moduleSpecifier.text);
      if (target !== undefined && files.has(target)) targets.push(target);
    }
    graph.set(file, deepFreeze(targets));
  }
  return graph;
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

function calledFromAnotherReachableFile(
  program: ts.Program,
  checker: ts.TypeChecker,
  declaration: ts.FunctionDeclaration,
  declarationFile: string,
  reachable: ReadonlySet<string>,
): boolean {
  const target = resolvedSymbol(checker, checker.getSymbolAtLocation(declaration.name!));
  if (target === undefined) return false;
  for (const source of program.getSourceFiles()) {
    const file = normalizePath(source.fileName);
    if (file === normalizePath(declarationFile) || !reachable.has(file)) continue;
    let called = false;
    const visit = (node: ts.Node): void => {
      if (called) return;
      if (ts.isCallExpression(node)) {
        const symbol = resolvedSymbol(checker, checker.getSymbolAtLocation(node.expression));
        if (symbol === target) called = true;
      }
      node.forEachChild(visit);
    };
    source.forEachChild(visit);
    if (called) return true;
  }
  return false;
}

function resolvedSymbol(checker: ts.TypeChecker, symbol: ts.Symbol | undefined): ts.Symbol | undefined {
  return symbol !== undefined && (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol;
}

function resolveModule(containing: string, specifier: string): string | undefined {
  if (specifier === "@chess-tabiya/runtime" || specifier === "@chess-tabiya/runtime/concepts") return "packages/runtime/src/concepts.ts";
  if (!specifier.startsWith(".")) return undefined;
  return path.posix.normalize(path.posix.join(path.posix.dirname(containing), specifier.replace(/\.js$/u, ".ts")));
}

function digestPack(document: DrillPackDefinition): string {
  return `sha256:${createHash("sha256").update(canonicalizeJson(document)).digest("hex")}`;
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

function git(root: string, args: readonly string[]): string {
  try { return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); }
  catch { fail(`consumer-graph:git-${args[0]}`); }
}

function normalizePath(file: string): string { return file.replaceAll("\\", "/").replace(/^.*?\/(apps|packages|tsconfig\.base\.json)/u, "$1"); }
function compare(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }
function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T { if (value === null || typeof value !== "object" || seen.has(value)) return value; seen.add(value); for (const child of Object.values(value as object)) deepFreeze(child, seen); return Object.isFrozen(value) ? value : Object.freeze(value); }
function fail(code: string): never { throw new TypeError(code); }
