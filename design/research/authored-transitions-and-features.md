# Authored transitions and deterministic features — the Q4a / Q4b / E3 verdict

**Questions:** Q4a, "Can authors declare useful phase transitions and timing windows?"
and Q4b, "Can deterministic features assist authors reliably?"
(`planning/exploration/plan.md:24-25`). Both feed **E3**, the continuation gate
"Authors can declare useful opening→middlegame boundaries and timing windows **without
automatic phase detection**" (`planning/exploration/gates.md:84`), and **K7**, "Authors
cannot reliably encode timing and structure without excessive custom code" (`:70`).

**Status before this dossier:** both questions sat at `💡 posed` with two GAP rows in the
coverage matrix (queue 7 and queue 8), because the only evidence was the archive's desk
sketch (`archive/brief-v2/rfcs/RFC-0005-phase-and-trajectory-engine.md`). That changed:
**35 authored drill packs and 23 shape entries now exist**, and nine authoring waves
reported, wave by wave, what the vocabulary could not say. This dossier counts what
authors actually did with the format rather than what the format offers, and re-runs the
shipped evaluator over the shipped content.

---

## 1. Verdict

**Q4a — split, and the split is the finding. Authors declared phase boundaries reliably
and declared timing windows zero times.**

- **Boundaries: yes.** 32 of 35 packs declare an `authoredBoundary`; the other three are
  trajectories, which declare their boundaries as legs instead. Seventeen of the 32 were
  under no obligation to — nothing in validation compelled them `[V]`. All six
  cross-phase leg boundaries in the three trajectory packs are structural predicates over
  the position, and **all six fire on the authored line at the ply the author claimed**
  when the shipped `matchesStructuralExpression` is run over the spine `[V]` (§5.1).
- **Timing windows: no. Zero of 135 checkpoints use one** `[V]` — and this is neither
  "not needed" nor "authors did not know to". `design/04-content-architecture.md:228`
  requires "one timing window where the tempo contract bites" per opening pack root, and
  18 of 18 opening-phase packs ship without one. The author of the pack whose entire subject is
  a timing race wrote down why on the first day (§4.2), and the runtime evaluates only
  half the field anyway (§4.3).

**Q4b — yes for censuses, no for judgments, and the boundary between the two is sharp.**
Deterministic features assisted reliably wherever the authored claim was a *fact about
the position* — 22 of 25 shape references and 14 of 14 in-spine structural checkpoint
triggers fire on the shipped evaluator with zero errors `[V]` — and the gap→predicate→
adoption loop closed inside one day, five times (§5.3). They assisted with nothing
wherever the claim was about plans, intent, history or timing: **73% of the shape
library's authored plans (75 of 103) ship with `signature: null`** and an explicit note
that no census distinguishes success `[V]`, seven of the fifteen feature kinds have never
appeared in a pack `[V]`, and one schema-valid structural condition class crashes the
validator (D32).

**E3 — partially met.** The boundary half is met with reproducible evidence; the
timing-window half is unmet, for a stated and reproducible reason. §7 gives the ruling in
the gate's own terms.

**One sentence:** authors do not need automatic phase detection to declare *where* a
phase changes — they declare it by hand and the deterministic classifier confirms it at
the exact ply — but nobody has ever declared *when a window closes*, because the format
cannot say what the tempo claim actually means.

---

## 2. Method, and what these numbers are not

**Corpus.** `content/drafts/` holds 74 JSON files: **35 hand-authored packs**, 6
`*.browser.json` runtime test fixtures, and 33 `*.evidence`/`*.job`/`*.sources` sidecars
`[V]`. Only the 35 are counted as authored content; the 6 fixtures are counted separately
where noted and never mixed in. `content/candidates/` holds 36 machine-emitted candidate
packs whose `objective.summary` is an emitter placeholder
(`content/candidates/b12-caro-kann-defense-advance-variation-short-variation/pack.json`
declares exactly that in its `graduationBlockers`) `[V]`; they are excluded — they record
what the emitter emits, not what an author chose. `content/shapes/` holds **23 shape
entries** `[V]`.

**Structural counts** (§3, §4, §5.2) are produced by parsing every pack and shape file and
tallying fields; they are `[V]` and recomputable (Appendix).

