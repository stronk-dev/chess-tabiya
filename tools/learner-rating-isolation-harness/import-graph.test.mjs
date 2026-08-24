import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const ROOT = process.cwd();
const RATING = resolve(ROOT, "packages/runtime/src/rating.ts");
const RENDERING_ROOTS = Object.freeze([
  "apps/server/src/guard.ts",
  "apps/server/src/guard-conditions.ts",
  "packages/runtime/src/voice.ts",
  "apps/web/src/lib/outcome-presentation.ts",
  "packages/runtime/src/feedback.ts",
  "packages/runtime/src/objective.ts",
  "apps/server/src/sourcing/claim-binding.ts",
].map((file) => resolve(ROOT, file)));
const OPTIONS = Object.freeze({
  allowImportingTsExtensions: true,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
});
const INCLUDED_ROOTS = Object.freeze([
  resolve(ROOT, "apps/server/src"),
  resolve(ROOT, "apps/web/src"),
  resolve(ROOT, "packages/runtime/src"),
]);

function included(file) {
  return INCLUDED_ROOTS.some((directory) => file.startsWith(`${directory}/`)) && !file.endsWith(".d.ts");
}

function imports(file) {
  const source = readFileSync(file, "utf8");
  return ts.preProcessFile(source, true, true).importedFiles.flatMap(({ fileName }) => {
    const resolvedModule = ts.resolveModuleName(fileName, file, OPTIONS, ts.sys).resolvedModule;
    if (resolvedModule === undefined) return [];
    const resolvedFile = resolve(resolvedModule.resolvedFileName);
    return included(resolvedFile) ? [resolvedFile] : [];
  });
}

function graphFrom(entries) {
  const graph = new Map();
  const pending = [...entries];
  while (pending.length > 0) {
    const file = pending.pop();
    if (file === undefined || graph.has(file)) continue;
    const edges = imports(file);
    graph.set(file, edges);
    pending.push(...edges);
  }
  return graph;
}

function pathBetween(graph, from, to) {
  const pending = [[from]];
  const seen = new Set();
  while (pending.length > 0) {
    const path = pending.shift();
    const file = path?.at(-1);
    if (path === undefined || file === undefined || seen.has(file)) continue;
    if (file === to) return path;
    seen.add(file);
    for (const next of graph.get(file) ?? []) pending.push([...path, next]);
  }
  return undefined;
}

test("learner rating is unreachable from every rendered-language root in both directions", () => {
  for (const file of [RATING, ...RENDERING_ROOTS]) assert.equal(existsSync(file), true, `missing AC-11 graph root: ${file}`);
  const graph = graphFrom([RATING, ...RENDERING_ROOTS]);
  for (const root of RENDERING_ROOTS) {
    assert.equal(pathBetween(graph, root, RATING), undefined, `${root} reaches rating.ts`);
    assert.equal(pathBetween(graph, RATING, root), undefined, `rating.ts reaches ${root}`);
  }

  const attacked = new Map(graph);
  attacked.set(RENDERING_ROOTS[0], [...(attacked.get(RENDERING_ROOTS[0]) ?? []), RATING]);
  assert.deepEqual(pathBetween(attacked, RENDERING_ROOTS[0], RATING), [RENDERING_ROOTS[0], RATING], "positive control did not detect a rating edge");
});

test("rating has an explicit package subpath and is absent from the general runtime barrel", () => {
  const manifest = JSON.parse(readFileSync(resolve(ROOT, "packages/runtime/package.json"), "utf8"));
  assert.equal(manifest.exports["./rating"], "./src/rating.ts");
  assert.doesNotMatch(readFileSync(resolve(ROOT, "packages/runtime/src/index.ts"), "utf8"), /from ["']\.\/rating\.js["']/u);
});
