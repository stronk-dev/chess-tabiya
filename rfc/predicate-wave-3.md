# RFC: Structural predicate vocabulary, wave 3 — census, kings, and the intent boundary

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/research/authored-transitions-and-features.md` §6 (the
  evidence-ordered predicate roadmap this RFC executes, in its own attestation order);
  `design/03-product-breadth.md:289` gate **B9** (the vocabulary gate; note the *four admission rules* themselves live only in `rfc/archive/structural-reading.md:271-278`, not in the B9 row — attribution corrected this cross-review);
  `design/05-in-run-experience.md:361-417` §5c (grade a plan by its structural
  consequence); `design/BACKLOG.md` rows by title (line numbers drift; the titles are stable): *A plan drill's
  objective cannot be expressed*, **D34** *No king-geometry vocabulary*, *Opening-wave authoring
  frictions (2026-08-14)* (hands-off-to vs present-now), *Shape plans are 73% uncomputable by
  their own authors*, *Shape plan success signatures are INERT — evaluated nowhere*, *Content
  transfer test*, and *Declared-vs-executable vocabulary law*; `docs/structural-reading.md`; `docs/shape-library.md`
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
  (`tempo-vocabulary`). **0.19 is free** — `rfc/archive/validator-integrity.md` deliberately declined
  it and claims nothing versioned — and this draft neither takes nor reserves it;
  `rfc/resistance-spectrum.md` makes no pack-schema claim at all. Run schema **0.13** and
  migration **18** are untouched, so nothing here contends with `resistance-spectrum`'s 0.14
  and 19. This draft rebases rather than renumbering unilaterally if either predecessor stalls.
- **Shape-entry schema:** **0.3** — **yes, a bump is required.**
  `schemas/shape_entry.schema.json` carries a duplicated copy of `$defs/structuralFeature`
  (`:47-65`) and `$defs/structuralExpression` (`:66-76` — this draft wrote `47-75`, truncating
  by one line). Re-verified this cross-review: **ten** `$defs` are byte-identical across the two
  schema files, and `packages/schema/src/shape-entry.test.ts` already asserts
  `schema.$defs.structuralFeature` deep-equals the pack copy — so drift is caught, but the
  branches still have to be authored twice; the three new leaves land in both copies or shape triggers
  and plan signatures silently cannot use them. `SHAPE_ENTRY_SCHEMA_VERSION`
  (`packages/schema/src/index.ts:3`) and the `$id` at `schemas/shape_entry.schema.json:3` move
  together. Nothing else in the entry format changes — §5 resolves *against* the shipped
  `plan.success.signature` (`shape_entry.schema.json:77`) and does not touch it.
- **Planning:** `planning/predicate-wave-3/` (once implementing)


> **R2 MEASUREMENT LANDED, 2026-08-15 — §7 F4's repositioning row and §4b's
> delta claim are now contradicted by evidence and must be amended before any
> transition wave inherits them.** `design/research/move-primitive-computability.md`
> measured routing over 593 corpus transitions: exact arithmetic, perfect recall
> (9/9), and a **98.7% false-positive rate** — 0.0% precision under the sharpest
> filter. §4b routes the *delta* to the transition wave as "this metric's clearest
> use"; the measurement says the **static** leaf is the attested, discriminating
> half, corroborated by six shape-library notes that all name the static quantity.
> The target square set is the judgment. Routing renders an authored destination;
> it does not detect intent. F4's promotion trigger is **not** met by this research
> (it requires an authoring wave to file a transition claim, or the RFC that ships
> the discovered-threat surface) — the schedule is unchanged, the inheritance is not.

> **INERT-SIGNATURE FINDING ABSORBED, 2026-08-15 — this is not a blocker, but §5 was
> written as though it were resolving against a live field, and it is not.**
> Re-verified in source this pass: a shape entry's **trigger** is evaluated in three
> places — `packages/runtime/src/shape-firing.ts` (`shapeFirings`),
> `apps/server/src/guidance.ts` (`guidanceShapes`), and `apps/server/src/shape-validation.ts`
> (the `INITIAL_FEN` fires-at-start refusal) — while **`plans[].success.signature` is
> evaluated against a position NOWHERE.** Its only two non-test consumers are
> `shape-validation.ts` (`structuralIssues` — *well-formedness*, not satisfiability) and
> `apps/web/src/lib/ShapePanel.svelte` (rendered as a sentence). `shapePlan` likewise has no
> evaluating consumer: `pack-validation.ts` checks the reference *exists*
> (`SHAPE_PLAN_REF_UNLISTED`, `SHAPE_PLAN_UNKNOWN`) and two Svelte sheets render the plan's
> prose. Ledger row **`Shape plan success signatures are INERT — evaluated nowhere`**
> (`design/BACKLOG.md`).
>
> **Consequence, stated in the direction that matters.** `plan_consequence` does not *depend*
> on the field firing — §5b compiles the resolved signature into a `fenPredicate`, which **is**
> the mechanism that makes it fire for the first time. So this RFC absorbs the finding rather
> than depending on a wave that fixes it. But three things follow and are now written into the
> spec rather than assumed:
> **(i)** the standing "**73% uncomputable**" framing is wrong in the worse direction — the 28
> signed plans are equally unenforced, so the corpus is **100% unmeasured**, not 73%, and every
> "73%" in this file is now qualified (§2, §5c, criterion 18);
> **(ii)** a resolved signature is an **unexercised expression**, well-formed but never once
> evaluated against a board, so `plan_consequence` must carry the same satisfiability refusal
> §6 gives shape *references* — added as `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` (§5c);
> **(iii)** the resolution is **not** free plumbing: `objectiveRules`/`successPredicate`
> (`apps/server/src/pack-orchestrator.ts`) take only the pack, `orchestratePackStart`/
> `orchestratePackMove` are called with `pack.document` alone, and `DrillService`'s
> `#shapes` is `ShapeRegistry | undefined`. §5b's "no new runtime path" claim is corrected and
> the registry-absent behaviour is specified (§5b, §11).

> **ORDINAL RECONCILED by claude (register coordinator), 2026-08-15.** This RFC
> describes `plan_consequence` as a **sixth** `$defs/successCondition` arm. On the
> 0.16 tree `successCondition` has exactly five arms, so that was correct when
> written — but `rfc/tempo-vocabulary.md` (pack **0.17**, cross-reviewed and
> codex-ready) takes the sixth arm with `timing_window`. **At 0.18,
> `plan_consequence` is the SEVENTH arm.** Every "sixth" below that refers to this
> RFC's own `successCondition` branch reads as "seventh" if 0.17 lands first.
> Neither RFC breaks if the other does not ship — verified independently by the
> tempo cross-review — so this is a numbering reconciliation, not a dependency.


> **STATUS NOTE, claude 2026-08-15 — which open questions block acceptance.** Codex correctly
> declined to implement while this read `draft` with seven open questions and an uncommitted
> review in the tree. The review is now committed. Of the seven:
>
> - **Q2, Q3, Q4, Q5 are recorded judgments, not blockers.** Each states a decision, its
>   reasoning and what would reopen it. They do not gate implementation.
> - **Q1, Q6 and Q7 are owner-facing** and are with the owner now. Q1 (does `plan_consequence`
>   earn its keep at 16 of 99 plan classes) is the one the draft itself calls most worth
>   overturning; Q6 is the sequencing judgment on the transition grammar; Q7 is a hand-off
>   `resistance-spectrum` §7a addressed to this lane and this draft declines.
>
> **Everything except `plan_consequence` (§5) is independent of Q1 and can be implemented
> today** — `king_zone`, `king_distance`, `piece_distance`, `piece_count`, the `pack.shapes`
> relation, both retirements and the shape-entry 0.3 bump have no dependency on it.

## Summary

Wave 2 shipped on 2026-08-14 and was spent within a day. The 2026-08-15 dossier re-ran the
shipped evaluator over 35 packs and 23 shape entries and produced an attestation-ordered
roadmap; this RFC executes the top of that list and refuses the rest by name.

Three findings set the shape of the wave. **Every `piece_reach_count` leaf in the corpus is the
same `scope: "any"`/`atLeast 0` existence hack** — verified this pass, **43 of 43** in
`content/drafts` and **143 of 143** once `content/shapes` is included (§3's scoping note), and
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
roles), `king_zone` (`edge`/`corner`), and `piece_distance` (empty-board graph distance, per
subject role, to a named square or to the nearest piece of a named kind; **admitted in its
general form by owner ruling 2026-08-15**, which is why no separate `king_distance` ships) —
**one success-condition kind**, `plan_consequence`, which binds a graded condition
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
of its consumer is precisely what produced `timingWindow`'s 0 uses across every checkpoint in
the corpus (**145** on the current tree; this draft's "135" was a trigger count and was already
one off — 134 — on the tree it was measured against. The zero is what carries the argument).
F4 sorts the owner's move-primitive taxonomy, states what a follow-on wave takes, and names
its promotion trigger.

## Motivation

### 1. The roadmap, and what this wave takes from it

`design/research/authored-transitions-and-features.md:420-428` lists every gap attested in
two or more independent waves, ordered by attestation. Verdicts:

| # | Gap | Attestations | This RFC |
|---|---|---|---|
| 1 | **Intent-relative success** | 4 | **Split.** The authorable half ships as `plan_consequence` (§5). The intent-*relative* half is refused with its blocker named (§7 F1) |
| 2 | **King geometry** (D34) | 4, +9 measured this pass | **Admitted**: `king_zone`, `piece_distance` (§4). Distance is admitted in its general per-role form by owner ruling, not as a king-only leaf |
| 3 | **Timing / tempo** | 2 | **Not mine.** `rfc/tempo-vocabulary.md` owns it (§Scope) |
| 4 | **Shape-reference modality** | 2, +3 of 3 measured | **Admitted** as a reference relation, not a predicate (§6) |
| 5 | **Per-leg authoring** | 2 | **Not mine.** `rfc/archive/authoring-frictions.md` §5 owns the per-leg field it needs (implemented as `ffc9817`; moved to the archive after this draft) |
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
| `piece_reach_count` leaves in `content/drafts` | **43** across 13 pack files, of which `scope: "any"`/`atLeast 0`: **43 of 43** |
| `piece_reach_count` leaves in `content/shapes` (re-counted this cross-review) | **100** across 13 shape files, `scope: "any"`/`atLeast 0`: **100 of 100** — so `scope: "every"` has **0** uses corpus-wide, and the rewrite surface is **143**, not 43 (§3) |
| `piece_reach_count(C, r, any, atLeast, 0)` vs `piece_count(C, r, count, atLeast, 1)` | **4528** position × colour × role checks over all 35 packs' spines, **0 mismatches** |
| `mate-two-bishops.json`'s pre-`25b4584` condition | `false` on **all 18** spine positions and on both-bishops / one-bishop / no-bishop probes |
| `king_zone(black, edge)` vs the shipped 4-arm `quantified` fan | **0 disagreements** across the 39-ply B+N spine **and** across all **3612** legal two-king placements; both first fire at **ply 8**. (This draft first wrote "all 63 legal black-king placements", which is arithmetically impossible — 63 is 64 minus the white king's own square, a *candidate* count, and at most 60 of them are legal. Re-run exhaustively over every legal (wK, bK) pair: **3612 pairs, 0 disagreements**.) |
| Shape references | **25** references, **22** fire on their pack's spine, **3** do not — the same three the dossier names |
| Shape-library plans | **103**, of which **75** (73%) ship `signature: null` |
| Plan classes in packs | **99**, of which **44** carry `shapePlan`, of which **16** resolve to a non-null signature and **28** to `null` |

**Two corrections to this table, both landed after it was measured, both making it worse.**
First, the corpus moved: shape entries were rewritten in `ae8aab7` and `authoring-frictions`
landed as `ffc9817` (pack schema **0.16**), and
`design/research/move-primitive-computability.md` re-counted **78** `signature: null` plans
across **25** shape entries on the newer tree. Every count in this table is a *shape* claim,
not an *argument* claim — none of the verdicts below turns on the third digit — but the
implementer re-measures on the landing checkout rather than quoting these (criterion 2).
Second, and structurally: **the 73% understates the problem, and the true figure is 100%.**
`plans[].success.signature` is evaluated by no shipped code path (header finding), so the
non-null signatures are not "the computable quarter" — they are unenforced in exactly the way
the null ones are. The corpus is **100% unmeasured**, not 73% uncomputable. Every use of the
73% framing in this file is qualified accordingly, and §5c gains the refusal that follows.

The last row is the single most important number in this RFC and it is stated up front, with
its caveat attached: **the top-attested gap is closable, today, for 16 of 99 declared plan
classes — and those 16 signatures have never once been evaluated against a board.** §5 is
designed so that the other 83 are *visibly* ungradable rather than silently graded by
someone else's census, and §5c is designed so that a member of the 16 that turns out to be
unsatisfiable is refused rather than graded.

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
- **Per-leg `shapes` / `opponentPolicy`.** `rfc/archive/authoring-frictions.md` §5 owns the per-leg
  surface and explicitly scopes out the rest (`rfc/archive/authoring-frictions.md:91-94`; implemented as `ffc9817`, moved to the archive after this draft was written).
- **`intent_capture`'s validated-answer slot.** `rfc/archive/authoring-frictions.md:85-90` scopes it
  out as needing "a new run event, a run-schema bump, a migration and a client interaction
  surface — that is a whole RFC". This RFC agrees and does not claim it (§7 F1).
- **Opponent modelling of any kind.** `rfc/resistance-spectrum.md` owns `humanConcessionMass`
  and the practical-difficulty spectrum. Two things flow from that boundary and both are
  refusals in §7: prophylaxis (F9) and the `practical_difficulty` success condition its §7a
  hands to "the vocabulary lane" (F10). Neither is absorbed and neither is re-specified here.
- **D32** (`design/BACKLOG.md`, row *A structural condition can pass `pack-check` and throw at
  runtime*) — **the defect changed shape after this draft was written.** `conditionEvidenceRefs`
  no longer throws a bare `TypeError`: `ffc9817` gave it a `pointer` parameter and a named
  `PackCompileError("STRUCTURAL_CONDITION_HAS_NO_FEATURE")`. The throw is still a throw, but it
  is no longer anonymous, and the ledger row's wording is now stale. **`validator-integrity` owned the fix — it **implemented and archived mid-cross-review, 2026-08-15**, and claimed NOTHING versioned; it declined 0.19** (contradiction corrected by claude as coordinator 2026-08-15; this draft's own header, §832 and changelog already said so). §5 is
  designed so the *new* condition kind can never reach that throw (§5c); the existing bug is
  not fixed here.
