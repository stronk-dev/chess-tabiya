# RFC: Learner modules

- **Status:** accepted — 2026-08-22, by claude as register owner on the buildability test, after cross-review (nine blockers fixed in place) and the owner's three rulings (D906: radar pre-commit-in-Support; outpost gated on the priority D566 fix; **budgets demoted to backstops, semantic reducers the mechanism**). *The honesty note worked exactly as written: the reducer obligation entered AFTER cross-review on the budgets ruling, the implementer was told to return §OQ1 if underspecified, and codex did (`c4d3c8c`) — correctly, because the three reducers were named and none defined. **Amended 2026-08-23 (reducer amendment, §3a)**: one pipeline, `factIdentity@1`, the closed `SUBSUMPTION@1` table, `positionNovelty@1` as bounded recomputation with a true abstention, `reduction_quality@1` with sink/failure-rule/reader, the `maxFacts` contradiction resolved toward truncate-after-reducers (A9 rewritten), a 14th declaration field `noveltyWindow`, six able-to-fail fixtures (A18) and Discharge D4. Status stays **accepted** — this is an amendment, not a re-acceptance; the return loop remains the check.* *(Prior line for history: draft 2026-08-22 — the Phase-3 / F5 module-contract RFC. Drafted while 2c is)*
  implementing and 2d awaited independent acceptance (2d has since been accepted with its 18
  ids unchanged — Depends-on, §7, changelog); **implementation of this RFC is sequenced
  after both collector waves land** so every eligibility row binds a compiled projection id, per
  the program routing (`planning/evidence-foundation-ux/plan.md` Phase 3).
- **Author:** claude (drafted on the D717 program routing, Phase 3)
- **Created:** 2026-08-22
- **Design refs:** `design/05-in-run-experience.md` §3 (assistance ladder as amended by
  O1/O2/O3), §3-forms (as amended by O1/O4 — the config algebra), §3a/§3a-i (silence default,
  disclosure model), §3b (naming-never-recommending, module-composition amendment);
  `design/03-product-breadth.md` §Intelligence and explanation
- **Exploration gate:** the D717 program (`planning/evidence-foundation-ux/plan.md`), Phase 3 —
  opened by the owner's use-rejection ruling of 2026-08-22 ([[D717]]) and the D617–D619
  owner rulings adopting the manifest/eligibility/module/preset split
  (`design/research/evidence-presentation.md`). All Phase-3 owner questions are ruled
  ([[D745]], plan.md).
- **Depends on:** `rfc/tactical-collectors.md` (2c — **implementing**; supplies `threat@1`,
  `mate_in_one@1`, `loose_piece`, `space`, `pawn_connectivity`, castling and the other Wave-A
  ids) and `rfc/breadth-collectors.md` (2d — **accepted 2026-08-22**, after this draft, with the
  independent review's five in-place convention repairs ([[D895]]) and its 18-id Appendix A
  unchanged — verified in cross-review, which resolves open question 5's contingency: no
  Appendix-B id moved; supplies square-control, mobility, pawn-dynamics and king-zone ids). The
  landing-order seam is normative: §7. Builds on the implemented `archive/evidence-contract-manifest.md` (F1) and
  `archive/semantic-evidence-selection.md` (F2).
- **Parent / amends:** additively extends the compiled evidence catalogue
  (`packages/runtime/src/evidence-catalog.ts`) with a module registry, production consumers,
  production eligibility rows and one production selection policy. Redefines no shipped
  identity; the research consumer, its 40 rows and its policy are untouched.
- **Supersedes / superseded by:** —
- **Planning:** `planning/learner-modules/` (once implementing)

```tabiya-claims
none
```

**Why `none`, verified at HEAD `e15123c` rather than assumed.** Every deliverable is a
catalog-local declaration: module ids, `module.*` consumer ids, eligibility rows and one
selection-policy object in `packages/runtime/src/evidence-catalog.ts`, plus adapters/renderers
under the existing F1 machinery. None of the six shared-resource registers is touched:
`DRILL_PACK_SCHEMA_VERSION` (0.27, lanes 0.28/0.29 live-claimed), the run schema (0.17),
shape-entry (0.3, lane 0.4 claimed), principle-entry (0.1), the migration register (head 24,
`learner-rating` holds the next positions) and `EVIDENCE_KINDS`
(`apps/server/src/sourcing/types.ts`, 7 members) are all unmoved. Module packets and selection
results are derived at request time and never persisted, exactly as semantic events are
("firings are derived projections, never events"). No `AssistanceConfig` version move: this RFC
stores no preference — preset storage is Phase 5's. `node tools/register-check.mjs` passes with
this block declaring `none`.

## Summary

This RFC creates the **first production learner modules** — the contract layer between the
compiled evidence manifest and a person at a board. Phase 1 measured the wall this breaks: at
its derivation every one of the F2 eligibility rows targeted the research consumer
`research.semantic_selection@1` and **zero of the nine R3 module ids or six workflow ids
existed in production** (`phase1-gap-matrix.md` §1; re-verified at drafting HEAD `e15123c`:
40 of 40 eligibility rows research-only, module/workflow-id grep over `apps/ packages/`
excluding tests/tools still 0). F2 built the machinery so that *only declarations are missing,
not mechanisms* (gap matrix §6.1); this RFC supplies the declarations.

It specifies: (§1) the module contract schema every module declares; (§2) the closed timing
vocabulary with the **at-commit** slot D881 ruled distinct; (§3) the deterministic production
selection policy and how it respects R3's lift boundary; (§4) the **eleven modules** of D841 —
legal affordance, requested sight, Keep-Me-Safe, threat radar, post-commit nudge, structure
nudge, theory breadcrumb, progressive guided hint, compare coach, Review Map, full evidence
inspector — each with literal accepted projections, budgets, ceilings, honest-empty behavior
and one learner action; (§5) the ruling that **move-quality grades are a projection, not a
module**, with D879's constraints encoded; (§6) the registry's binding into F1's manifest and
the sealed LLM packet boundary over F1 §6.1's `RenderedEvidenceView`; (§7) the landing-order
seam and the declared-but-unlanded rule. It deliberately ships **no presets, no
composition/layout, no new collectors and no bot policy** (§Motivation).

The registry's ids are also downstream currency: [[D893]] rules evidence consumers the
campaign's progression vocabulary ("modules unlock as abilities"), which is one more reason the
id list is closed and stable rather than open-ended.

## Motivation

The owner's use-rejection ([[D717]]) set the success criterion for the whole program: the
executable chain **collector → typed evidence → eligibility → selection → module → form →
preset → workflow**, with *"registered"* explicitly not meaning *"usable, rendered well, or
connected to a workflow."* Phases 1–2e supplied measurement and collectors. The single largest
block the gap matrix names between the manifest and a learner experience is **the class-9
wall**: the entire F2 event layer is production-inert by disposition, and *"nothing downstream
moves without"* the first production eligibility rows, named module consumers and policies
(gap matrix §6.1). F5 modules, Phase-4 composition, Phase-5 presets, F6 Review Map, F8 bots and
F9 coaching all wait on this document. `rfc/tactical-collectors.md` §Discharges names this RFC
as the discharger of its two open rows (production-module eligibility; learner-facing wiring of
the D745 negative reading), and `rfc/breadth-collectors.md` §Discharges names it once more for
the breadth projections' production-module eligibility (its D1).

**Scope boundary — module contracts + eligibility rows + the registry binding, nothing else:**

- **No presets.** Preset names, defaults and per-workflow compositions are **Phase 5 / R3
  territory** and are not chosen here (R3's exit explicitly requires owner use;
  `evidence-presentation.md` §9). This RFC defines what a module *is* so presets can compose
  them. The five preset names and six workflow ids in the R3 harness remain research
  candidates.
- **No composition or layout.** Where modules sit on screen — board stage, rail, drawer,
  sheet — is Phase 4 ([[D718]]). This RFC declares only each module's **seat class** (§1.11)
  because D841's one-board-adjacent-cue cap is a contract fact, not a layout choice.
- **No new collectors.** Every accepted projection id is either shipped at HEAD, in the
  accepted 2c closed list (30 ids, `rfc/tactical-collectors.md` Appendix A), or in the 2d
  closed list (18 ids, `rfc/breadth-collectors.md` Appendix A). The two grade-family rows are
  **declared-awaiting**, not registered here (§5, §7). Where a module's best projection is
  unlanded, the module declares it and ships **honest-empty until the collector lands** — the
  availability rule working, not a blocker.
- **No bot policy** (Phase 6, D810 lane) and no content work.

## Specification

Normative vocabulary: a **module** is a named learner-facing consumer with a declared intent,
a closed acceptance list, timing, budgets, ceilings, deterministic selection and rendering, and
one learner action. A **module packet** is the sealed, selected, rendered output of one module
for one decision point. **Admission** (eligibility) is semantic and precedes **selection**
(ordering within budget) — O2 verbatim: *"Eligibility precedes selection."*

### §1 — The module contract schema

Every module in §4 declares all thirteen fields. A module missing a field is a spec bug, not a
licence to invent. The schema lands as `ModuleDeclaration` in
`packages/runtime/src/evidence-catalog.ts`, frozen and digest-contributing (§6).

1. **`id`** — one of the closed eleven (§4). Stable; consumed later by presets (Phase 5) and
   the campaign registry ([[D893]]).
2. **`intent`** — one sentence naming the learner question this module answers.
3. **`learnerAction`** — **the one obvious action** the module's output affords. Exactly one;
   secondary affordances (dismiss) are chrome, not contract.
4. **`accepts`** — the closed list of **literal projection ids with versions** (Appendix B).
   No wildcards, no "latest", exactly as F1's binding law requires. Each entry may carry a
   per-entry timing/answer restriction that only narrows the module's own.
5. **`timings`** — non-empty subset of the closed vocabulary in §2, each with its initiative
   (`ambient | proactive | on_request | explicit_mode`).
6. **`answerCeiling`** — the maximum answer content of any output:
   `none | fact | pattern | threat | candidate_move | principal_variation`. Its consumer image is
   the shipped `AnswerDistance` union (`evidence-contract.ts:7`) by pinned mapping, not homonym:
   `candidate_move → candidate_moves`, `none` = an empty `answerContent` set, the rest literal —
   compiled with the registry so a ceiling token with no shipped image is a build failure (the
   D523 lesson). Whether **moves,
   rankings, PVs or ratings** are legal in output is this field plus two hard rules: the packet
   compiler refuses `recommendedMoveUci`/PV material for any module whose ceiling is below
   `candidate_move` (the R3 mechanism, `module-contract.ts:78`, made production); and
   **learner rating is never an input to any module packet** — R15 byte-identity
   (`rfc/learner-rating.md` §8/AC-11): the same position and history produce byte-identical
   module output regardless of the learner's rating.
