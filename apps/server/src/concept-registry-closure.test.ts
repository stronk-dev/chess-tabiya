// rfc/concept-registry.md §2 — the consumer closure (criteria 4, 11, 18, 23, 24, 29, 30) and the
// sixth return's consumer findings [[D2960]] (symbol-resolved live calls, not identifier text) and
// [[D2961]] (each project compiled under its own committed configuration, never a merged one).
//
// For each of the six landing consumers the census builds that project's own TypeScript program
// from its committed tsconfig, reaches the consumer from the real entry (`apps/server/src/main.ts`;
// `apps/web/src/main.ts → App.svelte → lib/api.ts`, following `.svelte` script imports), refuses any
// diagnostic in the consumer file, resolves the registered operation's call through aliases and
// re-exports to its one declaration in `packages/runtime/src/concept-registry.ts`, requires the
// result to be used, and requires the enclosing declaration to be referenced from a reachable file.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY_MODULE = join(ROOT, "packages/runtime/src/concept-registry.ts");

type Project = "server" | "web";
const PROJECTS: Readonly<Record<Project, { readonly config: string; readonly entry: string }>> = {
  server: { config: "apps/server/tsconfig.json", entry: "apps/server/src/main.ts" },
  web: { config: "apps/web/tsconfig.json", entry: "apps/web/src/main.ts" },
};

/** The six landing consumers and the exact registered operation each must call (§2). */
const CONSUMERS = Object.freeze([
  { project: "server", path: "apps/server/src/pack-validation.ts", operation: "validateConceptReferences" },
  { project: "server", path: "apps/server/src/pack-studio.ts", operation: "conceptCatalogueView" },
  { project: "server", path: "apps/server/src/progress.ts", operation: "resolveRegisteredConcept" },
  { project: "server", path: "apps/server/src/storage.ts", operation: "conceptLabelView" },
  { project: "server", path: "apps/server/src/account-data.ts", operation: "parseConceptRef" },
  { project: "web", path: "apps/web/src/lib/api.ts", operation: "parseConceptCatalogueView" },
] as const);

const SVELTE_SCRIPT = /<script\b[^>]*>([\s\S]*?)<\/script>/gu;
const virtualOf = (svelte: string): string => `${svelte}.__script.ts`;
function svelteScript(path: string): string {
  return [...readFileSync(path, "utf8").matchAll(SVELTE_SCRIPT)].map((match) => match[1]).join("\n");
}

interface CompiledProject {
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  readonly reachable: ReadonlySet<string>;
}

/** One project's own program: its committed options, its entry, `.svelte` scripts as virtual TS. */
function compileProject(project: Project, sources: Readonly<Record<string, string>> = {}): CompiledProject {
  const parsed = ts.getParsedCommandLineOfConfigFile(join(ROOT, PROJECTS[project].config), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: (diagnostic) => { throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")); } });
  if (parsed === undefined || parsed.errors.length > 0) throw new Error(`${project}: tsconfig does not parse`);
  const options = { ...parsed.options, noEmit: true };
  const override = (path: string): string | undefined => sources[relative(ROOT, path)];
  const text = (path: string): string | undefined => {
    const replaced = override(path);
    if (replaced !== undefined) return replaced;
    if (path.endsWith(".__script.ts")) return svelteScript(path.slice(0, -".__script.ts".length));
    return existsSync(path) ? readFileSync(path, "utf8") : undefined;
  };
  const resolveModule = (specifier: string, containing: string): string | undefined => {
    if (specifier.endsWith(".svelte")) return virtualOf(resolve(dirname(containing.replace(/\.__script\.ts$/u, "")), specifier));
    const resolved = ts.resolveModuleName(specifier, containing, options, ts.sys).resolvedModule;
    return resolved === undefined || resolved.isExternalLibraryImport || resolved.resolvedFileName.endsWith(".d.ts") ? undefined : resolved.resolvedFileName;
  };
  // Reachability from the real entry, including `.svelte` instance-script imports.
  const reachable = new Set<string>();
  const queue = [join(ROOT, PROJECTS[project].entry)];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (reachable.has(file)) continue;
    const source = text(file);
    if (source === undefined) continue;
    reachable.add(file);
    for (const imported of ts.preProcessFile(source, true, true).importedFiles) {
      const target = resolveModule(imported.fileName, file);
      if (target !== undefined && target.startsWith(ROOT) && !target.includes("node_modules")) queue.push(target);
    }
  }
  const host = ts.createCompilerHost(options, true);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, language, onError, create) => {
    const content = override(fileName) ?? (fileName.endsWith(".__script.ts") ? text(fileName) : undefined);
    return content === undefined ? getSourceFile(fileName, language, onError, create) : ts.createSourceFile(fileName, content, language, true);
  };
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (fileName) => override(fileName) !== undefined || (fileName.endsWith(".__script.ts") ? existsSync(fileName.slice(0, -".__script.ts".length)) : fileExists(fileName));
  host.resolveModuleNameLiterals = (literals, containing) => literals.map((literal) => {
    if (literal.text.endsWith(".svelte")) return { resolvedModule: { resolvedFileName: virtualOf(resolve(dirname(containing.replace(/\.__script\.ts$/u, "")), literal.text)), extension: ts.Extension.Ts } };
    return ts.resolveModuleName(literal.text, containing, options, host);
  });
  const program = ts.createProgram({ rootNames: [...reachable], options, host });
  return { program, checker: program.getTypeChecker(), reachable };
}

