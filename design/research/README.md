# Research — coverage matrix and house rules

Research dossiers land here as `<topic>.md`. This README is the coverage matrix: what
has been researched, how well, and what it feeds. A dossier exists when research lands —
no empty stubs; GAP rows below are the queue.

## Coverage limits — read before trusting the matrix

Two structural limits, both proven by owner finds rather than admitted in advance:

1. **The matrix is a snapshot, not a watch.** The 28 products came from the frozen
   v2 brief's desk sweep. Nothing monitors new entrants — **ChessMotive** (owner
   find, 2026-08-12) and **taketaketake** (owner find, 2026-08-14) were both
   absent, and both were found by the owner, not the process. The failure also
   runs backwards in time: **365Chess** (owner find, 2026-08-14) is a 2007
   incumbent squarely on the gap sweep's cluster-10 shelf that the sweep still
   missed — a sweep tuned for 2024–2026 novelty does not see old incumbents
   either (`teardown-365chess-desk.md` §Method).
2. **The frame was "chess training tools", and the product outgrew the frame.**
   The sweep asked who helps you *practice*. The product now has spectating,
   live sessions, share links, and (proposed) game-story summaries — surfaces
   whose competitors are *fan and viewing* apps that the training frame never
   searched. A competitor to a surface we ship is in scope regardless of which
   category shelf it sits on.

**What a teardown answers (widened 2026-08-14, owner ruling):** three questions,
not one — (1) does it threaten E1; (2) what is its one good feature and through
which `design/05` invariant does it enter (adoption posture, `design/02`); and
(3) **why do people love it and why do people hate it** — reviews, forums,
churn complaints, with evidence labels. The third is the going-wide question:
the strategy is breadth ("the end-all-be-all"), so knowing what makes each
one-feature product beloved or abandoned is product research, not competitive
hygiene. A teardown without a love/hate section is incomplete.

Rule going forward: **when a new surface lands, ask which category of product
already does that one thing, and check the matrix covers its best example.**
Owned by whoever lands the surface, recorded here, no standing ceremony.

## House rules

- **Use one lightweight evidence label per factual research claim:**
  - `[V]` — directly checked in the current pass against the cited primary/authoritative
    source, a reproducible measurement, or a hands-on observation;
  - `[P]` — source-backed but partial, secondary, inherited desk research, or not yet
    reproduced hands-on;
  - `[M]` — model knowledge or analysis with no external evidence; unverified.
  These labels intentionally combine evidence basis and verification state for a small
  repo; they are not a complete source taxonomy.
- **Keep legal risk separate:** 🟢/🟡/🔴 may be added where relevant and means legal risk
  only, never evidentiary confidence.
- **Make every factual claim in a dossier traceable.** `[V]` and `[P]` require an inline
  URL or a precise living/archive source reference. Unsupported claims require `[M]`.
  A clearly bounded paragraph or table row may share one citation; repeated glyphs on
  every sentence are not required.
- **No RFC is drafted from a GAP row.** If the area is a gap, run a research pass and
  land the report first (composes with the exploration gate in `rfc/0000-rfc-process.md`).
- **Contradicting a design doc is a feature.** When research overturns design, flag
  `DESIGN-GAP:` in the dossier and escalate via `planning/exploration/log.md`; never
  silently resolve.
- Kill-criterion evidence (see `planning/exploration/gates.md`) is escalated, never
  buried.

## Inherited corpus

The archive's research (`archive/brief-v2/research/`) is **desk research**: product
pages, forums, papers — no standardized hands-on evaluation. Treat every inherited
claim as `[P]` unless a new dossier upgrades it. The package's own caveats:
`archive/brief-v2/research/research_limitations.md`.

- `source-index.md` — living continuation of the archive's R01–R45 (new entries R46+).
- `competitor-matrix.csv` — living copy of `archive/brief-v2/research/competitor_matrix.csv`
  (28 products, 20 columns). Extend/correct here; the archive original is frozen.
- `archive/brief-v2/research/claims_vs_verified.md` and `forum_signal_log.md` — frozen;
  cite as needed.

