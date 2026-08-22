# D829–D835 / D931 Wave-A contract harness

Disposable exploration instrument for the author-returned tail of `tactical-collectors.md`.
It makes the proposed contract repairs able to fail before production code is resumed:

- pawn connectivity separates adjacent-file pairs from directed pawn-support chains and retains
  every unprotected chain base;
- rook-on-seventh remains a literal square/target state and does not invent a generic `cutOff`;
- trade completion means an immediately consecutive capture/recapture pair on one square;
- a loose-piece event compares the mover's pieces on both sides of the edge by using a disclosed
  opponent-turn baseline before the move;
- discovered execution requires the before-state latency relation plus the exact gained ray;
- promotion geometry survives when the pass-convention flag is unavailable because a checking
  move makes the turn clone invalid.

Run:

```sh
pnpm exec vitest run --config tools/d829-wave-a-contract-harness/vitest.config.ts
```

The harness is research evidence, not production implementation.
