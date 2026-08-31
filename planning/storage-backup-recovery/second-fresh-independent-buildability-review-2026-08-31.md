# Storage backup/recovery — second fresh independent buildability review

- **Date:** 2026-08-31
- **Subject:** D2210–D2213 author repair
- **Verdict:** returned on [[D2460]]–[[D2464]]
- **Production/protected design:** untouched

## What survives

The single supervisor, SQLite-triplet quarantine, collision-resistant publication and
discriminated receipt directions are substantial improvements. Five safety boundaries remain
unbuildable or falsely typed and must be repaired before production storage mutation is authorized.

## Findings

- [[D2460]]: `fstat` proves FD 3 names the configured inode, not that its open-file description
  owns `flock`; a directly opened same-inode FD plus environment marker can pass validation.
- [[D2461]]: backup failure cleanup still names `.partial`, although the repaired state machine now
  has a random work directory and reserved final directory with `.publishing`.
- [[D2462]]: the journal may persist `verified` before step 4 fsyncs the installed main; recovery
  then keeps possibly non-durable new bytes and removes the old quarantine.
- [[D2463]]: the supposedly safe bundle path identity is plain `string` in both normative and
  proposed types, with no parser/brand proving the backup-id grammar.
- [[D2464]]: every success arm accepts arbitrary `StorageCheck[]`; empty, duplicate or irrelevant
  checks can accompany `succeeded`.

## Required repair

Prove actual lock ownership with an unforgeable handoff or independent contention mechanism;
define cleanup across work/reserved/published states; fsync the new inode before committing the
keep-new phase; type bundle identities from an exact runtime parser; and derive operation-specific
success receipts from complete sealed check results.

## Verification

- `make storage-backup-author-repair`: prior eight repair assertions plus TypeScript remain green.
- `make storage-backup-second-fresh-review`: reproduces [[D2460]]–[[D2464]] 5/5.

The RFC remains draft. No storage, image, Compose, Make, workflow or documentation implementation
is authorized before repair and another fresh independent review.
