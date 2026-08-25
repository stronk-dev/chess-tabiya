# Transition event hand-off — the identities exist, but modules do not consume them

**Date:** 2026-08-26

**Feeds:** [[D630]], [[D921]], [[D1564]], [[D1568]], [[D1577]], [[D1578]],
`rfc/evidence-presentation.md` D4, `rfc/module-registration.md`, and
`rfc/tactical-collectors.md` D1.

## Question and method

Do the six lossy legacy transition readings still require six producer rewrites before board
relations can exist, or can the newer identity-preserving transition-event layer serve as the
learner/module authority while the old readings remain pack-compatible counts?

The disposable D1577 harness walks all 754 committed edges from 50 packs. On each edge it compares
`transitionReading` with `transitionSemanticFacts`:

- the five geometry families are reduced back to the old color/direction/count keys;
- the four legacy irreversibility leaves are reconstructed from the independent rule events, with
  the old `castled > last_of_role > pawn_break` priority applied only as a compatibility view; and
- every new fact is checked for the minimum literal subject or move endpoints its family promises.

`[V]` `tools/d1577-transition-event-handoff/transition-event-handoff.test.ts` and
`planning/evidence-foundation-ux/d1577-transition-event-handoff.json` at HEAD `b9cb4dac`.

## Result

The “six missing emitters” diagnosis is stale. The legacy layer remains exactly as lossy as
measured—3,373 observations, zero carrying `squares`—but the newer event layer emits 5,314 facts,
and all 5,314 retain the minimum subject/from/to identity required by their declared family. The
five geometry families reconstruct every old count on every edge. The independent rule events
reconstruct all four legacy irreversibility leaves once the legacy priority is explicitly applied.
`[V]`

This is not merely a type-level result. The corpus witnesses thirteen event families, including six
checkmates and one promotion. The geometry totals are 460 occupied-attack, 324 occupied-defence,
1,122 slider-ray, 2,719 piece-escape and 135 defended-duty facts. `[V]` Same receipt.

The correct architecture is therefore a hand-off, not a rewrite:

```text
legacy transition reading ──> pack predicates / compatibility inspector

identity transition event ──> selector ──> module ──> relation overlay / sentence
```

The old readings remain useful because authored pack predicates name their count semantics. Adding
optional `squares` to them would create a second event authority and still would not carry the
subject/edge structure needed by `relation_overlay`. Learner modules should consume the existing
event projections instead. `[V]` for the two shipped shapes; `[M]` for the routing decision.

## What is actually missing

### 1. The manifest hides renderable operands

The five `rules.transition.event.{occupied_attack,occupied_defence,slider_ray,piece_escape,
defended_duty}@1` declarations retain `subject`, `targets_before` and `targets_after`, but advertise
only `list | panel | machine_condition`. None declares `lit_squares` or `arrows`. `[V]`
`packages/runtime/src/evidence-catalog.ts:280-289`.

This is a manifest/form defect, not missing chess arithmetic. A relation adapter can mechanically
construct exact edges:

| event | literal relation |
|---|---|
| occupied attack/defence | added/removed actor square → retained target square |
| slider ray | slider square → declared endpoint, with changed blocker squares as context |
| piece escape | stationary piece square → gained/lost geometric destination |
| defended duty | defender square → gained/lost defended target |

The adapter must preserve the event's disclosed pseudo-legal/convention limitations. These edges
are factual relations, not recommendations, tactical names or requests to fill an arrow budget.
`[M]` from the literal operands and `evidence-presentation` §3.6a's construction law.

### 2. The module registry excludes the five geometry events

`module.postcommit_nudge` admits seven `TRANSITION_RULE_EVENT_FAMILIES` members and explicitly
excludes `clock_reset`; it admits zero `TRANSITION_GEOMETRY_EVENT_FAMILIES`. `module.review_map`
inherits the same nudge set. The draft then says six transition producers must be repaired before
overlays can compile, even though the excluded event projections are the repair that already
shipped. `[V]` `rfc/module-registration.md` §1.3 and §6.

Admission does not mean dumping 5,314 facts. The existing module-local selector, per-family
precedence, answer ceiling, assistance clamp and arrow budget remain mandatory. This result only
removes “producer unavailable” as the reason for excluding the five families. Usefulness and
salience are still selector/module questions. `[V]`/`[M]`.

### 3. Capture's endpoint is already present in the admitted exchange derivation

`rules.transition.event.capture@1` retains mover `from`/`to`, captured color/role and an
`enPassant` boolean, but not the captured piece's square. On en passant that square is not `to`, so
the raw event cannot own a victim overlay. The initially proposed new producer is unnecessary:
`derived.exchange.capture_class@1` is already admitted to `postcommit_nudge` and retains
`exchange.captured.square` plus `landingSquare`. The executable en-passant fixture proves victim
`d5` while the mover lands on `d6`. `[V]` `packages/runtime/src/exchange.ts:42-52,193-221`,
`packages/runtime/src/semantic-evidence.ts:427-440`, and the D1577 harness; [[D1578]].

The relation census must refuse a captured-piece overlay from raw `capture@1` and register the
capture-class adapter instead. That is a form/adapter hand-off, not a capture-v2 or new collector.

## Consequences

1. Replace `evidence-presentation` D4's six-emitter rewrite with a set-equal transition-event form
   and relation-adapter obligation; [[D1578]] pins capture overlays to the existing capture-class
   derivation and refuses raw-capture endpoint inference.
2. Add all five geometry-event ids to the post-commit nudge and Review input sets; derive totals
   from the exported family constants rather than hand-counting five.
3. Preserve legacy transition readings and pack predicate semantics. If a consumer needs the old
   priority label, derive it explicitly from independent events; do not suppress richer event facts
   at the source.
4. Keep selection/significance gates intact. Operand availability is necessary for good UX and is
   not evidence that a fact deserves to be shown.

## Verdict

Research is sufficient to amend the two presentation/module drafts. No owner ruling is needed:
[[D1564]] already requires the feature, and the measured result narrows the implementation from six
duplicate producer rewrites to one event→relation hand-off with no new transition collector.
