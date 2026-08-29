# Live, casting, following and social play — the user's side

**Question (owner, 2026-08-24):** *"we need to go from a user perspective per feature… what do
they expect, what do competitors do, PROPER UX."* And, naming the failure exactly:
*"streamer/casting/etc it's just a form you fill in with ZERO info on what it is… no screens, no
explanation."*

**Scope:** watching a live game, following a broadcast, casting to an audience, streamer mode, and
playing another human — specified from the user's side, per feature, in three passes: what a user
expects, what competitors do, what we should do and why it differs.

**Status:** code arms `[V]` at HEAD (`f2ddba55`, 2026-08-24); competitor arms `[P]`/`[V]` inherited
from eight landed dossiers, **none of them hands-on with a live product UI**; the recommended UX is
`[M]` design argument built on those two. Three owner decisions are named and not made.

---

## Verdict

**The owner's complaint understates the problem by one level.** The casting form is not a form with
no explanation — it is a form whose two controls jointly decide a product outcome that neither
control names, offered from a list of runs most of which will fail, with no error path when they
do. Verified below at `App.svelte:1058-1060` and `live-session.ts:79-81`.

Four findings carry this document.

**1. The explanation primitive already exists, is build-enforced, and fires only on refusal.**
`HonestControl.svelte` plus the `aria-describedby` + `class="honest"` dialect appear **43 times** in
`apps/web/src`, and `expectDisabledControlsExplained()` **fails the build** when a disabled control
carries no rendered reason (`screens.test.ts:64`, asserted at `:655`, `:734`;
`app-shell.test.ts:176`, asserted at `:258`, `:296`, `:336`) `[V]`. So the repo has already decided
that *a control the user cannot use must say why* — and has never decided that *a surface the user
is being offered must say what it is*. **The gap is not a missing component. It is one missing
clause in a contract that is otherwise enforced by a test.** §9 specifies that clause.

**2. There is no viewer.** `PublicTokenRecord` admits exactly two scopes — `story_read` (a
finished, disclosed run's story card) and `session_join` (*"an invitation to authenticate as
oneself"*) — `storage.ts:168-169` `[V]`. `design/02:101-103` states the rule as intent: *"the only
anonymous access is a scoped token (`story_read`, `session_join`)"* `[V]`. **Nobody without a
Tabiya account can watch a live Tabiya board, by construction.** `design/03:83` promises *"Viewers
do not need full synchronized clients"* and `:90` promises *"spectator-safe read-only views are
platform primitives"*; both are true of client *complexity* and false of *access*. That is a
design-tier gap (§13), not an implementation bug, and it is the single largest hole in the live
half of this scope.

**3. Casting's differentiator is not the vote — it is the rewind, and nothing in the interface says
so.** The corpus records the whole chat-vote category as solved and entertainment-only: Chess vs
Chat ships chat-typed moves, per-turn tallies, named voters and moderation sync `[V] desk`, and the
sweep's own closing sentence is *"Nobody ships host-side rewind / branch / teach semantics;
chat-vote entertainment is the whole category"* (`coverage-gap-sweep.md` cluster 5, quoted in
`broadcast-and-teacher-surfaces.md` §5) `[P]`. We ship the half nobody has. Our overlay renders it
as `{branches.length} branches` (`App.svelte:1075`) `[V]`.

**4. [[D1414]] breaks the one honest sentence the returned RFC left standing.**
`rfc/social-play.md` §5 specifies a **fixed, non-configurable** header line for every
`kind === "match"` session: *"**Casual private match** · no clock · no rating · no fair-play
enforcement"*. Native-first builds rated and clocked human play here, so from 1.0 that fixed
sentence is false for exactly the games it was written to protect. The honest label must become a
**projection of the session's actual terms**, not a constant — and the same repair covers the
provider case the returned RFC already handled. §7.3.

**And one thing to fix before any of it can be built.** [[D1451]] found that
`rfc/live-following.md` criterion 12 fences the casting screen out. Read exactly, the finding is
sharper than a scope conflict and is about the **instrument**: the criterion's *words* are already
scoped — *"no stream-side surface, chat-bridge, OAuth or editorial-delay symbol is introduced **by
this RFC's implementation**"* (`:528`) — but its *mechanism* is *"a grep assertion"*, and a grep
over the tree cannot distinguish a symbol this RFC introduced from one another lane did `[V]`. The
fence was drawn correctly for a document that deliberately did not build casting; [[D1272]] then
gave casting its own lane, so the two are now in the same tree. **Unless the assertion is
diff-scoped, the explained casting screen fails the suite the moment it is written** — the surface
is not merely unbuilt, it is illegal (§11, §13 Q7).

**Recommended, in one line:** ship an **audience preview** — one button, on the host's own screen,
that renders exactly what a viewer sees — because it answers *who can see this* and *what do they
see* by showing rather than by copy, and it is the direct transformation of "a form with zero info".

---

## 0. Method, scope, and the honesty ledger for this dossier

**Code arms `[V]`.** Every code claim below was read at `HEAD` (`f2ddba55`, 2026-08-24) at the cited
file and line. Where a landed dossier's measurement has since moved, this document says so and
carries the correction (§12).

**Competitor arms.** Nothing new was fetched. Every external claim is inherited from
`live-relay-as-drill-source.md` (endpoints exercised by curl 2026-08-16),
`broadcast-and-teacher-surfaces.md`, `social-play-and-event-boundary.md`,
`league-as-return-loop.md` (league pages and `Lichess4545/heltour` fetched),
`competitor-play-ux.md` (lila SCSS/Scala fetched as primary source), `competitor-matrix.csv`,
`coverage-gap-sweep.md` and `teardown-taketaketake-desk.md`. **Their own limits are inherited with
them and are load-bearing here:**

- **Not one of those dossiers is hands-on with a live competitor UI.** `competitor-play-ux.md`
  states it outright — *"Browser driving was unavailable this session… the strongest label here is
  `[V]`-fetched-primary-source, not `[V]`-hands-on"*. Every screen-anatomy claim about Lichess and
  chess.com below is therefore `[P]` unless it is quoted from lila source.
- **The overlay has never been looked at by a human in this repo's record** —
  `broadcast-and-teacher-surfaces.md` §9: *"no OBS capture of `/live/overlay/:runId`, no two-account
  academy session, no relayed vote."* Every claim about how the overlay *feels* in this document is
  `[M]`; only its rendered element set is `[V]`.
- **No streamer was asked.** `live-relay-as-drill-source.md` §5, verbatim. This dossier proposes a
  streamer experience with **zero streamer testimony behind it**, which is its largest weakness and
  is why §15 names the cheapest instrument that would fix it.

**Recommendations are `[M]`.** Where a recommendation would change intent, it is routed to §13 as
an owner decision and not written into `design/`.

---

## 1. The shipped state from the user's side, measured

### 1.1 The whole casting product is two `<select>`s, and neither names its outcome

`App.svelte:1058`, verbatim structure `[V]`:

```
Kind  [ Stream | Academy | Match / Arena ]
Board [ Host directed | Free claim | Rotation | Native two-player match ]
Classroom (optional) [ … ]     Schedule (optional) [ datetime-local ]
```

then `App.svelte:1060`, a list of every run where `viewerRole === "host"`, each with a button
reading `Create {liveKind}`. The page's only prose is its heading — *"Rehearse with other people."*
(`:1031`) — and one honest line at the foot, *"Vote tallies are advisory. Chat identity is only as
trustworthy as the configured adapter."* (`:1061`), which explains a mechanic the user has not yet
reached. `[V]`

**The two selects jointly decide the product, and neither says so.** `[V]`

| Kind | Board | What the user actually gets |
|---|---|---|
| `match` | `match` | a **native two-human game** — `match_states` row, `storage.ts:2980` |
| `match` | anything else | a **two-leg Position Arena** — two `arena_legs` rows seeded, PGN paste-back, `storage.ts:2982-2984` |
| `stream`/`academy` | `match` | **refused**: *"match board control requires match session kind"*, `live-session.ts:79` |

So a user who reads "Match / Arena" as *"I want to play my friend"* and leaves **Board** at its
default `host_directed` receives an Arena: two empty legs waiting for someone to paste a PGN of a
game played somewhere else. That is not a degraded version of the intent; it is a different
feature. **The default value of the second control silently inverts the meaning of the first.**

**And the eligible-run rule is invisible until it fails.** A native match additionally requires an
untouched `position` run — `live-session.ts:81`: *"A native match requires an untouched position
run"* — and at least one named player handle (`:84`). The list at `:1060` offers **every** hosted
run with no eligibility marking. `createLive` (`:616`) has no `try`/`catch` and is invoked as
`void createLive(item.id)`, so a rejected creation produces an unhandled rejection and **no
rendered message at all**. `[V]` The user presses a button and nothing happens.

**The title is not askable.** `createLive` sends `title: \`${liveKind} session\`` (`:616`) `[V]`.
Every stream a person ever hosts is called *"stream session"*, and the session list at `:1059`
renders that title as its `<h3>`.

### 1.2 The explanation primitive exists, is enforced, and fires only on refusal

`apps/web/src` contains **0** occurrences of `tooltip`, `Callout`, `InfoPanel`, `Explainer`,
`Onboarding`, `firstRun`, `HelpText`, `Popover` or `Coachmark` `[V]`. It contains, instead, a
house-specific pattern used **43 times**:

- `lib/HonestControl.svelte` — 19 usages; renders a `<span class="reason">` while disabled and
  hands the child an `aria-describedby` id `[V]`;
- the inline dialect — 33 `aria-describedby` occurrences paired with 43 `class="honest"`
  occurrences, including four on the live surfaces themselves (`App.svelte:1067`
  `"offer-readonly"`, `"proposal-disabled"`, `"vote-disabled"`; `:1068` `"invite-disabled"`) `[V]`;
- and a **build gate**: `expectDisabledControlsExplained()` (`screens.test.ts:64`,
  `app-shell.test.ts:176`), asserted in five places, fails a disabled control with no rendered
  reason `[V]`.

**This is the finding that reframes the owner's complaint.** The product does not lack an
explanation mechanism, a house style, or the discipline to enforce one. It has all three, aimed at
exactly one moment — *the moment a control is refused* — and pointed at no other. Every one of the
four honest lines on `/live/session/:sessionId` explains why a button is greyed out. Not one
explains what a stream is, who can see it, or what it records. §9 proposes extending the contract
rather than inventing a component, because inventing a component here would be the second mechanism
for a job the first one already half-does.

### 1.3 Nobody without an account can watch anything live

`PublicTokenRecord` (`storage.ts:168-169`) `[V]`:

- `story_read` — `{runId, branchId}`, minted by the host, read through `/shared/:token`;
  `publicStory` (`service.ts:915`) serves a **story**, which requires the run to be terminal and
  disclosed;
- `session_join` — `{sessionId, matchSlot, invitedRole, invitedHandle, expiresAt, usesRemaining}`;
  `publicJoin` (`live-session.ts:167`) returns **only** `{title, hostHandle}`, and
  `docs/live-sessions.md` states the anonymous join page *"renders only the session title, host
  handle, and sign-in/register form—never a FEN, move, or evidence."* `[V]`

There is no third scope. `/live/overlay/:runId` authenticates with the ordinary cookie —
`broadcast-and-teacher-surfaces.md` §3.3 `[V]`: *"the overlay authenticates with the ordinary cookie
inside the OBS browser source's own jar; **no token travels in the URL**, because
`parseDrillAddress` forbids query and fragment"* (`packages/schema/src/drill-pack/urls.ts:88-91`).

**Two consequences the interface never states.** First, the overlay is a **capture surface for the
host's own OBS**, not a page an audience opens — and the host must sign in *inside OBS's browser
source* for it to render at all, a step no document, tooltip or label anywhere mentions (`obs`,
`browser source` → **0** matches repo-wide `[V]`). Second, "spectator" in this product means *an
authenticated learner holding a run grant*, which is a fundamentally different object from what the
word means on Lichess, on Twitch, or in `design/03:83`.

### 1.4 The overlay renders five things, and its headline is an internal enum

`App.svelte:1075`, exhaustively `[V]` — a disabled `<Chessboard>` with relayed mark overlays, then
an `<aside>` containing: `Tabiya live` (eyebrow); `<h1>{node.objectiveState}</h1>`; `{n} branches`;
`markAttribution(...)`; the vote prompt, tally rows and `voteAttribution(...)`; and, when truncated,
*"Host is ahead; evidence is withheld until this run discloses."*

The largest text on the broadcast surface is `node.objectiveState` — a raw runtime enum, rendered
untranslated, to an audience that has no way to learn what its values mean. `[V]`

### 1.5 The audience cannot act, and the session's one lifecycle cannot move

- **`castVote` has no client caller.** It exists at `api.ts:867` and `:1174`, and is called from no
  `.svelte` file `[V]`. Every vote surface that ships is the **host's editor**; nobody can cast one
  from a browser. `mechanics-by-mode.md` §2.5 recorded this as *"`castVote` has 0 client callers"*
  and it is unchanged.
- **The relay path is host-only by design and unbuilt in fact.** `live-session.ts:212` permits a
  `voterKey` only from the configured adapter learner, namespaced `chat:<adapter>:<key>`
  (`:214`), capped at 128 chars and 50,000 distinct keys (`:213`, `:216`) `[V]`. Nothing
  authenticates to any chat platform: `twitch`, `youtube`, `oauth`, `access_token`,
  `refresh_token`, `client_secret` → **0 matches across `apps/`, `packages/`, `workers/`,
  `schemas/`, `docs/`** `[V]`.
- **`session_invitations.state` still cannot move.** One producer, a SQL literal
  `VALUES(…,'open',…)` at `storage.ts:3222`; `grep "UPDATE session_invitations"` → **0**; and
  `App.svelte:1068` prints `{invitation.state}` to the host `[V]`. Confirmed exactly as
  [[D1344]] and `rfc/social-play.md` §3.3 record it.
- **`casual` → 0. `no clock` → 0. `increment` → 0. `time control`/`timeControl` → 0.** In
  `apps/web/src`, against `docs/live-sessions.md`'s plain statement that *"Native matches have no
  clocks, ratings, matchmaking pool, resignation event, or agreed-draw event."* `[V]` The
  honest-absence invariant (`design/05:41`, *"Absence is stated, never simulated"*) is documented
  and unrendered. `clockState` exists as an untyped `Record<string, unknown>` passthrough
  (`runtime.ts:342`, `api.ts:672`) that **no web call site ever sets** `[V]`.

---

## 2. Feature A — discovering that casting exists at all

### What a user expects

A person who has streamed anything expects one of two entry shapes, and the field has trained both.
Either **the thing you are doing offers to be shown** — a share affordance on the object itself,
the way a Lichess study or a chess.com game offers share/embed — or **a named destination exists**
that says what it is for. What nobody expects is to discover a broadcast feature by opening an
unrelated area, reading a `<select>` labelled "Kind", and recognising one of its options.

They also expect the entry point to be reachable *at the moment the intent forms*, which for a
streamer is **while already playing or analysing**, not before.

### What competitors do

- **Lichess puts Broadcasts in primary navigation** and runs the aggregation at scale: at one
  arbitrary moment on 2026-08-16, `/api/broadcast/top` reported **67 active broadcasts, 23 with an
  ongoing round** `[V]` exercised (`live-relay-as-drill-source.md` §1.1). Its verdict in our own
  matrix is *"Spectating without any training tie-in"* `[P]`.
- **Chess.com exposes a streamer directory but no feed**: `/pub/streamers` returns *"only usernames,
  avatars and Twitch URLs — a directory of people, not a feed of games"* `[V]` exercised; four
  probes for a live/broadcast endpoint (`/pub/tournament/live`, `/pub/events`, `/pub/broadcast`,
  `/pub/games/live`) all returned 404 `[V]`.
- **Chess vs Chat is discovered as a product, not a mode** — a €3.29 Steam purchase whose entire
  identity is "streamer vs chat" `[V] desk` (matrix row 39). The category's users find it by
  looking for it.
- **Take Take Take makes the share the default beat rather than a feature**: *"The app reads each
  one, picks out the key moments, and generates a short summary you can share with a single tap"*,
  under the framing *"your games deserve an audience"* `[V] desk`. Discovery is not a menu item;
  it is offered at the end of every game.

### What we should do, and why it differs

**Live must become a destination that names its four jobs, and each job must also be reachable from
the object it acts on.** Concretely, three changes, none of them new machinery:

1. **`/live` opens onto four named cards, not a `<select>`** — *Play a friend*, *Teach or coach*,
   *Cast to an audience*, *Follow a live tournament*. Each card carries the five-answer preamble of
   §9. The `Kind`/`Board` pair becomes an implementation detail derived from the card, which also
   dissolves §1.1's silent inversion: choosing *Play a friend* sets `kind: "match"` **and**
   `boardControl: "match"` together, because they were never two decisions.
2. **The intent-side entry ships too.** From a run: *"Show this to an audience."* From a followed
   broadcast board: *"Cast this game."* This is the mechanical form of the owner's own architecture
   ruling ([[D1272]]) — *"streamer/caster modes is a separate thing in the webapp but those need to
   integrate with the live games mechanic…. shit can be separate but integrated"* — with the
   integration expressed as an action on the live object rather than as a shared record.
3. **Eligibility is rendered before the press, not after.** The run list marks which runs can host
   which job and why not, using the shipped `HonestControl` pattern rather than a new one — *"A
   friend game needs a position run with no moves played yet."* This is `expectDisabledControlsExplained()`'s
   existing contract applied to a control that is currently enabled and simply fails.

**Why this differs from the field.** Lichess and chess.com discovery is *spectator* discovery —
find a game to watch. Ours is *host* discovery — find the thing you already have and show it. We
have no audience to route and, per `design/03:384-386`'s standing revival condition, will not have
one until a streamer exists. So the honest 1.0 discovery surface optimises for the host and says
plainly that the audience is people you invite. `[M]`

### Cost and dependencies

Small and self-contained: four cards, one derived-parameter map, and eligibility predicates that
already exist server-side as throw conditions (`live-session.ts:79-86`) and need only to be
readable before the call. No schema, no route, no new capability. **Dependency:** the four cards
cannot be written until §9's five answers exist, because a card whose body is a name is the
`<option>` again with a border.

---

## 3. Feature B — setting up a cast, and the audience relationship

### What a user expects

A streamer's mental model is a **pipeline with a seam**: something in the app produces a video-safe
surface, and something in OBS consumes it. Concretely they expect, in this order: a browser-source
URL they can **copy** (not merely navigate to); a transparent background; a stated size or a layout
that survives arbitrary aspect ratios; and — the one every product forgets — **a way to check what
it looks like from the other side before going live**.

They expect to be told what the audience can and cannot see, because their livelihood depends on
not leaking. And they expect to be told whether the product delays anything, because
stream-sniping is the field's oldest known hazard.

### What competitors do

- **The field's only shipped delay numbers are all upstream, and they are three different
  things** — this document keeps them apart deliberately: Lichess **broadcast `delay`, 0–3600 s,
  set by the organiser at round creation** `[V]` (`schemas/BroadcastRoundForm.yaml`); Lichess
  `/api/stream/game/{id}`, *"**Ongoing games are delayed by 3 moves, as to prevent cheat bots from
  using this API. No more than 8 game streams can be opened at the same time from the same IP
  address.**"* `[P]` read-not-measured; and the same three-ply export delay recorded in
  `social-play-and-event-boundary.md` §1 as *"delayed three plies specifically to reduce cheat-bot
  use"* `[V]`. **None of them is an in-product broadcast delay for a streamer.** The field's answer
  to stream-sniping is the streaming software's own delay, not the chess app's.
- **Chess.com's terms permit exactly one relay channel and forbid the other** `[P]` (fragmentary
  extract, read via fetch-and-summarise, flagged as needing a full read before reliance): §3
  permits *"Recording, relaying, and sharing videos of the use of the Chess.com interface (for
  example in videos for YouTube, on Twitch, etc)"*, while §4(C)/(D) ban robots, retrieval
  applications and AI scraping. **Video out is fine; data out is not.** Our own posture is the
  mirror — we are the source, and our overlay is a video-out surface by construction.
- **Chess vs Chat is the only product in the corpus that ships the streamer's whole loop**, and it
  ships it as entertainment: chat types moves, per-turn tallies with named voters and emotes,
  **moderation synced**, FEN loading `[V] desk`. Matrix row 39's gap column is the sentence that
  matters to us: *"No teach/rewind/branch semantics — entertainment only."*
- Nobody in ~15 named products across three clusters combines a rehearsal runtime with a broadcast
  surface `[M]` synthesis (`broadcast-and-teacher-surfaces.md` §5).

### What we should do, and why it differs

