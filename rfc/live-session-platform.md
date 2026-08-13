# RFC: Live session platform — roles, spectating, academy, stream, and arena

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/03-product-breadth.md:79-91` (Live and community), `:142-152` (shared shell regions, "session/role controls appropriate to solo, host, participant, or spectator"), `:53-55` (Position Arena), gate row B5 (`:165`), program item #8 (`:258-265`); `design/02-product-shape.md:50-73` (hosted multi-user, and ADR-0004's fired revisit trigger)
- **Exploration gate:** opened by owner ruling 2026-08-12 (`rfc/README.md:26-33`); breadth sequencing ruling 2026-08-11 (`rfc/README.md:35-40`)
- **Depends on:** `rfc/archive/learner-identity-and-authorization.md` (F3 — the subject, grants, and the learner-bound lease this RFC builds the session layer on top of); `rfc/archive/pack-optional-runs.md` (F2 — position runs, without which an Arena match run cannot exist)
- **Sibling drafts:** `rfc/defect-sweep.md` closes D4, D5, D6, D8, D9 and D10 — this RFC cites all six and duplicates none of its fixes; §2.6 states the interaction, and neither blocks the other. `rfc/n-way-comparison.md` holds **migration 6** and run schema 0.7 → 0.8; this RFC rebased to **migration 7** and changes the run schema not at all, so the two are ordered but not coupled (§3.13)
- **Parent / amends:** amends the lease claim path (`apps/server/src/storage.ts:758-777`), the events page (`apps/server/src/feedback-policy.ts:34-51`), the surface capability map (`apps/server/src/capabilities.ts:117-129`), and the client router (`apps/web/src/lib/router.ts:18-27`). Adds **migration 7** (`STORAGE_VERSION` 6→7)
- **Supersedes / superseded by:** supersedes `planning/breadth/live-and-platform.md` §A2, §A4/C1, §A4/C3, §A4/C5 and §A4/C6, all of which were written on 2026-08-12 against a tree that had no identity. §Deviations item 5 states each correction
- **Planning:** `planning/live-session-platform/` (once implementing)

## Summary

`design/03-product-breadth.md:79-91` promises four live surfaces: a streamer whose
chat votes on moves, an academy whose participants propose while spectators follow,
scheduled arena events with invitations and relays, and two-leg Position Arena
sparring through external handoff plus PGN return. None of them exist. `live` is
hard-coded `"unavailable-here"` (`apps/server/src/capabilities.ts:123`) and `/live`
renders a placeholder naming this program item (`apps/web/src/App.svelte:351`).

The audit that scoped this work concluded that B5 was blocked on identity. It is not
any more. F3 shipped `host | participant | spectator` grants
(`apps/server/src/storage.ts:15`), a learner-bound lease, and 404-not-403 read
scoping; a granted spectator already follows a host's run across two browser contexts
(`tests/browser/drill.spec.ts:380-412`). **The role model B5 needs is shipped.** What
is missing is everything above the run: a session, a proposal, a vote, an invitation,
a match, and a journal that can say who did what.

This RFC specifies one aggregate — a **live session** joined to exactly one run — and
five things carried on it: board control, a possession journal, participant proposals,
vote windows, and Arena match legs. It changes the run schema **not at all**. It adds
no new credential type, no realtime transport, and no second disclosure path. It also
closes three defects that re-verification turned up (§2.4), all of which are boundary
conditions of shapes the shipped schema already permits.

## Motivation

### 2.1 Re-verification: what actually ships

Every row was re-run against the working tree for this draft. The scoping dossier
(`planning/breadth/live-and-platform.md`, 2026-08-12) predates F3 and F2 and its
coordinates have drifted; corrections are marked.

| Capability | Ships? | Evidence |
|---|---|---|
| A learner subject | **yes** | `Learner` `apps/server/src/storage.ts:17-22`; request-scoped `Principal` `apps/server/src/authorization.ts:11-14`; scrypt login → HttpOnly SameSite=Strict cookie `apps/server/src/identity.ts:200-202`, 30-day expiry `:14` |
| Per-run roles | **yes** | `RunRole = "host" \| "participant" \| "spectator"` `apps/server/src/storage.ts:15`; `run_grants` DDL `:1009-1016`; creator auto-granted host `:347-352` |
| Role predicates | **yes** | `mayRead`/`mayWrite`/`mayManageGrants` `apps/server/src/authorization.ts:16-26` |
| A **second writer-capable role** | **yes — `participant`** | `mayWrite(role) => role === "host" \|\| role === "participant"` `apps/server/src/authorization.ts:21`. Corrects `planning/breadth/live-and-platform.md:64-66` ("No second writer role") |
| Grant management by handle | yes, host-only, re-checked in-transaction | route `apps/server/src/rest.ts:641-658`; service `apps/server/src/service.ts:583-607`; transactional re-check `apps/server/src/storage.ts:798-804`; "a run always retains a host" `:816-824` |
| Lease **transfer** | **yes, one path** | revoking write from the holder returns the lease to the acting host inside the same `BEGIN IMMEDIATE` transaction — `apps/server/src/storage.ts:825-826`, `:852-863`. Corrects `planning/breadth/live-and-platform.md:60-61` ("No transfer") and its L6 dependency claim |
| Lease **claim** by any write-capable grantee | yes, unconditional | `POST /runs/:id/lease` `apps/server/src/rest.ts:627-631` → `apps/server/src/service.ts:609-615` → `apps/server/src/storage.ts:758-777` |
| The real atomic write predicate | on `save`, not on claim | `UPDATE ... WHERE id = ? AND active_writer_id = ? AND active_writer_learner_id = ?` `apps/server/src/storage.ts:484-498`; a stale writer 409s at `:517` |
| `activeWriterId` published to readers | **no — D1 is closed** | `graph` returns a `RunViewer` `{role, mayWrite, holdsLease, leaseHeldBy}` `apps/server/src/service.ts:64-69`, `:338-352`; `RunSummary` carries `viewerRole` + `leaseHeldBy`, not the writer id, `apps/server/src/storage.ts:51-62` |
| Ungranted reads leak run existence | no | `requireRead` throws `RUN_NOT_FOUND` for a missing grant `apps/server/src/authorization.ts:28-38` |
| Spectator follows a live run in the browser | **yes** | `tests/browser/drill.spec.ts:380-412` — two browser contexts, two learners, real grant, "Read-only" rendered, no take-the-board control, host's ply observed within 4 s |
| Follower poll | 2 000 ms, read-only only | `apps/web/src/lib/run-state.ts:277-288`; `access: "writer" \| "read_only"` `:34-39` |
| Realtime transport (WebSocket / SSE) | **no** | repo-wide grep `websocket\|EventSource\|text/event-stream\|socket.io` over source → 0 hits; prose in `design/`, `archive/`, `planning/` and `docs/engine-workers.md` only |
| Role, vote, overlay, invitation, cohort, relay, arena, twitch, academy vocabulary | **no** | grep over `apps/*/src packages/*/src workers tests tools` → `RunRole` and its tests, plus the `/live` placeholder prose `apps/web/src/App.svelte:351`. Nothing else |
| `live` surface | unavailable | `apps/server/src/capabilities.ts:123`; client relabels it "planned" `apps/web/src/lib/api.ts:170-176` |
| Position (pack-optional) runs from arbitrary FEN | **yes, REST-only** | `apps/server/src/rest.ts:261-292`; canonical-FEN and non-terminal enforcement `packages/runtime/src/runtime.ts:166-171`. The shipped client only ever creates pack runs (`apps/web/src/lib/session-controller.ts:223-226`) |
| Forking at the **root** node | **yes** | `appendBranch` has no `ply > 0` or `parentId !== null` guard `packages/runtime/src/runtime.ts:117-128`; the projection parks the cursor on `forkNodeId` `packages/runtime/src/events.ts:88-100`; branch 0 already forks at the root `packages/runtime/src/runtime.ts:189-195` |
| `compare` across two runs | **no — by signature** | `compare(run, branchAId, branchBId)` `packages/runtime/src/compare.ts:191-195`; both ids resolved against `run.branches` via `requireBranch` `packages/runtime/src/branch-path.ts:13-19`; route is `POST /runs/:id/compare` `apps/server/src/rest.ts:737-746` |
| PGN **export** | yes | `packages/runtime/src/pgn.ts:74`, `:107`; route `apps/server/src/rest.ts:605-616` |
| PGN **import into a run** | **no** | `parsePgn` *does* now have a production caller — `apps/server/src/sourcing/openings.ts:7,47` — but it is the offline content-sourcing CLI (`make candidate-emit`, `Makefile:40-43`), bundled separately (`apps/server/package.json:7`) and unreachable from the HTTP server. **Correction of record:** `planning/breadth/live-and-platform.md:44` and the `design/BACKLOG.md` Position Arena row both say "`parsePgn` has no production caller"; the accurate claim is that there is no PGN reader on any request path |
| `Node.actor` identity | **no** | `Actor = "user" \| "opponent" \| "system"` `packages/runtime/src/types.ts:3`; closed schema enum `schemas/drill_run.schema.json:235`. The 13-member `DrillRunEvent` union carries no actor on the envelope or any payload (`packages/runtime/src/types.ts:202-215`, `:115-120`) |
| Per-viewer feedback withholding | **no, deliberately** | `feedbackDisclosed(run: DrillRun): boolean` `packages/runtime/src/feedback.ts:3`; `publicNodes(run)` `apps/server/src/feedback-policy.ts:10-12`; `publicEvents(run, sinceSeq)` `:34-37`. No viewer, role, or grant parameter on any of them |

### 2.2 The two rulings this RFC is built on

**The streamer may cheat on themselves** (owner ruling 2026-08-12, `design/BACKLOG.md`
§Breadth-first product surfaces, Streamer/Twitch row). Per-viewer reveal cannot enforce
blind play: under any account model a player registers a second account, is granted
`spectator` on their own run, and reads what they are playing blind. So "the audience
sees the evaluation while the streamer plays blind" is **documented as a limit, not
engineered against** (§3.8). Chat voting, host rewind/branch/compare, and the spectator
projection are unaffected and are specified in full.

**Deployment is hosted multi-user** (owner ruling 2026-08-12,
`design/02-product-shape.md:50-52`). This RFC designs for that: every surface below is a
person on another machine reaching one instance, authenticated by the shipped cookie
session, authorized by the shipped per-run grant. ADR-0004's revisit trigger has fired
(`design/02-product-shape.md:71-73`, `design/BACKLOG.md` Provisional decisions,
ADR-0004) and this RFC does not re-decide it: it adds tables and routes to the existing
modular monolith and introduces no new process, no message broker, and no persistent
connection. Naming the fired trigger is the point — a live session platform is exactly
the kind of surface that would silently justify a rewrite, and it does not need one.

### 2.3 Why the shipped lease is enough, and where it is not

Authorization and possession are already separate (`docs/identity-and-authorization.md:22-26`).
A role says whether a learner *may* write; the lease says which learner and device
currently *is* writing. Every mutation checks session → grant → write-capable role →
learner lease holder → device writer id (`apps/server/src/authorization.ts:40-62`), and
the genuine compare-and-swap lives on `save` (`apps/server/src/storage.ts:484-498`), so a
dispossessed writer 409s rather than corrupting anything.

That is the correct shape and this RFC does not change it. Two writer-capable roles in
one run is already the shipped model. What the lease cannot express is *policy over
possession*: who may take the board, when, and whether the run remembers that they did.
Those three gaps are the defects below, and they are the whole of what the session layer
adds to the lease.

### 2.4 Three defects this RFC opens and closes

These are boundary conditions of shapes the shipped schema permits. They are proposed
`design/BACKLOG.md` rows in §7 — the ledger is owner-tier and is not an implementer task.

**D17 — a participant can seize the board from the host at any moment, and two
claimants race.** `POST /runs/:id/lease` gates on `mayWrite` only and then runs
`UPDATE drill_runs SET active_writer_id = ?, active_writer_learner_id = ? WHERE id = ?`
with **no predicate on the current holder and no enclosing transaction**
(`apps/server/src/storage.ts:758-777`). There is no expiry, renewal, or heartbeat
anywhere (grep `expir|renew|ttl|heartbeat` over `apps/server/src packages/runtime/src`
returns session-cookie expiry only). Concurrent claims are last-writer-wins and nothing
records that a steal happened; no test covers racing claims. On a solo run across two
devices this is the intended "continue on this device" affordance. In a coached session
it means a `participant` grant is equivalent to *may interrupt the coach mid-sentence*.

**D18 — a withheld event stream silently freezes a follower.** `publicEvents` truncates
at the first engine-feedback event and pins `nextSeq` to the last pre-barrier seq, or to
`sinceSeq` when the very first candidate is the barrier
(`apps/server/src/feedback-policy.ts:45-50`; barrier predicate `:26-32`, which also
matches `objective.state_changed` carrying an engine evidence ref). Truncation is
required — the client enforces strict contiguity and a gap would crash it
(`apps/web/src/lib/run-state.ts:80-86`) — but the follower cannot distinguish "the host
has not moved" from "the host is ahead and I am behind a barrier." The 2 s poll
(`apps/web/src/lib/run-state.ts:277-288`) re-requests the same seq forever and the
spectator's board stops advancing with no indication. This violates never-silent, and
B5 is the surface where it bites: a solo writer never reads through `publicEvents` at
all, a spectator reads through nothing else.

**D19 — the run cannot say who played ply 14, and possession is not journalled.** The
event envelope has no actor field (`packages/runtime/src/types.ts:115-120`) and
`run_grants` stores current state plus `granted_at` with no audit table. With two
write-capable roles alternating on one run — already possible today, and routine under
academy and relay — the persisted log cannot attribute any ply to the learner who made
it. `docs/identity-and-authorization.md:71` records this as a limit; B5 converts it into
a defect.

### 2.5 Interaction with `rfc/defect-sweep.md`

That draft closes all six defects this RFC cites, and this RFC re-implements none of
them. Where each one touches a surface specified here:

- **D4** — `defect-sweep.md` §1 collapses the *pack* vocabularies (checkpoint actions,
  opponent modes, feedback policies, objective types) onto single constants. `RunRole` is
  a further instance of the same shape that its scope does not reach — it is an
  authorization vocabulary, not a pack one — and §3.1 below adopts its discipline rather
  than inventing a second one.
- **D5** — `defect-sweep.md` §5 restores the light profile to the release compose. §3.14
  below states this RFC's obligation against the profile it restores.
- **D6** — `defect-sweep.md` §4 projects `phase` to the client. §3.11's `/live` index
  lists by scheduled time and pack id, which is correct with or without it; filtering a
  session list by phase is depth added inside this surface once the field arrives.
- **D8** — `defect-sweep.md` §2 decides the rejected declared values per value. §3.7.3's
  match run declares `human_common` and requests no selection at all, so it is unaffected
  either way.
- **D9** — `defect-sweep.md` §3 makes `start.side` required. §3.7.2's rule that the
  invitation carries `side` explicitly stands regardless, because a match's reference
  side is a property of the match, not of any pack it was rooted at.
- **D10** — `defect-sweep.md` §6 parses the engine version whenever the spec omits one.
  §3.7.6's rendering rule — show what is stored, never synthesize — is what makes the
  overlay honest before that lands and correct after it.

### 2.6 Scope boundary

**In:** the session aggregate; board control and handoff; the possession journal;
participant proposals; vote windows and tallies; the overlay projection; Position Arena
matches, invitations, external handoff and PGN return; the `/live` surface becoming
available.

**Out, and named rather than implied.** Session-to-pack distillation is program item
#6's emitter and consumes the session record this RFC defines — this RFC ships the
record, not the emitter (`design/03-product-breadth.md:255`). Native Arena clocks and
matchmaking are depth added inside the surface specified here; `Node.clockState` is
already carried opaquely (`packages/runtime/src/types.ts:99`) so that depth extends the
shipped schema rather than reshaping it. The public unauthenticated share link
(`design/03-product-breadth.md:168`) is not specified here: every surface below is
authenticated, and an anonymous read capability is a different contract with a different
threat model. Per-viewer disclosure is not specified here and §3.8 explains why it is
not specified anywhere.

## Specification

### 3.1 The role model: unchanged

`RunRole` stays exactly `"host" | "participant" | "spectator"`
(`apps/server/src/storage.ts:15`). No fourth role, no capability tokens, no verb
vocabulary. Session membership *is* the run grant: to add someone to an academy, the
host grants them a role on the run through the shipped `POST /runs/:id/grants`
(`apps/server/src/rest.ts:641-658`). Revoking the grant removes them from the session.

Three session-layer predicates join the three shipped ones in
`apps/server/src/authorization.ts`:

```ts
export function mayPropose(role: RunRole): boolean {
  return role === "host" || role === "participant";
}
export function mayVote(_role: RunRole): boolean {
  return true;
}
export function mayControlSession(role: RunRole): boolean {
  return role === "host";
}
```

`mayPropose` matches `design/03-product-breadth.md:85-86` verbatim — participants
propose, spectators follow. `mayVote` admits every granted role because a vote is a
session-log write, never a run write, and the academy case wants thirty spectators
voting. Ballot-stuffing is bounded by §3.6's adapter rule, not by the role.

**D4's shape, applied to a vocabulary its own fix does not reach.** `RunRole` is
maintained by hand in five places: `apps/server/src/storage.ts:15`, the SQL `CHECK` at
`:1012`, the duplicated `mayWrite` at `:155-157`, the request parser at
`apps/server/src/rest.ts:239-243`, and the client mirror at
`apps/web/src/lib/api.ts:57`. That is exactly the drift shape D4 names, on a sixth
vocabulary — `defect-sweep.md` §1 collapses the four *pack* vocabularies and does not
touch this one, because it is an authorization vocabulary. Rather than open a competing
fix, this RFC adopts that draft's discipline: a single frozen `RUN_ROLES` tuple exported
from `apps/server/src/storage.ts` with `RunRole`, the parser guard, and the SQL `CHECK`
string derived from it, the duplicated `mayWrite` deleted, and an equality test
asserting the client union matches. Should `defect-sweep.md` land first, the implementer
reuses its constant module verbatim instead of adding a second one. The three new closed
vocabularies this RFC introduces (`SessionKind`, `BoardControl`, `SessionJournalKind`)
are each defined once, as a frozen tuple with a derived type and a derived `CHECK`.

### 3.2 The live session aggregate

One session per run, joined by `runId`. A run without a session behaves exactly as it
does today — this is the compatibility rule that keeps solo play untouched.

```ts
export const SESSION_KINDS = Object.freeze(["stream", "academy", "match"] as const);
export type SessionKind = (typeof SESSION_KINDS)[number];

