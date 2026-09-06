# RFC: live-sources — Phase A, finished-round broadcast ingestion

- **Status:** draft — **first author repair completed 2026-09-06 for [[D2277]]–[[D2285]];
  another genuinely fresh independent review is required.** The repair adds an observed-finished
  receipt over current Lichess authority, one shared import-source protocol, digest-bound board
  choice and stale retry, parser-backed framing, per-game clock extraction, streamed resource
  budgets, exact Standard/start-position admission and the complete browser journey. No production,
  schema, migration or client implementation is authorized. **Prior status:** acceptance withdrawn
  2026-08-30; accepted 2026-08-22.
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
- **Research refresh:** `design/research/live-source-finished-receipt.md` (current official API and
  live public probes, 2026-09-06)
- **Depends on:** `rfc/archive/` import machinery as shipped (`importGame`,
  `import-source.ts`); accepted and implemented `shared-resource-register-bootstrap.md` plus the
  `import-source-protocol-register.md` absent-root registration specified in §1; the migration predecessor
  chain through accepted and implemented `campaign-catalogue-progression.md`. Returned
  `longitudinal-store.md`, `intent-presets.md`, `recorded-clocks.md`, `variants.md` and Phase B are
  **not** Phase-A dependencies: this RFC claims no longitudinal projection or assistance behavior,
  retains lossless raw clock tokens for the later clock authority, and admits only explicit
  Standard/from-standard-start PGN.
- **Parent / amends:** amends `docs/game-import-and-story.md`'s chess.com sentence
  ([[D413]]); everything else is new surface beside `resolveImportSource`
- **Supersedes / superseded by:** —
- **Planning:** `planning/live-sources/`

```tabiya-claims
migration | position behind campaign-catalogue-progression | imported_games.source_kind CHECK gains 'lichess_broadcast' and source_receipt_json retains the typed broadcast receipt (storage.ts:3356; STRICT table — SQLite CHECK edits require a rebuild migration)
```

## Summary

Phase A makes one **observed-finished** Lichess broadcast game importable: paste a round
or game URL → verify current round completion → choose a stable game identity → fetch a
bounded PGN snapshot → verify the same completion/choice again → parse the round with
one framing authority → extract lossless per-game clock tokens → strip third-party
annotations **with an assertion, not a hope** → hand one sanitized Standard game to the
existing `importGame` path → open its Story. The receipt binds both round observations,
the raw round digest, selected game identity and sanitized bytes; it explicitly does
not claim Lichess exposes an atomic or permanent upstream snapshot.

The delivery unit includes the shared request/result/source vocabulary and the full
keyboard/mobile-capable browser journey. It discharges [[D410]] (grade-stripping at the
boundary), [[D413]] (the chess.com refusal, generalized in the doc), [[D414]] (already
discharged by the harness; recorded here), and the import half of [[D412]]. It ships no
live-follow, assistance lock, casting or discovery catalogue — those remain named
successors (§6). The 20-game parse/annotation evidence survives; the completion
authority is refreshed in `design/research/live-source-finished-receipt.md`.

## Motivation

The owner commissioned the lane verbatim ([[D947]]). The research base existed for
months ([[D410]]–[[D414]], [[D704]]/[[D705]]/[[D709]]/[[D710]]) and never became an RFC; three of its rows had
escaped routing entirely ([[D948]]). The harness then answered the one open feasibility
question by execution: **all 20 real tournament games parsed through
`parsePgnMainline`** — 10 from a finished Campeonato de España 2026 round, 10 fetched
mid-round from Sants Open 2026 — so the open work is everything *around* the parse:
sourcing, splitting, stripping-with-assertion.

**Scope boundary.** Phase A imports an immutable local copy only after Lichess declares
the round and selected board finished on both sides of the captured PGN read. An
unknown, future, ongoing, changing or non-terminal source refuses before `importGame`,
so no record or evidence job exists to lock. Phase B owns following a growing source
and the [[D411]] assistance lock; casting composes over Phase B; discovery beyond URL
paste remains later. This is why Phase A can remain separate without the unsafe old
shortcut.

