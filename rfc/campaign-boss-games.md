# RFC: Campaign boss games — the Act-II rules-terminal encounter

- **Status:** draft 2026-08-31 — first author pass on [[D2249]], [[D962]], [[D2365]]–[[D2367]].
  No implementation is authorized before fresh independent review, the proposed
  calibrated-profile choice is owner-accepted, and every dependency below is accepted and landed.
- **Author:** codex, derived from the owner rulings recorded in `rfc/learner-rating.md` §5.3a and
  `design/06-campaign.md`, with exact production seams re-derived at HEAD.
- **Created:** 2026-08-31
- **Design refs:** `design/06-campaign.md` §§2b, 2c, 5; `design/05-in-run-experience.md` §§3–5;
  `design/03-product-breadth.md` Campaign and Review surfaces.
- **Research refs:** `design/research/training-mode-variants.md`;
  `design/research/coaching-versus-cheating-and-the-band-curve.md`;
  `design/research/maia-band-outcome-transfer.md`;
  `design/research/maia-endgame-fidelity.md`.
- **Exploration gate:** satisfied by the 2026-08-16 full-game owner ruling recorded in
  `rfc/learner-rating.md` §5.3a, [[D945]]'s earned-rewind ruling, and the four-producer closure in
  `design/research/training-mode-variants.md`. The derivation receipt is
  `planning/campaign/boss-game-rfc-derivation-2026-08-31.md`.
- **Depends on:** accepted and implemented `campaign-core.md`, `learner-rating.md`, `bot-policy.md`,
  `intent-presets.md`, `learner-modules.md`, provider health/runtime authority, portable account
  data, and the Review run-origin consumer. Exact-digest bot calibration must exist for the chosen
  official profile before official content may publish.
- **Parent / amends:** `campaign-core.md` §1 encounter union, §4 node sealing, §5 operations,
  §6 persistence, §7 browser boundary and Discharge D1.
- **Planning:** `planning/campaign/1.0-closure-map.md` and
  `planning/campaign/boss-game-rfc-derivation-2026-08-31.md`.

```tabiya-claims
campaign-schema | lane 3 | adds the boss_game encounter arm with exact start FEN, learner side, immutable calibrated bot-profile reference, rating policy and briefing reference; no authored objective, checkpoint, success condition or horizon is admitted
```

## Summary

This RFC makes the campaign's Act-II boss a complete chess game. It starts from an authored legal
middlegame position, plays against one exact calibrated human-like bot profile, runs until the
rules end the game, persists the result once, returns to the campaign map, and opens the same run
in Review. It is rated when the attempt remains clean and still completes the campaign encounter
when an earned rewind or proactive branch makes the rating ineligible.

It is not a drill pack with its horizon removed. A pack requires authored objective and checkpoint
machinery; those are prohibited inputs to a rated result. `boss_game` is a separate encounter arm
whose verdict source is `terminalOutcome`. The schema makes the wrong object unrepresentable.

This is a 1.0 successor, not optional polish. Campaign is not complete merely because its pack
foundation works. A complete receipt must prove start → play → save/reload → terminal result →
rating seal or void → campaign reward/progression → Review → return to map in the browser.

## 1. Authored encounter

Campaign schema lane 3 adds exactly one arm:

```ts
interface CampaignBossGameEncounter {
  readonly kind: "boss_game";
  readonly start: {
    readonly fen: string;
    readonly learnerSide: "white" | "black";
  };
  readonly opponent: {
    readonly profile: BotProfileReference;
    readonly calibration: BotProfileCalibrationReference;
  };
  readonly rating: "rated_when_clean" | "unrated";
  readonly briefingRef: CampaignBriefingId;
}
```

The object is closed. It admits no `packId`, objective, checkpoint, `successConditions`,
`authoredBoundary`, `plyHorizon`, eval threshold, tablebase verdict, adjudication, free-form Elo,
`targetElo`, sampler controls, author-supplied result or author-supplied rating operands.

