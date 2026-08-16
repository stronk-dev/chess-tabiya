import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import type { DrillPackDefinition, SpineNode } from "@chess-tabiya/schema/drill-pack";
import { FORMAT_DISPOSITIONS } from "@chess-tabiya/schema/drill-pack";
import { transitionReading } from "@chess-tabiya/runtime";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import * as ts from "typescript";

export type DeclarationNamespace = "schema" | "error" | "assistance" | "runtime";

export interface DeclarationSite {
  readonly module: string;
  readonly symbol: string;
}

export interface RefusalSite extends DeclarationSite {
  readonly code: string;
}

export interface DeclarationRecord {
  readonly namespace: DeclarationNamespace;
  readonly subject: string;
  readonly declaredAt: DeclarationSite;
  readonly producers: readonly DeclarationSite[];
  readonly consumers: readonly DeclarationSite[];
  readonly refusalSites: readonly RefusalSite[];
  readonly corpusFirings: number | null;
  readonly dispositionRow: string | null;
}

interface InternalDeclaration {
  readonly namespace: DeclarationNamespace;
  readonly subject: string;
  readonly token: string;
  readonly pointer?: string;
  readonly value?: string;
  readonly declaredAt: DeclarationSite;
  readonly runtimeRole?: "callable" | "value";
}

export interface DeclarationCensusOptions {
  readonly root?: string;
  readonly packs?: readonly DrillPackDefinition[];
  /** Exact repo-relative source replacements used by mutation tests. */
  readonly sourceOverrides?: Readonly<Record<string, string>>;
}

export interface DeclarationTotals {
  readonly schema: NamespaceDeclarationTotals;
  readonly error: NamespaceDeclarationTotals;
  readonly assistance: NamespaceDeclarationTotals;
  readonly runtime: NamespaceDeclarationTotals;
  readonly corpus: { readonly transitions: number };
}

export interface NamespaceDeclarationTotals {
  readonly subjects: number;
  readonly producersZero: number;
  readonly consumersZero: number;
  readonly dispositionMissing: number;
  readonly excludedSet: readonly string[];
}

const EXCLUDED_SET = Object.freeze([
  "node_modules/",
  "dist/",
  "*.test.ts",
  "*.spec.ts",
  "content/",
  "tools/",
]);

function display(root: string, file: string): string {
  return relative(root, file).replaceAll("\\", "/");
}

function sourceText(root: string, file: string, overrides: Readonly<Record<string, string>>): string {
  const key = display(root, file);
  return overrides[key] ?? readFileSync(file, "utf8");
}

