# Research → execution: the complete join

**Date:** 2026-08-23. **Author:** claude, on the owner's finding that *research keeps getting done
and never becomes an RFC*. **Scope:** every dossier in `design/research/`, joined against
`rfc/` (active + `rfc/archive/` + `rfc/withdrawn/`), `docs/`, `planning/`, and
`design/BACKLOG.md`.

**This is a register, not an intent document** (law 5): it records what exists and what points at
it. It proposes nothing and rules nothing.

## Method and scope

- **Corpus.** `design/research/` holds **111 `.md` files** at the time of writing, of which two are
  infrastructure rather than dossiers: `README.md` (the coverage matrix) and `source-index.md` (the
  living R46+ source register). Two non-`.md` artifacts are dossier-equivalent registers and are
  joined here: `capability-watch.json` and `competitor-matrix.csv`. That gives the owner's **110**
  exactly, plus `monotone-bot-route-controller.md`, which landed mid-pass in `f4d9be1` and is
  carried as row 111.
- **Citation test.** For each dossier, two greps across `rfc/`: the precise path form
  (`design/research/<file>`) and the bare filename form (`` `<file>` ``, which
  `rfc/breadth-collectors.md:13-15` and `rfc/tactical-collectors.md:994-996` both use for research
  lists). A hit in either counts as *cited*. Bare-stem matching is suppressed for the five dossiers
  whose stem collides with an RFC basename (`bot-policy`, `claim-semantic-anchors`,
  `runtime-opening-identity`, and the two register files), where only the precise form is trusted.
- **Execution state.** Assigned from the citing RFC's lifecycle token in `rfc/README.md`:
  - **SHIPPED** — cited by an RFC in `rfc/archive/` (status `implemented`/`superseded`).
  - **RFC ACCEPTED** — cited by an active RFC at `accepted`, `implementing`, or `awaiting`.
  - **RFC DRAFTED** — cited only by an active RFC at `draft`.
  - **LANE OPENED** — no RFC cites it, but a planning derivation/plan/handoff/work-order/queue
    document does.
  - **LEDGER ROW ONLY** — no RFC, no lane; a `design/BACKLOG.md` row and/or an append-only log or
    gates mention is the only trace.
  - **NOTHING** — the research exists and nothing anywhere points at the file.
- **Lane vs. mention.** A hit in `planning/exploration/log.md`, `planning/exploration/gates.md`,
  `planning/exploration/plan.md`, `planning/*/log.md`, `planning/traceability-*.md`, or a source
  register is a *record*, not a lane. Only plan/derivation/handoff/work-order/queue documents
  promote a dossier to LANE OPENED. This distinction is the whole point of the exercise: an
  append-only log entry is the closeout the CLAUDE.md log clause requires, not a schedule.

## The counts

| Execution state | Count | Share |
|---|---:|---:|
| SHIPPED (an archived, implemented RFC cites it) | 31 | 28.2% |
| RFC ACCEPTED (active RFC at accepted/implementing/awaiting) | 28 | 25.5% |
| RFC DRAFTED | 2 | 1.8% |
| LANE OPENED (planning doc, no RFC) | 32 | 29.1% |
| LEDGER ROW ONLY | 13 | 11.8% |
| NOTHING | 4 | 3.6% |
| **Total** | **110** | |

**Cited by at least one RFC: 61 of 110 (55.5%). Cited by no RFC in any state: 49 of 110 (44.5%).**

**The number the owner asked for: 31 dossiers concluded that something is worth building and have
no RFC in any state pointing at them.** Under the stricter reading — no RFC exists on the
subject at all, whether or not it cites the dossier — the figure is **29**; the two that have a
subject-matching RFC which simply never cites the research are `live-relay-as-drill-source.md`
(`rfc/live-sources.md`, accepted) and `roguelike-run-design.md` (`rfc/campaign-core.md`,
implementing). §4 enumerates all 31.

**The symmetry finding.** The gap runs both ways. Eight active RFCs cite **zero** research
dossiers in either citation form: `accessible-board-input.md`, `campaign-core.md`,
`graduation-clearance.md`, `live-sources.md`, `measurement-records.md`,
`pack-population-provenance.md`, `theming.md`, and `0000-rfc-process.md` (process, exempt). Of
those, `graduation-clearance` and `live-sources` are **accepted** and `campaign-core` is
**implementing** — three RFCs building product with no research citation in the document, two of
them on subjects where a landed dossier exists.

---

## 1. The join — all 111 dossiers

Columns: **Subject** (one line) · **Verdict** (one line) · **State** · **Scheduled to build?**
(yes/no + evidence) · **RFC cite?** (which RFC names the file, or `none`).

