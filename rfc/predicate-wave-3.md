# RFC: Structural predicate vocabulary, wave 3 — census, kings, and the intent boundary

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/research/authored-transitions-and-features.md` §6 (the
  evidence-ordered predicate roadmap this RFC executes, in its own attestation order);
  `design/03-product-breadth.md:289` gate **B9** (the four admission rules);
  `design/05-in-run-experience.md:361-417` §5c (grade a plan by its structural
  consequence); `design/BACKLOG.md:163` (the plan-objective friction), `:120` (D34, no
  king geometry), `:205` (hands-off-to vs present-now), `:220` (73% of shape plans are
  uncomputable by their own authors), `:200` (the content-transfer rule); `docs/structural-reading.md`; `docs/shape-library.md`
- **Exploration gate:** opened by owner ruling 2026-08-12 (`rfc/README.md`). This wave is
  **collected authoring evidence, not a GAP row**: every item below is cited to the
  authoring session or the corpus measurement that produced it, and the dossier states the
  admission bar in its own words — "the vocabulary should grow along these lines and not
  otherwise, because these are the only gaps real content has hit twice"
  (`design/research/authored-transitions-and-features.md:417-418`)
- **Depends on:** nothing unshipped. `rfc/archive/predicate-wave-2.md` (implemented) supplies
  the fifteen leaves, the seven-node grammar, `mirrored`/`quantified`, and the exhaustive-
  dispatch law this RFC inherits; `rfc/archive/structural-reading.md` (implemented) supplies
  the admission rules and the evaluator; `rfc/archive/shape-library.md` (implemented)
  supplies the entry format whose `plans[].success.signature` §5 resolves against;
  `rfc/archive/trajectory-drill.md` (implemented) supplies the legs §4 demonstrates on
- **Parent / amends:** **`rfc/archive/predicate-wave-2.md`** (the vocabulary: three new
  leaves, two deprecations), **`rfc/archive/drill-pack-format.md`** (pack schema 0.17 → 0.18,
  additive except two deprecation *warnings*), **`rfc/archive/shape-library.md`** (shape-entry
  schema 0.2 → 0.3, additive), **`rfc/archive/outcome-drill-grading.md`** (a sixth
  `successCondition` kind)
- **Supersedes / superseded by:** —
- **Migration:** **none, and that is normative.** Parent law 1c holds: a rung-0 fact is never
  persisted. Run schema stays **0.13**; `STORAGE_VERSION` stays **18**. Nothing this RFC adds
  is an event, and §5 explicitly refuses to become one (§7 F1).
- **Pack schema:** **0.18.** Claimed in `rfc/README.md`'s register in the same edit that adds
  this RFC's Active row — a register edit outside this file's authority, flagged for the
  owner. Landing order: behind **0.16** (`authoring-frictions`) and **0.17**
  (`tempo-vocabulary`). **0.19 is free** — `rfc/validator-integrity.md` deliberately declined
  it and claims nothing versioned — and this draft neither takes nor reserves it;
  `rfc/resistance-spectrum.md` makes no pack-schema claim at all. Run schema **0.13** and
  migration **18** are untouched, so nothing here contends with `resistance-spectrum`'s 0.14
  and 19. This draft rebases rather than renumbering unilaterally if either predecessor stalls.
- **Shape-entry schema:** **0.3** — **yes, a bump is required.**
  `schemas/shape_entry.schema.json:47-75` carries a duplicated copy of `$defs/structuralFeature`
  and `$defs/structuralExpression`; the three new leaves land in both copies or shape triggers
  and plan signatures silently cannot use them. `SHAPE_ENTRY_SCHEMA_VERSION`
  (`packages/schema/src/index.ts:3`) and the `$id` at `schemas/shape_entry.schema.json:3` move
  together. Nothing else in the entry format changes — §5 resolves *against* the shipped
  `plan.success.signature` (`shape_entry.schema.json:77`) and does not touch it.
- **Planning:** `planning/predicate-wave-3/` (once implementing)


> **ORDINAL RECONCILED by claude (register coordinator), 2026-08-15.** This RFC
> describes `plan_consequence` as a **sixth** `$defs/successCondition` arm. On the
> 0.16 tree `successCondition` has exactly five arms, so that was correct when
> written — but `rfc/tempo-vocabulary.md` (pack **0.17**, cross-reviewed and
> codex-ready) takes the sixth arm with `timing_window`. **At 0.18,
> `plan_consequence` is the SEVENTH arm.** Every "sixth" below that refers to this
> RFC's own `successCondition` branch reads as "seventh" if 0.17 lands first.
> Neither RFC breaks if the other does not ship — verified independently by the
> tempo cross-review — so this is a numbering reconciliation, not a dependency.

## Summary

Wave 2 shipped on 2026-08-14 and was spent within a day. The 2026-08-15 dossier re-ran the
shipped evaluator over 35 packs and 23 shape entries and produced an attestation-ordered
roadmap; this RFC executes the top of that list and refuses the rest by name.

Three findings set the shape of the wave. **All 43 `piece_reach_count` leaves in the corpus
are the same `scope: "any"`/`atLeast 0` existence hack** — verified this pass, 43 of 43, and
verified extensionally equal to a census over 4528 position × colour × role checks — and the
missing census predicate produced a *live defect in shipped graded content*:
`mate-two-bishops.json` encoded its degrade condition as `not(every white bishop reach ≥ 0)`,
which is false in every position because `every` over an empty piece set is vacuously true.
Reproduced here against the shipped evaluator: false at all 18 positions of the pack's own
spine and at every hand-built probe. **"The black king is on an edge" costs 765 bytes and
four `quantified` regions** in `trajectory-mate-bishop-knight.json`, and the objective type
carrying it is `reach_structure` — a pawn word aimed at a king (D34). And **34 of 35 packs
capture the learner's intent, 36 times, and nothing grades it** — because the answer is not
merely ungraded, it is *not recorded*: there is no run event for it
(`packages/runtime/src/types.ts:270-286`) and no client surface references `intent_capture`
at all.

This RFC admits **three leaves** — `piece_count` (existence and material census over all six
roles), `king_zone` (`edge`/`corner`), `king_distance` (Chebyshev, to a square or to a named
piece) — **one success-condition kind**, `plan_consequence`, which binds a graded condition
to the plan class it belongs to and *refuses to exist* for a plan whose author declared no
census, and **one reference modality** on `pack.shapes` (`present` vs `prospective`) that
turns the dossier's 22-of-25 firing measurement into a validator rule and makes the three
non-firing references honest instead of indistinguishable from defects.

It also **shrinks**: `pawn_count` is subsumed by `piece_count` and deprecated, and
`piece_reach_count`'s `scope: "every"` arm is deprecated — the arm with zero uses in the
corpus whose only historical use was the dead condition above. Both are warnings now and
schema removals in wave 4, because `registered_shapes` documents are immutable and a
narrowing must not invalidate a row that already exists.

And it refuses, each with the deciding rule: intent-*relative* grading (the answer is not
recorded; §7 F1), structure memory and history (rule 1, plus the evaluator-signature
argument; F2), a castling-rights leaf (rule 3, with the arithmetic showing it does not fix
the proxy it was asked to fix; F3), prophylaxis (needs an opponent model, so it belongs with
`rfc/resistance-spectrum.md`; F9), and a `practical_difficulty` grade handed to this lane by
that draft's §7a (declined with routing, because it depends on an unlanded primitive and
grades against a model measurement rather than a board fact; F10).

The largest refusal is the **transition-predicate category** (F4). This RFC agrees it is a
real and distinct category — every predicate in the vocabulary is a feature of a position and
none is a feature of a move — and records the finding that it is an **extraction, not an
invention**: transition analysis already ships inside `pivotal.ts`, piece-route reconstruction
inside `compare-strips.ts`, and `structuralDelta`/`vacationReading` are written, exported and
consumed by nothing but tests. It is refused anyway, and the reason is *not* cost: it has zero
authoring attestations and no consumer for its authorable half, and shipping a grammar ahead
of its consumer is precisely what produced `timingWindow`'s 0 uses across 135 checkpoints.
F4 sorts the owner's move-primitive taxonomy, states what a follow-on wave takes, and names
its promotion trigger.

## Motivation

### 1. The roadmap, and what this wave takes from it

`design/research/authored-transitions-and-features.md:420-428` lists every gap attested in
two or more independent waves, ordered by attestation. Verdicts:

| # | Gap | Attestations | This RFC |
|---|---|---|---|
| 1 | **Intent-relative success** | 4 | **Split.** The authorable half ships as `plan_consequence` (§5). The intent-*relative* half is refused with its blocker named (§7 F1) |
| 2 | **King geometry** (D34) | 4, +9 measured this pass | **Admitted**: `king_zone`, `king_distance` (§4) |
| 3 | **Timing / tempo** | 2 | **Not mine.** `rfc/tempo-vocabulary.md` owns it (§Scope) |
| 4 | **Shape-reference modality** | 2, +3 of 3 measured | **Admitted** as a reference relation, not a predicate (§6) |
| 5 | **Per-leg authoring** | 2 | **Not mine.** `rfc/authoring-frictions.md` §5 owns the per-leg field it needs |
| 6 | **Structure memory / history** | 2 | **Refused**, rule 1 (§7 F2) |
| 7 | **Existence and material census** | 2 | **Admitted**: `piece_count` (§3) |

Items 3 and 5 are named, not specified: crossing into another draft's lane is how the
register collisions of 2026-08-13 and 2026-08-14 happened.

### 2. What this pass measured

Every number below was produced by bundling the **shipped**
`packages/runtime/src/structure.ts` unmodified with esbuild and replaying each pack's
principal (first-child) spine from `start.fen` with chessops — the dossier's Appendix method,
re-run. No reimplementation of any shipped predicate; the *proposed* predicates are reference
implementations used only as oracles against the shipped ones.

| Measurement | Result |
|---|---|
| `piece_reach_count` leaves in `content/drafts` | **43**, of which `scope: "any"`/`atLeast 0`: **43 of 43** |
| `piece_reach_count(C, r, any, atLeast, 0)` vs `piece_count(C, r, count, atLeast, 1)` | **4528** position × colour × role checks over all 35 packs' spines, **0 mismatches** |
| `mate-two-bishops.json`'s pre-`25b4584` condition | `false` on **all 18** spine positions and on both-bishops / one-bishop / no-bishop probes |
| `king_zone(black, edge)` vs the shipped 4-arm `quantified` fan | **0 disagreements** across the 39-ply B+N spine **and** across all **63** legal black-king placements; both first fire at **ply 8** |
| Shape references | **25** references, **22** fire on their pack's spine, **3** do not — the same three the dossier names |
| Shape-library plans | **103**, of which **75** (73%) ship `signature: null` |
| Plan classes in packs | **99**, of which **44** carry `shapePlan`, of which **16** resolve to a non-null signature and **28** to `null` |

The last row is the single most important number in this RFC and it is stated up front:
**the top-attested gap is closable, today, for 16 of 99 declared plan classes.** §5 is
designed so that the other 83 are *visibly* ungradable rather than silently graded by
someone else's census.

### 3. The four admission rules, restated

From `rfc/archive/structural-reading.md:271-278`, mirrored in `docs/structural-reading.md`;
every candidate is tried against them **in order**:

1. **Computable from the position alone.** No engine, no history, no network, no author input.
2. **Exactly definable in one sentence with no free parameter that encodes taste.**
3. **Dual role.** Something an author would write into a plan's success sentence *or*
   something a learner needs pointed at in order to see it.
4. **No name that contains a verdict.**

Rule 3 is a **disjunction**, and §1 leans on that: a leaf with zero authored uses whose
readable role is live still passes it.

### 4. Scope boundary

Out of this RFC, each with the reason rather than deferral language:

- **Timing, tempo, plan-readiness as a move set, the luxury budget.** `rfc/tempo-vocabulary.md`
  owns it. Named as a dependency nowhere: nothing here reads or writes `timingWindow`.
- **Per-leg `shapes` / `opponentPolicy`.** `rfc/authoring-frictions.md` §5 owns the per-leg
  surface and explicitly scopes out the rest (`rfc/authoring-frictions.md:91-94`).
- **`intent_capture`'s validated-answer slot.** `rfc/authoring-frictions.md:85-90` scopes it
  out as needing "a new run event, a run-schema bump, a migration and a client interaction
  surface — that is a whole RFC". This RFC agrees and does not claim it (§7 F1).
- **Opponent modelling of any kind.** `rfc/resistance-spectrum.md` owns `humanConcessionMass`
  and the practical-difficulty spectrum. Two things flow from that boundary and both are
  refusals in §7: prophylaxis (F9) and the `practical_difficulty` success condition its §7a
  hands to "the vocabulary lane" (F10). Neither is absorbed and neither is re-specified here.
- **D32** (`design/BACKLOG.md:118`) — `conditionEvidenceRefs`
  (`apps/server/src/pack-orchestrator.ts:124-137`) throws a bare `TypeError` when
  `structuralFeatureKinds` returns empty. **`validator-integrity` owns the fix — and it claims NOTHING versioned; it declined 0.19** (contradiction corrected by claude as coordinator 2026-08-15; this draft's own header, §832 and changelog already said so). §5 is
  designed so the *new* condition kind can never reach that throw (§5c); the existing bug is
  not fixed here.
- **Objective-type vocabulary.** D34's second half — `reach_structure` doing duty for a king
  target — is an *objective type* problem, not a predicate problem, and belongs with the
  objective-type widening `design/BACKLOG.md:163` already tracks. §1 proposes a ledger row for
  the five zero-user objective types and specifies nothing about them.

## Specification

### 1. The shrink, first

A vocabulary that only grows rots. Wave 2 added five mechanisms and refused six; this wave
adds five and **removes two**, and states the rule under which the rest stay.

#### 1a. Two deprecations, both evidenced

| Removed | Evidence | Replacement |
|---|---|---|
| `pawn_count` (both bases) | Subsumed exactly by `piece_count` with `role: "pawn"` (§3). Two spellings of one census is the rot this section exists to prevent. **6 uses** to rewrite: `lucena-bridge-convert.json`, `pawn-breakthrough-convert.json`, `pawn-opposition-convert.json`, `philidor-third-rank-hold.json`, `queen-vs-pawn-seventh-convert.json`, `content/shapes/opposite-coloured-bishops.json` — one leaf each, verified this pass | `piece_count(C, "pawn", basis, comparison, count)` — identical arithmetic, identical sentences |
| `piece_reach_count`'s `scope: "every"` arm | **0 of 43** corpus uses (`scope: "any"` in all 43). Its only known use in shipped content was `mate-two-bishops.json`'s degrade condition, which was **false in every position** and shipped that way for a day in a *graded* pack. The vacuity was documented in the parent RFC (`rfc/archive/structural-reading.md:263-266`) *and* in `docs/structural-reading.md`, and still bit an author: a documented trap that bites is a defect in the vocabulary, not in the author | The claim "every rook of mine is cramped" becomes `all[ piece_count(C, "rook", count, atLeast, 1), not(piece_reach_count(C, "rook", any, atLeast, n+1)) ]` — non-vacuous **by construction**, because the existence conjunct is explicit and mandatory. This composition is only available once `piece_count` ships, which is why the deprecation lands with it and not before |

**Deprecate now, remove in wave 4 — and the reason is not caution.** `registered_shapes`
(migration 10) stores **immutable** community documents. A schema narrowing that lands before
the registry is confirmed clear invalidates rows nobody can edit. So this RFC ships two
**warnings** — the severity the validator already supports and uses
(`apps/server/src/pack-validation.ts:29`, `:256` `KEY_POINT_PHRASE_IS_JUDGEMENT`) — rewrites
the six in-repo uses to zero, and schedules the two `oneOf` branch removals for wave 4 behind
a registry sweep. A deprecation with no removal date is a deprecation that never happens; the
date is wave 4 and the precondition is written down.

#### 1b. What is *not* retired, and the rule that decides it

Seven of fifteen feature kinds have never appeared in a pack: `pawn_safe_square`, `outpost`,
`isolated_pawn`, `doubled_pawn`, `passed_pawn`, `line_blockers`, `direct_attack_count`
(`design/research/authored-transitions-and-features.md:369-372`). Measured across packs *and*
shape entries this pass:

| Kind | Pack uses | Shape uses |
|---|---|---|
| `passed_pawn` | 0 | **101** |
| `open_file` / `half_open_file` | 1 / 3 | 14 / 14 |
| `outpost` | 0 | 5 |
| `isolated_pawn` | 0 | 5 |
| `doubled_pawn` | 0 | 4 |
| `line_blockers` | 0 | 2 |
| `pawn_safe_square` | **0** | **0** |
| `direct_attack_count` | **0** | **0** |

Five of the seven are load-bearing in the **shape library**, which is the transferable half
of the content (`design/BACKLOG.md` content-transfer row) — "unused" was an artifact of
counting packs only. The two with zero uses anywhere stay, and rule 3 is what decides it:
both are **emitted by the reading projection** (`packages/runtime/src/structure.ts:396`,
`:412`) and rendered as sentences
(`apps/web/src/lib/structural-sentences.ts:14-20`, `:22`), so the disjunctive half of rule 3
("something a learner needs pointed at") holds even at zero authored uses.
`pawn_safe_square` is additionally the *definition* of `outpost`
(`structure.ts:303`) and the body of `structuralDelta.evictionChanges` (`:429-432`);
retiring it would be retiring the arithmetic under two other facts.

**Proposed sunset rule**, offered as a `design/BACKLOG.md` row for the owner rather than
written into `design/` here (law 5): *a feature kind with zero authored uses in packs and in
shape entries, and no emission in the reading projection, is proposed for deprecation in the
next predicate wave and removed in the one after.* Under this rule the current vocabulary
loses nothing beyond §1a — which is the point of writing the rule down before it is needed.

### 2. Verdicts on the candidates

| Candidate | Verdict | Deciding rule |
|---|---|---|
| Existence / material census | **Admitted** as leaf `piece_count` (§3) | Rules 1–4. Rule 3 is 43 corpus leaves spelling it by hand plus a shipped dead condition |
| King on an edge / in a corner | **Admitted** as leaf `king_zone` (§4a) | Rules 1–4; it collapses a 765-byte fan exactly as `quantified` collapsed the 48-leaf one — it removes a fan, not a limit |
| King distance | **Admitted** as leaf `king_distance` (§4b). Wave 2 refused it under rule 3 ("no collected gap is closed by it", `rfc/archive/predicate-wave-2.md:137`) | Rule 3 is now satisfied and measured: **9 of the 75 null-signature notes cite king geometry the vocabulary cannot read**, three of them naming distance in the author's own words |
| Grade the plan the learner declared | **Split.** The authorable half is admitted as `plan_consequence` (§5); the intent-relative half is refused (§7 F1) | Rule 1 for the refusal: which plan was declared is not in the position, and is not anywhere else either |
| Shape-reference modality | **Admitted** as a `pack.shapes` relation (§6), **not** a predicate | Kept out of `StructuralExpression` deliberately: a prospective claim is not evaluable at a position, so putting it in the grammar would break rule 1 for the whole grammar |
| Structure memory / history | **Refused** (§7 F2) | Rule 1 |
| Castling rights | **Refused** (§7 F3) | Rule 3, with the arithmetic |
| Transition predicates | **Refused for this wave**, specified for the next (§7 F4) | Not a rule failure — an attestation and sequencing failure, stated as such |

Net: **eighteen** feature kinds in the enum (fifteen + `piece_count` + `king_zone` +
`king_distance`), of which **sixteen** are authorable without a deprecation warning; **seven**
expression node kinds, unchanged; **six** success-condition kinds (five + `plan_consequence`).

### 3. `piece_count` — the census leaf

```ts
| { readonly kind: "piece_count"; readonly color: Color; readonly role: Role;
    readonly basis: "count" | "difference";
    readonly comparison: FeatureComparison; readonly count: number }
