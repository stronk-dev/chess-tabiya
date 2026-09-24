// rfc/verifiable-runtime-distribution.md §6 — the closed SPDX 2.3 FOSS-eligibility predicate.
//
// The parser follows SPDX 2.3 Annex D (https://spdx.github.io/spdx-spec/v2.3/SPDX-license-expressions/):
// `WITH` binds tighter than `AND`, which binds tighter than `OR`; `WITH` applies an exception to a
// simple expression; `LicenseRef-*` is user-defined text. Tabiya narrows the grammar by policy: operators
// and identifiers must use canonical case, and the legacy `+` shorthand is refused in favour of an
// explicit `-or-later` identifier. Nothing here decides a licence by inference: an OR is satisfied
// only by a curated selection of one literal AST branch, and an override applies only when every
// identity field matches.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { REPO_ROOT, REVISION, canonicalJson, sha256Digest } from "./common.mjs";

export class SpdxSyntaxError extends Error {}

const OPERATORS = new Set(["AND", "OR", "WITH"]);
const IDENTIFIER = /^[A-Za-z0-9.-]+$/u;
const LICENSE_REF = /^(?:DocumentRef-[A-Za-z0-9.-]+:)?LicenseRef-[A-Za-z0-9.-]+$/u;

function tokenize(text) {
  if (typeof text !== "string" || text.trim() === "") throw new SpdxSyntaxError("empty licence expression");
  const tokens = [];
  const pattern = /\s*(\(|\)|[^\s()]+)/guy;
  let match;
  let consumed = 0;
  while ((match = pattern.exec(text)) !== null) {
    tokens.push(match[1]);
    consumed = pattern.lastIndex;
  }
  if (text.slice(consumed).trim() !== "") throw new SpdxSyntaxError(`unparseable licence expression: ${text}`);
  return tokens;
}

/** Parses an SPDX 2.3 licence expression into a binary AST (left-associative, no rewriting). */
export function parseSpdxExpression(text) {
  const tokens = tokenize(text);
  let index = 0;
  const peek = () => tokens[index];
  const take = () => tokens[index++];

  function identifier(kind) {
    const token = take();
    if (token === undefined) throw new SpdxSyntaxError(`expected ${kind} in ${text}`);
    if (OPERATORS.has(token.toUpperCase())) {
      throw new SpdxSyntaxError(`expected ${kind} but found operator ${token} in ${text}`);
    }
    if (token.endsWith("+")) throw new SpdxSyntaxError(`the legacy '+' shorthand is refused by policy; use an explicit -or-later identifier: ${token}`);
    if (token === "NOASSERTION" || token === "NONE") return { type: "none", id: token };
    if (LICENSE_REF.test(token)) return { type: "ref", id: token };
    if (!IDENTIFIER.test(token)) throw new SpdxSyntaxError(`invalid licence identifier ${token}`);
    return { type: "license", id: token };
  }

  function atom() {
    if (peek() === "(") {
      take();
      const inner = orExpression();
      if (take() !== ")") throw new SpdxSyntaxError(`unbalanced parenthesis in ${text}`);
      return inner;
    }
    return identifier("licence identifier");
  }

  function withExpression() {
    const base = atom();
    if (peek() !== undefined && peek().toUpperCase() === "WITH") {
      if (peek() !== "WITH") throw new SpdxSyntaxError(`operator case must be canonical: ${peek()}`);
      take();
      if (base.type !== "license" && base.type !== "ref") throw new SpdxSyntaxError(`WITH applies only to a simple expression in ${text}`);
      const exception = identifier("licence exception");
      if (exception.type !== "license") throw new SpdxSyntaxError(`invalid licence exception ${exception.id}`);
      return { type: "with", license: base, exception: exception.id };
    }
    return base;
  }

  function binary(operator, next) {
    return () => {
      let left = next();
      while (peek() !== undefined && peek().toUpperCase() === operator) {
        if (peek() !== operator) throw new SpdxSyntaxError(`operator case must be canonical: ${peek()}`);
        take();
        left = { type: operator.toLowerCase(), left, right: next() };
      }
      return left;
    };
  }

  const andExpression = binary("AND", withExpression);
  const orExpression = binary("OR", andExpression);
  const ast = orExpression();
  if (index !== tokens.length) throw new SpdxSyntaxError(`unexpected token ${tokens[index]} in ${text}`);
  return ast;
}

