# RFC: Social match — native human-vs-human play, pause-and-rehearse, friend links, and the simul wall

- **Status:** implementing
- **Author:** claude
- **Created:** 2026-08-14
- **Design refs:** `design/03-product-breadth.md:79-91` (Live and community), `:90-91`
  (shareable URLs and spectator-safe views as platform primitives), `:252-258` (shared
  shell regions); `design/05-in-run-experience.md:33-42` (§1 invariants — audited
  one by one in §2.4 below); `design/BACKLOG.md:210` (Friend-link play, audit row 30),
  `:211` (Native human-vs-human match mode, owner 2026-08-14), `:200` (share-card read
  token, audit row 2 — consumed contract); `design/research/adoption-audit.md:44` (row 2),
  `:97` (row 30)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 (`rfc/README.md:66-71`);
  owner framing 2026-08-14 in the BACKLOG match row (`design/BACKLOG.md:211`): coach
  hosts, students pair off, coach walks the boards like a simul
- **Depends on:** `rfc/archive/live-session-platform.md` (sessions, board control, the
  possession journal, invitations, Arena legs); `rfc/archive/learner-identity-and-authorization.md`
  (accounts, grants, the learner-bound lease); `rfc/archive/pack-optional-runs.md`
  (position runs — a match run is one); **`rfc/archive/adoption-wave-1.md`** (the
  `public_tokens` trust surface this RFC's friend-link scope extends — §3.5 — and the
  `flip` route whose live-match refusal §3.3 owns); `rfc/archive/runtime-corpus-evidence.md`
  (this RFC appends to the shared `ServerErrorCode` union that lifecycle also appends to;
  its corpus
  endpoint is delivery-window-gated and needs no `MATCH_LIVE` entry, §3.3)
- **Parent / amends:** amends the live-session platform: `BOARD_CONTROLS`
  (`apps/server/src/live-types.ts:6`), `SESSION_JOURNAL_KINDS` (`:9-15`), `claimLease`
  (`apps/server/src/storage.ts:981-1032`), the session route parser
  (`apps/server/src/rest.ts:505-521`), the `POST /sessions` body
  (`apps/server/src/rest.ts:827`), the error union and status map
  (`apps/server/src/errors.ts:1-46`, `apps/server/src/rest.ts:389-479`), and the
  documented no-anonymous-token limit (`docs/live-sessions.md:84-86`)
- **Supersedes / superseded by:** —
- **Parallel batch:** drafted last in the 2026-08-14 four-draft wave
  (`predicate-wave-2` → `runtime-corpus-evidence` → `adoption-wave-1` →
  `social-match`), register claims taken behind all three. Per the standing pin
  (`rfc/README.md` §Cross-draft ownership pins): **`archive/adoption-wave-1.md` owns the
  `public_tokens` table**; this RFC adds its `session_join` scope by widening that
  table's `CHECK` in its own migration and creates no second token table (§3.5).
- **Planning:** `planning/social-match/` (once implementing)

Implementation baseline re-pinned after the three preceding wave lifecycles:
**430 unit tests / 73 files** passing, browser **18 passed** with the optional Maia
case skipped and retries unset, run schema `"0.10"`, pack schema `"0.13"`, and
`STORAGE_VERSION = 13`.

## Summary

The owner's audit in the BACKLOG match row (`design/BACKLOG.md:211`) is correct and was
re-verified for this draft: the live platform already ships roles, per-run grants, three
board-control modes, a CAS'd lease claim, a possession journal with an exact authorship
rule, invitations, and spectating across real browser contexts. The missing atom is
small and this RFC ships it: a **`match` board-control mode** in which possession
follows the side to move between two named players — one run, two humans, every attempt
preserved and comparable, which no instant pool anywhere offers. Around that atom it
ships the three things that make it the "students join natively" surface: **pause-and-
rehearse by agreement** (the loop — rewind, branch, compare — attached to a live game
between two people), the **friend-link token** that turns a URL into a seat at the
board (audit row 30, one new scope on `adoption-wave-1`'s `public_tokens` trust
surface), and the **simul wall** — the coach's one-poll view over N match boards.
It adds no run-schema change, no new credential path for writes, and no second
disclosure surface.

## Motivation

### 2.1 Re-verification: what actually ships

Every row re-run against the working tree for this draft.

| Capability | Ships? | Evidence |
|---|---|---|
| Roles, grants, learner-bound lease | **yes** | `RUN_ROLES` `apps/server/src/storage.ts:31`; predicates `apps/server/src/authorization.ts:17-38`; every write checks session → grant → role → learner lease → device writer `apps/server/src/authorization.ts:53-70` |
| Lease claim with transaction + CAS witness (D17 closed) | **yes** | `claimLease` runs under `BEGIN IMMEDIATE`, reads the holder as witness, applies board control, updates with a `WHERE ... active_writer_learner_id = ?` predicate, and journals in the same transaction — `apps/server/src/storage.ts:981-1032` |
| Board-control modes | **yes, three** | `BOARD_CONTROLS = ["free_claim","host_directed","rotation"]` `apps/server/src/live-types.ts:6`; session-less derivation from grantee count `apps/server/src/storage.ts:1001-1003` |
| Possession journal + exact authorship rule (D19 closed) | **yes** | `board.granted` appended inside the claiming transaction `apps/server/src/storage.ts:1021-1023`; `deriveMoveAuthorship` with the strict `runSeq < S` interval lookup `apps/server/src/live-session.ts:18-25` (strict `<` at `:22`) |
| Two-leg Arena match (imported humans) | **yes** | `SESSION_KINDS` includes `match` `apps/server/src/live-types.ts:3`; `importLeg` `apps/server/src/live-session.ts:165-179` — reference side `user`, other side `system` (`:175`) |
| Position runs from FEN, `attempt_end` enforced | **yes** | `apps/server/src/rest.ts:270-300`; `attempt_end` required at `:276`, `side` required at `:274-275` |
| Spectating across real browser contexts | **yes** | `tests/browser/drill.spec.ts:613-645` (two contexts, grant, read-only rendering, 4 s follow); live session + overlay test `:123-139` |
| Withheld follower state (D18 closed) | **yes** | `publicEvents` sets `withheld` only when it truncated `apps/server/src/feedback-policy.ts:37-50`; client renders it `apps/web/src/lib/run-state.ts:42,246-247` |
| **Possession that follows the side to move** | **no** | no board-control mode consults the position; `rotation` advances by host op only (`apps/server/src/storage.ts:1008-1013`, `boardOperation` `:1513+`) |
| **Two humans alternating on one live board** | **no** | nothing stops the lease holder from playing both sides of a position run (`actor` is client-supplied within `user|opponent|system`, `apps/server/src/rest.ts:370-383`) |
| **Pause/rehearse/resume state on a session** | **no** | grep `pause|resume` over `apps/*/src packages/*/src` → zero domain hits |
| **Any anonymous or invite token** | **read-only story cards ship; invite seating does not** | `docs/adoption-wave-1.md` documents `public_tokens` with the single read scope `story_read`; **nothing yet lets a link seat a person** |
| **A multi-board host view** | **no** | `GET /runs` summaries carry no position (`RunSummary` `apps/server/src/storage.ts:68-79`); `GET /sessions` lists session rows only (`listLiveSessions` `apps/server/src/storage.ts:1481+`); detail is one request per session (`LiveSessionDetail` `apps/server/src/live-types.ts:95-105`) |

