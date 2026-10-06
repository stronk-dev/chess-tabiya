# D3262 / D3478–D3480 — final-ply source capture checkpoint

The engine in-flight state below is historical, superseded by the complete-source
receipt `d3262-engine-final-ply-capture-2026-10-06.md`. The Maia capture and repair
measurements below are unchanged; source completion is not five-arm completion.

Measured 2026-10-06. Disposable research, not production search authorization.
This consumes the unchanged 66-root/193-candidate coherent profile and its frozen
third-ply request frame. It does not discharge the five-arm proof/cost comparison,
choose a production search budget, or explain an engine's root preference.

## Complete Maia capture and independent execution

`make semantic-search-maia-final-ply-capture` executed all **1,401 ordered
root-plus-three-move histories**, not 1,384 deduplicated FENs. The retained source
is `d3262-maia-third-ply-capture.json`, SHA-256
`64652308c2196cd14b59414fa016506e84aa557fd3419e042437505a52b8c508`.
It records 47,052 legal moves and 5,275 configured support entries. One position
is terminal by insufficient material even though it has seven legal moves;
its empty policy is a verified game outcome, not a no-legal-move inference.

The source remains Maia3-5M at band/self/opponent 1400, CPU, temperature 0.8,
top-p 0.92, with UCI history enabled and pre-root history unavailable. Checkpoint
SHA-256 is `ba14208b2992d85502f5fb501934abf6aaaeb355e9f3fdf90e326911f562524f`;
adapter SHA-256 is `0f2905bb668f0cb8af6b175e698756d89472b200c36e3f3410ff98390e35474d`.
The exact request-frame SHA-256 remains
`3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07`.
The Node source join checks every literal request history, source identity,
learner move, complete legal distribution, configured support and terminal.

`make semantic-search-maia-final-ply-independent` independently replayed all
1,401 paths with python-chess and **re-inferred all 1,400 nonterminal policies**
from the actual pinned model in a read-only repository mount. It computes legal
masking, raw softmax, temperature and top-p independently of the capture's helper,
checks exact configured support, and admits at most 1e-6 mass differences. Actual
maximum raw and configured differences were both **0.0**; one terminal was checked.
These are model predictions, not observed human frequencies or search proofs.

Sixteen same-FEN groups contain 33 histories. Comparing each group's later rows
with its first gives 17 comparisons; 14 configured distributions differ by more
than 1e-6, with maximum total variation 0.6193238273262978. This fixed diagnostic
supports retaining ordered histories; it is not a player-style quality estimate.

## Engine queue is in progress, not complete

`make semantic-search-stockfish-final-ply-batch` executes the frozen **16,813
full-FEN jobs** through 673 gap-free immutable intervals, normally 25 positions
each. Each job executes only its declared depth8/depth12/movetime100 budgets at
coherent top-eight MultiPV width. Clear Hash, one thread and 16 MiB hash remain
the declared source conditions. The installed Stockfish 19 executable digest
matches the frozen request: `dc2f18c34ae962dff591b66147d220ec06e61d756b93d8a4f5e04fd8e55c251f`.

The initial `MAX_NEW=1` run completed 25 positions and 412 coherent ranked entries;
the first interval digest is
`bc065e71bfdd05dbb1b65947a508dd7a0f0984403e2dfe8581bdedacb20842d4`.
The full queue was then started and reused that interval **only after validation**.
All subsequent existing intervals are checked before reuse as well. A subset may
be valid interval evidence, never full-population evidence. D3478 stays doing until
all intervals, merged source and complete source join pass. No full capture digest,
five-arm result, cold/warm/offline cost or interactive latency is claimed here.

After capture, `make semantic-search-stockfish-final-ply-merge` validates the exact
ordered interval population and writes a portable compact JSON gzip artifact.
Compression changes storage only: literal source rows, per-job budgets, coherent
PV tables, timings and interval digests remain. Its checker accepts compressed
input and verifies the decompressed source. Local chunk files are ignored resumable
outputs, not replacements for the eventual committed portable evidence artifact.

## Two repaired source defects

D3479: the reusable Maia path checker previously admitted arbitrary nonempty
terminal reasons with empty policy on a nonterminal board. The new negative
control failed on the predecessor (`CHECKMATE` was accepted). The repair checks
mate/stalemate, insufficient material and the automatic 75-move boundary against
the actual board, preserving mate precedence. Unavailable pre-root history cannot
license a fivefold-repetition claim. Existing historical sources still pass.

D3480: the first real final-ply model command failed before querying because its
resolver sought the unavailable huggingface-hub dependency despite baked weights.
Four research entrypoints now share the packaged worker's **explicit checkpoint
path**, retaining CPU, UCI history and local-files-only. No downloader was installed,
no model substituted and no Docker/production worker behavior changed. Actual
capture, source checks and independent complete model re-inference pass.

## Verification and remaining foundation

- `make semantic-search-final-ply-source-test`: 16 tests pass. Controls include
  literal budgets, illegal/mixed-depth PVs, source/binary/frame/history swaps,
  timing/terminal/mass corruption, interval extent, incomplete/misordered merge,
  a clearly synthetic complete merge and the actual complete Maia source.
- `make semantic-search-coherent-third-ply-check`: complete retained prerequisites
  and the unchanged third-ply replay pass. No historical artifact is re-stamped.
- Actual first engine interval and actual complete model capture pass their source
  joins; independent model re-inference passes as described above.

D3479/D3480 close this bounded repair. D3478 remains doing; D3262, RFC criterion 23
and Discharge D1 remain open. Still required: complete engine capture/source join,
deeper semantic-target-preserving selection, common same-target outcomes and
counterfactual/refutation/proof/abstention comparisons, phase/focus strata and
end-to-end cold/warm/offline cost. No source migration, richer production hint,
bot-quality verdict, official content graduation or 1.0 milestone is promoted.
This research-only wave changes no application/client/runtime/worker/pack source.
Normal staged process/governance checks and commit hooks cover its closeout; the
previous complete application/content/browser proof is not claimed as a fresh
GitHub result for this research checkpoint.

Final closeout: `make staged-process-contracts verify-governance` exits zero, and
the exact-index process gate is repeated after the independent checker's final
population/configuration guards. The complete independent Maia command is also
repeated on those final bytes: 1,401 paths, 1,400 recomputed policies, one terminal
and both maximum deltas 0.0. Routine receipt/anchor updates are automatic. Only
the owned research/artifact/tracker paths are staged; normal commit hooks remain
enabled. Engine capture continues separately with D3478 doing, not complete.
