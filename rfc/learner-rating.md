# RFC: Learner rating

- **Status:** draft (awaiting cross-review)
- **Author:** claude
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
  **Lands behind `teacher-surface.md`** in the migration order (see §9.1)
- **Parent / amends:** amends `docs/return-and-progression.md` — see §11.2, which is the one
  place this RFC contradicts shipped doctrine and says so out loud
- **Supersedes / superseded by:** —
- **Planning:** `planning/learner-rating/` (once implementing)

## Summary

This specifies **a Glicko-2 rating for the learner, computed only from whole games played to a
rules-terminal position against a *calibrated* Maia band at full material, with no assistance
and no rewind.** It ships the calibration table read directly off
`design/research/maia-band-outcome-transfer.md` §5 — four measured rungs, no interpolation, no
invented number — a publication rule that abstains until the rating deviation is smaller than
the resolution the instrument can support, and fourteen named refusals. It claims **no pack
schema lane, no run schema lane, and one migration position** (create-table/index only, no
backfill).

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
move or a position. In this repo the third input has a single producer, and it is sixteen lines
of chess rules:

```ts
// packages/runtime/src/outcome.ts — the whole file
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
recorded event disagrees** (`packages/runtime/src/events.ts:331-338`,
`outcome.reached ${seq} reports ${outcome}; expected ${expected}`), so the result is not merely
computed from the rules, it is *checked* against them on every read.

So a rating in this product is **arithmetic over rules facts**. It is the same object class the
owner already ruled admissible as `corpus_observed` on 2026-08-15 — the explorer's per-move
white/draws/black, published as `reached` with the reason *"Population result attached to each
move without grading"* (`apps/server/src/capabilities.ts`). It says *what happened*, never *what
was good*.

**The line this RFC must not cross, stated as the test every clause below is checked against:**
a rating may move only on facts `terminalOutcome` produces. The moment it moves on anything a
pack author, an engine evaluation or a heuristic decided, it stops being arithmetic and becomes
a verdict wearing arithmetic. §8 names each place that could happen and refuses it.

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
   learner's rating is *well* resolved — not where it is estimable at all. §7.3 derives the
   estimable window from the dossier's own resolution threshold and gets **~1090 Elo**, of which
   480 is well-resolved and two ~306-point skirts are resolved at half that. The owner's journey
   fits the *window* — barely, at the edges, and only under a logistic-tail assumption that is
   `[M]` and carries a named falsifier (§7.3, F-W).
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
| Rate only where the dial transfers; refuse in reduced endgames | **Taken as a hard precondition** (§5). At ≤10 pieces the slope's CI straddles parity, so the *opponent's rating is unidentified* — the update is not weak there, it is undefined |
| Decline a scalar; publish a rating per material regime | **Considered and declined.** Two of the three regimes have no identified opponent rating (n = 48 at 11–20 pieces; CI straddling parity at ≤10), so "three ratings" would be one rating and two fictions. One scale, one refusal, one abstention |

### 3. Why an uncertainty term is not a refinement

D365 argued Glicko-2 on honesty rather than accuracy: RD *"lets it refuse to say anything until
RD narrows — which is the same discipline as the tablebase abstaining outside range, the
explorer abstaining below 100 games, and the `unmeasured` disposition."* Three numbers from this
repo make that decisive rather than tasteful:

1. **The instrument has about five distinguishable rungs.** `out/derived.json` records
   `resolvableRungsInUsableRange: 4.83` and `resolvableBandStepPoints: 208`. A rating whose
   printed precision exceeds its instrument's resolution lies by precision. Elo's K-factor has no
   term in which to say so; RD is exactly that term.
2. **The session-scale resolution is ±60 Elo, and it was derived before the run, not chosen
   after it.** `derivedThresholds.rungElo = 60.0`, from *"SE of a learner's own Elo over a
   30-game session ≈ 0.47/√30 in score ≈ 60 Elo."* That number is an RD. Glicko-2 computes it as
   a first-class output; Elo requires a document to assert it.
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
| Applied band | `OpponentSelection.engine.eloApplied` with `eloHonored === true` (`packages/runtime/src/types.ts:88-103`), persisted per move inside the run snapshot | record |
| Engine identity | `SelectionEngineIdentity.{id, version, modelId, containerDigest}`, same struct | record |
| Start material | piece count of the run's start FEN | rules fact |
| Learner side | `run.start.side` | run configuration |

`attempts.result` already ships and is already learner-keyed and indexed
(`attempts_root(learner_id, root_key, ended_at)`, `storage.ts:2660-2733`). **No new outcome
plumbing is required and none is specified.**

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
6. Server-side assistance is refused for the whole run (§5.2). — R6
7. The run contains no `run.rewound` event and exactly one branch. — R11
8. It reaches `outcome.reached`, or a tablebase-exact adjudication under §5.4. — R12

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
    { band: 2200, rating: 1792.2, rd: 20.6, measuredElo: +292.2, halfWidth: 16.2 },
  ]),
} as const);
```