**Firing measurements** (§5.1) run the **shipped** `matchesStructuralExpression`
(`packages/runtime/src/structure.ts:351-365`) and `positionFromFen`, bundled unmodified
with esbuild, over FENs derived by replaying each pack's principal (first-child) spine
path from its `start.fen` with chessops. No reimplementation. `[V]`, reproducible
(Appendix).

**Author testimony** (§4.2, §5.4, §6) is quoted from `planning/content-era/log.md`, 27
dated entries spanning 2026-08-12 to 2026-08-15. Testimony is `[P]` — self-reported by the
authoring agent at the time — except where this pass independently reproduced it, which is
called out and labelled `[V]`.

**Three things this dossier does not claim.** It does not measure whether a declared
boundary is *pedagogically* the right one — that is Q1c and needs learners, not counts. It
does not measure author *time*; that is `design/research/pack-authoring-cost.md`. And it
says nothing about Q4c: every measurement here is of an *authored* declaration checked
against a deterministic predicate, which is the opposite of automatic recognition.

---

## 3. What authors actually declared — the census

### 3.1 Boundaries

| Fact | Count | Source |
|---|---|---|
| Authored packs | 35 | `content/drafts/` `[V]` |
| Packs declaring `authoredBoundary` | **32 / 35** | `[V]` |
| …using `spineNodeIds` + `plyHorizon` | **32 / 32** | `[V]` |
| …using `fenPredicates` | **0 / 32** | `[V]` |
| Total spine-node ids granted | 435 | `[V]` |
| Packs with no boundary | 3 (all `run_trajectory`) | `[V]` |

**The `fenPredicates` zero is the sharpest number in this section.** The boundary field
offers a position-keyed half — the half `design/04-content-architecture.md:128` says
"would transfer" to Just Play — and no author has ever used it. Every boundary in the
corpus is keyed to *this pack's move tree*. The audit's prediction is confirmed from the
authoring side, at 32/32.

**How much of the boundary declaration was free choice.** `follow_theory` objectives are
*compelled* by validation to carry a boundary, a finite `plyHorizon`, a grant, and exactly
one `atAuthoredBoundary` checkpoint (`apps/server/src/pack-validation.ts:417-431`,
codes `THEORY_NEEDS_AUTHORED_BOUNDARY`, `BOUNDARY_NEEDS_PLY_HORIZON`,
`BOUNDARY_GRANTS_NOTHING`, `THEORY_NEEDS_BOUNDARY_CHECKPOINT`) `[V]`. Fifteen packs are
`follow_theory`. So:

- **15 boundaries were mandated** by the validator;
- **17 boundaries were voluntary** — `win` (10), `hold` (3), `play_until_checkpoint` (3),
  `execute_break` (1) packs that would have validated clean without one `[V]`.

A majority of boundaries in the corpus were declared by authors who did not have to. That
is the load-bearing fact for E3's word "can".

**Was choosing the horizon hard?** `plyHorizon` equals the deepest authored spine path in
**19 of 32** packs, and exceeds it in 13 — every one of the 13 an outcome/endgame pack
giving headroom for play beyond the authored line `[V]`. The two authors who commented
both reported the choice as easy and both reported the same rule: pack A set 14 under
"caps, does not grant" and recorded that "the corrected combinator matches author
intuition" (`planning/content-era/log.md:98-102`) `[P]`; pack B set 8, "exactly the depth
of the deepest authored path… correct conservative value and it was easy to choose"
(`:398-401`) `[P]`. The 19/32 exact-match rate is this pass's independent corroboration
that the rule generalised `[V]`.

### 3.2 Checkpoint triggers — 135 across the corpus

| Trigger | Count | Packs using | Keys on |
|---|---|---|---|
| `atSpineNode` | **97 (71.9%)** | 34 | the pack's move tree |
| `fenPredicate` | **17 (12.6%)** | 12 | the position |
| `atAuthoredBoundary` | 15 (11.1%) | 15 | the pack's boundary |
| `atPly` | 6 (4.4%) | 6 | the pack's move tree |
| `materialBalance` | **0** | 0 | the position |
| timing window | **0** | 0 | — |

All `[V]`. The 15 `atAuthoredBoundary` triggers are exactly the 15 `follow_theory` packs
at exactly one each — i.e. every use of that trigger is validator-compelled, none is a
free choice `[V]`.

