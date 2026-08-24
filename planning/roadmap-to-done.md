# Full 1.0 roadmap — the authoritative product rollup

**Owner:** coordinator · **Rebuilt:** 2026-08-24 under [[D1504]] · **Machine map:**
`planning/roadmap-1.0.json` · **Per-item state:** `planning/work-items-1.0.json` · **Guards:**
`make roadmap-check work-item-check`

This is the one strategic answer to “what remains before a full 1.0?”. `design/BACKLOG.md` remains
the idea/defect ledger, `rfc/README.md` the lifecycle/resource register,
`planning/ux-implementation-index.md` the exhaustive UX inventory, and `make work-index` the live
ledger-row-to-destination join. `planning/work-items-1.0.json` is the persistent assignment state
for all 569 UX items. Those are source registers, not competing roadmaps.

The old version said feature work was empty, 39 packs were committed, and no product RFC was
active. HEAD has 46 active product RFCs, zero graduated packs, 569 indexed UX items, and whole
workflows with reducers but no API or web door. The old rows are deleted rather than patched
because their unit was a feature name, not a complete learner journey.

## The verdict

The engineering foundation is substantial. The product is not close to a full 1.0.

What exists is widest below the client: branch/event runtime, schemas and migrations, engines,
identity, evidence contracts, collectors, a large REST handler, authoring services,
classrooms/live primitives, rating arithmetic, and campaign schema/registry/fold. What is
incomplete is the chain that turns them into one coherent product:

`collector → grounded fact → selected module → persisted workflow state → production API →`
`opinionated client journey → official content → release proof`

A capability is not complete because one link exists. That makes the current state honest:

- Campaign is **partial mechanism, missing product**: no persistence, endpoint family, route, or
  authored campaign.
- Review is **partial mechanism, missing full workflow**: not yet the complete grounded game map,
  timeline, explanations, and retry/return loop requested.
- Assistance is **specified foundation, missing ordinary UX**: learners still meet producer labels,
  raw strings, and a 72-control grid instead of useful modules and presets.
- Bots are **measured machinery, missing roster/product**: the production profile catalogue is
  empty.
- Content is **a large draft corpus, zero official product**: no graduated pack, and
  manifest/graduation truth remains release-blocking.
- API breadth was **overstated by REST branch counts**: [[D1532]] found five implemented rating
  families omitted from `application.ts:isApiPath`. They are production-routed now and guarded at
  the real HTTP application boundary; the roadmap retains the distinction for every future family.
- UX is **an architectural rebuild, not polish**: 569 distinct items; 304 buildable now, 98 waiting
  on a ruling, 97 on an RFC, 46 done, and 24 stale/wrong. Panels still stack above/between content,
  the board changes size, and evidence leaks as implementation detail.

Run these for current counts; prose counts are dated evidence, not authority:

```sh
make work-index
make work-item-check
make status-parity
make register-check
make roadmap-check
```

## What “full” means

Every 1.0 capability is judged on the same eight dimensions. A green code column cannot hide a red
UX, content, or release column.

| Dimension | Required 1.0 proof |
|---|---|
| Evidence | Inputs are grounded, typed, versioned, attributed, able to abstain, and broad enough for the promise. |
| State | Reducers/persistence retain ownership, identity, revisions, resume semantics, and honest absence. |
| API | The production application—not only a direct handler—serves every verb with typed errors and authorization. |
| Experience | A non-technical player completes the journey without internal vocabulary, layout failure, or settings work. |
| Defaults | Named workflows are useful immediately; primitives remain configurable in Advanced, not exposed as the workflow. |
| Content | Reviewed, licensed material exercises every mode and important negative/empty case. |
| Verification | Contract, production-boundary, browser, accessibility, migration, negative, and owner-use checks fail meaningfully. |
| Release | A clean self-host installs, degrades honestly, persists, backs up, restores, upgrades, and rolls back. |

“Core” and “breadth” in the machine map are both 1.0 obligations. Breadth means an integrated
surface, not optional post-1.0 work. Federation, public matchmaking operations, native apps, and
monetization remain outside 1.0 unless promoted; architecture may not make them needlessly
impossible.

