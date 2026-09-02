# Module registration — seventh author repair

- **Date:** 2026-09-02
- **Input:** sixth fresh independent return [[D2505]]–[[D2508]]
- **Status:** author-repaired; another fresh independent review required
- **Boundary:** RFC, generated requirements and disposable author contract only

## Result

The repair preserves the requirements-only boundary. It does not implement a module, invoke a raw
detector/provider, or emit a final F1 binding. All 117 projection requirements and all 205
module/projection pairs remain dependency-blocked.

What changed:

- each source row now records the real declared request/result/assertion/seal boundary. Recorded
  path and Review honestly record their missing aggregate ABI members as blockers instead of
  naming invented types or assertions;
- catalogue's module-owned adapter now has a complete request/result/absence/receipt/assertion
  contract and runtime seal, while provider success carries the required operation argument and
  the operation-keyed `ProviderSourceFactory.make` step;
- `derived.compare.eval_delta@1` retains the shipped consecutive same-branch before/after meaning,
  including its `delta` and `plyOffset` output operands;
- deflection retains both authoritative positive arms: a bait capture on edge 2 or check induced by
  edge 1, followed in either case by the positive target capture on edge 3; and
- `compileModuleExactOperationResolution` is the sole owner for replacing the null exact-operation
  requirements. Its receipt must be set-equal to all 117 projection keys and all 205 pair keys and
  cannot emit while any source or presentation dependency is absent.

The candidate/recorded/Review/catalogue/provider occurrence-view vocabulary is explicitly owned by
that module resolver. The repair no longer claims those selector names are upstream candidate-packet
exports.

## Executable evidence

`make module-registration-seventh-author-repair` checks four able-to-fail boundaries. The
deflection arm uses a legal position where `Ra8+ Rg8 Rxe7` displaces a rook by check without a bait
capture; the authoritative production detector emits exactly one observation. The contract also
proves the two generated artifacts carry identical 117/205 resolution key sets and that every null
row points to the one named successor while remaining blocked.

The cumulative `module-registration-author-contract` and sixth-author checks remain green after
their expectations are corrected to the now-more-precise contract. Fresh independent review still
gates acceptance and all production implementation.