**Position-keyed share: 17 of 135 = 12.6%.** `design/04-content-architecture.md:130`
identifies `fenPredicate` and `materialBalance` as "the only triggers that do" transfer
outside the pack. Measured against real content, the transferable share of the corpus's
checkpoint vocabulary is one in eight, and `materialBalance` contributes none of it. The
§0a audit's verdict — that authoring a pack contributes ~nothing to an unauthored game —
survives contact with 35 packs.

**Within those 17, the sub-vocabulary is unanimous:** all 17 are
`fenPredicate.type = "structuralFeature"`. `transposeKey` 0, `pawnStructure` 0 `[V]`. This
retires an open question by use: `design/BACKLOG.md:197` predicted the literal
`pawnStructure` predicate would be "brittle across variations" and that feature-level
predicates were what authors needed. Zero authors used the literal form; twelve used the
feature form. The prediction was right.

### 3.3 Shapes, plans and claims

| Fact | Count | Source |
|---|---|---|
| `shapes` references | 25, in 23 / 35 packs | `[V]` |
| `structural_feature` objective conditions | 21, in 15 / 35 packs | `[V]` |
| `intent_capture` interactions | **36, in 34 / 35 packs** | `[V]` |
| `feedbackClaims` | **124, in 35 / 35 packs** | `[V]` |
| `planClasses` | 99 | `[V]` |
| `deviations` | 255 | `[V]` |

Two of these numbers are demand signals for vocabulary that does not exist. **Every pack
in the corpus carries feedback claims (124 of them) and none of them can fire** — a claim
has no trigger field at all, exactly as `design/04-content-architecture.md:135` states.
**34 of 35 packs capture the learner's intent** — and no success-condition kind in the
schema is intent-relative (`schemas/drill_pack.schema.json` `$defs/successCondition`
offers `reach_checkpoint`, `outcome`, `material_balance`, `rules_fact`,
`structural_feature`) `[V]`. Captured intent does have *one* live consumer since the
explanation work: plan-class ids drive authored plan-class prose reveal
(`apps/server/src/authored-feedback.ts:237,299`) `[V]`. It grades nothing.

---

## 4. Q4a — the timing-window zero

### 4.1 The design asked for it, in writing

`design/04-content-architecture.md:228` specifies opening pack contents per root as
including "one timing window where the tempo contract bites", and `:309-311` names the
three first cases: the Caro Advance c5-break race, the Sicilian attack race, the Carlsbad
minority-attack race. **All three packs exist** — `anti-caro-advance.json`,
`anti-sicilian-najdorf-english-attack.json`, `carlsbad-minority-attack.json` — and none of
the three declares a timing window `[V]`. This is a `DESIGN-GAP:` between
`04-content-architecture.md` §2d/§7 and the shipped corpus, raised here rather than
resolved.

### 4.2 The author who needed it said why, on day one

Pack A is `anti-caro-advance-c5-race`, whose objective is literally the race: *"Meet
Black's ...c5 break with your pieces already placed, not with your king still in the
centre"* `[V]`. Its author's contract-gap report (`planning/content-era/log.md:84-91`)
`[P]`:

> **The timing window has no vocabulary for what I actually wanted to say.** The teaching
> point is: White's plan-readiness vs Black's break arrival. I needed to declare (a) which
> move constitutes "ready" (Be3/c3 — a SET of moves, not one), (b) which Black move is
> "arrival" (...c5), (c) that h4 is the discretionary spend… they need to accept a move
> SET and allow the same move to be plan-completion on one branch and irrelevant on
> another.

The shipped `timingWindow` takes `windowOpens` and `windowCloses` as **single
`simpleTrigger`s** (`schemas/drill_pack.schema.json` `$defs/timingWindow`) `[V]`, which is
precisely the shape the author reported as insufficient. What the pack shipped instead:
the tempo claim as free-floating prose — `"4.h4 gains space on the wing but spends the
tempo you need to meet ...c5 with a developed piece"`, `evidenceTypes:
["author_principle", "hypothesis"]`, no trigger `[V]`.

**Second, independent attestation from the opposite phase.** Pack C's author
(`planning/content-era/log.md:489-496`) `[P]`:

> **Endgame errors are drifts, not moves.** … "You have not moved your king in four moves
> and White's has crossed the fifth rank" is unsayable. This is the withdrawn RFC's
> luxury/tempo accounting again, wearing endgame clothes: Pack A needed it for a race,
> Pack C needs it for slow drift, **so the requirement is now attested from two
> independent directions.**

So the zero is a *refusal*, not an oversight. Both authors who reached for the field
recorded that it could not express their claim, and no later wave attempted it.

### 4.3 And the runtime evaluates half the field

`checkpointMatches` (`apps/server/src/pack-orchestrator.ts:64-73`) `[V]`:

```ts
  if ("windowOpens" in trigger) {
    return simpleTriggerMatches(pack, run, trigger.windowCloses);
  }
```

`windowOpens` and `luxuryMoveBudget` are read nowhere outside
`packages/schema/src/drill-pack/types.ts` and `lint.ts` `[V]`. A timing window is
therefore, today, a strictly more verbose alias for its own closing trigger — and this is
documented, not hidden: `docs/drill-client.md:73-75` states "A timing window fires when
its authored closing trigger matches." **The luxury-move budget, the one construct the
tempo contract is actually about, has no evaluator.** Declining to use the field was the
rational choice.

### 4.4 What authors did instead — and it is not nothing

Phase transitions *were* declared, just not as windows. The three trajectory packs declare
opening→middlegame→endgame boundaries as **leg entry checkpoints keyed on structural
predicates** `[V]`:

| Pack | Leg boundary | Trigger | First fires |
|---|---|---|---|
| `trajectory-qgd-exchange-minority` | `carlsbad-standing` | `named_structure: carlsbad` | **ply 12** |
| `trajectory-qgd-exchange-minority` | `rook-ending` | rook census + queens/minors absent | **ply 54** |
| `trajectory-caro-advance-chain-bishops` | `chain-closed` | closed-chain expression | **ply 8** |
| `trajectory-caro-advance-chain-bishops` | `bishop-ending` | bishop/reach census | **ply 45** |
| `trajectory-mate-bishop-knight` | `king-on-the-edge` | `quantified` king regions | **ply 8** |
| `trajectory-mate-bishop-knight` | `king-in-the-bishops-corner` | `quantified` corner box | **ply 28** |

Six of six fire on the authored line, measured this pass with the shipped evaluator `[V]`.
This is the E3 sentence executed literally: an opening→middlegame boundary declared by
hand, with no automatic detection anywhere in the path, confirmed to fire where the author
said it would.

Note also that the objective type built for this — `transition_to_endgame` — is used by
**zero** packs and zero legs `[V]`; authors expressed the transition through the leg
boundary and the structural predicate, not through the phase word. Unused objective types
overall: `preserve_plan_window`, `prevent_opponent_plan`, `transition_to_endgame`, `save`,
`resist` `[V]`. `preserve_plan_window` — the type pack A was written against
(`planning/content-era/log.md:92-95`, "a declared objective with no runtime meaning") — is
still in the enum and still has no user.

---

## 5. Q4b — where the deterministic features assisted, and where they did not

### 5.1 Evidence for: the shipped classifier confirms authored claims

This pass ran the shipped `matchesStructuralExpression` over every authored spine `[V]`:

| Measurement | Result |
|---|---|
| `shapes` references checked against the referenced entry's trigger | **22 of 25 fire** on the pack's principal line; 0 unresolved ids; 0 evaluator errors |
| `fenPredicate` structural checkpoint triggers | **14 of 17 fire** on the principal line; 0 errors |
| Trajectory leg boundaries | **6 of 6** fire, at plies 8, 12, 28, 45, 54 (§4.4) |

**The three non-firing checkpoint triggers are correct by construction**, not defects:
`lucena-bridge-convert` `pawn-promoted`, `pawn-opposition-convert` `pawn-promoted`, and
`queen-vs-pawn-seventh-convert` `pawn-falls` all key on a terminal state the authored
spine deliberately stops short of — `lucena-bridge-convert`'s spine ends at
`8/1P2k3/8/1K6/1R6/8/8/1r6 b`, one move before promotion `[V]`. The success predicate
lying *beyond* the authored line is the product working: play the consequence.

