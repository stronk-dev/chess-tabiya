# RFC: Repertoire gap-finding

- **Status:** draft
- **Author:** claude (owner: Marco)
- **Created:** 2026-08-14
- **Design refs:** `design/03-product-breadth.md` §Play (From position), §Learn and return;
  `design/research/adoption-audit.md` row 48 / §5.2;
  `design/research/teardown-chessbook-desk.md` §7 (the adoption contract this RFC targets)
- **Exploration gate:** opened by owner ruling 2026-08-12 (E1 met; logged in
  `planning/exploration/log.md`); breadth sequencing ruling 2026-08-11 (`rfc/README.md`)
- **Depends on:** `archive/runtime-corpus-evidence.md` (corpus source and rendering
  discipline), `archive/return-and-progression.md` (attempt projection and scheduler),
  `archive/pack-optional-runs.md` (position runs), `archive/learner-identity-and-authorization.md`
  (owner scoping, account deletion)
- **Parent / amends:** —
- **Supersedes / superseded by:** —
- **Planning:** `planning/repertoire-gap-finding/` (once implementing)
- **Register claims (wave claim #1 of the three-draft wave, 2026-08-14):** migration **15**
  (`STORAGE_VERSION` 14→15). **No pack-schema version is claimed** — a repertoire is
  learner data, not a pack — and **no run-schema version is claimed** — gap entry creates
  ordinary `position` runs and appends no new event kind.

## Summary

This RFC specifies repertoire gap-finding: the learner imports one opening repertoire by
explicit choice (multi-game PGN paste or a public Lichess study URL), the server computes
which opponent replies above the learner's own coverage bound have no repertoire answer,
ranks them by expected games-until-seen at the learner's rating band with population
labels, and offers one entry action — go to the biggest gap — which opens a normal
position run at the gap against Maia resistance at the learner's band. A gap resolves
into played, preserved attempts; the repertoire updates only by the learner's explicit
choice of answer, never automatically. This is the Chessbook adoption contract
(`design/research/teardown-chessbook-desk.md` §7), transformed at item 6 so a gap ends in
play on our loop instead of a card-add. It advances the B4 corpus-evidence layer onto a
second surface and feeds the B7 return loop with position roots the learner demonstrably
needs.

## Motivation

Chessbook proved the shape: position-keyed coverage against a band-filtered human corpus,
a user-set "worth it" bound, and a single biggest-gap button are why it is the default
recommendation in its space (teardown §§1, 3). Its whitespace is ours: no stage of the
gap loop is ever *played* there (teardown §9). The runtime corpus surface this feature
needs shipped in `archive/runtime-corpus-evidence.md`; the import, progression, and
position-run machinery it composes with are all live. What does not exist anywhere in
the tree today, and what this RFC adds:

- No repertoire object. Imports today are one mainline-only game
  (`apps/server/src/pgn-import.ts:26-31` rejects a second game and any variation) into an
  `imported` run, or pack seeds through the studio. Nothing stores a learner's answer per
  position.
- No coverage computation. `docs/runtime-corpus-evidence.md` closes with: "Repertoire
  gap-finding … [is] not implemented here."
- No Lichess *study* fetch. `apps/server/src/import-source.ts:16-29` normalizes single
  game URLs only.

Out of scope, permanently for this surface (not deferred — excluded): linked-account or
bulk game mining (ADR-0003,
`archive/brief-v2/adrs/ADR-0003-personal-history-optional.md`); card/FSRS scheduling
(the scheduler stays the explainable attempt ladder,
`docs/return-and-progression.md` §Return queue — Chessbook's own queue-flood complaint,
teardown §5, is the evidence); chess.com URL fetch (no public per-game contract — same
ruling as `docs/game-import-and-story.md`); any LLM rendering on this surface
(ADR-0005); any pack-document change.

## Specification

### 1. The repertoire object

A **repertoire** is learner-private data: one side, one declared root position, and an
**answer map** from position key to the learner's chosen move(s). The position key is
`transposeKey(fen)` — the first four FEN fields under canonicalization
(`packages/runtime/src/chess.ts:16-19`), the same key run nodes already carry
(`packages/runtime/src/types.ts:89`). Because answers are looked up by key, a reply that
transposes into a known position is covered even if no imported line contained that move
order: transposition correctness is by construction, exactly the teardown §3 mechanism.

**Storage (migration 15, `STORAGE_VERSION` 14→15, `apps/server/src/storage.ts:323`,
appended to the migrations array at `apps/server/src/storage.ts:1997`):**

- `repertoires(id PK, owner_learner_id, name, side CHECK IN ('white','black'),
  root_fen, target_elo INTEGER, coverage_denominator INTEGER CHECK (BETWEEN 10 AND 10000),
  source_kind CHECK IN ('pgn_paste','lichess_study'), source_url NULL, original_pgn BLOB,
  licence_note, digest, created_at, updated_at)`
- `repertoire_moves(repertoire_id, position_key, move_uci, move_san,
  representative_fen, rank INTEGER, origin CHECK IN ('imported','chosen_from_attempt'),
  created_at, PRIMARY KEY (repertoire_id, position_key, move_uci))` — `rank` 0 is the
  mainline answer at that key (first encountered on import; explicit on later choice);
  `representative_fen` is a full FEN with counters reset to `0 1` so the position can be
  re-materialized (a key alone cannot seed a run).
- `repertoire_scans(repertoire_id PK, scanned_at, repertoire_digest, population_json,
  gaps_json, alternate_gaps_json, unknown_json, uncovered_mass REAL,
  truncated INTEGER, source_failures INTEGER, queries_used INTEGER,
  unreached_keys INTEGER)` — exactly one row per repertoire, replaced on each completed
  scan. `unknown_json` holds the unknown-frequency entries of §2 boundary 1 (they are
  normative output and need a persisted home, not a rendering afterthought);
  `unreached_keys` is the §1 count of answer keys the walk never reached.
- `repertoire_gap_runs(run_id PK, repertoire_id, gap_key, created_at)`.

Migration 15 is create-table/index only: no backfill, no run-snapshot stamping, no
existing-table rebuild. It deliberately does **not** widen the
`run_derivations.kind CHECK (kind IN ('flip_sides'))` constraint
(`apps/server/src/storage.ts:2117`): that table is run→run and pinned to
`archive/adoption-wave-1.md`; a gap entry derives from a repertoire, so it gets its own
link table instead of a rebuild of someone else's trust surface. The link is read only
through the repertoire surface (the §4 gap states); it is never merged into
`GET /runs/:id/derivations` (`apps/server/src/service.ts:545`), so each provenance
mechanism keeps exactly one reader and the run→run contract stays byte-identical.

**Versioning and concurrency.** `digest` is the SHA-256 of a canonical serialization of
(side, root key, sorted answer map). Every mutation (`POST …/answers`, settings update)
requires `If-Match: <digest>`; a stale digest returns `REPERTOIRE_STALE` with the current
one — the `pack_drafts` optimistic-concurrency discipline (`docs/pack-studio.md`
§Storage and lifecycle). Scans record the digest they analyzed, so a stale scan is
detectable.

**Import.** `POST /repertoires` with `{name, side, targetElo, coverageDenominator,
source}` where `source` is `{kind:"pgn", pgn}` or `{kind:"lichess_study", url}`.

- A **new parser** `parseRepertoirePgn` (the existing `parsePgnMainline` is unusable
  here by design — `apps/server/src/pgn-import.ts:26-31`) accepts **multiple games
  (study chapters) and variations**, walking the full move tree of each game via the
  shared chessops parser. Variant headers other than `Standard` / `From Position` are
  rejected (mirror of `pgn-import.ts:32-35`). The walk is a depth-first traversal of
  every node's children — mainline and variations alike; `parsePgn` already yields the
  full tree per game — replaying the position along each path. Comments, NAGs, and
  annotation glyphs are parsed by chessops and discarded; they never affect the answer
  map. Every SAN move is legality-checked; the first illegal or unparseable move
  (including null-move tokens) fails the import with game index, ply, and SAN named.
- Limits: at most 64 games/chapters, 10,000 total plies, and 3,000 distinct
  learner-side answer keys; each violated limit is a distinct typed error.
- The **declared root** is the first game's initial position (honouring `SetUp`/`FEN`).
  Other chapters may start anywhere: they contribute answer-map entries by key
  regardless. Chapters whose lines never intersect the corpus-reachable tree still
  import; the scan reports how many answer keys were never reached within the bound
  (persisted as `unreached_keys` — honesty, not an error).
- Only **learner-side** moves become answers: at each position in the imported tree
  where `side` is to move, each played move is recorded at that position's key
  (`rank` by encounter order). Opponent-side moves shape the tree but are never
  answers.
- The Lichess study fetch mirrors the game fetch discipline
  (`apps/server/src/import-source.ts:39-67`): credential-free, serialized behind the
  same module-level chain, 10-second abort, `https://lichess.org/api/study/<id>.pgn`
  with `<id>` an 8-char `[A-Za-z0-9]` segment extracted from a pasted
  `https://lichess.org/study/...` URL; 404 → `IMPORT_SOURCE_NOT_FOUND`, 429/5xx →
  `IMPORT_SOURCE_UNAVAILABLE` with retry-after passthrough. Private studies are
  indistinguishable from missing ones upstream and surface the same 404 error. The
  fetch accepts exactly one explicit study URL: there is no username-based study
  listing and no account-export path on this surface (the ADR-0003 boundary restated
  as an API fact, not just a scope note). Licence note recorded verbatim-style like
  `import-source.ts:60`.
- `original_pgn` retains the exact imported bytes. Re-import replaces the answer map
  wholesale (same endpoint, existing id, `If-Match`); answers with origin
  `chosen_from_attempt` survive a re-import (they are the learner's work product, and
  losing them silently is the killer bug of a replace).

### 2. Gap computation

A **gap** is an opponent reply, at a position reachable under the learner's repertoire,
whose resulting position key has no answer in the answer map, and whose expected
frequency at the learner's band is at or above the learner's coverage bound. Definitions:

- **Population**: `corpusPopulation(target_elo)` (`apps/server/src/corpus.ts:139-146`) —
  the single containing published rating bucket from `RATING_GROUPS`
  (`apps/server/src/sourcing/explorer.ts:20`), default speeds blitz/rapid/classical,
  current UTC month plus preceding 35. One population per scan, recorded in
  `population_json`.
- **Bound**: `1 / coverage_denominator` ("1 in N games"), set by the learner at import
  and editable per repertoire.
- **Frequency arithmetic** (teardown §3, the developer's own model): the root has
  frequency 1. At an opponent-to-move position `p` with path frequency `f`, corpus
  stats at `transposeKey(p)` give each reply `r` the mass
  `f × playedCount(r) / total(p)` (counts, not the rounded `sharePct` of
  `corpus.ts:65`). A reply below the bound is pruned. A reply whose resulting key has
  an answer continues the walk; a reply whose resulting key has no answer **is a gap**
  with that mass. At a learner-to-move position, the walk continues only through the
  `rank` 0 (mainline) answer, carrying frequency unchanged — the learner chooses their
  move, so it costs no probability. Games-until-seen = `round(1 / mass)`.
- **Alternate answers**: non-mainline answers are walked with the `alternate` flag
  instead of a mass — summing mass across the learner's own mutually exclusive choices
  would overstate every downstream number. Gaps found only behind alternate answers land
  in `alternate_gaps_json`, listed after the ranked gaps, without games-until-seen
  numbers, labelled as behind an alternate answer.
- **Merging**: the walk is over positions, memoized by key; when several opponent paths
  reach the same key, their masses add (they are disjoint opponent-choice events) and
  the shortest SAN path from the root is kept as the display line. The same rule merges
  gap masses. Order matters and is pinned: the frontier expands in ply order, so paths
  reaching a key at the same ply merge *before* the key is expanded, and a frontier key
  whose accumulated mass first crosses the bound at merge time expands then — per-path
  pruning never silently drops a key whose merged mass clears the bound. A path that
  arrives at an already-expanded key (a longer transposition) adds its mass to that
  key's recorded entries without re-walking the subtree: downstream masses are then
  understated, never overstated, so games-until-seen stays conservative in the only
  honest direction.
- **The root special case**: if the learner's side is to move at the declared root and
  the answer map has no answer there, the scan returns exactly one gap — the root, mass
  1, "your repertoire has no first move" — and nothing else.

**Boundary conditions (normative, each with specified behavior):**

1. **Abstention propagates.** Corpus abstention at a position — the sub-100-game floor
   (`corpus.ts:55`) or source failure (`corpus.ts:120-122`) — terminates the walk
   there. The subtree is reported as an **unknown-frequency entry** (persisted in
   `unknown_json`) carrying the abstention reason and the floor detail, listed after
   ranked gaps, never silently dropped and never assigned a ranked mass. Unknown is
   never multiplied onward as if it were 1.0 and never rounded to 0 — no product
   involving an abstained node exists, because the walk stops where knowledge stops.
   One number *is* known and rendered as an explicitly labelled upper bound: the path
   mass to the abstention node ("you reach this position in about 1 in N games; beyond
   it the corpus abstains"). Nothing from an unknown-frequency entry is added to
   `uncovered_mass`. A gap below the sample floor says so; it does not pretend to a
   frequency.
2. **A repertoire opponent move absent from corpus rows** has mass 0 at this population:
   pruned. Honest — the learner will not see it at their band; its prepared answer is
   simply unreached (counted in the unreached-keys report of §1).
3. **Cycles.** The corpus-driven walk can revisit keys through repetition. Guards: mass
   strictly decreases through every opponent node with `total ≥ 100` only when
   `share < 1`; forced-move chains (`share = 1`) do not shrink it, so the walk carries a
   hard **ply cap of 60 from the root** and a memo that re-expands a key only to add
   mass, never to re-walk deeper. Hitting the ply cap sets `truncated`.
4. **Query budget.** A scan issues at most **300 corpus queries**, strictly one at a
   time through the shared `LichessCorpusSource` — serial issuance never trips the
   4-item interactive rejection (`corpus.ts:98`) and never starves the in-run corpus
   panel (the single-flight drain at `corpus.ts:103-112` interleaves fairly). The
   512-entry LRU and 24-hour positive TTL (`corpus.ts:124-125, 121`) make a rescan of a
   ≤300-position repertoire nearly free within a day. Exceeding the budget sets
   `truncated` and reports how many frontier positions went unqueried. Mock deployments
   scan against `FixtureCorpusSource` and perform no network I/O.
5. **Terminal positions** (mate/stalemate on a repertoire path): no reply set exists;
   the walk ends there without a gap.
6. **Scan interruption.** The scan is a process-local background job (the
   evidence-queue posture, `docs/game-import-and-story.md` §Results and evidence): it
   writes its single `repertoire_scans` row atomically on completion; an interrupted
   scan leaves the previous row intact and a relaunch re-pays only cold queries.
7. **Stale scans.** `GET …/gaps` compares `repertoire_digest` against the current
   digest and labels the payload `stale: true` when they differ (e.g. an answer was
   added since); it never recomputes on read.

`uncovered_mass` is the sum of ranked gap masses — rendered as "above your 1-in-N bound,
uncovered replies total about X% of your games." On a `truncated` scan (ply cap or query
budget) it is rendered as an explicit lower bound — "at least X%" — because mass the
budget never reached cannot be pretended absent. Individual ranked gaps stay exact
either way: truncation can only hide *further* gaps, never inflate a found one.
Arithmetic over counts; no judgment.

### 3. Rendering discipline — the corpus guard applies

The gap surface is derived entirely from corpus counts, so it inherits the discipline of
`docs/runtime-corpus-evidence.md` §Client contract verbatim: the panel opens with its
population attribution (rating bucket, speeds, month window) and the byte-fixed line
"These counts say what this population played, not what is good." (the shipped
`CORPUS_GUARD` constant, `apps/web/src/lib/corpus-sentences.ts:3`). Every gap row is
closed-vocabulary: opponent reply SAN, the display line, "about 1 in N games at
<population>", and its state. "Gap" and "uncovered" describe the *repertoire's* coverage
— a fact about the learner's data — never the quality of any move; no verdict vocabulary
(good/bad/mistake/weakness/blunder) may appear anywhere on the surface. No LLM renders
any of it (ADR-0005). Unknown-frequency entries render their abstention sentence
("fewer than 100 games at this population" / source failure) plus the labelled
upper-bound sentence of §2 boundary 1 — never a ranked number.

Scan partiality is rendered, not merely stored. When `truncated` is set or
`source_failures > 0`, the panel's summary row states the cause (60-ply cap, 300-query
budget, or source failures) and the count of unqueried frontier positions **before any
gap row renders**, and `uncovered_mass` takes its lower-bound form (§2). A learner must
never read a truncated scan as complete coverage — a deep repertoire that exhausts the
query budget shows "scan stopped after 300 corpus queries; N positions unexplored", not
a quietly short gap list.

Scanning is not in-run assistance: it runs against the learner's own repertoire outside
any run, so the `feedbackDeliveryOpen` withholding rule
(`docs/runtime-corpus-evidence.md` §Delivery and API) does not apply to it. Inside a
gap-entered run, the ordinary in-run corpus panel keeps its own gating unchanged
(`apps/server/src/rest.ts:994-996`).

### 4. The biggest-gap entry action

One button, wired to the top-ranked gap: `POST /repertoires/:id/gaps/enter` with
`{gapKey, resistance?}`.

- The server verifies the key is present in the latest scan, then atomically creates a
  server-named `gap-<UUID>` **position run** — the `flip` precedent,
  `apps/server/src/service.ts:535-540` — with `start.fen` the gap's
  `representative_fen` (learner to move: the gap position is *after* the opponent's
  uncovered reply), `start.side` the repertoire side, `feedbackPolicy: "attempt_end"`,
  and `opponentPolicy` `{mode: "human_common", targetElo: repertoire.target_elo}` —
  Maia resistance at the learner's band, applied via the engine's Elo option
  (`apps/server/src/opponent-selector.ts:448-450`) — plus a `repertoire_gap_runs` row
  in the same transaction. Response: the run id; the client routes to the run screen.
- When Maia is not deployed, capabilities already omit `human_common`
  (`apps/server/src/opponent-selector.ts:390-393`); the client renders the entry button
  with an explicit resistance choice honestly limited to what capabilities report, and
  `resistance: "strong_engine"` is accepted only as the learner's explicit selection.
  The server rejects a request for an unavailable mode with the existing typed error.
- The run is an ordinary run: opponent loop, rewind, branch, comparison, evidence,
  export, and the attempt projection all apply unchanged. Attempts are preserved by
  construction — they are branches of a persisted run.
- Entering the same gap again offers the existing `POST /runs/:id/duplicate` path on the
  linked run instead of minting sibling runs unboundedly; a second `enter` on a key that
  already has a linked run returns the existing run id with `alreadyEntered: true`.

**Gap states**, derived at read time (never stored on the gap):

- `open` — no linked run with a countable attempt;
- `addressed` — a linked run has at least one countable attempt (join
  `repertoire_gap_runs` to the attempts projection; countable per
  `docs/return-and-progression.md` §Durable projection);
- `answered` — the answer map now covers the key (the gap leaves the ranked list at the
  next scan; until then the row renders `answered` against the stale scan).

**Return loop** — verified, no new machinery: a gap-entered run is a `position` run, so
its attempts project under `progressRootKey(sessionKind, null, root.transposeKey)`
(`apps/server/src/service.ts:384`), the automatic scheduler owns its root under the
1/3/7/16/35-day ladder, and it surfaces on `/learn` and `GET /progress/due` like any
other root (`docs/return-and-progression.md` §§Return queue, Client surface). A
resolved gap re-enters the due queue as *that position*, by the machinery that already
exists; this RFC adds no scheduler rule.

### 5. The repertoire updates by choice — never automatically

`POST /repertoires/:id/answers` with `{positionKey, moveUci, ifMatch}` records an answer
with origin `chosen_from_attempt` (or edits `rank` to promote a mainline). The move is
legality-checked against the key's `representative_fen`. The gap panel on a linked run's
attempt-complete surface lists the distinct first moves the learner actually played at
the gap root across that run's branches and offers each as a one-click choice — but the
**server never writes an answer from run data without this explicit call**. There is no
auto-adoption setting, no "accept engine choice", no write triggered by an attempt
result. This is the contract's exceed-clause boundary (teardown §7 item 6) stated as an
invariant.

### 6. HTTP and client surface

Routes (all authenticated, owner-scoped like drafts — `docs/pack-studio.md` §HTTP and
client; registered beside the existing route table in `apps/server/src/rest.ts:722-838`):

- `POST /repertoires` — import (§1). `GET /repertoires` — list (id, name, side, band,
  bound, digest, scan summary). `GET /repertoires/:id` — meta + answer map.
  `DELETE /repertoires/:id`. Settings edits via `PUT /repertoires/:id` with `If-Match`.
- `POST /repertoires/:id/scan` → 202 `{queued: true}`; `GET /repertoires/:id/gaps` →
  latest scan payload (§2) with per-gap states (§4).
- `POST /repertoires/:id/gaps/enter`, `POST /repertoires/:id/answers` (§§4–5).

Unknown request fields fail explicitly (the `POST /runs/import` discipline). Foreign
repertoires are indistinguishable from missing ones (uniform 404, the standing
non-disclosure posture).

Client: a **Repertoire section on `/learn`** — the return surface
(`apps/web/src/lib/router.ts:23-27`; no new route, no router change): import form,
repertoire list, the population-labelled gap list with the fence line, the single
biggest-gap button, and per-gap state badges. The run screen needs only the
attempt-complete answer-choice panel (§5). No mastery number is added anywhere
(`docs/return-and-progression.md` §Client surface holds).

### 7. Privacy and deletion

The repertoire is the learner's own data under the hosted ruling: rows are keyed by
`owner_learner_id`, readable and writable by the owner alone. Corpus queries carry only
position and population — no learner identity reaches Lichess (verified: the upstream
request sends the server token and position URL only, `apps/server/src/corpus.ts:119`).
Study fetches are credential-free public exports. `deleteLearner`
(`apps/server/src/storage.ts:898`) extends to **delete** the learner's `repertoires`,
`repertoire_moves`, and `repertoire_scans` rows outright — unlike packs, nothing here is
published, so there are no bytes to retain. `repertoire_gap_runs` rows are deleted in
the same transaction (migration 15 declares no foreign keys, so nothing "cascades" by
itself — the deletion is explicit), while the runs they pointed at follow the existing
run-deletion semantics unchanged.

## Deviations from design

None. `design/03-product-breadth.md:107` lists study/repertoire import as *pack seeds*
under Create; this RFC additionally imports a repertoire as learner-private data on the
Learn surface, which is the adoption transformation `design/research/adoption-audit.md`
row 48 already records ("imported by choice … no account-level mining") — an addition
inside the breadth map, not a divergence from it.

## Acceptance criteria

1. **Migration:** a version-14 database opens at 15 with the four tables created; a
   fresh database reaches 15; a 15 database refuses to open under 14
   (`storage.ts:1991-1996` posture). Existing migration tests extended.
2. **Import:** a multi-chapter, variation-bearing PGN and a fixture study URL each
   produce the same answer map when their content is identical; a second game sharing a
   position contributes answers at the same key (transposition merge); each limit and
   illegal-move case returns its typed error; chess.com study URLs are refused with the
   paste hint.
3. **Gap math (unit):** on a fixture corpus, path masses multiply and merge as
   specified; same-ply transpositions merge before expansion and a merged mass that
   crosses the bound expands; a longer transposition into an already-expanded key adds
   mass without re-walking; the bound prunes; the mainline-only mass rule holds;
   alternate-answer gaps land unranked; the root-no-answer case returns exactly one
   gap; abstention yields unknown-frequency entries with the floor sentence and the
   labelled upper bound, contributing nothing to `uncovered_mass`; ply cap and query
   budget set `truncated`; serial issuance never exceeds one in-flight corpus request.
4. **Rendering:** the gap panel's first rendered line is the population attribution and
   the byte-fixed fence sentence; a test asserts the absence of verdict vocabulary on
   the surface (the SHAPE_PROSE-style fence test pattern); a truncated fixture scan
   renders the partiality sentence with its unqueried-frontier count before any gap row
   and renders `uncovered_mass` as a lower bound.
5. **Entry:** entering the top gap creates a `position` run at the gap FEN with
   `human_common` at the repertoire's `targetElo` plus the link row, atomically;
   re-entry returns the existing run; unavailable resistance is refused typed;
   attempts on the run flip the gap to `addressed`; an explicit answer call flips it to
   `answered` and the next scan drops it; no code path writes an answer without
   `POST …/answers`.
6. **Return:** a gap-entered run's countable attempt creates a schedule under the
   existing ladder and appears in `GET /progress/due`.
7. **Privacy:** foreign access is uniform-404; account deletion removes all repertoire
   rows and leaves runs governed by existing semantics.
8. **Browser test (mock deployment, zero retries, extending `FixtureCorpusSource` with
   a deterministic table covering the acceptance line — `corpus.ts:130-137` today
   serves only the start position):** import a small repertoire, see ranked gaps with
   population labels and the fence line, press the biggest-gap button, play three plies
   against the mock opponent, return to `/learn`, and see that gap marked
   addressed-by-attempt.
9. Full unit and browser suites stay green from their current baselines.

## Open questions

None.

## Changelog

- 2026-08-14: created; claimed migration 15 in `rfc/README.md` (wave claim #1); no
  pack-schema or run-schema claim.
- 2026-08-14: adversarial review (verified against the working tree at 432/73 green,
  `STORAGE_VERSION` 14, pack 0.13, run 0.10). Fixed in place: `repertoire_scans` gains
  `unknown_json` and `unreached_keys` so the normative boundary outputs have a
  persisted home; walk order pinned (ply-order frontier, merge-before-expand,
  conservative late-merge) so per-path pruning cannot silently drop a merged-mass gap;
  abstention entries carry an explicitly labelled known upper bound and provably never
  enter `uncovered_mass`; truncation now normatively reaches the UI (partiality
  sentence before any gap row, `uncovered_mass` as a lower bound when `truncated`);
  parser spec pinned for comments/NAGs/variation traversal; single-study-URL
  ADR-0003 boundary stated as an API fact; `repertoire_gap_runs` single-reader rule
  added (never merged into `GET /runs/:id/derivations`, `service.ts:545`); deletion
  wording corrected (explicit same-transaction delete, no FK cascade exists).
  Acceptance criteria 3–4 extended to pin the above.