### 2.2 The two ledger rows this RFC completes

**Native match** (`design/BACKLOG.md:211`, owner 2026-08-14): the row itself names the
missing atom — "a **match** board-control mode where possession auto-alternates by
side-to-move between two write-capable grantees" — and the pilot: the owner's coaching
context, coach walking the boards like a simul. B5's validated-by-use rationale now has
its humans.

**Friend-link** (`design/BACKLOG.md:210`, audit row 30): "the minimal B5-compatible
human-pool transformation — a real human now, with the loop attached (both attempts
preserved and comparable, which no instant pool offers)." The audit costed it at "token
+ invite flow" with **no conflict at friend-link scale**
(`design/research/adoption-audit.md:97`). The native pool itself stays behind B5's
revival conditions and is not touched here.

### 2.3 Scope boundary

**In:** the `match` board-control mode; pause-and-rehearse-and-resume; the
`session_join` scope on the wave's shared `public_tokens` trust surface — the
friend-link flow; the simul wall; attribution and progression rules for two-human
runs.

**Out, named rather than implied.** **Native clocks** — `Node.clockState` is carried
opaquely by the runtime and a timed mode is depth inside this surface, refused here
because a clock that forfeits needs the wall-clock scheduler the platform deliberately
does not have (`rfc/archive/live-session-platform.md` §3.6.2's lazy-transition
doctrine); a match without clocks is still a match. **Resignation and agreed draws as
run events** — the run event union is closed and `outcome.reached` is
security-sensitive projection-validated (`docs/branch-runtime.md:195-201`); a match
that ends without a board-terminal position ends by the host closing the session, the
run stays non-terminal, and its evidence opens by reveal-under-pause (§3.3) — stated as
the shipped shape, not a gap. **Matchmaking, pools, ratings** — rejected posture,
unchanged (`design/BACKLOG.md:210-211`). **Per-viewer disclosure** — refused again for
the same four reasons as `rfc/archive/live-session-platform.md` §3.8; §3.3 shows the
match case needs none.

### 2.4 The §1 invariant audit — this feature collides with zero of them

The match row asserts it; the draft's job is to keep it true
(`design/05-in-run-experience.md:33-42`):

1. **Commit before you learn** (`:37`): engine evidence stays behind the run-global
   `attempt_end` barrier for both humans; reveal is possible only inside a
   mutually-accepted pause or after `outcome.reached` (§3.3). Nobody decides with an
   evaluation on screen.
2. **An attempt is never destroyed** (`:38`): pause-rehearsal forks; the match mainline
   and every rehearsal branch survive and are comparable — this is the differentiator
   over every pool, so the design leans on the invariant instead of straining it.
3. **Rewind is an experiment** (`:39`): resume repositions the cursor to the mainline
   tip with the shipped `run.rewound` event (`packages/runtime/src/types.ts:177`);
   nothing is erased.
4. **Nothing invents chess truth / absence stated** (`:40-41`): the mode adds no
   evidence source and no verdicts; a match with no engine evidence says so.
5. **The run is the sole source of chess truth** (`:42`): players, pause state, and
   tokens live in session/token tables; the only run events a match produces are the
   shipped `move.committed`, `branch.forked`, `run.rewound`, `feedback.revealed`, and
   `outcome.reached`, so closing the session cannot change how the run replays.

## Specification

### 3.1 The `match` board-control mode

`BOARD_CONTROLS` gains `"match"` (`apps/server/src/live-types.ts:6`), defined once as
today, with the SQL `CHECK` derived from the tuple. A native match is a session with
`kind: "match"` **and** `boardControl: "match"`; an imported two-leg Arena stays
`kind: "match"` with any other board control, and the two flavors exclude each other's
verbs: `importLeg` refuses `boardControl === "match"` sessions with `INVALID_REQUEST`
(one new guard beside the kind check at `apps/server/src/live-session.ts:166`), and
every §3.2 match operation refuses sessions whose board control is not `match`.

