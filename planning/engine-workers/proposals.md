# Engine-workers proposals for owner ruling

## Strong-engine strength profile

> **Proposal for owner ruling — strong_engine:** Ratify a movetime profile, not
> a fixed-depth profile: Stockfish with `Threads=1`, `Hash=16`, `MultiPV=1`, and
> `go movetime 100` for v1. Keep movetime deployment-configurable but record the
> effective value in capabilities/evidence provenance when it becomes part of a
> persisted judgment. This preserves a predictable interaction budget while
> remaining far stronger than the target learner; fixed depth would make latency
> swing by position and hardware. Revisit if blind quality checks find 100 ms too
> weak, or if server-side p95 exceeds 500 ms under expected concurrency.

Owner ruling requested: accept the 100 ms movetime profile, choose a different
movetime, or require fixed depth.

## Maia deployment requirement

> **Proposal for owner ruling — Maia deployment:** Require Docker for the v1
> Maia sidecar and do not support a host-venv fallback. The image is the
> reproducible unit that pins model, source commit, policy-exposure patch, Python
> dependencies, and digest; it also preserves the standing rule that Python is
> confined to worker containers. A second venv path would double the support and
> provenance surface at the least stable boundary. Revisit for a desktop/mobile
> distribution that cannot reasonably ship Docker; prefer the already-tracked
> ONNX/browser path over adding an unpinned host-Python mode.

Owner ruling requested: Docker-required for v1, or explicitly fund a supported
venv fallback as a separate deployment target.