**B1 — the audience preview is the headline feature, and it is the direct answer to the owner's
complaint.** One control on the host's screen: *"See what your audience sees."* It renders the
**exact** viewer surface, inline, live, with a banner naming the viewer's role. Two questions of
§9's five — *who can see this* and *what do they see* — are answered by showing rather than by
prose, and a streamer's actual fear ("am I leaking?") is answered by inspection instead of by
trust. It is also the cheapest possible correctness test for the closed render list that
`rfc/casting.md` §5 makes normative: a host who can see the list can notice an addition to it.

**B2 — the OBS seam gets named, once, with the sign-in step included.** A copyable URL, a stated
transparent background, and one sentence about the browser source's own cookie jar — because
`broadcast-and-teacher-surfaces.md` §3.3's finding (no token in the URL, cookie inside OBS's jar)
is a *usability* fact, not just a security one, and a streamer who does not know it will see a
sign-in form in their scene and conclude the feature is broken. `[M]`

**B3 — there are two delays, one is refused and one is now a ruled, host-set control, and the
interface must not let a user confuse them.**

- **The board is never delayed.** `professional-workflow-conformance.md` §2 argues it should not be
  (*"Adding one would not protect a streamer from themselves and would create a second
  time-dependent projection beside the run's disclosure barrier"*) `[M]`. So the interface says
  it: **"Tabiya does not delay your board. Your viewers see each move as you commit it. If you are
  showing a game that is still being played, set the delay in your streaming software."** Honest
  absence used as instruction rather than as apology, and the only place a user learns the
  constraint at all.
- **The audience's answer is delayed, by an amount the caster sets.** [[D1291]] ⚖️ (owner,
  2026-08-23) rules that **chat votes on a live cast run run at an owner-configurable delay behind
  the tip**, *"defaulting to the standard broadcast delay and adjustable per event or per
  organiser's rules"*, and **discharges `rfc/casting.md` Discharge D3**; the fail-closed refusal on
  *undelayed* live votes stands as the default. So the vote control is a **cast setting with a
  number in it**, and its user-facing form is a plain sentence: *"Votes open N moves behind the
  live game."*

The two must be visually and textually separate, because a user who reads "delay" once will assume
it covers both, and the one it does not cover is the one their audience can see. §12 records the
tension in the source documents that makes this easy to get wrong.

**B4 — the cast's pitch is the rewind.** The audience-facing frame is not *"chat votes on your
moves"* — that is a solved, purchasable, €3.29 category. It is: *the host commits, plays the
consequence, rewinds, forks, and compares, in front of the room.* The overlay's `{n} branches` is
that claim rendered as an integer with no noun; it should read as what it is — attempts preserved,
side by side. `[M]`

### Cost and dependencies

The preview is a route parameter and a frame — the overlay already renders from `session.runState`
with a `projectionOnly` controller (`session-controller.ts:506`), so previewing it costs a second
mount, not a second projection `[V]`. The OBS sentence and the delay sentence are copy governed by
§9. **The dependency that matters is `rfc/casting.md`'s liveness guard**: `sourceGameLive` has
**0 matches in the tree** (`casting.md` §2) `[V]`, so a cast of a *followed* game is not yet lawful
to offer at all, and §5's follow surface must land first or the cast card must refuse followed runs
by name.

---

## 4. Feature C — the viewer's side

### What a user expects

A viewer expects to click a link and see a board. No account, no install, no wait. They expect it
to update itself, to show who is playing and whose move it is, to show a result when there is one,
and — if the host has asked them something — to be able to answer.

This is the least negotiable expectation in the whole scope, because it is the one every chess
product on the internet has met for fifteen years.

### What competitors do

- **Lichess TV is the canonical anonymous viewer**: `/api/tv/feed` declares `security: []`, emits a
  featured-game frame then one FEN/last-move/clock frame per move, and switches games when the
  channel switches; **twelve channels** `[V]` exercised. Broadcast round PGN is likewise
  unauthenticated for public rounds — *"no Authorization header sent"*, 200 `[V]` exercised.
- **ChessEver is the corpus's best pure-viewer product** — multi-board live feed with **clocks and
  eval symbols**, picture-in-picture, player-tracking notifications; matrix verdict *"Spectating
  only — no play, drill, or rehearsal"* `[V] desk`, no hands-on.
- **The vote surface a chat audience expects is the one they already have**: Chess vs Chat renders
  **named voters and emotes** and syncs moderation `[V] desk`. `adoption-audit.md:142` already
  marks per-turn tallies with named voters as **shipped** for us, with *"emote cosmetics are
  polish"* `[P]`.
- **Lichess's whisper channel is the sharpest thing in the corpus about spectator speech** and is
  worth stealing: spectators post in-progress thoughts that **neither player can see, including
  their own, until after the game**, and *"Some players whisper to record their in-game thoughts to
  aid their postgame analysis"* `[V]` (`league-as-return-loop.md` §1.6). That is
  commit-before-you-learn as a folk custom, invented by an audience, with no product enforcing it.

### What we should do, and why it differs

**C1 — a live-view scope, or the promise at `design/03:83` and `:90` should be withdrawn.** This is
the fork, and it is real. Either `public_tokens` gains a **third scope** — call it `live_view`,
run-scoped, host-minted, revocable, capped and expiring like `session_join` already is
(`docs/live-sessions.md` Friend links: one use / 14 d default, 90 d and 50-link caps, revocable,
uniform 404) — or the product should stop describing viewers as people who "do not need
synchronized clients", because today they need an account. **There is no third option that keeps
the promise.** `[M]`

If the scope is built, three rules fall out of already-ruled positions and should be written into
it rather than rediscovered:

- **It renders the closed list and nothing else.** `rfc/casting.md` §5 already makes the overlay's
  seven-item render list normative with a set-equality criterion; the token serves that list.
- **It refuses over a live source.** `casting.md` §3.2 refuses minting a `story_read` token over a
  followed live game because *"the token outlives the session"*; a `live_view` token is worse — it
  is *for* the live board. It must throw `SOURCE_GAME_LIVE` for a cut of a followed source and
  **must not** throw for an ordinary rehearsal run, or casting a solo drill breaks. Two arms; the
  second is the regression guard.
- **It is a link the host can see, revoke, and count.** A share link with no visible revoke is the
  failure mode of every share feature ever shipped.

**C2 — the audience can answer, and the tally says which kind of audience it was.** `castVote`'s
missing client caller (§1.5) is not a viewer feature waiting on a chat bridge; it is the viewer
half of a mechanic that already ships in full server-side. Add the cast surface and a **third voter
class** beside the two that exist:

| class | key | verifiable? | shipped |
|---|---|---|---|
| member | `learner:<id>`, server-derived | yes — a granted account | `live-session.ts:210` `[V]` |
| relayed chat | `chat:<adapter>:<key>`, adapter-submitted | **no** — *"Tabiya cannot verify chat identities"* | `live-session.ts:214`, `live-vote.ts:7` `[V]` |
| link viewer | per-token, anonymous | **no** — one browser, one token | proposed |

Every tally names its class. That extends a shipped honesty pattern — `voteAttribution` already
distinguishes all-signed-in from adapter-relayed from adapter-no-longer-configured (`live-vote.ts:5-8`)
`[V]` — rather than inventing a second one, and it means an anonymous vote can ship *because* it
can be labelled unverifiable rather than in spite of it.

**C3 — the headline stops being an enum.** `<h1>{node.objectiveState}</h1>` is the largest element
on the broadcast surface (§1.4). It should carry the human sentence the run already knows how to
say, and where the run has no objective it should say that — `design/05` §2 region 1: *"With no
pack there is no objective, and the region says that rather than inventing one."*

**C4 — the whisper, and why [[D1291]] makes it coherent rather than refused.** The Lichess whisper
is the best audience mechanic in the corpus: an analysis channel for spectators of a game in
progress, sealed from both players until it ends. Read against `rfc/casting.md` §6 alone it looks
refused — a whisper on a live node is *"the audience collectively computing a position two players
are still playing"*, the same channel votes were refused for. But [[D1291]] did not refuse that
channel; it **priced it**, ruling the audience's answer admissible at a caster-set delay behind the
tip. The whisper inherits the identical treatment: **sealed from the players by construction,
opened at the cast's configured delay, and always available on a released or solo run.** That is
one mechanism with one number, not two features, and the number is already ruled. `[M]`

**C5 — a spectator link cannot be minted today, which is the friend link's other half.**
`mintJoinLink` hardcodes `invitedRole: "participant"` and is rendered only inside
`{#if liveDetail.match}` (`App.svelte:644`, `:1066`) `[V]`. So the one anonymous-ish entry the
product has — a `session_join` token that may grant *"participant or spectator access"*
(`docs/live-sessions.md`) — is reachable **only** as a participant seat, **only** in a native
match. A host wanting to hand someone a watch-this link has no control that produces one. Recorded
in [[D315]] and unchanged. This is smaller than C1 and it is the version of C1 that needs no new
scope: it makes the *authenticated* viewer reachable, which is a precondition for asking whether an
anonymous one should exist.

### Cost and dependencies

