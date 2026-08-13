# RFC: Structural reading — the rung-0 layer

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/05-in-run-experience.md` §3 (the ladder, lines 54-85), §3a (silence
  as the default, lines 87-110), §5 (detection versus significance, lines 253-289), §5c
  (authored and computed are one layer, lines 291-336), §6 question 2 (lines 389-391);
  `design/03-product-breadth.md` §Structural reading (lines 153-178), gate **B9** (line 274),
  program item #9 (lines 375-382); `design/04-content-architecture.md` §0a (lines 99-157)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + exploration gate opened by
  owner ruling 2026-08-12 (`planning/exploration/log.md`). Question **Q4b**
  (`planning/exploration/plan.md:25,136-141`) owns the feature definitions and this RFC is
  its landing
- **Depends on:** nothing unshipped. `rfc/archive/outcome-drill-grading.md` is implemented and
  supplies the `SuccessCondition` union and the compiled-rule pipeline this extends;
  `rfc/archive/line-drill-theory-grading.md` is implemented and supplies the one shipped
  evaluator that reads `authoredBoundary.fenPredicates`;
  `rfc/archive/explanation-grounds.md` is implemented and supplies the evidence-ref → sentence
  contract every structural claim is rendered through
- **Parent / amends:** **`rfc/archive/drill-pack-format.md`** (pack schema 0.9 → 0.10: one new
  `fenPredicate` variant, one new `successCondition` kind, one new `$defs` tree),
  **`rfc/archive/outcome-drill-grading.md`** (`successPredicate` becomes total over the
  union instead of silently dropping what it does not recognise, and a plan-family objective
  that compiles to zero rules becomes a load-time refusal),
  **`rfc/archive/explanation-grounds.md`** (`RULES_EVIDENCE_FACTS` gains twelve facts and
  `RULES_SENTENCES` gains twelve sentences under a mechanically enforced no-valence rule),
  **`rfc/archive/drill-client.md`** (the run screen gains one closed-by-default disclosure and
  the browser-safe pack projection is asserted to keep withholding `successConditions`),
  **`rfc/archive/n-way-comparison.md`** (its no-ranking, no-comparative-sentence rule is
  extended to structural readings on the comparison surface)
- **Supersedes / superseded by:** —
- **Migration:** **none, and that is normative.** Run schema stays 0.8 and `STORAGE_VERSION`
  stays 9. §1c: a rung-0 fact is a pure function of the position and is therefore never
  persisted; the only thing that reaches the event log is an evidence reference, which is a
  pointer to a rule and not a cached computation.
- **Pack schema:** **0.10.** Claimed in `rfc/README.md`'s pack-schema-version register in the
  same edit that adds this RFC's Active row.
- **Planning:** `planning/structural-reading/` (once implementing)

## Summary

`ObjectivePredicate` can already ask whether a specific pawn stands on a specific square
(`packages/runtime/src/objective.ts:53-58`). It cannot ask whether *a* pawn is backward, whether
a file is half-open, or whether a square can ever be attacked by an enemy pawn again. So an
author who wants to grade the minority attack has to enumerate the exact pawn placement of every
position in which it might be said to have succeeded, and gives up. The result is measurable and
this RFC measured it: `content/drafts/carlsbad-minority-attack.json` compiles to **zero**
objective transition rules, and so does `schemas/fixtures/drill-pack/terminal-outcome.browser.json`,
the fixture the browser suite runs against (`playwright.config.ts:20-22`), and so does the third leg
of `content/drafts/trajectory-legs.browser.json`.

This RFC ships the vocabulary that closes that: **twelve deterministic feature predicates
computed from the position by chess rules alone** — no engine, no tablebase, no corpus, no model,
no network. Each one is simultaneously a *readable* the learner may open and an *authorable
condition* an objective may be graded by, which is the dual role `design/05` §5c says closes the
plan-objective gap. On top of them it ships denial reading (the eviction arithmetic that makes
prophylaxis visible), one-ply discovered-consequence sight, and a four-entry structural-naming
catalogue in which the name is authored and carries provenance while the trigger is arithmetic.

Two things it deliberately does **not** ship. It does not say that any detected feature is good,
bad, or worth playing for — the vocabulary is built so that saying so is not expressible, and a
test enforces it on the rendered sentences. And it does not turn any of this on: silence remains
the default during committed play (`design/05` §3a), the disclosure starts closed, it never opens
itself, and it carries no badge or count, because a count is a signal.

## Motivation

### 1. The gap, measured rather than asserted

`design/03-product-breadth.md:381-382` says the structural layer "closes the plan-objective gap
that leaves two authored packs with no working objective today." That number was true when it was
written and is **no longer true**, and the correction matters because it changes what this RFC has
to carry.

Compiling every shipped pack through `objectiveRules`
(`apps/server/src/pack-orchestrator.ts:169-224`) gives:

| Pack | `mode` | `objective.type` | compiled rules |
|---|---|---|---|
| `content/drafts/carlsbad-minority-attack.json` | `plan` | `execute_break` | **0** |
| `content/drafts/anti-caro-advance.json` | `line` | `follow_theory` | 3 |
| `content/drafts/rook-4v3-same-side.json` | `outcome` | `hold` | 12 |
| `schemas/fixtures/drill-pack/terminal-outcome.browser.json` | `plan` | `preserve_plan_window` | **0** |
| `content/drafts/trajectory-legs.browser.json` | `trajectory` | `run_trajectory` | legs `[2, 2, 0]` |
| `content/drafts/outcome-hold.browser.json` | `outcome` | `hold` | 10 |
| `content/drafts/outcome-resist.browser.json` | `outcome` | `resist` | 13 |
| `content/drafts/line-boundary.browser.json` | `line` | `follow_theory` | 1 |
| `schemas/drill_pack.example.json` | `trajectory` | `play_until_checkpoint` | 3 |

So among the three authored content drafts it is **one of three**, not two: `anti-caro-advance`
acquired its three rules when `rfc/archive/line-drill-theory-grading.md` landed on 2026-08-13 and
gave `follow_theory` its deviation and boundary-resolution rules
(`pack-orchestrator.ts:175-215`). The design row is one RFC stale. Proposing that correction is a
BACKLOG row for the implementer, never a `design/` edit (`AGENTS.md` law 5).

But the same measurement makes the gap **wider than the row claimed**, in a way the row's framing
hid. It is not a property of Pack B. It is a property of the whole plan family:

- `objectiveRules` returns automatic rules only for the four outcome types
  (`pack-orchestrator.ts:217-219`) and for `follow_theory` (`:175`). For every other type the
  entire rule set is whatever `successConditions` compiles to, and with no `successConditions`
  the function returns the empty array at `:216`.
- The five plan-family types — `reach_structure`, `preserve_plan_window`, `execute_break`,
  `prevent_opponent_plan`, `transition_to_endgame` (`packages/schema/src/drill-pack/types.ts:1-14`) —
  therefore grade nothing unless the author writes conditions.
- And the four kinds a condition may be
  (`packages/schema/src/drill-pack/types.ts:167-186`) are `reach_checkpoint` (anchored to this
  pack's move tree), `outcome` and `rules_fact` (terminal), and `material_balance`. **None of them
  can say that a plan happened.** A plan that succeeds without winning material, without ending the
  game, and without arriving at an authored node is inexpressible.

That is the actual finding: a pack may declare a plan objective and the format has no way for it
to be graded, so it silently is not. Two live artifacts are in that state right now, and nothing
warns anybody.

### 2. What an author can express today, exactly

`design/05` §5c line 322 says the machinery "already ships and is authorable … reachable from a
pack through `fenPredicate`." That is true and it is worth stating precisely, because the shape of
the reach is what decides §3's design.

`FenPredicate` has three variants (`packages/runtime/src/objective.ts:43-58`) and reaches a pack
through exactly two doors:

1. a checkpoint trigger — `{ "fenPredicate": … }` (`packages/schema/src/drill-pack/types.ts:66`,
   `schemas/drill_pack.schema.json:412-418`), evaluated at `apps/server/src/pack-orchestrator.ts:51-56`;
2. `authoredBoundary.fenPredicates` (`types.ts:121`, `schema.json:527-531`), evaluated at
   `packages/runtime/src/line.ts:111-116`.

It does **not** reach `successConditions`, which is a closed four-way union with no position
member. So "grade the plan by its structural consequence" today means: define a checkpoint whose
trigger is a `fenPredicate`, then write `{"kind": "reach_checkpoint"}` against it. That works, and
it is the wrong shape for two reasons. It forces every structural grading criterion to also become
a **timeline moment** — `checkpoint.reached` is an event, it can be a reveal anchor, a comparison
anchor and a rewind target (`apps/server/src/authored-feedback.ts:263-289`,
`packages/runtime/src/runtime.ts` `rewindToCheckpoint`) — so the author gets four side effects for
one assertion. And it makes the structural condition **visible to the browser**, because
checkpoints are projected (`apps/server/src/pack-registry.ts:106-119`) while `successConditions`
are not (`:92-98`), which inverts the withholding this codebase otherwise maintains.

And the predicate it would reach is `pawnStructure`, which matches literal placement by explicit
square list (`objective.ts:54-58`, evaluated `:158-167`). For Pack B that means enumerating the
white and black pawn squares of every position in which the minority attack may be said to have
completed. The author did not do that. They wrote the structural signature in **prose** instead,
in the plan class itself: *"If Black lets you play bxc6 bxc6, the c6 pawn is backward on a file
where you have no pawn at all"* (`content/drafts/carlsbad-minority-attack.json`,
`/planClasses/0/description`). The exact sentence this RFC turns into two predicates.

### 3. A live silent-match hazard in the evaluator, found while specifying this

`matchesFenPredicate` (`packages/runtime/src/objective.ts:146-168`) is not a switch. It early-returns
for `transposeKey` and `pieceOnSquare` and then **falls through to the pawn-structure branch for
everything else**. Adding a fourth variant without restructuring it would hand
`squareSetMatches` (`:136-144`) an `expected` of `undefined`; `new Set(undefined)` is empty,
`mode === "exact"` is false, and `[...required].every(…)` over an empty set is `true`. The new
predicate would silently **match every position**, in both directions, for both colours.

This is the D3 never-silent shape one level down, and it is a live latent defect independent of
this RFC: any future `FenPredicate` variant walks into it. §3d rewrites the function as an
exhaustive switch with a `never` exhaustiveness check and criterion 6 is its regression.

### 4. Why rung 0, and why now

`design/05` §3 orders assistance by what each source can get wrong, and rung 0's cell reads
*"Nothing. It is arithmetic over the position"* (line 62). That is the whole argument for building
this first: it is the only layer that can serve a curated drill, a pack-less game, a streamed
session and an imported game identically, because it needs no author, no index, no sidecar and no
network. `design/04` §0a's audit of what transfers out of a pack found that the only pack fields
that survive into a game nobody authored are the two position-keyed checkpoint triggers and the
opponent policy (lines 106-118) — and a feature predicate is precisely a position-keyed trigger
with a vocabulary worth writing in.

Ordering follows the same fact: B10 needs something to classify with and B11 needs a shape to
state its own trigger in (`design/03-product-breadth.md:383-388`).

### 5. Scope boundary

Explicitly outside this RFC, each because it is a different rung or a different gate:

- **Intent-relative grading.** The BACKLOG friction row (`design/BACKLOG.md:151`) says a plan
  drill's success is relative to the *captured intent*. That is not buildable here, because **no
  intent is recorded anywhere**: `intent_capture` is read only to decide which plan-class prose to
  reveal (`apps/server/src/authored-feedback.ts:210-219`, `:275-289`) and the learner's choice is
  never written to the event log; `Branch.intent` (`packages/runtime/src/types.ts:106`) is free
  text on a fork, not a plan-class id. This RFC closes *"a plan objective grades nothing"*. It does
  not close *"grade the plan you committed to"*, which needs a recorded choice, an event, and a
  migration. The implementer proposes that as a BACKLOG row.
- **Shape entries, plan prose, and the generated-drill recipe** — B11, blocked on the
  `design/04` §0 owner ruling. §5 ships naming only, in a closed code-level catalogue, precisely so
  that a second authoring path is not forked before that ruling (`design/04` lines 87-97).
- **Live phase/structure classification, author-free pivotal detection, assistance configuration
  per session context, endgame steering** — B10 (`design/03-product-breadth.md:180-201`). This RFC
  ships one global availability rule (§7) and no per-pack assistance field, because that field is
  B10's and adding it here would create a second one to unify.
- **Guided mode and the LLM voice** — `design/05` §3b and §3b-i. The evidence packet that mode
  needs is largely this RFC's output, but the mode, its banding and its persona are not here.
- **Anything at rung 1 and above.** No tablebase, no engine, no Maia, no explorer. If a feature
  cannot be computed from the position alone it is not in the closed set, and §2b lists what was
  excluded for that reason and what was excluded for a different one.

## Specification

### 1. The three laws

Everything below is subordinate to these, and any later RFC extending this layer inherits them.

**1a. Detection is cheap and cannot be wrong; significance is judgement and must be attributed.**
`design/05` §5, `design/03` lines 176-178. Nothing in this RFC asserts that a detected feature is
good, bad, or worth playing for. §2b, §4a and §6b make that a property of the vocabulary, the types
and the renderer rather than a rule people are asked to remember.

**1b. Rung 0 means the position and nothing else.** Every function specified here takes a FEN (or a
`Node`, for the delta readings, which take two) and returns a value. No I/O, no clock, no run
history beyond the parent node, no author input, no network. A feature that cannot be computed this
way does not belong in this RFC.

**1c. A rung-0 fact is never persisted.** It is a pure function of a position that is already in the
run, so storing it would create a second source of truth that can drift from the FEN, and *the run
is the record* (`design/05` §1). Consequence: no run-schema change, no migration, no new columns,
no cache. The only durable trace is an evidence reference in
`objective.state_changed.evidenceRefs`, which is a pointer to a rule (§6a).

### 2. The closed feature set — twelve kinds

#### 2a. Definitions

Notation: `C` is the colour the feature is asked about, `X = opposite(C)`. A square is `(f, r)` with
file `f ∈ 0..7` and rank `r ∈ 0..7` in chessops coordinates. `fwd(white) = +1`, `fwd(black) = −1`.
"Ahead of rank `r` for `C`" means rank `q` with `(q − r) · fwd(C) ≥ 1`. Every definition is stated
so that its truth value is decidable from the board alone, with no free parameter that encodes
taste.

| # | `kind` | Fields | True exactly when |
|---|---|---|---|
| 1 | `pawn_safe_square` | `color`, `square` | No pawn of `X` stands on a file adjacent to `f` at a rank ahead of `r` for `C`. Equivalently: no enemy pawn can attack `(f, r)` by pushes alone. §2c is the whole contract of this one |
| 2 | `outpost` | `color`, `square` | `(f, r)` is on rank 4, 5 or 6 counted from `C`'s side; **and** `(f, r)` is attacked by a pawn of `C`; **and** `pawn_safe_square(C, (f, r))` holds. Occupancy is *not* part of the definition — compose with the shipped `pieceOnSquare` to ask who is standing there |
| 3 | `backward_pawn` | `color`, `file` | Some pawn of `C` on `file` at rank `r` has (i) no pawn of `C` on an adjacent file at a rank that is not ahead of `r` for `C`, and (ii) a stop square `(f, r + fwd(C))` that is attacked by at least one pawn of `X` |
| 4 | `isolated_pawn` | `color`, `file` | At least one pawn of `C` on `file`, and no pawn of `C` on either adjacent file |
| 5 | `doubled_pawn` | `color`, `file` | Two or more pawns of `C` on `file` |
| 6 | `passed_pawn` | `color`, `square` | A pawn of `C` stands on `(f, r)` and no pawn of `X` stands on files `f−1..f+1` at a rank ahead of `r` for `C` |
| 7 | `open_file` | `file` | No pawn of either colour on `file` |
| 8 | `half_open_file` | `color`, `file` | No pawn of `C` on `file` and at least one pawn of `X` on `file`. ("Half-open **for White**" means White has no pawn there) |
| 9 | `line_blockers` | `from`, `to`, `comparison`, `count` | `|between(from, to) ∩ occupied|` satisfies `comparison count`. `between` is chessops' (`chessops/attacks`), so the endpoints must be aligned on a rank, file or diagonal; §8 refuses a pack where they are not |
| 10 | `square_control` | `square`, `perspective`, `comparison`, `margin` | `attackers(perspective) − attackers(opposite(perspective))` satisfies `comparison margin`. An attacker is any piece `p` of that colour on square `s` with `attacks(p, s, occupied).has(square)` — **direct attackers only**, no x-ray, no pin filtering, kings counted |
| 11 | `piece_mobility` | `color`, `role`, `scope`, `comparison`, `count` | `role ∈ {knight, bishop, rook, queen}`. Mobility of a piece on `s` is `attacks(piece, s, occupied).diff(board[color]).size()`. `scope: "any"` — some such piece satisfies `comparison count`; `scope: "every"` — all do, **vacuously true when the side has no such piece** |
| 12 | `named_structure` | `id` | The catalogue entry `id` (§5) matches this position |

`comparison` reuses the shipped spelling `"atLeast" | "atMost" | "equal"`
(`packages/runtime/src/objective.ts:39`) rather than inventing a second one.

Three definitional notes that are load-bearing rather than pedantic:

- **`piece_mobility` covers four roles because those are the four whose attack set equals their
  move set.** A pawn attacks diagonally and moves forward; a king's legal moves depend on check and
  castling rights. Reporting `attacks()` for either would be a number that is not mobility. The
  restriction is enforced by the schema enum, not by a lint.
- **`backward_pawn` and `isolated_pawn` may both hold.** Some textbooks make them exclusive. This
  RFC does not, because "backward" as defined is a statement about support and the stop square and
  "isolated" is a statement about neighbouring files, and suppressing one because the other holds
  would be an editorial judgement about which matters — which is exactly what §1a forbids.
- **`scope: "every"` is vacuously true with zero pieces.** An author who means "has such a piece
  *and* it is cramped" writes `all[ any-scope, every-scope ]`. Stated here, tested in criterion 4,
  and not silently patched, because a rule that quietly special-cases the empty set is a rule
  nobody can predict.

#### 2b. Why these twelve, and what was left out

Four admission rules, applied in order:

1. **Computable from the position alone** (§1b). This excludes everything at rung 1 and above.
2. **Exactly definable in one sentence with no free parameter that encodes taste.** A feature with a
   tunable threshold is a feature whose author is smuggling an opinion into a constant.
3. **Dual role.** It must be something an author would write into a plan's success sentence *or*
   something a learner needs pointed at in order to see it. This is the B9 test and it is why the
   set is a *vocabulary* rather than an inventory of everything chessops can compute.
4. **No name that contains a verdict.**

Rule 4 is the one that shapes the list, so the exclusions are stated rather than implied:

| Excluded | Why |
|---|---|
| king safety, space, initiative, tempo | Scores. Each is a weighted count whose weights *are* the judgement |
| weak square, weak pawn | The word "weak" is the claim. `pawn_safe_square` and `backward_pawn` are the arithmetic underneath it, without it |
| good bishop / bad bishop | A verdict about a piece, keyed to a pawn colour count that means nothing without a plan |
| trapped piece | Expressible as `piece_mobility` with `count: 0`. The **arithmetic ships and the name does not** |
| hanging piece | Expressible as `square_control` with a positive margin against the occupier. Same rule |
| pawn-skeleton signature as an equality test | A canonical string of pawn placement is `pawnStructure` with `mode: "exact"` under another name, and it is exactly the brittleness this RFC exists to remove. The skeleton survives as a **readable key** for grouping (§4a) and as the *body* of a named structure (§5), never as an authorable equality |
| bishop pair | Material, already expressible |

The last two rows in the middle of that table are the mechanism, so it is worth naming it directly:
**a composition is authorable; a name is not shipped.** An author may write
`piece_mobility(black, bishop, any, equal, 0)` and call it a trapped bishop in their own prose —
and that prose then carries their provenance, which is what rung 5 is for. What the product will
not do is ship "trapped" as a computed fact, because the arithmetic is the fact and the word is the
verdict.

#### 2c. Pawn safety, denial, and the one-sided-safe property

`pawn_safe_square` is the primitive under every prophylactic reading and it is the one place where
"cannot be wrong" has to be earned rather than claimed.

The definition in §2a says *by pushes alone*. That qualifier is not decoration: an enemy pawn two
files away can migrate onto an adjacent file by capturing, and a definition that ignored this would
assert a permanence that does not exist. So the evaluator returns both sets:

```ts
export interface PawnSafety {
  readonly square: SquareName;
  readonly color: Color;
  readonly safe: boolean;                 // pushAttackers.length === 0
  readonly basis: "pawn_pushes_only";
  readonly pushAttackers: readonly { readonly square: SquareName; readonly pushes: number }[];
  readonly captureAttackers: readonly { readonly square: SquareName; readonly captures: number }[];
}
```

- `pushAttackers` — enemy pawns on an adjacent file at a rank ahead of the square; `pushes` is the
  number of single pushes needed to reach an attacking stand square, so `0` means *attacked now*.
- `captureAttackers` — enemy pawns needing `c ≥ 1` captures: an enemy pawn at `(pf, pr)` reaches a
  stand square `(tf, tr)` with `c = |tf − pf|` captures if and only if its advance distance
  `(pr − tr) · fwd(C)` is at least `c`. Pure arithmetic, no occupancy assumption.
- `safe` is decided **only** by `pushAttackers`. `captureAttackers` never falsifies it; it qualifies
  it, and §6b makes including that qualifier a rendering obligation.

Two properties follow, and both are normative and tested:

**One-sided safety.** Blockage is ignored when computing `pushes`, which can only ever add a push
attacker that a blocked file would have removed. So `safe: true` is *exact* under the stated basis,
and `safe: false` may be pessimistic. The approximation can only ever **withhold** a denial claim,
never assert one falsely. That is the direction that makes "cannot be wrong about chess" true rather
than nearly true.

**Push monotonicity.** Under pawn pushes alone the push-attacker set of any square is
non-increasing, because a push keeps the pawn's file and moves it away from the ranks that matter.
Pawn *captures* change file and may create an attacker; a pawn leaving the board removes one. Stated
as a lemma because it is what makes the denial delta meaningful (§4c) and because criterion 3 is a
`fast-check` property test of it (`fast-check@4.9.0` is already a devDependency).

**What this corrects about the design's example.** `design/05` §5 line 268 and `design/03` line 164
both give the reading as *"after a4, a Black knight can never use b5 again."* Measured on a real
position, the interesting fact arrives **earlier than the move**: with a white pawn on a2, b5 is
already not pawn-safe for Black at a distance of two pushes; a4 reduces the distance to one; a5
would make it zero. The rung-0 reading is therefore not a post-hoc note that something became
impossible — it is *the eviction distance, available before anybody commits to anything*, which is a
forward-looking honest detector in the sense of `design/05` §5a. The sentence the product says is
"White's a-pawn evicts a piece from b5 in one push," and it can say it as flatly as it says a move
is legal.

### 3. Authoring: extend the union, do not sibling it

#### 3a. The decision

The new predicate is **one new variant of `FenPredicate`**, carrying a closed twelve-way feature
union — not a new sibling of `ObjectivePredicate`, and not twelve new variants.

Three reasons, in order of weight:

1. **`FenPredicate` is already exactly this concept.** Its evaluator takes a `Node` and nothing else
   (`objective.ts:146`), every member is a function of the position, and the type's name says so. A
   rung-0 feature is a position predicate. Putting it anywhere else would mean two type names for
   one idea, which is the D4 shape.
2. **A sibling would not reach a pack.** Packs reach the predicate language through exactly two
   doors and both are typed `fenPredicate` (§2 of Motivation). An `ObjectivePredicate`-level sibling
   would need a new checkpoint trigger member, a new `authoredBoundary` member, new `$defs`, and new
   orchestrator branches, and it would still not be usable by `authoredBoundary` without deciding
   what a structural book boundary means — a question this RFC has no reason to open.
3. **One variant, not twelve, keeps the boundary surface small.** `$defs/fenPredicate` stays a
   four-branch `oneOf`; the twelve branches live in one new `$defs/structuralFeature` that nothing
   else references. Every future feature is one branch in one place.

#### 3b. Runtime types

New module `packages/runtime/src/structure.ts`, exported from
`packages/runtime/src/index.ts`:

```ts
import type { Color, FileName, SquareName } from "chessops/types";

