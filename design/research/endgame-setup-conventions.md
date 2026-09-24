# Grounded Lucena, Philidor and Vančura setup conventions

**Question:** the evidence-value-authority landing withdrew the Lucena/Philidor/Vancura labels,
which had been emitted on every KRPKR position ([[D2495]]). Owner ruling, 2026-09-24: keep them
withdrawn, then rebuild them grounded. What cited, versioned setup conventions can name these
techniques? What does Syzygy say about positions that match them? How far can
`theory.endgame.method_stage@1` go before it needs game-graph authority that does not exist
([[D2496]], [[D2497]])?

**Ledger:** [[D2495]], [[D2496]], [[D2497]] · **Date:** 2026-09-24

**Code:** `packages/runtime/src/endgame-setup.ts` (setup conventions and matcher),
`packages/runtime/src/endgame-method.ts` (method conventions and replay),
`packages/runtime/src/evidence-factories.ts` (the two factories),
`packages/runtime/src/endgame-setup.fixtures.ts`, `packages/runtime/src/endgame-setup.test.ts`

**Instrument / receipts:** `tools/endgame-setup-convention-validation/validate.ts`
(`make endgame-setup-convention-validation`; offline from the committed cache, `ONLINE=1` to
probe), `packages/runtime/src/fixtures/endgame-setup-tablebase.json` (recorded Syzygy categories),
`planning/endgame-setup-conventions/validation.json` (full report)

## Verdict

1. **Three conventions are registered:** `lucena-setup@1`, `philidor-third-rank-setup@1` and
   `vancura-setup@1`. Each operand is an exact geometric predicate, and each carries the
   published sentence it computes, quoted verbatim from a source fetched on 2026-09-24. The
   inspector now names a technique only when one convention's whole operand set holds. The
   sentence always carries the convention id and version, for example *"Matches the Lucena
   position setup under convention lucena-setup@1 (geometry only; not an outcome or advice)."*
   Any other position stays at the material class.
2. **Syzygy agrees on every published diagram and every mirror** (15/15 positive fixtures). It
   also agrees on most random matches. In a uniform sample of 100 matches per convention, the
   canonical result held for 93 Lucena, 77 Philidor and 81 Vančura positions. Every Lucena and
   Philidor exception has one exact cause: the side to move can capture the opponent's rook. The
   Vančura exceptions are substantive: 13 of 19 have no rook capture available. **Geometry is not
   outcome.** The match therefore carries no outcome, and the tablebase stays the separate outcome
   authority. `[V]`
3. **The current corpus reproduces D2495 exactly:** 4 Lucena, 6 Philidor and 0 Vančura matches
   out of 31 KRPKR positions. The product labelled all 31 before the withdrawal. `[V]`
4. **`method_stage` is implemented as retrospective observation only.** Three cited method
   conventions replay exact `run.record.edge@1` windows. Across the 100 authored paths they
   reproduce D2496 exactly: 3 Lucena stages, 3 Philidor stages, 0 Vančura stages and one
   witnessed Lucena arrival. **Reachability stays unavailable.** "Can reach", "aim for" and
   "force" are quantified game-graph claims, and no multi-ply provider exists to compute them
   (D2497). No `derived.endgame.setup_reachable@1` exists. `[V]`

## 1. Sources and retrieval

Every quote below was retrieved on 2026-09-24. Wikipedia text was read from the raw wikitext of
the pinned revision (`action=raw`, revision id from the MediaWiki API). Chess.com and ChessBase
pages were fetched as rendered. `[V]`

| Source id | Source | Revision |
|---|---|---|
| `wikipedia-lucena` | <https://en.wikipedia.org/wiki/Lucena_position> | oldid=1356336262 (2026-05-27) |
| `chesscom-lucena` | <https://www.chess.com/terms/lucena-position-chess> | page as retrieved |
| `wikipedia-philidor` | <https://en.wikipedia.org/wiki/Philidor_position> | oldid=1356336197 (2026-05-27) |
| `chesscom-philidor` | <https://www.chess.com/terms/philidor-position-chess> | page as retrieved (disagreement record only) |
| `wikipedia-rpvr` | <https://en.wikipedia.org/wiki/Rook_and_pawn_versus_rook_endgame> §Vančura position | oldid=1364966292 (2026-07-19) |
| `chessbase-vancura` | <https://en.chessbase.com/post/karsten-mueller-understanding-the-vancura-draw> (2014) | page as retrieved |

