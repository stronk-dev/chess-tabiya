# Campaign two-horizon contract — rewards that survive both the next preset and the next run

**Question:** what exact foundation can satisfy [[D1565]] without inventing reward labels, hiding
earned tools, or locking the standard educational path behind winning?

**Date:** 2026-08-26

**Verdict:** the returned `campaign-core` has enough real foundation to preserve, but not enough
authority to implement either horizon completely. `[V]` The run horizon can close over three
typed families: registered learner modules; bundle-pinned theory passages after the theory pipeline
lands; and typed grants in the existing campaign resource economy. `[M]` Durable 1.0 can close
today only over completion/prestige records plus appearance-catalog rewards after those catalogs
move to a shared server-readable authority. There is no registered identity for titles, modifiers,
skip starts or variant-run unlocks, so a generic `rewardId` would be a decorative string rather
than progression. `[V]`

The inventory algebra must remove presets from ownership and equipment. Presets may choose
presentation defaults; the campaign's explicit loadout chooses equipped items. Every owned item is
rendered as effective or with one exact reason. `[M]` A path-sensitive authoring check should reject
a run collectible unless every reachable continuation retains a later consumer and a later boss
consumer. This proves opportunity, not learning effect or causation. `[M]`

## 1. Authority census at HEAD

The executable census in `tools/d1592-two-horizon-harness/` reads the real sources. `[V]`

| Object | Authority at HEAD | Consequence |
|---|---|---|
| Learner module | 11 closed ids in `packages/runtime/src/module-contract.ts`; ten unlockable | safe run collectible now |
| Theory passage | exact proposed identity in draft `rfc/theory-knowledge-pipeline.md` (`bundleId`, `passageId`), zero runtime/server authority | schema may name the dependency; implementation must wait ([[D1695]]) |
| Rewind economy | typed campaign charges in schema/runtime/fold | safe typed resource grant, but not a generic tool identity |
| Appearance | 3 app themes, 2 boards, 2 piece sets in `apps/web/src/lib/theme/axes.ts`; zero shared server authority | suitable durable reward only after catalog extraction ([[D1696]]) |
| Titles / modifiers / skip starts / variant runs | no closed shared registry or consumer | refuse a generic durable id ([[D1698]]) |

The campaign schema is `urn:chess-tabiya:schema:campaign:1` and `$defs.reward` has exactly one
member, `module_unlock`. `[V]` The returned amendment necessarily changes that public document, so
it must claim campaign-schema lane 2. `training-mode-variants` also proposes an encounter edit;
their landing order is a shared-resource decision, not a merge-time detail ([[D1697]]). `[V]`

## 2. Run horizon — three families, not one fake superclass

The smallest truthful authored union is: `[M]`

```ts
type CampaignRunReward =
  | { kind: "module_unlock"; moduleId: UnlockableModuleId }
  | { kind: "theory_unlock"; bundleId: string; passageId: string }
  | { kind: "resource_grant"; resourceId: "campaign_rewind_charge"; amount: number };
```

These members share acquisition timing, not semantics. A module enables one registered evidence
consumer. A theory entry is attributed knowledge addressable inside one pinned bundle. A resource
grant changes a spendable balance. The runtime must not call all three “modules” or “tools,” and the
wire must retain the member. `[M]`

`theory_unlock` is a declared dependency, not an implementation permission. A missing or
incompatible bundle leaves the passage owned and returns `source_unavailable`; it never substitutes
another passage or asks an LLM to recreate it. `[M]` This follows the theory RFC's own
bundle-incompatible honest-empty rule (`rfc/theory-knowledge-pipeline.md` §7.3/§8). `[V]`

`resource_grant` is deliberately closed at the existing charge identity. If a future campaign adds
a potion, scout token or other capability, its RFC first owes a registry and a real consumer. A
free-form `tool_unlock` is refused. `[M]`

## 3. Inventory algebra — ownership is not a preset request

Current `effectiveCampaignModules` intersects inventory with `presetModules`; therefore changing a
preset silently removes an earned module from effective play. `[V]`
`packages/runtime/src/campaign-contract.ts:65-76` is the exact implementation. The replacement
separates six facts: `[M]`

```text
owned       = append-only run acquisitions (except no duplicate identity)
equipped    = explicit campaign loadout; acquisition auto-equips when legal
ready       = equipped and not resting under the failure-resource policy
suppressed  = encounter-local denial with a registered reason
available   = required evidence/provider/theory source is reachable
effective   = honesty ceiling ∩ owned ∩ equipped ∩ ready − suppressed ∩ available
```

Every owned item appears in the inventory projection. If it is not effective, exactly one
precedence-ordered reason is shown: `honesty_ceiling`, `resting_until_act`,
`boss_suppressed`, `source_unavailable`, or `not_equipped`. `[M]` The harness fixtures all five
and refuses a disappearing row. Preset changes preserve `owned` and `equipped` byte-for-byte. `[V]`

**Recommended ordinary interaction:** acquisition auto-equips when the item is within the
campaign ceiling and no explicit loadout limit would be exceeded; otherwise it enters the visible
shelf and the result card offers one `Equip` action. `[M]` This keeps the guided default while
preserving a deliberate build once a measured slot/loadout contract lands. It does not authorize a
new slot count here.

