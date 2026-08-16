# D366 harness — is Maia's endgame play human-shaped or arbitrary? (disposable)

**Disposable research instrument**, permitted before an RFC under
`rfc/0000-rfc-process.md` §Exploration gate. It is tied to **D366** in
`design/BACKLOG.md` and its result is
`design/research/maia-endgame-fidelity.md`. It is not production code and
nothing imports it.

It drives the repo's own `EngineSupervisor` (`apps/server/src/engine-supervisor.ts`),
`maiaDockerSpec` (`apps/server/src/maia.ts`) and `LichessTablebaseSource`
(`apps/server/src/tablebase.ts`) by relative import. No second UCI integration and
no second tablebase client exists here — `probe-maia.ts` reproduces
`OpponentSelector #maia` (`apps/server/src/opponent-selector.ts:496-531`) command
for command, including the D91 ordering in which the advertised `SelfElo` /
`OppoElo` defaults are sent **before** `Elo`.

## What it measures, and why in this shape

The question is **not** "is Maia strong in the endgame". It is *"when Maia is
wrong, is it wrong the way a human at that band is wrong, or wrong
arbitrarily?"* — because an opponent that fails plausibly is the product and one
that fails uniformly is noise wearing a human's name.

At ≤7 pieces the Syzygy tablebase gives the exact result class of **every** legal
move, so the **uniform-random legal move** null hypothesis is not sampled — it is
computed exactly, per position, from the same probe that supplies the ground
truth. Every "human-shaped" statistic below is reported against its own matched
random baseline.

Three constraints are designed in rather than assumed away:

* **Maia's `bestmove` is a sample from an unseeded process-global RNG**
  (`design/research/maia-policy-scalar-stability.md`: repeat-stable on only
  34.3% of keys). Nothing is a single probe; every cell is 3 bands × N repeats
  and every rate is reported as a distribution with a **cluster bootstrap over
  positions**, never a binomial interval over correlated probes.
* **D58/D91 — a band you ask for is not necessarily the band applied.** Every
  probe records the exact command array it sent, and the analysis verifies per
  probe that `Elo <band>` was sent after `SelfElo`/`OppoElo`, that the policy
  vector is byte-stable across repeats within a band, and that it is **distinct
  across bands for the same position**. A band comparison in which the policy
  vectors collide is one band compared with itself, and the harness reports the
  collisions rather than trusting the request.
* **`LichessTablebaseSource` is single-flight with a four-deep queue and caches
  failures for 60 s.** `build-set.ts` probes strictly sequentially, backs off
  past the failure-cache lifetime, and rehydrates already-recorded positions on
  resume so a restart does not re-hit the network.

## Run

```sh
SP=/tmp/d366 && mkdir -p $SP
build() { NODE_PATH="$PWD/apps/server/node_modules" pnpm --filter @chess-tabiya/server exec \
  esbuild "$PWD/tools/d366-endgame-fidelity-harness/$1.ts" --bundle --platform=node \
  --format=esm --outfile="$SP/$1.mjs"; }
build build-set
build probe-maia

# 1. Ground truth. Every position on the spine/deviation set of the 14 `phase: "endgame"`
#    packs that is inside the 7-man range, plus positions REACHED DURING PLAY from them
#    by a seeded walk in which both sides play a uniformly random result-preserving move.
node $SP/build-set.mjs content/drafts $SP/positions.jsonl 2 5 700

# 2. Corpus-level, Maia-free: the criticality census and what perfect_tablebase picks.
python3 tools/d366-endgame-fidelity-harness/census.py $SP/positions.jsonl $SP/census.json

# 3. The probe set: 45 critical positions (arm A, preservation) + 15 lost positions on
#    Maia's own side of the pack (arm B, resistance), round-robined across packs and
#    ordered within a pack by sha256(fen) so nothing is chosen for what Maia does in it.
python3 tools/d366-endgame-fidelity-harness/select.py $SP/positions.jsonl $SP/probe-set.json 45 15

# 4. Maia, through the shipped #maia command shape.
node $SP/probe-maia.mjs $SP/probe-set.json $SP/maia.jsonl 1100,1500,1900 14

python3 tools/d366-endgame-fidelity-harness/analyze.py            $SP/probe-set.json $SP/maia.jsonl $SP/analysis.json
python3 tools/d366-endgame-fidelity-harness/analyze-resistance.py $SP/probe-set.json $SP/maia.jsonl $SP/resistance.json
```

`probe-maia.ts` writes repeat-major (round-robin over positions and bands within
a repeat), so the run may be stopped at any point and the analysis still sees a
**balanced** dataset: `analyze.py` scores only complete repeat rounds.

## Artifacts in `out/`

Summary JSON only — `census.json`, `analysis.json`, `resistance.json`. The
per-probe JSONL and the 507-position corpus are regenerable (the walk is seeded
and deterministic) and are not kept.

`probe-set.json` **is** kept, at 120 KB: it is the 60 probed positions with the
tablebase's exact class and DTZ for every legal move, which is what makes every
FEN-level claim in the dossier checkable without a 40-minute network run.

Run of record: **1,095 probes, 0 errors, 6 complete repeat rounds**, at
`Temperature 0.7 / TopP 0.9` (the value all 12 `human_common` endgame packs
declare), against `chess-tabiya-maia:dev` (Maia-3 source `1e13597`, 5M
checkpoint).
