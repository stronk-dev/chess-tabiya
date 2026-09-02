# Storage backup/recovery second author repair — 2026-09-02

## Verdict

Author repair is complete for [[D2460]]–[[D2464]]. This is not acceptance or implementation.
Another genuinely fresh independent buildability review is required, and production storage,
images, Compose, workflows and operator documentation remain untouched.

## Repaired authority

- Inode equality no longer impersonates lock ownership. The inherited descriptor must match the
  configured inode and an independently opened same-inode descriptor must receive `EWOULDBLOCK`
  from a non-blocking exclusive contention probe before SQLite opens.
- Backup cleanup now has one total three-state disposition: remove only an operation-owned work
  directory, retain a reserved `.publishing` directory as an invalid abandoned reservation, and
  preserve a published bundle.
- Replacement verification closes SQLite and fsyncs the installed main inode plus live parent
  before persisting the `verified` keep-new phase. Recovery rolls every earlier state back.
- `BackupId` is a runtime-parsed brand with exact basic-UTC/lowercase-digest grammar and real-date
  canonical round-trip. Unknown manifest, path and receipt bytes are re-parsed before use.
- Success receipts derive exact ordered tuples from sealed passed checks bound to the operation id.
  Empty, missing, extra, duplicate, irrelevant, wrong-operation and forged inputs refuse.

## Executable evidence

`make storage-backup-second-author-repair` retains the first repair's eight controls, passes 15 new
dynamic falsifiers and passes strict TypeScript. The nine positive shapes cover backup, verify,
three prepare-start actions, two restore migration states and two rehearsal migration states.

No production, storage, schema, migration, Compose, image, workflow, content, archive or protected
design byte changed in this repair.
