# Tablebase grounding and perfect resistance

Tabiya has two Syzygy paths over the same seven-piece boundary. The authoring path verifies an existing drill pack and emits durable evidence artifacts. The runtime path selects a deterministic tablebase move and records that exact policy as applied. Neither path silently substitutes an engine result for a tablebase fact.

## Verifying an authored draft

Run:

```sh
make verify-draft FILE=content/drafts/<pack>.json
```

The command first applies the living pack schema and semantic lints, then dispatches on `objective.grading.assessedBy.kind`. This page describes the `syzygy` branch; the `engine` branch is documented in `engine-grounding.md`. The Syzygy branch walks the root, every spine node, and every authored deviation with chessops. Positions are queried at seven pieces or fewer; an out-of-range free-FEN deviation anchor becomes an explicit abstention.

The command writes flat sibling artifacts:

- `<stem>.evidence.json`
- `<stem>.sources.json`
- `<stem>.job.json`

Evidence is limited to legality and tablebase-result facts. It never grounds prose or a deviation class. A queried root must exactly match the declared category and piece count; the tool updates only the root declaration's `sourceId` and `retrievedAt`. A learner spine move that worsens the learner-perspective tablebase category is refused, while a category-changing opponent reply is retained with a warning.

An online run's emitted ledger and manifest pass the existing validators and linkage rules, carry the current canonical pack digest, and must earn `ledger_verified` through the same `assessmentGrounding` function used by the pack registry. A stale or unstamped ledger is unverified even when its root record still matches. `OFFLINE=1` uses committed per-FEN fixtures to exercise transformation and validation without network access. Those inputs are recorded as local files and deliberately remain `unverified`: an offline fixture is not evidence that an HTTP tablebase query occurred. Promotion requires a successful, manifest-linked query to `tablebase.lichess.org` for the assessed root.

For exploration before a pack declares an assessment, `make tablebase-walk
FILE=<pack.json>` (or `FENS=<positions.txt>`) emits a read-only
`tabiya.sourcing.walk.v1` report. It probes authored positions and, by default,
enumerates every legal move at learner decisions. `--max-queries` is a hard budget;
`OFFLINE=1` records missing fixture successors as abstentions. The walker never edits a
pack or writes admission sidecars. Successful online probes are cached without expiry
under the gitignored `content/sources/syzygy/` directory, keyed by normalized position
plus halfmove clock, so a repeat walk performs no network request.

For evidence adoption rather than exploration, run:

```sh
make tablebase-census FILE=content/drafts/<pack>.json
```

The census writer uses the narrower, declared Stage-2 population: authored start/spine
positions with seven pieces or fewer. For each non-terminal parent it enumerates the exact
legal successors and writes one `tablebase_result` per unique successor into the existing
evidence ledger, retaining all queen, rook, bishop, and knight promotions. Existing unique
facts are reused; duplicate facts for one successor are refused. It preserves unrelated
records, abstentions, bindings, and their manifest sources, re-stamps the current pack
digest, and removes only manifest entries no longer referenced by the merged artifacts.

The default 400-query ceiling is per pack. Compilation and the full sourcing validation run
before either sidecar moves; both next images are staged first, and an ordinary rename failure
after the first replacement restores the original bytes. This is a mechanical evidence
operation: it does not add `moveCensus` claims or decide which prose deserves one.

Pack declarations distinguish five determinate categories (`win`, `loss`, `draw`,
`cursed-win`, `blessed-loss`) from uncertain Syzygy categories. Cursed/blessed roots are
admitted only for compatible objectives and require a declared ply budget long enough to
reach halfmove 100.

## Perfect tablebase resistance

`perfect_tablebase` is an executable pack-run opponent mode. It is published only when a tablebase provider is configured and is recorded on every selection as `policyModeApplied: "perfect_tablebase"` with the synthetic identity `lichess-tablebase` / `Syzygy (tablebase.lichess.org/standard)` / `7man`. An empty mock fixture is provider absence, not a configured provider: the default mock stack therefore omits both `perfect_tablebase` and `practical_resistance` instead of advertising modes whose every probe would refuse.

The interactive provider uses `tablebase.lichess.org/standard` with percent-encoded FENs, one request at a time, identical-request coalescing, a bounded queue, a 512-entry positive LRU, and a 60-second negative cache after upstream failures. Positive facts have no TTL because tablebase results are immutable.

The API reports each move's category for the resulting position's side to move, so selection inverts that category back to the current mover's perspective. It keeps only legal, category-preserving moves and orders winning positions by shortest absolute DTZ and losing positions by longest. Every residual tie, including the whole drawn-root set, is resolved by ascending `sha256(positionKey + "\\0" + uci)` with UCI retained only as an unreachable hash-collision totalizer. `positionKey` is the first five FEN fields: board, side to move, castling, en-passant, and halfmove clock. It deliberately excludes only the fullmove counter, which has no chess content. The digest order removes the measured alphabetical bias toward captures and pawn moves while remaining a pure function of the probed position. It therefore composes with the fixed-resistance branch reply journal.

Selections declare the basis they can honestly support: `dtz_ascending` for win/cursed-win,
`dtz_descending` for loss/blessed-loss, and `none` for a drawn root. Candidate `rank` under
`none` is presentation order only and must not be rendered as preference. Pack validation
warns when `perfect_tablebase` is paired with a `hold` objective because the exact result
class supplies no difficulty ordering; `practical_resistance` is the separate measured mode.

Named refusals are part of the contract:

- pack validation rejects a `perfect_tablebase` root above seven pieces;
- deployments without a provider omit the mode from capabilities;
- upstream outage or timeout returns `TABLEBASE_UNAVAILABLE` without committing a substitute move; and
- an over-range runtime position returns `TABLEBASE_OUT_OF_RANGE`.

Pack-free position sessions remain limited to `human_common` and `strong_engine`. Run schema
v0.13 and storage migration 18 added the persisted policy value. Run schema v0.17 and
stamp-only migration 23 add optional `orderingBasis`; historical selections remain absent
rather than being inferred.