7. **`ceilings`** — the module's disclosure, session and role ceilings. Effective assistance is
   `requested preset ∩ workflow/session ceiling ∩ honesty/access ∩ source availability` —
   **every term only narrows; a ceiling only removes** (design/05 §3-forms as amended, quoted —
   the draft misquoted the third term as `role`; corrected in cross-review). The honesty/access
   term is encoded at this seam as F1's closed role set (`learner`, `host`, `participant`,
   `spectator`, `author`, `operator`) plus the §2 disclosure bindings; the encoding only narrows
   the design term. **The [[D659]] class rule binds every rendering of board state:** any module
   projection of the board — visual, textual, spoken or assistive — inherits the visible board's
   assistance conditions and may never widen what the visible board withholds under the effective
   config; accessibility and alternate forms are renderings of the same admitted content, never a
   bypass. This binds `rules_floor` (its dots follow the board's own lighting gate exactly as the
   `accessible-board-input` fix made the semantic grid follow `showDests`) and
   `sight_on_request`'s marks and captions alike.
8. **`budgets`** — `maxFacts`, `maxWords` (deterministic-renderer output, per delivery),
   `maxMarks` (lit squares), `maxArrows`. Unused budget **stays empty** — the R2/R3 rule;
   spare budget is never filled with locally-distinctive-but-useless facts (the
   `occupied_defence` lesson, `evidence-presentation.md` §6.1).
9. **`selection`** — the policy reference (`production.module_local@1`, §3) plus the module's
   family-precedence order (its `accepts` order) used in tie-breaking.
10. **`emptyBehavior`** — the honest zero-fact state, one of:
    `silent` (module simply absent — never a safety claim), `stated_absence` (a fixed sentence:
    "Nothing was written about this position" / "No recorded evaluation covers these moves"),
    or `unavailable_source` (names the absent provider). Absence is **stated, never
    simulated** (design/05 invariant), and honest-empty is a first-class state, not a failure.
11. **`seatClass`** — `board_input | board_adjacent | rail | timeline | explicit_surface`
    (`board_input` is `rules_floor` alone: its output *is* the board's own affordance layer,
    not a seated surface). Registry
    invariant, from [[D841]] verbatim: *"at most ONE board-adjacent cue (Keep-Me-Safe);
    everything else queues into the rail with count badges rather than expanding."* Exactly
    one module declares `board_adjacent`. Layout itself is Phase 4.
12. **`forms`** — non-empty subset of the closed inventory
    `sentence | card | square | arrow | timeline_mark | panel | spoken_voice`, each grounded in
    design/05 §3-forms' inventory (sentence rows/lists; sheets/panels — `card` and `panel` are
    its two bounded shapes; lit squares; arrows & piece halos, form (c); timeline markers; spoken
    voice). **The F1 image is a pinned mapping, not homonym** (the D523 lesson): each module form
    compiles to shipped `EvidenceForm` members (`evidence-contract.ts:6`) —
    `sentence → sentence`, `card → panel` (a card may additionally carry `list` rows),
    `square → lit_squares`/`piece_halo`, `arrow → arrows`, `timeline_mark → timeline_marker`,
    `panel → panel`, `spoken_voice → audio` — verified by the registry invariants, so a module
    form with no shipped image is a build failure. **`sound` is deliberately absent**: [[D880]]/[[D881]] flag
    the sound form as a design-tier gap (§3-forms has no sound row); no module may use a form
    the design inventory does not carry, and the row is the owner's to write. Two form rules
    bind: a visual form is an **alternate rendering of one admitted fact** — render the same
    content as a sentence; if the sentence would be refused, so is the overlay (design/05
    §3-forms acceptance test); and `arrow` marks are drawn only from an admitted fact's retained
    **ordered** operands (a threatened move, a capture line, a ray, a PV move) — a fact
    retaining only square *sets* draws marks, never arrows — so the system-arrow producer gap
    (D546, form (c)) is unchanged and no module here requires a vector producer.
13. **`rendering`** — deterministic rendering is **normative** (R5): registered per-projection
    renderers produce the sealed sentences; the optional LLM boundary is §6.3. Provider-off
    output is byte-identical in claims.
14. **`noveltyWindow`** *(added by the reducer amendment 2026-08-23)* — a non-negative integer,
    the number of ancestor nodes §3a.4's novelty reducer compares against on the current branch.
    Default `3`; `0` disables novelty for that module and is the correct declaration for modules
    whose whole job is the current staged moment (`rules_floor`, `blunder_prevention`). The field
    is part of the closed declaration shape, so a module that omits it is a compile failure
    rather than a silent default. **This takes `ModuleDeclaration` from thirteen fields to
    fourteen** — the shipped checkpoint (`2a54d05`) must widen the type and its registry
    completeness check.

### §2 — Timing vocabulary (the D881 repair)

The closed module timing vocabulary is:

| Timing | Definition | Disclosure binding (design/05 §3a-i) |
|---|---|---|
| `pre_commit` | no move is staged | may never disclose beyond the module's pre-commit answer ceiling; silence is the default posture (§3a) |
| **`at_commit`** | **a move is staged and not yet submitted** — the slot [[D881]] ruled distinct from pre-commit; the staged-move moment every field blunder-guard occupies | same ceiling as pre-commit: it may warn about the *staged* move, never rank or name alternatives |
| `post_commit` | the move has landed; the run continues | gated by `feedbackDeliveryOpen`; `attempt_end` discloses and **re-closes on the next committed move** |
| `checkpoint` | a declared disclosure boundary (`delayed_checkpoint`, `segment_end`, `attempt_end`) is open | staged evidence applies now |
| `review` | `outcome.reached`, or an explicit analysis mode | discloses under every policy — a finished run has nothing left to contaminate |

Mapping from the R3 research vocabulary (`tools/r3-presentation-harness/module-contract.ts`),
so no earlier result is silently re-labelled: `precommit → pre_commit`;
`postcommit → post_commit`; `disclosed → checkpoint`; `analysis → review`; **`at_commit` is
new** — the R3 harness overloaded `precommit` for `blunder_prevention`, which is exactly what
D881 forbids going forward. Timing attaches to disclosure; form attaches to neither (§3-forms,
quoted).

**The F1 seam must be extended, not prose-mapped** (added in cross-review — the draft left it
implicit, which is the D523 class): the shipped closed union `EvidenceTiming`
(`packages/runtime/src/evidence-contract.ts:5` —
`precommit | postcommit | checkpoint | attempt_end | terminal | review | analysis`) carries no
at-commit member. This RFC **adds `at_commit` to that catalog-local union** in the change that
lands the consumers — digest-moving, register-silent (the union sits in none of the six
registers) — so D881's slot is typed at the consumer declaration rather than overloaded onto
`precommit`, which is exactly what D881 forbids. The remaining module timings map onto shipped
members without extension: module `checkpoint` → shipped `checkpoint`/`attempt_end` per the
open boundary; module `review` → shipped `review` (`explicit_mode` initiative additionally
admits `analysis`); `pre_commit`/`post_commit` → `precommit`/`postcommit` literally.

### §3 — Selection: deterministic, module-local, and R3-honest about lift

One production selection policy, `production.module_local@1`, is added beside the untouched
research policy. Per module, at a decision point:

1. **Admission first (O2).** The candidate set is exactly the facts whose projection id is in
   the module's `accepts` list, whose timing/disclosure/role/availability terms pass, and —
   for event-shaped candidates — which come from the F2 complete-population machinery
   (`selectSemanticEvidence` / the local-alternative enumeration): the denominator includes
   alternatives that emit no event. Admission is decided by **typed semantics declared in this
   RFC's tables, never by a measured score.**
2. **Ordering within the admitted set**, by keys, in order:
   1. **Critical events** (the R2 policy's exact set — `checkmate`, `promotion`, `castled`,
      `last_of_role` — byte-identical, unchanged) outrank everything. Critical-override is a
      compiler rule, never an LLM decision.
   2. **Exactness class**: `exact` before `convention` before `measured` before `authored`
      (the conservative direction of the ladder).
   3. **Measured family lift**, descending, read from a versioned table `module-lift@1` whose
      every value is a citation to a recorded measurement (d542, D730, D794 — e.g.
      `pawn_island_gained` 2.13×, `rook_on_seventh` 3.83×, `double_attack` 1.72×/1.96×,
      `check` 2.48×/2.60×). A family with no measured lift orders **after** measured families
      within its exactness class — absence of measurement is not a zero. **Table governance,
      pinned against D368's stale-figure defect** (added in cross-review): `module-lift@1` is a
      frozen catalog-local object beside the policy; every row carries its value, its citation to
      the recorded measurement, **and the corpus/commit it was measured against with its
      derivation date** — a lift value with no measured-at anchor is the D368 class and fails the
      registry invariant. Rows change only through a changelog'd spec change that re-derives
      against a named corpus; an absent table is a build failure, never a silent empty ordering.
   4. **Deterministic ties**: the module's `accepts` declaration order, then lowest subject
      square in a1…h8 order, then event id lexicographic where the tied candidates are events,
      then — because reading- and source-record-shaped candidates carry no event id — the
      canonical serialization of each fact's retained operands, lexicographic. The final key is
      total by construction: two facts with identical projection id, subject square and operand
      bytes are the same fact.
3. **Reduce, then backstop** — the single pipeline of §3a. Reducers run after ordering; the
   numeric budget is the last step and a **backstop**, never the reduction mechanism (D906).
   Unused budget stays empty. Empty result renders the module's `emptyBehavior`.

**The R3 boundary, stated carefully.** R3/D660 bars the corpus-global 294× top-two lift
ordering from being *policy*: *"the preset algebra filters modules, module eligibility filters
events, and neither may be replaced by a global interestingness ranking"*
(`assistance-surface-taxonomy.md` §5, quoted). This policy respects that bar by construction:
lift never admits, excludes or transfers a fact across modules — the admitted set is fixed by
the closed `accepts` tables — and it never establishes valence, causality, importance or a
grade (O3). What measured lift **may** do, and does here, is **order within a module's already
admitted set**: once semantics have decided a fact may face the learner in this module at this
time, the recorded measurement of how strongly that family tracks played moves is a legitimate,
deterministic, citable sequencing key for a bounded budget. Changing a lift value can never
change what is **admissible**; and — stated plainly rather than smuggled (corrected in
cross-review: the draft said "reorder without changing membership", which is true only when the
admitted set fits the budget) — when the admitted set exceeds `maxFacts`, lift legitimately
decides which admitted facts fill the scarce slots. That is the ruled clause working, verbatim:
local measurement *"may select among already-eligible events but cannot establish valence,
causality, importance or a move grade"* (design/05 §3 amendment, clause 3). Lift never crosses
the admission boundary; inside it, lift is a sequencing-and-fill key only. Criterion A7's
negative fixtures pin both halves.

**The negative reading (D745(2)/D718).** `derived.semantic_avoidance.*` facts carry
`denominatorRequired`: the compiled packet must retain the numerator and the **complete**
denominator, and the renderer must show it — *"you avoided leaving a piece loose; N% of your
legal moves would not have"* — **denominator always shown, never on the pre-commit path**
(ruling quoted). Registry invariant: an avoidance row may only bind to a module none of whose
timings is `pre_commit` or `at_commit`. In this RFC that is `postcommit_nudge` and
`review_map` only.

### §3a — The semantic reducers (reducer amendment, 2026-08-23)