export type FeatureComparison = "atLeast" | "atMost" | "equal";
export type MobilityRole = "knight" | "bishop" | "rook" | "queen";
export type MobilityScope = "any" | "every";

export type StructuralFeature =
  | { readonly kind: "pawn_safe_square"; readonly color: Color; readonly square: SquareName }
  | { readonly kind: "outpost"; readonly color: Color; readonly square: SquareName }
  | { readonly kind: "backward_pawn"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "isolated_pawn"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "doubled_pawn"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "passed_pawn"; readonly color: Color; readonly square: SquareName }
  | { readonly kind: "open_file"; readonly file: FileName }
  | { readonly kind: "half_open_file"; readonly color: Color; readonly file: FileName }
  | {
      readonly kind: "line_blockers";
      readonly from: SquareName;
      readonly to: SquareName;
      readonly comparison: FeatureComparison;
      readonly count: number;
    }
  | {
      readonly kind: "square_control";
      readonly square: SquareName;
      readonly perspective: Color;
      readonly comparison: FeatureComparison;
      readonly margin: number;
    }
  | {
      readonly kind: "piece_mobility";
      readonly color: Color;
      readonly role: MobilityRole;
      readonly scope: MobilityScope;
      readonly comparison: FeatureComparison;
      readonly count: number;
    }
  | { readonly kind: "named_structure"; readonly id: StructureId };

