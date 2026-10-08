# Storage backup and recovery

Implements `rfc/storage-backup-recovery.md`. Tabiya stores everything in one SQLite file
(default `data/chess-tabiya.sqlite`; `/data/chess-tabiya.sqlite` in the image). This page is the
operator procedure: backups, restore, upgrades, rollback and what each command guarantees.

## What exists

| Piece | Where |
|---|---|
| Storage lock, bundles, verification, restore, rollback, prepare-start, rehearsal, receipts | `apps/server/src/storage-admin.ts` |
| Journalled main/WAL/SHM replacement and restart recovery | `apps/server/src/storage-replacement.ts` |
| `storage-admin` CLI (`apps/server/dist/storage-admin.js` in the image) | `apps/server/src/storage-admin-cli.ts` |
| Migration-safe server startup | `apps/server/src/main.ts` |
| `/readyz` | `apps/server/src/application.ts` |
| Maintenance Compose overlays | `compose.maintenance.yaml`, `deploy/compose.maintenance.template.yaml` |
| Tests | `storage-admin.test.ts`, `storage-replacement.test.ts`, `storage-appliance.test.ts`; Docker tier `make storage-drill` |

## The storage lock

The server process holds an exclusive lock (`<data>/.tabiya-storage.lock`) for its whole
lifetime: first while it recovers any interrupted replacement, then while `prepare-start`
upgrades storage, then while it serves HTTP. There is no point at which it releases the lock
and takes it again. Every maintenance command takes the same lock. A maintenance command
against a running server therefore refuses with `MAINTENANCE_LOCKED` before it opens SQLite, and
a server will not start during maintenance. The lock is an OS advisory lock held through SQLite,
so the kernel releases it when the process dies. A leftover lock file is never treated as an
owner, and what the file contains means nothing.

## Backup bundles

A bundle is a directory named by its backup id (`YYYYMMDDTHHmmss.SSSZ-<12 hex>`) that holds
exactly `database.sqlite` and `manifest.json`. The snapshot comes from SQLite's online backup API
(`node:sqlite` `backup()`), never from copying the file, so transactions that were committed only
to the WAL are included. The snapshot is converted to a standalone DELETE-journal file. The
manifest is closed canonical JSON. It records the reason (`manual`, `pre_upgrade` or
`pre_restore`), the immutable application revision, the source and intended storage versions,
the byte count and SHA-256, the integrity and foreign-key results, and the generated
application-table inventory. The id is derived from the manifest image, so any change to the
manifest invalidates it.

Publication commits by removing a `.publishing` marker, then fsyncing the bundle directory and the
backup root. If a crash leaves a reservation, that reservation is invalid. `storage-admin` reports
it and never adopts or deletes it.

**Bundles are sensitive.** A bundle contains password hashes, sessions and every learner's data.
Tabiya does not encrypt it or keep copies anywhere else. Keeping an offline or separately
administered copy is your responsibility. A backup on the same disk does not protect you if that
disk fails.

## Commands

All commands need `TABIYA_BACKUP_DIRECTORY=<absolute host directory>`, which is mounted at
`/backup`. `BACKUP=` takes a bundle directory under that path. Storage-admin prints exactly one
JSON receipt on stdout; Make may also echo commands and next-step instructions. Exit codes:
`0` succeeded, `2` refused, `3` failed, `4` internal error.
These are storage-admin exit codes; Make itself returns nonzero when any step fails. The backup
wrapper also fails if it cannot establish or stop the running server, or cannot restart it.
A successful backup receipt still describes a valid bundle if the later restart fails; the
Compose diagnostic and wrapper failure mean service has not been restored. A failed backup still
attempts to restart a previously running server and retains the original backup failure. An
already stopped server stays stopped.

```sh
export TABIYA_BACKUP_DIRECTORY=$HOME/tabiya-backups
make storage-backup                                   # stops the server, backs up, restarts it
make storage-verify BACKUP=$TABIYA_BACKUP_DIRECTORY/<id>
make storage-restore BACKUP=…/<id> RESTORE_VOLUME=tabiya-restored   # into a fresh volume
TABIYA_DATA_VOLUME=tabiya-restored make up                          # run the restored copy
make storage-restore-replace BACKUP=…/<id> CONFIRM_DATABASE=/data/chess-tabiya.sqlite
make storage-rollback BACKUP=…/<pre_upgrade id> CONFIRM_DATABASE=/data/chess-tabiya.sqlite
make storage-upgrade-rehearsal BACKUP=…/<id>
make storage-recover
```

If you do not have Make, run
`docker compose -f compose.yaml -f compose.maintenance.yaml run --rm storage-admin <operation>`.
The operations are `backup`, `verify <bundle>`, `restore <bundle> [--replace-existing
--confirm-database <path>]`, `rollback <bundle> --confirm-database <path>`, `rehearsal <bundle>`
and `recover`. For a release install, use the downloaded `compose.maintenance.yaml`, which runs
the same image digest as `server`.

The Make maintenance commands honor `COMPOSE_FILE`, `COMPOSE_PATH_SEPARATOR`,
`COMPOSE_PROJECT_NAME` and the selected data volume. They append `compose.maintenance.yaml` from
the first selected Compose file's directory; they do not fall back to the checkout's development
overlay for a rendered source or release profile. For example:

```sh
COMPOSE_FILE=.cache/deploy/local-build/compose.appliance.yaml make storage-backup
COMPOSE_FILE=release-install/compose.yaml:release-install/compose.hosted.yaml make storage-backup
```

