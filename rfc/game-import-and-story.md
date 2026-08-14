# RFC: Own-game import and the game story

- **Status:** implementing
- **Author:** claude (on the owner's 2026-08-14 BACKLOG rows)
- **Created:** 2026-08-14
- **Design refs:** `design/05-in-run-experience.md` §3a (backward detection), §3b-i
  (LLM-as-voice), §5a (pivotal moments without an author); `design/BACKLOG.md` rows
  "Own-game review — import one game into the rehearsal frame" and "Game story — a
  finished game as ~8 pivotal slides" (both owner-uttered 2026-08-14, written to compose
  into exactly this RFC); `design/research/teardown-taketaketake-desk.md` and
  `design/research/teardown-chess2story-desk.md` (market frame — the latter landed
  after first draft and repositioned §Summary/§Motivation, see Changelog)
- **Exploration gate:** opened by owner ruling 2026-08-12 (`rfc/README.md`); breadth
  sequencing ruling 2026-08-11; the two composing BACKLOG rows are owner statements, not
  GAP rows
- **Depends on:** `archive/branch-groups.md` (migration/run-schema landing order only — no
  behavioural dependency); `archive/live-session-platform.md` (the shipped PGN parser
  seam); `archive/adaptive-guidance.md` (B10 detectors and voice seam);
  `archive/shape-library.md` (B11 position player, shape firings);
  `archive/n-way-comparison.md` (evidence overlay, PGN export, deep analysis);
  `archive/return-and-progression.md` (progress projection this RFC excludes itself
  from); `archive/content-sourcing-foundation.md` (fetch politeness and licence-row
  precedent)
- **Parent / amends:** —
- **Supersedes / superseded by:** —
- **Planning:** `planning/game-import-and-story/` (once implementing)

## Summary

One finished game, imported by explicit choice — pasted PGN or a lichess game URL —
becomes an ordinary Tabiya run: both players' moves as actor plies, the learner's
declared side, full branch/rewind/compare/export machinery underneath. Post-game, the
shipped backward ladder (B10 retrospective pivots, phase bands, pivotal markers, B9/B11
structural naming, the outcome) derives an ordered set of grounded MOMENTS; the client
renders them as slides (~8 is presentation, not contract). Every slide is tappable:
rewind *there*, fork a live branch, replay against human-like resistance with
structural reading available, compare against the game's actual continuation, and
export game + branches as one PGN. The review IS the rehearsal entry — the
anti-version of the engine-review screen. Market evidence sharpened 2026-08-14
(`design/research/teardown-chesscom-platform-desk.md` §2): Chess.com's Game Review —
the mainstream incumbent — offers **no play re-entry at all**: its only in-review
interaction is a one-ply guess-the-move "Retry", unlimited use of which is
Diamond-gated at $119.99/yr. The platform monetizes mistake re-entry without ever
letting you play the position out, and that is its dominant public complaint. This
RFC's tap-a-moment-and-play-on is the direct answer.
The differentiator is pinned to the door
into play, not to having a story: Chess2Story already ships clickable moment cards
that jump a live synced board (`design/research/teardown-chess2story-desk.md` §3),
and Take Take Take ships a read-only, LLM-confabulated share card
(`design/research/teardown-taketaketake-desk.md` §2c, §5). Nobody ships the next
step: tapping a moment forks a live branch against a human-like opponent, plays the
consequence, compares it with what actually happened, and exports both together.
Their moment is read or clicked-to-view; ours is re-entered and played.

## Motivation

### The boundary, already pinned — restated here and honoured throughout

Rejected forever (AGENTS.md §Rejected; ADR-0003 in `archive/brief-v2/`):
mine-games→detect-weaknesses→generate-lessons as product identity or mandatory entry;
account-level fetch-all-my-games; LLM-generated strategic lessons. **This RFC is: one
game, imported by choice, as an entry context.** There is no account linking for
import, no stored credentials, no background fetching, no game-history mining, no
weakness model, and no generated lesson. The importer operates only on the learner's
explicit per-game request, against public data. Nothing in this RFC is an entry
requirement for any other surface; the product works identically if it is never used.

### Why now

- Everything the story needs shipped this week: retrospective evaluation pivots, phase
  classification, and pivotal markers (`docs/adaptive-guidance.md`, B10, implemented
  2026-08-14); structural naming and the pack-free position player
  (`docs/shape-library.md`, B11); PGN export with variations and the recorded-evidence
  comparison overlay (`docs/branch-runtime.md`, `docs/n-way-comparison.md`).
- A PGN import seam already ships in production code: the Arena leg importer
  (`apps/server/src/live-session.ts:166-181`) parses, validates, and replays a
  mainline-only PGN into run nodes with correct actor stamping.
