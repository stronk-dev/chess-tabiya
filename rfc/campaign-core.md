# RFC: Campaign core — the pure-chess campaign over authored encounters

- **Status:** draft — 2026-08-22
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
  (accepted — `run.opponentPolicy` naming for encounter opponents), `rfc/longitudinal-store.md`
  (accepted — projection/rebuild discipline this RFC's state tables inherit)
- **Parent / amends:** — (first campaign RFC; `design/06-campaign.md` is the intent authority)
- **Supersedes / superseded by:** —
- **Planning:** `planning/campaign/`

```tabiya-claims
migration | position behind bot-policy | campaign_runs; campaign_events
```

## Summary

This RFC specifies the **pure-chess campaign** — the definite half of the owner's D893 ruling —
as a buildable v1: a 9-node, 3-act authored map whose every node is a **shape-1 authored
encounter** (a drill pack), whose progression currency is **module unlocks over the ten
unlockable ids**, whose difficulty pressure is the **suppressor boss** (capability suppression,
never chess judgement), and whose economy is the owner's D945 ruling made mechanism: **rewind and
proactive branching inside campaign encounters are an earned resource** — charges earned by
sealing nodes, spendable in any encounter including the boss, scaling by act so lower acts are
more forgiving. The campaign registers as the **eighth `WorkflowContextId`** in the accepted
intent-presets registry (discharging that RFC's D3), holds all earned state **server-side** in
two new tables (`campaign_runs`, `campaign_events` — one migration position, behind
`bot-policy`), and seals nodes by the submitted branch through the shipped `reveal` verb. The
rated boss, prediction and survival encounter shapes, army/prestige, evidence-dark nodes and
time controls are **deferred with named discharge rows** — each has an owner fork or a missing
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

The v1 cut is the derivation's recommended cut (derivation §8), for stated reasons rather than
taste: shape-1 encounters are the only encounter class whose seal mechanism **ships today**
(`ObjectiveState`/`sealedState`); the rated boss needs `learner-rating` (draft) and carries the
persona/`targetElo` disjointness (derivation gap 11); prediction and survival seals are new
mechanisms (gaps 5–6); army/prestige sits on an unresolved owner fork (gap 4). Deferring those
is not scope timidity — it is refusing to invent decisions.

Out of scope: everything deferred above (each with a Discharge row); opponent-policy internals
(bot-policy's seam ends at `run.opponentPolicy`); module eligibility (the D660 bar);
campaign-screen visual composition beyond the boundary rule in §7 (composition last, per D717);
any change to authored pack bytes; content authoring of real campaigns beyond the seed fixture.

## Specification

Line citations to shipped code were spot-re-verified at drafting HEAD:
`RunSessionKind` (`packages/runtime/src/types.ts:36`), `ObjectiveState` (`types.ts:4-10`),
`ABSORBING` (`packages/runtime/src/trajectory.ts:6`), `RunService.reveal`
(`apps/server/src/service.ts:1547`), `rewind` import and service path (`service.ts:31,717`),
the module table (`rfc/learner-modules.md:299-311`), `STORAGE_VERSION = 24`
(`apps/server/src/storage.ts:476`).

### §1. Objects and vocabulary

**Naming collision, pinned first.** `design/06` calls a campaign attempt "the run"; the codebase
calls a play session a run (`Run`, `RunService`). This RFC keeps both and never abbreviates: the
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
  reward?: NodeReward;           // §3.1
  boss?: true;                   // exactly one node per act, and it must be in layer 3 (lint)
}
```

The `encounter.kind` union is **closed at one member in v1**; adding `position` (rated boss),
`prediction` or `survival` is a schema change belonging to the Discharge rows. A validator rule
`CAMPAIGN_ENCOUNTER_PACK_UNKNOWN` (error) refuses a `packId` absent from the registry, and
`CAMPAIGN_BOSS_PLACEMENT` (error) enforces one boss per act in the final layer. Path choice is
the StS gesture (D893: *"in Slay the Spire you choose paths"*): the learner picks one node per
layer; unpicked alternatives stay unvisited for this CampaignRun.

**Map progression** is strictly forward: layer N+1 opens when a node in layer N seals (§4). No
node re-entry after seal — retrying a node means retrying it before declaring done (§2 prices
the *navigation*, §4's submitted-branch rule prices the *commitment*; declaring done is what
counts, `06:413-419`).

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

**2.1 Earn.** One grant of `actGrants[act]` charges is appended (`charge_earned` event, §6) when
a node seals, whatever its verdict — income prices *finishing*, not winning, so a failed seal
still funds the next attempt at the next node. Lint `CAMPAIGN_ECONOMY_MONOTONE` (error) refuses
a document where `actGrants` increases with act index: the ruling's *"lower floors/acts more
forgiving"* means act1 ≥ act2 ≥ act3, and the constraint is authored-document-checkable.

**2.2 Spend and enforcement.** One charge is spent by each play-run mutation that abandons a
line inside an active campaign encounter: the rewind verb (`RunService.rewind`,
`service.ts:717`) and branch creation from an ancestor node (the `choiceIndex > 0` rewind at
`service.ts:1357`'s compare path and any equivalent fork-from-earlier flow). Reviewing without
creating a branch or rewinding spends nothing. Enforcement is **server-internal with no run
field**: a new private guard `RunService.#campaignCharge(runId, at)` looks up whether `runId` is
the active encounter run of a `campaign_runs` row (§6), and if so atomically decrements the
charge balance and appends `charge_spent` in the same transaction as the rewind — or refuses
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

### §3. Progression — unlocks, inventory, and the suppressor boss

**3.1 Module unlocks.** `NodeReward { kind: "module_unlock"; moduleId: UnlockableModuleId }`.
The pool is **exactly ten**: the closed eleven of `rfc/learner-modules.md:299-311` minus
`rules_floor`, which registers no evidence consumer (`learner-modules.md:325`), is *"not
assistance"* and appears in no ceiling complement (`rfc/intent-presets.md:172-174`) — an
earnable rules floor would break the floor-and-ceiling token, so the exclusion is a **type**:
`UnlockableModuleId = Exclude<ModuleId, "rules_floor">`, with a compile-time test asserting the
member count is 10. Law 8 shape: an unlock gates an **evidence consumer** — availability, never
truth. An unlocked module still says only what its contract admits; nothing about what may
honestly be shown changes (`06` §3 law 1: honesty outer, inventory inner).

**3.2 Effective modules inside a campaign encounter.** Three gates, all narrowing, composed in
this order:

```
effective = contextCeiling("campaign")      // §5 — fixed, honesty-outer
          ∩ inventoryUnlocked(campaignRun)  // grows toward the ceiling as nodes reward, never past it
          ∩ nodeSuppression(node)           // §3.3 — the boss mechanism
          ∩ presetRequest                   // the learner's intent-presets request, unchanged
```

A CampaignRun starts with `rules_floor` plus whatever the campaign document grants at start
(v1 seed: `sight_on_request` — a candidate like every seed value). An unlock event whose
`moduleId` is outside the campaign context ceiling is **refused at append time** with typed
`CAMPAIGN_UNLOCK_OUTSIDE_CEILING` — inventory may never exceed honesty (criterion 6's negative
fixture).

**3.3 The suppressor boss.** A node's `suppress: ModuleId[]` subtracts those modules from
availability for that encounter only — Balatro's boss blind, law-8-legal by construction because
it *"speaks about the learner's information, never about chess"* (`06:384-389`). Suppression is
narrowing (always legal in the algebra), is **disclosed before the encounter starts** (the node
card names the suppressed modules — criterion 7), and may not name `rules_floor` (same type as
§3.1). The v1 act bosses are authored encounters with suppression; their packs are ordinary
registered packs.

**3.4 What a boss is not in v1.** Not a rated game (deferred, Discharge D1 — including the
derivation's gap-11 find that a persona'd rated boss is unrateable at HEAD: `profile` forbids
`targetElo` while the rated predicate requires a rung, `rfc/bot-policy.md` §§ vs
`rfc/learner-rating.md:324-347`); not a `position` session; not horizon-free. It seals exactly
like every other node.

### §4. Sealing — the submitted branch, node verdicts, and the roll-up

**4.1 Declaring done.** The ruling (`06:413-419`): *"a node remembers the branch you SUBMIT…
declaring done is what counts."* The verb is the shipped `reveal`
(`RunService.reveal`, `service.ts:1547`), extended by one new server route:

```
POST /campaigns/:campaignRunId/nodes/:nodeId/submit   { runId, branchId }
```

which (in one transaction) validates the branch belongs to the run and the run to the node's
active encounter, reads the branch tip's sealed objective state
(`TrajectoryLegSpan.sealedState`, `packages/runtime/src/trajectory.ts:15`), appends
`node_sealed { nodeId, runId, branchId, verdict }`, appends the §2.1 `charge_earned` grant, and
advances the map cursor. The node verdict vocabulary **is** `ObjectiveState`'s absorbing subset
plus the non-absorbing fallback: `verdict = "achieved" | "failed" | "transitioned" | "open"`,
mapped 1:1 from the submitted tip (an `active`/`preserved`/`degraded` tip seals as `"open"` —
submitting an unfinished line is legal and priced only by its own verdict). No new judgement
enters: the seal is a copy of the pack's own objective machinery.

**4.2 The run-level roll-up** — `06:424-427`'s *"computed nowhere"*, the smallest new part,
built here as a **projection, not a table** (the `attempts`/rating-as-projection precedent):

```
campaignRunState(campaignRunId): {
  cursor: { act, layer };                       // first unsealed layer
  nodes: Record<nodeId, { verdict, runId, branchId }>;
  charges: { earned, spent, balance };          // balance = starting + earned − spent, never negative
  unlocked: UnlockableModuleId[];
  status: "active" | "completed" | "abandoned";
}
```

computed by folding `campaign_events` in `seq` order. **Determinism discipline inherited from
`rfc/longitudinal-store.md`:** rebuild from the event log byte-equals the incrementally
maintained state (criterion 9); the fold is pure; no wall-clock reads inside it. `completed`
means nine seals; a campaign "win" for D893's prestige purposes is deferred with the prestige
fork (Discharge D3) — v1 reports verdict counts and invents no aggregate score.

**4.3 Path-scoped seals stand.** Rewinding inside a later encounter never edits an earlier
node's seal — seals are append-only events; *"rewinding to a clean line erases it — that is the
thesis working"* applies **within** an unsubmitted encounter, never to sealed history.

### §5. The eighth context — registration with intent-presets

Per `rfc/intent-presets.md` Discharge D3 (quoted whole in derivation §3.1), registration means:

1. `"campaign"` joins `WORKFLOW_CONTEXTS` (eighth member) with localStorage preference key
   `tabiya.assistance.v1.campaign` under the shipped `assistanceKey` grammar
   (`apps/web/src/lib/assistance-preference.ts:15`).
2. A full `ContextContract` row: `defaultPreset: "guided"`, `allowedPresets` and the
   may-never-show complement seeded as **candidates** (§2.3's device), `configClamp.boardLighting`
   drawn from the registry-invariant token set `"legal" | "sight" | "evidence"` — the campaign
   can never darken the rules floor, by the same compile-time test that guards the other seven.
3. **The derivation signal — decided here** (derivation gap 10): `deriveWorkflowContext`'s
   inputs cannot distinguish a campaign run, and this RFC adds **no run field**. A campaign
   encounter run is created only through `POST /campaigns/:campaignRunId/nodes/:nodeId/start`,
   which records the linkage campaign-side (`node_entered` event + the `campaign_runs` active
   pointer, §6) and returns the context; on resume, the client learns it from
   `GET /campaigns/active` (current node + its `runId`), and the server end enforces from the
   same tables (§2.2's guard). Consequence stated honestly: **the run record alone does not know
   it was a campaign encounter** — the campaign event log does, and anything replaying runs
   without joining `campaign_events` sees a plain `pack` run. Run-schema lane 0.19 is therefore
   **named and declined again** (the intent-presets pattern), with this reopen condition: if any
   consumer outside the campaign tables needs per-run campaign identity (a Review surface, an
   export, the longitudinal store), the marker becomes a run-schema claim at that RFC's turn
   rather than a silent join. (Proposed row 2.)
4. The per-encounter ceiling (D3's *"encounter-authored ceilings"*) is §3.2's composition —
   narrowing inside the contract, exactly the algebra's shape.

### §6. Persistence — two tables, one migration position

Claimed above: `migration | position behind bot-policy | campaign_runs; campaign_events` —
fourth in the landing order (learner-rating ×2 → longitudinal-store → bot-policy → this), number
taken at landing as `STORAGE_VERSION + 1` per the register rule, body uses frozen literals.

```sql
CREATE TABLE campaign_runs (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,          -- CampaignDocument.id
  campaign_version INTEGER NOT NULL,  -- pinned at creation; a CampaignRun never migrates documents
  status TEXT NOT NULL CHECK (status IN ('active','completed','abandoned')),
  active_encounter_run_id TEXT,       -- NULL between encounters; no FK (runs live in their own store)
  created_at TEXT NOT NULL
) STRICT;
CREATE INDEX idx_campaign_runs_active_encounter ON campaign_runs(active_encounter_run_id)
  WHERE active_encounter_run_id IS NOT NULL;   -- §2.2's guard is one indexed lookup
CREATE INDEX idx_campaign_runs_learner ON campaign_runs(learner_id, status);

CREATE TABLE campaign_events (
  campaign_run_id TEXT NOT NULL REFERENCES campaign_runs(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN
    ('node_entered','node_sealed','charge_earned','charge_spent','module_unlocked')),
  payload TEXT NOT NULL,              -- canonical JSON per event kind (§4.1, §2)
  at TEXT NOT NULL,
  PRIMARY KEY (campaign_run_id, seq)
) STRICT;
```

Discipline inherited by name: `STRICT` + literal CHECK strings (the migration-9 freeze lesson,
`rfc/README.md:133`), `ON DELETE CASCADE` on `learners(id)`, create-table/index only, **no
backfill** (nothing historical is a campaign run). One learner may hold at most one `active`
CampaignRun per `campaign_id` (partial unique index in the migration; a second start refuses
typed `CAMPAIGN_RUN_ACTIVE_EXISTS`). Earned state is server-held by ruling (`06:237-239`,
[[D945]]): none of this ever lives in `AssistanceConfig` or any localStorage key. Deletion
semantics: cascade on learner deletion — campaign state is private solo history in
`portable-account-data.md`'s classification, and its export inventory picks these tables up at
that RFC's F12-B landing (noted there as a body obligation for whichever lands second; no
schema coupling either way).

### §7. Surfaces — where campaign chrome lives

`rfc/play-composition.md:104-107` excludes campaign surfaces from the closed 16-state
composition, and `06:280-284` orders composition **last** (D717). So:

- **The map screen** (`/campaign` route: act ladder, layer choices, node cards with suppression
  and reward disclosure, charge balance, unlocked shelf) is a **new surface outside the play
  composition**, like Story. Its visual design is explicitly deferred to the composition pass;
  this RFC specifies content obligations only (what each card must state: encounter pack title,
  `suppress` list, reward, boss flag).
- **In-run campaign presence is one strip**, seated in an existing region (the rail — the same
  seat family `postcommit_nudge` uses), rendering exactly: node title, `⟲ N` charge balance
  (§2.4), and a "Declare done" affordance that opens the §4.1 submit flow. **No composition
  state is added or modified**: criterion 11 asserts the 16-state list is byte-unchanged at this
  RFC's landing. If composition work later wants a 17th state for the strip, that is
  play-composition's changelog, not this RFC's.

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
   frame is its own (`06:310-314`).
2. **The §2a second-axis reading is consumed as-is** — claude-derived, explicitly *"the owner's
   to veto"* (`06:130-133`). Restated once here per the derivation's recommendation (gap 3);
   proceeding on it, veto absorbs without structural change (v1 carries no rated result, so the
   axis is dormant until Discharge D1 anyway).
3. **A `"open"` seal verdict for non-absorbing submitted tips** is this RFC's addition — `06`
   says the submitted attempt decides the verdict but does not name the unfinished case. The
   alternative (refusing to submit an unfinished line) would price experimentation exactly the
   way the thesis forbids.

None other: the economy, the two-gate law, the suppressor, the submitted-branch seal, and the
server-held inventory are transcriptions of ruled text.

## Acceptance criteria

Unit note: criteria 1–3 count over the seed fixture campaign (9 nodes, 3 acts, 2 bosses
suppressed + 1 boss suppressed — one per act); criterion counts state their own units.

1. **Schema + validator**: the seed `content/campaigns/seed-endgames.json` (9 nodes over
   registered packs) validates; each of `CAMPAIGN_ENCOUNTER_PACK_UNKNOWN`,
   `CAMPAIGN_BOSS_PLACEMENT`, `CAMPAIGN_ECONOMY_MONOTONE` has a fixture that **fails** it
   (flip-a-constant: break the fixture, assert the exact error id).
2. **Economy round-trip**: a scripted CampaignRun earns `startingCharges`, seals a node, gains
   `actGrants.act1`, spends to zero via rewinds, and the next rewind returns
   `CAMPAIGN_REWIND_EXHAUSTED` (HTTP 409, typed). Flip-test: with one charge remaining the same
   rewind succeeds and `charge_spent` is appended in the same transaction (assert both, and
   assert rollback leaves neither on injected failure).
3. **Non-campaign runs untouched**: the same rewind sequence on a plain pack run appends no
   campaign event and never sees the guard's refusal — measured by running the full existing
   run-service test suite green with the guard live, plus one explicit fixture.
4. **Pre-spend disclosure**: the in-run strip renders the balance before the first spend in
   every campaign encounter state the strip appears in; a UI test asserts the `⟲ N` element
   exists and matches the projection **before** a rewind gesture, not after (the D539
   post-gesture lesson inverted: here the pre-state is the claim).
5. **Unlock pool typed at 10**: the compile-time test asserts
   `Exclude<ModuleId, "rules_floor">` has exactly ten members and that
   `NodeReward.moduleId: "rules_floor"` is a type error (a fixture document carrying it fails
   validation with `CAMPAIGN_UNLOCK_OUTSIDE_CEILING`'s authoring-time sibling).
6. **Inventory never exceeds honesty**: an appended `module_unlocked` for a module outside the
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
   discipline, same assertion shape).
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
    flips in the landing commit (C1–C6, P1–P6 green).

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The Act II rated boss — absorbs [[D945]]'s ruled reading (earned rewinds can win the encounter; ratedness follows R11 unchanged: rated when clean, winnable regardless) as a v2 amendment once `learner-rating` is accepted, resolving the persona/`targetElo` disjointness (a profile forbids the rung field the rated predicate requires — calibrate a profile per bot-policy §7 or the boss drops the persona) | `planning/campaign/` | the amendment's registration | |
| D2 | Prediction (shape 3) and survival (shape 4) encounter classes — each needs a seal mechanism absent at HEAD (the prediction-score threshold must be authored-parameter-shaped and reconciled with format v0.9's no-verdict rule; survival needs grounded counters and an unbounded-run objective), and each re-cuts its formats as play-the-consequence, never find-the-tactic | `planning/campaign/` | that amendment's registration | |
| D3 | Army-building / prestige — blocked on the OWNER fork: D893(3)'s *"unlocks harder bosses"* versus D334's *"winning may unlock convenience and variety, never content"*; is a harder boss variety or content? Not specifiable until ruled | OWNER | the ruling's log entry; the amendment citing it | |
| D4 | Evidence-dark fun nodes and cosmetic rewards (D887's marked-play class) and time controls (nothing exists to build on — `clockState` is an untyped passthrough) | `planning/campaign/` | that amendment's registration | |
| D5 | v1 implementation per this specification, criteria 1–14 | codex | the implementing commits; ledger flips per §9 | |

**Discharged BY this RFC's registration:** `rfc/intent-presets.md` Discharge D3 (campaign as an
eighth context) — its cell names *"the campaign RFC's registration"* as the recording site; the
SHA is written into that table by the register owner at acceptance (outside this draft's write
set).

## Open questions

1. **[OWNER — deferred with scope] The prestige/D334 fork** (Discharge D3). Not blocking: v1
   contains no prestige axis.
2. **[OWNER — veto window] The §2a second-axis reading** (Deviation 2). Proceeding on the
   claude-derived reading; a veto lands as a one-line amendment while v1 carries no rated
   result.
3. **Charge semantics at encounter abandonment** — leaving a node unsealed and re-entering it
   later costs nothing beyond the charges already spent inside it; is that the owner's intent,
   or should abandonment itself price something? Shipped as the free reading (candidates
   philosophy: cheap to change, impossible to change silently — the abandonment event exists in
   the log either way via `node_entered` recurrence).

## Ledger rows (proposed — renumber at landing; committed head D953 at drafting. Note: `rfc/live-sources.md` labels its proposed rows D953–D955; both sets renumber from the then-head at their own landings)

- **D954 (proposed)** — the campaign/play "run" naming collision is pinned: `CampaignRun` in
  every symbol and table, bare "run" reserved for play runs; the container D303 wanted arrives
  campaign-shaped (`CampaignDocument`), with the Track generalization left open.
- **D955 (proposed)** — 🐞-class honesty note: the play-run record does not know it served a
  campaign encounter; the linkage lives in `campaign_events`, run-schema lane 0.19 is
  named-and-declined with the §5.3 reopen condition (any non-campaign consumer needing per-run
  campaign identity converts the join into a lane claim at its RFC's turn).
- **D956 (proposed)** — the persona'd-rated-boss disjointness (derivation gap 11) is recorded
  and routed to Discharge D1: `RunOpponentPolicy.profile` forbids `targetElo`; the rated
  predicate requires a rung — a rated persona boss needs a rung-calibrated profile or no
  persona.

## Changelog

- 2026-08-22: created — drafted from `planning/campaign/rfc-derivation.md` under the [[D953]]
  gate waiver, with [[D945]]'s earned-rewind economy promoted to v1 core.