## Specification

Captions state units. Historical line cites identify the 2026-08-22 derivation tree; every symbol
and current authority used by the author repair was re-verified at HEAD on 2026-09-06 and is pinned
by the repair receipt or its cited dossier.

### 1. One shared import-source protocol

The request and durable source vocabularies are already copied through server parsing,
service code, web API types, storage, account export and client rendering ([[D2278]]).
Before this RFC can be accepted, `import-source-protocol-register.md` registers an
absent `import-source-protocol` root under the generic shared-resource engine. This RFC
then replaces its currently absent live claim with exactly:

```text
import-source-protocol | first lane 1 | whole projection
```

Advertising that claim before the descriptor lands is invalid, not a reservation; the generic
register must recognize the resource before this product RFC can claim its first version.

The implementing checkpoint creates
`packages/runtime/src/import-source-protocol.ts#IMPORT_SOURCE_PROTOCOL_RESOURCE` at
version 1. Its single atomic payload declares:

- request kinds `pgn | lichess | broadcast`;
- durable source kinds `pgn_paste | lichess_url | lichess_broadcast`;
- result/error discriminants `resolved | broadcast_board_choice_required |
  broadcast_selection_stale | broadcast_round_not_finished |
  broadcast_source_too_large`;
- the exact receipt/choice fields and §5 resource limits; and
- the canonical digest domains `tabiya:import-round-observation:v1`,
  `tabiya:import-round-pgn:v1`, and `tabiya:import-selected-pgn:v1`.

All runtime interfaces below derive literal members from that object. Server REST,
service/storage/account export and web API/client import the runtime types; no copied
string union remains. SQL cannot import TypeScript, so the migration CHECK is generated
from the resource's durable-source member set and a test requires set equality with the
running database. The resource digest covers ordered JSON-canonicalized semantic
fields; changing a limit, discriminant, field or member requires the next lane.

```ts
type ImportSource =
  | { readonly kind: "pgn"; readonly pgn: string }
  | { readonly kind: "lichess"; readonly url: string }
  | {
      readonly kind: "broadcast";
      readonly url: string;
      readonly selection?: {
        readonly roundId: string;
        readonly observationDigest: `sha256:${string}`;
        readonly gameId: string;
      };
    };

interface BroadcastBoardChoice {
  readonly gameId: string;
  readonly white: string;
  readonly black: string;
  readonly status: "1-0" | "0-1" | "1/2-1/2";
  readonly order: number; // presentation only; never identity
}

interface BroadcastBoardChoiceRequired {
  readonly kind: "broadcast_board_choice_required";
  readonly roundId: string;
  readonly roundName: string;
  readonly finishedAtMs: number;
  readonly observationDigest: `sha256:${string}`;
  readonly choices: readonly BroadcastBoardChoice[];
}
```

`resolveBroadcastSource` joins one entire multi-fetch operation to the shipped module
queue; its status/PGN/status calls cannot interleave with another local Lichess import.
It returns a `resolved` value or throws a typed server error whose closed details are
the corresponding protocol result. `Retry-After` is parsed as delta-seconds or an HTTP
date into `retryAt`; invalid/missing values yield no invented retry time and the client
offers a manual retry.

**URL grammar** remains two public forms: a broadcast round URL
(`lichess.org/broadcast/{tourSlug}/{roundSlug}/{roundId}`), and that URL plus an
eight-character `{gameId}`. Slugs are presentation-only; ids are normalized and exact.
A game URL supplies the intended game id and completes the receipt in one request. A
round URL without a selection returns HTTP 409 `BROADCAST_BOARD_CHOICE_REQUIRED` with
the closed payload above and creates nothing. A selection retry is bound to the
observation digest; any changed/removed game or observation returns HTTP 409
`BROADCAST_SELECTION_STALE` carrying a newly computed choice payload.

Any chess.com URL remains a typed `IMPORT_SOURCE_UNSUPPORTED` refusal naming the
general refusal ([[D413]]). No fetch is attempted.

### 2. Parser-backed framing and stable board identity

