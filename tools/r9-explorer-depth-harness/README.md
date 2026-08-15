# R9 harness — how deep human win/draw/loss data goes (disposable)

**Disposable research instrument**, permitted before an RFC under
`rfc/0000-rfc-process.md` §Exploration gate. It is tied to **R9**
(`design/BACKLOG.md:245`) and its result is
`design/research/human-outcome-coverage-depth.md`. It is not production code and
nothing imports it.

It drives the repo's own runtime explorer query surface — `corpusUrl` and
`normalizedCorpusQuery` from `apps/server/src/corpus.ts`, which normalise the FEN through
the shipped `transposeKey` and canonicalise ratings/speeds through
`normalizeExplorerQuery` (`apps/server/src/sourcing/explorer.ts`) — by relative import. It
supplies its own serial HTTP loop for exactly one reason: **both shipped clients discard
the raw counts below the 100-game abstention floor** (`explorer.ts:91`, `corpus.ts`
`parseCorpusResponse`), and the position of that floor is one of the things R9 measures.

Engine readings are taken with **`tools/r4-difficulty-harness/probe-sf.ts` unmodified**, so
the |eval| classes here are the same readings R4 measured.

**Politeness.** One request at a time (`DELAY_MS`, 2500 ms as run), 60 s wait after any
429/5xx with three further backoffs, per the sourcing client's own etiquette. Ten 429s
across ~1,390 requests, all absorbed by the wait; no anonymous retry, no substituted
population. Requires the operator token in `.env.lichess`.

## Run

```sh
SP=/tmp/r9 && mkdir -p $SP
build() { NODE_PATH="$PWD/apps/server/node_modules" pnpm --filter @chess-tabiya/server exec \
  esbuild "$PWD/tools/r9-explorer-depth-harness/$1.ts" --bundle --platform=node --format=esm \
  --outfile="$SP/$1.mjs"; }
build extract; build probe-explorer; build greedy-walk

node $SP/extract.mjs content/drafts $SP/positions.json

# main sweep: 279 non-endgame positions x 3 bands
DELAY_MS=2500 node $SP/probe-explorer.mjs $SP/positions.json $SP/main.jsonl \
  1400,1600,1800 opening,middlegame,cross_phase 2024-01 2026-07 blitz,rapid,classical 0

# engine classes, R4's probe, depth 12, MultiPV = legal-move count
python3 -c "import json;d=json.load(open('$SP/positions.json'));json.dump({'packs':d['packs'],'positions':[p for p in d['positions'] if p['phase']!='endgame']},open('$SP/nonendgame.json','w'))"
NODE_PATH="$PWD/apps/server/node_modules" pnpm --filter @chess-tabiya/server exec esbuild \
  "$PWD/tools/r4-difficulty-harness/probe-sf.ts" --bundle --platform=node --format=esm --outfile="$SP/probe-sf.mjs"
node $SP/probe-sf.mjs $SP/nonendgame.json $SP/sf-d12.jsonl 12 all 0 120000

# on-ramp bands, puzzle-derived on-ramp roots, and the three population knobs
python3 tools/r9-explorer-depth-harness/pick-sensitivity.py $SP/main.jsonl $SP/positions.json $SP/sensitivity.json 3
DELAY_MS=2500 node $SP/probe-explorer.mjs $SP/positions.json $SP/onramp-bands.jsonl 1000,1200 opening,middlegame 2024-01 2026-07 blitz,rapid,classical 80
DELAY_MS=2500 node $SP/probe-explorer.mjs $SP/sensitivity.json $SP/sens-window.jsonl    1600 opening,middlegame,cross_phase 2013-01 2026-08 blitz,rapid,classical 0
DELAY_MS=2500 node $SP/probe-explorer.mjs $SP/sensitivity.json $SP/sens-speeds.jsonl    1600 opening,middlegame,cross_phase 2024-01 2026-07 ultraBullet,bullet,blitz,rapid,classical,correspondence 0
DELAY_MS=2500 node $SP/probe-explorer.mjs $SP/sensitivity.json $SP/sens-bandwidth.jsonl 1400+1600+1800 opening,middlegame,cross_phase 2024-01 2026-07 blitz,rapid,classical 0
DELAY_MS=2500 node $SP/probe-explorer.mjs $SP/sensitivity.json $SP/sens-ceiling.jsonl   0+1000+1200+1400+1600+1800+2000+2200+2500 opening,middlegame,cross_phase 2013-01 2026-08 ultraBullet,bullet,blitz,rapid,classical,correspondence 0

# THE instrument check: the explorer's own densest path, independent of our corpus
DELAY_MS=2500 node $SP/greedy-walk.mjs $SP/walk-1600.jsonl 1600 1 60 2024-01 2026-07 blitz,rapid,classical
DELAY_MS=2500 node $SP/greedy-walk.mjs $SP/walk-ceiling.jsonl 0+1000+1200+1400+1600+1800+2000+2200+2500 1 60 2013-01 2026-08 ultraBullet,bullet,blitz,rapid,classical,correspondence

python3 tools/r9-explorer-depth-harness/analyze.py $SP/main.jsonl $SP/sf-d12.jsonl $SP/summary.json $SP/positions.json
python3 tools/r9-explorer-depth-harness/to-csv.py $SP/*.jsonl out/explorer-readings.csv
```

## Artifacts in `out/`

- `explorer-readings.csv` — **the evidence**: one row per position × band × population, with
  totals, W/D/L and the per-move counts. Explorer counts drift as games are played, so this
  is the record of what was returned on **2026-08-15**; a re-run will not reproduce it
  byte-for-byte.
- `summary.json` — the full analysis (`analyze.py` output).
- `walk-*.jsonl` — the greedy most-popular walks, per band and at the ceiling population.

The Stockfish JSONL is regenerable and not committed (fixed depth, cleared hash — the same
determinism R4 relies on).
