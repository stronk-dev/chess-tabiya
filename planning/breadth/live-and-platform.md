# Live session platform + platform/shell residuals — foundation alignment

Program items **#8 (B5)** and **#1 residuals (B1/B8)**. Written 2026-08-12 against
the tree at `apps/`, `packages/`, `workers/`, `deploy/`, `.github/`.

Every "ships" claim carries `file:line`; every "absent" claim carries the grep
proving it (run over `apps/*/src packages/*/src workers compose.yaml deploy
.github tests` unless narrowed). `#8` is ordered last in
`design/03-product-breadth.md:213-220` because none of it is validatable by use
without other humans — an *ordering* rationale. The surface is still owed, and
the same lines permit roles/events plumbing to land earlier when another item
needs it.

---

# Part A — Live session platform (B5)

## A1. Scope

| Surface | Owned gate rows |
|---|---|
| Shared roles/events plumbing (host / participant / spectator) | B5, and the carve-out consumed by #3/#5/#6 |
| Streamer/Twitch mode: streamer owns the board, chat votes plans/moves, host snapshots/rewinds/branches/compares, overlay exposed, viewers need no synchronized client | B5 |
| Academy/coached session: host controls the run, participants vote or propose, spectators follow, completed event replays and distills into a pack | B5 (distill leg hands off to #6) |
| Arena and events: scheduled pack nights, invitations, cohorts, two-leg position matches, team relays | B5 |
| **Position Arena** — minimal-real scope is two-leg fixed-position sparring via invitation/external handoff plus PGN return; native clocks/matchmaking are *depth added inside this surface*, not a second surface | B5 |
| Shareable drill/run URLs and spectator-safe read-only views as platform primitives | B5 ∩ B8 (see Part B) |

## A2. What ships today

| Capability | Shipped? | Evidence |
|---|---|---|
| `/live` route exists and is honest | yes | `apps/web/src/lib/router.ts:24`; empty state `apps/web/src/App.svelte:250-263`, naming program item 8 at `:260` |
| Server reports `live` as a surface | yes, as unavailable | `apps/server/src/capabilities.ts:22` (`SURFACE_IDS`), `:107` hardcodes `live: "unavailable-here"`; client annotates it planned via `apps/web/src/lib/api.ts:91-97` |
| Unauthenticated read endpoints (the spectator read shape) | yes | `apps/server/src/rest.ts:426-446` (`graph`, `events`, `evidence`, `pgn`), `:528-536` (`compare`) — none call `writerId(request)` |
| Read-only follower that live-tracks another client's run | yes | `apps/web/src/lib/run-state.ts:296-307` polls `/events?sinceSeq` every 2000 ms while `access === "read_only"`; projection at `:216-223` |
| Access mode derived from a read, not a speculative mutation | yes | `apps/web/src/lib/session-controller.ts:179-183`; `WriterSession.observe` at `apps/web/src/lib/writer-session.ts:64-66` |
| Incremental, contiguous, replayable event stream | yes | `packages/runtime/src/types.ts:165-177`; contiguity enforced `packages/runtime/src/events.ts:42-45` |
| Single-writer lease | yes, as a **concurrency** guard | `packages/runtime/src/errors.ts:37-44`; `apps/server/src/service.ts:395-399`; atomic storage predicate `docs/branch-runtime.md:198-201` |
| Any authentication, authorization, identity, or session token | **no** | grep `authorization\|bearer\|authenticate\|login\|password\|jwt\|cookie\|x-api-key` over `apps/*/src packages/*/src` → 0 hits |
| Realtime transport (WebSocket / SSE) | **no** | grep `websocket\|EventSource\|text/event-stream` → 0 hits; every live path is HTTP polling |
| Any role, vote, overlay, invitation, cohort, relay, arena, twitch, academy identifier | **no** | grep `spectator\|participant\|overlay\|twitch\|academy\|arena\|vote\|invitation\|invite\|relay\|cohort` over `apps/*/src packages/*/src` → prose at `App.svelte:260` and `@lichess-org/chessground` package names only |
| PGN **export** | yes | `apps/server/src/rest.ts:435-446`; pack-merged export `apps/server/src/service.ts:381-387` |
| PGN **import** (the Arena return leg) | **no** | grep `parsePgn\|importPgn\|readPgn` over `apps/*/src packages/*/src` → test files only; the `chessops/pgn` dependency is present but has no production reader |
| Multi-run / match / event aggregate (two legs, cohort, schedule) | **no** | `apps/server/src/storage.ts:13-21` `RunSummary` is per-run; no table, type, or route above the run |

### Verdict — what the single-writer lease permits and forbids

**Permits.** Exactly one writer per run, checked before every mutation and
re-asserted atomically inside the SQLite `UPDATE` (`service.ts:395-399`,
`docs/branch-runtime.md:198-201`). Unlimited concurrent readers, because no read
route requires `x-writer-id` (`rest.ts:426-446`, `:528-536`). A client can learn
whether it is writer or follower by reading the graph before mutating
(`session-controller.ts:179-183`). **A host owning the board while an arbitrary
number of spectators follow is therefore already the shipped shape** — the
follower poll at `run-state.ts:296-307` is a working spectator client today.

**Forbids / cannot express.**

1. **No transfer, expiry, renewal, or steal** (`docs/branch-runtime.md:236-237`).
   A coach cannot hand the board to a participant; the streamer who clears
   `localStorage` loses write authority on that run permanently.
2. **No second writer role.** Every mutation is the lease holder's. "Participant
   proposes a move" and "chat votes on a move" have no representation: the only
   move-bearing events are `move.committed` and `opponent.move_selected`
   (`types.ts:106-115`), both writer-authored.
3. **No identity.** The writer id is a client-minted UUID
   (`writer-session.ts:19-24`) stored under a per-run `localStorage` key
   (`:8-10`). There is no user, display name, or cross-run continuity, so roles
   cannot be *assigned to people* — there are no people in the model.
4. **It is not an authorization mechanism, and today it authorizes nothing.**
   The active writer id is published verbatim to every unauthenticated reader:
   `service.ts:258` on `GET /runs/:id/graph` and `storage.ts:20` on every
   `GET /runs` summary (`rest.ts:402-405`). The check is string equality with a
   request header (`errors.ts:37-44`) and there is no other check. Any spectator
   who can read the run list can copy the lease into `x-writer-id` and hold full
   write authority. Client read-only mode (`run-state.ts:248-250`) is a UI
   convention, not a boundary. **Consequence: exposing a run to an untrusted
   audience requires a capability/authorization layer before any B5 surface is
   real. This is a prerequisite, not polish.**

### Verdict — is a spectator-safe projection safe to build today?

**For evidence: yes, safe by construction.** `feedbackIsRevealed(pack, run)`
(`apps/server/src/feedback-policy.ts:11-15`) takes no viewer parameter, and every
read path applies the identical filter: `publicNodes` (`:17-32`), `publicEvents`
(`:42-60`), `comparisonWithoutEngineFeedback` (`service.ts:60-89`), `evidence()`
returning an empty page (`service.ts:322-329`), `applyEvidence` raising
`FEEDBACK_WITHHELD` (`service.ts:339-344`). A spectator can never observe engine
evidence the player cannot, so the leak channel the anti-contamination law fears
is closed. Defence in depth is real: engine evidence enters the log only through
`applyEvidence` → `attachEvidence` (sole non-test caller `service.ts:354`),
gated before reveal — the node/event filters guard a state that cannot arise.

**For write authority: no.** See lease point 4. A "read-only view" handed to a
stream chat today is a write credential.

**Two things the current barrier cannot express, both load-bearing for B5.**
(a) The streamer-overlay case — audience sees evaluation while the streamer
plays blind — is inexpressible, because withholding is a property of the *run*,
not of the *viewer*, and the latch is run-global and monotonic
(`feedback-policy.ts:12-14`: any one `checkpoint.reached` reveals engine
evidence for the entire run). (b) Authored prose is withheld from *everyone*
including the host (`docs/drill-client.md:92-96`), so "coach reveals the
authored claim to the class now" has no server path. Both are the per-scope
reveal contract the withdrawn `authoring-contracts-v03` review already named
(`design/BACKLOG.md` row *Authored explanation vocabulary*), and both belong to
program item #2, not to a B5 improvisation.

## A3. The gap — per capability, to be minimally real

| Capability | Missing to be minimally real |
|---|---|
| Roles/events plumbing | A session aggregate above the run (id, run ref, host capability, join capabilities, role per capability); a capability-token check on read routes; role-aware projection; a durable record of who did what. None of these types exist. |
| Spectator projection | A share/join entry point (no route parses one — `router.ts:18-27`), a read capability distinct from the writer id, and a spectator screen that is a *projection* of `RunStateSnapshot` (`run-state.ts:34-39`) rather than a second client. The follower loop already exists and should be reused verbatim. |
| Streamer/Twitch | Vote intake (no endpoint, no event), vote-window semantics (open/close/tally/apply-as-host-move), an overlay projection URL rendering board + objective + branch list chrome-free, and the per-viewer evidence scope from #2. Chat ingestion itself is an external adapter posting votes; it must not be a second runtime. |
| Academy/coached | Host-controlled run (shipped: the host is the writer), participant *proposal* channel (absent), spectator follow (shipped), completed-event replay (shipped via `/events?sinceSeq=0`), session→pack distillation (absent; the emitter belongs to #6 and consumes the session record defined here). |
| Arena and events | A match aggregate (two legs, same root, colours swapped) with per-leg state; invitation records; a scheduling record for pack nights; cohort membership. `RunSummary` (`storage.ts:13-21`) is the deepest aggregate that exists. |
| Position Arena minimal-real | (i) invitation containing pack id + version + root FEN — the address grammar already exists unused, see Part B; (ii) an external challenge URL for the opponent's board; (iii) **PGN import** returning the played leg into the run graph for comparison — the single largest missing mechanism, since `parsePgn` has no production caller; (iv) two-leg pairing so the swapped-colour leg compares against the first. Native clocks/matchmaking are additional depth *inside* this surface; `clockState` is already carried opaquely (`docs/branch-runtime.md:249`) so that depth extends the schema rather than re-shaping it. |
| Shareable drill/run URLs | Part B (B8) — the grammar ships, the routing does not. |

## A4. Contracts to pin

Each contract below is quoted against a shipped type, event, endpoint, or lease
semantic. Where a contract cannot be honestly pinned, that is stated with the
thing that would pin it.

**C1 — Session/role model (pinnable now).** A new server aggregate, *not* a run
schema change:

```
Session { id, runId, createdAt,
          capabilities: [{ token, role: "host"|"participant"|"spectator", label? }] }
```

`role: "host"` is defined as *the capability that may present `x-writer-id`*;
it does not replace the lease, it gates access to it. This keeps
`assertActiveWriter` (`errors.ts:37-44`) unchanged and makes the lease a
concurrency guard behind an authorization edge, which is what it already is
minus the edge. It also removes lease point 4 above: `service.ts:258` and
`storage.ts:20` must stop emitting `activeWriterId` to non-host capabilities.

**C2 — The event stream a spectator consumes (pinnable now; explicitly *not* a
new event type).** Spectators consume the existing
`GET /runs/:id/events?sinceSeq=N` → `{events, nextSeq}` (`rest.ts:429-431`,
`service.ts:274-277`) with the existing 2 s follower cadence
(`run-state.ts:301-305`). The projection is `projectRun(events)`
(`events.ts:32`) — the same function the writer uses — which is what makes
spectator views projections rather than a second product.

**C3 — Where session/role events live (a decision this dossier takes).**
`DrillRunEvent` is a closed union (`types.ts:165-177`) *and* a closed JSON
Schema enum (`schemas/drill_run.schema.json:254-267`). Putting `vote.opened` /
`vote.cast` / `role.granted` in the run log would need a run-schema bump *and*
would place role traffic behind the withholding truncation in `publicEvents`
(`feedback-policy.ts:54-55` stops the whole stream at the first withheld event).
**Recommendation: a separate session event log, joined by `runId` and run event
`seq`.** Run semantics stay chess-only, votes cannot corrupt replay
(`docs/branch-runtime.md:132-139`), and the barrier polices one vocabulary. A
vote's applied outcome enters the run log as an ordinary host `move.committed`.

**C4 — Overlay projection (pinnable now).** A read capability plus a render
mode over the same `RunStateSnapshot` (`run-state.ts:34-39`) — active-node FEN,
objective state, branch cards (`screen-model.ts:107-124`), timeline (`:91-105`).
No new data contract: a route and a chrome-free layout. It consumes the spectator
capability so it inherits C1's evidence scope rather than defining its own.

**C5 — Position Arena external handoff (partly pinnable).** Pinnable: the
invitation payload is `{packId, version, rootFen, side, matchId, leg}` and the
archived match shape `archive/brief-v2/schemas/position_arena.schema.json`
already carries `legs[].externalChallengeUrl`, `legs[].pgn`, `legs[].result` —
a two-leg record with an external-URL slot and a PGN return slot, which is
exactly the minimal-real scope. Pinnable: each returned leg is a PGN body parsed
with `chessops/pgn` and replayed with `commitMove`
(`docs/branch-runtime.md:56-66`) into **one** run whose `startFen` is the match
root — the two legs become two branches forked at the root node. This is a
correctness constraint, not a convenience: `compare(run, branchA, branchB)`
requires both branches to share a fork node *within a single run*
(`docs/branch-runtime.md:143`), so importing the legs as two separate runs would
leave them uncomparable by every shipped mechanism. Both legs are legal
continuations of the same root position, so one-run-two-branches is exact, not a
workaround. **Not honestly pinnable
yet:** the exact external challenge-link format. The archive asserts Lichess
custom-position challenge links are the cheap first implementation
(`archive/brief-v2/11_HUMAN_POSITION_ARENA.md` §First implementation) but that
is `[P]` desk research and my own recollection of the Lichess open-challenge API
is `[M]`. **What pins it:** one hands-on call against the live Lichess API
creating a from-position challenge and recording the request/response verbatim
in a `design/research/` dossier. Until that exists the contract names the slot
(`externalChallengeUrl`) and the provider adapter behind it, not the URL.

**C6 — Vote semantics (not pinnable yet; names what would pin it).** Open
questions with genuine product content: is the tally advisory to the host or
binding; does a vote window close on time or on a move count; are votes over
*moves* or over *plan classes* (the latter has no shipped vocabulary — plan
classes are stripped from the public pack projection, `docs/drill-client.md:29-31`).
**What pins it:** one authored streamer/academy fixture pack declaring a
checkpoint whose interaction is a vote, so the vocabulary is designed against
content rather than invented. Checkpoint `actions` are already an authored,
client-rendered list (`screen-model.ts:33-39`, `:148-159`), which is the natural
attachment point.

## A5. Slice plan

Ordered. Each slice states its minimal real proof and its acceptance scenario.

| # | Slice | Minimal real proof | Acceptance scenario | Depends on |
|---|---|---|---|---|
| **L0** | **Capability edge + session record** — C1 and C3's session log; read routes accept a capability token; `activeWriterId` stops leaking to non-hosts (`service.ts:258`, `storage.ts:20`) | A run is unreachable without a capability; a spectator token cannot mutate even when it replays a captured `x-writer-id` | Host opens a run, mints a spectator link, second browser follows and is refused on every mutation attempt including a forged header | none |
| **L1** | **Share/spectate primitive** — spectator route + projection reusing the follower loop (`run-state.ts:296-307`) and `projectRun` | Second browser sees moves within one poll interval and sees no evidence the player cannot | Host plays three plies and forks; spectator's board, timeline, and branch rail track it; `/evidence` stays empty for both before checkpoint | L0 |
| **L2** | **Overlay projection** — C4 chrome-free render mode under a spectator capability | Overlay URL renders board + objective + branch list with no navigation and no evidence beyond the spectator scope | Overlay loaded in a 1920×1080 window shows the live position and updates on host moves | L1 |
| **L3** | **Position Arena two-leg external handoff** — invitation payload, `externalChallengeUrl` slot, **PGN import**, both legs imported as two root-forked branches of one match run (C5) | A returned PGN becomes real branch nodes and the two legs compare through the shipped `/compare` | Host creates a match from a pack root, sends the invitation, both legs return PGNs, the swapped-colour leg compares against the first at the shared root fork | L0; PGN import; C5's provider adapter |
| **L4** | **Academy/coached session** — participant proposal channel on the session log; host applies or rejects; completed-event replay | A participant proposal is durably recorded, visible to the host, and applied only by the host's own `move.committed` | Coach hosts, two participants propose, coach applies one, the session record shows both proposals and which was applied; run replay is unchanged chess | L1; C6 |
| **L5** | **Streamer/Twitch mode** — vote windows and tally over the L4 proposal channel; external chat adapter posts votes; overlay shows the tally | Vote opens, N votes land, window closes, host applies the winner as an ordinary move | Streamer opens a vote at a checkpoint, adapter posts 20 votes, overlay shows the distribution, streamer applies the top choice, rewinds, and compares against it | L2, L4 |
| **L6** | **Events and cohorts** — scheduled pack nights, invitations to a cohort, team relay as an ordered host rotation over one session | A scheduled event exists, invitees join with per-person capabilities, and relay rotation reassigns the host capability | Three players relay one run; each holds the host capability in turn; the session record attributes every move to a person | L0, L4; lease **transfer** (below) |

**Lease transfer is a hard dependency of L6 and is absent** (`docs/branch-runtime.md:236-237`).
It is not a B5 invention: it is the "continue on this device" contract the branch
runtime already names as owed. It belongs in L6's slice, scoped as *the host
capability may reassign the active writer id*, which is exactly the operation
the atomic storage predicate already supports.

**Sanctioned early-landing carve-out.** `design/03-product-breadth.md:219-220`
permits roles/events plumbing to land earlier when another RFC needs it. Three
do:

- **#3 general session contexts** lists "sharing, and spectator-safe
  projections" in its own scope (`design/03-product-breadth.md:200-202`). It
  needs **L0 + L1**, in full.
- **#5 review and multi-branch exploration** lists "share/export"
  (`:206-208`) and B3 names share explicitly (`:163`). It needs **L0**'s read
  capability so a shared comparison is not a write credential.
- **#6 creation and curation** owns session-to-pack distillation
  (`:210`). It needs **C3**'s session record to exist so a "completed event"
  is a thing that can be distilled.

Recommendation: **L0 and L1 land with program item #3, not with item #8.** The
rest of B5 stays at position #8 in the ordering. This costs #3 little (L1 is
mostly the already-shipped follower loop) and removes the write-credential leak
from the first surface that hands a URL to another person.

## A6. Dependencies

**In (B5 needs):** per-viewer evidence scope from #2 (streamer overlay, coach
reveal); authored checkpoint interactions from #2/#6 for vote vocabulary (C6);
PGN import (owned here, L3); lease transfer (owned here, L6); the drill/FEN URL
routing from Part B (invitations address a pack+root, not a run).

