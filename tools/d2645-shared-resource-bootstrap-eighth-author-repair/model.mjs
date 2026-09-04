import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import ts from "typescript";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import { parseStructuralSelector } from "../d2593-shared-resource-bootstrap-seventh-author-repair/model.mjs";

function fail(message) {
  throw new TypeError(message);
}

function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label}:object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.join("\0") !== expected.join("\0")) fail(`${label}:keys`);
}

function hasUnpairedSurrogate(value) {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) return true;
  }
  return false;
}

export function deepSealCanonicalV2(value) {
  const active = new WeakSet();
  function clone(input) {
    if (input === null || typeof input === "boolean") return input;
    if (typeof input === "string") {
      if (hasUnpairedSurrogate(input)) fail("canonical:string-surrogate");
      return input;
    }
    if (typeof input === "number") {
      if (!Number.isSafeInteger(input) || Object.is(input, -0)) fail("canonical:number");
      return input;
    }
    if (typeof input !== "object") fail("canonical:type");
    if (active.has(input)) fail("canonical:cycle");
    const proto = Object.getPrototypeOf(input);
    if (!Array.isArray(input) && proto !== Object.prototype && proto !== null) fail("canonical:prototype");
    active.add(input);
    let output;
    if (Array.isArray(input)) {
      const own = Reflect.ownKeys(input);
      if (Array.from({ length: input.length }, (_, index) => index).some((index) => !Object.hasOwn(input, index)) ||
          own.some((key) => typeof key === "symbol" || (key !== "length" && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        fail("canonical:array-shape");
      }
      output = input.map(clone);
    } else {
      output = {};
      const own = Reflect.ownKeys(input);
      if (own.some((key) => typeof key === "symbol" || hasUnpairedSurrogate(key))) fail("canonical:object-key");
      for (const key of own.sort()) {
        const descriptor = Object.getOwnPropertyDescriptor(input, key);
        if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, "value")) fail("canonical:accessor");
        output[key] = clone(descriptor.value);
      }
    }
    active.delete(input);
    return Object.freeze(output);
  }
  return clone(value);
}

