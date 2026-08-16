# Does Maia's per-move WDL agree with real human outcomes?

**Question:** the open research row in `planning/work-register.md` §5 —
*"validating Maia's WDL against R9's ply-≤20 ground truth"* — raised by
`design/research/engine-layer-capability-audit.md` §"never-asked-for capabilities" and
registered in code as a **binding experiment**: `apps/server/src/capabilities.ts:108`
carries `{ instrument: "Maia", capability: "per-move wdl", disposition: "unmeasured",
experiment: "D87 compare Maia WDL with R9 ground truth" }` `[V]`. This dossier runs that
experiment.

**Why it became runnable now.** Nobody knew the divisor. `engine-leverage`'s real-Maia
integration run at `b65bd4e` reported candidate WDL summing to 1000 (D236), which is the
first fact that made "convert this triple to an expected score" a defensible operation
rather than a guess. §3 verifies it independently and from the source rather than
inheriting it.

**What it would change.** R9's verdict is *"the oracle discriminates but does not
reach"*: usable human-outcome coverage ends at ply ~20 and is zero by ply 27, and
`design/06-campaign.md` §2a builds the campaign's difficulty-availability axis on exactly
that — measured-by-tablebase, measured-by-outcome, **authored** for the middlegame,
because *"the middlegame between them has no oracle of either kind"*. Maia's WDL is
emitted on 100% of candidate rows at every ply. If it agreed with human outcomes where
both exist, it would be a candidate third instrument that **reaches where R9's oracle
cannot** — and §2a's hole would shrink. If it does not, that route closes.

---

## 1. Verdict

**Split, and the two halves point opposite ways. Where both instruments exist, Maia's WDL
carries real and non-redundant signal — it is the only human-model signal that survives
on the hard half of the population. It does not reach: its agreement decays monotonically
with ply to chance at ply 16–19, on the same pairs where Stockfish's agreement is flat.
The campaign's difficulty-availability axis does not change.**

Six findings, in the order that matters:

1. **The encoding is per-mille, and the two "never-parsed outputs" are one output.**
   **27,330 of 27,330** candidate rows across three command shapes sum to exactly
   **1000**, and **27,330 of 27,330** satisfy `cp == win − loss` `[V]` — because
   upstream computes both that way (`maia3/uci.py:186-193`, `:208-210`). So the expected
   score is an exact affine function of the `cp` beside it: **E = 0.5 + cp/2000**, and
   `score cp` and `wdl` are not two capabilities. §3.

2. **Over the population as a whole, WDL is the weakest instrument measured.** Over
   **5,379** human-decided move pairs pooled across bands 1400/1600/1800,
   sign agreement is: Maia WDL **72.2%** [71.0, 73.4], Maia policy **70.0%**, the
   explorer's own play counts **76.8%**, Stockfish depth 12 **84.2%** `[V]` — against a
   50% floor and a **94.2–99.3%** ceiling measured as the ground truth's own
   reproducibility at an adjacent band. §6.

3. **On the hard half it inverts, and this is the finding worth keeping.** Restricted to
   pairs whose two moves are within 2× of each other in play count — where popularity
   cannot answer — the same measurement gives Maia WDL **65.1%** [62.3, 67.9], explorer
   popularity **54.7%**, Stockfish **78.9%**, and **Maia's own policy 34.4%** [31.7, 37.3]
   — *significantly worse than chance*, tightening to **24.9%** at a 1.25× ratio `[V]`.
   The value head is doing work the policy head cannot do, and it is the only
   human-referenced signal that does. §6.3.

4. **It does not reach past ply 20 — and the control rules out the alternative
   explanation.** Pooled agreement by ply: **81.2%** (0–3), **75.3%** (4–7), **68.8%**
   (8–11), **61.2%** (12–15), **47.9%** (16–19, n = 73, p = 0.82 against chance) `[V]`.
   Over the *identical* pairs Stockfish depth 12 is **flat** — 84.8 / 82.9 / 85.8 / 80.8 /
   **87.7%** — so the decay is a property of this instrument, not of the ground truth at
   depth. §8.

5. **What crosses the wall is availability, not validity.** WDL is emitted on
   **1,788 of 1,788** candidate rows at ply 40+, and its within-position spread *grows*
   with depth — median **10.3 pp** at ply 0–9, **35.9 pp** at ply 40+ `[V]`. The
   instrument speaks loudest exactly where nothing can check it. §8.2.

6. **Two structural mismatches with the object it would be compared against.** Maia's WDL
   is **path-dependent** — only **281 of 5,222** shared move rows are identical between a
   history-conditioned and a bare-FEN probe of the same position, median |Δ| **29 cp**,
   max **576** `[V]` — while the explorer's outcome is position-keyed and aggregates
   transpositions (R9 §8.2: median 3.3%, max 93.2% of a position's games arrive by another
   order). And the **band dial moves it without moving it toward the band**: Pearson
   between Maia's band-to-band change and the human band-to-band change is **0.021–0.044**
   with sign agreement **47.2–52.0%**, while the human change has a real component of
   1.24–2.21 pp after sampling noise is subtracted `[V]`. §9.1, §9.5.

