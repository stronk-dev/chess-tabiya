# RFC: Storage backup, restore, upgrade, and recovery

- **Status:** **draft — second author repair complete 2026-09-02 on
  [[D2460]]–[[D2464]]; another fresh independent review is required.** Inherited lock authority now
  requires an independent same-inode contention proof; cleanup is total over work, reserved and
  published states; installed bytes become durable before the keep-new journal phase; bundle ids
  come only from an exact runtime parser; and success receipts derive exact operation-specific
  tuples from sealed passed checks. `make storage-backup-second-author-repair` retains the prior
  8 controls and passes 15 new falsifiers plus strict TypeScript. Implementation remains
  unauthorized.
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

## Second fresh independent return (2026-08-31)

The D2210–D2213 repair direction survives. The fresh review returns five remaining safety seams:
[[D2460]] lock ownership is not proved by inode equality; [[D2461]] cleanup names the retired
`.partial` protocol; [[D2462]] `verified` can persist before the installed main is fsynced;
[[D2463]] bundle identity remains plain `string`; and [[D2464]] success receipts accept arbitrary
check arrays. `make storage-backup-second-fresh-review` reproduces 5/5. Exact evidence:
`planning/storage-backup-recovery/second-fresh-independent-buildability-review-2026-08-31.md`.

## Second author repair (2026-09-02)

The five returned seams are repaired as one authority chain, without production storage changes:

1. **[[D2460]]:** descriptor/inode equality is necessary but insufficient. Every child independently
   opens the configured inode and attempts a non-blocking exclusive lock; only `EWOULDBLOCK` proves
   that the inherited open-file description already owns the lock. Acquiring the probe lock is a
   forged/unlocked handoff and refuses before SQLite opens.
2. **[[D2461]]:** failure cleanup is total over the actual three states. An operation-owned random
   work directory may be removed; an exclusively reserved final directory with `.publishing` is
   retained as an invalid abandoned reservation; a published bundle is immutable. The retired
   `.partial` cleanup instruction is deleted.
3. **[[D2462]]:** after verification closes SQLite, the installed main inode and live parent are
   fsynced before `verified` is written and fsynced. Recovery may keep new bytes only from that
   durable phase; every earlier phase rolls back to the quarantine.
4. **[[D2463]]:** `BackupId` is a branded output of `parseBackupId(unknown)`. The parser enforces the
   exact basic-UTC/lowercase-digest grammar and a real millisecond UTC instant by canonical
   round-trip. Manifest, path and receipt parsers all revalidate unknown bytes before constructing
   the brand.
5. **[[D2464]]:** a success receipt has no caller-owned `StorageCheck[]`. One compiler consumes
   runtime-sealed passed results bound to the operation id, rejects missing/extra/duplicate/forged
   rows, and emits the exact ordered tuple for the operation and its migration/action arm.

`make storage-backup-second-author-repair` preserves the first repair's 8/8 controls and passes 15
new able-to-fail arms plus strict TypeScript. This is author evidence, not acceptance or production
authorization; another genuinely fresh independent review remains mandatory.

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

Manual backup and every restore require the HTTP server to be stopped. One image-owned
`storage-supervisor` is the only process allowed to acquire the storage lock. It opens
`/data/.tabiya-storage.lock` as FD 3 without `O_CLOEXEC`, acquires non-blocking exclusive `flock`
once, and exports `TABIYA_STORAGE_LOCK_FD=3`. The resulting kernel open-file description—not the
pathname, PID, environment variable, file contents, descriptor number or inode equality by
itself—is the authority.

The supervisor is a checked POSIX-shell entry point over the image's pinned util-linux `flock`; its
normative ownership sequence is `exec 3>>lock-path`, `flock -n 3`, export the inherited-FD marker,
then run exactly one mode. Because `flock` operates on FD 3 inherited from the shell, its child exit
does not unlock the open-file description retained by the supervisor. Lock refusal invokes the
admin receipt serializer in no-storage mode and exits `2`; it does not hand-write a second JSON
shape. The image fixture verifies the installed shell and util-linux version rather than substituting
a host `flock`.