function productionFiles(root: string): readonly string[] {
  const result: string[] = [];
  const visit = (path: string): void => {
    let entries;
    try { entries = readdirSync(path, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const absolute = resolve(path, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", "dist"].includes(entry.name)) continue;
        visit(absolute);
      } else if (/\.(?:ts|svelte)$/u.test(entry.name) && !/\.(?:test|spec)\.ts$/u.test(entry.name)) {
        result.push(absolute);
      }
    }
  };
  visit(resolve(root, "apps"));
  visit(resolve(root, "packages"));
  return result.sort();
}

function parseSource(file: string, text: string): ts.SourceFile {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

function site(root: string, file: string, node: ts.Node): DeclarationSite {
  let cursor: ts.Node | undefined = node;
  while (cursor !== undefined) {
    if ((ts.isFunctionDeclaration(cursor) || ts.isClassDeclaration(cursor) || ts.isMethodDeclaration(cursor)) && cursor.name !== undefined) {
      return { module: display(root, file), symbol: cursor.name.getText() };
    }
    if (ts.isVariableDeclaration(cursor) && ts.isIdentifier(cursor.name)) {
      return { module: display(root, file), symbol: cursor.name.text };
    }
    cursor = cursor.parent;
  }
  return { module: display(root, file), symbol: "<module>" };
}

function uniqueSites<T extends DeclarationSite>(values: readonly T[]): readonly T[] {
  const seen = new Set<string>();
  return Object.freeze(values.filter((value) => {
    const key = `${value.module}\0${value.symbol}${"code" in value ? `\0${String(value.code)}` : ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((left, right) => left.module.localeCompare(right.module) || left.symbol.localeCompare(right.symbol)));
}

function literalText(node: ts.Node): string | undefined {
  return ts.isStringLiteralLike(node) ? node.text : ts.isIdentifier(node) ? node.text : undefined;
}

function propertyName(node: ts.PropertyName | undefined): string | undefined {
  return node === undefined ? undefined : literalText(node);
}

function resolveRef(document: any, ref: string): any {
  if (!ref.startsWith("#/")) return undefined;
  return ref.slice(2).split("/").reduce((value, token) => value?.[token.replaceAll("~1", "/").replaceAll("~0", "~")], document);
}

function pointerToken(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function schemaDeclarations(module: string, document: any): readonly InternalDeclaration[] {
  const result = new Map<string, InternalDeclaration>();
  const visit = (node: any, pointer: string, refs: readonly string[]): void => {
    if (node === null || typeof node !== "object") return;
    if (typeof node.$ref === "string") {
      if (refs.includes(node.$ref)) return;
      visit(resolveRef(document, node.$ref), pointer, [...refs, node.$ref]);
    }
    for (const branch of [...(node.allOf ?? []), ...(node.anyOf ?? []), ...(node.oneOf ?? [])]) visit(branch, pointer, refs);
    if (Array.isArray(node.enum)) {
      for (const value of node.enum.filter((item: unknown): item is string => typeof item === "string")) {
        const subject = `${pointer}=${JSON.stringify(value)}`;
        result.set(`value\0${subject}`, { namespace: "schema", subject, token: value, pointer, value, declaredAt: { module, symbol: pointer } });
      }
    }
    for (const [key, child] of Object.entries(node.properties ?? {})) {
      const childPointer = `${pointer}/${pointerToken(key)}`;
      result.set(`property\0${childPointer}`, { namespace: "schema", subject: childPointer, token: key, pointer: childPointer, declaredAt: { module, symbol: childPointer } });
      visit(child, childPointer, refs);
    }
    if (node.items !== undefined) visit(node.items, `${pointer}/*`, refs);
  };
  visit(document, "", []);
  return [...result.values()];
}

function typeAliasStrings(source: ts.SourceFile, name: string): readonly string[] {
  const result: string[] = [];
  const visitType = (node: ts.Node): void => {
    if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) result.push(node.literal.text);
    node.forEachChild(visitType);
  };
  for (const statement of source.statements) {
    if (ts.isTypeAliasDeclaration(statement) && statement.name.text === name) visitType(statement.type);
  }
  return [...new Set(result)].sort();
}

function assistanceDeclarations(module: string, source: ts.SourceFile): readonly InternalDeclaration[] {
  const result: InternalDeclaration[] = [];
  const declaration = source.statements.find((statement): statement is ts.InterfaceDeclaration =>
    ts.isInterfaceDeclaration(statement) && statement.name.text === "AssistanceConfig");
  if (declaration === undefined) return result;
  for (const member of declaration.members) {
    if (!ts.isPropertySignature(member)) continue;
    const axis = propertyName(member.name);
    if (axis === undefined) continue;
    result.push({ namespace: "assistance", subject: axis, token: axis, pointer: `assistance:${axis}`, declaredAt: { module, symbol: `AssistanceConfig.${axis}` } });
    const values: string[] = [];
    member.type?.forEachChild(function visit(node): void {
      if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) values.push(node.literal.text);
      node.forEachChild(visit);
    });
    for (const value of [...new Set(values)].sort()) {
      result.push({ namespace: "assistance", subject: `${axis}=${JSON.stringify(value)}`, token: value, pointer: `assistance:${axis}`, value, declaredAt: { module, symbol: `AssistanceConfig.${axis}` } });
    }
  }
  return result;
}

function modulePath(indexFile: string, specifier: string): string {
  const base = resolve(indexFile, "..");
  return resolve(base, specifier.replace(/\.js$/u, ".ts"));
}

function resolveRuntimeType(
  root: string,
  moduleFile: string,
  name: string,
  overrides: Readonly<Record<string, string>>,
  visited: ReadonlySet<string> = new Set(),
): { readonly module: string; readonly source: ts.SourceFile; readonly declaration: ts.TypeAliasDeclaration } | undefined {
  if (visited.has(moduleFile)) return undefined;
  const source = parseSource(moduleFile, sourceText(root, moduleFile, overrides));
  const declaration = source.statements.find((item): item is ts.TypeAliasDeclaration => ts.isTypeAliasDeclaration(item) && item.name.text === name);
  if (declaration !== undefined) return { module: display(root, moduleFile), source, declaration };
  for (const item of source.statements) {
    if (!ts.isExportDeclaration(item) || item.moduleSpecifier === undefined || !ts.isStringLiteral(item.moduleSpecifier) || item.exportClause === undefined || !ts.isNamedExports(item.exportClause)) continue;
    if (!item.exportClause.elements.some((element) => element.name.text === name || element.propertyName?.text === name)) continue;
    const resolved = resolveRuntimeType(root, modulePath(moduleFile, item.moduleSpecifier.text), name, overrides, new Set([...visited, moduleFile]));
    if (resolved !== undefined) return resolved;
  }
  return undefined;
}

function runtimeDeclarations(root: string, indexFile: string, indexSource: ts.SourceFile, overrides: Readonly<Record<string, string>>): readonly InternalDeclaration[] {
  const result = new Map<string, InternalDeclaration>();
  for (const statement of indexSource.statements) {
    if (!ts.isExportDeclaration(statement) || statement.moduleSpecifier === undefined || !ts.isStringLiteral(statement.moduleSpecifier) || statement.exportClause === undefined || !ts.isNamedExports(statement.exportClause)) continue;
    const moduleFile = modulePath(indexFile, statement.moduleSpecifier.text);
    const module = display(root, moduleFile);
    const moduleSource = parseSource(moduleFile, sourceText(root, moduleFile, overrides));
    const exported = new Set(statement.exportClause.elements.map((element) => element.name.text));
    for (const item of moduleSource.statements) {
      if (ts.isFunctionDeclaration(item) && item.name !== undefined && exported.has(item.name.text)) {
        const name = item.name.text;
        const typeText = item.type?.getText(moduleSource) ?? "";
        if (!name.startsWith("render") && (/(?:Reading|Observation|Delta)$/u.test(name) || /(?:Reading|Observation|Delta)/u.test(typeText))) {
          result.set(`callable\0${name}`, { namespace: "runtime", subject: name, token: name, declaredAt: { module, symbol: name }, runtimeRole: "callable" });
        }
      }
      if (ts.isTypeAliasDeclaration(item) && exported.has(item.name.text) && /(?:Detail|Observation)$/u.test(item.name.text)) {
        const literals = typeAliasStrings(moduleSource, item.name.text);
        for (const value of literals) {
          const subject = `${item.name.text}=${JSON.stringify(value)}`;
          result.set(`value\0${subject}`, { namespace: "runtime", subject, token: value, value, declaredAt: { module, symbol: item.name.text }, runtimeRole: "value" });
        }
      }
      if (ts.isVariableStatement(item)) {
        for (const declaration of item.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name) || !exported.has(declaration.name.text) || !/_KINDS$/u.test(declaration.name.text)) continue;
          const values: string[] = [];
          declaration.initializer?.forEachChild(function visit(node): void {
            if (ts.isStringLiteral(node)) values.push(node.text);
            node.forEachChild(visit);
          });
          for (const value of [...new Set(values)].sort()) {
            const subject = `${declaration.name.text}=${JSON.stringify(value)}`;
            result.set(`value\0${subject}`, { namespace: "runtime", subject, token: value, value, declaredAt: { module, symbol: declaration.name.text }, runtimeRole: "value" });
          }
        }
      }
    }
    for (const name of [...exported].filter((value) => /(?:Detail|Observation)$/u.test(value))) {
      if ([...result.values()].some((value) => value.subject.startsWith(`${name}=`))) continue;
      const resolved = resolveRuntimeType(root, moduleFile, name, overrides);
      if (resolved === undefined) continue;
      for (const value of typeAliasStrings(resolved.source, name)) {
        const subject = `${name}=${JSON.stringify(value)}`;
        result.set(`value\0${subject}`, { namespace: "runtime", subject, token: value, value, declaredAt: { module: resolved.module, symbol: name }, runtimeRole: "value" });
      }
    }
  }
  return [...result.values()];
}

function descendantStrings(node: ts.Node): readonly string[] {
  const result: string[] = [];
  const visit = (child: ts.Node): void => {
    if (ts.isStringLiteralLike(child)) result.push(child.text);
    child.forEachChild(visit);
  };
  visit(node);
  return result;
}

function callName(node: ts.CallExpression | ts.NewExpression): string {
  const expression = node.expression;
  return ts.isIdentifier(expression) ? expression.text : ts.isPropertyAccessExpression(expression) ? expression.name.text : expression.getText();
}

function nearestStatement(node: ts.Node): ts.Node {
  let cursor = node;
  while (cursor.parent !== undefined && !ts.isStatement(cursor) && !ts.isSourceFile(cursor)) cursor = cursor.parent;
  return cursor;
}

function isComparison(node: ts.Node): boolean {
  let cursor: ts.Node | undefined = node;
  for (let depth = 0; cursor !== undefined && depth < 5; depth += 1, cursor = cursor.parent) {
    if (ts.isCaseClause(cursor) || ts.isBinaryExpression(cursor)) return true;
    if (ts.isCallExpression(cursor) && ts.isPropertyAccessExpression(cursor.expression) && ["includes", "has"].includes(cursor.expression.name.text)) return true;
  }
  return false;
}

function isObjectProducer(node: ts.Node, declaration: InternalDeclaration): boolean {
  if (ts.isIdentifier(node) && ts.isPropertyAssignment(node.parent) && node.parent.name === node) return declaration.value === undefined;
  if (!ts.isStringLiteralLike(node)) return false;
  if (ts.isPropertyAssignment(node.parent) && node.parent.initializer === node) {
    if (declaration.namespace === "runtime" && declaration.runtimeRole === "value") return true;
    const expected = declaration.namespace === "assistance"
      ? declaration.pointer?.slice("assistance:".length)
      : declaration.pointer?.split("/").at(-1)?.replaceAll("~1", "/").replaceAll("~0", "~");
    return declaration.value !== undefined && propertyName(node.parent.name) === expected;
  }
  return false;
}

function refusalScope(node: ts.Node): ts.Node {
  let cursor: ts.Node = node;
  while (cursor.parent !== undefined && !ts.isFunctionLike(cursor.parent)) {
    cursor = cursor.parent;
    if (ts.isForOfStatement(cursor) || ts.isForInStatement(cursor) || ts.isForStatement(cursor) || ts.isIfStatement(cursor) || ts.isSwitchStatement(cursor)) return cursor;
  }
  return nearestStatement(node);
}

function dispositionKey(declaration: InternalDeclaration): string | null {
  if (declaration.namespace === "runtime" || declaration.pointer === undefined) return null;
  const pointer = declaration.namespace === "schema" ? declaration.pointer : declaration.pointer;
  const found = FORMAT_DISPOSITIONS.find((row) => row.pointer === pointer && (row.value ?? undefined) === (declaration.value ?? undefined));
  return found === undefined ? null : `${found.pointer}${found.value === undefined ? "" : `=${JSON.stringify(found.value)}`}`;
}

function valuesAtPointer(value: unknown, pointer: string): readonly unknown[] {
  const tokens = pointer.split("/").slice(1).map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
  let values: readonly unknown[] = [value];
  for (const token of tokens) {
    values = values.flatMap((current) => {
      if (token === "*") return Array.isArray(current) ? current : [];
      return current !== null && typeof current === "object" && Object.hasOwn(current, token) ? [(current as Record<string, unknown>)[token]] : [];
    });
  }
  return values;
}

function authoredTransitions(pack: DrillPackDefinition): readonly { before: string; moveUci: string; after: string }[] {
  const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
  const result: { before: string; moveUci: string; after: string }[] = [];
  const visit = (nodes: readonly SpineNode[], position: Chess): void => {
    for (const node of nodes) {
      const move = parseUci(node.moveUci);
      if (move === undefined || !position.isLegal(move)) continue;
      const next = position.clone();
      next.play(move);
      result.push({ before: makeFen(position.toSetup()), moveUci: node.moveUci, after: makeFen(next.toSetup()) });
      visit(node.children, next);
    }
  };
  visit(pack.spine ?? [], root);
  return result;
}

function corpusFirings(declaration: InternalDeclaration, packs: readonly DrillPackDefinition[], transitionCounts: ReadonlyMap<string, number>): number | null {
  if (declaration.namespace === "error") return null;
  if (declaration.namespace === "runtime") {
    if (declaration.runtimeRole === "callable") return null;
    return transitionCounts.get(declaration.value ?? "") ?? 0;
  }
  if (declaration.pointer === undefined) return null;
  if (declaration.namespace === "assistance") {
    const axis = declaration.pointer.slice("assistance:".length);
    const occurrences = packs.flatMap((pack) => valuesAtPointer(pack, `/${axis}`));
    return declaration.value === undefined ? occurrences.length : occurrences.filter((value) => value === declaration.value).length;
  }
  const occurrences = packs.flatMap((pack) => valuesAtPointer(pack, declaration.pointer!));
  return declaration.value === undefined ? occurrences.length : occurrences.filter((value) => value === declaration.value).length;
}

export function runDeclarationCensus(options: DeclarationCensusOptions = {}): {
  readonly declarations: readonly DeclarationRecord[];
  readonly totals: DeclarationTotals;
} {
  const root = resolve(options.root ?? process.cwd());
  const overrides = options.sourceOverrides ?? {};
  const schemaFile = resolve(root, "schemas/drill_pack.schema.json");
  const errorsFile = resolve(root, "apps/server/src/errors.ts");
  const assistanceFile = resolve(root, "packages/runtime/src/assistance.ts");
  const runtimeIndexFile = resolve(root, "packages/runtime/src/index.ts");
  const schemaDocument = JSON.parse(sourceText(root, schemaFile, overrides));
  const errorsSource = parseSource(errorsFile, sourceText(root, errorsFile, overrides));
  const assistanceSource = parseSource(assistanceFile, sourceText(root, assistanceFile, overrides));
  const runtimeIndexSource = parseSource(runtimeIndexFile, sourceText(root, runtimeIndexFile, overrides));
  const declarations: InternalDeclaration[] = [
    ...schemaDeclarations(display(root, schemaFile), schemaDocument),
    ...typeAliasStrings(errorsSource, "ServerErrorCode").map((code) => ({ namespace: "error" as const, subject: code, token: code, pointer: `error:${code}`, declaredAt: { module: display(root, errorsFile), symbol: "ServerErrorCode" } })),
    ...assistanceDeclarations(display(root, assistanceFile), assistanceSource),
    ...runtimeDeclarations(root, runtimeIndexFile, runtimeIndexSource, overrides),
  ];

  const byToken = new Map<string, InternalDeclaration[]>();
  for (const declaration of declarations) byToken.set(declaration.token, [...(byToken.get(declaration.token) ?? []), declaration]);
  const producers = new Map<InternalDeclaration, DeclarationSite[]>();
  const consumers = new Map<InternalDeclaration, DeclarationSite[]>();
  const refusals = new Map<InternalDeclaration, RefusalSite[]>();
  const files = productionFiles(root);
  const errorConstructorNames = new Set(["ServerError", "runtimeIssue", "runtimeWarning"]);
  for (const file of files) {
    const source = parseSource(file, sourceText(root, file, overrides));
    source.forEachChild(function discover(node): void {
      if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name !== undefined && node.parameters.some((parameter) => parameter.type?.getText(source).includes("ServerErrorCode"))) {
        errorConstructorNames.add(node.name.getText(source));
      }
      node.forEachChild(discover);
    });
  }
  for (const declaration of declarations.filter((value) => value.namespace === "runtime" && value.runtimeRole === "callable")) {
    producers.set(declaration, [declaration.declaredAt]);
  }

  for (const file of files) {
    const module = display(root, file);
    const text = sourceText(root, file, overrides);
    const source = parseSource(file, text);
    const instrumentOnly = /(?:^|\/)(?:pack-check|shape-check|expression-census|declaration-census)\.ts$/u.test(module);
    const refusalCalls: { readonly statement: ts.Node; readonly code: string }[] = [];
    source.forEachChild(function collectRefusals(node): void {
      if (ts.isCallExpression(node) && ["runtimeIssue", "runtimeWarning"].includes(callName(node))) {
        const code = descendantStrings(node.arguments[0] ?? node)[0];
        if (code !== undefined) refusalCalls.push({ statement: refusalScope(node), code });
      }
      node.forEachChild(collectRefusals);
    });
    source.forEachChild(function visit(node): void {
      const token = literalText(node);
      if (token !== undefined) {
        for (const declaration of byToken.get(token) ?? []) {
          if (module === declaration.declaredAt.module && nearestStatement(node).getText(source).includes(declaration.declaredAt.symbol)) continue;
          const foundSite = site(root, file, node);
          const refusal = refusalCalls.find((candidate) => candidate.statement.pos <= node.pos && candidate.statement.end >= node.end);
          if (declaration.namespace === "schema" && refusal !== undefined) {
            refusals.set(declaration, [...(refusals.get(declaration) ?? []), { ...foundSite, code: refusal.code }]);
            node.forEachChild(visit);
            return;
          }
          let cursor: ts.Node | undefined = node;
          let producerExpression: ts.CallExpression | ts.NewExpression | undefined;
          while (cursor !== undefined && !ts.isStatement(cursor) && !ts.isSourceFile(cursor)) {
            if ((ts.isCallExpression(cursor) || ts.isNewExpression(cursor)) && errorConstructorNames.has(callName(cursor))) producerExpression = cursor;
            cursor = cursor.parent;
          }
          const runtimeMatcher = declaration.namespace === "runtime" && declaration.runtimeRole === "value" && foundSite.symbol.startsWith("matches");
          if ((declaration.namespace === "error" && producerExpression !== undefined) || isObjectProducer(node, declaration) || runtimeMatcher) {
            producers.set(declaration, [...(producers.get(declaration) ?? []), foundSite]);
          } else if (!instrumentOnly && (isComparison(node) || (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) || (ts.isCallExpression(node.parent) && node.parent.expression === node))) {
            consumers.set(declaration, [...(consumers.get(declaration) ?? []), foundSite]);
          }
        }
      }
      node.forEachChild(visit);
    });
  }

  const packs = options.packs ?? [];
  const transitionCounts = new Map<string, number>();
  const edges = packs.flatMap(authoredTransitions);
  for (const edge of edges) {
    const reading = transitionReading(edge.before, edge.moveUci, edge.after);
    for (const observation of reading?.observations ?? []) {
      transitionCounts.set(observation.kind, (transitionCounts.get(observation.kind) ?? 0) + 1);
      if (observation.kind === "move_irreversibility") transitionCounts.set(observation.subkind, (transitionCounts.get(observation.subkind) ?? 0) + 1);
    }
  }
  const records = declarations.map((declaration): DeclarationRecord => Object.freeze({
    namespace: declaration.namespace,
    subject: declaration.subject,
    declaredAt: Object.freeze(declaration.declaredAt),
    producers: uniqueSites(producers.get(declaration) ?? []),
    consumers: uniqueSites(consumers.get(declaration) ?? []),
    refusalSites: uniqueSites(refusals.get(declaration) ?? []),
    corpusFirings: corpusFirings(declaration, packs, transitionCounts),
    dispositionRow: dispositionKey(declaration),
  })).sort((left, right) => left.namespace.localeCompare(right.namespace) || left.subject.localeCompare(right.subject));
  const namespaces = Object.fromEntries((["schema", "error", "assistance", "runtime"] as const).map((namespace) => {
    const rows = records.filter((record) => record.namespace === namespace);
    return [namespace, Object.freeze({
      subjects: rows.length,
      producersZero: rows.filter((row) => row.producers.length === 0).length,
      consumersZero: rows.filter((row) => row.consumers.length === 0).length,
      dispositionMissing: rows.filter((row) => row.dispositionRow === null).length,
      excludedSet: EXCLUDED_SET,
    })];
  })) as Readonly<Record<DeclarationNamespace, NamespaceDeclarationTotals>>;
  const totals: DeclarationTotals = Object.freeze({
    ...namespaces,
    corpus: Object.freeze({ transitions: edges.length }),
  });
  return Object.freeze({ declarations: Object.freeze(records), totals });
}
