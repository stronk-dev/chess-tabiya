import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import ts from "typescript";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import { parseStructuralSelector } from "../d2593-shared-resource-bootstrap-seventh-author-repair/model.mjs";
import { deepSealCanonicalV2 } from "../d2645-shared-resource-bootstrap-eighth-author-repair/model.mjs";

function fail(message) {
  throw new TypeError(message);
}

function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label}:object`);
  const actual = Object.keys(value).sort().join("\0");
  const expected = [...keys].sort().join("\0");
  if (actual !== expected) fail(`${label}:keys`);
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

function repositorySnapshot(repositoryRoot, revision) {
  if (typeof revision !== "string" || revision.length === 0 || /[\u0000-\u001f\u007f]/u.test(revision)) fail("repository:revision");
  const commit = git(repositoryRoot, ["rev-parse", "--verify", `${revision}^{commit}`]).trim();
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail("repository:commit");
  const paths = new Set(git(repositoryRoot, ["ls-tree", "-r", "--name-only", "-z", commit]).split("\0").filter(Boolean));
  const cache = new Map();
  const read = (relativePath) => {
    const normalized = relativePath.split(path.sep).join("/");
    if (!paths.has(normalized)) return undefined;
    if (!cache.has(normalized)) cache.set(normalized, git(repositoryRoot, ["show", `${commit}:${normalized}`]));
    return cache.get(normalized);
  };
  return Object.freeze({ commit, paths, read });
}

function compilerIntegrity() {
  const packagePath = new URL("../../node_modules/typescript/package.json", import.meta.url);
  const compilerPath = new URL("../../node_modules/typescript/lib/typescript.js", import.meta.url);
  const hash = createHash("sha512");
  hash.update(readFileSync(packagePath));
  hash.update(Buffer.from([0]));
  hash.update(readFileSync(compilerPath));
  return `sha512:${hash.digest("hex")}`;
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch {
    fail(`${label}:json`);
  }
}

function parsePnpmIdentity(lockText, packageName, version) {
  if (typeof lockText !== "string") fail("dependency:lockfile-missing");
  const wanted = `${packageName}@${version}`;
  const lines = lockText.split(/\r?\n/u);
  const candidates = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^  ('?)([^']+?)\1:\s*$/u.exec(lines[index]);
    if (!match || !(match[2] === wanted || match[2].startsWith(`${wanted}(`))) continue;
    let integrity = null;
    for (let cursor = index + 1; cursor < lines.length && !/^  ('?)[^ ]/u.test(lines[cursor]); cursor += 1) {
      const found = /integrity:\s*([^,}\s]+)/u.exec(lines[cursor]);
      if (found) integrity = found[1];
    }
    candidates.push({ package: packageName, version, integrity });
  }
  const exact = candidates.filter((item) => typeof item.integrity === "string" && /^sha512-/u.test(item.integrity));
  if (exact.length !== 1) fail(`dependency:lock-identity:${packageName}`);
  return deepSealCanonicalV2(exact[0]);
}

function packageLocation(fileName) {
  const normalized = path.resolve(fileName).split(path.sep).join("/");
  const marker = "/node_modules/";
  const offset = normalized.lastIndexOf(marker);
  if (offset < 0) return null;
  const suffix = normalized.slice(offset + marker.length);
  const parts = suffix.split("/");
  const packageName = parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
  const depth = packageName.startsWith("@") ? 2 : 1;
  return {
    packageName,
    packageRoot: normalized.slice(0, offset + marker.length) + parts.slice(0, depth).join("/"),
    subpath: parts.slice(depth).join("/"),
  };
}

function parseConfig(text, repositoryRoot) {
  const config = parseJson(text, "program:config");
  exactKeys(config, ["compilerOptions"], "program:config");
  const converted = ts.convertCompilerOptionsFromJson(config.compilerOptions, repositoryRoot, "tsconfig.base.json");
  if (converted.errors.length > 0) fail("program:compiler-options");
  const options = { ...converted.options, types: [], noEmit: true, incremental: false, composite: false, preserveSymlinks: false };
  const canonical = {};
  for (const [key, value] of Object.entries(options).sort(([a], [b]) => a.localeCompare(b))) {
    if (value !== undefined) canonical[key] = value;
  }
  return { config, options, canonical: deepSealCanonicalV2(canonical) };
}

function createPinnedProgram(repositoryRoot, snapshot, rootNames) {
  const configText = snapshot.read("tsconfig.base.json");
  if (configText === undefined) fail("program:config-missing");
  const { config, options, canonical } = parseConfig(configText, repositoryRoot);
  const lockText = snapshot.read("pnpm-lock.yaml");
  const baseHost = ts.createCompilerHost(options, true);
  const rootPrefix = `${repositoryRoot}${path.sep}`;
  const classify = (fileName) => {
    const absolute = path.resolve(fileName);
    if (packageLocation(absolute)) return { kind: "package", absolute };
    if (absolute === repositoryRoot || absolute.startsWith(rootPrefix)) {
      return { kind: "repository", absolute, relative: path.relative(repositoryRoot, absolute).split(path.sep).join("/") };
    }
    return { kind: "external", absolute };
  };
  const readPinned = (fileName) => {
    const location = classify(fileName);
    return location.kind === "repository" ? snapshot.read(location.relative) : undefined;
  };
  const host = {
    ...baseHost,
    getCurrentDirectory: () => repositoryRoot,
    fileExists(fileName) {
      const location = classify(fileName);
      return location.kind === "repository" ? snapshot.paths.has(location.relative) : baseHost.fileExists(fileName);
    },
    readFile(fileName) {
      const location = classify(fileName);
      return location.kind === "repository" ? snapshot.read(location.relative) : baseHost.readFile(fileName);
    },
    realpath(fileName) {
      const location = classify(fileName);
      return location.kind === "repository" ? location.absolute : baseHost.realpath?.(fileName) ?? fileName;
    },
    getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
      const location = classify(fileName);
      if (location.kind === "repository") {
        const text = readPinned(fileName);
        return text === undefined ? undefined : ts.createSourceFile(location.absolute, text, languageVersion, true, ts.ScriptKind.TS);
      }
      return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    },
  };
  const program = ts.createProgram(rootNames.map((name) => path.join(repositoryRoot, name)), options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => diagnostic.file && classify(diagnostic.file.fileName).kind === "repository");
  if (diagnostics.length > 0) fail(`program:diagnostic:${diagnostics[0].code}`);
  return Object.freeze({
    program,
    checker: program.getTypeChecker(),
    classify,
    lockText,
    identity: deepSealCanonicalV2({
      compilerPackage: "typescript",
      compilerVersion: ts.version,
      compilerIntegrity: compilerIntegrity(),
      repositoryCommit: snapshot.commit,
      configPath: "tsconfig.base.json",
      configDigest: sharedResourceDigest(config),
      rootNames: [...rootNames],
      compilerOptions: canonical,
    }),
  });
}

function nodeName(node) {
  return node?.name && (ts.isIdentifier(node.name) || ts.isPrivateIdentifier(node.name) || ts.isStringLiteral(node.name))
    ? node.name.text.replace(/^#/u, "")
    : null;
}

function unalias(checker, input) {
  let symbol = input;
  const seen = new Set();
  while (symbol && (symbol.flags & ts.SymbolFlags.Alias) !== 0) {
    if (seen.has(symbol)) fail("symbol:alias-cycle");
    seen.add(symbol);
    symbol = checker.getAliasedSymbol(symbol);
  }
  return symbol;
}

function symbolAt(checker, node) {
  return unalias(checker, checker.getSymbolAtLocation(node));
}

function descendants(node) {
  const result = [];
  node.forEachChild((child) => {
    result.push(child, ...descendants(child));
  });
  return result;
}

function declarationChoice(declarations) {
  const implementation = declarations.filter((node) =>
    (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node)) && node.body,
  );
  if (implementation.length === 1) return implementation[0];
  return [...declarations].sort((a, b) => a.getSourceFile().fileName.localeCompare(b.getSourceFile().fileName) || a.pos - b.pos)[0];
}

function resolveRoot(image, parsed) {
  const source = image.program.getSourceFile(path.join(image.program.getCurrentDirectory(), parsed.path));
  if (!source) fail("selector:source");
  let symbol;
  let declarations = [];
  if (parsed.root.kind === "export") {
    const exported = image.checker.getExportsOfModule(image.checker.getSymbolAtLocation(source)).filter((item) => item.name === parsed.root.name);
    if (exported.length !== 1) fail(`selector:root-count:${exported.length}`);
    symbol = unalias(image.checker, exported[0]);
    declarations = [...(exported[0].declarations ?? []), ...(symbol?.declarations ?? [])];
  } else {
    const candidates = source.statements.filter((statement) => {
      if (parsed.root.kind === "interface") return ts.isInterfaceDeclaration(statement) && statement.name.text === parsed.root.name;
      if (parsed.root.kind === "type") return ts.isTypeAliasDeclaration(statement) && statement.name.text === parsed.root.name;
      if (parsed.root.kind === "function") return ts.isFunctionDeclaration(statement) && statement.name?.text === parsed.root.name;
      if (parsed.root.kind === "class") return ts.isClassDeclaration(statement) && statement.name?.text === parsed.root.name;
      return ts.isVariableStatement(statement) && statement.declarationList.declarations.some((node) => nodeName(node) === parsed.root.name);
    });
    const symbols = new Set();
    for (const candidate of candidates) {
      const names = ts.isVariableStatement(candidate)
        ? candidate.declarationList.declarations.filter((node) => nodeName(node) === parsed.root.name).map((node) => node.name)
        : [candidate.name];
      for (const name of names) if (name) symbols.add(symbolAt(image.checker, name));
    }
    symbols.delete(undefined);
    if (symbols.size !== 1) fail(`selector:root-symbol-count:${symbols.size}`);
    [symbol] = symbols;
    declarations = [...(symbol.declarations ?? [])];
  }
  declarations = [...new Set(declarations)];
  let selected = declarationChoice(symbol?.declarations?.length ? [...symbol.declarations] : declarations);
  for (const step of parsed.descent) {
    if (step.kind === "literal") {
      let candidate = selected.initializer ?? selected.type ?? selected;
      while (candidate && (ts.isParenthesizedExpression(candidate) || ts.isAsExpression(candidate) || ts.isSatisfiesExpression(candidate))) candidate = candidate.expression;
      if (ts.isLiteralTypeNode(candidate)) candidate = candidate.literal;
      if (!candidate || !ts.isNumericLiteral(candidate)) fail("selector:literal-resolution");
      return { parsed, declarations: [candidate], selected: candidate };
    }
    const search = declarations.flatMap((node) => [node, ...descendants(node)]);
    let matches = [];
    if (step.kind === "member") matches = search.filter((node) => nodeName(node) === step.name && "name" in node);
    else if (step.kind === "method" || step.kind === "private_method") matches = search.filter((node) => ts.isMethodDeclaration(node) && nodeName(node) === step.name);
    else if (step.kind === "local") matches = search.filter((node) => ts.isVariableDeclaration(node) && nodeName(node) === step.name);
    else if (step.kind === "object") matches = search.filter((node) => ts.isPropertyAssignment(node) && nodeName(node) === step.name);
    if (matches.length !== 1) fail(`selector:descent-count:${matches.length}:${step.name}:${search.map(nodeName).filter(Boolean).join(",")}`);
    selected = matches[0];
    symbol = selected.name ? symbolAt(image.checker, selected.name) : undefined;
    declarations = symbol?.declarations?.length ? [...symbol.declarations] : [selected];
  }
  return { parsed, declarations, selected };
}

function scalarText(node) {
  if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (node.getChildCount() === 0 && ts.isToken(node)) return node.getText();
  return null;
}

function syntaxTree(node) {
  return { kind: ts.SyntaxKind[node.kind], text: scalarText(node), children: node.getChildren(node.getSourceFile()).filter((child) => child.kind !== ts.SyntaxKind.EndOfFileToken).map(syntaxTree) };
}

function relationFor(node) {
  if (ts.isTypeReferenceNode(node)) return { kind: "type_reference", location: node.typeName };
  if (ts.isExpressionWithTypeArguments(node) && ts.isHeritageClause(node.parent)) return { kind: node.parent.token === ts.SyntaxKind.ExtendsKeyword ? "extends" : "implements", location: node.expression };
  if (ts.isCallExpression(node)) return { kind: "call", location: node.expression };
  if (ts.isNewExpression(node)) return { kind: "construct", location: node.expression };
  if (ts.isTaggedTemplateExpression(node)) return { kind: "tag", location: node.tag };
  if (ts.isPropertyAccessExpression(node)) return { kind: "property_reference", location: node.name };
  if (ts.isImportSpecifier(node) || ts.isNamespaceImport(node) || ts.isImportClause(node)) return { kind: "import", location: node.name ?? node };
  if (ts.isExportSpecifier(node)) return { kind: "re_export", location: node.name };
  if (ts.isIdentifier(node) && !ts.isDeclarationName(node) && !ts.isTypeReferenceNode(node.parent) &&
      !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)) return { kind: "value_reference", location: node };
  return undefined;
}

function sourceIdentity(image, fileName) {
  const location = image.classify(fileName);
  if (location.kind === "repository") return { origin: "repository", dependencyIdentity: null, prefix: location.relative };
  if (/[/\\]typescript[/\\]lib[/\\]lib\..*\.d\.ts$/u.test(fileName)) {
    const dependencyIdentity = deepSealCanonicalV2({ package: "typescript", version: ts.version, integrity: compilerIntegrity() });
    return { origin: "typescript_lib", dependencyIdentity, prefix: `typescript_lib\0${path.basename(fileName)}` };
  }
  const packageInfo = packageLocation(fileName);
  if (!packageInfo) fail("dependency:unowned-external");
  const manifest = parseJson(readFileSync(path.join(packageInfo.packageRoot, "package.json"), "utf8"), "dependency:manifest");
  if (manifest.name !== packageInfo.packageName || typeof manifest.version !== "string") fail("dependency:manifest-identity");
  const dependencyIdentity = parsePnpmIdentity(image.lockText, manifest.name, manifest.version);
  const origin = manifest.name === "@types/node" ? "node_builtin" : "external_package";
  return { origin, dependencyIdentity, prefix: `${origin}\0${manifest.name}@${manifest.version}+${dependencyIdentity.integrity}\0${packageInfo.subpath}` };
}

function buildGraph(image, roots) {
  const retained = new Set();
  const queue = [];
  const add = (node) => { if (node && !retained.has(node)) { retained.add(node); queue.push(node); } };
  for (const root of roots) for (const declaration of root.declarations) add(declaration);
  const pending = [];
  for (let index = 0; index < queue.length; index += 1) {
    const from = queue[index];
    if (image.classify(from.getSourceFile().fileName).kind !== "repository") continue;
    for (const current of [from, ...descendants(from)]) {
      const relation = relationFor(current);
      if (!relation) continue;
      const symbol = symbolAt(image.checker, relation.location);
      const targets = [...(symbol?.declarations ?? [])];
      if (targets.length === 0) continue;
      for (const target of targets) add(target);
      const signature = ["call", "construct", "tag"].includes(relation.kind) ? image.checker.getResolvedSignature(current) : undefined;
      for (const target of targets) pending.push({
        from,
        to: target,
        kind: relation.kind,
        exportPath: symbol ? [symbol.name] : [],
        resolvedSignature: signature?.declaration ? syntaxTree(signature.declaration) : null,
        overloads: signature ? image.checker.getSignaturesOfType(image.checker.getTypeAtLocation(relation.location), ts.SignatureKind.Call).map((item) => item.declaration).filter(Boolean).map(syntaxTree) : [],
      });
    }
  }
  const groups = new Map();
  for (const node of retained) {
    const identity = sourceIdentity(image, node.getSourceFile().fileName);
    if (!groups.has(identity.prefix)) groups.set(identity.prefix, []);
    groups.get(identity.prefix).push({ node, identity });
  }
  const ids = new Map();
  for (const [prefix, entries] of groups) {
    entries.sort((a, b) => a.node.pos - b.node.pos || a.node.end - b.node.end);
    entries.forEach(({ node }, index) => ids.set(node, `${prefix}\0${nodeName(node) ?? ts.SyntaxKind[node.kind]}\0${index}`));
  }
  const nodes = [...retained].map((node) => {
    const identity = sourceIdentity(image, node.getSourceFile().fileName);
    return { id: ids.get(node), origin: identity.origin, exportedName: nodeName(node), tree: syntaxTree(node), dependencyIdentity: identity.dependencyIdentity };
  }).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const projectedRoots = roots.map((root) => ({ kind: "selector", selector: root.parsed.canonical, nodes: root.declarations.map((node) => ids.get(node)).sort() })).sort((a, b) => a.selector < b.selector ? -1 : a.selector > b.selector ? 1 : 0);
  const edgeMap = new Map();
  for (const edge of pending) {
    const projected = { ...edge, from: ids.get(edge.from), to: ids.get(edge.to) };
    if (!projected.from || !projected.to) fail("graph:unretained-edge");
    edgeMap.set(JSON.stringify(projected), projected);
  }
  const edges = [...edgeMap.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, edge]) => edge);
  return { program: image.identity, roots: projectedRoots, nodes, edges };
}

const EDGE_KINDS = new Set(["type_reference", "value_reference", "property_reference", "call", "construct", "tag", "extends", "implements", "import", "re_export"]);

function assertScalar(value, label) {
  if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isSafeInteger(value) && !Object.is(value, -0))) fail(label);
}

function assertTree(tree) {
  exactKeys(tree, ["kind", "text", "children"], "tree");
  if (typeof tree.kind !== "string" || tree.kind.length === 0 || !Array.isArray(tree.children)) fail("tree:shape");
  assertScalar(tree.text, "tree:text");
  for (const child of tree.children) assertTree(child);
}

function assertDependency(identity) {
  exactKeys(identity, ["package", "version", "integrity"], "dependency");
  if ([identity.package, identity.version, identity.integrity].some((value) => typeof value !== "string" || value.length === 0)) fail("dependency:value");
}

export function assertTypeScriptGraphV3(graph, selectors, expectedProgram) {
  exactKeys(graph, ["program", "roots", "nodes", "edges"], "graph");
  if (JSON.stringify(graph.program) !== JSON.stringify(expectedProgram)) fail("graph:program-identity");
  deepSealCanonicalV2(graph.program);
  if (!Array.isArray(graph.roots) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) fail("graph:arrays");
  const ids = graph.nodes.map((node) => node.id);
  if (ids.some((id) => typeof id !== "string" || id.length === 0) || new Set(ids).size !== ids.length || ids.join("\0") !== [...ids].sort().join("\0")) fail(`graph:node-order:${JSON.stringify(ids)}`);
  const idSet = new Set(ids);
  const reachable = new Set();
  for (const root of graph.roots) {
    exactKeys(root, ["kind", "selector", "nodes"], "root");
    if (root.kind !== "selector" || typeof root.selector !== "string" || !Array.isArray(root.nodes) || root.nodes.length === 0 ||
        root.nodes.join("\0") !== [...new Set(root.nodes)].sort().join("\0")) fail("graph:root");
    for (const id of root.nodes) { if (!idSet.has(id)) fail("graph:root-node"); reachable.add(id); }
  }
  if (graph.roots.map((root) => root.selector).sort().join("\0") !== [...selectors].sort().join("\0")) fail("graph:selectors");
  for (const node of graph.nodes) {
    exactKeys(node, ["id", "origin", "exportedName", "tree", "dependencyIdentity"], "node");
    if (!["repository", "node_builtin", "typescript_lib", "external_package"].includes(node.origin) || !(node.exportedName === null || typeof node.exportedName === "string")) fail("graph:node");
    if (node.origin === "repository") { if (node.dependencyIdentity !== null) fail("graph:dependency"); }
    else assertDependency(node.dependencyIdentity);
    assertTree(node.tree);
  }
  const serializedEdges = graph.edges.map((edge) => JSON.stringify(edge));
  if (new Set(serializedEdges).size !== serializedEdges.length || serializedEdges.join("\0") !== [...serializedEdges].sort().join("\0")) fail("graph:edge-order");
  for (const edge of graph.edges) {
    exactKeys(edge, ["from", "to", "kind", "exportPath", "resolvedSignature", "overloads"], "edge");
    if (!idSet.has(edge.from) || !idSet.has(edge.to) || !EDGE_KINDS.has(edge.kind) || !Array.isArray(edge.exportPath) || edge.exportPath.some((part) => typeof part !== "string") || !Array.isArray(edge.overloads)) fail("graph:edge");
    if (edge.resolvedSignature !== null) assertTree(edge.resolvedSignature);
    for (const overload of edge.overloads) assertTree(overload);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of graph.edges) if (reachable.has(edge.from) && !reachable.has(edge.to)) { reachable.add(edge.to); changed = true; }
  }
  if (graph.nodes.some((node) => !reachable.has(node.id))) fail("graph:orphan");
  deepSealCanonicalV2(graph);
  return true;
}

export function createClosedRepositoryProjector(repositoryPath) {
  const repositoryRoot = realpathSync(repositoryPath);
  return function project(descriptor, revision) {
    exactKeys(descriptor, ["id", "lifecycle", "claimMode", "introduction", "introducedBy", "projection"], "descriptor");
    exactKeys(descriptor.projection, ["adapter", "versionSelector", "programConfig", "roots", "repositoryEdges", "externalEdges"], "projection");
    const parsed = [...descriptor.projection.roots, descriptor.projection.versionSelector].map(parseStructuralSelector);
    const rootNames = [...new Set(parsed.map((selector) => selector.path))].sort();
    const snapshot = repositorySnapshot(repositoryRoot, revision);
    for (const name of rootNames) if (!snapshot.paths.has(name)) fail("program:root-not-at-revision");
    const image = createPinnedProgram(repositoryRoot, snapshot, rootNames);
    const roots = parsed.map((selector) => resolveRoot(image, selector));
    const versionNode = roots.at(-1).selected;
    const version = ts.isNumericLiteral(versionNode) ? Number(versionNode.text) : Number.NaN;
    if (!Number.isSafeInteger(version) || version <= 0) fail("projection:version");
    const graph = buildGraph(image, roots);
    const selectors = parsed.map((selector) => selector.canonical);
    assertTypeScriptGraphV3(graph, selectors, image.identity);
    const semantic = deepSealCanonicalV2(graph);
    return Object.freeze({ identity: deepSealCanonicalV2({ version }), semantic, digest: sharedResourceDigest({ adapter: "typescript_contract@1", version, graph: semantic }), resolvedSelectors: Object.freeze(selectors) });
  };
}
