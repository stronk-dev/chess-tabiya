# Vocabulary Wiring implementation log

## 2026-08-16 — implementation started

- Re-reviewed the accepted RFC against pack schema 0.23 and the current runtime.
- Confirmed the additive 0.24 lane is free and the prior D64 remediation is already present.
- Started with the expression grammar and compile-time expansion seam.

## 2026-08-16 — implementation

- Added the closed `plan_signature` leaf to both duplicated structural-expression schemas while
  keeping shape entries unable to resolve pack-local references via `PLAN_SIGNATURE_NESTED`.
- Expanded references before position and transition evaluation and preserved plan evidence refs.
- Added inline/deprecation warnings, the repo-wide reach census, two real variant relations, and
  the learner-facing sibling link.
- Targeted verification: 93 tests across schema, validation, refusal coverage, authoring, and web
  screens pass. A full direct Vitest run reached 655 passing tests; its remaining failures were the
  sandbox's `listen EPERM` and concurrent untracked author-round files, not this lifecycle.

## 2026-08-16 — gates green

- `ENGINES_REQUIRED=1 make verify`: 662 tests across 105 files; Svelte 0 errors/0 warnings;
  scaffold and packaging clean.
- `make test-browser`: 24 passed, optional Maia latency test skipped, zero retries.
- The full gate initially exposed three strict-null errors in the concurrent untracked
  `author-round-probe.test.ts`; the corrections were non-behavioural assertions over already
  established corpus shapes and remain outside this lifecycle's staged file set.
