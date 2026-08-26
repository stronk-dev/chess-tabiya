# k9-endgame-latency-harness — DISPOSABLE research instrument

**Not production code. Not implementation.** Permitted before an RFC under
`rfc/0000-rfc-process.md` §Exploration gate as an evidence instrument, tied to
ledger question **Q-04 / K9 / C7** (`planning/research-queue.md` §8) and logged
in `design/research/endgame-latency-versus-cet.md`, which is the only place its
numbers are interpreted.

Built 2026-08-16 against commit `4a6ad91`. **Extended 2026-08-17 for the re-run
against commit `451bb44`**, after the D507 layout fix (`442b8a3`) — see
§"Re-run additions (2026-08-17)" below and §10 of the dossier.

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
| `api-arm.mjs` | Per-instrument-call distributions over the shipped HTTP routes (median/p95 convention copied from `apps/server/src/latency-performance.test.ts`) |
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

## Re-run additions (2026-08-17)

Same job, same ledger question, commit `451bb44`. Seven files added; nothing
above was changed except this README.

| File | What it does and why the 2026-08-16 version could not |
|---|---|
| `rerun-2026-08-17.sh` | `make-headtree.sh` with one correction: it runs `vite build` **inside the extracted tree** instead of copying `$REPO/apps/web/dist`. The D507 fix lives in `apps/web/src/lib/DrillScreen.svelte`, so reusing the working tree's bundle would have measured an implementer's uncommitted CSS. Asserts the D507 clamp is present in the built CSS before returning |
| `playability-probe-2.mjs` | `playability-probe.mjs` with two corrections that only became visible once the board was reachable: each gesture gets its **own fresh run** (the original attempted drag then click in one run, so after the fix the click attempt was replaying an already-made move), and board **orientation** is honoured (`philidor-third-rank-hold` is Black to move and renders flipped) |
| `length-sweep.mjs` | Writes clones of one endgame pack differing **only** in `objective.summary` length — 68 … 4000 characters — to find the length at which the fixed layout breaks. It does not |
| `selection-shift-probe.mjs` | Board geometry and 64-square hit test in **two states**: at rest, and after the pack's authored origin square is clicked. The 2026-08-16 probes only ever measured the resting state |
| `human-aim-probe.mjs` | Aims every pointer event at where the square is **drawn at that instant** and records the **SAN actually delivered** against the pack's authored move. The earlier probes computed coordinates once, before the gesture — which is exactly the mapping the remaining defect applies, so they and the bug cancelled |
| `invariant-after-select-probe.mjs` | Transcribes all eight clauses of the shipped `assertRunViewport` and re-evaluates them one click later. All eight pass in a state where the board cannot be played |
| `click-move-probe.mjs` | The intermediate step that isolated the cause: runs each click-to-move twice, once aimed with the **pre-gesture** grid and once with the **post-selection** grid, and reports what is on top of the target in each. Kept because it is the cleanest demonstration that the naive aim and the defect agree — superseded for headline numbers by `human-aim-probe.mjs`, which also records the delivered SAN |

### Reproducing the re-run

```sh
S=/tmp/k9r
bash tools/k9-endgame-latency-harness/rerun-2026-08-17.sh $S/headtree 451bb44 \
  lucena-bridge-convert philidor-third-rank-hold mate-bishop-knight \
  mate-k-r-technique pawn-opposition-convert queen-vs-pawn-seventh-convert
cp $S/headtree/packs/*.json $S/headtree/content/drafts/

# cwd MUST be the headtree: graduation ruling citations resolve relative to it.
cd $S/headtree
NODE_ENV=development ENGINE_MODE=mock K9_REAL_TABLEBASE=1 PORT=4180 \
  STATIC_DIRECTORY=$S/headtree/apps/web/dist node $S/headtree/apps/server/dist/serve.js &

B=http://127.0.0.1:4180
D=$S/headtree/content/drafts
node tools/k9-endgame-latency-harness/occlusion-probe.mjs            $B 1920x1080 1440x1000 1440x900 1366x768 1280x720
node tools/k9-endgame-latency-harness/playability-probe-2.mjs        $B 1440x1000 $D
node tools/k9-endgame-latency-harness/selection-shift-probe.mjs      $B $D 1440x1000 1366x768 1280x720
node tools/k9-endgame-latency-harness/human-aim-probe.mjs            $B $D 1440x1000 1366x768 1280x720
node tools/k9-endgame-latency-harness/invariant-after-select-probe.mjs $B $D 1440x1000 1366x768 1280x720
node tools/k9-endgame-latency-harness/length-sweep.mjs $D mate-k-r-technique 68 150 300 444 600 900 1400 2200 4000
# ... restart the server, re-run occlusion-probe.mjs, then delete the k9len-*.json clones

# browser latency arm, writing OUTSIDE the repo
K9_BROWSER_OUT=$S/k9-browser-arm.json K9_PORT=4180 \
  node_modules/.bin/playwright test -c tools/k9-endgame-latency-harness/playwright.k9.config.ts
```

The API arm (`api-arm.mjs`) and the CET endpoint arm (`cet-endpoint-arm.mjs`)
were **not** re-run on 2026-08-17: neither is downstream of a client layout
change. Their 2026-08-16 numbers are carried forward and labelled as such in the
dossier.
