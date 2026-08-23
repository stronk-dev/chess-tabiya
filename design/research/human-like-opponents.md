# Human-like opponents — what makes engine play non-human, and what our evidence plane must produce

**Question:** D810 / D811 / D812 (`design/BACKLOG.md`), in the owner's framing:

> *"What are the points of engines that make it 'non-human' in play? Is it the lack of
> tactics in midgame? Is it the random blunders (and how does that differ from a human
> blunder)? … we might want an algorithm that reduces the evidence to a move… weights
> stockfish, maia, book moves… preventing blunders but playing low-elo moves… I still feel
> like we are missing something important on the evidence side for powering a bot… goal is
> a proper Elo range of bots that play human-like, with bonus points for personalities.
> Chessable has nice dimensions but their AI still sucks."*

**Feeds:** D810–D812, D551, D561, D591, H5/C5, the D332 campaign denominator, the D544
tactical family, and the selector RFC this lane will eventually need.

**Relation to `bot-policy.md` (R11).** R11 is the *mechanical* arm: it measured what the
shipped sampler actually plays and which one-move policy transforms survive predeclared
gates. This dossier is the *literature and practitioner* arm: why engine play reads as
non-human in mechanism, how the field models human error, how anyone has ever calibrated a
bot to a human Elo, and — against the F1 producer census — exactly what evidence a
D810-shaped selector needs that nothing produces today. Where R11 measured a thing, this
dossier cites it rather than re-deriving it.

**Method and labels.** Desk research only; nothing was run that writes. Repo claims were
verified at the symbol in this pass. Web claims were fetched in this pass against the cited
primary sources; a claim is `[V]` when the quote/number was read from the fetched source
text (or from our own tree/dossiers), `[P]` when it passed through a fetch summarizer,
search snippet, or community source, and `[M]` for synthesis or unchecked model knowledge.
Checked absences ("not on these pages") are `[V]` scoped to the pages named. One
calibration incident from this pass is worth recording: a fetch-summary of Chabris & Hearst
2003 fabricated every number; the PDF was then read directly and the real figures appear
below. Summarizer-tier numbers are therefore never labelled `[V]` here.

---

## 1. Verdict

1. **What makes engine play non-human is not the error rate — it is where the errors sit.**
   The strongest result in the literature is exactly our D811 hypothesis: weakened engines
   misplace their errors. Depth-limited Stockfish matches *stronger* humans better than
   weaker ones no matter how much you weaken it — weakening dilutes optimal play with
   noise instead of moving it toward how a 1200 actually plays. §2.

2. **The owner's two diagnostic questions have opposite answers.** "Lack of tactics in
   midgame" is not what makes engines non-human — never *missing* tactics is. "Random
   blunders" is precisely it: a human blunder is heavy-tailed, difficulty-conditioned, and
   specific; a weakened-engine blunder is bounded eval-noise over the engine's own
   candidate list, uncorrelated with what makes positions hard for people. §2.1, §2.2.

3. **The "something missing on the evidence side" has five names, and the structural gap
   under all five is one producer class: per-candidate evidence.** Every producer in F1
   describes the position or the played move; a selector needs the same declared vocabulary
   computed over each *candidate* before it is played. Of the five feature families, two
   are cheap arithmetic (SEE, salience/recency deltas), one is engine calls over existing
   infrastructure (sharpness/multipv spread), one is repeat queries of an existing producer
   (multi-band Maia mass), and one needs new corpus work (time usage). §6.

4. **The D810 selector shape is confirmed by every practitioner comparison, and the
   declared-evidence constraint is genuinely unclaimed.** Chessiverse ships the same
   generate→curate→book shape with undeclared filters; Komodo buries persona inside eval;
   Maia-2 buries skill inside the net. No published system anywhere generates post-hoc
   causal explanations of an engineered miss. "It missed your fork because the knight had
   just moved" as both opponent behaviour and lesson has no prior art found in this pass. §7.

5. **No widely-used weakened-bot Elo label has ever been validated against humans by its
   author.** Stockfish anchors to an engine list with self-admitted ±100 slop; Lichess
   levels are community guesses; chess.com labels drift; maia1 plays 330–570 above its
   band. The only designs that close the human loop are Chessiverse's Lichess anchor bots
   and Allie's live evaluation. Our D333 harness plus a human-scale anchor is already ahead
   of most of the industry. §5.

---

## 2. What makes engine play non-human — ranked by evidence strength

### 2.1 Rank 1 — misplaced error: weakening an engine does not move it toward weak humans

