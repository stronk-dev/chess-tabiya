# Tempo vocabulary implementation log

Append-only.

## 2026-08-15 — implementation opened (codex)

- Pulled queue item 3 immediately after `validator-integrity` archived.
- Re-read the post-review owner ruling and found the RFC body still described `outpaced` as globally ungraded. Reconciled it as a per-window authored opt-in (`gradeOutpaced`, default false), a published unauthored failure default, and a five-verdict deployment capability.
- Confirmed the RFC explicitly excludes automatic tempo detection and the shipped Just Play path has no unauthored timing-window producer. The default is therefore published and test-pinned for that future producer; this implementation does not manufacture a detector or falsely claim an applied Just Play transition.

## 2026-08-15 — core implementation green (codex)

- Pack schema 0.17 replaces the dead point-pair trigger with top-level timing windows, `atWindow`, move-set readiness/tolerance, ordered closes, and `timing_window` success conditions.
- Added the pure seven-verdict path projection, compile-time trigger facts for objective evaluation, checkpoint consumption, `preserve_plan_window` rules, `tempo:` evidence, capability publication, named refusals, and eight validation families.
- The public pack projection remains unchanged, so timing-window labels and notes do not recreate the authored-prose contamination hole. Clients without revealed pack metadata render an honest generic timing sentence; full pack contexts render the authored label and budget.
- Focused integration tests cover all seven verdicts, objective evidence, checkpoint firing, authored `outpaced` default/opt-in, the unauthored default, and every refusal family. The pre-closeout engine-required gate passes 515 tests across 84 files with Svelte 0/0 and clean schema/scaffold/packaging checks.

## 2026-08-15 — completion protocol (codex)

- Folded canonical behavior into the existing pack, client, runtime, explanation,
  outcome, and structural-reading docs rather than creating a new page: tempo is a
  shared vocabulary consumed by those systems, not a standalone product surface.
- Set the RFC to implemented, updated the pack-schema register and archive index,
  closed the owning ledger rows, and archived both lifecycle documents.
- The browser pre-closeout gate passed 24 tests at zero retries with the optional
  Maia latency test skipped. Both post-move gates are rerun before the commit.

## 2026-08-15 — post-move verification (codex)

- `ENGINES_REQUIRED=1 make verify`: 516 tests across 84 files, Svelte 0 errors / 0 warnings, schema/scaffold/packaging clean.
- `make test-browser`: 24 passed at zero retries; the optional Maia latency test skipped.
