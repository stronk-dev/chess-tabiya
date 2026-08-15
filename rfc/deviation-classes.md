# RFC: Deviation classes — separating the axes the enum collapsed

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/01-training-model.md:142-149` (target mistake classes — *"right plan one
  move too slow; tension released too early or held too long"*), `design/01-training-model.md:126-127`
  (Line Drill grades membership — `on_line` / `classified_deviation` / `unknown`, **never a score**),
  `design/04-content-architecture.md:226` (*"deviations classified"* as an opening pack's content),
  `design/05-in-run-experience.md:41` (**"Absence is stated, never simulated"** — the invariant §2.4's
  rendering contract is derived from)
- **Exploration gate:** none needed — this is a format defect with three attestations in
  `design/BACKLOG.md` (rows "`concept_violation` does two different jobs …" at `:172` and "**Deviation
  class carries two incompatible jobs**" at `:221`), not a GAP row. The third attestation is wave G1
  (`planning/content-era/log.md:1475`, commit `231d326`)
- **Depends on:** `rfc/archive/authoring-frictions.md` §6 (pack schema **0.16**, the guard's four new
  knobs — **landed as `ffc9817`, 2026-08-15**; this RFC builds on them and contradicts none),
  `rfc/archive/content-sourcing-foundation.md` §3.3
  (the objective-relativity ruling at `:772`), `rfc/archive/line-drill-theory-grading.md` §6 (severity
  comes from `offObjective`, never from the class), `rfc/archive/onramp-guard.md` (`immediate_guard`,
  the `guard` block), `rfc/archive/tempo-vocabulary.md` (pack schema **0.17**, `timingWindows` —
  **landed as `ed48978`, 2026-08-15**; §6 is therefore no longer contingent).
  **Landing-order coupling, §3.3 only:** `rfc/opening-evidence-path.md` §5b (`HUMAN_ONLY_POINTERS`)
- **Parent / amends:** amends `rfc/archive/drill-pack-format.md` (`$defs/deviation`),
  `rfc/archive/authoring-frictions.md` §6 (`guard.overrides`, and its shipped
  `GUARD_OVERRIDE_DUPLICATE` keying) and `rfc/archive/tempo-vocabulary.md` §7.1
  (`TIMING_WINDOW_UNKNOWN` gains a third referencing path)
- **Supersedes / superseded by:** —
- **Planning:** `planning/deviation-classes/` (once implementing)


> **OPEN QUESTION 7 CLOSED by claude (register coordinator), 2026-08-15 — NEITHER draft owns
> `/deviations/{i}/cost` evidence admission, and that is now stated rather than assumed.**
> `deviation-classes` (0.21) delegates the admission to "the evidence-path RFC (0.20)";
> `opening-evidence-path` (0.20) declines it. Each believing the other owns it is precisely the
> flow-back failure the RFC completion protocol was written against, so it is resolved here
> instead of at implementation time.
>
> **Resolution: `cost` ships AUTHOR-DECLARED AND UNBACKED, explicitly.** No evidence record binds
> it in either wave. The declared-vs-executable law applies to the honest form of that: the field
> is declared, no capability claims it is verified, and **no surface may render a `cost` as
> engine-confirmed**. A later RFC binds it to the `engine` evidence record that 0.20 introduces —
> ledgered as its own row so the gap is visible rather than inherited.
> Rationale: 0.20's evidence record attaches to the pack ROOT (`assessedBy`), while `cost` is
> per-deviation; binding them is a real design question about per-move evidence linkage, and
> neither wave scoped it. Shipping the field unbacked is honest; shipping it while each RFC
> assumes the other verified it is not.


> **OWNER RULING 2026-08-15 (`d4f2fc5`) — `mistake` is MULTI-VALUED. Implemented in the body of
> this RFC, not only in this header.** The RFC proposed a single-valued enum defined as *the lesson
> the feedback teaches*, and its cross-review correctly found that this **relocates** the ambiguity
> rather than dissolving it — well-defined as a decision procedure for an author, not as a fact about
> the position. The owner ruled for the truthful encoding: a deviation MAY carry more than one of
> `plan` / `timing` / `tactical`, because an ordering mistake genuinely is both a plan error and a
> timing error.
>
> **Where the ruling now lives in the specification.** §2.1 is a set (`type: "array"`, `minItems: 1`,
> `uniqueItems: true`) rather than an enum. §2.2 no longer rests the decomposition on the
> both-case count. **§2.4 states, surface by surface, what each rendering site does when a deviation
> carries two** — *"pick the first"* is prohibited by name, as a silent truncation of exactly the
> kind `design/05-in-run-experience.md:41` forbids and `design/BACKLOG.md:118` (D41) already has an
> open 🐞 for on a different field. §8.3 re-measures the back-fill under a multi-label classifier.
> Open question 1 is closed and removed; the reason is recorded under **Closed questions**.

## Summary

`deviations[].class` (`schemas/drill_pack.schema.json:878-886`) is one enum carrying at least three
independent questions: **how does this move stand to what this pack teaches** (objective-relative,
unmechanizable by ruling), **what kind of mistake is it** (plan / timing / tactical — a pedagogical
choice), and **how bad is it by measurement** (centipawns, mate, or unmeasurable). Because the three
share one field, `concept_violation` means both *"right plan, wrong moment"* and *"wrong plan"*;
`tactical_error` smuggles a measurable claim into an axis that by ruling may never be measured; and
`guard.evalSwingCp` — which describes the same event — never consults the class, so
`opponent-intent-early-queen` declares a 150cp guard over a move it classes `tactical_error` at a
measured cost of **20cp**. This RFC separates the axes with **two optional fields** — one of them a
**set**, per the owner ruling — and **one optional guard key**, adds **four new refusals and amends
two existing ones** — every one of which consults *only declarations inside the same pack document,
shipped constants and the position tree* (§5 audits them row by row) — states **per rendering surface
what happens when a deviation carries two mistake values** (§2.4), and states plainly which
distinctions can never be checked at all. **No committed pack becomes invalid; no committed pack
changes bytes.** The remaining value is realized by an opt-in authoring pass over 36 rows in 15 files,
costed in §8.

**Census baseline, re-derived on `f962a7b` for this revision.** The tree moved five times on
2026-08-15 (`ffc9817`, `047de02`, `ed48978`, `4977ff6`, `8fbab41`) and the corpus moved once inside
that (`047de02` edited three trajectory packs). Re-counted rather than trusted: **43 pack files in
`content/drafts/`, 37 of them carrying `deviations`, 275 deviation entries** — identical to the
cross-review figures, because `047de02`'s content edits added `legs` and evidence sidecars and touched
no deviation. (The 43rd pack file is `trajectory-legs.browser.json`, which declares `legs` and no
`spine`; a predicate that requires `spine` finds 42 and is the trap an earlier count fell into.)
Every class count below was re-derived on the same commit. Re-derive again before implementing.

**Everything below is cited against the committed tree at `f962a7b` (pack schema 0.17), and the
working tree is not it.** `predicate-wave-3` (pack 0.18) is **mid-landing and uncommitted** as this
revision is written — `packages/schema/src/index.ts` reads `"0.18"` and `SHAPE_ENTRY_SCHEMA_VERSION`
`"0.3"` on disk while `HEAD` reads `"0.17"` / `"0.2"`, and `schemas/drill_pack.schema.json`,
`authored-feedback.ts`, `api.ts`, `pack-validation.ts`, `types.ts` and both sheets are dirty. Line
numbers in an uncommitted file are worth nothing, which is why §0's locate-by-symbol rule is stated
before any of them: **every reference below names the symbol first and the `f962a7b` line second.**
The implementer re-resolves lines against whatever has landed by then.

## Motivation

**Three attestations, one defect.**

1. **The defect sweep (Pack B, 2026-08-12).** One class name covers a timing mistake and a
   plan-coherence mistake. Those are different lessons and want different feedback
   (`design/BACKLOG.md:174`).
2. **The objective-relativity ruling (2026-08-12).**
   `rfc/archive/content-sourcing-foundation.md:772` puts `deviations[].class` in the
   *human-only, permanently* column: classes are relative to **this pack's objective**, and *"engine
   eval cannot separate `concept_violation` from `interesting_deviation`"*. This is not advisory —
   `apps/server/src/sourcing/check.ts:122` already refuses any evidence record whose `supports`
   pointer matches `/deviations/\d+/class`, with `EVIDENCE_OVERREACH`. So the format asks authors to
   declare something it has forbidden itself to check.
3. **Grounding wave G1 (2026-08-15, `231d326`, `planning/content-era/log.md:1475`).** The first
   engine pass over 18 opening packs found **four places where the number plainly disagrees with the
   authored class** and **refused to reclassify any of them** (`log.md:1620-1630`), leaving the
   disagreements visible in the files:

| # | Pack | Move | Authored class | What the engine measured | Log |
|---|---|---|---|---|---|
| 1 | `anti-sicilian-najdorf-english-attack` | 8.Qd2 (dev #6) | `concept_violation` | **+0.40, the highest-scoring eighth move measured**, ahead of the spine's 8.f3 (+0.31) | `log.md:1552-1558` |
| 2 | `anti-caro-advance` | 6.O-O (dev #4) | `concept_violation`, `offObjective` | **top candidate at +0.32**; the spine's model answer 6.Be3 is +0.09 | `log.md:1559-1564` |
| 3 | `opponent-intent-early-queen` | 2…Nf6 (dev #1) | `tactical_error` | **loss 20cp**, under the pack's own 150cp guard | `log.md:1565-1568` |
| 4 | `najdorf-english-attack-black` | 7…d5 (dev #3) | `interesting_deviation` | **loss 142cp**; the pack's own blocker asked a future pass to harden the class | `log.md:1625-1628` |

G1's refusal was correct and is **an unsustainable steady state**: the only mechanical instrument the
content phase has is forbidden to touch the field the content phase most wants checked. The wave's
own frictions list says the fix shape out loud — *"the class needs an evaluation-bearing sibling
field (an authored claim plus a measured cost, separately)"* (`log.md:1672-1677`) — and names the
guard defect beside it (`log.md:1678-1681`).

**The guard defect, sharpened.** The ledger row (`design/BACKLOG.md:224`) says the 150cp guard can
never fire on `opponent-intent-early-queen`'s taught move. Re-verified against `f962a7b`, it is
worse: **neither tier's threshold is reachable.** The engine tier needs a 150cp swing
(`apps/server/src/guard.ts`, `guardSettings` at `:89` and `centipawnSwing` at `:178`); the rules tier
fires on a material swing of **3 pawns or more** (`applyRulesGuard` at `:138`, the `<= -3` comparison
at `:153`, with `MATERIAL_VALUES` at `packages/runtime/src/objective.ts:23-30` — pawn `1`, so 3 units
*is* 3 pawns) or an undefended major/minor (`hasUndefendedMajorOrMinor`, `guard.ts:50`, called at
`:156`). The move's own note grounds itself on *material* — "3.Qxe5+ wins a pawn with check", which G1
confirmed (`log.md:1567-1568`) — and one pawn is not three. **Neither number the pack declares can be
met by either threshold on the move the ledger row is about.**

**Bounded honestly, because cross-review found an earlier draft overreaching here.** The claim is
about *this deviation*, not the whole pack. `opponent-intent-early-queen` declares 12 deviations, and
three of them (#4, #5, #8 — the Scholar's Mate lines) carry mate sentinels in G1's own record
(`loss` 30036, 30036, 30038 — re-verified on `f962a7b`), so the **mate tier reaches those** with
`fireOnMate` at its default `true`. The defect is that the pack's *first* taught move sits in a gap
between the thresholds it declares and the cost it measures, with nothing in the format able to
notice. That is narrower than "the pack is unguarded" and it is still the defect: it is exactly the
disagreement §4 makes reportable.

**Scope boundary.** In scope: the shape of `deviations[]`, the guard↔deviation link, what may
mechanically check what, and **what every rendering surface does with a multi-valued mistake**.
**Out of scope, with reasons:**

| Out of scope | Why |
|---|---|
| Ranking or scoring the classes | `rfc/archive/line-drill-theory-grading.md:205` already forbids it, and `design/01-training-model.md:126-127` says the Line Drill verdict is `on_line` / `classified_deviation` / `unknown`, never a score. Severity stays `offObjective` (`schemas/drill_pack.schema.json:887`) |
| Reclassifying anything by engine number | Law 8 and `content-sourcing-foundation.md:772`. G1's refusal is ratified here as a rule, not softened |
| Removing or renaming any enum value | 275 committed deviations use four of the five; `theoryVerdictSentence` (`apps/web/src/lib/theory-presentation.ts:17`) renders the raw value to the learner. A rename is a corpus edit and a UI change for no new expressiveness |
| Making `class` itself multi-valued | The ruling is about `mistake`. `class` is single-valued on all 275 committed rows, is printed verbatim, and is a **join key** (`DrillScreen.svelte:219`) whose `===` comparison a set would break silently — §2.4 S2 |
| Retiring `required_theory` (0 uses in 275) | It is a zero-use vocabulary item and belongs to the **sunset rule** the ledger already wants (`design/BACKLOG.md:246`). Flagged in §9, not acted on |
| Linking a deviation to a `planClass` | A separate ledger row (`design/BACKLOG.md:173`). It is the natural companion to a `mistake` set containing `plan` and is named in Open questions, not shipped — every axis is authoring cost (§1.4) |
| An evidence-attachment path for opening packs | The live 🐞 at `design/BACKLOG.md:222`, owned by the evidence-path RFC. This RFC states exactly where its new field stops being a declaration and would become evidence, and does not build the path |

## Specification

### §0. Register claims

- **Pack schema version: 0.21 is claimed here, and the baseline moved.** The tree now ships **0.17**
  (`schemas/drill_pack.schema.json:3` is `urn:chess-tabiya:schema:drill-pack:0.17`;
  `DRILL_PACK_SCHEMA_VERSION` at `packages/schema/src/index.ts:2` is `"0.17"`) — `tempo-vocabulary`
  landed as `ed48978`. 0.18 is `predicate-wave-3` (implementing), 0.19 was declined by
  `validator-integrity` (which landed as `047de02` claiming no version), 0.20 is
  `opening-evidence-path`'s. Both pins move to `0.21` behind whichever of 0.18 / 0.20 land first.
  **This RFC does not edit `rfc/README.md`;** the claim is stated here and the single writer of that
  register lands the row.
- **Every change is additive, re-verified for the array shape.** One optional array key and one
  optional object key on `$defs/deviation`, one optional key on `guard.overrides[]`, one optional key
  in §6. No enum value is added, removed or renamed. **Verified, not assumed:** no file under
  `content/`, `schemas/` or `apps/server/src/sourcing/fixtures/` contains a `"mistake"` or `"cost"`
  key today — it could not, because `$defs/deviation` is `additionalProperties: false`
  (`schemas/drill_pack.schema.json:890`). All 37 pack files carrying `deviations` (275 entries), the
  living fixture (`schemas/drill_pack.example.json`) and all **six** negative fixtures
  (`packages/schema/src/drill-pack.test.ts:43-50`) stay valid unchanged.
- **Locate by symbol, not by line — the tree moved five times on 2026-08-15.** `ffc9817`
  (`authoring-frictions`), `047de02` (`validator-integrity`, which rewrote `pack-validation.ts` and
  edited three content packs), `ed48978` (`tempo-vocabulary`), `4977ff6` (`resistance-spectrum`) and
  `8fbab41` (authoring refusal coverage) all landed. Every line number in this RFC was re-verified
  against `f962a7b`; every reference also names the **symbol**, which is the durable locator.
  `apps/server/src/guard.ts` references name `guardSettings`, `applyRulesGuard`,
  `applyRecordedEngineGuard`, `centipawnSwing`, `decisionTriple`, `mateAgainstLearner` and
  `hasUndefendedMajorOrMinor`.
- **No digest moves.** Pack digests are content digests over the pack document
  (`packages/schema/src/drill-pack/digest.ts:58-66`); the `$id` is not part of any pack document
  (re-verified on `f962a7b`: a pack's top-level keys are `id, version, title, mode, phase, difficulty,
  start, objective, concepts, planClasses, spine, checkpoints, authoredBoundary, opponentPolicy,
  deviations, feedbackPolicy, feedbackClaims, provenance` — `version` is the pack's own content
  version). A pack that adopts none of the new keys is byte-identical after this RFC.
  **Array-specific note:** `canonicalize` preserves array order and sorts only object keys
  (`digest.ts:35-37` vs `:39-48`), so `["plan","timing"]` and `["timing","plan"]` are **different
  documents with different digests**. That is why §2.4 canonicalizes at *render* time rather than
  demanding a sorted array from authors — a sortedness constraint would be a corpus-edit trap the
  moment two authors disagree.
- **No migration is claimed. The migration register is untouched.** Nothing persisted changes shape:
  `deviations[].class` reaches a run only through computed projections
  (`lineMembership` in `packages/runtime/src/line.ts`, `apps/server/src/authored-feedback.ts:156`,
  `:344`), never through a stored event. `feedback.generated` (`generate` in `guard.ts`) records
  `nodeId` and `evidenceRefs` and is unchanged.
- **No run-schema change.** `DRILL_RUN_SCHEMA_VERSION` stays where it is (0.14 after `4977ff6`).
  §4's check runs in validation, not at run time; §2's new field rides the existing authored-feedback
  projection.

### §1. The axes, measured

#### 1.1 What the enum is actually doing

Census of every `deviations[]` entry in `content/` (**37 files, 275 entries**, re-derived on
`f962a7b`):

| Class | Uses | Files | `offObjective` | What question does it answer? |
|---|---:|---:|---:|---|
| `required_theory` | 0 | 0 | — | — (unused; §9) |
| `accepted_alternative` | 88 | 31 | 0 | objective relation |
| `interesting_deviation` | 57 | 28 | 1 | objective relation |
| `concept_violation` | 36 | 15 | 14 | objective relation **+ mistake kind (two of them)** |
| `tactical_error` | 94 | 19 | 61 | objective relation **+ a measurable claim** |

Both Scandinavian packs (`ae8aab7`) set `offObjective` on nothing, so all 20 of their deviations land
in the class counts only; the `offObjective` column is therefore unchanged from the pre-`ae8aab7`
count and unchanged again after `047de02`.

Two members are overloaded, and they are overloaded in *different* directions. `concept_violation`
carries a second, unstated, unmechanizable question (which kind of mistake). `tactical_error` carries
a second question that **is** mechanizable (how much does it lose) on an axis that by ruling may
never be mechanized. That asymmetry is the whole defect: no single validator can exist for a field
where one member is checkable and three are forbidden from being checked.

#### 1.2 The decomposition

| Axis | Question | Field | Who decides | What may check it |
|---|---|---|---|---|
| **A. Objective relation** | how does this move stand to what *this pack* teaches? | `class` (existing, unchanged, single-valued) + `offObjective` (existing) | author | **nothing, ever** — `:772`, law 8, `check.ts:122` |
| **B. Mistake kinds** | which kinds of mistake is it? | `mistake` — **new, optional, a set** (§2) | author | co-occurrence with `class` only; §6 adds one real check when a `timingWindow` exists |
| **C. Measured cost** | how much does it lose, by what instrument? | `cost` — **new, optional** (§3) | measurement | shape; and arithmetic against the guard the same pack declares (§4) |
| **D. What is taught** | why does it matter? | `note` (existing) | author | nothing — already `PROSE_POINTERS` (`check.ts:30-36`) |

D already exists and is already correctly fenced. A already exists and is already correctly fenced.
**The RFC adds B and C, and nothing else.**

#### 1.3 Why not split the enum instead

Splitting `concept_violation` into `plan_violation` + `timing_error` was the ledger's first
suggestion ("Split the class, or add a dimension"). It is rejected on four grounds, and — this is the
change the owner ruling forces — **none of them is a count of how many rows would be awkward.**

1. **A class split cannot be multi-valued without breaking two shipped contracts.** `class` is
   printed verbatim to the learner (`theoryVerdictSentence`, `theory-presentation.ts:17`) and is a
   **join key**: `DrillScreen.svelte:219` matches an authored note to a theory verdict with
   `verdict.deviationClass === item.deviationClass`. A `===` on arrays compares identity, so a
   set-valued `class` would silently drop every supporting note — the exact silent-truncation shape
   the ruling prohibits. Axis B can be a set precisely *because* it is not a join key (§2.4 S2).
2. **A split conflates two axes permanently.** `class` answers "how does this move stand to what this
   pack teaches". A timing mistake can be an `interesting_deviation` (a resource played a move early)
   or a `concept_violation`. Splitting `concept_violation` by mistake kind forces the cross-product
   into one enum and leaves `interesting_deviation` unable to say anything about kind at all.
3. **It is a corpus edit and a learner-visible change.** 36 rows become invalid on the day it lands,
   and the class string is printed verbatim.
4. **It does not touch the second overload.** `tactical_error`'s measurable claim is untouched by any
   split of `concept_violation`, and that is where three of G1's four disagreements live.

**The corpus reading, kept as description and no longer load-bearing.** Reading all **36**
`concept_violation` notes at cross-review and re-reading them on `f962a7b`: **4** are pure timing,
**4** are ordering mistakes that are timing **and** plan at once, and **28** are plan coherence. The
eight non-plan rows are named in full so the reading is auditable rather than asserted:

| Bucket | Rows |
|---|---|
| pure timing (4) | `anti-caro-advance` #4 (*"the centre resolves while your pieces are not ready"*); `carlsbad-minority-attack` #3 (*"the right break played at the wrong time"*); `french-advance-black` #3 (*"The lever is real; this timing donates it"*); `french-advance-black` #5 (*"releases the tension exactly when it was cheapest for White to live with"*) |
| timing **and** plan (4) | `anti-sicilian-najdorf-english-attack` #6 (*"8.Qd2 plays the queen before f3 — the order this pack exists to argue against"*); `carlsbad-minority-attack` #4 (*"switching plans … costs you the tempi you already spent"*); `conversion-up-a-piece` #6 (*"Pawns before the king"*); `conversion-up-a-piece` #7 (*"Starting the pawns while the king is half-marched"*) |

The five rows `ae8aab7` added (`anti-scandinavian-white` #1/#5/#6/#8, `scandinavian-mainline-black`
#3) all read as plan coherence, which is why the two non-plan buckets did not move and the plan
bucket went 23 → 28. **`anti-scandinavian-white` #8 was the closest call under a single-valued
field** — *"having already played h3 spends the tempo twice … If you are not going to follow h3 with
g4, h3 was not the move"* — and cross-review counted it plan because it names an abandoned plan, not
a mistimed one. **Under the multi-valued field the call disappears rather than being decided**: the
row can declare `["plan", "timing"]` and both readings are in the file. That is the ruling's effect
in one row, and it is why the 4 / 4 / 28 numbers above are now reported as *what the corpus looks
like*, not as *the argument for the design*. §2.2 states what the argument rests on instead.

#### 1.4 The conservatism budget

`design/research/pack-authoring-cost.md:105` measures **encoding at 43.6% of 1434 authoring
minutes** — the largest category — and `:256-261` finds encoding-dominant here means *prose*
dominant, not format fights. So the cost of a new field is not schema friction, it is *decisions per
deviation*. This RFC therefore spends its budget as follows and refuses the rest:

- both new fields are **optional**; a pack that declares neither is unchanged and unwarned;
- `mistake` draws from **three** values, and multi-value does not raise the authoring cost: the
  author reads their own note and ticks what it says, rather than adjudicating between two readings
  the note already states together (§8.4);
- `cost` is authored **where a number already exists** — 115 of the 275 committed deviations already
  carry one (§8.2);
- the guard check fires only in `immediate_guard` packs, of which there are **7** — re-derived on
  `f962a7b`: `conversion-up-a-piece`, `mate-k-q-technique`, `mate-k-r-technique`,
  `opening-principles-black`, `opening-principles-white`, `opponent-intent-early-queen`, plus
  `immediate-guard.browser.json`, which declares **no deviations at all** — so **31 of the 37
  deviation-carrying packs can never see it**;
- `planClassId`, a per-deviation evidence ledger, and any severity ranking are **not** shipped.

### §2. `deviations[].mistake` — axis B, multi-valued

#### 2.1 Schema (pack 0.21, additive) — a set, not an enum

`$defs/deviation` (`schemas/drill_pack.schema.json:872-891`) gains:

```json
"mistake": {
  "type": "array",
  "minItems": 1,
  "uniqueItems": true,
  "items": { "enum": ["plan", "timing", "tactical"] }
}
```

- **`minItems: 1`** is load-bearing: it forbids `[]`, which would be a second way to say "undeclared"
  and a value every §2.4 surface would then have to special-case. Absence is the only way to say
  nothing.
- **`uniqueItems: true`** makes `["plan","plan"]` invalid; combined with the three-member `items`
  enum it also bounds length at 3, so no `maxItems` is written (a redundant constraint that could
  drift out of step with the enum if a fourth value is ever admitted).
- **`additionalProperties: false` is preserved** on `$defs/deviation` (`:890`), and `required` stays
  `["at", "moveUci", "class"]` (`:874`). No other `$defs` member is touched.
- **Array order carries no meaning.** Two packs declaring `["timing","plan"]` and `["plan","timing"]`
  make the same claim, have different digests (§0), and **render identically** because every surface
  canonicalizes (§2.4). The schema deliberately does not require sorted order; see §0's note on why a
  sortedness constraint would be a corpus-edit trap.

**Type** (`packages/schema/src/drill-pack/types.ts`, beside `Deviation` at `:59-65`):

```ts
export const DEVIATION_MISTAKES = ["plan", "timing", "tactical"] as const;
export type DeviationMistake = (typeof DEVIATION_MISTAKES)[number];
// Deviation gains: readonly mistake?: readonly DeviationMistake[];
```

`DEVIATION_MISTAKES` is the **single writer** of the vocabulary and of its canonical order: the
schema's `items.enum` is asserted equal to it in `packages/schema/src/drill-pack.test.ts`'s
"binds schema vocabularies to the shared constants" test (`:65-75`), which is the shipped pattern for
`OBJECTIVE_TYPES`, `FEEDBACK_POLICIES` and `PACK_PHASES`.

#### 2.2 Semantics — what the decomposition now rests on

`mistake` declares **which kinds of mistake this move is, as the pack's author reads it.** It is a
set because a move can be more than one kind. It is not an exhaustive truth about the position and
it is not a ranking; the members are unordered and no member outweighs another.

| Value | Means | Corpus exemplar |
|---|---|---|
| `plan` | the move contradicts, abandons or never had the plan the pack committed to | `trajectory-qgd-exchange-minority.json` dev #0: *"4.c5 closes the queenside … off everything this trajectory exists to rehearse"* |
| `timing` | the plan is right and the moment is wrong — too early, too late, or out of order | `carlsbad-minority-attack.json` dev #3: *"the right break played at the wrong time"* |
| `tactical` | the move loses material or allows a concrete refutation | `opponent-intent-early-queen.json` dev #4: 3…Nf6, forced mate |
| `["plan","timing"]` | **an ordering mistake** — the plan is wrong *because* the order is wrong, or the tempi already spent are lost by the switch | `anti-sicilian-najdorf-english-attack.json` dev #6: *"8.Qd2 plays the queen before f3 — the order this pack exists to argue against"* |

**What changed, and what the argument rests on now.** The single-valued draft defined the field as
*"the lesson this pack teaches about this move"* and rested the decomposition on a scarcity claim: a
two-value class split would make **4 of 36** rows unauthorable-without-lying, and 4 was small enough
to absorb by picking one. The cross-review found the definition relocated the ambiguity — it is
well-defined as a decision procedure for an author, not as a fact about the position. **Multi-value
dissolves that argument rather than answering it**, and the old justification is removed rather than
left standing:

- **The both-case count is no longer evidence for anything.** A set encodes 0, 1, 2 or 3 kinds
  natively. Whether the corpus contains 4 both-cases, 12 or 40 changes no schema, no check, no
  surface and no cost estimate. The design is **indifferent to the count**, which is the strongest
  available answer to the cross-review's concern that the evidence base was thin: an argument that
  does not depend on a number cannot be undermined by that number moving.
- **The decomposition rests instead on axis independence, which is structural.** Axis A (objective
  relation) and axis B (mistake kind) answer different questions, are decided by different reasoning,
  and vary independently in the corpus — a `timing` mistake appears under `concept_violation` (4
  rows) and is the natural reading of `najdorf-english-attack-black` dev #3's *"...d5 is a TIMED
  resource"* under `interesting_deviation`. One field cannot carry two independent axes without one
  of them being unstatable for some combinations. That is a claim about the shape of the questions,
  not about how many rows are currently awkward.
- **And on the second overload, which no split addresses.** `tactical_error` mixes axis A with a
  measurable claim on an axis that may never be measured (§1.1). Axis C is the answer to that, and it
  is independent of anything the ruling touched.
- **No author is asked to adjudicate a reading any more.** For `conversion-up-a-piece` #6 two authors
  could previously pick differently and neither would be wrong, with nothing letting a reviewer
  adjudicate. Now both write `["plan","timing"]` and agree. The residual disagreement space is
  narrower and *visible*: an author who writes `["plan"]` where another writes `["plan","timing"]` is
  making a legible omission, not an invisible choice between two equally correct single values.

**Absence means undeclared, not "no mistake."** There is no `none` value and `[]` is invalid (§2.1):
`class: accepted_alternative` already says the move is not a mistake, and a fourth value would be a
second place to say the same thing. Every surface's absence rule is stated in §2.4.

**What multi-value does not buy.** It does not make the field checkable — §7 still lists it as
author-declared and never validated outside §6's window link. It does not settle whether a note that
*mentions* tempo is a timing mistake; §8.3 measures exactly how badly a machine reads that, and the
answer got worse, not better.

#### 2.3 Two refusals, both cheap, both re-specified for a set

| Code | Severity | Condition |
|---|---|---|
| `DEVIATION_MISTAKE_ON_ACCEPTED` | **warning** (lint) | `mistake` present (necessarily non-empty) with `class` `accepted_alternative` or `required_theory`, **whatever the set contains**. The pack is saying "this is fine" and "this is a mistake" in two fields. A warning, not an error: an author may deliberately mean *"sound, but a beat late"* — `["timing"]` on an `accepted_alternative` is the shape that reading takes — and the format should surface the tension rather than adjudicate it. Path `/deviations/<i>/mistake` |
| `DEVIATION_MISTAKE_TACTICAL_REDUNDANT` | **warning** (lint) | `class: "tactical_error"` **and `mistake` is exactly `["tactical"]`** — the whole field then states what `class` already states. It **does not fire** on `["timing","tactical"]` or `["plan","tactical"]`, because those add a kind the class cannot express and are the author doing the right thing. This narrowing is a direct consequence of the ruling: under a single value the two cases were indistinguishable, so the old rule would have warned on exactly the rows the ruling exists to enable. Path `/deviations/<i>/mistake` |

No other check exists on this field. It is author-declared and, except for §6's window link,
**permanently unvalidatable** (§7). In particular **no check counts, ranks or compares set sizes** —
a pack declaring three kinds is not "worse" than one declaring one, and any check implying so would
be the severity ranking `line-drill-theory-grading.md:205` forbids.

#### 2.4 Delivery, and the multi-value rendering contract

The field must reach the learner or it is decoration; and having reached a surface, it must not be
quietly cut down. The owner ruling names this as the part that must not be hand-waved, so the
contract is stated first as a rule and then discharged **surface by surface**, with the surfaces
enumerated by grep rather than by recollection.

##### 2.4.0 The contract

> **A surface that renders `mistake` renders every declared value**, in the canonical
> `DEVIATION_MISTAKES` order (`plan`, `timing`, `tactical`), joined by `", "`, with **no generated
> connective** — no "and", no "both", no "also". A comma-joined list of authored tokens is authored
> content re-ordered; a connective is prose about a position (law 8).
>
> **A surface that cannot fit the whole set must state that it did not.** It renders the values it
> can fit followed by an explicit count of those it did not (`plan +1 more`) and must make the
> elided values reachable in the same view. **A surface may never render a proper subset of the set
> without saying that it did.** *"Pick the first"* is prohibited by name: it is the silent truncation
> `design/05-in-run-experience.md:41` ("Absence is stated, never simulated") forbids, and the repo
> already carries an open 🐞 for exactly that failure shape on a different field —
> `design/BACKLOG.md:118` (D41), `compareAllHere`'s bare `.slice(0, 8)`.
>
> **Absence renders nothing.** When `mistake` is absent the surface emits no suffix, no placeholder
> and no "(unclassified)". This is not a truncation: the author declared nothing, and printing a
> word for "nothing declared" would be the product manufacturing a statement about the pack. The
> class sentence already stands on its own, exactly as it does today.

##### 2.4.1 The surfaces, enumerated

Every consumer of a deviation classification in the tree, found by grepping `deviationClass` and
`kind: "deviation"` across `apps/` and `packages/` on `f962a7b`. The list is exhaustive; two surfaces
the ruling names (compare strips, progress grammar) turn out to consume nothing today, and saying so
is part of the answer.

| # | Surface | Consumes today | Rule for a two-value `mistake` |
|---|---|---|---|
| **S1** | `theoryVerdictSentence`, `apps/web/src/lib/theory-presentation.ts:17` | `item.deviationClass`, printed verbatim | **Renders the whole set, always.** Canonical order, `", "`-joined, parenthesised after the class. §2.4.2 |
| **S2** | note↔verdict join, `apps/web/src/lib/DrillScreen.svelte:213-220` | `(anchor.moveUci, deviationClass)` as an equality key | **`mistake` is never a join key.** The key is unchanged. §2.4.3 |
| **S3** | authored-commentary lists, `CheckpointSheet.svelte:131-148`, `TerminalSheet.svelte:47-54` | `item.note` for `deviation` items; S1 for `theory_verdict` items | **The `deviation` item does not gain `mistake` at all**, so there is nothing to truncate. §2.4.4 |
| **S4** | voice / evidence packet, `apps/server/src/guidance.ts:23-27` → `evidencePacket` → `VoiceProvider` (`:20-21`) | `item.note` only | **`mistake` never enters the packet**, enforced structurally by S3. §2.4.5 |
| **S5** | compare strips + comparison narrative, `packages/runtime/src/compare-strips.ts:22`, `:56` | **nothing from `deviations[]`** — verified | Consumption stays at zero. A future strip must obey §2.4.0 and say so in its own RFC. §2.4.6 |
| **S6** | progress, `apps/server/src/progress.ts` | concepts; **no deviation data** — verified | Stays zero, and aggregating runs by mistake kind is refused by name. §2.4.7 |
| **S7** | validator messages (§2.3, §4.2, §6) | the codes' own operands | Author-facing text names the **whole set** in canonical order. §2.4.8 |
| **S8** | `sourcing-check` pointer refusal, `apps/server/src/sourcing/check.ts:122` | pointer strings | The refusal pattern must match **element pointers** too. §3.3 |

**No shipped surface is width-constrained on this field**, so §2.4.0's "state the truncation" clause
binds nothing today — the widest possible rendering is `(plan, timing, tactical)`, 22 characters,
inside a sentence that already carries a SAN and a class name. The clause is written anyway because
the next surface to consume the field will be written by someone who did not read this section, and
"first value only" is the default a hurried implementer reaches for.

##### 2.4.2 S1 — `theoryVerdictSentence`, the only learner-visible render

This is the sole place in the product where a deviation classification is printed to a learner today,
and it stays the sole place. The wire path widens first:

- `packages/runtime/src/line.ts`: `LineMembershipEntry` (`:15-23`) gains
  `readonly deviationMistakes?: readonly string[]`, carried in `lineMembership`'s
  `verdict === "classified_deviation"` branch (`:152-156`) alongside `deviationClass`, spread with the
  same `...(x === undefined ? {} : …)` idiom.
- `apps/server/src/authored-feedback.ts`: the **`theory_verdict`** item (`:57-64`) gains
  `readonly deviationMistakes?: readonly string[]`, projected at `:344` beside `deviationClass`. The
  name mirrors the existing `deviationClass` convention on that item type and is **plural**, so the
  set-ness is visible at every call site.
- `apps/web/src/lib/api.ts:174`: the `theory_verdict` wire type widens identically. **`api.ts:155`
  (the `deviation` item) does not** — see S3.
- `apps/web/src/lib/theory-presentation.ts` becomes, and this is the entire rendering change:

  ```ts
  import { DEVIATION_MISTAKES } from "@chess-tabiya/schema/drill-pack";

  function mistakeSuffix(values: readonly string[] | undefined): string {
    if (values === undefined || values.length === 0) return "";
    const ordered = DEVIATION_MISTAKES.filter((value) => values.includes(value));
    return ` (${ordered.join(", ")})`;
  }
  // …
  if (item.verdict === "classified_deviation") {
    return `Ply ${item.anchor.ply}, ${san}: the pack classifies this as ${item.deviationClass}${mistakeSuffix(item.deviationMistakes)}.`;
  }
  ```

  Rendered examples, which are the acceptance text:
  - `Ply 4, Nf6: the pack classifies this as concept_violation (timing).`
  - `Ply 8, Qd2: the pack classifies this as concept_violation (plan, timing).`
  - `Ply 6, O-O: the pack classifies this as concept_violation.` (absent — no suffix)

  **The filter over `DEVIATION_MISTAKES` is the canonicalization**, and it is also why the surface
  cannot silently truncate: it is a filter over the vocabulary, not an index into the authored array,
  so there is no `[0]` to reach for. Values are printed verbatim. **No sentence is generated from the
  values** — that would be manufactured prose about a position (law 8). The author's `note` remains
  the only explanation, and it is the note, not this suffix, that carries the reasoning.

##### 2.4.3 S2 — the note↔verdict join, and why `mistake` must stay out of it

`DrillScreen.svelte:213-220` assembles a checkpoint's authored items by matching each
`theory_verdict` to the `deviation` note that produced it:

```ts
verdict.anchor.moveUci === item.anchor.moveUci &&
verdict.deviationClass === item.deviationClass,
```

**Rule: the join key stays `(anchor.moveUci, deviationClass)`; `mistake` is never added to it.** The
reason is mechanical and verified in the shipped predicate: the comparison is `===`, which on arrays
compares references. Two structurally identical sets produced by two projections are different
objects, so adding `deviationMistakes` to this conjunction would make it **always false** and every
supporting note would vanish from the checkpoint sheet — a silent drop of authored content, which is
the worst version of the failure §2.4.0 exists to prevent, and one that no test of the *class* path
would catch. `mistake` adds no discriminating power here in any case: `moveUci` already identifies
the deviation within its anchor (`DUPLICATE_DEVIATION`, `lint.ts:310-314`, makes `(anchor, moveUci)`
unique). Stated as a normative refusal so a later pass does not "tighten" the join.

##### 2.4.4 S3 — the sheets, and the deliberate non-widening of the `deviation` item

`CheckpointSheet.svelte:131-148` and `TerminalSheet.svelte:47-54` render the authored-commentary list:
a `deviation` item shows `item.note`; a `theory_verdict` item shows `theoryVerdictSentence(item, run)`.

**Rule: the `deviation` authored-feedback item (`authored-feedback.ts:36-46`, projected at `:149-160`)
does NOT gain `mistake`, and neither does its wire type (`api.ts:150-157`).** There is therefore no
multi-value case on this surface, because there is no value.

This is a change from the single-valued draft, which widened both item types and had to explain a
name split (`mistake` on one, `deviationMistake` on the other). Widening only the rendered path is
better on three counts, and the third is the load-bearing one:

1. The field would be carried and never rendered — decoration, which §2.4's opening sentence rules
   out in both directions.
2. It would not be a join key either (S2), so it would have no consumer at all.
3. **It would put the vocabulary into the voice path** — see S4. Not widening this item is the
   structural enforcement of that refusal, rather than a rule someone has to remember.

##### 2.4.5 S4 — the voice / evidence packet, refused structurally

`authoredText` (`apps/server/src/guidance.ts:23-27`) turns each authored-feedback item into a
sentence for `evidencePacket`, whose `sentences` are handed to a `VoiceProvider`
(`guidance.ts:20-21`) under `scope: "marker" | "reading" | "steering" | "story" | "compare" |
"reasoning"`.

**Rule: `mistake` never enters the evidence packet**, in any scope. A persona handed the tokens
`plan, timing` beside a FEN is being invited to expand them into a strategic claim about the
position, which is precisely law 8's *"LLMs may render validated evidence but may not create
ungrounded strategic claims"* and the named dashboard anti-pattern. The enforcement is structural,
not documentary: `authoredText` reads `item.note` for `deviation` items and returns `undefined` for
`theory_verdict` items, and S3 keeps the field off the item `authoredText` can see. An implementer
would have to add both the field and a branch to break this.

##### 2.4.6 S5 — compare strips and the comparison narrative, verified to consume nothing

The ruling names the compare strips and narrative templates as surfaces owing a rule. Checked rather
than assumed: `comparisonStrips` (`packages/runtime/src/compare-strips.ts:22`) and
`comparisonNarrative` (`:56`) build their sentences from eval trails, structure readings, timing
readings and piece routes. **Neither reads `deviations[]`, `class`, `note` or authored feedback at
all** — `CompareView.svelte` receives the pack only to render evidence references
(`renderEvidenceRef`, `:8`, `:33`).

**Rule: their consumption of axis B stays zero in this RFC.** The rule for the multi-value case is
therefore *"there is no case"*, stated so a reader does not go looking for one. If a later RFC puts a
mistake into a strip, that strip is a list of per-ply sentences with attributions, so the set is
rendered whole under §2.4.0 with the attribution `authored`, and **that RFC writes the rule**; it may
not inherit silence from this one.

##### 2.4.7 S6 — progress, and the aggregation that is refused

`apps/server/src/progress.ts` resolves concepts (`PackScopedConceptResolver`, `:56`) and consumes no
deviation data. **Rule: unchanged, and `mistake` is not a progress dimension.** Counting a learner's
runs by mistake kind — "you make 60% timing mistakes" — is an aggregation over authored verdicts, and
`line-drill-theory-grading.md:205` forbids ranking the classes while `design/01-training-model.md:127`
forbids the score such a summary would be. This is refused here so that a later progress wave has to
argue against a written refusal rather than fill a silence.

##### 2.4.8 S7 — validator messages

Author-facing messages that mention the field name the **whole set** in canonical order, joined by
`", "`, using the same helper shape as S1. `GUARD_CANNOT_REACH_DEVIATION`'s message (§4.2) names the
declared cost and the thresholds, not the mistake set; `DEVIATION_MISTAKE_ON_ACCEPTED` and
`DEVIATION_MISTAKE_TACTICAL_REDUNDANT` name the set so the author can see what they wrote. No
validator message ever prints one value of several.

### §3. `deviations[].cost` — axis C

#### 3.1 Schema (pack 0.21, additive)

New `$defs/deviationCost`, referenced by `$defs/deviation` as optional `cost`:

```json
"deviationCost": {
  "oneOf": [
    { "type": "object", "required": ["kind", "loss", "basis"],
      "properties": {
        "kind": { "const": "cp" },
        "loss": { "type": "integer", "minimum": 0, "maximum": 30000 },
        "basis": { "enum": ["engine", "material"] }
      }, "additionalProperties": false },
    { "type": "object", "required": ["kind", "against", "basis"],
      "properties": {
        "kind": { "const": "mate" },
        "against": { "enum": ["learner", "opponent"] },
        "basis": { "enum": ["engine", "tablebase"] }
      }, "additionalProperties": false },
    { "type": "object", "required": ["kind", "reason"],
      "properties": {
        "kind": { "const": "unmeasurable" },
        "reason": { "$ref": "#/$defs/nonEmptyString" }
      }, "additionalProperties": false }
  ]
}
```

#### 3.2 Semantics

- **`cp`** — the move's loss at its own decision position, in centipawns, non-negative. `basis:
  "engine"` is an evaluation difference; `basis: "material"` is a piece-count difference in the
  repo's own units (`MATERIAL_VALUES`, `objective.ts:23-30`, ×100). The two bases are **never
  converted into one another** — that conversion is exactly the manufactured judgment the product
  refuses, and G1 produced the case that proves they differ: `opponent-intent-early-queen` dev #1 is
  100cp by material (a pawn, with check, confirmed) and 20cp by engine (`log.md:1565-1568`).
- **`mate`** — the consequence is forced mate. `against: "learner"` is the guard-relevant case; it
  replaces the 30036-style sentinels G1 had to write into `provenance.engineValidation` (3 such
  candidates in `opponent-intent-early-queen` alone — `loss` 30036, 30036, 30038, re-verified on
  `f962a7b`) to express mate on a centipawn scale.
- **`unmeasurable`** — **the honest refusal slot, and the reason this axis is a union rather than an
  integer.** `reason` is prose stating why no number settles it. Its exemplar is already written:
  `anti-london-black`'s ...Bxg3 doctrine measures −0.33 against −0.28, *"0.05, inside noise … the
  evidence does neither, which is the answer"* (`log.md:1569-1573`). A format that only accepts a
  number would force that pack to lie or stay silent.

#### 3.3 What `cost` is not

**It is not evidence, and this RFC does not let it become evidence by accident.**

- `cost` is a **declaration in the pack document**, in the same tier as `class` and `note`. It says
  what number the author is standing on; it does not certify that anyone measured it. Today no
  opening pack can carry an evidence ledger at all (`pack-validation.ts`,
  `OBJECTIVE_GRADING_UNSUPPORTED` at `:284` on any non-outcome objective; the live 🐞 at
  `design/BACKLOG.md:222`), so a certified form is unavailable regardless of what this RFC says. The
  coordinator ruling in the header states the consequence: **no surface may render a `cost` as
  engine-confirmed**, and no entry in `apps/server/src/capabilities.ts` claims it is verified —
  re-verified on `f962a7b`, that file mentions no deviation field at all.
- `sourcing-check` (`apps/server/src/sourcing/check.ts:122`) keeps refusing
  `/deviations/\d+/class` verbatim, and **this RFC adds the `mistake` pointer to that same refusal**:
  the mistake axis is a pedagogical choice and no record may claim to support it.

  **The array shape changes the pattern, and this is not cosmetic.** A JSON pointer can address an
  array *element*: `/deviations/0/mistake/1` resolves to `"timing"`. A pattern anchored as
  `…/mistake$` would refuse the whole-field pointer and **admit the element pointer**, letting an
  evidence record support one member of a human-only set. The refusal is therefore written
  `/^\/deviations\/\d+\/mistake(?:\/\d+)?$/`. `resolvePointer` (`check.ts`, used at `:117`) resolves
  numeric segments into arrays, so the element pointer is reachable and would otherwise be blessed.

  **Landing-order coupling — verified against `rfc/opening-evidence-path.md` §5b, which owns the same
  line of code.** That RFC (pack 0.20, status *cross-reviewed, READY*, unlanded on `f962a7b`)
  replaces `check.ts:122`'s inline `/^\/deviations\/\d+\/class$/`
  test with a `HUMAN_ONLY_POINTERS` list containing
  `/^\/deviations\/\d+\/(class|offObjective)$/` (`opening-evidence-path.md:750-751`), refused with
  `EVIDENCE_OVERREACH` for **every** record kind including templated ones. The two RFCs do not
  contradict each other — both widen the same refusal in the same direction — but the *edit site*
  depends on order:

  | Order | Where `mistake` goes |
  |---|---|
  | 0.20 lands first (expected: it is the lower lane) | add a **separate entry** to `HUMAN_ONLY_POINTERS`: `/^\/deviations\/\d+\/mistake(?:\/\d+)?$/`. It cannot be folded into the existing alternation, because `class` and `offObjective` are scalars and must not gain an element suffix |
  | this RFC lands first | extend the inline test to `/^\/deviations\/\d+\/(class|mistake(?:\/\d+)?)$/`; `opening-evidence-path` §5b then folds it into `HUMAN_ONLY_POINTERS` as its own entry when it lands |

  **Correction owed to `opening-evidence-path` §5b.** Its `:1282-1283` anticipates this RFC by
  proposing `/^\/deviations\/\d+\/(class|offObjective|mistake)$/` if `deviation-classes` lands first.
  **That form is now insufficient** — it does not cover `/deviations/{i}/mistake/{j}`. This RFC does
  not edit that draft; the correction is stated here and in §10 so whichever lands second carries the
  element-suffix form.

  **`offObjective` is not this RFC's to refuse.** `content-sourcing-foundation.md:773` names it
  human-only for the *"same reason"* as `class` and it is unrefused today — but that hole is already
  attested and owned by `opening-evidence-path` §5b, which also shows it is not cosmetic (it drives
  the `theory-deviation-{i}` degradation rules). Duplicating the fix here would be a second writer on
  one list.
- `/deviations/\d+/cost` is deliberately **not** added to the refusal set — under either landing
  order, it goes into neither the inline pattern nor `HUMAN_ONLY_POINTERS`. It is the first and only
  field on a deviation that a measurement could legitimately support. The admission contract for it
  — which record kinds, which values, which byte-exactness rule — belongs to the evidence-path RFC
  (register lane 0.20) and is **not written here**, per the coordinator ruling in the header. Until
  that lands, an evidence record pointing at `cost` is unreachable because the ledger is unreachable.
  This is the seam Open question 3 names.
- `provenance.engineValidation`, the convention G1 invented (`log.md:1613-1618`), is **not**
  standardized, blessed or read by anything in this RFC. §8 uses it as a one-time migration source
  and nothing more — and §8.2a shows the convention has **already forked** in the tree, which is a
  reason to read it once and never depend on it.

### §4. The guard link

`guard.evalSwingCp` and `deviations[].class` describe the same event and never consult each other
(`design/BACKLOG.md:224`). They now consult each other in exactly one direction: **validation
compares two numbers the same author wrote, and reports when they cannot meet.** No runtime behaviour
changes.

#### 4.1 What the guard actually measures, and why the check is a warning

This is the subtlety that decides the severity. The engine tier compares the eval **before the
learner's move** with the eval **after the opponent's reply** — `centipawnSwing` (`guard.ts:178`) over
the decision triple built by `decisionTriple` (`:62`). A `cost` of kind `cp` is
candidate-relative **at the learner's decision position** — the unit G1 recorded and defined
(*"loss = the best evaluated candidate at that position minus this move"*,
`opponent-intent-early-queen.json` `provenance.engineValidation.unit`, re-read on `f962a7b`). The two
coincide only when the opponent replies with the engine's best move and search is consistent across
the two positions.

Therefore the comparison is **weaker than a necessary condition, and this RFC does not claim
otherwise.** Three independent reasons a declared sub-threshold cost does *not* prove the guard is
silent, each verified in `guard.ts`:

1. **The swing is not the loss.** A larger swing may still arrive through the opponent's reply, as
   above.
2. **The rules tier has a second branch that ignores material entirely.** `applyRulesGuard` fires on
   `hasUndefendedMajorOrMinor(triple.consequence.fen, learner)` (`:156`) regardless of any balance
   change, so a move declaring `{basis: "material", loss: 0}` can still trip the guard. Any phrasing
   that a sub-300 material cost *proves* the rules tier cannot fire would be false, and the message in
   §4.2 is worded to avoid it.
3. **`rulesTier` is not per-anchor.** See §4.2 note.

So the check reports **an arithmetic gap between two of the author's own declarations**, not a proof
of silence. That is precisely a **warning**, and specifying it as a refusal would be the format
overstating what it knows. It is worth naming that this is also the RFC's closest approach to law 8:
the check is safe only because both operands are authored declarations inside one pack document
(§5), it never grades, and it never names a remedy.

#### 4.2 `GUARD_CANNOT_REACH_DEVIATION` (warning)

Emitted by `pack-validation.ts` beside `GUARD_WITHOUT_IMMEDIATE_GUARD` (`:546-554`), path
`/deviations/<index>/cost`, when **all** hold:

1. `feedbackPolicy === "immediate_guard"`;
2. the deviation declares `cost`;
3. the deviation is a claimed mistake of the measurable kind — `class === "tactical_error"` **or
   `mistake` includes `"tactical"`**. *(The multi-value form: membership, not equality. A deviation
   declaring `["timing","tactical"]` is in scope exactly as `["tactical"]` is; a deviation declaring
   `["timing"]` alone is not, and its `cost` is recorded without arithmetic.)*;
4. no tier's *threshold* can be met by the declared cost, resolving guard settings at the deviation's
   anchor by `authoring-frictions` §6's shipped resolution (`guardSettings`, `guard.ts:89-121`:
   deepest matching anchor wins, ties by array order — the shipped predicate at `:113` keeps the
   **first** override at equal depth):

| Declared `cost` | Threshold met iff |
|---|---|
| `{kind: "cp", basis: "engine", loss}` | `evalSwingCp !== null && loss >= evalSwingCp` |
| `{kind: "cp", basis: "material", loss}` | `rulesTier === true && loss >= 300` (the shipped 3-pawn rule: `applyRulesGuard`'s `<= -3` at `guard.ts:153` against `MATERIAL_VALUES`, pawn `1`) |
| `{kind: "mate", against: "learner"}` | `fireOnMate === true` |
| `{kind: "mate", against: "opponent"}` | never — the guard fires on mate **against the learner** (`mateAgainstLearner`, `guard.ts:172`, consumed in `applyRecordedEngineGuard` at `:213`); a missed mate is not a guard event. Not a warning either: rule 3 will rarely hold with it |
| `{kind: "unmeasurable"}` | **not evaluated** — no number, no arithmetic, no warning |

**Two resolution facts the implementer must not assume away, both re-verified in `guardSettings` on
`f962a7b`:**

- **`rulesTier` is pack-level only.** §6's `overrides` are `{at, evalSwingCp?, fireOnMate?}`
  (`schemas/drill_pack.schema.json:85-102`, types at `packages/schema/src/drill-pack/types.ts:187-191`)
  — there is no `rulesTier` member, and `guardSettings` returns `rulesTier: base.rulesTier`
  unconditionally (`guard.ts:119`). So row 2's `rulesTier` is read from `pack.guard`, never from the
  resolved override, and the message must not imply otherwise.
- **Absent settings are defaults, not "off".** A pack may be `immediate_guard` with **no `guard`
  block at all** (`GUARD_WITHOUT_IMMEDIATE_GUARD` refuses the converse, not this). `guardSettings`
  then supplies `evalSwingCp: 200`, `fireOnMate: true`, `rulesTier: true` (`guard.ts:94-98`), and the
  check resolves against those. It does not skip.

Message names both remedies literally: *"declared cost <loss> does not reach any guard threshold in
force at this anchor (evalSwingCp <n>, rulesTier <bool> (pack-level), fireOnMate <bool>); add a
`guard.overrides` entry for this move, or reconsider the class."* It never says which, and it says
**"does not reach"**, never "cannot fire" — the rules tier's undefended-piece branch (§4.1) means the
stronger sentence would be false.

**On the G1 case.** `opponent-intent-early-queen` with `cost: {kind: "cp", basis: "engine", loss:
20}` on dev #1 warns against its 150cp guard; with `basis: "material", loss: 100` it also warns,
because 100 < 300. Both readings of the author's own note produce a warning, which
is the correct outcome: **no threshold the pack declares is within reach of the cost it declares**,
and that is a fact about the pack, not about chess.

#### 4.3 `guard.overrides[].moveUci` — the remedy, and why it is needed

`authoring-frictions` §6 gives `overrides` a `$defs/deviationLocation` anchor
(`schemas/drill_pack.schema.json:846-871`, referenced at `:91`, resolution in `guardSettings`), which
is **positional**. Deviations are **moves**. Lowering the threshold at an anchor therefore drags in
every sibling at that anchor. In the pack that motivates this RFC, node `after:w2-qh5` carries
**four** deviations, whose declared candidate losses are 5cp (`accepted_alternative` …d6), 20cp (the
taught `tactical_error` …Nf6), 34cp (`interesting_deviation` …Qe7) and 502cp (`tactical_error` …g6)
(`opponent-intent-early-queen.json` `provenance.engineValidation`, node `after:w2-qh5` — all four
re-verified on `f962a7b`).

**The arithmetic, corrected.** An anchor-scoped override must be set at or below the taught move's
number to reach it — i.e. **20cp or lower**. At 20cp the same override also covers the 34cp
`interesting_deviation` …Qe7, a move this pack does not call a mistake at all; at 5cp it additionally
covers the `accepted_alternative` …d6. There is **no anchor-scoped threshold that reaches the taught
move and no other**, because the taught move is not the cheapest sibling. That is the structural
argument, and it holds under either unit reading (§4.1): whatever the guard measures, it measures it
identically for all four moves at this anchor, because the anchor is all the override can name.

**Addition (pack 0.21, additive, extends `authoring-frictions` §6, contradicts nothing in it):**

```json
"overrides": [
  { "at": { "spineNodeId": "w2-qh5" }, "moveUci": "g8f6", "evalSwingCp": 50 }
]
```

- `moveUci` is optional and uses `$defs/moveUci` (`schemas/drill_pack.schema.json:165`). Absent, an
  override behaves **exactly** as §6 specifies — the shipped behaviour and every §6 test are
  unchanged.
- **Resolution.** §6's rule stands: deepest matching anchor wins, ties by array order. It gains one
  clause applied *before* array order: **at equal depth, an override whose `moveUci` equals the
  committed learner move outranks one without `moveUci`.** An override with a non-matching `moveUci`
  does not apply at all. The learner move is `triple.learnerMove.moveUci`; `guardSettings` today
  takes only `(pack, run, previous)` (`guard.ts:89-93`), so **it gains the learner move as a
  parameter** — both call sites (`applyRulesGuard` at `:149`, `applyRecordedEngineGuard` at `:209`)
  already hold `triple`.
- **Implementation note, corrected at cross-review and re-verified.** The shipped selector
  (`guard.ts:113`) is
  `if (depth < 0 || (selected !== undefined && depth <= selected.depth)) continue;`. Because the
  comparison is `<=`, an equal-depth override is *skipped*, so "ties by array order" ships as
  first-wins. A move-scoped override must beat an earlier unscoped one at equal depth, which the
  `<=` predicate cannot express: the selector becomes a **rank tuple** `(depth, moveScoped)` compared
  lexicographically. This is a small change, not the "one-line predicate change" an earlier draft
  claimed.
- **Refusals.** `GUARD_OVERRIDE_DUPLICATE` ships today (`pack-validation.ts:564`) keyed on the
  **anchor alone** — the key is `"start" | "fen:"+transposeKey | "spine:"+spineNodeId` (`:560`),
  which is §6's *"two overrides on one anchor"*. **This RFC amends it** to key on the pair
  `(anchor, moveUci ?? "*")`, so a move-scoped and an unscoped override at one anchor are not
  duplicates. Its path stays `/guard/overrides/<i>/at`.
  New: `GUARD_OVERRIDE_MOVE_ILLEGAL` (error) — `moveUci` is not legal at the resolved anchor
  position, reusing the position walk `packages/schema/src/drill-pack/lint.ts` already performs for
  deviations (`ILLEGAL_DEVIATION_MOVE` at `:320`, inside the deviation walk at `:296-329`).
- **Landing note, re-verified on `f962a7b`.** `rfc/archive/authoring-frictions.md` **landed as
  `ffc9817` on 2026-08-15**, and §6's refusals are **on the tree**, not pending: `pack-validation.ts`
  carries `GUARD_WITHOUT_IMMEDIATE_GUARD` (`:549`), `GUARD_WINDOW_EMPTY` (`:556`),
  `GUARD_OVERRIDE_ANCHOR_UNKNOWN` (`:562`), `GUARD_OVERRIDE_DUPLICATE` (`:564`) and
  `GUARD_DISABLES_EVERYTHING` (`:568`), alongside the schema (`:65-105`), the types
  (`packages/schema/src/drill-pack/types.ts:182-192`, whose `overrides` member is exactly
  `{at, evalSwingCp?, fireOnMate?}`) and the runtime (`guardSettings`). `047de02`'s rewrite of
  `pack-validation.ts` moved these lines but changed none of the five. **Every clause above is
  therefore an amendment to shipped code, not a co-landing**, and §6's existing guard tests are the
  regression baseline (Acceptance criterion 6).

### §5. The objective-relativity contract

The rule that makes every check above safe, stated once so no future wave has to re-derive it:

> **A mechanical check on a deviation may consult only (a) other declarations inside the same pack
> document, (b) constants shipped in this repo, and (c) the position tree. It may never consult an
> engine, a tablebase, a corpus, another pack, or any notion of a good move that exists outside this
> pack's objective.**

**Every check this RFC adds, audited against the contract** — this table is the reason the contract is
stated, and it is re-derived check by check for the multi-valued field:

| Check | Consults | Clause | Verdict |
|---|---|---|---|
| `DEVIATION_MISTAKE_ON_ACCEPTED` | `mistake` (set non-emptiness) vs `class`, same entry | (a) | ✅ |
| `DEVIATION_MISTAKE_TACTICAL_REDUNDANT` | `mistake` (set equality with `["tactical"]`) vs `class`, same entry | (a) | ✅ |
| `GUARD_CANNOT_REACH_DEVIATION` | `cost` vs `guard.*`/defaults; `class` or `mistake` **membership**; the literal `300` and `MATERIAL_VALUES` | (a) + (b) | ✅ |
| `GUARD_OVERRIDE_MOVE_ILLEGAL` | move legality at the resolved anchor position | (c) | ✅ |
| `DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE` (§6) | `timingWindowId` vs `mistake` **membership**, same entry | (a) | ✅ |
| `TIMING_WINDOW_UNKNOWN` extension (§6) | `timingWindowId` vs `timingWindows[].id` | (a) | ✅ |
| `EVIDENCE_OVERREACH` pointer extension | a pointer string against a shipped pattern | (b) | ✅ |

**Multi-value adds no new consultation.** Every operand that was a scalar comparison is now a set
predicate — `non-empty`, `equals ["tactical"]`, `includes "tactical"`, `includes "timing"` — over a
value already inside the document. No check reads set *size* as a magnitude, and none orders two sets;
either would be the severity ranking §7 forbids.

**No check in this RFC reads an engine, a tablebase, a corpus or another pack.** `cost` with
`basis: "engine"` is an engine *number*, but it reaches the check only as an authored declaration
already inside the document; the check never obtains it, verifies it, or acts on its truth. That is
the whole of the law-8 argument, and §4.1 states the residual risk it leaves.

Consequences, and they are the whole point:

- The checks above compare *the author's declarations to each other*. The only
  disagreements they can report are **internal**: "you declared X here and Y there." They cannot
  produce the false disagreements G1 refused to act on, because they never see an outside number.
- G1's four cases (Motivation) remain **unreported by validation, permanently, and correctly**. A
  `concept_violation` on a move the engine likes best is not a defect; it is what
  objective-relativity means. `anti-caro-advance` dev #4's own note — *"is not a blunder, but it
  ignores the objective"* — is a correct pack, not a broken one. Under this RFC it can also say
  `mistake: ["timing"]` and `cost: {kind: "cp", basis: "engine", loss: 0}` and remain correct in all
  three fields at once. **That is the fix**: not a resolution of the disagreement, but a format in
  which the disagreement is no longer a contradiction.
- Any future tool that proposes classes or mistake sets from engine numbers must emit a **question to
  an author**, never an edit, and must not be wired into `pack-check`, `sourcing-check` or
  `verify-draft`.

### §6. The timing half — no longer contingent

**This section is the only place a mistake declaration becomes mechanically checkable, and it does so
without touching `:772` — because the thing it checks against is itself authored per pack.**

**Status change since cross-review: `tempo-vocabulary` landed as `ed48978` (pack schema 0.17).** The
earlier draft made this section contingent on that RFC and specified how to drop it whole. The
contingency is discharged: the machinery is on the tree. Verified on `f962a7b` —
top-level `timingWindows` at `schemas/drill_pack.schema.json:55-60`, `$defs/timingWindow` at
`:661-684`, `TEMPO_VERDICTS` (seven values) at `packages/runtime/src/tempo.ts:14-22`, and
`TIMING_WINDOW_UNKNOWN` emitted at two referencing sites, `apps/server/src/pack-validation.ts:318`
(success-condition `timing_window.windowId`) and `:445` (checkpoint `trigger.atWindow.windowId`).
`premature` (*"closed by the learner's own `release` move while unready"*) and `too_slow` are two of
the three tempo mistake classes named in `design/01-training-model.md:142-149`; the third, *luxury
move during a race*, is `over_budget`. A window is an authored, objective-relative object. So:

- `$defs/deviation` gains optional `timingWindowId` (`$ref: "#/$defs/id"`), **valid only when
  `mistake` includes `"timing"`** — membership, not equality, so `["plan","timing"]` on an ordering
  mistake may name the window it violates. That is the multi-value case this section owed a rule for,
  and it is the case §1.3's `anti-sicilian-najdorf-english-attack` #6 is.
- One new refusal: `DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE` (error) — `timingWindowId` present while
  `mistake` is absent or does not include `"timing"`, path `/deviations/<i>/timingWindowId`.
- **No second code is minted for the unknown-id case.** An earlier draft proposed
  `DEVIATION_WINDOW_UNKNOWN`; cross-review found `tempo-vocabulary` §7.1 already defines
  `TIMING_WINDOW_UNKNOWN` as *"an `atWindow.windowId` or a `timing_window.windowId` names no declared
  window. Error, at the referencing path"* (`rfc/archive/tempo-vocabulary.md:992-996`) and it now
  ships at the two sites above. `timingWindowId` is a **third referencing site of the same kind**, so
  **this RFC widens `TIMING_WINDOW_UNKNOWN` to it** rather than adding a synonym. The dropped synonym
  stays dropped. (`PLAN_WINDOW_NEEDS_WINDOW`, which an earlier draft cited as the analogue, is a
  different check entirely — it refuses a `preserve_plan_window` objective that declares *no* windows,
  `pack-validation.ts:277`.)
- The declaration becomes **testable by replay**, which no other axis is: playing the deviation move
  in a run must produce a non-`in_time` verdict for the named window. This RFC does **not** make that
  a validator check (it requires executing a run, which pack validation does not do) — it makes it an
  acceptance test (Acceptance criterion 8) and a future authoring-tool affordance.

**The corpus support is prospective, and that is stated rather than implied.** Re-verified on
`f962a7b`: **no pack in `content/` declares `timingWindows` at all** — `tempo-vocabulary` landed the
grammar and the content pass has not happened. `carlsbad-minority-attack` dev #3 (*"the right break
played at the wrong time"*) remains the obvious first case, and that pack is worked end-to-end in
`rfc/archive/tempo-vocabulary.md` §8.2 (`:1182`) and §8.3 (`:1232`) — but the window it would point at
does not exist yet. So §6 ships a link whose first user is the same authoring pass §8.4 costs, and no
acceptance criterion may assert against committed content here; criterion 8 uses a fixture.

### §7. What is not separable — the honest column

Stated as normative refusals so that no later RFC invents a check here and calls it progress:

| Distinction | Status | Why no machine reaches it |
|---|---|---|
| `concept_violation` vs `interesting_deviation` vs `accepted_alternative` | **author-declared, never validated** | `content-sourcing-foundation.md:772`; already enforced at `check.ts:122` |
| `plan` vs `timing` membership, absent a `timingWindow` | **author-declared, never validated** | A plan is a human abstraction over many move orders (`:772`, same table). "Wrong moment" presupposes a right moment, and nothing in the format states one unless §6's window is authored |
| Whether a declared set is **complete** — that no fourth reading was omitted | **author-declared, never validated, and this is the residual after the ruling** | Multi-value removes the forced choice; it does not make omission visible. An author who writes `["plan"]` where `["plan","timing"]` was true has under-declared, and nothing detects it. §8.3 shows a machine reading the note cannot detect it either — it gets the *set* right on 7 of 36 rows |
| Whether a declared `cost` is **true** | **unchecked in this repo today** | There is no repo command that evaluates a draft pack — `verify-draft` is tablebase-only (`apps/server/src/sourcing/verify-draft.ts:16-17`, `:104`), G1's friction #2 at its **fifth** attestation (`log.md:1663-1671`), and no evidence path for an opening pack (`OBJECTIVE_GRADING_UNSUPPORTED`, `pack-validation.ts:284`). This RFC records the number and refuses to imply it was verified |
| Severity ordering of the five classes, or of two mistake sets | **forbidden** | `line-drill-theory-grading.md:205`; severity is `offObjective` and stays so. A set of three is not "worse" than a set of one |
| Whether a class or a mistake set is "right" given an engine number | **forbidden** | Law 8, both directions: *"the engine may not manufacture the class any more than the LLM may"* (`log.md:1629-1630`) |

The row the ruling **deleted** from this table: *"That the unchosen reading of a both-kinds move was
also true — not represented at all."* It is now represented, structurally, by the set. That was the
single honest cost of the single-valued design and it is gone.

### §8. Migration — the honest answer

**Can the 37 deviation-carrying packs be mechanically remapped? Partly, and the interesting half
cannot — and multi-value made the interesting half harder, not easier.**

#### 8.1 Nothing is invalidated

Both fields are optional and additive; no enum value moves. All 275
deviations in all 37 files stay valid at 0.21, byte-identical, with unchanged digests (§0). No
committed pack, fixture, example or negative fixture contains a `mistake` or `cost` key today
(verified, §0), so the additive claim survives the array shape unchanged. A format
change that silently invalidated the corpus would not be shippable; this one does not.

#### 8.2 `cost` is mechanically back-fillable for 115 of 275 deviations (42%)

G1 wrote `provenance.engineValidation.decisions[].candidates[]` into its 18 opening packs with
`role: "deviation#<index>:<class>"` and a `loss` integer. **Re-derived on `f962a7b`: 115
deviations across those 18 files carry a recoverable loss**, of which **3** are mate sentinels
(|loss| ≥ 20000 — 30036, 30036, 30038, all in `opponent-intent-early-queen`). Unchanged by the corpus
growth, for a reason that matters (§8.2a). The mapping role → `deviations[<index>]` →
`{kind: "cp", basis: "engine", loss}` is a script; the three sentinels map to
`{kind: "mate", against: "learner", basis: "engine"}`. The remaining 160 deviations live in packs with
no G1 pass (endgames, mates, trajectories, the two Scandinavian packs) and stay undeclared, which is
legal.

#### 8.2a The `provenance.engineValidation` convention has already forked — do not build on it

**20** files carry an `engineValidation` block, not 18 (re-counted on `f962a7b`). The two `ae8aab7`
added (`anti-scandinavian-white`, `scandinavian-mainline-black`) use an **incompatible shape**:
`candidates` is a `{san: cp}` **object** with no `role` and no `loss`, and `unit` is *"centipawns
from White's point of view … Candidate-relative: only the moves listed were evaluated"* — an absolute
score, not a candidate-relative loss. Their 20 deviations are therefore **not** mechanically
back-fillable, and no reasonable widening of the script makes them so without inferring which SAN
belongs to which deviation. This is direct evidence for §3.3's refusal to bless the convention: two
waves, two shapes, nothing validating either. The §8.5 script detects the fork **by shape** (is
`candidates` an array?), never by pack name.

#### 8.3 `mistake` cannot be remapped mechanically — re-measured under multi-label, and refused again

The single-valued draft refused this on a keyword classifier that scored **25% precision, 75% recall**
over the 36 `concept_violation` rows, missing the canonical timing case. The owner ruling makes that
measurement the wrong one: a classifier that may emit *multiple* labels has different precision and
recall characteristics, and the honest question is now whether it gets the **set** right. Measured on
`f962a7b` rather than assumed.

**Setup.** Gold labels are the by-hand multi-label reading of all 36 rows from §1.3, lifted directly
(4 rows `{timing}`, 4 rows `{plan, timing}`, 28 rows `{plan}`) — the committed cross-review reading,
not a fresh one, so the measurement cannot be tuned by re-reading. The classifier emits **every**
label whose regex hits:

- `timing` — `time|timing|too early|too late|wrong moment|before|after|one move|tempo|tempi|premature|order` (the same regex the single-valued draft used, unchanged so the two runs are comparable)
- `plan` — `plan|objective|prepar|purpose|this pack exists|rehears|abandon|switch|structure`

**Result.**

| Metric | Value |
|---|---|
| **Exact set match** (the classifier's actual job) | **7 of 36 — 19%** |
| `timing` label: precision / recall | **25% / 75%** (tp 6, fp 18, fn 2) |
| `plan` label: precision / recall | **77% / 31%** (tp 10, fp 3, fn 22) |
| Rows where the classifier emits **no label at all** (unencodable under `minItems: 1`) | **6 of 36** |

**Multi-label made it worse, and it fails in three distinct ways:**

1. **The set metric is brutal because errors compound.** 19% exact match against 25% single-label
   precision: a row is now wrong if *either* label is wrong, and the two regexes are wrong on
   different rows. Permission to emit two labels does not buy accuracy when neither label is accurate.
2. **The canonical miss survives the change.** `anti-caro-advance` dev #4 — *"Castling into the break
   … the centre resolves while your pieces are not ready"* — contains **no** timing keyword, so the
   multi-label classifier emits `{plan}` (the `plan` regex hits on *"objective"*). Under the single
   value it emitted nothing useful; under multi-value it now emits a **confident wrong set**, which is
   worse than silence and is exactly what `design/05-in-run-experience.md:41` costs highest.
3. **6 rows produce an empty set, which the schema forbids.** `minItems: 1` (§2.1) means a script
   cannot even write the classifier's answer for `anti-french-advance-white` #0,
   `anti-scandinavian-white` #5, `conversion-up-a-piece` #7, `opening-principles-black` #7,
   `opening-principles-white` #1 and `opening-principles-white` #2. **`conversion-up-a-piece` #7 is a
   gold both-case** — *"Starting the pawns while the king is half-marched"* — so the classifier emits
   nothing on precisely a row the ruling exists to enable.

**The 18 `timing` false positives are the same failure mode as before**: notes where timing vocabulary
describes a *plan* error (`anti-caro-advance-early-c5` #2 — *"before a single piece is developed"* — is
a development-priority error; `opening-principles-black` #13 — *"one move before the drill's finish
line"* — is a plan error; `anti-scandinavian-white` #1 hits on *"tempo"* while describing an abandoned
plan). The `plan` regex's 77% precision is the only encouraging number in the table and it comes with
31% recall — it fires on a third of the plan rows, so it cannot carry a back-fill either.

**A mechanical remap would get 29 of 36 rows wrong and could not encode 6 of them. It is refused
again, with the new numbers.** The back-fill answer did not move; the argument for it is now stronger,
because the metric that matters under multi-value is harsher than the one that was refused before.

#### 8.4 So: an authoring pass, costed

36 rows in 15 files, plus optional `mistake` on any of the 57 `interesting_deviation` rows the author
wants to sharpen — `najdorf-english-attack-black` dev #3 is the standing example, its note already
saying *"...d5 is a TIMED resource"*. **The work per row changed shape under the ruling, in the
cheaper direction**: it was *read the note and adjudicate between two readings it states together*;
it is now *read the note and tick what it says*. For the 4 both-cases that is a strict reduction — the
author stops making a choice — and for the other 32 it is unchanged. It remains a strict subset of what
G1 did at **10.3 min/pack over 18 packs** (`log.md:1481-1484`). Estimate **≤2 min per affected pack,
~30 minutes for the whole corpus** `[estimate, not measured]` — about **2%** of the 1434 measured
authoring minutes (`design/research/pack-authoring-cost.md:88-101`). This is small enough that it is
not a K10 event and honest enough that it must be stated: **the RFC ships value only after that pass,
and the pass is human judgment.** §7 row 3 states what the pass still cannot guarantee.

#### 8.5 Landing order

(a) schema + types + lint + validation + projection + web, corpus untouched — the corpus stays green
throughout; (b) the mechanical `cost` back-fill over the 18 G1 opening packs, script committed under
`tools/`, diff reviewable per pack, **skipping the two forked packs by shape detection rather than by
name** (§8.2a); (c) the `mistake` authoring pass over 15 files, one commit, no engine involved. Any of
the three may stop without breaking the others.

### §9. `required_theory`, and the sunset rule

`required_theory` has **0 uses in 275 deviations across 37 files** (re-derived on `f962a7b`) — the
only fully unused member of the enum. It is left in place: `design/BACKLOG.md:246`'s row "Sunset rule
for zero-use vocabulary" (proposed by `predicate-wave-3` after it declined to retire zero-use feature
kinds) says the repo has no stated rule for retiring declared-but-unused vocabulary, and minting an
ad-hoc removal here would be the exact behaviour that row objects to. **Flagged, not acted on.** When
the sunset rule exists, this is its cleanest first case: a narrowing with a blast radius of zero,
verified.

### §10. Refusal-code register for this RFC

**Two new codes, one amended, two reused — unchanged in count by the ruling.** Multi-value re-specified
two conditions (§2.3) and one operand (§4.2 rule 3) and **mints no new code**: a set predicate over an
existing field is not a new failure mode. The emitter column is corrected from an earlier draft: there
is **no `apps/server/src/lint.ts`** — the pack linter is `packages/schema/src/drill-pack/lint.ts`, and
it already carries both severities (`AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` is a shipped
`severity: "warning"` at `:93-98`), so the two lint warnings need no new machinery.
`pack-validation.ts`'s `runtimeIssue` helper (`:108`) hard-codes `severity: "error"`; a warning there
is built inline, exactly as `KEY_POINT_PHRASE_IS_JUDGEMENT` already is.

| Code | New? | Severity | Emitter | Condition |
|---|---|---|---|---|
| `DEVIATION_MISTAKE_ON_ACCEPTED` | new | warning | `packages/schema/src/drill-pack/lint.ts` | `mistake` present with `class` `accepted_alternative` / `required_theory`, any set (§2.3) |
| `DEVIATION_MISTAKE_TACTICAL_REDUNDANT` | new | warning | `packages/schema/src/drill-pack/lint.ts` | `mistake` **exactly** `["tactical"]` with `class: "tactical_error"` (§2.3) |
| `GUARD_CANNOT_REACH_DEVIATION` | new | warning | `apps/server/src/pack-validation.ts` | declared cost reaches no guard threshold in force, on a row whose `class` is `tactical_error` or whose `mistake` **includes** `"tactical"` (§4.2) |
| `GUARD_OVERRIDE_MOVE_ILLEGAL` | new | error | `apps/server/src/pack-validation.ts` | override `moveUci` illegal at its anchor (§4.3) |
| `DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE` | new | error | `apps/server/src/pack-validation.ts` | `timingWindowId` present while `mistake` does not include `"timing"` (§6) |
| `GUARD_OVERRIDE_DUPLICATE` | **amended** | error | `apps/server/src/pack-validation.ts:564` | shipped key `anchor` becomes `(anchor, moveUci ?? "*")` (§4.3) |
| `TIMING_WINDOW_UNKNOWN` | reused, widened | error | `apps/server/src/pack-validation.ts:318`, `:445` | gains `/deviations/<i>/timingWindowId` as a **third** referencing path (§6) |
| `EVIDENCE_OVERREACH` | reused, widened | error | `apps/server/src/sourcing/check.ts:122` | pointer set gains `/^\/deviations\/\d+\/mistake(?:\/\d+)?$/` — **element suffix included**, because the field is an array (§3.3) — at the site §3.3's landing-order table selects |

**Collision sweep, re-run on `f962a7b` because the tree moved five times.** The five new names were
checked against (a) every `"UPPER_SNAKE"` string literal in `apps/`, `packages/` and `tools/`
(**296 distinct** after the five landings) and (b) the code vocabulary of every active RFC —
`predicate-wave-3`, `opening-evidence-path`, `branch-set-scale`. **Zero collisions.** Three
near-misses worth naming, so a later reader does not re-mint them:
`validator-integrity`'s `THEORY_DEVIATION_NEEDS_SPINE_ANCHOR` shares the `DEVIATION` stem but not a
name; `tempo-vocabulary`'s now-shipped `TIMING_WINDOW_UNKNOWN` is a semantic duplicate of the
`DEVIATION_WINDOW_UNKNOWN` an earlier draft proposed — which is why §6 widens the existing code
instead; and `pack-orchestrator.ts:151`, `:233` carries a **compile-time** `TIMING_WINDOW_UNKNOWN_REFERENCE`
which is a distinct code at a distinct layer and is not the one §6 widens. `opening-evidence-path.md:1297`
mentions `GUARD_CANNOT_REACH_DEVIATION` by name; that is a citation of this RFC, not a second claim.

Every code above is decidable from the pack document plus shipped constants (§5), audited row by row
in §5's table.

### §11. Documentation the implementer updates

`docs/drill-pack-format.md` (the deviation section: the three axes, the two new fields, **§2.4's
rendering contract**, and the never-validated column of §7) and `docs/drill-client.md` (the
authored-commentary surfaces, since §2.4 changes what `theoryVerdictSentence` prints);
`docs/engine-workers.md` **only if** it documents the guard tiers; `content/` authoring guidance where
deviation classes are explained. No `design/` edit is proposed — the design tier already names timing
as a target mistake class (`01-training-model.md:142-149`) and states the absence invariant
(`05-in-run-experience.md:41`) that §2.4 implements; this RFC implements them, it does not restate
them.

## Deviations from design

1. **`design/01-training-model.md:126-127`** says the Line Drill grades membership —
   `on_line` / `classified_deviation` / `unknown`, *never a score*. `cost` puts an integer next to a
   deviation, which is adjacent to a score and must not become one. The RFC holds the line three
   ways: `cost` is never aggregated, never compared across deviations, never rendered as a verdict,
   and never ordered against another pack's numbers; the only consumer is the arithmetic warning in
   §4.2. If a later surface ranks deviations by `cost`, it violates this RFC and
   `line-drill-theory-grading.md:205`.
2. **`design/04-content-architecture.md:226`** lists *"deviations classified"* as opening-pack
   content without saying along how many axes. This RFC answers that with two, and treats the design
   doc as underspecified rather than contradicted. No design edit is proposed (RFC-0000 agent rule).
3. **`design/05-in-run-experience.md:41`** ("Absence is stated, never simulated") is *implemented*
   rather than deviated from: §2.4.0 derives the multi-value rendering contract from it, and §2.4.1
   discharges it on every surface. Recorded here because the owner ruling names it as the standard
   the multi-value case must meet, so a reviewer should be able to find the link from the design doc
   to the clause without reading the whole specification.

## Acceptance criteria

1. **Schema.** `$id` reads `:0.21`, `DRILL_PACK_SCHEMA_VERSION` is `"0.21"`, and the pinned
   expectations in `packages/schema/src/drill-pack.test.ts:56-62` move with them. **Baseline
   re-verified on `f962a7b`:** all three now **agree at `0.17`** — the schema `$id` is
   `urn:chess-tabiya:schema:drill-pack:0.17`, `DRILL_PACK_SCHEMA_VERSION` is `"0.17"`, and the test
   pins `"0.17"` under a `describe` titled `v0.17`. The 0.21 bump moves all three together from a
   clean baseline. The schema's `mistake.items.enum` is asserted equal to `DEVIATION_MISTAKES` in the
   "binds schema vocabularies to the shared constants" test (`:65-75`), one writer for the vocabulary
   and its canonical order.
2. **Corpus untouched, verified.** `pack-check` is green on all 43 pack files in `content/drafts/`
   (37 of them carrying deviations), all fixtures and all six negative fixtures **before any content
   edit**, and every pack digest is unchanged. A test asserts the digest of
   `content/drafts/anti-caro-advance.json` is byte-stable across the bump.
3. **`mistake` round-trips as a set.** A pack with `class: "concept_violation", mistake: ["timing"]`
   validates; a run that plays that move yields a `theory_verdict` carrying both values through
   `line.ts` → `authored-feedback.ts` → `api.ts`, and `theoryVerdictSentence` renders
   `… as concept_violation (timing).` A second fixture with `mistake: ["plan","timing"]` renders
   `… as concept_violation (plan, timing).` A test asserts the sentence is assembled from the
   authored values only — no generated prose and no connective word.
4. **The multi-value contract holds, and the failure modes are tested rather than described.**
   a. **Order-independence:** `["timing","plan"]` and `["plan","timing"]` render the identical
   sentence, `(plan, timing)`. b. **No truncation:** `["plan","timing","tactical"]` renders all three;
   a test asserts the rendered suffix contains every authored value, expressed as a set comparison so
   it cannot pass by rendering the first. c. **Absence:** a deviation with no `mistake` renders the
   sentence with **no** parenthesis and no placeholder. d. **`[]` is invalid:** a fixture declaring
   `mistake: []` fails schema validation (`minItems: 1`). e. **Duplicates invalid:**
   `["plan","plan"]` fails (`uniqueItems`). f. **The join survives (§2.4.3):** a checkpoint containing
   a deviation with a two-value `mistake` still shows its authored note — the regression test for the
   join key, which must fail if an implementer adds `deviationMistakes` to the `DrillScreen`
   predicate. g. **The `deviation` item is not widened (§2.4.4):** a type-level assertion that the
   `deviation` authored-feedback item has no `mistake` member, so §2.4.5's voice refusal is enforced
   by the compiler.
5. **Both warnings fire, neither refuses, and the redundancy warning is narrow.** Fixtures for
   `DEVIATION_MISTAKE_ON_ACCEPTED` (`class: "accepted_alternative", mistake: ["timing"]`) and
   `DEVIATION_MISTAKE_TACTICAL_REDUNDANT` (`class: "tactical_error", mistake: ["tactical"]`) produce
   warnings while the pack stays loadable. A third fixture — `class: "tactical_error", mistake:
   ["timing","tactical"]` — produces **no** warning, which is the multi-value narrowing (§2.3).
6. **The G1 case warns.** A fixture reproducing `opponent-intent-early-queen` — `guard:
   {evalSwingCp: 150}`, a deviation `class: "tactical_error"` with `cost: {kind: "cp", basis:
   "engine", loss: 20}` — emits `GUARD_CANNOT_REACH_DEVIATION`. The same fixture with `basis:
   "material", loss: 100` also emits it (100 < 300). With `loss: 400, basis: "material"` and
   `rulesTier: true` it does not. With `cost: {kind: "unmeasurable", …}` it does not. A fixture whose
   `class` is `concept_violation` and whose `mistake` is `["timing","tactical"]` **does** emit it
   (rule 3 by membership); one whose `mistake` is `["timing"]` alone does **not**.
7. **The move-scoped override works and is narrow.** A pack with `overrides: [{at: {spineNodeId: X},
   moveUci: M, evalSwingCp: 50}]` and a top-level `150` fires the engine tier on a 60cp swing after
   `M` at `X` and **not** on a 60cp swing after a sibling move at `X`. Every guard test landed by
   `rfc/archive/authoring-frictions.md` §6 in `ffc9817` passes unchanged — including the
   `GUARD_OVERRIDE_DUPLICATE` case, which must now accept a move-scoped and an unscoped override on
   one anchor while still refusing two unscoped ones. A further test asserts that at **equal depth**
   a move-scoped override beats an unscoped one declared **earlier** in the array (the rank-tuple
   change, §4.3), since first-wins is the shipped tie-break.
8. **The refusal set holds, including element pointers.** A `sourcing-check` fixture whose record
   `supports` `/deviations/0/mistake` yields `EVIDENCE_OVERREACH`; **a second fixture supporting
   `/deviations/0/mistake/1` also yields it** (§3.3 — the array-shape case an anchored pattern would
   miss); the existing `/deviations/0/class` case is unchanged; a record supporting
   `/deviations/0/cost` is **not** refused by that rule. The fixtures are built against whichever site
   §3.3's landing-order table selects. (An endgame pack with a committed `*.evidence.json` sidecar —
   e.g. `mate-bishop-knight` — is the reachable fixture base; opening packs still cannot carry a
   ledger, §3.3.)
9. **§6.** A pack whose deviation names a `timingWindowId` that exists validates; an unknown id is
   refused with `TIMING_WINDOW_UNKNOWN` at path `/deviations/<i>/timingWindowId`; a `timingWindowId`
   with `mistake: ["plan"]` is refused with `DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE` while the same
   id with `mistake: ["plan","timing"]` validates (the membership rule); and a replay test shows the
   named window's verdict for a run that plays the deviation move is not `in_time`. **All fixtures,
   no committed content** — no pack declares `timingWindows` yet (§6).
10. **No run-schema and no migration.** `DRILL_RUN_SCHEMA_VERSION` unchanged; the migration register
    unchanged; no stored event gains a field.
11. **Nothing new can grade.** A test asserts no code path maps `class`, `mistake` or `cost` to an
    objective transition, a score, or an ordering — including that **no code compares two `mistake`
    sets or reads `mistake.length` as a magnitude** (§5). `offObjective` remains the only severity
    input (`line-drill-theory-grading.md` §6).

## Open questions

1. **Should `cost` be required when `class: "tactical_error"` in an `immediate_guard` pack?** It
   would have caught the G1 case at authoring time rather than at grounding time — the requirement
   would bind **21 `tactical_error` rows across the 6 authored `immediate_guard` packs**
   (`conversion-up-a-piece` 3, `mate-k-q-technique` 6, `mate-k-r-technique` 3,
   `opening-principles-black` 1, `opening-principles-white` 3, `opponent-intent-early-queen` 5 —
   re-derived on `f962a7b` and unmoved, since neither Scandinavian pack is `immediate_guard`). It is
   refused here because **no repo command evaluates a draft pack** (§7) — requiring a number the repo
   cannot produce is a trap. Revisit the day that command exists; the friction is at its fifth
   attestation.
2. **Does `mistake` including `"plan"` want `planClassId`?** The ledger row at
   `design/BACKLOG.md:173` ("Deviations have no link to a plan class") is the natural companion: a
   plan error would name the plan it contradicts, grounding the declaration in an authored object
   instead of prose. Deliberately not shipped (§1.4). Whoever picks up that row should treat
   `mistake` ∋ `plan` as its consumer. **Multi-value sharpens this**: an ordering mistake declaring
   `["plan","timing"]` could name a plan *and* a window, which is the first case where axis B points
   at two authored objects at once.
3. **Who owns `provenance.engineValidation`?** §8 reads it once as a migration source and this RFC
   standardizes nothing. It remains *"honest storage, not grounding"* (`log.md:1613-1618`) until the
   evidence-path RFC (0.20) decides its fate. If that RFC gives opening packs a real ledger, `cost`
   should become evidence-supported rather than declared, and §3.3's deliberate non-refusal of
   `/deviations/\d+/cost` is the seam it plugs into. **§8.2a sharpens the urgency:** the convention
   has already forked into two incompatible shapes across two waves, and each new wave that invents a
   third makes the eventual admission contract harder to write.
4. **Deferred to the sunset rule:** retiring `required_theory` (§9), and whether `class:
   "tactical_error"` should eventually be expressed as `mistake` ∋ `tactical` on a class that carries
   only objective relation — which would finish the decomposition by removing the last measurable
   claim from axis A. **Multi-value makes the second one materially cheaper**, since a row absorbing
   `tactical_error` into the set can keep whatever else it already declares. Both are narrowings and
   neither is this RFC's to take.
5. **Not this RFC's, but adjacent and unowned by anyone here:** §5's contract makes every *validation*
   check safe, but `sourcing-check`'s refusal set is a separate surface, and
   `/deviations/\d+/offObjective` sits in `content-sourcing-foundation.md:773`'s human-only column
   with no refusal today. §3.3 declines to take it because `opening-evidence-path` §5b already owns
   it. **If that RFC is withdrawn or descoped, this hole becomes ownerless** and should return here or
   to a ledger row rather than be silently inherited. The same §5b needs the **element-suffix
   correction** §3.3 records, whichever RFC lands second.

### Closed questions

- **"Should `order` be a fourth `mistake` value, or should `mistake` be an array?" — CLOSED by the
  owner ruling of 2026-08-15 (`d4f2fc5`), and removed rather than left standing.** The answer is
  neither of the two the question offered and both of its intents: `mistake` is a **set**, so an
  ordering mistake is `["plan","timing"]` — no fourth value is minted, and the "array" option is
  taken in the form of a `uniqueItems` set rather than an ordered list. The question asked what
  evidence would settle it ("whether an author, writing the §8 pass, wants to say both") and noted
  that the corpus growth had not added a fifth both-case, calling four "weak evidence" for a
  steady-state size. **That entire line of reasoning is void and is deleted from §1.3 and §2.2, not
  merely superseded**: the design no longer depends on the count, now or later, so a fifth both-case
  would confirm nothing and its absence refutes nothing. What the ruling obliged in exchange —
  a stated rule per rendering surface — is discharged in §2.4.

## Changelog

- 2026-08-15: created.
- 2026-08-15: adversarial cross-review against `ffc9817`. Corpus census re-derived after `ae8aab7`
  (35 files / 255 deviations → 37 / 275; `concept_violation` 31 in 13 files → 36 in 15; §1.3 split
  4 / 4 / 23 → 4 / 4 / 28, with all eight non-plan rows now named; §8's keyword matrix re-run,
  precision 27% → 25%; `cost` back-fill 115 of 255 → 115 of 275). §4.3's landing note **inverted** —
  `authoring-frictions` landed as `ffc9817` and its five §6 refusals are on the tree, so every
  §4.3 clause is an amendment to shipped code; `GUARD_OVERRIDE_DUPLICATE` added to §10 as amended.
  §4.3's override arithmetic corrected (a 50cp override reaches neither the 20cp taught move nor any
  sibling the pack calls acceptable; the real collateral is the 34cp `interesting_deviation`).
  §4.1/§4.2 no longer claim a sub-threshold cost proves the guard silent — the rules tier's
  undefended-piece branch and `rulesTier`'s pack-level scope are both stated. §6's tempo citations
  fixed (six verdicts → seven; `PLAN_WINDOW_NEEDS_WINDOW` → the correct analogue) and
  `DEVIATION_WINDOW_UNKNOWN` dropped in favour of widening `TIMING_WINDOW_UNKNOWN`. §10's emitter
  corrected: `apps/server/src/lint.ts` does not exist. §3.3 gained the `HUMAN_ONLY_POINTERS`
  landing-order table. Acceptance criterion 1's in-flight note retired — all three version pins now
  agree at 0.16. Archived-RFC paths and §2.2's "dissolves" overclaim fixed. Refusal-code collision
  sweep re-run independently: zero collisions.
- 2026-08-15: **owner ruling `d4f2fc5` implemented in the body.** `mistake` is a set:
  §2.1 becomes `type: "array"`, `minItems: 1`, `uniqueItems: true` over the three-value enum, with
  `additionalProperties: false` preserved and `maxItems` deliberately omitted. **§2.4 rewritten as
  the multi-value rendering contract** — a stated rule plus eight enumerated surfaces (S1
  `theoryVerdictSentence`, S2 the `DrillScreen` join, S3 the sheets, S4 the voice packet, S5 compare
  strips, S6 progress, S7 validator messages, S8 the pointer refusal); "pick the first" prohibited by
  name; the `deviation` authored-feedback item **deliberately not widened**, which enforces the voice
  refusal structurally and replaces the earlier draft's `mistake` / `deviationMistake` name split.
  §1.3 and §2.2 rewritten: the 4-of-36 count is demoted from evidence to description and the
  decomposition now rests on axis independence and the shipped join/render contracts, so the design
  is indifferent to the both-case count — which discharges the cross-review's thin-evidence concern.
  §2.3's redundancy warning narrowed to `mistake` **exactly** `["tactical"]`; §4.2 rule 3 and §6's
  window link restated as **membership**. §8.3 **re-measured under a multi-label classifier on
  `f962a7b`**: exact set match 7 of 36 (19%), `timing` 25%/75%, `plan` 77%/31%, six rows emitting an
  empty set that `minItems: 1` cannot encode, and the canonical timing case now mislabelled
  confidently rather than missed — the back-fill is refused again, with new numbers. §3.3 corrected
  for the array shape: the `EVIDENCE_OVERREACH` pointer pattern must admit an **element suffix**
  (`…/mistake(?:/\d+)?`), and the correction owed to `opening-evidence-path` §5b is recorded. **§6 is
  no longer contingent** — `tempo-vocabulary` landed as `ed48978`, so its citations move from the
  draft to shipped code, and §6 now states that **no pack declares `timingWindows` yet**, making its
  corpus support prospective. Open question 1 removed and answered under **Closed questions**;
  remaining questions renumbered. Every line citation re-verified against `f962a7b` after five
  landings (`ffc9817`, `047de02`, `ed48978`, `4977ff6`, `8fbab41`) — `$defs/deviation` `:737-756` →
  `:872-891`, guard schema `:59-99` → `:65-105`, types `:139-149` → `:182-192`, plus every
  `guard.ts` / `pack-validation.ts` / `lint.ts` / `authored-feedback.ts` symbol pinned to its current
  line. Corpus re-derived: 43 pack files / 37 with deviations / 275 entries, `concept_violation`
  36 in 15, `cost` back-fill 115 of 275 with 3 mate sentinels, 21 `tactical_error` rows in the 6
  authored `immediate_guard` packs — all unmoved. Collision sweep re-run against 296 shipped literals
  and three active drafts: zero collisions.
