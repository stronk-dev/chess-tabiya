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

### Branch groups — playing several candidates in parallel

Owner, 2026-08-13: *"I am playing. I am unsure: I see about 4 good moves. I want
to play the 4 moves — like a group of branches. Or if I don't know an opening,
maybe a board for each opening variant. Or all the set of plausible human moves."*

A **third** multi-branch capability; neither of the others covers it:

| Capability | What it does | Who plays |
|---|---|---|
| **Simulate** | auto-walks authored variations to their end and renders the results | nobody — a preview |
| **Compare** | reads branches already played | nobody — a reading |
| **Branch group** | forks N candidates and **plays them all as a set** | the learner, in every one |

The seed sources **are the assistance ladder** (`05-in-run-experience.md` §3):
hand-picked moves (rung 0), authored variations (5), opening variants from corpus
(4), **all plausible human replies at the learner's level** (3 — the same Maia
distribution that detects pivotal moments), engine top-N (2). One mechanism, five
ways to fill it, each inheriting its rung's honesty properties.

**The load-bearing question is the opponent, not the boards.** For a group to
answer *"which of my four moves is best"*, resistance must be **held constant**
across branches, or the learner is comparing four different opponents and learns
nothing about their own move. **Corrected 2026-08-14: the control does NOT already ship** — the sidecar never
receives a seed (`seedHonored: false`) and the selector cache keys on
move-sequence history that sibling branches never share, so `seedMode: fixed`
alone holds nothing constant across a Maia group. Real constancy is a
group-level reply journal (`rfc/archive/branch-groups.md` §4.2): under `fixed`, the same
position always receives the same recorded selection replayed verbatim. The
earlier sentence here was an overstatement this ledger caught. `per_branch` is the
deliberate opposite experiment — *does my move survive varied resistance* — and
both are legitimate, but the default must be the controlled one and the
difference must be visible.

Open: whether branches advance in lockstep (one ply in each, in turn) or are
played through one at a time. Lockstep makes comparison immediate and cognitive
load high; sequential is calmer but lets branch A's memory contaminate branch B.
The ledgered branch-race row is the two-board special case. Presentation — grid,
carousel, stack — is deliberately unfixed; the information model does not depend
on it.

### Structural reading — the rung-0 layer

Everything here is computed from the position by chess rules alone: no engine, no
corpus, no model, no network. It is the only assistance that **cannot be wrong
about chess, because it makes no chess judgement** (`05` §3), and the rest of this
section depends on it.

- **Deterministic feature predicates** — outpost on a square, backward pawn on a
  file, half-open file, blocked diagonal, pawn-skeleton signature. Both a
  *readable* for the learner and an *authorable predicate* for objectives
  (`05` §5c). Exploration **Q4b** owns their definition.
- **Denial and prophylaxis reading** — "after a4, a Black knight can never use b5
  again." A denial move is invisible to every eval-first tool because nothing
  happened; this is the clearest thing rung 0 sees that an evaluation cannot
  explain.
- **Discovered-consequence sight** — see not only what a piece attacks now, but
  what it would unblock or enable: the knight that hops and frees a diagonal, the
  rook that steps aside and opens a file. Sight, not advice.
- **Pressure and control maps** — attackers and defenders per square, imbalance
  shown, significance attributed rather than asserted.
- **Structural naming** — the position *has* a Carlsbad skeleton, an IQP, a
  Maroczy bind. Detection is structural; whether it matters is not.

Each states a fact and attributes any judgement. **Detection is cheap and cannot
be wrong; significance is judgement and must be attributed** — the governing rule
of this section and the next two.

### Adaptive guidance

- **Live phase and structure classification** in-run, not just a catalogue filter
  — it is what makes the assistance rail selectable, since a tablebase is decisive
  below eight pieces and silent above, and corpus frequency is rich at move six
  and empty at move forty. Abstains honestly rather than guessing, and is never
  authoritative over a curated boundary.
- **Assistance configuration per session context.** A curated drill withholds by
  design; Just Play is the learner's own game; a streamed session has an audience
  with different needs from the player. "What assistance is available here" is
  implicit everywhere today and must become explicit.
- **Auto-detected pivotal moments** for play with no author: irreversibility,
  phase change, **human divergence** (the Maia distribution splitting several ways
  — a fact about the distribution, not a claim about chess), and option collapse.
  Engine eval swing is deliberately excluded as a primary detector: it finds where
  someone erred, which is the post-mortem framing this product replaces, and it
  cannot fire before the error.
- **Endgame steering as named technique** — recognize the type, name the
  technique, let the learner execute, grade the result. Never "play Rc8".
