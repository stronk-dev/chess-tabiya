# Pack capability contract — sixth fresh independent buildability review

- **Date:** 2026-09-02
- **Artifact:** `rfc/pack-capability-contract.md` after the [[D2429]]–[[D2431]] sixth author repair
- **Verdict:** return to author on [[D2509]]–[[D2512]]
- **Executable review:** `make pack-capability-sixth-fresh-review` — 4/4
- **Author controls:** `make pack-capability-author-contract` — 7 + 11 + 6 + 7 + 6 + 3 arms, cumulative artifact compiler, and both strict TypeScript models pass
- **Production authorization:** none; [[D560]] remains whole

## What survived

The repair closes the three shapes the fifth review returned. Pack, position and imported session
sources are no longer interchangeable in the proposed type; the public projection carries the safe
four-way availability class needed to reject impossible transient states; and the author contract
has one operation-id spelling rather than the earlier dotted/snake-case split. The cumulative
schema-transition, applicability, history, refusal and public-wire authorities remain green.

The failure is one level outward: the new operation table is internally coherent but is not the
production operation population it claims to close.

## Blocking findings

### D2509 — the sole pack-registration row is not a production route

The normative table and `CapabilityRouteBranch.route` name
`POST /studio/drafts/:draftId/register`. Production parses
`/^\/packs\/drafts\/([^/]+)(?:\/(lint|playtest|register|withdraw))?$/` in
`apps/server/src/rest.ts` and calls `studio.register` only for
`POST /packs/drafts/:draftId/register`. `/studio/drafts` occurs nowhere in the router.

The sixth-author test checks only that the invented route is present in the RFC. A generated
resolver can therefore be total over all 32 declared rows while the live registration route never
resolves one. The table must be generated or checked against the real route authority, and the
wrong prefix must remain a negative fixture.

### D2510 — the declared method/route population excludes live capability operations

`CapabilityRouteBranch.method` admits only `POST | PUT`, so the proposed source cannot express
provider-bearing GET operations or DELETE mutations. The live surface includes at least:

- `GET /runs/:runId/human-split`, which calls the opponent selector;
- `GET /runs/:runId/corpus`, which calls the corpus provider;
- `GET /runs/:runId/story` and the public story path, which can enqueue missing engine evidence;
- `DELETE /runs/:runId/share/:token`, which mutates durable sharing state;
- `POST /rated-games`, whose creation performs the calibrated opponent handshake;
- `POST /packs/drafts/:draftId/playtest`, which creates a pack run; and
- `POST /repertoires/:id/gaps/enter`, which creates a position run through
  `createRepertoireGapRun`.

Two rows present in the table are also assigned the wrong creation posture: `run.flip` calls
`createRun` directly for a new position session, while `run.duplicate` calls `this.create` for a new
pack or position session; both are fixed to `source:none`.

This is not a request to census every API indiscriminately. The RFC itself defines the bounded set
as capability-sensitive creation/provider operations plus mutating-run operations and promises that
adding one fails set equality. That population must be derived from the real router/service call
graph, with explicit executable exclusions. A method union that cannot represent known members
cannot be its authority.

### D2511 — `run.group` loses its body-dependent provider source

The table assigns every `POST /runs/:runId/group` request to `none` and carries no `/source`
discriminant. In `RunService.createGroup`, `hand_picked` and `authored` are local, but
`human_replies` calls `OpponentSelector.select` and `engine_top_n` calls
`OpponentSelector.enumerate` before branches and the distribution are saved. Provider failure on
those two arms therefore bypasses the promised pre-write capability check.

The four source values must enter the same generated branch authority, with exactly two local and
two provider-bearing outcomes. A route-level `none` row is not conservative; it is a provider
bypass.

### D2512 — two absence causes were collapsed into one consumer effect

The RFC correctly preserves the owner's [[D1077]] ruling that a missing capability has two causes:
unsupported at startup or temporarily unreachable after configuration. It also says it reuses the
shipped `ProviderOffBehavior = available | honest_empty | unavailable`. But the operation contract
does not carry `providerOff`, and its only transient rule is HTTP 503 for every miss.

Those are different axes. The cause can remain `temporarily_unavailable` while the consumer's
declared effect is honest empty. Production already relies on that distinction: Syzygy and corpus
consumers declare `honest_empty`, and `branchDecidedness` records per-branch
`provider_unavailable` rather than failing the whole request. Replacing that behavior with a
blanket 503 is a product change not contained in [[D1077]]. Each operation must derive its compiled
consumer/provider-off policy and choose retryable failure versus honest-empty output from that
authority.

## Required next pass

Repair the literal registration route; derive the complete bounded operation population from live
router/service authorities (including GET/DELETE and every run-creation path); split `run.group` by
its source discriminant; and preserve provider-off behavior independently from reachability cause.
The next author contract must be able to fail on a new production route/provider call without first
editing its own expected list.

No schema, registry, migration, pack, API, client, runtime enforcement or content implementation is
authorized from this returned draft.
