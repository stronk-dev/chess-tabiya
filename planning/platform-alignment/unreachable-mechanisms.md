# Shipped-but-unreachable mechanisms — a systematic sweep

**Date:** 2026-08-23 · **HEAD:** `b3aa493` · **Author:** claude (platform-alignment)
**Status:** measurement dossier. No design intent asserted; every row is a measurement with a
file:line. New defects found here belong in `design/BACKLOG.md` before they are acted on.

## Why this sweep exists

Three of 2026-08-23's worst findings — [[D1088]], [[D1087]], [[D1050]] — are the same defect
class found **by accident, three times, from three unrelated angles**. The class is:

> Code that is complete, correct, tested, and that **no user can reach**.

It is invisible to every guard this repo runs. `typecheck` passes — the code compiles. `test`
passes — the code is tested, often thoroughly. `register-check` passes — the RFC says
`implementing`, and it is: the *mechanism* shipped. What no check asks is whether a **learner
holding a mouse** can cause the code to execute. This sweep asks that question on purpose,
four ways.

The four known instances given as the shape to generalize from, and their status at HEAD:

| Known instance | Reproduces at HEAD? | Where |
|---|---|---|
| `grade.ts` — zero callers ([[D1088]]) | **yes, exactly** | `packages/runtime/src/grade.ts` — 6 value exports, 0 production consumers |
| No client verb for `POST /rated-games` ([[D1088]]) | **yes, exactly** | `apps/server/src/rest.ts:1115` vs. 0 occurrences in `apps/web/src` |
| `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` ([[D1087]]) | **yes, exactly** | `apps/server/src/bot-policy-catalog.ts:296` |
| `clockState` — persisted, zero readers ([[D1050]]) | **yes, exactly** | `packages/runtime/src/types.ts:124` |
| `sessionKind` / `workflowContext` read by neither ([[D307]] amended) | **yes, narrowly** | `packages/runtime/src/assistance.ts:22-23` — see §4.2, the ledger's scope is precise and my first sweep mis-widened it |
| `bestline` — full plumbing, 0 records ([[D1061]]) | **yes, and it is a *data* orphan not a *code* orphan** | see §5.3 |
| explorer census instrument — never run ([[D993]]) | **yes, exactly** | 0 explorer records in 404 content files |
| `trait.pawn_preference@1` the only trait ([[D1087]]) | **yes, and it is worse** — that trait exists *only in a test file* | see §3.3 |

## Method, and what I filtered out

All four sweeps are scripted, not reasoned. Reproduction commands are in §8.

**Scope.** `packages/runtime/src`, `apps/server/src`, `apps/web/src` — 366 files, 202 of them
non-test. 1,683 exported symbols.

**Test-file exclusion.** A file counts as a test if its basename contains `.test.` or `.spec.`,
it ends `.typecheck.ts`, it contains `.integration.`, or it lives under `fixtures/`. Files under
`tools/` are counted **separately** as a third category, because a disposable research harness
is explicitly *not* a production consumer under `rfc/0000-rfc-process.md` §Exploration gate —
a symbol reachable only from `tools/` is still unreachable by a user.

**How I filtered deliberate public-API surface — and why the naive filter is wrong.**
The obvious filter is "exclude anything re-exported from `index.ts`". **That filter would have
hidden `grade.ts`, the sweep's own calibration case.** Every one of `grade.ts`'s six value
exports *is* re-exported from `packages/runtime/src/index.ts` — the barrel is exactly how a
mechanism looks when it has been *published* but never *consumed*.

So instead: `packages/runtime` has no consumers outside this repo (it is a private workspace
package, `pnpm-workspace.yaml`), and its only importers are `apps/server`, `apps/web` and
`tools/`. All three are inside my scan. Therefore **a re-export whose name appears in no
server, web or runtime file other than `index.ts` has no consumer at all** — the barrel entry
is not public-API surface, it is a publication with no reader. I record barrel status as a
*label* (`barrel-only`, `barrel+test`) rather than as an exclusion, so the owner can see which
orphans at least *claim* to be API.

I do exclude **types and interfaces** from the headline count (383 of them) and report only
**value exports** — functions, classes, consts, enums (283). A type with no importer costs
nothing at runtime; a function with no caller is shipped dead weight. Types are still counted
in §1.1 for completeness.

---

## 1. Sweep 1 — exported symbols with no non-test importer

### 1.1 Counts

