# Drill client

The implemented drill client covers the pack-aware HTTP surface, the browser
transport and run projection, and the playable Svelte episode screens. It is a
REST-driven client: the server remains authoritative for run semantics,
checkpoint and objective evaluation, feedback timing, and opponent selection.

## Pack registry and routes

`PackRegistry.loadDefault()` loads the living
`schemas/drill_pack.example.json` fixture and every JSON document below
`content/packs/` when that directory exists. Loading is fail-fast: malformed
core fields, duplicate pack IDs, unsupported v1 semantics, and semantic lint
errors produce a typed `PACK_INVALID` error. The server accepts
`delayed_checkpoint`, `segment_end`, and `immediate_guard`; the removed
`immediate_blunder_guard` spelling remains invalid. A pack is also refused
unless its opponent mode is executable by the selector (`human_common`,
`strong_engine`, or `theory_strict`), so the registry cannot advertise a drill
that fails on its first opponent turn.

Each accepted document receives a server-computed SHA-256 digest over its RFC
8785 canonical form. `GET /packs` returns immutable summaries containing ID,
version, digest, title, mode, nullable phase, difficulty, and review status.
The library renders a missing phase as `unclassified`. `GET /packs/:id`
returns a browser-safe projection and the complete stored document's digest in
`x-pack-digest`; missing packs are typed `PACK_NOT_FOUND` errors. The projection
contains identity and catalogue fields, provenance, start, objective type,
summary, and projected grading, feedback and opponent policies, the recursive
spine without
annotations, and checkpoints reduced to ID, label, and executable actions. It
does not deliver deviations, feedback claims, checkpoint triggers, plan
classes, concepts, or spine annotations. The stored document—not this
projection—remains authoritative for orchestration, PGN export, and digesting.

## Run index and deployment capabilities

SQLite opens through an ordered, idempotent `PRAGMA user_version` migration
runner. Migration 1 adds a denormalized run summary and backfills each legacy
event log exactly once; reopening an upgraded database performs no work. New
runs retain their pack title while pre-migration rows honestly fall back to the
pack ID because their snapshots never stored a title.

`GET /runs?limit=&offset=` lists newest-first summaries without replaying every
run or consulting the pack registry. Both those summaries and
`GET /runs/:id/graph` include `activeWriterId`, allowing a browser to determine
its access mode without attempting a mutation.

`GET /capabilities` derives the opponent, judge, and LLM providers from the
configured engine mode and live supervisor health. Mock is a first-class
provider for both opponent and judge when mock evidence is wired. Deployment
surfaces emit only `available` or `unavailable-here`; `planned` is roadmap
information and exists only as a client constant.
Capabilities also publish the executable pack feedback policies and the guard basis: rules on
every deployment, plus recorded engine evaluations when a mock or Stockfish judge is live.

## Pack-aware run mutations

`POST /runs` accepts `packId`. The service resolves the registered pack and
derives the run's digest and starting FEN; callers cannot substitute stale pack
data. For every committed player or opponent move, one writer-leased mutation:

1. commits the move;
2. evaluates matching authored checkpoint triggers;
3. emits checkpoint and segment events;
4. evaluates the pack's objective rules; and
5. persists the resulting run once and returns the complete emitted-event set.

This keeps the move, checkpoint, and objective projection atomic from the
client's perspective. The server supports ordinary `reach_checkpoint` rules
and the monotone Outcome Drill compiler documented in
`outcome-drill-grading.md`, plus the frozen trigger vocabulary: `atPly`,
`atSpineNode`,
`fenPredicate`, `materialBalance`, and timing windows. A timing window fires
when its authored closing trigger matches. Unsupported objective rules fail at
pack load rather than being ignored.

After each successful move mutation, the service enqueues one asynchronous
evaluation job for the active node. Its shipped default is the ratified
100-millisecond profile and remains deployment-configurable.

## Feedback withholding

Feedback timing is a run property enforced on the server, not inferred from
whether a pack currently resolves and not implemented with client-side hiding.
`delayed_checkpoint` reveals after a checkpoint and `segment_end` after a
segment completes. A terminal `outcome.reached` reveals under every policy. A
pack-less position session uses `attempt_end`: its writer
explicitly calls `/reveal`, staged evidence becomes deliverable, and the next
committed move closes that delivery window. Already-recorded evidence stays
disclosed. Until disclosure:

- `/graph` removes engine evidence references while retaining rules- and
  pack-derived references;
- `/events` stops at the first withheld engine-evidence event without advancing
  the visible cursor beyond it;
- `/compare` strips `engine:` references from objective timelines and returns
  an empty recorded-evidence overlay; and
