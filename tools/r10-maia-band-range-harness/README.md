# R10 harness — Maia's band-calibrated `Elo` range (disposable)

**Disposable research instrument**, permitted before an RFC under
`rfc/0000-rfc-process.md` §Exploration gate. It is tied to **R10** —
*over what `Elo` range does Maia actually behave as a band-calibrated human
model, and where does it stop* — raised by `design/BACKLOG.md` D60/D70 and ruled
on 2026-08-15 (*"three samples are not a boundary"*). Its result is
`design/research/maia-band-calibrated-range.md`. It is not production code and
nothing imports it.

It drives the repo's own `EngineSupervisor` (`apps/server/src/engine-supervisor.ts`)
and `maiaDockerSpec` (`apps/server/src/maia.ts`) by relative import, and
reproduces the command shape of `OpponentSelector#maia`
(`apps/server/src/opponent-selector.ts:469-499`) exactly — `setoption Elo /
Temperature / TopP / MultiPV`, a history-conditioned `position fen … moves …`,
and a bare `go`. **No second UCI integration and no second Maia command shape
exists here.** The R4 and R5 harnesses are the precedents; the position
extractor (`tools/r4-difficulty-harness/extract.ts`) and the stratifier
(`tools/r5-maia-stability-harness/select.ts`) are reused verbatim rather than
re-written.

Two things are load-bearing and deliberate:

- **`Elo` is sent on every single probe, without exception.** D58 established
  that an `Elo`-less request inherits the previous request's band, so a sweep
  that omitted it would measure the previous grid point.
- **`MultiPV 20` on every probe.** R4 measured the engine's own hard cap at 20;
  R5 measured MultiPV 8 against 20 as bit-identical over the shared moves. 20
  therefore maximises the shared support the distance is computed over without
  changing any value.

Repeats are **not** collected: R5 measured the emitted `policy` scalar as
byte-identical across 20 repeats, two containers, two orders and two MultiPV
widths (105/105 keys, max drift 0.0), so the noise floor is exactly zero and any
non-zero difference between two grid points is signal.

## Run

```sh
SP=/tmp/r10 && mkdir -p $SP
build() { NODE_PATH="$PWD/apps/server/node_modules" pnpm --filter @chess-tabiya/server exec \
  esbuild "$PWD/tools/$2/$1.ts" --bundle --platform=node --format=esm --outfile="$SP/$1.mjs"; }
build extract         r4-difficulty-harness
build select          r5-maia-stability-harness
build probe-sweep     r10-maia-band-range-harness
build probe-malformed r10-maia-band-range-harness

node $SP/extract.mjs content/drafts $SP/positions.json
node $SP/select.mjs  $SP/positions.json $SP/probe-set.json 3   # 3 per phase x colour x piece bucket

# Main sweep — 51 positions x 68 grid points, ascending.
node $SP/probe-sweep.mjs $SP/probe-set.json $SP/sweep.jsonl       sweep     asc  0  sweep-asc
# Order control — the same grid descending on 12 positions; hysteresis check.
node $SP/probe-sweep.mjs $SP/probe-set.json $SP/control-desc.jsonl sweep     desc 12 control-desc
# Edge resolution — 10-Elo steps over the first and last 400 points.
node $SP/probe-sweep.mjs $SP/probe-set.json $SP/fine-low.jsonl    fine-low  asc  8  fine-low
node $SP/probe-sweep.mjs $SP/probe-set.json $SP/fine-high.jsonl   fine-high asc  8  fine-high
# Non-integer and garbage `Elo` values, as ordered pairs.
node $SP/probe-malformed.mjs $SP/probe-set.json $SP/malformed.jsonl 5

python3 tools/r10-maia-band-range-harness/analyze.py \
  tools/r10-maia-band-range-harness/out/band-sweep-summary.json \
  $SP/sweep.jsonl $SP/control-desc.jsonl $SP/fine-low.jsonl $SP/fine-high.jsonl $SP/malformed.jsonl
```

The analyser is pure: given the same JSONL it rewrites the committed summary
byte for byte.

Run the arms **one at a time**. Two Maia containers on the same host contend for
threads badly — measured here at ~0.39 s/probe alone against ~1.6 s/probe with a
second container running.

## Grid

`sweep` is uniform at 100 Elo over the whole advertised `[0, 5000]` (51 points),
plus extra density immediately inside each endpoint (25/50/75 and
4925/4950/4975), plus eleven points **outside** the advertised range
(-1000000, -5000, -1000, -100, -1, 5001, 5100, 5500, 9000, 50000, 1000000).

## Metric

Total-variation distance over the union of the two candidate lists, an unlisted
move scored 0. Reported twice — `tvRaw` on the policy scalars as emitted, and
`tvRenorm` after each list is divided by its own listed sum, which is the object
the shipped consumer computes on (`opponent-selector.ts:641-643` divides
`concedingMass` by `measuredMass`). The gap between them is the truncation
effect and is reported rather than hidden; `listedMass` per band is in
`perBand`.

## Artifacts in `out/`

Summary JSON only. The per-probe JSONL is regenerable from the committed pack
corpus and is not kept.
