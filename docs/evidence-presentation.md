# Evidence presentation

`rfc/evidence-presentation.md` Checkpoint A (Review-compiler slice). Runtime:
`packages/runtime/src/presentation-contract.ts`; client renderer:
`apps/web/src/lib/evidence/PresentedEvidence.svelte`.

## Components

`COMPONENT_DECLARATIONS` declares the fourteen closed components (`distribution`, `outcome_split`,
`magnitude`, `magnitude_trail`, `square_set`, `move_path`, `relation_overlay`,
`count_with_denominator`, `citation`, `enum_state`, `claim`, `fact_statement`, `abstention`,
`structured_document`), each with its renders sentence, operand type, convention obligation, empty
behaviour, forms, equivalent-sentence renderer and theme tokens. This landing ships runtime parsers
and renderers for `magnitude`, `fact_statement`, `abstention`, `claim`, `citation` and
`enum_state`; the others are declared only (`checkpointA: "declared_only"`).

## The sealed path

```text
ConsumerEvidenceView → exact consumer × projection adapter → process-sealed PresentedEvidenceItem
  → presentation.receipt@1 (closed, canonical digest) → parsePresentationReceipt → client-local seal
  → presentedSentence / PresentedEvidence.svelte
```

`presentEvidenceItems(view)` runs the exact adapter from `PRESENTATION_ADAPTERS` for every admitted
item (a missing adapter throws; `derived.story.rank@1` is the one declared selection-only binding)
and seals each item to its admitted evidence. `serializePresentedEvidence` accepts only
process-sealed, owner-bound items. `parsePresentationReceipt` refuses unknown keys, unregistered
adapter tuples, component swaps, operand mutations and digest mismatches, then seals new client
items. The sentence of every component is recomputed from its operand; `fact_statement` text is
re-rendered from its retained operands and byte-checked. Every text passes `assertPresentationText`
(`PRESENTATION_RAW_ID` on id- and digest-shaped tokens); `enum_state` values must belong to their
total vocabulary.

Numbers travel with their convention: a `magnitude` requires a `ConventionReceipt` derived from the
same delivery (engine, bound, request/response digests). Abstentions are issued only by the sealed
operation that asked the question (the Review packet: `presentReviewFamilyAbstentions`), carry the
packet's decision stamp and invocation id, distinguish `pending` from settled
`withheld | unavailable | failed | empty`, and render with `data-abstention`. A citation's text is
read from the exact retained field of one sealed evidence value and bound by its value digest.

## Adapters at this landing

- `review.story@1`: the four pivotal markers, shape firing, consequence, imported result and endgame
  classification (`fact_statement`), `derived.review.eval_delta@1` (`magnitude`),
  `derived.review.mate_transition@1`, `derived.story.last_level@1` and `derived.story.title@1`
  (`fact_statement`).
- `module.review_map@1`: `derived.review.eval_point@1` and `eval_delta@1` (`magnitude`),
  `mate_transition@1` and `wdl_point@1`, `derived.grade.move_quality@1` and the eleven
  recorded-path v2 events (`fact_statement` with the literal `RECORDED_RELATION_LABELS`).
- `guidance.authored_claim@1 × pack.authored.claim_delivery@1` (`claim`), which the existing claim
  seat now renders.
