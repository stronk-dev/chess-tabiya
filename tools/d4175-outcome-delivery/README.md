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
