# Maia in the endgame — human-shaped, or arbitrary? The D366 verdict

**Question:** D366 (`design/BACKLOG.md:153`), in the owner's framing —
*"isn't [the endgame] THE place where humans play so different from agent?"*
**12 of the 14 `phase: "endgame"` packs declare `human_common`** — Maia — and no
dossier had ever measured whether Maia's endgame *moves* are any good `[V]`. R4
measured that its policy mass is *available* in the endgame
(`practical-difficulty-outside-tablebase.md` §8) and R5 that the scalar is
*stable* (`maia-policy-scalar-stability.md` §3); neither compared a Maia move
against ground truth.

**The question deliberately measured here is not "is Maia strong in endgames".**
It is *"when Maia is wrong, is it wrong the way a human at that band is wrong, or
wrong arbitrarily?"* An opponent that fails plausibly is the product; an opponent
that fails uniformly over the legal moves is noise wearing a human's name, and
would make twelve packs' declared resistance a fiction.

**Why every instrument we own is mismatched exactly here** (all three verified in
this pass):

* **`perfect_tablebase` beelines toward simplification by construction.** It
  orders category-preserving moves by *smallest* |DTZ| when winning
  (`apps/server/src/opponent-selector.ts:635-636`) — distance to *zeroing*, i.e.
  to the next capture or pawn move `[V]`. Measured consequence in §7.
* **The explorer has no endgame coverage, by construction rather than by
  omission.** R9 (`design/research/human-outcome-coverage-depth.md:43-44`)
  measured usable human data ending at ply 20/20/21 by band and **zero games from
  ply 27**; and its §3 records that endgame packs were **excluded outright**
  because their composed roots are unreachable from the standard start, so an
  explorer query on them "is a category error rather than a measurement"
  (`:178-181`) `[V]`.
* **Maia is a policy network with no search**, and it is the default opponent —
  the regime where search matters most and a policy head is weakest `[M]`.

**Instrument:** `tools/d366-endgame-fidelity-harness/` (disposable, permitted
under `rfc/0000-rfc-process.md` §Exploration gate). It drives the repo's own
`EngineSupervisor`, `maiaDockerSpec` and `LichessTablebaseSource` by relative
import; `probe-maia.ts` reproduces `OpponentSelector #maia`
(`apps/server/src/opponent-selector.ts:495-531`) command for command. No second
UCI integration and no second tablebase client exists here.

---

## 1. Verdict

**Human-shaped — decisively — and not band-calibrated. Those are two different
answers and the second one is the problem.**

Over **810 scored probes** on 45 tablebase-critical endgame positions × bands
1100 / 1500 / 1900 × 6 complete repeat rounds, plus **270** on the resistance arm,
zero probe errors `[V]`:

1. **Maia is far better than a coin, and the errors it does make are the mildest
   ones available.** Result preservation **88.1% / 88.9% / 91.9%** by band against
   a uniform-random legal move's **67.0%** on the same positions — a paired
   position-level gap of **+21.2 / +21.9 / +24.9 pp**, cluster-bootstrap 95%
   intervals excluding zero at every band. And **all 84 errors were `win→draw`.
   Not one `win→loss`, not one `draw→loss`, in 810 probes**, where the uniform
   baseline would concede the full point on **31.3%** of its errors. §4.

2. **When Maia is wrong it is wrong *specifically*, not randomly — this is the
   dossier's central measurement.** The 84 errors fall on **6 positions out of
   45** and on **5 distinct moves in total**. Within a position and band the
   erring move is the *same move* on essentially every repeat: mean modal error
   share **0.958 / 1.000 / 0.950**, out of a mean **7.5 available** dropping
   moves, against **0.583–0.640** expected if the erring move were uniform over
   those same dropping moves. Arbitrary is a picture this does not look like. §5.2.

3. **The errors are the model's belief, not the sampler's tail.** The policy head
   is byte-stable per band; its **argmax preserves the result on 39 / 39 / 40 of
   45 positions**, which is the same rate as the sampled move. Turning the
   temperature down would not remove these errors — Maia *prefers* them. §5.4.