The Wikipedia articles cite standard endgame books for these passages: de la Villa (2008) p. 125,
Müller & Lamprecht (2001) p. 179/189, Dvoretsky (2006) p. 155, Emms (2008) p. 28 and Nunn (1999).
Those books were **not** read in this pass. Their support reaches these conventions only through
Wikipedia's citation. `[P]`

## 2. The conventions

Ranks are counted from the named side's own back rank. "Attacker" means the side with the pawn.
Every convention first requires exact KRPKR material: five pieces, where one side has king, rook
and one pawn, and the other has king and rook.

### `lucena-setup@1` (sources: `wikipedia-lucena`, `chesscom-lucena`)

| Operand | Computed predicate | Quote |
|---|---|---|
| `pawn_not_rook_pawn` | pawn on files b–g | WP: "the pawn is any pawn except a rook pawn"; Chess.com: "the extra pawn that is almost promoting cannot be on the first or eighth file" `[V]` |
| `pawn_on_seventh` | pawn on the attacker's 7th rank | WP: "the pawn has advanced to the seventh rank" `[V]` |
| `attacking_king_on_queening_square` | attacking king on the promotion square | WP: "the attacking king (the one with the pawn) is on the queening square of its pawn"; Chess.com: "a king that occupies the promotion square" `[V]` |
| `attacking_rook_cuts_off_defending_king` | attacking rook's file strictly between the pawn file and the defending king's file, with the rook's file ray empty up to the defending king's rank | WP: "the attacking rook cuts off the opposing king from the pawn by at least one file"; Chess.com: "a rook that cuts off the enemy king by at least one file" `[V]`; the empty-ray requirement is an operationalization `[M]` falsified by the blocked-ray fixture |

**Excluded:** WP adds "the defending rook is on the file on the other side of the pawn" `[V]`.
Chess.com's definition omits it, so v1 requires only the conditions both sources state. English
Chess notes that the name does not mean the same thing to everyone
(`design/research/endgame-technique-applicability.md` §1). `[P]` WP also says of its diagram:
"White wins with optimal play, regardless of who has the next move". `[V]` Side to move is
therefore not an operand.

### `philidor-third-rank-setup@1` (source: `wikipedia-philidor`)

| Operand | Computed predicate | Quote |
|---|---|---|
| `defending_king_on_or_adjacent_to_queening_square` | king distance ≤ 1 from the promotion square; any pawn file | "The defending king (white king in the diagram) is on the queening square of the pawn (or adjacent to it). The pawn can be on any file." `[V]` |
| `pawn_short_of_defender_third_rank` | pawn on the attacker's 5th rank or lower | "The opposing pawn has not yet reached the defender's third rank (its sixth rank)." `[V]` |
| `attacking_king_beyond_defender_third_rank` | attacking king on the defender's 4th rank or higher | "The opposing king is beyond the defender's third rank." `[V]` |
| `defending_rook_on_defender_third_rank` | defending rook on the defender's 3rd rank | "The defender's rook is on the third rank, keeping the opposing king off that rank." `[V]`; the purpose clause is not a separate square-control operand `[M]` |

**Excluded (disagreement recorded, not averaged):** Chess.com is narrower. It says "The defending
player's king must occupy the promotion square of the attacking pawn" and "The attacking player's
extra pawn must be at least four squares away from promotion", and it asks only for rook *access*
to the third rank. `[V]` v1 adopts the Wikipedia characteristic list.

### `vancura-setup@1` (sources: `wikipedia-rpvr`, `chessbase-vancura`)

