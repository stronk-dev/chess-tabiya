# account_data capability — implementation receipt (2026-09-24)

Roadmap row `account_data` (no dedicated RFC; builds on the implemented
`rfc/archive/portable-account-data.md`). Built by claude at the owner's direction to build directly.
Canonical description: `docs/account-data-lifecycle.md` (§What Tabiya has recorded, §Import).

## What landed

| roadmap gap | what now exists | where |
|---|---|---|
| export coverage for today's object classes | Audited: longitudinal observations/denominators/structure/jobs and concept rows (registered + legacy) already export; evidence-job tables are deliberately excluded run-owned operational state; learner-profile reads persist nothing (projections over the exported tables); bot decisions have no table (they live in the exported run event stream). **One real export defect fixed:** `repertoires.original_pgn` (BLOB) exported as an index-keyed object of byte values because node:sqlite returns `Uint8Array`, not `Buffer`; it now exports as its UTF-8 text | `apps/server/src/storage.ts` `accountBundle` |
| full export round-trip | export → canonical bytes → import into a fresh installation → re-export equals the source on every restored class; a second installation fed the re-export reaches the same fixed point | `apps/server/src/account-import.test.ts` |
| account-level import | `POST /auth/import-preview` (no password, read-only) and `POST /auth/import` (password); 32 MiB bounded body read after authentication; restores the private record, re-derives position stats and longitudinal projections, refuses any collision atomically | `apps/server/src/account-import.ts`, `storage.ts#restoreAccountBundle`, `identity.ts`, `rest.ts` |
| portability versioning | `ACCOUNT_BUNDLE_UPGRADES` / `ACCOUNT_BUNDLE_READABLE_VERSIONS`; future versions refused with `ACCOUNT_IMPORT_UNSUPPORTED_VERSION` and the readable set | `account-import.ts` |
| multi-user isolation tests | two learners' exports disjoint; inventories count own rows only; bob importing alice's file conflicts and moves nothing; deleting alice leaves bob byte-identical; alice's file restores into a new account after her deletion | `account-import.test.ts` |
| twelve-class inventory | `GET /auth/account-inventory` projected from `ACCOUNT_DATA_INVENTORY` and counted from the export bundle; *What Tabiya has recorded* table with export/deletion fate derived from dispositions | `account-data.ts#accountInventory`, `AccountInventoryPanel.svelte`, `account-inventory-copy.ts` |
| download progress | exact `Content-Length` on export; streamed read with received/total bytes and a `<progress>` bar | `rest.ts`, `api.ts#exportAccount`, `AssistanceSettings.svelte` |
| import conflicts (experience) | file → preview (would add / not imported with reasons / collisions) → password only when conflict-free | `AccountImportPanel.svelte` |

The longitudinal source-mutation census gains one row, `SQLiteRunStorage#restoreAccountBundle`
(`effect: always`), because restore writes run snapshots inside its own `BEGIN IMMEDIATE`.

## Choices made that the owner may veto

- **Restore boundary.** Only the learner's private record is restored. Grants to others, shared runs,
  publications, live/social/classroom rows and ratings/standings/earned marks are counted in
  `notRestored` with a reason rather than recreated — the first because they involve other people, the
  last because they are installation-attested measurements a learner could otherwise fabricate by editing
  a file.
- **No merge.** Any colliding identity refuses the whole import (409). Re-importing into the same
  installation is therefore refused, not deduplicated.

## Needs an owner decision (not built)

- **Guest accounts and guest-to-account claim.** Unbuilt. Whether a person may play before creating an
  account is `ux-arrival-and-start.md` O-A2, reopened by `design/research/ux-import-and-account.md` §4 and
  explicitly left undecided by [[D1485]]; `design/02-product-shape.md:101-103` still records scoped
  tokens as the only anonymous access. A claim path is only meaningful after that ruling.
- **The twelve learner-facing class names.** The section and its mechanics shipped; the nouns in
  `apps/web/src/lib/account-inventory-copy.ts` are provisional plain descriptions pending the wording
  ruling the UX index routes to the owner (IMP-b9 / T20).

## Still open on the roadmap row (not in this commission)

Backup/restore/update/rollback of the installation (F12 / `storage-backup-recovery.md`), first-run
account timing, password recovery, shared-link and future-schema fixtures.
