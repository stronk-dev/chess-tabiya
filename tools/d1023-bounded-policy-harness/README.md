# D1023 bounded-policy prevention harness

Disposable research instrument for
`planning/evidence-foundation-ux/d1023-bounded-policy-plan.md`. It tests whether one exact named
opponent target is removed, preserved or reintroduced over the declared three-ply horizon. It does
not register a projection, infer intent, call a move prophylactic, or select a learner hint.

The complete-reply slice is rules-only and pins target identity (including the rook's implicit move
during castling), exact immediate availability, existential reintroduction and the stronger
preparation-versus-all-defences result for both material threats and pawn-created minor-destination
denial. It writes `exact-census-output.md`, the fixed authored and imported population census over
the full bounded horizon. Later slices add the predeclared Stockfish and Maia policy arms without
changing these semantics.

`provider-sample.json` is the sealed 48+48 source-backed sample. It round-robins over
played/alternative × target family × detected phase × exact-result strata and orders candidates
inside each stratum by SHA-256. Provider availability cannot change which rows are asked.

Run the focused controls:

```sh
pnpm exec vitest run --config tools/d1023-bounded-policy-harness/vitest.config.ts
```

The exhaustive fixed-population test takes about 150 seconds on the 2026-08-23 reference machine.

Run the Stockfish policy arm only with the explicit provider flag:

```sh
D1023_STOCKFISH=1 pnpm exec vitest run \
  tools/d1023-bounded-policy-harness/stockfish-probe.test.ts \
  --config tools/d1023-bounded-policy-harness/vitest.config.ts
```

It writes the compact, source-identified `stockfish-output.json`. Full legal-root score tables are
checked in memory and reduced to coverage counts, reached-depth bounds, the selected typed score and
the engine's own best move; the multi-megabyte transient table is not committed.