**The three non-firing shape references are all one ledgered gap, and only that one.**
`anti-sicilian-najdorf-english-attack` → `opposite-castling-race` (9-ply spine),
`najdorf-english-attack-black` → `opposite-castling-race` (7-ply spine), and
`trajectory-qgd-exchange-minority` → `rook-4v3-same-side`. All three are *hands-off-to*
declarations, not *present-now* claims. The opening-wave author predicted exactly this
(`planning/content-era/log.md:744-749`) `[P]`:

> the opposite-castling-race reference in both Najdorf packs cannot fire during the
> authored spine (nobody has castled yet); it is a trajectory declaration riding on the
> only reference mechanism that exists… Both uses are honest; the format cannot
> distinguish them.

This pass reproduces that independently and adds the third instance `[V]`. So: **100% of
the corpus's non-firing shape references are the single ledgered "cannot distinguish
hands-off-to from present-now" gap** (`design/BACKLOG.md:201`). No shape reference in the
corpus is simply wrong.

**The strongest single case is the B+N trajectory.** Its author computed the black king's
square after every ply of a tablebase-verified 39-ply line, declared leg boundaries at the
first edge (ply 8) and the first corner box (ply 28) as `quantified` structural
predicates, and ran the shipped evaluator to confirm they first fire there — "not my
reimplementation" (`planning/content-era/log.md:1341-1352`) `[P]`. This pass re-ran the
shipped evaluator over the shipped file and reproduced **plies 8 and 28 exactly** `[V]`.
An authored phase decomposition, ruled by the owner in prose, encoded as deterministic
predicates, and independently verified to fire at the claimed plies — this is Q4b's
strongest positive result in the corpus.

### 5.2 Evidence for: the gap→predicate→adoption loop closed, five times

The wave-2 predicate RFC was drafted from the shape-wave gap reports and shipped
`bishop_on_shade`, `pawn_count`, `king_opposition`, `mirrored`, and `quantified`
(`rfc/README.md:56`, pack schema 0.13) `[V]`. Every one of the five was requested by a
named authoring gap, and every one has since been used by content:

| Predicate | Requested by | Uses in packs | Uses in shapes |
|---|---|---|---|
| `bishop_on_shade` | endgame shape wave gap 1 (`log.md:604-607`) | 2 (1 file) | 16 (2 files) |
| `pawn_count` | endgame gap 3 (`:612`), middlegame gap 5 (`:664`) | 5 (5 files) | 1 (1 file) |
| `king_opposition` | endgame gap 2 (`:608-611`) | 4 (1 file) | 2 (1 file) |
| `quantified` | endgame gap 4 (`:614`), middlegame gap 2 (`:653`) | 6 (2 files) | 5 |
| `mirrored` | middlegame gap 1 (`:643-652`) | **0** | 3 |

All `[V]`. The turnaround was under a day: the gaps were filed 2026-08-14 and the packs
that use the resulting predicates (wave 5b/5c, B+N) landed 2026-08-14 and 2026-08-15. The
BACKLOG row that calls the gap reports "the predicate roadmap, exactly as designed"
(`design/BACKLOG.md:210`) is vindicated by adoption, not just by intent. **`mirrored` is
the exception worth watching** — it was called one of "the two costliest" gaps, it shipped,
and no pack has used it; only shape entries have.

### 5.3 Evidence against: most authored knowledge has no census

| Fact | Count |
|---|---|
| Shape-entry plans authored | 103 across 23 entries |
| …with a real structural success `signature` | 28 (27%) |
| …with `signature: null` + a stated reason | **75 (73%)** |

`[V]`. The reasons authors wrote are the finding, not the ratio. From `carlsbad.json`
`[V]`: *"No rules-arithmetic signature distinguishes a working break from a wasted one"*;
*"Detection cannot count what a trade was worth"*; *"The absence of a future advance is not
decidable from one position."* From the endgame wave (`log.md:589-596`) `[P]`: *"All
defender/holding plans are `null` + note: holding and fortresses are outcomes, not
censuses."*

This is the honest ceiling of Q4b, and the authors drew it themselves rather than faking
signatures — which is ADR-0005 working at the content layer.

