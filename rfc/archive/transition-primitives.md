# RFC: Transition primitives — a move-primitive grammar, shipped with both of its consumers

- **Status:** implemented
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/05-in-run-experience.md` §3 (the assistance ladder and the
  2026-08-14 rung-0 scope corrections), §3a (silence is the default), §3-forms (form
  attaches to neither honesty nor timing), §5 (detection is cheap, significance is not —
  *"what is the moved piece no longer doing"*), §5a (pivotal moments without an author);
  `design/03-product-breadth.md:289` gate **B9** (the vocabulary gate; the *four admission
  rules* themselves live in `rfc/archive/structural-reading.md:271-278`, mirrored in
  `docs/structural-reading.md`); `design/BACKLOG.md` rows by title (line numbers drift,
  titles are stable): *Move primitives: what a move DOES (the transition vocabulary)*,
  *Question shapes: the vocabulary supports one, players ask four*, *R1 answered: the
  transition census is cheap*, *R2 REFUTED: routing is a renderer, not a detector*,
  *`structuralDelta`'s cost is a defect distinct from its deadness*, *`structuralDelta`
  and `vacationReading` ship and are dead*, *Discovered-threat visualisation*
- **Exploration gate:** **owner ruling 2026-08-15**, recorded in
  `rfc/archive/predicate-wave-3.md:146-147`:
  *"ship it and make sure they're integrated properly for the just play and drill packs."*
  This overturns `rfc/archive/predicate-wave-3.md` §7 F4's deferral. The ruling is explicit
  about *why* the deferral falls: F4 refused on the `timingWindow` precedent, that precedent is
  about shipping a grammar with **no consumer**, and the ruling supplies two.
- **Depends on:** nothing unshipped. `rfc/archive/structural-reading.md` (implemented)
  supplies the four admission rules, the `structuralExpression` grammar this RFC embeds
  rather than copies, and the evidence-ref discipline; `rfc/archive/predicate-wave-2.md`
  (implemented) supplies the exhaustive-dispatch law (D26); `rfc/archive/adaptive-guidance.md`
  (implemented) supplies `AssistanceConfig` and the passive-marker delivery pattern this
  RFC reuses **without changing**. `rfc/archive/predicate-wave-3.md` **implemented AND archived
  while this draft was being written** — it is a *code* dependency in one direction only, see §12.
- **Parent / amends:** **`rfc/archive/predicate-wave-3.md` §7 F4** (its specification input,
  extended not re-derived), **`rfc/archive/outcome-drill-grading.md`** (a further
  `successCondition` kind), **`rfc/archive/drill-pack-format.md`** (pack schema 0.21 → 0.22,
  additive). **R3 removed the proposed adaptive-guidance / `PivotalKind` amendment.**
- **Supersedes / superseded by:** —
- **Pack schema:** **0.22.** **CORRECTED 2026-08-15 during cross-review: this draft originally
  claimed 0.19 and the claim is now impossible.** `DRILL_PACK_SCHEMA_VERSION`
  (`packages/schema/src/index.ts:2`) and the `$id` at `schemas/drill_pack.schema.json:3` both
  read **`0.20`** on the current tree — `opening-evidence-path` has landed (the `assessedBy`
  `kind: "engine"` arm is present), and the pack version is a single monotonic shared constant
  (`rfc/README.md` §Pack-schema-version register), so a draft cannot land a number *below* the
  tree. 0.19 is a permanently skipped slot in the register — `rfc/archive/validator-integrity.md`
  declined it (`:655`, *"The register's 0.19 slot stays free"*) and
  `rfc/archive/predicate-wave-3.md:39-43` neither took nor reserved it — and the skip is now
  frozen by 0.20 landing over it. **0.21 is claimed by `deviation-classes` (draft, not landed —
  `$defs/deviation` still carries only `at`/`moveUci`/`class`/`offObjective`/`note`), so this RFC
  takes 0.22 and rebases down to 0.21 rather than renumbering unilaterally if `deviation-classes`
  stalls.** Verified on the current tree: `plan_consequence` is still the **seventh**
  `successCondition` arm and 0.20 added no arm, so the eighth-arm claim in §4.1 survives the move.
  **This draft does not edit `rfc/README.md`** — its Active row already exists (`README.md:13`,
  written by the coordinator and still saying 0.19); the Active row's version and the missing
  **0.22 register row** are both flagged for the owner/coordinator.
- **Run schema / migration:** **none, and that is normative.** Run schema stays **0.14**
  (`packages/schema/src/index.ts:1`); `STORAGE_VERSION` stays **19**
  (`apps/server/src/storage.ts:387`, landed with `resistance-spectrum` as migration 19).
  Parent law 1c holds: a rung-0 fact is never persisted. Nothing here is an event, and §4
  refuses to become one. Widening the frozen `RULES_EVIDENCE_FACTS` list
  (`packages/runtime/src/evidence-ref.ts:1-30`) is migration-free by established precedent —
  `predicate-wave-2` added three `structure-*` facts at pack 0.13 and `predicate-wave-3` added
  three more (`structure-piece-count`, `structure-king-zone`, `structure-piece-distance`,
  `evidence-ref.ts:27-29`) at 0.18, both with no migration. Re-verified as a *mechanism* rather
  than an analogy: refs are persisted as bare `string`s
  (`ObjectiveTransitionRule.evidenceRefs` in `objective.ts`), no JSON
  schema enumerates them (`grep "rules:" schemas/` is empty), so no historical row can contain a
  string that did not exist and nothing narrows. **Migration-free is not work-free** — §4.5 lists
  the four files that must move in lockstep, which is the correction the `"draw"` widening at
  0.16 (`rfc/archive/authoring-frictions.md`) had to make after missing exactly this.
- **Shape-entry schema:** **unchanged, deliberately.** A shape entry's
  `plans[].success.signature` is a `structuralExpression` evaluated against **one** position;
  a transition expression is not one and is refused there by §7 R3. `SHAPE_ENTRY_SCHEMA_VERSION`
  is `"0.3"` (`packages/schema/src/index.ts:3`, landed with `predicate-wave-3` and unmoved by
  0.20); this RFC leaves it there and touches neither copy of the duplicated `$defs`.
- **Client preference:** **unchanged.** `AssistanceConfig` stays **v4**
  (`packages/runtime/src/assistance.ts:3-14`) and `apps/web/src/lib/assistance-preference.ts`
  gains no migration branch. §5 explains why the Just Play surface needs no new switch, and
  that is a deliberate result rather than an omission.
- **Planning:** `planning/transition-primitives/` (once implementing)


> **R3 MEASURED, 2026-08-15 — the live tier is NOT supported, and it fails this RFC's own bar
> arithmetically rather than by judgment.** `{D}`, over 634 transitions and 15,989 enumerated
> legal alternatives:
>
> - **The bar was "a reader judges a clear majority informative".** Of 44 `defended_duty_acquired`
>   witnesses, **13 (29.5%)** clear the necessary conditions — and because they are *necessary*,
>   29.5% is an **upper bound**. A clear majority is unreachable by arithmetic. **No reader study
>   is needed to answer this.**
> - **The second bar was "materially better than a random quiet move".** It signals on **2.1%** of
>   played moves against **3.4%** of quiet alternatives — **0.61×, the wrong direction.** The
>   reason is worth keeping: *overload is what bad moves create, and a spine is made of endorsed
>   moves.*
> - **§5.4's threshold rationale is invalid, twice.** Selectivity does not predict quality
>   (Spearman ρ = **−0.143**; the cleanest leaf is the second-commonest), and the corrected rates
>   collapse the "37-point empty band" to **5.5 points** — membership survives, *"forced rather
>   than tuned"* does not.
> - **Two published figures were not leaf rates at all:** `escape_squares_changed` is **94.0%**
>   (61.2% was `lost`-only and non-mover-colour-only), and `move_irreversibility` is **24.6%** with
>   `clock_zeroed` included, not 13.2%. Corrected attack/defence rates: 51.3 → **37.5%** and
>   76.5 → **34.1%**.
> - **`slider_lines_changed` looked like the best leaf and dies on the alternatives axis** —
>   **1.05× lift**, 32.5% of the same position's alternatives also signal. Without that axis the
>   analysis would have recommended putting it live. It is R2's renderer-not-detector in a new
>   costume.
>
> **Take the pre-authorised fallback: remove `defended_duty_acquired` from the live tier.** The
> measured alternative is one step further out — a **T∧C-gated** variant fires at 2.1% (4.0% on a
> learner-proxy population) with **0% false positives by construction**, ~0.8 markers per 20-ply
> branch, and **zero firings across 259 endgame transitions** (it is an opening/middlegame
> instrument). Whether that conjunction survives rules 2 and 5 is an RFC question; the dossier's
> own note is that sole-defender is a property of `after` alone, so it belongs as a **surface
> conjunction, not a new leaf**. Also measured: the **released** direction — which this RFC does
> not ship live — is the sharper half at 38.5% FP and **2.19× lift**.
> **The on-request tier is untouched by this ruling but is not clean either:** it prints 6.18
> observations per ply of which 0.68 clear the gate — an **89.0% false-positive rate at the
> observation level.** Silence-by-default and learner-initiated disclosure are what make that
> acceptable; it should be stated, not assumed.


> **OWNER RULINGS 2026-08-15 (late) — open questions 7 and 8 are decided.**
> **Q7 — `structuralDelta`: FIX the cost, then leave it.** Not deleted (the discovered-threat
> surface is a ledgered product idea, and deleting an exported function is a public-API
> decision), and not left as-is (that is the trap where someone enables it later and ships the
> cost). **This RFC now owns the fix**: rewrite `evictionChanges` (`structure.ts`) so each FEN is
> parsed once instead of 256 `pawnSafety` calls each re-parsing — ~43% of its 1721 µs/ply, and
> density-independent, so it costs 652 µs even on ≤8-piece endgames where the whole census costs
> 7.5. **The exclusion is unaffected and criterion 6 still holds: fixing is not consuming**, and
> the module-graph test must still assert no transitive path from the transition grammar to
> `structuralDelta`/`vacationReading`/`pawnSafety`. `vacationReading` stays dead and untouched so
> F4's discovered-threat trigger survives intact.
>
> **Q8 — `NEVER_PRESENT` stays an ERROR, with the improved diagnosis.** Confirms the
> recommendation `expression-census` §5c put on the record. The refusal is defensible precisely
> because its corpus is *the pack's own assertion*, and a witness does not contradict that. A
> warning would return this to the `timingWindow` answer — a subsystem shipped with no
> enforcement, zero uses across 145 checkpoints, a gate blocked for months. **Ship the three-row
> diagnosis table** so a refused author sees exactly what was checked and where, rather than a
> bare code. No `witness` field in this lane.

## Summary

Every predicate in the shipped vocabulary is a feature of a *position*; none is a feature of
a *move*. `rfc/archive/predicate-wave-3.md` §7 F4 established that the missing category is real, that
it is an **extraction rather than an invention**, and that it must be a **sibling grammar**
with a sibling evaluator — `matchesTransitionExpression(before, moveUci, after)` — never a
`StructuralExpression` member, because the root position has no predecessor and
`matchesStructuralExpression(fen, …)` (`packages/runtime/src/structure.ts:417`) has one
position by construction. F4 then refused to ship it, on the `timingWindow` precedent: a
grammar shipped ahead of its consumer earns zero uses. That precedent is now sharper than
when F4 wrote it — re-verified this pass, **`timingWindow` and `timingWindows` have 0
matches across all of `content/`**, on a tree where pack schema 0.17 has *landed* (and 0.18,
0.19-skipped and 0.20 after it) and the whole subsystem (schema `$defs`, `successPredicate` arm, seven verdicts, six `TIMING_WINDOW_*`
refusal codes) is code-complete.

The owner's 2026-08-15 ruling supplies the two consumers and this RFC ships all three
together. The grammar is **six leaves and five nodes**, all of them set differences over two
positions that already exist in the run. The **drill-pack consumer** is one new
`successCondition` kind, `transition_feature`, with a validator rule that is the direct answer
to the precedent: **a transition condition that never fires, in the direction its author
claimed, on any of its own pack's authored transitions is refused at load**, so the grammar
cannot be authored inertly the way `timingWindow` was. That rule is a **coverage** rule and §4.4a
is explicit that it is not a satisfiability check — the distinction the repo measured on the
knight-vs-bishop fan, where an expression fired on 0 of 346 corpus positions and was still
correct. The **Just Play consumer** is two surfaces that already exist and are reused verbatim:
the closed-by-default reading disclosure (`apps/web/src/lib/DrillScreen.svelte:729-737`) gains
a transition sibling, and `PivotalKind` (`packages/runtime/src/pivotal.ts:10`) gains exactly
one new marker — `defended_duty_acquired`, the 6.7%-firing overload count that the R1
measurement identified as the sharpest instrument in the set and that the owner named himself.
No new component, no new gate, no new preference key, no new disclosure policy.

The measurements are done and this RFC spends them rather than repeating them
(`design/research/move-primitive-computability.md`): the entire census costs **29.06 µs/ply**
from two FEN strings, so cost is an argument in neither direction; ~70 of 290 implementation
lines are verbatim copies of code that already ships and is **private**; and the primitives
order by selectivity **overload 6.7% < check 7.1% < irreversibility 13.2% ≪ attacks 50.6% <
lines 52.6% < escape squares 61.2% < defences 74.9%**. That ordering is not decoration — §5
turns the 37-point gap between 13.2% and 50.6% into the rule that decides which primitive may
appear unasked and which may only answer a question the learner asked. **Two of those seven
numbers are strict upper bounds** (§2.4), so the gap can only shrink; §5.4 and criterion 2 make
the live tier conditional on re-measuring it rather than asserting the partition is settled.

Three things are refused by name. **Routing-as-detector** does not come back, and §7 R1 states
the structural mechanism that prevents it rather than promising restraint. **`structuralDelta`
is excluded, not fixed** (§8), and the `position` node makes it unnecessary rather than merely
unused. And **no primitive may carry a verdict** — §9 is the ADR-0005 section, and it is the
central risk of this RFC, because the whole point of the category is telling learners things.

## Motivation

### 1. What F4 specified, and what this RFC adds to it

`rfc/archive/predicate-wave-3.md:1289-1374` is the specification input. It is already written and
cross-reviewed, and this RFC extends it rather than re-deriving it. Inherited verbatim:

| F4's finding | Where | Taken as-is |
|---|---|---|
| Every predicate is a feature of a position; none is a feature of a transition | `:1292-1296` | Yes — §2's premise |
| It cannot be a `StructuralExpression` member; it must be a sibling grammar with `matchesTransitionExpression(before, moveUci, after)` | `:1318` | Yes — §2's signature, unchanged |
| The input is available where conditions are evaluated: `Node` carries `parentId`, `fen`, `moveUci`; `pathToNode` already walks parents | `:1319` | Yes, and §4 pins the exact call site |
| The category is an **extraction, not an invention** | `:1298-1312` | Yes — §3 quantifies it |
| The admissible taxonomy rows: attacks/defences created-removed, lines opened/closed, control delta, escape squares removed, overload-as-a-count, per-move irreversibility | `:1327-1332` | Yes — §2's six leaves are exactly these, with two dispositions stated in §7 |
| The name must be the count (`defended_duties`), never `overloaded` | `:1331` | Yes — §2.5, §9 |
| Routing's *delta* is not admissible as a detector | `:1333` | Yes, and §7 R1 makes it structurally inexpressible |
| Prophylaxis is not taken (F9); tempo accounting is not taken (`tempo-vocabulary`) | `:1352-1354` | Yes — §7 R4, R5 |

What this RFC adds, and it is all consumer-shaped: the leaf shapes and their arithmetic; the
`position` bridge node; the attachment point in the pack format and its evaluator route; the
inertness refusal; the Just Play surface and the selectivity rule that governs it; and the
law-8 rendering contract.

### 2. Why the precedent is answered rather than repeated

F4's argument is worth restating in its strongest form, because this RFC must survive it.
`timingWindow` shipped `windowOpens` and `luxuryMoveBudget` that no evaluator reads, and
earned **0 uses across all 145 corpus checkpoints**, blocking the E3 gate. Being cheap is what
makes a predicate *tempting*, not what makes it right.

Re-verified on the current tree, and it is worse than F4 could state: pack schema **0.17 has
landed** (`rfc/archive/tempo-vocabulary.md` is in the archive; the tree has since moved on to
**0.20**), so the timing-window subsystem is now fully shipped — `$defs/timingWindow`
(`schemas/drill_pack.schema.json:684`), the `timing_window` success-condition arm (`:367`),
`$defs/tempoVerdict` (`:708`), the `timingWindow` `ObjectivePredicate`
(`packages/runtime/src/objective.ts:87-93`), the `successPredicate` arm
(`apps/server/src/pack-orchestrator.ts:245-256`), and six `TIMING_WINDOW_*` refusal codes —
and **`grep -r timingWindow content/` returns 0 matches**, as does `timingWindows`. A complete,
correct, unused subsystem. That is the failure this RFC must not reproduce.

Three properties are designed against it, and they are the reason this RFC is acceptable where
F4 was not:

1. **Both consumers ship in this RFC**, not in a follow-on. The ruling required it and the
   acceptance criteria enforce it (§13, criteria 9–11).
2. **The pack format refuses inert authoring.** `TRANSITION_EXPRESSION_NEVER_PRESENT` (§4.4)
   is a load error, evaluated by replaying the pack's own spine — machinery the validator
   already runs (`authoredSpineFens`, `apps/server/src/pack-validation.ts:170-186`). A pack cannot ship a
   transition condition that never fires. There was no equivalent rule for `timingWindow`.
3. **The Just Play consumer adds no new surface to go unused.** It widens two shipped ones.
   A marker that nobody opens is visibly dead in a place people already look.

### 3. Scope boundary

Out, each with the reason rather than deferral language:

- **Prophylaxis.** `rfc/archive/predicate-wave-3.md` §7 F9: the missing term is an opponent model, not
  a board fact. `rfc/archive/resistance-spectrum.md` owns opponent modelling. Not absorbed,
  not re-defined, no name reserved (§7 R4).
- **Tempo accounting, timing windows, the luxury budget.** `rfc/archive/tempo-vocabulary.md`
  owns them and has landed. Nothing here reads or writes `timingWindow` (§7 R5).
- **"Does the move force a reply."** Not mechanical
  (`design/research/move-primitive-computability.md` §3c). Two cheap proxies were measured and
  neither is the thing; forcing means the opponent has no *good* alternative, which needs a
  search or an opponent model. Routed with F9 (§7 R6).
- **Routing / repositioning as a detector.** Refuted by measurement at a 98.7% false-positive
  rate. The static leaf survives and is being admitted by `predicate-wave-3` as
  `piece_distance`. §7 R1 refuses the delta and states the mechanism that keeps it out.
- **`structuralDelta`.** Excluded, and the exclusion is enforced rather than promised (§8).
- **Intent-relative grading.** `rfc/archive/predicate-wave-3.md` §7 F1's blocker is unchanged: the
  learner's declared plan is not recorded as data. A transition census does not change that.
- **Multi-move claims** — "over the last four moves the knight went d2–f1–g3–f5". Piece-route
  reconstruction already ships (`packages/runtime/src/compare-strips.ts:40-46`, exported type
  `PieceRoute` at `:9`, `index.ts:27`), and this RFC does **not** lift it. The grammar takes
  exactly one transition; a route is a path claim and belongs with the history refusal (§7 R3).

## Specification

### 1. Where the arithmetic already lives — the extraction, quantified

F4 claims the category is a lift. `design/research/move-primitive-computability.md` §3d
measured it: 290 lines total, of which ~70 are verbatim copies of shipped code that cannot be
imported because it is **private**. Verified by symbol name on the current tree (the tree moved
several times on 2026-08-15; several standing citations have drifted and are corrected here):

| Arithmetic | Current location | State |
|---|---|---|
| Captured role across a move (parses the UCI, resolves the mover from the **parent** board, handles en passant) | `capturedRole`, `packages/runtime/src/pivotal.ts:32-39` | **private** — module-local, not exported from `pivotal.ts` or `index.ts` |
| Irreversibility classification (castled / last-of-role / pawn break) incl. the pawn-contact before-vs-after test at `:51-54` | `irreversibility`, `pivotal.ts:41-57` | **private** |
| Legal-move count, one ply | `legalCount`, `pivotal.ts:23-30` | **private**; used once, at `:85` |
| Slider-ray blocker counting — the `line_blockers` arithmetic | `structure.ts:469-477` (the ray walk; the observation is pushed at `:475`). **There is no function named `lineBlockers`**; the same arithmetic also appears as the matcher at `structure.ts:371` | inlined twice, exported never |
| Single-square attacker count | `directAttackCount`, `structure.ts:211` | **private** — not exported from `structure.ts` or `index.ts` |
| Feature delta across a move | `structuralDelta`, `structure.ts:498-508` | exported (`index.ts:71`), **dead** — sole non-harness consumer is `structure.test.ts` |
| Discovered consequence | `vacationReading`, `structure.ts:510-520` | exported (`index.ts:74`), **dead** — no unit test at all; only `tools/r1r2-primitives-harness/r1.test.ts:5` touches it |
| Transition reading already on screen | `pivotalMarkers`/`renderPivotalMarker`, `pivotal.ts:71-96` / `:98-106`; rendered at `DrillScreen.svelte:277-279`, `Timeline.svelte:75`, `DrillScreen.svelte:929` | live |

**Citation drift, recorded because several living documents carry it and because the tree moved
four times on 2026-08-15 — twice while this draft was being written.**
`design/BACKLOG.md` (*`structuralDelta` and `vacationReading` ship and are dead*),
`design/research/move-primitive-computability.md:125-126` and `rfc/archive/predicate-wave-3.md:1307`
all cite `index.ts:52,55` for the two dead exports; the current lines are **`index.ts:71` and
`:74`**. `rfc/archive/adaptive-guidance.md:18` cites `structure.ts:248,283` for
`structuralReading`/`structuralDelta`; actual **`:449`** and **`:498`**. The dossier's
`structure.ts:401-410` for the ray walk is now **`:469-477`**, and its `structure.ts:429-432`
for the eviction loop is now **`:502-506`**. Nothing turns on any of it. **Every citation in
this file was verified by symbol name against the tree at drafting; the implementer re-locates
the same way rather than trusting these numbers, and criterion 2 makes that explicit.**

**What this RFC does about it.** A new module `packages/runtime/src/transition.ts` holds the
evaluator and the reading projection. `capturedRole`, `irreversibility` and the slider-ray
walk move into it as shared, exported primitives; `pivotal.ts` and `structure.ts` import them
back. **This is code motion with no behaviour change**, and criterion 3 asserts exactly that:
every existing `pivotal.test.ts` and `structure.test.ts` assertion passes byte-identically.

### 2. The grammar

**Sibling, never a member.** Per F4 `:1318`, and the reason is a type, not a convention:

```ts
export function matchesTransitionExpression(
  before: string,      // FEN of the parent position
  moveUci: string,     // the move played
  after: string,       // FEN of the resulting position
): boolean;
```

`matchesStructuralExpression(fen, expression)` (`structure.ts:417`) takes one position and the
root of a run has no predecessor. A transition node inside `StructuralExpression` would be
undefined at the root and would force every one-FEN call site —
`matchesStructuralFeature` (`structure.ts:340`), `shapeFirings`
(`packages/runtime/src/shape-firing.ts:15-33`), `matchesFenPredicate`
(`packages/runtime/src/objective.ts:168-192`), `guidanceShapes`' trigger evaluation, and the
static validator's `authoredSpineFens` check (`apps/server/src/pack-validation.ts:474`) —
either to carry a path it does not have or to fabricate one. This is the same argument
`rfc/archive/predicate-wave-3.md` §7 F2 uses against history predicates, and it is inherited rather
than restated as taste.

#### 2.1 Nodes — five, closed

```ts
export type TransitionExpression =
  | { readonly kind: "all" | "any"; readonly of: readonly [TransitionExpression, ...TransitionExpression[]] }
  | { readonly kind: "not"; readonly of: TransitionExpression }
  | { readonly kind: "feature"; readonly feature: TransitionFeature }
  | { readonly kind: "position"; readonly at: "before" | "after"; readonly expression: StructuralExpression };