| # | Dossier | Subject | Verdict | State | Scheduled? | RFC cite? |
|---:|---|---|---|---|---|---|
| 1 | `adoption-audit.md` | Every loved competitor feature vs. what we ship | Synthesis of all teardowns into a mining list; ledger-row proposals in §7 | SHIPPED | yes — `adoption-wave-1` implemented | `archive/adoption-wave-1`, `archive/open-answer-grading`, `archive/repertoire-gap-finding`, `archive/runtime-corpus-evidence`, `archive/social-match` |
| 2 | `assistance-surface-taxonomy.md` | Seven-axis abstraction space for assistance affordances | Seven axes suffice across 14 products; our coverage mapped | RFC ACCEPTED | yes — `move-quality-grades` implementing | `move-quality-grades`, `intent-presets`, `learner-modules` |
| 3 | `authored-transitions-and-features.md` | Q4a/Q4b/E3 — do authors declare boundaries and timing? | Split: boundaries yes (32/35 packs), timing windows declared zero times | SHIPPED | yes — `predicate-wave-3`, `tempo-vocabulary` implemented | `archive/predicate-wave-3`, `archive/tempo-vocabulary` |
| 4 | `authoring-vocabulary-completeness.md` | Can the vocabulary express what packs say; is the engine referenceable? | Yes for structure, no for tempo, engine barely referenceable | SHIPPED | yes — `engine-leverage`, `vocabulary-wiring` implemented | `archive/engine-leverage`, `archive/format-surface`, `archive/vocabulary-wiring` |
| 5 | `band-flattery-and-buried-value.md` | Two r/chess accusations turned on our own surfaces | We don't flatter — structurally, not by discipline; no learner rating exists | RFC ACCEPTED | yes — `learner-rating` implementing | `archive/assistance-controls`, `learner-rating` |
| 6 | `basic-semantic-tactics-stage-0.md` | Overload/deflection/interference/clearance as Stage-0 semantics | Basic 1.0 semantics, not enrichment; 3–5 ply median horizon on 250k puzzles | RFC ACCEPTED | yes — `semantic-collectors` implementing, `review-evidence-compiler` draft | `review-evidence-compiler`, `semantic-collectors`, `tactical-collectors` |
| 7 | `bestline-is-not-hint-distance.md` | Can a Stockfish bestline derive D1061's four-step hint distance? | Collection works (256/256 legal PVs); bestline alone cannot derive the axis | LANE OPENED | no RFC — `planning/evidence-foundation-ux/d1061-bestline-distance-plan.md` | none |
| 8 | `bot-candidate-sharpness.md` | Does engine-priced choice breadth predict human error? | D816 survives as choice breadth (Spearman 0.52–0.56); D817 fails | LANE OPENED | no RFC — `planning/platform-alignment/bot-policy/o8-handoff.md` | none |
| 9 | `bot-policy.md` | Which bot-policy layers change behaviour without moving strength | Bot policy is a seven-layer stack, not a personality slider; 3 layers mechanical | RFC ACCEPTED | yes — `rfc/bot-policy.md` implementing | `bot-policy` |
| 10 | `bounded-policy-targets.md` | Named-target removal/return under bounded policies | Yes, as several typed facts with different authorities — not one "prophylaxis" detector | LANE OPENED | no RFC — `planning/evidence-foundation-ux/d1023-bounded-policy-plan.md` | none |
| 11 | `bounded-reply-semantics.md` | Does complete one-reply enumeration support "forcing" language? | Cheap and useful, but mostly *rejects* stronger tactical language | RFC ACCEPTED | yes — `breadth-collectors` awaiting, `tactical-collectors` awaiting | `breadth-collectors`, `tactical-collectors` |
| 12 | `broadcast-and-teacher-surfaces.md` | The two B5 surfaces nobody researched | `session.kind` is decorative; `permittedAssistance` declares `sessionKind` and never reads it | SHIPPED | yes — `teacher-surface`, `live-surface-honesty` implemented | `archive/live-surface-honesty`, `archive/teacher-surface` |
| 13 | `campaign-effect-vocabulary.md` | What an unlock/reward/modifier can actually BE, counted | Authored synergy ships (96 signatures); emergent synergy supported and unmeasured | SHIPPED | yes — `dead-vocabulary`, `format-surface` implemented | `archive/dead-vocabulary`, `archive/format-surface` |
| 14 | `campaign-intermediate-consequence.md` | What a campaign stake can be when nothing may be priced | The seal is a record; `sealedState` ships and validates | RFC ACCEPTED | yes — `learner-rating` implementing | `learner-rating` |
| 15 | `capability-watch.json` | Capability-first competitor register (19 capabilities, 22 products) | Machine-readable register replacing the 63-product matrix as the watch instrument | LANE OPENED | no RFC — `planning/platform-alignment/capability-watch/plan.md` | none |
| 16 | `capability-watch.md` | D554–D556: how a fast-moving field improves the roadmap | Use the capability-first register; covers 17 of 21 families in the 1.0 map | LEDGER ROW ONLY | no — `design/BACKLOG.md` D554 only | none |
| 17 | `census-hint-false-positives.md` | R3 — false-positive rate of a census-only hint | 89.0% false-positive rate at observation level; catastrophic for 4 of 6 leaves | SHIPPED | yes — `expression-census`, `live-marker-quality` implemented | `archive/expression-census`, `archive/live-marker-quality` |
| 18 | `chessable-movetrainer.md` | MoveTrainer mechanics, appeal, and the mining list | Owner ask answered: what makes Chessable appealing, mapped to drill-pack features | LEDGER ROW ONLY | no — one BACKLOG mention, no lane | none |
| 19 | `claim-semantic-anchors.md` | What a claim binding must prove beyond text identity | The current contract proves where a token came from, not what proposition it expresses | RFC DRAFTED | partly — `rfc/claim-semantic-anchors.md` draft 2026-08-23 | `claim-semantic-anchors` |
| 20 | `classifier-coverage-and-noise.md` | What the game-state classifier detects and where noise lives | Compare strip fires on 99.87% of transitions at lift 1.003× — non-selective | RFC ACCEPTED | yes — `move-quality-grades`, `tactical-collectors` | `move-quality-grades`, `tactical-collectors` |
| 21 | `coaching-versus-cheating-and-the-band-curve.md` | The coaching/cheating criterion and the 1000→2000 curve | Neither shipped axis expresses the line; it is a third axis (decision resolution) | RFC ACCEPTED | yes — `learner-rating` implementing | `learner-rating` |
| 22 | `competitor-love-hate-sweep.md` | Targeted love/hate sweep over the capability watch | 38 of 58 love/hate cells have evidence; 20 remain explicit `not_found` | LEDGER ROW ONLY | no — log/gates mentions only | none |
| 23 | `competitor-matrix.csv` | Living 63-product feature matrix | Register, superseded as *watch* instrument by `capability-watch.json` | LANE OPENED | no RFC — `planning/platform-alignment/capability-watch/plan.md` | none |
| 24 | `competitor-play-ux.md` | Screen anatomy and pattern language across competitors | Our screen and the canvas draft located against Lichess/chess.com primary sources | RFC ACCEPTED | yes — `play-composition` implementing | `play-composition` |
| 25 | `competitor-value-props.md` | Adopt / conflict / ignore across the competitor set | Desk synthesis of the archive's `[P]` corpus into three dispositions | LEDGER ROW ONLY | no — breadth notes + log only | none |
| 26 | `conjunction-hypothesis.md` | R11 — does two of anything beat one of something? | **Refuted** — conjunctions are worse on all three axes of R3's gate | LANE OPENED | n/a — refusal, nothing to build | none |
| 27 | `coverage-gap-sweep.md` | Who does each of our surfaces best, and does the matrix know them? | Gap census; cluster shelves identified, matrix found incomplete | LEDGER ROW ONLY | no — log mention only | none |
| 28 | `coverage-sweep-2-notability.md` | Second sweep, by notability rather than feature cluster | Whole-platform census; picks #3–#5 routed to quick passes | LEDGER ROW ONLY | no — log mention only | none |
| 29 | `decomposed-king-state.md` | Is king-safety one signal or several? | Must remain decomposed and phase-aware; two headline signals are simpler joins | RFC ACCEPTED | yes — `breadth-collectors`, `tactical-collectors` awaiting | `breadth-collectors`, `tactical-collectors` |
| 30 | `detection-landscape.md` | Atomic chess facts, semantic events, and their evidence planes | Cheap detectors measured against 194k puzzles; precision 7.9–46.6% | SHIPPED | yes — `semantic-evidence-selection` implemented | `archive/semantic-evidence-selection` |
| 31 | `detector-semantic-conformance.md` | Do matcher, reader and consumer form one contract? | No — 11/18 structural families round-trip; all 6 transition families lossy | SHIPPED | yes — `evidence-contract-manifest`, `semantic-evidence-selection` implemented | `archive/evidence-contract-manifest`, `archive/semantic-evidence-selection` |
| 32 | `endgame-latency-versus-cet.md` | Endgame latency/usability vs. Chess Endgame Training (K9) | **K9 fires** — on the usability clause, not the speed clause | LANE OPENED | no RFC — `planning/codex-queue.md`; kill-criterion evidence in `gates.md` | none |
| 33 | `engine-layer-capability-audit.md` | What the engine instruments can do vs. what we ask for | Not short of instruments, short of questions; one live regression found | SHIPPED | yes — `engine-leverage` implemented | `archive/engine-leverage` |
| 34 | `evidence-contract-topology.md` | Is there one evidence pool that can power bounded selection? | No shared pool in production; 14 producer paths terminate in 5 different states | SHIPPED | yes — `evidence-contract-manifest` implemented | `archive/evidence-contract-manifest` |
| 35 | `evidence-presentation.md` | From producer dumps to learner-facing modules | The missing object is a learner-facing **module** contract; 54 source controls today | RFC ACCEPTED | yes — `intent-presets`, `learner-modules` | `intent-presets`, `learner-modules` |
| 36 | `famous-game-sources-licensing.md` | Can we build packs from historical master games? | Licence half answered; the **product** question is explicitly left to the owner | LANE OPENED | no RFC — `planning/rfc-drafting-queue.md:473` says *"Cheap once ruled; not draftable before"* | none |
| 37 | `feedback-versus-the-dashboard.md` | Q8 — can feedback beat "Stockfish labels + prose"? | Yes on three axes, no on two; the two failures are ours, not structural | RFC ACCEPTED | yes — `feedback-delivery` accepted | `feedback-delivery` |
| 38 | `finite-state-bot-route-controller.md` | D1078 — can a controller sustain a multi-ply opening route? | **No** — 86.1% fallthrough, 1/12 branches complete against a 70% gate | LANE OPENED | n/a — refusal; `planning/platform-alignment/bot-policy/d1078-route-controller-plan.md` | none |
| 39 | `foundation-capability-closure.md` | Does HEAD provide the primitive foundation the 1.0 vision needs? | Broad — 35 producers / 188 projections / 210 bindings; 17 families still absent | LANE OPENED | no RFC — `planning/evidence-foundation-ux/plan.md` | none |
| 40 | `fun-mechanics-outside-roguelikes.md` | Drip, experimentation, and fun without a power curve | Gloomhaven-style retirement/unlock shapes; §10 poses the open owner question D305 | RFC ACCEPTED | partly — `learner-rating` implementing; `variants/rfc-derivation.md` lane | `learner-rating` |
| 41 | `grounded-coaching-aggregation.md` | R13 — can event aggregates support recurring-pattern cards? | Yes at contract level; no from current production history topology | RFC ACCEPTED | yes — `longitudinal-store` accepted | `longitudinal-store` |
| 42 | `grounded-skills-taxonomy.md` | R20/D549 — the five skill categories as a credit mechanism | Usable navigation vocabulary, **not** a credit mechanism; 0 of 5 candidates production-ready | **NOTHING** | **no** — `research-queue.md:81` has an R20 row that never names the file | none |
| 43 | `human-like-opponents.md` | D810–D812 — what makes engine play non-human | Not the error rate — where the errors sit; weakened engines misplace their errors | RFC ACCEPTED | yes — `bot-policy` implementing | `bot-policy`, `tactical-collectors` |
| 44 | `human-outcome-coverage-depth.md` | R9 — how deep human WDL data goes at our bands | Discriminates, but does not reach the middlegame; the boundary is ply ~20 | LANE OPENED | no RFC — `planning/campaign-research-queue.md` | none |
| 45 | `identity-retaining-mobility.md` | Identity-retaining piece mobility as an evidence family | Mostly background/negative; one mild contextual operand, on-demand only | RFC ACCEPTED | yes — `exact-legal-mobility` accepted 2026-08-23 | `exact-legal-mobility`, `breadth-collectors`, `tactical-collectors` |
| 45b | `identity-retaining-three-edge-consequences.md` | Three-ply defender consequences without manufacturing intent | Yes for exact observed sequences; not yet for named causal tactics | RFC ACCEPTED | yes — `breadth-collectors`, `tactical-collectors` awaiting | `breadth-collectors`, `tactical-collectors` |
| 47 | `integrated-platform-alignment.md` | The whole-platform alignment audit | Ingredients are unusually good; the missing object is an **evidence compiler** | LANE OPENED | no RFC — `planning/platform-alignment/plan.md`, `evidence-rework-brief.md` | none |
| 48 | `interaction-state-correctness.md` | A2/K9 — is the board usable after piece selection? | **No** — authored move delivered in 4 of 90 live gesture cells | LANE OPENED | no RFC — `planning/platform-alignment/research-queue.md`; escalated in `gates.md` | none |
| 49 | `league-as-return-loop.md` | The league (heltour) as a return-loop shape | Organisers removed the commitment question; return is structural, not promissory | RFC ACCEPTED | yes — `learner-rating` implementing | `learner-rating` |
| 50 | `legal-exchange-prerequisite.md` | Legal local exchange (SEE) as a tactical prerequisite | `meaningful_fork` promising (1.96× imported); `moved_piece_en_prise` robustly negative | LANE OPENED | no RFC — `planning/evidence-foundation-ux/plan.md`, `phase2-collector-audit.md` | none |
| 51 | `legal-square-denial.md` | Pawn control vs. legal and locally safe minor destinations | Refuted as a hint — 0.95–1.02× lift, indistinguishable from background | RFC ACCEPTED | yes — `breadth-collectors`, `tactical-collectors` awaiting | `breadth-collectors`, `tactical-collectors` |
| 52 | `live-relay-as-drill-source.md` | Live game and tournament relay as a drill source | Lichess exposes streaming PGN commercially-usable at scale; chess.com does not | LANE OPENED | **no RFC cite** — `planning/live-sources/rfc-derivation.md`; `rfc/live-sources.md` is accepted but cites **zero** research | none |
| 53 | `llm-renderer-contract.md` | What an LLM may and may not do in the evidence path | Useful only *after* a deterministic compiler selects a typed, cited packet | LANE OPENED | no RFC — `planning/platform-alignment/renderer-evaluation/plan.md` | none |
| 54 | `longitudinal-style-feedback-contract.md` | R21/D552 — twelve measured habits as a feedback surface | Closed grounded contract, **zero production-ready metrics** (all 12 blocked) | **NOTHING** | **no** — `research-queue.md:82` has an R21 row that never names the file | none |
| 55 | `maia-band-calibrated-range.md` | R10 — over what `Elo` range is Maia band-calibrated? | Output never stops changing inside `[0,5000]` and never changes outside it | LEDGER ROW ONLY | no — `exploration/plan.md` + `traceability-forward.md` mentions only | none |
| 56 | `maia-band-outcome-transfer.md` | Does Maia's band move the RESULT or only the distribution? | Moves the result — 0.40 Elo per band point, a third of what its units claim | SHIPPED | yes — `opponent-contracts` implemented | `archive/opponent-contracts`, `bot-policy`, `learner-rating` |
| 57 | `maia-endgame-fidelity.md` | D366 — is Maia human-shaped or arbitrary in the endgame? | Human-shaped decisively; **not** band-calibrated — and the second is the problem | SHIPPED | yes — `opponent-contracts` implemented | `archive/opponent-contracts`, `learner-rating`, `bot-policy` |
| 58 | `maia-policy-scalar-stability.md` | R5 — is Maia's policy scalar stable enough to build on? | Yes — bit-stable across 2,100 probes; 105/105 keys byte-identical | SHIPPED | yes — `engine-request-contract`, `fixture-realism` implemented | `archive/engine-request-contract`, `archive/fixture-realism`, `archive/format-surface`, `bot-policy` |
| 59 | `maia-production-band-roster.md` | Which bands the measured ladder licenses for 1.0 | Exactly four rungs: `[1000, 1400, 1800, 2200]`, all intervals disjoint | LANE OPENED | no RFC — `planning/platform-alignment/bot-policy/d970-roster-handoff.md` | none |
| 60 | `maia-wdl-versus-human-outcome.md` | Does Maia's per-move WDL agree with real human outcomes? | Split — real signal where both exist; decays to chance at ply 16–19 | RFC ACCEPTED | yes — `tactical-collectors` awaiting | `tactical-collectors`, `learner-rating` |
| 61 | `mechanics-by-mode.md` | What each mode can actually reach, measured | Not four modes with four mechanic sets — one run surface rendered identically | SHIPPED | yes — `assistance-controls`, `assistance-control-wiring` implemented | `archive/assistance-control-wiring`, `archive/assistance-controls` |
| 62 | `middlegame-evidence-and-style-taxonomy.md` | Middlegame evidence breadth and player-style taxonomy | Phase-2 audit is a sound first wave, not a complete ontology; 7 families absent | RFC ACCEPTED | yes — `breadth-collectors` awaiting | `breadth-collectors` |
| 63 | `mobile-scope.md` | Q3 — scope, tolerate, or non-goal? | Board survives; timeline/branch rail survive degraded behind tabs | SHIPPED | yes — `client-surface-floor` implemented | `archive/client-surface-floor` |
| 64 | `move-primitive-computability.md` | R1 — what is computable across a transition, at what cost | Nine of ten primitives are censuses at 29.06 µs/ply; shipped `structuralDelta` is dead at 1721 µs | SHIPPED | yes — `transition-primitives`, `predicate-wave-3` implemented | `archive/predicate-wave-3`, `archive/transition-primitives`, `archive/branch-set-scale` |
| 65 | `objective-lifecycle-diagnosis.md` | Objective lifecycle vs. authored consequence | An authoring-contract defect, not a feedback-anchor defect; 8 of 50 packs affected | SHIPPED | yes — `authored-consequence-lifecycle` implemented | `archive/authored-consequence-lifecycle` |
| 66 | `pack-authoring-cost.md` | Q7/K10 — what does a drill pack cost to author? | **K10 not firing** — 43.5 min/pack mean; cheapest packs are least grounded | SHIPPED | yes — `deviation-classes` implemented | `archive/deviation-classes` |
| 67 | `pack-primitive-stability.md` | R6 — is the pack foundation stable enough to expand content? | Gate F fails on two clauses, partial on a third | RFC DRAFTED | partly — `pack-capability-contract` draft 2026-08-23 | `pack-capability-contract` |
| 68 | `pawn-conversion-events.md` | Pawn conversion events across authored and human play | Passer-by-capture is robust and high-discrimination; existing-passer advances phase-dependent | RFC ACCEPTED | yes — `breadth-collectors`, `tactical-collectors` awaiting | `breadth-collectors`, `tactical-collectors` |
| 69 | `pawn-lever-and-candidate-timing.md` | What supports the words "lever", "break", "conversion plan" | Status/action/consequence must stay separate; no atom licenses "break now" | RFC ACCEPTED | yes — `breadth-collectors`, `tactical-collectors` awaiting | `breadth-collectors`, `tactical-collectors` |
| 70 | `player-analysis-and-skills.md` | Game review, longitudinal habits, and the progression surface | Competitors' surfaces are engine-grade aggregates with undisclosed cut points | RFC ACCEPTED | yes — `longitudinal-store` accepted | `longitudinal-store` |
| 71 | `player-style-metrics.md` | R12 — which descriptive player metrics are reproducible | Continuous habit profile viable (12/16 metrics pass); natural archetypes are not | LANE OPENED | no RFC — `planning/platform-alignment/player-style/plan.md` | none |
| 72 | `practical-difficulty-outside-tablebase.md` | R4 — can practical difficulty be measured outside ≤7 pieces? | **No** — not as the same measurement; best κ 0.577 against the tablebase classifier | SHIPPED | yes — `resistance-spectrum`, `branch-set-scale` implemented | `archive/branch-set-scale`, `archive/engine-request-contract`, `archive/resistance-spectrum` |
| 73 | `professional-workflow-conformance.md` | Are coach and streamer new evidence modes? | No — two explicit workflow *compositions* over contracts that already ship | LANE OPENED | no RFC — `planning/platform-alignment/research-queue.md` | none |
| 74 | `quickpass-wintrChess-encroissant-chessmonitor.md` | Three quick passes under the three-question rule | Three products located; E1 unthreatened, love/hate recorded | RFC ACCEPTED | yes — `learner-rating` implementing | `learner-rating` |
| 75 | `release-platform-audit.md` | R18 — self-host, provider-off, data-lifecycle, rights | Narrow core claim passes; the 1.0 release claim fails on five floors | SHIPPED | partly — `portable-account-data` implemented; four floors remain | `archive/portable-account-data` |
| 76 | `review-map-and-reentry.md` | Grounded Review Map and re-entry | Hardest mechanical part already ships; the surface is not yet the Review Map | LANE OPENED | no RFC — `planning/platform-alignment/evidence-collector-readiness.md` | none |
| 77 | `roguelike-run-design.md` | How real roguelikes bound a run and sell the next one | Run shapes catalogued; §4d names the "strictly weaker" option the campaign must avoid | LEDGER ROW ONLY | **no** — D305 is an open **OWNER QUESTION**; `campaign-core` implementing cites no research | none |
| 78 | `runtime-opening-identity.md` | Wave C C3/D894 — runtime opening context | Three facts, not one sticky label; "deepest match wins" safe only for the third | RFC ACCEPTED | yes — `runtime-opening-identity` accepted 2026-08-23 | `runtime-opening-identity`, `semantic-collectors` |
| 79 | `selection-sign-and-significance.md` | What turns evidence into a small honest packet | Predeclared local selector reaches 93.3–93.8% counterfactual specificity vs. 18% raw | SHIPPED | yes — `semantic-evidence-selection` implemented | `archive/semantic-evidence-selection` |
| 80 | `semantic-horizon-coverage.md` | A bestline joined to events, not disguised | Foundation broad enough; the primitive does not exist and three shortcuts are false | LANE OPENED | no RFC — `planning/evidence-foundation-ux/d1066-semantic-horizon-plan.md` | none |
| 81 | `shared-candidate-evidence-packet.md` | One rules population, separate score and horizon joins | Do not widen `CandidateFeatureVector`; it fails all three reuse conditions | LANE OPENED | no RFC — `planning/evidence-foundation-ux/d1071-shared-candidate-packet-plan.md` | none |
| 82 | `shared-style-atoms-as-bot-traits.md` | D1062 — do R21 style atoms become bot personalities? | **No** — none of five atoms clears the controlled-trait gate at ×4 | LANE OPENED | n/a — refusal; `d1062-style-atom-plan.md` | none |
| 83 | `social-play-and-event-boundary.md` | R17 — native human play, adapters, bot events | Right native primitive already ships; the external handoff is not yet an adapter | LANE OPENED | no RFC — `planning/platform-alignment/research-queue.md` | none |
| 84 | `stack-selection.md` | Server/client languages, board & engine interop | Go/Node + Svelte, AGPL-3.0, hybrid execution — the founding stack decision | SHIPPED | yes — fed `branch-runtime`; whole codebase | `rfc/README.md`, `archive/authoring-frictions` |
| 85 | `state-directed-bot-profile.md` | D1073 — does a state target become a bot identity? | **No** — +4.85 pp route progress against a 10-point gate | LANE OPENED | n/a — refusal; `d1073-state-directed-profile-plan.md` | none |
| 86 | `stockfish-candidate-guard-probe.md` | What bounded Stockfish request truthfully prices Maia candidates | Depth 8 is the only measured 1.0 shape (<500 ms); node bounds unusable | LANE OPENED | no RFC — `planning/platform-alignment/bot-policy/plan.md` | none |
| 87 | `teardown-365chess-desk.md` | 365chess.com — a 2007 incumbent the sweep missed | Per-position evidence row (frequency + recency + cached eval) is the good feature | SHIPPED | yes — `runtime-corpus-evidence` implemented | `archive/runtime-corpus-evidence`, `archive/engine-leverage` |
| 88 | `teardown-cet.md` | Chess Endgame Training — hands-on | Cold load 593 ms, position open <2 s — the K9 speed bar we are measured against | LANE OPENED | no RFC — `planning/research-queue.md`; K9 evidence in `gates.md` | none |
| 89 | `teardown-chess2story-desk.md` | Chess2Story — the game-story surface | "Slides you re-enter and replay" vs. "a story you read" — differentiator holds | SHIPPED | yes — `game-import-and-story` implemented | `archive/game-import-and-story` |
| 90 | `teardown-chessable-desk.md` | Chessable — MoveTrainer and the June 2026 bot launch | Recall→understanding gap survives, narrowed but intact | **NOTHING** | no — nothing anywhere points at the file | none |
| 91 | `teardown-chessbook-desk.md` | Chessbook — repertoire gap finding | A gap is an unanswered opponent reply; position-keyed, not line-keyed | SHIPPED | yes — `repertoire-gap-finding` implemented | `archive/repertoire-gap-finding` |
| 92 | `teardown-chesscom-desk.md` | Chess.com practice surfaces | Power users can hand-assemble our loop; attempt history destroyed at every rewind | RFC ACCEPTED | yes — `longitudinal-store` accepted | `longitudinal-store` |
| 93 | `teardown-chesscom-platform-desk.md` | Chess.com as a whole platform | Game Review re-entry is one-ply Retry behind $119.99/yr | SHIPPED | yes — `game-import-and-story` implemented | `archive/game-import-and-story` |
| 94 | `teardown-chessigma-desk.md` | Chessigma — desk | Free product is a verdict screen, paid product is a doing-tool; split at the price line | LEDGER ROW ONLY | no — five BACKLOG mentions, no lane | none |
| 95 | `teardown-chessmindai-desk.md` | ChessMind AI — desk | Maia-2 marketing claim checks out in the shipped bundle — a rarity worth recording | LEDGER ROW ONLY | no — log mention only | none |
| 96 | `teardown-chessmotive-desk.md` | ChessMotive — owner find, absent from the matrix | Open-answer grading shape located and adopted | SHIPPED | yes — `open-answer-grading` implemented | `archive/open-answer-grading` |
| 97 | `teardown-drwolf-desk.md` | Dr. Wolf — the strongest mainstream "rewind and explain" | Mechanics point-by-point inverted from ours; 27k ratings say the demand is real | SHIPPED | yes — `onramp-guard` implemented | `archive/onramp-guard` |
| 98 | `teardown-noctie-desk.md` | Noctie — takebacks and configurable grading | No evidence of branch-as-attempt preservation; our core mechanic unimplemented there | **NOTHING** | no — nothing anywhere points at the file | none |
| 99 | `teardown-protocols.md` | The Q1a hands-on teardown protocol | Protocol ready; each teardown lands as a dossier and updates matrix + `gates.md` | LEDGER ROW ONLY | no — log mention; **and not listed in the coverage matrix it mandates** | none |
| 100 | `teardown-taketaketake-desk.md` | Take Take Take — owner find | The ~8-slide pivotal-state distillation checked against what TTT ships | SHIPPED | yes — `adoption-wave-1`, `game-import-and-story` implemented | `archive/adoption-wave-1`, `archive/game-import-and-story` |
| 101 | `theory-drill-current-joins.md` | Does any workflow close the theory↔drill loop? | **No** — the final action discards the selected pack ID and navigates to `/play` | LANE OPENED | no RFC — `planning/platform-alignment/research-queue.md` | none |
| 102 | `theory-knowledge-pipeline.md` | Can Tabiya reuse Skipper's retrieval stack? | No — the chess retrieval experiment failed its predeclared gate; reuse the patterns | LANE OPENED | no RFC — `planning/platform-alignment/knowledge-retrieval/plan.md` | none |
| 103 | `theory-sourcing.md` | Source inventory for drill-pack content | Lichess explorer + Syzygy + masters DB, licensing and rate limits pinned | SHIPPED | yes — four `content-sourcing-*` RFCs implemented | `archive/content-sourcing-explorer`, `-foundation`, `-position-seeds`, `-syzygy` |
| 104 | `threat-salience-and-human-error.md` | D815 — does threat recency add human-error signal? | **Kill it** — all three admission clauses fail | LEDGER ROW ONLY | n/a — refusal recorded in `gates.md` | none |
| 105 | `time-as-a-difficulty-lever.md` | Is a clock the refused pursuit clock? | No — a clock is the refused clock iff its budget survives a rewind; a fork-resetting clock is legal | LANE OPENED | no RFC — `planning/time-controls/rfc-derivation.md` | none |
| 106 | `titled-player-training.md` | The serious training tradition, and which of it we built | `WindowTrigger`/`TempoVerdict` ship with zero authored users; the Woodpecker's shrinking interval is absent | LEDGER ROW ONLY | no — one BACKLOG mention, no lane | none |
| 107 | `training-mode-variants.md` | The engagement-format catalogue | Two shipped verdict producers, a third proposed (D869), a fourth flagged | LANE OPENED | no RFC — `planning/variants/rfc-derivation.md`, `planning/campaign/rfc-derivation.md` | none |
| 108 | `wave-a-contract-closure.md` | Wave-A returned-contract closure | Space is not one universal algorithm; cite the tradition boundary honestly | RFC ACCEPTED | yes — `tactical-collectors` awaiting | `tactical-collectors` |
| 109 | `wave-b-breadth-probe.md` | Wave-B middlegame breadth, second cross-population probe | Defender-loss + exposed-target admitted at 4.5–6.5× lift; high lift ≠ useful sentence | RFC ACCEPTED | yes — `breadth-collectors`, `tactical-collectors` awaiting | `breadth-collectors`, `tactical-collectors` |
| 110 | `workflow-default-conformance.md` | Do people choose an intent or configure machinery? | **Configure machinery** — one opinion copied byte-for-byte into six technical profiles | LANE OPENED | no RFC — `planning/platform-alignment/plan.md` | none |
| 111 | `monotone-bot-route-controller.md` | D1080 — does monotone filtering sustain a route? | **No** — 1/12 branches, both gates fail; controller refused | LANE OPENED | n/a — refusal; `d1080-monotone-route-plan.md` (landed `f4d9be1`, this session) | none |

