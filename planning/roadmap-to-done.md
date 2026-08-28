# Full 1.0 roadmap — the authoritative product rollup

**Owner:** coordinator · **Rebuilt:** 2026-08-24 under [[D1504]] · **Machine map:**
`planning/roadmap-1.0.json` · **Per-item state:** `planning/work-items-1.0.json` · **Guards:**
`make roadmap-check work-item-check` · **Generated status:** `planning/roadmap-1.0.receipt.json`

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
- UX is **an architectural rebuild, not polish**: 569 distinct items; 250 queued now, 61 waiting
  on a ruling, 116 on an RFC, 118 done, and 24 stale/wrong. Panels still stack above/between content,
  the board changes size, and evidence leaks as implementation detail.

Run these for current counts; prose counts are dated evidence, not authority:

```sh
make work-index
make work-item-check
make status-parity
make register-check
make roadmap-check
```

`make roadmap-receipt` deliberately updates the checked status artefact; ordinary verification
never rewrites it. `make roadmap-check` fails when any joined source changes without the receipt,
so a release/status report cannot silently survive changed milestones, RFC ownership, routes,
API reach or item assignments.

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
250 queued, 61 owner-blocked, 116 RFC-blocked, 118 complete and 24 retired items, with zero live
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
`semantic-collectors`, `semantic-convention-register`, `semantic-convention-provenance`,
`runtime-opening-identity`, `exact-legal-mobility`, `breadth-collectors`, `evidence-move-selector`,
`shared-candidate-evidence-packet`, `bounded-policy-targets`, `bounded-target-policy-composition`,
`recorded-semantic-path`.

The 2026-08-28 second repeat review keeps `bounded-policy-targets` unimplemented while preserving
its useful exact-target census and the local/provider/policy split. Seven finite repairs remain:
one exported threat-pass anchor; no invented initial promotion provenance; removal of the
unreachable `target_captured` branch; a discriminated witness algebra; request→result correlation;
a source-position batch that can actually enforce 512 target×candidate pairs; and a bounded
cooperative background queue with cancellation during work. Exact return:
`planning/bounded-policy-targets/second-repeat-independent-buildability-review-2026-08-28.md`.

The 2026-08-28 author repair answers that return without claiming acceptance: one pass-anchor
authority, observation-only promotion tracking, reachable immediate states, a discriminated
bounded-return outcome, one complete-set batch and a bounded cooperative queue are now literal in
the RFC. The author target crosses malformed result states, the 512 admission edge and cancellation
after work begins. A fresh independent buildability review still gates implementation; provider and
policy composition remain separate required 1.0 layers. Receipt:
`planning/bounded-policy-targets/second-repeat-author-repair-2026-08-28.md`.

The convention foundation now has an explicit two-step landing boundary. The process-only
`semantic-convention-register` first records an empty landed set plus D1722's exact 39-member live
claim; only the independently accepted product RFC may then create the runtime declarations and
convert those claims to landed rows. This preserves the no-implementation-before-acceptance law
without leaving a new shared semantic authority outside drift/collision checks.

The 2026-08-28 second repeat review keeps the shared candidate denominator explicitly
unimplemented. Its neutral complete-legal packet, original constituent evidence, removal of the
false F1 aggregate and one-root bot table all survive. The author repair did not establish a real
first consumer: `semantic-evidence-check.ts` is a verify-only hard-coded command, and the RFC itself
excludes governance tools from production counts. The remaining buildability work is finite:
publish the runtime receipt constructor/projector/assertion rather than an erased type brand; choose
a worker or cooperative-yield execution model before promising cancellation of the measured
synchronous compilation; close convention/version/abstention types; and bind the landing to an
actual Support, Review or bot operation (or obtain an explicit ruling for an intentionally unused
foundation primitive). Provider acceptance still gates only the held bot join. Exact return:
`planning/evidence-foundation-ux/shared-candidate-packet-second-repeat-review-2026-08-28.md`.