```

`all`/`any`/`not`/`feature` mirror the shipped structural nodes exactly
(`structure.ts:418-420`). The fifth is the bridge and it earns its place three times over:

**The `position` node.** It delegates verbatim:
`matchesStructuralExpression(at === "before" ? before : after, expression)`. It adds **no new
arithmetic, no new leaf, and no new evidence fact** — a satisfied `position` node contributes
the same `rules:structure-*` refs its embedded expression always did. What it buys:

1. **It removes the authoring fan.** "The move opened the c-file *and* White now has a
   half-open c-file" is one expression instead of two conditions in two different fields
   under two different kinds.
2. **It subsumes the control-delta row — the square form of it.** F4 marks "control delta on a
   square or region" admissible (`:1329`). The **square** form is not admitted as a leaf here,
   because it is exactly
   `all[ position(before, direct_attack_count(w, e5, atMost, 1)),
   position(after, direct_attack_count(w, e5, atLeast, 2)) ]` — shipped arithmetic, no new kind.
   Two spellings of one census is the rot `rfc/archive/predicate-wave-3.md` §1 exists to prevent,
   and that RFC retired `pawn_count` and declined `king_distance` on exactly this ground. The
   disposition here needs no deprecation because nothing shipped.
   **The region form is a separate disposition and cross-review corrected the draft, which
   claimed the whole row.** "How many squares in this region changed control" is a cardinality
   over an unnamed set; two `position` nodes cannot express it (the shipped `quantified` node
   takes `some`/`every` over a region, never a count), so rule 5 does **not** exclude it. It is
   refused here under **rule 3, zero attestations** — no shape entry, plan or pack has asked for
   it — and routed to R8 with `mirrored`, `quantified` and `mover`. Recorded because "rule 5
   excludes control delta" was doing work it cannot do, and a later wave reading that sentence
   would have thought the region form was already disposed of.
3. **It makes `structuralDelta` unnecessary rather than merely unused** (§8).

And it is cheap in the way that matters: `matchesStructuralExpression` is a *targeted*
evaluator — verified by reading it this cross-review, it dispatches to
`matchesStructuralFeature`, handles `pieceOnSquare` inline and recurses through
`mirrored`/`quantified`, and **never** calls `structuralReading` or `structuralDelta`. Two
`position` nodes cost two predicate evaluations, not two full readings. **One caveat, stated
because criterion 6 turns on it:** a `position` node embedding `pawn_safe_square` or `outpost`
does reach `pawnSafety`, at the shipped leaf's own cost. That is the author's choice of leaf, not
a cost this grammar imposes, and it is why criterion 6 excludes the permitted edge's closure
rather than forbidding it.

**Not admitted as nodes, each with its reason.** `mirrored`, `quantified` **and `pieceOnSquare`**
— the shipped `StructuralExpression` carries seven kinds, not five, and this draft's enumeration
originally omitted `pieceOnSquare` — are not lifted into the transition grammar: zero
attestations, and all three remain reachable *inside* a `position` node, so nothing is lost by
composition. `pieceOnSquare` in particular is the one a reader would expect to want ("the knight
that was on f3 is now on e5"), and the composition that substitutes for it is
`all[ position(before, pieceOnSquare(f3, white knight)), position(after, pieceOnSquare(e5, white
knight)) ]` — which is a pair of position facts and not a transition fact, exactly as rule 5
requires. A `mover` node ("the move was played by White") is not admitted either: every leaf
already carries a `color`, and objective rules already know whose turn it is. All are open
questions (R8, open question 5), not silent omissions.

**Depth cap.** Four levels, the same cap `STRUCTURAL_EXPRESSION_TOO_DEEP` enforces
(`apps/server/src/pack-validation.ts:235,240,247` — *"structural expressions may be nested at
most four levels"*), with its own code `TRANSITION_EXPRESSION_TOO_DEEP`. A `position` node's
embedded structural expression is checked by the shipped walk under its own budget; the two
budgets do not compose into one.

#### 2.2 The admission rule for a transition leaf

The B9 rules are the position-tier rules
(`rfc/archive/structural-reading.md:271-278`). Applied to a transition they need one addition,
because otherwise every static census re-enters as a delta and the vocabulary doubles:

> **Rule 5 (transition tier): a leaf is admitted only if its quantity is a property of the
> *pairing*, not the difference of two position censuses.** Anything that is
> `census(after) − census(before)` is expressible with two `position` nodes and is refused.

**The operative test, sharpened in cross-review.** "Expressible with two `position` nodes" is
the part that decides cases, and it has a narrow reach: the static grammar's counting leaves all
take a **named** square, file, role or region, so two `position` nodes can express a delta only
when the author names the thing. A leaf therefore survives rule 5 if **either** its quantity
needs both boards jointly (same-square identity, a surviving ray key, a threshold crossing, a
UCI) **or** it is a cardinality over a set the static grammar cannot name. Both routes appear in
§2.3's table and the draft conflated them.

That rule is what excludes the square form of `control_delta` (§2.1), what excludes
`structuralDelta` (§8), and what each of the six admitted leaves has to survive. It is **not**
what excludes the region form of control delta, or a `check` leaf (R2 excludes that on the
position/transition boundary), or `pieceOnSquare` — those are rule 3 and category dispositions,
recorded where they belong so rule 5 is not credited with work it does not do.

#### 2.3 Leaves — six, closed

Every leaf but the last has the shape the shipped counting leaves use
(`piece_count`, `direct_attack_count`, `line_blockers`): a selector, a `comparison`, and an
authored `count`. **`comparison` is the shipped `FeatureComparison` — `"atLeast" | "atMost" |
"equal"` (`packages/runtime/src/structure.ts:8`) — reused, not respelled.** ("exactly" is not
the shipped word; a second spelling of the shipped comparison would be the same rot as a
second spelling of a census.) The `count` is an authored comparison operand, never a threshold
the detector chooses — rule 2.

```ts
export type TransitionFeature =
  | { kind: "attacked_squares_changed";  color: Color; direction: "gained" | "lost";       comparison: FeatureComparison; count: number }
  | { kind: "defended_squares_changed";  color: Color; direction: "gained" | "lost";       comparison: FeatureComparison; count: number }
  | { kind: "slider_lines_changed";      color: Color; direction: "opened" | "closed";     comparison: FeatureComparison; count: number }
  | { kind: "escape_squares_changed";    color: Color; direction: "gained" | "lost";       comparison: FeatureComparison; count: number }
  | { kind: "defended_duties_changed";   color: Color; direction: "acquired" | "released"; comparison: FeatureComparison; count: number }
  | { kind: "move_irreversibility";      subkind: "castled" | "last_of_role" | "pawn_break" | "clock_zeroed" };
