# Evidence presentation — fourth fresh independent buildability review

**Date:** 2026-08-30

**Reviewer:** Codex, independent of the third Claude author repair

**Verdict:** **RETURNED.** The component vocabulary, exact-pair adapters, three-checkpoint landing
and law-8 seal remain the right architecture. The repaired author model still lacks seven literal
authorities needed to implement its own post-P population, citations, abstention receipts,
denominator operands and named-structure geometry. No production or protected-design
implementation is authorised.

## Reproduction

`make evidence-presentation-fourth-fresh-review` passes 7/7. The target is a disposable
buildability falsifier outside production verification. The maintained author controls remain
separate; a green author control and a green blocker reproducer answer different questions.

## Blocking findings

### D2348 — checkpoint P has no exact transformed adapter population

`PRESENTATION_ADAPTER_ROWS` is still the 112-row pre-P image: 100 `adapt`, eleven
`repair_projection_operands` and one `remove_visual_binding`. The author plan appends one
`POST_P_PRESENTATION_ADAPTER_ROWS` citation row and calls the resulting 113 rows the post-P
population. It never removes the selection binding or replaces the eleven repair placeholders.
That contradicts the RFC's required post-P image of 112/112 adaptable rows.

Publish one exact transformed post-P population, derived by applying all seven repairs, and make
its set equality—not a preimage plus one append—the authority used by abstention and component
coverage.

### D2349 — the citation derivation emits a different object than `CitationOperand`

The RFC requires `{content:{kind,text,binding}, source:{source,title,locator,licence,url?,revision?}}`.
Both `SOURCE_BOUND_CITATION_DERIVATION.outputFields` and the post-P adapter instead declare a flat
`content,binding,source,title,locator,licence,url,revision` object. The author control asserts the
flat image, so it makes the mismatch green rather than detecting it.

Declare one exact nested output type and compile the operation, parser and adapter against it.
Crossed content/binding and source/metadata shapes must fail at type and runtime boundaries.

### D2350 — the source-attribution “registry” neither versions nor resolves attribution

The RFC calls `SOURCE_ATTRIBUTION_REGISTRY` versioned and says it emits complete attribution.
Its rows contain only a source projection, an artifact/endpoint id, a list of required field names
and an absence label. There is no registry id/version/digest and no exact operation or values for
source, title, locator, licence and revision. An implementer must invent the metadata lookup and
its versioning while implementing the supposedly complete contract.

Publish one registered resource and literal deployment/endpoint metadata resolver, including its
version/digest and absence behavior. Its output must inhabit the nested citation source type.

### D2351 — unhandled source failures become “empty / no witness”

`mapSourceReason` handles eight literals and maps every other registered reason through a default
to `{absence:"empty", learnerReason:"no_witness"}`. That includes invalid/missing artifacts,
budget exhaustion, digest mismatch, inconsistent mate scores, missing evaluations and unequal
instruments. Those are failures or unavailable evidence, not evidence that the requested chess
fact has no witness.

Replace the default with a total typed map over the closed source-reason vocabulary. Adding a
reason without an explicit learner disposition must fail compilation or the set-equality check.

### D2352 — abstention lifecycle accepts arbitrary question prose

Each adapter plan correctly has `questionId` and `questionLabel`, but pending and settled lifecycle
receipts carry only `question: string`. Nothing binds that string to the adapter's registered
question, so a caller may invent learner-facing prose while producing an otherwise valid receipt.

Carry the registered question identity in the lifecycle and derive its label at presentation.
Cross-adapter and arbitrary-string question receipts must fail.

### D2353 — the Explorer row names a denominator component but not its operands

The repaired Explorer target includes `count_with_denominator`, but its adapter retains only
`nodeId`, `result` and `committedMoveSan`. No exact constructor maps `result.moves[].playedCount`
to `numerator`, `result.total` to `denominator`, or names the registered denominator meaning and
candidate grain. The author test proves only that the component id is present.

Publish the pair-local operand constructor, candidate identity, denominator vocabulary and
zero/mismatch refusals. A named component with no constructor is the same registry-only
completion D2163 returned.

### D2354 — named-structure squares have a field name but no geometry operation

The repair says `StructureMatch` gains `squares`, while the live structure authority returns a
boolean match and static metadata contains only name/provenance. The live observation explicitly
emits `squares: []`. `NAMED_STRUCTURE_LABEL_AUTHORITY.witnessField = "squares"` names storage but
does not specify which squares witness compound predicates such as Carlsbad or an IQP.

Define an exact witness-producing operation for each registered structure, derived from the same
predicate tree that establishes the match. The match and witness must be atomic; an empty or
predicate-inconsistent square set must fail.

## Required author return

Repair [[D2348]]–[[D2354]] without weakening the projection seal, typed component boundary,
honest absence or law-8 constraint. Keep the post-P population as one exact authority and add
negative controls at the nested citation, source-reason, question-id, denominator and geometry
seams. [[D1672]] remains an independent owner-tier requirement. Another fresh review is mandatory
before implementation.