**3.1.1 Players.** A new `match_states` row (§3.8) names exactly two players by side:
`white_learner_id` and `black_learner_id`, distinct, each resolved from a handle at
session creation exactly as rotation resolves its learners
(`apps/server/src/live-session.ts:62-68`), except that an unresolved-but-invited seat
may instead be left open against a `join` token (§3.6). A named player who lacks a
write-capable grant is granted `participant` through the shipped path, mirroring the
invitation behavior at `apps/server/src/live-session.ts:161`. The host may be one of
the players (friend hosts friend) or neither (coach hosts the pair). The session run
must be a position run (`sessionKind: "position"`, therefore `attempt_end` —
`apps/server/src/rest.ts:276`) with no committed plies yet, the same untouched-run rule
leg 1 already applies (`apps/server/src/live-session.ts:174`). `run.start.side` is the
reference side exactly as in the Arena (`rfc/archive/live-session-platform.md` §3.7.2):
outcome grading and the comparison read from that side's perspective.

**3.1.2 Claims: possession follows the side to move.** `claimLease` gains a fourth arm
beside the three at `apps/server/src/storage.ts:1005-1013`, inside the same
`BEGIN IMMEDIATE` transaction, keeping the CAS witness and journal exactly as shipped
(`:989-998`, `:1014-1023`):

- **Live** (no pause recorded): the claim proceeds only when the claimant is the
  `match_states` player assigned to the side to move of the run's active cursor,
  read in-transaction from the stored snapshot's cursor FEN. Everyone else — the other
  player, a write-capable coach, any third grantee — gets `BOARD_HELD` (409).
- **Paused**: any write-capable grantee may claim (`free_claim` among the write-capable
  set). This is deliberate: it is what lets the coach take a board during a pause and
  demonstrate on a rehearsal branch (§3.2).
- A `match_states` row with a null player (account deletion, §3.8) refuses all live
  claims with `BOARD_HELD`; pause claims still work, so the survivor can rehearse and
  the record stays fully readable.

No auto-transfer is added. After A moves, A still holds the lease but the position now
belongs to B's side, so A's claim arm and B's both resolve correctly on the next
request; B's client claims when the poll shows B's side to move. The cost is stated,
not waved: alternation adds at most one poll interval plus one claim round-trip before
B's move can commit — worst case ~2 s + two request round-trips per ply on the shipped
2 s poll. That budget is **bounded by assertion, not measured**: A1 asserts the ply
visible on the other board within 4 s, and no tighter number is claimed. It is
acceptable here precisely because clocks are out of scope (§2.3); a timed mode would
have to revisit possession transfer, and that is part of why clocks are refused. If
both clients race the same transition — both claim after A's ply — the transaction
serializes them: the side-to-move player's claim succeeds and every other claimant
(the opponent, a write-capable coach) receives the typed `BOARD_HELD` 409, which the
rail renders as "their move"; the loser's state is honest, not silently stale. Every
alternation is therefore an ordinary journalled claim — which is precisely what keeps
§3.4 exact. Disconnection needs no new
machinery: the lease is learner+device, so B returning on any device claims under the
same arm; A cannot steal the board meanwhile because it is B's side to move; two of B's
devices racing produce one winner and one `LEASE_MOVED` exactly as A6 of the platform
RFC proved (`rfc/archive/live-session-platform.md` A6).

**3.1.3 Moves: the server derives the actor and refuses everything else.** On a run
whose session is a native match, `POST /runs/:id/moves`:

- refuses a body that supplies `actor` or an opponent `selection`
  (`INVALID_REQUEST`) — a match has no engine opponent and no client-labelled sides;
  the shipped parser that accepts them (`apps/server/src/rest.ts:370-383`, `:1058`)
  is bypassed for match runs, not widened;
- derives the actor from the mover's seat: reference-side plies commit as `user`,
  other-side plies as `system` — byte-compatible with the Arena convention
  (`apps/server/src/live-session.ts:175`), so a native match and an imported one
  project and compare identically, and `Node.actor` does **not** widen (D19's standing
  lesson, `design/BACKLOG.md:136`);
- while **live**, requires the cursor to be the mainline tip and the mover to be the
  player assigned to the side to move; a lease holder attempting the other side's move
  is refused `BOARD_HELD` before legality is consulted. (The board alone almost
  enforces this — a position only ever has legal moves for one color — but "almost" is
  exactly the hole: the holder could commit the opponent's reply as their own client
  once did in solo play. The gate closes it.);
- while **paused**, applies §3.2.3's mainline lock.

The mainline is the run's initial branch — branch 0, the branch every position run is
born with. Live match play never forks (rewind and fork are refused live, §3.3), so the
mainline is structurally stable and nothing needs to be stored to name it.