**Cost.** 1,475 Maia probes at a median ~200 ms and 279 Stockfish depth-12 probes with
full MultiPV; the whole measurement is under 20 minutes of wall clock, and the human side
cost **zero new requests** — it is R9's committed reading, reused.

**One sentence:** Maia's per-move WDL is a real second signal that beats popularity
exactly where popularity fails, and it is not the middlegame oracle — it loses its
agreement with human outcomes as it approaches the ply-20 wall, on pairs where a
conventional engine does not, so extrapolating it past that wall has no support and one
piece of evidence against.

**`DESIGN-GAP:`** none opened. `design/06-campaign.md` §2a stands unchanged; this dossier
tested the one live candidate for a third tier and it did not qualify.

**No claim is made here about whether Maia is right about any position.** Every number is
a count returned by the Lichess explorer, a triple printed by a UCI engine, or an
arithmetic relation between them (law 8). Where the two disagree this dossier reports the
disagreement and does not adjudicate it.

---

## 2. Method, and what these numbers are not

**Instruments, three, none of them new.**

- **Maia** is driven through the repo's own `EngineSupervisor` and `maiaDockerSpec`, and
  the harness reproduces `OpponentSelector#maia`'s command shape exactly
  (`opponent-selector.ts:494-520`) — including reading the `SelfElo`/`OppoElo` defaults
  off the handshake before sending `Elo`, which is the shipped order after `0985fa4`.
  §9.2 verifies that shape is not the one the audit condemned. Image
  `chess-tabiya-maia:dev`, identity `Maia3` / `1e13597c…` / model
  `maia3-5m@b6559de2…`, advertised `bandRange {1000, 2400}` (R10's ruled bound), captured
  in `tools/maia-wdl-agreement-harness/out/maia.identity.json` `[V]`.
- **The human ground truth is R9's committed reading, not a fresh pull**:
  `tools/r9-explorer-depth-harness/out/explorer-readings.csv`, 837 `main` rows over 279
  positions × 3 bands as returned on 2026-08-15. Reusing it rather than re-querying is
  deliberate: it makes the two dossiers literally commensurable, it avoids introducing a
  second explorer client, and it removes count drift as a confound. The cost is that the
  corpus is R9's 37-pack corpus, not today's 47 — §5 states what that buys and costs.
- **Stockfish** is R4's probe (`tools/r4-difficulty-harness/probe-sf.ts`) run
  **unmodified** at `go depth 12`, `Threads 1`, `Hash 16`, MultiPV = the exact legal-move
  count, with `ucinewgame` + `Clear Hash` before every probe. 279 positions, **0 errors**,
  median reached depth 12 `[V]`. Using R4's own probe keeps the cp readings the same
  objects R4 and R9 measured.

**The join.** The explorer names moves in SAN and Maia in UCI. `san-map.ts` builds the
map per FEN with **chessops**, the library the runtime itself uses; all **7,084** explorer
move rows resolve, **0 unmapped** `[V]`. Positions are joined by FEN — the explorer's unit
is the position — and move history for the production-shaped arm comes from R4's
extractor, which resolves **279 of 279** `[V]`.

**Harness** (disposable, exploration-gate work under `rfc/0000-rfc-process.md`
§Exploration gate, tied to the `work-register` §5 row):
`tools/maia-wdl-agreement-harness/` — `build-probe-set.py`, `san-map.ts`,
`probe-maia-wdl.ts` (three command shapes), `dump-raw.ts`, `analyze.py`. `README.md` there
is the reproduction recipe; `out/summary.json` is the record. The analyser is pure: given
the same JSONL it rewrites the summary byte for byte.

**Thresholds are inherited, not chosen.** Every population threshold in this dossier is
R9's, taken verbatim so that the population is R9's population and not a new one:

| quantity | value | where it comes from |
|---|---|---|
| per-game variance | **0.25** | R9 §4's conservative bound |
| usable move row | **n ≥ 385** | R9 §4 — the minimum n resolving 5 pp at 95% |
| human-decided pair | **\|Δ\| ≥ 5 pp *and* significant at 95%** | R9 §6.3 |
| engine-tied pair | **\|Δcp\| < 30 at depth 12** | R9 §6.3 |

The one threshold this dossier *produces* — §7.2's 71 cp — is read off a curve rather than
picked, and it sits off the instrument's own optimality boundary by construction (a gap
between two listed moves is not the argmax), which is what `gates.md`'s engine-condition
rule clause 2 requires of any threshold.

**Honesty limits, stated before the numbers:**

1. **The corpus is R9's corpus of authored theory lines**, popular by construction. Every
   coverage figure is a ceiling for a typical position at that ply, and every agreement
   figure is measured on lines somebody chose to write about. §5.
