# Guard and trait author repair — 2026-08-26

Use `design/research/bot-guard-and-trait-contract.md` and
`tools/d1602-bot-guard-contract-harness/` to amend the returned bot-policy/bot-roster contract.
This is an author handoff, not an acceptance declaration.

## Required contract image

1. Replace candidate `guardLossCp` with one sealed candidate-set guard receipt that binds root FEN,
   full-history digest, side, exact legal set, Stockfish 18, Threads 1, Hash 16, cleared state,
   `MultiPV=N`, exact `searchmoves`, depth 8, root-side perspective, final typed rows and elapsed
   time. Loss is derived only inside the receipt.
2. Whole-guard abstentions are closed over provider unavailable, deadline, candidate-set mismatch,
   duplicate row, missing row, bounded row, mixed cp/mate domain and non-cp domain. Receipt/root or
   history mismatch also abstains at consumption.
3. Replace caller trait strings and free classifier strings with the closed registry
   `pawn_move@1 → pawn_move`; classification accepts only `(root position, exact legal move set)`
   and returns a sealed view.
4. Pawn-forward declares a dependency on successful guard application. Every guard abstention
   leaves the base Maia distribution unchanged and records both guard and trait abstentions.
5. Pin the dedicated request identity `stockfish-guard@1`. Do not claim a combined selection
   deadline from the old 499.1 ms observation; the exact production chain still needs measurement.

## Acceptance fixtures

Carry all ten harness arms into the amended RFC criteria: positive, provider-off, timeout,
missing, duplicate, mixed-domain, bounded, wrong-history, forged-receipt, legal pawn
ordinary/capture/promotion, castling/non-pawn negatives, dependent application, empty-mask and
forged-trait refusal. The production implementation may consolidate them, but it may not weaken
the asserted operands or outcomes.

## Still outside this repair

- D1605's complete non-test production route;
- D1606's combined Maia + Stockfish chain benchmark and intervention target;
- D1607's compiled card statements;
- D1608's Play picker/card/identity experience;
- D1609's exact-digest calibration and observability discharge; and
- owner decisions D1610/D1611.
