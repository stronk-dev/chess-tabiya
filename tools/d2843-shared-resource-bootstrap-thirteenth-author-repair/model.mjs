import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import ts from "typescript";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import { selectorsFor, validateCatalogue } from "../d2488-shared-resource-bootstrap-third-author-repair/model.mjs";
import { deepSealCanonicalV2 } from "../d2645-shared-resource-bootstrap-eighth-author-repair/model.mjs";

const require = createRequire(import.meta.url);
const issuedDescriptors = new WeakSet();
const issuedGraphs = new WeakSet();

function canonicalCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function fail(message) {
  throw new TypeError(message);
}

const ROOT_KINDS = new Set(["export", "interface", "type", "function", "class"]);
const DESCENT_KINDS = new Set(["private-method", "method", "local", "member", "object"]);
const IDENTIFIER = /^[$\p{ID_Start}_][$\p{ID_Continue}_]*$/u;

export function parseStructuralSelector(value) {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/u.test(value)) fail("selector:string");
  const hash = value.indexOf("#");
  if (hash < 1 || value.indexOf("#", hash + 1) !== -1) fail("selector:hash");
  const selectorPath = value.slice(0, hash);
  if (/^(?:[A-Za-z][A-Za-z+.-]*:|\/)/u.test(selectorPath) || selectorPath.includes("\\") ||
      /[%?*\[\]{}]/u.test(selectorPath) || selectorPath.split("/").some((part) => part === "" || part === "." || part === "..")) {
    fail("selector:path");
  }
  const segments = value.slice(hash + 1).split("/");
  if (segments.some((segment) => segment.length === 0)) fail("selector:segment");
  if (segments[0] === "$id") {
    if (segments.length !== 1) fail("selector:json-descent");
    return Object.freeze({ canonical: value, path: selectorPath, root: Object.freeze({ kind: "json_id" }), descent: Object.freeze([]) });
  }
  const rootMatch = /^(export|interface|type|function|class):(.+)$/u.exec(segments[0]);
  if (!rootMatch || !ROOT_KINDS.has(rootMatch[1]) || !IDENTIFIER.test(rootMatch[2])) fail("selector:root");
  const descent = [];
  let terminal = false;
  let parentKind = rootMatch[1];
  const allowed = {
    export: new Set(),
    interface: new Set(["member"]),
    type: new Set(["member"]),
    function: new Set(["local", "object"]),
    class: new Set(["private-method", "method", "member"]),
    "private-method": new Set(["local", "object"]),
    method: new Set(["local", "object"]),
    local: new Set(["object", "literal"]),
    member: new Set(["member", "object", "literal"]),
    object: new Set(["object", "literal"]),
  };
  for (const segment of segments.slice(1)) {
    if (terminal) fail("selector:after-literal");
    if (segment === "literal") {
      if (!allowed[parentKind]?.has("literal")) fail("selector:parent-child");
      descent.push(Object.freeze({ kind: "literal" }));
      terminal = true;
      continue;
    }
    const match = /^(private-method|method|local|member|object):(.+)$/u.exec(segment);
    if (!match || !DESCENT_KINDS.has(match[1]) || !IDENTIFIER.test(match[2])) fail("selector:descent");
    if (!allowed[parentKind]?.has(match[1])) fail("selector:parent-child");
    descent.push(Object.freeze({ kind: match[1].replace("-", "_"), name: match[2] }));
    parentKind = match[1];
  }
  return Object.freeze({
    canonical: value,
    path: selectorPath,
    root: Object.freeze({ kind: rootMatch[1], name: rootMatch[2] }),
    descent: Object.freeze(descent),
  });
}

