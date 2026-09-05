# Longitudinal store — ninth author repair

**Date:** 2026-09-05

**Scope:** bounded author repair for [[D2779]]–[[D2788]]

**Executable receipt:** `make longitudinal-store-ninth-author-repair`

## Result

The repair replaces the caller-owned source/claim model with a disposable file-backed SQLite
implementation of the exact boundary. It does not modify production storage or claim that the
migration has landed.

- Source images are loaded inside the issuing store from exact replayed run bytes, durable owner,
  observed collaboration-journal presence, exact authorship population and monotone structure
  disposition. The read API accepts only run id and cut; callers cannot submit a source record.
- Null authorship is no longer an operand. Absence is a stored journal fact, and a journal-present
  source must contain a set-equal authorship row for every user commit. `single_player` remains
  cross-consistent with the exact owner.
- The eleven mutation symbols execute as committed SQLite transactions with internally derived
  effects and database clocks. Missing source subjects and an injected post-write failure leave no
  receipt. This is contract evidence; production wiring remains an implementation criterion rather
  than being inferred from caller source text.
- One exact parser consumes all sixteen selected job columns and closes pending, running, complete,
  retry-wait and quarantined shapes. SQLite constraints mirror the state union. The self-audit
  [[D2785]] added five positive arms after finding the first retry-wait rule contradictory.
- Job request, acquisition, validation and invalidation all load from one issuing database.
  Acquisition rejoins current source under `BEGIN IMMEDIATE`; SQLite supplies the clock; the
  sealed receipt retains the exact lease expiry; validation reloads job and source inside one read
  transaction. [[D2786]] and [[D2788]] were found and repaired before this checkpoint.
- Invalidation performs an exact old-cut/digest/generation/state compare-and-swap, increments the
  generation, clears every claim/failure/schedule field, commits, reloads byte-identically after
  restart, is idempotent on retry and fences the old claimant.
- Source and claim capabilities are scoped to one store instance. Equal source bytes retain equal
  content digests, but neither source nor claim authority crosses independent databases.

## Able-to-fail controls

The eight groups cross: caller-free source reads; missing and contradictory journal authorship;
all eleven committed/rolled-back mutation receipts; all five job states; structural receipt copy;
externally expired or rewritten lease; current-source mutation before validation; current-source
mutation before acquisition; durable invalidation/restart/idempotence/stale claim; and two equal
independent databases.

The retained eighth fresh-review target still demonstrates every prior unsafe behavior. This
author target follows it in the Make dependency chain rather than replacing its evidence.

## Boundary

No production migration, `SQLiteRunStorage` method, worker, reader, API, client, pack or protected
design byte changed. Fresh independent review must attack the SQLite schema/parser, fixture seam,
transaction and clock boundaries, restart behavior, store-scoped capabilities and the distinction
between executable contract operations and eventual production composition before acceptance.
