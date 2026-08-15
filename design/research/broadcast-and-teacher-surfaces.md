# Broadcast/streamer and teacher/classroom — the two B5 surfaces nobody researched

- **Date:** 2026-08-15
- **Feeds:** `design/03-product-breadth.md` §Live and B5, `design/05-in-run-experience.md`
  §3/§147/§316-322, `design/BACKLOG.md:61` (Streamer/Twitch), `:62` (Academy),
  `:325` (Events layer), Q1a, B5, B8's share-link clause
- **Trigger:** owner, 2026-08-15 — *"what about streamer / teacher modes? etc etc… I don't
  know if all the elements have had rigorous research behind it."* The 2026-08-15
  reconciliation flagged the Twitch mention in `design/03` as having zero repo-wide hits.

## 0. What is measured and what is argued

**Measured `[V]` in this pass** (greps and reads against the working tree at
`8744adb` + uncommitted deltas, none of which touch live sessions): every term count in
§2.1, every file:line in §2, §3 and §4, the seven code findings in §6, and the
verbatim design quotes in §1. Every count in §2.1 is reproducible with the command
printed there.

**Inherited `[P]`:** the competitor rows in §5, taken from this repo's own dossiers
(`coverage-gap-sweep.md`, `coverage-sweep-2-notability.md`, `adoption-audit.md`,
`competitor-matrix.csv`). No new external fetch was made — a deliberate limit, stated
rather than hidden. This dossier is *desk research over our own corpus plus a hands-on
code audit*; it is not a market pass and does not claim to be one.

**Argued `[M]`:** the verdicts in §7, the distinctness analysis in §4.4, and the reading
of what an honest overlay contains in §3.3. These are analysis, marked as such.

**Law 8 note:** nothing here creates or grades chess content. The honesty analysis is
about *who is told what and when*, which is `05` §3's subject, not chess truth.

---

## 1. What was actually promised — verbatim

Four living documents commit to these surfaces. Quoted, not paraphrased, because the
reconciliation gate has found `design/03` overstating in both directions.

**`design/03-product-breadth.md:81-83`** `[V]`:

> **Streamer/Twitch:** the streamer owns the live board; chat votes on plans or
> moves; the host snapshots, rewinds, branches, compares, and exposes an
> overlay. Viewers do not need full synchronized clients.

**`design/03-product-breadth.md:84-86`** `[V]`:

> **Academy/coached session:** host/leader controls the run, participants vote
> or propose, spectators follow, and the completed event can be replayed and
> distilled into a pack.

**`design/03-product-breadth.md:87-89`** `[V]`:

> **Arena and events:** scheduled pack nights, invitations, cohorts, two-leg
> position matches, team relays, and later native matchmaking reuse run,
> branch, evidence, and replay semantics.

**`design/03-product-breadth.md:285`, the B5 gate row** `[V]`:

> | B5 — live | Twitch host/chat/overlay, academy roles, and external Position Arena
> handoff each complete one scenario | shipped 2026-08-13 (`live-session-platform`) —
> roles, board control, spectate, chat voting, academy, Arena two-leg handoff. Native
> matchmaking stays outside minimal-real scope by design |

Mirrored identically at `planning/exploration/gates.md:128` `[V]`.

**`design/03-product-breadth.md:257`** puts `Live | Stream, academy/hosted session,
events/spectate` in the primary nav, and **`:271-272`** rules:

> Stream overlays and spectator views are projections of the same run state, not
> separate products.

**`design/00-thesis.md:25-27`** `[V]` names *"live/stream/academy and human contexts"*
among the things breadth must support before content depth.
**`design/01-training-model.md:122-125`** `[V]`: *"external-handoff Arena, Twitch/stream,
academy, and Just Play must fit the shared product and reach a minimal real workflow
before content depth."*
**`design/02-product-shape.md:12-14`** `[V]` lists *"live/stream/academy contexts"* as
entry points beside packs.

