# Does Maia's band move the RESULT? — D333/D324, played out

**Question:** `design/BACKLOG.md` **D333** and **D324** — *"R10 measured that the band
moves the DISTRIBUTION; nothing has measured that it moves the RESULT."* R10
(`design/research/maia-band-calibrated-range.md`) established over 5,080 probes that the
requested band moves the **policy vector** everywhere inside `[0, 5000]`, and states
explicitly that it makes **no claim about play quality at any band** `[V]`. **D332**
proposes a learner Elo as the campaign's progression denominator, and an Elo computed
against Maia bands is arithmetic on sand unless Maia at 1500 actually *loses more often*
than Maia at 1800 over played games. That is this dossier's only question.

**The prior evidence pointed at the gap rather than closing it.**
`design/research/maia-wdl-versus-human-outcome.md` §9.5 found the band dial moving Maia's
per-move WDL **without moving it toward the band** — Pearson 0.021–0.044 against the human
population's own band-to-band movement, sign agreement 47.2–52.0%, against a real human
movement of 1.24–2.21 pp after sampling noise `[V]` — and ledgered it as **D291**. A null
was the expected outcome here and would have been fully publishable.

**Instrument.** `tools/d333-band-outcome-harness/` (disposable, permitted under
`rfc/0000-rfc-process.md` §Exploration gate). It drives the repo's own `EngineSupervisor`
(`apps/server/src/engine-supervisor.ts`) and `maiaDockerSpec` (`apps/server/src/maia.ts`)
by relative import and reproduces `OpponentSelector#maia`'s command shape
(`apps/server/src/opponent-selector.ts:494-520`) command for command, including reading
the `SelfElo`/`OppoElo` handshake defaults **before** sending `Elo` — the shipped order
after `0985fa4`. **No second UCI integration and no second command shape exists here.**
Engine identity as reported by the shipped handshake and captured per run:
`maia-5m` / `Maia3` / `1e13597c42d4858b7cfd7cfdae01e297263364b2` /
`maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe`, `eloHonored: true`,
`seedHonored: false`, `bandRange {min: 1000, max: 2400}` `[V]`
(`tools/d333-band-outcome-harness/out/handshake.identity.json`).

---

## 1. Verdict

*(filled from the run — see §4 onward)*

---

## 2. What was pre-registered, and the minimum n stated before the ladder ran

**Resolution target, taken from the assignment:** a band ladder needs enough games per
pairing that a **5-percentage-point** score difference is distinguishable from noise.

The arithmetic, done once and applied to every arm:

- A game's score is `{0, 0.5, 1}`. At a true mean of 0.5 with draw rate `d`,
  `Var = 0.25(1 − d)` and `SD = 0.5·sqrt(1 − d)`.
- The measured draw rate in the same-band control arm is **24.1%** (328 draws / 1,360
  games) `[V]`, so `SD = 0.5·sqrt(0.759) = 0.4356`.
