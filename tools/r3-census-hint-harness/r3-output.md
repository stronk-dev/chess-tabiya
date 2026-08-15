# R3 raw output — 634 spine transitions, 37 committed packs

Corpus: `content/drafts/`, 37 packs, 634 transitions, 15989 legal alternatives enumerated across the same 634 parent positions (14980 of them quiet).

## 1. By-product — R1's (attacker,target) pair keying, re-run on this corpus

| R1 primitive | R1 published (35 packs, 593 tr) | this corpus, same keying |
|---|---|---|
| P1 attacks created/removed | 50.6% | 51.3% |
| P2 defences created/removed | 74.9% | 76.5% |
| P3 lines opened/closed | 52.6% | 55.0% |
| P5 escape squares removed (opposite-of-mover only) | 61.2% | 60.6% |
| P6 duty acquired | 6.7% | 6.9% |
| P8b irreversibility | 13.2% | 13.4% |
| P8a clock zeroed | 13.8% | 14.0% |

## 2. Corrected firing rates — target-keyed, colour-keyed, both-occupied (RFC §2.3/§2.4)

| Leaf | any direction, any colour | per direction | R1 published upper bound |
|---|---|---|---|
| `attacked_squares_changed` | **37.5%** | gained 31.5%, lost 12.1% | 50.6% |
| `defended_squares_changed` | **34.1%** | gained 17.0%, lost 20.7% | 74.9% |
| `slider_lines_changed` | **54.1%** | opened 46.5%, closed 30.1% | 52.6% |
| `escape_squares_changed` | **94.0%** | lost 80.8%, gained 81.1% | 61.2% |
| `defended_duties_changed` | **12.1%** | acquired 6.6%, released 6.2% | 6.7% |
| `move_irreversibility` | **24.6%** | fired 24.6% | 13.2% |