export const STRUCTURAL_FEATURE_KINDS = Object.freeze([
  "pawn_safe_square", "outpost", "backward_pawn", "isolated_pawn", "doubled_pawn",
  "passed_pawn", "open_file", "half_open_file", "line_blockers", "square_control",
  "piece_mobility", "named_structure",
] as const);
export type StructuralFeatureKind = (typeof STRUCTURAL_FEATURE_KINDS)[number];

/** Rung 0. Position in, boolean out. No I/O, no run history, no author input. */
export function matchesStructuralFeature(fen: string, feature: StructuralFeature): boolean;
```

`STRUCTURAL_FEATURE_KINDS` is the single source the schema enum, the evidence facts (§6a) and the
sentence table (§6b) are all checked against; criterion 11 asserts the four stay in step.

**A feature alone is not enough, so the variant carries an expression.** The minority attack's
signature is a *conjunction* — a backward c-pawn **and** a half-open c-file — and
`successConditions` compile disjunctively (each condition becomes its own rule set,
`apps/server/src/pack-orchestrator.ts:143-167`), so a conjunction written as two conditions would
grade the wrong thing. The predicate therefore carries a small boolean expression:

```ts
export type StructuralExpressionOf<F> =
  | { readonly kind: "all" | "any"; readonly of: readonly [StructuralExpressionOf<F>, ...StructuralExpressionOf<F>[]] }
  | { readonly kind: "not"; readonly of: StructuralExpressionOf<F> }
  | { readonly kind: "feature"; readonly feature: F }
  | {
      readonly kind: "pieceOnSquare";
      readonly square: SquareName;
      readonly piece: { readonly color: Color; readonly role: Role } | null;
    };

