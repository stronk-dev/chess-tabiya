# Engine-layer capability harness (disposable)

**Disposable research instrument**, permitted before an RFC under
`rfc/0000-rfc-process.md` §Exploration gate. It is tied to the owner question of
2026-08-15 — *"engine let's get it to 100% too"* — restated as *what is the
engine layer not doing, and what would 100% look like*. Its result is
`design/research/engine-layer-capability-audit.md`. It is **not production code
and nothing imports it.**

It drives the repo's own `EngineSupervisor` (`apps/server/src/engine-supervisor.ts`),
`maiaDockerSpec` (`apps/server/src/maia.ts`) and `stockfishPlaySpec`
(`apps/server/src/strong-engine.ts`) by relative import, and reproduces the
command shapes of `OpponentSelector#maia` and `#strongEngine` exactly. **No
second UCI integration and no second command shape exists here.** The R4, R5 and
R10 harnesses are the precedents; the position extractor
(`tools/r4-difficulty-harness/extract.ts`) and the stratifier
(`tools/r5-maia-stability-harness/select.ts`) are reused verbatim rather than
re-written.

Three arms:

- **`probe-maia-outputs.ts`** — what the pinned Maia emits on every MultiPV
  `info` line that `candidateLines()` (`opponent-selector.ts:234-256`) discards:
  `score cp` and `wdl`. 51 positions × bands {1000, 1500, 1900, 2400} × MultiPV 20.
  It sends **`Elo` only**: see the next arm for why sending the shipped triple
  would have measured band 1500 four times.
- **`probe-band-order.ts`** — the arm that found the live regression. Four
  command orders over 12 positions × 3 bands: `Elo` alone, the shipped
  `Elo`-then-`SelfElo`/`OppoElo`-defaults order, the reverse order, and
  `SelfElo`/`OppoElo` set to the band. Everything else held identical.
- **`probe-sf-budget.ts`** — is a reproducible `strong_engine` search bound
  affordable? 51 positions × {`movetime 100`, `depth 8/10/12/14/16`,
  `nodes 50000/200000`} × 2 repeats, through `#strongEngine`'s exact command
  shape including `resetSearchState: true`.

## Run

```sh
SP=/tmp/r11 && mkdir -p $SP
build() { NODE_PATH="$PWD/apps/server/node_modules" pnpm --filter @chess-tabiya/server exec \
  esbuild "$PWD/tools/$2/$1.ts" --bundle --platform=node --format=esm --outfile="$SP/$1.mjs"; }
build extract            r4-difficulty-harness
build select             r5-maia-stability-harness
build probe-maia-outputs engine-capability-harness
build probe-band-order   engine-capability-harness
build probe-sf-budget    engine-capability-harness

node $SP/extract.mjs content/drafts $SP/positions.json
node $SP/select.mjs  $SP/positions.json $SP/probe-set.json 3   # 3 per phase x colour x piece bucket

node $SP/probe-maia-outputs.mjs $SP/probe-set.json $SP/maia-outputs.jsonl 1000,1500,1900,2400 0
node $SP/probe-band-order.mjs   $SP/probe-set.json $SP/band-order.jsonl   1000,1500,2400      12
node $SP/probe-sf-budget.mjs    $SP/probe-set.json $SP/sf-budget.jsonl \
  movetime:100,depth:8,depth:10,depth:12,depth:14,depth:16,nodes:50000,nodes:200000 2

python3 tools/engine-capability-harness/analyze.py maia \
  tools/engine-capability-harness/out/maia-discarded-outputs.json $SP/maia-outputs.jsonl
python3 tools/engine-capability-harness/analyze.py sf \
  tools/engine-capability-harness/out/strong-engine-search-bound.json $SP/sf-budget.jsonl
```

Run the arms **one at a time**: the Maia arm and the Stockfish arm contend for
threads on the same host, and the Stockfish arm is a latency measurement.

The analyser is pure — given the same JSONL it rewrites the committed summaries
byte for byte. The band-order arm's summary is small enough that the dossier
carries its table directly; its JSONL is regenerable from the committed pack
corpus and is not kept.

## Artifacts in `out/`

Summary JSON only, plus the captured UCI handshake for each engine
(`*.identity.json`), which is the traceable source for every "the instrument
advertises …" claim in the dossier. Per-probe JSONL is regenerable and not kept.