export const BOARD_CONTROLS = Object.freeze(
  ["free_claim", "host_directed", "rotation"] as const,
);
export type BoardControl = (typeof BOARD_CONTROLS)[number];

export interface LiveSession {
  readonly id: string;
  readonly runId: string;
  readonly kind: SessionKind;
  readonly title: string;
  readonly boardControl: BoardControl;
  readonly scheduledFor?: string;
  readonly voteAdapterLearnerId?: string;
  readonly rotation?: readonly string[];
  readonly createdBy: string;
  readonly createdAt: string;
  readonly closedAt?: string;
}
```

- `stream` and `academy` default to `host_directed`. `match` defaults to
  `host_directed` and never rotates.
- `rotation` is an ordered list of learner ids and is required when
  `boardControl === "rotation"`; every entry must currently hold a write-capable grant,
  re-checked at each advance rather than at creation.
- `scheduledFor` is what makes a "pack night" a scheduled event: a session may exist
  before anyone joins.
- A closed session (`closedAt` set) accepts no proposals, votes, or board changes; its
  journal and its run remain readable, which is what "the completed event can be
  replayed" (`design/03-product-breadth.md:86`) means and all it requires — replay is
  the shipped `GET /runs/:id/events?sinceSeq=0` plus the journal.

**Cohorts and team relays need no further types.** A cohort is a session's grant set. A
team relay is a session with `boardControl: "rotation"`. This is a deliberate refusal to
add aggregates that would only re-express `run_grants`.

### 3.3 Board control, handoff, and D17

`claimLease` gains a session-aware policy check and, independently of the session, the
transaction and predicate it never had.

```
POST /runs/:id/lease   { expectedHolderLearnerId?: string }
```

Inside one `BEGIN IMMEDIATE` transaction, mirroring `#mutateGrant`
(`apps/server/src/storage.ts:797`):

