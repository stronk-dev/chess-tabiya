# Guided Hint shipping-cadence repair — D3496

Authority: implementing `rfc/hint-distance.md` §7 / §10. This repairs the existing
production hint seat, not the draft semantic-consequence-search service or its
five-approach cost calibration.

## Predecessor and repair

The shipping seat waited 350 ms before its first and subsequent polls. Most
mounted tests supplied `pollIntervalMs: 1`, so they did not exercise that delay.
Four no-override fake-clock controls, with a result ready at 0 / 99 / 101 / 351 ms,
all failed against the predecessor: none rendered within the following 100 ms.
A fifth control failed its expected shipping poll count (200 versus 700).

The seat now waits 100 ms between polls. Its original 70-second pending window
(200 × 350 ms) is separate from cadence, bounded by both an elapsed-time deadline
and 700 polls at the default cadence. This adds up to ten GETs per second while
one explicitly requested hint is pending, rather than the former ~2.9; there is
still no proactive request, overlapping GET, autonomous retry or rung advancement.
Slow transport counts toward the deadline. An already in-flight transport can
finish after it; this is not a transport-level timeout or availability guarantee.

The response/parser/disclosure, source, per-kind ceilings, optional voice,
server service and application-lifetime candidate cache are unchanged. Poll
exhaustion retains the exact operation identity for retry/reset/teardown rather
than fabricating a server failure or leaving a second search running.

## Permanent controls

`make guided-hint-client-check` uses the configured Node 24 runtime and the
software-contract tier. All 25 mounted/wire cases pass, including seven new cases:

- the four shipping-default ready offsets above;
- still pending at 69,999 ms, locally exhausted at 70,000 ms, 700 polls, one POST,
  no autonomous DELETE/retry, and exact-id teardown;
- 500 ms poll round trips: 117 polls finish at 70,200 ms, then no further GET;
- teardown during the initial default wait: exact-id cancellation and no poll or
  late sentence.

Existing explicit retry/exhaustion controls now use the shipping default rather
than a 1 ms override. `make guided-hint-lifetime-check` passes 78 cases across
four files and clean types, including authenticated service/voice cancellation
and fallback controls. A sandboxed attempt could not bind its local HTTP server;
the same normal Make target passed with loopback access. No product assertion or
timeout was weakened to handle that environment failure.

`make verify-software` terminates zero: clean types, 3,336 cases / 343 files,
seven isolated performance cases / four files, scaffold/packaging/release policy,
presentation/manifest/value/semantic/candidate/opening checks and downstream
account/style/capability/migration/composition contracts. Content contracts pass
227 cases / 23 files. `make test-browser` terminates zero: 144 passed, one optional
Maia skip, zero retries, and 112/112 successful composition cells, including real
hint ladder/retry and final-permitted-rung journeys.

`make verify-governance` also terminates zero. Final exact-index governance,
append-only log and ordinary commit hooks follow the tracker closeout; no push or
fresh GitHub run is claimed. Unrelated D872 edits and untracked files are excluded.

Fake-clock tests are deterministic regressions, not measured
real-engine/HTTP/browser p95 latency. The §10/D7 integrated receipt, D3262 actual
cold/warm/offline five-approach cost, full RFC and full 1.0 remain open.
