# D333 — does Maia's band move the RESULT? (disposable)

**Disposable research instrument**, permitted before an RFC under
`rfc/0000-rfc-process.md` §Exploration gate. It is tied to the ledger rows
**D333** and **D324** in `design/BACKLOG.md` and to `planning/work-register.md`
§5, and its result is `design/research/maia-band-outcome-transfer.md`. It is
**not production code and nothing imports it.**

R10 (`design/research/maia-band-calibrated-range.md`) established that the band
moves the **policy vector**. Nobody had established that a band difference moves
a **win rate**. This plays whole games, band against band, and counts results —
the one thing R10 did not do.

## What it reuses rather than rebuilds

- The repo's own `EngineSupervisor` (`apps/server/src/engine-supervisor.ts`) and
  `maiaDockerSpec` (`apps/server/src/maia.ts`), by relative import.
- `OpponentSelector#maia`'s command shape (`opponent-selector.ts:494-520`)
  reproduced exactly, including reading the `SelfElo`/`OppoElo` defaults off the
  handshake before sending `Elo` — the shipped order after `0985fa4`. **No second
  UCI integration and no second command shape exists here.**
- The opening book is the **committed pack corpus** (`content/drafts/*.json`),
  not a new corpus: each pack's start position plus its main-line spine prefixes
  at depths 2/4/6, deduped by FEN. `chessops` supplies legality and termination,
  as it does in production.

## Design choices, all deliberate

- **Paired openings.** Every `(round, bookId)` contributes exactly two games —
  the same opening with the two band assignments swapped. Colour is balanced by
  construction and each opening's own bias cancels inside the pair. The paired
  mean is the primary estimator; the unpaired per-game mean is reported beside it.
- **One container per worker, both bands.** Sound because `cmd_position` rebuilds
  the history deque from scratch on every request (`maia3/uci.py:437-451`) and
  every option is re-sent on every request. The only state crossing requests is
  the sampler's RNG — the variation being measured, not a confound in the
  conditioning.
  (R5/D58: an `Elo`-less request inherits the previous band, so `Elo` is sent on
  every single request without exception.)
- **`MultiPV 1`.** `sample_from_logits` runs before `topk` and never reads
  `self.multipv` (`uci.py:322-330`), so MultiPV cannot change the move played —
  it only removes the second value-head forward pass.
- **Thread pinning (`MAIA_THREADS=1`).** Measured before adopting: 21 moves in
  2.36 s at 1 thread vs 2.14 s at 14, and the policy vector is **bit-identical**
  at 1 and 2 threads, differing from the 14-thread reduction only in the ~7th
  significant figure. Without the pin one worker saturates every core and twelve
  workers buy nothing (measured: 60 games in 440 s unpinned, 120 games in 54 s
  pinned). Every arm runs at the same pin.
- **Termination is natural or nothing.** Checkmate, stalemate, insufficient
  material, fifty-move, threefold — then a 300-ply cap scored as a draw and
  counted separately. **No engine adjudication of any kind**: adjudicating with
  Stockfish would make the result partly a Stockfish measurement.
- **Reproducible given the seeds.** Maia advertises no UCI seed option, but
  `maia3-uci` takes a `--seed` (default 42) and seeds `random`, NumPy and torch at
  process start (`maia3/uci.py:525`, `:68`; `utils.py:12-18`), so a fresh sidecar's
  move stream is a deterministic function of its request sequence. **Each worker is
  therefore given its own `--seed` (1000 + index) and the worker count is ODD**, so
  worker never lines up with colour. Without this, two workers on mirrored schedules
  replay the same games and the same-band control degenerates to a tautology — which
  is exactly what the first run of this harness did (611/611 mirrored pairs
  byte-identical, 50.8% duplicate games, control SE exactly 0.0). Every game's full
  move list is recorded regardless.

## Run

```sh
SP=/tmp/d333 && mkdir -p $SP
build() { NODE_PATH="$PWD/apps/server/node_modules" pnpm --filter @chess-tabiya/server exec \
  esbuild "$PWD/tools/d333-band-outcome-harness/$1.ts" --bundle --platform=node --format=esm \
  --outfile="$SP/$1.mjs"; }
build build-book
build play-games

node $SP/build-book.mjs content/drafts $SP/book.json

MAIA_IMAGE=chess-tabiya-maia:dev bash tools/d333-band-outcome-harness/run.sh
MAIA_IMAGE=chess-tabiya-maia:dev bash tools/d333-band-outcome-harness/run-ladder.sh

python3 tools/d333-band-outcome-harness/analyze.py \
  $SP/games tools/d333-band-outcome-harness/out/summary.json
```

`run.sh` is the pairwise plan (controls, the widest usable gap, the campaign
endpoints, a 300-step, two 100-steps, and an asymmetric-conditioning sensitivity
arm). `run-ladder.sh` is **the ledger's own pre-registered D324 design** — bands
{1000, 1400, 1800, 2200} against a fixed band-1400 reference, pass = monotone
score with non-overlapping 95% CIs.

## Band-application audit

`verify-band-applied.py` is the check that had to pass before any arm could be read: it
takes the **first ply** of every recorded game — the one move both arms play from an
identical FEN — and tests whether the two arms' first-move distributions are one population
or two (pooled χ² over book positions, Monte-Carlo permutation p, 2,000 reshuffles). The
two same-band arms are its negative controls and must not fire. Run it as

```sh
python3 tools/d333-band-outcome-harness/verify-band-applied.py $SP/games/*.jsonl
```

## Material cut and the full-material ladder

`derived.py` re-runs the paired, opening-clustered estimator over the same games split by
**piece count** rather than by the pack's declared phase — the cut that separates *"the
band is weak here"* from *"the position is deciding the game"* — and re-runs D324's own
four-rung ladder restricted to full-material positions, which is the honest best case for
the transfer ratio. It also records the realised between-rung resolution against the
pre-registered 5-point target. Run it as

```sh
python3 tools/d333-band-outcome-harness/derived.py $SP/games \
  tools/d333-band-outcome-harness/out/derived.json
```

## Artifacts in `out/`

`summary.json`, `band-application-audit.json`, `derived.json`, plus the captured Maia
handshake (`maia.identity.json`), which is the traceable source for every "the instrument
advertises …" claim in the dossier.
Per-game JSONL is ~200 MB and is not committed; `summary.json` is what
`analyze.py` rewrites byte for byte from it.
