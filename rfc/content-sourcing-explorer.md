# RFC: Lichess opening explorer — rating-band frequency, or a recorded refusal

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/04-content-architecture.md` §2c (pack priority = frequency at 1400–2000 per explorer rating-band data), §8 order item 3 (breadth by explorer-frequency priority)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 (`design/04-content-architecture.md` header); owner ruling 2026-08-12 opening the RFC tier (`rfc/README.md`); exploration question Q6 (`planning/exploration/plan.md:175`)
- **Depends on:** **`rfc/content-sourcing-foundation.md` (B6a)** — manifest, evidence sidecar, deterministic-output rule, `sourcing-check`, record vocabulary, prose-template mechanism. Also `rfc/archive/drill-pack-format.md` (implemented)
- **Parent / amends:** — (B6c; third of four RFCs split out of the withdrawn `content-sourcing-pipelines.md` draft, 2026-08-12)
- **Supersedes / superseded by:** —
- **Planning:** `planning/content-sourcing-explorer/` (once implementing)

## Summary

`design/04-content-architecture.md` §2c fixes anti-opening pack priority by "frequency at
1400–2000 per explorer rating-band data", and nothing in the repo can measure that. This
RFC is the instrument: a rating-band frequency query, an authoring artifact
(`content/candidates/priority.json`) that answers "which pack next" with a number, and the
one and only case in the whole sourcing program where a machine record may support an
authored sentence.

It is also the only one of the four with a **verified live blocker**. On 2026-08-12 both
`explorer.lichess.ovh/lichess` and `explorer.lichess.org/masters` returned **401
Authorization Required** from `server: nginx`, with `access-control-allow-headers`
advertising `Authorization` and no local proxy in the environment. The refusal is Lichess's
own front end, not a transient application error, and it reproduces the 2026-08-11 finding
recorded at `design/research/theory-sourcing.md:39-41,147-150`.

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
| Everything in B6a §1–§3 | `rfc/content-sourcing-foundation.md`. This RFC adds one record kind, one prose template, one emitter and one artifact |
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
GET https://explorer.lichess.ovh/lichess?variant=standard&fen=<standard start FEN>&ratings=1400,1600,1800&speeds=blitz,rapid
Authorization: Bearer <token>
User-Agent: chess-tabiya-sourcing/<version> (+https://github.com/<repo>; <contact>)
```

The status code, response headers, and body prefix are appended to
`planning/exploration/log.md` and the `design/research/theory-sourcing.md` coverage-matrix
row is updated. `429` and `5xx` are retried under B6a §1.4's schedule (60 s / 120 s / 240 s,
max 3) before the probe is considered answered; a persistent `429` is Branch B.

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

```ts
type ExplorerQuery = {
  readonly fen: string;
  readonly ratings: readonly number[];   // Lichess rating buckets, ascending, non-empty
  readonly speeds: readonly string[];    // Lichess speed keys, canonical order, non-empty
};

type ExplorerStats =
  | { readonly kind: "stats"; readonly white: number; readonly draws: number;
      readonly black: number; readonly total: number;
      readonly topMoves: readonly { readonly san: string; readonly uci: string;
                                    readonly white: number; readonly draws: number;
                                    readonly black: number }[];
      readonly since: string; readonly until: string; }   // "YYYY-MM", echoed from the response
  | { readonly kind: "abstention"; readonly reason: "source_unavailable" | "no_data_at_band";
      readonly detail: string };
```

Satisfied by, in order:

1. **Cache** (B6a §1.4). Default max age 30 days; the cache entry's `retrievedAt` is what
   reaches `sources.json`, which is what makes re-emission byte-identical.
2. **Live** `https://explorer.lichess.ovh/lichess?variant=standard&fen=…&ratings=…&speeds=…`
   with a bearer token from `LICHESS_TOKEN`. On `401`/`403` the interface **abstains
   immediately**: no retry, no fallback to a different band, no degradation to a different
   host. Silently answering a 1400–2000 question with 2000–2500 data is the failure mode this
   rule exists to prevent.

There is no third path. `explorerStats` never invents, interpolates, or averages.

`LICHESS_TOKEN` is read from the environment and **never written to any artifact**. A test
asserts no emitted file contains the token value.

### 2. `content/candidates/priority.json` — a priority table, not pack content

One file, rebuilt by `make candidate-emit PIPELINE=explorer ARGS='--lines <file> --ratings
1400,1600,1800 --speeds blitz,rapid'`, where `<file>` is a list of `(eco, name, movesSan)`
rows — in practice the output of B6a's `chess-openings` normalization, which is why B6c lands
after B6a.

