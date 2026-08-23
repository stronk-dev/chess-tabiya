# D1067/D1068 — path-compiler source audit

Measured 2026-08-23 against `426fa7b` plus the in-flight exact-mobility collector work. This is
an implementation/RFC handoff, not an accepted design.

## What exists

Seven observed-sequence operand detectors and sealed constructors exist for deflection,
attraction, line-blocker clearance, square clearance, interference, check zwischenzug and
overload exploitation. Their only callers outside their definitions/exports are
`packages/runtime/src/semantic-tactic-sequences.test.ts`. Production caller count: **zero**.

`localSemanticEvents(beforeFen, moveUci, afterFen)` is intentionally one-edge. It cannot see a
3–5-edge witness. No `semanticEventsForPath`, run projector, Review compiler, import adapter or
PV compiler invokes the sequence detectors.

## The source split an RFC must preserve

### Recorded path

- `move.committed` retains a complete `Node`; every non-root node retains `parentId`, `fen`,
  canonical `moveUci`, `ply` and `branchId`.
- A contiguous branch path can therefore derive exact `RecordedMoveAnchor` values without a new
  table.
- The existing sequence projections declare `recorded_run` grounding and their constructors
  require one sealed `run.record.move@1` input per anchor. This is their honest home: completed
  learner runs/imported recorded paths, Review and longitudinal counts after their separate
  consumer admission.

### Hypothetical engine path

- `live.stockfish.pv@1` is provider evidence about an unplayed line.
- It cannot produce `run.record.move@1`; passing synthetic anchors to the observed constructors
  would make a provider line appear learner-recorded.
- The operand predicates may be shared, but the evidence identity cannot. Guided Hint needs a
  separately registered derived family whose derivation includes the exact versioned PV and the
  local rule/convention inputs used on its edges. Suggested namespace for the author to adjudicate:
  `derived.hint.semantic_horizon.*@1`. It must say *“appears on this recorded engine line”*, never
  *“you executed”* or *“this is forced.”*

## Minimum two-adapter closure

1. `recordedSemanticEvents(pathNodes, moveEvidence)`
   - validates one branch, consecutive node/FEN boundaries and exact evidence per anchor;
   - evaluates every registered window size once;
   - seals existing `recorded_run` sequence events;
   - returns events plus typed abstentions, never silently drops a broken window.
2. `engineSemanticHorizon(pvEvidence, beforeFen, movesUci, selector)`
   - validates/replays the complete PV under the engine evidence's version/budget identity;
   - compiles one-edge rule events and separately declared hypothetical multi-edge derivatives;
   - selects a declared event, then emits actor/targets/occurrence ply/first move;
   - abstains if the PV ends, is illegal, has no eligible event, or lacks a literal stage adapter.

Neither adapter belongs in an Svelte component or LLM provider. Both produce typed evidence;
modules and presets decide presentation.

## Able-to-fail fixtures

- A known three-edge clearance line produces one recorded event and one hypothetical-horizon
  event with different projection/source identities but byte-equal chess operands.
- Passing `live.stockfish.pv@1` where `run.record.move@1` is required fails.
- A discontinuous branch/FEN window fails before detector invocation.
- A two-ply PV honestly abstains for a three-edge family.
- Replaying the same PV with a different engine budget/version changes the horizon identity even
  when the moves happen to be equal.
- A sequence event with no declared stage target remains Review/inspector evidence and cannot
  enter Guided Hint by renderer inference.
