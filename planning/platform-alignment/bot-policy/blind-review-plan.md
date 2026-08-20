# R11 blinded continuation review plan

**Status:** preregistered; generator is disposable research code; reviewers not yet recruited

**Authority:** platform-alignment R11 and `design/research/bot-policy.md` §7

## Question

Do mechanically distinct bot-policy layers produce 12-ply continuations that human reviewers find
coherent and plausible, without hiding strength movement or confusing presentation personality with
board behavior?

This is the residual H5/C5 arm. It does not validate marketing names such as “aggressive” or
“solid.” The retained mechanical trait is called `pawn_x4_guarded`, exactly what it does.

## Fixed starts

Use two current community-pack roots per material/phase stratum, all at target Elo 1800:

| Stratum | Pack roots |
|---|---|
| opening | `anti-caro-advance-early-c5`, `najdorf-english-attack-black` |
| middlegame | `carlsbad-minority-attack`, `dragon-yugoslav-race` |
| reduced material | `rook-4v3-same-side-hold`, `pawn-breakthrough-convert` |

These roots provide actual objectives and authored repertoires without crediting their draft
content as official. The line generator never authors a chess explanation.

## Arms

Each non-control policy plays White once and Black once against the production Maia sampler. The
raw-Maia control is generated once per start. The initial six-arm generation produced 66 branches;
the correction below removes one insufficiently exercised arm before review, leaving **54 candidate
branches**:

1. `production_maia` — the selected move returned by the shipped `human_common` path;
2. `guard_250` — reconstructed production distribution, refusing candidates more than 250 cp
   behind Stockfish's best legal move;
3. `pawn_x4_guarded` — the retained guard plus a four-times pawn-move weight;
4. `authored_repertoire_guarded` — while the history remains on the pack spine, weight only authored
   children and apply the same guard; off-spine or empty mass falls back visibly to `guard_250`;
5. `statistical_book_guarded` — for opening roots through absolute ply 24, use a frozen local book
   built from the official July 2026 Lichess rated-PGN prefix, restricted to rated blitz games and
   moving-player Elo 1800–2199, plus guard; outside that scope or on corpus miss, fall back visibly
   to `guard_250`;
6. `weakened_stockfish_control` — Stockfish with `UCI_LimitStrength=true`, Elo 1320 and 5,000 nodes.
   It is a negative control and must never be described as human-like.

Every branch is 12 plies unless the position becomes terminal. The production opponent and all
Maia-derived arms use the shipped target-Elo 1800, temperature 0.8, top-p 0.92 path. The API's
reported `seedHonored:false` is preserved; custom transforms use a deterministic digest draw so the
artifact itself is reproducible from its captured packets.

## Independent strength accounting

At every ply, Stockfish 18 at 50,000 nodes establishes the best legal root score and scores the
candidate set under the same root search. The selected-move loss is recorded privately in the key,
never shown to reviewers. Maia's own `scoreCp`/WDL is retained as model output but never substituted
for Stockfish loss.

The 250 cp guard is declared policy information. A later product must disclose and calibrate such an
oracle; this experiment does not authorize it.

## Blind package

Reviewers receive only:

- randomized blind IDs and PGNs with generic player names;
- the start objective summary;
- a scorecard requesting overall acceptability, plan continuity, tactical sanity, objective
  relevance, repetition, human plausibility and the first breaking ply.

They do not receive arm, controlled color, engine identity, strength loss, trait counts, avatar,
chat, biography or policy label. The separate key records every selection trace, fallback, source
identity and output digest.

## Review population and exit

Recruit at least **five reviewers**, including at least two coaches or players rated 1800+. Each
branch needs at least three independent reviews. Presentation order is separately shuffled per
reviewer.

A branch is acceptable only when the reviewer marks overall acceptable and assigns at least 3/5 to
plan continuity, tactical sanity and human plausibility. C5 clears only if:

- at least **80%** of branches for a candidate arm are acceptable;
- neither controlled-color cut is below 70%;
- no phase/material stratum is below 70%;
- median tactical sanity is at least 4/5;
- measured mean Stockfish loss changes by no more than 35 cp from production Maia and ≥250 cp loss
  frequency rises by no more than one percentage point.

The weakened-Stockfish control is not eligible to clear. Failure is a result: the corresponding
policy layer is refused or narrowed. Do not pool arms into one “personality” pass.

## Negative controls and aborts

- Duplicate PGNs under different blind IDs fail the generator.
- Illegal moves, missing engine identity, unrecorded fallback, mismatched PGN/UCI replay or a
  candidate scored from the wrong side abort the whole set.
- A book-build/source failure aborts generation. A missing position or out-of-scope ply is recorded
  per move before the arm falls back to the declared guard; it may not silently become Maia.
- If more than 25% of an arm's controlled plies use fallback, the arm is “insufficiently exercised”
  regardless of reviewer scores.
- Reviewers who open the key before finishing are excluded and their assignments are rerun.

The generated packet is evidence for R11 only. It does not open F8 without O8 and the protected
intent amendment.

Every digest binds content, not only filenames: the packet digest includes the exact PGN bytes for
all included blind IDs, while the full-set and private-key digests bind their separate populations.

## Instrument correction after the first generation

The first 66-branch package is excluded from review. Its failure facts and digests are retained in
this plan; the redundant generated files need not be a second review artifact.

- The live Lichess explorer returned HTTP 401 on every request. Because the generator initially
  collapsed HTTP status into `null`, `statistical_book_guarded` silently fell back on **72/72
  controlled plies**. The replacement book is derived from the already frozen official Lichess PGN
  prefix and records its source digest. A fast 86 MB instrument check found 106 games reaching the
  fixed roots / 618 positions. The final full-prefix pass parsed 2,519,503 eligible games, found
  19,214 reaching a fixed root and retained 58,147 rooted positions.
- `authored_repertoire_guarded` fell back on **57/72 controlled plies (79.2%)**, breaching the
  predeclared 25% ceiling. This is a product finding, not a generator problem: a narrow drill spine
  ceases to be a repertoire as soon as the production opponent deviates. The arm is refused from
  human review rather than regenerated with both sides forced down authored content.
- The remaining arms and thresholds were not changed after reading any reviewer result; no human
  review had begun.

The full-prefix book did **not** rescue `statistical_book_guarded`: it fell back on **57/72
controlled plies (79.2%)**, again above the fixed 25% ceiling. The generated arm is retained in the
private key as the failed exercise but excluded from the review packet. The result distinguishes
"we have too few games" from the actual problem: a root-conditioned, ply-24 book is not a general
continuation policy once one side deviates. The final packet therefore has **42 branches**: raw
Maia, `guard_250`, `pawn_x4_guarded`, and the weakened-Stockfish negative control.
