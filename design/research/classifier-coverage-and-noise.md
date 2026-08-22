# The game-state classifier — what it detects, what reaches a learner, and where the noise lives

**Question (owner, 2026-08-18):** *"How good truly is that game classifier? Does it recognize true
smaller positions / patterns and wider strategy? … I feel the disconnect of pooled evidence from
collectors/classifiers/engines vs what UX features require/depend on them. I feel the classifier of
game state is SEVERELY undertuned for actually classifying without noise and only interesting
shit."*

**Verdict in one line: he is right about the noise and wrong about its cause, and the correction
makes the fix cheaper than the complaint implies.** The detectors are not uniformly bad — the best
single structural detector discriminates the played move at **9.96×** and the best transition leaf
at **23.96×**, while the aggregate surface discriminates at **1.003×**. What is undertuned is not
the detection layer but the **delivery**: every detector is printed, unranked, in one list, and
**69.9% of that list by volume comes from five detectors that fire *more often* on the move the
learner did not play than on the one they did.** Separately, the coverage question inverts the
owner's premise: a chess.com-class review annotates **zero** pawn-structure, space, or plan facts
over your game (§4), so our 17 structural detectors are a lead, not a lag. The real coverage gap is
the **tactical** family — fork, pin, skewer, discovered attack, hanging piece — where we detect
**nothing**.

**Instrument:** `tools/d542-classifier-audit-harness/` — a disposable research harness under
`rfc/0000-rfc-process.md` §Exploration gate, not referenced by `packages/` or `apps/`, not part of
`pnpm test`. It reuses the R1/R2/R3/Q8/R11 corpus walk (`tools/r1r2-primitives-harness/corpus.ts`)
verbatim. Raw output committed beside it as `output.md` and `candidates-output.md`.

**Machine of record:** Apple M3 Max, Node v26.7.0 arm64, vitest 4.1.10, chessops 0.15.1, at
`424374f` `[V]`. **Post-repair refresh (2026-08-22):** D566 changed `pawn_safe_square` from a
current-file projection to disclosed `maximal_pawn_reach@1`; the same fixed corpus and complete
alternative population were rerun from base `6677dbb` `[V]`. The aggregate verdict is unchanged,
but `outpost` falls from 10 to 0 static observations and from 2/717 played firings to 0/717; its 11
alternative firings give no finite lift. The refreshed raw output is the harness's `output.md`.

**Corpus at HEAD:** 50 packs in `content/drafts/`, **754 spine transitions**, **643 distinct
positions**, 19,636 legal alternatives enumerated from 717 parent positions `[V]`. (D78's last pass
measured 754 transitions over 47 packs and 609 positions; the corpus has grown by three packs and
34 positions and the headline has not moved.)

---

## 1. Verdict

**(a) The selectivity finding reproduces at HEAD and is marginally worse** `[V]` (§5). The compare
strip fires on **753 of 754 transitions (99.87%)** at **8.83 entries per ply**, and **99.59% of the
18,470 quiet legal alternatives fire too** — **lift 1.003×** pooled, **1.004×** on D78's
within-position mean. Against the **1.05×** that got `slider_lines_changed` refused in R3. The
rung-0 reading prints a **median 80 observations per position** (post-D566 mean 63.94, max 102), of which
**13.00 per position are unconditional** — the twelve piece counts and the king-to-king distance
fire in 100% of positions by construction.

**(b) The noise is in the delivery, and this is now measured rather than argued** `[V]` (§6). Per
structural kind, lift ranges over **an 11× span**, from `named_structure` at **9.96×** down to
`direct_attack_count` at **0.87×**. Five kinds have lift **below 1.0** — they are *anti*-signals,
firing more on the alternatives than on the played move — and those five are the **four highest-
volume detectors in the whole reading plus one more**: `line_blockers` (17.97 obs/position),
`piece_reach_count` (8.29), `pawn_safe_square` (8.29), `direct_attack_count` (7.88),
`bishop_on_shade` (2.25). Together **44.68 of the post-D566 mean 63.94 observations per position = 69.9%**.
Adding the 13.00 unconditional observations, **90.2% of the shipped reading carries no
discriminating information about the move that produced it**, and **6.26 observations per
position — 9.8% — are the entire remainder.**

**(c) A ranked surface is dramatically better and costs no new detector** `[V]` (§6c). Restricting
the compare strip to the top-*k* kinds by measured lift:

| kept | firing rate | entries/ply | lift |
|---|---|---|---|
| all 17 (shipped) | 99.87% | 8.83 | **1.003×** |
| top 8 | 36.47% | 0.48 | **5.29×** |
| top 5 | 15.38% | 0.21 | **83.62×** |
| top 2 | 3.18% | 0.03 | **294.11×** |

This is the answer to *"only interesting shit"*: the interesting shit is already computed. It is
buried under an unranked union with the boring shit, and the ratio is roughly **9:1 against**.

**(d) The coverage picture is the opposite of the one the question assumes** `[V]` (§4). A
chess.com-class review annotates **115 distinct things** by my count, of which only **47 are
verified as emitted over your own game**: 12 move-quality words computed from an engine delta, 22
aggregate statistics, 4 tactical motifs (fork / pin / mate / hanging piece), 4 opening-identity
rows, and 5 others. **Zero** pawn-structure facts, **zero** space facts, **zero** plan facts —
chess.com's complete published Insights metric list contains none `[V]`, Lichess Insights' 13
dimensions and 10 metrics contain none `[V]`, and WintrChess's open-source classifier, read line by
line, contains none `[V]`. The owner's list (*"central space, doubled pawns, backward pawn,
kingside space, outposts, strike at the centre"*) describes what the **coach prose** talks about,
not what the classifier detects. We already detect 17 of those and they do not.

**(e) There is no producer→feature binding, and four registries that look like one are not** `[V]`
(§8). `CAPABILITY_DISPOSITIONS` (39 rows) binds *instrument options* to prose surface names —
its `surface` field is free text with 8 distinct values, **none of which is one of the seven
declared `SurfaceId`s** — and the whole field is absent from the web's `Capabilities` type.
`RECORDED_READING_DISPOSITIONS` (7 rows) is a real gate but governs ledger record kinds, not UI.
`FORMAT_DISPOSITIONS` names implementing symbols but covers pack pointers and opponent modes.
`EVIDENCE_RUNG` is the only encoding of the assistance ladder as data and lives in an offline
census. **Nothing anywhere declares "UX feature X is fed by producer Y at rung Z."**

**(f) Thirteen shipped producers or payloads have no learner consumer, and three rendered
surfaces have no producer** (§7b). Two shipped
detectors have latent defects: `irreversibility`'s castling test misses the `e1h1` UCI convention —
**2 of the corpus's own 22 castlings and 100% of PGN-imported games** — and `pawn_count` is a
declared feature kind that emits **zero observations in 643 positions**.

---

## 2. Method

Three passes, all at `424374f`.

1. **Inventory (§3)** — derived from the code, not from any doc. Every kind enum in
   `packages/schema/src/drill-pack/types.ts` and `packages/runtime/src/*.ts` was read at the symbol
   and cross-checked against what the emitter actually pushes.
