# Pawn control versus legal and locally safe minor destinations

**Question.** When a pawn move controls a square a bishop or knight might use, what can Tabiya
truthfully detect, and is that event selective enough to become a default hint?

**Verdict.** `[V]` A pawn does not make a bishop/knight move illegal. The strongest cheap local
statement tested is that the same named minor retains the same legal quiet destination, but the
destination changes from locally non-losing to a positive `legal-exchange@1` capture by the moved
pawn. That refinement is mechanically sound but **not selective**: **1.00× authored** (95%
0.76–1.26) and **1.02× imported** (0.74–1.34). It belongs in on-demand square explanation and
later context joins, not as a default post-move announcement.

This answers D771 and narrows D724/D755. It does not close Phase 2b or the distinct occupied-minor
harassment event.

## 1. Why “prevents the piece from taking the square” is too strong

For a non-king piece, moving onto an enemy-attacked square is legal unless some other rule makes
the move illegal. Pawn control changes tactical safety, not legal reach. `[V]` The probe uses
chessops legal move generation for both before and after states and the independently tested D730
local exchange convention for the safety transition
([chessops source](https://github.com/niklasf/chessops);
`legal-exchange-prerequisite.md`).

The exact event is:

1. the moved piece is a pawn and newly controls an empty square;
2. a named opposing bishop or knight has a legal quiet move to that square both before and after;
3. before the pawn move, placing that minor there does not permit any positive local exchange;
4. after the pawn move, that same placement permits a positive `legal-exchange@1` capture by the
   moved pawn.

The pre-move comparison uses a disclosed opponent-turn clone with en-passant cleared. If that
state is invalid, the probe abstains. It never converts an abstention to `false`.

The positive fixture is `4k3/8/8/4n3/8/8/7P/4K3 w - - 0 1`, `h2h3`: `...Ne5–g4` remains legal,
but after `h3` the pawn can take the knight on g4 with a positive local exchange. The hard negative
adds a rook already making g4 locally unsafe; the pawn move then creates no new safety change. `[V]`
(`tools/d771-legal-denial-harness/denial.test.ts`)

## 2. Cross-population result

The disposable instrument compares every played move with every distinct legal-result alternative
from the same position, using 2,000 paired source-position bootstrap resamples. `[V]`

| Event | Authored | Imported |
|---|---:|---:|
| newly controlled empty square geometrically reachable by an enemy minor | 0.96× (0.75–1.18) | 0.95× (0.72–1.20) |
| same legal destination becomes locally exchange-unsafe specifically to the moved pawn | **1.00× (0.76–1.26)** | **1.02× (0.74–1.34)** |

The refined event fires on 53/717 authored played moves versus 1,448/19,619 alternatives. In the
imported sample it fires on 41/574 eligible played moves versus 1,318/18,838 eligible alternatives;
three played decisions and four alternatives abstain because the pre-move opponent-turn state is
invalid. Full counts are in `tools/d771-legal-denial-harness/output.md`. `[V]`

The refinement removes some geometry-only positives—roughly 9.6% becomes 7.4% authored and 9.4%
becomes 7.1% imported—but does not distinguish what humans played from their available choices.
That is a selection result, not a claim that the detector is incorrect or useless.

## 3. Product consequences

- **Touch/hover:** this is an excellent exact overlay. A selected bishop/knight may show the square
  as legal but locally losing, with the attacking pawn highlighted. No prose dump is necessary.
- **Live support:** only a workflow that permits tactical risk may use it, and it should answer a
  learner action (“why is this square marked?”), not interrupt every pawn move.
- **Review:** select it only when joined to a later route, engine/human consequence, authored
  theory, or a rare multi-edge event. The event alone earns no global prominence.
- **Theory/drills:** a cited opening/structure claim may give the square strategic meaning; the
  collector supplies exact operands and never manufactures that meaning.
- **Bots/style:** it may feature candidate moves or an opportunity-normalized restriction habit.
  Raw counts cannot support “prophylactic” or “restrictive player” labels.

Occupied-minor harassment remains separate and measured at 3.63×/3.18×. The `...Bg4 h3 ...Bh5`
case begins with a pawn attacking a bishop already on g4 and continues across another edge; it is
not evidence that empty-square denial should be announced globally. `[V]`
(`middlegame-evidence-and-style-taxonomy.md` §4.1)

## 4. Remaining question

To say *prevented*, *forced*, *prophylaxis* or *stopped the plan*, the system needs a bounded
counterfactual or cited theory: the relevant continuation was available before, the pawn move
materially removes or worsens it under a declared horizon, and the named claim survives the reply.
That belongs to D772/forcing-reply research, not this one-edge collector.