4. **And they cluster exactly where club players are said to fail.** All 84
   errors sit in **3 of the 11 packs** — the two pawn packs and one rook-and-pawn
   pack — and **zero** errors appear in the other 8 across 72–90 probes each
   `[V]`. In
   `8/3k4/8/8/5K2/8/4P3/8 w - - 2 2` the tablebase says **exactly one of ten legal
   moves throws the win** — the pawn push `e4` — and Maia plays that one move on
   **13 of 18 probes** across all three bands. **Judgment, flagged as such:** that
   is the textbook club-player error, pushing the passer instead of taking the
   opposition. **Measurement, which stands without the judgment:** a uniform
   random mover finds that move 10% of the time; Maia finds it 72%. §5.3.

5. **The band does not fix any of it.** Position by position, sampled preservation
   at 1900 versus 1100 is **better on 2, worse on 0, tied on 43** (sign test
   p = 0.5). The band *is* reaching the model — verified per probe, §3 — and it
   *does* move the policy: the raw policy mass on result-dropping moves falls on
   **30 of 40** non-tied positions from 1100 to 1900 (p = 0.0022), but by a mean of
   only **4.3 pp**, which is not enough to change which move gets played. §5.5.

6. **On its actual job in these packs — resisting a lost endgame — Maia is
   good.** §2.4 measured that only **5.1%** of corpus positions on Maia's side of
   a pack are decisions at all; the rest are already lost. There, Maia's move sits
   at DTZ percentile **0.72–0.75** against uniform's **0.38**, takes the
   *slowest-losing* move **61–69%** of the time against **23%**, and the
   *fastest-losing* move **3.3%** against **31%** `[V]`. §6.

**One thing this does not say.** Because endgame decisions in our packs sit on the
learner's side (point 6), 41 of the 45 arm-A positions are ones the learner
faces, not ones Maia faces. Arm A measures **what the default opponent does when
asked to play an endgame** — the D366 question — not what will happen inside
these twelve packs. §2.4.

**So what should the twelve packs declare?** §8.5. The short form: `human_common`
is *not* a fiction in the endgame — it is a credible, repeatable, plausibly-wrong
club player. What is a fiction is the **`targetElo` on those twelve packs**. A
pack that says 1900 and a pack that says 1200 get the same endgame moves;
`opposite-bishops-fortress-hold` (1900) and `mate-k-q-technique` (1200) are
choosing a number that this measurement cannot distinguish. **The mode is
sound; the band declaration is the unsupported part.**

---

## 2. What was measured, on what, and against which null

### 2.1 The declared surface (the thing at risk)

Every `phase: "endgame"` pack in `content/drafts`, with its top-level
`opponentPolicy` read verbatim `[V]`:

| Pack | mode | targetElo | start pieces | in 7-man range |
|---|---|---:|---:|:--:|
| `conversion-up-a-piece` | `human_common` | 1150 | 17 | no |
| `lucena-bridge-convert` | `human_common` | 1800 | 5 | yes |
| `mate-k-q-technique` | `human_common` | 1200 | 3 | yes |
| `mate-k-r-technique` | `human_common` | 1200 | 3 | yes |
| `mate-two-bishops` | `human_common` | 1700 | 4 | yes |
| `opposite-bishops-fortress-hold` | `human_common` | 1900 | 6 | yes |
| `pawn-breakthrough-convert` | `human_common` | 1800 | 7 | yes |
| `pawn-opposition-convert` | `human_common` | 1500 | 3 | yes |
| `philidor-passive-rook-convert` | `human_common` | 1800 | 5 | yes |
| `philidor-third-rank-hold` | `human_common` | 1800 | 5 | yes |
| `queen-vs-pawn-seventh-convert` | `human_common` | 1800 | 4 | yes |
| `rook-4v3-same-side-hold` | `human_common` | 1900 | 11 | no |
| `mate-bishop-knight` | `perfect_tablebase` | — | 4 | yes |
| `trajectory-mate-bishop-knight` | `perfect_tablebase` | — | 4 | yes |

**12 of 14 declare `human_common`**, all twelve at `temperature 0.7, topP 0.9,
seedMode per_branch` `[V]`. Note this is **not** the code default
(`DEFAULT_TEMPERATURE = 0.8`, `DEFAULT_TOP_P = 0.92`,
`opponent-selector.ts:74-75`); the probes below therefore run at **0.7 / 0.9**,
the value the packs actually declare, not at the code default.

### 2.2 The corpus

`build-set.ts` takes every spine, deviation and start position of those packs
that is inside the 7-man range, and then walks forward from each — both sides
playing a uniformly random **result-preserving** move drawn from the tablebase,
so the walk stays on the technique the pack is about instead of wandering. Every
visited position is probed once against `LichessTablebaseSource`, sequentially,
and the exact class of **every** legal move is stored.

