# Proposed intent amendment — campaign-core landing (2026-09-24)

Filed under the AGENTS.md completion clause: the implementer does not edit `design/`; this reports
where intent now disagrees with the tree. Owner (or claude on an owner ruling) decides the wording.

1. **`design/06-campaign.md` §"The failure state already ships" (≈ line 569):** *"And **"did this run
   succeed" is computed nowhere**: `attempts` is per *branch*, so a **run-level roll-up** is the
   precondition for everything else here — the smallest new part, and the first one to build."*
   **Now true:** the run-level roll-up exists — `campaignRunState` folds `campaign_events` into
   seals, charges, kit and a completed/abandoned cursor, and `campaignPrestigeEligible` computes the
   exact "every selected node won" predicate (`packages/runtime/src/campaign-state.ts`, migration 30).

2. **`design/06-campaign.md` line 9:** *"**Nothing here is an RFC.** This is intent. Implementation
   waits on the exploration…"* **Now true:** the foundation (`rfc/campaign-core.md`) and the unrated
   Act-II boss (`rfc/campaign-boss-games.md`) are implemented; `/campaign` is a live route.

3. **`design/06-campaign.md` D439 amendment (≈ line 452):** the boss is described as played *"against
   a calibrated rung"* through `POST /rated-games`. **Now true:** the shipped boss is an **unrated**
   `boss_game` against an exact registered bot profile, started through the campaign start route;
   rated admission waits for a calibration receipt. Intent may stay as the target; the sentence
   should say the rated arm is not yet shipped.
