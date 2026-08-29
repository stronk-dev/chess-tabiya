# Intent-presets work log

Append-only implementation and authoring log for `rfc/intent-presets.md`.

## 2026-08-30 — returned compiler contract repaired at the authority seams

**What landed:** the author amendment for D1659–D1663 and D1437/D1500, plus
`make intent-presets-author-contract` (7 able-to-fail checks). The RFC now distinguishes unset,
explicit, migrated and invalid preferences; preserves literal named presets while exposing wider
raw configuration as Custom; compiles modules and nine legacy fields through one effect authority;
closes provider/browser availability; gives Campaign an authoritative entry/resume origin; and
splits the config checkpoint from the non-vacuous module-delivery checkpoint.

**What changed:** D1660 is owner-ruled. The other returned rows are author-amended, not closed.
No product implementation is authorised until a fresh independent buildability review accepts the
repair. Checkpoint A can never discharge the real module edge; Checkpoint B must deliver and trace at
least one real registered module item.

**Blocked/next:** fresh independent review, then implementation in the RFC's two checkpoint order.
Coordinate the exact pre/at-commit ephemeral disclosure receipt with `module-registration.md`.
