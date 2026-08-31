# Module registration — fifth fresh independent buildability review

**Date:** 2026-08-31

**Reviewer:** Codex, independent of Claude's fifth author repair

**Verdict:** **RETURNED on [[D2432]]–[[D2435]].** The fifth repair honestly leaves final timing
and presentation unresolved and no longer relabels one evidence value as another grain. Its new
relation vocabulary still records only broad grains, not the occurrence topology the underlying
chess operations require, and four upstream contracts are described as if their outputs or symbols
already had a shape they do not have.

## D2432 — multi-edge semantics are compiled as same-edge joins

The seven observed tactic projections describe three- to five-edge recorded windows. Their live
fixtures construct three or four consecutive `RecordedMoveAnchor`s and reject broken node/FEN
continuity. The generated requirements instead give every input `relation: "same_edge"`, give the
output `subjectKind: "edge"`, and retain no edge offset, occurrence role, window identity or
ordered anchor set.

That is not enough to construct deflection, attraction, zwischenzug, interference, overload or
either clearance event. A faithful executor would need to ignore the plan and rediscover each
operation's private window contract. Replace the generic relation with exact operation-owned
occurrence operands (including order, horizon and output anchor), or declare the row unavailable
until `recorded-semantic-path` publishes that operation.

## D2433 — the candidate packet is not a generic position/edge evidence pool

The candidate-packet contract returns one `CandidateEventRow` per legal move, keyed by `moveUci`
and `afterFen`; its readings and events describe candidate children. Module registration assigns
81 projections to `candidate_population@1`, including current-position Sight readings, but its
source contract says only `"projection-keyed admitted items"`. Neither source nor requirement
states root versus child, selected candidate versus complete population, or played edge.

This can make requested Sight read hypothetical child positions, or let a post-commit nudge select
an unplayed alternative. Define exact root-position, selected-candidate, committed-edge and
complete-population views with their identity joins. A packet containing a projection is not proof
that it contains the right occurrence for a module moment.

## D2434 — endpoint relations omit operand roles and cardinality

`derived.compare.eval_delta` lists one `live.stockfish.eval` input and labels it
`branch_pair_position_endpoints`; it does not require two occurrences or identify branch A/B.
`derived.grade.move_quality` similarly labels both score families `edge_position_endpoints` without
before/after roles, same-engine/search-limit equality or one-occurrence cardinality. Swapping,
duplicating or selecting both values from one endpoint changes no requirement byte.

An exact projection operation must publish its operand roles, cardinalities and equality joins.
Broad endpoint membership is not an executable derivation contract and can produce a signed delta
from the wrong pair while every current author test stays green.

## D2435 — the five upstream operation contracts name symbols their owners do not declare

The generated source contracts name `collectCandidatePopulation`,
`compileRecordedSemanticPath`, `compileReviewEvidencePacket`, `resolveCatalogueEvidence` and
`requestProviderEvidence`. Those names occur only in the module artifact/generator. The upstream
candidate contract exports a service factory and `request`; Review names `compileReviewEvidence`;
provider exchange names `ProviderExchangeScheduler`; the other two symbols have no owner contract.
The author fixture also still exports the supposedly deleted `AUTHOR_ADDITIONAL_SUBJECT_VIEWS`.

Because all rows are dependency-blocked, placeholder operation names add no executable truth.
Reference exact upstream operation ids/types after those RFCs land, or specify module-owned adapter
operations and their files, inputs and typed results. Delete the obsolete view authority so a later
generator cannot revive the rejected relabel.

## Verification

- `make module-registration-author-contract`: prior author contract remains green.
- `make module-evidence-assembly`: prior assembly requirement remains green.
- `make module-registration-fifth-author-repair`: the named fifth repairs remain green.
- `make module-registration-fifth-fresh-review`: reproduces [[D2432]]–[[D2435]].

No production, schema, API, content, UX or protected-design byte changed. A sixth author repair and
then another fresh independent review are required before acceptance or implementation.
