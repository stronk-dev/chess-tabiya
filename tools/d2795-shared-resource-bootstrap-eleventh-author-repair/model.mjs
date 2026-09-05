import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import ts from "typescript";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import { deepSealCanonicalV2 } from "../d2645-shared-resource-bootstrap-eighth-author-repair/model.mjs";
import {
  assertTypeScriptGraphV3,
  createClosedRepositoryProjector,
} from "../d2667-shared-resource-bootstrap-ninth-author-repair/model.mjs";

const require = createRequire(import.meta.url);
const issuedGraphs = new WeakSet();

function fail(message) {
  throw new TypeError(message);
}

function walkTree(tree, visit) {
  visit(tree);
  for (const child of tree.children) walkTree(child, visit);
}

function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label}:object`);
  if (Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) fail(`${label}:keys`);
}

function rejectDuplicateConfigKeys(repositoryRoot, revision) {
  let text;
  try {
    const commit = execFileSync("git", ["-C", repositoryRoot, "rev-parse", "--verify", `${revision}^{commit}`], { encoding: "utf8" }).trim();
    text = execFileSync("git", ["-C", repositoryRoot, "show", `${commit}:tsconfig.base.json`], { encoding: "utf8" });
  } catch {
    fail("repository:config");
  }
  const source = ts.parseJsonText("tsconfig.base.json", text);
  if (source.parseDiagnostics.length > 0) fail("program:config-json");
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const names = new Set();
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) fail("program:config-shape");
        if (names.has(property.name.text)) fail("program:config-duplicate-key");
        names.add(property.name.text);
      }
    }
    node.forEachChild(visit);
  };
  visit(source);
}

function declarationFiles(root) {
  const files = [];
  const visit = (directory, prefix = "") => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const stat = lstatSync(absolute);
      if (stat.isSymbolicLink()) fail("dependency:artifact-symlink");
      if (stat.isDirectory()) {
        if (entry.name !== "node_modules") visit(absolute, relative);
      } else if (stat.isFile() && (relative === "package.json" || /\.(?:[cm]?[jt]sx?|d\.[cm]?ts)$/u.test(entry.name))) {
        files.push({ path: relative, bytes: readFileSync(absolute).toString("base64") });
      }
    }
  };
  visit(root);
  if (files.length === 0) fail("dependency:artifact-empty");
  return files;
}

function packageRoot(repositoryRoot, node) {
  if (node.origin === "typescript_lib") return path.dirname(require.resolve("typescript/package.json"));
  const packageName = node.dependencyIdentity.package;
  const local = path.join(repositoryRoot, "node_modules", ...packageName.split("/"));
  try {
    if (lstatSync(local).isDirectory()) return local;
  } catch {
    // Fall through to the importer-visible dependency used by the compiler image.
  }
  return path.dirname(require.resolve(`${packageName}/package.json`));
}

function artifactDigests(repositoryRoot, graph) {
  const values = new Map();
  for (const node of graph.nodes) {
    if (node.origin === "repository") continue;
    const root = packageRoot(repositoryRoot, node);
    const key = `${node.origin}\0${root}`;
    if (!values.has(key)) values.set(key, sharedResourceDigest({ declarationArtifact: declarationFiles(root) }));
  }
  return values;
}

function enrichExternalIdentity(repositoryRoot, graph) {
  const digests = artifactDigests(repositoryRoot, graph);
  const clone = structuredClone(graph);
  for (const node of clone.nodes) {
    if (node.origin === "repository") continue;
    const root = packageRoot(repositoryRoot, node);
    node.dependencyIdentity = {
      ...node.dependencyIdentity,
      sourceDigest: digests.get(`${node.origin}\0${root}`),
    };
  }
  return clone;
}

function constructorTrees(node) {
  const result = [];
  walkTree(node.tree, (tree) => {
    if (tree.kind === "Constructor") result.push(tree);
  });
  return result;
}

function repairConstructEdges(graph) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const edge of graph.edges) {
    if (edge.kind !== "construct") continue;
    const constructors = constructorTrees(nodes.get(edge.to));
    edge.overloads = constructors.length > 0 ? constructors : edge.resolvedSignature === null ? [] : [edge.resolvedSignature];
  }
  graph.edges.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return graph;
}

function propertyName(tree) {
  const names = [];
  walkTree(tree, (child) => {
    if (child.kind === "Identifier" && typeof child.text === "string") names.push(child.text);
  });
  return names.at(-1);
}

function assertClosedResolution(graph) {
  for (const node of graph.nodes) {
    if (node.origin !== "repository") continue;
    walkTree(node.tree, (tree) => {
      if (tree.kind === "ImportKeyword") fail("resolution:dynamic-import");
      if (tree.kind === "ComputedPropertyName") {
        const literal = tree.children.find((child) => child.kind === "StringLiteral" || child.kind === "NumericLiteral");
        if (!literal) fail("resolution:computed-property");
      }
      if (tree.kind === "ElementAccessExpression") {
        const open = tree.children.findIndex((child) => child.kind === "OpenBracketToken");
        const close = tree.children.findIndex((child) => child.kind === "CloseBracketToken");
        const argument = open >= 0 && close === open + 2 ? tree.children[open + 1] : undefined;
        if (!argument || !["StringLiteral", "NumericLiteral"].includes(argument.kind)) fail("resolution:broad-index");
      }
      if (tree.kind === "PropertyAccessExpression") {
        const name = propertyName(tree);
        if (!graph.edges.some((edge) => edge.from === node.id && edge.kind === "property_reference" && edge.exportPath.at(-1) === name)) {
          fail("resolution:any-member");
        }
      }
    });
  }
  for (const edge of graph.edges) {
    const target = graph.nodes.find((node) => node.id === edge.to);
    if (edge.kind === "call" && edge.exportPath.at(-1) === "eval" && target?.origin === "typescript_lib") fail("resolution:eval");
    if (["call", "construct", "tag"].includes(edge.kind)) {
      if (edge.resolvedSignature === null || edge.overloads.length === 0) fail("graph:call-arm");
    } else if (edge.resolvedSignature !== null || edge.overloads.length !== 0) {
      fail("graph:non-call-arm");
    }
  }
}

function assertDependency(node, program) {
  if (node.origin === "repository") {
    if (node.dependencyIdentity !== null) fail("graph:repository-origin");
    return;
  }
  exactKeys(node.dependencyIdentity, ["package", "version", "integrity", "sourceDigest"], "dependency");
  if (!/^sha256:[0-9a-f]{64}$/u.test(node.dependencyIdentity.sourceDigest)) fail("dependency:source-digest");
  if (node.origin === "typescript_lib" &&
      (node.dependencyIdentity.package !== "typescript" || node.dependencyIdentity.version !== program.compilerVersion ||
       node.dependencyIdentity.integrity !== program.compilerIntegrity)) fail("dependency:typescript-origin");
  if (node.origin === "node_builtin" && node.dependencyIdentity.package !== "@types/node") fail("dependency:node-origin");
  if (node.origin === "external_package" && ["typescript", "@types/node"].includes(node.dependencyIdentity.package)) fail("dependency:package-origin");
}

function validateIssuedGraph(graph, selectors, expectedProgram) {
  const legacy = structuredClone(graph);
  for (const node of legacy.nodes) {
    if (node.origin === "repository") continue;
    const { sourceDigest: ignored, ...identity } = node.dependencyIdentity;
    void ignored;
    node.dependencyIdentity = identity;
  }
  legacy.edges.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  assertTypeScriptGraphV3(legacy, selectors, expectedProgram);
  if (new Set(graph.roots.map((root) => root.selector)).size !== graph.roots.length) fail("graph:duplicate-root");
  for (const node of graph.nodes) assertDependency(node, graph.program);
  assertClosedResolution(graph);
  deepSealCanonicalV2(graph);
  return true;
}

export function assertTypeScriptGraphV5(graph, selectors, expectedProgram) {
  if (!issuedGraphs.has(graph)) fail("graph:authority");
  return validateIssuedGraph(graph, selectors, expectedProgram);
}

export function createArtifactClosedRepositoryProjector(repositoryPath) {
  const repositoryRoot = path.resolve(repositoryPath);
  const base = createClosedRepositoryProjector(repositoryRoot);
  return function project(descriptor, revision) {
    rejectDuplicateConfigKeys(repositoryRoot, revision);
    if (new Set([...descriptor.projection.roots, descriptor.projection.versionSelector]).size !== descriptor.projection.roots.length + 1) {
      fail("descriptor:duplicate-root");
    }
    const projected = base(descriptor, revision);
    const semantic = repairConstructEdges(enrichExternalIdentity(repositoryRoot, projected.semantic));
    validateIssuedGraph(semantic, projected.resolvedSelectors, semantic.program);
    const sealed = deepSealCanonicalV2(semantic);
    issuedGraphs.add(sealed);
    return Object.freeze({
      identity: projected.identity,
      semantic: sealed,
      digest: sharedResourceDigest({ adapter: "typescript_contract@1", version: projected.identity.version, graph: sealed }),
      resolvedSelectors: projected.resolvedSelectors,
    });
  };
}