Five properties, each load-bearing:

- **Every rung is `[V]`.** No band between the rungs is offered, because no band between the
  rungs was measured against this reference. Open questions Q4 names the cheap experiment that would add
  three more.
- **Band 1400 is the origin *by definition*, and the measured −3.4 ± 24.1 is the control that
  validates it**, not a value to subtract. Its half-width becomes the floor RD for every rung
  below the top.
- **`rd` is the reported 95% half-width, used as one deviation.** That is conservative by
  ≈1.96× and it damps every update. The direction is deliberate: this product errs toward
  under-confidence.
- **The domain stops at band 2200.** Band 2400 is inside R10's `[1000, 2400]` distinguishability
  range and outside the *difficulty* range — D338 measured 2000→2400 at +28.9 Elo with a CI
  containing zero. A rung whose strength is not distinguishable from its neighbour's cannot be
  an opponent in a rating.
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
regime the opponent's rating is unidentified, so the update is undefined.** The regime is fixed
by the *start* position's piece count, which is a fact of the encounter known before the first
move — the same conditioning the dossier's own material cut used. A rated game that simplifies
into an endgame stays rated; a game that *starts* there is refused. 11–20 pieces is refused too,
on n = 48 (Open questions Q2).

#### 5.2 Assistance — server-refused for the whole run

If assistance is not held fixed, the rating measures the loadout rather than the learner. This is
enforceable today, and the enforcement point matters:

**`AssistanceConfig` lives in the browser** — `tabiya.assistance.v1.<profile>` across six
profiles (`apps/web/src/lib/assistance-preference.ts`) — and the server never receives it. So a
rated game's assistance precondition **cannot be verified from the client's declaration**, and
must be enforced by refusal at the server.

The mechanism ships. `ASSISTANCE_WITHHELD` is a named refusal (`apps/server/src/rest.ts:1090`,
`:1107`) and the client already renders an honest disabled control
(`DrillScreen.svelte:717-720`). **A rated run refuses every assistance route for its whole
lifetime**, keyed on the `rated_games` row.

**`permittedAssistance` is not modified.** The honesty gate keeps its two inputs (role,
disclosure state) exactly as `coaching-versus-cheating-and-the-band-curve.md` §2a documents them.
The rated refusal is a route-layer ceiling *outside* the gate — which also keeps this RFC clear
of `teacher-surface`'s requested ownership pin on that function (§11.1). `06` §3 law 1 holds:
nothing here changes what may honestly be shown or when.

#### 5.3 Why pack sessions cannot be rated

A pack encounter ends at `authoredBoundary.plyHorizon` (47 of 89 pack-shaped documents declare
one; median 10), not at checkmate. A truncated game has no rules-terminal result, and producing
one would require assessing the final position — which is an engine or authored verdict, i.e.
the exact thing §1 forbids. **The horizon is the reason packs are unrated**, and it is a
principled reason rather than a scoping convenience.

This has a consequence the campaign must hear: `06` §5's boss encounters are packs, and the
suppressed-boss configuration is otherwise the ideal rated object —
`coaching-versus-cheating-and-the-band-curve.md` §4d calls it *"a complete specification of
'2000-Elo skills required'"*. Either a boss is played out with no horizon, or bosses are unrated.
Open questions Q1 puts that to the owner rather than deciding it.