| Operand | Computed predicate | Quote |
|---|---|---|
| `rook_pawn` | pawn on the a- or h-file | WP: "a drawing position with a rook and rook's pawn versus a rook" `[V]` |
| `pawn_not_beyond_sixth` | pawn on the attacker's 6th rank or lower | WP: "when the pawn is not beyond its sixth rank" `[V]` |
| `attacking_rook_in_front_of_pawn` | attacking rook on the pawn's file, farther up the board than the pawn | WP: "and the stronger side's rook is in front of the pawn" `[V]` |
| `defending_rook_attacks_pawn_from_side` | defending rook on the pawn's rank with the squares between them empty | WP: "Black's rook keeps attacking the pawn from the side from some distance away" `[V]`; "some distance" is not given a minimum `[M]` |
| `defending_king_beyond_its_rook` | the defending king's file lies beyond the defending rook's file, on the side away from the pawn | WP: "The black king must be on the opposite side of their rook as the pawn to not block the attacks." `[V]` |
| `defending_king_in_drawing_zone` | defending king on the attacker's 7th rank, on one of the two files farthest from the pawn | ChessBase: "Black's king stays in the drawing zone g7 and h7"; WP: "Black's king must be near the corner on the opposite side of the board" `[V]`; the h-pawn and Black-pawn cases are exact mirror images `[M]` |

## 3. What fires on which fixtures

The fixtures are the sources' own diagrams with both sides to move, plus colour and file mirrors,
one-operand near-misses, and hard negatives. **Outcome** is the recorded Syzygy category, turned
round so it reads from the pawn side's point of view. `[V]`
(`planning/endgame-setup-conventions/validation.json` §fixtures)

| Fixture | FEN | Fires | Outcome |
|---|---|---|---|
| Lucena WP diagram, W / B to move | `1K1k4/1P6/8/8/8/8/r7/2R5 w/b` | lucena | win / win |
| Lucena colour mirror, B / W to move | `2r5/R7/8/8/8/8/1p6/1k1K4 b/w` | lucena | win / win |
| Lucena near-misses: pawn 6th · king off square · rook ray blocked · rook not between · rook pawn | see fixtures file | none | win · win · win · win · draw |
| Philidor WP diagram, W / B to move | `8/8/8/8/4pk2/R7/7r/4K3 w/b` | philidor | draw / draw |
| Philidor colour mirror, W / B to move | `4k3/7R/r7/4PK2/8/8/8/8 w/b` | philidor | draw / draw |
| Philidor near-misses: pawn on 3rd · rook 2nd rank · king far · attacking king on 3rd | see fixtures file | none | draw · loss · win · win |
| Vančura WP diagram, W / B to move | `R7/6k1/P4r2/8/2K5/8/8/8 w/b` | vancura | draw / draw |
| Vančura colour mirror / h-pawn mirror | `8/8/8/2k5/8/p4R2/6K1/r7 b`, `7R/1k6/2r4P/8/5K2/8/8/8 w` | vancura | draw / draw |
| Vančura near-misses: rook not in front · king out of zone · side attack blocked · knight pawn | see fixtures file | none | win · win · draw · win |
| Browser inspector FEN | `4k2r/8/8/8/8/8/RP6/4K3 w` | **none** | win |
| Other hard negatives: pawn home · 7th-rank pawn with the king beside it · KRKR · KRPPKR | see fixtures file | none | draw · win · n/a · n/a |

The browser FEN fails three Lucena operands (pawn rank, king square, cut-off), two Philidor
operands (defending king, rook rank) and five Vančura operands. Its inspector line therefore
stays at "Rook and pawn versus rook". Seven of the 13 near-misses have a different tablebase
result from the named technique. Changing one operand is therefore able to change the outcome,
and the fixtures are able to fail. `[V]`

## 4. Tablebase validation of random matches