The 2026-08-26 independent review keeps [[D1023]]'s measured exact-target collector but returns
`bounded-policy-targets` on [[D1652]]–[[D1658]]. The provider layer must expose reusable node-free
Stockfish and Maia source receipts, literal F1 derivations over sealed target inputs, independent
legal-root completeness, real server operations and bounded scheduling/cache identity. A provider
file or inspector disposition alone does not complete this foundation; Support, Review, bots and
packs may not consume target-policy facts until the amended contract passes repeat review.

The 2026-08-26 contract closure makes the repair executable and changes its unit of work. Exact
target derivation, shared provider exchange receipts and target-policy composition are three
dependency layers; all remain required for 1.0, but they must not be accepted as one partially real
RFC. Nine Node-24 falsifiers prove canonical legal-set equality (including rook-square castling
identity), exact Maia history/request keys, sealed threat/exchange joins, weakest-input confidence,
inherited provider latency, same-exchange engine generation and bounded cancellation. The shared
provider layer is a prerequisite for Review, candidate scoring and evidence-aware bots rather than
private infrastructure owned by this one target family.

The 2026-08-27 author pass now makes that boundary literal. `bounded-policy-targets` is the local
three-projection operation only: it retains sealed threat/exchange/legal-move evidence and owns no
provider bytes. `provider-exchange-and-execution` owns the generic Stockfish/Maia receipts and shared
scheduler. New `bounded-target-policy-composition` owns the two reported provider joins and one
reachable application operation. This is a landing split, not a scope cut: all three are 1.0
requirements, every learner binding remains downstream, and each draft requires independent review
before dependency-ordered acceptance or implementation.

The same layer now owns node-free live Syzygy position receipts. [[D1699]] closes Wave C's final
promotion pair: geometry derives from complete declared pawn contacts; outcome joins exact legal
moves to same-FEN recorded-or-live tablebase evidence. [[D1700]] corrects the latency repair itself:
producer-wide metadata cannot describe a producer mixing local geometry with optional-provider
outcome, so F1 must compile availability/latency per projection and derivation member. Six Node-24
arms pass; the semantic RFC needs author amendment/review and the provider dependency before it can
truthfully move 12/14 to 14/14.
The manifest-wide follow-up makes that F1 amendment exact. The current 46 derived projections carry
96 direct derivation members expanding to 99 executable paths. Eight outputs falsely advertise
local/sync over Stockfish, ten bindings bypass provider-off validation through local wrappers, and
49 immediate members discard reported confidence; the transitive repair touches candidate vector,
story last-level, rank and title. [[D1701]]/[[D1702]] require generated path metadata, sticky
reported confidence and binding-level source-absence semantics before the shared provider layer or
new dependent collectors land. `dependsOn` remains the semantic/migration graph; execution derives
only from literal derivation choices, preserving alternatives rather than conjoining them.
The shared provider boundary now has its fourth source contract. [[D1703]]–[[D1709]] prove the
runtime Explorer page has no position/transport identity, accepts illegal/duplicate/impossible
moves, excludes queue time from its four-second budget, disagrees with its manifest abstentions,
discards fetched response fields and erases valid sub-100 populations. The repair is one node-free
`human.explorer.position_page@1` receipt shared by authoring and interactive policies, followed by
separate theory summary, recorded-move occurrence and repertoire projections. Seven Node-24 arms
pass; the shared provider RFC must cover Stockfish, Maia, Syzygy **and Explorer** before Review,
bots, theory or packs consume new provider evidence.
The variant foundation now has an executable scope receipt rather than the earlier textual count:
[[D1683]] measures 159 production calls across 32 files and separates nine rules-aware play
authorities from 23 standard-only/evidence readers that must be capability-gated. Tier-2 support
must land both halves together; making the branch legal while standard detectors still run is an
evidence-contamination failure, not partial variant support.
[[D1686]] measures the request side of that contamination boundary: run-derived evidence has 15
producer calls, split 8 service / 7 direct REST. A queue guard cannot cover human split, corpus,
voice packets or prediction; the operation population and the rules/setup receipt must be compiled
together. [[D1685]] also blocks prediction independently because its stored Maia mass/rank is not
bound to the active node's position/history.
[[D1688]] now measures the catalogue side across all 37 current producers and three subject
families. Capability must compile three independent axes—source computability, learner admission
and honest-empty versus suppression—before the 193 projection dispositions and 210 bindings are
applied. This is shared foundation, not variant polish: it lets bots consume a legal opponent
provider without widening Support/Review, and prevents derived evidence from laundering an invalid
source into a learner claim.