#### 5.4 The one adjudication permitted, and it is not an engine

A rated game whose position enters the Syzygy range may be sealed by a **tablebase-exact**
result via `LichessTablebaseSource` (already shipped, `rfc/archive/grounding-pair.md`). A
tablebase result is a rules fact of the same class as checkmate — the endgame boss already
depends on that exact property (`perfect_tablebase`). It is recorded as
`terminal_reason: 'tablebase_exact'` and is distinguishable in the record from a played-out
termination.

**No other adjudication exists.** Engine evaluation may never seal a rated game (R12).

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
| Publication threshold | **RD ≤ 60** | Not chosen: it is the dossier's own `derivedThresholds.rungElo = 60.0`, the SE of a learner's Elo over a 30-game session. Above it the product cannot tell a rung from its neighbour, so it does not print a point estimate (§7.2) |

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

The first two rows are the discipline D365 named — the same shape as the tablebase abstaining
outside range and the explorer abstaining below 100 games.

#### 7.3 The bracket, derived

The dossier's resolution threshold is 60 Elo (§3, `derivedThresholds.rungElo`). A rating estimate
stays informative while a 60-Elo change in true strength still moves the expected score by
something comparable to a session's sampling noise. On the logistic,
`dE/dD = ln(10)/400 · E(1−E)`, which is maximal at parity and decays as the gap grows. Requiring
that sensitivity to stay within a **factor of two** of its parity value gives `E(1−E) ≥ 0.125`,
i.e. `E ≤ (1 + √0.5)/2 = 0.85355`, i.e. a gap of

```
D = 400 · log10(0.85355 / 0.14645) = 400 · log10(5.82843) = 306.2 Elo
```

So the **bracket** is the pool span plus a 306-point skirt at each end:
**[1312.4 − 306.2, 1792.2 + 306.2] = [1006, 2098] BCS** — a window **1092 points wide**, of
which the 480-point interior is well-resolved and the two skirts are resolved at half that.

**Three things must be said about this number, in order of importance.**

1. **It is a modelling claim, not a measurement `[M]`.** It assumes the logistic holds out to
   ±306 Elo against a fixed engine opponent. Real engine opponents have non-logistic tails, and
   a learner far above band 2200 may simply score 1.000 forever. That is why §7.2's last row is
   a hard rule that overrides RD: **saturation publishes a bound, always.** The window is the
   *optimistic* bound on what the instrument can express, and the product must behave as if the
   pool span is the realistic one until AC-7 says otherwise.
2. **It refines D337 rather than contradicting it.** D337 computed coverage as *pool span ÷
   journey* and got 0.207–0.400 against a required 0.714. That is the correct number for the
   question it asked. This is a different question — *estimable window ÷ journey*, which comes
   out at **1.09** — and it needs an assumption D337's number did not. Both belong in the ledger;
   §12 proposes the row.
3. **It does not rescue the anchor.** A 1092-point window whose zero is arbitrary is still
   arbitrary. §7.4 is not weakened by §7.3, and neither is R7.

**Falsifier F-W.** Simulate learners at true BCS 950, 1050, …, 2150 playing 200 games each
against the four rungs under the shipped Glicko-2 implementation; the estimator is credited only
where the recovered rating's 95% interval contains the truth on ≥90% of replicates. **The
bracket is whatever that simulation says it is** — if it comes back narrower than [1006, 2098],
the constant moves and the copy moves with it. This is an acceptance criterion (§AC-7), not a
future study.

#### 7.4 The disclosures, normative

Every surface that prints the rating prints, in the same view:

1. the scale name and that it is **not** FIDE, Lichess or Chess.com;
2. the interval, never a bare point estimate;
3. the game count and the **abandonment count** (§11.3);
4. wherever a *journey* or *movement* is printed, the transfer ratio beside it: the band ladder
   `[1000, 2200]` is worth **≈480 real Elo at full material** and **≈290 over the corpus as
   authored**, i.e. **a 100-band step is ≈40 real Elo, not 100**.

Copy is not specified here beyond these four obligations, which are testable (§AC-6).

### 8. Refusals

Each is named, each has a reason that is a measurement or a law, and each is a test in §AC.

