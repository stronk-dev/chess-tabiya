# Does Maia's band move the RESULT, or only the DISTRIBUTION?

**Question,** ledgered as **D333** (`design/BACKLOG.md`) with its experiment pre-registered
one cluster away as **D324**:

> R10 measured that the band moves the **distribution** — the policy vector differs by
> band, bit-identically reproducible. **That is not the same claim.** An Elo computed
> against Maia bands is meaningless unless Maia at 1500 actually *loses more often* than
> Maia at 1800 over played games.

**Why it had to be run now.** The owner ruled 2026-08-16 that campaign progression is
denominated in the **learner's Elo**, the journey being 1000→2000 (**D332**), on the
argument that an Elo is law-8-legal because it is arithmetic over outcomes rather than a
claim about any move. That denominator has exactly one hard prerequisite and nobody had
supplied it. `design/research/maia-band-calibrated-range.md` (R10) states in its own words
that it makes *"no claim about play quality at any band"*, and
`design/research/maia-wdl-versus-human-outcome.md` §9.5 found the band moving Maia's WDL
**without** moving it toward the band (Pearson 0.021–0.044, sign agreement 47.2–52.0%) and
concluded *"doesn't settle D324, but it points."* This dossier does the one thing neither
did: **it plays games and counts results.**

**Instrument.** `tools/d333-band-outcome-harness/` (disposable), which drives the repo's
own `EngineSupervisor` (`apps/server/src/engine-supervisor.ts`) and `maiaDockerSpec`
(`apps/server/src/maia.ts`) by relative import and reproduces `OpponentSelector#maia`'s
command shape (`opponent-selector.ts:494-520`) command for command. No second UCI
integration exists here. Engine identity as reported by the shipped handshake:
`maia-5m` / `Maia3` / `1e13597c42d4858b7cfd7cfdae01e297263364b2` /
`maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe`, `eloHonored: true`,
`seedHonored: false`, `bandRange {1000, 2400}` `[V]`
(`tools/d333-band-outcome-harness/out/maia.identity.json`).

**Cost.** **16,660 complete games, 1,049,001 Maia forward passes**, 12 arms, 2 h 16 min of
wall clock on 13 pinned single-thread workers `[V]`
(`tools/d333-band-outcome-harness/out/summary.json`).

---

## 1. Verdict

**The band moves the result. It moves it about a third as far as its own units claim —
0.40 Elo per band point where the pieces are all still on, 0.29 over the product's corpus
as a whole — and that ratio is the number the campaign has been missing.**

Eight findings, in the order that matters:

1. **Yes — decisively, at every gap tested, including the smallest.** Every band pair with
   a non-zero gap separates at p < 1e-5 with a 95% CI excluding parity, from 1400 band
   points down to 100 `[V]`. The same-band control lands at **0.4956 [0.475, 0.517],
   p = 0.68**, and the positive control (identical bands, one side at Temperature 5.0)
   lands at **0.9368 → +468 Elo**, so the instrument is neither biased nor blind. §4.

2. **The pre-registered D324 criterion PASSES, and passing it is not the answer.** The
   ledger's own design — bands {1000, 1400, 1800, 2200} against a fixed band-1400
   reference, *"pass = monotone score across all four arms with non-overlapping 95%
   CIs"* — returns **0.3069 / 0.4990 / 0.6304 / 0.7652**, monotone with all three
   adjacent CI pairs disjoint `[V]`. **But that criterion is satisfied by a dial with a
   transfer ratio of 0.29, which is the thing the campaign actually needed to know**, and
   it would have been satisfied at 0.05 too given enough games. §5, §9.1.

3. **The transfer ratio is ≈ 0.29 over the corpus and ≈ 0.40 at full material, and it is
   stable across the range.** Read off the D324 ladder, where all four rungs share one
   reference and nothing has to be chained: **28.90 Elo per 100 band points, ratio 0.289
   [0.269, 0.309]**; restricted to positions with all the material still on (≥ 21 pieces),
   **39.98 per 100, ratio 0.400 [0.379, 0.421]** `[V]`. The seven independent pairwise
   gaps agree — 0.207 [0.183, 0.234] at 1000↔2400, 0.261 [0.233, 0.291] at 1000↔2000,
   0.233 [0.185, 0.281] at 1500↔1800, 0.221 [0.124, 0.318] at 1500↔1600, 0.269
   [0.165, 0.373] at 1900↔2000 `[V]`. **The band is an Elo-shaped dial that is not
   denominated in Elo**, and the factor is between 2.5 and 3.5. §4, §5.

4. **So D332's journey does not fit in the instrument, even at the instrument's best.**
   The campaign's stated 1000→2000 is worth **260.7 real Elo [233.3, 291.0]** over the
   corpus; the whole usable range 1000→2400 is worth **289.6 [256.7, 327.4]**; and the
   most favourable cut available — the full-material ladder from band 1000 to band 2200 —
   is **479.8 Elo [454.9, 504.7]** over 1200 band points `[V]`. Against the coverage
   requirement derived in §3, that the band range must span at least the journey it
   denominates (ratio ≥ **0.714**), the full-material best case reaches **56%** of it, the
   corpus-wide ladder slope **40%**, and the end-to-end `[1000, 2400]` reading **29%**. **A learner Elo computed against Maia bands is real; its scale is
   roughly 290–480 points wide, not 1000.** §6.1.

