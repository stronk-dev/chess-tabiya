# RFC: Content sourcing foundation — manifests, evidence sidecars, licence enforcement, and the line skeleton

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/04-content-architecture.md` §8 (production model, cost discipline), §2d (opening pack contents); `design/02-product-shape.md` §Product posture (content/data-rights ruling, `:41-50`); `design/03-product-breadth.md:101-103` and gate B6
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + full-content-at-full-breadth ruling 2026-08-11 (`design/04-content-architecture.md` header); owner ruling 2026-08-12 opening the RFC tier (`rfc/README.md`)
- **Depends on:** `rfc/archive/drill-pack-format.md` (implemented), `rfc/archive/authored-explanation-surface.md` (implemented — the reveal contract this must not leak around)
- **Parent / amends:** — (B6a; first of four RFCs split out of the withdrawn `content-sourcing-pipelines.md` draft, 2026-08-12). `planning/breadth/create-and-return.md` §A5 slices B6-5/B6-8 are its consumers
- **Supersedes / superseded by:** —
- **Planning:** `planning/content-sourcing-foundation/` (once implementing)

## Summary

`design/04-content-architecture.md` commits to hundreds of packs. Today authoring starts
from a blank file: `grep -rniE "explorer|syzygy|tablebase|chess-openings|puzzle" apps
packages workers tools schemas content Makefile package.json` returns **nine hits, none of
them code** — two enum strings in `schemas/drill_pack.schema.json:361,446` and seven lines
in `content/drafts/{anti-caro-advance,carlsbad-minority-attack,rook-4v3-same-side}.json`
where authors record the grounding they could not get. The same grep restricted to `apps
packages workers tools Makefile package.json` returns **zero**. There is no HTTP client for
any external source anywhere in production code, and `find . -name "go.mod" -not -path
"./node_modules/*"` is empty.

This RFC is the **shared foundation** the other three sourcing RFCs (B6b Syzygy, B6c
explorer, B6d position seeds) all depend on: the on-disk artifact triple, the fetch
manifest, the evidence sidecar, the deterministic-output rule, the licence/attribution
encoding required by the 2026-08-12 content-rights ruling, the `sourcing-check` gate, and
the grounding contract that decides which authored fields a machine can ever validate. It
also lands the **first pipeline**, `lichess-org/chess-openings` (CC0 line skeletons),
because that is the pipeline whose output is directly pack fields and therefore the
shortest path to a real candidate.

Its one-sentence thesis: **the pipelines can supply a pack's geometry, its provenance, and
its priority; they can supply none of its prose, and the encoding must make that impossible
to forget.**

## Motivation

`design/04-content-architecture.md` §8's cost rule says that if a reviewed pack cannot be
produced in a bounded session, the answer is better tooling, not more hours. The three
hand-authored packs record what the missing tooling costs.
`content/drafts/anti-caro-advance.json:270` states that *every* strategic claim in it is
"agent-authored original prose with NO citation and NO engine or human validation", and its
three `graduationBlockers` (`:273-277`) are all grounding failures, not encoding failures.
`content/drafts/carlsbad-minority-attack.json:448` records that the tabiya "is asserted to
be a position 1400-2000 players actually reach, on model knowledge alone".
`content/drafts/rook-4v3-same-side.json:526` records that no position in the pack has
tablebase ground truth. Three packs, three different missing instruments — one per RFC in
this split.

Four RFCs rather than one, because the reviewed single draft was four documents wearing one
front matter: a shared-infrastructure spec, an endgame-grounding spec whose real content is
an abstention rule, an access-blocked data spec, and a pack-emission design that contradicted
the product thesis. They land in different weeks, carry different risk, and one of them had
to be redesigned rather than copied.

**Out of scope,** each with a reason:

| Out of scope | Why |
|---|---|
| Syzygy grounding and the Stockfish abstention fallback | B6b, `rfc/content-sourcing-syzygy.md`. Depends on this RFC's manifest, sidecar, and check |
| Explorer access, rating-band frequency, `priority.json` | B6c, `rfc/content-sourcing-explorer.md`. Same dependency |
| Puzzle-derived position seeds | B6d, `rfc/content-sourcing-position-seeds.md`. Same dependency |
| A `/create` UI, draft store, or pack write endpoint | B6-1. `apps/server/src/rest.ts:506,509` expose `GET /packs` and `GET /packs/:id` and nothing else on that prefix — no POST/PUT/PATCH/DELETE (line numbers re-verified 2026-08-12 after F2/F3 landed; the pre-F3 coordinates `:375,378` in the withdrawn draft are stale). This RFC's output is files on disk, consumed by `make pack-check` today and by B6-1 later |
| Review queue, sign-off trail, reviewer identity | B6-4. This RFC produces the *record* a reviewer reads; it does not build the queue |
| Session distillation, Lichess study import, PGN game import | B6-5/6/7. Different inputs, same seed shape (`planning/breadth/create-and-return.md` §A4.2), specified there |
| Rendering any of this evidence to a learner | B4 / program item #2. `apps/server/src/capabilities.ts:33` ships `llm: "none"`. This RFC writes files an author reads, never a response a learner reads |
| Wikibooks / Wikipedia CC BY-SA **prose ingestion** | A fifth pipeline, unscheduled. The 2026-08-12 ruling (`design/02-product-shape.md:41-50`) makes it legitimate; §2 below ships the *encoding* it will need, so the pipeline can be specified later without re-opening the licence question |
| Bulk corpus ingestion (streamed months, Parquet/DuckDB index) | Rejected-first pattern (`AGENTS.md:93-95`; `design/BACKLOG.md:175,197`). B6c states the one carve-out and its justification burden |
| Automatic lesson generation from mined material | ADR-0001 / AGENTS.md law 8. Every artifact here is a candidate for an author |

## Specification

### 0. Verified state of the code

Every claim below was checked in the working tree on 2026-08-12, because five earlier drafts
of this territory died on unverified capability claims. `[V]` throughout. **Every coordinate
was re-taken after F2 (`6f48e13`) and F3 (`1ae7922`) landed**, which moved most of
`apps/server/src/rest.ts` and `apps/server/src/service.ts`; where the withdrawn draft's
number is stale the row says so, because a citation that no longer resolves is worse than
none.

| Claim | Evidence |
|---|---|
| No source pipeline of any kind exists | the greps in §Summary; the only outbound HTTP in production is `apps/web/src/lib/api.ts` (browser → own server) |
| Structural + semantic + executable validation ships and is shared | `apps/server/src/pack-validation.ts:182` (`validatePackDocument`), lint at `packages/schema/src/drill-pack/lint.ts:209`, registry entry `apps/server/src/pack-registry.ts:76` |
| Pack identity is a digest over the **whole** document | `packages/schema/src/drill-pack/digest.ts`; RFC 8785 + SHA-256, `docs/drill-pack-format.md:73-78` |
| `perfect_tablebase` is in the schema but **not selectable** | `schemas/drill_pack.schema.json:361` lists it; `apps/server/src/capabilities.ts:10-14` ships `["human_common","strong_engine","theory_strict"]`; anything else fails `UNSUPPORTED_OPPONENT_POLICY` at `pack-validation.ts:125-138`. Ledgered as **D8** (`design/BACKLOG.md:105`) |
| `immediate_blunder_guard` is in the schema but **rejected** | `schemas/drill_pack.schema.json:54` vs `pack-validation.ts:103-111`. Same defect **D8** |
| `outcome.reached` has no producer | declared `packages/runtime/src/types.ts:185-188`, projection no-op `packages/runtime/src/events.ts:162-164` (`case "outcome.reached": break;`); no emitter |
| Only `reach_checkpoint` **success conditions** execute | `pack-validation.ts:160-178` rejects anything else; `apps/server/src/pack-orchestrator.ts:88-100` maps only that kind to a predicate |
| **Checkpoint triggers are wider than success conditions.** `atPly`, `atSpineNode`, `fenPredicate` and `materialBalance` all execute; a `timingWindow` fires on its `windowCloses` leg | `pack-orchestrator.ts:39-71`. `content/drafts/rook-4v3-same-side.json` already ships a `materialBalance` checkpoint |
| Checkpoints are evaluated after **both** learner moves and opponent plies | `apps/server/src/service.ts:258` and `:282` both call `orchestratePackMove` (post-F3 coordinates; the draft's `:195,214` are stale) |
| `atPly` counts plies from the pack's start position | `pack-orchestrator.ts:45` compares `node.ply`; root is `ply: 0` (`packages/runtime/src/runtime.ts:178`), each move `+1` (`:325`) |
| `atSpineNode` only fires when the run's whole move sequence matches a spine path | `pack-orchestrator.ts:21-37` walks `moveUci` level by level and returns `undefined` on the first mismatch |
| **`start.side` is the learner's colour, not the FEN's side to move** | `apps/web/src/lib/session-controller.ts:367` moves the opponent whenever `boardModel(node.fen, packStartSide(pack)).turnColor !== packStartSide(pack)` (post-F3; the draft's `:345` is stale). All three drafts exercise the difference: `carlsbad-minority-attack.json` has a `b`-to-move FEN with `side: "white"`; `rook-4v3-same-side.json` has a `w`-to-move FEN with `side: "black"` |
| **`start.side` is schema-optional but client-required** | `schemas/drill_pack.schema.json:117` does not require it; `apps/web/src/lib/screen-model.ts:54-60` throws `TypeError` when it is absent, and `apps/web/src/lib/DrillScreen.svelte:108` calls it unconditionally. Every emitter must write it. Ledgered as **D9** (`design/BACKLOG.md:105`) |
| **`theory_strict` silently degrades to `human_common`** when the pack has no spine, or no spine child at the current position | `apps/server/src/opponent-selector.ts:453-458` (`console.warn("DEGRADED_THEORY_SPINE…")` then `return this.#humanCommon(request)`), reached through `spineChildren` (`:337-347`) |
| `provenance` is projected to the browser **verbatim, before play** | `pack-registry.ts:58` (`provenance: raw.provenance`), inside the same projection whose doc comment (`:42-46`) says authored feedback is never part of it |
| **`start` is projected whole, `movesSan` included** | `pack-registry.ts:59` (`start: document.start`) — see the §1.1a projection table. This is the leak surface B6d is designed around |
| `start.movesSan` has **no production reader** | `grep -rn "movesSan" apps/web/src packages/*/src apps/server/src` excluding tests returns nothing; the only hits are `schemas/drill_pack.schema.json:113`, the schema example, and two `content/drafts` packs. Omitting it changes no rendered surface today |
| **Engine evidence takes exactly one of `depth` or `movetime`, and `depth` emits `go depth`** | `apps/server/src/evidence-queue.ts:19-20`, the XOR guard at `:101-107`, and `StockfishEvidenceExecutor` at `:301-304`. A deterministic search budget therefore already has an executor path; `nodes` does not (`go nodes` appears nowhere) |
| **The depth path's request timeout is hard-coded to 5 000 ms** | `evidence-queue.ts:312`: `timeoutMs: Math.max(5_000, (job.movetime ?? 0) * 10)`. With `depth` set, `job.movetime` is `undefined`, so the ceiling is exactly 5 s and a longer search fails as `ENGINE_UNAVAILABLE` (`engine-supervisor.ts:364`). B6b §3.3 specifies the one-field change that fixes this |
| **The evidence executor never sets `MultiPV` per request** | the only `setoption name MultiPV` in the tree is `opponent-selector.ts:413`, on the Maia path. For the judge, `MultiPV` is fixed at spawn: `application.ts:189` hard-codes `{ Threads: 1, Hash: 16, MultiPV: 1 }`, and `stockfishPlaySpec` (`strong-engine.ts:41-57`) carries `profile.multiPv` into the **opponent** spec only |
| **`lastInfo` takes the *last* matching `info` line** | `evidence-queue.ts:265-275`. Under `MultiPV > 1` that is the highest-numbered `multipv` line, so `centipawns`/`pv` would silently describe the *third*-best move. MultiPV is not a free parameter for this parser |
| **No `ucinewgame` is ever sent** | `grep -n "ucinewgame" apps/server/src` is empty; the handshake sends `uci`, the spec's `setoption`s, then `isready` (`engine-supervisor.ts:225-236`) and `execute` sends only the request's commands (`:277`). The transposition table therefore persists across positions in one process, so "same depth, same FEN, same answer" holds only in a fresh process |
| **A spec that sets `name` loses its engine version** | `parseIdentity` reads the advertised `id name` line (`engine-supervisor.ts:116`) but only fills `version` from it when `spec.name` is undefined (`:119-126`). Both shipped Stockfish specs set `name: "Stockfish"` (`strong-engine.ts:49`, `application.ts:188`), so both report `version: "unknown"`. An authoring spec that wants the build recorded must omit `name` |
| The registry serves every pack it loads, **regardless of `reviewStatus`** | `pack-registry.ts:174` builds `productionPaths` from the schema fixture plus `content/packs/` with no status filter; `list()` (`:199`) and `get()` (`:203`) do not filter either. `content/packs/` is empty today |
| `jsonFiles` recurses and `fromDocuments` throws on the first invalid document | `pack-registry.ts:97-118`, `:121-140` via `validatedDocument` (`:76-88`) |
| Stockfish evidence ships at a 100 ms default movetime | `DEFAULT_STRONG_ENGINE_PROFILE` (`apps/server/src/strong-engine.ts:10-15`), read for evidence at `apps/server/src/service.ts:156-157`; payload kinds `eval`/`wdl`/`bestline`, source `engine_validated` (`apps/server/src/evidence-queue.ts:324,339,360`) |
| The strong-engine profile is overridable, but only some fields reach an engine | `strong-engine.ts:23-31` (`resolveStrongEngineProfile`) validates all four fields; `stockfishPlaySpec` (`:41-57`) carries `threads`/`hashMb`/`multiPv` into the **opponent** spec, and `movetimeMs` reaches the opponent through `opponent-selector.ts:369,441`. Nothing carries an overridden `multiPv` to the **judge** — see the two MultiPV rows below |
| `chessops@0.15.1` is a production dependency in all four workspaces | `packages/{schema,runtime}/package.json:14`, `apps/server/package.json:16`, `apps/web/package.json:15` |
| `parsePgn` has **no production caller** | `packages/runtime/src/pgn.ts:1-7` imports only the write half (`makePgn`, `ChildNode`); `parsePgn` appears in tests only. P1 (§4) is the first production use of the ingest side |
| `node:zlib` exposes `createZstdDecompress`/`zstdDecompress` | `node -e` on the interpreter in this checkout (v26.7.0, 2026-08-12); the repo pins `engines.node >= 24` (`package.json:24-25`). B6d depends on this and asserts the export at startup rather than assuming it |