**Out (B5 supplies):** the read capability every share link in #3 and #5 needs;
the session record #6 distills into a pack; the role model any future hosted
deployment needs (Part B, Q-2).

---

# Part B — Platform and shell residuals (B1/B8)

## B1. Scope

Desktop shell completeness against the IA table
(`design/03-product-breadth.md:131-140`); responsive/PWA region transformation;
self-hosted engines and configured providers; read-only share links;
accessibility; deployment/capabilities honesty; and the ruled deployment
packaging. B1 is recorded **met** in `planning/exploration/gates.md:122`; B8 is
recorded "deployment partial" at `:129`. The findings below say B1's status is
correct and B8's is understated in one direction and overstated in another.

## B2. What ships today

| Capability | Shipped? | Evidence |
|---|---|---|
| Eight IA routes + run route + not-found | yes | `apps/web/src/lib/router.ts:18-27`, `:37`; nav `apps/web/src/lib/ShellFrame.svelte:21-30` |
| Viewport-owning shell, named inner scrollers | yes | `ShellFrame.svelte:83-88` (`100dvh`, `minmax(0,1fr)`, `overflow:hidden`), `:169-172` |
| Desktop viewport regression test | yes, two sizes only | `tests/browser/drill.spec.ts:197-243`; projections `1280×720`, `1440×900` at `:200-203` |
| Keyboard ownership + `g` chords + focus restoration | yes | `docs/app-shell.md:136-161`; `apps/web/src/lib/keyboard.ts` |
| Honest disabled controls with `aria-describedby` + route-wide DOM sweep | yes | `apps/web/src/lib/HonestControl.svelte`; `docs/app-shell.md:164-173` |
| Skip link, `aria-live` regions, `role="alert"` | yes, hand-rolled | `ShellFrame.svelte:52`, `:64`; `WhyBanner.svelte:12`; `DrillScreen.svelte:343`, `:352`; `CompareView.svelte:105` |
| Automated accessibility audit (axe or equivalent) | **no** | grep `axe` over `apps/web/src tests` → 0 hits; coverage is the disabled-control sweep only |
| Capability reporting honest about deployment | yes | `apps/server/src/capabilities.ts:77-113`; `planned` rejected server-side `:59-75`, client-owned `apps/web/src/lib/api.ts:91-97` |
| Settings **reads** provider + surface state | yes | `apps/web/src/App.svelte:270-282` |
| Settings **writes** anything (opponent/rating, feedback/evidence, engines/models, LLM, data, accessibility per `03-product-breadth.md:140`) | **no** | `App.svelte:270-282` contains only `<dl>` and `<ul>`; no input, select, or form control on the route |
| Self-hosted engines (Maia sidecar, Stockfish) | yes | `compose.yaml` `maia` service with readiness healthcheck; `apps/server/src/application.ts:266-279` |
| Configured LLM provider | **no**, honestly | `capabilities.ts:33` types `llm` as the literal `"none"` |
| Compose profiles light vs engines | yes, in the dev compose | `compose.yaml`: server unprofiled (`ENGINE_MODE: mock` default), `maia` under `profiles: [engines]`, `dev` under `profiles: [devcontainer]`; `Makefile` `up` / `up-engines` / `down` |
| GHCR multi-arch images pulled by digest | yes | `.github/workflows/release.yml` (`linux/amd64,linux/arm64`, version + SHA tags, digest-pinned compose rendered and published at the `compose` job) |
| Devcontainer sharing the toolchain | yes | `.devcontainer/devcontainer.json` referencing `../compose.yaml` service `dev`, post-create `ENGINES_REQUIRED=1 make verify` |
| Release compose offers the light profile | **no** | `deploy/compose.release.template.yaml` hardcodes `ENGINE_MODE: maia` and an unconditional `depends_on: maia: condition: service_healthy`; the mock-only shape is dev-compose-exclusive |
| Drill-in-a-URL address grammar (`/drill/:id@:version[/:node]`, `/fen/:fen/:objective`) | **implemented and unused** | `packages/schema/src/drill-pack/urls.ts:71-115`, exported `packages/schema/src/drill-pack/index.ts:10-14`; grep `formatDrillUrl\|parseDrillAddress\|resolveDrillAddress\|formatFenUrl` over `apps/*/src packages/*/src schemas tools` → only `packages/schema/src/drill-pack.test.ts` |
| Router or server handles `/drill` or `/fen` | **no** | `router.ts:18-27` has neither; `application.ts:196-205` `isApiPath` has neither, so those paths fall through to the SPA (`:222`) and render not-found (`router.ts:46`) |
| Read-only share link | **no** | no share route (`router.ts:18-27`); and see Part A — the only run-scoped identifier a client could paste is the run id, whose graph publishes the write credential |
| PWA: manifest, service worker, installability, offline | **no** | grep `manifest\.json\|serviceWorker\|service-worker\|workbox\|vite-plugin-pwa\|apple-touch\|theme-color` over `apps/web/src apps/web/index.html apps/web/vite.config.ts apps/web/package.json` → 0 hits; `apps/web/public/` does not exist; `apps/web/index.html` carries only the viewport meta |
| Responsive region transformation | **partial, CSS-only** | four media queries total: `DrillScreen.svelte:713` (62rem, panes stack, drill region becomes scroller), `:741` (38rem, topbar reflow), `ShellFrame.svelte:174` (60rem, run-context hidden), `CompareView.svelte:468` (48rem). No tabs/sheets model; no phone viewport in any test |
| Browser-run engines (Stockfish WASM / small Maia) | **no** | grep `wasm\|stockfish.js\|onnx` over `apps/web/src` → 0 hits; engines are server-side only (`application.ts:266-290`) |

