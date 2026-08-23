# Learner-module registry implementation return

**Date:** 2026-08-23
**RFC:** `rfc/learner-modules.md` §1, §4, §6, Appendix B / A1–A3
**Ledger:** D1205, D1206

The reducer checkpoint does not authorize inventing the registry's missing bytes. Two independent
contract gaps block the production declarations and their manifest closure.

## D1205 — Appendix B is six literal rows short

Appendix B says the closed list contains 181 declared rows, 179 compiled and two awaiting. Its
literal lists contain 175 declared rows, 173 compiled and two awaiting:

- sight 20
- blunder prevention 3
- threat radar 7
- post-commit nudge 38 (37 compiled + one awaiting)
- structure nudge 6
- theory breadcrumb 4
- guided hint 7
- compare coach 8
- review map 48 (47 compiled + one awaiting)
- full inspector 34

The stated cross-check substitutes 40 for the full-inspector row even though that row enumerates
only 34 ids. Section 4.11 separately names the omitted six: `rules.phase.reading@1`,
`rules.pivotal.marker@1`, `pack.authored.classifier@1`,
`derived.compare.structure_delta@1`, `derived.compare.eval_delta@1`, and
`derived.story.rank@1`. Appendix B must include those exact literals so A2's “Appendix-B rows, no
more and no fewer” criterion and the section-4 permission table agree.

## D1206 — required role/session ceilings have no declarations

`ModuleDeclaration.ceilings` requires non-empty `sessions` and `roles`, and §1 says every module
declares both. Section 4 does not give a closed role set or session set for any module. Phrases such
as “for everyone,” “Support only,” “inside an open disclosure boundary,” and “explicit mode” state
workflow/disclosure intent, but they do not choose literal members of the open `sessions: string[]`
or the six-member evidence-role union.

An implementer can make any invented non-empty arrays compile. That makes the completeness check
green without answering who may receive evidence in `pack`, `just_play`, `imported`, `campaign`,
`stream`, `match`, authoring, or review contexts. The amendment must enumerate the two sets per
module (or declare one common set plus literal overrides), then add a negative fixture that flips
one forbidden role and one forbidden session.

## Work that remains executable

The reducer pipeline, contract vocabulary and D1164 honest novelty abstention remain valid. No
production module declaration or `module.*` manifest consumer should land until these two tables
are complete. This return does not block unrelated collector implementations or the exact
renderer repair for already-declared compare evidence.

## D1213 — A14 asks for operands the projection does not retain

A14 requires `derived.compare.structure_delta@1` to render “kind, squares, before/after.” The
projection declares only one operand, `observation`, and `comparisonStrips` emits that one current
observation when it was absent from the previous identity set. No before observation or before/after
position identity crosses the evidence boundary. The bounded implementation now renders the
retained kind, color, role, squares/file and count as an `appeared` fact on both screen and voice;
it does not claim a before/after payload exists. The RFC must either narrow A14 to those retained
operands or widen the projection and derivation contract with explicit before/after values.
