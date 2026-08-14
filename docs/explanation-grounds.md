# Explanation grounds

Tabiya's explanation layer renders only evidence already recorded by the run or
prose explicitly stored in its registered drill pack. It does not generate
strategic prose, infer authored theory, or ask an LLM to invent why a move
worked. It supports two grounded surfaces: branch comparison shows why an
objective changed and the engine evaluations durably attached along each path;
checkpoint and terminal reveal show authored commentary only after the learner
reaches the relevant path-relative boundary or finishes the played consequence.

This page is the cross-system contract. Runtime payload details remain in
`docs/branch-runtime.md`; client episode behavior remains in
`docs/drill-client.md`.

Rung-0 structural grading adds fifteen `rules:structure-*` facts. They render generic detector
grounds because evidence refs carry the feature kind but not its square/file parameters. Exact
position-specific sentences are recomputed from the run FEN in the structural-reading surface.
Those sentences have a no-valence contract; pawn safety states its current-file scope, direct attack
counts never imply a balance, attack reach is not called legal mobility, and outpost/named-structure
matches identify Tabiya's detector or catalogue convention.

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

`BranchComparison` contains branch-keyed `evidence` and `lines` collections. Each
evaluation entry
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
branch's existing `branchPath`. One set-wide common fork determines every
`plyOffset`; evidence on that fork appears on every selected branch at offset
zero and is deduplicated when branches share a rendered cell.

The v1 overlay accepts only `engine_validated` payloads of kind `eval` with a
safe-integer `centipawns` or `mateIn` value. Centipawns map to
`{kind:"cp", value}` and mate maps to `{kind:"mate", movesTo}`. The sign and
value are preserved in the run's existing White-perspective convention. Mate
is never converted to an arbitrary centipawn number.

WDL, best-line, and human-model evidence remain valid typed run events but are
not plotted by this score overlay. An eval event without either recognized
integer field is not a score point.

## Feedback withholding

Comparison is a feedback surface and obeys the same run-level disclosure
decision as graph, events, staged evidence, and evidence application. Before a
pack's `delayed_checkpoint` or `segment_end` event, or before an explicit
position-session reveal, `RunService.compare()`:

- removes only `engine:` references from objective-timeline entries;
- retains `rules:` and `pack:` grounds; and
- returns empty evidence arrays for both sides.

After disclosure, it returns the runtime comparison unchanged. Position-session
delivery closes again on the next committed move, but disclosure of evidence
already recorded in the append-only run remains durable.

This gate closes a real information leak. Before the implementation,
`RunService.compare()` called the runtime directly, allowing an
`engine:main-eval` reference to bypass the public-event barrier before its
checkpoint. The regression test was first run against that behavior and failed
at the leaked reference before the gate was added.

This engine-evidence decision remains pack-wide. Authored commentary uses the
separate path-relative contract below; it does not change the existing graph,
event, evidence, or comparison gates.

Adaptive guidance adds two run-scoped request surfaces without weakening these
barriers. `GET /runs/:id/human-split?nodeId=...` returns an ephemeral recorded
human-model candidate distribution only while the feedback-delivery window is
open; otherwise it returns typed `ASSISTANCE_WITHHELD` (HTTP 409). It never
becomes run evidence. `POST /runs/:id/voice` assembles its packet from the same
run projection and only the authored items already returned by this reveal
surface. It returns typed `VOICE_UNAVAILABLE` (HTTP 503) when no external
provider is configured, and any provider output that fails the packet check
degrades to deterministic text rather than widening the claim set. See
`adaptive-guidance.md`.

## Authored checkpoint reveal

`GET /packs/:id` never contains authored annotations, deviations, plan classes,
claims, concepts, checkpoint triggers, or other pre-play commentary. That wire
projection remains the anti-contamination boundary. The run-scoped endpoint
`GET /runs/:id/authored-feedback` is the only shipped path for returning
authored prose.

The server derives reveal from the append-only run log rather than an authored
scope field or a canonical spine walk. For `delayed_checkpoint`, every
`checkpoint.reached` event reveals previously unseen supported items on that
event's actual root-to-node path. For `segment_end`, a `segment.completed`
event does the same through its end node and attributes disclosure to the end
checkpoint occurrence. Rewinds do not delete events, so revealed prose remains
revealed: a learner cannot unsee it.

`outcome.reached` is also a reveal occurrence. It discloses supported authored
items on that terminal event's actual root-to-node path, including prose beyond
the last checkpoint. Static checkpoint reachability is widened only by terminal
paths that were actually played; sibling prose remains absent.

Exactly three authored shapes are delivered:

- each `spine[].annotations[]` entry, identified as
  `<spineNodeId>#<annotationIndex>`;
- each spine-node deviation that has a `note`, identified as
  `deviation#<arrayIndex>`; and
- each referenced intent-capture plan class, carrying its required label and
  optional description, identified as `planClass#<id>`.

Concept identifiers, unanchored feedback claims, note-less deviations, and
FEN-anchored deviations remain absent. Deviation commentary is about the
decision point and therefore reveals when its anchor node is in scope whether
or not the learner chose that move.

Every item carries a discriminated attribution:
`{kind:"checkpoint", checkpointId, eventSeq}` or
`{kind:"outcome", eventSeq}`. Event sequence is load-bearing: a checkpoint id
may recur on different branches and reveal different material. Checkpoint and
terminal sheets filter on the exact occurrence;
timeline markers appear only for items already returned. The response exposes
only one pre-completion fact,
`hasWithheldAuthoredContent`, and counts only supported items that some
checkpoint can deliver. It never discloses a per-node count or marker before
reveal.

`pack-check` warns with `AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` when
spine-anchored prose is outside every statically resolvable `atSpineNode`
checkpoint path. If any checkpoint uses a dynamic trigger, the warning is
suppressed rather than guessing reachability.

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

Outcome Drill later extended the same closed rules vocabulary with
`rules:result-win`, `rules:result-loss`, and `rules:result-draw`. Those sentences
render the validated learner-perspective `outcome.reached`; they are chess-rule
facts, not strategic assessments. Win/hold/save/resist root assessments and
their separate grading contract are documented in `outcome-drill-grading.md`.

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
  per side at the fork;
- server projection tests exercise Pack A's sibling roots, repeated checkpoint
  ids, segment-end attribution, exclusions, ordering, and rewind monotonicity;
  and
- the Pack A browser flow reaches `plan-commitment`, renders that exact
  occurrence's authored commentary, and proves later-scope prose is absent.

## Current boundary

This implementation improves comparison using shipped data, but it does not
complete breadth gate B4. The following remain content-era work:

- authored strategic claims and their triggers;
- the “right plan, wrong timing” or spare-tempo contract;
- timing-window explanation semantics;
- per-assertion grounding for authored strategic claims (Outcome Drill root
  assessment and rules-derived result grading now ship separately);
- corpus, Syzygy, and non-Stockfish evaluation evidence sources (Maia policy
  mass already persists in opponent selections and reaches the browser);
- feedback packets, authored claim anchors, and path-relative claim-trigger
  evaluation; and
- evidence-bound LLM rendering.

Those contracts require a real authored pack to supply examples and failure
cases. They must not be inferred from the schema fixture or added as generic
vocabulary ahead of content.

Line Drill now adds one closed evidence fact,
`theory:off-objective-deviation`, rendered as the author's explicit
off-objective mark. This is not a strategic claim generated at runtime.
Three-way theory verdicts are derived from the pack and run, delivered only on
the existing per-occurrence reveal surface, and never added to the public pack
projection. For `mode: line`, even the authored spine is withheld before play;
other modes continue to receive their projected spine.