**507 positions, 11 of the 14 packs, 3–7 pieces** (3: 97, 4: 133, 5: 216, 6: 46,
7: 15) `[V]`. Three packs contribute nothing and the reason is structural, not a
sampling miss: `conversion-up-a-piece` (17 pieces at every authored position) and
`rook-4v3-same-side-hold` (11 pieces, no deviations) are **entirely outside the
tablebase**, and `trajectory-mate-bishop-knight` shares `mate-bishop-knight`'s
root FEN exactly and is deduplicated into it `[V]`.

### 2.3 The null hypothesis, computed rather than sampled

Because the tablebase returns the class of every legal move, the **uniform-random
legal move** baseline is *exact* per position — P(preserve) = |preserving| /
|legal|, and likewise for every conditional statistic. It is never simulated. All
result classes use the **shipped** grading projection
(`OBJECTIVE_ASSESSMENT_SETS`, `apps/server/src/tablebase.ts`): `win` counts only
`win`; `cursed-win`, `draw` and `blessed-loss` all count as a hold.

### 2.4 The two arms, and why there had to be two

A position is **critical** when at least one legal move keeps the mover's result
class and at least one drops it. Only critical positions carry information about
result preservation — everywhere else every legal move scores the same and a
"preservation rate" measures the position, not the opponent.

| | positions | critical |
|---|---:|---:|
| mover is winning | 218 | 160 |
| mover is drawing | 66 | 44 |
| mover is losing | 223 | **0** |
| **on the learner's side of the pack** | 250 | **191 (76.4%)** |
| **on Maia's side of the pack** | 257 | **13 (5.1%)** |

`[V]`, `census.py`. The bottom two rows are the finding that forced the second
arm, and they are reported again as a product consequence in §8.1: **in the packs
as authored, Maia is almost never at an endgame decision.** It is the defender of
a decided-lost position, where every legal move preserves the loss and
preservation is vacuous.

* **Arm A — preservation.** 45 critical positions, round-robined across the 11
  packs and ordered within a pack by `sha256(fen)`, so nothing is chosen for what
  Maia does in it. 37 winning, 8 drawing; median 21 legal moves, median 13
  preserving and 3 dropping; 0–14 plies of authored history.
  **Read this arm correctly.** Because critical positions are overwhelmingly on
  the learner's side (the table above), **41 of the 45 are positions the learner
  faces in the pack as authored** and only 4 are positions Maia faces there (all
  in `philidor-third-rank-hold`) `[V]`. Arm A therefore asks *"asked to play this
  endgame, does Maia hold the result?"* — a **competence** measurement of the
  default opponent, and the only way to ask the D366 question at all given the
  5.1% row. It is **not** a prediction of what happens inside these twelve packs;
  §6 is that.
* **Arm B — resistance.** 15 lost positions **on Maia's own side of the pack**
  with ≥4 legal moves and ≥3 distinct |DTZ| values, where the only measurable
  quality is how long the loss is made to take.

Both arms are probed at bands **1100 / 1500 / 1900** with repeats, written
repeat-major so the analysis always scores **complete, balanced rounds**.

---

## 3. The band you asked for is the band that was applied

D58/D91 make this a precondition rather than an afterthought: an Elo-less request
inherits the previous request's band, and before `0985fa4` the `SelfElo`/`OppoElo`
pair sent *after* `Elo` silently discarded it — so a band comparison can be one
band compared with itself. Four checks, on **every** probe:

| check | result |
|---|---|
| `setoption name Elo value <requested band>` present in the sent command array | **810 / 810** |
| `SelfElo` **and** `OppoElo` sent *before* `Elo` (the D91 order) | **810 / 810** |
| policy vector byte-stable across the 6 repeats of a (position, band) cell | **135 / 135** |
| policy vector **distinct across all three bands** for the same position | **45 / 45** — zero collisions |

`[V]`. The last row is the one that matters: on every position in the arm, bands
1100, 1500 and 1900 produce three different policy vectors, so the band
comparison in §5.5 is a comparison of three bands. The engine handshake read in
the same run reports `Elo`, `SelfElo`, `OppoElo` as `spin default 1500 min 0 max
5000` with the repo's configured `bandRange {min: 1000, max: 2400}` `[V]`.

