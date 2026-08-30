# RFC: Storage backup, restore, upgrade, and recovery

- **Status:** **draft — RETURNED by fresh independent buildability review 2026-08-30 on
  [[D2210]]–[[D2213]].** The verified-bundle/staged-recovery model survives, but startup lock
  ownership is contradictory, staged upgrade omits WAL/SHM quarantine, backup-id derivation is
  undefined, and the closed CLI receipt has no type. `make storage-backup-fresh-review` passes 4/4.
  Implementation remains unauthorized.
- **Author:** Codex on the owner's O13 Choice-C ruling
- **Created:** 2026-08-27
- **Design refs:** `design/02-product-shape.md` deployment axis; `design/03-product-breadth.md` B8
- **Exploration gate:** O13 / D616 selected the stronger appliance floor; R18/F12-C measured and routed D608 as ready to draft
- **Depends on:** `rfc/archive/portable-account-data.md` for the exhaustive application-table inventory
- **Parent / amends:** current SQLite startup and migration behavior in `apps/server/src/storage.ts`
- **Supersedes / superseded by:** —
- **Planning:** `planning/storage-backup-recovery/` (once implementing)

```tabiya-claims
none
```

## Summary

Tabiya 1.0 supports a recoverable SQLite appliance rather than merely mounting a durable volume.
This RFC defines one server-owned storage administration path for verified backup bundles, guarded
restore, automatic pre-upgrade snapshots, migration compatibility, and failed-upgrade recovery.
Normal HTTP startup may listen only after storage preflight succeeds. Manual operations are exposed
through the shipped server image, Compose, and Make targets, so the documented procedure exercises
the same bytes operators deploy.

The implementation uses Node 24's `node:sqlite` online backup API over a quiesced source. It does
not copy a live database file and hope that WAL/SHM state happens to agree. SQLite's online backup
API produces a consistent snapshot of a live source, and Node's `backup(sourceDb, path)` exposes
that API without another native dependency:

- <https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html#sqlitebackupsource-db-path-options>
- <https://www.sqlite.org/backup.html>

## Motivation

R18 verified that the named volume survives restart and that startup automatically migrates an old
database. It also verified that the repository has no supported backup, restore, pre-upgrade
snapshot, rollback, or failed-migration procedure. `SQLiteRunStorage` currently enables WAL and
creates `drill_runs` before it checks `PRAGMA user_version`; consequently the HTTP process is also
the migration tool and can touch storage before rejecting a future schema. D608 records this exact
gap.

Durability is not recoverability. A volume protects against container replacement, but not a bad
migration, accidental deletion, corrupt media, operator error, or rollback to an earlier image.
The 1.0 appliance floor therefore needs a procedure with able-to-fail checks and a last-known-good
path. A successful command is insufficient unless the result can be independently verified and
restored.

### Scope

This RFC owns:

1. a versioned, closed backup-bundle manifest;
2. backup creation and verification;
3. restore to an empty database path and guarded replacement of an existing path;
4. storage inspection before any application write;
5. automatic pre-upgrade backup and migration receipts;
6. explicit read/create/upgrade/refuse compatibility;
7. Make, Compose, image, documentation, and CI recovery drills.

### Non-goals

- high availability, replication, point-in-time recovery, or zero-downtime upgrades;
- a hosted backup scheduler, retention daemon, remote object-store client, or encryption/key
  management;
- user-level account-bundle import (the portable account bundle is not an appliance backup);
- merging two installations or changing learner/run identities during restore;
- downgrade-reading a database after a forward migration;
- promising recovery from host or backup loss when the operator kept no external copy.

## Specification

### 1. Storage paths and quiescence

The production database remains one explicit path, normally
`/data/chess-tabiya.sqlite`. The backup root is a different explicit mount, normally `/backup` in
the maintenance container. The command refuses:

- `:memory:`;
- a database path or backup root that does not resolve to an absolute path in production mode;
- a backup destination inside the database's containing directory;
- source and destination resolving to the same inode;
- an unresolved glob, directory traversal outside the configured roots, or symlink that escapes
  either root.