```jsonc
{
  "schema": "tabiya.sourcing.priority.v1",
  "status": "available",                 // "available" | "unavailable" (Gate 0 branch B)
  "query": { "ratings": [1400,1600,1800], "speeds": ["blitz","rapid"] },
  "sourcedAt": "2026-08-12T10:44:56Z",   // derived per B6a §1.4, never a wall clock
  "rows": [
    {
      "eco": "B12",
      "name": "Caro-Kann Defense: Advance Variation",
      "movesSan": ["e4","c6","d4","d5","e5"],
      "transposeKey": "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq",
      "total": 128034,
      "whitePct": 51.2, "drawPct": 5.1, "blackPct": 43.7,
      "topMoves": [{ "san": "Bf5", "playedCount": 40204, "sharePct": 31.4 }]
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

### 3. The anti-contamination rule

Explorer output **never enters a pack document** and never reaches the browser. B6a §1.1
gives the mechanism: `spineNode` is closed (`schemas/drill_pack.schema.json:174`) so
per-move data has no legal home, and `provenance` is projected verbatim before play
(`apps/server/src/pack-registry.ts:58`) so smuggling it there would tell a learner the book
move before they choose. Explorer output lives in `evidence.json` as `explorer_frequency`
records and in `priority.json`.

It has exactly two legitimate in-pack effects, both indirect:

1. It can support `/difficulty/minOnlineRapid` and `/difficulty/maxOnlineRapid` — integers in
   a closed object (`schema:97-98`), not prose, and not visible as a move recommendation.
2. It can support one authored sentence, under §4 and nothing else.

`sourcing-check` fails `EVIDENCE_OVERREACH` for an `explorer_frequency` record supporting any
pointer under `/spine`, and fails it unconditionally for `/deviations/*/class`.

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
  playedCount  integer >= 0
  total        integer >= 100          // §2 minimum mass, re-asserted at check time
  sharePct     number, 0 <= x <= 100
  ratings      array of integers, ascending, non-empty   // the exact query parameter sent
  speeds       array of strings, canonical order, non-empty
  since        string, /^\d{4}-\d{2}$/
  until        string, /^\d{4}-\d{2}$/
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
`sharePct` recomputed from `playedCount` and `total` and compared exactly
(`EVIDENCE_VALUES_INVALID` on mismatch); `render(values)` compared to the pack string with
`===` (`EVIDENCE_OVERREACH` on mismatch). `total` is integer-formatted with no separators;
`sharePct` is always one decimal, so `100` renders as `100.0`.

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
  discarded. Nothing queryable-by-game is retained. `design/BACKLOG.md:175` already draws this
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
`spdx: "unlicensed-data"` with `rationale`: "aggregate statistics are facts; the underlying
Lichess game data is CC0", plus the one-request-at-a-time etiquette note from
`design/research/theory-sourcing.md:37-38`. One `provenance.sources[]` string carries the
rationale verbatim. No `provenance.licence` and no `provenance.attribution` — no prose is
borrowed, and the generated sentence in §4 is our own text stating someone else's numbers,
which are facts.

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
   prefix appended to `planning/exploration/log.md` and the
   `design/research/theory-sourcing.md` coverage-matrix row updated. Criteria 2–6 are the
   Branch A set; 7–8 are the Branch B set; 9–20 apply to both.
2. *(A)* A live query at `ratings=1400,1600,1800&speeds=blitz,rapid` returns `200` and
   populates at least one `priority.json` row with `total ≥ 100`.
3. *(A)* Two consecutive `--offline` runs against the cached response produce byte-identical
   `priority.json` (B6a §1.4).
4. *(A)* The anti-Caro Advance position from
   `content/drafts/anti-caro-advance.json:start.fen` produces a row whose `transposeKey`
   equals `transposeKey(pack.start.fen)` computed with the shipped function.
5. *(A)* An `explorer_frequency` record supporting a `feedbackClaims[].text` equal to the §4
   rendering passes `sourcing-check`.
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
11. **Concurrency never exceeds 1** across a B6c run and a concurrently running B6b run.
12. **No band substitution.** With `ratings=1400,1600,1800` stubbed to 401 and
    `ratings=2000,2200` stubbed to 200, the interface abstains and never issues the second
    query.
13. **The token never leaks.** A test sets `LICHESS_TOKEN` to a sentinel and asserts the
    sentinel appears in no emitted file and in no `sources.json` URL.

**Minimum mass and the crossing:**

14. **`total < 100` abstains.** A stubbed response with `total: 61` produces
    `reason: "no_data_at_band"`, `detail: "total 61 < 100"`, and **no** row and **no**
    `explorer_frequency` record.
15. **The template is byte-exact.** A record with `playedCount: 40204, total: 128034` renders
    `sharePct` as `31.4`; the supported text differing by a single character (a trailing
    space, a comma, `31.40`, or a thousands separator in `128034`) fails
    `EVIDENCE_OVERREACH`.
16. **Derived values are recomputed.** A record whose `sharePct` is `31.5` with the same
    counts fails `EVIDENCE_VALUES_INVALID`, even though the rendered string would then match
    itself.
17. **Missing or extra values fail.** A record omitting `speeds`, or carrying an unnamed extra
    value, fails `EVIDENCE_VALUES_INVALID` — the check never falls back to "contains a
    numeral".
18. **Overreach.** An `explorer_frequency` record supporting `/spine/0/annotations/0`,
    `/objective/summary`, or `/deviations/0/class` fails `EVIDENCE_OVERREACH`; a
    `tablebase_result` record carrying `templateId: "explorer-move-share/v1"` fails the same
    way (templates are keyed by `kind`).

**Anti-contamination and hygiene:**

19. **No explorer value appears anywhere in `pack.json`.** A test emits a candidate with
    explorer evidence and asserts that no `total`, `sharePct`, or `topMoves` value occurs in
    the pack document outside a `/difficulty` integer or the §4 generated sentence, and that
    `GET /packs/:id` for it contains no frequency data.
20. `lichess-explorer` → `spdx: "unlicensed-data"` with the §6 rationale and the etiquette
    note present in `sources.json` and verbatim in `provenance.sources[]`; `make verify`
    green; `docs/content-sourcing.md` gains the explorer section including Gate 0's outcome.

## Open questions

None. The token question is not deferred — it is Gate 0 (§0), a task with a defined result
and two fully specified branches. The offline corpus is not deferred either — it is carved
out of this RFC entirely (§5), with the trigger, the five specification requirements, and the
justification burden its future RFC must carry all named here.

## Changelog

- 2026-08-12: created, as B6c of the four-way split of the withdrawn
  `content-sourcing-pipelines.md` draft.
