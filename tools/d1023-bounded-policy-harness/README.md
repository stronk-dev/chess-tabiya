# D1023 bounded-policy prevention harness

Disposable research instrument for
`planning/evidence-foundation-ux/d1023-bounded-policy-plan.md`. It tests whether one exact named
opponent target is removed, preserved or reintroduced over the declared three-ply horizon. It does
not register a projection, infer intent, call a move prophylactic, or select a learner hint.

The first slice is rules-only and pins target identity (including the rook's implicit move during
castling), exact immediate availability, existential reintroduction and the stronger
preparation-versus-all-defences result. It also writes `exact-census-output.md`, the fixed authored
and imported population census for immediate named-target removal. Later slices extend that census
through the full bounded horizon and add the predeclared Stockfish and Maia policy arms without
changing these semantics.

Run the focused controls:

```sh
pnpm exec vitest run --config tools/d1023-bounded-policy-harness/vitest.config.ts
```