```

| Leaf | Exact definition, one sentence | Rule 5 | Harness selectivity (upper bound) |
|---|---|---|---|
| `attacked_squares_changed` | The number of squares **occupied by an enemy piece in both positions** that at least one piece of `color` attacks in one position and no piece of `color` attacks in the other | **Unnamed-set cardinality** (primary) + the both-occupied conjunct (secondary) | **≤ 50.6%** |
| `defended_squares_changed` | The same over squares occupied by a **friendly** piece of `color` in both positions | Same, both reasons | **≤ 74.9%** |
| `slider_lines_changed` | The number of (slider square, board-edge endpoint) rays owned by `color` that exist in **both** positions and whose blocker count fell (`opened`) or rose (`closed`) | Pairing: the ray key must survive the move; **and** unnamed-set cardinality — the enumeration is unbounded, so no static leaf names it | **52.6%** |
| `escape_squares_changed` | Summed over pieces of `color` standing on the **same square** in both positions: the number of geometric destination squares uncontrolled by the opponent that were lost or gained | Pairing: same-square identity | **61.2%** |
| `defended_duties_changed` | The number of pieces of `color` on the same square in both positions that cross the ≥2 threshold of *attacked friendly pieces defended* (`acquired`) or fall below it (`released`) | Pairing: a threshold **crossing**, not a count | **6.7%** |
| `move_irreversibility` | Whether the move is classified `castled` / `last_of_role` / `pawn_break` by the shipped `pivotal.ts:41-57` arithmetic, or is a capture or pawn move (`clock_zeroed`, see below) | Pairing: needs the UCI and both boards | **13.2%** (`clock_zeroed`: 13.8%) |

**Rule 5, restated correctly for the first two leaves — a cross-review correction.** The draft
justified `attacked_squares_changed` and `defended_squares_changed` as pairings *because of the
both-occupied conjunct*. That conjunct is real (§2.4) but it is not what keeps the leaf out of
rule 5's ban: without it, the quantity would still not be `census(after) − census(before)` in the
sense rule 5 means, because **rule 5's ban bites on quantities that two `position` nodes can
express, and two `position` nodes can only ever name a square.** The operative property is that
these leaves count over an **unnamed set** — every enemy-occupied square, every ray, every safe
destination — and the shipped static grammar has no cardinality-over-an-unnamed-set operator.
That is the honest reading, it is what actually distinguishes them from `control_delta` on a
named square, and it is what the region-form disposition in §2.1 turns on. Stated here so a
wave-4 author applying rule 5 applies the test that works.

**`clock_zeroed` — narrowed, because as drafted it breached rule 5 and contradicted R2.** The
draft defined it as *"zeroed the FEN halfmove clock"*, i.e. `halfmoveClock(after) === 0`. That is
a fact about the `after` position alone, which is precisely the ground R2 uses to refuse a `check`
leaf ("it is a fact about the `after` position and the side to move there"). Two additional
problems: consecutive captures each leave the clock at 0, so an after-only test cannot distinguish
"this move zeroed it" from "it was already 0"; and the halfmove clock is not read by any shipped
leaf, so a `position` node cannot express it either. **Specified instead as a property of the
move: the move was a capture or a pawn move** — which is what zeroes the clock under FIDE
counting, is derivable from the shipped `capturedRole` plus the mover's role, needs both boards
and the UCI, and therefore passes rule 5 on the same footing as the other three subkinds.

**And `clock_zeroed` is new arithmetic, not extracted arithmetic.** The shipped
`IrreversibilityDetail` union has three subkinds (`castled`, `last_of_role`, `pawn_break`);
`clock_zeroed` is a fourth that exists only in the transition leaf. It does **not** join
`IrreversibilityDetail` and does **not** produce a `PivotalKind` marker — that would change
shipped pivotal behaviour, which criterion 3 forbids. §1's "code motion with no behaviour change"
claim covers `capturedRole`, `irreversibility` and the ray walk; it does not cover this subkind,
and the draft's leaf-table wording ("classified … by the shipped arithmetic") implied otherwise.

`Color` and `role` reuse the shipped schema `$defs`; nothing new is minted for either.

**Geometric, never legal.** Destination sets are board geometry — attack sets minus own
pieces, plus pawn pushes (`tools/r1r2-primitives-harness/primitives.ts:122-136`). No legality
search, no pin resolution, no check handling, or rule 1 fails. Every rendered sentence carries
that scope (§9).

#### 2.4 Two corrections to the harness's keying, and one is load-bearing

The measurement is authoritative for cost and for the *ordering* of selectivity. It is not
authoritative for the leaf semantics, and reading
`tools/r1r2-primitives-harness/primitives.ts` found one place where the two diverge:

**The harness keys attack and defence relations by `(attackerSquare, targetSquare)`**
(`primitives.ts:36-56`). Under that keying, a rook moving d1→e1 while still defending c1
reports one *removed* relation and one *created* one. The owner's question is *"what does that
move stop defending?"*, and the honest answer there is **nothing**. §2.3 therefore specifies
the leaf **target-keyed and colour-keyed**: "does any piece of `color` still attack this
square", not "does this specific piece". The both-occupied conjunct is the second correction —
without it, capturing a defended piece reports the defence as "lost", which is an artefact of
the capture and not a fact about the mover.

**Both corrections are coarsenings, so the firing rates in §2.3 are strict upper bounds.**
Target-keying merges relations; the occupancy conjunct removes firings. Neither can add one.
The corrected rates are unmeasured and criterion 5 requires the implementer to measure them
on the landing corpus, because §5's live/on-request partition depends on the ordering
surviving — not on the exact digits.

#### 2.5 Names, and the rule-4 refusals

`defended_duties_changed` is F4's own ruling (`:1331`): *"the name must be the count, e.g.
`defended_duties`, never `overloaded`"* — the parent's exact disposition for "trapped"
(`rfc/archive/structural-reading.md:294-298`). The refused names, each with rule 4, recorded so
a later wave does not reintroduce one: `overloaded`, `trapped`, `hanging`, `weakened`,
`blunder`, `mistake`, `improvement`, `tempo_gain`, `reposition`, `prophylactic`, `best_move`.
Every one names a verdict about the move; `_changed` names a difference.

**Names swept this pass, and re-swept in cross-review on the 0.20 tree:** **zero** occurrences of
`TransitionExpression`, `TransitionFeature`, `matchesTransitionExpression`,
`transition_feature`, `transitionReading`, `defended_duty_acquired` or `TRANSITION_*` across
`packages/`, `apps/`, `schemas/`, `content/`, `tools/` and `tests/`. **No refusal-code collision:
none of the six §4.4 codes, including the new `TRANSITION_EXPRESSION_NEVER_ABSENT`, exists on the
tree.** `_OUT_OF_RANGE` matches the established refusal suffix
(`PAWN_COUNT_OUT_OF_RANGE`, `OUTPOST_RANK_OUT_OF_RANGE`); `_NEVER_PRESENT` and
`_ALWAYS_PRESENT` match `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` and
`SHAPE_REFERENCE_NEVER_PRESENT` (both `apps/server/src/pack-validation.ts`), which landed with
0.18.

### 3. Cost, settled

`design/research/move-primitive-computability.md` §3a, 593 spine transitions over the pack
corpus, median of 25 passes on Apple M3 Max / Node 26.7.0 / chessops 0.15.1. **The ratios are
the finding; the microseconds are one machine.**

| Quantity | Cost |
|---|---|
| Entire census, one pass, from two raw FEN strings | **29.06 µs/ply** |
| …on dense positions (≥24 pieces) | 33.25 µs/ply |
| …on ≤8-piece endgames | 7.47 µs/ply |
| A 20-ply branch | **0.58 ms** |
| An eight-branch comparison at 20 plies each | 4.7 ms |
| Validating one transition condition over the whole 615-position pack corpus | **≈18 ms** |

Two comparisons put it where it belongs. The evaluator computes only the leaves the expression
names, so 29.06 µs is the **bundle upper bound**, not the per-condition cost. And the Just
Play consumer (§5) rides `pivotalMarkers`, which already calls `legalCount`
(`pivotal.ts:23-30`, a full one-ply legality search) and `classifyPhase` **per node on the
path** (`pivotal.ts:76,85`); the duty delta's 2.78 µs/ply is not visible next to that.

Cost was never the objection to this category and it is now measured as not being one. The
objection was consumers, and §4 and §5 are the answer.

### 4. Consumer 1 — drill packs

#### 4.1 What an author writes and where it attaches

**Exactly one attachment point:** an eighth `successCondition` kind, `transition_feature`.

```json
{ "kind": "transition_feature", "to": "achieved", "from": ["active"],
  "transition": {
    "kind": "all",
    "of": [
      { "kind": "feature", "feature": {
          "kind": "defended_duties_changed", "color": "black",
          "direction": "acquired", "comparison": "atLeast", "count": 1 } },
      { "kind": "position", "at": "after", "expression": {
          "kind": "feature", "feature": {
            "kind": "half_open_file", "color": "white", "file": "c" } } }
    ] } }
