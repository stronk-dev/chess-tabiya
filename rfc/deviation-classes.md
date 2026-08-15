# RFC: Deviation classes — separating the axes the enum collapsed

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/01-training-model.md:144-149` (target mistake classes — *"right plan one
  move too slow; tension released too early or held too long"*), `design/01-training-model.md:128`
  (Line Drill reports `on_line` / `classified_deviation` / `unknown`, **never a score**),
  `design/04-content-architecture.md:226` (*"deviations classified"* as an opening pack's content)
- **Exploration gate:** none needed — this is a format defect with three attestations in
  `design/BACKLOG.md` (rows "`concept_violation` does two different jobs …" and "**Deviation class
  carries two incompatible jobs**"), not a GAP row. The third attestation is wave G1
  (`planning/content-era/log.md:1475`, commit `231d326`)
- **Depends on:** `rfc/archive/authoring-frictions.md` §6 (pack schema **0.16**, the guard's four new
  knobs — **landed as `ffc9817`, 2026-08-15**; this RFC builds on them and contradicts none),
  `rfc/archive/content-sourcing-foundation.md` §3.3
  (the objective-relativity ruling at `:772`), `rfc/archive/line-drill-theory-grading.md` §6 (severity
  comes from `offObjective`, never from the class), `rfc/archive/onramp-guard.md` (`immediate_guard`,
  the `guard` block). **Contingent, §6 only:** `rfc/tempo-vocabulary.md` (pack schema 0.17,
  `timingWindows`). **Landing-order coupling, §3.3 only:** `rfc/opening-evidence-path.md` §5b
  (`HUMAN_ONLY_POINTERS`)
- **Parent / amends:** amends `rfc/archive/drill-pack-format.md` (`$defs/deviation`) and
  `rfc/archive/authoring-frictions.md` §6 (`guard.overrides`, and its shipped
  `GUARD_OVERRIDE_DUPLICATE` keying)
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

## Summary

`deviations[].class` (`schemas/drill_pack.schema.json:743-751`) is one enum carrying at least three
independent questions: **how does this move stand to what this pack teaches** (objective-relative,
unmechanizable by ruling), **what kind of mistake is it** (plan / timing / tactical — a pedagogical
choice), and **how bad is it by measurement** (centipawns, mate, or unmeasurable). Because the three
share one field, `concept_violation` means both *"right plan, wrong moment"* and *"wrong plan"*;
`tactical_error` smuggles a measurable claim into an axis that by ruling may never be measured; and
`guard.evalSwingCp` — which describes the same event — never consults the class, so
`opponent-intent-early-queen` declares a 150cp guard over a move it classes `tactical_error` at a
measured cost of **20cp**. This RFC separates the axes with **two optional fields** and **one
optional guard key**, adds **four new refusals and amends two existing ones** — every one of which
consults *only declarations inside the same pack document, shipped constants and the position tree*
(§5 audits them row by row) — and states plainly which distinctions can never be checked at all. **No committed pack
becomes invalid; no committed pack changes bytes.** The remaining value is realized by an opt-in
authoring pass over 36 rows in 15 files, costed in §8.

**Census baseline, restated because an earlier draft got it wrong.** Every corpus number below was
counted on `ffc9817`, **after** `ae8aab7` added `anti-scandinavian-white` and
`scandinavian-mainline-black`: **43 pack files, 37 of them carrying `deviations`, 275 deviation
entries.** The pre-`ae8aab7` figures (35 files / 255 entries and everything derived from them) were
re-derived at cross-review and replaced. Re-derive again before implementing if the corpus has moved.

## Motivation

**Three attestations, one defect.**

1. **The defect sweep (Pack B, 2026-08-12).** One class name covers a timing mistake and a
   plan-coherence mistake. Those are different lessons and want different feedback
   (`design/BACKLOG.md`, row "`concept_violation` does two different jobs …").
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

**The guard defect, sharpened.** The ledger row says the 150cp guard can never fire on
`opponent-intent-early-queen`'s taught move. Re-verified against `ffc9817` at cross-review, it is
worse: **neither tier's threshold is reachable.** The engine tier needs a 150cp swing (`apps/server/src/guard.ts`, `guardSettings` and
`centipawnSwing`); the rules tier fires on a material swing of **3 pawns or more** (`applyRulesGuard`,
the `<= -3` comparison, with `MATERIAL_VALUES` at `packages/runtime/src/objective.ts:17-24` — pawn
`1`, so 3 units *is* 3 pawns) or an undefended major/minor (`hasUndefendedMajorOrMinor`). The move's
own note grounds itself on *material* — "3.Qxe5+ wins a pawn with check", which G1 confirmed
(`log.md:1567-1568`) — and one pawn is not three. **Neither number the pack declares can be met by
either threshold on the move the ledger row is about.**

**Bounded honestly, because cross-review found an earlier draft overreaching here.** The claim is
about *this deviation*, not the whole pack. `opponent-intent-early-queen` declares 12 deviations, and
three of them (#4, #5, #8 — the Scholar's Mate lines) carry mate sentinels in G1's own record, so the
**mate tier reaches those** with `fireOnMate` at its default `true`. The defect is that the pack's
*first* taught move sits in a gap between the thresholds it declares and the cost it measures, with
nothing in the format able to notice. That is narrower than "the pack is unguarded" and it is still
the defect: it is exactly the disagreement §4 makes reportable.

**Scope boundary.** In scope: the shape of `deviations[]`, the guard↔deviation link, and what may
mechanically check what. **Out of scope, with reasons:**

| Out of scope | Why |
|---|---|
| Ranking or scoring the classes | `rfc/archive/line-drill-theory-grading.md:205` already forbids it, and `design/01-training-model.md:128` says the Line Drill verdict is `on_line` / `classified_deviation` / `unknown`, never a score. Severity stays `offObjective` (`schemas/drill_pack.schema.json:752`) |
| Reclassifying anything by engine number | Law 8 and `content-sourcing-foundation.md:772`. G1's refusal is ratified here as a rule, not softened |
| Removing or renaming any enum value | 275 committed deviations use four of the five; `theoryVerdictSentence` (`apps/web/src/lib/theory-presentation.ts:17`) renders the raw value to the learner. A rename is a corpus edit and a UI change for no new expressiveness |
| Retiring `required_theory` (0 uses in 275) | It is a zero-use vocabulary item and belongs to the **sunset rule** the ledger already wants (`design/BACKLOG.md`, row "Sunset rule for zero-use vocabulary"). Flagged in §9, not acted on |
| Linking a deviation to a `planClass` | A separate ledger row ("Deviations have no link to a plan class"). It is the natural companion to `mistake: "plan"` and is named in Open questions, not shipped — every axis is authoring cost (§1.4) |
| An evidence-attachment path for opening packs | The live 🐞 ("Two of three phases have NO evidence-attachment path"), owned by the evidence-path RFC. This RFC states exactly where its new field stops being a declaration and would become evidence, and does not build the path |

## Specification

### §0. Register claims

- **Pack schema version: 0.21 is claimed here.** 0.16 is `authoring-frictions`, 0.17
  `tempo-vocabulary`, 0.18 `predicate-wave-3`, 0.19 was declined by `validator-integrity`, 0.20 is
  `opening-evidence-path`'s. `$id` (`schemas/drill_pack.schema.json:3`, today
  `urn:chess-tabiya:schema:drill-pack:0.16`) and `DRILL_PACK_SCHEMA_VERSION`
  (`packages/schema/src/index.ts:2`, today `"0.16"`) move to `0.21` behind whichever of 0.17–0.20
  land first. **This RFC does not edit `rfc/README.md`;** the claim is stated here and the single
  writer of that register lands the row.
- **Every change is additive.** Two optional keys on `$defs/deviation`, one optional key on
  `guard.overrides[]`, one optional contingent key (§6). No enum value is added, removed or renamed.
  All 37 pack files carrying `deviations` (275 entries), all fixtures and all six negative fixtures
  stay valid unchanged.
- **Locate by symbol, not by line.** `apps/server/src/pack-validation.ts` is being rewritten by
  `rfc/validator-integrity.md` right now (139 insertions / 158 deletions in the working tree at
  cross-review), so every reference to it below names the **code or the function**, not a line.
  `apps/server/src/guard.ts` references likewise name `guardSettings`, `applyRulesGuard`,
  `applyRecordedEngineGuard`, `centipawnSwing`, `decisionTriple` and `hasUndefendedMajorOrMinor`.
- **No digest moves.** Pack digests are content digests over the pack document
  (`packages/schema/src/drill-pack/digest.ts:58-66`); the `$id` is not part of any pack document
  (verified: a pack's top-level keys are `id, version, title, mode, phase, difficulty, start,
  objective, concepts, planClasses, spine, checkpoints, authoredBoundary, opponentPolicy, deviations,
  feedbackPolicy, feedbackClaims, provenance` — `version` is the pack's own content version). A pack
  that adopts none of the new keys is byte-identical after this RFC.
- **No migration is claimed. The migration register is untouched.** Nothing persisted changes shape:
  `deviations[].class` reaches a run only through computed projections
  (`lineMembership` in `packages/runtime/src/line.ts`, `apps/server/src/authored-feedback.ts:156`,
  `:344`), never through a stored event. `feedback.generated` (`generate` in `guard.ts`) records
  `nodeId` and `evidenceRefs` and is unchanged.
- **No run-schema change.** `DRILL_RUN_SCHEMA_VERSION` stays where it is. §4's check runs in
  validation, not at run time; §2's new field rides the existing authored-feedback projection.

### §1. The axes, measured

#### 1.1 What the enum is actually doing

Census of every `deviations[]` entry in `content/` (**37 files, 275 entries**, re-counted on
`ffc9817` at cross-review):

| Class | Uses | Files | `offObjective` | What question does it answer? |
|---|---:|---:|---:|---|
| `required_theory` | 0 | 0 | — | — (unused; §9) |
| `accepted_alternative` | 88 | 31 | 0 | objective relation |
| `interesting_deviation` | 57 | 28 | 1 | objective relation |
| `concept_violation` | 36 | 15 | 14 | objective relation **+ mistake kind (two of them)** |
| `tactical_error` | 94 | 19 | 61 | objective relation **+ a measurable claim** |

The two `offObjective` columns are unchanged from the pre-`ae8aab7` count: both Scandinavian packs
set `offObjective` on nothing, so all 20 of their deviations landed in the class counts only.

Two members are overloaded, and they are overloaded in *different* directions. `concept_violation`
carries a second, unstated, unmechanizable question (which kind of mistake). `tactical_error` carries
a second question that **is** mechanizable (how much does it lose) on an axis that by ruling may
never be mechanized. That asymmetry is the whole defect: no single validator can exist for a field
where one member is checkable and three are forbidden from being checked.

#### 1.2 The decomposition

| Axis | Question | Field | Who decides | What may check it |
|---|---|---|---|---|
| **A. Objective relation** | how does this move stand to what *this pack* teaches? | `class` (existing, unchanged) + `offObjective` (existing) | author | **nothing, ever** — `:772`, law 8, `check.ts:122` |
| **B. Mistake kind** | which lesson does the feedback teach? | `mistake` — **new, optional** (§2) | author | co-occurrence with `class` only; §6 adds one real check when a `timingWindow` exists |
| **C. Measured cost** | how much does it lose, by what instrument? | `cost` — **new, optional** (§3) | measurement | shape; and arithmetic against the guard the same pack declares (§4) |
| **D. What is taught** | why does it matter? | `note` (existing) | author | nothing — already `PROSE_POINTERS` (`check.ts:30-36`) |

D already exists and is already correctly fenced. A already exists and is already correctly fenced.
**The RFC adds B and C, and nothing else.**

#### 1.3 Why not split the enum instead

Splitting `concept_violation` into `plan_violation` + `timing_error` was the ledger's first
suggestion ("Split the class, or add a dimension"). It is rejected on evidence:

- **It forces a false choice.** Reading all **36** `concept_violation` notes at cross-review: **4**
  are pure timing, **4** are ordering mistakes that are timing **and** plan at once, and **28** are
  plan coherence. The eight non-plan rows are named in full so the bet is auditable rather than
  asserted:

| Bucket | Rows |
|---|---|
| pure timing (4) | `anti-caro-advance` #4 (*"the centre resolves while your pieces are not ready"*); `carlsbad-minority-attack` #3 (*"the right break played at the wrong time"*); `french-advance-black` #3 (*"The lever is real; this timing donates it"*); `french-advance-black` #5 (*"releases the tension exactly when it was cheapest for White to live with"*) |
| timing **and** plan (4) | `anti-sicilian-najdorf-english-attack` #6 (*"8.Qd2 plays the queen before f3 — the order this pack exists to argue against"*); `carlsbad-minority-attack` #4 (*"switching plans … costs you the tempi you already spent"*); `conversion-up-a-piece` #6 (*"Pawns before the king"*); `conversion-up-a-piece` #7 (*"Starting the pawns while the king is half-marched"*) |

  The five rows `ae8aab7` added (`anti-scandinavian-white` #1/#5/#6/#8, `scandinavian-mainline-black`
  #3) all read as plan coherence, which is why the two non-plan buckets did not move and the plan
  bucket went 23 → 28. **`anti-scandinavian-white` #8 is the closest call** — *"having already played
  h3 spends the tempo twice … If you are not going to follow h3 with g4, h3 was not the move"* — and
  is counted plan because it names an abandoned plan, not a mistimed one. Reading it the other way
  makes the split 4 / 5 / 27 and changes no conclusion.

  A two-value split makes **4 of 36** unauthorable-without-lying. An optional orthogonal field lets
  the author say which lesson the pack teaches; **the other reading survives only in the `note`, and
  in all four both-cases it demonstrably does** — every one of the four notes above states the plan
  claim and the order claim in the same sentence. The format does not preserve the second reading
  structurally, and §7 says so.
- **It is a corpus edit and a learner-visible change.** 36 rows become invalid on the day it lands,
  and `theoryVerdictSentence` (`apps/web/src/lib/theory-presentation.ts:17`) prints the class
  verbatim to the learner.
- **It does not touch the second overload.** `tactical_error`'s measurable claim is untouched by any
  split of `concept_violation`, and that is where three of G1's four disagreements live.

#### 1.4 The conservatism budget

`design/research/pack-authoring-cost.md:105` measures **encoding at 43.6% of 1434 authoring
minutes** — the largest category — and `:256-261` finds encoding-dominant here means *prose*
dominant, not format fights. So the cost of a new field is not schema friction, it is *decisions per
deviation*. This RFC therefore spends its budget as follows and refuses the rest:

- both new fields are **optional**; a pack that declares neither is unchanged and unwarned;
- `mistake` has **three** values, not four and not an array (§2.3 states the refused fourth);
- `cost` is authored **where a number already exists** — 115 of the 275 committed deviations already
  carry one (§8);
- the guard check fires only in `immediate_guard` packs, of which there are **7** (6 authored plus
  `immediate-guard.browser.json`, which declares no deviations at all — verified at cross-review), so
  **31 of the 37 deviation-carrying packs can never see it**;
- `planClassId`, a per-deviation evidence ledger, and any severity ranking are **not** shipped.

### §2. `deviations[].mistake` — axis B

#### 2.1 Schema (pack 0.21, additive)

`$defs/deviation` (`schemas/drill_pack.schema.json:737-756`) gains:

```json
"mistake": { "enum": ["plan", "timing", "tactical"] }
```

`$defs/deviation` keeps `additionalProperties: false`; `required` stays `["at", "moveUci", "class"]`.

**Type** (`packages/schema/src/drill-pack/types.ts`, beside `Deviation`):

```ts
export const DEVIATION_MISTAKES = ["plan", "timing", "tactical"] as const;
export type DeviationMistake = (typeof DEVIATION_MISTAKES)[number];
// Deviation gains: readonly mistake?: DeviationMistake;
```

#### 2.2 Semantics — and what the definition does and does not do

`mistake` declares **the lesson this pack teaches about this move**, not an exhaustive truth about
the move. That single sentence is the normative content, and it is what makes a single-valued enum
honest for the 4 ordering cases: a move may be both a plan error and a timing error, and the pack
still teaches one thing.

**Stated without flattery: this relocates the ambiguity, it does not dissolve it.** For the four
both-cases the field is well-defined as a *decision procedure* — the author picks the lesson the pack
is built to teach — but it is not well-defined as a *fact*. Two authors could pick differently for
`conversion-up-a-piece` #6 and neither would be wrong, and **nothing in this RFC lets a reviewer
adjudicate between them** (§7, row 3). That is a deliberate trade: the alternative shapes were a
two-value class split, which forces 4 of 36 rows to assert something false, and a multi-valued
`mistake`, refused in §2.3 and re-opened as Open question 1. Relocating a choice from *the format
lies* to *the author decides, visibly, in one field* is the improvement being claimed here — no more
than that.

| Value | Means | Corpus exemplar |
|---|---|---|
| `plan` | the move contradicts, abandons or never had the plan the pack committed to | `trajectory-qgd-exchange-minority.json` dev #0: *"4.c5 closes the queenside … off everything this trajectory exists to rehearse"* |
| `timing` | the plan is right and the moment is wrong — too early, too late, or out of order | `carlsbad-minority-attack.json` dev #3: *"the right break played at the wrong time"* |
| `tactical` | the move loses material or allows a concrete refutation | `opponent-intent-early-queen.json` dev #4: 3…Nf6, forced mate |

**Absence means undeclared, not "no mistake."** There is no `none` value: `class:
accepted_alternative` already says the move is not a mistake, and a fourth value would be a second
place to say the same thing.

#### 2.3 Two refusals, both cheap

| Code | Severity | Condition |
|---|---|---|
| `DEVIATION_MISTAKE_ON_ACCEPTED` | **warning** (lint) | `mistake` present with `class` `accepted_alternative` or `required_theory`. The pack is saying "this is fine" and "this is a mistake" in two fields. A warning, not an error: an author may deliberately mean *"sound, but a beat late"*, and the format should surface the tension rather than adjudicate it |
| `DEVIATION_MISTAKE_TACTICAL_REDUNDANT` | **warning** (lint) | `mistake: "tactical"` with `class: "tactical_error"`. States the same thing twice. Not an error, because §9's sunset path needs the redundant form to be legal while it exists |

No other check exists on this field. It is author-declared and, except for §6's contingent window
link, **permanently unvalidatable** (§7).

#### 2.4 Delivery — the reason the field exists

The field must reach the learner or it is decoration.

- `apps/server/src/authored-feedback.ts:37-45`: the `deviation` item type gains `readonly mistake?:
  DeviationMistake`, projected at `:156` beside `deviationClass` under the same
  `...(x === undefined ? {} : …)` idiom used for `offObjective` at `:157-159`.
- `apps/server/src/authored-feedback.ts:63`, `:344`: the `theory_verdict` item and its projection gain
  `readonly deviationMistake?: string` — **note the name differs by item type**: the `deviation` item
  carries `mistake` (it mirrors the pack key), the `theory_verdict` item carries `deviationMistake`
  (it mirrors the existing `deviationClass`). Carried from `lineMembership`'s
  `verdict === "classified_deviation"` branch in `packages/runtime/src/line.ts` alongside
  `deviationClass`; `LineMembershipEntry` (`line.ts:15-23`) gains `readonly deviationMistake?: string`.
- `apps/web/src/lib/api.ts:155-156`, `:174`: the wire types widen identically.
- `apps/web/src/lib/theory-presentation.ts:17` becomes, and this is the entire rendering change:

  ```ts
  return item.deviationMistake === undefined
    ? `Ply ${item.anchor.ply}, ${san}: the pack classifies this as ${item.deviationClass}.`
    : `Ply ${item.anchor.ply}, ${san}: the pack classifies this as ${item.deviationClass} (${item.deviationMistake}).`;
  ```

  The value is printed verbatim, exactly as the class already is. **No sentence is generated from the
  value** — that would be manufactured prose about a position (law 8). The author's `note` remains the
  only explanation.
- `apps/web/src/lib/DrillScreen.svelte:211-219` groups comparison rows by `deviationClass`; it is
  unchanged. Grouping by mistake is a surface decision with no attestation and no ledger row.

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
  repo's own units (`MATERIAL_VALUES`, `objective.ts:17-24`, ×100). The two bases are **never
  converted into one another** — that conversion is exactly the manufactured judgment the product
  refuses, and G1 produced the case that proves they differ: `opponent-intent-early-queen` dev #1 is
  100cp by material (a pawn, with check, confirmed) and 20cp by engine (`log.md:1565-1568`).
- **`mate`** — the consequence is forced mate. `against: "learner"` is the guard-relevant case; it
  replaces the 30036-style sentinels G1 had to write into `provenance.engineValidation` (3 such
  candidates in `opponent-intent-early-queen` alone) to express mate on a centipawn scale.
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
  `OBJECTIVE_GRADING_UNSUPPORTED` on any non-outcome objective; the live 🐞 in `design/BACKLOG.md`,
  row "Two of three phases have NO evidence-attachment path"), so a certified form is unavailable
  regardless of what this RFC says.
- `sourcing-check` (`apps/server/src/sourcing/check.ts:122`) keeps refusing
  `/deviations/\d+/class` verbatim, and **this RFC adds `/deviations/\d+/mistake` to that same
  refusal**: the mistake axis is a pedagogical choice and no record may claim to support it.

  **Landing-order coupling — verified against `rfc/opening-evidence-path.md` §5b, which owns the same
  line of code.** That RFC (pack 0.20) replaces `check.ts:122`'s inline `/^\/deviations\/\d+\/class$/`
  test with a `HUMAN_ONLY_POINTERS` list containing
  `/^\/deviations\/\d+\/(class|offObjective)$/`, refused with `EVIDENCE_OVERREACH` for **every**
  record kind including templated ones. The two RFCs do not contradict each other — both widen the
  same refusal in the same direction — but the *edit site* depends on order:

  | Order | Where `mistake` goes |
  |---|---|
  | 0.20 lands first (expected: it is the lower lane) | add `mistake` to the `HUMAN_ONLY_POINTERS` alternation → `/^\/deviations\/\d+\/(class\|mistake\|offObjective)$/`. One character group; no new code |
  | this RFC lands first | extend the inline pattern to `/^\/deviations\/\d+\/(class\|mistake)$/`; `opening-evidence-path` §5b then folds it into `HUMAN_ONLY_POINTERS` when it lands |

  **`offObjective` is not this RFC's to refuse.** `content-sourcing-foundation.md:773` names it
  human-only for the *"same reason"* as `class` and it is unrefused today — but that hole is already
  attested and owned by `opening-evidence-path` §5b, which also shows it is not cosmetic (it drives
  the `theory-deviation-{i}` degradation rules). Duplicating the fix here would be a second writer on
  one list.
- `/deviations/\d+/cost` is deliberately **not** added to the refusal set — under either landing
  order, it goes into neither the inline pattern nor `HUMAN_ONLY_POINTERS`. It is the first and only
  field on a deviation that a measurement could legitimately support. The admission contract for it
  — which record kinds, which values, which byte-exactness rule — belongs to the evidence-path RFC
  (register lane 0.20) and is **not written here**. Until that lands, an evidence record pointing at
  `cost` is unreachable because the ledger is unreachable. This is the seam Open question 4 names.
- `provenance.engineValidation`, the convention G1 invented (`log.md:1613-1618`), is **not**
  standardized, blessed or read by anything in this RFC. §8 uses it as a one-time migration source
  and nothing more — and §8 shows the convention has **already forked** in the tree, which is a
  reason to read it once and never depend on it.

### §4. The guard link

`guard.evalSwingCp` and `deviations[].class` describe the same event and never consult each other
(`design/BACKLOG.md`, row "`guard.evalSwingCp` is unlinked from deviation classes"). They now
consult each other in exactly one direction: **validation compares two numbers the same author wrote,
and reports when they cannot meet.** No runtime behaviour changes.

#### 4.1 What the guard actually measures, and why the check is a warning

This is the subtlety that decides the severity. The engine tier compares the eval **before the
learner's move** with the eval **after the opponent's reply** — `centipawnSwing` over the decision
triple built by `decisionTriple` (`guard.ts`). A `cost` of kind `cp` is
candidate-relative **at the learner's decision position** — the unit G1 recorded and defined
(*"loss = the best evaluated candidate at that position minus this move"*,
`opponent-intent-early-queen.json` `provenance.engineValidation.unit`). The two coincide only when
the opponent replies with the engine's best move and search is consistent across the two positions.

Therefore the comparison is **weaker than a necessary condition, and this RFC does not claim
otherwise.** Three independent reasons a declared sub-threshold cost does *not* prove the guard is
silent, each verified in `guard.ts`:

1. **The swing is not the loss.** A larger swing may still arrive through the opponent's reply, as
   above.
2. **The rules tier has a second branch that ignores material entirely.** `applyRulesGuard` fires on
   `hasUndefendedMajorOrMinor(triple.consequence.fen, learner)` regardless of any balance change, so
   a move declaring `{basis: "material", loss: 0}` can still trip the guard. Any phrasing that a
   sub-300 material cost *proves* the rules tier cannot fire would be false, and the message in §4.2
   is worded to avoid it.
3. **`rulesTier` is not per-anchor.** See §4.2 note.

So the check reports **an arithmetic gap between two of the author's own declarations**, not a proof
of silence. That is precisely a **warning**, and specifying it as a refusal would be the format
overstating what it knows. It is worth naming that this is also the RFC's closest approach to law 8:
the check is safe only because both operands are authored declarations inside one pack document
(§5), it never grades, and it never names a remedy.

#### 4.2 `GUARD_CANNOT_REACH_DEVIATION` (warning)

Emitted by `pack-validation.ts` beside `GUARD_WITHOUT_IMMEDIATE_GUARD`, path
`/deviations/<index>/cost`, when **all** hold:

1. `feedbackPolicy === "immediate_guard"`;
2. the deviation declares `cost`;
3. the deviation is a claimed mistake of the measurable kind — `class === "tactical_error"` **or**
   `mistake === "tactical"`;
4. no tier's *threshold* can be met by the declared cost, resolving guard settings at the deviation's
   anchor by `authoring-frictions` §6's shipped resolution (`guardSettings` in `guard.ts`: deepest
   matching anchor wins, ties by array order — the shipped predicate keeps the **first** override at
   equal depth):

| Declared `cost` | Threshold met iff |
|---|---|
| `{kind: "cp", basis: "engine", loss}` | `evalSwingCp !== null && loss >= evalSwingCp` |
| `{kind: "cp", basis: "material", loss}` | `rulesTier === true && loss >= 300` (the shipped 3-pawn rule: `applyRulesGuard`'s `<= -3` against `MATERIAL_VALUES`, pawn `1`) |
| `{kind: "mate", against: "learner"}` | `fireOnMate === true` |
| `{kind: "mate", against: "opponent"}` | never — the guard fires on mate **against the learner** (`mateAgainstLearner`, consumed in `applyRecordedEngineGuard`); a missed mate is not a guard event. Not a warning either: rule 3 will rarely hold with it |
| `{kind: "unmeasurable"}` | **not evaluated** — no number, no arithmetic, no warning |

**Two resolution facts the implementer must not assume away, both verified in `guardSettings`:**

- **`rulesTier` is pack-level only.** §6's `overrides` are `{at, evalSwingCp?, fireOnMate?}` — there
  is no `rulesTier` member, and `guardSettings` returns `rulesTier: base.rulesTier` unconditionally.
  So row 2's `rulesTier` is read from `pack.guard`, never from the resolved override, and the message
  must not imply otherwise.
- **Absent settings are defaults, not "off".** A pack may be `immediate_guard` with **no `guard`
  block at all** (`GUARD_WITHOUT_IMMEDIATE_GUARD` refuses the converse, not this). `guardSettings`
  then supplies `evalSwingCp: 200`, `fireOnMate: true`, `rulesTier: true`, and the check resolves
  against those. It does not skip.

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
(`schemas/drill_pack.schema.json:79-96`, resolution in `guardSettings`), which is **positional**.
Deviations are **moves**. Lowering the threshold at an anchor therefore drags in every sibling at
that anchor. In the pack that motivates this RFC, node `after:w2-qh5` carries **four** deviations,
whose declared candidate losses are 5cp (`accepted_alternative` …d6), 20cp (the taught
`tactical_error` …Nf6), 34cp (`interesting_deviation` …Qe7) and 502cp (`tactical_error` …g6)
(`opponent-intent-early-queen.json` `provenance.engineValidation`, node `after:w2-qh5` — all four
verified at cross-review).

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

- `moveUci` is optional and uses `$defs/moveUci`. Absent, an override behaves **exactly** as §6
  specifies — the shipped behaviour and every §6 test are unchanged.
- **Resolution.** §6's rule stands: deepest matching anchor wins, ties by array order. It gains one
  clause applied *before* array order: **at equal depth, an override whose `moveUci` equals the
  committed learner move outranks one without `moveUci`.** An override with a non-matching `moveUci`
  does not apply at all. The learner move is `triple.learnerMove.moveUci`; `guardSettings` today
  takes only `(pack, run, previous)`, so **it gains the learner move as a parameter** — both call
  sites (`applyRulesGuard`, `applyRecordedEngineGuard`) already hold `triple`.
- **Implementation note, corrected at cross-review.** The shipped selector is
  `if (depth < 0 || (selected !== undefined && depth <= selected.depth)) continue;`. Because the
  comparison is `<=`, an equal-depth override is *skipped*, so "ties by array order" ships as
  first-wins. A move-scoped override must beat an earlier unscoped one at equal depth, which the
  `<=` predicate cannot express: the selector becomes a **rank tuple** `(depth, moveScoped)` compared
  lexicographically. This is a small change, not the "one-line predicate change" an earlier draft
  claimed.
- **Refusals.** `GUARD_OVERRIDE_DUPLICATE` ships today keyed on the **anchor alone** — the key is
  `"start" | "fen:"+transposeKey | "spine:"+spineNodeId`, which is §6's *"two overrides on one
  anchor"*. **This RFC amends it** to key on the pair `(anchor, moveUci ?? "*")`, so a move-scoped and
  an unscoped override at one anchor are not duplicates. Its path stays `/guard/overrides/<i>/at`.
  New: `GUARD_OVERRIDE_MOVE_ILLEGAL` (error) — `moveUci` is not legal at the resolved anchor
  position, reusing the position walk `packages/schema/src/drill-pack/lint.ts` already performs for
  deviations (`ILLEGAL_DEVIATION_MOVE`, ~`:298-330`).
- **Landing note, re-verified at cross-review and inverted from the earlier draft.**
  `rfc/archive/authoring-frictions.md` **landed as `ffc9817` on 2026-08-15**, and §6's refusals are
  **on the tree**, not pending: `pack-validation.ts` carries `GUARD_WITHOUT_IMMEDIATE_GUARD`,
  `GUARD_WINDOW_EMPTY`, `GUARD_OVERRIDE_ANCHOR_UNKNOWN`, `GUARD_OVERRIDE_DUPLICATE` and
  `GUARD_DISABLES_EVERYTHING`, alongside the schema (`:59-99`), the types
  (`packages/schema/src/drill-pack/types.ts:139-149`, whose `overrides` member is exactly
  `{at, evalSwingCp?, fireOnMate?}`) and the runtime (`guardSettings`). **Every clause above is
  therefore an amendment to shipped code, not a co-landing**, and §6's existing guard tests are the
  regression baseline (Acceptance criterion 6).

### §5. The objective-relativity contract

The rule that makes every check above safe, stated once so no future wave has to re-derive it:

> **A mechanical check on a deviation may consult only (a) other declarations inside the same pack
> document, (b) constants shipped in this repo, and (c) the position tree. It may never consult an
> engine, a tablebase, a corpus, another pack, or any notion of a good move that exists outside this
> pack's objective.**

**Every check this RFC adds, audited against the contract** — this table is the reason the contract is
stated, and cross-review re-derived it check by check:

| Check | Consults | Clause | Verdict |
|---|---|---|---|
| `DEVIATION_MISTAKE_ON_ACCEPTED` | `mistake` vs `class`, same entry | (a) | ✅ |
| `DEVIATION_MISTAKE_TACTICAL_REDUNDANT` | `mistake` vs `class`, same entry | (a) | ✅ |
| `GUARD_CANNOT_REACH_DEVIATION` | `cost` vs `guard.*`/defaults; the literal `300` and `MATERIAL_VALUES` | (a) + (b) | ✅ |
| `GUARD_OVERRIDE_MOVE_ILLEGAL` | move legality at the resolved anchor position | (c) | ✅ |
| `DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE` (§6) | `timingWindowId` vs `mistake`, same entry | (a) | ✅ |
| `TIMING_WINDOW_UNKNOWN` extension (§6) | `timingWindowId` vs `timingWindows[].id` | (a) | ✅ |
| `EVIDENCE_OVERREACH` pointer extension | a pointer string against a shipped pattern | (b) | ✅ |

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
  `mistake: "timing"` and `cost: {kind: "cp", basis: "engine", loss: 0}` and remain correct in all
  three fields at once. **That is the fix**: not a resolution of the disagreement, but a format in
  which the disagreement is no longer a contradiction.
- Any future tool that proposes classes from engine numbers must emit a **question to an author**,
  never an edit, and must not be wired into `pack-check`, `sourcing-check` or `verify-draft`.

### §6. The timing half, if `tempo-vocabulary` lands (contingent)

**This section is the only place a mistake declaration becomes mechanically checkable, and it does so
without touching `:772` — because the thing it checks against is itself authored per pack.**

`rfc/tempo-vocabulary.md` (pack schema 0.17) adds top-level `timingWindows` and computes **seven**
verdicts (its §1.4, `tempo-vocabulary.md:226-239`) including `premature` (*"closed by the learner's
own `release` move while unready"*, `:236`) and `too_slow` (`:234`), which are two of the three tempo
mistake classes named in `design/01-training-model.md:144-149` — the third, *luxury move during a
race*, is `over_budget`. A window is an authored, objective-relative object. So:

- `$defs/deviation` gains optional `timingWindowId` (`$ref: "#/$defs/id"`), **valid only with
  `mistake: "timing"`**.
- One new refusal: `DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE` (error) — `timingWindowId` present
  without `mistake: "timing"`, path `/deviations/<i>/timingWindowId`.
- **No second code is minted for the unknown-id case.** An earlier draft proposed
  `DEVIATION_WINDOW_UNKNOWN`; cross-review found `tempo-vocabulary` §7.1 already defines
  `TIMING_WINDOW_UNKNOWN` as *"an `atWindow.windowId` or a `timing_window.windowId` names no declared
  window. Error, at the referencing path"* (`tempo-vocabulary.md:965-969`). `timingWindowId` is a
  third referencing site of the same kind, so **this RFC widens `TIMING_WINDOW_UNKNOWN` to it** rather
  than adding a synonym. (`PLAN_WINDOW_NEEDS_WINDOW`, which an earlier draft cited as the analogue,
  is a different check entirely — it refuses a `preserve_plan_window` objective that declares *no*
  windows, `tempo-vocabulary.md:869-870`.)
- The declaration becomes **testable by replay**, which no other axis is: playing the deviation move
  in a run must produce a non-`in_time` verdict for the named window. This RFC does **not** make that
  a validator check (it requires executing a run, which pack validation does not do) — it makes it an
  acceptance test (§Acceptance criteria item 8) and a future authoring-tool affordance.
- **Contingency, verified clean at cross-review:** if `tempo-vocabulary` does not land, §6 is dropped
  whole. Nothing outside §6 depends on it — checked by grep, `timingWindowId`, `timingWindows`,
  `TIMING_WINDOW_UNKNOWN` and `DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE` appear **only** in §6, in
  §5's audit table (one row, marked §6), in §10's register (rows marked "§6 only") and in Acceptance
  criterion 8 (titled "§6 only"). §§1–5 and §§7–9 specify no window behaviour, and the `mistake`
  enum's `timing` value is meaningful without a window — §7 row 2 is written for exactly that case.
  Dropping §6 removes: one schema key, one refusal, one register row, one acceptance criterion.

The corpus supports this at exactly one pack today: `carlsbad-minority-attack` dev #3
(*"the right break played at the wrong time"*) is the same event as that pack's `central-break`
window, which `tempo-vocabulary.md:1243` already works through — *"the pack's
`concept_violation` deviation on `11.e4`, 'the right break played at the wrong time'"*, seen from the
other side. That pack is worked end-to-end in `tempo-vocabulary` §8.2 (`:1155`) and §8.3 (`:1205`).

### §7. What is not separable — the honest column

Stated as normative refusals so that no later RFC invents a check here and calls it progress:

| Distinction | Status | Why no machine reaches it |
|---|---|---|
| `concept_violation` vs `interesting_deviation` vs `accepted_alternative` | **author-declared, never validated** | `content-sourcing-foundation.md:772`; already enforced at `check.ts:122` |
| `mistake: "plan"` vs `"timing"`, absent a `timingWindow` | **author-declared, never validated** | A plan is a human abstraction over many move orders (`:772`, same table). "Wrong moment" presupposes a right moment, and nothing in the format states one unless §6's window is authored |
| Which lesson a both-kinds move teaches (the 4 ordering cases, §1.3) | **author-declared, never validated** | It is a choice about the pack, not a fact about the position. §2.2 states plainly that the definition relocates this choice rather than settling it |
| That the *unchosen* reading of a both-kinds move was also true | **not represented at all** | `mistake` is single-valued by §2.3. The second reading survives only in the `note` — verified present in all four cases (§1.3) but not structurally guaranteed. Open question 1 is exactly this |
| Whether a declared `cost` is **true** | **unchecked in this repo today** | There is no repo command that evaluates a draft pack — G1's friction #2 at its **fifth** attestation (`log.md:1663-1671`), and no evidence path for an opening pack (`OBJECTIVE_GRADING_UNSUPPORTED` in `pack-validation.ts`). This RFC records the number and refuses to imply it was verified |
| Severity ordering of the five classes | **forbidden** | `line-drill-theory-grading.md:205`; severity is `offObjective` and stays so |
| Whether a class is "right" given an engine number | **forbidden** | Law 8, both directions: *"the engine may not manufacture the class any more than the LLM may"* (`log.md:1629-1630`) |

### §8. Migration — the honest answer

**Can the 37 deviation-carrying packs be mechanically remapped? Partly, and the interesting half
cannot.**

**1. Nothing is invalidated.** Both fields are optional and additive; no enum value moves. All 275
deviations in all 37 files stay valid at 0.21, byte-identical, with unchanged digests (§0). A format
change that silently invalidated the corpus would not be shippable; this one does not.

**2. `cost` is mechanically back-fillable for 115 of 275 deviations (42%).** G1 wrote
`provenance.engineValidation.decisions[].candidates[]` into its 18 opening packs with
`role: "deviation#<index>:<class>"` and a `loss` integer. Re-counted at cross-review: **115
deviations across those 18 files carry a recoverable loss** — unchanged by the corpus growth, for a
reason that matters (point 2a). The mapping role → `deviations[<index>]` → `{kind: "cp", basis:
"engine", loss}` is a script, and 3 candidates carrying mate sentinels (|loss| ≥ 20000, all in
`opponent-intent-early-queen`) map to `{kind: "mate", against: "learner", basis: "engine"}`. The
remaining 160 deviations live in packs with no G1 pass (endgames, mates, trajectories, the two
Scandinavian packs) and stay undeclared, which is legal.

**2a. The `provenance.engineValidation` convention has already forked — do not build on it.**
**20** files now carry an `engineValidation` block, not 18. The two `ae8aab7` added
(`anti-scandinavian-white`, `scandinavian-mainline-black`) use an **incompatible shape**:
`candidates` is a `{san: cp}` **object** with no `role` and no `loss`, and `unit` is *"centipawns
from White's point of view"* — an absolute score, not a candidate-relative loss. Their 20 deviations
are therefore **not** mechanically back-fillable, and no reasonable widening of the script makes them
so without inferring which SAN belongs to which deviation. This is direct evidence for §3.3's refusal
to bless the convention: two waves, two shapes, nothing validating either.

**3. `mistake` cannot be remapped mechanically, and this was tested rather than assumed.** A keyword
classifier over the `concept_violation` notes (`time|timing|too early|too late|wrong
moment|before|after|one move|tempo|tempi|premature|order`, case-insensitive) was re-run at
cross-review over all **36** rows against a by-hand reading of all 36 (§1.3):

| | hand-read timing/order (8) | hand-read plan (28) |
|---|---:|---:|
| **keyword hit (24)** | 6 | **18** |
| **keyword miss (12)** | **2** | 10 |

Precision **25%**, recall 75%. (Over the pre-`ae8aab7` 31 rows the same classifier scored 6/16 and
2/7 — precision 27%, recall 75%. The five new rows added 2 hits and 3 misses, all plan, so the
conclusion strengthened rather than moved.) The 18 false positives are notes where timing vocabulary
describes a *plan* error (`anti-caro-advance-early-c5` dev #2 — *"before a single piece is
developed"* — is a development-priority error; `opening-principles-black` dev #13 — *"one move before
the drill's finish line"* — is a plan error; `anti-scandinavian-white` dev #1 hits on *"tempo"* while
describing an abandoned plan). Worse, the two false negatives include **the canonical timing case**:
`anti-caro-advance` dev #4, *"Castling into the break … the centre resolves while your pieces are not
ready"* — re-verified against the regex at cross-review, it contains **no** keyword at all. **A
mechanical remap would mislabel 20 of 36 rows and miss the clearest true positive. It is refused.**

**4. So: an authoring pass, costed.** 36 rows in 15 files, plus optional `mistake` on any of the 57
`interesting_deviation` rows the author wants to sharpen — `najdorf-english-attack-black` dev #3 is
the standing example, its note already saying *"...d5 is a TIMED resource"*. The work per row is
*read the note the author already wrote and pick one of three values* — a strict subset of what G1 did
at **10.3 min/pack over 18 packs** (`log.md:1481-1484`). Estimate **≤2 min per affected pack, ~30
minutes for the whole corpus** `[estimate, not measured]` — about **2%** of the 1434 measured
authoring minutes (`pack-authoring-cost.md:88-101`). This is small enough that it is not a K10 event
and honest enough that it must be stated: **the RFC ships value only after that pass, and the pass is
human judgment.**

**5. Landing order.** (a) schema + types + lint + validation + projection + web, corpus untouched —
the corpus stays green throughout; (b) the mechanical `cost` back-fill over the 18 G1 opening packs,
script committed under `tools/`, diff reviewable per pack, **skipping the two Scandinavian packs by
shape detection rather than by name**; (c) the `mistake` authoring pass over 15 files, one commit, no
engine involved. Any of the three may stop without breaking the others.

### §9. `required_theory`, and the sunset rule

`required_theory` has **0 uses in 275 deviations across 37 files** — the only fully unused member of
the enum. It is left in place: `design/BACKLOG.md`'s row "Sunset rule for zero-use vocabulary"
(proposed by `predicate-wave-3` after it declined to retire five zero-use feature kinds) says the
repo has no stated rule for retiring declared-but-unused vocabulary, and minting an ad-hoc removal
here would be the exact behaviour that row objects to. **Flagged, not acted on.** When the sunset
rule exists, this is its cleanest first case: a narrowing with a blast radius of zero, verified.

### §10. Refusal-code register for this RFC

**Two new codes, one amended, two reused.** The emitter column is corrected from an earlier draft:
there is **no `apps/server/src/lint.ts`** — the pack linter is
`packages/schema/src/drill-pack/lint.ts`, and it already carries both severities
(`AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` is a shipped `severity: "warning"`), so the two lint warnings
need no new machinery. `pack-validation.ts`'s `runtimeIssue` helper hard-codes `severity: "error"`;
a warning there is built inline, exactly as `KEY_POINT_PHRASE_IS_JUDGEMENT` already is.

| Code | New? | Severity | Emitter | Condition |
|---|---|---|---|---|
| `DEVIATION_MISTAKE_ON_ACCEPTED` | new | warning | `packages/schema/src/drill-pack/lint.ts` | `mistake` with `class` `accepted_alternative` / `required_theory` (§2.3) |
| `DEVIATION_MISTAKE_TACTICAL_REDUNDANT` | new | warning | `packages/schema/src/drill-pack/lint.ts` | `mistake: "tactical"` with `class: "tactical_error"` (§2.3) |
| `GUARD_CANNOT_REACH_DEVIATION` | new | warning | `apps/server/src/pack-validation.ts` | declared cost reaches no guard threshold in force (§4.2) |
| `GUARD_OVERRIDE_MOVE_ILLEGAL` | new | error | `apps/server/src/pack-validation.ts` | override `moveUci` illegal at its anchor (§4.3) |
| `DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE` | new | error | `apps/server/src/pack-validation.ts` | §6 only |
| `GUARD_OVERRIDE_DUPLICATE` | **amended** | error | `apps/server/src/pack-validation.ts` | shipped key `anchor` becomes `(anchor, moveUci ?? "*")` (§4.3) |
| `TIMING_WINDOW_UNKNOWN` | reused, widened | error | `apps/server/src/pack-validation.ts` | §6 only — gains `/deviations/<i>/timingWindowId` as a third referencing path (`tempo-vocabulary` §7.1) |
| `EVIDENCE_OVERREACH` | reused, widened | error | `apps/server/src/sourcing/check.ts:122` | pointer set gains `/deviations/\d+/mistake`, at the site §3.3's landing-order table selects |

**Collision sweep, run independently at cross-review.** The five new names were checked against
(a) every `"UPPER_SNAKE"` literal in `apps/`, `packages/` and `tools/` (304 distinct) and (b) the
code vocabulary of every active RFC — `tempo-vocabulary`, `predicate-wave-3`, `validator-integrity`,
`opening-evidence-path`, `resistance-spectrum`. **Zero collisions.** Two near-misses worth naming, so
a later reader does not re-mint them: `validator-integrity`'s `THEORY_DEVIATION_NEEDS_SPINE_ANCHOR`
shares the `DEVIATION` stem but not a name, and `tempo-vocabulary`'s `TIMING_WINDOW_UNKNOWN` is a
semantic duplicate of the `DEVIATION_WINDOW_UNKNOWN` an earlier draft proposed — which is why §6 now
widens the existing code instead.

Every code above is decidable from the pack document plus shipped constants (§5), audited row by row
in §5's table.

### §11. Documentation the implementer updates

`docs/drill-pack-format.md` (the deviation section: the three axes, the two new fields, the
never-validated column of §7) and `docs/engine-workers.md` **only if** it documents the guard tiers;
`content/` authoring guidance where deviation classes are explained. No `design/` edit is proposed —
the design tier already names timing as a target mistake class (`01-training-model.md:144-149`) and
this RFC implements that, it does not restate it.

## Deviations from design

1. **`design/01-training-model.md:128`** says the Line Drill reports `on_line` /
   `classified_deviation` / `unknown`, *never a score*. `cost` puts an integer next to a deviation,
   which is adjacent to a score and must not become one. The RFC holds the line three ways: `cost` is
   never aggregated, never compared across deviations, never rendered as a verdict, and never
   ordered against another pack's numbers; the only consumer is the arithmetic warning in §4.2. If a
   later surface ranks deviations by `cost`, it violates this RFC and
   `line-drill-theory-grading.md:205`.
2. **`design/04-content-architecture.md:226`** lists *"deviations classified"* as opening-pack
   content without saying along how many axes. This RFC answers that with two, and treats the design
   doc as underspecified rather than contradicted. No design edit is proposed (RFC-0000 agent rule).

## Acceptance criteria

1. **Schema.** `$id` reads `:0.21`, `DRILL_PACK_SCHEMA_VERSION` is `"0.21"`, and the pinned
   expectations in `packages/schema/src/drill-pack.test.ts:56-62` move with them. **Baseline
   re-verified on `ffc9817` at cross-review:** all three now **agree at `0.16`** — the schema `$id`
   is `urn:chess-tabiya:schema:drill-pack:0.16`, `DRILL_PACK_SCHEMA_VERSION` is `"0.16"`, and the
   test pins `"0.16"` under a `describe` titled `v0.16`. An earlier draft carried a note (against
   `f856709`) saying the test still pinned `0.15`; that was 0.16's mid-landing state and is
   **resolved**. The 0.21 bump moves all three together from a clean baseline.
2. **Corpus untouched, verified.** `pack-check` is green on all 43 pack files (37 of them carrying
   deviations), all fixtures and all six negative fixtures **before any content edit**, and every
   pack digest is unchanged. A test asserts the digest of `content/drafts/anti-caro-advance.json` is
   byte-stable across the bump.
3. **`mistake` round-trips.** A pack with `class: "concept_violation", mistake: "timing"` validates;
   a run that plays that move yields a `theory_verdict` carrying both values through
   `line.ts` → `authored-feedback.ts` → `api.ts`, and `theoryPresentation` renders
   `… as concept_violation (timing).` A test asserts the sentence is assembled from the two authored
   values only — no generated prose.
4. **Both warnings fire and neither refuses.** Fixtures for `DEVIATION_MISTAKE_ON_ACCEPTED` and
   `DEVIATION_MISTAKE_TACTICAL_REDUNDANT` produce warnings while the pack stays loadable.
5. **The G1 case warns.** A fixture reproducing `opponent-intent-early-queen` — `guard:
   {evalSwingCp: 150}`, a deviation `class: "tactical_error"` with `cost: {kind: "cp", basis:
   "engine", loss: 20}` — emits `GUARD_CANNOT_REACH_DEVIATION`. The same fixture with `basis:
   "material", loss: 100` also emits it (100 < 300). With `loss: 400, basis: "material"` and
   `rulesTier: true` it does not. With `cost: {kind: "unmeasurable", …}` it does not.
6. **The move-scoped override works and is narrow.** A pack with `overrides: [{at: {spineNodeId: X},
   moveUci: M, evalSwingCp: 50}]` and a top-level `150` fires the engine tier on a 60cp swing after
   `M` at `X` and **not** on a 60cp swing after a sibling move at `X`. Every guard test landed by
   `rfc/archive/authoring-frictions.md` §6 in `ffc9817` passes unchanged — including the
   `GUARD_OVERRIDE_DUPLICATE` case, which must now accept a move-scoped and an unscoped override on
   one anchor while still refusing two unscoped ones. A further test asserts that at **equal depth**
   a move-scoped override beats an unscoped one declared **earlier** in the array (the rank-tuple
   change, §4.3), since first-wins is the shipped tie-break.
7. **The refusal set holds.** A `sourcing-check` fixture whose record `supports`
   `/deviations/0/mistake` yields `EVIDENCE_OVERREACH`; the existing `/deviations/0/class` case is
   unchanged; a record supporting `/deviations/0/cost` is **not** refused by that rule. The fixture
   is built against whichever site §3.3's landing-order table selects — the inline pattern, or
   `HUMAN_ONLY_POINTERS` if `opening-evidence-path` §5b landed first. (An endgame pack with a
   committed `*.evidence.json` sidecar — e.g. `mate-bishop-knight` — is the reachable fixture base;
   opening packs still cannot carry a ledger, §3.3.)
8. **§6 only.** A pack whose deviation names a `timingWindowId` that exists validates; an unknown id
   is refused with `TIMING_WINDOW_UNKNOWN` at path `/deviations/<i>/timingWindowId`; a
   `timingWindowId` without `mistake: "timing"` is refused with
   `DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE`; and a replay test shows the named window's verdict for
   a run that plays the deviation move is not `in_time`.
9. **No run-schema and no migration.** `DRILL_RUN_SCHEMA_VERSION` unchanged; the migration register
   unchanged; no stored event gains a field.
10. **Nothing new can grade.** A test asserts no code path maps `class`, `mistake` or `cost` to an
    objective transition, a score, or an ordering — `offObjective` remains the only severity input
    (`line-drill-theory-grading.md` §6).

## Open questions

1. **Should `order` be a fourth `mistake` value, or should `mistake` be an array?** Four of the **36**
   `concept_violation` notes are timing **and** plan at once (§1.3, both buckets named in full).
   §2.2 handles this by defining the field as *the lesson taught* — which makes a single value
   honest, but **relocates the choice rather than settling it**, as §2.2 and §7 now both say out
   loud. Four attested cases is not nothing, and a fourth value is cheaper than an array. **Resolve
   before `accepted`;** the evidence needed is whether an author, writing the §8 pass, wants to say
   both. Note the corpus growth did *not* add a fifth both-case, which is weak evidence that four is
   the steady-state size of the problem rather than the leading edge of it.
2. **Should `cost` be required when `class: "tactical_error"` in an `immediate_guard` pack?** It
   would have caught the G1 case at authoring time rather than at grounding time — the requirement
   would bind **21 `tactical_error` rows across the 6 authored `immediate_guard` packs**
   (`conversion-up-a-piece` 3, `mate-k-q-technique` 6, `mate-k-r-technique` 3,
   `opening-principles-black` 1, `opening-principles-white` 3, `opponent-intent-early-queen` 5 —
   re-counted at cross-review and unmoved by the corpus growth, since neither Scandinavian pack is
   `immediate_guard`). It is refused here because **no repo command evaluates a draft pack** (§7) —
   requiring a number the repo cannot produce is a trap. Revisit the day that command exists; the
   friction is at its fifth attestation.
3. **Does `mistake: "plan"` want `planClassId`?** The ledger row "Deviations have no link to a plan
   class" is the natural companion: a plan error would name the plan it contradicts, grounding the
   declaration in an authored object instead of prose. Deliberately not shipped (§1.4). Whoever picks
   up that row should treat `mistake: "plan"` as its consumer.
4. **Who owns `provenance.engineValidation`?** §8 reads it once as a migration source and this RFC
   standardizes nothing. It remains *"honest storage, not grounding"* (`log.md:1613-1618`) until the
   evidence-path RFC (0.20) decides its fate. If that RFC gives opening packs a real ledger, `cost`
   should become evidence-supported rather than declared, and §3.3's deliberate non-refusal of
   `/deviations/\d+/cost` is the seam it plugs into. **§8.2a sharpens the urgency:** the convention
   has already forked into two incompatible shapes across two waves, and each new wave that invents a
   third makes the eventual admission contract harder to write.
5. **Deferred to the sunset rule:** retiring `required_theory` (§9), and whether `class:
   "tactical_error"` should eventually be expressed as `mistake: "tactical"` on a class that carries
   only objective relation — which would finish the decomposition by removing the last measurable
   claim from axis A. Both are narrowings and neither is this RFC's to take.
6. **Not this RFC's, but adjacent and unowned by anyone here:** §5's contract makes every *validation*
   check safe, but `sourcing-check`'s refusal set is a separate surface, and
   `/deviations/\d+/offObjective` sits in `content-sourcing-foundation.md:773`'s human-only column
   with no refusal today. §3.3 declines to take it because `opening-evidence-path` §5b already owns
   it. **If that RFC is withdrawn or descoped, this hole becomes ownerless** and should return here or
   to a ledger row rather than be silently inherited.

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
