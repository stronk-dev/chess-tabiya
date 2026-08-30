# RFC: Module registration — the eleven declarations, the compile site, and the seats

- **Status:** draft — [[D2120]]–[[D2126]] author-repaired 2026-08-30; fresh independent
  buildability review required. The repair publishes generated, digest-sealed 117-row execution
  and 205-binding plans; closes post-adapter budgets, bounded immutable Review paging, the total
  role projection, Inspector's family-partitioned empty algebra and the same-subject derivation
  DAG; and locks the plan to the existing assembly image. `make
  module-registration-author-contract` passes 9/9 and `make module-evidence-assembly` passes
  13/13. Exact repair receipt:
  `planning/learner-modules/second-author-repair-2026-08-30.md`. The
  [[D1870]]/[[D2030]] dependency image remains the owner-ruled measured 207-pair target,
  including requested-Sight `pawn_safe_square`. Prior
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
  is its registry half, and amends it in six places (§0.2)**; returned
  `rfc/intent-presets.md` (its preset/context foundation ships, but D1659–D1663 and the coordinated
  disclosure-receipt clause must be repaired first); implementing `rfc/play-composition.md` (the companion
  region, the seat mechanics of its §4, the leak-destination table of its §5);
  implementing `rfc/move-quality-grades.md` (its projection landed — §0.3);
  accepted `rfc/tactical-collectors.md` and `rfc/breadth-collectors.md` (the projection ids).
  The arrow form additionally consumes `rfc/evidence-presentation.md`'s amended sealed
  `relation_overlay`; the existing identity-preserving transition-event layer, its literal
  relation adapters, and the measured per-family guided-hint horizon **and disclosure** registries are mandatory
  dependencies, not optional availability arms. The move-free theory input is
  `derived.explorer.population_summary@1` from `provider-exchange-and-execution`; wire items use
  the sealed component union from `evidence-presentation`. Neither may be replaced by a legacy raw
  page or a plain JSON evidence object. The legacy count readings remain compatibility
  inputs for pack predicates and do not become a second learner-facing event authority.