- Two-sided α = 0.05, power 80%: `n = ((1.960 + 0.842)·0.4356 / 0.05)² = **596 games**`
  for a **within-pairing** test (is this pairing's score different from 0.500?).
- A **between-rung** comparison of two independent arms carries `sqrt(2)` more error, so
  it needs **1,192 games per arm** for the same 5-point resolution.

**So: ≥596 games per pairing to call a pairing's own score, ≥1,192 games per rung to call
a 5-point difference between two rungs.** Both numbers were fixed before the ladder ran
and are reported against below, per arm, together with each arm's realised
minimum-detectable effect at 80% power.

**Deviation from D324's pre-registration, stated up front.** D324 specifies bands
{1000, 1400, 1800, 2200} against a fixed band-1400 reference, N ≥ 200 per arm, *"on R5's
stratified position set"*, pass = monotone score with non-overlapping 95% CIs. The bands,
the reference, the criterion and the sample floor are honoured exactly. The **position
set is not**: this harness draws its openings from the committed pack corpus
(`content/drafts/*.json`) — each pack's start position plus main-line spine prefixes at
depths 2/4/6, deduped by FEN, 170 entries (opening 69 · endgame 51 · middlegame 44 ·
cross-phase 6) `[V]`. That is a deliberate substitution: it measures the band on the
positions the product actually drills. It is still a deviation and the phase split in §7
is the reason it matters.

---

## 3. Band application — the audit that had to pass first

The single most likely way this measurement is silently wrong is **D58/D91**: an
`Elo`-less request inherits the previous request's band, and `SelfElo`/`OppoElo` overwrite
`Elo` when sent after it, so a whole ladder can be one band playing itself while every
record says otherwise. Four independent checks, in increasing strength.

**(a) The alias, read out of the pinned image.** In the shipped container,
`Maia3UCIEngine.cmd_setoption` lowercases the option name and dispatches:
`elo` sets **both** `self_elo` and `oppo_elo`; `selfelo` and `oppoelo` each set one
(`/opt/maia3/maia3/uci.py:383-389`, read from `chess-tabiya-maia:dev`) `[V]`. Those two
fields are the only band inputs to the forward pass (`uci.py:312-316`) `[V]`. So the
harness's order — `SelfElo 1500`, `OppoElo 1500`, then `Elo <band>` — leaves the requested
band in force, and the reverse order would not.

**(b) The command array carries `Elo` on every single request.** `play-games.ts` builds
the band line unconditionally inside the per-move `commands` array; there is no branch on
which a move is played without one. `EngineSupervisor` writes the array in order
(`apps/server/src/engine-supervisor.ts:353`, `:444`) `[V]`.

**(c) The schedule invariant holds in the recorded data.** `play-games.ts` pushes
`(A-white, B-white)` per `(round, bookId)`, so an even `gameIndex` must always be the
A-white game. Over the 1,020 games of the widest arm, **0 of 1,020** records violate
`gameIndex even ⟺ whiteLabel == A` `[V]`, and all **510** pairs are split across two
different shards — i.e. two different containers with two different seeds, **0** same-shard
pairs `[V]`.

**(d) The band demonstrably arrived, proven from the outcome run's own game records.**
`tools/d333-band-outcome-harness/verify-band-applied.py` takes the **first ply** of every
game — the one move both arms play from an identical FEN — and asks whether the two arms'
first-move distributions are one population or two, pooled χ² over book positions with a
Monte-Carlo permutation p-value (2,000 reshuffles, no asymptotic assumption on sparse
tables):

| arm | bands compared | books tested | pooled χ² | permutation p | mean TVD |
|---|---|---|---|---|---|
| `null-1500-1500` | 1500 vs 1500 | 130 | 332.3 | **0.649** | 0.414 |
| `wide-1000-2400` | 1000 vs 2400 | 143 | 494.6 | **< 0.0005** | 0.653 |
| `camp-1000-2000` | 1000 vs 2000 | 145 | 427.7 | **< 0.0005** | 0.577 |
| `ctl-temp-1500` | temperature 0.8 vs 5.0 | 168 | 582.0 | **< 0.0005** | 0.887 |

`[V]` The audit has both controls: it does **not** fire when the two arms are genuinely
identical (p = 0.65, and 0.414 is the sampling-noise floor at ~3–4 first moves per arm per
book), and it fires on a non-band lever too. The band reached the model **in the games
that were counted**, not merely in the commands that were sent.

**(e) Seeding, and a standing repo belief corrected.** The repo's handshake reports
`seedHonored: false` because upstream advertises no UCI seed **option** — but `maia3-uci`
calls `seed_everything(cfg.seed)` at process start with `--seed` defaulting to **42**
(`/opt/maia3/maia3/uci.py:525`, `:68`; `/opt/maia3/maia3/utils.py:12-18`) `[V]`, and the
shipped `ENTRYPOINT` passes none (`workers/maia/Dockerfile`). Two fresh sidecars given the
same request sequence therefore return byte-identical moves, and a paired design run
against two identically-seeded workers degenerates into a tautology. The harness passes a
**distinct `--seed` per worker** as a container argument; all 13 running containers were
verified at `--seed 1000 … 1012`, one each, with `OMP_NUM_THREADS=1` `[V]`.

---

## 4. Results

*(filled from the run)*

---

## 9. Limits of this measurement

*(filled from the run)*

---

## 10. Reproduction

```sh
SP=/tmp/d333 && mkdir -p $SP
build() { NODE_PATH="$PWD/apps/server/node_modules" pnpm --filter @chess-tabiya/server exec \
  esbuild "$PWD/tools/d333-band-outcome-harness/$1.ts" --bundle --platform=node --format=esm \
  --outfile="$SP/$1.mjs"; }
build build-book; build play-games

node $SP/build-book.mjs content/drafts $SP/book.json
MAIA_IMAGE=chess-tabiya-maia:dev bash tools/d333-band-outcome-harness/run.sh
MAIA_IMAGE=chess-tabiya-maia:dev bash tools/d333-band-outcome-harness/run-ladder.sh
python3 tools/d333-band-outcome-harness/analyze.py $SP/games \
  tools/d333-band-outcome-harness/out/summary.json
python3 tools/d333-band-outcome-harness/verify-band-applied.py $SP/games/*.jsonl
```

**Not bit-reproducible, and it cannot be.** Maia advertises no seed option and samples
from a process-global RNG whose stream position depends on the whole request history, so
a re-run reproduces the *statistics*, not the game list. Every game's full move list is
recorded in the per-game JSONL (~200 MB, not committed); `analyze.py` is pure and rewrites
`out/summary.json` byte for byte from it.
