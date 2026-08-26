# Square denial and outpost boundary — current control, future challenge and use

**Question:** what exact primitives are needed to support “this pawn move denies that square,”
weak-square/outpost guidance, board highlights, authored drills and bot/style features without
turning geometry into strategic judgement?

**Verdict:** keep three pawn relations separate. Current pawn control is rules-exact. A pawn on an
adjacent file that can advance to attack a square is a useful declared future-file convention.
Tabiya's existing capture-migration closure is a stronger, separately useful conservative
convention; it is not the ordinary outpost boundary. Candidate square, occupied outpost and
move-created challenge are derived records with different operands. None establishes value,
intent, permanence, best play or that a non-king piece is legally barred from moving.

**Instrument:** `tools/d1724-square-denial-harness/` is a disposable exploration harness. It
reconstructs the shipped predicate, compares three able-to-fail definitions over 611 authored and
577 imported positions, and measures played moves against every legal alternative from 754 + 579
decisions. It changes no production or content byte. `[V]`

## 1. Source boundary

FIDE defines an attack as the ability to capture under the piece-movement rules and explicitly
counts an attack even when the piece is pinned or otherwise constrained by its own king. Pawn
control of the two diagonal squares is therefore an exact rules fact; “the pinned pawn does not
control it” would be false. `[V]` ([FIDE Rules Commission, article 3.1](https://rcc.fide.com/article3/))

The Chess.com term reference describes an outpost as an advanced square where a piece can be
planted and lists three usual, non-universal properties: own-pawn guard, no enemy-pawn attack and
no easy equal-value challenge. It also says knights are the usual users, while bishops and rooks
can use outposts. This source itself separates the square from its occupation and separates pawn
geometry from the practical value of the occupying piece. `[V]`
([Chess.com, “Outpost”](https://www.chess.com/terms/outpost-chess))

A historical classical Stockfish evaluator used another explicit convention: an occupied bishop
or knight received an outpost term when no enemy pawn lay in its attack span, with a larger term
when an own pawn supported it and the opponent lacked a suitable minor-piece exchanger. That is
evidence of convention diversity, not authority for current Stockfish and not a proposal to copy
its score. `[V]`
([Stockfish 4 `evaluate_outposts`](https://github.com/official-stockfish/Stockfish/blob/sf_4/src/evaluate.cpp))

These sources support a vocabulary boundary, not one universal detector:

1. **current pawn control** — exact attacks in the current position;
2. **future same-file pawn challenge** — an enemy pawn can reach its current-file attack rank by
   forward pushes under a disclosed blocker/tempo-agnostic convention;
3. **capture-migration reach** — an enemy pawn could also change files through a hypothetical
   sequence of captures, without asserting that capture material, timing or legal path exists;
4. **hole/candidate square** — an advanced square passing a named pawn-challenge convention;
5. **occupied outpost** — a named friendly piece occupies a named candidate square;
6. **use/value** — whether the piece can arrive, survive exchanges or achieve something. This is
   later legal/search/theory evidence, not contained in 1–5.

## 2. What ships

`pawnSafetyOnPosition` emits `pushAttackers` and `captureAttackers`; `safe` is true only when both
are empty under `maximal_pawn_reach@1`. `outpost` then requires relative rank 4–6, current own-pawn
support and that maximal `safe` boolean. The matcher accepts an empty square. `structuralReading`
only emits `outpost` when a non-pawn/non-king piece already occupies it. `[V]`
(`packages/runtime/src/structure.ts:329-359,491-496,630-633`; D1724 reconstruction fixture)

That creates two distinct problems:

- the public predicate and the emitted reading use the same word for candidate and occupied states;
- capture migration says, for example, that a pawn may cross one or more files through captures
which need not be available. That is honest as a conservative possibility because D566 disclosed
it, but much stronger than the ordinary “can a pawn advance on an adjacent file to challenge this
square?” outpost relation.

The authoring dependency is currently 23 literal `outpost` expressions across three shape
documents, not the stale 77 count still carried by D632. `[V]`
(`packages/runtime/src/evidence-catalog.test.ts:145-150`; repository JSON census)

## 3. Static population result

Counts below are candidate-square instances across every side/square in each distinct resulting
position. All variants require relative rank 4–6 and current own-pawn support; only the enemy-pawn
boundary changes. `[V]`

| population | advanced + supported | no current pawn control | no future same-file challenge | no maximal reach | same-file-safe but capture-migration-unsafe |
|---|---:|---:|---:|---:|---:|
| authored (611 positions) | 3,456 | 2,774 | **472** | **310** | 162 |
| imported (577 positions) | 5,181 | 3,781 | **769** | **386** | 383 |

Current control is too weak for a stable-square claim: 2,302 authored and 3,012 imported candidates
are currently unattacked by a pawn but can be challenged by an adjacent pawn advancing on its
file. Maximal reach is much stronger than same-file challenge: it removes 34.3% of the authored
same-file-safe candidates and 49.8% of the imported candidates. `[V]`

The occupied result makes the product consequence visible:

| population | occupied under current-control | occupied under same-file | occupied under maximal |
|---|---:|---:|---:|
| authored | 63 | **9** (7 knight, 2 rook) | **0** |
| imported | 181 | **43** (26 knight, 7 bishop, 4 rook, 6 queen) | **17** |

The authored corpus cannot demonstrate the shipped occupied-outpost reading at all. The
same-file convention supplies a small, role-diverse positive population without weakening current
control or deleting maximal reach. This is not evidence that all 52 occupied squares are valuable;
it establishes only square, support, occupant and pawn-challenge geometry. `[V]`

## 4. Move-created square denial

For every decision, D1724 compares the played move with every legal alternative. “Pawn move” is a
poor selector by itself. The useful facts retain the pawn, gained squares and named enemy pieces.
`reachable target` below means a gained pawn-control square is in a named enemy non-pawn's current
FIDE attack set; it does not mean that piece intended to move there or is legally prohibited from
doing so. `[V]`

| exact event | authored played / alternatives / lift | imported played / alternatives / lift |
|---|---:|---:|
| pawn move | 25.20% / 25.80% / **0.98×** | 27.81% / 26.07% / **1.07×** |
| newly controls an enemy-occupied non-pawn square | 3.85% / 1.21% / **3.17×** | 6.91% / 2.14% / **3.23×** |
| newly controls a square in an enemy piece's current reach | 14.85% / 13.07% / **1.14×** | 19.00% / 13.99% / **1.36×** |
| removes a current-control candidate | 6.76% / 6.81% / **0.99×** | 8.81% / 6.79% / **1.30×** |
| removes a future-file candidate | 0.53% / 0.05% / **9.83×** | 1.38% / 0.08% / **16.77×** |

This gives the requested h-pawn/bishop shape an exact form: after `h2h3`, the pawn newly controls
`g4`; if a Black bishop occupies `g4`, the record says `pawn h3 → controls g4 → bishop g4`. It may
render “the pawn now attacks the bishop on g4.” It may not render “you forced the bishop back”
unless reply evidence shows that consequence. Likewise `a2a3` intersecting a knight's current
reach to `b4` may render the overlap, not “the knight can no longer use b4.” `[V]` (D1724 fixtures)

The rare future-file-candidate removal is the best discriminator, but has only 4 authored and 8
imported played positives. It is appropriate as exact evidence with a local denominator, not a
global priority learned from twelve examples. `[V]`

## 5. Required primitive family

The successor should expose distinct, versioned identities rather than one overloaded `safe`
boolean:

| projection | authority | required operands | allowed claim |
|---|---|---|---|
| `rules.pawn.current_control` | exact rules | color, pawn, square | pawn attacks square now; pins still count |
| `rules.pawn.future_file_challenge` | declared convention | beneficiary, square, enemy pawn, pushes, blocker/tempo limitations | pawn has a same-file advance geometry to an attacking square |
| `rules.pawn.capture_migration_reach` | declared convention | beneficiary, square, enemy pawn, minimum captures, limitations | hypothetical capture migration reaches an attacking file |
| `derived.square.outpost_candidate` | declared composition | square, beneficiary, rank, support pawns, chosen challenge basis | advanced supported square passes that named pawn convention |
| `derived.square.outpost_occupied` | declared composition | candidate receipt, exact piece/role/square | named piece occupies candidate |
| `rules.transition.pawn_control_gained` | exact transition | move, pawn before/after, gained/lost squares | the move changed pawn control |
| `derived.transition.pawn_challenges_piece` | exact composition | control-gain receipt, enemy piece/role/square | new pawn control hits an occupied piece |
| `derived.transition.pawn_reach_overlap` | exact composition | control-gain receipt, enemy piece/source, overlap square, attack basis | new pawn control overlaps that piece's current attack set |

The existing maximal composite can remain available by explicitly composing future-file and
capture-migration reach. It must not remain the unnamed dependency of the only `outpost` identity.

## 6. Consumer boundary

- **Requested sight / hover:** current control, future-file challenge and exact named-piece overlap
  can light squares/arrows directly.
- **Post-commit nudge:** the 3.2× occupied-piece event is eligible after local denominator and
  valence checks; the 1.14–1.36× generic reach overlap is supporting detail, not a headline.
- **Review:** can compare candidate creation/removal and later occupation, with engine/human/theory
  evidence separately deciding importance.
- **Drills/theory:** authors select the candidate convention explicitly and may require occupation
  by a role. Existing authored prose must be re-evaluated against the chosen successor.
- **Bots/style:** may use the exact features as policy inputs and longitudinal counts, but “likes
  outposts” needs opportunity denominators and the longitudinal-store contract.

## 7. Falsifiers and limitations

Permanent fixtures must distinguish: pinned pawn still controls; empty candidate versus occupied
outpost; current-safe but future-file-unsafe; same-file-safe but capture-migration-unsafe; supported
versus unsupported; rank boundary; h-pawn attacks an occupied bishop; pawn control overlaps a
knight destination without making the knight move illegal; and capture-changing-file removes a
future-file candidate. `[V]`

No source or measurement here proves usefulness, best play, inability to exchange the occupant,
permanence, plan, prophylaxis, or learner intent. No Stockfish score, Maia probability or theory
join was run. Those are separate evidence planes. The imported sample is fixed and stratified, not
a population estimate of all chess. `[V]`
