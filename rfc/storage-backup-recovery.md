# RFC: Storage backup, restore, upgrade, and recovery

- **Status:** draft — fourth author repair completed 2026-09-05 on [[D2724]]–[[D2729]]; another
  genuinely fresh independent review is required. Replacement recovery observes exact byte
  identities; checks share one sealed operation-specific storage subject; the fixed replacement
  journal has atomic publication and unambiguous discovery; identities are runtime-narrowed;
  and `/readyz` has an exact application boundary. `make storage-backup-fourth-author-repair`
  retains the complete chain and passes 6/6 new groups plus strict TypeScript. Implementation
  remains unauthorized.
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

## Third fresh independent return (2026-09-04)

The second repair is returned on six remaining authority/crash seams. [[D2608]] shows that
same-inode plus an independently blocked probe cannot attribute the lock to inherited FD 3 when a
foreign process may be the actual owner. [[D2609]] catches the publication commit fsyncing the
backup root rather than the bundle directory whose `.publishing` entry was removed. [[D2610]]
separates prepare-time storage checks from readiness that can exist only after `main.js` starts.
[[D2611]] shows the exported generic check factory can mint every semantic pass without executing a
check. [[D2612]] requires the operation id to become a parsed/generated identity rather than a
commented plain string. [[D2613]] requires durable rollback-in-progress subphases so a second crash
during multi-file restoration does not become the mixed state the RFC refuses.

`make storage-backup-third-fresh-review` retains 8 first-repair controls, 15 second-repair
falsifiers, both strict TypeScript checks and reproduces the six new findings. Exact evidence:
`planning/storage-backup-recovery/third-fresh-independent-buildability-review-2026-09-04.md`.

## Third author repair (2026-09-04)

The six returned seams are repaired as one attributable operation/durability chain:

1. **[[D2608]]:** every child calls non-blocking exclusive `flock` on inherited FD 3 itself after
   inode validation. Success means that exact open-file description already owned or safely
   acquired the lock; `EWOULDBLOCK` proves another description owns it and refuses.
2. **[[D2609]]:** publication fsyncs the reserved bundle directory after unlinking `.publishing`,
   then fsyncs the backup root. A success receipt cannot precede durable marker removal.
3. **[[D2610]]:** prepare tuples contain only storage facts observable before HTTP. Readiness occurs
   only in rehearsal/release operations that actually start and probe HTTP; fresh prepare performs
   no fictional inventory check.
4. **[[D2611]]:** the generic pass minter is deleted. One exact operation per check validates real
   operands and privately seals an operand-digested result before tuple compilation.
5. **[[D2612]]:** `StorageOperationId` is a runtime-parsed canonical UUID and CSPRNG-generated v4
   UUID. Argv, owner markers, journals, check results and receipts reparse it; invalid/colliding
   identities never own paths or results.
6. **[[D2613]]:** replacement intent carries forward-quarantine/install/verify and rollback-
   quarantine/restore/verify phases plus per-member progress. Restart reconciles expected digests
   with the filesystem after every mutation-before-journal crash and resumes idempotently.

`make storage-backup-third-author-repair` retains 8 first-repair plus 15 second-repair controls and
passes 6/6 new behavioral controls plus strict TypeScript. Exact receipt:
`planning/storage-backup-recovery/third-author-repair-2026-09-04.md`. This is author evidence, not
acceptance or implementation; another genuinely fresh independent review remains required.

## Fourth fresh independent return (2026-09-05)

The third repair closes the six seams it names, but the complete contract still has six false-green
authority boundaries. [[D2724]] shows the recovery model advances from member names and booleans
without representing any recorded old/staged/live digest. [[D2725]] shows privately sealed checks
from unrelated storage subjects—and a fresh/null compatibility check—compile into a successful
backup tuple because neither subject nor operation shape is sealed. [[D2726]] shows state names do
not define atomic journal publication, post-crash discovery, or multiple-intent refusal.
[[D2727]] shows the runtime parser accepts UUID versions 1–5 although only v4 is generated and
authorized. [[D2728]] shows `/readyz` is absent from both the live route owner and the 13-boundary
census while the model validates a non-shipped plain-text body. [[D2729]] shows the manifest and
receipt still accept any `applicationRevision: string`, including the mutable identities §2
explicitly forbids. Exact receipt:
`planning/storage-backup-recovery/fourth-fresh-independent-buildability-review-2026-09-05.md`.