- **Parent / amends:** amends `rfc/learner-modules.md` §1.6 (the answer-ceiling image, which as
  shipped is an exact-match map and not a ceiling), §1.7 (`ceilings.sessions`/`ceilings.roles`,
  undeclared for all eleven — [[D1206]]), §4.2 (`outpost` returns on the owner's own [[D906]](2)
  ruling now that [[D566]] is closed; `pawn_safe_square` returns under the owner's 2026-08-30 yes),
  §4.4 and §4.10 (two ceilings corrected to
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
`EVIDENCE_CONSUMER_IDS` (`evidence-catalog.ts:98`), their exact F1 adapters/bindings, the
module-local `production.module_local@1` ordering declaration, the `module-lift@1` table, per-projection
renderers, and the seat components under `apps/web/src`. **None of the six registers moves**:
`DRILL_PACK_SCHEMA_VERSION` 0.27 (lanes 0.28–0.32 live-claimed), run schema 0.17 (lanes 0.18–0.22
live-claimed), shape-entry 0.3, principle-entry 0.1, campaign 1, the migration register (head 25),
and `EVIDENCE_KINDS` (`apps/server/src/sourcing/types.ts`, 7 members) are all unmoved. No
`AssistanceConfig` version move: `version: 4` (`assistance.ts:5`) is untouched and this RFC stores
no new preference — `tabiya.workflow.v1.${context}` already exists
(`apps/web/src/lib/assistance-preference.ts:19`) and this RFC reads it rather than redefining it.

**The one candidate claim, re-examined after [[D1866]].** `rfc/intent-presets.md` §6 makes a reopen
condition binding on exactly this landing: *"if any module rendering path delivers content without
a logged disclosure event, this decision is void."* The earlier draft incorrectly classified all
pre-/at-commit help with legal-move dots. A selected threat or concrete staged-move warning reveals
chess evidence, and the staged candidate cannot be reconstructed from the committed run.

This RFC still claims no run-schema lane, but now for a narrower, falsifiable reason. Post-commit,
checkpoint and Review output is bound to the existing durable run boundary. Pre-commit and
at-commit output must carry §2.5's server-created, non-persisted `ModuleDisclosureReceipt` before
the client may present it. That receipt is explicitly insufficient for novelty, longitudinal
history, hint credit or campaign rewards. The coordinated `intent-presets` author amendment narrows
its condition to permit this exact two-timing exemption and no other. If that amendment is refused,
or if any consumer needs these disclosures after reload, this RFC's `none` claim fails and a
durable per-learner delivery authority must claim its storage/schema work before implementation.
Criterion A16 exercises both durable and ephemeral arms; a rules-floor-only fixture cannot pass.
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
the six-step path from a compiled registry to a rendered seat, including the twenty-three projection
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
registry — including the two the projection's own disposition names. §2.3 replaces the map with
explicit branched capability images. Theory and evaluation are incomparable; neither derives
authority from the spelling order of a TypeScript union.

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

**C5 — `outpost` and `pawn_safe_square` return to `sight_on_request`.** Both
were excluded because their matcher consumed the D566-defective pawn-safety result. [[D566]] is
closed, and the owner's [[D906]](2) ruling names `outpost`: *"just fix the foundation and then keep
it in"*. The owner then answered yes to the isolated `pawn_safe_square` question on 2026-08-30.
The declaration therefore restores both (Sight 20 → 22) and the complete non-hint image is 207.
[[D632]]'s measured zero firings remain an honest-empty availability fact; inclusion does not make
the reading proactive or interesting by default.

**C6 — two ceilings are slack, and a slack ceiling is an unfalsifiable permission.** §4.10 gives
`review_map` a `principal_variation` ceiling while noting *"no accepted projection here carries a
PV"*. Verified: none of its 48 rows declares `candidate_moves`, `move`, `ranked_moves` or
`principal_variation`. A permission nothing can exercise cannot fail a test, so it is corrected to
`evaluation` (§1.1). `sight_on_request`'s `fact` ceiling is corrected upward to `pattern`, because
the literal 22-row set derives an exact `fact + pattern` answer union. `rook_on_seventh` is the
sole pattern witness; `space` and `pawn_connectivity` are separate Structure rows and never part of
Sight. The compiler derives this union from the accepted projection declarations rather than
preserving either prose claim by memory.

#### 0.3 Four dependency facts that moved since `learner-modules` was accepted

**`derived.grade.move_quality@1` exists.** `rfc/move-quality-grades.md` landed its projection
checkpoint; the declaration is at `evidence-catalog.ts:813-823` with
`disposition: { kind: "experimental", reason: "Awaits learner-module consumer compilation for
postcommit_nudge and review_map." }`. The two rows Appendix B marks ◇ **compile at this landing**,
and the disposition is deleted in the same change (§2.4). That also discharges
`move-quality-grades.md`'s D1, which its Status line says blocks its archival.

**Runtime opening identity exists.** `theory.opening_identity.record@1` is an authoring provenance
record whose own limitation refuses runtime guidance. `theory.opening.current_endpoint@1` is the
exact runtime projection and is the sole opening row for `theory_breadcrumb`; the authoring record
is a permanent crossed negative. Its inspector-only disposition transfers atomically to the module
binding (§2.4).

**Seven observed semantic tactics exist and have exact consumer homes.** Deflection, attraction,
line-blocker clearance, square clearance, interference, check zwischenzug and overload
exploitation each bind to Post-commit Nudge, Review Map and Full Inspector: 21 exact pairs. Their
lower operand events `defender_removed` and `defender_duty_relocated` are not learner facts. The
recorded-path compiler is still a hard producer dependency; adding a consumer does not pretend the
multi-edge producer executes today ([[D1870]]).

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
| 7 | `theory_breadcrumb` | post_commit (on_request) | rail | **theory** | 1 / 60 / 0 / 0 | **0** | stated_absence |
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

The runtime role reaches that union through one total projection in `module-registry.ts`, reused
by both module-ceiling and F1-binding checks:

```ts
export function moduleEvidenceRole(role: AssistanceContext["role"]): EvidenceRole {
  switch (role) {
    case "solo": return "learner";
    case "host": return "host";
    case "participant": return "participant";
    case "spectator": return "spectator";
  }
}
```

The REST parser never accepts `author` or `operator` as a run role; an unknown value fails request
parsing rather than reaching this function. No call site compares the two role vocabularies as raw
strings. The full four-source-role image and the two refused evidence-only roles are fixtures.

1. **`author` and `operator` never appear on a learner module.** They are the declared roles of
   `authoring.claim_binding` and `runtime.repertoire_scan` (`evidence-catalog.ts:888-889`); a
   module carrying them would widen a learner surface into an authoring one. Registry invariant,
   failable.
2. **Play-timed guidance modules declare `["learner","host"]`** — the person holding the board and the host
   who may take it. Grounded in the shipped clamp: `permittedAssistance`
   (`assistance.ts:30-34`) grants the disclosive axes only when
   `role === "solo" || role === "host" || reviewing`, and `client-surface-floor.test.ts:37-65`
   pins that refusal for participants and spectators. Applies to modules 2–9.
   `rules_floor` is the non-guidance exception and declares
   `["learner","host","participant"]`: both seated Match roles retain legal destinations and
   the semantic board grid while every guidance module remains outside Match's context ceiling.
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
| `module.sight_on_request` | the `rules.structural.reading.*` kinds derived from `STRUCTURAL_FEATURE_KINDS` minus retired `pawn_count`, **including owner-ruled `outpost` and owner-ruled `pawn_safe_square` per C5**; `rules.castling.reading.{rights, legality}`; `rules.tactic.reading.rook_on_seventh`; `rules.square.reading.control`; `rules.pawn.reading.contacts` | 22 |
| `module.blunder_prevention` | `rules.tactic.consequence.{threat, mate_in_one}`; `rules.tactic.reading.loose_piece` — all three evaluated on the staged-move result position | 3 |
| `module.threat_radar` | the blunder three; `rules.tactic.reading.{back_rank, trapped_piece, ray_classification}`; `derived.tactic.defender_exposure` | 7 |
| `module.postcommit_nudge` | 8 `rules.structural.event.*` (the 11 `STRUCTURAL_EVENT_FAMILIES` minus `piece_count`, `direct_attack_count`, `line_blockers`); all 5 `TRANSITION_GEOMETRY_EVENT_FAMILIES`; 7 `rules.transition.event.*` (`TRANSITION_RULE_EVENT_FAMILIES` minus `clock_reset`); `rules.castling.event.rights_lost`, `rules.tactic.event.{double_attack, check, loose_piece}`, `derived.exchange.{capture_class, trade_completed}`, `rules.structural.event.pawn_islands`; the compiled structural plus tactical avoidance sets; `rules.pawn.event.dynamics`, `derived.pawn.event.transitions`, `rules.king.event.zone_state`, `derived.king.captured_zone_defender`, `derived.activity.event.open_file_occupancy`; `derived.grade.move_quality`; all seven `SEMANTIC_WAVE_EVENT_PROJECTION_IDS` whose ids begin `derived.tactic.` | 50 |
| `module.structure_nudge` | `theory.shapes.firing`; `rules.structural.reading.{named_structure, space, pawn_connectivity}`; `rules.phase.reading`; `rules.endgame.reading` | 6 |
| `module.theory_breadcrumb` | `pack.authored.claim`; `theory.shapes.firing`; `derived.explorer.population_summary`; `theory.opening.current_endpoint` | 4 |
| `module.guided_hint` | the literal ordered expansion `...HINT_DISCLOSURE_PROJECTION_IDS` (one sealed `derived.hint.disclosure.<family>.<rung>@1` per measured family/rung pair; never raw PV or the internal horizon) | `R` |
| `module.compare_coach` | `derived.compare.{structure_delta, eval_delta, engine_trajectory, piece_route}`; `run.record.{fork, consequence, objective_transition, checkpoint_hit}` | 8 |
| `module.review_map` | the complete 50-row Post-commit Nudge set; `rules.pivotal.marker`, `rules.phase.reading`, `rules.endgame.reading`; `recorded.engine.eval`, `recorded.tablebase.result`; `live.stockfish.{eval, wdl}`; `run.record.{objective_transition, consequence, imported_result}` | 60 |
| `module.full_inspector` | `rules.tactic.reading.{loose_piece, ray_classification, rook_on_seventh, trapped_piece, back_rank, discovered_latency}`, `rules.tactic.consequence.{threat, mate_in_one, reply_breadth}`, `rules.structural.reading.{space, pawn_connectivity}`, `rules.phase.development`, `rules.castling.reading.{rights, legality}`, `derived.tactic.{discovered_executed, promotion_pressure}` (16); `rules.square.reading.control`, `rules.mobility.reading.piece_destinations`, `rules.pawn.reading.{contacts, candidate_majority}`, `derived.material.reading.role_signature`, `rules.king.reading.zone_state` (6); `live.stockfish.{eval, wdl, pv}`, `human.maia.{policy, candidate_wdl}`, `human.explorer.population`, `live.syzygy.{result, category, distance}`, `recorded.engine.eval`, `recorded.tablebase.result`, `theory.shapes.firing` (12); `rules.phase.reading`, `rules.pivotal.marker`, `derived.compare.{structure_delta, eval_delta}`, `derived.story.rank` (5); all seven observed semantic-tactic projections; ◇ `pack.authored.classifier` (1) | 47 |

Here `H = HINT_HORIZON_PROJECTION_IDS.length` and
`R = HINT_DISCLOSURE_PROJECTION_IDS.length = H × HINT_RUNGS.length`; both are derived from the
final measured family registry and the closed rung vocabulary, not pinned to hand counts. Landing
tripwires are therefore declared **`207 + R`**, compiled **`205 + R`**, and declared-awaiting **2**
(`derived.explorer.population_summary@1` and `pack.authored.classifier@1`). The horizon rows are compile-time dependencies, not
awaiting placeholders. Both grade uses, runtime opening identity and the 21 observed-tactic pairs
compile (§0.3). The dated `f0d5460` census is historical; `make module-evidence-assembly` is the
current exact source. `[V]`

`selection.familyPrecedence` is, for each module, its `accepts` order verbatim — the compiler
requires order-equality (`module-contract.ts:163`), so the table above is simultaneously the
precedence declaration. `selection.policy` is `production.module_local@1` for all eleven. That
identifier resolves in the module registry to the ordering implemented by `module-reducers.ts`;
it is deliberately **not** an `EvidenceSelectionPolicyDeclaration`, whose shape owns exactly one
consumer and whose event-population semantics are the separate research selector ([[D1855]]).

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
(`module-contract.ts:119-127`; [[D2151]]): `rules_floor` `["square"]`; `sight_on_request`
`["sentence","card","square","arrow"]`; `blunder_prevention` `["sentence","card","square","arrow"]`; `threat_radar` `["sentence","card","square","arrow"]`;
`postcommit_nudge` `["sentence","card","square","arrow"]`; `structure_nudge` `["card","timeline_mark"]`;
`theory_breadcrumb` `["sentence","card"]`; `guided_hint` `["sentence","square","arrow"]`; `compare_coach`
`["sentence","card","arrow"]`; `review_map` `["timeline_mark","card","sentence","square","arrow"]`; `full_inspector`
`["panel","card","sentence","square","arrow"]`. `guided_hint`'s arrow budget is reserved for
the selected per-family horizon's direct-move rung and cannot be spent by raw Stockfish PV; the
registry cannot land until the literal horizon registry and sealed rung compiler exist (§6,
[[D1455]], [[D1569]]). Every active arrow form is backed by
the set-equal relation-renderer closure in `evidence-presentation.md` §3.6a.

#### 1.5 `noveltyWindow`, and the [[D1164]] closure

Nine modules take `noveltyWindow: 0`. `rules_floor` and `blunder_prevention` concern only the
current staged moment. Every `on_request` or `explicit_mode` delivery also takes zero:
`sight_on_request`, `threat_radar`, `theory_breadcrumb`, `guided_hint`, `compare_coach`,
`review_map` and `full_inspector`. A repeated explicit request is entitled to the same answer;
novelty suppression there would simulate absence. This resolves [[D1694]] conservatively without
changing `theory_breadcrumb`'s declared initiative.

Exactly two proactive modules take `3`: `postcommit_nudge` and `structure_nudge`. Their active
novelty closure is derived from the literal accepts union and contains 49 unique projections
(43 + 6 with no overlap removed by hand). `NOVELTY_IDENTITY_DECLARATIONS` is set-equal to that
active union. The research matrix also classifies the three theory-only members so changing the
initiative later cannot create an unreviewed identity, but inactive declarations do not count as
the current closure.

The closed declaration union is:

```ts
type NoveltyIdentityDeclaration =
  | { readonly projection: VersionedEvidenceId; readonly kind: "stable"; readonly comparedFields: readonly string[] }
  | { readonly projection: VersionedEvidenceId; readonly kind: "exempt"; readonly reason: string };
```

Every stable field is a literal operand of its projection. The exact grouped matrix is the one
measured in `design/research/module-novelty-identity-closure.md`: structural events use
`family,before,after`; geometry uses `subject,targets_before,targets_after`; non-capture rule events
use `mover,detail`; capture uses `mover,captured,enPassant`; and each remaining family uses the
explicit fields in that dossier. The checker refuses node/event ids, FENs, UCI/move anchors,
shape-node anchors and retrieval timestamps. `derived.grade.move_quality@1` is the one explicit
exemption because it is scoped to the just-committed edge; a later grade with the same class is a
new fact.

`factIdentity` uses the stable declaration and omits absent optional fields rather than serializing
`undefined`. An exempt fact always survives novelty. A projection in the active closure with no
declaration is a compile failure, not an abstention. Distinct-node fixtures prove the same stable
fact matches across different move/FEN anchors, a changed subject does not, and positive versus
avoidance polarity never collapses.

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

#### 2.2 Step 2 — the manifest join, without misusing semantic eligibility

In `evidence-catalog.ts`, append ten `module.*` ids to `EVIDENCE_CONSUMER_IDS`, one
closed consumer declaration per evidence-bearing module, and the exact adapters that bind each
compiled §1.3 acceptance pair. The module acceptance/binding closure is declared **`207 + R`**,
compiled **`205 + R`**, awaiting **2**; these are derived drift tripwires over
`MODULE_DECLARATIONS`, consumer `accepts`, and compiled bindings, never hand-maintained manifest
counts.

`EVIDENCE_MANIFEST.eligibility` and `EVIDENCE_SELECTION_POLICIES` stay byte-identical. This is a
required correction to `learner-modules` §6, not an omitted integration. An
`EvidenceEligibilityDeclaration` names a `SemanticEventDeclaration`; readings, source records and
ordinary derived projections in §1.3 are not semantic events, and the compiler rejects them as
`EVIDENCE_ELIGIBILITY_ORPHANED`. Likewise, an `EvidenceSelectionPolicyDeclaration` owns exactly
one consumer, while `production.module_local@1` is one shared reducer algorithm used by ten
module consumers. Module admission is therefore the closed declaration → consumer → adapter
binding path, and module ordering is the separately typed module-local policy in
`module-registry.ts`. No projection is copied into a second eligibility authority ([[D1854]],
[[D1855]]).

The manifest digest still moves because consumers and adapters move; the docs tuples in
`docs/semantic-evidence.md` and `docs/evidence-contract.md` move in the same commit. A compiler
negative attempts to insert `rules.phase.reading@1` into F1 eligibility and must fail with
`EVIDENCE_ELIGIBILITY_ORPHANED`; a sibling deletes one module adapter while leaving the projection
in that module's acceptance list and must fail module acceptance/binding set equality.

#### 2.3 The four contract repairs this join requires

**(a) Answer distance is a branched capability set, not a total ladder.** Replace the misleading
singleton `MODULE_ANSWER_IMAGE` with an explicit image:

```ts
type ModuleAnswerCapability =
  | "observation" | "pattern" | "threat" | "theory" | "evaluation"
  | "candidates" | "ranked_candidates" | "move" | "principal_variation";

const MODULE_ANSWER_CAPABILITY_IMAGE = {
  observation: ["fact"],
  pattern: ["fact", "pattern"],
  threat: ["fact", "threat"],
  theory: ["fact", "pattern", "theory", "principle", "plan"],
  evaluation: ["fact", "evaluation"],
  candidates: ["fact", "candidate_moves"],
  ranked_candidates: ["fact", "candidate_moves", "ranked_moves"],
  move: ["fact", "move"],
  principal_variation: ["fact", "candidate_moves", "ranked_moves", "move", "principal_variation"],
} as const;
```

`ModuleAnswerContract` declares a non-empty literal union of capabilities (or `none` for
`rules_floor`); compilation unions their images. Theory refuses evaluation, evaluation refuses
theory/principle/plan, and the `move` branch implies neither candidate ranking nor theory or
evaluation ([[D1859]]). A module that ranks and names a move declares both `ranked_candidates` and
`move`; Guided Hint may declare a literal move without silently gaining `ranked_moves`. The
compiler derives the exact accepted answer-content union independently, requires it to be a subset
of the declared capability image, and requires every declared capability to have at least one
accepted witness outside the common `fact` member. This is stricter than a hand-written singular
label without pretending that the `theory` capability's common vocabulary must all occur in every
theory module. Sight's confirmed 22 rows derive exactly `fact + pattern`, with
`rook_on_seventh` as the sole pattern witness.

The literal population required by [[D1868]] is:

| module | declared capabilities | source-derived accepted answer-content union |
|---|---|---|
| `rules_floor` | `none` | — |
| `sight_on_request` | `pattern` | `fact, pattern` |
| `blunder_prevention` | `threat` | `fact, threat` |
| `threat_radar` | `pattern, threat` | `fact, pattern, threat` |
| `postcommit_nudge` | `threat, evaluation` | `fact, threat, evaluation` |
| `structure_nudge` | `theory` | `fact, pattern, plan, theory` |
| `theory_breadcrumb` | `theory` | `fact, pattern, plan, principle, theory` |
| `guided_hint` | exact `guided_hint@1` rung contract | derived from the sealed family×rung registry; no broad fallback |
| `compare_coach` | `move, evaluation` | `fact, move, evaluation` |
| `review_map` | `threat, evaluation` | `fact, threat, evaluation` |
| `full_inspector` | `threat, theory, evaluation, principal_variation` | `fact, pattern, threat, theory, plan, evaluation, candidate_moves, move, principal_variation` |

`make module-evidence-assembly` derives these nine non-empty unions from the same 207-pair image;
changing a projection's `answerContent` therefore fails before a stale table can silently widen a
module. Crossed fixtures keep Theory/Evaluation, Move/Ranking and Guided-Hint rung authority
incomparable.

`guided_hint` uses the closed `guided_hint@1` disclosure declaration specified by
`hint-distance`. Only that module may declare it; every acceptance row is an exact member of
`HINT_DISCLOSURE_PROJECTION_IDS` with exact answer content. The old three-stage branch and its raw
PV mental model are deleted.

**(b) Admission enforces the compiled capability union.** `admitModuleFacts` refuses and counts a
projection whose `answerContent` is not a subset of the module's declared union. No optional
per-entry field may widen the module. Crossed theory/evaluation and pre-move/PV negatives make the
rule able to fail.

**(c) Theory consumes a move-free derived Explorer summary, not operand surgery.** The proposed
`ModuleAcceptanceDeclaration.operands` field is withdrawn. Narrowing `nodeId + result` on the
legacy `CorpusPage` retains `result.moves[]` and its `candidate_moves` authority. The only theory
row is `derived.explorer.population_summary@1`, derived from the node-free
`human.explorer.position_page@1` specified by `provider-exchange-and-execution`. Its payload
structurally omits moves while retaining normalized position/window, population totals/WDL,
recency/source and `CORPUS_GUARD`. A SAN/UCI sentinel present only in the raw page's `moves[]`
reaches neither the module packet, deterministic renderer, component wire, provider input nor
voice allow-list.

**(d) Reducer survivors are re-admitted through the existing authority.** After
`reduceModulePacket`, the server calls `evidenceForConsumer` again with the same consumer id and
`result.facts.map(fact => fact.evidence)`, then passes that branded narrowed view to
`presentEvidenceItems` with the exact `projection + module consumer` adapters owned by
`evidence-presentation`. One admitted projection may produce multiple sealed components/forms for
one consumer and a different component for another; there is no projection-only renderer registry.
A dropped sentinel cannot reach a component, equivalent sentence, provider input or `voiceCheck`;
a structurally forged subset remains refused. No second sealing primitive is added.

#### 2.4 The twenty-three dispositions that must be deleted in the binding commit

This is the single hardest mechanical constraint on the join, and it is invisible until you try.
`evidence-contract.ts:603`:

> `if (bound === (projection.disposition !== undefined)) fail("EVIDENCE_PROJECTION_ORPHANED", …)`

A projection is **either bound to a consumer or carries a disposition — never both.** The live
D1865 acceptance image derives twenty-three module-accepted dispositions. Binding them
without deleting the disposition is a build failure; deleting a disposition without binding is
also a build failure. So the two edits are the same edit.

Deleted (23), derived from the exact 207-pair image rather than maintained as a second list:
`rules.tactic.consequence.{threat, mate_in_one}`,
`rules.tactic.reading.{loose_piece, back_rank, trapped_piece, ray_classification,
rook_on_seventh, discovered_latency}`, `rules.castling.reading.{rights, legality}`,
`rules.structural.reading.{space, pawn_connectivity}`, `rules.phase.development`,
`rules.square.reading.control`,
`rules.mobility.reading.piece_destinations`, `rules.pawn.reading.{contacts, candidate_majority}`,
`rules.king.reading.zone_state`, `derived.material.reading.role_signature`,
`derived.tactic.promotion_pressure`, `derived.grade.move_quality`, `human.maia.candidate_wdl`,
and `theory.opening.current_endpoint`. Most say so themselves — the
threat row's reason is literally *"D794 measured threat presence near background; module admission
waits on Phase 3"* (`evidence-catalog.ts:396`) and the grade row's is *"Awaits learner-module
consumer compilation for postcommit_nudge and review_map"* (`:822`). **Deleting a disposition does
not delete its warning**: each row's `limitations` array retains the measured caveat
(`"Threat presence is not a move grade, recommendation, forcing claim or statement of intent."`,
`:395`), which is where a caveat belongs once a consumer exists.

Named non-module dispositions retained at the original decision boundary include
`derived.tactic.fork_survives_reply`,
`derived.tactic.overloaded_defender_response_conflict`,
`rules.tactic.consequence.forced_mate_after_move`, `rules.tactic.reading.defender_duty_set`,
`rules.exchange.predicate.legal_exchange`, `derived.story.title`. Named so that the deletion set is
a decision with a boundary rather than a sweep. The acceptance gate derives the complete retained
complement from the manifest; this prose list is illustrative, not a second cardinality authority.

#### 2.5 Steps 3–4 — evidence assembly and packet construction, server side

`apps/server/src/module-evidence-assembler.ts` (new) owns the operation missing in [[D1865]]. Its
input is one authoritative, timing-specific subject frame; its output is a frozen declared pool
plus one typed execution receipt per demanded source family. It is not inferred from
`ProducerDeclaration.implementation`, which is documentation, and it does not promote the partial
`guidance.ts:evidencePacket` helper into a universal collector.

`MODULE_EVIDENCE_EXECUTION_PLAN` assigns every distinct compiled projection accepted by a module
to exactly one callable operation and assembly stage. At the reconciled image this is **117 unique
compiled projections** serving **205 compiled consumer pairs**; the two declared-awaiting rows have
no operation and cannot masquerade as no-witness. The compiler derives both sets from §1.3 and
requires exact equality. Every operation declaration carries `{ projection, stage,
operationSymbol, operation, subjectKind, sourceFamily }`; `operation` must be callable, and the
symbol-to-function identity is checked at import. Shared position/edge snapshots execute once per
canonical subject even when several modules consume their projections.

The complete authoring population is not left to the implementer. The generated
`rfc/contracts/module-execution-plan-v1.json` contains one row for every compiled projection in
§1.3, sorted by `projection@version`, with these required fields:

```ts
interface ModuleExecutionPlanRow {
  projection: VersionedEvidenceId;
  producer: VersionedEvidenceId;
  stage: "position_local" | "edge_local" | "position_or_edge_local" | "catalogue_local" |
    "pack_local" | "recorded_local" | "run_local" | "provider_optional" | "derived_after_inputs";
  subjectKind: "position" | "edge" | "run_prefix" | "pack" | "catalogue";
  sourceFamily: string;
  operation: { source: string; symbol: string };
  derivation: null | DerivationPlan;
}
```

`tools/d2120-module-registration-author-contract/contract.test.ts` imports each declared source,
resolves the named function or prototype method and asserts callable identity; it does not accept a
stub. `family-witness.test.ts` executes all eight source families: fixed legal-position/edge/run
fixtures cover local, authored, recorded and derived work, while provider families execute through
deterministic Stockfish, Syzygy, Maia and Explorer seams. A projection
missing from the plan, an extra row, a symbol rename, stage mismatch and a callable that emits zero
declared projection ids each fail separately. The two awaiting projections are published in a
separate exact list and may not enter the plan.

##### 2.5.1 The derived-input DAG is part of the same plan

For a non-derived row `derivation` is `null`. Every row at `derived_after_inputs` carries exactly
one of:

```ts
type DerivationPlan =
  | { kind: "all"; inputs: readonly VersionedEvidenceId[]; sameSubject: true }
  | { kind: "any"; alternatives: readonly (readonly VersionedEvidenceId[])[]; sameSubject: true };
```

The generator copies this from the projection declaration's literal `derivation`, never from its
name or stage. A derived projection without that declaration is an author-contract failure, not an
empty input list. Compilation set-equals the DAG to all derived plan rows, rejects cycles, verifies
every input is itself in the plan or an explicitly recorded source input, and emits one stable
topological order. Each `{projection, canonicalSubject}` executes at most once and its result is
shared by every dependent module.

Propagation is total. `available(result)` continues; `available(no_witness)` yields
`available(no_witness)`; `not_requested` stays `not_requested`; `unavailable`, `cancelled`, `stale`
and `failed_typed` propagate with the input projection id and never invoke the derivation. `any`
executes the first fully available alternative in declared order, records that alternative, and
propagates only after every alternative is unavailable. Inputs from different canonical subjects
fail `MODULE_DERIVATION_SUBJECT_MISMATCH`; an operation may consume only the supplied sealed inputs
and cannot recollect them.

##### 2.5.2 One total compiler emits complete F1 bindings

`compileModuleEvidenceBindings(registry, manifest, adapters)` is the only authority for the F1
rows. For every compiled module acceptance pair it derives all fields, with no caller choices:

- `producer` and `projection` are the manifest projection's literal ids;
- `consumer` is `module.${module.id}@1`;
- `adapter` is the exact pair/form presentation adapter registry entry; no generic adapter id;
- `timing` is the non-empty intersection of the acceptance override (or all module timings), the
  module's `MODULE_TIMING_IMAGE`, and the projection/operation timing image;
- `roles` is the module ceiling after `moduleEvidenceRole`, never raw runtime strings;
- `sessions` is the module's derived session ceiling;
- `forms` is the complete non-empty intersection of projection forms, the module form image and
  registered adapter forms—choosing a smaller convenient subset is a compilation error;
- `answerContent` is the complete projection answer-content set after the module's literal answer
  capability; widening or dropping a member fails;
- `latency` comes from the execution-plan stage's closed latency image; and
- `budget` is `{maxFacts: module.budgets.maxFacts, maxForms: forms.length}`. Post-adapter words,
  marks and arrows are enforced separately by §5.1.

`rfc/contracts/module-binding-plan-v1.json` is generated from that compiler and set-equalled over
the complete binding object, not only consumer/projection keys. Empty intersections refuse the
module declaration; arbitrary form selection, role/session widening and timing/latency/budget drift
are independent negative fixtures.

The timing frames and legal collection are exactly the D1865 research contract:

| timing | authoritative subject | collection boundary |
|---|---|---|
| pre-commit | current cursor node plus validated square | current-position snapshot, then square-scoped facts |
| at-commit | current cursor node plus validated legal staged UCI and derived child FEN | child readings and bounded local consequences; never mutate the run |
| post-commit | mutation result's learner node and exact incoming edge | one edge plus child snapshot, before any automatic opponent reply |
| checkpoint | exact open checkpoint/disclosure boundary | current/run/catalogue facts and explicitly demanded optional sources |
| review | immutable run prefix plus selected node/edge | each distinct node/edge once, recorded facts, then compare/story/grade/path derivations |

Every demanded source returns one closed `ModuleSourceResult`: `not_requested`,
`available(result)`, `available(no_witness)`, `unavailable(reason)`, `cancelled`, `stale`, or
`failed_typed(reason)`. Empty evidence without a source receipt is an assembly failure, not honest
empty. Provider work is demand-driven, budgeted and cancellable; disabled providers are not called.
Derived projections run only after their literal inputs exist and preserve their registered
grounding and abstention. The recorded semantic-tactic arm validates every contiguous node/FEN/move
boundary, compiles the move-evidence chain once, and distinguishes positive witness, no witness and
broken boundary; a hypothetical PV is never relabelled as recorded play.

`apps/server/src/module-packets.ts` then handles one run, one subject, one timing and one effective
module set, per module:

1. Call the assembler once for the request moment, then
   `evidenceForConsumer(EVIDENCE_MANIFEST, { id: "module.<x>", version: 1 }, declaredPool)` to
   obtain the branded `ConsumerEvidenceView`. A forged plain object is refused with
   `EVIDENCE_GENERIC_BYPASS`.
2. `reduceModulePacket(module, manifest, view, { timing, ancestorFacts, recorder })` performs
   admission, lift ordering, dedup, subsumption, novelty and the loud backstop. **This is the first
   production call of the reducer pipeline.**
3. Re-admit the survivors for the same module consumer, then call
   `presentEvidenceItems(narrowedView, MODULE_PRESENTATION_ADAPTERS)`. Coverage is exact
   `module consumer × projection × bound form`, set-equal to the checkpoint-B population in
   `evidence-presentation`; it is not one renderer per projection. The server serializes only
   `presentation.receipt@1` bytes after process-seal assertions, and the client strict-parses and
   reseals them before Svelte sees a component.

The **effective module set** is the existing algebra, not a new one:
`preset.modules ∩ context.moduleCeiling ∩ campaignInventory`, which `presets.ts` and
`campaign-contract.ts:63-75` already compute; this RFC adds `composableModules(context, preset,
campaign?)` as their single entry point so three call sites stop re-deriving it. Session and role
narrowing then apply from `ceilings` and `permittedAssistance`. **Every term only narrows**
(`design/05` §3-forms as amended).

There is no existing generic run/evidence response; the D1689 census found 36 run actions and none
is modules. Add one authenticated `POST /runs/:runId/modules/query` operation backed by
`RunService.queryModules`. The request carries a **typed requested-assistance receipt as untrusted
intent**, because browser local storage is not server-readable ([[D1863]]). It distinguishes
workflow `unset` from a selected preset and assistance preference `unset | explicit | migrated`
using the amended `intent-presets` types; client-local availability is separately typed and may
only narrow client features. The server strict-parses the receipt, recomputes its canonical
`requestedConfigDigest`, derives run context/role/campaign and server-provider ceilings from
authoritative state, compiles the effective configuration, and returns both requested and effective
digests plus suppression reasons. Caller-supplied effective config, permissions, role, session,
campaign state, evidence or server-provider availability remain forbidden.

Its closed timing union is:

```ts
type ModuleQueryRequest = RequestedAssistanceReceiptV1 & (
  | { timing: "pre_commit"; nodeId: string; selectedSquare?: string }
  | { timing: "at_commit"; nodeId: string; candidateUci: string; generation: number }
  | { timing: "post_commit"; subjectNodeId: string }
  | { timing: "checkpoint"; nodeId: string; checkpointId: string; hintRung?: string }
  | { timing: "review"; nodeId?: string; page: {
      readonly prefixDigest?: string;
      readonly cursor?: ReviewCursor;
      readonly limit: number;
    } }
);
```

`ReviewCursor` is the closed `{afterEventSeq, afterBranchId, afterNodeId}` tuple of the final
subject in the preceding page. `limit` is an integer `1..32`. The first page omits both digest and
cursor; the server freezes `{runId,eventHeadSeq,orderedSubjectIds}` into a canonical prefix digest.
Every continuation must return that digest and exact cursor. Rewind/prune, source-node mutation,
cursor omission/duplication or a digest mismatch returns `MODULE_REVIEW_PREFIX_STALE` and no
provider work. Pages are half-open `(cursor, nextCursor]`, so boundary subjects cannot duplicate.

One Review job has a 5,000-ms total collection budget, 500-ms per optional source, 32 subjects per
page and the module declaration's output budgets after merge. `AbortSignal` is threaded to every
optional provider and cancellation returns a typed cancelled source receipt plus no continuation
work. Interim pages carry source receipts and sealed per-subject candidates but never apply the
top-eight prominence rule. The final page deterministically merges by canonical subject id,
deduplicates shared evidence identity, then runs the ordinary reducers and Review top-eight once.
The fixture oracle runs the single frozen prefix in one in-memory pass and must equal the paged final
bytes; a long run, mutation between pages, duplicated/omitted boundary node and provider
cancellation are permanent negatives.

Before an assembler or provider runs, the boundary parser applies four closed validations
([[D1869]]): `selectedSquare` passes chessops `parseSquare` and is scoped to the authoritative node;
`candidateUci` passes `parseUci`, canonical round-trip and membership in that node's exact legal
move set after promotion normalization; `checkpointId` resolves to an open checkpoint occurrence
on the subject boundary; `hintRung` parses through the sealed `HintRung` vocabulary and is no higher
than the server-derived effective ceiling. Generation must be a non-negative safe integer. Invalid
square, malformed/illegal/stale UCI, foreign/closed checkpoint, over-ceiling rung and stale decision
stamp are distinct typed refusals. A browser-normalized value is never server authority.

The server resolves the run, branch and exact **decision stamp**. There is no invented run revision
([[D1858]]). The stamp is derived from existing authoritative
bytes as `{ eventHeadSeq, cursor: { branchId, nodeId }, disclosureBoundarySeq }`, where
`eventHeadSeq` is the last event's contiguous `seq` and `disclosureBoundarySeq` is the exact open
boundary occurrence or `null`. Its canonical digest is recomputed by the server for every request.
A rewind, fork, branch/node change, disclosure close or a return to the same node after another
event therefore produces a different stamp.

The route returns a closed `ModuleQueryPage` carrying `{ runId, decision, subjectNodeId, timing,
generation?, requestedConfigDigest, effectiveConfigDigest, suppressions, sourceReceipts, packets,
disclosureReceipt, review? }`; `decision` contains the stamp fields and digest. `review` is absent
outside Review and otherwise carries `{prefixDigest, pageSubjectIds, nextCursor, complete,
elapsedMs, remainingBudgetMs}`. `packets` is final module output only when `complete`; interim
review candidates remain in the sealed review-page arm and cannot occupy a learner seat.
Each packet carries module id, timing, budget receipt,
`noveltyAbstained`, typed empty state and the sealed-component wire items owned by
`evidence-presentation`. F1 brands are process-local and do not cross JSON; the server serializes
only after brand assertions and the client accepts only the strict component parser. Extra fields,
unknown projections/components, digest mismatch and a subject not belonging to the run are typed
refusals.

Every non-empty response also carries a server-created `ModuleDisclosureReceipt` binding the run,
decision-stamp digest, subject, timing, module id, requested/effective configuration digests and
the ordered presentation-component digests. Post-commit, checkpoint and Review receipts join their
existing durable boundary events. Pre-commit threat/sight and at-commit warning receipts are the
narrow [[D1866]] exemption: they are process/request receipts returned before presentation, not run
events, because the selected square and staged uncommitted candidate cease to exist on reload.
They may prove request/response correlation and prevent unsolicited rendering; they **may not**
satisfy novelty, longitudinal history, hint-stage credit, campaign rewards or later reconstruction.
`intent-presets` §6 must be amended in the same author wave so its reopen condition permits this
exemption only for `pre_commit | at_commit` and still requires durable boundaries everywhere else.
If a later feature needs either transient disclosure after the request, D5's durable per-learner
store becomes mandatory rather than silently promoting this receipt.

Post-commit ordering is load-bearing: `DrillSessionController.move` receives the authoritative
`MutationResult.run`, queries with the learner `subjectNodeId` from that result, and only then calls
`#playOpponentIfNeeded`. Querying the active cursor afterwards would describe the automatic reply.
Pre-commit and checkpoint calls occur only on the explicit selection/hint gesture; Review queries
on surface load and replay selection. The cache key is the complete request plus decision-stamp
digest and effective-config digest. Before publishing an asynchronous result, the server and
client both compare the current stamp with the request stamp; a late result is a typed stale result
and never renders. A mutation, rewind/fork, selection generation, disclosure close or source
availability change invalidates the relevant entry.

#### 2.6 Steps 5–6 — seat, client side

`apps/web/src/lib/module-seats.ts` (new) maps packets to seats; `ModuleSeat.svelte` (new) renders
one seat in the three states `play-composition.md` §4.1 defines (collapsed badged row, expanded
card, empty-quiet); `CompanionRegion.svelte` (new) is the queue that owns the open/close protocol
(at most one expanded seat; expanding one collapses the previous; companion-region internals only,
never stage layout). `DrillScreen.svelte`'s existing `#run-support-region` — today an ad-hoc
`.evidence-seat` holding a reveal button, the guard prompt and the sight caption — becomes that
region's host. Seat expansion state is component state, persisted nowhere, which is why this RFC
stores no preference.

#### 2.7 One staged-move protocol for all five input modes

`blunder_prevention` is inserted after the shared `BoardInputController` produces one exact UCI
and after promotion choice, but before `onMove`. Click, drag and touch already converge at
Chessground's `after`; keyboard-grid and text converge on the same `BoardInputResult.moveUci`.
There is one controller-level state machine, never five interceptors:

```ts
type StagedMoveState =
  | { kind: "idle"; generation: number }
  | { kind: "checking"; generation: number; mode: MoveInputMode; uci: string; restore: InputRestoreReceipt }
  | { kind: "warning"; generation: number; mode: MoveInputMode; uci: string; restore: InputRestoreReceipt }
  | { kind: "unavailable"; generation: number; mode: MoveInputMode; uci: string; restore: InputRestoreReceipt }
  | { kind: "committing"; generation: number; mode: MoveInputMode; uci: string; restore: InputRestoreReceipt };
```

If the module is ineffective, the candidate bypasses the query and commits normally. An honest
empty response commits once and emits no all-clear. A concrete risk holds the exact candidate for
`revise` or exact-once `confirm`. Source/server failure is shown as unavailable and also requires
explicit confirmation; it is never called safe. `revise` restores active square, origin, input
focus and text value. A new gesture or revise increments generation, so late responses are ignored.
The board announces a committed move only after the mutation succeeds, not when a candidate is
staged. A 5-mode × risk/empty/unavailable × confirm/revise matrix, promotion-before-stage and stale
generation fixtures are one acceptance unit.

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

#### 4.7 `theory_breadcrumb` — **four scattered precursors, three kept and runtime opening identity replaces the authoring record**

Kept as registered renderers: the three theory verdicts and `UNKNOWN_THEORY_NOTE`
(`theory-presentation.ts:5-20`) — *"Unknown is not a judgement. The author wrote nothing about this
move…"*; the three-tier authored-claim provenance renderer (`claim-presentation.ts:12-38`); the
corpus renderer with `CORPUS_GUARD`, the 100-game abstention floor and the
`CORPUS_MOVE_OUTCOME_FLOOR` of 100 (`corpus-sentences.ts:3-26`) — over the
§2.3(c) move-free `derived.explorer.population_summary@1`. The guard survives and the raw
per-move list is structurally absent rather than hidden by renderer convention.
The fourth row is `theory.opening.current_endpoint@1`. It renders the exact ECO/name endpoint and
its cited catalogue identity; artifact missing/invalid/digest mismatch uses the row's typed
abstention. `theory.opening_identity.record@1` remains authoring provenance only and is a permanent
runtime crossed negative. No sticky, fuzzy or descendant opening is inferred.
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
which the pair-keyed presentation authority collapses into one registered adapter implementation
per exact consumer pair rather than two caller-owned prose paths.
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

Facts are only the pre-adapter budget. After registered adapters fan one fact into presentation
components, `fitModulePresentation` performs a second deterministic pass over **fact bundles** in
the reducer's retained order. A bundle is the admitted fact, its equivalent sentence and every
component constructed from it. It is atomic: the fit pass keeps or drops the whole bundle, never
truncates a sentence, removes a caption while retaining its marks, or retains an arrow without its
owning fact.

The four counting units are closed:

- `facts`: distinct admitted `factIdentity@1` values retained after reducers;
- `words`: matches of
  `/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu` over each rendered accessible-text string after
  NFKC normalization, counted once per literal string in the bundle;
- `marks`: `square_set` squares, `timeline_mark` anchors and deduplicated `relation_overlay` nodes,
  keyed by `{factIdentity, componentId, square, brush/emphasis}`; and
- `arrows`: deduplicated `move_path`/`relation_overlay` edges keyed by
  `{factIdentity, componentId, from, to, relation, sign}`. Every relation endpoint also counts as a
  mark, so an arrow can never evade `maxMarks`; it counts once in each applicable dimension.

`null maxMarks` means no mark ceiling; every other maximum is inclusive. The pass walks bundles in
the already-declared reducer order and admits a bundle only when the cumulative tuple stays within
all four maxima. A bundle exceeding any remaining dimension is dropped whole and the scan
continues—unused word space cannot buy an extra arrow, and no lower-priority fact displaces an
earlier one. Empty budgets are never back-filled by facts the reducers removed.

Every packet carries a `ModuleBudgetReceipt` with before/after tuples, kept and dropped fact ids,
and a non-empty set of exceeded dimensions per dropped bundle. Any drop emits one operator
`reduction_quality@1` occurrence after the existing fact-backstop occurrence; recorder failure is
swallowed under the same rule. Fixtures cross one fact producing sentence+card+marks+arrows and
overflow each maximum independently, including a relation whose endpoints exhaust marks before
its arrow would otherwise fit.

#### 5.2 Honest empty is a rendered state, not a blank

Each module's `emptyBehavior` is contract (`module-contract.ts:56-59`), and composition renders it
under `play-composition.md` §4.3:

The contract gains one non-generic arm used only by `full_inspector`:

```ts
type InspectorFamilyId =
  | "local_rules" | "authored_theory" | "recorded_run" | "stockfish"
  | "syzygy" | "maia" | "explorer" | "derived";
type InspectorFamilyState =
  | { readonly kind: "available"; readonly factCount: number }
  | { readonly kind: "no_witness" }
  | { readonly kind: "unavailable"; readonly reason: string }
  | { readonly kind: "not_requested" }
  | { readonly kind: "failed"; readonly reason: string };
type ModuleEmptyBehavior = /* existing three arms */ |
  { readonly kind: "family_partitioned";
    readonly families: readonly InspectorFamilyId[] };
```

`full_inspector.families` is set-equal to the eight-member union above and every execution-plan row
maps to exactly one family. The response carries one state per **demanded** family in registry order.
`cancelled` and `stale` source receipts render as `failed` with their typed reason for this request;
they are never flattened into `no_witness`. A family with facts is `available` even when another is
unavailable, so mixed availability cannot collapse to one aggregate all-clear or all-empty sentence.
No other module may declare `family_partitioned`.

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
  `full_inspector` uses `family_partitioned`: each of the eight families renders its exact state,
  for example *"Stockfish unavailable"* beside *"Local rules: 3 facts"*. The sentence vocabulary
  is fixed product copy over typed state and never summarizes the chess content.

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
   in the same `PresentedEvidenceItem`; a call site cannot attach an arbitrary arrow.
2. The relation-renderer census is set-equal to every module-eligible projection declaring the
   `arrows` form. A projection retaining only unordered square sets is refused from the relation
   component and may construct only `square_set`.
3. `effectiveArrows` is computed at the module seat from
   `configured arrows ∩ permittedAssistance arrows ∩ module forms ∩ module maxArrows`. Every term
   narrows. The board receives only this bounded result, never a producer census.
4. The experimental F1 consumer identity `assistance.arrows` is **retired**, not bound. Relation
   projections bind only through the effective `module.*` consumer packets above, so there is no
   second admission path around module selection, budgets or pair-keyed presentation ([[D1867]]).
   `AssistanceConfig.arrows` remains the Advanced preference/clamp and is not an evidence consumer.
   The manifest removal and consumer-id census land atomically, preserving F1's closed authority.
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
2. **The singular `ModuleAnswerCeiling` is replaced by branched `ModuleAnswerCapability`,
   `ModuleAcceptanceDeclaration` gains one field, and `ModuleAnswerContract` gains the closed
   Guided Hint disclosure member** (§2.3). These are
   catalog-local union/interface extensions, register-silent, and follow the
   precedent `learner-modules` §2 set when it added `at_commit` to the shipped `EvidenceTiming`
   union in the same change that landed its consumers. Neither is a design-tier change:
   `design/05` carries no closed answer-distance vocabulary.
3. **`review_map`'s seat class is singular** (§3.3), amending a two-value phrase in two RFCs to a
   single declarable one. No capability is lost.
4. **The `sight_on_request` post-commit arm is added** relative to `learner-modules` §4.2 (§1.1) in
   order not to retire shipped behaviour. It narrows nothing.
5. **F1 eligibility and selection-policy rows are not module registries.** This amends
   `learner-modules` §6.3–§6.4: semantic-event eligibility remains byte-identical; the complete
   module acceptance closure is enforced by declarations, consumers and adapters; and
   `production.module_local@1` is a module-local ordering declaration rather than one impossible
   F1 policy shared across ten consumers ([[D1854]], [[D1855]]).
6. Otherwise none. Silence as the default posture, the disclosure model, §3b's naming law, the
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

> **Rows landed 2026-08-24.** [[D1444]] — the layer was returned with a paper trail, but its ids are already production currency and a campaign can reward a module that resolves to nothing. [[D1445]] — `MODULE_ANSWER_IMAGE` is exact-match, no ceiling maps to `evaluation`, and the just-ruled grade has nowhere to live. [[D1446]] — binding originally needed fifteen dispositions deleted atomically, and `pack.authored.classifier@1` has never existed; [[D2030]] adds runtime opening identity as the sixteenth disposition transfer. [[D1447]] — the `arrows` clamp is unenforced and square sight is keyboard-unreachable.

Every criterion names the tree state that makes it RED. A criterion that cannot fail is a named
defect class here ([[D444]]/[[D984]]/[[D1274]]), so each carries its falsifier.

1. **A1 — The registry compiles in production.** `MODULE_REGISTRY` is a compiled
   `CompiledModuleRegistry` with all eleven ids and all fourteen fields per module, and
   `assertModuleRegistry` runs at import. **RED at HEAD `f0d5460`:** `MODULE_DECLARATIONS` has zero
   code hits and `compileModuleRegistry`'s only nine call sites are in `module-contract.test.ts`.
   **Negative:** deleting any one of the four §2.1 cross-file invariants makes an existing fixture
   pass that should fail — each is committed with a fixture that flips one value (a session set,
   an `operator` role, a preset naming a module with no declaration, a novelty-closure gap).
2. **A2 — The acceptance/binding set, asserted by derivation, not by count** ([[D1240]],
   [[D1854]], [[D1855]]). `make module-registry-census` emits acceptance pairs from
   `MODULE_DECLARATIONS`, consumer pairs from `EVIDENCE_CONSUMERS`, and bound pairs from
   `EVIDENCE_MANIFEST.bindings`; the test asserts exact set-equality across all three **and exact
   object equality to `module-binding-plan-v1.json` for producer, adapter, timing, roles, sessions,
   forms, answer content, latency and budget**, with
   **declared `207 + R` / compiled `205 + R` / awaiting `2`** baked only as derived drift
   tripwires. The 67 research eligibility rows and sole research selection policy are
   byte-identical. **RED at HEAD:** no module consumer or binding exists. **Negatives:**
   `pack.authored.classifier@1` is absent from the compiled manifest and present in
`full_inspector.awaiting`, while the move-free Explorer summary is the second exact awaiting row;
deleting one disclosure id from the family×rung product fails;
   deleting one adapter while retaining its acceptance fails; inserting the non-event
   `rules.phase.reading@1` into F1 eligibility fails exactly with
   `EVIDENCE_ELIGIBILITY_ORPHANED`. The criterion cannot pass through an awaiting wildcard,
   incomplete horizon family, or a second eligibility authority.
3. **A3 — Sessions and roles are derived, not typed in** ([[D1206]]). A fixture mutates one
   `WORKFLOW_CONTEXT_POLICIES` row's `moduleCeiling` and asserts the registry **fails to compile**
   because a module's `ceilings.sessions` no longer matches. A second fixture flips one forbidden
   role (`operator` on `sight_on_request`) and one forbidden session (`match` on `guided_hint`) and
   asserts both fail. **RED at HEAD:** no module declares either field, and the compiler accepts any
   non-empty array — the exact hole the return named.
4. **A4 — Answer capabilities are explicit branches.** For every module, every accepted
   projection's `answerContent` is a subset of the literal union of its declared capability
   images, every declared capability has a non-`fact` witness, and the source-derived union is
   exactly the §2.3 table. A grade admitted to a threat-only module is refused. Crossed negatives prove Theory
   refuses evaluation, Evaluation refuses theory/principle/plan, and Principal Variation admits
   move bytes without implying either branch. Sight's confirmed 22 rows derive exactly
   `fact + pattern`, and only `rook_on_seventh` witnesses pattern. **RED at HEAD:** the singleton
   images cannot represent even `fact + threat`, and no image contains evaluation.
5. **A5 — Presentation coverage, by exact pair and form set-equality.** Every compiled
   `module consumer × projection × bound form` has one or more registered
   `ProjectionPresentationAdapter`s, derived by `evidence-presentation` checkpoint B. One
   projection shared by Nudge, Review and Inspector cannot swap adapters, components or equivalent
   sentences between those consumers. **RED at HEAD:** no `module.*` consumer or pair-keyed module
   adapter exists. **Negative:** the current `inspector.position_structure` caller-owned prose in
   `DrillScreen.svelte` and `CompareView.svelte` must route through its registered adapter; deleting
   one module pair, retaining an unsupported bound form, or substituting another consumer's sealed
   component fails coverage.
6. **A6 — The disposition transfer is derived, and binding/disposition stay exclusive.** The
   commit derives every accepted projection carrying a disposition from the same acceptance image,
   currently the twenty-three §2.4 projections, and removes exactly that set while preserving the
   manifest-derived complement; `compileEvidenceManifest` fails with
   `EVIDENCE_PROJECTION_ORPHANED` on either direction of drift. **RED at HEAD:** all twenty-three
   accepted projections still carry dispositions and none is module-bound.
   **Negative:** a fixture binding `rules.tactic.consequence.threat@1` while leaving its
   disposition in place must fail with that exact code.
7. **A7 — At-commit distinctness and five-mode staging.** Click, drag, touch, keyboard-grid and
   text all produce the same exact staged UCI after promotion resolution. At the staged position
   only `blunder_prevention` may produce output. Honest empty commits exactly once; risk and
   unavailable require revise or exact-once confirm; revise restores each mode's focus/input state;
   a newer generation invalidates a late reply. Running the committed fixture flips which modules
   may fire, and the move announcement occurs only after server acceptance. **RED at HEAD:** every
   input path commits immediately and no module produces at-commit output.
8. **A8 — Honest empty, per module, with the two hard negatives.** Each evidence-bearing module's
   zero-eligible fixture renders exactly its declared `emptyBehavior`. **Negative pins:**
   `blunder_prevention` emits **zero bytes** on empty and no string resembling an all-clear exists
   anywhere in its renderer table; `theory_breadcrumb` renders the typed runtime opening-catalogue
   abstention while the authoring-only record remains refused. **RED at HEAD:** no module has an empty state
   because no module renders. Full Inspector additionally crosses all eight family states in one
   mixed response and set-equals demanded execution families; one aggregate sentence, a missing
   family, or `unavailable` flattened to `no_witness` fails.
9. **A9 — All four budgets are backstops and overflow is loud.** A module whose post-reducer set exceeds
   `maxFacts` emits exactly one `reduction_quality@1` observation whose `dropped` equals
   `afterReducers - backstop` before truncating; the post-adapter atomic fit pass separately crosses
   `maxWords`, `maxMarks` and `maxArrows`, including one fact that fans out to multiple components.
   Sentences and fact-owned captions/marks/arrows are never split. Every drop names its exceeded
   dimensions in `ModuleBudgetReceipt`; silent truncation fails. Unused budget is never
   back-filled. A throwing recorder changes neither packet bytes nor move outcome. **RED at HEAD:**
   `reduceModulePacket` has no production caller, so no observation can ever be emitted.
10. **A10 — Seats render, one expanded at a time, and stage geometry never moves.** A browser
    fixture opens and collapses every occupied seat and asserts `playBoardEdge` is pixel-identical
    across every transition. **RED at HEAD:** no `.svelte` file references a module id, so there is
    nothing to expand.
11. **A11 — Input parity.** Selecting a square by keyboard produces the same
    `sight_on_request` packet as selecting it by pointer. The shared board-input controller now
    makes both gestures reach the same selected-square state (the former D1447 source defect is
    fixed); the criterion remains RED only because no module query or packet exists. The browser
    fixture must cross both gestures through that future route rather than re-testing local state.
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
    and proves the board result only shrinks. The experimental `assistance.arrows` F1 consumer id
    is absent, no raw relation binding exists outside `module.*`, and the retained Advanced
    `AssistanceConfig.arrows` clamp visibly changes only effective module output.
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
16. **A16 — Disclosure boundaries cover every revealing timing.** Post-commit, checkpoint and
    Review fixtures require their durable boundary — `feedbackDeliveryOpen`,
    `feedback.revealed`/`checkpoint.reached`, or `outcome.reached`. Real pre-commit threat/sight and
    at-commit warning fixtures require the exact server-created ephemeral receipt before any
    component renders; a rules-floor-only fixture cannot satisfy either arm. Reusing that receipt
    after a stamp/generation change or for novelty, hint credit, campaign rewards or history fails.
    A revealing timing with neither authority **voids this RFC's `none` claim rather than hiding
    it**, and the coordinated `intent-presets` criterion names the same two-timing exemption.
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
19. **A19 — The module operation is closed end to end.** One production-boundary matrix traverses
    authenticated route → `RunService.queryModules` → strict request parser → module compiler and
    117-projection assembler → reducer → exact pair-keyed presentation → strict sealed-component
    response parser → occupied seat for every timing arm. It proves one positive reach fixture per
    accepted source family, no-witness versus unavailable/failed/broken-boundary receipts,
    provider demand/cancellation and shared collector invocation, plus a post-commit packet bound
    to the learner's new node before the automatic reply. The actual loader/receipt path covers
    unset/explicit/migrated requested assistance and returns independently recomputed
    requested/effective digests. Invalid square, malformed/illegal/stale UCI, foreign/closed
    checkpoint, over-ceiling rung, extra fields, caller-supplied authority, unknown components,
    foreign subject nodes and decision/config/generation invalidation all fail **before any
    collector or provider call**.
    **RED at HEAD:** the route, service operation and client parser/store do not exist, so no
    module id can reach a seat.
20. **A20 — Execution, derivation, paging and role closure.** The 117-row execution plan is
    set-equal to compiled accepted projections and resolves an actual callable for every row; one
    positive per operation family reaches its declared projection. The derivation DAG is
    set-equal to every derived row, acyclic, same-subject and single-execution; missing,
    wrong-subject, cyclic, recomputed and unavailable-input fixtures fail independently. Review
    crosses a >32-subject frozen prefix through multiple pages, equals the single-pass oracle and
    refuses mutation, duplicate/omitted boundary cursors and cancelled provider continuation. The
    sole role projection maps `solo→learner` plus the three identity arms and refuses unknown,
    author and operator route values; both module and F1 checks consume its output.
21. **A21 — Closeout.** The landing commit flips this RFC's ledger rows, appends the
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
| D5 | Durable per-learner module-delivery records — §2.5's ephemeral receipt deliberately cannot reconstruct pre-/at-commit disclosure, earn novelty/hint/campaign credit or feed history; durable capture is `longitudinal-store`'s declared grain and becomes mandatory before any such consumer | longitudinal-store | the longitudinal-store commit adding a module-delivery projection | |
| D6 | Per-timing role narrowing — `ModuleTimingDeclaration` carries timing and initiative only, so `compare_coach` takes the narrower role set across both its arms (§1.2). A spectator loses nothing reachable today, but the contract cannot express what it should | learner-modules | the learner-modules amendment commit | |
| D7 | `HINT_HORIZON_PROJECTION_IDS`, `HINT_DISCLOSURE_PROJECTION_IDS` and the sealed rung compiler — one internal projection per measured family and one learner projection per family/rung, each retaining only its exact evidence inputs, relation polarity, answer image, abstention and scope. The module imports only the literal disclosure set and remains RED while either registry differs from the measured family×rung product | hint-distance | the accepted producer amendment and implementation commit | |

## Open questions

1. **Answered 2026-08-30 — yes, `pawn_safe_square` returns to requested Sight alongside
   `outpost`.** The owner accepted the isolated one-row fork after [[D566]] closed its defective
   basis. The confirmed §1.3 image is therefore 207 pairs and Sight 22; the D1865 instrument fails
   if the row disappears or widens another module.
2. **Answered 2026-08-25 — activate arrows.** [[D1564]] rejects retirement of the learner feature
   and requires the producer→typed relation→module→board path. [[D1867]] distinguishes that ruling
   from the redundant experimental F1 consumer identity, which §6 retires while retaining the
   Advanced config axis as the narrowing clamp.

## Fresh-review routing

| row | author repair; fresh review still required |
|---|---|
| [[D2120]] | generated 117-row operation plan with source/symbol identity and exact projection population |
| [[D2121]] | generated 205-row full binding plan, set-equal to the shared acceptance image |
| [[D2122]] | atomic fact-bundle fit over exact facts/words/marks/arrows units and loud receipts |
| [[D2123]] | immutable prefix, 1..32 paging, total/source budgets, cancellation and single-pass equivalence |
| [[D2124]] | one total runtime-role → evidence-role projection consumed by module and F1 checks |
| [[D2125]] | closed eight-family Inspector state algebra with mixed availability preserved |
| [[D2126]] | exact AND/OR same-subject DAG, topological closure and total propagation rules |
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
- **The original draft found fifteen projection dispositions that had to transfer with their
  bindings.** The live 207-pair derivation now finds twenty-three (§2.4), proving why the transfer
  set must be computed from acceptance rather than kept in prose or an implementer's head.
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

- 2026-08-30 (second author repair): repaired [[D2120]]–[[D2126]] without touching production.
  Generated and digest-sealed the exact 117-row execution and 205-row binding artifacts; locked
  their acceptance image to the established D1865 harness; specified atomic post-adapter budgets,
  immutable bounded Review paging, one total role projection, family-partitioned Inspector empty
  states and the derived-input DAG. The positive author contract passes 9/9 and the shared assembly
  contract passes 13/13. Fresh independent review still gates acceptance and implementation.
- 2026-08-30 (fresh independent return): returned the author amendment on [[D2120]]–[[D2126]].
  The 207-pair acceptance image is intact, but it does not yet determine callable producer reach,
  complete binding bytes, three output budgets, bounded Review work, authorization-role joining,
  Inspector's empty state or derived-input authority. Exact return and 7/7 reproduction are linked
  in Status; no implementation is authorised.
- 2026-08-30 (author return repair): closed [[D1863]]–[[D1869]] in the draft: typed untrusted
  requested-assistance receipts with server re-clamping; exact pair/form presentation adapters;
  a total 117-projection producer execution plan with typed source receipts; ephemeral disclosure
  receipts for the only two non-reconstructable timings; retirement of the redundant raw-arrow
  consumer while retaining its Advanced clamp; literal capability sets and source-derived answer
  unions; and strict square/UCI/checkpoint/rung validation before producer work. Re-derived the
  accepted disposition transfer as 23, not 16. Fresh independent buildability review remains
  required; no acceptance or implementation is claimed.
- 2026-08-30: reconciled [[D1870]]/[[D2030]] against the current compiled catalogue and the
  D1865 assembly instrument. Confirmed 207 non-hint pairs: runtime opening endpoint replaces the
  authoring record; owner-ruled `outpost` and `pawn_safe_square` return; both grade uses compile;
  and all seven observed semantic tactics bind to Nudge, Review and Inspector. Current tripwires
  are 207 declared / 205 compiled / 2 awaiting, plus
  the still-absent Guided Hint disclosure registry. The older 186+R image is superseded, not
  silently hand-edited. [[D1863]]–[[D1869]] were repaired by the later author-return entry above
  and remain pending fresh independent review, not pending author specification.
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
  Claims: **none**. The recomputability argument recorded in that round was narrowed by the
  2026-08-30 return repair: revealing pre-/at-commit output now requires the explicit ephemeral
  receipt and coordinated intent-presets amendment in §2.5/A16.
