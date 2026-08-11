# Application shell

The application shell is Tabiya's stable browser frame. It owns route state,
global navigation, deployment capability reporting, run discovery and resume,
viewport allocation, and keyboard dispatch. Product surfaces compose inside
that frame; they do not create their own application navigation or window-level
keyboard listeners.

## Routes and information architecture

The client uses a dependency-free history-API router. Routes are parsed into
typed application state, navigation uses `pushState` or `replaceState`, and
`popstate` restores the matching view. Run IDs are percent-encoded when links
are created and decoded defensively. Invalid encodings and unknown paths render
an explicit not-found view rather than crashing the application.

| Route | Current surface |
|---|---|
| `/` | Home, including the most recent run's lease-aware resume card |
| `/play` | Registered pack list and start action |
| `/play/run/:runId` | Live drill, branch, compare, and export context |
| `/review` | Stored run history; opening a row returns to its live run context |
| `/learn` | Honest empty state for the phase-based learning program |
| `/live` | Honest empty state for streamer, academy, spectator, and arena work |
| `/create` | Honest empty state for the authoring program |
| `/library` | Read-only pack and run-artifact lists |
| `/settings` | Provider, deployment-surface, and shortcut information |

The route owns which screen is visible. `DrillSessionController` has no screen
phase machine; it owns only an optional active drill session. A deep link to a
run reconstructs its pack ID from the authoritative `run.started` event, so
reload does not depend on query-string pack metadata.

The shell top bar keeps the primary routes and current run/access context
visible. Standalone comparison is not a route: Review opens a run at
`/play/run/:runId`, where the existing controller can project and compare it.

## Run index and SQLite migration

`RunStorage.list(limit, offset)` returns newest-first summaries without
replaying each run and without consulting the current pack registry. The REST
binding exposes it as `GET /runs?limit=&offset=`; the default limit is 50 and
the maximum is 100.

SQLite stores a denormalized summary beside each run snapshot:

- pack title and ID;
- last-updated timestamp;
- objective state at the active cursor; and
- branch count.

New runs capture the registered pack title. Runs created before summary
storage existed fall back to their pack ID because their old snapshots did not
contain a title.

Database opening runs ordered migrations using `PRAGMA user_version`. Each
migration executes transactionally, advances the version only after success,
and is skipped on subsequent opens. Migration 1 adds `summary_json` and
replays every legacy event log once to backfill it. A fixture-database test
opens a legacy database, verifies the backfill, then reopens it and verifies
that the migration is not repeated.

Snapshot saves update the summary in the same storage operation. Listing is
therefore proportional to the requested page rather than to the number or
length of stored event logs.

## Lease visibility and resume

Every run has one active writer. `GET /runs` summaries and
`GET /runs/:id/graph` expose `activeWriterId`, making ownership knowable through
a read rather than a speculative mutation.

The browser's `WriterSession` has three explicit paths:

- `claimFor(runId)` creates and persists a writer ID for a new run;
- `peek(runId)` returns an existing local claim without minting or writing; and
- `observe(runId, activeWriterId)` creates an in-memory read-only session.

On resume, the client reads the graph and compares its stored claim with the
visible active writer. A match resumes writer mode; a missing or foreign claim
enters read-only mode immediately and leaves `localStorage` untouched. A later
`NOT_ACTIVE_WRITER` response still demotes the session defensively. Lease
transfer remains unsupported.

## Capability registry

`GET /capabilities` combines static runtime information with live deployment
health. Provider identities are derived from configured engine mode and
supervisor readiness:

| Provider | Values | Meaning |
|---|---|---|
| `opponent` | `maia`, `mock`, `none` | The selector provider currently able to answer |
| `judge` | `stockfish`, `mock`, `none` | The executor currently able to produce evidence |
| `llm` | `none` | No LLM renderer is implemented |

In mock mode the opponent and judge report `mock` when their shipped mock
implementations are available. They never claim Maia or Stockfish, and the
judge never reports `none` while mock evidence visibly flows. In engine mode,
an unhealthy or restarting supervisor is omitted and its provider becomes
`none`; configured identity alone is not treated as availability.

