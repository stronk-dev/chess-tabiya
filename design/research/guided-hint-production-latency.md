# Guided Hint real-engine latency and control validity

Question: D3497 / implementing `rfc/hint-distance.md` §10, D7. This examines
the existing production Hint path, not the draft semantic-consequence search.

## Scope and method

`[V]` The preregistered instrument uses Node 24, the pinned real Stockfish 18
executable and the actual `createApplication` composition with isolated disposable
databases, ephemeral loopback HTTP, production provider health/exchange, shared
candidate populations and the shipping 100 ms sequential polling cadence. Four
fixed positions, all five requested rungs, cold/warm/source-off/optional-voice arms
and twenty samples per cell give 44 cells / 880 requested responses, plus sixty
separate paired no-voice baselines. Its source and boundaries are published in
`tools/d3497-hint-latency/{plan.json,capture.ts,receipt.mjs,README.md}`.

`[V]` Cold means fresh application Hint/packet caches, not cold OS binary pages.
Warm means a different run on the same FEN/source in the same application, with
actual `retained_exact` delivery and exact packet-hit identities joined to the
cold acquisition. Later rungs reuse the decision horizon; their request-entry
clock is explicitly separate from a newly observed source/packet completion.
Voice timeout/refusal is an explicitly local transport control, not paid-model
quality. Source-off is real-engine mode with a missing Stockfish command, never
a mock substitute. The fixed protocol includes failures, empty results and
policy refusals rather than measuring only available hints. [Instrument sources above.]

## The rejected full predecessor remains evidence

`[V]` The first full twenty-sample population is preserved byte-for-byte in
`planning/provider-exchange-and-execution/hint-latency-http-pre-module-control-repair-2026-10-06.json`
(SHA-256 `60bab607cb170bb7378e8d57136bdecafdca47da9a007aefe2f0c0b9255ff0e3`).
It contains 880 rows and sixty paired baselines, but its checker refuses it:
all twenty source-off queries deliver theory while suppressing structure.
The copied predecessor plan/capture/checker hashes match the literal source
images in that artifact. `make guided-hint-latency-check` permanently verifies
that the old population remains rejected, not retroactively passed.

`[V]` This is an instrument-control error, not missing structure caused by the
engine outage. The control chose Support (`guided: off`) and added a module,
which does not raise the separate named-pattern field; the production compiler
truthfully removes that effect. Earlier smoke controls also incorrectly called
`retained_exact` delivery `retained`, expected unavailable voice to reach the
provider despite the server's availability clamp, and queried post-commit
modules at checkpoint timing. Those readings were refused, not published as
rendering or fallback success. [Preserved predecessor sources; current
`packages/runtime/src/presets.ts` `PRESET_DECLARATIONS`,
`apps/server/src/rest.ts` hints/modules routes, and
`packages/runtime/src/assistance-exchange.ts` source-availability clamp.]

`[V]` The corrected v2 plan selects the ordinary Guide me preset for the separate
real committed structure/theory module control. All Hint positions, profiles,
rungs, sample counts and budgets remain unchanged. Both requested modules must
actually deliver; unrelated proactive output cannot replace either one. The
complete population is repeated, not patched or spliced onto the old timing
rows. [Current `plan.json` revision reason and `receipt.mjs` module predicates.]

## What the evidence already falsifies

`[V]` The complete corrected v2 run and read-only replay terminate zero on
880 responses / 44 cells / twenty samples and sixty baselines, with both requested
source-off modules actually delivered. Maximum POST p95 is 20.4 ms; the maximum
non-timeout dependencies-to-HTTP p95 is 129.0 ms, not browser paint. Optional
voice timeout still waits **2,102.1 ms** at p95 after mandatory dependencies,
so structural checker acceptance is not a passed latency budget. The retained
states are 480 honest-empty, 160 policy-refused, 220 available and twenty
source-unavailable. Complete measurements, machine/source identities and limits:
`planning/provider-exchange-and-execution/hint-latency-http-2026-10-06.md` and
its immutable JSON (SHA-256
`dc725d62669648a44b99b81a4a720f083f9ee1df9a0707d6eee7d1202ffa0e5a`).

`[V]` In the rejected predecessor, all twenty voice-timeout responses retain the
byte-identical deterministic hint, but wait after mandatory source/packet
completion: nearest-rank p95 is **2,082.7 ms**, before browser paint. The current
`HintService.#run` awaits optional `#voice` before sealing an available delivery,
and the application voice timeout is 2,000 ms. That is already incompatible with
the RFC's 150 ms dependencies-to-render budget; redefining optional voice as a
mandatory chess dependency would hide, not repair, the observation. [Preserved
population `mate/voice_timeout/pattern`; `apps/server/src/hint-service.ts` `#run`/
`#voice`; `apps/server/src/application.ts` `GUIDED_HINT_PROFILE`; RFC §10.]

`[M]` A deterministic-first lifecycle with separately identified optional voice
is a plausible repair, but the present closed delivery/protocol does not specify
it. D3498 owns the accepted-amendment boundary and production negative controls,
in `planning/provider-exchange-and-execution/hint-voice-latency-repair-proposal.md`.
No new protocol or shortened provider deadline is implemented by this research.

## Limits and remaining discharge

`[V]` Every learner preset stops at `distance` or `off`; `move` is refused before
source/packet acquisition. The instrument keeps those 160 response rows but
cannot call them a rendered fifth-rung journey. Unconfigured voice is suppressed
by production assistance and produces `not_requested`; timeout/refusal are the
actual provider fallback arms. [Current `packages/runtime/src/hint-distance.ts`,
`packages/runtime/src/presets.ts`, `apps/server/src/rest.ts` and instrument plan.]

`[V]` An HTTP completion stopwatch is not browser paint. The receipt leaves that
axis unmeasured; Node process RSS does not include native engine or appliance
peak. Four chosen positions also do not establish general hint usefulness,
tactical/quiet breadth or the reason Stockfish preferred a move. D3497/D7 require
their actual remaining boundaries; D3262's five-approach cost/profile question
is distinct and stays open. [Instrument plan/checker; `rfc/hint-distance.md` §10;
`rfc/semantic-consequence-search.md` research prerequisite.]
