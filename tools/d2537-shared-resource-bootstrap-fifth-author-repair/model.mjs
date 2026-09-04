import ts from "typescript";
import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";

function fail(message) {
  throw new TypeError(message);
}

function declarationName(node) {
  return node.name && ts.isIdentifier(node.name) ? node.name.text : undefined;
}

export function retainedRepositoryNodeIds(path, sourceText, retainedNames) {
  const retained = new Set(retainedNames);
  const source = ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declarations = [];
  const visit = (node) => {
    if (ts.isDeclaration(node) && retained.has(declarationName(node))) declarations.push(node);
    node.forEachChild(visit);
  };
  visit(source);
  return Object.freeze(declarations.map((node, ordinal) => Object.freeze({
    name: declarationName(node),
    id: `${path}\0${ordinal}`,
  })));
}

export function buildProgramIdentity({ configText, rootNames, compilerVersion, compilerIntegrity }) {
  const config = JSON.parse(configText);
  if (config === null || typeof config !== "object" || Array.isArray(config) ||
      Object.keys(config).some((key) => key !== "compilerOptions") ||
      config.compilerOptions === null || typeof config.compilerOptions !== "object" || Array.isArray(config.compilerOptions)) {
    fail("program config must contain only compilerOptions");
  }
  const converted = ts.convertCompilerOptionsFromJson(config.compilerOptions, process.cwd());
  if (converted.errors.length > 0) fail("invalid compiler option");
  const normalizedRoots = [...new Set(rootNames)].sort();
  if (normalizedRoots.length === 0 || normalizedRoots.some((path) => path.startsWith("/") || path.includes(".."))) {
    fail("invalid program roots");
  }
  const compilerOptions = Object.freeze({
    ...converted.options,
    types: Object.freeze([]),
    noEmit: true,
    incremental: false,
    composite: false,
    preserveSymlinks: false,
  });
  return Object.freeze({
    compilerPackage: "typescript",
    compilerVersion,
    compilerIntegrity,
    configPath: "tsconfig.base.json",
    configDigest: sharedResourceDigest(config),
    rootNames: Object.freeze(normalizedRoots),
    compilerOptions,
  });
}

export function selectorRoot(selector, node) {
  return Object.freeze({ kind: "selector", selector, node });
}

export function migrationApplyRoot(sequenceSelector, version, node) {
  if (!Number.isSafeInteger(version) || version < 1) fail("invalid migration version");
  return Object.freeze({ kind: "migration_apply", sequenceSelector, version, property: "apply", node });
}

export function projectCanonicalResource(descriptorId, rootSelector, resource) {
  if (resource.id !== descriptorId) fail("resource id does not match descriptor");
  if (resource.payload === null || typeof resource.payload !== "object" || Array.isArray(resource.payload)) {
    fail("canonical resource payload object required");
  }
  const expected = sharedResourceDigest({ id: resource.id, version: resource.version, payload: resource.payload });
  if (resource.digest !== expected) fail("resource digest mismatch");
  return Object.freeze({
    identity: Object.freeze({ version: resource.version }),
    semantic: resource.payload,
    digest: resource.digest,
    resolvedSelectors: Object.freeze([rootSelector]),
  });
}

export function projectTypeScriptContract({ version, graph, roots, versionSelector }) {
  if (!Number.isSafeInteger(version) || version < 1) fail("invalid contract version");
  if (graph === null || typeof graph !== "object" || !Array.isArray(graph.roots) || !Array.isArray(graph.nodes) ||
      graph.program === null || typeof graph.program !== "object" || !Array.isArray(graph.program.rootNames)) {
    fail("invalid TypeScript graph");
  }
  const selectors = [...roots, versionSelector];
  const selectorRoots = graph.roots.filter((root) => root?.kind === "selector");
  if (selectorRoots.length !== graph.roots.length || selectorRoots.length !== selectors.length ||
      new Set(selectorRoots.map((root) => root.selector)).size !== selectorRoots.length ||
      selectors.some((selector) => !selectorRoots.some((root) => root.selector === selector)) ||
      selectorRoots.some((root) => !selectors.includes(root.selector))) {
    fail("TypeScript graph roots do not match descriptor selectors");
  }
  const nodeIds = new Set(graph.nodes.map((node) => node?.id));
  if (selectorRoots.some((root) => typeof root.node !== "string" || !nodeIds.has(root.node))) {
    fail("TypeScript graph root does not name a retained node");
  }
  const sourcePaths = new Set(selectors.map((selector) => selector.slice(0, selector.indexOf("#"))));
  if (sourcePaths.size === 0 || [...sourcePaths].some((path) => !graph.program.rootNames.includes(path)) ||
      graph.program.rootNames.some((path) => !sourcePaths.has(path))) {
    fail("TypeScript program roots do not match descriptor selectors");
  }
  return Object.freeze({
    identity: Object.freeze({ version }),
    semantic: graph,
    digest: sharedResourceDigest({ adapter: "typescript_contract@1", version, graph }),
    resolvedSelectors: Object.freeze(selectors),
  });
}
