# Capability reality audit

**Run:** 2026-08-20

**Program job:** A1

**Audited commit:** `b8e3649`

**Worktree rule:** uncommitted feedback-delivery code and measurement work were excluded from
capability credit

## Verdict

The current product is broader than its planning prose in one important place and substantially
shallower than that prose in several others.

- **Two capability families are proven through a production backend, a client workflow and a
  current browser episode:** the branch-based drill/rehearsal loop and native human-v-human match
  play. The latter directly contradicts the prior map statement that native play was not
  established.
- **Fourteen families have production mechanics but not the integrated outcome their row names.**
  These are not vaporware, but a passing unit test or a visible checkbox is not evidence that a
  non-technical learner can use the intended workflow.
- **Four families are claimed-only** at the product level: campaign, teacher/coach, the capability
  watch instrument and federation. Some have adjacent primitives or accepted prose, but not the
  named production workflow.
- **Bot tournaments/social events are absent.** There is neither a production primitive nor a
  sufficiently bounded current product contract.
- **No official pack is served.** `content/packs/` contains zero JSON packs. The registry serves 50
  non-browser documents from `content/drafts/` as `community` content, and all declare
  `reviewStatus: "draft"`. Therefore draft content can prove mechanical integration but cannot
  prove Gate F, official-content readiness or a 1.0 learner claim.

The most consequential architectural result is that the current evidence registry is not a
producer-to-consumer contract. `CAPABILITY_DISPOSITIONS` contains eight distinct free-text
`surface` values (`analysis`, `feedback`, `human split`, `corpus panel`, and so on). The canonical
`SURFACE_IDS` set contains seven different values (`play`, `review`, `learn`, `live`, `create`,
`justPlay`, `fromPosition`). **Their intersection is empty.** The free-text field never reaches a
client type, so it cannot prove that any producer powers any feature.

## Classification rule

- **proven:** the production primitive, client consumer and applicable non-test content are joined,
  and a current hands-on/browser episode exercises the intended workflow rather than merely its
  resting geometry;
- **mechanically present:** at least one production path exists, but a required link, real-content
  proof, interaction proof, default workflow or intended semantic outcome is missing;
- **claimed-only:** living intent/RFC/planning names the capability, but no production workflow with
  that meaning exists;
- **absent:** neither a production primitive nor a sufficiently specified current product workflow
  exists.

“Proven” here means current integration reality. It does not claim learning efficacy, user demand or
1.0 acceptance; those remain with the named research and owner gates.

## Four-link audit