**Seven of fifteen feature kinds have never been used in a pack** — `pawn_safe_square`,
`outpost`, `isolated_pawn`, `doubled_pawn`, `passed_pawn`, `line_blockers`,
`direct_attack_count` `[V]`. Across packs *and* shapes together, two have never been used
anywhere: `pawn_safe_square` and `direct_attack_count` `[V]`. Pack usage is concentrated
to the point of monoculture: `piece_reach_count` accounts for 43 of the 61 feature leaves
in packs (70%), and **all 43 of them** are the `atLeast 0` / `scope: "any"` **existence idiom** — a reach
predicate standing in for "a piece of this type exists", the hack the endgame shape wave
named at `log.md:583-585` `[P]`. The vocabulary authors actually reach for is *existence
and material census*, expressed through a predicate built for something else.

### 5.4 Evidence against: the failure modes are real and two are defects

- **D32 — a structural condition can pass `pack-check` and throw at runtime**
  (`design/BACKLOG.md:114`). `conditionEvidenceRefs` raises a bare `TypeError` for any
  structural condition built only from `quantified`/`pieceOnSquare` nodes — both
  first-class schema constructs — and for **outcome** objectives the rule compiler is never
  called during validation at all, so the identical condition validates clean and explodes
  when played. Found 2026-08-15 by the B+N author hitting it mid-authoring
  (`log.md:1447-1455`) `[P]`. The one defect class that breaks the validator's entire
  promise, and it is in exactly the construct Q4b just added.
- **D34 — no king-geometry vocabulary** (`design/BACKLOG.md:116`). "The black king is on
  an edge" needs four `quantified` square regions, and the objective type used is
  `reach_structure` — *a pawn-structure word doing duty for a king-geometry target*.
  The author's own summary: "It works and it is deterministic; it is also four times
  longer than the fact it states" (`log.md:1461-1465`) `[P]`.
- **Four more classes the shape waves recorded as inexpressible** (`log.md:643-671`)
  `[P]`: no castling rights or history (opposite-side castling is faked with a king-square
  `pieceOnSquare` proxy, so a king that walked to g1 fires); no pawn tension or mobility
  ("open centre" had to mean a fully pawnless file); **no structure memory** — the
  fianchetto trigger dies the moment the bishop leaves g7, yet "life after the bishop
  trade" is the family's whole subject; and no "colour X has no pawn on file f" primitive.

### 5.5 Two positives worth recording

`line_blockers` "expresses long-diagonal clearance exactly" and was the fianchetto entry's
best signature; and the anticipated Maroczy trigger gap did not exist — `named_structure
maroczy-bind` already shipped (`log.md:673-677`) `[P]`. Deterministic assistance has also
**refused** an authored overreach at least once, which is assistance: the
`rook-4v3-same-side` trigger requires files a–d pawnless, and it correctly declines the
QGD trajectory's rook ending, which has pawns on d4/d5 `[V]`.

---

## 6. The gap list that matters — the predicate roadmap

Only gaps attested in **two or more independent waves** are listed; attestation counts are
from `design/BACKLOG.md` rows and `planning/content-era/log.md` entries, and where this
pass reproduced a gap that is marked. Ordered by attestation, then by blast radius. **This
list is the predicate roadmap**, and it is stated as such: the vocabulary should grow along
these lines and not otherwise, because these are the only gaps real content has hit twice.

| # | Gap | Attestations | Status |
|---|---|---|---|
| 1 | **Intent-relative success** — grade the plan the learner committed to | **4**: pack A (`log.md:92-95`), pack B (`:373-385`), wave 5a (`:987`, "third attestation"), wave 5b (`:1075`, intent lands one decision too late) — plus 36 `intent_capture` interactions in 34 packs that grade nothing `[V]` | open |
| 2 | **King geometry** — edge, corner, box, key squares, Lucena/Philidor placement | **4**: endgame shape wave (`:608-611`, "kings are invisible"), middlegame wave (`:656-659`, castling proxy), mates batch, B+N (`:1461-1465` = D34). Partially served by `king_opposition` (wave 2), which shipped and is used | open (D34) |
| 3 | **Timing / tempo accounting** — plan-readiness as a move *set*, opponent arrival, luxury budget, multi-move drift | **2 independent phases**: pack A race (`:84-91`), pack C drift (`:489-496`) — plus 0/135 usage and a half-inert evaluator `[V]` (§4.3) | open; the E3 blocker |
| 4 | **Shape-reference modality** — *present-now* vs *hands-off-to* | **2** logged (`:744-749`, `design/BACKLOG.md:203`) + **3 of 3** non-firing references measured this pass `[V]` | open |
| 5 | **Per-leg authoring** — per-leg `opponentPolicy`, `shapes`, `branchLengthTarget` | **2**: trajectory wave (`design/BACKLOG.md:203`), B+N (`log.md:1431-1446`) | open |
| 6 | **Structure memory / history predicates** — "traded vs merely moved", castling rights, pre-break state | **2**: middlegame shape wave gaps 4 and 7 (`:656-659`, `:668-671`) | open |
| 7 | **Existence and material census as first-class** — `piece_reach_count atLeast 0` is doing this job 39 times `[V]` | **2**: endgame shape wave (`:583-585`), trajectory wave six-leaf hack (`design/BACKLOG.md:203`) | partly served by `pawn_count`; piece existence still idiomatic |