5. **The dial is coarse: a 100-band step is a real 22–27 Elo, which is below the
   resolution a learner can experience.** §3 derives the rung threshold from the learner's
   own arithmetic rather than choosing one — a 30-game session estimates an Elo to about
   **±60**, so a rung whose real effect is under ~60 Elo is a rung the learner cannot tell
   from its neighbour by their own results. Both 100-step arms land at less than half of
   that: **22.1 Elo [12.4, 31.8]** and **26.9 Elo [16.5, 37.4]** `[V]`. Dividing the
   threshold by the measured slope, **the smallest band step a learner could tell from its
   neighbour is ≈ 150 band points at full material and ≈ 208 over the corpus** — so
   `[1000, 2400]` is worth about **five to nine** rungs, not fourteen. §6.2.

6. **The top of the range is nearly inert.** The 400 band points from 2000 to 2400 buy
   **+28.9 Elo, 95% CI [−16.7, 74.5], p = 0.21** — not distinguishable from nothing
   `[V]`. R10's `[1000, 2400]` bounds where the band still *reaches* the model; it is not
   a bound on where the band still *buys difficulty*. §6.3.

7. **What attenuates the dial is MATERIAL, not the phase label, and below ten pieces it
   stops working.** The widest gap (1000 v 2400) is worth **−468.9 Elo at ≥ 21 pieces**,
   −145.5 at 11–20 and **−72.4 at ≤ 10** `[V]`. At a 100-band step the split is decisive:
   **−28.7** and **−37.2 Elo** at full material, with CIs excluding parity in both arms,
   against **−10.1** and **−4.0** at ≤ 10 pieces, with CIs straddling it in both `[V]`.
   Declared phase tracks this only because the pack corpus's endgame packs are its
   low-material ones. **In low-material content the band is not a difficulty lever**, and
   nothing in the schema, the lint or the authoring tools says so. §7.

8. **None of this is an artefact of production's symmetric conditioning.** Upstream's
   `Elo` sets self *and* opponent (`uci.py:383-385`), so a band-1500 mover is always told
   its opponent is 1500 too. The sensitivity arm that instead sends the true
   `SelfElo`/`OppoElo` pair returns **−249.7 Elo [−283.2, −219.8]** against the
   symmetric arm's −289.6 — a difference of **+39.9 [−7.6, 87.4], p = 0.10**, i.e. no
   improvement and, if anything, a slightly *smaller* gap `[V]`. §8.

**Two by-products, and the first is a correction the repo needs.**

- **Maia is seeded, at `--seed 42`, and nobody in this repo knew.** `maia3-uci` calls
  `seed_everything(cfg.seed)` at process start with `--seed` defaulting to **42**
  (`maia3/uci.py:525`, `:68`; `maia3/utils.py:12-18`), and the shipped ENTRYPOINT does not
  pass one (`workers/maia/Dockerfile`). Measured: two fresh containers given an identical
  20-request sequence returned a **byte-identical** move sequence, twice, and a third at
  `--seed 7` returned a different one, reproducibly `[V]`. So **`human_common` IS
  reproducible — by process replay, not by request replay** — which is a determinism route
  `rfc/archive/resistance-spectrum.md` open question 1 and R5's answer to it never
  considered. §9.2.
- **An unseeded parallel engine-vs-engine harness silently manufactures duplicate games.**
  The first run of this harness, before the seed was found, produced **611 of 611**
  mirrored pairs with **byte-identical move lists** and a **50.8%** duplicate-game rate
  over 1,222 games, collapsing the same-band control to exactly 0.500 with a standard
  error of exactly **0.0** `[V]`. After per-worker seeding the same arm gives 25/680
  identical pairs and a 4.6% duplicate rate. §9.3.

**`DESIGN-GAP:` one, not acted on here (law 5).** `design/06-campaign.md` §2b states
Maia's usable band as `[1000, 2400]` and builds the phase-boss ladder on it without a
magnitude. The magnitude now exists: **≈0.40 Elo per band point at full material, ≈0.29
over the corpus as authored, and ≈0.07 below ten pieces**. §2b's own endgame boss is `perfect_tablebase`,
so the doc is not contradicted — but any campaign rung expressed in band points now needs
the ratio beside it, and endgame packs that use `human_common` at a band have no dial to
turn. Escalated to the owner tier via the ledger and the log rather than edited here.

**No claim is made here about how well Maia plays, at any band, in any position.** Every
number below is a game result counted by `chessops`, an arithmetic transform of a win
rate, or a line read out of the pinned image's source (law 8). No move is graded and no
position is assessed.

---

## 2. Method, and what these numbers are not

**Opening book — the committed pack corpus, not a new one.** `build-book.ts` takes each
`content/drafts/*.json` pack's start position plus its main-line spine prefixes at depths
2/4/6, drops any position with fewer than two legal destination squares, and dedupes by
FEN: **170 positions drawn from 44 of the 47 committed draft packs** — 69 opening,
51 endgame, 44 middlegame, 6 cross-phase; median piece count 30 `[V]`. Using the product's
own drilled positions rather than a neutral book is deliberate: the question is what the
band does *to this campaign's content*, and it makes the phase split in §7 available for
free. The cost is that the book is not balanced — White scores **0.567–0.615** across arms
— which §2's pairing removes rather than tolerates.