**3.1.4 The coach's interrupt.** `boardOperation` `reclaim`
(`apps/server/src/storage.ts:1513+`) stays host-only and works on a match session: the
coach takes the board mid-game to talk. The coach cannot move on the live mainline
(§3.1.3's seat gate), so the interrupt is possession without play — the simul walk's
"hold on, look at this square." Play resumes when the seated player claims back, which
the live arm permits. A coach who wants to *show* something forces a pause (§3.2.1) and
demonstrates on a fork.

### 3.2 Pause-and-rehearse by agreement

Pause state lives in `match_states` (`paused_at`, `pause_proposed_by`) and in journal
entries; it never enters the run log.

**3.2.1 Entering.** `POST /sessions/:id/match` with:

- `{ op: "propose_pause" }` — either **player**; journals `match.pause_proposed`; a
  standing proposal is replaced, not stacked.
- `{ op: "accept_pause" }` — the **other player**; sets `paused_at`, journals
  `match.paused`. Acceptance by the proposer is `INVALID_REQUEST` — agreement means two
  people.
- `{ op: "withdraw_pause" }` — the proposer, before acceptance.
- `{ op: "pause" }` — the **host only**, unilaterally, and only when the host is not a
  seated player (a playing host proposes like anyone else). This is coach authority: a
  simul host can stop any board to teach. Journals `match.paused` with the host as
  actor.

Every `match` op is precondition-checked and refuses out-of-state calls with
`INVALID_REQUEST`: propose/accept/withdraw while already paused, resume while live,
accept with no standing proposal, any op on a closed session. Acceptance, withdrawal,
and resume all clear `pause_proposed_by`, so no proposal survives a state transition.
Disconnection mid-pause needs no machinery: pause state is a server-side
`match_states` fact, not a connection property, and the platform's lazy-transition
doctrine means nothing times out — a board whose players both walk away simply stays
paused until either player or the non-playing host resumes it (§3.2.4), or the host
closes the session.

**3.2.2 What a pause opens.** Claims go `free_claim` among write-capable grantees
(§3.1.2). Rewind, fork, compare, and reveal — refused while live (§3.3) — become
ordinary shipped operations under whatever lease the claimant holds. Rewinding into the
mainline and committing a different move auto-forks a rehearsal branch, because that is
what `commitMove` already does at a cursor with children
(`packages/runtime/src/runtime.ts:143`, `:296`); no new branching machinery exists or
is needed. Both attempts — the mainline so far and every rehearsal — are then one
`POST /runs/:id/compare` apart. This is the loop attached to a live game, and it is
the whole reason the mode exists.

**3.2.3 The mainline lock.** While paused, a `move.committed` whose active cursor is
the **mainline tip** (branch 0's tip node — the one commit that would extend the match
line itself) is refused with `MATCH_MAINLINE_LOCKED` (409). Everywhere else the shipped
auto-fork does the right thing. The match line moves only by agreement, and agreement
is expressed by resuming.

**3.2.4 Resuming.** `{ op: "resume" }` — either player, or the non-playing host.
Unilateral by design: either party may always call the game back to the board, so
analysis mode cannot become a filibuster; the rehearsal branches survive regardless
(§2.4 invariant 2). The caller must hold the lease (claimable freely during pause).
In one service operation: if the cursor is off the mainline tip, execute the shipped
rewind to it (an ordinary `run.rewound` event under the caller's lease, composed
exactly as `resolveProposal` composes a run mutation,
`apps/server/src/live-session.ts:111-120`); clear `paused_at`; journal
`match.resumed`. From the next request on, the live claim arm governs and the player
whose side is to move claims the board.

### 3.3 Disclosure between two humans: what withholding means, and the pin

`feedbackDisclosed(run)` takes no viewer parameter
(`packages/runtime/src/feedback.ts:3-18`), so two humans in one run see byte-identical
disclosure. For human-vs-human this is not a limitation to engineer around — it is the
correct shape, because the contamination hazard in a match is **symmetric**: an
evaluation on screen mid-game biases both remaining decisions equally or advantages
whoever glances first. Both readings condemn mid-game disclosure, and run-global
withholding refuses both at once. What run-global disclosure cannot express is *mutual
consent to reveal* — and the pause handshake already is mutual consent. So:

**The pin.** A native match run keeps the shipped `attempt_end` barrier untouched.
`POST /runs/:id/reveal`, rewind, fork, `group`, `group-reply`, `simulate`,
`simulate-enter`, `prediction`, **`duplicate`**, and **`flip`** (the sibling
`rfc/archive/adoption-wave-1.md` §5 route — this RFC lands behind it structurally, §3.8, so
the route exists whenever a native match does) are refused with
**`MATCH_LIVE`** (409) while the match is live. The last two close the
**derived-run escape**, the hole the first revision left open: `duplicate` is
available to any grantee (`requireRead` only, `apps/server/src/service.ts:1254-1266`)
and yields a caller-owned copy of the match root replayable to the live position;
`flip` yields a caller-owned run at any live node's exact FEN; on either, the caller
holds their own lease and reveals at will — the product itself would be serving
engine evidence on the live position mid-game, which is categorically worse than the
conceded streamer limit (outside consultation Tabiya cannot see) because it is
in-product assistance. The mutating import against an existing session is Arena
`importLeg`, which §3.1.1 refuses for native matches. `GET /runs/:id/import` is a
read, while `POST /runs/import` creates an unrelated imported-game run with no source
match; neither is mislabeled as a match escape. Both derived-run operations are ordinary shipped operations during a pause
and after the terminal, when reveal is open anyway. `analysis`, `voice`, and
`schedule` deliberately stay available live: they disclose nothing while the delivery
window is closed — staged results are served and applied only while delivery is open
(`apps/server/src/service.ts:1109`, `:1137`) — and the corpus sibling's endpoint is
already gated on `feedbackDeliveryOpen` plus role by its own §5, so it needs no entry
here. During a pause, reveal is the ordinary shipped operation under the claimant's
lease — the mutually-accepted pause (or the host's teaching pause) *is* the
agreement, enforced by the handshake rather than by a viewer parameter. After
`outcome.reached`, disclosure opens under every policy exactly as shipped
(`packages/runtime/src/feedback.ts:13-16`) — a finished game cannot be contaminated.
Resumed play is clean for free: `feedbackDeliveryOpen` re-closes staged delivery on the
next `move.committed` (`packages/runtime/src/feedback.ts:20-28`), and because staged
results never become `evidence.attached` events while the window is closed, the
post-reveal run log and node refs hold only pause-consented historical evidence — new
analysis cannot become live assistance (`docs/branch-runtime.md:188-193`;
delivery-window gates verified at `apps/server/src/service.ts:1109,1137`). No second
disclosure path, no new predicate, no viewer parameter — the entire mechanism is one
409 gate in front of shipped machinery.

Read-only surfaces (`graph`, `events`, `evidence`, `compare`, `pgn`) stay available
live; they are already barrier-gated for every reader
(`apps/server/src/feedback-policy.ts:37-50`), and the documented streamer limit
(`docs/live-sessions.md:77-82`) carries over unchanged: a player determined to consult
an outside engine cannot be stopped by software, and Tabiya does not pretend otherwise.

### 3.4 Attribution: who played ply 14

D19's machinery covers match alternation with **zero changes**, verified against the
implementation rather than the RFC: every possession change in a match is an ordinary
`claimLease` claim, and every claim journals `board.granted` inside the moving
transaction (`apps/server/src/storage.ts:1021-1023`). `deriveMoveAuthorship`
(`apps/server/src/live-session.ts:18-25`) then attributes each `move.committed` by
interval lookup with the strict `runSeq < S` rule (`:22`) whose off-by-one the platform
RFC already litigated: B's claim after A's ply at seq `S` carries `runSeq = S`, so ply
`S` stays A's and ply `S+1` becomes B's. The one new obligation is a test (A5) pinning
the alternating case specifically, because the shipped tests cover handoffs, not
turn-taking. `Node.actor` stays closed (`packages/runtime/src/types.ts:3`); the run
knows sides, the journal knows people.

### 3.5 The friend-link: one new scope on the wave's shared token surface

**The shared contract, and who owns which half.** `rfc/archive/adoption-wave-1.md` §2 creates
`public_tokens` in its migration 13 — hashed 32-byte tokens, a closed typed `scope`
`CHECK` with the single read scope `story_read`, per-token revocation, uniform 404
non-disclosure, creator-cascade deletion — and the register pins it as **the single
trust surface for anonymous capability tokens** (`rfc/README.md` §Cross-draft
ownership pins). That is the "read-only card" capability level, and this RFC does not
restate or fork it. This RFC adds the second capability level the same pin assigns
here: **`session_join`**, the link that seats a person. Widening happens in this RFC's
own migration (§3.8) by rebuilding the table with the widened `CHECK` and the
join-only columns, all nullable so every `story_read` row survives byte-identical:

```sql
-- public_tokens after this RFC's migration (adoption-wave-1 columns unchanged):
--   scope CHECK (scope IN ('story_read','session_join'))
--   run_id, branch_id            → nullable (story_read rows keep both NOT NULL by
--                                  a CHECK: story_read requires run+branch,
--                                  session_join requires session_id)
--   session_id TEXT              REFERENCES live_sessions(id) ON DELETE CASCADE
--   match_slot TEXT              CHECK (match_slot IN ('white','black'))
--   invited_role TEXT            CHECK (invited_role IN ('participant','spectator'))
--   invited_handle TEXT          -- pins the redeemer when set ("named" learner)
--   expires_at TEXT              -- NULL = no expiry (story_read's shipped semantics)
--   uses_remaining INTEGER       -- NULL = unlimited; session_join defaults to 1
```

Token discipline is inherited, not reinvented: 32 random bytes, only the SHA-256
stored (`docs/identity-and-authorization.md:9-10`); one resolution seam returning the
row or nothing for **all** of unknown, revoked, expired, exhausted, and
scope-mismatched — the same 404-as-unknown-path posture `adoption-wave-1` §2 already
pins, matching `requireRead`'s no-existence-oracle rule
(`apps/server/src/authorization.ts:45-49`). The public URL namespace is also shared:
`GET /shared/:token` dispatches by the resolved row's scope — `story_read` renders
that RFC's card, `session_join` renders this RFC's join page. One namespace, because
two would give an attacker a scope oracle by path.

**`session_join` semantics** (`design/BACKLOG.md:210`). Never anonymous: the link is
an invitation, not a credential — the one anonymous thing the GET renders is the
session title, the host's handle, and a sign-in/register form (registration is the
shipped `/auth/register`; nothing new), never a position, move, or evidence.
`POST /shared/:token/join`, authenticated, in one transaction: re-resolve the token;
if `invited_handle` is set, require it to equal the principal's handle; grant
`invited_role` on the session's run through the shipped grant path (exactly the
invitation behavior, `apps/server/src/live-session.ts:161`); if `match_slot` names an
open seat, seat the redeemer in `match_states` (§3.1.1); decrement `uses_remaining`;
journal `member.joined` with the token id in the payload. The link itself grants
nothing — a leaked join URL lets a stranger *ask for a seat as themselves*,
attributably, and the host revokes the grant with shipped machinery. D1's lesson
(`design/BACKLOG.md:114`) holds by construction: no `/shared` route can dispatch to a
run mutation.