## Capability inventory

The machine map assigns all 46 active product RFCs, all twelve UX dossiers, all 569 stable UX item
ids, every client route, and every declared API family. A new active RFC, dossier, item prefix, or
route fails `make roadmap-check` until it has an owner.

### 1. Work truth, measurement, and release accounting

<!-- roadmap-capability: governance -->

**State: partial.** The ledger, RFC register, work index, status parity, shared-resource register,
intent parity, and persistent UX-item registry are real. The 569-item register now distinguishes
304 queued, 98 owner-blocked, 97 RFC-blocked, 46 complete and 24 retired items, with zero live
items unassigned; a source-row edit or a new id fails until its durable state is reconciled. Generic
non-UX ledger rows still answer “mentioned?” more reliably than “actively delivered?”, so the
capability remains partial rather than overstated as proven.

**1.0 exit:** coverage stays green; generic queue-only rows are assigned as touched; RFC, content,
research and release closeout flows into its register, log, docs, intent proposal, and this rollup;
measurement records retain inputs, revisions, failures and reproducible commands.

Primary RFC: `measurement-records`. Debt: [[D1504]], [[D1505]]; [[D1523]]/[[D1528]] are discharged
for the exhaustive UX inventory by [[D1535]] and `make work-item-check`, while the generic-ledger
extension stays inside the exit above.

### 2. Evidence collection, semantic events, selection, and grounding

<!-- roadmap-capability: evidence -->

**State: deep but incomplete.** The evidence contract/manifest and many structural, tactical,
transition, legality, opening, engine, tablebase, human-model, and explorer primitives exist. The
research found both sharp signals and overwhelming noise. Some families await discharge or draft
contracts; operand retention is incomplete; claim anchoring and pack compatibility are unresolved;
producer-to-selector-to-consumer closure is not yet a release invariant.

Runtime opening identity is now a complete foundation slice: its pinned local artifact, exact
endpoint/path/history projections, typed availability, production API route, and image boundary
ship. Its learner-facing Review, theory, bot, and longitudinal bindings deliberately remain owned
by those capabilities rather than being smuggled in as raw labels.

**Required breadth:** structures and changes; attacks/defences; hanging, overload, deflection,
clearance, attraction, discovered attack, pins, skewers, forks, trapped pieces and mating nets;
king/castling/promotion state; space/development/files/diagonals/outposts; multi-ply and bounded
reply consequences; avoided moves; opening/theory; engine deltas/PV only where permitted;
Maia/human choice; explorer frequency; Syzygy exactness; availability and uncertainty. A motif name
is published only when its predicate and validation earn it.

**1.0 exit:** every family has appropriate positive, mirrored, hard-negative, counterfactual,
imported and external-labelled validation; events preserve operands, sign, phase, source,
grounding, latency and abstention; selectors compile consumer-specific eligibility and
significance; raw-sentence side channels are gone; modules, bots and Review share the manifest.

Primary RFCs: `pack-capability-contract`, `claim-semantic-anchors`, `tactical-collectors`,
`semantic-collectors`, `runtime-opening-identity`, `exact-legal-mobility`, `breadth-collectors`,
`evidence-move-selector`, `shared-candidate-evidence-packet`, `bounded-policy-targets`.

### 3. Arrival and the rehearsal loop

<!-- roadmap-capability: rehearsal -->

**State: runtime proven, journey partial.** Commit, consequence, rewind, fork, compare, replay,
resume, leases, pack-optional play, and training forms are real. First-run teaching, phase-first
catalogue, board-stable layout, consequence horizon, branch intent, compare alignment,
replay-at-another-band, and opinionated entry are not one finished experience.

**1.0 exit:** a new learner experiences the thesis on rails over real content; Just Play,
line/plan/outcome/trajectory, imported and arbitrary-position flows share one stable board and
understandable loop; compare explains same/different, actor, material, convergence, intent and
grounded narrative; terminal states offer correct replay/Review/return doors. Full journeys pass
desktop, tablet, phone, touch, mouse, keyboard, resume and release-image tests.