For `serve`, the supervisor retains FD 3 while it spawns
`storage-admin prepare-start --inherited-lock-fd 3`, waits for a successful receipt and exit, and
then replaces itself with `node apps/server/dist/main.js` using `execve` while preserving FD 3.
There is no unlock/relock boundary: the same open-file description exists before inspection,
through migration, at the instant after migration and before HTTP open, and for the HTTP lifetime.
`prepare-start`, every maintenance operation and `main.js` validate the inherited descriptor with
**two independent checks before SQLite opens**. First, `fstat(3)` and a separately opened
configured lock path must name the same regular-file inode. Second, the child opens that inode on a
new open-file description and attempts a non-blocking exclusive contention probe. The probe must
fail with `EWOULDBLOCK`; if it acquires the lock, FD 3 does not own the claimed lock and the child
unlocks/closes the probe then refuses `LOCK_AUTHORITY_MISSING`. Any other probe error also refuses.
Because Linux `flock` locks are attached to an open-file description, a duplicate/inherited FD of
the supervisor's description shares its lock while an independently opened same-inode FD
contends. The test image pins that Linux/util-linux behavior. Children never release or reacquire
the inherited lock. Production `main.js` refuses startup when either inherited-descriptor check is
absent or fails.
If preflight fails, the supervisor exits and kernel close releases authority without starting HTTP.

For maintenance, the supervisor acquires the same lock once and replaces itself with the requested
`storage-admin` operation, again preserving FD 3. A directly invoked production admin command
without the inherited descriptor refuses before opening SQLite. A live server therefore makes
maintenance fail before SQLite opens, and live maintenance makes server start fail. Process exit
releases the kernel lock, so a stale lock-file pathname after a crash is not a false owner. The
image installs the exact minimal package providing `flock`, and a production-image fixture crosses
a competing process before preflight, during backup/migration, after staged installation but before
HTTP open, during HTTP service, and after owner death.