## B3. The gap

| Capability | Missing to be minimally real |
|---|---|
| Settings as a real surface | Persisted, server-honoured settings for at least: opponent policy mode + target rating (the selector already accepts both, `session-controller.ts:112-131`, `:351-357`), feedback/evidence timing, and accessibility preferences. Today the route reports and cannot change anything, which makes the IA row `03-product-breadth.md:140` nominal. |
| Drill-in-a-URL | Route `/drill/:packId@:version[/:spineNodeId]` and `/fen/:fen/:objectiveType` in `router.ts`, a server `isApiPath`/static passthrough that keeps them SPA-routed, and a start action that creates a run from a resolved address. The parser, validator, and formatter already exist and are tested — this is wiring, not design. |
| Read-only share link | Part A's L0 read capability plus a route that renders the run read-only. Without L0 this cannot ship honestly. |
| PWA / responsive | A manifest, an installability path, a phone region model (the tabs/sheets transformation `03-product-breadth.md:151-152` names), and phone viewports in the projection test. The information model is already regionally decomposed (board/objective, timeline, branch rail, evidence rail), so the transformation is a layout contract over shipped regions, not a re-architecture. |
| Accessibility | An automated audit in the browser job alongside the existing disabled-control sweep; keyboard reachability for the drill's non-chord actions; a stated contrast and reduced-motion posture (`prefers-reduced-motion` has 0 occurrences in `apps/web/src`). |
| Release-time light profile | A second rendered release compose (or a profile in the existing one) that runs mock-opponent-only, matching the dev compose's two-mode shape. Today a self-hoster following the release artefact must run Maia. |
| Browser-run engines | Not required for any B-gate row and not claimed by capabilities (`capabilities.ts:33`). It is a *deployment option* for the ruled self-hosted posture, scheduled in P4 below as the Docker-less escape the engine-workers ruling already named (`planning/archive/engine-workers/log.md`, 2026-08-12 owner rulings: "ONNX/browser path remains the Docker-less escape"). |

