# RFC: Live surface honesty — a finishing pass on a surface that already ships

- **Status:** implemented — 2026-08-15
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/03-product-breadth.md` §Live and community — the **Streamer/Twitch**
  row (*"the streamer owns the live board; chat votes on plans or moves; the host snapshots,
  rewinds, branches, compares, and exposes an overlay"*, `:81-83`), the **Academy/coached
  session** row (`:84-86`), the nav row *"Live | Stream, academy/hosted session,
  events/spectate"* (`:257`), and the projection rule *"Stream overlays and spectator views
  are projections of the same run state, not separate products"* (`:271-272`);
  `design/05-in-run-experience.md:41` (*absence is stated, never simulated*), `:143-151`
  (*"A curated drill, Just Play, a match, a stream, and the on-ramp each get their own
  defaults"*), `:153` (§3a — the default is silence), and **§4 `:301-322`**, which is this
  RFC's warrant: *"A streamed session has an audience with different needs from the player…
  Assistance configuration per session context is currently implicit everywhere and should be
  explicit."*
  *Every code site below is cited **by symbol name**; line numbers are advisory. The tree
  moved roughly thirteen times on 2026-08-15. Locate `SESSION_KINDS`, `permittedAssistance`,
  `assistanceKey`, `loadAssistance`, `LiveSessionService.openVote`, `RunStorage.voteTally`,
  `LiveSessionDetail`, `VoteTally` and `openLiveVote` by name, not by number.*
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md`
  §Exploration gate). This RFC is opened by `design/research/broadcast-and-teacher-surfaces.md`
  (2026-08-15) §7.1, whose verdict is **"SCOPE, small, and it is a finishing pass not a
  build"** with the explicit trigger line *"none needed — items 2 and 3 are defect-class and
  should be swept now."* That dossier is this RFC's entire evidence base.
- **Depends on:**
  - `rfc/archive/live-session-platform.md` — owns the live-session aggregate, `SESSION_KINDS`,
    the vote surface, the chat-adapter rule (§3.6), the overlay projection (§3.10) and the
    2026-08-12 **no per-viewer withholding** ruling (§3.8). This RFC **does not revisit that
    ruling**; §2 restates it so it is true of the shipped code, and specifies the one
    attribution line §3.6.4 called for and the surface never grew.
  - `rfc/archive/adaptive-guidance.md` — shipped `permittedAssistance` and, with it, the
    role-parameterisation that made §3.8's *"byte-identical"* wording stale.
  - `rfc/live-marker-quality.md` (*implementing*) — **owns the `permittedAssistance`
    permission table and its four enforcement sites** (`/human-split`, `/corpus`, and via
    `requireGuidanceDisclosure` the `/voice` and `/speech` paths). This RFC touches **none**
    of them: §4 changes only the client-local *preference* keys, which are a different object
    from the permission ceiling. Lands in any order relative to it.
  - `rfc/teacher-surface.md` (*draft*) — owns **D80** and the classroom aggregate. §6.
- **Parent / amends:** amends the live surface at its edges only: two additive REST response
  fields (both in their two declarations), one client preference-key derivation, one client
  vote form, and two rendered honesty lines. **No migration. No run-schema change. No
  pack-schema change. No new session kind, no new `RunRole`, no new token scope, no new
  refusal code, no change to `permittedAssistance`.**
- **Supersedes / superseded by:** —
- **Planning:** `planning/live-surface-honesty/` (once implementing)

## Summary

The streamer surface is not missing. It ships as `SESSION_KINDS = ["stream", "academy",
"match"]` (`apps/server/src/live-types.ts`), a frozen three-member enum, SQL-constrained,
route-validated at `POST /sessions`, and offered as a three-way `<select>` in the client. Every
`design/03` §Live commitment is met and verified. The ledger read *"blocked on F3"* for three
days after the surface shipped, which is the entire reason it looked unbuilt. This RFC is
therefore a **finishing pass**: it closes three defects that the shipped surface carries — a
decorative `session.kind`, an assistance model that cannot tell three of its five named
contexts apart, and a missing chat-relay attribution line beside a vote form offering a quarter
of its own range — and it restates the standing no-per-viewer-withholding invariant so that
what the documents claim is what the code does. It claims **nothing versioned**.

## Motivation

### The honesty spine, which is why this is an RFC and not a chore

A live session multiplies disclosure surface area. One run acquires a host, participants,
spectators, an OBS capture aimed at strangers, and a chat relay carrying votes from people the
server cannot authenticate at all. Every one of those is a place where somebody could be told
something the run has not disclosed, or told something with more confidence than its provenance
earns.

Today's two closed defects were exactly that failure. D51 (*"A pivotal marker discloses rung-3
content past a permission the same modal enforces"*) and D68 (*"`evidencePacket` serves rung-3
divergence content past the permission `/human-split` enforces"*) were a rung-3 leak reachable
by a spectator through `/voice` and `/speech`, closed on 2026-08-15 by `7bcf164` under
`rfc/live-marker-quality.md`. Both lived on this surface. Both were found by looking, not by a
test failing.

So the spine of this RFC is not the three defects; it is the invariant they sit under, restated
in §2 so it is checkable. The three defects are what the finishing pass owes once the invariant
is stated correctly.

### Why now, and why it is small

`design/research/broadcast-and-teacher-surfaces.md` §7.1 measured the surface at ~90% built and
named three finite remainders, of which it ruled two defect-class and one genuinely blocked:

1. the **chat adapter bridge** — the transport ships (disjoint `chat:<adapter>:<key>`
   namespace, 128-character keys, 50 000-voter cap, adapter-must-be-a-designated-learner rule
   in `LiveSessionService.castVote`), but nothing authenticates to Twitch or YouTube and
   relays. That is an out-of-repo bot against a shipped API, and it stays blocked on B5's
   standing revival condition — *"none of it can be validated by use without other humans (a
   streamer audience, a coach, an opponent); its BACKLOG revival conditions… remain in force
   and are the real trigger"* (`design/03-product-breadth.md:384-388`). **Out of scope here,
   deliberately**;
2. the **attribution line** — §5;
3. a **vote form that matches the server** — §5.

Plus the two context defects the same pass found, D81 and D82, which are what stop the surface
from ever behaving differently for a stream than for a private drill.

### Explicitly out of scope

- **Per-viewer withholding.** The 2026-08-12 ruling stands unamended (§2). This RFC adds no
  viewer parameter to any projection.
- **Widening `SESSION_KINDS`.** The enum is **read** here, never extended. Three members in,
  three members out.
