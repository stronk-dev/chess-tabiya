# RFC: Module registration — the eleven declarations, the compile site, and the seats

- **Status:** draft — returned 2026-08-26 by independent buildability review on
  [[D1585]]–[[D1591]] (`planning/learner-modules/module-registration-cross-review.md`); prior
  amendment 2026-08-26 on [[D1564]]/[[D1568]]/[[D1569]]/[[D1577]]/[[D1578]] and the rebuilt
  `hint-distance` contract. The [[D1430]] document: the learner-module layer exists as a
  contract, a compiler, a reducer pipeline and a preset algebra, and **has never been
  instantiated**. This RFC writes the instances, calls the compiler in production, and gives each
  module a seat a person can look at.
- **Author:** claude (drafted on the [[D1430]] audit, re-verified line by line at HEAD `f0d5460`)
- **Created:** 2026-08-24
- **Design refs:** `design/05-in-run-experience.md` §1 (the six invariants — *"absence is stated,
  never simulated"* is this document's load-bearing one), §2 (the five regions), §3/§3-forms as
  amended by O1/O4 (source risk, form orthogonality, the config algebra), §3a (silence is the
  default), §3a-i (the disclosure model), §3b (naming-never-recommending);
  `design/03-product-breadth.md` §Intelligence and explanation. **Design tier is consumed here,
  never written** (law 5): every region name, invariant and ladder clause below is quoted from
  `design/05`, and this RFC proposes no change to it.
- **Exploration gate:** the D717 program (`planning/evidence-foundation-ux/plan.md`), Phase 3 —
  already open; this RFC completes the phase's unbuilt half rather than opening a new question.
- **Depends on:** accepted `rfc/learner-modules.md` (the fourteen-field contract, the closed
  eleven ids, the timing/form/answer vocabularies, the reducer pipeline, Appendix B) — **this RFC
  is its registry half, and amends it in six places (§0.2)**; implementing
  `rfc/intent-presets.md` (the preset/context algebra, shipped and executing at
  `packages/runtime/src/presets.ts:97`); implementing `rfc/play-composition.md` (the companion
  region, the seat mechanics of its §4, the leak-destination table of its §5);
  implementing `rfc/move-quality-grades.md` (its projection landed — §0.3);
  accepted `rfc/tactical-collectors.md` and `rfc/breadth-collectors.md` (the projection ids).
  The arrow form additionally consumes `rfc/evidence-presentation.md`'s amended sealed
  `relation_overlay`; the existing identity-preserving transition-event layer, its literal
  relation adapters, and the measured per-family guided-hint horizon **and disclosure** registries are mandatory
  dependencies, not optional availability arms. The legacy count readings remain compatibility
  inputs for pack predicates and do not become a second learner-facing event authority.
- **Parent / amends:** amends `rfc/learner-modules.md` §1.6 (the answer-ceiling image, which as
  shipped is an exact-match map and not a ceiling), §1.7 (`ceilings.sessions`/`ceilings.roles`,
  undeclared for all eleven — [[D1206]]), §4.2 (`outpost`/`pawn_safe_square` return on the owner's
  own [[D906]](2) ruling now that [[D566]] is closed), §4.4 and §4.10 (two ceilings corrected to
  what their `accepts` can deliver), Appendix B (the six-row arithmetic error — [[D1205]]), and
  §3a.2 (the novelty identity closure — [[D1164]]). Amends `rfc/play-composition.md` §4's
  `review_map` seat row and §5.1's vocabulary law in one clause each (§3.5). Amends
  `packages/runtime/src/module-contract.ts` (`MODULE_ANSWER_IMAGE`, one new per-entry field) and
  `packages/runtime/src/module-reducers.ts` (module-level ceiling enforcement at admission).
- **Supersedes / superseded by:** —
- **Planning:** `planning/learner-modules/` — the three implementation returns this RFC discharges
  live there (`registry-return.md`, `novelty-identity-return.md`, `implementation-return.md`).

```tabiya-claims
none
```

**Why `none`, verified at HEAD `f0d5460` rather than assumed — and the one place it could have
been otherwise, checked rather than waved past.** Every artifact this RFC adds is catalog-local or
client-side: the eleven `ModuleDeclaration` instances and their closure
(`packages/runtime/src/module-registry.ts`, new), ten `module.*` consumer ids appended to
`EVIDENCE_CONSUMER_IDS` (`evidence-catalog.ts:98`), the production eligibility rows joined into
`EVIDENCE_MANIFEST.eligibility`, one selection policy beside the untouched
`research.r2_candidate@1` (`evidence-catalog.ts:985`), the `module-lift@1` table, per-projection
renderers, and the seat components under `apps/web/src`. **None of the six registers moves**:
`DRILL_PACK_SCHEMA_VERSION` 0.27 (lanes 0.28–0.32 live-claimed), run schema 0.17 (lanes 0.18–0.22
live-claimed), shape-entry 0.3, principle-entry 0.1, campaign 1, the migration register (head 25),
and `EVIDENCE_KINDS` (`apps/server/src/sourcing/types.ts`, 7 members) are all unmoved. No
`AssistanceConfig` version move: `version: 4` (`assistance.ts:5`) is untouched and this RFC stores
no new preference — `tabiya.workflow.v1.${context}` already exists
(`apps/web/src/lib/assistance-preference.ts:19`) and this RFC reads it rather than redefining it.

**The one candidate claim, examined and refused on evidence.** `rfc/intent-presets.md` §6 makes a
reopen condition binding on exactly this landing: *"if any module rendering path delivers content
without a logged disclosure event, this decision is void."* A per-module delivery event would be a
run-schema lane (`schemas/drill_run.schema.json:403-408` closes `feedback.revealed`'s payload with
`additionalProperties: false`, so `moduleId` cannot ride it) plus a stamp migration. It is not
needed, for a reason that is checkable rather than convenient: **every module timing that reveals
anything sits inside a boundary whose opening is already a logged run event.** `pre_commit` and
`at_commit` deliveries are rung-0/one-ply arithmetic over the visible board, which
`design/05` §3 states reveals nothing (*"showing which squares a knight covers reveals nothing a
careful player could not see"*); `post_commit` deliveries are gated by `feedbackDeliveryOpen`;
`checkpoint` deliveries require `feedback.revealed` / `checkpoint.reached`; `review` deliveries
require `outcome.reached`. And module output is a **deterministic function of run state, effective
configuration and timing** — the property `learner-modules` §3a.4 already relies on and
`module-reducers.ts` already implements — so a delivered packet is *recomputable*, not lost.
What is genuinely not recomputable is **which stage of a hint a learner asked for**; that is a
per-learner delivery record, it is `longitudinal-store`'s declared grain, and it rides Discharge
D5 rather than a lane opened here. Criterion A16 makes the argument falsifiable: if any module
delivers at a timing whose boundary event is absent from the run log, it fails.
`node tools/register-check.mjs` passes with this block declaring `none` (C1–C8, including C8's
digest refusal of an undeclared schema edit).

## Summary

`packages/runtime/src/module-contract.ts` is 202 lines of finished contract: eleven closed module
ids (`:3-7`), a fourteen-field declaration (`:62-77`), eleven error codes (`:89-94`), the
timing/form/answer images (`:111-136`), the one-board-adjacent-cue invariant (`:170`, `:198`), and
`compileModuleRegistry` (`:190`). `packages/runtime/src/module-reducers.ts` is the whole reducer
pipeline — admission, lift ordering, `factIdentity@1`, `SUBSUMPTION@1`, bounded novelty, the
backstop and its `reduction_quality@1` instrument. **Neither has ever run in production.**
`compileModuleRegistry` has nine call sites and all nine are in `module-contract.test.ts`;
`MODULE_DECLARATIONS` exists in no source file; `module-reducers.ts` is not even re-exported from
`packages/runtime/src/index.ts`, whose module block ends at `:78`; all 67 eligibility rows in the
compiled manifest target the single research consumer `research.semantic_selection@1`
(`evidence-catalog.ts:975`, pinned `evidence-catalog.test.ts:54`); `EVIDENCE_CONSUMER_IDS` holds
25 consumers and **not one is a `module.*`**; and no `.svelte` file in the repo mentions a module
id. `[V]`

**The audit under-stated it in one direction and over-stated it in another, and both matter.**
Under-stated: the eleven ids are *not* inert — they are already load-bearing currency in two
production subsystems. `presets.ts:97` executes `assertPresetFoundation()` on every import of the
runtime package, and that function requires the five presets' module union to be **set-equal to
`MODULE_IDS`** (`:82`); `campaign-contract.ts:46,71` and `apps/server/src/campaign-validation.ts:54`
validate campaign unlock rewards and inventories against `workflowContextPolicy("campaign")
.moduleCeiling`. So the product already **spends** module ids — as preset contents, as workflow
ceilings, as campaign rewards — against a registry that resolves them to nothing. Over-stated:
`rfc/learner-modules.md:1019-1023`'s *"production-registered but preset-inert"* is wrong in the
opposite direction from the one the ledger row records. The modules are not registered, and the
presets are not inert — `PRESET_DECLARATIONS` (`presets.ts:31-37`) and
`WORKFLOW_CONTEXT_POLICIES` (`:41-49`) are compiled, self-asserting and read from three
production files. **The layer that is missing is the join**, and it is one file wide.

This RFC supplies it: (§1) the **eleven literal `ModuleDeclaration` instances**, every one of the
fourteen fields filled, with `ceilings.sessions` and `ceilings.roles` *derived* from shipped tables
rather than invented — the [[D1206]] return's exact ask; (§2) the **production compile site** and
the six-step path from a compiled registry to a rendered seat, including the fifteen projection
**dispositions that must be deleted in the binding commit** because
`evidence-contract.ts:603` makes a binding and a disposition mutually exclusive; (§3) the **seat
map** — every module bound to one of `design/05`'s five regions through
`play-composition.md` §4, with the two rows that vocabulary cannot express named rather than
fudged; (§4) the **precursor disposition**, module by module, naming every shipped behaviour that
is kept, moved or retired, with nothing dropped silently; (§5) **budgets and honest-empty** as
shipped invariants with an enforcement path, including the module-level ceiling check that today
exists only per-entry; (§6) **arrows**, activated by the owner's [[D1564]] ruling through a typed
relation renderer, real effective clamp, and mandatory operand-retention closure.

It deliberately ships **no new collector, no new preset, no layout geometry and no bot policy**
(§Motivation).

## Motivation

The owner opened the running application and listed six failures. Five were already ledgered, some
since 2026-08-16, and none were fixed ([[D1428]]). [[D1431]] measured the surface underneath them:
of 42 specified user-visible assistance affordances, **17 exist and 8 are purpose-built
components** — presets 0 of 7, learner modules **0 of 11**, hint rungs 0 of 6. [[D1430]] named the
single fact under all of it: *"what he is looking at is the evidence engine with no presentation
layer on top of it."*

That layer was specified twice and built zero times, and the reason is recoverable rather than
mysterious. The implementer **returned** the registry work on 2026-08-23 with two named contract
gaps and did not invent past them — `planning/learner-modules/registry-return.md`:

> *"The reducer checkpoint does not authorize inventing the registry's missing bytes. Two
> independent contract gaps block the production declarations and their manifest closure."*

[[D1205]]: Appendix B claims 181 declared rows and enumerates 175. [[D1206]]: `ceilings.sessions`
and `ceilings.roles` are two of the fourteen required fields and **no module declares either** —
*"'Support only,' 'for everyone,' and 'explicit mode' are workflow prose, not literal session/role
sets."* A third return, `novelty-identity-return.md` ([[D1164]]), showed `factIdentity@1` cannot
match across ancestor nodes for event-shaped facts. The returns were correct. This RFC is the
amendment they asked for, plus the registration and the seats they were blocking.

**Scope boundary — declarations, the compile site, the read path, the seats, and nothing else:**

- **No duplicate collectors.** Existing exact relation payloads are reused. Every accepted
  projection id below is verified present in the compiled catalogue at HEAD, except
  `pack.authored.classifier@1` (§0.3), which is declared-awaiting rather than fabricated.
  `guided_hint` is a harder dependency: its ordered accepts list imports the literal, set-equal
  `HINT_DISCLOSURE_PROJECTION_IDS` supplied by `hint-distance`; the internal
  `HINT_HORIZON_PROJECTION_IDS` are an operator input and never a learner binding. This RFC cannot
  be accepted or implemented while either registry is absent. A generic or wildcard hint
  projection is forbidden by [[D1569]].
- **No new preset names, no new workflow contexts.** `presets.ts` ships both closed lists with
  `validation: "candidate"`; this RFC reads them and adds a registry invariant tying them to the
  declarations. Confirming or renaming a candidate is the owner's, per `intent-presets.md` §7.
- **No layout geometry.** `play-composition.md` owns viewport classes, board edge and the
  companion region's dimensions (`apps/web/src/lib/play-composition.ts` ships them). This RFC
  supplies the seat's *contents* and its three visual states, bound to that RFC's §4.1 mechanics.
- **No bot policy, no content authoring, no theming.**

## Specification

### §0 — What is true at HEAD, and the six corrections that follow from it

#### 0.1 The measured state

| fact | evidence at HEAD `f0d5460` |
|---|---|
| The eleven-module contract is complete and unused | `module-contract.ts:3-202`; `compileModuleRegistry` at `:190`; 9 call sites, all in `module-contract.test.ts:64-96` |
| The reducer pipeline is complete, unused, and unexported | `module-reducers.ts:13-330`; sole importer is its own test at `:21`; absent from `index.ts` (module block `:53-78` re-exports `module-contract.js` only) |
| No `ModuleDeclaration` instance exists outside tests | `MODULE_DECLARATIONS`: zero code hits repo-wide |
| No `module.*` consumer is registered | `EVIDENCE_CONSUMER_IDS` = 23 operation ids + `assistance.arrows` + `research.semantic_selection` (`evidence-catalog.ts:98`, pinned `evidence-catalog.test.ts:48-49`) |
| Every eligibility row is research-only | 67 rows, all `research.semantic_selection@1` (`evidence-catalog.ts:973-981`, pinned `:52-54`) |
| The only selection policy is the research one | `research.r2_candidate@1`, `evidence-catalog.ts:985`; `production.module_local@1` appears only in tests and prose |
| No component knows a module id | zero `.svelte` hits for any of the eleven ids |
| The manifest tuple | 35 producers / 188 projections / 25 consumers / 210 bindings; 67 semantic events / 67 eligibility / 15 reasons / 1 policy (`evidence-catalog.test.ts:51-52`) |
| **The ids are nevertheless load-bearing** | `presets.ts:82` requires the preset union to be set-equal to `MODULE_IDS`; `presets.ts:97` executes that assertion on import; `campaign-contract.ts:46,71` and `campaign-validation.ts:54` gate campaign rewards on `moduleCeiling` |
| The preset preference store is written and never read | `loadWorkflowPreset`/`saveWorkflowPreset` (`assistance-preference.ts:20,36`); sole callers are `assistance-preference.test.ts:94-102` |

`[V]` throughout; the working tree at drafting carried other agents' uncommitted edits to
`evidence-catalog.ts`, so every catalogue line number above is read from `git show f0d5460:`.

#### 0.2 Six corrections to `rfc/learner-modules.md`, each with its evidence

Each was found by attempting to write the declarations, which is the only way any of them could
have been found.

**C1 — `MODULE_ANSWER_IMAGE` is an exact-match map, not a ceiling** (`module-contract.ts:129-136`).
`fact → ["fact"]`, `pattern → ["pattern"]`, `threat → ["threat"]`,
`principal_variation → ["principal_variation"]`. §1.6 calls the field *"the maximum answer content
of any output"*, but the shipped image of `principal_variation` **excludes `fact`**, and the image
of `threat` excludes `fact` — so `blunder_prevention` (ceiling `threat`) cannot carry
`rules.tactic.reading.loose_piece@1`, whose declared `answerContent` is `["fact","threat"]`, and
`full_inspector` (ceiling `principal_variation`) can carry none of its forty rows. Worse, **no
ceiling token maps to `evaluation` at all**, so `derived.grade.move_quality@1`
(`answerContent: ["evaluation"]`, `evidence-catalog.ts:819`) is admissible to no module in the
registry — including the two the projection's own disposition names. §2.3 replaces the map with a
monotone chain over the shipped `AnswerDistance` union (`evidence-contract.ts:7`).

**C2 — the ceiling is enforced nowhere.** `assertDeclaration:166` compares only a *per-entry*
`answerContent` declaration against the image; `admitModuleFacts` (`module-reducers.ts:~172`)
filters only against that same per-entry field. A module that declares no per-entry restriction has
an unenforced ceiling — a criterion that cannot fail, the [[D1274]] class. §2.3 adds the
module-level admission check.

**C3 — `ceilings.sessions` and `ceilings.roles` are undeclared** ([[D1206]]). §1.2 derives both
rather than inventing them.

**C4 — Appendix B's arithmetic** ([[D1205]]): the cross-check substitutes 40 for a
`full_inspector` row that enumerates 34. §1.3 re-derives the enumeration and replaces the asserted
total with a derivation command, per [[D1240]].

**C5 — `outpost` and `pawn_safe_square` return to `sight_on_request`.** Both were excluded from
requested sight on one ground: their matcher consumes the D566-defective `pawnSafety`
(`structure.ts:352`). **[[D566]] is CLOSED (2026-08-22)** — `pawn_safe_square` now uses disclosed
`maximal_pawn_reach@1` with a conservative convention and stated scope. The owner's [[D906]](2)
ruling was *"just fix the foundation and then keep it in"*, and the foundation is fixed. Both rows
return (sight 20 → 22). [[D632]]'s measurement — post-repair `outpost` fires in 0 of 643 positions
— is an **availability fact rendered as honest-empty**, not a reason to withhold a ruled row.

**C6 — two ceilings are slack, and a slack ceiling is an unfalsifiable permission.** §4.10 gives
`review_map` a `principal_variation` ceiling while noting *"no accepted projection here carries a
PV"*. Verified: none of its 48 rows declares `candidate_moves`, `move`, `ranked_moves` or
`principal_variation`. A permission nothing can exercise cannot fail a test, so it is corrected to
`evaluation` (§1.1). `sight_on_request`'s `fact` ceiling is corrected upward to `pattern`, because
three of its own accepted rows declare `pattern` (`rook_on_seventh`, `space`, `pawn_connectivity`)
— the ceiling was below its contents, not above.

#### 0.3 Two facts that moved since `learner-modules` was accepted

**`derived.grade.move_quality@1` exists.** `rfc/move-quality-grades.md` landed its projection
checkpoint; the declaration is at `evidence-catalog.ts:813-823` with
`disposition: { kind: "experimental", reason: "Awaits learner-module consumer compilation for
postcommit_nudge and review_map." }`. The two rows Appendix B marks ◇ **compile at this landing**,
and the disposition is deleted in the same change (§2.4). That also discharges
`move-quality-grades.md`'s D1, which its Status line says blocks its archival.

**`pack.authored.classifier@1` does not exist.** Added to `full_inspector` by the 2026-08-22 D924
amendment as *"the `pack.authored.classifier@1` token"* for leak L12. Repo-wide it appears in
exactly one place: `rfc/learner-modules.md:766`. There is no producer, no projection and no
payload type. It is therefore **declared-awaiting**, and `theory-presentation.ts:24`'s raw
classifier token (L12) has no inspector home until it lands — stated, not papered over (Discharge
D2).

### §1 — The eleven declarations

#### 1.1 The summary table

Table caption — unit: **module id**; total: **11**, set-equal to `MODULE_IDS`
(`module-contract.ts:3-7`). Changes from `learner-modules.md` §4 are **bold**.

| # | id | timings (initiative) | seat | answerCeiling | facts / words / marks / arrows | novelty | empty |
|---:|---|---|---|---|---|---:|---|
| 1 | `rules_floor` | pre_commit (ambient) | board_input | none | 0 / 0 / — / 0 | 0 | silent |
| 2 | `sight_on_request` | pre_commit (on_request) **· post_commit (on_request)** | rail | **pattern** | 1 / 30 / 6 / 1 | 0 | stated_absence |
| 3 | `blunder_prevention` | at_commit (proactive) | board_adjacent | threat | 1 / 20 / 1 / 1 | 0 | silent |
| 4 | `threat_radar` | pre_commit (on_request) · post_commit (on_request) | rail | threat | 3 / 60 / 4 / 2 | 0 | stated_absence |
| 5 | `postcommit_nudge` | post_commit (proactive) | rail | **evaluation** | 2 / 50 / 2 / 1 | 3 | silent |
| 6 | `structure_nudge` | post_commit (**proactive**) | rail | **theory** | 1 / 80 / 4 / 0 | 3 | stated_absence |
| 7 | `theory_breadcrumb` | post_commit (on_request) | rail | **theory** | 1 / 60 / 0 / 0 | 3 | stated_absence |
| 8 | `guided_hint` | checkpoint (on_request, progressive disclosure) | rail | **move, through `guided_hint@1` disclosure** | 1 / 40 / 2 / 1 per rung | 0 | unavailable_source |
| 9 | `compare_coach` | checkpoint (on_request) · review (on_request) | rail | **evaluation** | 2 / 60 / 2 / 2 | 0 | stated_absence |
| 10 | `review_map` | review (proactive) | timeline | **evaluation** | 3 / 80 / 3 / 2 per moment | 0 | stated_absence |
| 11 | `full_inspector` | review (explicit_mode) | explicit_surface | principal_variation | 20 / 400 / 20 / 8 | 0 | stated_absence |

Four changes need their argument stated rather than assumed:

- **`sight_on_request` gains its post-commit arm.** The shipped precursor's consumer
  `board.selected_square_sight@1` already declares `timing: ["precommit","postcommit"]`
  (`evidence-catalog.ts:878`), and the caption renders after a move today
  (`DrillScreen.svelte:977`). Declaring pre-commit only would **retire working behaviour** in a
  document whose job is to preserve it (§4). The disclosure ceiling narrows nothing: rung-0 exact
  sight is legal at both timings under O4.
- **`structure_nudge` resolves "proactive or on_request" to `proactive`.** The compiler requires
  unique timings (`module-contract.ts:144`), so one timing carries one initiative and the accepted
  text's disjunction is not declarable. `proactive` is the correct half: the shipped precursor is a
  **passive marker on the timeline** (`Timeline.svelte:51,78`), which is the owner's ruled delivery
  pattern for exactly this module (*"a passive marker the player may open, never a modal"*,
  `design/05` §3b). The marker appears; opening it is the learner's action.
- **`blunder_prevention`'s Support gating is a preset fact, not a timing.** The declaration carries
  `at_commit` / `proactive` because the compiler demands exactly that (`module-contract.ts:171`);
  the O4 restriction is expressed where it is enforceable — `presets.ts:35` places the module in
  `support` alone, and `WORKFLOW_CONTEXT_POLICIES` excludes it from seven of eight contexts, which
  §1.2 turns into a one-member `ceilings.sessions`.
- **`threat_radar`'s pre-commit arm is the owner's ruled arm**, not this RFC's proposal: [[D906]](1)
  — *"pre-commit, inside the Support preset only, on-request, never proactive."* The declaration
  carries the timing; `presets.ts:35` carries the Support-only half.

#### 1.2 `ceilings.sessions` and `ceilings.roles` — derived, not invented (the [[D1206]] discharge)

The return's objection was precise: the compiler requires both arrays non-empty and nothing else,
so *"an implementer can make any invented non-empty arrays compile."* The fix is not to pick
values; it is to make them **derivable from a shipped table and checked against it.**

**Sessions.** `ceilings.sessions` is exactly the set of workflow contexts whose `moduleCeiling`
contains the module — read from `WORKFLOW_CONTEXT_POLICIES` (`presets.ts:41-49`), which already
ships. This is a registry invariant, not a copy: `assertModuleRegistry` recomputes the set and
fails on any drift, so the two tables can never disagree.

| module | sessions (from `moduleCeiling`) | n |
|---|---|---:|
| `rules_floor` | pack, position, imported, match, stream, academy, onramp, campaign | 8 |
| `blunder_prevention` | position | 1 |
| `sight_on_request`, `threat_radar`, `postcommit_nudge`, `structure_nudge`, `theory_breadcrumb`, `guided_hint`, `compare_coach` | pack, position, imported, stream, academy, onramp, campaign | 7 |
| `review_map` | pack, position, imported, stream, academy, campaign | 6 |
| `full_inspector` | pack, position, imported, stream, campaign | 5 |

**Roles.** The six-member `EvidenceRole` union (`evidence-contract.ts:8`) is
`learner | host | participant | spectator | author | operator`. Three rules, each grounded in
shipped code rather than chosen:

1. **`author` and `operator` never appear on a learner module.** They are the declared roles of
   `authoring.claim_binding` and `runtime.repertoire_scan` (`evidence-catalog.ts:888-889`); a
   module carrying them would widen a learner surface into an authoring one. Registry invariant,
   failable.
2. **Play-timed modules declare `["learner","host"]`** — the person holding the board and the host
   who may take it. Grounded in the shipped clamp: `permittedAssistance`
   (`assistance.ts:30-34`) grants the disclosive axes only when
   `role === "solo" || role === "host" || reviewing`, and `client-surface-floor.test.ts:37-65`
   pins that refusal for participants and spectators. Applies to modules 1–9.
3. **Review-only modules may declare all four viewer roles**, because *"a finished run has nothing
   left to contaminate"* (`design/05` §3a-i) and the shipped review consumer already declares them:
   `review.story` carries `roles: ["learner","host","participant","spectator"]`
   (`evidence-catalog.ts:887`). Applies to `review_map`. **`full_inspector` is the exception and
   keeps `["learner","host"]`**, because two of its rows are `human.maia.policy@1` and
   `human.maia.candidate_wdl@1`, whose shipped delivery is refused to participants and spectators
   by the same clamp — the inspector must not become the bypass.

`compare_coach` spans a play timing and a review timing and therefore takes the narrower set,
`["learner","host"]`. **The contract cannot express a per-timing role narrowing**, which is a
genuine expressiveness gap rather than a decision: `ModuleTimingDeclaration`
(`module-contract.ts:27-30`) carries a timing and an initiative and nothing else. Named as a
proposed ledger row and routed to `learner-modules` rather than fixed by widening a field this RFC
does not need; taking the narrow set is the conservative direction and costs a spectator nothing
they can reach today.

**`ceilings.disclosure`** is the `MODULE_TIMING_IMAGE` union of the module's own declared timings
(`module-contract.ts:111-117`), which is the maximum `assertDeclaration:150` permits;
`visibleBoardParity` is `true` for all eleven, which is the only value the compiler accepts
(`:145`) and the encoding of [[D659]].

#### 1.3 `accepts` — the closed enumeration, and how its total is asserted

Per [[D1240]], **no total in this RFC is a hand count asserted as a criterion.** The enumeration
below is normative as a *set*; the counts are drift tripwires, and criterion A2 asserts
set-equality against `make module-registry-census`, a derivation over the compiled catalogue and
the declarations.

| module consumer | accepted projection ids (all `@1`) | n |
|---|---|---:|
| `rules_floor` | — (`accepts: { kind: "none" }`; registers no consumer, per `module-contract.ts:159,179`) | 0 |
| `module.sight_on_request` | the 17 `rules.structural.reading.*` kinds — `STRUCTURAL_FEATURE_KINDS` (`packages/schema/src/drill-pack/types.ts:372-377`) minus retired `pawn_count`, **including `outpost` and `pawn_safe_square` per C5**; `rules.castling.reading.{rights, legality}`; `rules.tactic.reading.rook_on_seventh`; `rules.square.reading.control`; `rules.pawn.reading.contacts` | 22 |
| `module.blunder_prevention` | `rules.tactic.consequence.{threat, mate_in_one}`; `rules.tactic.reading.loose_piece` — all three evaluated on the staged-move result position | 3 |
| `module.threat_radar` | the blunder three; `rules.tactic.reading.{back_rank, trapped_piece, ray_classification}`; `derived.tactic.defender_exposure` | 7 |
| `module.postcommit_nudge` | 8 `rules.structural.event.*` (the 11 `STRUCTURAL_EVENT_FAMILIES` at `evidence-catalog.ts:115-118` minus the refused `piece_count`, `direct_attack_count`, `line_blockers`); all 5 `TRANSITION_GEOMETRY_EVENT_FAMILIES`; 7 `rules.transition.event.*` (`TRANSITION_RULE_EVENT_FAMILIES` minus `clock_reset`); `rules.castling.event.rights_lost`, `rules.tactic.event.{double_attack, check, loose_piece}`, `derived.exchange.{capture_class, trade_completed}`, `rules.structural.event.pawn_islands`; 10 `derived.semantic_avoidance.*`; `rules.pawn.event.dynamics`, `derived.pawn.event.transitions`, `rules.king.event.zone_state`, `derived.king.captured_zone_defender`, `derived.activity.event.open_file_occupancy`; `derived.grade.move_quality` | 43 |
| `module.structure_nudge` | `theory.shapes.firing`; `rules.structural.reading.{named_structure, space, pawn_connectivity}`; `rules.phase.reading`; `rules.endgame.reading` | 6 |
| `module.theory_breadcrumb` | `pack.authored.claim`; `theory.shapes.firing`; `human.explorer.population` **(operand-scoped, §2.3)**; `theory.opening_identity.record` | 4 |
| `module.guided_hint` | the literal ordered expansion `...HINT_DISCLOSURE_PROJECTION_IDS` (one sealed `derived.hint.disclosure.<family>.<rung>@1` per measured family/rung pair; never raw PV or the internal horizon) | `R` |
| `module.compare_coach` | `derived.compare.{structure_delta, eval_delta, engine_trajectory, piece_route}`; `run.record.{fork, consequence, objective_transition, checkpoint_hit}` | 8 |
| `module.review_map` | the 42 compiled nudge event/avoidance ids re-declared; `rules.pivotal.marker`, `rules.phase.reading`, `rules.endgame.reading`; `recorded.engine.eval`, `recorded.tablebase.result`; `live.stockfish.{eval, wdl}`; `run.record.{objective_transition, consequence, imported_result}`; `derived.grade.move_quality` | 53 |
| `module.full_inspector` | `rules.tactic.reading.{loose_piece, ray_classification, rook_on_seventh, trapped_piece, back_rank, discovered_latency}`, `rules.tactic.consequence.{threat, mate_in_one, reply_breadth}`, `rules.structural.reading.{space, pawn_connectivity}`, `rules.phase.development`, `rules.castling.reading.{rights, legality}`, `derived.tactic.{discovered_executed, promotion_pressure}` (16); `rules.square.reading.control`, `rules.mobility.reading.piece_destinations`, `rules.pawn.reading.{contacts, candidate_majority}`, `derived.material.reading.role_signature`, `rules.king.reading.zone_state` (6); `live.stockfish.{eval, wdl, pv}`, `human.maia.{policy, candidate_wdl}`, `human.explorer.population`, `live.syzygy.{result, category, distance}`, `recorded.engine.eval`, `recorded.tablebase.result`, `theory.shapes.firing` (12); `rules.phase.reading`, `rules.pivotal.marker`, `derived.compare.{structure_delta, eval_delta}`, `derived.story.rank` (5); ◇ `pack.authored.classifier` (1) | 40 |

Here `H = HINT_HORIZON_PROJECTION_IDS.length` and
`R = HINT_DISCLOSURE_PROJECTION_IDS.length = H × HINT_RUNGS.length`; both are derived from the
final measured family registry and the closed rung vocabulary, not pinned to hand counts. Landing
tripwires are therefore declared **`186 + R`**, compiled **`185 + R`**, and declared-awaiting **1**
(`pack.authored.classifier@1` in `full_inspector`). The horizon rows are compile-time dependencies,
not awaiting placeholders. The two grade rows compile (§0.3). Every non-horizon, non-◇ id above
was verified present in the compiled catalogue at `f0d5460`. `[V]`

`selection.familyPrecedence` is, for each module, its `accepts` order verbatim — the compiler
requires order-equality (`module-contract.ts:163`), so the table above is simultaneously the
precedence declaration. `selection.policy` is `production.module_local@1` for all eleven.

#### 1.4 `intent` and `learnerAction` — one sentence and one verb each

The compiler requires both non-empty (`module-contract.ts:143`); §1.3 of `learner-modules` requires
`learnerAction` to be **exactly one** action, with dismissal as chrome.

| module | intent | learnerAction |
|---|---|---|
| `rules_floor` | Which moves are legal here, and where does the piece I have picked up go? | commit a legal move |
| `sight_on_request` | What is arithmetically true about the square I selected, right now? | select another square |
| `blunder_prevention` | Does the move I have staged expose something concrete? | revise or confirm the staged move |
| `threat_radar` | What can the opponent's pieces do to me from this position? | open the named threat's fact card |
| `postcommit_nudge` | What did the move I just played actually change? | branch from this move and try the other idea |
| `structure_nudge` | What kind of position is this, and what is that kind generally about? | open the cited shape entry |
| `theory_breadcrumb` | Has anyone written about this position, and where? | open the cited passage |
| `guided_hint` | I am stuck — reveal the least that will unstick me. | request the next rung |
| `compare_coach` | What is the smallest recorded difference between my two attempts? | enter the other attempt at the divergence |
| `review_map` | Where did this run actually turn? | replay from this moment |
| `full_inspector` | Show me everything, attributed. | open a fact's provenance |

`forms` per module, each a subset of the closed inventory and each mapped by `MODULE_FORM_IMAGE`
(`module-contract.ts:119-127`): `rules_floor` `["square"]`; `sight_on_request`
`["sentence","square","arrow"]`; `blunder_prevention` `["sentence","square","arrow"]`; `threat_radar` `["sentence","square","arrow"]`;
`postcommit_nudge` `["sentence","card","square","arrow"]`; `structure_nudge` `["card","timeline_mark"]`;
`theory_breadcrumb` `["sentence","card"]`; `guided_hint` `["sentence","square","arrow"]`; `compare_coach`
`["sentence","card","arrow"]`; `review_map` `["timeline_mark","card","sentence","square","arrow"]`; `full_inspector`
`["panel","card","sentence","square","arrow"]`. `guided_hint`'s arrow budget is reserved for
the selected per-family horizon's direct-move rung and cannot be spent by raw Stockfish PV; the
registry cannot land until the literal horizon registry and sealed rung compiler exist (§6,
[[D1455]], [[D1569]]). Every active arrow form is backed by
the set-equal relation-renderer closure in `evidence-presentation.md` §3.6a.

#### 1.5 `noveltyWindow`, and the [[D1164]] closure it needs

Six modules take `noveltyWindow: 0` and three of those need their reason stated, because zero is
not a default here:

- `rules_floor`, `blunder_prevention` — the accepted defaults; the module's whole job is the
  current staged moment.
- `sight_on_request`, `threat_radar`, `guided_hint`, `compare_coach`, `full_inspector`,
  `review_map` — **`on_request` and `explicit_mode` deliveries take `0`**, because novelty
  suppression on a requested delivery is a silent refusal of an explicit gesture. A learner who
  asks the same question twice is entitled to the same answer, and *"absence is stated, never
  simulated"* forbids answering a second request with nothing.

The three proactive modules take `3`: `postcommit_nudge`, `structure_nudge`, `theory_breadcrumb`.

**[[D1164]] is a live blocker on those three, and it is discharged here rather than deferred.** The
return is correct: for a projection absent from `FACT_EQUIVALENCE_CLASSES`
(`module-reducers.ts:36`), `factIdentity@1` keys on the full retained-operand serialization, and
event operands include `nodeId` and move anchors, so the same chess fact at two ancestor nodes has
different identity bytes by construction and the boundary fixture can only pass by faking one node
identity. The amendment the return asked for:

> *"For every projection eligible for novelty reduction, declare one of: (1) a stable equivalence
> class and exact compared fields that deliberately exclude volatile run-location operands while
> retaining mover/subject/polarity; or (2) `novelty: exempt`."*

**The closure is exactly the union of the three proactive modules' `accepts` lists** — 38 + 6 + 4
with duplicates removed — and it is set-equal-checked at compile against
`{ module | noveltyWindow > 0 }`, which is the return's own closure condition. Every row declares
compared fields that exclude `nodeId`, `eventId`, ply and move anchors and retain
`{ moverColor, subject squares/file, family, sign }`. **Positive and avoidance families stay in
different classes permanently** — `rules.structural.event.isolated_pawn` and
`derived.semantic_avoidance.isolated_pawn` are generated from the same family list
(`evidence-catalog.ts:124`), and collapsing them would invert a fact's polarity in front of a
learner. A projection in the closure with no declared row is a **compile failure**, not a silent
abstention; a projection outside the closure keeps the shipped conservative behaviour
(`noveltyAbstained: true`, never "everything is new").

### §2 — Where the registry is compiled, and who reads it

Six steps. Steps 1–2 do not exist today at all; steps 3–4 exist and are unreachable; steps 5–6
exist as ad-hoc code with no contract.

#### 2.1 Step 1 — `packages/runtime/src/module-registry.ts` (new)

Holds `MODULE_DECLARATIONS` (the eleven §1 objects, frozen), `MODULE_EVIDENCE_CLOSURE` (the ten
`module.*` consumers with their order-equal `accepts`), `MODULE_LIFT` (the `module-lift@1` table,
each row carrying value, citation, corpus and measured-at date per the D368 governance clause), the
`NOVELTY_IDENTITY_CLOSURE` of §1.5, and:

```ts
export const MODULE_REGISTRY = compileModuleRegistry(MODULE_DECLARATIONS, MODULE_EVIDENCE_CLOSURE);
assertModuleRegistry(MODULE_REGISTRY);
```

Both calls are **bare module-scope statements**, deliberately copying the shipped idiom at
`presets.ts:97` (`assertPresetFoundation();`) so that an inconsistent registry fails at import of
the runtime package rather than at the first render. `assertModuleRegistry` adds the four
invariants the module compiler cannot see because they cross files:

1. `module.ceilings.sessions` set-equals `{ c ∈ WORKFLOW_CONTEXTS | c.moduleCeiling ∋ module.id }`.
2. No module declares `author` or `operator` in `ceilings.roles`.
3. Every id in every `PRESET_DECLARATIONS[].modules` resolves to a declaration (the reverse
   direction of `presets.ts:82`, which today checks only that the union covers `MODULE_IDS`).
4. `NOVELTY_IDENTITY_CLOSURE` set-equals the union of `accepts` over modules with
   `noveltyWindow > 0`.

`packages/runtime/src/index.ts` re-exports this file **and `module-reducers.js`**, which is absent
from the barrel today.

#### 2.2 Step 2 — the manifest join

In `evidence-catalog.ts`: ten `module.*` ids appended to `EVIDENCE_CONSUMER_IDS` (25 → 35);
`PRODUCTION_ELIGIBILITY_DECLARATIONS`, the `185 + R` compiled rows of §1.3, joined into
`EVIDENCE_MANIFEST.eligibility` beside the 67 research rows, which stay byte-identical;
`production.module_local@1` appended to `EVIDENCE_SELECTION_POLICIES` beside the untouched
`research.r2_candidate@1`. The manifest digest moves; the docs tuples in `docs/semantic-evidence.md`
and `docs/evidence-contract.md` move in the same commit.

#### 2.3 The three contract repairs this join requires

**(a) `MODULE_ANSWER_IMAGE` becomes a monotone chain.** `ModuleAnswerCeiling` gains two members,
`theory` and `evaluation`, and each token's image is every answer distance at or below it. The
order is not invented: it is the shipped `AnswerDistance` union's own declaration order
(`evidence-contract.ts:7`), with the four move-bearing members confined to the top two rungs, which
is §5's refusal made mechanical.

| ceiling | image |
|---|---|
| `none` | — |
| `fact` | fact |
| `pattern` | + pattern |
| `threat` | + threat |
| `theory` | + theory, principle, plan |
| `evaluation` | + evaluation |
| `candidate_move` | + candidate_moves |
| `move` | + ranked_moves, move |
| `principal_variation` | + principal_variation |

`guided_hint` no longer uses the shipped three-stage special case. `hint-distance` proves that a
five-rung byte disclosure cannot be represented by three answer ceilings, and that the optional
per-row `answerContent` field is a bypass. `ModuleAnswerCeiling` therefore also gains `move`, and
`ModuleAnswerContract` gains the closed `guided_hint@1` disclosure declaration specified there.
Only `guided_hint` may declare it; every one of its acceptance rows must declare exact answer
content and be a literal member of `HINT_DISCLOSURE_PROJECTION_IDS`. The old
`1:pattern | 2:fact | 3:principal_variation` branch and its raw-PV mental model are deleted.

**(b) admission enforces the module ceiling.** `admitModuleFacts` gains one refusal: a fact whose
projection `answerContent` is not a subset of the module's image is refused, counted, and never
delivered. Without this the ceiling is decorative (C2).

**(c) `ModuleAcceptanceDeclaration` gains an optional `operands: readonly string[]`.** This is the
**operand-scoped admission mechanism** `learner-modules.md` §4.2 itself named as needed and
declined to invent (*"a proposed ledger row, not an invention here"*). It narrows an accepted
projection to a named subset of its own declared operands, checked at compile against
`ProjectionDeclaration.operands`, and the ceiling check in (b) runs against the narrowed content.
It has one measured use at this landing and it is load-bearing: `human.explorer.population@1`
declares `answerContent: ["fact","candidate_moves"]` (`evidence-catalog.ts:787`), so
`theory_breadcrumb` at a `theory` ceiling would otherwise refuse every corpus fact — while
`learner-modules` §4.7 requires exactly the narrowed form, *"book-presence context — rendered as a
theory pointer, never a popularity-as-quality verdict."* The entry declares
`operands: ["nodeId","result"]`, the per-move list is never admitted, and the shipped
`CORPUS_GUARD` sentence (*"These counts say what this population played, not what is good."*,
`corpus-sentences.ts:3`) is carried into the module's renderer.

#### 2.4 The fifteen dispositions that must be deleted in the binding commit

This is the single hardest mechanical constraint on the join, and it is invisible until you try.
`evidence-contract.ts:603`:

> `if (bound === (projection.disposition !== undefined)) fail("EVIDENCE_PROJECTION_ORPHANED", …)`

A projection is **either bound to a consumer or carries a disposition — never both.** Twenty-one
projections carry one at HEAD, and fifteen of them appear in a module's `accepts`. Binding them
without deleting the disposition is a build failure; deleting a disposition without binding is
also a build failure. So the two edits are the same edit.

Deleted (15): `rules.tactic.consequence.{threat, mate_in_one}`,
`rules.tactic.reading.{loose_piece, back_rank, trapped_piece, ray_classification,
rook_on_seventh, discovered_latency}`, `rules.castling.reading.{rights, legality}`,
`rules.structural.reading.{space, pawn_connectivity}`, `rules.phase.reading`,
`derived.tactic.promotion_pressure`, `derived.grade.move_quality`. Most say so themselves — the
threat row's reason is literally *"D794 measured threat presence near background; module admission
waits on Phase 3"* (`evidence-catalog.ts:396`) and the grade row's is *"Awaits learner-module
consumer compilation for postcommit_nudge and review_map"* (`:822`). **Deleting a disposition does
not delete its warning**: each row's `limitations` array retains the measured caveat
(`"Threat presence is not a move grade, recommendation, forcing claim or statement of intent."`,
`:395`), which is where a caveat belongs once a consumer exists.

Retained (6, still unbound): `derived.tactic.fork_survives_reply`,
`derived.tactic.overloaded_defender_response_conflict`,
`rules.tactic.consequence.forced_mate_after_move`, `rules.tactic.reading.defender_duty_set`,
`rules.exchange.predicate.legal_exchange`, `derived.story.title`. Named so that the deletion set is
a decision with a boundary rather than a sweep.

#### 2.5 Steps 3–4 — packet construction, server side

`apps/server/src/module-packets.ts` (new). For one run, one node, one timing and one effective
module set, per module:

1. `evidenceForConsumer(EVIDENCE_MANIFEST, { id: "module.<x>", version: 1 }, declaredEvidence)`
   → the branded `ConsumerEvidenceView` (`evidence-contract.ts:369`). A forged plain object is
   refused with `EVIDENCE_GENERIC_BYPASS` (`:395`).
2. `reduceModulePacket(module, manifest, view, { timing, ancestorFacts, recorder })`
   (`module-reducers.ts:311`) → admission, lift ordering, dedup, subsumption, novelty, backstop,
   and the `reduction_quality@1` observation on overflow. **This is the first production call of
   the reducer pipeline.**
3. `renderEvidenceItems(view', MODULE_RENDERERS)` (`evidence-contract.ts:405`) → the branded
   `RenderedEvidenceView`. Note the hard constraint this creates: `renderEvidenceItems` fails with
   `EVIDENCE_BINDING_UNDECLARED` for **any admitted projection with no registered renderer**
   (`:409`), so the renderer registry must cover every distinct accepted id. That coverage is
   asserted by set-equality against `make module-registry-census`, never by a hand count (A5).

The **effective module set** is the existing algebra, not a new one:
`preset.modules ∩ context.moduleCeiling ∩ campaignInventory`, which `presets.ts` and
`campaign-contract.ts:63-75` already compute; this RFC adds `composableModules(context, preset,
campaign?)` as their single entry point so three call sites stop re-deriving it. Session and role
narrowing then apply from `ceilings` and `permittedAssistance`. **Every term only narrows**
(`design/05` §3-forms as amended).

The result is delivered on the existing run/evidence response as
`modules: { [moduleId]: RenderedModulePacket }`, where a packet is
`{ moduleId, timing, items, empty, budgets, noveltyAbstained }` and `empty` is the module's
declared `emptyBehavior` rendered, never an absent key.

#### 2.6 Steps 5–6 — seat, client side

`apps/web/src/lib/module-seats.ts` (new) maps packets to seats; `ModuleSeat.svelte` (new) renders
one seat in the three states `play-composition.md` §4.1 defines (collapsed badged row, expanded
card, empty-quiet); `CompanionRegion.svelte` (new) is the queue that owns the open/close protocol
(at most one expanded seat; expanding one collapses the previous; companion-region internals only,
never stage layout). `DrillScreen.svelte`'s existing `#run-support-region` — today an ad-hoc
`.evidence-seat` holding a reveal button, the guard prompt and the sight caption — becomes that
region's host. Seat expansion state is component state, persisted nowhere, which is why this RFC
stores no preference.

### §3 — The five regions and the seat classes

`design/05` §2 names five regions inside a run and says what each generically *is*.
`play-composition.md` §4 binds the closed seat-class vocabulary to composition regions. This RFC
consumes both and adds only the module→region assignment for the eleven.

| region (`design/05` §2) | seat class | modules | today |
|---|---|---|---|
| 1. Board and objective | `board_input` | `rules_floor` | the board's own affordance layer — legal-destination dots from `board-input.ts:195-199` through chessground's `movable.dests` (`Chessboard.svelte:145-151`). Paint, zero layout |
| 2. Timeline | `timeline` | `review_map` | `Timeline.svelte` renders the strip and already carries checkpoint dots, authored `A` chips, guard `G` chips, shape chips and pivotal dots |
| 3. Branch rail | — | none | a **structural** seat (`play-composition.md` §4.4), not a module; `BranchRail`/`GroupPanel` keep it |
| 4. Assistance and evidence rail | `board_adjacent` (1) and `rail` (7) | `blunder_prevention` in the reserved head slot; `sight_on_request`, `threat_radar`, `postcommit_nudge`, `structure_nudge`, `theory_breadcrumb`, `guided_hint`, `compare_coach` as rail seats | `#run-support-region` behind the `Support` compact tab; three of the seven have ad-hoc content, four have none |
| 5. Session and role controls | — | none | structural; topbar/session chrome |
| (outside the play composition) | `explicit_surface` | `full_inspector` | the separate Inspector surface `play-composition.md` §2.4 already landed |

Three points that are contract rather than layout:

**3.1 The one board-adjacent cue is a priority contract, not a geography.** `module-contract.ts:170`
and `:198` permit exactly one `board_adjacent` module and assign it to `blunder_prevention`;
[[D876]] ruled the cue is a companion-region card and the board stays pixel-identical. It owns the
reserved head slot and is the only module that may displace the expanded seat.

**3.2 The queue is the growth answer at every viewport**, unchanged from `play-composition.md`
§4.1: one expanded seat, the rest collapsed to badged rows, count badges retiring the L2 topbar
counter. `on_request` seats carry **no count before a request** — the row is the door, never a
claim of pending facts.

**3.3 `review_map`'s seat class needs one amendment, stated rather than fudged.**
`ModuleSeatClass` is a single value (`module-contract.ts:73`), and both `learner-modules.md` §4 and
`play-composition.md` §4 write `review_map` as *"timeline + explicit_surface"*, which is not
declarable. This RFC declares `seatClass: "timeline"` and amends both rows to read **"a timeline
mark that opens the review surface"** — one seat class, no expressiveness lost, and it matches what
ships: `Timeline.svelte`'s pivotal dot already opens a dialog that offers the review surface.

**3.4 The play-column placement of the inspector becomes non-conformant**, which is the point:
declaring `explicit_surface` makes `DrillScreen.svelte:1133-1196`'s in-play inspector modal a
contract violation that `play-composition.md`'s Discharge D2 relocates.

**3.5 One clause is owed to `play-composition.md` §5.1.** Its vocabulary law confines raw eval
numerals to the `explicit_surface`, and `review_map` is `timeline`-seated while its own surface
renders recorded trajectories (`GameStoryScreen.svelte:52`: *"Recorded trajectory: {before} →
{after} cp"*). The law needs a review-surface clause — a run past `outcome.reached` discloses under
every policy — and it is that RFC's to write. Proposed ledger row; Discharge D3.

### §4 — What happens to each ad-hoc precursor

Nothing shipped is dropped silently. Eight modules have precursors; three have none.

#### 4.1 `rules_floor` — **the precursor becomes the module's renderer, unchanged**

`board-input.ts` (437 lines) and `Chessboard.svelte` are the richest thing in the client and none
of it is contract-visible: the parallel semantic grid (`Chessboard.svelte:332-359`), per-square
aria labels (`board-input.ts:213-236`), the full keyboard model including double-Escape grid exit
(`Chessboard.svelte:252-264`), fifteen live-region announcement strings (`board-input.ts:156-412`),
the promotion dialog, the text-move entry with ambiguity detection (`:169-184`), the chessground
bounds repair (`:198-211`), and focus restoration after a move. **All of it stays exactly as it
is.** The module declaration adds one thing and removes none: the dots become a *declared* module
whose `ceilings.visibleBoardParity` is `true`, so `accessible-board-input`'s grid can never widen
what `showDests` withholds ([[D659]]). `accepts: { kind: "none" }` is why: the affordance layer is
interaction, not evidence.

#### 4.2 `sight_on_request` — **precursor becomes the renderer; its budget tightens 16 → 1, and the census moves**

Kept: all 27 grounded sentence templates (`structural-sentences.ts:8-33`) with their scope
disclaimers, which become the registered per-projection renderers; the `aria-live="polite"` caption
seat; the honest downgrade line *"No disclosed evidence exists here; structural sight remains
available."* (`DrillScreen.svelte:978`); the post-commit arm (§1.1).

Changed: the shipped consumer's `budget: { maxFacts: 16, maxForms: 2 }`
(`evidence-catalog.ts:878`) becomes the module's `maxFacts: 1` with §3 selection. This is the
measured defect the contract retires — R3 recorded median 2 / p95 9 / max 11 captions and up to 19
marks per square gesture with no eligibility, no selection and no budget. **The full census is not
deleted; it moves** to `full_inspector` (leak L7's declared destination).

Repaired: the shipped trigger is pointer-only — chessground's `select` event sets
`selectedSquare` (`DrillScreen.svelte:892`) and the keyboard grid path does not. `design/05` §3-forms
as amended requires *"input semantics must be equivalent for touch, hover/pointer and
keyboard/assistive use"*, so the keyboard activation path sets the same state. Criterion A11.

#### 4.3 `blunder_prevention` — **no precursor; nothing to retire**

There is no staged-move warning anywhere. `Chessboard.svelte:165-185` commits straight from
`moved()` through `apply()` to `onMove`, with no interception point; the only `confirm` in the
drill path is `Timeline.svelte:83-99`'s rewind preview, which is navigation. The module needs a
**staged-move state** before commit, which the board input controller already has
(`board-input.ts:13`: `idle | origin_selected | awaiting_promotion`) but never exposes.
This is new work, and it is the only module of the eleven whose *seat* is also new.

#### 4.4 `threat_radar` — **no learner precursor; the computation exists and is fenced off**

`tactics.ts:996 threats(fen)` ships with a declared convention. Its only production caller is
`apps/server/src/candidate-evidence.ts:131`, inside `childReadings` → `candidateFeatureVector`,
which **no production code calls** — only tests and two `tools/` harnesses. `apps/web/src` contains
zero occurrences of the word. So the module is new surface over shipped arithmetic, and the
projection's `inspector_only` disposition (§2.4) is the fence being removed.

#### 4.5 `postcommit_nudge` — **precursor is replaced; three of its four behaviours are kept explicitly**

The shipped post-commit guard (`DrillScreen.svelte:964-976`, server `guard.ts`) is the closest
thing in the product to a module today, and it fires **only** under
`feedbackPolicy === "immediate_guard"` inside a pack's declared guard window
(`guard.ts:143,163,168`). The module supersedes it and must carry what it does:

| shipped behaviour | disposition |
|---|---|
| fixed headline *"The consequence exposed something concrete."* + closing *"Your played line stays preserved."* (`:967,969`) | **kept** as the module's card frame; the sentences between them become selected, budgeted packets instead of one `<p>` per evidence ref |
| **no cap** on rendered grounds | **replaced** by `maxFacts: 2` — the scarce proactive right |
| two-button dismissal: *Play on* (session-only, per event seq) and *Rewind* to the grandparent node (`:264-269,972-973`) | **kept**, as the seat's chrome; `learnerAction` stays the single contracted action (*branch from this move*), and dismissal is chrome per §1.3 |
| timeline `G` chip, `aria-label="Post-commit guard recorded"` (`Timeline.svelte:74-76`) | **kept**, and generalised: it becomes the seat's count badge on the strip |
| ambient dot tooltip flipping to *"A consequence is ready"* (`DrillScreen.svelte:845`) | **kept** |
| the `immediate_guard`-only firing condition | **widened by the module's own timing** — `post_commit`, gated by `feedbackDeliveryOpen`, in seven workflow contexts. This is a genuine behaviour change and it is the module's purpose |
| the sibling `.evidence-reveal` block and its two sentences (`:957-963`) | **kept**, as region-4 chrome, not a module |

#### 4.6 `structure_nudge` — **precursor is split; two halves become the module, one is corrected**

- Shape-entry chips on the timeline (`Timeline.svelte:51,78`) and `ShapePanel.svelte` **become the
  module's `timeline_mark` and `card` forms.** The panel's framing sentence — *"Named plans for
  this structure — general to the kind of position, not advice for this one."* (`:23`) — is
  `design/05` §3b's law already rendered, and it is kept verbatim.
- The phase reading in `.companion-identity` (`DrillScreen.svelte:941-944`) renders **the raw enum
  chip**, while `phase.ts:91-95` already ships the sentence, including the honest unclassified form
  *"Tabiya's phase bands do not classify this position."* The module renders the sentence. This is
  leak L1's declared destination, and it retires an always-on above-the-board line.
- `assistance.guided === "live"` as the firing gate (`DrillScreen.svelte:282`) is **retired**: the
  gate becomes preset composability, which is what `presets.ts:33` already encodes
  (`structure_nudge` ∈ `guided`).

#### 4.7 `theory_breadcrumb` — **four scattered precursors, three kept as renderers, one is honest-empty**

Kept as registered renderers: the three theory verdicts and `UNKNOWN_THEORY_NOTE`
(`theory-presentation.ts:5-20`) — *"Unknown is not a judgement. The author wrote nothing about this
move…"*; the three-tier authored-claim provenance renderer (`claim-presentation.ts:12-38`); the
corpus renderer with `CORPUS_GUARD`, the 100-game abstention floor and the
`CORPUS_MOVE_OUTCOME_FLOOR` of 100 (`corpus-sentences.ts:3-26`) — under the §2.3(c) operand
scoping, so the guard survives and the per-move list does not reach this module.
Honest-empty at landing: `theory.opening_identity.record@1` — runtime admission is still refused
(`position-evidence.ts:25`), so the breadcrumb renders the absence sentence rather than pretending.
Not absorbed: the raw `packId` button label at `DrillScreen.svelte:935-940` is chrome, and it
is leak L3's SAN repair, owned by `play-composition`.

#### 4.8 `guided_hint` — **no precursor**

Greps for `hint`, `solution`, `best move`, `suggest` across `apps/web/src` return nothing. The
nearest surface in spirit is the checkpoint stated-reasoning flow
(`CheckpointSheet.svelte:110-147`), which is reveal-after-commitment, not a ladder, and is
**untouched**. `rfc/hint-distance.md` (rebuilt draft) owns the per-decision rung state, exact
family/rung disclosure projections and byte-level compiler; this RFC owns the seat, literal
accepts/precedence import and module budget. The former three-stage special case is deleted rather
than left as a second, weaker authority over the same disclosure.

#### 4.9 `compare_coach` — **precursor is kept whole and gains a seat; its renderer is repaired**

`CompareView.svelte` (172 lines) is the largest precursor and it **replaces the whole drill**
(`DrillScreen.svelte:820-830`) rather than occupying a seat. Disposition: the full comparison
surface **stays exactly where it is** — it is a review-scale surface, not a rail card — and the
module's `rail` seat carries the *packet*: the smallest recorded difference, at a checkpoint or in
review, with *enter the other attempt* as its one action. Kept without change: the eight-column cap
and its visible overflow sentence (`compare.ts:15`; *"{n} branches fork here. Comparison renders at
most eight columns…"*), the zoom band, the aligned-ply stepper with its two `HonestControl` refusal
reasons, and *"No piece route past the fork."*

**Repaired, and it is [[D1213]]'s open contract question.** `derived.compare.structure_delta@1`
declares exactly one operand, `observation`; A14 of `learner-modules` demands *"kind, squares,
before/after"*, and no before/after pair crosses the evidence boundary. **A14 is narrowed to the
operands the projection retains** — kind, colour, role, squares/file, count, rendered as an
`appeared` fact — which is what the bounded implementation already ships, rather than widening a
projection this RFC does not own. The alternative (widen the derivation to carry a before
observation) is named and routed, not silently preferred: Discharge D4.

#### 4.10 `review_map` — **two precursors; one becomes the module, one stays out of scope**

`GameStoryScreen.svelte` becomes the module's surface. Kept: the top-eight moment cap
(`:14`, `story.rank.slice(0, 8)`) as the module's per-run moment budget; the not-ready state
*"Evaluation pending: {n} position(s)…"* with its disabled primary and `aria-describedby` reason;
*"Re-enter and play from here"*; the empty state *"No grounded moments were detected in this
game."* Corrected: the **false Story footer** ([[D687]], leak L15) is an attribution error and is
fixed in place. **Not absorbed:** `review.story`'s *selection* stays [[D901]]'s lane and
`rfc/review-map.md`'s; this RFC seats the module and does not re-base the Story. The `/review` run
list is navigation, not a module.

#### 4.11 `full_inspector` — **precursor is subsumed; its four consumers keep their bindings**

The Inspector modal's seven sections stay, and the four shipped consumers
(`inspector.position_structure`, `inspector.move_transition`, `inspector.human_split`,
`inspector.corpus`) become the module's sub-surfaces with their bindings intact — including their
permission gating and its three refusal sentences (*"Available only after this run opens feedback,
and never to participants or spectators."*, *"Recorded human-model splits are unavailable from this
deployment."*, `DrillScreen.svelte:852-861`). Two defects are repaired because the module contract
makes them visible: **the modal has no Escape handler** — `keyboard()` (`:684-692`) handles Escape
for help, fork, picker and compare and not for `inspectorOpen` — and `inspector.position_structure`
has **two independent renderers** (`DrillScreen.svelte:1138-1141` and `CompareView.svelte:161-164`),
which the single registered-renderer requirement of `renderEvidenceItems` collapses to one.
Class-3 operand losses close here as renderer work: `wdl`/`pv`/tablebase detail render their values
with attribution, not *"wdl evidence recorded."* (leak L14).

### §5 — Budgets and `emptyBehavior` are the shipped invariants

#### 5.1 Budgets are backstops, and the instrument is the point

[[D906]] demoted budgets from mechanism to backstop; the mechanism is the reducer pipeline, which
ships. This RFC changes nothing about that and adds the two things that make it observable in
production: the first production call of `reduceModulePacket` (§2.5), and a real recorder behind
`make reduction-pressure`. Unused budget **stays empty** — `applyBackstop` never back-fills — and
overflow emits exactly one `reduction_quality@1` observation before truncating. An instrument
failure is swallowed after being counted: it never widens assistance, never changes packet bytes
and never fails a chess move.

#### 5.2 Honest empty is a rendered state, not a blank

Each module's `emptyBehavior` is contract (`module-contract.ts:56-59`), and composition renders it
under `play-composition.md` §4.3:

- **`silent`** (`rules_floor`, `blunder_prevention`, `postcommit_nudge`) — **no seat row at all.**
  Absence of the card *is* the rendering. `blunder_prevention` is additionally forbidden from ever
  emitting an all-clear: the compiler enforces `silent` for it specifically (`:171`), because
  *"safe"* is a whole-position judgement no rules collector can ground (law 8). Most moves deserve
  silence; an empty nudge is the system working.
- **`stated_absence`** (six modules) — the declared fixed sentence renders **inside the seat's
  normal card at its normal size**, when the module is opened or requested. Never a banner, never
  board-column text, never a spinner as content.
- **`unavailable_source`** (`guided_hint`) — names the absent provider rather than the absent
  answer: *"No engine, tablebase or authored ground covers this position."*

The declared sentences: `sight_on_request` *"No rung-0 observation is scoped to that square."*;
`threat_radar` *"No one-ply threat under the declared convention."*; `structure_nudge` *"Nothing
recognizes this structure."* — which doubles as the content-coverage signal, so [[D690]]/[[D691]]'s
starving is visible rather than silent; `theory_breadcrumb` *"Nothing is written about this
position."*; `compare_coach` *"These attempts do not differ in anything recorded."*; `review_map`
*"No grounded moments were detected in this game."* — the shipped sentence, kept;
`full_inspector` a per-family absence line.

This is `design/05` invariant 5 (*"absence is stated, never simulated"*) applied to the presentation
layer, and it is the direct answer to [[D1432]]'s complaint shape: a positive affordance that
silently does nothing is worse than a stated absence.

### §6 — Arrows: activated as typed relation renderings, never a second chess engine

[[D1564]] resolves [[D1429]] as **activate**. The earlier diagnosis was materially over-broad:
the product has no system-drawn arrow *renderer*, but the catalogue already has exact directed
evidence. `ThreatResult` retains threatening piece, UCI and target; square-control events retain
controller and target; defender duties retain defender and target; ray classifications retain
slider, blocker and target; mobility retains piece and destinations; move/event payloads retain
UCIs and anchors; observed tactic payloads retain their named participants. These projections
already declare `arrows`. Recomputing any of them in Svelte would be a duplicate producer.

Activation is one coupled landing:

1. `evidence-presentation.md` §3.6a's registered `relation_overlay` constructs nodes and directed
   edges only from one admitted payload. Its equivalent sentence and overlay are sealed together
   in the same `RenderedEvidenceItem`; a call site cannot attach an arbitrary arrow.
2. The relation-renderer census is set-equal to every module-eligible projection declaring the
   `arrows` form. A projection retaining only unordered square sets is refused from the relation
   component and may construct only `square_set`.
3. `effectiveArrows` is computed at the module seat from
   `configured arrows ∩ permittedAssistance arrows ∩ module forms ∩ module maxArrows`. Every term
   narrows. The board receives only this bounded result, never a producer census.
4. `assistance.arrows`'s experimental disposition is deleted in the same commit that binds the
   consumer; `evidence-contract.ts`'s bound-or-disposed invariant remains the guard.
5. The raw three-option axis remains configurable under **Advanced**, per the owner's requirement
   that primitives remain reachable, but ordinary workflows operate through named modules and
   presets. It is no longer an inert top-level control and no disabled “future producer” copy
   remains.

Two closure debts are deliberately not hidden by that reuse. [[D1577]] proves the newer five-family
transition-event layer reconstructs every legacy geometry count across 754 committed edges and
retains identities on all 5,314 facts. Nudge and Review therefore import
`TRANSITION_GEOMETRY_EVENT_FAMILIES` and route those admitted events through the sealed relation
adapter; the lossy count readings remain compatibility inputs rather than being widened into a
second authority. [[D1578]] routes capture overlays through the already-admitted
`derived.exchange.capture_class@1`, whose exchange operand retains en-passant's victim square; raw
`capture@1` is refused as the relation source. `guided_hint` cannot turn raw `live.stockfish.pv` into an arrow
([[D1455]]); `hint-distance` must export the measured literal per-family horizon ids **and** the
literal per-family/per-rung disclosure ids. Each retains its own source inputs, relation polarity,
answer image and abstention; only the redacted disclosure enters this module. Both are 1.0 closure
failures until implemented, not reasons to
leave every other arrow dark or to simulate availability.

Arrow-bearing modules are `sight_on_request`, `blunder_prevention`, `threat_radar`,
`postcommit_nudge`, `compare_coach`, `review_map` and `full_inspector`; `guided_hint` joins when its
per-family horizon/disclosure registries and rung compiler land. `structure_nudge` and `theory_breadcrumb` remain square/card
components because their evidence is a shape/citation, not a directed relation. The module budget
is a maximum, never a request to fill the board.

## Deviations from design

1. **`rules_floor` registers no evidence consumer** (`accepts: { kind: "none" }`), a deliberate
   reading of F1's bound-or-disposed law for a module that consumes interaction affordances rather
   than evidence. The compiler already requires this shape for `rules_floor` alone
   (`module-contract.ts:159,179`); this RFC declares it explicitly rather than by omission.
2. **`ModuleAnswerCeiling` gains three members, `ModuleAcceptanceDeclaration` gains one field,
   and `ModuleAnswerContract` gains the closed Guided Hint disclosure member** (§2.3). These are
   catalog-local union/interface extensions, register-silent, and follow the
   precedent `learner-modules` §2 set when it added `at_commit` to the shipped `EvidenceTiming`
   union in the same change that landed its consumers. Neither is a design-tier change:
   `design/05` carries no closed answer-distance vocabulary.
3. **`review_map`'s seat class is singular** (§3.3), amending a two-value phrase in two RFCs to a
   single declarable one. No capability is lost.
4. **The `sight_on_request` post-commit arm is added** relative to `learner-modules` §4.2 (§1.1) in
   order not to retire shipped behaviour. It narrows nothing.
5. Otherwise none. Silence as the default posture, the disclosure model, §3b's naming law, the
   O1–O4 amendments, the [[D659]] parity rule and the [[D745]] denominator rule are implemented
   here, not deviated from.

## Acceptance criteria

> **[[D1455]] narrowed and [[D1569]] corrected in the 2026-08-25 draft amendment.** Raw
> `live.stockfish.eval` and `live.stockfish.pv` are removed from `module.guided_hint`. The module
> instead imports the literal, ordered `HINT_DISCLOSURE_PROJECTION_IDS` produced by
> `hint-distance`; internal horizons remain operator-only and each family/rung passes through the
> sealed byte-level compiler.
> Acceptance remains red until that measured registry exists; a missing family does not license
> a generic wrapper or the forbidden PV binding.

> **Rows landed 2026-08-24.** [[D1444]] — the layer was returned with a paper trail, but its ids are already production currency and a campaign can reward a module that resolves to nothing. [[D1445]] — `MODULE_ANSWER_IMAGE` is exact-match, no ceiling maps to `evaluation`, and the just-ruled grade has nowhere to live. [[D1446]] — binding needs fifteen dispositions deleted atomically, and `pack.authored.classifier@1` has never existed. [[D1447]] — the `arrows` clamp is unenforced and square sight is keyboard-unreachable.

Every criterion names the tree state that makes it RED. A criterion that cannot fail is a named
defect class here ([[D444]]/[[D984]]/[[D1274]]), so each carries its falsifier.

1. **A1 — The registry compiles in production.** `MODULE_REGISTRY` is a compiled
   `CompiledModuleRegistry` with all eleven ids and all fourteen fields per module, and
   `assertModuleRegistry` runs at import. **RED at HEAD `f0d5460`:** `MODULE_DECLARATIONS` has zero
   code hits and `compileModuleRegistry`'s only nine call sites are in `module-contract.test.ts`.
   **Negative:** deleting any one of the four §2.1 cross-file invariants makes an existing fixture
   pass that should fail — each is committed with a fixture that flips one value (a session set,
   an `operator` role, a preset naming a module with no declaration, a novelty-closure gap).
2. **A2 — The eligibility set, asserted by derivation, not by count** ([[D1240]]).
   `make module-registry-census` emits the declared rows from `MODULE_DECLARATIONS` and the
   compiled ids from `EVIDENCE_MANIFEST`; the test asserts **set-equality** between the compiled
   eligibility rows and the census output, with **declared `186 + R` / compiled `185 + R` /
   awaiting `1`** baked only as derived drift tripwires. The 67
   research rows are byte-identical. **RED at HEAD:** eligibility is 67 rows against one research
   consumer. **Negative:** a test asserts `pack.authored.classifier@1` is **absent** from the
   compiled manifest and **present** in `full_inspector`'s `awaiting`; a sibling negative deletes
   one id from `HINT_DISCLOSURE_PROJECTION_IDS` while leaving it in the family×rung registry and
   compilation fails set-equality. The criterion cannot pass vacuously through an awaiting
   wildcard or incomplete horizon family.
3. **A3 — Sessions and roles are derived, not typed in** ([[D1206]]). A fixture mutates one
   `WORKFLOW_CONTEXT_POLICIES` row's `moduleCeiling` and asserts the registry **fails to compile**
   because a module's `ceilings.sessions` no longer matches. A second fixture flips one forbidden
   role (`operator` on `sight_on_request`) and one forbidden session (`match` on `guided_hint`) and
   asserts both fail. **RED at HEAD:** no module declares either field, and the compiler accepts any
   non-empty array — the exact hole the return named.
4. **A4 — The answer ceiling is enforced, and the chain is monotone.** For every module, every
   accepted projection's `answerContent` is a subset of the module's image; a fixture admitting
   `derived.grade.move_quality@1` (`["evaluation"]`) into a module whose ceiling is `threat` is
   refused at admission with a counted refusal. **RED at HEAD twice over:** the images are
   singletons, so `full_inspector` at `principal_variation` admits none of its forty rows; and no
   ceiling maps to `evaluation`, so the grade projection is admissible nowhere.
   **Negative:** a fixture asserting monotone containment along the eight-token chain fails against
   any non-monotone image table.
5. **A5 — Renderer coverage, by set-equality.** Every distinct accepted projection id has exactly
   one registered renderer, asserted set-equal to `make module-registry-census`'s renderer column.
   **RED at HEAD:** `renderEvidenceItems` fails with `EVIDENCE_BINDING_UNDECLARED` for any admitted
   projection without a renderer (`evidence-contract.ts:409`), and no module renderer registry
   exists. **Negative:** `inspector.position_structure`'s two independent renderers
   (`DrillScreen.svelte:1138`, `CompareView.svelte:161`) must collapse to one; a fixture asserting
   a single registered renderer per id is red until they do.
6. **A6 — The disposition set is exactly fifteen, and binding/disposition stay exclusive.** The
   commit deletes the disposition from the fifteen §2.4 projections and from none of the six
   retained ones; `compileEvidenceManifest` fails with `EVIDENCE_PROJECTION_ORPHANED` on either
   direction of drift. **RED at HEAD:** all twenty-one carry dispositions and none is bound.
   **Negative:** a fixture binding `rules.tactic.consequence.threat@1` while leaving its
   disposition in place must fail with that exact code.
7. **A7 — At-commit distinctness.** A fixture stages a move without committing: only
   `blunder_prevention` may produce output. Running the same fixture with the move committed flips
   which modules may fire. **RED at HEAD:** no module produces output at any timing.
8. **A8 — Honest empty, per module, with the two hard negatives.** Each evidence-bearing module's
   zero-eligible fixture renders exactly its declared `emptyBehavior`. **Negative pins:**
   `blunder_prevention` emits **zero bytes** on empty and no string resembling an all-clear exists
   anywhere in its renderer table; `theory_breadcrumb` renders the opening-identity absence sentence
   while `position-evidence.ts:25`'s refusal stands. **RED at HEAD:** no module has an empty state
   because no module renders.
9. **A9 — Budgets are backstops and overflow is loud.** A module whose post-reducer set exceeds
   `maxFacts` emits exactly one `reduction_quality@1` observation whose `dropped` equals
   `afterReducers - backstop` before truncating; silent truncation fails. Unused budget is never
   back-filled. A throwing recorder changes neither packet bytes nor move outcome. **RED at HEAD:**
   `reduceModulePacket` has no production caller, so no observation can ever be emitted.
10. **A10 — Seats render, one expanded at a time, and stage geometry never moves.** A browser
    fixture opens and collapses every occupied seat and asserts `playBoardEdge` is pixel-identical
    across every transition. **RED at HEAD:** no `.svelte` file references a module id, so there is
    nothing to expand.
11. **A11 — Input parity.** Selecting a square by keyboard produces the same
    `sight_on_request` packet as selecting it by pointer. **RED at HEAD:** the keyboard grid path
    never sets `selectedSquare` (`DrillScreen.svelte:892` is bound to chessground's pointer
    `select` event only), so the keyboard produces no caption at all.
12. **A12 — No shipped behaviour is dropped.** One assertion per §4 row: the fifteen
    `board-input.ts` announcement strings, the twenty-seven `structural-sentences.ts` templates,
    `UNKNOWN_THEORY_NOTE`, `CORPUS_GUARD`, the 100-game abstention floor, the eight-column
    comparison cap and its overflow sentence, the guard's two framing sentences, the `G` chip, the
    top-eight moment cap, and the three inspector refusal sentences all still reach a screen.
    **RED against any implementation that rebuilds a surface instead of re-seating it.**
13. **A13 — Arrow activation is sealed, bounded and complete.** The arrow-bearing module set is
    set-equal to §1.4; each rendered edge comes from one admitted fact through the registered
    `relation_overlay`; and `effectiveArrows` is the pointwise narrowing of configured permission,
    role/context permission, module form and `maxArrows`. A fixture lowers each term independently
    and proves the board result only shrinks. `assistance.arrows` loses its disposition in the same
    commit that binds the consumer, and the Advanced control visibly changes the effective output.
    `module.postcommit_nudge` and `module.review_map` each import all five literal
    `TRANSITION_GEOMETRY_EVENT_FAMILIES`; deletion of one family fails set equality. **RED at HEAD:**
    the control renders three selectable options and applies none of them; no sealed relation
    renderer exists. **Negative:** an arbitrary `{orig,dest}` attached by a Svelte caller, a
    relation reconstructed from FEN, and a capture overlay sourced from raw `capture@1` rather than
    `capture_class`'s literal victim square all fail the renderer/coverage guards.
14. **A14 — The compare renderer, narrowed to retained operands** ([[D1213]]).
    `derived.compare.structure_delta@1` renders kind, colour, role, squares/file and count as an
    `appeared` fact on both screen and voice paths; a fixture demanding a before/after pair is
    **deleted**, not left failing, and the widening alternative is carried by Discharge D4.
    **RED at HEAD:** `guidance.ts:60` emits the kind-name placeholder.
15. **A15 — Register silence.** `node tools/register-check.mjs` passes with `none` (C1–C8, C8's
    digest arm included); `node tools/status-parity.mjs` passes with this RFC's Active row present;
    no schema, migration, evidence-kind or `AssistanceConfig` version byte moves. Grep-based and
    able to fail.
16. **A16 — Disclosure boundaries are real, which is why no lane is claimed.** For every module
    timing, a fixture asserts a delivered packet is preceded in the run's event log by its boundary
    event — `feedback.revealed`/`checkpoint.reached` for `checkpoint`, `outcome.reached` for
    `review`, `feedbackDeliveryOpen` for `post_commit`. A module delivering at a timing whose
    boundary event is absent fails, which **voids this RFC's `none` claim rather than hiding it**
    (`intent-presets.md` §6's reopen condition, made executable).
17. **A17 — Sealed rung gate.** Against one selected admitted internal
    `derived.hint.horizon.<family>@1` occurrence, the module may receive only the corresponding
    `derived.hint.disclosure.<family>.<rung>@1` item. Pattern has no square/piece/ply/move bytes;
    square adds targets; piece adds actor; distance adds relation/ply and no move; move adds one
    UCI/SAN and at most one arrow. Every request outside an open boundary or above the effective
    ceiling returns the typed empty/refusal state. Raw PV, internal horizon, authored claim,
    tablebase record and endgame reading are never `module.guided_hint` bindings; theory-only help
    remains independently composable through `theory_breadcrumb`/`structure_nudge`.
18. **A18 — Novelty across two real ancestor nodes** ([[D1164]]). The boundary fixture uses **two
    distinct node ids and distinct move anchors**: a stable fact repeated at ancestor distance
    `noveltyWindow` drops, the same fact at `noveltyWindow + 1` survives, and
    `rules.structural.event.isolated_pawn` never collapses with
    `derived.semantic_avoidance.isolated_pawn`. **RED against the shipped identity**, which keys
    unregistered projections on full retained operands including `nodeId`, so no cross-node match is
    possible — the exact defect the return refused to fake.
19. **A19 — Closeout.** The landing commit flips this RFC's ledger rows, appends the
    `planning/exploration/log.md` entry in the same commit, and writes its SHA into
    `move-quality-grades.md`'s D1 (which its Status line says blocks archival),
    `learner-modules.md`'s D1, and `play-composition.md`'s D2 where those are discharged.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Preset activation in the interface — this RFC seats modules under an effective configuration but adds no preset pill, no disclosure footer and no menu; `loadWorkflowPreset` stays read-only-by-test until they exist ([[D619]], [[D971]]) | intent-presets | the intent-presets surface commit | |
| D2 | `pack.authored.classifier@1` — the projection the D924 amendment named and nothing implements; until it lands, `theory-presentation.ts:24`'s raw classifier token (leak L12) has no inspector home and `full_inspector` carries one declared-awaiting row | claude | the commit that registers the projection or strikes the row | |
| D3 | `play-composition.md` §5.1's vocabulary law needs a review-surface clause, because `review_map` is `timeline`-seated and its own surface renders recorded trajectories (§3.5) | play-composition | the play-composition amendment commit | |
| D4 | Before/after operands for `derived.compare.structure_delta@1` — A14 is narrowed to what the projection retains (§4.9); widening the derivation to carry a before observation is real work with a real cost and is not smuggled in here | review-evidence-compiler | the commit that widens the projection or records the refusal | |
| D5 | Durable per-learner module-delivery records — this RFC's `none` claim rests on packets being recomputable from run state (§tabiya-claims); which stage of a hint a learner requested is not, and durable capture is `longitudinal-store`'s declared grain | longitudinal-store | the longitudinal-store commit adding a module-delivery projection | |
| D6 | Per-timing role narrowing — `ModuleTimingDeclaration` carries timing and initiative only, so `compare_coach` takes the narrower role set across both its arms (§1.2). A spectator loses nothing reachable today, but the contract cannot express what it should | learner-modules | the learner-modules amendment commit | |
| D7 | `HINT_HORIZON_PROJECTION_IDS`, `HINT_DISCLOSURE_PROJECTION_IDS` and the sealed rung compiler — one internal projection per measured family and one learner projection per family/rung, each retaining only its exact evidence inputs, relation polarity, answer image, abstention and scope. The module imports only the literal disclosure set and remains RED while either registry differs from the measured family×rung product | hint-distance | the accepted producer amendment and implementation commit | |

## Open questions

1. **Does `pawn_safe_square` return to requested sight alongside `outpost`?** The owner ruled
   `outpost` explicitly ([[D906]](2): *"just fix the foundation and then keep it in"*), and
   `pawn_safe_square` was excluded on the identical ground, which [[D566]]'s closure discharges.
   §1.3 declares both on that reasoning. If the owner meant the ruling narrowly, one row is removed
   and sight is 21 rather than 22; nothing structural moves. Proposed ledger row.
2. **Answered 2026-08-25 — activate `assistance.arrows`.** [[D1564]] rejects retirement and
   requires the producer→typed relation→module→board path. §6 and A13 carry the coupled work.
3. **Answered 2026-08-25 — `structure_nudge` is proactive as a passive marker, with content on
   request.** [[D1564]] confirms §1.1's declarable reading; no modal or unsolicited prose follows.
4. **Which preset names survive owner use?** All five carry `validation: "candidate"`
   (`presets.ts:32-36`) and `intent-presets.md` §7 makes confirmation an owner ruling after real
   sessions. This RFC reads the table and freezes nothing about the names.

## Ledger rows

Proposed — ids assigned at landing; head was **D1444** at drafting (**D1434** when this document was commissioned; the ledger moved under it, which is why the ids are not pre-assigned).

- **The learner-module registry was returned, not skipped, and the returns were right.**
  [[D1430]] records that nothing was built; `planning/learner-modules/registry-return.md`
  (2026-08-23) records **why** — two named contract gaps ([[D1205]], [[D1206]]) that no implementer
  could close without inventing bytes. The layer's absence is a spec debt with a paper trail, and
  the repo had no instrument that joined "returned" to "still open" at the coordinator's altitude.
- **The eleven module ids are already production currency against a registry that does not
  exist.** `presets.ts:97` executes a set-equality assertion over `MODULE_IDS` on every runtime
  import; `campaign-contract.ts:46,71` and `campaign-validation.ts:54` gate campaign unlock rewards
  on `moduleCeiling`. A campaign can therefore reward a learner with a module that resolves to
  nothing. This sharpens [[D1430]] rather than repeating it.
- **`rfc/learner-modules.md:1019-1023`'s honesty note is wrong in both directions and must be
  corrected at landing.** The modules are not *"production-registered"*, and the presets are not
  *"inert"* — `PRESET_DECLARATIONS` and `WORKFLOW_CONTEXT_POLICIES` compile, self-assert and are
  read from three production files. The missing thing is the join.
- **`MODULE_ANSWER_IMAGE` is an exact-match map, so the accepted contract's ceilings admit
  almost nothing, and no ceiling admits `evaluation` at all.** `module-contract.ts:129-136`;
  `full_inspector` at `principal_variation` can carry none of its forty rows, and
  `derived.grade.move_quality@1` is admissible to no module including the two its own disposition
  names. Found by attempting to write the declarations, which is the only way it could have been
  found.
- **Fifteen projection dispositions must be deleted in the same commit that binds them**, because
  `evidence-contract.ts:603` makes bound-ness and disposition mutually exclusive. The
  disposition-removal set is a decision with a boundary — six stay — and it belongs in a register,
  not in an implementer's head.
- **`pack.authored.classifier@1` was added to an accepted RFC by amendment and has never
  existed.** Repo-wide it appears at `rfc/learner-modules.md:766` and nowhere else. The [[D523]]
  lesson at the amendment seam: a row added to close a leak must be checked for *existence*, not
  only for permission.
- **`permittedAssistance` computes an `arrows` ceiling that no site applies.** `assistance.ts:34`
  produces the value; there is no `effectiveArrows`, in contrast to `effectiveLighting`
  (`DrillScreen.svelte:380`) for the sibling axis. [[D1429]]'s clamp claim holds and is stronger
  than recorded: the field is clamp-*declared*, not clamp-*enforced*.
- **`loadWorkflowPreset`/`saveWorkflowPreset` are written, migrated and read by tests only.** The
  preset preference namespace `intent-presets.md` §6 specified shipped
  (`assistance-preference.ts:19-38`) and no component calls it — the same shape as
  `assistance.arrows`, one layer up.
- **`module-reducers.ts` is not exported from the runtime barrel.** `index.ts`'s module block
  (`:53-78`) re-exports `module-contract.js` only, so the entire reducer pipeline is invisible to
  the package's public surface — a second dead file the [[D1430]] audit did not reach.
- **`sight_on_request`'s precursor is pointer-only.** `selectedSquare` is set from chessground's
  `select` event (`DrillScreen.svelte:892`); the accessible keyboard grid never sets it, so the
  square-sight caption is unreachable by keyboard — a live violation of `design/05` §3-forms'
  input-equivalence clause inside the surface built to satisfy it.

## Changelog

- 2026-08-26: reconciled with the rebuilt `hint-distance` contract. `guided_hint` now imports only
  the family×rung disclosure registry; internal horizons and all raw engine/theory/tablebase rows
  leave its learner binding. Retired the false three-stage authority in favour of the sealed
  five-rung declaration, added the `move` ceiling, and changed derived tripwires to
  declared `186 + R` / compiled `185 + R` / awaiting `1`.
- 2026-08-26: corrected on [[D1577]]/[[D1578]]. The newer transition event authority, not the
  lossy legacy readings, is the module input. Added all five
  `TRANSITION_GEOMETRY_EVENT_FAMILIES` to both nudge and Review, moving the derived eligibility
  tripwires by ten. The relation adapter remains selection/budget-clamped. Capture overlays consume
  the already-admitted `capture_class` endpoint; raw capture is a permanent negative because its
  landing square is not en-passant's victim square.
- 2026-08-25: corrected on [[D1569]]. Removed the invented generic hint-target projection and
  required the measured, literal per-family horizon registry. The 2026-08-26 amendment above
  supersedes its direct learner binding with the family×rung disclosure registry; the historical
  `191 + H` / `190 + H` tripwires no longer govern the draft.
- 2026-08-25: amended on [[D1564]]/[[D1568]]. Arrow activation and proactive structure markers
  are no longer open owner questions. Re-derived the “no producer” claim into existing exact
  directed payloads versus what the pass then classified as lossy emitters; added the sealed
  relation-overlay and `effectiveArrows` contract; made transition hand-off and the per-family guided-hint horizon
  registry hard
  producer dependencies; removed raw Stockfish eval/PV from `guided_hint`; and changed A13/A17
  from inertness checks into able-to-fail activation and stage-boundary checks.
- 2026-08-24: created. Drafted at HEAD `f0d5460` (manifest tuple 35/188/25/210 core, 67/67/15/1
  semantic; `CURRENT_CONSUMER_OPERATION_IDS` 23; ledger head D1444). Every projection id in §1.3
  verified against the compiled catalogue read from `git show f0d5460:` rather than the working
  tree, which carried concurrent uncommitted edits. Six corrections to the accepted
  `learner-modules` contract (§0.2) and two moved facts (§0.3) are each carried with the file:line
  that produced them. The three implementation returns in `planning/learner-modules/` are
  discharged in text: [[D1205]] by re-derivation plus a derivation command replacing the asserted
  total, [[D1206]] by deriving sessions from `WORKFLOW_CONTEXT_POLICIES` and roles from the shipped
  `permittedAssistance` clamp and `review.story` declaration, [[D1164]] by a novelty-identity
  closure set-equal-checked against the modules with `noveltyWindow > 0`, and [[D1213]] by
  narrowing A14 to the retained operands with the widening alternative routed to a discharge.
  Claims: **none**, with the one candidate — a per-module delivery event — examined against the
  run schema and refused on the recomputability argument, made falsifiable by criterion A16.