**The word "teacher" appears in no design document, no RFC, and no line of code.**
`[V]` (§2.1). What `design/03` promises is an **academy/coached session** — a
co-present live event — and, separately, **cohorts** inside the events row. The owner's
"teacher mode" has no design-tier text behind it at all. That is the honest starting
position, and it changes the shape of the verdict in §7.2.

---

## 2. What already ships — and most of it ships under another name

### 2.1 The term census, reproduced

```
cd <repo>; for t in teacher classroom cohort student twitch academy \
  streamer overlay spectator simul broadcast; do
  echo "$t: $(grep -rniE "$t" apps/*/src packages/*/src workers tests tools | wc -l)"; done
```

| Term | Hits in code | Term | Hits in code |
|---|---|---|---|
| `teacher` | **0** | `academy` | **15** |
| `classroom` | **0** | `overlay` | **37** |
| `cohort` | **0** | `spectator` | **42** |
| `twitch` | **0** | `student` | 2 (both placeholder strings) |
| `streamer` | **0** | `broadcast` | **0** |
| `simul` | 0 (excluding `simulate`/`simulation`) | | |

All `[V]`. The task brief's measurement is confirmed on the *words*. **It is wrong on
the surfaces.** The vocabulary that shipped is `stream` / `academy` / `match`, not
Twitch / classroom / simul — which is precisely why a keyword sweep reports a hole
where a working surface stands.

### 2.2 The load-bearing find: `stream` and `academy` are shipped session kinds

`apps/server/src/live-types.ts:3` `[V]`:

```ts
export const SESSION_KINDS = Object.freeze(["stream", "academy", "match"] as const);
```

Persisted as a closed CHECK constraint at `apps/server/src/storage.ts:2309` and `:2382`
`[V]`; validated at the route boundary `apps/server/src/rest.ts:943` `[V]`; offered in
the client as a three-way `<select>` at `apps/web/src/App.svelte:786` `[V]`
(`Stream` / `Academy` / `Match / Arena`).

**So the Twitch surface and the academy surface both ship — under the names `stream`
and `academy`.** This is the third confirmed instance of the repo's recurring pattern
(three of six campaign parts, the native-match atom at `BACKLOG:316`, and now this).

### 2.3 The inventory, verified

| `design/03` §Live commitment | Ships? | Evidence `[V]` |
|---|---|---|
| Streamer owns the live board | **yes** | `host_directed` board control + CAS'd lease, `docs/live-sessions.md:12-24`, `live-session.ts:74` |
| Chat votes on plans or moves | **yes** | 2–8 legal options, 15–600 s window, `live-session.ts:181-186`; tallies advisory (`docs/live-sessions.md:67-68`) |
| Chat identity relayed from outside Tabiya | **transport only** | disjoint `chat:<adapter>:<key>` namespace, adapter must be a designated learner, 128-char keys, 50 000-voter cap, `live-session.ts:196-203`; SQL constraint `storage.ts:2430` |
| Host snapshots, rewinds, branches, compares | **yes** | ordinary run mutations under the lease; refused only while a *match* is live (`MATCH_LIVE`, `docs/live-sessions.md:48-49`) |
| Exposes an overlay | **yes** | route `/live/overlay/:runId`, chrome-free (`App.svelte:522, :801-803`) |
| Viewers do not need full synchronized clients | **yes** | overlay is a projection of the same `RunStateSnapshot`; 2 s polling, no WebSocket (`docs/live-sessions.md:99-102, :129-130`) |
| Host/leader controls the run | **yes** | `mayControlSession(role) === "host"` (`authorization.ts:37-39`) |
| Participants vote or propose | **yes** | `mayPropose` host+participant (`authorization.ts:29-31`); proposals are session state, applied only by a host (`docs/live-sessions.md:64-66`) |
| Spectators follow | **yes** | `mayRead` true for all roles (`authorization.ts:17-19`); `publicEvents` truncates at the disclosure barrier and flags `withheld` so a follower never silently freezes (`docs/live-sessions.md:104-106`) |
| Completed event replayed and **distilled into a pack** | **yes — and `design/03:286` is now stale** | `apps/server/src/distill.ts:82` emits `sources: ["session_distilled", …]`; route `rest.ts:1081-1086`. B6's "does NOT exist / zero producers" correction has itself been superseded |
| Invitations | **yes** | handle-bound or external challenge URL, `live-session.ts:220` |
| Friend link / anonymous seat | **yes** | `session_join` scope in `public_tokens`, SHA-256 hash only, 1 use / 14 d default, 90 d / 50-link caps, revocable, all failure modes return the same 404 (`storage.ts:2343-2358`, `live-session.ts:135-144`, `docs/live-sessions.md:108-120`) |
| Public read-only share artifact | **partly** | `story_read` token + `/shared/:token` HTML card (`rest.ts:727-733`); host-only minting (`service.ts:561-562`); terminal + disclosed only (`service.ts:533-534`). **No board image** — the "chessboard" is `<pre>` of the FEN (`rest.ts:731`) |
| Simul wall over N boards | **yes** | `GET /sessions` returns active FEN, side to move, ply count, pause state, lease holder and match players in one request; rendered as a board grid at `App.svelte:787` |
| Scheduled pack nights | **field only** | `scheduledFor` persists (`storage.ts:1635`) and reaches the client type (`api.ts:238`) but **has no producer, no consumer and no UI** `[V]` |
| Cohorts, team relays | **no** | zero hits (§2.1) |
| Native matchmaking / clocks | **out of scope by ruling** | `design/03:285` |

