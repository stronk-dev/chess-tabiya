# Open-answer grading implementation plan

Status: implemented

1. Widen the pack and run contracts to `stated_reasoning` and `reasoning.recorded`; add shared validation, deterministic matching, and frozen-literal migration 17.
2. Add recording, occurrence-scoped disclosure, the grant-scoped reasoning projection, previous-attempt lookup, and the optional quotation-only comparator.
3. Add the checkpoint form and coverage/previous-attempt presentation without scores, ratios, verdicts, or approval colour semantics.
4. Exercise schema, replay integrity, privacy, disclosure, matcher, server, browser, migration, and regression acceptance criteria.
5. Reconcile canonical docs, archive the lifecycle, and rerun both gates at zero retries.

Implementation correction from review: the shipped lease model permits an active-writer participant to write. Recording is therefore active-writer scoped; spectators remain read-only. This preserves coached participant use and follows the actual authorization contract.
