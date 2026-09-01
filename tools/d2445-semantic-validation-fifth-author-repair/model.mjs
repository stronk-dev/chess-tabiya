import assert from "node:assert/strict";

export const subjectKey = (subject) =>
  `${subject.kind}:${subject.projection.id}@${subject.projection.version}`;

const canonical = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
};

const uniquePopulation = (name, rows) => {
  const seen = new Set();
  for (const row of rows) {
    const key = subjectKey(row);
    if (seen.has(key)) throw new TypeError(`SEMANTIC_VALIDATION_SUBJECT_DUPLICATE:${name}:${key}`);
    seen.add(key);
  }
  return seen;
};

const equalSet = (left, right) =>
  left.size === right.size && [...left].every((value) => right.has(value));

export function assertValidationPopulation(input) {
  const roots = uniquePopulation("roots", input.roots);
  for (const [name, rows] of [
    ["declarations", input.declarations],
    ["profiles", input.profiles],
    ["verdicts", input.verdicts],
  ]) {
    const population = uniquePopulation(name, rows);
    if (!equalSet(roots, population)) {
      throw new TypeError(`SEMANTIC_VALIDATION_ROOT_MISMATCH:${name}`);
    }
  }
  return [...roots].sort();
}

const valueAt = (value, path) => {
  let current = value;
  for (const segment of path) {
    if (segment === "*" || current === null || typeof current !== "object" || Array.isArray(current)) {
      throw new TypeError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID");
    }
    if (!Object.hasOwn(current, segment)) throw new TypeError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID");
    current = current[segment];
  }
  return current;
};

export function assertFactConstraint(fact, constraint) {
  const actual = valueAt(fact, constraint.path);
  const expected = constraint.equals;
  if (constraint.comparison === "scalar") {
    if ((actual !== null && typeof actual === "object") || (expected !== null && typeof expected === "object")) {
      throw new TypeError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID");
    }
    if (!Object.is(actual, expected)) throw new TypeError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_UNSATISFIED");
    return;
  }
  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    throw new TypeError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID");
  }
  const left = actual.map(canonical);
  const right = expected.map(canonical);
  if (constraint.comparison === "canonical_multiset") {
    left.sort();
    right.sort();
  } else if (constraint.comparison !== "ordered") {
    throw new TypeError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID");
  }
  if (canonical(left) !== canonical(right)) {
    throw new TypeError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_UNSATISFIED");
  }
}

export function resolveProposition(ref, stores) {
  let proposition;
  if (ref.kind === "existing_assertion") proposition = stores.existing.get(ref.matrixRow);
  else if (ref.kind === "cited_proposition") proposition = stores.cited.get(ref.propositionSha256);
  else if (ref.kind === "owner_authored") proposition = stores.owner.get(`${ref.id}@${ref.version}`);
  else throw new TypeError("SEMANTIC_VALIDATION_PROPOSITION_REF_INVALID");
  if (proposition === undefined) throw new TypeError("SEMANTIC_VALIDATION_PROPOSITION_UNRESOLVED");
  for (const key of ["subject", "case", "factConstraint", "factConstraintSha256", "expectation"]) {
    if (!Object.hasOwn(proposition, key)) throw new TypeError(`SEMANTIC_VALIDATION_PROPOSITION_INCOMPLETE:${key}`);
  }
  return { kind: ref.kind, ref, proposition };
}

const authorityKey = (row) => `${row.id}@${row.version}`;
const ownerRefsAdmitted = (snapshot) => {
  const cases = new Map(snapshot.cases.map((row) => [`${row.id}@${row.version}`, row]));
  const admitted = new Set();
  for (const profile of snapshot.profiles) {
    for (const cell of Object.values(profile.cells)) {
      if (cell.state !== "present" || cell.ref.kind !== "case") continue;
      const row = cases.get(`${cell.ref.id}@${cell.ref.version}`);
      if (row === undefined) throw new TypeError("SEMANTIC_VALIDATION_CASE_MISSING");
      if (row.authority.kind === "owner_authored") admitted.add(authorityKey(row.authority));
    }
  }
  return admitted;
};

const assertOwnerStore = (store, workState) => {
  if (store.schemaVersion !== 1 || !Array.isArray(store.authorities)) {
    throw new TypeError("SEMANTIC_VALIDATION_OWNER_STORE_INVALID");
  }
  const keys = store.authorities.map(authorityKey);
  if (new Set(keys).size !== keys.length || canonical(keys) !== canonical([...keys].sort())) {
    throw new TypeError("SEMANTIC_VALIDATION_OWNER_STORE_ORDER");
  }
  for (const row of store.authorities) {
    const ruling = workState.get(row.ruling);
    if (row.version !== 1 || /@[0-9]+$/u.test(row.id) || row.authoredBy !== "OWNER" || ruling?.rulingKind !== "owner-ledger") {
      throw new TypeError("SEMANTIC_VALIDATION_OWNER_AUTHORITY_INVALID");
    }
  }
};

export function assertOwnerAuthorityRepositoryTransition(base, candidate) {
  assertOwnerStore(base.ownerStore, base.workState);
  assertOwnerStore(candidate.ownerStore, candidate.workState);
  for (let index = 0; index < base.ownerStore.authorities.length; index += 1) {
    assert.deepEqual(candidate.ownerStore.authorities[index], base.ownerStore.authorities[index], "SEMANTIC_VALIDATION_OWNER_AUTHORITY_MUTATED");
  }
  const baseKeys = new Set(base.ownerStore.authorities.map(authorityKey));
  const introduced = new Set(candidate.ownerStore.authorities.map(authorityKey).filter((key) => !baseKeys.has(key)));
  const baseAdmitted = ownerRefsAdmitted(base);
  const candidateAdmitted = ownerRefsAdmitted(candidate);
  for (const key of candidateAdmitted) {
    if (introduced.has(key) || (!baseAdmitted.has(key) && !baseKeys.has(key))) {
      throw new TypeError("SEMANTIC_VALIDATION_OWNER_AUTHORITY_SAME_COMMIT");
    }
  }
}