function git(repositoryRoot, args, encoding = "utf8") {
  try {
    return execFileSync("git", ["-C", repositoryRoot, ...args], {
      encoding,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    fail(`repository:${args[0]}`);
  }
}

function repositorySnapshot(repositoryRoot, revision) {
  if (typeof revision !== "string" || revision.length === 0 || /[\u0000-\u001f\u007f]/u.test(revision)) {
    fail("repository:revision");
  }
  const commit = git(repositoryRoot, ["rev-parse", "--verify", `${revision}^{commit}`]).trim();
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail("repository:commit");
  const entries = git(repositoryRoot, ["ls-tree", "-r", "--name-only", "-z", commit])
    .split("\0")
    .filter(Boolean);
  const paths = new Set(entries);
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

function canonicalCompilerOptions(options) {
  const result = {};
  for (const [key, value] of Object.entries(options).sort(([a], [b]) => a.localeCompare(b))) {
    if (value !== undefined) result[key] = value;
  }
  return deepSealCanonicalV2(result);
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
        const key = property.name.text;
        if (keys.has(key)) fail("program:config-duplicate-key");
        keys.add(key);
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

function createPinnedProgram(repositoryRoot, snapshot, rootNames) {
  const configText = snapshot.read("tsconfig.base.json");
  if (configText === undefined) fail("program:config-missing");
  const config = parseJsonWithoutDuplicateKeys(configText, "tsconfig.base.json");
  exactKeys(config, ["compilerOptions"], "program:config");
  const converted = ts.convertCompilerOptionsFromJson(config.compilerOptions, repositoryRoot, "tsconfig.base.json");
  if (converted.errors.length > 0) fail("program:compiler-options");
  const options = {
    ...converted.options,
    types: [],
    noEmit: true,
    incremental: false,
    composite: false,
    preserveSymlinks: false,
  };
  const canonicalOptions = canonicalCompilerOptions(options);
  const baseHost = ts.createCompilerHost(options, true);
  const absoluteRoot = `${repositoryRoot}${path.sep}`;
  const repoRelative = (fileName) => {
    const absolute = path.resolve(fileName);
    if (!absolute.startsWith(absoluteRoot)) return undefined;
    return path.relative(repositoryRoot, absolute).split(path.sep).join("/");
  };
  const readPinned = (fileName) => {
    const relative = repoRelative(fileName);
    return relative === undefined ? undefined : snapshot.read(relative);
  };
  const host = {
    ...baseHost,
    getCurrentDirectory: () => repositoryRoot,
    fileExists: (fileName) => readPinned(fileName) !== undefined || baseHost.fileExists(fileName),
    readFile: (fileName) => readPinned(fileName) ?? baseHost.readFile(fileName),
    realpath: (fileName) => repoRelative(fileName) === undefined ? baseHost.realpath?.(fileName) ?? fileName : path.resolve(fileName),
    getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
      const text = readPinned(fileName);
      if (text !== undefined) return ts.createSourceFile(path.resolve(fileName), text, languageVersion, true, ts.ScriptKind.TS);
      return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    },
  };
  const absoluteNames = rootNames.map((name) => path.join(repositoryRoot, name));
  const program = ts.createProgram(absoluteNames, options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => {
    if (!diagnostic.file) return false;
    return repoRelative(diagnostic.file.fileName) !== undefined;
  });
  if (diagnostics.length > 0) fail(`program:diagnostic:${diagnostics[0].code}`);
  return Object.freeze({
    program,
    checker: program.getTypeChecker(),
    repoRelative,
    identity: deepSealCanonicalV2({
      compilerPackage: "typescript",
      compilerVersion: ts.version,
      compilerIntegrity: compilerIntegrity(),
      repositoryCommit: snapshot.commit,
      configPath: "tsconfig.base.json",
      configDigest: sharedResourceDigest(config),
      rootNames: [...rootNames],
      compilerOptions: canonicalOptions,
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

function allChildren(node) {
  const result = [];
  node.forEachChild((child) => {
    result.push(child);
    result.push(...allChildren(child));
  });
  return result;
}

function declarationChoice(declarations) {
  const implementations = declarations.filter((node) =>
    (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node)) && node.body,
  );
  if (implementations.length === 1) return implementations[0];
  return [...declarations].sort((a, b) => {
    const byFile = a.getSourceFile().fileName.localeCompare(b.getSourceFile().fileName);
    return byFile || a.pos - b.pos;
  })[0];
}

function resolveRoot(programImage, parsed) {
  const sourceName = path.join(programImage.program.getCurrentDirectory(), parsed.path);
  const source = programImage.program.getSourceFile(sourceName);
  if (!source) fail("selector:source");
  const checker = programImage.checker;
  let declarations = [];
  let rootSymbol;
  let aliasDeclarations = [];
  if (parsed.root.kind === "export") {
    const moduleSymbol = checker.getSymbolAtLocation(source);
    const exported = checker.getExportsOfModule(moduleSymbol).filter((symbol) => symbol.name === parsed.root.name);
    if (exported.length !== 1) fail(`selector:root-count:${exported.length}`);
    aliasDeclarations = [...(exported[0].declarations ?? [])];
    rootSymbol = unalias(checker, exported[0]);
    declarations = [...aliasDeclarations, ...(rootSymbol?.declarations ?? [])];
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
      for (const name of names) {
        const symbol = name ? symbolAt(checker, name) : undefined;
        if (symbol) symbols.add(symbol);
      }
    }
    if (symbols.size !== 1) fail(`selector:root-symbol-count:${symbols.size}`);
    [rootSymbol] = symbols;
    declarations = [...(rootSymbol.declarations ?? [])];
  }
  declarations = [...new Set(declarations)];
  if (declarations.length === 0) fail("selector:root-declarations");
  let selected = declarationChoice(rootSymbol?.declarations?.length ? [...rootSymbol.declarations] : declarations);
  for (const step of parsed.descent) {
    if (step.kind === "literal") {
      let candidate = selected.initializer ?? selected.type ?? selected;
      while (candidate && (ts.isParenthesizedExpression(candidate) || ts.isAsExpression(candidate) || ts.isSatisfiesExpression(candidate))) candidate = candidate.expression;
      if (ts.isLiteralTypeNode(candidate)) candidate = candidate.literal;
      if (!candidate || !(ts.isStringLiteral(candidate) || ts.isNumericLiteral(candidate) ||
          candidate.kind === ts.SyntaxKind.TrueKeyword || candidate.kind === ts.SyntaxKind.FalseKeyword || candidate.kind === ts.SyntaxKind.NullKeyword)) {
        fail("selector:literal-resolution");
      }
      selected = candidate;
      declarations = [candidate];
      rootSymbol = undefined;
      continue;
    }
    const search = declarations.flatMap((node) => [node, ...allChildren(node)]);
    let matches = [];
    if (step.kind === "member") matches = search.filter((node) => nodeName(node) === step.name && "name" in node);
    else if (step.kind === "method" || step.kind === "private_method") {
      matches = search.filter((node) => ts.isMethodDeclaration(node) && nodeName(node) === step.name);
      if (step.kind === "private_method") matches = matches.filter((node) => ts.isPrivateIdentifier(node.name) || node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword));
    } else if (step.kind === "local") matches = search.filter((node) => ts.isVariableDeclaration(node) && nodeName(node) === step.name);
    else if (step.kind === "object") matches = search.filter((node) => ts.isPropertyAssignment(node) && nodeName(node) === step.name);
    if (matches.length !== 1) fail(`selector:descent-count:${matches.length}`);
    selected = matches[0];
    const symbol = selected.name ? symbolAt(checker, selected.name) : undefined;
    declarations = symbol?.declarations?.length ? [...symbol.declarations] : [selected];
    rootSymbol = symbol;
  }
  return Object.freeze({ parsed, source, symbol: rootSymbol, declarations, selected, aliasDeclarations });
}

function scalarText(node) {
  if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) {
    const value = Number(node.text);
    if (!Number.isSafeInteger(value)) fail("tree:number");
    return value;
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (node.getChildCount() === 0 && ts.isToken(node)) return node.getText();
  return null;
}

function syntaxTree(node) {
  const source = node.getSourceFile();
  return {
    kind: ts.SyntaxKind[node.kind],
    text: scalarText(node),
    children: node.getChildren(source).filter((child) => child.kind !== ts.SyntaxKind.EndOfFileToken).map(syntaxTree),
  };
}

function packageIdentityFor(fileName) {
  if (/[/\\]typescript[/\\]lib[/\\]lib\..*\.d\.ts$/u.test(fileName)) {
    return { origin: "typescript_lib", dependencyIdentity: { package: "typescript", version: ts.version, integrity: compilerIntegrity() } };
  }
  if (/[/\\]@types[/\\]node[/\\]/u.test(fileName)) {
    return { origin: "node_builtin", dependencyIdentity: { package: "@types/node", version: "resolved", integrity: null } };
  }
  return { origin: "external_package", dependencyIdentity: { package: "external", version: "resolved", integrity: null } };
}

function relationFor(node) {
  if (ts.isTypeReferenceNode(node)) return { kind: "type_reference", location: node.typeName };
  if (ts.isExpressionWithTypeArguments(node) && ts.isHeritageClause(node.parent)) {
    return { kind: node.parent.token === ts.SyntaxKind.ExtendsKeyword ? "extends" : "implements", location: node.expression };
  }
  if (ts.isCallExpression(node)) return { kind: "call", location: node.expression };
  if (ts.isNewExpression(node)) return { kind: "construct", location: node.expression };
  if (ts.isTaggedTemplateExpression(node)) return { kind: "tag", location: node.tag };
  if (ts.isPropertyAccessExpression(node)) return { kind: "property_reference", location: node.name };
  if (ts.isImportSpecifier(node) || ts.isNamespaceImport(node) || ts.isImportClause(node)) return { kind: "import", location: node.name ?? node };
  if (ts.isExportSpecifier(node)) return { kind: "re_export", location: node.name };
  if (ts.isIdentifier(node) && !ts.isDeclarationName(node) && !ts.isPropertyAccessExpression(node.parent) && !ts.isTypeReferenceNode(node.parent)) {
    return { kind: "value_reference", location: node };
  }
  return undefined;
}

function buildGraph(programImage, resolvedRoots) {
  const retained = new Set();
  const queued = [];
  const add = (node) => {
    if (!node || retained.has(node)) return;
    retained.add(node);
    queued.push(node);
  };
  for (const root of resolvedRoots) for (const declaration of root.declarations) add(declaration);
  const pendingEdges = [];
  for (let index = 0; index < queued.length; index += 1) {
    const from = queued[index];
    const source = from.getSourceFile();
    const fromRepo = programImage.repoRelative(source.fileName) !== undefined;
    if (!fromRepo) continue;
    for (const current of [from, ...allChildren(from)]) {
      const relation = relationFor(current);
      if (!relation) continue;
      const targetSymbol = symbolAt(programImage.checker, relation.location);
      const targetDeclarations = [...(targetSymbol?.declarations ?? [])];
      if (targetDeclarations.length === 0) continue;
      for (const declaration of targetDeclarations) add(declaration);
      const selected = relation.kind === "call" || relation.kind === "construct" || relation.kind === "tag"
        ? programImage.checker.getResolvedSignature(current)?.declaration ?? declarationChoice(targetDeclarations)
        : declarationChoice(targetDeclarations);
      const signature = ["call", "construct", "tag"].includes(relation.kind)
        ? programImage.checker.getResolvedSignature(current)
        : undefined;
      pendingEdges.push({
        from,
        to: selected,
        kind: relation.kind,
        exportPath: targetSymbol ? [targetSymbol.name] : [],
        resolvedSignature: signature?.declaration ? syntaxTree(signature.declaration) : null,
        overloads: signature
          ? programImage.checker.getSignaturesOfType(programImage.checker.getTypeAtLocation(relation.location), ts.SignatureKind.Call)
            .map((item) => item.declaration).filter(Boolean).map(syntaxTree)
          : [],
      });
    }
  }

  const byFile = new Map();
  for (const node of retained) {
    const fileName = node.getSourceFile().fileName;
    if (!byFile.has(fileName)) byFile.set(fileName, []);
    byFile.get(fileName).push(node);
  }
  const ids = new Map();
  for (const [fileName, nodes] of byFile) {
    const relative = programImage.repoRelative(fileName);
    const ordered = nodes.sort((a, b) => a.pos - b.pos || a.end - b.end);
    for (let index = 0; index < ordered.length; index += 1) {
      const identity = relative === undefined
        ? packageIdentityFor(fileName)
        : { origin: "repository", dependencyIdentity: null };
      const prefix = relative ?? `${identity.origin}\0${fileName.split(path.sep).join("/")}`;
      ids.set(ordered[index], `${prefix}\0${index}`);
    }
  }
  const nodes = [...retained].map((node) => {
    const fileName = node.getSourceFile().fileName;
    const relative = programImage.repoRelative(fileName);
    const identity = relative === undefined ? packageIdentityFor(fileName) : { origin: "repository", dependencyIdentity: null };
    return {
      id: ids.get(node),
      origin: identity.origin,
      exportedName: nodeName(node),
      tree: syntaxTree(node),
      dependencyIdentity: identity.dependencyIdentity,
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const roots = resolvedRoots.map((root) => ({
    kind: "selector",
    selector: root.parsed.canonical,
    nodes: root.declarations.map((node) => ids.get(node)).sort(),
  })).sort((a, b) => a.selector.localeCompare(b.selector));
  const edgeMap = new Map();
  for (const edge of pendingEdges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) fail("graph:unretained-edge");
    const projected = { ...edge, from: ids.get(edge.from), to: ids.get(edge.to) };
    const key = JSON.stringify(projected);
    edgeMap.set(key, projected);
  }
  const edges = [...edgeMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, edge]) => edge);
  return { program: programImage.identity, roots, nodes, edges };
}

const EDGE_KINDS = new Set(["type_reference", "value_reference", "property_reference", "call", "construct", "tag", "extends", "implements", "import", "re_export"]);

export function assertTypeScriptGraphV2(graph, selectors, expectedProgram) {
  exactKeys(graph, ["program", "roots", "nodes", "edges"], "graph");
  if (JSON.stringify(graph.program) !== JSON.stringify(expectedProgram)) fail("graph:program-identity");
  if (!Array.isArray(graph.roots) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) fail("graph:arrays");
  const selectorSet = graph.roots.map((root) => root.selector).sort();
  if (selectorSet.join("\0") !== [...selectors].sort().join("\0")) fail("graph:selectors");
  const ids = graph.nodes.map((node) => node.id);
  if (new Set(ids).size !== ids.length || ids.join("\0") !== [...ids].sort().join("\0")) fail("graph:node-order");
  const idSet = new Set(ids);
  const reachable = new Set();
  for (const root of graph.roots) {
    exactKeys(root, ["kind", "selector", "nodes"], "root");
    if (root.kind !== "selector" || !Array.isArray(root.nodes) || root.nodes.length === 0 || new Set(root.nodes).size !== root.nodes.length) fail("graph:root");
    for (const id of root.nodes) {
      if (!idSet.has(id)) fail("graph:root-node");
      reachable.add(id);
    }
  }
  for (const node of graph.nodes) {
    exactKeys(node, ["id", "origin", "exportedName", "tree", "dependencyIdentity"], "node");
    if (!idSet.has(node.id) || !["repository", "node_builtin", "typescript_lib", "external_package"].includes(node.origin)) fail("graph:node");
    if ((node.origin === "repository") !== (node.dependencyIdentity === null)) fail("graph:dependency");
  }
  for (const edge of graph.edges) {
    exactKeys(edge, ["from", "to", "kind", "exportPath", "resolvedSignature", "overloads"], "edge");
    if (!idSet.has(edge.from) || !idSet.has(edge.to) || !EDGE_KINDS.has(edge.kind)) fail("graph:edge");
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of graph.edges) if (reachable.has(edge.from) && !reachable.has(edge.to)) {
      reachable.add(edge.to);
      changed = true;
    }
  }
  if (graph.nodes.some((node) => !reachable.has(node.id))) fail("graph:orphan");
  deepSealCanonicalV2(graph);
  return true;
}

export function assertCompiledGraphExact(candidate, compiled) {
  if (sharedResourceDigest(candidate) !== sharedResourceDigest(compiled)) fail("graph:compiled-mismatch");
  return true;
}

export function createRepositoryProjector(repositoryPath) {
  const repositoryRoot = realpathSync(repositoryPath);
  return function projectRepositoryTypeScriptContract(descriptor, repositoryRevision) {
    exactKeys(descriptor, ["id", "lifecycle", "claimMode", "introduction", "introducedBy", "projection"], "descriptor");
    exactKeys(descriptor.projection, ["adapter", "versionSelector", "programConfig", "roots", "repositoryEdges", "externalEdges"], "projection");
    if (descriptor.projection.adapter !== "typescript_contract@1" || descriptor.projection.programConfig !== "tsconfig.base.json" ||
        descriptor.projection.repositoryEdges !== "transitive" || descriptor.projection.externalEdges !== "resolved_signature") fail("projection:contract");
    const parsed = [...descriptor.projection.roots, descriptor.projection.versionSelector].map(parseStructuralSelector);
    const rootNames = [...new Set(parsed.map((selector) => selector.path))].sort();
    const snapshot = repositorySnapshot(repositoryRoot, repositoryRevision);
    for (const rootName of rootNames) if (!snapshot.paths.has(rootName)) fail("program:root-not-at-revision");
    const programImage = createPinnedProgram(repositoryRoot, snapshot, rootNames);
    const resolved = parsed.map((selector) => resolveRoot(programImage, selector));
    const versionRoot = resolved.at(-1);
    const versionNode = versionRoot.selected;
    const version = ts.isNumericLiteral(versionNode) ? Number(versionNode.text) : Number.NaN;
    if (!Number.isSafeInteger(version) || version <= 0) fail("projection:version");
    const graph = buildGraph(programImage, resolved);
    const selectors = parsed.map((selector) => selector.canonical);
    assertTypeScriptGraphV2(graph, selectors, programImage.identity);
    const semantic = deepSealCanonicalV2(graph);
    return Object.freeze({
      identity: deepSealCanonicalV2({ version }),
      semantic,
      digest: sharedResourceDigest({ adapter: "typescript_contract@1", version, graph: semantic }),
      resolvedSelectors: Object.freeze(selectors),
    });
  };
}
