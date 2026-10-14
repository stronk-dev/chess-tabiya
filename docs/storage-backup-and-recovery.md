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

### Private backup directory on Linux

For ordinary rootful Docker on Linux, bind-mount permissions use numeric host UIDs, not user
names. The current image runs as uid/gid **1000:1000**. A directory owned by a different host
user at mode 0700 is deliberately inaccessible to that image. The application never changes
host ownership or falls back to root. Confirm the uid/gid with `id` in the exact selected server
image before setting up an installation; do not assume another image uses the same IDs.

Use a **new dedicated service-owned directory**, not an existing personal backup folder:

```sh
export TABIYA_BACKUP_DIRECTORY=/var/lib/tabiya-backups
sudo test ! -e "$TABIYA_BACKUP_DIRECTORY" &&
  sudo install -d -m 0700 -o 1000 -g 1000 "$TABIYA_BACKUP_DIRECTORY"
```

If that path already exists, stop and inspect its ownership and contents. This setup is not a
repair command for an existing directory. Do not recursively chown backups, loosen permissions
or change the application user. `install` explicitly creates this new private directory with the
service's numeric owner. See the [GNU install documentation](https://www.gnu.org/software/coreutils/manual/html_node/install-invocation.html).

When your host uid differs, selecting a private bundle also needs administrative access. Run
maintenance from the installation checkout with its normal Node/Make dependencies installed,
passing the **same** selected Compose files/project and absolute directory explicitly:

```sh
sudo make storage-backup TABIYA_BACKUP_DIRECTORY=/var/lib/tabiya-backups \
  COMPOSE_FILE=/srv/tabiya/compose.yaml COMPOSE_PROJECT_NAME=tabiya
sudo make storage-verify TABIYA_BACKUP_DIRECTORY=/var/lib/tabiya-backups \
  COMPOSE_FILE=/srv/tabiya/compose.yaml COMPOSE_PROJECT_NAME=tabiya \
  BACKUP=/var/lib/tabiya-backups/<id>
```

The host wrapper runs with that explicit administrative authority; the server and storage-admin
container still run as uid 1000. Do not use `sudo -E` or silently select a different Docker
context. This procedure assumes the same rootful daemon, system-installed dependencies and
deployment profile. Apply the same explicit selectors to restore/rehearsal/rollback commands.

For an offline copy you can access as yourself, copy both files into a **new** private directory
on your chosen backup destination. Substitute the actual backup id and destination first:

```sh
bundle_id=<id>
copy_directory="$HOME/tabiya-offline/$bundle_id"
install -d -m 0700 "$HOME/tabiya-offline"
mkdir -m 0700 "$copy_directory" &&
  sudo install -m 0600 -o "$(id -u)" -g "$(id -g)" \
  "/var/lib/tabiya-backups/$bundle_id/database.sqlite" "$copy_directory/database.sqlite" &&
  sudo install -m 0600 -o "$(id -u)" -g "$(id -g)" \
  "/var/lib/tabiya-backups/$bundle_id/manifest.json" "$copy_directory/manifest.json"
```

Verify the copy before depending on it. Use the same immutable server image recorded in the
selected Compose profile; this **read-only offline verifier only** runs as the copy's owner:

```sh
backup_image='<same immutable server image digest>'
docker run --rm --network none --user "$(id -u):$(id -g)" \
  --mount "type=bind,src=$HOME/tabiya-offline,dst=/backup,readonly" \
  --entrypoint node "$backup_image" /app/apps/server/dist/storage-admin.js \
  verify "/backup/$bundle_id"
```

Do not apply that user override to the running server, data volume, restore or writable
maintenance. The original service-owned bundle must remain private and unchanged. There is no
built-in offsite copy or encryption. The Make maintenance wrapper keeps the service uid;
an operator-owned 0700 copy is not automatically readable by it.