**Closed by wave 2, and the reason to trust the roadmap:** bishop square-colour, pawn-count
comparison, range-over-squares quantification, file quantification, and king opposition
were all on the previous version of this list and all now ship and are used (§5.2).

Two adjacent items are deliberately **not** on the roadmap because they are not vocabulary:
`branchLengthTarget`'s 2–20 range (3 attestations — but it is a range, not a predicate) and
the un-blessed scratch verification harness (4 attestations — tooling; already the
`authoring-frictions` RFC's business, and cited under K7 in
`design/research/pack-authoring-cost.md`).

---

## 7. The E3 ruling

E3: *"Authors can declare useful opening→middlegame boundaries and timing windows without
automatic phase detection."* Taken clause by clause, against the corpus:

| Clause | Ruling | Evidence |
|---|---|---|
| "Authors can declare … boundaries" | **met** | 32/35 packs, 17 of them voluntarily; 435 granted spine nodes; `plyHorizon` chosen at exactly the spine depth in 19/32 with two independent "it was easy" reports `[V]`/`[P]` |
| "opening→middlegame" specifically | **met** | 3 trajectory packs declare opening→middlegame→endgame boundaries as structural leg entries; 6/6 fire at the claimed ply `[V]` |
| "useful" | **met on the runtime sense, untested on the pedagogic sense** | `insideAuthoredBoundary` (`packages/runtime/src/line.ts:100-116`) consumes the boundary and drives `on_line` / `classified_deviation` / `unknown` verdicts — it was a dead field on 2026-08-12 (`log.md:178-186`) and is live now `[V]`. Whether learners learn better at that boundary is Q1c |
| "and timing windows" | **unmet** | 0 of 135 checkpoints; 0 of the 3 races design/04 §7 names; the field's `windowOpens` and `luxuryMoveBudget` have no evaluator `[V]`; two authors recorded why `[P]` |
| "without automatic phase detection" | **satisfied throughout** | no detector exists or was used; every boundary above is authored, and the deterministic predicate only *confirms* it |

**Ruling: E3 is partially met — the boundary half met, the timing-window half unmet.**

The honest framing of the unmet half matters, because it is not the failure E3 was written
to catch. E3 was written to test whether hand-authoring could substitute for a novel
detector. On boundaries it can, decisively. The timing-window failure is **not** a failure
of hand-authoring — it is that the shipped tempo vocabulary encodes the wrong object
(single triggers where the claim needs a move set, a budget nothing evaluates), so there is
nothing for an author to hand-author *with*. That is a format defect on a known path, not
evidence against the thesis, and it is fixable without any detector.

**K7** ("authors cannot reliably encode timing **and** structure without excessive custom
code") is now split by evidence in the same place: structure is reliably encodable
(§5.1–5.2), timing is not encodable at all (§4). The criterion should not fire on a
conjunction where one half is confirmed working; but the timing half is real, twice
attested, and belongs on record as partial kill-criterion evidence rather than being
rationalised away.

---

## 8. Corrections and flags

1. **`DESIGN-GAP:`** `design/04-content-architecture.md:228` requires one timing window per
   opening pack root and `:309-311` names three specific first cases. All three packs
   exist; none declares a window; 18/18 opening-phase packs have none `[V]`. The design
   requirement and the shipped corpus disagree, and the corpus is right until the tempo
   vocabulary is fixed. Raised, not resolved (design tier is intent tier).
2. **A ledger row over-states a trigger's looseness.** `design/BACKLOG.md:203` says the
   `rook-4v3-same-side` trigger "fires on ANY rooks-only ending". As shipped it also
   requires files a, b, c and d to be pawnless, and it correctly refuses the QGD
   trajectory's rooks-only ending because d-pawns remain `[V]`. The trigger is narrower
   than the row claims; the row's underlying point (the entry *name* promises a 4v3 census
   the trigger cannot perform) still stands.
