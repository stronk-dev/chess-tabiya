# RFC: Learner rating

- **Status:** **draft — adversarially cross-reviewed 2026-08-16.** The review landed one
  **blocker** (D395, the selection-vs-rendering invariant, now **R15**, with **R16** closing
  the `BANNED_JUDGEMENTS` route-around D393 leaves open), **withdrew the tablebase
  adjudication** in §5.4 as a contradiction of this RFC's own §1 test, **corrected the
  register facts**, which had gone stale under the draft (`STORAGE_VERSION` 22→**23**, run
  schema 0.16→**0.17**), narrowed **R6** to what it can actually enforce, tightened **R10**
  so an owner ruling can go either way, corrected one calibration `rd`, one disclosure
  magnitude, and the §11.2 doctrine reading. **The estimable-window argument survives its
  arithmetic and does not survive its falsifier as written** — F-W was circular and is
  rewritten (§7.3, AC-7). Not accepted: open questions 1, 3, 5, 6, 8, 9 and 10 stand
- **Author:** claude
- **Cross-review:** claude (agent), 2026-08-16 — every figure re-derived from
  `tools/d333-band-outcome-harness/out/` and every code reference relocated **by symbol
  name**. *Line numbers below are advisory and were correct at `6df9dc1`; the tree moved
  twice under this draft (`STORAGE_VERSION` 22→23, run schema 0.16→0.17) and will move
  again. Locate `terminalOutcome`, `STORAGE_VERSION`, `DRILL_RUN_SCHEMA_VERSION`,
  `ASSISTANCE_WITHHELD`, `permittedAssistance`, `policyUsesMaiaBand`, `RunService.#project`,
  `attempts`, `learners` and `learner_position_stats` by name, not by number.*
