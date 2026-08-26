# Declared conventions — identity, provenance closure and disclosure

**Question:** Can every fact whose truth depends on a Tabiya convention identify that convention
through collection, derivation, rendering and an external voice provider, and can a semantic change
be forced onto a new version?

**Status:** answered negatively `[V]` at 2026-08-26 HEAD. The compiled manifest contains 42
projections labelled `declared_convention`, but only 10 carry a machine-readable convention operand.
Sixteen more name a version-like convention only inside prose and sixteen do neither. More
fundamentally, eighteen convention-dependent projections carry another scalar grounding; twelve are
source/sibling projections and six are derived compositions. The current compiler both accepts an
in-place convention meaning rewrite and rejects the truthful convention grounding for a
single-grounding derivation. A convention-provenance closure is required before these facts can be
called source-complete or safely exposed to modules/providers.

**Instrument:** `tools/d1722-convention-identity-harness/`. Its seven tests derive the live
population from `PRIMARY_EVIDENCE_MANIFEST`, pin the counts, retain the backward-pawn and
king-opposition falsifiers, and exercise both compiler failure modes. No production byte changes.

## Three different identities

The current contract conflates three objects:

1. A **projection identity** (`rules.structural.event.backward_pawn@1`) says which payload shape was
   admitted. Every declared evidence item has this. `[V]`
   (`packages/runtime/src/evidence-contract.ts:207-232`)
2. A **convention identity** says which exact threshold, ordering, board clone, material scale or
   chess definition made the payload true. Only some payloads carry this as `conventionId`,
   `*ConventionId` or `passConvention`. `[V]`
   (`packages/runtime/src/evidence-source-adapters.ts:38-148`)
3. A **disclosure** is the bounded, human-readable explanation a module may show or give a voice
   provider. A rendered item carries the declared payload and renderer-produced sentences, not the
   manifest declaration or a convention registry. `[V]`
   (`packages/runtime/src/evidence-contract.ts:224-233,445-457`;
   `apps/server/src/external-voice.ts:27-43`)

A projection version can locate a convention only if its declaration actually identifies and pins
that convention. The two source falsifiers do not: both structural events say only
“signed before/after relation for structural family …”, and their exact adapters retain no
convention operand. `[V]` (`packages/runtime/src/evidence-catalog.ts:199-211`;
`packages/runtime/src/evidence-source-adapters.ts:231-239`)

## Labelled population

| Manifest-visible class | Projections | What it establishes |
|---|---:|---|
| Top-level machine-readable convention operand | 10 | The admitted payload can name a convention value. |
| No operand; version-like convention token in semantics/limitations | 16 | A human or registry reader can locate prose, but the payload/provider request cannot read it as typed authority. |
| Neither | 16 | The projection version and prose description are the only available identity; several are complete product operations, while the structural falsifiers are not. |
| **Labelled `declared_convention`** | **42** | The manifest's own declared population, not the true dependency closure. |

`[V]` D1722 manifest census. The ten operand-bearing rows are legal exchange, king-zone reading,
piece-destination reading, candidate majority, development, space, threat, back-rank, trapped-piece
and defender-exposure. “No operand” is not automatically “bad chess”: for example immediate
capture/recapture and deepest opening match are fully deterministic product operations. The defect
is that the contract has no machine-checkable distinction between such locally pinned operations
and a generic family label whose definition lives elsewhere. `[M]`

Twenty-seven of the 42 projections already have at least one compiled consumer. Only two currently
reach an external voice consumer—`derived.story.last_level@1` and `derived.story.title@1`—but the
planned Support, Review, theory and bot modules explicitly widen this reach. Fixing the provenance
boundary before activation is cheaper than adding per-renderer explanations after every module
binds. `[V]` (D1722 binding census; `packages/runtime/src/evidence-catalog.ts:895-900`)

## The manifest undercounts its own convention dependency

The 42-row census trusts the scalar `grounding` field. A second pass starts from explicit convention
operands/prose, same-producer family siblings and transitive derivation inputs. It finds eighteen
convention-dependent rows with another grounding: `[V]` (D1722 closure census)

- **Twelve source/sibling rows:** backward-pawn, king-opposition, pawn-safe-square and outpost
  predicate/reading pairs; defender-duty reading plus removal/relocation; and the bounded mate proof.
- **Six derived rows:** compare structure delta, move-quality grade, material role reading/event,
  harassment pressure and observed square clearance.

This set is a review set, not a claim that all eighteen should replace their primary grounding with
one scalar value. Some facts genuinely combine rule, recorded-run, search and product-convention
authority. That is precisely the finding: one `grounding` enum cannot retain a multi-source semantic
closure. `[M]`

Two examples prove the issue is structural rather than copy drift:

- `backward_pawn` and `king_opposition` predicates/readings are `position_rules/exact`, while their
  same-family signed events are `declared_convention/convention`. The same definition is therefore
  exact or conventional depending on which projection wrapper emitted it. `[V]`
  (`packages/runtime/src/evidence-catalog.ts:199-251`)
