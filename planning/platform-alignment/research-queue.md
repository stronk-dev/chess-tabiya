# Platform alignment — authoritative research queue

**Opened:** 2026-08-20

**Authority:** D563 owner sequencing ruling

**Status:** research and read-only reconciliation only; no product RFC or implementation authority

This is the bottom-up queue for the integrated 1.0 program. It does not replace
`planning/exploration/plan.md`, the campaign queue, or the research coverage matrix. It joins them
so an attractive feature cannot jump over an unanswered question.

The `A*` and `R*` identifiers in this directory are alignment-program-local. References to
campaign R6–R8 are always written as “campaign R6–R8” to avoid confusing the two ledgers.

## Status and admission rules

- `READY`: the question, method, population and exit criterion are specific enough to run.
- `EXTERNAL`: the instrument can be prepared, but completion needs users, coaches or a service the
  owner has not placed in scope.
- `BLOCKED`: a named predecessor must land first.
- `DONE`: a dossier has landed, its coverage row and relevant gates were updated, and the
  exploration log records what changed.

A dossier is not complete because it collected examples. It must state the population, negative
case, abstention/failure result, and which design choice the result permits or refuses. Hands-on
product claims are `[V]`; vendor/forum descriptions remain `[P]`.

## Wave 0 — establish truth before adding work

| ID | Status | Question / method | Exit criterion | Unlocks |
|---|---|---|---|---|
| A0 | **DONE 2026-08-20** | **Active-RFC truth audit.** Re-ran each active RFC's criteria against code, tests, ledger, log and claimed shared-resource lane. The unrelated dirty feedback-delivery work was excluded through a clean committed-tree extraction. | `active-rfc-audit.md`; four verified implementations archived, three accepted documents remain unbuilt/in-flight, six remain draft/returned, and each has one legal next action. | Accurate RFC graph; Gate F clauses 1–2. |
| A1 | **DONE 2026-08-20** | **Capability reality audit.** Traced all 21 families through backend/producer, client, real content/workflow and current hands-on proof, excluding uncommitted feedback-delivery work. | `capability-reality-audit.md`; 2 proven, 14 mechanically present, 4 claimed-only, 1 absent. Found eight producer surface labels with zero overlap with seven canonical client IDs, and corrected native human play from “not established” to proven integration. | R1, R2, R5, R6; exact reuse inventory for every later lane. |
| A2 | READY | **Interaction-state defect recheck.** Reproduce D537–D540 after select/touch/hover/resize, not only at rest; repair the measurement instrument only, not product code. | The harness independently verifies the intended square and legal move after every gesture; K9 evidence updated without probe/bug cancellation. | Honest guided-board and mobile studies. |

## Wave 1 — evidence foundation

These can run in parallel after A1 identifies the exact symbols and fixtures.