- `/evidence` withholds staged results, while attempts to apply them return the
  typed `FEEDBACK_WITHHELD` error.

`/authored-feedback` returns an honest empty page for position runs. An absent
or stale registry entry never opens any engine-evidence surface.

`immediate_guard` is the explicit authored exception: disclosure and delivery are always open.
After a learner move and the opponent's consequence-start reply, deterministic material or
direct-attack arithmetic may append `feedback.generated`. A completed pair of already-recorded
evaluations may append the same event later. The client renders an unfocused play-on-or-rewind
offer only while that consequence node is current and keeps a durable `G` marker on the timeline.

`RunStateStore` projects either session kind without a pack dependency. The
existing drill-session controller remains a pack player and explicitly refuses
to resume a position run without fetching a pack. The Play route now supplies Just Play:
initial position or legal FEN, learner side, and human-common or strong-engine resistance.
The controller rebuilds opponent requests from persisted run identity, including initial
opponent turns, and the ordinary board/timeline/branch/compare/export surfaces remain active.
The objective region explicitly says that no pack is loaded and nothing is claimed.

The public pack projection still omits annotations, deviations, claims, plan
classes, concepts, and checkpoint triggers instead of relying on client-side
hiding. The separate run-scoped authored-feedback endpoint reveals only the
supported, path-anchored subset at an exact checkpoint occurrence. Unanchored
claims and other unsupported shapes remain absent; position runs have no
authored layer.

After a terminal move, the controller does not request another opponent move.
It refreshes run-scoped authored feedback and presents a non-dismissible
attempt-complete sheet with the exact outcome occurrence's authored commentary
and recorded evidence. Read-only followers perform the same refresh when their
event poll first observes the outcome. Rewind remains available to the active
writer and starts the next branch experiment.

Rules-derived explanations remain visible because they are engine-free facts
from the objective machine. Evidence references have runtime constructors and
the v1 grammar `rules:<fact>`, `pack:<checkpointId>`, and `engine:<jobId>`.
Known rules facts are checkmate, stalemate, threefold draw, 50-move draw,
insufficient-material draw, and material.

## PGN export

`GET /runs/:id/pgn?branches=a,b` returns legal `text/x-chess-pgn` with an
attachment filename. When the run still resolves to its exact registered pack
digest, export merges authored spine content with the selected played
branches. Otherwise it uses the runtime's ordinary run export. Unknown branch
IDs are rejected by the runtime rather than silently omitted.

## Typed browser transport and writer identity

`DrillApi` is the typed client for the complete v1 surface: capabilities,
packs, run listing, run creation and mutation, opponent selection, graph and
comparison, events and evidence, and PGN download. It preserves structured
server failures as `ApiError`, including the machine-readable error code and
details. Mutating requests carry the run's writer ID; read-only and selector
requests do not.

`WriterSession.claimFor()` explicitly creates and persists one writer ID under
a run-scoped `localStorage` key. `peek()` is non-minting, and observing a run
owned by another writer leaves storage untouched. On load, the client compares
the stored identity with `activeWriterId` and enters writer or read-only mode
before the first mutation. A later `NOT_ACTIVE_WRITER` response remains a
defensive demotion path; lease transfer is still unsupported.

## Run-state projection and polling

`RunStateStore` treats mutation-returned events as authoritative. It projects
the current run by appending each mutation's contiguous emitted-event suffix,
and rejects a response whose projected event count disagrees with its included
run. Resume projects the complete public event stream from `run.started`.

The writer does not poll its own run events. It tracks one pending evaluation
per committed move and, once the run's feedback delivery condition is open,
polls `/evidence` every second until the staged results have been writer-applied
and their `evidence.attached` events drain the pending count. A client rejected
with `NOT_ACTIVE_WRITER` becomes a follower and polls `/events?sinceSeq` every
two seconds. Rewinds remove server-canceled jobs for pruned nodes from the
pending count. Poll scheduling is injectable and covered without wall-clock
tests.

## Bare chessboard primitive

`Chessboard.svelte` wraps Chessground without adding a drill screen. Chessops
derives legal destinations from the authoritative FEN. The pack's `start.side`
sets orientation and restricts input to the learner's turns; the component
passes the current check and last move into Chessground's normal highlights.
Pawn moves to the back rank pause at an explicit queen/rook/bishop/knight
picker before emitting promotion UCI.

## Evidence sentences

