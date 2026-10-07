// rfc/pack-capability-contract.md §2.5 — source-site census and wiring checks.
// D3528: site images/closure remain only for the existing historical migration-proof instrument;
// the capability generator no longer calls them or infers compatibility from source bytes.
//
// A symbol site selects exactly one named top-level declaration; an arm site selects the arms of a
// named owner whose condition compares `<x>.<property>` to the member literal (or tests
// `"<member>" in <x>` for a key union). The image of an arm site is the owner's token stream with
// the arm bodies that belong exclusively to OTHER members elided, so a shared preamble, a shared
// fallthrough and a nested visitor stay inside every member's meaning while an unrelated arm does
// not. The canonical image is JCS over the domain tag, the site record and the ordered
// `(SyntaxKind name, token text)` stream with trivia and JSDoc excluded.
//
// Closure follows value symbols only: every identifier inside the kept region resolves through the
// checker (aliases followed); a declaration in a repository source file adds its top-level
// statement as a further site, recursively; a declaration inside `node_modules` records the external
// package, whose lockfile-resolved identity becomes a `package_dependency` source. Type-only
// declarations (interfaces, type aliases) carry no runtime behaviour and are not followed.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

import * as ts from "typescript";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

export const SITE_IMAGE_DOMAIN = "tabiya.capability.site.v1" as const;

export type CapabilitySite =
  | { readonly kind: "symbol"; readonly module: string; readonly symbol: string }
  | { readonly kind: "discriminant_arm"; readonly module: string; readonly owner: string; readonly property: string; readonly value: string };

export interface SiteClosure {
  /** Every `module#symbol` reached, including the roots. */
  readonly sites: readonly string[];
  /** External packages reached from any site in the closure. */
  readonly packages: readonly string[];
}

export class CapabilitySiteError extends TypeError {
  readonly code: "CAPABILITY_NAMED_ROOT_MISSING" | "CAPABILITY_SITE_AMBIGUOUS" | "CAPABILITY_ARM_MISSING";
  constructor(code: CapabilitySiteError["code"], message: string) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

export const sha256Hex = (value: string): string => createHash("sha256").update(value).digest("hex");

const SOURCE_ROOTS = ["apps/server/src", "packages/runtime/src", "packages/schema/src"] as const;

function listSources(root: string): string[] {
  const out: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory)) {
      const path = resolve(directory, entry);
      const stat = statSync(path);
      if (stat.isDirectory()) {
        // `testing/` holds test-only helpers (imported by *.test.ts alone): not production meaning.
        if (entry === "node_modules" || entry === "dist" || entry === "fixtures" || entry === "testing") continue;
        walk(path);
      } else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts") && !entry.endsWith(".d.ts") && !entry.endsWith(".generated.ts")) out.push(path);
    }
  };
  for (const source of SOURCE_ROOTS) {
    const directory = resolve(root, source);
    if (existsSync(directory)) walk(directory);
  }
  return out.sort();
}

let webReaderCache: { readonly root: string; readonly texts: readonly string[] } | undefined;
function webReaders(root: string): readonly string[] {
  if (webReaderCache?.root === root) return webReaderCache.texts;
  const texts: string[] = [];
  const walk = (directory: string): void => {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory)) {
      const path = resolve(directory, entry);
      if (statSync(path).isDirectory()) { if (entry !== "node_modules" && entry !== "dist") walk(path); continue; }
      if ((entry.endsWith(".ts") || entry.endsWith(".svelte")) && !entry.endsWith(".test.ts")) texts.push(readFileSync(path, "utf8"));
    }
  };
  walk(resolve(root, "apps/web/src"));
  webReaderCache = { root, texts };
  return texts;
}

function topLevelName(statement: ts.Statement): readonly string[] {
  if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) && statement.name !== undefined) return [statement.name.text];
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.flatMap((declaration) => (ts.isIdentifier(declaration.name) ? [declaration.name.text] : []));
  }
  if ((ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) && statement.name !== undefined) return [statement.name.text];
  return [];
}

