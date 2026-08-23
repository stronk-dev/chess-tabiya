# RFC: Pack training forms — the set grain, pass marks, the guided first pass, and tempo cycles

- **Status:** draft — 2026-08-23
- **Author:** claude
- **Created:** 2026-08-23
- **Design refs:** `design/01-training-model.md` §blocked/varied repetition; `design/05-in-run-experience.md` §3 (the assistance ladder) and §3a (the ∩ algebra); `design/03-product-breadth.md` §Library
- **Exploration gate:** [[D1310]] — same mandate as `rfc/return-scheduling.md`; the two owner asks are quoted at that RFC's §0 and are the origin of this lane
- **Depends on:** `rfc/pack-capability-contract.md` (**lane 0.30** — this document claims **0.32** behind it and behind `famous-games`' 0.31); `rfc/intent-presets.md` (the ∩ algebra, **consumed and never re-derived**); the shipped `TimingWindowDefinition` and `TempoVerdict` (`packages/schema/src/drill-pack/types.ts:119-133`)
- **Parent / amends:** amends `DrillPackDefinition` (`types.ts:208-274`); introduces one sibling artefact kind. Answers [[D867]], [[D868]], and the pack-format half of [[D862]]
- **Supersedes / superseded by:** —
- **Planning:** `planning/training-methods/`

```tabiya-claims
pack-schema | lane 0.32 | DrillPackDefinition.assistanceCeilingRamp (new, optional) + $defs/trainingSet (new sibling artefact, own formatVersion 0.1)
```

## Summary

Three famous training methods — Yusupov's scored chapters, the guided first pass,
and the Woodpecker tempo cycle — turn out to want **one missing thing**, and it is
not what any of them looks like from the outside.

**There is no set.** `DrillPackDefinition` is a single position with its
consequences, and nothing in the pack format, the content tree, or the database
groups packs into an ordered collection. Verified three ways at HEAD: no
`packSet` / `collection` / `course` type in the schema, no such table in
`storage.ts`, and `content/` has a flat `packs/` directory. A pass mark is
*"score ≥ X of Y across the chapter"*; a tempo cycle is *"this same set, faster"*.
Both are properties **of a set**, and there is nowhere to put them.

So this RFC introduces the set grain and pays for it once, rather than three
times. The second half is cheaper than expected: the tempo verdict already ships,
and the guided first pass turns out to be expressible **only** as a tightening
ceiling — which the ∩ algebra already enforces and which is the honest shape
anyway.

## §1. The set grain

### 1.1 The measurement

| Claim | Evidence at HEAD |
|---|---|
| the pack format has no collection concept | `types.ts:208-274` — `DrillPackDefinition` has `variantOf` (a **pairwise** relation), `concepts` and `shapes` (**tags**, unordered, no cardinality), and nothing else that groups |
| the database has no collection table | grep for `pack_set` / `courses` / `collection` over `storage.ts` → **0 hits** |
| the content tree is flat | `content/packs/`, with `candidates`, `drafts`, `principles`, `shapes`, `sources`, `witnesses` as siblings — none of them an ordered pack collection |
| a campaign is not the missing set | `rfc/campaign-core.md:125-127` forbids node re-entry after seal, so a campaign structurally **cannot** carry a repeated cycle |

`concepts` is the near-miss worth naming: 50 of 92 packs carry it and it does
group. It cannot serve, because a tag has **no order and no denominator**, and a
pass mark needs both — *"7 of 10"* requires knowing there are ten and which ten.

### 1.2 The artefact

A training set is a **new sibling artefact** with its own `formatVersion`,
starting at **0.1**:

- `id`, `formatVersion`, `title`
- `members`: an **ordered** list of `{ packId, ordinal }`
- `passMark` (optional) — §2
- `tempo` (optional) — §4
- `provenance`, reusing the pack's `provenance` shape unchanged

**A back-reference on the member packs is refused.** The alternative — each pack
carrying `setMembership: { setId, ordinal }` — needs no new artefact and is the
cheaper-looking option. It fails on two grounds already ruled in this register:
the set's pass mark is a property **of the set**, so under a back-reference every
member must repeat it and nothing can refuse a disagreement ([[D523]], grammar
stated once and assumed elsewhere); and `pack-population-provenance` refuses a
copied field on exactly this reasoning — *a copy would be validated against
nothing*. Membership also becomes underivable without scanning all 92 packs.

**Set membership does not change what a pack is.** A member pack is a valid pack
standing alone, opens outside its set, and needs no field added. That is the
property that makes the grain additive.

### 1.3 What this costs, stated plainly

Gate F clause 1 is a **Boolean at threshold zero, not a depth count**
(`planning/exploration/plan.md:48`; the correction `rfc/variants.md` landed). This
document claims a pack lane, so clause 1 stays where `graduation-clearance`,
`pack-population-provenance`, `pack-capability-contract` and `famous-games`
already put it. **Lane depth is not an argument against this RFC and is not used
as one here.**

The real cost is the second artefact kind: validation, digest, lint, and the
publication check all learn a new file shape. **`digestDrillPack` is not
extended** — a set digests separately, so **no pack digest churns** and no ledger
re-stamps. That is the deliberate difference from lane 0.30, whose stamp sits
inside the pack digest and churns all 92.

**Lane contention, recorded:** `rfc/skills.md`'s open question 9 states that its
schema-enforced-membership alternative *"would claim lane 0.32"*. That option is
unruled and this document is drafted, so 0.32 is taken here; if the owner rules
skills toward schema enforcement, **that RFC inherits 0.33** and this claim does
not move.

## §2. Pass-mark sets (Yusupov)

The tradition's scorecard: attempt every exercise in a chapter, score it, and
**advance or repeat the chapter as a whole**. The unit of progression is the
chapter, not the exercise — which is why it needs §1 and why it has never been
expressible here.

`passMark` on the set:

- `require`: a count of members reaching a named objective state
- `of`: `"all"` or an explicit member subset
- `onFail`: `"repeat_set"` — the only value specified

**The verdict is the shipped objective verdict, not a new grade.** A member
"passes" when its attempt resolves `stable` under its own authored objective
(`ObjectiveGrading`, `types.ts:318-323`). This RFC adds **no scoring vocabulary,
no points, and no per-member number**. The set-level count is arithmetic over
verdicts the runtime already computes — which is what keeps it clean under law 8
(§6).

**The threshold is authored and published.** It appears on the set surface before
the learner starts. A hidden threshold is refused by name at
`rfc/skills.md:436-437`.

**`onFail: "repeat_set"` is a re-offer, not an enforcement.** Nothing in this
document locks a learner out of a pack. The set says *this chapter is not
passed*; `/learn` re-offers it.

## §3. The guided first pass

The ask is graduated support: the first pass through unfamiliar material is
guided, later passes are bare.

### 3.1 The mechanism the ∩ algebra dictates

`design/05-in-run-experience.md:230-232`, verbatim:

> **Effective assistance is `requested preset ∩ workflow/session ceiling ∩
> honesty/access ∩ source availability` — every term only narrows.** A workflow
> or session ceiling can only remove assistance, never add it.

**A pack therefore cannot grant assistance, and this is not a limitation to route
around — it is the correct shape.** The guided first pass is expressible in
exactly one form: a **ceiling that tightens with attempt number**. Pass 1 permits
up to the authored rung; by pass 3 the ceiling has descended to rung 0
(rules-derived sight). The learner's own preset intersects as it always does, so
a learner who wants a bare first pass gets one, and **no pack can force help onto
a learner who declined it**.

`assistanceCeilingRamp` on the pack, the one field this document adds to
`DrillPackDefinition`:

- an ordered list of `{ throughAttempt: number, ceilingRung: 0..5 }`
- **rung 6 (LLM rendering) is not a legal value** — ADR-0005; the renderer may
  only word rungs 0–5, so a ceiling *at* 6 would name a source that grants nothing
- absent means no ramp, which is today's behaviour and stays the default for all
  92 packs

`attempts.attempt_no` ships (`storage.ts:4123`), so the ramp needs no new state.

### 3.2 The rung vocabulary is cited, not restated

The rungs are `design/05-in-run-experience.md:63-79`, and this RFC **references
them by number without re-listing them**. Re-listing is the [[D523]] failure —
the register already carries a case where a grammar written twice drifted.

### 3.3 What is NOT decided here

The ADR-0006 fork — whether a guided pass is a distinct *mode* or a preset
ceiling — is **⚠ OWNER** and open question 1. §3.1 specifies the ramp's
**mechanism**, which is identical under either answer because the ∩ algebra
admits only one. **Open question 1 is therefore not acceptance-blocking.**

## §4. Tempo cycles (Woodpecker)

The Woodpecker method: the same set, repeated, **each cycle faster than the last**,
until recognition replaces calculation.

### 4.1 Almost all of this ships

| Piece | State |
|---|---|
| a per-position tempo window | `TimingWindowDefinition` ships — `opens`, `closes`, `readiness`, `luxuryMoveBudget` (`types.ts:119-133`) |
| a tempo **verdict** | `TempoVerdict` ships, reachable as `atWindow: { windowId, verdict }` (`types.ts:135-138`) |
| grading opt-in | `gradeOutpaced` ships, *"authored contexts opt in; absence is deliberately ungraded"* |
| authored users of the window | **4 packs**, all via the `spendAtLeast` arm |
| authored users of the **verdict** arm | **0** |
| a cycle over a set | **nothing** — this is the gap |

So the machinery is a **third** shipped-with-zero-consumers case, exactly as
`design/research/titled-player-training.md:11-19` predicted for the tradition as a
whole. What is missing is the **set-scoped cycle**, and §1 supplies its home.

### 4.2 `tempo` on the set

- `cycles`: an ordered list of `{ ordinal, budgetScale }`, where `budgetScale`
  multiplies each member's authored `luxuryMoveBudget`
- a cycle's members are served in the set's `ordinal` order
- **the last cycle's scale is authored, not extrapolated** — no implicit decay

**Scaling an authored budget is not a chess claim.** The author set the budget;
the cycle scales it by an authored factor. Nothing here invents a time in which a
position "should" be solved.

**The refusal that keeps this honest:** de la Maza's Seven Circles, as popularly
shipped, has trainer consensus against it (`titled-player-training.md:178-191`).
Only the recognition-sized, Woodpecker-corrected form may inform a feature, and
that restriction is **pack-declared, not learner-chosen** — a set whose members
are too few or too varied for recognition simply does not declare `tempo`. There
is no learner-facing "cycle count" knob, which is the specific thing that made the
Seven Circles harmful.

### 4.3 Tempo cycles and the return ladder do not compete

A cycle is **within a set, over hours or days**; the ladder is **per root, over
weeks**. `rfc/return-scheduling.md` schedules roots; a cycle sequences members
inside a set the learner has opened. Criterion 9 asserts a cycle writes no
`schedules` row, so the two cannot silently become one mechanism.

## §5. What this RFC refuses

| Refused | Ground |
|---|---|
| **A per-member score or point total** | The set counts objective verdicts. A score is a number about the learner at a position — refused at `rfc/skills.md:434-435` and §9.2 of `rfc/return-scheduling.md` |
| **A back-reference field on member packs** | §1.2 — [[D523]] and `pack-population-provenance`'s don't-copy refusal |
| **Extending `digestDrillPack` to cover sets** | Would churn all 92 pack digests and re-stamp 68 ledgers for a grain that no pack field references |
| **Ceiling rung 6 in a ramp** | ADR-0005 — the renderer words rungs 0–5 and grants nothing of its own |
| **A pack granting assistance** | The ∩ algebra; every term only narrows (§3.1) |
| **Locking a learner out of a pack on a failed set** | `onFail` re-offers; it does not gate (§2) |
| **A learner-facing cycle-count knob** | §4.2 — the Seven Circles failure mode |
| **Extrapolated cycle budgets** | §4.2 — an unauthored tempo is an invented one |
| **Making a campaign node the set** | `rfc/campaign-core.md:125-127` forbids re-entry after seal (§1.1) |

## §6. Law 8

A training method is pedagogy — a claim about how a person improves, not about a
position — so it is not forbidden by default. The line is crossed **only where the
method needs a move-level judgement to advance its own state**
(`rfc/return-scheduling.md` §9, the full argument; not restated here).

Each mechanic in this document, against that line:

- **Pass mark** — counts authored objective verdicts. No move-level judgement.
- **Assistance ramp** — narrows which *sources* may speak. It makes no claim; it
  removes claimants.
- **Tempo cycle** — scales an authored budget by an authored factor.

All three advance on state the runtime already computes from authored objectives.
**None requires a grade, and criterion 10 is the fixture that says so** rather than
leaving it as prose.

## §7. Deviations from design

**None.** §1's grain is additive, §3 consumes the ∩ algebra unchanged, and §4
consumes the shipped tempo vocabulary unchanged.

## Acceptance criteria

1. **A set validates and a pack does not gain a member field.** A well-formed set
   loads; a test asserts `DrillPackDefinition` has no `setId`/`setMembership` key.
   *Wrong implementation that passes a loose check:* one that accepts an unknown
   key on the pack via the `[key: string]: unknown` index signature — the assertion
   is over the validator's refusal, not the type.
2. **A set with a missing or duplicate member `ordinal` is refused**, with the
   member id in the message.
3. **A set naming an unregistered `packId` is refused at publication**, not at
   read time.
4. **`digestDrillPack` is unchanged.** A test asserts the digest of an unmodified
   member pack is byte-identical before and after its set exists, and that the
   §10-style pack digest census does not move. *Wrong implementation that passes
   criterion 1:* one that folds set membership into the pack digest — this is the
   criterion that catches it.
5. **The pass mark counts verdicts and nothing else.** A set of 10 with
   `require: 7`: a fixture with 7 `stable` passes, one with 6 `stable` and 4
   `unstable` fails, and a fixture where a member is `open` asserts it counts as
   neither.
6. **A failed set re-offers and does not gate.** After a fail, every member pack
   still opens directly.
7. **The ramp only narrows.** A pack declaring `ceilingRung: 5` with a learner
   preset at rung 1 yields **rung 1**. *Wrong implementation that passes a naive
   test:* one that takes the max, or that treats the pack's ceiling as a request —
   the fixture asserts the learner's tighter value wins.
8. **The ramp tightens by attempt number.** `attempt_no` 1 permits the authored
   rung; the attempt after `throughAttempt` permits rung 0. A ramp with
   `ceilingRung: 6` is **refused at validation**.
9. **A tempo cycle writes no schedule.** Completing a cycle asserts zero rows
   added to `schedules`.
10. **Tempo scales an authored budget.** A member with `luxuryMoveBudget: 4` under
    `budgetScale: 0.5` enforces **2**; a set declaring `tempo` whose members
    declare no `timingWindows` is **refused at validation**, naming the members.
11. **No grade is emitted.** The payloads for a set completion, a ramp transition
    and a cycle completion are each asserted to carry no move-level evaluation
    field and no per-member number. *Wrong implementation that passes a prose
    check:* one shipping the count as a field the client happens not to render —
    the assertion is over the payload.
12. **The register joins.** `register-check` is green with this RFC active, and its
    `tabiya-claims` block joins `rfc/README.md` character-for-character. A test
    asserts lane **0.32** is claimed exactly once across the register.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The set artefact, `passMark`, `tempo`, and `assistanceCeilingRamp` | codex | this RFC's implementing commit | |
| D2 | The ADR-0006 fork — mode versus preset ceiling (open question 1) | OWNER | `planning/platform-alignment/decision-queue.md` | |
| D3 | Authored content: the first pass-mark set and the first tempo set. **The format is not the feature** — `titled-player-training.md:11-19` is that this tier ships machinery with no consumers | claude | `planning/content-wave-work-order.md` | |
| D4 | The first authored user of the timing **verdict** arm (0 packs at HEAD) | claude | `planning/content-wave-work-order.md` | |
| D5 | Set membership as a declared capability under `rfc/pack-capability-contract.md` | claude | that RFC's capability census | |
| D6 | The scheduler half — ladder repair, step-down, difficult roots, `variant` | claude | `rfc/return-scheduling.md` | |
| D7 | If `rfc/skills.md` open question 9 is ruled toward schema enforcement, that RFC takes lane **0.33** | claude | that RFC's claims block | |

## Open questions

1. **⚠ OWNER — the ADR-0006 fork: is a guided pass a distinct mode, or a preset
   ceiling?** §3.1 specifies the mechanism, which the ∩ algebra fixes either way;
   what is unruled is whether it surfaces as a named mode the learner selects or as
   a preset the ramp tightens. **Not acceptance-blocking** — §3 ships as a ceiling,
   which is the only form the algebra admits, and a mode would wrap it rather than
   replace it.
2. **Does a set need its own review status, or does it inherit its members'?**
   §1.2 reuses `provenance` unchanged, so a set can be `published` while a member is
   `draft`. Specified as inherit-the-weakest; a reviewer may prefer an independent
   status.
3. **May a pack belong to more than one set?** Nothing in §1 forbids it and the
   ordered-member design supports it. Left unconstrained, so a member's ordinal is
   per-set rather than global — worth an explicit reviewer decision, because
   forbidding it later is a breaking change and permitting it later is not.

## Ledger rows

Proposed — id assigned at landing; head was **D1310** at drafting.

- 🐞 **There is no set.** The pack format, the database and the content tree all
  lack an ordered collection of packs — verified three ways at HEAD. `variantOf` is
  pairwise, `concepts` is an unordered tag with no denominator, and
  `rfc/campaign-core.md:125-127` forbids node re-entry so a campaign cannot carry a
  cycle. **Three separately-requested training forms — Yusupov's scored chapter,
  the tempo cycle, and any "repeat the chapter" rule — were each blocked on this
  one missing grain**, which is why they read as three asks and are one.
- 🐞 **The tempo verdict is a third shipped-with-zero-consumers mechanism.**
  `TempoVerdict` and `gradeOutpaced` ship; 4 packs use the `spendAtLeast` arm and
  **0** use the verdict arm. Sharpens [[D863]]'s wave with a named target.
- 💡 **The guided first pass has exactly one expressible form.** Under the ∩
  algebra (`design/05-in-run-experience.md:230-232`) every term only narrows, so a
  pack **cannot grant** assistance and a guided pass must be a *tightening ceiling*
  over `attempts.attempt_no`, not a grant. This resolves the mechanism half of the
  ADR-0006 fork without touching the owner's half, and it is the property that stops
  a pack forcing help onto a learner who declined it.

## Changelog

- **2026-08-23** — drafted from `planning/training-methods/rfc-derivation.md` on
  [[D1310]], alongside `rfc/return-scheduling.md`. The split is failure isolation:
  the scheduler defect must not wait behind an unruled pack field. Restructured
  during drafting — the derivation carried pass marks, the guided ramp and tempo
  cycles as three items; measurement found all three blocked on the same missing set
  grain, so §1 pays for it once and the rest became cheap.