/** Deterministic rendering used to bind selections/overrides to an exact expression. */
export function renderSpdx(ast, position = "root") {
  switch (ast.type) {
    case "license":
    case "ref":
    case "none":
      return ast.id;
    case "with":
      return `${renderSpdx(ast.license)} WITH ${ast.exception}`;
    case "and":
    case "or": {
      const text = `${renderSpdx(ast.left, `left:${ast.type}`)} ${ast.type.toUpperCase()} ${renderSpdx(ast.right, `right:${ast.type}`)}`;
      // Left-associative chains of one operator render flat; every other nesting is parenthesised so
      // the rendering reparses to exactly the same tree.
      return position === "root" || position === `left:${ast.type}` ? text : `(${text})`;
    }
    default:
      throw new TypeError(`unknown SPDX node ${ast.type}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Policy input.

export const FOSS_POLICY_PATH = "release/foss-policy.v1.json";
export const FOSS_OVERRIDES_PATH = "release/foss-overrides.v1.json";

function sortedUnique(values, label) {
  const sorted = [...values].sort();
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] !== sorted[index]) throw new TypeError(`${label} must be sorted`);
    if (index > 0 && values[index] === values[index - 1]) throw new TypeError(`${label} contains duplicate ${values[index]}`);
  }
  return values;
}

/**
 * Loads and verifies the committed FOSS policy: closed canonical form, exact licence-text digests on
 * disk, and the digest of the curated-override file it governs.
 */
export function loadFossPolicy({ root = REPO_ROOT, policyPath = FOSS_POLICY_PATH } = {}) {
  const bytes = readFileSync(resolve(root, policyPath));
  const policy = JSON.parse(bytes.toString("utf8"));
  if (bytes.toString("utf8") !== canonicalJson(policy)) throw new TypeError(`${policyPath} is not canonical JSON`);
  const keys = Object.keys(policy).sort().join(",");
  const expected = "acceptedLicenseIds,acceptedWithPairs,exceptionTexts,format,formatVersion,licenseTextRoot,licenseTexts,overrides,refusedLicenseIds,spdxLicenseListVersion";
  if (keys !== expected) throw new TypeError(`${policyPath} has unexpected fields: ${keys}`);
  if (policy.format !== "tabiya-foss-policy" || policy.formatVersion !== 1) throw new TypeError(`${policyPath} has an unknown format/version`);
  sortedUnique(policy.acceptedLicenseIds, "acceptedLicenseIds");
  sortedUnique(policy.refusedLicenseIds, "refusedLicenseIds");
  sortedUnique(policy.acceptedWithPairs.map((pair) => `${pair.license} WITH ${pair.exception}`), "acceptedWithPairs");
  for (const id of policy.acceptedLicenseIds) {
    if (policy.refusedLicenseIds.includes(id)) throw new TypeError(`${id} is both accepted and refused`);
    if (!(id in policy.licenseTexts)) throw new TypeError(`accepted ${id} has no required licence-text digest`);
  }
  for (const pair of policy.acceptedWithPairs) {
    if (!policy.acceptedLicenseIds.includes(pair.license)) throw new TypeError(`WITH pair base ${pair.license} is not accepted`);
    if (!(pair.exception in policy.exceptionTexts)) throw new TypeError(`WITH exception ${pair.exception} has no text digest`);
  }
  const texts = new Map();
  for (const [id, digest] of [...Object.entries(policy.licenseTexts), ...Object.entries(policy.exceptionTexts)]) {
    const path = resolve(root, policy.licenseTextRoot, `${id}.txt`);
    const text = readFileSync(path);
    if (sha256Digest(text) !== digest) throw new TypeError(`licence text ${id} does not match its policy digest`);
    texts.set(id, { path: `${policy.licenseTextRoot}/${id}.txt`, digest });
  }
  const overrideBytes = readFileSync(resolve(root, policy.overrides.path));
  if (sha256Digest(overrideBytes) !== policy.overrides.digest) throw new TypeError("curated override file does not match the policy digest");
  const overrides = parseOverrides(JSON.parse(overrideBytes.toString("utf8")));
  return Object.freeze({
    ...policy,
    digest: sha256Digest(bytes),
    texts,
    overrideRecords: overrides,
  });
}

// ---------------------------------------------------------------------------------------------
// Curated overrides and OR selections.

const OVERRIDE_KEYS = "approvalCommit,approver,artifactDigest,observedExpression,purl,rationale,replacementExpression,scanner,upstream,version";
const SELECTION_KEYS = "approvalCommit,approver,artifactDigest,branch,expression,path,purl,rationale,version";

export function parseOverrides(document) {
  if (document?.format !== "tabiya-foss-overrides" || document.formatVersion !== 1) throw new TypeError("curated overrides have an unknown format/version");
  if (Object.keys(document).sort().join(",") !== "format,formatVersion,orSelections,overrides") throw new TypeError("curated overrides have unexpected fields");
  for (const record of document.overrides) {
    if (Object.keys(record).sort().join(",") !== OVERRIDE_KEYS) throw new TypeError(`override for ${record.purl} has unexpected fields`);
  }
  for (const record of document.orSelections) {
    if (Object.keys(record).sort().join(",") !== SELECTION_KEYS) throw new TypeError(`OR selection for ${record.purl} has unexpected fields`);
  }
  return Object.freeze({ overrides: Object.freeze([...document.overrides]), orSelections: Object.freeze([...document.orSelections]) });
}

function approved(record) {
  return typeof record.approver === "string" && record.approver.trim() !== "" && REVISION.test(record.approvalCommit ?? "");
}

function sameComponent(record, component) {
  return record.purl === component.purl && record.version === component.version && record.artifactDigest === component.artifactDigest;
}

// ---------------------------------------------------------------------------------------------
// Evaluation.

function evaluateNode(ast, context, path) {
  switch (ast.type) {
    case "none":
      return { pass: false, failures: [`${ast.id} is never FOSS-eligible`], texts: [] };
    case "ref":
      return { pass: false, failures: [`custom reference ${ast.id} is not accepted in v1`], texts: [] };
    case "license": {
      if (context.policy.refusedLicenseIds.includes(ast.id)) return { pass: false, failures: [`${ast.id} is refused`], texts: [] };
      if (!context.policy.acceptedLicenseIds.includes(ast.id)) return { pass: false, failures: [`${ast.id} is not an accepted licence id`], texts: [] };
      if (!context.policy.texts.has(ast.id)) return { pass: false, failures: [`${ast.id} has no pinned licence text`], texts: [] };
      return { pass: true, failures: [], texts: [ast.id] };
    }
    case "with": {
      const base = evaluateNode(ast.license, context, `${path}.license`);
      const pair = context.policy.acceptedWithPairs.some((candidate) => candidate.license === ast.license.id && candidate.exception === ast.exception);
      if (!pair) return { pass: false, failures: [...base.failures, `${ast.license.id} WITH ${ast.exception} is not an accepted pair`], texts: [] };
      if (!context.policy.texts.has(ast.exception)) return { pass: false, failures: [`${ast.exception} has no pinned exception text`], texts: [] };
      return base.pass ? { pass: true, failures: [], texts: [...base.texts, ast.exception] } : base;
    }
    case "and": {
      const left = evaluateNode(ast.left, context, `${path}.left`);
      const right = evaluateNode(ast.right, context, `${path}.right`);
      return { pass: left.pass && right.pass, failures: [...left.failures, ...right.failures], texts: [...left.texts, ...right.texts] };
    }
    case "or": {
      const selection = context.selections.get(path);
      if (selection === undefined) return { pass: false, failures: [`OR at ${path} (${renderSpdx(ast)}) has no curated branch selection`], texts: [] };
      const chosen = evaluateNode(ast[selection], context, `${path}.${selection}`);
      return chosen.pass ? chosen : { pass: false, failures: [`selected ${selection} branch at ${path} fails: ${chosen.failures.join("; ")}`], texts: [] };
    }
    default:
      throw new TypeError(`unknown SPDX node ${ast.type}`);
  }
}

/** Evaluates one expression under the policy with exact OR selections (path → "left" | "right"). */
export function evaluateExpression(expression, policy, selections = new Map()) {
  let ast;
  try {
    ast = parseSpdxExpression(expression);
  } catch (error) {
    return { pass: false, failures: [error.message], texts: [] };
  }
  const result = evaluateNode(ast, { policy, selections }, "root");
  return { ...result, texts: [...new Set(result.texts)].sort() };
}

/**
 * Evaluates one inventory component. `component` carries purl, version, artifactDigest, the scanner
 * identity/version, the observed expression, and optionally a repository-declared expression.
 */
export function evaluateComponent(component, policy) {
  const failures = [];
  let expression = component.declaredExpression ?? component.observedExpression;
  let overrideApplied;
  if (component.declaredExpression !== undefined
    && component.observedExpression !== undefined
    && component.observedExpression !== "NOASSERTION"
    && component.observedExpression !== component.declaredExpression) {
    failures.push(`scanner ${component.observedExpression} conflicts with declared ${component.declaredExpression}`);
  }
  // D1: the unresolved Maia weight is not a scanner error. Its expression changes only through the
  // D1 weight-rights record and a reviewed policy input, never through the override file.
  const weightGate = /LicenseRef-MAIA3-WEIGHTS-UNRESOLVED/u.test(`${component.observedExpression ?? ""} ${component.declaredExpression ?? ""}`);
  const candidates = weightGate ? [] : policy.overrideRecords.overrides.filter((record) => sameComponent(record, component)
    && record.scanner?.id === component.scanner?.id
    && record.scanner?.version === component.scanner?.version
    && record.observedExpression === component.observedExpression);
  const applicable = candidates.filter(approved);
  const replacements = new Set(applicable.map((record) => record.replacementExpression));
  if (replacements.size > 1) {
    failures.push("conflicting curated overrides apply to the same component");
  } else if (replacements.size === 1) {
    const [replacement] = replacements;
    // An exact applicable record is the corrective authority for the scanner/declared conflict.
    failures.length = 0;
    if (/LicenseRef-/u.test(replacement)) failures.push("an override cannot bless custom LicenseRef text in v1");
    expression = replacement;
    overrideApplied = replacement;
  }
  const selections = new Map();
  for (const record of policy.overrideRecords.orSelections) {
    if (!sameComponent(record, component) || record.expression !== expression || !approved(record)) continue;
    const key = ["root", ...record.path].join(".");
    if (selections.has(key) && selections.get(key) !== record.branch) {
      failures.push(`conflicting OR selections at ${key}`);
    }
    selections.set(key, record.branch);
  }
  const result = expression === undefined
    ? { pass: false, failures: ["no licence expression"], texts: [] }
    : evaluateExpression(expression, policy, selections);
  const allFailures = [...failures, ...result.failures];
  return Object.freeze({
    pass: allFailures.length === 0 && result.pass,
    expression: expression ?? "NOASSERTION",
    overrideApplied,
    failures: Object.freeze(allFailures),
    texts: Object.freeze(result.texts),
  });
}
