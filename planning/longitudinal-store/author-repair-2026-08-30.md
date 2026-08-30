# Longitudinal-store folded author repair — 2026-08-30

**Status:** author checkpoint; fresh independent buildability review required.

## Result

The six D1612–D1617 returns are folded into one normative section in
`rfc/longitudinal-store.md`. The older synchronous/two-table shape is explicitly historical and
non-normative, so implementation no longer chooses between two live contracts.

- D1612: `rfc/contracts/longitudinal-ingest-registry-v1.json` publishes all 67 exact versioned
  rows (46 edge, 13 population, 8 deferred path), including literal avoidance base joins, at raw
  digest `sha256:e12147750b512c83872f61dd7dc333e94e20c151876a3c2d3ef5f91c7e7fc21a`.
- D1613: the durable job has generation, opaque token, worker, lease expiry, closed failure codes,
  exclusive claim, expiry/reclaim and stale-publisher refusal.
- D1614: decisions are normalized per run/phase/class, independent of family incidence, so late
  first opportunities and later no-opportunity decisions retain the true denominator.
- D1615: every claim pins contiguous events 1..N and publication CASes the complete claim tuple;
  a newer request remains pending rather than being overwritten.
- D1616: the same-transaction scheduling closure is the exact seven production run-write methods;
  a post-transaction service projection does not count.
- D1617: revision-1 imported mainline rows are observed-only. Personal-play consumers remain
  barred until a durable `learner_asserted | observed_other | unknown` subject receipt lands.

## Verification

`make longitudinal-store-author-contract` checks the published registry bytes, count-preserving
wrong-base mutation, claim race/expiry/stale publication, exact prefix/newer request, denominator
late-first/retry/phase/rebuild equality, seven-operation omission, and import-subject arms.

No production schema, migration, worker, API, client, content or protected-design byte changes in
this author pass.
