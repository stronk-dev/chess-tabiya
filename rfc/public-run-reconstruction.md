# RFC: Public run reconstruction

- **Status:** draft — D3700 is reproduced through admitted pack play and the actual reasoning HTTP route; independent buildability review is required before implementation.
- **Author:** codex
- **Created:** 2026-10-11
- **Design refs:** `design/05-in-run-experience.md` §1, preserved attempts, stated absence and replayable run truth; §3, assistance disclosure.
- **Exploration gate:** the logged breadth drafting override in `planning/exploration/gates.md`; D3700's actual HTTP positive and branch controls in `apps/server/src/drill-client-server.test.ts`.
- **Depends on:** `rfc/archive/open-answer-grading.md` §§2/6; `rfc/archive/branch-runtime.md`; `rfc/archive/evidence-at-runtime.md`.
- **Parent / amends:** `rfc/archive/open-answer-grading.md` public response reconstruction only.
- **Supersedes / superseded by:** —
- **Planning:** the D3700 row in `planning/codex-queue.md`; an implementation plan is required after acceptance.

```tabiya-claims
none
```

## Summary

Separate a read-only public run view from the canonical saved event log. A learner can
submit reasoning, continue, reload or follow a branch while its authored detections are
withheld. The transcript remains visible, and the actual recorded detections become
visible only through the existing server disclosure policy. Storage, matching, checkpoint
and segment semantics do not change.

## Motivation

`publicReasoningEvent` removes detections from an unskipped event, while `projectRun`
requires every unskipped canonical event to retain detections. The seven network-replay
calls in the client currently use that canonical projector. A direct runtime fixture
demonstrated the conflict but did not establish production reachability.

The D3700 HTTP control now starts a validated `segment_end` pack, plays its first
checkpoint, forks there, plays the next two legal plies and submits reasoning. The first
checkpoint belongs to the original branch; the new branch's first checkpoint does not
close a segment. The saved event contains the actual detection; its successful HTTP
response withholds that detection and cannot replay. The otherwise identical original
branch control closes a segment and replays successfully.

Sources: `apps/server/src/drill-client-server.test.ts`, D3700 paired control;
`packages/runtime/src/runtime.ts`, `reachCheckpoint`; `apps/server/src/feedback-policy.ts`,
`publicReasoningEvent`; `packages/runtime/src/events.ts`, `reasoning.recorded` validation.

Changing checkpoint ancestry, making every branch reveal, rejecting the learner's valid
submission, or fabricating a skipped event would change the accepted experience to avoid
the transport defect. None is part of this repair. There is no new evidence producer,
LLM behavior, matcher, content wave, durable table, persisted schema or hash mechanism.

## Specification

### Public types

Export distinct `PublicRunEvent` and `PublicRun` read types. All event arms retain their
existing public fields. Only the reasoning arm differs from its canonical counterpart:

```ts
type PublicReasoningRecordedEvent = Omit<ReasoningRecordedEvent, "data"> & {
  readonly data: Omit<ReasoningRecordedEvent["data"], "detections"> & {
    readonly detections?: readonly ReasoningDetection[];
  };
};
type PublicRunEvent = Exclude<DrillRunEvent, ReasoningRecordedEvent>
  | PublicReasoningRecordedEvent;
type PublicRun = Omit<DrillRun, "events"> & {
  readonly events: readonly PublicRunEvent[];
};
```

An unskipped withheld event omits `detections`; it never publishes `[]` as a measurement.
A skipped event keeps its actual `transcript: null`, `skipped: true`, `detections: []`.
A disclosed unskipped event contains the exact nonempty saved detections. The transcript,
event sequence, occurrence, timestamp and matcher version remain unchanged in every view.
Omission means the read does not supply detections, not that nothing was mentioned.

The existing run-schema version identifies the saved format, not an assertion that a
public response is a canonical schema document. No persisted version is moved. No new
event arm or separately versioned protocol is introduced. If implementation needs either,
return this draft for an explicit resource claim before making that change.

### Read reconstruction and canonical validation

Provide `projectPublicRun(events): PublicRun` separately from `projectRun(events): DrillRun`.
Both use the same private graph/event reconstruction mechanics. The public entry point
permits only the declared reasoning omission; it still validates sequence, node and
checkpoint occurrence, matcher version, skip/transcript consistency and every supplied
detection's identity/status/span consistency. Missing detections on a skipped event,
present empty detections on an unskipped event, wrong occurrences and inconsistent
transcripts remain errors. No caller-selectable generic relaxed-validation option exists.

