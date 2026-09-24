# Longitudinal store — implementation landing

**Date:** 2026-09-24

**Scope:** `rfc/longitudinal-store.md` implemented at **migration 26** under the owner's
direct-implementation direction (no further review round before landing; consolidation, review and
the `rfc/README.md` Active-row transition belong to the register owner).

## What landed

| Part | Where |
|---|---|
| Migration 26: `drill_runs.longitudinal_profile_disposition`, `drill_runs.longitudinal_structure_attribution`, `drill_runs_longitudinal_owner`, `learner_observation_denominators`, `learner_observations`, `learner_structure_stats`, `learner_observation_jobs`, five named indexes | `apps/server/src/longitudinal-store.ts` (`LONGITUDINAL_MIGRATION_SQL`), `storage.ts` `#addLongitudinalTables` |
| Literal 67-row registry rebuilt from the catalogue and pinned to both artifacts; `OBSERVATION_DERIVATION_REV = 1` with the registry/fixture digest pair | `longitudinal-registry.ts` |
| Closed contract: `DecisionRef`, five-state job parser, three row parsers, branded read query, per-cut result union | `longitudinal-contract.ts` |
| Sealed V4 source image + `tabiya.longitudinal-source.v4\0` digest, store-scoped | `longitudinal-source.ts`, `LongitudinalStore#sourceDigest` |
| Normative projector (decision algebra, complete-population algebra, root algebra) | `longitudinal-projector.ts` |
| Eleven source mutations call one watermark primitive inside their own `BEGIN IMMEDIATE … COMMIT` | `storage.ts`; AST census `longitudinal-mutation-census.ts` |
| Claim / renew / fail / publish CAS, bounded backoff and quarantine, startup reconciliation, typed read, rebuild | `LongitudinalStore` |
| `worker_threads` executor, supervisor, closed protocol, config/identity | `longitudinal-worker-thread.ts`, `longitudinal-worker.ts`, `longitudinal-worker-protocol.ts`, `longitudinal-worker-config.ts`, `longitudinal-worker-core.ts` |
| `createApplication` always file-backed, reconciles then awaits worker-ready; closed `/healthz`; `close()` drains; startup receipt; `application.longitudinal.read/health/progress` | `application.ts`, `main.ts`; test-only `in-memory-test-application.ts` |
| Operator doors | `make longitudinal-worker-once`, `make longitudinal-rebuild [WRITE=1]` |
| Account export/deletion (Discharge D1) | `account-data.ts` inventory + `behavioralProfiles`; `storage.ts` export and account/per-run previews |
| Docs | `docs/longitudinal-store.md` (+ index, features, account-data lifecycle, branch-runtime) |

## Acceptance criteria → tests

