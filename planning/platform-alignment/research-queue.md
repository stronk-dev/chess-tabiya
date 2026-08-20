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
| A2 | **DONE 2026-08-20** | **Interaction-state defect recheck.** Reproduced D537–D540 after selection, click, drag, touch, hover and resize over all six endgame packs × five viewports. The clean-tree harness verifies legality/orientation, source hit state, live coordinates and exact submitted UCI. | `design/research/interaction-state-correctness.md`; 4/90 live gestures exact, 15 wrong, 71 none; stale-coordinate success is a negative control, resize recovers 24/24 desktop/tablet cells, and compact phone exposes separate D573 source occlusion. K9 evidence updated without probe/bug cancellation. | R3 disposable prototypes; honest guided-board/mobile studies. |

## Wave 1 — evidence foundation

These can run in parallel after A1 identifies the exact symbols and fixtures.

| ID | Status | Research deliverable | Method and population | Exit criterion | Unlocks |
|---|---|---|---|---|---|
| R1 | **DONE 2026-08-20** | **Detection landscape** — `design/research/detection-landscape.md` | Taxonomized exact-board, transition, search/engine, human-corpus, theory-catalogue and authored evidence. The disposable harness replayed 50,000 Lichess puzzles, legal alternatives and 250 file mirrors for four candidate tactics; hard-negative IDs and source digests are committed. | Six-plane model and candidate decision tables name sign, operands, grounding, exactness, abstention, cost and consumer/refusal. Cheap geometry was refused as a semantic label; Lichess was retained as an incomplete disagreement corpus. R2 has now completed the downstream admission test. | R2; detector-semantics decision; evidence contract and semantic-detector RFCs. |
| R2 | **DONE 2026-08-20** | **Selection, sign and significance** — `design/research/selection-sign-and-significance.md` | Compared every legal alternative for 754 authored and 579 stratified imported-game decisions; measured gained/lost/preserved/avoided relations, old top-k transfer, local admission, cap sensitivity and rare-event retention. Reconciled the already-refuted conjunction arm. | The predeclared local rule cut raw volume about 11× and reached 93%+ counterfactual specificity on both populations while retaining 108/108 rare rules events. It also selected semantically trivial families, so rarity was refused as significance. Two gates are required: semantic eligibility, then local selection/budget; sign never supplies valence. | O2–O3 narrow rulings; R3 modules; R12 metrics protocol; evidence compiler research input. |
| R3 | **MECHANICAL/DESK DONE 2026-08-20; EXTERNAL to complete** | **Evidence presentation** — `design/research/evidence-presentation.md` | Source/corpus audit measured 54 primary controls and a one-square tail of 11 captions/19 marks; the board and LLM paths both bypass R2. Eight disposable module contracts passed zero/one/many, abstention, disclosure, consumer and move/PV-leakage tests. Competitor, tutoring and accessibility sources narrowed the participant protocol. The shipped board is not a valid interaction baseline while D537/D573 remain. | Completion still requires desktop/tablet/phone gesture-state runs and non-technical participants to start named workflows without source settings and provide comprehension/noise evidence; default/preset candidates are then supported or refused. | Assistance/product-default decision and guidance RFC. |
| R4 | DONE | **Theory knowledge pipeline** — `theory-knowledge-pipeline.md` plus six-arm experiment | Built a 17-row licensed source register, 55-passage corpus and 144-query fixed gold set; ran exact, FTS, vector, filtered hybrid, reranked and Skipper-contextual arms plus invalidation/provenance and exact-vector controls. | **Negative exit met:** semantic retrieval/extraction refused for 1.0. Exact+FTS 97.7% recall@5 vs semantic 94.7%; semantic safety/abstention and artifact controls fail. Runtime candidate is independent deterministic provenance compiler + typed local index. | O5 remains blocked by R8; R18's rights/ops edge is complete. |
| R5 | **DONE 2026-08-20** | **LLM renderer contract and evaluation** — `design/research/llm-renderer-contract.md` | Sixteen fixed cases compared deterministic, current-sentence and typed seams across two hosted snapshots plus a 360M local model. Deterministic passed; one hosted sentence arm passed the pinned run, the other falsely abstained; both typed hosted arms lost citations despite valid schema/IDs; local typed failed 15/16. | 1.0 boundary settled: deterministic is normative/self-host fallback; LLM is optional post-selection style only, with conformance gating and deterministic provenance/disclosure/forms. Reliability promotion and learner comprehension remain downstream validation, not selector authority. | Narrows F5/voice; O4 now waits on R3 only. |
| R6 | **DONE 2026-08-20 — Gate F result FAIL** | **Pack primitive stability and migration cost** — `design/research/pack-primitive-stability.md` | Audited 27 schema mutations bidirectionally over 92 current documents; measured co-change populations, primitive use, version stamps and mechanical-vs-judgment migrations. The result specifies the required stable model but finds no migration ladder, no pack capability stamp, a semantic false green, an active 0.28 claim and four zero-witness families. | Research exit is a negative gate result: compatibility matrix, exposure budget and extension/deprecation requirements exist; current pilot coverage and lane clearance do not. Gate F/D560 stay closed pending O6/F1/F3 and a sacrificial pilot. | Narrows O6/F3; does **not** unlock an RFC or content release. |