- **Objective-type vocabulary.** D34's second half — `reach_structure` doing duty for a king
  target — is an *objective type* problem, not a predicate problem, and belongs with the
  objective-type widening the ledger row *A plan drill's objective cannot be expressed* already
  tracks. §1 proposes a ledger row for
  the five zero-user objective types and specifies nothing about them.

## Specification

### 1. The shrink, first

A vocabulary that only grows rots. Wave 2 added five mechanisms and refused six; this wave
adds five and **removes two**, and states the rule under which the rest stay.

#### 1a. Two deprecations, both evidenced

| Removed | Evidence | Replacement |
|---|---|---|
| `pawn_count` (both bases) | Subsumed exactly by `piece_count` with `role: "pawn"` (§3). Two spellings of one census is the rot this section exists to prevent. **6 uses** to rewrite: `lucena-bridge-convert.json`, `pawn-breakthrough-convert.json`, `pawn-opposition-convert.json`, `philidor-third-rank-hold.json`, `queen-vs-pawn-seventh-convert.json`, `content/shapes/opposite-coloured-bishops.json` — one leaf each, verified this pass | `piece_count(C, "pawn", basis, comparison, count)` — identical arithmetic, identical sentences |
| `piece_reach_count`'s `scope: "every"` arm | **0 of 143** corpus uses — `scope: "any"` in all 43 pack leaves and all 100 shape-entry leaves. Its only known use in shipped content was `mate-two-bishops.json`'s degrade condition, which was **false in every position** and shipped that way for a day in a *graded* pack. The vacuity was documented in the parent RFC (`rfc/archive/structural-reading.md:263-266`) *and* in `docs/structural-reading.md`, and still bit an author: a documented trap that bites is a defect in the vocabulary, not in the author | The claim "every rook of mine is cramped" becomes `all[ piece_count(C, "rook", count, atLeast, 1), not(piece_reach_count(C, "rook", any, atLeast, n+1)) ]` — non-vacuous **by construction**, because the existence conjunct is explicit and mandatory. This composition is only available once `piece_count` ships, which is why the deprecation lands with it and not before |

**Deprecate now, remove in wave 4 — and the reason is not caution.** `registered_shapes`
(migration 10, `apps/server/src/storage.ts`) stores community documents that **no shipped code
path mutates**. Verified this cross-review, and the precise wording matters because the wave-4
gate depends on it: there is exactly one INSERT (`registerShapeDraft`, inside `BEGIN
IMMEDIATE`), one SELECT (`registeredShapes`), **no `DELETE`**, and **no `ALTER TABLE`** in any
later migration; `PRIMARY KEY (shape_id, version)` plus a `UNIQUE` digest make identity and
content stable. This draft called the documents "immutable"; that is **enforced by the absence
of a mutating path and by convention, not by the database** — `STRICT` only types columns,
there is no trigger and no view-only access — and the row is not strictly immutable either,
since account deletion does `UPDATE registered_shapes SET publisher_learner_id = …`. The
`document_json` is what must not move, and nothing moves it. A schema narrowing that lands
before the registry is confirmed clear would still invalidate rows nobody can edit, so the
argument holds on the corrected facts.

So this RFC ships two **warnings**, and the plumbing is **not** already there — this draft
claimed it was and that claim is wrong in two places:

- **Packs.** `PackValidationIssue.severity` is `"error" | "warning"` and `valid` is
  `!issues.some(i => i.severity === "error")`, so warnings genuinely do not fail a pack. But
  `pack-validation.ts` ships **exactly one** warning-severity site
  (`KEY_POINT_PHRASE_IS_JUDGEMENT`), constructed inline; every other issue goes through
  `runtimeIssue()` or the schema helper, and **both hard-code `severity: "error"`**. The
  deprecations must be emitted from the `structuralIssues` leaf walk, which uses
  `runtimeIssue`. **The implementer therefore adds a warning constructor** (e.g.
  `runtimeWarning()`) alongside `runtimeIssue()`; without it both codes ship as errors and
  break every pack in the corpus at load. `make pack-check` already exits 0 on warnings
  (`pack-check.ts` returns 1 only on `!result.valid`), so no Makefile change is needed.
- **Shape entries, and this is the sharper gap.** `shape-validation.ts` has **no warning path
  at all**: its sole issue constructor hard-codes `severity: "error"`, and `shape-check.ts`
  prints *every* issue to `console.error` without a severity split. Because shape validation
  reuses `structuralIssues` for the trigger and for every non-null `plans[].success.signature`,
  a warning constructed there will pass through and `shape-check` will exit 0 — but it will be
  printed on the error stream as if it had failed. **The implementer gives `shape-check` the
  same severity split `pack-check` has.** This is load-bearing for §10 item 6:
  `content/shapes/opposite-coloured-bishops.json` is one of the six `pawn_count` uses, so the
  shape side of the deprecation is exercised on day one.

With those two pieces in place the RFC rewrites the six in-repo `pawn_count` uses to zero and
schedules the two `oneOf` branch removals for wave 4 behind a registry sweep. A deprecation
with no removal date is a deprecation that never happens; the date is wave 4 and the
precondition is written down.

**Naming, checked against convention.** A repo-wide sweep this cross-review found **no
collisions** for any of the eleven codes this RFC introduces, in source, schemas, or any other
active draft. `PIECE_COUNT_OUT_OF_RANGE` and `PIECE_DISTANCE_OUT_OF_RANGE` follow the
established `*_OUT_OF_RANGE` suffix (`PAWN_COUNT_OUT_OF_RANGE`, `OUTPOST_RANK_OUT_OF_RANGE`,
`SYZYGY_ASSESSMENT_OUT_OF_RANGE`); the two `SHAPE_REFERENCE_*` codes extend the existing
`SHAPE_REFERENCE_UNKNOWN` prefix. **The two `_DEPRECATED` names are off-convention**: no code
in either validator or in `lint.ts` uses that suffix, and every existing warning names a
*finding* rather than a *state* (`KEY_POINT_PHRASE_IS_JUDGEMENT`, `DEVIATION_SHADOWS_SPINE_MOVE`,
`BOUNDARY_NODE_BEYOND_HORIZON`). Renaming to `PAWN_COUNT_SUPERSEDED_BY_PIECE_COUNT` and
`PIECE_REACH_SCOPE_EVERY_SUPERSEDED` would match; this draft leaves the decision to the
implementer and records the convention rather than silently departing from it.

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
counting packs only.