**Paired openings, and the pair is the unit.** Every `(round, bookId)` contributes exactly
two games: the same opening with the two band assignments swapped. Colour is balanced by
construction and each opening's own bias cancels *inside* the pair before any variance is
computed. The primary estimator is the mean of pair scores; the unpaired per-game mean is
carried beside it in `summary.json`.

**Standard errors are clustered on the opening.** The same 170 openings are replayed every
round, so pairs sharing a `bookId` share whatever that opening does to the band's leverage,
and treating them as independent would understate uncertainty. `analyze.py` computes a
cluster-robust SE (CR0 with the C/(C−1) correction, C = openings) and carries the larger of
naive and clustered into every CI and every p-value reported here. Inflation factors ran
**0.94–1.45** `[V]`; the largest, on the widest arm, still leaves that arm at p = 1.6e-135.

**Termination is natural or nothing.** Checkmate, stalemate, insufficient material,
fifty-move and threefold, then a 300-ply cap scored as a draw. **No engine adjudication of
any kind** — adjudicating with Stockfish would have made a Maia measurement partly a
Stockfish measurement. It never mattered: over 16,660 games the ply cap fired **0 times**,
and the terminations were checkmate **13,061**, stalemate **1,600**, threefold **1,429**,
insufficient material **400**, fifty-move **170** `[V]`. Overall draw rate **21.6%**;
mean game length **63.0** plies.

**Illegal or missing `bestmove` — zero, and reported as a bound.** Every returned move was
checked for legality against `chessops` before being played; a failure would have voided
the game. It happened **0 times in 16,660 games**, so the honest statement is the
rule-of-three one-sided 95% bound: **the void rate is below 1 in 5,553** (D285 — an
observed zero is a bound, never a ratio) `[V]`.

**Reproducibility, precisely.** The whole run is reproducible **given the seeds**, which is
a stronger statement than this repo could previously make and a weaker one than
bit-identity: each worker is started with an explicit `--seed` (1000 + worker index), so the
recorded 16,660 games are a deterministic function of the schedule and the seed set. Every
game's full move list is recorded regardless, so the analysis is reproducible from the
record even where the record is not re-runnable. `analyze.py` is pure: given the same JSONL
it rewrites `out/summary.json` byte for byte.

**Three deliberate deviations from D324's written design, each stated so it can be
rejected.** (a) D324 says *"on R5's stratified position set"*; R5's set is single positions
chosen for policy probing, and games need starts, so the book is the pack corpus R5's own
extractor draws from — same source, different cut. (b) D324 says *"N ≥ 200 games per
arm"*; every arm here is 680–3,400, because §3's rung threshold needs far more than 200.
(c) D324 specifies only the four-rung ladder; the ladder is run **verbatim** as `run-ladder.sh`
and reported as its own §5, and seven further pairwise arms are run beside it because the
ladder alone cannot measure a 100-point step.

### 2a. The band arrived — audited from the games, not from the commands

The single most likely way this measurement is silently wrong is **D58**: an `Elo`-less
request inherits the previous request's band, and `SelfElo`/`OppoElo` overwrite `Elo` when
sent *after* it. Reading the source proves the harness *intends* to apply the band. Four
checks prove it *arrived*, in increasing strength, all `[V]`.

**(a) The alias, read out of the pinned image.** `cmd_setoption` lowercases the name and
dispatches: `elo` sets **both** `self_elo` and `oppo_elo`, `selfelo`/`oppoelo` set one
each (`/opt/maia3/maia3/uci.py:383-389`, read from `chess-tabiya-maia:dev`), and those two
fields are the only band inputs to the forward pass (`:312-316`). So the harness's order —
`SelfElo 1500`, `OppoElo 1500`, then `Elo <band>` — leaves the requested band in force;
the reverse order would not.

**(b) `Elo` is on every request without exception.** `play-games.ts` builds the band line
unconditionally inside the per-move `commands` array; there is no branch on which a move
is played without one.

**(c) The schedule invariant holds in the recorded data.** Over the widest arm,
**0 of 1,020** records violate `gameIndex even ⟺ whiteLabel == A`, all **510** pairs are
split across two different workers, **0** same-worker pairs, and across the whole run each
of the **13** workers carries exactly one distinct seed (1000–1012).

**(d) The band demonstrably changed the play, proven from the run's own game records.**
`verify-band-applied.py` takes the **first ply** of every game — the one move both arms
play from an identical FEN — and asks whether the two arms' first-move distributions are
one population or two: pooled χ² over book positions with a Monte-Carlo permutation
p-value (2,000 reshuffles, so no asymptotic assumption on sparse tables).