The shipped Compose workflow runs a one-shot maintenance service whose entry point is
`storage-supervisor maintenance -- storage-admin <operation>`. It shares `/data` but never starts
the HTTP process. The lock file records only diagnostics (operation, PID, start time, release
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
  readonly backupId: BackupId;           // parsed UTC basic timestamp + 12 lowercase hex digest chars
  readonly createdAt: string;            // UTC ISO-8601 with exactly millisecond precision
  readonly reservationNonce: string;     // 32 lowercase hex chars from 128 random bits
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

declare const BACKUP_ID: unique symbol;
type BackupId = string & { readonly [BACKUP_ID]: "BackupId" };

function parseBackupId(value: unknown): BackupId;
```

`parseBackupId` is the only constructor. It accepts exactly
`YYYYMMDDTHHmmss.SSSZ-[0-9a-f]{12}`, parses the timestamp as a real UTC instant and requires
canonical round-trip to the same millisecond basic form; impossible dates/times, alternate case,
missing precision, traversal and suffix/prefix text refuse. A TypeScript brand prevents ordinary
callers from supplying plain strings, while every manifest/path/receipt parser independently calls
`parseBackupId` on unknown persisted or argv-derived bytes before serialization, so a cast, spread
or deserialization cannot bypass runtime validation.

Backup identity is derived only after the standalone snapshot and all manifest facts exist. Let
`manifestWithoutBackupId` be the exact closed manifest above with `backupId` omitted, including
`reservationNonce`, rendered as the canonical JSON form defined by this section but without its
trailing newline. Then:

```text
digestImage = UTF8("tabiya-storage-backup-id-v1\0") || UTF8(manifestWithoutBackupId)
backupId    = basic(createdAt) + "-" + firstLowerHex(SHA256(digestImage), 12)
basic(t)    = YYYYMMDDTHHmmss.SSSZ
```

`createdAt` is captured once from UTC wall time with exactly three fractional digits;
`reservationNonce` comes from the operating-system CSPRNG. Verification recomputes `backupId`
from the published manifest and refuses any mismatch. The nonce is identity salt, not a secret.

The writer first works in an owner-only, randomly named directory that is not syntactically a
bundle and that verifiers refuse. After computing the identity, it refuses an existing legacy
`<backup-id>.partial/` and atomically reserves the final `<backup-id>/` directory using `mkdir` with
exclusive-create semantics. Either an existing legacy partial path or final path is a collision;
neither is opened, removed, renamed, or overwritten. The writer chooses a new 128-bit nonce and
recomputes the canonical manifest image/backup id before retrying reservation, at most 16 times,
while retaining the same `createdAt` and snapshot facts.
Exhaustion returns `BACKUP_ID_COLLISION`.

The exclusively created final directory is an invalid bundle until publication. The writer creates
an owner-only `.publishing` marker carrying only its operation id, moves the snapshot into the
directory, writes the manifest, verifies it internally while requiring that exact marker, fsyncs
both files and the directory, then atomically unlinks `.publishing` and fsyncs the backup root. The
unlink is the validity commit: public verification rejects the empty/incomplete directory and any
directory with `.publishing`, while after the unlink the directory has the exact two-file grammar.
A crash can therefore leave an identifiable invalid reservation but cannot expose a valid partial
bundle or overwrite an earlier bundle. Startup reports abandoned reservations and never adopts,
deletes, or publishes them automatically.

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

1. resolve and validate all paths, validate the inherited maintenance-lock descriptor, and inspect
   the source read-only;
2. refuse storage version `0`, a version greater than `STORAGE_VERSION`, or a missing application
   table inventory; an absent database is `NO_DATABASE`, not an empty successful backup;
3. create an owner-only non-bundle work directory with an exclusive random name;
4. open the source read-only and run `backup(source, work/database.sqlite)`;
5. open the snapshot read-only and require `PRAGMA integrity_check` to return exactly one `ok` row;
6. require `PRAGMA foreign_key_check` to return zero rows. `integrity_check` alone does not test
   foreign-key constraints (<https://www.sqlite.org/pragma.html#pragma_integrity_check>);
7. require the snapshot's `user_version` and application-table set to agree with the canonical
   inventory for that exact historical storage version; for the current version that inventory
   must also be set-equal to `ACCOUNT_DATA_INVENTORY`;
8. close SQLite handles; compute byte length, SHA-256 and the §2 identity; exclusively reserve the
   corresponding final directory under the bounded collision rule; create its `.publishing`
   marker; move the snapshot into it; write canonical `manifest.json`; then parse and verify the
   reservation through the same internal verifier while requiring that exact marker;
9. fsync both files and the reserved directory, atomically unlink `.publishing`, and fsync the
   backup-root directory before reporting success.

No valid backup path exists before step 9. Failure closes handles, releases the lock and leaves the
source untouched. Cleanup is total over the actual publication state and checks the operation-id
marker before changing anything:

- before final reservation, remove only the exact random work directory whose owner marker matches
  this operation;
- after exclusive final reservation, retain the directory and its matching `.publishing` marker as
  an invalid abandoned reservation for operator inspection; never remove, adopt or retry through
  that path;
- after the marker-removal validity commit, preserve the published bundle byte-for-byte.

A missing/mismatched owner marker refuses cleanup. Legacy `.partial` paths remain collision inputs
and verifier refusals only; no current cleanup path creates, removes or adopts one. Verifiers always
reject `.partial` paths, extra files, symlinks, non-canonical manifests, unknown keys, and unknown
format versions.

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

### 5a. Shared quiesced replacement primitive

Upgrade and restore install bytes through one `replaceSqliteTriplet` primitive; neither caller may
rename a main database directly. Its target set is exactly `<live>`, `<live>-wal`, and
`<live>-shm`. It runs only while the supervisor's inherited lock is held, after every SQLite handle
on the live and staged databases is closed. The staged database must already be a verified,
standalone main file with no sidecars.

The primitive creates an exclusive same-filesystem transaction directory, records a canonical
intent containing the target basename, operation id, existence and SHA-256 of each old triplet
member, staged digest, and phase, and fsyncs the intent and both transaction/live parent directories.
It then performs this state machine:

1. `prepared` — move every old member that exists into the transaction's quarantine directory;
   fsync quarantine and the live parent; no new database may be opened;
2. `old_quarantined` — assert all three live paths are absent, use same-filesystem `link` to create
   the live main path exclusively from the staged standalone inode, unlink the staged name, and
   fsync the live parent; an unsupported-hard-link filesystem is refused during preflight;
3. `new_installed` — assert both sidecar paths are still absent, open and run the complete declared
   version/integrity/foreign-key/inventory/migration-invariant checks, close every SQLite handle,
   fsync the installed main inode and live parent, and only then atomically write and fsync the
   `verified` phase;
4. `verified` — the keep-new commit is now durable. Retain the operation's verified backup as the
   recovery artifact, remove the quarantined triplet/intent, and fsync the transaction parent.

Each phase is atomically rewritten and fsynced only after its preceding filesystem mutations and
file/directory fsyncs complete. In particular, no `verified` byte may be persisted until both the
installed main inode and live parent directory are durable. A normal failure in `prepared`,
`old_quarantined`, or `new_installed`
closes handles, moves any new live main into a failed-artifact location inside the transaction,
restores every originally present main/WAL/SHM member by its recorded digest, fsyncs both
directories, and only then removes the intent. The old triplet is therefore restored exactly; an
old sidecar is never left beside new main bytes.

On supervisor startup, a transaction intent is recovered before any SQLite open. `prepared`,
`old_quarantined`, and `new_installed` deterministically roll back using the recorded path/digest
set—even if checks had passed but the installed inode or `verified` journal write had not become
durable. Only persisted `verified` deterministically keeps the installed main and finishes
quarantine cleanup. If the
actual path/digest set matches neither the recorded old nor staged state, startup returns
`REPLACEMENT_RECOVERY_REQUIRED` and touches nothing further. A fixture crashes at every rename,
phase-write, and directory-fsync boundary, including an old source with committed rows resident in
WAL and a pre-existing SHM; recovery must produce either the exact old triplet or the fully verified
new standalone database, never a mixed set.

### 6. Production startup and automatic pre-upgrade snapshot

The image entry point becomes one lock-owning command:

```text
storage-supervisor serve --database "$DATABASE_PATH" --backup-root "$TABIYA_BACKUP_ROOT" -- node apps/server/dist/main.js
```

`prepare-start` owns disk migration. `main.js` then opens only an absent database or the exact
current storage version; it no longer discovers an old on-disk database and migrates it while
starting HTTP.

For an absent database, `prepare-start` creates nothing and `main.js` creates the current schema.
For the current version, it performs read-only integrity, foreign-key, and inventory checks and
returns. For an upgradeable version it:

1. validates the supervisor's inherited lock FD and proves no HTTP process is active;
2. creates and verifies a `pre_upgrade` bundle whose intended version is the image's current
   `STORAGE_VERSION`;
3. copies that verified snapshot to a same-filesystem staged database;
4. applies the production migration chain to the staged database only;
5. checks current `user_version`, integrity, foreign keys, application inventory, and every
   migration-specific data invariant;
6. closes all handles and invokes `replaceSqliteTriplet`, retaining the original bytes in the
   verified pre-upgrade bundle;
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
checks. Only after those checks does it invoke `replaceSqliteTriplet`. The primitive quarantines
the exact old main/WAL/SHM set, fsyncs the replacement boundaries, and prevents stale sidecars from
ever being attached to restored bytes.

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

Stdout is a protocol, not a log. Every invocation writes exactly one canonical JSON value followed
by one newline and no other stdout bytes. Progress and diagnostics go only to stderr and must not
contain manifest bodies, learner data, password hashes, sessions, tokens, or arbitrary absolute
paths. Unknown receipt versions/fields, more than one JSON value, non-canonical JSON and diagnostic
stdout bytes are protocol failures for Make, Compose and release-drill consumers.

The public receipt algebra is:

```ts
type StorageAdminOperation =
  | "command" | "backup" | "verify" | "prepare_start" | "restore" | "rehearsal";
type StorageCheck =
  | "digest" | "integrity" | "foreign_keys" | "inventory" | "compatibility"
  | "migration_invariants" | "identity_retention" | "readiness";
type BackupChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility"];
type VerifyChecks = BackupChecks;
type PrepareFreshChecks = readonly ["inventory", "compatibility", "readiness"];
type PrepareCurrentChecks = readonly ["integrity", "foreign_keys", "inventory", "compatibility", "readiness"];
type PrepareUpgradedChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "readiness"];
type RestoreCurrentChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention"];
type RestoreUpgradedChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention"];
type RehearsalCurrentChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention", "readiness"];
type RehearsalUpgradedChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention", "readiness"];
type StoragePathRef =
  | { readonly role: "database"; readonly identity: "live" }
  | { readonly role: "backup_root"; readonly identity: "configured" }
  | { readonly role: "bundle"; readonly identity: BackupId }
  | { readonly role: "staging"; readonly identity: "internal" }
  | { readonly role: "volume"; readonly identity: "disposable_rehearsal" };