Deployment surfaces have exactly two server values: `available` and
`unavailable-here`. A runtime assertion rejects `planned` and unknown surface
keys. Planning is build-roadmap information, identical across deployments, so
the client owns it in `PLANNED_SURFACES` and may annotate an unavailable
surface as planned without pretending the server reported that state.

The capability response also retains runnable policy modes, healthy engine
identities, the run-schema version, and the effective strong-engine profile.

## Viewport and region model

The shell owns one `100dvh` viewport. Its grid contains an intrinsic-height top
bar and a `minmax(0, 1fr)` content region; `html`, `body`, and the application
root do not become page scrollers on supported desktop sizes.

Overflow belongs to named inner regions:

- pack, run, and library lists scroll within their content view;
- the branch rail scrolls its branch list;
- the timeline scrolls horizontally and remains vertically bounded; and
- comparison owns its content overflow.

The drill screen is a fitted grid. Its square board is limited by both
available width and remaining viewport height, with an explicit vertical
reserve for objective controls and the timeline. At narrower widths the panes
stack and the drill region becomes the deliberate scroller; full responsive
and PWA behavior remains later work.

Playwright projects every route at 1280x720 and 1440x900. It asserts
`document.scrollingElement.scrollHeight <= clientHeight + 1`; on a run it also
asserts the board is inside the viewport within one pixel and ends above the
timeline. This coverage caught and prevented a real board/timeline overlap.

## Keyboard ownership

`App.svelte` owns the only window-level `keydown` listener. A shell dispatcher
offers one active region registration, resolves the effective focused target,
lets that region claim the event first, then considers global commands.
`DrillScreen` is a registered region and does not bind `svelte:window`.

| Owner | Keys |
|---|---|
| Shell | `g` chords; `?` and Escape when no region claims them |
| Drill | R, Shift+R, B, 1–9, Tab while focused inside the drill, arrows, Space, E, local `?` and Escape |
| Browser | Tab outside the drill region, including the top bar |

The shell chord map is `g h` Home, `g p` Play, `g l` Learn, `g r` Review,
`g v` Live, `g c` Create, `g b` Library, and `g s` Settings. `g m` focuses the
first primary-navigation link, providing a keyboard-only route from the drill
body to the top bar. Once `g` starts a chord, its next key is consumed and is
not delivered to the drill.

Tab preserves the established compare-toggle behavior only while focus is
inside the drill region. It remains normal browser traversal in navigation and
other shell controls. Help overlays, dialogs, checkpoint continuation, and
compare dismissal restore focus to the invoking control or drill region. The
browser test covers the drill-to-compare contract, normal top-bar Tab, the
navigation escape chord, and focus restoration; it also caught a lost-focus
defect after checkpoint continuation.

## Honest disabled controls

Every disabled control, including an element using `aria-disabled="true"`,
must have `aria-describedby` pointing to nonempty explanatory text. The shared
`HonestControl` wrapper generates that relationship and visually hides the
reason without removing it from assistive technology. Compare, checkpoint,
and comparison-step controls use the convention.

A DOM sweep across all routes fails if a disabled control lacks a reason or
references an empty or missing element. The convention makes unavailable
behavior explanatory rather than merely inert.

## Measured envelope and limitations

The completed browser acceptance run recorded board-ready at 68 ms, rewind at
34 ms, branch switching at 51.2 ms, uncached mock reply at 1.4 ms, and cached
mock reply at 0.9 ms. The 51.2 ms branch switch is 1.2 ms (2.4%) above the
historical sub-50-ms product target. That target is a benchmark rather than a
guarantee, so this is recorded but not blocking. If it drifts further, the
known O(n²) full-log projection is the first optimization candidate.

Current intentional boundaries:

- Learn, Live, and Create reserve information architecture but do not claim
  their future behavior exists.
- comparison remains run-scoped rather than a standalone Review route;
- lease transfer is absent; and
- full responsive/mobile and PWA behavior is deferred beyond the supported
  desktop projections.
