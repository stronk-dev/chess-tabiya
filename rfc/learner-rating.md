# RFC: Learner rating

- **Status:** **implementing — 2026-08-22 learner-surface checkpoint.** The calibrated Glicko-2 core, migration 25, atomic rated-game admission, mutation projector, period update, abandonment accounting, named assistance refusal, rating/history routes, permanent marks, consented classroom-standing read/write paths, dedicated measured-record view, and classroom standing composition are implemented. No historical game is backfilled; the server abstains before evidence supports publication; the client preserves that abstention and derives no ranking or praise. Rated campaign entry, owner-use validation, and the remaining acceptance graph still belong to this RFC. **Accepted 2026-08-22, by claude as register owner on the buildability test, after an independent cross-review that re-derived ~80 claims at source and failed 14, all corrected in place.** The center catch: R6's refused-route enumeration was incomplete — a rated run could read live Stockfish lines mid-game via `/reveal` → `/analysis` → `/evidence`, routes the withholding set never named (now in `ASSISTANCE_WITHHELD`, `POST /rated-games` pins `feedbackPolicy: "attempt_end"`, AC-5 extended). The Glicko-2 arithmetic verified clean end-to-end to four decimals; the void mechanism verified event/branch-keyed across all four persisted rewind-family paths; the five remaining open questions (3/5/6/8/9) are registered opens, judged non-blocking per review. Rows: D980/D981 landed at acceptance; D395 flips closed with R15/R16 intact. Prior line: **implementing — 2026-08-22 cohort-backend checkpoint**; before that: **draft — independent cross-review complete 2026-08-22 (verdict: accept-after-corrections); awaiting acceptance**.
  The two blocking open questions are ruled: **question 11** by [[D945]] (earned rewinds — a fourth
  shape none of the drafted answers had; R11 stands **unchanged**, the earned economy lives on the
  encounter-verdict side per accepted `rfc/campaign-core.md` §2, so the boss is **rated when
  clean, winnable regardless**) and **question 12** by [[D946]] (the witnessed-play seam is
  **pinned**: a cohort may one day require it; the default stays not-required; nothing is
  implemented until a real cohort exists — §10a.2a). [[D962]]'s persona/`targetElo` disjointness
  is recorded at the rated predicate without foreclosing either arm (§3, condition 3). Prior line:
  **draft — author round 2026-08-16, on two owner rulings.** **Ruling 1 reverses
  R10**: leaderboards and cross-learner comparison are now a **designed surface**, specified in
  §10a as the **cohort standing**, with the refusal's one empirical ground — we do not police
  self-cheating — carried forward as a **stated limitation on the surface itself** rather than as
  a reason not to build it. **Ruling 2 answers open question 1**: a campaign boss is a **full
  game, not a pack**, so the boss changes and the rating does not (§5.3a). Both rulings are folded
  into the body; open questions 1 and 10 are marked answered rather than renumbered, so every
  cross-reference in this document and in its siblings still resolves. Also this round: the
  **F-W/AC-7 rewrite is made coherent** ("minimum across models" was undefined over intervals; the
  simulation had no arrival rate — D420), a **fourth site repeating the estimable window without
  its gauge caveat** is fixed (§7.3 qualification 3 — D424), and the register is re-verified late
  (§9). Prior round: adversarial cross-review 2026-08-16 landed **R15**/**R16** for D395, withdrew
  the §5.4 tablebase adjudication, and corrected the register facts and one calibration `rd`.
  Not accepted: open questions 3, 5, 6, 8 and 9 stand (11 and 12 ruled 2026-08-22)
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
  `design/research/maia-band-outcome-transfer.md`.
  **Two further owner rulings, 2026-08-16, are the reason for this round:**
  **(1)** *"add leaderboards and cross-learner comparison… maybe local chess clubs want to use us
  at some point? who knows… add it properly, re-evaluate the refusal and why it was there and what
  it unlocks"* — R10 **reversed**, §8b and §10a.
  **(2)** on open question 1, *a campaign boss is a full game, not a pack* — §5.3a.
- **Depends on:** `rfc/archive/return-and-progression.md` (`attempts.result` — the only durable
  win/loss/draw store), `rfc/archive/engine-request-contract.md` and
  `rfc/archive/resistance-spectrum.md` (`eloHonored`/`eloApplied` per-move record),
  `rfc/archive/learner-identity-and-authorization.md` (`learners`, the learner id).
  **`archive/teacher-surface.md` is now a hard dependency, not only a migration-order neighbour** —
  §10a's standing is scoped to its `classrooms` / `classroom_members` and adds no second
  grouping object and no second consent model (§10a.2). It lands after `teacher-surface` and
  `opponent-contracts.md` in the migration order (both since implemented — see §9.1); the ladder
  carried a **fourth claim** ([[D423]], since closed by `shared-resource-registers`; §9.1)
- **Parent / amends:** **nothing.** The draft claimed it amended `docs/return-and-progression.md`;
  **cross-review found no contradiction to amend** — all three of that doc's no-rating
  sentences are scoped to surfaces R14 keeps the rating off, and each survives verbatim.
  What is owed at landing is an **addition** naming the rating's own surface, not an
  amendment. See §11.2
- **Supersedes / superseded by:** —
- **Planning:** `planning/learner-rating/` (once implementing)

```tabiya-claims
none
```

## Summary

This specifies **a Glicko-2 rating for the learner, computed only from whole games played to a
rules-terminal position against a *calibrated* Maia band at full material, with no assistance
and no rewind.** It ships the calibration table read directly off
`design/research/maia-band-outcome-transfer.md` §5 — four measured rungs, no interpolation, no
invented number — a publication rule that abstains until the rating deviation is smaller than
the resolution the instrument can support, and **sixteen** named refusals — one of which, **R10**,
was reversed by owner ruling into a designed surface and survives as three narrower clauses. It claims **no pack
schema lane, no run schema lane, and one migration position** (create-table/index only, no
backfill).

**Two owner rulings landed after the cross-review and this round implements them.** The first
**reverses R10**: cross-learner comparison ships, as the **cohort standing** of §10a — scoped to a
classroom the learner joined and then *published into by their own act*, ranked by results,
**grouped** rather than ranked by rating, defaulting to the honour-roll form, and carrying on its
face the limitation the refusal was built on: **these games were played alone against a bot and
nobody witnessed them.** The second rules that **a campaign boss is a full game, not a pack**
(§5.3a) — which changes the boss, not the rating, and makes it the first campaign encounter
required to produce a rules-terminal outcome.

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
and the guard's output is `{ nodeId, evidenceRefs }` — **a pointer to recorded evidence, never a
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

Matchmaking and adaptive difficulty (Open questions Q5); any rating on the campaign map or as a
gate; rating for imported games (`sessionKind: "imported"` projects no attempt at all,
`progress.ts:84-86`); rating for pack sessions (§5.3 explains why the horizon forbids it); rating
any opponent mode other than a calibrated `human_common` band; and the human-anchor experiment
itself, which is a research question this RFC names and does not run.

*"Any cross-learner surface" was on this list until owner ruling 1 and is now in scope, bounded*
*by §10a: one standing per classroom, no standing that spans classrooms, and no global table
ever.*

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
2. `sessionKind === "position"`. Not `pack` (R2), not `imported` (R1). **A campaign boss
   satisfies this rather than excepting it** — owner ruling 2 makes a boss a game, and a game in
   this tree is a `position` session. `RunSessionKind` stays the shipped three-member union
   (`"pack" | "position" | "imported"`, `packages/runtime/src/types.ts`); no fourth kind is added
   here, and §5.3a is the whole of the change.
3. `opponentPolicy.mode === "human_common"` and `targetElo` is one of the four ladder rungs in
   §4.1. — R1, R3. *([[D962]], recorded 2026-08-22: the accepted `rfc/bot-policy.md`'s
   `RunOpponentPolicy.profile` **forbids** `targetElo` in a profiled request, so a persona'd
   opponent cannot satisfy this condition as shipped — a rated persona boss needs a
   rung-calibrated profile (bot-policy §7) or the boss drops the persona. This predicate
   forecloses **neither** arm; the resolution is owned by `rfc/campaign-core.md` Discharge D1,
   the deferred rated boss, which this RFC's acceptance unblocks.)*
3a. **Time control does not gate rating ([[D1292]], owner ruling 2026-08-23).** A timed game is
   rated like any other; the control is **not** a precondition. What it does instead is enter the
   **label** — see §7.4 obligation 7 — because the anchor's calibration at that control may not
   exist. This condition is deliberately *not* a refusal: the owner chose widest coverage over the
   recommended rate-where-calibrated, and the honesty mechanism is disclosure rather than exclusion.
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
(`packages/runtime/src/assistance.ts`). **Three** of them cross the wire whole and can be
refused: `humanSplit`, `corpus`, and `voice` (with `/reasoning-review` behind the same disclosure
gate) — and *(recounted by cross-review 2026-08-22 against the v4 config, which grew under this
draft)* a **fourth, `spoken`, crosses it in one of its three values**: `spoken: "provider"` is
server-synthesized TTS via `/speech` (`DrillScreen.svelte` calls it when the provider tier is
selected), so that tier is refused too. The remainder — `boardLighting`, `arrows`, `ambient`,
`markers`, `guided`, and `spoken`'s browser tier — are **rendered in the browser from data the
client already holds**, and refusing them server-side is not possible, not detectable, and not
claimed here. Neither is anything outside the tab: a second window, an engine on another device,
or a person in the room.

So R6's honest content is: **a rated game is unassisted to the exact limit of what the server can
refuse — the wire-crossing rungs that would otherwise deliver a measurement into the run — and
makes no claim beyond that limit.** §7.4's disclosure 5 says so at the point of printing, which is
the same posture `docs/live-sessions.md` already takes about self-cheating. **A rating that
claimed "unassisted" without that qualifier would be the manufactured claim this RFC exists to
avoid**, and it is the reason D389 is ledgered as generalising past this RFC: *every* claim about
how a run was played inherits the same ceiling.

**`permittedAssistance` is not modified.** The honesty gate keeps its inputs exactly as
`coaching-versus-cheating-and-the-band-curve.md` §2f documents them — *"the honesty **ceiling**:
which sources may speak, given role and disclosure state"*. *(The dossier's field count is
historical: at HEAD the declared `AssistanceContext` carries **five** fields — `sessionKind`,
`deliveryOpen`, `role`, `seatedInContest`, `reviewing` — grown under this draft by
`teacher-surface`; the rated refusal reads none of them, which is the point.)* The rated refusal is a route-layer ceiling
*outside* the gate — which also keeps this RFC clear of `teacher-surface`'s requested ownership
pin on that function (§11.1). `06` §3 law 1 holds: nothing here changes what may honestly be
shown or when.

#### 5.3 Why pack sessions cannot be rated

A pack encounter ends at `authoredBoundary.plyHorizon`, not at checkmate — the horizon is what
line membership stops at (`plyHorizon` in `packages/runtime/src/line.ts`) and what the boundary
predicate reports reached past (`packages/runtime/src/objective.ts`). *Corpus re-derived at this
round against a tree that had moved again: of the **152** `.json` files under `content/drafts/`,
**56 are drill packs** (the other 96 are shape-entry, emission-job and sourcing artefacts;
`content/packs/` is empty), and **50 of those 56 declare an `authoredBoundary.plyHorizon`, median
11** `[V]`. The cross-review's "50 … median 11" is confirmed; what is new is the denominator,
which is 56 packs rather than 152 documents.* A truncated game has no rules-terminal result, and
producing one would require assessing the final position — which is an engine or authored verdict,
i.e. the exact thing §1 forbids. **The horizon is the reason packs are unrated**, and it is a
principled reason rather than a scoping convenience: it would hold at one pack or at a thousand.

**And the corpus shows the truncation is not merely a technicality it would be pedantic to
insist on.** **26 of the 56 packs already declare `objective.grading.resolveAt.kind: "terminal"`,
and 25 of those also declare a `plyHorizon`** — twenty of them at 7–13 ply `[V]`. *"Resolve at
terminal"* and *"stop at ply 7"* are asserted on the same object, nothing in
`apps/server/src/pack-validation.ts` objects to the pair, and the horizon is what actually fires.
So the pack vocabulary **already claims a terminality it does not deliver**. That is the gap owner
ruling 2 closes, and it is why the ruling changes the boss rather than the rating.

#### 5.3a Owner ruling 2 — a campaign boss is a full game, not a pack

**The ruling, 2026-08-16, answering open question 1:** a boss encounter runs to a real terminal
result and rates like any other game. The rating is not relaxed for it; the boss is rebuilt to
meet it. The ruling is well aimed: the suppressed-boss configuration was already the closest thing
in this repo to a rated object — `coaching-versus-cheating-and-the-band-curve.md` §1 (`:55`) calls
it *"a complete specification of '2000-Elo skills required'"* — and the only thing standing
between it and a result was the horizon.

**What that means concretely, and it is a bigger change than one field.** A rated boss is a
`position` session created against a calibrated rung — the object `POST /rated-games` already
creates (§10.2) — with the campaign supplying the start FEN, the side and the band. It is **not a
pack with the horizon deleted**, and the reason is structural rather than stylistic: `objective`
and `checkpoints` are in the pack schema's top-level `required` list
(`schemas/drill_pack.schema.json`), so a pack **cannot** exist without an authored objective, and
an authored objective is the first row of R2's refused-inputs list. Encoding the boss as a
horizon-free pack would leave the refused input present on the object and refused only by
discipline; encoding it as a game makes it **absent**. That is the same argument §9.3 makes about
the run schema, applied one tier up: *a thing that is not on the object cannot leak from it.*

`authoredBoundary` is **not** in that required list, so "a pack with no boundary" is
representable, and **six of the 56 drafts already are one** `[V]`. The ruling does not need that
affordance and deliberately does not use it.

**Four consequences, stated here rather than left to be discovered.**

1. **A boss becomes a different object from every other campaign encounter.** Every other node is
   an authored encounter bounded by a horizon and sealed by an `ObjectiveState` from
   `successConditions`; a boss is a game bounded by the rules and sealed by `terminalOutcome`. So
   **the map now has two verdict producers, and which one seals a node is a property of the node**
   — the authored one everywhere, the rules one at a boss. They are not interchangeable and neither
   is computed from the other, which is §1's line drawn across the campaign rather than only across
   the rating. A boss may still carry authored copy — a briefing before the first ply — because
   briefing copy is campaign copy and reaches no update (R2); what it may not carry is an authored
   *verdict*, since a boss has a real one.
2. **Only Act II can host a rated boss, and this is measured rather than chosen.** `06` §5's acts
   escalate in decidability: Act I is `theory_strict`, Act III is `perfect_tablebase`. Neither has
   a calibrated band, so both are refused by R1 — and Act I is refused twice over, because
   `THEORY_NEEDS_AUTHORED_BOUNDARY` and `BOUNDARY_NEEDS_PLY_HORIZON`
   (`apps/server/src/pack-validation.ts`) make a `follow_theory` objective **structurally
   incapable** of running to a rules-terminal result: the validator requires it to declare a
   finite horizon. Act III is refused twice as well — R1 for the band, and **R5 on material**, and
   the second refusal is exact rather than approximate: `PERFECT_TABLEBASE_OUT_OF_RANGE` reads
   *"perfect_tablebase requires a root with **at most seven pieces**"*
   (`apps/server/src/pack-validation.ts`) `[V]`, against R5's floor of 21. **The campaign's climax act is the one act that cannot carry a rated
   result**, so the rated axis runs orthogonally to the decidability axis rather than alongside it.
3. **The material precondition is already satisfied by the shape Act II uses, and this is
   measured.** Across the 56 packs, start-position piece counts by mode: **`plan` mode is 14 for
   14 at ≥21 pieces**; `outcome` mode is **13 of 15 below 21**; `line` mode is 21 of 23 at ≥21
   `[V]`. `06` §2b's middlegame boss is *"`human_common` at a band plus an authored plan"*, whose
   closest corpus analogue is `mode: "plan"`, so R5 costs the ruling nothing where it applies and
   refuses exactly the endgame shape it was written to refuse. The mapping from §2b's prose to the
   `plan` mode is an inference, not a schema fact; the precondition is checked per encounter from
   the start FEN either way, never assumed from the mode.
4. **The rated boss and `06` §5's submitted-branch ruling collided — RULED 2026-08-22
   ([[D945]]), a fourth shape none of the drafted answers had** (a *third* relative to the
   two-document binary [[D945]]'s own row records; both counts describe the one ruling). The collision as recorded: `06`
   §5 ruled *"rewind stays free inside an encounter; **declaring done** is what counts"*, and R11
   voids any rated game containing a rewind — for a rated boss these could not both hold. The
   owner's verbatim answer to question 11: *"you have to earn rewinds or proactive branching...
   not infinite, not forbidden. it's what allows a weaker player to actually win a campaign (on
   lower floors/acts/whatever)."* Inside campaign encounters, rewind and proactive branching are
   an **earned economy** — now amended into `06` §2c and made mechanism by the accepted
   `rfc/campaign-core.md` §2 (`RunService.#campaignCharge`, `CAMPAIGN_REWIND_EXHAUSTED`).
   **R11 stands unchanged in this RFC**: a rated game containing a rewind — earned or not — is
   void (predicate condition 7, refusal R11). The earned economy lives entirely on the
   **encounter-verdict side**: spending an earned rewind can still *win* the boss encounter for
   the campaign — that is the ruling's point — while the attempt's ratedness follows R11, so the
   boss is **rated when clean, winnable regardless** (the R11 half is claude's default reading,
   recorded in [[D945]] as the owner's to veto). The two verdict producers consequence 1 already
   separates are exactly what make this expressible without a new rule.

**What `design/06-campaign.md` needs — WRITTEN 2026-08-22** (claude on the D439 ruling, law 5;
all six amendments landed, [[D836]]; the rewind/R11 collision, first recorded there as an open
question, was **ruled the same day** — [[D945]], landed in `06` §2c/§5 by claude on the ruling).
The list below stands as the record of what was named:

- **§5's encounter vocabulary.** *"Encounters are bounded by the **shipped** `plyHorizon`"* is now
  false of one encounter class. The doc needs a boss row that is bounded by the rules instead, and
  a sentence saying which of the two verdict producers seals which object.
- **§5's act ladder.** The rated boss exists in Act II only, for the three reasons above. `06`
  currently reads as though the three acts differ in decidability alone; they now also differ in
  whether a result exists at all.
- **§2a's difficulty-availability axis.** Its four labels — measured-by-outcome,
  measured-by-tablebase, authored, none — are all properties of a **position**. A boss that plays
  to terminal produces a *result*, which is a property of the **encounter**, so it does not fit on
  that axis and needs either a fifth label or a second axis. `06` should say which.
- **§2b's boss-per-phase table.** It gives three bosses; exactly one of them can be a game with a
  rated result, and the doc should say which and why the other two are not.
- **§5's `plyHorizon` corpus claim.** *"36 of 37 packs already declare one, median 12 ply"* is
  stale against the tree measured above (50 of 56, median 11) `[V]` — a bookkeeping fix, listed so
  it lands with the rest.
- **§2c/§5's rewind ruling** — landed 2026-08-22: question 11 was answered by [[D945]]'s earned
  economy rather than "in R11's favour" or against it, and `06` §2c/§5 now carry the ruled
  paragraph and the resolution note. R11 is untouched by the amendment.

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
   §12 proposes the row. **The 1.09 is a ratio of widths and says nothing about containment, and
   this is the exact site D424 predicted would decay** — a coverage ratio above 1 reads as *"it
   fits"*, and it does not: the same arithmetic puts the journey's floor **6 points outside** the
   window's, and the window's position is a gauge artefact of the 1500-BCS origin (§4.2,
   qualification 2 above). *Approximately the width of*, never *fits* — including here, where the
   number is most likely to be quoted alone.
4. **It does not rescue the anchor.** A 1092-point window whose zero is arbitrary is still
   arbitrary. §7.4 is not weakened by §7.3, and neither is R7.
5. **Draws are unmodelled, in the conservative direction.** The `E(1−E)` variance term treats a
   game as Bernoulli. With draws the score's variance is strictly lower, so RD is over-stated and
   the skirt under-stated. Recorded rather than corrected: an error that makes the instrument
   claim less than it can is the acceptable direction, and F-W's draw-inflated arm measures it.

**Falsifier F-W, rewritten.** Simulate learners at true BCS 950, 1050, …, 2150 playing against
the four rungs, and credit the estimator only where the recovered rating's 95% interval contains
the truth on ≥90% of replicates. Three things the draft's version lacked are **required**:

- **More than one response model, and the published bracket is the *intersection* across them.**
  At minimum: (a) the logistic — the null the constant was derived under; (b) a
  heavier-shouldered alternative (Thurstone/normal), which reaches saturation sooner in the tails;
  (c) a **saturating** family with a floor draw rate, which is the failure mode actually feared —
  *"a learner far above band 2200 may simply score 1.000 forever"*. A bracket that survives only
  under (a) is a bracket that was assumed, not tested. *Sharpened this round: the cross-review
  wrote "the **minimum** across them", which is undefined over intervals — the minimum of
  [1006, 2098] and [1100, 1900] is not a quantity. The operative rule is **per-point**: a true
  rating is inside the published bracket only if it clears the coverage null under **every**
  model, and the bracket is the largest contiguous run of grid points that do. That is an
  intersection, it is well defined, and on the drafted wording an implementer could equally have
  taken the narrowest **width** and centred it wherever they liked.*
- **The shipped period structure, not a single 200-game batch — and a stated arrival rate, which
  the shipped structure makes load-bearing.** §6.3 closes a period on **whichever comes first: 12
  sealed games or 7 days with at least one**, and re-widens RD toward 350 between periods. *Also
  sharpened this round: "12 games or 7 days" cannot be simulated without saying how fast the
  learner plays, because the arrival rate is what decides which of the two clauses ever fires.*
  F-W must therefore run **at least two arrival rates — one count-closing (≥12 rated games a week,
  where the 7-day clause never fires) and one clock-closing (≤3 a week, where every period closes
  on the clock with the pre-period widening applied against a handful of games)** — and report
  each separately. The publication rule (RD ≤ 60) binds hardest exactly where the bracket is
  widest: at the skirt edge, `SE(D) = 491/√n`, so **RD ≤ 60 needs ≈67 games** against the extreme
  rung, against ≈34 at parity. F-W must report, per true rating **and per arrival rate**, both
  interval coverage **and** how many periods pass before anything is publishable at all. **The
  clock-closing arm is the one that matters commercially and it is the one nobody has run:** a
  learner playing three rated games a week is the expected case, and whether their RD ever reaches
  60 is a question about this product's core promise that no line of this RFC currently answers.
- **A stated null, and a stated resolution.** The simulation is credited against ≥90% interval
  coverage — deliberately slack against the nominal 95%, so a 5-point shortfall is tolerated and a
  larger one is not. Below it at any true rating inside [1006, 2098], the bracket contracts to the
  largest contiguous run of grid points that clears it under every model. **The grid is 100 points
  wide, so the contracted bracket is resolved to ±50 and is published rounded to the grid** — it
  may not be printed to the point, which would assert a precision the simulation's own spacing
  cannot support. (Note the scale: the 6-point shortfall §4.2 records at the floor is an order of
  magnitude below what this criterion can resolve, which is why that shortfall is a statement
  about the *arithmetic as derived* and not something AC-7 can adjudicate.)

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
5. that "unassisted" means **every assistance the server can refuse**, and that five of the nine
   assistance axes — plus `spoken`'s browser tier — are browser-rendered and therefore neither
   refused nor detected (§5.2, D389);
6. **on any surface where a learner can see another learner's rating, record or mark** — i.e.
   every §10a surface — that **these games were played alone against a bot and nobody witnessed
   them**, in that register and not softer. This is obligation 5's ceiling restated for the one
   context where it stops being a caveat about the learner's own number and becomes a caveat about
   a comparison. **Added by owner ruling 1**, which reversed R10 without reversing its ground:
   §8b sets out why this obligation is the reversal's whole price.

7. **the time control the game was played at, and the anchor's calibration state at that
   control** — added by owner ruling [[D1292]], 2026-08-23. Where the rung was calibrated at a
   different control from the one played, the surface says so **on the rating itself**, not in a
   footnote: the anchor's strength at the played control is unmeasured, and a rating computed
   against it is not the quantity it appears to be. **The measured basis for the disclosure**:
   `bot-policy:592` records maia1's own rating spanning **~230 Elo across time controls against the
   same human pool** `[V]`, so an untimed rung used to rate a `180+0` game can be wrong by more than
   a rung. Calibration at a control **improves this label** — it does not gate the rating.

**Obligation 7 records a conflict rather than resolving it, and that is deliberate.** The
recommendation put to the owner was *rate where calibrated, abstain elsewhere*; the owner chose
**rate all timed games, control on the label**. The two are not reconcilable by arithmetic, so the
disclosure is where the honesty goes. **What this is adjacent to and not identical with**: [[D819]]'s
label rule binds a ***bot's*** stated Elo — *a stated Elo is a measured claim with its measurement
cited, or it is not stated* — and it is untouched here, because no bot's label changes. This is the
***learner's*** rating resting on an anchor whose strength at the played control is unmeasured. The
distinction is real and is why obligation 7 is a disclosure rather than a violation; it is also thin
enough that stating it is the only honest way to carry it.

*Correction by cross-review on obligation 4: the draft printed **≈290**, which is the wrong
quantity for the span it is attached to.* 289.6 Elo is the corpus-wide value of `[1000, **2400**]`
(`derived.json` → `thresholds.coverage.observedFullRangeElo`); the corpus-wide value of
`[1000, **2200**]` — the ladder this RFC actually rates against — is `ladderSpan.eloGain = 346.8`
`[V]`. A normative disclosure printing a 16% understatement of its own instrument's span is the
disclosure failing at its one job.

Copy is not specified here beyond these **seven** obligations (*"five" corrected by cross-review
to six when ruling 1's obligation 6 landed; **seven** since [[D1292]] added obligation 7*), which are
testable — 1–5 in §AC-6, 6 in §AC-16, 7 in §AC-18 — **and is bounded by R16, which is where the copy
itself becomes a law-8 surface.**

### 8. Refusals

Each is named, each has a reason that is a measurement or a law, and each is a test in §AC.

| # | Refused | Because |
|---|---|---|
| **R1** | A rating from an **uncalibrated opponent** — `theory_strict`, `practical_resistance`, `strong_engine`, any band off §4.1's four rungs, any run where `eloHonored !== true`, any engine identity other than the pinned digest | An update needs the opponent's rating. Where there is none, there is no update — only a number |
| **R2** | A rating that moves on **authored outcomes** — `ObjectiveState`, `attempts.verdict`, `successConditions`, `TempoVerdict`, `lineMembership`, `prediction.recorded` | A pack's declared success is a compiled author judgement (`pack-orchestrator.ts`), not a game result. Feeding it in makes the rating a function of an author's opinion |
| **R3** | **Cross-band comparison the transfer ratio does not support** — offering, displaying or distinguishing band steps finer than a measured rung; treating `targetElo` as the opponent's rating anywhere | D336 (the smallest resolvable step is ~150–208 band points) and D344 (*"`targetElo` must never be passed to a rating update directly"*) |
| **R4** | Any **per-move contribution** — accuracy, per-move rating delta, "performance rating for this move", a move-quality axis of any kind | A move verdict wearing arithmetic. ADR-0005 / law 8, and the named anti-pattern in `AGENTS.md` |
| **R5** | A rating in **reduced endgames** — <21 pieces at the start position | Transfer ≈0.07 at ≤10 pieces with CIs straddling parity; n = 48 at 11–20; and independently, 43 of 45 endgame positions **tied** between bands 1100 and 1900 (`maia-endgame-fidelity.md`, D381). The opponent's rating there is **unidentified, not merely imprecise** — so the update is *undefined*, which no widening of RD repairs |
| **R6** | **Pooling server-assisted with server-unassisted play** | Otherwise the rating measures the loadout. Assistance is browser-side (D389), so this is enforced by server refusal of the wire-crossing rungs and routes (§5.2, §10.2), never by trusting a declaration — **and it does not reach the browser-rendered remainder (§5.2) or anything outside the tab, which §7.4's fifth disclosure states rather than papers over** |
| **R7** | Publishing the number as an **external-scale equivalent** (FIDE / Lichess / Chess.com), or converting to one | The anchor is unmeasured; the whole calibration is engine-vs-engine |
| **R8** | Publishing a **point estimate outside the bracket or at score saturation** | §7.3. Report a bound instead |
| **R9** | Making the rating **purchasable, sellable, or a gate on content** | ADR-0007. D334's surviving distinction: winning may unlock convenience and variety, **never content** |
| **R10** | **REVERSED AND REPLACED by owner ruling 1, 2026-08-16.** Cross-learner comparison ships (§10a). What R10 now refuses is the three things the reversal did **not** buy: **(a) any standing that spans classrooms, including a global or all-learners table, at any size**; **(b) the rating as a sort key or a rank** — a standing may be *ordered* by results and *grouped* by rating, never ranked by it; **(c) any standing entry a learner did not publish by their own act**, including one derived from `classroom_members` alone | Each clause keeps the half of the old rationale that survived measurement, and drops the half that did not. (a) is Barth's finding read to its actual scope: *"For most players, the only thing a **global** leaderboard manages to tell you is that you suck (and not even by how much)"* (`fun-mechanics-outside-roguelikes.md:769-771`) `[P]` — a claim about global tables, not about a club of twenty. (b) is the instrument's own resolution floor applied to the display: the dossier's resolvable step is **60 Elo** (§3), so two members closer than that are not distinguishable however much either plays, and a rank asserts a distinction the instrument cannot make (§10a.4). (c) is `teacher-surface` §2.1's rule transposed — enrolment authorises addressing, never reading — and is why the standing needs its own consent rather than inheriting one (§10a.2). **The old rationale's cheating half is not dropped and not refuted; it is discharged as a disclosure obligation** (§7.4 obligation 6), because it was always a statement about our games rather than about our arithmetic (§8b) |
| **R11** | Rating a game containing a **rewind or fork**, rating more than one branch of a run, or rating the same run twice | `attempts` PK is `(run_id, branch_id)`, so a rewound run yields several results. Rating them would reward rewinding until you win |
| **R12** | **Any adjudication of an unfinished game — engine evaluation *and* tablebase probe** | Only `terminalOutcome` may seal. **Widened by cross-review:** the draft admitted a tablebase-exact seal; a tablebase result is a fact about the position *under optimal play*, not about the game, so it fails §1's own test, and Maia converts only 88.1–91.9% of won endgames in practice (§5.4). Owner may reopen it as a *disclosed adjudication* — Open question 9 |
| **R13** | Maia's own **expected score** `0.5 + cp/2000` as a rating input | `maia-wdl-versus-human-outcome.md` §9.5: the value head's band response carries **no information** about the band's outcome shift (Pearson 0.021–0.044, sign agreement 47.2–52.0%). Retained as a diagnostic only (§AC-8) |
| **R14** | Feeding the rating into **`/progress/recommendations`**, milestones, or scheduling | That would make it a weakness model driving content selection — a different product, and out of scope. Open questions Q5. R14 is also what keeps all three of `docs/return-and-progression.md`'s no-rating sentences true verbatim (§11.2) |
| **R15** | **The rating as an input to anything the product SAYS about a move, a position, or a run.** Named concretely: `learnerRating` (and every projection of it — `rating`, `rd`, band-equivalent, bracket position, `seed_band`, `period_no`) may not reach `apps/server/src/guard.ts`, `guard-conditions.ts`, `packages/runtime/src/voice.ts`, `outcome-presentation.ts`, `feedback.ts`, `objective.ts`, any `feedbackClaims` assertion argument, any voice/speech/reasoning-review packet, any `evalSwingCp` or guard threshold, any `corpusPopulation()` argument, or any pack-selection predicate that alters *what is said* rather than *what is offered* | **D395 — the blocker this cross-review was opened on.** `band-flattery-and-buried-value.md` §1/§3/§5.5: band-tuned flattery is unreachable today **only** because `learners` has no rating column and the guard has *"six conditions, six regressions, zero positive arms"* emitting *"a pointer to recorded evidence, never a word"*. **This RFC creates the conditioning variable**, so *"it cannot happen because the field does not exist"* stops being an argument on the day it lands. The invariant, in the dossier's own words: ***a rating may select WHAT a learner is shown — which pack, which band, which population — and may never appear as an input to WHAT IS SAID about a move they played. Selection, yes; rendering, never.*** Enforced as a reachability test, not a principle: **AC-11** |
| **R16** | **Evaluative, congratulatory or praise copy on any rating surface**, and routing any rating surface's text through the voice/LLM layer at all | **D393's fix does not reach here.** `BANNED_JUDGEMENTS` grew 19→30 words at `3e6fe2e` to cover the praise register (32 at HEAD) — but it is enforced by `voiceCheck`'s **containment test over LLM output only**, and `KEY_POINT_JUDGEMENTS` applies only to `ReasoningKeyPoint.phrases` and only when *every* word in a phrase is a listed one. **Authored prose has no vocabulary gate at all** (`band-flattery-and-buried-value.md` §5.2: `feedbackClaims[].text`, `objective.summary`, `PlanClass.description` — none). A rating surface's copy is authored, so it would be **the one new law-8 surface this RFC creates that no shipped guard covers** — the route-around, not the hole. Closed two ways: the rating surface emits only the §7.4 disclosure sentences and the numbers, from a frozen set; and **the denylist is run over that frozen set anyway** even though it is not LLM output. **AC-12** |

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

#### 8b. R10 reversed — the re-evaluation, and what survives it

**The ruling, 2026-08-16:** *"add leaderboards and cross-learner comparison… maybe local chess
clubs want to use us at some point? who knows… **add it properly, re-evaluate the refusal and why
it was there and what it unlocks**."* This section is the re-evaluation. §10a is the surface.

**R10 had three grounds. Two narrow; one survives whole; none was baseless.**

**Ground 1 — Barth. Narrows to *global*, and the narrowing is in the quotation itself.**
*"For most players, the only thing a **global** leaderboard manages to tell you is that you suck
(and not even by how much)"* (`fun-mechanics-outside-roguelikes.md:769-771`) `[P]`. The measured
harm is *unreachability at scale*: a table whose top is occupied by strangers you will never
approach. A named cohort of a club is not that object — and the league is the worked example, since
its own competitive unit is a **team of 8 boards**, nested inside a 44-team, **352-rostered**
season with a **121-deep bench** (`league-as-return-loop.md` §1.4, §5.1) `[V]`. **The thing that
makes a 352-player league bearable is that you actually play inside a group of eight.** So ground 1
does not die; it becomes **R10(a)**: no standing spans classrooms, and there is no all-learners
table at any size. The refusal was right about the thing it measured and was applied to a thing it
had not.

Barth's **second** sentence — *"Getting your name at the top of the leaderboards is a fantastic
incentive for cheating"* `[P]` — narrows to nothing at all. It is about incentive, not scale, a
cohort of twenty has it as much as a pool of twenty thousand, and it belongs to ground 3 rather
than to ground 1.

**Ground 2 — *"the population is the learner's own history, never other learners."* Narrows to a
default, and the reversal is what shows it was a default all along.** That constraint was inherited
from the return loop, where it is load-bearing because nothing in the return loop is consented to
by a second person. A standing is. The clause survives as **R10(c)**: a learner appears in a
standing because they published themselves into it, never because someone enrolled them.

**Ground 3 — self-cheating, and Barth's incentive sentence with it. Survives entirely, is the only
ground with observed evidence behind it, and is not dischargeable by design.**
`league-as-return-loop.md` §C1 records that the 4545
league's history has **cheating investigations affecting the final standings in Seasons 7, 8 and
17**, in some cases forcing tiebreakers to be re-applied, and that its ToS converts a mid-season
account closure into forfeit losses for the whole season `[V]`. Against that, this product's own
posture is explicit and shipped: *"it does not pretend to prevent a host from cheating on
themselves"* (`docs/live-sessions.md`, §Accepted limitation) `[V]`. **So the clearest real-world
instance of a ranked amateur chess table produced repeated scandals under supervision we do not
have.** Nothing in §10a fixes that, nothing in §10a claims to, and the reversal's entire price is
that the limitation is **stated on the surface rather than used as a reason not to build it** —
§7.4 obligation 6, at the four sites §10a.5 fixes.

**The distinction the league study offered — tested, and it does not survive.** That dossier's
proposed rescue was that R10 refuses *a manufactured skill number compared across people*, while a
standing merely *records what happened* — the `corpus_observed` class. **Applied to this RFC the
distinction dissolves, and it dissolves against §1.** §1's whole licence argument is that this
rating **is not a manufactured claim about the learner**: a Glicko-2 update reads a prior, a
measured opponent rating, and a score `terminalOutcome` produced, and *"a rating in this product is
arithmetic over rules facts… It says what happened, never what was good."* If that argument is
sound — and R15, R16 and the entire §8 table are built on it — then *manufacturedness* cannot be
what keeps the rating out of a table, because the rating is not manufactured. The distinction was
offered in good faith and it is the correct distinction for a *different* rating; **for this one it
proves too much.**

**What replaces it is sharper, and it changes the design rather than only the wording.** The
problem was never the arithmetic; it is the **provenance of the games the arithmetic reads**. A
4545 standing ranks games played under arbiters, moderators and an anti-cheat regime — and it was
*still* corrupted three times. Ours ranks games played alone, against a bot, in a tab we do not
police, with six of nine assistance axes unrefusable (§5.2, D389). **The defect is unwitnessed
games, not a manufactured number** — and relocating it from law 8 to provenance is what makes it
tractable, because a provenance defect has a disclosure and a design response where a law-8 defect
would have neither. Concretely it produces three rules that the manufacturedness framing would
never have generated:

- prefer forms whose value does not depend on being unfalsified — **marks and records over
  estimates**, which is why the honour roll is the default (§10a.3);
- state the provenance where the comparison is made, not in a policy page (§7.4 obligation 6);
- make *witnessed* play a thing a cohort could one day require rather than a thing we claim
  (**ruled 2026-08-22, [[D946]]: the seam is pinned** — §10a.2a).

**What it unlocks, which is the half the refusal never weighed.** The owner's ground is the club
and coach cohort, and the adjacent surface already exists: `rfc/teacher-surface.md` ships
`classrooms` and `classroom_members` with a consent model that survived two adversarial passes.
**A standing is not a new social object; it is a second read over one that is already consented
to.** That is the whole reason §10a is short. `league-as-return-loop.md` §7's verdict was
*import-don't-host* on a feasibility ceiling — C6, *"a league is the one return-loop mechanism
whose minimum input is a population"* `[V]` — and a classroom standing is the version of the
mechanism whose minimum input is **one club**, which is the population a coach brings with them.

**And the honour roll is now a presentation option, not a compromise — so the question is whether
it is the default.** It is (§10a.3), and the reason is not deference: **it is the only form that is
publishable on day one.** §7.2 withholds a point estimate until RD ≤ 60, which needs ≈34 rated
games at parity and ≈67 at the skirt (§7.3); a rating column in a new club's standing is therefore
empty for every member for weeks. Marks and records are built from **sealed events**, so they are
populated from the first game. **The form that is honest about the instrument and the form that
actually works on day one are, for once, the same form** — which is why the honour roll stops being
a compromise the moment it stops being a fallback.

**ADR-0007 and D334 are checked against the standing explicitly and it clears both.** No standing
position, mark or rank may unlock content, be purchased, or be sold; a mark is earned by playing,
per `06` §3 law 2. `league-as-return-loop.md` §C2 supplies the calibration and the boundary: 4545
pays nothing and its `SeasonPrize` model *"has no monetary field anywhere"* `[V]`, while its
alternate-queue priority is **convenience gated on conduct** — inside D334's *"convenience and
variety, never content"* envelope — and the dossier's own note is that **priority gated on
*results* would not be** `[V]`. §10a.6 refuses that case by name.

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

**Re-verified 2026-08-22 against the tree rather than against this draft:**
`STORAGE_VERSION` is **24** (`apps/server/src/storage.ts`), landed by
`archive/teacher-surface.md`. This RFC holds the next position — *no longer as the only active
claimant* (cross-review 2026-08-22): `rfc/longitudinal-store.md`, accepted 2026-08-22, claims
the position **behind** this one, and `rfc/archive/portable-account-data.md`, now implemented,
obliges this migration to **add its six tables' deletion-inventory entries as part of its own
schema guard** (its §1 queues `learner-rating` by name). It carries **two independent table sets**: the rating's three (§10.1) and the
standing's three (§10a.7). They land in one migration body because they land in one commit; if
the owner later splits the standing into its own RFC, the register must split the claims before
either implementation begins. `feedback-delivery` and `graduation-clearance` claim no migration
position.

Body: **create-table/index only. No backfill, no snapshot rewrite, no stamp.** Nothing historical
is rated — every historical run was played under an unknown assistance state against an
unrecorded ceiling, and retro-rating it would manufacture exactly the fiction §1 refuses. Also
note for the register: `live-session.test.ts:29` asserts `STORAGE_VERSION` literally, so the bump
edits that test. *(The draft's note that it read `toBe(22)` against 23 is resolved: at HEAD it
reads `toBe(24)` and matches. The bump will edit it again.)*

#### 9.2 Pack schema — **none.**

Nothing about a pack changes. Rated-eligibility is *derived* (§3) from the run's opponent policy,
start material and assistance state — never authored. **And owner ruling 2 does not change that**:
a boss is a `position` session, so the ruling adds no pack field, no `authoredBoundary` variant and
no boss flag (§5.3a). `DRILL_PACK_SCHEMA_VERSION` reads **"0.27"** at this round
(`packages/schema/src/index.ts`) `[V]`, unmoved. *The cross-review's note that 0.28 is "unclaimed"
is now stale in the other direction: `opponent-contracts` did release it (D385), and
`rfc/graduation-clearance.md` has since **claimed and kept** 0.28 for `$defs/graduationEntry` —
its §7 verdict reads "**keep 0.28**" `[V]`.* This RFC claims no pack lane, releases none, and
contests `graduation-clearance`'s not at all.

#### 9.3 Run schema — **none.**

*The draft claimed `DRILL_RUN_SCHEMA_VERSION` is **"0.16"** and that "0.17 stays free". Both moved
under it: the constant reads **"0.17"** (`packages/schema/src/index.ts`) `[V]`, re-verified
unmoved this round — `opponent-contracts`' `orderingBasis` landed — so the next free lane is 0.18
and this RFC does not want it either.* No new event type and no widened field. **Owner ruling 2
does not want one either**: a boss is a game, and a game is a `position` run, which is a shape the
0.17 schema already describes. **Owner ruling 1 does not want one either**: a standing reads
`rated_games`, and `rated_games` reads the event log. The rating is a **projection**, not drill
content; the run event log stays the source of truth and `rated_games` is a materialised read over
it. This also avoids the `RunStorage.list` filter (`WHERE r.schema_version = ?`) that any run bump
would force a stamp migration for.

**And it is a safety property, not only a scoping one** — see §8a mechanism 2. A rating that never
enters a run event, a run snapshot or an engine request cannot reach a renderer that reads them,
which is half of R15 discharged by the register claim rather than by discipline.

#### 9.4 Shape-entry schema — none. `/capabilities` — **two** additive `reached` entries and three `refused`, one of them narrowed rather than deleted (§10.4).

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
*(Checked against `rfc/archive/portable-account-data.md`: hard-delete is that RFC's
class for records that strand nothing and mint no authorization, which these are — a standing
entry hard-deleting on account deletion is the same semantics as §10a.7's withdrawal-is-a-DELETE,
i.e. the ultimate withdrawal, and a mark means nothing without the account. The migration adds
the deletion-inventory entries §9.1 records as owed.)*

Literal CHECK strings, per the migration-9 freeze lesson recorded in `rfc/README.md:133`.

**`tablebase_exact` is removed from `terminal_reason`** by cross-review (§5.4, R12). The five
values that remain are exactly the four `terminalOutcome` branches, with `isEnd`-not-checkmate
split into its two rules causes (stalemate and insufficient material — *"three" corrected to
"two" by cross-review 2026-08-22; 4 branches with one split into 2 is the 5 the CHECK carries*).

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
`/reasoning-review`, **and (added by cross-review 2026-08-22) `/reveal` and `/analysis`** —
refuses with the shipped `ASSISTANCE_WITHHELD` when the run has an `open` `rated_games` row.
**The two additions close a route the draft's enumeration missed:** `service.analysis` enqueues
engine `bestline`/`eval`/`wdl` evidence on any node behind `#forWrite` alone, and
`feedbackDeliveryOpen()` opens the `/evidence` read on a `feedback.revealed` event — so without
them a rated run could reveal mid-game and read Stockfish lines through routes R6 never named.
Belt and braces on the same hole: **`POST /rated-games` pins `feedbackPolicy: "attempt_end"`**,
under which delivery opens only at `outcome.reached` — after the seal, when the assist can no
longer precede a rated move. The browser-rendered remainder is outside this ceiling by
construction (§5.2).

#### 10.3 Voiding

`RunService.#project` already runs on every run mutation (`service.ts`, locate by name; called
from **thirteen** sites at HEAD — "ten" was true when written and moved under the draft). The rated-game
projector hangs off it: on `run.rewound` or a second branch → `state='voided'`; on
`outcome.reached` on the single branch → `state='sealed'` with the result and terminal reason; on
engine identity mismatch in any `opponent.move_selected` → `state='voided'`,
`void_reason='engine_changed'`. A game left `open` past 30 days is voided as `'abandoned'` and
counted in `abandoned_games`.

#### 10.4 `/capabilities`

Two additive `reached` rows and three `refused`, all following the register's own
recording-vs-grading predicate. The first `reached` row:

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
{ instrument: "Glicko-2", capability: "cross-learner comparison outside a joined cohort",
  disposition: "refused",
  reason: "A standing spans one classroom the learner published themselves into; there is no global table" },
```

*The third entry was `"cross-learner comparison of the rating" / "The population is the learner's
own history"` before owner ruling 1. It is **narrowed, not deleted**, and it is narrowed in the
register rather than in prose so the reversal is machine-readable in the same place the refusal
was.* One further `reached` entry is added for the surface the ruling opens:

```ts
{ instrument: "Glicko-2", capability: "cohort standing over rated results",
  disposition: "reached",
  reason: "Results, marks and grouped ratings for learners who published themselves into one classroom; the games are unwitnessed and the surface says so",
  surface: "standing" },
```

### 10a. The cohort standing — the surface R10 used to refuse

Owner ruling 1. §8b is the re-evaluation; this is the specification. **It is short because it
adds no social object** — every question about *who these people are to each other* was answered
by `rfc/teacher-surface.md` and is not reopened here.

#### 10a.1 Objects and vocabulary

- **Cohort** — a `classrooms` row (`rfc/teacher-surface.md` §3.2). Not a new object, not a
  league, not a global pool. **A standing spans exactly one classroom and never two.**
- **Standing** — at most one per classroom, opened by a teacher of that classroom, over a
  declared window.
- **Entry** — one learner's presence in one standing, created **only** by that learner.
- **Record** — a member's sealed rated games in the window as W/D/L by opponent band. A rules
  fact, `corpus_observed`-class.
- **Mark** — a permanent, event-derived, unordered badge (§10a.3). No number.

#### 10a.2 Consent — reused, not duplicated

`teacher-surface` §2.1's model is two objects, never one: a **grant** is about a run, an
**enrolment** is about a person, and *"what it does not authorise"* for an enrolment is
**reading anything at all**. That table decides this design without further argument:

**A standing is a reading surface, so enrolment cannot authorise it.** A learner in a classroom
has consented to being *addressed* — assigned to, invited — and to nothing else. Displaying their
results to the other members is reading, so it needs the shape `teacher-surface` gave to reading:
the **submission** shape (§2.2), which is *specific, explicit, enumerable, revocable, expiring*.

So, transposing that RFC's normative rule verbatim in form:

> **No code path may derive a `standing_members` row from a `classroom_members` row alone.**
> The only writer of standing entries is `POST /cohorts/:id/standing {op:"publish"}`, whose
> actor is the **learner**, on themselves.

The five submission properties, each honoured:

| `teacher-surface` §2.2 property | Here |
|---|---|
| **specific** | one classroom's standing, not "standings" |
| **explicit** | a POST the learner makes; never a side effect of enrolling, of playing, or of a teacher's action |
| **enumerable** | `GET /cohorts/:id/standing` lists every entry with its handle, so a member can always see who can see them — the §2.4 requirement, met by the same mechanism |
| **revocable** | `{op:"withdraw"}` by the entrant at any time, with no teacher veto; withdrawal removes the entry and its record from the standing immediately |
| **expiring** | an entry does not outlive the standing's window, and a `left` enrolment (`classroom_members.state`) withdraws it automatically |

**A teacher may open a standing and may not enter anyone into it, including themselves by
default.** That asymmetry is `teacher-surface` §2.1's *"who may create / who must consent"* row,
unchanged. **No new `RunRole`, no fourth `member_role`, no new `public_tokens` scope, no
anonymous join** — the same four negatives `teacher-surface` §3.2 already holds.

**What this RFC does not touch:** `run_grants`, `assignments`, `assignment_submissions`,
`permittedAssistance`, and the grant-expiry rule of `teacher-surface` §4.3. A standing entry mints
**no grant** and confers **no read on any run** — a member sees another member's *counts and
marks*, never their games, their branches, their events or their evidence. Seeing a game still
requires a grant, minted the way it already is.

#### 10a.2a The witnessed-play seam — pinned by owner ruling, not implemented

**RULED 2026-08-22 ([[D946]]): witnessed play is a thing a classroom/club cohort may one day
REQUIRE for its standing.** The contract pins the seam now, beside the consent model above,
because it is cheap to pin and expensive to retrofit: a cohort-level standing option under which
only games played inside a live session with at least one spectator grant — the shipped
`run_grants` / live-session machinery, **no new mechanism** — are admitted to that cohort's
standing, turning §10a.5's *"nobody witnessed them"* from a global caveat into a per-cohort
choice. **The default stays not-required** (the honour roll remains the default layer per
§10a.3), and **nothing is implemented until a real cohort exists** — the ruling reserves the
seam; it commissions no table, no route, no validator. When a cohort RFC builds it, the admission
predicate joins this section's normative rule as a second reading-surface condition, and the
§10a.5 disclosure sentence gains its per-cohort variant.

#### 10a.3 What a standing shows — three layers, and the default is the first

**Layer 1 — Marks. Default, always on, and the only layer that is populated on day one.**
The honour-roll form from `league-as-return-loop.md` §1.5: *"Gold indicates previous 1st place
finishers. Silver… Bronze…"* — *"a result in season N marks your name in every future season's
table"* `[V]`. Permanent name shading, **no number, no ordering, no ranking**.

**One deliberate divergence from the precedent, and it is the point:** 4545's shading is
**placement-derived**, and placement is an ordering. Ours is **event-derived**, so no mark is a
function of anyone else's result:

| Mark | Earned by | Class |
|---|---|---|
| bronze | first **sealed rated win** against band 1400 | rules fact |
| silver | first sealed rated win against band 1800 | rules fact |
| gold | first sealed rated win against band 2200 | rules fact |

Each mark records `(run_id, calibration_id, earned_at)`, is permanent, and **survives calibration
retirement** — it is a record that a game happened, and retiring the instrument does not un-happen
it. The `calibration_id` travels with the mark so the copy can name which instrument it was earned
against.

**Normative: a mark is not a milestone and does not render in the milestone list.** They are the
same object *class* and must stay different objects, because
`docs/return-and-progression.md:48-49` says of milestones that *"they never add a skill
percentage, score, streak, rating, ranking, or **cross-learner comparison**"* `[V]` — and a mark
does appear in a cross-learner comparison. Keeping the surfaces apart is what keeps that shipped
sentence true verbatim after owner ruling 1; merging them is what would break it (§11.2).

**Two honesty constraints on mark copy, both non-negotiable.** (a) A mark names **the event**,
never a level: *"beat band 2200 on 2026-09-01"*, never *"reached 2200"* — the first is a rules
fact, the second is the band-equivalent wearing a mark's clothes and is refused by R10(b) and R3.
(b) **A mark is not rare and must never be presented as rarity.** From the calibration's own
ladder, band 2200 scores **0.8431** against the band-1400 reference
(`derived.json` → `fullMaterialLadder`, key `ladder-2200-v-1400`; orientation corrected by
cross-review — the draft had the reference scoring 0.8431) `[V]`, so a learner at the 1500-BCS
origin takes roughly **one game in six** (1 − 0.8431 ≈ 0.157) off band 2200 and the gold mark is
expected within a handful of attempts. It
is a participation record, and `06` §3 law 5 — *"Rarity is not value"* — is the standing law that
says so.

**Layer 2 — Record. Opt-in with the entry, and the layer a club actually wants.** Per member:
rated games sealed in the window, W/D/L, split by opponent band, plus the abandonment count
(§7.4 obligation 3, which does not stop applying because the surface got wider). Every cell is
`attempts.result` counted — nothing derived, nothing estimated.

**Layer 3 — Rating. Opt-in separately, per member, off by default, and shaped by §7.2 before it
leaves the server.** A member whose §7.2 state withholds a point estimate has **no rating cell** —
not a blank, not "provisional", not a dash that sorts: the field is absent (AC-9's rule, applied
here). Where present it is the band-equivalent **with its interval**, never bare.

**Why layers 1 and 2 are the default and layer 3 is not** — §8b's argument, restated as the rule
an implementer follows: **RD ≤ 60 needs ≈34 rated games at parity and ≈67 at the skirt (§7.3), so
in a new classroom every rating cell is absent for weeks.** A surface whose default view is empty
teaches its users that it is broken. Marks and records are sealed-event counts and are populated
from the first game.

#### 10a.4 Ordering — rank by results, group by rating

**The standing is ordered by a rules fact, and never by the rating.** The default ordering is
league-shaped and needs no invention: **game points (1 / ½ / 0) over the window, tiebroken by
games played, then by handle** — 4545's own first two tiebreak keys `[V]`, minus the ones that
need a pairing structure we do not have. Every input is a count of sealed results.

**The rating groups, it does not rank.** Where layer 3 is shown, members are placed into the
calibration's own resolvable steps — **≈150 band points at full material** (60 / 0.400, §3) —
and within a group they sit in the standing's result order. **No rank number is derived from the
rating, and no two members are ever ordered relative to each other by it.**

**The reason is measurement, not modesty, and it holds in two independent ways.**

1. **The instrument's floor, which no amount of play removes.** The dossier's resolvable step is
   **60 Elo** (§3, `derivedThresholds.rungElo`) and the calibration's own rung deviation is
   **24.1** (§4.1). Two members within 60 BCS of each other are **not distinguishable by this
   instrument at any RD**, so an ordering between them is asserted, not measured. This is R3 and
   §7.2 applied to a display: **where the instrument cannot resolve, the product does not print.**
2. **The published interval, which is at its widest exactly where a new cohort sits.** §7.1
   publishes `rating ± 2·RD` and the publication floor is RD ≤ 60, so a member who has just become
   publishable carries **±120 BCS — ±300 band points after the inverse transfer** (§7.1's
   inflation). In a new classroom that is every member who has one at all, so a ranked table would
   be at its most confident-looking precisely when it is least resolved.

AC-14 makes both a test rather than a convention, and states the falsifiable form: **permuting
every member's rating must not change the returned order by one byte.**

#### 10a.5 Where the self-cheating limitation is stated — four sites, all normative

R10's surviving ground (§8b, ground 3) is discharged here or it is not discharged at all.

1. **On the standing itself**, as a permanent line in the view — not a tooltip, not a footer link,
   not behind a disclosure toggle. Same posture and same register as `docs/live-sessions.md`'s
   own **§Accepted limitation** heading, which states *"it does not pretend to prevent a host from
   cheating on themselves"* `[V]`. The standing's line says the corresponding thing about games:
   **these games were played alone against a bot and nobody witnessed them.**
2. **At the publish gesture**, in the confirmation, so the consent in §10a.2 is *informed* consent
   about what the entry is worth as well as about who can see it.
3. **In `§7.4` as obligation 6**, which makes it fire on every multi-learner surface rather than
   only on this one — so a later surface inherits it instead of re-deciding it.
4. **In `/capabilities`**, as the `reason` on the `cohort standing over rated results` row
   (§10.4). This is the machine-readable site, and it is the one that stops the limitation being
   quietly dropped in a redesign — the same job the three `refused` rows do for R2, R15 and
   R10(a).

**Stated, and not overstated.** The line says the games were unwitnessed. It does **not** say the
standing is meaningless, and it does not accuse anyone: `league-as-return-loop.md` §5.1 records
that the mechanism it is modelled on converts at **92–95%** with honest play being the
overwhelming norm `[V]`. The honest posture is the product's usual one — say what the instrument
can and cannot support, then let the reader decide.

#### 10a.6 The standing's own refusals

Each is a clause of R10 or of a standing law, and each is a test (AC-13 – AC-16).

| Refused | Because |
|---|---|
| Any standing spanning more than one classroom; any global, all-learners, regional or cross-cohort table; any "you are ahead of N learners" computed outside a classroom | R10(a). Barth's finding is about global tables and this is where it binds |
| Rating as a rank, a sort key, a seed, a section boundary or a tiebreak | R10(b), §10a.4. Overlapping intervals; the ordering would assert what the instrument cannot resolve |
| Any entry the learner did not create; any teacher-created, admin-created or inferred entry; any entry derived from `classroom_members` | R10(c), §10a.2, transposing `teacher-surface` §2.1 |
| A standing position, rank or mark **unlocking content, or being purchased or sold** | **ADR-0007**, and D334's surviving distinction. `league-as-return-loop.md` §C2 marks the boundary precisely: 4545's alternate-queue priority is *convenience gated on conduct* and inside the envelope, while **priority gated on results is not** `[V]` — so a standing may never buy a rung, a pack, a rating advantage or queue position |
| A member's runs, branches, events or evidence, from the standing | A standing is counts and marks. Seeing a game needs a grant, minted by its host, unchanged |
| Any cohort statistic that is an estimate rather than a count — cohort mean rating, percentile, z-score, "top 10%" | §7.2's discipline does not weaken because the population changed. A mean of mostly-absent point estimates is a number about nothing |
| Rating any member's games differently because they are in a standing | R15. A standing is a **read** over `rated_games`; being in one changes no update, no opponent, no precondition |
| Evaluative or congratulatory copy anywhere on the standing, and any routing of standing copy through the voice/LLM layer | R16. A standing is the most tempting praise surface this product has ever had, and it is authored copy, which `BANNED_JUDGEMENTS` does not reach ([[D421]]) |

#### 10a.7 Storage and routes

```sql
CREATE TABLE cohort_standings (
  classroom_id TEXT PRIMARY KEY REFERENCES classrooms(id) ON DELETE CASCADE,
  opened_by_learner_id TEXT NOT NULL,
  window_from TEXT NOT NULL,
  window_to TEXT,
  opened_at TEXT NOT NULL,
  closed_at TEXT
) STRICT;

CREATE TABLE standing_members (
  classroom_id TEXT NOT NULL REFERENCES cohort_standings(classroom_id) ON DELETE CASCADE,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  show_record INTEGER NOT NULL DEFAULT 1,
  show_rating INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL,
  PRIMARY KEY (classroom_id, learner_id)
) STRICT;

CREATE TABLE learner_marks (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  mark TEXT NOT NULL CHECK (mark IN ('bronze','silver','gold')),
  calibration_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  earned_at TEXT NOT NULL,
  PRIMARY KEY (learner_id, mark)
) STRICT;
```

Notes, each load-bearing:

- **`show_rating` defaults to 0 and `show_record` to 1**, which is §10a.3's default expressed
  where it cannot be forgotten by a client.
- **Withdrawal is a `DELETE`, not a tombstone.** A withdrawn entry leaves nothing behind; the
  learner's `rated_games` are untouched, because the standing never owned them.
- **`ON DELETE CASCADE` against `learners(id)` here, which diverges from `teacher-surface`'s bare
  `TEXT` posture, and the divergence is deliberate.** That RFC avoids the FK because its §4.1a
  found cascading from `learners` **strands grants**. A standing entry and a mark strand nothing:
  they mint no authorization and mean nothing without the account, so deleting the account should
  delete them — which is §10.1's own posture, applied consistently within this RFC.
  `opened_by_learner_id` is bare `TEXT` for the opposite reason: a standing outlives the teacher
  who opened it.
- Literal CHECK strings, per the migration-9 freeze lesson (`rfc/README.md`).
- **No cached string, label or ordering is stored.** The standing is computed at
  `GET /cohorts/:id/standing`, for the same reason §10.1 refuses a denormalised band-equivalent:
  a stored rendering is a rendering a later surface can pick up without passing through §7.2.

| Method + path | Behaviour |
|---|---|
| `POST /cohorts/:id/standing` `{op:"open"\|"close"\|"window"}` | **Teacher of that classroom only.** Configures the standing. Creates and enters nobody |
| `POST /cohorts/:id/standing` `{op:"publish"\|"withdraw"\|"showRating"\|"hideRating"\|"showRecord"\|"hideRecord"}` | **Acts on the caller, always.** No `handle` parameter exists on these ops, which is R10(c) enforced by the absence of the argument rather than by a check |
| `GET /cohorts/:id/standing` | The standing, **shaped by §7.2 server-side per member** before it leaves. Requires an `active` `classroom_members` row; a non-member gets the same not-found response an unknown classroom gets |
| `GET /marks` | The caller's own marks |

All behind `authenticate()` → `Principal`, like `/progress` and like §10.2's three routes.
Caps mirror `teacher-surface` §3.2's, which mirror the shipped `mintLink` bounds: a standing
inherits its classroom's 200-member cap and adds none of its own.

**The standing is its own client surface and is not `/learn`.** R14 keeps the rating off the
return loop's three surfaces and §11.2 shows all three shipped no-rating sentences survive because
of it; rendering a standing inside `/learn` would break the third one (*"This is an attempt history
and return queue, not a mastery score"*, `App.svelte`) by placement alone. The classroom is the
standing's home, alongside `teacher-surface` §7.2's assignment card.

Field names and the `disposition` domain are read off `CapabilityDisposition`
(`apps/server/src/capabilities.ts:103-112`: `instrument`, `capability`, `disposition`, `reason`,
optional `surface` / `experiment` / `advertisedOptions`; `disposition` ∈
`"reached" | "refused" | "unmeasured" | "impossible"`) `[V]`. The second entry is R15 made
machine-readable, which is the third of §8a's mechanisms.

## 11. Coordination

### 11.1 Sibling RFCs

*Statuses re-derived at cross-review, and again this round; two more had moved. Re-derived a
third time by independent cross-review 2026-08-22: `opponent-contracts` is **implemented and
archived**; `graduation-clearance` is **accepted 2026-08-17**; and five RFCs accepted 2026-08-22
now interact and are added below the table.*

| RFC | Overlap | Resolution |
|---|---|---|
| `archive/teacher-surface.md` (**implemented**) | **A hard dependency, not only a migration neighbour.** §10a's standing is scoped to its `classrooms` / `classroom_members` and transposes its §2.1/§2.2 consent model rather than inventing one. Still: migration ladder, `/learn`, and its ownership pin on `permittedAssistance` | This RFC takes the next migration position after it — a **correctness** requirement, not a courtesy: §10a.7's tables carry a foreign key into `classrooms`. `permittedAssistance` is untouched (§5.2), so the pin is not contested. The `/learn` collision is **not** doctrinal — §11.2 |
| `pack-graduation.md` (**implemented 2026-08-16, `rfc/archive/`**) | **None.** All its state is pack-scoped; pack 0.27 has landed | Nothing to negotiate |
| `opponent-contracts.md` (**implemented 2026-08-16, `rfc/archive/`** — "implementing" at the author round; it moved a third time) | **Migration ladder.** Its run 0.17 has **landed**; its pack 0.28 claim was **released** by its own cross-review (D385); its header marks its migration position **CONTESTED** | This RFC claims no pack and no run lane, so it contests neither. On the migration it lands **behind** this one too (§9.1) |
| `graduation-clearance.md` (**accepted 2026-08-17** — "draft" at the author round) | **Pack lane 0.28** — which the cross-review recorded as unclaimed. It is claimed: that RFC's §7 verdict is *"keep 0.28"* for `$defs/graduationEntry` `[V]` | **No collision.** This RFC claims no pack lane (§9.2). It claims no migration position either, so it is not on the ladder |
| `archive/engine-leverage.md` (implemented) | Its `searchBound` record on `SelectionEngineIdentity` (`packages/runtime/src/types.ts:99`, `{ kind: "nodes" \| "movetime"; value: number }`) is what a future `strong_engine` rung would need (Open questions Q3) | Read-only dependency |
| `measurement-records.md` (draft) | **None structurally**, but D392's lesson binds here: no acceptance criterion in this RFC pins a version integer | Adopted (§9.1) |

**Added by independent cross-review 2026-08-22 — the five same-day acceptances:**

| RFC | Overlap | Resolution |
|---|---|---|
| `campaign-core.md` (**accepted 2026-08-22**) | Its Discharge D1 owns the deferred rated boss and absorbs [[D945]]'s rated-when-clean reading *"once `learner-rating` is accepted"*; its §2 is the earned-rewind mechanism §5.3a consequence 4 cites | Consistent both directions: its §3.4 defers the rated boss to D1; this RFC's condition-3 note routes the persona/`targetElo` disjointness to the same D1. This RFC's acceptance is what unblocks it |
| `bot-policy.md` (**accepted 2026-08-22**) | `RunOpponentPolicy.profile` **mutually exclusive** with `targetElo` (its §"profile" rules) — the ground of [[D962]] | Recorded at §3 condition 3 without foreclosing either arm; nothing else touched |
| `longitudinal-store.md` (**accepted 2026-08-22**) | Claims the migration position **behind this RFC** (its register row names the grammar). Its store is decision-grained (`decision_class`); the rating never reads it — the rating's only outcome input is `attempts.result` on runs created by `POST /rated-games`, so `game`/`predicted` decision classes cannot pool into an update | No collision; the ladder order is register-recorded (§9.1) |
| `archive/portable-account-data.md` (**implemented 2026-08-23**) | Owns deletion/export semantics; its exhaustive-inventory guard requires this RFC's new tables to declare dispositions at landing | Obligation absorbed: §9.1 records the inventory entries as part of this migration's schema guard; §10.1 records why CASCADE hard-delete is the correct class for these six tables |
| `intent-presets.md` (**accepted 2026-08-22**) | Compiled assistance contexts and the universal rules floor (`boardLighting` never below `"legal"`) | No interaction needed: the rated refusal is route-layer, outside `permittedAssistance` and outside preset compilation; the rules floor is *mandatory* rendering, which strengthens §5.2's claim that the browser-rendered remainder is not refusable. A rated run needs no context of its own |

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
  (`App.svelte:803` at HEAD — the draft cited `:741`, the cross-review `:746`; locate by the
  sentence, it keeps moving), reasserted
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

**Owner ruling 1 puts one of the three sentences under real pressure and it still holds — but
only because of a design choice §10a had to make deliberately.** `docs/return-and-progression.md`
`:48-49` says milestones *"never add a skill percentage, score, streak, rating, ranking, or
**cross-learner comparison**"*, and §10a.3's marks are, in the league dossier's own words, *"the
same object class as our shipped milestones"*. If a mark rendered **in the milestone list**, that
sentence would become false — not by the standing existing, but by the milestone surface acquiring
something that appears in a cross-learner comparison. **So marks are a separate object and do not
render on the milestone surface**, and that is a normative clause of §10a.3 rather than an
implementation preference. Recorded here because it is the one place ruling 1 came within one UI
decision of contradicting shipped doctrine, and because the cheap-looking alternative — *"marks are
just milestones, put them in the list"* — is the one that breaks it.

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
  three of nine axes are refusable whole, `spoken`'s provider tier joins them at v4, and the
  browser-rendered remainder is not (§5.2, recounted 2026-08-22) — rather than implying a
  whole-loadout claim.
- *"The campaign has four offerable rungs today, not five to nine"* — landed as **D390**.

**And one row now blocks this RFC rather than being proposed by it:**

- **D395** — *"PIN THIS BEFORE `learner-rating` LANDS: a rating may select WHAT a learner is
  shown, never be an input to WHAT IS SAID about a move they played."* **Answered by this
  cross-review as R15**, with the enforcement in §8a and the test in AC-11, and R16 alongside it
  for the `BANNED_JUDGEMENTS` route-around D393's fix does not reach. The row can flip to closed
  **when the RFC is accepted with R15 and R16 intact** — not before, since the invariant's whole
  point is that it must exist before the conditioning variable does.

**Status reconciliation, cross-review 2026-08-22 — most of the list has landed.** The register
row's own citations settle it: items **4, 5, 6, 8** landed as **[[D420]]–[[D423]]** (D423 has
since been **closed** by `shared-resource-registers`, which built the claimant-counting register
the item asked for) and items **9–15** landed as **[[D437]]–[[D443]]**. Item **3** is
substantially covered by an existing 2026-08-15 row (*"No run-level verdict exists —
`attempts` is per branch"*). Still genuinely proposed at HEAD: **items 1, 2 and 7** — plus the
addenda the preamble above records against D388/D389/D423. The list below is preserved as the
record of what was proposed:

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
   *claimants* on a position, not only the position. **Landed as [[D423]]; addendum owed** —
   counting by *document* undercounts, because this RFC now carries two independent table sets and
   is the **fourth claim** on the ladder (§9.1). The register should count claims.

**Proposed by this author round (owner rulings 1 and 2):**

9. **New 💡 — R10 is reversed; cross-learner comparison ships as the cohort standing.** Owner
   ruling 2026-08-16: *"add leaderboards and cross-learner comparison… add it properly,
   re-evaluate the refusal and why it was there and what it unlocks."* Specified in
   `rfc/learner-rating.md` §10a: one standing per classroom (never across), entries created only
   by their subject, **ranked by results and grouped — never ranked — by rating**, honour-roll
   marks as the default layer, and the unwitnessed-games limitation stated at four normative
   sites. Unlocks the club/coach cohort by reading `teacher-surface`'s classroom rather than
   inventing a social object. **This row supersedes the leaderboard clause of R10 as drafted; it
   does not supersede R10, which survives as three narrower clauses.**
10. **New 🐞 — *"a manufactured number vs. a record of what happened"* does not separate this
    rating from a leaderboard, and it fails against our own licence argument.**
    `league-as-return-loop.md` §C1 offered it as the rulable distinction. But
    `learner-rating` §1's whole licence is that a Glicko-2 update over `terminalOutcome` results
    **is not manufactured** — *"it says what happened, never what was good."* Both cannot hold. The
    distinction is correct for a rating built on move grading and **proves too much** for one built
    on rules facts. **The defect that actually justified the refusal is provenance — the games are
    unwitnessed — and relocating it there is what makes it addressable** (disclosure, and a
    possible witnessed-play cohort option) rather than a law-8 argument with no remedy. Generalises:
    *before refusing a surface on the ground that a number is manufactured, check whether the
    document doing the refusing has already argued that it is not.*
11. **New 💡 — a campaign boss is a full game, not a pack (owner ruling, 2026-08-16).** Answers
    `learner-rating` open question 1 by changing the boss rather than the rating: a boss runs to a
    rules-terminal result as a `position` session and rates like any other game
    (`rfc/learner-rating.md` §5.3a). **Consequences owed to `design/06-campaign.md`** (law 5;
    landed 2026-08-22, [[D836]]): §5's encounter vocabulary gains an encounter not bounded by `plyHorizon`; the rated
    boss is **Act II only** — Act I is refused by `THEORY_NEEDS_AUTHORED_BOUNDARY` /
    `BOUNDARY_NEEDS_PLY_HORIZON` and Act III by R1 and R5, so **the campaign's climax act is the
    one that cannot carry a result**; §2a gains a fourth difficulty-availability class; §2b should
    say which of its three bosses can be a game; and §5's *"36 of 37 packs declare a `plyHorizon`,
    median 12"* is **50 of 56, median 11** at HEAD `[V]`.
12. **New 🐞 — the pack corpus already claims a terminality it does not deliver.** **26 of the 56
    packs under `content/drafts/` declare `objective.grading.resolveAt.kind: "terminal"`, and 25
    of them also declare an `authoredBoundary.plyHorizon`** — twenty at 7–13 ply `[V]`. The
    horizon is what fires; the declaration is decorative on those 25. Nothing in
    `apps/server/src/pack-validation.ts` objects to the pair, though it already validates near
    neighbours (`TRAJECTORY_NONFINAL_TERMINAL_RESOLUTION`). **Cheapest guard is one lint rule:
    `resolveAt: terminal` and a `plyHorizon` on the same object is a contradiction.** Found while
    specifying the boss ruling, which is the first encounter that needs the declaration to be true.
13. **New 🐞 — `learner_marks` and milestones are the same object class and must not become the
    same surface.** `docs/return-and-progression.md:48-49` says milestones *"never add a skill
    percentage, score, streak, rating, ranking, or cross-learner comparison"* `[V]`, and a standing
    mark **does** appear in a cross-learner comparison. Rendering marks in the milestone list would
    falsify a shipped doctrine sentence by a UI decision that looks like tidying. Pinned in
    `learner-rating` §10a.3 and §11.2; ledgered because the same trap exists for any future badge.
14. **New 🐞 — "the minimum across models" is undefined over intervals, and a period-structured
    simulation with no arrival rate is underspecified.** Both are residue of [[D420]]'s fix in
    `learner-rating` AC-7: the rule is now the **intersection** (a grid point is in the bracket
    only if it clears the null under every model) and F-W must run **at least two arrival rates**,
    one count-closing and one clock-closing, because §6.3 closes a period on *"12 games or 7 days"*
    and which clause fires is entirely a function of how fast the learner plays. **The
    clock-closing arm is the one that matters and nobody has run it:** whether a learner playing
    three rated games a week ever reaches RD ≤ 60 is unanswered, and the publication rule makes it
    the difference between a product with a rating and a product with a permanently provisional
    one.
15. **New 🐞 — [[D424]] had a fourth site, and it was the most dangerous one.** The cross-review
    fixed §2, §4.2 and §7.3 qualification 2. §7.3 qualification **3** still reported *estimable
    window ÷ journey = **1.09*** with no caveat attached — **a ratio above 1 reads as "it fits",
    and the same arithmetic puts the journey's floor 6 points outside the window.** A width ratio
    is not a containment claim. Fixed in place; ledgered because *"the caveat survived in three of
    four sites"* is exactly the decay D424 describes, observed one round later in the document that
    recorded it.

## Deviations from design

1. **`design/06-campaign.md` §2b states Maia's usable band as `[1000, 2400]` with no
   magnitude.** This RFC uses `[1000, 2200]` for rated play and refuses 2400 on D338. That is not
   a contradiction of §2b — §2b bounds *distinguishability*, correctly — but the doc does not
   carry the ratio or the ceiling. `DESIGN-GAP:` already escalated by
   `maia-band-outcome-transfer.md` §1 and the exploration log; **not acted on here (law 5)**.
2. **`design/06-campaign.md` §5's acts escalate in decidability, and rated play is available in
   exactly one of the three tiers.** Act I (`theory_strict`) and Act III (`perfect_tablebase`)
   have no calibrated band, so the campaign's ladder and the rating's ladder are not the same
   object. **Owner ruling 2 turns this from an open question into a required design-tier change,
   and §5.3a lists it in full**: `06` needs a boss row in §5's encounter vocabulary (a boss is
   bounded by the rules, not by `plyHorizon`), a statement that the rated boss lives in Act II
   only, a fourth class on §2a's difficulty-availability axis, a note on §2b's boss table saying
   which of the three bosses can carry a result, and a corpus fix (*"36 of 37 packs, median 12"* is
   50 of 56, median 11 `[V]`). **Not acted on by this RFC (law 5) — and since LANDED: all six
   amendments were written into `06` on 2026-08-22 by claude on the D439 ruling ([[D836]]),
   discharging D1** (cross-review 2026-08-22 verified them in `06` and reconciled the discharge
   table, which still showed the column blank). The one part §5.3a did not name a
   change for was the rewind collision, which was a ruling rather than an edit — **ruled
   2026-08-22 ([[D945]]) and landed in `06` §2c/§5 by claude on the ruling** (§5.3a consequence 4
   carries the resolution).
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
5. **`design/research/league-as-return-loop.md` §C1's recommendation is adopted in outcome and
   rejected in reasoning, and the divergence is deliberate.** That dossier recommended rewording
   R10 around the distinction *manufactured number vs. record of what happened*. Owner ruling 1
   reversed R10 outright, and §8b then finds the distinction **does not survive contact with this
   RFC's own §1** — if the rating is arithmetic over rules facts, manufacturedness cannot be what
   excludes it from a table. The dossier's *conclusion* (escalate, do not route around; the
   shading survives either way) was right and is implemented; its *ground* is replaced by
   provenance. Flagged because a reader comparing the two documents will otherwise think one of
   them is wrong about the other.
6. **`design/research/band-flattery-and-buried-value.md` §5.5 asked for an invariant to be pinned
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
  be refused **by name**, not by absence. **R10's three surviving clauses are named cases too**,
  and are the ones the reversal makes newly falsifiable: a standing read spanning two classrooms,
  a response ordered by rating, and a standing entry created by anyone but its subject
  (AC-13 – AC-15).
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
  asserts every **server-routed** assistance route — the §10.2 set, `/reveal` and `/analysis`
  included — returns `ASSISTANCE_WITHHELD` regardless of any client-supplied preference; asserts
  the created run's `feedbackPolicy` is `"attempt_end"` and that `GET /evidence` returns an empty
  page before `outcome.reached`; and asserts `permittedAssistance`'s output is byte-identical to
  today's for the same inputs. **It must also assert the negative** — that the browser-rendered
  remainder (§5.2) is unaffected — so the RFC's claim and its test agree about what R6 reaches.
- **AC-6 (the five disclosures ship).** A rendering test asserts scale name, interval, game
  count + abandonment count, the assistance-ceiling qualifier, and — wherever movement is shown —
  the transfer ratio, with the corpus-wide magnitude asserted as **346.8**, not 289.6.
- **AC-7 (the bracket is simulated under more than one model, or it is not tested).** F-W runs:
  simulated learners at true BCS 950, 1050, …, 2150 against the four rungs, **under at least three
  response models — logistic, Thurstone/normal, and a saturating family with a floor draw rate —
  under the shipped period structure of §6.3 (12 games or 7 days, with the pre-period RD
  widening), not one flat 200-game batch, and at at least two arrival rates: one count-closing
  (≥12 rated games/week) and one clock-closing (≤3/week).** Credited at ≥90% interval coverage
  against a nominal 95% interval. **The published bracket is the *intersection* across models** —
  the largest contiguous run of grid points clearing the null under **every** model — **and is
  reported rounded to the 100-point grid, never to the point.** The report must also state, **per
  true rating and per arrival rate**, how many periods elapse before RD ≤ 60 makes anything
  publishable. If the result disagrees with [1006, 2098], the constant and the copy move. **A run
  under the logistic alone does not satisfy this criterion** — that is the null the bracket was
  derived under, and a simulator drawing from it cannot falsify it. **Nor does a run at one
  arrival rate**: "12 games or 7 days" has no meaning until the rate is stated, and the
  clock-closing arm is the one that decides whether an ordinary learner ever publishes.
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
  text, (b) the **shipped `BANNED_JUDGEMENTS` constant** intersects it nowhere — asserted by
  symbol, never by a pinned count: the list was 30 words at `3e6fe2e` and is **32 at HEAD**
  (`inaccurate`, `inaccuracy` added), which is D384's lesson applied to a wordlist — and (c) no
  rating surface reaches `/voice`, `/speech` or `/reasoning-review`. **(b) is deliberately run on
  authored strings, which `voiceCheck` never sees** — that is the point of the criterion.
  **The standing surface is inside the same frozen set**, which is where AC-12 does most of its
  work after owner ruling 1: a table of people is the most tempting praise surface in the product.
- **AC-13 (a standing entry has exactly one possible author).** A test asserts (a) a teacher
  cannot create a `standing_members` row for anyone, by any route, including their own classroom;
  (b) no code path derives a `standing_members` row from a `classroom_members` row — the
  reachability form of §10a.2's rule, asserted the way AC-11 asserts R15; (c) `{op:"publish"}` and
  `{op:"withdraw"}` accept **no handle argument**, so the refusal is structural rather than
  checked; (d) setting `classroom_members.state = 'left'` removes the entry from
  `GET /cohorts/:id/standing` in the same read.
- **AC-14 (the standing ranks results and groups ratings).** A property test over generated
  cohorts asserts that (a) the returned member order is a total order on `(game points, games
  played, handle)` and is **byte-identical** when every member's rating is permuted arbitrarily —
  the falsifiable form of *"the rating is never a sort key"*; (b) no response field carries a rank,
  percentile, cohort mean or z-score; (c) two members are placed in different rating groups only
  when their groups differ by at least one calibration rung step; (d) a member whose §7.2 state
  withholds a point estimate has **no rating field at all** in the response, not a null.
- **AC-15 (no standing spans a classroom, and no standing leaks a run).** Tests assert (a) every
  standing read is parameterised by exactly one `classroom_id` and no route aggregates two; (b) a
  caller without an `active` `classroom_members` row receives the same not-found response as for
  an unknown classroom; (c) the standing response contains no run id, branch id, event, FEN, move
  or evidence reference; (d) being a standing member changes no rated-game precondition, no
  opponent selection and no update — asserted by driving identical runs for a member and a
  non-member and comparing `rated_games` and `learner_ratings` byte-for-byte.
- **AC-16 (the limitation is on the surface, and it is on all four sites).** A rendering test
  asserts the unwitnessed-games sentence appears in the standing view itself, in the publish
  confirmation, and in every §7.4-obligated multi-learner rendering; and a register test asserts
  the `/capabilities` row for `cohort standing over rated results` exists with the limitation in
  its `reason`, and that the narrowed refusal row for cross-cohort comparison is present. **All
  four, or the reversal has not shipped its price** (§10a.5).
- **AC-17 (a rated boss is a game, and only where it can be one).** Tests assert (a) a rated boss
  run has `sessionKind === "position"` and no pack id; (b) a boss configured against
  `theory_strict` or `perfect_tablebase` is refused as rated by **name** (`R1`), and a boss whose
  start position is under 21 pieces by `R5`; (c) `RunSessionKind` still has exactly three members;
  (d) no `objective`, `ObjectiveState`, `successConditions` or `sealedState` value is reachable
  from the rated-game projector — the R2 half of §5.3a, asserted over the module graph the way
  AC-11 asserts R15.
- **AC-18 (a rating against an uncalibrated anchor says so, and the label cannot omit it).**
  Obligation 7, made failable in three arms. (a) **Positive**: a rated game played at `180+0`
  against a rung whose calibration record covers no time control renders the control **and** the
  anchor's uncalibrated state, asserted on the rendered string rather than on the model. (b) **The
  omission fixture, which is the criterion's whole point**: a label built for that same game with
  the calibration state removed **must fail** the disclosure check — a passing build here means the
  disclosure is decorative and obligation 7 has not shipped. (c) **Negative control**: a game played
  at a control the rung *is* calibrated for renders the control without the uncalibrated marker, so
  the marker is discriminating rather than always-on. *A wrong implementation prints the time
  control and stops there* — the readable half of [[D1292]] without the half that makes it honest,
  which is exactly what obligation 7 exists to prevent.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| `D1` | Six changes owed to `design/06-campaign.md`, enumerated in §5.3a | `OWNER` | `design/06-campaign.md` plus `planning/exploration/log.md` | **2026-08-22 — [[D836]]**: all six amendments written into `design/06-campaign.md` by claude on the D439 ruling; the log entry and this register flip rode that commit (recorded here by cross-review, which found the column still blank against a landed discharge) |

## Open questions

Resolved before `accepted`, or deferred to a named future RFC. **Numbering is preserved across
rounds rather than compacted** — answered questions (1 and 10 on 2026-08-16; 11 and 12 on
2026-08-22) are marked answered in place, so every cross-reference in this document and in
`league-as-return-loop.md` still resolves.

1. ~~**Can a campaign boss be rated?**~~ **ANSWERED — owner ruling 2, 2026-08-16: a campaign boss
   is a full game, not a pack.** Neither of the drafted forks was taken. The boss changes, not the
   rating: a rated boss is a `position` session played to a rules-terminal result against a
   calibrated rung. Folded into **§5.3a**, with its four consequences and the six changes
   `design/06-campaign.md` needs. The one part not settled by the ruling was the rewind
   collision, carried forward as open question 11 — **since ruled, [[D945]] 2026-08-22.**
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
10. ~~**Does R10 refuse the table, or the number?**~~ **ANSWERED — owner ruling 1, 2026-08-16:
    R10 is reversed and cross-learner comparison ships.** Neither horn was taken either: the
    re-evaluation in **§8b** finds the *number-versus-table* distinction **does not survive**,
    because §1 has already argued this rating is not a manufactured number. What replaces it is
    **provenance** — the games are unwitnessed — which keeps the refusal's one empirical ground
    (4545's Seasons 7, 8 and 17) as a **stated limitation** at the four sites in §10a.5 rather than
    as a reason not to build. The honour-roll shading is not the fallback; it is the **default
    layer** (§10a.3), for the measured reason that it is the only layer populated before RD ≤ 60.
    Surface specified in **§10a**. R10 survives as three narrower clauses.

**Opened by this round:**

11. ~~**Does a rated boss close rewind, or does a rated boss not exist?**~~ **ANSWERED — owner
    ruling [[D945]], 2026-08-22, verbatim:** *"you have to earn rewinds or proactive branching...
    not infinite, not forbidden. it's what allows a weaker player to actually win a campaign (on
    lower floors/acts/whatever)."* **None of the three drafted answers was taken** — not (a)
    close-rewind, not (b) played-twice (the author's recommendation), not (c) unrated — and the
    ruling's fourth shape dissolves the question's premise: inside campaign encounters, rewind
    and proactive branching are an **earned economy** (charges earned through play, spendable in
    any encounter including the boss, counts scaling by floor/act — `06` §2c as amended;
    mechanism in accepted `rfc/campaign-core.md` §2). **R11 stands unchanged**: a rated game
    containing a rewind, earned or not, is void — the economy lives on the encounter-verdict
    side, so the boss is **rated when clean, winnable regardless** (the R11 half is claude's
    default reading, the owner's to veto, recorded in [[D945]]). Folded into §5.3a consequence 4.
    §11.4's experimentation tension is narrowed rather than reopened: the earned economy is the
    campaign's own answer to "how often", and the rating's voiding rule adds nothing on top of it
    that question 8 does not already hold.
12. ~~**May a cohort require witnessed play?**~~ **ANSWERED — owner ruling [[D946]],
    2026-08-22: the seam is pinned now** (option *"pin the seam now"*). The contract names
    witnessed play as a thing a classroom/club cohort may one day **require** for its standing —
    the shipped `run_grants` / live-session machinery, no new mechanism — beside the classrooms
    consent model; **the default stays not-required** and the honour roll stays the default
    layer; **nothing is implemented until a real cohort exists**. Specified as **§10a.2a**, which
    reserves the seam and commissions no table, route or validator.

## Changelog

- 2026-08-23 (amendment, [[D1292]]) — **timed games rate.** Predicate condition **3a** states that
  the time control does **not** gate rating; §7.4 gains **obligation 7** (the control *and* the
  anchor's calibration state at that control), taking the obligation count from six to seven; **AC-18**
  makes it failable in three arms, the load-bearing one being an omission fixture that must be RED —
  a passing build there means the disclosure is decorative. The conflict is carried, not hidden: the
  recommendation was *rate where calibrated, abstain elsewhere*, the owner chose widest coverage, and
  `bot-policy:592`'s ~230 Elo cross-control drift means an untimed rung is an uncalibrated anchor for
  a `180+0` game. [[D819]]'s label rule is **untouched** — it binds a *bot's* stated Elo and no bot
  label changes here; this is the *learner's* rating resting on that anchor, which is why obligation 7
  is a disclosure rather than a violation. **The owner may veto this reading** if they intended rating
  without the disclosure; D1292's row records it as claude's reading, taken as the ruling's content
  unless the owner says otherwise.
- 2026-08-22: **cohort-backend checkpoint.** Permanent event-derived marks, one-standing-per-
  classroom storage, self-publication and withdrawal, per-layer visibility, result ordering,
  per-band records, abstention-shaped grouped ratings, the permanent unwitnessed-game limitation,
  and authenticated standing/mark routes implemented. The client surface and broader generated
  acceptance graph remain.
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
- 2026-08-16: **author round on two owner rulings, plus the cross-review's residue.**
  **Ruling 1 — R10 reversed.** The refusal is replaced by a designed surface: **§10a, the cohort
  standing** (objects, consent, three layers, ordering, disclosure sites, refusals, storage,
  routes), with **§8b rewritten as the re-evaluation** the ruling asked for. Findings: Barth's
  ground narrows to *global*, the own-history ground narrows to a *default*, and the self-cheating
  ground **survives whole** and is discharged as **§7.4 obligation 6** at four normative sites
  (§10a.5). **The number-versus-table distinction was tested and does not survive** — it
  contradicts §1 — and is replaced by **provenance**, which changes the design (marks-first
  default, witnessed-play option). The honour roll is the **default layer**, on the measured ground
  that RD ≤ 60 leaves every rating cell absent for weeks. `/capabilities`: the cross-learner
  refusal is **narrowed, not deleted**, and a `reached` row is added. R10 survives as three clauses;
  ADR-0007 and D334 checked explicitly (§10a.6). `teacher-surface` becomes a **hard dependency**;
  its consent model is transposed, not duplicated.
  **Ruling 2 — a campaign boss is a full game, not a pack.** **§5.3a** added: a rated boss is a
  `position` session played to `terminalOutcome`; encoded as a game rather than as a horizon-free
  pack because `objective` is in the pack schema's `required` list and is R2's first refused input.
  Four consequences stated (a boss is a different object class; Act II only, with Act I refused by
  `THEORY_NEEDS_AUTHORED_BOUNDARY`; the `plan` shape is 14/14 at ≥21 pieces; the R11-vs-`06`-§5
  rewind collision), and **six changes named for `design/06-campaign.md`** without editing it
  (law 5). Open question 1 folded in; open question **11** opened for the rewind collision.
  **Residue: [[D420]]** — AC-7's *"minimum across models"* was undefined over intervals and is now
  the **intersection**; the simulation had **no arrival rate**, so *"12 games or 7 days"* was
  unsimulable, and two rates are now required, one clock-closing; grid resolution pinned at ±50.
  **[[D424]]** — the caveat survives at §2, §4.2 and §7.3 q2 as fixed, and a **fourth site** was
  found and fixed: §7.3 q3's *"1.09"* is a width ratio, not containment.
  **Register re-verified late** `[V]`: pack **0.27** (0.28 **claimed and kept** by
  `graduation-clearance` — the cross-review's "unclaimed" is stale), run **0.17**,
  `STORAGE_VERSION` **23**; `opponent-contracts` moved to **implementing**; on the contested
  ladder this RFC is stated as the **fourth claim** (§9.1, [[D423]]). Refusal count stays 16, one
  reversed and narrowed. AC-13 – AC-17 added. Seven ledger rows proposed (§12 items 9–15).
- 2026-08-22: **absorption round — rulings [[D945]]/[[D946]] close the two blocking open
  questions; ready for independent review.** **Question 11 ANSWERED by a fourth shape** none of
  the drafted answers had: the owner's earned-rewind economy (verbatim in the question's
  resolution and §5.3a consequence 4), landed in `design/06` §2c/§5 and made mechanism by the
  accepted `rfc/campaign-core.md` §2. **R11 is unchanged** — a rated game containing a rewind,
  earned or not, is void; the economy lives on the encounter-verdict side, so the boss is *rated
  when clean, winnable regardless* (claude's default R11 reading, the owner's to veto, recorded
  in D945). **Question 12 ANSWERED — the witnessed-play seam is pinned** as new **§10a.2a**: a
  cohort may one day require witnessed play (shipped `run_grants`/live-session machinery, no new
  mechanism); default not-required; nothing implemented until a real cohort exists. **[[D962]]
  recorded at the rated predicate** (condition 3): `RunOpponentPolicy.profile` forbids
  `targetElo`, so a rated persona boss needs a rung-calibrated profile or no persona —
  foreclosing neither arm; resolution owned by `campaign-core` Discharge D1. No R-rule, §8-table
  or acceptance-criterion change in this round; open questions 3, 5, 6, 8 and 9 still stand.
- 2026-08-22: **independent cross-review** (claude, not the author) — every load-bearing claim
  re-derived at HEAD; the rulings verified verbatim against `design/BACKLOG.md` D945/D946/D962
  and `design/06-campaign.md` §2c/§5, and the calibration, Glicko-2 update, and §7.3 bracket
  arithmetic all recompute clean. **Substantive fix — R6's route enumeration was incomplete:**
  `/reveal` opens `feedbackDeliveryOpen()` and `/analysis` enqueues engine bestline/eval/wdl
  behind `#forWrite` alone, so a rated run could have read Stockfish lines mid-game through
  routes the refusal never named; both join the `ASSISTANCE_WITHHELD` set and
  `POST /rated-games` pins `feedbackPolicy: "attempt_end"` (§10.2, AC-5). **Recounts:** the v4
  `AssistanceConfig` puts `spoken: "provider"` on the wire via `/speech`, so "six of nine
  unrefusable" becomes five-plus-a-tier (§5.2, §7.4 ob. 5, R6, D389 addendum); `AssistanceContext`
  is five fields at HEAD, not three (§5.2); `terminal_reason`'s non-mate `isEnd` split is **two**
  causes, not three (§10.1); `BANNED_JUDGEMENTS` is 32 at HEAD and AC-12 now asserts the symbol,
  not a pinned count; `#project` has thirteen call sites; the 0.8431 ladder score's orientation
  was inverted in §10a.3 (it is band 2200's score, the one-in-six conclusion stands). **Register
  reconciliation:** `longitudinal-store` (accepted 2026-08-22) claims the position behind this
  RFC — "only active claimant" corrected; `portable-account-data` (same day) queues this
  migration by name for deletion-inventory entries — obligation absorbed (§9.1, §10.1); five
  same-day acceptances added to §11.1; `opponent-contracts` implemented, `graduation-clearance`
  accepted; `live-session.test.ts` now matches at 24. **Residue of the absorption reconciled:**
  Discharge D1 was already discharged by [[D836]] (all six `06` amendments landed) — the table,
  Deviations 2 and §12 item 11 now say so; §12's proposal list marked against the landed rows
  D420–D423/D437–D443; "third shape"/"fourth shape" aligned; the D962 status-line cite fixed
  §5.3→§3; §7.4's "five obligations" is six; two "pointer at/to" misquotes fixed. Not fixed,
  reported to the acceptor: `rfc/README.md`'s register row still says "14 named refusals" and
  repeats the withdrawn `docs/return-and-progression.md:48-49` amendment claim (do-not-touch
  file); `void_reason`'s `'assistance'` and `'calibration_retired'` values have no specified
  writer.
- 2026-08-22: **implementation checkpoint — arithmetic and storage only.** The runtime now
  carries the four measured full-material opponent rungs, exact Glicko-2 update (including
  uncertainty widening over empty periods), publication abstention, abandonment handling and
  six mandatory disclosures. Migration 25 creates the six §10.1/§10a tables without backfill;
  upgrade fixtures prove historical learner/run rows create no rating, game, period, standing,
  membership or mark rows. The live migration claim is discharged. The RFC remains implementing:
  no writer, projector, service route, cohort computation or learner UI has landed.
- 2026-08-22: **implementation checkpoint — rated-game service and period loop.**
  `POST /rated-games` now admits only the four measured rungs, ≥21-piece starts and the exact
  calibrated Maia identity, then creates the run, host grant and open game row atomically.
  The mutation projector voids rewind, fork and engine drift; a Fool's Mate fixture proves only
  `outcome.reached` seals, with the exact checkmate cause. Twelve-game and seven-day periods use
  the shared Glicko implementation, abandonment is counted separately, and `/rating` plus
  `/rating/history` apply server-side abstention. All server-routed guidance, reveal and analysis
  refuse while the row is open. The RFC stays implementing for cohort standings, learner UI,
  remaining acceptance arms and owner-use validation.
