# How deep human win/draw/loss data goes — the R9 verdict

**Question:** R9, "How deep does human win/draw/loss data actually go at our rating bands,
and is the sample large enough to mean anything in a middlegame?" (`design/BACKLOG.md:245`,
ruled the next research question by the owner on 2026-08-15).

**What it blocks.** `design/research/practical-difficulty-outside-tablebase.md` (R4) closes
with the finding that practical difficulty is measurable only in *decided* positions —
88.3% of ≤7-piece corpus positions, but **10.2%** outside it, median |eval| **43 cp**. Where
a position is undecided, no engine can say who is in trouble, and R4 §9 names the one
instrument that might: "**Measuring how far explorer coverage actually reaches into
middlegame positions is the single highest-value follow-up this dossier can name**, and it
is a coverage question, not an engine question." R4's judgement — *the blocker is coverage,
not compute* — is what this dossier tests.

---

## 1. Verdict

**Yes, it discriminates. No, it does not reach the middlegame. R4's judgement holds and now
has a number: the boundary is ply ~20, and it is a boundary of coverage, not of phase.**

Five findings, in the order that matters:

1. **The oracle separates positions the engine cannot.** Over 124 positions where Stockfish
   at depth 12 reports |eval| < 50 cp — R4's undecided regime — and the human sample clears
   400 games at band 1600, the human score ranges from **0.405 to 0.600** (a **19.5 pp**
   spread) and the correlation between the engine's evaluation and the human result is
   **−0.079** `[V]`. The engine explains under 1% of the variance in who actually loses. At
   band 1800 the spread is **26.4 pp** (0.385 to 0.648) and the correlation **−0.043** `[V]`.
   §6.1.

2. **Move-level it is sharper, and that is the form the product needs.** At band 1600, over
   87 positions where at least two individual *moves* each clear 400 games, the best- and
   worst-scoring move differ by a median **9.7 pp**, p90 **26.1 pp**, max **35.4 pp**, and
   **82.8%** of those gaps exceed their own 95% interval `[V]`. Restricted to move pairs
   Stockfish cannot separate at depth 12 (|Δcp| < 30), **475 of 2,814 pairs (16.9%)** are
   separated by the human result by ≥5 pp significantly, the largest by **22.3 pp** `[V]`.
   §6.3.

3. **It stops at about move ten, and that is a property of the data, not of our lines.**
   Across the committed corpus the last ply at which any sampled position clears 400 games
   is **ply 20** at bands 1400/1600 and **ply 21** at 1800; from ply **27** every sampled
   position at every band returns **zero games** `[V]`. §5.1. The corpus-independent check —
   greedily following the single most-played move from the start position — carries
   *position-level* coverage further, to ply **25–29**, but carries **choice-level** coverage
   (three or more moves each with a usable sample) only to ply **19–21** `[V]`. §7.1.

4. **Move-level coverage dies a phase earlier than position-level coverage.** A position
   with 100,000 games still has only its *popular* replies sampled. Mean moves clearing 400
   games per position at band 1600: **10.1** at plies 4–7, **8.6** at 8–11, **4.5** at
   12–15, **2.4** at 16–19, **0.17** at 20–23 — against a mean of ~35 legal moves `[V]`. By
   ply 12 the oracle can rank about **13%** of the legal moves and is silent on the rest.
   §5.3.

5. **Widening the population buys plies, not a phase.** Going from the shipped query
   surface to the entire Lichess database — all nine rating buckets, all six speeds,
   2013-01..2026-08, **7,826,583,590 games** at the start position — multiplies counts by a
   median **×23.4**, and moves the greedy walk's choice-level coverage from ply 19–21 to ply
   **23** `[V]`. §7.2, §7.1. All 26 puzzle-derived on-ramp candidate roots (real-game
   middlegames at plies 21–131) return **0–5 games at every band**; not one clears the
   100-game floor `[V]`. §8.4.

**Cost is not the blocker and never was.** 1,381 explorer requests were issued for this
dossier, serially, with a median server response of **17 ms**; the whole measurement is
minutes of wall clock. Compare R4's out-of-range Stockfish: **938 ms** per position at depth
12, ×8 candidates per selection.

**One sentence:** human win/draw/loss is a real difficulty oracle — it separates
engine-level positions and engine-tied moves with statistical force and information the
engine does not have — but it runs out at **ply ~20** for choosing between moves and returns
literally nothing by **ply 27**, so it extends measured difficulty from "endgames only" to
"endgames and the first ten moves", and the middlegame between them has **no oracle of
either kind**.

**`DESIGN-GAP:`** none opened. R4's judgement stands, sharpened: the blocker is coverage,
and the coverage boundary is **ply ~20**, not the phase boundary.

---

## 2. Method, and what these numbers are not

**Instrument, one only.** Every explorer reading was taken through the repo's own runtime
query surface: `corpusUrl` + `normalizedCorpusQuery` from `apps/server/src/corpus.ts`, which
normalises the FEN with the shipped `transposeKey`, restores neutral counters (`0 1`), and
canonicalises rating buckets and speeds against the published Lichess enums through
`normalizeExplorerQuery` (`apps/server/src/sourcing/explorer.ts:52-58`), setting `moves=12`,
`topGames=0`, `recentGames=0`, `history=true`. The harness supplies its own serial HTTP loop
for exactly one reason, stated plainly: **both shipped clients discard the raw counts below
100 games** (`explorer.ts:91`; `corpus.ts` `parseCorpusResponse`), and the position of that
floor is one of the things R9 has to measure. Nothing else about the query differs from what
the product sends. Authorisation is the operator token in `.env.lichess`, as
`docs/content-sourcing.md` §"Opening explorer priority" requires; the anonymous path returns
HTTP 401.

