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
