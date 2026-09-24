// rfc/longitudinal-store.md §C/criterion 6 — the TypeScript-AST source-mutation compiler. It derives
// the register from the actual `this.#upsertLongitudinalWatermark({ symbol, effect }, …)` call nodes in
// `SQLiteRunStorage` and requires each to sit inside its own method's literal `BEGIN IMMEDIATE …
// COMMIT`. Comments and strings are invisible to the AST; wrong methods, outside-transaction calls,
// duplicates, renames and wrong effects all fail bidirectional equality with the normative list.
import * as ts from "typescript";

import { LONGITUDINAL_SOURCE_MUTATION_OPERATIONS } from "./longitudinal-store.js";

export interface CompiledLongitudinalMutation {
  readonly symbol: string;
  readonly effect: string;
}

function fail(code: string, detail: string): never {
  throw new TypeError(`${code}: ${detail}`);
}

function isThisDatabaseExec(node: ts.Node, literal: string): node is ts.CallExpression {
  if (!ts.isCallExpression(node) || node.arguments.length !== 1) return false;
  const argument = node.arguments[0]!;
  if (!ts.isStringLiteralLike(argument) || argument.text !== literal) return false;
  const callee = node.expression;
  if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== "exec") return false;
  const database = callee.expression;
  return ts.isPropertyAccessExpression(database) && ts.isPrivateIdentifier(database.name)
    && database.name.text === "#database" && database.expression.kind === ts.SyntaxKind.ThisKeyword;
}

function isWatermarkCall(node: ts.Node): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) return false;
  const callee = node.expression;
  return ts.isPropertyAccessExpression(callee) && ts.isPrivateIdentifier(callee.name)
    && callee.name.text === "#upsertLongitudinalWatermark" && callee.expression.kind === ts.SyntaxKind.ThisKeyword;
}

function descriptor(call: ts.CallExpression): CompiledLongitudinalMutation {
  const argument = call.arguments[0];
  if (argument === undefined || !ts.isObjectLiteralExpression(argument) || argument.properties.length !== 2) {
    fail("LONGITUDINAL_MUTATION_DESCRIPTOR_MALFORMED", call.getText());
  }
  const values = new Map<string, string>();
  for (const property of argument.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name) || !ts.isStringLiteralLike(property.initializer)) {
      fail("LONGITUDINAL_MUTATION_DESCRIPTOR_MALFORMED", call.getText());
    }
    values.set(property.name.text, property.initializer.text);
  }
  const symbol = values.get("symbol");
  const effect = values.get("effect");
  if (symbol === undefined || effect === undefined) fail("LONGITUDINAL_MUTATION_DESCRIPTOR_MALFORMED", call.getText());
  return { symbol, effect };
}

export function compileLongitudinalMutationCensus(source: string, className = "SQLiteRunStorage"): readonly CompiledLongitudinalMutation[] {
  const file = ts.createSourceFile("storage.ts", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const found: CompiledLongitudinalMutation[] = [];
  const outsideMethods: ts.CallExpression[] = [];
  const visitClass = (declaration: ts.ClassDeclaration): void => {
    for (const member of declaration.members) {
      if (!ts.isMethodDeclaration(member) || member.body === undefined) continue;
      const method = member.name.getText(file);
      const begins: number[] = [];
      const commits: number[] = [];
      const calls: ts.CallExpression[] = [];
      const walk = (node: ts.Node): void => {
        if (isThisDatabaseExec(node, "BEGIN IMMEDIATE")) begins.push(node.getStart(file));
        if (isThisDatabaseExec(node, "COMMIT")) commits.push(node.getStart(file));
        if (isWatermarkCall(node)) calls.push(node);
        ts.forEachChild(node, walk);
      };
      walk(member.body);
      for (const call of calls) {
        const compiled = descriptor(call);
        const at = call.getStart(file);
        const begin = Math.max(...begins.filter((position) => position < at), -1);
        const commitBetween = commits.some((position) => position > begin && position < at);
        const commitAfter = commits.some((position) => position > at);
        if (begin < 0 || commitBetween || !commitAfter) fail("LONGITUDINAL_MUTATION_OUTSIDE_TRANSACTION", `${method}: ${compiled.symbol}`);
        if (compiled.symbol !== `${className}#${method}`) fail("LONGITUDINAL_MUTATION_WRONG_METHOD", `${method}: ${compiled.symbol}`);
        found.push(compiled);
      }
    }
  };
  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node) && node.name?.text === className) visitClass(node);
    else if (isWatermarkCall(node) && ts.findAncestor(node, (ancestor) => ts.isClassDeclaration(ancestor) && ancestor.name?.text === className) === undefined) outsideMethods.push(node);
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (outsideMethods.length > 0) fail("LONGITUDINAL_MUTATION_OUTSIDE_TRANSACTION", "call outside the storage class");
  const keys = found.map((row) => `${row.symbol}\0${row.effect}`);
  if (new Set(found.map((row) => row.symbol)).size !== found.length) fail("LONGITUDINAL_MUTATION_OPERATION_DUPLICATE", keys.join(","));
  return Object.freeze(found.map((row) => Object.freeze(row)));
}

/** Bidirectional equality with the normative eleven-row authority. */
export function assertLongitudinalMutationCensus(found: readonly CompiledLongitudinalMutation[]): void {
  const expected = LONGITUDINAL_SOURCE_MUTATION_OPERATIONS.map((row) => `${row.symbol}\0${row.effect}`).sort();
  const actual = found.map((row) => `${row.symbol}\0${row.effect}`).sort();
  const missing = expected.filter((key) => !actual.includes(key));
  const surplus = actual.filter((key) => !expected.includes(key));
  if (missing.length > 0 || surplus.length > 0) {
    fail("LONGITUDINAL_MUTATION_OPERATION_MISMATCH", `missing ${missing.map((key) => key.replace("\0", "/")).join(",") || "none"}; surplus ${surplus.map((key) => key.replace("\0", "/")).join(",") || "none"}`);
  }
}