| § F | Test |
|---|---|
| 1 additive migration | `longitudinal-store.test.ts` › criterion 1 (real prior-release v25 schema reconstructed; diff = 4 tables + 6 indexes + 2 columns; legacy defaults; no backfill; new runs `single_player`) |
| 2 registry closure | `longitudinal-contract.test.ts` › criterion 2 (3 tests: artifact digests/row equality 46/13/8, six mutation classes, both parser boundaries) |
| 3 declinable population | `longitudinal-contract.test.ts` › criterion 3 (mixed / avoids / all / none / duplicate-operand / forced / unavailable; real boundary; parser cardinality) + `longitudinal-store.test.ts` › SQL constraints |
| 4 refs/time | `longitudinal-contract.test.ts` › two checkpoints, unsorted refs, later-clock byte stability |
| 5 owner attribution | `longitudinal-store.test.ts` › live-session holder attribution, shared prediction abstains, structure only for `single_player`; contract projector foreign/legacy arms |
| 6 write closure | `longitudinal-store.test.ts` › AST census (+7 mutation negatives), trigger-injected rollback both directions, seven writers, same-head taint |
| 7 claims | `longitudinal-store.test.ts` › simultaneous claimers, expiry/stale token, crash before/after publish, one exact pending reset from all four states; contract › closed job union |
| 8 exact prefix/CAS | `longitudinal-store.test.ts` › criterion 8 (N vs M, stale publish, corrupt bytes → `snapshot_invalid`) |
| 9 denominators | `longitudinal-contract.test.ts` › late first opportunity reads all prior decisions; prefix cut |
| 10 import boundary | `longitudinal-contract.test.ts` › criterion 10; store › `game` filter |
| 11 rebuild equality | `longitudinal-store.test.ts` › criterion 11; `longitudinal-worker.test.ts` › operator doors (CLI red on tamper, `--write` repairs) |
| 12 revision pair | `longitudinal-contract.test.ts` › criterion 12 (registry digest + real-boundary fixture-output digest; zero-incidence addition moves digest) |
| 13 read honesty | `longitudinal-store.test.ts` › N→M race, actor/unparsed refusal, filters; contract › branded parser |
| 14 boundaries/privacy | `longitudinal-worker.test.ts` › reachability (both directions, direct-reader census); store › learner deletion + retained shared run + rebuild → zero rows under learner and `__legacy`, per-run deletion |
| 15 performance | background-only; `longitudinal-worker-performance.test.ts` |
| 16 worker reach | `longitudinal-worker.test.ts` › production-composed worker; `longitudinal-worker-performance.test.ts` |
| 17, 30 retained falsifiers | `make longitudinal-store-tenth-fresh-review` green (the eighth review's "production has none" assertion inverted, see below) |
| 18 phase closure | contract › four phases through the classifier; store › four phases through both tables and the typed filter |
| 19 normative projector | contract › imported mainline/fork, first/duplicate prediction, phase source, root counters, group mapping control |
| 20 lease liveness | store › renewal across the 30 s boundary; timer-only heartbeat loses the lease |
| 21 eligible history | store › jobless / complete / later-created census |
| 22 upgrade population | store › native/imported/shared queued, rollback/restart idempotent, suppressed absent; worker › app reconciles an old DB before ready |
| 23 run-owner provenance | store › crossed rows, `ON UPDATE RESTRICT`, fenced old-owner claim, legacy vs new private |
| 24 revision replacement | store › wrong-revision replacement |
| 25 bounded failure | store › exact 5/10 s and 5/10/20/40 s backoff, 1/3/5 quarantine, survives poll/restart, reopens only on source change |
| 26 per-cut grain | store › two quarantines, two retry deadlines, four unavailable causes |
| 27 database identity | worker › `:memory:`/`file:` refused, path disagreement refused, `disabled_test` helper unreachable from `main.ts` |
| 28 source digest authority | contract › sealed-only, order-invariant, input-sensitive; store › store-scoped with equal-content equal digest |
| 29 built lifecycle | worker › degraded 503 on exit, missing artifact, drain; `tools/verify-packaging.mjs`; `make test-browser-smoke` starts `dist/main.js` against a temp file DB |
| 31 durable authority | store › all of the above over real file-backed SQLite with two connections |

Tenth-return defects: [[D2994]] criterion 6; [[D2995]] seven-writer idempotence + same-head
taint; [[D2996]] stored-head-only watermark; [[D2997]]/[[D2998]] closed job union + SQL constraint
tests; [[D2999]] claim/renew/fail/publish tests; [[D3000]] authorship matrix (store + contract);
[[D3001]] V4 domain assertion.

## Measurements

- 80-ply fixed-corpus arm in the worker while `/healthz` is probed at 20 Hz for 30.0 s:
  599 probes, event-loop delay p95 **11.3 ms**, max **19.7 ms**, slowest probe **14.4 ms**,
  **16** in-loop renewals, one publication, 40 `game` decisions. The same projector on the main
  thread blocks the loop for more than the 250 ms budget (able-to-fail control).

## RFC corrections (inline, changelog 2026-09-24)

1. Registry closure is over exact version-1 refs; the recorded-path v2 successors are outside
   revision 1.
2. Job DDL CHECKs mirror the parser exactly (instants compared with `IS`, so an unparseable value
   cannot slip through a NULL comparison).
3. One journal × disposition authorship matrix; predictions only on `single_player`.
4. `deleteOwnedRun` uses the same suppression as account deletion.
5. Idempotent migration body; unreplayable bytes quarantine at watermark time.
6. Projector is an operand of rebuild; the HTTP module graph never reaches the adapters.
7. The "monotone head" is the stored head with no caller cut; a shortened stored log re-requests
   its exact head.

## Also fixed on the way

`make verify-content` was red at main: `refusal-coverage.test.ts` found the bot-policy result codes
(`OPPONENT_*`, `BOT_PROFILE_INVALID`) from `ae13a523` without a direct test disposition. Added
`packages/runtime/src/bot-opponent-ply.test.ts` and one assertion in `bot-profile-catalog.test.ts`.

The eighth fresh review's D2781 assertion that production `storage.ts` contains no watermark call
is inverted to its landed form, keeping `make longitudinal-store-tenth-fresh-review` green.

## Remains

- The Active-row status, archive move, `design/BACKLOG.md` rows, `planning/exploration/log.md`
  entry and roadmap flow-back (`planning/roadmap-1.0*.json`, whose receipt digests this change
  moves) are the register owner's consolidation step.
- A container smoke (`docker build` + `/healthz` ready from the copied `dist`) was not run here; the
  image copies the whole server dist and `verify-packaging` checks the entry and its reference.
- Discharge D2 (import subject provenance) stays open; consumers enforce the revision-1 refusal.
- Consumers (player-style, skills, campaign, Review focus) are out of scope and read only through
  `application.longitudinal.read`.
- `make longitudinal-store-fresh-review` (the 2026-08-30 review's text assertions) was already red at
  main because the RFC text moved on; it is historical evidence, not a gate.