3. **A wave report does not match the shipped file.** The B+N entry
   (`log.md:1408-1414`) reports that `mate-two-bishops.json`'s only success condition can
   never fire, quoting `not(piece_reach_count … scope "every" … atLeast 0)`. The shipped
   file's condition is `not(all(bishop_on_shade white light, bishop_on_shade white dark))`
   with `to: "degraded"`, and this pass evaluated it as **true** on a bishopless position
   and false everywhere on the pack's own spine — i.e. it behaves as intended `[V]`.
   **Resolved by claude 2026-08-15: the file was revised, the report was correct.** The B+N
   agent read the pack as shipped on 08-14; claude reproduced the dead condition against the
   shipped evaluator (`[false, false, false]` across both-bishops / one-bishop / none),
   re-encoded it on `bishop_on_shade` (`[false, true, true]`), and committed the fix in
   `25b4584` — after that report and before this dossier read the file. Both observations are
   correct and describe different versions `[V]`.
4. **`preserve_plan_window` is still in the objective enum with zero users and no
   evaluator** (`schemas/drill_pack.schema.json:163`, `apps/server/src/pack-validation.ts:94`)
   `[V]`, four days after pack A recorded it as decorative. Same for
   `prevent_opponent_plan`, `transition_to_endgame`, `save`, `resist` `[V]`.

---

## 9. What this feeds

- **E3** — partially met; §7 is the ruling and the proposed gate text.
- **Q4a** — answered with a split verdict; boundaries yes, timing windows no (§1, §3, §4).
- **Q4b** — answered: reliable for censuses, absent for judgments, with the ceiling drawn
  by the authors themselves at 73% null signatures (§5).
- **K7** — split by evidence (§7); the timing half is partial kill-criterion evidence and
  is escalated, not buried. Complements `design/research/pack-authoring-cost.md`, which
  reached the same split from the cost side and deferred the ruling to this dossier.
- **B4** — `AGENTS.md` records B4 as unmet "until authored content supplies the vocabulary
  and timing cases". The vocabulary cases exist (17 structural triggers, 25 shape
  references, 6 verified leg boundaries). **The timing cases do not exist and cannot be
  authored under the shipped format** — B4's timing dependency is blocked on gap 3, not on
  content effort.
- **`design/04-content-architecture.md` §0a** — the content-transfer audit is confirmed
  quantitatively: 12.6% of triggers key on the position, `authoredBoundary.fenPredicates`
  is at 0/32, and 124 claims carry no trigger (§3).
- **The next predicate wave** — §6 is its scope, in attestation order.

---

## Appendix — reproducing the measurements

**Counts (§3, §4, §5.2, §5.3).** Parse every file in `content/drafts/` matching
`*.json` and not `*.{evidence,job,sources,browser}.json` (35 files) and every file in
`content/shapes/` (23 files); tally `authoredBoundary` keys, checkpoint `trigger` keys
(including `legs[].checkpoints`), `shapes`, `planClasses`, `deviations`,
`feedbackClaims`, checkpoint `interaction.type`, `objective.type` (top level and per leg),
and `"kind": "<feature>"` occurrences against the fifteen kinds in
`packages/runtime/src/structure.ts:30-45`.

**Firing (§5.1, §4.4).** Bundle `packages/runtime/src/structure.ts` unmodified with
esbuild (`--bundle --format=esm --platform=node`). For each pack, replay the principal
spine path from `start.fen` with chessops 0.15.1, collecting one FEN per ply. For each
`shapes` reference, evaluate the referenced entry's `trigger`; for each checkpoint whose
trigger is `fenPredicate.type = "structuralFeature"`, evaluate its `feature`. Record the
first ply at which each fires. Totals: 25 references → 22 fire; 17 triggers → 14 fire;
0 evaluator errors. The B+N leg boundaries reproduce plies 8 and 28; the QGD trajectory
reproduces plies 12 and 54; the Caro trajectory reproduces plies 8 and 45.
