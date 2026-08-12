# RFC: Content sourcing and grounding pipelines

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/04-content-architecture.md` §2c (explorer-frequency priority), §4 (Syzygy ground truth), §6 (on-ramp puzzle re-cut), §8 (production model, cost discipline); `design/03-product-breadth.md` §Create and curate, gate B6
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + full-content-at-full-breadth ruling 2026-08-11 (`design/04-content-architecture.md` header); program item #6
- **Depends on:** `rfc/archive/drill-pack-format.md` (implemented), `rfc/archive/authored-explanation-surface.md` (implemented — the reveal contract this must not leak around)
- **Parent / amends:** — (first RFC of program item #6; `planning/breadth/create-and-return.md` §A5 slices B6-5/B6-8 are its consumers)
- **Supersedes / superseded by:** —
- **Planning:** `planning/content-sourcing-pipelines/` (once implementing)

## Summary

`design/04-content-architecture.md` commits to hundreds of packs. Today authoring
starts from a blank file: `grep -rniE "explorer|syzygy|tablebase|chess-openings|puzzle"
apps packages workers tools schemas content Makefile package.json` returns **three hits,
none of them code** — two enum strings in `schemas/drill_pack.schema.json:361,446` and one
provenance sentence in `content/drafts/anti-caro-advance.json:269`. There is no HTTP client
for any external source anywhere in production code.

This RFC specifies four sourcing pipelines (lichess `chess-openings`, Lichess opening
explorer, Lichess puzzle database, Syzygy) against the shipped pack schema and the shipped
validation path, and pins the grounding contract that decides which authored fields a
machine can ever validate and which can only ever be reviewed by a human. Its
one-sentence thesis: **the pipelines can supply a pack's geometry, its provenance, and its
priority; they can supply none of its prose, and the encoding must make that impossible to
forget.**

## Motivation

`design/04` §8's cost rule says that if a reviewed pack cannot be produced in a bounded
session, the answer is better tooling, not more hours. The one real hand-authored pack
records what the missing tooling costs: `content/drafts/anti-caro-advance.json:270` states
that *every* strategic claim in it is "agent-authored original prose with NO citation and
NO engine or human validation", and its three `graduationBlockers` (`:273-277`) are all
grounding failures, not encoding failures.

Meanwhile authoring order is arbitrary. `design/04` §2c fixes pack priority by frequency at
1400–2000, and nothing in the repo can measure that.

**Out of scope,** each with a reason:

| Out of scope | Why |
|---|---|
| A `/create` UI, draft store, or pack write endpoint | B6-1. `rest.ts` exposes no POST/PUT/PATCH/DELETE on `/packs`; this RFC's output is files on disk, consumed by `make pack-check` today and by B6-1 later |
| Review queue, sign-off trail, reviewer identity | B6-4. This RFC produces the *record* a reviewer reads; it does not build the queue |
| Session distillation, Lichess study import, PGN game import | B6-5/6/7. Different inputs, same seed shape (`planning/breadth/create-and-return.md` §A4.2), specified there |
| Rendering any of this evidence to a learner | B4/program item #2. `capabilities.ts:33` ships `llm: "none"`, and corpus/Syzygy have no evidence layer. This RFC writes files an author reads, never a response a learner reads |
| Wikibooks / Wikipedia CC BY-SA prose ingestion | `design/research/theory-sourcing.md` §3 shows the two clean postures are "all-original prose" or "declare pack prose CC BY-SA wholesale", and warns that mixing per-paragraph will not survive edits. That is a licensing *ruling* for the owner, not a pipeline; §6.4 below records what the pipelines must do once it is made |
| Bulk corpus ingestion (streamed months, Parquet/DuckDB index) | Rejected-first pattern (`AGENTS.md` §Rejected; `design/BACKLOG.md:161`). Stage 0 only |
| Automatic lesson generation from mined material | ADR-0001. Every artifact here is a candidate for an author |

## Specification

### 0. Verified state of the code

Every claim below is checked, because five earlier drafts died on unverified capability
claims.

| Claim | Evidence |
|---|---|
| No source pipeline of any kind exists | the grep in §Summary; `find . -name "go.mod" -not -path "./node_modules/*"` is empty; the only outbound HTTP in production is `apps/web/src/lib/api.ts:294,474` (browser → own server) |
| Structural + semantic + executable validation ships and is shared | `apps/server/src/pack-validation.ts:182` (`validatePackDocument`), lint at `packages/schema/src/drill-pack/lint.ts:209`, registry entry `apps/server/src/pack-registry.ts:77` |
| Pack identity is a digest over the **whole** document | `packages/schema/src/drill-pack/digest.ts`; RFC 8785 + SHA-256, `docs/drill-pack-format.md:73-78` |
| `perfect_tablebase` is in the schema but **not selectable** | `schemas/drill_pack.schema.json:361` lists it; `apps/server/src/capabilities.ts:10-14` ships `["human_common","strong_engine","theory_strict"]`; anything else fails `UNSUPPORTED_OPPONENT_POLICY` at `pack-validation.ts:127-138` |
| `immediate_blunder_guard` is in the schema but **rejected** | `schemas/drill_pack.schema.json:53` vs `pack-validation.ts:104-111` |
| `outcome.reached` has no producer | declared `packages/runtime/src/types.ts:157`, projection no-op `packages/runtime/src/events.ts:134`, schema `schemas/drill_run.schema.json:449`; no emitter |
| Only `reach_checkpoint` success conditions execute | `pack-validation.ts:160-178`; `apps/server/src/pack-orchestrator.ts:88-100` |
| `atPly` counts plies from the pack's start position | `pack-orchestrator.ts:45` compares `node.ply`; root is `ply: 0` (`packages/runtime/src/runtime.ts:142`), each move `+1` (`:258`) |
| `atSpineNode` only fires when the run's whole move sequence matches a spine path | `pack-orchestrator.ts:21-37` walks `moveUci` level by level and returns `undefined` on the first mismatch |
| `provenance` is projected to the browser **verbatim, before play** | `pack-registry.ts:58` (`provenance: raw.provenance`), inside the same projection whose doc comment (`:42-44`) says authored feedback is never part of it |
| The registry serves every pack it loads, **regardless of `reviewStatus`** | `pack-registry.ts:174` builds `productionPaths` from `content/packs/` with no status filter; `list()` (`:199`) and `get()` (`:203`) do not filter either |
| `jsonFiles` recurses and `fromDocuments` throws on the first invalid document | `pack-registry.ts:97-112`, `:126-133` via `validatedDocument` `:76-87` |
| Stockfish evidence ships with `multiPv: 1` and a 100 ms default movetime | `apps/server/src/strong-engine.ts:10-15`; payload kinds `eval`/`wdl`/`bestline`, source `engine_validated` (`apps/server/src/evidence-queue.ts:316-366`) |
| The strong-engine profile is overridable | `strong-engine.ts:22-31` (`resolveStrongEngineProfile`) |

**Live source probes, 2026-08-12, from this machine.** `[V]`

| Endpoint | Result |
|---|---|
| `explorer.lichess.ovh/lichess?…` | **401**, `server: nginx`, body `401 Authorization Required`, `access-control-allow-headers` includes `Authorization`. No local proxy (`env \| grep -i proxy` empty), so the refusal is Lichess's |
| `explorer.lichess.org/masters?play=e2e4` | **401**, identical |
| `tablebase.lichess.org/standard?fen=…` | **200**, anonymous, returns `{dtz, precise_dtz, dtm, category, moves[]}` |
| `raw.githubusercontent.com/lichess-org/chess-openings/master/b.tsv` | **200**, header `eco\tname\tpgn` |
| `database.lichess.org/lichess_db_puzzle.csv.zst` | **200**, `content-length: 304384407`, `accept-ranges: bytes`, `last-modified: Sun, 02 Aug 2026` |

This confirms `design/research/theory-sourcing.md` §2's residual unknown and hardens it: the
explorer 401 is served by Lichess's own nginx, not by an application layer, so it is not a
transient application error. **Pipeline sequencing in §8 is built around this.**

### 1. One pipeline shape, two artifact kinds, one hard separation

Every pipeline is the same four stages:

```
fetch (cached, licence-tagged)  →  normalize  →  emit candidate  →  hand to an author
```

and produces artifacts in exactly one place:

```
content/candidates/<candidate-id>/pack.json       # a valid DrillPackDefinition, reviewStatus "draft"
content/candidates/<candidate-id>/evidence.json   # the grounding ledger — NEVER part of the pack
content/candidates/<candidate-id>/sources.json    # the fetch manifest — NEVER part of the pack
content/sources/<source-id>/…                     # raw cached bodies (gitignored)
```

**`content/candidates/` is a new directory and must not be `content/drafts/` or
`content/packs/`.** `pack-registry.ts:97-112` recurses into both of those and
`fromDocuments` (`:126-133`) throws `PACK_INVALID` on the first file that is not a valid
pack — so a sidecar dropped in `content/drafts/` crashes the development server at startup,
and a candidate dropped in `content/packs/` is **served to every client** because the
registry applies no `reviewStatus` filter (§0). Add `content/sources/` to `.gitignore`;
`content/candidates/` is committed (same rationale as `content/drafts/README.md`: candidate
review is part of the measured pipeline).

#### 1.1 The load-bearing boundary: where pipeline output may legally live in a v0.2 pack

`schemas/drill_pack.schema.json` sets `additionalProperties: false` on the root (`:72`) and
on `start` (`:119`), `difficulty` (`:106`), `planClass` (`:157`), **`spineNode` (`:174`)**,
`checkpoint` (`:349`), `deviation` (`:431`), and `authoredBoundary` (`:391`). Exactly four
objects accept new keys: `objective` (`:146`), `opponentPolicy` (`:372`), `feedbackClaim`
(`:456`), and `provenance` (`:474`) — the last proven by `graduationBlockers` validating as
untyped extra metadata in `content/drafts/anti-caro-advance.json:273`.

Three consequences, all forced by shipped code:

1. **Per-spine-node machine evidence cannot be stored in a v0.2 pack at all.** `spineNode`
   is closed. Explorer frequencies, tablebase results, and engine evaluations anchored to a
   move have no legal home in the document.
2. **It must not be smuggled into `provenance` either.** `pack-registry.ts:58` ships
   `provenance` to the browser verbatim in `GET /packs/:id`, before a single move is played.
   Per-node frequency data there would tell a learner which move is the book move before
   they choose — the same anti-contamination side channel that
   `rfc/archive/authored-explanation-surface.md` §3 rejected per-node "has content" flags for.
3. **Evidence must not be inside the digest.** `digestDrillPack` canonicalizes the complete
   document including `provenance` (`docs/drill-pack-format.md:73-78`). Refreshing explorer
   data monthly would mint a new pack identity every time and stale every client digest
   checked at `apps/server/src/service.ts:135-140`.

Therefore: **`evidence.json` is a sidecar, keyed to the pack by digest, never merged, never
served.** Exactly *one* thing a pipeline learns goes into the pack document:

- `provenance.sources[]` — licence and attribution strings (`nonEmptyString[]`,
  `schemas/drill_pack.schema.json:465-468`). These *should* reach the browser: an
  attribution obligation the user never sees is not discharged.

**No emitter writes any key the schema does not already name**, in any object, even where
`additionalProperties: true` would permit it. The pack an emitter writes is byte-for-byte a
pack a human could have typed. (`graduationBlockers` is the one apparent exception and is
not one: emitters copy the key an author already uses at
`content/drafts/anti-caro-advance.json:273`, with the same meaning.)

#### 1.2 `sources.json` — the fetch manifest

```jsonc
{
  "schema": "tabiya.sourcing.manifest.v1",
  "entries": [
    {
      "sourceId": "lichess-chess-openings",
      "url": "https://raw.githubusercontent.com/lichess-org/chess-openings/<commit-sha>/b.tsv",
      "retrievedAt": "2026-08-12T10:44:56Z",
      "sha256": "…",                       // of the exact bytes used
      "bytes": 123456,
      "licence": {
        "spdx": "CC0-1.0",                 // closed set; see §1.2 table
        "attributionRequired": false,
        "shareAlike": false,
        "noticeText": null                 // string, required when attributionRequired is true
      }
    }
  ]
}
```

`licence` is **required on every entry** and the emitter refuses to write a candidate if any
entry lacks it. `spdx` is drawn from a closed set — `CC0-1.0`, `CC-BY-SA-4.0`,
`unlicensed-data` — and any other value is an error, not a warning. Sources on
`design/research/theory-sourcing.md` §Do-not-use (TWIC, PGN Mentor, the
`ecochessopeningcodes` compilation, bulk Lichess studies, `calebjcourtney/db.sqlite3`) are a
hard-coded deny list matched on hostname *and* on the `sourceId` vocabulary; a fetch against
one fails with `SOURCE_DENIED` naming the dossier line.

**Attribution encoding, per licence class:**

| `spdx` | Obligation | Encoding, exactly |
|---|---|---|
| `CC0-1.0` | none | one `provenance.sources[]` entry: `` `<what was taken>: <sourceId> (<url>) — CC0-1.0, no attribution required` `` |
| `CC-BY-SA-4.0` | attribution **and** share-alike on derivatives | **refused today** (§6.4): no emitter accepts this SPDX until the owner rules on the whole-pack posture, because per `theory-sourcing.md` §3 there is no per-paragraph posture and provenance tracking will not survive the edits. When the ruling lands, the encoding is `noticeText` mandatory in the manifest and copied verbatim into `provenance.sources[]`, plus a whole-pack declaration — which is the one place this RFC's no-new-keys rule would need amending |
| `unlicensed-data` | none, and the *reason* must be stated | the entry carries the copyright-free rationale verbatim (Syzygy §3.3; explorer aggregates §4) |

#### 1.3 `evidence.json` — the grounding ledger

```jsonc
{
  "schema": "tabiya.sourcing.evidence.v1",
  "packId": "d35-qgd-exchange-carlsbad",
  "packVersion": "0.1.0",
  "packDigest": "sha256:…",                       // the digest at emit time
  "generatedAt": "2026-08-12T10:44:56Z",
  "records": [
    {
      "kind": "opening_identity",                  // closed set, §6.1
      "anchor": { "spineNodeId": "exd5" },         // or { "fen": "…" } or { "pointer": "/feedbackClaims/0" }
      "sourceId": "lichess-chess-openings",
      "retrievedAt": "2026-08-12T10:44:56Z",
      "grounds": "citable_source",                 // "citable_source" | "machine_validation"
      "values": { "eco": "D35", "name": "Queen's Gambit Declined: Exchange Variation" },
      "supports": ["/spine/0/children/0/moveSan"]  // RFC 6901 pointers into pack.json
    }
  ],
  "abstentions": [
    {
      "kind": "tablebase_result",
      "anchor": { "fen": "8/…" },
      "reason": "out_of_range",                    // closed set: out_of_range | source_unavailable
                                                   //   | no_data_at_band | licence_withheld
      "detail": "10 pieces; Syzygy covers <=7"
    }
  ]
}
```

Rules that make this a ledger rather than decoration:

- **`supports` pointers must resolve** in `pack.json`. A record whose pointer does not
  resolve is an error (`EVIDENCE_ANCHOR_BROKEN`).
- **A record may not support a prose pointer whose claim it does not bear on.** Concretely,
  `supports` may not target `/objective/summary`, `/planClasses/*/description`,
  `/spine/**/annotations/*`, or `/deviations/*/note` unless the record's `kind` is
  `explorer_frequency` **and** the supported text is a frequency assertion. §6.3 gives the
  test. Everything else is human-only and the emitter refuses (`EVIDENCE_OVERREACH`).
- **`deviations[*]/class` may never be supported by any record.** No pipeline grades moves
  (Law 8). Attempting it is `EVIDENCE_OVERREACH`.
- **Abstentions are first-class and are written out.** A pipeline that has nothing to say
  says so in the file. Silence is the failure mode this repo keeps rediscovering.
- **Staleness has two severities.** `packDigest` mismatch ⇒ warning
  (`EVIDENCE_DIGEST_STALE`, "re-confirm"); unresolvable anchor ⇒ error. A pack edit must
  not silently invalidate grounding, and must not block on re-fetching either.

#### 1.4 Politeness, caching, and offline determinism

One shared HTTP client, used by every pipeline, with these properties — all of them
required, none of them tunable down:

- **Concurrency 1, globally**, across all pipelines and hosts. `theory-sourcing.md` §2
  quotes the Lichess API spec: "Only make one request at a time."
- **On `429`: sleep ≥ 60 s**, then retry with exponential backoff (60 s, 120 s, 240 s), max
  3 retries, then abstain with `source_unavailable`. Never a tighter interval.
- **On `401`/`403`: do not retry.** Abstain with `source_unavailable` and record the status.
- **`User-Agent` is mandatory and identifying:**
  `chess-tabiya-sourcing/<version> (+https://github.com/<repo>; <contact>)`.
- **Disk cache is the default read path.** Key = SHA-256 of the canonical request
  (method, host, path, sorted query). Entries store body, status, headers, `retrievedAt`.
  Default max age 30 days for explorer/tablebase responses; `chess-openings` and the puzzle
  dump are pinned by commit SHA / `etag` respectively and never expire.
- **`--offline` forces cache-only**, and every emitter runs in CI with `--offline` against
  committed fixtures. Emitting a candidate must be reproducible without a network.
- **No pipeline may run on a request path.** These are CLI-invoked authoring tools. There is
  no server code in this RFC.

### 2. P1 — `lichess-org/chess-openings`: the name↔line skeleton

**Lands first** (§8).

**Input.** Five TSVs `a.tsv`..`e.tsv`, columns `eco`, `name`, `pgn`
(`design/research/theory-sourcing.md` §1, header re-verified live today). Pinned by commit
SHA, never `master`. CC0-1.0.

**Normalization.** Parse `pgn` with `parsePgn` from `chessops/pgn`. `chessops@0.15.1` is
already a production dependency in `packages/schema`, `packages/runtime`, `apps/server`
and `apps/web`, and `packages/runtime/src/pgn.ts:1-7` already imports the *write* half
(`makePgn`, `ChildNode`) in production — but `parsePgn` itself appears only in tests
(`packages/runtime/src/{pgn,pack-pgn,invariants,vertical-scenario}.test.ts`,
`apps/server/src/drill-client-server.test.ts:14`), so this is the first production use of
the ingest side and the first module that must handle malformed third-party PGN. Walk from
the standard start with `chessops/chess`, producing `(uci, san)` per ply; a row whose `pgn`
does not parse or does not walk legally is skipped with a named error, never partially
emitted.

**Emission.** Given a target line (an `eco`+`name`, or a prefix, plus a split ply `k`):

| Pack field | Value | Legality |
|---|---|---|
| `id` | slug of `` `${eco}-${name}` `` lowercased, non-`[a-z0-9]` runs → `-`, leading non-alnum stripped | `^[a-z0-9][a-z0-9-]*$`, `schema:78-81` |
| `version` | `"0.1.0"` | `schema:82-84` |
| `title` | the `name` verbatim | `nonEmptyString` |
| `mode` | `"line"` | `schema:23` |
| `phase` | `"opening"` | `schema:24-26` |
| `start.fen` | FEN after the first `k` plies | legality checked by `lint.ts:218` |
| `start.movesSan` | the first `k` SANs | `schema:113-116` |
| `start.side` | side to move in `start.fen` | `schema:117` |
| `spine` | remaining plies as a single chain; node ids `` `p${k+1+i}-${sanSlug}` `` | `minItems: 1` if present (`schema:39-43`); walked by `lint.ts:228` |
| `objective` | `{ "type": "play_until_checkpoint", "summary": "<mechanical, §5.2>" }` | `schema:121-147`; the only condition-free honest type |
| `checkpoints` | exactly one: `{ "id": "line-end", "trigger": { "atPly": <spine length> }, "actions": [] }` | `minItems: 1` (`schema:44-48`); empty `actions` is the shipped "offers no action" encoding (`docs/drill-pack-format.md:38-41`) |
| `opponentPolicy` | `{ "mode": "theory_strict" }` | `capabilities.ts:10-14` |
| `feedbackPolicy` | `"delayed_checkpoint"` | `pack-validation.ts:112-115` |
| `provenance` | `reviewStatus: "draft"`, one CC0 source string, `reviewers: []`, `graduationBlockers` listing every unwritten assertion category | `schema:458-475` |

**Slug collisions** (two rows normalizing to one id) are resolved by appending `-2`, `-3` in
ascending `(eco, name)` order — deterministic across runs — and the original `eco`/`name` is
recorded verbatim in `provenance.sources` and in `evidence.json`.

**What P1 emits into `evidence.json`:** one `opening_identity` record per emitted spine node,
`grounds: "citable_source"`, supporting only `/spine/**/moveSan` and `/title`. Nothing else.

**Deliberately absent:** no `annotations`, no `planClasses`, no `deviations`, no
`feedbackClaims`, no `concepts`, no `difficulty`. The seed is geometry, per
`planning/breadth/create-and-return.md` §A4.2. `checkpoints[0].trigger` is `atPly` and not
`atSpineNode` on purpose: a single non-`atSpineNode` checkpoint suppresses
`AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` entirely (`lint.ts:54-60`), which is correct for a
seed carrying no prose and becomes the author's problem the moment they add some.

**What P1 could have filled in `content/drafts/anti-caro-advance.json`:** `start.fen`,
`start.movesSan` (`1.e4 c6 2.d4 d5 3.e5` is B12, Caro-Kann Defense: Advance Variation), the
spine geometry of `bf5-main`/`nf3`/`e6`/`be2`/`c5-break` (all named lines), `title`, and the
one source string already sitting at `:269`. It could have filled **none** of the five
annotations, three plan-class descriptions, five deviation notes, two claims, or
`objective.summary`.

### 3. P4 — Syzygy: exact ground truth at ≤7 pieces

**Lands second** (§8).

**Backend.** `https://tablebase.lichess.org/standard?fen=<fen>` — verified anonymous and
answering today (§0). Same politeness rules as everything else (§1.4). A local file mirror
is a configuration swap behind the same interface; `theory-sourcing.md` §5 leaves the
mirror inventory unverified, so this RFC uses the API and states that self-hosting is a
deployment choice, not a capability claim.

**3.1 The range rule, stated before the capability.** Count pieces on the board. If the
count is ≥ 8, **the pipeline emits an abstention** with `reason: "out_of_range"` and
`detail: "<n> pieces; Syzygy covers <=7"`. It does not guess, and it does not silently fall
through.

This is not an edge case. `design/04` §8's batch-1 endgame pack is **4v3 rook endings** —
2 kings + 2 rooks + 7 pawns = **11 pieces**, and the 3v2 reduction is 9. *P4 grounds nothing
at the root of the pack `design/04` names first.* Anyone reading `design/04` §4's "Syzygy
where ≤7 pieces" as covering practical rook endings is reading it wrong, and the pipeline
must make that impossible to miss.

**3.2 What P4 therefore actually grounds: run terminals, not pack roots.** An 11-piece 4v3
rook drill *reduces* into range as pawns trade. So:

- **Position grading** (`kind: "tablebase_result"`, `grounds: "machine_validation"`) is
  offered for any position with ≤7 pieces, whether it is a pack root, a spine node, or a
  position an author pastes in. `values` = `{ category, dtz, precise_dtz, dtm }` copied from
  the response, plus the queried FEN.
- For ≥8 pieces the **only** substitute is the shipped Stockfish judge, and it is labelled
  differently: `kind: "engine_eval"`, `grounds: "machine_validation"`, `values` carrying
  `centipawns`/`mateIn`/`depth` exactly as `evidence-queue.ts:316-341` produces them. It is
  never written as `tablebase_result`, and a claim it supports may never be phrased as an
  exact result.
- **The authoring engine profile is not the runtime profile.** `strong-engine.ts:10-15`
  ships `movetimeMs: 100, multiPv: 1` — adequate for in-run evidence, not for validating an
  authored endgame claim. The pipeline calls `resolveStrongEngineProfile` (`:22-31`) with an
  explicit authoring override and records `movetimeMs`/`depth`/`multiPv` in the record's
  `values`, because an unqualified "the engine says" is exactly the dashboard ADR-0005
  forbids.

**3.3 Licence.** Syzygy *files* are copyright-free — `theory-sourcing.md` §5 quotes the
generator README (Feist in the US, Football Dataco in the EU); the generator's GPL-2.0 binds
the code, not the data. Encoded as `spdx: "unlicensed-data"` with that rationale as the
entry's licence rationale, and as one `provenance.sources[]` string. The Lichess API is a
transport, not a rightsholder.

**3.4 What P4 cannot do.** It cannot select `opponentPolicy.mode: "perfect_tablebase"` —
that value is in the schema (`schema:361`) and **not** in `SUPPORTED_POLICY_MODES`
(`capabilities.ts:10-14`), so `pack-validation.ts:127-138` rejects it with
`UNSUPPORTED_OPPONENT_POLICY`. Endgame candidates therefore ship `strong_engine` (for
convert/hold under best defence) or `human_common` (for practical resistance), and the
choice is the author's, recorded in `graduationBlockers` as an open decision. It also cannot
make `objective.type: "win"`/`"hold"`/`"save"` mechanically checkable: those values validate
(`schema:121-133`) but the only executable success condition is `reach_checkpoint`
(`pack-validation.ts:160-178`) and `outcome.reached` has no producer (§0). Emitted endgame
candidates therefore use `play_until_checkpoint`, and upgrading the objective is an authored
act.

### 4. P2 — Lichess opening explorer: rating-band priority

**Lands third** (§8), because it is the only pipeline with a verified live blocker.

**4.1 Two backends behind one interface, because of the 401.** `explorerStats(fen, band,
speeds)` returns `{ white, draws, black, total, topMoves[] }` or **abstains**. It is
satisfied by, in order:

1. **Cache** (§1.4).
2. **Live** `https://explorer.lichess.ovh/lichess?variant=standard&fen=…&ratings=…&speeds=…`
   with an OAuth bearer token from `LICHESS_TOKEN`. The 401 response advertises
   `Authorization` in `access-control-allow-headers`, so a token is the documented shape of
   the fix — but **no token has been tested against it**, so this RFC does not claim the
   token works. If the live call returns 401/403, the interface abstains; it does not retry
   and does not degrade to a different band.
3. **Offline table** built from the CC0 monthly dumps at `database.lichess.org` (200 today),
   filtered to the rating band, keyed by `transposeKey` — the four-field FEN prefix the
   runtime already computes (`packages/runtime/src/chess.ts:16`). This is
   `theory-sourcing.md` §2's own stated fallback and it is a *specified* backend here, not a
   contingency.

**4.2 What it produces: a priority table, not pack content.**
`content/candidates/priority.json` — one row per queried line: `{ eco, name, movesSan,
transposeKey, band, total, whitePct, drawPct, blackPct, topMoves[] }`, sorted by `total`
descending. This is the artifact `design/04` §2c requires and the repo does not have: it
answers "which anti-opening pack next" with a number.

**4.3 The anti-contamination rule.** Explorer output **never enters a pack document**
(§1.1) and never reaches the browser. It lives in `evidence.json` as
`kind: "explorer_frequency"` records, and in `priority.json`. Its only in-pack effect is
indirect and legitimate: it can justify `difficulty.minOnlineRapid`/`maxOnlineRapid`, and it
is the one machine source that may `support` a prose pointer — see §6.3.

**4.4 Minimum mass.** A record with `total < 100` at the requested band is emitted as an
abstention (`reason: "no_data_at_band"`), not as a frequency. A frequency claim resting on
nine games is worse than no claim.

**4.5 What P2 could have filled in `content/drafts/anti-caro-advance.json`:** whether
`bf5-main` or `c5-immediate` deserves to be root #1; and the pack's one explicitly
frequency-shaped sentence, `:130` — "Practically common below 2000" — which is today an
uncited model assertion and is exactly the kind of claim P2 can convert into
`corpus_observed`. It could not have grounded `tal-tempo` (`:259`), which is causal, not
frequentist.

### 5. P3 — Lichess puzzle database: the on-ramp, re-cut

**Lands fourth** (§8).

A correction worth recording, since it changes where the constraint comes from: `AGENTS.md`
§Rejected does **not** name a puzzle trainer (`grep -i puzzle` over that section is empty).
The prohibition is design-tier and explicit — `design/00-thesis.md:70` ("not an auto-puzzle
feed") and `:93-94` ("**Explicitly not:** a tactics puzzle trainer or lesson content. The
1000→1400 tactics-volume leg is well served free elsewhere") — with the positive form at
`design/04` §6. So this pipeline is not forbidden; it is constrained in shape. The re-cut in
one sentence:

> **The puzzle's solution is not the drill — it is the setup: the learner plays on from the
> position the tactic creates, for a fixed number of plies against a human-like opponent at
> their band, and the drill is graded on what they do with it, not on whether they found it.**

**5.1 Input encoding, verified live today `[V]`.** Header, from the actual file:

```
PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags,DailyDate
```

(`theory-sourcing.md` §6 abbreviated this with an ellipsis; `DailyDate` is the eleventh
column.) The `FEN`/`Moves` convention, confirmed by replaying three real rows through
`chessops` — every move legal, SAN derived, parity checked:

| PuzzleId | FEN side | `Moves` | Solver |
|---|---|---|---|
| `00008` | `b` | `Bxg3 Rxe7 Qb1+ Nc1 Qxc1+ Qxc1` | **white** (3 solver moves = theme `long`) |
| `0000D` | `w` | `Qd6 Rd8 Qxd8+ Bxd8` | **black** (2 = `short`) |
| `000Pw` | `w` | `Nd2 Ne2+ Kf1 Nxc3` | **black** (2 = `short`, `fork` is Black's) |

So: **`FEN` is the position *before* the opponent's move; `Moves[0]` is the opponent's move;
the solver is the side to move *after* `Moves[0]`; the solution is the odd-indexed moves and
the list always ends on one.** An emitter that treats `FEN` as the position to solve builds
every pack from the wrong side.

**5.2 Emission — a consequence pack.**

| Pack field | Value | Why this and not the obvious alternative |
|---|---|---|
| `id` | `` `onramp-${PuzzleId.toLowerCase()}` ``, with `-2`/`-3` suffixes on case-fold collision in ascending original-id order | `PuzzleId` is mixed-case (`000Pw`) and the pack `id` pattern is `^[a-z0-9][a-z0-9-]*$` (`schema:78-81`). Case folding is lossy, so the original is preserved verbatim in `provenance.sources` |
| `start.fen` | `FEN` with `Moves[0]` applied | this is the position the learner faces |
| `start.side` | side to move there = the solver | `schema:117` |
| `start.movesSan` | **omitted** | the CSV has no game prefix; `GameUrl` carries the provenance instead |
| `spine` | `Moves[1..]` as one chain, ids `sol-1`…`sol-n`, `moveSan` computed by `chessops` | **reference geometry, not a rail**. It carries **no `annotations`** — saying why the tactic works is a chess claim (Law 8) |
| `checkpoints` | exactly one: `{ "id": "consequence", "trigger": { "atPly": (Moves.length - 1) + C }, "actions": [] }`, default `C = 8` | **not `atSpineNode`.** With a `human_common` opponent the spine will often not be walked, and `atSpineNode` only fires when the entire root-to-node move sequence matches a spine path (`pack-orchestrator.ts:21-37`) — so an `atSpineNode` checkpoint on the last solution node would frequently never fire and the drill would silently never end. `atPly` compares `node.ply` (`:45`) and always fires |
| `objective` | `{ "type": "play_until_checkpoint", "summary": "Play on from this position for <C> plies against an opponent near your rating." }` plus `successConditions: [{ "kind": "reach_checkpoint", "checkpointId": "consequence" }]` | mechanical instruction, zero chess claims; the only executable condition (`pack-validation.ts:160-178`). The author upgrades to `win`/`execute_break` after judging |
| `opponentPolicy` | `{ "mode": "human_common", "targetElo": <Rating clamped to [1100, 2200]>, "seedMode": "per_branch" }` | `capabilities.ts:10-14`. `human_common` is what makes it a consequence rather than a solution check: Maia does **not** have to play the puzzle's defence |
| `feedbackPolicy` | `"delayed_checkpoint"` | `design/00-thesis.md` names `immediate_blunder_guard` as the on-ramp knob, and `pack-validation.ts:104-111` **rejects it in v1**. Stated as a deviation in §Deviations, not silently swapped |
| `difficulty` | `{ "minOnlineRapid": max(1000, Rating-150), "maxOnlineRapid": Rating+150, "branchLengthTarget": C }` | `minOnlineRapid` has `minimum: 1000` (`schema:97`) so the clamp is mandatory for the 1000–1400 band; `branchLengthTarget` accepts 2–20 (`schema:100-104`) and `C = 8` is the top of the declared on-ramp band |
| `deviations`, `planClasses`, `feedbackClaims`, `concepts` | **absent** | every one of them is a judgment |

**5.3 Selection.** Filter rows by `Rating` band, `Themes` (using Lichess theme *keys* as
vocabulary — `theory-sourcing.md` §6 permits the keys as facts and forbids reusing lila's
description prose), `NbPlays` ≥ 1000 and `Popularity` ≥ 80 for signal quality, and total ply
count ≤ 6 so the consequence dominates the setup. Selection is deterministic: sort by
`PuzzleId` ascending and take the first *n*.

**5.4 Scale.** The dump is 304 MB zstd (§0). The pipeline streams it (`zstd` streaming
decode, row-at-a-time, never fully materialized), keyed by the `etag`
(`"6a6ef08b-12248997"` today) so a re-run without a new dump is a no-op. Committed CI
fixtures are a handful of rows, not the dump.

**5.5 Licence.** CC0-1.0, quoted at `theory-sourcing.md` §6 from database.lichess.org. One
`provenance.sources[]` entry per candidate carrying the CC0 statement, the `PuzzleId`, and
the `GameUrl` — the game link is provenance for the position, and it costs nothing to keep.

### 6. The grounding contract

`content/drafts/anti-caro-advance.json:273-277` and `planning/content-era/plan.md` §3b fix
the bar: every strategic assertion needs a citable reviewed source, engine/corpus validation
that bears on the claim, or a strong reviewer's sign-off. §3b names five assertion
categories: `objective.summary`, every `planClasses[].description`, every
`spine[].annotations` entry, every `feedbackClaims[].text`, and every `deviations[].note`
*and its `class`*.

**6.1 Closed record vocabulary.** `evidence.json` `kind` is one of exactly:
`opening_identity` (P1), `explorer_frequency` (P2), `tablebase_result` (P4), `engine_eval`
(P4 out-of-range fallback), `puzzle_provenance` (P3), `position_legality` (any). Adding a
kind requires an RFC amendment — same discipline as `SUPPORTED_CHECKPOINT_ACTIONS`
(`pack-validation.ts:11`): vocabulary grows only when a consumer grows.

**6.2 Which of the three grounding kinds each pipeline can supply.**

| Pipeline | Citable reviewed source | Engine/corpus validation | Reviewer sign-off |
|---|---|---|---|
| **P1 chess-openings** | **Yes**, and only for one class of fact: this move sequence is named *X* with ECO *Y*. It is a naming authority, not a theory authority | No | **Never** |
| **P2 explorer** | No — it is aggregate data, not a text a reader can check | **Yes**, and only for frequency and result-share at a stated rating band, speed set, and date window | **Never** |
| **P3 puzzle DB** | **Yes**, for position provenance: this position occurred in this game at this ply (`GameUrl`) | **Yes**, for one difficulty fact: this position is a rated tactic of difficulty *R* with themes *T*, played *N* times. That is a statement about solvers, not about chess | **Never** |
| **P4 Syzygy** | No | **Yes, exact**, for win/draw/loss + DTZ/DTM at ≤7 pieces. Out of range it supplies nothing, and the Stockfish substitute is an *evaluation*, never a result | **Never** |

The last column is uniform and is the point: **no pipeline can supply reviewer sign-off, so
no pipeline can promote a pack.** `pack-validation.ts:80-101` already enforces the crude
floor (`reviewed`/`published` ⇒ non-empty `sources` **and** `reviewers`), and every emitter
writes `reviewers: []`, so a candidate is mechanically unpromotable until a human is named.

**6.3 Machine-validatable vs human-only, field by field.**

*Machine-validatable — already, by shipped code or by these pipelines:*

| Field | Validator |
|---|---|
| `start.fen` legality | `lint.ts:218` (shipped) |
| `spine[].moveUci` legality, `moveSan` agreement | `lint.ts:143-162` (shipped) |
| spine id uniqueness; checkpoint/`authoredBoundary`/`deviations` node references | `lint.ts:133-140`, `:168-182` (shipped) |
| checkpoint action, feedback policy, opponent mode, objective condition executability | `pack-validation.ts:103-178` (shipped) |
| graduation floor (sources + reviewers non-empty) | `pack-validation.ts:80-101` (shipped) |
| the opening's name and ECO code | P1 |
| "this move is played *p*% at 1400–2000 over *N* games" | P2 |
| "this position is a rated tactic at *R* with themes *T*" | P3 |
| "this ≤7-piece position is a win/draw/loss, DTZ *n*" | P4 |
| "the engine evaluates this line at ±*cp* at depth *d*" | shipped judge, authoring profile (§3.2) |

*Human-only, permanently — no pipeline in this RFC or any obvious extension of it:*

| Field | Why no machine reaches it |
|---|---|
| `objective.summary` | it states what the learner is being taught, which is a pedagogical choice |
| `planClasses[].description` | a plan is a human abstraction over many move orders; no source enumerates it |
| `spine[].annotations[]` | "the bishop leaves before …e6 shuts it in" is causal explanation |
| `feedbackClaims[].text`, where causal | "whoever is better developed when it lands usually wins the tension" is not a frequency |
| **`deviations[].class`** | the classes (`schema:419-427`) are relative to *this pack's objective*. Engine eval cannot separate `concept_violation` from `interesting_deviation`: the anti-Caro pack marks `e1g1` a `concept_violation` while explicitly saying it "is not a blunder" (`:245`). No evaluation distinguishes those |
| `deviations[].offObjective` | same reason |
| `difficulty.label`, checkpoint `label` | framing |

**The one permitted crossing.** A `feedbackClaims[].text` or an annotation may be supported
by an `explorer_frequency` record **only if the supported sentence is itself a frequency or
result-share assertion**, decided by a mechanical test at emit time: the record's `values`
must contain the numeral or percentage that appears in the text, and the text must contain a
band or population reference. Anything else is `EVIDENCE_OVERREACH`. This is deliberately
narrow: it is the single case where "Stockfish: +0.54 / Maia: 31% / LLM: '…centralizes the
knight'" does *not* apply, because the sentence is the number.

**6.4 The CC BY-SA fork is a ruling, not a default.** `theory-sourcing.md` §3 gives two
clean postures and forbids mixing. Until the owner rules, the emitters refuse
`CC-BY-SA-4.0` sources with `LICENCE_POSTURE_UNSET` naming the dossier section. That is not
deferral: it is the code enforcing that a rights posture is chosen before prose is derived,
because provenance tracking will not survive the edits otherwise.

### 7. Surfaces and commands

New code, all of it CLI, all of it under `apps/server/src/sourcing/` so it imports the
shipped `validatePackDocument` from `apps/server/src/pack-validation.ts:182` directly — the
`create-and-return.md` §A4.3 invariant that an emitter cannot produce something that
validates in one path and fails at registry load.

Three entrypoints, added to the existing esbuild `build` script alongside `src/main.ts
src/pack-check.ts` (`apps/server/package.json:7`), and three `Makefile` targets following
the `pack-check` pattern (`Makefile:23-26`):

```
make source-fetch    SOURCE=<source-id> [OFFLINE=1]   # populate content/sources + sources.json
make candidate-emit  PIPELINE=<p1|p2|p3|p4> ARGS=…    # write content/candidates/<id>/
make sourcing-check  DIR=content/candidates/<id>      # validate the whole triple
```

`sourcing-check` is the gate and runs in CI. It:

1. runs `validatePackDocument` on `pack.json` and prints `PackValidationIssue[]` in the
   `pack-check.ts:62-64` format;
2. asserts every `sources.json` entry has a `licence` with an allowed `spdx`, and that no
   entry's host or `sourceId` is on the deny list;
3. asserts every `provenance.sources[]` attribution obligation from §1.2 is present;
4. resolves every `evidence.json` `supports` pointer, and fails on `EVIDENCE_ANCHOR_BROKEN`,
   `EVIDENCE_OVERREACH`, or a `deviations[*]/class` support;
5. warns `EVIDENCE_DIGEST_STALE` when `packDigest` no longer matches `digestDrillPack(pack)`;
6. fails if `provenance.reviewStatus !== "draft"` or `reviewers` is non-empty — a candidate
   is not permitted to arrive pre-approved.

**Publication stays a separate, manual act:** moving a directory's `pack.json` into
`content/packs/`. `sourcing-check` refuses to write there. This matters because the registry
serves whatever is in `content/packs/` with no `reviewStatus` filter (§0), so "unpublished"
is today a *directory* invariant, and this RFC is what makes it an enforced one.

### 8. Sequencing

**P1 → P4 → P2 → P3.** Not preference; three reasons, in order of weight:

1. **`design/04` §8's own batch order.** Batch 1 is one pack per phase — anti-Caro
   (opening), Carlsbad (middlegame), 4v3 rook (endgame). The opening and middlegame packs
   need *lines* (P1). The endgame pack needs *result grading* (P4). Explorer priority is
   §8's batch **3** ("breadth by explorer-frequency priority") and the on-ramp is batch
   **4**. The pipeline order is the content order.
2. **P1 is the blank-page fix and the input to the others.** P2 needs lines to query; P4
   needs positions; P3 is independent but last by (1). P1 is also the only pipeline whose
   output is *directly* pack fields, so it is the shortest path to a real candidate.
3. **P2 is the only one with a verified live blocker** (401 from Lichess's nginx, §0).
   Putting the pipeline with an unresolved access question first would make the whole
   program's first deliverable hostage to it.

P4 second rather than third is worth stating because it looks wrong: the pipeline whose
range excludes `design/04`'s named first endgame pack (§3.1) goes early. It goes early
*because* of that — the abstention path is the deliverable. It is better to learn in week
one that the practical rook endings are Stockfish-and-judgment territory than to write six
endgame packs assuming exact grading and discover it at review.

## Deviations from design

1. **The on-ramp's declared feedback knob cannot be encoded.** `design/00-thesis.md` and
   `design/04` §6 specify `immediate_blunder_guard` for the 1000–1400 layer;
   `pack-validation.ts:104-111` rejects it in v1. P3 emits `delayed_checkpoint` and records
   the substitution in `graduationBlockers`. Making the on-ramp policy real is program item
   #2/#4 work, not a sourcing change, and P3's candidates become correct by re-emission when
   it lands.
2. **`design/04` §4 reads as though Syzygy grounds the endgame family; it grounds ≤7 pieces
   only,** which excludes the batch-1 4v3 rook pack (§3.1). This RFC does not change the
   design intent, it makes the boundary explicit and mechanical.
3. **`design/04` §2c's frequency-driven priority is delivered as a file, not a ranking in
   the product.** `priority.json` is an authoring artifact. Surfacing priority to a learner
   is `/learn` (B7-5).
4. **Doctrine deviation: the puzzle-dump scan is TypeScript, not a Go worker.** `AGENTS.md`
   doctrine assigns self-contained data-format workers to Go. `find . -name go.mod` is empty
   — there is no Go toolchain, build, or CI lane in this repo. The scan also terminates in
   `chessops` semantics (applying `Moves[0]`, deriving SAN) that only exist in TS. Revisit
   trigger: if the scan becomes a scheduled or serving component rather than a one-shot
   authoring command.
5. **Explorer access is specified with three backends including an offline one**, rather
   than as a live API integration, because the live path returned 401 on both hostnames
   today. This is not hedging: the offline table is a named, implementable backend with a
   pinned key (`transposeKey`, `packages/runtime/src/chess.ts:16`).

## Acceptance criteria

**The B6 gate proof** (`design/03-product-breadth.md:101-103`, `planning/exploration/gates.md`
B6 row):

1. **One unpublished candidate pack, emitted end to end by the real pipeline.**
   `make candidate-emit PIPELINE=p1 ARGS='--eco D35 --name "Queen'\''s Gambit Declined:
   Exchange Variation" --split-ply 8'` writes `content/candidates/<id>/{pack.json,
   evidence.json, sources.json}`. `make pack-check FILE=content/candidates/<id>/pack.json`
   passes. `make sourcing-check DIR=content/candidates/<id>` passes. The pack is **not** in
   `content/packs/`, `reviewStatus` is `draft`, `reviewers` is `[]`, and starting the server
   in production mode does not list it (`GET /packs` unchanged). The line is chosen so the
   gate proof is also useful content: QGD Exchange is the opening `design/04` §3 names as
   feeding the Carlsbad structure, which is `design/04` §8's batch-1 middlegame pack.

**Licence and attribution assertion, one per source** — four tests, each naming its dossier
line:

2. `lichess-chess-openings` → `spdx: "CC0-1.0"`, `attributionRequired: false`; the emitted
   `provenance.sources[]` contains the CC0 statement and the pinned commit SHA.
3. `lichess-puzzle-db` → `spdx: "CC0-1.0"`; `provenance.sources[]` contains the CC0
   statement, the original `PuzzleId` verbatim (case preserved), and the `GameUrl`.
4. `syzygy` → `spdx: "unlicensed-data"` with the Feist/Football-Dataco rationale text
   present in the manifest and in `provenance.sources[]`.
5. `lichess-explorer` → `spdx: "unlicensed-data"`, rationale "aggregate statistics are facts;
   the underlying Lichess game data is CC0" (`theory-sourcing.md` §2, §6), plus the
   one-request-at-a-time etiquette note; and a test asserting **no** explorer value appears
   anywhere in `pack.json`.
6. **Deny list:** a fetch against a `theweekinchess.com` or `pgnmentor.com` URL, and one
   against `sourceId: "ecochessopeningcodes"`, each fail with `SOURCE_DENIED` quoting
   `design/research/theory-sourcing.md` §Do not use.
7. **`CC-BY-SA-4.0` refusal:** a manifest entry with that SPDX fails `LICENCE_POSTURE_UNSET`
   until the owner rules (§6.4).

**Boundary conditions of shapes the schema permits** — the failure class that killed five
drafts:

8. **No emitter writes a key the schema forbids.** A property test emits one candidate per
   pipeline and asserts each validates under Ajv `strict: true` with
   `additionalProperties: false` at the root — and asserts explicitly that no `spineNode`
   carries an extra key.
9. **Evidence never enters the served projection.** `GET /packs/:id` for a promoted
   candidate contains no `evidence.json` field; the existing regression asserting no authored
   prose in the projection stays green and unmodified.
10. **Digest stability under evidence refresh.** Re-running P2 and rewriting `evidence.json`
    leaves `digestDrillPack(pack)` byte-identical.
11. **Sidecars are not loadable as packs.** A test places `evidence.json` in a temporary
    drafts directory and asserts `PackRegistry.loadDefault({development: true,
    draftsDirectory})` throws `PACK_INVALID` — proving why §1 forbids that location.
12. **`atPly` vs `atSpineNode`:** a P3 candidate is played with a `human_common` opponent
    that deviates from the spine at its first reply; the `consequence` checkpoint still
    fires, and the objective transitions to `achieved` via `reach_checkpoint`. The same test
    with an `atSpineNode` trigger is asserted **not** to fire — the defect §5.2 avoids.
13. **`perfect_tablebase` refusal:** an endgame candidate emitted with that mode fails
    `validatePackDocument` with `UNSUPPORTED_OPPONENT_POLICY` at
    `/opponentPolicy/mode`; the shipped emitter never produces it.
14. **`minOnlineRapid` clamp:** a puzzle with `Rating: 1050` emits `minOnlineRapid: 1000`,
    not 900 (`schema:97`).
15. **PuzzleId case-fold collision:** two fixture rows differing only in case emit ids
    `onramp-<x>` and `onramp-<x>-2`, deterministically by ascending original id, with both
    originals preserved in `provenance.sources`.

**Pipeline-specific proofs:**

16. **P3 encoding, against real rows.** Fixture rows `00008`, `0000D`, `000Pw` (committed
    verbatim) emit candidates whose `start.fen` equals `FEN` after `Moves[0]`, whose
    `start.side` is the solver, and whose spine SANs are `Rxe7 Qb1+ Nc1 Qxc1+ Qxc1`,
    `Rd8 Qxd8+ Bxd8`, `Ne2+ Kf1 Nxc3` respectively. A candidate whose `start.side` equals
    the CSV `FEN` side fails the test — the wrong-side bug §5.1 exists to prevent.
17. **P4 range split.** A ≤7-piece position yields a `tablebase_result` with `category` and
    `dtz` matching a committed `tablebase.lichess.org` response fixture; an 11-piece 4v3
    rook position yields an **abstention** with `reason: "out_of_range"`, and no
    `tablebase_result` record exists for it anywhere in the file.
18. **P2 abstention under 401.** With the live backend stubbed to 401 and the cache empty,
    `explorerStats` abstains with `source_unavailable`, no retry is issued, and
    `priority.json` records the abstention rather than a zero row.
19. **Politeness.** A test asserts request concurrency never exceeds 1 across two pipelines
    run together, and that a stubbed 429 produces a wait of ≥60 s before the first retry.
20. **Offline reproducibility.** Every emitter runs under `--offline` in CI against committed
    fixtures and produces byte-identical output on two consecutive runs.

**Grounding contract:**

21. **Overreach is mechanically impossible.** A test attempts an `evidence.json` record whose
    `supports` targets `/deviations/0/class`, one targeting
    `/spine/0/annotations/0` from a `tablebase_result`, and one `explorer_frequency`
    supporting a sentence with no numeral; all three fail `sourcing-check` with
    `EVIDENCE_OVERREACH`.
22. **The permitted crossing works.** An `explorer_frequency` record supporting a
    `feedbackClaims[].text` containing the same percentage and a band reference passes.
23. **No candidate is promotable.** Flipping any emitted candidate's `reviewStatus` to
    `reviewed` without adding a reviewer fails `pack-check` with
    `GRADUATION_REQUIRES_REVIEWERS` (`pack-validation.ts:91-100`) — asserted per pipeline.

**Repo hygiene:**

24. `make verify` green; `content/sources/` in `.gitignore`; `content/candidates/README.md`
    stating the directory is candidates-not-content and why it is neither `drafts/` nor
    `packs/`.
25. `docs/` gains a canonical `content-sourcing.md` on implementation, and
    `design/research/theory-sourcing.md`'s coverage-matrix row is updated to note the
    2026-08-12 re-verification and the puzzle CSV's eleventh column.
26. `content/drafts/anti-caro-advance.json` is **not modified** by this RFC. §2 and §4.5 name
    what a re-emission could fill; doing it is authoring work under
    `planning/content-era/`, and the friction is logged there in the six categories.

## Open questions

1. **Does an OAuth token actually resolve the explorer 401?** Untested — no token was
   available. §4.1 is written so the answer changes which backend is *preferred*, not
   whether P2 ships. Resolve by trying one token before P2 begins; if it fails, the offline
   table is the only backend and §4.1's ordering collapses to cache → offline.
2. **CC BY-SA posture — RESOLVED by owner ruling 2026-08-12: pack prose is declared
   `CC-BY-SA-4.0` wholesale.** Share-alike on authored content, consistent with the
   AGPL-3.0 posture already chosen for code. Consequences to specify rather than assume:
   Wikibooks becomes a legitimate fifth pipeline (reusable idea-prose with attribution);
   every pack's `provenance` must carry the licence and the attribution chain for any
   borrowed prose, encoded rather than left to good intentions; §6.4's emitter refusal is
   lifted; and the repo can no longer relicense pack prose unilaterally later, which is
   the price of the lever and is accepted.

3. **Should `sourcing-check` run against `content/packs/` too, as a published-content
   audit?** Argument for: it would catch a promoted pack whose evidence went stale. Argument
   against: it makes publication depend on sidecars that a hand-authored pack legitimately
   lacks. Proposed answer for `accepted`: yes, but as a warning-only mode, since
   `anti-caro-advance.json` has no sidecar and must not become unpublishable by tooling.

## Changelog

- 2026-08-12: created.