1. Resolve the role. Reject non-write-capable with `FORBIDDEN` (unchanged).
2. If `expectedHolderLearnerId` is present and is not the current holder, reject with
   `LEASE_MOVED` (409). Absent means unconditional and is only legal under
   `free_claim`.
3. Apply board control:
   - `free_claim` — proceed. This is today's behaviour and is the default for every run
     with no session, so nothing about solo two-device play changes.
   - `host_directed` — a `host` proceeds unconditionally. A `participant` proceeds only
     if the session has an open handoff to that learner (§3.3.1); otherwise
     `BOARD_HELD` (409).
   - `rotation` — only the learner at the rotation cursor proceeds; otherwise
     `BOARD_HELD`.
4. `UPDATE drill_runs SET active_writer_id = ?, active_writer_learner_id = ?
   WHERE id = ? AND active_writer_learner_id = ?` with the holder read in step 2.
   `changes !== 1` is `LEASE_MOVED`.
5. Append a `board.granted` journal row (§3.4) in the same transaction.
6. Commit, then repair the lease cache (`apps/server/src/storage.ts:880-891`) — the
   cache is a real correctness surface here, as `apps/server/src/identity-authorization.test.ts:243-247`
   already establishes.

**3.3.1 Handoff.** `POST /sessions/:id/board` with
`{ op: "offer", handle }`, `{ op: "withdraw" }`, `{ op: "advance" }` (rotation only), or
`{ op: "reclaim" }`. Host only. `offer` records an open handoff to one learner,
superseding any previous one; it does not move the lease — the recipient still claims,
so the board never moves to a device that is not there. `reclaim` moves the lease to the
host immediately and clears the handoff, which is the coach's interrupt.