**Live source probes, 2026-08-12, from this machine.** `[V]`

| Endpoint | Result |
|---|---|
| `explorer.lichess.ovh/lichess?…` | **401**, `server: nginx`, body `401 Authorization Required`, `access-control-allow-headers` includes `Authorization`. No local proxy (`env \| grep -i proxy` empty), so the refusal is Lichess's |
| `explorer.lichess.org/lichess?…` | **401**, identical. This is the host the OpenAPI spec declares (`servers: - url: https://explorer.lichess.org`); `.ovh` is the historical name (`design/research/theory-sourcing.md:35-36`). Both refuse |
| `explorer.lichess.org/masters?play=e2e4` | **401**, `server: nginx`, `content-length: 172` |
| `tablebase.lichess.org/standard?fen=…` | **200**, anonymous. Full key set observed: `{checkmate, stalemate, variant_win, variant_loss, insufficient_material, dtz, precise_dtz, dtm, dtw, dtc, category, moves[]}` — `dtw` and `dtc` were `null` on the probed position |
| `raw.githubusercontent.com/lichess-org/chess-openings/master/b.tsv` | **200**, header `eco\tname\tpgn` |
| `database.lichess.org/lichess_db_puzzle.csv.zst` | **200**, `content-length: 304384407`, `accept-ranges: bytes`, `last-modified: Sun, 02 Aug 2026 07:23:55 GMT`, `etag: "6a6ef08b-12248997"` |