| arm | compared | books | pooled χ² | permutation p | mean TVD |
|---|---|---|---|---|---|
| `null-1500-1500` | 1500 vs 1500 | 130 | 332.3 | **0.649** | 0.414 |
| `ladder-1400-v-1400` | 1400 vs 1400 | 128 | 289.7 | **0.848** | 0.464 |
| `ctl-temp-1500` | T 0.8 vs T 5.0 | 168 | 582.0 | **< 0.0005** | 0.887 |
| `wide-1000-2400` | 1000 vs 2400 | 143 | 494.6 | **< 0.0005** | 0.653 |
| `camp-1000-2000` | 1000 vs 2000 | 145 | 427.7 | **< 0.0005** | 0.577 |
| `step300-1500-1800` | 1500 vs 1800 | 137 | 413.2 | **< 0.0005** | 0.409 |
| `step100-1500-1600` | 1500 vs 1600 | 141 | 469.6 | 0.074 | 0.283 |
| `step100-1900-2000` | 1900 vs 2000 | 131 | 348.3 | 0.213 | 0.278 |
| `asym-1000-2400` | 1000 vs 2400, self/oppo | 142 | 377.3 | **< 0.0005** | 0.715 |
| `ladder-1000-v-1400` | 1000 vs 1400 | 141 | 373.6 | **0.023** | 0.523 |
| `ladder-1800-v-1400` | 1800 vs 1400 | 135 | 354.0 | **< 0.0005** | 0.528 |
| `ladder-2200-v-1400` | 2200 vs 1400 | 136 | 395.9 | **< 0.0005** | 0.574 |

All twelve arms are audited, including every rung of the pre-registered ladder
(`out/band-application-audit.json`), so the D324 verdict in §5 rests on four arms whose
bands are each independently shown to have reached the model.

The audit has **both** controls and both behave: it does not fire on either same-band arm
(p = 0.65 and 0.85, with mean TVD 0.41–0.46 as the sampling-noise floor at ~4 first moves
per arm per book), and it does fire on a non-band lever. **The two 100-step arms do not
fire, and that is a power statement about this test, not about the band** — the first-ply
test sees roughly 20 sampled moves per book per arm, while R10 measured that the *policy*
differs at every 100-Elo step, and the outcome test over the whole game on the same records
rejects at p = 7.7e-06 and 4.1e-07. It is recorded here rather than hidden because it marks
exactly where the first-move channel runs out and the game-length channel does not.

**What these numbers are not.** They are engine-vs-engine results. They do not say Maia at
band 1800 plays like an 1800-rated human, they do not transfer to a human opponent without
further evidence, and a *learner's* score against a band will differ from a *Maia band's*
score against a band for reasons this design cannot see. What they do establish is the
internal scale of the dial the product actually ships.

---

## 3. The thresholds, derived before the run and not chosen after it

Two numbers decide what the result means, and both are derived from claims the repo already
made rather than picked to sit where the evidence would land.

**Coverage — ratio ≥ 0.714.** D332 denominates progression in a **1000→2000** learner Elo.
R10 ruled the usable band range **`[1000, 2400]`**, i.e. **1400** band points. For the band
range to *span* the journey it is being asked to denominate, the transfer ratio must be at
least **1000 / 1400 = 0.714**. Below that, the instrument cannot express the journey no
matter how it is sliced.

**Granularity — a rung must be worth ≥ ~60 Elo.** A rung the learner cannot distinguish
from its neighbour by their own results is not a rung. A learner's score over a session of
about 30 games has a standard error of roughly `0.47/√30 = 0.086` in score units, and
`dElo/dscore = 695` at parity, so the session-scale resolution of the learner's own Elo is
about **±60 Elo**. On a 100-band step that is a required transfer ratio of **0.60**.

Both sit well off the instrument's optimality boundary — neither is "greater than zero",
which is the threshold an underpowered arm would smuggle in — and both were fixed in
`analyze.py` (`derivedThresholds`) before the arms were read.

**Power, stated in advance and achieved.** With a per-game score SD near 0.44 at the
observed draw rates, the paired estimator's minimum detectable effect at 80% power and
two-sided α = 0.05 works out to **13.8 Elo at n = 3,400** and **24.9 Elo at n = 1,020**
`[V]` (`mde_elo_80pct`, computed from each arm's own observed clustered dispersion, not
from an assumed one). So the 100-step arms were sized to resolve a transfer ratio of
**0.14**, which is well under the 0.60 the campaign needs and well under the 0.22 actually
found — **the design could have detected a rung four times smaller than the threshold it
was testing, and it found one three times smaller than the threshold.** A null here would
have been a real null; it did not occur.

---

## 4. The result

Player A is the first band in each pair; score is A's, pooled over both colours, on the
paired estimator with opening-clustered CIs. `Elo(A−B)` is the standard logistic transform
of that score.

