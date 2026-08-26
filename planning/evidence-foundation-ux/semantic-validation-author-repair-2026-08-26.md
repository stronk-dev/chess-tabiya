# D1711 author handoff — executable semantic validation authority

## Why this is an author action

The implemented F2 evidence contract is archived and immutable. Its living catalogue now carries
67 semantic declarations, but their 134 positive/hard-negative ids are generated labels with no
fixture resolver. Repairing that meaning changes what `validated` and learner eligibility mean; it
is not a mechanical test addition. Author a new RFC (working title
`semantic-validation-authority`) and take it through independent buildability review before any
implementation.

Authority: `design/research/semantic-validation-closure.md`, [[D1711]], and the existing F1/F2
contract. This handoff does not authorize edits to `design/00`–`06`.

## Contract the RFC must close

1. Replace free validation strings with one independently declared executable fixture registry.
   The event declaration references ids; it does not manufacture them.
2. Separate contract-shape negatives (missing/wrong operands) from semantic hard negatives (legal
   chess inputs that reach the real producer and correctly abstain).
3. Execute the production emitter/deriver for every semantic positive and semantic negative. A
   direct call to `declareEvidence` or `compileSemanticEvidenceEvent` cannot satisfy this arm.
4. Publish a total per-event validation profile for: positive, semantic hard negative,
   mirror/orientation, counterfactual boundary, imported population and external-labelled
   comparison. Each cell is `required`, `present`, or `not_applicable(reason)`; no optional blank.
5. Population receipts retain exact projection/version, predicate implementation identity, input
   digest, result digest, denominator and count. The old R2 digest remains an input authority only.
6. Add a set-equality build gate over declarations, fixture cases and executed receipts, including
   mutually omitted, stale-version, dead-fixture, positive-zero and negative-never-reached
   falsifiers.
7. Compile learner/module eligibility from the passing required profile. Raw inspector access and
   research-only selection remain explicit separate dispositions; lack of semantic validation must
   not erase source facts.
8. Migrate real existing assertions rather than replacing them with generic fixtures. The RFC must
   name the exact source tests/harnesses reused and preserve their stronger mirror,
   identity-retention, counterfactual and disagreement semantics.

## Required able-to-fail fixtures

- a declaration with plausible generated labels but no registered cases fails;
- a registered case that constructs declared evidence directly instead of invoking its production
  emitter fails;
- a positive reaches the emitter but observes zero events and fails;
- a hard negative deletes an operand rather than falsifying the chess predicate and fails;
- a mirror-required family has only one color/orientation and fails;
- a later event points at the old 33-event R2 population token and fails external validation;
- a population's input digest is unchanged but result/predicate digest changes and fails;
- declaration and fixture registries omit the same projection and the closed 67-event authority
  still fails through an independent root inventory;
- one event is fully valid for the inspector but lacks its learner-required profile, so inspector
  succeeds and module admission refuses.

## Mandatory refresh at author checkpoint

Re-run D1711 and quote the live counts. At the current checkpoint they are:

- 67 declarations / 134 generated labels / 0 independent label referents;
- 54 projection ids named by non-generic executable tests, 13 unnamed;
- 27 runtime-named, 49 research-named, with overlap; and
- old R2 baseline: 33-event manifest, 29 current ids observed, 38 current ids absent.

Counts are tripwires, not design constants. The RFC must publish the exact migration matrix, not
copy these totals into a second hand-maintained register.

## Ordering

This RFC precedes D1710 application emitter wiring and Phase 3 module activation. It may be authored
in parallel with provider-source repairs, but its implementation touches the shared evidence
catalogue/compiler/test authority and must serialize through the RFC register. It does not require
pack content edits and must not trigger a content wave.