| Measure | Count |
|---|---|
| Exported symbols across the three trees | 1,683 |
| …with **no production consumer** anywhere (server + web + runtime, non-test) | **666** |
| — of which types/interfaces | 383 |
| — of which **value exports** (function / class / const / enum) | **283** |

Breakdown of the 283 value exports by what *does* reference them:

| What references it | Count | Reading |
|---|---|---|
| Barrel (`index.ts`) **and** a test | 100 | published, tested, never called — **the `grade.ts` shape** |
| A test only | 83 | tested, never called, not even published |
| Barrel only, **not even a test** | 56 | published, untested, never called |
| **Nothing at all** — no barrel, no test, no tool | **37** | pure dead code |
| A `tools/` harness only | 7 | reachable only from a disposable instrument |

**283 of 1,683 exported symbols — 16.8% — cannot be reached from any production call path.**

### 1.2 Whole-module orphans

Ten modules have **no export referenced by any production file**. These are the cleanest
instances: the entire file is unreachable from the server or the client.

| Module | Exports | Reached by |
|---|---|---|
| `apps/server/src/graduation-report.ts` | 5 | tests + `make graduation-report` |
| `apps/server/src/shape-check.ts:24,38` | 2 | tests + `make shape-check` |
| `apps/server/src/sourcing/engine-walk.ts:52` | 2 | tests + `make engine-walk` |
| `apps/server/src/sourcing/graduation-clear.ts:71,164` | 4 | tests + `make graduation-clear` |
| `apps/server/src/sourcing/tablebase-walk.ts:72` | 2 | tests + `make tablebase-walk` |
| `apps/server/src/sourcing/verify-draft.ts:323` | 3 | tests + `make verify-draft` |
| `apps/server/src/sourcing/source-fetch.ts:11,34` | 2 | **nothing** |
| `apps/server/src/sourcing/sourcing-check.ts:3` | 1 | **nothing** |
| `apps/web/src/lib/theme/assets.ts:1,10` | 2 | a test only |
| `apps/server/src/index.ts:129` (`serverBuildInfo`) | 1 | **nothing** |

Six of these ten are **author/CLI tools with a `Makefile` target** (`Makefile:1,34-75`). They
are correctly unreachable by a learner — that is their design. They are *not* category (c),
and I classify them as (a) below. But they matter to the headline table: an RFC whose only
shipped surface is a `make` target has **shipped nothing a user can reach.**

### 1.3 The largest single-module concentrations

`semantic-evidence.ts` 38 · `evidence-catalog.ts` 20 · `account-data.ts` 9 of 34 ·
`bot-policy-catalog.ts` 9 of 29 · `sourcing/position-seeds.ts` 7 of 14 ·
`campaign-contract.ts` 6 · **`grade.ts` 6 of 6 value exports** · `module-contract.ts` 6 ·
`presets.ts` 6.

`semantic-evidence.ts` deserves a note: its 38 orphaned exports are *not* dead. They are the
per-family event constructors, and they are reached **transitively** — `selectLocalSemanticEvidence`
(`:1052`) calls them internally. What is orphaned is the *individually exported* surface: each
family is exported separately, and no caller ever imports one. The one true reachability
question for this module is whether `selectLocalSemanticEvidence` itself is reachable — see §6.

### 1.4 A family worth naming: the citation constants

21 of the 283 are `*_CONVENTION`, `*_PROVENANCE`, `*_RATIONALE`, `*_GUARD` constants —
`PHASE_PROVENANCE` (`phase.ts:20`), `KING_ZONE_CONVENTION` (`king-state.ts:8`),
`MATE_PROOF_CONVENTION` (`mate-proof.ts:10`), `SPACE_CONVENTION` (`structure.ts:123`),
`THREAT_CONVENTION` (`tactics.ts:13`), `GRADE_CONVENTION` (`grade.ts:26`) and 15 more.

These read as deliberate: a constant declared so a convention is *citable* rather than
re-derived. That would make them category (a). **I checked, and nothing cites them** — a
`grep -rl` for each of `PHASE_PROVENANCE`, `KING_ZONE_CONVENTION`, `MATE_PROOF_CONVENTION`,
`SPACE_CONVENTION` and `THREAT_CONVENTION` across `docs/`, `rfc/` and `design/` returns no
matches.

A citation surface that no document cites is category (c) — but a **cheap, harmless** (c).
They cost bytes, not behaviour. I count them separately in §7 so they do not inflate the
number that matters.

---

## 2. Sweep 2 — server routes with no client caller