Docker Desktop and rootless/user-namespace-remapped Docker have different host mapping behavior.
Do not apply this numeric-UID recipe to them without checking their mapping. The isolated Linux
control below proves the CLI, selector and private-copy behavior, not a complete clean-host
deployment on every Docker configuration. See Docker's
[bind mount](https://docs.docker.com/engine/storage/bind-mounts/) and
[user namespace](https://docs.docker.com/engine/security/userns-remap/) documentation.

All commands need `TABIYA_BACKUP_DIRECTORY=<absolute host directory>`, which is mounted at
`/backup`. `BACKUP=` names an existing bundle directory directly inside that host directory,
using an absolute path or a filesystem path relative to the directory where Make runs. A bare
name is not a search instruction. Paths outside the mounted root, nested paths, missing directories
and symlinked bundles refuse before any server stop, volume lookup or maintenance command. A
trailing slash and ordinary path aliases such as `/tmp` are resolved without changing which
directory is selected. Storage-admin still validates the bundle's name, manifest and database;
the host-side check only binds that selection to the mounted directory. Storage-admin prints exactly one
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

The example above assumes the host directory is already privately accessible to the image's
runtime uid. On a differing-UID Linux host, use the explicit setup/administrative commands above.

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
  Exact bundle controls cover all five consumers, with zero Docker commands on path refusal;
  relative/dot/trailing-slash paths and backup directories containing spaces retain passing controls.
- `make storage-recovery-check` adds the native SQLite backup/restore, bundled CLI/server and
  replacement crash-recovery tests to those wrapper controls. It runs the SQLite/replacement
  controls in the software tier and the installed-content process journeys in the content tier.
- `make test-software` covers the unit tier and the replacement crash matrix.
  The fixtures cover WAL-only backups, every verifier refusal, read-only preflight of a newer
  database, every historical version upgrading through a pre-upgrade bundle, injected migration
  and invariant failures, guarded replacement, an upgrade from the prior release followed by a
  rollback, publication crashes, lock exclusion across processes, and a crash at every replacement
  fault point with recovery itself crashed.
- `make test-content` includes the bundled `main.js`, real longitudinal worker and
  `storage-admin.js` process journeys. The populated recovery control creates accounts, branched
  play, marks/schedules, repertoire moves, pack playtest/publication, shape publication, classroom
  membership/submission grants, a live session, cohort standing, a registered bot decision and
  charged Campaign progress through the application. It waits for actual persisted projection
  jobs, backs up, removes the test-owned source database and restores into a different empty data
  directory. An independent read compares every application table and row before boot; nonempty
  class and named-family assertions prevent empty tables from counting as recovery evidence.
  Restarted APIs retain identities, documents, events and ownership; outsider reads remain denied,
  bot command replay leaves events unchanged and Campaign replay cannot duplicate its reward.
  Bot play and the next Campaign encounter then continue. Historical rating data is seeded through
  the real transactional storage API as an explicitly abandoned/voided record and read through the
  restored Rating API: this does not claim the mock engine admits calibrated games. Device-local
  preferences are not server database state. Native-process coverage does not replace image,
  architecture, prior-release or clean-host release proof. Existing process deadlines are unchanged.
- `make storage-drill` builds a test-owned image tag and runs the documented Make backup, verify,
  fresh restore, rehearsal, guarded replacement, rollback and recover commands against that image.
  It generates the populated native fixture above through `make storage-recovery-fixture`, in a
  fresh private temporary directory. Referenced Campaign packs are persisted through real community
  authoring/publication routes, explicitly not endorsed as chess content. The fixture is restored
  through the image CLI; all tables/columns/rows, nonempty data classes, original identities,
  authoring/classroom reads, export and outsider denials are checked. Resumed fixture mutations
  retain their original writer identity, not a replacement device's identity. It records an additional
  branched game, mutates it after backup and compares every row after fresh restore, replacement
  and rollback. Restored bot/Campaign commands replay without duplicate events/rewards and play
  continues through image HTTP. Rolled-back database bytes also match before reboot. No fixture
  capture is committed or used by progress tracking; ordinary content CI needs no Docker and emits
  no capture. Direct CLI lock and confirmation refusals
  remain separate controls. The image retains its non-root user; backup directories are not made
  world-writable. This is a local development-image storage journey with mock providers, not proof
  of calibrated real-bot behavior, a prior-release rollback or both release architectures.
  The command must finish successfully before it supplies native recovery proof.
  It filters inherited deployment/Make selectors and checks its generated project, fresh volumes,
  matching images, mounts and loopback ports before starting. It checks space available to the image
  user on the actual data volume, refusing a full filesystem without automatically pruning Docker.
  Cleanup removes only its generated project and volumes with matching live Compose ownership labels.

### Current image checkpoint — 2026-10-11

The ordinary `make storage-drill` finished with exit zero on native linux/arm64 image
`sha256:ece2489d9c367c7633e496922128094e00498e3549f93aef56015d9d1aa04cca`
(development revision, mock providers, local Docker Desktop). All seven maintenance commands
passed; replacement and rollback rejected the post-snapshot session with 401, then real login
restored access to the exact original learner and graph. Rollback bytes matched the snapshot before
boot. The earlier zero-capacity condition is no longer current: an isolated non-root volume
control measured 1,256,366,080 available bytes and 6,511,300 free inodes. Nothing was pruned.

Two preceding image runs failed. The first reached fresh restore and then reported only
`fetch failed`; D3723 retains that unexplained transport failure. Request-path/cause and service
state diagnostics now exist, without retries or changed deadlines. The second reached replacement
but reused a session issued after the restored snapshot; the application correctly returned 401.
D3724 fixes that harness assumption, not authentication.

Release native-proof jobs now invoke this same journey on their pulled platform-digest server
image before reporting success. Six orchestration tests check both platform bindings, failure
propagation, stale generated-result removal and runner mismatch. Removing the recovery call makes
four fail. These controls are not actual native release runs.

**Initial Linux ownership control (D3726), 2026-10-11:** a separate isolated Linux tmpfs control created a
uid-1001 directory at mode 0700, then attempted a write as uid 1000. It measured EACCES
(`runtimeUid=1000`, `backupUid=1001`, `backupMode=448`). Root was used only to construct this
temporary fixture; the write was non-root, with no host/operator bind or network. The
operator procedure at that checkpoint did not resolve differing host and image UIDs, including host access to
private bundles. Do not make backups world-writable, run the app as root or silently change
operator-directory ownership. The local pass cannot qualify this deployment case.

All-data-class **process** recovery above remains separate. All-data-class image recovery,
prior-release/v24 upgrade and rollback, both actual release architectures, clean-host permission
handling and the final release journeys remain open. The storage RFC remains implementing.

### Private ownership and typed failure checkpoint — 2026-10-12

The updated `make storage-drill` finishes with exit zero on native linux/arm64 development image
`sha256:dc2742b1d5193933c2e5893a1ad4a2874f8862788d68db7ba7f71c411eee327a`.
All seven Make maintenance commands retain the actual branched restoration, stale-session refusal
and byte-identical rollback/reboot. No runtime user, backup privacy, deadline or retry changes.

Its isolated Linux fixture uses the **real bundled CLI** at uid 1000 against a uid-1001 mode-0700
root. The predecessor returned refused/BACKUP_ID_COLLISION with no existing work directory.
D3729 now returns failed/BACKUP_FAILED (CLI exit 3); a real existing work-directory collision
still refuses without deleting foreign content. Source database bytes and private ownership stay
unchanged on failure. The fixture's root process only constructs owned temporary permissions;
it has no network and only a read-only mount of the test-owned original bundle.

The fixture then runs actual GNU `install` to create a **new** service-owned directory, leaves the
original operator-owned directory untouched, backs up/verifies as uid 1000 and exercises the
actual host bundle-selection script. Selection as the foreign operator refuses; explicit
administrator selection passes. Both files are copied privately using `install` to uid 1001,
their bytes match the originals, and the real CLI plus selector verify the operator's copy.
The setup/copy procedure above records those mechanics. D3726 still requires an actual differing-UID
Linux **host** deployment: tmpfs process controls and Docker Desktop binds are not that proof.

One preceding run failed on `/runs/storage-drill-run/rewind` with UND_ERR_SOCKET/other side closed
while the server remained healthy. The client used pooled HTTP connections around synchronous
external maintenance. Recovery probes now request connection close, and a real separate-server
control checks fresh requests across a blocked client plus a lost mutation response received only
once. There is no mutation retry. This mitigates that lifecycle hazard but does not attribute the
first historical transport failure: D3723 remains open. An initial attempted expired-socket
counterexample did not fail on this machine and was not retained as proof of the cause.

Focused normal gates pass 130 release-policy controls, 33 actual-Make wrapper controls,
42 SQLite/replacement checks, seven populated process journeys and clean types. These controls
and the local image pass do not qualify prior-release, all-data-class image, dual-architecture
release or clean-host recovery. Final `make verify-awake build test-browser-ci-awake` also exits
zero: 4,994 software, seven unchanged-budget performance, 255 content and 304 browser passes,
one existing optional Maia skip, zero retries and all 150 input/112 composition cells. Types,
governance, packaging and build pass; the known entry-bundle warning remains. No push or
current-revision GitHub/native-release claim follows.

### Full-population image journey: verification pending — 2026-10-12

D3746 adds the populated image journey described above under the existing storage RFC. The normal
recovery checks pass 33 Make wrapper controls, 42 SQLite/replacement checks and all seven native
process journeys. Its fixture generator also succeeds during the actual image run. Initial fixture
publication failures were missing mechanical provenance, not permission to loosen the publisher;
the copied fixture documents now explicitly abstain from corpus judgement and name their source.
The permanent row reader normalizes SQLite's null-prototype records into ordinary JSON objects;
the three release controls include a real changed-row rejection and immutable standalone read.

The actual run builds native linux/arm64 development image
`sha256:eb1a0a12d9f6df5ed60081c983f7216c8d55a3d6bb51d58042f44fa2aa67ce59`,
then refuses before boot because its non-root data volume has no usable space. Docker reports
76.93 GB of images and 42.28 GB of volumes. Only the run's owned resources were removed; no global
pruning or unidentified data deletion occurred. D3747 records the new capacity hold rather than
rewriting D3574's earlier genuine clearance. **The full-population image journey is not yet proven.**
After authorized capacity repair it must finish unchanged; prior-release, differing-UID host,
both actual release architectures and final release journeys remain separate obligations.

Fresh normal `make verify-awake build` exits zero: 5,212 software checks, seven unchanged-budget
performance checks, 255 content checks, types, governance, packaging, 133 release-policy checks
and build. This does not turn the capacity-refused image run into a pass. No browser or remote
GitHub run accompanies this operator/test-only change; the known bundle warning remains.

### Full-population image journey passes locally — 2026-10-14

Docker responds and the unchanged non-root image passes fresh-volume capacity and cold boot.
The first populated restore fails its exact Campaign comparison: the copied mechanical boss
fixture's accepted browser ruling is not in the packaged runtime facts. Its stored bytes remain;
the validator correctly refuses `GRADUATION_RULING_UNCITED`. D3811 adds a permanent control over
the actual compiled facts, retaining this refusal. Temporary recovery copies, like the existing
mechanical community pack, now assert no graduation clearance and explicitly abstain from corpus
judgement. A guard refuses stripping a real blocking obligation. Original source fixtures,
rulings, production validators and bundle exclusions are unchanged. Native restored startup
also uses packaged facts without source-fixture selectors.

Normal `make storage-drill` then exits zero on linux/arm64 development image
`sha256:61dd097981a4e29702f2d35e3a127f8be0ee95890a8664db9f80c6e963aee80b`.
All seven actual Make maintenance operations pass. Independent exact-row comparisons retain
the populated accounts, branches/imports, authoring/publications, classroom/submissions,
private observations/history, bot and Campaign state. Original authorization, export/privacy,
idempotent replay and actual bot/Campaign continuation work through the image. Snapshot
replacement revokes later sessions; rollback restores exact database bytes. Only run-owned
labelled resources are removed, with no daemon restart or operator-data pruning.

This closes D3746's local populated-image slice and D3747's current environment hold, not the
historical hang's cause. Mock providers, a development image and Docker Desktop do not establish
an actual differing-UID Linux host, prior-release rollback, both release architectures or final
clean-host release journeys. Those obligations remain open.
