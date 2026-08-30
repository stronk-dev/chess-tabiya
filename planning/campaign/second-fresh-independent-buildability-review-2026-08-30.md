# Campaign core — second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/campaign-core.md` after the D2077–D2086 second author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED / NOT THE COMPLETE 1.0 CAMPAIGN**
- **Reproduction:** `make campaign-second-fresh-review` — 9/9 findings
- **Prior repair:** `make campaign-two-horizon-author-contract` remains the author-positive boundary
- **Production status:** partial pre-return schema/registry/fold checkpoints remain frozen; no new
  schema, migration, route, UI or official content is authorized

The second repair successfully makes terminal award issuance atomic, gives the run an exact
document snapshot, separates reward families and enumerates the learner-facing journey. Those
repairs survive. The fresh pass tested the next boundary: can a learner actually play, acquire a
tool, use it against a meaningful boss, leave and resume safely, and carry consequential progress
into later play? Not yet.

Five findings are core buildability defects. Four more show that the document calls a deliberately
narrow foundation the complete 1.0 journey while owner-ruled campaign behavior is only deferred.
Both classes must remain visible: repairing the tables alone must not erase the rest of Campaign.

## B1 — zero chess moves earn every reward ([[D2244]])

`node_committed.verdict` deliberately accepts the non-absorbing fallback `open`, submitting an
unfinished branch is explicitly legal, and the reward is copied “whatever the verdict.” A newly
started run already has a root branch. Start → submit that root therefore grants act income, the
node reward, auto-equipment and map progress without a committed learner move. Repeat nine times and
the campaign completes.

The owner ruled *progression unlocked by playing*, not *progression unlocked by opening a board*.
The repair must define a non-judgmental participation witness: for an authored consequence pack,
at minimum one committed learner move plus the encounter's required consequence boundary, or
another exact witness defined by the encounter class. It must not grade whether the move was good.

## B2 — create idempotency is scoped behind the id it must recover ([[D2245]])

`POST /campaigns/:campaignId/runs` receives `{campaignVersion, commandId}` and promises response-loss
replay. The only durable command authority is the unique index on
`(campaign_run_id, command_id)`. Before the response, the caller does not know the generated run id;
`campaign_runs` stores no creation command, and the scoped index cannot locate the first result.
The active-run uniqueness guard can only return a conflict, not prove which request created it.

Persist a pre-run create identity over authenticated learner, campaign id/version and command id,
plus normalized operands/result. Cross same command/same operands, changed version, another learner,
crash before event and crash after commit.

## B3 — encounter start can orphan either aggregate ([[D2246]])

The start route promises one play run with server-authored `RunOrigin` and a replayable
`node_entered`, but never says that play-run creation, run-start persistence, campaign event append,
revision advance and `active_encounter_run_id` update share one transaction. Failure between them
can leave an origin-bearing orphan run or a campaign pointer to no durable run.

Name the storage operation and transaction boundary. Inject failure after each write, retry the
same command after a lost response, race two starts at the same revision and prove exactly one run
and one campaign event survive.

## B4 — ordinary run deletion can corrupt campaign state ([[D2247]])

The shipped account surface can call `deleteOwnedRun`. Campaign storage deliberately gives
`active_encounter_run_id` no foreign key and only specifies the opposite direction: deleting
campaign history leaves the play run and its origin intact. It never says what happens when the
play run is deleted while active or after its branch was sealed into campaign history.

Either refuse deletion while active or atomically transition the campaign. For sealed history,
define whether the seal remains with a typed unavailable Review state or deletion reaches the
campaign event too. Cross preview digest, export/delete/restore and active/sealed/plain controls.

## B5 — an earned tool never reaches the assistance operation ([[D2248]])

The fold computes module ownership/loadout, theory ownership, suppression and availability.
`RunOrigin` carries only campaign run/node/document identity. No named production module/theory
delivery operation joins those facts when the play run asks for assistance. `GET /campaign-runs`
can display a shelf, but a displayed shelf is not evidence delivery.

Bind the exact server operation that produces the learner module receipt. It must consume the live
campaign revision, effective loadout, node suppression, provider/source state, workflow ceiling and
play-run origin before any evidence renderer runs. Cross stale loadout, wrong node/run, suppression,
provider absence, preset narrowing and actual later-boss delivery.

## S1 — the “boss” is a pack label plus suppression ([[D2249]])

The RFC closes every encounter to `kind: "pack"` and states that a v1 boss is not rated and not a
position/full game. The ruled intent defines phase-specific instruments and an Act-II full-game boss;
the 1.0 roadmap requires boss forms and bot composition. Suppression is a useful boss modifier, but
it is not the opponent/result contract.

The pack-only core may remain a foundation checkpoint. It may not discharge complete Campaign.
Name and serialize the boss-game successor—opponent policy/persona, start position/side, terminal
result, earned-rewind/rating interaction and Review—inside the 1.0 closure.

## S2 — the persistent progression denomination is omitted ([[D2250]])

Design/06 rules progression as a catalogue: shapes met, structures played and a what's-missing mark
on the pack card. Campaign-core defers it to D6; criterion 24 never exercises it; no accepted
successor owns the vocabulary prerequisite, projection and pack-card consumer together. Marks and
cosmetics do not replace the ruled catalogue.

Give the successor a named 1.0 RFC/research path and an end-to-end receipt. A progress screen is not
a substitute for the ruled pack-card placement.

## S3 — the durable horizon is non-consequential ([[D2251]])

Completion/prestige marks and cosmetics are legitimate durable receipts. They do not form the
owner-requested proper long-term reward system: the RFC explicitly forbids durable ownership from
changing ordinary packs, theory, the standard campaign path or default starting tools, while every
consequential class is deferred to D7. Starting another run is byte-equivalent apart from cosmetics.

Research a small typed set of non-paywalled, non-content-locking effects—such as alternate campaign
starts/heroes, boss variants or convenience/variety options—with a real consumer for each. The exact
set is an owner decision; a generic `rewardId` remains refused.

## S4 — official curriculum requirements cannot be validated ([[D2252]])

Criterion 24 requires a target learner, opening/middlegame/endgame coverage, reviewed theory and
provenance, varied encounter/boss forms, and a dependency availability matrix. None has a field in
`CampaignDocument`, a named sidecar schema or a validator authority. The disposable fixture can be
different bytes and the criterion can still be checked by prose inspection only.

Define one typed authoring artifact and checker. It must distinguish the contract fixture, official
curriculum and unavailable dependency states without copying pack/theory authorities.

## Dependency hold and repair order

Campaign also remains downstream of returned `intent-presets`, `bot-policy`, `longitudinal-store`,
pack-capability and theory contracts. Do not copy around them.

1. Repair the zero-play seal, create idempotency, atomic start, deletion lifecycle and assistance
   delivery seam.
2. Re-run the 25 author checks and this 9-arm review, then request another fresh review of the core.
3. In parallel at the planning/RFC tier, name the boss, catalogue, durable-reward and official
   authoring successors as one Campaign 1.0 closure map.
4. Only after dependencies accept: implement persistence/API, then composition, then an official
   human-authored campaign and the complete browser/backup/Review journey.

No implementation or authored content is authorized by this return.
