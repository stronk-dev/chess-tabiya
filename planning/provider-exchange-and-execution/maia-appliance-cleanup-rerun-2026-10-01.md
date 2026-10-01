# Docker cleanup verification — 2026-10-01

Scope: owner asked whether their cleanup was sufficient. No additional host/cache cleanup,
provider change, content migration, publication or deployment was authorized or performed.

## Measured result

- Docker root available bytes: 11,161,088,000 (10.394573211669922 GiB), versus zero in
  `docker-storage-diagnostic-2026-10-01.json`. Read with the checksum-pinned Node image's
  `fs.statfsSync` in a disposable read-only, network-disabled container.
- Normal `make appliance-drill-staged` reran the committed Git-index source from HEAD
  `494baa4d439f1370a8f90489c93e709f28216064`, tree
  `fb4049f786f8254c6b1faa1c72af75162aff63fc`; no unstaged Explorer changes included.
- Actual source build, fresh storage initialization, TLS/account boundaries and native Maia
  readiness passed. The registered human-baseline.1400@1 bot replied e7e5 and d7d5 to the
  two learner branches; both retries were idempotent. Rewind/fork/comparison passed.
- Before intentional restart, actual cgroup peaks were server 468,230,144 bytes under its
  536,870,912-byte limit and Maia 286,285,824 under 1,610,612,736. No OOM or automatic
  restart occurred. This is one journey checkpoint, not steady-state capacity proof.
- Restarted HTTPS readiness and secure login passed. Resume then failed with a route-level
  404: the instrument asks `GET /runs/appliance-proof-run` and reads `.run`.
- `apps/server/src/rest.ts`'s `parseRunRoute` admits `/runs/:id/graph`, not a bare run path;
  that handler returns `{graph: service.graph(...)}`. `apps/web/src/lib/api.ts`'s `graph`
  method uses precisely that path and response. Thus this 404 is a probe-contract defect,
  not proof of lost durable state. No successful graph read after restart was obtained.
- Full journey result remains failed. Served-pack creation and the second memory-envelope
  observation were not reached. Post-restart logs also show Maia process_exit/startup
  transitions: restoration of provider health needs observing after the route correction;
  earlier successful bot replies do not discharge that separate restart observation.
- The UUID-owned project and learner/CA volumes were removed by the instrument's existing
  cleanup. No existing operator/learner resources were pruned.

Full output/identities/checks/negative and service states:
`maia-appliance-cleanup-rerun-2026-10-01.json`. Earlier disk and source-policy negatives are
retained, not rewritten.

## Tracking and next action

D3353 is closed on owner cleanup and measured successful fresh-volume startup. This is not
permission for an agent to prune any cache. D3354 (storage-error misclassification) remains
queued: freeing disk does not repair that code.

D3355 owns the resume instrument defect under the implementing deployment journey: bind the
probe to the existing graph route/shape, retain a permanent contract control, then rerun the
complete normal appliance journey without waiving restart, pack or either memory check.
D3349/D3352 remain open, now blocked by D3355 rather than the resolved disk condition;
D3338/D3342/D3347 remain open on their full-journey exits. No full capability, milestone or
RFC completion is claimed. This question-only turn changes tracking, not production code.
