# Storage backup/recovery — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/storage-backup-recovery.md` at its first independent review
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make storage-backup-fresh-review` — 4/4 blocker arms
- **Production status:** untouched; no storage/admin/Compose/workflow implementation is authorized

The verified online backup, staged migration/restore, historical inventory, destructive
confirmation and production-image drills are the correct recovery boundary. Four exact seams remain
in lock ownership, SQLite sidecar replacement and public operator identity/protocol.

## B1 — startup has two lock owners and a race-shaped normative command ([[D2210]])

§1 says the server wrapper holds the nonblocking `flock` across `prepare-start` and the complete
HTTP lifetime. §6 separately says `prepare-start` acquires the storage lock, while its normative
entrypoint is two sequential commands with no lock wrapper or inherited file descriptor shown.

If both opens acquire independently, `prepare-start` can conflict with its own parent lock. If it
alone owns the lock, it releases before `main.js` and maintenance can enter between successful
preflight and HTTP open.

**Required repair:** specify one lock-owning parent executable/open-file description, exact inherited
FD/environment contract for children, exec/exit behavior and one no-gap state machine. Cross a
competitor at every boundary, including the instant after migration and before HTTP open.

## B2 — staged upgrade leaves old WAL/SHM beside new main bytes ([[D2211]])

The RFC correctly states shutdown may leave `-wal` and `-shm`, and restore explicitly quarantines
them with the replaced database. The pre-upgrade staged-install algorithm atomically replaces only
the main database path and says nothing about those sidecars. Reopening the new main file beside old
sidecars can attach pages/state from the replaced database.

**Required repair:** define one atomic/quarantined replacement primitive shared by upgrade and
restore. It must close handles, move/remove the exact main/WAL/SHM set before first open, fsync the
required directory boundaries and restore/quarantine deterministically on failure. Cross a source
with committed rows still in WAL and pre-existing SHM.

## B3 — backup-id digest identity is undefined ([[D2212]])

`backupId` is “UTC basic timestamp + 12 lowercase hex digest chars,” but no digest domain/input is
defined. The partial directory is created before snapshot bytes and manifest exist. There is also no
collision rule for two operations in one timestamp interval or an already reserved final path.

**Required repair:** publish the exact domain-separated bytes available at reservation time (or move
final id derivation after snapshot), canonical timestamp precision, atomic mkdir reservation and
bounded retry/refusal behavior. Never overwrite an existing partial or final bundle.

## B4 — the closed CLI receipt is only prose ([[D2213]])

Verification and every operation promise one closed JSON receipt on stdout, while Make, docs,
release drills and operators depend on it. No receipt interface/version/discriminated arms or exact
error-code/exit-code mapping is declared. Implementations can emit incompatible success and failure
shapes while satisfying every listed field informally.

**Required repair:** define one versioned canonical receipt union for backup/verify/prepare-start/
restore/rehearsal, with operation identity, compatibility/result arms, safe path representation,
versions, checks, elapsed-time semantics and one exit-code map. Cross unknown fields/versions,
multiple stdout values and diagnostics leaking to stdout.

## Re-review order

1. Close the single-owner lock and shared upgrade/restore replacement primitive.
2. Define backup reservation identity and the public receipt protocol.
3. Invert all four arms, preserve the historical-inventory and recovery criteria, then request a
   fresh independent review.

No finding weakens the no-raw-copy rule, verified pre-upgrade snapshot or fresh-volume recovery
preference.
