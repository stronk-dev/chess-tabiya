# D3262 actual configured-policy traversal and live cost

Disposable RFC-0000 research, not production search. D3262 remains doing and the
search RFC remains draft. Routine hashes and tracking are maintained automatically.

## Executable boundary

The runner now supports all 53 frozen settings, including both configured Maia
prefixes. Each policy query carries the original root FEN and entire ordered
history; targets share queries but retain separate identity-bound observations.
The frozen eight-move exploration cap includes its overshooting move. This is
not the separate top-p sampler, a joint-threshold selector or human frequency.
Selection reads no target outcome or held-out profitable witness. `[V]`
`tools/d3262-search-calibration/cost-model.mjs`, `cost-execution.mjs`,
`coherent-horizon-policy.mjs` and the preceding actual source-control receipt.

Every node retains the selected prefix, conditional mass, omitted support and
legal moves outside configured support. Every visited edge retains its product
mass and terminal status. Earlier terminal mass carries into later layers
without a model query. Missing/invalid/timed-out sources and node exhaustion
retain partial witnesses and **unknown** complete coverage, not known zero.
Two-ply cases stop before the deeper layers. Warm cases recompile using exact
cold source receipts, never cached final answers. `[V]` `cost-model.mjs`,
`cost-model.test.mjs`, `cost-stockfish.mjs` and the captured cold/warm/offline rows.

The actual offline, read-only, single-CPU/thread Maia3-5m source retains its pinned
checkpoint/UCI/runtime/image identity, full legal logits, history tokens and
float32 configured sampler. Configuration remains 1400/1400, temperature 0.8,
top-p 0.92; unavailable pre-root history is not invented. `[V]`
`d3262-cost-maia-source-control-2026-10-06.md`, each package's original metadata
and executable source snapshots.

## Complete populations, still partial calibration

Both settings retain all 193 candidates / 66 roots, horizons two and four, and
cold/warm/provider-offline cases: 1,158 rows each, as disjoint six + 1,152 batches.
Each contains 716 available, 358 source-unavailable and 84 no-target rows. The 14
no-target candidates are retained but do not invent a policy query; coverage
statistics therefore name the 179 target-bearing candidates, not 193 simulated
policies. No live invalid-source, exhausted-budget or absorbing-candidate case
occurred here; those remain permanent synthetic/protocol controls. `[V]` four
immutable packages and `d3262-cost-live-maia-summary-2026-10-07.json`.

Added cost identities: 2,316. With the three earlier complete setting populations,
the capture total is **5,790 / 61,374**, five of 53 settings. The other 48 settings
remain unmeasured; supporting their execution is not measuring them. Original
preregistration, source snapshots, earlier captures and PV synthesis remain
unchanged. `[V]` frozen plan, explicit package ranges and prior live-cost dossiers.

Independent python-chess replay reconstructs the **entire** history-keyed policy
frontier, legal identities, target observations and quantifiers. Independent
tokenizer/Torch arithmetic verifies literal legal logits and sampler support
without rerunning inference. The 0.80 batches retain 26 + 6,658 observations;
0.90 retains 44 + 11,538: 18,266 including distinct cold/warm executions. Thirteen
resealed corruptions per batch fail, including omitted multi-layer nodes,
false products/coverage, missing observations and changed source histories.
Clock checks are interval consistency, not independent wall-clock or paint proof.
`[V]` successful `make semantic-search-cost-independent` outputs and
`tools/d3262-search-calibration/cost-independent.py`.

An initial full replay failed on a one-ULP sum difference: Python's compensated
`sum()` and the declared JavaScript ordered left fold differ. Independent replay
now explicitly performs the declared ordered addition over its independently
reconstructed edges. Neither capture bytes nor thresholds were changed, and
coverage remains exactly compared. `[V]` checker and retained replay diagnostics.

## Measured consequence for the interactive budget

Candidate-population four-ply costs, separately by phase and setting; not repeated
machine trials. All these rows have unknown focus. Startup remains separately
visible in each archive, and cold means empty application dependency cache.
Milliseconds below are rounded display values only. `[V]` immutable summary.

