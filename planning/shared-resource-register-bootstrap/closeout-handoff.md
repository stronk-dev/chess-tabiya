# Closeout handoff: shared-resource-register-bootstrap archival and its three D3 rebases

**Date:** 2026-09-24 · **By:** claude (worktree `agent-ad09667cb734eccf8`) · **For:** the
coordinator's merge closeout.

This landing was told not to edit `design/BACKLOG.md`, `planning/work-state.json`, the roadmap or
`planning/exploration/log.md`. Those edits belong in the merging commit, so each ledger row and
work-state record the landing resolves is routed here with its evidence and suggested disposition.
Status-parity P7 (archival without the ledger and log in the same change) and `make work-state` W5
(a blocker naming the now-archived RFC) stay red until that commit lands.

## Commits

| SHA | what |
|---|---|
| `2f2661bc` | `semantic-conventions` catalogue row, empty tuple, README register, 48-member claim ([[D2466]]) |
| `3ee872d6` | semantic-convention registry, history, 48 members landed, value-level receipts; EVA D1; [[D1921]]/[[D1929]] |
| `fc04c04d` | `assistance-config` and `workflow-preference` rows ([[D2454]]) |
| archive commit | `rfc/archive/shared-resource-register-bootstrap.md`, README Active→Archive row, D3 filled |

Earlier the same day: `67d208c6` was the `provider-protocol` rebase ([[D2455]]).

## Ledger rows resolved by these landings (suggest ✅ / `done`)

| id | evidence |
|---|---|
| [[D3034]] | collision-core bootstrap implemented and archived; all three staged rebases landed |
| [[D2454]] | `fc04c04d`: assistance registers rebased onto the catalogue |
| [[D2455]] | `67d208c6`: provider-protocol rebased onto the catalogue |
| [[D2466]] | `2f2661bc`: semantic conventions rebased onto the catalogue, with no C9/C10/`RESOURCE_NAMES` |
| [[D3085]], [[D3086]], [[D3087]] | bootstrap author self-audit repairs, executed by `parseResourceCatalogue` (regular committed file, unique schema slug, extension row shape) in `tools/register-check.test.mjs` §7 |
| [[D3116]], [[D3117]], [[D3118]], [[D3119]] | bootstrap fresh-review repairs (source aliasing, canonical lanes, id grammar, export checks), all in the §7 controls |
| [[D1921]] | the sole mint seals a value-level `ConventionReceipt` with every value (`3ee872d6`) |
| [[D1929]] | the recorded path's identity and receipt carry the registered convention closure (`3ee872d6`) |
| [[D1852]] | `semantic-conventions` is a checked register over a present tuple, with 48 landed members |
| [[D1918]] | a same-version meaning rewrite now fails against `evidence-convention-history.jsonl` (`make semantic-convention-history-check`), not against the member-only register |
| [[D1920]] | moot: the register count is catalogue data (twelve rows) and no longer a hand-counted `RESOURCE_NAMES` |

## Rows the rebase supersedes (suggest a supersede or refuse ruling, not ✅)

The assistance draft's review findings constrained a TypeScript-graph, adopted/absent,
first-parent engine. The implemented bootstrap removes that engine (§5), so none of them can apply
to the landed version-member registration. These findings are not fixed; the design they
constrained is gone. If a measured collision later needs semantic-delta coverage of config or
workflow graphs, they are the starting evidence.

[[D2450]], [[D2451]], [[D2452]], [[D2453]], [[D2465]], [[D2467]], [[D2328]], [[D2037]], [[D2038]],
[[D2113]], [[D2114]], [[D2115]], [[D2116]], [[D2117]], [[D2190]], [[D2191]], [[D2192]], [[D2193]],
[[D2355]], [[D2356]], [[D2357]], [[D2358]], [[D2359]], [[D2360]].

Two points are live, not moot, and are recorded in `rfc/assistance-config-register.md` §Deferred:

- The permission vocabulary now has five members ([[D2467]]'s four-member adoption is stale).
- The permission-contract and exchange roots can register present-first, as `provider-protocol`
  did ([[D2328]], [[D2452]]).

## Still open (re-block, do not close)

- [[D2363]] and [[D3082]]: absent-source admission is still unbuilt. Every rebase avoided needing it
  by creating the source first. Suggested blocker: `owner-ruling` or a successor RFC.
- The other `make work-state` W5 records blocked on `rfc:shared-resource-register-bootstrap.md`
  need a live blocker or a disposition: [[D2370]], [[D2401]], [[D2593]], [[D2597]], [[D2645]],
  [[D2649]], [[D2667]], [[D2672]], [[D2701]], [[D2708]], [[D2795]], [[D2796]], [[D2797]],
  [[D2798]], [[D2799]], [[D2800]], [[D2801]], [[D2828]], [[D2834]], [[D2843]], [[D2845]],
  [[D2854]], [[D2856]], [[D2956]], [[D2957]] and [[D2958]]. Most are findings against the withdrawn
  1,330-line engine, and [[D3034]] withdrew that architecture.
