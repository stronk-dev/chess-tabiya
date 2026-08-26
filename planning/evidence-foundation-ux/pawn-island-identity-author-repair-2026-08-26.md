# D1734/D1735 pawn-island identity — author handoff

**Inputs:** `design/research/pawn-island-transition-identity.md` and
`tools/d1734-pawn-island-identity-harness/`.

## Required contract

1. Version the count-only event to retain exact before/after island file partitions and pawns.
2. Add `topology_changed` for equal-count partition change; count gain/loss stay separate.
3. Do not emit unchanged semantic events. Current state remains a reading/on-request fact.
4. Retain both colors independently; opponent-side changes are first-class and never attributed
   only to the mover.
5. Reuse D1728/pawn connectivity as the sole pawn/file authority.
6. Preserve existing authored count conditions unless a separate schema migration changes them.
7. Keep weakness, quality, plan and style outside the source; bind D1710/D1711/D1718 and corrected
   modules before activation.

## Frozen measurements

- authored: 1,508 v1 rows; 1,472 preserved = 1,445 unchanged + 27 equal-count topology changes;
  36 count changes; changed side 39 mover / 24 opponent;
- imported: 1,158; 1,092 = 1,057 + 35; 66 count changes; 47 mover / 54 opponent.

## Able-to-fail fixtures

1. Rank-only pawn motion retains the partition and emits no v2 event.
2. `[ab]|[d] → [a]|[cd]` emits `topology_changed`, not preserved.
3. Merge and split fixtures emit count loss/gain with all affected islands.
4. Capturing an opponent pawn may emit only the opponent-color event.
5. Doubled membership changing on unchanged occupied files stays in the file-group event, not this
   topology event.
6. Any renderer assigning good/bad, weakness or a plan from count direction alone fails.