type StorageCompatibilityDisposition =
  | "current" | "upgradeable" | "newer_than_application" | "unsupported_old" | "invalid";

interface StorageReceiptBaseV1 {
  readonly protocol: "tabiya-storage-admin-receipt";
  readonly protocolVersion: 1;
  readonly operationId: string;       // canonical UUID generated once per invocation
  readonly applicationRevision: string;
  readonly elapsedMs: number;         // non-negative integer from a monotonic clock
  readonly paths: readonly StoragePathRef[];
}

type StorageAdminReceiptV1 = StorageReceiptBaseV1 & (
  | { readonly operation: "backup"; readonly result: "succeeded";
      readonly backupId: BackupId; readonly reason: "manual" | "pre_upgrade" | "pre_restore";
      readonly sourceStorageVersion: number; readonly intendedStorageVersion: number;
      readonly checks: BackupChecks }
  | { readonly operation: "verify"; readonly result: "succeeded";
      readonly backupId: BackupId; readonly compatibility: "current" | "upgradeable";
      readonly sourceStorageVersion: number; readonly currentStorageVersion: number;
      readonly checks: VerifyChecks }
  | { readonly operation: "prepare_start"; readonly result: "succeeded";
      readonly action: "fresh"; readonly sourceStorageVersion: null;
      readonly targetStorageVersion: number; readonly backupId: null;
      readonly checks: PrepareFreshChecks }
  | { readonly operation: "prepare_start"; readonly result: "succeeded";
      readonly action: "current"; readonly sourceStorageVersion: number;
      readonly targetStorageVersion: number; readonly backupId: null;
      readonly checks: PrepareCurrentChecks }
  | { readonly operation: "prepare_start"; readonly result: "succeeded";
      readonly action: "upgraded"; readonly sourceStorageVersion: number;
      readonly targetStorageVersion: number; readonly backupId: BackupId;
      readonly checks: PrepareUpgradedChecks }
  | { readonly operation: "restore"; readonly result: "succeeded";
      readonly migration: "not_required"; readonly sourceBackupId: BackupId;
      readonly preRestoreBackupId: BackupId | null;
      readonly sourceStorageVersion: number; readonly targetStorageVersion: number;
      readonly checks: RestoreCurrentChecks }
  | { readonly operation: "restore"; readonly result: "succeeded";
      readonly migration: "applied"; readonly sourceBackupId: BackupId;
      readonly preRestoreBackupId: BackupId | null;
      readonly sourceStorageVersion: number; readonly targetStorageVersion: number;
      readonly checks: RestoreUpgradedChecks }
  | { readonly operation: "rehearsal"; readonly result: "succeeded";
      readonly migration: "not_required"; readonly sourceBackupId: BackupId;
      readonly imageDigest: string;
      readonly architecture: "linux/amd64" | "linux/arm64";
      readonly checks: RehearsalCurrentChecks }
  | { readonly operation: "rehearsal"; readonly result: "succeeded";
      readonly migration: "applied"; readonly sourceBackupId: BackupId;
      readonly imageDigest: string;
      readonly architecture: "linux/amd64" | "linux/arm64";
      readonly checks: RehearsalUpgradedChecks }
  | { readonly operation: StorageAdminOperation; readonly result: "refused";
      readonly code: StorageRefusalCode;
      readonly compatibility?: "newer_than_application" | "unsupported_old" }
  | { readonly operation: StorageAdminOperation; readonly result: "failed";
      readonly code: StorageFailureCode; readonly compatibility?: "invalid" }
  | { readonly operation: StorageAdminOperation; readonly result: "cancelled";
      readonly code: "OPERATION_CANCELLED"; readonly signal: "SIGINT" | "SIGTERM" }
);

