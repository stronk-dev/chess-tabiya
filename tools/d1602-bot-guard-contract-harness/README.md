# D1602–D1604 bot guard contract harness

Disposable exploration instrument for the returned bot-roster RFC. It makes the D969 guard
operands and the pawn-trait dependency executable without changing production code.

It proves:

- one sealed receipt binds the root, history, candidate set, engine identity, depth, perspective,
  score domain and elapsed time;
- candidate losses are derived inside that receipt, never accepted from a caller;
- provider failure, timeout, candidate-set mismatch, duplicate/missing rows, bounded scores and
  mixed cp/mate domains abstain the whole guard;
- pawn reweighting runs only after a successful guard, otherwise both layers record abstention and
  the base human-policy distribution survives byte-for-byte;
- one closed classifier derives `pawn_move` from the legal board boundary, including captures and
  promotions while excluding castling and non-pawn moves; and
- forged receipts and forged trait views fail at the consuming boundary.

Run with Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1602-bot-guard-contract-harness/vitest.config.ts
```