| ID | Status | Research deliverable | Method and population | Exit criterion | Unlocks |
|---|---|---|---|---|---|
| R1 | **READY** | **Detection landscape** — `design/research/detection-landscape.md` | Taxonomize exact-board, transition, search/engine, human-corpus, theory-catalogue and authored evidence. Implement disposable probes for candidate tactics/events; test positive, mirrored, hard-negative and counterfactual examples against external labelled sets where available. Include multi-ply threats and explicit “cannot know” cases. | Each candidate has sign, operands/squares, grounding family, exactness/confidence, abstention, cost, precision/coverage by population, and a named consumer or refusal. No detector enters v1 on anecdote alone. | Detector-semantics decision; evidence contract and semantic-detector RFCs. |
| R2 | **READY** | **Selection, sign and significance** — extend/reconcile the D542–D545 measurements | Evaluate played-vs-legal-alternative lift, avoided/removed/preserved events, eligibility denominators and top-k/budget selectors on current packs plus imported games. Compare rare single facts against conjunctions; do not use firing frequency as usefulness. | Predeclared relevance rules beat the shipped raw reading on precision/noise without erasing critical low-frequency events; abstention and negative readings are specified. | Evidence compiler; Review Map; hints; player metrics. |
| R3 | BLOCKED by A2 | **Evidence presentation** — `design/research/evidence-presentation.md` | Disposable prototypes for touch/hover/keyboard, pre-commit nudge, post-commit explanation, compare, theory breadcrumb and explicit full-analysis inspector. Test one/two/zero selected facts on desktop, tablet and phone; include alarm-fatigue, accidental leakage and accessibility tasks. | Non-technical participants can start a named workflow without source settings; each module has comprehension, leakage, noise and abstention results; default/preset candidates are supported or refused. | Assistance/product-default decision and guidance RFC. |
| R4 | READY | **Theory knowledge pipeline** — existing `theory-knowledge-pipeline.md` and six-arm experiment | Build a licensed source register and adjudicated chess query set. Compare exact chess keys, FTS, embeddings, hybrid retrieval, reranking and Skipper-backed research instrumentation. Measure citation-span agreement, recall, dangerous false matches, abstention and rebuild reproducibility. | A retrieval arm clears every preregistered safety/quality gate and materially beats the simpler baseline, or semantic retrieval/extraction is refused. Runtime bundle contract is described independently of Frameworks/Skipper. | Knowledge-plane decision and possible source/bundle RFC. |
| R5 | **READY** | **LLM renderer contract and evaluation** | Feed fixed evidence packets at each disclosure rung to deterministic fallback, local model and bounded external model. Adversarially test invented chess claims, added squares/moves, source loss, contradictory evidence, prompt injection from source text, verbosity and paraphrase drift. | The renderer preserves facts/citations and rung boundaries at an owner-set error budget; otherwise deterministic templates remain the 1.0 default. LLM is never the selector or grader. | Voice/rendering RFC; deployment defaults. |
| R6 | **READY** | **Pack primitive stability and migration cost** | Derive schema/resource changes, dead vocabulary, capability use and pack rewrites across git history; run read-only migration/dry-run over every pack and sidecar; classify mechanical vs chess-judgment edits. Exercise every proposed v1 primitive in a sacrificial pilot only. | Stable extension/deprecation model, compatibility matrix, measured re-authoring budget and pilot coverage exist. No unresolved active schema lane. | Gate F; pack-capability/migration RFC; content release. |

## Wave 2 — learner loop and review

| ID | Status | Research deliverable | Method and population | Exit criterion | Unlocks |
|---|---|---|---|---|---|
| R7 | BLOCKED by R1–R3 | **Grounded Review Map and social recap** | Hands-on teardown of Chess.com review, Lichess analysis/learn-from-mistakes, Beacon/Quackmate re-entry and current Tabiya story. Prototype the same games through signed moments, theory links and replay doors. Test useful-summary recall and action choice, not aesthetic preference alone. | A bounded moment selector and recap beat raw evaluation/list presentation; every actionable moment has a legal replay/branch/drill path; social output stays grounded with LLM off. | Review/recap decision and RFC. |
| R8 | BLOCKED by R1–R4 | **Theory-to-drill and drill-to-theory learning workflow** | Trace how opening explorer, theory passages, motifs, shapes, claims, branches and packs join. Test lookup→rehearse and review→rehearse workflows against passive reading and engine-PV viewing. Include transpositions and “no relevant pack” abstention. | A learner can move between cited explanation and a consequence-playing exercise without authors duplicating the same truth in multiple stores. | Theory/library/content architecture decision. |
| R9 | EXTERNAL | **Target learner/coach workflow study** (Q1b/Q9) | Structured interviews plus task-based concept tests: Just Play, guided rehearsal, Review Map, drill/theory lookup, return/progress and assistance presets. Recruit novice/intermediate learners and coaches separately; include 2/4/8 branch comprehension. | Repeated problem evidence and workflow comprehension; failures name a narrower default or scope cut. Re-gates public push even though personal OSS work may continue. | Navigation/defaults; coach scope; E2/Q9 update. |
| R10 | BLOCKED by a playable pilot and R3/R8 | **Learning effect** (Q1c, H1–H4) | Run preregistered opening continuation, branch comparison, whole-segment replay and outcome-drilling comparisons, including delayed related-position transfer. | H1–H4 and C2–C4 receive evidence; 1.0 claims are narrowed if rehearsal does not beat simpler formats. | Public learning claims and scale priority. |

## Wave 3 — bots, profiles and progression