[[D1710]] closes the missing execution axis and makes the foundation state materially more
negative: 193 compiled projections divide into 93 current-consumer, 67 research-only and 33
unbound, yet the current-admitted candidate vector has zero production callers and **none of the
67 semantic projections reaches a live application operation**. Their exact deepest roots are 45
operator-selector-only, 11 behind the unused candidate helper and 11 isolated sequence helpers.
Phase 3 therefore waits on the complete one-edge packet operation plus the recorded-path compiler;
catalogue membership, an exported constructor or a consumer-operation registry entry cannot
satisfy a module, Review, bot, drill or longitudinal dependency.

The recorded half now has an amended draft owner: `recorded-semantic-path.md` compiles eleven v2
multi-edge projections across thirteen exact 2/3/4/5-edge evaluator rows, with complete window
receipts and a real-consumer completion gate. D1927/D1928/D1932/D1933 now have an executable contract:
total graph-derived paths, path-independent `run.record.edge@1`, and v2 successors rather than an
in-place v1 provenance rewrite, with exact versioned refs replacing the base-id event inventory.
The fixed 20/40/80-ply comparison refuses eager full one-edge
fan-out and resolves [[D1931]] with a byte-identical exact-source shape at
64.7/129.7/212.7 ms p95, all below 500 ms. [[D1921]]/[[D1929]] value/convention identity and repeat
review still block acceptance. [[D1870]] remains the separate consumer/presentation join.

[[D1711]] closes the separate validation axis and makes the word *validated* unavailable at HEAD.
All 67 semantic declarations manufacture their own positive/hard-negative labels, the compiler
checks only non-empty strings, and zero of 134 labels resolves to an independent fixture. The one
external token names an old 33-event R2 input; its output observes 29 current ids and says nothing
about the other 38. A new executable validation authority must run production emitters on genuine
positives and semantic hard negatives, bind exact population result identity and publish total
per-event validation profiles before D1710 wires events into modules. This is not another collector
breadth wave: it makes the existing evidence claims able to fail before their blast radius expands.

[[D1713]] makes that repair estimable: 32/67 events have an emitter positive, 5/67 an emitter
semantic negative and none an emitter-level orientation case. Eleven negatives and four
orientation cases exist only at source-predicate level; counterfactual authority splits 1 emitter,
2 composition and 3 source cases; imported output observes 23 current event roots; external
disagreement covers 8 tactic families; 14 events have no independent authority in any arm. The
validation RFC must close these as classed work packages and a total required/not-applicable table,
not claim one blended coverage percentage.

[[D1714]] refreshes the live migration boundary to 39 valid emitter positives, 10 emitter
negatives, 13 source-only negatives and seven no-valid-authority rows. All fourteen prior empty
rows can mechanically fire, but that does not make them equivalent: five local families are
fixture-ready, two sequences wait on a total recorded-path operation, and seven avoidance families
are defect witnesses because projection/sign aggregation drops their subject. King opposition is
also blocker-blind and opening-live. D1716/D1717 precede validation or learner admission of those
families; green mechanical output is not chess-semantic closure.