## Wave 2 — learner loop and review

| ID | Status | Research deliverable | Method and population | Exit criterion | Unlocks |
|---|---|---|---|---|---|
| R7 | BLOCKED by R1–R3 | **Grounded Review Map and social recap** | Hands-on teardown of Chess.com review, Lichess analysis/learn-from-mistakes, Beacon/Quackmate re-entry and current Tabiya story. Prototype the same games through signed moments, theory links and replay doors. Test useful-summary recall and action choice, not aesthetic preference alone. | A bounded moment selector and recap beat raw evaluation/list presentation; every actionable moment has a legal replay/branch/drill path; social output stays grounded with LLM off. | Review/recap decision and RFC. |
| R8 | BLOCKED by R3 | **Theory-to-drill and drill-to-theory learning workflow** | Trace how opening explorer, theory passages, motifs, shapes, claims, branches and packs join. Test lookup→rehearse and review→rehearse workflows against passive reading and engine-PV viewing. Include transpositions and “no relevant pack” abstention. | A learner can move between cited explanation and a consequence-playing exercise without authors duplicating the same truth in multiple stores. | Theory/library/content architecture decision. R1/R2/R4 inputs complete. |
| R9 | EXTERNAL | **Target learner/coach workflow study** (Q1b/Q9) | Structured interviews plus task-based concept tests: Just Play, guided rehearsal, Review Map, drill/theory lookup, return/progress and assistance presets. Recruit novice/intermediate learners and coaches separately; include 2/4/8 branch comprehension. | Repeated problem evidence and workflow comprehension; failures name a narrower default or scope cut. Re-gates public push even though personal OSS work may continue. | Navigation/defaults; coach scope; E2/Q9 update. |
| R10 | BLOCKED by a playable pilot and R3/R8 | **Learning effect** (Q1c, H1–H4) | Run preregistered opening continuation, branch comparison, whole-segment replay and outcome-drilling comparisons, including delayed related-position transfer. | H1–H4 and C2–C4 receive evidence; 1.0 claims are narrowed if rehearsal does not beat simpler formats. | Public learning claims and scale priority. |

## Wave 3 — bots, profiles and progression

