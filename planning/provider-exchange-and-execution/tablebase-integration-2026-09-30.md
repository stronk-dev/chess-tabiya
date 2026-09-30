# Built-in learner Syzygy integration — 2026-09-30

Authority: already implementing `rfc/provider-exchange-and-execution.md` §7/criterion 9,
owner-directed implementation receipt of 2026-09-24, and the shipped provider-health contract.
Items: D3324 (production caller migration), D3325 (fractional-clock retention).

## Delivered boundary

- The built-in application now injects `ExchangeTablebaseSource` into opponent selection, run
  objectives and durable evidence collection. Its calls reach the application's single shared
  Syzygy descriptor, scheduler, registered parser and source factory. No private learner
  tablebase queue/cache/fetch/parser is added. Existing position/selection/evidence shapes remain.
- Health admission is inside descriptor execution, after local preflight and exact
  deduplication/retention. Per-execution HTTP status/Retry-After drives the existing shared Lichess
  coordinator; legal-move population validation precedes health success. The scheduler alone
  constructs receipts. No new evidence identity, chess judgement or source factory is minted.
- The shared retention inventory reports only per-operation counts/revisions. Insertions,
  removals, expiry, eviction and generation invalidation flow through it. Exact cached acquisitions
  survive an outage; unknown positions remain refused. Independent waiter deadlines and cancelled
  health-admission requests cannot turn into later network work.
- The authenticated production `/select-move` test runs with optional engines down, reaches
  the built-in tablebase, then receives the same acquisition through `application.providers` as
  `retained_exact`, with exactly one upstream call. The durable evidence queue has an independent
  shared-acquisition test. This proves callers, not only symbols or an exported helper.

## Original red controls and repair

The first production test received a second LIVE acquisition rather than retained data. The
deterministic fractional-clock control then reproduced zero retained entries. `#retain` required
`Number.isSafeInteger(now + TTL)`, which rejected ordinary production high-resolution samples.
It now requires finite advancing expiry, retaining the absolute/non-refreshing TTL and refusing
overflow or non-advancing precision loss. Both original controls pass after repair.

The first focused test addition refused the missing adapter module, demonstrating that no such
path existed before implementation. Sandbox-local HTTP binding required the normal gate's
permission prompt, not changed test commands or environment overrides. Typecheck's first run also
needed network permission for the pinned pnpm signature verification. No dependency pin or check
was relaxed. A raw-source clock census also caught a clock-call string in a comment; the comment
was corrected and the same census now additionally covers the new adapter.

## Verification

`make provider-exchange-check`: **82 tests/eight files passed**, including eleven new learner
tablebase tests and the fractional-clock scheduler test. `make typecheck`: zero errors, seven
existing Svelte warnings.

`make verify`: passed after the final production/health/cancellation changes:

- **2,694 software tests / 310 files**, seven isolated performance tests / four files, and
  **223 content tests / 23 files**.
- Scaffold/package/release, source/value/semantic contracts, account/opening/style/rating guards,
  register/status/intent/work-state/roadmap checks all pass.
- All **819 committed capability declarations** remain exact and match current source meaning;
  no capability regeneration or version rewrite was used.
- The fixed mechanical population remains 104 pack/schema documents, with zero compatibility
  migration debt in the separate 352-document planner population. No pack bytes changed here.
- Semantic validation remains **81 subjects, zero passed profiles**; the 38 retained cases pass.

`make test-browser-ci`: **56 smoke, five content, 49 matrix and one packaged-production test
passed**, one optional live-Maia latency test skipped, zero retries. This includes the 150 exact
endgame input cells and the unchanged Campaign/bot/Review/preset journeys. It is a local gate
result, not a remote CI claim.

## Not discharged

Supplied fixtures/custom sources and standalone `LichessTablebaseSource` tooling are not
silently migrated or relabelled. No legacy projection is retired. Existing legacy
Stockfish/Maia/Explorer callers, F1 execution metadata/path reach, authenticated availability,
Maia occurrence and Explorer summary projections remain open. Independent semantic authorities,
all 81 validation subjects' profile completion, official content and owner-use proof remain open.
No 1.0 capability or milestone is promoted by this checkpoint. No protected intent is falsified:
the provider-backed capability remains partial while its internal source path is improved.
