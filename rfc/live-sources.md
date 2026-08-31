# RFC: live-sources — Phase A, finished-round broadcast ingestion

- **Status:** draft — **ACCEPTANCE WITHDRAWN by fresh independent review 2026-08-30 on
  [[D2277]]–[[D2285]].** The real-PGN feasibility and strip-before-storage direction survive,
  but “finished-only” admits ongoing boards into automatic engine evaluation; source/choice
  contracts are duplicated or unspecified; splitter/clock/resource/rules proofs are incomplete;
  dependencies are returned; and the web journey would be unreachable or false. No implementation
  before author repair and another review. **Prior status:** accepted — 2026-08-22.
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
migration | position behind campaign-catalogue-progression | imported_games.source_kind CHECK gains 'lichess_broadcast' (storage.ts:3356; STRICT table — SQLite CHECK edits require a rebuild migration)
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
assistance lock — proposed row D957), casting (a composition over the existing stream
session + overlay per [[D705]], gated on the owner's B5 ruling — proposed row D958),
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
  server-code union member, not a versioned register entry (the union crosses no
  package boundary and appears in no schema; the one versioned resource this RFC
  touches is the §4 storage migration, claimed in the tabiya-claims block).
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

Not-yet-started boards (headers, zero moves — a real state in live rounds, though
**no committed fixture game carries it**: the harness demonstrated the refusal on a
header-only PGN it derived from the ongoing fixture's first game,
`roundtrip.test.ts:105`) stay in the split output and are refused **at import** by
the existing
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

The measured facts (harness, finished round; verdict inventory corrected by
cross-review 2026-08-22 against the committed fixture): the input carried **972
`[%eval]`, 902 `[%clk]`, 61 literate verdict comments** — 59
`Blunder./Mistake./Inaccuracy.` plus one `Checkmate is now unavoidable.` and one
`Lost forced checkmate sequence.` (the harness's 59 counted only the three named
classes: **the literate vocabulary is open, not closed**, which is why the
assertion below is structural rather than an enumeration) — **and 61 third-party
suffix glyphs on the SAN tokens themselves** (`?` ×9, `?!` ×39, `??` ×13, e.g.
`33. Kf1??` — outside any comment, in the movetext proper). The
parse result contains none of them — but `importGame` stores
**`pgn: source.pgn` verbatim** (`service.ts:555`) and `importRecord()` serves it back.
Without this section, another product's move verdicts enter our storage as
authored-looking text — the law-8-adjacent trap D410 names, and the shipped
`evals=false&literate=false` query (`import-source.ts:73`) is *"reliance on an
upstream default we do not control, with no test"* (D410, verbatim).

**Decision: strip before the record** (derivation gap 3, first option — simpler, and
loses only data we must not show anyway). **New symbol:** `sanitizeBroadcastPgn(pgn)`
in `import-source.ts`:

> **AMENDED 2026-08-23 ([[D1048]]) — extract clock tags BEFORE the strip.** Two contracts
> accepted the same day pointed in opposite directions: this section destroys the `[%clk]` tags
> the time-control lane ([[D1041]]) is built on — the harness measured **902** of them in one
> finished round. The amendment adds an **extraction step ahead of the strip**; the strip itself
> is unchanged and the fail-closed assertion keeps every character it had.
>
> **Why this is safe, and why it is not a hole in [[D410]].** A clock reading is a **measured
> fact about the game** — how much time remained on a clock, recorded by the organiser's
> equipment — not another product's **judgement of a move**. D410's trap is that
> *"another product's verdict on a move enters our corpus as authored truth"*: `[%eval]`,
> `Blunder.`, `??`. A clock asserts nothing about move quality and grades nothing, so it sits on
> the opposite side of that line. The distinction is the same one law 8 draws everywhere in this
> repo — render measured evidence, never manufactured judgement.
>
> **The extraction, specified:** before any stripping, `sanitizeBroadcastPgn` parses `[%clk H:MM:SS]`
> occurrences into a typed, per-ply structure and returns it alongside the sanitized PGN —
> `{ pgn: string; clocks: readonly { readonly ply: number; readonly remaining: string }[] }`. The
> structure carries **no PGN annotation syntax by construction** (integers and a duration
> string), so nothing it holds can re-enter the movetext. Its storage home is a typed field
> beside `ImportedGameRecord.pgn` (`storage.ts:156-166`) and is **claimed by the time-control
> lane, not by this RFC** — Phase A neither persists nor reads `clocks`; it only stops
> destroying them, and the field's schema, lane and migration are that lane's to claim. A
> consumer arriving before then finds the extraction available and the storage absent, which is
> the honest state rather than a silent one.
>
> **Criterion 3 is unchanged and still fails closed.** Its assertion is over the **movetext of
> the stored record**, where a clock tag remains exactly as forbidden as an eval: the extraction
> lifts clocks *out* and the strip then removes them, so the movetext still contains zero `[%clk`.
> The guarantee did not need narrowing — it needed the extraction to happen first. Criterion 11
> below covers the new step.

- removes all `{...}` comments (which is where Lichess keeps evals, clocks, and
  literate verdicts — measured: zero fixture games carried `(...)` variations in
  movetext, the verdict sentences live inside comments), all `;` rest-of-line
  comments (legal PGN, unobserved upstream, stripped so the assertion never meets
  one), all NAG glyphs (`$n`), **and all move-suffix annotation glyphs** (`!`/`?`
  sequences trailing a SAN token — the fixture's 61 `?`/`?!`/`??` are the same
  Lichess analysis pass wearing movetext syntax; a strip that handled only
  comments would store `33. Kf1??` as authored-looking judgment, which cross-review
  demonstrated from the committed fixture);
- **asserts, then returns — structurally, on the movetext (headers excluded)**:
  after stripping, the movetext must contain **zero occurrences of `{`, `}`, `;`,
  `[%`, `$`, `!`, and `?`** (none of these characters occurs in legal SAN,
  move numbers, or the four result tokens), and — belt over braces — zero
  occurrences of the measured verdict tokens `Blunder.` / `Mistake.` /
  `Inaccuracy.` / `was best`. Any residue throws the **new typed error**
  `BROADCAST_ANNOTATION_RESIDUE` — the import fails closed rather than storing
  third-party grades. The character-class assertion is what closes the D410 trap
  over verdict sentences the token list has never seen (the fixture already
  carries two classes outside `Blunder./Mistake./Inaccuracy.`); the token arm
  keeps the measured cases readable in the test output. This is the
  assertion-not-hope D410 demands, and it runs on every broadcast import, not
  only in tests.

`resolveBroadcastSource` returns the **sanitized** bytes as `source.pgn`, so
`ImportedGameRecord.pgn` (:555) stores clean text with **no record-shape change**
(the record's fields are untouched; its `sourceKind` union and the SQLite CHECK
behind it gain one member — the §4 migration).
Headers are not comments and survive sanitization untouched — `BroadcastName`,
`BroadcastURL`, `GameURL`, `WhiteFideId`/`BlackFideId`, hierarchical `Round` all pass
through into `parsed.headers` and the record (measured: 20-21 headers kept per fixture
game). Provenance is free; keep it.

The paste path (`kind: "pgn"`) is **unchanged**: a user pasting annotated PGN today
stores its comments verbatim, and changing that is out of this RFC's scope — but it is
the same trap through a manual door, recorded as proposed row D959 rather than fixed
silently here.

### 4. The import hand-off

`resolveBroadcastSource` output matches the existing resolved-source shape
(`import-source.ts:85-90`): sanitized `pgn`, `sourceKind: "lichess_broadcast" as
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
run field, no run-schema change — but one storage migration.** Cross-review
2026-08-22 re-derived the write path at source: `imported_games` is a STRICT
table with `source_kind TEXT NOT NULL CHECK (source_kind IN
('pgn_paste','lichess_url'))` (`storage.ts:3356`), so this section's INSERT of
`"lichess_broadcast"` **fails the CHECK on every database at HEAD** — the record
this RFC specifies was unwritable as drafted. SQLite cannot alter a CHECK in
place; the implementing commit ships the next-numbered storage migration (claim
`position behind campaign-catalogue-progression` in the tabiya-claims block — behind the Campaign
catalogue successor, which follows `campaign-core`): a standard table
rebuild of `imported_games` widening the CHECK to admit `'lichess_broadcast'`,
no data rewrite. `ImportedGameRecord.sourceKind` (`storage.ts:144`) and the
resolved-source `sourceKind` union widen by the same one member.
The accepted `longitudinal-store` grain already
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
| Live-follow: the server-side round follower (one held stream per followed round), the run **growth model** (nothing at HEAD appends to an imported run — re-import-per-update vs append-to-run is Phase B's hardest decision), move-0 follows | proposed row **D957**, the Phase-B RFC |
| The [[D411]] lock (*"assistance must be lockable on 'the source game is still live'"*): pinned now as the **workflow/session-ceiling term** of `intent-presets` §2's four-term ∩ algebra — a dynamic `AssistanceContext` bit (sibling of `seatedInContest`, `assistance.ts:21-33`), **not** a new `WorkflowContextId` — release/fail-closed semantics specified in Phase B where the follower that knows liveness exists | proposed row **D957**; the ceiling-term pinning is normative now so Phase B composes rather than invents |
| Casting: host imports a board → hosts it as the existing `stream` session → the existing `/live/overlay/:runId` projects it ([[D705]]: composition, not a new evidence mode; [[D704]]: the overlay issues no evidence/provider query). Blocked on the owner's B5 justification ruling — the lane justifies on **anyone-analyses** unless the owner rules casting leads | proposed row **D958**, Open question 1 |
| Discovery UI beyond URL paste (`/api/broadcast` index, curation, IA placement) | derivation gap 8; a later slice of this lane |

## Deviations from design

One, proposed not landed (law 5 — design tier is the owner's): [[D412]]'s clause for
`design/03-product-breadth.md`'s events row, distinguishing **team relays**
(roster-with-calendar, a native social object) from **external tournament relay**
(this lane: consuming someone else's broadcast). Two independent agents derived the
ambiguity from scratch; one sentence closes it. The edit rides this RFC's acceptance
as an owner ruling or is severed to its own ruling — Open question 3.

## Fresh independent buildability return — 2026-08-30

These criteria are not implementation authority. The fresh review at
`planning/live-sources/live-sources-fresh-independent-buildability-review-2026-08-30.md`
reproduces nine individually routed obligations with `make live-sources-fresh-review`:

- [[D2277]] — verify finished-round safety or compose with the live lock;
- [[D2278]] — register the shared import request and durable source-kind authorities;
- [[D2279]] — type stable board choice, snapshot binding and stale retry;
- [[D2280]] — replace friendly-fixture splitting proof with adversarial framing coverage;
- [[D2281]] — assert clock extraction at per-game production grain;
- [[D2282]] — bound external round bytes, game count and header/game sizes;
- [[D2283]] — reconcile returned dependencies and the blocked migration predecessor;
- [[D2284]] — consume shared rules/setup identity or safely refuse non-Standard games; and
- [[D2285]] — ship the complete honest URL-paste browser journey.

The prior criteria remain historical input for the author repair. They cannot be re-accepted until
all nine obligations are incorporated and independently reviewed.

## Acceptance criteria

Unit: criteria; total: 11. Each is failable — the wrong implementation it catches is
named where non-obvious.

1. `splitBroadcastRound` on the two committed harness fixtures returns **exactly 10
   and 10** games (the trims), each individually accepted by `parsePgnMainline` where
   the whole body is refused. (Catches a splitter that "works" by regex luck: counts
   are exact, and every split unit must parse.)
2. The finished-fixture games import end-to-end through `importGame` to runs whose
   mainline ply counts equal the harness record's per-game plies (134, 46, 60, 145,
   211, 88, 65, 80, 75, 68). (Catches silent move loss in split/sanitize.)
3. **The D410 assertion, positive arm:** a broadcast import of the finished fixture
   stores an `ImportedGameRecord.pgn` whose movetext contains zero occurrences of
   `{`, `}`, `;`, `[%`, `$`, `!`, and `?` (§3's character classes — this is what
   catches the fixture's 61 `?`/`?!`/`??` suffix glyphs, which the earlier
   six-token form provably stored) and zero occurrences of `[%eval`, `[%clk`,
   `Blunder.`, `Mistake.`, `Inaccuracy.`, `was best` — asserted against the
   **stored record**, not the parse result (the parse already drops them; the record
   is where D410's trap lives).
4. **The D410 assertion, negative control:** the same raw fixture **game** (one
   split unit, not the multi-game round file, which the parser refuses whole)
   pasted through the existing `kind: "pgn"` path retains its annotations —
   comments and suffix glyphs — in the stored record. (Proves criterion 3
   measures the broadcast boundary, not an accidental global behavior change —
   the [[D444]] vacuity guard.)
5. `BROADCAST_ANNOTATION_RESIDUE`: feeding `sanitizeBroadcastPgn` a constructed PGN
   whose annotation survives the strip (e.g. a verdict token outside any comment)
   fails closed with the typed error; nothing is stored.
6. A not-yet-started board (headers, zero moves — constructed from the ongoing
   fixture's headers exactly as the harness does at `roundtrip.test.ts:105`; no
   committed fixture game is itself zero-move) selected for import yields the
   typed refusal naming the board; the process does not crash and no record is
   created.
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
11. **The migration writes what HEAD refuses:** on a database at the pre-landing
    storage version, a broadcast import's `imported_games` INSERT fails the shipped
    `source_kind` CHECK (`storage.ts:3356`); after the §4 rebuild migration the
    same INSERT succeeds, existing `pgn_paste`/`lichess_url` rows survive
    byte-identically, and an unknown `source_kind` is still refused. (Catches
    both the unwritable-record defect cross-review found and a rebuild that
    silently drops the CHECK.)
12. **Clock extraction survives the strip ([[D1048]], amendment 2026-08-23):** running
    `sanitizeBroadcastPgn` over the committed finished-round fixture returns a `clocks`
    array of **exactly 902 entries** — the harness's measured `[%clk]` count — each with an
    integer `ply` and a `H:MM:SS` `remaining` string, **while criterion 3's movetext
    assertion still passes on the same call's `pgn`**. Both arms must hold in one
    invocation. (Catches the two failures that matter in opposite directions: a strip that
    runs first and destroys the timing data the time-control lane needs, and an extraction
    that leaks a clock tag back into the stored movetext. A fixture whose `clocks` is empty
    fails, so the criterion cannot pass vacuously on a sanitizer that never extracts.)

### 7. Ledger rows this RFC closes

Unit: ledger rows; total: 5. [[D410]] — §3's strip-with-assertion at the record
boundary (criteria 3–5), flips at the implementation commit. [[D412]] — the events-row
clause (§Deviations) plus this RFC's import half; the clause lands with an owner
ruling at acceptance, the import half at implementation. [[D413]] — criterion 8's doc
edit, implementation commit. [[D414]] — already ✅, discharged by execution
2026-08-22 (`tools/d947-broadcast-roundtrip-harness/`); recorded here as the evidence
base. [[D947]] — **partially**: Phase A of the commission; Phase B and casting remain
with proposed rows D957/D958.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Phase B — the round follower (held stream), the imported-run growth model, move-0 follows, and the [[D411]] lock as a dynamic ceiling-term bit with fail-closed release (§6 rows 1–2); proposed row D957 owns the seam until its RFC exists | claude | `planning/live-sources/` | |
| D2 | Casting composition ([[D705]]) — blocked on the owner's B5 justification ruling (Open question 1); proposed row D958 | OWNER | `planning/live-sources/` | |
| D3 | The [[D412]] events-row clause in `design/03` — law 5, owner ruling at this RFC's acceptance or severed to its own ruling (Open question 3) | OWNER | `planning/live-sources/` | |
| D4 | Phase-A implementation: criteria 1–11 (including the `imported_games` CHECK rebuild migration), the [[D413]] doc edit, and the [[D410]]/[[D412]]-import ledger flips in the implementing commit | codex | `planning/codex-queue.md` | |

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
   kind. Deferred to D957's RFC with the recommendation recorded, not decided.
3. **Owner at acceptance — the D412 design clause** (§Deviations): ride this
   acceptance or sever to its own ruling.

## Ledger rows (proposed — renumber at landing)

Head D952 at drafting; the campaign-gate waiver landed as D953 hours later, and a
breadth-evidence row took D956 during cross-review — the head is **D956 at
cross-review 2026-08-22**, so the rows below carry **D957–D959**. The ledger
allocates above the highest registered id, and the landed D953 row records this
renumbering obligation; **the acceptor re-derives the numbers from the then-head
at landing** — these are current, not promised.

- **D957 (landed)** — Phase B of the live-sources lane: the round follower (held
  `/api/stream/broadcast/round` connection, measured 0.24 s first-burst), the
  imported-run **growth model** (re-import-per-update vs append-to-run; nothing at
  HEAD appends to an imported run), move-0 follows, and the [[D411]] lock as a
  dynamic ceiling-term bit with fail-closed release semantics. Needs its own RFC;
  this row owns the seam until then.
- **D958 (landed)** — casting is a composition ([[D705]]) blocked on the owner's B5
  justification ruling (Open question 1); binding the existing `stream` session +
  overlay to a followed run requires Phase B's follower and no new evidence mode.
- **D959 (landed)** — 🐞 the paste path stores third-party annotations verbatim
  today: `kind: "pgn"` retains comments (including engine verdicts) in
  `ImportedGameRecord.pgn` — [[D410]]'s trap through the manual door, out of Phase A's
  scope and recorded rather than silently fixed or silently kept.

## Changelog

- 2026-08-30: acceptance withdrawn on [[D2277]]–[[D2285]]. The accepted path could import an
  ongoing board and immediately enqueue engine evidence with no liveness check. Fresh review also
  returned the duplicated request/source vocabulary, board-choice protocol, framing and clock
  grains, upstream resource bounds, stale dependencies, chess-subject admission and browser
  journey. Exact review and reproduction are linked in Status.
- 2026-08-22: created from `planning/live-sources/rfc-derivation.md` (D947 lane;
  harness-measured evidence base; Phase-A cut per the derivation's recommendation).
- 2026-08-22 (cross-review, adversarial, re-derived at source): **(1) the record
  was unwritable as drafted** — `imported_games.source_kind` carries a STRICT-table
  CHECK closed over `('pgn_paste','lichess_url')` (`storage.ts:3356`), so §4's
  INSERT fails on every database at HEAD; the RFC now ships a CHECK-rebuild
  migration, the tabiya-claims block claims `migration | position behind
  campaign-catalogue-progression` (was `position behind campaign-core`; the catalogue successor
  now owns that contiguous Campaign slot — **the register row's claims cell and a migration
  Live-claims row must move with it at acceptance**), and criterion 11 pins both
  arms. **(2) The sanitizer in §3 had a
  measured hole**: 61 third-party suffix glyphs (`?`×9, `?!`×39, `??`×13) sit in
  the finished fixture's movetext outside any comment and survived both the strip
  and the six-token assertion — `Kf1??` would have been stored as
  authored-looking judgment; the strip now covers suffix glyphs, `;` comments and
  NAGs, and the assertion is structural (character classes) with the token arm
  retained. **(3) Verdict inventory corrected 59→61**: the fixture carries
  `Checkmate is now unavoidable.` and `Lost forced checkmate sequence.` beyond
  the three named classes — the literate vocabulary is open, which is the
  argument for the structural assertion. **(4) No committed fixture game is
  zero-move**; §2 and criterion 6 now name the harness's header-only derivation
  (`roundtrip.test.ts:105`) instead of implying a fixture board. **(5) Proposed
  rows renumbered to D957–D959** — the campaign-gate waiver landed as D953 after
  drafting and a breadth-evidence row took the next free id during cross-review
  itself; the acceptor re-derives from the then-head at landing. **(6)**
  Criterion 4 pins "fixture game", not the
  refusable round file; resolved-source cite corrected to
  `import-source.ts:85-90`. Verified clean: 4/4 harness tests re-run green at
  HEAD; every `service.ts`/`pgn-import.ts`/`import-source.ts`/`assistance.ts`
  line cite; the ply list, 10+10 splits, 972/902 counts, latency figures, URL
  grammar against the fixtures' `BroadcastURL`/`GameURL`; the run-schema and
  longitudinal claims-none halves (no digest or rebuild reads
  `ImportedGameRecord.pgn`; `movetextDigest` is over parsed moves and unaffected
  by stripping).
- 2026-08-23 (**[[D1048]] amendment by claude**): **extract clock tags before the strip.** This
  RFC and the time-control lane ([[D1041]]) were progressed hours apart the same day and pointed
  in opposite directions — §3's sanitizer destroyed the `[%clk]` tags (902 measured in one
  finished round) that lane is built on, and criterion 3 asserted their absence, failing closed.
  §3 now specifies an **extraction step ahead of the strip**, returning
  `{ pgn, clocks: { ply, remaining }[] }`. The strip is unchanged and **criterion 3 needed no
  narrowing**: its assertion is over the stored *movetext*, where a clock tag stays exactly as
  forbidden as an eval — the extraction lifts clocks out before the strip removes them. New
  **criterion 12** requires both arms in one invocation (902 entries extracted **and** the
  movetext assertion still green), and fails on an empty `clocks` so it cannot pass vacuously.
  The stated principle: a clock reading is a **measured fact about the game**, not another
  product's **judgement of a move**, so it sits on the opposite side of [[D410]]'s line from
  evals and verdicts. Storage of `clocks` is **claimed by the time-control lane, not here** —
  Phase A stops destroying the data and persists nothing, leaving that field's schema, lane and
  migration to the RFC that will read it.