**Minting and revocation.** `POST /sessions/:id/links` (host only,
`mayControlSession`), body `{ matchSlot?, invitedRole, invitedHandle?,
expiresInDays? }`. Defaults: one use, 14-day expiry; lifetime caps at 90 days. At most
50 unrevoked session tokens per session (`INVALID_REQUEST` beyond), so one
enthusiastic host cannot grow the table. The bare token is returned exactly once at
mint, mirroring `adoption-wave-1`'s share flow; `GET /sessions/:id/links` lists ids
and states, never secrets; `POST /sessions/:id/links/:linkId` `{ op: "revoke" }`
revokes. Journals `link.minted` / `link.revoked`.

`matchSlot` is valid only with `invitedRole: "participant"`; a spectator link may
grant read access but can never occupy a playing seat. The REST parser and service
both refuse the contradictory pair with `INVALID_REQUEST`, and the table `CHECK`
repeats the invariant so direct storage writes cannot create an unwritable player.

**Abuse posture, pinned for the hosted ruling.** Tokens travel only over TLS —
production terminates TLS and secure cookies are the D24-pinned default unless the
exact string `false` opts out (`design/BACKLOG.md:131`, `cookieSecureFromEnv`
`apps/server/src/config.ts:1`, cookie suffix `apps/server/src/identity.ts:201`).
Guessing is a 256-bit search against hashes; the honest residual is volumetric, and
the posture matches the identity doc verbatim: rate limiting in-app is per-handle only
and a hosted reverse proxy should add broader abuse controls
(`docs/identity-and-authorization.md:66-68`). `/shared` responses are uncacheable
(`Cache-Control: no-store`) so a proxy cannot retain a join page past revocation.
Single-use default means the common leaked-link case is already dead when found.

### 3.6 The simul wall: what the coach's view needs