## B4. Contracts to pin

**P-C1 — Share address (pinnable now).** Reuse the shipped grammar verbatim:
`formatDrillUrl(packId, version, spineNodeId?)` → `/drill/<id>@<version>[/<node>]`
and `formatFenUrl(fen, objectiveType)` → `/fen/<fen>/<objective>`
(`urls.ts:71-86`), resolved by `resolveDrillAddress` (`:123-156`). Note the
shipped constraint that these addresses forbid query and fragment
(`urls.ts:89-91`) — a capability token must therefore travel as a path segment
or a separate route, not as `?token=`. This is a real, already-encoded design
consequence and should be honoured rather than quietly relaxed.

**P-C2 — Run share address (pinnable after A/L0).** `/share/:capabilityToken`
resolving to a read-only projection of one run. It must not be
`/play/run/:runId` with a flag: that route's controller claims or observes a
lease (`session-controller.ts:179-183`) and its graph read exposes
`activeWriterId` (`service.ts:258`).

**P-C3 — Responsive region contract (pinnable now).** The named regions already
exist as components — board/objective (`DrillScreen.svelte`), timeline
(`Timeline.svelte`), branch rail (`BranchRail.svelte`), evidence/why
(`WhyBanner.svelte`), comparison (`CompareView.svelte`). The phone contract is:
same components, same props, one visible at a time behind a tab/sheet selector;
`ShellFrame`'s `100dvh` grid (`:83-88`) is retained. Proof obligation: the
existing viewport assertion (`tests/browser/drill.spec.ts:197-243`) extended to
a phone projection, asserting no document scroll and every region reachable.