`BotProfileReference` is bot-policy's exact `{id, family, band, version, digest, model, sampler,
orderedLayers}` identity, not a new smaller copy. `BotProfileCalibrationReference` names the exact
profile digest, calibration id, time-control scope, harness receipt and measured rating/RD used by
learner-rating. The campaign compiler resolves the reference from the registered calibration
authority and copies the resolved immutable operands into the rated-game declaration. A digest
mismatch, missing receipt, wrong scope, unavailable required provider or uncalibrated profile
refuses official publication and start.

**Proposed owner choice.** Official Campaign 1.0 uses `rated_when_clean` plus a calibrated profile,
so the boss can have grounded human-like behavior and a defensible rating simultaneously. A
community document may choose `unrated`; it receives no rating declaration and displays no Elo or
strength label. A bare `targetElo` boss and a profile-plus-`targetElo` boss are refused. This choice
is intentionally visible until owner acceptance; the rest of this RFC does not depend on which
profile is selected.

## 2. Placement and validation

`CAMPAIGN_BOSS_GAME_PLACEMENT` enforces all of the following:

- only `act2`, layer 3, sole choice, `boss: true` may use `boss_game`;
- Act I and Act III bosses remain pack encounters and negative fixtures prove that neither is
  widened accidentally;
- the FEN parses as standard chess, is non-terminal, has the declared side to move, and contains at
  least learner-rating's calibrated material floor (currently 21 pieces);
- official content uses one registered profile/calibration pair whose digest and scope agree;
- `rating: "rated_when_clean"` is unavailable unless the exact profile calibration is admitted;
- briefing copy is source-bearing campaign content and may describe the scenario, but cannot state
  an authored verdict, best move, expected winner or engine evaluation.

The validator does not infer that every middlegame has 21 pieces. It counts the exact start FEN.
The official curriculum metadata added by campaign-core lists this node in middlegame coverage and
`boss_game` form coverage.

## 3. One atomic start authority

The browser never composes `POST /rated-games` with campaign start. It calls:

This section is [[D2366]]'s durable owner: the combined command and transaction criteria below
must close that row before this RFC can implement.

```text
POST /campaign-runs/:campaignRunId/nodes/:nodeId/start
{ expectedRevision, commandId }
```

The existing campaign route remains the single route for every encounter kind. For `boss_game`,
the server-owned compiler resolves the pinned campaign document, current node, start position,
side, exact bot profile, calibration, assistance context and campaign origin. The client supplies
none of those operands.

One `BEGIN IMMEDIATE` transaction:

1. verifies learner ownership, expected campaign revision, node availability and no active run;
2. resolves the exact available profile and exact calibration receipt;
3. creates a `position` play run with `feedbackPolicy: "attempt_end"`, campaign origin, and the
   exact profile policy;
4. creates its run grant;
5. if rated, creates the open rated declaration from the resolved calibration operands;
6. appends `node_entered`, advances the campaign revision and sets `active_encounter_run_id`;
7. records the complete command operands and response under the campaign command authority.

Any failure rolls all seven effects back. Response-loss retry with the same command and operands
returns the same run/rating/campaign bytes without calling a provider or minting a second run. Reuse
with different operands refuses `CAMPAIGN_COMMAND_REUSED`. This extends campaign-core's atomic
start rather than introducing a second route or transaction coordinator.

`RunService.createRatedGame` is refactored to consume the same internal rated-admission compiler;
the public route remains behavior-compatible. Neither service calls the other's HTTP route.

## 4. Play, assistance and ratedness

The play run is an ordinary `position` run. Legal move commit, opponent-ply operation, event replay,
provider health, save/reload, writer lease, accessibility controller and board composition remain
single authorities.

The campaign's equipped modules and earned rewinds are owned under the normal intersection:

```text
rules floor ∩ workflow preset ∩ role ceiling ∩ campaign inventory
∩ node suppression ∩ provider availability
```

Unlocks never raise the rules floor and never make a provider available. A rated boss starts in a
`clean` support state: earned tools are visible in the briefing as available, but every
assistance-bearing module is dormant and no assistance producer is queried. The learner may play
clean, or choose the explicit action:

```text
POST /campaign-runs/:campaignRunId/nodes/:nodeId/use-support
{ runId, expectedRevision, commandId }
```

The server re-derives the active boss identity and atomically appends
`boss_support_activated`, voids the open rated declaration with
`campaign_assistance_chosen`, advances the campaign revision and records the idempotent response.
Only after that transaction commits does the effective module algebra admit the campaign inventory
and do server assistance routes stop returning `ASSISTANCE_WITHHELD`. Browser-only modules use the
same persisted support state; the UI has no local bypass that activates them first. A response-loss
retry returns the same void/result bytes. If rating was already voided by a rewind/fork, the command
preserves the first void reason and activates Support idempotently.

This is [[D2367]]'s missing bridge. It makes the boss winnable with help without pretending the
game was unassisted. Help outside the product remains unobservable, exactly as learner-rating's
disclosure already states; this contract does not claim otherwise.

Ratedness is a separate monotone projection:

```ts
type CampaignBossRatingDisposition =
  | { kind: "open" }
  | { kind: "sealed"; ratedGameId: string }
  | { kind: "voided"; reason: RatedGameVoidReason }
  | { kind: "unrated" };