Primary RFCs: `play-composition`, `pack-training-forms`. UX owners: ARR and CLP items.

### 4. Guided support, theory nudges, prevention, and advanced analysis

<!-- roadmap-capability: support -->

**State: contracts in flight, ordinary UX missing.** The goal is not rated engine moves. Modules
translate selected evidence at controlled disclosure distance: theory breadcrumb, pattern,
relevant square/piece, threat/defence relation, prevention highlight, or an explicit move only when
the workflow permits. Raw engine/Maia/explorer/classifier facts belong in an opt-in inspector.

**1.0 exit:** Quiet, Guided, Support, Drill, Review, Campaign, Academy and Stream open with useful
defaults and promises; module doors name learner questions; one unasked interrupter may claim
attention; theory-only and honest-empty paths are first-class; touch/hover/focus highlights never
resize the board; every primitive remains configurable under Advanced. LLM/TTS are optional
renderers over sealed items, never graders, selectors, chess authorities, or availability gates.

Primary RFCs: `learner-modules`, `module-registration`, `hint-distance`,
`evidence-presentation`, `intent-presets`. UX owners: INR and SET items.

### 5. Whole-game Review, story, share, and return

<!-- roadmap-capability: review -->

**State: fragments exist, complete Review does not.** Import, story/share, grades, moments, progress
and retry primitives exist at uneven depths. The current result is neither a strong after-game
understanding surface nor Tabiya's distinctive return-to-rehearsal loop. [[D1536]] closes the known
raw cp/enum leaks; story is still capped to opaque cards, the move/phase arc is missing, and engine
graphics outrank grounded explanation.

**1.0 exit:** native, bot, imported, social and campaign games compile to one Review Map: opening
and phase arc; navigable move timeline; bounded grounded moments; separate grade, human rarity,
theory, semantic change and exact endgame facts; correct learner-side result; decided-position
suppression; replay/retry, related drill/theory, share and schedule doors. Avoid both failures: raw
engine dump and uncapped “engine review with rewind”. LLM-off output is complete and share-safe.

Primary RFCs: `move-quality-grades`, `review-map`, `review-evidence-compiler`,
`feedback-delivery`, `return-scheduling`. UX owner: ATR items.

### 6. Theory, library, authoring, content, and graduation

<!-- roadmap-capability: theory_content -->

**State: useful material, zero official release content.** Shapes and principles are reused more
coherently than one-off concepts, but learners cannot browse them as a real knowledge surface.
Authoring services are deeper than the client; Library is a duplicate non-clickable listing;
principles need cited grounding; all 32 manifests measured in [[D1508]] were stale; no pack is
graduated.

**1.0 exit:** licensed/version-pinned theory and evidence ground principles/shapes/claims; the
capability contract and migration planner prevent blind corpus rewrites; Studio, CLI, CI and
graduation run the same checks; authors can browse vocabulary, lint unsaved bytes, preview,
regression-play and publish; learners search by phase/structure/motif/opening/mode/level,
understand, launch the exact drill, and return. A varied pilot graduates before breadth authoring,
then official content covers openings, middlegames, endgames, trajectories, forms, levels,
counter-cases and honest empties. Runtime ships an allow-listed immutable content bundle.

Primary RFCs: `graduation-clearance`, `pack-population-provenance`,
`theory-knowledge-pipeline`, `theory-drill-current-joins`, `famous-games`. UX owner: AUT items.

### 7. Human-like bots, personalities, roster, and bot events

<!-- roadmap-capability: bots -->

**State: measured machinery, no production roster.** Maia bands and policy composition exist;
route-source research passed; the catalogue still has no composed production profiles, depth
persistence and trait population block it, and most personality claims are not observable in play.
Avatars or adjectives do not solve that.

**1.0 exit:** four measured bands × three behavior families carry immutable policy digests;
grounded route proposals and guard fallback never throw; repertoire, traits, plausible errors,
phase/endgame/clock behavior, rematch/history and declared absences appear on honest cards. Names
may be fun; behavioral claims cite a mechanism or measured rate. Blind human-likeness, strength,
trait observability, severe-loss, latency, reproducibility and provider-off gates pass. Local bot
events create ordinary Reviewable games without claiming public-event operations.