## Fourth author repair (2026-09-05)

The six returned boundaries are repaired as one durable storage authority:

1. **[[D2724]]:** every old, staged, live and quarantine member observation carries a parsed
   SHA-256 identity. Reconciliation admits only the exact pending or completed image for the
   current phase and refuses absent, duplicate, unexpected, corrupt or crossed-generation bytes.
2. **[[D2725]]:** each storage operation privately constructs one recursively sealed
   `StorageCheckSubject` containing its operation id, exact operation/action discriminator,
   observed storage digest and source version. Every check retains that exact object identity;
   the compiler refuses another subject, action, null-source context or caller digest.
3. **[[D2726]]:** replacement uses the single fixed sibling `.tabiya-replacement/`. Each canonical
   journal generation is written exclusively to `journal.tmp`, fsynced, atomically renamed over
   `journal.json`, then committed by fsyncing the transaction directory. Creation additionally
   fsyncs the live parent. Startup accepts zero or one exact directory, refuses alternate/multiple
   candidates and unknown entries, and distinguishes an empty pre-mutation reservation from one
   valid recoverable journal.
4. **[[D2727]]:** `parseStorageOperationId` accepts only canonical lowercase RFC-4122 version-4,
   RFC variant identities; versions 1–3/5, wrong variants, nil and alternate forms refuse.
5. **[[D2728]]:** `apps/server/src/application.ts` owns `/readyz` and joins the derived boundary
   inventory. Its canonical JSON body is exactly `{representativeData:"ok",status:"ready",
   storageVersion:N}`; rehearsal parses all three values and refuses health-only/plain-text,
   wrong-version, noncanonical or incomplete responses.
6. **[[D2729]]:** `ApplicationRevision` is reconstructed by one parser. Release form is exactly a
   40-character lowercase source SHA; development permits only `dev+<full-sha>` or `dev+dirty`,
   and neither development arm is release-recovery evidence. Mutable labels and `0.0.0` are
   unrepresentable.

`make storage-backup-fourth-author-repair` retains the complete review/author chain, passes 6/6
new behavioral groups and runs strict TypeScript. Exact receipt:
`planning/storage-backup-recovery/fourth-author-repair-2026-09-05.md`. This remains author evidence;
another genuinely fresh review gates acceptance and implementation.

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
`prepare-start`, every maintenance operation and `main.js` establish authority on the inherited
descriptor before SQLite opens. First, `fstat(3)` and a separately opened configured lock path must
name the same regular-file inode. Second, the child performs non-blocking exclusive `flock(3)` on
**FD 3 itself**. Success means that exact inherited open-file description either already held or
has now safely acquired the lock; the child keeps FD 3 open and never unlocks it. `EWOULDBLOCK`
means a foreign open-file description owns the lock and refuses `LOCK_AUTHORITY_MISSING`; any other
error also refuses. If a foreign owner exits before the call, FD 3 acquires and retains authority,
which is safe; if it exits after blocking the call, the child has already refused. Inode equality or
a separately opened contention probe is never accepted as attribution. The production image tests
an unlocked FD 3 beside a foreign holder and owner death on pinned Linux/util-linux behavior.
Production `main.js` refuses startup when either inode validation or actual-FD acquisition fails.
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
  readonly applicationRevision: ApplicationRevision; // parsed immutable image/source revision
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
declare const APPLICATION_REVISION: unique symbol;
type ApplicationRevision = string & { readonly [APPLICATION_REVISION]: "ApplicationRevision" };
function parseApplicationRevision(value: unknown): ApplicationRevision;
function releaseRecoveryEligible(value: ApplicationRevision): boolean;
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
both files and the directory, then atomically unlinks `.publishing`, fsyncs the reserved bundle
directory whose entry changed, and finally fsyncs the backup root. The
unlink is the validity commit: public verification rejects the empty/incomplete directory and any
directory with `.publishing`, while after the unlink the directory has the exact two-file grammar.
A crash can therefore leave an identifiable invalid reservation but cannot expose a valid partial
bundle or overwrite an earlier bundle. Startup reports abandoned reservations and never adopts,
deletes, or publishes them automatically.

