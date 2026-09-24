/**
 * Fixed package-owned authority stores and resolvers (rfc/semantic-validation-authority.md §4.1, R3, R4).
 *
 * Node-only and build/test-only: it reads the repository files that *are* the stores — the D1713
 * migration matrix and its cited test sources, the protected owner-authority store and the sealed
 * oracle witness rows. No resolver accepts a caller-supplied lookup, payload or proposition; each
 * returns the one closed proposition record or throws `SEMANTIC_VALIDATION_AUTHORITY_INVALID`.
 * Never exported from the runtime barrel.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_ORACLE_WITNESSES, type SemanticValidationOracleWitness } from "./semantic-validation-oracles.js";
import {
  SEMANTIC_VALIDATION_OWNER_STORE_PATH,
  SemanticValidationError,
  parseSemanticValidationOwnerAuthorityStore,
  semanticFactConstraintSha256,
  semanticValidationDigest,
  semanticValidationSubjectKey,
  type SemanticValidationCase,
  type SemanticValidationCitedPropositionAuthority,
  type SemanticValidationExistingAssertionAuthority,
  type SemanticValidationOwnerAuthorityRef,
  type SemanticValidationPropositionAuthority,
  type SemanticValidationPropositionRecord,
} from "./semantic-validation.js";

/** The repository root, fixed by this file's own location — never a caller argument. */
export const SEMANTIC_VALIDATION_REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const SEMANTIC_VALIDATION_MATRIX_PATH = "tools/d1713-semantic-validation-matrix/validation-matrix.test.ts";

const invalid = (message: string): never => {
  throw new SemanticValidationError("SEMANTIC_VALIDATION_AUTHORITY_INVALID", message);
};

export const sha256Text = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex");

function readRepositoryFile(path: string): string {
  const absolute = resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, path);
  if (!absolute.startsWith(`${SEMANTIC_VALIDATION_REPOSITORY_ROOT}/`) || !existsSync(absolute)) return invalid(`authority source ${path} does not resolve`);
  return readFileSync(absolute, "utf8");
}

/** The exact body of one `it("title", () => { … })` block, brace-matched from its arrow body. */
export function semanticValidationTestBody(source: string, title: string): string {
  const quoted = [`it(${JSON.stringify(title)}`, `it('${title}'`, `it(\`${title}\``];
  const start = quoted.map((needle) => source.indexOf(needle)).find((index) => index >= 0);
  if (start === undefined) return invalid(`test "${title}" is absent`);
  const open = source.indexOf("{", source.indexOf("=>", start));
  if (open < 0) return invalid(`test "${title}" has no block body`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open, index + 1);
    }
  }
  return invalid(`test "${title}" body is unterminated`);
}

/** The frozen expectation bytes a moved assertion must keep (criterion 16). */
export function semanticFrozenExpectationSha256(value: Pick<SemanticValidationCase, "subject" | "arm" | "operation" | "input" | "expectation">): string {
  return semanticValidationDigest("frozen-expectation", { subject: value.subject, arm: value.arm, operation: value.operation, input: value.input, expectation: value.expectation });
}

function matrixSection(matrix: string, section: "POSITIVE" | "NEGATIVE"): string {
  const start = matrix.indexOf(`const ${section}:`);
  if (start < 0) return invalid(`D1713 matrix has no ${section} section`);
  const end = matrix.indexOf("});", start);
  return matrix.slice(start, end);
}

/**
 * `existing_assertion` (§4.1): legal only for a D1713 row already classified valid at the event
 * emitter. The row is `POSITIVE:<projection id>` or `NEGATIVE:<projection id>`; the matrix row must
 * name exactly the cited test, the cited test body must still hash to `sourceSha256`, and the
 * moved case bytes must hash to `frozenExpectationSha256`.
 */
export function resolveSemanticValidationExistingAssertionAuthority(value: SemanticValidationCase, ref: SemanticValidationExistingAssertionAuthority): SemanticValidationPropositionRecord {
  const [section, projectionId] = ref.matrixRow.split(":") as [string, string | undefined];
  if ((section !== "POSITIVE" && section !== "NEGATIVE") || projectionId === undefined) return invalid(`matrix row ${ref.matrixRow} is not POSITIVE:<id> or NEGATIVE:<id>`);
  if (projectionId !== value.subject.projection.id) return invalid(`matrix row ${ref.matrixRow} names another projection`);
  if ((section === "POSITIVE") !== (value.arm === "positive") || (section === "NEGATIVE") !== (value.arm === "semantic_negative")) return invalid(`matrix row ${ref.matrixRow} does not classify the ${value.arm} arm`);
  const [path, title] = [ref.testSite.slice(0, ref.testSite.indexOf("#")), ref.testSite.slice(ref.testSite.indexOf("#") + 1)];
  const matrixText = matrixSection(readRepositoryFile(SEMANTIC_VALIDATION_MATRIX_PATH), section);
  const rowLine = matrixText.split("\n").find((line) => line.includes(`"${projectionId}":`));
  const lowerLayer = rowLine !== undefined && /,\s*"(source_predicate|composition|population_observation|external_disagreement)"\)/u.test(rowLine);
  if (rowLine === undefined || !rowLine.includes(JSON.stringify(title)) || lowerLayer) return invalid(`D1713 ${section} row for ${projectionId} does not cite "${title}" at the event emitter`);
  const body = semanticValidationTestBody(readRepositoryFile(path), title);
  if (sha256Text(body) !== ref.sourceSha256) return invalid(`test body of "${title}" changed since its assertion moved (source digest mismatch)`);
  if (semanticFrozenExpectationSha256(value) !== ref.frozenExpectationSha256) return invalid(`case ${value.id} expectation bytes differ from the frozen moved assertion`);
  return Object.freeze({ subject: value.subject, case: Object.freeze({ id: value.id, version: 1 as const }), factConstraint: Object.freeze([]), factConstraintSha256: semanticFactConstraintSha256([]), expectation: value.expectation });
}

