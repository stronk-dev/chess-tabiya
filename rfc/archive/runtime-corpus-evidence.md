# RFC: Runtime corpus evidence — band frequency and recency in the assistance rail

- **Status:** implemented
- **Author:** claude
- **Created:** 2026-08-14
- **Design refs:** `design/05-in-run-experience.md` §3 rung 4 (line 75: corpus frequency
  "says what happened, not what is good; the classic error is reading popularity as
  quality"), §2 region 4 (lines 57-59, the assistance/evidence rail), §4 (lines 253-257:
  "corpus frequency is rich in the opening and empty by move 40");
  `design/03-product-breadth.md` §Intelligence and explanation (line 225: "corpus
  frequency/outcomes" as a selectable evidence layer at the permitted feedback time,
  lines 231-234 anti-contamination timing), gate **B4** (line 274: "corpus/Syzygy runtime
  rendering … remain unmet");
  `design/BACKLOG.md` "Last-played recency in explorer evidence" (line 196) and
  "Repertoire gap-finding over imported repertoires vs band-explorer coverage"
  (line 205 — enabled by this RFC, not built by it);
  `design/research/adoption-audit.md` row 20 (line 82), §5.1 (lines 186-189, structural
  shortlist #1), §6.1 (lines 206-209: the audit's sharpest weaker-than-incumbent
  finding — "our explorer data is operator-side sourcing only; a 2007 PHP site
  out-ships us on rung 4 today");
  `design/research/teardown-365chess-desk.md` lines 220-229 (the per-position
  frequency + last-played row, nineteen years of survival on that surface)
- **Exploration gate:** owner ruling 2026-08-14 (`planning/exploration/log.md`, final
  entry): four RFC drafts in parallel, register discipline pre-assigned
  predicate-wave-2 → **corpus-evidence** → adoption-wave-1 → social-match; standing
  breadth/exploration rulings of 2026-08-11/12 (`rfc/README.md` lines 64-79)
- **Depends on:**
  `rfc/archive/content-sourcing-explorer.md` (implemented) — the authenticated explorer
  client, its query normalization, enums, the 100-game abstention, and the
  `explorer-move-share/v1` sentence template this RFC reuses
  (`apps/server/src/sourcing/explorer.ts`);
  `rfc/archive/adaptive-guidance.md` (implemented) — `permittedAssistance`
  (`packages/runtime/src/assistance.ts:22-25`), `RunService.guidanceAccess`
  (`apps/server/src/service.ts:642-658`), the versioned per-session-kind assistance
  preference (`apps/web/src/lib/assistance-preference.ts`), and the human-split
  endpoint whose disclosure/role/ephemerality contract this endpoint copies
  (`apps/server/src/rest.ts:906-923`);
  `rfc/archive/explanation-grounds.md` + `rfc/archive/authored-explanation-surface.md`
  (implemented) — `feedbackDisclosed`/`feedbackDeliveryOpen`
  (`packages/runtime/src/feedback.ts:3-28`) and the rule that assistance surfaces
  never weaken the disclosure barriers (`docs/explanation-grounds.md:97-106`);
  `rfc/archive/app-shell.md` (implemented) — the capability registry this RFC extends
  (`apps/server/src/capabilities.ts:47-51`);
  `rfc/archive/pack-optional-runs.md` (implemented) — `attempt_end` position sessions,
  the Just Play surface the browser acceptance runs on
- **Parent / amends:** `rfc/archive/app-shell.md` (capabilities gain a
  `providers.corpus` row); `rfc/archive/adaptive-guidance.md` (the assistance
  preference gains a `corpus` key and moves to version 2; `permittedAssistance` gains a
  `corpus` permission); `rfc/archive/drill-client.md` (the run screen's assistance
  area gains the corpus panel)
- **Supersedes / superseded by:** —
- **Planning:** `planning/runtime-corpus-evidence/` (once implementing)

## Register claims

Verified against `rfc/README.md` as of 2026-08-14, after the pre-assigned first
claimant (`rfc/predicate-wave-2.md`, drafting concurrently and ahead of this draft in
the claim order):

- **Pack schema version: none claimed.** This RFC adds no pack field, no `$defs`, no
  predicate. The next free number stays available to `predicate-wave-2` and later
  siblings.
- **Migration: none claimed.** Nothing here persists: no new table, no run event, no
  run-schema stamp. The corpus page is ephemeral by contract (§5), the preference is
  `localStorage`, and capabilities are derived. The reconciled register assigns
  migration 13 to adoption-wave-1 and 14 to social-match; this RFC leaves both
  untouched. Shipped `STORAGE_VERSION` stays 12.
- **Shared non-register resources claimed here, recorded for the two siblings drafted
  after this one (adoption-wave-1, social-match), who must name this RFC in
  `Depends on:` if they touch any of them:**
  - `AssistanceConfig` moves `version: 1` → `version: 2` with the new `corpus` key
    (§7). Any sibling also editing the assistance preference rebases on version 2.
  - `ServerErrorCode` gains `CORPUS_UNAVAILABLE` (append-only union,
    `apps/server/src/errors.ts:1-46`).
  - `CapabilityProviders` gains `corpus` (§6).
  - The `/runs/:id/…` route-action regex gains `corpus`
    (`apps/server/src/rest.ts:494`).

## Summary

This RFC puts rung-4 corpus evidence in front of the learner at run time: a
run-scoped, disclosure-gated, ephemeral endpoint that serves per-position
band-frequency and last-played recency from the Lichess opening explorer, rendered in
the assistance rail as closed deterministic sentences that always carry their
population and never grade a move. It is B4's corpus-rendering residual and the
adoption audit's #1 honest weakness (row 20 / §6.1): 365chess and Lichess show any
visitor what was played from a position, how often, and how recently; today our
explorer data exists only as an operator-side sourcing tool. The serving path goes
through **one operator service credential** (`LICHESS_TOKEN`, the hosted ruling in
`docs/content-sourcing.md:117-120`), never a learner credential; the interactive
cache/rate posture replaces the batch sourcing client's disk-cache-and-lock
discipline with an in-memory, coalescing, strictly bounded one; and every boundary —
out of book, below the shipped 100-game floor, missing history, revoked token,
absent provider, closed disclosure window — renders honest absence rather than a
number.

## Motivation

**The gap.** `design/03` line 274 has carried "corpus … runtime rendering … unmet"
since B4 was defined, and `docs/explanation-grounds.md:233` lists corpus evidence
sources under "Current boundary". `docs/branch-groups.md:116` states the shipped
posture plainly: "the live explorer is an operator-side sourcing tool, not a runtime
seed source." The adoption audit made this the one place incumbents are honestly
ahead (`adoption-audit.md:206-209`): the per-position frequency + recency row is the
surface a pay-what-you-choose site survived nineteen years on
(`teardown-365chess-desk.md:220-229`), and the carrier surface for the ledgered
recency steal (`design/BACKLOG.md:196`).

**Why now.** The owner's 2026-08-14 ruling opened four parallel drafts and named this
one; it is also the dependency of the ledgered repertoire gap-finding row
(`design/BACKLOG.md:205`). This RFC ships the **source and the rail rendering**;
gap-finding, named-opening catalog browsing (audit row 21), and any Learn-surface
browse UI are out of scope and consume the same server-internal source later. Also
out of scope, unchanged by design: explorer-frequency-sampled *resistance* (the
`docs/branch-groups.md:116` limit stands — corpus-derived opponent choices still
reach runs only through authored packs, per audit row 49's "hold the shipped form"
verdict), and the batch sourcing pipeline itself (§10).

**Why this shape.** The repo already contains every contract this feature needs: an
authenticated, population-explicit explorer client with abstention semantics
(`apps/server/src/sourcing/explorer.ts`), a run-scoped ephemeral assistance seam with
disclosure gating (`human-split`, `docs/explanation-grounds.md:97-106`), a rung
ladder that classifies corpus frequency as "says what happened, not what is good"
(`design/05:75`), and a shipped machine-prose sentence template for exactly this
evidence kind (`explorer-move-share/v1`, `explorer.ts:25,208-210`). The RFC composes
them; it invents no new evidence philosophy.

## Specification

### 1. The corpus source (server-internal)

A new server-internal interface, `CorpusSource`, lives beside the opponent selector
and capabilities provider in `apps/server/src`:

```ts
export interface CorpusQuery {
  readonly fen: string;                       // full FEN of the run node
  readonly ratings: readonly RatingGroup[];   // reuses sourcing enums, explorer.ts:20-21
  readonly speeds: readonly Speed[];          // explorer.ts:22-23
  readonly since: string;                     // YYYY-MM
  readonly until: string;                     // YYYY-MM
}

export type CorpusResult =
  | {
      readonly kind: "stats";
      readonly total: number;                 // white + draws + black
      readonly white: number;
      readonly draws: number;
      readonly black: number;
      readonly moves: readonly {
        readonly san: string;
        readonly uci: string;
        readonly playedCount: number;
        readonly sharePct: number;            // one decimal, pct() rule, explorer.ts:178
      }[];
      readonly recency:
        | { readonly kind: "month"; readonly lastPlayedMonth: string } // YYYY-MM
        | { readonly kind: "absent" };
      readonly population: CorpusPopulation;  // §4
    }
  | {
      readonly kind: "abstention";
      readonly reason: "no_data_at_band" | "source_unavailable";
      readonly detail: string;
      readonly population: CorpusPopulation;
    };

export interface CorpusSource {
  stats(query: CorpusQuery): Promise<CorpusResult>;
}
```

Rules, all inherited from the shipped sourcing client and kept identical so the two
clients cannot drift on meaning:

1. **Query normalization** reuses `normalizeExplorerQuery` (`explorer.ts:52-58`)
   verbatim: unique members of the published `RATING_GROUPS`/`SPEEDS` enums, real
   `YYYY-MM` window with `since <= until`, sorted canonically. Invalid populations
   throw before any request.
2. **Request URL** reuses `explorerUrl` (`explorer.ts:60-74`) with two changes:
   `history` is `"true"` instead of `"false"` (recency, §3), and the `fen` parameter
   is the node FEN normalized to its first four fields via the shipped `transposeKey`
   (`packages/runtime/src/chess.ts:16-19`) with `" 0 1"` appended. Move counters do
   not change explorer statistics; normalizing them makes the cache (§2)
   transposition-stable across nodes that reach the same position.
3. **Counts are derived, never trusted**: total = white + draws + black from
   validated safe non-negative integers, exactly as `parseStats` does
   (`explorer.ts:80-93`). A response failing that validation is **not** an error to
   the caller: the runtime source converts it to
   `{kind: "abstention", reason: "source_unavailable", detail: "invalid explorer response"}`.
   A learner-facing surface degrades; it does not 500 on someone else's JSON.
4. **The 100-game abstention floor is the shipped one**: `total < 100` returns
   `{kind: "abstention", reason: "no_data_at_band", detail: "total N < 100"}`
   (`explorer.ts:91`; `docs/content-sourcing.md:109`).
5. **401/403 abstain immediately as `source_unavailable` and never substitute
   another population** (`explorer.ts:123`; `docs/content-sourcing.md:108-109`).
   There is no anonymous fallback, no wider-band retry, no alternate backend.
6. **Move list**: the request keeps `moves=12`, `topGames=0`, `recentGames=0`
   (`explorer.ts:69-71`); the result's `moves` are ordered by `playedCount`
   descending, ties by SAN ascending. `sharePct` uses the shipped `pct` rounding
   (`explorer.ts:178`).

Two implementations ship:

- **`LichessCorpusSource`** — the real one, wrapping `fetch` against
  `https://explorer.lichess.org/lichess` (`explorer.ts:62`) with the posture in §2.
- **`FixtureCorpusSource`** — the mock-mode one, mirroring
  `fixtureAvailableExplorer` (`explorer.ts:145-152`): it serves a committed fixture
  (stats + a `history` array) for one configured position key and
  `{kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100"}` for
  every other position. It performs no network I/O. The browser acceptance (§12)
  runs on it, exactly as the mock evidence executor stands in for Stockfish today
  (`docs/explanation-grounds.md:199-201`).

### 2. Interactive cache and rate posture

The batch sourcing client's politeness is batch-shaped: a 30-day on-disk cache under
`content/sources/` (`explorer.ts:101-113`), a cross-process `.fetch.lock` with manual
stale-lock recovery, and blocking 60/120/240-second retries on 429/5xx
(`explorer.ts:114-131`; `docs/content-sourcing.md:50-54`). Every one of those is
wrong for a learner waiting on a rail panel. `LichessCorpusSource` replaces them; the
batch client is untouched (§10).

| Concern | Batch sourcing client (unchanged) | Runtime corpus source (this RFC) |
|---|---|---|
| Cache | disk, `content/sources/`, 30 days | in-memory LRU, **512 entries**, **24-hour TTL**, keyed by the exact request URL (which embeds normalized FEN, ratings, speeds, window) |
| Cross-process coordination | `.fetch.lock`, `STALE_LOCK_HELD` | none — the server process is the only caller; **in-process serialization** below |
| Concurrency | serial per process via the lock | identical in-flight requests **coalesce** onto one promise (same cache key); distinct keys enter a FIFO with **at most one upstream request in flight** (serial, per the same Lichess etiquette the sourcing rationale cites, `explorer.ts:24`) and **at most 4 waiting**; a request arriving past that depth abstains immediately as `source_unavailable`, detail `"interactive budget exceeded"` |
| 429/5xx | blocking retries 60/120/240 s | **no blocking retry.** The attempt abstains as `source_unavailable` with the status in `detail`, and a **negative cache entry with a 60-second TTL** is stored for that key so a struggling upstream is not hammered by rail re-opens |
| Other 4xx | fail immediately | abstain as `source_unavailable` (mirrors `explorer.ts:126`) |
| Per-request budget | 5 min lock-scale | **4000 ms** from upstream dispatch; expiry aborts the fetch and abstains as `source_unavailable`, detail `"timeout"` |
| Identity | `user-agent: chess-tabiya-sourcing/…` | same descriptive user-agent string (`explorer.ts:119`) — the deployment identifies itself identically on both paths |

Abstentions from the negative cache and from the budget are indistinguishable to the
client from any other `source_unavailable`: one honest sentence (§8), no spinner
theatre.

The 4000 ms budget runs **from upstream dispatch**, not from arrival, so the
depth cap — not the budget — is the total-latency bound: a request at the back of
a full queue waits at most (1 in flight + 4 queued) × 4000 ms ≈ 20 s before its
own dispatch, and every earlier completion or abort shortens that. There is no
path on which a request waits unboundedly: coalesced waiters settle with the one
promise they joined, queued requests are dispatched FIFO or abstained, and an
aborted fetch settles its waiters with the abstention.

### 3. Recency (the 365chess steal)

The request sets `history=true`. When the response body carries a `history` array of
per-month rows each with a month identifier and white/draw/black counts, the source
validates the rows the same way it validates top-level counts, and derives:

> `lastPlayedMonth` = the newest month in the window whose white + draws + black > 0.

That value is a fact about the requested window and population, and the sentence that
renders it says so (§8). Two honest boundaries:

- **No qualifying month** (history present, all zeros): `recency` is
  `{kind: "absent"}`. Frequency still renders; only the recency line is absent.
- **No history array, or malformed rows**: `recency` is `{kind: "absent"}`. The
  BACKLOG row's own caveat (`design/BACKLOG.md:196`) is that game dates are verified
  `[V]` on `/masters` but the band endpoints still needed verifying — so the
  contract is written to be correct under either answer: history present → recency
  renders; history absent → the recency line honestly disappears and **nothing else
  degrades**. Recency is additive to frequency, never a precondition.

Recency never claims "abandoned", "refuted", "out of fashion", or any theory-drift
conclusion. "Main line until 2019" is the learner's inference to make; the product
states the month.

### 4. Population: whose games these are

Every result carries its population, and every rendered sentence attributes it:

```ts
export interface CorpusPopulation {
  readonly source: "lichess-explorer";
  readonly ratings: readonly RatingGroup[];
  readonly speeds: readonly Speed[];
  readonly since: string;
  readonly until: string;
}
```

Selection rules, deterministic and closed:

- **Rating band.** If the run's applied opponent policy is `human_common` with a
  `targetElo`, ratings = the single bucket containing it: the largest member of
  `RATING_GROUPS` (`explorer.ts:20`) that is ≤ `targetElo` (so targetElo 1500 →
  `[1400]`, 2600 → `[2500]`, 900 → `[0]`). The band evidence then matches the
  opponent the learner is actually rehearsing against. Otherwise ratings = the
  deployment default (below).
- **Deployment defaults**, server configuration with fixed fallbacks:
  ratings `[1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500]` (bucket `0` excluded
  from the default population, includable by configuration), speeds
  `["blitz", "rapid", "classical"]`, window length **36 months**.
- **Window.** `until` = the current month (server clock, UTC); `since` = `until`
  minus (window length − 1) months. Both rendered in the attribution. The window is
  recomputed per request and is part of the cache key (§2), so a month rollover
  changes the key: post-rollover requests can never be served a pre-rollover
  entry, which simply expires unused. The 24-hour TTL governs ordinary freshness
  within one window, not rollover correctness.

No other population is ever substituted (§1 rule 5). If the configured population
yields an abstention, the learner sees the abstention for that population — not a
silently widened query.

### 5. The endpoint: `GET /runs/:id/corpus?nodeId=...`

A new route action `corpus` in the `/runs/:id/…` regex (`apps/server/src/rest.ts:494`),
copying the human-split seam (`rest.ts:906-923`) exactly:

1. **Access**: `service.guidanceAccess(runId, principal, nodeId)`
   (`service.ts:642-658`) — `requireRead` ownership/grant enforcement, node
   resolution (`INVALID_REQUEST` on an unknown node), run projection.
2. **Provider gate**: if no `CorpusSource` is configured, throw the new typed
   `ServerError("CORPUS_UNAVAILABLE", …)` → **HTTP 503**, mirroring
   `VOICE_UNAVAILABLE` (`rest.ts:934`; `docs/adaptive-guidance.md:109-110`).
3. **Disclosure gate**: `permittedAssistance({ sessionKind, deliveryOpen:
   feedbackDeliveryOpen(run), role })` — the function gains a `corpus` permission
   with **exactly the human-split rule** (`packages/runtime/src/assistance.ts:22-25`):
   `free` only for `solo` or `host` while the feedback-delivery window is open;
   otherwise `locked_off` → `ServerError("ASSISTANCE_WITHHELD", …)` → **HTTP 409**.
   Corpus frequency is rung 4: it reveals which moves a population prefers, which is
   exactly the pre-commitment contamination ADR-0006 exists to prevent. Under
   `attempt_end` (all position sessions, `docs/branch-runtime.md:59-64`,
   `service.ts:329,430`) the window **closes again on the next committed move**
   (`packages/runtime/src/feedback.ts:20-28`), and because the corpus page is
   ephemeral, re-locking is real — nothing durable was disclosed
   (`docs/explanation-grounds.md:101-104` states the same property for human-split).
4. **Serve**: call `source.stats` with the node's FEN and the §4 population; return
   HTTP 200 with the `CorpusPage` below. **An abstention is a 200, not an error** —
   it is a result about the world, same as the sourcing artifacts treat it
   (`docs/content-sourcing.md:70-74`).

```ts
export interface CorpusPage {
  readonly nodeId: string;
  readonly result: CorpusResult;          // §1, population always present
  readonly committedMoveSan: string | null; // SAN of the learner-authored child of
                                            // this pre-move node on the active-cursor
                                            // path; null when this node is not an
                                            // active-path ancestor or that child is
                                            // not learner-authored
}
```

**Ephemerality is a contract, not an accident**, identical to human-split
(`docs/explanation-grounds.md:97-106`): the response never becomes run evidence, no
`evidence.attached` event is written, `compare()` payloads
(`docs/explanation-grounds.md:40-70`) are byte-identical before and after any number
of corpus requests, and nothing about the request appears in `/events`. The durable
path for corpus claims remains the authoring-time `explorer-move-share/v1` crossing
(`explorer.ts:25,228-268`), which binds a sentence to a pack with sidecar evidence —
this endpoint does not touch it.

### 6. Capabilities

`CapabilityProviders` (`apps/server/src/capabilities.ts:47-51`) gains a fourth row:

```ts
readonly corpus: "lichess-explorer" | "mock" | "none";
```

- `main.ts` wires `LichessCorpusSource` when `LICHESS_TOKEN` is set (the same
  operator variable the sourcing CLIs read,
  `apps/server/src/sourcing/candidate-attach.ts:32`,
  `candidate-emit.ts:62`) → `"lichess-explorer"`.
- Mock engine mode wires `FixtureCorpusSource` → `"mock"` (parity with the
  `opponent`/`judge` mock rows, `capabilities.ts:98-118`).
- Neither configured → `"none"`; the endpoint returns `CORPUS_UNAVAILABLE` and the
  client renders no corpus preference at all — the voice pattern
  (`docs/adaptive-guidance.md:109-110`: "the client does not show the persona
  preference").

**The credential is the operator's, never the learner's.** The hosted ruling is
explicit (`docs/content-sourcing.md:117-120`): one service/admin credential;
self-hosters may configure their own; a future learner-facing Lichess account link is
a separate identity/import feature and **never a source of per-user credentials**.
Concretely: the token enters only via server environment at process start; the
request handler passes no principal-derived value into `CorpusSource`; the upstream
request carries only the server token and user-agent (`explorer.ts:119` pattern). A
learner's cookie, handle, or grant can influence *whether* the endpoint answers
(authorization, disclosure), never *as whom* the explorer is queried.

The one learner-influenced value in the upstream request is the position itself,
and it is not learner text: the FEN comes from the server's own run graph — a
node that exists only because validated legal moves created it
(`guidanceAccess` resolves `nodeId` to the stored node, `service.ts:642-650`) —
is normalized through the shipped `transposeKey`, and is percent-encoded because
`explorerUrl` builds the request with `URL`/`searchParams.set`
(`explorer.ts:62-74`). There is no string-concatenation path from client input
into the request URL, and a `nodeId` that resolves to no node dies at
`INVALID_REQUEST` before any query is formed.

### 7. Assistance preference, version 2

`AssistanceConfig` (`packages/runtime/src/assistance.ts:3-13`) becomes:

```ts
{
  version: 2,
  markers: "off" | "live",
  guided: "off" | "live",
  humanSplit: "off" | "on_request",
  corpus: "off" | "on_request",
  voice: "authored" | "persona"
}
```

- `SILENT_ASSISTANCE` sets `corpus: "off"`. Silence stays the universal default
  (`design/05` §3a; `docs/adaptive-guidance.md:44`).
- The `localStorage` key string `tabiya.assistance.v1.<kind>`
  (`apps/web/src/lib/assistance-preference.ts:4`) is deliberately unchanged — it is a
  name, not a schema; the `version` field inside the value is the schema.
  `loadAssistance` upgrades a valid stored version-1 object by adding
  `corpus: "off"` and re-freezing as version 2; anything else invalid falls back to
  `SILENT_ASSISTANCE` exactly as today (`assistance-preference.ts:10-13`).
- `permittedAssistance` returns the new `corpus` permission (§5 rule 3). The client
  checkbox mirrors the human-split control verbatim
  (`apps/web/src/lib/DrillScreen.svelte:571-572`): disabled with the honest
  locked-note when `locked_off`, hidden entirely when
  `capabilities.providers.corpus === "none"`.

### 8. Rendering: the rail panel and the closed sentence set

The panel lives in the assistance rail (region 4, `design/05:57-59`), below the
human-split control (`DrillScreen.svelte:809-810` is the pattern: an on-request
button, then rendered sentences). Nothing opens automatically; `corpus:
"on_request"` plus an open window plus a click is the only path. The rendered page
is exactly these deterministic strings — the vocabulary is closed, like the evidence
sentence table (`docs/explanation-grounds.md:159-172`), and no LLM touches it:

**Attribution header (always first, on stats and abstention alike):**

> `Lichess explorer — rating buckets {ratings, comma-joined}; speeds {speeds, comma-joined}; {since} to {until}.`

**The popularity-as-quality guard (always second, byte-fixed):**

> `These counts say what this population played, not what is good.`

This sentence is the rung-4 contract from `design/05:75` made structural: it is not a
tooltip or a footnote toggle, it is an unremovable line of the panel.

**Stats body (kind `stats`):**

> `From this position: {total} games. White wins {whitePct}%, draw {drawPct}%, Black wins {blackPct}%.`

then one row per move, in `playedCount`-descending order, under the fixed subheading
`Most played:` (never "best", "top", or "recommended"):

> `{san} — {playedCount} of {total} games ({sharePct}%).`

Percentages use the shipped one-decimal `pct` rounding (`explorer.ts:178`), the same
arithmetic the strict sourcing checker re-derives for the authored crossing
(`docs/content-sourcing.md:126-128`).

**Committed-move line** (only when `committedMoveSan` is non-null):

- in the response's move list: that row is visually marked, and the panel adds
  > `Your committed move here: {san}.`
- absent from the move list:
  > `Your committed move {san} does not appear among this population's recorded moves.`

That absence line states membership in a recorded list. It is not a judgment — a
brilliant novelty and a blunder render identically — and no wording distinguishes
them.

**Recency line (kind `month`):**

> `Last recorded game in this population: {lastPlayedMonth}.`

**Recency absent** (`{kind: "absent"}` with stats present):

> `No last-played month is available for this window.`

**Abstention body, below floor (`no_data_at_band`):**

> `{total} games recorded here — below the 100-game abstention floor. No frequencies are shown.`

(with `{total}` parsed from the abstention detail; the floor named is the shipped one,
`explorer.ts:91`). This is the "honest absence at move 40" surface: deep in a
middlegame the panel says the book has run out, with the count, instead of
pretending rung 4 still applies (`design/05:253-255`).

**Abstention body, unavailable (`source_unavailable`):**

> `The corpus source is unavailable ({detail}). No frequencies are shown.`

**Forbidden by construction, and the review checklist for the panel:** no verdict
noun or adjective (best/good/strong/dubious/mistake), no ordering or filtering by
anything but `playedCount`, no blending with engine evaluation in one sentence
(365chess renders eval *beside*, not blended — `teardown-365chess-desk.md:227` —
and our rail already renders engine evidence as its own attributed surface), no
difficulty inference, no grading input (`docs/content-sourcing.md:127-128`: explorer
evidence "cannot infer difficulty, grade a deviation, or support any other prose" —
the same law at runtime), no theory-drift conclusions from recency (§3). The panel
renders facts with a population label; the dashboard anti-pattern (`CLAUDE.md` law 8)
is one blurred sentence away and the closed string set is the fence.

### 9. Boundary conditions

The killer class, enumerated:

| Boundary | Behavior |
|---|---|
| Delivery window closed (pre-checkpoint, pre-reveal) | 409 `ASSISTANCE_WITHHELD`; the client button never renders because the permission projection says `locked_off` |
| `attempt_end` re-close: reveal → corpus viewed → move committed | window closes (`feedback.ts:20-28`); next corpus request 409s; nothing durable leaked — same re-close semantics the position-session reveal already has (`docs/explanation-grounds.md:83-85`) |
| Participant or spectator, any time | `locked_off` → 409, identical to human-split (`assistance.ts:23`); a spectator learns a population's preferences from no run they merely watch |
| Unknown `nodeId` | `INVALID_REQUEST` from `guidanceAccess` (`service.ts:646`) |
| Terminal node (mate/stalemate) | valid request; explorer returns few or no games → the abstention path renders; no special case |
| Node FEN with odd counters / transposed move order | `transposeKey` normalization (§1 rule 2) makes cache and query stable |
| Out of book / below floor | `no_data_at_band` abstention with the recorded total (§8) |
| Token revoked mid-session (401/403 upstream) | `source_unavailable` abstention; **no population substitution, no anonymous retry** (§1 rule 5); negative-cached 60 s |
| Upstream 429/5xx/timeout/malformed JSON | `source_unavailable` abstention (§2); never a thrown 500 for a well-formed request |
| Provider absent | 503 `CORPUS_UNAVAILABLE`; preference hidden via capabilities (§6) |
| Interactive burst (N learners, distinct positions) | coalescing + serial upstream + depth-4 queue; overflow abstains honestly (§2) |
| Month boundary during cache lifetime | window recomputed per request and embedded in the cache key, so a pre-rollover entry is unreachable after rollover and expires unused (§2, §4) |
| Mock deployment | `FixtureCorpusSource`; deterministic stats for one position, abstention elsewhere; zero network (§1) |

### 10. What this RFC does not touch

- **The batch sourcing client and its artifacts** — `ExplorerClient`, the disk
  cache, `.fetch.lock`, retry ladder, `sourcing-check`, sidecar evidence records,
  and the `explorer-move-share/v1` authoring crossing are unchanged
  (`docs/content-sourcing.md` remains accurate for that path).
- **Resistance seeding** — the `docs/branch-groups.md:116` limit stands verbatim;
  corpus-derived opponent choices still enter only through authored packs.
- **Run truth** — no event, no evidence kind, no schema field, no migration. The
  run's append-only record is identical whether the corpus panel was opened
  never or fifty times.
- **The pack projection** — `GET /packs/:id` and the anti-contamination boundary
  (`docs/explanation-grounds.md:110-113`) are untouched.
- **Repertoire gap-finding** — enabled (the `CorpusSource` interface is the
  band-coverage oracle its BACKLOG row needs, `design/BACKLOG.md:205`), not built.

## Deviations from design

None. `design/03:225` places corpus frequency among the selectable evidence layers at
the permitted feedback time — this RFC delivers it under `feedbackDeliveryOpen`.
`design/05:75` defines rung 4's failure mode — §8's guard sentence and forbidden set
encode it. The silence default (`design/05` §3a) is preserved: `corpus: "off"`
universally, on-request only. The `design/05` §6.1 open question (where the line
falls between rungs 0 and 2 *during committed play*) is not touched: rung 4 here is
never available during committed play at all.

## Acceptance criteria

Baselines re-verified on this checkout after Predicate Wave 2 archived,
2026-08-14: `make verify` — **416 tests / 70 files, all green**. The browser suite holds **17
Playwright specs** (16 in `tests/browser/drill.spec.ts` plus the env-gated Maia
latency spec in `tests/browser/maia-latency.spec.ts`), of which 16 pass and the
Maia latency check skips, at zero retries (`planning/exploration/log.md:1575`;
`planning/archive/game-import-and-story/log.md:49`). All criteria are additive to
those baselines.

1. **Permission matrix (runtime unit).** `permittedAssistance` returns
   `corpus: "free"` exactly for `solo`/`host` with `deliveryOpen: true`, and
   `locked_off` for every other role/window combination — the same truth table as
   `humanSplit`, tested for all eight combinations.
2. **Disclosure gate (server).** On a `delayed_checkpoint` pack run:
   `GET /runs/:id/corpus` returns 409 `ASSISTANCE_WITHHELD` before the first
   `checkpoint.reached`, 200 after. On an `attempt_end` position run: 409 before
   reveal, 200 after `/reveal`, **409 again after the next committed move**.
3. **Role gate (server).** A granted participant and a spectator on a
   delivery-open run both receive 409; the host receives 200.
4. **Abstention floor (server).** With a fixture response totalling fewer than 100
   games, the endpoint returns 200 with `kind: "abstention"`,
   `reason: "no_data_at_band"`, and the client renders the exact below-floor
   sentence of §8 including the recorded total.
5. **Recency (server).** With a fixture `history` array whose newest non-zero month
   is `2019-04`, the result carries `lastPlayedMonth: "2019-04"`; with the
   `history` key removed from the same fixture, `recency.kind === "absent"` and the
   stats body is unchanged — recency degrades alone.
6. **No population substitution (server).** A 401 upstream yields one upstream
   request (fetcher call count = 1), a `source_unavailable` abstention, and no
   second request with different ratings, speeds, window, or missing token.
7. **Provider absence (server + client).** With no source configured:
   `GET /capabilities` reports `providers.corpus: "none"`, the endpoint returns 503
   `CORPUS_UNAVAILABLE`, and the assistance settings render no corpus control.
8. **Ephemerality (server).** On one run: capture `/events`, `/graph`, and a
   two-branch `/compare` payload; issue three corpus requests; all three captures
   are deep-equal to re-fetches afterward, and no `evidence.attached` event exists
   for any corpus request.
9. **Operator credential only (unit).** The upstream request's headers contain the
   server-configured bearer token and user-agent and nothing derived from the
   requesting principal; constructing the source requires no per-request identity
   parameter (compile-time: `CorpusSource.stats` takes only `CorpusQuery`). The
   request URL is built by the shipped `explorerUrl` (percent-encoded query
   parameters), and a test asserts the `fen` parameter decodes to exactly the
   node's `transposeKey` output plus `" 0 1"` — never a client-supplied string.
10. **Cache posture (unit, fake clock).** Two identical queries → one fetcher call.
    Two concurrent identical queries → one fetcher call (coalescing). TTL expiry →
    refetch. A 429 → abstention now and abstention from negative cache within 60 s
    with no second upstream call, then refetch after. Five concurrent distinct
    queries → serial upstream, and a sixth distinct query past queue depth abstains
    with detail `"interactive budget exceeded"`. No file is created under
    `content/sources/` and no `.fetch.lock` is taken (assert on a temp dir).
11. **Band selection (unit).** targetElo 1500 → ratings `[1400]`; 2600 → `[2500]`;
    900 → `[0]`; no targetElo → the deployment default; window arithmetic produces
    `since`/`until` spanning exactly the configured months, month-arithmetic-safe
    across a year boundary.
12. **Browser acceptance (Playwright, mock deployment, `FixtureCorpusSource`).**
    In Just Play: reach the fixture's known theory position (the QGD position the
    fixture keys on), commit a move, reveal, enable the corpus preference, request
    corpus evidence — the panel shows the attribution header naming rating buckets,
    speeds, and window, the byte-fixed guard sentence, at least one
    `{san} — N of M games (P%)` row, and the recency line. Then continue into the
    fixture's out-of-book territory, reveal, request again — the panel shows the
    below-floor honest-absence sentence with its count and **no** move rows. Zero
    retries.
13. **Preference migration (client unit).** A stored valid version-1 object loads
    as version 2 with `corpus: "off"` and every other field preserved; an invalid
    object still falls back to `SILENT_ASSISTANCE`; the storage key string is
    unchanged.
14. **Sentence closure (client unit).** The corpus panel's renderer is a total
    function over `CorpusPage` whose output strings are drawn from the §8 set only;
    a snapshot test enumerates stats-with-recency, stats-without-recency,
    committed-move-absent, both abstentions, asserts no verdict vocabulary
    (best/good/strong/dubious/mistake/recommended) appears in any output, and
    asserts the §8 guard sentence — byte-identical `These counts say what this
    population played, not what is good.` — is present in every one of the five
    snapshots, stats and abstentions alike.
15. **Suite health.** `make verify` green from the baseline above plus the new
    tests; the browser suite passes at zero retries with the new spec added;
    `docs/` gains the canonical description (a runtime-corpus section alongside the
    existing seams in `docs/explanation-grounds.md`/`docs/adaptive-guidance.md`
    ownership area, and the `docs/branch-groups.md` limits list updated to say the
    runtime **evidence** surface now exists while the seed-source limit stands);
    `rfc/README.md` archive/index rows updated on landing.

## Open questions

None.

## Changelog

- 2026-08-14: created. Register check against `rfc/README.md` (post
  predicate-wave-2 claim order): no pack-schema number claimed, no migration number
  claimed; `AssistanceConfig` v2, `CORPUS_UNAVAILABLE`, `providers.corpus`, and the
  `corpus` route action recorded as cross-draft resources for adoption-wave-1 and
  social-match to depend on if touched.
- 2026-08-14: adversarial review (claude), fixed in place. Migration claim
  corrected: the register's row 13 is *reserved for this draft*, so claiming
  nothing means releasing that reservation (a register edit on landing), not "the
  register's last row remains 12", which was false against the current
  `rfc/README.md`. Baseline corrected: 398 of 399 unit tests pass on this
  checkout (pre-existing `pack-authoring.test.ts:267` candidate-count pin, stale
  since the opening-pack wave), and the 17th Playwright spec lives in
  `maia-latency.spec.ts`, not `drill.spec.ts`. Month-rollover cache semantics
  restated: the recomputed window changes the cache key, so rollover correctness
  never depended on the TTL. Queue latency bounded explicitly (depth cap ×
  budget, no unbounded wait). Credential seam sharpened: the FEN's provenance
  (server run graph, `transposeKey`, `URLSearchParams` percent-encoding) stated
  normatively and asserted in criterion 9; the byte-fixed guard sentence is now
  pinned byte-identical across all renderer snapshots in criterion 14. BACKLOG
  and `rfc/README.md` line cites corrected (196/205, 64-79).
- 2026-08-14: Codex implementation review against the post-Predicate-Wave-2 tree.
  Removed the stale migration-13 release narrative (13/14 are already assigned to
  adoption/social), refreshed the green 416-test/70-file baseline, and made
  `committedMoveSan` deterministic: it is the learner child on the active-cursor
  path from the requested pre-move node, never an arbitrary child at a fork.
- 2026-08-14: implemented and verified. Canonical behavior is in
  `docs/runtime-corpus-evidence.md`, with cross-seam amendments in the adaptive,
  explanation, and branch-group docs. No schema or migration was introduced.