| Capability family | State | Backend / producer | Client consumer | Real content or workflow instance | Last independent proof | Missing link / correction |
|---|---|---|---|---|---|---|
| Evidence foundation | **mechanically present** | `packages/runtime/src/evidence.ts`, `apps/server/src/evidence-queue.ts`, `position-evidence.ts`, `guidance.ts`; engine/corpus/tablebase sources | `DrillScreen.svelte`, compare/story renderers, corpus and human-split panels | Sidecars on draft packs plus 25 registered shapes | A0 focused suites; browser corpus, shape and compare episodes | No typed producer→evidence→consumer manifest. Eight free-text producer surfaces join zero canonical client IDs; grounding/sign/abstention are split across unrelated types. |
| Semantic move understanding | **mechanically present** | `structure.ts`, `transition.ts`, `pivotal.ts`, `shape-firing.ts`, phase/endgame readers | Structural/transition readings, pivotal marker, shape panel, story | Carlsbad, fianchetto and other draft/shape entries | Browser Carlsbad/phase-change episodes; D542 audit harness | Present-position census and a few transitions exist; tactics, multi-ply threats and signed avoided consequences are thin. D542 measured most raw volume as non-discriminating. |
| Guided play and blunder prevention | **mechanically present** | `assistance.ts`, `pivotal.ts`, feedback policy, guard conditions, reveal route | Assistance settings/grid, board lighting/arrows, post-commit guard and markers | `immediate-guard.browser.json` plus served draft packs | Browser immediate-guard and passive-guidance episodes; A2 exact-UCI census | Defaults are silent; source-shaped settings dominate; draft assistance RFC records unreachable/unbound rungs. A2 measured 4/90 exact live gestures, 15 wrong legal submissions and 71 no-ops after selection. No validated intent preset/module composition. |
| Full analysis inspector | **mechanically present** | `/analysis`, `/human-split`, `/corpus`, `/voice`, recorded evidence and comparison endpoints | On-request evidence controls, human split, corpus panel, branch boards/strips | Draft runs can request mock/real engine, corpus and sidecar evidence | Browser corpus and analyze-missing-evidence episodes; engine suites in A0 | Evidence is fragmented across controls and rendered mostly as raw source output. No single explicit inspector, common packet trace, source inventory, uncertainty view or provider-off composition test. |
| Theory and knowledge | **mechanically present** | Authored feedback projection, evidence refs, shape catalogue, repertoire explorer sourcing; no runtime knowledge index | Checkpoint authored theory, shape plans, repertoire gaps | `anti-caro-advance-early-c5.json`, Carlsbad shape and cited draft sources | Browser “Pack A … renders authored theory” and repertoire-gap episodes | Existing authored text can render, but there is no licensed knowledge bundle, exact-key/FTS/embedding retrieval, runtime ECO/theory join or theory↔drill return path. R4/R8 remain real work. |
| Drill/rehearsal modes | **proven** | Branch runtime/service, pack orchestrator, objective/outcome/trajectory/line modes | `DrillScreen`, timeline, branch rail, compare, outcome/reasoning/checkpoint sheets | 50 served community drafts including opening, middlegame, endgame, outcome, line and trajectory packs | Current browser episodes play, rewind, branch, compare, replay, outcome-grade and export real served drafts | Integration is real. Learning effect, comprehension and official-content graduation are not proven; the state must not be read as Gate F clearance. |
| Review Map | **mechanically present** | `story.ts`, game import, story/share/re-entry/derivation APIs | `GameStoryScreen`, terminal sheet, public story card | Imported PGN and completed draft runs | Browser import→story→re-enter and terminal→share episodes | The generic story is real, but selection is evaluation/event-led, not the requested small signed semantic map. Opening/phase arc, theory/human context, replay choices per moment and grounded social recap remain incomplete. |
| Library, opening workflow and content | **mechanically present** | Pack/shape registries and studios, repertoire import/scan/gap entry, sourcing validators | Play list, Library, Learn/repertoire and Create screens | 50 community drafts, 25 official shapes, zero official packs | Browser library, repertoire-gap and draft-pack episodes | All learner packs are drafts and Gate F is on hold. Library is a listing rather than a complete find→understand→rehearse→return workflow; schema churn/re-authoring stability is unproved. |
| Human-like bots | **mechanically present** | Maia UCI sidecar, band profile, TopP/temperature, human-common and tablebase modes | Opponent selection is pack/default driven; limited policy visibility in run UI | Draft packs declare Maia-backed opponent policies | Real-engine suites; optional Maia browser latency; prior Maia fidelity/band harnesses | Human-policy sampling exists, but there is no composed repertoire/style/error/time policy or observable personality contract. An Elo target is not a human persona. |
| Player profile and skills | **mechanically present** | attempts, `attempt_concepts`, schedules, milestones, history and `progressMetrics` | History shows attempts, due work and milestones; recommendations render | Played runs populate attempts/concepts | Browser milestone/flip flows plus progress unit suites | Metrics endpoint has no profile consumer; no versioned dimensions, reference populations, stability/confidence or archetype. Style, rating and advice are not yet byte-separate product objects. |
| Return and longitudinal coaching | **mechanically present** | due schedules, related positions, shape encounters and repertoire-gap recommendations | History “Recommended next”, “Due now”, milestones and source-run links | Repertoire gap and played-shape/run records | Browser repertoire gap becomes addressed; terminal/milestone return episodes | Return mechanics exist, but no grounded recurring-pattern aggregation or evidence-backed coaching statement. Some buttons route to `/play` rather than the exact pack/moment. |
| Campaign and fun progression | **claimed-only** | None with campaign semantics | None | None | No production/browser proof | `design/06-campaign.md` is intent; campaign R6–R8 remain unanswered and premises have been narrowed/refuted. Do not infer campaign from generic milestones/schedules. |
| Coach/teacher | **claimed-only** | Adjacent live roles, grants, leases and academy sessions; accepted `teacher-surface` migration/workflow is absent | Generic Live session UI only | Academy session can be created from a run | Browser live-session/overlay episode proves only the adjacent live primitive | No assignment, teacher observation/response workflow, `granted_via`, tested preset or consent surface from the accepted RFC. The accepted document is unbuilt and R15 may amend it first. |
| Streamer/broadcast | **mechanically present** | Stream session kind, live journal/votes/marks and run withholding | Chrome-free live overlay plus host/session wall | Any run can create a stream session | Browser run→live session→overlay episode | Mechanics are real, but audience-specific views, delay policy, moderation, disclosure safety and product workflow are underspecified and untested. |
| Human-v-human play | **proven** | Native match state, alternating leases, join tokens, pause/resume, authorship and evidence withholding | Match creation, friend join, live board rail and coach wall | Fresh Just Play run becomes a native two-player match | Current three-context browser test alternates moves, refuses out-of-turn/reveal, pauses, branches, resumes and records authorship; friend-link test also passes | Capability map was stale: native play is established mechanically and end-to-end. Product-scope, clocks, matchmaking, fair play, moderation and operating cost still require R17/O12. |
| Bot tournaments/social events | **absent** | No tournament/event model or persistence | No event/tournament surface | None | None | Match/arena import is not a bot tournament. Needs R11/R17 and a scope ruling before any RFC. |
| Self-hosted/open distribution | **functional core proven; release platform incomplete** | AGPL repo, Docker/Compose provider-off and Maia profiles, SQLite volume, digest-pinned release template | Web app reports configured provider identities, but not live Maia loss | R18 clean deployment completed/persisted a rehearsal without a cloud secret | R18 default/engine builds, restart, failure injection, deletion/export and image/rights census | No account export, complete erasure or backup/update contract; release HTTP/cookie instructions conflict; capabilities stay green on Maia loss; main image has no notices/SBOM; optional 5.11 GB Maia image carries 15 proprietary-labelled NVIDIA components. O13 ready; F12 required. |
| Responsive/accessibility/PWA | **mechanically present; core interaction inaccessible/incorrect** | Browser-independent runtime; static web manifest | Responsive shell, keyboard routes/help and labelled controls; board is one generic non-focusable node | Real served draft layouts including six endgames | A2 exact-UCI gesture census plus R18 Chromium DOM/AX/keyboard/viewport probe | A2: 4/90 exact cells, 15 wrong legal moves, 71 none; phone 0/6. R18: no keyboard/assistive move entry and Tab traps at Assistance. No screen-reader/physical-device participant floor. Manifest exists; service-worker registrations remain zero. |
| Import/export and integrations | **mechanically present** | PGN import, source preservation, run/branch PGN export, repertoire import, public share and external challenge URL | Review import, Learn repertoire form, PGN download/share and Live invitations | Imported Lichess-tagged PGN, repertoire PGN and branch artifacts | Browser import→story→re-enter→export and repertoire-gap episodes | Core PGN import/export is proven as a slice; adapter identity, round-trip provenance across all modes, external-account integration and stable re-entry targets are not. The family as a whole stays mechanical. |
| Capability watch | **proven planning instrument; targeted forum arm complete** | Checked JSON register plus deterministic validator/summary | Queryable capability/product/evidence/dependency/route records | 22 canonical representative products across 19 capabilities; aliases remain aliases; ChessLabHQ and TryChessLab are distinct | Duplicate-URL, source, enum, love/hate-missingness, dependency/route, map-family and alias/new-capability controls pass | D556 closed. D554 forum sweep leaves zero unchecked signals; comparable hands-on remains in R3/R7/R8/R11/R15-R17. |
| Federation/discovery | **claimed-only** | None | None | None | None | Vision only. R19 is correctly conditional on human/social scope surviving R17. |

