# D629 detector conformance — raw output

Population: 50 packs, 754 committed transitions, 643 distinct positions.

## Structural families

| kind | observations | positions | authored docs / occurrences | fidelity | disposition |
|---|---:|---:|---:|---|---|
| `pawn_safe_square` | 5330 | 610 | 0 / 0 | lossy | rename_or_version |
| `outpost` | 10 | 10 | 3 / 23 | reader_subset | authored_condition_primitive |
| `backward_pawn` | 137 | 113 | 3 / 5 | round_trip | authored_condition_primitive |
| `isolated_pawn` | 174 | 161 | 5 / 8 | round_trip | raw_inspector_atom |
| `doubled_pawn` | 101 | 85 | 5 / 9 | round_trip | raw_inspector_atom |
| `passed_pawn` | 119 | 104 | 7 / 120 | round_trip | raw_inspector_atom |
| `open_file` | 1758 | 372 | 17 / 42 | round_trip | raw_inspector_atom |
| `half_open_file` | 604 | 379 | 16 / 26 | round_trip | raw_inspector_atom |
| `line_blockers` | 11556 | 604 | 2 / 5 | round_trip | raw_inspector_atom |
| `direct_attack_count` | 5070 | 518 | 3 / 12 | round_trip | raw_inspector_atom |
| `piece_reach_count` | 5330 | 610 | 0 / 0 | lossy | rename_or_version |
| `named_structure` | 61 | 61 | 9 / 14 | lossy | authored_condition_primitive |
| `bishop_on_shade` | 1449 | 457 | 9 / 28 | reader_subset | raw_inspector_atom |
| `pawn_count` | 0 | 0 | 0 / 0 | matcher_only | cannot_emit |
| `king_opposition` | 58 | 58 | 2 / 8 | round_trip | authored_condition_primitive |
| `piece_count` | 7716 | 643 | 33 / 201 | round_trip | raw_inspector_atom |
| `king_zone` | 1009 | 558 | 1 / 1 | round_trip | raw_inspector_atom |
| `piece_distance` | 643 | 643 | 2 / 2 | reader_subset | rename_or_version |

Declared structural kinds: 18; reader witnesses: 17; matcher-only/cannot-emit: pawn_count.

## Transition leaves

| leaf | observations | first witness | authored family docs / occurrences |
|---|---:|---|---:|
| `attacked_squares_changed:gained` | 263 | d4c5 | 0 / 0 |
| `attacked_squares_changed:lost` | 121 | g1f3 | 0 / 0 |
| `defended_duties_changed:acquired` | 67 | c6c5 | 0 / 0 |
| `defended_duties_changed:released` | 58 | c1d2 | 0 / 0 |
| `defended_squares_changed:gained` | 131 | g1f3 | 0 / 0 |
| `defended_squares_changed:lost` | 165 | d4c5 | 0 / 0 |
| `escape_squares_changed:gained` | 746 | d4c5 | 1 / 2 |
| `escape_squares_changed:lost` | 741 | d4c5 | 1 / 2 |
| `move_irreversibility:castled` | 20 | e8g8 | 1 / 1 |
| `move_irreversibility:clock_zeroed` | 253 | d4c5 | 1 / 1 |
| `move_irreversibility:last_of_role` | 21 | d1d8 | 1 / 1 |
| `move_irreversibility:pawn_break` | 60 | d4c5 | 1 / 1 |
| `slider_lines_changed:closed` | 297 | g1f3 | 1 / 1 |
| `slider_lines_changed:opened` | 428 | d4c5 | 1 / 1 |

Declared transition families: 6; witnessed families: 6; witnessed leaves: 14.
Transition observations retaining affected squares: 0/3371.
Priority/multi-label control: d4e5 both captures Black's last queen and creates pawn contact; the reading emits clock_zeroed + last_of_role and suppresses pawn_break.

## Interface and admission result

