# `rfc/return-scheduling.md` — implementation map, 2026-09-24

Implemented by claude on the owner's in-session acceptance (*"just do the work implement a bunch of
RFC's"*, 2026-09-24). No migration, no new table or column, `tabiya-claims: none`. Corrections found
while verifying the RFC against HEAD are in the RFC's changelog, not repeated here.

## Criteria → tests

| # | Criterion | Able-to-fail test |
|---|---|---|
| 1 | Eight §1.3 histories, real `#refreshAutoSchedule`, `due_at` day deltas | `apps/server/src/return-scheduling.test.ts` "criterion 1"; also the pre-existing `progress.test.ts` fixture from `4f8ba581` |
| 2 | Masking case: all-stable ×6 is 35 days and `trailingStable` 6 | `return-scheduling.test.ts` "criterion 2" |
| 3 | Step-down retains `peak - 1`; never-climbed stays 1 day | "criterion 3" — fails under a full reset (1 day) and under an unconditional floor; mutation-checked by zeroing the floor |
| 4 | Overstudy cannot advance; `fresh` ≤ `scheduled`, with differing fixtures | "criterion 4" — early `fresh`, early `duplicate` and `in_run_retry` differ; an early lapse demotes both; a pack-shelf return after the due time advances. Mutation-checked by disabling the cap |
| 5 | Difficult roots read `attempts`, not `learner_position_stats`; three unstable with `seen_count = 0` listed | "criterion 5" (SQL source assertion, file-backed DB with `seen_count` forced to 0, two-unstable root excluded, learner isolation) |
| 6 | Frequency orders only within a due date | "criterion 6" (pure ordering) and "criterion 6 through the service" (fake corpus, `dueQueue`); client-side `parseDueQueue` refuses a cross-date re-order (`apps/web/src/lib/progress-response.test.ts`) |
| 7 | No comparative-quality term in §4 surface strings, listed vocabulary | `apps/web/src/lib/learner-copy.test.ts` "renders no comparative-quality term …" |
| 8 | Varied `variant` rotates with `k` over `retryVariants`; none → NULL and "fresh opponent seed" | "criterion 8" (storage rotation, blocked/none/cleared arms) and "criterion 8 through the service" (the registered pack's kinds reach projection); surface in `learner-copy.test.ts` and `app-shell.test.ts` |
| 9 | Imported game emits `prediction.recorded` with mass and rank; refusal string unreachable | "criterion 9" (service) and `apps/server/src/return-scheduling-application.test.ts` (REST through `createApplication`); client consumer in `session-controller.test.ts` "records guess-the-move on an imported game …" |
| 10 | §10 census as set-equality over the procedure | `apps/server/src/training-census.test.ts` (content tier, registered in `tools/test-tiers.mjs`): synthetic prose-vs-pack fixture, category set-equality over the real corpus, and a separate integer drift tripwire |
| 11 | No versioned resource moves; no `attempts`/`schedules` column added | "criterion 11" (`PRAGMA table_info` pinned); `make register-check` green |
| 12 | `/learn` payload carries no percentage, ratio or ladder index | `return-scheduling-application.test.ts` scans `/progress`, `/progress/due`, `/progress/difficult` keys and strings; `parseDifficultRoots` refuses `attemptCount`/`ladderIndex` fields |
| §6 | Vacation-safe intake (no criterion in the RFC) | "§6 vacation safety" and the `parseDueQueue` intake-arithmetic test |

## Where it lives

- Ladder replay, overstudy, variant rotation, frequency ordering, constants: `apps/server/src/progress.ts`.
- Storage: `#refreshAutoSchedule` writes `variant`; `difficultRoots` over `DIFFICULT_ROOTS_SQL` (`apps/server/src/storage.ts`).
- Service: `dueQueue`, `difficultRoots`, imported-game prediction gate (`IMPORTED_GAME_PREDICTION_CHECKPOINT`), `#project` forwards `retryVariants` (`apps/server/src/service.ts`).
- REST: `GET /progress/due` (new envelope: `schedules[].frequency`, `waiting`, `intakeLimit`), `GET /progress/difficult` (`apps/server/src/rest.ts`).
- Web: `parseDueQueue`/`parseDifficultRoots`, Learn due cards and the difficult-positions section, the home due count including waiting work, and `ImportedGuessPanel.svelte` on the drill screen for imported games.
- Docs: `docs/return-and-progression.md`, `docs/drill-pack-format.md`; the `RETRY_VARIANTS_NOT_EXECUTABLE` warning text no longer claims nothing reads the field.

## Verification

`make typecheck` clean; `pnpm test:software` green; the census test passes under `vitest.content.config.ts`; `make test-tier-check` green; `make register-check` green;
`make test-browser-smoke` 40 passed, 1 skipped (the Maia latency probe).

## What remains

- **Register/ledger closeout (coordinator):** `rfc/README.md` still lists this RFC as `draft`, so
  `make status-parity` reports P2 until the register row reads `implementing`. `design/BACKLOG.md`
  rows [[D1302]] (retry-variant rotation), [[D864]], [[D865]], [[D866]] and [[D860]] are shipped by
  this change and are the coordinator's to flip, with the exploration-log entry.
- **D2 discharged (later the same day)** by the owner's ruling: the coarse standing word
  `new` / `learning` / `established`, mapped from the ladder rung in `returnStanding`
  (`apps/server/src/progress.ts`), served as `standing` on `GET /progress/due` and rendered on Learn
  beside the due date with *"based on how many spaced returns you've held"*.
- **Discharges D3-D7** stay with their named owners: D3 declaring `retryVariants` as a scheduler-read
  capability in `rfc/pack-capability-contract.md` (the disposition register still says `refused`);
  D4 the stale `service.ts:1204` citation in `rfc/longitudinal-store.md:229`; D5-D7 in their RFCs.
- **Open question 3** remains open (floor decay); question 1 is answered by the D2 ruling. Question 2 is answered
  by §4's tie-break reading as implemented.
- **Unevidenced parameters to revisit on evidence:** `DUE_INTAKE_LIMIT = 20`, the three-unstable
  threshold, and the 40-lookup corpus bound per due read.
- **Guess-the-move scope:** the drill-screen guess board records against the model distribution the
  client requests at the source run's band. No longitudinal-store consumer reads it yet, and no
  campaign encounter class is added (D7).
- **Clock-shaped work:** none in scope; tempo sets belong to `rfc/pack-training-forms.md` and
  `rfc/enforced-clocks.md` and were left out.
- **Intent tier:** no `design/00`-`06` sentence is falsified — `design/01-training-model.md:72-79`
  promised named variations and the runtime now names them.