- The market validation is fresh, and the fan shelf is crowded: a $9M,
  Carlsen-cofounded competitor bet its identity on "every game has a story" and
  shipped it as a read-only card narrated by an LLM that was publicly caught
  confabulating on launch day (`design/research/teardown-taketaketake-desk.md` §2,
  §3, §7); Chess2Story ships the story surface *well* — engine-selected turning
  points, machine-verified scores with cited provenance and a published methodology,
  moment cards that jump a live synced board — and still implements zero loop stages:
  no opponent object exists anywhere in that product
  (`design/research/teardown-chess2story-desk.md` §2, §3, §6). Two consequences bind
  this RFC. First, "grounded vs freestyle" distinguishes us only from Take Take
  Take; Chess2Story's selection and provenance discipline is real, so the honest
  contrast with them is **read vs replay**, plus grounding that extends into
  strategic explanation (`docs/explanation-grounds.md` discipline) where theirs
  stops at score and selection (teardown §9). Second, the unclaimed substance is
  exactly one atom — a moment that opens back into play: moment → position →
  human-like opponent → your move → consequence → rewind → compare against the
  game's actual continuation → export game + branches. That door is this RFC's
  contract, and the adoption posture is explicit: adopt the slide rail freely,
  differentiate on the loop — the door into play IS the loop.

Out of scope: multi-game import of any kind; chess.com server-side fetch (§2c —
paste-only, verified); ingesting third-party engine annotations as evidence;
story-card image rendering (data contract only, §8); variant chess; review workflows.

## Specification

### 1. Imported session identity — run schema 0.10

`RunSessionKind` (`packages/runtime/src/types.ts:36`) widens from
`"pack" | "position"` to `"pack" | "position" | "imported"`.

An imported run is a non-pack session. The shipped projection rules
(`packages/runtime/src/events.ts:76-91`) already branch on
`isPack = sessionKind === "pack"`, so an imported run inherits the non-pack
obligations with **no projection-rule rewrite**: `packId`/`packDigest` null,
`feedbackPolicy` must be `attempt_end`, `opponentPolicy.mode` must not be
`theory_strict`, `start.fen` must equal the root node's FEN (`events.ts:92-94`).
`feedback.revealed` validity is keyed on `feedbackPolicy === "attempt_end"`
(`packages/runtime/src/runtime.ts:241`), so reveal works for imported runs without
runtime change; its docs sentence "valid only for a position run" is restated as
"valid only for an `attempt_end` run". Two call sites test the literal `"position"`
instead of "not pack" and get a named edit — the "slots in with zero rewrites" claim
is false without them: `authoredFeedback`
(`apps/server/src/service.ts:718`) returns the empty page for
`sessionKind === "position"` and would otherwise fall through to a non-null-asserted
pack lookup and crash with a 500 on `GET /runs/:id/authored-feedback` for an
imported run — the branch becomes non-pack; and `parseSummary`
(`apps/server/src/storage.ts:370`) validates the stored summary literal and must
accept `"imported"`.

`SessionSource` (`packages/runtime/src/session.ts:12-19`) gains a third variant:

```ts
{
  kind: "imported";
  start: RunStart;                       // canonical root FEN + declared learner side
  movetextDigest: string;                // sha256:… over canonicalizeJson({rootFen, uci: [...]})
  feedbackPolicy: "attempt_end";
  opponentPolicy: PositionOpponentPolicy; // governs post-fork live play only
}
```

