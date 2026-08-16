# k9-endgame-latency-harness — DISPOSABLE research instrument

**Not production code. Not implementation.** Permitted before an RFC under
`rfc/0000-rfc-process.md` §Exploration gate as an evidence instrument, tied to
ledger question **Q-04 / K9 / C7** (`planning/research-queue.md` §8) and logged
in `design/research/endgame-latency-versus-cet.md`, which is the only place its
numbers are interpreted.

Built 2026-08-16 against commit `4a6ad91`.

## Why a new instrument at all

The brief for this pass said to prefer the shipped browser suite. It could not
be used as-is, for two reasons, both recorded in the dossier:

1. **`make test-browser` could not start its web server** during this pass. A
   concurrent session held uncommitted changes to `schemas/drill_pack.schema.json`,
   `packages/schema` and `apps/server/src/pack-validation.ts`; under that working
   tree 55 of 56 draft packs fail validation and `NODE_ENV=development` throws at
   boot. `make-headtree.sh` exists to measure **HEAD as committed** instead.
2. **The shipped envelope is one sample per operation on an opening pack.**
   `tests/browser/drill.spec.ts` records `boardReadyMs`, `rewindMs`,
   `branchSwitchMs`, `uncachedMockReplyMs`, `cachedMockReplyMs` once each, on the
   Najdorf schema-example. K9 is about the **endgame** surface and a single
   reading is not a measurement.

## Parts

| File | What it does |
|---|---|
| `make-headtree.sh` | Extracts HEAD outside the repo, re-points `@chess-tabiya/*` at that tree so no dirty workspace source is bundled, empties `content/drafts`, and copies in the named endgame packs |
| `serve.ts` | Boots the shipped `createApplication` with a stated configuration; `K9_REAL_TABLEBASE=1` injects the shipped `LichessTablebaseSource` so `perfect_tablebase` reaches real Syzygy instead of the empty `FixtureTablebaseSource` that `ENGINE_MODE=mock` installs |
| `api-arm.mjs` | Per-instrument-call distributions over the shipped HTTP routes (median/p95 convention copied from `apps/server/src/latency.test.ts`) |
| `browser-arm.spec.ts` + `playwright.k9.config.ts` | Perceived, in-page distributions: board ready, run reload, opponent reply, rewind |
| `playability-probe.mjs` | Can the authored first move be made at all, per pack, per viewport |
| `occlusion-probe.mjs` | Hit-tests all 64 squares per pack per viewport and reports which are covered and by what |
| `cet-endpoint-arm.mjs` | Controls the CET comparison for network: same FENs against `tablebase.lichess.ovh` (CET's endpoint) and `tablebase.lichess.org` (ours), back to back, from this machine |

## Reproducing

```sh
S=/tmp/k9
bash tools/k9-endgame-latency-harness/make-headtree.sh $S/headtree \
  lucena-bridge-convert philidor-third-rank-hold mate-bishop-knight \
  mate-k-r-technique pawn-opposition-convert queen-vs-pawn-seventh-convert
cp $S/headtree/packs/*.json $S/headtree/content/drafts/
NODE_ENV=development ENGINE_MODE=mock K9_REAL_TABLEBASE=1 PORT=4180 \
  STATIC_DIRECTORY=$S/headtree/apps/web/dist node $S/headtree/apps/server/dist/serve.js &

node $S/headtree/apps/server/dist/fen-walk.js $S/headtree/content/drafts/*.json > $S/fens.txt
# keep the <=7-piece FENs from column 2 into $S/endgame-fens.txt

node tools/k9-endgame-latency-harness/api-arm.mjs http://127.0.0.1:4180 \
  $S/endgame-fens.txt $S/headtree/content/drafts 60
./node_modules/.bin/playwright test -c tools/k9-endgame-latency-harness/playwright.k9.config.ts
node tools/k9-endgame-latency-harness/occlusion-probe.mjs http://127.0.0.1:4180 1440x1000 1920x1080 1366x768
node tools/k9-endgame-latency-harness/cet-endpoint-arm.mjs $S/endgame-fens.txt 40
```

## What it deliberately does not measure

- **Maia.** `make up` defaults to `ENGINE_MODE=mock`, and no Maia container was
  run in this pass, so every `human_common` number here is a **mock opponent**
  and is not a latency finding about the real opponent.
- **Stockfish feedback.** Same reason.
- **Branch switch in the browser.** `switchBranch` is `rewind`
  (`apps/web/src/lib/session-controller.ts:428-429`), so the rewind distribution
  covers the operation; an independent DOM measurement was attempted, could not
  be observed, and is filed as an open question rather than a number.
