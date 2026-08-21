# D723 middlegame-breadth probe

**DISPOSABLE RESEARCH INSTRUMENT — not production code.** This harness answers D723 and
Phase 2b of `planning/evidence-foundation-ux/plan.md`. It does not authorize a schema,
collector, learner label, or authored claim.

The definitions below were fixed before the first run. They deliberately name rules facts
and disclosed conventions rather than intentions or move grades.

| Probe | Predeclared definition |
|---|---|
| `pawn_harasses_minor` | The moved pawn newly attacks an opposing bishop or knight on its occupied square. |
| `minor_pseudo_mobility_reduced` | The opponent's aggregate bishop/knight pseudo-destinations not occupied by its own pieces decrease. This is not legal mobility and does not account for pins. |
| `minor_safe_mobility_reduced` | The same aggregate destinations, additionally excluding squares attacked by the mover, decrease. “Safe” is this convention only; no SEE claim is made. |
| `pawn_contact_gained` | The mover has more pawn-to-enemy-pawn attack edges after the move. This says contact/tension, not lever quality or intent. |
| `king_zone_pressure_gained` | The mover attacks more distinct squares adjacent to the opposing king after the move. This says topology, not attack quality. |
| `heavy_piece_open_file_gained` | The moved rook or queen lands on a file containing no pawns, or no friendly pawns (half-open), when it did not previously occupy such a file. |
| `relative_line_constraint_gained` | A bishop/rook/queen ray has exactly one opposing lower-value screen between it and an opposing rook/queen, and this exact operand relation is new. |
| `locked_pawn_pair_gained` | A same-file white/black pawn pair becomes directly adjacent and mutually blocked. This is topology, not a claim that the centre is closed. |
| `same_color_slider_alignment_gained` | A new unobstructed same-color bishop/rook/queen alignment appears along a line both pieces can use. “Battery” and usefulness remain unclaimed. |
| `king_shelter_pawn_reduced` | Under `king-shelter-probe@1`, either king has fewer friendly pawns one or two ranks forward and within one file. This is a disclosed window, not “king became unsafe.” |
| `enemy_defense_edge_lost` | An exact opposing piece→friendly-occupied-square attack edge present before the move is absent after it. Significance, overload, deflection and material consequence remain unclaimed. |

The authored population is every current draft-pack spine transition. The imported population is
the already sealed CC0 fixture from `tools/r2-selection-harness/`, sampled at plies
8/16/24/32/40/48 across bullet/blitz/rapid and three rating bands. Played-vs-legal-alternative
lift measures discrimination, not correctness, usefulness, or valence.

The sequence arm evaluates consecutive edges, rather than pretending that a one-edge detector can
recognize persistence. The mandatory fixture is:

`1. d4 d5 2. Nf3 Nf6 3. e3 Bg4 4. h3 Bh5`

It must expose pawn harassment followed by relocation with the same knight/queen line constraint
preserved. Negative fixtures break the ray, change the target, add a blocker, or capture the
screen. The harness must not infer “tempo,” “prophylaxis,” “forced,” “good,” or “best.”

Run only this instrument:

```sh
pnpm exec vitest run --config tools/d723-breadth-harness/vitest.config.ts
```

The run writes `output.md`.
