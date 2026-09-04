# Review evidence compiler — second fresh independent buildability review

- **Date:** 2026-09-04
- **Reviewed:** second author repair for [[D2631]]–[[D2635]]
- **Gate:** `make review-evidence-second-fresh-review` — retained original 6/6, new 8/8 falsifiers;
  the advertised second-author target itself is red 4/5 at HEAD
- **Verdict:** **RETURNED on [[D2685]], [[D2686]], [[D2687]], [[D2688]], [[D2689]],
  [[D2690]], [[D2691]], [[D2692]]**

## Return

The revised prose now names the right authority chain, but its author model does not implement that
chain. The purported aggregate packet has no packet seal at all: an equal literal wrapper passes.
The prefix subject is only shallow-frozen, so its event head mutates without invalidating the stored
digest or renderer check.

The “total” folds receive anonymous state arrays and arbitrary family objects. They cannot detect a
duplicated/omitted path node, and an empty family record reports healthy and settled. Attempt
history exposes its internal `reserved` row as an existing value to a second caller, but models no
shared promise/subscriber completion path.

Finally, both critical integrations are regex assertions over RFC prose. The author target neither
executes `reviewPacketSourcePlan`/`compileReviewEvidence`/`assertReviewEvidencePacket` nor performs a
sealed presentation serialize/parse round trip. Missing sources and invented presentation bytes
therefore cannot make its local checks fail. Worse, the advertised target is already red at HEAD:
the live module-execution row still carries null input/assertion fields and explicitly says the
aggregate runtime seal is absent, while the author check expects the complete callable ABI.
Ordinary `make verify` does not run this target, so the stale green claim survived repository
verification.

## Required repair

Exercise one actual sealed aggregate constructor/assertion over a deeply immutable authorized
prefix; fold exact path-node and closed-family populations; model coalesced reservation completion;
and invoke the exact source-plan and presentation operations. Another genuinely fresh review must
then attack that composition. No production Review compiler, story route or UI is authorized.
