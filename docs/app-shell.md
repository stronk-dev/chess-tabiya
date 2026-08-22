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
| `/play` | Just Play position entry and registered pack list |
| `/play/run/:runId` | Live drill, branch, compare, and export context |
| `/review` | Stored run history; opening a row returns to its live run context |
| `/rating` | Server-shaped band-equivalent publication, permanent rated-win marks, disclosures, and whole-game result history |
| `/learn` | Assigned classroom packs above the return queue and phase-based catalogue |
| `/live` | Classroom roster/assignment management, consented classroom standings, scheduled pack nights, live-session index, native-match simul wall, and creation from hosted runs |
| `/live/session/:sessionId` | Members, match pause state, friend links, board control, proposals, votes, invitations, Arena legs, and journal |
| `/live/overlay/:runId` | Chrome-free spectator/stream projection of a live run |
| `/create` | Honest empty state for the authoring program |
| `/library` | Read-only pack and run-artifact lists |
| `/settings` | Provider, deployment-surface, and shortcut information |

Public `/shared/:token` pages sit outside the authenticated shell. Story tokens render a
bounded terminal card; session-join tokens render only title, host, and the existing
account form, then redirect an authenticated redeemer into `/live/session/:sessionId`.
Server-side scope dispatch prevents the anonymous page from booting a run projection or
leaking a match position.

The route owns which screen is visible. `DrillSessionController` has no screen
phase machine; it owns only an optional active drill session. A deep link to a
run reconstructs its pack ID from the authoritative `run.started` event, so
reload does not depend on query-string pack metadata.

The shell top bar keeps the primary routes and current run/access context visible on ordinary
application routes. A live `/play/run/:runId` is a focused full-viewport composition and replaces
that global chrome with its own fixed run topbar; its Tabiya control exits back to Play, where the
global navigation resumes. Standalone comparison is not a route: Review opens a run at
`/play/run/:runId`, where the existing controller can project and compare it.

The measured record is deliberately separate from `/learn`: return scheduling remains an attempt
history rather than a score. `/rating` renders only the publication already shaped by the server,
including abstention, intervals, sample counts and fixed disclosures; it never derives a grade or
reorders history. A classroom standing lives inside that classroom on `/live`. Joining is a
two-step learner gesture whose confirmation repeats the permanent unwitnessed-games limitation;
record and rating visibility remain independently revocable. The table preserves the server's
result order and prints no client-derived rank.

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
`NOT_ACTIVE_WRITER` response still demotes the session defensively. Lease transfer is
explicit through live-session board policies. Native-match clients add one local
behavior: after committing their ply they follow the run, then automatically claim only
when their learner owns the new side to move. Their board is oriented to their seat;
objective and comparison perspective stay pinned to the run's reference side.

## Capability registry

`GET /capabilities` combines static runtime information with live deployment
health. Provider identities are derived from configured engine mode and
supervisor readiness:

| Provider | Values | Meaning |
|---|---|---|
| `opponent` | `maia`, `mock`, `none` | The selector provider currently able to answer |
| `judge` | `stockfish`, `mock`, `none` | The executor currently able to produce evidence |
| `llm` | `none`, `external` | Whether a vendor-neutral external voice provider is configured; no provider implementation ships |

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
An injected voice provider changes only the `llm` capability to `external`; its
packet and checking contract is documented in `adaptive-guidance.md`.

## Viewport and region model

The shell owns one `100dvh` viewport. Its grid contains an intrinsic-height top
bar and a `minmax(0, 1fr)` content region; `html`, `body`, and the application
root do not become page scrollers on supported desktop sizes.

Overflow belongs to named inner regions:

- pack, run, and library lists scroll within their content view;
- the branch rail scrolls its branch list;
- the timeline scrolls horizontally and remains vertically bounded; and
- comparison owns its content overflow.