### 2.4 What "stream" and "academy" actually *do* differently: nothing

`session.kind` is branched on in exactly **two** places in the whole server `[V]`:

- `live-session.ts:74` — `match` board control requires `match` kind;
- `live-session.ts:224` — Arena PGN legs require `match` kind.

Plus two storage-side guards on match seating (`storage.ts:1646, :1657`) and two
client display branches (`App.svelte:793, :796-797`). **There is no code path anywhere
that behaves differently for `stream` than for `academy`.** Both are labels on the same
aggregate; the differentiating machinery is `boardControl`, not `kind`.

That is defensible — the RFC's thesis is that one aggregate serves all three
(`rfc/archive/live-session-platform.md:1-14`) — but it means **"Twitch mode" and
"academy mode" as *modes* do not exist. What exists is one live-session aggregate with
a decorative label.** Anything that should differ by context (assistance defaults,
overlay content, who may reveal) currently cannot, because nothing reads the field.

---

## 3. The honesty problem — broadcast

### 3.1 The ruling that already exists, and it is good

`rfc/archive/live-session-platform.md:763-796` (§3.8) is the most rigorous thing
written on either surface, and it was written before either was called a surface. Its
core `[V]`:

> **`feedbackDisclosed` keeps taking no viewer parameter, and this RFC adds no
> per-viewer withholding anywhere.** […] two viewers of the same run receive
> byte-identical output.

with four reasons: (1) per-viewer reveal cannot enforce blind play, because the
streamer can spectate their own run from a second account; (2) uniform withholding
guarantees a spectator never sees engine evidence the player cannot — *the direction
that matters is closed by construction, not by check*; (3) a second disclosure path is
the D4/D8 two-sources-of-truth defect class, applied to the one boundary the product
cannot get wrong; (4) the academy reveal case doesn't need it, because
`POST /runs/:id/reveal` under the host's lease already *is* "the coach reveals to the
class now".

The limit is documented, not engineered against (`docs/live-sessions.md:123-127`).
**This is the correct answer and it should not be revisited.** F1's blocked-item list at
`BACKLOG:97` still names *"the streamer overlay, which needs per-viewer withholding"* —
that clause was overtaken by the 2026-08-12 ruling and is a stale ledger cell, not a
live requirement.

### 3.2 But "byte-identical" stopped being true — safely — and the doc did not follow

`packages/runtime/src/assistance.ts:27-29` `[V]`:

```ts
const mayRequestSplit = (context.role === "solo" || context.role === "host") && context.deliveryOpen;
return Object.freeze({ markers: "free", guided: "free",
  humanSplit: mayRequestSplit ? "free" : "locked_off",
  corpus:     mayRequestSplit ? "free" : "locked_off",
  voice: "free", spoken: "free",
  boardLighting: mayRequestSplit ? "evidence" : "sight",
  arrows:        mayRequestSplit ? "evidence" : "sight", ambient: "free" });
```

`adaptive-guidance` (B10, 2026-08-14) introduced **role-parameterised assistance**
after §3.8 was frozen. A spectator or participant now gets *strictly less* than the
host: no Maia human-split, no corpus evidence, and board lighting/arrows capped at
`sight` rather than `evidence`. Enforced server-side on three routes —
`/human-split` (`rest.ts:1048-1049`), `/corpus` (`rest.ts:1064-1065`) and
`/voice`+`/speech` via `requireGuidanceDisclosure` (`rest.ts:92-100, 1124, 1131, 1146`).

**The direction is safe** — spectators see less, never more — so no honesty law is
broken. But `docs/live-sessions.md:126` still states *"Tabiya therefore gives player
and spectator the same disclosure projection"*, which is now true of the run projection
and false of the assistance rail. `DESIGN-GAP:` (docs tier, not design tier) — the
sentence needs one clause.

### 3.3 What an overlay honestly shows, measured `[V]` then argued `[M]`

Measured, `App.svelte:803` — the overlay renders exactly five things: the active FEN on
a disabled board; `node.objectiveState`; the branch count; the open vote prompt and
tally; and, when truncated, *"Host is ahead; evidence is withheld until this run
discloses."* Nothing else. No engine number, no Maia distribution, no authored prose,
no marker.

Measured, `rest.ts:1114-1150` and `service.ts:1345-1351, :533-534` — everything an
authenticated spectator *could* additionally pull is gated: `/evidence` returns empty
unless `feedbackDeliveryOpen(run)`; `/story` throws `ASSISTANCE_WITHHELD` until
`feedbackDisclosed(run)`; `/human-split`, `/corpus`, `/voice`, `/speech` refuse for
non-host roles; `/analysis` requires a writer id.

Measured, `rfc/archive/live-session-platform.md:838-842` — the overlay authenticates
with the ordinary cookie inside the OBS browser source's own jar; **no token travels in
the URL**, because `parseDrillAddress` forbids query and fragment
(`packages/schema/src/drill-pack/urls.ts:88-91`).

**Argued `[M]`:** this is the right shape and the honest answer to *"what does a stream
overlay show"* is **the board, the objective, the attempt count, and the vote** — which
is what it shows. The overlay is not where the risk lives, for a structural reason: it
is a projection of the *host's* view rendered into video, so it can never exceed the
host's own disclosure, and the audience is watching a video, not holding a session. The
honesty risk in broadcast lives one layer out, in **relayed chat votes**: the tally is
attributable only as far as the adapter that submitted it, `docs/live-sessions.md:72-74`
says so and requires the UI to say so — but the shipped overlay renders
`{item.label}: {item.count}` (`App.svelte:803`) with **no adapter attribution line**,
though §3.6.4 of the RFC specified one and §3.10 lists it among what the overlay
renders. `DESIGN-GAP:` a specified honesty label is missing from the surface that most
needs it. Verified absent `[V]`.

### 3.4 The one shipped asymmetry that is a real defect

In a **native two-human match**, a `matchSlot` may only be bound to an
`invitedRole: "participant"` (`live-session.ts:138`, enforced again at
`rest.ts:961`). The host may occupy the other seat (`docs/live-sessions.md:36-38`).
Feed those two roles through `permittedAssistance`:

- host-seated player: `humanSplit: "free"`, `corpus: "free"`, lighting/arrows
  `"evidence"` — whenever `feedbackDeliveryOpen(run)`;
- friend-linked opponent: `humanSplit: "locked_off"`, `corpus: "locked_off"`,
  lighting/arrows `"sight"` — **always, in every state**.