export type StructuralExpression = StructuralExpressionOf<StructuralFeature>;

export function matchesStructuralExpression(fen: string, expression: StructuralExpression): boolean;
```

`pieceOnSquare` is a member because a structural claim frequently needs one concrete anchor — "an
isolated white d-pawn **on d4**" — and duplicating the shipped `FenPredicate.pieceOnSquare`
(`objective.ts:48-52`) inside the expression is one definition reused, not a second one invented.
`transposeKey` and `pawnStructure` are deliberately absent: a "structure" pinned to an exact
position or an exact pawn list is the brittleness of Motivation §2 wearing a new name.

`FenPredicate` (`packages/runtime/src/objective.ts:43-58`) then gains its fourth member:

```ts
| {
    readonly type: "structuralFeature";
    readonly feature: StructuralExpression;
  }
```

Because it is a `FenPredicate`, the expression is reachable from **all three** doors at once — the
checkpoint trigger, `authoredBoundary.fenPredicates`, and the new success condition — and it
composes further at the `ObjectivePredicate` level through the shipped `all`/`any`/`not`
(`objective.ts:72-76`).

#### 3c. `matchesFenPredicate` becomes exhaustive

Motivation §3 is why this is normative and not tidying. `matchesFenPredicate` is rewritten as

```ts
switch (predicate.type) {
  case "transposeKey": …
  case "pieceOnSquare": …
  case "pawnStructure": …
  case "structuralFeature": return matchesStructuralExpression(node.fen, predicate.feature);
  default: { const exhaustive: never = predicate; throw new TypeError(`Unhandled fen predicate: ${JSON.stringify(exhaustive)}`); }
}
```

The `never` binding is the point: a fifth variant added later will not compile rather than
silently matching every position. Criterion 6 asserts the behaviour, and the test carries a comment
naming the fall-through it replaces so it cannot be "simplified" back.

#### 3d. `SuccessCondition` gains a fifth kind

```ts
| (SuccessConditionBase & {
    readonly kind: "structural_feature";
    readonly feature: StructuralExpression;
  })
```

in `packages/schema/src/drill-pack/types.ts:167-186`. This is the member that removes the checkpoint
indirection of Motivation §2: an objective may now assert a structural state without also declaring a
timeline moment, and — because `successConditions` are not projected to the browser
(`apps/server/src/pack-registry.ts:92-98`) — without telling the learner the exact shape of the
answer before they play. §7c makes that withholding a tested rule rather than an accident.

Compilation, in `apps/server/src/pack-orchestrator.ts`:

- `successPredicate` (`:90-130`) gains a `structural_feature` branch returning
  `{ type: "fenPredicate", predicate: { type: "structuralFeature", feature } }`, and **stops
  returning `undefined` for unrecognised input**. It becomes total over `SuccessCondition["kind"]`
  with a `never` check, because today an unrecognised condition is silently dropped at `:149` and
  the pack ends up graded by fewer rules than it declared — the same never-silent hazard as §3c,
  one layer up. Load-time validation (§8) is the user-facing refusal; the throw is the
  can't-happen guard.
- `conditionEvidence` (`:132-141`) gains a `structural_feature` branch returning
  `rulesEvidenceRef(structuralEvidenceFact(k))` where `k` is the **first feature kind in the
  expression's canonical walk** — a deterministic choice, defined here so that two implementations
  cannot disagree, and honest because the ref names a rule rather than a computed instance (§6a).
  Note that the function's present final line falls through to `condition.fact`, so adding the kind
  makes it a **type error** until it is handled. That is the desired failure mode and it is why the
  union is extended rather than widened with an index signature.

### 4. Reading: what a learner may be shown

#### 4a. `StructuralReading` — the shape that cannot carry a verdict

```ts
export interface DetectedFeature {
  readonly feature: StructuralFeature;   // the exact query that holds
  readonly squares: readonly SquareName[]; // the squares it is about, canonical order
  readonly detail?: PawnSafety | LineBlockers | ControlCount | MobilityCount;
}

