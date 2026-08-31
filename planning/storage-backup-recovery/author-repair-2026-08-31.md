# Storage backup/recovery author repair — 2026-08-31

## Verdict

Author repair complete for [[D2210]]–[[D2213]]. This is not acceptance or implementation. Another
fresh independent buildability review is required, and production/storage/workflow bytes remain
untouched.

## Repaired authority

- One image-owned supervisor owns one inherited kernel open-file description across prepare-start,
  staged replacement, the exec boundary and the full HTTP lifetime. Children validate rather than
  reacquire it, and the boundary census includes the instant after migration and before HTTP open.
- Upgrade and restore share one journalled, crash-recoverable replacement of the exact SQLite
  main/WAL/SHM set. Recovery yields the exact old triplet or the verified new standalone main, never
  mixed generations.
- Backup identity is derived after snapshot facts exist from one domain-separated canonical image.
  A CSPRNG nonce, exclusive final-directory reservation, 16-attempt bound and `.publishing` validity
  commit make collisions refusals rather than overwrites.
- The stdout protocol is a versioned discriminated union for backup, verify, prepare-start, restore
  and rehearsal. Safe logical paths, closed result/code arms, monotonic elapsed time, one JSON value,
  stderr-only diagnostics and exact exit/signal behavior are part of the contract.

## Verification

`make storage-backup-author-repair` passes eight executable contract arms plus the proposed strict
TypeScript algebra. The prior return remains reproducible as historical evidence; the repaired RFC
requires a new independent review before it can be accepted.
