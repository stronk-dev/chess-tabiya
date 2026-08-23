# Codex wave 2 — one ordered work order

**Written:** 2026-08-23 · **HEAD:** `e51b5a3` (*"feat: add deterministic campaign state fold"*) ·
**Author:** claude · **Supersedes** the sequencing advice in `planning/codex-queue.md:251`
(*"ship the smallest real range first"*), which [[D1230]] names as the defect itself.

**Sources, all committed and read in full:** `planning/platform-alignment/scope-cut-audit.md`,
`unreachable-mechanisms.md`, `breadth-reality-check.md`, `deferral-retrofit-batch-1.md`,
`research-to-execution.md`, `deferral-inventory.md`, `refused-vs-asked.md`,
`planning/bot-roster/roster.md`.

## 0. The rule this document is written under

[[D1230]] found **71 of 209 scope decisions half-assed**, and found the cause: every lane derivation
carries a mandatory `## Recommended scope cut` and **none carries a section pricing the full ask**.
So every item below prices **the whole thing**.

- *"Document size"*, *"the smallest real range"*, *"the first visible pixel"*, *"cheap-vs-general"*
  and *"a landable document beats a comprehensive one"* are **not reasons**, and appear below only
  as quotations of the defect.
- Where an item is blocked, the blocker is **named and cited**: law 8, absent data, an unbuilt
  dependency, an unaccepted RFC (law 1), or an owner ruling.
- Where an item is **sequenced**, the remainder has **a named home and a named owner**. *"A successor
  RFC"*, *"a later pass"*, *"its own lane"* do not qualify and are not used.

**Working-tree discipline.** Codex commits continuously and a second claude agent is drafting RFCs.
Dirty at the moment of writing: `apps/server/src/{application,opponent-selector,sourcing/legal-moves,
sourcing/tablebase-walk}.ts`, `apps/web/src/lib/board-input.ts`, most of
`packages/runtime/src/evidence-*.ts` plus `mobility.ts`, `pivotal.ts`, `semantic-evidence.ts`,
`tempo.ts`, `index.ts`, `rfc/README.md`, `rfc/pack-capability-contract.md`; untracked
`rfc/skills.md`, `rfc/live-following.md`, `planning/review/`, `packages/runtime/src/legal-moves.ts`.
**Re-run `git status` before each write.** Items touching a dirty file say so.

## 1. Verified already done — do not redo

| Audit finding | State at HEAD | Evidence |
|---|---|---|
| [[D1085]] compare strips render with zero children | **CLOSED** | `design/BACKLOG.md:407` ✅ — a controller drain (`/compare` finished before the `/evidence` poll attached results). **Not** closed by `0f04a2d`; that commit flipped D1203/D1204/D1210 and *opened* D1213 (item **W26**) |
| `POST /rated-games` has no client verb | **CLOSED** | `api.ts:1147` `createRatedGame`, reached from `App.svelte:392-395` |
| `GET /progress/related` uncallable | **CLOSED** | `api.ts:1046`, reached from `App.svelte:253-257` |
| `POST /packs/drafts/:id/playtest` uncallable | **CLOSED** | `api.ts:1091`, `App.svelte:555-557`; [[D1143]] ✅ |
| `POST /packs/drafts/:id/withdraw` uncallable | **CLOSED** | `api.ts:1104`, `App.svelte:565-568` |
| `make work-index` destination durability | **CLOSED** | `codex-queue.md:310` — COMPLETE 2026-08-23 |
| Campaign deterministic state fold | **LANDED** `e51b5a3` | `packages/runtime/src/campaign-state.ts` + tests |
| `rfc/variants.md`'s criterion 12 forbade the owner's ruling | **CORRECTED** | [[D1231]] — the criterion now bounds what a learner surface offers, never what the type admits |
| The owner's rejection of [[D1193]] was nowhere on disk | **RECORDED** | [[D1232]]; `rfc/skills.md` now drafted at full depth |

**4 of the 8 uncallable routes are now reachable.** The unreachable-mechanisms headline of **25** is
**21** at HEAD — correct the dossier when it is next quoted.

**Explicitly not work,** so nobody "fixes" them: `clockState` (`types.ts:124`) is a reserved
interface with `rfc/recorded-clocks.md` as its named consumer; `PLANNED_SURFACES` (`api.ts:274`) is
correctly empty and `api.test.ts:215` asserts it; the six `make`-target-only sourcing modules are
author tools and correctly not learner-facing.

---

## 2. The wave

### (a) Defects a user can reach, or that manufacture a chess claim

**W1 · The trait gate has no unit check, so a mis-scaled trait passes for the wrong reason.**
`apps/server/src/bot-policy-catalog.ts:224-231` gates on `traitDelta ≥ 0.1`. `traitDelta` is a
**fraction** in code and every dossier states **percentage points**, so a declaration carrying
`traitDelta: 12.28` passes because `12.28 > 0.1`. The roster's one real trait is exactly that value
(`trait.pawn_preference@1`, +0.1228 = 12.28 pp). Pin the unit in the field name or normalise at the
declaration boundary, **and** add an able-to-fail fixture: `12.28` rejected, `0.1228` accepted,
×3 at `0.0312` still failing. Fixture beside `bot-policy-catalog.test.ts:181-193`.
*Why now:* it is the only thing standing between the compiler and law 8 — the guard proving a
registered personality trait was measured — and W14–W16 register twelve profiles through it.
*Blocked-by:* **nothing blocks this.** [[D1181]] names it; no ledger row owns it. *Size:* ~30 lines
plus fixture — half a day.

**W2 · The play screen prints a requested Elo as if it were measured.**
`apps/web/src/lib/DrillScreen.svelte:1135` renders `rating target {humanSplit.targetElo ?? "unrated"}` —
the value the **request** carried, unqualified. Every other site gets this right:
`apps/server/src/outcome-presentation.ts:74-82,137-148` prints the band only when
`eloHonored === true`, prints `", band not recorded"` when honored but unrecorded, and says *"Target
Elo N was requested but is not recorded as applied"* otherwise; `engine-band.ts:68-88` refuses rather
than clamps. Route the drill-screen render through the same helper and add a browser assertion in
`tests/browser/drill.spec.ts` that a requested-but-unapplied band renders the qualified sentence.
*Why now:* a learner reads it on every drill; it is law 8's named anti-pattern in its smallest form,
sitting inside the one area the breadth audit called *"genuinely good"*. *Blocked-by:* **nothing.**
*Size:* ~15 lines plus one assertion — two hours.

