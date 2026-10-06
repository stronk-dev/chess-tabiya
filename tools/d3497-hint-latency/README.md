# Guided Hint production-boundary latency instrument

Disposable D3497 research under implementing `rfc/hint-distance.md` §10/D7.
It measures the existing Hint application, not semantic-consequence search.

Run the normal repository commands:

```sh
make guided-hint-latency-check
make guided-hint-latency-smoke
make guided-hint-latency
make guided-hint-latency-receipt-check
```

The checker controls run in ordinary `make verify-software`; machine-specific
real-engine capture and measured latency thresholds do not become CI gates.
Make chooses the repository's Node 24 runtime and pinned local Stockfish. Capture
builds production code, starts serial real `createApplication` instances on
ephemeral loopback ports, creates disposable learner/run records in isolated
temporary databases, then closes the application and removes only those owned
directories. No user database, session, source fixture or production setting is
changed. The instrument observes the existing service/scheduler/population paths;
it does not replace chess results or acquire a hidden alternative source.

`plan.json` freezes four positions, six arms, all five requested rungs and twenty
samples per cell. Coldness means fresh application Hint and packet caches, not
cold OS executable pages. Warmness means a new run on the same FEN/source in the
same application, with actual `retained_exact` acquisitions and packet hits
checked against their cold identities. Later rungs reuse the decision horizon;
rows without observed mandatory acquisition use a separately labelled request-entry
clock rather than pretending a new engine dependency completed.

Every response is retained, including empty, unavailable and policy-refused
outcomes. The production preset refuses `move` before acquisition: its bytes
are measured as a refusal, not as a rendered fifth-rung answer. Source-off uses
an explicitly missing Stockfish command in real-engine mode, not mock mode. Its
independent module control makes a real committed move, opens disclosure and
requests named structure/theory modules through the actual post-commit route with
the ordinary Guide me preset. The actual receipts/absences are retained; HTTP 200
is insufficient. Optional Explorer and opening-artifact absence stays visible.

Voice controls are explicitly absent or local timeout/empty-output transports,
not evidence about a real paid LLM. Absent voice is disabled by production policy
and truthfully `not_requested`; timeout/refusal exercise actual typed fallback.
Paired no-voice baselines remain separate raw rows, never deleted or mixed into
the timing population. Deterministic sentence bytes must agree.

Source identities, machine/Node, profile, literal acquisitions, packet/compiler/
manifest identities, payload sizes, timing populations and Node-only memory are
retained. Capture refuses source drift and output overwrite; each ordinary run
gets a new timestamped cache path. It writes the raw population before checker
acceptance so a refused capture is not silently discarded. Smoke mode cannot
be relabelled as twenty samples. `verify.mjs` replays the saved full receipt
read-only and refuses current-source drift; future source changes make this
a historical reading requiring a fresh measurement, not unchanged proof.

This HTTP stopwatch does **not** measure browser paint, native Stockfish memory,
whole-appliance peak, full search coverage, hint usefulness or engine causality.
An accepted capture validates its measurement structure, not the 150 ms rendering
budget, default-on admission, all five rendered rungs or D7 completion. The printed
budget readings and missing browser axis remain explicit even when the checker
terminates zero. The rejected full v1 capture and its instrument source image
are preserved in `planning/provider-exchange-and-execution/`: Support's
`guided: off` kept `structure_nudge` ineffective despite explicit module inclusion.
V2 corrects that control's preset before repeating the full population. It does
not drop failed rows, lower the module requirement or change the Hint profile.

## Browser axis — separately frozen population

`make guided-hint-browser-smoke` and `make guided-hint-browser-latency` build the
shipping web app and run real Chromium Hint clicks against isolated applications
using the existing `BOT_CALIBRATION_SF_CMD` pinned Stockfish configuration. No
route interception, mocked chess source, cadence override or alternative seat is
used. `browser-plan.json` retains every base-plan cell. Rungs that cannot be
reached after an empty predecessor remain `not_reachable` with null timing;
the move REST refusal is a separately labelled ceiling control, not a UI answer.
Every voice arm retains a separate real browser baseline.

The observer records trusted input, exact visible sentence/rung and two animation
frames, viewport bounds and centre hit testing. It brackets browser/Node clocks
with five RPC intervals and retains the narrowest uncertainty interval. Retained
horizon timing starts at actual server request entry, not driver actionability
checks. AsyncLocalStorage keeps mandatory source traces attached to the actual
Hint operation rather than unrelated background requests. An available response
must bind to the exact outgoing decision/rung. Post-frame visibility is a browser
rendering opportunity, not a compositor or physical-display claim.

Pure checker controls join `make guided-hint-latency-check` and ordinary software
verification. Machine-specific capture does not. Failed/incomplete capture is
written before rejection; a full receipt cannot overwrite an older result.
`make guided-hint-browser-receipt-check` replays the full population read-only,
checks source hashes and reports budget failures without relabelling checker
acceptance as a latency pass. Capture hashes all tracked production source and
the actual built app/worker artifacts. Missing future rung policy, optional voice
lifecycle and owner-device validation remain their separately tracked obligations.

The saved browser replay additionally uses `source-off-check.mjs` to require both
fixed positive controls to deliver actual items with exact packet/decision/subject/
component joins. Its eleven corruption controls run in the ordinary software gate.
This independent strengthening does not rewrite the original captured checker,
source digests or timing population; older receipt images remain historical.