```

Any persisted rewind/fork family event voids rating exactly once. Choosing Support uses the explicit
transition above, so assistance is activated only after the void. Direct calls to server assistance
while clean still refuse and do not mutate either state. The first void reason is retained. Voiding
does not terminate the game, remove earned tools, erase moves, change the eventual rules result or
fail the campaign encounter. Browser copy changes immediately from “Rated if completed without
Support or rewind” to “Campaign result will count; rating is void: <registered reason>.” It never
silently hides the transition.

No evidence, module, LLM, eval, tablebase, resignation or campaign author can end the game. Only a
validated `outcome.reached` produced by `terminalOutcome` does. Tablebase and engine evidence may
appear after the terminal seal in Review; neither adjudicates it.

## 5. One terminal-game seal

The boss completion command is the existing campaign submit route. For a `boss_game`, it takes no
branch verdict and accepts only the active play run after `outcome.reached`:

```ts
interface BossGameCommittedEvent {
  readonly kind: "boss_game_committed";
  readonly commandId: CampaignCommandId;
  readonly expectedRevision: number;
  readonly nodeId: NodeId;
  readonly runId: RunId;
  readonly terminal: {
    readonly outcome: "win" | "loss" | "draw";
    readonly reason: RatedGameTerminalReason;
    readonly terminalNodeId: NodeId;
    readonly terminalEventSeq: number;
  };
  readonly rating: CampaignBossRatingDisposition;
  readonly actIncome: CampaignActIncome;
  readonly reward: CampaignRunReward | null;
  readonly campaignTerminal: "continue" | "completed";
}
```

The outcome is learner-relative, copied from the validated run event. The terminal reason is
derived from the same rules state by learner-rating's shared helper. The compiler rejects a
non-terminal run, a foreign run, wrong origin/node identity, a mismatched terminal node/event, or
an authored verdict.

One storage transaction:

- seals the rating when still open, or preserves its prior void/unrated disposition;
- appends `boss_game_committed`;
- grants act income and the node reward under campaign-core's play-to-progress rule;
- awards prestige for this node only when the learner-relative result is `win`;
- advances the cursor, clears the active pointer and increments revision;
- inserts any final durable awards exactly once;
- stores the idempotent command response.

The game result is immutable truth even when rating is void. A loss or draw still unlocks the core
educational path and grants the normal node reward; only prestige distinguishes the win. This is
the exact composition of [[D1040]] with [[D945]], not a new progression policy.

Failure injection at every write boundary rolls back all projections. A projector may rebuild the
campaign and rating views from their source records, but no rebuild may reinterpret the chess
result or change the first rating-void reason.

## 6. Persistence and lifecycle

This RFC adds no second game table and claims no migration position. It extends campaign-core's
event CHECK with `boss_game_committed` and its event parser/fold; rated state remains in the
learner-rating tables. If the accepted implementation proves the campaign event CHECK requires a
new migration rather than campaign-core's still-unlanded position, the register owner assigns one
before acceptance—never during implementation.

The combined command authority retains exact input/result bytes for restart replay. Export includes
campaign origin, boss terminal seal, rating disposition and the referenced play run/rated history.
Account deletion removes the learner-owned campaign/rating/run records under portable-account-data's
single inventory. Restore validates the exact campaign schema, profile/calibration references and
event folds before making the run resumable.

Deletion rules remain campaign-core's:

- active boss play run deletion refuses without mutation;
- sealed play run deletion, if allowed by the general lifecycle, leaves an explicit unavailable
  Review reference in Campaign while retaining terminal and rating facts;
- deleting or abandoning the campaign cannot fabricate a game result or a rating result;
- expiring an open rated declaration leaves the active campaign boss playable and labels it
  rating-void/abandoned.

## 7. UX contract

The boss is a complete learner journey, not an API-only node.

1. **Briefing.** Shows the campaign location, start position, learner side, exact grounded bot card,
   rating state, equipped/suppressed modules and earned rewind balance. It does not show raw
   producer inventories or an engine line.
2. **Play.** Uses the stable board composition and accessible input controller. Campaign resources
   occupy the named module regions; they do not stack arbitrary strings above the board or resize
   it after evidence arrives.
3. **Ratedness transition.** Rewind or fork immediately replaces the rating badge with a persistent,
   plain-language void reason. “Use Support” previews the exact consequence, then atomically voids
   rating and activates earned modules while leaving Play active. A direct clean-state assistance
   request remains refused.
4. **Terminal result.** Shows win/loss/draw, whether rating sealed or voided, rewards, prestige,
   and clear “Review game” / “Return to map” actions. No authored praise or move grade is inferred.
5. **Review.** Opens the same run through the Review contract, with post-game evidence modules and
   no live-assistance ceiling. Returning restores the exact campaign result screen.
6. **Resilience.** Refresh/reconnect in briefing, play, voided-play and result states restores the
   same view; duplicate clicks do not create runs or grant rewards twice.

Desktop, tablet, mobile, zoom/reflow, keyboard, screen-reader and touch journeys are release
criteria. The board's rendered size and cell hit targets remain stable when the campaign strip,
rating state or module content changes.

## 8. Refusals

- **No pack-shaped boss.** Objective/checkpoint/horizon fields fail schema validation.
- **No authored or engine verdict.** Only rules-terminal events seal.
- **No ungrounded persona rating.** A name/avatar does not make a profile calibrated.
- **No dual opponent authority.** `profile` and `targetElo` never coexist.
- **No hidden rating void.** Support/rewind cannot be silently ignored, silently activated or
  silently forbidden; Support is an explicit persisted transition.
- **No rating-gated curriculum.** Result/rating changes prestige and record, never access to the
  core educational path.
- **No raw evidence dump.** Evidence reaches named modules and Review after their own contracts.
- **No client-supplied campaign, rating, profile or result operands.** The server derives all from
  authenticated persisted authority.
- **No route-to-route transaction.** Start and finish are storage-level atomic operations.
- **No “campaign complete” receipt without this browser journey.** Pack-only bosses do not satisfy
  Campaign 1.0.

## 9. Acceptance criteria

1. Campaign schema lane 3 validates `boss_game` and rejects every prohibited pack/verdict/horizon
   field; lanes 2 → 3 → 4 pass `register-check`.
2. Placement accepts only Act-II layer-3 sole-choice boss and rejects Act I, Act III, non-boss,
   nonterminal/terminal-at-start, wrong-turn and <21-piece controls.
3. Exact profile/calibration fixtures accept one matching receipt and reject absent, stale digest,
   wrong time scope, uncalibrated, unavailable and profile+`targetElo` inputs.
4. Combined start failure injection after each write leaves zero campaign, run, grant and rating
   residue; response-loss replay returns byte-identical ids and response.
5. Public rated-game creation and campaign boss creation consume the same admission compiler and
   retain their distinct public request shapes.
6. A clean game from both learner colors reaches all five terminal reasons supported by the shared
   rules authority and seals exactly one rating plus one campaign event.
7. Rewind and each persisted fork-family path void rating with the first exact reason, then a later
   win/loss/draw still commits campaign result/reward/progression. `use-support` atomically voids
   then activates modules; injected failure activates neither, retry is byte-identical, and a
   clean direct assistance request remains refused.
8. Loss and draw progress the core path; only a win earns the boss prestige projection. No rating
   value changes either rule.
9. Engine/tablebase/adjudication/author-verdict attempts cannot seal; post-terminal Review may read
   their admitted evidence without changing result bytes.
10. Concurrent finish and response-loss retry produce one terminal campaign event, one rating
    seal-or-void, one reward grant and one revision.
11. Save/reload and process restart at pre-start, open-clean, open-voided and terminal states restore
    exact run/profile/rating/campaign identities.
12. Export/delete/restore and active/sealed run deletion pass portable-account-data's exact
    inventory and the explicit unavailable-Review projection.
13. Browser tests exercise briefing → start → play → ratedness transition → terminal → Review →
    map, plus the clean-rated arm, on mouse, keyboard, touch and semantic grid.
14. The same browser matrix proves no board shrink, overlap or overflow when module/rating/reward
    content changes, at the release viewport/zoom set.
15. Act-I and Act-III pack boss journeys remain byte- and behavior-compatible negative controls.
16. A closure test fails if roadmap, campaign closure map or product capability is marked complete
    without criteria 1–15 receipts and one official validated Act-II boss.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Accept or veto the proposed calibrated-profile official boss | OWNER | ruling recorded in this RFC and the ledger | |
| D2 | Choose and calibrate the exact official profile/time-control receipt | bot-policy | committed exact-digest calibration receipt | |
| D3 | Land the accepted campaign-core, learner-rating, bot-policy and Review dependencies | codex | dependency archive and implementation receipts | |
| D4 | Author the official Act-II start position and source-bearing briefing; law 8 forbids fabrication | OWNER | validated official campaign document | |
| D5 | Produce the full browser, restore and atomicity release receipt for criteria 1–15 | codex | implementation closeout commit | |

## Open questions

1. **Official opponent identity:** accept the proposed exact calibrated human-like profile, or make
   the official boss a bare measured-band opponent with no persona? The proposed default is the
   calibrated profile because it preserves both the owner's human-like-bot vision and the rating's
   evidence standard. Owner ruling required before acceptance; no other state-machine decision is
   open.
