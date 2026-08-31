# Module registration — fourth fresh independent buildability review

**Date:** 2026-08-31

**Reviewer:** Codex, independent of Claude's fourth author repair

**Verdict:** **RETURNED on [[D2398]]–[[D2400]].** The D2343–D2347 repairs survive their named
falsifiers: Guided Hint remains explicitly blocked, the four primary grains are distinguished,
external source inputs are grain-keyed, recorded-path evidence no longer leaks precommit, and card
forms retain `list`. The repaired artifacts still cannot specify one lawful implementation.

## D2398 — the cross-grain adapter changes labels without deriving subjects

`projection_between_grains@1` appears only in this RFC, its disposable generator, generated JSON
and positive test. No production or upstream RFC contract declares its input operands, output
payload, endpoint identity, join predicate, seal or abstention. The generator assigns it whenever
the primary pool lacks a requested grain and `review_evidence_packet@1` advertises that grain.

That is not a derivation. For example, one position-scoped `backward_pawn` reading receives a
`branch_pair` subject view without retaining two recorded positions or proving which endpoint the
reading describes. The same generic token is used for structure readings, Stockfish eval,
endgame phase and shape firings even though those require different occurrence/compare joins.

Replace it with exact typed occurrence/edge/branch derivations whose literal inputs establish the
target subject, or keep those views unavailable. Merely changing `subjectKind` must fail.

## D2399 — withdrawn direct collection remains a normative implementation contract

The third repair correctly says modules consume sealed pools and do not call detectors/providers.
Later §2.5 still requires `MODULE_EVIDENCE_EXECUTION_PLAN` rows to carry `sourceFamily` and a
callable `operation`, says the author test imports every function/prototype method, and requires
eight source families to execute. The generated requirements schema instead carries
`acquisition`, `requiredOutput` and `awaiting_upstream_sealed_operation`; none of its 117 rows has
`sourceFamily` or `operation`.

An implementer must not choose which of two normative schemas to obey. Rewrite the obsolete
section and its callable-family criteria to the sealed-pool contract; a supersession sentence near
the front is not an executable schema migration.

## D2400 — source-wide timing is not exact item applicability

The binding generator calculates only `policy.timings ∩ sourceContract.timings`. Its five source
contracts carry broad packet-wide timing lists. Neither a requirement row nor a subject view
declares exact timing, so changing one projection's legal applicability changes no binding row.
This can advertise an item whenever its packet can run, even when the exact collector/derivation
cannot establish that item at that subject/timing.

Compile module timing against the exact projection and selected subject-view operation profile.
The contract needs a negative where one item in an otherwise available packet is postcommit-only
and a precommit module binding fails.

## Verification

- `make module-registration-author-contract`: 11/11 green.
- `make module-evidence-assembly`: 13/13 green.
- `make module-registration-fourth-author-repair`: 5/5 green.
- `make module-registration-fourth-fresh-review`: reproduces D2398–D2400.

No production, schema, content, API, UX or protected-design byte changed. A fifth author repair and
then another fresh independent review are required before acceptance or implementation.
