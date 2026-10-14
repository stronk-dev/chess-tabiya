// D3799 disposable source locator, not an execution/availability closure or production registry.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import ts from "typescript";
import { MODULE_CONSUMER_ACCEPTS, RECORDED_PATH_SUCCESSOR_REFS } from "../../packages/runtime/src/evidence-catalog.js";
import { evidenceValueRouteRegistry } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { moduleQuerySourceRoutes, routeReads } from "../../packages/runtime/src/module-query-sources.js";

const key = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
const accepted = MODULE_CONSUMER_ACCEPTS.full_inspector.map(key);
const windows = new Set(RECORDED_PATH_SUCCESSOR_REFS.map(key));
const target = accepted.filter(ref => !routeReads(ref, "fen") && !routeReads(ref, "afterFen|beforeFen|moveUci") && !windows.has(ref));
assert.equal(target.length, 35);
const registry = new Map(evidenceValueRouteRegistry().map(row => [row.route, row]));
const acquisition = new Set(moduleQuerySourceRoutes("full_inspector", accepted));
type Locator = { file: string; line: number; operation: string; callee: string };
const locators = new Map(target.map(ref => [ref, [] as Locator[]]));

function files(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return /^(node_modules|dist|testing|capability)$/u.test(entry.name) ? [] : files(path);
    return path.endsWith(".ts") && !/\.(test|spec|test-support|generated)\.ts$/u.test(path) && !path.includes("semantic-validation") ? [path] : [];
  });
}
function enclosing(node: ts.Node): string {
  let current: ts.Node | undefined = node;
  while (current !== undefined) {
    if ((ts.isFunctionDeclaration(current) || ts.isMethodDeclaration(current)) && current.name !== undefined) return current.name.getText();
    if (ts.isVariableDeclaration(current) && current.initializer !== undefined) return current.name.getText();
    current = current.parent;
  }
  return "module";
}
for (const file of [...files("packages/runtime/src"), ...files("apps/server/src")]) {
  if (file.endsWith("evidence-factories.ts") || file.includes("/internal/")) continue;
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const visit = (node: ts.Node): void => {
    // A literal route passed to any call is only a locator. Wrapper/import reach is reviewed
    // separately; a matched anchor is NEVER treated as source acquisition or a valid result.
    if (ts.isCallExpression(node)) for (const argument of node.arguments) {
      if (!ts.isStringLiteral(argument) || !locators.has(argument.text)) continue;
      locators.get(argument.text)!.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        operation: enclosing(node), callee: node.expression.getText(source) });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
const rows = target.map(ref => {
  const meta = registry.get(ref);
  assert(meta !== undefined, `missing factory ${ref}`);
  const arms = meta.arms.map(arm => Object.fromEntries(Object.entries(arm).map(([name, spec]) => {
    const { accepts: _accepts, ...safe } = spec as typeof spec & { accepts?: unknown };
    return [name, safe];
  })));
  return { projection: ref, factory: meta.symbol, shape: meta.shape, result: meta.result,
    dependency: meta.dependency, pending: meta.pending ?? null, arms,
    inspectorAcquires: acquisition.has(ref), callLocators: locators.get(ref),
    evidenceLimit: "metadata and literal call anchors only; not actual execution, authentication, provider availability or source qualification" };
});
assert.equal(new Set(rows.map(row => row.projection)).size, 35);
const report = { scope: "D3799 source-input and call-site locator, not production reach", acceptedRefs: accepted.length, targetRefs: rows.length, rows };
const output = `${JSON.stringify(report, null, 2)}\n`;
assert(Buffer.byteLength(output) < 64 * 1024);
writeFileSync(".cache/d3792-inspector-demand/source-matrix.json", output);
console.log(JSON.stringify({ accepted: accepted.length, targets: rows.length, acquiredByInspector: rows.filter(row => row.inspectorAcquires).length,
  withCallLocators: rows.filter(row => row.callLocators!.length > 0).length, bytes: Buffer.byteLength(output), scope: report.scope }));
for (const row of rows) console.log(`${row.projection} | ${row.dependency} | ${row.pending === null ? "no pending marker" : "source hold"} | ${row.callLocators!.map(call => `${call.file}:${call.line} ${call.operation}`).join("; ") || "no direct literal-call locator"}`);