| arm | A | B | nominal gap | n | score A | 95% CI | Elo(A−B) | 95% CI | transfer ratio | p |
|---|---|---|---|---|---|---|---|---|---|---|
| `null-1500-1500` | 1500 | 1500 | 0 | 1360 | 0.4956 | [0.475, 0.517] | −3.1 | [−17.7, 11.6] | — | 0.68 |
| `ctl-temp-1500` | 1500 | 1500 @ T 5.0 | — | 680 | 0.9368 | [0.917, 0.956] | **+468.3** | [417.9, 536.0] | — | <1e-300 |
| `wide-1000-2400` | 1000 | 2400 | 1400 | 1020 | 0.1588 | [0.132, 0.186] | **−289.6** | [−327.4, −256.7] | **0.207** [0.183, 0.234] | 1.6e-135 |
| `camp-1000-2000` | 1000 | 2000 | 1000 | 1020 | 0.1824 | [0.158, 0.207] | **−260.7** | [−291.0, −233.3] | **0.261** [0.233, 0.291] | 7.8e-141 |
| `step300-1500-1800` | 1500 | 1800 | 300 | 1700 | 0.4009 | [0.381, 0.421] | **−69.8** | [−84.4, −55.5] | **0.233** [0.185, 0.281] | 2.1e-22 |
| `step100-1500-1600` | 1500 | 1600 | 100 | 3400 | 0.4682 | [0.454, 0.482] | **−22.1** | [−31.8, −12.4] | **0.221** [0.124, 0.318] | 7.7e-06 |
| `step100-1900-2000` | 1900 | 2000 | 100 | 2720 | 0.4614 | [0.446, 0.476] | **−26.9** | [−37.4, −16.5] | **0.269** [0.165, 0.373] | 4.1e-07 |
| `asym-1000-2400` | 1000 | 2400 | 1400 | 680 | 0.1919 | [0.164, 0.220] | −249.7 | [−283.2, −219.8] | 0.178 [0.157, 0.202] | 2.4e-102 |

`[V]` throughout, `tools/d333-band-outcome-harness/out/summary.json`.

**The two controls do their job.** The same-band arm is the only place the design could
have been caught fabricating a difference, and it lands 0.44 pp from parity with a CI that
comfortably contains it. The temperature arm is the only place the design could have been
caught unable to see one, and it lands 43.7 pp away. Neither is decorative: the same-band
arm is what caught the seeding defect in §9.3, when it returned 0.500 with zero variance.

**Multiplicity.** Eight pairwise arms plus four ladder arms is a family of twelve. Holm at
α = 0.05 would require the smallest p in the family to clear 0.05/12 = 4.2e-3; the largest
p among the eight band-bearing arms is **7.7e-06**, so every one of them survives the
correction with three orders of magnitude to spare, and the two control arms are the two
that do not reject. The correction changes nothing and is stated so that it cannot be
asked for later.

---

## 5. D324's own pre-registered ladder

Run verbatim as written in `design/BACKLOG.md` and mirrored in
`planning/exploration/gates.md` §H5: bands {1000, 1400, 1800, 2200} against a fixed
band-1400 reference, 1,020 games per rung.

| rung | score vs band 1400 | 95% CI | Elo vs band 1400 | 95% CI |
|---|---|---|---|---|
| band 1000 | 0.3069 | [0.283, 0.331] | −141.6 | [−161.5, −122.4] |
| band 1400 | 0.4990 | [0.474, 0.524] | −0.7 | [−18.1, 16.8] |
| band 1800 | 0.6304 | [0.606, 0.654] | +92.7 | [75.1, 110.8] |
| band 2200 | 0.7652 | [0.740, 0.791] | +205.2 | [181.3, 231.0] |

**Monotone: yes. All three adjacent 95% CI pairs disjoint: yes. Verdict: PASS** `[V]`
(`summary.json` → `d324PreRegistered`, evaluated mechanically rather than by eye).

The ladder is also the cleanest read of the curve, because all four rungs share one
reference and so are directly comparable without assuming Elo transitivity across arms.
Per-segment: **1000→1400 = 141.6 Elo (0.354 per band point ×100)**, **1400→1800 = 93.4
(0.234)**, **1800→2200 = 112.5 (0.281)**. Whole ladder: **346.8 Elo [315.2, 378.3] over
1200 band points = 28.90 per 100, ratio 0.289 [0.269, 0.309]** `[V]`. The dial is slightly
steeper at the bottom of the range than in the middle.

**The same ladder restricted to full material — the instrument's honest best case.** §7
shows the dial is attenuated where material is low, so the ladder is re-run over the 714
games per rung whose start position has **≥ 21 pieces**:

| rung | score vs 1400 | 95% CI | Elo vs 1400 |
|---|---|---|---|
| band 1000 | 0.2535 | [0.226, 0.281] | −187.6 ± 18.9 |
| band 1400 | 0.4951 | [0.460, 0.530] | −3.4 ± 24.1 |
| band 1800 | 0.6695 | [0.640, 0.699] | +122.6 ± 20.6 |
| band 2200 | 0.8431 | [0.820, 0.866] | +292.2 ± 16.2 |

Still monotone, still all adjacent CIs disjoint, and the span is **479.8 Elo
[454.9, 504.7] over 1200 band points = 39.98 per 100, ratio 0.400 [0.379, 0.421]** `[V]`.
**This is the number to quote when the campaign asks what the band is worth on a real
game from a real opening**; 0.289 is the number to quote across the corpus as it stands.

**The criterion passes and the campaign should not celebrate.** *Monotone with disjoint
CIs* is a test of whether the dial is **ordered**, and R10 had already shown the
distribution is ordered. It says nothing about **scale**, and scale is what D332 needs.
Any dial with a positive transfer ratio passes it at sufficient n — this one would have
passed at 0.05. Recorded as **D342**: the pre-registration was the right instinct aimed at
the wrong quantity, and the replacement question is *"what is the transfer ratio, with a
CI"*, which §4 answers.

---

## 6. What it means for D332's denominator

### 6.1 The scale