**Every engine reading** was taken with the **R4 harness, unmodified**:
`tools/r4-difficulty-harness/probe-sf.ts` at `go depth 12`, `Threads 1`, `Hash 16`, `MultiPV`
= the exact legal-move count, with `ucinewgame` + `setoption name Clear Hash` + `isready`
before every probe. Stockfish 18, Homebrew arm64, `SyzygyPath` left empty. Reusing R4's own
probe rather than writing a second one keeps the two dossiers commensurable: the |eval|
classes here are the same readings R4 measured. 279 positions probed at depth 12; median
|eval| **45 cp**, against R4's **43 cp** over its 284 out-of-range positions `[V]` — two
overlapping but not identical position sets agreeing on the undecidedness of the regime.

**Harness** (disposable, exploration-gate work under `rfc/0000-rfc-process.md` §Exploration
gate, tied to R9): `tools/r9-explorer-depth-harness/` — `extract.ts` (corpus → positions with
absolute ply, authored continuations and deviation anchors), `probe-explorer.ts` (serial
explorer probe retaining raw sub-floor counts), `greedy-walk.ts` (the §7.1 instrument check),
`pick-sensitivity.py`, `sf-subset.py`, `to-csv.py`, `analyze.py`. Evidence and summary
artifacts in `tools/r9-explorer-depth-harness/out/`; `README.md` there is the reproduction
recipe.

**Politeness.** One request at a time, a 2,500 ms inter-request delay, and a 60 s wait after
any 429 with three further backoffs, matching the sourcing client's own etiquette
(`explorer.ts:116-125`). **Ten 429s** were received across ~1,390 requests and all ten were
absorbed by the wait; **no request was retried anonymously and no population was
substituted**. The first pilot at an 800 ms delay drew a 429 after 30 requests, which is why
the sweep runs at 2,500 ms.

**Honesty limits, stated before the numbers:**

1. **The corpus is this repo's committed packs, not a sample of chess.** 37 packs in
   `content/drafts/` as of 2026-08-15 (the two wave-4b Scandinavian packs included), 507
   unique positions, 279 of them non-endgame and queried. These are *authored theory lines*
   — popular by construction — so every coverage figure here is a **ceiling** for a typical
   position at that ply, not an average. §7.1 removes the corpus from the question entirely.
2. **Depth is measured as absolute ply from the standard game start**, derived from each
   FEN's own fullmove counter and side to move — not as depth below a pack's root. This is
   the Scandinavian correction applied in advance: a pack root's ply is a property of the
   lines file it was emitted from (`planning/content-era/log.md:1782-1786`), so a
   pack-relative depth would measure the corpus rather than the data.
3. **Thirteen of seventeen non-endgame packs are censored** — their authored spine ends
   before their sample does, so a naive per-pack "falloff" is the content running out. §5.2
   names the four uncensored packs and reports them separately.
4. **The population is 2024-01..2026-07, blitz+rapid+classical, one rating bucket per
   query** — the same query surface the committed explorer artifacts use
   (`planning/content-era/log.md:559-561`, `:1131-1135`). §7.2 measures what each of those
   three choices costs in depth.
5. **Explorer counts drift.** Games are added continuously, so a re-run will not reproduce
   these numbers byte-for-byte. `out/explorer-readings.csv` is the record of what the
   explorer returned on **2026-08-15**.
6. **Nothing here is a chess claim.** Every number is a count returned by the Lichess
   explorer, an evaluation returned by Stockfish, or an arithmetic relation between them
   (`AGENTS.md` law 8). Where the two instruments disagree this dossier reports the
   disagreement; it does not adjudicate which is right about the position. "Move X scores
   45% at band 1600" is a count, not a grade.
7. **One instrument error was found and fixed mid-pass**, recorded rather than silently
   corrected. The first deviation-anchor join resolved `at.spineNodeId` to the position
   *before* that node's move and found only **2 of 154** authored deviations present in the
   explorer response. Verified against `content/drafts/anti-scandinavian-white.json`
   (deviation `p4-qxd5` + `d2d4` is White's third-move alternative, i.e. the position
   *after* ...Qxd5), corrected, and the same join then found **133 of 154**. The 2/154
   reading was a property of the join, not of the data — the same failure shape the
   Scandinavian deferral had.

---

## 3. The corpus and the query

`extract.ts` replays every committed pack in `content/drafts/` from its `start.fen` through
its spine tree, recording for each position the absolute ply, the pack-relative depth,
whether it lies on the first-child main line, the authored continuation, and every authored
deviation's anchor and move. Browser test fixtures (`*.browser.json`) and sidecars are
excluded.

| | Packs | Unique positions | Queried |
|---|---:|---:|---:|
| opening | 18 | 154 | 154 |
| middlegame | 1 | 16 | 16 |
| cross_phase | 2 | 109 | 109 |
| endgame | 16 | 228 | 0 (see below) |
| **total** | **37** | **507** | **279** |

`[V]`, reproducible: `node extract.mjs content/drafts positions.json` →
`packs=37 raw=737 unique=507 opening=154 middlegame=16 endgame=228 cross_phase=109
deviations=275 withAnchor=275`.

Endgame packs are excluded by construction, not by omission: their roots are composed
positions with `fullmove 1`, unreachable from the standard start, so an explorer query on
them is a category error rather than a measurement. The two `cross_phase` trajectories cover
the endgame case honestly instead — they walk from ply 1 to ply 60 through a real game, and
§5 reports what happens at their far end.