## Cross-cutting findings

### 1. The registry joins the wrong namespaces

`apps/server/src/capabilities.ts` exposes two independent vocabularies:

- `SURFACE_IDS`: `play`, `review`, `learn`, `live`, `create`, `justPlay`, `fromPosition`;
- `CAPABILITY_DISPOSITIONS[*].surface`: `analysis and feedback`, `analysis`, `capability
  contract`, `corpus panel`, `engine worker`, `feedback`, `human split`, `opponent selection`.

There is no shared type, no consumer ID, no evidence-kind list on the relationship and no client
reader. A future manifest cannot merely rename this field: it must bind a versioned producer output
to a named module input and declare sign, grounding, abstention, disclosure rung, latency and content
requirements. This confirms F1 is foundational rather than bookkeeping.

### 2. Browser breadth is real, but its proof boundary is uneven

The current browser suite is much broader than the old reality column suggested: import/re-entry,
repertoire gaps, shapes, guidance, corpus evidence, post-commit guard, reasoning, live overlay,
stories/sharing, outcome modes, branch groups, theory, spectators, responsive layouts and native
matches all have episodes. A0 ran the clean committed suite successfully with only the optional
Maia transport test skipped.

That still does not clear interaction-state defects. A2 repaired the instrument and confirmed the
failure against exact submitted UCI: only 4 of 90 live click/drag/touch cells delivered the
authored move, and compact phone has a separate source-occlusion failure. Guided-board and mobile
remain mechanics rather than UX proof, but R3 can now use A2's interaction contract in disposable
prototypes.