The journey the owner named is **1000→2000**. Denominated against Maia bands, that journey
is **260.7 real Elo [233.3, 291.0]** wide as the corpus stands, and the entire usable band
range `[1000, 2400]` is **289.6 [256.7, 327.4]** wide `[V]` — coverage **0.207
[0.183, 0.234]** against the **0.714** §3 derived. On the most favourable cut the
instrument offers, the full-material ladder, the range from band 1000 to band 2200 is
**479.8 Elo [454.9, 504.7]** over 1200 band points — coverage **0.400 [0.379, 0.421]**,
which is **56%** of the requirement `[V]`.

**The band range cannot express a 1000-point journey on any cut of the data.** It can
express a ~290-point one over the corpus as authored, and a ~480-point one if every
encounter is a full-material game.

Three ways out, none of them this dossier's to choose:

- **Restate the journey in the instrument's units.** "1000→2000" becomes the *band* the
  learner faces, not the Elo they hold, and the learner's own Elo is reported on its own
  measured scale. This is the cheapest and it is honest, but it makes *"you'd need proper
  2000 Elo skills"* a claim about the opponent's label rather than the learner's strength —
  which is the exact conflation `coaching-versus-cheating-and-the-band-curve.md` was
  written to prevent.
- **Calibrate the axis.** Publish the transfer ratio and convert: a learner who beats
  band 2000 as reliably as band 1000 beat band 1000 has moved ~261 Elo, not 1000. The
  measurement to do it now exists.
- **Widen the ladder with something other than the band.** The band is one lever; §7 shows
  it is also the weakest one in two of three phases. `design/06` §2b already reaches for
  authored plans in the middlegame and a tablebase in the endgame for exactly this reason.

### 6.2 The granularity

| step | measured | required (§3) | verdict |
|---|---|---|---|
| 1500 → 1600 | 22.1 Elo [12.4, 31.8] | ≥ 60 | **too fine to be a rung** |
| 1900 → 2000 | 26.9 Elo [16.5, 37.4] | ≥ 60 | **too fine to be a rung** |
| 1500 → 1800 | 69.8 Elo [55.5, 84.4] | ≥ 60 | a rung, and the CI's lower end sits on the line |
| 1000 → 1400 | 141.6 Elo [122.4, 161.5] | ≥ 60 | a rung |

**A 100-band step is real and it is not a rung.** It is measurable — both arms reject
parity, at n = 3,400 and n = 2,720 — and it is roughly a third of what a learner could
notice across a session. Dividing the 60-Elo threshold by the measured slope gives the
smallest step that clears it:

- **≈ 150 band points at full material** (60 / 0.400), i.e. about **nine** rungs across
  `[1000, 2400]` if every encounter is a full-material game;
- **≈ 208 band points over the corpus as authored** (60 / 0.289), i.e. about **seven**;
- and on the pairwise arms alone, the first step measured *wholly* above the line is
  **1500 → 1800**, at 300 points.

**So the campaign has somewhere between five and nine rungs, not fourteen** — five on the
most conservative reading, nine on the most favourable — **and 100-point band granularity
should not be offered anywhere a learner can see it.** Ledgered as
**D336**.

### 6.3 The ceiling

The 400 band points from 2000 to 2400 are worth **+28.9 Elo, 95% CI [−16.7, 74.5],
p = 0.21** — derived from the two arms that share a band-1000 reference `[V]`. R10's
`[1000, 2400]` is a bound on where the band still *reaches the model*, and it is correct on
its own terms; it is **not** a bound on where the band still *buys difficulty*. Above ~2000
the dial is not shown to buy any. Ledgered as **D338**; it does not contradict R10, it
adds the second edge R10 explicitly did not measure.

---

## 7. Where the dial fails: material, not phase

Split by the pack's **declared phase**, score is A's; CIs here are the unclustered
per-phase ones and are marked as such.

| arm (A vs B) | opening | middlegame | endgame |
|---|---|---|---|
| 1000 v 2400 | **−459.1** Elo | **−459.5** | **−83.3** |
| 1000 v 2000 | −385.9 | −363.5 | −95.4 |
| band 1000 v 1400 | −183.1 | −196.2 | −48.0 |
| band 2200 v 1400 | +293.6 | +277.2 | **+58.5** |
| 1500 v 1800 | −83.1 | −87.1 | −23.9 |
| 1500 v 1600 | −37.4 | −14.6 | −6.8 |
| 1900 v 2000 | −36.6 | −38.2 | −3.0 |

`[V]`, `summary.json` → `byPhase`. **At the widest gap the band is worth five and a half
times more in the opening than in the endgame** (−459 vs −83).

**But the phase label is not the variable — material is.** Cutting the identical games by
start-position piece count instead, with the paired opening-clustered estimator (§2):

| arm | ≤ 10 pieces | 11–20 pieces | ≥ 21 pieces |
|---|---|---|---|
| 1000 v 2400 (−1400 band) | −72.4 Elo (n 258) | −145.5 (n 48) | **−468.9** (n 714) |
| band 2200 v 1400 (+800) | +52.9 (n 258) | +88.7 (n 48) | **+292.2** (n 714) |
| 1500 v 1600 (−100) | −10.1, CI [0.471, 0.500] (n 860) | — | **−28.7**, CI [0.440, 0.478] (n 2,380) |
| 1900 v 2000 (−100) | −4.0, CI [0.482, 0.506] (n 688) | — | **−37.2**, CI [0.428, 0.466] (n 1,904) |