| ID | Status | Research deliverable | Method and population | Exit criterion | Unlocks |
|---|---|---|---|---|---|
| R11 | READY | **Bot policy and human-likeness** — `design/research/bot-policy.md` | Reproduce competitor techniques and compare raw Maia, Maia variants, repertoire constraints, candidate filtering, style policies, plausible-error guards and time models on identical positions/seeds. Blind reviewers to policy; separately measure strength, human move likelihood, plan coherence, repetition and trait expression. | Each retained layer changes its declared observable without silently moving calibrated strength beyond budget; H5/C5 updated. “Personality” that only changes prose is refused. | Bot-policy decision/RFC and bot tournaments. |
| R12 | BLOCKED by R1–R2 | **Player-style and longitudinal metrics** — `design/research/player-style-metrics.md` | Define eligible decisions, denominators, reference populations, stability windows and confidence for opening/phase/tactical/structural/time habits. Backtest across game subsets and versions; compare transparent dimensions to archetype/vendor claims. | Retained metrics are reproducible, stable enough at a stated sample, inspectable to contributing events and explicitly separate from strength and advice. | Profile/progression decision and RFC. |
| R13 | BLOCKED by R12 and R7 | **Grounded coaching aggregation** | Test whether registered event aggregates support useful recurring-pattern summaries and pack selection without turning correlation into diagnosis. Compare deterministic explanation to LLM rendering. | Each tip cites its observation population, confidence and replay/drill action; unsupported “weakness” language is refused. | Longitudinal coaching module. |
| R14 | READY in part; experiential arms BLOCKED | **Campaign closure** — existing `planning/campaign-research-queue.md` | Correct that queue's stale session premise, then run R6 rewind-budget, R7 assistance-scarcity and R8 “is the loop worth wrapping?” in a real playable session. Reconcile prior refutations of primitive conjunctions and universal difficulty. | Campaign R6–R8 answered and `design/06-campaign.md` either survives, narrows or is returned for amendment before any campaign RFC. | Campaign/progression RFC or explicit deferral. |

## Wave 4 — professional, social and platform breadth

| ID | Status | Research deliverable | Method and population | Exit criterion | Unlocks |
|---|---|---|---|---|---|
| R15 | BLOCKED by R3/R7; participant arm EXTERNAL | **Teacher/coach workflow** | Audit accepted `teacher-surface` against actual coach jobs: assign, observe, annotate, reveal, compare, return and privacy. Test async and live workflows; distinguish teacher authority from engine assistance. | A minimum coherent coach workflow, permission model and default view are demonstrated; otherwise accepted RFC is amended rather than mechanically shipped. | Teacher implementation/amendment. |
| R16 | BLOCKED by R3/R7 | **Streamer/broadcast mode** | Teardown live chess teaching/broadcast tools and test composed views for host, participant and spectator. Measure disclosure delay, chat/vote usefulness, moderation and accidental assistance leakage. | Named audience views can be composed from shared run/evidence modules with no separate truth path; underspecified features are refused or scoped. | Streamer/live RFC amendment. |
| R17 | BLOCKED by R11/R15; external service tests may be needed | **Human play, bot tournaments and social trust** | Compare native play, Lichess/Arena handoff and adapters on identity, clocks, fair-play boundaries, rematch/tournament flow, moderation, persistence and self-host cost. | Owner receives a costed native/adaptor/defer choice; no “one-stop platform” claim rests on a link that drops the learning context. | Human-play/tournament scope decision. |
| R18 | READY | **Self-host, privacy, accessibility and rights inventory** | Audit dependency/model/content licences; default deployment with engines/LLM/knowledge builder off and on; data export/delete; phone/tablet/keyboard/screen-reader flows; resource budgets and failure modes. | Reproducible single-host install and documented provider-off fallback; rights/provenance gaps named; accessibility/mobile floors measured; no required cloud secret for core rehearsal. | Release/platform RFCs and 1.0 definition. |
| R19 | BLOCKED by R17 | **Federation/discovery protocol** | Research only if native multi-user play/community survives R17. Compare existing open protocols and moderation/identity costs before designing a new one. | Adopt an existing bounded protocol, define a justified minimal extension, or defer. | Post-1.0 unless owner explicitly promotes it. |

## Cross-cutting capability watch

Competitor monitoring is not a one-off “all apps” list. Maintain a dated register keyed by
capability: canonical product URL, evidence quality, what users love/hate, hands-on state,
thesis-compatible transformation, evidence producers required, current Tabiya consumer, and
adopt/transform/defer decision. New products enter only when they add evidence or a novel
capability; clones do not create duplicate roadmap work.

R1, R3, R7, R11, R12 and R15–R17 each own their relevant hands-on teardown. The cross-cutting
watch owns discovery and routing, not conclusions.

## What is executable now

The safe research frontier is now A2, R1, R2, R4, R5, R6, R11 and R18. R9 can prepare its
protocol but needs owner-authorised participants. Scale content, product RFC drafting and feature
implementation remain outside this queue.
