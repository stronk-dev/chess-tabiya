# Pack capability integration on main — 2026-09-30

This integrates the existing branch at `90600757` into the shared checkout, preserving main's
evidence-foundation, Guided Hint, release, account, provider-health and Campaign paths. It does not
create a worktree. Authority is the owner-directed implementation recorded in
`implementation-2026-09-24.md`; no new acceptance or owner ruling is inferred. The three RFCs remain
**implementing**, not archived.

## Delivered checkpoint

- Schema lanes 0.30–0.32 coexist with main: canonical derived `requires`, in-pack `sourceGame`,
  assistance-ramp and sibling training-set format/validation and pure arithmetic.
- Disk and dynamic pack admission use one current document validator and configured-support
  handshake. Unsupported requirements produce `PACK_CAPABILITY_UNSUPPORTED`; transient provider
  health does not remove supported identity. The server and web share the public parser.
- The capability registry, lifecycle/refusal projection, source-closure digest, read-only migration
  planner and separately gated applier are production-bound. Capability sites are a source census,
  not proof that every declared helper has a runtime consumer.
- The first main registry contains **819 declarations**. The branch's 756-row image predated main's
  current source and projection image. The initial main declaration image was regenerated once;
  there was no committed main capability registry to preserve. Existing historical declaration
  rows remain present. After this landing, regeneration may only add identities, never rewrite or
  remove a committed identity/version. Git history is the independent baseline, not the regenerated
  candidate file. This is not permission to repeat a same-version bootstrap later.
- Mechanical stamps cover **92 content documents** (86 production packs, six browser fixtures),
  **68 sibling evidence-ledger digests**, the schema example and **11 separate schema fixtures**.
  Pack requirements are derived; no chess judgement, claim binding or authored text is created.

## Integration repairs and negative controls

| Item | Production boundary and evidence |
|---|---|
| D3316 | `PackRegistry.addCommunity/addPlaytest` validate schema and exact derived requirements before mutation. `PackStudio.hydrate` reports invalid/unsupported stored rows, retains bytes and loads valid peers. Permanent tests cover both insertion doors, unstamped community/playtest restart, configured-support refusal and recovery. Playtest admission precedes durable persistence. |
| D3319 | `tools/capability-history.mjs` checks HEAD→working tree, HEAD→index on commit, and first parent→HEAD in CI. Six tests cover exact retained declarations, removal/rewrite, successor retention, invalid images, mutation plus regeneration, real staged/Git history and missing CI parents. The original source-recomputation check remains required. |
| D3320 | History-consuming software/governance/release verify jobs check out depth two. Both the capability guard and semantic owner-transition CI reader refuse an unavailable parent. Scaffold checks bind the actual per-job checkout depth. No check performs a network fetch. |
| D3321 | The newer Campaign boss browser fixture receives a mechanical stamp. The content contract independently discovers every browser schema fixture, without changing the sealed content-population denominator. Full Campaign browser execution now boots and completes. |

The full software run also caught a ledger-less authored-feedback test inserting an unstamped
pack through the newly protected dynamic door; its fixture is now stamped while its fail-closed
claim-grounding assertions remain. The refusal-authority negative test now supplies an explicitly
draft reader instead of depending on a real RFC remaining draft forever.

A further D3316 negative control stores `null` as a playtest document. It was red because the
refusal message accessed `document.id` before throwing the typed error. That message now treats
an invalid/missing identity as absent. Both insertion doors reject null/object/primitive malformed
inputs with `PACK_INVALID`; restart retains the null row and still admits healthy peers.

## Verification

- `make pack-capability-integration-check`: **130 tests, five files passed**.
- `make verify-content`: **223 tests, 23 files passed**, corpus clearance has no errors, and all
  **104 pack/schema documents** declare exactly their derived capabilities. The unchanged command
  needed network permission for pinned pnpm signature verification; no bypass was used.
- `make test-browser-ci`: **56 smoke, five content, 49 matrix and one packaged-production test
  passed**, zero retries; one optional live-Maia measurement is skipped. The matrix covers exact
  click, drag, touch, keyboard and text moves over served endgame packs and device projections.
- Capability applicability, recomputation, census, named-site, lifecycle and migration-plan checks
  pass. The planner currently reads **352 documents**, with zero mechanical/judgement migrations
  or refusals; that is compatibility debt, not a claim that content has graduated.
- `make verify-software`: **2,679 tests, 309 files passed**, plus **seven isolated performance
  tests**. Types have zero errors (seven pre-existing Svelte warnings); scaffold, package/release,
  manifest, semantic, opening/account/rating/style and all capability/migration checks pass.
- `make verify` passes all three final tiers after the malformed-data repair. Governance reports
  register C1–C8, status P1–P7 and roadmap R1–R10 green; **zero untriaged and zero unrouted** among
  1,672 live ledger items. Twelve evidenced defects close, including the four integration repairs
  and the earlier requirement/population/derivation/cut seams; open consumer work is routed in the
  existing execution queue, not stranded in a changelog. `make staged-process-contracts` passes
  the exact staged closeout; Git commit hooks remain enabled and run again at commit.

## Not delivered by this checkpoint

- **D3317:** the persisted-attempt ramp has no live nine-field clamp projection. The owning
  ADR-0006/rung projection discharge remains open; no implementing agent chooses it here.
- **D3318:** training-set loading, API/client progression, repeat-set, schedule isolation and live
  scaled tempo are not proven by schema/pure sequencer tests. Authored sets remain held separately.
- **D3322:** `unauthoredTempoTransition` has no direct production caller. Declaration/export/unit
  tests do not apply its `outpaced → failed` default to a live run.
- Famous-games authored/learner import, cross-pack and broadcast discharges remain open.
- Semantic validation remains **81 subjects, zero fully validated profiles**. Independent
  authority, population reach, live-provider reruns and consumer bindings remain release blockers.
  No whole capability, milestone or official pack is closed.

No protected intent sentence is falsified by this bounded integration; none is edited. Progress,
RFC lifecycle rows, ledger items and both exploration/content logs travel with the checkpoint.
No push, deployment or remote CI success is claimed. Pre-existing D872 fixture edits and untracked
reviewer files are excluded from the commit.
