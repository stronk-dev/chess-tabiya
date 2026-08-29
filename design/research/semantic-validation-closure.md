# Semantic validation closure — the manifest validates shapes, not chess semantics

**Question:** Do the 67 semantic-event declarations' `validation` fields bind independent,
executable evidence that each named chess predicate can both fire and refuse?

**Status:** answered `[V]` at 2026-08-26 HEAD and refreshed at 2026-08-29 HEAD. The answer is
**no for 67/67 declarations**.
Some implementations have substantial unit and research coverage, but none of that coverage is
resolved through the manifest's validation identifiers. The manifest therefore proves declaration
shape, not semantic validity.

**Instrument:** `tools/d1711-semantic-validation-closure/`. The five able-to-fail checks run under
the repository's pinned Node 24 and derive the declaration set directly from the runtime export.

## Result

The register creates all 67 `SemanticEventDeclaration` rows by mapping the event projection list.
For every row it manufactures exactly two strings:

- `semantic-event:<projection>:positive`
- `semantic-event:<projection>:hard-negative`

`compileEvidenceManifest` requires only two non-empty string arrays. Its diagnostic says the event
needs *executable* fixtures, but it does not resolve an id, call an emitter or inspect a chess
position. `[V]` (`packages/runtime/src/evidence-catalog.ts:947-965`;
`packages/runtime/src/evidence-contract.ts:558-577`; D1711 harness tests 1–2)

The only all-event test is generated from the same declaration list. It invents one value for each
declared operand, calls `declareEvidence` directly, and checks that the resulting structural object
compiles. Its negative removes whichever operand happens to be first and checks the generic
`EVIDENCE_EVENT_OPERAND_MISSING` diagnostic. It then regenerates the same 134 labels and compares
the two sets. No production emitter is called to decide whether the named relation is true or
false. `[V]` (`packages/runtime/src/semantic-evidence.test.ts:67-103`; harness test 5)

That means a collector could return the opposite chess result while all register validation checks
remain green, provided its output object still contains the declared fields. `[M]` This is the
semantic analogue of the repo's previously measured green-by-construction instruments: the test
and implementation share the assumption that should have been independently falsified.

## The validation ids have no executable referent

Across all TypeScript/Svelte under `packages/`, `apps/` and `tools/`, none of the 134 concrete
validation labels occurs outside the catalogue/generic-census construction. There is no fixture
registry, resolver or test dispatcher keyed by those ids. Exactly two code paths read the arrays:

1. the compiler checks non-empty strings; and
2. the generic census compares regenerated strings.

Neither resolves or executes a fixture. `[V]` (D1711 harness test 2)

This is stronger and narrower than “the collectors are untested.” Outside the generic census,
**66/67** projection ids are now at least named by an executable runtime or disposable research
test; **27/67** are named in runtime/application tests and **66/67** in research tests, with
overlap. The 2026-08-26 census was 54/67 named and 49/67 research-named; later foundation
instruments increased trace coverage without creating a fixture resolver or changing the semantic
validation verdict.
Literal naming is only a lower-bound trace signal, not proof that the test establishes the event's
semantics. `[V]` (D1711 harness test 3)

The remaining **1/67** not named by another executable test is
`rules.structural.event.king_zone`. `[V]` The full set-equal 67-row mapping, including every runtime
and research test path containing each literal id, is emitted by `make semantic-validation-closure`
(D1711 harness test 3). This must not be interpreted as one known-broken detector: literal naming is
still only trace evidence, and all 67 events remain without a manifest-resolved independent
validation case.

## The external-population field overclaims by construction

All 67 declarations carry the identical
`r2-imported-sample@a10a...fa58ec` token. The digest is the retained 108-game/579-decision PGN
**input**, not a per-event result. The corresponding frozen F2 baseline says its manifest contained
33 semantic events. Only **29** current event ids occur in its authored/imported output; **38/67**
current ids do not occur at all. `[V]` (`tools/r2-selection-harness/fixture.json`;
`tools/r2-selection-harness/f2-baseline.json`; D1711 harness test 4)

Four implications are separate:

1. a population digest proves reproducible input bytes, not that a predicate is correct;
2. a zero occurrence cannot supply a positive witness;
3. events added after the 33-event baseline cannot inherit its external-validation claim merely by
   pointing at the same file; and