All five were re-run on 2026-08-12 at 12:52 UTC while revising this RFC; every result above is
that run, not a remembered one.

This confirms `design/research/theory-sourcing.md:147-150`'s residual unknown and hardens it:
the explorer 401 is served by Lichess's own nginx, not by an application layer, so it is not
a transient application error. **B6c is built around this and B6a does not depend on it.**

### 1. One pipeline shape, three artifacts, one hard separation

Every pipeline in B6a–B6d is the same four stages:

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
`content/packs/`.** `pack-registry.ts:97-118` recurses into both of those and
`fromDocuments` (`:121-140`) throws `PACK_INVALID` on the first file that is not a valid
pack — so a sidecar dropped in `content/drafts/` crashes the development server at startup,
and a candidate dropped in `content/packs/` is **served to every client** because the
registry applies no `reviewStatus` filter (§0). Add `content/sources/` to `.gitignore`;
`content/candidates/` is committed (same rationale as `content/drafts/README.md`: candidate
review is part of the measured pipeline).

#### 1.1 What the browser is served, before a move is played

Every rule in this RFC about "what a pipeline may put in a pack" is downstream of one
function. `projectPackDocument` (`apps/server/src/pack-registry.ts:47-74`) is what
`GET /packs/:id` returns (`apps/server/src/rest.ts:509-525`), and it runs **before the run
exists**. Read literally:

| Served, verbatim, before play | Not served |
|---|---|
| `id`, `version`, `title`, `mode`, `phase` (`:52-56`) | `planClasses`, `deviations`, `feedbackClaims`, `concepts`, `authoredBoundary`, `retryVariants` — absent from the projection entirely |
| `difficulty` (`:57`) | `objective.successConditions` (only `type` and `summary` survive, `:60-63`) |
| **`provenance`** (`:58`) | checkpoint **triggers** (only `id`, `label`, `actions`, `:67-72`) |
| **`start` — the whole object, so `fen`, `movesSan` *and* `side`** (`:59`) | spine `annotations` (`projectSpineNode:33-40` keeps `id`, `moveUci`, `moveSan`, `children` and nothing else) |
| `feedbackPolicy`, `opponentPolicy` (`:64-65`), `spine` move geometry (`:66`) | |

Two rules follow and bind every pipeline in B6a–B6d:

- **Anything an emitter writes into `provenance`, `start`, `difficulty` or `title` is public
  from the first page load.** It is not "authoring metadata"; it is response body.
- **`start.movesSan` is served, so it may carry only moves the learner is entitled to see
  before playing.** For an opening line (§4) those moves are the position's history and the
  pack's answer is the *spine*, so writing them is correct. For a pipeline whose pre-start
  moves **are** the answer — a puzzle solution, B6d — `start.movesSan` must be omitted, and
  the line lives in `evidence.json`, which is never served (§1.3). `start.movesSan` has no
  production reader at all (§0), so omitting it costs no rendered surface.

#### 1.1a The load-bearing boundary: where pipeline output may legally live in a v0.2 pack

