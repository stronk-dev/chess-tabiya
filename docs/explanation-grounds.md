# Explanation grounds

Tabiya's first explanation layer renders only evidence already recorded by the
run. It does not generate strategic prose, infer authored theory, or ask an LLM
to invent why a move worked. Its shipped purpose is narrower: when two branches
are compared, show why an objective changed and show the engine evaluations
that were durably attached along each path.

This page is the cross-system contract. Runtime payload details remain in
`docs/branch-runtime.md`; client episode behavior remains in
`docs/drill-client.md`.

## Evidence flow

The implemented path is:

1. an evidence job produces a typed evaluation payload;
2. the run writer applies the staged result;
3. the runtime records an `evidence.attached` event at a node;
4. `compare()` walks both branch paths and projects eligible recorded events;
5. the server applies the pack's feedback-reveal policy; and
6. the compare view renders grounded objective sentences and an aligned score
   trajectory.

Only step 2 makes evidence part of the run. Staged or queued jobs are not a
comparison source. Consuming a queue result therefore does not remove it from a
later comparison: the durable event remains authoritative.

## Comparison payload

`BranchComparison` contains an `evidence` collection for each side. Each entry
has this shape:

```ts
{
  nodeId: string;
  plyOffset: number;
  evidenceRefs: readonly string[];
  kind: "eval";
  source: "engine_validated";
  score:
    | { kind: "cp"; value: number }
    | { kind: "mate"; movesTo: number };
}
```

Entries are selected from `evidence.attached` events whose node occurs on that
side's existing `branchPath`. The same path and common-fork calculation used by
move pairs, objective timelines, and checkpoints determines `plyOffset`.
Evidence attached to the common fork is therefore present on both sides at
offset zero; this is intentional because it is the shared baseline.

The v1 overlay accepts only `engine_validated` payloads of kind `eval` with a
safe-integer `centipawns` or `mateIn` value. Centipawns map to
`{kind:"cp", value}` and mate maps to `{kind:"mate", movesTo}`. The sign and
value are preserved in the run's existing White-perspective convention. Mate
is never converted to an arbitrary centipawn number.

WDL, best-line, and human-model evidence remain valid typed run events but are
not plotted by this score overlay. An eval event without either recognized
integer field is not a score point.

## Feedback withholding

Comparison is a feedback surface and obeys the same pack-level reveal decision
as graph, events, staged evidence, and evidence application. Before
`delayed_checkpoint` or `segment_end` reveals feedback, `RunService.compare()`:

- removes only `engine:` references from objective-timeline entries;
- retains `rules:` and `pack:` grounds; and
- returns empty evidence arrays for both sides.

After reveal, it returns the runtime comparison unchanged.

This gate closes a real information leak. Before the implementation,
`RunService.compare()` called the runtime directly, allowing an
`engine:main-eval` reference to bypass the public-event barrier before its
checkpoint. The regression test was first run against that behavior and failed
at the leaked reference before the gate was added.

The reveal decision is deliberately pack-wide. Per-scope or path-relative
reveal rules are not implemented.

## Grounded objective rendering

Each objective-timeline entry is rendered as `from → to`. Every one of its
`evidenceRefs` is resolved through the existing `renderEvidenceRef` and
`evidenceSentenceTable` implementation:

- known `rules:` facts use the shipped fixed rules sentences;
- `pack:<checkpointId>` uses the checkpoint's authored label; and
- `engine:` remains explicitly engine evidence.

No new sentence vocabulary was added for this feature. In particular, the
renderer does not manufacture strategic explanations from state names or
scores.

An objective transition with an empty evidence-reference array throws and
includes the event sequence in the error. There is no friendlier “reason not
recorded” branch: runtime transition validation and the run schema already
require at least one ground, and compare preserves that contract instead of
masking corrupted data.

## Evaluation trajectory

The compare view renders both evidence sides in one shared ply-offset grid.
The common fork is a named offset-zero column, and every later column is a
positive offset from it. This makes positions at the same consequence depth
line up even when the underlying branches contain different moves.

Centipawns display as signed pawn values; mate displays as a distinct `M±n`
label. The view does not compute or claim a branch delta. That is important for
the deterministic browser harness, whose mock evidence executor legitimately
records the same zero score on every node.

The heading says “Recorded engine evaluation.” The comparison payload records
that an eval was engine-validated but does not carry an engine identity. The
engines deployment currently obtains those scores from Stockfish, while the
browser acceptance deployment uses the mock executor. Naming Stockfish in the
shared view would claim provenance absent from the payload.

## Verification

Coverage spans the seams of the feature:

- the server regression proves engine references and overlay entries are
  withheld before reveal and visible afterward;
- runtime tests round-trip both centipawn and mate encodings;
- an integration test drains and consumes the evidence queue, then proves the
  comparison still derives both sides from persisted events;
- the component test resolves the existing checkpoint sentence, checks both
  score forms and fork alignment, and asserts throw-on-empty; and
- the Playwright walkthrough waits for writer-applied evidence before opening
  compare, then requires a grounded objective sentence and one recorded entry
  per side at the fork.

## Current boundary

This implementation improves comparison using shipped data, but it does not
complete breadth gate B4. The following remain content-era work:

- authored strategic claims and their triggers;
- the “right plan, wrong timing” or spare-tempo contract;
- timing-window explanation semantics;
- grounding unshipped objective types such as `win` and `hold`;
- corpus, Maia, Syzygy, and non-Stockfish evidence sources;
- feedback packets, per-scope reveal, and path-relative trigger evaluation;
  and
- evidence-bound LLM rendering.

Those contracts require a real authored pack to supply examples and failure
cases. They must not be inferred from the schema fixture or added as generic
vocabulary ahead of content.
