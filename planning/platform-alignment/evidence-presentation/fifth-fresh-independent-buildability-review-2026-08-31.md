# Evidence presentation — fifth fresh independent buildability review

**Date:** 2026-08-31

**Reviewer:** Codex, independent of Claude's fourth author repair

**Verdict:** **RETURNED on [[D2436]]–[[D2441]].** The repair now has one post-P adapter
population and useful typed component boundaries. Its new source, question, absence, structure and
Explorer authorities are not yet the authorities the RFC claims: four are self-sealed local
copies, one accepts an explicitly forbidden incomplete operand, and one identifies moves by two
different keys.

## D2436 — the attribution digest does not seal the resource

The author control hashes only `SOURCE_ATTRIBUTION_REGISTRY`, then stores that value on
`SOURCE_ATTRIBUTION_REGISTRY_RESOURCE`. Resource id, version, resolver source/symbol and
`missingReceiptField` are outside the digest. Changing the resolver semantics therefore preserves
the advertised digest and the citation derivation's registry reference.

Define one canonical digest image containing every semantic resource field except the digest
itself. The shared-resource checker must recompute that image rather than compare two copied digest
strings.

## D2437 — citation parsing admits missing revision metadata

The RFC says incomplete licence or revision metadata yields `source_attribution_absent`.
`CitationOperand` nevertheless makes `revision` optional and `parseCitationOperand` accepts both a
missing revision and `revision: ""`. That lets an unpinned moving source cross the exact parser as
a complete citation.

Make resolved revision metadata non-empty in the constructed operand, or publish an explicit
immutable-source convention whose value is itself the revision. The absence arm must be tested at
the parser/derivation boundary.

## D2438 — source-reason totality is local, not upstream

The apparent totality check compares `PRESENTATION_SOURCE_REASON_LABELS` with
`PRESENTATION_SOURCE_REASON_DISPOSITIONS`: two declarations in the same author file. Per-adapter
maps then union the projection reasons with broad family guesses. For example the Explorer
projection declares `source_unavailable | empty_population`, but its presentation row also claims
`no_witness | below_floor | provider_unavailable` without an owning Explorer result arm.

Compile exact reason sets from each owning operation's discriminated result plus its manifest
projection declaration. Missing and extra reasons must both fail; a local vocabulary cannot prove
that an upstream result is handled.

## D2439 — registered question authority survives object spread

`registeredPresentationQuestion` returns a frozen plain object with an enumerable symbol brand.
Object spread copies symbol properties, so `{...question, label: "Play the engine move."}` retains
the brand while replacing learner-visible prose. No lifecycle admission assertion checks origin or
membership.

Use opaque runtime membership or a private constructor paired with an admission assertion.
Spread, structured clone and deserialization must all lose authority, and lifecycle construction
must reject them.

## D2440 — structure witnesses remain a second static table

Production's structure expressions are local to `namedStructureMatches`, which returns a boolean;
`structuralReading` still emits every named structure with `squares: []`. The author plan separately
hard-codes four predicate ids, leaf ids and square lists. Its positive test checks only that those
strings are non-empty, never that the production expression was evaluated or that its witness
matches the supplied FEN.

Export one registered expression authority and make the same traversal return the match and its
positive occupied `pieceOnSquare` witnesses atomically. Mutation of the expression, FEN or witness
must make the control fail. This is the exact second-table shape [[D2354]] required the repair to
remove.

## D2441 — Explorer candidate identity is inconsistent

`constructExplorerCountOperands` rejects only duplicate `(SAN,UCI)` pairs and identifies the
committed move by SAN. It therefore accepts two rows with the same UCI and different SAN strings,
emits both as candidate-grained operands, and can mark one as committed solely because its display
string matches.

Use canonical UCI as the unique candidate/run-edge identity and retain SAN as presentation data.
The source parser or constructor must reject duplicate UCI rows and require the committed edge's
same canonical identity.

## Verification

- `make evidence-presentation-author-contract`: prior exact-adapter author contract remains green.
- `make evidence-presentation-fourth-author-repair`: the seven claimed repair arms remain green.
- `make evidence-presentation-fifth-fresh-review`: reproduces [[D2436]]–[[D2441]] 6/6.

No production, schema, API, content, UX or protected-design byte changed. A fifth author repair and
another fresh independent review are required before acceptance or implementation. [[D1672]] and
[[D2401]] remain independent blockers.
