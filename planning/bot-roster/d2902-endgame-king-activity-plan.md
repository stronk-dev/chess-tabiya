# D2902 — endgame king-activity fixed-population screen

**Opened:** 2026-09-06
**Authority:** [[D2902]], [[D2237]], `rfc/bot-roster.md` §5.3
**Status:** measured 2026-09-06; exact global ×4 transform refused — see
`design/research/endgame-bot-king-activity.md`

## Question

Can the exact `king_move` ×4 transform create at least a ten-percentage-point change in Maia's
endgame move distribution after an exact tablebase-result guard, without worsening the root WDL?
What does it do to DTZ, and which missing reference still prevents a human-like or personality
claim?

This is an endgame mechanism screen. It cannot establish strategic intent, good king activity,
coherent multi-ply play, fun, a calibrated rating, or resemblance to human endgame choices.

## Frozen population

Use only complete rows from tracked file `tools/r4-difficulty-harness/out/tb.jsonl` at committed
identity. The file contains 257 rows, of which 196 retain a complete tablebase response and 61 are
typed historical HTTP-429 failures. The 196 complete rows are distinct non-terminal FENs spanning
3–7 pieces and win/draw/loss roots. Do not silently refresh, replace or count the 61 failures as
negative positions.

For every complete FEN, probe the production Maia sidecar at bands 1400, 1600 and 1800 with
temperature 0.8, top-p 0.92 and MultiPV 20. Use the bare FEN because this population has no honest
preceding history. Record that loss explicitly; do not fabricate a move history from pack support
pointers.

The result must retain the tablebase-file digest, Maia image/handshake identity, probe bytes digest,
row counts, omitted candidates and strata by band, piece count, root WDL and pack family.

## Exact policy algebra

1. Normalize Maia's positive policy values.
2. Apply the production temperature/top-p truncation exactly.
3. Join each retained candidate by UCI to the captured legal tablebase move.
4. Refuse an unmapped candidate; do not price it as losing.
5. Keep only moves whose mover-relative `moverCategory` equals the root category. This is the exact
   WDL-preserving guard. If no sampled move preserves WDL, report `guard_empty` and abstain that
   cell rather than selecting an inferior move.
6. Reweight guarded king moves ×4 and renormalize.

`king_move` means only that the moving role at the root FEN is king. It does not mean centralising,
opposition, shouldering, escorting, activity, technique, or improvement.

## Measures and verdict

Report pooled and by-stratum:

- guarded and transformed king-move mass;
- signed percentage-point movement;
- cells with both king and non-king guarded mass and cells with king mass strictly in `(0.05,0.80)`;
- root-WDL worsening probability before the exact guard, after it and after transformation;
- expected absolute child DTZ and signed change, separated by root WDL (never pooled into cp);
- positions/cells that are terminal, guard-empty, candidate-empty, truncated or unmapped.

The mechanism-reach arm passes only if pooled signed king-move movement is at least 0.10, at least
50 guarded cells contain both king and non-king mass, there are zero unmapped candidates, and the
post-guard WDL-worsening probability is exactly zero. Multipliers ×2 and ×8 are diagnostics and
cannot replace the ×4 verdict.

The overall disposition remains `insufficient_human_reference` even when mechanism reach passes,
because this population contains no independent human move-frequency distribution. Maia is the
policy under transformation, not an independent validation target. The only permitted promotion is
`endgame_mechanism_candidate`; `human_like`, `personality`, and roster registration remain refused.

## Able-to-fail controls

- a mixed king/non-king synthetic must increase king mass under ×4;
- an all-king legal set must move zero percentage points and fail reach;
- a root-winning synthetic whose only king move draws must be removed by the WDL guard;
- a candidate absent from the tablebase move set must fail closed;
- a guard-empty distribution must abstain and never invent a fallback;
- changing the tracked tablebase bytes or Maia capture changes the recorded digest.

## Reproduction and next action

One normal `make bot-endgame-trait-screen` target builds the Maia image, creates the exact bare-FEN
probe set in a temporary directory, captures all three bands, runs the contract, and writes the
registered result/report. `make bot-endgame-trait-screen-contract` runs only synthetic and committed-
population controls without Docker or network.

A measured pass funds research for an independent human endgame reference and multi-ply coherence.
A reach failure refuses this exact global ×4 transform. Neither outcome changes the usefulness of
literal king-move and tablebase facts for Support, Review or endgame drills.
