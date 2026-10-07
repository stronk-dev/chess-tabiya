# Theory HTTP test response ownership — 2026-10-07

Question: [[D3511]], a scoped fixture defect discovered while investigating
[[D3510]]. This is software-test hygiene, not a new product feature or an
explanation of the earlier intermittent timeout.

## Observed boundary and repair

At predecessor `33dae630`, the sixteen authenticated supplied-Theory scenarios
in `apps/server/src/provider-corpus.test.ts` inspect several real `fetch` statuses
without consuming or cancelling the original response bodies. Run creation reads
a clone but leaves the original body unused; later assertions unnecessarily read
both a clone and the original. These patterns are directly visible in that
predecessor's fixture. [V]

The [official Undici guidance](https://github.com/nodejs/undici#garbage-collection)
requires explicit response-body consumption or cancellation instead of relying on
Node garbage collection, which can impair connection reuse or produce stalls. [V]
This establishes a fixture ownership defect, **not** that it caused D3510.

Each normal Theory response now has one original-body read. Assertions that need
JSON or diagnostic text reuse that same read. Status-only assertions use the
test-only `responseStatus` helper, which awaits the original body and propagates
its failure. The delayed-source race consumes an unexpected early refusal, but
leaves the expected response to its main assertion once acquisition has started.
The intentional caller-disconnect arm still tests an aborted real request. [V]

All sixteen existing source, authentication, disclosure, composition, refusal and
cancellation scenarios remain. No production application/provider/server lifecycle,
global dispatcher, keep-alive setting, timeout or assertion is weakened. In
particular, normal server shutdown is retained rather than force-closing active
connections; the [Node 24 HTTP contract](https://nodejs.org/docs/latest-v24.x/api/http.html#serverclosecallback)
distinguishes normal shutdown from forceful connection termination. [V]

## Permanent controls and verification

`apps/server/src/http-response.test.ts` adds five controls: unfinished stream bodies
cannot count as delivery; body errors propagate despite successful headers; empty
responses preserve status; request errors propagate; and a real loopback streaming
HTTP response must finish before the helper resolves and normal server shutdown
completes. The last control uses native `fetch` and a real HTTP server, not a mocked
transport or a global test-client replacement. [V]

- Normal `make theory-source-check` terminates zero: **120 tests / five files**,
  including the original sixteen Theory scenarios and all five ownership controls.
- Fresh full `make verify-software` terminates zero: clean types, **3,403 software
  tests / 345 files**, seven isolated performance tests / four files, build and
  downstream packaging/release/presentation/manifest/value/validation/capability/
  migration/matrix/retained-Hint checks. This is the current run, not an earlier
  checkpoint's green result.
- Normal `make roadmap-receipt verify-governance` terminates zero: all 1,691 live
  ledger rows are assigned and routed, zero are untriaged, and current roadmap,
  receipt, register, history, intent, tier, docs and process contracts pass.
  Exact-index commit checks run before the scoped checkpoint; unrelated changes
  remain unstaged.

Only D3511 closes. These controls prove response ownership and error propagation. They do not
reproduce the original 30-second D3510 failure, prove its cause, or supply a GitHub,
browser, content, native-release or full-1.0 completion result. D3510 remains doing
until its last-boundary diagnostic locates the stall and a causal repair is proved.

## Search and shared-worktree custody

The original six-setting recursive depth-twelve search capture remains live on its
original handle. No unfinished setting is added to the completed population, no
capture is restarted and none of its eighteen executor sources is changed by this
test-only repair. Other workers' visible changes remain outside the commit.
Routine metadata, hashes, canonical work state and roadmap receipts are maintained
automatically; they are not new owner decisions.