> Row numbering skips 46 (`identity-retaining-three-edge-consequences.md` is carried as 45b so the
> alphabetical order and the 110-row count both hold). Rows 1–110 are the corpus at session start;
> row 111 landed mid-pass.

---

## 2. Bucket membership

**SHIPPED (31):** `adoption-audit`, `authored-transitions-and-features`,
`authoring-vocabulary-completeness`, `band-flattery-and-buried-value`,
`broadcast-and-teacher-surfaces`, `campaign-effect-vocabulary`, `census-hint-false-positives`,
`detection-landscape`, `detector-semantic-conformance`, `engine-layer-capability-audit`,
`evidence-contract-topology`, `maia-band-outcome-transfer`, `maia-endgame-fidelity`,
`maia-policy-scalar-stability`, `mechanics-by-mode`, `mobile-scope`, `move-primitive-computability`,
`objective-lifecycle-diagnosis`, `pack-authoring-cost`, `practical-difficulty-outside-tablebase`,
`release-platform-audit`, `selection-sign-and-significance`, `stack-selection`,
`teardown-365chess-desk`, `teardown-chess2story-desk`, `teardown-chessbook-desk`,
`teardown-chesscom-platform-desk`, `teardown-chessmotive-desk`, `teardown-drwolf-desk`,
`teardown-taketaketake-desk`, `theory-sourcing`.

