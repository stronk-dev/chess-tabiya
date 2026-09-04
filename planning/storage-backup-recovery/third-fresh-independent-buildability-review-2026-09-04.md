# Storage backup/recovery — third fresh independent buildability review

- **Date:** 2026-09-04
- **Subject:** [[D2460]]–[[D2464]] second author repair
- **Verdict:** returned on [[D2608]]–[[D2613]]
- **Production/protected design:** untouched

## What survives

The stopped-service appliance boundary, online SQLite snapshot, immutable two-file bundle, parsed
backup id, exact success tuples, staged upgrade/restore and main/WAL/SHM replacement direction all
survive. The retained author target is green: 8 first-repair controls, 15 second-repair falsifiers
and both strict TypeScript checks.

The RFC is still not buildable safely. Six seams either certify authority that the operation does
not possess or promise crash recovery for states the journal cannot represent.

## Findings

- **[[D2608]] — lock attribution collapses two different owners.** Linux `flock()` associates the
  lock with an open file description, while `EWOULDBLOCK` says only that an incompatible lock
  exists. The RFC's input `{ inodeMatches: true, independentProbe: "would_block" }` is identical
  when inherited FD 3 owns the lock and when FD 3 is an unlocked same-inode description while a
  foreign process owns it. The latter passes today; if the foreign owner exits, the accepted child
  retains no lock. The [Linux `flock(2)` contract](https://man7.org/linux/man-pages/man2/flock.2.html)
  supports the distinction but cannot attribute `EWOULDBLOCK` to FD 3.
- **[[D2609]] — publication does not durably commit marker removal.** The writer fsyncs the bundle
  directory before unlinking `.publishing`, then fsyncs only the backup root. The unlink mutates the
  bundle directory itself. Linux documents that directory-entry durability requires an explicit
  fsync on the directory containing that entry
  ([`fsync(2)`](https://www.man7.org/linux/man-pages/man2/fsync.2.html)). A successful receipt can
  therefore precede durable validity; after power loss the marker may remain and public verification
  must reject the supposedly published bundle.
- **[[D2610]] — prepare-start certifies facts outside its lifetime.** Every prepare-success tuple
  requires `readiness`, but the supervisor waits for that receipt before it execs `main.js`, and the
  RFC says `/healthz` is unreachable until prepare succeeds. The fresh arm also requires `inventory`
  while prepare creates nothing and delegates schema creation to `main.js`. These checks cannot be
  observed by the operation that seals them.
- **[[D2611]] — the check seal authenticates an object, not a check.** The repair exports
  `recordPassedStorageCheck(operationId, check)` and unconditionally adds its caller-selected enum
  to the private `WeakSet`. A consumer can mint digest/integrity/inventory/identity/readiness passes
  by name without executing any check; the positive harness does exactly that. Exact private check
  operations must construct evidence-bearing results over their real parsed operands.
- **[[D2612]] — operation ownership is not parsed identity.** The normative receipt calls
  `operationId` a canonical UUID but types it as `string`; the repair accepts every non-empty string.
  That value owns work directories, publication markers, check results, journals and receipts. No
  runtime parser/generator or boundary revalidation prevents collisions, delimiter-bearing ids or
  reconstructed foreign identities.
- **[[D2613]] — rollback can crash into the state the RFC refuses.** The journal has only
  `prepared`, `old_quarantined`, `new_installed`, and `verified`. Rolling back a failed install moves
  the new main and restores up to three old members through multiple mutations, but records no
  rollback subphase or per-member progress. A crash between those writes produces a mixed
  live/quarantine set; the next-start rule says any set matching neither old nor staged returns
  `REPLACEMENT_RECOVERY_REQUIRED`. That contradicts criterion 1's every-rename/fsync crash promise.
  SQLite's own recovery guidance makes keeping the main and hot WAL/journal together a correctness
  boundary, not cleanup polish
  ([SQLite corruption guidance](https://www.sqlite.org/howtocorrupt.html#_deleting_a_hot_journal)).

## Required repair

Use an attributable inherited capability or safely acquire/retain lock authority on the actual FD;
fsync the bundle directory after the marker unlink; separate storage preflight receipts from
post-start readiness; make exact check operations the only private result constructors; introduce a
runtime-parsed/generated `StorageOperationId`; and journal rollback intent plus per-member progress
so restart can resume every partial forward and rollback state. The next author target must retain
all prior gates and add negatives for the foreign-lock-holder, marker-unlink power loss, pre-HTTP
readiness, public pass minter, invalid/colliding operation id and every rollback mutation.

## Verification

- `make storage-backup-third-fresh-review` retains both author generations and reproduces 6/6.
- No storage, image, Compose, workflow, schema, migration, docs, content, archive or protected-design
  implementation changed.

The RFC remains draft. Production storage mutation stays unauthorized until one bounded repair and
another genuinely fresh independent review close these six findings.
