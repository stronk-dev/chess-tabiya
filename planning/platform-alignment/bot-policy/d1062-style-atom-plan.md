# D1062 — shared style atoms as controlled bot traits

**Opened:** 2026-08-23
**Authority:** D1056/D1062, R11, O8; disposable research only
**Status:** complete — 0/5 candidate arms pass; details in
`d1060-style-atom-results.{json,md}` and `design/research/shared-style-atoms-as-bot-traits.md`

## Question

Can any of five rules-exact atoms from R21 materially and controllably change a Maia bot's move
distribution without silently changing strength or destroying the human-population match?

This is not a personality test. It measures one-ply candidate reweighting. No passing arm earns an
“aggressive,” “solid,” “positional,” “creative,” “human-like” or repertoire claim.

## Frozen population and base policy

Reuse D969's corrected fixed population without regeneration:

- 279 R11 positions × Maia bands 1400/1600/1800 = 837 cells;
- history-conditioned Maia `armA-history.jsonl` candidates;
- the shared-candidate Stockfish 18 depth-8 table;
- the R11 Explorer/SAN reference files;
- whole-cell abstention when Stockfish returns mixed mate/cp score domains, expected 11 positions /
  33 cells, leaving 804 cells.

The base is the reconstructed production Maia sampler (temperature .8, top-p .92). Every candidate
arm applies D969's depth-8 250-cp guard first, then multiplies the named trait mass by exactly four
and renormalizes. The multiplier matches the one already accepted for the pawn positive control;
2 and 8 may be reported as sensitivity only and cannot be selected after the run.

## Five candidate atoms

1. `move.pawn_to_extended_center@1`: moving a pawn to c4/d4/e4/f4/c5/d5/e5/f5.
2. `move.early_queen@1`: a queen move before ply 16.
3. `move.castle_side@1`: `chessops.castlingSide(position, move)` is defined. File-delta heuristics
   are prohibited because standard/Chess960 UCI dialects differ.
4. `structure.fianchetto_setup@1`: the candidate changes the moving side from no declared
   bishop-plus-pawn setup to at least one of White b2+b3 / g2+g3 or Black b7+b6 / g7+g6.
5. `structure.fianchetto_knight_screen@1`: the candidate changes the moving side from no declared
   setup+screen to b2+b3+c3 / g2+g3+f3 or b7+b6+c6 / g7+g6+f6, with bishop/pawn/knight roles
   checked exactly.

Atoms 4–5 are *completion events*. A move that merely preserves an already-existing configuration
does not fire. This matches the first-occurrence event behind R12's per-game numerator and avoids
making every later move in the structure a “fianchetto move.”

## Measures and gates

For guarded base, each candidate, and the controls report pooled and per-band:

- expected Stockfish loss, ≥250-cp mass and Explorer human-match probability;
- named-trait probability;
- cells with a declinable trait choice (at least one guarded trait and one guarded non-trait move);
- abstentions and unmappable candidate count.

A candidate passes only if all four existing R11 controlled-trait clauses hold:

1. pooled named-trait probability increases by at least 10 percentage points versus guarded base;
2. expected loss differs by at most 35 cp from the unguarded production sampler;
3. ≥250-cp loss mass rises by at most 1 percentage point versus that sampler;
4. Explorer human-match probability retains at least 90% of that sampler.

No conditional-on-opportunity number can substitute for the pooled 10-point gate. It is diagnostic
only: a trait too rare to change the bot globally is not a 1.0 persona merely because it changes a
few eligible positions.

## Controls and able-to-fail assertions

- Reproduce pawn ×4 as a passing positive control within the D969 rounded tolerances.
- Reproduce forcing ×3 as a failing negative control.
- A standard castling position and a nonstandard Chess960 position both fire through
  `castlingSide`; the old absolute-file-delta test must disagree on at least one fixture.
- A completed fianchetto and knight screen fire once; preserving either on the next quiet move does
  not fire.
- Any mixed mate/cp cell is absent whole, never converted to a fake centipawn value.
- The output names mechanics only. Passing a gate creates an RFC amendment candidate, not a
  production profile; failing leaves the literal atom available to style/Review/drills.

## Result recorded after the run

All five preregistered ×4 arms fail the pooled ten-point trait gate while passing the other three
clauses. Extended-center pawn is largest at +5.63 points; diagnostic ×8 reaches +8.54 and still
fails. The fianchetto atoms strongly move local choice where available but have only 3/6 declinable
cells, which is insufficient for a global persona. No production bot profile is admitted.