| # | Refused | Because |
|---|---|---|
| **R1** | A rating from an **uncalibrated opponent** — `theory_strict`, `practical_resistance`, `strong_engine`, any band off §4.1's four rungs, any run where `eloHonored !== true`, any engine identity other than the pinned digest | An update needs the opponent's rating. Where there is none, there is no update — only a number |
| **R2** | A rating that moves on **authored outcomes** — `ObjectiveState`, `attempts.verdict`, `successConditions`, `TempoVerdict`, `lineMembership`, `prediction.recorded` | A pack's declared success is a compiled author judgement (`pack-orchestrator.ts`), not a game result. Feeding it in makes the rating a function of an author's opinion |
| **R3** | **Cross-band comparison the transfer ratio does not support** — offering, displaying or distinguishing band steps finer than a measured rung; treating `targetElo` as the opponent's rating anywhere | D336 (the smallest resolvable step is ~150–208 band points) and D344 (*"`targetElo` must never be passed to a rating update directly"*) |
| **R4** | Any **per-move contribution** — accuracy, per-move rating delta, "performance rating for this move", a move-quality axis of any kind | A move verdict wearing arithmetic. ADR-0005 / law 8, and the named anti-pattern in `AGENTS.md` |
| **R5** | A rating in **reduced endgames** — <21 pieces at the start position | Transfer ≈0.07 at ≤10 pieces with CIs straddling parity; n = 48 at 11–20. The opponent's rating is unidentified there |
| **R6** | **Pooling assisted with unassisted play** | Otherwise the rating measures the loadout. Assistance is browser-side, so this is enforced by server refusal (§5.2), never by trusting a declaration |
| **R7** | Publishing the number as an **external-scale equivalent** (FIDE / Lichess / Chess.com), or converting to one | The anchor is unmeasured; the whole calibration is engine-vs-engine |
| **R8** | Publishing a **point estimate outside the bracket or at score saturation** | §7.3. Report a bound instead |
| **R9** | Making the rating **purchasable, sellable, or a gate on content** | ADR-0007. D334's surviving distinction: winning may unlock convenience and variety, **never content** |
| **R10** | **Leaderboards and cross-learner comparison** of any kind | Barth: *"the only thing a global leaderboard manages to tell you is that you suck (and not even by how much)"* and *"a fantastic incentive for cheating"* `[P]`; and the standing constraint from `fun-mechanics-outside-roguelikes.md` — the population is the learner's own history, never other learners |
| **R11** | Rating a game containing a **rewind or fork**, rating more than one branch of a run, or rating the same run twice | `attempts` PK is `(run_id, branch_id)`, so a rewound run yields several results. Rating them would reward rewinding until you win |
| **R12** | **Engine adjudication** of an unfinished game | Only `terminalOutcome` and the tablebase may seal (§5.4) |
| **R13** | Maia's own **expected score** `0.5 + cp/2000` as a rating input | `maia-wdl-versus-human-outcome.md` §9.5: the value head's band response carries **no information** about the band's outcome shift (Pearson 0.021–0.044, sign agreement 47.2–52.0%). Retained as a diagnostic only (§AC-8) |
| **R14** | Feeding the rating into **`/progress/recommendations`**, milestones, or scheduling | That would make it a weakness model driving content selection — a different product, and out of scope. Open questions Q5 |

### 9. Register claims

#### 9.1 Migration — a position, not a number

**A migration is required and this RFC says so loudly.** A rating is persistent per-learner state
and there is nowhere to put it: `learners` carries only `{id, handle, displayName, createdAt}`
plus auth columns, there is **no learner profile record of any kind**, and `progress_meta` has no
`learner_id` column. The nearest precedent for a small learner-keyed table is
`learner_position_stats` (`storage.ts:2724-2729`).

**Claim: the next position in the landing order, taken as `STORAGE_VERSION + 1` at landing.**
Never an integer. `STORAGE_VERSION` is **22** at HEAD (`apps/server/src/storage.ts:407`), and
the loop is `if (migration.version <= version) continue` (`storage.ts:2345`), so a claimed-but-
unlanded number is a hole the next migration seals shut. **`teacher-surface` holds the position
ahead of this RFC** and this RFC lands behind it.