type StorageRefusalCode =
  | "USAGE_ERROR" | "NO_DATABASE" | "MAINTENANCE_LOCKED" | "LOCK_AUTHORITY_MISSING"
  | "PATH_REFUSED" | "BACKUP_ID_COLLISION" | "STORAGE_NEWER_THAN_APPLICATION"
  | "STORAGE_TOO_OLD" | "RESTORE_CONFIRMATION_REQUIRED";
type StorageFailureCode =
  | "BUNDLE_INVALID" | "DIGEST_MISMATCH" | "SQLITE_INTEGRITY_FAILED"
  | "FOREIGN_KEY_VIOLATION" | "INVENTORY_MISMATCH" | "BACKUP_FAILED"
  | "MIGRATION_FAILED" | "RESTORE_FAILED" | "REPLACEMENT_RECOVERY_REQUIRED"
  | "INTERNAL_ERROR";
```

Success callers never supply `checks`. Each check operation returns a runtime-sealed
`PassedStorageCheck { operationId, check, passed: true }`; only the storage-admin check runner can
construct that seal. The success compiler chooses the required tuple from the exact operation plus
`prepare_start.action` or restore/rehearsal `migration`, requires set equality, rejects an empty,
missing, extra, duplicate, failed, forged or differently operation-bound result, and emits the
tuple in the canonical order above. Receipt parsing repeats the exact tuple check. A result from a
prior invocation therefore cannot be replayed into a new success receipt, and a readiness result
cannot stand in for backup integrity.

Every `BackupId` field and bundle path identity is reconstructed through `parseBackupId` while
parsing unknown receipt bytes. Serializers accept the parsed receipt only; no raw argv or persisted
string reaches the public path algebra.

The success arms bind operation identity to operation-specific fields rather than exposing one bag
of optional properties. `paths` uses logical identities only: it never copies an argv path, host
checkout, username or volume name. `elapsedMs` starts immediately after process entry (before argv
validation), ends immediately before receipt serialization, uses a monotonic clock, rounds down to
an integer millisecond and is never used as a pass/fail performance assertion.

The exit map is exact: `0` for `succeeded`; `2` for `refused`; `3` for every declared `failed`
validation/storage arm; and `4` only for `INTERNAL_ERROR`. A caught SIGINT/SIGTERM before the
irreversible replacement boundary emits `cancelled` and exits `130`/`143`; after that boundary the
operation masks those signals until it either completes verification or rolls back, then emits its
ordinary terminal receipt. SIGKILL and host loss cannot promise stdout; the persisted replacement
intent is the recovery authority. A usage failure uses operation `command`. The parser rejects an
unknown operation before touching storage but still emits the typed refusal.

`/healthz` is not reachable until `prepare-start` succeeds; readiness after restore proves the
exact current schema and storage checks, not merely an open TCP port.

### 10. Code-site inventory

The unit in this table is a production or verification boundary that must consume the contract.
There are **13 boundaries**; acceptance criterion 12 derives the same set from declared anchors and
fails on a missing or duplicate consumer.

| # | Boundary | Required change |
|---:|---|---|
| 1 | `apps/server/src/storage.ts` | split read-only inspection/current-only open from migration; export compatibility and migration invariants |
| 2 | `apps/server/src/storage-admin.ts` | implement backup, verify, prepare-start, restore, receipts, and closed failures |
| 3 | `apps/server/storage-supervisor.sh` | own FD 3, acquire `flock` once, run preflight/maintenance and exec HTTP without releasing the open-file description |
| 4 | `apps/server/src/main.ts` | refuse an unprepared old/future database before creating the HTTP application |
| 5 | `apps/server/package.json` | build/run the admin entry point from the shipped package |
| 6 | `apps/server/Dockerfile` | install the exact POSIX-shell/util-linux lock boundary and include the supervisor/admin/build revision |
| 7 | `compose.yaml` | development maintenance service and backup mount |
| 8 | `deploy/compose.release.template.yaml` | digest-identical release maintenance service and backup mount |
| 9 | `Makefile` | thin backup/verify/restore/rehearsal targets |
| 10 | `.gitignore` / packaging checks | exclude local backups and refuse their inclusion in images/artifacts |
| 11 | `.github/workflows/verify.yml` | native recovery contract tier using committed fixtures |
| 12 | `.github/workflows/release.yml` | image/Compose upgrade-rehearsal smoke for both published architectures or declared emulation |
| 13 | `docs/storage-backup-and-recovery.md` | operator procedure, compatibility, retention responsibility, and last-known-good recovery |

## Deviations from design

None. O13 requires a supported backup/restore/upgrade appliance path. This RFC narrows “quiesced
SQLite backup” to a stopped HTTP service plus SQLite's online backup API rather than raw file copy,
and makes rollback mean restoration of verified old bytes with the compatible old image. It does
not weaken the appliance floor or claim downgrade reads.

## Acceptance criteria

### Fresh independent return and author repair (2026-08-30 through 2026-08-31)

Exact return:
`planning/storage-backup-recovery/fresh-independent-buildability-review-2026-08-30.md`.
The 2026-08-31 author repair addresses the four returned seams without declaring acceptance:

1. §1 assigns the advisory lock to the supervisor's one inherited open-file description and crosses
   every preflight-to-HTTP boundary ([[D2210]]);
2. §5a gives upgrade and restore one journalled main/WAL/SHM replacement primitive with deterministic
   crash recovery before first open ([[D2211]]);
3. §2 defines the domain-separated backup-id image, canonical millisecond timestamp, exclusive
   reservation, marker-removal validity commit and bounded collision behavior ([[D2212]]); and
4. §9 publishes one versioned discriminated stdout receipt, safe path grammar, exact stdout/stderr
   boundary and exit-code/signal mapping for every operation/result arm ([[D2213]]).

`make storage-backup-author-repair` proves eight able-to-fail arms plus the proposed TypeScript
algebra. Another fresh independent review is still required before acceptance.

The 2026-09-02 second author repair closes [[D2460]]–[[D2464]].
`make storage-backup-second-author-repair` retains those eight controls and adds 15 dynamic
falsifiers plus strict TypeScript: unlocked same-inode FD; all three publication cleanup states and
foreign ownership; pre-durability verified commit; malformed and impossible-date bundle ids;
nine exact success shapes; and empty/missing/extra/duplicate/wrong-operation/forged check sets.
Another genuinely fresh independent review is required before acceptance or implementation.

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
12. A derived census is set-equal to all 13 code-site boundaries in §10 and proves the two Compose
    services use the identical server image digest.
13. `make verify` remains green; the ordinary software tier runs deterministic unit/fixture checks,
    while Docker/architecture recovery is a separately named release tier with no flaky wall-clock
    assertion.
14. The release artifact exposes its `StorageCompatibility`; a test fails if the migration chain,
    `STORAGE_VERSION`, version-specific table inventories, current account table inventory, or docs
    matrix drifts.
15. A built-image mutual-exclusion fixture proves an HTTP process holding the storage lock refuses
   maintenance, a maintenance process holding it refuses HTTP startup, and process death releases
   authority even when the lock-file pathname remains. A direct child given a separately opened FD
   for that same inode plus the expected environment marker is refused because its independent
   contention probe acquires rather than returns `EWOULDBLOCK`.
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

- 2026-09-02: second author repair completed [[D2460]]–[[D2464]]. Descriptor validation now proves
  actual lock ownership by independent contention; cleanup is total over the real publication
  states; durable installed bytes precede the keep-new journal phase; every bundle identity is a
  runtime-parsed `BackupId`; and success receipts derive exact tuples from sealed operation-bound
  checks. `make storage-backup-second-author-repair` retains 8 earlier controls and passes 15 new
  falsifiers plus strict TypeScript. No production/storage/schema/workflow/content/archive or
  protected-design byte changed; another fresh independent review remains required.
- 2026-08-31: second fresh independent review returned the author repair on [[D2460]]–[[D2464]].
  Lock proof, cleanup states, durability phase ordering, validated bundle identity and
  operation-specific success checks require repair; no implementation is authorized.
- 2026-08-31: author-repaired [[D2210]]–[[D2213]] with one supervisor-owned inherited lock, shared
  crash-recoverable SQLite-triplet replacement, recomputable collision-safe backup identity and a
  versioned closed receipt union. `make storage-backup-author-repair` passes 8/8 plus TypeScript.
  No production, storage, schema, workflow, content, archive or protected-design byte changed;
  another fresh independent buildability review is required.
- 2026-08-30: fresh independent review returned the draft on [[D2210]]–[[D2213]]. Exact return:
  `planning/storage-backup-recovery/fresh-independent-buildability-review-2026-08-30.md`;
  reproduction: `make storage-backup-fresh-review`. No production, storage, workflow, schema,
  content or protected-design byte changed.
- 2026-08-27: drafted from O13/F12-C and D608; chose verified SQLite online backup, staged
  migrations/restores, destructive confirmation, explicit compatibility, and production-boundary
  recovery drills.
- 2026-08-27: resolved the operator defaults: maintenance ships as an overlay requiring an explicit
  absolute backup directory, and the full embedded source SHA is the recovery revision identity.