| ID | Status | Research deliverable | Method and population | Exit criterion | Unlocks |
|---|---|---|---|---|---|
| R11 | **MECHANICAL DONE 2026-08-20; EXTERNAL to complete** | **Bot policy and human-likeness** — `design/research/bot-policy.md` | Reproduced sampling, bounded-error, trait, statistical-book and repeat transforms over 837 fixed position-band cells. The corrected production-sampler control matches captured production; guard 250 and pawn ×4 pass their mechanical gates. Blinded 10–20-ply review remains required for plan coherence, plausible errors and human-likeness. | Mechanical retention is narrowed; H5/C5 remain unmet until ≥80% of blinded branches are acceptable. “Personality” that only changes prose remains refused. | O8/F8 stay blocked by the external multi-ply arm; research artifacts are ready to generate its blind review set. |
| R12 | **SHORT-SESSION ARM DONE 2026-08-20; longitudinal/cross-time-control transfer external; production still needs O2/O9/R13** | **Player-style and longitudinal metrics** — `design/research/player-style-metrics.md` | 36 accounts × 200 blitz games; exact opportunity denominators, persistent sample floors, game bootstrap, rating leakage, re-identification and cluster stability measured. Twelve literal habits retain; forcing/capture/reply-breadth/fianchetto-unblock refuse. | Individual signature passes (97.2%); no archetype k=4–12 passes. Continuous habit cards can enter O9; advice and production minima cannot. | Profile/progression decision and R13; privacy result feeds R18. |
| R13 | BLOCKED by R7; R12 done | **Grounded coaching aggregation** | Test whether registered event aggregates support useful recurring-pattern summaries and pack selection without turning correlation into diagnosis. Compare deterministic explanation to LLM rendering. | Each tip cites its observation population, confidence and replay/drill action; unsupported “weakness” language is refused. | Longitudinal coaching module. |
| R14 | READY in part; experiential arms BLOCKED | **Campaign closure** — existing `planning/campaign-research-queue.md` | Correct that queue's stale session premise, then run R6 rewind-budget, R7 assistance-scarcity and R8 “is the loop worth wrapping?” in a real playable session. Reconcile prior refutations of primitive conjunctions and universal difficulty. | Campaign R6–R8 answered and `design/06-campaign.md` either survives, narrows or is returned for amendment before any campaign RFC. | Campaign/progression RFC or explicit deferral. |

## Wave 4 — professional, social and platform breadth

| ID | Status | Research deliverable | Method and population | Exit criterion | Unlocks |
|---|---|---|---|---|---|
| R15 | BLOCKED by R3/R7; participant arm EXTERNAL | **Teacher/coach workflow** | Audit accepted `teacher-surface` against actual coach jobs: assign, observe, annotate, reveal, compare, return and privacy. Test async and live workflows; distinguish teacher authority from engine assistance. | A minimum coherent coach workflow, permission model and default view are demonstrated; otherwise accepted RFC is amended rather than mechanically shipped. | Teacher implementation/amendment. |
| R16 | BLOCKED by R3/R7 | **Streamer/broadcast mode** | Teardown live chess teaching/broadcast tools and test composed views for host, participant and spectator. Measure disclosure delay, chat/vote usefulness, moderation and accidental assistance leakage. | Named audience views can be composed from shared run/evidence modules with no separate truth path; underspecified features are refused or scoped. | Streamer/live RFC amendment. |
| R17 | BLOCKED by R11/R15; external service tests may be needed | **Human play, bot tournaments and social trust** | Compare native play, Lichess/Arena handoff and adapters on identity, clocks, fair-play boundaries, rematch/tournament flow, moderation, persistence and self-host cost. | Owner receives a costed native/adaptor/defer choice; no “one-stop platform” claim rests on a link that drops the learning context. | Human-play/tournament scope decision. |
| R18 | **MECHANICAL/CODE/DESK DONE 2026-08-20; participant accessibility external** | **Self-host, privacy, accessibility and rights inventory** — `design/research/release-platform-audit.md` | Clean provider-off and engine-on deployments, live Maia-loss injection, data deletion/export probes, built-image package/content census and Chromium AX/keyboard/responsive probes. Core rehearsal needs no cloud secret, but 1.0 fails on portable export/deletion, backup/update recovery, provider-health honesty, keyboard/assistive move entry, Tab traversal and distributed rights. | Internal exit met negatively; physical-device and screen-reader participant claims remain external and rerun against F12. | O13 is READY; F12 is not cleared. |
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

The safe research frontier is now the capability watch and preparation of R11's blind
review set. R3's mechanical/desk arm is done but its interaction/participant exit remains external;
R4 and R5 are done; R11 is mechanical-done/external; R8 waits on R3's remaining exit.
R3 and R9 need owner-authorised participants to satisfy their final exits. Scale content, product
RFC drafting and feature implementation remain outside this queue.