`feedbackDeliveryOpen` opens on `feedback.revealed` or `outcome.reached`
(`packages/runtime/src/feedback.ts:22-30`), and a mutually-accepted pause is exactly
when a write-capable member may reveal (`docs/live-sessions.md:50-52`). So at the pause
that both players consented to, **the host may ask for the Maia distribution over the
position they are playing against each other and the guest may not.** `[V]`

This is not a leak — nobody sees more than the run discloses — but it is asymmetric
information in a competitive surface, produced by keying assistance on *governance
role* rather than on *playing status*. It bites the teacher case identically: a coach
who takes a seat against a student is the privileged party by construction. Proposed as
a defect row in §8.

---

## 4. The honesty problem — teacher, and what "teacher" would even mean

### 4.1 Teaching over someone else's board already works

A coach granted `spectator` on a student's run can, today `[V]`: see it in their own
`GET /runs` list (the query joins `run_grants`, `storage.ts:724`); poll `/events` with
honest truncation; read `/graph`, `/compare`, `/branch-decidedness` and `/pgn`; watch N
student boards at once on the `/live` wall; be handed the board by a host
(`host_directed` handoff); and have every ply attributable to a person through the
possession journal (`docs/live-sessions.md:26-31`).

And the reveal ritual — *"class, here is what the pack says about this position"* — is
`POST /runs/:id/reveal` under the host's lease, after which every spectator's next 2 s
poll sees it (`rfc/archive/live-session-platform.md:790-795`) `[V]`.

**Nearly all of "watch my student and teach into it" ships.**

### 4.2 What does not exist, measured

| Teacher primitive | Status `[V]` |
|---|---|
| A roster / class / group of learners | **absent** — no table, no type, zero `cohort` hits |
| Assign a pack to a learner | **absent** — no assignment primitive anywhere |
| See another learner's progress, due queue or attempt history | **absent by construction** — all six `/progress*` routes take only `authenticate()` and resolve to that principal (`rest.ts:885-905`) |
| Homework / analytics over a class | **absent** — already ledgered `[P]` (`adoption-audit.md:143`, Chessido row) |
| Async review of a specific student run | **present** via per-run spectator grant (§4.1) |

### 4.3 The consent question, which is the actual design content

A spectator on a *stream* is watching a performance the host chose to give. A teacher
watching a student mid-drill is watching someone **be wrong on purpose** — which is the
product's whole method (`design/05:166`: *"it is coaching you past the mistake that
would have taught you"*). Two things follow `[M]`:

1. **Consent is per-run and revocable today, and that is the right granularity.**
   Grants are per-run rows (`storage.ts:591`), and a `session_join` token is *"an
   invitation to authenticate as oneself, not a run write credential"*
   (`docs/live-sessions.md:110-111`). A roster would replace that with standing,
   ambient visibility across everything a student does — which is a materially
   different consent object and must not be smuggled in as a convenience feature. If a
   teacher surface ships, **the roster must not imply a grant**; enrolment and
   per-run observation stay separate acts.
2. **The observed learner must be able to see who is watching.** Measured: the session
   detail page lists members and roles (`App.svelte:795`), but on a phone the compact
   **Session tab is dead** — `compactTab` admits `"evidence"` and `"session"`
   (`DrillScreen.svelte:158, :744-745`) while `class:compact-active` bindings exist
   only for `"branches"` (`:815`) and `"timeline"` (`:848`), and the tab's condition is
   `viewerRole !== "host"` — inverted, since the host is who needs session controls.
   Independently found and recorded in `mobile-scope.md:203` `[P]`; **re-verified live
   in this pass** `[V]`. So the learner most likely to be observed (a student on a
   phone) has no working way to see who is in the room. That is the teacher surface's
   sharpest honesty defect and it is a two-line fix.

### 4.4 Is teacher mode the same as academy? `[M]`

**Partly, and the split is clean.** Three distinct objects hide under one word:

| Object | Unit | Time | Status |
|---|---|---|---|
| **Academy / coached session** (`design/03:84`) | one run, many people | synchronous, co-present | **ships** as `kind: "academy"` |
| **Simul / match supervision** (`BACKLOG:316`) | N runs, one coach | synchronous | **ships** — `/live` wall + `match` control + friend links |
| **Teacher / classroom** (unwritten) | **a roster of people across time** | **asynchronous** | **absent entirely** |