Manual backup and every restore require the HTTP server to be stopped. Both the server entry point
and the maintenance entry point acquire the same non-blocking OS advisory lock under `/data` with
`flock`; the server wrapper holds it for the complete `prepare-start` + HTTP-process lifetime, while
the maintenance wrapper holds it for the complete operation. A live server therefore makes the
maintenance command fail before SQLite opens, and a live maintenance operation makes server start
fail. Process exit releases the kernel lock, so a stale lock-file pathname after a crash is not a
false owner. The image installs the exact minimal package providing `flock`, and a production-image
fixture proves mutual exclusion in both directions.

The shipped Compose workflow runs a one-shot `storage-admin` service that shares `/data` but never
starts the HTTP process. The lock file records only diagnostics (operation, PID, start time, release
revision); file contents are not lock authority.

The source may retain `-wal` and `-shm` files after shutdown. Backup opens the source through
SQLite and invokes `node:sqlite.backup`; it never performs a raw `copyFile` of the source triplet.
The resulting backup is a standalone database in default journal state. A source-side checkpoint
is optional diagnostics, never the mechanism that makes a file copy safe.

### 2. Closed backup bundle v1

A published bundle is a directory with exactly these two files:

```text
<backup-id>/
  database.sqlite
  manifest.json
```

`manifest.json` is canonical UTF-8 JSON with sorted object keys, a trailing newline, and this
closed shape:

```ts
interface StorageBackupManifestV1 {
  readonly format: "tabiya-storage-backup";
  readonly formatVersion: 1;
  readonly backupId: string;             // UTC basic timestamp + 12 lowercase hex digest chars
  readonly createdAt: string;            // canonical UTC ISO-8601
  readonly reason: "manual" | "pre_upgrade" | "pre_restore";
  readonly applicationRevision: string; // immutable image/source revision, never "latest"
  readonly sourceStorageVersion: number;
  readonly intendedStorageVersion: number;
  readonly database: {
    readonly file: "database.sqlite";
    readonly bytes: number;
    readonly sha256: string;
  };
  readonly sqlite: {
    readonly integrityCheck: "ok";
    readonly foreignKeyViolations: 0;
  };
  readonly inventory: {
    readonly applicationTables: readonly string[]; // sorted, set-equal to the compiled inventory
    readonly inventorySha256: string;              // canonical table-name array, not learner data
  };
}
```

`applicationRevision` is the full source Git SHA embedded as an OCI revision label and build-time
constant in the server image. The implementation must not use the package's present `0.0.0`
placeholder or a mutable release tag as recovery identity. Development builds use
`dev+<full-git-sha>` when a source SHA is available and `dev+dirty` otherwise; `dev+dirty` bundles
verify mechanically but are explicitly not eligible as release recovery evidence.

`formatVersion` versions the operator artifact local to this RFC. It is not a shared-resource
register claim: one server package owns its parser and writer, it is not embedded in `schemas/`,
and no parallel RFC may change it. A later cross-package or independently claimed format must open
a register before changing this statement.

The bundle contains credentials and all persisted learner data. Documentation labels it sensitive,
requires operator-controlled filesystem permissions, and states that this RFC provides no
encryption or remote retention. The tool creates files with owner-only permissions subject to a
more restrictive umask.

### 3. Backup state machine

`storage-admin backup` performs these ordered steps:

1. resolve and validate all paths, acquire the maintenance lock, and inspect the source read-only;
2. refuse storage version `0`, a version greater than `STORAGE_VERSION`, or a missing application
   table inventory; an absent database is `NO_DATABASE`, not an empty successful backup;
