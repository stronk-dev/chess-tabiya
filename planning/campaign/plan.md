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
