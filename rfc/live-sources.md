# RFC: live-sources — Phase A, finished-round broadcast ingestion

- **Status:** draft — 2026-08-22
- **Author:** claude (coordinator), from `planning/live-sources/rfc-derivation.md`
- **Created:** 2026-08-22
- **Design refs:** `design/03-product-breadth.md` Live surfaces (:81-83, :291) and the
  events row (the D412 clause, §Deviations); `design/05` §3-forms (via `intent-presets`
  §2, Phase B only)
- **Exploration gate:** the owner's verbatim commission ([[D947]] ⚖️, 2026-08-22:
  *"where is the stuff like retrieving LIVE games (current tournaments for example) so
  streamers can cast or anyone can analyse?"*) plus executed hands-on evidence —
  `tools/d947-broadcast-roundtrip-harness/` ran 20 real tournament games through the
  shipped parser, 4/4 tests green ([[D414]] discharged by execution). The campaign
  lane's drafting gate was checked and does not reach this lane.
- **Depends on:** `rfc/archive/` import machinery as shipped (`importGame`,
  `import-source.ts`); `longitudinal-store` (accepted — the `decision_class` grain,
  consumed not changed); `intent-presets` (accepted — named for Phase B's ceiling term
  only; Phase A takes no dependency on its implementation)
- **Parent / amends:** amends `docs/game-import-and-story.md`'s chess.com sentence
  ([[D413]]); everything else is new surface beside `resolveImportSource`
- **Supersedes / superseded by:** —
- **Planning:** `planning/live-sources/`

```tabiya-claims
none
```

## Summary

Phase A makes a finished Lichess broadcast round importable: paste a broadcast round or
game URL → fetch the round PGN → split it into games → pick a board → strip third-party
annotations **with an assertion, not a hope** → hand one sanitized game to the existing
`importGame` path. It discharges [[D410]] (grade-stripping at the boundary), [[D413]]
(the chess.com refusal, generalized in the doc), [[D414]] (already discharged by the
harness; recorded here), and the import half of [[D412]]. It deliberately ships **no**
live-follow, no assistance lock, and no casting surface — those are Phase B and a
composition, deferred with named rows (§6, Open questions). Everything Phase A relies
on is measured, not inferred: the fixtures, counts, and latency figures below are the
harness record (`tools/d947-broadcast-roundtrip-harness/roundtrip-output.md`).

## Motivation

The owner commissioned the lane verbatim ([[D947]]). The research base existed for
months (D410–D414, D704/D705/D709/D710) and never became an RFC; three of its rows had
escaped routing entirely ([[D948]]). The harness then answered the one open feasibility
question by execution: **all 20 real tournament games parsed through
`parsePgnMainline`** — 10 from a finished Campeonato de España 2026 round, 10 fetched
mid-round from Sants Open 2026 — so the open work is everything *around* the parse:
sourcing, splitting, stripping-with-assertion.

**Scope boundary.** Phase A = finished-round ingestion only, shippable on today's
measured behavior alone (derivation §6, recommended cut). Out of scope, each with a
named home: live-follow (the round follower, the run growth model, the [[D411]]
assistance lock — proposed row D953), casting (a composition over the existing stream
session + overlay per [[D705]], gated on the owner's B5 ruling — proposed row D954),
discovery UI beyond URL paste (derivation gap 8: the smallest slice that lets a URL
paste work ships first).

## Specification

Captions state units. All line cites verified at HEAD 2026-08-22 (`6d524c5`-era tree);
the derivation dossier re-verifies each.

### 1. The source kind — `resolveBroadcastSource`

`ImportSource` at HEAD is a closed two-kind union, `"pgn"` | `"lichess"`
(`apps/server/src/import-source.ts:3-5`). **New symbols** (all absent at HEAD — the
string `broadcast` appears nowhere in `apps/`, `packages/`, or `workers/` code,
grep-verified in the derivation):

- `ImportSource` gains `{ kind: "broadcast"; url: string; board?: string }` — a
  server-code union member, not a versioned register entry (see the claims argument).
- `resolveBroadcastSource(url, board, fetchImpl)` in `import-source.ts`, beside
  `resolveImportSource` and `resolveStudySource`, sharing the module-wide serialized
  fetch queue (:21, :68), the 10 s timeout, and the `429/5xx` →
  `IMPORT_SOURCE_UNAVAILABLE` + `retryAfter` passthrough (:79-83).

**URL grammar** (unit: accepted URL forms; total: 2): a broadcast **round** URL
(`lichess.org/broadcast/{tourSlug}/{roundSlug}/{roundId}`), and a broadcast **game**
URL (round URL + `/{gameId}`). The round id is the path segment Lichess round URLs
carry; the fetch target is `GET https://lichess.org/api/broadcast/round/{roundId}.pgn`
(public, no auth — derivation §5). A game URL implies the board; a round URL with no
`board` argument returns the round's game list (White/Black/Result per game, from the
split of §2) as a typed `BROADCAST_BOARD_CHOICE_REQUIRED` refusal payload so the caller
can present a picker — selection lives in the URL grammar first, UI later.