3. create `<backup-id>.partial/` with owner-only permissions;
4. open the source read-only and run `backup(source, partial/database.sqlite)`;
5. open the snapshot read-only and require `PRAGMA integrity_check` to return exactly one `ok` row;
6. require `PRAGMA foreign_key_check` to return zero rows. `integrity_check` alone does not test
   foreign-key constraints (<https://www.sqlite.org/pragma.html#pragma_integrity_check>);
7. require the snapshot's `user_version` and application-table set to agree with the canonical
   inventory for that exact historical storage version; for the current version that inventory
   must also be set-equal to `ACCOUNT_DATA_INVENTORY`;
8. close SQLite handles, compute byte length and SHA-256, write canonical `manifest.json`, then
   parse and verify the bundle through the public verifier;
9. atomically rename the partial directory to `<backup-id>/` on the same filesystem.

No valid backup path exists before step 9. Failure closes handles, releases the lock, leaves the
source untouched, and retains or removes only the explicitly named `.partial` directory. Verifiers
always reject `.partial` paths, extra files, symlinks, non-canonical manifests, unknown keys, and
unknown format versions.

Backup creation never runs migrations. A v24 source produces a v24 backup even when the command is
provided by the v25 image.

### 4. Verification

`storage-admin verify <bundle>` is read-only. It checks:

- the exact directory/file set and manifest grammar;
- manifest path confinement and no symlinks;
- database byte length and SHA-256;
- `PRAGMA integrity_check = ok` and zero `foreign_key_check` rows;
- `user_version === sourceStorageVersion`;
- sorted application tables and inventory digest;
- compatibility with the executing image.

The output is one closed JSON receipt on stdout; diagnostics go to stderr. The receipt states
`valid`, bundle/release identities, source/current versions, and one compatibility disposition:

- `current` — may restore and start without migration;
- `upgradeable` — may restore and migrate through the complete declared chain;
- `newer_than_application` — intact but refused by this image;
- `unsupported_old` — intact but no complete migration chain exists;
- `invalid` — bundle, SQLite, digest, or inventory check failed.

The command exits non-zero for the final three dispositions. It never rewrites the bundle.

### 5. Compatibility contract

Every image exports one compiled `StorageCompatibility` next to `STORAGE_VERSION`:

```ts
interface StorageCompatibility {
  readonly creates: number;
  readonly reads: readonly number[];
  readonly upgradesFrom: readonly number[];
  readonly tableInventorySha256ByVersion: Readonly<Record<number, string>>;
}
```

At this RFC's HEAD baseline, the values are `creates: 25`, `reads: [25]`, and
`upgradesFrom: [1..24]`. Version `0` means an absent/fresh database and is creation input, not a
restorable backup version. The historical table inventories are generated by applying the canonical
migration chain to an empty disposable database up to each supported target version; they are not
hand-maintained guesses and do not claim that today's privacy inventory existed in v1. The build
embeds their canonical digests, and verification reconstructs/compares the expected table-name set
for the source version. For the current version, a separate set-equality check binds that set to
`ACCOUNT_DATA_INVENTORY`.

A migration changes this declaration in the same commit and a set-equality test proves
`upgradesFrom` matches the contiguous implemented migration chain and every member has one generated
inventory. An image may read only the exact current version unless a test fixture explicitly earns
another member.

The release artifact publishes this matrix alongside the image digest. A database newer than
`creates` is rejected by read-only preflight before WAL mode, schema creation, or migration code.
An unsupported-old database is rejected the same way.

### 6. Production startup and automatic pre-upgrade snapshot

The image entry point becomes:

```text
storage-admin prepare-start --database "$DATABASE_PATH" --backup-root "$TABIYA_BACKUP_ROOT"
node apps/server/dist/main.js
```

`prepare-start` owns disk migration. `main.js` then opens only an absent database or the exact
current storage version; it no longer discovers an old on-disk database and migrates it while
starting HTTP.

For an absent database, `prepare-start` creates nothing and `main.js` creates the current schema.
For the current version, it performs read-only integrity, foreign-key, and inventory checks and
returns. For an upgradeable version it:

1. acquires the storage lock and proves no HTTP process is active;
2. creates and verifies a `pre_upgrade` bundle whose intended version is the image's current
   `STORAGE_VERSION`;
3. copies that verified snapshot to a same-filesystem staged database;
4. applies the production migration chain to the staged database only;
5. checks current `user_version`, integrity, foreign keys, application inventory, and every
   migration-specific data invariant;
6. closes all handles and atomically installs the staged database as the live database, retaining
   the original bytes in the verified pre-upgrade bundle;
7. emits a closed migration receipt naming source version, target version, backup id, release
   revision, and the checks performed.

Migration-specific invariants are part of each migration definition. At minimum every migration
declares which tables may be added, removed, rebuilt, or change row count. All other tables must
retain row count. Run-schema rewrite migrations additionally parse every rewritten snapshot and
prove run id, branch ids, event ordering, and session digest remain valid. A migration without a
declared invariant cannot join the chain.

The live database is never the migration work surface. Any migration or verification failure leaves
the original live path untouched, does not start HTTP, preserves the pre-upgrade bundle, and prints
the exact recovery command. Repeated startup may create another uniquely named pre-upgrade bundle;
it may not overwrite the first or silently continue from the failed staged file.

### 7. Restore

Restore is deliberately destructive and never implicit. The recommended workflow restores into a
fresh named volume. Replacing an existing database is also supported, but requires all of:

- an exact bundle path;
- `--replace-existing`;
- `--confirm-database <absolute-live-path>` whose value exactly equals the resolved target;
- successful creation and verification of a `pre_restore` backup of the current database.

The server must be stopped. Restore first verifies the immutable source bundle. It then copies the
bundle database to a same-filesystem staged path, migrates the staged copy when the disposition is
`upgradeable`, and repeats integrity, foreign-key, inventory, version, and migration-invariant
checks. Only after those checks does it atomically install the staged database. Stale target
`-wal`/`-shm` files are quarantined with the replaced database and are never attached to restored
bytes.

On any failure before the atomic install, the existing target is unchanged. On a failure after the
install but before the application becomes ready, the documented recovery is to stop the new image,
restore the `pre_restore` bundle, and start the image declared compatible with that bundle. The tool
does not claim that an older image can read a forward-migrated database.

Restore preserves database identities byte-for-byte before any required forward migration. It does
not re-key accounts, runs, public tokens, classroom relationships, or ratings. A production drill
must prove that representative identities and data from every `ACCOUNT_DATA_INVENTORY` class remain
reachable after backup, mutation, restore, and restart.

### 8. Operator surfaces

The built server image contains the storage-admin executable and its exact runtime dependencies.
The repository and rendered release artifacts provide a maintenance Compose overlay with the same
image digest as `server`, `/data` mounted read-write, `/backup` mounted read-write, no network port,
no engine dependency, and `restart: "no"`. Keeping the maintenance mount in an overlay means normal
startup does not fail on a missing backup setting. Invoking a maintenance command requires an
explicit absolute `TABIYA_BACKUP_DIRECTORY`; the wrapper refuses an unset/relative path rather than
defaulting backups into the application checkout. Documentation gives one copy-paste setup command
and explains that the operator still owes an offline or separately administered copy.

The supported commands are:

```text
make storage-backup
make storage-verify BACKUP=<bundle-directory>
make storage-restore BACKUP=<bundle-directory> RESTORE_VOLUME=<fresh-volume>
make storage-restore-replace BACKUP=<bundle-directory> CONFIRM_DATABASE=/data/chess-tabiya.sqlite
make storage-upgrade-rehearsal BACKUP=<bundle-directory>
```

Make targets are thin, asserted wrappers around the Compose maintenance service; they do not
reimplement backup logic. They validate required variables before invoking Docker and print the
equivalent `docker compose` command in documentation for installations without Make. The default
host backup directory is explicit and gitignored. No pre-push hook runs a destructive or
environment-dependent recovery drill.

`storage-upgrade-rehearsal` creates a disposable volume, restores the named bundle, starts the
candidate image through `prepare-start`, waits for readiness, checks representative data, and
destroys only its exact generated project/volume after the result is recorded. It never touches the
configured production volume.

### 9. Failure taxonomy and observability

The CLI uses a closed code vocabulary:

```text
NO_DATABASE
MAINTENANCE_LOCKED
PATH_REFUSED
BUNDLE_INVALID
DIGEST_MISMATCH
SQLITE_INTEGRITY_FAILED
FOREIGN_KEY_VIOLATION
INVENTORY_MISMATCH
STORAGE_NEWER_THAN_APPLICATION
STORAGE_TOO_OLD
BACKUP_FAILED
MIGRATION_FAILED
RESTORE_CONFIRMATION_REQUIRED
RESTORE_FAILED
```

Every command emits a single terminal result with operation id, release revision, versions,
non-secret paths, elapsed time, and code. It never logs manifest contents, learner data, password
hashes, sessions, or token values. `/healthz` is not reachable until `prepare-start` succeeds;
readiness after restore proves the exact current schema and storage checks, not merely an open TCP
port.

### 10. Code-site inventory

The unit in this table is a production or verification boundary that must consume the contract.
There are **12 boundaries**; acceptance criterion 12 derives the same set from declared anchors and
fails on a missing or duplicate consumer.

| # | Boundary | Required change |
|---:|---|---|
| 1 | `apps/server/src/storage.ts` | split read-only inspection/current-only open from migration; export compatibility and migration invariants |
| 2 | `apps/server/src/storage-admin.ts` | implement backup, verify, prepare-start, restore, receipts, and closed failures |
| 3 | `apps/server/src/main.ts` | refuse an unprepared old/future database before creating the HTTP application |
| 4 | `apps/server/package.json` | build/run the admin entry point from the shipped package |
| 5 | `apps/server/Dockerfile` | install the storage-lock primitive, hold it across preflight + HTTP, and include the admin executable/build revision |
| 6 | `compose.yaml` | development maintenance service and backup mount |
| 7 | `deploy/compose.release.template.yaml` | digest-identical release maintenance service and backup mount |
| 8 | `Makefile` | thin backup/verify/restore/rehearsal targets |
| 9 | `.gitignore` / packaging checks | exclude local backups and refuse their inclusion in images/artifacts |
| 10 | `.github/workflows/verify.yml` | native recovery contract tier using committed fixtures |
| 11 | `.github/workflows/release.yml` | image/Compose upgrade-rehearsal smoke for both published architectures or declared emulation |
| 12 | `docs/storage-backup-and-recovery.md` | operator procedure, compatibility, retention responsibility, and last-known-good recovery |

## Deviations from design

None. O13 requires a supported backup/restore/upgrade appliance path. This RFC narrows “quiesced
SQLite backup” to a stopped HTTP service plus SQLite's online backup API rather than raw file copy,
and makes rollback mean restoration of verified old bytes with the compatible old image. It does
not weaken the appliance floor or claim downgrade reads.

## Acceptance criteria

### Fresh independent return (2026-08-30)

Exact return:
`planning/storage-backup-recovery/fresh-independent-buildability-review-2026-08-30.md`.
Before criteria 1–17 are buildable, the author must:

1. assign the advisory lock to one parent process/open-file description and specify exact FD
   inheritance so `prepare-start` neither self-conflicts nor releases authority before HTTP
   ([[D2210]]);
2. quarantine/remove old live `-wal`/`-shm` files during staged upgrade exactly as restore does,
   before the replacement is first opened ([[D2211]]);
3. define the backup-id digest image, atomic reservation and collision/retry rule ([[D2212]]); and
4. publish one versioned discriminated stdout receipt and exit-code/stderr mapping for every
   operation/result arm ([[D2213]]).

Another fresh independent review is required after those repairs.

1. A unit fixture keeps committed transactions in WAL, stops the writer, creates a backup through
   `node:sqlite.backup`, removes the source database/WAL/SHM, and restores all sentinel rows from the
   standalone snapshot.
2. A negative fixture proves copying only the live main database is not the implementation path and
   cannot satisfy the backup receipt contract.
3. The verifier accepts one canonical bundle and rejects, with exact codes, a changed database
   byte, changed digest, extra file, symlink, non-canonical/unknown manifest key, `.partial` path,
   corrupt SQLite file, foreign-key violation, table-inventory mismatch, and newer storage version.
4. `PRAGMA integrity_check` and `PRAGMA foreign_key_check` are independent able-to-fail fixtures;
   neither can be stubbed by the other.
5. Read-only preflight against `STORAGE_VERSION + 1` leaves database, WAL/SHM existence, mtime,
   byte digest, and schema unchanged and starts no HTTP listener.
6. A generated empty-schema fixture for every member of `upgradesFrom` proves its exact historical
   table inventory and completes the migration chain; representative committed boundary fixtures
   (initially v1, the first run-schema rewrite, the first social-schema migration, and v24) retain
   data as declared. The v24 fixture upgrades through `prepare-start` to the current
   version. Its pre-upgrade bundle verifies as v24; the migrated live database verifies as v25;
   every declared migration invariant passes.
7. An injected migration failure leaves the original live database byte-identical, preserves a
   valid pre-upgrade bundle, leaves no valid staged database, starts no HTTP listener, and prints the
   tested recovery command.
8. Backup → representative mutation/deletion → restore into a fresh volume → restart reproduces
   representative data and stable identities from every application data class, including runs,
   progress, authored/registered artifacts, social/classroom relations, and ratings.
9. Guarded replacement refuses without both confirmation arguments; a failed source/staged check
   leaves the target unchanged; success first publishes a valid `pre_restore` bundle.
10. Compose cold-volume boot, current-volume restart, v24 upgrade, manual backup/verify, fresh-volume
    restore, and last-known-good recovery pass using the built server image rather than tsx/source.
11. The recovery drill runs for linux/amd64 and linux/arm64 release artifacts, natively or under the
    same declared emulation used to qualify the image, and records architecture plus image digest.
12. A derived census is set-equal to all 12 code-site boundaries in §10 and proves the two Compose
    services use the identical server image digest.
13. `make verify` remains green; the ordinary software tier runs deterministic unit/fixture checks,
    while Docker/architecture recovery is a separately named release tier with no flaky wall-clock
    assertion.
14. The release artifact exposes its `StorageCompatibility`; a test fails if the migration chain,
    `STORAGE_VERSION`, version-specific table inventories, current account table inventory, or docs
    matrix drifts.
15. A built-image mutual-exclusion fixture proves an HTTP process holding the storage lock refuses
    maintenance, a maintenance process holding it refuses HTTP startup, and process death releases
    authority even when the lock-file pathname remains.
16. Canonical docs lead an operator through backup, offline copy/retention responsibility, restore
    to a fresh volume, upgrade rehearsal, failed-upgrade recovery, and explicit rollback without
    relying on source-tree knowledge.
17. D608 closes only after criteria 1–16 pass at the production boundary and the implementation
    commit updates `design/BACKLOG.md` plus the append-only exploration log.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Run the backup/mutate/fresh-volume restore and last-known-good drill on the final digest-pinned 1.0 release candidate | `planning/platform-alignment/release-platform/` F12-H | final release-proof receipt and exploration-log entry | |

## Open questions

1. D1 belongs to the final integrated release candidate because a draft image digest cannot prove
   last-known-good recovery. It does not block implementing or mechanically verifying this RFC.
   Publishing and retaining an offline/separately administered copy remains an explicitly
   documented appliance-operator responsibility, not a discharge this repository can perform.

## Changelog

- 2026-08-30: fresh independent review returned the draft on [[D2210]]–[[D2213]]. Exact return:
  `planning/storage-backup-recovery/fresh-independent-buildability-review-2026-08-30.md`;
  reproduction: `make storage-backup-fresh-review`. No production, storage, workflow, schema,
  content or protected-design byte changed.
- 2026-08-27: drafted from O13/F12-C and D608; chose verified SQLite online backup, staged
  migrations/restores, destructive confirmation, explicit compatibility, and production-boundary
  recovery drills.
- 2026-08-27: resolved the operator defaults: maintenance ships as an overlay requiring an explicit
  absolute backup directory, and the full embedded source SHA is the recovery revision identity.
