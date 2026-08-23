# Campaign foundation

Campaign is an implementing surface. The authored contract and registry exist; campaign runs,
routes, the map and the in-run strip do not yet exist and must not be advertised as available.

An authored campaign is a closed document with exactly three ordered acts and three layers per act.
Each layer offers one to three pack encounters. Every act ends with one unavoidable boss: its final
layer has exactly one choice and that node is the act's only boss. Nodes may suppress or reward only
the ten assistance modules; `rules_floor` is interaction affordance and can never be inventory.

Candidate economy values are non-negative and non-increasing from act 1 to act 3. They remain
marked `validation: "candidate"`. The validator also joins every encounter to the live pack
registry, refuses duplicate node identities, and refuses starting/reward modules outside the
campaign workflow ceiling.

`CampaignRegistry` retains documents by exact `(id, version)`. A future `CampaignRun` pins both and
never silently migrates to a newer authored document. Duplicate identities and invalid documents
fail closed; a deployment with no `content/campaigns/` directory exposes an empty registry rather
than fabricated seed content.

The runtime also owns the pure module chokepoint. `campaignModuleInventory` combines the permanent
rules floor, authored starting modules and earned unlocks, rejecting anything outside the campaign
context ceiling. `effectiveCampaignModules` then computes campaign ceiling ∩ earned inventory ∩
boss suppression ∩ chosen preset in canonical module order. Suppression can only narrow the result
and can never remove `rules_floor`; a preset cannot expose an unearned module.

The workflow context `campaign` is registered separately from pack/position/imported sessions. Its
candidate default preset is Guided, Support is unavailable, and the campaign preference keys share
the existing device-local assistance/workflow grammar. This registration does not make a run a
campaign run: that linkage belongs to the future campaign event store and routes.

Storage remains ordered behind the accepted longitudinal-store and bot-policy migrations. Until
that queue is lawful, no rewind charge, unlock, seal, or active campaign pointer is persisted.
