# Shared candidate packet — second repeat author repair

**Date:** 2026-08-28

**Input:** `shared-candidate-packet-second-repeat-author-handoff.md`; [[D1958]]–[[D1961]]

**Status:** author checkpoint only; fresh independent buildability review required.

## The landing decision

The owner has repeatedly ruled the evidence foundation first because packs, analysis, Support,
Review and bots all depend on it. The honest consequence is not to call a verification CLI a
product consumer. The packet may land as a deliberately unconsumed lower primitive, while the 1.0
roadmap and D9/D10 continue to report all product consumption as missing. Implementing this RFC
alone cannot complete a Support, Review or bot feature.

## Technical repair

- A module-private `WeakMap<CandidatePopulationReceipt, References>` is now the runtime receipt
  authority. The private constructor records exact packet/legal/event/reading references; the
  exported assertion checks them. A structural type or `unique symbol` is never treated as proof.
- Wide→narrow projection first asserts the wide receipt, retains the permitted exact references,
  builds a new frozen packet/id and mints a distinct receipt through the same private constructor.
- The compiler no longer wraps one synchronous `localSemanticEvents` turn. It runs code-derived
  collector groups, awaits an injected portable macrotask yield after every group and checks the
  internal signal around every yield and before publication. Last-waiter abort discards all partial
  work; two-waiter cancellation remains shared correctly.
- Move convention and compiler version retain their exported literal types. A generated literal
  projection→reason map is set-equal to the scoped declarations and produces the only admissible
  abstention union.

## Executable author evidence

`make candidate-packet-contract` passes 11 runtime/source controls plus three crossed TypeScript
controls. It rejects forged/equal receipts, proves a projected receipt is newly recognized while
retaining member references, cancels after the first in-work yield, records zero product consumers,
and rejects wrong convention/version/projection-reason pairs.

The old `make candidate-packet-repeat-review` instrument is retained as the negative return control
and was verified red on all four returned assumptions after the amendment. That is author evidence,
not independent acceptance.

No production, schema, pack, content or protected intent byte changes in this author pass.
