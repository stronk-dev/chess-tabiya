# Campaign

Campaign strings rehearsals into a three-act map. It is **optional and never gates the open
library**: every pack stays playable from Play and the Library, nothing is sold, and a campaign run
only changes what the learner carries *inside that run*. Implemented 2026-09-24 from
`rfc/campaign-core.md` (foundation) and `rfc/campaign-boss-games.md` (the Act-II full-game boss),
storage migration 30, campaign-schema lanes 2 and 3.

## Documents

A campaign is a closed JSON document (`schemas/campaign.schema.json`, lane 3) with exactly three
acts × three layers. Each layer offers one to three encounters; every act ends in one unavoidable
boss (the final layer's sole choice). Encounters are:

- `pack` — a registered drill pack, sealed by the learner's submitted branch;
- `boss_game` — **Act II layer 3 only**: a full `position` game from an authored start (≥21 pieces,
  learner to move, non-terminal) against an exact `bot-profile-catalog@1` reference. The start must
  equal the start of the `briefingRef` pack, whose authored title/objective is the briefing (no new
  prose). `rated_when_clean` is refused until a calibration authority exists; bosses are `unrated`.

Run rewards are the closed union `module_unlock | theory_unlock | resource_grant`
(`campaign_rewind_charge`). `theory_unlock` and `cosmetic_unlock` are refused
(`CAMPAIGN_SOURCE_UNAVAILABLE`) until the theory pipeline and shared appearance catalog land; the
`official` channel is refused (`CAMPAIGN_OFFICIAL_AUTHORITY_UNAVAILABLE`) until an authenticated
owner-review store and curriculum registries exist. `apps/server/src/campaign-validation.ts` also
checks boss placement, the non-increasing economy, the campaign module ceiling, declared
`consumes` against the compiled consumer set, and that every reward has a later consumer **and** a
later boss consumer on every continuation (`CAMPAIGN_REWARD_NO_LATER_USE` / `…_NO_BOSS_USE`).
Module reach is compiled from the campaign context ceiling and node suppression; pack-capability
narrowing joins when `pack-capability-contract` lands.

Installed documents live in `content/campaigns/`. `draft-pilot-three-phases.json` is a **draft,
community, mechanical** pilot: an encounter graph over existing draft packs and one registered bot,
with no authored chess prose. Development servers can add fixture documents with
`DRAFT_CAMPAIGN_FILES` (the browser suite uses `tests/browser/fixtures/campaign.browser.json`).

## Runs, events and the economy

A `CampaignRun` pins the canonical document bytes and digest. All state is a pure fold
(`campaignRunState`, `packages/runtime/src/campaign-state.ts`) over `campaign_events`:
`campaign_created`, `node_entered`, `node_committed`, `boss_game_committed`, `loadout_changed`,
`charge_spent`, `campaign_abandoned`. Rows are admitted only as RFC-8785 canonical bytes through a
closed per-kind parser whose digest covers the whole envelope (`campaign-events.ts`).

- **Earn**: starting charges, act income per seal (non-increasing by act) and `resource_grant`
  rewards. A seal grants its reward **whatever the verdict** (D1040); winning every node only adds
  the prestige mark.
- **Spend**: inside an *active* encounter, rewind, fork, group creation and line entry each spend one
  charge. The play mutation and its `charge_spent` event commit in **one** SQLite transaction
  (`SQLiteRunStorage.commitCampaignChargedMutation`); the request carries
  `campaignCommand {commandId, expectedCampaignRevision, expectedPlayRevision}`; replays return the
  stored result; a zero balance is `CAMPAIGN_REWIND_EXHAUSTED` (409) and nothing changes. A group
  whose provider fails stores a no-event `provider_failed` result and spends nothing. Plain runs are
  untouched and refuse the envelope.
- **Seal**: `POST …/nodes/:nodeId/submit` requires a participation witness (a learner move on the
  submitted branch, then an absorbing objective or the pack's `plyHorizon`) — a participation fact,
  never a grade. A boss seals only from a rules-terminal `outcome.reached`.
- **Complete**: the ninth seal carries `terminal: "completed"` and inserts the completion (and, when
  every node was won, prestige) award rows in the same transaction.

## API (`/campaign` family, authenticated; no request accepts a learner id)

`GET /campaigns`, `GET /campaigns/active`, `GET /campaign-rewards`,
`POST /campaigns/:campaignId/runs`, `GET /campaign-runs/:id`, `PUT /campaign-runs/:id/loadout`,
`POST /campaign-runs/:id/nodes/:nodeId/start` (needs `x-writer-id`; creates the play run and
`node_entered` atomically), `POST /campaign-runs/:id/nodes/:nodeId/submit`,
`POST /campaign-runs/:id/abandon`, `GET /campaign-runs/:id/result`,
`GET /campaign-runs/:id/nodes/:nodeId/review`. Every mutation carries a command id (replays return
stored bytes) and, after creation, the exact revision. Errors are the closed `CAMPAIGN_*` algebra in
`apps/server/src/errors.ts` (`CAMPAIGN_ERROR_STATUS`). `GET /runs/:id/graph` reports
`campaignOrigin` for encounter runs. An active encounter run cannot be deleted; deleting a sealed
one keeps progression and Review answers `campaign_encounter_run_deleted`.

## Assistance

The Campaign workflow context is executable (intent-presets Discharge D6): the server issues a
`CampaignEncounterReceipt` (`packages/runtime/src/campaign-receipt.ts`) folded at the encounter's
`node_entered` cut, and `compileAuthoritativeAssistance` intersects the preset with the receipt's
effective kit (owned ∩ equipped − boss suppression). The **Campaign kit** preset is the Campaign
default: it requests the whole campaign ceiling, so what renders is exactly what was earned and
equipped. Receipts are identity-verified; JSON copies are refused.

## Web

`/campaign` lists campaigns and active runs; `/campaign/:campaignRunId` is the map (acts → layers →
node cards with reward, suppression, opponent and seal), the kit with equip toggles, a bounded
encounter-preparation panel, abandon with confirmation, and the run result. Inside an encounter the
run page shows the campaign strip (node, `⟲ N` before any spend, kit, **Declare done**); when the
rules end a boss game, the terminal sheet carries “Declare done and return to the campaign map”.

## Not yet

Catalogue progression (`rfc/campaign-catalogue-progression.md`), rated bosses and `use-support`,
theory rewards, cosmetics, the official owner-reviewed campaign, run-schema lane 0.25 (the origin is
served from the campaign join until its turn), and durable variety.