/** No immutable cited-source manifest is registered in v1; a cited proposition cannot resolve. */
export function resolveSemanticValidationCitedPropositionAuthority(_value: SemanticValidationCase, ref: SemanticValidationCitedPropositionAuthority): SemanticValidationPropositionRecord {
  return invalid(`cited source ${ref.sourceId}@${ref.sourceRevision} has no registered immutable source manifest`);
}

/**
 * `owner_authored` (§R4): resolves only against the protected owner store. Its absence is the
 * undischarged D0 bootstrap ([[D2449]]); no implementer may create or synthesize it.
 */
export function resolveSemanticValidationOwnerAuthority(value: SemanticValidationCase, ref: SemanticValidationOwnerAuthorityRef): SemanticValidationPropositionRecord {
  const absolute = resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_OWNER_STORE_PATH);
  if (!existsSync(absolute)) return invalid(`owner authority ${ref.id}@${ref.version}: the protected owner store is absent (D0 / [[D2449]] undischarged)`);
  const store = parseSemanticValidationOwnerAuthorityStore(JSON.parse(readFileSync(absolute, "utf8")));
  const row = store.authorities.find((candidate) => candidate.id === ref.id && candidate.version === ref.version);
  if (row === undefined) return invalid(`owner authority ${ref.id}@${ref.version} is not in the protected store`);
  if (semanticValidationSubjectKey(row.subject) !== semanticValidationSubjectKey(value.subject) || row.case.id !== value.id || evidenceDigest(row.expectation) !== evidenceDigest(value.expectation)) return invalid(`owner authority ${ref.id} binds another subject, case or expectation`);
  return Object.freeze({ subject: row.subject, case: row.case, factConstraint: row.factConstraint, factConstraintSha256: semanticFactConstraintSha256(row.factConstraint), expectation: row.expectation });
}

function resolveProposition(value: SemanticValidationCase, authority: SemanticValidationPropositionAuthority): SemanticValidationPropositionRecord {
  switch (authority.kind) {
    case "existing_assertion": return resolveSemanticValidationExistingAssertionAuthority(value, authority);
    case "cited_proposition": return resolveSemanticValidationCitedPropositionAuthority(value, authority);
    case "owner_authored": return resolveSemanticValidationOwnerAuthority(value, authority);
  }
}

/** The one proposition normalization over all three arms (§R3, criterion 30). */
export function resolveSemanticValidationProposition(value: SemanticValidationCase): SemanticValidationPropositionRecord {
  const authority = value.authority;
  if (authority.kind === "rules_and_proposition") {
    const record = resolveProposition(value, authority.proposition);
    // A rules-backed case's constraint list is the proposition's own; empty never passes.
    if (authority.factConstraint.length === 0 || semanticFactConstraintSha256(authority.factConstraint) !== semanticFactConstraintSha256(record.factConstraint)) return invalid(`case ${value.id} rules constraint is not its proposition's constraint`);
    return record;
  }
  return resolveProposition(value, authority);
}

/** Sealed witness lookup: exactly one same-case/same-subject/same-oracle row. */
export function resolveSemanticValidationWitness(value: SemanticValidationCase): SemanticValidationOracleWitness {
  if (value.authority.kind !== "rules_and_proposition") return invalid(`case ${value.id} is not rules-backed`);
  const ref = value.authority.witness;
  const rows = SEMANTIC_VALIDATION_ORACLE_WITNESSES.filter((row) => row.id === ref.id && row.version === ref.version);
  if (rows.length !== 1) return invalid(`oracle witness ${ref.id}@${ref.version} resolves ${rows.length} rows`);
  const row = rows[0]!;
  if (row.oracle.id !== value.authority.oracle.id || row.case.id !== value.id || semanticValidationSubjectKey(row.subject) !== semanticValidationSubjectKey(value.subject)) return invalid(`oracle witness ${ref.id} is sealed for another oracle, case or subject`);
  return row;
}

export const SEMANTIC_VALIDATION_RESOLVERS = Object.freeze({
  resolveProposition: resolveSemanticValidationProposition,
  resolveWitness: resolveSemanticValidationWitness,
});

/**
 * The complete static local import closure of operation entry files (§4.3): every relative
 * `.ts`/`.json` source whose bytes can change what the operation computes. A new local import is
 * picked up automatically, so the implementation digest cannot silently omit it.
 */
export function semanticValidationImportClosure(entries: readonly string[], root = SEMANTIC_VALIDATION_REPOSITORY_ROOT): readonly string[] {
  const seen = new Set<string>();
  const visit = (path: string): void => {
    if (seen.has(path)) return;
    const absolute = resolve(root, path);
    if (!existsSync(absolute)) throw new SemanticValidationError("SEMANTIC_VALIDATION_REACH_INVALID", `operation source ${path} is missing`);
    seen.add(path);
    if (!absolute.endsWith(".ts")) return;
    const text = readFileSync(absolute, "utf8");
    for (const match of text.matchAll(/(?:from|import)\s*\(?\s*"(\.{1,2}\/[^"]+)"/gu)) {
      const target = resolve(dirname(absolute), match[1]!.replace(/\.js$/u, ".ts"));
      if (!target.endsWith(".ts") && !target.endsWith(".json")) continue;
      // The generated verdict module is this receipt's own output, never operation implementation.
      if (target.endsWith("semantic-validation-receipt.generated.ts")) continue;
      visit(relative(root, target));
    }
  };
  for (const entry of entries) visit(entry);
  return [...seen].sort();
}
