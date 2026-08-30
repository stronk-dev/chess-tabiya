# Campaign core — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/campaign-core.md` after the two-horizon author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make campaign-two-horizon-fresh-review` — 10/10 blocker arms
- **Prior contract:** `make campaign-two-horizon-author-contract` remains green (19/19)
- **Production status:** untouched; no schema, migration, seed, endpoint or UI is authorized

The repair correctly establishes two horizons, typed rewards, path-wide opportunity checks,
event-owned abandonment, exact prestige and a complete learner journey as the intended product.
The fresh pass tested whether those statements compose into one writable, replayable production
contract. They do not yet. Ten seams remain, including three circularities at the final-node
transaction: the seal makes the run terminal before its mandatory trailing events, those trailing
events cannot write the advertised equipment state, and durable awards have no production caller.

## B1 — the final seal forbids its own trailing events ([[D2077]])

§4.1 requires one transaction to append `node_sealed`, then `charge_earned`, then an optional
`run_reward_acquired`. §4.2 derives completion as soon as the exact selected-layer seal denominator
is present and says no event may follow completion. On the ninth selected layer, the first append
therefore makes the next two required appends illegal.

**Required repair:** make the terminal transition one atomic semantic unit. Valid shapes include a
composite final-seal event, a non-terminal event bundle followed by an explicit terminal event, or a
fold rule that treats one transaction envelope as indivisible. Cross final nodes with and without a
run reward, injected failure at every append, replay, and a concurrent duplicate submit.

## B2 — equipment is promised but unwritable ([[D2078]])

The fold promises canonical `owned` and `equipped` identities, acquired items may require an
explicit `Equip` action, and `not_equipped` is a required visible reason. The complete
`campaign_events.kind` CHECK has no equipped/unequipped/loadout event, while `campaign_runs` has no
loadout column. Auto-equip cannot create the required not-equipped state and no later command can
change it.

**Required repair:** define event-owned loadout mutations (or remove equipment from 1.0). Specify
equip/unequip command idempotency, admissible reward families, fold order, ceiling/suppression
interaction, and rebuild fixtures. A visible action with no durable mutation is not a surface.

## B3 — a campaign run does not pin the document it replays ([[D2079]])

`campaign_runs` stores `campaign_id` and `campaign_version`; §6.1 nevertheless says the award
command consumes the pinned campaign-document digest. No row or event stores that digest or the
canonical document bytes. `CampaignRegistry` keys records only by id/version and does not prohibit a
same-version byte change across releases. Rebuild, restore and award validation can therefore read a
different reward graph from the one the learner played, or fail after the old document disappears.

**Required repair:** persist and validate an exact document digest and state how historical bytes
remain resolvable. Cross same-id/version mutation, document removal, restore under a newer release,
and digest mismatch. “A CampaignRun never migrates documents” must be enforced data, not prose.

## B4 — `resource_grant` has no fold effect ([[D2080]])

The reward union grants a positive number of campaign rewind charges, but the only charge algebra is
`starting + earned - spent`; `earned` is defined by the per-seal `charge_earned` events. There is no
resource-grant event or rule saying `run_reward_acquired.resource_grant.amount` increments that
balance. Its identity projection intentionally drops `amount`, so treating it as ordinary owned
inventory also loses the value.

**Required repair:** define one canonical charge ledger covering starting balance, act income,
reward income and spend, with source identity and exactly-once fold semantics. Cross two grants of
the same resource with different amounts, replay, rollback and boss spend.

## B5 — consumer closure depends on unnamed, returned foundations ([[D2081]])

§3.4 derives module consumers from a node pack's capabilities and theory consumers from an exact
published passage reachable from that pack. The dependency list names neither
`pack-capability-contract` nor `theory-drill-current-joins`; both are currently returned drafts, and
no shipped symbol computes either relation. The author contract's miniature model therefore proves
its own graph, not the production graph Campaign must consume.

**Required repair:** name the exact accepted producer contracts and exported symbols, serialize
Campaign behind them, and bind the validator to their compiled views. Honest-empty is valid for an
unavailable provider; invented pack→module or pack→passage reach is not.

