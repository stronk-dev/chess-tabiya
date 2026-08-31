# Semantic-validation authority second-return author repair — 2026-08-31

## Verdict

Author-repaired [[D2331]]–[[D2333]]. The RFC remains draft; production validation and learner
eligibility remain forbidden until a third fresh independent review accepts the amended contract.

## Repair

- Operation, case, population, external and oracle identities use a base id and separate numeric
  version exactly once. Suffixed ids, stale versions and mixed-dialect registry/receipt rows fail.
- `SemanticValidationCell<A>` selects a same-event reference by arm: executable case, population
  receipt or external-disagreement receipt. Input/dataset and result versions remain independently
  checked.
- Rules-oracle authority now resolves a sealed same-case/same-event witness containing the exact
  typed request. A closed oracle operation computes a typed fact plus expectation; that expectation
  must be canonical-byte-equal to the case expectation.
- Oracle import closure excludes the production semantic operation, predicate helper, case
  registry/expectation bytes and every event constructor. Witness and result digests are derived by
  the runner rather than supplied as authority.

## Executable evidence

`make semantic-validation-third-author-repair` passes 3/3. It rejects suffixed/stale identity,
cross-arm and cross-event receipt refs, swapped witnesses, mismatched computed expectations and an
oracle import that reaches the production semantic collector.

The maintained D2194 positive contract was mechanically rebased from suffixed operation ids to the
new base ids without changing its eight-operation grain matrix or any negative. It continues to
cross edge/path/sequence/complete-alternative mismatches under the single-version grammar.

The historical `make semantic-validation-second-fresh-review` is expected to turn red after the
repair; it reproduces the old document's defects and is not the acceptance gate for new semantics.

## Boundary

No production runtime, server, web, schema, content, archive or protected-design byte changed.
Next action: third fresh independent buildability review.