Two more instrument facts recorded rather than assumed: **0 of 1,095 probes
errored**, and **0 `bestmove`s** fell outside the tablebase's own legal-move list,
so no preservation statistic depends on the MultiPV window. The returned
candidates' raw policy tokens sum to a median of **1.0000** and a minimum of
**0.9657** (the truncation R4 §8 measured, at MultiPV 20).

---

## 4. Result preservation, and the size of the errors

Arm A: 45 critical positions × 3 bands × 6 repeats = **810 probes**. Intervals are
cluster bootstraps over positions (2,000 resamples), not binomial intervals over
correlated probes.

| band | preserved | rate (95% cluster CI) | uniform-random baseline | paired position-level delta |
|---:|---:|---|---|---|
| 1100 | 238 / 270 | **88.1%** [78.5, 96.3] | 67.0% [58.1, 75.2] | **+21.2 pp** [+10.9, +31.4] |
| 1500 | 240 / 270 | **88.9%** [79.3, 97.0] | 67.0% [58.1, 75.2] | **+21.9 pp** [+12.3, +32.0] |
| 1900 | 248 / 270 | **91.9%** [84.4, 98.5] | 67.0% [58.1, 75.2] | **+24.9 pp** [+15.6, +35.1] |

`[V]`. The baseline is identical across bands because it is a property of the
positions, computed exactly from the tablebase.

**The size of the errors is the sharper result.** Every transition observed, over
all 810 probes:

From the 37 winning roots (222 probes per band) and the 8 drawn roots (48 per
band), as rates, against the exact uniform-random rate on the same positions:

| transition | Maia 1100 | Maia 1500 | Maia 1900 | uniform-random |
|---|---:|---:|---:|---:|
| `win→win` | 190 (85.6%) | 192 (86.5%) | 200 (90.1%) | 65.8% |
| `win→draw` | **32 (14.4%)** | **30 (13.5%)** | **22 (9.9%)** | 23.5% |
| `win→loss` | **0 (0.0%)** | **0 (0.0%)** | **0 (0.0%)** | **10.7%** |
| `draw→draw` | 48 (100%) | 48 (100%) | 48 (100%) | 72.4% |
| `draw→loss` | **0 (0.0%)** | **0 (0.0%)** | **0 (0.0%)** | **27.6%** |

`[V]`. **Zero of 84 errors handed over the full point**, where a uniform-random
mover concedes it on 10.7% of winning-root moves and 27.6% of drawn-root moves —
**31.3%** of all the errors it makes. This is the first operationalisation of
"human-shaped" and it is met without qualification: Maia's endgame failures are
half-point failures.

---

## 5. Human-shaped, or arbitrary? Five operationalisations

Each was stated in `analyze.py` before it was run. **Disclosure:** O1, O2, O3, O4
and O5 were written before any probe data existed; **O1b and O4b were added after
seeing rounds 1–2** because the early data raised questions the pre-specified set
did not answer. They are flagged below and should be read as exploratory.

### 5.1 O1 — better than the coin (necessary, not sufficient)

Met, §4: +21 to +25 pp over uniform-random, at every band, cluster-bootstrap
intervals excluding zero.

### 5.1b O1b — *and worse than the coin, exactly where it should be* (exploratory)

Position by position, pooling bands: Maia beats the uniform baseline on **41 of
45** positions and **loses to it on 4** `[V]`. All four are pawn-technique
positions, and it loses to the coin badly:

| position | pack | Maia error rate | uniform error rate | preserving / dropping |
|---|---|---:|---:|---|
| `5k2/8/8/8/3K4/4P3/8/8 w - - 3 3` | `pawn-opposition-convert` | **100%** | 37.5% | 5 / 3 |
| `8/3k4/8/8/5K2/8/4P3/8 w - - 2 2` | `pawn-opposition-convert` | **72.2%** | 10.0% | 9 / 1 |
| `8/2k5/8/8/8/5K2/4P3/8 w - - 4 3` | `pawn-opposition-convert` | **55.6%** | 11.1% | 8 / 1 |
| `8/p4k2/2p5/PP6/8/8/6K1/8 w - - 0 4` | `pawn-breakthrough-convert` | **100%** | 90.9% | 1 / 10 |

An arbitrary mover cannot be *systematically worse than random* on a subset —
that is the signature of a preference. §5.3 says which preference.