**RFC ACCEPTED (28):** `assistance-surface-taxonomy`, `basic-semantic-tactics-stage-0`,
`bot-policy`, `bounded-reply-semantics`, `campaign-intermediate-consequence`,
`classifier-coverage-and-noise`, `coaching-versus-cheating-and-the-band-curve`,
`competitor-play-ux`, `decomposed-king-state`, `evidence-presentation`,
`feedback-versus-the-dashboard`, `fun-mechanics-outside-roguelikes`,
`grounded-coaching-aggregation`, `human-like-opponents`, `identity-retaining-mobility`,
`identity-retaining-three-edge-consequences`, `league-as-return-loop`, `legal-square-denial`,
`maia-wdl-versus-human-outcome`, `middlegame-evidence-and-style-taxonomy`, `pawn-conversion-events`,
`pawn-lever-and-candidate-timing`, `player-analysis-and-skills`,
`quickpass-wintrChess-encroissant-chessmonitor`, `runtime-opening-identity`,
`teardown-chesscom-desk`, `wave-a-contract-closure`, `wave-b-breadth-probe`.

**RFC DRAFTED (2):** `claim-semantic-anchors`, `pack-primitive-stability`.

**LANE OPENED (32):** `bestline-is-not-hint-distance`, `bot-candidate-sharpness`,
`bounded-policy-targets`, `capability-watch.json`, `competitor-matrix.csv`,
`conjunction-hypothesis`, `endgame-latency-versus-cet`, `famous-game-sources-licensing`,
`finite-state-bot-route-controller`, `foundation-capability-closure`, `human-outcome-coverage-depth`,
`integrated-platform-alignment`, `interaction-state-correctness`, `legal-exchange-prerequisite`,
`live-relay-as-drill-source`, `llm-renderer-contract`, `maia-production-band-roster`,
`player-style-metrics`, `professional-workflow-conformance`, `review-map-and-reentry`,
`semantic-horizon-coverage`, `shared-candidate-evidence-packet`, `shared-style-atoms-as-bot-traits`,
`social-play-and-event-boundary`, `state-directed-bot-profile`, `stockfish-candidate-guard-probe`,
`teardown-cet`, `theory-drill-current-joins`, `theory-knowledge-pipeline`,
`time-as-a-difficulty-lever`, `training-mode-variants`, `workflow-default-conformance`.