Body: **create-table/index only. No backfill, no snapshot rewrite, no stamp.** Nothing historical
is rated — every historical run was played under an unknown assistance state against an
unrecorded ceiling, and retro-rating it would manufacture exactly the fiction §1 refuses. Also
note for the register: `live-session.test.ts:29` asserts `STORAGE_VERSION` literally, so the bump
edits that test.

#### 9.2 Pack schema — **none. 0.28 stays free.**

Nothing about a pack changes. Rated-eligibility is *derived* (§3) from the run's opponent policy,
start material and assistance state — never authored. `opponent-contracts` may keep 0.28; this
RFC releases nothing because it claims nothing.

#### 9.3 Run schema — **none. 0.17 stays free.**

`DRILL_RUN_SCHEMA_VERSION` is **"0.16"** at HEAD (`packages/schema/src/index.ts:1`). No new event
type and no widened field. The rating is a **projection**, not drill content; the run event log
stays the source of truth and `rated_games` is a materialised read over it. This also avoids the
`RunStorage.list` filter (`WHERE r.schema_version = ?`) that any run bump would force a stamp
migration for.

#### 9.4 Shape-entry schema — none. `/capabilities` — one additive entry (§10.4).

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
    ('checkmate','stalemate','insufficient_material','fifty_move','threefold','tablebase_exact')),
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

Literal CHECK strings, per the migration-9 freeze lesson recorded in `rfc/README.md`.

#### 10.2 Routes

| Method + path | Behaviour |
|---|---|
| `POST /rated-games` `{band, side}` | Creates a `position` run with the pinned policy **and** its `rated_games` row in one transaction, so the declaration cannot race the first ply. Refuses `RATING_BAND_NOT_ON_LADDER`, `RATING_OPPONENT_UNCALIBRATED`, `RATING_MATERIAL_OUT_OF_RANGE` |
| `GET /rating` | The published rating for the authenticated principal, already shaped by §7.2 — the server decides abstention, never the client |
| `GET /rating/history` | Sealed periods with before/after state and per-game rows. Read-only |

All three sit behind `authenticate()` → `Principal`, like every `/progress` route. No new token
scope, no new `RunRole`.

Every assistance route refuses with the shipped `ASSISTANCE_WITHHELD` when the run has an `open`
`rated_games` row.

#### 10.3 Voiding

`RunService.#project` already runs on every run mutation (`service.ts:1752-1764`). The rated-game
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

and one refusal made machine-readable so it cannot be reintroduced by silence:

```ts
{ instrument: "Glicko-2", capability: "rating from authored or engine-adjudicated outcomes",
  disposition: "refused",
  reason: "A pack's declared success is not a game result" },
```

## 11. Coordination

### 11.1 Sibling RFCs

| RFC | Overlap | Resolution |
|---|---|---|
| `teacher-surface.md` (draft, owner-blocked) | **Migration ladder** — both want `STORAGE_VERSION + 1`. Also both touch `/learn`, and it requests an ownership pin on `permittedAssistance` | This RFC lands **behind** it and takes the next position at its turn. `permittedAssistance` is untouched (§5.2), so the pin is not contested. The `/learn` collision is doctrinal, not structural — §11.2 |
| `pack-graduation.md` (accepted, pack 0.27) | **None.** All its state is pack-scoped; it claims no migration and no run schema | Nothing to negotiate |
| `opponent-contracts.md` (draft) | It claims run 0.17 and pack 0.28 | This RFC claims neither; both lanes stay free |
| `engine-leverage.md` (implementing) | Its `searchBound` record on `SelectionEngineIdentity` is what a future `strong_engine` rung would need (Open questions Q3) | Read-only dependency |

### 11.2 The doctrine this RFC contradicts, named rather than finessed

Three shipped sentences forbid what the owner has now ruled:

- `docs/return-and-progression.md:48-49` — milestones *"never add a skill percentage, score,
  streak, **rating**, ranking, or cross-learner comparison."*
- `docs/return-and-progression.md:54-56` — recommendations *"never infer weakness, mastery,
  **rating**, or what other learners struggle with."*