## B6 — one module ceiling is applied to three different reward domains ([[D2082]])

The RFC says every owned module **or theory item** is projected through
`honesty ceiling ∩ owned ∩ equipped …`, but the live context ceiling is literally
`readonly ModuleId[]`. Theory passages are not module ids; resources are balances and are not
equipable at all. No typed rule says which module authorizes a theory passage, how passage
directness is bounded, or how `source_unavailable` differs from a disabled theory module.

**Required repair:** publish family-specific projections. Modules use the assistance ceiling;
theory uses an exact passage plus the registered theory consumer and disclosure ceiling; resources
use the charge ledger. Then define the composed shelf row without intersecting unlike identifiers.

## B7 — the RFC triggers its own run-identity reopen condition ([[D2083]])

§5.3 declines a run-schema campaign marker only until Review, export or longitudinal consumers need
per-run campaign identity. §7 requires “Review this encounter” and Review return; §6.2 requires
export; the 1.0 roadmap requires campaign games in the common Review Map. The condition is already
true inside this document, yet the claims block still declines the lane and specifies no equivalent
authoritative join contract for those consumers.

**Required repair:** either claim a stable run origin or define one exact campaign-side lookup/API
that Review, export and longitudinal readers all consume, including behavior after campaign-history
deletion and account restore. Cross direct Review URL, refresh, export/import and a plain non-campaign
run.

## B8 — the “complete route family” is not an API contract ([[D2084]])

Only four endpoint shapes occur: submit, abandon, node start and active lookup. The required journey
also needs campaign catalogue/read, campaign-run creation, map/state read, loadout mutation, result
read, award projection and Review handoff. Start and submit have no idempotency key or expected-head
contract even though abandon and award explicitly do; a lost response can create an orphan play run
or turn a successful submit retry into an error.

**Required repair:** specify a closed endpoint family with authenticated ownership, request/result/
error unions, expected revision and idempotency semantics for every mutation. Cross response-loss
retry, stale tab, concurrent start/submit/equip, forbidden learner and terminal run.

## B9 — durable awards have no production issuer ([[D2085]])

§6.1 defines a server-owned award command but names no route, final-seal hook, job, startup
reconciler or operator command that calls it. §4.1 completes the campaign without issuing awards,
while criterion 24 expects them to appear. Idempotency prevents duplicates; it does not guarantee
that the first invocation ever happens.

**Required repair:** bind award issuance to the terminal transition atomically, or persist a durable
job/outbox with retry and reconciliation. Cross a crash after completion but before award insertion,
restart, duplicate delivery and unavailable appearance catalog.

## B10 — a test seed is standing in for the authored 1.0 campaign ([[D2086]])

Criteria 1 and 24 use `seed-endgames.json`, Discharge D5 assigns implementation to Codex, and content
authoring beyond that seed is out of scope. Nothing requires the seed's nine pack choices, rewards,
suppression, progression or boss composition to be authored and reviewed as chess curriculum. A
mechanically convenient fixture can pass the complete browser journey while 1.0 still has no varied,
meaningful campaign—the exact checkbox completion the roadmap forbids.

**Required repair:** separate a deterministic non-product contract fixture from at least one
official authored campaign. Give the official campaign a human/owner content authority, provenance,
availability matrix and end-to-end acceptance over opening, middlegame and endgame consequences;
law 8 forbids Codex from inventing the chess curriculum.

## Re-review order

1. Repair the terminal event envelope, document pin and family-specific reward fold.
2. Bind Campaign to accepted pack-capability, module and theory producer contracts.
3. Define durable loadout, route/command and award-issuance boundaries.
4. Resolve the Review/export origin join.
5. Separate contract fixture from the authored 1.0 campaign and assign its content authority.
6. Invert all ten arms, preserve the 19 author checks, run full verification, then request another
   independent review.

No schema, migration, content, API, campaign state, award or UI implementation is authorized by
this return.