Structural fidelity: 11 round-trip, 3 reader-subset, 3 lossy, 1 matcher-only.
Transition fidelity: 0 round-trip, 6 lossy.
Generic reader sinks verified: 5. These sinks accept whole readings rather than declaring detector-family eligibility.
Unconditionally learner-eligible detector families: 0. Exact atoms remain usable by an inspector or named authored condition; learner modules still require semantic eligibility, local selection and consumer validation.

## Registry detail

| family | literal computation | blocker |
|---|---|---|
| `pawn_safe_square` | enemy-pawn current-file reach projection; boolean ignores captureAttackers, occupancy and legal paths | The name and safe boolean overclaim the computed projection (D566). |
| `outpost` | relative rank 4–6, own-pawn support and pawn_safe_square projection | The matcher accepts an unoccupied square; the reader emits only occupied non-pawn/non-king squares, and the definition inherits D566. |
| `backward_pawn` | pawn on file, no adjacent-file pawn at or behind its rank, enemy pawn attacks its one-step stop square | A deterministic Tabiya convention, not learner valence or a universal definition. |
| `isolated_pawn` | own pawn on file and no own pawn on either adjacent file | Exact state does not establish importance or weakness. |
| `doubled_pawn` | at least two own pawns on one file | Exact state does not establish importance or weakness. |
| `passed_pawn` | named own pawn with no enemy pawn ahead on its or adjacent files | Exact convention does not establish value, route or promotion race. |
| `open_file` | no pawn of either colour on the file | Exact state does not establish relevance. |
| `half_open_file` | no own pawn and at least one enemy pawn on the file | Exact state does not establish relevance. |
| `line_blockers` | occupied squares strictly between two aligned endpoints | Reader emits every slider-to-edge ray, not a significant line or affected target. |
| `direct_attack_count` | pseudo-legal chessops attack rays onto a target under current occupancy | Pins and legal-move consequences are not evaluated. |
| `piece_reach_count` | pseudo-legal destinations excluding own occupancy | Matcher aggregates any/every same-role piece while reader emits per piece; it is not a 2–3-ply threat. |
| `named_structure` | one of four hard-coded Tabiya pawn-skeleton expressions | Generic observation drops the matched structure id; the separate structures array retains it. |
| `bishop_on_shade` | bishop occupies a light or dark square | Reader is per bishop while matcher is existential; state alone is not a good/bad bishop claim. |
| `pawn_count` | pawn count or colour difference matcher | structuralReading never emits this declared kind (D548); piece_count already covers pawn counts. |
| `king_opposition` | aligned kings with 1, 3 or 5 intervening squares and the opponent of the named colour to move | A disclosed Tabiya convention; occupancy between kings is deliberately ignored by the implementation. |
| `piece_count` | role count or colour difference | Exact count does not establish material valence. |
| `king_zone` | king on board edge or one of four corners | A region label, not king safety. |
| `piece_distance` | minimum empty-board move distance for a role to a square or piece set | Reader emits only king-to-king distance; matcher supports five roles, ignores occupancy, checks and turn sequence. |
| `attacked_squares_changed` | shared enemy-occupied targets changing between zero and non-zero pseudo-attackers | Computed target identities are discarded; captures, new occupants and attacker identity are excluded. |
| `defended_squares_changed` | shared friendly-occupied targets changing between zero and non-zero pseudo-defenders | Computed target identities are discarded; moved/captured/new pieces and defender identity are excluded. |
| `slider_lines_changed` | shared slider-to-edge rays whose blocker count increases or decreases | Ray/slider/target identities are discarded; added, removed or moved sliders have no shared key. |
| `escape_squares_changed` | safe geometric destinations gained/lost by pieces that remain on the same square | Despite the kind name this covers every stationary piece, uses pseudo-attacks and omits mover identity and squares. |
| `defended_duties_changed` | stationary piece crosses the threshold of defending two attacked friendly pieces | Threshold and all piece/target identities are discarded; it does not establish overload or consequence. |
| `move_irreversibility` | priority result among castled, captured last-of-role and pawn contact, plus separately emitted halfmove-clock zeroing | Subkinds have different semantics; priority suppresses simultaneous labels and imported castling has the D547 UCI mismatch. |
