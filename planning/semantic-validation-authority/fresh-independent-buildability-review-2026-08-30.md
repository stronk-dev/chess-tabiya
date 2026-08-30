# Semantic-validation authority — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/semantic-validation-authority.md` after the D2039–D2043 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make semantic-validation-fresh-review` — 4/4 blocker arms
- **Production status:** untouched; validation authority and learner eligibility remain forbidden

The author repair correctly pins the population fixture, separates unavailable from completed
empty, makes mirror leaf transforms typed, proves child retention and removes the frozen 67-root
landing count. Four deeper gaps still let the implementer choose fixture semantics or validate a
projection through one route and then accept unverified values through another.

## B1 — the case/operation protocol references three undefined authorities ([[D2194]])

`SemanticValidationCase` depends on `SemanticValidationCaseRef`,
`SemanticValidationOperationRef` and `SemanticValidationOperationInput`; none is defined. There is
no closed operation input/result map tying a versioned operation to edge, path, sequence or complete
alternative input. Prose about those shapes cannot stop a counterfactual case from supplying one
edge, an edge operation from receiving a path, or two operations from interpreting the same object
differently.

**Required repair:** publish one distributive operation map with exact serializable request/result
types, closed ids and constructors/parsers for edge, recorded-path, sequence and complete-
alternative inputs. Make case refs exact event/arm/version identities. Cross every wrong
operation/input pair, incomplete alternative set, path passed as edge and stale case version.

## B2 — a passing projection launders unverified mint routes ([[D2195]])

Eligibility asks only whether the event projection's generated verdict passed. A
`SemanticEvidenceEvent` still carries an ordinary `DeclaredEvidence`, and the current tree has 191
mint routes over 187 projections, including caller-payload and duplicate routes. Validating one
production emitter does not prove that another route minted the same projection from truthful
values. The RFC does not depend on `evidence-value-authority` or require its factory/value receipt
at eligibility.

**Required repair:** bind validation to the registered value-authority factory/route and require
every learner-admitted event instance to carry that verified receipt. Either validate every live
route independently or collapse to the sole projection factory first. Slice A may land as research
authority, but Slice E cannot release consumers before value-route closure.

## B3 — the missing fixture work is assigned to an LLM without grounding ([[D2196]])

The measured matrix still needs 28 positives, 44 semantic negatives and most orientation cases.
The case schema carries no independent oracle, cited rule, owner-authored receipt or provenance;
its expectation is simply authored data. Discharge D4 assigns completion to codex. That asks an LLM
to manufacture the chess truth that the fixture then uses to validate production, contradicting
law 8 and recreating the circular authority at a more polished layer.

**Required repair:** classify case authority explicitly. Pure rule cases need an independent exact
oracle/witness derivation; cited theory/taxonomy cases need a source-bound proposition; otherwise a
human owner must author and sign the judgement. Codex may migrate already-grounded cases and build
the runner, but cannot invent the missing expected chess semantics.

## B4 — zero-event mirror pairs pass vacuously ([[D2197]])

The `mirrors` expectation has no minimum target count and no event-level pairing/multiset rule.
Its completeness law starts at scalar leaves “on both target events”; if both operations emit zero
target events, there are no leaves to miss and the comparison is vacuous. If either emits several
events, nothing says how source and partner events pair before operand paths are compared.

**Required repair:** require a non-empty exact target-event multiset on both sides, transform and
pair events by canonical subject/sign/operand identity, then apply the complete leaf walk within
each pair. Cross zero/zero, zero/nonzero, duplicate, reordered, unmatched and ambiguous pairings.

## Re-review order

1. Close the operation/case protocol and event-level mirror semantics.
2. Bind event validation to value-authority routes.
3. Give every new chess expectation an admissible non-LLM authority.
4. Invert all four arms, preserve D1711/D1713 and the D2039 author contract, then run full
   verification before another independent review.

No semantic validator, generated receipt, eligibility change, source factory, schema, content,
archive or protected-design implementation is authorized by this return.
