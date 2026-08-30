# Semantic-validation authority — second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/semantic-validation-authority.md` after the D2194–D2197 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make semantic-validation-second-fresh-review` — 3/3 blocker arms
- **Production status:** untouched; validation authority and learner eligibility remain forbidden

The second author repair closes the four earlier returns: the operation map is distributive, value
authority is conjunctive, chess expectations name an authority class and mirror comparison is
non-vacuous. The maintained author contracts pass. Three deeper type/execution contradictions still
leave different implementers free to build incompatible identity, profile and oracle protocols.

## B1 — operation and case identity are double-versioned ([[D2331]])

Every `SemanticValidationOperationId` includes `@1`, then `SemanticValidationOperationRef` pairs it
with `version: 1`. The prescribed case-id example also includes `@1`, while every case carries a
separate version. This conflicts with the shipped evidence convention, where `VersionedEvidenceId`
stores a base id and numeric version separately. Registry keys, receipt serialization, stale-ref
checks and diagnostics can therefore compare either `runtime.semantic.local_edge@1`,
`{id: "runtime.semantic.local_edge@1", version: 1}`, or the repository convention
`{id: "runtime.semantic.local_edge", version: 1}`.

**Required repair:** choose one identity grammar and use it everywhere. Prefer the shipped base-id
plus numeric-version convention. Add compile/runtime negatives for a suffixed id, stale numeric
version and a registry/receipt using the other dialect.

## B2 — population and external `present` cells are uninhabitable ([[D2332]])

`SemanticValidationCell` has one `present` arm containing `SemanticValidationCaseRef[]`. That ref
explicitly excludes `imported_population` and `external_label`, yet the total profile requires both
arms and later gives them separate receipt mechanisms. No type connects those receipts back to a
`present` profile cell. An implementation must either lie with an ordinary case arm, widen the ref,
or invent another unreviewed cell shape.

**Required repair:** make cells distributive by arm. Executable cases, population receipts and
external-disagreement receipts each need an exact versioned ref and parser. Cross a population ref
in a positive cell, an ordinary case in an external cell, stale input/result versions and a receipt
for another event.

## B3 — rules-oracle authority is not executable ([[D2333]])

The rules-oracle arm carries an oracle id plus witness/result SHA-256 strings, but no witness bytes
or resolvable witness reference, no oracle request/result algebra and no rule binding its derived
result to `SemanticValidationExpectation`. The prose says the runner invokes an oracle “over the
case's serialized input and witness,” but the declared object cannot supply that witness. Matching
digest strings can therefore accompany a different expectation without any typed comparison.

**Required repair:** retain or resolve the exact sealed witness, declare a distributive oracle
request/result map and define how its result equals or derives the case expectation. Cross missing,
swapped and stale witnesses; wrong operation grain; result digest paired with another expectation;
and an oracle importing the production predicate.

## Re-review order

1. Normalize identity before writing registries or receipts.
2. Make the six profile arms constructible with exact typed refs.
3. Close the oracle request/result/witness binding.
4. Invert all three review arms while preserving the D2039 and D2194 author contracts.
5. Request a third independent review, then run the ordinary full repository gate.

No semantic validator, generated receipt, eligibility change, source factory, schema, content,
archive or protected-design implementation is authorized by this return.