Primary RFCs: `bot-policy`, `bot-roster`, `bot-route-source`. UX owner: OPP items.

### 8. Rating, longitudinal history, skills, style, and recommendations

<!-- roadmap-capability: learner_model -->

**State: rating partly surfaced; longitudinal spine draft.** Rating arithmetic/storage and a narrow
screen exist. Observation store, actor-complete events, background projection, style, skill
credits, opening performance, drill-down, privacy/sharing and recommendations do not form a
product. [[D1532]] repaired the five rating/marks/standing families at the production boundary;
longitudinal/profile APIs remain absent.

**1.0 exit:** owned immutable events rebuild idempotent observations/aggregates; metrics show
occurrence/opportunity, phase/decision class, revision, uncertainty, examples and abstention;
rating stays isolated from move feedback; style is continuous evidence, not a manufactured type;
skills are credits, not levels; opening/phase trends lead to relevant theory/drills; learners
control privacy, sharing, export and deletion.

Primary RFCs: `longitudinal-store`, `player-style`, `learner-rating`, `skills`.

### 9. Campaign, progression, encounters, resources, and failure

<!-- roadmap-capability: campaign -->

**State: reducer without product.** Schema, registry, contracts, validation and fold exist.
Persistence is blocked in the migration chain; failure-resource research is open; endpoints,
client route and authored campaigns are absent. [[D1514]] makes Campaign first-class.

**1.0 exit:** versioned campaigns compose registered packs, bots, modules, skills/rating, variants,
rewards, earned rewinds and a researched consequential-but-non-punitive failure economy; state
survives crash/retry/upgrade; API covers enter/read/seal/fail/reward/spend/unlock/resume/abandon;
web has an accessible map, encounter prep, in-run context, results, inventory and Review/return.
One varied campaign is authored and replayed end-to-end. Library remains open; progression is never
sold.

Primary RFCs: `campaign-core`, `training-mode-variants`. UX owner: CMP items.

### 10. Human play, live sources, clocks, variants, and social return

<!-- roadmap-capability: social_play -->

**State: primitives/screens, no coherent complete product.** Sessions, imports, Arena legs,
invitations and pause/branch mechanics exist. Native pairing/rating, invitation transitions,
live-follow growth, clocks, variants, provider challenge/result return, two-device proof and
event-ready aggregation remain incomplete.

**1.0 exit:** casual native, rated native, imported, live-follow, match and Arena are named flows
with explicit terms; two humans create/join/play/pause/resume/finish/rematch and reach Review;
clocks/results are authoritative where claimed; source/provider/variant identity survives;
provider-off fallback works; assistance/fair-play ceilings are server-enforced. Schema retains a
future event/round/pairing/result aggregate without pretending 1.0 runs a public tournament.

Primary RFCs: `live-sources`, `live-following`, `social-play`, `recorded-clocks`,
`enforced-clocks`, `variants`. UX owner: LIV items shared with professional workflows.

### 11. Coach, classroom, streamer, casting, and audience workflows

<!-- roadmap-capability: professional -->

**State: backend primitives, missing composition.** Classrooms, assignments, submissions,
Academy/Stream, overlay, marks, proposals and votes exist unevenly. Finished Teach Live, Review
Submission, audience preview, streamer chrome, simul wall, provider bridge, and complete
role/consent/error workflows do not.

**1.0 exit:** Academy/Stream are explicit presets over the sealed evidence rail; coaches
assign/review with per-run consent and no ambient weakness dashboard; streamers get documented
capture, audience preview, attribution, withholding/delay, voting client, privacy chrome and honest
provider limits; accessibility projections inherit the visible board ceiling. Role bypass,
reconnect, multi-account and source-off cases pass.

Primary RFC: `casting`. Archived teacher/live mechanisms remain dependencies. UX owner: TCH and
the professional subset of LIV.

### 12. Responsive layout, accessible input, theming, and PWA

