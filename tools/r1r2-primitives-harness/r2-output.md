# R2 raw output — 593 spine transitions, 35 packs

## A. Recall against author-declared arrival squares

| Pack | Node | Move | Role | Author's named target(s) | Empty-board graph distance | Delta | Direction |
|---|---|---|---|---|---|---|---|
| anti-french-advance-white | nbd2-reroute | Nbd2 (b1d2) | knight | {f1,g3} | 2 → 1 | **fires** | advancing |
| anti-kid-classical-white | p17-ne1 | Ne1 (f3e1) | knight | {d3} | 2 → 1 | **fires** | backward |
| anti-kid-classical-white | p16-ne7 | Ne7 (c6e7) | knight | {g6,f5} | 2 → 1 | **fires** | backward |
| kid-classical-black | p16-ne7 | Ne7 (c6e7) | knight | {g6} | 2 → 1 | **fires** | backward |
| carlsbad-minority-attack | nf8-regroup | Nf8 (d7f8) | knight | {e6,g6} | 2 → 1 | **fires** | backward |
| carlsbad-minority-attack | ng3-kingside | Ng3 (e2g3) | knight | {f5} | 2 → 1 | **fires** | advancing |
| french-advance-black | nh6-knight | Nh6 (g8h6) | knight | {f5} | 2 → 1 | **fires** | advancing |
| italian-center-attack-white | p15-nbxd2 | Nbxd2 (b1d2) | knight | {b3,f1} | 2 → 1 | **fires** | advancing |
| mate-two-bishops | w-bb1 | Bb1 (g6b1) | bishop | {a2} | 2 → 1 | **fires** | backward |
| mate-bishop-knight | p23-nf5 | Nf5 (e7f5) | knight | {d6,e7,g7} | 0 → 1 | away | backward |
| trajectory-mate-bishop-knight | p23-nf5 | Nf5 (e7f5) | knight | {d6,e7,g7} | 0 → 1 | away | backward |

Recall: **9/11** author-declared repositions register a strictly reduced graph distance to the author's own named square set.

## A2. Author-labeled retreats/reroutes that name NO arrival square

| Pack | Node | Author's stated reason | Primitive that would carry it |
|---|---|---|---|
| mate-bishop-knight | p23-nf5 | attack_set — "From f5 it covers d6, e7 and g7 - the squares behind the king's line of retreat" | attacks created (P1) |
| trajectory-mate-bishop-knight | p23-nf5 | attack_set — "From f5 it covers d6, e7 and g7" | attacks created (P1) |
| anti-sicilian-najdorf-english-attack | p13-nb3 | vacation — "The retreat that keeps f3 available for the pawn. From b3 the knight eyes a5 and c5" | vacationReading (square freed for another piece) |
| najdorf-english-attack-black | p13-nb3 | vacation — "The main retreat, keeping f3 free for the pawn." | vacationReading (square freed for another piece) |
| caro-kann-advance-black | bg6-retreat | safety — "Step back and let the pawns overextend. On g6 the bishop still watches the b1-h7 diagonal" | escape/safety census (P5) |
| carlsbad-minority-attack | bh4-retreat | safety — "Keeping the bishop is the consistent choice" | escape/safety census (P5) |
| kid-classical-black | p14-nc6 | unspecified — "When it comes, the knight re-routes to e7" | none — no arrival named |
| leningrad-dutch-black | nc6-matulovic | unspecified — "after which it reroutes and the closed centre gives you the classic kingside clamp" | none — no arrival named |

## B. Autonomous firing rate (target set computed, not authored)

Target set = squares no enemy pawn can ever attack (shipped `pawn_safe_square` arithmetic),
restricted to the enemy half, minus squares the mover's own pieces occupy.

- All transitions: **228/593 = 38.4%** fire ("this move reduces distance to a good square").
- Quiet piece moves (non-pawn, non-capture, non-check): **185/373 = 49.6%**.
- Quiet, non-developing (piece not on its game-start square), backward or lateral only: **48/165 = 29.1%**.
- Naive centre target set, all transitions: **122/593 = 20.6%**.

Author-declared arrival repositions among the firings: **3** of 228.
Precision against the authored label set: **1.3%** — false-positive rate **98.7%**.
Restricted to the sharpest filter (quiet, non-developing, backward/lateral): precision **0.0%**, false-positive rate **100.0%**.

## C. Distribution of the distance delta over quiet piece moves

| delta (squares closer) | count |
|---|---|
| +1 | 185 |
| 0 | 164 |
| -1 | 24 |

## D. Base rates

- Backward or lateral non-pawn moves in the corpus: 223/593 = 37.6%
- Quiet piece moves: 373/593 = 62.9%
- Quiet, non-developing, backward/lateral: 165/593 = 27.8%
- Corpus-wide author-labeled repositions with a named arrival square: 9

## E. Sample of the firings on quiet, non-developing, backward/lateral moves