[[D1718]] makes the avoidance repair total instead of patching the isolated-pawn witness. Across
the fixed 754 authored + 579 imported decisions, the current top-two selector emits 790 avoidance
facts; 491 played children retain the broad family, 455 retain the exact projected condition key,
and 36 retain the family only on another subject. [[D1719]] separately proves one legal edge can
emit twelve same-family/sign subjects that collapse to one move entry before the receipt is sealed.
The successor therefore needs thirteen declared root-subject/value grammars, subject-first
distinct-move denominators and new `@2` identities upstream of validation and every learner
consumer; filtering the `@1` retained events cannot repair the lost evidence.

[[D1717]] closes the held opposition family's source boundary. The blocker-blind v1 convention
emits 90 observations over the same fixed populations; only 61 have empty intervening squares and
29 are blocked, including every imported occurrence. The authored corpus's all-endgame
concentration is not a source phase rule. New reading/event/avoidance `@2` identities must encode
unobstructed linear geometry, while modules decide endgame relevance. Because eight authored
predicate leaves currently carry no convention version, the author repair also owes an explicit
drill-pack/shape grammar and deliberate content migration before validation or learner admission.

[[D1722]] closes the semantic-provenance question across the whole manifest rather than treating
opposition as an isolated definition bug. Of 42 projections labelled `declared_convention`, only
10 carry a machine-readable convention operand; 16 name a convention only in prose and 16 do
neither. Eighteen additional convention-dependent projections use another scalar grounding. The
compiler accepts same-version meaning rewrites and refuses an added composition convention on a
single-grounding derivation, so validation and modules cannot infer a trustworthy source closure
from today's fields. A compiled convention registry, direct plus per-path transitive refs,
version-enforced migration and sealed bounded disclosure now precede D1711, avoidance v2 and all
learner/provider activation. Ordinary UX still receives module wording; raw ids remain Advanced.

[[D1723]] supplies the first complete convention-to-form case. The broad backward-pawn relation is
worth keeping, but the current 403 file observations erase 404 exact pawn subjects and every
reading has an empty square list. With 153/404 stop squares occupied, the structure fact cannot
honestly become an immediate “advance and be captured” hint. The v2 source therefore retains exact
pawn/stop/support/controller/occupancy identity, while legal advance and legal opponent capture are
separate derived facts. This one primitive can then power a theory-only highlight, a changed-state
card, a direct reply nudge, subject-safe avoidance and bot/style features without any surface
inventing chess meaning. Five authored leaves migrate only after the source contract stabilizes.

[[D1724]] closes the next square-control boundary, with [[D1725]] correcting its initial omission
of shipped work. One `safe` boolean cannot serve current board highlighting, future pawn challenge,
a hypothetical capture-migration closure, a candidate square, an occupied outpost and the value of
using it. The shipped maximal convention leaves zero occupied authored examples; a separately
named same-file convention yields 9 authored / 43 imported while preserving maximal reach for
consumers that truly need it. The broad occupied-control census is a stable 3.17× / 3.23× signal;
the existing minor-only `minor_harassed` event, `harassment_pressure` sequence and D771 local-safety
fact already own important subsets. The successor reuses and binds them through D1710, adding only
missing roles/shared identity, so Support, Review, drills and bots/style consume one family rather
than duplicate it or invent “prevents,” intent or value.

[[D1726]] closes the source-to-ordinary-consumer migration boundary. The web still renders a
median 80–84 legacy structural facts per position and four-to-six transition strings per move;
five inventory families are 85–88% of the structural volume. Eight richer structural sources have
zero consumers and every identity-rich transition successor is research-only. The returned module
draft would even reserve exact mobility, king and material records for Advanced while ordinary
sight keeps their coarse counts. The 1.0 route therefore preserves pack predicates, seals D1727's
named-structure identity, activates D1710 packet/path operations, and makes named modules select
the rich facts. Renaming the raw panel or moving it beside the board does not satisfy this gate.

[[D1728]] closes isolated/doubled pawn subject identity. The existing pawn-connectivity source
reproduces both legacy predicates exactly, but learner/event rows lose exact group membership,
including 27 fixed-population changes whose file truth stays unchanged. The 1.0 route derives
unbounded exact groups and `membership_changed`, preserves current author predicates, and keeps
weakness/value/plan in separate theory/evaluation joins. Ordinary modules, Review, style, bots and
broad content do not activate the file-only rows as learner evidence.