**W3 · `void_reason` declares six members and has four writers.**
`'assistance'` and `'calibration_retired'` are in the type (`storage.ts:223-229`), the SQL CHECK
(`:4575`) and the client union (`api.ts:332`), and **nothing writes either**: every `voidRatedGame`
call site covers only `rewound`/`forked`/`engine_changed`/`abandoned` (`service.ts:2112,2117,2129`;
`storage.ts:1672`). The full ask is one of two complete acts: **(i)** land both writers —
`assistance` is the enforcement point for `rfc/learner-rating.md` §5.2, which refuses every
server-routed assistance route for a rated run's whole lifetime, and `calibration_retired` fires when
a band's calibration is withdrawn — or **(ii)** narrow the enum in a rebuild migration and record the
narrowing as a [[D1130]]-style row. Drafted already as `learner-rating` Discharge **D2**, owner
`codex` (`deferral-retrofit-batch-1.md` §2). *Why now:* rated games became learner-reachable when
`createRatedGame` landed; a storage layer advertising a void vocabulary the service never honours is
a claim about the record the record cannot support. *Blocked-by:* **nothing** — `learner-rating` is
`implementing`, so both arms are legal under law 1. *Size:* ~120 lines either way (the narrowing arm
is a STRICT-table rebuild plus a `STORAGE_VERSION` bump) — one to two days.

**W4 · `session_invitations.state` can never leave `'open'`.**
The table admits `state IN ('open','accepted','revoked')` (`storage.ts:4049-4058`) and there is
**no `UPDATE session_invitations` statement anywhere in the server** — verified. Only INSERT
(`:3221`), SELECT (`:1142,:3227`) and a DELETE on account departure (`:2235`). Two of three declared
states are unreachable, and `design/03`'s events/relays/matchmaking row (breadth row 43) rests on a
state machine that does not transition. Full ask: accept and revoke transitions, two routes, two
client verbs, and the invited-party surface that acts on them (`App.svelte:907-950`).
*Blocked-by:* nothing blocks the transitions. Verify first whether the live-session RFC states this
refusal — if it does, narrow the CHECK and say so rather than leaving it. *Size:* ~180 lines —
one to two days.

**W5 · Assistance permissions are byte-identical in every workflow context.**
`packages/runtime/src/assistance.ts:21-28` declares `sessionKind` (`:22`) and `workflowContext`
(`:23`); the body of `permittedAssistance` (`:30-35`) reads `deliveryOpen`, `seatedInContest`, `role`
and `reviewing` — **and neither of those two, ever** — while both callers (`rest.ts:1342,1361`)
dutifully compute and pass them. A Stream context and an Academy context get identical permissions.
The full ask is [[D307]]'s `configClamp` + `compileAssistance` with a literal seven-context ceiling
table. *Blocked-by:* **[[D971]]** — `rfc/intent-presets.md` specifies five module lists but **not**
the nine-field `AssistanceConfig` projections, and describes `configClamp` as *"the same ceilings"*
with no literal table; guessing whether Guided enables markers is inventing UX defaults. **Named
home and owner:** the `rfc/intent-presets.md` amendment, claude as register owner (§4 item 3).
*Not blocked and owed in this wave:* make the inertness impossible to reintroduce — delete the two
fields until the clamp exists, or add an able-to-fail assertion that the body reads both (~20 lines).
*Size:* two hours now; ~1 day for the clamp once D971 lands.

