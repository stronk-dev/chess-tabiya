# Dead vocabulary implementation log

## 2026-08-16

- Added a TypeScript-AST declaration census behind `make expression-census DECLARATIONS=1`.
- Enumerated schema literals, server error codes, assistance keys/values, and runtime reading
  vocabulary directly from their declarations.
- Kept producer, consumer, refusal-site, and corpus-firing evidence separate. In particular,
  `/retryVariants` has no consumer and one named refusal site.
- Reproduced the D360 correction on the current corpus: `clock_zeroed` fires 265 times over
  771 authored transitions and has two production emitters.
- Added live-source mutation tests for every namespace, known error-producer near misses, the
  producerless-error control, refusal separation, determinism, opt-in isolation, and the
  no-write boundary.
- Focused server typecheck and the 17-test expression-census suite passed.
- Final implementation gates passed on the same tree: `ENGINES_REQUIRED=1 make verify`
  (733 tests / 114 files, schema and packaging clean) and `make test-browser` at zero retries
  (24 passed, one optional Maia test skipped).

## 2026-08-20 — independent closeout

- A0 re-ran the focused declaration/vocabulary contracts against a clean committed-tree
  extraction alongside current type, scaffold and packaging checks; no blocker surfaced.
- RFC moved to the archive. Residual authoring-code vocabulary work remains D428 and was not
  falsely closed by this lifecycle.