The round endpoint returns every board in one body while `parsePgnMainline` correctly
requires exactly one game. `parseBroadcastRound` uses `chessops/pgn.parsePgn` as the
sole **framing** authority and `makePgn` to produce one unit per parsed game; it never
splits with a regex, an `[Event]` sentinel or a result terminator. The selected unit
still passes through `parsePgnMainline`, which remains the sole mainline legality and
move authority. Framing and legality are different jobs but share one parser library.

Every parsed unit must have exactly one `GameURL` whose final path segment is an
eight-character game id and whose preceding round segment matches the normalized
request round id. Duplicate/missing/malformed `GameURL`, duplicate game ids or a PGN
game absent from the status observation fail the entire source before choice or import.
Player names and round order are display metadata only. The selected unit's normalized
result must equal the status observation after mapping Lichess `½-½` to PGN
`1/2-1/2`; `*` is never Phase-A-selectable.

The parser-backed tests include reordered/missing `Event`, literal `[Event ...]` text
inside a comment, CRLF, arbitrary blank lines, a header-only game and adjacent `*`
games. Friendly 10+10 real fixtures remain census controls, not the grammar. A
header-only or not-yet-started board has no terminal status and is omitted from the
choice list; direct selection returns `BROADCAST_ROUND_NOT_FINISHED` and creates
nothing.

All size checks are §5 source-boundary checks. The existing 64 KiB import cap remains
the selected sanitized-game ceiling; unlike the withdrawn text, the whole external
body is bounded before it reaches the parser.

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

**Decision: extract losslessly, then strip before the record.** `sanitizeBroadcastPgn`
accepts exactly one parser-framed game plus its stable `gameId`. Before deleting any
annotation it walks the mainline AST and retains every clock-like token with its exact
game/ply/occurrence identity:

```ts
interface BroadcastClockToken {
  readonly gameId: string;
  readonly ply: number;
  readonly occurrence: number;
  readonly raw: string;
}

interface SanitizedBroadcastGame {
  readonly pgn: string;
  readonly clockTokens: readonly BroadcastClockToken[];
  readonly selectedPgnDigest: `sha256:${string}`;
}
```

This is deliberately a lossless source hand-off, not a competing `ClockReading` parser.
No clock token is called valid, no duration is inferred and Phase A persists or renders
none of them. Missing clocks produce an empty array for that selected game; duplicate
and malformed clock-like annotations remain distinct raw rows rather than being dropped
or guessed. Phase B owns revisions; an immutable Phase-A snapshot has none. The returned
`recorded-clocks` RFC later parses, validates and persists these tokens under its own
authority. This breaks the former circular contract while preserving the evidence it
needs ([[D2281]]/[[D2287]]).

A clock reading is a measured source fact, not another product's judgement. Retaining
its exact token in a non-rendered side channel therefore does not weaken [[D410]]. The
stored movetext still contains no clock tag. The finished fixture's ten selected-game
arrays are asserted separately, including its real zero-token game; their aggregate
remains the 902-token census and is never treated as one game's reading array.

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

#### 4.1 Observed-finished receipt

An initial round-only request reads bounded round detail and returns only terminal
choices. A direct game request or selection retry runs this sequence inside one
serialized queue task:

1. `GET /api/broadcast/-/-/{roundId}` → normalized observation A;
2. require exact round id, integer `finishedAt`, `ongoing !== true`, selected game id
   present and selected status terminal;
3. `GET /api/broadcast/round/{roundId}.pgn?clocks=true&comments=false` → bounded raw
   bytes and `roundPgnDigest`;
4. parser-frame and bind the selected unit by exact `GameURL` id;
5. repeat the round-detail GET → normalized observation B; and
6. require A and B byte-equal after canonical normalization, then sanitize and issue
   the receipt.