### 5.2 O2 — is the error the same move every time, or scattered?

The decisive one. Per (position, band) cell with ≥2 errors:

| band | cells | mean modal error share | expected if uniform over the dropping moves | mean distinct error moves | mean available dropping moves |
|---:|---:|---:|---:|---:|---:|
| 1100 | 6 | **0.958** | 0.589 | 1.17 | 7.5 |
| 1500 | 6 | **1.000** | 0.583 | 1.00 | 7.5 |
| 1900 | 5 | **0.950** | 0.640 | 1.20 | 7.0 |

`[V]`. In aggregate the **84 errors** live on **6 positions** and **5 distinct
UCI moves** — `b5c6`, `e3e4`, `e2e4`, `e5d6`, `e5e6`; in words, the capture
`bxc6` in two related breakthrough positions, the pawn push `e4` in three
different K+P positions, and the two king moves `Kd6` / `Ke6`. Maia does not
wander into the losing half of the move list; it walks into one specific move and
keeps walking into it.

### 5.3 O3/O4 — does the error preserve a plan, and where does it cluster?

**O4, clustering — a strong positive `[V]`.** All 84 errors sit in 3 of the 11
packs — the two pawn packs and one rook-and-pawn pack — and the other 8 are
perfect:

| pack | errors / probes | 1100 | 1500 | 1900 |
|---|---:|---:|---:|---:|
| `pawn-opposition-convert` | **41 / 72** | 16/24 | 13/24 | 12/24 |
| `pawn-breakthrough-convert` | **30 / 54** | 12/18 | 12/18 | 6/18 |
| `philidor-passive-rook-convert` | **13 / 72** | 4/24 | 5/24 | 4/24 |
| `lucena-bridge-convert` | 0 / 90 | | | |
| `mate-bishop-knight` | 0 / 90 | | | |
| `mate-k-q-technique` | 0 / 72 | | | |
| `mate-k-r-technique` | 0 / 72 | | | |
| `mate-two-bishops` | 0 / 72 | | | |
| `opposite-bishops-fortress-hold` | 0 / 72 | | | |
| `philidor-third-rank-hold` | 0 / 72 | | | |
| `queen-vs-pawn-seventh-convert` | 0 / 72 | | | |

By position size: **41 / 216** at 3 pieces (K+P vs K), **30 / 108** at 6, **13 /
234** at 5, and **0** at 4 and 7. By distance to the zeroing horizon: **84 / 432**
at |DTZ| ≤ 10 and **0 / 378** at |DTZ| > 10 `[V]` — every error in this corpus
happens within ten plies of the next capture or pawn move, i.e. at the moment the
pawn decision is live.

**The concrete shape, position by position `[V]`:**

| position | preserving moves | the move Maia plays instead | rate |
|---|---|---|---:|
| `8/p4k2/2p5/PP6/8/8/6K1/8 w` | `b6` only (1 of 11) | `bxc6` — the capture | 18/18 |
| `8/p7/2p1k3/PP6/8/8/6K1/8 w` | `b6` only (1 of 11) | `bxc6` — the capture | 12/18 |
| `5k2/8/8/8/3K4/4P3/8/8 w` | `Kc4,Kc5,Kd5,Ke4,Ke5` | `e4` — the pawn push | 18/18 |
| `8/3k4/8/8/5K2/8/4P3/8 w` | 9 of 10 legal moves | `e4` — the one move that draws | 13/18 |
| `8/2k5/8/8/8/5K2/4P3/8 w` | 8 of 9 legal moves | `e4` — the one move that draws | 10/18 |
| `3k3r/R7/8/4K3/4P3/8/8/8 w` | `Ra8+` only (1 of 21) | `Kd6` (9), `Ke6` (4) | 13/18 |

**Judgment, flagged:** these are the named club-player failures — push the passer
instead of taking the opposition, grab the pawn instead of playing the
breakthrough, move the king instead of the rook. **Measurement, which stands
without it:** the tablebase says which moves keep the win, Maia plays a different
one, and it plays the *same* different one every time.

**O3, plan conservation — a negative, reported as such.** The mechanical version
of "same plan, wrong moment" — is the erring move made by a piece that also has a
result-preserving move? — does **not** separate Maia from the null:

| band | errors | same piece as a preserving move | expected under uniform over dropping | same role |
|---:|---:|---:|---:|---:|
| 1100 | 32 | 22 | 17.8 | 22 (exp. 19.0) |
| 1500 | 30 | 19 | 15.4 | 19 (exp. 16.7) |
| 1900 | 22 | 12 | 13.2 | 12 (exp. 13.8) |

`[V]`. Two bands above the null, one below; nothing to claim. **The
plan-conservation operationalisation failed to discriminate.** The clustering and
concentration operationalisations carried the answer instead.

### 5.4 O4b — belief or sampler? (exploratory)

Maia's `bestmove` is a sample on an unseeded RNG (R5: repeat-stable on 34.3% of
keys), so an error could be a tail draw rather than a preference. The policy
vector is byte-stable per band, so its argmax is a temperature-invariant read of
what the model actually prefers:

| band | argmax(policy) preserves | sampled preservation | mean raw policy mass on dropping moves | share of that mass on its single top dropping move | if it were spread evenly |
|---:|---:|---:|---:|---:|---:|
| 1100 | **39 / 45** | 88.1% | 0.130 | **0.697** | 0.450 |
| 1500 | **39 / 45** | 88.9% | 0.112 | **0.684** | 0.423 |
| 1900 | **40 / 45** | 91.9% | 0.091 | **0.679** | 0.407 |

`[V]`. The argmax rate and the sampled rate agree to within a rounding of each
other. **These errors are what the model believes**, not what the sampler
stumbled into — and the mass that is on losing moves is itself concentrated on
one of them (0.68–0.70 against 0.41–0.45 if spread). Lowering `temperature` would
not remove them.

### 5.5 O5 — does the band move it?

**The same error, at every band.** Position by position, sampled preservation at
1900 vs 1100 is better on **2**, worse on **0**, tied on **43** (exact two-sided
sign test **p = 0.5**) `[V]`. `pawn-opposition-convert` errs 16/24, 13/24, 12/24
across 1100/1500/1900, and the erring move is `e4` at all three.

**The band is not inert — it is just too small to matter here.** On the
deterministic policy head, the raw mass on result-dropping moves falls from 1100
to 1900 on **30 of 40** non-tied positions (**p = 0.0022**), is **strictly
decreasing across all three bands on 22 of 45**, and the mean absolute change is
**0.043** `[V]`. So the dial turns the right way and moves the distribution by
about four percentage points of mass — nowhere near enough to change which move a
`temperature 0.7 / topP 0.9` sample returns.

**And Maia does not play like the tablebase either.** Its move equals the shipped
`perfect_tablebase` pick (the minimum-|DTZ| preserving move, §7) on **50 / 48 / 61
of 270** probes — **18.5% / 17.8% / 22.6%** `[V]`. Whatever `human_common` is
doing in the endgame, it is a different thing from what the exact instrument does,
which is the premise the packs are built on.

---

## 6. Arm B — resisting a lost endgame, which is Maia's actual job here

15 lost positions on Maia's own side of the pack × 3 bands × 6 repeats = **270
probes**. Preservation is vacuous (every legal move preserves the loss), so the
metric is |DTZ| after the move — the same quantity `perfect_tablebase` orders by
when losing (`opponent-selector.ts:635-636`), where slower is better.

| band | mean DTZ percentile (95% CI) | uniform | plays the **fastest**-losing move | uniform | plays the **slowest**-losing move | uniform |
|---:|---|---|---|---|---|---|
| 1100 | **0.751** [0.637, 0.854] | 0.380 [0.330, 0.419] | **3.3%** [0, 10.0] | 31.3% [22.7, 41.4] | **68.9%** [46.7, 86.7] | 22.7% [16.1, 29.6] |
| 1500 | **0.719** [0.577, 0.841] | 0.380 | **3.3%** [0, 10.0] | 31.3% | **61.1%** [36.7, 81.1] | 22.7% |
| 1900 | **0.729** [0.603, 0.842] | 0.380 | **3.3%** [0, 10.0] | 31.3% | **64.4%** [42.2, 84.4] | 22.7% |

`[V]`. Maia resists: it almost never takes the quickest road to the loss and takes
the slowest one about three times as often as chance. Flat across bands, like
everything else measured here. **This is a real property that `human_common` does
not declare, does not measure and does not promise** — it is a side effect of the
policy head, and it is the property twelve packs are actually relying on.

---

## 7. The other instrument: what `perfect_tablebase` actually picks

