# Exact calculation admission and successful completion

D3424/D3425 repair the existing `evidence-job-durability.md` §2 calculation path. This does not
complete the full calculation recovery journey or the underlying provider/source migrations.

The API parses the actual 202 response against the literal frozen 1–16 distinct requested nodes.
The batch id and each ordered job's id/node/kind survive. Missing/duplicate/crossed fields, another
success status or an invalid requested population refuse before local pending state changes.
The store repeats that join at its API boundary, serializes admission behind evidence application,
and retains pending job identities across ordinary run mutations. Automatic or old engine facts
cannot discharge an explicit job: only the exact engine bestline job/node attachment does.

The mounted Support button follows actual pending jobs, not a forever-set request flag. Request
refusal/exception releases the local admission flag; successful admission remains disabled while
its exact job awaits delivery, then becomes usable again. Existing recorded calculations remain
available independently and do not impersonate a fresh request's completion.

## Able-to-fail evidence

The first genuine predecessor run exposed the receipt, mutation and mounted-control defects.
One initial timing-policy fixture was corrected before counting its failure; it is not evidence
of a product defect. After the repair, three controlled predecessor behaviors (unchecked API
JSON/status, scalar-only pending increment, sticky local flag) produce **22 failures / 128 passes**
in the final permanent suite, including authenticated HTTP/SQLite and mounted UI. Restoring the
fixed bytes passes the normal gate with 150 tests/six files and warning-free workspace types.
These controlled mutations affect owned live files only and are fully restored before broad gates.

The HTTP test starts the production application with file-backed SQLite and a labelled mock
provider, registers an owner, uses the actual DrillApi/RunStateStore to create/reveal/request/move,
checks the exact stored batch/job receipt, then polls and applies through the real authenticated
routes until the root job's own evidence attaches. Anonymous evidence reads refuse. It proves the
application contract, not real-engine chess quality, latency or a new source authority.

The built browser requests two real calculations at the same position. It holds delivery pages
without advancing their cursor, checks Preparing even when the first calculation is already
recorded, then releases delivery and observes a usable button after each request. Both exact job
attachments occur once in the authenticated event history; batch and job identities differ.

## Missing terminal/reload contract — D3426

The durable store retains terminal unavailable/cancelled rows, but the public evidence page
exposes successful result sequences only. The client cannot infer those terminal states, recover
root-only pending admission after reload, or safely choose a retry identity from that page.
The owning RFC must specify the authenticated exact-batch status/redaction/resume/retry join,
including real request/node/origin identities and pending versus terminal semantics. This pass
does not invent an endpoint, persistence lane, permission policy or timer-based failure.

## Closeout scope

Exact-index `make staged-software-contracts` exits 0 at tested tree
`f78e1df30629410c3927f762d5ca8034873a8b44`: 3216 software tests/338 files, seven isolated
performance tests/four files, warning-free workspace types and the downstream build, packaging,
release-policy, evidence, capability, history and migration gates. All 970 declarations remain
current; migration planning needs zero content, refusal or ledger re-stamp changes. Proof:
`planning/evidence-job-durability/calculation-client-software-2026-10-06.json`.
All twelve changed software/Make/browser paths remain byte-identical to that snapshot; later
documentation, proof and log bytes are checked separately rather than relabelled as its tested tree.

Complete `make verify-content` exits 0: 225 tests/23 files, 92 clearance documents with zero
errors and all 104 capability documents matching derived requirements. Fresh
`make test-browser-ci` exits 0: 122 passing journeys (67 smoke, five real-content, 49
viewport/input/accessibility matrix and one packaged-default), one existing optional real-Maia
skip and zero retries. The repeated-calculation journey passes within this complete sweep.
Complete `make verify-governance` exits 0: register/status/work-state/roadmap/intent, history,
test-tier, document-index and staged-process controls pass. All 1684 live ledger items are
routed, zero are untriaged or doing, and all 569 UX items remain assigned. Normal commit hooks
check the final staged documentation/tracker/log bytes.

No source factory, immutable declaration, schema, collector, grading convention, provider
selection, preset, authored content or protected intent changes. Existing job states and raw
success wire bytes remain unchanged. Only D3424/D3425 close; D3426, D3373 whole-source persistence
and complete manifest resolution/availability remain open. Full local gate results are appended
to the exploration log before commit; no push, GitHub success or released 1.0 is asserted.