The browser owns an enumerable evidence sentence table. Every exported
`rules:*` fact has a fixed plain sentence, and every pack checkpoint produces a
`pack:<checkpointId>` sentence from its authored label. Each `engine:*` result
renders independently with its typed payload and an `Engine` or `Human model`
source label; duplicate payload ownership is rejected rather than merged.
Unknown future prefixes remain explicit as a generic recorded-evidence chip.
The CI test enumerates the runtime rules vocabulary and the living pack's
checkpoint vocabulary.

## Episode orchestration

`DrillSessionController` composes the transport, persisted `WriterSession`, and
`RunStateStore` without implementing a second runtime or owning screen state.
Routes own which screen is visible. Starting a pack creates a URL-addressable
run; refreshing `/play/run/:id` reconstructs its pack from the authoritative
`run.started` event and projects the public event log. The client derives its
policy locus from capability identities and access from the visible lease.

A player move is applied first. When its atomic emitted-event suffix contains a
checkpoint, the controller pauses before selecting an opponent reply. Continue
calls the pure `/select-move` endpoint and then writer-appends the selection and
move as one opponent ply. Fork, rewind, switch, compare, PGN export, and stop
remain thin calls to the existing client/store contracts. The pack registry
refuses opponent modes that the selector cannot execute; the living fixture
uses `human_common`, so every served pack is runnable by construction.

## Screens and episode flow

The pack library shows title, mode, difficulty band, and the registry's
`reviewStatus`; the living Najdorf document therefore remains visibly labeled
`schema_example`, not presented as reviewed content.

The drill screen composes three regions:

- a centered Chessground board with the authored objective, status, and typed
  why-banner;
- a bottom active-line timeline whose checkpoint markers support a
  click-preview followed by explicit rewind confirmation; and
- a right branch rail with branch label, first divergent move, optional intent,
  live objective-state chip, branch switching, and compare selection.

The checkpoint sheet takes focus and exposes continue, rewind, compare when
the authored checkpoint allows it, and stop. Objective transitions are never
shown bare: `screen-model.ts` rejects an empty evidence-ref set before
`WhyBanner.svelte` renders the sentence table.

The comparison screen consumes the server/runtime `BranchComparison` payload.
Its synchronized stepper positions both boards on the aligned pair; an absent
side is dimmed and labeled `Line ended`. Objective timelines and checkpoint
hits render as separate strips. Each objective change is rendered as
`from → to` and every recorded ground is resolved through the existing evidence
sentence table; an empty ground set fails instead of manufacturing explanatory
copy. A per-side recorded engine trajectory plots the comparison's
White-perspective centipawn or mate scores at their aligned ply offsets and
marks the common fork. The engine deployment supplies Stockfish; the mock
deployment remains honestly labeled as recorded engine evidence rather than
claiming a provider identity absent from the payload. Engine arrows, move
labels, deltas, and human-frequency overlays remain absent.

Outcome Drill adds a compact context surface above the board and in checkpoint
or terminal sheets. It keeps four facts separate: the root assessment, the
resistance requested by the pack, the engine identities actually recorded on
this path, and the objective state/result. A Syzygy assessment says `Exact`
only when the server projects `ledger_verified`; otherwise it is explicitly an
authored, unproved claim. The client never infers which policy ran from an
engine identity and always says that recorded resistance is not proof of
perfect play. Non-terminal checkpoint resolution says that the attempt ended,
not that the position was proved.

Shape-library matches are derived over the active played path. Their passive timeline
markers (including a ply-0 root row) open an attributed detection-and-plans panel without
emitting events or changing feedback disclosure. Pack runs evaluate referenced entries;
Just Play evaluates the served catalogue.

## Branch groups

At a decision point the drill can capture two through eight legal candidate
moves without committing them, then create a durable group of ordinary
branches. The server, not the browser, resolves authored or machine candidates
and controls subsequent group replies. The branch rail marks membership while
the group panel presents source and resistance attribution plus Overview,
Summary, and Boards semantic-zoom bands. It never ranks candidates.

Sequential advance is the default; lockstep is an optional local preference.
Switching a group member follows the ordinary rewind contract and requests an
opponent reply when the new cursor is on the opponent's turn. Evidence removed
by rewind is shown as absent and can be explicitly re-requested through the
analysis route. Compare group opens the existing N-way view with all member
branches selected, and export uses the ordinary variation-preserving PGN path.
The complete persistence and resistance rules are in `branch-groups.md`.

## Application shell and fitted regions

A dependency-free history-API router owns `/`, `/play`, `/play/run/:id`,
`/review`, `/learn`, `/live`, `/create`, `/library`, and `/settings`, plus an
explicit not-found view. Home presents a lease-aware resume card; Review lists
stored runs and opens one in the live drill context. Learn, Live, and Create
are honest empty states naming the breadth-program item that will implement
them rather than pretending the capability exists.

