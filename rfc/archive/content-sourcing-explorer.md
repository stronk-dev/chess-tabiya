# RFC: Lichess opening explorer — rating-band frequency, or a recorded refusal

- **Status:** implemented
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/04-content-architecture.md` §2c (pack priority = frequency at 1400–2000 per explorer rating-band data), §8 order item 3 (breadth by explorer-frequency priority)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 (`design/04-content-architecture.md` header); owner ruling 2026-08-12 opening the RFC tier (`rfc/README.md`); exploration question Q6 (`planning/exploration/plan.md:175`)
- **Depends on:** **`rfc/archive/content-sourcing-foundation.md` (B6a)** — manifest and its `http`/`local-file` origins (§1.2), source-linkage rule (§1.2a), evidence sidecar, the `429`/`5xx` retry schedule (§1.4), deterministic-output rule, `sourcing-check`, record vocabulary, prose-template mechanism. Also `rfc/archive/drill-pack-format.md` (implemented). B6c did not depend on D11 because it emits no played pack.
- **Parent / amends:** — (B6c; third of four RFCs split out of the withdrawn `content-sourcing-pipelines.md` draft, 2026-08-12)
- **Supersedes / superseded by:** —
- **Planning:** `planning/archive/content-sourcing-explorer/`

## Summary

`design/04-content-architecture.md` §2c fixes anti-opening pack priority by "frequency at
1400–2000 per explorer rating-band data", and nothing in the repo can measure that. This
RFC is the instrument: a rating-band frequency query, an authoring artifact
(`content/candidates/priority/priority.json`) that answers "which pack next" with a number, and the
one and only case in the whole sourcing program where a machine record may support an
authored sentence.

It is also the only one of the four with a **verified live blocker**. On 2026-08-12
`explorer.lichess.ovh/lichess`, `explorer.lichess.org/lichess` and
`explorer.lichess.org/masters` all returned **401 Authorization Required** from
`server: nginx`, with `access-control-allow-headers` advertising `Authorization` and no local
proxy in the environment. The refusal is Lichess's own front end, not a transient application
error, and it reproduces the 2026-08-11 finding recorded at
`design/research/theory-sourcing.md:39-41,147-150`.

The published spec agrees that authorization is expected: the operation declares
`security: - OAuth2: []`
(`raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/openingexplorer/lichess.yaml`,
read 2026-08-12), and names `https://explorer.lichess.org` as the server — `.ovh` is the
historical hostname (`design/research/theory-sourcing.md:35-36`). So Gate 0 is not a long
shot: it is testing the mechanism the spec documents.

This RFC therefore does not open with a capability claim. It opens with a **probe gate**
(§0) whose two outcomes are both specified in full, so that "does a token work?" is a task
with a defined result rather than an unresolved question carried into implementation. And it
states plainly what B6c ships **without** an offline corpus backend — which is: no offline
backend at all. The earlier draft named one and specified none of its dump format, build
command, output schema, size boundary or fixture contract. §5 carves it out into a future
RFC with the justification burden it has to carry against `AGENTS.md:93-95`.

## Motivation

Authoring order is arbitrary today. `content/drafts/carlsbad-minority-attack.json:448`
records the cost in the author's own words: the tabiya "is asserted to be a position
1400-2000 players actually reach, on model knowledge alone. The Lichess explorer API could
settle this cheaply." `content/drafts/anti-caro-advance.json:130` carries the same shape of
claim — "Practically common below 2000" — with no citation. Those are frequency assertions,
the one class of statement a machine can actually settle, and the one class this repo cannot
currently settle.

`design/04` §2c's first wave (anti-Caro Advance, anti-French Advance, anti-Sicilian, anti-KID,
anti-London, anti-Dutch) is an ordering assertion of exactly the same kind. Without this
instrument the order is taste.

**Out of scope,** each with a reason:

| Out of scope | Why |
|---|---|
| Everything in B6a §1–§3 | `rfc/archive/content-sourcing-foundation.md`. This RFC adds one record kind, one prose template, one emitter and one artifact |
| An offline table built from `database.lichess.org` monthly dumps | **Carved out**, §5. Not specified here and not shipped here |
| Masters-database queries | The `/masters` endpoint 401s identically (B6a §0) and `design/04` §2c asks for 1400–2000 club data, not master games. Adding it later is a `ratings`-parameter change, not a design change |
| Per-player explorer queries | Personal-history features are ADR-0003 territory and B7-8; this RFC ranks packs, never learners |
| Surfacing priority to a learner | `priority.json` is an authoring artifact. Learner-facing ordering is `/learn`, B7-5 |
| Grading moves with frequency | AGENTS.md law 8. §3 is the anti-contamination rule and §4 the single permitted crossing; nothing else |

## Specification

### 0. Gate 0 — the access probe, and the two branches it selects

**No B6c implementation begins before this probe runs.** One OAuth token is issued from a
Lichess account and exactly one request is made:

```
GET https://explorer.lichess.org/lichess?variant=standard&fen=<standard start FEN>
    &ratings=1400,1600,1800&speeds=blitz,rapid
    &since=2024-01&until=2026-07&moves=12&topGames=0&recentGames=0&history=false
Authorization: Bearer <token>
User-Agent: chess-tabiya-sourcing/<version> (+https://github.com/<repo>; <contact>)
```

Every parameter is sent explicitly, including the ones that have documented defaults, for
three reasons: the cache key is the canonical request (B6a §1.4), so an implicit default that
Lichess later changes would silently change cached meaning; `since`/`until` default to
`1952-01` and `3000-12` and a window that wide is not the claim §4's sentence makes; and
`topGames`/`recentGames` return game references this RFC has no use for and must not retain.

