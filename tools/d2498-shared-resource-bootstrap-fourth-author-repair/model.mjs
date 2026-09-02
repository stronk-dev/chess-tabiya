import ts from "typescript";
import { assertCanonicalResource } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";

function fail(message) {
  throw new TypeError(message);
}

function nameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return undefined;
}

function unwrap(node) {
  let current = node;
  while (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isSatisfiesExpression(current)) {
    current = current.expression;
  }
  return current;
}

function literalValue(node) {
  const value = unwrap(node);
  if (ts.isLiteralTypeNode(value)) return literalValue(value.literal);
  if (ts.isStringLiteral(value)) return value.text;
  if (ts.isNumericLiteral(value)) {
    if (!/^(?:0|[1-9][0-9]*)$/u.test(value.getText())) fail("non-JSON integer literal");
    return Number(value.text);
  }
  if (value.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (value.kind === ts.SyntaxKind.NullKeyword) return null;
  fail("selector did not resolve to a literal");
}

function descendants(node, predicate) {
  const found = [];
  const visit = (current) => {
    if (predicate(current)) found.push(current);
    current.forEachChild(visit);
  };
  visit(node);
  return found;
}

export function resolveStructuralSelector(sourceText, selector) {
  const hash = selector.indexOf("#");
  if (hash < 1 || selector.indexOf("#", hash + 1) !== -1) fail("invalid selector");
  const segments = selector.slice(hash + 1).split("/");
  if (segments.some((segment) => segment.includes("."))) fail("dotted selector descent is forbidden");
  const file = ts.createSourceFile(selector.slice(0, hash), sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const [root, ...descent] = segments;
  const [rootKind, rootName] = root.split(":");
  const roots = file.statements.filter((statement) => {
    if (rootKind === "interface" && ts.isInterfaceDeclaration(statement)) return statement.name.text === rootName;
    if (rootKind === "function" && ts.isFunctionDeclaration(statement)) return statement.name?.text === rootName;
    return false;
  });
  if (roots.length !== 1) fail(`root resolved ${roots.length} times`);
  let current = roots[0];
  for (const segment of descent) {
    if (segment === "literal") return literalValue(current.type ?? current.initializer ?? current);
    const separator = segment.indexOf(":");
    const kind = segment.slice(0, separator);
    const name = segment.slice(separator + 1);
    let matches = [];
    if (kind === "member" && "members" in current) {
      matches = current.members.filter((member) => nameText(member.name) === name);
    } else if (kind === "object") {
      matches = descendants(current, (node) => ts.isPropertyAssignment(node) && nameText(node.name) === name);
    } else {
      fail(`unsupported descent ${segment}`);
    }
    if (matches.length !== 1) fail(`${segment} resolved ${matches.length} times`);
    current = matches[0];
  }
  return current;
}

function jsonLiteral(node) {
  let value = unwrap(node);
  if (ts.isCallExpression(value)) {
    const isFreeze = ts.isPropertyAccessExpression(value.expression) &&
      value.expression.expression.getText() === "Object" && value.expression.name.text === "freeze";
    if (!isFreeze || value.arguments.length !== 1) fail("only Object.freeze wrapper is admitted");
    value = unwrap(value.arguments[0]);
  }
  if (ts.isStringLiteral(value)) return value.text;
  if (ts.isNumericLiteral(value)) {
    if (!/^(?:0|[1-9][0-9]*)$/u.test(value.getText())) fail("non-JSON integer literal");
    return Number(value.text);
  }
  if (value.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (value.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(value) && value.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(value.operand)) {
    if (!/^(?:0|[1-9][0-9]*)$/u.test(value.operand.getText())) fail("non-JSON integer literal");
    const result = -Number(value.operand.text);
    if (Object.is(result, -0)) fail("negative zero is forbidden");
    return result;
  }
  if (ts.isArrayLiteralExpression(value)) {
    if (value.elements.some(ts.isOmittedExpression)) fail("array holes are forbidden");
    return value.elements.map(jsonLiteral);
  }
  if (ts.isObjectLiteralExpression(value)) {
    const output = {};
    for (const property of value.properties) {
      if (!ts.isPropertyAssignment(property)) fail("only property assignments are admitted");
      const key = nameText(property.name);
      if (key === undefined || Object.hasOwn(output, key)) fail("invalid or duplicate property key");
      output[key] = jsonLiteral(property.initializer);
    }
    return output;
  }
  fail(`non-literal canonical resource node ${ts.SyntaxKind[value.kind]}`);
}

export function parseCanonicalResource(sourceText, exportName) {
  const file = ts.createSourceFile("resource.ts", sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declarations = [];
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) continue;
    const exported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === exportName && declaration.initializer) declarations.push(declaration);
    }
  }
  if (declarations.length !== 1) fail(`resource export resolved ${declarations.length} times`);
  const parsed = jsonLiteral(declarations[0].initializer);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed) || typeof parsed.id !== "string") {
    fail("canonical resource object required");
  }
  assertCanonicalResource(parsed.id, parsed);
  return parsed;
}