- the `/learn` copy line *"This is an attempt history and return queue, not a mastery score"*
  (`App.svelte:741`), reasserted by `teacher-surface` §7.2.

**Two of the three survive unchanged and should.** Milestones stay scoreless (R14), and
recommendations still infer nothing (R14) — a rating is not fed into either, so
`docs/return-and-progression.md:54-56` needs no edit at all. What changes is the first sentence's
scope: a rating now exists **on its own surface**, computed from rules results, never attached to
a milestone. `/learn` keeps its copy line because `/learn` keeps having no score on it.

**Required at landing, and this RFC does not make the edit (`docs/` is not this tier's to
write):** amend `docs/return-and-progression.md:48-49` to say the *milestone* surface carries no
rating, and add the rating's own doc. The scheduler stays *"not an FSRS/SM-2 mastery model"*
(`:69`) — untouched and still true.

### 11.3 The bias this design cannot remove

**There is no resignation.** `terminalOutcome` has no resign path, so a learner who abandons a
losing rated game produces no result and no rating movement. Selection is therefore real:
abandon-when-losing inflates the rating, and nothing in Glicko-2 detects it.

Three responses were available — adjudicate abandonment as a loss (requires inferring intent),
add a resignation event (a run-schema change this RFC declines), or make the bias visible. **This
RFC takes the third:** `abandoned_games` is counted and is one of §7.4's four mandatory
disclosures. A rating printed beside "4 rated, 11 abandoned" is a rating the reader can discount
themselves. Ledgered (§12) so the better fix is not lost.

### 11.4 The tension that remains

Voiding a rewound game creates a reason not to rewind inside rated mode. It is not a budget —
nothing is spent, nothing is withheld, and the catalogue is never gated (ADR-0007, D334) — but it
is pressure, and `00-thesis.md` names *"experimentation without cost"* as one of two answers to
why anyone would use this. The mitigation is that **no rated game is ever required**: rated mode
is entered deliberately, the rest of the product is unchanged, and a learner who never plays one
loses access to nothing. Open questions Q8 puts the reading to the owner.

## 12. Ledger rows owed

`design/BACKLOG.md` is edited by the coordinator, not by this RFC (concurrent-agent collision).
Rows proposed:

1. **D332** — status note: RFC drafted; units resolved as a band-calibrated internal scale
   published as band-equivalents, with the origin disclosed as a convention.
2. **New 💡 — the estimable window is not the pool span, and the difference is ~610 Elo.** D337
   computed coverage as pool span ÷ journey (0.207–0.400 against a required 0.714). Deriving the
   window from the dossier's own 60-Elo resolution threshold, at a factor-two sensitivity decay,
   gives a **±306-Elo skirt** on each end and a **~1090-point estimable window** — of which 480
   is well-resolved. **D337 is not wrong; it answered a different question**, and this one needs
   a logistic-tail assumption `[M]` that D337's did not. Falsifier and threshold in
   `rfc/learner-rating.md` §7.3 / AC-7.
3. **New 🐞 — there is no resignation, so a rated ladder has an undetectable abandonment bias.**
   `terminalOutcome` seals only on rules termination; an abandoned losing game produces no
   result. Mitigated by publishing the abandonment count; the real fix is a resignation event and
   a run-schema bump.
4. **New 🐞 — assistance state is client-side only, so nothing that conditions on it can be
   verified.** `tabiya.assistance.v1.*` never reaches the server. Any future mechanism that
   prices, gates or measures against assistance must enforce by server refusal
   (`ASSISTANCE_WITHHELD`), never by reading a declaration. Generalises past this RFC.
5. **New 🐞 — `attempts` is per-branch, so any per-run measurement has a grain mismatch.** PK is
   `(run_id, branch_id)`; a rewound run yields several results and the run-level roll-up is still
   computed nowhere. Rating sidesteps it by voiding; the campaign's run verdict cannot.
6. **New 💡 — the campaign has four offerable rungs today, not five to nine.** D336 estimated
   5–9 from the slope; only **four bands were measured against a common reference**. Three more
   arms on the existing harness (1200 / 1600 / 2000 vs band 1400) would take it to seven at
   ~200-band spacing.
