# Campaign core — fifth fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewer:** codex, independent of the fifth author repair
- **Input:** `rfc/campaign-core.md` after the [[D2620]]–[[D2624]] repair
- **Verdict:** **returned on [[D2736]]–[[D2741]]; no campaign schema, migration, route, client,
  official content or production implementation is authorized**
- **Executable reproduction:** `make campaign-two-horizon-fifth-fresh-review` — 6/6 new blocker
  controls plus the complete retained author chain

## What survived re-review

The product direction survives: play-not-win progression, earned run-scoped tools, separate
module/theory/resource families, exact historical inventory cuts, boss suppression, prestige-only
winning gates and the explicit four-part Campaign 1.0 closure map remain coherent. The fifth repair
also improves relational run ownership and nested event validation. It does not yet establish the
durable authorities its status claims.

## Blocking findings

### [[D2736]] — terminal provider failure is process-local

Provider failure intentionally appends no `charge_spent` event and advances no revision. The SQL has
no other charged-command/result table, so it has nowhere to persist the supposedly terminal result.
The author model uses a `Map`; reconstructing state after restart calls the provider again for the
same command. This is the exact process-local implementation §2.2 declares invalid.

### [[D2737]] — the charged command is detached from both aggregates

`CampaignEconomyState` carries neither campaign nor play-run identity, and
`applyChargedMutation` never checks the command ids against the state. A command naming unrelated
aggregates spends and advances it. The command also carries only expected Campaign revision, while
ordinary play mutations can advance the play aggregate without changing Campaign revision. The
transaction needs a sealed active-relation subject and both current revisions.

### [[D2738]] — assistance subject and receipts remain incomplete/forgeable

The advertised complete subject lacks learner id, campaign document digest and Campaign revision,
although §5.1 says crossing each must refuse. `authorizeCampaignTheory` accepts ordinary structural
gate objects; entirely caller-authored applicability/disclosure/source digests authorize a passage.
Structural equality among invented copies is not predecessor authority.

### [[D2739]] — event integrity covers payload only

The result digest covers `{kind,campaignRevision,payload}` but not campaign run, command id,
expected revision, operands digest or timestamp. A valid result transplants unchanged across a
different campaign, command and operand image. `JSON.parse` also collapses duplicate keys, while the
RFC claims canonical storage parsing. Replay and fold therefore lack one immutable event subject.

### [[D2740]] — official curriculum compiles a smaller, caller-authored object

The executable compiler accepts direct structural `CampaignDocument`/registry/review objects, not
the parsed nested document and sealed registries the prose claims. Its flat node input omits acts,
layers, choices, rewards, consumers and publication curriculum. Its result omits form coverage,
target prerequisites and the aggregate dependency-availability projection; `reviewedAt:"now"`
passes. One-fact-per-flat-node does not prove the full official schema.

### [[D2741]] — dependency status is materially false

The RFC describes `intent-presets`, `pack-capability-contract` and
`theory-drill-current-joins` as accepted or accepted-and-implemented inputs. The live RFC register
marks all three draft/returned. The dependency paragraph then calls two of them returned in the same
sentence. Campaign cannot compile against prose contracts whose authorities may still change.

## Required next author round

Persist every charged command outcome (including no-event failures); bind one locked campaign/play
subject and both revisions through all four mutations; consume sealed assistance receipts with the
complete learner/document/revision identity; parse canonical event bytes and digest the whole
envelope; compile official metadata from the real parsed nested document and sealed registries; and
refresh dependencies to current lifecycle truth. Retain all existing controls and make each
counterexample fail. Another genuinely fresh review remains mandatory before foundation acceptance;
Campaign 1.0 still additionally requires boss games, catalogue progression, durable variety, full UX
and human-authored official content.
