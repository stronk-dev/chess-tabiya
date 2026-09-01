# R5 harness — Maia policy-scalar stability (disposable)

**Disposable research instrument**, permitted before an RFC under
`rfc/0000-rfc-process.md` §Exploration gate. It is tied to **R5** in
`planning/campaign-research-queue.md` and discharges
`rfc/archive/resistance-spectrum.md` acceptance criterion 5 (the 20-repeat probe).
Its result is `design/research/maia-policy-scalar-stability.md`. It is not
production code and nothing imports it.

It drives the repo's own `EngineSupervisor` (`apps/server/src/engine-supervisor.ts`),
`maiaDockerSpec` (`apps/server/src/maia.ts`), `OpponentSelector`
(`apps/server/src/opponent-selector.ts`) and `LichessTablebaseSource`
(`apps/server/src/tablebase.ts`) by relative import. No second UCI integration
and no second Maia command shape exists here — `probe-repeat.ts` reproduces
`#maia` (`opponent-selector.ts:469-499`) command for command.

## Run

```sh
SP=/tmp/r5 && mkdir -p $SP
build() { NODE_PATH="$PWD/apps/server/node_modules" pnpm --filter @chess-tabiya/server exec \
  esbuild "$PWD/tools/$2/$1.ts" --bundle --platform=node --format=esm --outfile="$SP/$1.mjs"; }
build extract r4-difficulty-harness
build select r5-maia-stability-harness
build probe-repeat r5-maia-stability-harness
build probe-carryover r5-maia-stability-harness
build probe-selection r5-maia-stability-harness
build probe-elo-record r5-maia-stability-harness

node $SP/extract.mjs content/drafts $SP/positions.json
node $SP/select.mjs  $SP/positions.json $SP/probe-set.json 2   # 2 per phase x colour x piece bucket

# Arm A — the acceptance-criterion probe: 35 positions x 3 bands x 20 repeats, blocked.
node $SP/probe-repeat.mjs $SP/probe-set.json $SP/armA.jsonl 1100,1500,1900 20 blocked auto armA
# Arm B — same keys, band 1500, round-robin order in a second container: order/process control.
node $SP/probe-repeat.mjs $SP/probe-set.json $SP/armB.jsonl 1500 20 interleaved auto armB
# Arm C — human_common's fixed MultiPV 8 request shape.
node $SP/probe-repeat.mjs $SP/probe-set.json $SP/armC.jsonl 1500 20 blocked 8 armC
# Arm D — diagnostic: the sampler switched off (not a shipped configuration).
MAIA_TEMPERATURE=0 node $SP/probe-repeat.mjs $SP/probe-set.json $SP/armD.jsonl 1500 20 blocked auto armD

node $SP/probe-carryover.mjs  $SP/probe-set.json $SP/carryover.jsonl 6
node $SP/probe-elo-record.mjs $SP/probe-set.json $SP/elo-record.jsonl
node $SP/probe-selection.mjs  $SP/probe-set.json $SP/selection.jsonl      1500 20 7
node $SP/probe-selection.mjs  $SP/positions.json $SP/selection-wide.jsonl 1500 20 40

for a in A B C D; do
  python3 tools/r5-maia-stability-harness/analyze.py $SP/analysis$a.json $SP/arm$a.jsonl
done
python3 tools/r5-maia-stability-harness/consequence.py $SP/selection.jsonl $SP/analysisA.json $SP/consequence.json
```

`probe-repeat.ts` records the whole `info` block's SHA-256 (first 16 hex) per
probe plus every candidate's **raw policy token text**, so "byte-identical" means
the emitted characters, not a float comparison. The patch emits `:.12g`
(`workers/maia/patches/maia3-uci-policy-mass.patch:9`), which is more significant
digits than a float32 round-trip needs.

`probe-selection.ts` shares one supervisor and one `LichessTablebaseSource`
across repeats — the tablebase positive cache never expires, so the tablebase
input is constant — and builds a **fresh** `OpponentSelector` per repeat so the
shipped in-process selection cache cannot answer.

## D490 current-code refusal rerun

Run the exact 40 historical roots through the current production selector with:

```sh
make practical-resistance-measurement
```

The target builds the pinned Maia image when absent, runs two able-to-fail population controls,
and retains both the exact tablebase inputs and deterministic three-repeat result under
`planning/practical-resistance/`. `probe-practical-resistance.ts` rate-limits live tablebase
requests, waits past the production source's 60-second negative-cache window before retrying, and
rewrites its tablebase cache in sorted order after each successful new probe. Subsequent runs make
no tablebase network requests. The output deliberately excludes latency so identical current-code
answers reproduce identical bytes.

The 40 FENs come from the committed historical `out/selection-summary.json`; the harness refuses
any population other than 40 unique roots. Re-rooting each request at the recorded FEN preserves
the exact position consumed by both Maia and Syzygy while avoiding a dependency on the discarded
historical path file. D457's retained exact-position rows supply pack attribution for all 40 roots,
and the harness refuses a missing join. The report retains both transformations and input digests.

## Artifacts in `out/`

Summary JSON only. The per-probe JSONL is regenerable from the committed pack
corpus and is not kept.