export interface StructuralReading {
  readonly fen: string;
  readonly skeletonKey: string;          // canonical pawn placement, for grouping only
  readonly features: readonly DetectedFeature[];  // canonical order — never ranked
  readonly structures: readonly StructureMatch[];
}
```

There is **no** `score`, no `severity`, no `favours`, no `advantage`, no `rank`, and deliberately no
optional `significance?:` field left open for someone to fill in later. That absence is the design:
significance cannot be attached to a detection because there is nowhere to put it. When significance
does arrive — from an author, a shape entry, an engine — it arrives as a *separate record that
references a feature*, carrying its own provenance in the shape `RootAssessment` already
establishes (`packages/schema/src/drill-pack/types.ts:142-150`). Nothing in this RFC creates that
record type; §5 ships the one attributed string this layer needs and stops.

`skeletonKey` is a canonical serialisation of pawn placement. It exists for grouping and telemetry
and is explicitly **not** authorable (§2b, last-but-one row).

#### 4b. Canonical order, never ranked

`features` is ordered by `STRUCTURAL_FEATURE_KINDS` index, then by colour (white before black), then
by square or file in ascending order. Not by importance, not by recency, not by how many squares are
involved.

This is not presentation trivia. **Ordering a list by importance is a significance claim** — the
first item is the one you are being told to look at. A rail that sorts is a rail that coaches, and
`design/05` §3a is explicit that rung 0 being safe is not an argument for it being loud. Criterion 8
asserts the order is a pure function of the feature set and is byte-identical across two positions
with the same features detected in a different discovery order.

#### 4c. The node delta — denial and prophylaxis

A denial move is invisible to every eval-first tool because nothing happened (`design/05` §5 lines
286-289). What did happen is a change in a feature set, so:

```ts
export interface StructuralDelta {
  readonly parentFen: string;
  readonly fen: string;
  readonly gained: readonly DetectedFeature[];  // held after, not before
  readonly lost: readonly DetectedFeature[];    // held before, not after
  readonly evictionChanges: readonly {
    readonly square: SquareName;
    readonly color: Color;
    readonly pushesBefore: number | null;       // null when no push attacker existed
    readonly pushesAfter: number | null;
  }[];
}
```

Computed from a node and its parent — two positions, both already in the run, nothing else. `gained`
and `lost` are set differences over the same twelve kinds and the same canonical order.

`evictionChanges` is the prophylaxis reading proper, and §2c is why it is a separate field rather
than a `pawn_safe_square` flip: safety usually does not flip, the **distance** moves. It is reported
for the squares whose minimum `pushes` changed, which is a small set on any real move. This is the
whole of what `design/05` §5 asks for and it is arithmetic end to end.

The delta is scoped to features. It never says a move was prophylactic, good, or intended — those
are three different judgements and the product does not know any of them.

#### 4d. Discovered consequence: exactly one ply, and why

Depth is **one ply, and the ply has no destination.** `design/05` §6 question 2 asks how deep
discovered consequence goes before it becomes noise, and the answer here is derived rather than
tuned:

- The reading is a **vacation diff**: remove the piece on square `v` from `occupied`, recompute, and
  report which sliding pieces of either colour gain which squares. No destination is chosen for the
  vacating piece.
- Choosing a destination would be enumerating candidate moves, and a ranked or filtered list of
  candidate moves is advice. The design's own words for this layer are *"Sight, not advice"*
  (`design/03` line 170).
- Going a second ply would require assuming the opponent does nothing, which is a null move, which
  is **a judgement about the opponent** — and would therefore cost the rung-0 property outright. So
  the limit is not "two is noisy"; it is that two is not free.

```ts
export interface VacationReading {
  readonly square: SquareName;                        // the piece asked about
  readonly piece: { readonly color: Color; readonly role: Role };
  readonly unblocks: readonly {
    readonly slider: SquareName;                      // whose line opens
    readonly color: Color;
    readonly gains: readonly SquareName[];            // canonical order
  }[];
}
```

Computed for **one named square on request**, not for every piece on every ply: the learner points
at a piece and asks what it is standing in front of. That keeps the cost trivial and keeps the
posture right — it is the learner's question, not the product's announcement.

Blocked-diagonal reading (`design/03` line 161) is `line_blockers` (feature 9) for the assertion and
this for the consequence; between them the two answer *"is the long diagonal open, and what blocks
it"* (`design/05` §5 line 270) by naming the blockers and what opens if one leaves.

### 5. Structural naming

#### 5a. The name is authored; the trigger is arithmetic

A named structure is the one place in this RFC where a human contributes something, and the split is
absolute: **the trigger is a predicate and cannot be wrong; the name is a convention and carries
provenance.**

```ts
export interface StructureEntry {
  readonly id: StructureId;
  readonly name: string;                    // "Carlsbad structure"
  readonly trigger: StructureTrigger;       // arithmetic
  readonly provenance: { readonly note: string };  // who defined it this way, and that it is a convention
}

export type StructureTrigger =
  StructuralExpressionOf<Exclude<StructuralFeature, { kind: "named_structure" }>>;