The existing implicit transfer on grant revocation (`apps/server/src/storage.ts:825-826`,
`:852-863`) is unchanged and gains a `board.granted` journal row in its own transaction.

### 3.4 The possession journal, and how a run says who played ply 14 (D19)

**`Node.actor` does not widen, and the run schema does not change.** Three reasons, in
order of weight:

1. `actor` is a chess-semantic classification — which side of the drill moved, and
   whether the reply came from the opponent policy. It is not an identity. In an Arena
   match (§3.7) the reference side's moves are `"user"` in *both* legs even though a
   different human played each; putting a learner id there would make the same chess
   fact carry two different values across the legs and destroy the like-for-like
   comparison the mode exists for.
2. `Actor` is a closed union (`packages/runtime/src/types.ts:3`) mirrored by a closed
   JSON Schema enum (`schemas/drill_run.schema.json:235`), and `DrillRunEvent` is
   likewise closed in both (`packages/runtime/src/types.ts:202-215`,
   `schemas/drill_run.schema.json:339-353`). Widening costs a run-schema bump and a
   migration of every stored snapshot to record something the run does not need.
3. The lease already serializes writers exactly. Journalling *possession* makes
   authorship derivable without the run knowing anything about people.

**The journal.** Append-only, per session, never edited or deleted.

```ts
export const SESSION_JOURNAL_KINDS = Object.freeze([
  "session.opened", "member.joined", "board.granted",
  "proposal.made", "proposal.applied", "proposal.declined",
  "vote.opened", "vote.closed", "vote.applied",
  "leg.imported", "session.closed",
] as const);

export interface SessionJournalEntry {
  readonly sessionId: string;
  readonly seq: number;              // contiguous from 1, per session
  readonly at: string;
  readonly kind: SessionJournalKind;
  readonly actorLearnerId: string | null;
  readonly runSeq: number | null;    // run.events.at(-1)?.seq at write time
  readonly payload: Readonly<Record<string, unknown>>;
}
```

**Authorship rule.** For a run event at seq `S`, the author of a `move.committed` with
`actor: "user"` is the `actorLearnerId` of the last `board.granted` entry ordered by
`(runSeq, seq)` whose `runSeq <= S`. This is exact because every lease change is
journalled inside the transaction that moves it (§3.3 step 5) and no mutation can land
without the lease (`apps/server/src/storage.ts:484-498`). Runs with no session are
unaffected: their sole author is the owner.

The journal is served by `GET /sessions/:id/journal?sinceSeq=N` →
`{ entries, nextSeq }`, mirroring the run events page shape
(`apps/server/src/service.ts:79-82`) so the client reuses its cursor discipline. It is
readable by every granted role. It carries no chess evidence and is therefore not
subject to §3.8's withholding — this is a property to preserve, not an accident: putting
role traffic in the run log would place it behind `publicEvents`' truncation
(`apps/server/src/feedback-policy.ts:45-50`) and votes would corrupt replay determinism.

### 3.5 Participant proposals

A proposal is a suggested move at a node. It is **not** a run event, never enters the
run log, and never affects replay.

```ts
export interface SessionProposal {
  readonly id: string;
  readonly sessionId: string;
  readonly nodeId: string;
  readonly moveUci: string;
  readonly proposedBy: string;
  readonly at: string;
  readonly status: "open" | "applied" | "declined" | "stale";
  readonly resolvedRunSeq: number | null;
}
```

- `POST /sessions/:id/proposals` `{ nodeId, moveUci }`. Requires `mayPropose`. The
  server validates that `nodeId` exists in the run and that `moveUci` is legal in that
  node's position, using the same `parseUci` + `isLegal` checks `commitMove` applies
  (`packages/runtime/src/runtime.ts:281-287`). An illegal proposal is rejected with
  `ILLEGAL_MOVE`, never stored — the never-silent law applies to proposals as much as
  to authored packs.
- One open proposal per learner per node; a second replaces the first.
- `POST /sessions/:id/proposals/:proposalId` `{ op: "apply" | "decline" }`. Host only.
  `apply` is **two operations, in order**: the host's ordinary
  `POST /runs/:id/moves` under their own lease, then the proposal transitions to
  `applied` with `resolvedRunSeq` set to the resulting `move.committed` seq. The move on
  the board is the host's, made by the host, recorded exactly as any other host move.
  This is what keeps "participants propose" from becoming a second writer.
- When the run's active cursor leaves a proposal's `nodeId`, open proposals at that node
  become `stale` on next read. Stale proposals are still readable — an academy wants to
  see what was suggested and not taken.

### 3.6 Chat voting: the transport

**The transport is the shipped one: authenticated HTTP request/response plus the 2 s
poll.** No WebSocket, no SSE. Three reasons: there is no persistent-connection surface
anywhere in the codebase to extend (verified zero hits, §2.1); a vote window is tens of
seconds against a 2 s poll, so the latency budget is met by two orders of magnitude; and
a persistent connection on a hosted deployment is a new operational and abuse surface
that this RFC does not need and therefore does not open.

**Viewers need nothing at all.** Not a synchronized client, not an account, not a page.
This is stronger than `design/03-product-breadth.md:83` requires and it falls out of the
adapter design.

**3.6.1 No new credential type.** The obvious design — a vote-intake token in the URL —
is rejected. It is D1's shape (`design/BACKLOG.md`, D1 row): a link that is a write
credential. The codebase deliberately has no bearer-credential path at all (no
`Authorization` header handling anywhere; the cookie is the only subject-bearing
mechanism, `apps/server/src/identity.ts:204-211`), and `parseDrillAddress` already
forbids query and fragment on the address grammar
(`packages/schema/src/drill-pack/urls.ts:88-91`), so there is not even a place to put a
token that the shipped grammar would accept.

**Instead the adapter is a learner.** The streamer registers a second account for their
chat bridge, grants it `spectator` on the run, and sets it as the session's
`voteAdapterLearnerId`. The adapter posts votes under its own cookie session. This
reuses the entire shipped stack — authentication, per-run grant, 404-not-403 scoping,
handle-based grant management — and revocation is already built: the host revokes the
adapter's grant and the bridge is off. A compromised adapter is attributable, because
every vote row records the learner that posted it.

**3.6.2 Windows.**

```ts
export interface VoteWindow {
  readonly id: string;
  readonly sessionId: string;
  readonly nodeId: string;
  readonly prompt: string;
  readonly options: readonly { readonly moveUci: string; readonly label: string }[];
  readonly opensAt: string;
  readonly closesAt: string;
  readonly state: "open" | "closed" | "stale";
  readonly appliedOptionUci: string | null;
}
```

- `POST /sessions/:id/votes` `{ op: "open", nodeId, prompt, options, durationSeconds }`.
  Host only. 2–8 options, each a move legal in `nodeId`'s position (same validation as
  §3.5), each with a host-typed label. `durationSeconds` is 15–600.
- **Votes are over moves, and the host names the options.** Voting over plan classes has
  no shipped vocabulary — plan classes are stripped from the public pack projection
  (`docs/drill-client.md:29-31`) — so a client could not render the choices. Host-typed
  labels give a stream "push the h-pawn" / "trade queens" without inventing an authored
  contract. When authored checkpoint interactions later supply option vocabulary they
  fill `options` from the pack instead of from the host; that is depth inside this
  surface and needs no change to the window shape. This resolves
  `planning/breadth/live-and-platform.md:192-201` (C6), which held vote semantics
  unpinnable pending an authored fixture.
