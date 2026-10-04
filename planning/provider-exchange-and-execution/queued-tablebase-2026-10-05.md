# Queued tablebase source admission

D3377 fixes the durable tablebase worker under provider-exchange §§7/10 and
evidence-job-durability §2. It prevents an exact result for another position from
being relabelled with the job's FEN and attached to a learner's run.

The worker admits one sealed source through the registered
`runtime.queued_tablebase@1` consumer before adapting it to the existing durable
packet. The consumer accepts only `live.syzygy.position_result@2`, requires the
shared delivery authority, and matches both the requested and payload full FEN,
including clocks. A modern source failure never retries through bare `probe`.
Standalone sources without a modern method retain their explicit compatibility path.

The source binding declares required/operation_unavailable. Existing durable
origin-specific settlement, leases, cancellation, retries, attachment and packet
fields remain unchanged. This does not migrate the persisted packet to whole-source
storage or complete either RFC.

## Permanent controls

Six controls reproduce the predecessor's failure: a genuine source whose bare
method refuses, another position, changed halfmove and fullmove clocks, a copied
source and a source failure. They use the actual scheduler, parser, factory, SQLite
worker and result page. The positive also attaches through the real HTTP route after
the existing disclosure boundary opens. The negative arms produce no staged result
or attachment and never invoke bare fallback. These are controlled provider responses,
not native tablebase accuracy or latency measurements.

`make queued-tablebase-check` passes 134 tests across seven files, including the existing
durability, cancellation, shutdown and standalone controls and actual consumer census.

## Compatibility maintenance

The canonical preservation proof against `ca2770f5` retains all 892 declarations and
appends seven v11 successors. It preserves all 275 factory outcomes and introduces
no factory profile. Only requirement stamps in 104 pack/example/fixture documents and
pack digests in 68 ledgers change. All authored fields and 192 other source documents
remain unchanged, as do guard/objective computations and opponent selection.
This is compatibility maintenance, not content expansion or pack graduation.

## Verification

The final exact-index `make staged-software-contracts` passes at
`37c1957cc83d787e71100663076bd33c9bb570ef`: 2,898 software tests across 325 files,
seven isolated performance tests across four files, zero type errors/Svelte warnings,
and downstream build, packaging, source/value/history, lifecycle and migration checks.
The 352-document migration plan has no outstanding rows. Semantic validation remains
38/38 cases with zero fully passed subject profiles; independent semantic validation
completion is not claimed. Product, test, content, schema and tooling bytes remain
frozen after this snapshot. Only tracking, documentation and receipts follow.

The first full snapshot failed on a stale direct-probe gateway census and seven stale
generated declarations. The census now reads the actual admission boundary, retains
exact operation coverage, and the canonical declarations are regenerated. The negative
software receipt remains separate from the final passed receipt; assertions were not
weakened to suppress the failure.

Real-content verification passes 223 tests/23 files, zero clearance errors and all
104 exact requirements. Browser CI passes 111 journeys (56 ordinary, 5 content,
49 matrix and 1 packaged), with one optional real-Maia latency skip and zero retries.
Complete governance passes. Final exact-index process checks and normal commit hooks
follow with no further source changes. Only D3377 closes; the full 1.0 goal remains active.