I extracted every method/path guard from `apps/server/src/rest.ts` (the only router;
`main.ts:1-93` merely binds it, `service.ts` holds no routing) — **89 route/verb guards** — then
searched all of `apps/web/src` for a caller of each.

11 flagged; **3 are false positives** and I state them so the number is honest:

- `/auth/*` (`rest.ts:798`) — a prefix guard, not a route; every leaf (`/auth/register`,
  `/auth/login`, `/auth/logout`, `/auth/export`, `/auth/deletion-preview`, `/auth/delete`,
  `/auth/session`) has a caller in `api.ts:875-918`.
- `/packs/*` (`rest.ts:1080`) — prefix guard; `api.ts:937` calls it.
- `GET /runs/:id/pgn` (`rest.ts:1322`) — `api.ts:1331-1336` calls it. My matcher missed the
  template literal.

**8 routes are genuinely uncallable from the client.** Each has a complete server-side
implementation behind it.

| # | Route | Guard | Server implementation | Client verb |
|---|---|---|---|---|
| 1 | `POST /rated-games` | `rest.ts:1115` | `service.ts:548` `createRatedGame` | **none** |
| 2 | `GET /progress/related` | `rest.ts:1184` | `service.related(...)` | **none** |
| 3 | `GET /progress/metrics` | `rest.ts:1191` | `service.ts:1901` `progressMetrics` | **none** |
| 4 | `POST /runs/:id/reasoning-review` | `rest.ts:1420` | `service.reasoningReviewAccess` + external provider | **none** |
| 5 | `POST /runs/:id/simulate` | `rest.ts:1699` | `service.ts:1619` `simulate` | **none** |
| 6 | `POST /runs/:id/simulate-enter` | `rest.ts:1707` | `service.ts:1703` `enterSimulation` | **none** |
| 7 | `POST /packs/drafts/:id/playtest` | `rest.ts:1058` | `pack-studio.ts:108` `playtest` | **none** |
| 8 | `POST /packs/drafts/:id/withdraw` | `rest.ts:1069` | `pack-studio.ts:102` `withdraw` | **none** |

Verification: each of the eight path fragments (`rated-games`, `progress/related`,
`progress/metrics`, `reasoning-review`, `/simulate`, `/simulate-enter`, `/playtest`,
`drafts/…/withdraw`) has **zero occurrences anywhere under `apps/web/src`, including its test
files**.

`api.ts`'s `DrillApi` surface (`api.ts:706-780`) and the `DrillApiClient` implementation
(`api.ts:870-1340`) between them declare ~95 verbs. **None** of the eight above is one of them.

### 2.1 The one that is visible to a learner

`POST /rated-games` is the worst of the eight because its absence is **rendered**.
`RatingScreen.svelte:111` ships the empty state:

> *"No rated-game result has been recorded. Rated campaign games will appear here after they
> reach a chess-rules result."*

`GET /rating` and `GET /rating/history` are both called (`api.ts`, 3 occurrences each), so the
screen loads, queries, and renders. It renders a promise about a future that no code path can
produce: nothing in the client can create a rated game, so `history.games` is `[]` forever and
the `{:else}` branch is the *only* branch that can execute. This is [[D1088]]'s "the Record tab
can only ever say empty", confirmed at the exact line that says it.