```

**Semantics.** Let `own = |pieces(color, role)|` and `other = |pieces(opposite(color), role)|`.
`basis: "count"` compares `own`; `basis: "difference"` compares `own − other`. `Role` is the
full six-role enum (`schemas/drill_pack.schema.json:367`) — unlike `piece_reach_count`, which
is restricted to the four sliding/jumping roles because *reach* is meaningless for a pawn and
unsafe for a king. Counting has no such problem: a census of kings or pawns is the same
arithmetic as a census of rooks.

**Why it is admissible.** Rule 1 trivially. Rule 2 — one sentence, no constant that encodes
taste; the `difference` basis inherits `pawn_count`'s ruling verbatim
(`rfc/archive/predicate-wave-2.md:360-374`): pieces of one role are a conserved, identical
unit, the codebase already ships signed material comparison as census
(`packages/runtime/src/objective.ts:36-41`, `MaterialBalancePredicate`), and the
*reading projection* still never renders a subtraction. Rule 3 — 43 leaves in the corpus are
this predicate written the long way, and three shape-plan notes name it in the author's own
words ("The required material census is outside this vocabulary" ×2, "Pawn-count progress is
outside this vocabulary"). Rule 4 — `piece_count` names a census.

**The attested authoring case, encoded.** `mate-two-bishops.json` shipped
2026-08-14 with this degrade condition (recovered from `25b4584`):

```json
{ "kind": "not", "of": { "kind": "feature", "feature": {
    "kind": "piece_reach_count", "color": "white", "role": "bishop",
    "scope": "every", "comparison": "atLeast", "count": 0 } } }