```

Read: *the move that just happened gave at least one Black piece a second attacked friendly
piece to defend, and the resulting position has a White half-open c-file.* No verdict — the
condition does not say the move was good, and the objective's own `summary` carries whatever
the author claims.

`to`/`from` come from the shipped `$defs/conditionBase`
(`schemas/drill_pack.schema.json:291-302`) exactly as the other seven arms do, so the same
condition shape serves `achieved`, `preserved`, `degraded`, `failed` and `transitioned` with no
extra machinery. **There is no separate degrade field in the pack format** — degradation is
`to: "degraded"` on a condition — so one attachment point genuinely covers every objective
transition.

**`fenPredicate` is deliberately not widened.** `$defs/fenPredicate`
(`schemas/drill_pack.schema.json:494`) and its runtime twin `FenPredicate`
(`packages/runtime/src/objective.ts:50-66`) take a FEN by construction — verified:
`matchesFenPredicate(node, predicate)` (`objective.ts:168`) receives only the `Node` and has no
`run`, so it cannot resolve a parent. That is the same evaluator-signature law F2 uses, and it
is why the transition predicate lands one level up (§4.2) instead.

**Ordinal — now settled rather than conditional.** `$defs/successCondition`
has **seven** arms on the current **0.20** tree — `reach_checkpoint`, `outcome`,
`material_balance`, `rules_fact`, `structural_feature`, `timing_window`, and `plan_consequence`
— matched 1:1 by `SuccessCondition` (`packages/schema/src/drill-pack/types.ts`). **Counted
programmatically in cross-review, on the tree as it stands after 0.20 landed:** 0.18 added the
seventh and 0.20 added no arm at all (it widened `$defs/objectiveGrading.assessedBy`), so
**`transition_feature` is the eighth arm, unconditionally.** The earlier hedge ("seventh if 0.18
stalls") is removed.

#### 4.2 The evaluator route, pinned to the call site

A new `ObjectivePredicate` member — **not** a `FenPredicate` member:

```ts
| { readonly type: "transitionFeature"; readonly transition: TransitionExpression }
```

added to the union at `packages/runtime/src/objective.ts:68-98`, and evaluated inside
`evaluateObjectivePredicate(run, predicate)` (`objective.ts:226-311`), which has `run` and
resolves `const node = activeNode(run)` at `:230`:

```ts
case "transitionFeature": {
  if (node.parentId === null || node.moveUci === null) return false;
  const parent = run.nodes.find((candidate) => candidate.id === node.parentId);
  if (parent === undefined) return false;
  return matchesTransitionExpression(parent.fen, node.moveUci, node.fen);
}
```

This is not a new pattern. `deviationPlayed` (`objective.ts:270-274`) already reads
`node.moveUci`, already guards `node.parentId === null`, and already resolves the parent with
`run.nodes.find`. The new case is that shape with a different payload.

**`false` at the root, never an error and never vacuously true.** The condition asserts *there
is a predecessor, there is a move, and the transition satisfies the expression*. At the run
root all three fail and the answer is `false`. This is `predicate-wave-3` §4b's anti-vacuity
rule applied verbatim, and that rule is the strongest lesson of the wave — the ∞ convention
would have made `atLeast n` true across 85 of 440 positions in the wave's own demonstration
packs. An author who wants the negation writes `not(…)`, which is unambiguous.

**No quantifier field, and that is a design decision worth stating.** The condition is
evaluated at the active node only, i.e. against the transition that just happened. "It happened
at some point in this branch" is not a field on the condition — it is what the shipped
objective state machine already does, because a transition to `achieved` latches. A history
quantifier inside the *grammar* would be the F2 refusal; a quantifier that lives in the run,
which is the thing that has a history, is free.

#### 4.3 Exhaustive dispatch — every widened union, every site (D26)

Three unions widen: `SuccessCondition`, `ObjectivePredicate`, and the new `TransitionFeature`
/ `TransitionExpression` pair. The parent's law is inherited: **every dispatch over a widened
union ends in a `never` binding, and a missing case is a compile error followed by a runtime
refusal.**

| Site | Today | Under this RFC |
|---|---|---|
| `successPredicate` (`apps/server/src/pack-orchestrator.ts:210-267`) | `const exhaustive: never = condition` at `:261` → `SUCCESS_CONDITION_KIND_UNRECOGNISED` | compiler forces the `transition_feature` arm; guard retained. Note the function already carries a fourth parameter, `resolvePlanSignature?: PlanSignatureResolver` (`:214`), added by 0.18 — the transition arm needs no such resolver and takes none |
| `conditionEvidenceRefs` (`pack-orchestrator.ts:269-273`) | dispatches per kind, with 0.18's resolver parameter | gains a `transition_feature` arm whose first ref is unconditional (§4.5) |
| `evaluateObjectivePredicate` (`objective.ts:226-311`) | switch over the union with **no explicit `never` binding** — exhaustiveness is enforced only by the `boolean` return type | gains the `transitionFeature` case **and an explicit `never` default**, per the D26 law. Recorded as a small pre-existing gap this RFC closes rather than inherits |
| `matchesTransitionExpression` (new) | — | `never` guard over the five node kinds |
| `matchesTransitionFeature` (new) | — | `never` guard over the six leaf kinds |
| `structuralIssues` leaf walk (`apps/server/src/pack-validation.ts:187-268`) | two `never` bindings at `:231` and `:264` → `STRUCTURAL_KIND_UNRECOGNISED` | a sibling `transitionIssues` walk with its own `never` → `TRANSITION_KIND_UNRECOGNISED`; the `position` node recurses into the shipped `structuralIssues` rather than duplicating it |
| `renderTransitionObservation`, `renderTransitionSpec` (new, `apps/web/src/lib/transition-sentences.ts`) | — | `never` guards, mirroring `structural-sentences.ts:29-30,59-60` |
| `renderPivotalMarker` (`packages/runtime/src/pivotal.ts:98-106`) | **not exhaustive** — `:102` casts `marker.detail as IrreversibilityDetail` and falls through | see §5.3: this is a latent defect that the widening would trip, and it is fixed here |

#### 4.4 Load refusals — seven rows, six new codes and one reused, and the first two are the point of the RFC

**Read §4.4a first.** The first row was rewritten in cross-review: as originally drafted it
refused a class of correct authoring, and the reason is a distinction the repo has already
measured and ledgered.

| Code | Fires when | Severity | Why |
|---|---|---|---|
| **`TRANSITION_EXPRESSION_NEVER_PRESENT`** | The condition's `to` is **`achieved`, `preserved` or `transitioned`** and the expression is `false` at every transition in the pack's **authored transition set** (§4.4a) | **error** | The direct answer to the `timingWindow` precedent, scoped by polarity so it is a coverage claim the author actually made. **Directly modelled on `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` (`pack-validation.ts`, landed with 0.18)**, which reads `!authoredSpineFens(pack).some((fen) => matchesStructuralExpression(fen, signature))`, and on the polarity guard in its sibling **`SHAPE_REFERENCE_NEVER_PRESENT`**, which fires *only* when `reference.relation === "present"` |
| **`TRANSITION_EXPRESSION_NEVER_ABSENT`** | The condition's `to` is **`degraded` or `failed`** and the expression is `true` at every transition in the authored transition set | **error** | The polarity mirror. A failure condition that fires on the model line's every move fails the pack's own demonstration. This is the failure-side analogue of the row above, and it is the reason the row above must not simply be inverted onto failure conditions |
| `TRANSITION_EXPRESSION_ALWAYS_PRESENT` | The expression is `true` at every transition in the authored set **and that set has ≥ 4 transitions**, for a `to` of `achieved`/`preserved`/`transitioned` | warning | The noisy leaves' failure mode is tautology, not vacuity — `structuralDelta` reports something on 93.3% of plies and defences change on 74.9%. A condition true everywhere grades nothing. A warning, not an error, because a short line can be legitimately uniform |
| `TRANSITION_COUNT_OUT_OF_RANGE` | `count > 64` on any counting leaf | error | Outside the bound the leaf is a constant. The bound starts at the board size and criterion 5 requires it tightened to the measured corpus maximum per leaf, the way `PIECE_DISTANCE_OUT_OF_RANGE` is per-role |
| `NEGATIVE_FEATURE_COUNT` | `count < 0` | error | **Reused, not added** (`pack-validation.ts:194,203,260`). A second spelling of a shipped refusal is the same rot as a second spelling of a census |
| `TRANSITION_KIND_UNRECOGNISED` | The `never` fallthrough in the validator's leaf and node walks | error | Mirrors `STRUCTURAL_KIND_UNRECOGNISED` (`:231`, `:264`) |
| `TRANSITION_EXPRESSION_TOO_DEEP` | Nesting exceeds four levels | error | Mirrors `STRUCTURAL_EXPRESSION_TOO_DEEP` (`:235,240,247`) |

**The walk is a three-line sibling of a function that already ships.**
`authoredSpineFens(pack)` (`apps/server/src/pack-validation.ts:170-186`) replays the spine
from `pack.start.fen` with chessops — `Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap()`
at `:171`, recursive `visit` at `:173-184`, skipping illegal moves at `:177` — and returns the
resulting FENs. `authoredTransitions(pack)` is the same walk emitting
`{ before, moveUci, after }` per **edge** instead of `after` per **node**, plus the deviation
edges (§4.4a). At 29.06 µs/ply the whole corpus is ≈18 ms. **The precedent for the walk is not
analogical — it is the same function with one more field.** The precedent for the *refusal* is
weaker than that, and §4.4a says exactly how much weaker.

#### 4.4a What the refusal actually measures — coverage, not satisfiability

**This is the correction cross-review forced, and it is the most important paragraph in §4.**

The repo has already drawn this line and ledgered it. `design/BACKLOG.md`, row *No instrument
answers "where does this expression fire?"*: **"'fires on zero corpus positions' is not the same
defect as 'is unsatisfiable' — the first is a coverage fact, the second is a bug, and only the
second justifies refusal."** The live example is in `planning/content-era/log.md` §*The
knight-vs-bishop fan, and why 0 firings is not the same defect twice*:
`knight-vs-bishop/black-anchor-the-knight` is an 18-arm outpost enumeration that fires on **0 of
the 346 corpus positions containing a black knight** while **36 of 36 constructed anchors fire
true, 36 of 36 pawn-evictable positions fire false, and 36 of 36 undefended-knight positions fire
false**. It discriminates perfectly; the corpus simply contains no instance.

**`TRANSITION_EXPRESSION_NEVER_PRESENT` cannot decide satisfiability and does not try.** It
counts hits on one pack's authored content. As drafted — an unconditional error on "false at
every spine transition" — **it would have refused the transition analogue of that outpost
enumeration**, and it would additionally have refused every correct `to: "failed"` /
`to: "degraded"` condition, because a pack's spine is the *model line* and by construction does
not contain the moves a failure condition names. §4.1 celebrates that one attachment point
serves all five `conditionBase` states; the original rule made two of the five unauthorable.
That is not a hypothetical: `$defs/conditionBase.to` is
`preserved | degraded | failed | achieved | transitioned` (verified on the tree), and
`pack-orchestrator.ts:481,498` route `to: "degraded"` conditions through a distinct rule path.

**Three corrections, and together they keep the anti-`timingWindow` force without the false
refusal:**

1. **Polarity scoping, on a shipped precedent rather than invention.**
   `SHAPE_REFERENCE_NEVER_PRESENT` fires only when `reference.relation === "present"` — the
   validator already refuses absence-on-spine *only where the author asserted presence*. A
   `to: "achieved"` transition condition is that same assertion about the pack's own line; a
   `to: "failed"` one is its negation, and gets `NEVER_ABSENT` instead.
2. **The authored transition set is spine edges ∪ deviation edges.** `pack.deviations[]` carries
   `at` (a `deviationLocation`) and `moveUci` — enough to replay one edge each — and it is where
   the moves a failure condition names actually live. Restricting the walk to `pack.spine` was
   the second half of the drafting error. Deviation edges enter the set for **all** polarities.
3. **The refusal is named as a coverage rule, in its own message.** The issue message reads
   *"never fires on this pack's authored transitions"*, never *"is unsatisfiable"*, and the docs
   entry (criterion 14) states the distinction. An author whose condition is correct but
   uncovered has one legitimate remedy and it is **not** loosening the condition (§4.6): add the
   authored transition that demonstrates it, or move the condition to the pack that has one.

**What survives of the answer to `timingWindow`.** All of it, for the case that mattered.
`timingWindow` earned zero uses because *nothing anywhere* consumed it. This rule guarantees the
weaker but sufficient property: **no `transition_feature` condition can ship without at least one
authored transition in its own pack that exercises it in the direction its author claimed.** That
is a coverage guarantee, it is worth having, and calling it a satisfiability check — as this draft
originally did, including in its own header line "the satisfiability check" — overclaimed it.

**One residual, and it is owner-facing rather than fixable here.** A `to: "achieved"` condition
that is correct but deliberately uncovered by its own pack — the exact outpost-enumeration shape,
one wave later — is still refused. Two remedies exist and this RFC picks neither by itself: a
`witness: { before, moveUci }` field on the condition (a schema addition inside this RFC's 0.22
lane, but a new authoring surface), or downgrading the error to a warning (which weakens the
answer to `timingWindow` to nothing). **Filed as open question 8.**

#### 4.5 Evidence refs and sentences

Six facts join the frozen `RULES_EVIDENCE_FACTS` list (`packages/runtime/src/evidence-ref.ts:1-30`),
one per leaf: `transition-attacked-squares-changed`, `transition-defended-squares-changed`,
`transition-slider-lines-changed`, `transition-escape-squares-changed`,
`transition-defended-duties-changed`, `transition-move-irreversibility`. A satisfied `position`
node contributes the `rules:structure-*` refs it always did and adds nothing.

These are **durable rule names, not parameterised instances**, exactly as the parent ruled
(`docs/structural-reading.md`): the evidence renderer has no FEN argument, so a ref must
never encode a square or a count.

**Migration-free is not work-free, and this is the `"draw"` correction applied in advance.**
`rfc/archive/authoring-frictions.md` added the `draw` rules fact at 0.16 and originally missed
that the frozen constant itself had to be widened; the omission had to be corrected in flight.
Widening `RULES_EVIDENCE_FACTS` by six touches **four files in lockstep**, all verified on the
tree this cross-review, and the draft named only the second:

1. `packages/runtime/src/evidence-ref.ts` — the six entries, appended in §2.3's leaf order.
2. `apps/web/src/lib/evidence-sentences.ts` — `RULES_SENTENCES` is
   `Readonly<Record<RulesEvidenceFact, string>>`, so six sentences are **compile-mandatory**, in
   the shipped voice (*"Tabiya's … condition holds at this transition."*).
3. `packages/runtime/src/evidence-ref.test.ts` — asserts
   `RULES_EVIDENCE_FACTS.map(rulesEvidenceRef)` against a **hard-coded 28-element literal**. Six
   new facts fail this test until the literal is extended. This is the file the `"draw"` wave
   missed.
4. `apps/web/src/lib/evidence-sentences.test.ts` — builds its expectation from
   `RULES_EVIDENCE_FACTS`, so it follows automatically, but is listed because it is the fourth
   site a grep for the constant returns and an implementer should not have to rediscover which
   of the four is derived.

**And one invariant to mirror rather than break.** `packages/runtime/src/structure.test.ts:70`
asserts that the `structure-`-prefixed facts map 1:1 and **in order** onto
`STRUCTURAL_FEATURE_KINDS`. The six new facts are `transition-`-prefixed, so that assertion is
untouched — verified. This RFC ships its sibling: a test asserting the `transition-`-prefixed
facts map 1:1 and in order onto the six `TransitionFeature` kinds, so the two lists cannot drift.

**No migration**, for a mechanism rather than an analogy: evidence refs are persisted as bare
strings, no JSON schema enumerates them, so no historical row can contain a string that did not
exist and nothing narrows. `predicate-wave-2` widened this same frozen list with three
`structure-*` facts at pack 0.13 and `predicate-wave-3` with three more at 0.18
(`evidence-ref.ts:27-29`), both with none.

**Who walks the expression for refs, pinned rather than implied.** `conditionEvidenceRefs`
cannot reuse `structuralFeatureKinds` directly, because its argument is a
`TransitionExpression`. This RFC adds `transitionFeatureKinds(expression)` next to the shipped
`structuralFeatureKinds` (exported from `structure.ts`), walking the five node kinds and
**delegating to the shipped `structuralFeatureKinds` at every `position` node** so a satisfied
`position` node contributes its `rules:structure-*` refs and nothing is minted twice.

#### 4.6 Authored content, in this RFC's commits

The owner's Q1 reframing applies here too: *"we are the authors."* A grammar with zero
authored uses is the precedent this RFC exists to answer, so authored content is not a
follow-on — criteria 9–11 make it a landing condition. Three packs, chosen because the
transition claim is the honest one:

1. **`carlsbad-minority-attack`** — the minority attack's structural concession is currently
   graded as a *position* (backward Black c-pawn on a White half-open c-file). The transition
   condition names the moment it *appeared*: `slider_lines_changed(white, opened, atLeast, 1)`
   with a `position(after, half_open_file(white, c))` conjunct, so the objective transitions
   on the move that produced the concession rather than at any later position that happens to
   have it. This is `05` §5c's *grade a plan by its consequence*, tightened from "the shape is
   here" to "your move made it".
2. **A pawn-break pack** — `move_irreversibility(pawn_break)` where the pack's whole subject is
   a break. The arithmetic already fires on the spine (it is `pivotal.ts:49-54`); today
   nothing can *grade* it.
3. **A mating pack** — `escape_squares_changed(black, lost, atLeast, 2)` on the confining move.
   Note the sentence the pack may write and the one it may not: *"Black's king lost two of its
   flight squares"* is the census; *"the king is trapped"* is the verdict, and §9 forbids it.

If a candidate pack cannot be made to fire, the pack is wrong for the demonstration and a
different one is chosen — the condition is **not** loosened until it fires, which is how a
census becomes a tautology.

### 5. Consumer 2 — Just Play

#### 5.1 Why this is where the category earns its keep

Just Play is the `"position"` session kind (`packages/runtime/src/types.ts:36`;
`apps/web/src/lib/JustPlayStarter.svelte`; `session-controller.ts:263` `startPosition`;
`App.svelte:547-556`). It has no author, so `05` §5a's rule applies: the moments must be
detected, and the honest detectors *describe a fact rather than assert importance*.

`design/BACKLOG.md` (*Question shapes*) states the case in the owner's terms: a differential
census over a move is *"not a judgment at all, just an attack-set diff across a transition"*
and *"the safest possible hint content: a true statement with no verdict in it, which is
precisely what the anti-dashboard law leaves room for."*

The line, in `05` §3b's format:

| Permitted — a fact about the board | Forbidden — a verdict about the move |
|---|---|
| "Your last move left c1 attacked by no White piece." | "You shouldn't have moved that rook." |
| "Black's knight on f6 lost two of its three destination squares that White does not attack." | "The knight is trapped." |
| "The bishop on c1 now defends two attacked White pieces." | "The bishop is overloaded." |
| "The h1–a8 diagonal gained one square for White's bishop." | "Opening that diagonal was the point." |
| "Black castled." *(shipped today, `pivotal.ts:103`)* | "Black castled into the attack." |

**And there is a structural safeguard the other rungs do not have: a transition does not exist
until a move is committed.** The API takes a *played* move. There is no call that takes a
candidate move, and §5.5 makes that a hard boundary rather than a convention.

#### 5.2 On request — the reading projection

A new bounded, canonical projection, the transition sibling of `structuralReading`
(`structure.ts:449-495`):

```ts
export function transitionReading(before: string, moveUci: string, after: string): TransitionReading | null;
```

`null` when the UCI is not a legal move in `before`. Otherwise a frozen, canonically ordered
observation list: per colour and direction, the attacked and defended squares gained and lost;
the rays opened and closed with their endpoints; the pieces whose safe-destination set changed,
with the squares; the pieces that acquired or released a second defensive duty; and the
irreversibility classification. **It carries no score, rank, severity, advantage or
significance** — the same law as `structuralReading`
(`docs/structural-reading.md:44-45`), and criterion 8 asserts it.

**Surface:** a sibling `<section class="transition-reading">` beside the shipped structural one
at `apps/web/src/lib/DrillScreen.svelte:729-737` — a closed-by-default disclosure keyed to the
displayed node, with the same button/`aria-expanded` shape and the same honest empty state
("No rung-0 transition observations at this move."). At the root it says so and renders
nothing.

**Every primitive is available on request**, including the noisy ones, and this tier does not
depend on R3. A true answer to a question the learner asked is not noise; the learner chose the
cost. What must be earned is the *unasked* case, and that is §5.3.

**No `AssistanceConfig` change.** The shipped structural-reading disclosure is not a config
key — it is `structuralOpen`, local state, closed by default, ungated
(`DrillScreen.svelte:730-731`). Its transition sibling is the same. `AssistanceConfig` stays
v4, `assistance-preference.ts` gains no migration branch, and this RFC claims no client
preference version. That is the whole integration.

#### 5.3 Live — superseded by R3; no marker ships

**This subsection is retained as rejected design history.** The measured R3 header and owner
handoff supersede its normative language: `PivotalKind` and `PivotalMarker.detail` do not widen,
`renderPivotalMarker` remains owned by `live-marker-quality`, and transition facts are available
only through §5.2's learner-opened reading.

`PivotalKind` (`packages/runtime/src/pivotal.ts:10`) widens by one:

```ts
export type PivotalKind =
  "irreversibility" | "phase_change" | "human_divergence" | "option_collapse" | "defended_duty_acquired";

