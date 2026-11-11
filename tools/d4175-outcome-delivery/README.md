# D4223 — qualified outcome delivery cost

Disposable research for D4175, not production code or a release gate.

```sh
make outcome-delivery-cost-check
make outcome-delivery-cost-smoke
make outcome-delivery-cost
make outcome-delivery-cost-update
```

The last command writes the bounded numeric report under
`planning/foundation-source-identity/`. Other measurement commands print their summaries.
No event population, receipt, heap dump or raw recording is saved. Output is capped at 96 KiB.

Each of 34 positions runs in a fresh child process, after module initialization. The actual
`CandidatePopulationService` uses the application's `GUIDED_HINT_PROFILE.packetCapacity`.
Nonterminal passes acquire the complete wide receipt, validate its scope, invoke all thirteen
actual outcome factories and admit every emitted instance through the real qualification gate.
Three repeats must return the original shared receipt and equal emitted operands/prerequisites.
Available-empty, source-unavailable and terminal paths stay distinct. The original helper
authenticates quiet/unavailable invocations; there is no emitted prerequisite vector to compare
for those outcomes.

Sixteen literal boundaries cover both colors, full initial boards, bishop/knight line opening,
EP, promotion, forced play, unavailable risk, castling and terminal positions. Nine evenly spaced
accepted games from the existing imported fixture provide two adjacent positions each at fixed
plies. This is a fixed convenience workload, not a random population sample.

A separate fresh worker acquires 32 consecutive decisions (plies 9–40) from one imported game
using one service. It inserts no artificial repeated passes between decisions. Runtime memos
naturally remain warm; the final report records retained receipts and sampled RSS. RSS does not
isolate cache ownership or prove a leak. Module initialization and parent PGN parsing are excluded.

`totalMs` includes acquisition, receipt/member assertions, factory/wrapper work, admission and
instrument overhead. Post-pass equality checks and raw-payload byte counting are outside it.
The existing research selector is timed separately after repeated access; its result is inspected
for qualification but never displayed or used as an ordinary consumer. Do not add these timings
together as an implemented workflow: the selector itself invokes the outcome families again.

This does not prove module preflight, API/DOM/voice delivery, teaching usefulness, ordinary
activation, Review response time, appliance memory or population-wide latency. The findings
and next work are in `design/research/module-evidence-assembly.md` §Qualified outcome delivery cost.

## D4225 — retained-memory attribution

```sh
make outcome-delivery-memory-smoke
make outcome-delivery-memory
make outcome-delivery-memory-update
```

Fresh research workers use controlled GC internally. They run the same source stream at
capacities 1, 4 and the actual application capacity, retaining the service through the first
post-work collection and then releasing it. All thirteen family availability/event counts
must remain equal across capacities. A genuinely held/released WeakRef control must pass.
Only memory counters, weak-receipt observer counts and the shared numeric source results
are saved, capped at 48 KiB; there is no heap dump.

