# Campaign

Campaign strings rehearsals into a three-act map. It is **optional and never gates the open
library**: every pack stays playable from Play and the Library, nothing is sold, and a campaign run
only changes what the learner carries *inside that run*. Implemented 2026-09-24 from
`rfc/campaign-core.md` (foundation) and `rfc/campaign-boss-games.md` (the Act-II full-game boss),
storage migration 30, campaign-schema lanes 2 and 3.

## Recovering a failed read

Campaign home and a saved map offer **Retry loading campaigns** / **Retry loading campaign**
after a failed read. Failure never renders as an empty installed catalogue. Retry rereads only
the original route, is single-flight, clears obsolete content and returns focus to the page
heading after settlement. Repeated failure stays retryable; leaving or switching campaigns
retires the old response and focus change. No create/start/loadout/submit command is repeated.
The recovered map resumes its existing encounter with this browser's retained writer.

The in-game encounter strip also offers **Retry loading encounter**. Pending or failed reads
withdraw the published campaign revision and pause Declare done; the retained strip is context,
not command authority. Retry performs only a read, restoring the current revision or a recorded
seal without repeating start, spend or submit. A lost submit response retains its original command
identity unless a later read confirms the seal. Crossed definitions and departed responses cannot
attach to the current encounter. Keyboard retry returns focus to its error or encounter title
only while the learner has not moved focus elsewhere. Desktop and phone tests verify the saved
position, branch, campaign state and board geometry through repeated failure and recovery.

## Encounter gesture costs and lost responses

In the verified Campaign encounter, the timeline and checkpoint, completed-line, guard and Support
rewind controls disclose **one earned rewind** before the gesture. The fork and group dialogs state
the same cost; a whole group costs one, not one per member. The authored-line preview is free;
**Enter this line** discloses its separate one-charge cost. Ordinary rehearsal stays free.
Cost copy is contextual UI, not a chess evidence item, preset override or new charging authority.

If a charged response is lost, the browser retains that exact command and operands for explicit
retry; it does not automatically repeat a spend. A different gesture is refused while the outcome
is unknown. Success, a definite 4xx refusal or the recorded no-spend provider failure clears the
pending command. The server replay supplies the authorized event tail from the original command's
play revision. The client checks any overlapping events against its recorded history before
applying the new tail; conflicting history and event gaps remain errors. Exhaustion displays the
existing server explanation inside the action dialog and the Actions panel rather than calling it
a stale-run problem or floating an alert over the board. Closing the companion restores every
board target without changing its size.
This recovery state is in the current browser session; a reload reads the saved run and campaign.

A replayed group command returns the group named in its stored result, even if another authorized
tab has since created a different group. It does not replace the current cursor or debit again.
A missing or unresolvable saved group is a storage error, never a fallback to the latest group.
The command's original charge receipt remains unchanged. Its historical revision cannot overwrite
a newer confirmed encounter read; only a valid newer revision for the currently mounted run can
advance the browser's next-command revision. Crossed-run and invalid revisions cannot supply it.

## Leaving a pending action

Create, encounter start, kit changes, abandonment and Declare done have one pending command
per action. Leaving or switching campaigns/branches retires the old view's completion: it cannot
navigate you back, replace the new map, clear its controls or publish an old encounter revision.
An accepted command still belongs to the server and appears when the campaign is resumed.
An accepted encounter start also preserves this browser's writer ID for resume; that storage-only
step does not navigate or attach the departed view.
Retried requests after a lost response keep their original command, revision, branch and writer
operands; a server replay is not another encounter or reward. The returned campaign and encounter
are checked before displaying a result. A failed abandonment result read offers Reload result
while retaining the confirmed abandoned map; it is not reported as a failed abandonment.

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
default: it requests the whole campaign ceiling, narrowed by earned/equipped tools, encounter
restrictions, individual preferences and actual source availability. A requested or equipped tool
is not a promise that its evidence is available. Receipts are identity-verified; JSON copies are refused.

## Web

`/campaign` lists campaigns and active runs; `/campaign/:campaignRunId` is the map (acts → layers →
node cards with reward, suppression, opponent and seal), the kit with equip toggles, a bounded
encounter-preparation panel, abandon with confirmation, and the run result. Inside an encounter the
run page shows the campaign strip (node, `⟲ N` before any spend, kit, **Declare done**); when the
rules end a boss game, the terminal sheet carries “Declare done and return to the campaign map”.

Prepare opens a bounded, independently scrolling dialog with the encounter's copied objective,
reward, suppression preview and earned-rewind cost. Its Help style selector uses the same canonical
Campaign preference as Settings and the encounter. Only permitted named styles appear; migrated
or overridden Custom and malformed-preference recovery remain visible. Style changes do not mutate
the Campaign kit or revision. Equipped tools excluded by the requested style stay on the shelf with
that explanation; actual help is confirmed server-side when the encounter opens. Refused browser
writes restore the previous selection, explain the failure and allow retry rather than claiming an
unsaved choice will survive navigation. Earned tools can be equipped there using the
same server-owned kit command as the map; Start waits for that command and uses its returned
revision. Suppressed tools stay owned/equipped but cannot be enabled for that encounter. Equipped
does not promise available evidence or override the chosen help style. Focus enters the briefing,
Tab stays inside, and Escape/Back returns to the map choice (or map heading while a command is
pending). Closing a pending Start does not cancel a server-accepted encounter or navigate later:
the map offers Continue encounter and the saved writer remains usable.

The encounter result separates the act's seal income (earned win or lose) from a node's extra
rewind reward or tool unlock. It shows the current balance and owned/equipped tools, and names
the encounter restrictions that ended without promising those tools are now active. The next
encounter, selected help style and available evidence still determine what appears. Continue
returns to the map; a completed campaign instead offers its run result.

Reload reconstructs this result from the retained seal and pinned campaign economy; it does not
submit again. On an exact command replay, a later canonical map may show a newer balance/kit,
but this encounter's income remains its own. No cumulative-balance subtraction or extra durable
result record is needed. Recorded moves, branches and cursor remain unchanged by reload.

Sealed map cards, the seal strip (including after reload) and result entries offer **Review encounter** and
**Open recorded encounter**.
They use the node-history operation above, check its exact game/node/document identity and
recheck on activation rather than guessing a saved-game URL. Deleted recordings explain that
the seal and earned rewards remain. Abandoned results separately retain the unfinished attempt,
without awarding a seal or reward; deletion of that recording does not erase its abandonment.
Failed checks offer retry, and responses arriving after departure cannot navigate the learner.
Game Review selects the submitted consequence's recorded node and exact branch, not today's
Play cursor. Boss history selects its recorded rules-terminal node. The Review URL retains both
identities across reload; the owner's Review has a **Return to campaign map** link derived from
the stored campaign join. It never reconstructs moves from a seal.

**Declare done** opens Review for that submitted consequence only. A new live fork or later play
appended to the same branch cannot inherit this disclosure; ordinary feedback rules still apply.
An abandoned recording with closed feedback explains why Review is withheld while keeping its
Play action. Deleted recordings expose neither destination. These paths do not establish an
official curriculum, complete Review evidence coverage or the remaining Campaign release journeys.

## Not yet

Catalogue progression (`rfc/campaign-catalogue-progression.md`), rated bosses and `use-support`,
theory rewards, cosmetics, the official owner-reviewed campaign, run-schema lane 0.25 (the origin is
served from the campaign join until its turn), and durable variety.