The status code, response headers, and body prefix are appended to
`planning/exploration/log.md` (planning tier, the implementer's own log), and the
`design/research/theory-sourcing.md` coverage-matrix update is **proposed** as a
`design/BACKLOG.md` row quoting the exact replacement text — `design/` is the intent tier and
belongs to the owner (`AGENTS.md:64-68`), so an implementing agent files the row and does not
edit the dossier.

`429` and `5xx` are retried under B6a §1.4's schedule — 60 s / 120 s / 240 s, max 3 retries,
then abstain — before the probe is considered answered; a persistent `429` is Branch B. That
schedule is cited rather than invented: **the previous revision of this RFC cited a B6a retry
policy for `5xx` that B6a did not have** (it specified `429` and `401`/`403` only), so the
policy has been added to B6a §1.4 in the same revision as this sentence, and `4xx` other than
`429` is now explicitly not retried there either.

**Branch A — the token works (`200`).** B6c ships in full: §1's live backend, §2's populated
`priority.json`, §4's prose template with a live producer, and every acceptance criterion
below.

**Branch B — the token does not work (`401`/`403`, or `429` after the full retry schedule).**
B6c ships **reduced**, and everything it ships is still real:

- §1's `explorerStats` interface, cache, and politeness client — with **cache and abstention
  as the only satisfiable paths**.
- §2's `priority.json`, containing only abstention rows with `reason: "source_unavailable"`
  and the recorded HTTP status, and a top-level `"status": "unavailable"`.
- §4's `explorer_frequency` record kind and its prose template, **dormant**: registered in
  `sourcing-check` with no producer, so any hand-written record using it is still validated
  and any attempt to support prose without it still fails closed.
- `docs/content-sourcing.md` states, in the explorer section, that
  `design/04-content-architecture.md` §2c is **unmet**: pack ordering has no evidential basis
  and `design/BACKLOG.md` gains a row saying so.
- The probe result **fires the revival condition already ledgered at
  `planning/exploration/plan.md:262`** — "Q6 revisit shows explorer API insufficient for pack
  spines" — which is the documented trigger for the carve-out RFC in §5.

Branch B is not a failure of this RFC. It is the honest output of an instrument pointed at a
door that is locked, and it is worth building precisely because the alternative is continuing
to assert frequencies from model knowledge, which is what the three existing drafts do.

### 1. `explorerStats` — one interface, two satisfiable paths

The shapes below are taken from the published schema, read live on 2026-08-12 `[V]`:
`doc/specs/tags/openingexplorer/lichess.yaml` (parameters) and
`doc/specs/schemas/OpeningExplorerLichess.yaml` (response), both under
`raw.githubusercontent.com/lichess-org/api/master/`.

**The window is a request parameter, not a response field.** The response object is
`{ opening, white, draws, black, moves[], topGames[], recentGames[], history[] }` and
contains **no** `since` or `until`; `since` and `until` are query parameters
(`in: query`, `type: string`, defaults `1952-01` and `3000-12`). The earlier draft had them
"echoed from the response", which no server does. They are therefore recorded from the
*request* — they are inputs the emitter chose, and provenance records them as such.

```ts
type ExplorerQuery = {
  readonly fen: string;
  readonly ratings: readonly RatingGroup[];  // ascending, unique, non-empty; closed set below
  readonly speeds: readonly Speed[];         // canonical order, unique, non-empty; closed set below
  readonly since: YearMonth;                 // required — no implicit default; since <= until
  readonly until: YearMonth;                 // required — no implicit default
};

// The spec's enum, verbatim. Each value is a group's LOWER BOUND, running to the next value.
type RatingGroup = 0 | 1000 | 1200 | 1400 | 1600 | 1800 | 2000 | 2200 | 2500;

// The spec's Speed enum, verbatim and in its declared order, read live 2026-08-12 [V] from
// raw.githubusercontent.com/lichess-org/api/master/doc/specs/schemas/Speed.yaml
type Speed =
  | "ultraBullet" | "bullet" | "blitz" | "rapid" | "classical" | "correspondence";

// "YYYY-MM" with a real month, checked by pattern and not by parseInt
type YearMonth = string;  // /^\d{4}-(0[1-9]|1[0-2])$/

type ExplorerStats =
  | { readonly kind: "stats";
      // Copied from the response, which counts games by result at this position:
      readonly white: number; readonly draws: number; readonly black: number;
      readonly moves: readonly { readonly uci: string; readonly san: string;
                                 readonly averageRating: number;
                                 readonly white: number; readonly draws: number;
                                 readonly black: number }[];
      // Copied from the REQUEST, not the response:
      readonly window: { readonly since: YearMonth; readonly until: YearMonth };
      readonly ratings: readonly RatingGroup[]; readonly speeds: readonly Speed[]; }
  | { readonly kind: "abstention"; readonly reason: "source_unavailable" | "no_data_at_band";
      readonly detail: string };
```

**`total` and `playedCount` are derived, not read.** The response has no `total` field and no
per-move play count. `total = white + draws + black` at the position;
`playedCount = m.white + m.draws + m.black` for a move `m`. Every downstream number in this
RFC — §2's `total` and `sharePct`, §4's template values — is computed from those two sums and
from nothing else, and `sourcing-check` recomputes both (§4).

**The request grammar is closed, in all three dimensions.** The previous revision left two of
them open — speeds were "Lichess speed keys" in an unnamed "canonical order", and the window
was two unvalidated strings — which meant an emitter could send `speeds=blitz,bltiz`, or
`since=2026-13`, or a window running backwards, and put an unverifiable claim into a citation
that `sourcing-check` would then dutifully compare against the equally wrong request.

- **`ratings`** must be members of the enum above. `1400,1600,1800` covers **1400–1999**,
  because each value is a group lower bound running to the next; that is how
  `design/04-content-architecture.md` §2c's "1400–2000" is encoded, and the half-open interval
  is stated in `priority.json` and in the rendered sentence rather than rounded off in prose. A
  value outside the enum — `1500`, say — is refused by the emitter **before any request** with
  `RATINGS_NOT_A_GROUP`, because the server's behaviour for an unlisted value is not specified
  and guessing it would put an unverifiable band into a citation. Duplicates are refused;
  the list is sorted ascending before the request is built.
- **`speeds`** must be members of the `Speed` enum, which is exactly
  `ultraBullet, bullet, blitz, rapid, classical, correspondence` — read live 2026-08-12 `[V]`
  from <https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/schemas/Speed.yaml>,
  a six-line file whose whole content is that list. **"Canonical order" means that file's
  declaration order**, which is the enum's own ascending-time-control order, and it is not a
  matter of taste: the ordered list goes into the cache key (B6a §1.4), into the request, and
  verbatim into §4's rendered sentence, so two spellings of the same query would mint two cache
  entries and two different sentences describing identical data. Anything off the set, or a
  duplicate, is `SPEEDS_NOT_A_SPEED` **before any request**. A committed copy of `Speed.yaml`
  is the fixture the test pins against, exactly as `ratings` pins against its spec fragment.
- **`since` and `until`** must each match `/^\d{4}-(0[1-9]|1[0-2])$/` — so `2026-13` and
  `2026-00` are refused, which the previous "`YYYY-MM`" prose did not require — and must
  satisfy **`since <= until`** by string comparison, which is exact for this format. A reversed
  window is `WINDOW_INVALID` before any request. The check matters because Lichess's defaults
  are `1952-01`/`3000-12`: a window this code got backwards would not error server-side, it
  would return something, and §4's sentence would then cite a period that never existed.

Satisfied by, in order:

1. **Cache** (B6a §1.4, `body` kind). Default max age 30 days; the cache entry's
   `retrievedAt` is what reaches `sources.json`, which is what makes re-emission
   byte-identical.
2. **Live** `https://explorer.lichess.org/lichess?…` — the host the spec declares — with a
   bearer token from `LICHESS_TOKEN`. On `401`/`403` the interface **abstains immediately**:
   no retry, no fallback to a different band, no degradation to a different host. Silently
   answering a 1400–2000 question with 2000–2500 data is the failure mode this rule exists to
   prevent.

There is no third path. `explorerStats` never invents, interpolates, or averages.

`LICHESS_TOKEN` is read from the environment and **never written to any artifact**. A test
asserts no emitted file contains the token value.

### 2. `content/candidates/priority/` — a priority table, not pack content

Rebuilt by `make candidate-emit PIPELINE=explorer ARGS='--lines <file> --ratings
1400,1600,1800 --speeds blitz,rapid --since 2024-01 --until 2026-07'`, where `<file>` is a
list of `(eco, name, movesSan)` rows — in practice the output of B6a's `chess-openings`
normalization, which is why B6c lands after B6a. **`--since` and `--until` are required and
have no defaults.**

**It is a directory, not a loose file, because it carries a derived timestamp.**
`content/candidates/priority/` holds `priority.json` *and* its own `sources.json`: one
`local-file` entry for the `--lines` input and one `http` entry per explorer response consumed
(B6a §1.2). `priority.json`'s `sourcedAt` is then the same derived maximum every other
artifact's is, recomputable by `sourcing-check`, rather than a timestamp with nothing behind
it — which is what a loose `priority.json` with a `sourcedAt` field would have been.
`sourcing-check` on a directory with no `pack.json` runs the manifest, licence, deny-list and
linkage checks and skips the pack ones. A default would either be the spec's `1952-01`/`3000-12` (a window nobody
means) or "now" (a wall-clock read, which B6a §1.4 forbids in an artifact-producing path).

