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
  publication channel.

  **Publication channels (owner ruling 2026-08-13), replacing the struck review
  gate:** every pack carries a channel — **official** (authored by us, shipped in
  the repository or under an official account) or **community** (published
  through the studio by anyone else). The channel is a fact about origin, which
  the system can always assert mechanically; a review status was a claim that
  someone vouched, which nobody does. It is deliberately **not** a document
  field — it is stamped from which source resolved the pack, so a community
  author has nothing to forge. The channel must be visible wherever a pack is
  surfaced.
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
| Create | pack studio, imports, session-to-pack, publication channel |
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
| B1 — shell and entry | stable shell routes Play/Learn/Review/Live/Create/Library/Settings; resume works | **met with residuals** — `/settings` has no form control, `phase` is never projected, the drill-address grammar has no route |
| B2 — solo modes | Just Play plus Line, Plan, Outcome, and organic/guided Trajectory each complete one fixture run | Plan only, but **F2 removed the blocker** — pack-optional runs ship, so Just Play is buildable rather than blocked. Line half-real; Outcome and Trajectory zero code |
| B3 — review | manual multi-branch selection, pair/multi compare, replay, deep mode, share/export | pairwise partial — and pairwise is a **runtime type** constraint that cannot be composed into N-way |
| B4 — evidence | authored, Stockfish, Maia, corpus/historical, Syzygy, structural/temporal, and LLM-rendered layers work with timing controls | **F1 shipped**: authored prose now has a real surface — checkpoint and terminal sheets render annotations, deviation notes and plan classes with per-occurrence reveal. Remaining: anchored claims, Maia explanation rendering, corpus/Syzygy runtime rendering, structural/temporal evidence, LLM rendering |
| B5 — live | Twitch host/chat/overlay, academy roles, and external Position Arena handoff each complete one scenario | unmet, ordered last. **D1 and F3 closed**, so roles and a safe spectator projection are buildable; a granted spectator already follows a run in the browser suite |
| B6 — create | a candidate, an import, or a completed run can become a served **community** pack, its channel visible wherever it is surfaced; corpus mining emits one unpublished candidate | **mining half MET** — `candidate-emit` produced four real unpublished candidates through the shipped pipeline. Absent: studio UI, pack write endpoint, session distillation |
| B7 — return | history/resume, progress, concept scheduling, related retry, and optional recommendation work | history/resume ship and **F3 supplied the subject**, so the rest is buildable rather than blocked. Still zero: progress, SRS, related retry, recommendations |
| B8 — platform | desktop shell, responsive/PWA transformation, self-hosted engines/providers, read-only share links, accessibility | deployment packaging shipped in full; residual is the release compose's missing light profile (D5). **Share links no longer blocked by D1** — safe granted spectators ship; a public share-link workflow remains unbuilt. Overstated on Settings: no form control exists |
| B9 — structural reading | feature predicates computed, authorable and rendered; denial, outpost, diagonal, pressure and discovered-consequence readables work with no engine; each abstains honestly and attributes judgement rather than asserting it | unmet — specified in `05` §3/§5, nothing built |
| B10 — adaptive guidance | live phase/structure classification in-run; assistance configurable per session context; pivotal moments auto-detected in play with no author; endgame steering names a technique rather than a move | unmet |
| B11 — reusable shapes | a shape entry authored once attaches to every position where its trigger fires; a drill is generated from position source + structural objective + resistance; one play surface serves both | unmet — blocked on the `04` §0 ruling and on B9's predicates |

## The foundation edge (added 2026-08-12 after the alignment pass)

Six code-verified passes over the whole surface (`planning/breadth/`) found that
the work missing across all eight program items reduced to **three primitives**.
**All three shipped on 2026-08-12** — F1 as `authored-explanation-surface`, then
F3 and F2 as migrations 2 and 3 — closing defects D1, D2 and D3 with them. The
section is kept because the finding is what made the sequencing possible and
because later documents cite these names. Descriptions below are the
pre-implementation state:

- **F1 — per-scope reveal (SHIPPED).** Withholding *was* one boolean per run, so reaching one
  checkpoint would release authored prose for all of them. Blocks the B4
  explanation surface, the streamer overlay (which needs per-viewer withholding),
  and coach-reveals-prose.
- **F2 — pack-optional run identity (SHIPPED).** A pack *was* mandatory at six layers, so
  Just Play, from-position starts, Arena leg import, and the pack playtest
  harness are all blocked on the same change. The withholding barrier currently
  *fails open* when no pack is present, so that fix must land in the same slice.
- **F3 — a subject (SHIPPED).** No learner identity existed anywhere in the system. Blocks
  all of B7, both non-host roles in B5, and the fix for the writer-lease
  credential leak. The hosted-multi-user ruling (`design/02`) makes this a real
  auth boundary rather than a local profile.

Two structural facts shape how the rest of the program should be estimated.
First, the foundation RFCs cut contracts that shipped, were tested, and have
**zero producers** — `outcome.reached`, `transfer.scheduled`,
`human_model_predicted`, `feedback.generated`, the prediction-checkpoint
interaction, the drill-address grammar, the generic predicate evaluator. Breadth
-first worked: what remains is mostly producers and surfaces, not design. Second,
the mirror risk is that such a slot reads exactly like a working feature, which
is how five RFC drafts died — so every breadth claim now carries a code citation.

