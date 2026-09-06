# Shared candidate packet — thirteenth fresh independent buildability review

- Date: 2026-09-06
- Reviewed: `rfc/shared-candidate-evidence-packet.md` after its twelfth author repair
- Verdict: **RETURNED** on [[D2934]]–[[D2941]]
- Executable receipt: `make candidate-packet-thirteenth-fresh-review` — 8/8 fresh
  counterexamples plus the complete predecessor chain
- Production effect: none; no packet, cache, selector, bot, hint, Review, schema or content
  implementation is authorized

## What survived

The twelfth repair closes its seven named seams. Request/receipt identity is checked before
publication, queue authority transfers on admission, terminal states can differ, the enriched
receipt is the measured object, projection hits refresh recency, and collector outcomes are
retained from one invocation. This review does not reopen those fixes.

## Fresh returns

1. **[[D2934]] undeclared memo authority.** Both compiler paths pass every collector a frozen copy
   of the complete prior memo (`model.ts:236-267`), not the literal dependency image from its plan
   item. A collector can therefore depend on an earlier undeclared result without that dependency
   entering the registry graph, packet identity or review. Construct the memo from the plan item's
   declared dependencies and refuse an undeclared read.
2. **[[D2935]] invented projection precision.** A collector-wide throw is reported against
   `CANDIDATE_COLLECTOR_PROJECTION_KEYS[collectorId][0]` (`model.ts:188-201`). Several collectors
   declare multiple outputs, so this names a projection that need not have failed. Invocation
   failure must name the collector; only projection-local validation may name a projection.
3. **[[D2936]] abandoned-job rejoin.** Cancelling the final waiter aborts an active job but leaves
   it in the admission map until compilation observes the abort (`model.ts:559-605`). An equal new
   caller joins that irreversibly aborted generation and receives `failed:service_closed` from an
   open service; the failure counter also increments. Remove abandoned identity immediately or
   issue a new generation for later callers.
4. **[[D2937]] false request diagnosis.** The public parser catch maps every standard-rules parse
   error to `invalid_fen` (`model.ts:583-591`). A valid FEN with an unknown scope or extra key is
   therefore mislabeled. Preserve closed-request/scope error identity separately from FEN syntax.
5. **[[D2938]] process singleton charged per entry.** `measureRetainedReceipt` walks the public
   receipt root (`model.ts:399-404`), which includes `PRIMARY_EVIDENCE_MANIFEST`. Independent entry
   measures count that shared process singleton repeatedly even though the RFC excludes it from
   per-entry weight and calls the total exact. Measure the declared entry root and account shared
   roots once at service scope.
6. **[[D2939]] reader assertion omits exact joins.** The assertion checks seal, request digest and
   cardinality but never reasserts `legalMovesInput`, object identity between the legal map and
   flattened moves, candidate-row identity, UCI set equality or each move's `afterFen`
   (`model.ts:305-319`). A private constructor is not an independent integrity boundary. Retain and
   verify every exact join the RFC promises on every receipt read.
7. **[[D2940]] copied child-reading vocabulary.** Twenty output keys are hand-written locally
   (`model.ts:36-64`), while the positive author test derives its expectation from the same map.
   Adding or renaming a registered reading cannot fail the check. Generate the output image from
   the admitted collector/catalogue authority and compare it with an independently derived
   manifest set.
8. **[[D2941]] destination compiler mismatch.** The author's private “strict” config omits the
   repository's `exactOptionalPropertyTypes`. Under the real base contract, both assignments of
   `undefined` to `queueTimer?` fail with TS2412 (`model.ts:518,526`). The review target invokes the
   repository-compatible compiler config and requires both failures, so an author repair cannot
   hide them by weakening its local config.

## Buildability consequence

The packet is still the correct shared denominator for Support, bots and Review, but the current
model is not a safe authority boundary. It permits hidden collector dependencies, false typed
errors, poisoned single-flight generations, inexact cache accounting and incompletely asserted
receipts; it also does not compile under the destination package's rules. Keep the RFC in draft.
The next bounded author repair must retain the entire historical chain, close all eight seams in
one current model, compile under the repository configuration, and receive another genuinely fresh
review. The separate `evidence-value-authority` dependency still precedes implementation.
