# D771 pawn-controlled minor destination probe

**DISPOSABLE RESEARCH INSTRUMENT — not production code.** This tests the owner's “a pawn move
prevents a bishop or knight from taking a square” example without turning colloquial prevention
into a false rules claim.

Two events are compared on authored spines and the sealed imported CC0 sample:

- `pawn_contests_minor_destination`: the Wave-B geometry control—a moved pawn newly controls an
  empty square geometrically reachable by an opposing bishop/knight.
- `minor_destination_newly_exchange_unsafe_by_pawn`: the same named minor has the same legal quiet
  destination before and after the pawn move; it was locally non-losing before, but after arrival
  the moved pawn has a positive `legal-exchange@1` capture there.

The second event says “newly locally unsafe under the disclosed exchange convention,” not illegal,
forced, prevented, intended, good or bad. A pre-move opponent-turn clone clears en passant; invalid
clones abstain and are excluded from that probe's denominator.

Run only this instrument:

```sh
pnpm exec vitest run --config tools/d771-legal-denial-harness/vitest.config.ts
```

The run writes `output.md`.