Exactly-comparable escape figure (R1's P5 shape — `lost` only, non-mover colour only): **60.6%** against R1's 61.2% / this corpus's uncorrected 60.6%.

## 3. Signal — the T/C witness classification

T (remote) = the fact concerns a piece other than the one that moved. C (consequential) = it names something contested under the rules alone. SIGNAL = at least one witness that is both.

| Leaf:direction | fires | ≥1 T1 | ≥1 T0 | ≥1 C | **SIGNAL (T1∧C)** | SIGNAL (T0∧C) | **FP rate of the firing (T1)** | FP rate (T0) | witnesses/firing | signal witnesses/firing |
|---|---|---|---|---|---|---|---|---|---|---|
| `attacked_squares_changed:gained` | 31.5% | 3.8% | 3.8% | 13.6% | **0.9%** | 0.9% | **97.0%** | 97.0% | 1.21 | 0.04 |
| `attacked_squares_changed:lost` | 12.1% | 12.1% | 3.0% | 1.3% | **1.3%** | 0.2% | **89.6%** | 98.7% | 1.22 | 0.12 |
| `defended_squares_changed:gained` | 17.0% | 2.5% | 2.5% | 3.3% | **0.3%** | 0.3% | **98.1%** | 98.1% | 1.11 | 0.02 |
| `defended_squares_changed:lost` | 20.7% | 20.7% | 0.3% | 1.1% | **1.1%** | 0.0% | **94.7%** | 100.0% | 1.11 | 0.07 |
| `slider_lines_changed:opened` | 46.5% | 46.5% | 46.5% | 21.3% | **21.3%** | 21.3% | **54.2%** | 54.2% | 2.02 | 0.52 |
| `slider_lines_changed:closed` | 30.1% | 30.1% | 30.1% | 15.0% | **15.0%** | 15.0% | **50.3%** | 50.3% | 1.49 | 0.52 |
| `escape_squares_changed:lost` | 80.8% | 17.4% | 17.4% | 15.9% | **2.5%** | 2.5% | **96.9%** | 96.9% | 2.08 | 0.04 |
| `escape_squares_changed:gained` | 81.1% | 81.1% | 81.1% | 11.2% | **11.2%** | 11.2% | **86.2%** | 86.2% | 2.19 | 0.15 |
| `defended_duties_changed:acquired` | 6.6% | 4.6% | 4.6% | 3.3% | **2.1%** | 2.1% | **69.0%** | 69.0% | 1.05 | 0.31 |
| `defended_duties_changed:released` | 6.2% | 6.2% | 6.2% | 3.8% | **3.8%** | 3.8% | **38.5%** | 38.5% | 1.00 | 0.62 |
| `move_irreversibility:fired` | 24.6% | 2.7% | 2.7% | 24.6% | **2.7%** | 2.7% | **89.1%** | 89.1% | 1.00 | 0.11 |

| Leaf (any direction) | fires | SIGNAL (T1∧C) | FP rate (T1) | SIGNAL (T0∧C) | FP rate (T0) |
|---|---|---|---|---|---|
| `attacked_squares_changed` | 37.5% | **2.2%** | **94.1%** | 1.1% | 97.1% |
| `defended_squares_changed` | 34.1% | **1.4%** | **95.8%** | 0.3% | 99.1% |
| `slider_lines_changed` | 54.1% | **31.5%** | **41.7%** | 31.5% | 41.7% |
| `escape_squares_changed` | 94.0% | **13.1%** | **86.1%** | 13.1% | 86.1% |
| `defended_duties_changed` | 12.1% | **5.7%** | **53.2%** | 5.7% | 53.2% |
| `move_irreversibility` | 24.6% | **2.7%** | **89.1%** | 2.7% | 89.1% |

### Is the RFC's selectivity proxy valid? (does a low firing rate predict a low FP rate?)

| Leaf | firing rate | FP rate (T1) | signal rate |
|---|---|---|---|
| `attacked_squares_changed` | 37.5% | 94.1% | 2.2% |
| `defended_squares_changed` | 34.1% | 95.8% | 1.4% |
| `slider_lines_changed` | 54.1% | 41.7% | 31.5% |
| `escape_squares_changed` | 94.0% | 86.1% | 13.1% |
| `defended_duties_changed` | 12.1% | 53.2% | 5.7% |
| `move_irreversibility` | 24.6% | 89.1% | 2.7% |

Spearman ρ(firing rate, FP rate) over the six leaves = **-0.143** (a valid proxy would be strongly positive).
Spearman ρ(firing rate, signal rate) = **0.429**.

Whole-census aggregate: at least one leaf fires on 96.8% of transitions; at least one leaf signals on 43.4%.
On-request reading volume: **6.18 observations per ply**, of which **0.68** are T∧C.

## 4. Axis D — discrimination against the mover's own legal alternatives

Read: given that the played move signalled, what share of the SAME position's other legal moves would also have signalled? High = the hint describes the position, not the move (the R2 failure shape).

| Leaf:direction | n signalling | mean share of alternatives that also FIRE | mean share that also SIGNAL | mean share of QUIET alternatives that signal | corpus-wide signal rate over all alternatives |
|---|---|---|---|---|---|
| `attacked_squares_changed:gained` | 6 | 54.4% | **22.5%** | 22.1% | 0.6% |
| `attacked_squares_changed:lost` | 8 | 22.2% | **18.1%** | 10.2% | 0.7% |
| `defended_squares_changed:gained` | 2 | 37.1% | **5.7%** | 6.1% | 0.1% |
| `defended_squares_changed:lost` | 7 | 43.0% | **8.7%** | 5.6% | 3.9% |
| `slider_lines_changed:opened` | 135 | 63.6% | **32.5%** | 32.6% | 19.8% |
| `slider_lines_changed:closed` | 95 | 58.8% | **30.8%** | 32.0% | 22.6% |
| `escape_squares_changed:lost` | 16 | 86.9% | **12.2%** | 11.2% | 2.1% |
| `escape_squares_changed:gained` | 71 | 85.2% | **37.3%** | 32.7% | 22.0% |
| `defended_duties_changed:acquired` | 13 | 23.8% | **18.6%** | 16.0% | 4.0% |
| `defended_duties_changed:released` | 24 | 31.9% | **30.5%** | 27.8% | 2.1% |
| `move_irreversibility:fired` | 17 | 21.4% | **9.9%** | 0.0% | 0.2% |

### Control — the same leaves over every legal alternative in every spine position

| Leaf:direction | fires on alternatives | signals on alternatives | signals on QUIET alternatives |
|---|---|---|---|
| `attacked_squares_changed:gained` | 32.5% | 0.6% | 0.6% |
| `attacked_squares_changed:lost` | 13.8% | 0.7% | 0.7% |
| `defended_squares_changed:gained` | 16.0% | 0.1% | 0.1% |
| `defended_squares_changed:lost` | 27.8% | 3.9% | 3.7% |
| `slider_lines_changed:opened` | 52.3% | 19.8% | 20.3% |
| `slider_lines_changed:closed` | 49.1% | 22.6% | 24.0% |
| `escape_squares_changed:lost` | 74.6% | 2.1% | 2.1% |
| `escape_squares_changed:gained` | 86.2% | 22.0% | 19.4% |
| `defended_duties_changed:acquired` | 9.4% | 4.0% | 3.4% |
| `defended_duties_changed:released` | 4.1% | 2.1% | 1.7% |
| `move_irreversibility:fired` | 17.4% | 0.2% | 0.0% |

### Lift — does the PLAYED (authored) move signal more often than an arbitrary legal move?

| Leaf:direction | signal rate, played spine moves (n=634) | signal rate, all legal alternatives (n=15989) | signal rate, quiet alternatives (n=14980) | lift vs quiet |
|---|---|---|---|---|
| `attacked_squares_changed:gained` | 0.9% | 0.6% | 0.6% | **1.54×** |
| `attacked_squares_changed:lost` | 1.3% | 0.7% | 0.7% | **1.89×** |
| `defended_squares_changed:gained` | 0.3% | 0.1% | 0.1% | **3.15×** |
| `defended_squares_changed:lost` | 1.1% | 3.9% | 3.7% | **0.30×** |
| `slider_lines_changed:opened` | 21.3% | 19.8% | 20.3% | **1.05×** |
| `slider_lines_changed:closed` | 15.0% | 22.6% | 24.0% | **0.62×** |
| `escape_squares_changed:lost` | 2.5% | 2.1% | 2.1% | **1.19×** |
| `escape_squares_changed:gained` | 11.2% | 22.0% | 19.4% | **0.58×** |
| `defended_duties_changed:acquired` | 2.1% | 4.0% | 3.4% | **0.61×** |
| `defended_duties_changed:released` | 3.8% | 2.1% | 1.7% | **2.19×** |
| `move_irreversibility:fired` | 2.7% | 0.2% | 0.0% | **—** |

## 5. The live-tier candidate — `defended_duties_changed(acquired)`, decomposed

- witnesses total: **44** over 42 firing transitions
- of the mover's own colour: 16 (36.4%); of the opponent's: 28 (63.6%)
- passes T (new ward not merely a square the move itself touched): 31 (70.5%); fails T: 13
- passes C (sole defender of ≥1 ward): 21 (47.7%)
- passes both: **13 (29.5%)**

## 6. Phase split of the signal

| Leaf | opening (n=236) | middlegame (n=18) | endgame (n=259) | cross_phase (n=121) |
|---|---|---|---|---|
| `attacked_squares_changed` | 1.7% | 5.6% | 1.5% | 4.1% |
| `defended_squares_changed` | 0.8% | 5.6% | 0.4% | 4.1% |
| `slider_lines_changed` | 43.6% | 55.6% | 11.6% | 47.1% |
| `escape_squares_changed` | 9.7% | 38.9% | 11.2% | 19.8% |
| `defended_duties_changed` | 7.2% | 22.2% | 0.0% | 12.4% |
| `move_irreversibility` | 0.0% | 0.0% | 1.2% | 11.6% |

## 7. Worked examples

### `attacked_squares_changed:gained`

**Signalling (T∧C):**
- **anti-caro-advance-early-c5 ply 6 e6 (e7e6)** — black now attacks the white pawn on c5
  - FEN before: `r2qkbnr/pp2pppp/2n5/2PpP3/6b1/2P2N2/PP3PPP/RNBQKB1R b KQkq - 0 6`
  - author: "Black finally bids for the pawn with the bishop's diagonal. One move too late, if the next move stands."
- **anti-caro-advance-early-c5 ply 2 e6 (e7e6)** — black now attacks the white pawn on c5
  - FEN before: `rnbqkbnr/pp2pppp/8/2PpP3/8/8/PPP2PPP/RNBQKBNR b KQkq - 0 4`
  - author: "The direct regain: the f8 bishop will take on c5. This is the moment to decide which plan you are in — the checkpoint above this line asked you, and t"
- **carlsbad-minority-attack ply 3 Ne4 (f6e4)** — black now attacks the white bishop on g5
  - FEN before: `r1bqrnk1/pp2bppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/1R3RK1 b - - 9 11`
  - author: "Black's standard answer. Trading pieces makes the queenside easier to defend, because the minority attack creates a weakness that then has to be attac"
- **philidor-passive-rook-convert ply 2 Ke7 (e8e7)** — white now attacks the black rook on h8
  - FEN before: `R3k2r/8/8/4K3/4P3/8/8/8 b - - 2 2`

**Non-signalling (the false positives):**
- **anti-caro-advance-early-c5 ply 1 dxc5 (d4c5)** — white now attacks the black pawn on d5 — fails C
  - FEN before: `rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4`
- **anti-caro-advance-early-c5 ply 2 Nc6 (b8c6)** — black now attacks the white pawn on e5 — fails T
  - FEN before: `rnbqkbnr/pp2pppp/8/2PpP3/8/8/PPP2PPP/RNBQKBNR b KQkq - 0 4`
- **anti-caro-advance-early-c5 ply 4 Bg4 (c8g4)** — black now attacks the white knight on f3 — fails T+C
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/5N2/PPP2PPP/RNBQKB1R b KQkq - 2 5`
- **anti-caro-advance-c5-race ply 1 Bf5 (c8f5)** — black now attacks the white pawn on c2 — fails T+C
  - FEN before: `rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3`

### `attacked_squares_changed:lost`

**Signalling (T∧C):**
- **anti-italian-center-attack-black ply 5 exd4 (e5d4)** — white no longer attacks the black bishop on c5
  - FEN before: `r1bqk2r/pppp1ppp/2n2n2/2b1p3/2BPP3/2P2N2/PP3PPP/RNBQK2R b KQkq - 0 5`
  - author: "Take without regret: declining with ...Bb6 lets d4-d5 come with tempo on your c6 knight — a machine-walked consequence, classified below."
- **italian-center-attack-white ply 4 exd4 (e5d4)** — white no longer attacks the black bishop on c5
  - FEN before: `r1bqk2r/pppp1ppp/2n2n2/2b1p3/2BPP3/2P2N2/PP3PPP/RNBQK2R b KQkq - 0 5`
- **lucena-bridge-convert ply 13 Rb4 (d4b4)** — black no longer attacks the white king on b5
  - FEN before: `8/1P2k3/8/1K6/3R4/8/8/1r6 w - - 12 7`
  - author: "The bridge. The rook drops in front of its king, the checks are over, and b8=Q cannot be prevented. From here the tablebase calls every Black move los"
- **pawn-breakthrough-convert ply 3 b6 (b5b6)** — white no longer attacks the black pawn on c6
  - FEN before: `8/p7/2p1k3/PP6/8/8/6K1/8 w - - 0 2`
  - author: "The second sacrifice, offered before Black's structure can settle. Declining fails too: the tablebase confirms every Black reply here loses."

**Non-signalling (the false positives):**
- **anti-dutch-leningrad-white ply 7 Nf3 (g1f3)** — white no longer attacks the black pawn on b7 — fails C
  - FEN before: `rnbqk2r/ppppp1bp/5np1/5p2/2PP4/6P1/PP2PPBP/RNBQK1NR w KQkq - 2 5`
- **anti-italian-center-attack-black ply 4 d4 (d2d4)** — black no longer attacks the white pawn on f2 — fails C
  - FEN before: `r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R w KQkq - 1 5`
- **anti-italian-center-attack-black ply 8 Bd2 (c1d2)** — black no longer attacks the white king on e1 — fails C
  - FEN before: `r1bqk2r/pppp1ppp/2n2n2/8/1bBPP3/5N2/PP3PPP/RNBQK2R w KQkq - 1 7`
- **anti-italian-center-attack-black ply 10 Nbxd2 (b1d2)** — black no longer attacks the white king on e1 — fails C
  - FEN before: `r1bqk2r/pppp1ppp/2n2n2/8/2BPP3/5N2/PP1b1PPP/RN1QK2R w KQkq - 0 8`

### `defended_squares_changed:gained`

**Signalling (T∧C):**
- **anti-london-black ply 5 e6 (e7e6)** — the black pawn on c5 is now defended
  - FEN before: `r1bqkb1r/pp2pppp/2n2n2/2pp4/3P1B2/4PN2/PPPN1PPP/R2QKB1R b KQkq - 2 5`
  - author: "The counter-pyramid, with its cost stated honestly: your c8 bishop is now the worst piece on the board, and the third plan class exists to fix that."
- **london-system-white ply 4 e6 (e7e6)** — the black pawn on c5 is now defended
  - FEN before: `r1bqkb1r/pp2pppp/2n2n2/2pp4/3P1B2/4PN2/PPPN1PPP/R2QKB1R b KQkq - 2 5`
  - author: "Black builds the mirror pyramid — and locks the c8 bishop behind it. Your bishop is outside its chain; theirs is not. That asymmetry is the London's e"

**Non-signalling (the false positives):**
- **anti-caro-advance-early-c5 ply 3 Nf3 (g1f3)** — the white pawn on e5 is now defended — fails T
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/8/PPP2PPP/RNBQKBNR w KQkq - 1 5`
- **anti-caro-advance-early-c5 ply 4 Bg4 (c8g4)** — the black rook on a8 is now defended — fails C
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/5N2/PPP2PPP/RNBQKB1R b KQkq - 2 5`
- **anti-caro-advance-early-c5 ply 7 b4 (b2b4)** — the white pawn on c5 is now defended — fails T
  - FEN before: `r2qkbnr/pp3ppp/2n1p3/2PpP3/6b1/2P2N2/PP3PPP/RNBQKB1R w KQkq - 0 7`
- **anti-caro-advance-early-c5 ply 3 Be3 (c1e3)** — the white pawn on c5 is now defended — fails T
  - FEN before: `rnbqkbnr/pp3ppp/4p3/2PpP3/8/8/PPP2PPP/RNBQKBNR w KQkq - 0 5`

### `defended_squares_changed:lost`

**Signalling (T∧C):**
- **carlsbad-minority-attack ply 10 bxc6 (b5c6)** — the black pawn on d5 is no longer defended
  - FEN before: `r1b1rnk1/1p2qpp1/p1p4p/1P1p4/3Pn3/2NBP3/P1Q1NPPP/1R3RK1 w - - 0 15`
- **conversion-up-a-piece ply 1 Rxd8+ (d1d8)** — the black king on e8 is no longer defended
  - FEN before: `3rk3/pp3ppp/4p3/8/8/2N1P3/PP3PPP/3RK3 w - - 0 1`
  - author: "Accept. The rooks are each other's mirror — while both stand, their rook makes threats yours must answer; when both are gone, your knight is the only "
- **trajectory-caro-advance-chain-bishops ply 36 Qxb3 (b6b3)** — the white pawn on a2 is no longer defended
  - FEN before: `r1r3k1/pp2bppp/1q2p3/3pP3/3P4/1Q2B1P1/PP3PP1/1R3RK1 b - - 0 18`
  - author: "Queens off, on Black's terms: the recapture saddles White with doubled b-pawns and opens the a-file. The defender-trades logic of every closed-chain m"
- **trajectory-caro-advance-chain-bishops ply 41 Rxc7 (c1c7)** — the black pawn on b7 is no longer defended
  - FEN before: `2r3k1/ppr1bppp/4p3/3pP3/3P4/1P2B1P1/1P3PP1/1RR3K1 w - - 3 21`

**Non-signalling (the false positives):**
- **anti-caro-advance-early-c5 ply 1 dxc5 (d4c5)** — the white pawn on e5 is no longer defended — fails C
  - FEN before: `rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4`
- **anti-caro-advance-early-c5 ply 4 Bg4 (c8g4)** — the black pawn on b7 is no longer defended — fails C
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/5N2/PPP2PPP/RNBQKB1R b KQkq - 2 5`
- **anti-caro-advance-early-c5 ply 3 Be3 (c1e3)** — the white pawn on b2 is no longer defended — fails C
  - FEN before: `rnbqkbnr/pp3ppp/4p3/2PpP3/8/8/PPP2PPP/RNBQKBNR w KQkq - 0 5`
- **anti-caro-advance-early-c5 ply 3 Nxd4 (f3d4)** — the white pawn on e5 is no longer defended — fails C
  - FEN before: `rnbqkbnr/pp2pppp/8/3pP3/3p4/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 5`

### `slider_lines_changed:opened`

**Signalling (T∧C):**
- **anti-caro-advance-early-c5 ply 4 Bg4 (c8g4)** — the black queen on d8 opened its line toward a8 (1→0 blockers)
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/5N2/PPP2PPP/RNBQKB1R b KQkq - 2 5`
  - author: "Black's bishop finally moves — to pin the knight rather than to blockade. The pressure is real but it is aimed at your development, not at the c5 pawn"
- **anti-caro-advance-early-c5 ply 5 c3 (c2c3)** — the white queen on d1 opened its line toward a4 (1→0 blockers)
  - FEN before: `r2qkbnr/pp2pppp/2n5/2PpP3/6b1/5N2/PPP2PPP/RNBQKB1R w KQkq - 3 6`
  - author: "The holding move: b4 is prepared, ...Qa5+ is blunted, and the b4/d4 squares are covered against the c6 knight. One pawn move that does three jobs is h"
- **anti-caro-advance-early-c5 ply 6 e6 (e7e6)** — the black queen on d8 opened its line toward h4 (1→0 blockers)
  - FEN before: `r2qkbnr/pp2pppp/2n5/2PpP3/6b1/2P2N2/PP3PPP/RNBQKB1R b KQkq - 0 6`
  - author: "Black finally bids for the pawn with the bishop's diagonal. One move too late, if the next move stands."
- **anti-caro-advance-early-c5 ply 7 b4 (b2b4)** — the white bishop on c1 opened its line toward a3 (1→0 blockers)
  - FEN before: `r2qkbnr/pp3ppp/2n1p3/2PpP3/6b1/2P2N2/PP3PPP/RNBQKB1R w KQkq - 0 7`
  - author: "The clamp: c5 is now a protected outpost pawn cramping Black's whole queenside, and ...Bxc5 no longer exists. What you owe in exchange is care over .."

**Non-signalling (the false positives):**
- **anti-caro-advance-early-c5 ply 1 dxc5 (d4c5)** — the white queen on d1 opened its line toward d8 (2→1 blockers) — fails C
  - FEN before: `rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4`
- **anti-caro-advance-early-c5 ply 2 Nc6 (b8c6)** — the black rook on a8 opened its line toward h8 (6→5 blockers) — fails C
  - FEN before: `rnbqkbnr/pp2pppp/8/2PpP3/8/8/PPP2PPP/RNBQKBNR b KQkq - 0 4`
- **anti-caro-advance-early-c5 ply 3 Nf3 (g1f3)** — the white rook on a1 opened its line toward h1 (6→5 blockers) — fails C
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/8/PPP2PPP/RNBQKBNR w KQkq - 1 5`
- **anti-caro-advance-early-c5 ply 3 Be3 (c1e3)** — the white rook on a1 opened its line toward h1 (6→5 blockers) — fails C
  - FEN before: `rnbqkbnr/pp3ppp/4p3/2PpP3/8/8/PPP2PPP/RNBQKBNR w KQkq - 0 5`

### `slider_lines_changed:closed`

**Signalling (T∧C):**
- **anti-caro-advance-early-c5 ply 3 Nf3 (g1f3)** — the white queen on d1 closed its line toward h5 (0→1 blockers)
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/8/PPP2PPP/RNBQKBNR w KQkq - 1 5`
  - author: "Develop toward the kingside first. The c5 pawn is not running away, and every White piece that appears makes ...Nxe5 tricks less available."
- **anti-caro-advance-early-c5 ply 6 e6 (e7e6)** — the black bishop on g4 closed its line toward c8 (0→1 blockers)
  - FEN before: `r2qkbnr/pp2pppp/2n5/2PpP3/6b1/2P2N2/PP3PPP/RNBQKB1R b KQkq - 0 6`
  - author: "Black finally bids for the pawn with the bishop's diagonal. One move too late, if the next move stands."
- **anti-caro-advance-early-c5 ply 2 e6 (e7e6)** — the black bishop on c8 closed its line toward h3 (0→1 blockers)
  - FEN before: `rnbqkbnr/pp2pppp/8/2PpP3/8/8/PPP2PPP/RNBQKBNR b KQkq - 0 4`
  - author: "The direct regain: the f8 bishop will take on c5. This is the moment to decide which plan you are in — the checkpoint above this line asked you, and t"
- **anti-caro-advance-early-c5 ply 1 Nf3 (g1f3)** — the white queen on d1 closed its line toward h5 (0→1 blockers)
  - FEN before: `rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4`
  - author: "Declining the pawn is playable — but see what Black gets for free: the break has already succeeded, and the tension is Black's to resolve."

**Non-signalling (the false positives):**
- **anti-caro-advance-early-c5 ply 4 Bg4 (c8g4)** — the white queen on d1 closed its line toward h5 (1→2 blockers) — fails C
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/5N2/PPP2PPP/RNBQKB1R b KQkq - 2 5`
- **anti-caro-advance-early-c5 ply 7 b4 (b2b4)** — the black bishop on f8 closed its line toward a3 (1→2 blockers) — fails C
  - FEN before: `r2qkbnr/pp3ppp/2n1p3/2PpP3/6b1/2P2N2/PP3PPP/RNBQKB1R w KQkq - 0 7`
- **anti-caro-advance-c5-race ply 4 Be2 (f1e2)** — the white queen on d1 closed its line toward h5 (1→2 blockers) — fails C
  - FEN before: `rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 5`
- **anti-caro-advance-c5-race ply 1 c5 (c6c5)** — the black bishop on f8 closed its line toward a3 (1→2 blockers) — fails C
  - FEN before: `rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3`

### `escape_squares_changed:lost`

**Signalling (T∧C):**
- **anti-caro-advance-early-c5 ply 6 e6 (e7e6)** — the white knight on f3 lost 2 uncontested destination(s) (4→2)
  - FEN before: `r2qkbnr/pp2pppp/2n5/2PpP3/6b1/2P2N2/PP3PPP/RNBQKB1R b KQkq - 0 6`
  - author: "Black finally bids for the pawn with the bishop's diagonal. One move too late, if the next move stands."
- **anti-london-black ply 2 e3 (e2e3)** — the black pawn on c5 lost 1 uncontested destination(s) (1→0)
  - FEN before: `rnbqkb1r/pp2pppp/5n2/2pp4/3P1B2/5N2/PPP1PPPP/RN1QKB1R w KQkq - 0 4`
  - author: "The moment the c1 bishop can never come home. Your sharpest sidestep lives here — ...Qb6, classified below — and the spine's slower road keeps the ten"
- **anti-london-black ply 5 e6 (e7e6)** — the white pawn on d4 lost 1 uncontested destination(s) (1→0)
  - FEN before: `r1bqkb1r/pp2pppp/2n2n2/2pp4/3P1B2/4PN2/PPPN1PPP/R2QKB1R b KQkq - 2 5`
  - author: "The counter-pyramid, with its cost stated honestly: your c8 bishop is now the worst piece on the board, and the third plan class exists to fix that."
- **anti-london-black ply 12 Ne5 (f3e5)** — the black pawn on h7 lost 1 uncontested destination(s) (2→1)
  - FEN before: `r1bq1rk1/p4ppp/1pnbpn2/2pp4/3P4/2PBPNB1/PP1N1PPP/R2QK2R w KQ - 0 9`
  - author: "The London's signature arrives — with its arithmetic: if ...Nxe5 dxe5, the pawn forks d6 and f6 (machine-walked geometry), so the knight is usually to"

**Non-signalling (the false positives):**
- **anti-caro-advance-early-c5 ply 1 dxc5 (d4c5)** — the black pawn on b7 lost 1 uncontested destination(s) (1→0) — fails T+C
  - FEN before: `rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4`
- **anti-caro-advance-early-c5 ply 2 Nc6 (b8c6)** — the white queen on d1 lost 1 uncontested destination(s) (6→5) — fails T+C
  - FEN before: `rnbqkbnr/pp2pppp/8/2PpP3/8/8/PPP2PPP/RNBQKBNR b KQkq - 0 4`
- **anti-caro-advance-early-c5 ply 3 Nf3 (g1f3)** — the white queen on d1 lost 2 uncontested destination(s) (5→3) — fails C
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/8/PPP2PPP/RNBQKBNR w KQkq - 1 5`
- **anti-caro-advance-early-c5 ply 5 c3 (c2c3)** — the white knight on b1 lost 1 uncontested destination(s) (3→2) — fails T+C
  - FEN before: `r2qkbnr/pp2pppp/2n5/2PpP3/6b1/5N2/PPP2PPP/RNBQKB1R w KQkq - 3 6`

### `escape_squares_changed:gained`

**Signalling (T∧C):**
- **anti-caro-advance-c5-race ply 1 c5 (c6c5)** — the white pawn on d4 gained 1 uncontested destination(s) (0→1)
  - FEN before: `rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3`
  - author: "Black strikes at once, before developing the bishop. Practically common below 2000 and a different problem: the grab is available."
- **anti-dutch-leningrad-white ply 13 d5 (d4d5)** — the black pawn on c6 gained 1 uncontested destination(s) (0→1)
  - FEN before: `rnbq1rk1/pp2p1bp/2pp1np1/5p2/2PP4/2N2NP1/PP2PPBP/R1BQ1RK1 w - - 0 8`
  - author: "The clamp: ...e5 now costs an en-passant-shaped concession or never comes, the g2 bishop's diagonal stays open through c6's newly created hole on d6, "
- **anti-dutch-leningrad-white ply 1 e4 (e2e4)** — the black pawn on f5 gained 1 uncontested destination(s) (0→1)
  - FEN before: `rnbqkbnr/ppppp1pp/8/5p2/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2`
  - author: "The Staunton Gambit: a pawn for open lines against the weakened king, played in 4.0% of games at your band. Sharp, respectable, and a memory battle — "
- **anti-italian-center-attack-black ply 6 cxd4 (c3d4)** — the black bishop on c5 gained 1 uncontested destination(s) (4→5)
  - FEN before: `r1bqk2r/pppp1ppp/2n2n2/2b5/2BpP3/2P2N2/PP3PPP/RNBQK2R w KQkq - 0 6`
  - author: "White has the big centre for one move — and YOUR decision arrives: the disciplined ...Bb4+ (the spine), the retreat ...Bb6, or the grab ...Nxe4. The c"

**Non-signalling (the false positives):**
- **anti-caro-advance-early-c5 ply 1 dxc5 (d4c5)** — the white queen on d1 gained 1 uncontested destination(s) (5→6) — fails C
  - FEN before: `rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4`
- **anti-caro-advance-early-c5 ply 2 Nc6 (b8c6)** — the black rook on a8 gained 1 uncontested destination(s) (0→1) — fails C
  - FEN before: `rnbqkbnr/pp2pppp/8/2PpP3/8/8/PPP2PPP/RNBQKBNR b KQkq - 0 4`
- **anti-caro-advance-early-c5 ply 3 Nf3 (g1f3)** — the white rook on h1 gained 1 uncontested destination(s) (0→1) — fails C
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/8/PPP2PPP/RNBQKBNR w KQkq - 1 5`
- **anti-caro-advance-early-c5 ply 4 Bg4 (c8g4)** — the black rook on a8 gained 1 uncontested destination(s) (1→2) — fails C
  - FEN before: `r1bqkbnr/pp2pppp/2n5/2PpP3/8/5N2/PPP2PPP/RNBQKB1R b KQkq - 2 5`

### `defended_duties_changed:acquired`

**Signalling (T∧C):**
- **anti-caro-advance-c5-race ply 5 c5 (c6c5)** — the white queen on d1 now defends 2 attacked white pieces
  - FEN before: `rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/5N2/PPP1BPPP/RNBQK2R b KQkq - 1 5`
  - author: "The thematic break. Black hits the base of the chain; every White plan in this pack is an answer to this move."
- **anti-italian-center-attack-black ply 11 d5 (d7d5)** — the white knight on d2 now defends 2 attacked white pieces
  - FEN before: `r1bqk2r/pppp1ppp/2n2n2/8/2BPP3/5N2/PP1N1PPP/R2QK2R b KQkq - 0 8`
  - author: "The freeing break at its one perfect beat: it attacks the c4 bishop, so White has no time to push past or build — the exchange is forced onto your ter"
- **anti-london-black ply 7 Bd6 (f8d6)** — the white pawn on e3 now defends 2 attacked white pieces
  - FEN before: `r1bqkb1r/pp3ppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R b KQkq - 0 6`
  - author: "Ask the system question: trade the London bishop or make it move again. Either answer costs White something — the trade costs the attack's engine, Bg3"
- **anti-scandinavian-white ply 13 Ne5 (f3e5)** — the white queen on d1 now defends 2 attacked white pieces
  - FEN before: `rn2kb1r/ppp1pppp/5nb1/q7/3P2P1/2N2N1P/PPP2P2/R1BQKB1R w KQkq - 1 8`
  - author: "The point of the whole sequence: with the bishop parked on g6 the knight takes the strong central square and the g-pawn is already past it. Past the a"

**Non-signalling (the false positives):**
- **anti-french-advance-white ply 8 b4 (b2b4)** — the white pawn on c3 now defends 2 attacked white pieces — fails T+C
  - FEN before: `r1b1kb1r/pp3ppp/1qn1p2n/2ppP3/3P4/P1P2N2/1P3PPP/RNBQKB1R w KQkq - 1 7`
- **anti-italian-center-attack-black ply 7 Bb4+ (c5b4)** — the white queen on d1 now defends 2 attacked white pieces — fails C
  - FEN before: `r1bqk2r/pppp1ppp/2n2n2/2b5/2BPP3/5N2/PP3PPP/RNBQK2R b KQkq - 0 6`
- **anti-kid-classical-white ply 7 d5 (d4d5)** — the white knight on c3 now defends 2 attacked white pieces — fails T
  - FEN before: `r1bq1rk1/ppp2pbp/2np1np1/4p3/2PPP3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 2 8`
- **anti-kid-classical-white ply 12 f5 (f7f5)** — the white knight on c3 now defends 2 attacked white pieces — fails C
  - FEN before: `r1bq1rk1/pppnnpbp/3p2p1/3Pp3/2P1P3/2N2P2/PP2B1PP/R1BQNRK1 b - - 0 10`

### `defended_duties_changed:released`

**Signalling (T∧C):**
- **anti-italian-center-attack-black ply 10 Nbxd2 (b1d2)** — the white knight on f3 no longer defends 2 attacked white pieces
  - FEN before: `r1bqk2r/pppp1ppp/2n2n2/8/2BPP3/5N2/PP1b1PPP/RN1QK2R w KQkq - 0 8`
- **anti-italian-center-attack-black ply 12 exd5 (e4d5)** — the white knight on d2 no longer defends 2 attacked white pieces
  - FEN before: `r1bqk2r/ppp2ppp/2n2n2/3p4/2BPP3/5N2/PP1N1PPP/R2QK2R w KQkq - 0 9`
- **anti-kid-classical-white ply 10 Nd7 (f6d7)** — the white knight on c3 no longer defends 2 attacked white pieces
  - FEN before: `r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N5/PP2BPPP/R1BQNRK1 b - - 2 9`
- **anti-london-black ply 8 Bg3 (f4g3)** — the white pawn on e3 no longer defends 2 attacked white pieces
  - FEN before: `r1bqk2r/pp3ppp/2nbpn2/2pp4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq - 1 7`
  - author: "The usual answer. Note what it tells you: White will recapture hxg3 if you ever trade, and wants Bd3/Ne5/f4 next. Your remaining spine moves are playe"

**Non-signalling (the false positives):**
- **anti-italian-center-attack-black ply 8 Bd2 (c1d2)** — the white queen on d1 no longer defends 2 attacked white pieces — fails C
  - FEN before: `r1bqk2r/pppp1ppp/2n2n2/8/1bBPP3/5N2/PP3PPP/RNBQK2R w KQkq - 1 7`
- **anti-scandinavian-white ply 10 Bh5 (g4h5)** — the white pawn on g2 no longer defends 2 attacked white pieces — fails C
  - FEN before: `rn2kb1r/ppp1pppp/5n2/q7/3P2b1/2N2N1P/PPP2PP1/R1BQKB1R b KQkq - 0 6`
- **carlsbad-minority-attack ply 4 Bxe7 (g5e7)** — the black queen on d8 no longer defends 2 attacked black pieces — fails C
  - FEN before: `r1bqrnk1/pp2bppp/2p5/3p2B1/3Pn3/2NBP3/PPQ1NPPP/1R3RK1 w - - 10 12`
- **carlsbad-minority-attack ply 11 bxc6 (b7c6)** — the black queen on e7 no longer defends 2 attacked black pieces — fails C
  - FEN before: `r1b1rnk1/1p2qpp1/p1P4p/3p4/3Pn3/2NBP3/P1Q1NPPP/1R3RK1 b - - 0 15`

### `move_irreversibility:fired`

**Signalling (T∧C):**
- **conversion-up-a-piece ply 1 Rxd8+ (d1d8)** — white played an irreversible move (last_of_role)
  - FEN before: `3rk3/pp3ppp/4p3/8/8/2N1P3/PP3PPP/3RK3 w - - 0 1`
  - author: "Accept. The rooks are each other's mirror — while both stand, their rook makes threats yours must answer; when both are gone, your knight is the only "
- **conversion-up-a-piece ply 2 Kxd8 (e8d8)** — black played an irreversible move (last_of_role)
  - FEN before: `3Rk3/pp3ppp/4p3/8/8/2N1P3/PP3PPP/4K3 b - - 0 1`
  - author: "The recapture is forced, and stop to see what you bought: the board now holds kings, pawns, and your knight. Every remaining move of this game is abou"
- **philidor-passive-rook-convert ply 3 Rxh8 (a8h8)** — white played an irreversible move (last_of_role)
  - FEN before: `R6r/4k3/8/4K3/4P3/8/8/8 w - - 3 3`
  - author: "Collect. Rook and pawn against a bare king: the game is decided, and the drill's remaining work is the clean escort."
- **trajectory-caro-advance-chain-bishops ply 34 Nxb3 (a5b3)** — black played an irreversible move (last_of_role)
  - FEN before: `r1r3k1/pp2bppp/1q2p3/n2pP3/3P4/1N1QB1P1/PP3PP1/1R3RK1 b - - 8 17`
  - author: "The knights meet at last. Whichever way this is resolved, the second minor-piece pair leaves the board."

**Non-signalling (the false positives):**
- **anti-caro-advance-early-c5 ply 1 dxc5 (d4c5)** — white played an irreversible move (pawn_break) — fails T
  - FEN before: `rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4`
- **anti-caro-advance-early-c5 ply 5 c3 (c2c3)** — white played an irreversible move (clock_zeroed) — fails T
  - FEN before: `r2qkbnr/pp2pppp/2n5/2PpP3/6b1/5N2/PPP2PPP/RNBQKB1R w KQkq - 3 6`
- **anti-caro-advance-early-c5 ply 2 cxd4 (c5d4)** — black played an irreversible move (pawn_break) — fails T
  - FEN before: `rnbqkbnr/pp2pppp/8/2ppP3/3P4/5N2/PPP2PPP/RNBQKB1R b KQkq - 1 4`
- **anti-caro-advance-c5-race ply 3 e6 (e7e6)** — black played an irreversible move (clock_zeroed) — fails T
  - FEN before: `rn1qkbnr/pp2pppp/2p5/3pPb2/3P4/5N2/PPP2PPP/RNBQKB1R b KQkq - 2 4`