export interface DutyDetail { readonly color: Color; readonly square: SquareName; readonly duties: number; }
```

**and `PivotalMarker.detail`'s union widens with it** — verified on the tree, it is today
`IrreversibilityDetail | PhaseChangeDetail | DivergenceDetail | CollapseDetail` and `DutyDetail`
is a fifth member. The original draft declared the interface and omitted this; without it the
new marker does not type-check at construction.

Computed inside `pivotalMarkers`, which **already** holds the parent/child pair it needs — the
same place `irreversibility(parent, node)` is called. Delivery is the shipped passive-marker path
with nothing added: gated by `assistance.markers === "live"` (`DrillScreen.svelte:277`), rendered
as a Timeline dot (`Timeline.svelte:75`), opened into the modal (`DrillScreen.svelte:925-941`)
with the sentence produced by `renderPivotalMarker` (`:929`). **No new component, no new gate,
no new permission, no new config key.**

**One correction to that path, found in cross-review, and it raises the stakes on the fix
below.** This draft said the marker is *"labelled at `:278` (`kind.replaceAll("_", " ")` →
'defended duty acquired')"*, implying the learner reads that label. **They do not.**
`DrillScreen.svelte:278` builds `{ nodeId, label }` rows, but `Timeline.svelte:75` renders only a
dot and an `aria-label` of the form *"Open pivotal marker at ply N"* — the `label` field is passed
and discarded (contrast `:74`, where shape markers do render theirs). **`renderPivotalMarker` is
therefore the marker's only text surface**, so a wrong sentence there is not one of several
signals a learner could cross-check; it is the entire content of the disclosure.

**A latent defect this widening would trip, and this RFC fixes it.**
`renderPivotalMarker` (`pivotal.ts:98-106`) is **not** exhaustive: it tests three kinds and
then falls through at `:102` with `marker.detail as IrreversibilityDetail`. Verified precisely:
a `defended_duty_acquired` marker carrying a `DutyDetail` has no `subkind`, so both `subkind`
tests fail and the function returns the final template — the learner is told
*"white created or resolved pawn contact."* about a move that did no such thing. Silently, with
no compile error, because the cast defeats the check. **This is a shipped defect, the RFC fixes
it rather than noting it, and criterion 7 is the gate.**

The fix is a `switch` over `marker.kind` ending in a `never` binding, per the D26 law. **Two
precisions the original draft got wrong:**

- **It is six outputs across four kinds, not "four sentences."** `phase_change`,
  `human_divergence` and `option_collapse` produce one template each (`option_collapse` branches
  on `count === 1`, so two strings), and the irreversibility fallthrough produces three
  (`castled`, `last_of_role`, pawn contact). Criterion 7 pins **every** one of them.
- **The `never` binding fixes the defect; it does not remove the casts.** `PivotalMarker` is a
  flat interface, not a discriminated union — `kind` and `detail` are independent fields — so
  `switch (marker.kind)` narrows `kind` and leaves `detail` at the full union, and each arm still
  casts. That is sufficient for the defect (a sixth kind added without an arm is a compile error,
  so no wrong sentence can be emitted), and it is *not* sufficient to make the casts sound. The
  sound form is to make `PivotalMarker` a discriminated union of five `{ kind, detail }` pairs.
  **This RFC requires the `never` binding and does not require the union split** — the split
  touches every construction site in `pivotalMarkers` and every consumer of `marker.detail`,
  which is a refactor with its own risk, and the `never` binding closes the learner-facing hole
  on its own. Recorded as open question 9 so a later wave does not read the residual cast as
  intentional.

#### 5.4 Which primitive may speak unasked — the selectivity rule

`design/05-in-run-experience.md` §3a is the governing ruling: *rung 0 being safe is not an
argument for it being on*, and §3b's real risk is that *tips that never stop remove the need to
look*. Firing rate is the mechanism that turns that into a rule.

| Tier | Set | Why |
|---|---|---|
| **Live** (may appear unasked, when `markers: "live"`) | `defended_duties_changed(acquired)` only | 6.7% — the most selective primitive measured, and the one the owner named |
| **On request** (the §5.2 disclosure) | all six | The learner asked |
| **Never, at any tier** | hypothetical transitions; anything naming a verdict | §5.5, §9 |

The partition is drawn at the measured gap: the selectivity ordering is
**6.7 < 7.1 < 13.2 ≪ 50.6 < 52.6 < 61.2 < 74.9**, and there is a **37-point empty band**
between irreversibility and attacks. Any threshold in (13.2, 50.6) picks the same set, so on
these numbers the partition is robust to the threshold — which matters, because a threshold is
otherwise exactly the "free parameter that encodes taste" rule 2 forbids.

**The grounding is contingent, not established, and cross-review corrected this from a settled
claim to a dependency.** §2.4 proves that two of the four numbers bounding the band are **strict
upper bounds**: target-keying and the both-occupied conjunct are coarsenings, so
`attacked_squares_changed` is **≤ 50.6%** and `defended_squares_changed` is **≤ 74.9%**. The
band's *lower* edge (irreversibility 13.2%, duties 6.7%) is measured under definitions the
implementation keeps, so it does not move. **The band can therefore only shrink, never widen**,
and it can shrink to nothing: if corrected `attacked_squares_changed` lands anywhere near 13–15%,
there is no empty band, no robust threshold, and §5.4's partition is a taste judgement wearing a
measurement's clothes — which rule 2 forbids and which this RFC must not ship.

- **This is not resolvable in this document.** The corrected rates are unmeasured; criterion 2
  requires the implementer to produce them and open question 2 already records the disposition
  as an owner call. **The dependency is now stated where the threshold is used, not only where
  the correction is described**, because a reader arriving at §5.4 was previously told the
  partition was robust full stop.
- **The live tier does not land before the number exists.** If the corrected band is narrower
  than ~10 points, the live/on-request split is re-derived or the live tier is withheld and
  `defended_duty_acquired` waits — the same one-enum-member fallback as the R3 dependency below,
  triggered by a different measurement.
- **The two dependencies are distinct and must not be collapsed.** The corrected firing rates
  decide whether the *partition* has a grounded threshold; R3 decides whether the primitive on
  the live side of it is *worth reading*. Passing one does not discharge the other.

**Irreversibility is live and already is** — it is the shipped `irreversibility` marker
(`pivotal.ts:83`). This RFC does **not** add a second one. The live tier gains exactly one
member, and that is the honest size of the change.

**The R3 dependency, stated rather than assumed.** `planning/campaign-research-queue.md:29`
asks *"what is the false-positive rate of a hint built only from transition census?"* — whether
a census-only hint is *worth reading*. It is **not answered**, and
`design/research/move-primitive-computability.md` §6 says so in its own words: *"a 6.7% firing
rate makes overload a candidate, not a good hint."*

- The **on-request** tier does not depend on R3 and ships unconditionally.
- The **live** tier does. It is `markers: "live"`, which is **off** in `SILENT_ASSISTANCE`
  (`packages/runtime/src/assistance.ts:17`), so no learner meets it without opting in — but
  opting in should not buy noise.
- **What R3 must show for the live tier to stay:** over the corpus's live firings, that a
  reader judges a clear majority *informative* — i.e. that the marker names something the
  reader had not already seen, at a rate materially better than a random quiet move. The
  instrument is the R3 harness, not this RFC.
- **The fallback, and it is cheap by construction:** if R3 says no, `"defended_duty_acquired"`
  is removed from `PivotalKind` and the primitive stays in the on-request reading. **One enum
  member, no grammar change, no pack change, no content rewrite.** That is why the live tier is
  an enum value and not a surface: the dependency on unlanded research is removable.

#### 5.5 The hard boundary — committed transitions only

`transitionReading` and `matchesTransitionExpression` take a **played** move. There is no
overload, endpoint, or client call that takes a candidate move, a legal-move list, or a
proposed continuation.

**Corrected in cross-review, because the original claim was stronger than the code can support.**
This draft said *"this is not a policy, it is the shape of the API."* **It is not.** The signature
is `(before: string, moveUci: string, after: string)` — three strings — and any caller can
synthesise `after` by playing a candidate move into a cloned position and calling it. The type
does not distinguish a committed transition from a hypothetical one, and it cannot: the validator
replays authored spines and has FENs rather than a run, so a run-and-node-keyed signature
(`transitionReadingAt(run, nodeId)`) is not available as the only form. **The firewall is real but
it is enforced, not typed**, and stating otherwise is exactly the kind of structural claim §7 R1
insists on distinguishing from a promise. What actually holds it:

1. **No exported surface produces a candidate `after`.** Nothing in `packages/runtime`,
   `apps/server` or `apps/web` enumerates legal moves and projects resulting FENs for transition
   analysis, and criterion 12 asserts that by inventory.
2. **Both §5 surfaces are keyed to a node that exists.** The §5.2 disclosure reads the *displayed*
   node, and the §5.3 marker is computed inside `pivotalMarkers` over a committed branch path.
   Neither has a candidate to hand.
3. **Criterion 12 is widened accordingly** to forbid not only a parameter that accepts a candidate
   move, but any call site under `apps/` that constructs the `after` argument from a move the run
   has not committed.

That is the firewall for this consumer, and its honest name is a tested boundary.
"What would Nf3 do to my attack map" is a move-evaluation surface: it answers the question the
learner is supposed to be answering, it is the shortest path from a census to *"that knight is
trapped, win it with a4"* (`05` §3b's own forbidden example), and it converts a rung-0 fact into
pre-commit assistance about the live decision. Refused here, with no name reserved. Criterion
12 asserts it by signature.

The consequence is the property the disclosure model wants: a transition statement **cannot**
contaminate the decision it describes, because it does not exist until the decision is
committed. Nothing in `feedbackDisclosed`/`feedbackDeliveryOpen`
(`packages/runtime/src/feedback.ts:3,22`) needs to change, and this RFC changes neither.

### 6. Rung, form, and disclosure — placed on the shipped ladder

**Rung 0.** Every admitted leaf is arithmetic over two positions: no engine, no tablebase, no
corpus, no model, no network, no legality search deeper than the one ply chessops already does
to validate the move. It sits with *"rules-derived sight — legality, attack and defence maps,
discovered consequence, structure descriptions"* (`05` §3, rung 0).

**And it keeps rung 0's property only if its statements carry their scope** — the 2026-08-14
correction, which is the reason rung 0 is trustworthy at all. Each leaf's mandatory scope
clause:

| Leaf | Scope the sentence must carry |
|---|---|
| `attacked_squares_changed`, `defended_squares_changed` | *counts attacking relations, not pins, legal recaptures or their value* — the correction that says attacker/defender counts are exact but "pressure balance" is not |
| `slider_lines_changed` | *counts blockers on the ray as the board stands; it says nothing about whether the line is useful* |
| `escape_squares_changed` | *board geometry, ignoring check and pins; not legal mobility* — the same scope `piece_reach_count` already carries (`docs/structural-reading.md:31-32`) |
| `defended_duties_changed` | *a count of attacked friendly pieces defended; it does not say the defender is overloaded* |
| `move_irreversibility` | *Tabiya's pivotal-marker convention* — the provenance string already shipped at `pivotal.ts:20` |

**Form.** `05` §3-forms: *honesty attaches to the source, timing to disclosure, form to
neither.* This RFC ships one form — **sentences** — in both the reading disclosure and the
marker modal, because that is the shipped default for every rung and because the acceptance
test for any future form is "render the same content as a sentence; if the sentence would be
refused, so is the overlay." Board overlays and arrows for transition facts are a form
question, not a source question, and belong with the lighting ladder row. Not claimed here.

**Disclosure.** Unchanged, and §5.5 explains why nothing needs to change.

### 7. Refusals, each with its rule

**R1 — routing as a detector. Refused, and the refusal is structural rather than promised.**
`design/research/move-primitive-computability.md` §4 measured claude's own hypothesis and
refuted it: exact arithmetic, perfect recall against author-declared arrivals (**9 of 9**, all
of them the same 2→1 event), and a **98.7% false-positive rate** with no authored target —
firing on 38.4% of all transitions and 49.6% of quiet piece moves, at **0.0% precision** across
48 firings under the sharpest filter, dominated by endgame king walks. Even with the target
supplied, **52.8%** of the piece's own legal alternatives satisfy the delta. And routing
explains only **9 of 17** author-labelled repositions. **The target square set is the
judgment**, and it is the part that is not computable.

The static half survives and is not this RFC's: `predicate-wave-3` §4b admits it as
`piece_distance`.

**The mechanism, not the promise.** Every admitted leaf's quantity is a set difference over
relations that **already exist on the two boards**. No leaf takes a target square set, and no
leaf's evaluation requires the evaluator to *choose* one. A routing leaf necessarily does —
that is what R2 measured as uncomputable — so it cannot be composed out of this grammar, and
adding one would be a visibly new shape rather than a quiet widening. That structural fact,
not a naming convention, is what keeps it out.

**What is permitted, and what would open it.** F4's amended row (`:1333`) allows the delta as a
*renderer of an author-declared destination* — "this move brings the knight one move closer to
the d3 the pack named" — never as the thing that discovers the destination. That requires a
pack field naming a destination square set. **No pack has one, and this RFC does not add one
and reserves no name for it.** The trigger that opens it is an authoring wave filing the
destination field as a format gap — the same bar F4 set for this whole category, and the bar
the owner's ruling met for the census half.

**R2 — a `check` leaf. Refused, and the reason is a category boundary.** "The move gives
check" is cheap (0.14 µs/ply) and discriminating (7.1%), and it is **not a transition
property**: it is a fact about the `after` position and the side to move there. Admitting it
here would put a position census in the transition union and breach rule 5 on the wave's own
first page. There is no static `in_check` leaf today; if one is attested, it belongs in a
static wave, and this grammar reaches it for free through the `position` node the day it
exists.

**R3 — history, structure memory, and multi-move claims. Refused, rule 1, inherited from F2.**
"The knight went d2–f1–g3–f5", "the fianchetto structure persisted after the trade", "traded
versus merely moved": each is a fact about a *path*, not a transition. The evaluator takes
exactly one `(before, uci, after)` triple by construction, and widening it to a path would
force the same fabrication F2 refuses. Piece-route reconstruction already ships
(`compare-strips.ts:40-46`) and stays where it is. **A transition expression is likewise
refused inside a shape entry's `plans[].success.signature`**, which is a
`structuralExpression` evaluated against one position — which is why this RFC makes no
shape-entry schema claim.

**R4 — prophylaxis. Refused, not absorbed.** F9's ruling is unchanged and a *transition* census
does not rescue it: "this move prevents their plan" is definable only relative to whose plan and
which opponent would have played it, and the missing term is an opponent model.
`rfc/archive/resistance-spectrum.md` is where an opponent model becomes a measured quantity.
No second notion is defined here and no name is reserved. The one prophylactic thing that is
rung 0 already ships — denial as a square census, `pawn_safe_square`
(`structure.ts:140-167`) — scoped as *current*, never permanent.

**R5 — tempo accounting.** `rfc/archive/tempo-vocabulary.md` owns it and has landed at pack
0.17. Nothing here reads or writes `timingWindow`, and `move_irreversibility` is a per-move
census, not a tempo ledger.

**R6 — "does the move force a reply". Refused, not mechanical.** Measured and reported as a
category error in the owner's own taxonomy
(`design/research/move-primitive-computability.md` §3c): "forcing" means the opponent has no
*good* alternative, which needs a search or an opponent model. The two proxies — gives check
(R2) and opponent reply count — are not the thing, and shipping either under the name "tempo"
would be exactly the manufactured verdict ADR-0005 forbids. Routed with R4.

**R7 — a static `defended_duties` position leaf. Refused *for this wave*, and the refusal is a
schedule.** `defended_duties_changed` computes a per-position duty census internally and no
static leaf exposes it. That is a real gap and a plausible wave-4 candidate — a count of
attacked friendly pieces a piece defends is exact arithmetic — but it has zero authoring
attestations, and this wave's admission bar is gaps real content has hit. The transition
crossing is what the owner named and what the measurement singled out; the static count is not.

**R8 — a `mover` node and `mirrored`/`quantified` transition nodes. Refused, rule 3.** Zero
attestations each, and all three remain reachable inside a `position` node. The grammar widens
when a plan names one.

### 8. `structuralDelta` — excluded, and made unnecessary

The task set for this RFC by the measurement is explicit: do not wire it up as it stands; fix
it or exclude it, and say which. **Excluded**, on four grounds, and the exclusion is enforced.

**1. It fails rule 5 by definition.** `structuralDelta(parentFen, fen)` (`structure.ts:498-508`)
is literally `structuralReading(after).features` minus `structuralReading(before).features` —
its first line, `:499`, is `const before = structuralReading(parentFen).features, after =
structuralReading(fen).features;`. That is the difference of two position censuses, which §2.2
refuses because two `position` nodes express it exactly. It is the rule's paradigm case, not an
exception to it.

**2. It is noise as a trigger.** It reports a gained or lost observation on **93.3%** of the 593
corpus transitions — the highest firing rate measured, higher than defences at 74.9%. Under
§5.4's rule it could not reach the live tier, and in the on-request reading it would drown the
five leaves that discriminate.

**3. Its cost is a defect, and inheriting it would ship the defect.** **1721.48 µs/ply** — 326×
the most expensive primitive in the census and 59× all of them combined, still **651.88 µs** on
≤8-piece endgames where the whole census costs 7.47. Roughly 43% of it is the `evictionChanges`
loop, now at `structure.ts:501-506`, which runs `for (const color of COLORS) for (let square =
0; square < 64; square++)` and calls `pawnSafety(parentFen, …)` and `pawnSafety(fen, …)` inside
it — **256 calls per transition, each re-parsing the FEN** (`structure.ts:503`; `pawnSafety` is
`structure.ts:182` and takes a `fen: string`; one call is 3.11 µs, and 256 × 3.11 ≈ 796 µs).
Ledgered as its own defect row (`design/BACKLOG.md`, *`structuralDelta`'s cost is a defect
distinct from its deadness*), and that row exists precisely so this function is not "fixed" by
being wired up.

**4. Fixing it is not this RFC's work, and pretending otherwise would be scope laundering.**
The rewrite is real and cheap — parse each FEN once and the function lands near
`structuralReading`'s own cost — but it is a defect fix on a dead function that this RFC does
not consume, and making this RFC's acceptance depend on a performance measurement for something
with no consumer is the timingWindow shape in a different costume. The defect row stays open
and is not closed by this RFC.

**Enforced, not stated.** The tempting implementation of "lines opened" or "attacks created"
*is* `structuralDelta`, and the penalty for taking it is 59×. So:

> **Criterion 6 (normative), restated in cross-review so that it is satisfiable and
> mechanically checkable.** The original wording — *"no call path, direct or transitive, to
> `structuralReading`, `structuralDelta` or `pawnSafety`, asserted by a module-graph test"* —
> **could not pass, for two independent reasons.** (a) At *module* granularity the test fails on
> the first line of `transition.ts`, because the `position` node must import
> `matchesStructuralExpression` from `structure.ts`, and `structure.ts` is where all three
> forbidden symbols live. (b) At *symbol* granularity the transitive closure through the single
> permitted edge genuinely reaches `pawnSafety`: `matchesStructuralExpression` →
> `matchesStructuralFeature` → `pawnSafety`, for the `pawn_safe_square` and `outpost` leaves.
> The parenthetical already conceded (b) while the normative sentence forbade it. The two forms
> that *are* checkable, and both are required:
>
> **6a — import surface (a module-level test, and this is the one that carries the weight).**
> `packages/runtime/src/transition.ts` imports from `./structure.js` exactly one value binding,
> `matchesStructuralExpression`, plus type-only imports. It imports `structuralReading`,
> `structuralDelta` and `pawnSafety` from nowhere, under any alias, and re-exports none of them.
> Asserted by parsing the module's import declarations, not by review.
>
> **6b — symbol reachability, excluding the permitted edge.** In the call graph rooted at
> `matchesTransitionExpression`, `matchesTransitionFeature` and `transitionReading`, with the
> single edge `→ matchesStructuralExpression` cut, no path reaches `structuralReading`,
> `structuralDelta` or `pawnSafety`.
>
> The permitted edge is verified targeted on the tree: `matchesStructuralExpression`
> (`structure.ts`) dispatches to `matchesStructuralFeature`, handles `pieceOnSquare` inline, and
> recurses through `mirrored`/`quantified` — it **never** builds a reading and never touches
> `structuralDelta`. `matchesStructuralFeature`'s own reach into `pawnSafety` is the shipped
> leaf's own cost, paid only when an author writes `pawn_safe_square` or `outpost` inside a
> `position` node, and is out of scope for 6b by construction.

**And the `position` node makes it unnecessary rather than merely unused.** "Feature X was
absent before and present after" — the entire reason `structuralDelta` was written — is
`all[ not(position(before, X)), position(after, X) ]`: two targeted predicate evaluations
instead of two full readings. `structuralDelta` computes every observation in order to diff
them, when an author only ever asks about one. That is the honest form of the same claim, it is
in this grammar, and it costs microseconds.

`vacationReading` (`structure.ts:510-520`, also dead) is likewise **not** consumed here. It is
the discovered-threat primitive, it is a *one-position* function, and it belongs to the
discovered-threat surface that F4 names as its own promotion trigger. Left dead, deliberately,
and the ledger row stays open.

### 9. Law 8 and ADR-0005 — the central risk

This RFC's whole purpose is telling learners things about their moves. That is the risk
surface, and it is stated plainly rather than assumed away.

**The line.** A primitive may report a *difference between two boards*. It may not report why
the difference matters, whether the move was good, or what to do about it. `05` §5 is the
governing formulation: **the facts are rung 0 and the judgement is rungs 2–5**; a surface that
renders the facts and attributes the judgement is honest at any level, one that blurs them is
the dashboard `AGENTS.md` names as the anti-pattern. "Stockfish: +0.54 / Maia: 31% / LLM: 'Ne5
centralizes the knight'" is exactly what a transition census must not become — and the third
term is the dangerous one, because it is the one a census can imitate.

**Four mechanisms, in the order they bite:**

1. **Rule 4 at the name.** Every leaf ends `_changed` or names a classification convention.
   The refused names are listed in §2.5 with the rule.
2. **Closed deterministic sentence templates.** `apps/web/src/lib/transition-sentences.ts`
   ships one template per observation kind, each carrying its §6 scope clause, each with a
   `never` guard. This is what ships today for structural facts
   (`docs/explanation-grounds.md`); no LLM latitude beyond `05` §3b-i's packet contract, under
   which the model may choose wording, order, brevity and tone and may not introduce a chess
   noun, square, move or judgement that is not in the packet.
3. **A judgement-vocabulary assertion.** The validator already ships one for authored prose —
   `KEY_POINT_PHRASE_IS_JUDGEMENT` over the 18-word `KEY_POINT_JUDGEMENTS` set
   (`apps/server/src/pack-validation.ts:148`, applied at `:577`). This RFC does not duplicate it
   for authored text; it asserts the same list against its **own** template strings and leaf
   names as a unit test, so a future template cannot smuggle "weak", "blunder", "should" or
   "best" into a rung-0 sentence.
4. **§5.5's signature.** No hypothetical transitions, so no census can be turned into a move
   recommendation by asking it about candidates.

**What the product may never say, even though the arithmetic supports it:** that a move was a
mistake; that a piece is trapped, hanging, overloaded or badly placed; that a change was worth
it; that the learner should have played something else; or that any counted difference is large,
small, good or bad. The counts are rendered; the adjectives are not available.

**The one thing that is honestly attributable:** the *shape* of the position, from an authored
shape entry, is rung 5 and carries its provenance — `05` §3b's permitted column. Nothing in
this RFC changes that boundary or feeds it.

### 10. Boundary conditions, enumerated

| Condition | Behaviour |
|---|---|
| Run root — `node.parentId === null` | `transitionFeature` is **`false`**. Never an error, never vacuously true (§4.2). The reading disclosure says so and renders nothing |
| `node.moveUci === null` | `false`, same rule |
| Parent node not found in `run.nodes` | `false`. Matches `deviationPlayed`'s shipped defensiveness (`objective.ts:270-274`) |
| UCI not legal in `before` | `transitionReading` returns `null`; `matchesTransitionExpression` returns `false`. A run's nodes are legal by construction; a validator replaying a spine already skips illegal moves (`pack-validation.ts:177`) |
| Castling, encoded either as king-two-squares or king-takes-rook | Handled by the shipped `parseUci` path already used by `irreversibility` (`pivotal.ts:44-46`); no new convention |
| En passant | Handled by `capturedRole`'s shipped clause (`pivotal.ts:37`) |
| Promotion | The promoted piece is a different role on the same square, so it is **not** "the same piece in both positions"; `escape_squares_changed` and `defended_duties_changed` skip it, and `attacked_squares_changed` sees the new attack relations. Stated because it is the one place the same-square identity rule is surprising |
| A capture on the target square | The both-occupied conjunct (§2.4) excludes it from the attack and defence leaves. Deliberate: the disappearance of a piece is not a fact about what the mover stopped defending |
| `to`/`from` omitted on the condition | Inherits `$defs/conditionBase`'s shipped defaults exactly as the other arms do; nothing new |
| A pack with no spine **and** no deviations | The authored transition set (§4.4a) is empty, so the coverage checks cannot run and are **skipped**, not failed. A pack with no authored transitions has no content to be inert against |
| A pack with no spine but with deviations, or vice versa | The set is whichever edges exist; the checks run against them. Only the empty set is skipped |

### 11. Schema changes

`schemas/drill_pack.schema.json` `$id` → `urn:chess-tabiya:schema:drill-pack:0.22`;
`DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`) → `"0.22"`. Both move together,
from the tree's current **0.20**, behind `deviation-classes`' claimed 0.21 (header note).

Additive only:

- New `$defs/transitionFeature` — the six-arm closed leaf union, `additionalProperties: false`
  on every arm, `comparison` reusing the shipped `["atLeast","atMost","equal"]` enum and `role`
  `$ref`-ing the shipped `#/$defs/role` (`:427-430`).