```

A trigger is the **same expression type §3b already defines**, with one member removed — one
expression language, two uses, not two languages. The exclusion is typed rather than linted:
`named_structure` cannot appear inside a catalogue trigger, so the catalogue cannot recurse and
`matchesStructuralExpression` terminates by construction. `transposeKey` and `pawnStructure` are
absent from the expression language altogether (§3b), because a "structure" defined by an exact
position or an exact pawn list is not a structure — it is the brittleness of Motivation §2 wearing a
name.

A match reports only what matched:

```ts
export interface StructureMatch {
  readonly id: StructureId;
  readonly name: string;
  readonly provenanceNote: string;
}
```

No plans, no typical mistakes, no "what to watch", no phase applicability. Those are shape-entry
fields and shape entries are B11, blocked on the `design/04` §0 ruling.

#### 5b. The catalogue ships as four entries, in code

`packages/runtime/src/structures.ts` exports a frozen `STRUCTURE_CATALOGUE` and a closed
`StructureId = "carlsbad" | "iqp-white" | "iqp-black" | "maroczy-bind"`.

| id | Trigger | Note |
|---|---|---|
| `carlsbad` | `all[ half_open_file(white, c), half_open_file(black, e), pieceOnSquare(d4, white pawn), pieceOnSquare(d5, black pawn), pieceOnSquare(c6, black pawn) ]` | The QGD Exchange skeleton: White has no c-pawn, Black no e-pawn, pawns face off on d4/d5 with Black's c6 |
| `iqp-white` | `all[ pieceOnSquare(d4, white pawn), isolated_pawn(white, d), half_open_file(black, d) ]` | White's isolated queen's pawn; Black has none on the file |
| `iqp-black` | mirror of the above | — |
| `maroczy-bind` | `all[ pieceOnSquare(c4, white pawn), pieceOnSquare(e4, white pawn), half_open_file(white, d), half_open_file(black, c) ]` | White pawns on c4 and e4, no white d-pawn, no black c-pawn |

Why code and not content, stated because it is a real fork and the answer is not "later": the id set
must be **closed** for `named_structure` to be validated when a pack loads, without loading any
content; four entries of naming is a table, not a pipeline; and an authored, extensible catalogue is
precisely B11's shape entry, which `design/04` lines 87-97 says is a new artifact *and* a new
authoring path. Shipping a second authoring path before that ruling is the mistake that document
warns about. When B11 lands, the catalogue becomes its seed data and `StructureId` widens; nothing
here has to be unpicked.

#### 5c. What a match may never carry

The catalogue is the closest this RFC comes to authored chess content, so the prohibition is
explicit. A `StructureMatch` may not carry plans, evaluations, "the standard idea is…", a side it
favours, or any ordering among matches. `design/05` §3b's permitted column — *"This is a Carlsbad
structure. The standard plans are…"* — is **two** claims: the naming, which is here, and the plans,
which are a shape entry and are not. This RFC ships the first half and the honest silence where the
second half will go.

### 6. Evidence and rendering

#### 6a. `rules:` gains twelve facts — no new namespace

`RULES_EVIDENCE_FACTS` (`packages/runtime/src/evidence-ref.ts:1-13`) gains one fact per feature
kind, spelled `structure-<kind-with-hyphens>`: `structure-pawn-safe-square`, `structure-outpost`,
`structure-backward-pawn`, `structure-isolated-pawn`, `structure-doubled-pawn`,
`structure-passed-pawn`, `structure-open-file`, `structure-half-open-file`,
`structure-line-blockers`, `structure-square-control`, `structure-piece-mobility`,
`structure-named-structure`. A helper `structuralEvidenceFact(kind)` maps between them.

No new namespace, for three reasons. The `sourceLabel` a ref renders under **is** its attribution
(`apps/web/src/lib/evidence-sentences.ts:18`), and a structural fact's source genuinely is the rules
— a new label would imply an epistemic status that does not exist. `renderEvidenceRef`'s fallback
returns the bare "Evidence recorded." for any unknown prefix (`evidence-sentences.ts:124-128`), so an
unrecognised namespace degrades silently, which is the shape this repo keeps closing. And the run
schema constrains `evidenceRefs` items only to non-empty strings
(`schemas/drill_run.schema.json:243-247`, `:432-437`), so an extended `rules:` vocabulary needs no
run-schema change — which is what keeps §1c's no-migration claim true.

The ref is per **kind**, not per instance, and that is deliberate: the instance detail is a pure
function of the node's FEN and §1c forbids persisting it. The renderer recomputes.

#### 6b. Sentences, and the rule they are held to

`apps/web/src/lib/structural-sentences.ts` exports
`Record<StructuralFeatureKind, (feature, detected) => string>` — exhaustive by type, so a thirteenth
kind will not compile without a sentence. Fixed strings with interpolated squares, files and counts.
No LLM anywhere near this path.

Two normative rules:

1. **No valence.** A structural sentence may not contain any of: *weak, strong, good, bad, better,
   worse, advantage, winning, losing, should, must, best, worst, mistake, blunder, punish, wins,
   loses.* Criterion 9 renders every kind against a fixture set and asserts the banned list does not
   appear. This is the machine-checkable form of §1a, in the spirit of the grounded-rendering
   contract `design/05` §3b-i point 3 already asks for.
2. **The safety qualifier is obligatory.** When a `pawn_safe_square` detection has a non-empty
   `captureAttackers`, the rendered sentence must include it. "No black pawn can attack e5 by
   advancing; b7 could after one capture." Omitting the second clause would state a permanence the
   arithmetic does not support, and §2c's honesty rests on it being said.

Sample renderings, which are the specification of tone as much as of content:

| Detection | Sentence |
|---|---|
| `backward_pawn(black, c)` | "Black's c6 pawn has no pawn on b or d that can support it, and c5 is covered by a white pawn." |
| `half_open_file(white, c)` | "White has no pawn on the c-file; Black has one." |
| `pawn_safe_square(black, b5)`, 1 push | "White's a-pawn can attack b5 in one push." |
| `line_blockers(a1, h8, equal, 1)` | "The a1–h8 diagonal has one piece on it: the pawn on d4." |
| `square_control(f7, white, atLeast, 1)` | "f7 is attacked twice and defended once." |
| `named_structure(carlsbad)` | "Carlsbad structure." *(and the provenance note on request)* |

#### 6c. The comparison surface

`rfc/archive/n-way-comparison.md` forbids a payload that ranks branches, computes a delta, or
recommends a winner (`docs/n-way-comparison.md:11-13`). Structural readings extend that rule rather
than testing it: a comparison may show **each branch's reading in the same canonical order**, and
may not emit a sentence that compares two branches' readings, order columns by anything derived from
them, or mark one as having "more" of anything. Criterion 10.

### 7. Availability: silence is the default

This RFC ships the capability. It does not turn it on.

#### 7a. When it is available

| Context | Structural reading | Structural grading |
|---|---|---|
| Committed play, pack or pack-less | Disclosure present, **closed**, opens only on a learner click | Server-side, silent, emits nothing to the client |
| Checkpoint sheet / terminal sheet | The structural evidence sentence appears **with the objective transition it grounded** — after the commitment, which is what ADR-0006 always said | — |
| Comparison | Per-branch reading, canonical order, no comparative sentence (§6c) | — |
| Spectator / live session | Same disclosure. A reading is a pure function of a position the spectator can already see, so there is nothing to withhold and nothing leaks | — |

#### 7b. What is deliberately absent

- **It never opens itself.** No auto-open on a detection, on a checkpoint, on a phase change, or on
  a first run.
- **No badge, no count, no dot.** A closed control that says "3" has already told the learner
  something is there, which is proactive assistance wearing a smaller coat. The control's label is
  the static string "Structural reading" in every position, including positions with nothing to say.
- **No highlight, no board overlay, no arrow** in this RFC. Painting the board is how sight becomes
  instruction, and it is a separate decision with a real risk attached (`design/BACKLOG.md:194`:
  *tips that never stop remove the need to look*).
- **Open state is component-local**, persists while the run screen is mounted, and resets to closed
  on load. Not persisted, not per-learner, not a setting. `design/05` §3a's posture is that the
  learner may open it — not that the product remembers they once did.
- **No per-pack or per-mode assistance switch.** That is B10's `assistanceConfig` (§5 of
  Motivation). Adding one here would make two.

#### 7c. Withholding, asserted rather than assumed

`successConditions` are absent from `projectPackDocument` (`apps/server/src/pack-registry.ts:65-121`)
and must stay absent: a structural success condition is a precise statement of what the pack is
watching for, and handing it to the client before play is handing over the answer in a way an
`objective.summary` does not. Criterion 13 asserts `GET /packs/:id` carries no `successConditions`
key for the Pack B fixture, in the browser.

### 8. Load-time refusals

New codes in `apps/server/src/pack-validation.ts`, in the `runtimeIssue` style of `:73-79`, each with
a fixture under `schemas/fixtures/drill-pack/`:

| Code | Path | Fires when |
|---|---|---|
| `OBJECTIVE_GRADES_NOTHING` | `/objective` or `/legs/<i>/objective` | The objective type is one of the five plan-family types and the compiled rule set is empty |
| `LINE_SPAN_EMPTY` | `…/feature` | `line_blockers` whose `between(from, to)` is empty — unaligned, identical, or adjacent endpoints. All three are authoring errors and all three would otherwise evaluate to a constant |
| `OUTPOST_RANK_OUT_OF_RANGE` | `…/feature` | `outpost` on a square outside ranks 4–6 from `color`'s side. The definition cannot hold there, so the pack is asserting a contradiction |
| `UNKNOWN_STRUCTURE_ID` | `…/feature/id` | `named_structure` naming an id absent from `STRUCTURE_CATALOGUE` |
| `NEGATIVE_FEATURE_COUNT` | `…/feature` | `line_blockers.count`, `piece_mobility.count` negative, or `square_control.margin` outside ±16 |
| `STRUCTURAL_EXPRESSION_TOO_DEEP` | `…/feature` | A `StructuralExpression` nested more than **4** levels. The language is recursive and a recursive schema with no cap is an unbounded parse; four levels expresses every signature in §10 with room over |

`OBJECTIVE_GRADES_NOTHING` is the one that makes the gap unreintroducible, so its exemptions are
stated rather than left to the reader:

- **`play_until_checkpoint` is exempt.** It is the type that declares *nothing is claimed*, and it
  must stay available: the refusal is not "every pack must be graded", it is "a pack must not
  declare a plan objective and then grade nothing." An author who genuinely wants an ungraded
  position says so with the type.
- **`run_trajectory` is exempt at the top level** and checked per leg instead, because
  `objectiveRules` returns `[]` for it by design (`pack-orchestrator.ts:174`) and the legs carry the
  objectives.
- The four outcome types cannot trigger it (automatic rules, `:228-257`) and `follow_theory` is
  already covered by `THEORY_NEEDS_BOUNDARY_CHECKPOINT` (`pack-validation.ts:232-234`).

Under this rule two currently-valid artifacts stop loading, and §10 fixes both in this RFC.

`make pack-check FILE=<fixture>` must exit non-zero for each code, asserted on the process exit code
(`Makefile:23-26`), matching the precedent set by `rfc/archive/line-drill-theory-grading.md`
criterion 7.

### 9. Pack schema v0.10

`DRILL_PACK_SCHEMA_VERSION` `0.9 → 0.10` (`packages/schema/src/index.ts:2`) and
`schemas/drill_pack.schema.json`'s `$id` to `urn:chess-tabiya:schema:drill-pack:0.10`
(`schema.json:3`). Pack digests are content digests and are unaffected by the `$id`
(`packages/schema/src/drill-pack/digest.ts:58-66`), so no committed pack's digest moves.

Additions:

1. `$defs/file` — `{"type": "string", "pattern": "^[a-h]$"}`, alongside the existing
   `$defs/square` (`schema.json:103-106`).
2. `$defs/structuralFeature` — a twelve-branch `oneOf`, every branch an object with
   `additionalProperties: false`, a `const` `kind`, and required fields exactly as §3b.
   `piece_mobility.role` is `{"enum": ["knight","bishop","rook","queen"]}`;
   `named_structure.id` is an enum of the four catalogue ids.
3. `$defs/structuralExpression` — a four-branch `oneOf` (`all`/`any`, `not`, `feature`,
   `pieceOnSquare`), self-referential through `$ref: "#/$defs/structuralExpression"`, every branch
   `additionalProperties: false`, `all`/`any` requiring `minItems: 1`. Depth is capped by
   validation, not by the schema (§8), because JSON Schema cannot express a depth bound and a lint
   that can is better than a schema that pretends to.
4. `$defs/fenPredicate` (`schema.json:329-372`) gains a fourth branch:
   `{"required": ["type","feature"], "properties": {"type": {"const": "structuralFeature"}, "feature": {"$ref": "#/$defs/structuralExpression"}}, "additionalProperties": false}`.
5. `$defs/successCondition` (`schema.json:241`) gains a fifth branch for `structural_feature`,
   carrying `feature: {"$ref": "#/$defs/structuralExpression"}` and `to`/`from` by the same
   `conditionBase` refs the other four use.

**Nothing new is open.** The audit that produced this rule found *three* passthrough sites in the
shipped schema, not two: `opponentPolicy` (`schema.json:514` — D22, `design/BACKLOG.md:127`),
`provenance` (`schema.json:612` — D25, `design/BACKLOG.md:126`), and **`feedbackClaim`
(`schema.json:598`), which is not ledgered anywhere.** D25's row cites line 598 for `provenance`,
which is `feedbackClaim`'s line; the row's coordinate is wrong and it points at the unledgered third
site. `feedbackClaim` is the weakest of the three — it is not projected to the browser, asserted at
`apps/server/src/drill-client-server.test.ts:158` — but it is an open shape that validation blesses
and the sourcing pipeline writes into (`apps/server/src/sourcing/explorer.ts:232-254`). The
implementer **proposes** a BACKLOG row for it and a correction to D25's citation; this RFC does not
edit `design/`.

Criterion 12 turns that audit into a standing test: walk the whole schema and assert the set of
`additionalProperties: true` sites is exactly those three. The inventory becomes pinned and cannot
grow silently, which is the general form of the failure class this RFC's shapes had to avoid.

### 10. Pack B gets an objective, and the browser fixture gets an honest type

**`content/drafts/carlsbad-minority-attack.json`.** The author already wrote the signature in prose
at `/planClasses/0/description`. It becomes `successConditions` — one condition per plan class that
**has** a structural signature:

```json
"successConditions": [
  {
    "kind": "structural_feature",
    "to": "achieved",
    "feature": {
      "kind": "all",
      "of": [
        { "kind": "feature", "feature": { "kind": "backward_pawn", "color": "black", "file": "c" } },
        { "kind": "feature", "feature": { "kind": "half_open_file", "color": "white", "file": "c" } }
      ]
    }
  },
  {
    "kind": "structural_feature",
    "to": "achieved",
    "feature": {
      "kind": "feature",
      "feature": { "kind": "half_open_file", "color": "black", "file": "d" }
    }
  }
]
```

Note the shape: the conjunction lives **inside** one condition, not across two. `successConditions`
are disjunctive by compilation — each becomes its own rule set (`pack-orchestrator.ts:143-167`) and
any of them can fire — so writing the minority attack's two features as two conditions would grade
"either half happened", which is wrong at the start position, where `half_open_file(white, c)` is
already true. This is the concrete reason §3b makes the predicate carry an expression rather than a
bare feature. The three plan classes:

- **Minority attack** — `all[ backward_pawn(black, "c"), half_open_file(white, "c") ]` → `achieved`.
- **Central break** — `half_open_file(black, "d")` → `achieved`. A successful e3–e4 break removes
  Black's d5 pawn while White keeps d4, which is exactly "Black has no d-pawn and White does".
- **Kingside attack** — **not graded, and this RFC says so rather than inventing a signature.** Its
  success is piece placement and initiative; there is no rules-arithmetic statement that
  distinguishes a working kingside attack from a wasted one, and manufacturing one would be the
  exact thing law 8 forbids. A learner who chooses that plan gets the same ungraded run they get
  today — which is a limit of rung 0, honestly located, not a defect in the encoding.

Because `successConditions` compile with `to: "achieved"` from `["active","preserved","degraded"]`
(`pack-orchestrator.ts:150-159`), Pack B goes from **0** compiled rules to **6** and stops tripping
`OBJECTIVE_GRADES_NOTHING`.

Verified against the real position rather than reasoned about. Pack B's start FEN is
`r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10`, and evaluating the two features
of the minority-attack condition against it and against the position after `a3, Rab1, b4, b5, bxc6
bxc6`:

| Position | `backward_pawn(black, c)` | `half_open_file(white, c)` | conjunction |
|---|---|---|---|
| Pack B start | **false** — b7 sits on an adjacent file and is not ahead of c6, so c6 is supportable | true — White has no c-pawn already | **false** |
| After the minority attack completes | **true** — the b-pawn is gone, d5 is strictly ahead, and White's d4 covers the stop square c5 | true | **true** |

The conjunction is false at the start and true at the goal, on the real board, which is the whole
claim of §5c of the design made mechanical. Criterion 1 is exactly this table.

**`schemas/fixtures/drill-pack/terminal-outcome.browser.json`.** Its objective type becomes
`play_until_checkpoint`. Its own summary says it exists to *"exercise terminal outcome delivery
without making a chess claim"*, so `preserve_plan_window` was always the wrong declaration: the
fixture claims nothing and should say so. One field changes, no browser assertion moves.

**`content/drafts/trajectory-legs.browser.json`** is untouched: its third leg is
`play_until_checkpoint` and is exempt by §8.

### 11. Boundary conditions, enumerated

Collected in one place because this is the failure class that kills drafts here. Each has a test in
criterion 4 unless noted.

| Condition | Behaviour |
|---|---|
| `pawn_safe_square` on rank 1 or 8 | Trivially safe (no pawn can stand on an attacking rank). Allowed, not refused — it is the primitive and the answer is correct |
| `outpost` outside ranks 4–6 from `color` | Refused at load (§8), because the definition cannot hold |
| `backward_pawn` on a file where `color` has no pawn | False, not an error |
| `backward_pawn` where the stop square is off the board | False. The pawn is on the last rank before promotion and has no stop square |
| `backward_pawn` and `isolated_pawn` both true | Both reported. §2a |
| `passed_pawn` asked about a square with no pawn of `color` | False |
| `half_open_file` where **neither** side has a pawn | False for both colours. `open_file` is the predicate for that, and the two are not aliases |
| `line_blockers` with unaligned, identical or adjacent endpoints | Refused at load (§8) |
| `line_blockers` counting the endpoints | It does not. `between` excludes both bounds |
| `square_control` where the king is an attacker | Counted. It attacks the square; whether it may legally capture is a different question and is not asked |
| `square_control` and x-ray | Not counted. Direct attackers only, stated in §2a and in the rendered sentence's wording |
| `piece_mobility` with `scope: "every"` and no such piece | Vacuously true. §2a |
| `piece_mobility` and pins | Ignored. Mobility is the attack set minus friendly occupancy; it is not a legal-move count and the name is not "legal moves" |
| `named_structure` inside a catalogue trigger | Impossible by type (§5a) |
| `all` or `any` with an empty `of` | Impossible by schema (`minItems: 1`) and by type (non-empty tuple). An empty `all` would be vacuously true and an empty `any` vacuously false, which are two different silent answers to a malformed input |
| A `StructuralExpression` nested more than 4 deep | Refused at load (§8) |
| A conjunction written as two `successConditions` instead of one composed condition | Grades as a **disjunction**, because conditions compile independently. Not detectable in general, so it is documented in §10 and in `docs/structural-reading.md` as the one authoring trap this vocabulary has |
| A `structuralFeature` predicate under `not` | Works — `ObjectivePredicate.not` already composes (`objective.ts:76`, `:255-256`). "The outpost was denied" is `not(outpost(...))` |
| A `structuralFeature` in `authoredBoundary.fenPredicates` | Works, because it is a `FenPredicate` (`packages/runtime/src/line.ts:111-116`). Not used by any shipped pack and not forbidden |
| A fifth `FenPredicate` variant added later without a case | Compile error, not a silent universal match (§3c) |
| An unrecognised `SuccessCondition` kind | Throws in `successPredicate`, after the load-time refusal has already rejected the pack (§3d) |
| Reading requested on a run with no pack | Works identically. Rung 0 needs no author |

### 12. Cost

All twelve features are `SquareSet` arithmetic over a 64-square board (`chessops/attacks`,
`chessops/squareSet`), with no allocation beyond the result arrays. A full `StructuralReading` is
bounded by 8 files × 2 colours + 64 squares + ≤ 16 sliders, and the catalogue is four entries. The
budget is **under 1 ms per position** and it is asserted, not assumed: criterion 14 measures a full
reading plus delta over the Pack B spine and fails above 1 ms per node on the same envelope the
existing latency tests use (`packages/runtime/src/latency.test.ts`).

Computation happens **in the browser** for the reading and **on the server** for the grading, from
the same functions in `packages/runtime` — which `apps/web` already depends on
(`apps/web/package.json`). No new endpoint, no network call, and the "free, local" cost cell of
`design/05` §3 is literal rather than aspirational. One implementation, two call sites, which is the
D4 lesson `rfc/archive/line-drill-theory-grading.md` §4b paid for once already.

## Deviations from design

1. **`design/03-product-breadth.md:381-382` says "two authored packs with no working objective."**
   Measured, it is one of three (Motivation §1); the row predates
   `rfc/archive/line-drill-theory-grading.md` landing the same day. The RFC does not soften the
   claim, it widens it — the gap is the whole five-type plan family, and two currently-loading
   artifacts are in it. Correcting the row is a BACKLOG row the implementer **proposes**
   (`AGENTS.md` law 5).
2. **`design/05` §5 line 268 and `design/03` line 164 give the denial reading as "after a4, a Black
   knight can never use b5 again."** Measured, the fact is available *before* a4 and what a4 changes
   is the eviction distance (§2c). The RFC ships the distance, which is strictly more informative
   and is forward-looking rather than retrospective. The design's example is a correct instance of a
   claim whose general form is slightly different.
3. **`design/05` §6 question 2 — how deep discovered consequence goes — is answered at one ply.**
   It is listed as a genuine design fork, and this RFC resolves it on rung-0 grounds rather than on
   taste (§4d): a second ply requires a null move, a null move is a judgement about the opponent, and
   a judgement is not rung 0. Promoting that reasoning into `design/05` is a BACKLOG row to
   **propose**, not a `design/` edit to make.
4. **`design/03` line 161 lists "pawn-skeleton signature" as a feature predicate.** It ships as a
   readable key and as the body of a named structure, never as an authorable equality test, because
   as a predicate it is `pawnStructure` with `mode: "exact"` renamed — the exact brittleness this
   RFC exists to remove (§2b).
5. **`design/03` line 171 says pressure maps show "imbalance shown, significance attributed."** This
   RFC ships the counts and attributes nothing, because there is no attributed judgement available
   at rung 0 to attribute. The attribution slot exists (an authored record referencing a feature id,
   §4a) and stays empty until a rung-5 source fills it. Showing an imbalance with an empty
   attribution is the honest half.
6. **`design/05` §3b's guided mode is a permitted use of this layer and is not built here.** The
   design places clippy at "B9 + B10 + B11 with assistance turned up"; this RFC is the B9 third and
   §7 is deliberately the *off* posture. No deviation in substance, recorded so nobody reads the
   absence as disagreement.
7. **A defect is closed that no design doc names.** `matchesFenPredicate`'s fall-through
   (Motivation §3) and `successPredicate`'s silent `undefined` (§3d) are live never-silent hazards
   found while specifying this. Ledgering them, and the unledgered `feedbackClaim` passthrough plus
   D25's wrong line citation (§9), are `design/` edits the implementer **proposes** as BACKLOG rows.

## Acceptance criteria

1. **Pack B's objective flips exactly at the goal.** A table-driven test evaluates
   `all[ backward_pawn(black,"c"), half_open_file(white,"c") ]` against Pack B's start FEN and
   against the position after `a3, Rab1, b4, b5, bxc6 bxc6`, and asserts **false** then **true**,
   with each conjunct asserted separately so that the test fails if either is dropped. The same test
   drives a run through those moves and asserts the objective transitions `active → achieved` once,
   with `evidenceRefs` containing `rules:structure-backward-pawn`. This is the criterion the whole
   RFC exists for: **a feature predicate authored into a pack objective grades a plan by its
   structural consequence.**
2. **`objectiveRules` over every shipped pack.** A test compiles every pack under `content/drafts/`,
   `schemas/fixtures/drill-pack/*.browser.json` and `schemas/drill_pack.example.json` and asserts a
   non-empty rule set for every plan-family objective and every non-`play_until_checkpoint` leg —
   the mechanical form of "no pack silently grades nothing". Written with the pre-RFC counts
   (`carlsbad 0`, `terminal-outcome 0`, `trajectory leg 3 = 0`) in a comment so the regression is
   legible.
3. **Pawn safety is one-sided-safe and push-monotone.** A `fast-check` property over random legal
   positions asserts (a) whenever `safe` is true there is no enemy pawn that can attack the square by
   pushes alone, checked by brute-force enumeration of pawn push sequences to depth 6; and (b) after
   any single pawn push the push-attacker set of every square is a subset of what it was. A third
   case asserts a hand-built position where `safe` is true and `captureAttackers` is non-empty, and
   that the rendered sentence contains the qualifier (§6b rule 2).
4. **Boundary conditions, table-driven.** Every row of §11 that is not marked "refused at load" has a
   case asserting the stated value. The `scope: "every"` vacuous-truth row and the
   `half_open_file` neither-side row are asserted explicitly, because both are shapes a reader would
   guess wrong.
5. **Load-time refusals.** Each of §8's six codes has a fixture that fails `validatePackDocument`
   with that exact code **and** makes `make pack-check FILE=<fixture>` exit non-zero, asserted on
   the process exit code. Includes an `OBJECTIVE_GRADES_NOTHING` fixture per plan-family type, a
   `play_until_checkpoint` fixture asserting it does **not** fire, and a `run_trajectory` fixture
   whose second leg is empty asserting the path is `/legs/1/objective`.
6. **The fall-through cannot come back.** A test constructs a `structuralFeature` predicate whose
   feature is false in the position and asserts `evaluateObjectivePredicate` returns **false**, with
   a comment naming the pre-RFC behaviour (an empty `expected` list matching everything) that it
   replaces. A second, type-level case asserts the `never` exhaustiveness check exists by adding a
   sentinel variant in a `@ts-expect-error` block.
7. **Denial reading on a real board.** On a fixture with a white pawn on a2 and a black knight on b5,
   `StructuralDelta` after `a3` reports an `evictionChanges` entry for b5 with
   `pushesBefore: 2, pushesAfter: 1`, and after `a4` reports `pushesAfter: 0`. Asserts that
   `gained`/`lost` are empty across both — the reading fires where nothing else does, which is the
   claim in `design/05` §5.
8. **Canonical order is a pure function of the feature set.** Two positions with the same features
   detected produce byte-identical `features` arrays, and a shuffled internal detection order
   produces the same output. Asserts no field named `score`, `rank`, `severity` or `favours` exists
   anywhere in `StructuralReading` by walking the serialised object.
9. **No sentence carries a verdict.** Every `StructuralFeatureKind` is rendered against a fixture
   position and the result is asserted not to contain any word from §6b's banned list,
   case-insensitively, as whole words. Fails closed for a kind with no sentence.
10. **Comparison does not compare.** A two-branch comparison payload carries each branch's reading in
    canonical order and no field or sentence that relates them; asserted alongside the existing
    no-ranking assertions of `rfc/archive/n-way-comparison.md`.
11. **One vocabulary, four places.** A test asserts `STRUCTURAL_FEATURE_KINDS`, the schema's
    `structuralFeature` `oneOf` `kind` consts, the twelve `structure-*` entries of
    `RULES_EVIDENCE_FACTS`, and the keys of the sentence table are the same set. Two implementations
    of one vocabulary is the D4 shape and this is the guard against it.
12. **The passthrough inventory is pinned.** A test walks `schemas/drill_pack.schema.json` and
    asserts the set of `additionalProperties: true` sites is exactly `$defs/opponentPolicy`,
    `$defs/feedbackClaim` and `$defs/provenance`, and that every new `$defs` node this RFC adds is
    `false`. Fails if a fourth appears.
13. **Browser: the capability is present, silent, and withheld.** In `tests/browser/drill.spec.ts`,
    against the Pack B fixture:
    (a) on entering the run, the page contains a control labelled "Structural reading" and **no**
    structural sentence is visible anywhere, and the control carries no numeral;
    (b) `GET /packs/<pack-b>` contains no `successConditions` key;
    (c) clicking the control reveals the reading for the current position, including the
    `half_open_file(white, c)` sentence, and the `backward_pawn(black, c)` sentence is **absent** at
    the start position;
    (d) after driving the minority attack to completion, the objective grade is delivered through
    the existing sheet with a "Rules"-sourced structural sentence, and reloading the page returns the
    control to closed.
    (d) is the one that proves the two halves are the same layer: the same predicate that graded the
    plan is the sentence the learner reads.
14. **Envelope.** A full `StructuralReading` plus `StructuralDelta` over every node of Pack B's spine
    stays under 1 ms per node, measured in the style of `packages/runtime/src/latency.test.ts` and
    written to the existing latency artifact.
15. **`pnpm verify` passes** — typecheck, unit suite, and `pnpm schema:check` — and
    `pnpm test:browser` passes with the amended `terminal-outcome.browser.json`.
16. **Canonical documentation.** `docs/structural-reading.md` describes the twelve features with
    their exact definitions, the one-sided-safe property, the one-ply vacation rule, the catalogue,
    the availability posture, and the explicit boundary: no significance, no shape entries, no live
    classification, no intent-relative grading. `docs/drill-pack-format.md` records pack schema 0.10
    and the fifth `successCondition` kind; `docs/explanation-grounds.md` records the twelve new
    `rules:` facts and the no-valence rule; `docs/README.md` gains its row.

## Open questions

None.

## Changelog

- 2026-08-13: created. Specifies the rung-0 structural layer: twelve deterministic feature
  predicates that are simultaneously learner readables and authorable objective conditions, the
  push/capture eviction arithmetic behind denial and prophylaxis reading, one-ply vacation-diff
  discovered-consequence sight, a four-entry structural-naming catalogue whose triggers are
  arithmetic and whose names carry provenance, pack schema v0.10 with no migration, a load-time
  refusal for plan objectives that grade nothing, and a closed-by-default availability posture that
  keeps silence the default during committed play.