`applicationRevision` is the full source Git SHA embedded as an OCI revision label and build-time
constant in the server image. `parseApplicationRevision` is its only constructor. Release form is
exactly 40 lowercase hexadecimal characters. Development form is exactly `dev+<40-lowercase-hex>`
or `dev+dirty`; both verify mechanically but `releaseRecoveryEligible` returns false. The parser
rejects the package's present `0.0.0` placeholder, mutable release tags, branch names, uppercase,
prefix/suffix text and alternate lengths. Every unknown manifest and receipt reconstructs the
brand before use.

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
9. fsync both files and the reserved directory, atomically unlink `.publishing`, fsync that
   reserved directory again to durably commit marker removal, and then fsync the backup-root
   directory before reporting success.

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

The primitive exclusively creates the single fixed same-filesystem sibling
`.tabiya-replacement/`; an alternate or second prefix-matching directory refuses before SQLite
opens. It records a canonical closed journal containing the target basename, parsed operation id,
existence and parsed SHA-256 of each old triplet member, staged digest, phase and monotonic
generation. The initial generation is written exclusively to `journal.tmp`, fsynced, atomically
renamed to `journal.json`, then committed by fsyncing the transaction directory and live parent.
Every later generation repeats temp-exclusive write, file fsync, atomic rename-over-journal and
transaction-directory fsync. A restart accepts exactly the fixed directory with canonical
`journal.json` and at most an owned leftover `journal.tmp`; unknown entries, invalid bytes,
alternate/multiple candidates or a missing journal after any mutation refuse. An empty fixed
directory is recognizable only as a crash before the first durable journal and before any live
mutation, and may be removed after fsyncing its parent.

The journal intent contains the target basename, operation id, existence and SHA-256 of each old
triplet member, staged digest, and phase. Every digest is runtime parsed; reconciliation reads and
hashes the actual live, staged and quarantine files rather than accepting path existence as byte
identity.
It then performs this durable state machine. Every journal arm retains the parsed operation id,
complete old-member/digest inventory and staged digest:

1. `prepared` → `forward_quarantine {moved: []}`;
2. `forward_quarantine {moved}` moves exactly the next present member in canonical
   `main,wal,shm` order, fsyncs quarantine/live parents, then rewrites the journal with that member;
3. `forward_install {newInstalled:false}` exclusively links the staged standalone inode at the live
   main path, removes the staged name, fsyncs the live parent, then records `newInstalled:true`;
4. `forward_verify` runs the exact storage checks, closes handles, fsyncs installed main and live
   parent, then commits `verified` only when all pass;
5. `verified` is the durable keep-new decision and permits quarantine/intent cleanup.

A failed forward verification first persists `rollback_quarantine_new {newMoved:false}`. It moves
the failed new main to a transaction-owned artifact, fsyncs parents, records `newMoved:true`, then
enters `rollback_restore_old {restored:[]}`. That arm restores exactly the next originally present
member in canonical order, verifies its recorded digest, fsyncs quarantine/live parents and records
the member. After all members it enters `rollback_verify_old`, verifies the complete old triplet,
then persists `rolled_back` before removing intent/artifacts. No rollback mutation occurs before
rollback intent is durable ([[D2613]]).