The canonical observation contains only `roundId`, integer `finishedAtMs`, `ongoing` normalized
to false, and the complete set of `{gameId,status}` rows sorted by UTF-8 game id. Its
digest uses §1's `tabiya:import-round-observation:v1` domain. Unknown completion,
`ongoing:true`, `*`, A/B drift, a status/PGN-result mismatch or missing game identity
refuses before `importGame`; no run, record or evidence job is created. A selection
retry must additionally match A's digest or returns a fresh
`BROADCAST_SELECTION_STALE` choice payload.

```ts
interface BroadcastFinishedReceipt {
  readonly schema: "tabiya.broadcast-finished-receipt.v1";
  readonly roundId: string;
  readonly gameId: string;
  readonly finishedAtMs: number;
  readonly status: "1-0" | "0-1" | "1/2-1/2";
  readonly observationBeforeDigest: `sha256:${string}`;
  readonly observationAfterDigest: `sha256:${string}`;
  readonly roundPgnDigest: `sha256:${string}`;
  readonly selectedPgnDigest: `sha256:${string}`;
  readonly observedBeforeAt: string;
  readonly observedAfterAt: string;
  readonly pgnLastModified?: string;
}
```

The observation digests must be equal. This means Lichess declared the same captured
game and round finished immediately before and after retrieval. It does not mean the
upstream snapshot was atomic or can never be reset; the official API exposes neither
guarantee. `pgnLastModified` is advisory provenance only. After import, Phase A never
polls the source again.

#### 4.2 Standard/start-position admission

Phase A does not wait on the returned variant foundation and does not guess. Every
selected PGN must carry exactly one `[Variant "Standard"]`, must carry neither `SetUp`
nor `FEN`, and `parsePgnMainline` must return the canonical standard initial position.
Missing Variant, `From Position`, Chess960 and every other variant refuse as
`BROADCAST_RULES_UNSUPPORTED` before storage, including the missing-FEN Chess960 shape
that [[D1033]] proved could otherwise be misread. Same-FEN/different-rules and
missing-header controls make the refusal non-vacuous. A later variant RFC may widen
this through shared `rules + setupFamily`; Phase A declares no such support.

#### 4.3 Storage and existing run path

`resolveBroadcastSource` returns sanitized `pgn`, `sourceKind:
"lichess_broadcast"`, normalized source URL, the finished receipt, and the existing
`no-rights-asserted` licence-note form, **exact text**:

```
no-rights-asserted: public lichess broadcast round export {url}; retrieved {ISO-8601}
```

— asserting nothing about game rights (broadcast rounds are Lichess-served but usually
OTB games Lichess does not originate) and recording only retrieval URL and time,
matching `import-source.ts:40,89`'s two shipped forms.

From there the path is the shipped one: `importGame`
(`service.ts:497-568`) → `parsePgnMainline(pgn, { requireMoves: true })` →
`movetextDigest` → session `{ kind: "imported", feedbackPolicy: "attempt_end" }` →
`createRun` + replay with `actor: "user"` for the chosen side, `"system"` for the
other → `ImportedGameRecord` → story evidence pass. The receipt is returned to the
caller and stored as the typed nullable `ImportedGameRecord.sourceReceipt`; it is never flattened
into the human-readable licence note. Existing `pgn_paste` and `lichess_url` rows carry null. The
account archive exports and imports the structured receipt byte-for-byte under the same runtime
type, so round/game identity, both observations and all captured digests survive a round trip.

There is no new session kind, run field or run-schema change, but there is one storage
migration. `imported_games.source_kind` is a STRICT-table CHECK closed over
`pgn_paste | lichess_url`; the claimed migration rebuilds the table with the
resource-derived third member and nullable `source_receipt_json`. A CHECK requires a receipt
exactly when `source_kind = 'lichess_broadcast'`; read and archive hydration validate the parsed
JSON against the shared receipt type before returning a record. The rebuild preserves every old
row byte-identically with a null receipt. It remains
positioned behind `campaign-catalogue-progression`; implementation is blocked until
that migration predecessor and the shared-resource bootstrap/register are accepted and
implemented. The author repair does not pretend the queue is ready.

Only terminal results reach the parser hand-off. The old sentence allowing partial
`*` imports is deleted: partial/growing games belong exclusively to Phase B.