**LEDGER ROW ONLY (13):** `capability-watch.md`, `chessable-movetrainer`,
`competitor-love-hate-sweep`, `competitor-value-props`, `coverage-gap-sweep`,
`coverage-sweep-2-notability`, `maia-band-calibrated-range`, `roguelike-run-design`,
`teardown-chessigma-desk`, `teardown-chessmindai-desk`, `teardown-protocols`,
`threat-salience-and-human-error`, `titled-player-training`.

**NOTHING (4):** `grounded-skills-taxonomy`, `longitudinal-style-feedback-contract`,
`teardown-chessable-desk`, `teardown-noctie-desk`.

---

## 3. The refusals — research that correctly built nothing

Six dossiers concluded *do not build this*. They are not part of the gap; they are the process
working, and law 6 wants them visible.

| Dossier | What was refused | Where the refusal is recorded |
|---|---|---|
| `conjunction-hypothesis.md` | Conjunctions of census primitives — worse than either alone on all three axes | `planning/exploration/gates.md`, `campaign-research-queue.md` |
| `threat-salience-and-human-error.md` | Threat recency as a bot-error weight or human-difficulty label | `planning/exploration/gates.md` |
| `shared-style-atoms-as-bot-traits.md` | Style atoms as one-ply Maia candidate weights | `d1062-style-atom-plan.md` |
| `state-directed-bot-profile.md` | A phase-scoped state target as a bot identity | `d1073-state-directed-profile-plan.md` |
| `finite-state-bot-route-controller.md` | A finite-state controller sustaining a multi-ply route | `d1078-route-controller-plan.md` |
| `monotone-bot-route-controller.md` | Monotone filtering as the route generator | `d1080-monotone-route-plan.md` |

