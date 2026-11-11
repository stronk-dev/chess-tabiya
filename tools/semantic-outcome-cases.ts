// Authoring helper for the five reviewed D1716 outcome sources. This does not execute
// qualification or change consumer bindings; the canonical writer must still prove them.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { loadSemanticValidationCases, readSemanticValidationCases } from "../packages/runtime/src/semantic-validation-case-storage.js";
import { KING_OUTCOME_LITERAL_SOURCES } from "../packages/runtime/src/semantic-validation-king-outcome-sources.js";
import { CONTROL_OUTCOME_LITERAL_SOURCE } from "../packages/runtime/src/semantic-validation-control-outcome-sources.js";
import { LINE_OUTCOME_LITERAL_SOURCE } from "../packages/runtime/src/semantic-validation-line-outcome-sources.js";
import { RISK_OUTCOME_LITERAL_SOURCE } from "../packages/runtime/src/semantic-validation-risk-outcome-sources.js";
import { evidenceDigest } from "../packages/runtime/src/evidence-contract.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, resolveSemanticValidationCitedPropositionAuthority, sha256Text } from "../packages/runtime/src/semantic-validation-authorities.js";
import { parseSemanticValidationCase, parseSemanticValidationProfile, semanticFactConstraintSha256,
  SEMANTIC_VALIDATION_CASES_PATH, SEMANTIC_VALIDATION_PROFILES_PATH } from "../packages/runtime/src/semantic-validation.js";

const root = SEMANTIC_VALIDATION_REPOSITORY_ROOT;
const groups = [
  ["king-outcomes", KING_OUTCOME_LITERAL_SOURCES],
  ["control-outcomes", [CONTROL_OUTCOME_LITERAL_SOURCE]],
  ["line-outcomes", [LINE_OUTCOME_LITERAL_SOURCE]],
  ["risk-outcomes", [RISK_OUTCOME_LITERAL_SOURCE]],
] as const;
const files = new Map<string, string>();
const cases = groups.flatMap(([name, sources]) => {
  const rows = sources.flatMap(source => source.cases.map(row => {
    const value = parseSemanticValidationCase({ id: row.proposition.case.id, version: 1,
      subject: row.proposition.subject, arm: row.arm, operation: source.operation, input: row.input, expectation: row.proposition.expectation,
      authority: { kind: "cited_proposition", sourceId: source.sourceId, sourceRevision: source.sourceRevision, licence: source.licence,
        span: { start: 0, end: source.text.length, textSha256: sha256Text(source.text) },
        propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) } });
    if (value.authority.kind !== "cited_proposition") throw Error("Fixed cited source required");
    resolveSemanticValidationCitedPropositionAuthority(value, value.authority);
    return value;
  }));
  const text = `{\n  "schemaVersion": 1,\n  "cases": [\n${rows.map(row => `    ${JSON.stringify(row)}`).join(",\n")}\n  ]\n}\n`;
  if (Buffer.byteLength(text) >= 5 * 1024 * 1024) throw Error(`Case part ${name} reaches the existing5MiB limit`);
  files.set(`packages/runtime/src/semantic-validation-cases/${name}.json`, text);
  console.log(`${name}: ${rows.length} cases, ${Buffer.byteLength(text)} bytes`);
  return rows;
});
const ids = new Set(cases.map(row => row.id));
if (ids.size !== cases.length) throw Error("Duplicate prepared outcome case IDs");
const previous = loadSemanticValidationCases(root).cases;
const index = JSON.parse(readFileSync(resolve(root, SEMANTIC_VALIDATION_CASES_PATH), "utf8")) as { schemaVersion: 2; parts: string[] };
const owned = [...files.keys()].map(path => path.replace("packages/runtime/src/", ""));
index.parts = [...index.parts.filter(path => !owned.includes(path)), ...owned];
files.set(SEMANTIC_VALIDATION_CASES_PATH, `${JSON.stringify(index, null, 2)}\n`);
const candidate = readSemanticValidationCases(path => files.get(path) ?? readFileSync(resolve(root, path), "utf8"));
if (!isDeepStrictEqual(candidate.cases.filter(row => !ids.has(String(row.id))), previous.filter(row => !ids.has(String(row.id))))) {
  throw Error("Outcome fixture update changed an existing unowned case or order");
}
const profiles = JSON.parse(readFileSync(resolve(root, SEMANTIC_VALIDATION_PROFILES_PATH), "utf8"));
const bound = new Set<string>();
const compactRefs: (readonly [string, string])[] = [];
for (const profile of profiles.profiles) {
  const rows = cases.filter(row => isDeepStrictEqual(row.subject, profile.subject));
  if (rows.length === 0) continue;
  for (const [cell, arm] of [["positive", "positive"], ["semanticNegative", "semantic_negative"],
    ["orientation", "orientation"], ["counterfactual", "counterfactual"]] as const) {
    const refs = rows.filter(row => row.arm === arm).map(row => ({ kind: "case", id: row.id, version: 1, subject: row.subject, arm }));
    if (refs.length === 0) throw Error(`Prepared source has no ${arm} cases`);
    profile[cell] = { disposition: "present", refs };
    // One complete reference per line, as with the complete case records above.
    // Repeated subject tuples should not turn404 refs into thousands of diff lines.
    compactRefs.push([`${JSON.stringify(cell)}: ${JSON.stringify(profile[cell], null, 2).replaceAll("\n", "\n      ")}`,
      `${JSON.stringify(cell)}: {\n        "disposition": "present",\n        "refs": [\n${refs.map(ref => `          ${JSON.stringify(ref)}`).join(",\n")}\n        ]\n      }`]);
  }
  parseSemanticValidationProfile(profile);
  for (const row of rows) {
    if (bound.has(row.id)) throw Error("Prepared case matched multiple profiles");
    bound.add(row.id);
  }
}
if (bound.size !== cases.length) throw Error("Some prepared source cases have no exact profile");
let profileText = `${JSON.stringify(profiles, null, 2)}\n`;
for (const [expanded, compact] of compactRefs) {
  if (!profileText.includes(expanded)) throw Error("Prepared profile reference text did not resolve");
  profileText = profileText.replace(expanded, compact);
}
files.set(SEMANTIC_VALIDATION_PROFILES_PATH, profileText);
console.log(`prepared ${cases.length} cases; complete candidate has ${candidate.cases.length}`);
if (process.argv.includes("--write")) for (const [path, text] of files) writeFileSync(resolve(root, path), text);