Restart discovers the one fixed transaction directory and parses its canonical journal.
Restart reconciles the journal with the exact path/digest image before applying another mutation.
For each forward or rollback member, either the source still exists and the destination does not
(mutation pending), or the source is absent and destination has the recorded digest (mutation
completed before journal write); the latter advances journal progress without repeating the move.
Both/neither/crossed digest refuses `REPLACEMENT_RECOVERY_REQUIRED` without opening SQLite. This
same reconciliation covers install and failed-new quarantine. A fixture crashes immediately before
and after every rename/link/unlink, journal rewrite and directory fsync. Recovery must reach either
the exact old triplet or fully verified new standalone database, never a mixed main/WAL/SHM set.

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

`prepare-start` never claims readiness: HTTP does not exist during its lifetime. Its exact success
tuples are `fresh=[compatibility]`, `current=[integrity,foreign_keys,inventory,compatibility]`, and
`upgraded=[digest,integrity,foreign_keys,inventory,compatibility,migration_invariants]`. Fresh has no
inventory because no schema exists yet. Readiness belongs only to upgrade rehearsal and release
smoke, whose operation lifetime starts the image, waits for `/readyz`, parses its storage version
and probes representative data. Normal supervisor startup exposes readiness through that same HTTP
contract rather than adding an impossible pre-HTTP storage receipt ([[D2610]]).
`apps/server/src/application.ts` owns `/readyz`. It returns one canonical JSON object with exactly
`representativeData:"ok"`, `status:"ready"` and the current integer `storageVersion`. Rehearsal
parses and compares all three fields; `/healthz`, a plain-text body, wrong version, missing
representative-data proof, extra/noncanonical bytes or a non-200 response cannot earn readiness
([[D2728]]).

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
type StorageOperationId = string & { readonly __storageOperationId: unique symbol };
function parseStorageOperationId(value: unknown): StorageOperationId;
function generateStorageOperationId(randomBytes: Uint8Array): StorageOperationId;
type StorageCheck =
  | "digest" | "integrity" | "foreign_keys" | "inventory" | "compatibility"
  | "migration_invariants" | "identity_retention" | "readiness";
type BackupChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility"];
type VerifyChecks = BackupChecks;
type PrepareFreshChecks = readonly ["compatibility"];
type PrepareCurrentChecks = readonly ["integrity", "foreign_keys", "inventory", "compatibility"];
type PrepareUpgradedChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants"];
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
  readonly operationId: StorageOperationId;
  readonly applicationRevision: ApplicationRevision;
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

`generateStorageOperationId` consumes exactly 16 CSPRNG bytes, sets RFC-4122 v4/variant bits and
returns a canonical lowercase UUID only after `parseStorageOperationId`. The parser accepts only
that exact version-4/RFC-variant grammar: no other UUID version or variant, empty, uppercase, nil,
delimiter-bearing, path-like or noncanonical UUID. Every argv boundary,
owner marker, replacement journal, check result and receipt parser reconstructs the brand. Work-
directory reservation is exclusive on the operation id; collision generates a new id before any
storage mutation. A parsed id identifies one invocation but never replaces the FD lock authority
([[D2612]]).

Success callers never supply `checks`. There is no exported
`recordPassedStorageCheck(operationId, check)` or generic pass constructor. Each operation first
privately constructs one recursively sealed `StorageCheckSubject` from its parsed operation id,
exact operation/action discriminator, observed database/bundle digest and source version. No
generic public subject constructor exists. The module-private check constructor is reachable only
after one exact operation validates its real operands:
`checkDigest(expected,actual,byteImage)`, `checkIntegrity(pragmaRows,databaseIdentity)`,
`checkForeignKeys(pragmaRows,databaseIdentity)`,
`checkInventory(expectedTables,actualTables,version)`,
`checkCompatibility(source,target,matrix)`,
`checkMigrationInvariants(before,after,declaredInvariants)`,
`checkIdentityRetention(expectedIds,actualIds,bundle)` and
`checkReadiness(httpStatus,parsedReadyBody,expectedStorageVersion)`. Each sealed result retains the
exact `StorageCheckSubject` object plus its literal check; check operations compute rather than
accept subject/operand digests. A caller-chosen enum, boolean, digest, plain/spread/JSON object,
result from another subject, or compatibility result from another action fails ([[D2611]],
[[D2725]]).