This is the mode two endgame packs already declare and the obvious fallback for
the other twelve, so its behaviour is part of the answer rather than background.

**Code fact `[V]`** (`apps/server/src/opponent-selector.ts:635-636`): among the
category-preserving moves it sorts by `Math.abs(preciseDtz ?? dtz)` — **ascending
when the root is winning, descending when losing** — and **for a drawn root
neither branch applies, so the comparator degenerates to
`left.uci.localeCompare(right.uci)`: the alphabetically first UCI wins.**

DTZ is distance to *zeroing* — the next capture or pawn move — so "it beelines
toward simplification" is testable as a rate. Measured over the 507-position
corpus, reading move type off the SAN the tablebase itself returned:

| root | n | pick is a capture or pawn move | expected if it picked uniformly among the same preserving moves |
|---|---:|---:|---:|
| winning | 218 | **32 (14.7%)**, Wilson [10.6%, 20.0%] | 9.34% |
| drawn | 66 | 7 (10.6%, [5.2%, 20.3%]) | 4.02% |
| losing | 223 | 14 (6.3%, [3.8%, 10.3%]) | 2.99% |

`[V]`, `census.py`. The winning row is a **1.57× enrichment** toward the move
that resets the clock — real, measurable, and modest. The drawn row is the
sharper point: there the 2.6× is not a DTZ effect at all, because the ordering in
a drawn root is *alphabetical*. A median won position in this corpus offers
**15.5** result-preserving moves and the mode always plays exactly one of them,
deterministically, forever.

---

## 8. Product consequence — what the twelve packs should declare

**8.1 The first consequence is not about Maia's strength at all.** §2.4 measured
that on **257** corpus positions standing on Maia's side of the pack, only **13
(5.1%)** are positions where any legal move could change the result — against
**191 of 250 (76.4%)** on the learner's side. Twelve packs put Maia on the losing
or held side of an already-decided endgame and then declare a *band* for it. The
band buys accuracy at decision points, and at those points there are almost none.
What Maia is actually doing there is **resistance**, which §6 shows it does
well — and which `human_common` neither declares, measures nor guarantees.

**8.2 `practical_resistance` is no longer broken, and the task framing is stale.**
D56's `1 + 1e-9` tolerance is gone: `FLOAT32_POLICY_MASS_TOLERANCE` is now **one
float32 ulp (`2 ** -23`)** in `packages/runtime/src/practical-difficulty.ts:16`,
closed 2026-08-15 by `fixture-realism` (D56 ✅, D69 ✅ in `design/BACKLOG.md`)
`[V]`. It is a candidate today. Three real costs remain, all verified in the
shipped file:

* it truncates its candidate list to the **four lexicographically first**
  preserving moves before scoring (`opponent-selector.ts:653-657`) `[V]` — an
  a1-ward bias with nothing behind it;
* **D57 is still open**: one terminal child skips the vacuity gate and the mode
  then plays the lexicographic first reply under its own name;
* it costs **1 + 4 tablebase probes and 4 Maia calls per move**
  (`opponent-selector.ts:668-709`) `[V]`, where `human_common` costs one Maia
  call.

**8.3 `perfect_tablebase` is exact and, in a drawn root, alphabetical.** §7. It
is the right declaration for the two mate packs that already use it — for a
*mating* technique drill the defender's job is to be perfect — and it is a poor
declaration anywhere the objective is `hold`, where its comparator has no DTZ
term at all.

**8.4 Two of the twelve cannot be repaired by any tablebase mode.**
`conversion-up-a-piece` (17 pieces) and `rook-4v3-same-side-hold` (11 pieces) are
outside the 7-man range at every authored position `[V]`, and pack validation
refuses both `perfect_tablebase` and `practical_resistance` there
(`PERFECT_TABLEBASE_OUT_OF_RANGE` / `PRACTICAL_RESISTANCE_OUT_OF_RANGE`,
`apps/server/src/pack-authoring.test.ts:82-104`) `[V]`. For those two,
`human_common` is not a choice among modes — it is the only mode that exists, and
nothing in this dossier measures it there.

**8.5 So, plainly: what should the twelve declare?**

1. **Keep `human_common` as the mode on all twelve.** The evidence does not
   support replacing it. It preserves the result far better than chance, never
   throws the full point, resists a lost ending three times better than chance,
   and fails in a repeatable, specific, plausible way. A drill wants an opponent
   that can be *beaten by technique and punished for not having it*, and
   `perfect_tablebase` — which never errs and, in a drawn root, plays
   alphabetically — is not that.
