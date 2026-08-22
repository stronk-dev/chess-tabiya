# D783 identity-retaining mobility probe

**DISPOSABLE RESEARCH INSTRUMENT — not production code.** It compares legal and locally
non-losing destinations for the same retained bishop, knight, rook or queen before and after a move.

A destination is locally non-losing under `legal-exchange@1` when a capture move has a non-negative
exchange result, or a quiet move does not leave the moved piece exposed to a positive local capture.
This is a disclosed convention, not engine safety. Invalid opponent-turn clones abstain.

The probe distinguishes:

- legal mobility loss (rules, pins/check included);
- safe mobility loss (legal destination remains but becomes locally losing);
- minor-specific safe mobility loss;
- transition from at least one safe move to none;
- noncapture restriction;
- moved-piece safe mobility gain.

It does not emit trapped, dominated, outpost, active, centralized, forced, good or bad.

```sh
pnpm exec vitest run --config tools/d783-piece-mobility-harness/vitest.config.ts
```
