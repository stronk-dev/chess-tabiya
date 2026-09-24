# Campaign core + boss games (unrated) — implementation receipt, 2026-09-24

Implemented at the owner's direction (implement directly, no review rounds). RFC defects were
corrected inline with changelog lines in `rfc/campaign-core.md`, `rfc/campaign-boss-games.md` and
`rfc/intent-presets.md`.

## What landed

- **Storage migration 30** (`apps/server/src/campaign-store.ts`, `storage.ts`): `campaign_runs`,
  `campaign_run_creations`, `campaign_events`, `campaign_mutation_commands`,
  `campaign_reward_awards`, `idx_drill_runs_owner_identity`. STRICT, literal CHECKs, no backfill.
- **Campaign-schema lanes 2 and 3** (`schemas/campaign.schema.json` `:3`,
  `packages/schema/src/campaign/`).
- **Runtime**: `campaign-contract.ts` (closed reward/encounter types, shelf reasons),
  `campaign-state.ts` (the pure fold + prestige), `campaign-participation.ts` (the witness),
  `campaign-receipt.ts` (issued encounter receipt), `assistance-exchange.ts` (Campaign origin), the
  Campaign kit preset (`presets.ts`).
- **Server**: `campaign-events.ts` (closed canonical event image), `campaign-validation.ts`,
  `campaign-registry.ts`, `campaign-service.ts`; charged gestures in `service.ts`; routes in
  `rest.ts`; composition in `application.ts` (`DRAFT_CAMPAIGN_FILES` in development).
- **Web**: `/campaign` and `/campaign/:campaignRunId` (`CampaignScreen.svelte`), the in-run
  `CampaignStrip.svelte`, the terminal-sheet campaign action, `campaign-api.ts`, charged-command
  injection in `DrillApi`, the "Campaign" primary-navigation entry.
- **Content**: `content/campaigns/draft-pilot-three-phases.json` — draft, community channel,
  mechanical encounter graph over existing draft packs plus registered bot
  `human-baseline.1400@1` for the Act-II boss (start and briefing = `kid-mar-del-plata-white`'s
  authored start). No chess prose was written. Browser fixture:
  `tests/browser/fixtures/campaign.browser.json` + `schemas/fixtures/drill-pack/campaign-boss.browser.json`.

## Criteria → tests

| RFC criterion | test |
|---|---|
| core 1, 5, 15, 17, 18; boss 1–3 | `apps/server/src/campaign-validation.test.ts` |
| core 2, 9, 13, 19, 20 (fold) | `packages/runtime/src/campaign-state.test.ts` |
| core 8, 16, 29 (partial), 33; presets 21/D6 | `packages/runtime/src/campaign-receipt.test.ts` |
| core 14, 26 (two writers), 34, 35 | `apps/server/src/campaign-storage.test.ts` |
| core 2, 3, 8, 20, 21, 22 (export), 26, 27, 28, 32; boss 4, 8 | `apps/server/src/campaign-core.test.ts` (through `createApplication`) |
| registry/version identity, pilot validity | `apps/server/src/campaign-registry.test.ts` |
| core 4, 24 (foundation journey, unofficial); boss 13 (mouse arm) | `tests/browser/campaign.spec.ts` |

## Not done (honest remainder)

- Official owner/human-reviewed campaign (D8) — law 8; the `official` channel is refused.
- Run-schema lane 0.25 — claimed, waits behind lanes 0.19–0.24; origin served from the campaign join.
- Theory rewards, cosmetics, pack-capability consumer narrowing — their authorities have not landed.
- Rated bosses, `use-support`, rating seal/void — no calibration receipt exists.
- `campaign-catalogue-progression` (migration 31) — not started.
- Full access matrix (mobile, 200% zoom, keyboard-only journeys) for the campaign surfaces.
- Bot-policy finding: profile bots refuse positions with fewer legal moves than `requestedWidth` (20).
