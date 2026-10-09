# Learner-module registry implementation return

## Current return — 2026-10-08: D3578 selected-square delivery

The registry now exists; the 2026-08-23 findings below are historical, not today's
implementation blockers. This return concerns the actual registered query and adapters.

`make requested-sight-contract-check` is a disposable code-backed diagnostic, not a software
completion gate. Its passing preimage assertions mean the defect remains. `[V]`

### Author checkpoint — 2026-10-09, not acceptance

`rfc/module-registration.md` §4.2a and the companion note in `rfc/evidence-presentation.md`
now specify four exact selected derivations over the unchanged admitted sources. The draft
chooses request-local views, literal source/FEN/square retention and a sole-pair complete
legal-set envelope; ordinary Sight budgets and position-wide Inspector remain unchanged.
Independent review must precede production factory/query/receipt/client changes. No collector,
binding, default, semantic verdict or exact-mobility D1 is discharged by this author checkpoint.

The normal opt-in target now runs strict TypeScript, the six original preimage controls and
26 proposed-model controls over genuine sources. Full queen/promotion/castling lists fit the
proposed envelope without exposing UCI in learner prose. Control keeps pawn advances separate
from geometric attacks; pawn state survives with no contacts; invalid clones stay unavailable.
The model does not mint any production value or exercise the future API/renderer/gesture path.
The proposed automatic view choices need independent review and later owner-use evidence.

The separately authorized [[D3607]] repair now resolves post-commit and ancestor squares through
`exactMoveDestination(parent.fen, moveUci)`. Eight runtime cases and the actual REST query cover
castling, both colors, Chess960's stationary king, ordinary moves, promotion and en passant;
the sealed post-commit result equals the same-position explicit landing-square query. The REST
control retains closed-feedback refusal, budgets and the recorded run. All 140 focused checks
and clean types pass. Complete normal verification also passes 3,779 software, seven performance,
228 content and 209 browser cases, one optional Maia skip and zero retries. This is not acceptance
of the draft or a new selected-source/native-gesture feature. All four original findings below still apply
to production. `[V]` (`module-query.ts`, `module-query.test.ts`; server `module-query.test.ts`.)

1. **Acquisition is not selected-square consumption.** Four real sealed readings—castling rights,
   square control, pawn contacts and legal moves—have no branch in `sightScope`. Every possible
   selected square is excluded. The current adapters consume entire populations, so making their
   scope all-board would expose unrelated pieces/relations rather than answer the selection.
   Sources: `module-query-sources.ts`, `module-query.ts` and `presentation-play-adapters.ts`. `[V]`
2. **The selected frame stops before rendering.** `ProjectionPresentationAdapter.construct`
   receives only the admitted reading; it does not receive the validated selected square in
   `ModuleSubject`. Specify the exact boundary at which the requested subset is constructed and
   retained. Do not mutate sealed evidence, relabel a partial population as a complete source,
   pass arbitrary prose/callbacks to renderers or infer the selected origin from array order.
   The unchanged position-wide Inspector must retain its own meaning. `[V]`
3. **The completeness and budget requirements conflict.** `exact-legal-mobility.md` §3 requires the
   selected origin's complete destination set; `module-policy.ts` allows Sight six marks and the
   fitter drops an entire over-budget fact. A legal queen on d4 in the diagnostic has 27 distinct
   destinations. Truncating that to six would falsely narrow legal mobility. Resolve the actual
   legality-overlay budget/placement in the author contract before implementing the full binding;
   do not increase unrelated structural output or quietly weaken complete-set retention. `[V]`
4. **Destinations are not move identities.** The diagnostic promotion pawn has one destination and
   four legal UCI identities. Preserve all choices through controller and non-square forms;
   preserve the king's landing square separately from its castling move identity. Keep pseudolegal
   control, actual legal destinations and quality/risk evidence distinct. The exact-mobility
   contract already requires these distinctions. `[V]`

The narrow amendment must specify those boundaries for each of the four existing sources,
including occupied-piece versus empty-target selection, turn/availability and explicit no-witness
behavior. It must not add collectors, presets or rankings. Require real query → mounted/native
pointer, touch and keyboard controls for populated and unrelated squares; full legal queen sets;
promotion choices; unavailable turn clones; changing selection/position/help; unchanged original
source receipts and effective assistance ceilings. Registration-only witnesses are insufficient.

**Independent executable repair:** D3579 corrects square-control summary arithmetic in the existing
adapters (nonempty controller cells rather than array length). It does not supply this missing
selected-square contract or discharge exact-legal-mobility D1.

## Historical return — 2026-08-23

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