The Maia paper (McIlroy-Young, Sadler, Kleinberg, Anderson, KDD 2020) measured
move-matching against rating-binned Lichess players. Depth-limited Stockfish matches human
moves 33–41% of the time, and its accuracy curve *rises with the rating of the human being
predicted* at every depth — "depth 15 matches 1900-rated players 5 percentage points more
than it matches 1100-rated players" — while different depths have "almost identical
performance, despite significant differences in playing strength". Leela at ordinal
strengths 800–3200 is the same: "Leela ordinal rating 2700 matches human moves 40% of the
time, no matter whether they are played by humans rated 1100, 1500, or 1900". Maia (a
policy net trained per band, no search) reaches 46–52%, and each Maia's curve peaks at the
band it was trained on `[V]` (fetched full text,
[arXiv 2006.01855](https://arxiv.org/abs/2006.01855) /
[ar5iv](https://ar5iv.labs.arxiv.org/html/2006.01855); the 46–52% figure independently
confirmed by the [CSSLab blog](http://csslab.cs.toronto.edu/blog/2020/08/24/maia_chess_kdd/),
whose own gloss is that attenuated Stockfish "looks like it's playing regular Stockfish
chess with a lot of noise mixed in" `[V]`).

The mechanism is visible in the Stockfish source, fetched this pass `[V]`
([search.h](https://raw.githubusercontent.com/official-stockfish/Stockfish/master/src/search.h),
[search.cpp](https://raw.githubusercontent.com/official-stockfish/Stockfish/master/src/search.cpp)):
skill mode forces MultiPV ≥ 4 and picks among the engine's own top candidates with a
weakness-scaled deterministic bonus for worse moves plus a weakness-scaled random term,
with the candidate-score window capped at one pawn (`delta = min(topScore - minScore,
PawnValue)`). `UCI_Elo` (1320–3190) maps to a fractional skill level by a cubic polynomial.
Three properties follow directly: the error menu is *the engine's* candidate list, not a
human's; error size is bounded noise, not a heavy tail; and error placement is uncorrelated
with human difficulty. This is the doctrine's standing rejection of weakened Stockfish
("samples weaker engine moves; does not model human choice") stated in mechanism —
the reception evidence matches it exactly: chess.com forum, on Komodo-based bots, "Typical
bot play is, inhumane move, inhuman move, inhumane blunder, inhumane move, inhuman blunder"
`[V]` ([Bot Ratings vs. Reality](https://www.chess.com/forum/view/general/chess-bot-ratings-vs-reality)).
Engine-dev folklore agrees from the builder's side: Crafty's skill 0 was "way too strong"
and elaborate blunder functions still produced "unrealistic moves at about 1600 Elo" `[P]`
(TalkChess threads [t=55011](https://talkchess.com/viewtopic.php?t=55011),
[t=73603](https://talkchess.com/forum3/viewtopic.php?t=73603)).

The positive case is our own: `maia-endgame-fidelity.md` measured that when Maia errs it
errs *specifically* — 84 errors on 6 of 45 positions and 5 distinct moves, modal error
share 0.95–1.00, all 84 `win→draw` and zero `win→loss`, clustered in exactly the
pawn-technique packs — against a uniform-random null that concedes the full point on 31.3%
of its errors `[V]`. Structured error is what "human-shaped" measures as.

### 2.2 Rank 2 — skill is an error *distribution*, not a mean

Regan & Haworth ("Intrinsic Chess Ratings", AAAI 2011; PDF read directly this pass `[V]`,
[ReHa11c.pdf](https://cse.buffalo.edu/~regan/papers/pdf/ReHa11c.pdf)) fit human move choice
at Elo mileposts 1600–2700 with a two-parameter model, move probability ∝
e^−(δ/s)^c: **s** ("sensitivity", discrimination among moderately inferior moves) falls
smoothly from .078 at 2700 to .165 at 1600, while **c** ("consistency", avoiding poor
moves overall) stays in 0.430–0.545. Their move-match table is a citable human baseline:
2700 plays the engine move 56.3% of the time, 2100 47.7%, 1600 42.9%. Two parameters under
one Elo is the formal statement of the owner's failure case: *a bot can match a 1400 mean
while carrying a 1900/800 (s,c) split that no human 1400 has* `[M]` (implication ours; the
model and numbers `[V]`). The paper even names our use case: "a better simulation of human
players of specified skill levels, especially being faithful to their observed tendency to
make occasional poor moves" `[V]`.

Chabris & Hearst (Cognitive Science 27, 2003; PDF read directly `[V]`,
[Chabris2003.pdf](https://www.chabris.com/Chabris2003.pdf)) give the human blunder base
rate at the top: over 1,188 GM games / 110,164 moves, true blunders (≥1.5 pawns) per 1,000
moves were **5.02 classical, 6.85 rapid (+36.5%), 7.63 blindfold**, with fast conditions
producing "more than twice the number of really big blunders". Even 2600s blunder — at a
rate, with a tail, conditioned on time. A bot's human-likeness claim is a claim about that
histogram, not about average centipawn loss.

### 2.3 Rank 3 — human error is difficulty- and attention-shaped; the move-type salience hierarchy is folklore

Anderson, Kleinberg & Mullainathan ("Assessing Human Error Against a Benchmark of
Perfection", KDD 2016; fetched `[P]` for exact figures,
[arXiv 1606.04956](https://arxiv.org/abs/1606.04956)) used tablebase-solved ≤6-piece
positions (24.6M amateur + 880K GM instances): "features describing the inherent difficulty
of an instance are significantly more powerful than features based on skill or time" —
difficulty features alone predict blunders at 0.73 (balanced task) against 0.55 for both
players' ratings and 0.53 for time remaining, with the dominant feature being *blunder
potential* — the fraction of legal moves that are blunders. Position difficulty dominates
who is playing. This is the validated ancestor of our proposed sharpness features (§6b).

The attention mechanism is real: Bilalić, McLeod & Gobet's Einstellung eye-tracking studies
(Cognition 108, 2008) showed experts who *reported* searching for a better solution kept
fixating features of the familiar one — attention bias operating below awareness `[P]`
([PubMed 18565505](https://pubmed.ncbi.nlm.nih.gov/18565505/)). **But the specific
hierarchy D811 asserts — threat-just-created, attacker-just-moved, discovered geometry,
backward-move blindness — has no direct empirical paper.** This pass searched for it and
found coaching folklore plus adjacent evidence only (Krogius's retained-image errors;
Maia's blunder-prediction CNN at 71.7% `[P]` shows *predictability* without naming
features). This is a correction to D811's confidence, and an opportunity: nobody has
measured the salience hierarchy, and our corpus + explorer population can (§9, experiment 3).

### 2.4 Rank 4 — phase and material asymmetry, where Maia is inverted

Humans' skill profile varies by phase; engines are uniform, and Maia is *inverted*: as a
policy net with no search it is weakest exactly where calculation dominates. Our own
measurements bound it — Maia converts only 88.1–91.9% of won tablebase-critical endgames
(`maia-endgame-fidelity.md` `[V]`), the band is inert below ten pieces (transfer ~0.07
vs 0.40 at full material, `maia-band-outcome-transfer.md` `[V]`), and band 1100 vs 1900
ties on 43 of 45 endgame positions `[V]`. External evidence agrees: the CSSLab GitHub
issue #20 records maia1 failing to mate with six queens, shuffling to a repetition draw
over 47 moves `[V]`
([CSSLab/maia-chess#20](https://github.com/CSSLab/maia-chess/issues/20)); a community
benchmark over 20,552 high-play Lichess puzzles found "hardly any difference between the
scores of the Maia models" across bands and markedly worse endgame-puzzle performance `[P]`
([chessenginelab](https://chessenginelab.substack.com/p/testing-maias-puzzle-performance)).
Maia-1's band rigidity is now published: the Maia-2 paper reports Maia-1 orders only **1%**
of positions monotonically across its rating versions, vs 27% for Maia-2 `[P]`
([arXiv 2409.20553](https://arxiv.org/html/2409.20553)). Our D335/D336 (29–40 real Elo per
100 band points; a 100-step below learner resolution) is the game-level face of the same
rigidity, and the owner's "low and high elo models perform about the same" impression is
the felt face of it.

Consequence: a human-like bot needs an **engine floor in simple endings** (disclosed and
calibrated — R11 already refuses a hidden guard) and must not claim band-graded resistance
at low material.

### 2.5 Rank 5 — the missing behavioral channel: time usage

Humans blunder more under time pressure at game scale (Chabris, §2.2) even though
per-move time-remaining is a weak predictor next to difficulty (Anderson, §2.3) — both
true at once. Practitioners increasingly treat move *timing* as part of human-likeness:
Noctie advertises "strengths, weaknesses and even move timings… similar to a human at your
own skill level" `[V]` ([noctie.ai/chess-ai](https://noctie.ai/chess-ai/)); Allie
(arXiv 2410.03893) trains on "pondering times and resignations" and reports a mean skill
gap of only 49 Elo against 1000–2600 online opponents `[V]` (abstract fetched); the Otter
preprint's ablation attributes +2.38 pp move-prediction to clock conditioning `[P]`
(already in `bot-policy.md` §1). Tabiya's opponent path has no clock input at all `[V]`
(`bot-policy.md` §2). Note the boundary with D331: time-as-difficulty for the *learner*
was refuted; time-usage for the *bot* is behavioral realism, a different claim.

### 2.6 Rank 6 — the missing identity: repertoire, memory, consistency

Humans are identifiable from their moves — 98% correct identification out of 400 players
from one side of 100 games (McIlroy-Young et al., KDD 2022 `[P]`,
[arXiv 2008.10086](https://arxiv.org/abs/2008.10086)) — so a bot without a stable
repertoire, memory, or habits lacks a property every human opponent has. Chessiverse gives
every bot a human-derived repertoire and rating-conditioned statistical openings `[V]`
([construction article](https://chessiverse.com/articles/how-chessiverse-bots-are-created));
maia bots need injected opening books "since the models play the same move every time" `[V]`
([CSSLab README](https://github.com/CSSLab/maia-chess)). R11's measured caution stands: a
drill spine is not an opponent repertoire (79.2% fallback), and a book is an opening layer
with explicit fallthrough, not a continuation policy `[V]` (`bot-policy.md` §8).

**Answering the owner directly.** *Lack of midgame tactics?* No — missing tactics
human-shapedly is what Maia gets right; what it lacks is that it *never calculates*, even
in positions where every human would (architecture fact `[V]`: the bots run at nodes=1,
[CSSLab README](https://github.com/CSSLab/maia-chess)), and its misses don't vary by band
(§2.4). *Random blunders, and how do they differ?* A human blunder is heavy-tailed
(Chabris), difficulty-concentrated (Anderson), attention-mediated (Einstellung), and
specific (our D366: the same erring move on essentially every repeat); a weakened-engine
blunder is bounded uniform noise over the engine's own candidate window (Stockfish source,
§2.1). The difference is measurable, and every measurement instrument for it already
exists in this repo or in this dossier's citations.

---

## 3. Established vs folklore — the literature in one table

| Claim | Status | Source |
|---|---|---|
| Weakened engines don't track human moves; their accuracy doesn't shift toward the band being weakened | **Established** `[V]` | Maia KDD 2020 (fetched full text) |
| Per-band policy nets peak at their trained band (move-matching 46–52%) | **Established** `[V]` | Maia KDD 2020 + CSSLab blog |
| Maia-1's bands are rigid (1% monotonic positions); Maia-2 conditions on both players' skill and reaches 27% / 53.25% accuracy | **Published** `[P]` (one fetch, summarizer-tier numbers) | [Maia-2, NeurIPS 2024](https://arxiv.org/abs/2409.20553) |
| Human error is dominated by position difficulty (blunder potential), not skill or clock | **Established** `[P]` | [Anderson et al., KDD 2016](https://arxiv.org/abs/1606.04956) |
| Skill decomposes into sensitivity + consistency under one Elo; human move-match by Elo is tabulated | **Established** `[V]` (PDF read) | [Regan & Haworth, AAAI 2011](https://cse.buffalo.edu/~regan/papers/pdf/ReHa11c.pdf) |
| GM blunder base rate ~5/1,000 moves classical, +36.5% rapid; big blunders >2× in fast chess | **Established** `[V]` (PDF read) | [Chabris & Hearst 2003](https://www.chabris.com/Chabris2003.pdf) |
| Expert attention locks onto familiar solutions below awareness | **Established** `[P]` | Bilalić et al. 2008 |
| The move-type salience hierarchy (backward moves invisible, discovered attacks missed, checks/captures salient) | **Folklore** `[M]` — no direct empirical paper found in this pass | — |
| Individual style is identifiable (98%/400 players) and per-player fine-tuning adds ~4 pp, from ~5,000 games | **Published** `[P]` | [KDD 2022](https://arxiv.org/abs/2008.10086) |
| Blunder probability rises as the clock falls, spiking at the low-time alarm | **Community** `[P]` | [Antiochian, 68M games](https://github.com/Antiochian/chess-blunders) |
| A published chess-bot Turing test | **Does not exist** — none found; nearest is Maia-2's rematch-rate proxy (41.2% vs 40.3%) `[P]` | this pass |

---

## 4. How the practitioners build it — four weakening families, each with a documented failure mode

| Family | Who | Mechanism (primary-sourced) | Documented failure mode |
|---|---|---|---|
| **Candidate roulette** | Stockfish Skill/UCI_Elo `[V]` (source code); Lichess levels 1–8 `[V]` ([fishnet api.rs](https://raw.githubusercontent.com/lichess-org/fishnet/master/src/api.rs): movetime 50–1000 ms, Skill −9…20, depth caps 5–22); Komodo Skill (`[P]` Kaufman: "level 16 is 4 ply search with randomness"); chess.com bots ≥2400 | Randomly promote worse *engine* candidates within a ~1-pawn window | "Inhumane move, inhumane blunder" texture; ratings hold only at fast time controls (Kaufman's own caveat `[V]`, [TalkChess](https://talkchess.com/forum3/viewtopic.php?p=879712)) |
| **Human-imitation net, no search** | Maia `[V]`; chess.com sub-2400 "tiny NNs" `[V]` (Kaufman, same thread); Chessiverse `[V]`; Noctie `[V]` (vendor); Allie `[V]` (adds search back) | Policy net trained on human games; argmax or sampled | Argmax-of-average plays above band (maia1: bullet 1582 / blitz 1434 / classical 1666 vs target 1100 `[V]`, [profile](https://lichess.org/@/maia1), authors' own explanation `[V]`); no-search endgame collapse (§2.4); needs a curator for net absurdities |
| **Material concession, then full strength** | Fritz "Friend mode" `[P]` | Blunder away a centipawn handicap, then play strong | Honest about mechanism, unhuman texture |
| **Opponent-model contempt** | Lc0 WDL rescale/contempt `[V]` ([v0.30 blog](https://lczero.org/blog/2023/07/the-lc0-v0.30.0-wdl-rescale/contempt-implementation/)) | Elo-parameterized rescaling of WDL to *exploit* a weaker opponent | It is an exploitation mechanism, not an error model; no use as human-like weakening found in this pass |

**Chessiverse in detail** (D551; article fetched `[V]`,
[how-chessiverse-bots-are-created](https://chessiverse.com/articles/how-chessiverse-bots-are-created)):
neural net of unstated provenance generates candidates; a "Move Curator" — "a quite
elaborate, ever-growing, filter, that picks up suspicious moves… then graded and considered
by a stronger proven engine" — fixes unrealistic play and creates gimmicks (Gramps
Pushwick: non-pawn moves "strongly discouraged"); depth reduction explicitly rejected
("unpredictable result"); every bot gets a human-derived repertoire with rating-conditioned
statistical frequencies; and the Guardian→Savage styles are **classified after generation,
not controlled** — "we do very little to influence it. Instead, we measure the output"
(already ledgered as D591). Their vendor experience note matters for us: users call a
one-move piece drop inhuman even when similarly-rated people make such errors, so they
prefer errors "with a mitigating tactical circumstance" `[P]` (`bot-policy.md` §1) — i.e.
the market has already discovered that *believable* errors need position-conditioned
justification, which is exactly what declared salience/sharpness features would make
principled instead of hand-tuned.

**Komodo/Dragon personas** (chess.com's bot base): eight personalities (Default,
Aggressive, Defensive, Active, Positional, Endgame, Human, Beginner) `[P]` (official docs
unreachable this session — TLS expired; list confirmed via retailer page `[V]`,
[USCF Sales](https://www.uscfsales.com/pages/take-a-closer-look-at-komodo-dragon), and
quoted doc fragments `[P]`). "Most of the other personalities will play roughly one skill
level weaker than Default" `[P]`. Kaufman on the bots: "based on Komodo using the Skill
levels to control strength and various parameter settings to modify playing style" `[V]`
(TalkChess). Implementation (eval-weight presets vs contempt) is nowhere documented —
community infers PST/material/LMR tuning `[P]`. Chessmaster's The King exposed the sliders
directly — Attack/Defender −100..+100, Randomness, Material/Position, per-piece values,
selective search `[P]` (forum-documented). The owner's Chessable/chess.com impression
("nice dimensions but their AI still sucks") is the reception of exactly this stack:
persona dimensions carried by eval weights on top of candidate-roulette weakening `[P]`.

---

## 5. The Elo-calibration problem

**The scales don't join, and vendors say so themselves.** Stockfish's UCI_Elo is "anchored
to CCRL 40/4" — an *engine pool* `[V]`
([official docs](https://official-stockfish.github.io/docs/stockfish-wiki/UCI-Protocol-and-Stockfish-Commands.html));
the 2019 calibration author flagged "the anchoring to CCRL is a bit weak" (two anchors
disagreed by 100 Elo inside his own tournament) `[V]`
([PR #2225](https://github.com/official-stockfish/Stockfish/pull/2225)), and the 2023
recalibration against Stash states "the Elo of stash in this analysis is only to within
±100 Elo of CCRL, probably because it depends quite a bit on the opponent pool" `[V]`
([PR #4341](https://github.com/official-stockfish/Stockfish/pull/4341)). No Stockfish-side
validation against humans exists (checked absence, this pass `[M]`). Lichess's level↔rating
table is community lore with no official statement `[V]` (forum thread fetched); chess.com
bot ratings are "not based on rated play" and drift `[P]`; and maia1's own rating **spans
~230 Elo across time controls against the same human pool** (1434 blitz → 1666 classical
`[V]`) — "the bot's Elo" is not even one number.

**Who actually closes the human loop.** Chessiverse: dense bot-vs-bot ladder for relative
strength, then **four calibration bots deployed on Lichess** (833/1057/1454/2009) earning
real ratings against humans, with everything else scaled to them; recalibrated three times;
user-self-reported-rating feedback tried and dropped `[V]`
([how-chessiverse-ratings-work](https://chessiverse.com/articles/how-chessiverse-ratings-work)).
Allie: large-scale online evaluation against 1000–2600 humans, 49 Elo mean skill gap `[V]`
(abstract). That is the entire list found in this pass.

**Our position.** We already own the internal-ladder half: `tools/d333-band-outcome-harness/`
played 16,660 games with paired openings, colour swap inside pairs, cluster-robust CIs, and
working controls (`maia-band-outcome-transfer.md` `[V]`), plus the standing D341 rule —
seed each worker explicitly, odd worker count, count distinct move lists, treat a
zero-variance control as a defect `[V]`. We also own the number nobody else measures: the
declared band over-predicts real strength by 2.5–3.5× (D335), so D344's rule already
applies to bots — **the calibrated value is stored separately from `targetElo` and only the
calibrated value ever feeds a rating update** `[V]` (`design/BACKLOG.md` D344).

**Recommendation** (each ingredient sourced above; composition `[M]`):

1. *Dense internal ladder, reusing the D333 harness*, for every selector configuration
   (band × guard × persona transform): relative Elo with CIs, under D341's seeding rules.
   Statistics: 95% CI ≈ ±500–700/√n Elo per arm, so ~500–800 games per arm for ±25 `[M]`
   (standard derivation; draw-rate dependence per
   [chessprogramming Match Statistics](https://www.chessprogramming.org/Match_Statistics) `[P]`).
2. *A human-scale anchor, not a chained hop.* Options in cost order: (a) treat the measured
   Maia-band ladder as the interim anchor, gauged as D344 prescribes — with the caveat that
   published maia-bot ratings are argmax bots and our production sampler differs
   (temperature 0.8 / top-p 0.92, `bot-policy.md` §4 `[V]`), so external maia ratings do
   not transfer to our arms; (b) Chessiverse-style anchor-bot accounts on Lichess earning
   real human ratings; (c) eventually, the learners' own rated results (D365's Glicko,
   fed calibrated opponent values only).
3. *Time-control specificity.* Every verified calibration is TC-specific; a "1400" claim
   must name its clock.
4. *A distribution acceptance test, not just a mean.* Mean-Elo equality is necessary, not
   sufficient (Regan §2.2). Per-arm eval-loss histograms and blunder-rate-by-magnitude
   compared against band-binned human reference games — the R11 instrument already computes
   exactly these quantities (`bot-policy.md` §5 table: expected loss, ≥250 cp mass,
   explorer match) `[V]`.

---

## 6. The evidence gap, made concrete against F1

F1's compiled plane (`docs/evidence-contract.md`; identities enumerated at
`packages/runtime/src/evidence-catalog.ts` `[V]`) produces: structural predicates/readings
and deltas (`rules.structural.*`, incl. `attacked_squares_changed`,
`defended_squares_changed`, `slider_lines_changed.opened/closed`, `escape_squares_changed`,
`direct_attack_count`, `line_blockers`, outposts, passed pawns, files, king zone —
D544's "17 structural detectors"), `live.stockfish.{eval,pv,wdl}`, `live.syzygy.*`,
`human.maia.{policy,event}`, `human.explorer.{population,position_stats}`, `pack.authored`,
`run.record.*`, `derived.*`. **Every one of these describes the position or the played
move. Nothing in the catalogue features a *candidate* move that has not been played.**
That is the single structural gap beneath the owner's instinct; the five hypotheses land on
it as follows.

**(a) Salience features — verified partially existing, cheap arithmetic.** The atoms are
already shipped as played-move deltas: `structuralDelta(parentFen, fen)`
(`packages/runtime/src/structure.ts:504`) emits attacked/defended/escape-square changes and
`slider_lines_changed.opened` — the discovered-geometry atom — per position pair `[V]`.
What is missing is (i) applying the same delta to each candidate (arithmetic: one legal
move + one recompute per candidate) and (ii) the *recency* join — "was this threat created
by the opponent's last move? did the attacker itself just move?" — which is a join of the
delta stream against `run.record.move`, also pure arithmetic `[V]` (both producers exist;
the join does not). Literature status: salience-mediated error is established in mechanism
(§2.3) but the specific hierarchy is unmeasured folklore — so these features must enter as
*measured candidates*, validated per §9, not as assumed truths. **Cost: cheap arithmetic.**

**(b) Sharpness / only-move measures — engine calls over existing infrastructure.**
Anderson's blunder potential (the validated king of error predictors, §2.3) is a
multipv-spread statistic. The infrastructure exists: the evidence queue configures MultiPV
(`apps/server/src/evidence-queue.ts:371-385` `[V]`) and Stockfish MultiPV rank is currently
a *refused* disposition — "Move verdicts are not condition measurements"
(`apps/server/src/capabilities.ts:124` `[V]`). That refusal protects grading and must
stand; opponent selection is a different consumer, and F1's exact-binding design exists
precisely so a `live.stockfish.pv → opponent.selection` binding can be added without
widening the grading boundary `[V]` (`docs/evidence-contract.md`). Law 8 is respected
throughout: the bot consuming engine evidence to *pick its own move* grades nobody.
**Cost: engine calls (bounded multipv per bot decision); no new producer class beyond the
candidate join.**

**(c) Candidate-level material safety (SEE) — verified absent, cheap arithmetic.** No
static exchange evaluation exists anywhere in `packages/runtime` or `apps/server` `[V]`
(grep this pass; the only `#exchange` is UCI plumbing in `engine-supervisor.ts`). Our own
measurement is the argument: `fork_created` carries 0.72× lift on geometry alone — below
1.0 — because geometry without a material test points the wrong way (D545 `[V]`), and R1
already ruled the semantic tactic label needs eligibility/value (D565 via D544 `[V]`). SEE
is the standard bounded-arithmetic eligibility test, and per-candidate SEE is the
difference between "the bot hung its queen" and "the bot chose a candidate whose SEE it
was allowed to mis-read at its band". **Cost: cheap arithmetic, well-specified algorithm.**

**(d) Time-usage modelling — nothing ships, most expensive, defer.** No clock input exists
anywhere in the opponent path `[V]` (`bot-policy.md` §2). Doing it honestly needs a model
that accepts clock state (Maia does not; Otter/Allie-class models or corpus work do), plus
a move-time *emission* model for believability (Noctie ships this). R11's refusal list
already blocks faking it. **Cost: new corpus/model work — the only item in this list that
is genuinely expensive.**

**(e) Per-candidate Maia mass at multiple bands simultaneously — producer exists, repeat
queries, cheap to prototype.** `human.maia.policy` is produced per band; multi-band is N
sidecar queries, and the R11 capture corpus *already holds three bands* (1400/1600/1800,
837 cells, MultiPV-20) for offline prototyping `[V]` (`bot-policy.md` §3). Cross-band
disagreement as a difficulty/teachability signal has direct literature support: Maia-2's
monotonic/transitional position taxonomy is this signal formalized `[P]`, and Anderson's
"skill-anomalous positions" are its inversion `[P]`. **Cost: engine calls × bands at
runtime; zero cost to prototype on committed captures.**

**Synthesis.** The owner is right that something is missing, and it is not another model —
it is a **candidate-evidence producer class**: the declared vocabulary, applied per
candidate, with SEE and the salience/recency join added to it. Two of five families are
free arithmetic, two ride existing producers, one is deferred. This also resolves the
D544 connection: the tactical family the guidance lane needs and the feature set the bot
lane needs are the same detectors, which is D810's shared-registry argument made concrete.

---

## 7. The selector shape (D810)

Confirmed: **candidate generation (Maia policy mass ∪ book/explorer frequency ∪ engine
multipv) → feature each candidate via declared detectors → persona/skill policy over
features (blunder gates, style weights) → pick.** What each comparison taught:

- **Chessiverse** ships this shape with undeclared parts — net → curator ("suspicious
  moves… graded by a stronger proven engine") → book prior `[V]`. The curator is our
  feature+gate stage as an opaque hand-grown filter; declared detectors are the same stage
  auditable.
- **Stockfish Skill** is the degenerate case — candidates from the engine's own search,
  policy is one scalar of noise `[V]`. Its failure (§2.1) is what happens when the
  candidate menu is not human-sourced.
- **Komodo/chess.com** put persona *inside* eval — inexplicable by construction, and its
  strength dial is still candidate roulette `[V]`/`[P]`.
- **Maia-2/Allie** put skill *inside* the net — smooth and human-shaped, but a miss has no
  named cause; and Allie shows search can be added back without losing human-likeness `[V]`.
- **R11** already measured our policy stage at one-move resolution: a disclosed 250 cp
  guard passes its gates (removes all severe mass, −1.27 cp, 100.2% explorer-match
  retention) — the owner's "preventing blunders but playing low-elo moves" exists and is
  measured — and pawn ×4 passes while forcing/quiet ×3 fail their trait gates `[V]`
  (`bot-policy.md` §5). The stack contract (base model / sampler / guard / repertoire /
  trait transform / memory / presentation) is R11's §Verdict and stands.

**The constraint that is ours alone.** Because every stage consumes *declared* evidence,
the pick — and every rejected candidate — can carry its feature vector into
`opponent.selection`'s record. Then "it missed your fork because the knight had just moved"
is a read-back of the recorded selection, not manufactured prose: the fork candidate's
detector row was present, its salience feature fired, and the persona/band policy
down-weighted it. The literature on believability of *explainable* weakening is empty —
this pass found game-AI craft canon on believable mistakes (Lidén's "Artificial Stupidity":
mistakes must be "similar to those a real player would make" `[P]`), DDA/rubber-banding
studies on enjoyment `[P]`, concept-probe interpretability for chess nets (McGrath et al.
`[P]`, [arXiv 2111.09259](https://arxiv.org/abs/2111.09259)) — and **no published system
generating post-hoc causal explanations of an engineered miss** `[M]` (checked absence).
Chessiverse's "mitigating tactical circumstance" preference is the nearest practice and it
is hand-tuned vendor instinct `[P]`. The differentiator survives contact with the field.

Law 8 boundary, restated for the RFC this feeds: the selector consumes evidence to choose
the *bot's* move; nothing in it grades the learner. The explanation of a bot's miss renders
recorded selection facts ("the policy weighted X at 0.03 because feature Y") — a dashboard
of the bot's own decision, which is the legal side of the ADR-0005 line.

---

## 8. Personas as priors (D812) — the dimension map

What the practitioners actually vary, mapped to our declared vocabulary:

| Dimension | Komodo/Dragon | Chessmaster | Chessiverse | chess.com bots | Ours (declared) |
|---|---|---|---|---|---|
| Strength | Skill 0–20+, UCI_Elo (depth caps + randomness) | Strength of Play, Max Depth | net variance + curator + Elo tricks | Komodo Skill per bot | calibrated band + guard threshold (§5; never `targetElo` raw) |
| Aggression | "Aggressive" eval preset `[P]` | Attack/Defender slider `[P]` | measured post-hoc (Guardian→Savage) `[V]` | persona presets `[V]` (Kaufman) | forcing/capture/check candidate weights — **honesty: ×3 failed its trait gate at one-move resolution; ×8 still <10 pp** `[V]` (R11) |
| Solidity/structure | "Positional", "Defensive" | Material/Position slider | — | presets | structure-preservation weights over `rules.structural` deltas (pawn ×4 passed `[V]`) |
| Repertoire | own books | limited | human-derived books + statistical frequencies `[V]` | per-bot books of varying quality `[V]` | opening-layer book with declared fallthrough (R11 §8: not a continuation policy `[V]`); D553 configuration patterns as habit priors |
| Blind spots | — | Randomness slider (random ≈ bad move) `[P]` | gimmick curation (pawn-pusher) `[V]` | — | detector-masked candidates — "never sees knight forks" — honest only once D544's tactical family ships with the SEE test |
| Phase profile | "Endgame" persona | — | — | — | phase/material-conditioned mix (band + engine floor in endings, §2.4) |
| Memory/adaptation | Auto Skill (in-game strength drift) `[V]` | — | repeat-loss repertoire adaptation = stated future work `[V]` | "Adaptive" bots `[V]` | R11: cross-game memory refused until modeled as more than same-position arithmetic `[V]` |
| Timing | — | — | — | — | deferred with (d) |
| Presentation | — | biographies | biographies/chat | avatars/celebrity | separately measured persona (R11: "the model or policy must earn the chess behavior before the avatar names it" `[V]`) |

Three uses of the map. First, **every practitioner dimension lands on a declared feature
weight or a candidate mask** — D812's "priors over declared feature weights, not new
machinery" is confirmed against the whole field. Second, R11's `observedTraits` vs
`controlledTraits` distinction (D591) is the honesty line every vendor blurs: Chessiverse
*measures* Guardian→Savage and controls almost none of it; we must never label a bot with a
trait its policy does not measurably control. Third, the same persona vector is readable by
the style-mapping feedback lane (D552) — one vocabulary, two consumers, which no competitor
has because none of them declare the features in the first place. **Law 8: a persona
weights candidate selection; it never grades the learner's move.**

---

## 9. The three cheapest de-risking experiments

1. **Candidate-featuring prototype on the committed R11 captures — zero engine calls.**
   The 837-cell corpus already carries, per legal move: Maia MultiPV-20 policy at three
   bands, Stockfish depth-12 scores, and explorer frequencies `[V]` (`bot-policy.md` §3,
   regenerable per its §11). Compute per-candidate SEE, salience/recency deltas, and
   multipv-spread sharpness offline; measure how much each feature family adds over raw
   eval-loss in predicting (i) human move mass and (ii) explorer-observed error placement
   per band. This is the Anderson feature-power result replicated on our own plane, and it
   directly prices gap items (a), (b), (c), (e) before any producer is built.

2. **Salience-hierarchy measurement — turn the folklore into a number.** For corpus
   positions with explorer coverage, condition band-level human error mass on the proposed
   salience features (threat-just-created, attacker-just-moved, `slider_lines_changed.opened`).
   Law-8-clean (population statistics, nobody graded). Outcome either upgrades D811's
   premise from folklore to measurement — a result with standalone publication value, since
   §2.3 found nobody has measured it — or kills the feature family before it ships.

3. **Calibrated mini-ladder for the first selector arms — reuse the D333 harness.** Guarded
   Maia, guard+pawn ×4, and any new persona arm, each vs the measured band ladder, under
   D341's seeding rules; report real Elo with CIs and the §5.4 distribution acceptance
   test (eval-loss histogram vs band reference). ~500–800 games per arm for ±25 Elo. This
   makes every persona ship with a *calibrated* strength instead of a declared one — the
   thing §5 shows almost nobody in the industry has.

(The already-validated R11 blind packet — 42 branches awaiting reviewers — remains the
standing perceptual step for H5/C5 and is not re-proposed here.)

---

## 10. Ledger rows (renumbered to D813–D820 after the D809 collision repair)

- **D813** — Candidate-evidence producer class: declared detectors applied per candidate
  move pre-play; the single structural gap under D810/D811 (§6).
- **D814** — SEE as a rules producer; prerequisite for honest tactic eligibility (D544/D545)
  and for blind-spot personas (§6c, §8).
- **D815** — **Measured and refused for 1.0 on 2026-08-23.** The successor dossier
  `threat-salience-and-human-error.md` ran experiment 2 against exact `threat@1` identities: the
  stationary-created class covered only 7 positions, the augmented grouped-CV model worsened
  RMSE, and the proposed direction held in only 1/3 bands. Exact threat evidence survives; the
  salience-shaped bot-error inference does not.
- **D816** — Sharpness/only-move projection (multipv spread) with an
  `→ opponent.selection`-only binding; the grading refusal at `capabilities.ts:124` stands
  unchanged (§6b).
- **D817** — Multi-band Maia disagreement as a difficulty/teachability signal; prototype on
  R11 captures (§6e).
- **D818** — Explainable-pick record: `opponent.selection` carries the feature vectors of
  the chosen and top rejected candidates, so a bot's miss is renderable from record — the
  D810 differentiator as a data contract (§7).
- **D819** — Human-scale anchor for the bot ladder (Chessiverse-pattern anchor accounts or
  learner-derived Glicko), extending D344's calibrated-value rule to personas (§5).
- **D820** — Time-usage/move-timing modelling: deferred, new corpus/model work; do not fake
  from position-only Maia (§6d).

---

## 11. Limits

1. Desk pass. No new games were played and no feature was computed; §6's cost estimates
   are engineering judgment over verified symbols, and §9's experiments are designed, not run.
2. Several paper numbers passed through a fetch summarizer (`[P]` throughout); one
   summarizer fabrication was caught and corrected in-pass (Chabris). Spot-check any `[P]`
   number against its PDF before it becomes load-bearing in an RFC.
3. Absence claims ("no published chess-bot Turing test", "no explainable-weakening prior
   art", "no human validation of UCI_Elo") are bounded by this pass's searches, not proofs.
4. Vendor mechanisms (Komodo persona internals, chess.com bot construction below the
   Kaufman statements, Noctie architecture) are undocumented by their owners; inferences
   are labelled and should not harden.
5. Human-likeness itself remains perceptually unvalidated for our arms — R11's blind
   packet has zero human judgements, and nothing here substitutes for it (H5/C5 unmet).
6. The salience feature family rests on mechanism-level evidence plus folklore until
   experiment 2 runs; shipping it unvalidated would repeat the exact overreach this
   dossier documents in others.