- At most one open window per session. Opening a second closes the first.
- A window closes when the host posts `{ op: "close" }`, when `closesAt` passes, or when
  the run's active cursor leaves `nodeId` — the last transitions it to `stale`, because a
  vote about a position the run has left is not a result.

**3.6.3 Casting.** `POST /sessions/:id/votes` `{ op: "cast", windowId, choiceUci, voterKey? }`.

- Requires `mayVote`, i.e. any granted role.
- `voterKey` may be supplied **only** by the session's `voteAdapterLearnerId`. Every
  other learner's vote is keyed by their own learner id. This is the ballot-integrity
  boundary: without it any spectator could post a thousand distinct keys.
- Primary key `(sessionId, windowId, voterKey)`; recasting overwrites. Each row records
  `castByLearnerId`.
- `choiceUci` must be one of the window's `options`, else `INVALID_REQUEST`.
- Rejected when the window is not `open`, with `VOTE_WINDOW_CLOSED` (409).

**3.6.4 Tally, and its epistemic status.** `GET /sessions/:id/votes/:windowId` →
`{ window, tally: [{ moveUci, label, count }], total }`, readable by every granted role
and polled by the overlay at 2 s.

**The tally is advisory. It never moves a piece.** The host applies the winner through
their own `POST /runs/:id/moves` exactly as in §3.5, and the window records
`appliedOptionUci` plus a `vote.applied` journal entry. Three reasons, and the first is
sufficient: run replay is deterministic from the run event log
(`packages/runtime/src/events.ts`), and a binding vote would make replay depend on
session state that is not in that log. Second, the lease admits exactly one writer and a
binding vote would be a second one. Third, a crowd tally is a social artifact; treating
it as move-selection authority is the "dashboard, not a drill" shape the standing law
names (`CLAUDE.md` §Non-negotiable laws 8), and the honest rendering is "chat wanted
this, I played that, here is the comparison" — which is the whole point of the host then
rewinding and forking on the crowd's choice.

**Documented limit:** the server dedupes by `voterKey` but cannot authenticate chat
users. A tally is exactly as trustworthy as the adapter reporting it. This is stated in
`docs/`, surfaced in the overlay as an attribution line naming the adapter handle, and
not engineered against.

### 3.7 Position Arena: two legs, one run

**3.7.1 Why one run is a correctness constraint.** `compare(run, branchAId, branchBId)`
takes a single run and resolves both branch ids against `run.branches`
(`packages/runtime/src/compare.ts:191-197`, `packages/runtime/src/branch-path.ts:13-19`),
and the route is `POST /runs/:id/compare` (`apps/server/src/rest.ts:737-746`). There is
no cross-run entry point at any layer. Importing the legs as two runs would leave them
uncomparable by every shipped mechanism. Within one run the shared fork is structural
rather than checked — every `branchPath` starts at the unique root
(`packages/runtime/src/runtime.ts:174-188`), so `NO_COMMON_FORK`
(`packages/runtime/src/compare.ts:86-97`) is unreachable and the root is always common.
Two root-forked branches are therefore exactly comparable, with `plyOffset` counting
from move 1.

**3.7.2 The reference side.** A match session's run is a position run whose
`start.side` is the **reference side** — the colour whose play the two legs compare.
Both legs are the same position played from the same side by different humans; leg 1 has
player A on the reference side, leg 2 has player B. This is what two-leg fixed-position
sparring is *for*, and it makes `compare(leg1, leg2)` read as "A's handling versus B's
handling of the same position." `run.start.side` is also what decides
`terminalOutcome(position, run.start.side)` (`packages/runtime/src/runtime.ts:337`), so
an imported mate grades against the reference side, which is correct.

**On D9.** The invitation and the match record carry `side` explicitly, and the importer
never reads a pack's `start.side` even after `defect-sweep.md` §3 makes that field
required. This is not belt-and-braces against the defect: a match's reference side is a
property of the match, chosen when the two players agree who plays which colour in which
leg, and a pack rooted at the same position has no authority over it.

**3.7.3 The match record.**

```ts
export interface ArenaLeg {
  readonly sessionId: string;
  readonly leg: 1 | 2;
  readonly referencePlayerHandle: string | null;
  readonly externalChallengeUrl: string | null;
  readonly pgn: string | null;
  readonly result: "1-0" | "0-1" | "1/2-1/2" | "*" | null;
  readonly branchId: string | null;
  readonly importedAt: string | null;
}
```

A `match` session has exactly two legs, created with the session. The run is created
through the shipped path: `POST /runs` with
`session: { kind: "position", start: { fen: rootFen, side: referenceSide },
feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }`
(`apps/server/src/rest.ts:261-292`). `attempt_end` is not a choice — position runs
require it (`apps/server/src/rest.ts:267`). `human_common` is declared and never
exercised, because **no opponent selection is ever requested for a match run** — both
sides are imported. The implementer must not reach for `perfect_tablebase`: it is one of
the values `defect-sweep.md` §2 is deciding per value (**D8**), and a match run needs no
opponent policy either way.

**3.7.4 External handoff — pinned without pinning Lichess.** The invitation is a Tabiya
record carrying `{ sessionId, leg, rootFen, side, packId?, version?, invitedHandle?,
externalChallengeUrl? }`. `externalChallengeUrl` is an **opaque `https` URL the host
supplies**. Minimal-real flow: the host creates the challenge on whatever external
service they and their opponent use, pastes the URL onto the leg, and the invitation
carries it. This is complete and usable today, requires no opponent onboarding, and
commits to no third-party API. A provider adapter that mints the URL — a Lichess
from-position challenge is the obvious first one — is depth added inside this surface
and slots behind the same field. The dossier held this contract unpinnable
(`planning/breadth/live-and-platform.md:182-190`) because it assumed the URL had to be
minted; it does not.

`POST /sessions/:id/invitations` `{ leg, handle?, externalChallengeUrl? }`, host only.
An invitation to a `handle` grants that learner `participant` on the run through the
shipped grant path, so an opponent with an account can import their own leg; without a
handle, only the host imports.

**3.7.5 PGN import.** `POST /sessions/:id/legs/:leg/pgn`, body `{ pgn, result? }`,
`content-type: text/x-chess-pgn`. Host, or the invited learner for their own leg. This
is a **service-level operation**; it never goes through `POST /runs/:id/moves`.

1. Parse with `parsePgn` from `chessops/pgn` — the same dependency and the same reader
   already used in production at `apps/server/src/sourcing/openings.ts:7,47`. Exactly one
   game; zero or more than one is `INVALID_REQUEST`.
2. Resolve the start position from the game headers with `startingPosition` and require
   its canonical FEN to equal the run's `start.fen`. Mismatch is
   `ARENA_ROOT_MISMATCH` (422). This is the check that stops leg 2 being a different
   game.
3. Mainline only. A PGN containing variations is **rejected**, not silently flattened —
   D3's lesson (`design/BACKLOG.md`, D3 row: the validator blessed something and nothing
   happened) applies directly. Cap at 300 plies; beyond that, `INVALID_REQUEST`.
4. Position the cursor. Leg 1 replays onto branch 0, which already forks at the root
   (`packages/runtime/src/runtime.ts:189-195`). Leg 2 first calls
   `fork(run, rootNodeId, { label: "Leg 2" })`, which parks the cursor on the root of a
   new branch (`packages/runtime/src/events.ts:88-100`) — verified to work at the root,
   with no `ply > 0` guard. Re-importing a leg is rejected once `branchId` is set;
   correcting a leg means a new match.