### 5. Provider boundary and operating assumptions

Lichess-first per [[D709]]/[[D710]]; we consume, we do not relay-operate (no
`push|url|urls|ids|users` sync sources, no organiser delay configuration, no OAuth —
public rounds were re-probed without auth). Politeness is the shipped mechanism:
module-serialized operations, one request at a time. There is no background retry.
`429/5xx` becomes typed `IMPORT_SOURCE_UNAVAILABLE`; a valid upstream `Retry-After`
becomes exact `retryAt`, and the browser disables retry until that time. Unknown retry
timing stays unknown rather than inventing “one minute.”

Every external response is read as a byte stream under one abort controller and one
10-second response deadline. The version-1 protocol declares these exact limits:

| resource | limit | refusal |
|---|---:|---|
| round-detail JSON body, each of A/B | 2 MiB | `BROADCAST_SOURCE_TOO_LARGE` |
| round PGN body | 8 MiB | `BROADCAST_SOURCE_TOO_LARGE` |
| parser-framed games | 128 | `BROADCAST_SOURCE_TOO_LARGE` |
| serialized bytes per framed game | 64 KiB | `BROADCAST_SOURCE_TOO_LARGE` |
| headers per game | 128 | `BROADCAST_SOURCE_TOO_LARGE` |
| total UTF-8 header key+value bytes per game | 32 KiB | `BROADCAST_SOURCE_TOO_LARGE` |

The reader counts bytes before concatenation and aborts on `limit + 1`; the typed
details report resource, limit and `observedAtLeast`, never echo the external body. A
missing stream body is read through a bounded `arrayBuffer` fallback under the same
limit. Boundary fixtures cover exactly-at-limit acceptance, limit+1 refusal, chunk
crossing, abort observation, oversized JSON before parsing, too many games, per-game
overflow and header overflow. No parser sees an over-budget body.

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
| Live-follow: growing source, immutable cuts, move-0 follow and [[D411]] liveness assistance lock | [[D957]], returned `live-following.md` |
| Casting: compose followed cuts with Stream/overlay and the professional workflow; provider/chat/editorial integrations remain the separate absences measured by [[D704]] | [[D958]], returned `casting.md`; sequence already ruled by [[D1272]] |
| Discovery UI beyond URL paste (`/api/broadcast` index, curation, IA placement) | derivation gap 8; a later slice of this lane |
| Variant broadcast imports | returned `variants.md`; Phase A refuses everything except explicit Standard/from-standard-start |

### 6.1 Complete Phase-A browser journey

Phase A is one vertical delivery unit, not a backend union. `/review` keeps one “Bring
in a game” entry and labels its accepted sources: pasted PGN, individual Lichess game,
or finished Lichess broadcast URL. Submitting a round URL produces an in-form board
picker from the closed choice payload; each row shows White, Black and recorded result,
while the stable game id is available in accessible detail rather than used as a label.

The learner then chooses “I played White” or “I played Black” and confirms one explicit
disclosure: Tabiya stores a sanitized local copy, retains source/clock provenance, and
removes third-party comments, evaluations and verdict glyphs. The existing false
“original PGN is stored verbatim” copy is used only for pasted PGN and individual-game
behavior where true; broadcast copy names sanitization. Submit imports exactly once and
opens the resulting Story. A repeat click while pending is disabled and cannot duplicate
the run.

On `BROADCAST_SELECTION_STALE`, the picker refreshes in place, preserves perspective,
announces the change and requires a new explicit selection. Not-finished, unsupported
rules, too-large, unavailable/retry-at, empty choices and annotation-residue refusals
render specific recovery copy; none collapses to “Import failed.” Provider-off makes
URL fetching unavailable while pasted PGN remains usable.

Keyboard order is URL → board choices → perspective → disclosure → submit; the board
choices are a labelled radio group, status updates use a polite live region and errors
receive focus. At 360×680 the picker scrolls inside the form without horizontal
overflow and no board exists yet to shrink or occlude. Browser criteria exercise round
URL, game URL, duplicate names, changed order, stale selection, provider-off, empty,
oversized and keyboard/mobile cases through the real REST client—not a component stub.

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

