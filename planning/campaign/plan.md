# Campaign core implementation plan

Implements `rfc/campaign-core.md` in dependency-safe checkpoints. The authored contract can land
before storage; the migration remains behind `longitudinal-store` and `bot-policy` exactly as the
shared register declares.

- [x] Closed campaign schema and generic authored-document types.
- [x] Runtime specialization over the ten unlockable learner modules.
- [x] Validator: registered packs, unavoidable bosses, unique node ids, non-increasing candidate
  economy, and campaign-context unlock ceiling.
- [x] Register `campaign` as the eighth workflow context with its isolated browser preference key.
- [x] Add a version-retaining content registry that validates every document against the live pack
  registry and keeps an absent content directory honestly empty.
- [x] Enforce the pure campaign module chokepoint: campaign ceiling ∩ earned inventory ∩ boss
  suppression ∩ chosen preset, with the rules floor permanently present.
- [ ] Add the seed campaign through that registry; keep every balance number candidate and
  do not manufacture chess claims while choosing authored encounters.
- [ ] Land `campaign_runs` / `campaign_events` at the claimed migration turn, then the pure event
  fold and byte-equality rebuild fixture.
- [ ] Integrate atomic earn/spend guards at the four accepted persisted mutation seams.
- [ ] Add start/active/submit routes and submitted-branch seal validation.
- [ ] Add the map and bounded in-run campaign strip, then the refusal and composition guards.
- [ ] Run criteria 1–14, close the ledger/log/discharge rows, and archive only when every criterion
  and named discharge permits it.

Current external dependency: `longitudinal-store.md` has a contradictory acceptance state
([[D1011]]); `bot-policy.md` still holds D969/D970. Neither blocks the completed authored-contract
checkpoint, and neither is inferred here.

## Two-horizon author return — 2026-08-26

Owner ruling [[D1565]] postdates the accepted contract. The code-grounded return is
`planning/campaign/two-horizon-return.md`; it preserves the completed schema/registry/fold work but
blocks the unchecked items above at the persistence boundary.

- [ ] Amend the run inventory so a preset may request presentation without silently removing an
  earned capability; define owned, equipped/requested, suppressed and effective states separately
  ([[D1593]]).
- [ ] Expand the closed reward vocabulary beyond `module_unlock` so theory and other collectible
  tools named by [[D1565]] have typed identity, provenance and a later-use contract ([[D1594]]).
- [ ] Add an authoring invariant proving each promised reward can matter after acquisition,
  including at least one later boss path; disclosure alone is not consumption ([[D1595]]).
- [ ] Specify durable cross-run reward classes, award/idempotency authority, projection/storage,
  export/deletion and migration ownership instead of calling prestige a persistence-free read
  ([[D1592]], [[D1596]]).
- [ ] Require campaign completion in `prestigeEligible`; a single achieved seal currently returns
  true ([[D1597]]).
- [ ] Resolve the pre-existing abandonment authority and terminal cursor returns ([[D1233]],
  [[D1234]]) before an HTTP/storage contract exposes them.
- [ ] Incorporate failure-resource semantics only after [[D1515]] research passes its exploration
  gate; one failed node does not end the run and failure never locks the educational path.

R12 research has now landed in `design/research/campaign-failure-resource.md`:

- [x] Execute all 512 nine-node achieved/failed patterns across global HP, act HP, shared-charge
  resistance and inventory-exhaustion controls ([[D1598]]).
- [x] Identify the only tested candidate clearing attribution, carry-forward, second-currency and
  educational-access constraints: act-reset availability over owned tools ([[D1599]]).
- [ ] Obtain [[D1600]]'s owner ruling on the no-exhaustible-tool second stage. Until then R12 remains
  non-RFC research and campaign failure storage/events are blocked.

Two-horizon contract research has now landed in
`design/research/campaign-two-horizon-contract.md` with nine executable arms:

- [x] Census the actual reward authorities: module ids are shared; theory ids are draft-only;
  appearance ids are browser-only ([[D1695]], [[D1696]]).
- [x] Separate owned/equipped/ready/resting/suppressed/available/effective state and prove preset
  transitions cannot mutate ownership or equipment.
- [x] Specify the closed run-reward families and refuse a generic `tool_unlock` string.
- [x] Execute acquisition-to-later-use and boss-use negatives, completion-denominator prestige,
  terminal event authority and idempotent completed-run awards.
- [x] Hand the author the campaign-schema lane-2 claim and collision with `training-mode-variants`
  ([[D1697]]).
- [ ] Decide whether 1.0 durable rewards stop at completion/prestige marks plus shared-catalog
  cosmetics, or fund a typed meta-reward registry for skip starts/modifiers/variant runs
  ([[D1698]]).
- [ ] Run the author repair from
  `planning/campaign/two-horizon-author-repair-2026-08-26.md`, then independent review.

After the author amendment, repeat independent buildability review against the source symbols,
then resume the migration chain. Do not treat the already-green pure checkpoints as acceptance of
the missing product contract.

## Roguelike reconciliation — landed amendments and their residue (2026-08-23)

Ten claude-owned amendments landed ([[D1314]]); the four owner-tier ones are drafted in
`planning/platform-alignment/decision-queue.md`. Two rows route here:

- **[[D1313]]** — the reveal-budget alternative (price *looking*, not *retrying*) now has a row
  under law 4. It is **not** a reopening of [[D945]]; its destination is **R6's re-tabling of the
  candidate numbers**, where an already-shipped `attempt_end` window with a natural expiry is the
  obvious comparison against the earned-charge economy.
- **[[D1315]]** — the four stale `learner-modules` citations, corrected in place. Destination: the
  campaign implementation lane, because **criterion 5 tests the ten-member unlock type against the
  table the broken citation pointed at** — whoever implements that criterion should confirm the
  repaired ranges still resolve when they get there ([[D368]]'s class: a citation written once and
  never re-derived).

- **[[D1316]]** — `campaign-core`'s `learner-modules` citations had drifted ~181 lines after a §3a
  insertion, and the ten-member unlock type was derived from the stale anchor. Repaired in the
  amendment pass (`16e59e4`); the criterion now tests the ten-member type against the table rather
  than against a line number. [[D368]]'s class — a figure written once and never re-derived.
