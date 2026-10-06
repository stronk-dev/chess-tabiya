# D3262 configured Maia: actual ordered-history source boundary

Disposable RFC-0000 research, not production search or opponent implementation.
The search RFC stays draft and D3262 stays doing. Routine hashes/trackers are
maintained automatically; no new owner decision is needed for this maintenance.

## Actual source, not a top-window approximation

The installed local image is
`sha256:9e096c8a9511225778fb1485b0c1792e4ea76b9a32e3c30ea81a0dee29f147bc`.
The worker runs without network, with a read-only repository, one CPU/thread and
the packaged CPU Maia3-5m checkpoint. Startup verifies the frozen checkpoint and
UCI source hashes before queries. Composite source identity includes the actual
image, worker/runtime digests, Python/Torch identities and the literal configured
1400/1400, temperature 0.8 and top-p 0.92 policy. Pre-root history is unavailable,
not invented. `[V]` `cost-maia-worker.py`, `cost-maia.mjs` and the source-control JSON.

Every query retains root FEN plus the entire ordered canonical UCI history. The
literal response retains actual history tokens, complete legal mask identities,
float32 logits, full raw legal softmax, sampler order/cumulative masses/top-p
mask and normalized configured support. This is configured **model policy**, not
measured human frequency, tactical proof or an engine's reason for a move. The
sampler excludes its overshooting top-p move (except its mandatory first move);
the separately frozen exploration prefix includes its overshooting move. These
are distinct operations; this checkpoint implements only the former source.
`[V]` `cost-maia-worker.py`, `cost-maia.mjs`, frozen
`coherent-maia-fourth-ply.mjs` and `d3262-maia-history-replay.json`.

Cold source receipts become exact operand-keyed warm dependencies, never cached
final answers. A different ordered history to the same FEN has a distinct key.
Offline attempts retain typed unavailable without querying the process. Whole
startup/query deadlines, bounded response/stderr, malformed/unsolicited output,
early exit and cleanup are explicit. Invalid complete responses retain literal
bytes instead of becoming successful empty evidence. `[V]` `cost-maia.mjs`,
`cost-stockfish.mjs` and `cost-maia.test.mjs`.

## Preserved live controls and independent replay

`d3262-cost-maia-source-control-2026-10-06.json` preserves three actual source
receipts / 77 legal moves: the frozen root-plus-candidate control and two declared
four-move histories reaching the same FEN with distinct actual model tokens. Its
SHA-256 is `ba168481b934cdba1221f254e43e1ae58567f3013a88a63af2ae04f65dc0c8bf`.
The frozen control's raw/configured identities and masses reproduce within 1e-6;
the captured literal bytes are not rewritten. `[V]` `cost-maia-probe.mjs` and the JSON.

Separate python-chess replay reconstructs complete legal populations, original
history and mask identities. The pinned tokenizer reconstructs exact tokens;
independent Torch float32 arithmetic reconstructs the full softmax and actual
ordered sampler mask/normalized support from retained logits, without rerunning
model inference. Nine resealed history/frame/token/logit/mass/mask/support/index/
population corruptions fail. JS additionally checks actual receipt digests and
exact cold/warm/offline joins. This verifies literal evidence and clock-interval
consistency, not an independently witnessed wall clock or browser rendering.
`[V]` `cost-maia-check.py`, `cost-maia-probe.mjs`, actual successful Make replay.

The ordinary execution target passes 122 cases: 85 prior execution/semantic
controls plus 37 Maia literal/protocol/cache/live-artifact controls. Thirty-six
frozen plan controls and eleven original PV package controls also pass; the old
package digest remains unchanged. `[V]` normal Make targets below.

```sh
make semantic-search-cost-test semantic-search-cost-contract
make semantic-search-cost-maia-independent OUT=planning/semantic-consequence-search/d3262-cost-maia-source-control-2026-10-06.json
make semantic-search-cost-packed-check ARCHIVE=planning/semantic-consequence-search/d3262-cost-live-pv-initial-2026-10-06.json.gz
```

## Still open — do not promote this to a traversal

The complete batch runner still supports 51/53 settings, and its two configured
Maia settings still refuse. Next wire the actual source into the frozen
eight-move/0.80-or-0.90 exploration prefix across all three decision layers,
retain conditional products/joint residuals/terminal absorption and legal
denominators, add independent complete-frontier replay and then capture both
full 1,158-case populations. A source control is not any of these case identities:
captured cost population remains 3,474 / 61,374. Source/model memory, remaining
settings, fresh-outcome sensitivity, browser identity/visible-output proof and
production-profile choice remain open. No RFC/capability/milestone/full-1.0
completion or optional-voice/owner-use discharge follows. `[V]` unchanged frozen
cost plan, `cost-execution.mjs`, `cost-batch.mjs` and D3262 tracker.

## Full checkpoint verification

The ordinary exact-index `make staged-software-contracts` terminates zero on
tree `048d229594d033e0f6c5e48b3fd2dd0b09ffb4b9`: 3,398 software tests / 344 files,
seven isolated performance tests / four files, clean types and full downstream
build/packaging/source/value/capability/history/migration checks. Its original
generated proof is preserved without overwrite as
`d3262-cost-maia-software-2026-10-06.json`. All final source and Make bytes match
that indexed image; later differences are tracking/evidence only. No production
UI/API behavior changed, so there is no new browser or GitHub run claim. `[V]`
terminal Make output, retained proof and source-index comparison.

`make verify-content` passes 227 cases / 23 files, with zero clearance-corpus
errors and all 104 exact capability documents. Staged process/full governance
also pass; all 1,689 live rows remain routed and none untriaged. `[V]` terminal
Make output and the append-only exploration log's same-date source checkpoint.