`schemas/drill_pack.schema.json` sets `additionalProperties: false` on the root (`:72`) and
on `start` (`:119`), `difficulty` (`:106`), `planClass` (`:156`), **`spineNode` (`:174`)**,
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
   checked at `apps/server/src/service.ts:170-171` (`"Client pack digest is stale"` — post-F3;
   the draft's `:135-140` is stale in both senses).

Therefore: **`evidence.json` is a sidecar, keyed to the pack by digest, never merged, never
served.** Exactly *two* things a pipeline learns go into the pack document:

- `provenance.sources[]` — licence and attribution strings (`nonEmptyString[]`,
  `schemas/drill_pack.schema.json:465-468`). These *should* reach the browser: an
  attribution obligation the user never sees is not discharged.
- `provenance.licence` and `provenance.attribution[]` — the CC-BY-SA-4.0 encoding required by
  §2. Same reasoning, same visibility.

Conversely, a pointer that discharges **no** obligation and resolves to material the pack is
withholding does not belong in `provenance` — it belongs in `evidence.json`, where a reviewer
reads it and a learner does not. B6d §5 applies this to the puzzle line.

**No emitter writes any key the schema does not already name**, in any object, except the
three `provenance` keys §2 introduces (`licence`, `attribution`, and the pre-existing
`graduationBlockers` an author already uses at `content/drafts/anti-caro-advance.json:273`).
The pack an emitter writes is byte-for-byte a pack a human could have typed.

#### 1.2 `sources.json` — the fetch manifest

```jsonc
{
  "schema": "tabiya.sourcing.manifest.v1",
  "entries": [
    {
      "sourceId": "lichess-chess-openings",
      "url": "https://raw.githubusercontent.com/lichess-org/chess-openings/<commit-sha>/b.tsv",
      "retrievedAt": "2026-08-12T10:44:56Z",   // from the cache entry, never from the emit clock (§1.4)
      "sha256": "…",                            // of the exact bytes used
      "bytes": 123456,
      "licence": {
        "basis": "spdx",                        // "spdx" | "no-rights-asserted"
        "spdx": "CC0-1.0",                      // a real SPDX identifier, or null
        "attributionRequired": false,
        "shareAlike": false,
        "noticeText": null,                     // string, required when attributionRequired is true
        "rationale": null                       // string, required when basis is "no-rights-asserted"
      }
    }
  ]
}
```

`licence` is **required on every entry** and the emitter refuses to write a candidate if any
entry lacks it.

**`spdx` holds an SPDX identifier or nothing.** The closed set is `CC0-1.0` and
`CC-BY-SA-4.0`; both are listed SPDX short identifiers
(<https://spdx.org/licenses/CC0-1.0.html>, <https://spdx.org/licenses/CC-BY-SA-4.0.html>).
Adding a third requires an RFC amendment, the same discipline §3.1 applies to record kinds.
Where no licence applies at all — a tablebase result, an explorer aggregate — the entry sets
`basis: "no-rights-asserted"`, `spdx: null`, and a mandatory `rationale`.

**`no-rights-asserted` is our vocabulary, not SPDX's, and it never appears in an `spdx`
field.** The withdrawn draft's `"spdx": "unlicensed-data"` was neither: no such identifier
exists, and a validator that accepted it would be reporting a licence the world cannot
resolve. SPDX's own escape hatches are deliberately not used either — `NOASSERTION` asserts
that the licence is *undetermined*, and `LicenseRef-…` asserts that a licence exists but is
unlisted. The claim these sources make is stronger and different: the material is **not a
copyrightable work**, per the Feist / Football Dataco reasoning quoted at
`design/research/theory-sourcing.md:87-91`. That is a factual claim with a stated basis, so
it gets a field of our own with the reasoning attached, and `sourcing-check` fails
`LICENCE_FIELD_INVALID` on any other shape: `basis: "spdx"` with a `null` or off-set `spdx`,
`basis: "no-rights-asserted"` with a non-null `spdx` or an empty `rationale`, or
`attributionRequired: true` with no `noticeText`.

Sources on `design/research/theory-sourcing.md:134-143` (TWIC, PGN Mentor, the
`ecochessopeningcodes` compilation, bulk Lichess studies, `calebjcourtney/db.sqlite3`) are a
hard-coded deny list matched on hostname *and* on the `sourceId` vocabulary; a fetch against
one fails with `SOURCE_DENIED` naming the dossier line.

| Entry shape | Obligation | Encoding, exactly |
|---|---|---|
| `basis: "spdx"`, `spdx: "CC0-1.0"` | none | one `provenance.sources[]` entry: `` `<what was taken>: <sourceId> (<url>) — CC0-1.0, no attribution required` `` |
| `basis: "spdx"`, `spdx: "CC-BY-SA-4.0"` | attribution **and** share-alike on derivatives | `noticeText` mandatory in the manifest; a `provenance.attribution[]` entry per §2 |
| `basis: "no-rights-asserted"` | none, and the *reason* must be stated | `rationale` mandatory, carried verbatim into `provenance.sources[]` (B6b §6; B6c §6) |

#### 1.3 `evidence.json` — the grounding ledger

```jsonc
{
  "schema": "tabiya.sourcing.evidence.v1",
  "packId": "d35-qgd-exchange-carlsbad",
  "packVersion": "0.1.0",
  "packDigest": "sha256:…",                       // digestDrillPack(pack) at emit time
  "sourcedAt": "2026-08-12T10:44:56Z",            // derived, not wall-clock — §1.4
  "records": [
    {
      "kind": "opening_identity",                  // closed set, §3.1
      "anchor": { "spineNodeId": "exd5" },         // or { "fen": "…" } or { "pointer": "/feedbackClaims/0" }
      "sourceId": "lichess-chess-openings",
      "retrievedAt": "2026-08-12T10:44:56Z",       // copied from the manifest entry
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
      "detail": "11 pieces; Syzygy covers <=7"
    }
  ]
}
```

Rules that make this a ledger rather than decoration:

- **`supports` pointers must resolve** in `pack.json`. A record whose pointer does not
  resolve is an error (`EVIDENCE_ANCHOR_BROKEN`).
- **Prose pointers fail closed.** `supports` may not target `/objective/summary`,
  `/planClasses/*/description`, `/spine/**/annotations/*`, `/deviations/*/note`, or
  `/feedbackClaims/*/text` **unless** the record's `kind` has a registered prose template
  and the supported text is byte-equal to a re-render of that template from the record's
  `values` (§3.3). B6a registers **no** templates, so in B6a every prose support is
  `EVIDENCE_OVERREACH`. B6c registers exactly one.
- **`deviations[*]/class` may never be supported by any record.** No pipeline grades moves
  (AGENTS.md law 8). Attempting it is `EVIDENCE_OVERREACH`.
- **Abstentions are first-class and are written out.** A pipeline that has nothing to say
  says so in the file. Silence is the failure mode this repo keeps rediscovering.
- **Staleness has two severities.** `packDigest` mismatch ⇒ warning
  (`EVIDENCE_DIGEST_STALE`, "re-confirm"); unresolvable anchor ⇒ error. A pack edit must
  not silently invalidate grounding, and must not block on re-fetching either.

#### 1.4 Politeness, caching, and offline determinism

One shared HTTP client, used by every pipeline in B6a–B6d, with these properties — all of
them required, none of them tunable down:

- **One in-flight request per process, and one per checkout.** The two halves are different
  mechanisms and the difference is stated because the withdrawn draft claimed "concurrency 1,
  globally" from a mechanism that could not deliver it:
  - *In-process*: every fetch goes through one client instance that serializes on a single
    promise chain. This is a real guarantee and it is all a promise chain can give.
  - *Cross-process*: before each request the client acquires an exclusive lock file at
    `content/sources/.fetch.lock`, created with `open(…, "wx")` — `O_CREAT|O_EXCL`, atomic on
    a local filesystem — containing the pid and the acquisition time, and released in a
    `finally`. A lock older than 300 s is treated as abandoned and taken over. Two concurrent
    `make source-fetch` / `make candidate-emit` runs in the same checkout therefore still
    issue one request at a time.
  - *What this does **not** guarantee*, stated so nobody relies on it: two checkouts, two
    containers, or two machines behind one IP are not coordinated, and neither is a lock on
    a network filesystem where `O_EXCL` is unreliable. The obligation
    (`design/research/theory-sourcing.md:37-38`, "Only make one request at a time") is per
    Lichess account and per IP, and honouring it across machines is an operator
    responsibility this RFC cannot encode.
  - The lock reads a clock. That clock never reaches an emitted artifact — see the
    deterministic-timestamp rule below, which is about artifacts, not about process control.
- **On `429`: sleep ≥ 60 s**, then retry with exponential backoff (60 s, 120 s, 240 s), max
  3 retries, then abstain with `source_unavailable`. Never a tighter interval.
- **On `401`/`403`: do not retry.** Abstain with `source_unavailable` and record the status.
- **`User-Agent` is mandatory and identifying:**
  `chess-tabiya-sourcing/<version> (+https://github.com/<repo>; <contact>)`.
- **The cache is the default read path, and it has three entry kinds.** Key = SHA-256 of the
  canonical request (method, host, path, sorted query) for the first two, and of the
  canonical job for the third. Every entry stores status/metadata and `retrievedAt`
  **written once, at first fetch, and never rewritten on a hit**.
  1. **`body`** — status, headers, and the response bytes. The default. Max age 30 days for
     explorer/tablebase responses; `chess-openings` is pinned by commit SHA and never
     expires.
  2. **`headers-only`** — status, headers, `etag`, `content-length`, and **no body**. Used by
     a source that declares itself streamed: the bytes are piped to the consumer and
     discarded, never written to disk. The 304 MB puzzle dump is the only such source today
     (B6d §4); the ceiling that forces this kind is 50 MB, declared per source rather than
     discovered at runtime.
  3. **`engine`** — the payload of one local engine search, keyed by engine id, engine
     `version` as parsed from the UCI handshake (`engine-supervisor.ts:116`), profile
     (`threads`, `hashMb`, `multiPv`), search budget, FEN, and evidence kind. Engine output
     is not an HTTP response but it is exactly as non-reproducible, and it enters the
     artifacts by the same door for exactly that reason (B6b §3.3).
- **`--offline` forces cache-only**, and every emitter runs in CI with `--offline` against
  committed fixtures. A `headers-only` source has no cached body, so its offline path is a
  committed fixture and nothing else.
- **No pipeline may run on a request path.** These are CLI-invoked authoring tools. There is
  no server code in this RFC.

**The deterministic timestamp rule.** Byte-identical re-emission and a wall-clock
`generatedAt` cannot both hold. The wall clock loses:

1. There is **no** wall-clock field in any emitted artifact. `generatedAt` does not exist.
2. Every `retrievedAt` in `sources.json` is copied from the cache entry that supplied the
   bytes. On a cache hit it is the timestamp of the *original* fetch, so it is stable across
   re-runs and identical in `--offline` mode.
3. `evidence.json` carries `sourcedAt`, defined as the **lexicographic maximum of the
   `retrievedAt` values of the manifest entries this candidate actually consumed**,
   normalized to `YYYY-MM-DDTHH:MM:SSZ` (UTC, second precision, no fractional part). It is a
   function of the inputs, so identical inputs give an identical file.
4. A candidate that consumed **zero** manifest entries is an error (`MANIFEST_EMPTY`): there
   is no honest `sourcedAt` for it and no reason for it to exist.
5. Every JSON artifact is serialized with RFC 8785 canonicalization
   (`packages/schema/src/drill-pack/digest.ts`) plus a trailing newline, so key order and
   number formatting are not a source of drift either.

The clock is therefore readable in exactly one place — the cache — and nothing downstream
of it observes the present moment.

**What "byte-identical" means, precisely.** It is a property of *the same cache*, not of the
outside world: re-running an emitter over an unchanged cache reproduces the artifacts byte
for byte, including in `--offline` mode and including after the system clock moves. It is
**not** a claim that re-fetching a source, or re-running a search, reproduces the same bytes
— a live endpoint can change its answer and an engine can change its mind. That is why every
non-reproducible input, network **and** engine, is required to enter through the cache and to
carry the identity of what produced it (source URL and `retrievedAt`; engine id, version,
profile and budget). Determinism is achieved by recording, not by hoping.

### 2. Licence and attribution enforcement

**The content/data-rights axis is SETTLED** (owner ruling 2026-08-12,
`design/02-product-shape.md` §Product posture, `:41-50`): **authored pack prose is
`CC-BY-SA-4.0` wholesale.** Not "when something was borrowed" — wholesale. That is the
posture `design/research/theory-sourcing.md:61-63` calls option (b), chosen precisely
because option (a) and option (b) must not be mixed: "Do not mix per-paragraph — provenance
tracking will not survive edits."

Two things follow, and the withdrawn draft got the second one backwards:

1. Share-alike sources are **accepted**, not refused. What replaces the refusal is an
   *encoding* obligation.
2. **`provenance.licence` is not a per-pack decision and is not conditional on borrowing.**
   Every pack an emitter writes declares `"licence": "CC-BY-SA-4.0"`, including packs that
   borrow nothing, because the licence describes the pack's own prose under a project-wide
   ruling. A field written only when something was borrowed would encode the opposite claim —
   that some packs are not share-alike — which is the per-paragraph mixing the dossier
   forbids. What varies between packs is `attribution[]`, not `licence`.

`provenance` accepts extra keys (`schemas/drill_pack.schema.json:474`), so this encodes
inside the shipped schema with no schema change:

```jsonc
"provenance": {
  "reviewStatus": "draft",
  "sources": ["…"],
  "reviewers": [],
  "licence": "CC-BY-SA-4.0",
  "attribution": [
    {
      "sourceId": "wikibooks-chess-opening-theory",
      "title": "Chess Opening Theory/1. e4/1...c6/2. d4/2...d5/3. e5",
      "url": "https://en.wikibooks.org/wiki/…",
      "retrievedAt": "2026-08-12T10:44:56Z",
      "licence": "CC-BY-SA-4.0"
    }
  ],
  "graduationBlockers": ["…"]
}
```

Rules, all enforced by `sourcing-check` (§5):

- **Every emitted pack declares `provenance.licence: "CC-BY-SA-4.0"`.** Unconditionally, in
  all four pipelines, whether or not anything was borrowed.
- A pack whose prose derives from a share-alike source additionally carries one
  `provenance.attribution[]` entry per contributing source, each with all five fields.
  `attribution[]` entries are sorted by `sourceId` then `url` so the digest is stable.
- **`ATTRIBUTION_MISSING`** — a `sources.json` entry with `shareAlike: true` contributed
  prose to the pack and no `attribution[]` entry has a matching `sourceId` **and** `url`.
- **`LICENCE_MIXED`** — the pack's declared posture and its borrowings disagree. Concretely:
  `provenance.licence` is present and is not `"CC-BY-SA-4.0"`; or an `attribution[]` entry's
  `licence` is a value CC-BY-SA-4.0 cannot carry forward (the accepted set is `CC0-1.0` and
  `CC-BY-SA-4.0`, per §1.2's closed manifest set — an NC-, ND- or unlicensed-prose source is
  refused at the point of use, not at publication).
- **Absence of `provenance.licence` is not an error and must never become one.** The three
  hand-authored drafts —
  `content/drafts/{anti-caro-advance,carlsbad-minority-attack,rook-4v3-same-side}.json` — have
  no such field, borrow no prose, and are covered by the project-wide ruling without any
  edit. They stay valid, stay publishable, and are not touched by this RFC (§Acceptance 23).
  **Hand-authored packs must not become unpublishable by tooling.** The unconditional rule
  above binds *emitters*; the check only rejects a `licence` that is present and wrong.
- "Contributed prose" is determined by the manifest, not by inference: an emitter records
  which `sourceId` supplied which prose pointer in `evidence.json`, and a source that
  supplied only geometry, names, or numbers never triggers `ATTRIBUTION_MISSING`. P1 (§4)
  is in that class: ECO codes and move sequences are facts, not prose — so a P1 candidate
  carries `licence: "CC-BY-SA-4.0"` and an **empty** `attribution` set, which is exactly the
  claim being made: our prose, share-alike, nothing borrowed.
- `licence` is inside the digest (`docs/drill-pack-format.md:73-78`), so adding it changes a
  pack's identity. That is free for candidates, which are emitted with it from the start, and
  is one more reason the existing drafts are left alone rather than retrofitted.

### 3. The grounding contract

`content/drafts/anti-caro-advance.json:273-277` and `planning/content-era/plan.md` §3b fix
the bar: every strategic assertion needs a citable reviewed source, engine/corpus validation
that bears on the claim, or a strong reviewer's sign-off. §3b names five assertion
categories: `objective.summary`, every `planClasses[].description`, every
`spine[].annotations` entry, every `feedbackClaims[].text`, and every `deviations[].note`
*and its `class`*.

#### 3.1 Closed record vocabulary

`evidence.json` `kind` is one of exactly: `opening_identity` (B6a), `position_legality`
(any), `explorer_frequency` (B6c), `tablebase_result` (B6b), `engine_eval` (B6b),
`puzzle_provenance` (B6d). Adding a kind requires an RFC amendment — same discipline as
`SUPPORTED_CHECKPOINT_ACTIONS` (`apps/server/src/pack-validation.ts:11`): vocabulary grows
only when a consumer grows. `sourcing-check` ships the whole vocabulary from day one so the
later RFCs add producers, not validators.

#### 3.2 Which grounding kinds each pipeline can supply

| Pipeline | Citable reviewed source | Engine/corpus validation | Reviewer sign-off |
|---|---|---|---|
| **B6a chess-openings** | **Yes**, and only for one class of fact: this move sequence is named *X* with ECO *Y*. It is a naming authority, not a theory authority | No | **Never** |
| **B6b Syzygy** | No | **Yes, exact**, for win/draw/loss + DTZ/DTM at ≤7 pieces. Out of range it supplies nothing, and the Stockfish substitute is an *evaluation*, never a result | **Never** |
| **B6c explorer** | No — it is aggregate data, not a text a reader can check | **Yes**, and only for frequency and result-share at a stated rating band, speed set, and date window | **Never** |
| **B6d puzzle DB** | **Yes**, for position provenance: this position occurred in this game at this ply (`GameUrl`) | **Yes**, for one difficulty fact: this position is a rated tactic of difficulty *R* with themes *T*, played *N* times. That is a statement about solvers, not about chess | **Never** |

The last column is uniform and is the point: **no pipeline can supply reviewer sign-off, so
no pipeline can promote a pack.** `pack-validation.ts:80-101` already enforces the crude
floor (`reviewed`/`published` ⇒ non-empty `sources` **and** `reviewers`), and every emitter
writes `reviewers: []`, so a candidate is mechanically unpromotable until a human is named.

#### 3.3 Machine-validatable vs human-only, field by field

*Machine-validatable — already, by shipped code or by these four RFCs:*

| Field | Validator |
|---|---|
| `start.fen` legality | `packages/schema/src/drill-pack/lint.ts:218` (shipped) |
| `spine[].moveUci` legality, `moveSan` agreement | `lint.ts:143-162` (shipped) |
| spine id uniqueness; checkpoint / `authoredBoundary` / `deviations` node references | `lint.ts:133-140`, `:236-248` (shipped) |
| checkpoint action, feedback policy, opponent mode, objective condition executability | `pack-validation.ts:103-178` (shipped) |
| graduation floor (sources + reviewers non-empty) | `pack-validation.ts:80-101` (shipped) |
| the opening's name and ECO code | B6a |
| "this ≤7-piece position is a win/draw/loss, DTZ *n*" | B6b |
| "this move is played *p*% at 1400–2000 over *N* games" | B6c |
| "this position is a rated tactic at *R* with themes *T*" | B6d |
| "the engine evaluates this line at ±*cp* at depth *d*" | shipped judge, authoring profile (B6b) |

*Human-only, permanently — no pipeline in these four RFCs or any obvious extension:*

| Field | Why no machine reaches it |
|---|---|
| `objective.summary` | it states what the learner is being taught, which is a pedagogical choice |
| `planClasses[].description` | a plan is a human abstraction over many move orders; no source enumerates it |
| `spine[].annotations[]` | "the bishop leaves before …e6 shuts it in" is causal explanation |
| `feedbackClaims[].text`, where causal | "whoever is better developed when it lands usually wins the tension" is not a frequency |
| **`deviations[].class`** | the classes (`schemas/drill_pack.schema.json:418-426`) are relative to *this pack's objective*. Engine eval cannot separate `concept_violation` from `interesting_deviation`: `content/drafts/anti-caro-advance.json` marks `e1g1` a `concept_violation` while explicitly saying it "is not a blunder" (`:245`). No evaluation distinguishes those |
| `deviations[].offObjective` | same reason |
| `difficulty.label`, checkpoint `label` | framing |

**The one permitted crossing, and how it is checked.** A machine record may support a prose
pointer **only** when its `kind` has a *registered prose template* and the prose is
**byte-equal** to a deterministic re-render of that template from the record's `values`.
The mechanism, in `sourcing-check`:

1. Templates are a compile-time table keyed by `kind`: `{ kind, templateId, requiredValues[],
   render(values) -> string }`. There is no runtime registration and no template in a data
   file.
2. A record supporting a prose pointer must carry `templateId`. If `kind` has no template,
   or `templateId` is unknown for that `kind`, the result is `EVIDENCE_OVERREACH`.
3. Every name in `requiredValues` must be present in `values` with the declared type and
   unit. A missing, extra, or wrongly-typed value is `EVIDENCE_VALUES_INVALID` — the check
   never "looks for a numeral".
4. Any derived value in `values` is recomputed and compared exactly. (B6c's template derives
   `pct` from `playedCount` and `total`; a mismatch is `EVIDENCE_VALUES_INVALID`.)
5. `render(values)` is compared to the pack's string with `===`. Not substring, not
   normalized, not case-folded. Anything else is `EVIDENCE_OVERREACH`.

Consequently a supported sentence is **generated**, not matched: the author's only options
are to keep the generated sentence verbatim or to lose the support. This is the single case
where "Stockfish: +0.54 / Maia: 31% / LLM: '…centralizes the knight'" does *not* apply,
because the sentence **is** the number. **B6a ships the table empty**, so under B6a alone
every prose support fails. B6c adds the first and only row.

### 4. P1 — `lichess-org/chess-openings`: the name↔line skeleton

**Input.** Five TSVs `a.tsv`..`e.tsv`, columns `eco`, `name`, `pgn`
(`design/research/theory-sourcing.md:20-22`, header re-verified live 2026-08-12). Pinned by
commit SHA, never `master`. CC0-1.0.

**Normalization.** Parse `pgn` with `parsePgn` from `chessops/pgn` — the first production
use of the ingest side (§0), and therefore the first module that must handle malformed
third-party PGN. Walk from the standard start with `chessops/chess`, producing `(uci, san)`
per ply; a row whose `pgn` does not parse or does not walk legally is skipped with a named
error, never partially emitted.

**Invocation.** `--eco`, `--name` (or `--prefix`), `--split-ply k`, and **`--learner-side
white|black`, which is required and has no default.** `start.side` is the learner's colour,
not the FEN's side to move (§0), and the TSV does not say which side's repertoire a line
represents. Deriving it would be inventing intent; defaulting it would put a silent wrong
answer in half the packs.

**Emission.**

| Pack field | Value | Legality |
|---|---|---|
| `id` | slug of `` `${eco}-${name}` `` lowercased, non-`[a-z0-9]` runs → `-`, leading non-alnum stripped | `^[a-z0-9][a-z0-9-]*$`, `schema:78-81` |
| `version` | `"0.1.0"` | `schema:82-84` |
| `title` | the `name` verbatim | `nonEmptyString`, `schema:74-77` |
| `mode` | `"line"` | `schema:23`; root-required (`schema:7-18`) |
| `phase` | `"opening"` | `schema:24-26` |
| `start.fen` | FEN after the first `k` plies | legality checked by `lint.ts:218` |
| `start.movesSan` | the first `k` SANs | `schema:113-116`. Served to the browser (`pack-registry.ts:59`) and legitimately so: these moves are how the position arose, and this pack's answer is the *spine* that follows them (§1.1) |
| `start.side` | the `--learner-side` value | `schema:117`; schema-optional, client-required (§0) |
| `spine` | remaining plies as a single chain; node ids `` `p${k+1+i}-${sanSlug}` `` | `minItems: 1` if present (`schema:39-43`); walked by `lint.ts:228` |
| `objective.type` | `"play_until_checkpoint"` | `schema:121-133`; the only condition-free honest type |
| `objective.summary` | the pinned template below | `schema:137-139`, `nonEmptyString` |
| `objective.successConditions` | `[{ "kind": "reach_checkpoint", "checkpointId": "line-end" }]` | the only executable condition (`pack-validation.ts:160-178`) |
| `checkpoints` | exactly one: `{ "id": "line-end", "trigger": { "atPly": <spine length> }, "actions": [] }` | `minItems: 1` (`schema:44-48`); empty `actions` is the shipped "offers no action" encoding (`docs/drill-pack-format.md:38-41`) |
| `opponentPolicy` | `{ "mode": "theory_strict" }` | `capabilities.ts:10-14`. Legitimate here **because the pack has a spine**; without one it would silently degrade (`opponent-selector.ts:453-458`) |
| `feedbackPolicy` | `"delayed_checkpoint"` | `pack-validation.ts:103-122` |
| `provenance` | `reviewStatus: "draft"`, one CC0 source string, `reviewers: []`, `licence: "CC-BY-SA-4.0"` (§2, unconditional), no `attribution` (nothing borrowed), `graduationBlockers` listing every unwritten assertion category | `schema:458-475`, `additionalProperties: true` at `:474` |

**`objective.summary` is generated, exactly.** The literal placeholder an earlier draft left
here (`"<mechanical, §5.2>"`) was not implementable, and "P1 emits no objective" is not
available either: `objective` is root-required (`schema:7-18`) and `summary` is required
inside it (`schema:137`). So the emitter generates it from this template, character for
character, with `${m}` the decimal spine length:

```
Play the recorded line to its end: ${m} plies from this position.
```

It states an instruction and no chess fact, so no evidence record ever supports it (§3.3
makes `objective.summary` human-only and B6a's template table is empty). Because it is a
placeholder and not a teaching objective, every P1 candidate carries the
`graduationBlockers` entry:

> `objective.summary is the emitter's mechanical placeholder; an author must replace it with this pack's actual teaching objective before reviewStatus leaves draft`

**Slug collisions** (two rows normalizing to one id) are resolved by appending `-2`, `-3` in
ascending `(eco, name)` order — deterministic across runs — and the original `eco`/`name` is
recorded verbatim in `provenance.sources` and in `evidence.json`.

**What P1 emits into `evidence.json`:** one `opening_identity` record per emitted spine node,
`grounds: "citable_source"`, supporting only `/spine/**/moveSan` and `/title`. No
`templateId`, because it supports no prose. Nothing else.

**Deliberately absent:** no `annotations`, no `planClasses`, no `deviations`, no
`feedbackClaims`, no `concepts`, no `difficulty`, no `authoredBoundary`. The seed is
geometry, per `planning/breadth/create-and-return.md` §A4.2.
`checkpoints[0].trigger` is `atPly` and not `atSpineNode` on purpose: a single
non-`atSpineNode` checkpoint suppresses `AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` entirely
(`lint.ts:50-60`), which is correct for a seed carrying no prose and becomes the author's
problem the moment they add some.

**What P1 could have filled in `content/drafts/anti-caro-advance.json`:** `start.fen`,
`start.movesSan` (`1.e4 c6 2.d4 d5 3.e5` is B12, Caro-Kann Defense: Advance Variation), the
spine geometry of `bf5-main`/`nf3`/`e6`/`be2`/`c5-break` (all named lines), `title`,
`start.side`, and the one source string already sitting at `:269`. It could have filled
**none** of the five annotations, three plan-class descriptions, five deviation notes, two
claims, or the real `objective.summary`.

### 5. Surfaces and commands

New code, all of it CLI, all of it under `apps/server/src/sourcing/` so it imports the
shipped `validatePackDocument` from `apps/server/src/pack-validation.ts:182` directly — the
`planning/breadth/create-and-return.md` §A4.3 invariant that an emitter cannot produce
something that validates in one path and fails at registry load.

Three entrypoints, added to the existing esbuild `build` script alongside `src/main.ts
src/pack-check.ts` (`apps/server/package.json:7`), and three `Makefile` targets following
the `pack-check` pattern (`Makefile:23-26`):

```
make source-fetch    SOURCE=<source-id> [OFFLINE=1]   # populate content/sources + sources.json
make candidate-emit  PIPELINE=<id> ARGS=…             # write content/candidates/<id>/
make sourcing-check  DIR=content/candidates/<id>      # validate the whole triple
```

`PIPELINE` values are added by the RFC that ships them: `openings` here, `syzygy` in B6b,
`explorer` in B6c, `position-seeds` in B6d. An unknown value is an error listing the
registered set.

`sourcing-check` is the gate and runs in CI. It:

1. runs `validatePackDocument` on `pack.json` and prints `PackValidationIssue[]` in the
   `apps/server/src/pack-check.ts:62-64` format;
2. asserts every `sources.json` entry has a well-formed `licence` — `LICENCE_FIELD_INVALID`
   for a `basis`/`spdx`/`rationale` combination §1.2 does not permit — and that no entry's
   host or `sourceId` is on the deny list; fails `MANIFEST_EMPTY` when there are no entries;
3. asserts the §2 encoding: `provenance.licence` is `"CC-BY-SA-4.0"` when present and the
   candidate's emitter wrote it, `ATTRIBUTION_MISSING`, `LICENCE_MIXED`, and the
   `provenance.sources[]` string obligations from §1.2;
4. resolves every `evidence.json` `supports` pointer, and fails on `EVIDENCE_ANCHOR_BROKEN`,
   `EVIDENCE_OVERREACH`, `EVIDENCE_VALUES_INVALID`, or a `deviations[*]/class` support;
5. recomputes `sourcedAt` from the consumed manifest entries and fails
   `EVIDENCE_TIMESTAMP_DERIVED` if the stored value differs;
6. warns `EVIDENCE_DIGEST_STALE` when `packDigest` no longer matches `digestDrillPack(pack)`;
7. fails if `provenance.reviewStatus !== "draft"` or `reviewers` is non-empty — a candidate
   is not permitted to arrive pre-approved.

**Audit mode.** `make sourcing-check DIR=content/packs` runs the same checks in
**warning-only** mode: every failure is reported and the exit status is 0. This catches a
promoted pack whose evidence went stale without making publication depend on sidecars that a
hand-authored pack legitimately lacks — `content/drafts/anti-caro-advance.json` has no
sidecar and must not become unpublishable by tooling. Warning-only is the mode, not a flag:
`DIR` under `content/candidates/` is strict, `DIR` anywhere else is advisory.

**Publication stays a separate, manual act:** moving a directory's `pack.json` into
`content/packs/`. `sourcing-check` refuses to write anywhere. This matters because the
registry serves whatever is in `content/packs/` with no `reviewStatus` filter (§0), so
"unpublished" is today a *directory* invariant, and this RFC is what makes it an enforced
one.

### 6. Landing order across the four RFCs

**B6a → B6b → B6c → B6d.** Three reasons, in order of weight:

1. **`design/04-content-architecture.md` §8's own batch order.** Batch 1 is one pack per
   phase — anti-Caro (opening), Carlsbad (middlegame), 4v3 rook (endgame). The opening and
   middlegame packs need *lines* (B6a). The endgame pack needs *result grading* (B6b).
   Explorer priority is §8's batch **3**; the on-ramp is batch **4**. The pipeline order is
   the content order.
2. **B6a is the blank-page fix and the input to the others.** B6c needs lines to query; B6b
   needs positions; B6d is independent but last by (1). B6a is also the only pipeline whose
   output is *directly* pack fields, so it is the shortest path to a real candidate.
3. **B6c is the only one with a verified live blocker** (401 from Lichess's nginx, §0).
   Putting the RFC with an unresolved access question first would make the whole program's
   first deliverable hostage to it.

B6b second rather than third is worth stating because it looks wrong: the pipeline whose
range excludes `design/04`'s named first endgame pack goes early. It goes early *because* of
that — the abstention path is the deliverable, and
`content/drafts/rook-4v3-same-side.json:526` shows an author already discovered it by hand.

## Deviations from design

1. **`design/04-content-architecture.md` §2c's frequency-driven priority is not delivered
   here at all.** B6a ships no priority signal; ordering stays arbitrary until B6c lands, and
   B6c may not land (its own §Gate 0). B6a is honest about this rather than implying that
   emitting lines makes the ordering principled.
2. **`objective.summary` is emitted as a mechanical placeholder** rather than left blank or
   authored, because the schema requires it and no machine can write the real one. This is a
   deviation from "the seed is geometry only" (`planning/breadth/create-and-return.md`
   §A4.2): a seed necessarily carries one sentence of non-geometry. It is neutralized by the
   `graduationBlockers` entry and by `objective.summary` being permanently human-only in
   §3.3.
3. **`--learner-side` is a required human input to an otherwise mechanical emitter.** The
   design tier treats pack seeding as derivable from a source; `start.side` is not. Stating
   it as an argument is preferable to a default that is wrong half the time.

## Acceptance criteria

**The B6 gate proof** (`design/03-product-breadth.md:101-103`, `planning/exploration/gates.md:127`):

1. **One unpublished candidate pack, emitted end to end by the real pipeline.**
   `make candidate-emit PIPELINE=openings ARGS='--eco D35 --name "Queen'\''s Gambit Declined:
   Exchange Variation" --split-ply 8 --learner-side white'` writes
   `content/candidates/<id>/{pack.json,evidence.json,sources.json}`.
   `make pack-check FILE=content/candidates/<id>/pack.json` passes.
   `make sourcing-check DIR=content/candidates/<id>` passes. The pack is **not** in
   `content/packs/`, `reviewStatus` is `draft`, `reviewers` is `[]`, and starting the server
   in production mode does not list it (`GET /packs` unchanged). The line is chosen so the
   gate proof is also useful content: QGD Exchange is the opening
   `design/04-content-architecture.md` §3 names as feeding the Carlsbad structure, which is
   §8's batch-1 middlegame pack.
2. **`--learner-side` is mandatory.** Omitting it exits non-zero with a message naming
   `start.side`; it never defaults to the FEN's side to move. A candidate emitted with
   `--learner-side black` on a line whose split position has White to move produces
   `start.side: "black"` and a FEN with `w` to move, and the shipped client's
   `packStartSide` (`apps/web/src/lib/screen-model.ts:54-60`) accepts it.
3. **`objective.summary` is the pinned string.** For a spine of 6 plies the emitted summary
   is exactly `Play the recorded line to its end: 6 plies from this position.`, and the
   candidate carries the placeholder `graduationBlockers` entry verbatim.

**Licence and attribution:**

4. `lichess-chess-openings` → `basis: "spdx"`, `spdx: "CC0-1.0"`,
   `attributionRequired: false`; the emitted `provenance.sources[]` contains the CC0
   statement and the pinned commit SHA; `provenance.licence` is `"CC-BY-SA-4.0"` and
   `provenance.attribution` is absent.
5. **Deny list:** a fetch against a `theweekinchess.com` or `pgnmentor.com` URL, and one
   against `sourceId: "ecochessopeningcodes"`, each fail with `SOURCE_DENIED` quoting
   `design/research/theory-sourcing.md:134-143`.
6. **The licence field space is closed and SPDX-honest.** `{ basis: "spdx", spdx: null }`,
   `{ basis: "spdx", spdx: "unlicensed-data" }`, `{ basis: "spdx", spdx: "NOASSERTION" }`,
   `{ basis: "no-rights-asserted", spdx: "CC0-1.0" }`, and
   `{ basis: "no-rights-asserted", rationale: "" }` each fail `LICENCE_FIELD_INVALID`; the
   two permitted shapes pass. A test asserts every value that ever reaches an `spdx` field is
   present in a committed list of SPDX short identifiers.
7. **Share-alike is enforced, not refused, and the ruling is wholesale.** A manifest entry
   with `CC-BY-SA-4.0` and a `noticeText` emits successfully; the same entry recorded as
   contributing prose to a pack with no matching `provenance.attribution[]` entry fails
   `ATTRIBUTION_MISSING`; a pack declaring `provenance.licence: "CC-BY-4.0"`, and one
   carrying an `attribution[]` entry with `licence: "CC-BY-NC-4.0"`, each fail
   `LICENCE_MIXED`. **Every** emitted candidate — including the P1 candidate of criterion 1,
   which borrows nothing — carries `provenance.licence: "CC-BY-SA-4.0"`.
8. **Hand-authored packs are unaffected.** All three of
   `content/drafts/{anti-caro-advance,carlsbad-minority-attack,rook-4v3-same-side}.json` pass
   `make pack-check` and audit mode unchanged, with no `licence` field and no sidecars, and a
   test asserts the absence of `provenance.licence` produces no issue at any severity above
   warning.
9. **A share-alike entry that supplied only geometry does not trigger attribution.** A
   fixture manifest entry with `shareAlike: true` whose `evidence.json` records support only
   `/spine/**/moveSan` passes with no `attribution[]`.

**Determinism and boundary conditions of shapes the schema permits** — the failure class
that killed five drafts:

10. **Offline reproducibility is byte-exact against one cache.** Every emitter runs under
    `--offline` in CI against committed fixtures; two consecutive runs produce byte-identical
    `pack.json`, `evidence.json` and `sources.json`, asserted by SHA-256 over each file. A
    third run with the system clock advanced by 48 hours produces the same three digests.
    The claim proved is the one §1.4 states — same cache, same bytes — and the test names it.
11. **No wall-clock field exists.** A test greps every emitted artifact for `generatedAt` and
    fails if it appears; `sourcedAt` equals the maximum `retrievedAt` of the consumed manifest
    entries; mutating `sourcedAt` by one second fails `EVIDENCE_TIMESTAMP_DERIVED`. A separate
    test asserts the lock file's timestamp appears in no artifact.
12. **A candidate with an empty manifest is refused** with `MANIFEST_EMPTY`.
13. **No emitter writes a key the schema forbids.** A property test emits one candidate and
    asserts it validates under Ajv `strict: true` with `additionalProperties: false` at the
    root — and asserts explicitly that no `spineNode`, `start`, `difficulty`, `planClass`,
    `checkpoint`, `deviation`, or `authoredBoundary` object carries an extra key.
14. **The fetch lock is cross-process, and its limits are proved rather than asserted.** Two
    emitter processes started simultaneously against a stubbed server that records arrival
    times issue their requests strictly sequentially; a test that removes the lock file
    mid-run shows both proceeding, which is the documented takeover behaviour and not a
    silent one; and a test asserts the client never claims coordination it does not have —
    the lock path is under `content/sources/`, and running two checkouts is out of its scope
    by construction.
15. **A `headers-only` source never writes a body to disk.** The emitter is run against a
    fixture larger than the 50 MB ceiling with the cache directory watched; no cache file
    exceeds a few kilobytes, the entry carries `etag`, `content-length` and `retrievedAt`,
    and a subsequent `--offline` run resolves from the committed row fixture rather than from
    a cached body.
16. **Evidence never enters the served projection.** `GET /packs/:id` for a promoted
    candidate contains no `evidence.json` field; the existing regression asserting no
    authored prose in the projection stays green and unmodified.
17. **The projection table of §1.1 is a test, not a claim.** A test calls
    `projectPackDocument` on a document carrying every optional field the schema allows and
    asserts, key by key, that exactly the served column appears and every field in the
    not-served column is absent — so a future widening of the projection breaks a sourcing
    test rather than silently publishing an emitter's private data.
18. **Digest stability under evidence refresh.** Rewriting `evidence.json` with new records
    leaves `digestDrillPack(pack)` byte-identical.
19. **Sidecars are not loadable as packs.** A test places `evidence.json` in a temporary
    drafts directory and asserts `PackRegistry.loadDefault({development: true,
    draftsDirectory})` throws `PACK_INVALID` — proving why §1 forbids that location.
20. **`theory_strict` is only emitted with a spine.** A test asserts every P1 candidate has a
    non-empty `spine`, and a second test constructs a spine-less pack with
    `opponentPolicy.mode: "theory_strict"`, runs one opponent selection, and asserts it takes
    the `#humanCommon` path (`opponent-selector.ts:453-458`) — the silent degradation B6b and
    B6d exist to avoid and B6a must never emit.
21. **`atPly` fires off-spine.** A P1 candidate played with a `human_common` opponent that
    deviates from the spine at its first reply still reaches `line-end`, and the objective
    transitions to `achieved` via `reach_checkpoint`. The same pack with an `atSpineNode`
    trigger is asserted **not** to fire.

**Grounding contract:**

22. **Prose support fails closed under B6a.** A record whose `supports` targets
    `/objective/summary`, `/spine/0/annotations/0`, or `/feedbackClaims/0/text` fails
    `EVIDENCE_OVERREACH` regardless of `kind`, because the template table is empty.
23. **Overreach on move grading is mechanically impossible.** A record whose `supports`
    targets `/deviations/0/class` fails `EVIDENCE_OVERREACH`.
24. **A broken pointer is an error, a stale digest is a warning.** Asserted separately, with
    the exit status of each.
25. **No candidate is promotable.** Flipping an emitted candidate's `reviewStatus` to
    `reviewed` without adding a reviewer fails `pack-check` with
    `GRADUATION_REQUIRES_REVIEWERS` (`pack-validation.ts:92-99`).

**Repo hygiene:**

26. `make verify` green; `content/sources/` in `.gitignore`; `content/candidates/README.md`
    stating the directory is candidates-not-content and why it is neither `drafts/` nor
    `packs/`.
27. `docs/` gains a canonical `content-sourcing.md` on implementation, covering B6a and
    amended by B6b/B6c/B6d as each lands; `design/research/theory-sourcing.md`'s
    coverage-matrix row is updated to note the 2026-08-12 re-verification.
28. `content/drafts/*.json` are **not modified** by this RFC — not by the licence rule of §2
    (absence of `provenance.licence` is not an error, criterion 8) and not by §4. Re-emitting
    or correcting them is authoring work under `planning/content-era/`, and the friction is
    logged there.

## Open questions

None.

## Changelog

- 2026-08-12: created, as B6a of the four-way split of the withdrawn
  `content-sourcing-pipelines.md` draft (adversarial review rejected the single document and
  recommended the split).
- 2026-08-12: revised against the per-file review that rejected the split's four documents.
  (1) All coordinates re-taken after F2 (`6f48e13`) and F3 (`1ae7922`): `rest.ts`,
  `service.ts`, `runtime.ts`, `types.ts`, `events.ts` and `session-controller.ts` had all
  moved, and `feedbackIsRevealed` — cited by two sibling RFCs — does not exist; the shipped
  function is `feedbackDisclosed` (`packages/runtime/src/feedback.ts:3-12`). (2) §2 rewritten
  to the wholesale CC-BY-SA-4.0 ruling: `provenance.licence` is written by every emitter
  unconditionally, not only when prose was borrowed, and absence stays legal so the three
  hand-authored drafts are untouched. (3) `unlicensed-data` removed from the `spdx` field:
  `spdx` now holds only listed SPDX identifiers, and the no-copyright case is a separate,
  explicitly non-SPDX `basis: "no-rights-asserted"` with a mandatory rationale. (4) The
  "concurrency 1, globally" claim replaced by what the mechanism delivers plus an `O_EXCL`
  lock file that makes it genuinely cross-process within one checkout, with the residual
  scope stated. (5) New §1.1 pins what `projectPackDocument` actually serves before play,
  which is what makes B6d's `start.movesSan` leak visible and fixable at the shared layer.
  (6) The cache gained `headers-only` and `engine` entry kinds so that streamed dumps and
  engine searches are covered by the determinism rule instead of contradicting it.