**P-C4 — Settings persistence (pinnable now).** Per-deployment server state,
not `localStorage`: the server is already authoritative for feedback timing
(`docs/drill-client.md:76-78`) and selector policy (`rest.ts:406-418`).
Client-only settings would recreate the client-side-hiding anti-pattern the
withholding barrier exists to avoid.

**Not pinnable yet: whether the PWA is installable-offline or merely responsive.**
That is Q3 (below), not an encoding question.

## B5-slices. Slice plan

| # | Slice | Minimal real proof | Acceptance scenario | Depends on |
|---|---|---|---|---|
| **P1** | **Drill-in-a-URL routing** — wire the shipped grammar into `router.ts` and the SPA passthrough | Pasting `/drill/<pack>@<version>` starts a run at that pack; `/fen/<fen>/<objective>` starts a pack-optional run | Owner pastes a spine-node drill URL into a fresh browser and lands in a playable run; an invalid FEN renders not-found, not a crash (`urls.ts:49-55` already throws) | pack-optional runs from #3 for the `/fen` leg |
| **P2** | **Settings as a real surface** — persisted opponent mode/rating, feedback timing, accessibility prefs | Changing opponent mode changes the selector's next reply; reloading preserves it | Owner sets `strong_engine` and target rating, plays one ply, and the recorded `policyConfig` provenance reflects it | none |
| **P3** | **Responsive/PWA region transformation** — P-C3 tabs/sheets, manifest, phone projection test | Every drill region reachable on a 390×844 viewport with no document scroll | Owner runs one full checkpoint→rewind→branch→compare loop on a phone-sized viewport | Q3 ruling only for the *offline* question; the responsive obligation does not wait on it |
| **P4** | **Deployment completeness** — light release profile; browser-engine option as the Docker-less path | A self-hoster can run the published release without Docker-hosted Maia and sees honest `providers` | Release compose brought up in light mode serves a playable mock-opponent run; `/capabilities` reports `mock`, never `maia` | none |
| **P5** | **Accessibility audit in CI** — automated audit in the browser job | The audit runs on every route and fails on new violations | Browser job reports zero critical violations across all nine routes | none |

