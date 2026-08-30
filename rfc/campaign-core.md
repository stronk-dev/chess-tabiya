# RFC: Campaign core — the pure-chess campaign over authored encounters

- **Status:** draft — **[[D2077]]–[[D2086]] author repair complete 2026-08-30; fresh
  independent review required.** The terminal bundle, writable module loadout, exact document
  snapshot, source-identified charge ledger, typed reward-family projections, run origin, closed
  command family, atomic award issuance and official-content authority are being repaired as one
  replayable campaign operation. No campaign schema, migration, production route, official
  campaign or surface may resume before another independent review. *(Prior line:
  implementing — 2026-08-23 authored-contract + registry + module-algebra checkpoints. Before
  that: accepted — 2026-08-22, by claude as register owner after independent cross-review and 15
  in-place corrections; draft — 2026-08-22.)*
- **Author:** claude (drafted from `planning/campaign/rfc-derivation.md`, the HEAD derivation of
  every seam this document composes; derivation HEAD `c93ae83`, spot-re-verified at drafting HEAD)
- **Created:** 2026-08-22
- **Design refs:** `design/06-campaign.md` (whole; §2c D945 ruled paragraph, §2b/§5 boss and
  encounter vocabulary, §3 standing laws, §4 inventory, §5 map/act ladder), `design/00-thesis.md`
  §§70, 93-94 (the prohibitions), `design/05-in-run-experience.md` §3/§3a (honesty outer gate)
- **Exploration gate:** the owner's 2026-08-22 waiver, verbatim *"draft v1 now"* — ledgered
  [[D953]], annotated at `planning/campaign-research-queue.md:7-10`. R7/R8 remain open and
  experiential; this RFC's play-derived amendments are their landing site (the presets pattern,
  chosen with the Gate F tension stated in the ruling record).
- **Depends on:** `rfc/intent-presets.md` (accepted — the `ContextContract` registry this RFC
  registers into; its Discharge D3 names this registration), `rfc/learner-modules.md` (accepted —
  the closed 11-module union, campaign named as consumer at `:125-126`), `rfc/bot-policy.md`
  (author-repaired, fresh review required — opponent selection and the preceding migration
  position), `rfc/longitudinal-store.md` (author-repaired, fresh review required — projection/
  rebuild discipline and the preceding migration position), `rfc/theory-knowledge-pipeline.md`
  (exact bundle/passage authority for `theory_unlock`; implementation dependency), the shared
  server-readable appearance catalog required by [[D1696]], and the portable-account-data
  inventory/checker (award export, deletion and restore). **Consumer closure additionally serializes
  behind accepted and implemented `rfc/pack-capability-contract.md`**, exporting
  `derivePackCapabilityRequirements`, and **accepted and implemented
  `rfc/theory-drill-current-joins.md`**, exporting `compileApplicabilityResult`; both are returned at
  this author checkpoint, so Campaign implementation cannot begin by substituting miniature local
  graphs.
- **Parent / amends:** — (first campaign RFC; `design/06-campaign.md` is the intent authority)
- **Supersedes / superseded by:** —
- **Planning:** `planning/campaign/`

```tabiya-claims
migration | position behind bot-policy | campaign_runs; campaign_events; campaign_reward_awards
campaign-schema | lane 2 | reward becomes a closed three-member run-reward union; nodes declare exact reward consumers; durable cosmetic awards reference the shared appearance catalog
run-schema | lane 0.25 | RunSession.origin gains optional exact campaign encounter identity (campaignRunId, nodeId, campaignDocumentDigest); run.started persists it for Review/export/restore
```

## Summary

This RFC specifies the **pure-chess campaign** — the definite half of the owner's D893 ruling —
as a buildable v1: a 9-node, 3-act authored map whose every node is a **shape-1 authored
encounter** (a drill pack), whose run-scoped progression consists of **typed module, theory and
rewind-resource rewards that must have later and boss consumption opportunities**, whose
difficulty pressure is the **suppressor boss** (capability suppression, never chess judgement),
and whose economy is the owner's D945 ruling made mechanism: **rewind and
proactive branching inside campaign encounters are an earned resource** — charges earned by
sealing nodes, spendable in any encounter including the boss, scaling by act so lower acts are
more forgiving. The campaign registers as the **eighth `WorkflowContextId`** in the accepted
intent-presets registry (discharging that RFC's D3), holds run state **server-side** in
`campaign_runs` and `campaign_events`, and records durable cross-run marks/cosmetics in the
append-only `campaign_reward_awards` authority in the same migration position behind `bot-policy`.
It seals nodes by the submitted branch through the shipped `reveal` verb. Rated bosses,
prediction/survival encounters, evidence-dark nodes, time controls and reward families without a
real registry/consumer are **deferred with named discharge rows** — each has an owner fork or missing
seal mechanism this v1 refuses to decide silently. The campaign never grades a move, never
manufactures chess truth, and never surfaces a rewind count as a score: the three named traps
each get a refusal clause with a criterion behind it.

## Motivation

`design/06-campaign.md` is complete intent with all six D439/D836 amendments landed and the
D945 economy ruled — and **zero campaign symbols exist at HEAD**: no map, no node, no unlock,
no inventory, no roll-up (grep census in derivation §4). The owner's win condition (`06:18-21`):
*"you have built the right combination of theory/classification/hints which basically allows a
noob to play against an IM/GM boss, and still win because it has the right help? You basically
build your coach."* The thing tested is the coach the learner assembled, not their chess — which
is why the whole design is expressible without the product ever grading anyone.

The original v1 cut was the derivation's recommended cut (derivation §8), for stated reasons rather than
taste: shape-1 encounters are the only encounter class whose seal mechanism **ships today**
(`ObjectiveState`/`sealedState`); the rated boss needs `learner-rating` (draft) and carries the
persona/`targetElo` disjointness (derivation gap 11); prediction and survival seals are new
mechanisms (gaps 5–6). [[D1040]] and [[D1565]] later resolved the progression shape: playing
unlocks the educational path, winning gates only prestige, a run owns a meaningful temporary
build, and a separate durable horizon survives the run. This amendment specifies that ruled
contract without inventing unregistered titles, modifiers, skip starts or variant ids.

Out of scope: everything deferred above (each with a Discharge row); opponent-policy internals
(bot-policy's seam ends at `run.opponentPolicy`); module eligibility (the D660 bar);
campaign-screen visual composition beyond the boundary rule in §7 (composition last, per D717);
any change to authored pack bytes; authorship of the official campaign's chess curriculum (an
owner/human content obligation in Discharge D8, not Codex implementation);
and [[D1600]]'s no-exhaustible-tool failure stage. The campaign inventory exposes `resting` as an
input but this RFC neither chooses nor persists a new failure policy.

## Specification

Line citations to shipped code were spot-re-verified at drafting HEAD:
`RunSessionKind` (`packages/runtime/src/types.ts:36`), `ObjectiveState` (`types.ts:4-10`),
`ABSORBING` (`packages/runtime/src/trajectory.ts:6`), `RunService.reveal`
(`apps/server/src/service.ts:1547`), `rewind` import and service path (`service.ts:31,717`),
the module table (`rfc/learner-modules.md:480-492`), `STORAGE_VERSION = 24`
(`apps/server/src/storage.ts:476`).

### §1. Objects and vocabulary

**Naming collision, pinned first.** `design/06` calls a campaign attempt "the run"; the codebase
calls a play session a run (`DrillRun`, `packages/runtime/src/types.ts:318`; `RunService`). This RFC keeps both and never abbreviates: the
campaign object is **`CampaignRun`** everywhere in code and schema (`campaign_runs` table), and
"run" unqualified always means the play run. A campaign run *contains* play runs (one per
encounter attempt); no symbol named bare `run` is added by this RFC. (Proposed row 1.)

**The campaign definition** is a new authored content document (the container `design/04` §1
called Track and D303 measured as 0 hits repo-wide — this RFC builds it campaign-shaped, not
general): `content/campaigns/<id>.json`, validated by a new `campaign-validation.ts` beside the
pack validator, schema home `packages/schema/src/campaign/`. Top level:

```
CampaignDocument {
  id: string;                    // slug
  title: string;
  version: number;               // authored document version
  acts: [Act, Act, Act];         // exactly three — v1 is fixed-shape
  economy: CampaignEconomy;      // §2
  startingModules: UnlockableModuleId[];  // §3.2's start grants; may be empty
  durableRewards: DurableRewardGrant[];   // §3.6; exactly one completion and prestige mark
}
Act {
  id: "act1" | "act2" | "act3";
  layers: [Layer, Layer, Layer]; // exactly three — 9 sealed nodes per completed CampaignRun
}
Layer {
  choices: Node[];               // 1..3 alternatives; the learner seals exactly one
}
Node {
  id: string;                    // unique within the document
  encounter: { kind: "pack"; packId: string };   // shape 1 ONLY in v1 — the closed enum has one member
  suppress?: ModuleId[];         // suppressor mechanism, §3.3; boss nodes use this
  reward?: CampaignRunReward;    // §3.1's closed three-member union
  consumes?: CampaignRunRewardRef[]; // checked declaration over compiled consumers, §3.4
  boss?: true;                   // exactly one per act; layer 3's only choice (lint)
}
```

Campaign schema **lane 2** owns these additions. `CampaignRunReward` is a discriminated union;
`CampaignRunRewardRef` is the same identity without grant-only fields such as `amount`.
`DurableRewardGrant` is `{ when: "completed" | "prestige"; reward:
DurableCampaignReward }`. Schema v2 requires exactly one `completion_mark` under `completed` and
one `prestige_mark` under `prestige`; catalog-validated `cosmetic_unlock` rows are optional and may
use either gate. The validator refuses duplicate reward identities and any mark under the wrong
gate. `training-mode-variants` follows lane 2 and must widen the then-landed schema rather than edit
version 1 in parallel. No implementation may change `schemas/campaign.schema.json` while the
registered head remains 1; `make register-check` must observe the live lane-2 claim.

The `encounter.kind` union is **closed at one member in v1**; adding `position` (rated boss),
`prediction` or `survival` is a schema change belonging to the Discharge rows. A validator rule
`CAMPAIGN_ENCOUNTER_PACK_UNKNOWN` (error) refuses a `packId` absent from the registry, and
`CAMPAIGN_BOSS_PLACEMENT` (error) enforces, per act: exactly one `boss: true` node, in layer 3,
**and layer 3 carrying that node as its only choice** — a multi-choice final layer would let
path choice dodge the act boss, which the act ladder does not intend (`06:436-439`'s three-leg
shape ends every act at its boss). Path choice is
the StS gesture (D893: *"in Slay the Spire you choose paths"*): the learner picks one node per
layer; unpicked alternatives stay unvisited for this CampaignRun.

**Path choice has no declared minimum, and in v1 that makes run-to-run variance an authoring
property rather than a guaranteed one** (amendment 2026-08-23, claude on measured evidence;
`planning/campaign/roguelike-reconciliation.md` Am. 7). `choices: Node[]` is `1..3`, and only
layer 3 is linted (to its single boss). A document whose every layer offers exactly one node
validates, and such a CampaignRun replays identically every time. That was tolerable while the
loadout was expected to carry variance — but the loadout is not in this RFC (zero occurrences of
`lens`, `loadout` or `slot`), synergy discovery is **refused** on measurement ([[D277]]: best
conjunction 35.7%/2.73× against best single leaf 69.4%/12.64×, 0 of 7 beating their components),
and the catalogue is fixed within a run. **Path choice is therefore the only run-to-run variance
v1 has**, and nothing requires a document to supply any.

v1 ships the posture rather than a lint: `CAMPAIGN_PATH_WIDTH` is a **warning**, not an error,
naming every layer of width 1 outside layer 3. Warning rather than error because a deliberately
linear teaching document is a legitimate artifact and this RFC does not know it is not the intent;
error would refuse a shape the design never prohibited. **Criterion 15** makes the warning
failable in both directions.

**Contract fixture and product content are different artifacts.** The deterministic nine-node
mechanical fixture lives under
`tools/campaign-two-horizon-author-contract/fixtures/campaign-contract.json`; it exists only to
falsify schema/fold/API invariants and is never registered or rendered. The 1.0 product requires at
least one separate official document under `content/campaigns/`, authored and reviewed by the
OWNER/human chess-content authority after the producer/module/theory contracts stabilize. Its
curriculum must include grounded opening, middlegame and endgame consequence encounters, varied
path choices, later and boss consumption for every reward, source/provenance for every theory
passage, and a checked dependency/provider availability matrix. Codex may validate, attach existing
registered identities and implement the machinery; law 8 forbids it from choosing the campaign's
chess lessons, pack sequence, strategic rationale or boss curriculum. The fixture passing cannot
satisfy the official-content criterion, and official content cannot weaken the mechanical fixture.

**Map progression** is strictly forward: layer N+1 opens when a node in layer N seals (§4). No
node re-entry after seal — retrying a node means retrying it before declaring done (§2 prices
the *navigation*, §4's submitted-branch rule prices the *commitment*; declaring done is what
counts, `06:441-444`).

### §2. The earned economy — D945 made mechanism

The ruling, verbatim (`design/06-campaign.md:213-216`, [[D945]]): *"you have to earn rewinds or
proactive branching... not infinite, not forbidden. it's what allows a weaker player to actually
win a campaign (on lower floors/acts/whatever)."* Scope (`06:223-228`): **campaign encounters
only** — nothing changes for drill packs, Just Play, or Review.

```
CampaignEconomy {
  startingCharges: number;                  // granted at CampaignRun creation
  actGrants: { act1: number; act2: number; act3: number };  // charges granted per node SEALED in that act
  validation: "candidate";                  // §2.3
}
```

**2.1 Earn.** The canonical charge ledger has three source-discriminated entry kinds:
`starting { campaignRunId }`, `act_seal { nodeId, act, amount }`, and
`reward_grant { nodeId, rewardIdentity, amount }`; spends are
`mutation_spend { playRunId, mutationCommandId, amount: 1 }`. Starting income is derived once from
the pinned document at campaign creation. The atomic `node_committed` event (§4.1) carries exactly
one act-seal amount and, when the node reward is `resource_grant`, a distinct reward-grant amount and
identity. Both enter the fold exactly once with that event sequence; two rewards for the same
resource but different node/reward identities both count, while replay of either event does not.
Income prices *finishing*, not winning, so a failed seal still funds the next attempt at the next
node. Lint `CAMPAIGN_ECONOMY_MONOTONE` (error) refuses
a document where `actGrants` increases with act index: the ruling scales counts *"(on lower
floors/acts/whatever)"* so that — in the design/06 amendment's words — *"lower floors are more
forgiving"* (`06:219-221`), which means act1 ≥ act2 ≥ act3, and the constraint is
authored-document-checkable.