- `square_clearance_observed` explicitly uses `observed-window@1`, yet its one input is a recorded
  move. The archived F1 rule requires a derived row with one grounding to repeat that grounding, so
  changing it to truthful `declared_convention/convention` raises
  `EVIDENCE_DERIVATION_WIDENS`. `[V]`
  (`rfc/archive/evidence-contract-manifest.md:205-220`;
  `packages/runtime/src/evidence-catalog.ts:526-533`; D1722 negative fixture)

The current compiler also accepts changing `rules.structural.event.backward_pawn@1` to arbitrary
new non-empty semantics without incrementing either projection or convention version. It validates
that semantics is non-empty, not that an existing identity retained its meaning. `[V]`
(`packages/runtime/src/evidence-contract.ts:485-500`; D1722 mutation fixture)

## Why this gates the product rather than the inspector

- **Support and hints:** “backward pawn” or “you avoided a loose piece” is not grounded merely
  because a family string exists. The module needs the exact source convention, subject and sign,
  then chooses whether to explain it. `[M]`
- **Review:** old and new conventions must remain distinguishable across stored/imported evidence;
  otherwise a re-run silently rewrites history. D1717's 29 blocked opposition observations are the
  concrete migration case. `[V]` (`design/research/king-opposition-semantic-boundary.md`)
- **Drill packs:** authored predicates cannot safely migrate when the evidence projection has no
  named convention version. Eight opposition leaves already require deliberate v1/v2 treatment.
  `[V]` (`planning/evidence-foundation-ux/king-opposition-author-repair-2026-08-26.md`)
- **Bots and player models:** a feature vector must retain the convention closure of every candidate
  component. A vector that says only `candidate_feature_vector@1` cannot later explain which loose,
  safety or space definition drove a policy decision. `[M]`
- **LLM rendering:** the external request contains projection reference, payload and approved
  sentences; it does not contain the manifest semantics. The LLM may paraphrase an admitted
  disclosure, but cannot recover a definition that no renderer supplied. `[V]`
  (`apps/server/src/external-voice.ts:27-43`)

## Required successor contract

`[M]` The repair should add a compiled semantic-provenance layer, not spray definition prose into
every payload:

1. A closed `ConventionDeclaration` registry owns a literal `{id, version}`, exact definition,
   limitations and authority/citation basis. Duplicate or missing refs fail compilation.
2. Every projection declares **direct convention refs** separately from its primary grounding.
   Payload `conventionId` remains required only when different instances of one projection may use
   different conventions; a fixed projection-level convention need not be duplicated in every
   payload.
3. The compiler derives a **transitive convention closure** for every derivation path. A derived
   projection may add a declared composition convention, but cannot omit an input convention or
   claim a closure that no path supplies. Alternative paths retain path-specific closures.
4. `DeclaredEvidence` remains sealed by producer/projection. Admitted/rendered views attach the
   compiler-resolved convention refs and registered disclosure—not arbitrary caller prose—so
   deterministic UX and the external provider share one authority.
5. Changing a convention definition requires a new convention version. Changing which convention
   makes a projection true, or changing its truth set, requires a new projection version and
   explicit downstream migration. A digest receipt may detect bytes changed; it cannot authorize an
   in-place semantic rewrite.
6. Ordinary UX receives module-composed wording and an optional “How this was detected” disclosure.
   The Advanced inspector may show raw projection/convention ids. This repairs grounding without
   recreating the raw evidence dump the owner rejected.

## Able-to-fail acceptance arms

- A `declared_convention` source with no direct convention ref fails.
- A position-rules source whose emitted truth depends on a convention ref fails closure review;
  the backward/opposition predicate/event mismatch is the permanent fixture.
- A derived single-grounding operation may add a declared composition convention; omitting it or an
  input convention fails. `square_clearance_observed` is the positive fixture.
- A derived alternative path retains the exact convention closure for the path actually used.
- Rewriting a registered convention definition at the same id/version fails independently of any
  manually refreshed status receipt.
- A rendered/provider item for a convention fact contains the exact registered ref and approved
  disclosure; an unregistered sentence or stripped convention closure fails the existing seal.
- Old opposition v1 evidence remains readable but cannot satisfy v2 validation, pack capability,
  avoidance or learner-module eligibility.
- The compiled registry is set-equal to convention constants/adapters and the 42+18 census is
  replaced by a total closure report with zero unresolved rows.

## Limits

- The heuristic 18-row review set intentionally over-approximates mixed-source dependencies; the
  successor author must classify each row, not bulk-relabel it.
- This pass does not decide the backward-pawn successor definition; it proves the current definition
  cannot be identified or migrated safely. D1717 separately decides opposition v2.
- It does not authorize an RFC amendment or production change. F1, D1711, semantic-selection,
  candidate-packet and evidence-presentation authors must reconcile one shared contract first.
