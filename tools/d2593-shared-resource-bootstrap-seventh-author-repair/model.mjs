import ts from "typescript";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import { parseCanonicalResource } from "../d2498-shared-resource-bootstrap-fourth-author-repair/model.mjs";

function fail(message) {
  throw new TypeError(message);
}

function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label}:object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.join("\0") !== expected.join("\0")) fail(`${label}:keys`);
}

const ROOT_KINDS = new Set(["export", "interface", "type", "function", "class"]);
const DESCENT_KINDS = new Set(["private-method", "method", "local", "member", "object"]);
const IDENTIFIER = /^[$A-Z_a-z][$\w]*$/u;

export function parseStructuralSelector(value) {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/u.test(value)) fail("selector:string");
  const hash = value.indexOf("#");
  if (hash < 1 || value.indexOf("#", hash + 1) !== -1) fail("selector:hash");
  const path = value.slice(0, hash);
  if (/^(?:[A-Za-z][A-Za-z+.-]*:|\/)/u.test(path) || path.includes("\\") ||
      /[%?*\[\]{}]/u.test(path) || path.split("/").some((part) => part === "" || part === "." || part === "..")) {
    fail("selector:path");
  }
  const segments = value.slice(hash + 1).split("/");
  if (segments.some((segment) => segment.length === 0)) fail("selector:segment");
  if (segments[0] === "$id") {
    if (segments.length !== 1) fail("selector:json-descent");
    return Object.freeze({ canonical: value, path, root: Object.freeze({ kind: "json_id" }), descent: Object.freeze([]) });
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
    path,
    root: Object.freeze({ kind: rootMatch[1], name: rootMatch[2] }),
    descent: Object.freeze(descent),
  });
}