4. even an observed event needs a result digest joined to its exact predicate/version before the
   observation can serve as a regression authority.

`[M]` Therefore `externalPopulation` is useful provenance but is not a validation certificate. It
must retain both input and result identity and say which event/version was actually evaluated.

## What existing tests genuinely contribute

The repair must preserve rather than discard the strong work already present:

- detector conformance supplies one positive and one hard-negative matcher fixture for all 18 raw
  structural kinds, but explicitly refuses to call those semantic learner events;
- `semantic-evidence.test.ts` has real focused checks after its generic first test for castling
  normalization, independent transition properties, capture class, pawn islands, loose pieces,
  trades, discovered execution, rule events and complete-alternative selection;
- `breadth-semantic.test.ts`, `semantic-tactics.test.ts` and
  `semantic-tactic-sequences.test.ts` exercise many exact/identity-retaining producer paths and
  semantic near-negatives; and
- D872's research suite supplies canonical distinctions, imported prevalence, counterfactual
  boundaries and external Lichess-theme disagreement for selected tactic families.

`[V]` (`design/research/detector-semantic-conformance.md` §§Method–Transition conformance;
the named runtime test files; `design/research/basic-semantic-tactics-stage-0.md` §§6–8)

The defect is that none of these authorities is a checked member of the declaration contract. A
test can be deleted, renamed, stop calling the real emitter, or cease covering a projection while
the manifest continues to advertise the event as validated. `[M]`

## Required contract boundary

Research permits a new validation authority with these properties:

1. **Independent identity.** A validation id resolves through one checked registry to an
   executable case; it is never synthesized from the declaration under test.
2. **Production-emitter execution.** A positive invokes the actual collector/deriver and proves the
   exact projection/version is emitted. A semantic hard negative is a nearby legal position or
   sequence for which that emitter abstains; deleting a payload field remains a separate contract
   shape test.
3. **Total validation profile.** Every event states whether positive, hard negative,
   mirror/orientation, counterfactual, imported-population and external-labelled arms are required,
   present, or inapplicable with a reason. Not every literal state event needs every arm, but silence
   cannot mean either.
4. **Result identity.** Population checks bind predicate/version, input digest, result digest,
   denominator and positive count. A new projection receives no inherited external status.
5. **Set equality and non-vacuity.** Declarations, fixture registry and executed receipts are
   compared in both directions. Each required positive must observe at least one event; each hard
   negative must reach the emitter and observe none. A mutually omitted event fails independently.
6. **Consumer gate.** “Validated” eligibility for a learner module, Review, bot feature, skill or
   longitudinal metric depends on the executed receipt, not the presence of label strings. The raw
   inspector may retain explicitly unvalidated atoms under its separate policy.

`[M]` These requirements do not choose chess truth. They make existing authored, rules-derived,
engine/tablebase and externally labelled authorities executable and prevent the registry from
claiming more than those sources establish.

## Roadmap consequence

This pass does not reopen collector research wholesale and does not authorize implementation.
It inserts one foundation gate before D1710's emitter wiring and Phase 3 module activation:

1. author and independently review a semantic-validation-authority RFC over the existing evidence
   contract;
2. migrate the strongest existing tests into the checked fixture registry without weakening their
   assertions;
3. mark genuinely missing arms as explicit discharges owned by their collector RFC/research wave;
4. run the complete matrix before production admission; then
5. wire D1710's emitters and activate modules only for events whose required profile passes.

`[M]` This ordering avoids putting 67 formally “validated” but semantically unchecked events into
Support, Review, bots, campaign rewards, packs and player-style aggregation—the exact breadth
multiplication the owner asked the foundation to survive.

## Limits

- Literal-id naming is a conservative trace census, not semantic proof; computed families can be
  exercised without repeating their projection id. `[V]`
- This pass did not judge whether every existing chess fixture is correct. It measured whether the
  manifest can prove and retain that judgement. `[V]`
- External Lichess puzzle themes are incomplete labels and cannot be the sole ground truth; D872's
  disagreement posture remains. `[V]` (`basic-semantic-tactics-stage-0.md`)
- No learner UX, module default, pack content or collector implementation changes in this pass.