```

Evaluated with the shipped `matchesStructuralExpression` this pass: **`false` on all 18
positions of the pack's own spine**, and `false` on the two-bishop, one-bishop and
bishopless probes. `every` over an empty set is vacuously true, so the `not` is false when
there are no bishops — the exact case the author was reaching for. The commit fixed it on
`bishop_on_shade`, which is correct for *this* pack. What the author actually wrote in the
objective summary was "a loose bishop", and with `piece_count` that sentence is one leaf:

```json
{ "kind": "feature", "feature": {
    "kind": "piece_count", "color": "white", "role": "bishop",
    "basis": "count", "comparison": "atMost", "count": 1 } }
```

Verified this pass: `false` / `true` / `true` across both-bishops / one-bishop / bishopless —
the intended `[false, true, true]`, reached without a quantifier and without a vacuity rule to
remember.

**The 43-leaf idiom, retired by equivalence.** `piece_reach_count(C, r, any, atLeast, 0)` is
true exactly when `C` has at least one piece of role `r`: the evaluator maps each such piece
to a non-negative reach and asks `some` (`structure.ts:336-337`). Verified extensionally
against `piece_count(C, r, count, atLeast, 1)` over every position of every authored spine ×
2 colours × 4 reach roles: **4528 checks, 0 mismatches.** The 43 existence leaves in the
corpus are rewritten one-for-one, and the `trajectory-mate-bishop-knight.json` six-leaf
existence hack — "the bishop or the knight is gone", spelled as two negated reach counts per
leg, three times — becomes:

```json
{ "kind": "any", "of": [
  { "kind": "feature", "feature": { "kind": "piece_count", "color": "white",
      "role": "bishop", "basis": "count", "comparison": "equal", "count": 0 } },
  { "kind": "feature", "feature": { "kind": "piece_count", "color": "white",
      "role": "knight", "basis": "count", "comparison": "equal", "count": 0 } } ] }
```

which says what the leg summary says, in the direction it says it.

**Load refusal.** `PIECE_COUNT_OUT_OF_RANGE` when `count` is outside an attainable range,
because every such leaf is a constant. Attainable maxima, from promotion arithmetic: `pawn` 8,
`knight`/`bishop`/`rook` 10 (two plus at most eight promotions), `queen` 9, `king` 1. For
`basis: "count"`, `0 ≤ count ≤ max(role)`; for `basis: "difference"`,
`−max(role) ≤ count ≤ max(role)`. `pawn_count`'s existing `PAWN_COUNT_OUT_OF_RANGE`
(`apps/server/src/pack-validation.ts:138-141`) is kept for the deprecated leaf and is not
reused.

### 4. King geometry — two leaves

D34 (`design/BACKLOG.md:120`) is the fourth attestation of the same gap, and the corpus
carries nine more that were never filed as gap reports because the authors filed them as
`signature: null` notes instead. Classified this pass, the 75 null signatures break down as:

| Reason class | Count | Example note |
|---|---|---|
| Evaluative judgment | 21 | "No rules-arithmetic signature distinguishes a working break from a wasted one" |
| Outcome / duration | 21 | "Holding is an outcome and has no structural signature here" |
| **Missing census vocabulary** | **18** | "King distance is geometry outside this vocabulary" |
| Family scope (one expression cannot cover the family) | 8 | "Post-break structures vary too widely for one expression" |
| Move order / side to move | 6 | "Triangulation is a move-order fact" |
| History | 1 | "Detection cannot tell a traded bishop from one that merely moved away" |

Of the 18 addressable-by-vocabulary notes, **9 are king geometry**, 3 are material census
(closed by §3), and 6 are pawn colour-complex or pawn-fixedness claims (§7 F7 — measured, and
deliberately left to wave 4). So this wave's two admissions cover **12 of the 18**, and the
next wave's target is now a number rather than an impression.

#### 4a. `king_zone`

```ts
| { readonly kind: "king_zone"; readonly color: Color; readonly zone: "edge" | "corner" }
```

**Semantics.** With `color`'s king on square `(f, r)` (0-indexed):
`edge` holds iff `f ∈ {0, 7} ∨ r ∈ {0, 7}`; `corner` holds iff `f ∈ {0, 7} ∧ r ∈ {0, 7}`.
False, not an error, when `color` has no king (a position the runtime never produces but the
evaluator must not throw on). `corner` implies `edge`; neither implies anything about who is
to move, and the leaf reads nothing else.

Admission: rule 1 trivially; rule 2 — two sentences, no constant; rule 3 — D34 plus the
mates batch plus `philidor`'s `black-king-on-the-path`; rule 4 — "edge" and "corner" name
squares, not worth. `king_zone(black, corner)` is emphatically **not** "the king is trapped":
the arithmetic ships, the verdict does not, exactly as the parent ruled for
`piece_reach_count` and "trapped" (`rfc/archive/structural-reading.md:294-298`).

**The attested authoring case, encoded.** `trajectory-mate-bishop-knight.json`'s
`king-on-the-edge` checkpoint is a **765-byte, four-arm `any` of `quantified` square
regions** (a-file, h-file, rank 1, rank 8), each with a `piece` template naming the black
king. It becomes:

```json
{ "kind": "feature", "feature": { "kind": "king_zone", "color": "black", "zone": "edge" } }
```

Verified this pass against the shipped evaluator: **0 disagreements** across the pack's
39-ply spine and across **all 63 legal black-king placements** on a two-king board; both
forms first fire at **ply 8**, the ply the author computed and the dossier reproduced
(`design/research/authored-transitions-and-features.md:320-324`).

The corner case is worth recording because it *refuses* to flatter the vocabulary. The same
pack's `king-in-the-bishops-corner` checkpoint is a `quantified` **2×2 box** (g7–h8), not a
corner square, and the pack provenance says why: the true corner is too far for the 20-ply
leg cap. Measured here: `king_zone(black, corner)` first holds at **ply 34**, and the leg-2
entry is at ply 8 — **26 plies**, exceeding the cap by six, exactly as the author recorded in
`25b4584`. `king_zone` would let that author state the corner in one leaf; it would not let
them ship it. The blocker is the ply cap, not the vocabulary, and this RFC does not touch the
cap.

#### 4b. `king_distance`

```ts
export type KingDistanceTarget =
  | { readonly kind: "square"; readonly square: SquareName }
  | { readonly kind: "piece"; readonly color: Color; readonly role: Role };

| { readonly kind: "king_distance"; readonly color: Color;
    readonly target: KingDistanceTarget;
    readonly comparison: FeatureComparison; readonly count: number }
```

**Semantics.** Chebyshev distance — the number of king moves on an empty board,
`max(|Δfile|, |Δrank|)` — from `color`'s king to the target. For a `square` target, to that
square. For a `piece` target, the **minimum** over all pieces matching `{color, role}`;
`false`, not an error, when that set is empty or when `color` has no king. Occupancy,
legality, check and blocking are not read, and that scope is part of the definition sentence:
this is board geometry, not a path search.

Admission, rule by rule. Rule 1 — two square coordinates. Rule 2 — one sentence; the `count`
is an authored comparison operand exactly as in `line_blockers` and `direct_attack_count`, not
a threshold the *detector* chooses. Rule 3 — wave 2's refusal was explicitly "no filed plan
names them, the enum widens when one does" (`rfc/archive/predicate-wave-2.md:137, 408-411`);
five now do, in the authors' own words: `lucena`/`white-run-out-the-checks` ("King-to-rook
distance is geometry outside this vocabulary"),
`queen-vs-pawn-on-seventh`/`black-count-the-far-king` ("King distance is geometry outside this
vocabulary"), `queen-vs-pawn-on-seventh`/`white-know-the-drawn-files` ("'king close enough' is
not [expressible]"), `philidor`/`black-king-on-the-path`,
`pawn-opposition-key-squares`/`white-occupy-key-squares`. Rule 4 — a distance is a
measurement. The `piece` target arm is what carries `lucena`'s case, which is
king-to-*rook*, not king-to-king; the king-to-king case is the same arm with
`role: "king"`. A `square` target is extensionally a clipped `quantified` region and
therefore removes a fan; the `piece` target is genuinely new expressive power, because a
region cannot be relative to a piece that moves.

**The attested authoring case, encoded.** The B+N pack's third leg summary says the mate
needs "your king standing two squares away". That sentence is exact and, today, unencoded.
As a leg degrade condition:

```json
{ "kind": "structural_feature", "to": "degraded", "from": ["active", "preserved"],
  "feature": { "kind": "not", "of": { "kind": "feature", "feature": {
    "kind": "king_distance", "color": "white",
    "target": { "kind": "piece", "color": "black", "role": "king" },
    "comparison": "atMost", "count": 2 } } } }