<!-- roadmap-capability: accessibility -->

**State: board input repaired; full client floor not met.** Shared controller, permanent cells,
input modes, semantic grid and themes are real. The app still has dead shortcuts, focus/skip
issues, unsupported devices, overflow, post-gesture failures, weak contrast/animation instruments,
and a layout where panels stack around or resize the board. A manifest is not offline/update UX.

**1.0 exit:** board occupies one stable region; nothing grows in its column; adjacent regions
scroll and become drawers/tabs on small screens; every route works with pointer, touch, keyboard,
screen reader, zoom, reduced motion, phone, tablet and desktop; highlights have touch/focus parity;
themes have previews/licensed assets; install/offline/update/rollback are explicit. Owner-device
discharge remains.

Primary RFCs: `accessible-board-input`, `theming`. UX owner: A11 items.

### 13. Identity, privacy, import/export, backup, and deletion

<!-- roadmap-capability: account_data -->

**State: strong primitives, incomplete lifecycle.** Identity/authorization, leases, export/delete,
scoped links and object exports exist. First-run account timing, guest claim, complete disclosure,
portable account import, conflicts, profile/social coverage, backup/restore and recovery UX remain.

**1.0 exit:** learners understand stored/shared data and can export, import, delete and verify it;
links/teacher access are explicit and revocable; isolation/destructive previews pass; self-hosts
back up/restore all durable state; new longitudinal/social/campaign objects cannot land without
lifecycle coverage.

No active RFC is primary because its foundations are archived; this slice owns their residuals.
UX owner: IMP items.

### 14. CI, packaging, deployment, observability, and release

<!-- roadmap-capability: operations -->

**State: required test ownership is separated; release proof is incomplete.** Software contracts,
repository governance, real-content compatibility, browser journeys and interaction matrices are
separate named gates; Node/pnpm/Stockfish are pinned and local parity runs the same required tiers.
The mutable graduation-plan census is now a manual authoring instrument rather than a software
gate. Missing: release-container production-boundary coverage, Compose smoke and prior-schema
migration, live degradation health, safe profiles, runtime content allow-list, backup/restore/
update/rollback, SBOM/notices/signatures, model/runtime rights, and complete multi-architecture
proof.

**1.0 exit:** documented commands reproduce CI without hijacking normal commits/pushes; every gate
has one named test tier and failure meaning; product contracts use synthetic fixtures, content
acceptance owns real-pack assertions, browser smoke uses stable semantic roles rather than mutable
prose, and production claims cross the actual application/container boundary. Releases build
verified bytes, boot digest-pinned Compose on a clean host, serve advertised journeys, exercise
engine degradation, migrate a prior DB, back up/restore, update/roll back, and publish licences/
SBOM/signatures. Health is live, not a startup snapshot.

No active product RFC is primary; [[D1448]], F12, packaging checks, workflows and deploy artifacts
own the residual.

## Production surface inventory

### Client routes

| Surface | Reality | 1.0 owner |
|---|---|---|
| Home, Play, run | Live; arrival/composition/layout incomplete | Rehearsal |
| Review, story | Live; whole-game depth incomplete | Review |
| Rating, Learn | Live client routes; API boundary/longitudinal product incomplete | Learner model |
| Live, session, overlay | Live; social/professional workflows incomplete | Social / Professional |
| Create | Live; author tooling/parity incomplete | Theory/content |
| Library | Live but wrong: duplicate listings, no theory/library workflow | Theory/content |
| Settings | Live but primitive-first; presets/defaults/Advanced hierarchy incomplete | Support |
| Campaign | **Missing** despite ruling and partial backend | Campaign |

### API families

| State | Families |
|---|---|
| Production-routed | `/auth`, `/capabilities`, `/packs`, `/shapes`, `/runs`, `/progress`, `/repertoires`, `/classrooms`, `/assignments`, `/api/shared`, `/shared`, `/select-move`, `/sessions`, `/rated-games`, `/rating`, `/marks`, `/cohorts`; `/healthz` direct |
| Required and missing | `/principles`, `/campaign` |