## Coverage matrix

| Area | Feeds | Status | Report |
|---|---|---|---|
| Competitor landscape (28 products, feature matrix) | Q1a, `design/02` | covered `[P]` — desk only | `competitor-matrix.csv`, `arch/02` |
| ChessMotive (owner-flagged near-competitor) | Q1a, E1, Q8 | covered `[V]` desk — E1 **intact**; narrows our compare claim | `teardown-chessmotive-desk.md` |
| Competitor value props: adopt / conflict / not-relevant vs our thesis and posture | Q1a, Q2, Q8, `design/02` | covered `[P]`, 3 claims `[V]` (WhyThisMove, Noctie, Chess Endgame Training) | `competitor-value-props.md` |
| Chess Endgame Training hands-on (latency, branching; owner's "slow/poor UX" report) | Q1a, K9 | covered `[V]` first pass (desktop; mobile/records/hint pending) | `teardown-cet.md` |
| Noctie takeback/branch persistence + feedback timing | Q1a | covered `[V]`/`[P]` desk pass; residual: takeback ground truth needs hands-on | `teardown-noctie-desk.md` |
| Chessable bot-from-course-position on strategic chapters | Q1a | covered `[V]` desk pass (one-way Chess.com handoff, no tie-back) | `teardown-chessable-desk.md` |
| Take Take Take (Carlsen social play + LLM game review; owner's game-story-slides idea) | Q1a, E1, Q1b, Q2 | covered `[V]` desk — E1 **intact**; game-story appetite validated, substance unclaimed; ADR-0005 anti-pattern shipped by a competitor | `teardown-taketaketake-desk.md` |
| Coverage-gap sweep — every shipped/specified surface vs. current market (11 clusters, 2024–2026) | Q1a, E1, `design/03` | covered `[V]` desk — 10 absent-relevant products grounded and added as matrix rows 31–40; E1 **intact** (no branch runtime found); branch groups, recovery-as-skill, and live structural naming returned nothing; teardown shortlist: Play Coach, Chessbook, ChessMind AI, Chess2Story, ChessEver | `coverage-gap-sweep.md` |
| Chess.com Practice multi-move redo + color switching | Q1a | covered `[V]` desk pass (undo destroys attempts; takeback-branch reported broken) | `teardown-chesscom-desk.md` |
| 365Chess (games-DB/explorer incumbent since 2007; missed by the sweep's cluster 10) | Q1a, E1, Q6, `design/02` adoption | covered `[V]` desk — E1 **intact** (lookup-first islands, no branches/rewind/compare; weakened-SF opponent); corpus-source verdict: additive population, unusable (no license/API), redundant via Lichess `/masters`; adoptable: per-position evidence row incl. last-played recency, via rung-4 grounded-claims invariant; love/hate: loved as OTB archive, left for no-opponents + corpus noise | `teardown-365chess-desk.md` |
| Coverage sweep 2 — by notability (old guard enumerated: platforms, databases, GUIs, courseware, publishers; Lichess + Chess.com whole-platform feature censuses) | Q1a, E1, `design/02` adoption | covered `[V]` desk — 14 absent-relevant products grounded and added as matrix CSV lines 43–56 (chessgames.com, ICC, Chess King/CT-ART, Chessity, ChessKid, Chessly, **Dr. Wolf**, Forward Chess, Chessify, ChessMonitor, OpeningTree, En Croissant, WintrChess, chessvision.ai); chess24/Magnus Trainer confirmed dead, Everyman consolidated into NIC; E1 **intact** (nearest pressure: Dr. Wolf's unlimited-undo teach-during-play; Chess.com Game Review re-entry flagged unverified); teardown shortlist: Dr. Wolf, Chessly, WintrChess, En Croissant, ChessMonitor + a scoped Chess.com whole-platform teardown (strong yes) and a scoped Lichess studies/learn-from-mistakes/practice hands-on | `coverage-sweep-2-notability.md` |
| Chess.com whole platform (Game Review re-entry; coach/practice surfaces; acquisition constellation) | Q1a, E1, Q2, `design/02` adoption | covered `[V]` desk — E1 **intact**: Game Review's only interaction is a one-ply Retry puzzle (no play-on vs an opponent); play re-entry is a manual Self-Analysis→Practice-vs-Computer chain, unlinked, attempts destroyed; coach explanations are Diamond-gated at $119.99/yr (the "$120/yr" Trustpilot complaint verified exact); M&A constellation verified (Komodo '18 integrated, Dr. Wolf '20 standalone, PMG '22 — chess24/Magnus Trainer killed, Everyman absorbed, Chessable/Aimchess standalone) — breadth bought, never integrated in-product; adoptable: the auto-offered post-game review ritual, with re-entry and preserved attempts attached | `teardown-chesscom-platform-desk.md` |
| Dr. Wolf (teach-during-play; the undo-vs-fork contrast) | Q1a, E1, `design/02` adoption | covered `[V]` desk — E1 **intact**: undo erases the attempt (mistakes harvested as isolated positions in a review queue, not attempts); "Are you certain?" blunder-guard retracts *before* the consequence (inverts commit-before-learning); band 0–1300/1500 ends where ours starts; explanation mechanism undisclosed, accuracy complaints on record, no TTT-style confabulation catch found; 4.8★/27k proves rewind-and-explain demand; adoptable: spoken post-hoc coach persona via §3a silence default + mistake-resurfacing upgraded to attempts | `teardown-drwolf-desk.md` |
| Chess2Story (game-story surface incumbent; RFC differentiator check) | Q1a, E1, game-story RFC | covered `[V]` desk — E1 **intact**; moment slides + board-jump shipped but read-only; engine-selected turning points with verified-score provenance (grounded, unlike TTT); no opponent, zero loop stages; "re-enter into play" unclaimed | `teardown-chess2story-desk.md` |
| ChessMind AI (closest stack neighbor; ADR-0005 live test case) | Q1a, E1, Q5, Q2 | covered `[V]` desk — E1 **intact**; Maia-2 in-browser ONNX verified in bundle (six bands ~1100–2000+); review prose generator undisclosed, no public confabulation catch found — ADR-0005 case unresolved, not passed; course-position→Maia sparring narrows the opening→play-out edge | `teardown-chessmindai-desk.md` |
| Chessbook (repertoire gap-finding incumbent; feeds the queued gap-finding RFC) | Q1a, E1, `design/02` adoption, audit row 48 RFC | covered `[V]` desk — E1 **intact** (opening-only, card unit, no opponent anywhere; mistakes harvested as quiz cards, not attempts); gap-finding mechanics established: position/EPD-keyed gaps = uncovered opponent replies, prioritized by expected frequency at your 200-Elo Lichess band, bounded by a user-set "1 in N games" coverage target, "go to your biggest gap" entry; SRS is FSRS move-cards (queue-flood complaint on record — evidence for our explainable ladder); §7 states the adoption contract for the RFC; love: data-driven build + speed + solo-dev community; hate: review overload, error-prone prose, no offline | `teardown-chessbook-desk.md` |
| Quick passes — WintrChess / En Croissant / ChessMonitor (sweep 2 picks #3–#5) | Q1a, E1, `design/02` adoption | covered `[V]` desk quick passes — E1 **intact** ×3; WintrChess: Stockfish + chess.com-style classification only, no prose/re-entry, public reliability complaints (trust lesson for grounding); En Croissant: workbench census — its users independently demand eval-bar hiding (validates anti-contamination default), repertoire SRS immature, our self-host constituency; ChessMonitor: honesty finding — loved numbers are mostly real-outcome records (posture-compatible) *but* the marquee FIDE-Elo estimate is a manufactured skill number with proven pull — the no-skill-numbers posture has a named, evidenced price | `quickpass-wintrChess-encroissant-chessmonitor.md` |
| Adoption audit — every loved competitor feature vs the shipped surface (synthesis over all teardowns/sweeps; no new external claims) | `design/02` §Adoption posture, Q1a, Q2, BACKLOG | covered — 60 features audited: 34 shipped (12 in transformed form), 7 ledgered, 19 missing; refusal set empty under the transformation ruling (conflicts constrain form, not existence); top cheap adoption: auto-offered post-game story for native runs; structural RFC candidates: runtime explorer evidence, repertoire gap-finding, stated-reasoning grading, friend-link play; 5 weaker-than-incumbent findings (runtime corpus evidence, share artifacts, voice, catalog depth, mobile); 12 ledger rows proposed | `adoption-audit.md` |
| Target learner/coach problem interviews + concept preference test | Q1b, E2 | **GAP** | — |
| Learning effect versus simpler formats | Q1c, H1–H4, C2–C4 | **GAP** — requires slice | — |
| Maia-3 capabilities (models, conditioning, sampling) | Q5 | covered `[P]` | `arch/research/source_index.md` R04 |
| Maia opponent quality (coherence over 10–20 plies) | Q5 | **answered `[V]`**: 80-game smoke, history-conditioned 5M plays plan-coherent 20-ply continuations with level-appropriate errors; weakened-SF control shows exactly the plan-less noodling Maia avoids | `tools/maia-harness/`, exploration log |
| Maia-3 variants vs ChessMimic (if runnable) vs corpus policy vs weakened-Stockfish control, same positions/seeds | Q5, H5 | **GAP** (queue 6) | — |
| Drill-pack authoring cost — the Q7/K10 verdict (nine waves, 33 instrumented packs) | Q7, K10, C6, K7, `rfc/authoring-frictions.md` | **answered `[P]`** (self-reported clocks, arithmetic `[V]`): **K10 not firing** — 35 packs exist, 33 instrumented at **43.5 min/pack**, tooling friction **11.6%** corpus-wide (9.2% excl. pack A), below the ~25% build-tooling threshold; the 43% single-pack figure in `BACKLOG:292` is superseded. Cost tracks the *grounding* bar, not the format: openings 28.8 min/pack with **zero** engine validation, Syzygy-grounded endgames 40.6, trajectories 97.5. Two qualifications carried, not buried: friction fell partly because **no wave has played a run since 2026-08-12**, and the cheap opening tier has an unpaid §3b grounding bill of unknown size. `review`/`owner-review` was 0 *before* it was retired, so none of the decline is an artefact of the retirement | `pack-authoring-cost.md` |
| Author-declared transitions/timing windows (35 authored packs, 23 shape entries, 9 waves) | Q4a, Q7, **E3**, K7 | **answered `[V]`, split verdict**: boundaries **yes** — 32/35 packs declare `authoredBoundary`, **17 of them voluntarily** (no validator compulsion), `plyHorizon` = deepest spine path in 19/32, and all **6/6** cross-phase trajectory leg boundaries fire at the claimed ply under the shipped evaluator. Timing windows **no** — **0 of 135 checkpoints**, 0 of the 3 races `04` §7 names, two independent authors recorded *why* (single trigger where the claim needs a move set), and `windowOpens`/`luxuryMoveBudget` have no evaluator. **E3 partially met**; K7 splits — structure encodable, timing not. `DESIGN-GAP:` `04` §2d requires a window per opening root; 18/18 opening-phase packs have none | `authored-transitions-and-features.md` |
| Deterministic feature set as authoring assistance — what fires and what cannot | Q4b, Q8, B4, next predicate wave | **answered `[V]`**: reliable for **censuses**, absent for **judgments**. For: 22/25 shape references and 14/14 in-spine structural triggers fire with 0 evaluator errors; the gap→predicate→adoption loop closed inside a day for 5 wave-2 predicates. Against: **73% of shape plans (75/103) ship `signature: null`** with the author's own "no census distinguishes this"; 7 of 15 feature kinds unused in any pack; `piece_reach_count atLeast 0` is faking existence 39 times; D32 (schema-valid condition crashes the validator) and D34 (no king geometry — `reach_structure`, a pawn word, doing duty for a king target). §6 is the predicate roadmap, ordered by attestation | `authored-transitions-and-features.md` |
| Move primitives across a transition — computability, per-ply cost, and the routing hypothesis | R1, R2 (`planning/campaign-research-queue.md`), `rfc/predicate-wave-3.md` §7 F4, `design/BACKLOG.md:224` | **answered `[V]`, one hypothesis refuted**: **R1** — 9 of 10 candidate primitives are censuses; the whole transition census costs **29.06 µs/ply** over 593 spine transitions from the 35 committed packs (33.25 dense, 7.47 sparse), and ~70 of the 290 implementation lines are verbatim copies of code already in the tree but **private** (`pivotal.ts:32-57`, `structure.ts:401-410`). Only **tempo-as-forcing** is not mechanical (needs an opponent model — F9's routing). The cost outlier is the shipped-and-dead `structuralDelta` at **1721 µs/ply**, **59× the whole census**, ~43% of it re-parsing FENs inside `evictionChanges`. Selectivity ordering measured: **overload 6.7%** is the sharpest instrument, `structuralDelta` at 93.3% the bluntest. **R2 — the routing hypothesis fails as stated**: exact given an author-named target (**9/9** recall, 0.20 µs/ply) but **98.7% false positives** with any computed target set (fires on 49.6% of quiet piece moves; endgame king walks dominate), and even with the target supplied **52.8%** of the piece's own legal alternatives also satisfy it. The target set is the judgment; routing is a renderer, not a detector. Routing explains only **9 of 17** author-labeled repositions — vacation, attack-set and safety cover the rest. F4 **promotion trigger not met** (0 transition claims among 78 `signature: null` plans; no RFC ships the discovered-threat surface), but F4's routing row and `predicate-wave-3` §4b's delta claim need amending before inheritance | `move-primitive-computability.md`, `tools/r1r2-primitives-harness/` |
| Automatic phase/structure recognition ground truth for Just Play | Q4c, B2, B4 | **GAP** — owner breadth ruling makes honest detection/retrieval/abstention load-bearing for Just Play, while curated packs retain authored boundaries | — |
| ~~Strong reviewer recruitment for packs A/B/C~~ | Q7 | ⛔ **closed 2026-08-13 — not a prerequisite.** Owner ruled no review workflow; packs carry a publication channel (official/community) instead, and C1 is withdrawn. Reopen only as a content-sourcing partnership wanted for its own sake | — |
| Dependency/model/content licensing across source, deployment, monetization, and rights axes 🟡 | Q2, Q6 | **GAP** (queue 10) | — |
| Paid-competitor pricing/positioning | Q2 | **GAP** | — |
| Server/client stack selection (Go vs Node/TS; Svelte vs React vs vanilla; chessground/WASM interop) | branch-runtime RFC, deferred-decisions register | covered `[V]`/`[P]` — recommends TS-everywhere + Svelte 5; flags Maia-3 Python-sidecar question | `stack-selection.md` |
| Branch/rewind/compare comprehension at 2/4/8 branches | Q9, E5 | partial `[V]`, owner n=1 real-engine walkthrough: fork/rewind quick and promising; compare selection cumbersome; scrolling shell odd; comparison-learning value not testable without the deferred instructional layer. Four/eight branches and phone remain GAP | `planning/drill-client/log.md` |
| Theory/pattern sourcing incl. provenance & rights | Q6, Q7, content phase | covered `[V]` — every pack need (skeleton/evidence/prose/positions/grading) has a CC0-or-ours source; do-not-use list included | `theory-sourcing.md` |
| Deliberate-practice evidence base | thesis | covered `[P]` (observational; population skew caveat) | `arch/research/source_index.md` R01 |
| Lichess corpus scale/licensing | Q6 | covered `[P]` | `arch/research/source_index.md` R02 |
| Engine stack (Stockfish UCI, Syzygy sizes) | Q5, arch | covered `[P]` | `arch/research/source_index.md` R03–R06 |
| Forum demand signals | Q1b | covered `[P]` — anecdotes, problem-shape only | `arch/research/forum_signal_log.md` |