function aliased(checker: ts.TypeChecker, symbol: ts.Symbol | undefined): ts.Symbol | undefined {
  return symbol !== undefined && (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol;
}

const isFunctionLike = (node: ts.Node): node is ts.FunctionLikeDeclaration =>
  ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isConstructorDeclaration(node) || ts.isGetAccessorDeclaration(node);

/** The symbol(s) a caller would name to invoke this enclosing declaration, including interface members it implements. */
function declarationSymbols(checker: ts.TypeChecker, declaration: ts.FunctionLikeDeclaration): readonly ts.Symbol[] {
  let name: ts.Node | undefined;
  if ((ts.isFunctionDeclaration(declaration) || ts.isMethodDeclaration(declaration) || ts.isGetAccessorDeclaration(declaration)) && declaration.name !== undefined) name = declaration.name;
  else if ((ts.isArrowFunction(declaration) || ts.isFunctionExpression(declaration)) && (ts.isVariableDeclaration(declaration.parent) || ts.isPropertyDeclaration(declaration.parent) || ts.isPropertyAssignment(declaration.parent))) name = declaration.parent.name;
  if (name === undefined) return [];
  const symbol = checker.getSymbolAtLocation(name);
  if (symbol === undefined) return [];
  const symbols = [symbol];
  const owner = declaration.parent;
  if (ts.isMethodDeclaration(declaration) && ts.isClassDeclaration(owner)) {
    for (const clause of owner.heritageClauses ?? []) for (const type of clause.types) {
      const member = checker.getTypeAtLocation(type).getProperty(symbol.getName());
      if (member !== undefined) symbols.push(member);
    }
  }
  return symbols;
}

interface ConsumerReceipt {
  readonly reachable: boolean;
  readonly diagnostics: readonly string[];
  readonly liveCalls: number;
  readonly deadCalls: number;
  readonly discardedCalls: number;
}

function consumerReceipt(compiled: CompiledProject, path: string, operation: string): ConsumerReceipt {
  const file = join(ROOT, path);
  const { program, checker, reachable } = compiled;
  const source = program.getSourceFile(file);
  if (source === undefined) return { reachable: false, diagnostics: ["not in program"], liveCalls: 0, deadCalls: 0, discardedCalls: 0 };
  const diagnostics = [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)].map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));
  const reachableSources = program.getSourceFiles().filter((candidate) => reachable.has(candidate.fileName));
  const referenced = (targets: readonly ts.Symbol[], exclude: ts.Node): boolean => {
    const names = new Set(targets.map((symbol) => symbol.getName()));
    for (const candidate of reachableSources) {
      let found = false;
      const visit = (node: ts.Node): void => {
        if (found) return;
        if ((ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) && names.has(node.text) && node !== exclude) {
          const symbol = aliased(checker, checker.getSymbolAtLocation(node));
          if (symbol !== undefined && targets.includes(symbol)) found = true;
        }
        ts.forEachChild(node, visit);
      };
      visit(candidate);
      if (found) return true;
    }
    return false;
  };
  let liveCalls = 0; let deadCalls = 0; let discardedCalls = 0;
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = ts.isPropertyAccessExpression(node.expression) ? node.expression.name : node.expression;
      const symbol = aliased(checker, checker.getSymbolAtLocation(callee));
      const declaration = symbol?.declarations?.[0];
      if (symbol?.getName() === operation && declaration?.getSourceFile().fileName === REGISTRY_MODULE) {
        if (ts.isExpressionStatement(node.parent) || ts.isVoidExpression(node.parent)) discardedCalls += 1;
        else {
          let enclosing: ts.Node | undefined = node.parent;
          while (enclosing !== undefined && !isFunctionLike(enclosing)) enclosing = enclosing.parent;
          if (enclosing === undefined) liveCalls += 1;
          else {
            const symbols = declarationSymbols(checker, enclosing as ts.FunctionLikeDeclaration);
            const name = (enclosing as ts.FunctionLikeDeclaration).name ?? (ts.isVariableDeclaration(enclosing.parent) ? enclosing.parent.name : enclosing);
            if (symbols.length > 0 && referenced(symbols, name)) liveCalls += 1; else deadCalls += 1;
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { reachable: reachable.has(file), diagnostics, liveCalls, deadCalls, discardedCalls };
}

const compiledCache = new Map<Project, CompiledProject>();
const compiled = (project: Project): CompiledProject => {
  let value = compiledCache.get(project);
  if (value === undefined) { value = compileProject(project); compiledCache.set(project, value); }
  return value;
};

describe("criteria 4, 18, 23, 24, 29, 30 — six live consumers of the one compiled registry", () => {
  for (const consumer of CONSUMERS) {
    it(`${consumer.path} calls ${consumer.operation} live from the ${consumer.project} entry`, () => {
      const receipt = consumerReceipt(compiled(consumer.project), consumer.path, consumer.operation);
      expect(receipt).toMatchObject({ reachable: true, diagnostics: [], deadCalls: 0, discardedCalls: 0 });
      expect(receipt.liveCalls).toBeGreaterThan(0);
    });
  }

  it("follows main.ts → App.svelte → lib/api.ts through the .svelte instance script", () => {
    const web = compiled("web");
    expect(web.reachable.has(virtualOf(join(ROOT, "apps/web/src/App.svelte")))).toBe(true);
    expect(web.reachable.has(join(ROOT, "apps/web/src/lib/api.ts"))).toBe(true);
    expect(existsSync(join(ROOT, "apps/web/src/lib/client.ts"))).toBe(false);
  }, 60_000);

  it("fails a counterfeit local operation, an uncalled wrapper, a discarded result and a type error ([[D2960]])", () => {
    const path = "apps/server/src/account-data.ts";
    const original = readFileSync(join(ROOT, path), "utf8");
    const counterfeit = original.replace(/import \{ parseConceptRef, /u, "import { ").replace("function validateExportedConcept(", "function parseConceptRef(value: unknown) { return value as { id: string }; }\nfunction validateExportedConcept(");
    expect(consumerReceipt(compileProject("server", { [path]: counterfeit }), path, "parseConceptRef").liveCalls).toBe(0);
    const uncalled = original.replace("if (tableName === \"attempt_concepts\") validateExportedConcept(record, `${at}[${index}].record`);", "");
    expect(consumerReceipt(compileProject("server", { [path]: uncalled }), path, "parseConceptRef")).toMatchObject({ liveCalls: 0, deadCalls: 1 });
    const discarded = original.replace("try { ref = parseConceptRef(record.concept); }", "try { parseConceptRef(record.concept); ref = { id: \"x\" as never }; }");
    expect(consumerReceipt(compileProject("server", { [path]: discarded }), path, "parseConceptRef").discardedCalls).toBe(1);
    const invalid = original.replace("function validateExportedConcept(record: Readonly<Record<string, unknown>>, at: string): void {", "function validateExportedConcept(record: Readonly<Record<string, unknown>>, at: string): void {\n  const wrong: number = \"typed\";");
    expect(consumerReceipt(compileProject("server", { [path]: invalid }), path, "parseConceptRef").diagnostics.length).toBeGreaterThan(0);
  }, 120_000);

  it("compiles each project under its own committed options, never a merged configuration ([[D2961]])", () => {
    const server = compiled("server").program.getCompilerOptions();
    const web = compiled("web").program.getCompilerOptions();
    expect(web.checkJs).toBe(true);
    expect(server.checkJs).toBeUndefined();
    expect(compiled("server").reachable.has(join(ROOT, "apps/web/src/lib/api.ts"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------
// The retained structural scan: one compiler, one reader, no second map, no pack-scoped fallback.

function productionFiles(directory: string): readonly string[] {
  const absolute = join(ROOT, directory);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "dist" || entry.name === "node_modules" || entry.name === "fixtures" ? [] : productionFiles(path);
    return /\.(?:ts|svelte)$/u.test(entry.name) && !/\.test(?:-support)?\.ts$|\.test\.ts$|test-support/u.test(entry.name) ? [path] : [];
  });
}
const PRODUCTION = [...productionFiles("apps/server/src"), ...productionFiles("apps/web/src"), ...productionFiles("packages/runtime/src"), ...productionFiles("packages/schema/src")];
const source = (path: string): string => readFileSync(join(ROOT, path), "utf8");

describe("criteria 4 and 11 — the structural scan and the successor walls", () => {
  it("has exactly one production mint call and one reader of content/concepts", () => {
    expect(PRODUCTION.filter((path) => /\bcompileConceptRegistry\s*\(/u.test(source(path)) && !path.endsWith("concept-registry.ts"))).toEqual(["apps/server/src/concept-registry-loader.ts"]);
    expect(PRODUCTION.filter((path) => /content\/concepts/u.test(source(path)))).toEqual(["apps/server/src/concept-registry-loader.ts"]);
  });

  it("keeps no pack-scoped resolver, no local concept map and no registered-key constructor outside the registry", () => {
    for (const path of PRODUCTION) {
      const text = source(path);
      expect(text, path).not.toMatch(/PackScopedConceptResolver|same_concept_in_pack/u);
      if (!/packages\/runtime\/src\/concept-registry\.ts$/u.test(path)) expect(text, path).not.toMatch(/`concept:\$\{[^`]*\}@1`/u);
    }
    // The legacy `pack:<id>#<raw>` grammar survives only as the quarantine raw key.
    expect(PRODUCTION.filter((path) => /`pack:\$\{[^`]*\}#\$\{/u.test(source(path)) || /`pack:\$\{row\.packId\}#`/u.test(source(path))).sort()).toEqual(["apps/server/src/concept-migration.ts", "apps/server/src/progress.ts"]);
  });

  it("keeps Campaign and Skills as successor discharges: neither holds a local registry, and a sighting is not a credit", () => {
    const successors = PRODUCTION.filter((path) => /campaign|skills-contract|learner-profile/u.test(path));
    expect(successors.length).toBeGreaterThan(0);
    for (const path of successors) {
      const text = source(path);
      expect(text, path).not.toMatch(/compileConceptRegistry|conceptRegistryRevisionBytes|concepts\/revisions|installedConceptRegistry/u);
    }
    // Campaign has no concept consumer at this landing.
    expect(PRODUCTION.filter((path) => /campaign/u.test(path) && /ConceptRef|concept_reference|conceptReferences/u.test(source(path)))).toEqual([]);
    // Skills reads identity only through the reference projection and credits nothing from it.
    const profile = source("apps/server/src/learner-profile.ts");
    expect(profile).toMatch(/conceptReferences/u);
    expect(profile).not.toMatch(/learner_marks/u);
  });
});
