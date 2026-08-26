# Campaign-core two-horizon author repair handoff

**Input:** owner ruling [[D1565]], return [[D1592]]–[[D1597]], and
`design/research/campaign-two-horizon-contract.md`

**Boundary:** amend `rfc/campaign-core.md`; preserve the landed schema/registry/validator/fold
checkpoint as evidence, but do not resume migration/API/content/UI implementation until an
independent buildability review accepts the repaired contract.

## Required author changes

1. Return the header to `draft — author repair` and retain the prior acceptance/implementation
   history.
2. Add dependencies on `theory-knowledge-pipeline` for `theory_unlock`, the shared appearance
   catalog extraction for `cosmetic_unlock`, and portable account data for award export/deletion.
3. Claim `campaign-schema | lane 2 | ...` and register the live claim. Serialize landing with
   `training-mode-variants`; do not let both edit schema version 1.
4. Replace module-only rewards with the closed run union:
   `module_unlock | theory_unlock(bundleId,passageId) | resource_grant(campaign_rewind_charge)`.
   Refuse generic tool ids.
5. Replace preset-intersection inventory with owned/equipped/ready/resting/suppressed/available/
   effective. Presets mutate neither owned nor equipped. Every owned item projects exactly one
   unavailable reason when ineffective.
6. Pin acquisition behavior: auto-equip when legal; otherwise visible shelf plus one Equip action.
   Do not invent a slot count.
7. Add the compiled acquisition→later-consumer→boss-consumer diagnostic over every reachable
   continuation, with final-node, all-boss-suppressed, source-unavailable and missing-consumer
   negatives.
8. Replace the vacuous prestige predicate with completed status + exact selected-layer denominator
   + all-achieved.
9. Add `campaign_abandoned` as the sole abandoned-state authority and discriminated active /
   completed / abandoned cursors.
10. Specify the idempotent award command and append-only award row keyed by learner + campaign id +
    version + run + durable reward. Owned durable inventory is a projection, not a second authority.
11. Admit only completion mark, prestige mark and shared-catalog appearance rewards unless the owner
    explicitly funds a meta-reward registry. No durable reward gates the ordinary educational
    catalogue or standard campaign path.
12. Widen the migration body and account-data inventory. Name export, hard-delete, restore,
    backup/restore and replay behavior.

## Required able-to-fail criteria

- a preset transition leaves owned/equipped bytes unchanged;
- every ineffective owned item has exactly one registered reason;
- a reward on the final boss fails later-use;
- all later bosses suppressing the reward fails the boss arm;
- a copied reward/consumer list diverging from runtime fails set equality;
- partial-perfect prestige is false; completed-perfect true; completed-mixed false;
- duplicate award command inserts one row; active/abandoned run cannot award completion;
- deletion/export inventory omission fails the durable-data guard;
- a draft-only theory passage or browser-only appearance id cannot enter a server award; and
- campaign schema v1 edited without lane 2 fails `make register-check`.

## Explicit holds

- [[D1600]] remains owner-blocked. Record the interface to `resting`, but do not choose its no-tool
  second stage.
- Theory rewards cannot implement before the theory runtime authority exists ([[D1695]]).
- Cosmetic rewards cannot implement before the appearance catalogs are shared ([[D1696]]).
- Non-cosmetic meta rewards need the [[D1698]] product choice plus a registry/consumer RFC.
- No seed campaign, route or surface lands from this author round.
