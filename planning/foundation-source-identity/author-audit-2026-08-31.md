# Foundation source identity — author audit return

This is an adversarial author-side audit, not the fresh independent review required for
acceptance. It rechecked the first D1736 author pass against its nine handoffs, the proposed
semantic-convention register and the literal 23-row projection plan. Five contradictions make the
current draft unbuildable without an implementer choosing semantics.

## Verdict

Return the draft on [[D2390]]–[[D2394]]. Preserve the evidence-family scope, schema reservations,
law-8 boundary and source→value→operation→validation→consumer staging. Repair the authority and
grain algebra before asking an independent reviewer to evaluate it.

## Findings

1. **[[D2390]] — one `authority` scalar represents incompatible things.** The plan puts source
   projections (`pawn-connectivity`, exact legal mobility), semantic conventions and composition
   conventions in one string. It therefore cannot represent the backward-pawn legal consequence,
   whose normative text requires backward-pawn identity plus `legal-exchange@1`. The prose names
   twelve future convention refs, not eight. `king-opposition-unobstructed@2` and
   `backward-pawn@2` are new base ids absent from the 39-member seed, while the register requires a
   new base id to start at `@1`.
2. **[[D2391]] — clock bytes cannot come from a board edge.** `edge` contains only FEN/move/FEN;
   the clock item requires a recorded event, actor, decision, two readings, control and phase.
   Caller-written extras are explicitly forbidden. The source must be a recorded event/prefix
   receipt and must remain unavailable until the returned recorded-clock contract supplies it.
3. **[[D2392]] — operation ownership contradicts the normative routing rule.** The two fianchetto
   position rows point at `recorded-semantic-path`; §5 sends every position row to the shared
   candidate operation. A reusable position fact and a reached-in-game occurrence are different
   projections and cannot share an ambiguous owner.
4. **[[D2393]] — the style transfer lost attribution.** Its handoff requires every atom to retain
   actor and decision class so imported/opponent/coach facts do not enter learner history. Bare
   position and candidate grains contain neither. The repair must add a recorded occurrence or an
   exact contextual receipt instead of letting a longitudinal consumer infer ownership.
5. **[[D2394]] — two successor event state machines are partial.** A king or backward pawn can
   move while the named relation remains true. Opposition offers only gained/lost while promising
   an event for unequal exact readings; backward pawn gives no total sign/cardinality rule. The
   author must choose and fixture one complete transition algebra.

## Required next pass

- replace `authority` with typed, set-valued source dependencies and convention closure;
- publish the exact valid future convention-member claim after the register/provenance landing;
- add authenticating run-event grains for recorded facts;
- split board facts from recorded occurrences where attribution requires it;
- make the checked operation owner a function of the declared grain; and
- enumerate every `(absent|present) × (absent|present)` and truth-preserving identity transition
  for successor events.

`make foundation-source-author-audit` pins all five findings against current bytes. The repair must
replace those negative witnesses with positive author criteria; the later independent reviewer
must rederive them rather than trusting this document.