This is a family inventory, not a completeness claim. Each capability exit names remaining verbs,
authorization, errors, availability and journey proof.

### State and persistence chain

Durable migration head is 25. Live claims serialize longitudinal storage, bot policy, campaign,
live sources/following, clocks, social play and theory joins. Campaign/API work cannot skip its
store/bot predecessors. Every link needs a typed reducer, immutable inputs, idempotent jobs,
resume/rebuild, owner/actor identity, prior-release migration, account lifecycle, and a production
API/client consumer.

### CI and deployment

| Layer | Exists | Still required |
|---|---|---|
| Fast local | Lefthook staged diff/type/process/scaffold selection | Stay fast; no full-suite commit/push hijack |
| Software contracts | `make verify-software` | Continue replacing real-corpus dependencies with synthetic fixtures where content bytes are not the subject; no direct-handler substitutes for boundaries |
| Repository governance | `make verify-governance` | Extend persistent assignment beyond UX rows without turning research measurements into product gates |
| Content acceptance | `make verify-content` owns tests that deliberately read committed corpus bytes | Add per-pack schema/provenance/compatibility diagnostics; keep graduation readiness and authored quality as explicit content-wave instruments |
| Browser smoke | `make test-browser-smoke` | Stable acceptance fixtures, semantic roles and core journeys only |
| Accessibility / responsive | `make test-browser-matrix` | Extend post-gesture, input, viewport, zoom and accessibility coverage with useful artifacts |
| Working tree | `make check` plus named browser/content targets | Clean supported-toolchain receipts; all roadmap/product gates wired |
| Exact parity | `make ci-local` | One documented setup and repeatable full pass |
| GitHub | named software, governance, content, browser, and matrix jobs on push/PR | Add production-boundary/container/migration jobs and useful non-browser artifacts |
| Release | tag builds server/Maia and digest-pinned Compose | smoke, upgrade, backup/restore, rollback, rights/SBOM/signing, safe profiles |
| Self-host | dev Compose + release template | reverse proxy/TLS, CPU-default tier, live degradation, operator docs |

## Execution program

This is dependency order, not a single-thread rule. Parallel work is welcome when it does not cross
an unaccepted contract or claimed resource/migration lane.

The machine map now carries nine guarded dependency milestones, each with a current state, exact
next action, dependencies, capability coverage and exit. `make roadmap-check` refuses an unknown
dependency, a cycle, a missing exit/action, or any 1.0 capability absent from that graph. The
readable spine is:

| Order | Milestone | Outcome |
|---:|---|---|
| 0 | Release truth | Separately owned CI/test tiers and durable work truth |
| 1a | Foundation contracts | Critical evidence/module/state/experience RFCs accepted and resource-safe |
| 1b | Evidence-to-consumer spine | Collectors close through selectors into modules, bots, Review and content compatibility |
| 2a | Stable board and presets | One stable board composition; opinionated flows; primitives under Advanced |
| 2b | Durable product state | Longitudinal, bot, campaign and social state survives rebuild/upgrade and lifecycle operations |
| 2c | Production API closure | Every advertised verb crosses the application and release-container boundary |
| 3 | Complete learner journeys | All core and breadth routes work end to end with defaults, errors, return and accessibility |
| 4 | Official content | A varied pilot, then the complete phase/form/campaign matrix on the stable foundation |
| 5 | Release candidate proof | Clean-host install, provider-off, migration, backup/restore, rollback and owner use |

### Wave 0 — make “done” enforceable

1. Keep work/status/register/intent/roadmap checks green.
2. Keep all 569 UX items in `planning/work-items-1.0.json`; a new item must acquire a capability
   owner and assignment before the guard greens. Extend the same state model to generic queue-only
   ledger rows as touched; do not make a fifth snapshot.
3. Preserve the separated test tiers from [[D1533]]/[[D1538]] and finish the remaining
   container/migration/release tiers; preserve [[D1532]]'s production-boundary family test.
4. Land research coverage and manifest-freshness guards; preserve negative results.

### Wave 1 — freeze evidence/content contracts before broad authoring

