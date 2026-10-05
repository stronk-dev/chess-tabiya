# Calculation admission transport retry

D3427 implements the existing evidence-job-durability §2 client-retained retry key. It does not
complete the RFC, public terminal status, reload recovery, source migrations or the 1.0 goal.

## Production boundary

RunApi requires the key from RunStateStore. Each exact ordered node population retains one UUID
until the complete 202 admission has been validated. Transport errors and malformed/crossed
receipts retain it; different or reversed populations have separate keys. A validated admission
retires the key, so a later deliberate calculation gets a new key. Support reports uncertainty
(could not confirm), not the false assertion that an admitted request never started.

No background retry, local failure timer, browser persistence or server identity policy changes.
The server still compares canonical stored request bytes: a changed canonical request conflicts,
even if its public node list matches. This receipt does not claim recovery across arbitrary
mutable objective context, reload or unavailable/cancelled jobs; D3426 retains those contracts.

## Falsifiers and verification

Before repair, three permanent controls fail under the normal focused gate (149 pass): retained
canonical UUID through failure, independent ordered populations, and the real authenticated HTTP
journey. That journey lets the production server commit, then loses only its response; retry
previously created two distinct durable batches/jobs. After repair SQLite contains one explicit
analysis batch and the response repeats its original exact batch/job receipt.

`make analysis-client-check analysis-browser-check` exits zero: 152 tests across six files,
warning-free workspace types and two freshly built browser journeys. The new browser journey
aborts delivery only after actual server admission, explicitly retries with the same key/receipt,
then deliberately calculates again with a new key/batch. Authenticated history attaches each
exact successful job once. These are labelled mock-provider contract checks, not engine quality
or native performance evidence.

The first restricted HTTP attempt hit sandbox loopback EPERM; the normal Make gate ran with
loopback authority, not altered test semantics. An intermediate mounted fixture read the prior
identical alert before the second response settled; its permanent wait now observes copy,
enabled control and callback count together. No production timeout or guard was weakened.

Complete software/content/browser/governance results and exact-index proof append before commit.

## Full-gate CI debt — D3428

The first exact-index software run fails, not passes: tree
`634ef3593b1d723de39c3f6f3bb0f7d7335fd26a`, 3217 passing tests and one cold concept-registry
closure timeout. Its first consumer builds the entire real TypeScript project inside a five-second
assertion and takes 6612ms under the full pool. Downstream content/browser targets do not run after
that failure. Shared baseline compiler/receipt construction now runs in a bounded setup hook;
all six independent assertions and the separate counterfeit/dead/discarded/type-error programs
remain. Global timeouts are unchanged. `make concept-closure-check` passes all 12 tests.
The complete exact-index gate is rerun rather than accepting only that focused success.

## Replacement software/content gates

`make staged-software-contracts` exits zero at tested tree
`db992a0d1c666cac769e09893b221a306bc054dc`: 3218 software tests/338 files, seven isolated
performance tests/four files, warning-free workspace types and all downstream scaffold,
packaging, release-policy, evidence/source/value, semantic, capability/history and migration
checks. All 970 declarations remain current; migration planning requires zero content/refusal
edits or ledger re-stamps. Proof: `calculation-retry-software-2026-10-06.json`. All nine changed
software/Make/browser paths remain byte-identical to that snapshot; later docs, proof and log
bytes are verified separately, not relabelled as its tested tree.

`make verify-content` exits zero: 225 tests/23 files, 92 clearance documents with zero errors,
and all 104 capability documents matching their derived requirements.

The fresh complete `make test-browser-ci` exits zero: 123 passing journeys (68 smoke, five
content, 49 input/viewport/accessibility matrix and one packaged-default), one existing optional
real-Maia skip and zero retries. Both calculation journeys pass in the full sweep. Complete
`make verify-governance` passes; the final staged tracking/log boundary and normal commit hooks
are checked before commit. No GitHub success, publication or full 1.0 completion is asserted.