**Query.** `ratings=<one bucket>`, `speeds=blitz,rapid,classical`, `since=2024-01`,
`until=2026-07`, `moves=12`, `history=true`, `variant=standard`. Bands **1400 / 1600 /
1800** are queried as three separate single-bucket requests, which is what the product does
when a `human_common` target Elo selects its containing published bucket
(`corpus.ts` `corpusPopulation`).

**The band baselines**, measured rather than assumed — the start position at each band:

| Band | games | score (W+D/2)/N | draw % |
|---:|---:|---:|---:|
| 1400 | 313,059,009 | **0.5177** | 3.86 |
| 1600 | 342,290,891 | **0.5181** | 4.23 |
| 1800 | 290,031,718 | **0.5179** | 4.79 |

`[V]`. Every "skew" in §6 is measured against these, not against 0.500. The three agree to
within 0.04 pp, so the null is stable across bands.

---

## 4. What "usable" means — the threshold, chosen before the measurement

A position with 12 games has a W/D/L split that is noise, and R9 asks for the threshold to be
stated and justified rather than inherited. The statistic is the **score**
`S = (white + draws/2) / total`, the natural summary of a W/D/L triple and the one the
shipped surface already renders (`docs/runtime-corpus-evidence.md`: "totals, W/D/L
percentages").

Each game contributes a value in {0, ½, 1}. Its variance is at most **0.25** (attained with
no draws at S = ½; the measured draw rates of 3.9–4.8% put the true variance near 0.24, so
0.25 is conservative). The 95% half-width on S is `1.96 × √(0.25/n)`, and the smallest n
that resolves a given deviation is:

| Deviation to resolve | minimum n | what it can distinguish |
|---|---:|---|
| ±10 pp | **97** | a 60/40 result from an even one |
| ±5 pp | **385** | a 55/45 result from an even one |
| ±3 pp | **1,068** | the p90 skew this dossier measures (§6) |

`[V]` — computed, not estimated (`analyze.py` `min_n_for`).

Three consequences, and the threshold this dossier uses:

- **The shipped 100-game floor is exactly the 60/40 line.** `explorer.ts:91` and `corpus.ts`
  abstain below 100 games; 97 is the minimum that separates a 60/40 result from an even one
  at 95%. The floor is defensible as shipped, and defensible for *nothing finer*: at n = 100
  the interval is ±9.8 pp, which cannot tell 55/45 from even.
- **The usable threshold for a difficulty claim is n ≥ 400.** §6 measures a mean deviation of
  2.6 pp and a p90 of 4.9 pp; a threshold that cannot resolve 5 pp cannot see the signal at
  all. **400** is used throughout as "usable"; 100 is reported alongside as "the shipped
  floor" and 1,000 as "strong".
- **These are position-level thresholds.** A move's own row needs its own n. §5.3 measures
  that separately, and it is where coverage actually fails.

Reported depth is therefore **depth-to-falloff under n ≥ 400**, with the n ≥ 100 and
n ≥ 1,000 curves beside it so the choice is auditable rather than load-bearing.

---

## 5. Depth of coverage

### 5.1 The curve

Every queried position, grouped by absolute ply. `n` is the number of corpus positions at
that ply; each band's columns are the share of them clearing each threshold.

| ply | n | 1400 median | ≥100 | ≥400 | ≥1k | 1600 median | ≥100 | ≥400 | ≥1k | 1800 median | ≥100 | ≥400 | ≥1k |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 1 | 313,059,009 | 100 | 100 | 100 | 342,290,891 | 100 | 100 | 100 | 290,031,718 | 100 | 100 | 100 |
| 4 | 7 | 3,581,451 | 100 | 100 | 100 | 5,090,809 | 100 | 100 | 100 | 5,463,898 | 100 | 100 | 100 |
| 8 | 16 | 279,073 | 100 | 100 | 100 | 308,690 | 100 | 100 | 100 | 257,307 | 100 | 100 | 100 |
| 10 | 13 | 77,240 | 100 | 100 | 100 | 127,572 | 100 | 100 | 100 | 105,345 | 100 | 100 | 100 |
| 12 | 16 | 11,370 | 100 | 100 | 93.8 | 27,318 | 100 | 100 | 100 | 31,396 | 100 | 100 | 100 |
| 13 | 14 | 5,086 | 100 | 92.9 | 85.7 | 14,145 | 100 | 100 | 100 | 25,983 | 100 | 100 | 100 |
| 14 | 10 | 5,166 | 100 | 100 | 90.0 | 14,175 | 100 | 100 | 100 | 22,222 | 100 | 100 | 100 |
| 15 | 10 | 3,729 | 90.0 | 80.0 | 70.0 | 14,278 | 100 | 90.0 | 80.0 | 29,121 | 100 | 90.0 | 90.0 |
| 16 | 7 | 3,421 | 100 | 85.7 | 71.4 | 10,918 | 100 | 100 | 100 | 11,116 | 100 | 100 | 100 |
| 17 | 8 | 721 | 100 | 75.0 | 37.5 | 2,231 | 100 | 100 | 87.5 | 10,687 | 100 | 100 | 100 |
| 18 | 5 | 142 | 80.0 | 40.0 | 40.0 | 832 | 100 | 100 | 40.0 | 5,232 | 100 | 100 | 100 |
| 19 | 3 | 183 | 66.7 | 33.3 | 33.3 | 1,003 | 100 | 66.7 | 33.3 | 4,347 | 100 | 100 | 66.7 |
| 20 | 3 | 114 | 66.7 | **33.3** | 33.3 | 690 | 100 | **66.7** | 33.3 | 3,110 | 100 | 100 | 66.7 |
| **21** | 5 | 55 | 20.0 | **0** | 0 | 251 | 60.0 | **0** | 0 | 344 | 100 | **40.0** | 20.0 |
| 22 | 6 | 1 | **0** | 0 | 0 | 10 | 16.7 | 0 | 0 | 64 | 16.7 | **0** | 0 |
| 23 | 4 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 30 | 0 | 0 | 0 |
| 26 | 3 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 8 | 0 | 0 | 0 |
| 27–60 | 118 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (zero from ply 29) | 0 | 0 | 0 |

`[V]`, 837 requests; full table in `out/summary.json` `coverageByPly`, raw rows in
`out/explorer-readings.csv`.

Reading it:

- **Through ply 14 the oracle is complete** at 1600/1800 — every sampled position clears
  1,000 games. Band 1400 is already thinning at ply 12 (93.8% clear 1,000).
- **The usable line ends at ply 20** at 1400 and 1600, and at **ply 21** at 1800.
- **The shipped 100-game floor buys two more plies and nothing else**: last qualifying ply
  21–22.
- **From ply 27 onward every sampled position at every band returns literally zero games.**
  There is no thin tail; the data stops.

Ply 20 is White's tenth move. In this repo's own phase vocabulary that is the end of the
opening: the corpus's single `middlegame` pack begins at ply 19, and the positions it is
*about* sit at plies 21–27.

### 5.2 Per pack — and the censoring that would have faked this number

Deepest ply on each pack's first-child main line whose position still clears 400 games,
against the deepest ply the pack actually contains:

| pack | phase | root ply | deepest ply | 1400 | 1600 | 1800 | censored? |
|---|---|---:|---:|---:|---:|---:|---|
| anti-caro-advance-c5-race | opening | 5 | 11 | 11 | 11 | 11 | **yes** |
| anti-caro-advance-early-c5 | opening | 6 | 13 | 13 | 13 | 13 | **yes** |
| anti-dutch-leningrad-white | opening | 2 | 15 | 14 | 15 | 15 | partly |
| anti-french-advance-white | opening | 5 | 13 | 13 | 13 | 13 | **yes** |
| anti-italian-center-attack-black | opening | 5 | 18 | 18 | 18 | 18 | **yes** |
| anti-kid-classical-white | opening | 8 | 20 | **16** | **18** | 20 | no |
| anti-london-black | opening | 5 | 17 | 17 | 17 | 17 | **yes** |
| anti-scandinavian-white | opening | 2 | 15 | 15 | 15 | 15 | **yes** |
| anti-sicilian-najdorf-english-attack | opening | 8 | 17 | 17 | 17 | 17 | **yes** |
| carlsbad-minority-attack | **middlegame** | 19 | 27 | **none** | **20** | **20** | no |
| caro-kann-advance-black | opening | 12 | 12 | 12 | 12 | 12 | **yes** |
| opening-principles-black | opening | 1 | 8 | 8 | 8 | 8 | **yes** |
| opening-principles-white | opening | 0 | 0 | 0 | 0 | 0 | **yes** |
| opponent-intent-early-queen | opening | 3 | 8 | 8 | 8 | 8 | **yes** |
| scandinavian-mainline-black | opening | 15 | 15 | 15 | 15 | 15 | **yes** |
| trajectory-caro-advance-chain-bishops | cross_phase | 2 | **52** | **20** | **20** | **21** | no |
| trajectory-qgd-exchange-minority | cross_phase | 1 | **60** | **17** | **18** | **18** | no |

`[V]`. **Thirteen of seventeen packs are censored** — the authored spine ends at or before
the ply where the sample would have failed, so their "falloff" is the content running out. A
median over all seventeen would report 15 and be an artefact of how deep this repo writes
packs.

The four uncensored rows are the measurement: **anti-kid-classical-white 16/18/20**,
**carlsbad-minority-attack none/20/20**, **trajectory-caro 20/20/21**, **trajectory-qgd
17/18/18**. They agree with the pooled curve of §5.1 and with §7.1's corpus-independent walk.

The middlegame pack is the sharpest single row. At its own root (ply 19) it has **183** games
at 1400, **1,003** at 1600 and **4,347** at 1800 `[V]` — below the usable threshold at the
band it is most likely to be drilled at, above it two buckets up. Its objective positions at
plies 21–27 have **0–344** games.

### 5.3 Move-level coverage fails a phase earlier

The product does not consume a position total; it consumes "what happened after each move".
Mean number of moves whose *own* row clears each threshold, per position, at band 1600:

| ply bucket | positions | mean legal moves | mean moves ≥100 | mean moves ≥400 | positions with ≥1 usable move |
|---|---:|---:|---:|---:|---:|
| 0–3 | 16 | 24.8 | 11.88 | 11.50 | 16/16 |
| 4–7 | 44 | 32.6 | 10.95 | 10.07 | 44/44 |
| 8–11 | 56 | 35.7 | 9.91 | 8.59 | 56/56 |
| 12–15 | 50 | 35.3 | 7.16 | **4.52** | 48/50 |
| 16–19 | 23 | 36.5 | 4.43 | **2.43** | 20/23 |
| 20–23 | 18 | 38.8 | 0.56 | **0.17** | 1/18 |
| 24+ | 72 | ~35 | 0 | 0 | 0/72 |

`[V]`. The explorer returns at most 12 move rows (`moves=12`, `explorer.ts:69`), so the first
two buckets are censored at 12 by the request; every bucket from ply 8 on is below the cap
and therefore a real reading.

**At ply 12–15 the oracle covers 4.5 of ~35 legal moves — about 13%.** At ply 16–19, 2.4 of
36 — about 7%. A learner's mistake is by definition an unpopular move, so this is the shape
of the problem, and it is worse than the position-level curve suggests.

**Against the authored content it holds up better than that ratio implies**, because authored
alternatives are plausible ones. Of the corpus's **275 authored deviations**, 154 sit at
anchors inside the queried set, and at band 1600 **133 (86.4%) appear as a move row at all**
and **116 (75.3%) clear 400 games** `[V]`:

| deviation class | anchored in queried set | move clears 400 at 1600 |
|---|---:|---:|
| `accepted_alternative` | 68 | **61 (89.7%)** |
| `interesting_deviation` | 43 | 28 (65.1%) |
| `concept_violation` | 30 | 18 (60.0%) |
| `tactical_error` | 13 | 9 (69.2%) |

The authored spine's own next move clears 400 games at **142 of 235** queried nodes (60.4%),
the shortfall being the deep nodes of §5.1 rather than a coverage failure at the top.

---

## 6. The decisive test: does human WDL separate what the engine cannot?

This is the measurement R9 exists for. R4 established that outside the tablebase 89.8% of
corpus positions have no outcome class at ±100 cp and the median |eval| is 43 cp. If human
counts on those same positions come back at ~50% across the board, the oracle adds nothing.

**Setup.** Every queried position that (a) clears the usable threshold at the band and (b)
has a Stockfish depth-12 full-MultiPV probe from R4's harness. Classified by |eval| of the
best move exactly as R4 classifies: **level** = |eval| < 50 cp, **decided** = |eval| ≥ 100
cp. The engine reading is oriented to White before any correlation is taken (Stockfish
reports from the side to move; the human score is White-relative). The level pool spans plies
**0–20**, median ply 10.

### 6.1 Position level

Band 1600, |eval| < 50 cp, ≥400 games — **124 positions**, median 104,496 games:

| | level (<50 cp) | all with data | decided (≥100 cp) |
|---|---:|---:|---:|
| positions | **124** | 189 | 5 |
| mean score | 0.5104 | 0.5123 | 0.5216 |
| SD of score | **0.0320** | 0.0334 | 0.0561 |
| min / max score | **0.4053 / 0.6004** | 0.4053 / 0.6327 | 0.4168 / 0.5774 |
| spread | **19.5 pp** | 22.7 pp | 16.1 pp |
| mean \|deviation from baseline\| | **2.60 pp** | 2.61 pp | 4.56 pp |
| p90 \|deviation\| | 4.85 pp | 4.92 pp | 10.13 pp |
| deviates beyond its own 95% CI | **87.1%** | 85.2% | 80.0% |
| deviates ≥5 pp *and* significantly | **7.3%** | — | — |
| deviates ≥10 pp | 1.6% | 2.6% | 20.0% |
| **Pearson(engine cp, human score)** | **−0.079** | −0.190 | −0.546 |

`[V]`. The same three columns at band 1400 give a level spread of **18.3 pp** and Pearson
**−0.011**; at band 1800, **26.4 pp** (0.3845 to 0.6483) and Pearson **−0.043** `[V]`.

Four readings:

1. **The oracle is not flat.** If level-by-engine positions all returned ~50%, the SD would
   sit at the sampling floor (~0.15 pp at these sample sizes). It is **0.032** — two hundred
   times larger. The spread is signal, not noise.
2. **It is independent of the engine.** Among level positions the engine's own evaluation
   explains **r² < 0.7%** of the variance in the human result at every band. This is the
   claim R9 needed: the human counts are not a noisy restatement of the engine.
3. **The typical skew is modest; the extremes are not.** Mean deviation 2.6 pp, p90 4.9 pp —
   but the tails reach a **0.405** and a **0.648** score: positions Stockfish calls level
   (−21 cp, +34 cp) where the human population loses roughly 60/40. Restricted to plies ≥ 12,
   where the campaign would actually want this: **48 positions**, SD **0.035**, range
   **0.4053–0.6004** `[V]` — the signal does not weaken with depth, it just runs out of data.
4. **Significance is cheap here and must not be over-read.** 87.1% "significantly differ from
   baseline" mostly reflects sample sizes in the tens of thousands; a 0.6 pp deviation is
   significant and useless. The honest headline is the **7.3% that are both ≥5 pp and
   significant**, and the 19.5 pp full spread.

Two positions, cited so the claim is checkable:

- `2kr1b1r/ppp1pppp/2n2n2/q7/3P2b1/2N2N2/PPP1BPPP/R1BQ1RK1 w - - 7 8` (ply 14,
  `anti-scandinavian-white`). Stockfish d12: **−21 cp**. Band 1600: 15,574 games, score
  **0.4053** (±0.76 pp). Band 1800: 16,619 games, score **0.3845** (±0.72 pp) `[V]`.
- `rn2kbnr/pp3ppp/1q2p3/2ppPb2/3P4/4BN2/PPP1BPPP/RN1QK2R w KQkq - 2 7` (ply 12,
  `caro-kann-advance-black`). Stockfish d12: **+34 cp**. Band 1600: 1,111 games, score
  **0.6004** (±2.84 pp). Band 1800: 2,447 games, score **0.6483** (±1.86 pp) `[V]`.

Two positions the engine calls level to within 55 cp of each other, whose human results sit
**26 pp apart** along an axis the engine does not point down.

### 6.2 The decided control is too small to carry weight

Only **5** queried positions are both decided at ±100 cp and covered at ≥400 games — the two
conditions are close to disjoint, because a decided position is one somebody blundered into
and nobody repeats. Their Pearson(cp, score) is **−0.546** and their mean deviation 4.56 pp,
both in the expected direction, and n = 5 is not a result. Recorded, not relied on. It is
also a finding in its own right: **the regime where the engine works and the regime where the
human oracle works barely overlap in real play.**

### 6.3 Move level — engine-tied, human-separated

The sharper form. For each position clearing the usable threshold, take the moves whose own
row clears it, convert each move's score to the **mover's** perspective, and compare.

| band | positions with ≥2 usable moves | median best−worst gap | p90 | max | gaps beyond their own 95% CI | gaps ≥10 pp |
|---:|---:|---:|---:|---:|---:|---:|
| 1400 | 78 | **10.48 pp** | 22.85 | 34.13 | 87.2% | 40/78 |
| 1600 | 87 | **9.70 pp** | 26.12 | 35.36 | 82.8% | 43/87 |
| 1800 | 89 | **9.12 pp** | 21.65 | 31.98 | 88.8% | 38/89 |

`[V]`. Now the join with the engine. Over every pair of usable moves within a position, keep
the pairs Stockfish cannot separate at depth 12 (|Δcp| < 30, inside R4's own noise band):

| band | move pairs | engine-tied pairs | of those, human-separated ≥5 pp *and* significant | median gap among tied | max |
|---:|---:|---:|---:|---:|---:|
| 1400 | 5,778 | 2,663 | **486 (18.3%)** | 2.31 pp | 26.83 pp |
| 1600 | 5,873 | 2,814 | **475 (16.9%)** | 2.28 pp | 22.28 pp |
| 1800 | 5,978 | 2,992 | **600 (20.1%)** | 2.46 pp | 19.27 pp |

`[V]`. **One pair in six that the engine calls a tie, the human population separates by 5 pp
or more with statistical force.** The largest at band 1600: after 1.e4 d5 2.exd5 (ply 3,
`rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2`), Black's **Bg4** (6,542 games)
and **Nc6** (5,196 games) are **11 cp** apart at depth 12 and **22.3 pp** apart in human
result `[V]`.

This is the object `rfc/resistance-spectrum.md` needed a grounded classifier for. Outside the
tablebase there is no classifier, but there *is* a direct result distribution per move —
which is the quantity the classifier was a proxy for. **It exists to about ply 19–21 (§7.1)
and not beyond**, and it thins from ply 12 (§5.3).

---

## 7. Checking the instrument

The Scandinavian lesson (`planning/content-era/log.md:1782-1786`) is that a depth reading can
be a property of the pull. Every §5 number comes from lines this repo happened to author, at
one window, three speeds and one rating bucket. All four choices were tested.

### 7.1 Is ply 20 our corpus, or the data? — the greedy walk

`greedy-walk.ts` starts at the standard position and repeatedly plays the **single
most-played move** in the explorer's own response, querying at every ply. This is the densest
path the database has; it owes nothing to `content/drafts/`. Two thresholds matter: the
position's own total, and how many *individual moves* still carry a usable sample — because a
position with 3,000 games and one playable-with-data move cannot support a comparison.

| walk | last ply with position ≥1,000 | ≥400 | ≥100 | last ply with **≥3 moves** ≥400 | ≥2 moves | first ply with zero games |
|---|---:|---:|---:|---:|---:|---|
| band 1400 | 28 | **29** | 30 | **19** | 27 | 33 (mate at 32) |
| band 1600 | 23 | **25** | 28 | **20** | 22 | 50 |
| band 1800 | 24 | **26** | 29 | **21** | 21 | 50 |
| ceiling (all 9 buckets, all 6 speeds, 2013-01..2026-08) | 24 | **27** | 28 | **23** | 23 | 29 (mate at 28) |

`[V]`, `out/walk-*.jsonl`. Columns are the **last ply at which the condition holds**, not the
first at which it fails: coverage is not monotone along a walk (the band-1800 walk drops to
2 usable moves at ply 16 and recovers to 5 at ply 20, because a forced recapture concentrates
the sample and the next branch point spreads it again). The band-1600 walk is capped at ply
60 and carries a single game per ply from ply 35 — one game followed to its end, which is the
degenerate form of "coverage" and the reason the ≥3-moves column is the one that matters.

Three things follow, and the first partially corrects §5:

1. **Position-level coverage on the densest line reaches ply 25–29, not ply 20.** §5.1's
   ply-20 figure is a property of the corpus's lines being less dense than the single most
   popular line in chess. Stated plainly: *the number of plies at which a position has a
   usable sample depends on how popular that line is*, and our lines are popular but not
   maximally so.
2. **Choice-level coverage does not follow it.** The last ply at which three or more moves
   each carry 400 games is **19–21** on the band walks and **23** at the absolute ceiling.
   This tracks §5.3 exactly, and it is the number the product depends on: the deep tail of a
   greedy walk is deep partly *because it is forced* — the band-1400 walk runs through
   Bxa1 / Re1+ / Ne7 / Rxe7+ into mate, where each position has one move with data because
   there is one move.
3. **The corpus's own boundary is right for the corpus.** §5.2's four uncensored packs fall
   off at ply 16–21; the greedy walk's choice-level boundary is 19–21; and §5.3's
   corpus-wide move-level curve falls below one usable move per position in the ply-20–23
   bucket. Three independent readings land on the same boundary.

### 7.2 The window, the speeds, the band width

Thirty ply-stratified positions, each re-queried under a widened population. Multiplier is
against the same position's band-1600 shipped-surface total:

| change | median multiplier | what it costs |
|---|---:|---|
| window 2024-01..2026-07 → **2013-01..2026-08** (whole database) | **×3.51** | recency; mixes a decade-old population into a band claim |
| speeds blitz+rapid+classical → **all six** | **×1.35** | mixes ultraBullet/bullet time controls into a "what people play" claim |
| one rating bucket → **1400+1600+1800 merged** | **×3.10** | **the band**, which is the whole point |
| all three at once (the ceiling) | **×23.41** | all of the above |

`[V]`, n = 17 positions with a non-zero baseline. At ply 26 the ceiling returns 154 and 319
games where the shipped surface returns 7 and 2; at ply 30 and beyond every population
returns **0**.

**Reading it.** The ply-20 boundary is not an artefact of a stingy query. The single largest
available lever — merging rating buckets — is precisely the one that destroys the
band-specific claim R9 is about, and even spending all three levers at once moves
choice-level coverage from ply 19–21 to ply **23** (§7.1). *There is no population setting under
which this instrument reaches the middlegame.*

### 7.3 Two smaller instrument facts

- **The FEN normalisation is clean.** Zero of the 1,197 sweep query FENs carried an
  en-passant square, so no position was silently split into an ep-variant with a smaller
  sample `[V]`. (`transposeKey` keeps the ep field; chessops only emits it when the capture
  is legal, so the risk existed and did not fire.)
- **The rate limit is the pull's only real hazard.** A pilot at 800 ms drew a 429 after 30
  requests; at 2,500 ms, ten 429s across ~1,390 requests, all absorbed. Median server
  response **17 ms** `[V]`. Coverage numbers are unaffected — a 429 is a retry, not a zero.

---

## 8. The honest limits

### 8.1 Band dependence — a 1400 reading does predict an 1800 one, mostly

179 positions clear 400 games at **all three** bands simultaneously:

| band pair | Pearson r | mean \|Δ score\| | p90 | max | flips which side is above even |
|---|---:|---:|---:|---:|---:|
| 1400 ↔ 1600 | **0.930** | 0.93 pp | 2.19 | 4.31 | 13/179 |
| 1600 ↔ 1800 | **0.937** | 0.98 pp | 2.16 | 4.80 | 13/179 |
| 1400 ↔ 1800 | **0.805** | 1.66 pp | 3.80 | 6.59 | 16/179 |

`[V]`. The ordering transfers well across one bucket and adequately across two; the typical
disagreement (0.9–1.7 pp) is smaller than the typical signal (2.6 pp) but not negligible
against it, and **7–9% of positions flip which side is above even**. A difficulty claim keyed
to the wrong band is usually right and occasionally backwards — which is exactly why the
shipped surface attributes every rendered result to its population
(`docs/runtime-corpus-evidence.md`) rather than stating it flatly.

**Coverage runs the other way.** At the deep end the *higher* band has more games, not fewer
(§5.2's middlegame pack: 183 / 1,003 / 4,347 at ply 19), because deeper theory is played by
stronger players. The band that most needs the oracle is the band that loses it first — §8.4.

### 8.2 Transposition — the explorer handles it, and the effect is large

The explorer is keyed by position, not by move order, so transpositions aggregate for free.
Measured: over **439** spine edges whose child clears the 100-game floor, comparing the
child's own total against the parent's count for the move reaching it —

- median **3.28%** of a child position's games arrived by a different move order;
- mean **13.66%**, p90 **45.3%**, max **93.2%** `[V]`.

The extreme is instructive: `r1bqkb1r/pp2pppp/2n2n2/2pp4/3P1B2/4PN2/PPPN1PPP/R2QKB1R b KQkq -
2 5` (a London tabiya at ply 9) has 22,372 games at band 1600, of which only **1,519** came
through the parent this corpus walks `[V]`. **A per-line accounting of coverage would
understate it by an order of magnitude here** — a second reason the §5 figures must be read
as position properties, and a first-class argument for the runtime's existing `transposeKey`
normalisation.

**One inconsistency in the explorer's own aggregation, measured:** 67 of those 439 edges
report a child total *below* the parent's count for the move reaching it, which cannot be
true of a consistent index. The magnitude is tiny — median **0.029%** of the child's total,
maximum **0.198%** `[V]` — so it changes nothing here, but it means these counts should be
treated as an index over a corpus rather than an exact census. No cause is asserted.

### 8.3 Does the aggregation hide variance?

The shipped query folds 31 months, three speeds and a 200-point rating bucket into one
triple. The `history` rows the explorer returns make the temporal part checkable for free:
splitting each position's monthly rows into an earlier and a later half, over **543**
position-band rows with ≥1,000 games and ≥8 populated months —

- mean |Δ score| between halves **0.58 pp**, median **0.25 pp**, p90 **1.54 pp**, max
  **7.29 pp** `[V]`.

**Time is not hiding anything at this resolution**: the drift is an order of magnitude below
the signal. The rating-width axis is not so benign — §7.2 shows a merged three-bucket query
returns ×3.1 the games, and §8.1 shows the score itself moves by up to 6.6 pp across two
buckets, so a merged population *does* hide band variance. **Speed** was measured only for
volume (×1.35), not for score; that residual is named in §11.

### 8.4 The on-ramp band gap — worse than a mismatch

`design/BACKLOG.md:219` ledgers that the shipped explorer artifacts cover 1400/1600/1800
while all three on-ramp packs target **1000–1400**. Measured on the same 80 corpus positions
across five bands, median total by ply bucket:

| ply bucket | positions | 1000 | 1200 | 1400 | 1600 | 1800 |
|---|---:|---:|---:|---:|---:|---:|
| 0–3 | 5 | 3,063,462 | 2,260,438 | 1,384,827 | 1,756,860 | 1,945,098 |
| 4–7 | 20 | 523,155 | 841,326 | 1,205,654 | 1,352,459 | 1,125,048 |
| 8–11 | 20 | 22,065 | 37,573 | 53,412 | 102,574 | 146,193 |
| 12–15 | 21 | **520** | 2,481 | 5,049 | 14,641 | 23,690 |
| 16–19 | 6 | **150** | 610 | 2,298 | 7,823 | 15,667 |
| 20–23 | 8 | **0** | 0 | 0 | 8 | 36 |

`[V]`. **The on-ramp's own band has 45× fewer games than 1800 at ply 12–15 and 100× fewer at
ply 16–19**, and its usable line ends around ply **14–15** — four to six plies shallower than
1800. The ledger row understates the problem: it is not only that the artifacts were built at
the wrong band, it is that **the right band has materially less data and loses it earlier**.

The puzzle-derived on-ramp candidates are the extreme case. All **26** roots under
`content/candidates/onramp-*/` are real-game middlegames at plies **21–131**; queried at
bands 1000, 1400 and 1800, they return **0–5 games**, and **not one clears the 100-game
floor** at any band `[V]`. For that content the human oracle does not exist at all — which is
consistent with its own design (they are grounded on the Lichess puzzle corpus, not on
explorer counts), and is the clearest single statement of where the coverage boundary lies.

---

## 9. What would change the answer

1. **A different corpus with per-position outcomes.** The boundary measured here is the
   Lichess *explorer index*, not human games as such. A bulk corpus keyed by position rather
   than by opening would push the boundary out — but `AGENTS.md` §Rejected explicitly rejects
   "bulk corpus ingestion first", and §7.2 sets the price: the ceiling of the current index,
   spending every population lever, is ply 23–27. To reach ply 40 an alternative index would
   have to be a different kind of object, and the count per position would fall by orders of
   magnitude regardless of index: the branching that makes ply-40 positions unique is the
   thing being measured, and no amount of ingestion makes a position repeat that has not
   repeated `[M]`.
2. **A lower usable threshold justified by a different statistic.** §4's 400 comes from
   resolving a 5 pp deviation in a score. A metric with less variance per observation — e.g.
   conditioning on the mover's own subsequent result rather than the game result — would need
   fewer games for the same resolution and would move the boundary by a ply or two, not by a
   phase.
3. **Amortising over structure instead of position.** The one direction that is not merely
   arithmetic: if outcome statistics were aggregated over a *structural class* (pawn skeleton
   plus piece placement) rather than an exact FEN, the sample would be pooled across
   thousands of transpositionally distinct middlegames. This repo already has the vocabulary
   — `content/shapes/`, the shape library's censuses, and the predicate evaluator R1/R2
   measured at **29 µs/ply** (`design/research/move-primitive-computability.md`). Whether a
   structure-keyed outcome distribution is stable enough to mean anything is an unmeasured
   question and the single highest-value follow-up this dossier can name.
4. **Accepting the endgame boundary and the opening boundary as the design.** Not a change to
   the answer; a change to what is built on it. §10.

Two things would **not** change it: a wider window (§7.2, ×3.5 buys one to two plies) and
more speeds (×1.35).

---

## 10. What this means for the campaign

Answering the framing R4 left open — *"a boss whose resistance is a measured quantity is
endgame-shaped today"*:

- **Two islands, not one.** Measured difficulty exists in **decided positions** (R4: exact
  inside seven pieces, 88.3% of the endgame corpus) and in **positions within about ten moves
  of the start** (this dossier: engine-independent, statistically forceful, and richer at
  move level than at position level). They do not touch. The middlegame between them has
  neither instrument.
- **The oracle's natural unit is the move, not the position.** §6.3's engine-tied /
  human-separated pairs are exactly `humanConcessionMass`'s missing ingredient, obtained
  directly rather than through a classifier: a per-move result distribution at a named band.
  Where it exists it is better than what `rfc/resistance-spectrum.md` §7b was reaching for,
  and where it does not exist, nothing substitutes.
- **The honest design move is the same one R4 named: a named refusal, not a silent
  fallback.** The refusal predicate is now measurable *before* the query — a position's ply
  and the requested band predict whether the oracle will answer — so an encounter can declare
  "difficulty is measured here" or "difficulty is authored here" as a property of where it
  sits, rather than discovering an abstention at runtime.
- **The difficulty-availability axis R4 asked for has three values, not two**: *measured by
  tablebase* (decided endgames), *measured by human outcome* (plies ≤ ~20 at 1400–1800, ≤ ~15
  at 1000–1200), and *authored* (everything else, which is most of the middlegame).
- **The on-ramp needs its evidence re-sourced and its expectations lowered** (§8.4): its own
  band has 45–100× less data at the plies where packs get interesting, and its
  puzzle-derived content has none at all.

---

## 11. Residuals

- **Speed-split scores were not measured.** §7.2 measured what adding bullet and
  correspondence does to *volume* (×1.35); it did not measure whether the *score* differs by
  time control. A blitz-only versus classical-only comparison on the same positions is a
  ~60-request follow-up and would test whether the shipped three-speed default hides a real
  split.
- **The structure-keyed aggregation of §9.3 is unmeasured** and is the named next question.
- **The decided-and-covered overlap is n = 5** (§6.2). Whether human counts and engine
  evaluations agree in decided positions is therefore untested here; R4 tested the tablebase
  side, not this one.
- **The corpus contributes one middlegame pack and two trajectories.** Every deep-ply reading
  rests on those three plus the greedy walks. More non-opening packs would tighten §5.1's
  ply-19-to-22 rows, where n is 3–6 positions per ply.
- **Explorer counts drift**; §2 limit 5. `out/explorer-readings.csv` fixes what was read on
  2026-08-15, and a re-run will differ in the third digit without moving any boundary.
- **The 12-move response cap** (`moves=12`) censors §5.3's first two ply buckets. Raising it
  would change nothing about the boundary but would give an exact figure for "how many legal
  moves are covered" at plies 0–7.
- **Band 0 (under 1000) was walked once and terminated in mate at ply 16**
  (`out/walk-band0.jsonl`), so it yields no depth reading. If the on-ramp is taken below
  1000, that walk needs redoing with a non-forcing move rule.
