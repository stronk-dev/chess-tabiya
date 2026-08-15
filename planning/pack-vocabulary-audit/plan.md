# Pack vocabulary integrity audit

Status: complete

## Scope

Audit the current drill-pack vocabulary without designing or implementing its fixes. The evidence instrument covers the current schema, runtime evaluators, all committed draft packs, and all committed shape entries.

## Steps

- [x] Inventory every schema constant, objective type, success-condition kind, deviation class, structural-expression kind, structural-feature kind, policy mode, and authoring refusal code.
- [x] Trace each item from declaration to evaluator and count authored uses.
- [x] Replay every pack spine, evaluate authored conditions over pack-local and synthetic positions, and distinguish proven constants from empirical non-firing conditions.
- [x] Record declared/executable mismatches in both directions and validation/play-path divergence.
- [x] Rank findings for the four in-flight RFCs without editing those RFCs.
- [x] Run both verification gates at zero browser retries.

## Non-goals

- No authored chess-content changes.
- No RFC or design edits.
- No new vocabulary or evaluator design.