**Minimal PWA obligation regardless of how Q3 resolves.** Q3 is open
(`planning/exploration/plan.md:23`, `:109-119`). Its two live answers are
"responsive web is enough" and "PWA/installable". Neither answer removes the B8
row's *region transformation* clause (`design/03-product-breadth.md:151-152`,
gate row `:168`). So P3's floor is fixed independent of Q3: **every shell route
and every drill region is usable at a phone viewport with the same information
model, proven by the existing viewport assertion extended to a phone
projection.** What Q3 decides is only whether a manifest, install prompt, and
offline caching are added on top. Mobile-*native* remains a non-goal
(`design/02-product-shape.md:47-50`) and P3 does not touch it.

## B6. Dependencies

**In:** pack-optional runs from #3 (for `/fen` addresses); A/L0's read
capability (for share links); nothing else — P2, P4, P5 are independent and can
run in parallel with any other program item.

**Out:** P1 supplies the invitation addressing every Position Arena invitation
needs (A/L3); P-C1's no-query-string constraint constrains every capability
token in Part A; P2 supplies the settings surface #2's evidence-layer controls
and #4's difficulty/rating controls will both extend.

---

# Proposed `design/BACKLOG.md` row edits

Rows are quoted by their first cell and replaced verbatim. These are proposals;
the ledger is edited centrally.