The application shell owns exactly one viewport: a fixed-height top bar above
a `minmax(0, 1fr)` content region. The document does not scroll on desktop;
lists, the branch rail, and timeline own their overflow. The drill is a fitted
grid, and its square board is bounded by both available width and available
height so it cannot overlap the timeline. On narrower layouts the drill region
itself becomes the explicit scroller and the panes stack.

## Keyboard and focus contract

`App.svelte` owns the sole window keydown listener and dispatches first to the
active registered region, then to shell commands. The drill region owns `R`
for the latest checkpoint, `Shift+R` for the checkpoint picker, `B` for a
labeled/intent branch, `1`–`9` for branch switch, left/right arrows for the
synchronized timeline, Space for replay, `E` for PGN export, and its local
keyboard guide. `Tab` toggles compare only while focus is inside the drill
region; in the top bar it retains native focus traversal, so keyboard users can
always leave the drill.

Shell `g` chords route to Home, Play, Learn, Review, Live, Create, Library, or
Settings, while `g m` focuses primary navigation. Shell and region `?` guides,
Escape dismissal, checkpoint sheets, pickers, fork forms, and compare all
restore focus to the control or region that opened them.

Every disabled or `aria-disabled` control is described by a nonempty hidden
reason through `aria-describedby`. The reusable honest-control wrapper applies
that contract, and a DOM sweep exercises it on every route. Visible controls
remain available for every shortcut.

## Browser acceptance

`make test-browser` runs the Playwright acceptance flow against the same
production bundle and default `PackRegistry` used by the packaged server. The
test first proves the living Najdorf fixture was actually served with its
honest `schema_example` status and selectable `human_common` policy. It then
plays against the deterministic mock opponent, crosses checkpoints, rewinds,
creates and switches an alternative branch, compares both lines, and downloads
a legal variation PGN. This lives in a separate browser CI job rather than
making the engine-free unit gate depend on a browser installation.

The acceptance run also records browser-observed board-ready, rewind, branch
switch, and mock selector timings. The optional Maia measurement is selected
with `MAIA_LATENCY=1` against the running engines profile and remains outside
the ordinary browser job. Timings are evidence written to `test-results/`, not
hard CI thresholds: the planning log records the budgets and whether the
observed machine met them.

A second Playwright projection checks every route at 1280x720 and 1440x900.
It asserts that the document itself has no vertical overflow and that the
drill board remains wholly within the viewport and above the timeline.

## Packaged operation

The root Compose file has an unprofiled server using the deterministic mock
opponent and an `engines` profile that adds Maia and changes the server to the
Maia selector. `make up`, `make up-engines`, and `make down` wrap those modes.
The Maia sidecar starts the pinned UCI engine, completes both `uci` and
`isready` handshakes, and only then creates `/ready` and accepts the server's
TCP connection. Compose waits for that readiness file before starting the
engine-backed server.

The development Compose file builds local images. Tagged releases build the
server and Maia images for amd64 and arm64, publish version- and commit-SHA
tags to GHCR, and attach a generated Compose file whose two images are pinned
to the exact build digests. The devcontainer reuses the Compose toolchain and
includes Node, pnpm, and Stockfish.

## Current boundary

The drill-client implementation and later amendments now provide the
playable mechanism, route shell, persistent history, honest capabilities,
fitted regions, one keyboard ownership model, checkpoint-scoped authored prose,
recorded comparison evidence, honest Outcome Drill grading, N-way comparison,
and branch-group rehearsal. The broader theory/explanation vocabulary and
reviewed content remain incomplete. The living Najdorf pack is still a schema example; the
presence of grading UI does not turn unreviewed chess assertions into truth.

## Line Drill recall and verdict delivery

For `mode: line`, `GET /packs/:id` keeps the `spine` key but projects an empty
array so the browser never receives the answer line before play. Opponent
selection sends `packId`; the server supplies the validated spine internally.

After a normal authored-feedback reveal, the checkpoint and terminal sheets may
show path-scoped theory verdicts. Copy is deliberately non-evaluative: on-line,
the author's deviation class verbatim, or “this pack has no statement about
this move.” Any unknown verdict also prints “Unknown is not a judgement.”
Verdicts are excluded from the withheld-content counter because future played
plies are unbounded.

The resistance block separates the pack's requested mode, the applied mode
recorded per opponent ply, and the engine identity. Historical `unknown` plies
retain the earlier disclaimer; new plies no longer claim that applied policy is
unknowable. Line Drill renders this context without inventing a root assessment.
