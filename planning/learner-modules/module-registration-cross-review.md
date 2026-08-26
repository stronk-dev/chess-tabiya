# Module-registration independent cross-review

**Date:** 2026-08-26

**RFC:** `rfc/module-registration.md`

**Verdict:** return to author before acceptance

**Scope:** buildability and end-to-end closure; no production or protected-design edits

The draft correctly finds that module ids are already spent by presets and campaign while no
production module registry exists. It also correctly routes the phantom classifier projection to
`awaiting`, derives session ceilings from the preset table, preserves existing surfaces instead
of deleting them, and makes relation overlays consume typed operands rather than recomputing chess
in Svelte. Seven remaining findings prevent an implementer from producing the promised feature
without choosing semantics or inventing a transport.

## R1 — `AnswerDistance` is not the monotone chain the RFC claims (D1585)

Section 2.3(a) says the order is the shipped `AnswerDistance` union's declaration order, then
prints a different order. The source is:

`fact | pattern | threat | theory | evaluation | principle | plan | candidate_moves |
ranked_moves | move | principal_variation`

The table puts `principle` and `plan` below `theory`, then puts `evaluation` above that group. A
literal prefix of the shipped order cannot do both. More importantly, theory/plan evidence and an
engine evaluation are not naturally ordered disclosures: a theory-only module must admit cited
principle/plan bytes while refusing evaluation, and Review may admit evaluation without thereby
requesting plans. The compiler needs explicit allowed-answer downsets (or a declared partial
order), not a false total order derived from union spelling. A4 must include crossed negatives:
`theory` refuses `evaluation`, `evaluation` refuses `theory|principle|plan`, and
`principal_variation` admits the intended union only if that is explicitly ruled.

## R2 — explorer operand scoping retains the candidate moves (D1586)

Section 2.3(c) claims `operands: ["nodeId","result"]` turns
`human.explorer.population@1` into book-presence context and removes its `candidate_moves`
content. It does not. `CorpusPage.result` contains `moves[]` with SAN, UCI, counts, shares and WDL;
the entry removes only `committedMoveSan`. Projection-level `answerContent` also remains
`["fact","candidate_moves"]`; there is no mapping from an operand subset to a narrower answer
image.

The honest repair is a derived, registered population-summary projection whose payload omits
`moves[]`, with literal derivation input and a renderer carrying `CORPUS_GUARD`; alternatively the
breadcrumb must refuse this family. Merely adding an `operands` field cannot prove the claimed
narrowing. A negative fixture must place a sentinel SAN/UCI only inside `result.moves[]` and prove
it reaches neither the module packet nor its rendered bytes.

**2026-08-26 source-contract correction:** the summary's literal input is the node-free
`human.explorer.position_page@1` specified by
`design/research/explorer-source-contract-closure.md`, not the relabellable legacy
`human.explorer.population@1`. Node/move occurrence is a separate exact join. This does not change
R2's required move-sentinel negative; it makes the input authority truthful.

## R3 — reduction cannot feed the sealed renderer (D1587)

Section 2.5 step 2 returns `ModuleReductionResult.facts`. Step 3 calls
`renderEvidenceItems(view', ...)`, but no `view'` exists. `renderEvidenceItems` accepts only a
branded `ConsumerEvidenceView`; the brand can be constructed only by `evidenceForConsumer`.
Passing the original view would render facts that dedup, novelty or the backstop dropped. Forging a
new object correctly fails `EVIDENCE_GENERIC_BYPASS`.

Specify one authority-preserving bridge: normally re-run `evidenceForConsumer` over
`result.facts.map(f => f.evidence)` (which keeps object identity and manifest admission), or add a
private narrowing primitive that accepts only a subset of an already branded view. The criterion
must put a sentinel solely in a dropped fact and prove it is absent from deterministic output,
provider input and `voiceCheck`'s allow-list.

## R4 — the server-to-client delivery has no named operation (D1588)

The RFC says packets ride “the existing run/evidence response” as a `modules` property, but the
tree has no generic run-evidence operation. Human split and corpus are separate endpoints; voice
assembles an evidence packet inside its own route; run mutations return other shapes. No route,
service method, response type, client API method, invalidation rule or per-timing invocation is
named. `apps/server/src/module-packets.ts` can therefore be perfectly implemented and remain dead.

The amendment must name the production operation(s) for pre-commit, at-commit, post-commit,
checkpoint and Review; the exact server call site that builds declared evidence; the closed JSON
wire type (without claiming an F1 process-local brand crosses JSON); the client parser/store; and
the component invocation. A closure test must start at a real route and end at an occupied seat,
with provider-off and honest-empty arms.

## R5 — the sole match affordance excludes the participant (D1589)

The session table admits only `rules_floor` in `match`, while the role rule gives modules 1–9 only
`learner|host`. A seated match participant is neither, even though `permittedAssistance` grants
participants sight-level board lighting and the accessible input controller is their way to make
a legal move. The resulting intersection can remove the only module the match context permits.

`rules_floor` must include `participant` (or role mapping must explicitly map the seated player to
`learner`, which current `EvidenceRole` bytes do not). Add a match fixture for both seats proving
legal destinations and the semantic grid remain present while every chess-guidance module stays
absent.

## R6 — Keep-Me-Safe has no common staging protocol across the five input modes (D1590)

The draft correctly observes that `Chessboard.svelte` commits immediately and that no staged-move
warning exists. It then names “a staged-move state” without defining the state transition or the
component handshake. The accepted board controller has five input modes—click, drag, touch,
keyboard grid and SAN/UCI text—and promotion already pauses in its own shared state. A pointer-only
interceptor would satisfy current A7 and fail the owner's touch/keyboard requirement.

Specify the controller-level state machine: candidate move produced once by the shared controller;
promotion resolved before evidence lookup; bypass when the module is not effective or its source
abstains; `revise` restores the exact input/focus state; `confirm` commits the exact staged UCI once;
server failure is stated and never silently treated as safe; a newer gesture invalidates the old
response. Replace A7's single unspecified fixture with a 5-mode × risk/empty × confirm/revise
matrix and retain the board-edge invariant.

## R7 — the sight-ceiling argument names rows the table does not accept (D1591)

Section 0.2 C6 says three sight rows declare `pattern`: `rook_on_seventh`, `space`, and
`pawn_connectivity`. Section 1.3 does not admit the latter two to sight. Its 22 rows are 17 members
of `STRUCTURAL_FEATURE_KINDS` (minus `pawn_count`), two castling readings, rook-on-seventh, square
control and pawn contacts. `space` and `pawn_connectivity` are separate projections, not members of
that feature list.

The `pattern` ceiling may still be required by `rook_on_seventh` and any admitted structural rows
whose catalogue answer image includes pattern, but the proof and count must be re-derived from the
literal accepted set. Add an assertion computing the union of accepted projections'
`answerContent` rather than naming three rows by memory.

## Non-blocking correction

The document contains two consecutive `## Acceptance criteria` headings. Remove one during the
author pass; this is not a semantic blocker.

## Re-review entry condition

Re-review when R1–R7 resolve to exact types/symbols and able-to-fail fixtures. The next pass should
then re-derive the `186 + R` / `185 + R` tripwires from the corrected explorer and hint projection
sets rather than preserving the current arithmetic by hand.
