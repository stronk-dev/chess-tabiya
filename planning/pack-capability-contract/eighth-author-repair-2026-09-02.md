# Pack capability eighth author repair — 2026-09-02

## Verdict

The seventh return is repaired at RFC tier. D2518–D2520 are contract-complete, but F3 remains
draft: a genuinely fresh reviewer must attack the repaired public-token dispatch, queued-provider
population and durable job lifecycle before acceptance or implementation.

No production, storage, schema, API, client, pack, content or archive byte changed.

## D2518 — public HTML route

The seventh image contained the API Story route and omitted the browser route that calls the same
service operation. The repaired image resolves the token once and contains two disjoint branches:

- `story_read` → `story.public` / `review.story_evidence`;
- `session_join` → `shared.join_page` / `none`.

The route population is now 48 run branches plus 12 external branches: 60 HTTP branches over 59
unique ids. A Story failure is no longer permitted to select the join branch by exception.

## D2519 — queued provider population

The request gateway census is retained and a separate worker population is added:

- `evidence.stockfish_analysis` → `EvidenceExecutor.execute` for bestline/eval/WDL;
- `evidence.tablebase_probe` → `TablebaseSource.probe` for tablebase.

Three sealed origins own all production enqueue calls: explicit analysis, Story completion and run
enrichment. They fix their consumer and provider-off effect; callers cannot supply those values.

## D2520 — admitted is not settled

The contract now claims one migration position behind `longitudinal-store` for `evidence_jobs`.
The row survives restart through admitted, leased-running and retry-wait states; terminal states are
success, honest empty, unavailable, caller/supersession cancellation and consumed success.
Provider-health owns the acquisition/failure receipt vocabulary. Shutdown and expired leases
return work to retry rather than erasing it.

HTTP 202 means only that admission committed. Provider loss before admission can still synchronously
refuse; loss after 202 becomes a durable retry and then the consumer-specific terminal result.
Successful payload, acquisition receipt, per-run sequence and consumption are transactional with
the run event application.

## Executable author evidence

`make pack-capability-eighth-author-repair` checks:

1. the digest-pinned 60-branch public-route composition;
2. both worker gateways and all three enqueue origins;
3. the separate admitted/leased/settled state algebra, including negative TypeScript fixtures.

`make pack-capability-author-contract` includes this target cumulatively. These are author
falsifiers, not independent acceptance evidence.

## Next

Fresh review must derive the router and worker populations independently, exercise origin spoofing,
kill a provider on both sides of admission, close/reopen the database with admitted/running/retry
rows, and crash between settlement/event/consumption transitions. Any missing or duplicated work
returns the RFC again.