**Observer limit:** creating a WeakRef keeps its target alive through the current job, so
the synchronous stream temporarily pins every observed receipt even with a tiny cache.
`workMs` and `memory.afterWork` are observer-influenced and cannot compare natural transient
costs. The useful comparisons occur after job boundaries/forced collections, with the real
service still reachable and then released. Surviving references do not prove a leak or an
exhaustive reachable-object census. RSS need not follow live-heap changes.
[ECMAScript WeakRef constructor, step 4](https://tc39.es/ecma262/multipage/managing-memory.html#sec-weak-ref-target).

## D4225 — actual global memo intervention

```sh
make outcome-delivery-memo-smoke
make outcome-delivery-memo
make outcome-delivery-memo-update
```

The diagnostic build appends count/clear closures to the actual private lexical maps in
`fen-memo.ts`, `evidence-factories.ts` and `position-cache.ts`. It does not replace their
implementations or edit production files. Source prefixes/declarations and missing-hook
controls must pass before measurement. The ordinary build contains no diagnostic hooks.

Workers run the original source workload first, release the service and collect. Only then
do they clear the actual reading/factory maps in opposite orders, with parsed positions last.
Each target must initially be nonempty and end empty; other counts and consecutive snapshots
must agree. Both workers must retain equal legal/family availability/event counts.

Heap drops are marginal effects given earlier clears, not exclusive cache ownership. Shared
graphs make order matter; unchanged entry counts do not prove unchanged reachable bytes.
Transient observer limits still apply. The numeric report is capped at 64 KiB and never
contains payloads or a heap dump. Production cache policy and ordinary activation remain open.


## D4225 — retained-allocation sampling

```sh
make outcome-delivery-cost-check
make outcome-delivery-allocation-smoke
make outcome-delivery-allocation-update
```

The isolated actual-source worker uses Node's in-process allocation sampler at a 64 KiB
interval. A genuinely held 8 MB array must appear, and its samples must disappear after
release/collection, before source measurement begins. Sampling ends after owner release,
actual map interventions and forced collections. Bundle text is read only after sampling
stops. The sampler closes in a scoped finalizer, including source/assertion failure; the
smoke target proves actual disconnection after a deliberate post-startup exception.

Only aggregate self-size totals and the top 30 allocation sites are saved, under the same
64 KiB report cap. These are sampled allocation origins, not an exhaustive live-object
census, retaining paths or exclusive owners. Native `add`/`set` frames do not identify their
containers. Module names are approximate esbuild comment hints. No raw profile or heap
snapshot is persisted; no production limits, source semantics or admission changes result.


## D4225 — frozen verification metadata

```sh
make outcome-delivery-metadata-smoke
make outcome-delivery-metadata-reset-smoke
make outcome-delivery-metadata-reset-update
```

The sampler also saves the top12 allocation call paths with the nearest four callers.
The standard diagnostic appends a non-chess immutable-data insertion, retaining no object
and issuing no evidence. The separate reset build guards one `const`→`let` replacement for
`IMMUTABLE_DATA` and appends a post-work replacement with a fresh WeakSet. This mode does
not preserve that module's complete byte prefix. It never edits production files or changes
identity seals, value receipts, source/invocation membership, source algorithms or budgets.

After source/service/map release, the experiment compares another no-op collection, a real
verifier insertion/collection and finally verifier replacement/collection. Source-map counts
must remain unchanged. Fourteen both-color real-source controls preserve old evidence
admission/receipt identity and fresh all13-family payloads, prerequisite identities,
availability and receipts. Native origins and reset drops are marginal intervention evidence,
not a complete root census or proof that weak keys remain strongly held. Metadata-phase
heaps include diagnostics after sampling stops; do not subtract them from pre-stop heaps to
claim source growth. A production policy requires its own contract and unmodified-source
memory/cost proof. No raw profile/heap dump is saved.


## D4226 — ordinary bounded-verifier comparison

```sh
make bounded-verifier-smoke
make bounded-verifier-measure
```

Build two ordinary source graphs: the baseline substitutes only the committed130f4973
`evidence-contract.ts`; the candidate uses the actual working tree. There are no profiler,
WeakRef, reset or map-clear hooks. Workload/data/collection helpers are in CLI-free
`workload.ts`, shared with the prior driver without bundling its CLI side effects.

Two separate equality workers compare the complete packet/foundation/outcome/availability
graph and all traversed value receipts, plus exact repeated prerequisite identities within
each side. Four fresh sequential baseline/candidate pairs alternate order. PGN selection is
outside the timed stream and before memory checkpoints. Real owner stats after held GC keep
the service live; then the worker releases it and collects. All numeric results are kept.
These are controlled source/admission timings and post-GC observations, not API/DOM latency,
natural peak memory, allocator return or completion of the remaining source-cost work.

The historical immutable-reset report was measured before the bounded repair. Diagnostic
builds at a later source image target its actual current verification memo; they cannot
reproduce the old weak-set footprint merely by rerunning the old command. Do not use that
reset report in place of the ordinary-source comparison.

## D4242 — actual Hint ownership

`make outcome-hint-memory` extends this disposable instrument with two fresh workers at research
capacities1/64. The real HintService, actual typed mock-provider scheduler and genuine complete
source produce an available Hint. The observer records weak receipt/packet references and small
identity/count metadata only, then restores the real read method before collection checkpoints.
A different genuine full source evicts the selected one at capacity1; capacity64 retains both.

The middle checkpoint keeps the **closed Hint instance**, same candidate cache, detached delivery
JSON and provider owners live across actual Hint.close. Dropping the closed instance earlier would
mask a broken close. The final checkpoint releases the closed instance and cache together (its
options otherwise retain that cache), while the identical detached response/providers remain
live. Every GC crosses real jobs; an independent held/released WeakRef control must pass.

This is one fixed positive nine-candidate source, not a multi-Hint workload, HTTP authentication,
live-engine quality, exclusive byte attribution, natural peak, leak or appliance-memory proof.
Reports contain only compact counts/identities/memory; no source/heap/event dumps. Original source
selection, production capacities and all old32-position/all13 measurement modes remain unchanged.
