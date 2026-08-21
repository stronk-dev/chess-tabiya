# Evidence contract manifest — bind-stage author return

Date: 2026-08-21
Implementation checkpoint: `2b68103`

This handoff names the two seams that prevent F1 from landing as accepted. It does not ask for a
new product ruling, a preset, a detector admission or an F2 selector decision.

## 1. Provider text has two authorities

`VoiceEvidenceView` contains:

- `evidence`, filtered through the compiled `guidance.voice@1` bindings; and
- `sentences`, copied independently from `EvidencePacket.sentences`.

`voiceCheck` then treats `packet.sentences` as its allow-list. Consequently a route can widen both
provider input and the output checker by mutating the same undeclared array. The live instances are:

| scope | mutation | sources represented | manifest result today |
|---|---|---|---|
| reading / marker / steering | base packet sentence assembly | phase, named structure, pivotal, endgame, authored | mostly declared, but phase payload/provenance is false ([[D665]]) |
| compare | replaces sentences with `comparisonNarrative(...).groups` | branch move/SAN, fork geometry, structure/eval comparison prose | no corresponding `guidance.voice` declarations |
| story | appends `suggestTitle(story)` and selected `StoryMoment.sentences` | pivotal, recorded eval, endgame, shape span, terminal/recorded outcome | only a subset exists as declared producer projections |
| speech | reuses the same reading/story packet before TTS | same as above | inherits the same gap |
| reasoning | passes a non-chess quotation task in the ignored legacy argument | learner transcript/key points/detections | separate broken contract ([[D663]]), not a chess-evidence binding |

The negative fixture F1 needs is direct: mutate only raw `packet.sentences` with a unique sentinel;
the sentinel must not enter provider input and must not become allowed output. It does today.

### Smallest truthful author choices

1. **Recommended: typed rendered items.** Replace the parallel sentence array in provider input with
   `{ evidence: DeclaredEvidence<T>, sentences: string[] }` items constructed by exact adapters.
   Compare/story must declare their derived source projections (including outcome) before their
   prose can be revoiced. `voiceCheck` derives its allow-list from the same admitted items.
2. **Narrow F1:** keep compare/story deterministic and remove their external revoice until a
   follow-up derived-evidence RFC. This changes a shipped optional feature but creates no invented
   producer. Reading/marker/steering can resume once their sentences derive from admitted items.
3. **Refused:** keep `sentences` as a trusted side channel or register a generic
   `derived.sentence` projection. Both recreate the wildcard/bare-payload bypass F1 exists to end.

Choice 1 preserves current behavior and is the smallest architecture consistent with the accepted
RFC, but it adds a chained derived-producer concept the current type vocabulary does not state.
That concept must be authored into the RFC before implementation invents its semantics.

## 2. Declarations are not yet call-site bindings

The catalogue declares 23 operation IDs and the check finds one source needle for each. That proves
the census still points at live code; it does not prove those operations consume a compiled view.
At the checkpoint, external voice is the only operation that calls `evidenceForConsumer`.

The resumed stage-2 implementation needs one generic typed view, parameterized by the literal
consumer ID/version, and source-specific adapters that construct it. Each of the 23 operation
entrypoints must accept that view (or `DeclaredEvidence<T>`) rather than a bare packet/ref/reading.
The check should typecheck a negative fixture that passes the old raw payload and fails. String
needles remain useful for census drift, but cannot be the generic-bypass invariant.

## 3. Work that remains valid

The checkpoint does not need to be discarded:

- pure deterministic compiler and twelve stable error families;
- 14-producer / 65-projection catalogue and dependency closure;
- exact producer+projection filtering (tightened during review);
- startup and `make verify` compiler invocation;
- `/capabilities` digest, availability and binding summary;
- Evidence Inspector relabel and canonical docs;
- 23-operation anchor census as a census guard, not as criterion-7 proof.

No schema, storage or content file changed. F2 selection/lift, F3 migration and F5 presets remain
out of scope.