5. Replay each ply with `commitMove` (`packages/runtime/src/runtime.ts:258`), which
   validates legality and side-to-move (`:280-285`) and throws `illegalMove` on the
   first bad ply. The import is atomic: a rejected ply rolls back the whole leg.
6. **Actor labelling.** Reference-side plies commit with the default
   `actor: "user"`. Non-reference-side plies commit with **`actor: "system"`** —
   already an accepted production value (`apps/server/src/rest.ts:304-313`) meaning the
   ply entered the run from outside the run's own opponent policy, which is exactly true
   of an imported human move. **No `opponent.move_selected` event is emitted for an
   imported leg.** The alternative — `actor: "opponent"`, which the runtime requires to
   carry an authoritative `OpponentSelection` including a `SelectionEngineIdentity`
   (`packages/runtime/src/runtime.ts:240-246`, `packages/runtime/src/types.ts:69-76`) —
   would mean fabricating an engine identity for a human move, writing
   `version: "unknown"` into the provenance chain and manufacturing by hand the exact
   anonymity **D10** already tracks as a defect. Who the human was is recorded on
   `ArenaLeg.referencePlayerHandle` and rendered by the Arena UI. The run stays honest
   about provenance; the match record stays honest about people.
7. Write the leg's `branchId`, `pgn`, `result`, `importedAt`, and a `leg.imported`
   journal entry.

**3.7.6 Comparing the legs.** After both imports the host calls the shipped
`POST /runs/:id/compare` with the two branch ids. Because the match run is `attempt_end`
and `feedbackDisclosed` for that policy requires `feedback.revealed` or
`outcome.reached` (`packages/runtime/src/feedback.ts:13-16`), engine evidence in the
comparison is withheld until the host posts `POST /runs/:id/reveal`
(`apps/server/src/rest.ts:632-640`) — unless a leg ended in mate, in which case
`commitMove` emits `outcome.reached` (`packages/runtime/src/runtime.ts:337-343`) and the
run discloses on import. Both paths are correct and neither is new machinery.

**Rendering rule, from D10:** the comparison and overlay render engine provenance from
`SelectionEngineIdentity` exactly as stored, and never synthesize a version. Until
`defect-sweep.md` §6 lands, both shipped Stockfish specs report `version: "unknown"`
(`design/BACKLOG.md`, D10 row) and the overlay says so; after it lands the same code
shows the parsed version. The rule is what makes the surface honest in both states.

### 3.8 Spectator disclosure: unchanged, and why

**`feedbackDisclosed` keeps taking no viewer parameter, and this RFC adds no per-viewer
withholding anywhere.** `feedbackDisclosed(run)` (`packages/runtime/src/feedback.ts:3`),
`publicNodes(run)` (`apps/server/src/feedback-policy.ts:10-12`) and
`publicEvents(run, sinceSeq)` (`:34-37`) are viewer-blind, authorization is a separate
and earlier gate (`apps/server/src/authorization.ts:28-38`), and two viewers of the same
run receive byte-identical output. Four reasons this stays true:

1. **The ruling.** Per-viewer reveal cannot enforce blind play, because a player can
   spectate their own run from a second account. Building it would buy the thing it
   claims to buy for nobody.
2. **The direction that matters is already closed.** Uniform withholding guarantees a
   spectator never sees engine evidence the player cannot. That is the anti-contamination
   law's actual concern, and it is safe by construction rather than by check.
3. **A second disclosure path is the D4/D8 defect class.** Two sources of truth for one
   vocabulary is how `perfect_tablebase` became unencodable; a viewer-parameterized
   barrier alongside the run-global one is the same shape applied to the one boundary
   the product cannot get wrong.
4. **The academy reveal case does not need it.** "The coach reveals the authored claim
   to the class now" is already the shipped `POST /runs/:id/reveal` under the host's
   lease (`apps/server/src/rest.ts:632-640`, `packages/runtime/src/runtime.ts:236-255`):
   the host reveals, the run discloses, and every spectator's next 2 s poll sees it.
   Run-global disclosure is not an obstacle to the coached case, it is the mechanism for
   it.

**The documented limit, stated plainly and not engineered against.** A streamer who
plays blind while their audience sees an evaluation is not achievable, because the
streamer can hold a second account with a spectator grant on their own run and read
whatever the audience reads. The overlay therefore shows exactly what the host's own
screen shows. Chat voting, host rewind/branch/compare, and the spectator projection are
unaffected. This paragraph is the deliverable — it goes into `docs/` as a limit, and no
code is written against it.

### 3.9 D18: the follower must not freeze silently

`EventsPage` gains one field:

```ts
export interface EventsPage {
  readonly events: readonly DrillRunEvent[];
  readonly nextSeq: number;
  readonly withheld?: true;   // set when publicEvents truncated at the barrier
}
```

`publicEvents` sets `withheld: true` on the truncating branch
(`apps/server/src/feedback-policy.ts:45-50`) and never on the disclosed branch. This is
additive JSON on a response, not a run-schema change: no migration, no schema version.
The client's follower (`apps/web/src/lib/run-state.ts:197-204`) renders a standing
"the host is ahead; evidence is withheld until this run discloses" state instead of a
board that looks live and is not. Truncation itself is unchanged, because the client's
contiguity check (`:80-86`) requires it.

### 3.10 The overlay projection

Route `/live/overlay/:runId`. A chrome-free render of the same `RunStateSnapshot`
(`apps/web/src/lib/run-state.ts:34-39`) the drill screen uses, through the same
`projectRun` the writer uses — this is what makes the overlay a projection rather than a
second product (`design/03-product-breadth.md:151-152`). It renders the active position,
the objective state, the branch list, the open vote tally, and the adapter attribution
line from §3.6.4. No navigation, no shell frame, no write control, no evidence beyond
what §3.8 already gives every reader.

**Authentication is the shipped cookie, not a URL token.** An OBS browser source has its
own cookie jar; the streamer signs in once inside it, ideally as a dedicated overlay
learner granted `spectator`. This is why no token needs to travel in the address, which
is fortunate given `parseDrillAddress` forbids query and fragment
(`packages/schema/src/drill-pack/urls.ts:88-91`).

### 3.11 Client surface

Two routes join `apps/web/src/lib/router.ts:18-27`:

- `/live/session/:sessionId` — the session page: members and their roles, board control
  and the handoff control, invitations, schedule, match legs and PGN import, and the
  journal. This is where a session exists before its run is being played, which is what
  a scheduled pack night needs.
- `/live/overlay/:runId` — §3.10.

`/live` becomes real: sessions you host, sessions you are granted on, and scheduled
events, listed by scheduled time and pack id. **It does not open a second path to
`phase`.** `PackSummary` omits it and the client has never seen it (`design/BACKLOG.md`,
**D6** row); `defect-sweep.md` §4 projects it, and once that lands, filtering a session
list by phase is depth added inside this surface through the field that draft supplies.

Inside a run whose id has a session, the drill screen gains a **session rail** —
`design/03-product-breadth.md:148` already names "session/role controls appropriate to
solo, host, participant, or spectator" as a region of the shared shell, so this is a
region, not a second play screen. It shows the current holder (`RunViewer.leaseHeldBy`,
`apps/server/src/service.ts:64-69`), open proposals, the open vote window and tally, and
the host's controls. It is absent for runs with no session, so solo play is visually
unchanged.

