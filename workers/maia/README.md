# Maia opponent sidecar

This is the production UCI packaging for the Maia-3 opponent. Python remains
inside this container; the TypeScript server owns orchestration and selection.

The image pins:

- Python 3.12.13 on Debian bookworm slim;
- Maia-3 source commit `1e13597c42d4858b7cfd7cfdae01e297263364b2`;
- `python-chess` 1.999;
- the Maia3 5M checkpoint snapshot
  `b6559de2398d7140b985f28fd2c19fb5e47ddabe`.

The checkpoint is downloaded during the build, verified at that exact snapshot,
and runtime Hugging Face access is disabled. The entry point always includes
`--use-uci-history`; callers must still send `position fen <start> moves <full
history>` for every selection.

The image applies `patches/maia3-uci-policy-mass.patch` with `git apply --check`
against the pinned source before installation. The patch adds no chess logic: it
only emits Maia's already-computed move-policy scalar as `policy <mass>` on each
MultiPV `info` line. This keeps policy mass distinct from the model's WDL output.

Build and inspect:

```sh
docker build -t chess-tabiya-maia:1e13597 workers/maia
docker run --rm -i chess-tabiya-maia:1e13597
```

The supervisor launches the second command form and speaks UCI over stdio. Supply
the locally inspected image digest to `maiaDockerSpec` so run capabilities can
record the exact container identity.

First contact against the pinned source advertises `Elo`, `SelfElo`, `OppoElo`,
`Temperature`, `TopP`, and `MultiPV`. It advertises no seed option, therefore
`seedHonored` is `false`; replay and the selection cache provide repeatability.