**Corrected this cross-review: only ONE kind now has zero uses anywhere.** `ae8aab7` added
`london-wedge.json`, which uses `direct_attack_count` **twice** — so the table's `0 / 0` row for
it is stale and the kind is authored content now, not a projection-only leaf. Recounted on the
current tree: `passed_pawn` 0/101, `open_file` 1/**16**, `half_open_file` 3/**17**, `outpost`
0/5, `isolated_pawn` 0/5, `doubled_pawn` 0/**5**, `line_blockers` 0/2,
`direct_attack_count` **0/2**, `pawn_safe_square` **0/0** — the last is the sole survivor.
The argument is unharmed and in fact simplified: `pawn_safe_square` stays, and rule 3 is what
decides it:
both are **emitted by the reading projection** (`packages/runtime/src/structure.ts:396`,
`:412`) and rendered as sentences
(`apps/web/src/lib/structural-sentences.ts`, the `pawn_safe_square` and `direct_attack_count` sentences), so the disjunctive half of rule 3
("something a learner needs pointed at") holds even at zero authored uses.
`pawn_safe_square` is additionally the *definition* of `outpost`
(`structure.ts:303`) and the body of `structuralDelta.evictionChanges` (`:429-432`);
retiring it would be retiring the arithmetic under two other facts.

**Proposed sunset rule**, offered as a `design/BACKLOG.md` row for the owner rather than
written into `design/` here (law 5): *a feature kind with zero authored uses in packs and in
shape entries, and no emission in the reading projection, is proposed for deprecation in the
next predicate wave and removed in the one after.* Under this rule the current vocabulary
loses nothing beyond §1a — which is the point of writing the rule down before it is needed.

**The row already exists.** `design/BACKLOG.md` carries *Sunset rule for zero-use vocabulary*;
this section should **amend** it with the wording above and the pack-versus-shape measurement,
not add a second row. Same for *Intent grading has a measured ceiling of ~45%*, which §7 F1
would otherwise duplicate. Criterion 18 is corrected accordingly: "added as new rows" applies
only to rows that do not exist, and an agent that files a duplicate has made the ledger less
useful, not more.

### 2. Verdicts on the candidates

| Candidate | Verdict | Deciding rule |
|---|---|---|
| Existence / material census | **Admitted** as leaf `piece_count` (§3) | Rules 1–4. Rule 3 is 43 corpus leaves spelling it by hand plus a shipped dead condition |
| King on an edge / in a corner | **Admitted** as leaf `king_zone` (§4a) | Rules 1–4; it collapses a 765-byte fan exactly as `quantified` collapsed the 48-leaf one — it removes a fan, not a limit |
| Distance, king only | **Not shipped.** Subsumed by the general leaf below; never shipped, so no deprecation (§4b) | §1's rule: two spellings of one census is rot. The disposition is cheaper than `pawn_count`'s because nothing has to be rewritten |
| Distance, **general per-role** | **Admitted** as leaf `piece_distance` (§4b), by owner ruling 2026-08-15. Wave 2 refused a distance leaf under rule 3 ("no collected gap is closed by it", `rfc/archive/predicate-wave-2.md:137`) | Rule 3 is now satisfied and measured on both halves: **9 of the null-signature notes cite king geometry the vocabulary cannot read**, and **two** name a non-king distance — exactly the wave's "hit twice" bar. All six distance/route notes name the **static** quantity, never a delta |
| Grade the plan the learner declared | **Split.** The authorable half is admitted as `plan_consequence` (§5); the intent-relative half is refused (§7 F1) | Rule 1 for the refusal: which plan was declared is not in the position, and is not anywhere else either |
| Shape-reference modality | **Admitted** as a `pack.shapes` relation (§6), **not** a predicate | Kept out of `StructuralExpression` deliberately: a prospective claim is not evaluable at a position, so putting it in the grammar would break rule 1 for the whole grammar |
| Structure memory / history | **Refused** (§7 F2) | Rule 1 |
| Castling rights | **Refused** (§7 F3) | Rule 3, with the arithmetic |
| Transition predicates | **Refused for this wave**, specified for the next (§7 F4) | Not a rule failure — an attestation and sequencing failure, stated as such |

Net: **eighteen** feature kinds in the enum (fifteen + `piece_count` + `king_zone` +
`piece_distance`), of which **sixteen** are authorable without a deprecation warning; **seven**
expression node kinds, unchanged; **seven** success-condition kinds at 0.18 (five shipped +
`timing_window` from `rfc/tempo-vocabulary.md`'s 0.17 + `plan_consequence`) — **six** if 0.17
has not landed. Verified this pass: `successPredicate` (`apps/server/src/pack-orchestrator.ts`)
dispatches exactly five arms today (`reach_checkpoint`, `outcome`, `material_balance`,
`rules_fact`, `structural_feature`) before its `never` guard.

### 3. `piece_count` — the census leaf

```ts
| { readonly kind: "piece_count"; readonly color: Color; readonly role: Role;
    readonly basis: "count" | "difference";
    readonly comparison: FeatureComparison; readonly count: number }
```

**Semantics.** Let `own = |pieces(color, role)|` and `other = |pieces(opposite(color), role)|`.
`basis: "count"` compares `own`; `basis: "difference"` compares `own − other`. `Role` is the
full six-role enum (`$defs/role` in `schemas/drill_pack.schema.json`) — unlike `piece_reach_count`, which
is restricted to the four sliding/jumping roles because *reach* is meaningless for a pawn and
unsafe for a king. Counting has no such problem: a census of kings or pawns is the same
arithmetic as a census of rooks.

**Why it is admissible.** Rule 1 trivially. Rule 2 — one sentence, no constant that encodes
taste; the `difference` basis inherits `pawn_count`'s ruling verbatim
(`rfc/archive/predicate-wave-2.md:360-374`): pieces of one role are a conserved, identical
unit, the codebase already ships signed material comparison as census
(`MaterialBalancePredicate`, `packages/runtime/src/objective.ts`), and the
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

**The existence idiom, retired by equivalence.** `piece_reach_count(C, r, any, atLeast, 0)` is
true exactly when `C` has at least one piece of role `r`: the evaluator maps each such piece
to a non-negative reach and asks `some` (`structure.ts:336-337`). Verified extensionally
against `piece_count(C, r, count, atLeast, 1)` over every position of every authored spine ×
2 colours × 4 reach roles: **4528 checks, 0 mismatches** on the tree this draft measured
(re-run on the current tree after `ae8aab7` added two packs: **4744 checks, 0 mismatches**).

**Scoping correction, this cross-review.** This draft repeatedly wrote "the 43 leaves in the
corpus", scoped to `content/drafts`. `content/shapes` carries **100 more** existence leaves
across 13 shape files, all of them the same `scope: "any"`/`atLeast 0` idiom. The deprecation
argument is *strengthened* — `scope: "every"` has zero uses across all **143** — but the
rewrite surface §10 schedules is **143 leaves, not 43**, and the implementer must budget for
that. Shape-entry rewrites also bump each touched entry's `semver` and are shape-schema 0.3
edits, so §10 item 3's "eleven packs" is understated twice over.

The existence leaves are rewritten one-for-one, and the `trajectory-mate-bishop-knight.json` six-leaf
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
(the `pawn_count` arm of `structuralIssues`, `apps/server/src/pack-validation.ts`) is kept for the deprecated leaf and is not
reused.

### 4. King geometry — two leaves

D34 (`design/BACKLOG.md`, row *No king-geometry vocabulary*) is the fourth attestation of the same gap, and the corpus
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
39-ply spine and across **all 3612 legal (white-king, black-king) pairs** on a two-king board;
both forms first fire at **ply 8**, the ply the author computed and the dossier reproduced
(`design/research/authored-transitions-and-features.md:320-324`).

The corner case is worth recording because it *refuses* to flatter the vocabulary. The same
pack's `king-in-the-bishops-corner` checkpoint is a `quantified` **2×2 box** (g7–h8), not a
corner square, and the pack provenance says why: the true corner is too far for the 20-ply
leg cap. Measured here: `king_zone(black, corner)` first holds at **ply 34**, and the leg-2
entry is at ply 8 — **26 plies**, exceeding the cap by six, exactly as the author recorded in
`25b4584`. `king_zone` would let that author state the corner in one leaf; it would not let
them ship it. The blocker is the ply cap, not the vocabulary, and this RFC does not touch the
cap.

#### 4b. `piece_distance` — the general static distance leaf

> **Admitted by owner ruling, 2026-08-15** (`planning/exploration/log.md`), resolving this
> draft's open question 8. The wave first proposed a `king_distance` leaf and refused the
> general form on a miscount ("for other roles once"); the corrected count is **twice**, which
> meets this RFC's own stated admission bar, and six shape-library notes name the static
> quantity independently. **`king_distance` is therefore not shipped as a separate leaf** —
> see "Reconciliation" below. The wave still admits exactly three new leaves and the enum
> still reaches eighteen.

**This is the STATIC leaf, and the distinction is load-bearing.** What is admitted here is a
census over *one position*: how far a piece stands from a target, on an empty board. What is
**not** admitted, here or anywhere in this wave, is the *delta* across a move — "this move
brings the knight closer" — which `design/research/move-primitive-computability.md` §4d–4f
measured and refuted as a detector: a **98.7% false-positive rate** with no authored target
(0.0% precision under the sharpest filter), **52.8%** of the piece's own alternatives
satisfying it even with the target supplied, and only **9 of 17** author-labelled repositions
explained. **The target square set is the judgment, and this leaf does not choose it — the
author writes it.** The delta remains refused (§7 F4), demoted to a renderer of an
author-declared destination. Nobody should be able to read this admission as routing-as-detector
arriving by the back door, so it is written twice: the leaf reads a position, never a
transition, and its evaluator signature is the one-FEN `matchesStructuralFeature` like every
other leaf.

```ts
export type DistanceTarget =
  | { readonly kind: "square"; readonly square: SquareName }
  | { readonly kind: "piece"; readonly color: Color; readonly role: Role };

export type DistanceRole = "king" | "knight" | "bishop" | "rook" | "queen";  // not "pawn"

| { readonly kind: "piece_distance"; readonly color: Color; readonly role: DistanceRole;
    readonly target: DistanceTarget;
    readonly comparison: FeatureComparison; readonly count: number }
```

**Semantics.** The **graph distance on the empty board** for the moving role — the number of
moves that role needs, ignoring every other piece. The subject is the **minimum** over all
pieces matching `{color, role}`; a `piece` target is likewise the **minimum** over all pieces
matching its own `{color, role}`. Occupancy, legality, check, pins and blocking are never read,
and that scope is part of the definition sentence: this is board geometry, not a path search
(rule 1). Per-role metric, with the exhaustive 64×64 enumeration that fixes each range:

| Subject role | Metric | Reachable pairs of 4096 | Range | Distribution over all ordered square pairs |
|---|---|---|---|---|
| `king` | Chebyshev, `max(|Δfile|, |Δrank|)` | 4096 | **0–7** | 64 / 420 / 672 / 780 / 768 / 660 / 480 / 252 |
| `knight` | BFS over knight moves (a fixed 64×64 table) | 4096 | **0–6** | 64 / 336 / 1080 / 1536 / 900 / 176 / **4** |
| `rook` | 0 same square, 1 shared file or rank, else 2 | 4096 | **0–2** | 64 / 896 / 3136 |
| `bishop` | 0 same square, 1 shared diagonal, 2 same shade, **unreachable** off-shade | **2048** | **0–2** | 64 / 560 / 1424 (+ **2048 unreachable**) |
| `queen` | 0 same square, 1 shared file, rank or diagonal, else 2 | 4096 | **0–2** | 64 / 1456 / 2576 |

Computed this pass over all 64×64 = 4096 ordered square pairs per role. Two independent
checks pin the table: the knight `d = 1` count is **336**, which is the known total number of
knight moves on an 8×8 board, and the bishop unreachable count is **2048 = 2 × 32 × 32**,
exactly the two off-shade blocks. The knight's maximum of 6 is attained on precisely **4** of
4096 pairs — the corner-to-adjacent-diagonal cases and their symmetries — which is why the
`OUT_OF_RANGE` bound is per role and not a single board diameter.

**`false`, never an error, and never vacuously true.** The leaf asserts *there is a subject
piece, there is a target, and the distance between them satisfies the comparison*. It is
`false` — not an error, and not vacuously true — when the subject set is empty, when a `piece`
target's set is empty, and **when every subject/target pair is unreachable** (the off-shade
bishop). This last clause is written explicitly because the alternative is exactly the trap
§1a deprecates: treating an unreachable distance as ∞ would make `atLeast n` true for every
`n`, reproducing `piece_reach_count scope:"every"`'s vacuity in a brand-new leaf on the same
day the wave retires it. An author who wants the negation writes `not(…)`, which is
unambiguous.

**Why `pawn` is not a subject role.** A pawn's move graph is directional, non-reversible,
colour-dependent, and terminates in promotion — "the number of moves a pawn needs to reach
h4" is not a distance on an undirected board graph, and any answer would encode a convention
rather than a geometry. This is the same ruling §3 inherited for `piece_reach_count`, where
*reach* is meaningless for a pawn, and it is enforced rather than documented:
`PIECE_DISTANCE_ROLE_UNSUPPORTED`. A pawn remains perfectly legal as a **target**, because a
target is a square set and does not move.

**Admission, rule by rule.** Rule 1 — two square coordinates and a fixed table. Rule 2 — one
sentence per role, no constant that encodes taste; the `count` is an authored comparison
operand exactly as in `line_blockers` and `direct_attack_count`, not a threshold the *detector*
chooses. Rule 4 — a distance is a measurement; `piece_distance` names the quantity and no
verdict, and the names `too_far`, `out_of_play`, `well_placed` are refused under it.

**Rule 3, which is the rule that changed.** Wave 2 refused a distance leaf explicitly — "no
filed plan names them, the enum widens when one does"
(`rfc/archive/predicate-wave-2.md:137`; note `:408-411`, which this draft also cited, refuses
`diagonal`/virtual opposition rather than a distance leaf). The enum now widens, and the
attestations divide cleanly:

| Subject | Authoring notes, in the authors' own words |
|---|---|
| **King** (5) | `lucena`/`white-run-out-the-checks` (*"King-to-rook distance is geometry outside this vocabulary"*), `queen-vs-pawn-on-seventh`/`black-count-the-far-king` (*"King distance is geometry outside this vocabulary"*), `queen-vs-pawn-on-seventh`/`white-know-the-drawn-files` (*"'king close enough' is not [expressible]"*), `philidor`/`black-king-on-the-path`, `pawn-opposition-key-squares`/`white-occupy-key-squares`. Plus `bishop-good-bad` and `opposite-coloured-bishops` (*"king routes are outside this vocabulary"*) |
| **Non-king** (2) | `up-an-exchange`/`white-stretch-two-wings` (*"Wing counts and switching distance are outside this vocabulary."*) and `knight-vs-bishop`/`white-passer-outruns-the-knight` (*"A rook-file passer is the shape; the knight's actual travel distance is geometry the signature cannot count."*) |

**Two non-king notes is exactly this wave's stated bar** — "gaps real content has hit twice"
(`design/research/authored-transitions-and-features.md:417-418`) — and
`design/research/move-primitive-computability.md` §4e adds the corroboration that matters most:
of the six shape-library notes naming distance or routing, **every one names the static
quantity**, not a delta. The authors were asking for this leaf, not for the refuted one.

**Reconciliation with `king_distance` — it does not ship, and that is the cheap outcome.**
`king_distance(color, target, cmp, n)` is `piece_distance(color, "king", target, cmp, n)`,
identically: the per-role metric for `king` *is* Chebyshev, verified over all 4096 ordered
square pairs with **0 disagreements**. Two spellings of one census is the rot §1 exists to
prevent, and this RFC retired `pawn_count` on exactly that ground. But the disposition here is
**not** a deprecation and needs none: `pawn_count` had **shipped** in wave 2, so retiring it
costs a warning, a rewrite of six authored leaves, a wave-4 removal date and a
`registered_shapes` sweep. `king_distance` has never shipped — it exists only as a proposal in
this draft — so it is simply **not admitted**, with no migration, no deprecation code, no
authored content to rewrite and no registry concern. **The consequences are small and are
stated so nothing is assumed:** the enum still reaches **eighteen** kinds
(15 + `piece_count` + `king_zone` + `piece_distance`), so §2's net, criterion 11's count and
§9's eighteen `structure-*` facts are unchanged; the fact is `structure-piece-distance` rather
than `structure-king-distance`; the refusal codes are `PIECE_DISTANCE_*` rather than
`KING_DISTANCE_*`; and every occurrence of `king_distance` elsewhere in this RFC — §2's
verdict table, §8's dispatch and mirror rules, §9's projection and sentences, §11's boundary
table, §12's schema, §10's content demonstration and the acceptance criteria — reads as
`piece_distance` with `role: "king"`. Those sites are updated in place below rather than left
to the implementer to translate.

**What each target arm buys.** A `square` target is extensionally a clipped `quantified`
region and therefore **removes a fan**; the `piece` target is genuinely new expressive power,
because a region cannot be relative to a piece that moves. The `piece` arm is what carries
`lucena`'s case, which is king-to-*rook*, not king-to-king.

**A scope limit, stated rather than glossed.** The target selector is `{color, role}` — it
cannot say *"the **passed** pawn"* or *"the **weak** rook"*. So `knight-vs-bishop`'s note is
closed only in its *metric* half: the leaf can say "the black knight is at most 3 knight-moves
from the nearest white pawn", and with a `square` target it says exactly "…from a4", but it
cannot say "…from whichever white pawn is passed". Expressing that needs a target *predicate*,
which would put a nested expression inside a leaf and is refused here for the same reason §6
keeps the shape relation out of the grammar — it would change what a leaf is. Open question 10
records it; this RFC does not pretend the note is fully discharged.

**The attested authoring case, encoded.** The B+N pack's third leg summary says the mate
needs "your king standing two squares away". That sentence is exact and, today, unencoded.
As a leg degrade condition:

```json
{ "kind": "structural_feature", "to": "degraded", "from": ["active", "preserved"],
  "feature": { "kind": "not", "of": { "kind": "feature", "feature": {
    "kind": "piece_distance", "color": "white", "role": "king",
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

**The non-king attested case, encoded and measured — and the measurement found something
worse than expected, in the shipped content rather than in the leaf.**
`knight-vs-bishop`/`white-passer-outruns-the-knight` ships a **12-arm `any` of `passed_pawn`
leaves** on a2–a7 and h2–h7 — a rook-file-passer proxy — with the author's note attached:
*"A rook-file passer is the shape; the knight's actual travel distance is geometry the
signature cannot count."* The missing half is one leaf:

```json
{ "kind": "feature", "feature": {
    "kind": "piece_distance", "color": "black", "role": "knight",
    "target": { "kind": "square", "square": "a7" },
    "comparison": "atMost", "count": 3 } }
```

Measured with the shipped `matchesStructuralExpression` bundled unmodified (esbuild, CJS) and
every pack's principal spine replayed from `start.fen` with chessops, **0 replay errors**. The
position set, stated exactly rather than described: **no pack references `knight-vs-bishop`**,
so the set is the union of the principal spines of every pack containing a knight —
**29 packs, 440 positions**, of which 395 actually contain a knight. Corpus-wide totals are
given where they change the picture: 42 spine-bearing pack files, **615** positions.

| Measurement | Result |
|---|---|
| Empty-board metric, all 4096 ordered pairs × 5 roles | maxima **king 7, knight 6, rook 2, bishop 2, queen 2**; knight `d=1` = **336**; bishop unreachable = **2048**. Independently re-derived from the harness oracle; reproduces exactly |
| `piece_distance(C, "king", …)` vs Chebyshev, all 4096 pairs | **0 disagreements** — the `king_distance` subsumption is exact |
| **The shipped 12-arm fan, evaluated** | **0 of 440.** Corpus-wide it holds at **9 of 615**, and **none of those 9 contains a knight of either colour** — they are bare pawn/king endings in `immediate-guard-browser`, `stated-reasoning-browser` and `pawn-breakthrough-convert` |
| Literal discrimination (fan ∧ leaf, at n = 2…5) | **Degenerate at every n**: the fan holds nowhere in the set, so the contingency table is `0 / 0 / 0 / 440` four times |
| Relaxed discrimination — target widened to *the nearest white a/h-file pawn, passed or not* | **306** positions carry both that pawn and a black knight. Distance histogram **1→1, 2→209, 3→94, 4→2**. `atMost 2` splits **210 / 96**; `atMost 3` splits **304 / 2**; `atMost 1` and `atMost 4` are constant |

**The finding is about the shipped signature, not about the leaf, and it belongs to this wave's
running theme.** The author's note is *too generous to its own fan*: the signature does not
merely fail to count knight travel, it **never fires at all** in any position of any pack that
contains a knight. This is the inert-signature finding (header) reappearing from the other
side — a non-null signature, well-formed, shape-validated, rendered as prose, and empty on the
corpus. It is a direct argument for §5c's `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` and it is
why that refusal is not theoretical: here is a shipped signature that would have triggered it.

**What the relaxed measurement does establish.** The shipped vocabulary assigns all **306** of
those positions the same value on the only leaf that is about this shape, and the new leaf cuts
that single indistinguishability class into **210 / 96** at `atMost 2` and **304 / 2** at
`atMost 3`. So the leaf is not a tautology, not a restatement of the fan, and not constant over
real content. The honest headline, though, is that it discriminates *within a class the fan
collapses entirely* — it is not adding resolution to a working proxy, it is supplying the only
signal.

**Observed ranges on real positions, against the theoretical bounds — no value exceeds any
bound at any point**, and two results are worth carrying into the design:

| Subject | Positions with subject | Observed | Bound |
|---|---|---|---|
| king (either colour) | 440 | **2–7** | 7 ✓ |
| knight | 394 W / 306 B | **1–4** | 6 ✓ |
| bishop | 415 W / 334 B | **1–2**, plus unreachable | 2 ✓ |
| rook | 345 | **1–2** | 2 ✓ |
| queen | 328 | **1–2** | 2 ✓ |

First: the knight's observed maximum is **4**, well under its empty-board worst case of 6 —
real positions never approach the corner-to-corner extreme. Second, and this is a limit on the
leaf's usefulness that belongs in the open: **rook, bishop and queen take only the values
{1, 2} in every one of the 615 corpus positions.** Against a king target those three roles have
exactly two usable values corpus-wide, so `atMost 1` is the only non-trivial query and the
practical range lives in `king` (2–7) and `knight` (1–4). The per-role `OUT_OF_RANGE` refusal
is what keeps an author from writing the constants; it does not make the sliders expressive.
This is not a reason to drop them — the metric is the same table and dropping roles would
reintroduce a special case — but nobody should expect authored slider-distance leaves.

**The bishop vacuity trap, measured where it actually bites: 85 of 440.** In **85** positions
every white bishop is off-shade from the black king, so `piece_distance(white, "bishop",
<black king>)` is `false` for every comparison under the unreachable rule (90 of 615
corpus-wide). They are **concentrated, not spread**: `trajectory-caro-advance-chain-bishops`
41, `mate-bishop-knight` 22, `trajectory-mate-bishop-knight` 22,
`opposite-bishops-fortress-hold` 5. **`mate-bishop-knight` is a bishop-and-knight mate pack** —
precisely where an author reaches for a bishop-to-king distance — and half its spine returns
the vacuous answer. Had the ∞ convention been chosen instead of `false`, `atLeast n` would have
been *true* across those 85 positions in the wave's own demonstration packs. This is the single
strongest justification for the anti-vacuity rule above, and criterion 5 asserts it.

**What this proof does and does not establish, stated plainly.** It establishes the metric
exactly (4096 pairs × 5 roles, pinned by two independent counts), the `king_distance`
subsumption exactly, the observed-versus-theoretical bounds on real content, the vacuity trap
with the packs it bites, and discrimination over 306 real positions. It does **not** establish
a firing measurement on an authored spine the way `king_zone`'s ply-8 result does — and the
reason is now sharper than "no pack references the entry": **neither non-king attestation is
referenced by any pack.** `knight-vs-bishop` and `up-an-exchange` are both among the **9 of 25
shape entries no pack references**, and `up-an-exchange`'s `white-stretch-two-wings` was
re-confirmed this pass as `signature: null` with its note verbatim. So the two attestations
that carry this leaf past the "hit twice" bar both live in orphan library entries. **That does
not overturn the ruling** — the bar is about what authors hit, and they hit it — but it is a
materially weaker evidence base than `piece_count`'s 143 corpus leaves or `king_zone`'s 765-byte
fan in a referenced pack, and an owner re-reading this decision should see it stated rather than
inferred. Criterion 5 compensates by asserting the metric exhaustively rather than by sampling
positions, and open question 10 records the part of the attestation that stays open.

**Load refusals — three, and the range one is now sharper than a single board diameter.**

| Code | Fires when | Why |
|---|---|---|
| `PIECE_DISTANCE_OUT_OF_RANGE` | `count` is outside `0 … max(role)`, where the maxima are **king 7, knight 6, rook 2, bishop 2, queen 2** from the exhaustive table above | Outside that the leaf is a constant. **Per-role, not per-board:** `piece_distance(white, "rook", …, atLeast, 3)` is constant-false and is refused, where a single 0–7 bound would have admitted it. This is the one place the general leaf is *stricter* than the `king_distance` it replaces |
| `PIECE_DISTANCE_SELF_TARGET` | `target.kind === "piece"` and `target.color === color` and `target.role === role` | The minimum over a set to itself is 0 in every position where the set is non-empty and the leaf is `false` where it is empty — a constant dressed as a query. Generalises `KING_DISTANCE_SELF_TARGET` from the king to every role |
| `PIECE_DISTANCE_ROLE_UNSUPPORTED` | `role` is `"pawn"` | A pawn's move graph is directional and terminates in promotion; there is no undirected board distance to compute (above). Enforced, not documented, because §1a's whole lesson is that a documented trap still bites |

**Names swept this pass:** no occurrence of `piece_distance` or `PIECE_DISTANCE_*` anywhere in
source, schemas, content or any active draft. `*_OUT_OF_RANGE` matches the established suffix
(`PAWN_COUNT_OUT_OF_RANGE`, `OUTPOST_RANK_OUT_OF_RANGE`); `_SELF_TARGET` and
`_ROLE_UNSUPPORTED` name the finding rather than a state, per the convention recorded in §1a.

**The widening path — opened, measured, and now TAKEN.** This draft first shipped
`king_distance` and refused the general leaf because "rule 3 is satisfied for kings many times
over and for other roles once". **That count was wrong**, and the correction is what carried
the owner's ruling: `design/research/move-primitive-computability.md` §4e grepped the shape
library for `distance|route` and found **six** notes, every one naming the static quantity —
four for kings (`bishop-good-bad` and `opposite-coloured-bishops`, *"king routes are outside
this vocabulary"*; `queen-vs-pawn-on-seventh`; `lucena`) and **two** for other roles
(`up-an-exchange`/`white-stretch-two-wings`, and
`knight-vs-bishop`/`white-passer-outruns-the-knight`, whose author worked around the gap with a
static `passed_pawn` disjunction rather than anything transitional). Two non-king attestations
meet this wave's own bar, so the leaf is admitted above and `king_distance` is not shipped.
The metric rule that a later wave would have had to invent is now normative here instead.

**Where the metric belongs — amended by measurement, 2026-08-15.** This draft originally wrote
that the owner's knight-repositioning case (§7 F4) is "this metric's clearest use, and its
useful form is the *delta* across a move, which is why it lands with the transition category
and not with a static leaf." `design/research/move-primitive-computability.md` measured that
claim and **refuted it**: with an author-supplied target the arithmetic is exact and reproduces
the author's own claim **9 of 9**, but with no authored target every autonomous target set
tried produced a **98.7% false-positive rate** — **0.0% precision** across 48 firings under the
sharpest filter (quiet, non-developing, backward/lateral) — and even *with* the target supplied
the delta fails to identify the move, since **52.8%** of the piece's own alternatives satisfy
it. Routing also explains only **9 of 17** author-labelled repositions. **The target square set
is the judgment.** So the corrected placement is the opposite of the original: the **static**
leaf is the attested, discriminating half and is the half authors reach for when they have to
be checkable (`kid-chain-arrangement`'s `black-strike-the-base-with-f5` is a conjunction of
`pieceOnSquare` arrival leaves; `pieceOnSquare` appears in 7 of 35 packs), and the **delta** is
demoted from detector to *renderer of an author-declared destination* — "this move brings the
knight one move closer to the d3 the pack named" — never the thing that discovers the
destination. §7 F4's repositioning row carries the same amendment.

**And the admission above is the static half arriving, not the delta sneaking in.** The owner's
ruling admits `piece_distance` precisely *because* it is the half that survived measurement.
The two forms are separated by their evaluator signature, which is the same argument F2 uses
against history predicates: `piece_distance` is answerable from one FEN, the delta is not
answerable from one FEN at all, and no node of this grammar takes two. The wave therefore
cannot express the refuted form even by composition — there is nowhere to stand between two
positions (§7 F4), and that structural fact, not a naming convention, is what keeps the
distinction honest.

### 5. `plan_consequence` — the intent gap, split honestly

#### 5a. What is actually broken

`design/05-in-run-experience.md:389-397` found the path in 2026-08-13: *grade the plan by its
structural consequence*. Two years of that path's machinery already ship. What does not ship
is the **binding** between a graded condition and the plan it grades, and the corpus shows
exactly what the absence costs.

`carlsbad-minority-attack.json` offers the learner a three-way plan choice at the tabiya
(`intent_capture` over `minority-attack`, `central-break`, `kingside-attack`). Its objective
carries exactly one success condition, and this pass verified that condition is
**identical, key order included, after parsing** to the `carlsbad` shape entry's
`white-minority-attack` signature (this draft wrote "byte-identical", which is false at source
level — the pack pretty-prints the expression across several lines and the shape entry has it
on one; re-verified this cross-review, `JSON.stringify` of both parsed values is equal)
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
entry in `pack.planClasses`; that entry's `shapePlan` (`{shape, plan}`, `$defs/planClass` in
`schemas/drill_pack.schema.json`) names a shape entry and a plan; that plan's
`success.signature` is the expression. The compiled predicate is exactly
`{ type: "fenPredicate", predicate: { type: "structuralFeature", feature: <resolved signature> } }` —
the same predicate `structural_feature` compiles to (the `structural_feature` arm of
`successPredicate`, `apps/server/src/pack-orchestrator.ts`), with **no new evaluator**.
`plan_consequence` adds a *binding*, not a detector, which is why it needs no admission-rule
argument of its own beyond the four rules already passed by whatever leaves the signature
contains.

**But it is a new resolution path, and this draft first claimed otherwise.** Verified this
pass: `successPredicate(condition, pointer)` and `conditionRules` take no shape access;
`objectiveRules(pack, objective, pointerPrefix)` takes only the pack; its four call sites —
`orchestratePackMove` (twice), `progress.ts` (`objectiveRules(pack).length > 0`, the
*is-this-pack-graded* test) and `pack-validation.ts`'s default `ObjectiveCompiler` — all pass
a pack and nothing else; and `DrillService`'s `#shapes` is typed `ShapeRegistry | undefined`,
so a deployment may have no registry at all. The implementer therefore threads a resolver:

```ts
type PlanSignatureResolver = (planClassId: string) => StructuralExpression | null | undefined;
```

`undefined` means *unresolvable* (no plan class, no `shapePlan`, no entry, or no registry);
`null` means *resolved and the author declared no census*. `objectiveRules` gains an optional
resolver, `orchestratePackStart`/`orchestratePackMove` gain it and `DrillService` supplies one
backed by `#shapes`. **Normative behaviour when the resolver is absent or returns `undefined`
or `null`: `successPredicate` throws `PackCompileError("PLAN_CONSEQUENCE_UNRESOLVED")`.** It
does **not** silently drop the rule and does **not** compile a never-true predicate — dropping
it would flip `progress.ts`'s graded/ungraded verdict without a word, and a never-true
predicate is exactly the "silently false reads as *the learner failed*" failure §5c exists to
forbid. The load refusals of §5c are what make that throw unreachable in a validated pack; the
throw is the belt for an unvalidated one, and it is a *compile* error, so a run never starts
half-graded.

**And the signature it resolves has never been evaluated.** Per the header finding,
`plans[].success.signature` is shape-validated for well-formedness and rendered as prose, and
that is all: no shipped code path has ever asked whether one *holds* at a position. The 28
non-null signatures in the library are therefore **unexercised expressions**, and
`plan_consequence` is the first thing that would grade a learner with one. Well-formed is not
satisfiable, which is why §5c adds `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` — the same
refusal §6 gives a `present` shape reference, applied to the resolution target instead of the
entry trigger. Without it, this RFC's headline value ("closable today for 16 of 99 plan
classes") rests on 16 expressions nobody has ever run.

**Why resolution goes through the shape library and nowhere else.** An inline
`planClass.consequence` field was considered and refused: the ledger's *Content transfer test* row ("content earns its cost by how much of it fires in a game nobody
authored") and `design/04-content-architecture.md` §0a both say the fix is packs *referencing*
entries rather than inlining them. A plan worth grading is a plan worth naming in the library.
The cost is measured and stated: **44 of 99** plan classes carry a `shapePlan` today, so 55
cannot use this condition until their author writes or references an entry. That is the
intended pressure, not a defect.

**Normative naming and rendering rule — and it SURVIVES the 2026-08-15 ruling unchanged.** The
condition asserts *the structural consequence the author attached to this plan class is present
in this position*. It does **not** assert that the learner executed the plan, and it must never
be rendered as though it did. The names `plan_executed`, `plan_followed`, `intent_met` are
refused under admission rule 4 — each contains a verdict about a person. The sentence table
(§9) fixes the rendering to "the structural consequence authored for <plan label> is present",
and the banned-word test of `rfc/archive/structural-reading.md` §6b applies to it unchanged.

**The occurrence/success distinction, tested against the case that breaks it.** The ruling
admits checking the *occurrence of a declared target*; it does not admit judging the *success
of a plan*, and the whole difference between an honest check and a manufactured verdict
(ADR-0005, law 8) lives in that gap. This pack's own `carlsbad`/`central-break` is the test
case, and the author already wrote the answer into the corpus: *"No rules-arithmetic signature
distinguishes a working break from a wasted one."* **The break's occurrence is checkable** —
"the c-file is half-open for White and Black's c-pawn is backward" is a census, and if a break
had one it would be a legal `plan_consequence`. **The break's success is not**, and the two are
not the same proposition: a learner can produce the exact structure and be worse. So the rule
is stated as a biconditional the implementer can test against:

> `plan_consequence` may say **a named structure is on the board**. It may never say the
> learner's plan **worked**, **succeeded**, **was right**, or **was carried out**. If a
> sentence would remain true when the learner played the structure by accident, it is an
> occurrence claim and is admissible. If it would become false, it is a success claim and is
> refused.

Under that test "the structural consequence authored for Minority attack is present" passes —
it is equally true when reached by accident — and every rejected name fails it. Criterion 12
asserts the banned list; this paragraph is why the list contains `executed` and `followed`.
Note the asymmetry the ruling does **not** disturb: `central-break` is refused here not because
its occurrence is uncheckable in principle but because **its author declared no signature**, and
§5c-bis makes that declaration visible rather than silent.

#### 5c. Refusals mechanised

| Code | Fires when | Why it is a refusal and not a false condition |
|---|---|---|
| `PLAN_CONSEQUENCE_UNKNOWN_PLAN_CLASS` | `planClassId` is not an id in `pack.planClasses` | A dangling reference that would compile to a rule nothing can satisfy |
| `PLAN_CONSEQUENCE_NO_SHAPE_PLAN` | the plan class has no `shapePlan` | There is nothing to resolve; §5b's rule, enforced |
| `PLAN_CONSEQUENCE_NOT_COMPUTABLE` | the resolved shape plan's `success.signature` is `null` | **The anti-pretending rule.** Three quarters of authored plans say, in the author's own note, that no census distinguishes them. The format must make grading such a plan *impossible*, not merely false — a silently-false condition reads as "the learner failed", which is a verdict the evidence does not support |
| `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` | the resolved signature holds at **no** position of any authored spine path of the referencing pack | **The unexercised-expression rule**, and it is new to this draft (header finding). A signature has never been evaluated by any shipped code path, so a non-null one is well-formed, not satisfiable. A condition that can never be `true` on the pack's own authored line grades every learner *not achieved* forever — the anti-pretending rule failing open instead of closed. Same shape and same spine replay as `SHAPE_REFERENCE_NEVER_PRESENT` (§6), and like it, fires only when the shape lookup is supplied |

The shape lookup is optional in `validatePackDocument` (`options.shapes?: PackShapeLookup`,
and the `shapes?.get(...)` guard in the `shapePlan` checks) exactly as it is for `pack.shapes`
today: when no lookup is supplied — the emitters, `verify-draft` — an unresolvable reference is
*not* refused, and only `PLAN_CONSEQUENCE_UNKNOWN_PLAN_CLASS` and
`PLAN_CONSEQUENCE_NO_SHAPE_PLAN` (both pack-local) still fire. This is the shipped precedent,
followed rather than re-decided. Note the asymmetry it creates and accept it deliberately: a
pack that passes `verify-draft` may still fail `pack-check` on the three lookup-dependent
codes, which is the same asymmetry `SHAPE_PLAN_UNKNOWN` already has.

**Evidence refs, and D32 — corrected, because the defect changed shape.** This draft asserted
three times that `conditionEvidenceRefs` "throws a bare `TypeError`" and that
`validator-integrity` owns the fix. **Re-checked this cross-review: `ffc9817` already rewrote
it.** `conditionEvidenceRefs` now takes a `pointer` and throws
`PackCompileError("STRUCTURAL_CONDITION_HAS_NO_FEATURE", …)` — a named, pointed refusal, not a
bare `TypeError`. So the "D32 cannot bite here" argument still holds but for a smaller reason:
the throw is no longer anonymous, and the thing this RFC must avoid is adding a *second*
condition kind that can reach it. `plan_consequence`'s refs are defined so the set can never
be empty: the source id `planClass#<planClassId>` — following the shipped convention in
`authored-feedback.ts`, where feedback-claim source ids are built exactly that way (note this
is a *source id*, not `packEvidenceRef`, which lives in
`packages/runtime/src/evidence-ref.ts`; this draft conflated the two) — **followed by** the
resolved signature's `structuralFeatureKinds`. The plan-class ref is unconditional, so a
signature built only from `quantified`/`pieceOnSquare` nodes yields a one-element list rather
than a throw. This RFC does not touch the existing throw; it declines to add a second
instance of it. Acceptance criterion 7 is restated against the *current* code, not the
pre-`ffc9817` code.

#### 5c-bis. The uncovered majority — a visible refusal, not silence

**Owner ruling, 2026-08-15, relayed by the register coordinator: grade the 45%, refuse the
rest BY NAME.** Where a declared intent has a census target, the run tells the learner whether
that target occurred. Where it does not, the product **says so explicitly** — a visible
refusal, never silence, and never a guess.

**What the ruling does and does not overturn, stated precisely, because the draft was already
half-compliant.** This RFC was never a wholesale refusal of the covered half: §5b *ships* it
as `plan_consequence`, and §7 F1 refuses only the intent-*relative* half. What the ruling
overturns is one word, and it is F1's: this draft wrote that "the correct product behaviour
for a plan whose author says it has no census is **silence**, and §5c mechanises silence as a
load refusal." **That is now wrong.** A load refusal is author-facing: `pack-check` rejects
the condition, the author deletes it, and the learner is shown *nothing at all* — which is
indistinguishable from a plan the product simply forgot about. The ruling requires the
uncovered case to be visible.

**And a load refusal alone fails the declared-vs-executable law.** That law
(`rfc/archive/defect-sweep.md` §2) admits a value into the declared partition only with
**(1) capability publication, (2) a named refusal, (3) an applied record**. Audited against
this draft, the uncovered case scores **1 of 3**: `PLAN_CONSEQUENCE_NOT_COMPUTABLE` is a named
refusal, but nothing publishes which plan classes are gradable and nothing records that a
declared plan class went ungraded. `plan_consequence` as first drafted therefore admits the
covered half to the executable partition and leaves the uncovered half in neither partition —
it is simply absent, which is the quietest member of the same family D40 names.

**The fix, specified to all three properties.** The success-condition branch is unchanged: an
uncheckable plan class still cannot carry a `plan_consequence`, and
`PLAN_CONSEQUENCE_NOT_COMPUTABLE` still fires. What is added is the *publication* and the
*record*, on the plan class rather than on the condition:

1. **Capability publication.** The pack projection publishes, per plan class, a
   `gradability` value in a **closed three-value vocabulary**:
   `"graded"` (a `plan_consequence` resolves to a satisfiable signature),
   `"declared_uncheckable"` (a `shapePlan` resolves and its `success.signature` is `null` —
   the author's own note is the reason, and is carried with it), and
   `"unbound"` (no `shapePlan`, so the author never named a consequence at all). This is
   derived at load from the resolver of §5b, not authored, so no pack field is added and no
   author can lie about it. It rides the existing plan-class projection that
   `CheckpointSheet`/`TerminalSheet` already read.
2. **A named refusal, learner-facing.** For `declared_uncheckable`, the surface renders the
   fixed refusal sentence and the author's note verbatim:
   *"This plan has no structural signature, so the drill does not check it."* plus
   `success.note`. For `unbound`, no plan-level claim is made at all and the plan class
   renders exactly as it does today — an author who never named a consequence has declared
   nothing to refuse. The refusal sentence is held to the §9 banned-word test like every other
   sentence, and it is a **fixed string**, not generated prose (law 8).
3. **An applied record.** Nothing new is persisted — parent law 1c holds and the header's
   "no migration" claim survives — because gradability is a **derived projection** of the pack
   plus the shape library, exactly as `shapeFirings` is, and is recomputed rather than stored.
   The *record* the law asks for is the evidence ref already specified above: a graded
   `plan_consequence` carries `planClass#<id>` plus its signature's feature kinds, so the
   grounds panel can say which plan class produced the verdict and from which census.

**This is the smallest thing that satisfies the ruling, and it is deliberately not more.** It
does not add a run event, does not consult the learner's declaration, and does not grade
anything new. It makes the *shape of the coverage* visible — which of a pack's plan classes
the product can check, which it has been told it cannot, and which nobody bound — so that
`carlsbad`'s three-way choice reads as "one checked, two declared-uncheckable with the
authors' reasons" instead of as one graded plan and two absences.

**What the ruling still does not deliver, and this is the load-bearing caveat.** The ruling
speaks of "a declared intent". `plan_consequence` grades an **author-named** plan class, not a
**learner-declared** one — the learner's declaration is still not recorded anywhere (§5d), so
"the run tells the learner whether they did it" is true only in the sense that the run reports
whether the *authored* target occurred on the line they played. Closing the last step — using
the plan the learner actually chose to select which condition applies — remains F1's blocker
and still needs the run event, the migration and the client surface that
`rfc/archive/authoring-frictions.md` §4 scopes out. §5d ships the join key so that work costs
a selector and not a format change. **The 45% is deliverable in this wave; the word "declared"
in front of it is not.**

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
(`$defs/intentCapture` in `schemas/drill_pack.schema.json`); when the answer slot ships, selecting the
condition that matches the declared plan requires **no schema change here** — the join column
already exists on both sides. A `whenDeclared` flag was considered and refused under §7 F1's
rule: no field ships without an evaluator.

### 6. Shape-reference modality

`pack.shapes` is an array of ids (`schemas/drill_pack.schema.json:35-40`) and
`shapeFirings` (`packages/runtime/src/shape-firing.ts:15-33`) walks a path asking whether each
entry's trigger holds. Three of the corpus's references never hold anywhere on their pack's
authored spine, and all three are *hands-off-to* declarations rather than *present-now*
claims — the opening-wave author predicted exactly this and recorded that "the format cannot
distinguish them" (`planning/content-era/log.md:744-749`). Reproduced this pass on the 35-pack tree: **22 of 25**
fire, 3 do not, and the three are `anti-sicilian-najdorf-english-attack` → `opposite-castling-race`,
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
  the spine with chessops for a different purpose (`reasoningCheckpointFen`, `apps/server/src/pack-validation.ts`), so this is a reuse of the technique, not a new capability — but not
a reuse of the *function*: `reasoningCheckpointFen` walks one spine for one checkpoint, and
this rule needs every shape trigger evaluated at every position of every authored spine path.
The implementer factors the replay out rather than calling it. As with every other
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

**Count corrected this cross-review.** `ae8aab7` added four references
(`anti-kid-classical-white` and `kid-classical-black` → `kid-chain-arrangement`,
`anti-london-black` and `london-system-white` → `london-wedge`), so the corpus now carries
**29**, of which the four new ones are **unmeasured** for firing. The three non-firing
references named above all still exist. The implementer measures all 29 rather than inheriting
"22 of 25", and the three-versus-four split is the thing to re-derive, not the totals.

**Why it is not a predicate.** A prospective claim is about positions that do not exist yet.
Putting it in `StructuralExpression` would mean `matchesStructuralExpression(fen, e)` could be
handed an expression it cannot answer from `fen` — breaking admission rule 1 for the *whole
grammar*, not just for one leaf. The relation therefore lives on the reference, where the
consumer (`shapeFirings`) already has a path rather than a position.

**Content.** The three references above become `{ shape, relation: "prospective" }`; every
other reference stays a bare id and becomes validator-checked. This draft said "the other 22"
and "three pack digests move"; on the current 29-reference corpus the residual is **26** and
the digest count depends on how the four unmeasured references resolve — the implementer
measures first and records the actual set.

### 7. Refusals, each with its rule

**F1 — intent-*relative* grading. Refused; blocker named.** Conditioning a grade on the plan
the learner declared requires the declaration to exist as data. It does not: no run event
(`packages/runtime/src/types.ts:270-286`), no client surface, no storage. Producing one needs
a run-schema bump, a migration number and a client interaction — three shared resources this
draft has not claimed, and `rfc/archive/authoring-frictions.md:85-90` already scopes the same work out
for the same reason and calls it "a whole RFC… the next drafted follow-up". §5d ships the join
key so that RFC costs a condition selector and not a format change.

The second half of the refusal is the one that matters more. Even granted the recording,
**the ceiling is 45%**: of 103 authored plans, 28 have a signature today and 18 more are
blocked on vocabulary that could exist (§4's table); the remaining **57** are judgment (21),
outcome or duration (21), history (1), and family-scope or move-order problems (14) that no
position census will ever settle. (This draft first wrote "49", which does not add up:
28 + 18 + 57 = 103, and 21 + 21 + 1 + 14 = 57. The 45% ceiling — 46 of 103 — is unaffected.)
**And the ceiling is an upper bound on an unverified basis:** the 28 "have a signature today"
plans have never been evaluated against a board (header finding), so some fraction of them may
not be satisfiable either. 45% is the optimistic reading, not the measured one. `design/research/authored-transitions-and-features.md:38-47`
draws that line and the authors drew it themselves. A predicate that graded those plans would
be manufacturing a strategic verdict — ADR-0005's named prohibition and this repo's law 8.

**Amended by owner ruling, 2026-08-15 — this paragraph previously ended "the correct product
behaviour for a plan whose author says it has no census is **silence**, and §5c mechanises
silence as a load refusal."** The refusal to *grade* those plans stands, and stands harder: it
is the law-8 line and no ruling touches it. **What is overturned is silence as the product
behaviour.** The correct behaviour is a **named, visible refusal**: the plan class is published
as `declared_uncheckable`, the author's own note is shown as the reason, and the learner is
told the drill does not check this one. §5c-bis specifies the three properties the
declared-vs-executable law requires and audits this draft at 1 of 3 before them. A load refusal
still prevents an author in a hurry from grading an uncheckable plan; it is no longer also
what the learner experiences.

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
| A live rendered consumer | `pivotalMarkers`/`renderPivotalMarker` reach `compare-strips.ts:38`, `packages/runtime/src/story.ts:78-79` (**not** `apps/server/src/story.ts` — this draft had the wrong package) and `apps/web/src/lib/DrillScreen.svelte:277,331` | The *reading* half of transitions is already on screen. Only the **authorable** half is missing |

So the cost is an **extraction**, not an invention, and this RFC says so plainly because it
changes the shape of the follow-on: two of the four primitives are already written and dead,
one is written and private, and one is written and rendered.

The remaining structural cost, stated so promotion is cheap:

| Question | Answer, from the tree |
|---|---|
| Can it be a `StructuralExpression` member? | **No.** The root position has no predecessor, so such a node is undefined at the root, and `matchesStructuralExpression(fen, …)` (`structure.ts:351`) has one position by construction. It must be a **sibling grammar** with a sibling evaluator: `matchesTransitionExpression(before: string, moveUci: string, after: string)` |
| Is the input available where conditions are evaluated? | **Yes.** `evaluateObjectivePredicate(run, predicate)` (`objective.ts`) resolves the active `Node`, and `Node` carries `parentId`, `fen` and `moveUci` (`packages/runtime/src/types.ts:86-101`); `pathToNode` (`objective.ts`) already walks parents. `shapeFirings` already receives an ordered path (`shape-firing.ts:17`). Only the *static* validator and `guidance.ts` need a rule for "no predecessor" |
| Authoring attestations | **Zero.** No authoring wave has filed a transition claim as a format gap. It is attested from the design side — discovered-threat visualisation, the opponent-intent prompt, the prophylaxis/denial readable, and the 2026-08-15 taxonomy — and those are ledger rows from one source |

**The owner's taxonomy, sorted, so the follow-on has a scope and not a mood.** Each item is
tested against the four admission rules applied to a *transition* rather than a position:

| Primitive | Verdict | Note |
|---|---|---|
| Attacks and defences created / removed | **Admissible.** Set difference of attack sets across the move | The `pawnAttacks` before/after test at `pivotal.ts:52-54` is this, narrowed to pawns |
| Lines opened / closed | **Admissible.** `line_blockers` evaluated on both positions | The leaf ships; only the delta is missing |
| Control delta on a square or region | **Admissible.** `direct_attack_count` on both positions | Same shape. This draft added "note that this is the first authoring use `direct_attack_count` would ever have" — **no longer true**: `london-wedge.json` authors it twice (§1b, corrected) |
| Escape squares removed | **Admissible.** Difference of a piece's destination set | Board geometry, not legality search, or rule 1 fails |
| **Overload — a defender acquiring a second duty** | **Admissible, and the owner's framing is right**: it is a *count* of how many attacked friendly pieces one piece defends, not a judgment that the defender is overloaded. The arithmetic ships and the word does not — the parent's exact ruling for "trapped" (`rfc/archive/structural-reading.md:294-298`) | The name must be the count, e.g. `defended_duties`, never `overloaded` (rule 4) |
| Tempo, irreversibility | **Admissible**, and half-shipped: `irreversibility` (`pivotal.ts`) already classifies castling, last-of-role and pawn breaks | Tempo *accounting* belongs to `rfc/tempo-vocabulary.md`; only the per-move irreversibility census is here |
| **Repositioning — "back or to the side so it can rotate into a nice slot in two"** | **Split by measurement, 2026-08-15 — this row previously read "Admissible, and the owner is right that it is not judgment", and that is now half refuted.** The *metric* is not judgment: knight distance to a square set is graph distance, BFS over knight moves on the empty board, a fixed 64×64 table, exactly as Chebyshev is for kings — **admissible as a STATIC leaf**, and attested twice (§4b). The **target square set IS the judgment**, so the *delta* form is **not admissible as a detector**: `design/research/move-primitive-computability.md` §4d–4f measured a **98.7% false-positive rate** with no authored target (0.0% precision under the sharpest filter), **52.8%** of the piece's own alternatives satisfying the delta even with the target supplied, and routing explaining only **9 of 17** author-labelled repositions | **Amended placement, and now settled:** the static half **shipped in this wave** as `piece_distance` (§4b, owner ruling 2026-08-15) — including the knight BFS metric this row needs — and belongs with the static vocabulary on its own attestations, **not here**. What lands here is the delta **as a renderer of an author-declared destination only** — never as the thing that discovers the destination |
| **Prophylaxis — "prevent their plan"** | **Refused here, and not absorbed.** See F9 | Belongs with `rfc/resistance-spectrum.md`, not with a position-or-transition census |

**Why still not now**, and the reason is unchanged by the cost finding, because cost was never
the objection. Two things are missing and neither is machinery. First, **authoring
attestations**: the roadmap's stated bar is gaps real content has hit twice, and this has hit
content zero times. Second, and decisively, **a consumer for the authorable half**. Its two
consumers are a drill condition and an in-run hint surface, and the hint surface belongs to
`design/05-in-run-experience.md`'s assistance ladder, not to pack vocabulary. Shipping the
grammar before the surface would repeat the exact mistake this repo is currently paying for —
`timingWindow` shipped with `windowOpens` and `luxuryMoveBudget` that **no evaluator reads**
(`checkpointMatches` in `apps/server/src/pack-orchestrator.ts` reduces a window to its closing trigger), and
the result is **0 uses across all 145 corpus checkpoints** and a blocked E3 gate. A cheap predicate with
no consumer is still the failure mode with the longest measured record in this codebase; being
cheap is what makes it *tempting*, not what makes it right.

**What the follow-on wave takes, stated so nothing widens silently:** the sibling grammar and
evaluator above; the taxonomy rows marked admissible; and the extraction of
`capturedRole`/`irreversibility`'s transition analysis and `compare-strips`'s route
reconstruction out of their host features into shared primitives. It does **not** take
prophylaxis (F9), tempo accounting (`rfc/tempo-vocabulary.md`), or any legality- or
search-dependent notion of a threat. **Nor does it take the graph-distance metric** — amended twice: that metric is a *static* leaf
on two measured attestations, and as of the 2026-08-15 ruling it **already shipped** in this
wave as `piece_distance` (§4b). The follow-on inherits only the author-target-supplied
*rendering* of its delta, and inherits the metric as a dependency rather than as work.
Two further findings the follow-on inherits from `move-primitive-computability.md`: the whole
census costs **29.06 µs/ply** from two FEN strings, so cost is settled and is an argument in
neither direction; and `structuralDelta` costs **1721 µs/ply** (~43% of it in
`evictionChanges`, whose `pawnSafety` calls each re-parse the FEN) — whatever promotes this
category inherits that function and must not inherit it in that state.

**Promotion trigger, so this is a schedule and not a shelf:** the first authoring wave to file
a transition claim as a format gap, **or** the RFC that ships the discovered-threat surface,
whichever comes first. **Neither has fired**, re-checked 2026-08-15 by
`design/research/move-primitive-computability.md` §5: no `signature: null` note in the corpus
is a one-move transition claim (the nearest, `fianchetto-g7`'s *"Detection cannot tell a traded
bishop from one that merely moved away"*, is evaluated at an arbitrary later position and is
therefore the **history** case F2 refuses), and no RFC claims the discovered-threat surface.
A research dossier is neither trigger, and this one says so itself. Whichever it is names this section and inherits its specification. A
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
`rfc/resistance-spectrum.md` §7a (**`:487-501`** on the current tree; this draft cited `:450-464`, which is §5) hands a learner-side grading consumer to "the
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
claimed" is no longer the blocker — `rfc/archive/validator-integrity.md` declined 0.19 and **0.20 is
free**. The consumer should ride the first draft after `resistance-spectrum` implements, name
that RFC in `Depends on:`, and inherit §7a's specification verbatim. The ledger row
(*Practical difficulty has no learner-side grade*) stays open and this RFC is not its answer.

### 8. Exhaustive dispatch — every widened union, every site (D26)

The parent's law is inherited: **every dispatch over a widened union ends in a `never` binding,
and a missing case is a compile error followed by a runtime refusal.** Three unions widen
(`StructuralFeature`, `SuccessCondition`, and `pack.shapes`'s item type).

| Site | Today | Under this RFC |
|---|---|---|
| `matchesStructuralFeature` (`packages/runtime/src/structure.ts`) | `never` guard | compiler forces `piece_count`, `king_zone`, `piece_distance`; guard retained. `piece_distance` dispatches again over its five-role metric, and **that inner switch carries its own `never`** — a sixth role added later is a compile error, not a silent Chebyshev fallback |
| `mirrorFeature` (`structure.ts:223-235`) | `never` at `:233` | **three mirror rules must be written** (§8a); the `never` is what forces them |
| `structuralFeatureKinds` (`structure.ts:449-465`) | exhaustive switch | three cases; each new leaf contributes its own kind fact |
| `structuralIssues` leaf walk (`apps/server/src/pack-validation.ts`) | `never` → `STRUCTURAL_KIND_UNRECOGNISED` | three cases: two with range refusals (§3, §4b), `king_zone` with none |
| `renderStructuralObservation` (`renderStructuralObservation`, `apps/web/src/lib/structural-sentences.ts`) | `never` guard | compiler forces three observation sentences |
| `renderFeatureSpec` (`structural-sentences.ts`) | `never` guard | compiler forces three spec sentences |
| `successPredicate` (`apps/server/src/pack-orchestrator.ts`) | `never` guard after five arms | compiler forces the `plan_consequence` arm; it needs the resolved signature, so the function gains a `PlanSignatureResolver` parameter (§5b) rather than reaching for a global. **`objectiveRules`, `orchestratePackStart`/`orchestratePackMove`, `progress.ts` and `pack-validation.ts`'s `ObjectiveCompiler` all widen with it** — verified this cross-review that none of them has shape access today |
| `conditionEvidenceRefs` (`pack-orchestrator.ts`) | throws on an empty leaf set (**D32**) — as of `ffc9817` a named `PackCompileError("STRUCTURAL_CONDITION_HAS_NO_FEATURE")`, **not** the bare `TypeError` this draft described | gains a `plan_consequence` arm whose first ref is unconditional (§5c); the existing throw is untouched |
| `pack.shapes` readers — the `shapePlan`/`SHAPE_REFERENCE_UNKNOWN` checks in `pack-validation.ts`, `apps/server/src/pack-orchestrator.ts`, `shapeFirings` call sites, `pack-check.ts` | assume `readonly string[]` | one shared normaliser `shapeReferences(pack): readonly { shape: string; relation: "present" \| "prospective" }[]` in `packages/schema`, exhaustive over the two item forms with a `never` default. **Every** reader goes through it; a reader that destructures the raw array is a review failure |

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
- `piece_distance`: **every** per-role metric is preserved by file reflection and rank
  reflection — Chebyshev, the knight graph, the slider move-counts and bishop shade-parity are
  all reflection-invariant (a reflection is an isometry of the board graph for every role) — so
  `role`, `comparison` and `count` never change. `color` flips under `colors`/`both`; a `square` target maps by the
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
- **`piece_distance`**: exactly **one** observation, the king-to-king distance,
  `{ kind: "piece_distance", role: "king", squares: [both king squares], count }`. **Only the
  king role is projected** — enumerating five roles × two colours × six target roles would be
  the projection walking author-query space, the same rule that keeps the `piece`-target form
  out below, and it is why generalising the leaf does not generalise the reading. The `piece`-target form is
  **not** projected: enumerating every `(color, role)` pair would be the projection walking
  author-query space, which the parent's rule forbids and wave 2 restated for `quantified`.

`StructuralObservation` (`structure.ts:69-80`) gains one optional readonly field,
`zone?: "edge" | "corner"`, and reuses the existing `role` and `count`.
`RULES_EVIDENCE_FACTS` (`packages/runtime/src/evidence-ref.ts:1-26`) gains
`structure-piece-count`, `structure-king-zone`, `structure-piece-distance` — eighteen
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
| observation `piece_distance(king, e4/e6, 2)` | "The kings on e4 and e6 stand 2 king-moves apart." |
| spec `piece_distance(white, king, square e8, atMost, 2)` | "white's king is at most 2 king-moves from e8" |
| spec `piece_distance(white, king, piece black rook, atMost, 3)` | "white's king is at most 3 king-moves from the nearest black rook" |
| spec `piece_distance(black, knight, square a4, atMost, 3)` | "black's nearest knight is at most 3 knight-moves from a4" |
| spec `piece_distance(white, bishop, piece black king, atMost, 2)` | "white's nearest bishop is at most 2 bishop-moves from black's king" |
| condition `plan_consequence("minority-attack")` | "the structural consequence authored for Minority attack (a3, Rab1, b4-b5) is present" |

No sentence says *trapped*, *confined*, *active*, *close enough*, *executed*, *achieved the
plan*, or any word on the parent's banned list. The `difference` form renders as counting, per
wave 2's ruling.

### 10. Content demonstrations

Six demonstration **classes** change, each an acceptance demonstration and each verified this
pass. This draft first called them "six shipped artifacts"; the scoping correction in §3 makes
the file count larger — item 3 alone touches twelve pack files and thirteen shape entries — so
the list below enumerates classes, and the implementer counts files from the corpus:

1. **`mate-two-bishops.json`** — the degrade condition gains the `piece_count` form of the
   claim its own summary makes ("a loose bishop"), as `any[…]` with the shipped
   `bishop_on_shade` arm retained: the shade arm states the two-complex wall is gone, the
   count arm states a bishop is gone, and they are not the same claim. Probe table asserts
   `[false, true, true]` for the count arm across both-bishops / one-bishop / bishopless.
2. **`trajectory-mate-bishop-knight.json`** — `king-on-the-edge` becomes one `king_zone` leaf
   (765 bytes → one node, 0 disagreements over the spine and over all 3612 legal two-king
   placements); the six existence-hack leaves become three `piece_count` pairs; leg 3 gains
   the `piece_distance` degrade condition of §4b (`role: "king"`). The corner *box* stays a `quantified` region
   with its provenance note intact — the ply cap, not the vocabulary, is why.
3. **The other 137 `piece_reach_count` existence leaves** — **37** across the remaining twelve
   pack files in `content/drafts`, plus **100** across thirteen files in `content/shapes`
   (scoping correction, §3; this draft first said "37 across eleven packs" and counted
   `content/drafts` only) — are rewritten to `piece_count`, and equivalence is asserted by
   evaluating old and new against every position of every authored spine. Each touched shape
   entry bumps its `semver`; **more than six artifacts change**, and §10's headline count is
   corrected to **six demonstration classes**, not six files.
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
| `piece_distance` with an empty subject or `piece` target set | False, not an error |
| `piece_distance` to `{piece, own colour, own role}` | Refused (`PIECE_DISTANCE_SELF_TARGET`) — constant 0 |
| `piece_distance` with `count` outside `0 … max(role)` | Refused (`PIECE_DISTANCE_OUT_OF_RANGE`) — a constant. Per role: king 7, knight 6, rook/bishop/queen 2 |
| `piece_distance` with `role: "pawn"` | Refused (`PIECE_DISTANCE_ROLE_UNSUPPORTED`) — no undirected board distance exists for a pawn |
| `piece_distance(white, bishop, …)` where every white bishop is off-shade from the target | **False**, for every comparison including `atLeast`. Never vacuously true — the explicit anti-vacuity rule of §4b, written so this leaf does not reproduce `scope:"every"`'s trap on the day the wave retires it |
| `piece_distance` with `role: "rook"`, `atMost, 2` | Legal and constant-true wherever a rook and the target both exist; **not** refused — 2 is inside the attainable range, exactly as `piece_count(king, equal, 1)` is |
| `piece_distance(king, atMost, 1)` to the enemy king | Legal and constant-false in a legal position (adjacent kings are illegal). **Not** refused: unlike the self-target case the constancy follows from chess legality rather than from the leaf's own arithmetic, and the validator does not adjudicate legality of hypothetical positions |
| `plan_consequence` whose resolved signature is `null` | Refused (`PLAN_CONSEQUENCE_NOT_COMPUTABLE`) |
| `plan_consequence` on a plan class with no `shapePlan` | Refused (`PLAN_CONSEQUENCE_NO_SHAPE_PLAN`) |
| `plan_consequence` with no shape lookup supplied (emitters, `verify-draft`) | Only the two pack-local refusals fire, matching `pack.shapes`'s shipped rule (the `shapes?.get(...)` guards in `pack-validation.ts`) |
| Two `plan_consequence` conditions naming different plan classes in one objective | Legal. They are independent censuses, and a position can satisfy both; deciding which one "the learner meant" is F1 |
| `plan_consequence` in a `run_trajectory` top-level objective | Refused by the existing `TRAJECTORY_TOP_LEVEL_CONDITIONS_UNSUPPORTED` (`pack-validation.ts`, the `run_trajectory` branch); legs may carry it |
| A `prospective` shape reference | Never fires, never validated against the spine, never resolvable as a `plan_consequence` source |
| The same shape id in both a bare and an object form | Refused (`SHAPE_REFERENCE_DUPLICATE`) — `uniqueItems` cannot see it |
| A deprecated `pawn_count` or `scope: "every"` leaf | **Warning**, not error; the pack still loads and still evaluates identically. Wave 4 makes it an error |
| Community shapes registered under grammar 0.2 | Still valid; every change here is additive or a warning, and registered documents are immutable |
| A nineteenth leaf kind added later without a case in any dispatch site | Compile error at every site in §8's table, then `STRUCTURAL_KIND_UNRECOGNISED` — never a silent skip |

### 12. Schema changes

**Pack schema 0.17 → 0.18** (`DRILL_PACK_SCHEMA_VERSION`, `packages/schema/src/index.ts:2`;
`$id` at `schemas/drill_pack.schema.json:3`). Additive; pack digests are content digests and
are unaffected by the `$id` (`packages/schema/src/drill-pack/digest.ts:59-71` digests the pack document, which does not carry the schema `$id`), so the only
digests that move are the files §10 edits — **more than the ten this draft first claimed**, because item 3's rewrite surface is 143 leaves rather than 43 (§3); the implementer records the actual set. Additions: three branches in
`$defs/structuralFeature`; a sixth branch in `$defs/successCondition` (**seventh after 0.17** — see the header ordinal note); a new
`$defs/distanceTarget` (plus `piece_distance`'s five-value `role` enum, inline in its branch and deliberately **narrower** than `$defs/role`); `shapes` items become the two-form `oneOf` of §6. Every new object
is `additionalProperties: false` — the pinned passthrough inventory must still count exactly
**two** sites (`/$defs/feedbackClaim`, `/$defs/provenance`,
the `pins the two legacy schema passthroughs` test in `packages/schema/src/drill-pack.test.ts`).

**Shape-entry schema 0.2 → 0.3** (`SHAPE_ENTRY_SCHEMA_VERSION`,
`packages/schema/src/index.ts:3`; `$id` at `schemas/shape_entry.schema.json:3`): the three
feature branches and `$defs/distanceTarget` land in the duplicated `$defs` copy
(`shape_entry.schema.json:47-65` and `:66-76`). The existing cross-schema equality test in
`packages/schema/src/shape-entry.test.ts` is what makes "both copies" enforceable rather than
remembered. Nothing else in the entry format changes; `plan.success`
(`:77`) and the `shapes` relation are untouched from the entry side.

**No migration** (header). Nothing persisted changes shape.

### 13. Cost

`piece_count` is an O(piece-count) board scan; `king_zone` is O(1); `piece_distance` is O(1) for
a `king`/`rook`/`bishop`/`queen` subject against a square target, a single lookup in a fixed
64×64 table for a `knight` subject, and O(subjects × targets) — at most 10 × 10, and 1 × 1 for
the projected king-to-king case — for a piece target. No search, because occupancy is never
read. The reading projection changes from two
`pawn_count` observations to twelve `piece_count` observations plus at most four `king_zone`
and one `piece_distance` — fifteen more observations in the worst case. `plan_consequence` adds
one map lookup at load and **zero** runtime cost: it compiles to the predicate
`structural_feature` already compiles to. `SHAPE_REFERENCE_NEVER_PRESENT` adds one spine replay
per pack at validation time, on the path that already replays the spine for reasoning
checkpoints.

The parent's measured-not-gated ruling applies unchanged (`docs/structural-reading.md:85-89`):
the structure test re-records a non-vacuous sample, 100 ms remains the worry threshold, and no
wall-clock pass/fail gate is added.

**Baselines to re-verify on the implementing checkout** (this draft verified the content and
evaluator facts, not the suite): `DRILL_PACK_SCHEMA_VERSION` is `"0.16"` and
`SHAPE_ENTRY_SCHEMA_VERSION` is `"0.2"` **on the current tree** — re-checked this
cross-review at `packages/schema/src/index.ts`; the draft's original `"0.15"` was stale before
`ffc9817` landed `authoring-frictions` as 0.16. So this RFC's 0.18 now assumes only **0.17**
(`tempo-vocabulary`) has landed; if it has not, the implementer rebases the number in
`rfc/README.md` rather than skipping ahead.

## Deviations from design

1. **The roadmap's item 1 is "intent-relative success"; this RFC ships an intent-*blind*
   condition and refuses the intent-relative half.** The dossier and the ledger row *A plan drill's objective cannot be expressed*
   both describe the target as grading the plan the learner committed to. The deviation is
   forced by evidence the ledger row predates: the commitment is not recorded anywhere
   (§5d), and `design/research/authored-transitions-and-features.md:38-47` measured the
   ceiling at 45% of authored plans even once it is. Shipping the join key and the refusal is
   the honest subset; shipping the whole thing would require inventing both the data and the
   verdict.
2. **The ledger row *A plan drill's objective cannot be expressed* says "the predicate machinery ships and is authorable; only
   feature-level vocabulary (Q4b) is missing."** Measured against the corpus this is now
   false in an instructive way: for `carlsbad-minority-attack` the vocabulary was never
   missing — the *binding* was, and the pack compensated by grading three plan choices with
   one plan's census. The row's diagnosis was right about the mechanism and wrong about which
   piece was absent. Proposed as a ledger correction, not a `design/` edit (law 5).
3. **D34 is filed as "no king-geometry vocabulary" and this RFC closes only the predicate
   half.** The row's second clause — `reach_structure`, a pawn word, doing duty for a king
   target — is objective-type vocabulary and is left to the objective-type widening
   the *A plan drill's objective cannot be expressed* row tracks. Splitting a defect row across two RFCs is worth naming
   rather than leaving the row to look closed.
4. **The shape-reference relation is not in `design/`.** the ledger row *Opening-wave authoring frictions (2026-08-14)* carries the
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
   **0 mismatches** (this draft measured 4528 checks; 4744 on the post-`ae8aab7` tree — the
   implementer re-measures rather than quoting either). **All 143** rewritten leaves (43 in
   `content/drafts`, 100 in `content/shapes`) are asserted verdict-identical to their
   originals over the same positions.
3. **The dead condition, as a regression test.** `not(piece_reach_count(white, bishop, every, atLeast, 0))`
   evaluates `false` on a bishopless position, with a comment citing `25b4584` and
   `design/research/authored-transitions-and-features.md:487-498`; the `piece_count(atMost, 1)`
   form evaluates `[false, true, true]` across both-bishops / one-bishop / bishopless.
4. **`king_zone` equivalence and mirror invariance.** `king_zone(black, edge)` agrees with the
   pre-RFC four-arm `quantified` fan on **all 3612** legal two-king placements and on every
   position of the B+N spine, first firing at **ply 8** in both forms; `king_zone(black, corner)`
   first holds at **ply 34**, and a test comment records that this is 26 plies after the leg-2
   entry and therefore outside the 20-ply cap. A mirror table asserts `zone` is invariant under
   all three axes and `color` flips under `colors`/`both`.
5. **`piece_distance` — the metric table, exhaustively.** For **each of the five subject
   roles**, the per-role metric is asserted against an independently computed 64×64 table over
   **all 4096 ordered square pairs**, and the observed maxima are asserted to be exactly
   **king 7, knight 6, rook 2, bishop 2, queen 2**. Two independent pins are asserted because
   they catch a wrong metric that a maximum would not: the knight `d = 1` count is **336** (the
   known number of knight moves on an 8×8 board) and the bishop unreachable count is
   **2048 = 2 × 32 × 32**. Both target arms; a piece target with several matching pieces
   (minimum taken) and with none (false, no throw); a subject set with several pieces (minimum
   taken) and with none (false, no throw).
   **The anti-vacuity assertion is mandatory and is the one most likely to be skipped:**
   `piece_distance(white, "bishop", <off-shade target>, "atLeast", n)` is asserted **`false`
   for every `n` including 0**, not true — this is `scope: "every"`'s trap, and the wave that
   deprecates it must not re-ship it. Asserted on **real content, not a hand-built FEN**:
   measured this pass, **85 of 440** knight-bearing spine positions have every white bishop
   off-shade from the black king, **22 of them in `mate-bishop-knight`** — a bishop-and-knight
   mate pack, i.e. exactly where an author would write this leaf. The test walks that pack's
   spine and asserts `false` at each.
   `PIECE_DISTANCE_OUT_OF_RANGE` (asserted **per role**, so `rook … atLeast 3` is refused
   where a flat 0–7 bound would admit it), `PIECE_DISTANCE_SELF_TARGET` and
   `PIECE_DISTANCE_ROLE_UNSUPPORTED` fixtures fail `validatePackDocument` with those exact
   codes. A mirror table asserts distance invariance under all three axes **for all five
   roles**, not only the king. A `@ts-expect-error` sentinel asserts the five-role metric
   switch is exhaustive (§8).

5a. **`king_distance` does not exist.** A grep asserts no `king_distance` kind, no
   `KING_DISTANCE_*` code and no `kingDistanceTarget` `$def` appears in either schema file, the
   runtime union, the sentence tables or `RULES_EVIDENCE_FACTS` — the check that the
   subsumption of §4b actually happened rather than leaving two spellings of one census.
   Equivalence is asserted positively too: `piece_distance(C, "king", t, cmp, n)` agrees with a
   reference Chebyshev implementation on **all 4096** ordered square pairs.
   The B+N leg-3 condition of §4b — now `piece_distance` with `role: "king"` — is false at
   every position of leg 3 on the authored line and true at plies 2 and 8, which are outside
   it.
6. **`plan_consequence` resolution and refusals.** `carlsbad-minority-attack` compiles the
   condition to the same `ObjectivePredicate` its inline structural condition compiles to
   today, asserted by deep equality; fixtures for `PLAN_CONSEQUENCE_UNKNOWN_PLAN_CLASS`,
   `PLAN_CONSEQUENCE_NO_SHAPE_PLAN` and `PLAN_CONSEQUENCE_NOT_COMPUTABLE` (the last using
   `central-break`, with the author's note quoted in the test) fail validation with those exact
   codes and make `make pack-check FILE=<fixture>` exit non-zero, asserted on the exit code;
   with no shape lookup supplied only the two pack-local codes fire.
6a. **The signature actually fires, and an unsatisfiable one is refused.** The single most
   important new test, because no shipped code path has ever evaluated a
   `plans[].success.signature`: a test asserts that `carlsbad`'s `white-minority-attack`
   signature, resolved through `plan_consequence`, evaluates **`true`** at the position the
   pack's own inline condition reaches and **`false`** at the tabiya — i.e. that the field is
   no longer inert. A fixture whose resolved signature holds at no position of the pack's
   authored spine fails validation with `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT`, and a
   corpus-wide report lists, for every pack, which of its plan classes resolve to a satisfiable
   signature — the number that replaces "16 of 99" with a measured one.

6b. **The visible refusal, all three properties (§5c-bis, owner ruling).** For
   `carlsbad-minority-attack`: the projection publishes `gradability` as `"graded"` for
   `minority-attack` and `"declared_uncheckable"` for `central-break` and `kingside-attack`,
   carrying each author's `success.note` verbatim; a client test asserts the refusal sentence
   and the note are both rendered for the two uncheckable classes and that **no** plan-level
   claim is rendered for an `"unbound"` class; and the evidence refs of the graded condition
   contain `planClass#minority-attack` followed by the signature's feature kinds. A
   `@ts-expect-error` sentinel asserts the three-value `gradability` vocabulary is closed.
   **No run event, no run-schema change, no migration** — asserted by the existing
   `STORAGE_VERSION` pin.

6c. **Occurrence, never success (§5b).** The rendered condition sentence is asserted to remain
   true of a position reached by accident: the same FEN graded through `plan_consequence` with
   no preceding moves renders the same sentence. Criterion 12's banned list is the negative
   half; this is the positive half.

7. **No D32 second instance**, asserted against the *current* code — `ffc9817` replaced the
   bare `TypeError` with `PackCompileError("STRUCTURAL_CONDITION_HAS_NO_FEATURE")`, so the
   test asserts the named error is not raised. A `plan_consequence` whose resolved signature contains only
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
    tables are the same set; a shared fixture list of all eighteen leaves and all **seven** success
    conditions (six if 0.17 has not landed) round-trips through the schema and the runtime unions in both directions.
12. **No sentence carries a verdict.** Every new observation, spec and condition sentence is
    rendered against fixtures and asserted free of the parent's banned list, case-insensitive
    whole words, plus `trapped`, `confined`, `active`, `executed`, `followed`.
13. **Browser.** The structural-reading disclosure (`tests/browser/drill.spec.ts`, the structural-disclosure region at **`:163-175`** — this draft inherited `:337` verbatim from `rfc/archive/predicate-wave-2.md:761`, where it was already stale; `:337` is the game-story share-link assertion)
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
    `docs/drill-pack-format.md` records 0.18, `plan_consequence` as the **seventh** success-condition kind (sixth if 0.17 has not landed) and the shape
    relation; `docs/shape-library.md` records shape-entry schema 0.3 and that
    `plan.success.signature` is now a resolution target for pack grading;
    `docs/explanation-grounds.md` records eighteen `structure-*` facts.
18. **Ledger.** The BACKLOG rows this ships are flipped in the landing commit (RFC completion
    protocol): the existence-hack half of `Shape plans are 73% uncomputable by their own
    authors`, D34's predicate half, the shape-reference clause of the opening-wave frictions
    row, and the plan-objective friction row's binding half. **Two rows this draft calls
    "proposed" already exist and must be AMENDED, not duplicated** (verified this
    cross-review): *Sunset rule for zero-use vocabulary* (§1b) and *Intent grading has a
    measured ceiling of ~45%* (§7 F1). Genuinely new rows: the transition category (§7 F4,
    carrying the extraction framing and the R2 refutation), the F7 wave-4 target, and
    Deviation 2's correction. **Two existing rows are also made stale by this wave and are
    corrected in the same commit:** *Shape plans are 73% uncomputable by their own authors*
    (the title itself is wrong twice over — 78 of 117 on the current tree, and the framing is
    100% unmeasured, not 73% uncomputable) and *Shape plan success signatures are INERT —
    evaluated nowhere*, which this RFC discharges by compiling the signature into a
    `fenPredicate` (§5b) and is flipped 🐞→✅ with that one-line summary. **D32's row wording
    is stale** — the throw is now a named `PackCompileError`, not a bare `TypeError` — and is
    corrected even though this RFC does not own the fix.

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
   general one?** `piece_distance` cannot express it (an edge is not a square or a piece), and a
   `king_zone` with a numeric band would reintroduce a free constant. Left as two exact zones;
   a filed gap naming a band would reopen it. **Unchanged by the `piece_distance` admission** —
   generalising the *subject* of a distance does not generalise its *target*, and this is the
   place that shows the two axes are independent.
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
7. **F10 declines a hand-off that `rfc/resistance-spectrum.md` §7a (`:487-501`) addressed to
   this lane.** If the owner reads the vocabulary wave as the right home for a rung-2 success
   condition, the correct move is to say so and let a follow-on take the next free lane with
   the admission argument written out — not to fold it into 0.18, where it would couple this
   RFC to an unlanded migration. (Register note, corrected: **0.19 is free** as well as 0.20,
   since `validator-integrity` declined it; the routing text said 0.20 while the header said
   0.19 was free. Either is available; the follow-on takes the lowest free number at the time
   it drafts.)

8. **RESOLVED — `piece_distance` is admitted (owner ruling, 2026-08-15,
   `planning/exploration/log.md`).** This question asked whether the generalised static leaf,
   which meets the wave's bar once the non-king count is corrected from "once" to **twice**,
   should be absorbed into 0.18 or filed for wave 4. **Absorbed.** It is specified in §4b as
   the static leaf, `king_distance` is not shipped, and the enum still reaches eighteen. The
   residual risk the ruling accepts is implementation size: the knight BFS table and the
   five-role metric switch are more code than the other two leaves combined, which is why
   criterion 5 asserts the metric exhaustively rather than by sampling.

9. **The 2026-08-15 ruling is relayed, not logged.** §5c-bis and F1's amendment implement an
   owner ruling ("grade the 45%, refuse the rest by name") that reached this draft through the
   register coordinator and is **not** in `planning/exploration/log.md`. Repo law records owner
   rulings in the log, and this RFC's own *Exploration gate* header cites a logged ruling for
   its authority to exist. The specification stands on its merits either way — a visible
   refusal is better than silence regardless of who asked for it — but the provenance should be
   logged before this RFC is accepted, and an implementing agent should not treat §5c-bis as
   owner-ratified until it is.

10. **`piece_distance`'s target selector is `{color, role}`, not a predicate.** So
   `knight-vs-bishop`'s note — *"the knight's actual travel distance"* to the **passed** pawn —
   is closed only in its metric half (§4b's scope limit). Options a later wave has: a `square`
   target authored per pack (works today, but the author must know the square), a
   `passed_pawn`-specific target arm (narrow, and invites one arm per feature), or a nested
   target expression (which changes what a leaf is and is refused here on §6's rule-1 ground).
   Named so the discharge of that attestation is not overstated.

## Changelog

- 2026-08-15: created. Executes `design/research/authored-transitions-and-features.md` §6 in
  its own attestation order. Admits `piece_count`, `king_zone`, `piece_distance`, the
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
  Header corrected: `rfc/archive/validator-integrity.md` declined 0.19, so 0.19 is free and this draft
  neither takes nor reserves it. Two open questions added (6, 7).
- 2026-08-15 (**adversarial cross-review**, by an agent that did not write this RFC; every claim
  below re-verified against the tree at `ffc9817`, locating by symbol name because
  `authoring-frictions` and the `ae8aab7` content wave moved most cited lines).
  **Headline finding absorbed: `plans[].success.signature` is evaluated NOWHERE.** Verified —
  the entry *trigger* fires in three places, the plan signature in none; its only non-test
  consumers are `structuralIssues` (well-formedness) and `ShapePanel.svelte` (prose). **Judged
  NOT a blocker**: §5b compiles the resolved signature into a `fenPredicate`, which *is* the
  mechanism that makes it fire, so this RFC absorbs the ledger row rather than depending on a
  wave that fixes it. Three consequences written into the spec: the "73% uncomputable" framing
  corrected to **100% unmeasured**; a new refusal `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT`
  for unexercised signatures; and the resolution plumbing specified (`PlanSignatureResolver`,
  `PLAN_CONSEQUENCE_UNRESOLVED`), because `objectiveRules`/`successPredicate` have no shape
  access and `DrillService.#shapes` may be `undefined` — the draft's "no new runtime path"
  claim was wrong.
  **Owner ruling of 2026-08-15 applied (relayed by the register coordinator; see open question
  9 — it is not in the log).** F1's "the correct product behaviour is **silence**" is
  overturned: new **§5c-bis** gives the uncovered majority a visible named refusal with all
  three declared-vs-executable properties, after auditing the draft at **1 of 3** (named
  refusal yes; capability publication and applied record absent). §5b's never-render-as-"your
  plan worked" rule survives and is sharpened into an occurrence/success biconditional tested
  against the draft's own `carlsbad`/`central-break` counterexample.
  **R2 amendment carried into the body**, not just the header: §4b's "the delta is this
  metric's clearest use" and §7 F4's repositioning row both amended to the measured verdict —
  the static leaf is the attested half, the delta is demoted to a renderer of an authored
  target (98.7% false positives, 0.0% precision, 52.8% of alternatives satisfying it, 9 of 17
  repositions explained). §4b's "for other roles once" corrected to **twice**, which means the
  generalised leaf now meets this wave's own bar — raised as open question 8 rather than
  admitted unilaterally.
  **Proofs re-run against the shipped evaluator.** The dead condition (false on all 18 spine
  positions), the `king_zone` equivalence and the existence-idiom equivalence (4528 checks, 0
  mismatches) all reproduce exactly on the tree they were measured against. **One defect:**
  "all 63 legal black-king placements" is arithmetically impossible — 63 is 64 minus the white
  king's square, and at most 60 are legal; re-run exhaustively over **3612 legal two-king
  pairs, 0 disagreements**, which is strictly stronger.
  **Scoping and count corrections, all verified:** the existence-idiom rewrite surface is
  **143 leaves, not 43** (`content/shapes` carries 100 more, which also strengthens the
  `scope:"every"` deprecation to 0 of 143); `direct_attack_count` is **no longer a zero-use
  kind** (`london-wedge` authors it twice), leaving `pawn_safe_square` as §1b's sole survivor;
  `timingWindow`'s zero is across **145** checkpoints, not 135; shape references are **29**,
  not 25, with four unmeasured; carlsbad's "byte-identical" is true only after parsing;
  D32's throw is a named `PackCompileError` since `ffc9817`, not a bare `TypeError`; §7 F1's
  "remaining 49" is **57** (the 45% ceiling is unaffected, but rests on 28 never-evaluated
  signatures); the §13 baseline said 0.15 and the tree is **0.16**.
  **Deprecation plumbing does not exist and the draft said it did:** `runtimeIssue` hard-codes
  `severity: "error"`, so a warning constructor must be added, and `shape-validation.ts` has no
  warning path at all while `content/shapes/opposite-coloured-bishops.json` is one of the six
  `pawn_count` uses. `registered_shapes` immutability re-stated honestly — no code path mutates
  `document_json`, but that is convention, not a database guarantee, and account deletion does
  update one column. **Refusal-code sweep: no collisions** across source, schemas and all five
  active drafts; the two `_DEPRECATED` names are the only off-convention ones.
  **Ledger citations rewritten by row title** (every one of the seven line numbers was stale),
  and criterion 18 corrected: *Sunset rule for zero-use vocabulary* and *Intent grading has a
  measured ceiling of ~45%* already exist and must be amended, not duplicated. Ordinal counts
  reconciled beyond the header note (§2 net, criteria 11 and 17 said "six"). Three acceptance
  criteria added (6a, 6b, 6c) and three open questions (8, 9, plus the F10 register note).
- 2026-08-15 (cross-review, late addendum). **`validator-integrity` implemented and archived
  while this review was in progress** (`rfc/archive/validator-integrity.md`, planning archived,
  `rfc/README.md` register updated). Three consequences, none of which changes this RFC's lane:
  its path citations are rewritten to the archive; **0.19 remains free** as it declined the lane
  and claimed nothing versioned, so pack **0.18** is unaffected; and it rewrote
  `apps/server/src/pack-validation.ts` (≈297 lines) and `pack-orchestrator.ts` (≈63) — which is
  precisely why every citation into those two files was converted to a **symbol name** in this
  pass rather than re-pinned to a line. `STRUCTURAL_CONDITION_HAS_NO_FEATURE` survives the
  landing, so §5c's corrected D32 argument and criterion 7 stand. **The implementer re-runs the
  deprecation-plumbing audit of §1a against the post-landing `runtimeIssue`/`shape-validation.ts`
  before assuming the warning path still looks as described here.**
- 2026-08-15 (**owner ruling on open question 8 — `piece_distance` absorbed into this wave**;
  logged in `planning/exploration/log.md`, so open question 9's provenance gap is also closed
  and §5c-bis is owner-ratified). The cross-review corrected §4b's non-king attestation count
  from "once" to **twice**, which meets this RFC's own admission bar; the ruling took the
  general leaf rather than deferring it to wave 4.
  **Specified as the STATIC leaf, and fenced.** §4b now opens by separating the admitted static
  census from the *delta* that `move-primitive-computability.md` refuted (98.7% false positives,
  0.0% precision, 52.8% of alternatives satisfying it, 9 of 17 repositions explained), and the
  fence is structural rather than nominal: the leaf is answerable from one FEN and the delta is
  not answerable from one FEN at all, so the grammar cannot express the refuted form even by
  composition. §7 F4's repositioning row and its "what the follow-on takes" list both updated —
  the metric shipped here, so the follow-on inherits it as a dependency rather than as work.
  **`king_distance` is NOT shipped** — it is `piece_distance` with `role: "king"`, verified
  identical to Chebyshev over all **4096** ordered square pairs. Because it never shipped, the
  disposition costs **no deprecation, no warning code, no content rewrite and no
  `registered_shapes` sweep**, unlike `pawn_count`'s — the §1 anti-rot rule applied at the
  cheapest possible moment. The enum still reaches **eighteen**, so §2's net, criterion 11 and
  §9's eighteen `structure-*` facts are unchanged; the fact is `structure-piece-distance`.
  Every dependent site updated in place: §Summary, §1 roadmap, §2 verdicts and net, §8 dispatch
  and mirror rules, §9 projection and sentences, §10 item 2, §11 boundary table, §12 schema
  (`$defs/distanceTarget` in **both** duplicated copies), §13 cost, and criteria 5/5a/11/17.
  **Metric pinned by exhaustive enumeration, not by sampling.** All 4096 ordered square pairs ×
  5 subject roles: maxima **king 7, knight 6, rook 2, bishop 2, queen 2**, with two independent
  checks that catch a wrong metric a maximum would not — knight `d=1` = **336** (the known
  knight-move total on 8×8) and bishop-unreachable = **2048 = 2×32×32**. This is the same care
  the review applied after finding "all 63 legal black-king placements" was arithmetically
  impossible. Ranges are now refused **per role**, so `piece_distance(rook, atLeast, 3)` is
  caught where a flat 0–7 bound would have admitted it.
  **Anti-vacuity written in, because this wave retires a vacuity trap on the same day.** An
  off-shade bishop is **unreachable**, and the leaf is **`false` for every comparison including
  `atLeast`** — treating it as ∞ would reproduce `piece_reach_count scope:"every"`'s bug in a
  brand-new leaf. Criterion 5 asserts it explicitly and names it the assertion most likely to be
  skipped. `role: "pawn"` is refused (`PIECE_DISTANCE_ROLE_UNSUPPORTED`): a pawn's move graph is
  directional and ends in promotion, so no undirected board distance exists — the same ruling
  `piece_reach_count` inherited, enforced rather than documented.
  **Three refusal codes, swept: no collisions** for `piece_distance` or `PIECE_DISTANCE_*`
  anywhere in source, schemas, content or any active draft.
  **Two limits recorded rather than glossed.** The proof establishes the metric and the
  subsumption exhaustively, but **no committed pack references `knight-vs-bishop`**, so there is
  no authored-spine firing measurement for the non-king case the way `king_zone` has one at
  ply 8 — a weaker evidence base than the wave's other two leaves, compensated by exhaustive
  metric assertions. And the target selector is `{color, role}`, not a predicate, so
  `knight-vs-bishop`'s note is discharged only in its metric half — new **open question 10**.
- 2026-08-15 (**`piece_distance` proof re-measured against the shipped evaluator; the placeholder
  written before the measurement returned is replaced**). Method as claimed: shipped
  `structure.ts` bundled unmodified, every pack's principal spine replayed from `start.fen` with
  chessops, **0 replay errors**. Position set stated exactly — **29 packs, 440 positions**
  (union of knight-bearing spines), 615 corpus-wide.
  **The measurement found a defect in shipped content, not in the leaf, and it is the more
  important result.** `knight-vs-bishop`'s 12-arm `passed_pawn` fan — the only non-null
  signature in that entry — fires **0 of 440**, and its 9 corpus-wide hits contain **no knight
  of either colour**. The author's note ("cannot count knight travel distance") is *too generous
  to its own signature*: it does not fire at all where the shape applies. This is the header's
  inert-signature finding arriving from the other side and is a concrete, shipped instance of
  what §5c's `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` exists to refuse.
  The literal discrimination table is therefore **degenerate at every n** (`0/0/0/440`) and is
  printed as such. The produceable measurement — target relaxed to the nearest a/h-file white
  pawn — covers **306** real positions and splits them **210/96** at `atMost 2` and **304/2** at
  `atMost 3`, so the leaf is discriminating, but *within a class the fan collapses entirely*.
  **Observed ranges never exceed any theoretical bound.** Two design-relevant results now in
  §4b: the knight's observed max is **4** against a bound of 6, and **rook, bishop and queen
  take only {1, 2} in all 615 positions** — against a king target those roles have two usable
  values corpus-wide, so authored slider-distance leaves should not be expected. Printed as a
  limit rather than omitted.
  **The vacuity trap measured where it bites:** **85 of 440** positions have every white bishop
  off-shade from the black king, concentrated in `trajectory-caro-advance-chain-bishops` (41),
  `mate-bishop-knight` (22), `trajectory-mate-bishop-knight` (22). Under an ∞ convention
  `atLeast n` would have been **true** across the wave's own B+N demonstration packs. Criterion
  5 now asserts the rule on that real spine rather than on a hand-built FEN.
  **Attestation base weakened and recorded, not smoothed.** `knight-vs-bishop` **and**
  `up-an-exchange` are both among the **9 of 25 shape entries no pack references**, so both
  non-king attestations live in orphan library entries. This does not overturn the ruling — the
  bar is what authors hit — but it is a materially weaker base than `piece_count`'s 143 corpus
  leaves or `king_zone`'s fan in a referenced pack, and §4b now says so plainly so an owner
  re-reading the decision sees it stated rather than inferred. `up-an-exchange`'s
  `white-stretch-two-wings` re-confirmed as `signature: null` with its note verbatim.