| Pack | Node | Move | delta | author-labeled? |
|---|---|---|---|---|
| lucena-bridge-convert | w-kc7 | Kc7 | +1 | no |
| lucena-bridge-convert | w-kb6 | Kb6 | +1 | no |
| lucena-bridge-convert | w-kc6 | Kc6 | +1 | no |
| lucena-bridge-convert | w-kb5 | Kb5 | +1 | no |
| mate-bishop-knight | p15-kd6 | Kd6 | +1 | no |
| mate-bishop-knight | p17-ke6 | Ke6 | +1 | no |
| mate-bishop-knight | p23-nf5 | Nf5 | +1 | attack_set |
| mate-bishop-knight | p27-kf6 | Kf6 | +1 | no |
| mate-bishop-knight | p29-kg6 | Kg6 | +1 | no |
| mate-bishop-knight | p33-be7 | Be7 | +1 | no |
| mate-bishop-knight | p35-nf5 | Nf5 | +1 | no |
| mate-k-q-technique | w-qd7 | Qd7 | +1 | no |
| mate-k-q-technique | w-qe7 | Qe7 | +1 | no |
| mate-k-r-technique | w-ra6 | Ra6 | +1 | no |
| mate-k-r-technique | w-ke6 | Ke6 | +1 | no |
| mate-k-r-technique | w-kf6 | Kf6 | +1 | no |
| mate-k-r-technique | w-kg6 | Kg6 | +1 | no |
| mate-two-bishops | w-ke6 | Ke6 | +1 | no |
| mate-two-bishops | w-kf6 | Kf6 | +1 | no |
| mate-two-bishops | w-kg6 | Kg6 | +1 | no |
| pawn-opposition-convert | w-ke5 | Ke5 | +1 | no |
| pawn-opposition-convert | w-ke6 | Ke6 | +1 | no |
| pawn-opposition-convert | w-kf6-2 | Kf6 | +1 | no |
| pawn-opposition-convert | w-ke6-2 | Ke6 | +1 | no |
| philidor-passive-rook-convert | w-kd5 | Kd5 | +1 | no |
| philidor-third-rank-hold | w-kd5 | Kd5 | +1 | no |
| philidor-third-rank-hold | w-ke5 | Ke5 | +1 | no |
| queen-vs-pawn-seventh-convert | b-kd1 | Kd1 | +1 | no |
| queen-vs-pawn-seventh-convert | b-kc1 | Kc1 | +1 | no |
| queen-vs-pawn-seventh-convert | b-kb1 | Kb1 | +1 | no |
| queen-vs-pawn-seventh-convert | w-kg6 | Kg6 | +1 | no |
| queen-vs-pawn-seventh-convert | b-ka2 | Ka2 | +1 | no |
| queen-vs-pawn-seventh-convert | b-kb1-2 | Kb1 | +1 | no |
| queen-vs-pawn-seventh-convert | w-kf5 | Kf5 | +1 | no |
| queen-vs-pawn-seventh-convert | b-kc1-2 | Kc1 | +1 | no |
| queen-vs-pawn-seventh-convert | b-kd1-2 | Kd1 | +1 | no |
| queen-vs-pawn-seventh-convert | b-kc1-3 | Kc1 | +1 | no |
| rook-4v3-same-side-hold | w-ra7 | Ra7 | +1 | no |
| rook-4v3-same-side-hold | b-rd4 | Rd4 | +1 | no |
| trajectory-mate-bishop-knight | p15-kd6 | Kd6 | +1 | no |

## F. Discriminating power — legal alternatives that also reduce distance to the SAME authored target

| Pack | Node | Move played | Author's target | Same piece's own moves that also close | All legal moves that close |
|---|---|---|---|---|---|
| anti-french-advance-white | nbd2-reroute | Nbd2 | {f1,g3} | 1/1 | 3/30 |
| anti-kid-classical-white | p17-ne1 | Ne1 | {d3} | 2/6 | 5/34 |
| anti-kid-classical-white | p16-ne7 | Ne7 | {g6,f5} | 2/5 | 11/31 |
| kid-classical-black | p16-ne7 | Ne7 | {g6} | 1/5 | 7/31 |
| carlsbad-minority-attack | nf8-regroup | Nf8 | {e6,g6} | 3/5 | 7/28 |
| carlsbad-minority-attack | ng3-kingside | Ng3 | {f5} | 1/3 | 6/46 |
| french-advance-black | nh6-knight | Nh6 | {f5} | 2/3 | 8/35 |
| italian-center-attack-white | p15-nbxd2 | Nbxd2 | {b3,f1} | 1/1 | 3/6 |
| mate-two-bishops | w-bb1 | Bb1 | {a2} | 2/9 | 4/25 |

Mean share of the moved piece's own legal moves that also reduce distance to the authored target: **52.8%**.
Mean share of ALL legal moves in the position that reduce distance to the authored target: **23.3%**.

## G. Autonomous firing rate by role and by phase

| Role | fires / moves | rate |
|---|---|---|
| king | 71/180 | 39.4% |
| knight | 70/97 | 72.2% |
| bishop | 48/80 | 60.0% |
| rook | 33/59 | 55.9% |
| queen | 6/32 | 18.8% |
| pawn | 0/145 | 0.0% |

| Pack phase | fires / moves | rate |
|---|---|---|
| opening | 65/198 | 32.8% |
| middlegame | 5/15 | 33.3% |
| endgame | 120/259 | 46.3% |
| cross_phase | 38/121 | 31.4% |