[[D1730]] closes the generic-line-collector question. Nearly a third of raw structural facts are
target-free board-edge blocker rows, while exact target-ray, discovered and observed-clearance
evidence already exists but has no ordinary consumer path. 1.0 versions [[D1731]]'s omitted
equal-count membership changes, keeps the line meanings separate, and lets requested sight,
postcommit Support and Review select exact relations. Another universal “relevant line” detector
would duplicate sources and recreate the dump.

[[D1732]] closes open/half-open file source truth and isolates [[D1733]]: a pawn change can reveal
an eligible file to a stationary rook/queen, a stable 2.43×/3.83× event the moved-piece-only
collector cannot represent. 1.0 derives exact file state from the shared pawn authority, preserves
authored predicates, and exposes moved-entry versus stationary-reveal as separate module/bot/Review
facts. Neither is permitted to manufacture “active,” “controls,” “good” or a plan.

[[D1734]] closes pawn-island event identity. The exact state already ships, but v1's two rows per
move are overwhelmingly no-ops and hide 62 equal-count topology changes as `preserved`; 78 changed
relations affect the non-moving side. 1.0 versions exact partitions, removes unchanged semantic
events, preserves authored count conditions, and supplies module/bot/Review/longitudinal consumers
with the actual affected islands rather than a directionless integer.

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

