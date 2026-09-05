# Storage backup/recovery — fourth fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewer:** codex, independent of the third author repair
- **Input:** `rfc/storage-backup-recovery.md` after the [[D2608]]–[[D2613]] repair
- **Verdict:** **returned on [[D2724]]–[[D2729]]; production storage, image, Compose, workflow and
  documentation implementation remain unauthorized**
- **Executable reproduction:** `make storage-backup-fourth-fresh-review` — 6/6 blocker controls
  plus the complete retained author chain

## What survived re-review

The third repair closes the six local findings it names. The actual inherited FD is the lock
operation target; publication includes the post-unlink bundle-directory fsync; prepare no longer
claims HTTP readiness; the generic public pass minter is gone; operation IDs have a runtime parser
and generator; and forward/rollback phases now represent per-member progress.

The complete contract is still not safely buildable. The new controls cross the promised byte
identity, same-subject, persistence and production-route boundaries rather than accepting the
presence of stronger vocabulary as closure.

## Blocking findings

### [[D2724]] — replacement reconciliation has no byte identity

`ReplacementFsImage` contains member-name arrays and booleans only. `reconcileReplacement`
advances `forward_quarantine` when the expected name appears in `quarantineOld`, and advances
rollback when the name appears at `live`; neither the expected digest nor an observed digest can
be represented. Corrupt, foreign or crossed-generation bytes therefore take the same success path
as the recorded old/staged image, contradicting §5a's exact digest reconciliation.

### [[D2725]] — sealed checks can be laundered across subjects and operation shapes

The private WeakSet proves only that each object came from some exported check function under the
same operation UUID. The caller supplies `operandDigest`; no function computes it or binds a common
database/bundle subject. Five checks carrying five different digests compile as a successful
backup. More sharply, `checkCompatibility(op, null, 25, ...)`, whose null source belongs only to
`prepare_fresh`, satisfies the backup tuple. Seal one exact operation discriminator and inspected
storage subject, then make every check derive from that authority.

### [[D2726]] — the journal is a state union, not durable recovery authority

The RFC says transitions “rewrite the journal” but does not define an atomic publication primitive,
an exact persisted grammar/checksum, how restart discovers the active transaction directory, or
what happens when more than one candidate intent exists. The author model performs no filesystem
read/write/rename/fsync action. A crash during a journal rewrite can therefore destroy the only
authority used to reconcile the next start, despite criterion 22 promising recovery immediately
before and after every journal write and fsync.

### [[D2727]] — the v4 parser admits identities the generator cannot produce

`parseStorageOperationId` accepts UUID versions 1 through 5 (`[1-5]`), while the contract says
operation ownership is a generated RFC-4122 v4 identity. Canonical v1 and v5 strings therefore
cross argv/journal/marker/receipt reconstruction and acquire the brand. Restrict reconstruction to
the exact v4 and variant grammar used by the generator.

### [[D2728]] — readiness is absent from the production consumer census

The production route owner in `apps/server/src/application.ts` exposes `/healthz` only. The RFC
requires `/readyz` but omits `application.ts` from its supposedly set-equal 13-boundary inventory;
`main.ts` cannot supply that handler. The author model further accepts `{body:"ready"}`, which is
not a shipped response shape. Add the real route and closed parsed body to the contract and census,
or the implementation can pass boundary closure without making readiness observable.

### [[D2729]] — immutable release provenance is caller-mintable

Both manifest and receipt type `applicationRevision` as plain `string`. Section 2 explicitly
forbids `0.0.0` and mutable release tags but defines no runtime parser or exact release/dev grammar,
so those values remain representable and can survive deserialization. Recovery evidence must
reconstruct an immutable full source revision or one exact declared development identity.

## Required next author round

Repair the six findings as one durable storage authority: digest-bearing filesystem observations;
one sealed subject/operation image for all checks; atomic, discoverable and unambiguous journal
publication; v4-only operation parsing; a real `/readyz` application boundary and parser; and a
runtime-parsed immutable application revision. Retain every earlier control and add able-to-fail
fixtures for corrupt/crossed bytes, mixed subjects, cross-shape checks, torn/ambiguous journals,
non-v4 UUIDs, absent/malformed readiness and mutable revisions. Another genuinely fresh review
remains mandatory before acceptance or implementation.
