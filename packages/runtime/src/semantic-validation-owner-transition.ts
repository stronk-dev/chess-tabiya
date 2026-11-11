/** Build/test-only Git-tree authority checks. Not part of the pure application runtime. */
import { evidenceDigest } from "./evidence-contract.js";
import {
  parseSemanticValidationCasePart, readSemanticValidationCases,
  type SemanticValidationTreeReader,
} from "./semantic-validation-case-storage.js";
import {
  SEMANTIC_VALIDATION_CASES_PATH, SEMANTIC_VALIDATION_OWNER_STORE_PATH,
  SEMANTIC_VALIDATION_PROFILES_PATH, SEMANTIC_VALIDATION_PROFILE_CELLS,
  SemanticValidationError, parseSemanticValidationCase, parseSemanticValidationProfile,
  parseSemanticValidationOwnerAuthorityStore, semanticValidationSubjectKey,
  type SemanticValidationArm, type SemanticValidationCase, type SemanticValidationCell,
} from "./semantic-validation.js";

export type { SemanticValidationTreeReader };
export type SemanticValidationRulingReader = (tree: SemanticValidationTreeReader) => ReadonlySet<string>;
const refuse = (message: string): never => { throw new SemanticValidationError("SEMANTIC_VALIDATION_OWNER_TRANSITION", message); };

function required(tree: SemanticValidationTreeReader, path: string): string {
  const text = tree(path);
  return text === undefined ? refuse(`missing ${path}`) : text;
}

function treeCases(tree: SemanticValidationTreeReader, historicalBase: boolean) {
  if (!historicalBase) return readSemanticValidationCases(tree).cases;
  const text = required(tree, SEMANTIC_VALIDATION_CASES_PATH);
  const document = JSON.parse(text) as { schemaVersion?: unknown } | null;
  // This decoder is private to the BASE read. Current/candidate reads always require index2.
  if (document?.schemaVersion === 1) return parseSemanticValidationCasePart(document, "historical base cases");
  return readSemanticValidationCases(path => path === SEMANTIC_VALIDATION_CASES_PATH ? text : tree(path)).cases;
}

function presentCases(tree: SemanticValidationTreeReader, historicalBase: boolean): readonly SemanticValidationCase[] {
  const document = JSON.parse(required(tree, SEMANTIC_VALIDATION_PROFILES_PATH));
  if (document === null || Array.isArray(document) || document.schemaVersion !== 1
    || Object.keys(document).sort().join(",") !== "profiles,schemaVersion" || !Array.isArray(document.profiles)) {
    return refuse("invalid profile document");
  }
  const profiles = document.profiles.map(parseSemanticValidationProfile);
  const cases = treeCases(tree, historicalBase).map(parseSemanticValidationCase);
  const byKey = new Map(cases.map(value => [`${value.id}@${value.version}`, value]));
  const present = new Map<string, SemanticValidationCase>();
  for (const profile of profiles) for (const [cellKey, arm] of SEMANTIC_VALIDATION_PROFILE_CELLS) {
    const cell = profile[cellKey] as SemanticValidationCell<SemanticValidationArm>;
    if (cell.disposition !== "present") continue;
    for (const ref of cell.refs) {
      if (ref.kind !== "case") continue;
      const key = `${ref.id}@${ref.version}`, value = byKey.get(key);
      if (value === undefined) return refuse(`present case ${key} is missing`);
      if (value.arm !== arm || semanticValidationSubjectKey(value.subject) !== semanticValidationSubjectKey(profile.subject)) {
        return refuse(`present case ${key} names another subject or arm`);
      }
      if (present.has(key)) return refuse(`present case ${key} is referenced more than once`);
      present.set(key, value);
    }
  }
  return [...present.values()];
}

/** Read complete base/candidate registries before comparing immutable owner rows and admissions. */
export function assertSemanticValidationOwnerTransition(base: SemanticValidationTreeReader, candidate: SemanticValidationTreeReader, rulings: SemanticValidationRulingReader): void {
  let baseCases: readonly SemanticValidationCase[], candidateCases: readonly SemanticValidationCase[];
  try { baseCases = presentCases(base, true); candidateCases = presentCases(candidate, false); }
  catch (error) { return refuse(error instanceof Error ? error.message : "incomplete case/profile registry"); }
  const storeOf = (tree: SemanticValidationTreeReader) => {
    const text = tree(SEMANTIC_VALIDATION_OWNER_STORE_PATH);
    return text === undefined ? undefined : parseSemanticValidationOwnerAuthorityStore(JSON.parse(text));
  };
  const baseStore = storeOf(base), candidateStore = storeOf(candidate);
  const baseRows = new Map((baseStore?.authorities ?? []).map(row => [`${row.id}@${row.version}`, row]));
  const candidateRows = new Map((candidateStore?.authorities ?? []).map(row => [`${row.id}@${row.version}`, row]));
  const owners = (cases: readonly SemanticValidationCase[], rows: typeof baseRows): ReadonlySet<string> => {
    const keys = new Set<string>();
    for (const value of cases) {
      const authority = value.authority;
      const owner = authority.kind === "owner_authored" ? authority
        : authority.kind === "rules_and_proposition" && authority.proposition.kind === "owner_authored" ? authority.proposition : undefined;
      if (owner === undefined) continue;
      const key = `${owner.id}@${owner.version}`, row = rows.get(key);
      if (row === undefined) return refuse(`present case ${value.id} has missing owner authority ${key}`);
      if (row.case.id !== value.id || row.case.version !== value.version
        || semanticValidationSubjectKey(row.subject) !== semanticValidationSubjectKey(value.subject)) {
        return refuse(`owner authority ${key} names another case or subject`);
      }
      keys.add(key);
    }
    return keys;
  };
  owners(baseCases, baseRows);
  for (const [key, row] of baseRows) {
    const next = candidateRows.get(key);
    if (next === undefined) return refuse(`owner authority ${key} was removed`);
    if (evidenceDigest(next) !== evidenceDigest(row)) return refuse(`owner authority ${key} was mutated`);
  }
  const candidateRulings = rulings(candidate);
  for (const [key, row] of candidateRows) if (!candidateRulings.has(row.ruling.slice("ledger:".length))) {
    return refuse(`owner authority ${key} cites ${row.ruling}, which is not an owner-ledger ruling`);
  }
  for (const key of owners(candidateCases, candidateRows)) if (!baseRows.has(key)) {
    return refuse(`owner authority ${key} and the case admitting it arrive in the same change`);
  }
}