Primary RFCs: `learner-modules`, `module-registration`, `hint-distance`, `assistance-config-register`,
`evidence-presentation`, `intent-presets`. UX owners: INR and SET items.
The 2026-08-26 independent presentation review returns the thirteen-component landing on
[[D1664]]–[[D1672]]. The component vocabulary is still the required layer, but manifest strings
cannot seal typed visual operands; conventions are caller-writable; citation/enum/abstention and
structured-document operands are incomplete; coverage includes non-learner projections; chart
scale is a second visual authority; and real seats/hints plus the owner-tier component amendment
remain unresolved. Presentation implementation starts only after one real projection proves the
admission → sealed adapter → wire/parser → seat → equivalent-sentence path and forged operands fail.
[[D1673]] now proves the adapter/wire/parser portion on one real admitted claim projection with
five positive/negative arms; the remaining work is to generalise through exact per-projection
constructors and the real module route/seat, not to invent a third generic evidence wrapper.
The real module route is now scoped rather than hand-waved: [[D1689]] proves the 36-action run API
has no generic module response, and [[D1690]] proves all five board input modes converge before the
network commit. The returned registration contract needs one timing-discriminated, server-subject
module query and one generation-token staging controller. [[D1691]] also blocks trust: the current
board announces a committed move before the server accepts it; [[D1692]] pins the post-commit nudge
to the learner node returned before automatic opponent play advances the cursor.
The registry's remaining semantic returns now have executable repair shapes: [[D1585]] uses
literal branched answer-content sets rather than a false total ladder; [[D1591]] derives Sight's
`fact + pattern` union from its real 22 projections; [[D1586]] requires a move-free Explorer
population-summary derivation; [[D1587]] reseals reducer survivors through the existing exact
consumer authority; and [[D1589]] keeps the non-guidance rules floor for both Match seats. The
registry remains returned until the RFC absorbs these results and [[D1164]] supplies the exact
stable novelty-identity closure.
That closure is now measured: 52 possible declarations, with active set 49 under the existing
on-request repeat-answer invariant or 52 only if theory breadcrumb becomes suppressible.
[[D1693]] corrects the draft's false `38 + 6 + 4` arithmetic; [[D1694]] keeps the author from
silently choosing timing through an identity table. Production remains blocked on amendment and
repeat review, not further novelty discovery.
The 2026-08-26 independent re-review returns the preset compiler on [[D1659]]–[[D1663]] and
[[D1437]]/[[D1500]]: unset preferences currently masquerade as explicit Quiet choices; raw config
and module outputs can contradict; availability is undefined across provider/browser state;
Campaign is unreachable; and a deferred module consumer cannot discharge activation/logging.
[[D1660]] is the remaining owner rule for named presets versus Custom/Advanced overrides. The
shipped context/preset ids remain foundation, but a pill may not claim a preset until compiled
behavior and its logged module deliveries agree.
The 2026-08-27 module-registry repeat review verifies the original semantic/staging/novelty repair
harnesses, then returns the production join on [[D1863]]–[[D1870]]. Browser-local requested help
cannot be derived by a server that forbids it; the module path still calls the projection-only
string renderer presentation replaces; no operation assembles the 186+R admitted projection
population; revealing pre/at-commit modules have no claimed disclosure boundary; the legacy
`assistance.arrows` consumer would duplicate or bypass modules; the eleven branched capability
sets are unstated; and request chess/rung/checkpoint strings lack authoritative validation. The
subsequent 186-pair execution census also proves the observed
deflection/attraction/clearance/interference/zwischenzug/overload family has no learner-module
consumer even after its separately missing recorded-path compiler lands.
Registration can proceed only as a real request → server clamp → collector execution → exact F1
pair → reducer → sealed component → seat path, not as declarations around an empty input list.
Owner ruling [[D1564]] makes producer coverage part of this exit: the evidence layer owes the
typed operands required by every promised module. Presentation work may abstain honestly while a
source is unavailable, but 1.0 may not defer required emitters behind that availability state.
[[D1568]] separates two coupled obligations: existing directed evidence needs a typed one-fact
relation overlay and applied assistance clamp, while genuinely lossy transition emitters must
retain the missing piece/square identities before their modules can claim closure.
[[D1577]] re-checks the second half against the newer identity-preserving transition-event layer:
legacy count readings may remain lossy pack/inspector compatibility projections while modules use
the event authority, but only if corpus-wide equivalence and rule-event decomposition pass.
That measurement passes on all 754 committed edges: amend the presentation/module drafts around
the shipped event authority. [[D1578]] proves en-passant's victim square already survives in the
admitted capture-class derivation; bind that adapter and refuse endpoint inference from raw capture
rather than inventing another producer.
[[D1569]] keeps the guided-hint producer family literal: its module binding imports the measured
per-family horizon registry only after the selector/redaction gate, never a generic or wildcard
projection that launders different derivations into one id.
The 2026-08-26 rebuild now makes that gate concrete: one operator horizon per measured family,
one learner disclosure per family×rung, physical omission of higher-rung bytes, and one
per-decision Hint/A-little-more interaction. [[D1582]] keeps the F1 trust boundary honest across
REST: admitted views remain server-local and terminate in a closed digest-checked delivery receipt.
The rebuild still awaits independent review and the shared packet. [[D1581]]'s process-only
`assistance-config-register` draft now specifies the missing normalized-shape/head register and
sole v5 claim; it too awaits independent review before implementation. No UX work may substitute
raw engine/PV strings while those dependencies wait.
[[D1570]]–[[D1576]] return the shared candidate packet to buildability research before it becomes
the denominator for bots, hints and Review: bind or demote the packet in F1, retain literal engine
evidence in scored joins, name the execution/cache owner, make cache identities coherent and
memory-bounded, derive the emitter closure from code rather than a sample, and enumerate the
runtime/server symbol migration plus real consumer entry points. The buildability amendment now
specifies those obligations; independent review and the Node-24 latency/heap receipt gate
acceptance. [[D1576]] prevents the engine join from solving provenance with a fake run node: one
generic typed fixed-bound position evaluation feeds both candidate scoring and Review's derived
node-scoped point.
[[D1579]] closes the Node-24 receipt and corrects the cache unit before implementation: an equal
event/reading count admits 91.78 MB mixed heap while the same eight event-only entries retain
52.28 MB. The typed initial weight is therefore `events + 5×readings`; its corrected 56,000-weight
trial retains six mixed stress roots / 67.17 MB and preserves the equal-item arm as a negative
control. [[D1580]] keeps release clearance honest: the ruled core/cpu/accelerated tiers still name no
numeric heap/RSS ceiling, so the packet can be bounded, cross-reviewed and implemented but cannot
claim appliance-tier clearance until F12 supplies the predicate.