`[V]`, verified against the per-game records in this pass. **The gradient is monotone in
material and much cleaner than the phase cut**, and at a 100-band step it is categorical:
at full material both arms exclude parity, at ≤ 10 pieces **both arms straddle it**.
Declared phase tracks the effect only because this corpus's endgame packs are its
low-material ones — 51 of the book's 170 entries are endgame and they carry the low piece
counts.

**Which of the two explanations this is.** Two were available: *the band is a weaker lever
in simplified positions*, and *the position, not the opponent, is deciding the game*. The
material cut favours the second as the main term — low-material book entries are the ones
most likely to be objectively decided, and these arms carry the sample's highest draw
rates — but it does not exhaust it: the ≤ 10-piece cut still gives **−72.4 Elo** at the
widest gap, p ≪ 0.001, so the dial is **attenuated, not absent**, and at ≤ 10 pieces a
100-band step is genuinely below this study's resolution rather than shown to be zero.

**The consequence for content is concrete.** `design/06-campaign.md` §2b already routes the
endgame boss to `perfect_tablebase`, so the campaign's *bosses* are unaffected. But every
low-material pack that sets `opponentPolicy: human_common` with a `targetElo` is turning a
dial worth roughly **7 Elo per 100 band points** rather than 40, and nothing in the schema,
the lint or the authoring surface says so. Ledgered as **D339**.

## 8. The conditioning is not the explanation

Upstream's `Elo` option sets **both** self and opponent (`uci.py:383-385`), and the shipped
selector sends the handshake `SelfElo`/`OppoElo` defaults and then `Elo`, so in production a
band-1500 mover is always told it is facing a 1500 whoever it is actually facing. The
obvious objection to a small transfer ratio is that Maia is being denied the information
that would make it play up or down.

The sensitivity arm sends `SelfElo = mover's band` and `OppoElo = opponent's band` and no
`Elo` at all. At the widest gap it returns **−249.7 Elo [−283.2, −219.8]** against the
symmetric arm's **−289.6 [−327.4, −256.7]** — a difference of **+39.9 Elo, 95% CI
[−7.6, 87.4], p = 0.10** `[V]`. Telling Maia its opponent's true rating does not widen the
gap; the point estimate narrows it slightly and the difference is not significant.

**So the ~0.23 ratio is a property of the model's band conditioning, not of the product's
request shape**, and there is no easy win available by changing the request. Ledgered as
**D343**.

---

## 9. What was found on the way

### 9.1 The pre-registration was aimed at ordering, not scale

Covered in §5. Recorded here because the pattern is reusable: *"monotone with
non-overlapping CIs"* is a shape test, and the campaign's question was a magnitude
question. A pre-registered criterion that a positive-but-useless effect passes is a
criterion that cannot fail informatively.

### 9.2 Maia is seeded, at 42, and the shipped image does not say so

`maia3-uci`'s argument parser declares `--seed` with `default=42` (`maia3/uci.py:68`) and
`main` calls `seed_everything(cfg.seed)` before the engine is constructed (`:525`), which
seeds Python's `random`, NumPy and `torch.manual_seed` (`maia3/utils.py:12-18`). The
shipped ENTRYPOINT is `maia3-uci --model 5m --use-uci-history` (`workers/maia/Dockerfile`)
and passes no seed, **so every Maia sidecar this product has ever started has run at seed
42** `[V]`.

Measured rather than inferred. Two fresh containers driven with an identical 20-request
sequence at Temperature 0.8 / TopP 0.92 returned the **same 20 moves in the same order**,
including the same four distinct choices at the same indices; a third at `--seed 7` returned
a **different** sequence, itself reproducible `[V]`. Inside one process, the same request
repeated 20 times returns 4 distinct moves — reproducing R5's finding exactly — because the
stream advances. Both facts are true at once: **the stream is stochastic per request and
deterministic per process.**

This corrects a reading, not a measurement. R5
(`design/research/maia-policy-scalar-stability.md` §9b) describes the mechanism precisely —
*"the `bestmove` stream is a function of how many samples the process has already drawn …
order- and process-dependent state"* — and its §10 concludes `human_common` is not
reproducible and that flipping `seedHonored` *"would make the record less true"*. The first
half stands; **the second now has an option it did not have**: `seedHonored` is false as a
statement about the **UCI surface** (there is no seed option, and the handshake in
`out/maia.identity.json` correctly says so), but the **process** is seed-honoring via a CLI
flag, and a sidecar started with an explicit `--seed` is bit-reproducible end to end given
its request sequence. Whether that is worth recording in the engine identity is the RFC
tier's call, not this dossier's. Ledgered as **D340**.

### 9.3 An unseeded parallel harness manufactures duplicate games, silently

The first full run of this harness used twelve workers with no explicit seed. Its same-band
control arm returned, over 1,222 games:

- **611 of 611** mirrored pairs with **byte-identical move lists** — every opening's two
  mirrored games were literally the same game;
- **601 distinct move lists**, i.e. a **50.8%** duplicate-game rate;
- a paired score of **exactly 0.500000** with a standard error of **exactly 0.0** `[V]`.

