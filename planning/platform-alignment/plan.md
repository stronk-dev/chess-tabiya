# Platform alignment program

**Opened:** 2026-08-20

**Status:** research and reconciliation; this file is a routing plan, not implementation authority.

**Research basis:** `design/research/integrated-platform-alignment.md`

**Earlier brief:** `planning/evidence-rework-brief.md`

**Authoritative bottom-up program files:**

- `research-queue.md` — question, method, population, exit criterion and dependency;
- `decision-queue.md` — owner/design choices that evidence cannot make;
- `rfc-graph.md` — existing-document reconciliation and candidate dependency graph;
- `execution-queue.md` — the only current executable frontier and the route to release;
- `1.0-capability-map.md` — every requested capability, current reality, route and proposed scope.
- `capability-reality-audit.md` — A1 four-link proof for every map row.

This file remains the concise program charter. If a thematic workstream below appears to permit
work that its authoritative queue blocks, the queue wins.

## Objective

Turn the implemented foundation into one coherent, self-hostable chess rehearsal platform whose
evidence can safely power guided play, post-game review, theory links, human-like opponents,
player profiles, concept progression and later social modes — without manufacturing chess truth,
dumping engine data on learners, or repeatedly re-authoring packs as primitives change.

## Program rules

1. Research and owner rulings precede RFCs; accepted RFCs precede implementation.
2. The product mines capabilities, not competitor parity. Every adoption names the thesis-preserving
   transformation and the thing explicitly not copied.
3. The evidence plane is shared; guidance, review, bots and profiles are separate consumers with
   separate confidence, latency and disclosure contracts.
4. The LLM renders selected, cited evidence. It does not grade moves, select facts, choose an
   assistance rung, or create strategy.
5. Until Gate F below passes, authored work is limited to disposable/sacrificial pilot packs and
   already-authorised mechanical repairs. Do not launch a scale content wave.
6. A green mechanical suite is necessary and not evidence of intuitive UX. Every interaction
   module needs real content, gesture-state and non-technical-user checks.

## The foundation gate (Gate F)

Large content expansion is admitted only when all are true:

- [ ] no active RFC holds a drill-pack schema lane;
- [ ] shared-resource/register state agrees with the tree;
- [ ] a versioned producer→evidence→consumer manifest has no unexplained orphan;
- [ ] detector semantics v1 declares sign, grounding, confidence/abstention and validation;
- [ ] pack capabilities and deprecations have a compatibility policy;
- [ ] automatic migration/dry-run passes over every pack and sidecar;
- [ ] non-mechanical re-authoring cost is measured and within an owner-set budget;
- [ ] a small official-pilot set exercises every required primitive and guidance module;
- [ ] pilot packs pass viewport, gesture, assistance, review/re-entry and abstention checks;
- [ ] the owner accepts the resulting primitive set for the first scale wave.

The D560 **content hold is active by owner ruling**. This checklist is the proposed proof for
lifting it; the owner may amend the proof without weakening the hold by accident.

## Workstreams and dependency order

### 0. Reconcile what is already claimed

**Purpose:** prevent the new program from building on stale RFC/register state.

- derive the actual completion state of every active RFC from code, criteria, ledger and log;
- finish or explicitly return the accepted `feedback-delivery`, `teacher-surface` and
  `graduation-clearance` work;
- settle and implement the shared-resource register/lifecycle mechanism;
- re-run the interaction-state board checks behind D537-D539;
- produce one “shipped / accepted-not-built / draft / research-only” capability inventory.

**Exit:** no functionally-complete RFC is advertising an active lane; no accepted RFC is described
as shipped without its criteria, ledger and log closeout.

### 1. Complete the missing research spine

These are independent dossiers but feed one contract:

| Deliverable | Questions it must answer | Ledger |
|---|---|---|
| `design/research/detection-landscape.md` | What can rules, engine search, human corpus, theory catalogues and authored facts each detect? Precision, abstention, sign and validation set? | D544, D545, D558 |
| `design/research/detector-semantic-conformance.md` | **Answered for current 18+6 families:** which matcher/reader projections round-trip, where operands disappear, which content depends indirectly on unstable semantics, and what remains inspector/author-only? | D629-D633 |
| `design/research/evidence-contract-topology.md` | **Answered for 14 shipped producer paths:** which namespace/projection reaches refs, packets, LLM sentences, standalone panels or side channels; whether production binds any R3 module/workflow; and which omissions are deliberate versus undeclared? | D634; re-verifies D145/D147/D318/D546/D630 |
| `design/research/workflow-default-conformance.md` | **Answered mechanically:** whether six technical assistance profiles implement the ruled workflow/preset identities and per-kind ceilings; which routes alias/bypass preferences; and which prior control-count defects are stale? | D635-D636; corrects D311; re-verifies D307/D321/D532/D582/D619 |
| `design/research/selection-sign-and-significance.md` | Which locally measured facts survive a bounded packet; how do gained/lost/preserved/avoided differ; where does distinctiveness stop short of significance or valence? | D542-D545, D569-D572 |
| `design/research/evidence-presentation.md` | Which modules help without alarm fatigue or direct move leakage? How do touch, hover, keyboard and mobile differ? | D542, D543, D546 |
| `design/research/theory-knowledge-pipeline.md` | **Answered:** separate builder need survives; Skipper/semantic extraction fails the six-arm gate. Exact+FTS beats semantic recall@5; applicability, abstention, model identity and provenance controls fail. 1.0 candidate is a typed deterministic provenance compiler plus immutable local index. | D557, D564, D579-D581 |
| `design/research/bot-policy.md` | How are strength, repertoire, style, plausible errors, timing and memory independently composed and measured? | D551, D561 |
| `design/research/player-style-metrics.md` | Which descriptive metrics are stable, fun and non-deceptive? Minimum samples and confidence? | D552, D553, D562 |
| hands-on competitor resweep | Same-position/session teardown of Guided Play, Game Review, Beacon, Quackmate, Sensei, ChessLab and Qchess; one loved and hated thing each | D554-D556 |

**Exit:** each dossier has external or hands-on evidence, negative cases and an explicit refusal;
coverage matrix and exploration gates reflect the results.

### 2. Rule the product and evidence boundaries

Owner decisions required after workstream 1:

- integrated breadth: apply D555's ruled adopt/transform/defer discipline to each capability family;
- content gate: accept or amend the exact Gate-F clearance proof (the D560 hold already applies);
- assistance ceilings per session kind and the default preset for each workflow;
- knowledge plane: curated cited retrieval, authored-only theory, or another bounded source model;
- player style: descriptive fun layer, coaching input, both with separation, or defer;
- human play/social/federation: prerequisite, later layer, or external-adapter-first.

**Exit:** every decision is in an intent document or owner-ruling ledger row; no implementer has to
infer product scope from this planning file.

### 3. Evidence compiler and stable pack primitives

RFC candidates only after workstreams 1-2 clear the exploration gate:

1. **Evidence producer/module contract**
   - versioned producers and evidence kinds;
   - sign, subject/object/squares, confidence/exactness, provenance and abstention;
   - counterfactual query contract;
   - declared consumers and latency/disclosure constraints;
   - completeness and non-vacuity checks.
2. **Semantic detector v1**
   - exact tactical/event families selected from detection research;
   - significance/ranking and negative (“avoided”) readings;
   - fixtures plus independent validation corpus.
3. **Knowledge-source contract**
   - allow-list/licence/digest/version;
   - typed deterministic applicability keys and local exact/SQLite-FTS retrieval;
   - citation propagation into evidence packets;
   - fail-closed invalidation and abstention.
4. **Pack capability and migration contract**
   - additive primitive references, capability negotiation and deprecation;
   - migration dry-run/re-authoring report;
   - pilot-corpus acceptance instrument.

**Exit:** Gate F's architecture clauses pass and the manifest can answer both “what powers this
module?” and “where can this evidence appear?” mechanically.

### 4. Guidance UX as modules and presets

Build from the compiler, not directly from engines/classifiers:

- **legal affordance:** touch/hover destinations and accessibility equivalent;
- **keep me safe:** bounded blunder-prevention warning before commit, without naming the move;
- **threat radar:** opponent threats, loose pieces and tactical consequences with sign;
- **structure nudge:** one selected structural change or plan-relevant tension;
- **theory breadcrumb:** opening/structure/principle source with a progressive hint ladder;
- **compare coach:** grounded difference between committed branches;
- **full analysis:** explicit opt-in evidence inspector, not the default learning surface.

Compose them into named intent presets. A learner chooses a workflow, not Stockfish/Maia/classifier
switches. Advanced controls remain secondary. Each preset is capped by session kind and the reveal
window; no preset silently raises assistance.

**Exit:** non-technical usability sessions can start Just Play, Guided Rehearsal, Review/Re-entry
and Coach/Study without configuring evidence sources; each module has an honest abstention state.

### 5. Grounded Review Map and share story

- opening/theory breadcrumb and phase arc;
- small signed set of pivotal moments, human context and semantic facts;
- retry/re-enter/branch/compare/drill action per actionable moment;
- one grounded training focus with confidence;
- compact and expanded social recap templates;
- LLM wording tested against source packet, with deterministic fallback.

**Exit:** review ends in a committed replay path; share output remains true when the external LLM is
disabled; neither view defaults to raw evaluation/move ratings.

### 6. Human-like bots and fun player identity

Bot policy:

- compose base human model, calibrated strength, repertoire, style, error character, timing and
  repeat memory;
- validate output distributions and human-likeness separately from win rate;
- run blind same-position/session comparisons against raw Maia and representative competitors;
- keep voice/chat separate from move policy.

Player identity:

- publish a versioned metric registry and eligibility denominators;
- show sample size, uncertainty, contributing games/attempts and profile-version changes;
- keep descriptive style, strength/rating and coaching suggestions separate;
- allow a playful archetype/legend match only as a transparent view over the metrics.

**Exit:** a personality has measurable board behaviour; a player type is reproducible from visible
facts; neither is merely prose.

### 7. Pilot theory and drill packs, then content scale

Before Gate F: create only the minimum sacrificial packs required to exercise detectors, knowledge
retrieval and modules. After Gate F:

- reground the 13 principle entries in cited chess tradition where possible;
- bind existing claims under the feedback-delivery contract;
- graduate a deliberately varied official pilot (opening, middlegame structure, tactics,
  technical endgame, practical defence);
- measure re-authoring cost and amend the primitive contract once, if necessary;
- launch authored waves only after the pilot remains stable.

**Exit:** official content uses the primitives without bespoke client logic, and adding a new
detector does not require editing unrelated packs.

### 8. Breadth after the core is coherent

Sequence only after the individual loop and official pilot work:

- campaign/concept progression using grounded concept credits;
- async coach/classroom roster, assignments and progress;
- streamer/broadcast layouts as composed views, not separate evidence systems;
- optional game-history selectors and cross-site adapters;
- human play, bot tournaments and social events;
- federation/discovery only after trust, identity, moderation and protocol research.

This is a roadmap lane, not a promise that all social infrastructure belongs in the first product.

## Actual RFC state checkpoint

The A0 audit closed four stale implementations, taking the lifecycle-complete archive from 59 to
63. The remaining active set is not complete:

- accepted but incomplete: `teacher-surface`, `graduation-clearance`, `feedback-delivery`;
- returned/draft research or process work includes `measurement-records`, `learner-rating`,
  `assistance-controls`, lifecycle completion, pack provenance and shared registers.

The A1 audit then traced all 21 capability families through production backend, client, real
content/workflow and hands-on proof. Two are proven integrations (the drill loop and native
human-v-human match), fourteen are mechanically present but incomplete as named outcomes, four are
claimed-only and bot tournaments/social events are absent. The prior human-play reality was stale;
the native match already passes pause→branch→resume browser proof. Conversely, the evidence
producer registry's eight free-text surface labels intersect none of the seven canonical client
surface IDs, so the central producer→consumer join remains unimplemented rather than merely
undocumented. R1 and R2 have since landed: six evidence planes, followed by the measured split
between semantic eligibility and local selection/budget. A2 has also landed: the exact-UCI
instrument confirms the shipped interaction floor fails; R3's disposable prototype/mechanical
arms are now complete and participant comprehension remains external. R6 has now landed as a
negative Gate-F result: syntax admission is broad, but capability negotiation, reusable migrations,
owner re-authoring budget and primitive-complete pilot coverage do not exist.

`active-rfc-audit.md` records the code/tests/closeout evidence and legal next action. This remains
a dated checkpoint, not a replacement for `rfc/README.md`.

## First executable queue

The next safe queue is research and reconciliation, not feature implementation. Detailed job
cards and dependencies are in `execution-queue.md`; the current frontier is:

1. prepare R11's matched blind multi-ply review set, then run it with external reviewers;
2. run D554's comparable hands-on work within R3/R7/R8/R11/R15-R17; the targeted forum arm has zero unchecked signals;
3. R3 interaction/participant exit when the board and participant authority are available;
4. R13 grounded coaching aggregation once R7's exact predecessor clears.

R3's mechanical/desk/responsive-prototype arm, R4, R5, R18's mechanical/code/desk arm, the capability-watch instrument/forum sweep and R12's short-session arm are complete. R18 proves the provider-off core but fails the present 1.0 platform floor and makes O13 ready; participant accessibility remains external. The watch closes D556 and D554's targeted desk/forum arm while leaving comparable hands-on inside its consumer studies. R12 supports continuous
literal habit cards but refuses natural archetypes; its longitudinal transfer remains external.
R11's mechanical arm is also complete and
supports a layered bot-policy candidate, but its human-likeness/coherence claim remains external.
R3 remains external for real interaction and
nontechnical-player comprehension, so it does not yet unlock defaults, R7 or R8.

Presentation, Review Map, campaign and professional/social research are all on the queue, but
behind named predecessors. Owner rulings and RFC drafting begin only after
their corresponding research exit criteria pass.

Campaign, broad content production, federation and new all-in-one navigation stay off the executable
queue until their dependencies above are resolved.