function isTypeOnly(statement: ts.Statement): boolean {
  return ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement);
}

function isJsDoc(node: ts.Node): boolean {
  return node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode;
}

/** Leaf tokens of `node` in source order, trivia and JSDoc excluded, skipping elided subtrees. */
function tokens(node: ts.Node, sourceFile: ts.SourceFile, elided: ReadonlySet<ts.Node>, out: [string, string][]): void {
  if (elided.has(node) || isJsDoc(node)) return;
  const children = node.getChildren(sourceFile);
  if (children.length === 0) {
    if (node.kind === ts.SyntaxKind.EndOfFileToken) return;
    out.push([ts.SyntaxKind[node.kind]!, node.getText(sourceFile)]);
    return;
  }
  for (const child of children) tokens(child, sourceFile, elided, out);
}

function literalsOfArmCondition(expression: ts.Expression, property: string): readonly string[] {
  const out: string[] = [];
  const visit = (node: ts.Expression): void => {
    if (ts.isParenthesizedExpression(node)) { visit(node.expression); return; }
    if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken.kind;
      if (operator === ts.SyntaxKind.BarBarToken) { visit(node.left); visit(node.right); return; }
      if (operator === ts.SyntaxKind.EqualsEqualsEqualsToken || operator === ts.SyntaxKind.EqualsEqualsToken) {
        const pairs: [ts.Expression, ts.Expression][] = [[node.left, node.right], [node.right, node.left]];
        for (const [access, literal] of pairs) {
          if (ts.isPropertyAccessExpression(access) && access.name.text === property && ts.isStringLiteralLike(literal)) out.push(literal.text);
        }
        return;
      }
      if (operator === ts.SyntaxKind.InKeyword && property === "in" && ts.isStringLiteralLike(node.left)) out.push(node.left.text);
    }
  };
  visit(expression);
  return out;
}

interface Arm {
  readonly members: readonly string[];
  readonly body: ts.Node;
}