| Prefix | Phase | Candidates | Cold p95 ms | Warm p95 ms | Joint rule satisfied |
|---|---|---:|---:|---:|---:|
| 0.80 | opening | 46 | 4398.137 | 42.156 | 16/46 |
| 0.80 | unclear | 53 | 4287.079 | 44.579 | 24/53 |
| 0.80 | middlegame | 41 | 5862.913 | 61.201 | 19/41 |
| 0.80 | endgame | 39 | 4781.589 | 38.683 | 17/39 |
| 0.90 | opening | 46 | 7175.607 | 78.965 | 25/46 |
| 0.90 | unclear | 53 | 6394.734 | 70.266 | 33/53 |
| 0.90 | middlegame | 41 | 9200.792 | 94.214 | 23/41 |
| 0.90 | endgame | 39 | 7094.176 | 62.923 | 24/39 |

Thus a completed local-prefix traversal need not meet its declared **joint**
coverage rule, and cold four-ply server cost alone exceeds 1,500 ms at p95 in
every named phase here. Warm dependency reuse does not license an interactive
browser pass. No gate is waived, no statistical ranking is introduced and no
profile is selected. Coverage assumes **both sides use the configured model**;
it is neither arbitrary learner behavior nor all-defences proof or an engine's
reason. `[V]` summary, frozen stop rule and cost preregistration.

## Immutable evidence and normal checks

- `d3262-cost-live-maia-prefix080-initial-2026-10-06.json.gz`
- `d3262-cost-live-maia-prefix080-population-2026-10-06.json.gz`
- `d3262-cost-live-maia-prefix090-initial-2026-10-07.json.gz`
- `d3262-cost-live-maia-prefix090-population-2026-10-07.json.gz`

Each preserves original compressed triplets, literal receipt/hash inputs,
metadata and matching instrument snapshots. The new summary retains 2,316 rows /
772 cold-warm pairs / 84 phase-focus-result groups, including corresponding
phase-specific policy coverage. SHA-256:
`05306968f81fdc4c9da1cec108279bf8433dc4632a0aeee6e3766fa96a99103f`.
Original model float serialization is retained rather than reformatted by an
alternate-language checker. `[V]` packages, summary and `cost-pack.mjs`.

```sh
make semantic-search-cost-test semantic-search-cost-contract
make semantic-search-cost-independent OUT=planning/semantic-consequence-search/d3262-cost-live-maia-prefix090-population-2026-10-07.json.gz
make semantic-search-cost-packed-check ARCHIVE=planning/semantic-consequence-search/d3262-cost-live-maia-prefix090-population-2026-10-07.json.gz
make semantic-search-cost-summary
```

The final focused controls pass: 137 execution/source cases, 36 frozen-plan
cases, eleven package cases and eight synthesis cases. Earlier PV summary bytes
remain identical. Remaining foundation obligations: 48 setting populations,
fresh-source outcome sensitivity, individual source/model memory, complete
consumer scope, actual browser/dependency/visible-output joins and justified
profile selection. Parent sampled RSS is only a lower bound. No Hint/D7, RFC,
capability, milestone, official-content or full-1.0 completion follows. `[V]`
terminal Make results, frozen cost contract and roadmap.

Full `make staged-software-contracts` terminates zero on exact index tree
`326d1530516ac8a8c946014256641081f8085fe6`: 3,398 software tests / 344 files,
seven isolated performance tests / four files, clean types and full downstream
build/package/source/value/capability/history/migration contracts. Original proof:
`d3262-cost-model-software-2026-10-07.json`. Final source and Make bytes match
that indexed image; later differences are tracking/evidence only. No production
UI/API behavior changed, so no new browser or GitHub run is claimed. `[V]`
terminal Make output, preserved proof and exact-index source comparison.

Full `make verify-content` passes 227 cases / 23 files, zero clearance-corpus
errors over 92 documents and all 104 exact capability declarations. Staged process
contracts and full governance pass; all 1,689 live rows remain routed, with zero
untriaged/unrouted. Final source/Make bytes match the tested index; explicit owned
staging and ordinary hooks precede commit. `[V]` terminal Make output, canonical
work-state/roadmap receipts and append-only exploration log. No push or goal pause.

