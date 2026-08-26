# D1724 author handoff — square denial and outpost family

The exploration gate is complete in
`design/research/square-denial-and-outpost-boundary.md`. This is author input, not an accepted RFC
or implementation authority.

## Required decisions in the collector/module amendment

1. Keep `current_control`, `future_file_challenge` and `capture_migration_reach` as separate
   projections. The last two declare convention ids through D1722; neither may be called legal
   reach.
2. Split candidate square from occupied outpost. A candidate retains square/rank/support pawns and
   the exact challenge basis. Occupation adds exact piece identity and role.
3. Preserve `maximal_pawn_reach@1` as the explicit union of same-file and capture-migration reach;
   do not silently rewrite it or continue using it as the unnamed sole outpost meaning.
4. Add exact transition records for pawn-control gained/lost, occupied-piece challenge and
   current-reach overlap. The latter says overlap, never “prevents,” “forces” or “cannot use.”
5. Carry root pawn, before/after square, affected square and named enemy piece through D1711
   validation and D1718 subject-safe selection. No file/color aggregate may replace them.
6. Module eligibility follows the measured boundary: occupied-piece challenge is a candidate
   headline (3.17× / 3.23×); generic reach overlap is supporting/on-request; rare future-file
   candidate removal keeps a local denominator and no global priority from twelve positives.
7. Re-run all 23 authored `outpost` expressions in the three shape documents under each successor.
   Human author review chooses which explicit convention each claim intended. This closes the
   corrected D632 debt; no automatic truth-set migration.
8. Keep value/use separate. Piece arrival, exchange survival and strategic effect require exact
   legal/search/theory evidence and may abstain. Player-style aggregation waits on opportunity
   denominators and longitudinal storage.

## Able-to-fail acceptance fixtures

- a pinned pawn still emits current control under FIDE 3.1.3;
- a currently safe square with an adjacent future pawn challenge;
- a same-file-safe square refused only by hypothetical capture migration;
- empty candidate and occupied knight outpost produce different identities;
- unsupported and rank-out-of-range negatives;
- `h2h3` names `h3`, `g4` and an occupied Black bishop on `g4` without claiming a forced retreat;
- `a2a3` names the `b4` overlap with a Black knight's current reach without claiming illegality;
- a pawn capture changing files removes a future-file candidate;
- deleting any pawn, square, basis or piece operand fails compilation/validation;
- provider and ordinary renderer cannot widen overlap into purpose, value or advice.

## Dependency order

1. D1722 convention registry/provenance closure;
2. collector source/derived identities and migration dry-run;
3. D1711 validation plus D1718 subject selection;
4. D632 human-authored migration;
5. module/preset bindings, then bot/style/longitudinal consumers.
