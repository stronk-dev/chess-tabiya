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

## 2026-08-16 — D347/D353 follow-up

- The first three content users exposed that only objective compilation expanded
  `plan_signature`: checkpoint and boundary validation evaluated raw expressions, while the
  expression census faulted once per corpus position.
- Routed checkpoint triggers, authored boundaries, timing-window position clauses, structural
  key-point grounds, and pack census subjects through the same registry expander. The runtime's
  unresolved-reference refusal remains unchanged.
- The census returned from 26 to 23 `satisfiabilityUnknown` subjects; the three new pack subjects
  are satisfiable with zero evaluation faults. `ENGINES_REQUIRED=1 make verify` passed 672 tests
  across 104 files with Svelte 0/0, and the zero-retry browser gate passed 24 with the optional
  Maia latency test skipped.

## 2026-08-20 — independent closeout

- A0 re-derived the historical pack-0.24 landing at `caa8afa` and ran current clean vocabulary,
  schema, authoring and presentation contracts plus type, scaffold and packaging checks.
- No blocker surfaced. RFC moved to the archive; D348 remains an explicitly separate shape-trigger
  gap rather than being hidden by this closeout.
