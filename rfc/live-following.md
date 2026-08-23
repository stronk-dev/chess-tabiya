# RFC: live-following — Phase B, following a broadcast round in progress

- **Status:** draft — 2026-08-23
- **Author:** claude (coordinator), from `planning/live-sources/phase-b-derivation.md`
- **Created:** 2026-08-23
- **Design refs:** `design/03-product-breadth.md` Live surfaces (:81-83, :291);
  `design/05` §1 (*"the run is the sole source of chess truth"*) and §3-forms (the ∩
  algebra, via `intent-presets` §2); `design/05:41` (*"Absence is stated, never
  simulated"*)
- **Exploration gate:** the owner's verbatim commission ([[D947]] ⚖️, 2026-08-22:
  *"where is the stuff like retrieving LIVE games (current tournaments for example) so
  streamers can cast or anyone can analyse?"*). That commission's lane definition names
  **the source-game-still-live assistance lock (D411)** and **the streamer-cast /
  anyone-analyses compositions** explicitly, and Phase A discharged it by its own words
  only *"partially"*. The same gate admitted `rfc/live-sources.md`, accepted 2026-08-22.
  [[D1093]]'s drafting mandate does **not** enumerate this lane and is not relied on.
- **Depends on:** `rfc/live-sources.md` (accepted — Phase A's URL grammar, splitter,
  board picker, `sanitizeBroadcastPgn` and the [[D1048]] `[%clk]` extraction, all
  consumed unchanged); `rfc/intent-presets.md` (accepted, *implementing* — the ∩ algebra
  is this lock's home; **§3.4 states why this RFC does not depend on its implementation**);
  `rfc/longitudinal-store.md` (accepted — the `decision_class` grain, consumed not changed)
- **Parent / amends:** follow-up to `rfc/live-sources.md`; amends its four drifted line
  cites (§7.3). Amends nothing in `design/`.
- **Supersedes / superseded by:** —
- **Planning:** `planning/live-sources/`

```tabiya-claims
migration | position behind recorded-clocks | followed_sources; followed_source_pushes (new tables holding a growing broadcast game and its per-push audit; runs are immutable cuts taken from them and are not modified)
```

## Summary

Phase A makes a **finished** broadcast round importable. This RFC makes a round **in
progress** followable: the server tracks a live game as it grows, the learner takes
immutable **cuts** of it into ordinary runs, and — for as long as the source game is
still being played — an assistance lock closes every door through which our evidence
could reach a position two players are currently thinking about.

Three things carry the document. **A run cannot follow anything**: run identity is a
content digest over the complete mainline, written into event #1 and re-derived on every
projection with no writer (§2.2), so the followed game is a **separate growing record**
and a run is a snapshot cut from it — which is also what landed research already ruled
(*"the source moves; the run does not"*). **The live-lock is fail-closed and has two
arms**: a ceiling clamp *and* a server-side route refusal, because a clamp alone is
bypassable by an API caller (§3). And **casting is specified as a seam and not built**,
because it is blocked on an owner ruling (B5) that also selects this RFC's own follower
architecture (§5) — the one question that must be answered before implementation starts.

## Motivation

The owner's commission named live games first and casting in the same breath. Phase A
delivered the half that needs no liveness: a completed round, imported once. The half
that is actually *live* — following a game while it is played, and the lock that makes
doing so safe — is this document.

**Why the lock is the centre and not a footnote.** Broadcast organisers ship delays of
up to 3600 s, and Lichess a three-move stream delay, precisely to stop an audience
feeding information back to the board (`design/research/live-relay-as-drill-source.md`,
:128-131). A learner drilling a live position with `analysis` on is holding a Stockfish
evaluation of a position two grandmasters are currently thinking about. **That is not a
degraded feature or a privacy bug — it is an assistance device for cheating at an
ongoing tournament game, and under a cast it leaks to every viewer at once.** Every
ambiguity in this document therefore resolves *locked*, and the RFC says so once, here,
in those words.

**Out of scope, each with a named home:**

| out of scope | home |
|---|---|
| Casting: binding a followed run to a `stream` session and its overlay | **Discharge D1** — blocked on the owner's B5 ruling ([[D1212]]/[[D958]]). §5 specifies the seam so the binding is wiring when the ruling lands |
| A provisional evidence state (evidence that knows it describes an unfinished game) | **Discharge D2** — §4 refuses to evaluate live positions instead, which is the cheaper and more honest arm |
| Discovery and curation beyond a pasted URL and the round index | **Discharge D3** — Phase A already deferred it (`live-sources.md:279`); following raises the stakes and D3 records that |
| Organiser or relay operation of any kind | [[D709]]: we consume, we do not relay-operate. Refused, not deferred (§6) |
| Chat bridge, Twitch/YouTube/OAuth integration, editorial delay | B5's real work ([[D704]] measured all four absent). Refused for this RFC, fenced by criterion 12 |
| Rating a live-followed game | Refused by construction and asserted by criterion 11 (§7.2) |
| Tour- and group-level stream variants | **Discharge D3** with discovery |

## Specification

### §1 — The follower

#### §1.1 What the endpoint gives us, measured

| fact | value | grade |
|---|---|---|
| `GET /api/stream/broadcast/round/{id}.pgn` — chunked, held open, no auth for public rounds | — | `[V]` `live-relay-as-drill-source.md:75-105` |
| First burst | **0.24 s**, entire round (42,672 bytes, 26 games) | `[V]` `planning/live-sources/rfc-derivation.md:71-74` |
| Polling the plain endpoint | **4.57 s** for a 45-game round (220 KB) | `[V]` same, :68-79 |
| Update shape | **the entire current PGN of one game**, re-sent on every move, keyed by `[GameURL]` | `[V]` `live-relay-as-drill-source.md:75-83` |
| Rate policy | *"Only make one request at a time"*; 429 → wait one minute | `[V]` same, :107-115 |
| Organiser delay | `delay` 0–3600 s is a round-creation field — **an upstream-delayed feed is still a live game** | `[V]` same, :128-131 |

**An update is a whole-game snapshot, not a delta.** The follower diffs each push
against what it holds. This is why §1.3 exists and why §2 stores pushes.

#### §1.2 Architecture — an open question, not a default

**The RFC does not choose between a held stream and repeated one-shot fetches**, because
the choice is not the author's to make: the two evidence bases in this lane disagree,
and the owner's B5 ruling selects between them.

| evidence | says | citation |
|---|---|---|
| the d947 harness (executed 2026-08-22) | streaming beats polling decisively — 0.24 s vs 4.6 s | `planning/live-sources/rfc-derivation.md:68-79` |
| the landed dossier (2026-08-16) | *"**new, and avoidable — recommend avoiding it** … Two polite one-shot fetches — one at import, one when the learner returns — deliver the entire product value at zero architectural cost. **Take the stream only if a live spectator wall is later specified**"* | `live-relay-as-drill-source.md:530` |

**The dossier's own escape clause resolves it, and couples this decision to B5**: a cast
*is* a live spectator wall. So B5 option 1 (casting gated) ⇒ **two polite one-shot
fetches**, and B5 options 2 or 3 (casting in scope) ⇒ **held stream**. Open question 1
carries this; it is **acceptance-blocking**, and answering B5 before implementation
saves a rewrite of the fetch layer.

**A constraint that binds under either answer.** `import-source.ts` is request/response
only, serialised through a module-global `serial` promise chain (`import-source.ts:21`)
with a 10 s `AbortController` and 429/5xx → `IMPORT_SOURCE_UNAVAILABLE` + `retryAfter`.
**A held connection must not join that chain** — it serialises to one in-flight request,
so a held socket would block every import in the process for as long as it is open.

#### §1.3 Lifecycle

Normative under the held-stream answer; the one-shot answer keeps rows *open*, *update*
and *round end* and drops the rest.

| stage | behaviour | why |
|---|---|---|
| **open** | the first follower of round `R` opens the source; later followers of the same round **attach to it** | the rate policy is per-IP; N learners must not be N connections |
| **first burst** | full round indexed by `[GameURL]`; this index and Phase A's board-picker payload are **the same structure** — built once | reuse, not a parallel index |
| **update** | a whole-game push is routed by `[GameURL]` to followers of that board, diffed, and applied per §2.3 | pushes are per-game, so fan-out is per-board |
| **idle** | no followers → close after a grace period | a round with no audience must not hold a socket |
| **round end** | upstream `finished` **and** all boards terminal | this is the **only** release trigger (§3.3); the follower is the only thing that knows |
| **connection loss** | reconnect with backoff ≥ 1 min on 429; **the lock stays ON while disconnected** | fail-closed |
| **process restart** | followers are **not** durable state — re-derive from `followed_sources` rows still marked live | the record is the authority; no follower table |

#### §1.4 Prefix revision — measure before implementing

`[M]` **Unmeasured, and it must be measured before this RFC is accepted.** Because each
push is a whole-game PGN and relay operators transcribe over-the-board games by hand, a
push may plausibly *correct* an earlier ply rather than only extend it. The dossier
records no observation of corrections (grep-verified across the file), so this is
inference, not evidence.

**The instrument, one afternoon, same class as the shipped d947 harness:** hold
`/api/stream/broadcast/round/{id}.pgn` on a live round for 30–60 minutes, record every
push, diff each against the previous push of the same `[GameURL]`, and report how many
were pure suffix extensions, how many revised an earlier ply, and how many revised only
a header. §2.3 specifies behaviour for both outcomes so the RFC is not blocked on the
answer — but **criterion 3 is not satisfiable without it.**

### §2 — The followed source, and why a run cannot follow anything

#### §2.1 The object

A **followed source** is a growing record of one broadcast game. A **run** is an
immutable **cut** taken from it. The learner may take as many cuts as they like; each is
an ordinary imported run and behaves exactly like one.

```
followed_sources
  id                TEXT PRIMARY KEY
  round_id          TEXT NOT NULL          -- Lichess broadcast round
  game_url          TEXT NOT NULL          -- [GameURL]; the push routing key
  headers_json      TEXT NOT NULL          -- sanitized; seven STR tags + Elo
  movetext          TEXT NOT NULL          -- sanitized; current known mainline
  ply_count         INTEGER NOT NULL
  result            TEXT NOT NULL          -- '*' while unfinished
  source_live       INTEGER NOT NULL       -- 1 until §3.3's AND-release
  first_seen_at     TEXT NOT NULL
  last_push_at      TEXT NOT NULL
  UNIQUE (round_id, game_url)

followed_source_pushes
  source_id         TEXT NOT NULL REFERENCES followed_sources(id)
  seq               INTEGER NOT NULL
  received_at       TEXT NOT NULL
  ply_count         INTEGER NOT NULL
  revision          TEXT NOT NULL          -- 'extend' | 'revise' | 'header' | 'noop'
  PRIMARY KEY (source_id, seq)
```

Both tables are `STRICT`. `followed_source_pushes` is the audit trail §1.4's measurement
needs in production and the evidence for criterion 3; it stores no movetext, only the
shape of each push.

#### §2.2 Why a run cannot grow — five measured constraints

| # | constraint | evidence |
|---|---|---|
| **C1** | **Run identity is content-addressed over the complete mainline and is sealed.** `movetextDigest` is computed once over `{rootFen, uci[]}`, placed in the imported `SessionSource`, hashed into `run.sessionDigest`, written into the **`run.started` event**, and **re-derived from `events[0].data` on every projection** — with **no writer**. `projectRun` refuses a second `run.started`; `appendEvents` re-projects rather than rewrites; `read()` replays the stored snapshot and throws *"Stored run snapshot failed replay"* on mismatch | `[V]` `events.ts:377` (verified: `sessionDigest: started.data.sessionDigest`); `session.ts:113-120`; `runtime.ts:209`; `events.ts:183-184`, `:389-397`; `storage.ts:1718-1729` |
| **C2** | `sessionDigest` is stamped into artifacts that **outlive the run**: the opponent-selection `policyConfigDigest`, the `TabiyaSession` PGN export header, and a distilled pack's provenance string | `[V]` `rest.ts:1357`; `pgn.ts:69`; `distill.ts:95` |
| **C3** | `imported_games` is **INSERT-only** — one INSERT, two DELETEs, **no `UPDATE imported_games` anywhere in the repo**; `run_id` is the PRIMARY KEY so a re-import cannot insert a second row; and `account-data.ts:417` asserts a **closed `exactKeys` set** over the record's eight fields, which fails on any column addition not made in lockstep | `[V]` `storage.ts:1747-1753`, `:2104`, `:2163` |
| **C4** | **Rewind, branch and compare are prefix-stable and tolerate growth.** Rewind is a cursor move; **no node is ever deleted**. `branchPath` derives a branch head per call. `branch.forkNodeId` pins a fork permanently — **a fork taken at ply 25 stays at ply 25 even if the mainline later reaches ply 60**, which is exactly the semantics a followed game wants. Compare recomputes per call | `[V]` `runtime.ts:386-419`; `branch-path.ts:21-41`; `runtime.ts:107`; `compare.ts:230-241` |
| **C5** | **Landed research already ruled on this**: *"the snapshot must be a copy, not a live reference. **A run that follows a broadcast would break the invariant outright and must never be built.** The source moves; the run does not"* | `[V]` `live-relay-as-drill-source.md:389-397` |

**C4 is the useful correction and C1 is the decisive one.** Rewind, branch and compare
are not the obstacle — **identity is**. Growing a run means rewriting event #1, which the
event log structurally cannot do.

**Append-to-run is refused, not deferred**, on C5. It is recorded here so no future
reader re-opens it as an option.

**Re-import-per-update** is the acceptable fallback if the owner wants Phase B in one
sprint: it complies with C5 and reuses the shipped `run_derivations` linkage
(`storage.ts:1933-1945`), at the cost of **stranding learner branches** — a fork taken at
ply 30 belongs to a run that is superseded when ply 31 arrives. Open question 2 carries
the choice; the followed-source object is specified as normative because it is the only
option satisfying C1, C2 and C5 together and the only one needing **no run-schema lane**.

#### §2.3 Applying a push

```
onPush(source, pgn):
  sanitized := sanitizeBroadcastPgn(pgn)              -- Phase A §3, unchanged, EVERY push
  if residue(sanitized) then
      record push as 'noop'; mark source contaminated; DO NOT store movetext
      surface the contamination; DO NOT silently drop the follower
  classify := diff(sanitized.movetext, source.movetext)
      'extend'  -> stored movetext is a strict prefix of the push
      'revise'  -> they diverge before min(len) ................ §1.4's open case
      'header'  -> movetext equal, headers differ (result corrections)
      'noop'    -> byte-identical
  append a followed_source_pushes row with `revision`
  if 'extend' or 'header' then update followed_sources in place
  if 'revise' then §2.4
  re-evaluate liveness (§3.3); NEVER release before sanitizing (§3.5)
```

**Sanitization runs per push, not once.** Every push is a full PGN, so Phase A's
fail-closed `BROADCAST_ANNOTATION_RESIDUE` guarantee must hold N times. A mid-stream
residue must be surfaced, not swallowed — a follower that dies quietly on contamination
is worse than one that refuses loudly.

#### §2.4 Revision

A `'revise'` push means the upstream operator corrected a ply the learner may already
have cut a run from. The run is immutable and stays correct as *what we were told at the
time*; the **source** is what changed.

Normative: mark the source revised, store the new movetext, and **flag every cut taken
at or after the divergence ply as superseded** (a read-time projection over
`followed_source_pushes`, not a mutation of any run). A superseded cut renders with its
divergence stated. **Absence and divergence are stated, never simulated** (`design/05:41`).

If §1.4's measurement finds revision does not occur in practice, this section becomes a
guard that never fires — which is the correct cost. If it finds revision is common, the
measurement will also tell us whether divergences cluster at the tip (cheap) or reach
deep (expensive), and that number belongs in the criterion before acceptance.

#### §2.5 Cuts

A cut is `importGame` with the source's current sanitized PGN, unchanged. The
**shipped precedent to copy for un-repeatability** is `importLeg`
(`live-session.ts:237-251`): a root-FEN equality gate, a fork into a labelled branch, a
commit loop identical in shape to `importGame`'s, and **two independent idempotence
guards** — an in-memory throw and a SQL `WHERE … AND branch_id IS NULL` with
`if (changed.changes !== 1) throw`. Copy the two-guard pattern rather than inventing one.

**Move-0 follows are free under this design.** A followed source with zero moves is a
legal record; only the *cut* needs a move, and `requireMoves: true` already enforces that
at the import boundary. Under re-import-per-update it would need a `requireMoves`
exception and a zero-node run instead.

### §3 — The live-lock ([[D411]])

#### §3.1 The obligation

> **Assistance must be lockable on "the source game is still live."** A learner drilling
> a position from an in-progress broadcast could otherwise read our evidence rungs while
> the real game is still being played — which is why organisers ship delays of up to
> 3600 s and Lichess a 3-move stream delay.
>
> — [[D411]], `design/BACKLOG.md`

#### §3.2 Where it lives: a dynamic ceiling bit, not a ninth context

`intent-presets` §2 quotes `design/05:230-232` byte-exactly:

> **Effective assistance is `requested preset ∩ workflow/session ceiling ∩ honesty/access
> ∩ source availability` — every term only narrows.**

The live-lock is the **second term**, and *"can only remove, never add"* is exactly a
lock's semantics. `AssistanceContext` gains **`sourceGameLive: boolean`** beside
`seatedInContest` (verified shape: `{ sessionKind, workflowContext, deliveryOpen, role,
seatedInContest, reviewing }`, `assistance.ts:22-30`).

**It must not be a ninth `WorkflowContextId`.** `assertPresetFoundation` hard-asserts the
grid arithmetic, throwing `CONTEXT_PRESET_INVALID` unless the admitted/refused pair counts
are exactly **28 and 12** (verified at `presets.ts:92`). A ninth context makes the grid
5×9 = 45 and **throws at module load, in client and server both**. It is also the wrong
shape: liveness is session state that *releases*, whereas `deriveWorkflowContext` is a
pure function of `sessionKind`/`feedbackPolicy`/`liveKind` — none of which can know
whether a real game is running.

#### §3.3 Release is AND, and every unknown is locked

**The rule: the lock is ON unless we have positive evidence the game is over.**

| trigger | lock | rationale |
|---|---|---|
| source created from a round flagged `ongoing` | **ON** | default |
| board `Result` is `*` | **ON** | the parser coerces anything non-terminal to `"*"` |
| board terminal **AND** round `finished` | **OFF** | both arms |
| board terminal, round still `ongoing` | **ON** | the *round* is the delay unit — a finished board in a live round still leaks (shared prep, pairings, a teammate still playing) |
| follower connection lost | **ON** | fail-closed |
| server restart, liveness unknown | **ON** until re-derived | fail-closed |
| a Phase A manual import of a broadcast board | **ON** unless the round is verifiably finished | Phase A ships no liveness check at all |

**AND, not OR.** An earlier derivation proposed *"both, OR-ed safe-side"*; OR is the
**unsafe** direction, releasing as soon as *either* arm reports finished. This RFC
corrects that.

**What release does, precisely:** `sourceGameLive` flips false and the ceiling term stops
clamping, restoring the `imported` context's shipped ceiling — `quiet`, `guided`,
`theory_only`, `analysis`, module ceiling everything except `blunder_prevention`
(`presets.ts:44`). **Nothing more. The lock never grants**; releasing it merely stops it
narrowing, which is what *"every term only narrows"* requires.

#### §3.4 Two arms, and no dependency on [[D971]]

**A config clamp alone is bypassable by an API caller.** The repo already accepts this:
`#refuseWhileMatchLive` throws `MATCH_LIVE: "Pause the match before rehearsing or
revealing"` (`service.ts:2061-2067`) — a server-side refusal on the route, for exactly
this class of problem. **`SOURCE_GAME_LIVE` is its sibling**, beside `MATCH_LIVE` in
`errors.ts`. Cite the precedent; do not reinvent it.

| arm | what it does |
|---|---|
| **clamp** | `permittedAssistance` returns `locked_off` for `humanSplit`/`corpus` and `"sight"` for `boardLighting`/`arrows` while `sourceGameLive` |
| **refusal** | the four doors of §3.5 throw `SOURCE_GAME_LIVE` server-side |

**This RFC does not depend on [[D971]], and the point is worth stating because the
dependency looks real.** `intent-presets` is *implementing* and D971 blocks *"the exact
config projections and clamps, compiler, preset pill, and footer"*. But
`permittedAssistance`'s body **already clamps without any `configClamp`**:
`seatedInContest` locks `humanSplit`/`corpus` to `locked_off` and clamps
`boardLighting`/`arrows` to `"sight"` inline (verified, `assistance.ts:31-34`).
`sourceGameLive` clamps the same way, in the same body, and migrates into the clamp table
when D971 lands. **Coupling the owner's #1 lane to an unrelated blocked amendment would
be a choice, not a constraint.**

Note also that `permittedAssistance` currently **ignores both `sessionKind` and
`workflowContext`** — two declared-and-unread fields, not the one [[D411]]'s row
predicted. This RFC adds a field that *is* read, and does not fix the other two.

#### §3.5 The four doors

| door | code at HEAD | why the lock must close it |
|---|---|---|
| **the evidence pass** | `importGame` calls `#ensureStoryEvidence` **unconditionally** (`service.ts:857`), enqueuing a Stockfish `eval` for **every mainline node** — and the pass is **idempotent-completing**, re-walking `branchPath` on every story read and enqueuing anything lacking a durable eval | the primary leak, and it **auto-enqueues as a live game grows**. The dossier saw it: *"Running fifty engine jobs over a game still being played is both wasteful and… the wrong instinct. A live root should enter play directly, not through a story"* |
| **`story()`** | for an imported run the mainline story needs **no outcome at all**, only `feedbackDisclosed(run)` — and for `attempt_end` that is satisfied by a single `feedback.revealed` event | **one user click**, and nothing in the path knows about the source game |
| **branch comparison** | `compare.ts:218-313`, recomputed per call | a live board's *comparison* leaks as much as its evaluation |
| **export / public tokens** | `pgn.ts:69`; `PublicTokenRecord` scope `story_read` | a token minted over a live run **outlives the session** |

#### §3.6 Sanitize, then release

`[V]` Ongoing rounds carry `[%clk]` but **no `[%eval]`** — Lichess analyses once the game
ends. So third-party-verdict pressure is **lowest while live and highest at the exact
instant the game finishes**, which is the instant the lock releases. **The strip and the
release fire together, and the order is normative: sanitize, then release.**

### §4 — Law 8: a live evaluation is provisional, and nothing here can say so

`[V]` `grep -rn "provisional"` over `packages/runtime/src` and `apps/server/src` returns
**only `rating.ts`**. The evidence layer has **no provisional state**: an eval of an
in-progress position attaches as `evidence.attached` with `source: "engine_validated"`,
durably, **indistinguishable from an eval of a finished game**.

**Normative: while `sourceGameLive`, no engine evaluation of any node of that source is
computed, attached or rendered.** Not computed-and-hidden — *not computed*. This falls
out of §3.5's first door, matches the dossier's *"a live root should enter play directly,
not through a story"*, and keeps `design/05:41`'s *"Absence is stated, never simulated"*
true: we state that evidence is withheld because the game is live, which is a fact about
the source, not a claim about the position.

The alternative — a provisional evidence state carried through the manifest, the store
and every renderer — is a much larger change and is **Discharge D2**, not this RFC.

### §5 — The casting seam, specified and not built

`design/03-product-breadth.md:81-83` promises: *"the streamer owns the live board; chat
votes on plans or moves; the host snapshots, rewinds, branches, compares, and exposes an
overlay."* [[D705]] ruled that casting is *"explicit workflow compositions, not new
evidence modes"* — and that ruling still holds.

**But "a composition, not a new evidence mode" was being read as "free", and it is not.**
Two defects made a cast of a live game a law-8 violation reachable with no new code:
`POST /runs/:id/moves` could extend an imported mainline, and the overlay mounted a
**write-capable** controller whose opponent guard covered `match` only — so a `stream`
cast would ask Maia for a move and commit it on behalf of a grandmaster who had not moved
yet.

**Both are fixed at HEAD** (`0f04a2d`), verified rather than assumed:
`#refuseImportedMainlineExtension` refuses at the imported mainline tip in `move()` and
`opponentPly()`, the overlay resumes through a `projectionOnly` controller that ignores a
writer lease and requests no opponent selection, and `docs/live-sessions.md` is corrected
to say so.

**What this RFC still owes on top, because the two guards are on a different axis.**
Codex's guard is about **mainline immutability**; [[D411]] is about **liveness**. They are
orthogonal: a *cut* of a live source is a perfectly ordinary imported run whose mainline
is complete-as-known, so `#refuseImportedMainlineExtension` permits rehearsal branches on
it — correctly — while saying nothing about whether the source game is still being
played. `sourceGameLive` does not exist anywhere at HEAD (`grep` → **0 matches**). The
whole of §3 is still owed.

**What the B5 ruling unlocks.** B5's machinery shipped 2026-08-13, but its revival
conditions bar further investment until a streamer audience exists. The question:
*casting-over-a-followed-run is a composition over already-shipped machinery — does it
count as new B5 investment (gated), or as Phase B wiring (ungated)?*

| ruling | unlocks | and selects |
|---|---|---|
| **gated** | nothing here; Phase B ships solo and is fully useful | **two polite one-shot fetches** (§1.2) |
| **ungated as wiring** (recommended) | binding a followed run to the **existing** `stream` session and the **existing** `/live/overlay/:runId`, with no new stream-side surface | **the held stream** |
| **casting leads** | Phase B is sequenced around the cast, discovery included | held stream, plus B5's real backlog |

Under the recommended ruling the binding is genuinely wiring — the overlay, the
vote/marks relay and the re-entry paths all ship — **fenced** by criterion 12 so it cannot
silently become option 3.

**One inherited question the owner must rule on, not this RFC.** `docs/live-sessions.md`
records an accepted limitation: *"A streamer cannot be forced to play blind while their
audience sees more evidence… it does not pretend to prevent a host from cheating on
themselves."* Cheating on yourself is fine in rehearsal. **The board here is a game two
grandmasters are still playing.** Open question 4.

### §6 — Refusals

| refusal | reason |
|---|---|
| A run may not follow a source | C1/C5 — structurally impossible and already ruled |
| No engine evaluation of a live source | §4 — law 8; we cannot state a provisional claim |
| No relay operation of any kind | [[D709]] — we consume, we do not operate |
| No new stream-side surface, chat bridge, OAuth integration or editorial delay | B5's real work; fenced by criterion 12 |
| A live-followed game is never rated | §7.2, criterion 11 |
| The lock never grants | §3.3 — every term only narrows |

### §7 — Seams

#### §7.1 `longitudinal-store`

A followed game's decisions are **`decision_class = 'game'`**, on the store's own §4.2
rule: in an imported run a user-actor node is `game` *iff it lies on the primary branch at
a ply within the source mainline*. A followed source is still a human playing a real game;
**liveness is a property of the source, not of the decision class**.

**But that rule's boundary is `importedMainlinePlies`, defined against an immutable
record.** For a cut, the boundary is the cut's own ply count, frozen at cut time — which
is what makes cuts the right object. Stated normatively here so the growing source never
moves a boundary that a stored run depends on.

Honest note: the store is accepted and **entirely unimplemented** — `decision_class` has
zero code hits. This seam is paper consuming paper, and criterion 10 asserts the
derivation rule rather than a running column.

#### §7.2 `learner-rating`

**A live-followed game cannot rate, by construction.** The only producer of a
`rated_games` row hardcodes `kind: "position"`; imported runs have no path to one, and
`projectAttempts` returns empty for them. Criterion 11 asserts it anyway with a
non-vacuous negative control ([[D444]]).

#### §7.3 Phase A citation repair

Four of Phase A's cites no longer resolve, **including the `tabiya-claims` cite codex
implements against**. Repairing them is this RFC's obligation (Discharge D4).

| claim | cited | actual at HEAD |
|---|---|---|
| `imported_games.source_kind` CHECK — cited **four times** | `storage.ts:3356` | **`storage.ts:4388`** |
| `pgn: source.pgn` retained verbatim | `service.ts:555` | **`service.ts:846`** |
| `importGame` span | `service.ts:497-568` | **`service.ts:787-858`** |
| `AssistanceContext` shape | `assistance.ts:21-27` | **`assistance.ts:22-30`** |

**Convention adopted here and recommended to the lane:** inside `service.ts` and
`storage.ts` — 2,300 and 4,400 lines, edited by every landing lane — cite by **symbol name
plus a quoted fragment**, never by line alone.

#### §7.4 `recorded-clocks`

`recorded-clocks` (draft) claims `imported_games.clocks` at *position behind
live-sources*. **A growing game has growing clocks.** Normative for this RFC: clock
readings live on the **followed source**, and a cut copies the readings for its own plies
— so `imported_games.clocks` stays write-once and the two lanes do not collide. Recorded
in both documents (Discharge D5).

#### §7.5 `play-composition`

`play-composition` **never mentions** `/live/overlay/:runId`; its ~20 `overlay`
occurrences all mean the layout primitive. The live overlay imports nothing from the
geometry authority and hand-rolls its CSS. So *"the overlay is a projection of run state,
not a new screen"* is the **intended** contract, not the shipped one. This RFC does not
resolve it — casting will need either an explicit extension of `play-composition`'s scope
or its own composition contract (Discharge D1).

### §8 — Registers

| resource | value | evidence |
|---|---|---|
| migration position | **behind `recorded-clocks`** — seventh in the queue (`learner-rating` → `longitudinal-store` → `bot-policy` → `campaign-core` → `live-sources` → `recorded-clocks` → here) | `rfc/README.md` Live claims |
| storage version | **26** at landing (`STORAGE_VERSION = 25`) | `storage.ts:631` |
| run-schema lane | **none** — the followed-source object needs no run-schema change. This is a further argument for it: re-import-per-update also needs none, but append-to-run would need lane 0.20 **and a redefinition of accepted digest semantics** | §2.2 |
| pack-schema lane | **none** | — |

**Gate F clause 1 is unaffected**: this RFC claims no pack-schema lane, so the clause's
lane depth does not move.

## Deviations from design

**One.** `design/03-product-breadth.md:87-89` still reads *"…two-leg position matches,
**team relays**, and later native matchmaking…"* with no external-relay distinction —
the [[D412]] clause. Phase A recorded it as an owner-owned discharge and it remains
undischarged; this RFC inherits it and **does not write the design doc** (law 5). Proposed
through the ledger, not amended here.

## Acceptance criteria

1. **The followed source grows and no run changes.** A fixture drives three pushes at 20, 24 and 28 plies; the source's `ply_count` advances; a cut taken after push 1 has a byte-identical `sessionDigest`, `movetextDigest` and node count after pushes 2 and 3. *Fails if any run field moves.*
2. **Append-to-run is impossible, demonstrated not asserted.** A test attempting to extend a cut's mainline via the event log fails at `projectRun`/`read()` replay. *A wrong implementation that "works" here has broken C1.*
3. **Push classification is exhaustive over measured data.** Against the §1.4 harness recording, every push classifies as exactly one of `extend`/`revise`/`header`/`noop`, and the counts match the recording's own tally. **Not satisfiable before §1.4 runs** — this criterion is the reason it must.
4. **Revision supersedes cuts at or after the divergence ply, and only those.** A synthetic revise-at-ply-18 push marks a ply-20 cut superseded and leaves a ply-12 cut untouched.
5. **Sanitization runs per push and fails closed.** A push carrying `[%eval]` or a `??` glyph produces a `noop` row, stores no movetext, and surfaces contamination. *Negative control: the follower must not silently continue.*
6. **The lock is ON by default and AND-releases.** Six-row table over (`board terminal` × `round finished` × `connection state`): the only OFF cell is terminal ∧ finished ∧ connected. *A wrong implementation that OR-releases fails four cells.*
7. **All four doors refuse.** With `sourceGameLive`, each of the evidence pass, `story()`, branch comparison and public-token minting throws `SOURCE_GAME_LIVE` **at the API boundary**, asserted by request, not by inspecting markup.
8. **No engine job is enqueued for a live source.** A followed source at 40 plies enqueues **zero** eval jobs; the queue is asserted empty. *This is §4's whole content and the criterion that would catch its violation.*
9. **Sanitize precedes release.** On the finishing push, the order of operations is asserted: sanitized movetext stored, *then* `source_live` cleared.
10. **`decision_class` derivation.** A cut's user-actor nodes within its own frozen ply count derive `'game'`; nodes beyond it derive `'played'`. Asserted against the derivation rule.
11. **A live-followed game never rates.** Attempting to create a rated game from a cut is refused, with a **non-vacuous negative control**: the same call on a `position` run succeeds.
12. **The casting fence holds.** A grep assertion (the pattern Phase A criterion 10 already uses) that no stream-side surface, chat-bridge, OAuth or editorial-delay symbol is introduced by this RFC's implementation.
13. **Phase A's four cites resolve.** Each corrected citation in §7.3 points at the named symbol at HEAD, asserted by a fixture that greps the symbol rather than the line.
14. **The follower does not join the import queue.** With a follower open, an unrelated `resolveImportSource` call completes within its normal bound. *Fails if the follower joined the module-global `serial` chain.*

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Casting: bind a followed run to the existing `stream` session and overlay, including the `play-composition` scope question (§7.5) and the self-cheating limitation (§5) — blocked on the B5 ruling ([[D1212]]) | OWNER | the B5 ruling's landing commit | |
| D2 | A provisional evidence state, if §4's outright refusal of live evaluation is ever judged too strong | claude | `planning/live-sources/` | |
| D3 | Discovery and curation beyond a pasted URL and the round index; tour- and group-level stream variants | claude | `planning/live-sources/` | |
| D4 | Phase A's four drifted citations (§7.3) corrected in `rfc/live-sources.md` before codex implements against them | claude | this RFC's landing commit | |
| D5 | `imported_games.clocks` coordination with `recorded-clocks` (§7.4) — one agreed sentence in each document | claude | `planning/live-sources/` | |

## Open questions

1. **⚖️ ACCEPTANCE-BLOCKING — the B5 ruling** (§5). Gated / ungated-as-wiring / casting-leads. **It also selects §1.2's follower architecture**, so answering it before implementation saves a rewrite of the fetch layer. Recommendation: ungated-as-wiring, fenced by criterion 12.
2. **⚖️ ACCEPTANCE-BLOCKING — the growth model** (§2.2). The followed-source object is specified as normative; re-import-per-update is the fallback; append-to-run is refused on C5. Owner-level because the followed-source object makes a **product statement**: *a followed game and a run are different objects.*
3. **⚠ Is upstream prefix revision real?** (§1.4). Unmeasured. Criterion 3 is not satisfiable until the 30–60 minute stream-diff harness runs. **Measure before acceptance.**
4. **⚖️ Does the accepted self-cheating limitation survive a live source?** (§5). Permitting a streamer to cheat on themselves is fine in rehearsal; the board here is a game two grandmasters are still playing. The owner's to rule, not to inherit silently.

## Ledger rows

Proposed; id assigned at landing (head was **D1213** at drafting).

- **proposed** — 💡 the followed-source object as a distinct persistence class: a growing source, immutable cuts, and the read-time supersede projection. Records the product statement open question 2 asks the owner to make.
- **proposed** — 🐞 `permittedAssistance` ignores **both** `sessionKind` and `workflowContext` (`assistance.ts:31-34`) — two declared-and-unread fields, not the one [[D411]]'s row predicted. This RFC adds a field that is read and fixes neither; the residue belongs to `intent-presets`/[[D971]].
- **proposed** — 📊 the evidence layer has **no provisional state** (`grep -rn "provisional"` → `rating.ts` only), which is why §4 refuses live evaluation outright rather than computing and hiding it.

## Changelog

- 2026-08-23: created, from `planning/live-sources/phase-b-derivation.md`. Growth model specified as the followed-source object on five measured constraints; the D411 lock pinned as a dynamic ceiling bit with two arms and an AND-release; casting specified as a seam and left to the B5 ruling; §5 verified against `0f04a2d` rather than re-specifying two defects codex had already fixed.
