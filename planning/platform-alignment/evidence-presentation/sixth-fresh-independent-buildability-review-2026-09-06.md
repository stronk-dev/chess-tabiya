# Evidence presentation — sixth fresh independent buildability review

**Date:** 2026-09-06

**Reviewer:** Codex, independent of the fifth author repair

**Verdict:** **RETURNED on [[D3035]]–[[D3041]].** The repair preserves the useful fourteen-component
vocabulary, the 112-pair post-P population, complete revision requirement, copy-resistant question
objects, unique candidate UCI and the accumulated author controls. It still does not provide the
authorities its seven repaired seams claim. Three checks validate descriptions of future operations
instead of executing them; two public parsers/issuers accept caller semantics; one canonical identity
is not canonical under the repository authority; and the committed Explorer edge is not parsed.

## D3035 — resource identity bypasses the shared canonical JSON authority

`sourceAttributionRegistryDigest` implements a private recursive serializer. Unlike
`packages/schema/src/drill-pack/digest.ts`'s shared RFC-8785 implementation, it does not reject lone
Unicode surrogates, non-finite numbers or unsupported values. Both a semantic image containing a
lone high surrogate and one containing `NaN` receive normal-looking `sha256:` identities.

The repair must parse the exact semantic image and use the shared fail-closed RFC-8785 serializer.
A resource digest cannot be stronger than the byte authority that created it.

## D3036 — citation parsing is still a prose escape hatch

The RFC closes `CitationOperand.content.kind` to `quoted_passage | authored_summary` and binds text
through `EvidenceFieldBinding`. The executable parser instead accepts any non-empty strings for
`kind`, `binding`, source, licence and revision. A payload labelled `llm_generated_advice` with
`binding: caller-says-so`, an unversioned source and an unknown licence crosses as a complete cited
fact. The author's own positive fixture uses the undeclared `kind: fact`, hiding the mismatch.

The exact content discriminant, structured evidence-field binding, versioned source identity and
registered licence/revision authority must be parsed rather than asserted by non-emptiness.

## D3037 — operation-derived abstention remains a local projection rewrite

`PRESENTATION_ABSTENTION_ROWS` still starts from `projection.abstention.reasons`. Explorer then gets
a presentation-local special case replacing `empty_population` with `no_data_at_band`. The eighth
`MANIFEST_PRESENTATION_REPAIRS` member carries only descriptive strings and no result-reason
authority. The new positive test reads `apps/server/src/corpus.ts` separately and compares the final
row, so it catches later drift but does not make the row consume the operation's exported union.

Every abstaining operation needs one exact exported discriminant authority consumed by both its F1
projection and presentation row. A presentation synonym branch remains the [[D2438]] defect under a
narrower test.

## D3038 — question membership is public issuance, not workflow authority

The WeakSet correctly defeats spread, clone and JSON forgery. But
`registeredPresentationQuestion(adapter,id)` is itself exported and gives any importer the canonical
WeakSet member. `assertRegisteredPresentationQuestion` accepts it with no owning workflow request,
request id or decision stamp. The row's `requestPolicy` is prose data and is never enforced.

Issuance must be private to a lifecycle operation that consumes the owning workflow's sealed request
and decision authority. Non-copyability is retained as a second check, not mistaken for the first.

## D3039 — structure match and witness still have no shared executable operation

The plan exports metadata naming `STRUCTURE_PREDICATES` and
`evaluateNamedStructureWithWitness`, but neither symbol exists in the plan or production.
`packages/runtime/src/structure.ts` still uses private `namedStructureMatches` and emits every named
structure observation with `squares: []`. The author test proves a locally declared two-leaf toy
function, not the declared structure registry or current four structures.

The author model must execute the same exported expression traversal that will replace production,
and mutation of a real expression, FEN or witness must fail. Symbol text is not an operation.

## D3040 — committed Explorer identity is not parsed

Candidate UCI is checked for shape and uniqueness. `committedMoveUci` is compared as an unchecked
string, so `not-a-move` is accepted and every candidate is returned as `committedMove: false`.
Criterion 18's canonical edge join therefore accepts a malformed edge while appearing honestly
unmatched.

The nullable committed edge must pass the same canonical UCI authority before any candidate
comparison. Absence and invalid identity must remain different states.

## D3041 — the eight-operation fence does not inspect its seams

The maintained Checkpoint-P criterion proves eight unique expected ids and 112 adaptable output
rows. It never resolves every `sources` path or checks the declared `before` and `after` images.
Replacing one repair's sources with a nonexistent file and erasing both images satisfies every
generic fence predicate. This cannot prove an atomic catalogue/source/payload predecessor.

Each repair row needs resolved source and operation anchors plus executable preimage and postimage
assertions. The eight-id count remains useful set closure after those checks exist.

## Verification

- `make evidence-presentation-sixth-fresh-review` retains all five author layers: 5 baseline, 6
  second-repair, 7 third-repair, 7 fourth-repair and 6 fifth-repair runtime assertions plus lifecycle
  typecheck.
- The same target passes seven independent fresh-review arms reproducing [[D3035]]–[[D3041]].
- No production, schema, content, API, client, component, module, seat, preset or protected-design
  byte changed.

## Required next action

Return the RFC for one bounded sixth author repair. Reuse the shared canonical identity; close and
parse citations; derive reasons from exact exported operation results; make workflow request
authority the only question issuer; execute the structure expression/witness operation; parse the
committed UCI; and make every P repair prove its source preimage/postimage. Another genuinely fresh
review remains mandatory. [[D1672]] and [[D2401]] continue to block acceptance independently.