`live` flips to `"available"` in `apps/server/src/capabilities.ts:117-129`,
unconditionally — sessions need no engine — and drops out of `PLANNED_SURFACES`
(`apps/web/src/lib/api.ts:170-176`).

### 3.12 HTTP surface

All routes authenticate through the shipped cookie and scope through the shipped grant.
All POSTs require `content-type: application/json` via `requireJson`
(`apps/server/src/rest.ts:628`) except the PGN import, which requires
`text/x-chess-pgn`. **No new route accepts a body without a content-type check** — the
shipped inconsistency (`requireJson` is applied only to `lease`, `reveal` and `grants`)
must not be widened, since `SameSite=Strict` is currently the only CSRF defence
(`apps/server/src/identity.ts:201`).

| Route | Method | Authorization |
|---|---|---|
| `/sessions` | POST | authenticated; caller must be `host` on `runId` |
| `/sessions` | GET | authenticated; sessions on runs the caller is granted |
| `/sessions/:id` | GET | any granted role |
| `/sessions/:id` | POST `{op:"close"}` | `mayControlSession` |
| `/sessions/:id/journal?sinceSeq=N` | GET | any granted role |
| `/sessions/:id/board` | POST | `mayControlSession` |
| `/sessions/:id/proposals` | GET / POST | any granted role / `mayPropose` |
| `/sessions/:id/proposals/:pid` | POST | `mayControlSession` |
| `/sessions/:id/votes` | POST `open`/`close` | `mayControlSession` |
| `/sessions/:id/votes` | POST `cast` | `mayVote`; `voterKey` only from `voteAdapterLearnerId` |
| `/sessions/:id/votes/:windowId` | GET | any granted role |
| `/sessions/:id/invitations` | GET / POST | any granted role / `mayControlSession` |
| `/sessions/:id/legs/:leg/pgn` | POST | `mayControlSession`, or the invited learner for that leg |
| `/runs/:id/lease` | POST | unchanged gate, plus §3.3 board control |

A session on a run the caller has no grant on returns `RUN_NOT_FOUND`, matching
`requireRead`'s no-existence-oracle posture (`apps/server/src/authorization.ts:28-38`).

New error codes: `BOARD_HELD` (409), `LEASE_MOVED` (409), `VOTE_WINDOW_CLOSED` (409),
`ARENA_ROOT_MISMATCH` (422). Mapped in `apps/server/src/rest.ts:358-374`.

### 3.13 Persistence — migration 7

`STORAGE_VERSION` 6 → 7 (`apps/server/src/storage.ts:147`), registered in
`rfc/README.md` §Migration register. All tables `STRICT`, all `CHECK` strings derived
from the frozen tuples of §3.1/§3.2 rather than typed twice.

**Ordering against migration 6.** `rfc/n-way-comparison.md` holds 6. Migration 7 is
append-only DDL that reads no run snapshot and no column either draft touches, so it is
order-independent in behaviour but not in numbering: it must be appended after 6 in the
ladder (`apps/server/src/storage.ts:915-941`). If `n-way-comparison.md` is withdrawn
before landing, this migration rebases to 6 rather than leaving a hole — the register is
the single writer of that decision.

```sql
CREATE TABLE live_sessions (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE REFERENCES drill_runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('stream','academy','match')),
  title TEXT NOT NULL,
  board_control TEXT NOT NULL CHECK (board_control IN ('free_claim','host_directed','rotation')),
  scheduled_for TEXT,
  vote_adapter_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
  rotation_json TEXT,
  handoff_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
  rotation_cursor INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES learners(id),
  created_at TEXT NOT NULL,
  closed_at TEXT
) STRICT;

CREATE TABLE session_journal (
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  at TEXT NOT NULL,
  kind TEXT NOT NULL,
  actor_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
  run_seq INTEGER,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (session_id, seq)
) STRICT;

CREATE TABLE session_proposals (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  move_uci TEXT NOT NULL,
  proposed_by TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open','applied','declined','stale')),
  resolved_run_seq INTEGER
) STRICT;
CREATE UNIQUE INDEX session_proposals_open
  ON session_proposals(session_id, node_id, proposed_by) WHERE status = 'open';

CREATE TABLE session_vote_windows (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  opens_at TEXT NOT NULL,
  closes_at TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('open','closed','stale')),
  applied_option_uci TEXT
) STRICT;
CREATE UNIQUE INDEX session_vote_windows_open
  ON session_vote_windows(session_id) WHERE state = 'open';

CREATE TABLE session_votes (
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  window_id TEXT NOT NULL REFERENCES session_vote_windows(id) ON DELETE CASCADE,
  voter_key TEXT NOT NULL,
  choice_uci TEXT NOT NULL,
  cast_by_learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  at TEXT NOT NULL,
  PRIMARY KEY (session_id, window_id, voter_key)
) STRICT;

CREATE TABLE session_invitations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  leg INTEGER CHECK (leg IN (1,2)),
  invited_handle TEXT,
  invited_role TEXT NOT NULL CHECK (invited_role IN ('host','participant','spectator')),
  external_challenge_url TEXT,
  state TEXT NOT NULL CHECK (state IN ('open','accepted','revoked')),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE arena_legs (
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  leg INTEGER NOT NULL CHECK (leg IN (1,2)),
  reference_player_handle TEXT,
  external_challenge_url TEXT,
  pgn TEXT,
  result TEXT CHECK (result IN ('1-0','0-1','1/2-1/2','*')),
  branch_id TEXT,
  imported_at TEXT,
  PRIMARY KEY (session_id, leg)
) STRICT;
```

Migration 7 creates tables only. It backfills nothing, rewrites no snapshot, and touches
no run row, so it cannot mis-stamp a schema version the way migration 4's body had to be
frozen against (`rfc/README.md:54`). Every existing run has no session and keeps
`free_claim` semantics by construction. `DRILL_RUN_SCHEMA_VERSION` is unchanged.

**Deleting a learner** must not orphan a session: `ON DELETE SET NULL` on
`vote_adapter_learner_id`, `handoff_learner_id`, and `session_journal.actor_learner_id`
preserves the journal as history while the account-deletion path already reassigns runs
and leases to `__legacy` (`apps/server/src/storage.ts:610-644`). A journal entry whose
actor is null reads as "a deleted account", which is honest; deleting the row would edit
an append-only log.

### 3.14 Deployment posture

Every live surface must work under `ENGINE_MODE: mock`. A match run requests no
selection at all (§3.7.3); an academy or stream run requests selections exactly as a
solo run does, and every session-layer route is engine-free by construction. This is not
decoration: **D5** records that the release compose hardcodes `ENGINE_MODE: maia` with an
unconditional Maia dependency (`design/BACKLOG.md`, D5 row), `defect-sweep.md` §5
restores the light profile, and a live platform that quietly required a Maia sidecar
would erase that fix the moment it landed. The acceptance suite runs the live tests in
mock mode.

## Deviations from design

1. **`design/03-product-breadth.md:88` names "team relays" and "cohorts" as distinct
   items; this RFC ships neither as a distinct type.** A cohort is a session's grant set
   and a relay is `boardControl: "rotation"`. The surfaces exist and complete their
   scenarios; the aggregates do not, because they would only re-express `run_grants`.
2. **`design/03-product-breadth.md:83` says viewers do not need *full synchronized*
   clients; this RFC gives them no client at all** in the stream case. Stronger than the
   design asks, and a consequence of §3.6.1's adapter-is-a-learner decision rather than a
   separate choice.