```

Measured over the shipped 39-ply spine: the two kings are at Chebyshev distance 2 at **38 of
40** positions and at distance 3 at plies 2 and 8 — both inside leg 1, both before leg 3's
entry at ply 28. So the condition is false everywhere inside the leg it would guard, which is
the correct shape for a degrade rule: it never fires on the authored line. Recording the two
distance-3 plies matters more than recording the 38: it is the check that the condition is
discriminating rather than a tautology, and it is why this RFC does **not** propose the same
expression as a leg *entry* trigger.

**Load refusals.** `KING_DISTANCE_OUT_OF_RANGE` when `count` is outside 0–7 (the Chebyshev
diameter of an 8×8 board) — outside that every leaf is a constant.
`KING_DISTANCE_SELF_TARGET` when `target.kind === "piece"` with `role: "king"` and
`target.color === color`: the distance is 0 in every position, so the leaf is a constant
dressed as a query.

**The widening path, opened deliberately and not taken.** This leaf is `king_distance` and not
`piece_distance` because rule 3 is satisfied for kings five times over and for other roles
once — `up-an-exchange`/`white-stretch-two-wings`: *"Wing counts and switching distance are
outside this vocabulary."* One authoring note is below this wave's stated bar. The generalised
leaf is the same shape plus a `role` field and a **per-role metric**, and the metric rule is
written here so a later wave inherits it rather than inventing it: distance is the **graph
distance on the empty board** for the moving role — Chebyshev for the king, breadth-first over
knight moves for the knight (a fixed 64×64 table), and move-count for the sliders (0, 1, 2,
or unreachable for a bishop off its shade). Occupancy is never read, exactly as it is not read
here, so the metric stays geometry rather than a path search (rule 1). The owner's
knight-repositioning case (§7 F4) is this metric's clearest use, and its useful form is the
*delta* across a move, which is why it lands with the transition category and not with a
static leaf.

### 5. `plan_consequence` — the intent gap, split honestly

#### 5a. What is actually broken

`design/05-in-run-experience.md:389-397` found the path in 2026-08-13: *grade the plan by its
structural consequence*. Two years of that path's machinery already ship. What does not ship
is the **binding** between a graded condition and the plan it grades, and the corpus shows
exactly what the absence costs.

`carlsbad-minority-attack.json` offers the learner a three-way plan choice at the tabiya
(`intent_capture` over `minority-attack`, `central-break`, `kingside-attack`). Its objective
carries exactly one success condition, and this pass verified that condition is
**byte-identical** to the `carlsbad` shape entry's `white-minority-attack` signature
(backward black c-pawn on a White half-open c-file). The other two plan classes resolve to
shape plans whose signatures are `null`, with the authors' reasons attached: *"No
rules-arithmetic signature distinguishes a working break from a wasted one"* and *"No
rules-arithmetic signature distinguishes attack from overextension."*

So the pack asks for a choice among three plans and grades every learner by the first plan's
census. A learner who declares the central break and executes it perfectly is graded nothing;
a learner who declares it and stumbles into a backward c-pawn is graded `achieved`. That is
not a bug in the pack — it is the only thing the format lets the author write.

#### 5b. The condition

```ts
| (SuccessConditionBase & {
    readonly kind: "plan_consequence";
    readonly planClassId: string;
  })
```

Schema branch (`$defs/successCondition`, sixth arm on the 0.16 tree — **seventh if `tempo-vocabulary` 0.17 lands first**; see the ordinal note in the header), `additionalProperties: false`, with the
shipped `to`/`from` refs:

```json
{ "type": "object", "required": ["kind", "planClassId"],
  "properties": {
    "kind": { "const": "plan_consequence" },
    "planClassId": { "$ref": "#/$defs/id" },
    "to": { "$ref": "#/$defs/conditionBase/properties/to" },
    "from": { "$ref": "#/$defs/conditionBase/properties/from" } },
  "additionalProperties": false }
```

**Resolution.** The signature is resolved at load, not at runtime: `planClassId` names an
entry in `pack.planClasses`; that entry's `shapePlan` (`{shape, plan}`,
`schemas/drill_pack.schema.json:332-340`) names a shape entry and a plan; that plan's
`success.signature` is the expression. The compiled predicate is exactly
`{ type: "fenPredicate", predicate: { type: "structuralFeature", feature: <resolved signature> } }` —
the same predicate `structural_feature` compiles to (`apps/server/src/pack-orchestrator.ts:118-120`),
with no new evaluator and no new runtime path. `plan_consequence` adds a *binding*, not a
detector, which is why it needs no admission-rule argument of its own beyond the four rules
already passed by whatever leaves the signature contains.

**Why resolution goes through the shape library and nowhere else.** An inline
`planClass.consequence` field was considered and refused: `design/BACKLOG.md:200`'s
content-transfer rule ("content earns its cost by how much of it fires in a game nobody
authored") and `design/04-content-architecture.md` §0a both say the fix is packs *referencing*
entries rather than inlining them. A plan worth grading is a plan worth naming in the library.
The cost is measured and stated: **44 of 99** plan classes carry a `shapePlan` today, so 55
cannot use this condition until their author writes or references an entry. That is the
intended pressure, not a defect.

**Normative naming and rendering rule.** The condition asserts *the structural consequence the
author attached to this plan class is present in this position*. It does **not** assert that
the learner executed the plan, and it must never be rendered as though it did. The names
`plan_executed`, `plan_followed`, `intent_met` are refused under admission rule 4 — each
contains a verdict about a person. The sentence table (§9) fixes the rendering to
"the structural consequence authored for <plan label> is present", and the banned-word test
of `rfc/archive/structural-reading.md` §6b applies to it unchanged.

#### 5c. Refusals mechanised

| Code | Fires when | Why it is a refusal and not a false condition |
|---|---|---|
| `PLAN_CONSEQUENCE_UNKNOWN_PLAN_CLASS` | `planClassId` is not an id in `pack.planClasses` | A dangling reference that would compile to a rule nothing can satisfy |
| `PLAN_CONSEQUENCE_NO_SHAPE_PLAN` | the plan class has no `shapePlan` | There is nothing to resolve; §5b's rule, enforced |
| `PLAN_CONSEQUENCE_NOT_COMPUTABLE` | the resolved shape plan's `success.signature` is `null` | **The anti-pretending rule.** 75 of 103 authored plans say, in the author's own note, that no census distinguishes them. The format must make grading such a plan *impossible*, not merely false — a silently-false condition reads as "the learner failed", which is a verdict the evidence does not support |

The shape lookup is optional in `validatePackDocument` exactly as it is for `pack.shapes`
today (`apps/server/src/pack-validation.ts:206`, `:212`): when no lookup is supplied — the
emitters, `verify-draft` — an unresolvable reference is *not* refused, and only
`PLAN_CONSEQUENCE_UNKNOWN_PLAN_CLASS` and `PLAN_CONSEQUENCE_NO_SHAPE_PLAN` (both pack-local)
still fire. This is the shipped precedent, followed rather than re-decided.

**Evidence refs, and why D32 cannot bite here.** `conditionEvidenceRefs`
(`apps/server/src/pack-orchestrator.ts:124-137`) throws a bare `TypeError` when a structural
condition's leaf set is empty — D32, owned by `validator-integrity`. `plan_consequence`'s
refs are defined so the set can never be empty: `packEvidenceRef("planClass#" + planClassId)`
— following the shipped source-id convention at `apps/server/src/authored-feedback.ts:239` —
**followed by** the resolved signature's `structuralFeatureKinds`. The plan-class ref is
unconditional, so a signature built only from `quantified`/`pieceOnSquare` nodes yields a
one-element list rather than a throw. This RFC does not fix D32; it declines to add a second
instance of it.

#### 5d. What this does *not* do, said plainly

`plan_consequence` is **intent-blind**. It grades a position, not a person, and the shipped
canonical doc already draws that boundary — `docs/structural-reading.md:76-78` lists
"intent-relative grading" among the things this layer does not provide. The learner's
declared plan is not consulted, because it is not recorded: there is no event for it in
`DrillRunEvent` (`packages/runtime/src/types.ts:270-286` — `prediction.recorded` and
`reasoning.recorded` exist for the *other two* interaction kinds), and no file under
`apps/web/src` references `intent_capture` at all. The 36 interactions in 34 packs do not
merely go ungraded; they are never asked.

What this RFC ships is the **join key**. `plan_consequence(planClassId)` names a plan class,
and `intent_capture.planClassIds` names plan classes
(`schemas/drill_pack.schema.json:550-563`); when the answer slot ships, selecting the
condition that matches the declared plan requires **no schema change here** — the join column
already exists on both sides. A `whenDeclared` flag was considered and refused under §7 F1's
rule: no field ships without an evaluator.

### 6. Shape-reference modality

`pack.shapes` is an array of ids (`schemas/drill_pack.schema.json:35-40`) and
`shapeFirings` (`packages/runtime/src/shape-firing.ts:15-33`) walks a path asking whether each
entry's trigger holds. Three of the corpus's 25 references never hold anywhere on their pack's
authored spine, and all three are *hands-off-to* declarations rather than *present-now*
claims — the opening-wave author predicted exactly this and recorded that "the format cannot
distinguish them" (`planning/content-era/log.md:744-749`). Reproduced this pass: 22 fire, 3 do
not, and the three are `anti-sicilian-najdorf-english-attack` → `opposite-castling-race`,
`najdorf-english-attack-black` → `opposite-castling-race`, and
`trajectory-qgd-exchange-minority` → `rook-4v3-same-side`.

**The widening.** `shapes` items become a `oneOf`:

```json
"shapes": {
  "type": "array", "minItems": 1, "uniqueItems": true,
  "items": { "oneOf": [
    { "$ref": "#/$defs/id" },
    { "type": "object", "required": ["shape", "relation"],
      "properties": {
        "shape": { "$ref": "#/$defs/id" },
        "relation": { "enum": ["present", "prospective"] } },
      "additionalProperties": false } ] } }