## 2026-10-07 continuation — full fresh/frozen model comparison

The separate disposable reader now checks the four existing immutable captures,
not another inference run. All 2,316 cases, 772 cold/warm pairs, 193 candidates
per prefix and 364 named target/setting cells are retained. The six-file frozen
checksum chain binds each candidate's own first prefix, third/fourth histories,
literal conditional/product masses and joint stop audit. Six historical first
source receipts outside this 193-candidate frame remain in their source archive;
they do not expand the measured denominator. `[V]`
`tools/d3262-search-calibration/cost-model-sensitivity.mjs` and
`d3262-cost-live-maia-sensitivity-2026-10-07.json.gz`.

All 364 target cells preserve their exact frontier, executed witnesses,
preparation/defence omissions and grounded outcomes. All 358 target-bearing
candidate/prefix policies preserve their literal edge weights and joint-rule
status. The other 28 candidate/prefix entries retain `no_target`, with policy
not requested: these are not zero-coverage policies. Aggregate layer values
differ literally on 40/179 policies at prefix 0.80 and 72/179 at 0.90; maximum
absolute differences are respectively 3.3306690738754696e-16 and
4.440892098500626e-16. No edge conditional/product weight or threshold verdict
changes. Values are not rounded, renormalized or attributed to changed model
behavior. This describes each prefix versus its own frozen arm; it is not an
assertion that the two prefixes choose the same frontier. `[V]` immutable
synthesis `groups`, `policies`, `cells`; read-only literal-value comparison.

All 772 cold/warm pairs preserve compiled policy/target evidence. Exactly 3,568
node states change from `executed` to `cached`; this explicit dependency-custody
transition is checked separately, not silently removed from the original
receipts. A fresh warm query or node, changed node identity, selected move,
probability, coverage or target observation refuses. Two-ply and offline cases
remain inventory/cache checks, never borrowed four-ply verdicts. Failed,
exhausted and absorbing candidates retain typed unpaired/partial states; terminal
edge mass carries forward without a further policy query. `[V]` synthesis and
sixty-seven permanent reader controls, including both early terminal layers,
one-ULP controls and warm-provenance falsifiers.

The immutable 995,814-byte gzip artifact hashes to
`d59a30fa053308cd701f122b12385a64239a34eb52ed690af1850e56bf70761f`.
Its canonical decoded synthesis hashes to
`f935ceb0e95b59713e3c449c160d5ddccce08b75ac6ec72dca006cfe28303275`.
Normal freeze and **read-only reconstruction with the same reader**
both terminate zero. That reconstruction is custody/synthesis verification,
not another independent chess oracle; the earlier full Python/Torch source
replays remain separately recorded above. `[V]` terminal Make results and
artifact bytes.

```sh
make semantic-search-cost-model-sensitivity-test
make semantic-search-cost-model-sensitivity-check ARCHIVES=d3262-cost-live-maia-prefix080-initial-2026-10-06.json.gz,d3262-cost-live-maia-prefix080-population-2026-10-06.json.gz,d3262-cost-live-maia-prefix090-initial-2026-10-07.json.gz,d3262-cost-live-maia-prefix090-population-2026-10-07.json.gz OUT=planning/semantic-consequence-search/d3262-cost-live-maia-sensitivity-2026-10-07.json.gz
```

No completed setting is captured twice and no timing is restamped. The overall
headline remains eighteen complete settings / 20,844 of 61,374 cases, with the
original five-setting recursive capture still in flight at this checkpoint.
This reader does not reinterpret the older weighted target-semantic projection,
prove usefulness, attribute an engine reason, admit a source, select a production
profile or discharge actual consumer/cache/browser or broader model-memory scope.
D3262 remains doing; routine metadata/hash/state flow-back is automatic. `[V]`
frozen cost plan, source snapshots, original live handle and reader's declared scope.