```jsonc
{
  "schema": "tabiya.sourcing.priority.v1",
  "status": "available",                 // "available" | "unavailable" (Gate 0 branch B)
  "query": {                             // every field is a REQUEST parameter, verbatim
    "ratings": [1400,1600,1800],         // group lower bounds: covers 1400-1999
    "speeds": ["blitz","rapid"],
    "since": "2024-01", "until": "2026-07",
    "moves": 12, "topGames": 0, "recentGames": 0, "history": false
  },
  "sourcedAt": "2026-08-12T10:44:56Z",   // derived per B6a §1.4, never a wall clock
  "rows": [
    {
      "eco": "B12",
      "name": "Caro-Kann Defense: Advance Variation",
      "movesSan": ["e4","c6","d4","d5","e5"],
      "transposeKey": "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq",
      "total": 128034,                   // derived: white + draws + black
      "whitePct": 51.2, "drawPct": 5.1, "blackPct": 43.7,
      "topMoves": [{ "san": "Bf5", "uci": "c8f5",
                     "playedCount": 40204,   // derived: the move's white + draws + black
                     "sharePct": 31.4 }]
    }
  ],
  "abstentions": [
    { "eco": "A80", "name": "Dutch Defense", "reason": "no_data_at_band", "detail": "total 61 < 100" }
  ]
}
```

`rows` is sorted by `total` descending, ties broken by `eco` then `name` ascending — a total
order, so the file is byte-stable. `transposeKey` is computed with the shipped
`transposeKey` (`packages/runtime/src/chess.ts:16`), the same four-field FEN prefix the
opponent selector already indexes spines by (`apps/server/src/opponent-selector.ts:337-347`),
so the table joins to runtime state without a second convention.

Percentages are `Math.round(x * 1000) / 10` of the corresponding count over `total`, stored
as numbers with at most one decimal.