function armsOf(owner: ts.Node, property: string): readonly Arm[] {
  const arms: Arm[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isIfStatement(node)) {
      const members = literalsOfArmCondition(node.expression, property);
      if (members.length > 0) arms.push({ members, body: node.thenStatement });
    }
    if (ts.isSwitchStatement(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === property) {
      const clauses = node.caseBlock.clauses;
      clauses.forEach((clause, index) => {
        if (!ts.isCaseClause(clause) || !ts.isStringLiteralLike(clause.expression) || clause.statements.length === 0) return;
        // Empty fallthrough labels immediately above share this clause's statements.
        const members = [clause.expression.text];
        for (let back = index - 1; back >= 0; back -= 1) {
          const previous = clauses[back]!;
          if (!ts.isCaseClause(previous) || previous.statements.length > 0 || !ts.isStringLiteralLike(previous.expression)) break;
          members.push(previous.expression.text);
        }
        arms.push({ members, body: clause });
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(owner);
  return arms;
}

export interface SourceIndexOptions {
  readonly root: string;
  /** Exact repo-relative source replacements used by mutation fixtures (criterion 13). */
  readonly overrides?: Readonly<Record<string, string>>;
}

/**
 * Capability boundaries: interpreter sites whose meaning is its own capability family. A closure
 * stops at them — a `structuralExpression.feature` node dispatches to the feature evaluator, and the
 * specific feature's meaning is carried by that feature's own capability (which the same document
 * also requires), not copied into every node that can reach it.
 */
export interface ClosureOptions {
  readonly boundaries?: ReadonlySet<string>;
}

export class CapabilitySourceIndex {
  readonly root: string;
  readonly #program: ts.Program;
  readonly #checker: ts.TypeChecker;
  readonly #statements = new Map<string, { readonly file: ts.SourceFile; readonly statement: ts.Statement }[]>();
  readonly #closureCache = new Map<string, SiteClosure>();
  readonly #imageCache = new Map<string, string>();
  readonly #referenceCache = new Map<string, { readonly sites: readonly string[]; readonly packages: readonly string[] }>();

  constructor(options: SourceIndexOptions) {
    this.root = resolve(options.root);
    const overrides = new Map(Object.entries(options.overrides ?? {}).map(([path, text]) => [resolve(this.root, path), text]));
    const compilerOptions: ts.CompilerOptions = {
      allowImportingTsExtensions: true,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      types: [],
    };
    const host = ts.createCompilerHost(compilerOptions, true);
    const readFile = host.readFile.bind(host);
    host.readFile = (fileName) => overrides.get(resolve(fileName)) ?? readFile(fileName);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
      const override = overrides.get(resolve(fileName));
      return override !== undefined
        ? ts.createSourceFile(fileName, override, languageVersion, true)
        : getSourceFile(fileName, languageVersion, onError, shouldCreate);
    };
    this.#program = ts.createProgram(listSources(this.root), compilerOptions, host);
    this.#checker = this.#program.getTypeChecker();
    for (const file of this.#program.getSourceFiles()) {
      const module = this.moduleOf(file.fileName);
      if (module === undefined) continue;
      for (const statement of file.statements) {
        for (const name of topLevelName(statement)) {
          const key = `${module}#${name}`;
          const rows = this.#statements.get(key) ?? [];
          rows.push({ file, statement });
          this.#statements.set(key, rows);
        }
      }
    }
  }

  /** Repo-relative POSIX module path for a repository source file; undefined outside it. */
  moduleOf(fileName: string): string | undefined {
    const path = relative(this.root, resolve(fileName)).split(sep).join("/");
    if (path.startsWith("..") || path.includes("node_modules/") || path.endsWith(".d.ts")) return undefined;
    return path;
  }

  hasSite(site: string): boolean {
    return (this.#statements.get(site)?.length ?? 0) === 1;
  }

  siteCount(site: string): number {
    return this.#statements.get(site)?.length ?? 0;
  }

  #declaration(site: string): { readonly file: ts.SourceFile; readonly statement: ts.Statement } {
    const rows = this.#statements.get(site) ?? [];
    if (rows.length === 0) throw new CapabilitySiteError("CAPABILITY_NAMED_ROOT_MISSING", `${site} does not resolve to a named top-level declaration`);
    if (rows.length > 1) throw new CapabilitySiteError("CAPABILITY_SITE_AMBIGUOUS", `${site} resolves to ${rows.length} declarations`);
    return rows[0]!;
  }

  /** The canonical source image digest (hex) of one site. */
  siteImage(site: CapabilitySite): string {
    const cacheKey = canonicalizeJson(site);
    const cached = this.#imageCache.get(cacheKey);
    if (cached !== undefined) return cached;
    const image = this.#computeSiteImage(site);
    this.#imageCache.set(cacheKey, image);
    return image;
  }

  #computeSiteImage(site: CapabilitySite): string {
    const key = `${site.module}#${site.kind === "symbol" ? site.symbol : site.owner}`;
    const { file, statement } = this.#declaration(key);
    const elided = new Set<ts.Node>();
    if (site.kind === "discriminant_arm") {
      for (const arm of armsOf(statement, site.property)) if (!arm.members.includes(site.value)) elided.add(arm.body);
    }
    const stream: [string, string][] = [];
    tokens(statement, file, elided, stream);
    return sha256Hex(canonicalizeJson({ domain: SITE_IMAGE_DOMAIN, site, tokens: stream }));
  }

  /** The members an owner interprets through explicit arms on `property`. */
  armMembers(site: string, property: string): readonly string[] {
    const { statement } = this.#declaration(site);
    return [...new Set(armsOf(statement, property).flatMap((arm) => arm.members))].sort();
  }

  /** Direct references of one statement (minus elided subtrees): repository sites and packages. */
  #directReferences(key: string, elided: ReadonlySet<ts.Node>): { readonly sites: readonly string[]; readonly packages: readonly string[] } {
    const cacheable = elided.size === 0;
    const cached = cacheable ? this.#referenceCache.get(key) : undefined;
    if (cached !== undefined) return cached;
    const { statement } = this.#declaration(key);
    const sites = new Set<string>();
    const packages = new Set<string>();
    const visit = (node: ts.Node): void => {
      if (elided.has(node)) return;
      if (ts.isIdentifier(node)) {
        let symbol = this.#checker.getSymbolAtLocation(node);
        if (symbol !== undefined && (symbol.flags & ts.SymbolFlags.Alias) !== 0) {
          try { symbol = this.#checker.getAliasedSymbol(symbol); } catch { /* unresolved alias */ }
        }
        for (const declaration of symbol?.declarations ?? []) {
          const file = declaration.getSourceFile();
          const normalized = file.fileName.split(sep).join("/");
          const nodeModules = normalized.lastIndexOf("/node_modules/");
          if (nodeModules >= 0) {
            const rest = normalized.slice(nodeModules + "/node_modules/".length).split("/");
            const name = rest[0]!.startsWith("@") ? `${rest[0]}/${rest[1]}` : rest[0]!;
            if (!name.startsWith("@types/") && name !== "typescript") packages.add(name);
            continue;
          }
          const module = this.moduleOf(file.fileName);
          if (module === undefined) continue;
          let top: ts.Node = declaration;
          while (top.parent !== undefined && !ts.isSourceFile(top.parent)) top = top.parent;
          if (!ts.isStatement(top as ts.Node) || isTypeOnly(top as ts.Statement)) continue;
          if (top === statement) continue;
          for (const name of topLevelName(top as ts.Statement)) {
            const next = `${module}#${name}`;
            if ((this.#statements.get(next)?.length ?? 0) !== 1) continue;
            if (this.#statements.get(next)![0]!.statement !== top) continue;
            sites.add(next);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(statement);
    const result = { sites: [...sites], packages: [...packages] };
    if (cacheable) this.#referenceCache.set(key, result);
    return result;
  }

  /** Symbol-reference closure of one site (arm-scoped for an arm site). */
  closure(site: CapabilitySite, options: ClosureOptions = {}): SiteClosure {
    const rootKey = `${site.module}#${site.kind === "symbol" ? site.symbol : site.owner}`;
    const boundaries = options.boundaries ?? new Set<string>();
    const cacheKey = `${canonicalizeJson(site)}|${[...boundaries].sort().join(",")}`;
    const cached = this.#closureCache.get(cacheKey);
    if (cached !== undefined) return cached;
    const sites = new Set<string>([rootKey]);
    const packages = new Set<string>();
    const { statement: rootStatement } = this.#declaration(rootKey);
    const rootElided = new Set<ts.Node>();
    if (site.kind === "discriminant_arm") {
      for (const arm of armsOf(rootStatement, site.property)) if (!arm.members.includes(site.value)) rootElided.add(arm.body);
    }
    const queue: { key: string; elided: ReadonlySet<ts.Node> }[] = [{ key: rootKey, elided: rootElided }];
    while (queue.length > 0) {
      const { key, elided } = queue.shift()!;
      const references = this.#directReferences(key, elided);
      for (const name of references.packages) packages.add(name);
      for (const next of references.sites) if (!sites.has(next) && !boundaries.has(next)) { sites.add(next); queue.push({ key: next, elided: new Set() }); }
    }
    const result = Object.freeze({ sites: Object.freeze([...sites].sort()), packages: Object.freeze([...packages].sort()) });
    this.#closureCache.set(cacheKey, result);
    return result;
  }

  /**
   * Whether any production identifier outside the declaration itself resolves to `site`. The web
   * client is outside this program; a runtime export it imports by name also counts as a reader.
   */
  hasProductionReader(site: string): boolean {
    const { statement } = this.#declaration(site);
    const name = site.slice(site.indexOf("#") + 1);
    if (site.startsWith("packages/runtime/") && webReaders(this.root).some((text) => text.includes("@chess-tabiya/runtime") && new RegExp(`\\b${name}\\b`, "u").test(text))) return true;
    for (const file of this.#program.getSourceFiles()) {
      if (this.moduleOf(file.fileName) === undefined || !file.text.includes(name)) continue;
      let found = false;
      const visit = (node: ts.Node): void => {
        if (found || node === statement) return;
        if (ts.isIdentifier(node) && node.text === name) {
          let symbol = this.#checker.getSymbolAtLocation(node);
          if (symbol !== undefined && (symbol.flags & ts.SymbolFlags.Alias) !== 0) {
            try { symbol = this.#checker.getAliasedSymbol(symbol); } catch { /* unresolved alias */ }
          }
          if (symbol?.declarations?.some((declaration) => {
            let top: ts.Node = declaration;
            while (top.parent !== undefined && !ts.isSourceFile(top.parent)) top = top.parent;
            return top === statement;
          }) === true && !ts.isImportSpecifier(node.parent) && !ts.isExportSpecifier(node.parent)) found = true;
        }
        ts.forEachChild(node, visit);
      };
      visit(file);
      if (found) return true;
    }
    return false;
  }

  /**
   * Every function in the source roots that asserts exhaustiveness (`const x: never = value`) over a
   * value whose declared type is one of `typeNames`, keyed by type name.
   */
  exhaustiveSites(typeNames: readonly string[]): ReadonlyMap<string, readonly string[]> {
    const out = new Map<string, Set<string>>();
    for (const file of this.#program.getSourceFiles()) {
      const module = this.moduleOf(file.fileName);
      if (module === undefined || !module.includes("/src/")) continue;
      const visit = (node: ts.Node): void => {
        if (ts.isVariableDeclaration(node) && node.type?.kind === ts.SyntaxKind.NeverKeyword && node.initializer !== undefined && ts.isIdentifier(node.initializer)) {
          const symbol = this.#checker.getSymbolAtLocation(node.initializer);
          const declaration = symbol?.valueDeclaration;
          const declared = declaration !== undefined ? this.#checker.getTypeAtLocation(declaration) : undefined;
          const name = declared?.aliasSymbol?.name ?? declared?.getSymbol()?.name;
          if (name !== undefined && typeNames.includes(name)) {
            let top: ts.Node = node;
            while (top.parent !== undefined && !ts.isSourceFile(top.parent)) top = top.parent;
            for (const symbolName of topLevelName(top as ts.Statement)) {
              const set = out.get(name) ?? new Set<string>();
              set.add(`${module}#${symbolName}`);
              out.set(name, set);
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(file);
    }
    return new Map([...out].map(([name, set]) => [name, Object.freeze([...set].sort())]));
  }

  /** The declared (un-narrowed) type alias name of an identifier. */
  #declaredTypeName(expression: ts.Expression): string | undefined {
    if (!ts.isIdentifier(expression)) return undefined;
    const declaration = this.#checker.getSymbolAtLocation(expression)?.valueDeclaration;
    if (declaration === undefined) return undefined;
    const declared = this.#checker.getTypeAtLocation(declaration);
    return declared.aliasSymbol?.name ?? declared.getSymbol()?.name;
  }

  /**
   * §2.5 / criterion 6: every top-level declaration that branches on two or more members of a census
   * type — `x.<discriminator> === "<member>"` or `"<member>" in x`, with `x` declared as that type —
   * interprets the vocabulary, whether or not it asserts exhaustiveness. Keyed by type name.
   */
  armSites(typeNames: readonly string[]): ReadonlyMap<string, readonly string[]> {
    const out = new Map<string, Set<string>>();
    for (const file of this.#program.getSourceFiles()) {
      const module = this.moduleOf(file.fileName);
      if (module === undefined || !module.includes("/src/")) continue;
      for (const statement of file.statements) {
        const names = topLevelName(statement);
        if (names.length === 0) continue;
        const members = new Map<string, Set<string>>();
        const note = (typeName: string | undefined, member: string): void => {
          if (typeName === undefined || !typeNames.includes(typeName)) return;
          const set = members.get(typeName) ?? new Set<string>();
          set.add(member);
          members.set(typeName, set);
        };
        const visit = (node: ts.Node): void => {
          if (ts.isBinaryExpression(node)) {
            const operator = node.operatorToken.kind;
            if (operator === ts.SyntaxKind.EqualsEqualsEqualsToken || operator === ts.SyntaxKind.EqualsEqualsToken) {
              for (const [access, literal] of [[node.left, node.right], [node.right, node.left]] as const) {
                if (ts.isPropertyAccessExpression(access) && ts.isStringLiteralLike(literal)) note(this.#declaredTypeName(access.expression), literal.text);
              }
            }
            if (operator === ts.SyntaxKind.InKeyword && ts.isStringLiteralLike(node.left)) note(this.#declaredTypeName(node.right), node.left.text);
          }
          if (ts.isSwitchStatement(node) && ts.isPropertyAccessExpression(node.expression)) {
            const typeName = this.#declaredTypeName(node.expression.expression);
            for (const clause of node.caseBlock.clauses) if (ts.isCaseClause(clause) && ts.isStringLiteralLike(clause.expression)) note(typeName, clause.expression.text);
          }
          ts.forEachChild(node, visit);
        };
        visit(statement);
        for (const [typeName, set] of members) {
          if (set.size < 2) continue;
          const sites = out.get(typeName) ?? new Set<string>();
          for (const name of names) sites.add(`${module}#${name}`);
          out.set(typeName, sites);
        }
      }
    }
    return new Map([...out].map(([name, set]) => [name, Object.freeze([...set].sort())]));
  }

  /**
   * §2.1a / criterion 5: a suffixed version literal (`"x@1"`, `"x@v1"`) is illegal where it becomes
   * capability AUTHORITY — the id argument of `capabilityId`/`semverCapabilityId`, or the `id` of an
   * object literal contextually typed `CapabilityId`, or any value contextually typed `CapabilityKey`.
   * `legacyCapabilityFixture`/`parseLegacyCapability` are the sanctioned compatibility boundary, and
   * unrelated versioned schema strings are not capability positions. Type-directed, not a grep.
   */
  capabilityLiteralViolations(): readonly string[] {
    const suffixed = /^[A-Za-z][A-Za-z0-9_.:-]*@v?[0-9]+$/u;
    const out: string[] = [];
    for (const file of this.#program.getSourceFiles()) {
      const module = this.moduleOf(file.fileName);
      if (module === undefined || !module.includes("/src/")) continue;
      const visit = (node: ts.Node): void => {
        if (ts.isStringLiteralLike(node) && suffixed.test(node.text)) {
          const parent = node.parent;
          let violation = false;
          if (ts.isCallExpression(parent) && parent.arguments[0] === node) {
            // Call identity, not spelling: an aliased import of the constructor is still the constructor.
            const calleeNode = ts.isPropertyAccessExpression(parent.expression) ? parent.expression.name : parent.expression;
            let callee = this.#checker.getSymbolAtLocation(calleeNode);
            if (callee !== undefined && (callee.flags & ts.SymbolFlags.Alias) !== 0) {
              try { callee = this.#checker.getAliasedSymbol(callee); } catch { /* unresolved alias */ }
            }
            if (callee !== undefined && ["capabilityId", "semverCapabilityId"].includes(callee.name)) violation = true;
          }
          if (ts.isPropertyAssignment(parent) && parent.initializer === node && ts.isIdentifier(parent.name) && parent.name.text === "id") {
            const contextual = this.#checker.getContextualType(parent.parent as ts.ObjectLiteralExpression);
            const name = contextual?.aliasSymbol?.name ?? contextual?.getSymbol()?.name;
            if (name === "CapabilityId") violation = true;
          }
          const contextual = this.#checker.getContextualType(node as ts.Expression);
          if ((contextual?.aliasSymbol?.name ?? "") === "CapabilityKey") violation = true;
          if (violation) {
            const { line } = file.getLineAndCharacterOfPosition(node.getStart(file));
            out.push(`${module}:${line + 1} ${JSON.stringify(node.text)}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(file);
    }
    return Object.freeze(out.sort());
  }
}
