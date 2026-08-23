# Campaign state-fold implementation return

**RFC:** `rfc/campaign-core.md`  
**Date:** 2026-08-23  
**Scope:** the migration-independent event grammar and deterministic roll-up

## Return — abandoned has no event authority

Section 4.2 says `CampaignRunState.status` is `active | completed | abandoned` and that the state
is computed by folding `campaign_events` in sequence order. Section 6 closes `kind` at
`node_entered | node_sealed | charge_earned | charge_spent | module_unlocked`. None can record a
campaign run being abandoned.

The adjacent table does carry `campaign_runs.status`, including `abandoned`. Therefore exactly one
of these contracts can be true:

1. state is event-rebuilt, in which case the event vocabulary needs a campaign-abandoned event; or
2. lifecycle status is a second stored authority, in which case `campaignRunState` must take and
   validate it explicitly rather than claiming event-only reconstruction.

The checkpoint uses the second shape because it matches the accepted SQL without widening the
closed event enum. The fold requires `recordedStatus: "active" | "abandoned"`; nine layer seals
derive `completed` and cannot be overridden back to abandoned. This is an implementation boundary,
not a ruling. The author must pin one shape before the persistence migration lands and add an
abandoned-run rebuild fixture.

There is a second closed-shape omission: `cursor` is the first unsealed layer, but after the ninth
seal there is no such layer and the shown type does not admit `null`. The checkpoint uses `null`
for completed or abandoned state. The author must pin that representation before the state becomes
an HTTP payload.

## Work that remains executable

- closed event payload types;
- pure sequence fold for node seals, earned/spent charges and unlock inventory;
- first-unsealed-layer cursor and nine-seal completion;
- any-verdict unlock behavior and prestige eligibility as a projection;
- rebuild byte-equality and able-to-fail corruption fixtures.

No schema, migration, route, surface or authored campaign content is touched by this checkpoint.

## Checkpoint landed

The pure runtime fold now implements the executable subset above. It exposes the closed event
payload union, derives the first unsealed layer and nine-seal completion, accounts for starting,
earned and spent charges without permitting a negative balance, applies authored starting modules
and any-verdict reward unlocks, and projects prestige solely from recorded seal verdicts.

Its refusal surface covers non-contiguous sequences, unknown and out-of-order nodes, seals without
the matching active encounter, duplicate seals and grants, forged charge amounts and unlocks,
spending outside the active encounter, exhausted rewinds, and completed/abandoned conflicts. The
focused fixture also rebuilds an entire nine-node run from cloned event bytes and gets an identical
projection. D1233 and D1234 remain author returns; this checkpoint does not convert either choice
into an HTTP or storage contract.
