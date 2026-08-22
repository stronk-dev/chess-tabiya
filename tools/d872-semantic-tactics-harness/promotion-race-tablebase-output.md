# D872 promotion-race/tablebase output

Recorded sidecars: 288 unique Syzygy FENs across 12 evidence files; normalized outcome rows: 288.
Pawn-bearing rows: 157; kings-and-pawns-only rows: 49; two-sided unblocked geometric races: 10.

Immediate legal promotion positions: 3; Syzygy win/draw/loss from side to move: 2 / 1 / 0.
Side-to-move seventh-rank pawn positions: 23; Syzygy win/draw/loss: 11 / 1 / 11.

Naive unopposed-stride race agrees with Syzygy on 7/10 (70.0%). It accounts for side to move, clear forward paths and the initial two-square push, but deliberately ignores control, captures, checks, king access and promotion effect.

| geometric prediction → Syzygy outcome | rows |
|---|---:|
| loss->draw | 1 |
| loss->loss | 3 |
| loss->win | 2 |
| win->win | 4 |

## First disagreements

- loss→win: `8/p7/2p1k3/PP6/8/5K2/8/8 b - - 1 2` (pawn-breakthrough-convert.evidence.json).
- loss→draw: `8/8/1Pp1k3/8/8/8/6K1/8 b - - 0 3` (pawn-breakthrough-convert.evidence.json).
- loss→win: `8/8/1pp1k3/P7/8/8/5K2/8 b - - 1 3` (pawn-breakthrough-convert.evidence.json).

Interpretation: distance/path/turn are exact descriptive operands. Their race ordering is a geometric convention, not outcome. In the <=7-piece domain, Syzygy category/DTZ owns outcome; outside it the outcome projection abstains. Immediate promotion and seventh-rank presence are reported separately because neither implies a win.