The mechanism is §9.2 plus a scheduling accident: with an even worker count, worker *s* and
worker *s+1* received *mirrored* schedules over the same openings from the same seed 42, so
their move streams stayed in lockstep. The control did not merely fail to detect anything —
it reported a perfect, zero-variance null, which is the most confident possible wrong
answer. **A control that returns exactly the expected value with no variance is reporting a
tautology, not a measurement**, and that is the signature to look for.

Fixed by giving each worker `--seed 1000 + index` and using an **odd** worker count so that
worker never lines up with colour. The same arm then gives 1,297 distinct move lists in
1,360 games (4.6% duplicates) and 25/680 identical pairs, and across the whole final run
**16,013 of 16,660** move lists are distinct with **133 of 8,330** mirrored pairs identical
`[V]`. The residual 1.6% slightly inflates the effective correlation and would, if anything,
push the true SEs marginally above the clustered ones reported here — it does not move any
verdict, since the smallest margin in the study is 4.7 SEs. Ledgered as **D341**.

### 9.4 Thread count changes the policy in the seventh significant figure

Pinning workers to one thread was a throughput decision, and it needed checking because
R5's bit-stability result is a fixed-thread-count result. Measured: **six unpinned workers
played 60 games in 440 s (7.3 s/game), the same as one worker alone**, because torch
saturates every core per process; **twelve pinned workers played 120 games in 54 s
(0.45 s/game)** `[V]`. One thread is also nearly as fast as fourteen for a single worker —
21 moves in 2.36 s at 1 thread against 2.14 s at 14 — which is why the pin costs almost
nothing. Measured on one position at band 1500,
Temperature 0: the policy vector is **bit-identical at 1 and 2 threads**, and differs from
the 14-thread reduction only from the **7th significant figure** (0.46140819788 vs
0.461407393217) `[V]` — a reduction-order effect, ~1.7e-6 relative. Every arm in this study
ran at the same pin, so no arm is measured under different arithmetic. Worth recording
because *"the policy is bit-stable"* is now a claim with a stated condition attached.

### 9.5 The book is lopsided and the pairing is what saves it

White scored **0.567–0.615** across arms `[V]` — a first-move-plus-book advantage of 50–80
Elo, far larger than the 100-band step this study set out to resolve. Without the
mirrored-pair design, an arm whose colour assignment was even slightly unbalanced would
have produced an effect several times the size of the real one. The unpaired per-game
estimator is carried in `summary.json` for exactly this comparison.

---

## 10. What this changes

**For D332 (the learner-Elo denominator).** It survives, with its scale corrected. An Elo
computed from results against Maia bands is a real measurement — the bands genuinely
differ in outcomes, at every gap the campaign would use — but **the axis is ~290 Elo wide
over the corpus as authored and ~480 wide at full material, not 1000**, and the campaign's
*"go from Elo 1000-2000"* cannot be read as a claim about the learner's rating on any
external scale without the transfer ratio beside it. The denominator is not refuted; its
units are.

**For D365 (Glicko-2 and the uncertainty term).** The row already says *"a Glicko update
against an opponent whose declared rating does not predict its results produces a
confidently wrong number faster than Elo would"*. That is now measured: the declared rating
over-predicts the result gap by a factor of about **2.5 at full material and 3.5 over the
corpus**. A rating system fed the band as the opponent's rating will converge fast and be
wrong by construction — and RD will narrow anyway, because RD narrows on *volume*, not on
*validity*, so the uncertainty term does not protect against a mis-specified opponent. Fed
the **measured** strength instead (§5's ladder, band 1400 ≡ 0, ≈0.29 per band point over
the corpus and ≈0.40 at full material) it has a defensible input. Ledgered as **D344**.

**For H5 (`planning/exploration/gates.md`).** H5's 2026-08-16 scope note names exactly this
experiment and exactly this criterion, and the criterion **passes**. The narrower claim H5
added — *"the requested band is a difficulty lever and not only a policy lever"* — is
**confirmed**. H5's main statement, that Maia opposition beats weakened Stockfish for
believability, is untouched: this study ran no Stockfish and graded no branch.

**For K5.** Untouched. K5 is about plan coherence over a horizon, and nothing here inspects
a plan. Recorded so the pass on D324 is not mistaken for evidence on K5.

**For `design/06-campaign.md` §2b.** `DESIGN-GAP:` as stated in §1 — the band ladder now has
a magnitude and a phase exception, and neither is in the doc. Owner tier.

**For the harness tier.** §9.2 and §9.3 apply to every future engine-vs-engine measurement
in this repo: seed each worker explicitly, count distinct move lists, and treat a
zero-variance control as a defect rather than a result.

---

## 11. Artifacts

`tools/d333-band-outcome-harness/` — `build-book.ts`, `play-games.ts`, `run.sh`,
`run-ladder.sh`, `analyze.py`, `verify-band-applied.py` (§2's band-application audit),
`derived.py` (§7's material cut), `README.md`, and `out/summary.json`,
`out/band-application-audit.json`, `out/derived.json` plus
`out/maia.identity.json`. Per-game JSONL (16,660 records with full move lists, ~180 MB) is
regenerable from the committed pack corpus and the recorded seeds and is not committed;
`analyze.py` rewrites `summary.json` from it byte for byte.