2. **Stop treating the per-pack `targetElo` as an endgame difficulty dial.** The
   twelve currently span **1150 to 1900** as if that meant something in the
   endgame, and on 43 of 45 positions it does not change the move played. Either
   the band is revalidated at game level (D333, running in parallel) or the
   endgame packs should converge on one honest number rather than twelve implied
   promises. **This is the owner-facing decision in this dossier.**
3. **Where the pack's own objective is `hold` — `philidor-third-rank-hold`,
   `opposite-bishops-fortress-hold`, `rook-4v3-same-side-hold` — a
   `perfect_tablebase` opponent is the wrong instrument** (§8.3), and
   `practical_resistance` is the mode written for exactly that case (§8.2). Both
   fortress packs that *can* use it are inside the range; `rook-4v3` is not.
4. **Declare the resistance property or stop relying on it.** §6 measures a real
   strength — Maia takes the slowest-losing move 61–69% of the time — that
   nothing in the pack format states, no capability records, and no test guards.
   Twelve packs depend on it and it is currently an accident.

---

## 9. Limits — what this dossier does not say

1. **It is 45 + 15 positions from 11 packs, not a survey of the endgame.** The
   corpus is what the authored endgame packs reach; K+P, R+P, Q vs P and the
   basic mates are over-represented because that is what we ship. Nothing here
   generalises to endgames we have not authored.
2. **The 50-move horizon could not be tested.** Zero of the 507 corpus positions
   carry a `cursed-win` or `blessed-loss` category, at the root or on any legal
   move `[V]`, so the operationalisation "do the errors cluster on the 50-move
   boundary" had **no cases** and is unmeasured rather than refuted.
3. **"Human-shaped" is measured as *not-arbitrary in specific, stated ways*, not
   as *matches a 1500-rated human*.** No human endgame move distribution was
   compared against, because none exists for us to compare against — that is
   exactly R9's finding (§1). Where the dossier says an error looks like a
   club-player error it says so as a **judgment**, flagged inline, resting on a
   measured fact (which move, how often, and its tablebase class) that stands
   without the judgment.
4. **Two packs are outside the tablebase entirely** (§8.4) and are unmeasured.
4b. **Arm A is a competence measurement, not an in-pack prediction.** All six
   positions where Maia errs stand on the **learner's** side of their pack `[V]`;
   in the pack as authored Maia would never be asked to play them. What arm A
   establishes is what the default opponent does when it *is* asked — which is
   the question D366 poses, and which matters wherever `human_common` holds the
   better side (Just Play, and any future endgame pack that inverts the sides).
5. **MultiPV is capped at 20 by the engine** (`workers/maia/README.md`, R4 §8);
   27 of the 45 arm-A positions have more than 20 legal moves, so their policy
   vector covers the top 20 only. Every `bestmove` recorded was nonetheless a
   legal move present in the tablebase's own list, so no *preservation* statistic
   depends on the window; only the policy-mass statistics in §5.4 do.
6. **The band arm is 1100 / 1500 / 1900**, three points inside the configured
   `[1000, 2400]` (`apps/server/src/maia.ts`). It cannot speak about the edges.

---

## 10. Bearing on other rows

* **D333 / D332 (does the band move the RESULT?)** — measured in parallel by
  `tools/d333-band-outcome-harness/` over played games; **not duplicated here**.
  What this dossier adds is the same question at *move* level in the one regime
  where the result of a move is decidable: §5.5. The band moves the endgame
  **policy** deterministically and in the expected direction, and it does **not**
  move the **sampled move**. That is a per-move measurement on 45 positions, not
  a game-outcome measurement, and it does not settle D333.
* **D57 (the `practical_resistance` vacuity gate)** — unchanged and still open;
  §8.2 restates it as a cost of the obvious remedy.
* **D56 / D69** — the task framing that `practical_resistance` "is currently
  broken by D56's tolerance bug" is **stale**; §8.2 shows the shipped constant is
  now one float32 ulp `[V]`.
* **R4's "difficulty is only measurable in endgames"**
  (`practical-difficulty-outside-tablebase.md`) — this dossier is the other half:
  the endgame is also where the *opponent* is least verified, and §5 is the first
  measurement of its accuracy rather than its availability.