- **Guidance that adjusts to what is on the board**, so drilling and Just Play get
  the same reading rather than one being a degraded version of the other.

### Reusable shapes (pending the ruling in `04-content-architecture.md` §0)

Authored content splits into **shape entries** keyed to structural predicates and
reusable wherever the classifier fires, and **line content** keyed to a specific
move sequence and irreducible. If ruled, a drill becomes a generated recipe — a
position source, an objective as a structural predicate, a resistance policy — and
there is one play surface with the library lighting up on recognition. Recorded as
breadth now so it is scheduled either way; the line/shape split, not the abolition
of packs, is what survives both answers.

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
| B1 — shell and entry | stable shell routes Play/Learn/Review/Live/Create/Library/Settings; resume works | shipped — shell, routes, resume; `phase` projected (D6 closed by `defect-sweep`). Residual: `/settings` remains display-only |
| B2 — solo modes | Just Play plus Line, Plan, Outcome, and organic/guided Trajectory each complete one fixture run | **shipped in full 2026-08-14** — all four drill modes plus the Just Play position player (`shape-library`); the justPlay/fromPosition capability rows are live |
| B3 — review | manual multi-branch selection, pair/multi compare, replay, deep mode, share/export, **and branch groups played in parallel from a seeded candidate set with resistance held constant** | largely shipped (`n-way-comparison`) — N-way compare, simulate, prediction rendering, deep analysis, branch-selective export. Open surface: **branch groups** (owner 2026-08-13, no RFC yet) |
| B4 — evidence | authored, Stockfish, Maia, corpus/historical, Syzygy, structural/temporal, and LLM-rendered layers work with timing controls | authored prose, Stockfish grounds and Maia policy render; **structural layer is B9** (`rfc/structural-reading.md`, draft); corpus/Syzygy runtime rendering and evidence-bound LLM rendering remain unmet |
| B5 — live | Twitch host/chat/overlay, academy roles, and external Position Arena handoff each complete one scenario | shipped 2026-08-13 (`live-session-platform`) — roles, board control, spectate, chat voting, academy, Arena two-leg handoff. Native matchmaking stays outside minimal-real scope by design |
| B6 — create | a candidate, an import, or a completed run can become a served **community** pack, its channel visible wherever it is surfaced; corpus mining emits one unpublished candidate | shipped — mining (`candidate-emit`) plus studio write path, imports and publication channels. **Correction 2026-08-14 (forward trace): session distillation was claimed here and does NOT exist** — `session_distilled` is a reserved enum with zero producers; re-ledgered (`pack-studio`) |
| B7 — return | history/resume, progress, concept scheduling, related retry, and optional recommendation work | shipped 2026-08-13 (`return-and-progression`) — attempt scheduling, progress, `/learn`, duplicate, related retry. **Correction 2026-08-14 (forward trace): the opt-in recommender was claimed here and does NOT exist** — no route, disclaimed in the canonical doc; re-ledgered as an orphan. Cross-pack concept identity deliberately absent (a studio/B11 contract) |
| B8 — platform | desktop shell, responsive/PWA transformation, self-hosted engines/providers, read-only share links, accessibility | deployment shipped incl. the light profile (D5 closed); share links via live platform. Residuals: PWA transformation, settings controls |
| B9 — structural reading | feature predicates computed, authorable and rendered; denial, outpost, diagonal, pressure and discovered-consequence readables work with no engine; each abstains honestly and attributes judgement rather than asserting it | **shipped 2026-08-14 (`structural-reading`)** — twelve scoped feature predicates, dual readable/authorable role, Pack B graded by structural consequence, closed-by-default disclosure. Rung-0 layer is real |
| B10 — adaptive guidance | live phase/structure classification in-run; assistance configurable per session context; pivotal moments auto-detected in play with no author; endgame steering names a technique rather than a move | **shipped 2026-08-14 (`adaptive-guidance`)** — attributed phase classification with honest abstention, silent-by-default preferences, passive pivotal markers (two-decision option collapse), disclosure-gated human splits, endgame technique naming, retrospective eval pivots, packet-bound voice seam with deterministic fallback |
| B11 — reusable shapes | a shape entry authored once attaches to every position where its trigger fires; a drill is generated from position source + structural objective + resistance; one play surface serves both | **shipped 2026-08-14 (`shape-library`)** — shape entries (Carlsbad/IQP/rook-type official), pack references, derived-projection markers in Just Play and drills, the position player, SHAPE_PROSE_CONTAINS_FEN |

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
   the plan-objective gap that leaves the plan pack with no working
   objective (corrected 2026-08-14: Pack A grades via `follow_theory`, Pack C via outcome grading) (`05` §5c).
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
