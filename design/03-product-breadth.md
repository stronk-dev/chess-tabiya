# 03 — Product breadth and information architecture

Owner ruling, 2026-08-11: **breadth before content depth**. This document is
the living inventory of the whole product surface. It corrects the vertical
slice's accidental framing of Tabiya as a pack picker feeding one drill page.

## The sequencing rule

Build the complete capability surface first. Every promised mode and context
must work at a minimal but real end-to-end level with schema/example fixtures.
Only after that foundation is solid do we scale authored packs, refine branch
ranking, automate comparison selection, personalize defaults, and polish
individual flows.

This is not “make empty navigation for future ideas.” A surface counts as
breadth-complete only when its real entry, runtime behavior, evidence boundary,
resume/export path, and representative acceptance scenario work. Fixtures may
be thin and honestly labeled; features may not be theater.

Content-last therefore means:

- one or more representative fixtures can exercise every capability;
- the product does not wait for a curriculum before implementing a mode;
- authored catalog breadth and lesson quality come after functional breadth;
- optimization such as scoring/ranking branches comes after every branch and
  comparison path is available manually and correctly.

## The product is larger than packs

Packs are curated programs. They are one way into the rehearsal runtime, not
the application's identity.

### Play

- **Just Play:** start a normal game, choose a side/position/opponent, and let
  the system recognize theory, phases, structures, checkpoints, and learning
  opportunities as play develops. Rewind any decision, preserve the first
  attempt, branch, compare, and ask for evidence without first selecting a
  pack. This requires pack-optional runs and honest dynamic/retrieved guidance.
- **From position:** start from FEN, PGN, a shared drill URL, a historical-game
  position, or an imported study/repertoire node.
- **Line Drill / opening:** recognition, required theory and accepted
  alternatives, rating-level deviations, book-boundary crossing, and the
  first middlegame-plan fork.
- **Plan Drill / middlegame:** plan-class commitment, multi-ply consequence,
  timing windows, full-segment redo, related roots, opposite side, and causal
  branch comparison.
- **Outcome Drill / endgame:** convert, hold, save, resist, and technique
  sprints against perfect, strong, practical, annoying, or fallible policies;
  repeat/mirror/opposite-side actions.
- **Trajectory Drill:** organic or guided opening → middlegame → endgame
  sessions with causal provenance and objective transitions.
- **Position Arena:** at minimum, two-leg fixed-position sparring through
  invitation/Lichess handoff plus PGN return; native clocks/matchmaking can
  deepen later without erasing the surface.

### Review and explore

- Run history, resume, duplicate, replay, share, and PGN-with-variations.
- Rewind/fork at any legal node; automatic fork after rewind-then-move.
- Pairwise and multi-branch comparison, synchronized replay, difference
  strips, resulting-position grids, narrative mode, and deep analysis mode.
- Prediction checkpoints, opponent-intent prompts, branch race, simulate-all
  authored variations, opposite-side replay, and new-defense replay.
- Manual branch inclusion must work first. Default selection and later branch
  scoring/ranking optimize it only after the full surface is correct.

### Learn and return

- Phase-oriented discovery: opening/early game, middlegame, endgame, and
  connected trajectories are first-class navigation and filters.
- Concept/skill progress, due episodes, blocked versus varied repetition, SRS
  over episodes/concepts, related-position transfer, and retry history.
- Optional personal-history relevance can recommend packs or positions but
  never becomes the required entry point or product identity.
- On-ramp experiences, anti-opening packs, time-pressure variants, and
  difficulty/rating controls use the same runtime rather than separate apps.

### Live and community

- **Streamer/Twitch:** the streamer owns the live board; chat votes on plans or
  moves; the host snapshots, rewinds, branches, compares, and exposes an
  overlay. Viewers do not need full synchronized clients.
- **Academy/coached session:** host/leader controls the run, participants vote
  or propose, spectators follow, and the completed event can be replayed and
  distilled into a pack.
- **Arena and events:** scheduled pack nights, invitations, cohorts, two-leg
  position matches, team relays, and later native matchmaking reuse run,
  branch, evidence, and replay semantics.
- Shareable drill/run URLs and spectator-safe read-only views are platform
  primitives, not late marketing additions.

### Create and curate

- Pack authoring, preview, lint, regression tests, versioning, provenance, and
  strong-player review.
- Import Lichess studies, repertoires, FEN/PGN collections, historical games,
  and completed sessions as pack seeds.
- Author theory boundaries, objectives, timing windows, acceptable moves,
  model-game spines, transitions, claims, and transfer positions.
- Corpus search and candidate mining propose material; breadth proof produces
  at least one unpublished candidate through the real pipeline. Nothing
  becomes published teaching without review.
- Community contribution and open pack interchange are supported by the same
  schema, not a private author-only format.

### Intelligence and explanation

The UI exposes these as selectable evidence layers at the permitted feedback
time, not as one opaque “AI” feature:

- authored theory, objective, misconception, and transfer cue;
- Stockfish evaluation/WDL, MultiPV, tactics, and deep analysis;
- Maia chosen reply, target rating, policy mass, and plausible alternatives;
- corpus frequency/outcomes, continuation clusters, and historical examples;
- Syzygy WDL/DTZ and endgame triviality;
- deterministic structural, temporal, and phase features;
- phase/structure recognition and related-position retrieval;
- LLM wording, comparison, and re-anchoring constrained to the validated
  evidence packet, with self-hosted and configured-provider options.

Anti-contamination controls **when** these appear. During committed play they
may be withheld; at checkpoints, comparison, deep review, or explicit request
they must be available according to mode and user settings.

## Stable application shell

The desktop UI should be a viewport-contained application, not a growing
document. Its primary navigation must have room for the whole spectrum:

| Area | Primary destinations |
|---|---|
| Home | resume, due work, recent sessions, quick start |
| Play | Just Play, packs by phase, from position/game, Arena |
| Learn | opening, middlegame, endgame, trajectories, progress/schedule |
| Review | runs, branch comparisons, deep analysis, shared sessions |
| Live | Stream, academy/hosted session, events/spectate |
| Create | pack studio, imports, session-to-pack, review queue |
| Library | packs, games, positions, concepts, historical sources |
| Settings | opponent/rating, feedback/evidence, engines/models, LLM, data, accessibility |

Inside a run, the shared shell has stable regions:

- board and objective workspace;
- timeline/checkpoints;
- branch/run navigation;
- context-sensitive theory/evidence/explanation rail;
- session/role controls appropriate to solo, host, participant, or spectator.

Phone/PWA may transform these regions into tabs/sheets, but the information
model remains the same. Stream overlays and spectator views are projections of
the same run state, not separate products.

## Breadth-complete gate

Content expansion and scoring/polish do not become the main work until all
rows below are green or explicitly removed by a new owner ruling:

| Gate | Minimal real proof | Current state |
|---|---|---|
| B1 — shell and entry | stable shell routes Play/Learn/Review/Live/Create/Library/Settings; resume works | unmet |
| B2 — solo modes | Just Play plus Line, Plan, Outcome, and organic/guided Trajectory each complete one fixture run | Plan slice only |
| B3 — review | manual multi-branch selection, pair/multi compare, replay, deep mode, share/export | pairwise partial |
| B4 — evidence | authored, Stockfish, Maia, corpus/historical, Syzygy, structural/temporal, and LLM-rendered layers work with timing controls | worker plumbing partial; UI unmet |
| B5 — live | Twitch host/chat/overlay, academy roles, and external Position Arena handoff each complete one scenario | unmet |
| B6 — create | pack studio/import/review/session-distill workflow produces and validates a fixture; corpus mining emits one unpublished candidate | schema/lint only |
| B7 — return | history/resume, progress, concept scheduling, related retry, and optional recommendation work | resume partial |
| B8 — platform | desktop shell, responsive/PWA transformation, self-hosted engines/providers, read-only share links, accessibility | deployment partial |

## Provisional foundations-first RFC program

This is design-tier decomposition, not accepted implementation authority. The
point is to avoid one giant “everything RFC” without falling back into isolated
vertical slices.

1. **Product shell and capability registry (B1/B8):** stable routes, role-aware
   app shell, responsive region model, settings/provider capabilities, and
   honest unavailable-state handling. It reserves the complete IA before more
   screen composition.
2. **General session contexts (B2/B8):** pack-optional runs, Just Play,
   FEN/PGN/URL starts, phase/structure recognition contract, sharing, and
   spectator-safe projections.
3. **Training-mode breadth (B2):** Line, Plan, Outcome, organic Trajectory, and
   guided Trajectory contracts with one executable fixture each, including
   transitions and replay variants.
4. **Evidence and explanation (B4):** feedback packet/composer, authored
   claims, Stockfish/Maia/corpus/Syzygy/features, historical examples, timing
   policies, deep mode, and configured evidence-bound LLM rendering.
5. **Review and multi-branch exploration (B3):** manual N-branch selection,
   pairwise/multi comparison, simulate grid, prediction, narrative/difference
   modes, branch race, replay, and export/import.
6. **Live session platform (B5):** shared roles/events first, then concrete
   Twitch host/chat/overlay, academy voting/session control, and external
   Position Arena handoff/PGN return.
7. **Creation and curation (B6):** pack studio, imports, session distillation,
   provenance, review, regression, versioning, and community interchange.
8. **Return and progression (B7):** history, concept model, episode SRS,
   related retries, progress, and optional personal-history recommendations.

The RFCs may split further where review finds independent contracts, but they
must retain this dependency direction and jointly close every B-gate. Content
fixtures exercise the system; catalog production does not interrupt the
program.

## After breadth

Then iterate rapidly on:

- authored opening, middlegame, endgame, and trajectory content;
- branch usefulness scores and automatic compare inclusion, with manual
  checkboxes always retained;
- better defaults by mode/rating/history;
- branch grouping, cleanup, thumbnails, animation, and density;
- curriculum depth, review throughput, and authoring cost;
- performance and visual polish based on real use.

No future narrow RFC may define the application shell from the needs of its
single fixture. It must state which breadth gates and global navigation
surfaces it extends, preserves, or intentionally completes.
