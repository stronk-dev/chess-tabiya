# Shared candidate packet — twelfth fresh independent buildability review

- Date: 2026-09-06
- Reviewed: `rfc/shared-candidate-evidence-packet.md` after its eleventh author repair
- Verdict: **RETURNED** on [[D2885]]–[[D2891]]
- Executable receipt: `make candidate-packet-twelfth-fresh-review` — 7/7 new falsifiers plus strict TypeScript, with the complete predecessor chain retained
- Production effect: none; no runtime/server/client/schema/content implementation is authorized

## What survived

The eleventh repair genuinely composes the asynchronous service, candidate-local cooperative
collector execution, seven-term packet identity, projection-addressed total result shape,
abstentions, terminal distinction, single-flight, bounded queue/compile work, cancellation and
close behavior. This review does not reopen those predecessor findings merely because the current
checkpoint is returned.

## Fresh returns

1. **[[D2885]] crossed request/receipt authority.** The service passes its job request to the
   compiler, but admission checks only that the returned receipt is a genuine internally
   self-consistent receipt. The test fault seam returns a genuine `readings` receipt for an
   `events` request; the service resolves it as ready and caches the crossed receipt id. Receipt
   request identity must equal the active job identity before any publication.
2. **[[D2886]] queue timer survives admission.** `start(job)` marks a queued job active without
   clearing `job.queueTimer`. The old queue callback later calls `finish` even though the job is no
   longer queued, resolving an active compiler as a queue timeout and allowing another completion
   attempt after the compilation returns. Queue→active transition must transfer deadline ownership
   atomically and completion must be single-shot.
3. **[[D2887]] collector failure is unreachable.** The public failure union and criterion 28
   promise move/projection-addressed `collector_failed`. All non-scheduler compile errors instead
   become `invariant_failed:receipt`; no invocation preserves enough failure identity to construct
   the declared arm.
4. **[[D2888]] non-terminal-empty is green by construction.** For candidate count zero,
   `terminal()` returns checkmate when `isCheckmate()` and stalemate otherwise. The subsequent
   `terminalState === undefined` guard therefore cannot fail. An incomplete legal enumeration is
   relabelled stalemate rather than detected. Stalemate needs an independent predicate and the
   population invariant needs an able-to-fail control.
5. **[[D2889]] bounds measure the wrong retained root.** `admit` measures the private tenth-repair
   predecessor, then caches the enriched eleventh-repair receipt. The retained packet identity,
   terminal/result/abstention wrappers and execution projections are outside the measured root.
   The fixed control observes both `retainedObjects` and `retainedLogicalBytes` below the actual
   cached receipt graph.
6. **[[D2890]] projection hits are not LRU hits.** Direct hits delete and reinsert the Map entry;
   wide-to-narrow projection hits do not. With two entries, using A through a projected view and
   then admitting C evicts A before older B. Either every successful use refreshes recency or the
   RFC must name a policy other than LRU.
7. **[[D2891]] total result is reconstructed by a second chess computation.** While iterating the
   predecessor execution outcomes, `currentOutcomes` calls production `loosePieceEvents` again to
   infer unavailable. The predecessor flattened the result and the repair tries to recover it
   afterward. That creates two authorities and lets the recorded values and reconstructed status
   disagree. The registry invocation must preserve its exact total projection result.

## Buildability consequence

These are shared-service defects, not consumer-local polish. A bot, hint selector, Review compiler
or pack capability built now would either duplicate candidate work or inherit crossed identity,
incorrect failures and unenforced resource bounds. Keep the RFC draft. The next author repair must
compose the fixes in the current model, retain all historical controls, and receive another fresh
review before implementation; `evidence-value-authority` remains a separate dependency.
