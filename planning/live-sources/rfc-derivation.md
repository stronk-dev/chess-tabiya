# `live-sources` RFC derivation — retrieving LIVE games (D947)

- **Status:** derivation dossier, 2026-08-22 — the pre-RFC evidence pin for the
  owner-commissioned live-sources lane (`design/BACKLOG.md` D947, verbatim commission:
  *"where is the stuff like retrieving LIVE games (current tournaments for example) so
  streamers can cast or anyone can analyse?"*).
- **Instrument:** `tools/d947-broadcast-roundtrip-harness/` (disposable, D414/D947),
  whose executed record is `roundtrip-output.md` and whose provenance/latency table is
  its `README.md`. Everything in §1 is measured there, on real tournament PGN fetched
  2026-08-22, not inferred.
- **Prior research base:** `design/research/live-relay-as-drill-source.md` (2026-08-16,
  the D410–D414 source dossier) — cited below where its `[V]`/`[P]` findings carry.
- **Scope of this document:** what the RFC author needs pinned — harness results, the
  ledger family, the code seams at HEAD, the casting composition, the provider
  boundary, and the numbered gaps. It proposes nothing; it removes excuses.

---

## 1. Harness results — the D414 answer

D414's charge was exact: *"Parse-compatibility with real broadcast PGN rests on shape
inspection, not execution."* Executed 2026-08-22:

**Headline: all 20 real broadcast games parsed through `parsePgnMainline` — 10/10 from
a finished round, 10/10 from a round fetched mid-play.** Fixtures: Campeonato de
España 2026 round 5 (`QxNfeqHA`, finished, trimmed 45→10 games) and Sants Open 2026
Group A round 2 (`wDTQF08K`, ongoing at fetch, trimmed 26→10). Per-game record:
`tools/d947-broadcast-roundtrip-harness/roundtrip-output.md`.

Measured behaviors, each from the harness run:

1. **Multi-game round files are refused whole.** Both fixtures →
   `PgnImportError: "PGN must contain exactly one game"` (`pgn-import.ts:26`). The
   round endpoint always returns every board in one body, so a broadcast consumer
   must split on game boundaries before calling the parser. No splitter exists at
   HEAD (§3).
2. **D410 annotations neither crash nor survive the parse.** The finished fixture
   carried 972 `[%eval]`, 902 `[%clk]` and 59 literate verdicts
   (`Blunder./Mistake./Inaccuracy. … was best`) inline in comments. chessops parses
   them as comments; `parsePgnMainline`'s mainline extraction returns only
   `{ rootFen, headers, result, moves[{san,uci}] }` (`pgn-import.ts:7-12`) — the
   serialized parse result contains **zero** occurrences of `%eval`, `%clk`, or
   verdict text (asserted in the harness). Third-party grades are **dropped, not
   stripped-with-assertion**: nothing tests for their absence downstream, and §3
   shows a path where the raw text still enters storage.
3. **Literate comments do not smuggle variations.** Lichess keeps the "Rf8 was best"
   line inside the comment text; zero fixture games had `(...)` variations in
   movetext, so the `pgn-import.ts:28-31` variation refusal never fired. (This is an
   observed property of current Lichess broadcast output, not a guarantee.)
4. **Ongoing games parse with `[Result "*"]` and a partial mainline.** 9 of 10
   ongoing-fixture games returned `result: "*"` with 23–37 plies intact. Ongoing
   broadcast PGN has `[%clk]` but **no `[%eval]`** — evals appear once Lichess
   analyses, so contamination pressure is highest on *finished* rounds.
5. **The one `requireMoves` trap:** a not-yet-started board (headers, no movetext) is
   refused by the `importGame` configuration (`requireMoves: true` →
   `"PGN must contain at least one move"`, `pgn-import.ts:38-40`) and accepted by the
   bare parser. A live round can contain such boards.
6. **Broadcast headers pass through verbatim** into `parsed.headers`:
   `BroadcastName`, `BroadcastURL`, `GameURL`, `WhiteFideId`/`BlackFideId`,
   hierarchical `Round` (`"2.1"`), per-round `Event`. Provenance is free; so is
   anything else upstream writes there.
7. **Existing caps are compatible but relevant:** longest fixture game 211 plies
   (cap: 300, `pgn-import.ts:37`); `[Variant "Standard"]` on every game (guard:
   `pgn-import.ts:32-35`); a full annotated round (220,266 bytes) exceeds the 64 KiB
   `importGame` body cap (`service.ts:504-505`) but a single game (~5 KB annotated)
   does not — per-game import fits, per-round import would need the cap revisited.

**Latency** (harness README, sequential requests): index `GET /api/broadcast` — TTFB
0.14–0.17 s, total 1.12–1.18 s; finished round PGN (45 games, 220 KB) — TTFB 0.14 s,
**total 4.57 s** (byte-identical across 3 samples; the body streams out slowly);
ongoing round (26 games, 42 KB) — 2.77 s. The streaming variant
`GET /api/stream/broadcast/round/{id}.pgn` answered in 0.24 s and delivered **the full
round (42,672 bytes, all 26 games) in its first burst**, then held open — matching its
documented contract (*"first sends all games of a broadcast round in PGN format"*,
then re-sends a game's full PGN on each update; *"the best way to get updates about an
ongoing tournament"* — Lichess API docs, quoted at
`design/research/live-relay-as-drill-source.md:81-89`, which also records that polling
the plain endpoint *"would be slow, and very inefficient"*). Tour- and group-level
stream variants exist (`/api/stream/broadcast/tour|group/{id}.pgn`, dossier `[P]`).

**So: yes, we can ingest real broadcast PGN today** — one game at a time, after
splitting, with annotations silently shed by the parser — and the open work is
everything *around* the parse: sourcing, splitting, stripping-with-assertion, run
growth, and the assistance lock.

---

## 2. The ledger family this RFC discharges

All quoted from `design/BACKLOG.md` (load-bearing halves; ids searchable):

- **D410** 🐞: *"Imported broadcast feeds carry third-party move grades, and nothing
  asserts we strip them. […] another product's verdict on a move, entering our corpus
  as authored-looking text. […] `import-source.ts:73` already sets
  `evals=false&literate=false` — but that is reliance on an upstream default we do not
  control, with no test. Propose an assertion, not a hope."*
- **D411** 💡: *"Assistance must be lockable on 'the source game is still live.' A
  learner drilling a position from an in-progress broadcast could otherwise read our
  evidence rungs while the real game is still being played — which is why organisers
  ship delays of up to 3600 s and Lichess a 3-move stream delay. This would be the
  first consumer of `permittedAssistance`'s declared-and-unread `sessionKind`."*
- **D412** 💡: *"Disambiguate the parked events row: team relays ≠ external
  tournament relay. Two independent agents have now derived from scratch that the
  events row's 'team relays' means a roster-with-calendar, and that live broadcast
  import is a different object entirely."*
- **D413** 💡: *"`docs/game-import-and-story.md`'s chess.com refusal is
  better-founded than its own sentence claims. […] now verified as the general case
  […] nothing live or in-progress is publicly exposed, four probes 404, and their
  terms prohibit the use anyway."*
- **D414** 💡: *"No broadcast has been round-tripped through `pgn-import.ts`."* —
  **discharged by §1**; the RFC cites the harness record rather than re-running it.
- **D704** 📊: *"Streamer truth is composed safely; provider integration and
  editorial delay are separate absences. The overlay consumes only shared run/session
  state, states withholding, attributes adapter tallies and exposes 2–8 options; it
  has no evidence/provider query. There is no Twitch/YouTube/OAuth bridge and no
  Tabiya editorial audience delay—two-second polling is transport."*
- **D705** 💡: *"Coach and streamer need explicit workflow compositions, not new
  evidence modes. Stream can bind the existing overlay/vote/marks projection."*
- **D709** 💡: *"The costed 1.0 human-play boundary is hybrid. Preserve native
  private rehearsal matches; delegate rated/clocked/public opponent play to an
  optional chess-network adapter (Lichess first); automatically return attributed
  games to the originating run/Review path; refuse native public pools, human
  tournaments and anti-cheat operations in 1.0."*
- **D710** 📊: *"The official Lichess API already exposes the expensive public-play
  substrate. […] Rebuilding those primitives natively is not required to close
  Tabiya's learning loop; exact provider identity and return are."*
- **D947** ⚖️ is the commission itself (lane = *"Lichess broadcast-round ingestion,
  third-party-grade stripping at the import boundary (D410), the source-game-still-
  live assistance lock (D411), relay-vs-team-events split (D412), and the
  streamer-cast / anyone-analyses compositions over the existing overlay projection
  (D705)"*), and **D948** 🐞 records that D412/D704/D709 had escaped all routing —
  their routing *"rides the D947 derivation landing"*, i.e. this document is where
  those three rows re-enter a plan.

---

## 3. The import/run seams at HEAD

**The parser** — `apps/server/src/pgn-import.ts` exports exactly three symbols:
`ParsedPgnMainline`, `PgnImportError`, and
`parsePgnMainline(pgn, { requireMoves? })`. Guards, in order: exactly one game (:26),
no variations (:28-31), `Variant` ∈ {Standard, From Position} (:32-35), ≤300 plies
(:37), `requireMoves` (:38-40), per-move SAN legality with UCI re-encoding (:49-56).
Result coerces anything non-terminal to `"*"` (:57-60). Two production callers:
`service.ts:508` (`importGame`) and `live-session.ts:241` (`importLeg`, Arena PGN
legs).

**How an imported game becomes a run** — `TabiyaService.importGame`
(`service.ts:497-568`): `resolveImportSource` → 64 KiB cap → `parsePgnMainline(pgn,
{requireMoves: true})` → `movetextDigest` over `{rootFen, uci[]}` → session
`{ kind: "imported", feedbackPolicy: "attempt_end", opponentPolicy }` → `createRun` +
replay via `commitMove` with `actor` = `"user"` for the chosen side, `"system"` for
the other (:535-539) → `ImportedGameRecord` frozen with **`pgn: source.pgn` retained
verbatim** (:555) plus headers/result/licenceNote → `createImportedRun` → a story
evidence pass is enqueued (:566). The run is one-shot: nothing at HEAD re-opens an
imported run to append moves as the source game progresses.

**The source boundary** — `apps/server/src/import-source.ts`: `ImportSource` is a
closed two-kind union, `"pgn"` (paste) | `"lichess"` (single-game URL) (:3-5), plus
`resolveStudySource` for studies. The Lichess game-export URL pins
`moves=true&tags=true&clocks=false&evals=false&opening=false&literate=false` (:73) —
the D410 "upstream default we do not control". Fetches are serialized module-wide
(:21, :68), 10 s timeout, `429/5xx` → typed `IMPORT_SOURCE_UNAVAILABLE` with
`retryAfter` passthrough (:79-83). **Absent at HEAD, stated explicitly: the string
`broadcast` appears nowhere in `apps/`, `packages/`, or `workers/` code — no broadcast
endpoint, no round splitter, no `"broadcast"` source kind, no follower/poller, and no
`sourceGameLive`/live-lock symbol exists** (verified by grep, 2026-08-22).

**Where the moves land longitudinally** — the accepted `rfc/longitudinal-store.md`
puts **`decision_class` (played / game / predicted)** in the primary key (:170, :181)
precisely so that *"the historic player's moves, the learner's rehearsal and their
predictions"* never pool into *"one habit denominator"* (:3). Its imported-run
acceptance case asserts *"source-mainline rows with `decision_class='game'` and
forked-branch rows with `decision_class='played'`"* (:662-663). A broadcast board is
the same shape: the GM's moves are `'game'`, the learner's forks `'played'` — **the
grain the store already reserved is exactly the grain live sources need; no schema
change is implied.**

**Where third-party-grade stripping would live (D410):** the parse already drops
comments from the *moves*, but `importGame` stores the raw annotated PGN in
`ImportedGameRecord.pgn` (:555) and `importRecord()` serves it back (:570-578). For a
broadcast source, that verbatim retention would carry Lichess's Stockfish verdicts
(*"Blunder. Rf8 was best."*) into our storage as authored-looking text — the
law-8-adjacent trap D410 names. The natural seam is a new
`resolveBroadcastSource(...)` beside `resolveImportSource`, which splits the round,
selects the board, **strips comments before the bytes enter the record**, and ships
the D410 assertion as a test: no `%eval`/verdict text in anything stored or rendered.
(Prior measurement: comment-stripping cut a round 43,593 → 11,870 bytes and 8 → 0
`%eval`, D410 row; the harness confirms the annotation density on a real finished
round at 972 `%eval` per 10 games.)

**Where the D411 live-lock lives:** `AssistanceContext` at HEAD is
`{ sessionKind, deliveryOpen, role, seatedInContest, reviewing }`
(`packages/runtime/src/assistance.ts:21-27`) and `permittedAssistance`'s body still
reads everything except `sessionKind` (:29-33) — D411's "declared-and-unread" defect,
whose mechanism-level fix is the accepted-but-unimplemented `intent-presets` §3.1
(`deriveWorkflowContext`, one runtime symbol for client and server). Against
`intent-presets` §2's four ∩ terms — quoted verbatim from `design/05:230-232`:
*"Effective assistance is `requested preset ∩ workflow/session ceiling ∩
honesty/access ∩ source availability` — every term only narrows"* — **the
live-source lock is the second term, the workflow/session ceiling**: *"a workflow or
session ceiling can only remove assistance, never add it"* is exactly a lock's
semantics, and D947's commission names it a ceiling. One nuance the RFC must resolve
rather than blur: the ceiling term's shipped carrier (`ContextContract` per
`WorkflowContextId`, intent-presets §3) is **static per context**, while
source-game-still-live is **dynamic session state** that releases when the real game
ends — structurally a sibling of `seatedInContest` (which today locks
`humanSplit`/`corpus` and clamps lighting/arrows to `"sight"`, `assistance.ts:29-33`).
The clean shape is a dynamic bit (e.g. `sourceGameLive`) entering
`AssistanceContext` and applied *as part of the ceiling term's clamp*, not a new
`WorkflowContextId` — intent-presets' seven contexts (`assistance-preference.ts:4`
plus `academy`) have no `broadcast` member and should not need one (gap 10).

---

## 4. The casting composition — streamers cast, anyone analyses

**The promise** — `design/03-product-breadth.md:81-83`: *"**Streamer/Twitch:** the
streamer owns the live board; chat votes on plans or moves; the host snapshots,
rewinds, branches, compares, and exposes an overlay. Viewers do not need full
synchronized clients."*

**The ruling shape** — D705: compositions, **not new evidence modes**. The stream
surface already exists as one of `LIVE_SESSION_KINDS = ["stream", "academy", "match"]`
(`packages/runtime/src/types.ts:38`), with its own assistance profile: `"stream"` is
one of the six shipped `ASSISTANCE_PROFILES` and `assistanceProfile()` routes
`liveKind === "stream"` to it (`apps/web/src/lib/assistance-preference.ts:4-12`).
Under accepted `intent-presets` §3, the `stream` context's ceiling admits `quiet /
guided / theory_only / analysis` — the owner ruling that a streamer *"may cheat on
themselves"* (`design/05:435-437`) is already encoded there.

**What the overlay consumes today** — the chrome-free `/live/overlay/:runId`
(`docs/live-sessions.md:104-108`): *"Session and overlay tallies poll every two
seconds. The overlay uses the same run projection and feedback barrier as the player;
it is not a second evidence surface."* D704's measured conformance (re-asserted by
`tools/r15-r16-professional-workflow-harness/conformance.test.ts:58-74`) pins it:
overlay reads `session.runState` + `activeLiveDetail` only, issues **no**
evidence/provider query, states withholding explicitly, and attributes relayed votes.

**Therefore the casting path needs no new evidence machinery:** host imports a
broadcast board as an `imported` run → hosts it as a `stream` session → the existing
overlay projects it; viewers fork via the existing re-entry paths
(`live-relay-as-drill-source.md:424-429`, which reached the same composition). **The
one genuinely new mechanism is the source refresher**: at HEAD an imported run is a
one-shot replay of a fixed mainline (§3), while a cast of a *live* board needs the
source mainline to grow as the real game moves — either re-import-per-update (new run
identity each poll; cheap, ugly) or append-to-run (one run whose `movetextDigest`
history changes; the RFC's hardest design decision, gap 2). The prior dossier's
caution binds here too: the streamer surface's audience gate (B5) is *"blocked on […]
a streamer audience"* (`live-relay-as-drill-source.md:430-437`) — so the lane's
default justification is the **anyone-analyses** solo case, with casting as the
composition that comes along nearly free.

---

## 5. The provider boundary

**The ruling** — D709: hybrid boundary, external play via *"an optional chess-network
adapter (Lichess first)"*; D710: the Lichess API is the substrate, *"exact provider
identity and return"* are ours to define. Live sources sit on the same adapter side
of that line: we consume, we do not relay-operate.

**What the broadcast API offers vs what we'd consume** (measured in §1 and in
`design/research/live-relay-as-drill-source.md` §1.1, all `[V]` unless noted):

| offered | consume? |
|---|---|
| `GET /api/broadcast` (paginated NDJSON index of official tours, with per-round `finished`/`ongoing` flags), `/api/broadcast/top`, `/search` | yes — discovery. At the harness sample: 10 finished + 10 ongoing rounds among 20 tours |
| `GET /api/broadcast/round/{roundId}.pgn` — full round, every board, one body | yes — the finished-round import path (works today, §1) |
| `GET /api/stream/broadcast/round/{id}.pgn` — all games first, then a full game PGN per update | yes — the live-follow path; one held connection replaces polling |
| tour/group stream variants `[P]`; `push|url|urls|ids|users` round-sync sources; organiser `delay` 0–3600 s (`live-relay-as-drill-source.md:120-135`) | no (we are not a broadcast operator); the `delay` matters only as context for D411 — an upstream-delayed feed is still a live game and still locks |
| private-broadcast OAuth (`study:read`) — public rounds need **no auth** (`:98-99`) | no auth in 1.0 |

**Rate limits** (Lichess API tips, quoted `[V]` at `live-relay-as-drill-source.md:107-109`):
*"Only make one request at a time"*, 429 → *"waiting one minute"* — which
`import-source.ts` already respects mechanically (serialized fetches, `retryAfter`
passthrough, §3). The 3-move delay and 8-streams-per-IP limits are on
`/api/stream/game/{id}` (single Lichess games), a **different** endpoint family the
RFC may name but does not need. ToS grants personal and commercial API use, revocable
(`live-relay-as-drill-source.md:349`). Latency budget from §1: discovery ~1.2 s, a
finished round ~4.6 s, a held round-stream delivering updates push-fashion.

**The chess.com refusal (D413, verified general):** nothing live or in-progress is
publicly exposed, probes 404, ToS prohibits the use — so
`docs/game-import-and-story.md:28-29`'s *"no supported per-game public fetch contract
exists"* should be strengthened to the general refusal when this RFC touches that doc.
The refusal costs less than it reads: chess.com events reach Lichess broadcasts anyway
(measured: an Esports World Cup round with `[Site "Chess.com"]` per game,
`live-relay-as-drill-source.md:133-135`), so **Lichess-first (D709) is also
chess.com-events-covered in practice.**

---

## 6. Gaps — what the RFC author must answer

Numbered; **⚖️ marks owner-level forks**, ⚠ marks traps.

1. **The splitter and the board picker.** `parsePgnMainline` refuses multi-game
   bodies (§1.1); a `resolveBroadcastSource` must split the round and something must
   let the user pick a board (or import all). Where does selection live — URL grammar
   (`lichess.org/broadcast/...` round/game URLs), a picker UI, or both?
2. **The growth model for a live-followed run** — the core new mechanism (§4).
   Re-import-per-update vs append-to-run; what happens to `movetextDigest`, run
   identity, existing learner forks, and the story evidence pass when the source
   mainline grows. Nothing at HEAD appends to an imported run.
3. **⚠ D410, the law-8-adjacent trap:** the parse drops Lichess's Stockfish verdicts,
   but `ImportedGameRecord.pgn` retains raw bytes verbatim (§3) — another product's
   move grades entering storage as authored-looking text. The RFC must strip at the
   source boundary **and ship the assertion** (no `%eval`/`Blunder.` text in anything
   stored or rendered), not extend the `evals=false` hope. Decide: strip before the
   record, or keep raw bytes but fence every re-exposure (story, export) — the first
   is simpler and loses only data we must not show anyway.
4. **D411 lock semantics:** carried as a dynamic `AssistanceContext` bit applied in
   the workflow/session **ceiling** term (§3). Open: release condition (per-game
   `Result` no longer `*`? round `finished` flag? both, OR-ed safe-side), behavior
   when the follower connection is lost (fail-locked), and whether the lock also
   gates `story()` (it must — `feedbackDisclosed` gating exists, but a live source
   never reaches "finished" until it does).
5. **D412:** one clause in design/03's events row distinguishing *team relays*
   (roster-with-calendar) from external tournament relay — a design-tier edit, so it
   rides this RFC's acceptance (law 5: RFC proposes, owner's ruling lands it).
6. **Not-yet-started boards:** `requireMoves: true` refuses them (§1.5). Is "follow
   this board from move 0" in scope (needs the growth model of gap 2 anyway), or is
   the 1.0 answer "a board becomes importable at its first move"?
7. **Who holds the connection:** a server-side round follower (one
   `/api/stream/broadcast/round` connection per followed round, fan-out to runs) does
   not exist at HEAD; polling through the client instead would multiply requests
   against the one-at-a-time rate policy. Sequencing with `import-source.ts`'s
   module-serialized fetch queue (a held stream must not block it).
8. **Discovery surface:** which index (official `/api/broadcast` vs `/top` vs
   `/search`), how much curation, and where it lives in the IA (design/03's Live and
   community section) — probably the smallest slice that lets a URL paste work first.
9. **⚖️ Justification order:** the prior dossier's verdict stands — casting cannot
   validate B5 without a streamer audience, so the lane justifies on
   **anyone-analyses** (solo import/follow) with casting as a nearly-free composition
   (§4). If the owner wants casting to *lead*, that reopens the B5 revival condition
   — an owner call, not an RFC author's.
10. **⚖️ Naming/identity:** does a broadcast-sourced run stay `sessionKind:
    "imported"` with a source facet (recommended — keeps `ASSISTANCE_PROFILES`,
    `WorkflowContextId`, and the longitudinal `decision_class='game'` grain untouched,
    §3), or become a new session kind (ripples through every context table
    intent-presets just froze)? The facet-vs-kind choice shapes the D411 bit and is
    cheap now, expensive later.
11. **Licence note text** for broadcast sources (the `licenceNote` pattern,
    `import-source.ts:40,89`): broadcast rounds are Lichess-served but often OTB
    games Lichess does not originate; `BroadcastURL`/`GameURL` headers give free
    provenance (§1.6). State what we assert (nothing) and what we record (retrieval
    URL + time), matching the existing `no-rights-asserted` form.
12. **Rate/latency budget in the design:** one discovery request ~1.2 s, one finished
    round ~4.6 s, one held stream per followed round, 429 → back off ≥1 min (§5) —
    the RFC should carry these as stated operating assumptions so the polling-vs-
    streaming choice is made on measured cost, not vibes.

**Recommended scope cut** (author's proposal, for the RFC to argue): **Phase A —
finished-round ingestion**: discovery/URL paste → split → pick board → strip-with-
assertion → existing `importGame` path; discharges D410, D413 (doc edit), D414, and
most of D412, with zero new session machinery. **Phase B — live-follow**: the round
follower, the growth model (gap 2), and the D411 ceiling bit; this is where "current
tournaments" becomes literal. **Casting stays a composition** (D705): binding the
existing stream session + overlay to a followed run, no new evidence mode, gated
behind the owner's gap-9 ruling. Phase A is shippable on today's measured behavior
alone.
