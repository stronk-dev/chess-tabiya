# Storage backup/recovery — third author repair

**Date:** 2026-09-04

**Scope:** bounded RFC/contract repair for [[D2608]]–[[D2613]]. No production storage, server,
API, schema, client, content, deployment, archive or protected-design byte changed.

## Result

The returned recovery contract is repaired around one attributable, crash-durable authority chain:

- every child validates and acquires authority on inherited FD 3 itself; inode equality and a
  separate contention probe are not treated as proof of ownership;
- backup publication fsyncs the bundle directory after removing `.publishing`, then fsyncs the
  backup root before success;
- prepare receipts contain only pre-HTTP storage observations, while readiness belongs only to an
  operation that starts and probes HTTP;
- exact operand-validating operations privately seal check results; callers cannot mint semantic
  passes by supplying an enum, boolean or object;
- one canonical parsed/generated UUID v4 identity crosses argv, marker, journal, check and receipt
  boundaries; and
- replacement records forward and rollback per-member progress, reconciles every filesystem
  mutation against recorded digests after restart, and resumes without accepting a mixed triplet.

## Executable evidence

`make storage-backup-third-author-repair` runs:

- the original 8/8 storage author controls;
- the second repair's 15/15 lock, cleanup, durability, identity and receipt controls;
- 6/6 new behavioral groups for [[D2608]]–[[D2613]]; and
- strict TypeScript over all three author models.

The retained source-bound controls were updated only where the stronger repair intentionally
superseded the older separate-probe lock and single-phase recovery wording. They now require
actual-FD acquisition, per-member rollback reconciliation and the exact module-private check
authority; the earlier behavioral falsifiers remain intact.

## Remaining boundary

This is author repair, not acceptance or implementation. A genuinely fresh independent review must
rederive the FD-lock semantics, durability ordering, operation/check lifetimes and crash recovery
against the RFC. Production backup/restore and [[D608]] remain held until acceptance and subsequent
implementation at the built-image boundary.