**§Breadth-first product surfaces**

- `| Streamer/Twitch mode |` →
  `| Streamer/Twitch mode | 📜 scheduled — program item #8, slices L2/L5 (`planning/breadth/live-and-platform.md`). Real host board + chat-vote intake on a session log separate from the run log + chrome-free overlay projection + rewind/branch/compare. Blocked on the read-capability edge (L0) and the per-viewer evidence scope from item #2 | `03-product-breadth.md`, `planning/breadth/live-and-platform.md` |`
- `| Academy/coached sessions |` →
  `| Academy/coached sessions | 📜 scheduled — program item #8, slice L4. Host = lease holder (shipped); participant proposals recorded on the session log; spectator follow reuses the shipped 2 s follower loop; distillation emitter belongs to item #6 and consumes the session record pinned in C1/C3 | `03-product-breadth.md`, `arch/11`, `planning/breadth/live-and-platform.md` |`
- `| Position Arena |` →
  `| Position Arena | 📜 scheduled — program item #8, slice L3. Minimal-real scope IS two-leg external handoff: invitation (packId+version+rootFen) → external challenge URL → **PGN import** → paired comparison. PGN import is the missing mechanism (`parsePgn` has no production caller). Native clocks/matchmaking are added depth inside this surface, not a separate one; `clockState` is already carried opaquely | `03-product-breadth.md`, `arch/11`, `arch/rfcs/RFC-0007`, `planning/breadth/live-and-platform.md` |`
- `| Share/spectate/deep links |` →
  `| Share/spectate/deep links | 📜 scheduled — program item #3 (carve-out L0/L1), not item #8. **Correction of record:** a run link is currently a write credential — `GET /runs/:id/graph` and `GET /runs` publish `activeWriterId`, and the lease check is header string equality. A read capability distinct from the writer id is a prerequisite for any share surface | `03-product-breadth.md`, `planning/breadth/live-and-platform.md` |`
- `| Drill-in-a-URL |` →
  `| Drill-in-a-URL | 📜 scheduled — program item #1 residual, slice P1. **Half-shipped:** the address grammar, validator, and resolver exist and are tested (`packages/schema/src/drill-pack/urls.ts`) but have zero production consumers; neither the client router nor the server routes `/drill` or `/fen`. Note the shipped constraint that these addresses forbid query and fragment, which constrains capability-token placement | B8, `03-product-breadth.md`, `planning/breadth/live-and-platform.md` |`
- `| Full-spectrum application shell |` →
  `| Full-spectrum application shell | 📜 partially implemented 2026-08-11 (`docs/app-shell.md`): eight routes, viewport ownership, keyboard ownership, honest capability reporting, honest disabled controls. Residuals scheduled as program item #1 slices P2–P5: Settings is read-only and writes nothing; no responsive/PWA region transformation (4 CSS media queries, no phone viewport tested, no manifest); no automated accessibility audit | `03-product-breadth.md`, `02-product-shape.md`, `planning/breadth/live-and-platform.md` |`

**§Open shape questions**