2. **Selectivity (§5, §6)** — the harness re-implements the shipped compare-strip diff with the
   same `JSON.stringify` observation key (`packages/runtime/src/compare-strips.ts`, `observationKey`) and measures
   axis D exactly as Q8 and R11 did, then adds the **per-kind** discrimination pass those two never
   ran. Lift is R11 §5's definition: `P(fires on the played move) / P(fires on a legal alternative
   from the same parent)`.
3. **Consumer trace (§7)** — from every Svelte component and presentation module under
   `apps/web/src/` backwards through `apps/server/src/rest.ts` to `packages/runtime/src/`, with each
   producer symbol re-verified by repo-wide grep excluding `*.test.ts` and `archive/`. Independently
   cross-checked against the repo's own `runDeclarationCensus`
   (`apps/server/src/declaration-census.ts`), which agrees where its coverage reaches (§7c).

**What is not measured here.** No reader study — usefulness is bounded mechanically, as in R3, not
judged. No played run, so `human_divergence` firing and the voice-provider path are absent. The
authored spine is the *generous* population, as R11 established; a Maia-weighted population would
shrink every lift reported here.

---

## 3. (A) What we actually detect — the shipped inventory

**64 distinct machine-emitted classification kinds**, counted at the symbol. Counting rule: one row
per kind a producer can name in an emitted record. Parameter values that are part of the kind's
identity (`direction`, `subkind`, `zone`, `form`) are counted separately where the emitter treats
them as separate rows; catalogue *instances* (25 shape entries, 4 named structures) are counted once
as their kind and listed separately.

| # | Producer | Kinds | Computed from | Emits? |
|---|---|---|---|---|
| 1 | `structure.ts` `structuralReading()` | **18 declared, 17 emitted** | **position alone** | yes; `pawn_count` emits 0 (§7d) |
| 2 | `transition.ts` `transitionReading()` | **6 declared → 14 observable keys** (5 count leaves × 2 directions + 4 irreversibility subkinds) | **the move** (before/after FEN pair + UCI) | yes |
| 3 | `pivotal.ts` `pivotalMarkers()` | **4** (`irreversibility`, `phase_change`, `option_collapse`, `human_divergence`) | 3 from position/move; `human_divergence` from **recorded Maia policy mass** | yes; `liveAdmitted` then drops all but `last_of_role` and (permission-gated) `human_divergence` |
| 4 | `phase.ts` `classifyPhase()` | **4 bands** (opening / middlegame / endgame / `unclear`) | **position alone** (material sum + undeveloped-minor count) | yes |
| 5 | `endgame.ts` `endgameReading()` | **5 types + 3 named techniques** (lucena, philidor, vancura) | position alone; technique *names* are an authored catalogue | yes, only when phase is endgame |
| 6 | `tempo.ts` | **7 verdicts** (5 gradeable) | move sequence **+ an authored timing window** | yes; **4** of 404 content JSON files declare a window |
| 7 | `line.ts` `lineMembership()` | **3 verdicts** (`on_line`, `classified_deviation`, `unknown`) | the move **+ the authored spine** | yes |
| 8 | Stockfish records | **3** (`eval`, `wdl`, `bestline`) | **engine search** | yes; only `eval` values are rendered (§7) |
| 9 | Syzygy records | **1 kind, 5 categories** | **tablebase** | yes |
| 10 | Lichess explorer | **2** (position census, per-move frequency) | **corpus** | yes, above a 100-game floor |
| 11 | Maia | **1** (policy mass per candidate) | **human model** | yes |

**Basis split: 29 of 64 kinds are computed from the position alone** (17 structural + 4 phase + 8
endgame), **17 from the move** (14 transition + 3 line), **4 are path markers**, **7 from a move
sequence plus an authored timing window**, and **7 from an engine, tablebase, corpus, or human
model** `[V]`. Only those last seven need anything outside the FEN already stored in the run.

### 3a. The 18 structural kinds, verified at the symbol

`STRUCTURAL_FEATURE_KINDS`, `packages/schema/src/drill-pack/types.ts:372` `[V]`:
`pawn_safe_square`, `outpost`, `backward_pawn`, `isolated_pawn`, `doubled_pawn`, `passed_pawn`,
`open_file`, `half_open_file`, `line_blockers`, `direct_attack_count`, `piece_reach_count`,
`named_structure`, `bishop_on_shade`, `pawn_count`, `king_opposition`, `piece_count`, `king_zone`,
`piece_distance`.

`docs/structural-reading.md` describes "eighteen closed feature kinds" and is correct on the
declaration. It is silent on the fact that one of them emits nothing in the projection.

The four `named_structure` catalogue entries are `carlsbad`, `iqp-white`, `iqp-black`,
`maroczy-bind` (`structure.ts:439`), and together they match **61 of 643 positions = 9.49%** `[V]`.

### 3b. The authored vocabulary uses less than half of it

Measured over the 50 packs and 25 shape entries `[V]`:

| | kinds used | kinds never used |
|---|---|---|
| shape-library triggers (25 entries) | 7 of 18 | 11 |
| pack expressions (50 packs) | 14 of 18 | 4 |
| **either** | **14 of 18** | **4** (`pawn_safe_square`, `outpost`, `piece_reach_count`, `pawn_count`) |
| transition kinds in packs | 3 of 6 | 3 (`attacked_squares_changed`, `defended_squares_changed`, `defended_duties_changed`) |

**The four kinds no author has ever referenced are, with one exception, the highest-volume rows in
the learner-facing reading**: `pawn_safe_square` 8.29/position, `piece_reach_count` 8.29/position,
`outpost` 0.00/position post-D566, `pawn_count` 0.00. Two of them are also two of the five anti-discriminating
detectors in §6.

`outpost` deserves a separate note because the design tier leans on it. `design/05` §3a names
structural description as the rung-0 exemplar, and Q8 found `outpost` firing on 2 of 515 positions.
Before D566 it fired on **10 observations across 1.56% of 643 positions**. The repaired maximal-reach
dependency fires on **0/643 positions** and **0/717 played moves**, while 11/19,636 alternatives
produce it `[V]`. This is honest abstention, not evidence that the primitive is useless; it does
mean this corpus supplies no played positive from which to estimate lift.

---

## 4. (B) What a chess.com-class review detects — the coverage target

Built from primary sources this pass (`support.chess.com` articles 8584089 / 8572705 / 8708970 /
8708925 `[V]`; `chess.com/news/view/chesscom-launches-game-review-v2` `[V]`;
`github.com/lichess-org/lila` `modules/analyse/src/main/Advice.scala` read in full `[V]`;
`github.com/WintrCat/freechess` `src/lib/classification.ts` / `analysis.ts` / `board.ts` read in
full `[V]` — the only public complete implementation of a chess.com-style classifier;
`lichess.org/training/themes` `[V]`; `lichess.org/blog/VmZbaigAABACtXQC/chess-insights` `[V]`;
`arxiv.org/html/2406.11895v1` `[V]`; DecodeChess via
`chessify.me/news/chessify-partnership-with-decodechess` `[V]`, the vendor site itself returning 403,
so all DecodeChess vocabulary is `[P]`), plus the repo's own
`teardown-chesscom-platform-desk.md` §2, `teardown-chesscom-desk.md`,
`quickpass-wintrChess-encroissant-chessmonitor.md` §1/§3.

**This is a coverage target, not a spec.** We are not cloning it.

| Family | rows | verified as emitted over your game | computed from |
|---|---|---|---|
| **A** move-quality grades (Best, Great, Brilliant, Excellent, Good, Book, Inaccuracy, Mistake, Miss, Blunder, Forced, mate-sequence) | 12 | **12 `[V]`** | engine multi-PV delta + thresholds; `Book` is a corpus lookup; `Forced` is legal-move count alone |
| **B** opening identity (name, ECO, book depth, per-opening performance) | 4 | **4 `[V]`** | **corpus lookup by FEN or move prefix**; no engine |
| **C** tactical motifs (fork, pin, skewer, discovered attack/check, double check, hanging piece, back-rank, deflection, capture-the-defender, overload, trapped piece, mate net, 19 named mate patterns, sacrifice, promotion, underpromotion, advanced pawn, zugzwang, interference, attraction, clearance, intermezzo, X-ray, quiet move, defensive move, exposed king, kingside/queenside attack, attacking f2/f7, en passant, collinear, castling, threats) | 34 | **5 `[V]`** — chess.com Insights ships found/missed **forks, pins, mates** and hanging-piece counts; GR-v2 ships **threats**. The other ~30 are `[V]` only as **Lichess puzzle-theme tags**, applied offline to curated puzzles, not asserted over your move | mostly position/move arithmetic (attack-set and ray-scan); the *missed* half needs a counterfactual engine check |
| **D** pawn structure (doubled, isolated, backward, passed, connected, islands, chains, IQP, majority, locked centre, break available) | 11 | **0** — none `[V]`, none `[P]`; `[M]` throughout | position alone |
| **E** space and squares (space count, outpost, weak square/hole, open file, half-open file, square/file/diagonal control, centre control) | 9 | **0** | position alone |
| **F** piece activity (develops, mobility, bad bishop, rook on 7th, centralization, trade, tempo, piece function, material imbalance, per-piece accuracy) | 10 | **4 `[V]`** (queen trade, material imbalance, moves-per-piece, and DecodeChess's "piece functionality" `[P]`) | position/move arithmetic, except the last |
| **G** king safety (rights, castling side/timing, castling prevented, exposure, attacker pressure, checks available, threats) | 7 | **2 `[V]`** | FEN field + attack-set arithmetic |
| **H** plan / strategy ("plans", "concepts", attacking plans, named plan verbs, minority attack, prophylaxis) | 6 | **0 `[V]`** — DecodeChess claims them with **no disclosed mechanism** `[P]` | undisclosed |
| **I** phase and aggregates (accuracy %, CAPS2, estimated rating, phase boundaries and per-phase grade, ACPL, classification counts, eval graph, game shape, Key Moments, opportunism, luck, time usage, …) | 22 | **21 `[V]`** | aggregates over A + game metadata |
| | **115** | **47** | |

### 4a. Which of those would be an ungrounded judgement for us

Five layers, and law 8 falls between the third and the fourth.

1. **Rules arithmetic — grounded, no judgement.** All of D and E, most of F and G, C6/C7/C12/C14/
   C16–C18/C24/C31–C33, A11 `Forced`, B1–B3. *"Develops a piece"* is arithmetic (a back-rank home
   square is vacated). So is *"doubled pawns"*, *"open file"*, *"rook on the 7th"*, and *"the king
   moved and the castling right is gone"*. These pass law 8 with no engine at all.
2. **Engine-number-grounded with a disclosed threshold — grounded *conditionally on showing the
   threshold*.** A3–A5, A7, A8, A10, A12, C13, I1, I6, I9. The eval is a measurement; the cut point
   is a convention, and the conventions are **mutually incompatible** — Lichess uses 10/20/30
   percentage points of *win probability* `[V]` (`Advice.scala`), chess.com uses 0.05/0.10/0.20
   *expected points* `[V]`, freechess fits a **quadratic in the previous eval** whose own comment
   calls it the "WTF Algorithm" `[V]`. The same move is an Inaccuracy on one site and a Mistake on
   another. **Printing the number is grounded; printing only the word launders a convention as a
   fact.**
3. **Heuristic composites over engine numbers — ungrounded judgements dressed as detections.**
   `Brilliant` is the clearest: freechess's published algorithm is a conjunction of best-move match,
   an eval floor, a not-already-winning cutoff and a hand-tuned sacrifice-viability test with
   special cases for rooks-and-above versus minors `[V]`; chess.com additionally makes it **easier
   to earn if you are lower-rated** `[V]`, so the same move on the same board is Brilliant for one
   player and Best for another. That is not a property of the position. `Great` and `Miss` depend on
   the *opponent's* previous classification and on your rating `[V]`. CAPS2 is explicitly tuned to
   *"replicate the feeling of being graded on a test in school"* `[V]`. **This layer is admissible
   for us only if we publish the rule.**
4. **Plan and concept labels — assertions with no disclosed mechanism.** All of family H, plus F8,
   plus the motifs whose name asserts *intent* rather than geometry (deflection, interference,
   attraction, clearance, intermezzo). *"Strike at the centre with a pawn"* claims to know what a
   move is **for**. **This is the law-8 line**, and the fact that a vendor's classifier rather than
   an LLM emits it does not change what the claim rests on.
5. **Motifs whose internals are simply undocumented.** Fork, pin, mate: chess.com ships found/missed
   counts `[V]` and has published nothing about how they are found. The geometry is arithmetic and
   *could* be exactly grounded; whether theirs is, is unknown.

**What would ground layer 4 for us.** The owner's ruling of 2026-08-17 ([[D530]]/[[D531]]) is the
template and it applies unchanged here: all 13 principles declare `standsOn: "authors_practice"`
while `chess_tradition` sits unused in the enum `[V]` (verified: 13 of 13
`content/principles/*.json`), and the fix is to ground them in citable literature. A plan label like
*"strike at the centre with a pawn"* becomes admissible the moment it is (i) a detected structural
antecedent — which we already have — plus (ii) a **cited** plan statement from named literature,
rendered as *"named plans for this structure — general to the kind of position, not advice for this
one"*, which is the frame `ShapePanel.svelte:30` already ships `[V]`. The mechanism exists; what is
missing is the citation, exactly as in D530.

---

## 5. (C) What the UX actually consumes, and the selectivity re-derivation

### 5a. The delivery, quoted

The learner-facing surface is three renderers, and all three print the **entire** reading.

- `apps/web/src/lib/DrillScreen.svelte:859` — the "Structural reading" disclosure:
  `{#each structure.features as observation}<p>{renderStructuralObservation(observation)}</p>{/each}`
  → a **median 80 sentences**, unranked, unpaginated, unfiltered.
- `apps/web/src/lib/CompareView.svelte:158` — the per-branch "Structural reading" `<details>`:
  the same full reading, once **per compared branch**.
- `apps/web/src/lib/CompareView.svelte:135` — the compare strip:
  `{entry.observation ? renderStructuralObservation(entry.observation) : entry.sentence}` at
  **8.83 entries per ply**.

The sentences are the owner's exhibit. `apps/web/src/lib/structural-sentences.ts:26` `[V]`:

> `White's bishop on e3 stands on a dark square.`

and `:24`:

> `White's knight on f3 has 5 attack-reachable squares in the current occupancy; check and pins are
> not evaluated.`

Both are true. Neither is a fact about the move that was played, and §6 shows why: both kinds fire
*more* on the moves that were not.

**One selectivity mechanism does ship and is not being used as one.** `DrillScreen.svelte:345-347`
filters `structure.features` to the clicked square and paints board overlays plus the matching
sentences. That is a **square-scoped** reading, and it is the correct home for exactly the five
high-volume detectors §6 condemns from the default list.

### 5b. The selectivity numbers, re-derived at HEAD

All `[V]`, n stated, from `tools/d542-classifier-audit-harness/output.md`.

| measure | D78 (2026-08-16, 47 packs) | HEAD (50 packs) |
|---|---|---|
| spine transitions | 754 | **754** |
| distinct positions | 609 | **643** |
| compare-strip firing rate | 99.9% | **99.87%** (753/754) |
| entries per ply (mean) | 8.83 | **8.83** (median 9, p95 18, max 24) |
| quiet alternatives evaluated | 18,470 | **18,470** |
| quiet alternatives that also fire | 99.4454% | **99.45%** within-position mean; **99.59%** pooled |
| same-kind share | 91.95% | **91.95%** |
| **lift** | 1.004× | **1.004×** within-position / **1.003×** pooled |
| rung-0 median observations/position | 78 | **80** (post-D566 mean 63.94, p95 96, max 102) |

**D78 reproduces exactly.** The one number that moved is the median observations per position,
78 → 80, and it moved for the reason [[D359]] already identified: the distribution is bimodal by
phase and the median sits in its gap. Per declared phase at HEAD `[V]`: **endgame 31**, cross-phase
79, **opening 87**, **middlegame 89** — the middlegame reading is **2.9× the endgame reading**, in
the phase R4/R9 proved has no oracle.

**The unconditional floor.** Of the post-D566 mean 63.94 observations, `piece_count` contributes **12.00 in
100% of positions** and `piece_distance` **1.00 in 100%** `[V]`. Thirteen observations per position
are emitted before any detector has decided anything, which is why
`DrillScreen.svelte:858`'s honest-absence string — *"No rung-0 structural observations in this
position."* — is **unreachable dead code** `[V]`.

---

## 6. Is the noise in the detectors, in the delivery, or in the absence of ranking?

**In the delivery, and specifically in the absence of ranking. This is now measured.**

### 6a. Per-kind discrimination, structural

Lift = `P(the played move gains ≥1 observation of this kind) / P(a legal alternative from the same
parent gains ≥1)`. Denominators: **717 played moves, 19,636 legal alternatives** `[V]`.

| kind | played rate | alt rate | **lift** | obs/position |
|---|---|---|---|---|
| `named_structure` | 0.56% | 0.056% | **9.96×** | 0.09 |
| `doubled_pawn` | 3.07% | 0.418% | **7.35×** | 0.16 |
| `passed_pawn` | 1.95% | 0.382% | **5.11×** | 0.19 |
| `open_file` | 1.81% | 0.458% | **3.96×** | 2.73 |
| `piece_count` | 14.23% | 3.687% | **3.86×** | 12.00 |
| `isolated_pawn` | 1.81% | 0.519% | **3.49×** | 0.27 |
| `king_opposition` | 9.07% | 3.066% | **2.96×** | 0.09 |
| `king_zone` | 9.34% | 3.799% | **2.46×** | 1.57 |
| `piece_distance` | 21.06% | 9.065% | **2.32×** | 1.00 |
| `half_open_file` | 4.74% | 2.327% | **2.04×** | 0.94 |
| `outpost` (post-D566) | 0.00% | 0.056% | n/a | 0.00 |
| `backward_pawn` | 2.93% | 2.169% | **1.35×** | 0.21 |
| `line_blockers` | 75.45% | 82.889% | **0.91×** | **17.97** |
| `piece_reach_count` | 82.57% | 92.341% | **0.89×** | **8.29** |
| `pawn_safe_square` | 79.92% | 90.482% | **0.88×** | **8.29** |
| `bishop_on_shade` | 17.15% | 19.673% | **0.87×** | 2.25 |
| `direct_attack_count` | 58.86% | 67.947% | **0.87×** | **7.88** |
| `pawn_count` | 0.00% | 0.000% | n/a | **0.00** |

**The correlation between volume and worth is negative and it is not subtle.** The five kinds with
lift below 1.0 supply **44.68 of 63.94 observations per position — 69.9%** `[V]`. The twelve kinds
with lift above 2.0 supply **19.06**, and 13.00 of that is the two unconditional kinds. **The
conditional, discriminating remainder is 6.26 observations per position: 9.8% of what is printed.**

Note carefully what "lift below 1.0" means. It is not "weakly informative". `piece_reach_count`
fires on 82.57% of played moves and **92.34%** of the moves not played: told that a piece's
attack-reach count changed, a learner should conclude the move was *slightly less likely* to be the
one played. Five detectors, 70% of the volume, pointing the wrong way.

### 6b. Per-kind discrimination, transition census

Same denominators `[V]`.

| leaf:direction | played | alt | **lift** |
|---|---|---|---|
| `move_irreversibility:last_of_role` | 2.93% | 0.122% | **23.96×** |
| `move_irreversibility:pawn_break` | 8.37% | 4.044% | **2.07×** |
| `defended_duties_changed:released` | 7.95% | 4.242% | **1.87×** |
| `move_irreversibility:clock_zeroed` | 35.29% | 29.028% | 1.22× |
| `defended_squares_changed:gained` | 18.27% | 16.118% | 1.13× |
| `escape_squares_changed:lost` | 81.03% | 75.733% | 1.07× |
| `attacked_squares_changed:lost` / `:gained` | 15.34% / 35.15% | 14.631% / 33.546% | 1.05× / 1.05× |
| `slider_lines_changed:opened` | 52.44% | 54.252% | 0.97× |
| `escape_squares_changed:gained` | 82.15% | 86.632% | 0.95× |
| `defended_duties_changed:acquired` | 9.21% | 10.995% | 0.84× |
| `defended_squares_changed:lost` | 22.18% | 27.704% | 0.80× |
| `slider_lines_changed:closed` | 33.75% | 51.589% | **0.65×** |

`move_irreversibility:castled` is **excluded as a harness artefact** — chessops' `makeUci` emits the
king-takes-rook form `e1h1`, `irreversibility()` tests `|Δfile| === 2`, so no enumerated alternative
can ever fire it. That artefact is how the real defect in §7d was found.

**R11's headline is corroborated by an independent route.** R11 measured
`move_irreversibility:fired` at **12.64×** against all alternatives and called it the most
discriminating primitive in the set. Resolved to its subkind at HEAD it is **23.96×** for
`last_of_role` `[V]` — nearly twice as sharp as the pooled figure, and still a *single rare
primitive*, exactly as R11 concluded. `defended_duties_changed:acquired` — the one live primitive
`rfc/transition-primitives.md` §5.4 bet on and R3 refused — measures **0.84×** at HEAD, the wrong
side of 1.0 for a third time.

### 6c. The ranked counterfactual

What the compare strip becomes if only the top-*k* kinds by §6a lift are printed `[V]`:

| k | kinds kept | transitions firing | entries/ply | quiet-alt firing | **lift** |
|---|---|---|---|---|---|
| 1 | `named_structure` | 0.53% | 0.01 | 0.01% | **49.02×** |
| 2 | + `doubled_pawn` | 3.18% | 0.03 | 0.01% | **294.11×** |
| 3 | + `passed_pawn` | 5.04% | 0.05 | 0.18% | **27.39×** |
| 5 | + `open_file`, `piece_count` | 15.38% | 0.21 | 0.18% | **83.62×** |
| 8 | + `isolated_pawn`, `king_opposition`, `king_zone` | 36.47% | 0.48 | 6.89% | **5.29×** |
| 17 | shipped | **99.87%** | **8.83** | **99.59%** | **1.003×** |

The trade is legible and the middle of it is the product decision. **k=8 speaks on roughly one move
in three at half an entry per ply and discriminates at 5.29×** — five times R3's refusal bar of
1.05×, at 5.5% of the current volume. **k=5 discriminates at 83.62× and speaks on one move in
six.** Both are enormous improvements on 1.003×, and neither requires a detector that does not
already exist.

This also settles the question [[D358]] raised and could not close. The all-on rung-0 reading costs
a median **978 words / 247 seconds at one node**, against a 10+0 budget of **60 readable words per
move**. A k=8 strip at 0.48 entries per ply is inside that budget by an order of magnitude, without
any clock, slot economy, or new content.

**`DESIGN-GAP:`** `design/05` §3 orders the assistance ladder by **what each source can get
wrong** and concludes rung 0 *"cannot be wrong"*, therefore is the safest to show. §3a already
corrected the "safest ⇒ should be shown" inference on *volume* grounds. This dossier adds a second,
sharper correction on *content* grounds: **within rung 0 there is an 11× spread in whether a
statement bears on the decision at all**, and the ladder has no axis for it. A statement that is
true, cheap, and anti-correlated with the move you played is not a safe statement — it is a
misleading one delivered honestly. The ladder ranks sources; it needs a second axis that ranks
**statements**, and only the owner may add it.

---

## 7. The three-way gap table

### 7a. Detected and used

| producer | rung | what the learner sees |
|---|---|---|
| `structuralReading` (17 kinds) | 0 | "Structural reading" panel (`DrillScreen.svelte:859`), board-overlay caption (`:899`), compare columns (`CompareView.svelte:158`), compare strip (`:135`), LLM evidence packet (`guidance.ts:34`) |
| `transitionReading` (14 keys) | 0 | "What changed on this move?" (`DrillScreen.svelte:868`) |
| `classifyPhase` (4 bands) | 0 | *"Detected by Tabiya's phase bands: middlegame."* (`DrillScreen.svelte:834`) |
| `endgameReading` (5+3) | 0 (+5 for technique names) | pivotal-marker modal only (`DrillScreen.svelte:1087`) |
| `pivotalMarkers` (4 kinds) | 0 (+3 for `human_divergence`) | timeline dot → modal (`Timeline.svelte:78`, `DrillScreen.svelte:1086`) |
| `shapeFirings` + 25 shape entries | 0 detect / 5 plans | timeline chip → `ShapePanel.svelte` |
| `lineMembership` (3 verdicts) | 5 | *"Ply 12, Nf3: the pack classifies this as premature-break."* (`CheckpointSheet.svelte:149`) |
| Syzygy records | 1 | *"Exact tablebase evidence recorded: category win…; 5 pieces; DTZ 12."* |
| Stockfish `eval` | 2 | sparkline + `+0.54` / `M+3` (`CompareView.svelte:134,154`) |
| Maia policy mass | 3 | *"maia-1500, rating target 1500: e7e5 34% · c7c5 22% · …"* (`DrillScreen.svelte:774`) |
| Lichess explorer | 4 | *"From this position: 4210 games. White wins 48.2%…"* + `CORPUS_GUARD` |
| authored feedback + principles | 5 | `CheckpointSheet.svelte:132-156` |
| `tempo` verdicts | 5 | timing-window sentences (**4** of 404 content JSON files declare a window) |
| `matchKeyPoints` | 5+0 | *"Mentioned — matched 'develop the queenside'"* (**1** of 404 content JSON files) |

### 7b. Detected and unused — sixteen items, in three shapes

**Exported, tested, never called** (verified by repo-wide grep excluding tests and `archive/`) `[V]`:

| symbol | rung | note |
|---|---|---|
| `structure.ts` `structuralDelta()` | 0 | already labelled *"shipped, dead"* by `tools/r1r2-primitives-harness/r1.test.ts:98`, where it is also the cost outlier at **1721 µs/ply, 59× the whole transition census** |
| `structure.ts` `vacationReading()` | 0 | labelled *"shipped, dead"* at `r1.test.ts:97`; has no test of its own |
| `adaptive.ts` `retrospectivePivot()` | 2 | |
| `transition.ts` `capturedRole()` | 0 | exported; the *"a trade happened"* primitive |
| `tempo.ts` `unauthoredTempoTransition()` | 5 | |
| `objective.ts` `requestObjectiveEvidence()` | — | |
| `transition-sentences.ts` `renderTransitionSpec()` | 0 | its structural sibling **is** consumed (`ShapePanel.svelte:25`) — so authored *structural* specs are shown to learners and authored *transition* specs are not |

**Produced and transported, never rendered** `[V]`:

| payload | rung | note |
|---|---|---|
| `concessionRatio` (`humanConcessionMass`) | 3 | computed per candidate, typed through `rest.ts:205`, **dropped at the component boundary**; grep in `apps/web/src` returns nothing |
| Stockfish `wdl` values | 2 | rendered only as the string *"wdl evidence recorded."*; `ComparisonEvidenceEntry` is hard-typed `kind: "eval"` (`compare.ts:66`) so the strip structurally cannot show it |
| Stockfish `bestline` PV | 2 | same |
| `opening_identity` records | 4 | emitted by `sourcing/openings.ts:135` with ECO + name; **refused at runtime** by `position-evidence.ts:25` — *"Opening identity is position naming, not a recorded measurement"* |
| `capabilityDispositions` / `costBasis` / `tempoVerdicts` / `tempoGradeable` / `tempoDefaults` | — | on `GET /capabilities`; **absent from the web's `Capabilities` type** (`api.ts:276-336`) |
| `phase.ts` `undevelopedMinors` | 0 | computed on every phase call, never rendered — the *"develops a piece"* primitive, already built |

**Rendered with no producer** `[V]`:

| item | note |
|---|---|
| `assistance.arrows` | a persisted three-state control with a migration path across four schema versions (`assistance-preference.ts:25-27`) that `DrillScreen.svelte` **never reads**. Its absence is honestly declared at `packages/schema/src/drill-pack/dispositions.ts:63` — *"no directed structural primitive exists (the reader emits square sets, not vectors)"* |
| `packAbsentEvidenceRef` | `evidence-sentences.ts:90` builds a sentence row for it; **nothing emits the ref** |
| `DrillScreen.svelte:858` | *"No rung-0 structural observations in this position."* — unreachable, because `structuralReading` pushes 12 `piece_count` rows before any detector runs |

### 7c. Undetected and wanted, ranked by cost to compute

Cost class: **free** = pure arithmetic over primitives the runtime already has (`attacks`, `between`,
`pawnAttacks`, the FEN fields); **cheap** = free plus a small table or a one-ply enumeration;
**engine** = requires a Stockfish call; **grounding** = requires a citation before it may be said at
all. Firing rates and lift measured on the same corpus by
`tools/d542-classifier-audit-harness/candidates.test.ts` `[V]` where stated.

| rank | wanted | cost | evidence it would carry | measured |
|---|---|---|---|---|
| 1 | **hanging piece** (attacked and under-defended) | **free** — freechess publishes the complete algorithm (`board.ts`, attacker/defender enumeration with pawn-defender and exchange carve-outs) `[V]`, and we already compute `direct_attack_count` per colour | rung 0; the single most-shipped motif in this competitor class | see §7d table |
| 2 | **fork / double attack** | **free** — attack-set of the piece that just moved, filtered by value | rung 0 | see §7d table |
| 3 | **absolute pin** and **skewer** | **free** — `between()` + one-blocker ray scan; both primitives are already imported by `structure.ts` | rung 0 | `absolute_pin` **5.60%** static, 1.28× as a delta — read it as a **state**, not an event |
| 4 | **connected pawns / pawn islands / pawn chains** | **free** — connected-component count over occupied files; we already have the pawn sets | rung 0; the vocabulary the shape library keeps reaching for | `pawn_island_gained` **2.13×** |
| 5 | **rook on the 7th** | **free** — one rank test | rung 0 | **3.83×**, 8.09% static |
| 6 | **castling right lost / castling prevented** | **free** — we do not read the FEN castling field **at all** today | rung 0; the owner's *"moving king preventing castling"* | `castling_right_lost` 0.65× as a *gain* signal — it is a **state**, not an event, and should be read as one |
| 7 | **development count** (`undevelopedMinors`) | **free — already computed** at `phase.ts:36` and thrown away | rung 0; the owner's *"develops piece"* | — |
| 8 | **trade / capture happened** (`capturedRole`) | **free — already exported** and unused | rung 0 | — |
| 9 | **space** (central, kingside, queenside) | **free** — count squares on the far half controlled by own pawns; the definition must be declared as a Tabiya convention, as `outpost` already is | rung 0; the owner's *"central space" / "kingside space"* | `central_space_gained` **1.09×** as a gain signal — weak; a **level** reading, not a delta |
| 10 | **weak square / hole** | **free** — the complement of `pawn_safe_square`, which we already compute | rung 0 | — |
| 11 | **bad bishop** | **free** — own pawns on the bishop's shade; `bishop_on_shade` already exists and is one of the anti-signals precisely because it stops one step short | rung 0 | 58.94% static at a ≥4 threshold — needs a declared threshold |
| 12 | **back-rank weakness, trapped piece, X-ray, discovered attack** | **cheap** — one-ply enumeration per candidate piece | rung 0 | — |
| 13 | **opening identity (ECO + name) at runtime** | **cheap** — the pinned `lichess-org/chess-openings` source has 3,810 unique named endpoints and 7,854 all-prefix keys `[V]`; **we already fetch it** in `sourcing/openings.ts` for candidate emission and then refuse runtime identity. Exact endpoint, path membership and retrospective deepest reached are separate facts (`runtime-opening-identity.md`) | rung 4 (corpus lookup, not a judgement) | the owner's *"Dutch Defense"* |
| 14 | **book depth / "out of book" ply** | **cheap** — the same table, counted to the first miss | rung 4 | — |
| 15 | **mate-in-N available / missed** | **engine** — mate score, or a bounded mate search | rung 2, exactly grounded | — |
| 16 | **move-quality grade** (inaccuracy / mistake / blunder) | **engine** + a **published threshold**. Admissible under §4a layer 2 *only* if the number is shown beside the word | rung 2 | — |
| 17 | **`Brilliant` / `Great` / `Miss`** | **refused** — §4a layer 3. These are hand-tuned composites, and chess.com's are **rating-dependent**, so the same move is a different grade for different players `[V]` | — | — |
| 18 | **accuracy % / CAPS / estimated rating** | **refused** — aggregates over layer 3, and CAPS2 is openly tuned for *feel* `[V]` | — | — |
| 19 | **plan labels** (*"strike at the centre with a pawn"*, minority attack, prophylaxis) | **grounding** — the detection half exists (shape triggers); the assertion half needs a **citation**, per D530/D531 | rung 5 with a cited source | — |

**Ranks 1–8 are the buy. All eight are free or already computed, all eight are rung-0 honest, and
between them they cover every tactical motif a chess.com-class review actually ships plus three
items the owner named by hand.**

### 7d. What the candidate detectors measure

Eight candidate detectors implemented as pure arithmetic and measured on the same corpus, same
method, **717 played moves / 19,636 alternatives** `[V]`:

| candidate | played rate | alt rate | **lift** | static prevalence |
|---|---|---|---|---|
| `rook_reached_seventh` | 0.98% | 0.255% | **3.83×** | 8.09% |
| `pawn_island_gained` | 2.93% | 1.375% | **2.13×** | 4.67% (>2 islands) |
| `absolute_pin_created` | 2.37% | 1.854% | 1.28× | 5.60% |
| `central_space_gained` | 9.07% | 8.286% | 1.09× | — |
| `fork_created` | 1.67% | 2.332% | 0.72× | — |
| `castling_right_lost` | 3.07% | 4.721% | 0.65× | — |
| `hanging_piece_created` | 4.04% | 15.716% | **0.26×** | 4.20% |
| `bad_bishop_created` | 0.00% | 0.081% | 0.00× | 58.94% |

**Two results here matter more than the ranking, and one of them cuts against the buy.**

**`hanging_piece_created` at 0.26× is the finding, and it is a good one.** The played move creates a
hanging piece **one quarter** as often as a random legal alternative — because authors play sound
moves. Read as a *"this is what the move did"* census it is a weak signal, which is R3's lesson
again. Read as *"here is what you avoided and 15.7% of your alternatives would not have"* it is
**strongly** discriminating in the negative direction, and that is the shape
`design/05` §5 already asks for: *what is the moved piece no longer doing*. **A detector with lift
0.26× is as informative as one with lift 3.85× — the sign is a rendering decision, not a quality
one — and nothing in this repo's method, including R3's and R11's, has ever scored a leaf that
way.** Applied to §6a it would rescue three of the five condemned kinds as *negative* signals;
applied to `slider_lines_changed:closed` (0.65×) it reopens a leaf R3 refused.

**`fork_created` at 0.72× is a caution against the buy at rank 2**, for the same reason and with the
opposite conclusion: a fork the authored spine plays is rarer than a fork available to a random
move, because most "forks" by the geometric definition attack two defended pieces and win nothing.
The motif needs the material test (does the fork *win* something) before it is worth printing, and
that test is where chess.com's undocumented internals live. **Do not ship rank 2 on geometry
alone.**

**`absolute_pin_created` at 1.28× with 5.60% static prevalence sets the honest expectation for rank
3**: pins are common enough to be worth naming and are *not* a property of the played move — they
are a **state** the position is in, like `open_file` (3.96× as a gain, 57.85% static). The lesson
generalises: several of the wanted items in §7c are position states rather than move events, and
reading them as deltas — which is what the compare strip does to everything — is what turned
`castling_right_lost` into a 0.65× signal when *"Black can no longer castle"* is a plainly useful
fact about the position. **The strip's `gained`-only diff is itself a source of noise, independent
of which detectors feed it.**

The first `absolute_pin` run carried a bug — it lifted the slider instead of the blocker before the
ray test, returning 0.00% everywhere — and is not quoted; the corrected implementation and its
output are in the harness.

---

## 8. The architectural half — is there a producer→feature binding?

**No. Four registries exist that look like one, and each binds something adjacent.** All `[V]`.

| registry | rows | binds | does not bind |
|---|---|---|---|
| `apps/server/src/capabilities.ts:111` `CAPABILITY_DISPOSITIONS` | **39** (15 reached, 16 refused, 7 unmeasured, 1 impossible; Stockfish 14, Maia 11, Explorer 6, Syzygy 4, Supervisor 3, Human population 1) | an **instrument's advertised UCI option or API field** → a disposition + prose reason. `assertAdvertisedCapabilityDispositions` is a **real gate**: it throws if a live engine advertises an option no row covers, and if any `unmeasured` row lacks an `experiment` | the `surface` field is **free text** with 8 values — `"human split"`, `"corpus panel"`, `"feedback"`, `"analysis and feedback"`, `"opponent selection"`, `"engine worker"`, `"analysis"`, `"capability contract"` — and **none of them is one of the seven declared `SurfaceId`s** (`play`, `review`, `learn`, `live`, `create`, `justPlay`, `fromPosition`). The join key matches nothing. And the field is **absent from the web's `Capabilities` type** |
| `apps/server/src/position-evidence.ts:24` `RECORDED_READING_DISPOSITIONS` | **7** | **sourcing evidence kind → admitted / refused.** The only genuine producer-admission gate in the repo; `admittedReading` enforces it and `assertRecordedReadingDispositions` throws on drift. Only `engine_eval` and `tablebase_result` are admitted | any UI. It governs what enters the run, not what a feature may depend on |
| `packages/schema/src/drill-pack/dispositions.ts:22` `FORMAT_DISPOSITIONS` | **11** | the **only** registry that names an implementing symbol: `site: { module, symbol }`. Enforced for opponent modes | pack-format pointers and opponent modes, not readings. Its **one UX row** — `assistance:arrows` — is a declaration of *absence* |
| `apps/server/src/expression-census.ts:38` `EVIDENCE_RUNG` | **7** | the **only** encoding of the assistance ladder as data (`derived_feature: 0` … `author_principle: 5`) | authored *claim labels*, not producers. Offline census only, never imported by runtime or web. **Has no rung 6** |

**What actually gates a UX control today** is the six-field `capabilities.providers` block
(`opponent`, `judge`, `llm`, `corpus`, `tts`, `tablebase`) plus `permittedAssistance`. The corpus
panel is correctly hidden when `providers.corpus === "none"` (`DrillScreen.svelte:775`). **That
binding is about which provider *process* is wired, never about whether a reading exists for the
position in front of the learner.**

The repo already has the instrument that would ask the right question and it is scoped too
narrowly. `apps/server/src/declaration-census.ts` computes `producers` / `consumers` /
`refusalSites` / `corpusFirings` / `dispositionRow` per subject across four namespaces, and it does
scan `.svelte`. Its current output: `runtime: subjects 28, producersZero 14, consumersZero 2`. It
finds **two** of the seven zero-consumer producers in §7b, because `runtimeDeclarations` admits a
function only if its name or return type ends in `Reading` / `Observation` / `Delta`. It therefore
cannot see `pivotalMarkers`, `shapeFirings`, `comparisonStrips`, `retrospectivePivot`,
`humanConcessionMass`, `capturedRole`, `storyMoments`, or any server-side producer.

### 8a. What the binding should be, and what it would let us refuse

The shape is already half-built; what is missing is one table and one join.

A **producer manifest** with one row per emitted reading kind carrying, at minimum:

- `kind` — the emitted identifier (`outpost`, `slider_lines_changed:closed`, `engine_eval`);
- `rung` — 0–6, the ladder as data, extending `EVIDENCE_RUNG` past authored claim labels to
  producers;
- `producer` — `{ module, symbol }`, the `FORMAT_DISPOSITIONS` idea applied to readings;
- `abstains` — whether the producer can emit nothing, and the **measured** rate at which it does;
- `discrimination` — the measured lift, refreshed by a harness like this one;
- `consumers` — typed `SurfaceId[]`, so the join is compile-checked rather than free text.

**What it would let us refuse, concretely and today:**

1. **A feature whose producer abstains too often to be a feature.** `endgameReading` is silent in
   100% of opening and middlegame positions, and its only UI host is the pivotal modal — so a
   learner must already have a marker before they can see it. `outpost` is true in **0%** of
   positions. `named_structure` in **9.49%**. `tempo` verdicts in **4 of 404** content JSON files.
   `matchKeyPoints` in **1 of 404**. Each of these is a surface that looks broken most of the time,
   and none of them declares its own abstention rate anywhere.
2. **A control with no producer.** `assistance.arrows` shipped a checkbox, a persisted preference
   and four schema-version migrations for a producer that does not exist. The refusal is *already
   written down correctly* in `FORMAT_DISPOSITIONS` — it simply is not joined to the control.
3. **A reading that is transported and dropped.** `concessionRatio`, `wdl`, `bestline` all cross the
   REST boundary into a typed payload and are never read. A `consumers: []` row makes that a
   build-time fact rather than a grep result.
4. **A reading admitted to the default surface below a discrimination floor.** This is the new one
   and it is the fix for §6: a manifest carrying measured lift lets the surface print top-*k* by
   policy, and lets a reviewer refuse a new detector the way R3 refused `slider_lines_changed` —
   with a number, before it ships, rather than three dossiers later.

---

## 9. Defects found

| # | defect | evidence |
|---|---|---|
| 1 | **`irreversibility` misses castling written in the king-takes-rook UCI convention.** `transition.ts:252` tests `|Δfile| === 2`, so `e1g1` fires and `e1h1` does not. The **authored corpus is itself inconsistent**: of 22 castling moves (20 `O-O`, 2 `O-O-O`), **20 use `e1g1`-form and 2 use `e1h1`-form**, and the detector fires exactly 20 times. `apps/server/src/pgn-import.ts:54` builds move UCIs with chessops' `makeUci`, which emits the `e1h1` form — so **the "White castled." marker cannot fire on any imported game** | `[V]`, harness §6 + `grep` over `content/drafts/*.json` |
| 2 | **`pawn_count` is a declared structural feature kind that emits zero observations.** 0 of 643 positions, 0.00 per position. `docs/structural-reading.md` documents the removal from the projection but the kind remains in `STRUCTURAL_FEATURE_KINDS`, in `RULES_EVIDENCE_FACTS` as `structure-pawn-count`, and in the renderer at `structural-sentences.ts:27` | `[V]` |
| 3 | **`phase_change` fires on 1 of 754 transitions (0.13%)** and the phase classifier returns `unclear` on **13.37% of positions** — one position in seven has no band at all | `[V]`, independently reproducing Q8's 1/634 |
| 4 | **The LLM receives strictly less than the screen.** `compare-strips.ts` (`comparisonStrips`, the `structure.push` branch) writes the placeholder `"A recorded structural observation changed: ${kind}."` into `StripEntry.sentence`, and `comparisonNarrative` — which is what `evidencePacket`/`renderVoice` hand to the provider — uses **that string**, while `CompareView.svelte:135` renders the full parameterised sentence from `entry.observation`. The voice layer is asked to package `bishop_on_shade`; the learner reads *"White's bishop on e3 stands on a dark square."* | `[V]` |
| 5 | **`DrillScreen.svelte:858`'s honest-absence string is unreachable** — `structuralReading` pushes 12 unconditional `piece_count` rows before any detector runs, so `features.length === 0` cannot occur | `[V]` |
| 6 | **`castled` and `pawn_break` markers exist, render correctly, and are never live-admitted.** `pivotal.ts:74-75` admits only `last_of_role`. They surface only through the compare strip and the story | `[V]` |

---

## 10. The three changes that would most improve what a learner is told

**1. Rank by measured discrimination, not by census — and make the ranking a shipped table, not a
hand-picked list.** This is the highest-value change in the dossier and it adds no detector, no
content, and no engine call. A top-8 strip discriminates at **5.29×** at **0.48 entries/ply**
against the shipped **1.003×** at **8.83**; top-5 reaches **83.62×**. The table this dossier
measured is the first version of that ranking; it belongs in the producer manifest (§8a) so it is
refreshable and refusable rather than folklore. Corollary: **demote the five anti-discriminating
kinds out of the default list and into the square-scoped path that already ships**
(`DrillScreen.svelte:345-347`) — *"what attacks e4"* is a good answer to a question the learner
asked, and a bad thing to say unprompted 44.68 times per position. Second corollary, from §7d:
**the strip's `gained`-only diff is itself a noise source independent of the detectors.** Several
facts worth telling a learner are *states*, not events — a pin (5.60% static, 1.28× as a delta), an
open file, a lost castling right — and a surface that can only say *"this changed"* either stays
silent about them or reports the wrong thing.

**2. Add the tactical family, starting with the negative reading.** We have **zero** of the four
motifs a chess.com-class review actually ships, and all four are free arithmetic over primitives
already imported by `structure.ts`. But ship them the way §7d measured them: `hanging_piece_created`
is **0.26×** on the played move and **15.72%** on the alternatives, which makes *"you avoided
leaving a piece loose; 15.7% of your legal moves would not have"* a far stronger statement than
*"this move leaves a piece loose"* — and it is the statement `design/05` §5 already asks for. **The
sign of a lift is a rendering decision, not a quality one**, and no measurement in this repo has
ever been read that way. Do **not** ship `fork_created` on geometry alone: at **0.72×** it is
anti-discriminating until the material test is added.

**3. Bind producers to features, and use the binding to refuse.** One manifest keyed by emitted
reading kind, carrying rung, producer symbol, measured abstention rate, measured discrimination, and
a **typed** `SurfaceId[]` of consumers (§8a). Three of the four registries needed already exist and
each is missing one column; the fourth — the ladder as data — exists in an offline census and needs
only to be moved. It would have caught `assistance.arrows` before the fourth schema migration, would
name the sixteen unused items as a build fact, and would let a reviewer refuse a feature whose
producer abstains 98% of the time before it reaches a screen.

*(A fourth, cheaper than any of the three: the seven items in §7c ranks 1–8 that are already
computed and thrown away — `undevelopedMinors`, `capturedRole`, the FEN castling field — are the
owner's own "develops piece", "trades", and "moving king preventing castling", sitting in the tree
unused.)*

---

## 11. What this needs from the design tier — named, not written

Law 5 applies; these are for the owner or for claude on an owner ruling.

- **`design/05` §3 needs a second axis.** The ladder ranks **sources** by what they can get wrong.
  §6 measures an **11× spread inside rung 0** on whether a statement bears on the decision at all,
  and five detectors that point the wrong way. A rung-0 statement that is true and anti-correlated
  with the move played is not safe. Whether that axis is called discrimination, bearing, or
  relevance — and where its floor sits — is a ruling.
- **`design/05` §3-forms needs the sign rule.** §7d shows that a detector's *negative* firing can be
  its useful reading. "Present it as what you avoided" is a form decision with honesty consequences
  and no home in the current form inventory.
- **`design/03` needs a map row for the producer manifest** (§8a), not a second gate definition.
- **The plan-label grounding question is D530/D531's, extended.** Ranks 19 in §7c is admissible the
  moment a plan statement carries a citation, and the shape panel's frame already exists.

Proposed ledger rows, from **D542** (not written here):

- **D542** — the classifier's noise is delivery, not detection: 69.9% of the rung-0 reading comes
  from five anti-discriminating detectors; a top-8 ranked strip reaches 5.29× against the shipped
  1.003×.
- **D543** — a producer manifest binding emitted reading kind → rung, producer symbol, abstention
  rate, discrimination, and typed consumers; what it lets us refuse.
- **D544** — the tactical family is the real coverage gap (a chess.com-class review ships 4 motifs
  and 0 structural facts); ranks 1–8 of §7c are free arithmetic.
- **D545** — the negative reading: a lift below 1.0 is a signal with a sign, not a failure, and no
  measurement in this repo has been scored that way.
- **D546** — `irreversibility` misses `e1h1`-form castling: 2 of the corpus's 22, and 100% of
  PGN-imported games.
- **D547** — `pawn_count` is a declared kind that emits nothing; `phase_change` fires on 0.13%;
  `outpost` fired on 1.56% under the superseded predicate and 0% after D566.
- **D548** — the LLM voice packet receives the placeholder kind-name sentence while the screen
  receives the parameterised one.

---

## 12. Limits

1. **No reader study.** Usefulness is bounded mechanically (lift, firing rate), never judged. R3's
   caveat applies unchanged: a mechanical bound is an upper bound on what a reader could find useful,
   not a measurement of what they do.
2. **The authored spine is the generous population.** R11 established that swapping to quiet
   alternatives or a Maia-weighted population shrinks every lift. The numbers here are ceilings.
3. **The candidate detectors in §7d are eight of the nineteen in §7c**, chosen for implementability
   in one pass. They are research implementations, not proposals for the shipped definitions —
   `bad_bishop`'s ≥4 threshold and `central_space`'s file range are chosen, not derived, and a
   shipped version would need a declared convention exactly as `outpost` has one.
4. **Family D/E/H of §4 are `[M]`-heavy by necessity.** No tool in this class documents pawn-
   structure or space detection, so "they do not detect it" rests on the absence of any published
   metric list containing it — strong for chess.com and Lichess whose full lists were read, weaker
   for DecodeChess whose site returns 403.
5. **No played run.** `human_divergence` firing, the voice-provider path, and everything downstream
   of a live opponent are absent.
6. **The castling artefact in §6b** was found rather than anticipated; other UCI-convention
   mismatches between the enumerated alternatives and the authored corpus may exist and would bias
   move-derived kinds in the same direction.