- New `$defs/transitionExpression` — the five-arm closed node union; the `position` arm
  `$ref`s the **existing** `#/$defs/structuralExpression` (`:483`) rather than duplicating it.
- `$defs/successCondition` (`:303-387`) gains an eighth arm: `{ kind: "transition_feature",
  transition: $ref transitionExpression }` plus the `conditionBase` `to`/`from` refs every arm
  carries.

**Nothing is removed, nothing narrows, no committed content digest moves** — pack digests are
content digests and are unaffected by the `$id`
(`packages/schema/src/drill-pack/digest.ts:58-66`, `digestCanonicalJson`). All committed packs
validate unchanged against 0.22.

**Not touched:** `schemas/shape_entry.schema.json` and its duplicated `$defs` (both copies),
`SHAPE_ENTRY_SCHEMA_VERSION` (`"0.3"`), the run schema (`"0.14"`), `STORAGE_VERSION` (19),
`$defs/fenPredicate`, `$defs/structuralFeature`, `$defs/distanceTarget`, `$defs/timingWindow`,
and `AssistanceConfig`.

### 12. Relationship to `rfc/archive/predicate-wave-3.md`, which landed and was archived mid-draft

**It landed AND was archived while this draft was being written**, and the draft was re-verified
against the new tree rather than left describing the old one. `plan_consequence` is the seventh
`successCondition` arm, and `piece_count` / `king_zone` / `piece_distance` ship. **Corrected in
cross-review:** an earlier revision of this section asserted the file was "still in `rfc/` rather
than `rfc/archive/`". It is not — it is `rfc/archive/predicate-wave-3.md`, every citation in this
file was repointed, and the owner ruling this RFC's exploration gate rests on is at `:146-147`
of the archived file, not `:148-151` of the pre-archive one. **Its section numbers survive
archiving; its line numbers did not, and the implementer re-locates by section and symbol.**