- **`permittedAssistance` and its four enforcement sites** — owned in flight by
  `rfc/live-marker-quality.md`, narrowed by `rfc/teacher-surface.md` §5. §4 does not touch the
  ceiling; it touches the learner's *preferences* under it.
- **D80 — *Assistance is keyed on governance role, not playing status — so one player at a
  match gets evidence the other cannot*** — **owned by `rfc/teacher-surface.md` §5**, which
  fixes it as a pure narrowing by adding a required `seatedInContest` to `AssistanceContext`.
  Named, not absorbed.
- **The teacher/classroom surface** — that RFC's, entirely.
- **D62 — *Two of four compact region tabs are inert, and one is dead by construction*** — owned
  by `rfc/client-surface-floor.md`. Its **Session** half is why an observed learner on a phone
  cannot see who is watching: the in-run half of this surface's who-is-here honesty, and it is
  not re-fixed here.
- **The chat adapter bridge**, above.
- **Cohorts, team relays and scheduled pack nights.** The roster half belongs to
  `rfc/teacher-surface.md`; relays and matchmaking remain outside minimal-real scope by the
  `design/03` B5 ruling.

## 1. What ships already, and is therefore not respecified

Verified in this pass against the working tree. Each is load-bearing below.

| Primitive | Symbol | State |
|---|---|---|
| The three session kinds | `SESSION_KINDS` (`apps/server/src/live-types.ts`), frozen; CHECK-constrained in `live_sessions`; validated in `rest.ts`'s `POST /sessions` closed body record; client `<select>` in `App.svelte` | ships |
| Host owns the board | `host_directed` board control + CAS'd lease; `mayControlSession` (`authorization.ts`) | ships |
| Chat votes | `LiveSessionService.openVote` — 2–8 legal options, 15–600 s window, legality checked by `legalAt`; tallies advisory, never move a piece | ships |
| Relayed chat identity | `LiveSessionService.castVote` — only the configured adapter may supply `voterKey`; server-side `chat:<adapterId>:<key>` prefix; 128-char bound; 50 000-voter cap; `session_votes.voter_key` CHECK admits exactly `learner:%` and `chat:%` | ships |
| The overlay | route `/live/overlay/:runId`, chrome-free (`ShellFrame … chrome={route.name !== "live-overlay"}`), rendering the active FEN on a disabled board, `node.objectiveState`, the branch count, the open vote tally, and the `withheld` line | ships |
| Viewer-blind projection | `feedbackDisclosed`, `feedbackDeliveryOpen` (`packages/runtime/src/feedback.ts`); `publicRunSnapshot`, `publicNodes`, `publicEvents` (`apps/server/src/feedback-policy.ts`) | ships |
| The rail cap | `permittedAssistance` (`packages/runtime/src/assistance.ts`), enforced at `/human-split`, `/corpus`, and via `requireGuidanceDisclosure` at `/voice` and `/speech` | ships; owned by `live-marker-quality` |
| Per-learner assistance preferences | `assistanceKey`, `loadAssistance`, `saveAssistance` (`apps/web/src/lib/assistance-preference.ts`), keyed `tabiya.assistance.v1.<kind>` | ships — and §4 is about *which* kinds |

**Nothing in §1 is changed by this RFC.** The B5 gate row at `design/03-product-breadth.md:285`
is accurate and stays.

## 2. The invariant, restated so it is true of the shipped code

### 2.1 The ruling is not reopened

`rfc/archive/live-session-platform.md` §3.8 rules: **`feedbackDisclosed` keeps taking no viewer
parameter, and this RFC adds no per-viewer withholding anywhere.** Its four reasons hold
verbatim — per-viewer reveal cannot enforce blind play (the streamer can spectate from a second
account); uniform withholding closes the direction that matters by construction; a second
disclosure path is the D4/D8 two-sources-of-truth defect class applied to the one boundary the
product cannot get wrong; and the academy reveal case is already `POST /runs/:id/reveal` under
the host's lease. **This RFC adds no viewer parameter to any projection and proposes no
change to that ruling.**

### 2.2 What did stop being true, and it is the wording, not the ruling

§3.8's supporting sentence reads *"two viewers of the same run receive byte-identical output."*
That was true when written. `rfc/archive/adaptive-guidance.md` (B10, 2026-08-14) then shipped
`permittedAssistance`, whose rule is

```ts
const mayRequestSplit = (context.role === "solo" || context.role === "host") && context.deliveryOpen;
```

so a spectator or participant receives strictly less than the host: `humanSplit` and `corpus`
`locked_off`, `boardLighting` and `arrows` capped at `sight` instead of `evidence`. The
difference is enforced server-side on four routes. **The direction is safe** — non-hosts see
less, never more — so no honesty law was broken. But `docs/live-sessions.md:126` still states
*"Tabiya therefore gives player and spectator the same disclosure projection"*, which is now
true of the run projection and **false of the assistance rail**. That is a `DESIGN-GAP:` at
docs tier; the correction is **reported in §7, not made** here.

### 2.3 The restatement

The invariant this surface is governed by, in four clauses, each checkable against a named
symbol:

- **I1 — run state is viewer-blind.** `feedbackDisclosed(run)`, `feedbackDeliveryOpen(run)`,
  `publicRunSnapshot(run)`, `publicNodes(run)` and `publicEvents(run, sinceSeq)` take a run and
  **no viewer**. Two authenticated readers of one run at one sequence receive byte-identical
  run state, including the `withheld` flag. Authorization is a separate and earlier gate.
  *This is the clause §3.8's "byte-identical" sentence was actually about, and it is
  undamaged.*