The first two are *sessions*: bounded, consented, co-present. The third is a
**standing relationship** — enrolment, assignment, and progress visibility that persist
between sessions. It is a different aggregate with a different consent model, and
calling it "academy depth" would hide that.

The **events layer** (`BACKLOG:325` — pack nights, cohorts, team relays) is the
*scheduling* half of the same missing aggregate: a cohort is a roster with a calendar.
`scheduledFor` is the one persisted atom (§2.3), producer-less. **Recommendation `[M]`:
teacher/classroom and the events layer are one surface, not two** — a roster with
scheduling — and should be ledgered as one.

---

## 5. Competitor evidence, cited from our own dossiers

Not recalled — quoted from the corpus, all `[P]` unless the dossier marked otherwise.

**Streaming (`coverage-gap-sweep.md:93-103`, cluster 5 "Streaming / chess-on-Twitch
tooling (B5 streamer surface)").** Its own verdict line: *"Covered: nothing."* One
grounded product — **Chess vs Chat** (Steam 1888920, €3.29) `[V]` in that dossier:
Twitch chat types moves, votes tallied per turn, names/emotes rendered, moderation
synced, FEN loading. Matrix row 39 `[V]` records what it is not: *"No teach/rewind/branch
semantics — entertainment only."* The dossier's closing sentence is the finding:
*"Nobody ships host-side rewind / branch / teach semantics; chat-vote entertainment is
the whole category."* `adoption-audit.md:142` (row 50) already marks the loved feature
— per-turn tallies with named voters — as **SHIPPED** for us, with *"emote cosmetics
are polish."*

**Spectating (`coverage-gap-sweep.md:59-73`, cluster 3).** *"This whole shelf was
outside the old frame."* Best example **ChessEver** (matrix row 33) — multi-board with
clocks and eval symbols, PiP, player-tracking notifications; matrix verdict:
*"Spectating only — no play, drill, or rehearsal."* Lichess and Chess.com both run
broadcast/relay infrastructure at scale (`coverage-sweep-2-notability.md:144-146,
:197-198`), and Lichess's is *"Spectating without any training tie-in."*

**Classroom (`coverage-gap-sweep.md:76-88`, cluster 4).** *"Covered: ChessDojo
(community pedagogy), nothing classroom-shaped."* Grounded example **Chessido**
(matrix row 34) `[V]`: live classroom with coach-controlled board sync and built-in
video, puzzle homework with score/accuracy/weak-topic analytics, bot drills between
classes, rating sync. Matrix verdict: *"Ops and puzzles; class board is broadcast, not
consequence play; no branch runtime."* Named but ungrounded: ChessPlay.io,
**Chess.com Classroom**, **ChessKid Classroom** (2 000+ schools,
`coverage-sweep-2-notability.md:65`), Chessity, Chess.Run — *"the category is crowded
and ops-focused, uniformly without a rehearsal runtime."*

**What the audit already concluded, and it is the most useful sentence in the file**
(`adoption-audit.md:143`, row 51): coach-controlled classroom board is **SHIPPED**;
*"homework/assignment analytics **MISSING** […] Entry: B7 attempt data already exists;
a cohort view is derivation. Cost: hosted cohort surface. Conflict: none; B5-depth
sequencing"* → *"defer to B5 depth; note the analytics angle for the academy surface."*
And row 54: Lichess studies, *"loved as a teaching medium"*, **SHIPPED** as runs +
preserved branches + PGN export + spectator projections, *"adopted with opponent +
attempts semantics studies lack."*

**Synthesis `[M]`:** across three clusters, ~15 named products and two whole-platform
censuses, **the repo's own corpus records no competitor combining a rehearsal runtime
with either surface.** Broadcast tooling is entertainment glue; classroom tooling is
scheduling-and-analytics ops. Both categories treat the board as read-only. E1 is
undisturbed by either — nothing new to escalate.

---

## 6. Seven code findings from this pass

All `[V]`, all re-verifiable at the cited line.

1. **`session.kind` is decorative.** Zero behavioural branches distinguish `stream` from
   `academy` (§2.4). Any per-context policy has no field to hang on.
2. **`permittedAssistance` declares `sessionKind` and never reads it.**
   `assistance.ts:22` requires it in the context; `:28-29` uses only `role` and
   `deliveryOpen`. Meanwhile `design/05:147` promises *"A curated drill, Just Play, a
   match, a stream, and the on-ramp each get their own defaults."* The shipped
   preference keys are `RunSessionKind` = `pack | position | imported`
   (`assistance-preference.ts:4`, `AssistanceSettings.svelte:17`), so **a match, a
   stream and the on-ramp all share the `position` bucket** — three of the five named
   contexts collapse into one key. `DESIGN-GAP:` against `design/05:147`.
3. **Match assistance asymmetry** (§3.4) — host seat privileged over guest seat.
4. **The overlay omits its specified adapter-attribution line** (§3.3).
5. **`scheduledFor` is a producer-less field** — the events layer's only shipped atom.
6. **The compact Session tab is dead and its role condition is inverted**
   (`DrillScreen.svelte:158, :744-745, :815, :848`) — re-verified from
   `mobile-scope.md:203`.
7. **The public story card has no board.** `rest.ts:731` renders
   `<pre aria-label="Chessboard">` containing the FEN string. The share artifact
   exists; the *artifact* does not. This also **partially supersedes**
   `adoption-audit.md` §6.2 (*"story JSON with no image, no public token, no card"*):
   token and card ship; the image does not.

**Also corrected of record:** `design/03:286` states session distillation *"does NOT
exist — `session_distilled` is a reserved enum with zero producers."* It has a producer
(`distill.ts:82`) and a route (`rest.ts:1081`). B6's correction is itself stale.

---

## 7. Verdicts

### 7.1 Broadcast / streamer — **SCOPE, small, and it is a finishing pass not a build**

`[M]`, on the §2.3 inventory. The surface is ~90% built and mis-labelled. What
"Twitch mode" still needs is three finite things, none of them architecture:

1. the **chat adapter** — the transport ships (`chat:` namespace, 50 k voters, adapter
   authorisation), the *bridge* does not. Nothing authenticates to Twitch/YouTube and
   relays. This is an out-of-repo bot against a shipped API, not a product change;
2. the **attribution line** on the overlay (finding 4) — an honesty requirement the RFC
   already specified;
3. a **client vote form that matches the server** — the UI hardcodes two options
   (`App.svelte:796`, Option A / Option B) against a server accepting 2–8
   (`live-session.ts:183`). *"Chat votes on plans"* (`design/03:81`) needs more than
   two.

**Trigger: none needed — items 2 and 3 are defect-class and should be swept now.**
Item 1 is genuinely blocked on B5's standing revival condition (*"can not be validated
by use without other humans […] a streamer audience"*, `design/03:384-386`) and should
stay blocked. **Do not delete the `design/03` commitment**: it is met, and the B5 row
that says so is accurate.

**Do not build per-viewer withholding.** The 2026-08-12 ruling is correct, the code
matches it, and `BACKLOG:97`'s F1 clause naming it as a blocked consumer is stale.

### 7.2 Teacher / classroom — **DEFER with a named trigger, and rename the promise**

`[M]`. Three findings drive this:

- the *live* teaching case ships (§4.1) — the owner's coaching context can be piloted
  today with academy sessions, friend links, match seats and the simul wall;
- the *standing* case (roster, assignment, cross-learner progress) is absent and is a
  **different consent object**, not academy depth (§4.3, §4.4);
- our own audit already ruled it: *"defer to B5 depth"*, *"a cohort view is
  derivation"*, *"Conflict: none"* (`adoption-audit.md:143`) `[P]`.

**Trigger, stated so it can fire without another ruling:** build the teacher surface
when **a real second person is repeatedly coached through Tabiya and the coach asks
twice for something the per-run grant cannot express** — most likely *"what did they
do last week"* or *"everyone do pack C tonight."* Until then the honest answer to
"teacher mode?" is *"host an academy session; there is no roster yet."*

**But `design/03` should not keep promising it under a name it does not use.** Nothing
in the doc says "teacher" or "classroom" — the promise is *academy*, *cohorts* and
*events*, and cohorts/events are the genuinely unbuilt part. **Recommended `design/03`
edit (owner-tier, reported not made):** the §Live *"Arena and events"* row lists
scheduled pack nights, cohorts and team relays alongside two-leg matches, which
**ship**; the three unbuilt items should be marked as the open remainder rather than
sitting in a row whose B5 gate reads "shipped". That is the overstatement in this
neighbourhood, and it is the honest deletion the brief asked about — not the streamer
row, which is met.

### 7.3 The events layer — **MERGE into the teacher verdict**

`BACKLOG:325` (pack nights, cohorts, team relays) and the missing teacher aggregate are
the same object seen from two sides (§4.4). Ledgering them separately guarantees each
waits for the other. One row, one trigger.

---

## 8. Proposed ledger rows (report-only; `design/BACKLOG.md` is owner-tier)

1. **Flip `BACKLOG:61` (Streamer/Twitch mode) and `:62` (Academy/coached sessions).**
   Both still read *"#8 · blocked on F3"* — F3 shipped 2026-08-12, the surfaces shipped
   2026-08-13, and `rfc/archive/live-session-platform.md:1248-1250` explicitly proposed
   flipping them. **This is a live flow-back miss of exactly the shape the RFC-completion
   protocol was written to prevent** (`AGENTS.md:44-56`), and it is the most likely
   proximate cause of the owner's impression that these surfaces have nothing behind
   them: the ledger still says they are blocked. `:62`'s stated blocker (*"the lease
   cannot express a second writer role"*) was corrected as inaccurate in the same RFC
   section and never applied.
2. **New defect — match assistance asymmetry** (§3.4): `permittedAssistance` keys on
   governance role, so a host-seated player outranks a participant-seated player at a
   consented pause. Candidate fix: derive `mayRequestSplit` from *playing status* in a
   match session rather than from `role`.
3. **New defect — overlay adapter attribution missing** (§3.3, finding 4): specified in
   `rfc/archive/live-session-platform.md` §3.6.4/§3.10, absent from `App.svelte:803`.
4. **New defect — compact Session tab dead + inverted role condition** (§4.3, finding 6).
   Already visible in `mobile-scope.md:203`; not yet a ledger row.
5. **`DESIGN-GAP:` `design/05:147`** — five named assistance contexts, three shipped
   preference keys (finding 2). Either `AssistanceConfig` keys widen to include live
   session kind, or `05` narrows its claim.
6. **Merge `BACKLOG:325` (events layer) with a new teacher/roster row**, one trigger
   (§7.3).
7. **Corrections of record:** `design/03:286` (session distillation exists);
   `docs/live-sessions.md:126` (spectators get *less* assistance, not identical);
   `BACKLOG:97` F1's streamer-overlay clause (superseded by the 2026-08-12 ruling);
   `adoption-audit.md` §6.2 share-artifacts (token and card ship, image does not).

---

## 9. Residuals — what this dossier did not do

- **No new external research.** §5 is entirely our own corpus. Chess.com Classroom and
  ChessKid Classroom remain name-drops `[P]` with no teardown; if the teacher trigger
  fires, one grounded classroom teardown is the first thing owed.
- **No hands-on.** Nothing here was exercised in a browser: no OBS capture of
  `/live/overlay/:runId`, no two-account academy session, no relayed vote. Every
  behavioural claim is read from source. The overlay in particular has never been
  looked at by a human in this repo's record.
- **No reader study.** *"What does an overlay honestly show"* is answered structurally
  (§3.3), not by asking anyone whether the five rendered facts are worth watching.
- **The 50 000-voter cap and 128-char key bounds are read, not load-tested.**