### 5. Whole-game Review, story, share, and return

<!-- roadmap-capability: review -->

**State: fragments exist, complete Review does not.** Import, story/share, grades, moments, progress
and retry primitives exist at uneven depths. The current result is neither a strong after-game
understanding surface nor Tabiya's distinctive return-to-rehearsal loop. [[D1536]] closes the known
raw cp/enum leaks; story is still capped to opaque cards, the move/phase arc is missing, and engine
graphics outrank grounded explanation.

The 2026-08-26 compiler checkpoint keeps the typed node-free engine score and separate cp/mate
domains, but returns the production contract on [[D1644]]–[[D1651]]: reusable White-WDL identity,
position-anchored mate proof, the actual Story queue path, same-exchange engine provenance,
learner-side compatibility, the process-local-seal/wire boundary, bounded whole-game scheduling and
weakest-input confidence. Review implementation cannot begin by merely filling the drafted types;
those eight joins are part of the 1.0 foundation.

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
Owner ruling [[D1563]] funds the authoring board, community-author workflow, Knowledge replacement,
principle provenance and official-content review instrument. The four-door chooser must not ship as
a boardless placeholder; it is now implementation work rather than an owner fork.

### 7. Human-like bots, personalities, roster, and bot events

<!-- roadmap-capability: bots -->

**State: measured machinery, no production roster.** Maia bands and policy composition exist;
route-source research passed; the catalogue still has no composed production profiles, depth
persistence and trait population block it, and most personality claims are not observable in play.
Avatars or adjectives do not solve that. The 2026-08-26 buildability return adds the deeper
contract blockers: typed shared-probe guard evidence, dependent-trait fallback, compiled trait
identities, a production composer route, combined selection budget and the owner-ruled picker/card/
identity surface ([[D1601]], [[D1602]], [[D1603]], [[D1604]], [[D1605]], [[D1606]], [[D1607]],
[[D1608]], [[D1609]]). [[D1610]] and [[D1611]] retain the final persona assets and explicit default
as owner choices. An honest non-empty catalogue is downstream of those repairs, not a substitute
for them.

**1.0 exit:** four measured bands × three behavior families carry immutable policy digests;
grounded route proposals and guard fallback never throw; repertoire, traits, plausible errors,
phase/endgame/clock behavior, rematch/history and declared absences appear on honest cards. Names
may be fun; behavioral claims cite a mechanism or measured rate. Blind human-likeness, strength,
trait observability, severe-loss, latency, reproducibility and provider-off gates pass. Local bot
events create ordinary Reviewable games without claiming public-event operations.