The drill screen is a fitted grid. Its board slot is a size container, and the
square board uses the smaller of that container's available width and height;
it does not estimate the remaining viewport with a fixed control-height
subtraction. Tablet portrait uses that same fitted grid rather than the former
rail-stacking breakpoint. Below 720px
the shell and drill transform without changing their information model:
navigation becomes a compact scrolling menu, the board remains visible, and
Timeline, Branches, and Evidence are mutually exclusive region tabs. The live
simul wall becomes a single column and comparison/live panels stack.

The measured minimum supported run viewport is 360×680 CSS pixels. At that
floor every compact region retains a fully visible board with at least 24px
chess-square targets. Below either dimension the run mounts no board and states
the unsupported minimum and its reason; it does not silently clip or shrink the
board past the target floor. This floor applies to run play, not the surrounding
catalogue and settings routes.

`/settings` edits the same per-browser assistance records used by the in-run
popover for pack, position, and imported sessions. It reports deployment
providers without pretending environment configuration is an account control.
Account deletion uses in-page password re-entry; shared runs are reassigned.

The web build is installable through `manifest.webmanifest` with a maskable
Tabiya icon. No service worker or offline mutation queue ships, so installed
use remains an online client to server-authoritative lease and grant checks.

Playwright projects every route at 1280×720, 1440×900, and 768×1024. It asserts
`document.scrollingElement.scrollHeight <= clientHeight + 1`; on a run it also
asserts the board is inside both the viewport and the non-scrolling drill region
within one pixel, is at least 192px square, and ends above the timeline outside
the compact tier. A corpus regression runs that invariant against all six served
endgame packs at 1280×720, 1366×768, 1440×900, 1440×1000, and 768×1024. Long
authored objectives retain their complete text in a bounded scroll region so the
board keeps its playable floor. Compact coverage exercises Timeline, Branches,
and Evidence at 390×844 and the measured 360×680 floor, plus the explicit refusal
immediately below it.

## Keyboard ownership

`App.svelte` owns the only window-level `keydown` listener. A shell dispatcher
offers one active region registration, resolves the effective focused target,
lets that region claim the event first, then considers global commands.
`DrillScreen` is a registered region and does not bind `svelte:window`.

| Owner | Keys |
|---|---|
| Shell | `g` chords; `?` and Escape when no region claims them |
| Drill | R, Shift+R, B, 1–9, Alt+C while the drill region is focused, arrows, Space, E, local `?` and Escape |
| Browser | Tab and Shift+Tab everywhere, including the drill region and top bar |

The shell chord map is `g h` Home, `g p` Play, `g l` Learn, `g r` Review,
`g v` Live, `g c` Create, `g b` Library, and `g s` Settings. `g m` focuses the
first primary-navigation link, providing a keyboard-only route from the drill
body to the top bar. Once `g` starts a chord, its next key is consumed and is
not delivered to the drill.

Tab and Shift+Tab always preserve browser focus traversal. `Alt+C`, matched by
physical `event.code === "KeyC"`, toggles comparison only when the drill region
itself owns focus; it never fires from an input, summary, semantic board grid,
or contenteditable descendant. Help overlays, dialogs, checkpoint continuation,
and comparison dismissal restore focus to the invoking control or drill region.
The browser test covers the drill-to-compare binding, unmodified Tab traversal,
the navigation escape chord, and focus restoration; it also caught a
lost-focus defect after checkpoint continuation.

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
mock reply at 0.9 ms. The owner subsequently replaced the unsourced sub-50-ms
branch-switch target with a two-level tripwire: investigate at 100 ms and
intervene at 200 ms. The observed 45–53 ms range is comfortably below the
investigation threshold. The threshold is a prompt to inspect perceived
sluggishness, not a substitute for the K9 user-experience judgment; if latency
does drift, the known O(n²) full-log projection is the first optimization
candidate.

Current intentional boundaries:

- Create still reserves information architecture without claiming its future
  program exists. Learn and Live now carry classroom assignments and scheduled
  sessions in addition to their earlier catalogue and live-run surfaces.
- comparison remains run-scoped rather than a standalone Review route;
- lease transfer is absent; and
- read-only offline shell caching and native mobile packaging remain deferred;
  offline writes are deliberately absent.