`projectRun`, `appendEvents`, storage read-back, migrations, account import admission and
all server writes keep canonical validation unchanged. A public view is not assignable
to their saved-run input types. Do not synthesize placeholder detections, change the
learner's skip choice, renumber events or silently discard the reasoning event.

Position-only shared readers may accept the precise run fields they read instead of
requiring a canonical journal. Readers requiring canonical reasoning use saved data on
the server; learner reasoning rendering continues to use the existing authorized page.
This type migration must compile at every actual consumer, not only at named anchors.

### Server and client adoption

`publicEvents`, `publicRunSnapshot` and `publicMutationPayload` expose the public types and
enumerate fields as today. Their existing authorization and disclosure policy is unchanged.
The reasoning page's withheld key points/detections remain absent, and public transcripts
retain the existing grant-scoped visibility. No previous-run disclosure is widened.

Every network-returned run/events/mutation type in the web API uses the public types.
Replace all network-fed canonical reconstruction, including controller resume, store
construction/static resume, follower append, mutation recovery, bot-ply admission and
duplicate-response validation. At drafting, the direct reconstruction population is seven
`projectRun` calls across `run-state.ts`, `session-controller.ts` and `duplicate-response.ts`;
the implementation derives and checks the live calls rather than treating seven as a ceiling.

Same-sequence public reasoning views may add or omit detections without changing recorded
identity. Detections present in both views must be identical. Transcript, skipped choice,
occurrence, matcher version and all other fields must always agree. Other event arms retain
their current immutable comparison, including D3699's narrowly declared score/WDL behavior.
A slower response cannot erase a newer local event tail or a newer disclosed view.

Incremental event reads can retain an earlier withheld receipt while appending a disclosure
boundary. When such a boundary is reached, fetch the full authorized event page to refresh
existing reasoning views. Re-admit the run identity and immutable prefix before adopting it.
Failed refresh keeps played history and exposes an explicit retry; never invent detections
or repeat the reasoning submission. The dedicated reasoning page refresh remains subject
to the same current run/occurrence checks and supplies displayed point attribution.

### Learner flow

A successful withheld submission shows the learner's saved words and a plainly worded
pending-disclosure explanation. Submit and skip are no longer offered for that occurrence.
Continue, rewind and branch remain available under their ordinary rules. Reload and a
granted spectator preserve the receipt without revealing point labels or detections.
When the actual segment opens delivery, the same receipt gains its saved detections and
authored attribution. An explicit skip retains the existing fixed skip sentence.

## Deviations from design

None. Public read omissions are distinguished from saved run truth. The accepted reasoning
contract's transcript visibility and delivery timing, and the branch runtime's segment
identity, are preserved. The archive is not amended.

## Acceptance criteria

1. The paired admitted HTTP controls remain: original-branch disclosure, new-branch
   withholding, and unchanged saved canonical data. Canonical replay of the public
   withheld view still refuses; public replay succeeds and retains the exact transcript.
2. Independent runtime/public-reader controls cover typed/skip, withheld/disclosed,
   crossed occurrences, bad skip/transcript data, unsupported matcher, duplicate detection
   ids and invalid spans. Canonical append/read-back rejects omitted detections unchanged.
3. Compile-fail controls prove public views cannot enter canonical append, storage or
   account import admission. Full workspace types prove actual consumer adoption.
4. Client controls cover constructor, resume, mutation, follower append, same-head
   disclosure, missing-response recovery and delayed older replies. Conflicting already
   visible detections or changed transcripts refuse without changing the local run.
5. Real desktop and touch-phone browser journeys privately save/playtest the admitted
   segment-end fixture, fork between checkpoints, submit, reload, continue to another
   checkpoint and see the exact saved attribution. Include a granted spectator and
   failed disclosure-refresh/retry without a second submission. Played moves and the
   original branch remain unchanged; no hidden point identity leaks before delivery.
6. Existing delayed-checkpoint reasoning, prediction, Line Drill, Support and spectator
   journeys pass. Normal software, content, browser and governance tiers run with unchanged
   timeouts, zero retries and no concurrent rebuild of their served checkout.
7. Update API/runtime/client docs, D3700, execution state and the exploration log together.
   No whole capability, new content endorsement or release completion follows from this fix.

## Discharges

none

## Open questions

None proposed as owner product decisions. Independent review must establish that the
read-type migration, canonical/public separation and refreshed disclosure controls are
buildable before acceptance. No production implementation is authorized by this draft.

## Changelog

- 2026-10-11: created from the admitted HTTP branch/control pair; canonical validation,
  saved bytes, segment semantics and actual disclosure policy remain unchanged.
