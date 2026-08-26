# Campaign two-horizon implementation return

**RFC:** `rfc/campaign-core.md`

**Date:** 2026-08-26

**Trigger:** owner ruling [[D1565]], made after the RFC's acceptance

**Boundary:** preserve the landed authored-document, registry, validation and pure-fold
checkpoints; stop before storage, production API, seed content and UI

## Verdict

The current RFC cannot be completed as written. It implements a useful run-local module inventory,
but it does not implement the campaign progression the owner subsequently ruled for 1.0:

1. a run-scoped roguelike inventory containing theory, modules and other tools whose acquisitions
   remain meaningful in later encounters and bosses; and
2. durable rewards that persist across runs without gating the standard educational path.

This is an author return, not a request to discard the working checkpoint. The JSON schema,
versioned registry, campaign workflow context, basic boss suppression, charge accounting and pure
event fold remain evidence. Persistence and product surfaces would freeze the wrong public model,
so they stop here.

## Return 1 — the RFC prohibits its second horizon

Section 3.5 states that prestige is a projection, adds no persistence and must not widen §6's
migration. Section 6 stores only `campaign_runs` and their run-local events. That directly
contradicts [[D1565]]'s durable cross-run rewards.

The amendment must distinguish:

- run completion/prestige **eligibility**, which may remain a deterministic projection;
- the **award event/command**, with an idempotency key tied to the completed campaign run and
  pinned campaign version;
- the **durable reward object**, whose closed classes and learner-visible meaning are named;
- the **account projection/storage**, including export, deletion, backup/restore and migration
  ownership; and
- its non-gating rule: durable rewards may add prestige, identity, variety or convenience but may
  never lock the ordinary educational catalogue or standard campaign path.

No table shape is selected in this review. That is the missing contract, and choosing it inside a
migration would violate the RFC boundary. [[D1592]] and [[D1596]] record the two halves.

## Return 2 — a preset currently erases effective access to earned rewards

The source is exact:

```ts
effective = campaign ceiling
          ∩ earned inventory
          ∩ boss suppression
          ∩ selected preset
```

`packages/runtime/src/campaign-contract.ts` implements the four-way intersection literally. The
inventory row survives, but an earned module omitted by the next preset disappears from the
effective module set. That is the failure shape [[D1565]] names.

The amendment must model at least four different facts rather than collapse them:

- **owned** in this run;
- **requested/equipped** for the next encounter;
- **suppressed** by this encounter, with a visible reason; and
- **effective** after the honesty ceiling and availability checks.

A normal workflow preset may seed a loadout or presentation style. It may not mutate ownership or
silently turn a reward into dead inventory. The product contract must say whether a newly earned
tool auto-equips, asks once, or enters a visible shelf; that remaining interaction choice belongs
in the author amendment. Whichever choice is made, a preset transition fixture must prove the item
remains owned and either effective or visibly unavailable for one exact reason. [[D1593]].

## Return 3 — the collectible vocabulary is module-only

`CampaignNodeReward` has one member: `module_unlock`. That cannot represent the owner-ruling's
theory entries or other tools. Calling `theory_breadcrumb` a theory collectible would confuse a
presentation module with the theory object it presents. Calling charges the generic tool type
would confuse a spendable run resource with an acquired capability.

The amendment needs a closed reward union whose members point to existing authorities where those
exist. Each member owes identity, provenance, acquisition disclosure, later-use semantics and an
honest-empty behavior. A new string id is not sufficient. [[D1594]].

## Return 4 — acquisition has no later-use proof

The validator proves that a reward id is registered and inside the campaign ceiling. It does not
prove the reward can affect anything after acquisition. Valid documents may currently:

- award an item after its last possible consumer;
- suppress it at every later boss;
- make it absent from every reachable preset request; or
- award multiple labels that never alter a later encounter packet or affordance.

Before seed content, add a path-sensitive authoring result from acquisition to at least one later
eligible encounter, plus a boss-specific arm. It must operate over the same compiled
producer→module/collectible contracts the runtime uses, not copied lists. A positive fixture and
each negative shape above must be able to fail. This proves structural opportunity, not that the
learner won because of the tool; the latter would be an unsupported causal claim. [[D1595]].

## Return 5 — prestige is true after one perfect node

The current runtime implementation is:

```ts
const seals = Object.values(state.nodes);
return seals.length > 0 && seals.every((seal) => seal.verdict === "achieved");
```

It never checks campaign completion or the selected-path denominator. A single achieved first
node therefore makes the run prestige-eligible. The author must pin the denominator, then the
runtime gets four fixtures: empty, partial-perfect, completed-perfect and completed-mixed.
[[D1597]].

## Existing returns that remain binding

- [[D1233]]: `abandoned` has no event authority while the RFC claims event-log rebuild.
- [[D1234]]: the completed cursor has no representation in the RFC; runtime currently uses `null`.
- [[D1515]]: consequential but non-punitive failure arithmetic remains research-owned. The
  amendment may record the ruled constraints—one failed node does not end the run, consequences
  are resource-shaped, and failure never locks standard progression—but may not invent the exact
  HP/resource model before that gate passes.

## Re-review gate

An independent buildability review should be able to trace, without inference:

1. every reward kind from authored bytes to authoritative registry, run inventory, acquisition
   event, later consumer and visible unavailable reason;
2. a preset change that preserves ownership;
3. an acquired item that is structurally usable in a later encounter and boss;
4. one completed-run award that is idempotent and survives restart, upgrade, export and restore;
5. prestige false for an incomplete perfect prefix; and
6. abandonment, completed cursor and failure-resource authority with no split state source.

Only then should campaign storage, routes, seed content and surfaces resume.