2. **The comparison exists only to ply 20**, and that is not a limitation of this
   measurement — it is R9's finding, and R9 §7.2 showed no population setting reaches
   further. Anything said about deeper plies here is about *availability*, never validity.
3. **A pairwise sign test discards magnitude.** §7.1 measures magnitude separately and it
   is where the two instruments differ most.
4. **The popularity baseline is a bar, not a licence.** §6.2 finds the explorer's raw play
   counts out-predicting Maia's WDL on the full population. That is *not* evidence that
   popularity is quality (`design/05` rung 4 stands) — §6.3 shows most of it is a
   selection effect, and the residue is that a move played rarely at a band is
   disproportionately played by players who are already lost. It is used here only as
   "what a free, already-fetched signal achieves".
5. **Maia-3's own training window is not published in the image** and is therefore not
   controlled for. If it predates the explorer window (2024-01..2026-07), part of any
   disagreement is population drift rather than model error `[M]`.
6. **Explorer counts drift**; the readings are R9's 2026-08-15 snapshot.

---

## 3. The encoding, read off the source and off the wire

**Per-mille, structurally.** `wdl_from_value_logits` softmaxes the value head and hands
the triple to `_probabilities_to_permille`, which floors each component and distributes
the remainder by largest fractional part — so the printed triple sums to exactly 1000 by
construction, not by luck (`/opt/maia3/maia3/uci.py:186-193`, `:196-200`, read out of the
pinned image `chess-tabiya-maia:dev`) `[V]`. Measured across all three arms:
**27,330 of 27,330 candidate rows sum to 1000**, with no other sum observed `[V]`.
**D236 is confirmed and upgraded from an observation to a property.**

**`score cp` is not a second measurement.** `cp_from_wdl(wdl) = win − loss`
(`uci.py:208-210`) `[V]`, and every one of the 27,330 rows satisfies it `[V]`. Therefore

> expected score = (W + D/2)/1000 = (1000 + cp)/2000 = **0.5 + cp/2000**, exactly.

Two consequences. First, the capability register lists `per-move wdl` and
`per-move score cp` as **two** capabilities with **two different dispositions**
(`capabilities.ts:107-109`); for any expected-score question they are one number. Second,
the only information `wdl` adds beyond `cp` is the **draw component** — §7.2 measures what
that component is worth.

**Frame: the side to move at the root.** The value head is evaluated on the position
*after* each candidate move, with `self_elo`/`oppo_elo` swapped, and the result is passed
through `invert_wdl` back to the chooser — the upstream comment says so and the code does
it (`uci.py:326-355`, `:203-205`) `[V]`. So a candidate's WDL is mover-framed, the same
frame as the explorer score once the explorer's W/D/B is oriented to the side to move.
This is read from the source rather than inferred from agreement, which would have been
circular.

**It is a single forward pass, not a search.** `info depth 1` is literal: there is no
tree, and the WDL of a move is the value head's read of the child position
(`uci.py:326-355`). The candidate list is the policy head's top-`MultiPV` (capped at 20 by
`clamp_multipv`).

**Determinism.** Over 40 positions probed three times, twice in freshly started
containers, **799 of 799** candidate rows are byte-identical in `cp`, `wdl` and `policy`
`[V]`. R5 established this for the policy vector; it holds for the value head too, so
nothing in this dossier is a sampling artifact.

**Ours or upstream?** The image applies exactly one patch
(`workers/maia/patches/maia3-uci-policy-mass.patch`) and it adds the `policy` field to the
printed line and nothing else `[V]`. `wdl` and `score cp` are upstream maia3 at commit
`1e13597c…`.

---

## 4. What the two instruments measure, and what the null hypothesis is

This section exists because "agreement between a record and a prediction" is not
automatically the right test, and picking the wrong null would decide the answer before
the measurement.

**The explorer's per-move score** is a record. Its estimand is

> E[result | this position, *this move was played*, both players in band B, Lichess
> 2024-01..2026-07, blitz/rapid/classical].

**Maia's per-move WDL** is a prediction. Its estimand, as the model is built, is

> E[result | the position after this move, both players at band B], under the training
> distribution.

They are estimators of nearly the same quantity — which is why the comparison is
meaningful at all — and they differ in exactly three ways, only one of which is measurable
from here:

1. **Selection on the chooser** (named, not measurable here). The explorer's estimate for
   a move is an estimate over the players who *chose* it. Maia's is not conditioned on
   choice. A move played almost only by players who have already gone wrong will score
   badly for a reason no value head can see. This is the single largest reason a
   disagreement is not an error on either side.
2. **Path** (measured, §9.1). Maia's read is a function of (position, move order); the
   explorer's is a function of (position).
3. **Population window** (named, `[M]`; see §2 limit 5).

**So the null is not 50%.** A signal that beats chance but loses to something already on
the wire buys nothing. The scale used throughout has four measured points, none of them
chosen by this dossier:

| point | what it is | value (pooled, §6.1) |
|---|---|---|
| **floor** | chance on a sign test | 50% |
| **incumbent A** | Maia's own policy mass — already recorded on every selection as `mass` | **70.0%** |
| **incumbent B** | the explorer's per-move counts — fetched in the *same response* as the ground truth, already parsed, already rendered (`corpus.ts:61-65`, `corpus-sentences.ts:16-20`) | **76.8%** |
| **ceiling** | the ground truth's own reproducibility: does the human result at an *adjacent band* order the same pair the same way? | **94.2–99.3%** |

Stockfish depth 12 is carried alongside as a fifth reading, not as a rival human model —
it answers a different question and R9 already established it is not measuring the same
thing at position level.

**H0, stated:** *Maia's per-move WDL orders human-decided move pairs no better than the
signals already available at zero cost.* §6 tests exactly that, and the answer depends on
which half of the population is asked — which is why §6.3 exists.

---

## 5. The population, and what a different one would have done

| | count |
|---|---:|
| positions carried over from R9's `main` readings | **279** |
| bands | 1400 / 1600 / 1800 |
| Maia probes, production-shaped arm | **837** |
| Maia probes, control arms (bare-FEN, `Elo`-only) | **558** |
| Maia probes, determinism arm | **80** |
| Stockfish depth-12 probes | **279** (0 errors) |
| Maia candidate rows parsed | **27,330** |
| explorer move rows joined | **7,084** (0 unmapped) |

