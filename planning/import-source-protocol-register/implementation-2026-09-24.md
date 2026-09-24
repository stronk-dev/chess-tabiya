# import-source-protocol-register — implementation receipt (2026-09-24)

Implemented by claude at the owner's direction to build ready RFCs without review rounds (the fresh
review the draft required was not run). Prerequisite for `rfc/live-sources.md`.

## What landed

- `packages/runtime/src/import-source-protocol.ts` — the present source: literal tuple
  `IMPORT_SOURCE_PROTOCOL_MEMBERS` (`request_lichess`, `request_pgn`, `source_lichess_url`,
  `source_pgn_paste`) and the derived faces `ImportSourceRequestKind`/`ImportSourceKind`,
  `IMPORT_SOURCE_REQUEST_KINDS`/`IMPORT_SOURCE_KINDS`, `isImportSourceRequestKind`/`isImportSourceKind`.
  Created before the catalogue row, so absent-source admission ([[D3082]]) is not needed.
- `rfc/shared-resource-registers.json` — one `import-source-protocol` row, `members` over the existing
  `string_tuple` reader. No checker logic changed.
- `rfc/README.md` — `## Import-source-protocol register` (`members=4`), four Landed rows crediting
  `archive/game-import-and-story.md` at the commits that shipped them (`912af997`, `9477316d`), and one
  Live claim for `live-sources.md`.
- `rfc/live-sources.md` — claims `import-source-protocol | members request_broadcast,
  source_lichess_broadcast`; the §1 lane wording is corrected in place with a dated note.
- Derivation of the [[D2278]] copies: server `ImportSource`/`ResolvedImportSource.sourceKind`, storage
  `ImportedGameRecord.sourceKind`, web `ImportedGameRecord.sourceKind`/`ImportGameRequest.source`.
- [[D959]] fixed: the paste arm of `resolveImportSource` is bounded to the shared 64 KiB
  (`IMPORT_PGN_MAX_BYTES`) and re-serialized through `stripPgnAnnotations`; licence note says
  `annotations stripped`. The import disclosure copy (`App.svelte`), `docs/game-import-and-story.md` and
  `docs/account-data-lifecycle.md` now say comments/evaluations/annotations are removed. Account import
  re-strips imported-game PGN on restore, so an older download cannot reintroduce them.

## Genuine RFC defect corrected inline

The draft's descriptor (`sequential/canonical_resource@1/absent`, `whole_projection`, `first lane 1`)
names vocabulary the implemented bootstrap does not have — the same defect `provider-protocol-register.md`
corrected today. Replaced by the implemented `members`/`string_tuple` shape. Deviation from that precedent:
the tuple is seeded with the four shipped members rather than introduced empty, because they already ship
and the copies can derive from the tuple now; `live-sources.md` then claims only what it adds.

## Tests

- `apps/server/src/import-source-protocol.test.ts` (5): tuple grammar and faces; the running
  `imported_games` CHECK equals the `source_` face; the REST parser admits every `request_` member and
  refuses `broadcast`; a paste resolves and stores with no comment/eval/clock/arrow/NAG/glyph.
- `tools/register-check.test.mjs`: catalogue now ten rows; new test — seeded tuple derives, the exact
  live-sources claim passes C1, a second claimant collides in C3, a lane claim / hyphenated member /
  renamed resource fail, and the committed live-sources block carries the claim.
- `tools/d2277-live-sources-author-repair/contract.test.mjs`: D2278 assertion updated to the corrected claim.

## Not done here

- `rfc/README.md` Active row flip, `design/BACKLOG.md` rows ([[D959]], [[D2278]]) and the
  `planning/exploration/log.md` entry: left to the consolidating session by instruction.
- Records imported by paste before this fix may still hold annotations in `imported_games.pgn`; no
  backfill migration was written (it would claim a migration position). Restore strips them; the live
  row does not change until then.
