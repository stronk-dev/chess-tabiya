# Longitudinal store — eighth fresh independent buildability review

**Date:** 2026-09-05

**Reviewer:** codex, independent of the eighth author repair

**Verdict:** returned to author on [[D2779]]–[[D2784]]

**Executable receipt:** `make longitudinal-store-eighth-fresh-review`

## Scope and method

This review applied the eighth repair to the authority it claims: production SQLite ownership,
durable authorship, reachable storage transactions, live claim/lease state, invalidation CAS and
database identity. It retained every earlier checkpoint, then crossed the new surface with
JSON-round-tripped callers, independent stores, unreachable AST branches and the actual
`apps/server/src/storage.ts` source.

The repair does invert [[D2718]]–[[D2723]] inside its disposable model. The return is not a dispute
with those six fixes. It is the next production-boundary gap: the model calls caller-owned values
“storage-owned” without consuming the storage authority it describes.

## Findings

1. **[[D2779]] — the reader is not storage-owned.** `LockedLongitudinalSourceStore` takes an array
   of caller-created `LockedSourceRecord` objects. A JSON-round-tripped `DrillRun`, arbitrary owner,
   authorship and structure disposition enter without a database read, row parser, lock,
   transaction or database identity. Replaying the supplied events proves only internal replay
   consistency; it does not prove where those bytes or their ownership came from.
2. **[[D2780]] — absence of authorship is caller testimony.** `moveAuthorship:null` plus the
   caller-selected `single_player` disposition attributes every replayed user commit to the
   caller-selected owner. The executable negative assigns `attacker` to an otherwise ordinary run
   and receives a sealed, digest-bearing owner history. Durable absence of a collaboration journal,
   match seating and run ownership is never observed.
3. **[[D2781]] — the AST compiler proves synthetic lexical shape, not production behavior.** A
   caller string with each descriptor in `if(false)`, an unconditional `return`, and an unreachable
   lexical `COMMIT` passes all eleven operations. The real `apps/server/src/storage.ts` contains
   neither `#upsertLongitudinalWatermark` nor `longitudinalSourceImageV4`. The check therefore
   establishes no current storage integration or transactional effect.
4. **[[D2782]] — current claims are structural caller values.** `assertCurrentClaim` accepts a
   JSON-round-tripped receipt and a caller job carrying impossible running-state residue:
   `completedSeq=999`, negative retry count, retry scheduling and a failure code. Its lease expired
   in 2000, but a caller-supplied 1999 clock makes it current. No exhaustive durable-row parser,
   database read, transaction clock or claim capability participates.
5. **[[D2783]] — invalidation does not mutate durable state.** `invalidateForSourceImage` accepts a
   structural job plus two sealed in-memory images and returns a new pending object. It performs no
   locked read, SQL update, source compare-and-swap, commit, reload, restart or stale-writer test.
6. **[[D2784]] — seals are global rather than database-scoped.** Equal records supplied to two
   independent `LockedLongitudinalSourceStore` instances produce distinct sealed objects with the
   same digest. A job and receipt formed from store A validate against store B's source image. The
   seal establishes module construction, not issuing-database authority.

## Required bounded repair

The next author round must use one disposable but real SQLite-backed storage boundary. Callers may
supply only authenticated operation inputs, not source rows, owners, collaboration absence, job
rows, clocks or receipts. The storage operation must:

- load and exactly parse run/events, owner, journal/seating and monotone structure disposition
  under one issuing database/transaction identity;
- derive the source image and claim capability from those locked rows;
- compile or exercise the eleven actual committed storage paths, with unreachable or rolled-back
  descriptors unable to count;
- load one exhaustive state-specific job union, read its clock from SQLite, and bind claim receipt,
  source cut and issuing database into one unforgeable capability;
- invalidate through a transactional source/job compare-and-swap, with restart, duplicate and
  stale-writer negatives.

Production migration and implementation remain unauthorized. The bounded repair needs another
genuinely fresh independent review before acceptance.

## Verification

`make longitudinal-store-eighth-fresh-review` retains the complete author/review chain, passes all
five new reproducer groups, and type-checks the review. Every reproducer is a passing positive for
the unsafe current behavior; the repair must invert them rather than delete or weaken them.