1. Re-review/accept capability, claim-anchor, selector/packet/target, module-registration,
   longitudinal and other returned/draft foundations in dependency order.
2. Complete collector discharges and semantic families with non-vacuous validation.
3. Compile producer → projection → selector → module/bot/Review joins; delete raw text paths.
4. Prove a read-only corpus migration/graduation plan before broad authored-byte changes.

**Gate:** no major pack wave until capability compatibility, claim anchors and event versions are
stable enough that a new primitive does not require blind edits to every pack.

### Wave 2 — state reducers, persistence, and production APIs

1. Land longitudinal storage/background rebuild.
2. Land bot persistence, proposals, roster inputs and fallbacks.
3. Land campaign persistence/rebuild, then API.
4. Land live/clock/social migrations in register order.
5. Add principles/theory APIs and close every intercepted API family.
6. Test all advertised families through `createApplication` and the release container.

### Wave 3 — rebuild the client around journeys and presets

1. Establish stable board + scrollable regions + responsive drawers/tabs before adding panels.
2. Land module registration, preset composition, disclosure, Advanced controls and typed components.
3. Deliver ARR → run → consequence → compare → terminal as one first-run flow.
4. Deliver full Review, Theory/Library, Campaign, bot cards, profile, native/social, Coach and Stream
   as complete vertical journeys.
5. Burn down all 569 UX item states by capability: correctness/trust, blocked doors,
   layout/accessibility, defaults, then cosmetics.

**Gate:** a route is not complete if it exposes enum/raw JSON/raw cp, requires source settings for
ordinary use, lacks error/empty/loading, or fails viewport/input matrices.

### Wave 4 — graduate content on the stable foundation

1. Reground principles/theory; refresh manifests/source digests.
2. Graduate a varied pilot covering every handshake and negative path.
3. Author the full opening/middlegame/endgame/trajectory/form matrix plus campaign, bot, Review,
   style/skill and theory examples.
4. Use engine/tablebase/explorer/human-model only for claims they support; keep authored chess
   judgment explicit and reviewed.

### Wave 5 — integrated release proof

Run the release artifact through:

1. First run → Just Play → nudge → consequence → rewind → compare → replay.
2. All training forms across opening, middlegame, endgame and trajectory.
3. Finish/import → full Review → retry/branch → theory/drill return → schedule.
4. Distinct bots → play/rematch → behavior record → Review → local bot event.
5. Rating/history → style/skill/opening drill-down → grounded recommendation.
6. Complete campaign with spend, failure, boss, Review and resume.
7. Two-device human game with clocks/result, plus provider/manual import/return.
8. Coach assignment/live/submission and Stream preview/vote/overlay.
9. Keyboard, screen reader, touch, phone, tablet, desktop, zoom, contrast, motion, offline/update.
10. Fresh install, provider-off, backup/restore, prior-version upgrade, rollback, export/delete.

Then the owner plays the same release on their devices. Findings reopen their capability; they do
not become an unowned “polish wave”. 1.0 ships only when every core and breadth capability has all
eight dimensions proven or an explicit owner-approved descope.

## How the other work documents are used

- `planning/WORK.md`: navigation only; points here first.
- `planning/ux-implementation-index.md`: exhaustive UX source register; descriptions and blockers live here.
- `planning/work-items-1.0.json`: persistent per-item lifecycle and capability assignment; workers
  select from this file and update state instead of curating another queue snapshot.
- `codex-wave-2.md`, `codex-wave-3.md`, `codex-queue.md`: tactical/history; cannot declare product
  completion.
- `platform-alignment/1.0-capability-map.md`: research-era synthesis; evidence, not current status.
- `platform-alignment/execution-queue.md`: dependency detail for that program.
- Review/routing/defect/research/RFC queues: source lanes consumed by capability owners.
- `design/BACKLOG.md`: ideas/defects/rulings, not priority.
- `rfc/README.md`: lifecycle/resources, not learner roadmap.

If a source document disagrees with this file about 1.0 state, its evidence still matters but its
rollup claim does not. Update the source register and roadmap together; do not create another
hand-maintained “feature complete” file.
