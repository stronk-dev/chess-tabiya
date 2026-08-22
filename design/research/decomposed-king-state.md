# Decomposed king-state evidence

**Question.** Which exact king-state operands survive cross-population measurement after the prior
“shelter loss + more attacked zone squares” conjunction proved too sparse?

**Verdict.** `[V]` King state must remain decomposed and phase-aware. Two apparent headline signals
are simpler joins: reduced king-zone defenders is almost entirely **capture identity + defender
role**, while increased shelter around a relocated king is primarily **castling + shelter delta**.
Legal escape reduction, direct slider check and increased zone attackers become discriminating in
middle/later play but are near background early. Shelter loss and mover escape gain are weak or
mixed. None authorizes the phrase “king unsafe,” “attack,” “exposed” or “mating net.”

This answers D778's tested operands and narrows D727/D762. Bounded mating/forcing consequences
remain open.

## 1. Declared conventions

The disposable instrument uses legal chessops positions and pins every convention rather than
borrowing an engine's opaque king-safety score
([chessops source](https://github.com/niklasf/chessops)). `[V]`

- king zone: up to eight adjacent squares, excluding the king square;
- zone attackers/defenders: distinct non-king pieces attacking at least one zone square;
- shelter: same-color pawns one or two forward ranks from the king on its file or adjacent files;
- legal escapes: adjacent legal king moves, excluding castling encodings;
- direct slider check: the moved bishop/rook/queen itself attacks the opposing king;
- castling: a king move changing file by more than one, covering both king-destination and
  chessops rook-square UCI forms.

Opponent/mover side-to-move clones clear en passant and abstain if invalid. Each probe has its own
eligible denominator. The full sealed human paths are split into descriptive ply bands 1–20,
21–40 and 41+; these are horizon controls, not phase truth.

## 2. The two high-lift decompositions

### King-zone defender loss is capture-shaped

The broad event measures **6.07× / 5.12× / 3.94×** across the three imported horizon bands. When
captures are excluded it becomes **0.00× / 0.07× / 0.38×**, with the latter two upper intervals
below 1. `[V]` The high lift therefore does not justify a generic “weakened the king” collector.
The reusable event is a join:

`generic capture identity` + `captured piece was a declared king-zone defender before the move`.

That join can be a strong Review candidate. It still does not prove the defender mattered to a
mate, that the capture was sound, or that the king is now unsafe.

### Shelter increase around a relocated king is mostly castling

`king_relocated_to_more_shelter` measures 2.95× / 2.48× / 1.61×. Its castling subset measures
**10.08× / 8.19× / 5.31×**; the non-castling subset is **0.32× / 0.87× / 1.57×**. `[V]` The broad
event must not become a duplicate semantic producer. Castling identity already exists; shelter
change is an operand explaining the resulting king state.

Stationary-king shelter increase is rare but distinct: 5.17× on 7 early played moves, uncertain
1.57× in the middle band, and 2.62× later. It remains an exact state transition with phase-aware
selection, not automatically “repaired the king.”

## 3. Remaining operands by horizon

| Exact event | Plies 1–20 | Plies 21–40 | Plies 41+ | Disposition |
|---|---:|---:|---:|---|
| opponent legal escapes decreased | 1.19× (0.97–1.44) | **2.34×** (2.03–2.67) | **2.19×** (2.00–2.37) | exact phase-aware operand; no mating-net claim |
| direct slider check delivered | 1.26× (0.85–1.70) | **2.67×** (2.14–3.28) | **2.52×** (2.25–2.80) | exact check identity; no quality claim |
| distinct opponent-zone attackers increased | 1.04× (0.90–1.16) | **1.71×** (1.53–1.90) | **1.80×** (1.64–1.95) | background early; contextual middle/later operand |
| opponent shelter pawns decreased | 1.76× (1.04–2.63) | 1.31× (0.84–1.83) | 1.53× (1.14–1.95) | weak/mixed; never rank globally |
| mover legal escapes increased | 1.39× (1.30–1.48) | 0.96× (0.87–1.07) | 1.25× (1.15–1.34) | common/background; on-demand state only |

`[V]` Full counts, eligibility denominators and authored/fixed-sample controls are in
`tools/d778-king-state-harness/output.md`. The earlier conjunction's zero authored positives are
not repaired by loosening it; the operands simply have different distributions and consumers.

## 4. Product consequences

- **Touch/hover:** legal king escapes, zone attackers/defenders and shelter pawns are direct board
  overlays. Answer the learner's square question without a prose list.
- **Post-commit nudge:** a captured king-zone defender or reduced escape set may become eligible,
  but only one composed module should appear and it must state exact pieces/squares.
- **Review:** phase-aware selection may join a check, escape reduction, captured defender and later
  consequence. An engine delta, mate search, authored theory or observed continuation supplies
  significance.
- **Drills/packs:** exact operands are additive trigger vocabulary. Existing castling events should
  consume shelter change rather than gain a duplicate “king relocated safely” event.
- **Bots:** candidate policies may weight checks, escape restriction, defender capture or shelter
  under strength/phase guards. The declared policy explains behavior; the detector does not claim a
  plan.
- **Player habits:** use opportunity residuals split by phase and castling status. Raw zone or
  shelter counts mostly measure positions encountered.

## 5. What remains open

Mate-in-one and back-rank susceptibility are already specified separately. Mating nets, sacrifices,
forced king walks, clearance/interference around the king and “attack succeeded” require bounded
reply/search or authored/theory evidence. The module layer may compose exact operands only after it
declares its authority, horizon and abstention; an LLM cannot bridge the gap.