Keep the matching generated/downloaded maintenance file alongside those profiles. Paths containing
spaces are passed as individual arguments. The no-Make equivalent uses the same selected profile
files, then their matching maintenance overlay, before `run --rm storage-admin <operation>`.

`verify` is read-only. Its disposition is one of `current`, `upgradeable`,
`newer_than_application` (refused), `unsupported_old` (refused) or `invalid` (failed, with a
code: `DIGEST_MISMATCH`, `BUNDLE_INVALID`, `SQLITE_INTEGRITY_FAILED`, `FOREIGN_KEY_VIOLATION` or
`INVENTORY_MISMATCH`).

## Upgrades are migration-safe

When the server starts, `prepare-start` runs before HTTP opens:

- **absent or empty database**: fresh. The server creates the current schema.
- **current version**: read-only integrity, foreign-key and inventory checks, then start.
- **older version**: it writes a verified `pre_upgrade` bundle to `TABIYA_BACKUP_ROOT` (by
  default `<data>/backups`, which lives on the data volume and protects against a bad migration,
  not against losing the disk). It copies that snapshot to a staged file, migrates only the
  staged file, and checks integrity, foreign keys, inventory and migration invariants. A
  pre-existing table may change its row count only when a migration declares it
  (`MIGRATION_ROW_COUNT_CHANGES`). Only after those checks does it swap the staged file in
  through the journalled replacement.
- **newer version, or v0 with tables**: refused before WAL mode, schema creation or migration.
  The server exits `2` and never listens.

A failed migration leaves the live database byte-identical and the pre-upgrade bundle in place,
and the server does not start. The HTTP process itself opens only a fresh database or one at the
exact current version. Compatibility is derived from the migration chain
(`STORAGE_COMPATIBILITY`), so a new migration automatically extends `upgradesFrom`, and the
historical table inventories are generated from the same migration code.

## Rollback to the prior release (last known good)

A newer release cannot be read by an older image. To go back:

1. Stop the new release.
2. `make storage-rollback BACKUP=<the pre_upgrade bundle the upgrade printed> CONFIRM_DATABASE=/data/chess-tabiya.sqlite`.
   This first saves the current (upgraded) database as a `pre_restore` bundle, which you can use
   to roll forward later. It then installs the bundle's bytes unchanged, with no migration. The
   receipt's `compatibleApplicationRevision` names the release that wrote them.
3. Start that prior release image. Starting the new release again would simply upgrade the
   database again.

Anything written after the upgrade is only in the `pre_restore` bundle.

## Replacement and crash recovery

Restore, rollback and upgrade install bytes only through `replaceSqliteTriplet`. The primitive
first quarantines the exact old `main`/`-wal`/`-shm` into `<data>/.tabiya-replacement/`. It then
installs the standalone new main, verifies it, and fsyncs before it commits the `verified` journal
generation. Every journal generation is written to a temp file, fsynced, renamed and then the
directory is fsynced. Every mutation between two generations is a single rename. After a crash,
the next server start or maintenance command reconciles the files on disk against the committed
generation and its one successor. Recovery keeps the new bytes only if `verified` was durable, and
otherwise restores the exact old triplet. Anything it cannot attribute fails with
`REPLACEMENT_RECOVERY_REQUIRED` without opening SQLite. In that case, keep the directory and your
bundles, then restore a verified bundle into a fresh volume.

## Restore rules

Restoring into a fresh path or volume is the recommended workflow. Replacing an existing database
requires the bundle path, `--replace-existing`, a `--confirm-database` value equal to the resolved
live path, and a successful `pre_restore` backup. If the live database is corrupt, that backup
cannot succeed, so move the corrupt file aside or restore into a fresh volume instead. Restore
keeps every identity byte-for-byte (learners, runs, classrooms, repertoires, registered packs) and
checks this before installing. An `upgradeable` bundle is migrated in the staged copy under the
same invariants as startup.

`storage-upgrade-rehearsal` restores a bundle into a disposable database inside the maintenance
container. It starts the real application on that database, requires the canonical `/readyz` body
`{"representativeData":"ok","status":"ready","storageVersion":N}`, and then deletes the disposable
state. It never touches the configured database.

The live readiness route also reads the actual web shell through the static-serving authority.
Missing or unreadable shell bytes make it unready; worker and storage are rechecked after that
asynchronous read. The successful canonical storage body is unchanged. Shell restoration
recovers readiness without a server restart.

## Verification

- `make storage-maintenance-wrapper-check` executes all seven actual Make maintenance commands with a
  test-only Docker executable: running/stopped service, probe/stop/backup/restart failures,
  selected source/release profiles and project/volume preservation. It does not touch an operator's
  deployment or replace the native SQLite/image recovery proof below. These process tests also
  run in the ordinary software tier through `release-policy-check`.
- `make storage-recovery-check` adds the native SQLite backup/restore, bundled CLI/server and
  replacement crash-recovery tests to those wrapper controls.
- `make test-software` covers the unit tier, the process boundary (bundled `main.js` with its
  worker thread and the `storage-admin.js` CLI), and the replacement crash matrix.
  The fixtures cover WAL-only backups, every verifier refusal, read-only preflight of a newer
  database, every historical version upgrading through a pre-upgrade bundle, injected migration
  and invariant failures, guarded replacement, an upgrade from the prior release followed by a
  rollback, publication crashes, lock exclusion across processes, and a crash at every replacement
  fault point with recovery itself crashed.
- `make storage-drill` runs against the built image: cold boot, restart, lock refusal, backup and
  verify, restore into a fresh volume and boot, rehearsal, and guarded replacement.
