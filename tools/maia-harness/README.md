# E4 Maia coherence harness

**Disposable research instrument** (AGENTS.md: evidence instruments, not
implementation). Ledger question: **Q5 / gate E4 / hypothesis H5 / kill K5.**
Protocol + decision rules: `design/research/e4-maia-coherence-protocol.md`.

## Run (on the homeserver)

```sh
cd tools/maia-harness
docker build -t e4-harness .
docker run --rm -v "$PWD/out:/harness/out" e4-harness            # conditions m1-m3, c1, c2
python3 analyze.py out                                            # proxy metrics
```

Then the blinded review: shuffle PGNs from `out/*/`, strip condition names,
rate 6 per condition per the protocol's rubric, and land results as a dossier.

## Knobs (env)

`HARNESS_PLIES` (24) · `HARNESS_GAMES` (5/root) · `HARNESS_EVAL_MS` (150) ·
`HARNESS_CONDITION` (run one condition) · `MAIA_CMD` / `SF_CMD` (engine
commands — **verify maia3's actual UCI entrypoint on first run**; the pip
package name and CLI are `[P]`-level knowledge, pin + correct at run time and
record in `out/run-meta.json`).

## Honesty notes

- Position roots are standard-tabiya approximations, legality-validated at
  load; refine against reviewed sources before the formal preregistered run.
- Maia option names (`Elo`/`Temperature`/`TopP`) are best-effort guesses at the
  UCI surface; `runner.py` prints and skips unknown options rather than failing
  — check the skip log on first run and fix names.
- Self-play is a proxy for drill resistance (policy plays both sides); the
  engine-workers RFC's later benchmark should add human-vs-policy spot checks.