- **Created:** 2026-08-16
- **Design refs:** `design/06-campaign.md` §2a/§2b/§3/§5; `design/03-product-breadth.md`
  §Learn and return (*"difficulty/rating controls use the same runtime rather than separate
  apps"*); `design/05-in-run-experience.md` §3 (the assistance ladder, unmodified here);
  ADR-0005 (law 8), ADR-0007 (progression is never monetized)
- **Exploration gate:** owner ruling **D332**, 2026-08-16 — *"we need history of learner too…
  but the idea is again: go from elo 1000-2000 so maybe we need to just measure player ELO
  properly"* — plus its owner extension **D365** (*"make it configurable in the profile or when
  opponents win/lose against bots readjust… there must be measures for this"*). Its one hard
  prerequisite, **D333/D324**, was answered 2026-08-16 by
  `design/research/maia-band-outcome-transfer.md`
- **Depends on:** `rfc/archive/return-and-progression.md` (`attempts.result` — the only durable
  win/loss/draw store), `rfc/archive/engine-request-contract.md` and
  `rfc/archive/resistance-spectrum.md` (`eloHonored`/`eloApplied` per-move record),
  `rfc/archive/learner-identity-and-authorization.md` (`learners`, the learner id).
  **Lands behind `teacher-surface.md` and `opponent-contracts.md`** in the migration order
  (see §9.1); **three** active documents now hold `STORAGE_VERSION + 1` (D384)
- **Parent / amends:** **nothing.** The draft claimed it amended `docs/return-and-progression.md`;
  **cross-review found no contradiction to amend** — all three of that doc's no-rating
  sentences are scoped to surfaces R14 keeps the rating off, and each survives verbatim.
  What is owed at landing is an **addition** naming the rating's own surface, not an
  amendment. See §11.2
- **Supersedes / superseded by:** —
- **Planning:** `planning/learner-rating/` (once implementing)

## Summary

This specifies **a Glicko-2 rating for the learner, computed only from whole games played to a
rules-terminal position against a *calibrated* Maia band at full material, with no assistance
and no rewind.** It ships the calibration table read directly off
`design/research/maia-band-outcome-transfer.md` §5 — four measured rungs, no interpolation, no
invented number — a publication rule that abstains until the rating deviation is smaller than
the resolution the instrument can support, and **sixteen** named refusals. It claims **no pack
schema lane, no run schema lane, and one migration position** (create-table/index only, no
backfill).

**The first refusal is the one that had to be written before anything else, and it is not
about rating quality.** `design/research/band-flattery-and-buried-value.md` established that
band-tuned flattery — *"the lower your elo, the more generous it gets"* — is **structurally
unreachable in this tree today, and unreachable for exactly one reason**: the `learners` table
has no rating column, so the conditioning variable does not exist. **This RFC creates it.**
**R15** is the invariant D395 demands be pinned before that happens — *a rating may select
WHAT a learner is shown; it may never be an input to WHAT IS SAID about a move they played* —
and **R16** closes the route around `BANNED_JUDGEMENTS` that D393's fix does not reach, because
that denylist is enforced only over LLM output and a rating surface's copy is authored.

Why now: the owner ruled the denominator on 2026-08-16, and the prerequisite landed the same
day. Why this shape: the measurement that unblocked the ruling also constrained it hard — the
band dial transfers at **≈0.29 over the corpus and ≈0.40 at full material**, so Maia's declared
`[1000, 2400]` is a **~480-Elo ladder at best**, and it transfers **≈0.07 below ten pieces**,
where it is not a difficulty lever at all. A rating built on that instrument is real; a rating
that prints the band's own units as if they were Elo is not.

## Motivation

### 1. The licence, argued rather than assumed

Law 8 (ADR-0005) forbids manufacturing chess truth and grading moves.
`design/research/coaching-versus-cheating-and-the-band-curve.md` §3 established, from the
shipped code, that the product **cannot say the learner played well** and **cannot say the run
succeeded**: prediction grading was deleted at schema 0.8→0.9, `lineMembership` returns authored
prose rather than a judgement, and *"no learner number exists anywhere."* That dossier's own
conclusion was that *"you'd need proper 2000 Elo skills"* is a claim about the **encounter's
configuration**, never about the learner.

**A rating does not reopen that.** The argument is structural, and it turns on what the update
function actually reads.

A Glicko-2 update takes exactly three inputs: the learner's prior `(r, RD, σ)`, the opponent's
rating and deviation, and a game score in `{1, ½, 0}`. None of the three is a statement about a
move or a position. In this repo the third input has a single producer, and it is fourteen lines
of chess rules:

```ts
// packages/runtime/src/outcome.ts — the whole file but its one import
// (`import type { Chess } from "chessops/chess";`)
export type RunOutcome = "win" | "loss" | "draw";

export function terminalOutcome(
  position: Chess,
  learnerSide: "white" | "black",
  repetitionCount = 1,
): RunOutcome | undefined {
  if (position.isEnd()) {
    if (!position.isCheckmate()) return "draw";
    return position.turn === learnerSide ? "loss" : "win";
  }
  if (position.halfmoves >= 100 || repetitionCount >= 3) return "draw";
  return undefined;
}
```

`chessops` decides; nothing else does. There is no resignation path, no adjudication, no
engine-eval verdict — I grepped `resign`, `adjudicat`, `forfeit` across `apps/` and `packages/`
and the run/outcome path has none. The reducer re-derives the outcome and **throws if the
recorded event disagrees** (`packages/runtime/src/events.ts:334-337`,
`` `outcome.reached ${event.seq} reports ${event.data.outcome}; expected ${expected}` ``), so the
result is not merely computed from the rules, it is *checked* against them on every read.

So a rating in this product is **arithmetic over rules facts**. It is the same object class the
owner already ruled admissible as the evidence rung named `corpus_observed` on 2026-08-15 — the
explorer's per-move white/draws/black, whose `/capabilities` entry reads
`{ instrument: "Explorer", capability: "per-move white / draws / black", disposition: "reached",
reason: "Population result attached to each move without grading", surface: "corpus panel" }`
(`apps/server/src/capabilities.ts`; the identifier `corpus_observed` itself is the evidence-rung
name in `expression-census.ts` / `sourcing/claim-binding.ts`, not a string in that file). It says
*what happened*, never *what was good*.

**The line this RFC must not cross, stated as the test every clause below is checked against:**
a rating may move only on facts `terminalOutcome` produces. The moment it moves on anything a
pack author, an engine evaluation, a tablebase probe or a heuristic decided, it stops being
arithmetic and becomes a verdict wearing arithmetic. §8 names each place that could happen and
refuses it. **Cross-review applied this test to the draft's own §5.4 and it failed** — a
tablebase-exact seal is not a fact `terminalOutcome` produces, and §5.4 is withdrawn on that
ground (R12).

### 1a. The licence has a second half, and the draft did not have it — D395

The argument above is about what may move the number. **D395 is about what the number may
move**, and it is the direction that was missing.

`design/research/band-flattery-and-buried-value.md` audited this tree against the accusation
*"the lower your elo, the more generous it gets with marking your moves as brilliant"* and found
the product clean **for a structural reason rather than a disciplined one**: the `learners` table
carries `id, handle, display_name, password_hash, failed_attempts, locked_until, created_at` and
nothing else, there is no `learnerElo` / `declaredBand` / `selfRating` anywhere in `packages/` or
`apps/`, and *"band-tuned flattery is currently unreachable because the conditioning variable
does not exist"* `[V]`. Its §3 completes the picture: `applyRecordedEngineGuard` and
`applyRulesGuard` between them expose **six conditions, six regressions, zero positive arms**,
and the guard's output is `{ nodeId, evidenceRefs }` — **a pointer at recorded evidence, never a
word**. *"There is no 'brilliant' in this product to be generous with."*

**This RFC is the commit that ends that.** It creates the conditioning variable, per-learner and
durable, which is precisely the change §5.5 of that dossier says must be pinned **before** it
lands:

> **A rating may select WHAT a learner is shown — which pack, which band, which population —
> and may never appear as an input to WHAT IS SAID about a move they played.**
> **Selection, yes; rendering, never.**

That is **R15**, and it is a refusal rather than a principle because the dossier also supplies
the enforcement shape: it is *"falsifiable in a diff"* — a reachability rule over named modules,
which AC-11 makes a test. Note what changes about the *kind* of guarantee: today the answer is
*"it cannot happen because the field does not exist"*, which needs no discipline and no test.
After this RFC the field exists, so the guarantee has to be earned by a rule that can fail.

### 2. The central problem: the owner wants 1000→2000 and the ladder is ~480 Elo wide

`design/research/maia-band-outcome-transfer.md` (16,660 games, 0 voids, 0 illegal moves,
paired-opening estimator with opening-clustered CIs) settled the prerequisite and set the
constraint in the same run:

- the band moves the **result**, monotonically, at every gap down to 100 points; the same-band
  controls sit at **−3.1** and **−0.7 Elo** and a temperature positive control fires at
  **+468**, so the instrument is neither biased nor blind;
- D324's pre-registered ladder **passes** — and D342 records that passing it settles nothing,
  because *monotone with disjoint CIs* is a test of order and the question was scale;
- the transfer ratio is **0.289 [0.269, 0.309]** over the corpus and **0.400 [0.379, 0.421]** at
  full material. The band is *"an Elo-shaped dial that is not denominated in Elo"*;
- the whole full-material ladder, band 1000 → 2200, is worth **479.8 Elo [454.9, 504.7]**;
- above band 2000 the dial is **inert** — 2000→2400 buys **+28.9 Elo, CI [−16.7, 74.5],
  p = 0.21** (D338);
- and the attenuator is **material, not phase**: the widest gap is worth **−468.9 Elo at ≥21
  pieces**, −145.5 at 11–20, and **−72.4 at ≤10**, where at a 100-band step *both* arms straddle
  parity (D381, corroborated independently by `design/research/maia-endgame-fidelity.md`, which
  found 43 of 45 endgame positions tied between bands 1100 and 1900).

D337 recorded the consequence as a defect: *"D332's 1000→2000 journey does not fit in the
instrument that would measure it… D332 is not refuted; its units are."*

**This RFC's answer, and it is the document's main claim.** The compression is two separable
defects wearing one name, and they have different fixes:

1. **Span.** The opponent pool covers ~480 real Elo at full material. This bounds where the
   learner's rating is *well* resolved — not where it is estimable at all. §7.3 derives an
   estimable window at a stated sensitivity tolerance and gets **~1090 Elo**, of which 480 is
   well-resolved and two ~306-point skirts are resolved at half that. **Three qualifications
   travel with that number and must travel with it everywhere it is repeated.** (a) It rests on
   a logistic-tail assumption marked `[M]`, whose falsifier is §7.3 F-W and whose published value
   is AC-7's simulation output, not this constant. (b) **The window landing at [1006, 2098] is a
   gauge artefact of the 1500-BCS origin, not a finding** — §4.2 shows the identical arithmetic
   gives [906, 1998] at origin 1400 and [1506, 2598] at origin 2000. (c) On the arithmetic as
   derived the owner's journey **does not quite fit**: 1000 BCS sits **6 points below** the
   window's floor. The honest statement is *"the journey is approximately the width of the
   estimable window"*, never *"the journey fits"*.
2. **Anchor.** Nothing in this repo ties band 1400's real strength to any human rating pool. The
   whole 16,660-game study is engine-vs-engine — which is exactly what makes it law-8-clean —
   and the exploration log says so in terms: *"the step from 'band 1800 beats band 1500 by
   70 Elo' to 'a 1500-rated human would too' has no evidence in this repo."* So the scale is
   **internal and offset-unknown**, and §7.4 forbids printing it as FIDE, Lichess or Chess.com
   equivalent, forever, until an experiment measures the offset.

The four options the brief put on the table, weighed:

| Option | Verdict here |
|---|---|
| Rate against the band ladder and publish the compression | **Taken**, with the ratio printed wherever the journey is printed (§7.4) |
| Rate against a wider instrument (`strong_engine` at fixed nodes) | **Deferred, not refused.** `go nodes 50000` is reproducible (D35's remedy in `engine-leverage`) but `policyUsesMaiaBand` correctly excludes `strong_engine`, so it carries **no band and no calibration**. Admitted only after its own rung is measured on the same harness (Open questions Q3). Until then its games are recorded and unrated |
| Rate only where the dial transfers; refuse in reduced endgames | **Taken as a hard precondition** (§5.1). At ≤10 pieces the slope's CI straddles parity, so the *opponent's rating is unidentified* — the update is not weak there, it is **undefined**, and the two have different consequences: a weak signal is admissible with a wide RD, an undefined opponent rating admits no update at any RD |
| Decline a scalar; publish a rating per material regime | **Considered and declined.** Two of the three regimes have no identified opponent rating (n = 48 at 11–20 pieces; CI straddling parity at ≤10), so "three ratings" would be one rating and two fictions. One scale, one refusal, one abstention |

### 3. Why an uncertainty term is not a refinement

D365 argued Glicko-2 on honesty rather than accuracy: RD *"lets it refuse to say anything until
RD narrows — which is the same discipline as the tablebase abstaining outside range, the
explorer abstaining below 100 games, and the `unmeasured` disposition."* Three numbers from this
repo make that decisive rather than tasteful:

1. **The instrument has about five distinguishable rungs on the corpus cut, eight at full
   material.** `out/derived.json` → `thresholds.rung` records
   `resolvableRungsInUsableRange: 4.83` and `resolvableBandStepPoints: 208` `[V]`, re-derived in
   cross-review: **4.83 = 289.6 / 60** (the corpus-wide `[1000, 2400]` Elo span over the
   resolution threshold) and **208 = 60 / 0.289** (the threshold over the corpus transfer ratio).
   **Both are the corpus cut.** The full-material cut this RFC actually rates on gives
   **479.8 / 60 = 8.0 rungs** and **60 / 0.400 = 150 band points**, which is D336's own upper
   reading. The conservative number is quoted here deliberately; the cut is named so it is not
   read as the full-material one. A rating whose printed precision exceeds its instrument's
   resolution lies by precision. Elo's K-factor has no term in which to say so; RD is exactly
   that term.
2. **The session-scale resolution is ±60 Elo, and it was derived before the run, not chosen
   after it.** `out/summary.json` → `derivedThresholds.rungElo = 60.0` — **`summary.json`, not
   `derived.json`**, which carries only the consequences — from *"SE of a learner's own Elo over
   a 30-game session ≈ 0.47/√30 in score ≈ 60 Elo."* That number is an RD. Glicko-2 computes it
   as a first-class output; Elo requires a document to assert it.
3. **Play here is sparse and the opponent is a fixed set.** A learner with three games has an RD
   that says so, and §7.2's abstention rule turns that into a refusal to publish rather than a
   confident wrong number.

**And D344 is the reason the choice is not sufficient on its own:** *"RD narrows on volume, not
on validity, so the uncertainty term does not protect against a mis-specified opponent."* Hence
§4 — the opponent's rating in the update is a **measured** value stored separately, and
`targetElo` never reaches an update.

### Scope boundary — explicitly out

Matchmaking and adaptive difficulty (Open questions Q5); any rating on the campaign map or as a gate; any
cross-learner surface; rating for imported games (`sessionKind: "imported"` projects no attempt
at all, `progress.ts:84-86`); rating for pack sessions (§5.3 explains why the horizon forbids
it); rating any opponent mode other than a calibrated `human_common` band; and the human-anchor
experiment itself, which is a research question this RFC names and does not run.

## Specification

### 1. Vocabulary

- **Rated game** — a run declared rated at creation, satisfying every precondition in §5,
  sealed by an `outcome.reached` event on its single branch.
- **Calibration** — a frozen table mapping a Maia band to a measured rating and deviation on the
  band-calibrated scale, together with the engine identity it was measured against. Identified
  by `calibrationId`.
- **Band-calibrated scale (BCS)** — the internal Elo scale defined in §4.2. **Not FIDE, not
  Lichess, not Chess.com.**
- **Band-equivalent** — the published form: the opponent band the learner holds even against,
  obtained by inverting the calibration (§7.1).
- **Rating period** — the Glicko-2 batching unit (§6.3).

### 2. What the rating reads, and nothing else

| Input | Source | Class |
|---|---|---|
| Game score | `attempts.result` (`win\|loss\|draw`), itself projected from the last `outcome.reached` on the branch path (`apps/server/src/progress.ts:105-128`) | rules fact |
| Opponent rating and RD | §4's calibration table, keyed by the **applied** band | measurement |
| Applied band | `OpponentSelection.engine.eloApplied` with `eloHonored === true` (`SelectionEngineIdentity`, `packages/runtime/src/types.ts:90-101`; `OpponentSelection` at `:102-108`), persisted per move inside the run snapshot | record |
| Engine identity | `SelectionEngineIdentity.{id, version, modelId, containerDigest}`, same struct | record |
| Start material | piece count of the run's start FEN | rules fact |
| Learner side | `run.start.side` | run configuration |

`attempts.result` already ships and is already learner-keyed and indexed
(`CREATE TABLE attempts` at `storage.ts:2667`, `PRIMARY KEY (run_id, branch_id)` at `:2694`,
`attempts_root(learner_id, root_key, ended_at)` at `:2696`, all inside `#addProgressTables`).
**No new outcome plumbing is required and none is specified.**

### 3. The rated-game precondition, as one predicate

A run is **rated-eligible** iff all of the following hold. Each has its refusal number from §8.

1. It was declared rated at creation, before its first ply (§10.1). — R11
2. `sessionKind === "position"`. Not `pack` (R2), not `imported` (R1).
3. `opponentPolicy.mode === "human_common"` and `targetElo` is one of the four ladder rungs in
   §4.1. — R1, R3
4. The engine handshake reported `eloHonored: true` and `appliedTargetElo` resolved to the
   requested rung; `SelectionEngineIdentity.containerDigest` equals the calibration's pinned
   digest. — R1
5. The start position has **≥21 pieces**. — R5
6. Every **server-routed** assistance rung is refused for the whole run (§5.2). — R6
7. The run contains no `run.rewound` event and exactly one branch. — R11
8. It reaches `outcome.reached`. **No adjudication, tablebase included** (§5.4). — R12

Failing 1–6 refuses the run's *creation* as rated. Failing 7 or 8 **voids** the game: the game
is still played, still stored, still browsable; only its rating contribution disappears. Nothing
the learner had is taken away, which is what keeps §2c's *"experimentation without cost"* intact
— see §11.4 for the tension that remains and is named rather than hidden.

### 4. The opponent calibration

#### 4.1 The table — four measured rungs, no interpolation

Read directly off `design/research/maia-band-outcome-transfer.md` §5's full-material ladder (714
games per rung, start positions with ≥21 pieces, all four rungs sharing one band-1400 reference
so nothing is chained and Elo transitivity is never assumed):

```ts
// packages/runtime/src/rating-calibration.ts (new)
export const RATED_OPPONENT_CALIBRATION = Object.freeze({
  id: "maia3-5m-band-ladder-2026-08-16",
  measuredBy: "design/research/maia-band-outcome-transfer.md §5 (full-material ladder)",
  engine: Object.freeze({
    id: "maia-5m",
    name: "Maia3",
    modelId: "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe",
    containerDigest: "1e13597c42d4858b7cfd7cfdae01e297263364b2",
  }),
  origin: Object.freeze({ band: 1400, rating: 1500 }),
  minStartPieceCount: 21,
  rungs: Object.freeze([
    { band: 1000, rating: 1312.4, rd: 24.1, measuredElo: -187.6, halfWidth: 18.9 },
    { band: 1400, rating: 1500.0, rd: 24.1, measuredElo:   -3.4, halfWidth: 24.1 },
    { band: 1800, rating: 1622.6, rd: 24.1, measuredElo: +122.6, halfWidth: 20.6 },
    { band: 2200, rating: 1792.2, rd: 24.1, measuredElo: +292.2, halfWidth: 16.2 },
  ]),
} as const);
```

Every `measuredElo` and `halfWidth` above was re-derived in cross-review against
`design/research/maia-band-outcome-transfer.md` §5's full-material table **and** against
`tools/d333-band-outcome-harness/out/derived.json` → `fullMaterialLadder.rungs` (scores
0.2535 / 0.4951 / 0.6695 / 0.8431 at 714 games each, `spanElo: 479.8`, `transferRatio: 0.3998`)
`[V]`. **All eight match.**

Five properties, each load-bearing:

- **Every rung is `[V]`.** No band between the rungs is offered, because no band between the
  rungs was measured against this reference. Open questions Q4 names the cheap experiment that would add
  three more.
- **Band 1400 is the origin *by definition*, and the measured −3.4 ± 24.1 is the control that
  validates it**, not a value to subtract. It costs ≈3.4 BCS of internal inconsistency — the
  reference *engine* sits at 1503.4 on the scale its own reference defines — which is inside the
  origin's own half-width and is disclosed rather than corrected, because correcting it would
  make 1500 no longer Glicko-2's default and buy nothing.
- **`rd` is the origin's 95% half-width, 24.1, applied uniformly.** *Corrected by cross-review:
  the draft carried `rd: 20.6` on band 2200, which matched neither that rung's own half-width
  (16.2) nor the stated floor (24.1) — it was band 1800's number, transposed.* The rule is now
  one sentence with no exception: **every rung's deviation is `max(halfWidth, 24.1) = 24.1`**,
  so no rung is ever asserted to be known more precisely than the reference it is measured
  against. Using a 95% half-width as one deviation is itself conservative by ≈1.96× and damps
  every update. The direction is deliberate: this product errs toward under-confidence. AC-3
  asserts `rd` as well as `rating`.
- **The domain stops at band 2200.** Band 2400 is inside the `[1000, 2400]` *distinguishability*
  range and outside the *difficulty* range — D338 measured 2000→2400 at +28.9 Elo with a CI
  containing zero. A rung whose strength is not distinguishable from its neighbour's cannot be
  an opponent in a rating. (*That range is the finding of the **research question R10**, which
  shares a label with this RFC's **refusal R10** and nothing else; the research one is meant
  wherever `[1000, 2400]` appears below.*)
- **The engine identity is part of the calibration.** If the Maia image, model or container
  digest changes, the calibration is void: open rated games are voided with
  `void_reason: 'engine_changed'`, and a new `calibrationId` must be measured before rating
  resumes. This is the *record* obligation of the engine-request-contract law applied to a
  measurement rather than to a request.

#### 4.2 The band-calibrated scale, and the honest thing to say about its origin

BCS is a standard logistic Elo scale (400-point base, the same transform the dossier used to
convert every score). Its **origin is a labelling convention**: band 1400 ≡ 1500 BCS.

**The reason for 1500 is Glicko-2's own default initial rating** (§6.2), so an unrated learner's
prior sits exactly on the measured reference rung and nobody starts displaced. It is not chosen
to make any number look good, and it is worth being explicit about that because a *consequence*
of it is flattering: §7.3's estimable window lands at **[1006, 2098]**, so the owner's
*"go from elo 1000-2000"* happens to be expressible almost exactly in the units the product
prints. **That is a gauge artefact, not a finding.** At origin 1400 the same window would be
[906, 1998]; at origin 2000 it would be [1506, 2598]. The arithmetic is identical in all three.
**Two guards keep that sentence from decaying into a result.** First, it is restated at every
site the window is repeated — §2's option table, §7.3, and §12's proposed ledger row — because a
caveat stated once and dropped downstream is how a gauge artefact becomes a finding. Second, the
window does not in fact contain the journey: **1000 BCS is 6 points below the floor**, which is
smaller than the rounding on the constants it is derived from, and is recorded here so nobody
later reads *"the journey fits"* out of a number that was never a fit.

**It has no external validity whatsoever.** Nothing measured here connects band 1400 to any
human rating pool, and the whole study is engine-vs-engine — the exploration log states it
directly: *"the step from 'band 1800 beats band 1500 by 70 Elo' to 'a 1500-rated human would
too' has no evidence in this repo."*

**This disclosure is normative, not commentary:** every surface that prints a BCS number prints
the scale name beside it (§7.4). An origin that is not disclosed at the point of printing is the
manufactured-FIDE-estimate failure
(`design/research/quickpass-wintrChess-encroissant-chessmonitor.md`) with extra steps.

### 5. The preconditions that do real work

#### 5.1 Material — ≥21 pieces at the start position

At ≤10 pieces the band buys **−72.4 Elo at the widest gap and a CI straddling parity at a
100-band step**, i.e. **≈0.07 transfer**. The calibration table is a full-material measurement;
applying it to a low-material game would assign the opponent a rating the evidence says it does
not have there.

Framed correctly, this is not a hedge and not a difficulty judgement: **below the measured
regime the opponent's rating is unidentified, so the update is undefined.** *Cross-review
checked that this is stated as undefined rather than weak everywhere it appears (§2's option
table, here, and R5), because the two have different consequences: a weak but identified
opponent rating is admissible with a wider RD and Glicko-2 would handle it correctly; an
unidentified one admits **no** update at any RD, and no amount of volume repairs it.* The
distinction is what makes R5 a refusal rather than a weighting.

The regime is fixed by the *start* position's piece count, which is a fact of the encounter
known before the first move — **and it is the same conditioning the dossier's own material cut
used**, which is what makes the precondition legitimate rather than a convenient proxy: §7 of
`maia-band-outcome-transfer.md` cuts *"the identical games by start-position piece count"*, so
`≥21 pieces` names a property of a whole game, not of a position within it. A rated game that
simplifies into an endgame therefore stays rated, and that is not a loophole — its opponent
rating was identified for the game it was, by the cut that measured it. 11–20 pieces is refused
too, on n = 48 (Open questions Q2).

**The independent corroboration matters more than either measurement alone.**
`design/research/maia-endgame-fidelity.md` found the band **blind** in endgames — sampled
result-preservation **tied on 43 of 45 tablebase-critical positions between bands 1100 and
1900**, with a policy-head response of a mean 4.3 pp that is too small to change the sampled
move `[V]`. That is a different instrument (per-position probes against tablebase ground truth)
answering a different question, and it agrees with the game-level transfer collapse to ≈0.07.
Neither study was designed to test the other (D381). **Two independent instruments agreeing is
why R5 is a hard precondition rather than a threshold to tune.**

#### 5.2 Assistance — server-refused for the whole run, and honest about the half it cannot reach

If assistance is not held fixed, the rating measures the loadout rather than the learner. This is
*partly* enforceable today, and both the enforcement point and its boundary matter:

**`AssistanceConfig` lives in the browser** — `` `tabiya.assistance.v1.${kind}` `` across six
profiles (`pack, position, imported, match, stream, onramp`;
`apps/web/src/lib/assistance-preference.ts:4`, `:15`) — and the server never receives it. So a
rated game's assistance precondition **cannot be verified from the client's declaration** (D389),
and must be enforced by refusal at the server.

The mechanism ships. `ASSISTANCE_WITHHELD` is a named refusal
(`apps/server/src/rest.ts:1114` for `humanSplit`, `:1133` for `corpus`, both on `locked_off`) and
the client already renders an honest disabled control with a visible `class="honest"` reason
(`DrillScreen.svelte:770-771`, `:775-776`). **A rated run refuses every server-routed assistance
route for its whole lifetime**, keyed on the `rated_games` row.

**What R6 therefore actually enforces, stated because the draft implied more than it can
deliver.** `AssistanceConfig` has **nine** non-version axes
(`packages/runtime/src/assistance.ts`). Exactly **three** of them cross the wire and can be
refused: `humanSplit`, `corpus`, and `voice` (with `/speech` and `/reasoning-review` behind the
same disclosure gate). The other six — `boardLighting`, `arrows`, `spoken`, `ambient`, `markers`,
`guided` — are **rendered in the browser from data the client already holds**, and refusing them
server-side is not possible, not detectable, and not claimed here. Neither is anything outside
the tab: a second window, an engine on another device, or a person in the room.

So R6's honest content is: **a rated game is unassisted to the exact limit of what the server can
refuse — the three evidence rungs that would otherwise deliver a measurement into the run — and
makes no claim beyond that limit.** §7.4's disclosure 5 says so at the point of printing, which is
the same posture `docs/live-sessions.md` already takes about self-cheating. **A rating that
claimed "unassisted" without that qualifier would be the manufactured claim this RFC exists to
avoid**, and it is the reason D389 is ledgered as generalising past this RFC: *every* claim about
how a run was played inherits the same ceiling.

**`permittedAssistance` is not modified.** The honesty gate keeps its inputs exactly as
`coaching-versus-cheating-and-the-band-curve.md` §2f documents them — *"the honesty **ceiling**:
which sources may speak, given role and disclosure state"* — noting that the declared
`AssistanceContext` carries three fields (`sessionKind`, `deliveryOpen`, `role`) of which the
body turns on one boolean (`assistance.ts:21-28`). The rated refusal is a route-layer ceiling
*outside* the gate — which also keeps this RFC clear of `teacher-surface`'s requested ownership
pin on that function (§11.1). `06` §3 law 1 holds: nothing here changes what may honestly be
shown or when.

#### 5.3 Why pack sessions cannot be rated

A pack encounter ends at `authoredBoundary.plyHorizon`, not at checkmate. *Count re-derived at
cross-review: **50** documents under `content/` declare a `plyHorizon`, all of them in
`content/drafts/` (152 `.json` drafts; `content/packs/` is empty), **median 11**. The draft's
"47 of 89 … median 10" is not reproducible against the tree as it now stands — the corpus moved,
which is why the argument below turns on the horizon **existing at all**, not on how many carry
one.* A truncated game has no rules-terminal result, and producing one would require assessing the
final position — which is an engine or authored verdict, i.e. the exact thing §1 forbids. **The
horizon is the reason packs are unrated**, and it is a principled reason rather than a scoping
convenience: it would hold at one pack or at a thousand.

This has a consequence the campaign must hear: `06` §5's boss encounters are packs, and the
suppressed-boss configuration is otherwise the ideal rated object —
`coaching-versus-cheating-and-the-band-curve.md` §1 (`:55`) calls it *"a complete specification of
'2000-Elo skills required'"*, and its §4d tests the owner proposal against it. Either a boss is
played out with no horizon, or bosses are unrated.
Open questions Q1 puts that to the owner rather than deciding it.

#### 5.4 No adjudication at all — and why the tablebase is not the exception the draft made it

**The draft permitted one adjudication and cross-review withdrew it.** It read: *"A rated game
whose position enters the Syzygy range may be sealed by a **tablebase-exact** result via
`LichessTablebaseSource` … A tablebase result is a rules fact of the same class as checkmate —
the endgame boss already depends on that exact property (`perfect_tablebase`)."* Both halves of
that argument fail, and the failure is caught by this RFC's own §1 test rather than by taste.

1. **A tablebase result is not the same class as checkmate.** Checkmate is a fact about the
   position on the board *now*. A tablebase result is a fact about the position **under optimal
   play by both sides from here** — a counterfactual. Sealing a rated game with it credits the
   learner with a conversion they have not played. §1's test is *"a rating may move only on facts
   `terminalOutcome` produces"*, and `terminalOutcome` produces exactly four: `isCheckmate`,
   `isEnd` without checkmate, `halfmoves >= 100`, `repetitionCount >= 3`. A tablebase probe is
   none of them. The draft named the correct test and then made an exception to it in the next
   section.
2. **The `perfect_tablebase` precedent is a category error.** `perfect_tablebase` is an
   **opponent mode** — a rule for choosing the opponent's move — not a rule for ending a game.
   Rated games are `human_common` by §3 precondition 3, so the precedent is not merely weak here,
   it is about a different mode of a different mechanism.
3. **The size of the credit is measured, not hypothetical.**
   `design/research/maia-endgame-fidelity.md` reports Maia preserving the result on
   **88.1% / 88.9% / 91.9%** of tablebase-critical endgame positions by band, and **all 84 errors
   were `win→draw`** `[V]`. So sealing a tablebase-won position as a win would over-credit the
   learner's side against what actually gets played, at a rate this repo has already measured to
   be roughly one game in ten — and it would do so **inside the ≤10-piece regime R5 refuses to
   rate at all**, which is the draft's two rules pointing opposite ways at the same board.

**So: `outcome.reached` is the only seal.** `terminal_reason` records which of the four rules
terminations fired and nothing else; `tablebase_exact` is removed from §10.1's enum. A rated game
that reaches a theoretically-decided endgame is played out or it is not sealed.

**Engine evaluation may never seal a rated game either** (R12, now covering both). The cost is
named: some rated games will run long or end in a draw the tablebase would have called a win.
That is the correct cost — the alternative is a rating that moves on a counterfactual. Whether
the owner wants a tablebase seal *as a deliberate exception, disclosed as an adjudication rather
than as a result*, is Open question 9.

### 6. The rating system

Glicko-2, reproduced from Glickman's specification
(<http://www.glicko.net/glicko/glicko2.pdf>) `[P]`; it is Lichess's own system
(<https://lichess.org/page/rating-systems>) `[P]`.

#### 6.1 State

```ts
export interface LearnerRating {
  readonly calibrationId: string;
  readonly rating: number;      // BCS
  readonly rd: number;          // BCS
  readonly volatility: number;  // σ
  readonly ratedGames: number;
  readonly voidedGames: number;
  readonly abandonedGames: number;
  readonly periodStartedAt: string;
  readonly updatedAt: string;
}
```

#### 6.2 Constants, each with its reason

| Constant | Value | Why this value |
|---|---|---|
| Initial rating | **1500 BCS** (= band 1400) | The calibration origin; also Glicko-2's own default |
| Initial RD | **350** | Glicko-2's default for an unrated player; also Lichess's provisional deviation `[P]` |
| Initial σ | **0.06** | Glickman's worked default `[P]` |
| τ (system constant) | **0.5** | Glickman gives *"reasonable choices are between 0.3 and 1.2"*, smaller where volatility should move less `[P]`. With four rungs and sparse play, σ is estimated from very little; a small τ constrains it |
| Scale factor | **173.7178** | Glicko-2's fixed conversion between the 400-base scale and its internal units `[P]` |
| Publication threshold | **RD ≤ 60** | Not chosen: it is the dossier's own `derivedThresholds.rungElo = 60.0` (`out/summary.json`), the SE of a learner's Elo over a 30-game session. Above it the product cannot tell a rung from its neighbour, so it does not print a point estimate (§7.2). Note the cost this imposes and §7.3 quantifies: at the bracket's edge `SE(D) ≈ 491/√n`, so ≈67 games are needed to clear it against an extreme rung, against ≈34 at parity — AC-7 must report it |

**σ is stored and never published.** A second number with no validated meaning on this
instrument would be a dashboard entry, not a measurement.

#### 6.3 Rating periods

Glickman recommends 10–15 games per period. Play here is sparse, so the period closes on
**whichever comes first: 12 sealed rated games, or 7 days with at least one**. A period with zero
games still applies the pre-period step, which widens RD toward 350 over inactivity — the system
saying, correctly, that it no longer knows.

#### 6.4 The update

Standard Glicko-2 over the period's sealed games, with `sⱼ ∈ {1, 0.5, 0}` from
`attempts.result` mapped learner-side, and `(rⱼ, RDⱼ)` from §4.1 keyed on **the applied band**:

```
μ  = (r − 1500) / 173.7178          φ  = RD / 173.7178
g(φⱼ) = 1 / √(1 + 3φⱼ² / π²)
E(μ, μⱼ, φⱼ) = 1 / (1 + exp(−g(φⱼ)(μ − μⱼ)))
v  = [ Σⱼ g(φⱼ)² E (1 − E) ]⁻¹
Δ  = v · Σⱼ g(φⱼ)(sⱼ − E)
σ' = the volatility iteration of Glickman §5.1 step 5 with τ = 0.5
φ* = √(φ² + σ'²)          φ' = 1 / √(1/φ*² + 1/v)
μ' = μ + φ'² · Σⱼ g(φⱼ)(sⱼ − E)
r' = 173.7178 μ' + 1500   RD' = 173.7178 φ'      RD' is clamped to ≤ 350
```

**The owner's two mechanisms map onto this exactly, as D365 said they would:** *"configurable in
the profile"* is a self-declared seed — the learner picks a ladder rung and the rating starts at
that rung's calibrated rating with RD 350 — and *"readjust when opponents win/lose against
bots"* is this update step. Neither needed inventing.

**A period whose games all share one band is still a valid update** — the opponent set need not
vary — but §7.2's saturation row fires much sooner in that case, which is the honest
consequence and not a bug.

### 7. Publication

#### 7.1 Two representations, one published

Internal state is BCS. The published form is the **band-equivalent**: the opponent band the
learner holds even against, obtained by inverting the calibration over `[1000, 2200]`,
together with the band-equivalent of `rating ± 2·RD`.

**The inverse is piecewise-linear between the four measured rungs, and that is not a
contradiction of §4.1.** §4.1 refuses to *offer* an unmeasured band as an opponent, because an
unmeasured opponent has no rating. Interpolating the *display* axis asserts nothing about any
opponent — it converts a continuous learner rating into the units the learner reads. R3 forbids
the first and permits the second; the acceptance test for R3 checks that no band off the ladder
can ever reach an opponent policy.

Why the band-equivalent is the published one: it is a statement about what the learner can
defeat, computed from their own results, on the only axis this repo has measured. It is not the
opponent's label wearing the learner's name — D337's exit (a) was *"restate the journey as the
OPPONENT's band"*, i.e. give up the learner number, and this is not that. The learner and the
opponent become commensurable on one measured axis, which is what closes the gap
`coaching-versus-cheating-and-the-band-curve.md` §3 identified and could not close.

**The known cost, stated so it cannot be discovered later.** Band-equivalents inflate apparent
movement by the inverse transfer ratio: a real 40-Elo gain reads as 100 band points at full
material. The published copy therefore never calls it a rating gain, and every printing of an
interval or a movement carries the ratio (§7.4). The interval carries the same inflation, which
is the mitigating half — a ±60 BCS deviation reads as ±150 band points, and a number whose error
bar is that wide does not read as precision.

Precedent for publishing a band rather than a value: *Football Manager* shows unscouted
attributes as bands rather than values
(`design/research/fun-mechanics-outside-roguelikes.md` F18) `[P]`.

#### 7.2 Abstention

| Condition | Published |
|---|---|
| `ratedGames === 0` | Nothing. Not "unrated", not "1500" — the surface does not exist yet |
| `RD > 60` | **Provisional**: the interval only, with no point estimate, and the game count |
| `RD ≤ 60` and inside the bracket (§7.3) | Point estimate + interval, both as band-equivalents |
| `RD ≤ 60` and outside the bracket | A **bound** only: *"above band 2200"* / *"below band 1000"* |
| Score saturated at 1.0 or 0.0 against the extreme rung over the period | A **bound** only, regardless of RD |
| `abandonedGames / (ratedGames + abandonedGames) > 0.25` | **Provisional**: interval only, no point estimate, regardless of RD — plus both counts. **Added by cross-review; see §11.3** |

The first two rows are the discipline D365 named — the same shape as the tablebase abstaining
outside range and the explorer abstaining below 100 games. **The last row is that same
discipline applied to a bias the system cannot correct** — it converts §11.3's disclosure into a
refusal, which is what the rest of this RFC does with everything it cannot measure.

#### 7.3 The bracket, derived — and the two places the derivation does not hold up

The dossier's resolution threshold is 60 Elo (§3, `summary.json` → `derivedThresholds.rungElo`).
On the logistic, `dE/dD = ln(10)/400 · E(1−E)`, which is maximal at parity and decays as the gap
grows. Requiring that sensitivity to stay within a **factor of two** of its parity value gives
`E(1−E) ≥ 0.125`, i.e. `E ≤ (1 + √0.5)/2 = 0.85355`, i.e. a gap of

```
D = 400 · log10(0.85355 / 0.14645) = 400 · log10(5.82843) = 306.2 Elo
```

So the **bracket** is the pool span plus a 306-point skirt at each end:
**[1312.4 − 306.2, 1792.2 + 306.2] = [1006, 2098] BCS** — a window **1092 points wide**, of
which the 480-point interior is well-resolved and the two skirts are resolved at half that.
**The arithmetic re-derives exactly** (cross-review recomputed every step).

**But the arithmetic being right is the least interesting thing about it.** Cross-review found
two defects in the derivation, one presentational and one fatal-as-written, plus three
qualifications the draft already had and one it did not.

**Defect 1 — the criterion the prose states is not the criterion the arithmetic computes.**
The draft's sentence was *"a rating estimate stays informative while a 60-Elo change in true
strength still moves the expected score by something comparable to a session's sampling noise"*.
That is a **signal-to-noise** criterion. What is then computed is **raw sensitivity**, `dE/dD`,
with no noise term at all — and the 60-Elo threshold, having been named, is **not an input to the
306 at any point**. The two are not the same test, because the score's own sampling noise
*shrinks* toward the tails as well: the SE of a rating estimated from `n` games is
`SE(D) = √(E(1−E)/n) / (c·E(1−E)) = 1/(c·√(n·E(1−E)))` with `c = ln(10)/400`, so a factor-two
degradation in **SE(D)** — which is what RD is — needs `E(1−E) ≥ 0.0625`, i.e. `E ≤ 0.93301`,
i.e. a skirt of

```
D = 400 · log10(0.93301 / 0.06699) = 400 · log10(13.927) = 457.5 Elo
```

and a window of **[855, 2250], 1395 points**. **The published constant stays 306 and the window
stays [1006, 2098]** — the narrower of the two is the one to publish, and the sensitivity form is
the one whose tolerance is easiest to state. What is corrected is the prose: **this is a
sensitivity tolerance, chosen, not a noise-matched threshold, derived.** The 60-Elo number does
one job here and it is a different one — it sets the RD ≤ 60 publication threshold in §7.2 — and
the draft's sentence invited it to be read as the window's source.

**Defect 2 — falsifier F-W, as drafted, could not falsify the assumption it was attached to.**
The draft named the `[M]` step as *"the logistic holds out to ±306 Elo against a fixed engine
opponent"*, then proposed to test it by simulating learners *"under the shipped Glicko-2
implementation"*. A simulation must generate outcomes from **some** response model; if that model
is the logistic, F-W tests the estimator's arithmetic under the very assumption in question and
returns the bracket it was given. **It would have passed, and its passing would have meant
nothing.** F-W is rewritten below, and AC-7 with it.

**And the qualifications, in order of importance.**

1. **It is a modelling claim, not a measurement `[M]`.** It assumes a logistic response holds out
   to ±306 Elo against a fixed engine opponent — an assumption the four measured rungs, all
   inside a 480-point span, cannot constrain in either tail. Real engine opponents have
   non-logistic tails, and a learner far above band 2200 may simply score 1.000 forever. That is
   why §7.2's saturation row is a hard rule that overrides RD: **saturation publishes a bound,
   always.** The window is the *optimistic* bound on what the instrument can express, and the
   product must behave as if the pool span is the realistic one until AC-7 says otherwise.
2. **The window is gauge-dependent and does not contain the journey.** §4.2: [1006, 2098] is an
   artefact of the 1500-BCS origin — [906, 1998] at origin 1400, [1506, 2598] at origin 2000 —
   and **1000 BCS is 6 points below the floor**. *"The journey is approximately the width of the
   window"* is sayable; *"the journey fits"* is not.
3. **It refines D337 rather than contradicting it.** D337 computed coverage as *pool span ÷
   journey* and got 0.207–0.400 against a required 0.714. That is the correct number for the
   question it asked. This is a different question — *estimable window ÷ journey*, which comes
   out at **1.09** — and it needs an assumption D337's number did not. Both belong in the ledger;
   §12 proposes the row.
4. **It does not rescue the anchor.** A 1092-point window whose zero is arbitrary is still
   arbitrary. §7.4 is not weakened by §7.3, and neither is R7.
5. **Draws are unmodelled, in the conservative direction.** The `E(1−E)` variance term treats a
   game as Bernoulli. With draws the score's variance is strictly lower, so RD is over-stated and
   the skirt under-stated. Recorded rather than corrected: an error that makes the instrument
   claim less than it can is the acceptable direction, and F-W's draw-inflated arm measures it.

**Falsifier F-W, rewritten.** Simulate learners at true BCS 950, 1050, …, 2150 playing against
the four rungs, and credit the estimator only where the recovered rating's 95% interval contains
the truth on ≥90% of replicates. Three things the draft's version lacked are **required**:

- **More than one response model, and the published bracket is the minimum across them.** At
  minimum: (a) the logistic — the null the constant was derived under; (b) a heavier-shouldered
  alternative (Thurstone/normal), which reaches saturation sooner in the tails; (c) a
  **saturating** family with a floor draw rate, which is the failure mode actually feared —
  *"a learner far above band 2200 may simply score 1.000 forever"*. A bracket that survives only
  under (a) is a bracket that was assumed, not tested.
- **The shipped period structure, not a single 200-game batch.** §6.3 closes a period at 12 games
  or 7 days and re-widens RD toward 350 between periods. A coverage result computed over one
  200-game batch does not transfer to a learner who plays twelve games a month, and the
  publication rule (RD ≤ 60) binds hardest exactly where the bracket is widest: at the skirt
  edge, `SE(D) = 491/√n`, so **RD ≤ 60 needs ≈67 games** against the extreme rung, against ≈34 at
  parity. F-W must report, per true rating, both interval coverage **and** how many periods pass
  before anything is publishable at all.
- **A stated null.** The simulation is credited against ≥90% coverage; below that at any true
  rating inside [1006, 2098], the bracket contracts to the largest sub-interval that clears it.

**The bracket is whatever that simulation says it is.** If it comes back narrower than
[1006, 2098] — and under (c) it will — the constant moves and the copy moves with it. This is an
acceptance criterion (§AC-7), not a future study. **Until AC-7 runs, the pool span
[1312.4, 1792.2] is the operative bracket** and the wider window is not printed anywhere.

#### 7.4 The disclosures, normative

Every surface that prints the rating prints, in the same view:

1. the scale name and that it is **not** FIDE, Lichess or Chess.com;
2. the interval, never a bare point estimate;
3. the game count and the **abandonment count** (§11.3);
4. wherever a *journey* or *movement* is printed, the transfer ratio beside it: the band ladder
   `[1000, 2200]` is worth **≈480 real Elo at full material** and **≈347 over the corpus as
   authored**, i.e. **a 100-band step is ≈40 real Elo at full material, not 100**;
5. that "unassisted" means **every assistance the server can refuse**, and that six of the nine
   assistance axes are browser-rendered and therefore neither refused nor detected (§5.2, D389).

*Correction by cross-review on obligation 4: the draft printed **≈290**, which is the wrong
quantity for the span it is attached to.* 289.6 Elo is the corpus-wide value of `[1000, **2400**]`
(`derived.json` → `thresholds.coverage.observedFullRangeElo`); the corpus-wide value of
`[1000, **2200**]` — the ladder this RFC actually rates against — is `ladderSpan.eloGain = 346.8`
`[V]`. A normative disclosure printing a 16% understatement of its own instrument's span is the
disclosure failing at its one job.

Copy is not specified here beyond these five obligations, which are testable (§AC-6) — **and is
bounded by R16, which is where the copy itself becomes a law-8 surface.**

### 8. Refusals

Each is named, each has a reason that is a measurement or a law, and each is a test in §AC.

| # | Refused | Because |
|---|---|---|
| **R1** | A rating from an **uncalibrated opponent** — `theory_strict`, `practical_resistance`, `strong_engine`, any band off §4.1's four rungs, any run where `eloHonored !== true`, any engine identity other than the pinned digest | An update needs the opponent's rating. Where there is none, there is no update — only a number |
| **R2** | A rating that moves on **authored outcomes** — `ObjectiveState`, `attempts.verdict`, `successConditions`, `TempoVerdict`, `lineMembership`, `prediction.recorded` | A pack's declared success is a compiled author judgement (`pack-orchestrator.ts`), not a game result. Feeding it in makes the rating a function of an author's opinion |
| **R3** | **Cross-band comparison the transfer ratio does not support** — offering, displaying or distinguishing band steps finer than a measured rung; treating `targetElo` as the opponent's rating anywhere | D336 (the smallest resolvable step is ~150–208 band points) and D344 (*"`targetElo` must never be passed to a rating update directly"*) |
| **R4** | Any **per-move contribution** — accuracy, per-move rating delta, "performance rating for this move", a move-quality axis of any kind | A move verdict wearing arithmetic. ADR-0005 / law 8, and the named anti-pattern in `AGENTS.md` |
| **R5** | A rating in **reduced endgames** — <21 pieces at the start position | Transfer ≈0.07 at ≤10 pieces with CIs straddling parity; n = 48 at 11–20; and independently, 43 of 45 endgame positions **tied** between bands 1100 and 1900 (`maia-endgame-fidelity.md`, D381). The opponent's rating there is **unidentified, not merely imprecise** — so the update is *undefined*, which no widening of RD repairs |
| **R6** | **Pooling server-assisted with server-unassisted play** | Otherwise the rating measures the loadout. Assistance is browser-side (D389), so this is enforced by server refusal of the three wire-crossing rungs (§5.2), never by trusting a declaration — **and it does not reach the six browser-rendered axes or anything outside the tab, which §7.4's fifth disclosure states rather than papers over** |
| **R7** | Publishing the number as an **external-scale equivalent** (FIDE / Lichess / Chess.com), or converting to one | The anchor is unmeasured; the whole calibration is engine-vs-engine |
| **R8** | Publishing a **point estimate outside the bracket or at score saturation** | §7.3. Report a bound instead |
| **R9** | Making the rating **purchasable, sellable, or a gate on content** | ADR-0007. D334's surviving distinction: winning may unlock convenience and variety, **never content** |
| **R10** | **This rating — the number, its interval, its band-equivalent, and any ordering derived from them — on any cross-learner surface.** Not a leaderboard, not a percentile, not a cohort mean, not a "you are ahead of N learners", not a sort key | Barth: *"For most players, the only thing a global leaderboard manages to tell you is that you suck (and not even by how much)"* and *"Getting your name at the top of the leaderboards is a fantastic incentive for cheating"* (`fun-mechanics-outside-roguelikes.md:769-771`) `[P]`; and the standing constraint from that dossier — the population is the learner's own history, never other learners. **Restated by cross-review to name the object rather than the shape** — see below |
| **R11** | Rating a game containing a **rewind or fork**, rating more than one branch of a run, or rating the same run twice | `attempts` PK is `(run_id, branch_id)`, so a rewound run yields several results. Rating them would reward rewinding until you win |
| **R12** | **Any adjudication of an unfinished game — engine evaluation *and* tablebase probe** | Only `terminalOutcome` may seal. **Widened by cross-review:** the draft admitted a tablebase-exact seal; a tablebase result is a fact about the position *under optimal play*, not about the game, so it fails §1's own test, and Maia converts only 88.1–91.9% of won endgames in practice (§5.4). Owner may reopen it as a *disclosed adjudication* — Open question 9 |
| **R13** | Maia's own **expected score** `0.5 + cp/2000` as a rating input | `maia-wdl-versus-human-outcome.md` §9.5: the value head's band response carries **no information** about the band's outcome shift (Pearson 0.021–0.044, sign agreement 47.2–52.0%). Retained as a diagnostic only (§AC-8) |
| **R14** | Feeding the rating into **`/progress/recommendations`**, milestones, or scheduling | That would make it a weakness model driving content selection — a different product, and out of scope. Open questions Q5. R14 is also what keeps all three of `docs/return-and-progression.md`'s no-rating sentences true verbatim (§11.2) |
| **R15** | **The rating as an input to anything the product SAYS about a move, a position, or a run.** Named concretely: `learnerRating` (and every projection of it — `rating`, `rd`, band-equivalent, bracket position, `seed_band`, `period_no`) may not reach `apps/server/src/guard.ts`, `guard-conditions.ts`, `packages/runtime/src/voice.ts`, `outcome-presentation.ts`, `feedback.ts`, `objective.ts`, any `feedbackClaims` assertion argument, any voice/speech/reasoning-review packet, any `evalSwingCp` or guard threshold, any `corpusPopulation()` argument, or any pack-selection predicate that alters *what is said* rather than *what is offered* | **D395 — the blocker this cross-review was opened on.** `band-flattery-and-buried-value.md` §1/§3/§5.5: band-tuned flattery is unreachable today **only** because `learners` has no rating column and the guard has *"six conditions, six regressions, zero positive arms"* emitting *"a pointer at recorded evidence, never a word"*. **This RFC creates the conditioning variable**, so *"it cannot happen because the field does not exist"* stops being an argument on the day it lands. The invariant, in the dossier's own words: ***a rating may select WHAT a learner is shown — which pack, which band, which population — and may never appear as an input to WHAT IS SAID about a move they played. Selection, yes; rendering, never.*** Enforced as a reachability test, not a principle: **AC-11** |
| **R16** | **Evaluative, congratulatory or praise copy on any rating surface**, and routing any rating surface's text through the voice/LLM layer at all | **D393's fix does not reach here.** `BANNED_JUDGEMENTS` grew 19→30 words at `3e6fe2e` to cover the praise register — but it is enforced by `voiceCheck`'s **containment test over LLM output only**, and `KEY_POINT_JUDGEMENTS` applies only to `ReasoningKeyPoint.phrases` and only when *every* word in a phrase is a listed one. **Authored prose has no vocabulary gate at all** (`band-flattery-and-buried-value.md` §5.2: `feedbackClaims[].text`, `objective.summary`, `PlanClass.description` — none). A rating surface's copy is authored, so it would be **the one new law-8 surface this RFC creates that no shipped guard covers** — the route-around, not the hole. Closed two ways: the rating surface emits only the §7.4 disclosure sentences and the numbers, from a frozen set; and **the denylist is run over that frozen set anyway** even though it is not LLM output. **AC-12** |

#### 8a. R15's mechanism, because a refusal without one is a wish

The dossier that raised D395 also supplied the enforcement shape, and it is the reason R15 is
written as a refusal rather than as a design principle: the invariant is *"enforceable as a code
rule … and it is **falsifiable in a diff**, which the current answer — 'it cannot happen because
the field does not exist' — will stop being."*

Three mechanisms, in the order they bind:

1. **Direction of dependency, enforced statically.** The rating is a **read model**. Nothing in
   `packages/runtime`'s feedback, guard, objective, voice or outcome-presentation modules may
   import the rating module, and the rating module imports none of them. AC-11 asserts this over
   the module graph, so the violation is a build failure rather than a review finding.
2. **The rating never enters a run.** `rated_games` and `learner_ratings` are written by the
   projector on `RunService.#project` and read by `GET /rating` and `GET /rating/history` only.
   No run event carries it, no snapshot carries it (§9.3 — the run schema is untouched, which is
   this property expressed as a register claim), and no engine request carries it: the opponent
   band comes from the pack or the `POST /rated-games` body, never from the learner's rating.
   **This is why "no run schema lane" is a safety claim and not only a scoping one.**
3. **`/capabilities` records the refusal**, so reintroducing it by silence is not available
   (§10.4).

**What R15 does not refuse, stated so the boundary is usable.** Selecting *which* rung
`POST /rated-games` offers by default, ordering a catalogue, choosing which pack to suggest, or
picking a corpus rating bucket are all **selection** and all permitted in principle — R14
separately declines to build any of them in v1, and Open question 5 keeps that a decision rather
than a default. The line is not *"the rating must never be read"*; it is *"the rating must never
be an argument to a sentence about a move."*

#### 8b. R10, restated to survive the ruling that is already pending

`design/research/league-as-return-loop.md` §C1 hits R10 head-on and escalates it as owner-facing:
*"A league standing is a ranked table of learners, and no league exists without one."* That
dossier declines to route around the refusal and instead offers the distinction it thinks is
rulable — R10 refuses ranking learners by **a number the product manufactured about them**, while
a league table ranks by **what happened**, which is the same object class the owner ruled
admissible as `corpus_observed`. Its recommendation is explicit: *"R10 should be reworded to say
**what** it refuses … rather than **what shape** it refuses — as written it also forbids a record
of game results that nothing in its rationale objects to."*

**Cross-review adopts that correction, because it is right on this RFC's own terms and because
R10 as drafted was making a ruling that is not this RFC's to make.** The table row above now
names the object — *this rating, its interval, its band-equivalent, and any ordering derived from
them* — and R10 is therefore stable under either outcome:

- **If the owner rules the distinction load-bearing**, a league standing built from `attempts`
  results is untouched by R10, and nothing here has to be reopened. What R10 still refuses is
  putting the **rating** in that table or using it as a seed, a section boundary or a sort key —
  which is also what keeps `docs/return-and-progression.md:48-49` true (§11.2).
- **If the owner rules it a loophole**, R10 is *narrower* than the ruling and the ruling simply
  extends past it. Nothing here contradicts a stricter answer.

**What R10 must not be read as doing is deciding the league question by drafting.** The
dossier's second observation is the one that would have made that mistake expensive: the 4545
league's own history records cheating investigations affecting final standings in three seasons,
against a product that already declines to police self-cheating — so the argument against a table
is real, it is empirical, and it deserves an owner ruling rather than a refusal inherited from an
RFC about a different object. Recorded as Open question 10.

### 9. Register claims

#### 9.1 Migration — a position, not a number

**A migration is required and this RFC says so loudly.** A rating is persistent per-learner state
and there is nowhere to put it: `learners` carries only `{id, handle, displayName, createdAt}`
plus auth columns, there is **no learner profile record of any kind**, and `progress_meta` has no
`learner_id` column. The nearest precedent for a small learner-keyed table is
`learner_position_stats` (`storage.ts:2729-2734`).

**Claim: the next position in the landing order, taken as `STORAGE_VERSION + 1` at landing.**
Never an integer. The loop is `if (migration.version <= version) continue`
(`storage.ts:2351`), so a claimed-but-unlanded number is a hole the next migration seals shut.

**The moving-constant hazard, demonstrated on this document.** The draft recorded
*"`STORAGE_VERSION` is **22** at HEAD"*. At cross-review it is **23**
(`apps/server/src/storage.ts:407`) — migration 23, *"opponent ordering basis run schema"*, landed
under the draft when `opponent-contracts` was accepted. **This is D384's exact failure mode
happening to the document that cited D384**, and it is why the position rule exists: the claim
above needed no edit, only the prose around it did. Per D392, no integer appears in any
acceptance criterion here. **Re-derive `STORAGE_VERSION` at landing; do not trust this
paragraph.**

**Three active documents now hold `STORAGE_VERSION + 1`**, not two: `teacher-surface` (draft),
`opponent-contracts` (accepted, and its own header marks the position **CONTESTED**), and this
RFC. This RFC lands **behind both** and takes whatever position is next at its turn.

Body: **create-table/index only. No backfill, no snapshot rewrite, no stamp.** Nothing historical
is rated — every historical run was played under an unknown assistance state against an
unrecorded ceiling, and retro-rating it would manufacture exactly the fiction §1 refuses. Also
note for the register: `live-session.test.ts:29` asserts `STORAGE_VERSION` literally, so the bump
edits that test. **That assertion currently reads `toBe(22)` against a constant of 23** — stale
at HEAD, not this RFC's to fix, but the implementer will meet it.

#### 9.2 Pack schema — **none.**

Nothing about a pack changes. Rated-eligibility is *derived* (§3) from the run's opponent policy,
start material and assistance state — never authored. `DRILL_PACK_SCHEMA_VERSION` is **"0.27"** at
cross-review (`packages/schema/src/index.ts:2`). *The draft added "0.28 stays free —
`opponent-contracts` may keep 0.28"; both halves are stale: `opponent-contracts` was accepted with
its 0.28 claim **released** by its own cross-review (D385), so 0.28 is unclaimed for a reason that
has nothing to do with this RFC.* This RFC claims no pack lane and releases none.

#### 9.3 Run schema — **none.**

*The draft claimed `DRILL_RUN_SCHEMA_VERSION` is **"0.16"** and that "0.17 stays free". Both moved
under it: the constant reads **"0.17"** at cross-review (`packages/schema/src/index.ts:1`) —
`opponent-contracts`' `orderingBasis` landed — so the next free lane is 0.18 and this RFC does not
want it either.* No new event type and no widened field. The rating is a **projection**, not drill
content; the run event log stays the source of truth and `rated_games` is a materialised read over
it. This also avoids the `RunStorage.list` filter (`WHERE r.schema_version = ?`) that any run bump
would force a stamp migration for.

**And it is a safety property, not only a scoping one** — see §8a mechanism 2. A rating that never
enters a run event, a run snapshot or an engine request cannot reach a renderer that reads them,
which is half of R15 discharged by the register claim rather than by discipline.

#### 9.4 Shape-entry schema — none. `/capabilities` — one additive `reached` entry and three `refused` (§10.4).

`SHAPE_ENTRY_SCHEMA_VERSION` is untouched. `/capabilities` is a register of dispositions, not a
versioned resource, so the entries are additive rows rather than a lane claim.

### 10. Surfaces

#### 10.1 Storage

```sql
CREATE TABLE learner_ratings (
  learner_id TEXT PRIMARY KEY REFERENCES learners(id) ON DELETE CASCADE,
  calibration_id TEXT NOT NULL,
  rating REAL NOT NULL,
  rd REAL NOT NULL,
  volatility REAL NOT NULL,
  seed_band INTEGER,                     -- self-declared rung, nullable
  rated_games INTEGER NOT NULL DEFAULT 0,
  voided_games INTEGER NOT NULL DEFAULT 0,
  abandoned_games INTEGER NOT NULL DEFAULT 0,
  period_no INTEGER NOT NULL DEFAULT 0,
  period_started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE rated_games (
  run_id TEXT PRIMARY KEY REFERENCES drill_runs(id) ON DELETE CASCADE,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  calibration_id TEXT NOT NULL,
  opponent_band INTEGER NOT NULL,
  opponent_rating REAL NOT NULL,
  opponent_rd REAL NOT NULL,
  learner_side TEXT NOT NULL CHECK (learner_side IN ('white','black')),
  start_piece_count INTEGER NOT NULL,
  engine_identity_digest TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('open','sealed','voided')),
  void_reason TEXT CHECK (void_reason IN
    ('rewound','forked','assistance','engine_changed','calibration_retired','abandoned')),
  result TEXT CHECK (result IN ('win','loss','draw')),
  terminal_reason TEXT CHECK (terminal_reason IN
    ('checkmate','stalemate','insufficient_material','fifty_move','threefold')),
  ply_count INTEGER,
  period_no INTEGER,
  started_at TEXT NOT NULL,
  sealed_at TEXT
) STRICT;
CREATE INDEX rated_games_learner ON rated_games(learner_id, sealed_at);

CREATE TABLE rating_periods (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  period_no INTEGER NOT NULL,
  calibration_id TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  games INTEGER NOT NULL DEFAULT 0,
  rating_before REAL NOT NULL, rd_before REAL NOT NULL, volatility_before REAL NOT NULL,
  rating_after REAL, rd_after REAL, volatility_after REAL,
  PRIMARY KEY (learner_id, period_no)
) STRICT;
```

`ON DELETE CASCADE` on `learners(id)` gives account deletion for free, matching migration 2's
posture rather than the bare-`TEXT` pattern `teacher-surface` adopted for classroom tables.

Literal CHECK strings, per the migration-9 freeze lesson recorded in `rfc/README.md:133`.

**`tablebase_exact` is removed from `terminal_reason`** by cross-review (§5.4, R12). The five
values that remain are exactly the four `terminalOutcome` branches, with `isEnd`-not-checkmate
split into its three rules causes.

**Two schema-level notes on R15**, because storage is where the invariant would first leak:
`learner_ratings` and `rated_games` carry **no column any renderer reads** — no cached sentence,
no label, no band-equivalent string — and the band-equivalent of §7.1 is computed at the
`GET /rating` boundary rather than stored, so there is no denormalised copy for a future surface
to pick up by accident. And `seed_band` is nullable and **write-once at creation**; it is the
learner's self-declaration under D365, not a derived judgement, and it never changes after the
first period closes.

#### 10.2 Routes

| Method + path | Behaviour |
|---|---|
| `POST /rated-games` `{band, side}` | Creates a `position` run with the pinned policy **and** its `rated_games` row in one transaction, so the declaration cannot race the first ply. Refuses `RATING_BAND_NOT_ON_LADDER`, `RATING_OPPONENT_UNCALIBRATED`, `RATING_MATERIAL_OUT_OF_RANGE` |
| `GET /rating` | The published rating for the authenticated principal, already shaped by §7.2 — the server decides abstention, never the client |
| `GET /rating/history` | Sealed periods with before/after state and per-game rows. Read-only |

All three sit behind `authenticate()` → `Principal`, like every `/progress` route. No new token
scope, no new `RunRole`.

Every **server-routed** assistance route — `/human-split`, `/corpus`, `/voice`, `/speech`,
`/reasoning-review` — refuses with the shipped `ASSISTANCE_WITHHELD` when the run has an `open`
`rated_games` row. The six browser-rendered axes are outside this ceiling by construction (§5.2).

#### 10.3 Voiding

`RunService.#project` already runs on every run mutation (`service.ts:1747-1765`; called from
ten sites). The rated-game
projector hangs off it: on `run.rewound` or a second branch → `state='voided'`; on
`outcome.reached` on the single branch → `state='sealed'` with the result and terminal reason; on
engine identity mismatch in any `opponent.move_selected` → `state='voided'`,
`void_reason='engine_changed'`. A game left `open` past 30 days is voided as `'abandoned'` and
counted in `abandoned_games`.

#### 10.4 `/capabilities`

One additive row, following the register's own recording-vs-grading predicate:

```ts
{ instrument: "Glicko-2", capability: "learner rating from rules-terminal results",
  disposition: "reached",
  reason: "Arithmetic over game results against a measured opponent; no move is graded",
  surface: "rating" },
```

and **three** refusals made machine-readable so they cannot be reintroduced by silence:

```ts
{ instrument: "Glicko-2", capability: "rating from authored, engine- or tablebase-adjudicated outcomes",
  disposition: "refused",
  reason: "A pack's declared success is not a game result, and a tablebase result is a fact about optimal play rather than about the game" },
{ instrument: "Glicko-2", capability: "rating as an input to what is said about a move",
  disposition: "refused",
  reason: "A rating may select what a learner is shown and is never an argument to a rendering" },
{ instrument: "Glicko-2", capability: "cross-learner comparison of the rating",
  disposition: "refused",
  reason: "The population is the learner's own history" },
```

Field names and the `disposition` domain are read off `CapabilityDisposition`
(`apps/server/src/capabilities.ts:103-112`: `instrument`, `capability`, `disposition`, `reason`,
optional `surface` / `experiment` / `advertisedOptions`; `disposition` ∈
`"reached" | "refused" | "unmeasured" | "impossible"`) `[V]`. The second entry is R15 made
machine-readable, which is the third of §8a's mechanisms.

## 11. Coordination

### 11.1 Sibling RFCs

*Statuses re-derived at cross-review; three of the four rows in the draft were stale.*

| RFC | Overlap | Resolution |
|---|---|---|
| `teacher-surface.md` (**draft**) | **Migration ladder** — both want `STORAGE_VERSION + 1`. Also both touch `/learn`, and it requests an ownership pin on `permittedAssistance` | This RFC lands **behind** it and takes the next position at its turn. `permittedAssistance` is untouched (§5.2), so the pin is not contested. The `/learn` collision is **not** doctrinal either — §11.2, corrected |
| `pack-graduation.md` (**implemented 2026-08-16, `rfc/archive/`** — the draft said "accepted") | **None.** All its state is pack-scoped; pack 0.27 has landed | Nothing to negotiate |
| `opponent-contracts.md` (**accepted 2026-08-16** — the draft said "draft") | **Migration ladder, third claimant.** Its run 0.17 has **landed**; its pack 0.28 claim was **released** by its own cross-review (D385); its header marks its migration position **CONTESTED** | This RFC claims no pack and no run lane, so it contests neither. On the migration it lands **behind** this one too (§9.1). *The draft's "both lanes stay free" was wrong in both directions and is withdrawn* |
| `engine-leverage.md` (implementing) | Its `searchBound` record on `SelectionEngineIdentity` (`packages/runtime/src/types.ts:99`, `{ kind: "nodes" \| "movetime"; value: number }`) is what a future `strong_engine` rung would need (Open questions Q3) | Read-only dependency |
| `measurement-records.md` (draft) | **None structurally**, but D392's lesson binds here: no acceptance criterion in this RFC pins a version integer | Adopted (§9.1) |

### 11.2 The doctrine collision the draft declared — and did not have

The draft called this *"the one place this RFC contradicts shipped doctrine"* and proposed a
scoped amendment to one of three sentences. **Cross-review re-read all three at HEAD and the
claim does not hold: none of the three is contradicted, and the amendment is not owed.** The
sentences, verbatim `[V]`:

- `docs/return-and-progression.md:48-49` — of **milestones**: *"**Those** record firsts and one
  explicit attempt-count event; **they** never add a skill percentage, score, streak, **rating**,
  ranking, or cross-learner comparison."*
- `docs/return-and-progression.md:54-56` — of **`GET /progress/recommendations`**: *"Its closed
  sentences state only those events and corpus population counts; **they** never infer weakness,
  mastery, **rating**, or what other learners struggle with."*
- the `/learn` copy line *"This is an attempt history and return queue, not a mastery score"*
  (`App.svelte:746` — the draft cited `:741`, which is the milestone block above it), reasserted
  by `teacher-surface` §7.2.

**All three are scoped to a named surface by their own grammar** — *"Those"*, *"they"*, *"This"* —
and **R14 keeps the rating off all three surfaces**. Milestones add no rating; recommendations
infer none; `/learn` prints none. So each sentence remains true verbatim after this RFC lands, and
**the draft's `:48-49` amendment would have weakened a true sentence to make room for something
that is not on that surface.** That is the opposite of the correction it thought it was making.

**What is actually owed at landing is an addition, not an amendment** (and `docs/` is not this
tier's to write either way): a doc for the rating's own surface, and one sentence in
`docs/return-and-progression.md` noting that the no-rating clauses are properties **of the return
loop's surfaces**, not of the product — so a later reader does not infer a product-wide
prohibition from three surface-scoped sentences and quietly relitigate D332. The scheduler stays
*"not an FSRS/SM-2 mastery model"* (`:69`) — untouched and still true.

**This matters beyond bookkeeping.** R14 was carrying more weight than the draft credited it
with: it is not only a scope boundary, it is the sole reason three pieces of shipped doctrine
survive this RFC intact. If Open question 5 is ever answered *yes* — the rating selects content —
`docs/return-and-progression.md:54-56` **does** come into contradiction, and that is the moment
the amendment becomes real. Recorded so the dependency is visible from the question rather than
discovered after it.

### 11.3 The bias this design cannot remove

**There is no resignation.** `terminalOutcome` has no resign path, so a learner who abandons a
losing rated game produces no result and no rating movement. Selection is therefore real:
abandon-when-losing inflates the rating, and nothing in Glicko-2 detects it.

Three responses were available — adjudicate abandonment as a loss (requires inferring intent),
add a resignation event (a run-schema change this RFC declines), or make the bias visible. **The
draft took the third and stopped there. Cross-review's judgement is that disclosure alone is not
enough, and the reason is that this RFC does not accept it anywhere else.**

Everywhere the instrument cannot support a number, this RFC **abstains** — RD > 60, outside the
bracket, saturated score, unidentified opponent, truncated pack, adjudicated ending. Abandonment
is the one place the draft published a point estimate over a defect it had itself identified as
undetectable, and asked the reader to do the discounting. That is a dashboard's posture, not this
product's: *"a rating printed beside '4 rated, 11 abandoned'"* is a number the reader cannot
actually correct, because the correction depends on **which** games were abandoned, which is
exactly what is unrecorded.

**So the disclosure stays and a refusal is added.** §7.2 gains a row: above an abandonment share
of 0.25, the point estimate is withheld and only the interval and both counts are published,
**regardless of RD**. The threshold is a stated convention rather than a measurement and is
labelled `[M]`; what is not a convention is the shape — a bias the system cannot bound is a reason
to abstain, on the same footing as an RD it cannot narrow. Two cheap strengthenings are available
and neither needs a schema change, since both counters already exist:

- **A bound instead of a guess.** Recompute the period treating every abandoned game as a loss and
  publish the interval spanning both results. That is a genuine bound on the bias rather than a
  disclosure of it, and it needs no inference about intent — it is the worst case, stated as one.
- **Close the lag.** A game left `open` is not counted until §10.3 voids it at 30 days, so the
  disclosure trails the behaviour by a month. Counting `open` games older than the current period
  in the denominator removes the lag at no cost.

Both are recorded rather than specified, because the honest reading is that **the real fix is a
resignation event** — one run-schema field, which this RFC declines only because it claims no run
lane. D388 is ledgered precisely so that fix is not lost, and it notes the bias outlives this RFC:
any future measurement over played games inherits it.

### 11.4 The tension that remains

Voiding a rewound game creates a reason not to rewind inside rated mode. It is not a budget —
nothing is spent, nothing is withheld, and the catalogue is never gated (ADR-0007, D334) — but it
is pressure, and `00-thesis.md` names *"experimentation without cost"* as one of two answers to
why anyone would use this. The mitigation is that **no rated game is ever required**: rated mode
is entered deliberately, the rest of the product is unchanged, and a learner who never plays one
loses access to nothing. Open questions Q8 puts the reading to the owner.

## 12. Ledger rows owed

`design/BACKLOG.md` is edited by the coordinator, not by this RFC (concurrent-agent collision).
**Rows are cited by title**, never by line number, per `measurement-records`' rule and because the
ledger's rows moved under this draft.

**Three of the draft's seven proposals have already landed** and are recorded here as closed
rather than re-proposed:

- *"A rated ladder has an undetectable abandonment bias, because the product has no resignation"*
  — landed as **D388**. **Cross-review addendum owed on that row:** the mitigation is no longer
  disclosure alone; §7.2 now abstains from the point estimate above a 0.25 abandonment share, and
  §11.3 names the worst-case-bound and lag fixes.
- *"Assistance state is client-side only, so nothing that conditions on it can be verified"* —
  landed as **D389**. **Addendum owed:** the RFC now states the boundary in the refusal itself —
  three of nine axes are refusable, six are not — rather than implying a whole-loadout claim.
- *"The campaign has four offerable rungs today, not five to nine"* — landed as **D390**.

**And one row now blocks this RFC rather than being proposed by it:**

- **D395** — *"PIN THIS BEFORE `learner-rating` LANDS: a rating may select WHAT a learner is
  shown, never be an input to WHAT IS SAID about a move they played."* **Answered by this
  cross-review as R15**, with the enforcement in §8a and the test in AC-11, and R16 alongside it
  for the `BANNED_JUDGEMENTS` route-around D393's fix does not reach. The row can flip to closed
  **when the RFC is accepted with R15 and R16 intact** — not before, since the invariant's whole
  point is that it must exist before the conditioning variable does.

Rows still proposed:

1. **D332** — status note: RFC drafted and cross-reviewed; units resolved as a band-calibrated
   internal scale published as band-equivalents, with the origin disclosed as a convention.
2. **New 💡 — the estimable window is not the pool span, and the difference is ~610 Elo.** D337
   computed coverage as pool span ÷ journey (0.207–0.400 against a required 0.714). Deriving the
   window from the dossier's own 60-Elo resolution threshold, at a factor-two sensitivity decay,
   gives a **±306-Elo skirt** on each end and a **~1090-point estimable window** — of which 480
   is well-resolved. **D337 is not wrong; it answered a different question**, and this one needs
   a logistic-tail assumption `[M]` that D337's did not. **Two corrections from cross-review
   belong in the row:** the derivation's stated criterion (signal-to-noise against session
   sampling error) is not the one it computes (raw sensitivity) — the noise-matched form gives
   ±457 and a 1395-point window — and **the window landing near 1000–2000 is a gauge artefact of
   the 1500-BCS origin, not a finding** (1000 BCS is in fact 6 points outside it). Falsifier and
   threshold in `rfc/learner-rating.md` §7.3 / AC-7.
3. **New 🐞 — `attempts` is per-branch, so any per-run measurement has a grain mismatch.** PK is
   `(run_id, branch_id)` (`storage.ts:2694`); a rewound run yields several results and the
   run-level roll-up is still computed nowhere. Rating sidesteps it by voiding; the campaign's run
   verdict cannot.
4. **New 🐞 — a falsifier that simulates under the assumption it is testing is not a falsifier.**
   This RFC's own F-W proposed to test a logistic-tail assumption by simulating games and would
   have passed by construction. Caught in cross-review; the shape generalises to every
   simulation-backed acceptance criterion in this repo, and the guard is one line: **name the
   response model the simulator draws from, and require at least one that is not the null.**
5. **New 🐞 — `BANNED_JUDGEMENTS` is enforced only over LLM output, so any authored surface routes
   around it.** D393's fix grew the list 19→30 and closed the *vocabulary* hole; the *enforcement*
   hole is untouched — `voiceCheck` is a containment test over provider output, `KEY_POINT_JUDGEMENTS`
   covers only `ReasoningKeyPoint.phrases` and only when every word in a phrase is listed, and
   authored prose (`feedbackClaims[].text`, `objective.summary`, `PlanClass.description`) has no
   gate at all. **The learner rating adds a new authored surface**, which is why R16 runs the
   denylist over its frozen copy; the general fix is to run it over authored strings everywhere.
6. **New 🐞 — a tablebase seal is an adjudication, and this RFC nearly shipped it as a rules fact.**
   The draft's §5.4 admitted `tablebase_exact` on the ground that it is *"the same class as
   checkmate"*. It is not: it is a claim about optimal play from the position, and
   `maia-endgame-fidelity.md` measures Maia converting only 88.1–91.9% of won endgames — so the
   seal would over-credit at a measured rate, inside the material regime R5 refuses to rate.
   Withdrawn (R12). Worth a row because `perfect_tablebase`'s existence makes the confusion easy
   to repeat wherever an *opponent mode* gets read as a *sealing rule*.
7. **New 💡 — `docs/return-and-progression.md`'s no-rating sentences need an ADDITION, not an
   amendment**, and **all three survive unchanged**, not two. Each is scoped to a surface R14 keeps
   the rating off. What is owed is a doc for the rating's own surface plus one sentence recording
   that the clauses are surface-scoped — and the note that if Open question 5 is ever answered
   *yes*, `:54-56` does then come into genuine contradiction.
8. **New 🐞 — three active documents hold one migration position and the register cannot see it.**
   `teacher-surface`, `opponent-contracts` and `learner-rating` all claim `STORAGE_VERSION + 1`.
   D384 named this at two; it is now three, and this RFC is a worked example of the second half of
   that row — it reasoned from `STORAGE_VERSION` 22 and run schema 0.16 while both moved under it.
   **The position rule held; the surrounding prose did not.** Cheapest guard: the register records
   *claimants* on a position, not only the position.

## Deviations from design

1. **`design/06-campaign.md` §2b states Maia's usable band as `[1000, 2400]` with no
   magnitude.** This RFC uses `[1000, 2200]` for rated play and refuses 2400 on D338. That is not
   a contradiction of §2b — §2b bounds *distinguishability*, correctly — but the doc does not
   carry the ratio or the ceiling. `DESIGN-GAP:` already escalated by
   `maia-band-outcome-transfer.md` §1 and the exploration log; **not acted on here (law 5)**.
2. **`design/06-campaign.md` §5's acts escalate in decidability, and rated play is available in
   exactly one of the three tiers.** Act I (`theory_strict`) and Act III (`perfect_tablebase`)
   have no calibrated band, so the campaign's ladder and the rating's ladder are not the same
   object. Named, not resolved (Open questions Q1).
3. **`coaching-versus-cheating-and-the-band-curve.md` concluded that a learner model *"does
   not and should not exist"* (the sentence sits at `:424`, inside §4c, which is refusing adaptive
   difficulty on §3's ground).** The D332 ruling supersedes the first half. This RFC does **not**
   exercise the second half: R14 keeps the rating out of recommendation, scheduling and
   matchmaking. The dossier's conclusion was correct on the evidence it had; the owner has since
   ruled. *Two of that dossier's section references in the draft were off and are corrected in
   place: `permittedAssistance`'s inputs are documented in §2b/§2f, not §2a (§5.2); and*
   *"a complete specification of '2000-Elo skills required'"* *is §1's verdict at `:55`, not §4d
   (§5.3).*
4. **No deviation from `design/05-in-run-experience.md`.** `permittedAssistance` and the honesty
   ladder are untouched (§5.2).
5. **`design/research/band-flattery-and-buried-value.md` §5.5 asked for an invariant to be pinned
   before this RFC lands, and named the code rule it should take.** This RFC adopts it verbatim as
   R15 rather than paraphrasing it, because the dossier's wording is the one the ledger row D395
   carries and a reworded invariant is a second invariant. Not a deviation — recorded because the
   *design tier did not author it*: it is a research finding promoted straight into an RFC
   refusal, which is the RFC tier's own route (law 5) and is flagged so the owner sees it took
   that route.

## Acceptance criteria

- **AC-1 (refusals are tests, not prose).** Each of **R1–R16** has a named failing case: an
  uncalibrated band, a `pack` session, a 10-piece start, a rewound run, a second branch, an
  authored-verdict input, a per-move delta, a saturated score, an out-of-bracket estimate, a
  changed container digest, a `targetElo` reaching an update, **a tablebase probe attempting to
  seal**, an attempt to read `/progress/recommendations` from rating state, **a rating value
  reaching a rendering module (AC-11)**, and **a praise word in rating copy (AC-12)**. Each must
  be refused **by name**, not by absence.
- **AC-2 (Glicko-2 conformance).** The implementation reproduces Glickman's worked example
  (player 1500/200/0.06 versus 1400/30, 1550/100, 1700/300 with results 1/0/0) to within 1e-4 on
  `r'`, `RD'` and `σ'`.
- **AC-3 (calibration integrity).** Every rung's `rating` equals `1500 + measuredElo` for
  band ≠ 1400 and exactly 1500 at the origin; **every rung's `rd` equals `max(halfWidth, 24.1)`**,
  which after the cross-review correction is 24.1 for all four; a test asserts each `measuredElo`
  and `halfWidth` against `design/research/maia-band-outcome-transfer.md` §5 and against
  `tools/d333-band-outcome-harness/out/derived.json` → `fullMaterialLadder` (the ladder lives in
  `derived.json`; `summary.json` carries `derivedThresholds` and `d324PreRegistered`). Changing a
  rung without changing `calibrationId` fails the build. **The `rd` clause exists because the
  draft shipped one rung at a value that matched neither rule and no test would have caught it.**
- **AC-4 (no historical rating).** After the migration, `learner_ratings` and `rated_games` are
  empty on every existing database, and `GET /rating` publishes nothing.
- **AC-5 (assistance is refused, not trusted).** An integration test drives a rated run and
  asserts every **server-routed** assistance route returns `ASSISTANCE_WITHHELD` regardless of any
  client-supplied preference; and asserts `permittedAssistance`'s output is byte-identical to
  today's for the same inputs. **It must also assert the negative** — that the six browser-rendered
  axes are unaffected — so the RFC's claim and its test agree about what R6 reaches.
- **AC-6 (the five disclosures ship).** A rendering test asserts scale name, interval, game
  count + abandonment count, the assistance-ceiling qualifier, and — wherever movement is shown —
  the transfer ratio, with the corpus-wide magnitude asserted as **346.8**, not 289.6.
- **AC-7 (the bracket is simulated under more than one model, or it is not tested).** F-W runs:
  simulated learners at true BCS 950, 1050, …, 2150 against the four rungs, **under at least three
  response models — logistic, Thurstone/normal, and a saturating family with a floor draw rate —
  and under the shipped period structure of §6.3 (12 games or 7 days, with the pre-period RD
  widening), not one flat 200-game batch.** Credited at ≥90% interval coverage. **The published
  bracket is the minimum across models**, and the report must also state, per true rating, how
  many periods elapse before RD ≤ 60 makes anything publishable. If the result disagrees with
  [1006, 2098], the constant and the copy move. **A run under the logistic alone does not satisfy
  this criterion** — that is the null the bracket was derived under, and a simulator drawing from
  it cannot falsify it.
- **AC-8 (the cross-check is a diagnostic and stays one).** Maia's `0.5 + cp/2000` expected score
  is recorded alongside rated games and compared against the rating's predicted score in a
  report; a test asserts it reaches no update path.
- **AC-9 (abstention is server-side).** `GET /rating` never returns a point estimate the client
  could print when RD > 60 or the bracket fails — the field is absent, not merely flagged.
- **AC-10 (one result per run).** A run with a rewind and two terminal branches contributes
  **zero** rated results, and a property test over generated run logs asserts
  `|rated results| ≤ 1` per run, always. `rated_games`' `run_id` primary key makes "the same run
  twice" structurally unrepresentable, which is the other half of R11.
- **AC-11 (R15 is a build failure, not a review finding).** Two tests, and they are the reason
  D395 can be closed:
  1. **Module-graph reachability.** No module in the rendering set —
     `apps/server/src/guard.ts`, `guard-conditions.ts`, `packages/runtime/src/voice.ts`,
     `outcome-presentation.ts`, `feedback.ts`, `objective.ts`, and the claim-binding path — may
     reach the rating module by any import path, direct or transitive; and the rating module may
     not import any of them. Asserted over the resolved import graph, so adding an import fails
     the build.
  2. **No rating value in a rendered surface.** A test constructs a learner at each of several
     ratings, drives an identical run at each, and asserts the rendered guard prompt, outcome
     panel, feedback events and voice packet are **byte-identical** across ratings. This is the
     falsifiable form of *"selection, yes; rendering, never"*: if a rating ever conditions a
     sentence, the bytes differ.
- **AC-12 (the rating's own copy is inside the denylist, not around it).** The rating surface
  emits only a frozen sentence set; a test asserts (a) that set is exhaustive of the surface's
  text, (b) `BANNED_JUDGEMENTS` (all 30 words at `3e6fe2e`) intersects it nowhere, and (c) no
  rating surface reaches `/voice`, `/speech` or `/reasoning-review`. **(b) is deliberately run on
  authored strings, which `voiceCheck` never sees** — that is the point of the criterion.

## Open questions

Resolved before `accepted`, or deferred to a named future RFC.

1. **Can a campaign boss be rated?** §5.3 makes the horizon the reason packs cannot be, and
   `coaching-versus-cheating-and-the-band-curve.md` §4d makes the suppressed boss the ideal rated
   object. The fork is the owner's: (a) bosses stay unrated and the rating lives only in Just
   Play; (b) a boss may declare no horizon and be played out, which makes it rateable and changes
   `06` §5's encounter shape; (c) a boss is rated only when its final position is inside the
   tablebase (§5.4), which fits Act III and nothing else. **Owner call.**
2. **Should 11–20 pieces be rated?** Refused here on n = 48 — the thinnest cell in the study, not
   a measured null. The cheap fix is one arm on the existing harness (`tools/d333-band-outcome-
   harness/`) restricted to that band of material. Defer or run.
3. **Does `strong_engine` join the ladder?** `go nodes 50000` is reproducible (D35's remedy) and
   would widen the pool upward past band 2200, where D338 says the Maia dial is inert. It is not
   a human-choice model, but it would be an *opponent whose rating is measured*, which is all the
   update needs. Doctrine rejects **weakened** Stockfish as the default opponent; full-strength
   fixed-node Stockfish already ships as an opponent mode. Requires its own rung measurement
   before any answer. **Owner call on whether to ask the question at all.**
4. **Three more rungs, or four is enough?** Adding bands 1200/1600/2000 against the same
   band-1400 reference is a re-run of an existing harness arm and would take the ladder from four
   rungs to seven at ~200-band spacing — still above D336's ~150-point resolution floor at full
   material. Cheapest available improvement to the instrument.
5. **Does the rating ever select content?** R14 refuses it in v1. The moment it does, the product
   has adaptive difficulty and a learner model driving the catalogue, which is a different
   product decision and needs its own RFC. Named so the default is not chosen by silence.
6. **The human anchor.** Nothing here measures a human against a band. The experiment is
   well-defined and cheap — learners with known Lichess rapid ratings play a fixed schedule
   against the four rungs; regress recovered BCS on the external rating. Until it runs, R7 is
   permanent. **This is the single highest-value unrun experiment this RFC creates**, in the same
   position D333 occupied for D332 a day ago.
7. **Which branch, if the owner ever rules on submitted-path semantics?**
   `design/research/campaign-intermediate-consequence.md` puts (a) the path you stand on, (b) the path you
   submit, (c) the worst path to the owner. For rating purposes only (a)-equivalent is safe: (b)
   and (c) are both farmable by replaying until the desired result appears. R11 sidesteps the
   fork by voiding any rewound game outright. If the owner rules (b), this RFC does **not**
   follow it — flagged here so the divergence is deliberate.
8. **Does voiding on rewind price experimentation?** §11.4's tension. It takes nothing away and
   gates nothing, but it does create a reason not to rewind inside one specific declared mode.
   `06` §2c ruled a rewind *budget* prices the thesis's selling point; a *measurement* that
   cannot see a rewound game is a different object, and the owner should confirm that reading.
9. **Should a tablebase-exact result ever seal a rated game?** Cross-review withdrew it (§5.4,
   R12) because it fails §1's own test and would over-credit at a rate
   `maia-endgame-fidelity.md` has measured. But there is a defensible version the owner may want:
   seal it, record `terminal_reason: 'tablebase_exact'`, and **disclose it as an adjudication
   rather than as a result** — a sixth §7.4 obligation, and a count printed beside the rating the
   way `abandoned_games` is. That trades one measured bias for a shorter game. **Owner call; the
   default until then is refused.**
10. **Does R10 refuse the table, or the number?** Raised head-on by
    `design/research/league-as-return-loop.md` §C1 and escalated there as owner-facing: no league
    exists without a standing, and a standing ranks by *what happened* rather than by a
    manufactured number — the same distinction that made D332 law-8-legal in the first place.
    §8b restates R10 to name the object rather than the shape, so **it survives either ruling**
    and neither pre-empts it. What R10 continues to refuse under both is putting **this rating**
    into any such table. The dossier's alternative if the ruling goes against the table — the
    league's own *permanent shading*, a mark with no number and no ordering — is the same object
    class as our shipped milestones and is unaffected by anything here. **Owner call.**

## Changelog

- 2026-08-16: created.
- 2026-08-16: **adversarial cross-review** (claude, not the author). **Blocker fixed:** D395
  written in as **R15** with its mechanism (§1a, §8a, AC-11) and **R16** for the D393
  route-around (AC-12); refusal count 14→16. **Withdrawn:** §5.4's tablebase adjudication, as a
  contradiction of §1's own test (R12 widened, enum narrowed, Open question 9 opened).
  **Corrected:** band 2200's calibration `rd` (20.6 → 24.1, matching neither prior rule);
  §7.4's corpus-wide ladder magnitude (≈290 → ≈347, an attribution error against a different
  span); `STORAGE_VERSION` 22→23 and `DRILL_RUN_SCHEMA_VERSION` 0.16→0.17, both moved under the
  draft; three of four sibling-RFC statuses; §11.2's doctrine reading (all three sentences
  survive, an **addition** is owed rather than an amendment) and the "Parent / amends" header
  with it; §3's `derivedThresholds` file and cut; a dozen line references relocated by symbol.
  **Strengthened:** R6 narrowed to the three axes it can enforce with the boundary disclosed
  (§7.4 obligation 5); R10 restated to name its object so an owner ruling can go either way
  (§8b, Open question 10); abandonment promoted from disclosure to abstention (§7.2, §11.3).
  **§7.3 reworked:** the arithmetic re-derives, but the stated criterion was not the computed one
  and **falsifier F-W was circular** — rewritten with three response models and the shipped period
  structure (AC-7), with the pool span operative until it runs. §12 reconciled against D388/D389/
  D390, which have landed.
