# Shared candidate packet — eleventh author repair

- **Date:** 2026-09-06
- **Repairs:** [[D2860]]–[[D2863]]
- **Gate:** `make candidate-packet-eleventh-author-repair`
- **Verdict:** positive author evidence; genuinely fresh independent review and the draft
  `evidence-value-authority` dependency still precede acceptance

## Composed operation

The maintained TypeScript model now carries the earlier production-backed evidence graph through
the complete request-time operation instead of leaving the implementation merge implicit:

- one public asynchronous service owns bounded cache, same-key single-flight, FIFO admission,
  caller cancellation, queue/compile deadlines, close, stats and typed result/failure arms;
- collector execution is candidate-local and dependency ordered, sliced at the configured group
  bound, and yields through `MessageChannel` with abort checks around each boundary;
- scheduler rejection is a typed failure and a compiler that finishes after its deadline cannot
  mutate the cache;
- all seven packet identity terms are retained next to the exact legal population;
- every declared collector projection retains a sealed move-addressed total result, preserving the
  difference between available-empty and unavailable and deriving abstention from the latter;
- checkmate and stalemate retain distinct terminal reasons while a playable position may not emit
  an empty population.

## Executed result

`make candidate-packet-eleventh-author-repair` retains the complete historical packet chain, passes
8/8 new behavioral groups, and passes strict TypeScript. The new groups cover exact identity,
projection completeness, available-empty, checkmate/stalemate, direct and projected cache hits,
single-flight with waiter-local cancellation, overload and both deadlines, late-result
non-publication, scheduler failure, close and exact cooperative-yield accounting.

No runtime packet/service, application route, learner module, bot policy, schema, migration,
content, archive or protected-design byte changed. A genuinely fresh review must attack this one
composed checkpoint before the RFC can be accepted.
