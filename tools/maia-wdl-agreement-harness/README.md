# Maia WDL vs human outcome harness (disposable)

**Disposable research instrument**, permitted before an RFC under
`rfc/0000-rfc-process.md` §Exploration gate. It is tied to the open research row
in `planning/work-register.md` §5 — *"validating Maia's WDL against R9's ply-≤20
ground truth"* — and its result is
`design/research/maia-wdl-versus-human-outcome.md`. It is **not production code
and nothing imports it.**

It drives the repo's own `EngineSupervisor` (`apps/server/src/engine-supervisor.ts`)
and `maiaDockerSpec` (`apps/server/src/maia.ts`) by relative import and reproduces
the command shape of `OpponentSelector#maia` (`opponent-selector.ts:494-520`)
exactly, including the band defaults read off the handshake. **No second UCI
integration and no second command shape exists here.** Prior harnesses are reused
verbatim rather than re-written: the position extractor
(`tools/r4-difficulty-harness/extract.ts`) supplies move history, the Stockfish
probe (`tools/r4-difficulty-harness/probe-sf.ts`) is run unmodified, and the human
ground truth is R9's **committed** explorer readings
(`tools/r9-explorer-depth-harness/out/explorer-readings.csv`) rather than a fresh
pull, so the two dossiers are commensurable and no second explorer client exists.

Arms:

- **`build-probe-set.py`** — joins R9's committed readings to r4's history by FEN.
- **`san-map.ts`** — SAN → UCI per FEN via chessops (the explorer names moves in
  SAN, Maia in UCI); the join is not a second convention.
- **`probe-maia-wdl.ts`** — MultiPV-20 probes keeping `score cp` and `wdl`, the two
  fields `candidateLines()` reaches but no consumer reads. Three command shapes:
  `history` (production), `bare` (position-keyed, the commensurability control) and
  `eloonly` (the control for the band regression `0985fa4` repaired).
- **`dump-raw.ts`** — the raw `info` lines, so the encoding claim is readable off
  the wire rather than through a parser.
- **`analyze.py`** — pure: given the same JSONL it rewrites the committed summary
  byte for byte.

## Run

```sh
SP=/tmp/maia-wdl && mkdir -p $SP
build() { NODE_PATH="$PWD/apps/server/node_modules" pnpm --filter @chess-tabiya/server exec \
  esbuild "$PWD/tools/$2/$1.ts" --bundle --platform=node --format=esm --outfile="$SP/$1.mjs"; }
build extract         r4-difficulty-harness
build probe-sf        r4-difficulty-harness
build san-map         maia-wdl-agreement-harness
build probe-maia-wdl  maia-wdl-agreement-harness

node $SP/extract.mjs content/drafts $SP/positions.json
python3 tools/maia-wdl-agreement-harness/build-probe-set.py \
  tools/r9-explorer-depth-harness/out/explorer-readings.csv $SP/positions.json $SP/probe-set.json
node $SP/san-map.mjs $SP/probe-set.json $SP/san-map.json

MAIA_IMAGE=chess-tabiya-maia:dev node $SP/probe-maia-wdl.mjs \
  $SP/probe-set.json $SP/armA-history.jsonl 1400,1600,1800 history 0
MAIA_IMAGE=chess-tabiya-maia:dev node $SP/probe-maia-wdl.mjs \
  $SP/probe-set.json $SP/armB-bare.jsonl 1600 bare 0
MAIA_IMAGE=chess-tabiya-maia:dev node $SP/probe-maia-wdl.mjs \
  $SP/probe-set.json $SP/armC-eloonly.jsonl 1400 eloonly 0

# The Stockfish leg reuses R4's probe unmodified; its position file is r4's own
# extract restricted to the FENs R9 actually queried, so the probe is byte-for-byte
# the one R4 and R9 ran.
python3 - "$SP" <<'PY'
import json, sys
sp = sys.argv[1]
want = {p["fen"] for p in json.load(open(f"{sp}/probe-set.json"))["positions"]}
allp = json.load(open(f"{sp}/positions.json"))["positions"]
json.dump({"positions": [p for p in allp if p["fen"] in want]},
          open(f"{sp}/sf-positions.json", "w"))
PY
node $SP/probe-sf.mjs $SP/sf-positions.json $SP/sf-d12.jsonl 12 all 0 180000

python3 tools/maia-wdl-agreement-harness/analyze.py \
  $SP/probe-set.json $SP/san-map.json \
  history=$SP/armA-history.jsonl bare=$SP/armB-bare.jsonl eloonly=$SP/armC-eloonly.jsonl \
  $SP/sf-d12.jsonl tools/maia-wdl-agreement-harness/out/summary.json
```

Run the Maia arms and the Stockfish arm **one at a time**; they contend for
threads on the same host. Neither result is time-dependent (fixed depth on one
side, a single forward pass on the other), so contention changes no number — but
the Stockfish leg's per-probe timings would be unreadable.

## Artifacts in `out/`

`summary.json` plus the captured Maia handshake (`*.identity.json`), which is the
traceable source for every "the instrument advertises …" claim in the dossier.
Per-probe JSONL is regenerable from the committed pack corpus and R9's committed
explorer readings, and is not kept.