**Why this section exists.** The owner's D906 ruling demoted budgets from mechanism to backstop
and named three semantic reducers as the mechanism. The accepted text named them and defined
none, and codex returned the RFC on buildability (`planning/learner-modules/implementation-return.md`,
commit `c4d3c8c`) — correctly: an implementer cannot infer a cross-projection identity, a
subsumption relation, a novelty window or an instrument sink, and a green fixture would not
reveal which contract shipped. **The debt was the author's.** This section discharges it. Nothing
here weakens a reducer into a cap; that is the shape the ruling rejected.

#### 3a.1 One pipeline, replacing the contradictory clauses

`reduceModulePacket@1` — the single ordered pipeline. Every step is total, deterministic and
pure; each names its input and output type, and no step may widen exactness, grounding, answer
content or abstention relative to its input (the `EVIDENCE_DERIVATION_WIDENS` discipline,
`evidence-contract.ts:499`, applied to reduction as well as derivation).

| # | step | symbol | in → out | abstention |
|---:|---|---|---|---|
| 1 | Admission (§3 step 1) | `admitModuleFacts` | eligible facts → admitted facts | empty set is honest-empty, not failure |
| 2 | Deterministic ordering (§3 step 2) | `orderAdmittedFacts` | admitted → ordered | total by construction |
| 3 | **Exact cross-projection dedup** | `dedupeByFactIdentity` | ordered → ordered | no registered class ⇒ identity is the fact's own key; nothing collapses |
| 4 | **Declared subsumption** | `applyDeclaredSubsumption` | ordered → ordered | no declared pair ⇒ unrelated; nothing drops |
| 5 | **Bounded per-position novelty** | `applyPositionNovelty` | ordered → ordered | history unavailable ⇒ **abstain**: the step is identity and records its abstention |
| 6 | **Backstop + overflow observation** | `applyBackstop` | ordered → delivered packet | over-backstop emits the §3a.5 observation, then keeps the top `maxFacts` |

**The contradiction is resolved in favour of §3 step 3's reading, and A9 is rewritten.** The
drafted A9 ("facts beyond `maxFacts` are never admitted") cannot coexist with the ruling: if the
cap cut at admission, the post-reducer set could never be observed to exceed the backstop, and
the instrument the owner ordered could never fire. It also contradicted A7 arm (c), which already
pins lift deciding *"which admitted facts fill the scarce slots"* — the truncation reading was
already load-bearing in the criteria. So: **facts are admitted on semantics alone, reducers run,
and only then does the backstop truncate — loudly.** Unused budget still stays empty (step 6
never back-fills); "never admitted" survives only as the rule that a fact outside `accepts` is
never admitted **at any budget** (A7 arm (a)).

Reducer versioning: `reducerVersion` is a single frozen catalog-local literal `"module-reducers@1"`
covering steps 3–5 together, carried in every overflow observation (§3a.5). A change to any
relation table or window bumps it in a changelog'd spec change — the `module-lift@1` governance
idiom (§3 step 2.3), for the same D368 reason.

#### 3a.2 Exact cross-projection dedup — `factIdentity@1`

**Why `observationIdentity` cannot serve.** `structure.ts:591` accepts only
`StructuralObservation` and keys on the observation's own JSON; it is unreachable for
event-shaped, reading-shaped or source-record-shaped facts, and — the decisive defect — a
projection id is part of no identity it computes, so the *same* fact surfaced through two
projections is two facts by construction. That is exactly the duplicate a learner sees.

**The identity.** A fact's identity is the pair `(equivalenceClass, subjectKey)`:

- `equivalenceClass` — the fact's **registered class** from the closed table in §3a.3, or, when
  the projection id appears in no registered class, the projection id itself. Absent registration
  means *unrelated*: two facts never collapse by inference.
- `subjectKey` — the canonical serialization of the fact's **retained operands restricted to the
  class's declared compared fields** (§3a.3 column 3), in the shipped canonicalization
  (`canonicalizeJson`), with the mover-relative colour retained. Where a class declares no
  compared fields, the whole retained-operand serialization is used, which is the §3 step 2.4 key
  already pinned as total.

`dedupeByFactIdentity` keeps the **first** fact of each identity in the §3 step 2 order, which is
the most conservative representative by construction — exactness class ascends `exact` before
`convention` before `measured` before `authored`, so the retained fact never widens grounding
relative to the ones it absorbs. Dropped duplicates are not counted as overflow (they were never
distinct facts).

**Worked example (must collapse).** `rules.structural.predicate.isolated_pawn` and
`rules.structural.reading.isolated_pawn` over the same position, same colour, same file: the
predicate arm reports the feature matched, the reading arm enumerates it. Both are the shipped
`isolated_pawn` structural feature (`evidence-catalog.ts:111-112` build the two id families from
one `STRUCTURAL_FEATURE_KINDS` list). Registered class `structural.isolated_pawn`, compared
fields `{color, file}` ⇒ one identity ⇒ the learner sees one fact.