**And the tree moved again after that.** Pack schema is **0.20**, not 0.18 —
`opening-evidence-path` landed the `assessedBy` `kind: "engine"` arm. That move did *not* add a
`successCondition` arm, so §4.1's eighth-arm claim survives; it did invalidate this draft's
original 0.19 claim, corrected in the header. Shape-entry stays **0.3**, run schema **0.14**,
`STORAGE_VERSION` **19**.

**Three consequences, all of which make this RFC smaller:**

1. **The ordinal is settled**, not conditional (§4.1). `transition_feature` is the eighth arm.
2. **The `NEVER_PRESENT` refusal has a shipped sibling to copy** rather than an analogy to
   argue: `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` and `authoredSpineFens`
   (`apps/server/src/pack-validation.ts:170-186` and the `checkPlanConsequences` walk) are
   exactly the shape §4.4 needs, one field wider — verified line by line this cross-review.
   **But copying it wholesale was the drafting error §4.4a corrects.** The *walk* transfers;
   the *refusal* transfers only under the polarity guard its other sibling
   `SHAPE_REFERENCE_NEVER_PRESENT` already carries, because `plan_consequence` is
   positive-polarity by construction and `transition_feature` is not.
3. **`piece_distance` shipping closes R2's loop.** The static half of the repositioning case is
   now in the vocabulary, which is precisely why §7 R1 can refuse the delta without leaving the
   owner's knight-reroute case unserved. The half that survived measurement shipped; the half
   that failed it does not ship here.

**No shared surface remains.** `plan_consequence`, `piece_count`, `king_zone` and
`piece_distance` are static leaves in the `structuralFeature` union; this RFC adds a sibling
union and one success-condition arm and touches none of them.

**Two things flow the other way**, recorded so the coordinator can act on them:

1. **F4 is discharged by this RFC.** The deferral it records is overturned by the owner ruling
   and the category ships here. F4's text is **not** edited by this draft — sibling-RFC edits
   are outside this draft's authority — so the coordinator should mark it discharged when this
   RFC is accepted, and should do so in the same commit that archives `predicate-wave-3`.
2. **F4's promotion trigger was never met, and this RFC does not claim it was.** The trigger is
   *"the first authoring wave to file a transition claim as a format gap, or the RFC that ships
   the discovered-threat surface"*; neither has fired, re-checked by
   `design/research/move-primitive-computability.md` §5. An **owner ruling** opened this lane
   instead — the mechanism `rfc/0000-rfc-process.md` provides, and the same one that opened
   wave 3 itself. Stated plainly, because a reader checking the trigger will find it unfired.
   The discovered-threat surface (`vacationReading`) is **still** unclaimed after this RFC: §8
   leaves it dead deliberately, so the second half of F4's trigger survives intact.

## Deviations from design

**None in intent.** Three places where this RFC is *narrower* than a design doc permits, each
deliberate and stated so a later wave does not read the gap as an oversight:

1. `05` §3-forms permits any rung to render in any form. This RFC ships **sentences only** —
   no board overlays, no arrows, no lit squares for transition facts — because the form matrix
   is `polish-surfaces`' shipped surface and adding forms here would claim another RFC's lane.
2. `05` §3b's guided mode would let a transition fact ride a shape-entry tip. Not wired: the
   two layers stay separate in this RFC, and the unification `05` §5c describes is left to the
   surface that owns it.
3. `design/BACKLOG.md`'s *Discovered-threat visualisation* row is the sibling of this category
   and shares its arithmetic. **Not claimed** (§8), so F4's second promotion trigger remains
   available to it.

## Acceptance criteria

1. **The coverage refusal is real, and it refuses only what §4.4a scopes it to.** Four fixtures,
   all required: (a) a pack whose `to: "achieved"` `transition_feature` condition is `false` at
   every transition in its authored set is rejected with `TRANSITION_EXPRESSION_NEVER_PRESENT`;
   (b) a pack whose `to: "failed"` condition is `true` at every authored transition is rejected
   with `TRANSITION_EXPRESSION_NEVER_ABSENT`; (c) **a pack whose `to: "failed"` condition is false
   on every spine edge but true on an authored deviation edge LOADS CLEAN** — this is the
   negative test for the drafting error §4.4a corrects, and without it the fix is unverified;
   (d) the `ALWAYS_PRESENT` warning is demonstrated on a tautological positive-polarity condition.
   **This criterion is the RFC's answer to the `timingWindow` precedent and is not waivable; (c)
   is what keeps the answer from being a false refusal.**