**Minimum mass.** A query whose `total < 100` at the requested band is an **abstention**
(`reason: "no_data_at_band"`), never a row. A frequency claim resting on 61 games is worse
than no claim, because it looks like evidence.

### 2a. `candidate-attach` — how an `explorer_frequency` record reaches a candidate

The previous revision specified exactly one command, and it wrote `priority.json`. Nothing
selected a candidate, nothing mapped a move to a feedback claim, nothing merged a record into
`evidence.json` or an entry into `sources.json`, and nothing recomputed `packDigest` — yet
§Acceptance 5 required an emitted candidate carrying `explorer_frequency` evidence and a
generated sentence. That is the core loop of this RFC, and leaving it to the implementer to
invent is precisely the improvisation the review exists to stop. It is specified here.

```
make candidate-attach DIR=content/candidates/<id> PIPELINE=explorer \
  ARGS='--at-spine-node <id|--root> --move Bf5 --target /feedbackClaims/0/text \
        --ratings 1400,1600,1800 --speeds blitz,rapid --since 2024-01 --until 2026-07'
```

Nine steps, in this order, all deterministic, and **nothing is written until the last one**:

1. **Load and pre-check.** Read `DIR/{pack.json,evidence.json,sources.json}`. All three must
   exist and `sourcing-check DIR` must already pass. A candidate that is not currently valid is
   refused (`CANDIDATE_NOT_CLEAN`) — attachment never repairs, and a merge into a broken
   sidecar produces a record nobody can trust.
2. **Resolve the anchor.** `--at-spine-node <id>` walks the spine from `start.fen` to that
   node and uses the resulting FEN; `--root` uses `start.fen`. An id that does not resolve is
   `ANCHOR_UNRESOLVED`. The anchor is recorded in the record as `{ spineNodeId }` or `{ fen }`.
3. **Query.** `explorerStats` (§1) for that FEN with the §1 request grammar. Cache first,
   live second, no third path.
4. **Abstain, if that is the answer.** On `source_unavailable` or `total < 100`
   (`no_data_at_band`), append **one abstention** to `evidence.json.abstentions` with the
   manifest linkage of B6a §1.2a, write no record, write nothing into `pack.json`, and exit 0.
   An unavailable explorer must not be able to leave a candidate half-attached.
5. **Select the move — the author does, not the emitter.** `--move <san>` must appear in the
   response's `moves[]`; absent, it is `MOVE_NOT_IN_RESPONSE` and nothing is written. The
   emitter never picks the most-played move, because "which move deserves a sentence" is an
   authoring decision and picking it silently would make the tool an author.
6. **Derive.** `playedCount`, `total`, `sharePct` per §1, from the sums and nothing else.
7. **Render and write the one permitted sentence.** `--target` must resolve to an **existing**
   `/feedbackClaims/<i>/text`; any other pointer is `ATTACH_TARGET_FORBIDDEN` — the command
   cannot create a claim, cannot touch `/objective/summary`, `/planClasses`, `/spine`,
   `/deviations` or `/difficulty`, and cannot write anywhere else in the document. The claim's
   `text` is replaced by §4's render, and the replaced text is printed to stderr as a diff so
   an author's own sentence is never silently lost. Overwriting is safe by construction: the
   check re-renders and compares byte-for-byte (§4), so a wrong write cannot become a false
   support — it becomes a failure.
8. **Merge, deterministically.** Append one `explorer_frequency` record with `templateId`,
   `values`, `supports: ["/feedbackClaims/<i>/text"]`, `sourceId: "lichess-explorer"` and the
   `retrievedAt` of the cache entry that answered step 3. Merge the corresponding `http`
   manifest entry into `sources.json`, de-duplicated on `(sourceId, retrievedAt, origin.url)`.
   Records are then sorted by `(kind, templateId, supports[0], sourceId, retrievedAt)` and
   entries by `(sourceId, retrievedAt)`, so the files are byte-stable and re-attachment of the
   same record is idempotent rather than duplicative.
9. **Re-derive, re-check, then write atomically.** Recompute `sourcedAt` (max `retrievedAt`
   over consumed entries) and `packDigest = digestDrillPack(pack)` **after** step 7's prose
   write — the pack's identity changed, so a digest computed before it would be stale on
   arrival. Run the whole of `sourcing-check` in-process against the three in-memory documents;
   **on any failure, write nothing and exit non-zero.** On success, write all three files
   temp-and-rename.

Two properties this shape buys, both of them the reason it is nine steps and not one:
attachment is **idempotent** — re-running it against an unchanged cache reproduces the three
files byte for byte, including `packDigest` — and it is **all-or-nothing**, so no failure mode
leaves a pack carrying a generated sentence with no record behind it, which would be an
uncited machine claim sitting in a learner-facing field.

`priority.json` stays with `candidate-emit PIPELINE=explorer` (§2). The two commands do not
share output: one ranks packs that do not exist yet, the other grounds one sentence in a
candidate that does.

### 3. The anti-contamination rule