The scope is the expensive part and it is not a UI cost: a third `PublicTokenRecord` variant, a
`CHECK` widening on `public_tokens.scope` (a **rebuild** on a STRICT table, the same class
`live-sources` priced for `imported_games.source_kind`), revocation and cap plumbing, the
`ACCOUNT_EXPORT_COLUMNS` join every new column owes ([[D1240]]'s set-equality test), and an
anonymous rate-limit story that does not exist anywhere in the product today. The vote-caster and
the headline sentence are small. **Dependency:** C1 and C2 both depend on §9's viewer-side
preamble, because an anonymous page with no framing is a board floating on the internet with a
Tabiya logo on it.

---

## 5. Feature D — following a live broadcast

### What a user expects

Somebody following a tournament expects a **list of what is on now**, a **grid of boards** inside a
round, clocks, and a click into any board. Then — and this is where our user differs from a
spectator — they expect to be able to **take the position and try it themselves**, which is the
entire reason this surface belongs in a rehearsal product at all.

They expect the game to keep moving while they watch, and they expect the app to be honest about
lag.

### What competitors do

- **Supply is not the constraint** `[V]` exercised: 67 active broadcasts, 23 with an ongoing round,
  at one arbitrary Sunday-afternoon moment; a single round fetch returned **42 games, 42/42 carrying
  `[Result "*"]`**, with FIDE ids, `TimeControl`, `ECO`, `Opening` and `{ [%clk 1:30:26] }` clock
  comments. The streaming variant delivered **82,922 bytes containing 54 `[Event` chunks in 90
  seconds** — the full dump plus 12 update pushes, each push *the entire current PGN of one game*
  keyed by `[GameURL]`.
- **The round is the retrieval unit**: a per-game broadcast endpoint built from the `GameURL` tag
  returned **404** `[V]`. You take all 42 boards and pick client-side — which is why a
  tournament → round → board picker is *"UI that does not exist"* in our import form
  (`live-relay-as-drill-source.md` §2.3(f)) `[M]`.
- **The ecosystem converged before Lichess did.** DGT boards → DGT LiveChess → a **public PGN URL
  that changes** is the actual interchange format; Lichess's own Broadcaster app is a folder
  watcher, and its README frames the service as infrastructure organisers cannot otherwise afford
  `[V]` raw README. **Lichess is the aggregation layer, not the owner** — *"That fan-in is the
  entire value, and it is exactly the work we should not repeat."*
- **Chess.com is a clean no for data and an accidental yes through Lichess**: its PubAPI is
  read-only with a **12-hour cache** and no live endpoint `[V]`; but round `ohv5F74c` is
  `[Event "2026 Esports World Cup Playoffs"]`, `[Site "Chess.com"]`, publicly readable move by move
  **through the Lichess broadcast API** `[V]`.
- **Everyone who relays, relays for spectating.** Our own sweep: *"Spectating without any training
  tie-in"* `[P]`; and *"No competitor was found relaying live games **into** a rehearsal runtime"*
  `[P]`.

### What we should do, and why it differs

**D1 — discovery is a list, and it costs one endpoint we have already measured.** `live-sources`
defers discovery to *"URL paste"* and `casting.md` Discharge D5 defers viewer discovery again. The
compound effect is that the only way a user reaches this feature is to find a Lichess broadcast URL
somewhere else and paste it — **a feature nobody can discover from inside the product**. The index
(`/api/broadcast`, `/api/broadcast/top`) is unauthenticated, NDJSON, `access-control-allow-origin: *`,
and was exercised `[V]`. Ship the list, the round, and the board grid; the picker is the shape the
data already has.

**D2 — the [[D411]] lock is a feature statement, not an apology, and it should be the loudest
sentence on the surface.** Every competitor in this category shows an evaluation next to a live
board — ChessEver's *"live clocks/eval symbols"* is its selling point `[V] desk`. We refuse, and
`rfc/live-following.md` §4 makes it absolute: *"while `sourceGameLive`, no engine evaluation of any
node of that source is computed, attached or rendered. Not computed-and-hidden — not computed."*
The user-facing form should be a promise:

> **This game is still being played, so Tabiya will not evaluate it — for you, for the host, or for
> anyone watching. You can play the position yourself right now. The evidence unlocks when the round
> finishes.**

Three things are true at once and all three are worth saying: it is the honest-absence invariant
(`design/05:41`), it is the differentiator against the whole spectating shelf, and it is the reason
the surface is safe to build. `[M]`

**D3 — "cut" needs a user-facing name and a stated ply.** `live-following` §2.1's object model —
a growing **followed source**, immutable **cuts** — is correct and is internal vocabulary. The user
sees *the game* and *your copy*. Every copy states where it was taken (*"copied at move 24"*), and
where the source has since moved on, says so (*"the game has since reached move 31"*). §2.4's
supersede projection needs the same treatment: a cut invalidated by an upstream correction must
render its divergence, not vanish — *"Absence and divergence are stated, never simulated"* is
already that RFC's own words `[V]`.

**D4 — separate but integrated, expressed as one action.** From a followed board: *"Cast this."*
That is [[D1272]] made visible, and it is the only place in this scope where the two halves of the
owner's instruction meet a user.

### Cost and dependencies

**Blocked, and honestly so.** `rfc/live-following.md` is draft with two acceptance-blocking open
questions — the B5 architecture ruling (which also selects held-stream vs two one-shot fetches) and
the growth model — plus one unmeasured prerequisite: whether upstream pushes ever *revise* an
earlier ply (§1.4, `[M]`, criterion 3 unsatisfiable until a 30–60 minute stream-diff harness runs).
The follower, the `followed_sources` tables, the AND-release and the two lock arms are all
unbuilt (`sourceGameLive` → **0 matches**) `[V]`. This section specifies the *user's* side of a
thing whose server side has a queue position behind `recorded-clocks` and a migration lane already
claimed. **Nothing here shortens that; it states what the surface must say when it arrives.**

---

## 6. Feature E — streamer mode, which is a different feature from casting

### What a user expects

"Streamer mode" in the field does not mean *broadcast*. It means **hide my private information while
I am on camera**. Discord's streamer mode hides invites and personal details; chess.com's and
Lichess's equivalents hide ratings and chrome. A user asking for streamer mode is asking for a
posture on **their own screen**, not a surface for an audience — and conflating the two, which the
current `Kind: Stream` option invites, is a category error the product has already made once.

### What competitors do

- **Lichess zen is the benchmark and it is verified from source** `[V]`: `_zen.scss` hides
  `.site-title-nav`, `.site-buttons`, **`#friend_box`** and the opponent-left counter; bound to the
  **`z`** key; **three preference states — No / Yes / In-game only** (`Pref.scala`); and the FAQ
  frames it as *"how to hide ratings while playing"*. A one-key chrome-off switch on an already
  minimal screen.
- **chess.com Zen Mode** *"hides everything except board and clock"* `[P]` (secondary blog);
  chess.com also split in-game chat and the move list into separate toggleable windows in early
  2026 `[P]`.
- `competitor-play-ux.md` pattern 7 generalises: *"The two incumbents both ship a one-action path to
  'board + clock only'… the quietest preset has a dedicated toggle, not a settings dive."* `[P]`

### What we should do, and why it differs

**E1 — streamer mode is chrome, and it must be structurally unable to touch assistance.** This is
the rule that keeps it honest, and the repo has already drawn the identical boundary once:
`rfc/theming.md`, per `design/03:296-302`, is *"deliberately **not** an assistance control and is
unreachable from the assistance compiler in both directions… a theme changes how the product looks,
never what it is willing to say."* Streamer mode is the same class and should inherit the same
fence. The one-line rule:

> **Streamer mode hides. It never unlocks, and it never withholds.**

**E2 — and its honest-absence line is the one nobody writes.** Hiding the evidence rail does not
withhold evidence from the run; a viewer's protection comes from the run's disclosure barrier, not
from what the host has on screen. `docs/live-sessions.md` already accepts the underlying limitation
— *"it does not pretend to prevent a host from cheating on themselves"* — and
`rfc/archive/live-session-platform.md` §3.8's four reasons for refusing per-viewer withholding are
sound and should not be revisited `[V]`. So the setting must say what it does **not** do:
*"This hides panels on your screen. It does not change what your viewers see, and it does not
withhold anything from your run."*

**E3 — what it should hide, from the corpus rather than from taste.** Handles and identities
(Lichess hides `#friend_box` `[V]`), ratings (the FAQ's own framing `[V]`), the assistance rail and
evidence panels, the timeline's authored markers, and shell chrome. The shipped `stream` assistance
profile is already `SILENT_ASSISTANCE` (`assistance-preference.ts:11`) `[V]` — so the *silence*
half exists and the *hiding* half does not, which is exactly backwards from what a streamer
needs, since silence is about what the product says and hiding is about what the camera sees.

**E4 — the word "Stream" must stop meaning two things.** Today `AssistanceSettings.svelte:18`
labels the profile *"Streamed session"* and `App.svelte:1058` offers a session **Kind** called
*"Stream"* `[V]`; neither is a display posture, and one of them is decorative —
`session.kind` is branched on in **two** places in the whole server, and *"There is no code path
anywhere that behaves differently for `stream` than for `academy`"* `[V]`
(`broadcast-and-teacher-surfaces.md` §2.4). Naming the display posture "streamer mode" while a
session kind called "Stream" does nothing is the collision [[D412]]'s lesson exists to prevent, and
one clause now is cheaper than the disambiguation later.

### Cost and dependencies

Genuinely small and independently shippable: a chrome-level preference with three states on the
Lichess model, a keybinding (`lib/keyboard.ts` already owns a registry `[V]`), and a fence test
asserting the preference is unreachable from the assistance compiler — the same shape
`rfc/theming.md` already ships for [[D493]]. **This is the only feature in this dossier that
depends on nothing else**, which makes it the natural first landing.

---

## 7. Feature F — inviting a friend to play, under native-first

### What a user expects

The most standardised flow in online chess. A user expects: pick a time control, pick rated or
casual, pick a colour, get a link, send it. Then a game with a clock, a resign button, a draw
offer, a result, and a rematch. Lichess's "Play with a friend" is exactly this modal, and it is the
shape every competitor copies.

Under [[D1414]] — *1.0 human play is native-first; rated and clocked human play is built here* —
that expectation is now ours to meet rather than to delegate, and the gap between it and what
ships is the widest in this document.

### What competitors do

- **The substrate we are choosing not to use is fully documented** `[V]` (OpenAPI 2.0.165):
  `challengeCreate`, `challengeOpen`, `apiBoardSeek`, `apiStreamEvent`, `boardGameStream`,
  `gamePgn`, `bulkPairingCreate` — rated/casual challenges with clocks, correspondence, arbitrary
  FEN, public seeks, live game streams, export with clocks and opening, and bulk pairings. All
  behind explicit OAuth scopes with serialized-request and 60-second-429 rules `[V]`.
- **Take Take Take took the delegation route and made it invisible**: Play Zone is *"powered by
  Lichess"* with *"instant pairing, all within the Take Take Take app"* `[V] desk` — and our own
  teardown flags the residual that matters here: whether those are real rated Lichess games, and
  *"what happens to TTT if the partnership ends"* `[V]` §8.4. That residual is precisely the risk
  [[D1414]] buys out.
- **Friend links are the one place we are already at parity or ahead** `[V]`: `session_join` tokens
  are single-use, expiring, optionally **locked to a named handle**, and can name a **colour seat**
  (`matchSlot: "white" | "black"`), ≤50 active per session, individually revocable, with every
  failure mode returning an identical 404. `social-play-and-event-boundary.md` §1 rates native
  invitation *"the simplest casual path"* `[V]`.
- **What a competitive human surface actually enforces, from a real one** `[V]`
  (`league-as-return-loop.md` §1.2): entry requires an *established* classical rating (provisional
  insufficient), *"Not have lost a game due to a 'cheat detected' mark"*, no ban, **no
  re-registration under a second account**, and **manual review of every registration**. A
  20-minute no-show grace with a time-stamped-screenshot claim that *"will automatically be
  approved"*, and an appeal that **reverses the forfeit onto the accuser** if disproved. Yellow and
  red cards, a second yellow automatically red, and permanent bans for repeat offenders. That is
  the real cost of pairing strangers, measured on an organisation that has done it for 46 seasons.

### What we should do, and why it differs

**F1 — one card, one flow: *Play a friend*.** It sets both server parameters together (§2), asks
for the terms in the order the field has trained (colour, clock, rated), mints the link, and shows
the link with a revoke beside it. The eligibility rule — an untouched `position` run — becomes a
*starting-position picker* rather than a rejection: the flow creates the run it needs.

**F2 — pause-by-consent is the differentiator and it is currently a secret.** `docs/live-sessions.md`:
*"Either player may propose a pause and only the other may accept… **A pause is consent to use the
ordinary rehearsal loop**: a write-capable member may claim, rewind, fork, compare, and reveal. The
mainline tip remains locked. Resume rewinds the cursor to the preserved mainline tip without
deleting rehearsal branches"* `[V]`. **No competitor in the corpus has this.** It is the thesis
applied to two humans, and the interface currently exposes it as a button labelled *"Propose
pause"* with no statement of what accepting means. The invitation itself should carry it: *"This is
a rehearsal game. Either of you can ask to stop the clock and take the position apart together,
then resume."* `[M]`

**F3 — the honest label must be a projection of the terms, not a constant. This is a direct
consequence of [[D1414]] and it contradicts the returned RFC's surviving §5.** `rfc/social-play.md`
§5 specifies *"a fixed non-configurable line"* — **"Casual private match · no clock · no rating ·
no fair-play enforcement"** — for every `kind === "match"` session. Under native-first, some of
those games have a clock and a rating, so the constant is false exactly where it was meant to
protect. The repair keeps the section's principle and drops its constancy:

| the game is | the line reads |
|---|---|
| native, no clock, unrated | Casual private match · no clock · no rating · no fair-play enforcement |
| native, clocked, unrated | Private match · 10+5 · unrated · no fair-play enforcement |
| native, clocked, rated | Rated match · 10+5 · rated on Tabiya's own ladder · no fair-play enforcement |
| Arena leg with a provider | Rated · 10+5 · reported by Lichess *(accepted terms only, per §3.1(b))* |
| Arena leg, terms unknown | terms not yet confirmed by the provider |

Two clauses survive unchanged from the RFC and are the reason this is a repair and not a rewrite:
only **accepted** terms may be rendered, never requested ones; and **no fair-play enforcement** is
on every native row regardless of clock or rating, because [[D1414]] gave us clocks and ratings and
did not give us an anti-cheat operation. Criterion 18's *"asserted at the API boundary… not on the
host's view only"* carries over verbatim.

**F4 — three verbs the field has and we cannot express, each with its home.** `resign`,
`agreed draw` and `flag` are all absent (`docs/live-sessions.md` `[V]`). `rfc/enforced-clocks.md`
§3 already solves the third and, in doing so, half-solves the first: a flag is a **new run event**
(`clock.flagged`) rather than a fifth `terminal_reason`, because `outcome.reached` must immediately
follow a `move.committed` and a flag falls when no move is made (`events.ts:330-333`, `:344-345`)
`[V]`. That RFC's strongest argument is exactly a friend-play argument — *"walking away from a
losing position flags, which is a real result requiring no inference about anything"* — and it
requires the clock to run **while the tab is closed** (§2.3). A user who closes the tab on a friend
game today produces nothing at all. Resignation and agreed draw need the same event-shaped
treatment and have no owner; §13 routes them.

**F5 — the host/guest asymmetry is a fairness bug in a two-person game and it must be fixed before
this surface is offered.** `assistance.ts:27-29` keys assistance on **governance role**, so the
host-seated player gets `humanSplit: "free"`, `corpus: "free"` and lighting/arrows at `"evidence"`,
while a friend-linked opponent — who can only ever be `invitedRole: "participant"`
(`live-session.ts:138`, re-enforced `rest.ts:961`) — gets `locked_off`/`locked_off`/`"sight"`
**always, in every state** `[V]`. At the mutually consented pause, *"the host may ask for the Maia
distribution over the position they are playing against each other and the guest may not"*
(`broadcast-and-teacher-surfaces.md` §3.4) `[V]`. Nobody sees more than the run discloses, so it is
not a leak — it is an **asymmetry between two people who agreed to a fair game**, and inviting a
friend is the surface where it bites. `seatedInContest` already exists in `AssistanceContext`
(`assistance.ts:22-30`) `[V]` and is the named fix.

**F6 — [[D1415]] repairs the return loop and the interface should say so.** Two-human play counts,
native or imported. Today `service.ts:2117` forces `countable: false` on the primary branch only
where a `match_states` row exists, and Arena sessions never have one (`storage.ts:2980` vs `:2982`)
`[V]` — so an imported leg already counts and a native match does not, which nobody chose
([[D1348]]). Once the forcing is removed, a friend game appears in `/learn`, and the surface should
say what it contributes rather than silently accruing it.

### Cost and dependencies

The largest arm in this document, and per [[D1230]] it is priced whole rather than trimmed. Clocks:
server-authoritative decrement, a refusal of client timestamps, a solo pause protocol,
`ClockReading.source: "played"`, a `clock.flagged` event on run-schema lane 0.21, a
`terminal_reason` CHECK rebuild, and a **ticking element that changes with no gesture** —
which `rfc/enforced-clocks.md` states plainly is a deviation from `design/05`'s five regions and
`design/03`'s shell, since nothing in the shipped 16-state composition self-changes `[V]`. Ratings:
`learner-rating`'s predicate plus [[D1292]]'s calibration-state disclosure on the label. Resign and
agreed draw: two run events with no owner. The asymmetry fix: `seatedInContest` read where it is
currently only declared. The friend flow itself is small; **everything underneath it is not**, and
the RFCs that own each piece are draft.

---

## 8. The public-pool question — both branches, neither assumed

**The owner has not ruled whether native-first includes a public matchmaking pool in 1.0, or only
private/friend play plus native ratings.** `planning/rfc-drafting-queue.md:1330-1333` states it
verbatim and states the reason it cannot be inferred: *"Pairing strangers brings abuse handling,
reporting and moderation with it; pairing friends does not."* This section makes both branches
visible and prices both. It recommends nothing.

### What is identical under both branches

Everything in §7 except discovery. Clocks, ratings, the terms label, resign/draw/flag, the
asymmetry fix, the rematch decision, the return-loop repair — all of it is required by native-first
alone. **Nothing in this section is a reason to delay any of §7.**

### Branch A — private and friend play, plus native ratings

**The user's side.** You play people you know. You get a link. Ratings move. There is no queue and
no stranger.

**What the interface owes that it does not owe today.** Under Branch A the *absence* of a pool
becomes a promise the interface must make, not an omission — `design/05:41` applied to the
question every user of a rated ladder will ask: *"Who am I rated against?"* The honest answer is
*people you invited, and bots whose exact policy version is recorded*, and it must be on the rating
surface, because a rating with an unstated population is a number pretending to be a scale. There
is a shipped precedent for exactly this refusal: `learner-rating` R7 declines to publish our rating
as an external-scale equivalent *"because the anchor is unmeasured; the whole calibration is
engine-vs-engine"* `[V]`.

**What it costs.** Nothing beyond §7 — plus one surface the corpus says is missing and Branch A
makes acute: **there is no way to discover another learner**. No directory route, no handle search;
`/sessions` lists only sessions where you already hold a run grant; *"You must already know a handle
out of band"* `[V]` (`league-as-return-loop.md` §4). Branch A is therefore not "the cheap branch" —
it is the branch where the product must be honest that its social graph is out-of-band, and where
the friend link is load-bearing rather than convenient.

**Its known failure mode `[P]`.** Chess.com Leagues is the corpus's control case for a social
surface with no pairing: eight tiers, divisions of 50 resetting weekly, points accruing from
*"regular game play, open seeks, arenas, and tournaments"* — *"There is no pairing."* The finding is
that **a ranked table is not what makes a social surface a return loop** `[M]`; the obligation is,
and Branch A has no obligation mechanism at all.

### Branch B — a public matchmaking pool

**The user's side.** A seek list or a queue. You pick a time control and press play. Someone
arrives. This is the flow `apiBoardSeek` exists to serve and the one every mainstream product has
trained `[V]`.

**Four surfaces Branch B adds that Branch A does not need, each a real screen:**

1. **The seek/queue surface** — and its honest-empty state, which is the hard part. `design/05`
   already requires *"honest-empty and source-unavailable are first-class states, rendered as
   themselves rather than as failures"* `[V]`. An empty pool rendered as a spinner is the worst
   available outcome; rendered as *"nobody is waiting right now — here is a friend link and here
   are the bots"* it is survivable.
2. **A report flow** — what is reportable, what happens next, and what the reporter is told.
3. **Block and mute** — per-learner, symmetric, and visible in the pairing predicate.
4. **A moderation queue** — someone must read the reports.

**And Branch B collides with two standing positions, which is why it cannot be inferred.**

- **`design/02:98-99`, owner ruling:** *"No operator account exists… Administrative capability
  lives in environment and configuration, **never a privileged user**."* `league-as-return-loop.md`
  §C5 draws the conclusion for exactly this case `[M]`: *"A league is not missing an admin screen;
  it is missing the role, and the role was refused on purpose."* **Every act in surface 4 is an act
  by a privileged human.** Branch B therefore requires either reopening that ruling, or the
  transformation §C5 names — *per-league delegated capability on the shipped run-grant model, not a
  platform operator* — which for a pool means moderation authority scoped to something smaller than
  the platform, and it is not obvious what that something is when the pool is the platform.
- **[[D1416]]** defers operator accounts past 1.0 *"not refused"*, and instructs that the operator
  account be checked for redundancy against the shipped Teacher surface first. A public pool in 1.0
  would need the deferred thing.

**And it needs a population.** `league-as-return-loop.md` §C6 is the measured version of this
`[V]`: a real league fields **352 rostered players plus a 121-deep bench**, and the bench covers 13%
of boards in a single round — *"it needs not just players but **spare** players"* — against
`fun-mechanics-outside-roguelikes.md:1039`, *"this deployment has one learner."* A pool is the one
mechanism in this design space whose minimum input is other people.

**What Branch B buys that Branch A cannot.** One thing, and it is real: `learner-rating` Open
question 6 calls the human anchor *"the single highest-value unrun experiment this RFC creates"*,
and R7 stands until it runs `[V]`. A pool of humans playing rated games is that experiment running
continuously. §C7 notes the cheaper substitute — **import** games from a league whose entrants
already carry published external ratings, which *"is a better-controlled human-anchor dataset than
the experiment the RFC proposes to run"* `[V]`, and needs no pool of ours.

### The shape of the decision

| | Branch A | Branch B |
|---|---|---|
| new user-facing screens | 0 beyond §7 | 4 (seek, report, block, moderation) |
| collides with `design/02:98-99` | no | **yes — needs a privileged human** |
| collides with [[D1416]] | no | **yes — needs the deferred operator** |
| minimum input | two people who know each other | a population **with a bench** `[V]` |
| honest-absence obligation | *"you are rated against people you invited"* | *"nobody is waiting"*, rendered as a state |
| unlocks the human anchor | only via import | continuously |

**This dossier makes no recommendation.** The two collisions are with owner rulings, and
`league-as-return-loop.md` §C5's finding — that the missing thing is *a role that was refused on
purpose* — is the reason a research tier cannot resolve it. §13 routes it.

---

## 9. The explanation contract — the thing that does not exist

This is the core of the specification, because it is the thing the owner named and the thing the
repo has no home for.

### The principle

> **A surface a user is being offered states what it is, who can see it, what they see, what is
> recorded, and what it refuses — before it is entered, and again while it is running.**

That is the honest-absence invariant (`design/05:41`, *"Absence is stated, never simulated"*)
extended from *facts about a position* to *facts about a surface*. The extension is not obviously
inside the invariant's current wording, which is why §13 routes it as an owner decision rather than
asserting it here.

### The five answers, and why five

Each answer exists because a specific shipped fact makes its absence dangerous, not because five is
a nice number.

| # | The answer | Why it is separate |
|---|---|---|
| 1 | **What this is** — one concrete sentence, no category names | *"Stream"* is a `<select>` option and a decorative session kind that changes two lines of server behaviour `[V]`. The name carries nothing |
| 2 | **Who can see it** | Today: only granted accounts, and no anonymous live scope exists `[V]` (§1.3). A user's guess will be wrong in both directions |
| 3 | **What they see, exhaustively** | `rfc/casting.md` §5 already makes this a **closed, set-equality-asserted list**. A closed list the user cannot read is a guarantee they cannot rely on |
| 4 | **What is recorded** | The run is permanent and replayable; the session journal separately records people, possession, proposals, votes and invitations (`design/05:42`) `[V]`. Two records with different lifetimes, and the interface names neither |
| 5 | **What it refuses** | The honest-absence half. *No clock, no rating, no fair-play enforcement, no delay, no chat, no anonymous viewer* — all true today, all unrendered `[V]` |

**Answer 5 renders at the same weight as answers 1–4.** Not a footnote, not a disclosure triangle,
not grey. This is the clause that separates the proposal from ordinary onboarding copy, and it is
the one a later pass will be tempted to demote.

### Three moments, and the third is the one everyone forgets

1. **Choose** — the card, before creation. Replaces the `<option>`.
2. **Confirm** — what you are about to turn on, in terms of the five answers, with the values you
   actually picked. This is where §1.1's silent inversion dies: a confirm step that says *"Two legs;
   each player pastes a PGN of a game played elsewhere"* is one a user will correct.
3. **Persist** — a standing line on the running surface. A host who set this up yesterday, or a
   guest who arrived through a link and chose nothing, must be able to read what they are inside.
   `rfc/social-play.md` §5's header line is exactly this moment, specified for one surface; it
   should be the general case.

### The collision this proposal must clear, and the shape of the transformation

[[D1451]] (landed 2026-08-24) finds that **the corpus's only statement about onboarding forbids
it**: `rfc/archive/adaptive-guidance.md:367`, verbatim — *"The **default** everywhere is
`SILENT_ASSISTANCE` — `design/05` §3a's ruling is the shipped posture, and **guided mode is a
choice, never an onboarding state**"* `[V]`. Read loosely, that sentence forecloses this section.

**Read precisely, it forecloses something else entirely, and the distinction is one `design/05`
already draws.** That sentence sits inside the **assistance context table**, and its subject is
**guided mode** — a rung-0-to-5 assistance composition that speaks about *the position on the
board*. §3a's silence default it invokes is a ruling about *what the product says about your game
before you commit*. The five answers say nothing about any position; they say what a **surface**
is, who can see it, and what it refuses. `design/05` §3-forms already separates these axes —
*"Honesty attaches to the source. Timing attaches to disclosure"* — and a statement with no chess
content sits on neither axis.

So the transformation, in `design/02`'s own terms (*"a conflict with an invariant is a design
prompt, not a veto… Rulings constrain the form a feature takes, never its existence"*):

> **The explanation contract never speaks about the board.** It has no rung, no disclosure gate and
> no timing rule, because it makes no chess claim — exactly as `design/05` §3-forms already rules
> for a learner's own drawn mark, which *"is your own thought; the product asserts nothing, so no
> rung and no disclosure gate applies."* A sentence that says *"your viewers cannot see your
> evidence rail"* is in the same class as that mark, and in a different class from *"that knight
> has no retreat square."*

That constraint is worth keeping even without the collision, because it is what stops the preamble
becoming a place to smuggle assistance into a screen where silence is the default. **A five-answer
card that mentions a piece, a square or a move has broken its own contract.** Q1 in §13 asks the
owner to confirm the distinction rather than letting an implementer infer it.

### Why this is a contract and not a copy deck

**Because the repo already enforces the sibling contract at build time.**
`expectDisabledControlsExplained()` fails a build where a disabled control renders no reason
(`screens.test.ts:64`, `app-shell.test.ts:176`, five assertion sites) `[V]`. The proposal is one
more test of the same class:

> A registered surface renders its five answers, asserted **against the exported copy constants**
> rather than against markup — the pattern `rfc/social-play.md` criterion 9 and `rfc/casting.md`
> criterion 4 already use — and a surface added without them fails the build.

Asserting against constants rather than markup is what makes it survive a second client and what
makes answer 5 impossible to hide in CSS. It is also why this needs no new component: the
`HonestControl` / `class="honest"` dialect renders it, and 43 existing usages already prove the
style carries.

### What this looks like for the three kinds that ship today

**Stream.** *(1)* You host a board; people you invite can watch it live, and you get a chrome-free
page to capture in OBS. *(2)* Only people you grant, and they need a Tabiya account. *(3)* The
board, whose objective it is, how many attempts you have forked, marks you draw with your name on
them, and any vote you open — never an evaluation your run has not disclosed. *(4)* The run,
permanently and replayably; separately, who joined, who held the board, and every vote. *(5)* No
Twitch or YouTube connection; no chat; **no delay — viewers see each move as you commit it**; no
anonymous viewer.

**Academy.** *(1)* — **and this is where the exercise pays.** `academy` has **zero behavioural
consumers anywhere, client or server**, has no assistance profile, and falls through to the
`position` profile — so changing your Just Play assistance changes Academy and vice versa `[V]`
(`assistance-preference.ts:11`; `professional-workflow-conformance.md` §4). **There is no honest
sentence for answer 1.** Writing the preamble forces the choice the corpus has already named:
either Academy gains an identity, or the option should not be offered. `professional-workflow-conformance.md`
§4 puts it exactly: *"What cannot remain open is whether Academy has an identity at all: it must,
or the settings boundary lies."* This is the clearest demonstration that the explanation contract is
a **design instrument**, not a documentation task — a surface that cannot answer question 1 is a
surface that does not exist.

**Match / Arena.** Two answers, because it is two features (§1.1), which is the finding the
preamble surfaces on contact.

### Cost and dependencies

Copy constants, one shared preamble component reusing the existing dialect, one build assertion,
and a card per surface. **The real cost is the Academy answer**, which is a product decision, and
the real dependency is §13's intent question — the contract needs a home in the intent tier or it
is one more thing an implementer may quietly except itself from.

---

## 10. What each surface honestly promises and refuses

Answer 5, assembled. Every row is measured; nothing here is aspirational.

| Surface | Promises | Refuses, and says so |
|---|---|---|
| **Native friend match** | authorship derived server-side from the seated learner, so a client cannot forge a move's author `[V]`; possession follows side-to-move; **pause by mutual consent opens the full rehearsal loop and resume preserves the branches** `[V]`; byte-identical disclosure to both players `[V]` | no clock, no rating, no resignation, no agreed draw, no pool, **no fair-play enforcement** `[V]` — all five unrendered today. Under [[D1414]] the first two move to the promises column and the label becomes a projection (§7.3) |
| **Position Arena** | two legs from one position, the same root enforced (`ARENA_ROOT_MISMATCH`) `[V]`; a single import per leg enforced by the write, not by check-then-act `[V]`; both legs comparable on the ordinary compare surface | no provider identity, no challenge id, no game id, no accepted terms, **nothing observes the game finishing** `[V]` ([[D706]]); and the invitation state it prints can never move `[V]` ([[D1344]]) |
| **Stream session** | a chrome-free projection of the same run state; the overlay cannot commit a ply or request an opponent move even holding this browser's writer lease `[V]`; withheld evidence is rendered as withheld rather than as a frozen board `[V]` | no anonymous viewer; no chat bridge; **no broadcast delay**; no evaluation the run has not disclosed; and today no way for the audience to cast the vote it is shown `[V]` |
| **Academy session** | host-directed possession, proposals, spectators, shared reveal under the host's lease, the simul wall, session distillation `[V]` | **no identity of its own** — zero behavioural consumers, inherits Just Play's assistance preferences `[V]` |
| **Vote** | 2–8 legality-checked options, 15–600 s, one vote per derived key, 50,000 keys, stale on node change `[V]`; the tally states how many were relayed and names the adapter `[V]` | *"Tabiya cannot verify chat identities; a tally is only as trustworthy as its adapter"* `[V]`; advisory — a tally never moves a piece `[V]`; **undelayed on a live source's node, refused** (`rfc/casting.md` §6) — and delayed by a caster-set amount when open, per [[D1291]]; and today **nobody can cast one from a browser** `[V]` |
| **Followed broadcast** *(unbuilt)* | the game as relayed, updating; a copy you can play from, stated at its ply | **no evaluation while the game is live — not computed-and-hidden, not computed** (`live-following` §4); no relay operation ([[D709]]); never rated (§7.2, criterion 11); no cast token over a live source |
| **Friend link** | single use, expiring, handle-lockable, colour-seatable, revocable, ≤50 active, uniform 404 on every failure `[V]` | it is *"an invitation to authenticate as oneself, not a run write credential"* `[V]`; the anonymous landing page shows only title and host handle — never a FEN, move or evidence `[V]`; and the UI can only mint the **participant, native-match** variant (§4 C5) `[V]` |

**One promise in this table is qualified by an open defect and the qualification must not be
written into a preamble as if it were closed.** [[D315]] records that the audience half of the
stream/academy loop is server-complete and browser-absent — `castVote`, `closeVote`,
`resolveProposal` and `updateGrants` all have zero Svelte callers, and `rotation` board control
*"always 400s because the client never sends `rotationHandles`"* `[V]`. And [[D448]] records that
`RunService.evidence` serves rung-2 engine numbers *"to any granted reader on any disclosed run with
no role check — so a LIVE spectator gets engine numbers that `/human-split` refuses on the same
run"* `[V]`. The Stream row's *"no evaluation the run has not disclosed"* is exactly true as
written; a spectator's access to evidence the run **has** disclosed is wider than the assistance
rail implies, and a preamble that says *"they see less than you"* would overstate it. Answer 3's
closed list is the honest form, and [[D448]] should close before it is printed.

---

## 11. Cost and dependencies, consolidated

Ordered by what unblocks what, not by size.

| # | Work | Depends on | State of the dependency |
|---|---|---|---|
| 1 | **Streamer mode** (§6) | nothing | shippable today; the theming fence is the model |
| 2 | **The explanation contract** (§9) | an intent home (§13 Q1) | needs a ruling, not code |
| 3 | **Live discovery + four cards + eligibility** (§2) | #2 | otherwise the cards are `<option>`s with borders |
| 4 | **Audience preview** (§3) | #3 | the overlay projection already exists `[V]` |
| 5 | **Vote from the viewer's side** (§4 C2) | #3 | server ships in full; **0 client callers** `[V]` |
| 6 | **Invitation lifecycle producers** (§1.5) | nothing | `rfc/social-play.md` §3.3 specifies it; the RFC is returned, the section survives |
| 7 | **Host/guest assistance symmetry** (§7 F5) | `seatedInContest`, declared `[V]` | a fairness precondition for offering friend play at all |
| 8 | **Terms label as a projection** (§7 F3) | #7, and the clock/rating arms | contradicts the returned RFC's §5 constant |
| 9 | **`live_view` token scope** (§4 C1) | a `public_tokens.scope` CHECK **rebuild**; anonymous rate limiting, which does not exist | design-tier question first (§13 Q2) |
| 10 | **Clocks, resign, agreed draw, flag** (§7 F4) | `recorded-clocks` (draft) → `enforced-clocks` (draft, ready for review); run-schema lane 0.21; a `terminal_reason` rebuild | resign and agreed draw have **no owner** |
| 11 | **Native ratings for human play** (§7) | `learner-rating` + [[D1292]]'s calibration disclosure | [[D1414]] overturns `social-play` §8 refusal 2 |
| 12 | **Broadcast following** (§5) | `rfc/live-following.md`: two acceptance-blocking questions, one unmeasured prerequisite, `sourceGameLive` at **0 matches** `[V]` | blocked, honestly |
| 13 | **Casting a followed game** (§3) | #12, plus `rfc/casting.md`'s liveness guard | blocked on #12 |
| 14 | **Public pool + moderation** (§8 Branch B) | an owner ruling that collides with `design/02:98-99` and [[D1416]] | not a research question |

**A blocker that is not in the table because it is not a dependency — it is a fence whose
instrument is wider than its words.** [[D1451]] (2026-08-24) names `rfc/live-following.md`
criterion 12, restated as *"fenced by criterion 12"* at `:74`, `:413`, `:417` and `:433` `[V]`. The
criterion reads, verbatim (`:528`) `[V]`:

> 12. **The casting fence holds.** A grep assertion (the pattern Phase A criterion 10 already uses)
>     that no stream-side surface, chat-bridge, OAuth or editorial-delay symbol is introduced by
>     this RFC's implementation.

**The scope clause is right and the instrument cannot honour it.** *"Introduced by this RFC's
implementation"* is a statement about a **diff**; *"a grep assertion"* is a statement about a
**tree**. While `live-following` was the only document in the neighbourhood the two agreed; since
[[D1272]] gave casting its own lane, they do not. Either the assertion becomes diff-scoped or the
criterion is amended, and until one of those happens item 3 of this table is illegal rather than
merely unbuilt. **This is a cheap repair to a correct intention, not a wrong criterion**, and
saying so matters because the fence is protecting something real: `live-following` genuinely must
not grow a stream surface of its own.

**Two dependencies worth naming separately because they are easy to miss.** The **ticking clock is
a new kind of element** — nothing in the shipped 16-state composition changes without a gesture, and
`rfc/enforced-clocks.md` records this as a deviation from `design/05`'s five regions `[V]`. **A
self-updating followed board is the same class**, and no document has noticed: `design/05` §2's
regions and `design/03`'s shell both describe surfaces that change when someone acts.

**The migration chain this scope sits in**, from `rfc/README.md`'s register `[V]`:
`campaign-core → live-sources → recorded-clocks → live-following → enforced-clocks → social-play`.
Friend play's clocks (`enforced-clocks`) are **behind** broadcast following (`live-following`) in
that order, which means the native-first arm [[D1414]] made primary is currently queued behind the
arm that is blocked on two unanswered questions. That is a sequencing fact, not a proposal.

---

## 12. Contradictions and corrections in the documents this dossier reconciles

1. **`rfc/social-play.md` §5's fixed casual line is contradicted by [[D1414]]** (§7.3). Its §8
   refusal 2 — *"Native ratings for human-vs-human play… refused"* — is overturned outright; its
   refusal 1 (native public matchmaking) is the open question, not a settled refusal. The RFC is
   returned, so this is recorded for the redraft rather than raised as a defect.
2. **`rfc/casting.md` §2 overstates one row.** *"viewers need no synchronised client — **yes**"*,
   evidenced by the overlay rendering from `session.runState` alone. True of client complexity;
   **false of access** — the overlay is an authenticated route and no anonymous live scope exists
   `[V]` (§1.3). The RFC's own Discharge D5 (*"Discovery — how a viewer finds a cast — is not
   specified here"*) is where this belongs; the §2 row should not read as a green tick meanwhile.
3. **`broadcast-and-teacher-surfaces.md` §3.3's `[V]`-absent finding has been fixed and the dossier
   should be corrected.** It records *"the shipped overlay renders `{item.label}: {item.count}`
   with **no adapter attribution line**… Verified absent `[V]`"* against `App.svelte:803`. **At
   HEAD the overlay renders both `markAttribution(...)` and `voteAttribution(...)`**
   (`App.svelte:1075`) `[V]`. Its sibling finding — the client vote form hardcoding two options
   against a 2–8 server — is **also fixed**: `App.svelte:1067` renders an add/remove editor bounded
   by `MIN_LIVE_VOTE_OPTIONS`/`MAX_LIVE_VOTE_OPTIONS` `[V]`. Both defect-class items from §7.1 are
   discharged; item 1 (the chat bridge) is not.
4. **`docs/live-sessions.md` still says player and spectator get the same projection.** Since B10's
   role-parameterised assistance, a spectator gets strictly less — no Maia human-split, no corpus,
   lighting/arrows capped at `sight` (`assistance.ts:27-29`, enforced on four routes) `[V]`. The
   direction is safe; the sentence needs one clause. Already flagged in
   `broadcast-and-teacher-surfaces.md` §3.2 as a docs-tier `DESIGN-GAP:` and still unrepaired.
5. **A tension worth naming rather than resolving.** `professional-workflow-conformance.md` §2
   argues an editorial delay *"would not protect a streamer from themselves and would create a
   second time-dependent projection"*; `rfc/casting.md` Discharge D3 keeps a *delayed vote* open as
   *"a real product question with a real precedent"*. Both are right about different objects — a
   delay on **our board** versus a delay on **the audience's answer** — and the interface must not
   let a user read one as the other. §3's B3 sentence is written to keep them apart.
6. **`design/03:87-88`'s *"team relays"* remains ambiguous and has now cost three agents.**
   `live-sources` and `social-play` both record the [[D412]] disambiguation as owner-tier and
   undischarged. Recorded again here only so the count is visible.
7. **The RFC register is stale on two rows this dossier depends on.** `rfc/README.md:40` still
   reads `social-play.md` as *"draft 2026-08-23"* with no mention of the return, while [[D1414]]'s
   status cell and `planning/rfc-drafting-queue.md:1322` both say it is returned — the [[D1413]]
   class, *a retraction needs a grep, not a row* `[V]`. And `rfc/README.md:38` still describes
   casting as *"blocked on the B5 ruling ([[D1212]])"*, which [[D1272]] dissolved the same day
   `[V]`. Anyone reading the register to find out whether this territory is open gets the
   pre-ruling answer on both.
8. **A correction to my own reading of `rfc/casting.md`, recorded so the next pass does not repeat
   it.** That RFC's Discharge D3 — the delayed vote — reads as open in the document. It is
   **discharged by [[D1291]]**, ruled the day after drafting, with the delay made
   owner-configurable rather than fixed. The RFC text does not carry the discharge, and a reader
   working from the document alone will design the refusal and miss the ruled feature.

---

## 13. Owner decisions this dossier names and does not make

Law 5 — `design/` is intent tier. None of these is written into a design document by this pass.

**Q1 — Does the explanation contract (§9) belong in `design/05` as a clause, or in `design/03` as a
shell obligation, or neither — and is its no-chess-content constraint confirmed?** It is a claim
about *the product's surfaces*, and `design/05`'s invariants are claims about *a run*, so it does
not obviously fit either. The recommendation is `design/05` §1, because the honest-absence
invariant it extends already lives there and splitting the two would produce the exact double-home
`design/03:276-278` warns about. **Without a home it is a convention, and a convention is what
every RFC may quietly except itself from.** The second half of the question is the one [[D1451]]
forces: the contract clears `adaptive-guidance:367`'s onboarding refusal only if *"a surface
statement makes no chess claim and therefore carries no rung and no disclosure gate"* is confirmed
rather than inferred by an implementer.

**Q2 — Is there an anonymous live viewer, or does `design/03:83` and `:90` need rewording?**
`design/03` promises viewers who *"do not need full synchronized clients"* and *"spectator-safe
read-only views"* as platform primitives; the shipped token model admits no anonymous live scope
`[V]`, and `design/02:101-103` states that model as intent. **One of the two documents is wrong**,
and which one is a product decision: a `live_view` scope is a real capability with a real cost
(§11 row 9), and withdrawing the promise is honest but narrows what casting can ever mean.

**Q3 — the public pool.** §8, unchanged and unrecommended. The two collisions — `design/02:98-99`'s
*"never a privileged user"* and [[D1416]]'s deferral of operator accounts — are why this is
owner-tier rather than research-tier.

**Q4 — Does Academy have an identity, or should the option be withdrawn?** Zero behavioural
consumers; inherits Just Play's assistance preferences, so changing one changes the other `[V]`.
`professional-workflow-conformance.md` §4 already routed this and it is unresolved; §9 shows that
the explanation contract cannot be satisfied for it either way, which converts a settings-boundary
defect into a rendered lie the moment the preamble ships.

**Q5 — Who owns resignation and agreed draw?** `enforced-clocks` solves flag-fall as a new run
event and explicitly does not claim the other two; `docs/live-sessions.md` records all three as
absent `[V]`. Under [[D1414]] a native rated game without a resign verb is a game whose only exit
from a lost position is to walk away — the exact selection bias `learner-rating` §11.3 names and
the clock was recruited to fix.

**Q6 — Does a self-updating surface need a clause?** `rfc/enforced-clocks.md` raises it for the
ticking clock and asks a reviewer to judge whether a self-changing, run-ending element is a
region-level change. A followed broadcast board is the same class and nothing has asked. One ruling
covers both.

**Q7 — Who repairs `rfc/live-following.md` criterion 12?** Its scope clause says *diff* and its
instrument says *tree* (§11), so the casting screen the owner asked for is a test failure by
design. It is an RFC-tier repair, not a design-tier one, but it is **drafting-blocking for the
casting lane** and belongs to a document whose own register line is already stale on the ruling
that opened that lane (§12 item 7). Named here because [[D1451]] found it and this dossier's §2–§4
are unbuildable until it moves.

---

## 14. Proposed ledger rows

Report-only; `design/BACKLOG.md` is not edited by this pass. Ids are assigned at landing —
**renumber from the head at write time**: the head was **D1453** when this pass began reading and
**D1458** an hour later, moving under concurrent agents.

- 🐞 **The live-session creation form's two selects jointly decide a product outcome that neither
  names.** `kind: "match"` with the default `boardControl: "host_directed"` silently produces a
  two-leg PGN-paste Arena rather than a live friend game (`storage.ts:2982-2984` vs `:2980`); the
  eligible-run rule (`live-session.ts:81`, untouched `position` run) is invisible until it throws;
  and `createLive` (`App.svelte:616`) is invoked as `void` with no `catch`, so the throw renders
  nothing. `[V]`
- 🐞 **Every live session is titled `"<kind> session"`.** `createLive` hardcodes
  `title: \`${liveKind} session\`` (`App.svelte:616`) and the session list renders it as the
  heading (`:1059`). The user is never asked. `[V]`
- 🐞 **The broadcast surface's headline is an untranslated internal enum.**
  `<h1>{node.objectiveState}</h1>` is the largest element on `/live/overlay/:runId`
  (`App.svelte:1075`). `[V]`
- 📊 **The explanation primitive exists, is build-enforced, and fires only on refusal.**
  `HonestControl.svelte` plus 43 `class="honest"` usages, gated by
  `expectDisabledControlsExplained()` at five assertion sites — every one of them explaining why a
  control is *disabled*, none explaining what a surface *is*. The missing thing is one clause in an
  enforced contract, not a component. `[V]`
- 📊 **No anonymous viewer of a live board exists, by construction.** `PublicTokenRecord` admits
  `story_read` (terminal, disclosed) and `session_join` (an invitation to authenticate)
  (`storage.ts:168-169`), and `design/02:101-103` states that as intent — against `design/03:83`'s
  *"Viewers do not need full synchronized clients"* and `:90`'s *"spectator-safe read-only views are
  platform primitives"*. `[V]` Owner decision Q2.
- 💡 **Streamer mode is a display posture and must inherit the theming fence.** *Hides, never
  unlocks, never withholds*, unreachable from the assistance compiler in both directions on
  [[D493]]'s model — and its honest-absence line says that hiding panels changes nothing a viewer
  sees. Independently shippable; depends on nothing.
- 💡 **The audience preview.** One control rendering exactly the viewer's surface, on the host's
  screen. Answers *who can see this* and *what do they see* by showing, and makes
  `rfc/casting.md` §5's closed render list something a host can actually check.
- 🐞 **[[D1414]] falsifies `rfc/social-play.md` §5's fixed casual line** for the games it was
  written to protect, and overturns its §8 refusal 2 outright. The honest label must become a
  projection of the accepted terms; the *no fair-play enforcement* clause survives on every native
  row, because native-first bought clocks and ratings and not an anti-cheat operation.
- 🐞 **Two independently-recorded broadcast defects are fixed and their dossier is stale.**
  `broadcast-and-teacher-surfaces.md` §3.3/§7.1 record the missing vote-adapter attribution line
  and the two-option client vote form as `[V]` present-tense defects; at HEAD the overlay renders
  `markAttribution` and `voteAttribution` (`App.svelte:1075`) and the editor is bounded by
  `MIN/MAX_LIVE_VOTE_OPTIONS` (`:1067`). `[V]` Correction, not a new defect.
- 📊 **`castVote` still has zero client callers** (`api.ts:867`, `:1174`; no `.svelte` importer),
  so the audience cannot answer a vote the interface shows them. `[V]` Unchanged since
  `mechanics-by-mode.md` §2.5 and [[D315]].
- 🐞 **A spectator link cannot be minted from the interface.** `mintJoinLink` hardcodes
  `invitedRole: "participant"` and renders only inside `{#if liveDetail.match}`
  (`App.svelte:644`, `:1066`), so the `session_join` scope's spectator arm — which
  `docs/live-sessions.md` documents — is unreachable, and a host has no control that produces a
  watch-this link. `[V]` Sharpens [[D315]]'s (a) arm with the current line numbers.
- 🐞 **`rfc/casting.md` does not carry its own discharge.** Its Discharge D3 (the delayed vote)
  reads open; [[D1291]] discharged it the following day and made the delay owner-configurable. A
  reader working from the RFC designs the refusal and misses the ruled feature. Same class as
  [[D1413]]. `[V]`
- 🐞 **The register is stale on both live rows.** `rfc/README.md:40` does not record
  `social-play.md`'s return ([[D1414]]); `rfc/README.md:38` still calls casting *"blocked on the B5
  ruling ([[D1212]])"* after [[D1272]] dissolved it. `[V]`
- 📊 **[[D1451]]'s casting fence, stated exactly: the criterion's scope clause says *diff* and its
  instrument says *tree*.** `live-following` criterion 12 (`:528`) asserts by **grep** that nothing
  stream-side is *"introduced by this RFC's implementation"* — two different statements that agreed
  while `live-following` was the only document in the neighbourhood and stopped agreeing when
  [[D1272]] gave casting its own lane. A diff-scoped assertion repairs it without weakening what
  the fence protects. `[V]`
- 💡 **The explanation contract never speaks about the board**, and that is what clears
  [[D1451]]'s onboarding fence rather than arguing with it: `adaptive-guidance:367`'s *"guided mode
  is a choice, never an onboarding state"* governs an **assistance** composition with chess
  content, while the five answers make no chess claim and therefore sit on neither the honesty nor
  the disclosure axis — the same reasoning `design/05` §3-forms already applies to a learner's own
  drawn mark. A five-answer card that names a piece, a square or a move has broken its own
  contract.

---

## 15. What this dossier does not establish

- **No streamer, coach, viewer or opponent was asked anything.** The user expectations in every
  "What a user expects" pass are argued from competitor behaviour and field convention `[M]`, not
  from testimony. `live-relay-as-drill-source.md` §5's *"No streamer was asked"* is inherited
  whole. **The cheapest instrument that would fix this is one conversation with one person who
  streams chess**, and it would falsify or confirm more of §3 and §6 than any further desk pass.
- **Nothing was driven in a browser.** The overlay has still never been captured in OBS, no
  two-account session was run, no relayed vote was exercised, and no friend link was redeemed.
  Every claim about how these surfaces *feel* is `[M]`; only rendered element sets are `[V]`.
- **No competitor product was used.** Every external claim is inherited desk research, and
  `competitor-play-ux.md`'s own caveat binds: the strongest label available for a competitor screen
  is fetched-primary-source, not hands-on.
- **The public-pool question is presented, not answered**, and this document deliberately does not
  lean. Its two collisions are with owner rulings.
- **No cost is estimated in time.** §11 orders dependencies and names blockers; it prices nothing
  in hours, and per [[D1230]] it proposes no subset of any arm.
- **The five answers are a contract shape, not final copy.** The sentences in §9 and §10 are
  worked examples showing that each answer is writable from measured facts; the exact wording is
  the implementing RFC's, under whichever intent home Q1 selects.

---

## 16. Living correction — browser vote participation (2026-08-29)

The present-tense `castVote` absence recorded in §§1.5, 10, 11 and 12 is closed at HEAD. An open
vote now renders one action per server-returned option for every signed-in session viewer;
`castLiveVote` calls the ordinary client operation with session id, window id and choice only,
then replaces the displayed vote with the returned authoritative tally `[V]`
(`apps/web/src/App.svelte`, `castLiveVote` and the open-vote region). A spectator component
contract proves the three-argument call, identity-key omission, confirmation copy and updated
count `[V]` (`apps/web/src/lib/app-shell.test.ts`). Adapter relay and its externally supplied key
remain a separate trusted-account path. The spectator-link absence recorded in §4 C5 and §12 is
also closed: every session kind now exposes a separate **Create watch link** action which requests
`invitedRole: "spectator"` without a match seat and renders its one-use, 14-day and spectator-only
limits `[V]` (`apps/web/src/App.svelte`, `mintWatchLink`; `apps/web/src/lib/app-shell.test.ts`).
Rotation setup, vote closing, grant management and academy-specific behaviour remain open under
[[D315]].

The rotation request and creation-error portions are also closed at HEAD. Creation collects an
ordered, de-duplicated handle list, refuses an empty rotation locally, sends `rotationHandles`, and
renders server rejection; session detail renders the stored order/current cursor and gives the host
an advance action `[V]` (`apps/web/src/App.svelte`; `apps/web/src/lib/app-shell.test.ts`). The same
pass replaced the generated `${kind} session` title with a required host-authored title and a visible
pending/error path `[V]`. Adding participant access from this screen remains absent because
`updateGrants` now has a host-only **Session access** region that grants or updates participant and
spectator roles, revokes non-host roles, requires the ordinary writer and refreshes the returned
grant list `[V]`. The host can also close an open vote and optionally record one declared option as
applied; the control and confirmation both state that closing never plays a move `[V]`
(`apps/web/src/App.svelte`; `apps/web/src/lib/app-shell.test.ts`). Product-choice composition,
eligibility and academy-specific behaviour stay open under [[D315]] and [[D1470]].