Unit: able-to-fail criteria; total: 18.

1. **Shared authority:** the generic register accepts exactly one live lane-1
   `import-source-protocol` claim. Server REST/service/storage/account export and web API/client
   compile against its types; AST and SQL-member censuses equal the resource's request/source
   sets. A copied extra member or changed limit fails.
2. **Finished gate:** finished→PGN→same-finished issues a receipt and imports. Future, unknown,
   `ongoing:true`, selected `*`, missing `finishedAt`, or a terminal game inside an ongoing round
   each refuses before `importGame`; spies observe zero record writes and zero evidence jobs.
3. **Receipt drift:** changing `finishedAt`, selected status, game membership or round id between
   observations returns `BROADCAST_SELECTION_STALE`; no receipt is issued. An unchanged display
   order or player label does not change identity.
4. **No false atomicity:** receipt verification recomputes both observation digests and all PGN
   digests. `Last-Modified` mutation alone does not affect validity, and no test or product copy
   calls the receipt atomic, immutable upstream or permanently finished.
5. **Choice protocol:** a round URL without selection returns HTTP 409 with the exact closed
   `BroadcastBoardChoiceRequired`; duplicate player names remain independently selectable by game
   id. Retry with a stale digest yields a fresh 409 choice payload; a direct game URL needs no
   picker round trip.
6. **Parser framing:** the real fixtures produce exactly 10+10 units, while reordered/missing
   `Event`, comment lookalikes, CRLF, arbitrary blanks, header-only and adjacent-`*` fixtures are
   framed by `chessops`, never by regex. Every selected unit still passes `parsePgnMainline`.
7. **Identity join:** missing/duplicate/malformed `GameURL`, duplicate game id, wrong round id,
   observation-only game, PGN-only game and status/result mismatch each fail the whole source.
8. **Move preservation:** the ten finished-fixture imports preserve exact mainline ply counts
   `134,46,60,145,211,88,65,80,75,68` after sanitize/import.
9. **Annotation positive:** the stored broadcast PGN contains none of `{ } ; [% $ ! ?` in
   movetext and none of the measured verdict tokens, including the 61 suffix glyphs. Headers and
   source identities survive.
10. **Annotation controls:** the same raw single game through `kind:pgn` retains its annotations;
    a constructed sanitizer residue throws `BROADCAST_ANNOTATION_RESIDUE`; neither path can make
    the broadcast assertion pass vacuously.
11. **Per-game clocks:** the finished round is framed first, then each game is sanitized
    independently. The exact per-game token vector is
    `134,46,60,144,210,88,65,80,75,0`; only its sum is 902. Duplicate/malformed tokens retain separate
    `{gameId,ply,occurrence,raw}` rows and no token survives stored movetext.
12. **Resource boundaries:** exactly-at-limit fixtures pass and limit+1 fixtures fail for both
    JSON reads, PGN bytes, game count, serialized game bytes, header count and header bytes.
    Chunk-crossing and missing-body fallback tests prove counting before concatenation; abort is
    observed and no parser/storage call occurs after refusal.
13. **Rules/setup:** only explicit `Variant:Standard` with no `SetUp`/`FEN` and canonical standard
    root imports. Missing Variant, `From Position`, Chess960, same-FEN/different-rules and
    missing-FEN Chess960 all return `BROADCAST_RULES_UNSUPPORTED` before storage.
14. **Queue/retry:** two concurrent broadcast resolutions observe non-interleaved complete
    status/PGN/status sequences. Delta/date `Retry-After` values become exact `retryAt`; malformed
    or absent values remain unknown; no background retry runs.
15. **Migration/durable receipt:** pre-landing DB rejects `lichess_broadcast`; the claimed rebuild
    admits exactly the resource source-kind set, preserves old rows byte-identically and still
    rejects unknowns. Its CHECK rejects a broadcast row without `source_receipt_json` and a
    non-broadcast row with one; malformed receipt JSON fails hydration. Account export/import
    round-trips the typed receipt and exact digest/timestamp fields, not a prose reconstruction.