## 4. Later-use proof — disclosure is not utility

The current validator checks registration, ceiling and boss placement, but does not join reward
acquisition to any later consumer. `[V]` (`apps/server/src/campaign-validation.ts:51-94`.)

The authoring diagnostic operates on the same compiled collectible-consumer registry as runtime:

1. locate every run-scoped reward on the selected layer graph;
2. enumerate every reachable continuation after the acquisition layer;
3. require at least one eligible later consumer on every continuation;
4. require at least one later boss consumer on every continuation;
5. treat suppression, unavailable sources and an honesty-ceiling refusal as non-consumption; and
6. report the source node, reward identity and first failing continuation.

This is stronger than an existential “one later node could use it.” `[M]` One good branch would let
two dead branches pass that weaker check. The accepted campaign graph converges on an unavoidable
boss, so a boss consumer is an inexpensive universal witness. The harness rejects a reward on the
final boss and a reward suppressed by every later boss; a consuming later boss keeps a temporarily
unused intermediate branch valid. `[V]`

The result says only **structural opportunity**. It may not claim the reward caused a win, improved
the learner, or was useful in practice. Those require owner-use evidence. `[M]`

## 5. Durable horizon — award log first, inventory as projection

Run completion and prestige eligibility remain deterministic projections over the selected path.
Prestige requires `status=completed`, exactly the campaign's selected-layer denominator, and every
seal `achieved`; a perfect one-node prefix is false. `[V]` The current implementation omits the
denominator (`packages/runtime/src/campaign-state.ts:127-130`); the four fixture arms pass in the
research model.

A server-owned award command consumes the completed run and the pinned campaign digest. Its
idempotency identity is: `[M]`

```text
(learnerId, campaignId, campaignVersion, campaignRunId, durableRewardId)
```

The durable authority is an append-only `campaign_reward_awards` row keyed by that tuple. The
learner's owned durable inventory is the distinct projection of its award rows, not a second table
that can disagree. Replaying the command returns the existing award. An active or abandoned run
cannot award a completion reward. `[M]` The harness proves those structural properties. `[V]`

The minimum honest durable classes are: `[M]`

```ts
type DurableCampaignReward =
  | { kind: "completion_mark"; campaignId: string; campaignVersion: number }
  | { kind: "prestige_mark"; campaignId: string; campaignVersion: number }
  | { kind: "cosmetic_unlock"; target:
      | { kind: "app_theme"; id: AppThemeId }
      | { kind: "board_theme"; id: BoardThemeId }
      | { kind: "piece_set"; id: PieceSetId } };
```

Completion marks may be granted for finishing the educational path regardless of node verdicts.
Prestige marks and authored cosmetic rewards may require the completed-perfect projection. Neither
may gate ordinary packs, theory, the standard campaign path or default starting tools. `[M]`

If 1.0 requires skip starts, modifier runs, campaign variants or titled personas as durable
rewards, they need a shared meta-reward registry whose every id has a named consumer. No such
registry exists at HEAD; this is the remaining product decision in [[D1698]]. `[V]`

## 6. Lifecycle, storage and account semantics

Campaign abandonment must become an event (`campaign_abandoned`) rather than a `campaign_runs`
status option supplied beside the fold. Completion and abandonment use discriminated terminal
cursors (`{kind:"completed"}` / `{kind:"abandoned"}`), not the same unexplained `null`. `[M]`
The research harness proves the single-authority fold and rejects events after either terminal.

The campaign migration remains one landing-order claim behind bot policy, but its body widens to:

- `campaign_runs` and `campaign_events` for run-local state;
- `campaign_reward_awards` for cross-run award history, with learner/run foreign keys and a unique
  idempotency key; and
- its rows in the implemented exhaustive account-data inventory.

Account deletion hard-cascades private awards; export includes award history and the derived owned
set; restore replays by the same idempotency key; backup/restore inherits the appliance database
receipt. `[M]` These are the established durable-data obligations from
`rfc/archive/portable-account-data.md` §1 and `rfc/longitudinal-store.md` §9, applied to the new
class. `[V]`

## 7. What is now decided, and what is not

The research closes the mechanical questions behind [[D1592]]–[[D1597]] enough for an author
repair: reward families, ownership algebra, later-use proof, prestige denominator, award
idempotency, terminal authority and migration/account obligations. `[V]`

It does **not** decide:

- [[D1600]]'s no-exhaustible-tool failure branch;
- a loadout slot count or the felt quality of auto-equip;
- final cosmetic roster/reward pacing;
- whether 1.0 funds a new meta-reward registry beyond cosmetics and marks; or
- theory reward implementation before its source bundle lands.

Those are explicit decision/dependency seams, not hidden implementation TODOs.

## 8. Reproduction

Run the nine Node-24 tests documented in
`tools/d1592-two-horizon-harness/README.md`. `[V]` They census HEAD, preserve inventory across a
preset transition, exercise all unavailability reasons, falsify late/boss-dead rewards, enforce the
prestige denominator, enforce event-owned terminal state and prove idempotent completed-run awards.