function nameText(node) {
  return node?.name && (ts.isIdentifier(node.name) || ts.isPrivateIdentifier(node.name) || ts.isStringLiteral(node.name)) ? node.name.text.replace(/^#/u, "") : undefined;
}

function exported(statement) {
  return statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function unwrap(node) {
  let value = node;
  while (value && (ts.isParenthesizedExpression(value) || ts.isAsExpression(value) || ts.isSatisfiesExpression(value))) value = value.expression;
  return value;
}

function descendAll(node, predicate) {
  const found = [];
  const visit = (current) => {
    if (predicate(current)) found.push(current);
    current.forEachChild(visit);
  };
  visit(node);
  return found;
}

function literalNode(node) {
  const candidate = unwrap(node.initializer ?? node.type ?? node);
  const value = ts.isLiteralTypeNode(candidate) ? unwrap(candidate.literal) : candidate;
  if (value && (ts.isStringLiteral(value) || ts.isNumericLiteral(value) ||
      value.kind === ts.SyntaxKind.TrueKeyword || value.kind === ts.SyntaxKind.FalseKeyword || value.kind === ts.SyntaxKind.NullKeyword)) return value;
  fail("selector:literal-resolution");
}

export function resolveSourceSelector(sourceText, parsed) {
  if (parsed.root.kind === "json_id") {
    const value = JSON.parse(sourceText);
    if (value === null || typeof value !== "object" || Array.isArray(value) || typeof value.$id !== "string") fail("selector:json-id");
    return value.$id;
  }
  const file = ts.createSourceFile(parsed.path, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let matches = [];
  for (const statement of file.statements) {
    if (parsed.root.kind === "export") {
      if (ts.isVariableStatement(statement) && exported(statement)) {
        matches.push(...statement.declarationList.declarations.filter((node) => ts.isIdentifier(node.name) && node.name.text === parsed.root.name));
      } else if (exported(statement) && nameText(statement) === parsed.root.name) matches.push(statement);
    } else if (parsed.root.kind === "interface" && ts.isInterfaceDeclaration(statement) && statement.name.text === parsed.root.name) matches.push(statement);
    else if (parsed.root.kind === "type" && ts.isTypeAliasDeclaration(statement) && statement.name.text === parsed.root.name) matches.push(statement);
    else if (parsed.root.kind === "function" && ts.isFunctionDeclaration(statement) && statement.name?.text === parsed.root.name) matches.push(statement);
    else if (parsed.root.kind === "class" && ts.isClassDeclaration(statement) && statement.name?.text === parsed.root.name) matches.push(statement);
  }
  if (matches.length !== 1) fail(`selector:root-count:${matches.length}`);
  let current = matches[0];
  for (const step of parsed.descent) {
    if (step.kind === "literal") {
      current = literalNode(current);
      continue;
    }
    if (step.kind === "member") matches = [...(current.members ?? [])].filter((node) => nameText(node) === step.name);
    else if (step.kind === "method" || step.kind === "private_method") {
      matches = [...(current.members ?? [])].filter((node) => ts.isMethodDeclaration(node) && nameText(node) === step.name);
      if (step.kind === "private_method") matches = matches.filter((node) => ts.isPrivateIdentifier(node.name) || node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword));
    } else if (step.kind === "local") matches = descendAll(current, (node) => ts.isVariableDeclaration(node) && nameText(node) === step.name);
    else if (step.kind === "object") matches = descendAll(current, (node) => ts.isPropertyAssignment(node) && nameText(node) === step.name);
    else fail("selector:unsupported-step");
    if (matches.length !== 1) fail(`selector:descent-count:${matches.length}`);
    current = matches[0];
  }
  return current;
}

export function deepSealCanonical(value) {
  const active = new WeakSet();
  function clone(input) {
    if (input === null || typeof input === "string" || typeof input === "boolean") return input;
    if (typeof input === "number") {
      if (!Number.isFinite(input) || Object.is(input, -0)) fail("canonical:number");
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
      if (Array.from({ length: input.length }, (_, index) => index).some((index) => !Object.hasOwn(input, index)) || own.some((key) => typeof key === "symbol" || (key !== "length" && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) fail("canonical:array-shape");
      output = input.map(clone);
    }
    else {
      output = {};
      const own = Reflect.ownKeys(input);
      if (own.some((key) => typeof key === "symbol")) fail("canonical:symbol-key");
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

function programFor(sourceText, fileName = "resource.ts") {
  const options = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, types: [] };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) =>
    name === fileName
      ? ts.createSourceFile(name, sourceText, languageVersion, true, ts.ScriptKind.TS)
      : original(name, languageVersion, onError, shouldCreateNewSourceFile);
  return ts.createProgram([fileName], options, host);
}

export function assertGlobalIntrinsicFreeze(sourceText) {
  const program = programFor(sourceText);
  const source = program.getSourceFile("resource.ts");
  const checker = program.getTypeChecker();
  const calls = descendAll(source, (node) => ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "Object" && node.expression.name.text === "freeze");
  for (const call of calls) {
    const receiver = call.expression.expression;
    const symbol = checker.getSymbolAtLocation(receiver);
    const signature = checker.getResolvedSignature(call);
    const declarations = symbol?.declarations ?? [];
    const signatureFile = signature?.declaration?.getSourceFile().fileName ?? "";
    if (declarations.length === 0 || declarations.some((declaration) => !declaration.getSourceFile().isDeclarationFile) ||
        !signatureFile.includes("lib.es5.d.ts")) fail("canonical:shadowed-object-freeze");
  }
  return calls.length;
}

export function projectCanonicalResourceDeep(sourceText, exportName, descriptorId, selector) {
  assertGlobalIntrinsicFreeze(sourceText);
  const parsed = parseCanonicalResource(sourceText, exportName, descriptorId);
  const semantic = deepSealCanonical(parsed.payload);
  const identity = deepSealCanonical({ version: parsed.version });
  const expected = sharedResourceDigest({ id: descriptorId, version: parsed.version, payload: semantic });
  if (parsed.digest !== expected) fail("canonical:digest");
  return Object.freeze({ identity, semantic, digest: parsed.digest, resolvedSelectors: Object.freeze([selector]) });
}

const EDGE_KINDS = new Set(["type_reference", "value_reference", "property_reference", "call", "construct", "tag", "extends", "implements", "import", "re_export"]);

export function assertTypeScriptGraph(graph, descriptorSelectors) {
  exactKeys(graph, ["program", "roots", "nodes", "edges"], "graph");
  exactKeys(graph.program, ["compilerPackage", "compilerVersion", "compilerIntegrity", "configPath", "configDigest", "rootNames", "compilerOptions"], "program");
  if (graph.program.compilerPackage !== "typescript" || graph.program.configPath !== "tsconfig.base.json") fail("program:identity");
  if (![graph.roots, graph.nodes, graph.edges, graph.program.rootNames].every(Array.isArray)) fail("graph:arrays");
  const selectors = graph.roots.map((root) => root.selector);
  if (selectors.join("\0") !== descriptorSelectors.join("\0")) fail("graph:selectors");
  const ids = graph.nodes.map((node) => node.id);
  if (new Set(ids).size !== ids.length || [...ids].sort().join("\0") !== ids.join("\0")) fail("graph:node-order");
  const idSet = new Set(ids);
  for (const root of graph.roots) {
    exactKeys(root, ["kind", "selector", "node"], "root");
    if (root.kind !== "selector" || !idSet.has(root.node)) fail("graph:root-node");
  }
  const reachable = new Set(graph.roots.map((root) => root.node));
  for (const node of graph.nodes) {
    exactKeys(node, ["id", "origin", "exportedName", "tree", "dependencyIdentity"], "node");
    if (!idSet.has(node.id) || !["repository", "node_builtin", "typescript_lib", "external_package"].includes(node.origin)) fail("graph:node");
    if ((node.origin === "repository") !== (node.dependencyIdentity === null)) fail("graph:dependency-identity");
    exactKeys(node.tree, ["kind", "text", "children"], "tree");
    if (!Array.isArray(node.tree.children)) fail("tree:children");
  }
  for (const edge of graph.edges) {
    exactKeys(edge, ["from", "to", "kind", "exportPath", "resolvedSignature", "overloads"], "edge");
    if (!idSet.has(edge.from) || !idSet.has(edge.to)) fail("graph:dangling-edge");
    if (!EDGE_KINDS.has(edge.kind)) fail("graph:edge-kind");
    if (!Array.isArray(edge.exportPath) || !Array.isArray(edge.overloads)) fail("graph:edge-arrays");
    const callable = ["call", "construct", "tag"].includes(edge.kind);
    if (!callable && (edge.resolvedSignature !== null || edge.overloads.length !== 0)) fail("graph:edge-signature");
    if (reachable.has(edge.from)) reachable.add(edge.to);
  }
  if (graph.nodes.some((node) => !reachable.has(node.id))) fail("graph:orphan-node");
  return true;
}

export function retainExportSymbolDeclarations(sourceText, exportName, fileName = "contract.ts") {
  const program = programFor(sourceText, fileName);
  const source = program.getSourceFile(fileName);
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(source);
  const root = checker.getExportsOfModule(moduleSymbol).find((symbol) => symbol.name === exportName);
  if (!root) fail("symbol:root");
  const declarations = [...(root.declarations ?? [])].sort((a, b) => a.pos - b.pos);
  return Object.freeze(declarations.map((node, ordinal) => Object.freeze({
    id: `${fileName}\0${ordinal}`,
    kind: ts.SyntaxKind[node.kind],
    symbol: root,
  })));
}

export function projectConstructedTypeScriptContract(options) {
  exactKeys(options, ["version", "path", "sourceText", "roots", "versionSelector"], "typescript-options");
  const selectors = [...options.roots, options.versionSelector];
  const resolved = selectors.map((selector) => resolveSourceSelector(options.sourceText, parseStructuralSelector(selector)));
  const unique = [...new Set(resolved)].sort((a, b) => a.pos - b.pos);
  const ids = new Map(unique.map((node, ordinal) => [node, `${options.path}\0${ordinal}`]));
  const nodes = unique.map((node) => ({
    id: ids.get(node),
    origin: "repository",
    exportedName: nameText(node) ?? null,
    tree: { kind: ts.SyntaxKind[node.kind], text: nameText(node) ?? null, children: [] },
    dependencyIdentity: null,
  }));
  const graph = {
    program: {
      compilerPackage: "typescript",
      compilerVersion: ts.version,
      compilerIntegrity: "sha512:author-fixture",
      configPath: "tsconfig.base.json",
      configDigest: sharedResourceDigest({ compilerOptions: {} }),
      rootNames: [options.path],
      compilerOptions: {},
    },
    roots: selectors.map((selector, index) => ({ kind: "selector", selector, node: ids.get(resolved[index]) })),
    nodes,
    edges: [],
  };
  assertTypeScriptGraph(graph, selectors);
  const semantic = deepSealCanonical(graph);
  return Object.freeze({
    identity: deepSealCanonical({ version: options.version }),
    semantic,
    digest: sharedResourceDigest({ adapter: "typescript_contract@1", version: options.version, graph: semantic }),
    resolvedSelectors: Object.freeze(selectors),
  });
}