The success compiler chooses the required tuple from the sealed subject's exact operation plus
`prepare_start.action` or restore/rehearsal `migration`, requires ordered set equality, rejects an
empty, missing, extra, duplicate, failed, forged, differently subject-bound or action-incompatible
result, and emits the tuple in canonical order. Receipt parsing repeats the exact tuple check. A
result from a prior invocation or another database therefore cannot be replayed into a new success
receipt, fresh/null compatibility cannot satisfy backup, and readiness cannot stand in for backup
integrity.
The compiler rejects an empty, missing, extra, duplicate, failed, forged or differently operation-bound result;
the stronger subject/action checks are additional constraints.

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

`/healthz`/`/readyz` are not reachable during `prepare-start`. Rehearsal and release readiness run
only after HTTP starts and prove the exact current storage version plus representative data, not
merely an open TCP port. Restore itself remains stopped-service storage work and claims no readiness.

### 10. Code-site inventory

The unit in this table is a production or verification boundary that must consume the contract.
There are **14 boundaries**; acceptance criterion 12 derives the same set from declared anchors and
fails on a missing or duplicate consumer.

| # | Boundary | Required change |
|---:|---|---|
| 1 | `apps/server/src/storage.ts` | split read-only inspection/current-only open from migration; export compatibility and migration invariants |
| 2 | `apps/server/src/storage-admin.ts` | implement backup, verify, prepare-start, restore, receipts, and closed failures |
| 3 | `apps/server/storage-supervisor.sh` | own FD 3, acquire `flock` once, run preflight/maintenance and exec HTTP without releasing the open-file description |
| 4 | `apps/server/src/main.ts` | refuse an unprepared old/future database before creating the HTTP application |
| 5 | `apps/server/src/application.ts` | own canonical `/readyz` storage-version and representative-data response |
| 6 | `apps/server/package.json` | build/run the admin entry point from the shipped package |
| 7 | `apps/server/Dockerfile` | install the exact POSIX-shell/util-linux lock boundary and include the supervisor/admin/build revision |
| 8 | `compose.yaml` | development maintenance service and backup mount |
| 9 | `deploy/compose.release.template.yaml` | digest-identical release maintenance service and backup mount |
| 10 | `Makefile` | thin backup/verify/restore/rehearsal targets |
| 11 | `.gitignore` / packaging checks | exclude local backups and refuse their inclusion in images/artifacts |
| 12 | `.github/workflows/verify.yml` | native recovery contract tier using committed fixtures |
| 13 | `.github/workflows/release.yml` | image/Compose upgrade-rehearsal smoke for both published architectures or declared emulation |
| 14 | `docs/storage-backup-and-recovery.md` | operator procedure, compatibility, retention responsibility, and last-known-good recovery |

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
12. A derived census is set-equal to all 14 code-site boundaries in §10 and proves the two Compose
    services use the identical server image digest.
13. `make verify` remains green; the ordinary software tier runs deterministic unit/fixture checks,
    while Docker/architecture recovery is a separately named release tier with no flaky wall-clock
    assertion.
14. The release artifact exposes its `StorageCompatibility`; a test fails if the migration chain,
    `STORAGE_VERSION`, version-specific table inventories, current account table inventory, or docs
    matrix drifts.
15. A built-image mutual-exclusion fixture proves an HTTP process holding the storage lock refuses
   maintenance, a maintenance process holding it refuses HTTP startup, and process death releases
   authority even when the lock-file pathname remains. A direct child whose FD 3 is an unlocked
   same-inode description beside a foreign lock owner is refused by `flock(3,LOCK_EX|LOCK_NB)`;
   after foreign-owner death, that same call safely acquires and retains authority on FD 3.
16. Canonical docs lead an operator through backup, offline copy/retention responsibility, restore
    to a fresh volume, upgrade rehearsal, failed-upgrade recovery, and explicit rollback without
    relying on source-tree knowledge.
