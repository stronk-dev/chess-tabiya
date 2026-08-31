import assert from "node:assert/strict";

export const subjectKey = (subject) => `${subject.kind}:${subject.projection.id}@${subject.projection.version}`;

const equalSet = (left, right) => left.size === right.size && [...left].every((value) => right.has(value));
const keys = (values) => new Set(values.map(subjectKey));

export function assertValidationPopulation(input) {
  const roots = keys(input.roots);
  for (const [name, population] of [["declarations", input.declarations], ["profiles", input.profiles], ["verdicts", input.verdicts]]) {
    if (!equalSet(roots, keys(population))) throw new TypeError(`SEMANTIC_VALIDATION_ROOT_MISMATCH:${name}`);
  }
  const rows = new Map(input.cases.map((row) => [row.id, row]));
  if (rows.size !== input.cases.length) throw new TypeError("SEMANTIC_VALIDATION_CASE_DUPLICATE");
  const seen = new Set();
  for (const reference of input.presentCaseRefs) {
    const row = rows.get(reference.id);
    if (row === undefined) throw new TypeError("SEMANTIC_VALIDATION_CASE_MISSING");
    if (!roots.has(subjectKey(row.subject))) throw new TypeError("SEMANTIC_VALIDATION_CASE_OUTSIDE_ROOTS");
    if (subjectKey(row.subject) !== subjectKey(reference.subject) || row.arm !== reference.arm) throw new TypeError("SEMANTIC_VALIDATION_CASE_REF_STALE");
    if (seen.has(row.id)) throw new TypeError("SEMANTIC_VALIDATION_CASE_REFERENCED_TWICE");
    seen.add(row.id);
  }
  if (seen.size !== rows.size) throw new TypeError("SEMANTIC_VALIDATION_CASE_UNREFERENCED");
}

export function selectTargetObservations(subject, observations) {
  return observations.filter((observation) => {
    if (observation.kind !== subject.kind) return false;
    const projection = observation.kind === "event" ? observation.item.evidence.projection : observation.item.projection;
    return projection.id === subject.projection.id && projection.version === subject.projection.version;
  });
}

function valueAt(value, path) {
  let current = value;
  for (const segment of path) {
    if (segment === "*" || current === null || typeof current !== "object" || Array.isArray(current)) throw new TypeError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID");
    current = current[segment];
  }
  return current;
}

export function bindNeutralOracle(input) {
  const fact = input.run(input.request);
  if (fact !== null && typeof fact === "object" && "expectation" in fact) throw new TypeError("SEMANTIC_VALIDATION_ORACLE_EXPECTATION_FORBIDDEN");
  if (input.proposition.case.id !== input.case.id || input.proposition.case.version !== input.case.version || subjectKey(input.proposition.subject) !== subjectKey(input.case.subject)) throw new TypeError("SEMANTIC_VALIDATION_PROPOSITION_MISMATCH");
  if (input.proposition.factConstraint.length === 0) throw new TypeError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_EMPTY");
  for (const constraint of input.proposition.factConstraint) if (!Object.is(valueAt(fact, constraint.path), constraint.equals)) throw new TypeError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_UNSATISFIED");
  assert.deepEqual(input.proposition.expectation, input.case.expectation, "SEMANTIC_VALIDATION_PROPOSITION_EXPECTATION_MISMATCH");
  return input.proposition.expectation;
}

function authorityKey(row) { return `${row.id}@${row.version}`; }
export function assertOwnerAuthorityStore(store, ownerRulings) {
  if (store.schemaVersion !== 1 || !Array.isArray(store.authorities)) throw new TypeError("SEMANTIC_VALIDATION_OWNER_STORE_INVALID");
  const ordered = store.authorities.map(authorityKey);
  if (new Set(ordered).size !== ordered.length || ordered.join("|") !== [...ordered].sort().join("|")) throw new TypeError("SEMANTIC_VALIDATION_OWNER_STORE_ORDER");
  for (const row of store.authorities) {
    if (row.version !== 1 || /@[0-9]+$/u.test(row.id) || row.authoredBy !== "OWNER" || !/^ledger:D[0-9]+$/u.test(row.ruling) || !ownerRulings.has(row.ruling)) throw new TypeError("SEMANTIC_VALIDATION_OWNER_AUTHORITY_INVALID");
  }
}
export function assertOwnerAuthorityTransition(before, after, admittedRefs, ownerRulings) {
  assertOwnerAuthorityStore(before, ownerRulings);
  assertOwnerAuthorityStore(after, ownerRulings);
  for (let index = 0; index < before.authorities.length; index += 1) assert.deepEqual(after.authorities[index], before.authorities[index], "SEMANTIC_VALIDATION_OWNER_AUTHORITY_MUTATED");
  const introduced = new Set(after.authorities.slice(before.authorities.length).map(authorityKey));
  if (admittedRefs.some((ref) => introduced.has(`${ref.id}@${ref.version}`))) throw new TypeError("SEMANTIC_VALIDATION_OWNER_AUTHORITY_SAME_COMMIT");
}
