# Campaign core — seventh fresh independent buildability review

- **Date:** 2026-09-06
- **Reviewer:** Codex, independent of the sixth author repair
- **Input:** `rfc/campaign-core.md` after the [[D2736]]–[[D2741]] repair
- **Verdict:** **returned on [[D2986]]–[[D2992]]; no campaign schema, migration, route, client,
  official content or production implementation is authorized**
- **Executable reproduction:** `make campaign-two-horizon-seventh-fresh-review` — the complete
  retained author chain, 7/7 new blocker controls and strict TypeScript

## What survived re-review

The sixth repair preserves durable command-result replay, campaign/play revision comparison,
canonical envelope hashing and a useful nested curriculum projection. The broader product contract
also remains explicit that this RFC is only the foundation: boss games, catalogue progression,
durable variety, complete UX and official content remain 1.0 obligations. The executable model still
does not bind its claimed authorities to those product operations.

## Blocking findings

### [[D2986]] — successful charged commands do not execute their named operation

`rewind`, `fork`, `group` and `simulate_enter` all run the same code: decrement one charge and add
one to two revision integers. There is no branch/group/simulation input or state, no run event and no
`campaign_events` table. A response can therefore say `committed` while the play graph is unchanged.

### [[D2987]] — provider outcomes are caller callbacks

`applyChargedMutation` accepts `() => "ready" | "failed"` and persists either answer as terminal
authority. It has no provider request/result subject, generation, timeout or sealed execution
receipt. The callback also runs after `BEGIN IMMEDIATE`, holding the Campaign write transaction over
work that the real product would perform outside SQLite.

### [[D2988]] — assistance authority comes from a public fixture issuer

`seedCampaignAssistanceAuthority` writes the full subject and three decision booleans to a table
named `campaign_assistance_authority_fixture`. The compiler authorizes a passage even when campaign,
play, pack and passage rows do not exist. Subject completeness does not help when the same caller
invents the subject and every gate.

### [[D2989]] — event parsing is generic below the envelope

A `loadout_changed` event carrying an arbitrary nested object, result kind `campaign_created` and
timestamp `not-a-time` receives a valid digest and parses. The RFC requires an exact recursive
payload/result parser per event kind and canonical time, not one generic `Record<string,unknown>`.

### [[D2990]] — most Campaign document semantics are structural casts

The parser accepts empty id/title, negative version and economy, numeric module ids, arbitrary
durable and node rewards, non-string consumers/suppressors and an official three-act document with
zero bosses. It validates the outer act/layer skeleton but not the closed foundation it claims to
compile.

### [[D2991]] — human review has a public local mint

Any caller can instantiate `HumanCurriculumReviewAuthority` and issue
`authority:"owner_human_chess_review"` for any parsed document. No owner identity, authenticated
review action or durable human decision participates. This turns an authority label into a claim.

### [[D2992]] — curriculum registries are caller-authored truth

`sealCurriculumRegistries` brands any deep-copied structural map. The official compiler then
publishes caller-invented target prerequisites, pack phases/digests, theory passages/evidence refs,
provider operations and availability booleans. None resolves through its owning accepted registry.

## Required next author round

Bind each charged command to the actual run mutation and atomic Campaign event; consume exact
provider execution outside the write lock; derive Campaign assistance from the real run/event/pack/
context/theory/provider authorities; implement the event-kind schemas and full Campaign document
validator; receive human review as authenticated durable input; and resolve curriculum facts through
the owning registries. Retain all earlier controls and obtain another genuinely fresh review. These
repairs still do not discharge the separately tracked boss, catalogue, variety, UX or official-
content milestones.