17. D608 closes only after criteria 1–16 pass at the production boundary and the implementation
   commit updates `design/BACKLOG.md` plus the append-only exploration log.
18. Publication power-loss fixtures crash before/after marker unlink, bundle-directory fsync and
    root-directory fsync. No success receipt exists before both post-unlink fsyncs; every reported
    success reboots into a marker-free publicly valid bundle.
19. Prepare-fresh/current/upgraded receipts compile exactly the one/four/six pre-HTTP check tuples
    and reject readiness; fresh rejects inventory. Rehearsal alone earns readiness after starting
    and probing HTTP, including current storage version and representative data.
20. Every semantic check fails on changed real operands and only its private operation can seal the
    result. A public generic pass minter, caller-selected check enum/boolean, invalid operand digest,
    spread/JSON result or cross-operation result fails.
21. Operation ids are generated v4 UUIDs and reparsed at argv, marker, journal, check and receipt
    boundaries. Invalid/noncanonical/path-like/delimiter ids and exclusive-reservation collisions
    fail before storage mutation.
22. The replacement journal records per-member progress through forward quarantine/install/verify
    and rollback quarantine/restore/verify. Crashes immediately before and after every mutation,
    journal write and fsync deterministically reconcile and resume to exact old or verified new
    bytes; no recoverable partial rollback returns `REPLACEMENT_RECOVERY_REQUIRED`.
23. `make storage-backup-third-author-repair` retains all 23 earlier controls, passes the six new
    behavioral groups and strict TypeScript; another fresh independent review still gates acceptance.
24. `make storage-backup-fourth-author-repair` retains the complete chain and adds able-to-fail
    controls for exact
    digest reconciliation, one sealed storage subject/operation shape, atomic discoverable journal
    publication, v4-only operation parsing, the real `/readyz` route/response boundary, and parsed
    immutable application revision. Another fresh independent review still gates acceptance.

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

- 2026-09-05: fourth author repair completed [[D2724]]–[[D2729]]. Exact digest-bearing filesystem
  images, subject/action-bound checks, fixed atomic journal publication/discovery, v4-only operation
  identity, canonical `/readyz` and parsed immutable application revision now compose under `make
  storage-backup-fourth-author-repair` with 6/6 new groups plus strict TypeScript. No production,
  storage, schema, workflow, content, archive or protected-design byte changed; another genuinely
  fresh review remains required.
- 2026-09-05: fourth fresh independent review returned the third repair on
  [[D2724]]–[[D2729]]. Six local author controls pass, but digest recovery, subject-bound checks,
  durable journal authority, v4-only identity, readiness-route closure and release-revision parsing
  remain unbuildable. `make storage-backup-fourth-fresh-review` retains the complete author chain
  and reproduces 6/6; no production/storage/schema/workflow/content/archive or protected-design
  byte changed.
- 2026-09-04: third author repair completed [[D2608]]–[[D2613]]. Lock authority is
  established on inherited FD 3 itself; publication persists marker removal in the changed bundle
  directory; prepare/readiness lifetimes are exact; semantic checks and canonical operation ids
  cannot be caller-minted; and replacement recovery journals every forward and rollback member.
  `make storage-backup-third-author-repair` retains 23 prior controls and passes 6/6 new behavioral
  groups plus strict TypeScript. No production/storage/schema/workflow/content/archive or
  protected-design byte changed; another genuinely fresh independent review remains required.
- 2026-09-04: third fresh independent review returned the second repair on [[D2608]]–[[D2613]].
  Lock contention cannot identify the inherited owner; publication omits the post-unlink bundle-dir
  fsync; prepare success claims pre-HTTP readiness; semantic checks and operation ids remain
  caller-mintable; and rollback has no crash-recoverable substate. The retained author gates and
  six new falsifiers pass under `make storage-backup-third-fresh-review`; implementation remains
  unauthorized pending repair and another review.
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
