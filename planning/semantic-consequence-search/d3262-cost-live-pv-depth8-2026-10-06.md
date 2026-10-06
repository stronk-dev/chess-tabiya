# D3262 live execution cost: first complete setting population

Disposable research under RFC-0000. This answers part of D3262; the semantic
consequence-search RFC remains draft, and no production profile is chosen.

The depth-8 PV setting now has **1,158 actually executed cases**: all 193 frozen
candidates / 66 roots, horizons two and four, cold/warm/provider-offline. The
initial six cases and subsequent 1,152 are disjoint; neither was replaced by a
better repeat. The full preregistration still contains **61,374 cases**, not 1,158.
Inputs and source scope remain the frozen cost preregistration and comparison.

## What executed

`cost-stockfish.mjs` starts real UCI Stockfish, pins binary/config identity, uses
one thread / 16 MB hash, clears engine hash per query, preserves literal UCI and
requires depth-complete coherent MultiPV tables with legal PVs. The PV arm queries
all legal root moves at its declared depth; a top-eight source is not substituted.
The monotonic operation includes actual legal population, provider dispatch,
receipt admission, v2 target observation and quantifier compilation. Historical
query durations and stored traversal enumeration are not timings.

Warm re-executes the operation against exactly the matching cold dependency
receipts, reparsing them and recompiling observations; it does not return a cached
answer. Offline denies every attempted provider query. Actual parent-process RSS
is sampled at boundaries and explicitly a lower bound, not engine/model peak.
Worker readiness/startup remains in each original batch envelope, outside ready
operation timings. This is server execution, **not a browser request or paint**.

The live rows retain 716 available evaluations, 358 explicit source-unavailable
outcomes and 84 no-target cases. Each horizon has 179 named-target candidates and
14 without a target. Warm has 179 exact cold-receipt hits per horizon; offline
executes none. No failed/absent/no-target case is discarded. No invalid source,
timeout or absorbing-terminal outcome occurred in this setting's population.

For orientation only, across all 193 candidates, cold p95 is 334.134 ms at two
plies and 338.433 ms at four; warm is 73.867 / 68.001 ms. These are descriptive
candidate-population quantiles, **not** repeated-device measurements or an
interactive gate. The machine-readable synthesis separates setting, horizon,
regime, phase, focus and result kind into 42 groups; unavailable and no-target
timings are never presented as successful explanation latency. Current focus
labels, including unknown, remain unchanged.

## Preserved evidence and checks

- Initial lossless six-row package: `d3262-cost-live-pv-initial-2026-10-06.json.gz`,
  SHA-256 `bb73c8ca2f11f2063631ca0bd11cebfbaa950cd47537d1cbd9b5c85fbc7103e5`.
- Subsequent lossless 1,152-row package:
  `d3262-cost-live-pv-depth8-population-2026-10-06.json.gz`, SHA-256
  `4de7e4307b41b9a4a1343b1b9eaa07cc4359c7cb040a03b6c1234f5d6c281671`.
- Quantitative synthesis: `d3262-cost-live-pv-depth8-summary-2026-10-06.json`,
  SHA-256 `618336e926d6f08fde78be327fd6a76788370d85ee1e21557f49bc7d118124de`.

Packages retain original compressed triplet bytes, original metadata/summary,
literal raw provider receipts and matching instrument-source snapshots. The
unpacked working directories were moved intact into `.cache/d3262-cost-live/`;
they were not deleted or staged as hundreds of loose files.

The 40 execution/source controls include actual subprocess readiness, silent and
chatty deadlines, early exit, invalid UCI and concurrent-query refusal; 11 package
controls reject source, digest, case, range and false-completion corruption.
The original 36 preregistration controls still pass. Independent python-chess
replays the six / 1,152 rows and four / 724 actual target observations, literal
UCI coherence, exact legal denominators, v2 actions, quantifiers, source ceilings
and paired caches. A source-free batch also proves it runs with no executable
and reports no worker/startup rather than requiring Stockfish unnecessarily.
Resealed false moves/quantifiers/source values fail independently.
Clock validation is **interval consistency**, not an independent wall-clock witness.

Normal read-only commands:

```sh
make semantic-search-cost-test semantic-search-cost-contract
make semantic-search-cost-packed-check ARCHIVE=planning/semantic-consequence-search/d3262-cost-live-pv-depth8-population-2026-10-06.json.gz
make semantic-search-cost-independent OUT=planning/semantic-consequence-search/d3262-cost-live-pv-depth8-population-2026-10-06.json.gz
make semantic-search-cost-summary
```

## Remaining work, not implicit completion

The runner currently supports PV, engine-beam, exact-forcing and the complete-local
availability diagnostic (15 settings). Exact arms observe third-ply availability,
not invented fourth-ply execution. Engine beams actually query the selected second,
third and fourth decision layers. Node exhaustion is typed and retains omissions.
Those additional arms have controls but **no live population capture yet**.

Maia configured-policy, first-reply reserve and recursive-semantic adapters (38
settings) explicitly refuse rather than pretend to be measured, source-off, or
ordinary-engine fallbacks. Implement them using the frozen scheduling and ordered
model-history semantics, then capture the remaining settings without excluding
source failures or quiet/no-target candidates. Remaining PV budgets need capture
too. A future report must join all 61,374 exact identities, compare fresh ordering
with the frozen semantic reference, retain individual engine/model memory and bind
real browser request/dependency/visible-output identities before a profile decision.
No Hint/D7, D3262, RFC, milestone, capability or 1.0 completion follows from this
checkpoint. Routine generated metadata and tracker maintenance remains automatic.

Verification: full exact-index software gate passes (3,398 cases / 344 files,
seven isolated performance cases, clean types and downstream contracts), preserved
in `d3262-cost-live-software-2026-10-06.json`. Final production and software-gate
bytes match that tested tree; final research packaging/source-free controls pass
separately. Content passes 227 / 23 after loopback socket permission, with zero
clearance errors and all 104 exact capability documents. Staged process/governance
passes. No production behavior changed, so no fresh browser run is claimed.