Any chess.com URL is refused with the typed `IMPORT_SOURCE_UNSUPPORTED` naming the
general refusal ([[D413]]: nothing live or in-progress is publicly exposed, probes 404,
ToS prohibits the use; chess.com events reach Lichess broadcasts anyway — measured, an
Esports World Cup round carries `[Site "Chess.com"]` per game).

### 2. The splitter — `splitBroadcastRound`

The round endpoint always returns every board in one body, and `parsePgnMainline`
refuses multi-game bodies whole (*"PGN must contain exactly one game"*,
`pgn-import.ts:26`; both harness fixtures reproduced it). **New symbol:**
`splitBroadcastRound(roundPgn): readonly string[]` in `import-source.ts` — splits on
PGN game boundaries (a header block following a game's movetext/result terminator),
returning one PGN string per board with headers intact. It performs **no** chess
validation; `parsePgnMainline` remains the sole legality authority for the selected
board (one parser, no clone — the [[D523]]/one-authority discipline).

Not-yet-started boards (headers, zero moves — real in live rounds, harness §ongoing)
stay in the split output and are refused **at import** by the existing
`requireMoves: true` configuration (*"PGN must contain at least one move"*,
`pgn-import.ts:38-40`), surfaced as a typed refusal naming the board rather than a
crash. **Phase A convention: a board becomes importable at its first move.** Following
a board from move 0 is Phase B's growth model by definition (derivation gap 6) — it
needs the follower, not a `requireMoves` exception.

The 64 KiB `importGame` body cap (`service.ts:504-505`) is measured-compatible: a full
annotated round is 220 KB, a single annotated game ~5 KB, and sanitization (§3)
shrinks it further. The cap is applied to the **selected, sanitized game**, never the
round; no cap change.

### 3. Strip-with-assertion — `sanitizeBroadcastPgn` ([[D410]])

The measured facts (harness, finished round): the input carried **972 `[%eval]`, 902
`[%clk]`, 59 literate verdicts** (`Blunder./Mistake./Inaccuracy. … was best`); the
parse result contains none of them — but `importGame` stores
**`pgn: source.pgn` verbatim** (`service.ts:555`) and `importRecord()` serves it back.
Without this section, another product's move verdicts enter our storage as
authored-looking text — the law-8-adjacent trap D410 names, and the shipped
`evals=false&literate=false` query (`import-source.ts:73`) is *"reliance on an
upstream default we do not control, with no test"* (D410, verbatim).

**Decision: strip before the record** (derivation gap 3, first option — simpler, and
loses only data we must not show anyway). **New symbol:** `sanitizeBroadcastPgn(pgn)`
in `import-source.ts`:

- removes all `{...}` comments (which is where Lichess keeps evals, clocks, and
  literate verdicts — measured: zero fixture games carried `(...)` variations in
  movetext, the verdict lines live inside comments) and all NAG glyphs (`$n`);
- **asserts, then returns**: after stripping, the output must contain zero occurrences
  of `[%eval`, `[%clk`, and the verdict tokens `Blunder.` / `Mistake.` /
  `Inaccuracy.` / `was best`. A residue throws the **new typed error**
  `BROADCAST_ANNOTATION_RESIDUE` — the import fails closed rather than storing
  third-party grades. This is the assertion-not-hope D410 demands, and it runs on
  every broadcast import, not only in tests.

`resolveBroadcastSource` returns the **sanitized** bytes as `source.pgn`, so
`ImportedGameRecord.pgn` (:555) stores clean text with **no record-shape change**.
Headers are not comments and survive sanitization untouched — `BroadcastName`,
`BroadcastURL`, `GameURL`, `WhiteFideId`/`BlackFideId`, hierarchical `Round` all pass
through into `parsed.headers` and the record (measured: 20-21 headers kept per fixture
game). Provenance is free; keep it.

The paste path (`kind: "pgn"`) is **unchanged**: a user pasting annotated PGN today
stores its comments verbatim, and changing that is out of this RFC's scope — but it is
the same trap through a manual door, recorded as proposed row D955 rather than fixed
silently here.

### 4. The import hand-off

`resolveBroadcastSource` output matches the existing resolved-source shape
(`import-source.ts:86-92`): sanitized `pgn`, `sourceKind: "lichess_broadcast" as
const`, `sourceUrl` (the round/game URL as given), and the licence note in the
existing `no-rights-asserted` form (derivation gap 11), **exact text**:

```
no-rights-asserted: public lichess broadcast round export {url}; retrieved {ISO-8601}
```

— asserting nothing about game rights (broadcast rounds are Lichess-served but usually
OTB games Lichess does not originate) and recording only retrieval URL and time,
matching `import-source.ts:40,89`'s two shipped forms.

From there the path is the shipped one, byte-for-byte: `importGame`
(`service.ts:497-568`) → `parsePgnMainline(pgn, { requireMoves: true })` →
`movetextDigest` → session `{ kind: "imported", feedbackPolicy: "attempt_end" }` →
`createRun` + replay with `actor: "user"` for the chosen side, `"system"` for the
other → `ImportedGameRecord` → story evidence pass. **No new session kind, no new
run field, no schema change.** The accepted `longitudinal-store` grain already
reserves exactly this shape: the broadcast players' moves are `decision_class='game'`,
the learner's forks `'played'` (its imported-run acceptance case, :662-663) — consumed,
not amended.

Result mapping is the parser's own: a finished board carries its result; anything
non-terminal coerces to `"*"` (`pgn-import.ts:57-60`). Phase A imports **finished
boards from finished rounds** as its supported contract; an ongoing board imports as a
partial game exactly as the parser leaves it (measured: 9 ongoing-fixture games,
23–37 plies, `result: "*"`), and what makes that a *followed* game is Phase B.

### 5. Provider boundary and operating assumptions

Lichess-first per [[D709]]/[[D710]]; we consume, we do not relay-operate (no
`push|url|urls|ids|users` sync sources, no organiser delay configuration, no OAuth —
public rounds need no auth). Politeness is the shipped mechanism: module-serialized
fetches, one request at a time (Lichess's own stated policy), 429 → typed
`IMPORT_SOURCE_UNAVAILABLE` with `retryAfter`, back off ≥ 1 minute.

Stated operating assumptions (measured, derivation §1/§5 — carried so the Phase-B
polling-vs-streaming choice is made on cost, not vibes): discovery index ~1.2 s; a
finished 45-game round 4.6 s total (220 KB, slow-streaming body); the
`/api/stream/broadcast/round/{id}.pgn` variant delivered a full 26-game round in a
0.24 s first burst then held open — **streaming beats polling decisively**, which is
why Phase B's follower is a held stream and why Phase A, which needs each round once,
uses the plain endpoint.

### 6. What Phase A explicitly does not ship

Unit: deferred obligations; total: 4. Each has a named home — none is dropped.

| deferred | home |
|---|---|
| Live-follow: the server-side round follower (one held stream per followed round), the run **growth model** (nothing at HEAD appends to an imported run — re-import-per-update vs append-to-run is Phase B's hardest decision), move-0 follows | proposed row **D953**, the Phase-B RFC |
| The [[D411]] lock (*"assistance must be lockable on 'the source game is still live'"*): pinned now as the **workflow/session-ceiling term** of `intent-presets` §2's four-term ∩ algebra — a dynamic `AssistanceContext` bit (sibling of `seatedInContest`, `assistance.ts:21-33`), **not** a new `WorkflowContextId` — release/fail-closed semantics specified in Phase B where the follower that knows liveness exists | proposed row **D953**; the ceiling-term pinning is normative now so Phase B composes rather than invents |
| Casting: host imports a board → hosts it as the existing `stream` session → the existing `/live/overlay/:runId` projects it ([[D705]]: composition, not a new evidence mode; [[D704]]: the overlay issues no evidence/provider query). Blocked on the owner's B5 justification ruling — the lane justifies on **anyone-analyses** unless the owner rules casting leads | proposed row **D954**, Open question 1 |
| Discovery UI beyond URL paste (`/api/broadcast` index, curation, IA placement) | derivation gap 8; a later slice of this lane |

## Deviations from design

One, proposed not landed (law 5 — design tier is the owner's): [[D412]]'s clause for
`design/03-product-breadth.md`'s events row, distinguishing **team relays**
(roster-with-calendar, a native social object) from **external tournament relay**
(this lane: consuming someone else's broadcast). Two independent agents derived the
ambiguity from scratch; one sentence closes it. The edit rides this RFC's acceptance
as an owner ruling or is severed to its own ruling — Open question 3.

## Acceptance criteria

Unit: criteria; total: 10. Each is failable — the wrong implementation it catches is
named where non-obvious.

1. `splitBroadcastRound` on the two committed harness fixtures returns **exactly 10
   and 10** games (the trims), each individually accepted by `parsePgnMainline` where
   the whole body is refused. (Catches a splitter that "works" by regex luck: counts
   are exact, and every split unit must parse.)
2. The finished-fixture games import end-to-end through `importGame` to runs whose
   mainline ply counts equal the harness record's per-game plies (134, 46, 60, 145,
   211, 88, 65, 80, 75, 68). (Catches silent move loss in split/sanitize.)
3. **The D410 assertion, positive arm:** a broadcast import of the finished fixture
   stores an `ImportedGameRecord.pgn` containing zero occurrences of `[%eval`,
   `[%clk`, `Blunder.`, `Mistake.`, `Inaccuracy.`, `was best` — asserted against the
   **stored record**, not the parse result (the parse already drops them; the record
   is where D410's trap lives).
4. **The D410 assertion, negative control:** the same raw fixture pasted through the
   existing `kind: "pgn"` path retains its annotations in the stored record. (Proves
   criterion 3 measures the broadcast boundary, not an accidental global behavior
   change — the [[D444]] vacuity guard.)
5. `BROADCAST_ANNOTATION_RESIDUE`: feeding `sanitizeBroadcastPgn` a constructed PGN
   whose annotation survives the strip (e.g. a verdict token outside any comment)
   fails closed with the typed error; nothing is stored.
6. A not-yet-started board (headers, zero moves — fixture from the ongoing round)
   selected for import yields the typed refusal naming the board; the process does
   not crash and no record is created.
7. The stored record for a broadcast import carries the broadcast provenance headers
   (`BroadcastName`, `BroadcastURL`, `GameURL` when upstream provides them) and the
   licence note **byte-matching** §4's form.
8. A chess.com URL yields the typed refusal, and
   `docs/game-import-and-story.md`'s sentence is strengthened to the general refusal
   ([[D413]]) in the implementing commit.
9. Broadcast fetches run through the module-serialized queue: a test issuing two
   concurrent broadcast resolves observes sequential upstream calls (the shipped
   `import-source.ts` serialization, extended not bypassed).
10. **Scope guard:** at Phase-A landing, the strings `sourceGameLive` and
    `stream/broadcast/round` appear nowhere in shipped code (grep, mirroring the
    derivation's absence check) — live-follow did not leak in under this RFC's name.
    (Failable by exactly the creep it forbids.)

### 7. Ledger rows this RFC closes

Unit: ledger rows; total: 5. [[D410]] — §3's strip-with-assertion at the record
boundary (criteria 3–5), flips at the implementation commit. [[D412]] — the events-row
clause (§Deviations) plus this RFC's import half; the clause lands with an owner
ruling at acceptance, the import half at implementation. [[D413]] — criterion 8's doc
edit, implementation commit. [[D414]] — already ✅, discharged by execution
2026-08-22 (`tools/d947-broadcast-roundtrip-harness/`); recorded here as the evidence
base. [[D947]] — **partially**: Phase A of the commission; Phase B and casting remain
with proposed rows D953/D954.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Phase B — the round follower (held stream), the imported-run growth model, move-0 follows, and the [[D411]] lock as a dynamic ceiling-term bit with fail-closed release (§6 rows 1–2); proposed row D953 owns the seam until its RFC exists | claude | `planning/live-sources/` | |
| D2 | Casting composition ([[D705]]) — blocked on the owner's B5 justification ruling (Open question 1); proposed row D954 | OWNER | `planning/live-sources/` | |
| D3 | The [[D412]] events-row clause in `design/03` — law 5, owner ruling at this RFC's acceptance or severed to its own ruling (Open question 3) | OWNER | `planning/live-sources/` | |
| D4 | Phase-A implementation: criteria 1–10, the [[D413]] doc edit, and the [[D410]]/[[D412]]-import ledger flips in the implementing commit | codex | `planning/codex-queue.md` | |

## Open questions

1. **⚖️ Owner — justification order (derivation gap 9):** the lane currently
   justifies on **anyone-analyses** (solo import, then follow); casting is a
   nearly-free composition behind it. If casting should *lead*, that reopens the B5
   audience-gate revival condition — an owner call. Phase A is identical either way;
   the answer sequences Phase B vs the casting composition.
2. **⚖️ Owner — facet vs kind (derivation gap 10):** Phase A stores broadcast games
   as `sessionKind: "imported"` (the only shape that exists, and the derivation's
   recommendation — it keeps `ASSISTANCE_PROFILES`, the frozen `WorkflowContextId`
   set, and the `decision_class='game'` grain untouched). The open half is Phase B's:
   whether the D411 lock rides a **source facet** on `imported` or a new session
   kind. Deferred to D953's RFC with the recommendation recorded, not decided.
3. **Owner at acceptance — the D412 design clause** (§Deviations): ride this
   acceptance or sever to its own ruling.

## Ledger rows (proposed — renumber at landing; head D952 at drafting)

- **D953 (proposed)** — Phase B of the live-sources lane: the round follower (held
  `/api/stream/broadcast/round` connection, measured 0.24 s first-burst), the
  imported-run **growth model** (re-import-per-update vs append-to-run; nothing at
  HEAD appends to an imported run), move-0 follows, and the [[D411]] lock as a
  dynamic ceiling-term bit with fail-closed release semantics. Needs its own RFC;
  this row owns the seam until then.
- **D954 (proposed)** — casting is a composition ([[D705]]) blocked on the owner's B5
  justification ruling (Open question 1); binding the existing `stream` session +
  overlay to a followed run requires Phase B's follower and no new evidence mode.
- **D955 (proposed)** — 🐞 the paste path stores third-party annotations verbatim
  today: `kind: "pgn"` retains comments (including engine verdicts) in
  `ImportedGameRecord.pgn` — [[D410]]'s trap through the manual door, out of Phase A's
  scope and recorded rather than silently fixed or silently kept.

## Changelog

- 2026-08-22: created from `planning/live-sources/rfc-derivation.md` (D947 lane;
  harness-measured evidence base; Phase-A cut per the derivation's recommendation).