**Hard negative (must NOT collapse).** `rules.structural.event.isolated_pawn` ("your move left
this pawn isolated") and `derived.semantic_avoidance.isolated_pawn` ("you avoided leaving a pawn
isolated; N% of your legal moves would not have"). The avoidance families are generated from the
*same* `STRUCTURAL_EVENT_FAMILIES` list (`evidence-catalog.ts:124`), so every naive
family-name-based identity collapses them — and collapsing them inverts the fact's polarity in
front of a learner. They are in **different** registered classes, permanently, and A18 fixture (f)
pins it.

#### 3a.3 Declared subsumption — `SUBSUMPTION@1`

Subsumption is a **closed, directed, declared** table living beside the policy in the catalogue
(`packages/runtime/src/module-reducers.ts`, new), never inferred from renderer prose and never
from a family name. Each row: `{ specific, general, comparedFields, groundIsRules }`. A row is
admissible only when the entailment is a **rules fact** — `groundIsRules: true` is checked by a
registry invariant, so no row may encode a strategic judgement (law 8; the return's own warning
that inferring entailment from prose "would manufacture chess semantics").

`applyDeclaredSubsumption` drops the `general` fact **only when** a `specific` fact is present in
the same ordered set *and* their `comparedFields` serializations are equal. The relation is
applied once, not transitively closed — a transitive chain must be declared row by row, so the
table is auditable by reading it.

**Worked example (must subsume).** `{ specific: "rules.transition.event.checkmate", general:
"rules.tactic.event.check", comparedFields: ["nodeId", "moverColor"], groundIsRules: true }` —
a checkmate *is* a check by the rules of chess; showing "this move gives check" beside "this move
is checkmate" is a duplicate, not a second fact.

**Hard negative (must NOT subsume).** `rules.structural.event.passed_pawn` and
`rules.structural.event.isolated_pawn` on the same pawn. They co-occur constantly and correlate
strongly, and neither entails the other — a passed pawn need not be isolated, an isolated pawn
need not be passed. No row exists, so nothing drops; A18 fixture (b) asserts the pair survives
**and** asserts asymmetry (declaring `A ⊃ B` must never drop `A` when only `B` is present).

#### 3a.4 Bounded per-position novelty — `positionNovelty@1`

**No new persistence, and no process-local memory.** The return correctly refuses novelty
degenerating into in-process state. It does not need to: §A7 makes selection **deterministic and
byte-identical across runs**, so the packets already delivered on this branch are *recomputable*
from the persisted run state. Novelty is therefore a projection of the event log, the repo's
existing idiom, and this RFC's claim stays `none` — no run-schema lane, no migration.

- **Key**: `(branchId, nodeId, factIdentity)` — `factIdentity` from §3a.2.
- **Window**: the `noveltyWindow` most recent **ancestor** nodes of the current node on the
  current branch, nearest-first. `noveltyWindow` is a per-module declaration field (14th field;
  §2 gains it), default `3`, `0` disables novelty for that module.
- **Source of history**: recomputation of steps 1–4 (admission → ordering → dedup → subsumption)
  over each ancestor node in the window. **Steps 1–4 only** — novelty never recurses into
  novelty, which makes the definition well-founded and each ancestor a single bounded pass.
- **Ordering**: ancestor path order, nearest-first; ties impossible (a node has one parent per
  branch).
- **Effect**: a fact whose identity appears in any recomputed ancestor packet within the window is
  dropped. Rewind and fork are handled by construction — the ancestor path is the *current
  branch's*, so a forked branch has its own history and a rewound node's descendants are not
  ancestors.
- **Honest absence, and the one true abstention**: when the run state needed to recompute an
  ancestor is unavailable — the module is delivered outside a run, or the branch's ancestor nodes
  cannot be read — `applyPositionNovelty` is the **identity function** and records
  `noveltyAbstained: true` on the packet. It never silently behaves as if history were empty
  (which would claim every fact is novel) and never substitutes process memory. First packet on a
  branch: the window is simply shorter than `noveltyWindow`; that is a short window, **not**
  absence, and `noveltyAbstained` stays `false`.

**Durable cross-run novelty is explicitly out of scope** and has a named owner: Discharge D4.

#### 3a.5 The overflow instrument — `reduction_quality@1`

A typed observation, emitted by step 6 when `afterReducers > backstop`:

```ts
type ReductionQualityObservation = {
  readonly kind: "reduction_quality@1";
  readonly moduleId: ModuleId;
  readonly admitted: number;       // after step 1
  readonly afterReducers: number;  // after step 5
  readonly backstop: number;       // the module's maxFacts
  readonly dropped: number;        // afterReducers - backstop, always > 0 when emitted
  readonly reducerVersion: "module-reducers@1";
  readonly noveltyAbstained: boolean;
};
```

- **Sink**: a `ReductionQualityRecorder` interface with two shipped implementations — the
  production default `NULL_RECORDER` (a no-op) and `ArrayRecorder` used by fixtures and the
  corpus harness. The recorder is injected at selector construction; it is **not** a run event
  and moves no schema byte.
- **Transaction/failure behavior**: emission is outside any transaction and wrapped so that a
  throwing recorder is swallowed after being counted — **an instrument failure never widens
  assistance, never changes packet content, and never fails a chess move** (the return's
  requirement, stated as the implementation rule).
- **Reader**: `make reduction-pressure` — runs the selector across the corpus with `ArrayRecorder`
  installed and reports, per module, the count and distribution of overflow observations. This is
  the measurement the ruling asked for: *cap pressure is measured and the reducers improve where
  the pressure is, never tuned by feel.* Backstop values stay claude/implementer-adjustable
  without ceremony; the pressure report is what justifies a change.

**Honest scope note.** This instrument measures pressure **over the corpus**, not per learner over
time. That is the right place for tuning reducers and needs no persistence; durable per-learner
capture is Discharge D4's, owned by `longitudinal-store`.

### §4 — The eleven modules

Table caption — unit: **module id**; total: **11**. This is the closed list; adding or dropping
one is a spec change with a changelog line.

| # | id | timing (initiative) | seat | answerCeiling | maxFacts / words / marks / arrows | learnerAction |
|---:|---|---|---|---|---|---|
| 1 | `rules_floor` | pre_commit (ambient) | board_input (4.1) | none | 0 / 0 / — / 0 | commit a legal move |
| 2 | `sight_on_request` | pre_commit (on_request) | rail | fact | 1 / 30 / 6 / 1 | select another square, or dismiss |
| 3 | `blunder_prevention` | **at_commit** (proactive, Support only) | **board_adjacent** | threat | 1 / 20 / 1 / 0 | revise or confirm the staged move |
| 4 | `threat_radar` | pre_commit (on_request, Support ceiling) · post_commit (on_request) | rail | threat | 3 / 60 / 4 / 2 | open the named threat's fact card |
| 5 | `postcommit_nudge` | post_commit (proactive, cap 2) | rail | fact | 2 / 50 / 2 / 1 | branch from this move and try the other idea |
| 6 | `structure_nudge` | post_commit (proactive or on_request) | rail | pattern | 1 / 80 / 4 / 0 | open the cited shape entry |
| 7 | `theory_breadcrumb` | post_commit (on_request) | rail | fact | 1 / 60 / 0 / 0 | open the cited passage |
| 8 | `guided_hint` | checkpoint (on_request, staged) | rail | principal_variation (final stage only) | 2/stage / 40/stage / 1 / 1 | request the next stage |
| 9 | `compare_coach` | checkpoint · review (on_request) | rail | fact | 2 / 60 / 2 / 2 | enter the other attempt at the divergence |
| 10 | `review_map` | review (automatic) | timeline + explicit_surface | principal_variation | 3/moment / 80/moment / 3 / 2 | replay from this moment |
| 11 | `full_inspector` | review (explicit_mode) | explicit_surface | principal_variation | 20 / 400 / 20 / 8 | open a fact's provenance |

Eligibility summary — unit: **eligibility row** (one literal `(projection id, module consumer)`
pair); total declared: **181** (175 at cross-review, +6 by the D924 Appendix-B amendment), of which **179 compile at landing** and **2 are
declared-awaiting** the grade-family projection (§5). (Drafted as 179/177; four sight rows were
removed in cross-review — Appendix B and the changelog carry the correction.) Appendix B is the
closed enumeration.

#### 4.1 `rules_floor` — legal affordance

- **Intent:** make legal interaction visible; never advice. **Action:** commit a legal move.
- **Accepts:** **nothing from the evidence manifest** (0 rows). Legal-destination dots and the
  accessibility announcement path come from the board input controller
  (`board-input.ts` `legalDestinations`), which is interaction affordance, not evidence.
- **Registry-only module:** it therefore registers **no `module.rules_floor` evidence
  consumer** — F1's every-consumer-bound-or-disposed law is about consumers that exist; a
  consumer with nothing to consume would be ceremony. The registry entry carries
  `evidence: none` explicitly so nothing is hidden (the honest-homes principle).
- **Empty behavior:** n/a — the module is the dots. Forms: `square`. Reveals nothing.

#### 4.2 `sight_on_request` — requested sight

- **Intent:** answer one concrete board-sight question without ranking moves. Owner-ruled
  legal pre-commit (D617–D619): *requested exact sight* only.
- **Accepts (20 rows):** exact, `position_rules`-grounded readings only, square-scoped to the
  learner's explicit selection: 15 structural readings (the 18 `STRUCTURAL_FEATURE_KINDS`
  minus retired `pawn_count`; minus `pawn_safe_square` — R1/D566 made it ineligible for its
  advertised meaning; and minus `outpost`, removed in cross-review because its matcher consumes
  **RULED 2026-08-22 (owner): *"just fix the foundation and then keep it in"* — `outpost`
  RETURNS to this table the moment the D566 `pawnSafety` repair lands**, which that ruling
  simultaneously promotes to a priority defect fix (queued for the implementer). The
  exclusion is a gate on the fix, not a scope decision — and the fork that offered only
  keep-out vs ship-broken, omitting *fix the foundation*, is re-ledgered as the
  every-fork-includes-removing-the-constraint rule firing again (D906).
  the same defective `pawnSafety` result (`structure.ts:352`; the live manifest check names the
  dependency and D632 records the overclaim's reach) — it stays inspector material until that
  repair lands rather than entering requested sight under a broken convention);
  `rules.castling.reading.rights@1` and `.legality@1`;
  `rules.tactic.reading.rook_on_seventh@1`; and the two **exact** 2d readings
  (`rules.square.reading.control@1`, `rules.pawn.reading.contacts@1`). Convention-grounded
  readings are **not** sight: pre-commit exactness is the admission test, and an
  exchange-conditioned warning pre-commit is threat-radar/Support material, not sight.
  **Corrected in cross-review (the D523 class — a grammar assumed rather than checked):** the
  draft admitted five 2d readings as "exact", but the accepted `rfc/breadth-collectors.md`
  declares three of them convention-grounded — `rules.mobility.reading.piece_destinations@1`
  (consumes `local-non-losing@1`), `rules.pawn.reading.candidate_majority@1` (the disclosed
  D788 convention) and `rules.king.reading.zone_state@1` (consumes
  `king-zone@1`/`king-shelter@1`) — so they fail this module's own admission test and are
  removed; their inspector home (4.11) is unchanged. The genuinely exact half of the mobility
  question ("where can this piece legally go") has no standalone exact projection at HEAD or in
  either accepted collector wave; admitting it to sight needs a separate exact projection or an
  operand-scoped admission mechanism — a proposed ledger row, not an invention here.
- **This is not the shipped census query.** R3 measured the defect this contract retires:
  median 2 / p95 9 / max 11 captions and up to 19 marks per selected square with no
  eligibility, selection or budget (`evidence-presentation.md` §2). Here: cap **1 fact**, 6
  marks, selection per §3, scope sentences carried (a denial readable is *current*, never
  permanent — the rung-0 scope correction).
- **Empty:** `stated_absence` — "No rung-0 observation is scoped to that square." (The current
  unreachable variant of this sentence, gap matrix §2c-3, becomes reachable because selection
  exists.)

#### 4.3 `blunder_prevention` — Keep-Me-Safe

- **Intent:** warn about a validated staged-move risk, without naming any alternative.
  **Timing: `at_commit`** — the staged move exists and has not landed (D881). **Initiative:
  proactive, legal only inside an explicitly chosen Support preset** (O4 ruling verbatim:
  *"proactive blunder prevention belongs only to an explicit Support preset and is not the
  rehearsal default"*). Which presets include Support is Phase 5's; this contract only makes
  the module composable there and nowhere else.
- **Accepts (3 rows), all evaluated on the staged-move result position:**
  `rules.tactic.consequence.threat@1` (the declared pass convention),
  `rules.tactic.consequence.mate_in_one@1`, `rules.tactic.reading.loose_piece@1` (the
  moved-piece-en-prise flag — measured robustly negative-primary, 0.36×/0.57×, which is
  exactly why it earns a warning seat rather than a positive-reading seat).
- **Disclosure: narrows, never reveals.** The warning names what the staged move exposes
  ("this leaves your knight capturable at a loss"); it never names a better move, never shows
  the refutation line, and hands the move back (the Chessiverse guard transformed through the
  owner's ruling). The packet compiler refuses move/PV fields at this ceiling. **The boundary
  cases, stated rather than left to an implementer** (added in cross-review): at a forced move
  (exactly one legal move) the warning may still fire and state the staged move's consequence —
  there is no alternative to withhold, so nothing is revealed, and the module never claims the
  consequence was avoidable; at branching factor two, a warning inevitably identifies the
  alternative — that narrowing is inherent to any staged-move warning and is precisely why the
  module is legal only inside an explicitly chosen Support preset (O4), never the rehearsal
  default.
- **The one board-adjacent cue** (D841). Cap 1 fact, 1 mark, 20 words.
- **Empty: `silent`.** A quiet commit is a commit. **The module never says "safe"** — an
  all-clear is a whole-position judgement no rules collector can ground, and criterion A6's
  negative fixture pins this.

#### 4.4 `threat_radar`

- **Intent:** show what the opponent's pieces can do to you, on request. Post-commit for
  everyone; **the pre-commit arm sits under the Support ceiling** (the same owner boundary as
  4.3 — a standing threat display during ordinary rehearsal would be the eval-bar posture in
  warning clothes; Lichess's `x`-key is the on-request field precedent).
- **Accepts (7 rows):** `rules.tactic.consequence.threat@1`,
  `rules.tactic.consequence.mate_in_one@1`, `rules.tactic.reading.loose_piece@1`,
  `rules.tactic.reading.back_rank@1`, `rules.tactic.reading.trapped_piece@1`,
  `rules.tactic.reading.ray_classification@1` (pins/skewers against the learner),
  `derived.tactic.defender_exposure@1` (2d).
- **Grounding honesty:** all seven are rules/convention one-ply facts. Anything deeper than
  the declared conventions follows the engine-condition rule and is **not** in this module.
  D794's measured verdict is encoded, not argued around: threat presence is 0.91×/1.04× —
  *"inspector/negative/on-demand evidence, not a default positive or blunder label"* — hence
  on-request initiative everywhere and no proactive arm at all.
- Cap 3 facts / 4 marks / 2 arrows. Empty: `stated_absence` ("No one-ply threat under the
  declared convention."), plus abstention rendered as itself (`pass_while_in_check`).

#### 4.5 `postcommit_nudge` — the F2 flagship

- **Intent:** name at most two grounded consequences of the move just played. Proactive,
  cap 2 — the scarce proactive right (taxonomy §1, initiative row).
- **Accepts (38 rows):**
  - **8 structural event families** (`rules.structural.event.{backward_pawn, doubled_pawn,
    isolated_pawn, passed_pawn, open_file, half_open_file, king_zone, king_opposition}@1`).
    Deliberately refused: `piece_count` (12 unconditional rows per position),
    `direct_attack_count` and `line_blockers`, plus all 5 transition-geometry families
    (`occupied_attack`, `occupied_defence`, `slider_ray`, `piece_escape`, `defended_duty`) —
    the R3 real-packet lesson made normative: *exact and locally distinctive did not make
    them guidance* (`evidence-presentation.md` §6.1). This is the module-specific
    eligibility-narrower-than-research that F5 was told to compile.
  - **7 transition rule events** (`rules.transition.event.{castled, last_of_role,
    pawn_contact, checkmate, promotion, capture, developed}@1`; `clock_reset` refused —
    bookkeeping, not a consequence).
  - **7 Wave-A events**: `rules.castling.event.rights_lost@1`,
    `rules.tactic.event.double_attack@1`, `rules.tactic.event.check@1`,
    `derived.exchange.capture_class@1`, `derived.exchange.trade_completed@1`,
    `rules.tactic.event.loose_piece@1`, `rules.structural.event.pawn_islands@1`.
  - **10 avoidance rows** (`derived.semantic_avoidance.{backward_pawn, doubled_pawn,
    isolated_pawn, passed_pawn, open_file, half_open_file, king_zone, king_opposition,
    loose_piece, pawn_islands}@1`) — the D745 negative reading facing learners, denominator
    always shown (§3).
  - **5 2d events**: `rules.pawn.event.dynamics@1`, `derived.pawn.event.transitions@1`,
    `rules.king.event.zone_state@1`, `derived.king.captured_zone_defender@1`,
    `derived.activity.event.open_file_occupancy@1`.
  - **1 declared-awaiting**: `derived.grade.move_quality@1` (§5) — post-commit admission under
    the disclosure model; honest-empty until the projection exists.
- **Selection:** the production policy over the F2 complete-population machinery — the first
  production caller of `selectSemanticEvidence`'s mechanism. The measured motivation stands:
  top-k selection reads 5.29× lift at 0.48 entries/ply against the shipped 1.003× at 8.83
  (D543); this module is the policy-bearing consumer that fix has been waiting for.
- **Empty: `silent`** — most moves deserve silence; an empty nudge is the system working.

#### 4.6 `structure_nudge`

- **Intent:** name the *kind* of position, never what is good here — design/05 §3b's one-line
  law is this module's ceiling verbatim: *"A tip may say what kind of position this is and
  what that kind is generally about. It may not say what is good here."*
- **Accepts (6 rows):** `theory.shapes.firing@1` (authored shape entries with provenance),
  `rules.structural.reading.named_structure@1`, `rules.structural.reading.space@1` (2c, the
  D745-ruled convention with its chess-tradition citation),
  `rules.structural.reading.pawn_connectivity@1` (2c), `rules.phase.reading@1` (its
  unclassified band renders as itself — the shipped declaration abstains nowhere
  (`evidence-catalog.ts:341`), so "the phase bands do not classify this position" is a value,
  never a simulated absence), `rules.endgame.reading@1` (named
  technique, §5b: "this is a Lucena; the technique is the bridge" — never "play Rf4").
- Cap 1 card / 80 words. Empty: `stated_absence` — "Nothing recognizes this structure", which
  is also the content-coverage signal (D690/D691's starving is visible instead of silent).

#### 4.7 `theory_breadcrumb`

- **Intent:** link one applicable cited passage to the rehearsal. Facts carry citations
  deterministically fixed outside any LLM output (R5).
- **Accepts (4 rows):** `pack.authored.claim@1` (authored claims with provenance),
  `theory.shapes.firing@1` (the cited plan classes of a fired shape),
  `human.explorer.population@1` (book-presence context — rendered as a theory pointer, never
  a popularity-as-quality verdict), and `theory.opening_identity.record@1` — **declared with
  honest-empty**: the runtime admission of opening identity is refused at HEAD
  (`position-evidence.ts:25`, class 4) and stays refused until the D743/R8/F7 join lands; the
  breadcrumb renders "No opening identity is joined at runtime yet" rather than pretending.
- Cap 1 fact / 60 words. Empty: `stated_absence`.

#### 4.8 `guided_hint` — progressive, disclosure-gated

- **Intent:** reveal progressively, only after explicit request, inside an open disclosure
  boundary (`checkpoint` timing). The stage grammar is the contract:
  - **Stage 1 — pattern**: a named technique or structure fact; reveals nothing.
  - **Stage 2 — subject**: the piece or square that matters; narrows.
  - **Stage 3 — the move/line**: reveals; legal **only** at this stage, only under an open
    disclosure state, and it is the only place in the ordinary-module set where
    `candidate_move`/`principal_variation` content is legal outside review.

  **The stage gate is typed, not prose** (added in cross-review — the draft's outer ceiling of
  `principal_variation` would have let the packet compiler pass PV bytes at stage 1): each stage
  carries its own answer ceiling — stage 1 `pattern`, stage 2 `fact` (subject naming only),
  stage 3 `candidate_move`/`principal_variation` — and the packet compiler enforces the
  **requested stage's** ceiling exactly as it enforces module ceilings (`module-contract.ts:78`'s
  refusal, applied per stage), so a stage-1 or stage-2 packet refuses move/PV material even
  though the module's outer ceiling permits it at stage 3. Stage 2 may name the subject piece or
  square of an admitted stage-3-capable fact as a narrowed disclosure of that same fact; the
  move and the line stay refused until stage 3. A below-3 stage admitting PV bytes is a compile/
  fixture failure, never a rendering choice (criterion A17).
- **Accepts (7 rows):** `live.stockfish.eval@1`, `live.stockfish.pv@1` (stage 3 only —
  per-entry restriction), `live.syzygy.result@1`, `live.syzygy.category@1`,
  `live.syzygy.distance@1`, `rules.endgame.reading@1` (stage-1 material),
  `pack.authored.claim@1` (authored deviation guidance).
- Cap 2 facts and 40 words per stage; 1 mark (stage 2), 1 arrow (stage 3). Empty:
  `unavailable_source` when no engine/tablebase/authored ground exists — named, not faked.

#### 4.9 `compare_coach`

- **Intent:** name the smallest grounded difference between preserved attempts — the
  product's one original claim, rendered.
- **Accepts (8 rows):** `derived.compare.structure_delta@1`, `derived.compare.eval_delta@1`,
  `derived.compare.engine_trajectory@1`, `derived.compare.piece_route@1`,
  `run.record.fork@1`, `run.record.consequence@1`, `run.record.objective_transition@1`,
  `run.record.checkpoint_hit@1`.
- **The D721 repair is normative here:** the module's registered renderer for
  `structure_delta` renders the **operands** (kind, squares, before/after), retiring the
  shipped kind-name placeholder (*"A recorded structural observation changed: ${kind}."*,
  `guidance.ts:60`, verified live at drafting HEAD). Criterion A14 starts red on this.
- Cap 2 facts / 60 words / 2 marks / 2 arrows. Empty: `stated_absence` ("These attempts do
  not differ in anything recorded.").

#### 4.10 `review_map`

- **Intent:** turn the finished run into selected moments with actions (replay, branch,
  drill, theory) — post-game, automatic, `review`-timed, so it discloses under every policy.
- **Accepts (48 rows):** the nudge's 37 compiled event/avoidance rows re-declared for
  `module.review_map` (whole-game selection needs the same grounded events);
  `rules.pivotal.marker@1`; `rules.phase.reading@1`; `rules.endgame.reading@1`;
  `recorded.engine.eval@1`; `recorded.tablebase.result@1`; `live.stockfish.eval@1` and
  `live.stockfish.wdl@1` (on-demand review analysis — a cost/availability term, not a new
  collector); `run.record.objective_transition@1`, `run.record.consequence@1`,
  `run.record.imported_result@1`; and **1 declared-awaiting** `derived.grade.move_quality@1`
  (§5 — the Review-moment selector D879 names as the unblock).
- **Backward detectors are legal here and only here** among proactive surfaces: eval swing
  answers *"where did it turn?"* after the outcome (design/05 §3a's direction table).
- **Availability honesty is mandatory:** R7 measured 0/29 middlegame/endgame mainlines with
  consecutive recorded evals ([[D880]]) — moments without trajectory ground render as
  moments-without-eval, and the map states what it could not compute.
- Cap 3 facts / 80 words / 3 marks / 2 arrows per moment. Moves/PV legal (post-game; note the
  ceiling is slack at landing — no accepted projection here carries a PV, and a ceiling above
  what `accepts` can deliver reveals nothing). **The moment count itself is deliberately not
  bounded here** (named in cross-review rather than left silent): moment selection is the
  Phase-4/R7 lane's contract — D690 measured 13 and 16 exact moments on the two long
  trajectories and refused a fixed minimum, and a fixed maximum is likewise not chosen by this
  RFC. Empty: `stated_absence`.
- **Not the Story.** `review.story` (D687/D688/D689 defects) is untouched here; re-basing the
  Story onto module selection is named follow-up work, not silently absorbed.

#### 4.11 `full_inspector`

- **Intent:** expose attributed raw evidence and lines for deliberate analysis — an explicit
  mode, never the fallback when selection fails, never seated in the play column (the
  placement defect L5–L8 is Phase 4's to fix; this contract makes the play-column placement
  non-conformant by declaring `explicit_surface`).
- **Subsumes, does not duplicate:** the four shipped inspector consumers
  (`inspector.position_structure`, `inspector.move_transition`, `inspector.human_split`,
  `inspector.corpus`) become this module's sub-surfaces; their bindings stay. New rows cover
  ids with no bound inspector home yet.
- **Accepts (34 new rows; +6 by the 2026-08-22 in-place Appendix-B amendment below = 40):**
  the Wave-A inspector readings —
  `rules.tactic.reading.{loose_piece, ray_classification, rook_on_seventh, trapped_piece,
  back_rank, discovered_latency}@1`, `rules.tactic.consequence.{threat, mate_in_one,
  reply_breadth}@1`, `rules.structural.reading.{space, pawn_connectivity}@1`,
  `rules.phase.development@1`, `rules.castling.reading.{rights, legality}@1`,
  `derived.tactic.{discovered_executed, promotion_pressure}@1` (16); the six 2d readings
  (`rules.square.reading.control@1`, `rules.mobility.reading.piece_destinations@1`,
  `rules.pawn.reading.{contacts, candidate_majority}@1`,
  `derived.material.reading.role_signature@1`, `rules.king.reading.zone_state@1`) (6); and
  the attributed source panels — `live.stockfish.{eval, wdl, pv}@1`,
  `human.maia.policy@1`, `human.maia.candidate_wdl@1` (its D744 `inspector_only` disposition
  honored: this is its one home), `human.explorer.population@1`,
  `live.syzygy.{result, category, distance}@1`, `recorded.engine.eval@1`,
  `recorded.tablebase.result@1`, `theory.shapes.firing@1` (12).
- The class-3 operand losses close here as renderer work: `wdl`/`pv`/tablebase detail render
  their **values with attribution**, not "wdl evidence recorded." — the operands are already
  in the payloads (gap matrix §6.4).
- **Appendix-B amendment 2026-08-22 (in place, per RFC-0000 rule 3 — accepted, not
  implemented; play-composition's Discharges D4 and [[D924]]):** the play-composition
  cross-review found four leak destinations routing families this contract could not carry.
  Six rows added: `rules.phase.reading@1` (L1's classifier sentence home),
  `rules.pivotal.marker@1` (L10), the `pack.authored.classifier@1` token (L12), and
  `derived.compare.{structure_delta, eval_delta}@1` plus `derived.story.rank@1` (L13/L15's
  inspector halves — the compare/story derived projections' attributed panels). Counts:
  inspector 34 → **40**; totals 175/173 → **181/179**. The [[D523]] lesson at the contract
  seam: a leak's destination must be checked for *permission*, not just existence.
- Cap 20 facts / 400 words / 20 marks / 8 arrows. Empty: `stated_absence` per family. All
  rungs, everything attributed.

### §5 — Move-quality grades: a projection, not a module (the D879 decision)

**Decision: grades are one derived projection (`derived.grade.move_quality@1`) consumed by
`postcommit_nudge` and `review_map` — not a twelfth module.** The argument:

1. **A grade has no intent, initiative or learner action of its own.** It is one fact about
   one move. Module-hood would give it a standing surface with its own timing and initiative —
   which is precisely the refused cell (*always-on move grading during play*, taxonomy §3b),
   whose ruled transformation is already "post-commit nudge under disclosure." The
   transformation names the consuming modules; it does not name a grade surface.
2. **D879's own words shape it as evidence:** *"one derived projection over recorded/live eval
   deltas + a versioned per-context convention document."*
3. **The co-render rule is an operand-fidelity property, and operand fidelity is a projection
   contract.** *Word + number + threshold + convention version rendered together as one fact*
   is checkable at the adapter/renderer seam; a module cannot guarantee the co-rendering of
   some other module's output. Printing the number is grounded; printing only the word
   launders a convention as a fact (§4a-layer-2, quoted).
4. **The refusals are enforceable at the projection:** praise-classes (`Best`, `Brilliant`)
   are refused — a class whose threshold sits **on** the instrument's optimality boundary is
   a verdict, not a measurement (engine-condition rule clause 2); rating is not an operand,
   so rating-conditioning (R15) is structurally impossible; and if a grade ever *fires*
   anything (a Review-moment trigger), all four engine-condition clauses bind.
5. **Timing is inherited, not owned:** post-commit/review only — the projection is admissible
   exactly in the modules whose timing already says so, under the disclosure model. The
   Lichess two-ladder precedent means the convention is declared **per context and
   versioned**; the convention document is the grade-family RFC's to write.

**Registration is not this RFC's** (no new collectors): the two rows are **declared-awaiting**
in the registry and compile only when the grade-family projection lands (`## Discharges` D3,
proposed row D899). Until then both consumers render honest-empty for the family — the
availability rule, working.

### §6 — Registry binding into F1's manifest

1. **`MODULE_DECLARATIONS`** — the closed, frozen list of 11 `ModuleDeclaration` objects in
   `packages/runtime/src/evidence-catalog.ts`, digest-contributing. Registry invariants
   compiled at startup and by `make evidence-manifest-check`: exactly one `board_adjacent`
   module; avoidance rows never in pre-commit/at-commit modules; every `accepts` id resolves
   to a compiled projection (declared-awaiting ids live in a separate `awaiting` list per
   module, not in `accepts`); every module with a non-empty `accepts` has exactly one
   consumer.
2. **Consumers**: ten new consumer ids `module.sight_on_request` … `module.full_inspector`
   (all eleven minus registry-only `rules_floor`), version 1, appended to
   `EVIDENCE_CONSUMER_IDS`. Each consumer declaration mirrors its module's timing, roles,
   forms, answer content and budgets — and per F1's law, its adapters **only narrow**.
3. **Eligibility**: `PRODUCTION_ELIGIBILITY_DECLARATIONS` — the 179 literal compiled rows of
   Appendix B — joined into `EVIDENCE_MANIFEST.eligibility` beside the 40 research rows
   (which are byte-identical after this change). The manifest digest moves; the docs tuple in
   `docs/semantic-evidence.md` and `docs/evidence-contract.md` moves in the same change.
4. **Selection policy**: `production.module_local@1` added to `EVIDENCE_SELECTION_POLICIES`
   with the §3 ordering and the unchanged `criticalEvents` reference; the R2 research policy
   and its sealed fixtures are untouched.
5. **`/capabilities`** reports the module count and per-module availability states alongside
   the existing tuple — availability is runtime state, distinct from static capability, as F1
   already draws the line.

#### 6.1 The sealed packet and its renderers

A module packet is constructed only through F1's brands: admission via `evidenceForConsumer`
(→ `ConsumerEvidenceView`), rendering via `renderEvidenceItems(view, renderers)` (→ the
branded **`RenderedEvidenceView`** of F1 §6.1 — bound to, not reinvented). Sentences exist
only as a registered per-projection renderer's output over an admitted item's payload; a
forged plain object fails the runtime brand assertion (`EVIDENCE_GENERIC_BYPASS`), which the
R3 real-packet arm already proved at this exact seam. Deterministic rendering is normative and
is the provider-off output, byte-for-byte.

#### 6.2 What the LLM receives

**Only the sealed, selected module packet** — the `RenderedEvidenceView` for that module at
that decision point, post-eligibility, post-selection, with citations and provenance already
fixed deterministically outside its output.

#### 6.3 What the LLM may and may not do

May: alter wording, tone, order, brevity and **hint obtuseness within the contract** — a
stage-2 hint may be phrased more or less pointedly, but the stage grammar caps what content
any phrasing can carry, and `voiceCheck`'s allow-list is derived from the same admitted items.

May not — each refusal mechanically enforced, not aspirational: **select facts or determine
relevance** (selection precedes it); **grade moves** (`BANNED_JUDGEMENTS` plus the §5
projection rule); **infer plans or invent theory** (law 8; plan language only via cited shape
entries); **drop citations** (R5's measured failure: schema-valid hosted responses dropped
required citations in conformance runs — every provider/model version passes the conformance
set or falls back to deterministic rendering); **contradict an honest-empty result** (an
empty packet admits no generated sentence at all — the deterministic empty sentence ships);
**raise assistance, choose a rung, module or preset** (R5, verbatim).

### §7 — The landing-order seam and the declared-but-unlanded rule

At drafting HEAD, 2c is **implementing** (part of its Appendix already compiled: the producer
ids `rules.exchange`, `rules.tactic`, `rules.castling`, `derived.exchange`, `derived.tactic`
and several event ids are in the catalogue; `loose_piece`/`pawn_islands` events and the
remaining readings are in flight) and 2d was **draft in independent acceptance review** — it has
since been **accepted** (2026-08-22, five in-place convention repairs, [[D895]]) with its 18-id
Appendix A byte-identical, verified in cross-review. The rule, stated once and binding:

- An eligibility row compiles only when its projection id exists in the compiled catalogue —
  F1 makes anything else a build failure, which is the guard, not a problem.
- This RFC's **implementation therefore lands after 2c and 2d land** (the plan's own
  sequencing: *"module declarations bind real ids rather than forecasts"*). The drafted
  contingency — "if 2d's acceptance changes any of its 18 ids, Appendix B is amended" — is
  resolved: 2d's acceptance changed none of them, verified against the accepted Appendix A in
  cross-review; ids are cited from a closed accepted list, never guessed.
- The two grade rows and the opening-identity runtime join follow the same rule at their own
  pace (§5; 4.7): **declared, honest-empty, never faked.**

## Deviations from design

1. **`docs/semantic-evidence.md` says F5 adds consumers, eligibility, adapters, policy "and
   workflow defaults together."** This RFC splits workflow defaults out to Phase 5, per the
   D717 program routing and R3's unmet owner-use exit — choosing preset defaults here would
   be choosing them without the validation R3 requires. Docs follow implementation; the split
   is named rather than silent.
2. **`rules_floor` registers no evidence consumer** (4.1) — a deliberate reading of F1's
   bound-or-disposed law for a module that consumes interaction affordances, not evidence.
   The registry entry carries the explicit `evidence: none` marker.
3. **The timing vocabulary extends the R3 research enum** with `at_commit` (§2) — an
   extension of research tooling on D881's ruling, not a design deviation; design/05 carries
   no closed timing enum. The DESIGN-GAP for the sound form (D880) is honored by refusal, not
   resolved here.
4. Otherwise none: the silence default, disclosure model, §3b naming law, O1–O4 amendments
   and the D745 rulings are load-bearing constraints this RFC implements.

## Acceptance criteria

Every criterion can fail (D444/D451/D522); fixtures name their negative arms. Counts state
unit and total and match the tables they verify.

1. **A1 — Registry completeness.** All 11 module ids (unit: module id; total 11, §4 caption)
   exist in `MODULE_DECLARATIONS` with all thirteen §1 fields; `make evidence-manifest-check
   semantic-evidence-check` passes; the docs tuple moves in the same change. Negative: a
   twelfth module id, or a module missing `emptyBehavior`, fails compilation.
2. **A2 — Eligibility rows.** The compiled manifest contains exactly the **179** Appendix-B
   compiled rows (unit: `(projection, consumer)` pair) — no more, no fewer — and the 40
   research rows byte-identical. The 2 declared-awaiting grade rows are **absent** from the
   compiled manifest and present in the registry's `awaiting` lists; a test asserts both
   directions so the criterion cannot pass vacuously while the grade rows silently compile.
3. **A3 — Narrowing.** Every `module.*` consumer's declared timing/roles/forms/answer/budget
   equals or narrows its module declaration; F1's widening check fails on a widened fixture.
4. **A4 — At-commit distinctness.** A fixture stages a move without committing: only
   `blunder_prevention` may produce output; a `post_commit` module producing output at the
   staged state is a failure. Negative: the fixture run with the staged move committed
   flips which modules may fire.
5. **A5 — Packet seal.** Every module packet is a brand-asserted `RenderedEvidenceView`; a
   structurally identical forged object is refused (`EVIDENCE_GENERIC_BYPASS`); a sentinel
   token absent from admitted items is refused by `voiceCheck`; the LLM request body is
   serialized only from the brand-asserted view.
6. **A6 — Honest empty, per module.** For each evidence-bearing module a zero-eligible
   fixture renders exactly its declared `emptyBehavior`. Negative pins: `blunder_prevention`
   emits **no bytes** on empty (no "safe" claim exists anywhere in its renderer table);
   `theory_breadcrumb` renders the opening-identity absence sentence while
   `position-evidence.ts:25`'s refusal stands.
7. **A7 — Deterministic selection and the lift boundary.** Selection output is byte-identical
   across runs and across permuted input order; a two-fact same-class tie resolves by the
   declared keys, including the reading-shaped operand-serialization key. **Negative (the R3
   guard), three arms:** (a) a fact whose family lift is maximal but whose projection id is not
   in the module's `accepts` must not appear, at any budget; (b) with the admitted set within
   `maxFacts`, swapping two lift values reorders the packet without changing its membership;
   (c) with the admitted set exceeding `maxFacts`, swapping two lift values changes which
   admitted facts fill the budget while admitting nothing outside `accepts` — the arm that
   distinguishes "lift reordered the packet" from "lift changed membership" at the only place
   lift can lawfully touch membership, so the fixture fails against any policy that lets lift
   cross the admission boundary and also fails against one that pretends the budget cut is
   lift-free.
8. **A8 — Denominator rule.** An avoidance fact whose payload lacks the complete
   numerator/denominator is refused at admission; the rendered sentence contains the
   denominator; the registry invariant rejects (at compile) an avoidance row bound to a
   module with a `pre_commit` or `at_commit` timing.
9. **A9 — Backstops, rewritten by the reducer amendment (2026-08-23).** The drafted text
   ("facts beyond `maxFacts` are never admitted") is **withdrawn**: it contradicted A7 arm (c)
   and made the D906 instrument unobservable (§3a.1). The criterion is now: admission is on
   semantics alone; reducers run; **only then** does `applyBackstop` truncate, and a
   post-reducer set exceeding `maxFacts` emits exactly one `reduction_quality@1` observation
   before truncating (silent truncation fails the fixture). Unused budget stays empty, never
   back-filled. A fact outside `accepts` is never admitted **at any budget** (A7 arm (a)
   unchanged). A deterministic-renderer output exceeding `maxWords` fails its fixture;
   marks/arrows beyond caps are not drawn.
10. **A10 — One board-adjacent cue.** Exactly one module declares `board_adjacent`; a test
    flipping a second module's seat class fails the registry invariant.
11. **A11 — Scope silence.** The diff contains no preset names, no workflow defaults, no
    layout/composition code, no `AssistanceConfig` version move, no new collector producer,
    and no bot-policy symbol. Grep-based, able to fail.
12. **A12 — Research surfaces unmoved.** The R2 selection-policy fixtures re-run unchanged;
    `criticalEvents` byte-identical; the 40 research eligibility rows byte-identical;
    manifest diff shows additions only.
13. **A13 — Refusals.** No module renderer emits valence words (`BANNED_JUDGEMENTS`
    honored); no grade word can appear without number + threshold + convention version in the
    same fact (fixture: a grade payload missing its threshold is refused — red until the
    grade family lands, at which point it must hold); learner rating appears in no packet
    input type (R15 — a type-level fixture under `@ts-expect-error`).
14. **A14 — The D721 repair (starts red).** At pre-implementation HEAD the voice renderer for
    `derived.compare.structure_delta@1` emits the kind-name placeholder (`guidance.ts:60`,
    verified); the committed fixture demands operands (kind, squares, before/after) in both
    screen and voice paths and is verified failing before the fix, green at landing.
15. **A15 — Register silence.** `node tools/register-check.mjs` passes with `none`;
    `node tools/status-parity.mjs` passes once the index row for this RFC exists; no
    schema/migration/content bytes move.
16. **A16 — Closeout.** The landing commit flips this RFC's recorded ledger rows, appends the
    `planning/exploration/log.md` entry in the same commit (the CLAUDE.md ledger-and-log
    clause), and writes the discharge SHAs into `rfc/tactical-collectors.md`'s D1 and D2 rows
    **and `rfc/breadth-collectors.md`'s D1 row** (all three tables name the Phase-3 module
    RFC's landing commit as the recording site — the draft omitted the breadth row; corrected
    in cross-review).
17. **A17 — Stage gate (guided_hint).** Against a position with an admitted
    `live.stockfish.pv@1` fact: the stage-1 packet contains pattern content only; the stage-2
    packet names at most the subject piece/square and contains no move, line or PV bytes; the
    stage-3 packet under an open disclosure state may contain them. Negative: a stage-2 packet
    carrying the PV fails the per-stage compiler refusal; a stage request outside an open
    disclosure boundary renders the module's declared empty state, never a deferred reveal.

18. **A18 — The reducers, six able-to-fail fixtures (reducer amendment).** Each arm names the
    defect it catches; all six are red against any pipeline that omits the step.
    **(a) Cross-projection duplicate**: a position carrying both
    `rules.structural.predicate.isolated_pawn` and `rules.structural.reading.isolated_pawn`
    (same colour, same file) delivers **one** fact. Red against a selector keying on projection
    id — i.e. against `observationIdentity` used as-is.
    **(b) Asymmetric subsumption**: with the checkmate/check row declared, a checkmate move's
    packet contains no separate check fact; and the reverse input (check present, checkmate
    absent) retains the check — proving the relation is directed, not a symmetric merge. A
    control asserts `passed_pawn` + `isolated_pawn` on one pawn **both survive** (no row ⇒
    unrelated).
    **(c) Unavailable history**: with the ancestor path unreadable, the packet is byte-identical
    to the no-novelty packet **and** carries `noveltyAbstained: true`. Red against an
    implementation that treats missing history as "everything is novel".
    **(d) Novelty-window boundary**: a fact repeated at ancestor distance `noveltyWindow` is
    dropped; the same fact at distance `noveltyWindow + 1` survives. Pins the bound as declared
    rather than incidental.
    **(e) Overflow emission**: a module whose post-reducer set exceeds `maxFacts` emits exactly
    one `reduction_quality@1` observation whose `dropped` equals `afterReducers - backstop`, and
    a throwing recorder changes neither the packet bytes nor the move outcome.
    **(f) The polarity control** — *the arm that must never go green by accident*:
    `rules.structural.event.isolated_pawn` and `derived.semantic_avoidance.isolated_pawn` in one
    packet are **not** collapsed. Both are generated from the same family list
    (`evidence-catalog.ts:124`), so this fails against every family-name-based identity — and
    collapsing them would invert a fact's polarity in front of a learner.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Preset/workflow activation of the ordinary modules — this RFC registers production modules with no preset layer by scope; without Phase 5 they are reachable only by fixtures and the explicit inspector/review surfaces, and the chain's last two links stay open | `planning/evidence-foundation-ux/plan.md` | the Phase-5 preset RFC's landing commit | |
| D2 | Board-protected composition seating the declared seat classes across viewports — the D718/D841 rebuild; module contracts make the play-column placement non-conformant but only Phase 4 relocates it | `planning/evidence-foundation-ux/plan.md` | the Phase-4 composition RFC's landing commit | |
| D3 | The grade-family projection + versioned per-context convention document ([[D879]]) so the two declared-awaiting rows compile; praise-class refusal and never-rating-conditioned carried into that RFC verbatim | `planning/evidence-foundation-ux/plan.md` | the grade-family RFC's landing commit | |
| D4 | **Durable novelty and durable reduction pressure** (reducer amendment 2026-08-23) — §3a.4's novelty is bounded to the current branch's ancestor path by recomputation, and §3a.5's instrument measures pressure over the corpus, not per learner over time. Cross-run/cross-session novelty and durable pressure capture need a persisted delivery record, which is `longitudinal-store`'s grain (accepted; it owns durable learner-facing projections and holds its own migration position). This RFC deliberately claims none and defers both | longitudinal-store | the longitudinal-store implementation commit that adds a module-delivery projection | |

The unusual honesty note, stated rather than buried: until D1 discharges, the modules are
production-registered but preset-inert. Concretely — the day this RFC lands, **nothing new
renders to a learner**: `full_inspector` reaches a screen only through the four pre-existing
inspector bindings it subsumes; `review_map` and every rail module wait on Phase-4 seating (D2)
and Phase-5 activation (D1); the only executable consumers of the new rows are fixtures and the
`/capabilities` report. That is **not** the class-9 wall rebuilt one level up: the class-9 rows
named a research consumer *by design with no successor*; these rows name production consumers
whose activation owner is a scheduled, blocked-on-this-RFC phase, held open here — and in the
two accepted collector RFCs' own discharge tables — as discharges that prevent any of the three
RFCs from ever archiving around it.

## Open questions

1. ~~Budget numbers are candidate bounds~~ **RULED 2026-08-22 (owner): *"why this
   arbitrary? we need better reducers, not arbitrary limits."* Budgets are DEMOTED from
   mechanism to backstop.** The reduction mechanism is the selection policy itself — typed
   admission, critical-event ordering, the versioned lift table, and (new obligation, D906)
   **semantic reducers**: same-fact deduplication across projections, subsumption (a fact
   entailed by an already-selected fact is dropped), and per-position novelty against the
   learner's recent packets. The numeric caps stay only as **overflow backstops with an
   instrument obligation**: a module whose reducer output EXCEEDS its backstop logs a
   reduction-quality event rather than silently truncating, so cap pressure is measured and
   the reducers improve where the pressure is — never tuned by feel. Backstop values are
   claude/implementer-adjustable without ceremony; the *mechanism* question is closed.
   **SPECIFIED 2026-08-23 (reducer amendment).** This clause named the reducers and defined
   none of them; codex returned the RFC on buildability (`c4d3c8c`) and was right to. §3a now
   carries the executable contracts — one pipeline, `factIdentity@1`, the closed declared
   `SUBSUMPTION@1` table, `positionNovelty@1` as a bounded recomputation with a true abstention,
   and `reduction_quality@1` with its sink, failure rule and reader — plus A18's six able-to-fail
   fixtures. The obligation is discharged in text; the return loop remains the check.
2. **Threat radar's pre-commit arm is the one place this draft exceeds a literal ruling**
   (sharpened in cross-review — the P3(c) pattern, named rather than presupposed): O4
   pre-commit-authorizes exactly two things — requested exact sight and Support-preset
   proactive blunder prevention (`assistance-surface-taxonomy.md` §5.1: *"the only
   pre-commit-timed modules that exist"*) — and an on-request, Support-gated threat display is
   neither, however close the analogy. The owner decides at acceptance, three ways: (a) strike
   the pre-commit arm — the module becomes post-commit only, **the conservative default this
   contract falls back to if the question is unruled at acceptance**; (b) admit the arm inside
   Support as drafted; (c) admit requested threat display outside Support (the Lichess `x`-key
   shape). One timing entry and one ceiling term move; no structural change on any branch.
3. **The grade convention** (cite Lichess win%-drop vs declare our own; per-context ladders)
   belongs to the grade-family RFC (D3), not here.
4. **Review Story re-basing** onto module selection (D687/D688/D689) is named follow-up work
   for the Phase-4/R7 lane; this RFC's `review_map` deliberately does not absorb
   `review.story`.
5. **2d acceptance drift — RESOLVED in cross-review**: 2d was accepted 2026-08-22 with all 18
   Appendix-A ids unchanged (the five [[D895]] repairs are convention-text and fixture repairs,
   not id moves); Appendix B is verified against the accepted list (§7).

## Ledger rows (recorded as D898–D901 — the acceptance review of `breadth-collectors` took D895–D897 concurrently; verified recorded in `design/BACKLOG.md` at cross-review, ledger head D902)

The recorded D898 row still carries the drafted 179/177 counts; the landing flip corrects it to
175/173 with this changelog as the citation (the recorded row is the register's to flip, not
this document's to rewrite).

- **D898** — Phase-3 module-contract RFC drafted: 11 module contracts, 175 declared /
  173 compiled eligibility rows (drafted 179/177; four sight rows removed in cross-review), one
  production selection policy, at-commit timing slot, grades ruled a projection, sealed-packet
  LLM boundary bound to F1 §6.1. (this file)
- **D899** — Grade-family projection RFC needed: `derived.grade.move_quality@1` + versioned
  per-context convention document, the D879 executable; two declared-awaiting rows in the
  module registry wait on it (Discharges D3).
- **D900** — Module arrow forms ride retained operands; the system-arrow vector producer
  (D546 form (c)) remains unbuilt and is now consumed-by-declaration in the **seven** module
  contracts carrying a nonzero `maxArrows` (the recorded row says four — corrected here; the
  count is re-derivable from the §4 table) — route to the Phase-4/form lane rather than leaving
  it orphaned. Arrow vectors come only from admitted facts whose payloads already retain ordered
  move/ray operands (a threatened move, a capture line, a ray, a PV move); a fact retaining only
  square *sets* draws marks, never arrows.
- **D901** — `review.story` remains outside module selection by scope (open question 4);
  D687/D688/D689 stay open with a named successor lane.

## Changelog

- 2026-08-23: **reducer amendment, clearing codex's buildability return `c4d3c8c`**
  (`planning/learner-modules/implementation-return.md`). The return was correct and the debt was
  the author's: the D906 ruling's three semantic reducers were named and none was defined, and
  §3 step 3 ("keep the top `maxFacts`") contradicted A9 ("never admitted") and OQ1 ("rather than
  silently truncating") — three readings a green fixture could not distinguish. Added **§3a**:
  one ordered pipeline (`reduceModulePacket@1`, six total/deterministic steps, none widening
  under the `EVIDENCE_DERIVATION_WIDENS` discipline); **`factIdentity@1`** as
  `(equivalenceClass, subjectKey)` with unregistered ⇒ unrelated, stating why
  `observationIdentity` (`structure.ts:591`) cannot serve — it accepts only
  `StructuralObservation` and keys on no projection id, so one fact through two projections is
  two facts by construction; the closed directed **`SUBSUMPTION@1`** table with a
  `groundIsRules` registry invariant so no row can encode a strategic judgement (law 8);
  **`positionNovelty@1`** as a bounded *recomputation* over the current branch's ancestor path —
  no new persistence, no process-local memory, and a true abstention (`noveltyAbstained`) when
  history is unreadable rather than the dishonest "everything is novel"; and
  **`reduction_quality@1`** with its typed fields, injected `ReductionQualityRecorder` sink,
  swallow-after-count failure rule (an instrument failure never widens assistance or fails a
  move) and its reader `make reduction-pressure`. **The `maxFacts` contradiction is resolved in
  favour of truncate-after-reducers**, because a cap cutting at admission makes the ordered
  instrument unobservable and because A7 arm (c) already pinned lift filling scarce slots; **A9
  is rewritten** accordingly and "never admitted" survives only as the outside-`accepts` rule.
  Declaration gains a 14th field, `noveltyWindow` (default 3; `0` for `rules_floor` and
  `blunder_prevention`), so the shipped `2a54d05` checkpoint must widen its type and
  completeness check. New **A18** carries six able-to-fail fixtures, including the polarity
  control that keeps `rules.structural.event.isolated_pawn` and
  `derived.semantic_avoidance.isolated_pawn` distinct — both are generated from the same family
  list (`evidence-catalog.ts:124`), so every family-name-based identity fails it and collapsing
  them would invert a fact's polarity in front of a learner. New **Discharge D4** defers durable
  cross-run novelty and durable pressure capture to `longitudinal-store`. Claims unchanged:
  **none**.
- 2026-08-22: adversarial cross-review (independent), at HEAD `3a06349` (manifest tuple
  unchanged: 25/146/25/182 core, 40/40/15/1 semantic, digest `fa700584…`; ledger head verified
  D902; all cited symbols re-verified — `position-evidence.ts:25`, `guidance.ts:60`,
  `module-contract.ts:78`, `board-input.ts:legalDestinations`, `BANNED_JUDGEMENTS`,
  `EVIDENCE_GENERIC_BYPASS`; `register-check`/`status-parity`/`intent-parity` green with the
  draft present). Blocker corrections, each with its evidence: **(1)** `sight_on_request`
  admitted five 2d readings as "exact" while the accepted `breadth-collectors` declares three
  of them convention-grounded (`piece_destinations` via `local-non-losing@1`,
  `candidate_majority` via the D788 convention, `zone_state` via `king-zone@1`/`king-shelter@1`)
  — removed as failing the module's own admission test; `outpost` removed with them because its
  matcher consumes the D566-defective `pawnSafety` (`structure.ts:352`), the same ground on
  which the draft already excluded `pawn_safe_square`. Eligibility totals corrected
  **179/177 → 175/173** (sight 24 → 20); Appendix B, §4 caption, §6.3, A2 and the D898 draft
  text updated; the recorded BACKLOG rows carry the old counts until the landing flip.
  **(2)** The guided-hint stage gate was prose over an outer `principal_variation` ceiling that
  the packet compiler would not have enforced at stages 1–2 — per-stage answer ceilings are now
  typed contract with new criterion A17 (law 8's sharpest edge in this document). **(3)** The
  §1.7 effective-assistance formula misquoted design/05 §3-forms (`role` for `honesty/access`)
  — restored, with the role-set encoding stated as the narrowing image; the [[D659]]
  no-widening-of-the-visible-board rule added as a binding class rule. **(4)** The module
  form/answer/timing vocabularies had no pinned image onto the shipped `EvidenceForm` /
  `AnswerDistance` / `EvidenceTiming` unions — mappings pinned, and the `at_commit` extension of
  the catalog-local `EvidenceTiming` union is now named rather than implicit (the D523 class,
  three instances). **(5)** §3's "lift can never change membership" over-claimed: within a
  scarce budget lift lawfully decides which admitted facts fill it (design/05 §3 clause 3) —
  restated, A7 rewritten to three arms distinguishing reorder from budget-fill from
  admission-crossing. **(6)** A16 omitted `rfc/breadth-collectors.md`'s D1 from the discharge
  recording — added (Motivation likewise). **(7)** Staleness against the moved tree repaired:
  2d is accepted with its 18 ids unchanged (OQ5 resolved; Depends-on/§7 updated); D898–D901 are
  recorded, head D902. Also: `module-lift@1` governance pinned against D368 (per-row corpus/
  commit/date anchors, changelog-only changes); selection ties totalized for reading-shaped
  candidates (operand-serialization final key); blunder-prevention forced-move and
  branching-factor-two behavior stated; OQ2 sharpened — the pre-commit threat arm exceeds the
  literal O4 ruling and RULED 2026-08-22 (owner): **pre-commit, inside the Support preset only, on-request, never proactive** — the draft's arm as proposed, now carried by an explicit O4 extension recorded at D906 rather than presupposed; review-map
  moment-count scope and PV-ceiling slack named; D900's arrow-consumer count corrected to the
  seven nonzero-`maxArrows` modules; phase-reading "abstention" claim aligned with the shipped
  no-abstention declaration; preset-inert honesty note made concrete (nothing new renders at
  landing until D1/D2 discharge).
- 2026-08-22: created. Drafted at HEAD `e15123c` (manifest tuple 25/146/25/182 core,
  40/40/15/1 semantic, digest `fa700584…`; module/workflow-id production grep 0 hits; ledger
  head D894). All projection ids verified against the compiled catalogue, the 2c Appendix A
  (30 ids) and the 2d Appendix A (18 ids); D721's placeholder verified live at
  `guidance.ts:60`; D745/D841/D879/D880/D881/D893 encodings quoted from their rows.

## Appendix B — eligibility row enumeration

Unit: **eligibility row** — one literal `(projection id, module consumer id)` pair. Total
declared: **181**; compiled at landing: **179**; declared-awaiting: **2** (marked ◇). This is
the closed list A2 counts; adding or dropping a row is a spec change with a changelog line.

| module consumer | rows | n |
|---|---|---:|
| `module.sight_on_request` | `rules.structural.reading.{backward_pawn, isolated_pawn, doubled_pawn, passed_pawn, open_file, half_open_file, line_blockers, direct_attack_count, piece_reach_count, named_structure, bishop_on_shade, king_opposition, piece_count, king_zone, piece_distance}@1` (15); `rules.castling.reading.{rights, legality}@1` (2); `rules.tactic.reading.rook_on_seventh@1` (1); `rules.square.reading.control@1`, `rules.pawn.reading.contacts@1` (2) | 20 |
| `module.blunder_prevention` | `rules.tactic.consequence.{threat, mate_in_one}@1`, `rules.tactic.reading.loose_piece@1` | 3 |
| `module.threat_radar` | `rules.tactic.consequence.{threat, mate_in_one}@1`, `rules.tactic.reading.{loose_piece, back_rank, trapped_piece, ray_classification}@1`, `derived.tactic.defender_exposure@1` | 7 |
| `module.postcommit_nudge` | `rules.structural.event.{backward_pawn, doubled_pawn, isolated_pawn, passed_pawn, open_file, half_open_file, king_zone, king_opposition}@1` (8); `rules.transition.event.{castled, last_of_role, pawn_contact, checkmate, promotion, capture, developed}@1` (7); `rules.castling.event.rights_lost@1`, `rules.tactic.event.{double_attack, check, loose_piece}@1`, `derived.exchange.{capture_class, trade_completed}@1`, `rules.structural.event.pawn_islands@1` (7); `derived.semantic_avoidance.{backward_pawn, doubled_pawn, isolated_pawn, passed_pawn, open_file, half_open_file, king_zone, king_opposition, loose_piece, pawn_islands}@1` (10); `rules.pawn.event.dynamics@1`, `derived.pawn.event.transitions@1`, `rules.king.event.zone_state@1`, `derived.king.captured_zone_defender@1`, `derived.activity.event.open_file_occupancy@1` (5); ◇ `derived.grade.move_quality@1` (1) | 38 |
| `module.structure_nudge` | `theory.shapes.firing@1`, `rules.structural.reading.{named_structure, space, pawn_connectivity}@1`, `rules.phase.reading@1`, `rules.endgame.reading@1` | 6 |
| `module.theory_breadcrumb` | `pack.authored.claim@1`, `theory.shapes.firing@1`, `human.explorer.population@1`, `theory.opening_identity.record@1` | 4 |
| `module.guided_hint` | `live.stockfish.{eval, pv}@1`, `live.syzygy.{result, category, distance}@1`, `rules.endgame.reading@1`, `pack.authored.claim@1` | 7 |
| `module.compare_coach` | `derived.compare.{structure_delta, eval_delta, engine_trajectory, piece_route}@1`, `run.record.{fork, consequence, objective_transition, checkpoint_hit}@1` | 8 |
| `module.review_map` | the 37 compiled `module.postcommit_nudge` event/avoidance ids re-declared (37); `rules.pivotal.marker@1`, `rules.phase.reading@1`, `rules.endgame.reading@1` (3); `recorded.engine.eval@1`, `recorded.tablebase.result@1` (2); `live.stockfish.{eval, wdl}@1` (2); `run.record.{objective_transition, consequence, imported_result}@1` (3); ◇ `derived.grade.move_quality@1` (1) | 48 |
| `module.full_inspector` | `rules.tactic.reading.{loose_piece, ray_classification, rook_on_seventh, trapped_piece, back_rank, discovered_latency}@1`, `rules.tactic.consequence.{threat, mate_in_one, reply_breadth}@1`, `rules.structural.reading.{space, pawn_connectivity}@1`, `rules.phase.development@1`, `rules.castling.reading.{rights, legality}@1`, `derived.tactic.{discovered_executed, promotion_pressure}@1` (16); `rules.square.reading.control@1`, `rules.mobility.reading.piece_destinations@1`, `rules.pawn.reading.{contacts, candidate_majority}@1`, `derived.material.reading.role_signature@1`, `rules.king.reading.zone_state@1` (6); `live.stockfish.{eval, wdl, pv}@1`, `human.maia.{policy, candidate_wdl}@1`, `human.explorer.population@1`, `live.syzygy.{result, category, distance}@1`, `recorded.engine.eval@1`, `recorded.tablebase.result@1`, `theory.shapes.firing@1` (12) | 34 |
| `rules_floor` | — (registry-only; `evidence: none`) | 0 |

Cross-check: 20+3+7+38+6+4+7+8+48+40 = **181**; minus the two ◇ rows = **179** compiled (inspector 34→40 per the D924 amendment).