A further set — `legal-square-denial`, `practical-difficulty-outside-tablebase`,
`census-hint-false-positives`, `bounded-reply-semantics` — refused specific *claims* while their
underlying collectors were adopted; they are counted under their citing RFC, not here.

---

## 4. The answer: concluded buildable, no RFC in any state — **31**

Excluded from the 49 uncited dossiers: the **6 refusals** above (nothing to build) and **12 pure
competitive-intelligence or register artifacts** that make no build claim of their own
(`capability-watch.md`, `capability-watch.json`, `competitor-matrix.csv`, `chessable-movetrainer`,
`competitor-love-hate-sweep`, `competitor-value-props`, `coverage-gap-sweep`,
`coverage-sweep-2-notability`, `teardown-chessable-desk`, `teardown-chessigma-desk`,
`teardown-chessmindai-desk`, `teardown-noctie-desk`). `teardown-protocols` is counted as intel
infrastructure. 49 − 6 − 12 = **31**.

| # | Dossier | What it says is buildable | Farthest thing pointing at it |
|---:|---|---|---|
| 1 | `live-relay-as-drill-source.md` | Lichess broadcast ingestion as a first-class drill/spectate source | derivation doc; the accepted RFC on the subject cites no research |
| 2 | `time-as-a-difficulty-lever.md` | A fork-resetting clock — legal, and not the refused pursuit clock | `planning/time-controls/rfc-derivation.md` |
| 3 | `training-mode-variants.md` | A family of engagement formats as campaign encounter classes | two `rfc-derivation.md` files |
| 4 | `longitudinal-style-feedback-contract.md` | A closed grounded aggregation contract over 12 measured habits | **nothing** |
| 5 | `grounded-skills-taxonomy.md` | The five-category navigation vocabulary (not credit) | **nothing** |
| 6 | `player-style-metrics.md` | A continuous, re-identifying habit profile (12/16 metrics) | `player-style/plan.md` |
| 7 | `maia-production-band-roster.md` | Four production bands `[1000,1400,1800,2200]` | `d970-roster-handoff.md` |
| 8 | `stockfish-candidate-guard-probe.md` | Depth-8 single candidate-set search as the 1.0 request shape | `bot-policy/plan.md` |
| 9 | `bot-candidate-sharpness.md` | Engine-priced choice breadth as a difficulty signal | `o8-handoff.md` |
| 10 | `famous-game-sources-licensing.md` | Famous-game packs, now that D1060 lifted the refusal | `rfc-drafting-queue.md` ("not draftable before" — it is now) |
| 11 | `review-map-and-reentry.md` | The Review Map with F2 semantic inputs and honest grounding labels | `evidence-collector-readiness.md` |
| 12 | `interaction-state-correctness.md` | The board-stability repair (4 of 90 gesture cells work today) | `research-queue.md` + `gates.md` |
| 13 | `endgame-latency-versus-cet.md` | The K9 usability repair | `codex-queue.md` |
| 14 | `teardown-cet.md` | The speed/usability bar the repair is measured against | `research-queue.md` |
| 15 | `integrated-platform-alignment.md` | **The evidence compiler** — the named missing object of the platform | `platform-alignment/plan.md` |
| 16 | `llm-renderer-contract.md` | A renderer contract where selection is upstream of prose | `renderer-evaluation/plan.md` |
| 17 | `foundation-capability-closure.md` | The 17 absent producer families | `evidence-foundation-ux/plan.md` |
| 18 | `semantic-horizon-coverage.md` | The bestline↔event join primitive | `d1066-semantic-horizon-plan.md` |
| 19 | `shared-candidate-evidence-packet.md` | A score-free complete legal-candidate packet beneath the vector | `d1071-shared-candidate-packet-plan.md` |
| 20 | `bestline-is-not-hint-distance.md` | Bestline collection (step 1 of D1061's ruled axis) | `d1061-bestline-distance-plan.md` |
| 21 | `bounded-policy-targets.md` | Typed target-removal/return facts with separate authorities | `d1023-bounded-policy-plan.md` |
| 22 | `legal-exchange-prerequisite.md` | `meaningful_fork` and `moved_piece_en_prise` as SEE-grounded facts | `phase2-collector-audit.md` |
| 23 | `theory-drill-current-joins.md` | The theory↔drill door that currently discards the pack ID | `research-queue.md` |
| 24 | `theory-knowledge-pipeline.md` | A small provenance compiler with typed keys and a local FTS bundle | `knowledge-retrieval/plan.md` |
| 25 | `workflow-default-conformance.md` | Named workflow presets replacing 54 mechanism controls | `platform-alignment/plan.md` |
| 26 | `professional-workflow-conformance.md` | Two workflow compositions (coach, streamer) over shipped contracts | `research-queue.md` |
| 27 | `social-play-and-event-boundary.md` | A real external adapter in place of the paste-a-PGN handoff | `research-queue.md` |
| 28 | `roguelike-run-design.md` | The run shape the campaign sits inside | **D305 owner question, unruled** |
| 29 | `titled-player-training.md` | Shrinking-interval (Woodpecker) cycles; authored users for `WindowTrigger` | **nothing** |
| 30 | `human-outcome-coverage-depth.md` | The ply-20 coverage boundary as a campaign difficulty constraint | `campaign-research-queue.md` |
| 31 | `maia-band-calibrated-range.md` | The `[0,5000]` clamp behaviour as a production guard | `exploration/plan.md` mention only |

---

## 5. Ranked by owner interest

Cross-referenced against `design/BACKLOG.md`'s ⚖️ owner-ruling rows and verbatim owner quotes. The
ranking rule the task set: *a dossier whose subject the owner explicitly asked for, that concluded
"buildable", with no RFC, is the top of the list.*

### Top ten

| Rank | Dossier | The owner's own words | Ledger row | State |
|---:|---|---|---|---|
| 1 | `live-relay-as-drill-source.md` | *"where is the stuff like retrieving LIVE games (current tournaments for example) so streamers can cast or anyone can analyse?"* | **D947 ⚖️** commission, `BACKLOG.md:335` — *"nothing was ever drafted or scheduled"* | LANE; the accepted `rfc/live-sources.md` cites zero research |
| 2 | `time-as-a-difficulty-lever.md` | *"simulate the time pressure of a GREAT move during 10+0 chess and then give actual time"* | **D1041 ⚖️** ruled, `BACKLOG.md:374` — "time controls ship BOTH ways" | LANE — `time-controls/rfc-derivation.md`, no RFC |
| 3 | `training-mode-variants.md` | *"shouldn't our campaign mode have more variants like that??? what other novel chess variations there be???"* and *"I really like the idea of 'solitaire chess'… THAT sounds like a variant that fits within our campaign mode and as a separate mode."* | **D870 / D869 💡**, `BACKLOG.md:274-275` | LANE — two derivations, no RFC |
| 4 | `longitudinal-style-feedback-contract.md` | *"chess.com has so much feedback after a session and can tell you all your openings and how accurate you are with them"*; *"early game is solid, but in the midgame your play is too simple and positional, not enough tactics"* | **D552 💡**, `BACKLOG.md:148` (ROUTED → R21) | **NOTHING** — R21's queue row never names the file |
| 5 | `grounded-skills-taxonomy.md` | *"we need something like THAT too — it can support our campaign mode or general progress tracking and gamification."* | **D549 💡**, `BACKLOG.md:145` (ROUTED → R20) | **NOTHING** — R20's queue row never names the file |
| 6 | `player-style-metrics.md` | *"maps your opening style to (aggressive-solid, theoretical-creative) and maps it to the greats"* | **D552 / D551 💡**, `BACKLOG.md:147-148` | LANE — `player-style/plan.md`, no RFC |
| 7 | `maia-production-band-roster.md` + `stockfish-candidate-guard-probe.md` + `bot-candidate-sharpness.md` | *"we might want an algorithm that reduces the evidence to a move… play with how much it weights stockfish, maia, book moves… goal is a proper Elo range of bots that play human-like, with personalities."* | **D810 💡**, `BACKLOG.md:497` | LANE ×3 — `bot-policy` RFC is implementing but cites none of these three |
| 8 | `famous-game-sources-licensing.md` | *"what if we want packs based off of famous previous games?"* → **FULL LIFT** of the `capabilities.ts:159` refusal | **D1043 / D1060 ⚖️**, `BACKLOG.md:385, 388` | LANE — `rfc-drafting-queue.md` says "cheap once ruled"; it is ruled and nothing is drafted |
| 9 | `review-map-and-reentry.md` | *"they have rewinds from mistakes and then alternative moves with an explanation… kinda like autobranching?"* | **D550 💡**, `BACKLOG.md:146` | LANE — `evidence-collector-readiness.md`, no RFC |
| 10 | `roguelike-run-design.md` | **OWNER QUESTION** *"what is the campaign's progression denominated in, now that the power curve is flat by construction?"* — three answers, three very different products | **D305 💡**, `BACKLOG.md:1054`, marked ⚠️ owner-facing | LEDGER ROW ONLY — `campaign-core` is implementing without it |

### The next tier — owner-adjacent, buildable, no RFC

| Dossier | Owner connection | State |
|---|---|---|
| `workflow-default-conformance.md` | O3 ruling: *"expose it through intent modules, opinionated workflow presets and real ceilings rather than source-shaped settings"* (`BACKLOG.md:215`) | LANE |
| `professional-workflow-conformance.md` | D947's second half — *"so streamers can cast or anyone can analyse"* | LANE |
| `interaction-state-correctness.md` | Not an owner ask; A2/K9 kill-criterion evidence — authored move reachable in 4 of 90 gesture cells | LANE |
| `endgame-latency-versus-cet.md` | K9 fires on usability; owner's own "validation by use" posture (D649) makes this the blocker to his first play session | LANE |
| `integrated-platform-alignment.md` | D555 breadth ruling + D563 bottom-up sequencing — this dossier names the missing object of both | LANE |
| `theory-drill-current-joins.md` | D555's "Lichess theory/analysis" capability; the loop does not close | LANE |
| `social-play-and-event-boundary.md` | D555's "Chess.com's review and human play" capability | LANE |
| `titled-player-training.md` | `WindowTrigger`/`TempoVerdict` — D320's "one computed judgement of learner behaviour in the product, zero authored users" | LEDGER ROW ONLY |

### Owner asks that DID reach an RFC (control group)

For contrast, and so the finding is not read as "nothing flows": D551 (bot personality) →
`rfc/bot-policy.md` implementing; D552's aggregation half → `rfc/longitudinal-store.md` accepted;
D841 (max-load composition) → `rfc/play-composition.md` implementing; D976/D977/D982 (theming) →
`rfc/theming.md` awaiting; D1029 (castling) → `rfc/exact-legal-mobility.md` accepted; D1061 (hint
distance) → routed to `d1061-bestline-distance-plan.md`, RFC pending; D995/D996/D1058/D1077
(capability contract) → `rfc/pack-capability-contract.md` draft.

**The pattern in the failures is not that research is ignored — it is that research whose consumer
is a *product surface* (live relay, clocks, variants, style feedback, skills, review map, run
shape) stalls at the lane, while research whose consumer is an *evidence collector* reaches an RFC
reliably.** Seventeen of the 28 RFC-ACCEPTED dossiers are collector/contract research
(`breadth-collectors`, `tactical-collectors`, `semantic-collectors`, `move-quality-grades`,
`exact-legal-mobility`, `runtime-opening-identity`, `review-evidence-compiler` and their operand
dossiers). All ten of the top-ten owner asks above are surface research.

---

## 6. Is the coverage matrix current?

**Substantially, yes — 105 of 110 (95.5%), which is the best-maintained register in this join —
but it is not complete, and its own §Coverage-limits section predicts exactly the class it misses.**

| Check | Result |
|---|---|
| Dossier artifacts present in `design/research/` | 110 (111 including `monotone-bot-route-controller.md`, added to the matrix in the same commit `f4d9be1`) |
| Listed in the matrix's Report column | **105** |
| **Absent from the matrix** | **5** |
| Matrix table rows | 115 (including 22 GAP rows — the queue, not coverage) |
| Last touched | `f4d9be1`, 2026-08-23 — same day |

**The five dossiers the matrix does not list:**

1. `classifier-coverage-and-noise.md` — a `[V]` measurement that the compare strip fires on 99.87%
   of transitions at lift 1.003×. Cited by two RFCs; invisible in the matrix.
2. `endgame-latency-versus-cet.md` — **kill-criterion evidence**. K9 fires. Not in the matrix.
3. `stockfish-candidate-guard-probe.md` — pins depth 8 as the only measured 1.0 request shape.
4. `teardown-protocols.md` — the document that *mandates* every teardown update the coverage
   matrix is itself not in the coverage matrix.
5. `quickpass-wintrChess-encroissant-chessmonitor.md` — present in the prose but not as a Report
   cell (the filename's capital `C` is why an automated check would miss it either way).

**The finding that matters is not the count.** Four of the five omissions are `[V]` measurement
dossiers and one is the protocol itself; none of the thirteen teardown dossiers is missing. The matrix
tracks *competitor coverage* faithfully — that is what it was built for — and tracks *measurement
coverage* less well, which is the same frame problem its own §2 admits ("the frame was 'chess
training tools', and the product outgrew the frame").

**A second, larger staleness the matrix cannot see by construction:** the Feeds column names design
docs and question IDs, never RFCs. So a dossier can be listed, current, and correctly labelled
while nothing downstream exists — the matrix would look identical for all 31 dossiers in §4. **The
matrix answers "was it researched", never "did it become anything."** That is precisely the join
this document had to be built by hand to produce.

---

## 7. Structural findings

1. **Reverse-flow works for collectors and fails for surfaces.** 55.5% of dossiers are cited by an
   RFC. Split by consumer: evidence-collector research reaches an RFC in the large majority of
   cases; product-surface research (§5's top ten) reaches one in none of them.

2. **Eight active RFCs cite zero research** — `accessible-board-input`, `campaign-core`,
   `graduation-clearance`, `live-sources`, `measurement-records`, `pack-population-provenance`,
   `theming`, plus process. Three are accepted or implementing. `live-sources` and `campaign-core`
   each have a landed dossier on their exact subject (`live-relay-as-drill-source`,
   `roguelike-run-design`) and cite neither. This is the same defect the CLAUDE.md log clause was
   added for, one tier over: `engine-request-contract` was "the single RFC that flowed back to
   nothing, and it was also the only one with no log entry."

3. **Two dossiers have a research-queue row that never names them.** `research-queue.md:81` (R20)
   and `:82` (R21) carry status, blockers and dates — but not the filename, unlike R11/R12/R13/R17
   /R18 which all do. Both are top-five owner asks (D549, D552). The queue row is why they read as
   "handled"; the missing filename is why nothing can find them.

4. **Two teardowns are cited by nothing anywhere** — `teardown-chessable-desk.md` and
   `teardown-noctie-desk.md`. Both are early (2026-08-10/11) and both were superseded in substance
   by later work (`chessable-movetrainer.md`, the capability watch) without a supersession note.

5. **Four owner rulings from the last five days have no drafted RFC:** D1041 (time controls,
   2026-08-23), D1060 (famous-game full lift, 2026-08-23), D947 (live games, 2026-08-22),
   D870/D869 (variants, 2026-08-22). Each has a lane document. None has an RFC.

6. **The refusals are healthy.** Six dossiers concluded "do not build this" and all six are
   recorded where the next agent will hit them. Law 6 is working; the failure is entirely on the
   affirmative side.