3. **`design/03-product-breadth.md:90` names shareable run URLs and spectator-safe views
   as platform primitives. This RFC ships the authenticated half only** — a granted
   spectator with a run URL. The unauthenticated public share link is out of scope
   (§2.6) and B8's row stays open on it.
4. **`design/03-product-breadth.md:86` says a completed event "can be replayed and
   distilled into a pack." This RFC ships replay and the session record; the
   distillation emitter is program item #6's** (`design/03-product-breadth.md:255`),
   which this RFC's `LiveSession` + `session_journal` + `arena_legs` are the input to.
5. **Against `planning/breadth/live-and-platform.md` §A4/C1**, which proposed a
   capability-token model with `capabilities: [{token, role, label}]`. Rejected: F3
   shipped handle-based grants, and adding tokens would create a second authorization
   vocabulary and a bearer credential the codebase does not otherwise have. §A4/C3's
   separate-session-log recommendation is adopted and strengthened; §A4/C5 and §A4/C6
   are pinned rather than held open (§3.7.4, §3.6.2). That dossier is planning tier and
   this RFC supersedes it on these points; no `design/` edit is implied.

## Acceptance criteria

**A1 — Three roles, a proposal, and a vote, in the browser.** A new
`tests/browser/live.spec.ts` test using three browser contexts and three registered
learners, following the two-context pattern already proven at
`tests/browser/drill.spec.ts:380-412`:

1. The host opens a run and creates an `academy` session with
   `boardControl: "host_directed"`; grants learner B `participant` and learner C
   `spectator`.
2. B's `POST /runs/:id/lease` is refused with `BOARD_HELD` (409). The host still holds
   the board.
3. B proposes a legal move at the active node; it appears in the host's session rail
   within one poll interval, and C (spectator) can read it but has no propose control.
4. The host opens a vote window with two labelled options; C casts one; the host's
   tally reads 1–0 and the overlay at `/live/overlay/:runId` shows the same tally with
   no navigation chrome.
5. The host applies B's proposal. A single `move.committed` appears in the run, authored
   by the host. C's board advances within 4 s.
6. The host offers the board to B; B claims it successfully; B plays one ply.
7. `GET /sessions/:id/journal?sinceSeq=0` attributes the move in step 5 to the host and
   the move in step 6 to B, by the §3.4 rule.

**A2 — Arena two legs compare.** A browser or server test: create a `match` session from
a root FEN with a declared reference side, import two PGNs, and assert that the run has
exactly two branches both with `forkNodeId === rootNodeId`, that
`POST /runs/:id/compare` with the two branch ids returns a `BranchComparison` whose
`forkNodeId` is the root and whose pairs start at `plyOffset: 1`, and that no
`opponent.move_selected` event exists anywhere in the run.

**A3 — Import rejects rather than absorbs.** A PGN whose start position differs from the
run root returns `ARENA_ROOT_MISMATCH`; a PGN with variations, with two games, or with
an illegal ply is rejected and leaves the run byte-identical (no partial branch).

**A4 — Spectators still cannot see what the player cannot.** With a run whose feedback
is withheld, host and spectator `GET /runs/:id/graph`, `/events`, `/evidence` and
`POST /compare` responses are identical apart from the `viewer` block, and
`/evidence` is empty for both. Extends the existing server coverage in
`apps/server/src/identity-authorization.test.ts`.

**A5 — D18.** With the barrier active, `GET /runs/:id/events` returns `withheld: true`
and the follower renders the withheld state rather than a static board. A unit test on
`publicEvents` asserts the flag is set on the truncating branch and absent on the
disclosed one.

**A6 — D17.** A test asserts that two concurrent `POST /runs/:id/lease` calls under
`free_claim` produce exactly one winner and one `LEASE_MOVED`, that a `host_directed`
participant claim without a handoff is `BOARD_HELD`, that the same claim after an offer
succeeds, and that every successful claim wrote a `board.granted` journal row in the
same transaction.

**A7 — D4 obligation.** A test asserts that `RUN_ROLES`, the request-parser guard, the
SQL `CHECK` constraint and the client's `RunRole` union are all derived from or equal to
one another, and that the duplicated `mayWrite` in `apps/server/src/storage.ts:155-157`
is gone.

**A8 — Honest surfaces.** `GET /capabilities` reports `live: "available"`, the client no
longer labels it planned, and the `/live` placeholder at
`apps/web/src/App.svelte:351` is replaced by the real index. The route-wide disabled-control
sweep (`docs/app-shell.md`) passes on the two new routes, and the overlay route owns its
viewport at the projections asserted in `tests/browser/drill.spec.ts`.

**A9 — Nothing solo changed.** The full existing suite passes unmodified, including the
Najdorf end-to-end scenario and the existing spectator test, with `retries` still unset.
A run with no session has `free_claim` board control and no session rail.

**A10 — Docs.** `docs/live-sessions.md` exists and states, in the product's own voice:
the three roles and the three board-control modes; that the tally is advisory and only
as trustworthy as the adapter; **that a streamer cannot play blind in front of their own
audience, and why that is accepted rather than fixed**; and that engine provenance may
read "version unknown" until D10 is closed. `docs/identity-and-authorization.md:34-37`
and `:71` are updated for board control and for the journal-derived authorship rule.

## Open questions

None.

## Proposed ledger rows (owner-tier; not implementer tasks)

`design/BACKLOG.md` is design tier and is edited by the owner or by claude on the
owner's ruling (`CLAUDE.md` §Non-negotiable laws 5). These are proposals.

- **New D17** — `POST /runs/:id/lease` has no compare-and-swap predicate and no
  enclosing transaction (`apps/server/src/storage.ts:758-777`), so any `participant` can
  seize the board from the host at any moment and two claimants race last-writer-wins.
  Correct for solo two-device continuity; a live hazard for any coached session. Closed
  by `rfc/live-session-platform.md` §3.3.
- **New D18** — `publicEvents` truncates at the disclosure barrier and pins `nextSeq`
  (`apps/server/src/feedback-policy.ts:45-50`), so a 2 s follower re-requests the same
  seq forever and a spectator's board freezes with no indication. Never-silent
  violation, only reachable through the follower path. Closed by §3.9.
- **New D19** — the run log cannot attribute a ply to a learner
  (`packages/runtime/src/types.ts:115-120`) and grant/lease changes are not journalled;
  `docs/identity-and-authorization.md:71` records this as a limit, which two
  write-capable roles on one run turn into a defect. Closed by §3.4 without touching the
  run schema.
- **Correction of record, Position Arena row** — "`parsePgn` has no production caller"
  is no longer accurate: `apps/server/src/sourcing/openings.ts:7,47` calls it in the
  offline sourcing CLI. The accurate claim is that no PGN reader exists on any request
  path.
- **Correction of record, Academy row** — "the lease cannot express a second writer
  role" is no longer accurate: `participant` is write-capable
  (`apps/server/src/authorization.ts:21`) and the lease serializes the two. What is
  missing is policy over possession (D17), not a role.
- **`Streamer/Twitch mode`, `Academy/coached sessions`, `Position Arena`** — all three
  become 📜 scheduled against this RFC rather than blocked on F3.

`planning/exploration/gates.md` B5 row: unmet → met once A1–A10 pass; B8's share-link
clause stays open on the unauthenticated public link (§2.6).

## Changelog

- 2026-08-13: created.