Item #1 remains **not finished**: its residuals (`/settings` with no
controls, `phase` never projected, the address grammar unrouted) are inherited by
items #3, #5 and #7 and belong to this edge rather than to whichever later item
trips over them.

**Just Play's interruption model — SETTLED 2026-08-12 (owner ruling): a passive
marker the player may open.** Recognition annotates the timeline; the player
chooses when to look. This preserves the uninterrupted-consequence stage of the
attempt, degrades honestly when recognition abstains, keeps recognition
non-authoritative over curated pack boundaries, and sets a materially lower
confidence bar than a model that may interrupt — so deterministic features can
ship without waiting for learned recognition.

## Provisional foundations-first RFC program

This is design-tier decomposition, not accepted implementation authority. The
point is to avoid one giant "everything RFC" without falling back into isolated
vertical slices.

**Ordering principle (amended 2026-08-11 after the first walkthrough):** the
program is ordered by *evidence and risk*, not by surface convenience. The
walkthrough's finding — branch comparison shows difference without explaining
consequence — makes the explanation layer the first thing after the shell.
Explanation is **machinery, not content**: the feedback packet/composer and its
evidence sources are server-side foundations, and every later surface inherits
their absence if they land late. It is also where the two most dangerous kill
criteria live (K6 generic explanations, K4 comparison not beating engine lines),
and cheap-to-test risks are tested early.

1. **Product shell and capability registry (B1/B8):** stable routes, role-aware
   app shell, responsive region model, settings/provider capabilities, and
   honest unavailable-state handling. It reserves the complete IA before more
   screen composition.
2. **Evidence and explanation (B4)** — *moved up from #4*; **split into #2a
   evidence composer (server data function) and #2b explanation surface
   (UI + evidence-bound LLM rendering), with `authoring-contracts-v03` as
   their shared prerequisite** (split recorded 2026-08-11 after the composer
   review found four authored contracts missing): feedback
   packet/composer, authored claims, Stockfish/Maia/corpus/Syzygy/features,
   historical examples, timing policies, deep mode, and configured
   evidence-bound LLM rendering. Needs only the shell for placement (its UI is a
   sidebar in the existing drill screen); makes every subsequent surface worth
   entering.
3. **General session contexts (B2/B8):** pack-optional runs, Just Play,
   FEN/PGN/URL starts, phase/structure recognition contract, sharing, and
   spectator-safe projections.
4. **Training-mode breadth (B2):** Line, Plan, Outcome, organic Trajectory, and
   guided Trajectory contracts with one executable fixture each, including
   transitions and replay variants.
5. **Review and multi-branch exploration (B3):** manual N-branch selection,
   pairwise/multi comparison, simulate grid, prediction, narrative/difference
   modes, branch race, replay, and export/import.
6. **Creation and curation (B6):** pack studio, imports, session distillation,
   provenance, review, regression, versioning, and community interchange.
7. **Return and progression (B7):** history, concept model, episode SRS,
   related retries, progress, and optional personal-history recommendations.
8. **Live session platform (B5)** — *moved to last*: shared roles/events first,
   then concrete Twitch host/chat/overlay, academy voting/session control, and
   external Position Arena handoff/PGN return. Ordered last because none of it
   can be validated by use without other humans (a streamer audience, a coach,
   an opponent); its BACKLOG revival conditions — singleplayer loop validated
   and fun; a coach partner or community existing — remain in force and are the
   real trigger. Shared roles/events plumbing may land earlier if another RFC
   genuinely needs it.

9. **Structural reading (B9):** the deterministic feature layer — predicates
   that are simultaneously readables for the learner and authorable conditions
   for objectives — plus denial/prophylaxis, discovered consequence, pressure
   maps and structural naming. **Ordered before 10 and 11 because both depend on
   it**, and ahead of much of the remaining polish because it is the only
   assistance that cannot manufacture chess truth, needs no engine, and closes
   the plan-objective gap that leaves two authored packs with no working
   objective today (`05` §5c).
10. **Adaptive guidance (B10):** live classification, assistance configuration
    per session context, author-free pivotal detection, endgame steering by named
    technique. Needs 9's predicates to have anything to classify with.
11. **Reusable shapes (B11):** shape entries, generated drill recipes, one play
    surface. Blocked on the `04-content-architecture.md` §0 ruling *and* on 9 —
    a shape cannot state its own trigger without feature predicates.

The RFCs may split further where review finds independent contracts, but they
must retain this dependency direction and jointly close every B-gate. Content
fixtures exercise the system; catalog production does not interrupt the
program.

## The failure mode this program must avoid

**Lucas Chess** (`design/research/competitor-value-props.md`): free, local,
all-phases — and fragmented into a mode menu with no unifying protocol. It is
the closest existing "breadth" product and the cautionary case for this exact
strategy. Breadth-first is correct *only if* the unifying depth (evidence,
explanation, the shared episode/branch model) lands early enough that each
surface is worth entering. A surface that shows difference without explaining
consequence is a mode-menu entry, not a drill. Watch item, tracked in
`planning/exploration/gates.md`.

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