Primary RFCs: `bot-policy`, `bot-roster`, `bot-route-source`. UX owner: OPP items.
Owner ruling [[D1566]] fixes picker placement, persistent persona grain, visible identity,
band-relative honesty and clock-labelled calibration; the drafts still own their mechanisms.

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
Owner ruling [[D1565]] requires two explicit progression horizons: a run-scoped inventory of
drip-fed theory, modules and tools that matters in later encounters and bosses, plus durable
long-term rewards across runs. Exact consequential failure arithmetic remains research-owned.
The two-horizon foundation is now measured, not implemented: [[D1695]] blocks theory rewards on a
missing runtime passage authority, [[D1696]] blocks server-owned cosmetic awards on browser-local
catalogs, [[D1697]] requires campaign-schema lane 2, and [[D1698]] refuses generic durable
skip-start/modifier/variant ids without a registry and consumer. The author handoff specifies
separate ownership/equipment/availability state, universal later+boss opportunity, exact prestige
denominator and idempotent award history; `campaign-core` remains returned until it absorbs and
survives review.
Variant campaigns remain a successor structure, not a `DrillRun.rules` rider: [[D1681]] proves the
current pack-seal campaign cannot advance an evidence-dark Tier-2 node without inventing a verdict.

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
The 2026-08-26 variants re-review returns the full-family contract on [[D1674]]–[[D1682]]. Tier-2
play requires a rules-aware branch/move/terminal authority, durable setup identity, normalized PGN
setup classification, a packaged Fairy-Stockfish operation, rules-bearing evidence requests,
typed rung/admission closures and real entry-point readers. The current standard-`Chess` runtime
rejects Crazyhouse drops and validates every variant terminal under standard rules, so lane 0.20
may not land as an optional field over unchanged mechanics.
[[D1684]] now pins the adjacent identity boundary: `rules + setupFamily` is the minimum durable
chess subject, while workflow origin remains separate admission policy. The current importer
silently turns From Position without FEN into the normal start and rejects a supplied Chess960
setup; both must fail the production import matrix before variant support can claim persistence.
[[D1567]] reopens the public-pool cost model for a no-chat product. The 1.0 decision must price
automatic pairing, avoid/block, abort/stall controls, rate limits and operator evidence directly,
without assuming a social-network moderation stack or assuming chess-only play has no abuse case.

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

Two researched scope decisions now sit in this capability rather than outside the roadmap:

- [[D1844]] — decide whether 1.0 serves institution-managed minors. A yes requires explicit
  custodian, recovery, release, audit and safeguarding authority before an RFC; classroom
  membership alone can never imply account control.
- [[D1845]] — decide whether 1.0 ends at the complete rehearsal classroom or also includes
  academy CRM operations such as billing, payroll, parent administration and white labelling.
  Until ruled, those operations are neither silently promised nor silently discarded.

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

Primary RFCs: `storage-backup-recovery` for F12-C/D608, `safe-deployment-profiles` for
F12-A/D607/D1846/D1847, `provider-health-degradation` for F12-D/D609/D1848, and
`verifiable-runtime-distribution` for F12-E1/D610/D615/D1580/D1849/D1850. F12-E2 retains D611's
final F3/F4 runtime-content join. [[D1448]], the remaining F12 children, packaging checks, workflows
and deploy artifacts own the other residuals.

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
| Production-routed | `/auth`, `/capabilities`, `/packs`, `/shapes`, `/principles`, `/runs`, `/progress`, `/repertoires`, `/classrooms`, `/assignments`, `/api/shared`, `/shared`, `/select-move`, `/sessions`, `/rated-games`, `/rating`, `/marks`, `/cohorts`; `/healthz` direct |
| Required and missing | `/campaign` |

This is a family inventory, not a completeness claim. Each capability exit names remaining verbs,
authorization, errors, availability and journey proof.

### State and persistence chain

Durable migration head is 25. Live claims serialize longitudinal storage, bot policy, campaign,
live sources/following, clocks, social play and theory joins. Campaign/API work cannot skip its
store/bot predecessors. Every link needs a typed reducer, immutable inputs, idempotent jobs,
resume/rebuild, owner/actor identity, prior-release migration, account lifecycle, and a production
API/client consumer.

The six longitudinal-store returns now have one executable repair contract ([[D1612]]–[[D1617]]):
a literal 67-row constructor registry, generation/token/lease claim and stale-publisher CAS, exact
event-prefix cuts, family-independent denominators, the seven-operation run-write closure, and
observed-only imports until a learner-asserted subject receipt exists. This unblocks the next
author fold/re-review; it does not authorize the migration. Player style, skills, opening
performance, durable tips, bot history and campaign progression remain downstream of that
accepted/persisted boundary rather than rebuilding their own stores.

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
2. Land the sealed projection→component authority, then module registration, preset composition,
   disclosure, Advanced controls and typed components.
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