### 3. Content proves wiring, not release readiness

The server intentionally labels committed drafts as `community` and serves them in every
environment. That is useful for integration proof and is why several browser episodes genuinely use
non-test chess content. It cannot be used as evidence that official material is grounded or stable:

- `content/packs/`: **0** JSON packs;
- `content/drafts/`: **50** non-browser pack documents, all `draft`;
- `content/shapes/`: **25** entries;
- D560/Gate F content hold: active.

The drill loop can therefore be called implemented and integrated while the official-content and
foundation-stability claims remain false. Both statements must stay visible together.

### 4. Existing mechanics should be reused, not rediscovered

Later research/RFC work must start from these shipped seams:

- story moments, public shares and run derivations for Review Map/re-entry;
- attempts, concepts, schedules, milestones, shape encounters and repertoire gaps for profile/return;
- native match pause/branch/resume and live withholding for human play, coach and stream work;
- evidence packets, recorded readings, corpus/human split and deterministic fallback for the
  evidence compiler/renderer;
- shape triggers and plan signatures for theory/detector joins.

The missing work is typed composition, semantic quality, defaults and proven workflows—not another
parallel implementation of each primitive.

## Queue consequences

1. Unblock R1, R2, R5 and R6 with this exact symbol/content inventory.
2. R3's disposable prototype/mechanical arms are complete against A2's exact-UCI interaction
   contract. Its participant/default-preset exit remains external; do not use the shipped defective
   board as a working baseline.
3. Amend the capability map's human-play reality immediately; research still owns the 1.0 scope,
   but it must compare native/adaptor/defer against code that already exists.
4. Treat teacher as unbuilt even though Live is real; treat streamer as mechanical even though the
   overlay is real. Neither may borrow the native-match browser proof for its own workflow.
5. F1 must replace the empty-intersection surface labels with a typed bidirectional manifest before
   evidence, bot, profile and review consumers expand. A4 has now traced the adapters it must own:
   14 producer paths end in five delivery states, only four are renderer-visible, and no production
   module/workflow IDs join the otherwise-valid R3 research contract.
6. Do not release the content hold. The audit found real breadth but still zero official packs and
   no proof that new evidence primitives avoid widespread re-authoring.
