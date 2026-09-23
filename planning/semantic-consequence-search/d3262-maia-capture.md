# D3262 — Maia root-source capture and probability authority

**2026-09-23 · provider source receipt, not five-arm calibration.** The artifact is
`d3262-maia-capture.json`, SHA-256
`0600008bbe017e05135bd6b5162113e7d8553a0b5597a837888ab3a219e41363`.
Run `make semantic-search-maia-check` to join it to the frozen manifest and independently
checked Stockfish legal-root population. Five negative fixtures refuse a crossed root, illegal
candidate, duplicate rank, invented policy mass and substituted model. The original command was
`make semantic-search-maia-capture` against the local Maia-enabled production server image. Its
temporary probe account was deleted after capture. `[V]`

The request used the predeclared D1023 configuration: `human_common`, Maia band 1400,
temperature 0.8, top-p 0.92, policy digest `sha256:333…333`, and a FEN-derived seed. All 66
roots returned from `maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe` / Maia3 source
commit `1e13597c42d4858b7cfd7cfdae01e297263364b2`; none were source-off. The source
reports `eloHonored: true`, `eloApplied: 1400`, and `seedHonored: false`. The complete **returned**
candidate list holds 1,277 of the 2,013 legal root moves, leaving 736 unreturned moves. The
per-root list spans 10–20 moves. All returned candidates have finite mass. Seven castling moves
use Maia's king-to-rook UCI form (`e1h1`, etc.), which the checker joins to the equivalent legal
king-destination move without rewriting the captured string. Request p50/p95/max was
105.62/148.54/189.21 ms on the local Docker setup. `[V]`

**Probability distinction:** the pinned `/opt/maia3/maia3/uci.py` `score_moves()` calls
`sample_from_logits(logits, self.temperature, self.top_p)` for the selected move, but builds the
reported `policy` values from `torch.softmax(logits, dim=-1)` and emits at most `MultiPV=20`.
The reported values therefore describe the raw legal-move model distribution, **not** the
temperature/top-p-transformed sampling distribution of this configured bot. The listed mass
often approaches one, but the 736 unreturned moves still exist and their aggregate tail is not
a per-move vector. A future Maia-mass frontier may use raw model mass with its correct label,
or derive a bounded configured-sampling frontier; it may not present raw top-20 coverage as
the actual opponent's complete reply probability. This is [[D3276]]. `[V]`

This artifact is root-only; `d3262-maia-child-capture.md` separately records the first
candidate-child layer and `d3262-maia-child-prefix.md` its raw-model cap-eight projection.
Further child-node traversal, engine and semantic beams, transposition accounting,
contrastive proofs, memory and end-to-end hint latency have not run. [[D3262]] remains open,
and no production search profile or bot policy was selected.
