# Engine request contract implementation plan

## Objective

Implement `rfc/engine-request-contract.md` without changing historical replay:
retain UCI option contracts, make option/reset state request-scoped, publish and
enforce deployment band bounds, and record an off-window sampled move honestly.

## Ordered work

1. Add and test full UCI option parsing plus request-scoped reset/bind support.
2. Add explicit per-request engine options. Land and test `#strongEngine`'s
   MultiPV command before removing `enumerate`'s restore.
3. Add Maia band resolution, range publication/refusal, and off-window records.
4. Advance run schema to 0.15 and storage to migration 20; preserve replay bytes.
5. Update client presentation and canonical docs.
6. Run focused tests, `ENGINES_REQUIRED=1 make verify`, and the zero-retry browser gate.
7. Complete the RFC lifecycle and flip only defects actually closed. D60 remains open.

## Acceptance

The thirteen acceptance criteria in the RFC, with criterion 6 read as a
mechanism check rather than a D60 closure. The implementation order in §8 is
mandatory.