2. **Re-measured on the landing checkout, and §5.4 is re-derived from the result.** Every corpus
   figure quoted here (593 transitions, 35 packs, the selectivity table, the 29.06 µs bundle) is
   re-run on the tree at landing, by symbol name and not by the line numbers in this file. The
   *ordering* of selectivity must survive; the digits may move. **Additionally, and this is a
   gate rather than a report: the corrected `attacked_squares_changed` rate is measured, and if
   the empty band between the live tier and the next primitive is narrower than 10 points, the
   §5.4 partition is escalated to the owner (open question 2) rather than shipped as drawn.**
3. **The extraction is behaviour-preserving.** `capturedRole`, `irreversibility` and the
   slider-ray walk move to `packages/runtime/src/transition.ts` and are imported back by
   `pivotal.ts` and `structure.ts`. Every existing assertion in `pivotal.test.ts`,
   `structure.test.ts` and `predicate-wave-2-content.test.ts` passes unchanged. **`clock_zeroed`
   is new arithmetic in `transition.ts` only: `IrreversibilityDetail` gains no fourth subkind and
   `pivotalMarkers` emits no new irreversibility marker** (§2.3).
4. **The evaluator is oracle-checked against the harness** on all 593 corpus transitions for
   the four leaves whose arithmetic the harness implements identically
   (`slider_lines_changed`, `escape_squares_changed`, `defended_duties_changed`,
   `move_irreversibility`) — **0 mismatches**. The two target-keyed leaves (§2.4) are checked
   for the inequality instead: their firing rate is ≤ the harness's 50.6% / 74.9%.
5. **Ranges are measured, not guessed.** `TRANSITION_COUNT_OUT_OF_RANGE`'s per-leaf bound is
   tightened from 64 to the measured corpus maximum, and the observed range per leaf is
   recorded in `docs/`.
6. **No expensive call path — in the two checkable forms of §8, both required.** **6a:** an
   import-declaration test asserts `transition.ts` takes exactly one value binding from
   `./structure.js`, `matchesStructuralExpression`, and never imports or re-exports
   `structuralReading`, `structuralDelta` or `pawnSafety` under any alias. **6b:** a call-graph
   test asserts that with the `→ matchesStructuralExpression` edge cut, none of
   `matchesTransitionExpression`, `matchesTransitionFeature`, `transitionReading` reaches any of
   the three. The draft's single "module-graph test asserting no transitive path" is **not** an
   acceptable substitute: it cannot pass, for the two reasons §8 states.
7. **SUPERSEDED BY R3.** No `PivotalKind` is added, so this RFC does not modify
   `renderPivotalMarker`; D48 remains assigned to `live-marker-quality`. Original rejected
   criterion retained below for history. **`renderPivotalMarker` is exhaustive, and the sentences are pinned before and after.**
   Converted to a `switch` over `marker.kind` ending in a `never` binding. **All six existing
   outputs across the four shipped kinds** — `phase_change`; `human_divergence`;
   `option_collapse` in both its one-move and n-move forms; and the three irreversibility
   sentences `castled`, `last_of_role`, pawn contact — are byte-identical, pinned by a test
   written **before** the conversion. A regression test constructs a `defended_duty_acquired`
   marker and asserts it does **not** render "created or resolved pawn contact", which is what
   the shipped code does today (§5.3). `PivotalMarker.detail`'s union includes `DutyDetail`.
8. **The reading projection carries no verdict.** `transitionReading`'s output type has no
   score, rank, severity or significance field, and a unit test asserts that no template string
   in `transition-sentences.ts` and no leaf name contains a member of `KEY_POINT_JUDGEMENTS`
   (`pack-validation.ts:148`).
9. **Three committed packs carry a firing `transition_feature` condition** (§4.6), landing in
   the same commits as the implementation, each verified to fire on its own authored transition
   set and each graded — not `play_until_checkpoint`. **At least one of the three carries a
   negative-polarity (`to: "degraded"` or `to: "failed"`) condition**, so the polarity half of
   §4.4a is exercised by content and not only by a fixture.
10. **One of the three is a plan-family pack** whose objective previously graded a position and
    now grades the transition that produced it, demonstrating `05` §5c's *grade a plan by its
    consequence*.
11. **The Just Play surface is exercised by a browser test**: a `position` run reaches a
    transition, the closed-by-default reading discloses on click and closes again, and the event
    count remains unchanged. **R3 removed the marker/modal half of the original criterion.**
12. **The hypothetical boundary holds, as a tested boundary rather than a type** (§5.5, corrected).
    Two assertions: (a) no exported function, REST route or client call accepts a candidate move,
    a legal-move list or a proposed continuation for transition analysis; **and (b) no call site
    under `apps/` constructs the `after` argument to `matchesTransitionExpression` or
    `transitionReading` from a move the run has not committed** — every call site passes a node's
    own `fen`/`moveUci` and its parent's `fen`, or a validator-replayed authored transition.
    (b) is the one that matters, because (a) alone is satisfiable while a caller synthesises the
    third string itself.
13. **Exhaustive dispatch.** Every site in §4.3 compiles only with its new case, including the
    `never` binding newly added to `evaluateObjectivePredicate`.
14. **Docs and ledger, in the same commits.** `docs/structural-reading.md` gains a transition
    section (or a sibling `docs/transition-primitives.md`); `docs/drill-pack-format.md`,
    `docs/adaptive-guidance.md` and `docs/drill-client.md` gain their arms; and the
    `design/BACKLOG.md` rows this ships (*Move primitives*, *Question shapes* shape 2,
    *Discovered-threat visualisation* — partially) flip 💡→✅ with a one-line summary **in the
    same commit** as archiving, per the RFC completion protocol. The two rows this RFC
    deliberately leaves open (`structuralDelta`'s cost defect; `structuralDelta`/
    `vacationReading` are dead) stay open and are annotated with the reason (§8).
15. **A dated entry in `planning/exploration/log.md`**, and `planning/campaign-research-queue.md`
    R3 annotated with the live tier's dependency on it (§5.4) — the queue file is planning tier
    and this RFC's implementation may update it; `design/` is not touched.

## Open questions

1. **Does the live tier survive R3?** `planning/campaign-research-queue.md` R3 is unanswered,
   and §5.4 makes `defended_duty_acquired` provisional on it. Decided by the R3 harness, not
   here. Fallback is one enum member (§5.4). **Owner-facing only if R3 says no** — the removal
   is mechanical.
2. **What are the corrected firing rates for the two target-keyed leaves, and does §5.4's
   threshold still have a grounding?** §2.4 proves they are ≤ 50.6% and ≤ 74.9% but does not
   measure them. **Both failure modes are live, and cross-review raised this from a footnote to
   a blocker on the live tier.** If `attacked_squares_changed` falls below ~15%, it becomes a
   live-tier candidate. If it falls anywhere into the 13–25% region, the "37-point empty band"
   §5.4 draws its partition on **closes**, and the threshold reverts to a free parameter encoding
   taste — which rule 2 forbids. Only the two upper bounds move, and they move downward, so the
   band can shrink but never widen. **Criterion 2 produces the number and gates on it; the
   disposition is an owner call, not an implementer's.** An R3-lane dossier measuring exactly
   these corrected rates is in flight; this RFC states the dependency rather than guessing the
   result, and the live tier does not land ahead of it.
3. **Should the static `defended_duties` count ship as a position leaf?** R7 refuses it for this
   wave on zero attestations. It is the most natural wave-4 candidate this RFC creates, and the
   asymmetry — a crossing is expressible, the level is not — is real. Deferred to the next
   static wave.
4. **Does the objective machinery need a "happened anywhere on this branch" quantifier?**
   §4.2 argues no, because a transition to `achieved` latches. That is verified for the
   forward direction; it is **not** verified for a condition with `to: "degraded"` whose author
   wants "a degrading move was played at some point" rather than "the last move degraded".
   Resolved by criterion 9's authored content or explicitly deferred.
5. **Should a `mover` node exist?** R8 refuses it on zero attestations. The composition that
   substitutes for it — colour on every leaf — is adequate for the three demonstration packs;
   it may not be for a pack that wants "whoever moved, not White specifically". Widens when a
   plan names it.
6. **Where do transition facts render as board overlays?** Deviation 1 ships sentences only.
   The lighting/arrow ladder is `polish-surfaces`' surface and the form matrix says a rung-0
   fact is honest in every form. Belongs to whichever RFC next touches `AssistanceConfig`'s
   form keys — not reserved here.
7. **Does `structuralDelta` get fixed, deleted, or left?** §8 excludes it and explicitly does
   not fix it. Three options survive: rewrite it to parse each FEN once (the defect row),
   delete it and `vacationReading` as dead code, or leave both for the discovered-threat
   surface. **Owner-facing**, because deleting an exported function is a public-API decision and
   because the discovered-threat surface is a ledgered product idea, not just dead code.
8. **What happens to a correct `to: "achieved"` condition that its own pack deliberately does not
   cover?** §4.4a scopes the refusal by polarity and widens the walk to deviation edges, which
   removes the false refusal for failure conditions. It does not remove it for the
   outpost-enumeration shape on the positive side: an expression that discriminates perfectly and
   that the pack simply never realises is still refused at load. Two remedies, and this RFC picks
   neither: a `witness: { before, moveUci }` field on the condition (inside this RFC's 0.22 lane,
   but a new authoring surface, and the ledger row *No instrument answers "where does this
   expression fire?"* suggests the general instrument should own it rather than one condition
   kind), or downgrading `NEVER_PRESENT` to a warning (which returns the answer to the
   `timingWindow` precedent to nothing). **Owner-facing.** Left open rather than decided because
   deciding it either way changes what §4.4's headline claim is worth.
9. **Does `PivotalMarker` become a discriminated union?** §5.3's `never` binding closes the
   learner-facing defect but leaves each arm's `marker.detail as …` cast unchecked, because
   `kind` and `detail` are independent fields on a flat interface. The sound form is five
   `{ kind, detail }` pairs, which touches every construction site in `pivotalMarkers` and every
   consumer of `detail`. Not taken here; recorded so the residual cast is not read as intentional.
   **Files as a BACKLOG row rather than an owner decision.**

## Changelog

- 2026-08-15: created. Drafted against the owner ruling of the same day
  (`rfc/archive/predicate-wave-3.md:146-147`), taking §7 F4 as specification input and
  `design/research/move-primitive-computability.md` as the measurement base. Claims no migration,
  no run-schema change, no shape-entry change and no `AssistanceConfig` version.
- 2026-08-15 (cross-review, adversarial, by an agent that did not write the draft). Eight
  corrections, four of them blocking as drafted:
  **(1) Pack schema 0.19 → 0.22.** The tree moved to **0.20** while this draft sat
  (`opening-evidence-path` landed); the pack version is a monotonic shared constant, so 0.19 was
  no longer claimable. 0.21 is `deviation-classes`'. Header, §11 and §12 corrected.
  **(2) `predicate-wave-3` was archived mid-draft.** All 15 citations repointed to
  `rfc/archive/predicate-wave-3.md`; §12's assertion that it was "still in `rfc/`" removed; the
  exploration-gate ruling relocated to `:146-147`.
  **(3) `TRANSITION_EXPRESSION_NEVER_PRESENT` conflated coverage with unsatisfiability** and, as
  drafted, refused every correct `to: "failed"` / `to: "degraded"` condition. New §4.4a, polarity
  scoping on the shipped `SHAPE_REFERENCE_NEVER_PRESENT` precedent, a `NEVER_ABSENT` mirror, the
  authored transition set widened to deviation edges, and criterion 1 gains the negative test.
  **(4) Criterion 6 could not pass** in either the module or the symbol reading; split into 6a
  (import surface) and 6b (call graph with the permitted edge cut).
  **(5) §5.5's "it is the shape of the API" was false** — three FEN strings do not forbid a
  synthesised `after`. Restated as a tested boundary; criterion 12 widened to call sites.
  **(6) `renderPivotalMarker`:** `PivotalMarker.detail` must widen with `DutyDetail`; it is six
  outputs across four kinds, not four; the `never` binding fixes the defect but not the casts
  (open question 9). Also corrected: `Timeline.svelte:75` discards the marker `label`, so
  `renderPivotalMarker` is the marker's *only* text surface.
  **(7) §5.4's threshold is contingent, not established** — the band can only shrink under §2.4's
  corrections; criterion 2 now gates on it and open question 2 states the in-flight dependency.
  **(8) Rule 5 restated** (unnamed-set cardinality is the operative test); control delta's
  **region** form is not excluded by it and moves to rule 3/R8; `pieceOnSquare` added to the
  not-admitted enumeration; `clock_zeroed` narrowed from an `after`-only test to a move property
  and marked as new rather than extracted arithmetic; §4.5's evidence-fact widening given its
  four-file work list and a `transitionFeatureKinds` walker.
  `rfc/README.md` was **not** edited: its Active row exists but still says 0.19, and the
  **0.22 pack-schema register row is missing**. Both flagged for the coordinator.
