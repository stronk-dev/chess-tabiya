# D772 identity-retaining three-edge probe

**DISPOSABLE RESEARCH INSTRUMENT — not production code.** It examines three consecutive committed
plies while retaining defender and target identities.

It counts three literal sequences:

- `defense_edge_lost_then_target_captured`: an opponent defender→target edge disappears after the
  first move; the same target survives the reply and is captured with positive `legal-exchange@1`
  on the third move.
- `defender_captured_then_target_captured`: the first move captures that exact defender; the same
  target survives the reply and is captured positively on the third move.
- `defender_harassed_relocated_then_target_captured`: the first move newly gives the mover a
  positive local capture of the exact defender; the reply relocates that defender so its exact
  edge disappears; the same target is then captured positively.

These are sequence descriptions, not proof of force, causality, removal, deflection, overload,
winning material or move quality. The observed paths provide a prevalence/disagreement census;
they do not provide played-vs-alternative lift for whole continuations.

Run only this instrument:

```sh
pnpm exec vitest run --config tools/d772-three-edge-harness/vitest.config.ts
```

The run writes `output.md`.