- `| Deployment packaging — root compose.yaml (server + healthchecked Maia sidecar), GHCR multi-arch images pulled by digest, compose profiles (light vs engines), devcontainer sharing the same toolchain (kills the machine-lacks-stockfish class of gate failures) |` →
  `| Deployment packaging — root compose.yaml, GHCR multi-arch digest-pinned images, compose profiles, shared devcontainer toolchain | ✅ implemented 2026-08-11/12: `compose.yaml` (unprofiled mock server, `engines` profile with healthchecked Maia, `devcontainer` profile), `.github/workflows/release.yml` (amd64+arm64 → GHCR, digest-pinned `deploy/compose.release.template.yaml`), `.devcontainer/devcontainer.json`. One residual scheduled as slice P4: the **release** compose has no light profile — it hardcodes `ENGINE_MODE: maia` and an unconditional Maia dependency, so a self-hoster following the published artefact must run Maia | `docs/development.md`, rulings in `planning/archive/engine-workers/log.md`, `planning/breadth/live-and-platform.md` |`
- `| Browser-run engines (stockfish WASM; small Maia via web runtime) |` →
  `| Browser-run engines (stockfish WASM; small Maia via web runtime) | 📜 scheduled — program item #1 residual, slice P4, as the Docker-less deployment escape the 2026-08-12 Maia ruling already named. Not required by any B-gate row and not currently claimed: `capabilities.ts` types `llm` as `"none"` and engines are server-side only. Complements ADR-0004; the run's `policyConfig.locus.executedAt` already admits `"browser"` so provenance needs no change | Q2, `arch/12`, `research/competitor-value-props.md`, `planning/breadth/live-and-platform.md` |`
- `| Viewport-contained desktop app shell |` →
  `| Viewport-contained desktop app shell | ✅ implemented 2026-08-11 (`docs/app-shell.md`): one `100dvh` grid, named inner scrollers, board bounded on both axes, regression-tested at 1280×720 and 1440×900. The separately-designed responsive/mobile fallback named in this row is the outstanding half and is scheduled as slice P3 | Q9, `02-product-shape.md`, `planning/breadth/live-and-platform.md` |`

**§Deferred implementation depth** — the section title itself violates the
standing no-deferral ruling for surfaces that remain in breadth architecture.
Proposal: retitle to **`## Depth added inside a shipped surface`** with the
lead sentence *"These are refinements of a surface whose minimal-real version is
scheduled elsewhere; they are not postponed surfaces."* Row edit in this
dossier's scope:

- `| Native Position Arena matchmaking/clocks/moderation (external handoff remains a breadth requirement) |` →
  `| Native Position Arena matchmaking/clocks/moderation | 📐 depth inside program item #8 slice L3, whose minimal-real version (two-leg external handoff + PGN return) is scheduled and must not be erased when native depth is added. `clockState` is already carried as opaque node data, so clocks extend the shipped schema rather than amending it | `arch/rfcs/RFC-0007` sketch, `arch/11`, `arch/schemas/position_arena.schema.json`, `planning/breadth/live-and-platform.md` |`

The remaining row in that table (bulk corpus ingestion) is item #6's and belongs
to `create-and-return.md`.

---

# Owner-level questions

**Q-1 — Do multi-human features assume a hosted deployment, and does that
collide with ADR-0004 (local-first)?** Q2 settled deployment as **self-hosted**
(`planning/exploration/log.md`, 2026-08-12 session 1 — 14: "AGPL-3.0 /
self-hosted / free / original-prose+CC0-data"). A streamer's chat, an academy's
participants, and an Arena opponent are all people on other machines reaching one
instance. Self-hosted admits that, but the shipped server has no authentication
or identity and publishes every run's write credential to every reader
(`service.ts:258`, `storage.ts:20`, `errors.ts:37-44`) — and ADR-0004's revisit
trigger is literally *"multi-user/SaaS posture chosen in Q2"*. **The fork:**
(a) *trusted-network self-hosted only* (a coach's club instance, a streamer's own
box), where L0 is a capability edge and not an account system; or (b) *public
exposure*, where accounts, transport security, and abuse handling enter the
program and ADR-0004's trigger has fired. The slice plan assumes (a): the answer
changes L0's size, not its position.

**Q-2 — Q3 (mobile): does the PWA get an offline story or only a responsive
one?** The responsive region transformation is owed either way (P3, fixed floor
above). Genuinely undecided: whether Tabiya installs and runs a rehearsal without
the server — a product-identity question, because offline play needs the
browser-engine path (P4) *and* a client-side run log, i.e. a second write locus
against the single-writer lease. **The fork:** (a) responsive-only — P3 ships
layout, browser engines stay a hosting-cost option, the server stays sole writer;
or (b) offline-capable — P3 and P4 couple and the lease/storage contract gains an
offline-then-reconcile case `docs/branch-runtime.md:236-237` explicitly lacks.
Answer before P3 starts so the region work is not redone.

No other owner ruling is required. Everything else in this dossier is
implementation sequencing against contracts that can be pinned from shipped code.