- **I2 — the assistance rail is capped by role and never raised by it.**
  `permittedAssistance` is role-parameterised. For every context, its value for any role is
  pointwise **≤** its value for `solo`/`host` at the same `deliveryOpen`, under
  `locked_off < free` and `sight < evidence`. No route may serve rail content above that cap —
  which is precisely the property D51 and D68 broke and `rfc/live-marker-quality.md` restores.
  A role-parameterisation that *lowered* a cell (`teacher-surface` §5's `seatedInContest`)
  preserves I2; one that raised a cell would violate it.
- **I3 — the run's own disclosure bounds everyone.** Both I1's projection and I2's cap are
  functions of `deliveryOpen`/`disclosed`, which are functions of the run alone. So no
  viewer — host, participant, spectator, or overlay — receives engine evidence before the run
  discloses it. This is the direction §3.8's reason 2 protected, and it is exactly what
  survives B10.
- **I4 — every difference is stated, never simulated.** Where a viewer receives less, the
  surface says so: `withheld: true` on the events page, `ASSISTANCE_WITHHELD` on the four rail
  routes, and the overlay's *"Host is ahead; evidence is withheld until this run discloses."*
  (`design/05-in-run-experience.md:41`.)

**The single sentence, for `docs/`:** *no per-viewer withholding — run state is projected
identically to every reader, and the assistance rail differs only by being capped lower for
non-hosts, never raised, and never above what the run itself has disclosed.*

I4 is why §5 exists: an unattributed vote tally on an overlay is a difference that is **not**
stated. It presents counts from unauthenticated strangers with the same weight as counts from
signed-in members, on the one surface aimed at people who cannot check.

## 3. D81 — *`session.kind` is decorative*

### 3.1 The measurement

`session.kind` is branched on in exactly two places in `LiveSessionService`, **both requiring
`match`**: `create`'s match board-control guard (`input.kind !== "match"` under
`boardControl === "match"`) and `importLeg`'s PGN-leg guard. Two further guards inside
`RunStorage.createLiveSession` — the match-seating insert and the `kind === "match" &&
boardControl !== "match"` arena-leg insert — are the rest of the server side; four server
branches in total, every one of them testing `match`. Client-side there are three: the
session-detail eyebrow, the match-only invitation leg (in the form and again in
`inviteLiveParticipant`'s payload), and the Arena section. **No code path anywhere behaves
differently for `stream` than for `academy`.** Both are labels on the same aggregate; the
differentiating machinery is `boardControl`, not `kind`. So per-context policy has no field to
hang on — which is exactly what D82 needs and cannot get.

(The ledger row **D81 — *`session.kind` is decorative*** says "exactly two behavioural branches
server-wide"; it is counting the service, and the two storage guards are inside the same
`create` call it names. The count above is the exhaustive one and does not change the row's
finding.)

### 3.2 The position: read the enum; do not widen it

**`session.kind` should become behavioural, at the smallest possible size: one read site, in the
client, of members that already exist.** Not a fourth member. Not a new branch in the session
service. §4's assistance-profile derivation is that site, and it is the only read this RFC adds.

Stated exactly, because §4.3 is the normative text and it reads **two** members, not one:
`stream` is the member the design tier asks for, and `match` is read at the same site purely as
a **preference-profile selector** (§3.3's middle case). Neither read is a permission input, and
no member is added.

The warrant is design-tier and specific. `design/05-in-run-experience.md` §4 (`:301-322`) names
four things that vary by context, and the third is *"What assistance is permitted here?… **A
streamed session has an audience with different needs from the player**, and the owner has
already ruled that a streamer may cheat on themselves. Assistance configuration per session
context is currently implicit everywhere and should be explicit."* `:147` then names *a stream*
as one of five contexts that *"each get their own defaults."* Two design documents ask for the
stream context to be distinguishable. Exactly one fact in the system says a run is being
broadcast, and it is `session.kind === "stream"`.

### 3.3 How this squares with `rfc/teacher-surface.md`'s refusal — it agrees with it

That RFC's §6 refuses to make `kind` behavioural, on three grounds, and **all three are
correct**:

- a classroom is not a session — it is standing and asynchronous, and hanging a roster off a
  live-session label would be the category error `broadcast-and-teacher-surfaces.md` §4.4
  warns about;
- it needs no per-context assistance policy, so it has nothing to hang on `kind`; its D80 fix
  reads `match_states`, an already-persisted relation;
- adding a fourth member (`classroom`) would widen a closed, SQL-constrained, route-validated
  enum to gain a label that `classroom_id` expresses better, **as a relation**.

Its cross-review then closes the stress test at symbol level: D82's gap is on **`RunSessionKind
= pack | position | imported`** (`packages/runtime/src/types.ts`), a different type in a
different package on a different aggregate from `SESSION_KINDS`, so a fourth `SESSION_KINDS`
member *would not have paid for D82 even in the future where D82 is paid for*. That is right,
and this RFC confirms it independently: §4's fix does not add a `SESSION_KINDS` member.

**The two positions are not in tension, because they are about opposite operations.**

| | `teacher-surface` §6 | here |
|---|---|---|
| Operation | **widen** the enum with a fourth member | **read** the three members that exist |
| Purpose | express a standing relation (classroom ↔ session) | distinguish one live context (`stream`) |
| Better alternative | yes — `live_sessions.classroom_id`, a relation that answers *which* classroom | **none; the three candidates are all worse, below** |

That last row is the whole argument, and it was checked rather than asserted. A classroom has a
better referent than a label, so the label is refused. **A stream has no comparable referent.**
There is no `stream_states` table and no run field; three things in the persisted world touch
the neighbourhood, and each was examined and rejected:

| Candidate | What it actually means | Why it is not the referent |
|---|---|---|
| `run_grants.role = 'spectator'` (`RUN_ROLES`, `apps/server/src/storage.ts`) | a named, authenticated learner may read this run | It answers *who may read*, per person, and is present identically in academy and match sessions. A stream's audience is precisely the population with **no** grant — it watches OBS output and votes through a relay. Zero spectator grants is the normal state of a streamed run |
| `public_tokens` with `scope: "session_join"` and `invitedRole: "spectator"` | a revocable, expiring invitation for one named seat | Same objection, plus it is an invitation rather than a state: minting one does not make a run broadcast, and a stream needs none |
| `live_sessions.vote_adapter_learner_id` | a chat relay account is configured | The closest candidate, and still wrong. It is nullable and **NULL in every session that exists today**, because the bridge that would use it is blocked on B5. Deriving "streamed" from it would make the profile flip when a host configures a relay — a different fact, and one the product cannot yet produce |

So the enum member is the only fact that says *this session is a broadcast*, and it is one the
product already stores, constrains, validates and renders in a dropdown. Refusing to read it
would not be conservatism; it would leave a shipped, closed, owner-visible field permanently
decorative while the design tier asks twice for the distinction it encodes.

`match` is the instructive middle case and it proves the rule rather than breaking it: it *does*
have a better referent (`match_states`), and `teacher-surface` §5 correctly reads that relation
rather than the label. §4 below reads `kind === "match"` only as a **profile selector**, never
as a permission input — the permission-relevant fact stays `match_states`, where that RFC put
it.

**So: D81 is closed by §4's single read, and closed at the minimum.** The enum keeps three
members. `academy` remains, correctly, non-behavioural — it is not one of `design/05:147`'s
five contexts, and under `teacher-surface` its distinguishing fact will be `classroom_id`.

## 4. D82 — *five named assistance contexts against three shipped preference keys*

### 4.1 The measurement, and it is worse than three-of-five

`design/05-in-run-experience.md:147` promises: *"A curated drill, Just Play, a match, a stream,
and the on-ramp each get their own defaults."* The shipped preference key is `RunSessionKind`:

- `assistanceKey(kind)` writes `tabiya.assistance.v1.<kind>` (`assistance-preference.ts`);
- `RunSessionKind = "pack" | "position" | "imported"` (`packages/runtime/src/types.ts`);
- `AssistanceSettings.svelte` hardcodes exactly three `loadAssistance` calls, one per member;
- `DrillScreen.svelte` loads and saves on `run.sessionKind`.

So **a match, a stream and the on-ramp all collapse into `position`** — and the mapping is not
even three-of-five, because the third shipped key, `imported`, corresponds to **none** of the
five named contexts. The true state is: two of five contexts have a key, three share one key,
and one key names a sixth context the design does not list. A context-sensitive assistance model
that cannot tell three of its five contexts apart is not context-sensitive.

This is flagged `DESIGN-GAP:` — `design/05` is owner tier. This RFC therefore **proposes the
code side and reports the doc change** (§7).

### 4.2 The fix: a preference profile, distinct from the permission context

Two different things are called "session kind" today, and conflating them is what made the gap
invisible. They are separated here and stay separated:

| | The **ceiling** | The **preference** |
|---|---|---|
| Symbol | `AssistanceContext` / `permittedAssistance` (`packages/runtime/src/assistance.ts`) | `assistanceKey` / `loadAssistance` (`apps/web/src/lib/assistance-preference.ts`) |
| Meaning | what a viewer *may* be shown | what this learner *asked* to be shown |
| Enforced | server-side, four routes | client-local, `localStorage` |
| Owner | `rfc/live-marker-quality.md`, narrowed by `rfc/teacher-surface.md` §5 | **this RFC** |

**This RFC changes only the right-hand column.** `AssistanceContext` is not edited, no field is
added or removed, `permittedAssistance` is byte-for-byte unchanged, and the four enforcement
sites are untouched. A preference can never exceed the ceiling, checked field by field in
`DrillScreen.svelte`: `humanSplit` and `corpus` render their controls `disabled` and their
request buttons behind `assistancePermission.* === "free"`; `boardLighting` is clamped by
`effectiveLighting` (`"evidence"` degrades to `"sight"` when the permission is not `evidence`);
and `arrows` is clamped vacuously because **no client surface renders arrows at all** — a
stored preference with no consumer, reported in §7 rather than fixed here. Widening the
preference key set therefore cannot widen disclosure. **The change is a partition of an
existing key space, not a permission change.**

Note in passing, and do not fix here: `AssistanceContext.sessionKind` is declared and **never
read** by `permittedAssistance`. It is a field on a type two other drafts are actively editing.
Removing or repurposing it is theirs; §7 reports it.

### 4.3 Specification

Add to `apps/web/src/lib/assistance-preference.ts`:

```ts
export const ASSISTANCE_PROFILES = Object.freeze([
  "pack", "position", "imported", "match", "stream", "onramp",
] as const);
export type AssistanceProfile = (typeof ASSISTANCE_PROFILES)[number];

export function assistanceProfile(input: {
  readonly sessionKind: RunSessionKind;
  readonly feedbackPolicy: RunFeedbackPolicy;
  readonly liveKind?: SessionKind;      // the run's open live session, if any
}): AssistanceProfile {
  if (input.feedbackPolicy === "immediate_guard") return "onramp";
  if (input.liveKind === "stream") return "stream";
  if (input.liveKind === "match") return "match";
  return input.sessionKind;             // "pack" | "position" | "imported"
}
```

`assistanceKey` takes `AssistanceProfile` instead of `RunSessionKind`; `loadAssistance` and
`saveAssistance` follow. The key namespace stays `tabiya.assistance.v1.<profile>` and
`AssistanceConfig.version` stays `4`.

The three input types are all already available at that file with **type-only** imports and no
cycle: `RunSessionKind` and `RunFeedbackPolicy` from `@chess-tabiya/runtime` (the module already
imports from it), and `SessionKind` from `./api.js`, which declares it at
`apps/web/src/lib/api.ts` and does not import `assistance-preference.js`.

Each clause is a verified fact, not a heuristic:

- **on-ramp** is `run.feedbackPolicy === "immediate_guard"`, the member
  `archive/onramp-guard.md` added at pack schema 0.14 / run schema 0.11, and the one arm of
  `feedbackDisclosed` that returns `true` unconditionally;
- **stream** is `session.kind === "stream"` — §3;
- **match** is `session.kind === "match"`, which covers **both** shipped match contexts, and the
  bucket it draws from is wider than `position`. Checked, because the obvious claim is false:
  the *"untouched `position` run"* requirement in `LiveSessionService.create` is gated on
  **`boardControl === "match"`** (the native two-player match), **not** on `kind === "match"`.
  The imported-Arena path is `kind === "match"` with `boardControl !== "match"` — that is
  exactly the branch that inserts the two `arena_legs` rows — and it carries no such
  requirement, so an Arena session may sit on a `pack` or already-played run. The `match`
  profile therefore siphons from `position` **and possibly `pack`/`imported`**. That is safe
  because of §4.5's floor, not because of any refinement: whatever bucket a run leaves, the new
  key reads absent. Both contexts are *a match* in `design/05:147`'s sense, which is why one
  profile is right for both;
- everything else falls through to the shipped `RunSessionKind`, so **`pack`, `position` and
  `imported` keep their exact present meaning and their stored values**.

**Ordering rule, stated because it is a choice:** on-ramp outranks the live kinds. A guarded
first-contact run that happens to be streamed is still a guarded first-contact run for the
person playing it, and the guard is the point of that context. Cheap to flip; Open question 2.

### 4.4 Wiring

- `DrillScreen.svelte` gains one optional prop, `liveSessionKind?: SessionKind` (default
  `undefined`), and its two preference calls become
  `assistanceProfile({ sessionKind: run.sessionKind, feedbackPolicy: run.feedbackPolicy, liveKind: liveSessionKind })`.
- `App.svelte` passes `activeLiveDetail?.session.kind` at its `<DrillScreen>` usage.
  `activeLiveDetail` is already fetched on entry to the `run` route (from the `liveSessions`
  list, matched on `runId`) and already refreshed by `syncLivePolling`'s 2 s interval, so **no
  new request is introduced**. One shipped limit inherited rather than created: the poll reads
  `activeLiveDetail?.session.id` and returns early when it is `undefined`, so a session opened
  on a run the learner is *already* sitting on is not picked up until the next navigation. The
  profile inherits that latency exactly; Open question 6 states it.
- `AssistanceSettings.svelte`'s three hardcoded `loadAssistance` calls become a loop over
  `ASSISTANCE_PROFILES`, rendering six labelled sections: *Curated drill*, *Just Play*,
  *Imported game*, *Match / Arena*, *Streamed session*, *On-ramp* — the fourth label matching
  the client's own kind dropdown, because §4.3 shows the profile covers both match contexts.
- The overlay route renders no assistance rail and gains nothing here. The stream profile
  governs the drill screens of the host and of anyone watching in a full client — which is
  where a rail exists to configure.

### 4.5 Migration of stored preferences: none, and deliberately none

The three shipped keys are unchanged and keep their values. The three new keys read as absent
and therefore resolve to `SILENT_ASSISTANCE` on first use. **No inheritance from the old key is
specified, and that is the honest direction:** a learner who enabled everything under *Just
Play* — their own game, where §4 of `design/05` says they may want everything — has not thereby
asked for it in a match against another human or in front of an audience.

**Direction check, as arithmetic — and it has exactly one exception, which is stated rather
than rounded off.** For every existing learner and every context, the resolved configuration
after this change is either identical (the three shipped profiles) or `SILENT_ASSISTANCE` (the
three new ones). `SILENT_ASSISTANCE` is the floor of `AssistanceConfig` in **eight of its nine
fields** — `markers`/`guided`/`humanSplit`/`corpus`/`spoken`/`arrows`/`ambient` are their
enums' `off`, `voice` is `authored`. The ninth is **`boardLighting: "legal"`**, and the enum is
`off | legal | sight | evidence`, so a learner who had explicitly set `boardLighting: "off"`
under *Just Play* and then plays in a `stream`, `match` or on-ramp context resolves to `legal`
— **one cell that rises**, from no highlighting to legal-move highlighting.

That cell is rung 0. `legal` renders the rules and nothing else: no engine, no corpus, no
tablebase, no authored claim, and no disclosure-bearing content of any kind. It is also the
shipped product default that every fresh context has always started from. So the precise claim,
and the one the acceptance criteria test, is: **the change is monotone non-increasing in every
disclosure-bearing channel, and no evidence a run has not disclosed can be turned on by it.**
The single non-monotone cell is rules-tier and is named here so it is a decision rather than an
accident. It is consistent with `design/05` §3a (*the default is silence*) — silence is about
claims, and `legal` makes none.

## 5. D83 — *the chat-relay attribution line is absent*, and the vote form offers a quarter of its range

### 5.1 The attribution line

`rfc/archive/live-session-platform.md` §3.6.4 specifies the documented limit and where it must
appear: *"the server dedupes by `voterKey` but cannot authenticate chat users. A tally is
exactly as trustworthy as the adapter reporting it… This is stated in `docs/`, **surfaced in the
overlay as an attribution line naming the adapter handle**, and not engineered against."* §3.10
repeats it in the overlay's render list: *"the active position, the objective state, the branch
list, the open vote tally, and the adapter attribution line from §3.6.4."* `docs/live-sessions.md`
carries the obligation forward: *"The tally is only as trustworthy as the adapter that submitted
it, **and the UI says so.**"*

**The overlay renders `{item.label}: {item.count}` and nothing else.** Verified absent. The only
adapter sentence anywhere in the client is a static line on the `/live` wall — *"Vote tallies
are advisory. Chat identity is only as trustworthy as the configured adapter."* — which is
generic, sits on a different page from any tally, and is invisible to the audience the overlay
exists for. This is an I4 violation on the surface with the least equipped readers.

**Specification, and it is a refinement of §3.6.4 rather than a transcription of it.** Naming
the adapter beside the whole tally would attribute *member* votes to the adapter, which is a
second untruth. The relayed count is already derivable, exactly and cheaply, because
`session_votes.voter_key` carries a CHECK admitting only `learner:%` and `chat:%`:

1. **`VoteTally` gains `readonly relayed: number`** — one extra aggregate inside
   `RunStorage.voteTally` beside its existing `GROUP BY choice_uci`, counting rows of this
   `(session_id, window_id)` whose `voter_key LIKE 'chat:%'` **and whose `choice_uci` is one of
   the window's options**. The second conjunct is what makes `relayed ≤ total` a theorem rather
   than an observation: `total` is summed over the window's options, so an unmatched row would
   otherwise be counted in one and not the other. (`castVote` refuses a `choiceUci` outside the
   options and the options are immutable after `createVoteWindow`, so today the two sets
   coincide; the aggregate is written to stay exact if that ever stops being true.) Recasts need
   no special handling: `session_votes`' primary key is `(session_id, window_id, voter_key)` and
   `castVote` upserts on it, so one key is one row whatever it does. The field is added in
   **both** declarations, `apps/server/src/live-types.ts` and the client mirror in
   `apps/web/src/lib/api.ts`, per the §3.9 precedent that a projection declared twice must not
   drift.
2. **`LiveSessionDetail` gains `readonly voteAdapter?: LeaseIdentity`** — `{ learnerId, handle }`,
   resolved in `LiveSessionService`'s detail projection with `RunStorage.learnerById`, following
   the shipped `leaseHeldBy` idiom exactly. `LeaseIdentity` is the shipped name in both files
   (`apps/server/src/storage.ts`, which `live-types.ts` already imports from, and
   `apps/web/src/lib/api.ts`); no new type is introduced. Absent when
   `session.voteAdapterLearnerId` is undefined — which is **also how a deleted adapter account
   presents**, because `live_sessions.vote_adapter_learner_id` is
   `REFERENCES learners(id) ON DELETE SET NULL`, so the column is nulled rather than left
   dangling and `learnerById` is never called with a stale id. The `learnerById === undefined`
   arm is therefore an unreachable-today fallback, kept because a revocation path that unsets
   the adapter differently must not be able to reintroduce the defect silently. Mirrored in
   `apps/web/src/lib/api.ts`.
3. **Both the overlay and the session-detail tally render exactly one line beneath the tally**,
   chosen by the counts, never omitted:

   | Condition | Line |
   |---|---|
   | `total === 0` | *"No votes yet."* |
   | `relayed === 0` | *"N votes, all from signed-in members."* |
   | `relayed > 0`, adapter resolves | *"R of N votes relayed by @handle. Tabiya cannot verify chat identities; a tally is only as trustworthy as its adapter."* |
   | `relayed > 0`, adapter absent | *"R of N votes were relayed by an adapter account that is no longer configured. Tabiya cannot verify chat identities."* |

   The fourth row is not defensive padding: it is the state a revoked or deleted adapter leaves
   behind, and rendering nothing there would restate the whole defect in a corner.

**Law 8 note.** The line renders counted, persisted facts — a `voter_key` prefix and a handle.
It makes no chess claim, grades no move, and is not generated text.

### 5.2 The vote form

`LiveSessionService.openVote` accepts **2–8 options** and a **15–600 second** window, and checks
every option with `legalAt`. The client's `openLiveVote` hardcodes all three of its inputs: two
options built from `liveVoteMoveA`/`liveVoteMoveB`, `durationSeconds: 60`, and the prompt string
`"Which continuation?"`. A shipped surface is offering a quarter of its own option range and none
of its window range, and `design/03`'s commitment is *"chat votes on **plans** or moves"* —
which two unlabelled UCI strings cannot express.

Specification:

- **Options: a bounded list, 2–8.** `liveVoteOptions: { moveUci: string; label: string }[]`,
  initialised at length 2, with add and remove controls disabled at the bounds. The bounds are
  written once as constants mirroring `openVote`'s check; the client never re-implements the
  check, it only stops offering the control.
- **Labels are host-authored and separate from the move.** `VoteOption` already carries
  `{ moveUci, label }`, and the route already parses `label` as a **required** string
  (`rest.ts`'s `options` mapper), so the plan-label path is complete server-side and the gap is
  entirely the client's: it assigns `label = moveUci`. The label input defaults to the UCI as
  typed and is editable. **Law 8:** a label is attributed human text from the host, never
  generated and never a claim about the position.
- **The prompt is an input**, defaulting to `"Which continuation?"`.
- **Label and prompt carry a client-side `maxlength`** (label 40, prompt 120) because both are
  rendered on the overlay, which is a fixed-width video surface with no wrapping budget. The
  server bounds neither today; adding a server bound would be a new refusal, so it is
  deliberately not proposed — the client stops offering what it cannot render, exactly as it
  does for the option count.
- **The window is an input**, defaulting to 60 and bounded 15–600.
- **The client adds no legality claim of its own.** Legality stays server-side in `legalAt`; the
  client submits and renders the refusal. It must not grey out, reorder or annotate moves.
- The disabled-state hint currently reads *"Two legal UCI moves are required."* It becomes
  *"Two to eight legal UCI moves are required."* — an I4 case in miniature: the hint was stating
  a limit the product does not have.

### 5.3 What this does not do

It does not build the bridge. With this landed, a streamer still has nothing that logs into
Twitch; what they have is a surface that tells the truth about the votes a bridge would relay,
and a form that can express the votes `design/03` promised. The bridge stays blocked on B5's
revival condition, and that is correct.

## 6. Dependencies named, not absorbed

| Item | Owner | Why not here |
|---|---|---|
| **D80** — assistance keyed on governance role, so the host-seated player gets evidence the guest cannot | `rfc/teacher-surface.md` §5 | It fixes it as a **pure narrowing** (`seatedInContest` as a required field on `AssistanceContext`, `mayRequestSplit ∧ ¬seatedInContest`). That is a change to the permission ceiling; §4 here is a change to preferences. Taking it would put two drafts on one type |
| The teacher / classroom surface, enrolment, assignments, rosters | `rfc/teacher-surface.md` | Standing and asynchronous; a different consent object from a session |
| **D62** — the inert compact **Session** tab and its inverted role condition | `rfc/client-surface-floor.md` | It is the reason an observed learner on a phone cannot see who is watching — the in-run half of this surface's who-is-here honesty. Declared as a dependency; **I4 is unmet on a phone until it lands** |
| The `permittedAssistance` table and its four enforcement sites | `rfc/live-marker-quality.md` | §2's I2 is stated *about* that table; this RFC does not edit it. Lands in any order |
| The chat adapter bridge | nobody — blocked | `design/03:384-388`, B5's revival condition |
| Cohorts, scheduled pack nights, team relays | `rfc/teacher-surface.md` (roster half); ledger (relays) | Not a broadcast concern |

## 7. Register claims — **this RFC claims nothing versioned, and that is the better outcome**

Stated loudly, because the drafting brief asked for it and because it is true.

| Register | Claim |
|---|---|
| **Migration** | **none.** `STORAGE_VERSION` is untouched. `VoteTally.relayed` is a derived aggregate over the existing `session_votes.voter_key` column and its existing CHECK; `voteAdapter` is a projection of the existing `live_sessions.vote_adapter_learner_id` through the existing `learnerById`. No table, no column, no index, no backfill. **Migration 21 stays free for `rfc/teacher-surface.md`** |
| **Run schema** | **none.** Stays **0.15**. No run event is added; session machinery stays in the session journal per `design/05` invariant 6 |
| **Pack schema** | **none.** Stays **0.22**. **0.23 is not claimed** — both parallel drafts that may want it are unblocked by this one, and **0.19 stays frozen shut** |
| **`SESSION_KINDS`** | **read, never widened.** Three members in, three members out. No CHECK constraint moves, no route validation changes |
| **`RunSessionKind`** | **unchanged** (`pack \| position \| imported`). `AssistanceProfile` is a **new client-local type** in `apps/web/src/lib/`, not a widening of the runtime type |
| **`permittedAssistance` / `AssistanceContext`** | **untouched.** Owned by `rfc/live-marker-quality.md`; narrowed by `rfc/teacher-surface.md` §5. Neither is blocked by, nor blocks, this RFC |
| **Preference key namespace** | additive only: `tabiya.assistance.v1.<profile>` gains three namespaces (`match`, `stream`, `onramp`). `v1` unchanged, `AssistanceConfig.version` stays `4`, the four `migrate` arms are untouched, and **no stored value is rewritten** — the three shipped keys are read exactly as today and keep their meaning |
| **REST response shape** | two additive derived fields — `VoteTally.relayed` (**required**, always computable from `session_votes`) and `LiveSessionDetail.voteAdapter` (**optional**, absent when the column is NULL) — each declared in **both** the server type and the `apps/web/src/lib/api.ts` mirror, which are the only two declarations of either type in the tree (verified) |
| **Refusal codes** | **none.** No `ServerErrorCode` member is added. Swept: the option-count and `durationSeconds` bounds refuse as **`INVALID_REQUEST`**; the vote path can also return the shipped **`VOTE_WINDOW_CLOSED`** and **`VOTE_INTAKE_FULL`**; the rail routes use the shipped **`ASSISTANCE_WITHHELD`** (`live-marker-quality`'s, unchanged here). §5.2's form renders whichever it receives and re-implements none of them |
| **Token surface** | **none.** `public_tokens` untouched |
| **`rfc/README.md`** | **not edited by this draft**, per the drafting instruction — and its **Active row already exists**, added by `c7fe539` (*"register the three unregistered drafts"*) when this draft was registered. So the accepting commit adds **no row at all**: it flips this one's status and adds **no register rows**, because there is nothing to register |
| **Ledger rows this RFC ships** | **D81 — *`session.kind` is decorative*** — closed by §3/§4's single read site. **D82 — *Five named assistance contexts against three shipped preference keys*** — closed on the code side by §4; its `DESIGN-GAP:` half is reported below. **D83 — *The chat-relay attribution line is absent*** — closed by §5, including the duration and prompt hardcodes, which are the same defect shape as the option hardcode the row names. **These rows are not "owner tier":** `AGENTS.md` (2026-08-15) settles that `design/BACKLOG.md` is a **shared register every tier writes to**, so the implementing commit flips all three 💡→✅ with one-line summaries **and appends its entry to `planning/exploration/log.md`**, per the completion protocol. This draft leaves them unflipped only because they are not yet shipped |

**Corrections and doc changes reported, not made** (`design/` and `docs/` are not this agent's
to edit):

1. **`docs/live-sessions.md:126`** — *"Tabiya therefore gives player and spectator the same
   disclosure projection"* overstates §3.8 since B10. Proposed replacement is §2.3's single
   sentence. This is the same correction `broadcast-and-teacher-surfaces.md` §8 item 7 proposed.
2. **`design/05-in-run-experience.md:147`** — names five contexts; the shipped and specified set
   is **six**, because `imported` (`archive/game-import-and-story.md`) is a real context the
   sentence omits. Either it names six, or `imported` is declared not to be a context of its own.
3. **`AssistanceContext.sessionKind` is declared and never read** by `permittedAssistance`
   (verified against `packages/runtime/src/assistance.ts`). Reported for whoever next owns that
   type; deliberately not touched here while two drafts are editing it.
4. **New ledger row owed — not merely proposed:** the vote form's `durationSeconds` and
   `prompt` are hardcoded against a 15–600 s server range and a free-text field — the same
   finishing-pass class as D83's option count, swept together in §5.2. Law 4 makes the row due
   **at utterance**, so it is owed by whoever next writes the ledger, not by the accepting
   commit; this draft could not add it because its edit boundary was one file.
5. **New ledger row owed — `arrows` is a preference with no consumer.**
   `AssistanceConfig.arrows` is stored, migrated across four config versions, offered as a
   three-way `<select>` in `AssistanceSettings.svelte`, and capped by `permittedAssistance` —
   and **no client surface reads it**. A control that renders and does nothing is the D62 class
   (*"Two of four compact region tabs are inert, and one is dead by construction"*), on the same
   settings screen §4.4 edits. Found by this cross-review; out of scope here because it is a
   renderer question, not a keying question.

## Deviations from design

1. **§3.6.4 specified "an attribution line naming the adapter handle"; §5.1 specifies a
   tally-derived line that separates relayed from member votes.** A line naming the adapter
   beside an undivided tally would attribute signed-in members' votes to an unauthenticated
   relay — a second untruth in the name of closing the first. The relayed count is exact and
   free, given the `voter_key` CHECK. Refinement in the direction of the specification's own
   purpose, recorded rather than assumed.
2. **`design/05:147` names five assistance contexts; §4 ships six profiles.** The sixth,
   `imported`, is shipped today and named by no design sentence. `DESIGN-GAP:` reported in §7,
   not made.
3. **`docs/live-sessions.md:126`.** As §2.2. Reported in §7, not made.
4. **`design/03:285`'s B5 row reads "shipped" and stays.** It is accurate. This RFC changes no
   gate row and proposes no deletion of the §Live commitments — the streamer row is **met**.

Otherwise: none.

## Acceptance criteria

**The invariant (§2):**

1. A test enumerates the viewer-blind projections — `feedbackDisclosed`, `feedbackDeliveryOpen`,
   `publicRunSnapshot`, `publicNodes`, `publicEvents` — and asserts none takes a viewer, role or
   principal parameter, failing if a sixth projection is introduced without a case. (I1, and the
   guard on the 2026-08-12 ruling.)
2. For a run at every disclosure state, `permittedAssistance` for `participant` and `spectator`
   is pointwise ≤ its value for `host` and `solo` under `locked_off < free`, `sight < evidence`.
   The test asserts the **ordering**, not the literal table, so neither
   `rfc/live-marker-quality.md`'s enforcement work (verified: `7bcf164` changed `rest.ts`,
   `pivotal.ts` and `DrillScreen.svelte`, and **did not touch
   `packages/runtime/src/assistance.ts`**) nor `rfc/teacher-surface.md` §5's narrowing
   (`mayRequestSplit ∧ ¬seatedInContest`, monotone decreasing) can falsify it. Stated exactly:
   what survives is the *assertion*; when §5 lands, the test's context literals gain the new
   required `seatedInContest` field, which is a compile-time edit at one constructor and is the
   coupling working. (I2.)
3. `permittedAssistance` returns byte-identical tables before and after this RFC for all four
   roles at both `deliveryOpen` values — the regression guard that §4 is a preference change and
   not a permission change.

**D81 / D82 (§3, §4):**

4. `assistanceProfile` returns `onramp` for an `immediate_guard` run regardless of live kind;
   `stream` for an `attempt_end` run in a `stream` session; `match` in a `match` session;
   and the run's own `sessionKind` with no live session, for each of `pack`, `position`,
   `imported`. Six cases, one per profile, plus the precedence case (`immediate_guard` **and**
   `stream` → `onramp`), plus the Arena case that §4.3's corrected bullet names: a `pack` run in
   a `kind: "match"`, `boardControl: "host_directed"` session returns `match`, not `pack`.
5. A learner with a stored `tabiya.assistance.v1.position` configuration opens a run in a
   `stream` session and receives `SILENT_ASSISTANCE`, not the stored Just Play configuration;
   the stored `position` value is unchanged on disk. Saving under `stream` does not write the
   `position` key.
5b. **The §4.5 direction check is a test, including its exception.** For a stored configuration
   with every field set to its maximum, resolving under each of the three new profiles returns
   `SILENT_ASSISTANCE`; and for a stored configuration with `boardLighting: "off"`, the
   resolved value differs from the stored one in **exactly one field**, `boardLighting`, and in
   no disclosure-bearing field. The test names the exception so a later widening of
   `SILENT_ASSISTANCE` cannot smuggle a second one in.
6. `AssistanceSettings.svelte` renders one section per `ASSISTANCE_PROFILES` member; a test
   fails if a profile is added without a section, so the count cannot silently regress to three.
7. `SESSION_KINDS` still has exactly three members and the `live_sessions` CHECK is unchanged; a
   test asserts both.

**D83 (§5):**

8. With a configured adapter and a window carrying three relayed and two member votes, both
   `/live/session/:id` and `/live/overlay/:runId` render *"3 of 5 votes relayed by @handle…"*.
   With zero relayed votes the line reads *"5 votes, all from signed-in members."* With relayed
   votes and no resolvable adapter, the fourth line renders. No path renders a tally with no
   line beneath it. (I4.)
9. `VoteTally.relayed` counts exactly the `chat:%` keys: a test casts through both paths and
   asserts `relayed` and `total` independently, that `relayed ≤ total` holds in every case, and
   that `relayed` is unaffected by recasts from an already-seen key (the
   `(session_id, window_id, voter_key)` upsert).
10. `VoteTally` and `LiveSessionDetail` are asserted structurally identical between
    `apps/server/src/live-types.ts` and `apps/web/src/lib/api.ts` for the two new fields — the
    §3.9 anti-drift rule.
11. A host opens an eight-option vote from the client and it succeeds; the add control is
    disabled at eight and the remove control at two; a nine-option submission is unreachable
    from the UI and would be refused by `openVote` if forged.
12. A host opens a vote whose labels are plan words rather than UCI (*"Trade on d5"*), and the
    labels appear in the tally on both the session page and the overlay while `moveUci` is what
    `legalAt` validated.
13. The window duration is settable and bounded 15–600 in the UI; 60 remains the default. The
    disabled-state hint reads *"Two to eight legal UCI moves are required."*

**Docs:** `docs/live-sessions.md` §Accepted limitation takes §2.3's restated sentence in place of
the *"same disclosure projection"* claim, and its vote section states the attribution line as
rendered. `docs/adaptive-guidance.md` records the six assistance profiles and the rule that a
profile selects defaults and never a permission.

## Open questions

1. **Should `academy` acquire a profile too?** `design/05:147` does not name it, and under
   `rfc/teacher-surface.md` a classroom-owned session will be distinguishable by
   `classroom_id` — a better referent, by that RFC's own argument. Left non-behavioural here
   deliberately, but a coach may well want an academy default distinct from a stream default,
   and if so the cheapest correct answer is a seventh profile rather than a fourth session kind.
   Resolve before `accepted` only if the owner has a view; otherwise it defers cleanly.
2. **Does `stream` outrank `onramp`, or the reverse?** §4.3 rules on-ramp first, on the ground
   that the guard is a property of the player's own run. The opposite ruling — that being
   broadcast dominates everything — is defensible and is one line to flip. No evidence either
   way; nobody has streamed an on-ramp run.
3. **Should the attribution line also appear on the `/live` wall's per-board summaries?** The
   wall renders `LiveBoardSummary`, which carries no tally. Adding one is a projection widening
   for a surface whose readers are all authenticated hosts and coaches — lower risk than the
   overlay, and correspondingly lower value. Left out.
4. **Is the relayed/member split the right granularity, or should the tally break down
   per-option?** *"e4: 30 (28 relayed)"* is strictly more honest than a window-level ratio and
   costs one more `GROUP BY`. Left at window level because the overlay is read at a glance from
   video; genuinely uncertain, and cheap to move later.
5. **Should the overlay say when a run is *not* streamed?** An overlay is by construction a
   broadcast, so the question is really whether the *drill screen* should say "you are on
   stream". I4 arguably requires it — a host who forgot is being recorded without a visible
   statement of it — but it is a new rendered claim on a shipped surface rather than a
   correction to one, so it is a question rather than a specification. `rfc/client-surface-floor.md`
   owns the region it would live in.
6. **What happens when a live session opens or closes under a run in progress?** The derivation
   reads the *open* live session, so both edges exist. **Closing:** the run falls back to
   `position` or `pack` and the learner's Just Play preferences reapply — probably right, the
   audience is gone, but the rail changes mid-run without the learner acting. **Opening:** the
   shipped poll only refreshes a session it already knows about (§4.4), so a run that becomes
   streamed while the learner sits on it keeps the Just Play rail until they navigate — the
   wrong direction, since that is the window where an audience appeared and the rail did not
   change. Both are inherited client behaviours rather than new ones; the fix for the second is
   one unconditional `liveSessions()` lookup in the poll, which is a request this RFC declined
   to add on its own authority. Stated so both are decisions rather than accidents.

## Changelog

- 2026-08-15: created. Drafted on `design/research/broadcast-and-teacher-surfaces.md` §§2.4, 3,
  6, 7.1 and 8, against the working tree of the same day. Claims nothing versioned.
- 2026-08-15: **adversarial cross-review, fixed in place.** Every §1 primitive, every quoted
  archive/design/docs sentence, and every register claim re-verified against the working tree;
  **"nothing versioned" holds** — `session_votes.voter_key`'s CHECK (`learner:%` / `chat:%`) and
  `live_sessions.vote_adapter_learner_id` (`ON DELETE SET NULL`, resolved through the shipped
  `learnerById`) make both new fields derived, so `STORAGE_VERSION` stays 20, run 0.15, pack
  0.22, migration 21 free for `teacher-surface`, 0.23/0.24 unclaimed by this draft and 0.19
  frozen shut. Six corrections: §3.1's branch count was under-inclusive (four server branches,
  three client); §3.2 claimed one member read where §4.3 reads two; §3.3's *"no other referent"*
  was absolute and is now the three candidates it was really about; **§4.3's `match` bullet
  asserted an untouched-`position` guard that is gated on `boardControl`, not `kind`** — the
  Arena path falsified it; **§4.5's *"nothing can turn on"* had one false cell** —
  `SILENT_ASSISTANCE.boardLighting` is `legal`, not `off`, so a learner who set `off` sees it
  rise, which is now stated, bounded to rung 0, and tested; and §5.1's `relayed` aggregate and
  deleted-adapter case are now exact. `rfc/README.md`'s Active row was found to already exist
  (`c7fe539`), the ledger clause was corrected from "owner tier" to the shared-register rule
  plus the log obligation, and two owed ledger rows are named (the vote-form duration/prompt
  hardcodes, and `arrows` — a stored, migrated, configurable preference with no renderer).
