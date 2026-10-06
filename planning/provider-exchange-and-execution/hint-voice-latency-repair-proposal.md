# Guided Hint optional-voice latency — D3498 repair boundary

Authority: implementing `rfc/hint-distance.md` §§4, 7, 10. This is a proposed
contract repair, not implementation approval or a new voice protocol.

## What the current production path does

`apps/server/src/hint-service.ts` `#run` compiles the deterministic packet after
the mandatory search and candidate populations resolve, then awaits `#voice`
before sealing its one available delivery. The application gives that optional
voice two seconds. `HintService` cancellation, stale decisions, shared horizons,
registered rendering, redaction and typed fallback still apply; the problem is
that already-resolved chess evidence waits behind optional prose.

The D3497 real-engine HTTP instrument separates last mandatory source/packet
completion from optional voice. The timeout control uses an explicit local voice
transport, not a paid LLM and not a manufactured source result. The complete
twenty-sample timeout cell measures 2,102.1 ms at p95 after the mandatory
dependencies; the immutable population is `hint-latency-http-2026-10-06.json`
with its report. At that HTTP checkpoint browser rendering was unmeasured, not
a way to clear the already-over-budget wait. The separate complete shipping
Chromium follow-up now measures visible post-frame output: the repaired 50 ms
cadence still reaches 2066.049 ms p95 after mandatory dependencies (lower bound
2065.772), while all non-timeout rendered cells stay below 150 ms. Its unchanged
880 rows/sixty baselines and before/after source images are linked in
`hint-latency-http-2026-10-06.md` §Browser follow-up. No population is dropped.

## Constraints on a proper repair

The deterministic result must be publishable within the existing latency budget
without depending on optional voice. The following shortcuts do not satisfy it:

- redefining optional voice as a mandatory chess dependency;
- declaring the hint available before it is actually accessible to the client;
- labelling an unfinished voice operation as timed out, absent or refused;
- mutating a sealed delivery or letting a browser attach arbitrary provider prose;
- silently shrinking the two-second provider deadline to make a benchmark green;
- exposing more evidence or a higher rung to a second provider operation;
- requesting voice autonomously or retaining stale/cancelled work after the seat exits.

The author/reviewer must specify one coherent delivery lifecycle. A proposed
direction is deterministic-first hint delivery with separately identified optional
voice work tied to that exact receipt and decision, an explicit pending/settled
voice status, and no mutation of its evidence authority. That changes the current
closed delivery/protocol and therefore requires an accepted amendment before
production implementation. A late voice result must not change board marks,
rung, selection, evidence or the deterministic sentence; lifecycle and cancellation
controls must reach the actual HTTP/client boundary, not merely an exported helper.

Absent voice also needs precise wording: production assistance compilation
disables persona before `HintService`, so its available delivery truthfully says
`not_requested`. It must not be relabelled `provider_unavailable` merely to make
an expected fallback fixture pass. Timeout and empty-output refusal remain actual
provider-call fallback paths in the current instrument.

## Exit, not a checkbox

Retain the existing sentence bytes, registered evidence and all policy ceilings;
prove deterministic availability before an intentionally delayed voice completes;
prove exact decision/receipt binding and one authority for any later voice;
exercise timeout, refusal, absence, stale decision, explicit retry, cancellation,
eviction, sibling search and application shutdown with permanent negative controls.
Then remeasure the same complete cold/warm/source-off/voice population and actual
browser paint. D3498, D3497 and hint-distance D7 remain open until their respective
evidence is obtained. This does not license semantic-consequence search or a
default-on search profile.
