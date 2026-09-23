# D3262 — Maia root-source capture parameters

**Frozen 2026-09-23 before D3262 Maia requests.** Use exactly the 66-root digest in
`d3262-preregistration.md`, with the already measured D1023 policy request configuration:
`human_common`, Maia band 1400, temperature 0.8, top-p 0.92, policy-config digest
`sha256:3333333333333333333333333333333333333333333333333333333333333333`, and the
deterministic D1023 seed `sha256(fen|band)`'s first 32 bits masked to 31. Request each exact
root once through the production `/select-move` API. Retain **all** returned candidate UCI,
rank, mass and off-window flags, returned/missing mass, model identity, request latency and
source-off cases. Do not reduce to a top-eight total as D1023 did. `[V]` source contract:
`tools/d1023-bounded-policy-harness/maia-probe.mts`.

This is a **root distribution** capture, not the four-ply Maia frontier or a bot calibration.
Child-node requests and covered/residual path mass belong to the five-arm traversal experiment.
No result or profile choice exists at freeze time. The disposable implementation is
`tools/d3262-search-calibration/maia-capture.mjs`; use `make semantic-search-maia-capture` only
against the local Maia-enabled server. It creates and deletes a temporary probe account.