16. **Real REST/browser journey:** through production client and route, round URL → choice →
    perspective → broadcast-specific sanitization disclosure → one import → Story passes. Game URL
    skips choice. The test asserts no duplicate run on repeat submit.
17. **Recovery/accessibility:** stale, unfinished, unsupported-rules, oversized, provider-off,
    empty and unavailable/retry-at states render distinct copy. Full keyboard completion and
    360×680 projection have no horizontal overflow; status/error focus/live-region behavior is
    asserted.
18. **Scope/dependency guard:** no Phase-B stream/follower/liveness field ships; the register,
    bootstrap and migration predecessor are accepted/implemented before this implementation can
    start. The implementing commit closes [[D2277]]–[[D2285]], updates the RFC register and appends
    the exploration log in the same change.

### 7. Ledger rows this RFC closes

Unit: ledger rows; total: 14. [[D410]] — §3's strip-with-assertion at the record
boundary, flips at the implementation commit. [[D412]] — the events-row
clause (§Deviations) plus this RFC's import half; the clause lands with an owner
ruling at acceptance, the import half at implementation. [[D413]] — criterion 8's doc
edit, implementation commit. [[D414]] — already ✅, discharged by execution
2026-08-22 (`tools/d947-broadcast-roundtrip-harness/`); recorded here as the evidence
base. [[D947]] — **partially**: Phase A of the commission; Phase B and casting remain
with D957/D958. [[D2277]]–[[D2285]] close only when criteria 1–18 ship; author repair
alone does not close implementation defects.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Phase B — growing source, immutable cuts, move-0 follow and [[D411]] lock | `live-following.md` / [[D957]] | its accepted implementation | |
| D2 | Casting/professional composition over Phase B, separately integrated per [[D1272]] | `casting.md` / [[D958]] | its accepted implementation | |
| D3 | The [[D412]] events-row clause in `design/03` — law 5, owner ruling at this RFC's acceptance or severed to its own ruling (Open question 3) | OWNER | `planning/live-sources/` | |
| D4 | Phase-A implementation: criteria 1–18, migration, [[D413]] doc edit, [[D410]]/[[D412]] import and [[D2277]]–[[D2285]] flips | codex | work-state queue after acceptance/dependencies | |
| D5 | Register absent `import-source-protocol` and implement the generic shared-resource bootstrap before this RFC's first lane-1 claim | `import-source-protocol-register.md` + `shared-resource-register-bootstrap.md` | register/check receipts | |

## Open questions

1. **Owner at acceptance — the D412 design clause** (§Deviations): ride this
   acceptance or sever to its own ruling.

The former sequencing and facet/kind questions are no longer Phase-A questions.
[[D1272]] separated following from casting; `live-following.md` owns its liveness
facet. This RFC stores the unchanged `sessionKind:"imported"` local copy.

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
- **D958 (landed)** — casting is a separate composition over the existing `stream`
  session + overlay and Phase B's followed cuts, per [[D1272]]; it adds no evidence
  mode and does not gate import/following.
- **D959 (landed)** — 🐞 the paste path stores third-party annotations verbatim
  today: `kind: "pgn"` retains comments (including engine verdicts) in
  `ImportedGameRecord.pgn` — [[D410]]'s trap through the manual door, out of Phase A's
  scope and recorded rather than silently fixed or silently kept.

## Changelog

- 2026-09-06: first author repair for [[D2277]]–[[D2285]]. Current official Lichess
  authority replaces the PGN-result shortcut with a bounded before/after
  `finishedAt` receipt and explicitly refuses atomic/permanent-upstream claims. One
  shared protocol now owns request/result/source vocabulary; board choice is
  digest-bound with stale retry; `chessops` owns framing; clock tokens retain exact
  game/ply/occurrence grain; external JSON/PGN/game/header resources are bounded;
  Phase A admits only explicit Standard/from-standard-start; dependencies match the
  live register; and the complete production REST/browser journey is in the delivery
  unit. Another fresh review is required.
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