**Verdict on the shipped projections: functionally reachable, not servable.** A coach
*can* watch N boards today — open N tabs of `/play/run/:id` or `/live/overlay/:id` —
because spectating ships (`tests/browser/drill.spec.ts:613-645`). But a single wall
cannot be built from shipped reads: `GET /runs` summaries carry pack title, objective
state, branch count, role, and lease holder — **no position, no side to move, no pause
state** (`RunSummary`, `apps/server/src/storage.ts:68-79`); `GET /sessions` lists bare
session rows (`apps/server/src/live-session.ts:76`); `LiveSessionDetail` has
`activeNodeId` but not its FEN and costs one request per session
(`apps/server/src/live-types.ts:95-105`). A wall of eight boards polling eight full
graphs every 2 s is eight complete run projections per tick for data that is one FEN
wide.

**The addition, and all of it.** Each `GET /sessions` row gains a `board` block:

```ts
readonly board: {
  readonly activeFen: string;        // cursor node FEN
  readonly sideToMove: "white" | "black";
  readonly plyCount: number;         // mainline plies committed
  readonly pausedAt: string | null;  // native match only
  readonly leaseHeldBy: { readonly learnerId: string; readonly handle: string };
  readonly lastMoveAt: string | null;
};
```

Derived server-side from the stored snapshot at listing time, for every session the
caller is granted on — no new authorization surface (the caller could read each run's
graph already) and no evidence surface (a FEN is rung-0 position truth,
`design/05-in-run-experience.md` §3 rung 0; the block carries no evaluation, no
verdict, no staged-result count, and passes through no disclosure barrier — during a
pause the `activeFen` may show a rehearsal cursor, which is the same position truth
every granted follower already reads from the graph). The payload stays one FEN wide
per board: roughly a hundred bytes of block per session row, so a
twenty-board wall polls a few kilobytes per 2 s tick instead of twenty full run
projections. The client `/live` index renders granted native-match
sessions as a wall of mini-boards — position, players, whose move, paused badge — on
the shipped 2 s poll, one request total. Clicking a board opens `/live/session/:id`;
the coach walks the boards. Per-ply attribution in the session page uses the shipped
journal read (`GET /sessions/:id/journal`) plus `deriveMoveAuthorship`, which is
exported to the server package boundary already (`apps/server/src/index.ts:109`).

### 3.7 Attempts and progression: two-human runs must not pollute solo statistics

`#project` upserts attempt rows on every mutation under the acting principal
(`apps/server/src/service.ts:1384-1398`), and conflict updates never move
`learner_id` (`apps/server/src/storage.ts:1054-1059`), so a branch's attempt row
belongs to whoever created the branch. For a native match that yields one wrong row and
several right ones: rehearsal branches are genuinely their forker's attempts and keep
shipped semantics, but the **mainline** was created at run creation by the host and was
half-played by each player — it is nobody's rep. Pin: on a run with a native-match
session, the service upserts the mainline branch's attempt row with
`countable: false` (the field exists, `apps/server/src/progress.ts:22`), so it never
feeds due-scheduling or position statistics, while remaining visible history.
Per-player match history is the possession journal's job (§3.4), not the attempts
table's.

### 3.8 Persistence

**Migration number: 14** (`STORAGE_VERSION` 13→14), claimed last per the register
order and structurally behind `archive/adoption-wave-1.md` migration 13. Shipped at
implementation start is **13**. Run schema stays `0.10` and pack schema stays
`0.13`; this RFC claims no schema version. Because this migration rebuilds
`public_tokens`, it **must land behind migration 13** — the dependency is structural,
not just numeric.

**One new table:**

```sql
CREATE TABLE match_states (
  session_id TEXT PRIMARY KEY REFERENCES live_sessions(id) ON DELETE CASCADE,
  white_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
  black_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
  paused_at TEXT,
  pause_proposed_by TEXT REFERENCES learners(id) ON DELETE SET NULL
) STRICT;
```

`ON DELETE SET NULL` for seats: account deletion already reassigns runs and journals
the possession move (`rfc/archive/live-session-platform.md` §3.3.2); a null seat
freezes live play (§3.1.2) without deleting anyone's history.

