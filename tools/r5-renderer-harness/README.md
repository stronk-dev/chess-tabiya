# R5 renderer harness

Disposable platform-alignment R5 instrument. It does not add a provider to Tabiya and never sends a
FEN, real game, user data or authored content. The sixteen fixture propositions exist only to test
whether a renderer preserves its input.

The harness evaluates the actual `voiceCheck`, a deterministic template, the current sentence-only
provider seam and a proposed typed module seam. Provider credentials are read from the adjacent
Frameworks environment file, kept in memory and never printed or written. Raw outputs contain only
synthetic fixtures and land under `/private/tmp/tabiya-r5-renderer/`.

Ordinary repository runs execute only controls:

```sh
pnpm exec vitest run --config tools/r5-renderer-harness/vitest.config.ts
```

The external experiment is explicit:

```sh
TABIYA_R5_EXTERNAL=1 TABIYA_R5_WRITE=1 \
  pnpm exec vitest run --config tools/r5-renderer-harness/vitest.config.ts
```

The local-model arm is intentionally separate so downloading a model cannot happen during ordinary
verification. Its absence is reported as an unrun arm, not silently replaced by agent output.

Install its disposable Python dependencies outside the repository, run `run-local.py`, then pass
the capture back to the scorer with
`TABIYA_R5_LOCAL_PATH=/private/tmp/tabiya-r5-renderer/local-outputs.json`. The scorer, not the
Python runner, applies the same deterministic gates used for hosted models.
