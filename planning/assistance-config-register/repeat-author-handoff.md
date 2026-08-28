# AssistanceConfig register second return — author handoff

**State:** queued for author repair; C9 implementation remains blocked.

**Source review:** `repeat-independent-buildability-review-2026-08-28.md`

## Assigned repairs

1. **[[D2009]]/[[D2012]] — make the register historical and transitional.** Unique contiguous
   `1..head` Landed rows, pinned initialization, append-only staged/first-parent enforcement and one
   previous-state claimant bound to the next landing.
2. **[[D2010]] — name the real v5 codec authority.** Replace `validV5` with the exact
   `parseAssistanceConfig`/migration export specified by Guided Hint.
3. **[[D2011]] — state the real Guided Hint phase.** Presets wait on the D1639 owner ruling and then
   repeat review; do not claim review is already open.

## Required checkpoint

- Preserve the [[D1916]] always-equal current head/digest rule and all original extractor fixtures.
- Replace—not delete or weaken—the four arms in
  `tools/d2009-assistance-register-repeat-review/` with transition-capable author fixtures.
- `make assistance-register-contract`, `make assistance-register-repeat-review`, governance and
  `make verify` pass before fresh review.
- Do not implement C9 or transfer the v5 claim before acceptance.