`digestSessionSource` (`session.ts:87-94`) is unchanged; the `movetextDigest` member
gives every imported game its own session identity, resolving the F2 collision this
RFC would otherwise create: without it, every imported standard game would share the
position digest of "startpos + side + policy" and merge in every digest-keyed surface.
The digest input is canonical: the canonical root FEN (`canonicalRunStart`,
`session.ts:44-49`) plus the full UCI list in game order, canonicalized by
`canonicalizeJson`. `CreateRunSession` (`session.ts:21-35`) and the create-input arm
of `sessionSource()` (`session.ts:55-85`) gain the matching `imported` variant —
without them an imported create input falls into the position arm and reproduces the
exact collision this member exists to prevent. The import endpoint computes the
digest from the parsed moves and passes it in the create input; a bare `DrillRun`
does not carry it (it lives in the session identity and the import record, §3), so
the `DrillRun` arm of `sessionSource()` throws for imported runs — its only
production-adjacent caller, `duplicate` (`apps/server/src/service.ts:855-864`),
builds its request inline via `isPackSession` and therefore duplicates an imported
run as an ordinary **position** run at the import's root: the explicit front door
into progress-land (§6's semantics at ply 0), not a second imported identity.
Unchanged code, stated so nobody "fixes" it. Re-importing the same game with the
same side and policy reproduces the same `sessionDigest` — correct grouping
identity; run ids stay unique, so re-import is allowed and creates a distinct run.

Wire schema: `schemas/drill_run.schema.json` bumps to **0.10** — the two `sessionKind`
enums (lines 26 and 293) gain `"imported"`, plus an `if sessionKind == "imported"`
conditional mirroring the position conditional (null pack pair, `attempt_end`).
`DRILL_RUN_SCHEMA_VERSION` (`packages/schema/src/index.ts:1`) moves `"0.9"` (shipped
by `archive/branch-groups.md`) → `"0.10"`.

**Progress exclusion.** Imported runs never project attempts, mint no
`rootKey` (`apps/server/src/progress.ts:67-73`), and never appear in `/progress`,
`/progress/due`, or position statistics: a historical game is not an attempt at a
drill, and grouping every imported standard game under `imported||<startpos-key>`
would be dishonest statistics. They appear in `/runs` history with a title derived
from the source headers (`"White – Black (Result)"`, falling back to
`"Imported game"`). The road back into progress-land is explicit: creating a fresh
position run at a slide's FEN (§6) re-enters attempts/scheduling normally.

Storage touchpoints (no table change): the summary types
(`apps/server/src/storage.ts:71`, `:251`) already use `RunSessionKind` and widen
with the type; the one summary edit is the `parseSummary` literal check (`:370`,
named above). The progress-land row shapes stay literal `"pack" | "position"`
deliberately — `ScheduleRow` (`storage.ts:161`) and the attempt/schedule row casts
(`:1047`, `:1321`) describe rows imported runs never mint (see Progress exclusion),
so widening them would encode a shape that cannot occur. Assistance projection input
(`packages/runtime/src/assistance.ts:17`) widens with `RunSessionKind`;
`permittedAssistance` does not branch on session kind at all, so imported runs take
the position-run assistance rules with no further change.

### 2. Sources: what is honestly fetchable

**(a) Pasted/uploaded PGN — always available, both platforms' escape hatch.** The
learner supplies the bytes; provenance records `pgn_paste`, licence row
`no-rights-asserted` with rationale "learner-supplied bytes" (the closed licence-row
encoding from `docs/content-sourcing.md` §Checks-and-legal).

**(b) Lichess game URL — server fetch, verified.** The endpoint is
`GET https://lichess.org/game/export/{gameId}` — verified against the lichess OpenAPI
specification (`lichess-org/api`, `doc/specs/tags/games/game-export-gameId.yaml`):
`operationId: gamePgn`, **`security: []`** (no authentication for public games),
`gameId` exactly 8 characters, `Accept: application/x-chess-pgn` for PGN, query
booleans `moves`/`tags`/`clocks`/`evals`/`opening`/`literate`. Ongoing games are
served delayed by 3 moves. Rate-limit contract (spec Introduction §Rate limiting):
one request at a time; on 429 wait at least one minute.

The importer fetches with `moves=true&tags=true&clocks=false&evals=false&opening=false&literate=false`:
Tabiya **refuses to ingest lichess's server evals** — evidence in this product carries
its own recorded engine identity (`docs/branch-runtime.md` §Run-model), and a bare
`[%eval]` comment has none.

URL normalization: accepted hosts `lichess.org`/`www.lichess.org`; the first path
segment must match `/^[A-Za-z0-9]{8}([A-Za-z0-9]{4})?$/` (the 12-character form is a
player-perspective id whose first 8 characters are the game id — the export path
constrains `gameId` to exactly 8, so the importer truncates to 8); trailing
`/white`/`/black` segments, query strings, and fragments are discarded. Any other
lichess path (`/study/…`, `/broadcast/…`, `/training/…`) is refused with
`IMPORT_SOURCE_UNSUPPORTED`.

Fetch operator rules (borrowing the sourcing-foundation politeness precedent,
`apps/server/src/sourcing/http.ts:25,36`): an identifying `User-Agent`; one fetch per
import request, serial per process; a 10-second timeout; **no retry loop** — the
sourcing client's own 60/120/240-second retry ladder (`http.ts:13,37-40`) is
batch-pipeline behaviour and is deliberately not reused for an interactive request:
429/5xx map to typed `IMPORT_SOURCE_UNAVAILABLE` (with `Retry-After` echoed when
present) and the learner may simply try again or paste the PGN; 404 maps to
`IMPORT_SOURCE_NOT_FOUND`. No credentials are ever attached; only public games are
reachable by construction. Licence row for the record: `no-rights-asserted` with
rationale naming the export URL and retrieval time (lichess distributes its bulk game
database under CC0, but this RFC does not claim that licence for the single-game
endpoint; the source URL is retained for attribution).

**(c) Chess.com — paste-only, and the RFC says so rather than promising a fetch.**
Verified against the published-data API documentation
(`chess.com/news/view/published-data-api`): game data is exposed **only** through
player-scoped aggregates — monthly archives
(`/pub/player/{user}/games/{YYYY}/{MM}` and `…/pgn`) and current-daily lists. There
is **no endpoint that resolves a game id or game URL to a game**, and a chess.com
game URL contains neither the username nor the month needed to locate its archive.
The known workaround (`chess.com/callback/live/game/{id}`) is undocumented, returns
an encrypted move list rather than PGN, and is described by its own users as unstable
with IP-ban risk (chess.stackexchange.com Q43281; `chess-web-api` issue #10 — the
wrapper library itself labels its callback method unofficial and unstable). Building
the product's import path on that would be a fabricated capability. **The chess.com
contract is therefore: download or copy the PGN from chess.com's own game UI and
paste it.** A pasted chess.com URL returns `IMPORT_SOURCE_UNSUPPORTED` with a message
saying exactly this, so the failure teaches the workflow.

### 3. The import endpoint — `POST /runs/import`

**Decision: a sibling endpoint, reusing the Arena parser seam as a shared routine —
not a reuse of the Arena route.** `POST /sessions/:id/legs/:n/pgn`
(`apps/server/src/rest.ts:797`, `live-session.ts:166-181`) imports into an *existing*
match-session run against an arena root, guarded by session roles and leg records.
Import creates a run. The contracts differ in everything but the middle: the
parse/validate/replay routine. That middle is extracted into one shared server module
(`pgn-import.ts`): chessops `parsePgn` (`live-session.ts:5`); exactly one game;
mainline only — any variation refused (`live-session.ts:171-172` precedent); ≤ 300
plies (`:175`); `startingPosition(game.headers)` so `SetUp`/`FEN` fragments import
from their true root (`:174`); per-ply `parseSan` + legality, then runtime
`commitMove` with `actor: sideToMove === start.side ? "user" : "system"` (`:179` —
the shipped import semantics: both players' moves are actor plies; **no
`opponent.move_selected` event or engine identity is fabricated**,
`docs/live-sessions.md` §Position-Arena). The Arena route is then refactored onto the
shared routine with byte-identical behaviour.

Request (closed record; unknown fields rejected with their JSON pointer, the
`parseCreateInput` convention at `rest.ts:253`):

```jsonc
{
  "id": "run-uuid",
  "side": "white" | "black",              // the learner's declaration; never inferred
  "opponentPolicy": { "mode": "human_common" | "strong_engine", "targetElo"?, "temperature"?, "topP"? },
  "policyConfig": { ... },                 // as POST /runs; records locus + engine ids
  "seed": 1234,
  "source": { "kind": "pgn", "pgn": "..." }
          | { "kind": "lichess", "url": "https://lichess.org/..." },
  "createdAt"?: "ISO-8601"
}
```

Authenticated; `x-writer-id` establishes the lease exactly as `POST /runs`
(`docs/branch-runtime.md` §REST). Body cap 64 KiB. Semantics:

1. Resolve source bytes (fetch for `lichess`, verbatim for `pgn`).
2. Parse and validate via the shared routine. Zero-move games are refused
   (`IMPORT_INVALID_PGN`: a game with no moves has no story). A `Variant` tag other
   than `"Standard"` (or `"From Position"`) is refused.
3. Build the `imported` session, compute `movetextDigest` and `sessionDigest`, and
   create the run via the existing `createRun` path (`service.ts:264-276` shape).
   A board-terminal starting FEN is refused by the runtime with
   `TERMINAL_START_POSITION` (`docs/branch-runtime.md` §Move-rewind-fork) — unchanged
   and correct: a finished position contains no decision to re-enter.
4. Replay every ply with runtime `commitMove` **directly** (the Arena precedent —
   *not* `service.move`, whose path enqueues one eval job per committed move,
   `apps/server/src/service.ts:325,350,1040-1062`).
5. If the final move creates mate or a runtime-provable draw, the same mutation emits
   `outcome.reached` (`packages/runtime/src/runtime.ts:345`) — no special casing.
6. Persist run + import record atomically (the `saveArenaImport` transaction
   precedent), then start the evidence pass (§4).
7. Respond `201 {run, importRecord, evidencePass: {jobs}}`.

Error taxonomy (all through the standard `{error:{code,message,reason?}}` envelope):
`IMPORT_INVALID_PGN` (parse failure, multi-game, variations, > 300 plies, zero moves,
illegal SAN with the offending token, unsupported variant, oversize) → 422;
`IMPORT_SOURCE_UNSUPPORTED` (non-lichess URL, non-game lichess path, chess.com URL) →
422; `IMPORT_SOURCE_NOT_FOUND` → 404; `IMPORT_SOURCE_UNAVAILABLE` (timeout/429/5xx)
→ 503; plus the existing `TERMINAL_START_POSITION` and duplicate-run-id 409.

**The "terminal on import" contract, stated honestly.** The game *happened*, but the
runtime only knows board-terminal truth. Three cases:

- **Board-terminal finish** (mate, stalemate, provable draw): `outcome.reached` is
  emitted at the leaf, **from the declared side's perspective** — `commitMove`
  computes `terminalOutcome(position, run.start.side)`
  (`packages/runtime/src/runtime.ts:340-345`), so the side declaration is the frame
  of the recorded win/loss/draw; play cannot continue from that node; disclosure
  opens (`packages/runtime/src/feedback.ts:3-17` — outcome discloses under every
  policy).
  Rewinding and replaying a terminal move creates a new node and a new outcome for
  it — shipped semantics, exactly what a slide tap wants.
- **Recorded-result finish** (resignation, agreement, flag: `Result` `1-0`/`0-1`/`½-½`
  with a non-terminal final board): **no outcome event is fabricated** — an
  `outcome.reached` at a non-terminal node fails replay by design
  (`docs/branch-runtime.md` §Events, v0.6). The result lives in the import record as
  a recorded fact, attributed to the PGN header. Play from the leaf remains legal and
  is a feature, honestly framed: "the game ended here by resignation — play on if you
  want to test the grind" is `05` §3a's recovery skill verbatim.
- **Unfinished** (`Result` `*`, including 3-move-delayed ongoing lichess games): the
  story renders without an outcome slide and says so.

The import record (new SQLite table `imported_games`, one row per imported run):
`run_id` (PK, FK), `source_kind` (`pgn_paste`|`lichess_url`), `source_url` (nullable),
`movetext_digest`, `headers_json` (all PGN tag pairs, verbatim), `result`
(`1-0`|`0-1`|`1/2-1/2`|`*`), `pgn` (original bytes, the `ArenaLeg.pgn` retention
precedent), `licence_note`, `imported_at`. Read back via `GET /runs/:id/import`
(any authorized reader). Account-deletion follows the pack-style tombstone precedent
(migration 10).

**Migration 12** (`STORAGE_VERSION` 11→12, behind `archive/branch-groups.md`'s migration 11):
creates `imported_games` + indexes, and stamps run-schema literals `"0.9"` → `"0.10"`
(frozen literals, no data rewrite; mandatory because reads filter on the current
run-schema version — the migration-11 precedent). Registered in `rfc/README.md` in
this RFC's commit. Pack schema is untouched at the shipped 0.12.

### 4. The evidence pass — batching decision and stated cost

An imported historical game needs recorded evaluations for backward pivots (`05` §3a:
backward is where eval swing is *permitted*) but has no live play to serve — so
per-move live evidence enqueueing is wrong twice: it is N sequential jobs racing user
interaction, and it frames a finished game as live assistance.

**Decision:** import replay enqueues **zero** per-move jobs (step 4 above bypasses
`#enqueueMoveEvidence`). After the run persists, the server enqueues **one `eval` job
per mainline node including the root** — N+1 jobs for an N-ply game — through the
existing evidence queue (`service.enqueueEvidence`, `apps/server/src/service.ts:486`)
at the standard evidence movetime.

**Stated cost** (`DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs = 100`,
`apps/server/src/strong-engine.ts:11`): a typical 80-ply game ≈ 81 × 100 ms ≈ **8.1 s
of shared-judge engine time**; the 300-ply cap bounds the worst case at ≈ 30.1 s.
Jobs run at the queue's existing concurrency on the shared Stockfish judge and debit
every other user of it; the response returns the job count so the client can render
honest progress. The pass is bounded and **idempotent-completing** (next paragraph):
re-reads enqueue only what is missing, so the steady-state cost is paid once per
node, and the worst case is bounded by the ply cap however often it is interrupted.

**Staged → durable, and the pruning boundary.** Results stage in the queue and become
durable `evidence.attached` events through the existing writer-applied path
(`POST /runs/:id/evidence`, `rest.ts:1088-1098`; `service.applyEvidence` gated by
`feedbackDeliveryOpen`, `service.ts:725,737`). Delivery semantics
(`packages/runtime/src/feedback.ts:20-28`): the import's `outcome.reached` — or, for
non-board-terminal games, the learner's first `POST /runs/:id/reveal` (the story
surface issues it on entry; the game is over, revealing is the point) — opens
delivery; disclosure, once open, is permanent; the next committed move closes
*new*-evidence delivery only, which is exactly the anti-contamination the live branch
needs. The active writer applies staged import-pass results through the shipped
`POST /runs/:id/evidence` path while delivery is open. The import record does not
persist a writer credential, and the server never impersonates either the importing
writer or a later lease holder. Read-only followers can observe progress but cannot
turn a read into a write.

The boundary that must be engineered around: `onRewound` cancels queued/running jobs
and drops staged results for nodes leaving the active path
(`apps/server/src/evidence-queue.ts:148-169`), and a slide tap IS a rewind. A tap
before the pass completes would destroy the later mainline's pending evals. The
client-side gate stands: the story payload carries `ready` and `pendingEvidence`;
**the client disables slide taps until `ready`**, rendering "evaluation pending"
absence rows meanwhile. But a client gate cannot be the whole answer, because three
interruptions it does not control can hit the pass: any lease-holding client can
rewind mid-pass (the ordinary run screen, which this RFC does not lock, or a second
device after a lease claim — spectators cannot, writes require the lease); the batch
can fail halfway; and the queue is process memory — staged results and the failure
list both evaporate on a server restart (`evidence-queue.ts:85` in-memory
`#failures`; staged maps), so "recorded-failed" is not a durable predicate and a
one-shot pass would wedge `ready` closed forever after a restart. Therefore the pass
is **idempotent-completing, not one-shot**: `ready` is recomputed on every story
read from durable state plus current-process failures — every mainline node either
carries an engine-validated `eval` among its durable `evidence.attached` events or
has a recorded failure from the current pass — and the story read re-enqueues
exactly the mainline nodes that have neither and no in-flight job. Re-enqueueing is
visible, never silent: the returned `pendingEvidence` count rises and `ready` stays
false while it happens. One mechanism covers all three interruptions — rewind
pruning, halfway failure, restart loss (a lost failure record merely re-runs that
node on the next read; convergence, not a wedge). Delivery gating is unchanged:
results stage until delivery is open (the import's `outcome.reached`, or the story
surface's reveal on entry), and the active writer's existing evidence loop applies
them durably. If a learner closes delivery mid-pass by moving on a live branch,
remaining results stay staged; re-reveal at the branch's attempt end reopens delivery
and application resumes.

Stated honestly against the ledger: this RFC is the **second consumer in one day**
to design around `onRewound`'s live-play pruning rules (`design/BACKLOG.md`
"Recurring sharp edge: rewind cancels pending evidence"; `branch-groups.md` is the
first). The mechanism above is complete for this RFC — nothing here waits on
anything — but it is also this RFC's vote on that row: by the ledger's own
criterion, a third consumer makes the fix structural (a batch evidence class exempt
from live-play pruning), and this section then collapses to a queue flag.

### 5. The story — grounded moments, detector-attributed

`GET /runs/:id/story` (any authorized reader; 409 `ASSISTANCE_WITHHELD` while the run
is undisclosed — cannot occur after the story surface's own reveal). The server
derives, never stores: like shape firings and pivotal markers, the story is a
projection of the run and its durable evidence, recomputed on read.

A new runtime projection `storyMoments(run, branchId, evidence)` composes shipped
detectors with two new recorded-evaluation conventions:

| Moment kind | Source | Status |
|---|---|---|
| `irreversibility`, `phase_change`, `option_collapse` | `pivotalMarkers` (`packages/runtime/src/pivotal.ts:71`), sentences via `renderPivotalMarker` (`:98`) | shipped |
| `human_divergence` | same projection — **abstains on the imported mainline** (it requires recorded `opponent.move_selected` mass, `pivotal.ts:59-69`, and imported plies deliberately have none); it can fire on rehearsal branches | shipped, honest absence |
| `eval_pivot` | **new**: consecutive recorded-eval deltas over durable engine-validated `eval` payloads on the branch path (the overlay's source, `docs/branch-runtime.md` §Compare), generalizing `retrospectivePivot` (`packages/runtime/src/adaptive.ts:5`) from single-largest to top-k | new arithmetic |
| `last_level` | **new**: for a recorded learner loss, the last mainline node whose learner-perspective recorded eval ≥ −100 cp | new arithmetic |
| `endgame_entry` | first node classified `endgame`, named by `endgameReading` (`packages/runtime/src/endgame.ts:21`) where the census matches | shipped |
| `shape_span` | `shapeFirings` first-node markers (`packages/runtime/src/shape-firing.ts:15`), catalogue-evaluated as for position runs | shipped |
| `outcome` | `outcome.reached` event, or the import record's recorded result, or honest absence for `*` | shipped + record |

`eval_pivot` convention (named in the payload, the phase-band precedent — "a product
convention, not chess truth"): scores clamp to ±1000 cp with `mateIn` mapped to the
±1000 rail; a pivot is a consecutive-node delta with |Δ| ≥ 150 cp; adjacent pivots
within 2 plies dedupe to the larger; top-k by |Δ|. Every sentence names its ground:
"the recorded evaluation moved −310 cp across this move (Stockfish <version>,
100 ms)". `last_level`'s sentence: "the last recorded moment within a pawn of level —
Tabiya's recorded-evaluation convention." Both are arithmetic over already-recorded,
disclosed evidence; neither is a live detector, neither grades a move, and law 8 is
untouched: no LLM chooses, ranks, or words a moment into existence.

Payload:

```jsonc
{
  "ready": true, "pendingEvidence": 0,
  "source": { "kind", "url"?, "headers", "result", "importedAt" },
  "outcome": { "kind": "board_terminal" | "recorded_result" | "unfinished", "result"? },
  "moments": [ { "nodeId", "entryNodeId", "ply", "san", "fen", "kinds": [...],
                 "sentences": [...],           // detector-attributed, deterministic
                 "evalBefore"?, "evalAfter"?,  // recorded values, engine identity included
                 "phase", "endgame"? } ],
  "rank": [ "nodeId", ... ]   // deterministic precedence, see below
}
```

`nodeId` is the position carrying the grounded fact. `entryNodeId` is the position
the learner can legally re-enter. They are equal except for a board-terminal outcome:
that slide remains grounded at the terminal node but enters at its non-terminal
parent. A terminal node is never presented as a playable door.

The server returns **all** moments plus a deterministic rank (precedence: outcome
always; then `eval_pivot` by |Δ| desc; `last_level`; `phase_change`;
`endgame_entry`; `irreversibility`; `shape_span`; `option_collapse`; ties by ply).
Slide count is presentation: the client takes the top ~8 by rank and re-sorts by ply
(owner: "a set of 8 slides… or whatever" — the BACKLOG row pins count as
presentation, not contract). "What changed after" on each slide is the recorded eval
trajectory and phase to the next moment — recorded values only.

**Voice.** The connective narrative is the B10 seam, unchanged in discipline:
`POST /runs/:id/voice` (`rest.ts:869-877`) gains a fourth scope `story`, whose
`EvidencePacket` (`apps/server/src/guidance.ts:29`) additionally carries the slide's
moment sentences. `voiceCheck` applies unchanged; a deployment with no provider
returns `VOICE_UNAVAILABLE` and the client shows the deterministic sentences —
byte-identical claims, personality is the only thing lost (`05` §3b-i). Output stays
ephemeral and is never a run event.

### 6. The tap — a slide is a door, not a caption

Tapping a slide issues the existing `POST /runs/:id/rewind` to the slide's
`entryNodeId`.
The learner's next committed move creates the implicit `alt-N` branch
(`branch.forked` then `move.committed`, `docs/branch-runtime.md`
§Move-rewind-fork) — or the client forks explicitly with a label derived from the
moment ("Replay: eval pivot at move 24"). From there it is a live position-run
branch, unmodified: opponent replies via the shipped selection flow under the run's
`opponentPolicy` (human-common Maia by default — selection requests are reconstructed
from persisted run identity exactly as for position runs, `docs/shape-library.md`
§Just-Play), per-move eval evidence enqueues normally through `service.move` and
stays staged behind the closed delivery window (no live assistance), structural
reading and markers follow position-run assistance rules, and the branch enters
compare/N-way against the original mainline — the learner's replay against the
game's actual continuation is precisely the product's one original claim.

"Make this moment a drill" is the existing machinery, not new surface: the client
offers `POST /runs` (`kind: "position"`, `start.fen` = slide FEN, chosen side/policy)
with `intent.derivedFromRunId` — re-entering progress-land through the front door.
This is the session-to-pack distillation tie-in the BACKLOG row names, at zero new
endpoint cost.

### 7. Export — the artifact worth sharing

`GET /runs/:id/pgn` already exports selected branches as one legal PGN with
variations, validating every path before serialization (`exportPgn`,
`packages/runtime/src/pgn.ts:74-108`). Two additions:

- `exportPgn` gains an optional `headerOverrides` map. For imported runs the server
  merges the import record's headers — original `White`, `Black`, `Result`, `Date`,
  and `Event`/`Site` (prefixed `SourceEvent`/`SourceSite`; `Site` stays
  `chess-tabiya` because the exported artifact is the rehearsal, not the original
  game) — over the defaults at `pgn.ts:55-72`, keeping `TabiyaRun`/`TabiyaSession`.
  `Result` is the original game's: the mainline is the game; branches are annotated
  variations (`Tabiya branch: <label>` starting comments, `pgn.ts:92-94`, shipped).
- The exported default selection for an imported run is all branches: **original game
  + rehearsal branches together** — the artifact a read-only share card cannot be.

**Story-card export is a data contract only**: the §5 story payload *is* the
contract — self-contained (FENs, sentences, recorded values, source attribution), so
any future renderer (image, link, feed) consumes `GET /runs/:id/story` without new
server surface. No image rendering ships in this RFC.

### 8. Client surfaces

The shell already reserves the route: `/review` is "stored run history; opening a row
returns to its live run context" (`docs/app-shell.md` route table;
`apps/web/src/lib/router.ts:23`). This RFC adds, within the shipped hand-rolled
router (AS-C5 — no routing dependency):

- **Import affordance on `/review`**: paste box / lichess URL field, side selection
  (client may preselect by matching a header name to the learner's handle —
  presentation only; the request's `side` is always explicit), resistance choice.
  Submits `POST /runs/import`, navigates to the story.
- **`/review/game/:runId`** — the story surface: source header strip, outcome frame,
  slide rail (top-~8 by rank, orderable by ply), per-slide board + attributed
  sentences + optional voice, evidence-pass progress until `ready`, tap-to-rehearse
  (navigates to `/play/run/:runId` after the rewind), export button. Non-imported
  runs at this route redirect to their run screen.
- The ordinary run screen (`/play/run/:id`) gains a "story" affordance when
  `sessionKind === "imported"`, so the board and the story stay one tap apart in
  both directions.

## Deviations from design

- **None from the invariants or the ladder.** Backward eval detection is exactly
  where `05` §3a permits it; the voice contract is §3b-i's, packet-bound with
  deterministic fallback; silence during the live branch is preserved (staged, not
  delivered).
- **One clarification of the composing BACKLOG row's phrase "terminal on import"**:
  the run is *historically* concluded (recorded result, import record) but only
  board-terminal finishes are runtime-terminal; resignations leave a playable leaf,
  deliberately (§3). The alternative — fabricating `outcome.reached` at a
  non-terminal node — fails replay by design and would be manufactured chess truth.
- **One honest narrowing**: the `human_divergence` detector abstains on imported
  mainlines (no recorded selections exist). `05` §3a lists it as a *forward*
  detector, so nothing promised backward is lost.

## Acceptance criteria

Baseline before this RFC: **389 tests / 67 files**, run schema **0.9**, pack schema
**0.12**, and `STORAGE_VERSION` **11**, verified 2026-08-14 after Branch Groups.
This RFC's migration 12 / run schema 0.10 land behind the implemented migration 11 /
run schema 0.9 register rows. All existing tests still pass after implementation.

1. **Parser seam**: the shared routine imports a real lichess-exported PGN and a real
   chess.com-exported PGN (fixtures committed); the Arena leg route behaves
   byte-identically through the refactor (existing live-session tests unchanged).
2. **Boundary conditions** (the killer class — one test each): multi-game PGN;
   PGN with variations; 301 plies; zero moves; illegal SAN (token named in the
   error); `Variant: Chess960`; `SetUp`/`FEN` fragment import from a mid-game root;
   board-terminal starting FEN → `TERMINAL_START_POSITION`; mate finish emits exactly
   one `outcome.reached` and the leaf refuses further play; resignation finish emits
   none and the leaf accepts a move; `Result: *`; result header disagreeing with the
   board (recorded, not "corrected"); re-import of the same game (same
   `sessionDigest`, distinct run); duplicate run id 409; oversized body; lichess URL
   forms (8-char, 12-char, `/black` suffix, fragment, study URL refused, chess.com
   URL refused with the paste message); fetch 404/429/timeout mapped to their codes;
   no `Authorization` header ever present on the outbound fetch (asserted against a
   stub).
3. **Identity and exclusion**: imported run replays cleanly through `readBackReplay`;
   projection rejects an imported session with non-null pack fields or non-
   `attempt_end` policy; no attempt row, schedule, or position statistic is created;
   `/runs` listing shows the derived title.
4. **Evidence pass**: an N-ply import enqueues exactly N+1 eval jobs and zero during
   replay; results become durable only while delivery is open; a rewind mid-pass
   cancels/prunes exactly the off-path jobs, and the next story read re-enqueues
   exactly the mainline nodes lacking a durable eval (asserted: no duplicate job for
   a node with one in flight); a simulated restart mid-pass (fresh queue, same
   storage) converges to `ready` across subsequent story reads; `ready` flips only
   when every mainline eval is durable or recorded-failed in the current pass, and
   `pendingEvidence` reflects re-enqueues visibly.
5. **Story**: deterministic across recomputation; every moment carries detector
   attribution and grounded sentences; `eval_pivot`/`last_level` arithmetic
   property-tested against hand-computed fixtures; `human_divergence` absent on the
   mainline; a board-terminal outcome keeps its fact `nodeId` but uses its
   non-terminal parent as `entryNodeId`; voice scope `story` falls back
   byte-identically without a provider; story endpoint withholds before disclosure.
6. **Export**: imported-run PGN round-trips through chessops; contains original
   headers, original `Result`, the full mainline, and a rehearsal branch as a
   variation with its `Tabiya branch:` comment.
7. **Browser test** (Playwright, the walkthrough this RFC exists for): paste a real
   PGN on `/review` → the story renders with ≥ 1 attributed slide and the source
   headers → wait for `ready` → tap a slide → the board opens at that node, rewound →
   play two learner moves against the configured opponent (two opponent replies
   arrive through the shipped selection flow) → export → the downloaded PGN contains
   the original mainline plus the new branch.
8. **Never shippable read-only** (the Chess2Story warning,
   `design/research/teardown-chess2story-desk.md` §9): the story surface must not
   exist in any merged state where moments cannot be entered — criterion 7's
   tap-to-rehearse path is v1-blocking, not a fast-follow. A build with the slide
   rail but without the door into play is Chess2Story's "coach review" rendering:
   an analytical walkthrough with a synced board, which is literally the named
   failure shape ("an engine review screen with a rewind button"). The Playwright
   test of criterion 7 is the enforcement: it lands in the same change as the story
   surface or the surface does not land.
9. **Registers and docs**: `rfc/README.md` Active row + migration-register row 12
   land with this draft (done in the same change); on implementation, canonical docs
   (`docs/` page + `docs/branch-runtime.md` session-kind note) and the register
   statuses update; landing order behind `archive/branch-groups.md` is honoured or
   renegotiated in the register.

## Open questions

None.

## Changelog

- 2026-08-14 (Codex implementation review): approved after four corrections. Rebased
  the landed dependency/baselines; separated grounded `nodeId` from playable
  `entryNodeId` so terminal outcome slides do not open a dead board; and retained the
  single-writer invariant by having only the active writer apply staged evidence.
  CI run 31797561925 was confirmed to be an older-SHA typecheck failure already fixed
  by commit `9db9183` on the current tree.
- 2026-08-14: created. Capabilities verified against the working tree (then 359/63
  test baseline; file:line citations throughout). Lichess single-game export verified
  against the lichess OpenAPI spec (`security: []`, 8-char id, PGN accept header).
  Chess.com verdict: paste-only — the published-data API is player/month-shaped with
  no game-id resolution, and the callback workaround is undocumented, non-PGN, and
  ban-risky, so it is refused rather than promised.
- 2026-08-14 (adversarial review, folded in): repositioned §Summary/§Motivation on
  `design/research/teardown-chess2story-desk.md` — the differentiator is the door
  into play, not "a walkable story" (moment cards with board sync are shipped by
  Chess2Story; "grounded vs freestyle" distinguishes only from Take Take Take);
  added acceptance criterion 8 (never shippable read-only). Corrected citations
  verified against code: projection rules are `events.ts:76-91` (not :41-58);
  `storage.ts:161` is `ScheduleRow`, not the summary type — touchpoint list
  rewritten with the true summary edit (`parseSummary` :370) and the missed
  `authoredFeedback` literal-`"position"` crash path (`service.ts:718`). Named the
  `CreateRunSession`/`sessionSource()` widening and pinned `duplicate()` behaviour
  for imported runs. Reworked the evidence pass from one-shot to
  idempotent-completing after verifying the queue's staged results and failure list
  are process memory (`evidence-queue.ts:85`) — a one-shot pass wedges `ready` on
  restart, and the client tap gate does not bind other lease-holding clients;
  recorded this RFC as the second vote on the BACKLOG "rewind cancels pending
  evidence" pattern row. Clarified that the sourcing client's 60/120/240 s retry
  ladder (`http.ts:13,37-40`) is deliberately not reused. Pinned the outcome
  perspective (`terminalOutcome(position, run.start.side)`, `runtime.ts:340-345`).
  Refreshed the baseline to 374/64 with siblings implementing in parallel and
  restated the landing order (12/0.10 behind 11/0.9). External claims re-verified
  against fetched sources: lichess `game-export-gameId.yaml` (operationId `gamePgn`,
  `security: []` absent auth, `gameId` min/max 8, `moves/tags/clocks/evals/opening/
  literate` booleans, 3-move delay on ongoing games) and the chess.com published-data
  API (player-scoped aggregates only; no game-id or game-URL resolution endpoint).
