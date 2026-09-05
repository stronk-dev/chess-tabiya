import { execFileSync } from "node:child_process";
import path from "node:path";

import ts from "typescript";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import { deepSealCanonicalV2 } from "../d2645-shared-resource-bootstrap-eighth-author-repair/model.mjs";
import {
  assertTypeScriptGraphV3,
  createClosedRepositoryProjector,
} from "../d2667-shared-resource-bootstrap-ninth-author-repair/model.mjs";

function fail(message) {
  throw new TypeError(message);
}

function git(repositoryRoot, args) {
  try {
    return execFileSync("git", ["-C", repositoryRoot, ...args], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    fail(`repository:${args[0]}`);
  }
}

function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label}:object`);
  const actual = Object.keys(value).sort().join("\0");
  const expected = [...keys].sort().join("\0");
  if (actual !== expected) fail(`${label}:keys`);
}

function parseJsonWithoutDuplicateKeys(text, fileName) {
  const source = ts.parseJsonText(fileName, text);
  if (source.parseDiagnostics.length > 0 || source.statements.length !== 1 || !ts.isExpressionStatement(source.statements[0])) {
    fail("program:config-json");
  }
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const keys = new Set();
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) {
          fail("program:config-shape");
        }
        if (keys.has(property.name.text)) fail("program:config-duplicate-key");
        keys.add(property.name.text);
      }
    }
    node.forEachChild(visit);
  };
  visit(source);
  try {
    return JSON.parse(text);
  } catch {
    fail("program:config-json");
  }
}

function assertCommittedConfig(repositoryRoot, revision) {
  const commit = git(repositoryRoot, ["rev-parse", "--verify", `${revision}^{commit}`]).trim();
  const configText = git(repositoryRoot, ["show", `${commit}:tsconfig.base.json`]);
  const config = parseJsonWithoutDuplicateKeys(configText, "tsconfig.base.json");
  exactKeys(config, ["compilerOptions"], "program:config");
}

function walkTree(tree, visit) {
  visit(tree);
  for (const child of tree.children) walkTree(child, visit);
}

function assertClosedSyntax(graph) {
  for (const node of graph.nodes) {
    if (node.origin !== "repository") continue;
    walkTree(node.tree, (tree) => {
      if (tree.kind === "ImportKeyword") fail("resolution:dynamic-import");
      if (tree.kind === "ElementAccessExpression") {
        const open = tree.children.findIndex((child) => child.kind === "OpenBracketToken");
        const close = tree.children.findIndex((child) => child.kind === "CloseBracketToken");
        const argument = open >= 0 && close === open + 2 ? tree.children[open + 1] : undefined;
        if (!argument || !["StringLiteral", "NumericLiteral"].includes(argument.kind)) fail("resolution:broad-index");
      }
    });
  }
  for (const edge of graph.edges) {
    if (["call", "construct", "tag"].includes(edge.kind) && edge.resolvedSignature === null) {
      fail("resolution:unresolved-signature");
    }
  }
}

function sourceDigest(node) {
  return sharedResourceDigest({ syntaxTree: node.tree });
}

function enrichDependencyIdentity(graph) {
  const clone = structuredClone(graph);
  for (const node of clone.nodes) {
    if (node.origin === "repository") continue;
    node.dependencyIdentity = {
      ...node.dependencyIdentity,
      sourceDigest: sourceDigest(node),
    };
  }
  return clone;
}

function assertDependencyForOrigin(node, program) {
  if (node.origin === "repository") {
    if (node.dependencyIdentity !== null || !node.id.startsWith("src/") && !node.id.startsWith("apps/") && !node.id.startsWith("packages/")) {
      fail("graph:repository-origin");
    }
    return;
  }
  exactKeys(node.dependencyIdentity, ["package", "version", "integrity", "sourceDigest"], "dependency");
  if (!/^sha256:[0-9a-f]{64}$/u.test(node.dependencyIdentity.sourceDigest)) fail("dependency:source-digest");
  if (node.origin === "typescript_lib") {
    if (node.dependencyIdentity.package !== "typescript" || node.dependencyIdentity.version !== program.compilerVersion ||
        node.dependencyIdentity.integrity !== program.compilerIntegrity || !node.id.startsWith("typescript_lib\0lib.")) {
      fail("dependency:typescript-origin");
    }
  } else if (node.origin === "node_builtin") {
    if (node.dependencyIdentity.package !== "@types/node" || !node.id.startsWith("node_builtin\0@types/node@")) {
      fail("dependency:node-origin");
    }
  } else if (node.origin === "external_package") {
    if (["typescript", "@types/node"].includes(node.dependencyIdentity.package) ||
        !node.id.startsWith(`external_package\0${node.dependencyIdentity.package}@${node.dependencyIdentity.version}+${node.dependencyIdentity.integrity}\0`)) {
      fail("dependency:package-origin");
    }
  } else {
    fail("dependency:origin");
  }
}

export function assertTypeScriptGraphV4(graph, selectors, expectedProgram) {
  const legacy = structuredClone(graph);
  for (const node of legacy.nodes) {
    if (node.origin !== "repository") {
      const { sourceDigest: ignored, ...identity } = node.dependencyIdentity;
      void ignored;
      node.dependencyIdentity = identity;
    }
  }
  assertTypeScriptGraphV3(legacy, selectors, expectedProgram);
  const selectorKeys = graph.roots.map((root) => root.selector);
  if (new Set(selectorKeys).size !== selectorKeys.length) fail("graph:duplicate-root");
  for (const node of graph.nodes) assertDependencyForOrigin(node, graph.program);
  for (const edge of graph.edges) {
    if (["call", "construct", "tag"].includes(edge.kind)) {
      if (edge.resolvedSignature === null || edge.overloads.length === 0) fail("graph:call-arm");
    } else if (edge.resolvedSignature !== null || edge.overloads.length !== 0) {
      fail("graph:non-call-arm");
    }
  }
  assertClosedSyntax(graph);
  deepSealCanonicalV2(graph);
  return true;
}

export function createExactClosedRepositoryProjector(repositoryPath) {
  const repositoryRoot = path.resolve(repositoryPath);
  const base = createClosedRepositoryProjector(repositoryRoot);
  return function project(descriptor, revision) {
    assertCommittedConfig(repositoryRoot, revision);
    const roots = [...descriptor.projection.roots, descriptor.projection.versionSelector];
    if (new Set(roots).size !== roots.length) fail("descriptor:duplicate-root");
    const baseProjection = base(descriptor, revision);
    assertClosedSyntax(baseProjection.semantic);
    const semantic = enrichDependencyIdentity(baseProjection.semantic);
    assertTypeScriptGraphV4(semantic, baseProjection.resolvedSelectors, semantic.program);
    const sealed = deepSealCanonicalV2(semantic);
    return Object.freeze({
      identity: baseProjection.identity,
      semantic: sealed,
      digest: sharedResourceDigest({
        adapter: "typescript_contract@1",
        version: baseProjection.identity.version,
        graph: sealed,
      }),
      resolvedSelectors: baseProjection.resolvedSelectors,
    });
  };
}
