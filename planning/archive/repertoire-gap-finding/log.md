# Repertoire gap-finding implementation log

## 2026-08-14 — Codex implementation review

The RFC survived review. Three integration details are pinned before code: creating a
gap run and its `repertoire_gap_runs` link is one storage transaction; study fetches
reuse the existing module-level serialized Lichess chain; and all repertoire errors
extend both the closed server-error union and REST status mapping. The specified parser,
corpus, position-run, scheduler, and owner-scoping seams exist on the baseline tree.

## 2026-08-14 — Implementation and exercising acceptance

Migration 15 adds private repertoire, answer-map, scan, and gap-link storage. The PGN
reader walks multiple games and every variation, while public study fetches share the
existing credential-free serialized Lichess chain. Corpus scans multiply count-derived
path mass, merge same-ply frontiers, stop at abstention, and surface truncation before
ranked gaps. Gap entry creates the run, grant, and provenance link in one transaction;
answers remain explicit digest-guarded learner choices.

The Learn surface now imports, scans, enters, and reports addressed gaps. The browser
acceptance exercises that complete path through the mock deployment. Repository gates
pass: `ENGINES_REQUIRED=1 make verify` reports 437 tests across 74 files with Svelte
0/0 and clean schema/packaging checks; `make test-browser` reports 21 passed at zero
retries with the optional Maia case skipped.

## 2026-08-14 — Lifecycle closeout

The RFC and planning job are archived, migration 15 is implemented in the register,
and canonical docs are indexed. Both gates were rerun after the moves: 437 tests across
74 files passed with Svelte 0/0 and clean scaffold/packaging checks; the browser suite
passed 21 tests at zero retries with only the optional Maia case skipped.
