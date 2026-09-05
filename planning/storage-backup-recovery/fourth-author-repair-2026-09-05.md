# Storage backup/recovery — fourth author repair

**Date:** 2026-09-05

**Scope:** bounded RFC/contract repair for [[D2724]]–[[D2729]]. No production storage, server,
API, schema, client, content, deployment, archive or protected-design byte changed.

## Result

The returned seams are repaired as one durable recovery authority:

- replacement observations carry exact parsed digests for every old, staged, live and quarantine
  member, and crossed/corrupt generations refuse before transition;
- one private operation/action-specific `StorageCheckSubject` supplies every check; callers cannot
  supply digests, mix subjects, or reuse fresh/null compatibility in backup;
- the fixed `.tabiya-replacement/` directory has temp-write, file-fsync, atomic-rename and
  directory-fsync publication plus exact restart discovery and ambiguity refusal;
- operation identities reconstruct only canonical RFC-4122 v4/RFC-variant UUIDs;
- `/readyz` has one canonical JSON storage/representative-data contract owned by the actual
  application route boundary; and
- application revision has an exact release/development parser, with development identities
  mechanically valid but ineligible as release recovery evidence.

## Executable evidence

`make storage-backup-fourth-author-repair` retains the complete earlier author/review chain, passes
6/6 new able-to-fail groups for [[D2724]]–[[D2729]], and runs strict TypeScript over the new model.

## Remaining boundary

This is author repair, not acceptance or implementation. A genuinely fresh independent reviewer
must attack the composed digest, subject, journal, readiness and revision authority against real
filesystem/process boundaries. Production backup/restore and [[D608]] remain held until that
review accepts the RFC and implementation later proves the built-image recovery drill.
