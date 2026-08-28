# Review evidence compiler — author repair

**Date:** 2026-08-28

**Role:** RFC author; not the required independent buildability reviewer

**Scope:** D1644–D1651 and dependency defect D1969

## Outcome

The returned Review compiler has been amended without reducing the 1.0 surface. It still supplies
typed whole-game evidence and Story compatibility rather than choosing the final Review Map policy.
Implementation remains prohibited until the provider and recorded-path dependencies land and a
fresh independent review accepts the complete amended bytes.

## Repairs

1. The shared fixed-bound Stockfish operation now retains validated raw side-to-move WDL beside its
   typed White score. Review derives one node-free White normalization and separate recorded-node
   occurrences; it does not create a sixth provider operation or reuse legacy attached WDL.
2. Forced-mate v2 declares exact before/move/after operands and links only through the shared
   `run.record.edge@1`. V1 and wrong-position proofs cannot link.
3. Import completion and the actual `RunService.story()` route converge on one bounded
   `ReviewEvidenceCoordinator`, which uses the provider scheduler and progressively covers long
   games through completion callbacks.
4. The process-sealed packet has one named server consumer and terminates in a closed
   `review-story@1` receipt. The browser parses the receipt and never reconstructs an F1 seal.
5. Story converts White cp to learner perspective only at its compatibility consumer; mate remains
   typed and never receives a cp sentinel.
6. Eval point, WDL normalization/occurrence, cp delta and mate transition all remain
   measured/reported under the F1 weakest-input rule.

## New dependency finding

D1969 was found by tracing the Review promise into the provider result type: the single shared
position-evaluation operation had score but no WDL. Dropping WDL would make Review narrower than the
1.0 exit; a second operation would duplicate engine authority and cost. The dependency amendment
therefore extends the existing result from the same completed Stockfish exchange and keeps the
five-operation provider census unchanged.

## Able-to-fail contract

`make review-evidence-author-contract` crosses node-free WDL reuse, v2 exact proof occurrence,
bounded eventual scheduling, learner-side symmetry, closed JSON and weakest-confidence text. The
existing provider author target also crosses valid/malformed WDL while retaining exactly five
operations. These are author instruments only; independent review must attack their assumptions.

## Next gate

Run the focused author targets and full repository verification, then send both amended RFCs through
fresh independent review. Do not implement Review, the provider exchange or proof v2 from this
author pass alone.