The instrument draws a seeded rejection sample. It places the pieces uniformly, restricts the
pawn to the convention's ranks, and chooses White or Black to move at random. It keeps legal
positions that the production matcher accepts, 100 per convention, and probes each once against
the Lichess Syzygy API (<https://tablebase.lichess.ovh/standard>). The API returns the
side-to-move category; the instrument turns it round to the pawn side's point of view.
`[V]`

| Convention | Canonical result | Held | Departures | …of which the side to move can capture the rook | Departures without a rook capture |
|---|---|---:|---:|---:|---:|
| `lucena-setup@1` | win | 93 | 7 (all draws, defender to move) | 7 | 0 |
| `philidor-third-rank-setup@1` | draw | 77 | 23 | 23 | 0 |
| `vancura-setup@1` | draw | 81 | 19 (wins) | 6 | 13 |

Among matches where the side to move cannot capture the opponent's rook, Syzygy agrees in 76/76
Lucena and 75/75 Philidor positions. The same holds for all 15 published-diagram and mirror
fixtures. The Vančura departures without a rook capture are real. The sources describe the
setup's intent: the rook works "while preventing the white king from finding cover from checks".
The same article cites Romanovsky's drawing zone, where the attacking king's square decides the
result. `[V]` `wikipedia-rpvr` Neither of these is a static operand in v1.

**Consequence.** A setup match is geometry. It must never render as "this is won" or "this is
drawn". The rendered sentence says "geometry only; not an outcome or advice", and the catalogue
limitation records the three departure rates. The rook-capture rule is an exact partition of this
sample. It is **not** added as an operand, because no source states it. Making it an operand
would be LLM-authored chess convention (law 8).

## 5. Method stages and what stays unavailable

`theory.endgame.method_stage@1` needs three inputs: a sealed positive setup match, an exact
contiguous window of `run.record.edge@1` edges whose first position is that setup, and a
registered method convention. The factory replays the convention's stage grammar and mints one
event per observed stage. Its payload names the technique, stage, computed beneficiary,
convention, run and node ids, edge ids, FENs and triggering move. The factory refuses these
inputs: a setup that is not the window start, a setup under a different convention, a forged
setup, reordered edges, and an unregistered convention version.

| Method convention | Stages (each cites its setup convention) | Quote |
|---|---|---|
| `lucena-bridge-method@1` | bridge prepared (rook to the 4th rank) → king excursion → bridge interposed | WP: "It is important that the white rook go initially to the fourth rank if Black uses his most active defense"; "White would like to move his king and then promote his pawn"; "The black rook can no longer check the white king without exchanging rooks, and Black cannot prevent the pawn from queening." `[V]` |
| `philidor-third-rank-method@1` | pawn enters the 6th rank → rook to the defender's 7th/8th rank → check from behind | WP: "keep his rook on the third rank until the pawn advances to that rank"; "then go to the far end of the board (the seventh or eighth rank) and check the king from behind" `[V]` |
| `vancura-method@1` | pawn enters the 7th rank → rook moves behind the pawn | WP: "The black rook moves behind the pawn as soon as the pawn moves up to its seventh rank." `[V]` |

The fifth-rank Lucena bridge that WP also describes is not a v1 stage. "From behind" is pinned to
the checking rook standing on a lower rank than the attacking king, counted from the pawn side.
`[M]`

Results: the D2496 controls reproduce. Lucena gives 3 stages and Philidor gives 3. Vančura
`a7 ...Ra6` gives 2 stages, while `a7 ...Rf7` gives only the pawn stage. Replayed from each path's
first setup match, the 100 authored draft paths give exactly 3 Lucena stages
(`d1d4`, `b8c7`, `d4b4`), 3 Philidor stages (`e5e6`, `b6b1`, `b1d1`) and 0 Vančura stages. There
is one witnessed setup arrival: `...Ke7` into `lucena-setup@1`. `[V]`

**Still unavailable, and why:**

- **Reachability, forceability and inevitability** ("can reach", "aim for" or "force" Lucena).
  D2497 showed these are quantified game-graph claims. They need a declared target convention,
  beneficiary, edge filter, claim horizon, operational budget, provider receipt and completeness
  record, and no multi-ply provider exists. No projection is minted, and neither setup_match nor
  method_stage can render such a claim.
- **"The method was executed correctly" or "the outcome was preserved".** A stage records what
  happened on the path, not whether it was best. An outcome-preservation claim would need a
  declared derived join with before/after tablebase evidence, and that join is not built.
- **Consumer rendering of method stages.** The factory is callable, but no presentation binding
  exists. Ordinary-player wording and module eligibility are unmeasured.
- **A shared register home.** `semantic-convention-register` and `semantic-convention-provenance`
  are still drafts. These six conventions are therefore frozen, versioned, code-owned records
  (the smallest honest home, like `phase-bands@1`). The factories keep the
  `semantic-convention-provenance` dependency and a `pending` note.

## Limits

- The sources are one encyclopedia plus two web explanations; the standard books are cited only
  through Wikipedia `[P]`. The operationalizations marked `[M]` are this pass's choices, recorded in
  code beside each operand.
- The samples are 100 per convention and uniform over the matching set. This is not a population
  of positions that arise in play, and the rates are not precision or recall.
- The current corpus still has zero rook-pawn KRPKR positions. Vančura is validated here by
  published diagrams, mirrors and a random sample, not by authored content.