**The comparison set.** Positions with at least two usable (n ≥ 385) human move rows:
**157 / 171 / 180** by band. Pairs within those positions: **6,009 / 6,075 / 6,162**.
Human-**decided** pairs (R9 §6.3's definition): **1,944 / 1,770 / 1,843** — **5,557**
in total, on **130 / 137 / 145** positions `[V]`.

**Every decided pair sits at ply 0–20**, median ply **7 / 8 / 8** `[V]`. That is not a
choice; it is R9's wall reappearing as the boundary of the only population on which this
question can be asked at all. **Half the decided pairs are at ply ≤ 8** — so the headline
number of §6.1 is dominated by the first four moves of a game, and §8's ply breakdown is
therefore not a refinement of the verdict but a correction to it.

**Maia's window misses part of the population.** On **47–51 pairs per band** (~2.7%) at
least one of the two human-usable moves is not in Maia's MultiPV-20 list at all `[V]`.
Those pairs are excluded from every agreement figure and counted separately in
`out/summary.json` as `notListed`; they are a small, honest hole rather than a silent one.

**What a different population would have done**, stated because four separate attestations
in this repo say the population decides the answer before the instrument does:

- **A corpus of today's 47 packs instead of R9's 37** would add positions but would also
  require a fresh explorer pull, breaking commensurability with the dossier this one is
  defined against. It would not move the ply-20 boundary (R9 §7.2: no population setting
  does).
- **Dropping the n ≥ 385 floor** would enlarge the pair count severalfold and fill it with
  pairs whose "human ordering" is sampling noise. Agreement would fall toward 50% for
  every instrument and the ranking between them would be unreadable.
- **Merging the three rating buckets** — R9's ×3.1 lever — would destroy the band
  attribution that makes a band-conditioned model comparable to band-conditioned counts.
  It is the one population change that would specifically flatter Maia, because §9.5 finds
  Maia's band response uncorrelated with the human one.
- **The single most consequential split is popularity, and it is inside the population,
  not outside it** — §6.3.

---

## 6. The verdict measurement

For every human-decided pair, the instrument is asked one question: *which of these two
moves did the band score better with?* Agreement is sign agreement. Nothing about
magnitude enters (§7 measures magnitude separately).

### 6.1 The full population

Pooled over the three bands, on pairs where Maia lists both moves:

| instrument | agree | pairs | rate | 95% CI |
|---|---:|---:|---:|---|
| **Maia WDL** | 3,882 | 5,379 | **72.2%** | [71.0, 73.4] |
| Maia policy mass | 3,786 | 5,408 | 70.0% | [68.8, 71.2] |
| Explorer play counts | 4,268 | 5,556 | **76.8%** | [75.7, 77.9] |
| Stockfish depth 12 | 4,532 | 5,385 | **84.2%** | [83.2, 85.1] |
| *ceiling* — human at another band | — | 1,569–1,741 | **94.2–99.3%** | — |

`[V]`. Per band, Maia's WDL runs **77.3% / 72.4% / 66.4%** at 1400 / 1600 / 1800 — and at
band 1800 it is **no better than its own policy head** (66.4% vs 67.8%, overlapping CIs)
`[V]`. Every rate is far from chance (p < 1e-40 throughout); the question was never
whether the signal exists.

**Read plainly: on the population as a whole, Maia's WDL is the weakest of the four
instruments measured, and it is beaten by a number that arrives free in the same HTTP
response as the ground truth.** By H0 as stated in §4, that is a refusal.

### 6.2 Where the engine is silent

R9's sharpest object is the pair Stockfish cannot separate and the human population can.
Restricting to `|Δcp| < 30` at depth 12, pooled across bands (**1,551** pairs):

| instrument | rate | 95% CI |
|---|---:|---|
| **Maia WDL** | **64.6%** | [62.2, 66.9] |
| Explorer play counts | 64.1% | [61.7, 66.4] |
| Maia policy mass | 54.6% | [52.2, 57.1] |
| *ceiling* — human at another band | 90.6–99.1% | — |

`[V]`. Where the engine is silent Maia's WDL is **statistically indistinguishable from raw
play counts** and clearly ahead of its own policy head. It knows something the policy head
does not; it does not yet know anything the explorer response does not already contain.

The single cleanest illustration is R9's own flagship pair. After 1.e4 d5 2.exd5
(`rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2`, ply 3), Black's two moves
**Bg4** (6,542 games) and **Nc6** (5,196 games) are **11 cp** apart at depth 12 and
**22.28 pp** apart in human result at band 1600 — the largest engine-tied separation R9
found. Maia's WDL orders them **the other way**, by **5.05 pp** `[V]`.

### 6.3 The split that inverts the verdict

§6.1's popularity baseline is suspect for a structural reason: a pair is easier to call
*decided* when both counts are large, and the larger-count move is the one the popularity
baseline picks. Splitting the population by the **ratio of the two play counts** removes
that path without changing anything else. Pooled across bands:

| subset | pairs | Maia WDL | Maia policy | Explorer counts | Stockfish d12 |
|---|---:|---:|---:|---:|---:|
| count ratio > 2× ("easy") | ~4,270 | 74.0% | 79.3% | **82.6%** | **85.5%** |
| **count ratio ≤ 2× ("hard")** | **~1,120** | **65.1%** | **34.4%** | 54.7% | **78.9%** |
| ratio ≤ 1.5× | 651 | 64.7% | 29.5% | 52.4% | — |
| ratio ≤ 1.25× | 381 | 63.0% | **24.9%** | 49.1% | — |

`[V]`. Denominators differ slightly per instrument — a pair drops out when Maia does not
list one of the two moves, when Stockfish reports an exact tie, or when the two play counts
are equal — so the pair column is the range; exact per-instrument denominators are in
`out/summary.json` (`comparablePopularityPairs`). 95% CIs on the ≤2× row: WDL [62.3, 67.9],
policy [31.7, 37.3], counts [51.8, 57.5], Stockfish [76.4, 81.2].

Three readings, and the first two are the reason this dossier does not end at §6.1:

1. **Popularity's lead was mostly the selection effect.** With the ratio controlled, the
   explorer's counts collapse to **54.7%**, and at a 1.25× ratio to **49.1%** — chance.
   The free incumbent is free only where the answer is easy.
2. **Maia's WDL survives the control and its policy head inverts.** WDL loses ~7 points
   and stays clearly informative; policy goes to **34.4%**, and *tightening* the balance
   drives it to **24.9%**, not toward 50%. Among two moves the band plays about equally
   often, the move Maia's policy prefers is the **lower-scoring** one about two times in
   three — three times in four once the counts are within 1.25×. That is `design/05` rung 4's *popularity is not quality* appearing as a measured
   inversion rather than a caution — and it is a live warning for anything built on
   `humanConcessionMass`, which is a policy-mass object. The mechanism is not established
   here and is `[M]`; the number is not concentrated in a few positions (140 positions
   contribute, the worst 20 of ~770 disagreements) `[V]`.
3. **Stockfish barely notices the split** (82.9% → 78.9%). It is answering a different
   question and answering it consistently.

**So H0 is refused on the easy half and *not* refused on the hard half.** The honest
statement of the verdict is conditional, and the condition — the ratio of two play counts —
is computable **before** the Maia call, from the response that carries the ground truth.

---

## 7. Calibration: what the number says, not just how it ranks

### 7.1 It is under-dispersed by about half

Over the usable move rows at each band:

| | 1400 | 1600 | 1800 |
|---|---:|---:|---:|
| move rows | 1,307 | 1,365 | 1,416 |
| mean human score | 0.4702 | 0.4756 | 0.4786 |
| mean Maia score | 0.4777 | 0.4833 | 0.4890 |
| SD human | 0.0723 | 0.0626 | 0.0594 |
| SD Maia | 0.0582 | 0.0494 | 0.0447 |
| **median within-position spread, human** | **9.66 pp** | **9.15 pp** | **9.28 pp** |
| **median within-position spread, Maia** | **4.85 pp** | **4.90 pp** | **4.95 pp** |
| Pearson(Maia, human) | 0.732 | 0.647 | 0.548 |
| Spearman(Maia, human) | 0.523 | 0.472 | 0.393 |

`[V]`. **Restricted to the moves humans actually play often enough to measure, Maia's
per-move value spreads about half as far as the human result does**, and it sits
0.8–1.0 pp high. This corrects a reading in
`design/research/engine-layer-capability-audit.md`, which recorded WDL spreading *0.191
median expected score* across a position's listed moves: that figure is over the whole
MultiPV-20 list, most of which is moves nobody plays. On the measurable subset the
direction is the opposite one, and it matters for any future consumer — a difficulty claim
built on these numbers would systematically **understate** how much the choice matters.

Within a position, the median Spearman between Maia's per-move value and the human score
is **0.424 / 0.392 / 0.343**, positive on **88.7% / 77.3% / 74.5%** of positions; policy
gives **0.371 / 0.346 / 0.287** `[V]`.

### 7.2 The draw component — the only thing `wdl` adds over `cp`

| | 1400 | 1600 | 1800 |
|---|---:|---:|---:|
| mean human draw rate | 3.66% | 4.09% | 4.70% |
| mean Maia draw rate | 2.42% | 2.62% | 2.95% |
| Pearson | 0.542 | 0.555 | 0.587 |

`[V]`. Maia's draw prediction is correlated with the human draw rate and **systematically
about 35–40% low**, at every band. The direction of the band effect is right (both rise
with band). So the second degree of freedom is not noise — but it is biased, and nothing
in the product currently asks for it.

### 7.3 The confidence curve, and the threshold it derives

Agreement, band 1600 decided pairs, by decile of Maia's own gap between the two moves:

| decile of \|Δ Maia cp\| | range | pairs | agreement | median human gap |
|---|---|---:|---:|---:|
| 1 | 0–9 | 171 | **45.6%** | 6.99 pp |
| 2 | 9–16 | 171 | 57.9% | 6.65 pp |
| 3 | 16–26 | 171 | 59.6% | 7.48 pp |
| 4 | 26–36 | 171 | 63.2% | 7.45 pp |
| 5 | 36–49 | 171 | 75.4% | 7.15 pp |
| 6 | 49–64 | 171 | 71.3% | 7.30 pp |
| 7 | 65–82 | 171 | 81.9% | 8.23 pp |
| 8 | 82–110 | 171 | 78.9% | 8.61 pp |
| 9 | 110–184 | 171 | 88.3% | 10.11 pp |
| 10 | 185–905 | 171 | **97.1%** | 20.86 pp |

`[V]`. The curve is monotone in the aggregate and its bottom decile is **below chance** —
when Maia says two moves are within 9 cp (0.45 pp of expected score), its ordering is not
information. So a threshold exists, and it can be **derived rather than chosen**: sweeping
the minimum gap and comparing against the incumbent on the *identical* pairs, the smallest
gap at which Maia's WDL beats the explorer's play counts with non-overlapping CIs is

> **|Δ Maia cp| ≥ 71** — i.e. a 3.55 pp expected-score gap — at which point it reaches
> **86.7%** [85.0, 88.1] against the counts' 83.3% [81.6, 85.0], over **34.1%** of decided
> pairs `[V]`.

Two-thirds of the population is the price. Under `gates.md`'s engine-condition rule the
threshold is admissible in form (clause 2: a gap between two listed moves is off the
instrument's optimality boundary — it is not `bestmove` in disguise), but §8 is why it
should not be spent.

---

## 8. Does it reach past R9's ply-20 wall?

### 8.1 No — and the control says the decay is Maia's, not the ground truth's

Agreement pooled across all three bands, by absolute ply from the game start, with the
other instruments measured over the same pairs:

| ply | pairs | **Maia WDL** | 95% CI | Stockfish d12 | Explorer counts | Maia WDL, comparable-popularity subset |
|---|---:|---:|---|---:|---:|---:|
| 0–3 | 648 | **81.2%** | [78.0, 84.0] | 84.8% | 81.4% | 75.5% (n=106) |
| 4–7 | 2,052 | **75.3%** | [73.4, 77.1] | 82.9% | 76.0% | 72.9% (n=369) |
| 8–11 | 2,145 | **68.8%** | [66.8, 70.7] | 85.8% | 78.6% | 62.4% (n=484) |
| 12–15 | 487 | **61.2%** | [56.8, 65.4] | 80.8% | 68.3% | 48.5% (n=136) |
| 16–19 | 73 | **47.9%** | [36.9, 59.2] | **87.7%** | 69.4% | 34.8% (n=23) |
| 20–23 | 3 | — | — | — | — | — |

`[V]`. p against chance for the 16–19 bucket is **0.82** — indistinguishable from a coin.

**The control is what makes this decisive.** If deep pairs were simply noisier — smaller
samples, marginal significance — every instrument would decay together. Stockfish does not
decay at all (84.8 → 87.7%), and the explorer's own counts decay only mildly. **Maia's WDL
is the one instrument losing its grip as it approaches the wall**, and on the
comparable-popularity subset it is already below chance in the ply-12–15 bucket.

Extrapolating a decaying curve past the last point at which it can be checked is not
supportable in either direction; here the direction of the evidence is against.

### 8.2 What does cross the wall

| ply bucket | probes | candidate rows | rows carrying `wdl` | median within-position spread | median listed policy mass |
|---|---:|---:|---:|---:|---:|
| 0–9 | 270 | 5,397 | **5,397 (100%)** | 10.33 pp | 0.9995 |
| 10–19 | 297 | 5,859 | **5,859 (100%)** | 13.30 pp | 0.9989 |
| 20–29 | 96 | 1,920 | **1,920 (100%)** | 17.25 pp | 0.9953 |
| 30–39 | 72 | 1,434 | **1,434 (100%)** | 31.93 pp | 0.9995 |
| 40+ | 102 | 1,788 | **1,788 (100%)** | 35.90 pp | 1.0000 |

`[V]`. Availability is total and never abstains; the spread more than triples with depth.
An instrument that always answers and speaks more emphatically the further it gets from
any check is precisely the shape `design/06` §2a refuses to build a ramp on — a number
across the hole rather than a documented hole.

**This is the clearest single statement of the boundary:** the wall is not a wall in
Maia's output. It is a wall in what can be *said about* Maia's output, and it is in exactly
the same place R9 put it.

---

## 9. Checking the instrument

### 9.1 Path dependence — Maia's WDL is not a function of the position

The production request is history-conditioned (`--use-uci-history` is the image's
entrypoint, and `#maia` sends `position fen <startFen> moves <history>`). The explorer is
position-keyed. Probing the same 279 positions both ways at band 1600:

- **281 of 5,222** shared move rows have an identical `cp`;
- median |Δcp| **29**, p90 **92**, max **576** `[V]`.

`cmd_position` rebuilds the history buffer from scratch on every command
(`uci.py:405`, `:437`), so this is genuine conditioning and not leakage between probes
`[V]`.

**The verdict is unchanged by the choice**: on the identical decided pairs, the bare-FEN
arm agrees at **72.5%** [70.4, 74.6] against the production arm's **72.4%** `[V]`. So the
finding is not "we probed it wrong" — it is that **a quantity which moves by a median of
29 cp depending on how the position was reached cannot be attributed to the position**,
while the object it is being compared to is a position property that aggregates
transpositions (R9 §8.2 measured median 3.3% and max 93.2% transposition inflow).

### 9.2 The shipped command shape does apply the band

`engine-layer-capability-audit.md` measured a live regression in which the shipped order
pinned every Maia request to band 1500. Re-measured at HEAD: the shipped shape (band
defaults, then `Elo`) and an `Elo`-only shape produce **5,466 of 5,466 identical `cp`
values** at band 1400 `[V]`. `0985fa4` ("apply requested Maia bands last") repaired it, and
the primary arm of this dossier is therefore the shipped instrument, not a research
variant.

### 9.3 Determinism

§3's 799/799. Three runs, two of them in fresh containers.

### 9.4 Top-pick agreement, and the audit's 60%

Maia's WDL argmax differs from its policy argmax on **68.1% / 68.8% / 71.0%** of probes at
1400/1600/1800 `[V]` — the same phenomenon the audit recorded at 60% over a different
probe set and MultiPV width, slightly larger here. On positions with at least two usable
human moves, the instrument's top pick is the best-scoring human move on **32.3% / 29.2% /
29.1%** of positions (Maia policy: 24.5 / 21.4 / 22.3; explorer counts: 25.8 / 23.2 /
27.9) `[V]`. All three are poor at picking a winner; the pairwise question is the one any
of them can answer.

### 9.5 Band responsiveness

| band pair | move rows | mean Δ human | mean Δ Maia | SD Δ human | *of which sampling noise* | SD Δ Maia | Pearson | sign agreement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1400→1600 | 1,239 | −0.09 pp | +0.26 pp | 1.83 pp | 1.34 pp | 0.74 pp | **0.021** | 52.0% |
| 1600→1800 | 1,283 | −0.27 pp | +0.39 pp | 1.82 pp | 1.33 pp | 0.81 pp | **0.044** | 47.2% |
| 1400→1800 | 1,171 | −0.33 pp | +0.64 pp | 2.57 pp | 1.32 pp | 1.41 pp | **0.034** | 49.3% |

`[V]`. The noise column is what makes the row readable: subtracting sampling variance
leaves a real human band movement of **1.24–2.21 pp**, so there *is* something to track and
the test has power (attenuation is at most a factor of ~0.86 on the widest pair). Maia's
value does move with the band — 0.74 to 1.41 pp of movement — and its movement is
**uncorrelated with the human movement, at chance on sign**.

Stated carefully, because R10 established that the band dial genuinely reaches the model:
the dial is not inert, and this is not a contradiction of R10. What is measured here is
narrower and is the thing a band-attributed difficulty claim would need — *does the change
Maia makes when you change the band match the change the population actually makes?* — and
the answer is no.

---

## 10. What this changes

**For the campaign's difficulty-availability axis (`design/06-campaign.md` §2a): nothing,
and that is the result.** The axis has three values — measured-by-tablebase,
measured-by-outcome (≤ ply ~20), and authored — because the middlegame has no oracle. The
one live candidate for a fourth has now been tested against the only ground truth that
exists, and it loses its agreement precisely as it approaches the boundary. **The
middlegame stays authored**, and §2a's *"the ramp has a documented hole, and the product
says so rather than inventing a number across it"* is now a measured position rather than
an inherited one.

**For the capability register.** `capabilities.ts:108` carries `per-move wdl` as
`unmeasured` with this dossier as its named experiment. The experiment has run. Under the
audit's own three-state definition of "100%", the honest destination is **not (A) reached**
— it feeds no surface and should feed no grading — and **not (C) a measured impossibility**
— §6.3 shows it carries real signal. It is **(B): published as deliberately unreached, with
the reason being the measurement rather than an absence of demand.** The register entry and
the reason string are code, so the change belongs to work-register cluster B, not to this
dossier. Note also that the register lists `per-move score cp` separately as `reached`
while §3 shows the two are one number.

**For anything built on policy mass.** §6.3's 34.4% is the sharpest thing in this dossier
that is *not* about WDL. `humanConcessionMass` and every rung-3 human-split marker are
policy-mass objects, and on pairs of comparable popularity the policy ordering is
anti-correlated with the human result. Nothing shipped currently converts policy mass into
a quality claim — `design/05` rung 4 forbids it — and this is the first measurement in the
repo showing what the prohibition is worth in points.

**For the explorer's own split — a stale claim corrected, and then priced.**
`engine-layer-capability-audit.md` recorded the per-move W/D/B split as *"fetched and
discarded at parse time"* (`corpus.ts:61-65` summing it into `playedCount`). **That is no
longer true at HEAD:** `parseCorpusResponse` keeps `white`/`draws`/`black` on every move
row (`corpus.ts:56`, `:61-65`, `:79`) and `corpus-sentences.ts:16-20` renders them per move
`[V]` — `engine-leverage` closed it. What this dossier adds is the price of *how* it is
read: the counts behind that split are the **strongest freely-available ordering signal on
the easy half of the population (82.6%)** and are **chance on the hard half (49–55%)**
`[V]`. Rendering them is right; treating a play-count difference as a move ordering is
right only when the counts differ by more than about 2×, and `design/05` rung 4 already
forbids treating them as quality at all.

**What would make WDL a rung-3 instrument, if anyone wants to try again.** Two routes,
both measurable, neither cheap:
1. **A different ground truth at depth.** Everything here is bounded by the ply-20 wall.
   Validating Maia's WDL against *game outcomes from real games continuing through the
   middlegame* — not explorer aggregates — is a different instrument and a different
   dossier, and it is the only route that could test the reach question directly.
2. **Conditioning on the chooser** (§4 limit 1). The explorer's estimate is conditioned on
   the move having been chosen and Maia's is not; a comparison that conditioned both the
   same way would be a fairer test of the value head and might move §6.1 materially. It
   requires per-game data the explorer does not expose.

---

## 11. Residuals

- **The ply-16–19 bucket is 73 pairs.** It is the bucket the reach verdict leans on
  hardest, and its CI is [36.9, 59.2]. The finding is carried by the *monotone trend plus
  the flat Stockfish control*, not by that bucket alone — but a corpus with more deep
  opening content would tighten it, and R9's §11 named the same shortage.
- **Only band 1600 has a bare-FEN arm.** §9.1's path-dependence figure is measured at one
  band; nothing suggests it differs by band, but it was not checked.
- **The magnitude relation is measured only as spread and bias** (§7.1). No calibration
  curve (predicted vs observed in bins) was fitted; with the under-dispersion measured at
  ~2×, a linear recalibration would be the obvious next thing to test and is one afternoon.
- **The draw component is measured and unused.** §7.2 shows it is correlated and biased
  low. Whether a recalibrated draw prediction is worth anything to any surface is unasked.
- **The comparable-popularity split at 2× is a round number.** §6.3 reports 1.25×, 1.5×
  and 2× and the effect strengthens monotonically as the ratio tightens, so no threshold
  is load-bearing — but the split itself was chosen by this dossier and is the one place a
  reader should check the arithmetic rather than the argument.
- **Maia-3's training window is unknown** (§2 limit 5) and bounds every disagreement
  figure from below.
- **The corpus is R9's 37 packs, not today's 47.** Reproducing on the current corpus needs
  a fresh explorer pull (~280 positions × 3 bands at 2,500 ms ≈ 35 minutes) and would test
  whether any of this is a property of which lines were written first.