function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label}:object`);
  const actual = Object.keys(value).sort(canonicalCompare).join("\0");
  const expected = [...keys].sort(canonicalCompare).join("\0");
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
  const source = ts.parseJsonText("tsconfig.base.json", text);
  if (source.parseDiagnostics.length > 0) fail("program:config-json");
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const keys = new Set();
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) fail("program:config-shape");
        if (keys.has(property.name.text)) fail("program:config-duplicate-key");
        keys.add(property.name.text);
      }
    }
    node.forEachChild(visit);
  };
  visit(source);
  const config = parseJson(text, "program:config");
  exactKeys(config, ["compilerOptions"], "program:config");
  const converted = ts.convertCompilerOptionsFromJson(config.compilerOptions, repositoryRoot, "tsconfig.base.json");
  if (converted.errors.length > 0) fail("program:compiler-options");
  const options = { ...converted.options, types: [], noEmit: true, incremental: false, composite: false, preserveSymlinks: false };
  const canonical = {};
  for (const [key, value] of Object.entries(options).sort(([a], [b]) => canonicalCompare(a, b))) {
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
    artifactDigests: new Map(),
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

function syntaxNodes(node) {
  const result = [];
  const visit = (current, sitePath) => {
    result.push({ node: current, sitePath });
    current.getChildren(current.getSourceFile())
      .filter((child) => child.kind !== ts.SyntaxKind.EndOfFileToken)
      .forEach((child, index) => visit(child, [...sitePath, index]));
  };
  visit(node, []);
  return result;
}

function declarationChoice(declarations) {
  const implementation = declarations.filter((node) =>
    (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node)) && node.body,
  );
  if (implementation.length === 1) return implementation[0];
  return [...declarations].sort((a, b) => canonicalCompare(a.getSourceFile().fileName, b.getSourceFile().fileName) || a.pos - b.pos)[0];
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
  if (ts.isElementAccessExpression(node) && (ts.isStringLiteral(node.argumentExpression) || ts.isNumericLiteral(node.argumentExpression))) {
    return { kind: "property_reference", location: node.argumentExpression };
  }
  if (ts.isImportSpecifier(node) || ts.isNamespaceImport(node) || ts.isImportClause(node)) return { kind: "import", location: node.name ?? node };
  if (ts.isExportSpecifier(node)) return { kind: "re_export", location: node.name };
  if (ts.isIdentifier(node) && !ts.isDeclarationName(node) && !ts.isTypeReferenceNode(node.parent) &&
      !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)) return { kind: "value_reference", location: node };
  return undefined;
}

function declarationFiles(root) {
  const files = [];
  const visit = (directory, prefix = "") => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => canonicalCompare(left.name, right.name))) {
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

export function canonicalDeclarationArtifact(root) {
  return deepSealCanonicalV2(declarationFiles(realpathSync(root)));
}

function artifactDigest(image, root) {
  const resolved = realpathSync(root);
  if (!image.artifactDigests.has(resolved)) {
    image.artifactDigests.set(resolved, sharedResourceDigest({ declarationArtifact: canonicalDeclarationArtifact(resolved) }));
  }
  return image.artifactDigests.get(resolved);
}

function sourceIdentity(image, fileName) {
  const location = image.classify(fileName);
  if (location.kind === "repository") return { origin: "repository", dependencyIdentity: null, prefix: location.relative };
  if (/[/\\]typescript[/\\]lib[/\\]lib\..*\.d\.ts$/u.test(fileName)) {
    const root = path.dirname(require.resolve("typescript/package.json"));
    const dependencyIdentity = deepSealCanonicalV2({ package: "typescript", version: ts.version, integrity: compilerIntegrity(), sourceDigest: artifactDigest(image, root) });
    return { origin: "typescript_lib", dependencyIdentity, prefix: `typescript_lib\0${path.basename(fileName)}` };
  }
  const packageInfo = packageLocation(fileName);
  if (!packageInfo) fail("dependency:unowned-external");
  const manifest = parseJson(readFileSync(path.join(packageInfo.packageRoot, "package.json"), "utf8"), "dependency:manifest");
  if (manifest.name !== packageInfo.packageName || typeof manifest.version !== "string") fail("dependency:manifest-identity");
  const dependencyIdentity = deepSealCanonicalV2({
    ...parsePnpmIdentity(image.lockText, manifest.name, manifest.version),
    sourceDigest: artifactDigest(image, packageInfo.packageRoot),
  });
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
    for (const { node: current, sitePath } of syntaxNodes(from)) {
      if (current.kind === ts.SyntaxKind.ImportKeyword) fail("resolution:dynamic-import");
      if (ts.isComputedPropertyName(current) && !(ts.isStringLiteral(current.expression) || ts.isNumericLiteral(current.expression))) fail("resolution:computed-property");
      if (ts.isElementAccessExpression(current)) {
        if (!(ts.isStringLiteral(current.argumentExpression) || ts.isNumericLiteral(current.argumentExpression))) fail("resolution:broad-index");
        const receiverType = image.checker.getTypeAtLocation(current.expression);
        if ((receiverType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0) fail("resolution:any-member");
      }
      const relation = relationFor(current);
      if (!relation) continue;
      const symbol = symbolAt(image.checker, relation.location);
      const targets = [...(symbol?.declarations ?? [])];
      if (symbol?.name === "eval" && targets.some((target) => /[/\\]typescript[/\\]lib[/\\]lib\..*\.d\.ts$/u.test(target.getSourceFile().fileName))) {
        fail("resolution:eval");
      }
      if (relation.kind === "property_reference") {
        const receiverType = image.checker.getTypeAtLocation(current.expression);
        if ((receiverType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0 || targets.length === 0) fail("resolution:any-member");
      }
      const callLike = ["call", "construct", "tag"].includes(relation.kind);
      const signature = callLike ? image.checker.getResolvedSignature(current) : undefined;
      if (callLike && (!signature?.declaration || targets.length === 0)) fail("resolution:unresolved-signature");
      if (callLike) {
        const callableType = image.checker.getTypeAtLocation(relation.location);
        if ((callableType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0) fail("resolution:any-call");
        const signatureName = nodeName(signature.declaration);
        const signatureFile = signature.declaration.getSourceFile().fileName;
        if (signatureName === "eval" && /[/\\]typescript[/\\]lib[/\\]lib\..*\.d\.ts$/u.test(signatureFile)) fail("resolution:eval");
      }
      if (targets.length === 0) continue;
      for (const target of targets) add(target);
      const signatureKind = relation.kind === "construct" ? ts.SignatureKind.Construct : ts.SignatureKind.Call;
      const overloads = signature
        ? image.checker.getSignaturesOfType(image.checker.getTypeAtLocation(relation.location), signatureKind)
          .map((item) => item.declaration).filter(Boolean).map(syntaxTree)
        : [];
      if (callLike && overloads.length === 0) fail("resolution:overloads");
      for (const target of targets) pending.push({
        from,
        to: target,
        sitePath,
        kind: relation.kind,
        exportPath: symbol ? [symbol.name] : [],
        resolvedSignature: signature?.declaration ? syntaxTree(signature.declaration) : null,
        overloads,
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
  }).sort((a, b) => canonicalCompare(a.id, b.id));
  const projectedRoots = roots.map((root) => ({ kind: "selector", selector: root.parsed.canonical, nodes: root.declarations.map((node) => ids.get(node)).sort(canonicalCompare) })).sort((a, b) => canonicalCompare(a.selector, b.selector));
  const edgeMap = new Map();
  for (const edge of pending) {
    const projected = { ...edge, from: ids.get(edge.from), to: ids.get(edge.to) };
    if (!projected.from || !projected.to) fail("graph:unretained-edge");
    edgeMap.set(JSON.stringify(projected), projected);
  }
  const edges = [...edgeMap.entries()].sort(([a], [b]) => canonicalCompare(a, b)).map(([, edge]) => edge);
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

function assertDependency(node, program) {
  const identity = node.dependencyIdentity;
  if (node.origin === "repository") {
    if (identity !== null) fail("graph:repository-origin");
    return;
  }
  exactKeys(identity, ["package", "version", "integrity", "sourceDigest"], "dependency");
  if ([identity.package, identity.version, identity.integrity].some((value) => typeof value !== "string" || value.length === 0) ||
      !/^sha256:[0-9a-f]{64}$/u.test(identity.sourceDigest)) fail("dependency:value");
  if (node.origin === "typescript_lib" &&
      (identity.package !== "typescript" || identity.version !== program.compilerVersion || identity.integrity !== program.compilerIntegrity ||
       !node.id.startsWith("typescript_lib\0lib."))) fail("dependency:typescript-origin");
  if (node.origin === "node_builtin" &&
      (identity.package !== "@types/node" || !node.id.startsWith("node_builtin\0@types/node@"))) fail("dependency:node-origin");
  if (node.origin === "external_package" &&
      (["typescript", "@types/node"].includes(identity.package) ||
       !node.id.startsWith(`external_package\0${identity.package}@${identity.version}+${identity.integrity}\0`))) fail("dependency:package-origin");
}

function validateGraph(graph, selectors, expectedProgram) {
  exactKeys(graph, ["program", "roots", "nodes", "edges"], "graph");
  if (JSON.stringify(graph.program) !== JSON.stringify(expectedProgram)) fail("graph:program-identity");
  deepSealCanonicalV2(graph.program);
  if (!Array.isArray(graph.roots) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) fail("graph:arrays");
  const ids = graph.nodes.map((node) => node.id);
  if (ids.some((id) => typeof id !== "string" || id.length === 0) || new Set(ids).size !== ids.length || ids.join("\0") !== [...ids].sort(canonicalCompare).join("\0")) fail(`graph:node-order:${JSON.stringify(ids)}`);
  const idSet = new Set(ids);
  const reachable = new Set();
  for (const root of graph.roots) {
    exactKeys(root, ["kind", "selector", "nodes"], "root");
    if (root.kind !== "selector" || typeof root.selector !== "string" || !Array.isArray(root.nodes) || root.nodes.length === 0 ||
        root.nodes.join("\0") !== [...new Set(root.nodes)].sort(canonicalCompare).join("\0")) fail("graph:root");
    for (const id of root.nodes) { if (!idSet.has(id)) fail("graph:root-node"); reachable.add(id); }
  }
  if (graph.roots.map((root) => root.selector).sort(canonicalCompare).join("\0") !== [...selectors].sort(canonicalCompare).join("\0")) fail("graph:selectors");
  for (const node of graph.nodes) {
    exactKeys(node, ["id", "origin", "exportedName", "tree", "dependencyIdentity"], "node");
    if (!["repository", "node_builtin", "typescript_lib", "external_package"].includes(node.origin) || !(node.exportedName === null || typeof node.exportedName === "string")) fail("graph:node");
    assertDependency(node, graph.program);
    assertTree(node.tree);
  }
  const serializedEdges = graph.edges.map((edge) => JSON.stringify(edge));
  if (new Set(serializedEdges).size !== serializedEdges.length || serializedEdges.join("\0") !== [...serializedEdges].sort(canonicalCompare).join("\0")) fail("graph:edge-order");
  for (const edge of graph.edges) {
    exactKeys(edge, ["from", "to", "sitePath", "kind", "exportPath", "resolvedSignature", "overloads"], "edge");
    if (!idSet.has(edge.from) || !idSet.has(edge.to) || !EDGE_KINDS.has(edge.kind) || !Array.isArray(edge.sitePath) ||
        edge.sitePath.some((part) => !Number.isSafeInteger(part) || part < 0) || !Array.isArray(edge.exportPath) ||
        edge.exportPath.some((part) => typeof part !== "string") || !Array.isArray(edge.overloads)) fail("graph:edge");
    if (edge.resolvedSignature !== null) assertTree(edge.resolvedSignature);
    for (const overload of edge.overloads) assertTree(overload);
    const callLike = ["call", "construct", "tag"].includes(edge.kind);
    if (callLike && (edge.resolvedSignature === null || edge.overloads.length === 0)) fail("graph:call-arm");
    if (!callLike && (edge.resolvedSignature !== null || edge.overloads.length !== 0)) fail("graph:non-call-arm");
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

export function assertTypeScriptGraphV6(graph, selectors, expectedProgram) {
  if (!issuedGraphs.has(graph)) fail("graph:authority");
  return validateGraph(graph, selectors, expectedProgram);
}

export function compileValidatedDescriptor(catalogue, id) {
  const sealed = deepSealCanonicalV2(catalogue);
  validateCatalogue(sealed);
  for (const resource of sealed.resources) {
    for (const selector of selectorsFor(resource.projection)) parseStructuralSelector(selector);
  }
  const descriptor = sealed.resources.find((candidate) => candidate.id === id);
  if (descriptor === undefined) fail("descriptor:not-found");
  issuedDescriptors.add(descriptor);
  return descriptor;
}

export function createSiteBoundRepositoryProjector(repositoryPath) {
  const repositoryRoot = realpathSync(repositoryPath);
  return function project(descriptor, revision) {
    if (!issuedDescriptors.has(descriptor)) fail("descriptor:authority");
    const selectorsInput = [...descriptor.projection.roots, descriptor.projection.versionSelector];
    if (new Set(selectorsInput).size !== selectorsInput.length) fail("descriptor:duplicate-root");
    const parsed = selectorsInput.map(parseStructuralSelector);
    const rootNames = [...new Set(parsed.map((selector) => selector.path))].sort(canonicalCompare);
    const snapshot = repositorySnapshot(repositoryRoot, revision);
    for (const name of rootNames) if (!snapshot.paths.has(name)) fail("program:root-not-at-revision");
    const image = createPinnedProgram(repositoryRoot, snapshot, rootNames);
    const roots = parsed.map((selector) => resolveRoot(image, selector));
    const versionNode = roots.at(-1).selected;
    const version = ts.isNumericLiteral(versionNode) ? Number(versionNode.text) : Number.NaN;
    if (!Number.isSafeInteger(version) || version <= 0) fail("projection:version");
    const graph = buildGraph(image, roots);
    const selectors = parsed.map((selector) => selector.canonical);
    validateGraph(graph, selectors, image.identity);
    const semantic = deepSealCanonicalV2(graph);
    issuedGraphs.add(semantic);
    return Object.freeze({ identity: deepSealCanonicalV2({ version }), semantic, digest: sharedResourceDigest({ adapter: "typescript_contract@1", version, graph: semantic }), resolvedSelectors: Object.freeze(selectors) });
  };
}