**2.2 Spend and enforcement.** One charge is spent by each **persisted** play-run mutation that
abandons a line inside an active campaign encounter — one charge per gesture, at the four
shipped entry points: the rewind verb (`RunService.rewind`, `service.ts:717`, covering its
`rewindToCheckpoint` dispatch), proactive branching from an ancestor node (`RunService.fork`,
`service.ts:744`), adopting a simulated line (`enterSimulation`, `service.ts:1396` — it persists
a fork from the simulation's source node), and branch-group creation (one charge per group
whatever the member count — the flow's one persisted rewind, `service.ts:958`). The scratch
mutations inside `simulate` (`service.ts:1312-1391`) are never saved and spend nothing:
comparison stays free; only *entering* a line it produced is priced. Reviewing without creating
a branch or rewinding spends nothing. Enforcement is **server-internal with no run
field**: a new private guard `RunService.#campaignCharge(runId, at)` looks up whether `runId` is
the active encounter run of a `campaign_runs` row (§6), and if so re-derives the balance from
that row's events and appends `charge_spent` with the play-run mutation command id in the same
transaction as the mutation (the §4.2
projection is the balance's only home — no balance column exists to drift) — or refuses
with the new typed error **`CAMPAIGN_REWIND_EXHAUSTED`** (HTTP 409, typed body like
`INVALID_REQUEST`'s) when the balance is zero. A non-campaign run passes the guard untouched.
The lookup is one indexed query; §6 pins the index.

**2.3 The numbers are candidates.** `startingCharges` and `actGrants` are authored parameters
behind the owner-use validation gate — the same `validation: "candidate"` device intent-presets
§7 uses under [[D906]](3) and [[D649]]: the seed values ship marked, the owner's play rulings
confirm or re-table them, and the commit dropping the marker cites the ruling. The RFC
deliberately does not argue the seed values are right; it argues they are **cheap to change and
impossible to change silently**.

**2.4 Disclosure.** The charge balance is visible before any spend: the in-run campaign strip
(§7) renders `⟲ N` with the typed copy *"Earned rewinds: N remaining this campaign"*, and the
refusal surface renders `CAMPAIGN_REWIND_EXHAUSTED`'s message verbatim. A spend that the learner
cannot see coming would make the economy a trap (`06` §3 law: legibility escalates, power does
not); criterion 4 makes the pre-spend visibility failable.

**2.5 What the economy is not.** Charges are not purchasable, not sellable, not convertible, and
never an input to any verdict, seal, module sentence, or (future) rating — a charge count is C1
in scoring clothes the moment it touches a score, which is the D302 trap (§8). The balance is
inventory (inner gate), never honesty (outer gate).

### §3. Progression — two horizons, one honest inventory

**3.1 Run-scoped reward vocabulary.** `CampaignRunReward` is exactly:

```ts
type CampaignRunReward =
  | { kind: "module_unlock"; moduleId: UnlockableModuleId }
  | { kind: "theory_unlock"; bundleId: TheoryBundleId; passageId: TheoryPassageId }
  | { kind: "resource_grant"; resourceId: "campaign_rewind_charge"; amount: PositiveInteger };
```

The module pool is **exactly ten**: the closed eleven in the compiled learner-module registry
minus `rules_floor`. An earnable rules floor would break the floor-and-ceiling token, so the
exclusion remains a type: `UnlockableModuleId = Exclude<ModuleId, "rules_floor">`, with a
compile-time count assertion. `theory_unlock` stores the exact bundle and passage identity from
`theory-knowledge-pipeline`; it cannot land until that server-readable authority exists. Missing
or incompatible source bytes leave the item owned with `source_unavailable`; the runtime never
substitutes a passage or asks an LLM to recreate it. `resource_grant` is closed at the already
defined campaign rewind charge and a positive amount. A generic `tool_unlock`, free-form reward id,
negative grant or second resource kind fails schema validation. These members share acquisition
timing, not semantics; the wire and event log retain the discriminant.

Law 8 remains structural: a module opens a registered evidence consumer, a theory entry opens
attributed text, and a resource opens an existing mutation affordance. Acquisition asserts
availability only; it never asserts that a reward is useful, caused a win or taught the learner.

**3.2 Owned, equipped and effective are different facts, and reward families are never
intersected.** The fold carries three typed domains: module ownership/loadout, exact theory-passage
ownership, and the charge ledger. Only modules are equipable. Acquisition auto-equips a module when
it is inside the campaign module ceiling; otherwise append refuses. Later learner changes use one
event-owned `loadout_changed { equippedModuleIds }` command (§4.5/§6), whose canonical set must be a
subset of owned modules and the current campaign module ceiling. It supports both equip and
unequip, is expected-revision/idempotency guarded, and has no slot count. A theory passage and a
resource sent to this command are typed `CAMPAIGN_LOADOUT_FAMILY_INVALID`; there is no decorative
Equip action with no durable mutation. Preset changes append no campaign event and mutate neither
module ownership nor loadout.

The three compiled projections are separate:

```text
ModuleInventoryProjection
  owned       = module acquired in this CampaignRun
  equipped    = module present in the latest event-owned module loadout
  ready       = equipped and not resting under the separately ruled failure policy
  suppressed  = module denied for this encounter with a registered reason
  available   = module's declared evidence/provider source is reachable
  effective   = moduleCeiling ∩ owned ∩ equipped ∩ ready − suppressed ∩ available

TheoryInventoryProjection
  owned       = exact bundle/passage acquired in this CampaignRun
  applicable  = compileApplicabilityResult reaches this exact passage from the encounter pack
  authorized  = the passage's registered theory consumer module is effective
  disclosable = passage directness is within the context disclosure ceiling
  available   = exact attributed source bytes are reachable
  effective   = owned ∩ applicable ∩ authorized ∩ disclosable ∩ available

ResourceLedgerProjection
  balance     = starting + act-seal income + source-identified reward income − spent
```

`presetRequest` is presentation preference only. It can narrow which effective modules/theory
render by default, but cannot remove an earned item from the shelf or mutate canonical state. Every
owned but ineffective **module** renders exactly one precedence-ordered reason:
`honesty_ceiling`, `resting_until_act`, `boss_suppressed`, `source_unavailable`, or
`not_equipped`. Every ineffective **theory passage** renders exactly one of
`not_applicable`, `authorizing_module_inactive`, `disclosure_ceiling`, or `source_unavailable`.
Resources render their balance and mutation availability, never module-style reasons. The first
matching reason in each family's own closed precedence wins; zero/multiple reasons refuse.
`resting_until_act` remains only an input seam for [[D1600]]; this RFC does not decide when a module
enters that state.

A CampaignRun starts with `rules_floor` plus the document's `startingModules`. An unlock outside
the campaign context ceiling is refused at append time with
`CAMPAIGN_UNLOCK_OUTSIDE_CEILING`. Inventory may never raise the honesty ceiling.

**3.3 The suppressor boss.** A node's `suppress: ModuleId[]` subtracts those modules from
availability for that encounter only — Balatro's boss blind, law-8-legal by construction because
it speaks about the learner's information, never about chess. Suppression is narrowing, disclosed
before entry, and may not name `rules_floor`. It never deletes ownership or equipment. A later
encounter without that suppression sees the item again unless another exact reason applies.

**3.4 Reward-to-consumer closure.** `CampaignRunRewardRef` is a closed discriminated identity:
module id, exact theory bundle/passage, or `campaign_rewind_charge`. A campaign node may declare
`consumes` refs, but declarations are not authority. The validator compiles the real consumer set
from the same runtime registries used during play:

- a module ref must resolve to the node's pack capabilities, compiled module binding and campaign
  context ceiling;
- a theory ref must resolve to an exact published bundle/passage reachable from that node's pack;
- the rewind resource resolves only when the campaign mutation controller exposes at least one of
  the four charge-consuming gestures for that encounter.

The compiler imports, rather than restates, two predecessor views. Module reach starts from
`derivePackCapabilityRequirements(pack)` in accepted/implemented `pack-capability-contract` and
joins only through the compiled learner-module registry. Theory reach starts from
`compileApplicabilityResult({ pack, passage })` in accepted/implemented
`theory-drill-current-joins` and additionally retains the exact registered theory-consumer module
and disclosure/directness ceiling. Until either returned predecessor is accepted and implemented,
Campaign validation returns typed `CAMPAIGN_CONSUMER_AUTHORITY_UNAVAILABLE`; it never substitutes a
campaign-local graph.

The authored `consumes` set must equal the compiled set after canonical identity normalization;
missing and extra declarations both fail. For every reward, the validator enumerates **every
reachable continuation after acquisition** and requires (a) a later consumer and (b) a later boss
consumer on every continuation. The source node, reward identity and first failing continuation
are reported by `CAMPAIGN_REWARD_NO_LATER_USE` or `CAMPAIGN_REWARD_NO_BOSS_USE`. A reward on the
final boss, all later bosses suppressing it, source-unavailable theory, or a copied consumer list
fails. This proves opportunity only, never usefulness or learning effect.

**3.5 What a boss is not in v1.** Not a rated game (deferred, Discharge D1 — including the
persona/`targetElo` disjointness); not a `position` session; not horizon-free. It seals exactly
like every other node.

**3.6 Prestige and durable rewards.** A node is won only when its §4.1 seal carries
`verdict === "achieved"`, copied from `ObjectiveState`. Prestige is exact and non-vacuous:

```text
prestigeEligible = status === "completed"
                ∧ seals.length === selectedLayerCount
                ∧ every selected layer has exactly one seal
                ∧ every seal.verdict === "achieved"
```

Zero seals and a perfect prefix are false; a completed perfect path is true; a completed mixed
path is false. `RunOutcome` remains inapplicable because v1 nodes are authored objectives, not
rules-terminal games.

The durable reward vocabulary is exactly:

```ts
type DurableCampaignReward =
  | { kind: "completion_mark"; campaignId: CampaignId; campaignVersion: number }
  | { kind: "prestige_mark"; campaignId: CampaignId; campaignVersion: number }
  | { kind: "cosmetic_unlock"; target:
      | { kind: "app_theme"; id: AppThemeId }
      | { kind: "board_theme"; id: BoardThemeId }
      | { kind: "piece_set"; id: PieceSetId } };
```

Completion marks may require only completed status. Prestige marks and prestige-gated cosmetics
also require `prestigeEligible`. Cosmetic ids come from one shared server-readable appearance
catalog; browser-local or unknown ids fail authoring and award application. Durable rewards never
gate ordinary packs, theory, the standard campaign path or default starting tools. Titles,
modifiers, skip starts and variant-run unlocks remain refused until a typed meta-reward registry
names a real consumer for every member ([[D1698]]); this is a deliberate 1.0 vocabulary boundary,
not permission to encode them as cosmetic strings.

Prestige is still a projection over run events and remains outside the evidence plane. The award
history that records a durable consequence is separate (§6); no progression, charge grant, map
advance or node availability may read prestige or durable ownership.

### §4. Sealing — the submitted branch, node verdicts, and the roll-up

**4.1 Declaring done.** The ruling (`06:441-444`): *"a node remembers the branch you SUBMIT…
declaring done is what counts."* The verb is the shipped `reveal`
(`RunService.reveal`, `service.ts:1547`), extended by one new server route:

```
POST /campaign-runs/:campaignRunId/nodes/:nodeId/submit
{ runId, branchId, expectedRevision, commandId }
```

which validates authenticated ownership, the expected event revision, command-id reuse, that the
branch belongs to the run and that the run belongs to the node's active encounter, then reads the
submitted branch tip's objective state (`Node.objectiveState`,
`packages/runtime/src/types.ts:121` — the same source `projectAttempts` reads,
`apps/server/src/progress.ts:127`; in a trajectory pack the tip carries the final leg's state,
earlier legs having sealed as `TrajectoryLegSpan.sealedState`, `trajectory.ts:15`). It compiles one
indivisible `node_committed` payload:

```ts
interface NodeCommittedEvent {
  readonly kind: "node_committed";
  readonly commandId: CampaignCommandId;
  readonly expectedRevision: number;
  readonly nodeId: string;
  readonly runId: string;
  readonly branchId: string;
  readonly verdict: "achieved" | "failed" | "transitioned" | "open";
  readonly actIncome: { readonly source: "act_seal"; readonly act: ActId; readonly amount: PositiveInteger };
  readonly reward: CampaignRunReward | null;
  readonly terminal: "continue" | "completed";
}
```

The payload includes the node's typed reward **whatever the verdict**—the same
finishing-not-winning principle as §2.1 and ADR-0007's unlocked-by-playing—and its resource amount
is a second source-identified ledger entry. The compiler refuses absent registry/source/ceiling
authority before opening the transaction. The fold applies the seal, act income, optional reward,
loadout auto-equip and cursor/terminal transition as one semantic unit; there are no trailing events
for a final node to forbid. On the final selected layer it computes the next completed/prestige
state and inserts every eligible durable award in `campaign_reward_awards` **in the same database
transaction** as this single event and materialized status update. Injected failure in event append,
fold validation, status update or any award insert rolls back all effects. A concurrent or
response-loss retry with the same command and operands returns the stored event/result/award bytes;
same command with different operands refuses `CAMPAIGN_COMMAND_REUSED`. The node verdict vocabulary
**is** `ObjectiveState`'s absorbing subset
plus the non-absorbing fallback: `verdict = "achieved" | "failed" | "transitioned" | "open"`,
mapped 1:1 from the submitted tip (an `active`/`preserved`/`degraded` tip seals as `"open"` —
submitting an unfinished line is legal and priced only by its own verdict). No new judgement
enters: the seal is a copy of the pack's own objective machinery. The verdict is a **new object
whose only home is `node_committed.verdict`** — it is not the shipped `AttemptVerdict`
(`"open" | "unstable" | "stable"`, `progress.ts:62`), which stays untouched; the two share the
`"open"` token but not a type.

**RULED 2026-08-23 ([[D1040]]) — the any-verdict grant above is the settled core behaviour, not
an unexamined default.** The owner ruled *progression is unlocked by PLAYING; WINNING gates the
PRESTIGE layer only*. The `node_committed.reward`-on-any-verdict field **is** that
ruling, and it is recorded here so no future reader re-opens it as an oversight: a `failed` seal
grants the node's reward exactly as an `achieved` seal does. The ruling is consistent with
[[D945]]'s earned-rewind economy, whose stated point is that a weaker player can still finish a
campaign — a core path gated on winning would have made both mechanisms decorative. Where winning
*does* gate is §3.6. The prior three-event spelling (`node_sealed` → `charge_earned` →
`run_reward_acquired`) is superseded; those effects now exist only inside `node_committed`.

**4.2 The run-level roll-up** — `06:452-454`'s *"computed nowhere"*, the smallest new part,
built here as a **projection, not a table** (the `attempts`/rating-as-projection precedent):

```
campaignRunState(campaignRunId): {
  cursor:
    | { kind: "active"; act: ActId; layer: 1 | 2 | 3 }
    | { kind: "completed" }
    | { kind: "abandoned" };
  nodes: Record<nodeId, { verdict, runId, branchId }>;
  charges: {
    entries: ChargeLedgerEntry[];
    startingIncome, actIncome, rewardIncome, spent, balance;
  }; // balance = starting + actIncome + rewardIncome − spent, never negative
  inventory: {
    modules: { owned: UnlockableModuleId[]; equipped: UnlockableModuleId[] };
    theory: { owned: ExactTheoryPassageRef[] };
  };
  status: "active" | "completed" | "abandoned";
}
```

computed by folding `campaign_events` in `seq` order. `node_committed` is reduced atomically: its
seal, both possible income sources, reward, auto-equip and terminal marker either all affect the
next state or none do. `loadout_changed` replaces only the canonical equipped-module set;
`charge_spent` appends one source-identified spend. **Determinism discipline inherited from
`rfc/longitudinal-store.md`:** rebuild from the event log byte-equals the incrementally
maintained state (criterion 9); the fold is pure; no wall-clock reads inside it. `completed`
means exactly one committed node for every selected layer and requires the final event's own
`terminal: "completed"`. `campaign_abandoned` is the sole abandonment
authority and is terminal; `campaign_runs.status` is a materialized projection checked against the
fold, never a second input. No event may follow completion or abandonment. The cursor's terminal
members close [[D1233]]/[[D1234]] without an unexplained `null`. Prestige is §3.6's read over the
same seals and denominator; the fold still invents no aggregate score.

**4.3 Path-scoped seals stand.** Rewinding inside a later encounter never edits an earlier
node's seal — seals are append-only events; *"rewinding to a clean line erases it — that is the
thesis working"* applies **within** an unsubmitted encounter, never to sealed history.

**4.4 Abandoning the campaign.** `POST /campaign-runs/:campaignRunId/abandon` compares the expected
revision and command id, appends exactly one `campaign_abandoned`, clears the materialized active encounter
pointer and projects the abandoned terminal cursor in one transaction. Repeating the same command
against the same idempotency key returns the existing terminal projection; a different command
after either terminal state returns `CAMPAIGN_RUN_TERMINAL`. Leaving one encounter without
abandoning the campaign remains the free reading recorded in Open question 3 and creates no new
event kind.

**4.5 Loadout mutation.** `PUT /campaign-runs/:campaignRunId/loadout` accepts
`{ equippedModuleIds, expectedRevision, commandId }`. The service canonicalizes unique module ids,
requires each to be owned and inside the compiled campaign module ceiling, refuses theory/resource
identities, and appends one `loadout_changed` event. The fold replaces only the equipped module set;
ownership, theory passages and charge entries are byte-identical before/after. Same command/same
operands returns the stored projection; changed operands, stale revision, terminal run or wrong
learner refuse through §7.1's closed error algebra.

### §5. The eighth context — registration with intent-presets

Per `rfc/intent-presets.md` Discharge D3 (quoted whole in derivation §3.1), registration means:

1. `"campaign"` joins `WORKFLOW_CONTEXTS` (eighth member) with localStorage preference key
   `tabiya.assistance.v1.campaign` under the shipped `assistanceKey` grammar
   (`apps/web/src/lib/assistance-preference.ts:15`).
2. A full `ContextContract` row, every value marked `validation: "candidate"` (§2.3's device):
   `defaultPreset: "guided"`; seed `allowedPresets: quiet, guided, theory_only, analysis` (the
   Drill row's set, `intent-presets.md:144`); seed may-never-show complement
   `{ blunder_prevention }` — inherited with the Drill row's R3 rationale (Support's at-commit
   prevention is not offerable outside Just Play) and non-empty so criterion 6's negative
   fixture has a real member. With this seed `blunder_prevention` is typed-unlockable (§3.1)
   but contract-refused until the owner re-tables the candidate — the type stays ten; the
   contract is the narrower authority, exactly §3.2's algebra. `configClamp.boardLighting` is
   drawn from the registry-invariant token set `"legal" | "sight" | "evidence"` — the campaign
   can never darken the rules floor, by the same compile-time test that guards the other seven.
3. **The run origin — claimed because this RFC already has Review/export consumers** (repair of
   [[D2083]]). `RunSession` gains one optional persisted origin in run-schema lane **0.25**:

   ```ts
   type RunOrigin = { readonly kind: "campaign_encounter";
     readonly campaignRunId: string; readonly nodeId: string;
     readonly campaignDocumentDigest: `sha256:${string}` };
   ```

   `POST /campaign-runs/:campaignRunId/nodes/:nodeId/start` constructs it server-side from the
   authenticated campaign state and pinned document snapshot; callers cannot supply it. It is
   written in `run.started`, returned on resume, preserved by direct Review URL/refresh and account
   export/import, and read by Review, longitudinal selectors and `deriveWorkflowContext`. Plain runs
   carry no origin and infer none. Deleting campaign history does not rewrite the play run: Review
   retains the origin and renders `campaign_history_unavailable`; restoring matching campaign rows
   reconnects only when run id/node/document digest all match. The campaign-side active pointer is
   still the mutation guard, but is no longer the sole identity source.
4. The per-encounter ceiling (D3's *"encounter-authored ceilings"*) is §3.2's composition —
   narrowing inside the contract, exactly the algebra's shape.

### §6. Persistence — run events plus durable awards, one migration position

Claimed above: `migration | position behind bot-policy | campaign_runs; campaign_events;
campaign_reward_awards`. The named predecessor is the authority; no prose ordinal is copied from
the moving queue. The migration number is taken at landing as `STORAGE_VERSION + 1` per the
register rule and the body uses frozen literals.

```sql
CREATE TABLE campaign_runs (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,          -- CampaignDocument.id
  campaign_version INTEGER NOT NULL,  -- pinned at creation; a CampaignRun never migrates documents
  campaign_document_digest TEXT NOT NULL, -- RFC-8785 SHA-256 of canonical snapshot
  campaign_document TEXT NOT NULL,    -- canonical immutable bytes used for all replay/restore
  status TEXT NOT NULL CHECK (status IN ('active','completed','abandoned')),
  active_encounter_run_id TEXT,       -- NULL between encounters; no FK by choice (drill_runs is snapshot storage with its own deletion path; the §2.2 guard validates at lookup)
  created_at TEXT NOT NULL
) STRICT;
CREATE INDEX idx_campaign_runs_active_encounter ON campaign_runs(active_encounter_run_id)
  WHERE active_encounter_run_id IS NOT NULL;   -- §2.2's guard is one indexed lookup
CREATE INDEX idx_campaign_runs_learner ON campaign_runs(learner_id, status);

CREATE TABLE campaign_events (
  campaign_run_id TEXT NOT NULL REFERENCES campaign_runs(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN
    ('campaign_created','node_entered','node_committed','loadout_changed','charge_spent',
     'campaign_abandoned')),
  command_id TEXT NOT NULL,
  expected_revision INTEGER NOT NULL,
  payload TEXT NOT NULL,              -- canonical JSON per event kind (§4.1, §2)
  at TEXT NOT NULL,
  PRIMARY KEY (campaign_run_id, seq)
) STRICT;
CREATE UNIQUE INDEX idx_campaign_events_command
  ON campaign_events(campaign_run_id, command_id);

CREATE TABLE campaign_reward_awards (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_version INTEGER NOT NULL,
  campaign_run_id TEXT NOT NULL REFERENCES campaign_runs(id) ON DELETE CASCADE,
  durable_reward_id TEXT NOT NULL,    -- canonical identity compiled from §3.6's closed union
  reward_payload TEXT NOT NULL,       -- canonical JSON of that exact union member
  awarded_at TEXT NOT NULL,
  PRIMARY KEY (
    learner_id, campaign_id, campaign_version, campaign_run_id, durable_reward_id
  )
) STRICT;
CREATE INDEX idx_campaign_reward_awards_owned
  ON campaign_reward_awards(learner_id, durable_reward_id);
```

Discipline inherited by name: `STRICT` + literal CHECK strings (the migration-9 freeze lesson,
`rfc/README.md:240`), `ON DELETE CASCADE` on `learners(id)`, create-table/index only, **no
backfill** (nothing historical is a campaign run). One learner may hold at most one `active`
CampaignRun per `campaign_id` (partial unique index in the migration; a second start refuses
typed `CAMPAIGN_RUN_ACTIVE_EXISTS`). Earned state is server-held by ruling (`06:237-239`,
[[D945]]): none of this ever lives in `AssistanceConfig` or any localStorage key.

**6.0 Definition pin and command identity.** Campaign creation validates a registry document, writes
its RFC-8785 canonical bytes and digest into `campaign_runs`, and appends `campaign_created` in the
same transaction. `CampaignRegistry` keys by `{id,version,digest}` and refuses a second byte image at
the same id/version (`CAMPAIGN_DOCUMENT_VERSION_MUTATED`). Every later fold, command, Review join,
award check and restore parses the row snapshot and re-hashes it before use; the installed registry
is needed for new creation and source availability, not historical replay. Removing a document from
a newer release therefore makes it unavailable for **new** runs but does not make an existing run
unreplayable. Export/backup carries the canonical snapshot; restore refuses a digest mismatch and
can replay it even when the current release no longer offers that version.

Every mutation has a validated `CampaignCommandId` and expected integer event revision. The unique
event index is the durable idempotency authority. Same command plus byte-identical normalized
operands returns the stored result; same command with different operands returns
`CAMPAIGN_COMMAND_REUSED`; an unmatched revision returns `CAMPAIGN_REVISION_STALE`. No mutation
depends on a process-local idempotency map.

**6.1 Durable award issuance is part of the terminal transition.** Before appending a final
`node_committed`, the service folds the proposed next state against the pinned document snapshot,
compiles completion/prestige eligibility and exact `DurableRewardGrant` rows, and validates every
cosmetic against the shared appearance catalog. The one database transaction appends the event,
updates materialized status/pointer, and inserts all eligible award rows. Its award idempotency
identity remains `(learnerId, campaignId, campaignVersion, campaignRunId, durableRewardId)`.
Duplicate submit delivery returns the existing event/result/award bytes. Active, abandoned, wrong
learner, campaign snapshot/digest mismatch, wrong gate, unknown appearance id or reward absent from
the snapshot inserts neither event nor award. There is no uncalled award command, volatile hook or
eventual promise: if the campaign is completed, its required award rows committed in that same
transaction. Crash/fault injection before commit leaves neither; after commit, retry observes both.
The learner's durable inventory is the distinct projection of award rows, never a second writable
authority.

**6.2 Account and appliance lifecycle.** All three tables join the exhaustive account-data
inventory in the landing commit. Export includes campaign run/event history, award history and the
derived owned reward set. Hard deletion cascades all three. Restore imports canonical rows and
replays award identity through the same uniqueness key; duplicates remain one award. Account merge
cannot silently choose between colliding learner ids: it rekeys campaign runs/events and awards in
the portable-account-data transaction before the source learner is deleted. Backup/restore and
upgrade verification exercise the three tables through the normal appliance database receipt. A
missing table from export, deletion, restore, merge or backup inventory fails the exhaustive guard;
“private solo history” is a data classification, not permission to omit it.

### §7. Surfaces — where campaign chrome lives

**7.1 Closed authenticated API/command family.** These are the complete 1.0 campaign operations;
an endpoint mention without the request/result/error contract does not count:

| operation | request authority | result |
|---|---|---|
| `GET /campaigns` | authenticated learner + installed registry | catalogue, availability, active/completion/prestige projections |
| `POST /campaigns/:campaignId/runs` | `{ campaignVersion, commandId }`; unique active-run guard | created CampaignRun with pinned snapshot/digest or idempotent replay |
| `GET /campaign-runs/:campaignRunId` | owner | canonical map, revision, inventory-family projections, charge ledger, active encounter |
| `POST /campaign-runs/:campaignRunId/nodes/:nodeId/start` | `{ expectedRevision, commandId }` | one play run with server-authored `RunOrigin`, or stored replay |
| `PUT /campaign-runs/:campaignRunId/loadout` | `{ equippedModuleIds, expectedRevision, commandId }` | canonical module loadout/revision |
| `POST /campaign-runs/:campaignRunId/nodes/:nodeId/submit` | `{ runId, branchId, expectedRevision, commandId }` | atomic node result, rewards, state and terminal awards |
| `POST /campaign-runs/:campaignRunId/abandon` | `{ expectedRevision, commandId }` | abandoned terminal projection or stored replay |
| `GET /campaign-runs/:campaignRunId/result` | owner + terminal state | path, verdicts, prestige and exact award rows |
| `GET /campaign-rewards` | authenticated learner | durable campaign award/appearance projection |
| `GET /campaign-runs/:campaignRunId/nodes/:nodeId/review` | owner + matching run origin | exact Review route/result; history-unavailable is explicit |
| `GET /campaigns/active` | authenticated learner | active campaign/node/run summary for shell resume |

Every route resolves learner identity from authentication; no request accepts `learnerId`. Reads of
another learner return the same not-found envelope as absent ids. Every mutation uses §6.0's durable
command identity; every post-create mutation also carries the exact current revision. Response-loss
retry returns stored bytes, stale tabs return `CAMPAIGN_REVISION_STALE`, and concurrent
start/submit/loadout operations serialize on `(campaignRunId, expectedRevision)`. The closed error
union is `CAMPAIGN_NOT_FOUND | CAMPAIGN_FORBIDDEN | CAMPAIGN_RUN_ACTIVE_EXISTS |
CAMPAIGN_REVISION_STALE | CAMPAIGN_COMMAND_REUSED | CAMPAIGN_RUN_TERMINAL |
CAMPAIGN_NODE_UNAVAILABLE | CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH | CAMPAIGN_LOADOUT_INVALID |
CAMPAIGN_LOADOUT_FAMILY_INVALID | CAMPAIGN_SUBMIT_INVALID |
CAMPAIGN_CONSUMER_AUTHORITY_UNAVAILABLE | CAMPAIGN_SOURCE_UNAVAILABLE |
CAMPAIGN_REWIND_EXHAUSTED`. Each has one HTTP mapping and typed body; no handler returns a generic
500 for a member of this algebra.

`rfc/play-composition.md:104-107` excludes campaign screens from the closed play-composition
state list, and `06:308-311` orders visual composition last (D717). That does not permit a hidden
backend-only campaign. The 1.0 route family is one acceptance unit:

- **Campaign home and resume** (`/campaign`) lists registered campaigns, the learner's active run,
  completion/prestige marks and exact provider/dependency unavailability. Starting or resuming is
  a primary action; a campaign is never reachable only through settings or an advanced inspector.
- **Map** (`/campaign/:campaignRunId`) renders the three acts and reachable path choices, current
  cursor, charge balance, owned/equipped shelf, durable rewards and prior seals. Each node card
  states encounter title, boss state, exact reward, suppression and availability before entry.
  Keyboard/screen-reader order follows act → layer → choice, with locked/unreachable reasons.
- **Encounter preparation** is a bounded sheet/page, not settings: one recommended loadout, visible
  acquired tools, every unavailable reason, optional `Equip`, suppression preview and one Start
  action. Presets remain named defaults; no primitive-level switch wall appears here.
- **In-run context** occupies the existing campaign rail/overlay seat without inserting content
  between the board and controls or reducing the board below the normal play contract. It renders
  node title, `⟲ N`, compact effective-tool state and “Declare done.” On narrow viewports it becomes
  a collapsible overlay below the board's permanent input region; it never overlays tappable
  squares, causes horizontal page overflow or changes square size after a hint/reward arrives.
- **Node result** follows submit with copied objective verdict, rewards acquired on this seal,
  updated inventory and clear Continue / Review this encounter / Return to map actions. It may say
  where a reward is available later; it may not say the reward caused success.
- **Run result** renders completion, exact prestige qualification, durable awards, path history,
  Review links and Start another run. Abandon is a separately confirmed action with the exact
  non-punitive consequence; no completion/prestige award is implied.

The visual composition pass owns layout styling, but it may not delete or merge these states.
Desktop, narrow mobile, 200% zoom, reduced motion, keyboard-only and semantic-grid journeys are
release criteria. The board's stable sizing/gesture invariants apply inside campaign encounters
exactly as in ordinary play.

### §8. Named refusals — the traps, closed

1. **"An engine review screen with a rewind button"** (the named death, `CLAUDE.md`): no
   campaign surface renders an engine evaluation, a centipawn number, or a grade. The node card
   and strip vocabularies in §7 are **closed lists**; anything eval-shaped is a spec change with
   a changelog line, and criterion 12 greps the shipped surfaces for the refused vocabulary.
2. **Find-the-tactic** (`design/00-thesis.md` §§70, 93-94; derivation gap 18): v1's only
   encounter kind is a drill pack — play-the-consequence by construction. The D893 node list's
   *"puzzles, find best move, find blunder"* enter only through the deferred shapes, each
   obligated to re-cut through the four sealed shapes at its Discharge row, never as
   find-the-tactic verdicts.
3. **Rewind count as a score axis** (D302, derivation gap 19): no charge quantity — earned,
   spent, or remaining — appears in any verdict, seal payload, roll-up aggregate beyond the
   `charges` bookkeeping triple, module sentence, or export summary. Criterion 13 is the
   labeled regression guard.
4. **Refused mechanics stay refused** (D306, derivation gap 20): no prestige multipliers, no
   rarity tiers (ρ = −0.143), no stamina gates. The adoptable fragments (reset/retirement, pity
   guarantee) are deferred design questions for the prestige row, not v1 mechanisms.
5. **Assistance-enforcement ceiling honesty** (derivation gap 21): only three assistance rungs
   are server-refusable; any campaign copy about the learner's configuration says "configured",
   never "verified" — inherited from `learner-rating.md:497-503`'s D389 ceiling, ahead of any
   rated play existing.

### §9. Ledger-row mapping (lands with this RFC's lifecycle, per the completion protocol)

- At **acceptance**: the proposed rows below land (renumbered from the then-head).
- At **implementation landing**: [[D297]]'s six consumerless fun-devices gain their first
  consumers where v1 touches them (`ObjectiveState.degraded` via §4.1 seals; the others stay
  honestly unconsumed and are NOT flipped); [[D303]]'s missing-container half closes
  campaign-shaped (the Track generalization stays open); [[D953]]'s commissioning row flips.
  `rfc/intent-presets.md` Discharge D3's cell receives this RFC's registration SHA (recorded by
  the register owner at acceptance, since that file is outside this draft's write set).

## Deviations from design

1. **`06` §5's map is prose, not a schema; this RFC fixes 3 acts × 3 layers × ≤3 choices.** The
   fixed shape is v1 scope control; `06` nowhere requires variability, and the 9-node/3-act
   frame is its own (`06:338-342`).
2. **The §2a second-axis reading is consumed as-is** — claude-derived, explicitly *"the owner's
   to veto"* (`06:130-133`). Restated once here per the derivation's recommendation (gap 3);
   proceeding on it, veto absorbs without structural change (v1 carries no rated result, so the
   axis is dormant until Discharge D1 anyway).
3. **A `"open"` seal verdict for non-absorbing submitted tips** is this RFC's addition — `06`
   says the submitted attempt decides the verdict but does not name the unfinished case. The
   alternative (refusing to submit an unfinished line) would price experimentation exactly the
   way the thesis forbids.

4. **The rank-1 offered-choice draft with a real skip is absent; `reward` is one authored
   constant per node** (amendment 2026-08-23, claude on measured evidence;
   `planning/campaign/roguelike-reconciliation.md` Am. 3). `roguelike-run-design.md:168-184`
   ranks an offered lens menu *first* of its eight mechanisms, at **zero authoring minutes**,
   on the reasoning that *"declining is a move — the skip is what makes the offer a decision
   rather than a gift"*, and prices the offer space at `C(34,3) = 5,984`. This RFC ships
   `reward?: CampaignRunReward` (§1): a fixed grant the author writes once, with no menu and no skip.
   **v1 may be right to cut it** — an offer needs a chooser surface this RFC does not
   specify — but the cut is a deviation from the design's highest-ranked variety driver and was
   not previously recorded as one.
5. **The rank-2 run-defining opening choice is absent; `startingModules` is a document
   constant** (Am. 4, same basis). `roguelike:186-206` ranks a run-defining opening choice
   second — Neow's disadvantage-paired-with-reward — as the genre's cheapest variety device.
   Here `startingModules` (§1) is a **document** field, so **every CampaignRun of a document
   starts identically**. Again possibly right for v1; again a deviation, not an absence of one.
6. **Device E — player-elected run length — is dropped, and it was one of only two surviving
   bounding devices** (Am. 6, same basis). `roguelike:104` and `:527-530` name it
   *"the cheapest way to serve both 'not too long' and 'I want more'"* — which is the owner's
   own framing of the problem (`roguelike:3-5`). Deviation 1's fixed shape (3 acts × 3 layers)
   forecloses it. The fixed shape stands as v1 scope control; what was missing is that the
   device it displaces was named, costed at zero, and dropped silently.

**Deviations 4–6 share one shape and one consequence.** Each is a zero-authoring-cost variety
device the design ranked highly and this RFC does not carry; together with the absent loadout
and [[D277]]'s refutation of synergy, they are why §1's path-choice paragraph can say that
**path choice is the only run-to-run variance v1 has**. Recorded together so the successor
weighs them as a set rather than one at a time.

None other: the economy, the two-gate law, the suppressor, the submitted-branch seal, and the
server-held inventory are transcriptions of ruled text.

## Fresh-return author obligations (2026-08-30)

This live RFC owns the complete return:

- [[D2077]] — define one atomic final-seal/terminal event envelope.
- [[D2078]] — make equipment/loadout event-owned and writable, or remove it.
- [[D2079]] — persist exact campaign-definition identity and historical resolution.
- [[D2080]] — give resource rewards an exact source-identified charge-fold effect.
- [[D2081]] — bind consumer closure to accepted pack-capability and theory-join producers.
- [[D2082]] — split module, theory and resource inventory/effectiveness algebra by type.
- [[D2083]] — satisfy the already-triggered Review/export run-origin seam.
- [[D2084]] — publish the closed authenticated route/command/error/idempotency family.
- [[D2085]] — production-bind durable award issuance with crash recovery.
- [[D2086]] — separate the contract fixture from an owner/human-authored official 1.0 campaign.

The next author pass must invert `make campaign-two-horizon-fresh-review`, preserve the 19 author
checks, run full verification and request another independent review. It may not implement schema,
migration, storage, content, endpoints or UI while these landing authorities remain contradictory.

## Acceptance criteria

Unit note: mechanical criteria count over the disposable contract fixture (9 nodes, 3 acts, 3
suppressed bosses—one per act, each layer 3's only choice). The official campaign is a separate
owner/human-authored product artifact and must pass the same contracts plus criterion 24's content
authority; neither artifact can stand in for the other.

1. **Schema + validator**: the disposable
   `tools/campaign-two-horizon-author-contract/fixtures/campaign-contract.json` (9 nodes over
   fixture pack identities) validates; it is absent from the product registry. Each of `CAMPAIGN_ENCOUNTER_PACK_UNKNOWN`,
   `CAMPAIGN_BOSS_PLACEMENT`, `CAMPAIGN_ECONOMY_MONOTONE` has a fixture that **fails** it
   (flip-a-constant: break the fixture, assert the exact error id).
2. **Economy round-trip**: a scripted CampaignRun derives `startingCharges`, commits a node and
   receives distinct source-identified act and resource-reward income in one event, spends to zero
   via rewinds, and the next rewind returns
   `CAMPAIGN_REWIND_EXHAUSTED` (HTTP 409, typed). Flip-test: with one charge remaining the same
   rewind succeeds and `charge_spent` is appended with the mutation command in the same transaction
   (assert both, duplicate reward/event replay is exactly-once, two same-resource/different-amount
   grants both count, boss spend works, and rollback leaves neither mutation nor spend).
3. **Non-campaign runs untouched**: the same rewind sequence on a plain pack run appends no
   campaign event and never sees the guard's refusal — measured by running the full existing
   run-service test suite green with the guard live, plus one explicit fixture.
4. **Pre-spend disclosure**: the in-run strip renders the balance before the first spend in
   every campaign encounter state the strip appears in; a UI test asserts the `⟲ N` element
   exists and matches the projection **before** a rewind gesture, not after (the D539
   post-gesture lesson inverted: here the pre-state is the claim).
5. **Run-reward union and unlock pool**: the compile-time test asserts
   `Exclude<ModuleId, "rules_floor">` has exactly ten members and that
   `CampaignRunReward` has exactly `module_unlock | theory_unlock | resource_grant`.
   `moduleId: "rules_floor"`, a free-form `tool_unlock`, an unpinned theory passage and any
   resource other than `campaign_rewind_charge` each fail at the earliest typed/schema boundary.
6. **Inventory never exceeds honesty**: a `node_committed.reward` module outside the
   campaign context ceiling refuses with `CAMPAIGN_UNLOCK_OUTSIDE_CEILING`; the fixture derives
   the ceiling from the registered `ContextContract`, not from a copied list (the D444 trap —
   a copied list would pass while the contract drifts).
7. **Suppression disclosed**: every node with `suppress` renders the suppressed module names on
   its map card before entry; the fixture asserts the card text against the document bytes.
8. **Seal correctness**: submitting a branch whose tip sealed `achieved` / `failed` /
   `transitioned` / non-absorbing yields exactly that node verdict (4 fixtures); a branch from a
   different run, or a node not the active encounter, refuses typed (2 negative fixtures).
9. **Rebuild determinism**: `campaignRunState` folded from `campaign_events` byte-equals the
   incrementally maintained state after the criterion-2 script (the longitudinal-store
   discipline, same assertion shape), including module ownership/loadout, theory ownership,
   source-identified charge entries and terminal cursor. Same-id/version changed document bytes,
   row snapshot/digest mismatch and restore corruption refuse; removal from the installed registry
   leaves the historical snapshot replayable.
10. **Context registration**: `"campaign"` passes intent-presets' registry-invariant compile
    test (boardLighting token set, rules_floor in no complement) and
    `deriveWorkflowContext`-adjacent resolution returns `campaign` for a run started through
    the §5.3 route and the prior context for the same run replayed without the campaign join —
    both asserted.
11. **Composition untouched**: `play-composition`'s 16-state list is byte-identical at landing
    (the criterion is a literal file/spec comparison, not a claim).
12. **Refused vocabulary absent**: a grep-based test over the campaign surface components for
    the closed refusal list (eval, centipawn, grade tokens per §8.1) returns zero hits —
    labeled a regression guard, red only when someone adds them.
13. **Charge counts reach no score**: the labeled regression guard asserting `charge_*` payloads
    and balances appear in no seal payload, no roll-up field beyond `charges`, and no module
    packet — vacuously green at landing, red the day someone wires it (the D302 guard).
14. **Migration hygiene**: the migration is create-table/index only, `STRICT`, literal CHECKs,
   lands as `STORAGE_VERSION + 1` at its queue turn behind `bot-policy`, and the register row
   flips in the landing commit (C1–C8, P1–P7 green). It creates all three tables, pins canonical
   document bytes/digest, provides the event command-id unique index and award identity in §6.
15. **`CAMPAIGN_PATH_WIDTH` is a discriminating warning** (§1, amendment 2026-08-23): a fixture
    document whose act-1 layers 1 and 2 each carry **one** choice emits the warning naming both
    layers and **does not** emit an error; the seed fixture (layers of width 3, layer 3 the
    boss's only choice) emits **no** `CAMPAIGN_PATH_WIDTH` warning at all. *Rejected
    implementations:* one that warns on layer 3 (whose width-1 is required by
    `CAMPAIGN_BOSS_PLACEMENT`, so warning there fires on every valid document and measures
    nothing — the [[D444]] class); and one that raises an error, which would refuse the linear
    teaching document §1 declines to prohibit.
16. **Family-specific inventory survives presentation changes**: applying every preset transition
   leaves canonical module owned/equipped, theory owned and charge-ledger bytes unchanged. Module
   fixtures cover its five ineffective reasons; theory covers its four different reasons;
   resources expose only balance/mutation availability. Equip/unequip survives rebuild, while a
   theory/resource loadout member refuses. Missing row, zero reasons, two reasons and family
   precedence drift fail.
17. **Consumer declarations are not authority**: the authoring check calls the accepted exported
   `derivePackCapabilityRequirements` and `compileApplicabilityResult` views plus the live
   module/resource registries, retaining their source identities, and requires set equality with node declarations.
    A copied extra consumer, missing consumer, unavailable theory bundle and module whose pack
    lacks the required capability each fail.
18. **Every run reward has later and boss opportunity**: fixtures reject a reward on the final
    boss, one reachable dead continuation, all later bosses suppressing it and a missing compiled
    consumer. A reward whose every continuation reaches a later consumer and later boss consumer
    passes. The result type says `opportunity`, never `useful`, `learned` or `caused`.
19. **Prestige is non-vacuous**: zero-seal, partial-perfect and completed-mixed states are false;
    completed with exactly one achieved seal per selected layer is true; duplicate or missing
    layer seals are invalid before eligibility.
20. **One atomic terminal authority**: non-final and final `node_committed` events with/without a
    resource reward fold as one semantic unit; final commit yields `{kind:"completed"}` with every
    seal/income/reward/auto-equip/award effect, while injected failure at each step yields none.
    Concurrent duplicate submit commits once. `campaign_abandoned` yields `{kind:"abandoned"}`;
    no later event follows either. Materialized-status-only mutation is projection drift.
21. **Durable awards are exact, atomic and idempotent**: final submit inserts each eligible
    completion/prestige/cosmetic row in the same transaction and retry returns the same event/result/
    award bytes. Crash before commit leaves neither event nor award; crash after commit/retry sees
    both. Active/abandoned runs, wrong learner, snapshot/digest mismatch, wrong gate, unknown
    appearance id and absent document grant insert zero rows.
22. **Account lifecycle is exhaustive**: the account-data guard fails if any campaign table or the
    run-origin/document-snapshot fields are
    absent from export, hard delete, restore or merge. An export→delete→restore round trip preserves
    canonical run/events/award bytes and derived ownership; the appliance backup/restore journey
    proves the same rows survive an upgrade.
23. **Campaign schema transition is serialized**: lane 2 changes only the declared reward,
    consumer and durable-grant shapes; the register digest changes in the landing commit. Editing
    schema v1, omitting the live claim, or landing `training-mode-variants` against v1 fails the
    register/first-parent checks.
24. **Official content + complete campaign UX journey**: at least one registered, OWNER/human-
    authored official campaign spans grounded opening, middlegame and endgame consequence packs,
    has reviewed theory/provenance and a dependency availability matrix, and is not byte-equal to
    the disposable fixture. Browser tests exercise the full closed endpoint family: start from
    Campaign home, choose a path,
    inspect/equip a reward, start and play an encounter, submit it, see the acquired reward, use it
    at a later boss, complete the run, receive idempotent durable awards, open Review and start a
   new run. Response-loss retries for create/start/submit/loadout return stored bytes; stale tab,
   forbidden learner and terminal mutations render typed errors. Direct Review URL/refresh and
   export/delete/restore preserve `RunOrigin`; a plain run remains originless. A parallel
   abandonment journey reaches no completion/prestige award.
25. **Board and access stability**: the campaign journey passes desktop, narrow mobile, 200% zoom,
    reduced-motion, keyboard and semantic-grid projections with no horizontal page overflow, no
    post-hint/reward square-size change, no covered tappable square and no primitive settings wall.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The Act II rated boss — absorbs [[D945]]'s ruled reading (earned rewinds can win the encounter; ratedness follows R11 unchanged: rated when clean, winnable regardless) as a v2 amendment once `learner-rating` is accepted, resolving the persona/`targetElo` disjointness (a profile forbids the rung field the rated predicate requires — calibrate a profile per bot-policy §7 or the boss drops the persona) | `planning/campaign/` | the amendment's registration | |
| D2 | Prediction (shape 3) and survival (shape 4) encounter classes — each needs a seal mechanism absent at HEAD (the prediction-score threshold must be authored-parameter-shaped and reconciled with format v0.9's no-verdict rule; survival needs grounded counters and an unbounded-run objective), and each re-cuts its formats as play-the-consequence, never find-the-tactic. **Amended 2026-08-23 (claude on [[D1152]]): survival breaks the run's minute bound, and the amendment must carry it.** Every v1 encounter is bounded by device D — the shipped `authoredBoundary.plyHorizon` (`06:416-428`) — so a run's minute envelope is the sum of its nine horizons. A survival encounter is bounded by *"nothing but failure"* (`06:444`), which makes shape 4 **the one class device D does not bound**: with it the envelope stops being that sum and the *"~35–55 minutes"* frame (`06:406-410`) no longer follows from the node count. The successor amendment specifies survival's own bound (a ply cap, a wall-clock cap, or an explicit statement that the class is unbounded and the run frame excludes it) — it may not simply inherit the horizon language | `planning/campaign/` | that amendment's registration | |
| D6 | **The [[D1151]] catalogue-progression surface** (amendment 2026-08-23, claude on that ruling). The owner ruled campaign progression denominated in *the catalogue* — shapes met, structures played, the what's-missing mark **on the pack card** rather than a progress screen (`06:368-397`) — and this RFC has no seam for it: no collection surface, and §7's node-card vocabulary is a **closed list** (`:415-419`) that cannot express a what's-missing mark. The successor owes (a) the surface, (b) the mark's home on the pack card, and (c) the [[D300]] vocabulary prerequisite, which is **already counted and need not be re-derived**: the supply-side census is **15 of 49 lenses and 9 of 25 shapes unnamed** (`roguelike-run-design.md:294-311`), so the prerequisite is a bounded naming job against a measured denominator rather than an open-ended vocabulary design. Carries the standing guard from [[D1171]]: the catalogue is lawful **precisely because it claims nothing about the learner**, and one careless sentence collapses it into the skill-credit shape R20 disqualifies | `planning/campaign/` | that amendment's registration | |
| D3 | Army-building / prestige — was blocked on the OWNER fork: D893(3)'s *"unlocks harder bosses"* versus D334's *"winning may unlock convenience and variety, never content"* | OWNER | the ruling's log entry; the amendment citing it | **DISCHARGED 2026-08-23 by [[D1040]] and folded 2026-08-30.** Playing unlocks the core path; winning gates only §3.6's exact prestige mark/cosmetic layer. Neither prestige nor durable ownership enters the educational availability algebra |
| D4 | Evidence-dark fun nodes and time controls (nothing exists to build on — `clockState` is an untyped passthrough). Generic cosmetic rewards are no longer in this discharge: §3.6 admits only shared-catalog appearance ids after [[D1696]] lands | `planning/campaign/` | that amendment's registration | |
| D5 | v1 mechanics implementation per this specification, excluding chess-curriculum authorship | codex | the implementing commits; ledger flips per §9 | |
| D7 | Richer cross-run variety rewards (titles, modifiers, skip starts, variant runs) require a typed meta-reward registry and one real consumer per member; [[D1698]] refuses generic ids. This does not block the 1.0 marks + shared-catalog cosmetic horizon | `planning/campaign/` | the successor meta-reward RFC's accepted registration | |
| D8 | At least one official 1.0 campaign authored/reviewed as chess curriculum over opening, middlegame and endgame consequences, with grounded theory/provenance, varied paths, later/boss reward opportunities and a dependency availability matrix; the disposable fixture cannot discharge this | OWNER / human chess-content authority | official content commit + criterion-24 journey receipt after foundations stabilize | |

**Discharged BY this RFC's registration:** `rfc/intent-presets.md` Discharge D3 (campaign as an
eighth context) — its cell names *"the campaign RFC's registration"* as the recording site; the
SHA is written into that table by the register owner at acceptance (outside this draft's write
set).

## Open questions

1. **~~[OWNER — deferred with scope] The prestige/D334 fork~~ — ANSWERED 2026-08-23 by
   [[D1040]]** (Discharge D3, discharged). Winning gates the prestige layer only and never the
   core path; §3.6 now specifies the non-vacuous gate, completion/prestige marks and shared-catalog
   cosmetics. Richer meta rewards remain D7 and cannot be encoded as strings.
2. **[OWNER — veto window] The §2a second-axis reading** (Deviation 2). Proceeding on the
   claude-derived reading; a veto lands as a one-line amendment while v1 carries no rated
   result.
3. **Charge semantics at encounter abandonment** — leaving a node unsealed and re-entering it
   later costs nothing beyond the charges already spent inside it; is that the owner's intent,
   or should abandonment itself price something? Shipped as the free reading (candidates
   philosophy: cheap to change, impossible to change silently — the abandonment event exists in
   the log either way via `node_entered` recurrence).

## Ledger rows (proposed — renumber at landing; committed head D953 at drafting. Note: `rfc/live-sources.md`'s cross-review has since relabeled its proposed rows **D954–D956** — the same labels as the three below. Neither set owns the numbers: per the standing protocol each set renumbers from the then-head in the commit that lands it, so whichever lands second takes the next free numbers at its turn)

- **D960 (landed)** — the campaign/play "run" naming collision is pinned: `CampaignRun` in
  every symbol and table, bare "run" reserved for play runs; the container D303 wanted arrives
  campaign-shaped (`CampaignDocument`), with the Track generalization left open.
- **D961 (landed; repaired by [[D2083]])** — the reopen condition fired: Review, export and
  longitudinal readers all need campaign identity outside the campaign tables. This RFC now claims
  run-schema lane 0.25 for exact `RunOrigin`; the campaign-side join remains mutation authority but
  is no longer the only identity source.
- **D962 (landed)** — the persona'd-rated-boss disjointness (derivation gap 11) is recorded
  and routed to Discharge D1: `RunOpponentPolicy.profile` forbids `targetElo`; the rated
  predicate requires a rung — a rated persona boss needs a rung-calibrated profile or no
  persona.

## Changelog

- 2026-08-30 (**second author repair**): repaired the ten returned blockers as one replayable
  operation boundary. The final seal, act/reward income, unlock, auto-equip, terminal marker and
  durable awards now commit as one `node_committed` transaction; completion is derived from the
  exact nine-layer cursor rather than accepted from a caller. Campaign runs pin canonical document
  bytes and digest; module, theory and resource projections are family-specific; loadout changes are
  durable; resource grants enter a source-identified ledger; Review/export/restore consume exact
  run-schema lane 0.25 origin; and the authenticated API is an eleven-operation closed family with
  revision/idempotency semantics. Consumer compilation serializes behind the named pack-capability
  and theory-applicability authorities. The disposable contract fixture is separated from the
  official owner/human-authored 1.0 campaign obligation. `make campaign-two-horizon-author-contract`
  passes 25/25; the unchanged historical fresh-review harness fails all ten old assertions, the
  intended inversion. Exact receipt:
  `planning/campaign/second-author-repair-2026-08-30.md`. Fresh independent review still gates
  acceptance and all implementation.
- 2026-08-30 (**fresh independent return**): returned on [[D2077]]–[[D2086]]. Final-node
  terminality conflicts with required reward events; equipment has no mutation; campaign document
  digests are not durable; resource rewards do not enter the balance; consumer closure depends on
  unnamed returned producers; module ceilings are applied across unlike reward families; Review
  and export trigger the declined origin seam; the endpoint family and command idempotency are
  incomplete; awards have no issuer; and the seed fixture is not an authored 1.0 campaign. Exact
  return: `planning/campaign/fresh-independent-buildability-review-2026-08-30.md`.
- 2026-08-22: created — drafted from `planning/campaign/rfc-derivation.md` under the [[D953]]
  gate waiver, with [[D945]]'s earned-rewind economy promoted to v1 core.
- 2026-08-22: **cross-review corrections in place** (independent adversarial re-derivation at
  source). Migration position corrected fourth → **fifth** (learner-rating holds two queue
  positions; the RFC's own register row already said fifth). §2.2's spend sites re-pinned to
  the real persisted entry points — `RunService.fork` (`:744`), `enterSimulation` (`:1396`),
  the group flow's persisted rewind (`:958`) — the drafted "`service.ts:1357` compare path" is
  a never-persisted scratch mutation inside `simulate`, and the primary proactive-branching
  verb was missing entirely; "atomically decrements the balance" reworded to the projection
  truth (no balance column exists). §4.1's seal now reads the tip's `Node.objectiveState`
  (`types.ts:121`) rather than `TrajectoryLegSpan.sealedState` (a leg-boundary record that
  does not exist for non-trajectory packs), names the campaign verdict a new object distinct
  from the shipped `AttemptVerdict` (`"open" | "unstable" | "stable"`), and appends the node's
  `module_unlocked` reward inside the seal transaction (the draft granted rewards nowhere).
  `CAMPAIGN_BOSS_PLACEMENT` closes the boss-dodging path (the act boss is layer 3's only
  choice). `startingModules` given the schema home §3.2 assumed. §5.2's contract row given
  named candidate seeds (Drill's `allowedPresets`, complement `{ blunder_prevention }`) so the
  registration is a full row and criterion 6's negative fixture exists. Five `design/06` line
  citations re-derived at HEAD — the file grew +36 lines when [[D945]] landed after the
  dossier's `c93ae83`, and the draft had carried the dossier's pre-D945 numbers.
  `rfc/README.md:133` → `:240`; `Run` → `DrillRun`; the live-sources row-label note updated
  (its cross-review relabeled to D954–D956, colliding with this RFC's labels — the renumber
  rule stated, not resolved); the economy-monotone quote re-attributed to the ruling's actual
  words. Verified clean at source: the D945 economy direction (act1 ≥ act2 ≥ act3 **is**
  lower-acts-more-forgiving), the campaign-only scope, the earn-on-seal grammar, charging
  both rewind and proactive branching (the ruling's own conjunction), the ten-member unlock
  type over the byte-exact eleven, the eighth-context slot (seven shipped members verified),
  the intent-presets D3 hand-off wording, the claims-line grammar (byte-equal to the register
  row), and criterion 11's failable 16-state comparison.
- 2026-08-23 (**owner ruling [[D1040]], amendment by claude**): *"progression is unlocked by
  PLAYING; WINNING gates the PRESTIGE layer only."* **Discharge D3 is discharged** — the
  army-versus-content fork it was blocked on is **dissolved rather than settled**, because
  winning may gate neither on the core path. §4.1's any-verdict `module_unlocked` grant is
  recorded as the *ruled* core behaviour rather than an unexamined default (a `failed` seal
  grants the reward exactly as an `achieved` one does), §4.2's deferred campaign-"win" is now
  defined, and **new §3.5** names the prestige gate and its seam: `prestigeEligible` is a read
  over seals that already exist (`verdict === "achieved"`, the absorbing-success member of the
  shipped `ObjectiveState`), not `terminalOutcome`/`RunOutcome`, which is the vocabulary of a
  rules-terminal game that a v1 node is not (§3.4). Three properties are pinned so the deferred
  contents amendment cannot quietly drop them: prestige never gates progression (the §3.2
  composition stays closed at three narrowing terms), prestige is a projection adding no
  persistence, and prestige is outside the evidence plane. **What prestige contains stays
  deferred**; only the gate is specified.
- 2026-08-30: **two-horizon author repair on [[D1592]]–[[D1597]], [[D1233]]/[[D1234]] and
  [[D1695]]–[[D1698]].** Campaign schema lane 2 now owns the typed module/theory/resource reward,
  checked consumer and durable-grant vocabulary. Presets no longer participate in ownership or
  equipment. Every reward requires later and boss opportunity on every continuation. Prestige is
  completed-denominator exact; abandonment is event-owned; durable marks/shared-catalog cosmetics
  use one idempotent account-portable award authority. The surface boundary is widened from a map
  and strip to the complete home→map→prep→play→result→Review journey with stable-board/access
  criteria. `make campaign-two-horizon-author-contract` passes 19/19. Fresh independent review and
  named dependencies still gate all schema/migration/API/content/UI implementation.