Explorer output **never enters a pack document** and never reaches the browser. B6a §1.1a
gives the mechanism: `spineNode` is closed (`schemas/drill_pack.schema.json:174`) so
per-move data has no legal home, and `provenance` is projected verbatim before play
(`apps/server/src/pack-registry.ts:58`, and B6a §1.1's projection table) so smuggling it
there would tell a learner the book move before they choose. Explorer output lives in
`evidence.json` as `explorer_frequency` records and in `priority.json`.

It has exactly **one** legitimate in-pack effect: it can support one authored sentence, under
§4 and nothing else.

**What was removed, and why it was worse than useless.** The previous revision also allowed an
`explorer_frequency` record to support `/difficulty/minOnlineRapid` and
`/difficulty/maxOnlineRapid`, on the reasoning that they are integers in a closed object rather
than prose. The reasoning was about the *field's shape* and the claim is about its *meaning*.
What the explorer measures is **occurrence**: games in a rating band prove that players in that
band reached this position. `difficulty.minOnlineRapid`/`maxOnlineRapid` assert something
different in kind — that this drill is instructionally suitable for players in that band. A
position 1400-rated players reach constantly may be far too hard, or far too easy, to drill at
1400; frequency is silent on both. Deriving a difficulty bound from an occurrence count is
evidence overreach with a number attached, which is the failure `AGENTS.md` law 8 names and the
one the whole grounding contract (B6a §3.3) exists to make mechanically impossible. A machine
record must not be able to launder "they got here" into "this is right for them".

There is no redefinition of the fields that rescues it, either, so none is offered: a
"difficulty band" that means "occurrence band" would be a field whose name lies to every
future reader, and the pack format already spends `difficulty` on the learner-suitability
meaning (`design/00-thesis.md:88-95`'s target-band knobs).

`sourcing-check` therefore fails `EVIDENCE_OVERREACH` for an `explorer_frequency` record
supporting **any** pointer under `/difficulty` or under `/spine`, any prose pointer other than
the §4 target, and — unconditionally, for every kind — `/deviations/*/class`. Difficulty bounds
stay an authored judgement; B6d's `Rating` column remains the only rating-band evidence
anywhere in the system, and it is a statement about solvers, not about this drill (B6a §3.2).

### 4. The single permitted crossing: one pinned prose template

B6a §3.3 ships the prose-template table **empty**, so under B6a alone every attempt to
support an authored sentence with a machine record fails closed. B6c adds the first and only
row. The mechanism is generation plus byte equality, not pattern matching: a check that
looks for "a numeral and a population reference" proves nothing about whether the cited
value, unit, band and statistic correspond, which is why it is not used.

```
kind:          "explorer_frequency"
templateId:    "explorer-move-share/v1"
requiredValues:
  moveSan      string, non-empty
  playedCount  integer >= 0             // derived: the move's white + draws + black
  total        integer >= 100           // derived: the position's white + draws + black;
                                        //   §2 minimum mass, re-asserted at check time
  sharePct     number, 0 <= x <= 100
  ratings      array of RatingGroup, ascending, non-empty  // the exact query parameter sent
  speeds       array of strings, canonical order, non-empty // ditto
  since        string, /^\d{4}-\d{2}$/  // the `since` REQUEST parameter, not a response field
  until        string, /^\d{4}-\d{2}$/  // the `until` REQUEST parameter, not a response field
derived:
  sharePct === Math.round(playedCount / total * 1000) / 10
render(values):
  `${moveSan} is played in ${sharePct.toFixed(1)}% of ${total} games from this position ` +
  `(Lichess explorer, rating buckets ${ratings.join(",")}, speeds ${speeds.join(",")}, ` +
  `${since} to ${until}).`
```

Rendered example, exactly:

```
Bf5 is played in 31.4% of 128034 games from this position (Lichess explorer, rating buckets 1400,1600,1800, speeds blitz,rapid, 2024-01 to 2026-07).
```

`sourcing-check` validates in this order, per B6a §3.3: `templateId` present and registered
for `kind`; every `requiredValues` name present with the declared type, range and format;
`playedCount` and `total` recomputed from the cached response body's per-move and per-position
`white`/`draws`/`black`, and `sharePct` recomputed from those two, each compared exactly
(`EVIDENCE_VALUES_INVALID` on mismatch); `ratings`, `speeds`, `since` and `until` compared to
the request recorded in `sources.json` — a record whose stated window is not the window that
was asked for fails `EVIDENCE_VALUES_INVALID`, which is the check the "echoed from the
response" version of this RFC could not have performed; then `render(values)` compared to the
pack string with `===` (`EVIDENCE_OVERREACH` on mismatch). `total` is integer-formatted with
no separators; `sharePct` is always one decimal, so `100` renders as `100.0`.

The rendered sentence says "rating buckets 1400,1600,1800" rather than "1400–2000" on
purpose: the buckets are what was requested, the half-open interval they cover is documented
in §1, and a sentence that rounds a request into a range is a sentence the check cannot
verify.

The consequence is deliberate and is the point: **a supported sentence is generated, not
approved.** An author who edits one character loses the support and gets
`EVIDENCE_OVERREACH`, which is correct — the edited sentence is no longer the one the numbers
prove. An author who wants to say something *about* the frequency writes a separate,
unsupported sentence and it stays unsupported, exactly like every other causal claim in the
system.

This is the single case where "Stockfish: +0.54 / Maia: 31% / LLM: '…centralizes the knight'"
does not apply, because the sentence **is** the number and nothing else.

**What it still cannot ground.** `content/drafts/anti-caro-advance.json:258-259`'s `tal-tempo`
claim is causal, not frequentist; no explorer record touches it. `:130`'s "Practically common
below 2000" is frequency-shaped but not frequency-*worded*, and cannot be supported as
written — the author replaces it with the generated sentence or keeps it as an unsupported
authored claim. That is the choice this template forces, and forcing it is the design.

### 5. What B6c ships without an offline corpus — and the carve-out

**B6c has no offline backend.** Not a deferred one, not an interface with an unimplemented
arm: none. What ships is §1's two paths, §2's file, §3's rule, §4's template, and in Branch B
a file full of honest abstentions.

The earlier draft listed "offline table built from the CC0 monthly dumps at
`database.lichess.org`" as a *specified* third backend. It was not specified. It named no
dump format, no build command, no output schema, no size boundary, and no fixture contract —
five gaps, any one of which makes it unimplementable. Naming a backend that cannot be built
is worse than having none, because it makes Gate 0's Branch B look survivable when it is not.

**The carve-out.** A separate future RFC — call it `content-sourcing-offline-explorer.md`,
unwritten — may specify it. Its trigger already exists:
`planning/exploration/plan.md:262` defers bulk corpus ingestion with the revival condition
"Q6 revisit shows explorer API insufficient for pack spines", and Gate 0 Branch B *is* that
evidence. It must carry, at minimum:

1. **The dump format**, probed and quoted, not assumed: exact URL, `content-length`,
   compression, and the per-game record layout — the same discipline B6a §0 applied to the
   304 MB puzzle dump.
2. **The build command and its runtime**, including whether the scan is TypeScript or a Go
   worker under the `AGENTS.md` doctrine (`find . -name go.mod` is empty today, so a Go lane
   is itself new work).
3. **The output schema**: what the derived table contains and how `explorerStats` reads it.
4. **A size boundary**: an explicit ceiling on bytes downloaded, bytes retained, and months
   covered, with the decision rule for what is discarded.
5. **A fixture contract**: what CI runs against, given that CI cannot download tens of GB.

And it must carry an **explicit justification against `AGENTS.md:93-95`**, which rejects bulk
corpus ingestion *first*. The argument that could work, stated so the future RFC is held to
it rather than allowed to improvise:

- It is **not first**. B6a and B6b land before it; its trigger is B6c's probe result.
- It is **not a corpus**. The deliverable is a single derived aggregate table keyed by
  `transposeKey`, sized in tens of megabytes; the games are streamed, aggregated, and
  discarded. Nothing queryable-by-game is retained. `design/BACKLOG.md:188` already draws this
  line — "Bulk volume is throughput on a working pipeline, and bulk-ingestion-*first* stays
  rejected."
- Its **revival condition is pre-ledgered**, so it is a planned contingency rather than
  scope creep.

An argument that does *not* work, and should be refused if offered: "we need more data".
`AGENTS.md:93-95` already answers it — "compute is not the limiting factor — neither is
data."

**Until that RFC exists and lands, in Branch B, `design/04-content-architecture.md` §2c is
unmet.** Pack ordering is taste, `priority.json` records that it is, and B6d's puzzle
`Rating` column is the only rating-band evidence anywhere in the system.

### 6. Licence

Explorer responses are aggregate statistics over CC0 Lichess game data
(`design/research/theory-sourcing.md:42-44`, `:102-107`). Encoded per B6a §1.2 as
`basis: "no-rights-asserted"`, `spdx: null`, with `rationale`: "aggregate statistics are
facts; the underlying Lichess game data is CC0", plus the one-request-at-a-time etiquette
note from `design/research/theory-sourcing.md:37-38`. One `provenance.sources[]` string
carries the rationale verbatim.

`provenance.licence` is `"CC-BY-SA-4.0"`, as on every emitted pack (B6a §2 is wholesale).
`provenance.attribution` is absent: nothing is borrowed, and the generated sentence in §4 is
our own text stating someone else's numbers, which are facts. The withdrawn draft's
`spdx: "unlicensed-data"` is not an SPDX identifier and is not used here or anywhere.

## Deviations from design

1. **`design/04-content-architecture.md` §2c's frequency-driven priority is delivered as a
   file, not as a ranking in the product.** `priority.json` is an authoring artifact.
   Surfacing priority to a learner is `/learn` (B7-5).
2. **§2c may not be delivered at all.** Gate 0 Branch B ships an instrument that records its
   own unavailability. The design tier assumes explorer data is obtainable; the live probe
   says it is not, anonymously, from here. This RFC does not paper over the gap with an
   unspecified fallback.
3. **The one authored sentence explorer data can support is *generated*, not approved.**
   `design/04` §2d's pack-contents template treats prose as authored throughout. The template
   in §4 is the single exception, and it is narrower than "an author may cite a frequency":
   the author may keep the generated sentence or lose the citation.

## Acceptance criteria

**Gate 0:**

1. **The probe is run and logged before implementation**, with status code, headers and body
   prefix appended to `planning/exploration/log.md`, and a `design/BACKLOG.md` row filed
   **proposing** the `design/research/theory-sourcing.md` coverage-matrix update with its exact
   replacement text. The implementer does not edit `design/research/` (`AGENTS.md:64-68`).
   Criteria 2–6 are the Branch A set; 7–8 are the Branch B set; 9–24 apply to both.
2. *(A)* A live query at `ratings=1400,1600,1800&speeds=blitz,rapid` returns `200` and
   populates at least one `priority.json` row with `total ≥ 100`.
3. *(A)* Two consecutive `--offline` runs against the cached response produce byte-identical
   `priority.json` **and** `sources.json` (B6a §1.4), and `sourcing-check
   DIR=content/candidates/priority` passes with `sourcedAt` recomputed from the manifest
   rather than accepted as written.
4. *(A)* The anti-Caro Advance position from
   `content/drafts/anti-caro-advance.json:start.fen` produces a row whose `transposeKey`
   equals `transposeKey(pack.start.fen)` computed with the shipped function.
5. *(A)* **The attachment workflow produces the criterion's own subject.**
   `make candidate-attach` (§2a) is run against a B6a-emitted candidate carrying one
   author-written `feedbackClaims[0]`, with `--move` naming a move present in the response. It
   writes §4's rendered sentence into `/feedbackClaims/0/text`, appends one
   `explorer_frequency` record supporting that pointer, merges the `lichess-explorer` manifest
   entry, and rewrites `packDigest` to `digestDrillPack` of the **post-write** pack;
   `sourcing-check DIR` then passes with no `EVIDENCE_DIGEST_STALE` warning. Asserted
   alongside it: re-running the identical command reproduces all three files byte for byte
   (idempotence); a run whose `--move` is absent from the response fails
   `MOVE_NOT_IN_RESPONSE` and leaves all three files **unmodified** (byte-compared before and
   after); a `--target` of `/objective/summary`, `/difficulty/minOnlineRapid`, or a
   `feedbackClaims` index that does not exist fails `ATTACH_TARGET_FORBIDDEN` with nothing
   written; and a candidate that does not already pass `sourcing-check` is refused with
   `CANDIDATE_NOT_CLEAN`.
5a. *(A)* **An unavailable explorer cannot half-attach.** With the backend stubbed to 401 and
    the cache empty, `candidate-attach` writes one abstention, exits 0, and leaves `pack.json`
    byte-identical — no sentence, no record. The same holds for a response summing to `61`
    (`no_data_at_band`).
6. *(A)* A row is emitted for each of `design/04` §2c's first-wave families for which the
   query returns `total ≥ 100`, and the resulting `rows` order is recorded in
   `planning/content-era/log.md` next to §2c's asserted order.
7. *(B)* `priority.json` has `"status": "unavailable"`, zero `rows`, and one abstention per
   queried line with `reason: "source_unavailable"` and the recorded HTTP status in `detail`.
8. *(B)* `docs/content-sourcing.md` states §2c is unmet; `design/BACKLOG.md` gains the row;
   `planning/exploration/plan.md:262`'s revival condition is recorded as fired in
   `planning/exploration/log.md`.

**Access behaviour, both branches:**

9. **A 401 abstains without retrying.** With the live backend stubbed to 401 and the cache
   empty, `explorerStats` returns an abstention with `source_unavailable`, **exactly one**
   HTTP request is issued, and `priority.json` records the abstention rather than a zero row.
10. **A 429 waits.** A stubbed 429 produces a wait of ≥ 60 s before the first retry, at most
    3 retries, then abstains (B6a §1.4).
11. **One request at a time, across processes.** A B6c run and a B6b run started
    simultaneously in the same checkout against an arrival-time-recording stub issue their
    requests strictly sequentially, because both take B6a §1.4's `content/sources/.fetch.lock`.
    The test asserts the ordering *and* asserts the documented limit: with the lock file
    directory made unwritable the client fails loudly rather than proceeding unserialized.
12. **No band substitution.** With `ratings=1400,1600,1800` stubbed to 401 and
    `ratings=2000,2200` stubbed to 200, the interface abstains and never issues the second
    query.
13. **The token never leaks.** A test sets `LICHESS_TOKEN` to a sentinel and asserts the
    sentinel appears in no emitted file and in no `sources.json` URL.

**Request shape, against the published spec:**

14. **Every parameter is explicit.** A test asserts the issued URL carries `variant`, `fen`,
    `ratings`, `speeds`, `since`, `until`, `moves`, `topGames=0`, `recentGames=0` and
    `history=false`, and that the same URL is what `sources.json` records.
15. **`since`/`until` come from the request and are mandatory.** Omitting `--since` or
    `--until` exits non-zero with a named error; a stubbed response body containing invented
    `since`/`until` fields is asserted to be ignored, and `priority.json.query` and every
    `explorer_frequency` record carry the values that were **sent**. A record whose `since`
    differs from the recorded request fails `EVIDENCE_VALUES_INVALID`.
16. **`ratings` is the spec's enum.** `--ratings 1500` and `--ratings 2600` each exit
    non-zero with `RATINGS_NOT_A_GROUP` and issue **no** request; `--ratings 1400,1600,1800`
    proceeds. A test pins the accepted set to `0,1000,1200,1400,1600,1800,2000,2200,2500`
    against a committed copy of the spec fragment.
16a. **`speeds` is the spec's enum, in the spec's order.** `--speeds blitz,bltiz`,
     `--speeds bullet,bullet` and `--speeds hyperbullet` each exit non-zero with
     `SPEEDS_NOT_A_SPEED` and issue **no** request. A test pins the accepted set and its
     canonical order to a committed copy of
     `doc/specs/schemas/Speed.yaml` — `ultraBullet, bullet, blitz, rapid, classical,
     correspondence` — and asserts that `--speeds rapid,blitz` and `--speeds blitz,rapid`
     produce the **same** request URL, the same cache key, and the same rendered sentence, so
     argument order cannot fork the cache or the citation.
16b. **The window grammar is closed.** `--since 2026-13`, `--since 2026-00` and `--since 26-01`
     each fail with a named error before any request; `--since 2026-07 --until 2024-01` fails
     `WINDOW_INVALID`; `--since 2024-01 --until 2024-01` (a one-month window) is accepted, so
     the comparison is `<=` and not `<`.
17. **`total` and `playedCount` are derived, and the derivation is tested against a real
    response body.** A committed fixture response with `white/draws/black` at the position and
    per move yields `total` and `playedCount` equal to independently computed sums; a fixture
    carrying a spurious top-level `total` field is asserted not to be read.

**Minimum mass and the crossing:**

18. **`total < 100` abstains.** A stubbed response summing to `61` produces
    `reason: "no_data_at_band"`, `detail: "total 61 < 100"`, and **no** row and **no**
    `explorer_frequency` record.
19. **The template is byte-exact.** A record with `playedCount: 40204, total: 128034` renders
    `sharePct` as `31.4`; the supported text differing by a single character (a trailing
    space, a comma, `31.40`, or a thousands separator in `128034`) fails
    `EVIDENCE_OVERREACH`.
20. **Derived values are recomputed.** A record whose `sharePct` is `31.5` with the same
    counts fails `EVIDENCE_VALUES_INVALID`, even though the rendered string would then match
    itself.
21. **Missing or extra values fail.** A record omitting `speeds`, or carrying an unnamed extra
    value, fails `EVIDENCE_VALUES_INVALID` — the check never falls back to "contains a
    numeral".
22. **Overreach.** An `explorer_frequency` record supporting `/spine/0/annotations/0`,
    `/objective/summary`, or `/deviations/0/class` fails `EVIDENCE_OVERREACH`; a
    `tablebase_result` record carrying `templateId: "explorer-move-share/v1"` fails the same
    way (templates are keyed by `kind`).
22a. **Frequency cannot reach a difficulty bound.** An `explorer_frequency` record supporting
     `/difficulty/minOnlineRapid` or `/difficulty/maxOnlineRapid` fails `EVIDENCE_OVERREACH`,
     and a test asserts the pipeline writes **no** `/difficulty` value in any emitted or
     attached document. The previous revision permitted this support; games from a rating band
     prove players in that band reached the position and say nothing about whether the drill
     suits them, so the field is closed to this record kind (§3, `AGENTS.md` law 8).

**Anti-contamination and hygiene:**

23. **No explorer value appears anywhere in `pack.json`.** A test attaches explorer evidence to
    a candidate and asserts that no `total`, `sharePct`, or `topMoves` value occurs anywhere in
    the pack document **except** inside the §4 generated sentence — there is no longer a
    `/difficulty` exemption (criterion 22a) — and that `GET /packs/:id` for it contains no
    frequency data outside that one claim, which is not projected at all
    (`apps/server/src/pack-registry.ts:47-74`).
24. `lichess-explorer` → `origin.kind: "http"`, `basis: "no-rights-asserted"`, `spdx: null`,
    with the §6 rationale and the etiquette note present in `sources.json` and verbatim in
    `provenance.sources[]`, and no `attributionRequired`/`shareAlike` key on the `licence`
    object (B6a §1.2 derives both); every emitted candidate carries
    `provenance.licence: "CC-BY-SA-4.0"` and no `attribution`; every attached record and
    abstention links to a manifest entry per B6a §1.2a; `make verify` green;
    `docs/content-sourcing.md` gains the explorer section including Gate 0's outcome.

## Open questions

None.

## Changelog

- 2026-08-12: implemented and approved after independent verification; authenticated
  operator sourcing, priority artifacts, abstention, caching, and candidate attachment are
  folded into `docs/content-sourcing.md`.
- 2026-08-12: implementation began. The exact anonymous canonical request returned HTTP 401
  from nginx with `Authorization` advertised; the owner then supplied a scope-less personal
  operator token through a gitignored environment file, and the identical request returned
  HTTP 200. Gate 0 is Branch A. The token is configuration, never an artifact, and is
  separate from any future learner-facing Lichess account link.

- 2026-08-12: created, as B6c of the four-way split of the withdrawn
  `content-sourcing-pipelines.md` draft.
- 2026-08-12: revised against the per-file review. The record shape was rebuilt against the
  published schemas, read live: `since`/`until` are **query parameters** with defaults
  `1952-01`/`3000-12` and appear nowhere in `OpeningExplorerLichess.yaml`, so the "echoed
  from the response" arm of `ExplorerStats` was wrong and is replaced by a window recorded
  from the request, mandatory `--since`/`--until`, and a check that compares each record's
  window to the request in `sources.json`. Three further corrections fell out of the same
  read: the response has no `total` and no per-move play count (both are now derived sums,
  recomputed at check time); `ratings` is a closed enum of group lower bounds, so
  `1400,1600,1800` means 1400–1999 and an off-enum value is refused before any request; and
  every parameter is now sent explicitly so the cache key cannot drift with a server-side
  default. Also: the spec declares `security: OAuth2` on this operation, which is recorded in
  §Summary as support for Gate 0; the canonical host is `explorer.lichess.org`; the licence
  encoding moved to B6a's `basis: "no-rights-asserted"`; `provenance.licence` is now written
  unconditionally per the wholesale ruling; and the cross-run concurrency criterion now names
  the lock that delivers it.
- 2026-08-12: revised against the second review. (1) **New §2a specifies `candidate-attach`**,
  the workflow that was missing entirely: the previous revision's only command wrote
  `priority.json`, while §Acceptance 5 required a candidate carrying an `explorer_frequency`
  record and a generated sentence, so the core loop of this RFC — select a candidate, resolve
  an anchor, pick a move, render, merge into both sidecars, recompute `packDigest` — was left
  for an implementer to invent. It is now nine ordered steps that are idempotent and
  all-or-nothing, with the failure modes named. (2) **The `/difficulty` support is removed**
  (§3): occurrence in a rating band is not instructional suitability for that band, so
  deriving `minOnlineRapid`/`maxOnlineRapid` from a frequency was evidence overreach with a
  number attached; explorer output now has exactly one legal in-pack effect and
  `EVIDENCE_OVERREACH` covers every `/difficulty` pointer. (3) **The request grammar is
  closed** (§1): `speeds` is pinned to the six-value `Speed` enum read live from
  `doc/specs/schemas/Speed.yaml`, "canonical order" is defined as that file's declaration
  order (it enters the cache key and the rendered sentence, so it was never a free choice),
  and `since`/`until` must be real months with `since <= until` — the previous revision
  accepted `2026-13` and a reversed window. (4) The `5xx` retry policy this RFC cited **did not
  exist** in B6a; it has been added there and is now cited accurately. (5) §0 and
  §Acceptance 1 no longer assign a `design/research/` edit to the implementer; the
  coverage-matrix change is proposed as a `design/BACKLOG.md` row (`AGENTS.md:64-68`).