7. **New 💡 — `docs/return-and-progression.md`'s no-rating sentences need one scoped amendment**
   at landing, and two of the three survive unchanged. Recorded so the amendment is deliberate.

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
3. **`coaching-versus-cheating-and-the-band-curve.md` §3 concluded that a learner model *"does
   not and should not exist"*, and §4c refused adaptive difficulty on that basis.** The D332
   ruling supersedes the first half. This RFC does **not** exercise the second half: R14 keeps
   the rating out of recommendation, scheduling and matchmaking. The dossier's conclusion was
   correct on the evidence it had; the owner has since ruled.
4. **No deviation from `design/05-in-run-experience.md`.** `permittedAssistance` and the honesty
   ladder are untouched (§5.2).

## Acceptance criteria

- **AC-1 (refusals are tests, not prose).** Each of R1–R14 has a named failing case: an
  uncalibrated band, a `pack` session, a 10-piece start, a rewound run, a second branch, an
  authored-verdict input, a per-move delta, a saturated score, an out-of-bracket estimate, a
  changed container digest, a `targetElo` reaching an update, and an attempt to read
  `/progress/recommendations` from rating state. Each must be refused **by name**, not by absence.
- **AC-2 (Glicko-2 conformance).** The implementation reproduces Glickman's worked example
  (player 1500/200/0.06 versus 1400/30, 1550/100, 1700/300 with results 1/0/0) to within 1e-4 on
  `r'`, `RD'` and `σ'`.
- **AC-3 (calibration integrity).** Every rung's `rating` equals `1500 + measuredElo` for
  band ≠ 1400 and exactly 1500 at the origin; a test asserts each `measuredElo` against
  `design/research/maia-band-outcome-transfer.md` §5 and against
  `tools/d333-band-outcome-harness/out/summary.json`. Changing a rung without changing
  `calibrationId` fails the build.
- **AC-4 (no historical rating).** After the migration, `learner_ratings` and `rated_games` are
  empty on every existing database, and `GET /rating` publishes nothing.
- **AC-5 (assistance is refused, not trusted).** An integration test drives a rated run and
  asserts every assistance route returns `ASSISTANCE_WITHHELD` regardless of any client-supplied
  preference; and asserts `permittedAssistance`'s output is byte-identical to today's for the
  same inputs.
- **AC-6 (the four disclosures ship).** A rendering test asserts scale name, interval, game
  count + abandonment count, and — wherever movement is shown — the transfer ratio.
- **AC-7 (the bracket is simulated, not asserted).** F-W runs: simulated learners at true BCS
  950, 1050, …, 2150, 200 games each against the four rungs, ≥90% interval coverage inside the published
  bracket and demonstrably below it outside. **The published bracket is the simulation's output**;
  if it disagrees with [1006, 2098], the constant and the copy move.
- **AC-8 (the cross-check is a diagnostic and stays one).** Maia's `0.5 + cp/2000` expected score
  is recorded alongside rated games and compared against the rating's predicted score in a
  report; a test asserts it reaches no update path.
- **AC-9 (abstention is server-side).** `GET /rating` never returns a point estimate the client
  could print when RD > 60 or the bracket fails — the field is absent, not merely flagged.
- **AC-10 (one result per run).** A run with a rewind and two terminal branches contributes
  **zero** rated results, and a property test over generated run logs asserts
  `|rated results| ≤ 1` per run, always.

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
   `campaign-intermediate-consequence.md` puts (a) the path you stand on, (b) the path you
   submit, (c) the worst path to the owner. For rating purposes only (a)-equivalent is safe: (b)
   and (c) are both farmable by replaying until the desired result appears. R11 sidesteps the
   fork by voiding any rewound game outright. If the owner rules (b), this RFC does **not**
   follow it — flagged here so the divergence is deliberate.
8. **Does voiding on rewind price experimentation?** §11.4's tension. It takes nothing away and
   gates nothing, but it does create a reason not to rewind inside one specific declared mode.
   `06` §2c ruled a rewind *budget* prices the thesis's selling point; a *measurement* that
   cannot see a rewound game is a different object, and the owner should confirm that reading.

## Changelog

- 2026-08-16: created.
