# R4 harness — practical difficulty outside the tablebase (disposable)

**Disposable research instrument**, permitted before an RFC under
`rfc/0000-rfc-process.md` §Exploration gate. It is tied to **R4** in
`planning/campaign-research-queue.md` and its result is
`design/research/practical-difficulty-outside-tablebase.md`. It is not production
code and nothing imports it.

It drives the repo's own `EngineSupervisor` (`apps/server/src/engine-supervisor.ts`),
`LichessTablebaseSource` (`apps/server/src/tablebase.ts`) and `maiaDockerSpec`
(`apps/server/src/maia.ts`) by relative import. No second UCI integration exists here.

## Run

```sh
SP=/tmp/r4 && mkdir -p $SP
build() { NODE_PATH="$PWD/apps/server/node_modules" pnpm --filter @chess-tabiya/server exec \
  esbuild "$PWD/tools/r4-difficulty-harness/$1.ts" --bundle --platform=node --format=esm \
  --outfile="$SP/$1.mjs"; }
build extract; build probe-sf; build probe-tb; build probe-maia

node $SP/extract.mjs content/drafts $SP/positions.json
node $SP/probe-tb.mjs $SP/positions.json $SP/tb.jsonl 250          # exact reference, ≤7 pieces
node $SP/probe-sf.mjs $SP/positions.json $SP/sf-in.jsonl  1,2,4,6,8,12,16 in  0 120000
node $SP/probe-sf.mjs $SP/positions.json $SP/sf-out.jsonl 1,2,4,6,8,12    out 0 120000
NO_RESET=1 node $SP/probe-sf.mjs $SP/positions.json $SP/sf-in-noreset.jsonl 12 in 0 120000
node $SP/probe-maia.mjs $SP/positions.json $SP/maia.jsonl 1100,1500,1900 10 1

python3 tools/r4-difficulty-harness/analyze.py    $SP/tb.jsonl $SP/sf-in.jsonl $SP/agreement.json
python3 tools/r4-difficulty-harness/degeneracy.py $SP/sf-out.jsonl $SP/degeneracy-out.json
python3 tools/r4-difficulty-harness/degeneracy.py $SP/sf-in.jsonl  $SP/degeneracy-in.json
```

`probe-sf.ts` sends `ucinewgame` + `setoption name Clear Hash` + `isready` before every
search, as `rfc/resistance-spectrum.md` §7b requires. `NO_RESET=1` omits both, reproducing
the shipped `strong_engine` path (defect D35) as a control.

## Artifacts in `out/`

Summary JSON only; the raw per-position JSONL is regenerable from the committed corpus
(`tb.jsonl` excepted — it is the network reference and is kept verbatim).