Simulation (#5, #6) is the same shape one level deeper: `BranchRail.svelte:55` and
`CompareView.svelte:84` both render a `"simulated"` branch-origin badge. The origin value is a
real field; the routes that would ever set it are uncallable, so the badge is unreachable UI
for unreachable data.

---

## 3. Sweep 3 — registries, catalogs and constant tables that are empty or near-empty

### 3.1 Literally empty

| Site | Value | Verdict |
|---|---|---|
| `apps/server/src/bot-policy-catalog.ts:296` | `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` | **(b) staged** |
| `apps/web/src/lib/api.ts:274` | `PLANNED_SURFACES: readonly SurfaceId[] = Object.freeze([])` | **(a) intended** |

`BOT_POLICY_PROFILES` carries its own provenance comment at `bot-policy-catalog.ts:295`:

> `// D970 keeps the concrete band/profile roster closed until the accepted RFC pins it.`

[[D970]] is 🔬 *researched 2026-08-23*, cites `design/research/maia-production-band-roster.md`,
proposes the roster `[1000,1400,1800,2200]`, and is *"awaiting owner/RFC amendment before
production declarations"*. So the empty array is **staged with a named queue item** — category
(b), not an oversight. [[D1087]] is right that `bot-policy`'s register status of `implementing`
describes the grammar and not the learner's experience, but the emptiness itself is deliberate
and pointed at a live queue item.

`PLANNED_SURFACES` is genuinely intended: `api.ts:273` documents it —
*"Roadmap state is build-owned and deliberately never sent by the server"* — and `App.svelte:980`
reads it to label a surface "planned". Empty means *nothing is roadmap-only right now*, which is
the correct value, and `api.test.ts:215` asserts `toEqual([])` to keep it honest. Category (a).

This is the whole sweep-3 population: `= []` as a *catalog* initialiser occurs exactly twice in
production code. Every other `= []` in the three trees (≈40 sites) is a local accumulator
inside a function body (`const result: X[] = []`), not a registry.

### 3.2 Single-member registries

| Site | Members | Verdict |
|---|---|---|
| `packages/runtime/src/evidence-catalog.ts:983` `EVIDENCE_SELECTION_POLICIES` | 1 — `research.r2_candidate@1` | **(b)** — `disposition: "experimental"`, and the id is namespaced `research.` |
| `packages/runtime/src/evidence-ref.ts:43` `THEORY_EVIDENCE_FACTS` | 1 — `off-objective-deviation` | (a) — a closed union of one; the type derives from it |
| `packages/runtime/src/evidence-catalog.ts:122` `TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS` | 1 | (a) — family grouping |
| `packages/runtime/src/evidence-catalog.ts:132` `CASTLING_EVENT_PROJECTION_IDS` | 1 | (a) — family grouping |
| `packages/runtime/src/evidence-catalog.ts:134` `DERIVED_TACTIC_EVENT_PROJECTION_IDS` | 1 | (a) — family grouping |

`EVIDENCE_SELECTION_POLICIES` having exactly one member, itself marked `experimental` and
`research.`-namespaced, is the semantic-evidence analogue of the empty bot catalog: the
selection *grammar* ships with one research instance and no production policy.

### 3.3 The trait registry is worse than the ledger says

[[D1087]] records `trait.pawn_preference@1` as *"the only registered `ControlledTrait`"*.
Measured at HEAD, it is not registered at all:

```
grep -rn pawn_preference (excluding .git, node_modules, archive)
  design/BACKLOG.md
  rfc/bot-policy.md
  apps/server/src/bot-policy-catalog.test.ts     ← the only source file
```

The trait exists **only as a test fixture**. `bot-policy-catalog.ts` ships the
`ControlledTraitLayer` interface (`:80`) and includes it in the `BotLayer` union (`:104`), and
that is the entire production footprint. `RepertoirePolicy` and `MemoryPolicy` do not appear in
the source tree at all — not as interfaces, not as types. So [[D1087]]'s "interface-only with no
instance" is generous for two of the three: they are **not even interfaces yet**.

This should be corrected in the ledger. It does not change [[D1087]]'s conclusion — it sharpens
it.

---

## 4. Sweep 4 — persisted fields with no reader, declared config with no consumer

### 4.1 Persisted fields

I extracted every `properties` key from `schemas/*.schema.json` — **283 distinct persisted field
names** across `drill_run`, `drill_pack`, `campaign`, `principle_entry`, `shape_entry` — then
searched all 204 non-test production files for a *read* of each (`.field`, `["field"]`, or a
destructuring binding).

A purely textual reader-count is not enough, because **a read on the write path is not
consumption**. `clockState` is the proof: it has four syntactic "reads", and all four are the
act of storing it. So the automated pass produces candidates and each is then checked by hand.

**Automated result — fields with no syntactic read anywhere:** 3 of 283.

| Field | Sites | Verdict |
|---|---|---|
| `atAuthoredBoundary` | `distill.ts`, `pack-orchestrator.ts`, `pack-validation.ts` | (c) — declared, written, never consulted |
| `fromStart` | `packages/runtime/src/tempo.ts` | (c) |
| `suppress` | `packages/runtime/src/evidence-catalog.ts` | (c) |

**Hand-checked result — `clockState`, the [[D1050]] case, confirmed write-only.** Every
occurrence in the tree:

| Site | What it does |
|---|---|
| `apps/server/src/rest.ts:564-570` | parses `clockState` off the request body |
| `apps/server/src/rest.ts:1601-1603` | forwards it on the commit-move path |
| `packages/runtime/src/runtime.ts:58` | declares it on `CommitMoveOptions` |
| `packages/runtime/src/runtime.ts:342` | spreads it onto the node |
| `packages/runtime/src/types.ts:124` | declares it on `Node` |
| `apps/web/src/lib/api.ts:644` | declares it on the client-side type |
| `schemas/drill_run.schema.json:218,277` | persists it |

```
grep -rn "run.clockState|snapshot.clockState|stored.clockState" apps packages  → no matches
```

The value travels request → runtime → node → disk and **is never read back by anything**. It is
accepted from the client, validated, stored, rewound with the board, and consulted by no code
path. [[D1050]] reproduces exactly, and the schema's own comment — *"Reserved until clock
semantics are specified by a later RFC"* — makes it category **(a) intended interface**, now with
`rfc/recorded-clocks.md` (draft) as the named consumer, which upgrades it toward (b).

### 4.2 Declared config with no consumer — and a correction to my own first pass

[[D307]]'s amendment says `AssistanceContext` declares `sessionKind` **and** `workflowContext` and
the body reads **neither**. My first automated pass appeared to refute this: `sessionKind` has
~45 read sites across the tree. **The automated pass was wrong and the ledger is right** — the
claim is scoped to one function, not to the codebase.

Confirmed at HEAD: `assistance.ts:21-28` declares `AssistanceContext` with
`readonly sessionKind` (`:22`) and `readonly workflowContext` (`:23`); the body of
`permittedAssistance` (`:30-35`) reads `context.deliveryOpen`, `context.seatedInContest`,
`context.role` and `context.reviewing` — and **neither `sessionKind` nor `workflowContext`,
ever**.

Both callers (`rest.ts:1342`, `rest.ts:1361`) dutifully compute and pass both fields. The
function's entire decision is `mayRequestSplit` (`:32-33`), derived from four other fields. So
**every workflow context receives byte-identical permissions**, and the two fields that exist to
make context matter are inert. This is category (c) — with the caveat that [[D307]] is already
open, already retargeted by the owner to `intent-presets`/[[D971]], and explicitly *not* flipped.
So it is (c) **and already routed**, which is the correct state.

The lesson for this dossier's method: a field-level sweep must be scoped to the *decision site*,
not the codebase. A field can be read 45 times and still be unread by the one function whose
behaviour it was added to change.

### 4.3 Config with a consumer that cannot fail

`presets.ts:41` `WORKFLOW_CONTEXT_POLICIES` ships `moduleCeiling`, and it *is* consumed —
`campaign-contract.ts:46,71` and `campaign-validation.ts:54` read it. But per [[D307]]'s
amendment there is still **no `configClamp` and no `compileAssistance`**, so the policy shapes
campaign module unlocking and shapes nothing a learner's assistance panel does. Recorded here
because it is the near-miss form of the class: not unreachable, but reachable only on a path
that does not affect the user-visible behaviour it was declared for.

---

## 5. Classification

### 5.1 (a) Intended interface — declared so a future contract is expressible

| Mechanism | Citation |
|---|---|
| `clockState` (`types.ts:124`, `runtime.ts:58`) | `schemas/drill_run.schema.json` — *"Reserved until clock semantics are specified by a later RFC"*; `rfc/recorded-clocks.md` is that RFC (draft) |
| `PLANNED_SURFACES` (`api.ts:274`) | `api.ts:273` doc comment; asserted empty by `api.test.ts:215` |
| `THEORY_EVIDENCE_FACTS`, the four single-member `*_PROJECTION_IDS` families | closed unions whose derived types are the point |
| 6 CLI-only modules (`graduation-report`, `shape-check`, `engine-walk`, `graduation-clear`, `tablebase-walk`, `verify-draft`) | `Makefile:1,34-75` — author tools, correctly not learner-facing |
| `ControlledTraitLayer` (`bot-policy-catalog.ts:80,104`) | `rfc/bot-policy.md` — the layer grammar is the accepted contract |

### 5.2 (b) Staged — the consumer is queued and named

| Mechanism | Queue item |
|---|---|
| `BOT_POLICY_PROFILES = []` (`bot-policy-catalog.ts:296`) | [[D970]] 🔬 — roster researched 2026-08-23, awaiting owner/RFC amendment |
| `EVIDENCE_SELECTION_POLICIES` single experimental policy (`evidence-catalog.ts:983`) | `rfc/semantic-collectors.md` (implementing) |
| `bestline` plumbing (see §5.3) | [[D1061]] ⚖️ — owner-ruled 2026-08-23, *"first step is a bestline collection pass"* |
| explorer census instrument (`sourcing/explorer.ts`) | [[D993]] / [[D1112]] — closes with the binding arm's explorer census |
| `timingWindows[].note` | [[D1113]] — closes at `pack-population-provenance` implementation |

### 5.3 A distinction worth keeping: code orphans vs. data orphans

Two of the eight known instances are **not** code-reachability defects, and conflating them
would misdirect the fix.

**`bestline`** ([[D1061]]) — the code path is *complete and reachable*. `api.ts:1177` posts
`{kind: "bestline"}`, `rest.ts:1687` accepts it, `service.ts:1489` defaults to it,
`evidence-queue.ts:441` requests it, `compare.ts:204` consumes it. A user *can* reach every line.
What is empty is the corpus: **0 `bestline` records** in `content/`. Fix = run the engine pass.

**The explorer census** ([[D993]]) — same shape. Measured across 404 content JSON files:

| Record kind | Count |
|---|---|
| `engine` | 435 |
| `engine_eval` | 415 |
| `tablebase_result` | 342 |
| `position_legality` | 59 |
| `explorer_frequency` | **0** |
| `explorer_position_census` | **0** |
| total | 1,255 |

The corpus has grown since [[D993]] measured it (391→415 `engine_eval`, 32→59
`position_legality`), and explorer is **still exactly zero**. The instrument ships; it has never
been run once. Fix = run it.

Both are (b) staged. Neither is dead code. **Distinguishing them matters**: a code orphan is
fixed by writing a caller; a data orphan is fixed by running a job. They fail the same
"can a user reach this?" test and take opposite repairs.

### 5.4 (c) Genuinely orphaned — nothing points at it, nothing is scheduled

This is the answer the owner needs. **Full list.**

**Uncallable routes with complete server implementations — 8**

| # | Route | Guard | Implementation |
|---|---|---|---|
| 1 | `POST /rated-games` | `rest.ts:1115` | `service.ts:548` |
| 2 | `GET /progress/related` | `rest.ts:1184` | `service.related` |
| 3 | `GET /progress/metrics` | `rest.ts:1191` | `service.ts:1901` |
| 4 | `POST /runs/:id/reasoning-review` | `rest.ts:1420` | `service.reasoningReviewAccess` |
| 5 | `POST /runs/:id/simulate` | `rest.ts:1699` | `service.ts:1619` |
| 6 | `POST /runs/:id/simulate-enter` | `rest.ts:1707` | `service.ts:1703` |
| 7 | `POST /packs/drafts/:id/playtest` | `rest.ts:1058` | `pack-studio.ts:108` |
| 8 | `POST /packs/drafts/:id/withdraw` | `rest.ts:1069` | `pack-studio.ts:102` |

**Uncalled registry compilers — 3**

| Mechanism | Site | Callers |
|---|---|---|
| `compileModuleRegistry` | `module-contract.ts:188` | **0** — only the *type* `CompiledModuleRegistry` is re-exported (`index.ts:60`); the compiler is never invoked |
| `campaignModuleInventory` | `campaign-contract.ts:51` | **0** outside its definition |
| `effectiveCampaignModules` | `campaign-contract.ts:63` | **0** outside its definition |

**Grading — 6** (all of `grade.ts`'s value exports, [[D1088]])

`GRADE_CONVENTION:26`, `winPercentFromCp:95`, `moveQualityGrade:151`,
`renderMoveQualityGrade:196`, `assertMoveQualityGradeSentence:208`, `renderMoveQualityResult:212`
— barrel-published, test-covered, **zero production callers**. The one grade.ts symbol with a
real consumer is the *interface* `MoveQualityGrade` (`:72`, read by `evidence-catalog.ts`).

**Dead modules with no CLI target and no test — 3**

`sourcing/source-fetch.ts:11,34` (`fetchOpeningSource`, `fetchPuzzleHeaders`),
`sourcing/sourcing-check.ts:3` (`formatSourcingIssue`), `apps/server/src/index.ts:129`
(`serverBuildInfo`).

**Inert decision inputs — 2** (already routed via [[D307]]→[[D971]])

`AssistanceContext.sessionKind` (`assistance.ts:22`), `AssistanceContext.workflowContext`
(`assistance.ts:23`) — declared, passed by both callers, read by the body never.

**Write-only persisted fields — 3**

`atAuthoredBoundary`, `fromStart` (`tempo.ts`), `suppress` (`evidence-catalog.ts`).

**Uncited citation constants — 21** (§1.4; low severity — bytes, not behaviour)

**Value exports reachable from nothing at all — 37** (§1.1 row "NOTHING at all"; the 3 dead
modules and some citation constants are inside this set, so it is not additive)

### 5.5 The count

| Category (c) group | Count |
|---|---|
| Uncallable routes | 8 |
| Uncalled registry compilers | 3 |
| `grade.ts` value exports | 6 |
| Dead modules (no target, no test) | 3 |
| Inert decision inputs | 2 |
| Write-only persisted fields | 3 |
| **Subtotal — behaviour-bearing (c)** | **25** |
| Uncited citation constants | 21 |
| **Total (c)** | **46** |

The number to carry is **25 behaviour-bearing genuinely-orphaned mechanisms**, of which **8 are
complete server features no client can invoke**.

---

## 6. The headline — per-RFC user reachability

For each **accepted or implementing** RFC on the active register (`rfc/README.md`), how much of
what it specified can a learner reach today? "User-reachable" means: a person using
`apps/web` can cause the mechanism to execute. A `make` target is **not** user-reachable.

| RFC | Register status | Mechanism shipped | User-reachable | Evidence |
|---|---|---|---|---|
| `bot-policy` | implementing | seven-layer grammar, compiler, sampler | **no** | `BOT_POLICY_PROFILES` is `[]` (`:296`); learner picks between two words |
| `move-quality-grades` | implementing | `grade.ts` complete + tested | **no** | 0 callers; no client verb for `/rated-games` |
| `campaign-core` | implementing | `campaign-contract.ts`, `campaign-registry.ts`, validation | **no** | **zero campaign routes in `rest.ts`**; `campaignModuleInventory`/`effectiveCampaignModules` have 0 callers |
| `learner-modules` | accepted | `module-contract.ts` registry compiler, timing/form/answer images | **no** | `compileModuleRegistry:188` never invoked; only the type is exported |
| `graduation-clearance` | accepted | `graduation-clear.ts`, `graduation-report.ts` | **no** | both whole-module orphans; reachable only via `make graduation-clear` / `make graduation-report` |
| `learner-rating` | implementing | Glicko-2, bands, history, publication | **partial** | `GET /rating` + `/rating/history` are called and render; `POST /rated-games` is uncallable, so the history can only ever be empty (`RatingScreen.svelte:111`) |
| `longitudinal-store` | accepted | progress, schedules, milestones, metrics, related | **partial** | `/progress`, `/progress/due`, `/progress/milestones`, `/progress/recommendations` reachable; `/progress/related` and `/progress/metrics` are not |
| `intent-presets` | implementing | presets, workflow contexts, module ceilings | **partial** | `PROFILE_DEFAULTS` + `workflowContextPolicy` reached from `assistance-preference.ts`; but `permittedAssistance` reads neither context field ([[D307]] half (a)) |
| `semantic-collectors` | implementing | 38 family constructors, selection policy | **partial** | reachable transitively via `selectLocalSemanticEvidence:1052` — but its only importer is `semantic-evidence-check.ts`, a `make semantic-evidence-check` CLI (`Makefile:44-46`); **no server path calls it** |
| `live-sources` | accepted | explorer, syzygy, position-seeds, tablebase/engine walk | **partial** | pack content reaches learners; the *instruments* are `make` targets, and the explorer has produced 0 records |
| `pack-population-provenance` | accepted | provenance + `timingWindows[].note` reader | **no** | accepted 2026-08-23; not yet implemented ([[D1113]] closes at implementation) |
| `feedback-delivery` | accepted | delivery policy, authored feedback | **yes** | `/runs/:id/authored-feedback` called (`api.ts:1302`) and rendered |
| `runtime-opening-identity` | accepted | opening identity at runtime | **yes** | `opening-evidence` path reaches the client |
| `exact-legal-mobility` | accepted | `legal-moves.ts` | **in flight** | files untracked at HEAD; another agent holds this lane — **not assessed** |
| `play-composition` | implementing | viewport composition | **yes** | `playBoardEdge` consumed by `DrillScreen.svelte:47` |

**Score: of 14 assessable accepted/implementing RFCs, 3 are fully user-reachable, 5 are
partial, and 6 have shipped nothing a learner can reach.**

### 6.1 The worst rows

1. **`campaign-core`** — the sharpest finding in this dossier and **not previously recorded**.
   It is `implementing` on the register, ships a contract module, a registry class and a
   validation module, and `rest.ts` contains **not one campaign route**. There is no HTTP
   surface at all. The client's only trace of campaigns is an assistance-profile *label*
   (`AssistanceSettings.svelte:18`) and the phrase "Rated campaign games" in the empty state of
   a screen that can never be non-empty (`RatingScreen.svelte:111`). Two unreachable mechanisms
   pointing at each other.

2. **`learner-modules`** — `accepted`, and its central artefact, the module registry compiler,
   **has never been called**. `index.ts:60` exports the compiled type; nothing compiles one.
   This compounds [[D1069]], which records that `module-contract.ts` hard-codes a three-stage
   hint contract contradicting [[D1061]]'s four-rung ruling: the contract being argued over is
   enforced by a compiler no request invokes.

3. **`move-quality-grades`** — [[D1088]], reproduced exactly. Zero callers, no client verb.

4. **`bot-policy`** — [[D1087]], reproduced exactly, and worse on the trait arm (§3.3).

5. **`graduation-clearance`** — `accepted`, entirely `make`-target-shaped. Correct for an
   author tool; it means the register's `accepted` describes zero learner-facing surface.

6. **`semantic-collectors`** — `implementing`, ~38 constructors, and the only importer of its
   entry point is a CI check script. The largest single concentration of orphaned exports in
   the repo sits behind a `make` target.

### 6.2 Is the register telling the truth?

Yes — narrowly, and that is the problem. Every `implementing` row is *true of the mechanism*.
`rfc/README.md` tracks whether a spec has been built, and it is accurate on that question. It
has no column for whether the built thing is **reachable**, so a spec can go `accepted` →
`implementing` → `implemented` without any user ever being able to execute one line of it.

`engine-request-contract` is the precedent the repo already learned from: it was the only RFC
that flowed back to nothing and the only one with no log entry, and CLAUDE.md's log clause
exists because that absence *predicted* the failure. The reachability gap is the same kind of
cheap predictor, one tier lower — and it is currently measured by nothing.

**Suggested ledger rows** (per law 4, an idea missing from the ledger is a process bug — these
are proposed, not written; the ledger is a shared register but these are findings for the owner
to route):

- `campaign-core` is `implementing` with zero routes — the sharpest new instance of [[D1088]]'s class.
- `compileModuleRegistry` has never been called, which weakens [[D1069]]'s premise.
- 8 complete server routes have no client verb (the class, generalized from [[D1088]]'s one).
- [[D1087]] should be corrected: `trait.pawn_preference@1` is test-only, and `RepertoirePolicy`/`MemoryPolicy` are absent from the source tree entirely.

---

## 7. What this sweep found that was *not* a defect

Recorded so the number is honest and the method is auditable.

- **`play-composition`** — `PLAY_COMPOSITION_TOKENS:3` and `playViewportClass:16` look orphaned
  to an import-graph sweep, but both are internal helpers to `playBoardEdge:27`, which
  `DrillScreen.svelte:47` imports. Transitive reachability is real reachability.
- **`semantic-evidence.ts`'s 38 exports** — orphaned *as individually exported symbols*, but
  reached transitively. The defect there is the CLI-only entry point, not the 38 constructors.
- **`sessionKind` codebase-wide** — ~45 genuine read sites. Only `permittedAssistance` is inert.
- **`/runs/:id/pgn`, `/auth/*`, `/packs/*`** — matcher false positives, all three called.
- **`bestline`, explorer census** — reachable code, empty data (§5.3).

---

## 8. Reproduction

Sweeps 1 and 2 are Python passes (export/reference graph; route extraction vs. client literals)
kept in this session's scratchpad — one-shot measurement instruments, not tooling. Sweeps 3 and
4 and every spot-check are single commands:

```bash
grep -rnE '(compile|register|create|build)[A-Za-z]*\(\s*\[\s*\]' packages/runtime/src apps/server/src apps/web/src
grep -rn pawn_preference . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=archive -l
grep -rn clockState apps packages schemas | grep -v /dist/
sed -n '21,35p' packages/runtime/src/assistance.ts
grep -rF 'rated-games' apps/web/src | wc -l        # → 0
grep -rF 'progress/metrics' apps/web/src | wc -l   # → 0
grep -n campaign apps/server/src/rest.ts           # → no matches
```

## 9. Working-tree note

`git status` at start: 23 files modified and 7 untracked by other agents (codex commits
continuously; `rfc/variants.md`, `rfc/recorded-clocks.md`, `packages/runtime/src/legal-moves.ts`,
`tools/exact-legal-mobility-harness/`, `planning/exact-legal-mobility/`, `vendor/` were dirty).
**Nothing was edited.** This dossier is the only file written. `exact-legal-mobility` is marked
*not assessed* in §6 because its implementation is mid-flight in another agent's hands.