```

A bare id means `{ shape: id, relation: "present" }` — the checkable reading, chosen as the
default deliberately. `uniqueItems` on a mixed array no longer prevents the same shape
appearing twice in two forms, so a `SHAPE_REFERENCE_DUPLICATE` refusal is added on the
resolved `shape` id.

**Semantics.**

- `present` — the author claims the entry's trigger holds at some position on the pack's
  authored spine. **Checkable at load, and checked**: `SHAPE_REFERENCE_NEVER_PRESENT` when
  the trigger fires at no position of any authored spine path. The validator already replays
  the spine with chessops for a different purpose (`apps/server/src/pack-validation.ts:99-116`,
  `reasoningCheckpointFen`), so this is a reuse, not a new capability. As with every other
  shape rule it fires only when the shape lookup is supplied.
- `prospective` — the author claims the entry characterises positions the drill *hands off
  to*, beyond the authored line. **Not checkable, and therefore not checked, not graded, and
  never a firing.** It selects the entry for library linkage and for post-spine reading. A
  `prospective` reference contributes nothing to `shapeFirings` over the authored spine and
  is not eligible as a `plan_consequence` source.

This is the one place where the wave admits something *unverifiable*, and it does so by
making the unverifiability explicit and inert. The alternative — leaving both meanings on one
mechanism — is what produced three references that are indistinguishable from defects, and
what let the dossier's "22 of 25" read as a 12% failure rate when it is in fact a 100%-honest
corpus with one missing word.

**Why it is not a predicate.** A prospective claim is about positions that do not exist yet.
Putting it in `StructuralExpression` would mean `matchesStructuralExpression(fen, e)` could be
handed an expression it cannot answer from `fen` — breaking admission rule 1 for the *whole
grammar*, not just for one leaf. The relation therefore lives on the reference, where the
consumer (`shapeFirings`) already has a path rather than a position.

**Content.** The three references above become `{ shape, relation: "prospective" }`; the other
22 become bare ids and are now validator-checked. Three pack digests move; no other pack
changes.

### 7. Refusals, each with its rule

**F1 — intent-*relative* grading. Refused; blocker named.** Conditioning a grade on the plan
the learner declared requires the declaration to exist as data. It does not: no run event
(`packages/runtime/src/types.ts:270-286`), no client surface, no storage. Producing one needs
a run-schema bump, a migration number and a client interaction — three shared resources this
draft has not claimed, and `rfc/authoring-frictions.md:85-90` already scopes the same work out
for the same reason and calls it "a whole RFC… the next drafted follow-up". §5d ships the join
key so that RFC costs a condition selector and not a format change.

The second half of the refusal is the one that matters more. Even granted the recording,
**the ceiling is 45%**: of 103 authored plans, 28 have a signature today and 18 more are
blocked on vocabulary that could exist (§4's table); the remaining 49 are judgment (21),
outcome or duration (21), history (1), and family-scope or move-order problems (14) that no
position census will ever settle. `design/research/authored-transitions-and-features.md:38-47`
draws that line and the authors drew it themselves. A predicate that graded those plans would
be manufacturing a strategic verdict — ADR-0005's named prohibition and this repo's law 8. The
correct product behaviour for a plan whose author says it has no census is **silence**, and
§5c mechanises silence as a load refusal so it cannot be overridden by an author in a hurry.

**F2 — structure memory and history predicates. Refused, rule 1.** "The fianchetto structure
persists after the bishop trade", "traded versus merely moved", "pre-break state": each is a
fact about a *past* position. Wave 2 refused this and nothing has changed
(`rfc/archive/predicate-wave-2.md:113-116`). The refusal now has a second, sharper ground
worth writing down: **the evaluator's type is the law.**
`matchesStructuralExpression(fen: string, expression: StructuralExpression)`
(`packages/runtime/src/structure.ts:351`) takes exactly one position, and the root of a run
has no predecessor. A history node in the grammar would force every one-FEN call site —
`shapeFirings` (`shape-firing.ts:23`), guidance trigger evaluation
(`apps/server/src/guidance.ts:36-38`), boundary/checkpoint/success evaluation
(`packages/runtime/src/objective.ts:166`), and the static validator — either to carry a path it
does not have or to fabricate one. One evaluator is wave 2's stated dividend
(`rfc/archive/predicate-wave-2.md:432`) and this RFC does not spend it.

**F3 — a castling-rights leaf. Refused, rule 3, with the arithmetic.** Rights *are* in the
FEN, so rule 1 is satisfied and the refusal has to be earned elsewhere. The filed gap
(`planning/content-era/log.md:659-661`) is that `opposite-castling-race` fakes castling with a
king-square `pieceOnSquare` proxy, "so a king that walked to g1 fires". Rights do not fix
that: a king that walked to g1 has no castling rights either, so
`not(castling_rights(white, either))` is true in both the intended and the unintended case
and adds exactly zero discriminating bits to the proxy. The predicate the entry actually
wants is *has castled*, which is history (F2). Refused, and the entry keeps its honest note.

**F4 — the transition-predicate category. Agreed real; agreed cheap; refused for this wave;
specified so the follow-on inherits rather than reinvents.**

The owner's 2026-08-15 observation is correct and this RFC adopts the finding: **every
predicate in the vocabulary is a feature of a position; none is a feature of a transition.**
"What does that move stop defending?" is an attack-set diff across one move — mechanical,
engine-free, verdict-free — and there is nowhere in the grammar to stand between two
positions.

**And the machinery is not missing. It is trapped.** The correct framing is the one this repo
has already ruled once — `archive/shape-library.md`'s §0 move, *the reusable half exists
inside a feature; lift it out and let packs reference it*. Verified inventory, 2026-08-15:

| Already in the tree | Where | What it proves |
|---|---|---|
| Transition analysis across one move | `packages/runtime/src/pivotal.ts:32-39` (`capturedRole` — parses the UCI, resolves the mover from the **parent** board, diffs the two boards for the captured role including the en-passant case) and `:52-54` (pawn contact tested **before vs after** with `pawnAttacks(...).intersects(...)`) | Attack-set reasoning across a move already ships, as a private detail of one detector |
| Piece routes | `packages/runtime/src/compare-strips.ts:40-46`, `PieceRoute` at `:9` | Multi-move square sequences per piece, chained by matching each move's `from` to a prior route's last square. "Where did that knight go over four moves" is already computed |
| Feature delta across a move | `structure.ts:425-435` (`structuralDelta` — gained/lost observations plus pawn-eviction changes) | The gained/lost object exists and is **consumed by nothing but `structure.test.ts`** |
| Discovered consequence | `structure.ts:437-447` (`vacationReading` — what a piece's departure unblocks) | The discovered-threat primitive exists, exported at `packages/runtime/src/index.ts:55`, **also consumed by nothing but tests** |
| A live rendered consumer | `pivotalMarkers`/`renderPivotalMarker` reach `compare-strips.ts:38`, `story.ts:78-79` and `apps/web/src/lib/DrillScreen.svelte:277,331` | The *reading* half of transitions is already on screen. Only the **authorable** half is missing |

So the cost is an **extraction**, not an invention, and this RFC says so plainly because it
changes the shape of the follow-on: two of the four primitives are already written and dead,
one is written and private, and one is written and rendered.

The remaining structural cost, stated so promotion is cheap:

| Question | Answer, from the tree |
|---|---|
| Can it be a `StructuralExpression` member? | **No.** The root position has no predecessor, so such a node is undefined at the root, and `matchesStructuralExpression(fen, …)` (`structure.ts:351`) has one position by construction. It must be a **sibling grammar** with a sibling evaluator: `matchesTransitionExpression(before: string, moveUci: string, after: string)` |
| Is the input available where conditions are evaluated? | **Yes.** `evaluateObjectivePredicate(run, predicate)` (`objective.ts:205-207`) resolves the active `Node`, and `Node` carries `parentId`, `fen` and `moveUci` (`packages/runtime/src/types.ts:86-101`); `pathToNode` (`objective.ts:173-186`) already walks parents. `shapeFirings` already receives an ordered path (`shape-firing.ts:17`). Only the *static* validator and `guidance.ts` need a rule for "no predecessor" |
| Authoring attestations | **Zero.** No authoring wave has filed a transition claim as a format gap. It is attested from the design side — discovered-threat visualisation, the opponent-intent prompt, the prophylaxis/denial readable, and the 2026-08-15 taxonomy — and those are ledger rows from one source |

**The owner's taxonomy, sorted, so the follow-on has a scope and not a mood.** Each item is
tested against the four admission rules applied to a *transition* rather than a position:

| Primitive | Verdict | Note |
|---|---|---|
| Attacks and defences created / removed | **Admissible.** Set difference of attack sets across the move | The `pawnAttacks` before/after test at `pivotal.ts:52-54` is this, narrowed to pawns |
| Lines opened / closed | **Admissible.** `line_blockers` evaluated on both positions | The leaf ships; only the delta is missing |
| Control delta on a square or region | **Admissible.** `direct_attack_count` on both positions | Same shape; note that this is the first authoring use `direct_attack_count` would ever have (§1b) |
| Escape squares removed | **Admissible.** Difference of a piece's destination set | Board geometry, not legality search, or rule 1 fails |
| **Overload — a defender acquiring a second duty** | **Admissible, and the owner's framing is right**: it is a *count* of how many attacked friendly pieces one piece defends, not a judgment that the defender is overloaded. The arithmetic ships and the word does not — the parent's exact ruling for "trapped" (`rfc/archive/structural-reading.md:294-298`) | The name must be the count, e.g. `defended_duties`, never `overloaded` (rule 4) |
| Tempo, irreversibility | **Admissible**, and half-shipped: `irreversibility` (`pivotal.ts:41-58`) already classifies castling, last-of-role and pawn breaks | Tempo *accounting* belongs to `rfc/tempo-vocabulary.md`; only the per-move irreversibility census is here |
| **Repositioning — "back or to the side so it can rotate into a nice slot in two"** | **Admissible, and the owner is right that it is not judgment.** Knight distance to a square set is graph distance: BFS over knight moves on the empty board, a fixed 64×64 table, exactly as Chebyshev is for kings. "This move reduces piece X's distance to square set S" is then a *census over a transition* — the static distance evaluated on both positions and compared | See below: the static half is a widening of `king_distance` (§4b), the useful half is the delta and therefore lands here |
| **Prophylaxis — "prevent their plan"** | **Refused here, and not absorbed.** See F9 | Belongs with `rfc/resistance-spectrum.md`, not with a position-or-transition census |

**Why still not now**, and the reason is unchanged by the cost finding, because cost was never
the objection. Two things are missing and neither is machinery. First, **authoring
attestations**: the roadmap's stated bar is gaps real content has hit twice, and this has hit
content zero times. Second, and decisively, **a consumer for the authorable half**. Its two
consumers are a drill condition and an in-run hint surface, and the hint surface belongs to
`design/05-in-run-experience.md`'s assistance ladder, not to pack vocabulary. Shipping the
grammar before the surface would repeat the exact mistake this repo is currently paying for —
`timingWindow` shipped with `windowOpens` and `luxuryMoveBudget` that **no evaluator reads**
(`apps/server/src/pack-orchestrator.ts:64-73` reduces a window to its closing trigger), and
the result is **0 uses across 135 checkpoints** and a blocked E3 gate. A cheap predicate with
no consumer is still the failure mode with the longest measured record in this codebase; being
cheap is what makes it *tempting*, not what makes it right.

**What the follow-on wave takes, stated so nothing widens silently:** the sibling grammar and
evaluator above; the eight taxonomy rows marked admissible; the extraction of
`capturedRole`/`irreversibility`'s transition analysis and `compare-strips`'s route
reconstruction out of their host features into shared primitives; and the knight/piece
graph-distance metric of §4b's widening note. It does **not** take prophylaxis (F9), tempo
accounting (`rfc/tempo-vocabulary.md`), or any legality- or search-dependent notion of a
threat.

**Promotion trigger, so this is a schedule and not a shelf:** the first authoring wave to file
a transition claim as a format gap, **or** the RFC that ships the discovered-threat surface,
whichever comes first. Whichever it is names this section and inherits its specification. A
`design/BACKLOG.md` row is proposed to carry it, and it should record the extraction framing —
an RFC that shows a category is a lift rather than an invention is a much smaller thing to
accept.

**F5 — grading a plan whose author declared no census.** Refused, mechanised as
`PLAN_CONSEQUENCE_NOT_COMPUTABLE` (§5c). Named separately from F1 because it is the one
refusal that survives *after* intent is recorded.

**F6 — king confinement, king activity, "the king is trapped".** Refused. Confinement is a
legal-move count, which the parent excluded from `piece_reach_count` precisely because "kings
add check and castling semantics" (`rfc/archive/structural-reading.md:255-258`) — rule 1 for
the legality, rule 4 for the name. `queenless-middlegame`'s `white-king-into-the-game` note
says it best from the authoring side: "King activity is placement quality, not a fixed square
this vocabulary can name."

**F7 — pawn colour-complex and pawn-fixedness censuses.** Refused *for this wave*, and the
refusal is a schedule: 6 of the 18 addressable null-signature notes are this family ("The
pawn-and-bishop colour complex is not in the shipped vocabulary", "Closedness has no
arithmetic definition in this vocabulary", "Fixedness of a pawn front is not in the shipped
feature set", "Wing counts and switching distance are outside this vocabulary"). Both are
plausibly exact — a shade census over pawns is arithmetic, and "blocked head to head" is
arithmetic — but neither has been filed by an authoring wave as a gap report, and this wave
is already at five mechanisms. They are wave 4's measured target.

**F8 — a general `piece_zone` over all roles.** Refused, rule 3. No filed gap names a knight
on an edge, and "a knight on the rim" is a verdict with a rhyme. The enum widens when a plan
names one.

**F9 — prophylaxis as a predicate. Refused, and the dependency is named rather than
absorbed.** "This move prevents their plan" is only definable relative to *whose* plan and
*which* opponent would have played it. A position census cannot supply either, and a
transition census cannot either — the missing term is an opponent model, not a board fact.
`rfc/resistance-spectrum.md` is where an opponent model becomes a measured quantity
(`humanConcessionMass`, its §1), so prophylaxis belongs there or downstream of it. This RFC
does not absorb it, does not define a second notion of it, and does not reserve a name for it.
The one prophylactic thing that *is* rung 0 already ships and stays: denial as a square
census — "after a4, the knight can never use b5 again" is `pawn_safe_square` arithmetic
(`design/05-in-run-experience.md` §5), which is why §1b keeps that leaf despite zero authored
uses.

**F10 — `practical_difficulty` as a success condition. Declined, with routing.**
`rfc/resistance-spectrum.md:450-464` §7a hands a learner-side grading consumer to "the
vocabulary lane" and specifies it: a `practical_difficulty` condition carrying
`{threshold, atLeastPlies?}`, evaluated against `concessionRatio` values recorded on the run's
selections. This draft declines it, for three reasons stated in the open rather than by
silence. **(a)** It depends on an unlanded draft's runtime primitive *and* on a recorded field
that does not exist yet (`resistance-spectrum` claims run schema 0.14 and migration 19 and is
awaiting cross-review); taking it would make this RFC unimplementable until that one lands,
which is exactly the coupling the register exists to prevent. **(b)** Zero authoring
attestations, against a wave whose stated bar is two. **(c)** It grades a learner against a
**model measurement** — Maia policy mass — not a board fact. That may well be legitimate:
`material_balance` and `outcome` are already non-positional success conditions, so the
regime is not closed. But admitting a *rung-2* grade needs its own argument about what the
product is asserting when it tells a learner they kept an opponent's error probability high,
and that argument belongs in the open in the RFC that ships it, not as one branch smuggled
into a structural-vocabulary wave. **Routing:** §7a's premise that "0.16 through 0.19 are
claimed" is no longer the blocker — `rfc/validator-integrity.md` declined 0.19 and **0.20 is
free**. The consumer should ride the first draft after `resistance-spectrum` implements, name
that RFC in `Depends on:`, and inherit §7a's specification verbatim. The ledger row
(`design/BACKLOG.md:219`) stays open and this RFC is not its answer.

### 8. Exhaustive dispatch — every widened union, every site (D26)

The parent's law is inherited: **every dispatch over a widened union ends in a `never` binding,
and a missing case is a compile error followed by a runtime refusal.** Three unions widen
(`StructuralFeature`, `SuccessCondition`, and `pack.shapes`'s item type).

| Site | Today | Under this RFC |
|---|---|---|
| `matchesStructuralFeature` (`packages/runtime/src/structure.ts:297-349`) | `never` guard at `:347` | compiler forces `piece_count`, `king_zone`, `king_distance`; guard retained |
| `mirrorFeature` (`structure.ts:223-235`) | `never` at `:233` | **three mirror rules must be written** (§8a); the `never` is what forces them |
| `structuralFeatureKinds` (`structure.ts:449-465`) | exhaustive switch | three cases; each new leaf contributes its own kind fact |
| `structuralIssues` leaf walk (`apps/server/src/pack-validation.ts:120-151`) | `never` → `STRUCTURAL_KIND_UNRECOGNISED` at `:149` | three cases: two with range refusals (§3, §4b), `king_zone` with none |
| `renderStructuralObservation` (`apps/web/src/lib/structural-sentences.ts:7-30`) | `never` at `:28` | compiler forces three observation sentences |
| `renderFeatureSpec` (`structural-sentences.ts:36-61`) | `never` at `:59` | compiler forces three spec sentences |
| `successPredicate` (`apps/server/src/pack-orchestrator.ts:91-122`) | `never` at `:121` | compiler forces the `plan_consequence` arm; it needs the resolved signature, so the function gains a resolver parameter rather than reaching for a global |
| `conditionEvidenceRefs` (`pack-orchestrator.ts:124-137`) | throws on an empty leaf set (**D32**) | gains a `plan_consequence` arm whose first ref is unconditional (§5c); the existing throw is untouched and stays `validator-integrity`'s |
| `pack.shapes` readers — `pack-validation.ts:210-213`, `apps/server/src/pack-orchestrator.ts`, `shapeFirings` call sites, `pack-check.ts` | assume `readonly string[]` | one shared normaliser `shapeReferences(pack): readonly { shape: string; relation: "present" \| "prospective" }[]` in `packages/schema`, exhaustive over the two item forms with a `never` default. **Every** reader goes through it; a reader that destructures the raw array is a review failure |

#### 8a. Mirror rules for the three new leaves

`mirrorExpression` is exhaustive by construction, so each new leaf must state its rule
(`rfc/archive/predicate-wave-2.md:226-233`):

- `piece_count`: `color` flips under `colors` and `both`, unchanged under `files`; `role`,
  `basis`, `comparison`, `count` never change. Identical to `pawn_count`'s shipped rule
  (`structure.ts:231`).
- `king_zone`: **invariant under all three axes.** The edge set and the corner set are each
  closed under file reflection and rank reflection; only `color` flips, under `colors` and
  `both`. Normative and tested — a mirror that changed `zone` would silently invert every
  mirrored mate signature.
- `king_distance`: Chebyshev distance is preserved by every reflection, so `comparison` and
  `count` never change. `color` flips under `colors`/`both`; a `square` target maps by the
  same square map as `pieceOnSquare` (`structure.ts:215-221`); a `piece` target's `color`
  flips under `colors`/`both` and its `role` never changes.

### 9. Reading projection, evidence facts, sentences

`structuralReading` (`packages/runtime/src/structure.ts:383-423`) stays a finite enumerator:

- **`piece_count` replaces `pawn_count` in the projection**: one observation per colour per
  role, twelve in total, `{ kind: "piece_count", color, role, count, squares: [] }`, **never a
  difference** (§3). The `pawn_count` *kind* stays in `STRUCTURAL_FEATURE_KINDS` for order
  stability but is no longer emitted, so no reading contains two spellings of one census. The
  rendered sentence for the pawn case is unchanged — "White has 7 pawns." — which is why wave
  2's browser criterion (`rfc/archive/predicate-wave-2.md:760-764`) stays green without edits.
- **`king_zone`**: one observation per king per holding zone, at most four.
  `corner` implies `edge` and **both are emitted when both hold**; emitting only the "most
  specific" zone would be the projection ranking facts by significance, which
  `rfc/archive/structural-reading.md` §1a forbids.
- **`king_distance`**: exactly **one** observation, the king-to-king distance,
  `{ kind: "king_distance", squares: [both king squares], count }`. The `piece`-target form is
  **not** projected: enumerating every `(color, role)` pair would be the projection walking
  author-query space, which the parent's rule forbids and wave 2 restated for `quantified`.

`StructuralObservation` (`structure.ts:69-80`) gains one optional readonly field,
`zone?: "edge" | "corner"`, and reuses the existing `role` and `count`.
`RULES_EVIDENCE_FACTS` (`packages/runtime/src/evidence-ref.ts:1-26`) gains
`structure-piece-count`, `structure-king-zone`, `structure-king-distance` — eighteen
`structure-*` facts. `structure-pawn-count` stays until wave 4 removes the leaf.

Sentences, fixed strings, held to the parent's banned-word test:

| Detection | Sentence |
|---|---|
| observation `piece_count(white, rook, 2)` | "White has 2 rooks." |
| observation `piece_count(black, queen, 0)` | "Black has 0 queens." |
| spec `piece_count(white, bishop, count, atMost, 1)` | "white has at most 1 bishop" |
| spec `piece_count(white, rook, difference, atLeast, 1)` | "white has at least 1 more rook than black" |
| observation `king_zone(black, edge, h5)` | "Black's king on h5 stands on the a-file, the h-file, the first rank or the eighth rank." |
| spec `king_zone(black, corner)` | "black's king stands on a1, a8, h1 or h8" |
| observation `king_distance(e4/e6, 2)` | "The kings on e4 and e6 stand 2 king-moves apart." |
| spec `king_distance(white, square e8, atMost, 2)` | "white's king is at most 2 king-moves from e8" |
| spec `king_distance(white, piece black rook, atMost, 3)` | "white's king is at most 3 king-moves from the nearest black rook" |
| condition `plan_consequence("minority-attack")` | "the structural consequence authored for Minority attack (a3, Rab1, b4-b5) is present" |

No sentence says *trapped*, *confined*, *active*, *close enough*, *executed*, *achieved the
plan*, or any word on the parent's banned list. The `difference` form renders as counting, per
wave 2's ruling.

### 10. Content demonstrations

Six shipped artifacts change, each an acceptance demonstration and each verified this pass:

1. **`mate-two-bishops.json`** — the degrade condition gains the `piece_count` form of the
   claim its own summary makes ("a loose bishop"), as `any[…]` with the shipped
   `bishop_on_shade` arm retained: the shade arm states the two-complex wall is gone, the
   count arm states a bishop is gone, and they are not the same claim. Probe table asserts
   `[false, true, true]` for the count arm across both-bishops / one-bishop / bishopless.
2. **`trajectory-mate-bishop-knight.json`** — `king-on-the-edge` becomes one `king_zone` leaf
   (765 bytes → one node, 0 disagreements over the spine and over all 63 legal king
   placements); the six existence-hack leaves become three `piece_count` pairs; leg 3 gains
   the `king_distance` degrade condition of §4b. The corner *box* stays a `quantified` region
   with its provenance note intact — the ply cap, not the vocabulary, is why.
3. **The other 37 `piece_reach_count` existence leaves** across eleven packs are rewritten to
   `piece_count`, and equivalence is asserted by evaluating old and new against every position
   of every authored spine.
4. **`carlsbad-minority-attack.json`** — the objective's inline structural condition becomes
   `{ "kind": "plan_consequence", "planClassId": "minority-attack", "to": "achieved" }`,
   resolving through the shipped `shapePlan` to the `carlsbad` entry's
   `white-minority-attack` signature. A negative fixture asserts that
   `planClassId: "central-break"` is refused with `PLAN_CONSEQUENCE_NOT_COMPUTABLE`, quoting
   the author's own note as the test comment. **This is the demonstration that the RFC
   refuses to over-deliver**: the pack still grades one of three plans, and now says so.
5. **The three prospective shape references** gain `relation: "prospective"`; the other 22
   stay bare and become validator-checked. A negative fixture flips one of the three to
   `present` and asserts `SHAPE_REFERENCE_NEVER_PRESENT`.
6. **Six `pawn_count` uses** (five packs, `content/shapes/opposite-coloured-bishops.json`)
   are rewritten to `piece_count`, leaving the repo with zero deprecation warnings at landing.
   The OCB entry bumps 0.2.0 → 0.3.0.

### 11. Boundary conditions, enumerated

| Condition | Behaviour |
|---|---|
| `piece_count` with `role: "king"` and `count: 1`, `equal` | Legal and constant-true in any legal position; **not** refused — 1 is inside the attainable range and the leaf is well-formed. Authors who write it are stating an invariant, which is harmless |
| `piece_count(count)` with `count` above `max(role)` | Refused (`PIECE_COUNT_OUT_OF_RANGE`) — a constant |
| `piece_count(difference)` with a negative `count` | Legal; "white at most −1" is the same census as "black at least 1" and neither spelling is privileged (wave 2's ruling, inherited) |
| `piece_count` under `mirrored` | `color` flips under `colors`/`both`; `role`/`basis`/`comparison`/`count` never change |
| `king_zone` with no king of `color` | False, not an error |
| `king_zone(corner)` when `king_zone(edge)` also holds | Both true; both projected. Corner implies edge and the projection does not choose between them (§9) |
| `king_zone` under `mirrored` | `zone` never changes; `color` flips under `colors`/`both` |
| `king_distance` with an empty `piece` target set | False, not an error |
| `king_distance` to `{piece, own colour, king}` | Refused (`KING_DISTANCE_SELF_TARGET`) — constant 0 |
| `king_distance` with `count` outside 0–7 | Refused (`KING_DISTANCE_OUT_OF_RANGE`) — a constant |
| `king_distance(atMost, 1)` to the enemy king | Legal and constant-false in a legal position (adjacent kings are illegal). **Not** refused: unlike the self-target case the constancy follows from chess legality rather than from the leaf's own arithmetic, and the validator does not adjudicate legality of hypothetical positions |
| `plan_consequence` whose resolved signature is `null` | Refused (`PLAN_CONSEQUENCE_NOT_COMPUTABLE`) |
| `plan_consequence` on a plan class with no `shapePlan` | Refused (`PLAN_CONSEQUENCE_NO_SHAPE_PLAN`) |
| `plan_consequence` with no shape lookup supplied (emitters, `verify-draft`) | Only the two pack-local refusals fire, matching `pack.shapes`'s shipped rule (`pack-validation.ts:206`, `:212`) |
| Two `plan_consequence` conditions naming different plan classes in one objective | Legal. They are independent censuses, and a position can satisfy both; deciding which one "the learner meant" is F1 |
| `plan_consequence` in a `run_trajectory` top-level objective | Refused by the existing `TRAJECTORY_TOP_LEVEL_CONDITIONS_UNSUPPORTED` (`pack-validation.ts:334-335`); legs may carry it |
| A `prospective` shape reference | Never fires, never validated against the spine, never resolvable as a `plan_consequence` source |
| The same shape id in both a bare and an object form | Refused (`SHAPE_REFERENCE_DUPLICATE`) — `uniqueItems` cannot see it |
| A deprecated `pawn_count` or `scope: "every"` leaf | **Warning**, not error; the pack still loads and still evaluates identically. Wave 4 makes it an error |
| Community shapes registered under grammar 0.2 | Still valid; every change here is additive or a warning, and registered documents are immutable |
| A nineteenth leaf kind added later without a case in any dispatch site | Compile error at every site in §8's table, then `STRUCTURAL_KIND_UNRECOGNISED` — never a silent skip |

### 12. Schema changes

**Pack schema 0.17 → 0.18** (`DRILL_PACK_SCHEMA_VERSION`, `packages/schema/src/index.ts:2`;
`$id` at `schemas/drill_pack.schema.json:3`). Additive; pack digests are content digests and
are unaffected by the `$id` (`packages/schema/src/drill-pack/digest.ts:59-71` digests the pack document, which does not carry the schema `$id`), so the only
digests that move are the ten files §10 edits. Additions: three branches in
`$defs/structuralFeature`; a sixth branch in `$defs/successCondition` (**seventh after 0.17** — see the header ordinal note); a new
`$defs/kingDistanceTarget`; `shapes` items become the two-form `oneOf` of §6. Every new object
is `additionalProperties: false` — the pinned passthrough inventory must still count exactly
**two** sites (`/$defs/feedbackClaim`, `/$defs/provenance`,
`packages/schema/src/drill-pack.test.ts:87`).

**Shape-entry schema 0.2 → 0.3** (`SHAPE_ENTRY_SCHEMA_VERSION`,
`packages/schema/src/index.ts:3`; `$id` at `schemas/shape_entry.schema.json:3`): the three
feature branches and `$defs/kingDistanceTarget` land in the duplicated `$defs` copy
(`shape_entry.schema.json:47-75`). Nothing else in the entry format changes; `plan.success`
(`:77`) and the `shapes` relation are untouched from the entry side.

**No migration** (header). Nothing persisted changes shape.

### 13. Cost

`piece_count` is an O(piece-count) board scan; `king_zone` is O(1); `king_distance` is O(1) for
a square target and O(piece-count) for a piece target. The reading projection changes from two
`pawn_count` observations to twelve `piece_count` observations plus at most four `king_zone`
and one `king_distance` — fifteen more observations in the worst case. `plan_consequence` adds
one map lookup at load and **zero** runtime cost: it compiles to the predicate
`structural_feature` already compiles to. `SHAPE_REFERENCE_NEVER_PRESENT` adds one spine replay
per pack at validation time, on the path that already replays the spine for reasoning
checkpoints.

The parent's measured-not-gated ruling applies unchanged (`docs/structural-reading.md:85-89`):
the structure test re-records a non-vacuous sample, 100 ms remains the worry threshold, and no
wall-clock pass/fail gate is added.

**Baselines to re-verify on the implementing checkout** (this draft verified the content and
evaluator facts, not the suite): `DRILL_PACK_SCHEMA_VERSION` is `"0.15"` and
`SHAPE_ENTRY_SCHEMA_VERSION` is `"0.2"` **on the current tree**, so this RFC's 0.18 assumes
0.16 and 0.17 have landed; if either has not, the implementer rebases the number in
`rfc/README.md` rather than skipping ahead.

## Deviations from design

1. **The roadmap's item 1 is "intent-relative success"; this RFC ships an intent-*blind*
   condition and refuses the intent-relative half.** The dossier and `design/BACKLOG.md:163`
   both describe the target as grading the plan the learner committed to. The deviation is
   forced by evidence the ledger row predates: the commitment is not recorded anywhere
   (§5d), and `design/research/authored-transitions-and-features.md:38-47` measured the
   ceiling at 45% of authored plans even once it is. Shipping the join key and the refusal is
   the honest subset; shipping the whole thing would require inventing both the data and the
   verdict.
2. **`design/BACKLOG.md:163` says "the predicate machinery ships and is authorable; only
   feature-level vocabulary (Q4b) is missing."** Measured against the corpus this is now
   false in an instructive way: for `carlsbad-minority-attack` the vocabulary was never
   missing — the *binding* was, and the pack compensated by grading three plan choices with
   one plan's census. The row's diagnosis was right about the mechanism and wrong about which
   piece was absent. Proposed as a ledger correction, not a `design/` edit (law 5).
3. **D34 is filed as "no king-geometry vocabulary" and this RFC closes only the predicate
   half.** The row's second clause — `reach_structure`, a pawn word, doing duty for a king
   target — is objective-type vocabulary and is left to the objective-type widening
   `design/BACKLOG.md:163` tracks. Splitting a defect row across two RFCs is worth naming
   rather than leaving the row to look closed.
4. **The shape-reference relation is not in `design/`.** `design/BACKLOG.md:205` carries the
   gap as "shape references cannot distinguish *hands-off-to* from *present-now*" and does not
   say where the distinction should live. Putting it on the reference rather than in the
   grammar is this RFC's choice, with the rule-1 argument in §6.
5. **The transition category (§7 F4) has no design home yet.** It touches
   `design/05-in-run-experience.md` §3 (the assistance ladder's rung 0) and the in-run
   assistance batch, and the RFC that ships the surface should place it there. A BACKLOG row
   is proposed; no design doc is edited.

## Acceptance criteria

1. **`piece_count` table.** All six roles, both bases, against hand-built positions including
   zero counts, promoted-piece counts above the starting maximum, equal counts and negative
   differences. The reading projection emits exactly **twelve** per-colour-per-role
   observations, **no** `pawn_count` observation and **no** difference observation; a
   serialised reading contains no field named `score`, `rank`, `severity` or `favours`.
2. **The existence-idiom equivalence, asserted.** A test evaluates
   `piece_reach_count(C, r, any, atLeast, 0)` against `piece_count(C, r, count, atLeast, 1)`
   over every position of every authored spine × 2 colours × 4 reach roles and asserts
   **0 mismatches** (this draft measured 4528 checks). The 43 rewritten leaves are asserted
   verdict-identical to their originals over the same positions.
3. **The dead condition, as a regression test.** `not(piece_reach_count(white, bishop, every, atLeast, 0))`
   evaluates `false` on a bishopless position, with a comment citing `25b4584` and
   `design/research/authored-transitions-and-features.md:487-498`; the `piece_count(atMost, 1)`
   form evaluates `[false, true, true]` across both-bishops / one-bishop / bishopless.
4. **`king_zone` equivalence and mirror invariance.** `king_zone(black, edge)` agrees with the
   pre-RFC four-arm `quantified` fan on **all 63** legal black-king placements and on every
   position of the B+N spine, first firing at **ply 8** in both forms; `king_zone(black, corner)`
   first holds at **ply 34**, and a test comment records that this is 26 plies after the leg-2
   entry and therefore outside the 20-ply cap. A mirror table asserts `zone` is invariant under
   all three axes and `color` flips under `colors`/`both`.
5. **`king_distance` table.** Both target arms; Chebyshev values 0–7 including a piece target
   with several matching pieces (minimum taken) and with none (false, no throw);
   `KING_DISTANCE_OUT_OF_RANGE` and `KING_DISTANCE_SELF_TARGET` fixtures fail
   `validatePackDocument` with those exact codes; a mirror table asserts distance invariance
   under all three axes. The B+N leg-3 condition of §4b is false at every position of leg 3 on
   the authored line and true at plies 2 and 8, which are outside it.
6. **`plan_consequence` resolution and refusals.** `carlsbad-minority-attack` compiles the
   condition to the same `ObjectivePredicate` its inline structural condition compiles to
   today, asserted by deep equality; fixtures for `PLAN_CONSEQUENCE_UNKNOWN_PLAN_CLASS`,
   `PLAN_CONSEQUENCE_NO_SHAPE_PLAN` and `PLAN_CONSEQUENCE_NOT_COMPUTABLE` (the last using
   `central-break`, with the author's note quoted in the test) fail validation with those exact
   codes and make `make pack-check FILE=<fixture>` exit non-zero, asserted on the exit code;
   with no shape lookup supplied only the two pack-local codes fire.
7. **No D32 second instance.** A `plan_consequence` whose resolved signature contains only
   `quantified`/`pieceOnSquare` nodes produces evidence refs of length ≥ 1 and does **not**
   throw, asserted directly against `conditionEvidenceRefs`, with a comment naming D32 and
   `validator-integrity` as its owner.
8. **Shape-reference relations.** All 25 references resolve through the shared normaliser;
   the 22 `present` references pass `SHAPE_REFERENCE_NEVER_PRESENT` and the three
   `prospective` ones are exempt; a fixture flipping `opposite-castling-race` to `present`
   fails with that code; a `prospective` reference contributes no firing to `shapeFirings` over
   the authored spine; `SHAPE_REFERENCE_DUPLICATE` has a fixture. A `@ts-expect-error` sentinel
   asserts the normaliser is exhaustive over the two item forms.
9. **Deprecations.** `PAWN_COUNT_DEPRECATED` and `PIECE_REACH_SCOPE_EVERY_DEPRECATED` are
   emitted at severity `warning`, do **not** fail `pack-check` or `shape-check`, and are
   asserted to fire on a fixture each. After §10's rewrites, `make pack-check` and
   `make shape-check` over the whole corpus emit **zero** deprecation warnings — the number
   that makes wave 4's removal safe.
10. **Exhaustive dispatch (D26).** Every site in §8's table carries a `never`-checked default
    with a `@ts-expect-error` sentinel-variant test, including `mirrorFeature`, `successPredicate`
    and the new `shapeReferences` normaliser.
11. **One vocabulary, four places, both copies.** The sync test is extended: eighteen
    `STRUCTURAL_FEATURE_KINDS`, the `structuralFeature` `oneOf` `kind` consts in **both**
    schema files, eighteen `structure-*` facts in `RULES_EVIDENCE_FACTS`, and the sentence
    tables are the same set; a shared fixture list of all eighteen leaves and all six success
    conditions round-trips through the schema and the runtime unions in both directions.
12. **No sentence carries a verdict.** Every new observation, spec and condition sentence is
    rendered against fixtures and asserted free of the parent's banned list, case-insensitive
    whole words, plus `trapped`, `confined`, `active`, `executed`, `followed`.
13. **Browser.** The structural-reading disclosure (`tests/browser/drill.spec.ts:337` region)
    still opens closed with no numeral; the reading still contains "White has 7 pawns." and
    "Black has 7 pawns." — now emitted by `piece_count`, asserting the projection swap is
    invisible to the surface — and the pack projection still carries no `successConditions` key.
14. **Schema hygiene.** `DRILL_PACK_SCHEMA_VERSION` is `"0.18"`, `SHAPE_ENTRY_SCHEMA_VERSION`
    is `"0.3"`, both `$id`s match, all committed packs and all 23 shape entries validate, and
    the passthrough-inventory test still counts exactly two `additionalProperties: true` sites.
15. **Envelope.** The instrumented structure sample is re-recorded with the widened projection;
    the test asserts a non-vacuous finite sample only.
16. **`pnpm verify` and `pnpm test:browser` pass.** No existing test is deleted. Any
    pre-existing failure on the implementing checkout is fixed on the mainline before this
    RFC's criteria are measured, not absorbed into them.
17. **Canonical documentation.** `docs/structural-reading.md` describes eighteen kinds, the two
    deprecations with their wave-4 removal date, and the three new mirror rules;
    `docs/drill-pack-format.md` records 0.18, the sixth success-condition kind and the shape
    relation; `docs/shape-library.md` records shape-entry schema 0.3 and that
    `plan.success.signature` is now a resolution target for pack grading;
    `docs/explanation-grounds.md` records eighteen `structure-*` facts.
18. **Ledger.** The BACKLOG rows this ships are flipped in the landing commit (RFC completion
    protocol): the existence-hack half of `Shape plans are 73% uncomputable by their own
    authors`, D34's predicate half, the shape-reference clause of the opening-wave frictions
    row, and the plan-objective friction row's binding half. The rows this RFC *proposes* —
    the sunset rule (§1b), the transition category (§7 F4), the F7 wave-4 target, and
    Deviation 2's correction — are added as new rows, not folded into old ones.

## Open questions

1. **Does `plan_consequence` earn its keep at 16 of 99 plan classes?** The condition is
   authorable today for the 16 plan classes whose `shapePlan` resolves to a non-null
   signature. The alternative reading is that the honest fix is authoring discipline
   (write shape entries, then reference them) and that a new condition kind is premature. This
   draft's answer is that the 16 are exactly the cases where a pack currently grades one plan's
   census as if it were the objective for all of them, and that making the asymmetry visible is
   worth the branch — but this is the item most worth an owner or reviewer overturning.
2. **Should `prospective` shape references be excluded from `pack.shapes` entirely and given
   their own field?** Keeping one array preserves every existing reader and the `shapePlan`
   join; a separate `handsOffTo` array would make the inertness structural rather than
   semantic. Resolved in favour of one array on backward-compatibility grounds; not obviously
   right.
3. **Is `king_zone`'s `edge` the right primitive, or is `distance to the nearest edge` the
   general one?** `king_distance` cannot express it (an edge is not a square or a piece), and a
   `king_zone` with a numeric band would reintroduce a free constant. Left as two exact zones;
   a filed gap naming a band would reopen it.
4. **Wave 4's removals need a registry sweep, and no sweep tooling exists.** §1a schedules two
   schema-branch removals behind "confirm `registered_shapes` is clear". The query is trivial
   and the tool is not written. Deferred to wave 4, named here so it is not discovered then.
5. **The transition category's promotion trigger is disjunctive** (§7 F4) and either branch
   may fire first. If the discovered-threat surface RFC lands first it will own the grammar,
   which means this RFC's §7 F4 is specification that another RFC inherits rather than
   implements. Whether that is a clean hand-off or a lost specification is a process question
   for the owner.
6. **Is "cheap plus specified plus no consumer" the right place to stop?** F4's extraction
   inventory makes the transition category materially cheaper than this draft first assessed,
   and a reasonable reviewer could read that as reason to ship the grammar now and let the
   surface catch up. This draft holds the line on the `timingWindow` precedent, but the line
   is a judgment about sequencing rather than a rule, and it is the second item most worth
   overturning after question 1.
7. **F10 declines a hand-off that `rfc/resistance-spectrum.md:450-464` addressed to this
   lane.** If the owner reads the vocabulary wave as the right home for a rung-2 success
   condition, the correct move is to say so and let a follow-on take 0.20 with the admission
   argument written out — not to fold it into 0.18, where it would couple this RFC to an
   unlanded migration.

## Changelog

- 2026-08-15: created. Executes `design/research/authored-transitions-and-features.md` §6 in
  its own attestation order. Admits `piece_count`, `king_zone`, `king_distance`, the
  `plan_consequence` success condition, and the `present`/`prospective` shape-reference
  relation. Deprecates `pawn_count` and `piece_reach_count`'s `scope: "every"` arm with a
  wave-4 removal date and a stated sunset rule; declines to retire the seven zero-use kinds
  under admission rule 3's disjunction, with the pack-versus-shape usage measured. Refuses,
  each with the deciding rule: intent-relative grading (the answer is not recorded, and the
  ceiling is 45% once it is), structure memory (rule 1, plus the one-position evaluator
  signature), a castling-rights leaf (rule 3, with the arithmetic), king confinement (rules
  1 and 4), a general `piece_zone` (rule 3), the pawn colour-complex family (scheduled for
  wave 4 with its measured count), and — after assessment — the transition-predicate
  category, agreed real, specified to the evaluator signature, and declined for this wave on
  the `timingWindow` precedent. Pack schema 0.18, shape-entry schema 0.3, no migration. All
  content facts in this draft were produced by running the shipped evaluator over the shipped
  corpus.
- 2026-08-15 (coordinator addendum, folded in). **§7 F4 reframed from "invention deferred" to
  "extraction deferred"** after verifying that transition analysis already ships at
  `packages/runtime/src/pivotal.ts:32-39` and `:52-54` and piece-route reconstruction at
  `packages/runtime/src/compare-strips.ts:40-46`, alongside the already-noted
  `structuralDelta`/`vacationReading`; the shape-library §0 ruling is named as the precedent.
  F4 gains the owner's move-primitive taxonomy sorted into admissible and refused, an explicit
  statement of what a follow-on wave takes, and the finding that **overload is a count, not a
  judgment** (admissible, but never named `overloaded`). The refusal itself is unchanged and
  its ground is restated: cost was never the objection; zero authoring attestations and no
  consumer for the authorable half were. **§4b gains the widening path** for a generalised
  `piece_distance` with a per-role graph metric, including the knight BFS the owner's
  repositioning case needs — admitted as a census, placed with the transition category because
  its useful form is the delta. **New F9** refuses prophylaxis and names
  `rfc/resistance-spectrum.md` as its home rather than absorbing it. **New F10** declines that
  draft's §7a `practical_difficulty` hand-off with three stated reasons and routes it to 0.20.
  Header corrected: `rfc/validator-integrity.md` declined 0.19, so 0.19 is free and this draft
  neither takes nor reserves it. Two open questions added (6, 7).