**W6 · Five written assistance presets are unreachable; the UI is 72 raw toggles.**
`packages/runtime/src/presets.ts:31-37` ships five preset promises (*"Staged-move risk warnings, on
request, before you commit. Never the best move."*). `AssistanceSettings.svelte` renders **8 contexts
× 9 raw controls and zero presets**. Full ask: the preset picker, five presets bound, ceilings
enforced client-side. *Why now:* Wall 8 of the breadth walkthrough, and the O3 ruling is explicit —
*"expose it through intent modules, opinionated workflow presets and real ceilings rather than
source-shaped settings"* (`design/BACKLOG.md:215`). *Blocked-by:* **[[D971]]**, same as W5, same
named home; sequenced immediately behind it. *Size:* ~200 lines once unblocked — two days.

**W7 · Friend games contribute nothing to progress.**
`apps/server/src/service.ts:2117` forces `countable:false` on the primary branch of a match
projection, so native two-human play and the return loop are disjoint (Wall 9). Full ask: decide and
implement the counting rule for match runs — which branch counts, against whose schedule, what a
shared run does to both learners' histories — or state the refusal in the RFC that owns matches and
narrow the projection so the flag is not silent policy. *Blocked-by:* verify whether the live/match
RFC states this. If it does, this is a documentation join, not code. If it does not, it is an unruled
product refusal and belongs in `make refusal-index`'s day-one output (W24). *Size:* half a day to
establish, ~150 lines if it proceeds.

### (b) Mechanisms complete but unreachable — the cheapest real product gain in the repo

**W8 · `campaign-core` has no HTTP surface at all.** [[D1140]], *"highest-severity reachability gap"*.
The RFC reads `implementing` and `rest.ts` contains **zero occurrences of "campaign"**, re-verified at
HEAD. What exists: `schemas/campaign.schema.json` (138 lines), `packages/schema/src/campaign/index.ts`,
the module algebra `packages/runtime/src/campaign-contract.ts`, Ajv validation plus three semantic
rules (`apps/server/src/campaign-validation.ts`), the in-memory `campaign-registry.ts`, the 8th
workflow context (`presets.ts:49`), and — as of `e51b5a3` — the deterministic fold
(`packages/runtime/src/campaign-state.ts`). The full ask, all of it:
1. **Persistence** — `campaign_runs`, `campaign_events`, plus a migration (`STORAGE_VERSION = 25` at
   `storage.ts:631` is the *rating* migration, so campaign is 26).
2. **Routes** — enter a node, seal a node, earn/spend a charge, unlock a module, read run state.
3. **Bootstrap** — `CampaignRegistry` is instantiated **only from its own unit tests** today.
4. **The two orphaned compilers** — `campaignModuleInventory` (`campaign-contract.ts:51`) and
   `effectiveCampaignModules` (`:63`) have **0 callers outside their own definitions**. They are the
   algebra the routes exist to run; wire them, do not re-implement them.
5. **Client verbs** in `api.ts`, a `/campaign` entry in `router.ts:22-32`, and a campaign screen.
   Today the client's only trace is an assistance label (`AssistanceSettings.svelte:18`) and the
   phrase *"Rated campaign games"* inside `RatingScreen.svelte:111`'s empty state — **two
   unreachable mechanisms pointing at each other.**
6. **Pin the two shape questions before the state becomes an HTTP payload**
   (`planning/campaign/state-fold-return.md`, and now [[D1233]]): whether `campaign_runs.status` is a
   second stored authority (the checkpoint assumed yes, needing `recordedStatus`, because the closed
   `campaign_events.kind` enum has no abandonment event), and whether `cursor` admits `null` after
   the ninth seal. Both are implementation boundaries, not rulings.
7. **An abandoned-run rebuild fixture**, named by that same return.
*Blocked-by:* **nothing blocks 1–7.** Authored campaign content is separate and held —
`content/campaigns/` does not exist, `find content -iname "*campaign*"` returns zero — behind
[[D560]]/[[D949]] as split by [[D1005]], owner OWNER. The routes do not need it; a fixture campaign
document exercises every path. *Size:* the largest item here — ~900–1,200 lines across migration,
routes, client and screen — four to six days.

**W9 · The four remaining uncallable routes.** Each has a complete server implementation and **zero
occurrences anywhere under `apps/web/src`**.
- **`GET /progress/metrics`** — `rest.ts:1191` → `service.ts:1901` `progressMetrics`. Client verb
  `progressMetrics()` on `DrillApi` (`api.ts:706-780`) and `DrillApiClient` (`:870-1340`), rendered
  beside the flat attempt history on `/learn`. *Blocked-by:* nothing. ~60 lines — one day.
- **`POST /runs/:id/reasoning-review`** — `rest.ts:1420` → `service.reasoningReviewAccess`. Client
  verb `requestReasoningReview(runId)`, reached from the run banner once a reason is recorded.
  *Blocked-by:* nothing in code, but the provider is **off by default** (`compose.yaml:11`,
  `capabilities.ts:305`), so the binding must render the honest unavailable state the capability
  layer already produces (`capabilities.ts:240-274,337-346`), not a dead button. ~90 lines — one day.
- **`POST /runs/:id/simulate` (`rest.ts:1699` → `service.ts:1619`) and `/simulate-enter`
  (`rest.ts:1707` → `service.ts:1703`)** — **BLOCKED, blocker specific.** [[D1154]] returned the
  implemented N-way contract: `simulate` computes a `BranchComparison` over a scratch `DrillRun` and
  returns neither that run nor self-contained nodes, so `CompareView` resolves every node id against
  the persisted run and every simulated row renders *"Line ended."*; and both the scratch walk and
  `simulate-enter` call `commitMove` **without** `orchestratePackMove`, so checkpoint, objective and
  terminal-consequence events are absent from preview and promotion, contradicting §7.3/A5. Full ask:
  the amendment checklist in `planning/n-way-simulation/implementation-return.md`, **then** both
  client verbs, **then** the `"simulated"` branch-origin badge `BranchRail.svelte:55` and
  `CompareView.svelte:84` already render for data no path can produce. ~250 lines contract repair
  plus ~80 binding — three days.

**W10 · `compileModuleRegistry` has never been called.**
`packages/runtime/src/module-contract.ts:188` exports the registry compiler; `index.ts:60`
re-exports only the compiled **type**; **nothing invokes the compiler**, and `rfc/learner-modules.md`
is `accepted` with this as its central artefact. Full ask: compile the registry at server bootstrap
(`apps/server/src/application.ts`, **dirty**) and route module declarations and reducers through it.
*Why now:* it also settles a live argument — [[D1069]] records `module-contract.ts` hard-coding a
three-stage hint contract that contradicts [[D1061]]'s four-rung ruling, so **the contract being
argued over is enforced by a compiler no request invokes.** Re-check D1069's premise first.
*Blocked-by:* declarations are blocked by [[D1205]]/[[D1206]] (`codex-queue.md:3` — *"D1205/D1206
block declarations, not reducers"*), owner codex, same queue section. **The compiler invocation and
the reducer path are not blocked.** *Size:* ~150 lines — two days.

**W11 · The semantic-evidence selector reaches learners through no server path.**
`packages/runtime/src/semantic-evidence.ts` ships 38 per-family constructors reached transitively
through `selectLocalSemanticEvidence` (`evidence-catalog.ts:1052`), and **that function's only
importer is `semantic-evidence-check.ts`, a `make semantic-evidence-check` CLI** (`Makefile:44-46`).
`rfc/semantic-collectors.md` is `implementing`. The largest single concentration of orphaned exports
in the repo sits behind a `make` target. Full ask: declare the production selection policy —
`EVIDENCE_SELECTION_POLICIES` (`evidence-catalog.ts:983`) holds exactly one member,
`research.r2_candidate@1`, marked `experimental` and `research.`-namespaced — and call the selector
from `apps/server/src/evidence-queue.ts` so a learner's inspector can surface a semantic event.
*Blocked-by:* the production policy is owed by `rfc/semantic-collectors.md` (12/14 projections
compile); nothing blocks the call site. **`evidence-catalog.ts` and `semantic-evidence.ts` are dirty.**
*Size:* ~120 lines plus the policy — two days.

**W12 · Three dead modules, three write-only fields, twenty-one uncited constants.**
Each gets a caller **or** a deletion in the same commit; nothing stays published with no reader.
*Dead modules, no CLI target and no test:* `sourcing/source-fetch.ts:11,34` (`fetchOpeningSource`,
`fetchPuzzleHeaders`), `sourcing/sourcing-check.ts:3` (`formatSourcingIssue` — which gains a natural
caller the moment W20 closes `SourcingIssue.code`), `apps/server/src/index.ts:129` (`serverBuildInfo`).
*Write-only persisted fields:* `atAuthoredBoundary` (`distill.ts`, `pack-orchestrator.ts`,
`pack-validation.ts`), `fromStart` (`tempo.ts`), `suppress` (`evidence-catalog.ts`) — wire the reader
each was added for, or remove with a schema rev. **`tempo.ts` and `evidence-catalog.ts` are dirty.**
*Uncited citation constants — 21:* `PHASE_PROVENANCE` (`phase.ts:20`), `KING_ZONE_CONVENTION`
(`king-state.ts:8`), `MATE_PROOF_CONVENTION` (`mate-proof.ts:10`), `SPACE_CONVENTION`
(`structure.ts:123`), `THREAT_CONVENTION` (`tactics.ts:13`), `GRADE_CONVENTION` (`grade.ts:26`) and
15 more. Each exists so a convention is *citable*, and a `grep -rl` across `docs/`, `rfc/`, `design/`
finds **no document citing any of them**. Cite each from the doc stating its convention, or delete.
Lowest severity in the wave — bytes, not behaviour. *Blocked-by:* nothing. *Size:* one day for all
three groups.

**W13 · The two data orphans — a run, not a caller.**
Same reachability failure, opposite repair.
**(a) The bestline collection pass** ([[D1061]], an owner ruling): the path is complete and reachable
end to end — `api.ts:1177` posts `{kind:"bestline"}`, `rest.ts:1687` accepts, `service.ts:1489`
defaults to it, `evidence-queue.ts:441` requests it, `compare.ts:204` consumes it — and **0 of 764
committed records carry one**. The ruling says the first step is a bestline collection pass; the
four-rung hint-distance axis cannot render a single rung without it.
**(b) The explorer census** ([[D993]]): the instrument ships (`sourcing/explorer.ts`) and has **never
been run once** — across 404 content files, 435 `engine`, 415 `engine_eval`, 342 `tablebase_result`,
59 `position_legality`, and **0 `explorer_frequency`, 0 `explorer_position_census`**, re-verified at
HEAD. [[D993]] measures **60 withheld `corpus_observed` claims** needing exactly these runs, against
a corpus with 196 claims and **one** bound claimBinding.
*Blocked-by:* nothing blocks either; (b) is independent of the `topGames` unpin in W18 — the census
uses position frequency, not per-game data. *Size:* engine and API runtime plus the provenance commit
and ledger flip — one day each.

### (c) Blockers gating other work

**W14 · `searchBound` must admit `"depth"` — and it is NOT one line.**
[[D1181]], `roster.md:465` and `scope-cut-audit.md` row 5 all call this *"one type union member"* and
*"a two-file change described as a wave boundary"*. **Verified at HEAD, that is wrong,** and the
correction is owed to the ledger in the same commit. The union is declared **twice** and consumed at
eleven more sites:

| Site | What it does | Breaks on `"depth"`? |
|---|---|---|
| `packages/runtime/src/types.ts:99` | `kind: "nodes" \| "movetime"` | declaration — must change |
| `apps/server/src/bot-policy-catalog.ts:76` | the actual `ErrorGuardLayer` field | declaration — must change |
| `bot-policy-catalog.ts:212` | embeds `searchBound.kind` in the disclosure literal | **no** — the card says *"depth 8"* free, as `roster.md:164` predicts |
| `bot-policy-catalog.ts:215` | `layer.parameters[layer.searchBound.kind] !== value` | needs a `depth` key in `parameters` |
| `opponent-selector.ts:356`, `:379` | **two duplicated inline copies of the union** as params | must change; easy to miss |
| `opponent-selector.ts:654` | `go ${kind} ${value}` | **works free** — `go depth 8` is valid UCI |
| `opponent-selector.ts:658` | `kind === "nodes" ? 5_000 : Math.max(5_000, value*10)` | **a trap** — a depth bound falls into the *movetime* branch and gets `max(5000, 80)` = 5000 ms: right answer, wrong reason |
| `rest.ts:260-265` | `kind !== "nodes" && kind !== "movetime"` → `throw invalid(...)` | **hard runtime rejection** |
| `rest.ts:296` | `kind: searchBound.kind as "nodes" \| "movetime"` | unchecked cast — must change |
| `schemas/drill_run.schema.json:140` | `"enum": ["nodes","movetime"]` | **schema rejection** — versioned run schema, so a rev bump |
| `docs/engine-workers.md:113` | prose | doc update |

Full ask: widen both declarations, collapse the two duplicated inline copies onto the shared type,
add the `depth` `parameters` key, replace the `rest.ts` allowlist and cast, bump the run schema,
replace the binary ternary with an exhaustive switch, and add a fixture proving a `depth` bound
survives request → run → replay **byte-identically** (criterion A3).
*Why now:* it blocks **8 of 12 bot profiles** outright. D969's only measured production bound is
fixed depth 8 and node bounds are refused by population completeness (15–16/50 all-exact) — **the
shipped type cannot declare the shipped answer.** *Blocked-by:* **nothing.** *Size:* **not one line
— thirteen sites, a JSON-schema enum, a run-schema rev and a byte-identity fixture. One day.**

**W15 · Nothing populates `candidate.traits`, and the blast radius is wider than the roster says.**
`bot-policy-catalog.ts:135` declares `readonly traits?: readonly string[]` on
`BotPolicyCandidateInput` (`:131`); `:509` reads `candidate.traits?.includes(layer.classifier) ===
true`, false for every candidate, so a registered trait multiplies by **1** everywhere. A repo-wide
grep for `traits` across `apps/` and `packages/` returns **exactly four hits**: the declaration, the
multiplier, and `bot-policy-catalog.test.ts:189-190`. The roster calls the fix *"a candidate-classifier
registry"*; that is necessary and not sufficient, because **the entire `BotPolicyCandidateInput` path
is test-only** — `composeBotPolicySelection` (`:418`) has **no production caller**, and every
production construction site builds `SelectionCandidate`, a **different type with no `traits` field**
(`opponent-selector.ts:317,338,341,631-636,733,825-829`; `feedback-policy.ts:34`). Full ask, all
three: **(i)** a pure classifier registry `(rootPosition, moveUci) => string[]` called where the Maia
vector is assembled; **(ii)** `SelectionCandidate` carries `traits`, populated at construction;
**(iii)** `composeBotPolicySelection` wired into `#humanCommon` when `policy.profile` is present —
the door is installed and locked, not missing: `BOT_POLICY_PROFILES` is already imported, already the
default `profiles` argument, and `validatePolicy` already routes through `validateProfilePolicy`
(`opponent-selector.ts:36,174,511`). *Why now:* it is *"the hardest blocker on the word
personalities"*, and the owner's ask is verbatim *"a proper Elo range of bots that play human-like,
**with personalities**"* ([[D810]], `BACKLOG.md:497`). It also sharpens [[D1087]], which was generous:
`trait.pawn_preference@1` exists **only as a test fixture**, and `RepertoirePolicy`/`MemoryPolicy` are
absent from the source tree entirely. *Blocked-by:* **nothing.** `opponent-selector.ts` is **dirty**
(codex is swapping a hand-rolled legal-move loop for `exactLegalMoves`) — coordinate. *Size:* ~1.5 days.

**W16 · Register all twelve bot profiles.**
`bot-policy-catalog.ts:296` is `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` — a literal empty
array, so `botPolicyProfile()` can never return anything and `validateProfilePolicy`
(`opponent-selector.ts:157-171`) rejects **every** profile request. A learner picks between two words
in one `<select>` (`JustPlayStarter.svelte:17`). Register **the twelve** from `roster.md` §1.3 —
family A `human-baseline-{1000,1400,1800,2200}`, family B `guarded-human-*` (depth 8 / 250 cp),
family C `pawn-forward-*` (`pawn_move` ×4) — with the per-profile learner sentences already written
at §1.4, which use none of the eight compiler-refused words and state no unmeasured Elo. Add the
able-to-fail band fixture [[D970]] specifies: `HumanPolicyModelLayer.band` is an unconstrained
`number` today, so adding 2400 or an interpolated band must fail. Bind the roster to the Just Play
selector so a learner picks a profile, not a word.
**The instruction that produced "family A's four" is withdrawn.** `codex-queue.md:251` — *"Ship the
smallest real range first"* — is quoted in [[D1230]] as a directive from claude to codex that caused
this defect. Family A ships first because W14 and W15 land **in this wave**, not because four is
smaller than twelve. *Blocked-by:* W14 (families B, C), W15 (family C), W1 (the gate they pass
through); plus one document blocker — `rfc/bot-policy.md` quotes **depth-12** guard numbers as
production while **depth 8** is the measurement ([[D1181]]), an RFC amendment owned by claude as
register owner (§4 item 2). Family A has zero blockers and is licensed by [[D970]] with no D969
dependency. *Size:* ~1 day after W14/W15. **[[D1183]]: do not run the pre-screen twice** —
`tools/d1163-engine-composed-bot-harness/` and the roster's Gate 0 are the same free move-match screen
over the committed R11 corpus; reconcile first.

**W17 · `source_kind`'s CHECK cannot express a broadcast or a masters game.**
`apps/server/src/storage.ts:4388`, inside `#addImportedGames()` (`:4384`):
`source_kind TEXT NOT NULL CHECK (source_kind IN ('pgn_paste','lichess_url'))` — a STRICT table, so
widening is a rebuild migration plus a `STORAGE_VERSION` bump. It blocks `rfc/live-sources.md`
Phase A's own migration (**accepted 2026-08-22, zero lines shipped** — breadth row 37), the
famous-games masters import (`famous-games.md:167-172` calls it a closed CHECK), and every downstream
surface either needs. *Blocked-by:* **[[D1211]], and it is a hazard, not a nuisance.** The accepted
RFC cites `storage.ts:3356` **four times — `rfc/live-sources.md:25,234,339,419` — and `:25` is inside
the `tabiya-claims` block codex implements against**:
> `migration | position behind campaign-core | imported_games.source_kind CHECK gains 'lichess_broadcast' (storage.ts:3356; STRICT table — SQLite CHECK edits require a rebuild migration)`

`storage.ts:3356` is `archiveClassroom(classroomId, at)`, unrelated code. Worse, there is a **decoy**:
`grep -n "source_kind IN"` returns exactly two lines — `:3870` (`'pgn_paste','lichess_study'`, a
*different* table) and `:4388` (the right one) — so a reader chasing `3356` and scrolling lands on the
wrong table. `planning/variants/rfc-derivation.md:489` inherited the same bad cite. **Do not implement
against the claims block until it is repaired** (§4 item 1); the planning tier already carries the
correction (`planning/live-sources/phase-b-derivation.md:100,715`). *Size:* ~200 lines — rebuild
migration, `STORAGE_VERSION` bump, backfill test, round-trip fixture — two days after the repair.

**W18 · The famous-game refusal is still in the code.** [[D1086]].
Verified unchanged at HEAD: `apps/server/src/capabilities.ts:159` still reads
`{ instrument: "Explorer", capability: "topGames / recentGames / masters database", disposition:
"refused", reason: "Per-game scope and licence questions remain unresolved" }`, and
`sourcing/explorer.ts:74` still sets `topGames=0`, re-pinned at `:201` with `recentGames: 0,
history: false`. **`grep famous` across `apps/` and `packages/` returns zero hits** — the 2026-08-23
commit landed the RFC and no code. `sourceGame`, the provenance object the lift depends on, has
**zero occurrences** in `schemas/`, `packages/` or `apps/`. **This work is already assigned to codex
by name:** `rfc/famous-games.md:266` Discharge `D1` — *"Apply the lift to capabilities.ts and
explorer.ts — [[D1086]] recorded that the ruling changed no code | codex | this RFC's implementing
commit"*. *Blocked-by:* `rfc/famous-games.md` is **draft**; law 1 forbids implementing the fetch
behaviour (serialised requests with 429 backoff, token+contact UA, no systematic index walk, NAG and
annotation stripping at the record boundary), the `sourceGame` object, the curation surface, and
[[D329]]'s four cross-pack consumers. Named home: this RFC's acceptance; owner: claude drafts, OWNER
accepts. *Owed today and not blocked:* the disposition row asserts a refusal the owner **reversed on
2026-08-23** ([[D1060]], FULL LIFT) — restate it so it stops claiming an unresolved licence question,
with the ruling cited. A truth repair on a startup-enforced assertion
(`assertAdvertisedCapabilityDispositions`, `capabilities.ts:167-188` — delete a row and the server
throws), not a feature. *Size:* ~20 lines, two hours; ~2–3 days for the RFC after acceptance.

**W19 · `UCI_Chess960` — the same shape, one row up.**
`capabilities.ts:133` carries `disposition: "refused"`, reason *"The shipped drill format is standard
chess only"* — startup-enforced, which is how *"a product opinion typed once became a startup
invariant"* (`refused-vs-asked.md` §1.1). [[D1042]] ruled the opposite the same day: *"Just Play | Any
variant, as an option"*, *"Campaign | Unrestricted"*. `apps/server/src/pgn-import.ts` refuses anything
but `Standard`/`From Position`, so a learner cannot even **analyse** a 960 game. *Blocked-by:*
`rfc/variants.md` is still **draft** and Tiers 2 and 3 remain behind its Discharges D2/D3, so law 1
holds — but the deadline item is **already fixed**: [[D1231]] corrected criterion 12, which previously
demanded *"no code path admits a `Rules` value other than `'chess'`"*, a shipped test that would have
failed the moment anyone implemented the owner's ruling. *Owed today:* the same truth repair as W18 —
the row's reason must carry the owner's ruling or stop stating a product law the owner reversed.
*Size:* ~20 lines, two hours; the variant axis is a separate multi-day item after acceptance.

### (d) (C) scope repairs where the fuller version is unblocked and codex owns the code

**W20 · `SourcingIssue.code` is a bare unregistered `string`, and the register bounding the debt grew
unwatched.** [[D1171]]. **(i)** `apps/server/src/sourcing/types.ts:125` types `SourcingIssue.code` as
a bare `string` with 15 literals — invisible to the refusal-discovery gate for exactly the reason
`SourcingError.code` was — while the registered 62-member `SourcingErrorCode` union (`:130`) is
applied only to the thrown-error class at `:196`. Close it to the union. **(ii)** `ServerErrorCode`
has grown **61 → 68** members (`apps/server/src/errors.ts:1`) while `archive/fixture-realism` §6
recorded 61 as bounded debt, because `refusal-coverage.test.ts:53-59` discovers codes from **emitter
call sites** rather than from the type alias, so a declared-but-never-thrown member is invisible to
the gate that bounds it. Add the type alias to the discovery gate. (The shrink-only register itself
works — `refusal-debt.fixture.json` 103 against the ceiling's 108, frozen 2026-08-15; it is the
*type* side that grew.) *Why now:* the obligation's only ledger home is a clause **inside [[D54]],
which reads ✅** (`BACKLOG.md:1161`), and `make work-index` does not read the interior of closed rows,
so it has been invisible from both ends since 2026-08-15. W25 fixes the instrument; this fixes the
case. *Blocked-by:* nothing. *Size:* half a day.

**W21 · The branch-collapse rule folds the game the learner came to study.** [[D1166]].
`packages/runtime/src/branch-scale.ts:75-81` computes `collapsedBranchIds` exempting exactly three
things — the active cursor branch, `compareIds`, `pinnedExpanded` — receives a `DrillRun`, and
**never reads `sessionKind`**. An imported game's mainline is a recorded loss roughly half the time,
so the unauthored default folds the subject of the session. The shipped `importedMainline` notion
survives at one unrelated site (`apps/server/src/service.ts:876-878`, guarding `STORY_UNAVAILABLE`)
with **no wiring between the two**. Full ask: an imported-run opt-out exempting the imported
mainline, wired to the existing notion rather than a second one, plus a fixture over an imported
losing game. *Blocked-by:* nothing — `archive/branch-set-scale` OQ5 named it unresolved **and named
the attachment point**. *Size:* ~60 lines plus a fixture — half a day.

**W22 · The branch-set envelope was accepted at a size it does not cover.** [[D1167]].
`docs/branch-runtime.md:418` and `:434-435` still carry, verbatim, *"at most 1000 events per drill
run"* and *"3000+ event sessions have not been accepted or characterized"*, and the benchmark table
at `:415-416` still tops out at the 1000-event row — while ninety-nine branches of twenty plies is
~2,000 events, which the **accepted** collapse rule admits. Run the characterization at 2,000 and
3,000 events and append the measured rows. If it fails, the envelope is the real limit and the
collapse rail is not — which is what the RFC predicted its own acceptance criterion 5 might surface,
and nothing re-ran it. *Blocked-by:* nothing. *Size:* half a day of runtime plus the doc append.

**W23 · The two sourcing fixtures F2 was written for carry no provenance.** [[D1170]].
`apps/server/src/sourcing/fixtures/tablebase-response.json` (243 bytes) and `explorer-response.json`
(440 bytes) are bare API-shaped bodies with **no `origin`, no `retrievedAt`, no `sha256` wrapper, no
sidecar and no README**, read as raw bodies at `sourcing/syzygy.ts:89` and `explorer.ts:152`,
unchanged since 2026-08-12. `archive/fixture-realism` §6 named them as the F2 provenance targets.
Full ask: the F2 sidecar pair plus the identity assertion, per that RFC's F2c split. *Why now:* this
is F1's own family — an assertion against a convenient invention — **inside the RFC that named the
rule**. *Blocked-by:* nothing. *Size:* two hours.

### (e) Instruments

**W24 · `make refusal-index`.** [[D1038]], the twin of `make work-index`.
*Verified absent at HEAD:* no `refusal-index` target in the `Makefile`; the `.PHONY` list (`:1`) and
`verify` (`:60`) both omit it; no `tools/refusal-index*` exists; repo-wide grep finds only prose in
seven documents. `work-index` **does** exist (`Makefile:26-28`), so the asymmetry [[D1037]] names is
live: the repo proves every engine option has a disposition and never proves a *product* disposition
has an owner. **All six clauses, not a first slice:**
1. **Machine-readable refusal blocks** reusing the accepted `tabiya-claims` convention ([[D648]]);
   the parser precedent already exists in `tools/register-check.mjs`.
2. A required **`class: product | technical`** on every refusal.
3. **The build FAILS on any `product` refusal with no `ruledBy: D<n>` resolving to a ⚖️ ledger row.**
   Day-one acceptance test: it must print `UCI_Chess960` (`capabilities.ts:133`).
4. A **cross-join** emitting `OWNER-CONTRADICTION: D327 × capabilities.ts:133` when a refusal
   forecloses a standing owner ask.
5. **`decision-queue.md` derived, not hand-written.** Of the 44 ledger rows ≥ D1030 touching an owner
   decision, **40 are absent from it**, six of them owner-facing questions created the same day
   ([[D1212]], [[D1190]], [[D1051]], [[D1162]], [[D1193]], [[D1076]]). The file says of itself at
   `:102-104`: *"**This file is part of the defect.**"*
6. **[[D1045]]'s asymmetry closed:** a `refused` row must carry at least as much justification as an
   `unmeasured` one. `assertAdvertisedCapabilityDispositions` demands an `experiment` for every
   `unmeasured` disposition and **nothing at all** for a `refused` one — so filing an open question as
   a refusal is the cheapest way to make it stop costing anything, which is exactly what happened to
   [[D329]]. **The shipped guard actively rewards the defect.**

Add it to `verify`. *Blocked-by:* nothing. *Size:* ~1.5 days.

**W25 · The archiving gate reads only the Discharges register.** [[D1201]].
*Verified at HEAD.* The gate is `tools/status-parity.mjs`, wired into `verify` via `Makefile:22-24`;
its archive check is `checkP5` (`:117-119`), which calls `parseDischarges` (`:40-52`), and that
function matches only `^## Discharges$` and parses a table. **Prose obligations are structurally
invisible** — which is how `archive/teacher-surface` archived carrying Open question 11, *explicitly
assigned to `learner-rating`*, which never took it. Second half of the same hole:
`tools/work-index.mjs:38` **excludes the archive directory entirely**
(`entry.name === "archive" ? [] : ...`). Three parts:
1. The archive gate must **refuse to archive** an RFC carrying an unrouted prose obligation — detect
   `## Open questions` entries with no resolution marker and no ledger id, and fail. This applies
   `deferral-retrofit-batch-1.md:146`'s own rule: *"if it cannot [name a home], the refusal should be
   made permanent rather than left as a deferral to a document nobody is writing."*
2. Include archived RFCs in `work-index`'s destination scan, so an obligation inside a closed row
   (W20's case, living inside [[D54]] ✅) is visible from both ends.
3. Enforce CLAUDE.md's completion protocol mechanically: archiving flips the `design/BACKLOG.md` rows
   it ships **and** appends the `planning/exploration/log.md` entry **in the same commit**. Verified:
   `grep -i archiv` over the `Makefile` returns nothing — checked by nothing today, and the log clause
   exists precisely because `engine-request-contract`'s missing log entry predicted its flow-back
   failure exactly.

*Blocked-by:* nothing. *Size:* ~1 day.

### (f) Everything else

**W26 · The structure strip still cannot express a change.** [[D1213]].
The residual [[D1085]] left, opened by `0f04a2d` in the commit that fixed the rendering:
`derived.compare.structure_delta@1` retains `operands: ["observation"]` only, so the producer emits
the newly-appeared observation and **no before/after pair is retained**.
`packages/runtime/src/structure.ts:594`'s own docstring concedes it — *"Render only retained
structural operands; the surrounding projection supplies the change verb"* — and the renderer
hardcodes the verb `appeared`. `learner-modules` A14 cannot be satisfied. Full ask: retain the pair
in the producer, widen the projection operands, render a real change verb. *Why now:* this is the
thesis surface — `design/03:460`, *"a surface that shows difference without explaining consequence is
a mode-menu entry, not a drill."* *Blocked-by:* nothing. **`packages/runtime/src/` evidence files are
dirty.** *Size:* ~150 lines across producer, projection, renderer and fixture — two days.

**W27 · `grade.ts` — six value exports, zero production callers. BLOCKED; recorded so it stays
visible.** [[D1088]]. `packages/runtime/src/grade.ts` implements `inaccuracy | mistake | blunder`
completely, is test-covered, and is re-exported from `packages/runtime/src/index.ts:219-222` with
**no production consumer** — re-verified at HEAD; the only symbol with a real consumer is the
*interface* `MoveQualityGrade`, read by `evidence-catalog.ts`. `rfc/move-quality-grades.md` is
`implementing`. *Blocked-by:* the consumer its own RFC names is the learner-facing review surface, and
`rfc/review-evidence-compiler.md` is **draft** with its Discharge D1 putting that surface explicitly
out of scope; law 1 forbids building it. **Named home:** that RFC's acceptance. **Named owner:**
claude drafts, OWNER accepts. *Size:* 0 in this wave; ~3 days once accepted — and per
`breadth-reality-check.md` §6 that RFC is *"the single highest-leverage unbuilt thing in the repo"*,
feeding skills ([[D549]]), style ([[D552]]) and campaign progress.

---

## 3. Counts and total size

| Category | Items | Blocked | Honest size |
|---|---:|---:|---|
| (a) reachable defects / manufactured chess claims | 7 · W1–W7 | W6 fully, W5 in part | ~7 days |
| (b) complete-but-unreachable mechanisms | 6 · W8–W13 | the simulate pair inside W9 | ~17 days |
| (c) blockers gating other work | 6 · W14–W19 | 0 for the code; 3 gated on §4 document repairs | ~7 days |
| (d) (C) scope repairs, fuller version unblocked | 4 · W20–W23 | 0 | ~2 days |
| (e) instruments | 2 · W24–W25 | 0 | ~2.5 days |
| (f) everything else | 2 · W26–W27 | W27 entirely | ~2 days |
| **Total** | **27** | **5 in whole or part, every blocker named** | **~37–38 working days** |

**22 of the 27 have nothing blocking them at all.** The five that are blocked cite: law 1 on three
unaccepted RFCs (`famous-games`, `variants`, `review-evidence-compiler`), one owner-tier specification
gap ([[D971]]), one returned implementation contract ([[D1154]]), and one owner content hold
([[D560]]/[[D949]]/[[D1005]] — the authored half of W8 only).

**Recommended order.** W14 → W15 → W1 → W16 — the bot chain, because it closes an owner ask end to end
and the measurement behind all twelve profiles already ran. Then W24 → W25, the instruments, because
every day they do not exist is a day a product refusal can be written with nobody's name on it. Then
W18 → W19, two twenty-line truth repairs on startup-enforced refusals the owner reversed. Then the
small unblocked user-visible set: W2, W3, W20, W21, W23. Then W8, the largest and the sharpest
reachability gap. Then W9, W10, W11, W26. Then W12, W13, W22. Then W4 and W7. W5, W6 and W27 enter
when their named blockers clear.

## 4. NOT codex's work — do not put these in a build queue

Real, found in the same audits, **none buildable**. Three of them block items above.

| # | The work | Whose | Why not codex | Blocks |
|---|---|---|---|---|
| 1 | **Repair `rfc/live-sources.md`'s four `storage.ts:3356` cites (`:25,234,339,419`), one inside the `tabiya-claims` block** | claude, register owner | Editing an accepted RFC's claims block is register work. `planning/variants/rfc-derivation.md:489` inherited the same bad cite | **W17** |
| 2 | **Amend `rfc/bot-policy.md` to quote depth 8, not depth 12, as the production guard number** ([[D1181]]) | claude, register owner | RFC amendment | **W16** families B, C |
| 3 | **Amend `rfc/intent-presets.md` with the nine-field `AssistanceConfig` projections and the literal seven-context `configClamp` table** ([[D971]]) | claude, register owner | Guessing the values is inventing UX defaults | **W5**, **W6** |
| 4 | **Rename the derivation template's `## Recommended scope cut` to `## The full ask, its cost, and what if anything blocks it`**, and ban *"first visible pixel"*, *"the smallest thing that"*, *"cheap-vs-general"* and *"a far smaller RFC than X sounds"* as scoping arguments | OWNER approves, claude applies | [[D1230]] R11 — *"the only repair that prevents recurrence"*; it changes how every future lane is derived | — |
| 5 | **Six intent-tier corrections** ([[D1089]]): `design/03:328` (B6 — distillation ships), `:330` (B8 — export and deletion both ship), `:325` (B3), and `gates.md:239`, which still calls `/settings` display-only while Settings ships 72 toggles — **the gate surface is split at HEAD**, the one thing `make intent-parity` exists to prevent | OWNER, or claude on an owner ruling | Law 5 | — |
| 6 | **`design/06-campaign.md:139` still reads `[1000, 2400]`** while `learner-rating` narrows rated play to `[1000, 2200]` on D338 (`learner-rating` Discharge D6) | OWNER — one nod authorises claude | Law 5 | — |
| 7 | **Draft RFC-B1, real clocks in play.** [[D1041]] ruled **BOTH** arms and `rfc/recorded-clocks.md:22-24` delivers arm (a) *"and nothing else"*, routed to *"the successor RFC's registration"*, which does not exist. The spec is already written at `planning/time-controls/rfc-derivation.md:754`. Also fix the dangling *"§10"* at `recorded-clocks.md:294` — the RFC's last section is §9 | claude drafts; two owner forks gate landing | RFC drafting | — |
| 8 | **`rfc/live-following.md` and `rfc/skills.md` are drafted but untracked at HEAD** — Phase B is now written (on [[D947]], the owner's verbatim commission), and skills was drafted at full depth after [[D1232]] recorded the owner's rejection of the no-RFC recommendation. Both need landing, review and acceptance | claude / OWNER | RFC lifecycle | famous-games' and review's successors |
| 9 | **Owner rulings with no queue row** — [[D1212]] (B5 casting, *"drafting-blocking"*), [[D1162]] ([[D810]]'s evidence-to-move selector: fund / defer / refuse), [[D305]] (what campaign progression is denominated in), [[D880]] (accuracy % — **no owner**), O15/O16/O17 as drafted in `deferral-retrofit-batch-1.md` §4, and the human anchor, unrunnable as specified under [[D649]] | OWNER | 40 of 44 recent owner-decision rows are missing from `decision-queue.md`; W24 clause 5 derives it, which is the mechanical fix | — |
| 10 | **The 27 orphan destinations** — *"a successor RFC"*, *"a later pass"*, *"its own lane"*, *"whoever next edits that row"* — plus the three lanes that do not exist (reduced armies, solitaire, xiangqi measurement). Each gets a D-id and an owner, or becomes a stated permanent refusal | claude | Mechanical, but ledger and RFC work | — |

**One premise that is nobody's build item.** `content/packs/` is empty and **zero packs graduate**
(220 blocking issues across 56 drafts). Every authoring mechanism works — studio, distillation,
mining, channels — and the output is zero. W8's authored campaigns and W18's famous-game packs land
into a pipeline that has never produced a published pack. That is the content hold, it is the
owner's, and **no item in this wave depends on it.**
