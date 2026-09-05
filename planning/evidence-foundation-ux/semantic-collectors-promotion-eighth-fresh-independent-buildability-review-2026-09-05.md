# Held promotion collectors — eighth fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewed artifact:** seventh author repair for the two held §3.7 promotion projections
- **Gate:** `make semantic-collectors-promotion-eighth-fresh-review`
- **Verdict:** returned on [[D2693]]–[[D2700]]; the implemented twelve projections remain unchanged

## Result

The leaf constructors repaired by [[D2650]]–[[D2654]] behave as their five tests claim. The repair
still does not make the RFC buildable because it models the leaves without the transaction that
owns their ordering and authority. `collectPromotionRaceTablebase` is absent, as are the recorded
lookup, exact legal-map resolver, shared scheduler call and operation-keyed source factory. The
author target can therefore stay green without exercising recorded-first selection, failure versus
absence, provider-off behavior, cancellation or success-only legal resolution ([[D2693]]).

The substitute provider boundary is not an exact model of the accepted dependency. A caller writes
any `sha256:` string and that value becomes the invocation identity ([[D2694]]). Local-domain and
source-failure results carry no position and cross between different FEN requests ([[D2695]]).
Even success crosses between equal-FEN requests with different normalized timeouts because only the
operation and returned FEN are checked ([[D2696]]). The RFC instead requires the scheduler's one
normalized-request digest to be calculated before `get` and compared on every returned arm.

Both tablebase source paths also stop short of their declared authorities. Recorded evidence is
minted directly from caller JSON with no validated sourcing-ledger record or source digest
([[D2697]]). The production parser accepts syntactically arbitrary move strings; the repair admits
an impossible `a7a9q` provider move although the provider RFC requires legal move identity
validation for the request FEN ([[D2698]]). The live projection is then minted by a local generic
`declareEvidence` call rather than the exact operation-keyed provider source factory ([[D2700]]).

Finally, the geometry result declares an unavailable arm that no legitimate constructor can
produce. `derivePromotionRaceGeometry` accepts only evidence, while the request accepts an unsealed
lookalike unavailable object, and no input-abstained tablebase result factory exists ([[D2699]]).
That is not a cosmetic missing test: it prevents the total operation from representing the exact
upstream-unavailable path.

## Executable evidence

The maintained target first runs all seven author/review generations and strict TypeScript, then
passes 8/8 fresh falsifiers. The controls execute malformed/crossed provider results, equal-FEN
different-timeout substitution, caller-minted recorded truth, an illegal provider move, an
unsealed unavailable arm, and the local live adapter; the transaction omission is crossed against
the exact RFC symbol and dependency vocabulary.

No production collector, provider, packet, API, schema, content, archive or protected-design byte
changed. A bounded eighth author repair must implement the exact disposable collector transaction,
consume the accepted provider/value-authority shapes rather than facsimiles, and then undergo
another genuinely fresh review. The evidence spine remains 12/14.