**Widened vocabularies force table rebuilds, and the sharp edge found on the way.**
`BOARD_CONTROLS` gains `match`; `SESSION_JOURNAL_KINDS` gains `match.pause_proposed`,
`match.paused`, `match.resumed`, `link.minted`, `link.revoked`; `public_tokens.scope`
gains `session_join` plus the nullable join columns of §3.5. All three vocabularies
are baked into `CHECK` constraints of existing tables (`live_sessions.board_control`
`apps/server/src/storage.ts:1903`, `session_journal.kind` `:1917`,
`public_tokens.scope` per `rfc/archive/adoption-wave-1.md` §2), and SQLite cannot alter a
`CHECK` — the migration rebuilds all three tables: `PRAGMA foreign_keys=OFF` for the
migration, `ALTER TABLE ... RENAME`, `CREATE` with the widened derived `CHECK`,
`INSERT ... SELECT` copying every row and column unchanged (new columns `NULL`),
`DROP`, then `PRAGMA foreign_key_check` must report zero rows before commit. This is a
runner-level exception, not SQL pasted into the migration body: SQLite ignores
`PRAGMA foreign_keys=OFF` inside an active transaction. The runner disables foreign
keys and enables `legacy_alter_table` **before** `BEGIN IMMEDIATE`, executes migration
14, checks `foreign_key_check` before commit, then restores both pragmas in a
`finally` path. `legacy_alter_table` is required so the other, non-rebuilt session
child tables keep referencing the newly-created `live_sessions` name rather than the
temporary renamed parent. A7 asserts those child foreign-key targets explicitly.
**The found edge:**
migration 9's DDL interpolates the *live* tuples (`values(SESSION_KINDS)` et al.,
`apps/server/src/storage.ts:1901-1917`), so widening a tuple silently rewrites
historical migration 9 for fresh databases while existing databases keep the narrow
`CHECK` — the exact divergence the register's frozen-body rule exists to prevent
(`rfc/README.md:103-106`). This migration is what re-converges them: after it runs,
an upgraded database and a fresh one hold identical constraints, and the implementer
must also freeze migration 9's body to the literal value strings it shipped with,
recording that body edit in the register per the standing rule. The corresponding
check on migration 13 (adoption's, post-renumber) is already resolved in-wave: `adoption-wave-1` §2 pins its
`public_tokens` DDL to **literal CHECK strings**, never interpolated tuples, citing
this same lesson — the pattern does not recur.

**Widened request/response surfaces.** `POST /sessions` body gains `matchPlayers`
(`{ white?, black? }`, handles, at least one named; an unnamed seat must be bound to a
`session_join` token before play can start) — the closed key list at
`apps/server/src/rest.ts:827` widens. `parseSessionRoute`'s resource alternation gains
`match` and `links` (`apps/server/src/rest.ts:511`). The public `/shared/:token`
namespace is `adoption-wave-1`'s route, extended by scope dispatch (§3.5) plus this
RFC's `POST /shared/:token/join`; the unauthenticated carve-out remains a single
literal path-prefix match in front of the cookie gate that can reach no run or
session handler — the property that keeps "anonymous" from ever meaning "anonymous
write," and doubly binding now that a second scope shares the namespace.

**New error codes** — `MATCH_LIVE` (409) and `MATCH_MAINLINE_LOCKED` (409) — added in
**both** places or they fail quietly as 500s: the closed union
(`apps/server/src/errors.ts:1-46`) and the status map whose unlisted codes fall
through (`apps/server/src/rest.ts:389-479`, fall-through at `:478`). Token failures
add no code: the `/shared` namespace answers with the uniform 404-as-unknown-path that
`adoption-wave-1` §2 pins. Every new code is observed through a real request in
acceptance, per the platform RFC's A8 discipline.

**Client.** `AppRoute` gains the `/shared/:token` join page beside the existing
dynamic routes (`apps/web/src/lib/router.ts:11`, `:36`, `:66-70`) — shared with
`adoption-wave-1`'s card page by scope, one route entry; the `/live` index gains the
wall (§3.6); the drill screen's session rail gains the match states — your move /
their move / paused (with propose-accept controls for players and the pause control
for a non-playing host) / rehearsing — and the resume control. No new window-level key
listeners (`docs/app-shell.md:140-157`).

**Deployment.** Everything here is engine-free; every acceptance test runs under
`ENGINE_MODE: mock`, preserving the light-profile obligation
(`rfc/archive/live-session-platform.md` §3.14).

## Deviations from design

1. **The friend-link extends the wave's already-drafted amendment of a docs-tier
   limit.** `docs/live-sessions.md` records the shipped read-only story-token limit;
   `rfc/archive/adoption-wave-1.md` §2 supplies that
   `story_read` scope, and this RFC adds the `session_join` scope on the same pinned
   trust surface. `design/03-product-breadth.md:90-91` names shareable run URLs as
   platform primitives, gate B8 holds the share-link clause open
   (`planning/exploration/gates.md:134`), and the owner ledgered both consuming rows
   (`design/BACKLOG.md:200`, `:210`) — this is the different-threat-model contract the
   platform RFC said the limit was waiting on
   (`rfc/archive/live-session-platform.md` §2.6). `docs/live-sessions.md`'s limit
   paragraph is rewritten to describe both scopes (A9).
2. **`design/03-product-breadth.md:79-91` does not name human-vs-human match play as a
   live surface.** It is added by owner ledger ruling (`design/BACKLOG.md:211`), which
   names the exact mechanism this RFC specifies. No `design/` edit is made by this RFC;
   the proposed row updates are listed for the owner below.

None otherwise.

## Acceptance criteria

**A1 — Two real browser contexts play a match; the coach spectates.** A new
`tests/browser/match.spec.ts` following the multi-context pattern proven at
`tests/browser/drill.spec.ts:613-645`, `retries` unset, mock engine mode. Coach C
registers, creates a position run and a native match session seating players A and B
(auto-granted `participant`). A (white to move) claims and plays; B's board shows the
ply within 4 s; B claims and replies. Asserted refusals: A's claim while it is B's move
is `BOARD_HELD` (409, observed status); C's claim while live is `BOARD_HELD`; a move
body carrying `actor` is `INVALID_REQUEST`. C's `/live` wall shows the board block —
FEN advancing, side to move, both handles — from a single `GET /sessions` poll, and C
opens the session page and the run read-only.

**A2 — Pause, rehearse, resume, in the same test.** A proposes a pause; B's rail shows
the proposal; A's own `accept_pause` is `INVALID_REQUEST`; B accepts. While paused: a
commit at the mainline tip is `MATCH_MAINLINE_LOCKED`; A rewinds two plies and plays an
alternative — the shipped auto-fork creates a rehearsal branch; `reveal` succeeds
(refused with `MATCH_LIVE` before the pause — asserted, as are `duplicate` and `flip`
while live: the derived-run escape of §3.3 is closed by observed 409s, and both succeed
during the pause); compare over mainline and rehearsal returns rows. B resumes: a `run.rewound` event repositions the cursor to the
mainline tip, the rehearsal branch is still in the branch rail, play continues with the
seat gate back in force, and the next `move.committed` re-closes staged delivery
(`feedbackDeliveryOpen` false — server-asserted).

**A3 — Friend-link seats a new human.** Session created with white seated and black
bound to a single-use `session_join` token. A fresh browser context (no prior account)
opens `/shared/<token>`, registers through the shipped form, redeems, and is seated as
black with a `participant` grant; the journal records `member.joined` with the token
id; the second redemption attempt is the uniform 404. A token minted with
`invitedHandle` refuses a different authenticated redeemer with the same 404.

**A4 — The join page leaks nothing and the trust surface stays single.** The anonymous
`GET /shared/<token>` for a `session_join` token renders title, host handle, and the
form only — no FEN, move, or evidence in the response body — and is `no-store`.
Server tests: revoked, expired, exhausted, unknown, and scope-mismatched tokens return
the byte-identical 404 body; no `/shared` route can reach any run or session mutation
handler (asserted by dispatch, not by convention); exactly one token table exists
(`public_tokens` — a schema assertion that `share_tokens` or any second token table
does not, honoring the wave pin); an `adoption-wave-1` `story_read` row created before
this migration still resolves and renders its card afterward.

**A5 — Attribution under alternation.** A server test drives an alternating match
through the service layer and asserts `deriveMoveAuthorship` attributes every ply to
its player, including the boundary pair around each alternation (the `runSeq < S`
strict-inequality pair), plies before the session to the run owner, and — after
deleting one player's account — that player's plies to the null-actor journal entry per
the shipped deletion rule, with live claims subsequently refused and pause claims
allowed.

**A6 — Concurrency and the third grantee.** Two simultaneous claims by the seated
player's two devices: one winner, one `LEASE_MOVED`. A third write-capable grantee
(coach) is `BOARD_HELD` live, may claim during a pause, and may `reclaim` at any time;
after reclaim the seated player claims back and play continues. `importLeg` against a
native match session is `INVALID_REQUEST`; a native-match operation against an
imported-Arena session likewise.

**A7 — Migration.** A fixture database at migration-13 state (this RFC's predecessor) containing live sessions,
journal entries, votes, Arena legs, and `story_read` tokens migrates to 14: every
pre-existing row survives byte-identical across the three table rebuilds;
`PRAGMA foreign_key_check` is empty; the rebuilt constraints equal a fresh database's
(asserted by comparing `sqlite_master` SQL for the rebuilt tables); old-vocabulary
journal rows still read. Migration 9's body is frozen to its shipped literals in the
same change.

**A8 — Nothing existing moves.** The full suite passes from the verified
430/73 baseline and browser 18-pass zero-retry baseline; the attempts pin (§3.7) is asserted — mainline `countable: false`,
rehearsal branches countable under their forkers — and a solo position run's attempts
are untouched. Every new error code returns its declared status through a real request.

**A9 — Docs.** `docs/live-sessions.md` gains the match mode, pause/rehearse/resume, the
reveal-under-pause rule, and rewrites the no-anonymous-token limit paragraph to
describe both token scopes and their posture; `docs/identity-and-authorization.md`
gains the token row (what a link can and cannot do); `docs/app-shell.md` gains
`/shared` and the wall. Each in the product's own voice, stating the streamer-limit
carryover (§3.3) plainly.

## Open questions

None.

## Proposed ledger and register rows (owner-tier; not implementer tasks)

- `design/BACKLOG.md:211` native match row: 💡 → 📜 scheduled against this RFC.
- `design/BACKLOG.md:210` friend-link row: 💡 → 📜 scheduled against this RFC; the
  token trust surface is `adoption-wave-1`'s per the standing pin, this RFC's
  `session_join` scope is the invite flow the row asks for.
- `planning/exploration/gates.md:134` B8: the share-link residual closes across the
  two wave drafts — read by `adoption-wave-1` A-criteria, join when this A3 passes.
- `rfc/README.md` (recorded in the same commit as this draft, honoring the existing
  pin rather than restating it): Active-table row for `social-match.md`; migration
  register row **14** (13→14, post-renumber) with the lands-behind-13 dependency and the
  renegotiate-if-13-releases note.

## Changelog

- 2026-08-14: created. Baseline 399/69 verified by suite run; all shipped-surface
  citations re-verified against the working tree.
- 2026-08-14: register reconciliation, same day. An earlier revision of this draft
  specified its own `share_tokens` table with `read` and `join` capabilities; the
  wave's register claims landed while it was being written, and the standing pin
  assigns the token table to `adoption-wave-1.md`. §3.5/§3.8 rewritten to widen
  `public_tokens` with the `session_join` scope instead of creating a second trust
  surface; migration claim settled at 15 behind the wave's 13 (reserved) and 14;
  the generic anonymous-read capability was dropped as already owned by
  `adoption-wave-1`'s `story_read`.
- 2026-08-14: adversarial review, same day, fixed in place. (1) **The derived-run
  escape closed**: `duplicate` (any grantee, `service.ts:1254-1266`) and the sibling's
  `flip` route each mint a caller-owned run on which the caller reveals at will — an
  in-product engine consult on the live position; both, plus `import`, added to the
  `MATCH_LIVE` refusal list, with `analysis`/`voice`/`schedule`/corpus explicitly left
  live because the delivery-window gates (`service.ts:1109,1137`; corpus's own §5)
  already withhold them; A2 asserts the new refusals. (2) Alternation latency budget
  stated honestly in §3.1.2 (≤ one poll interval + one claim round-trip per ply,
  bounded by A1's 4 s assertion, not measured) and the simultaneous-claim race pinned:
  the transaction serializes, the side-to-move player wins, every other claimant gets
  an honest `BOARD_HELD`. (3) §3.2 pause ops precondition-checked (`INVALID_REQUEST`
  out of state), proposals cleared on accept/withdraw/resume, disconnect-mid-pause
  stated under the lazy-transition doctrine. (4) §3.3's resumed-play claim upgraded
  from assertion to verified mechanism: staged results never become `evidence.attached`
  while delivery is closed, so the post-reveal log holds only pause-consented history.
  (5) §3.8's migration-14 pattern check resolved in-wave: `adoption-wave-1` §2 now pins
  literal CHECK strings. (6) `runtime-corpus-evidence` added to `Depends on:` per its
  shared-resource rule (append-only error union). (7) `design/BACKLOG.md` row cites
  corrected (+1 line drift: 210/211/200). Baseline note updated with the review-time
  tree state.
- 2026-08-14: implementation review against the post-wave tree. Corrected the
  migration recipe so SQLite pragmas are applied outside the transaction and
  unrelated child foreign keys survive the rename; corrected the stale 13→14
  register/baseline text; removed the nonexistent mutating run-import escape in
  favor of the actual `importLeg` guard; and refused slot-bearing spectator links.
