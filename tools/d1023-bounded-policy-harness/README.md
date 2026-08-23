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

`provider-sample.json` is the sealed 48+48 source-backed sample. Each population carries 16
material anchors as an exact played/hash-selected-alternative pair over the same attacker/victim,
plus 16 standalone destination rows. Round-robin strata cover phase/exact result for material and
played/alternative × phase/exact result for destination; SHA-256 orders within strata. Provider
availability cannot change which rows are asked.

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

Run the Maia policy arm against the local server and Maia sidecar only with its explicit flag:

```sh
make up-engines
D1023_MAIA=1 pnpm exec vitest run \
  tools/d1023-bounded-policy-harness/maia-probe.test.ts \
  --config tools/d1023-bounded-policy-harness/vitest.config.ts
```

It writes `maia-output.json` for the same sealed sample at model bands 1000, 1400, 1800 and 2200.
Each row retains the model identity, band, root probability mass, missing mass, bounded
`nextExecution` and `secondOpportunity` intervals, and whether every expanded node passed the
predeclared 90% retained-mass gate. The summary excludes refused rows from positive counts and
excludes a material pair unless both sides are admitted. Bands are never aggregated into one
“human probability.”
