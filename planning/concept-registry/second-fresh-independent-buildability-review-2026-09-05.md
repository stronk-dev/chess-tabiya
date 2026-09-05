# Concept registry — second fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewed:** first author repair for [[D2661]]–[[D2666]]
- **Gate:** `make concept-registry-second-fresh-review` — retained 13 controls, new 8/8
- **Verdict:** **RETURNED on [[D2709]], [[D2710]], [[D2711]], [[D2712]], [[D2713]],
  [[D2714]], [[D2715]], [[D2716]]**

## What survives

The migration-order correction, append-only intent, historical label example, present/successor
consumer split, governance enrollment and export-only scope all survive. The return is that their
executable authorities remain substantially weaker than the RFC contract.

## Return

Revision publication accepts duplicate JSON keys, unknown keys and noncanonical bytes. Entry IDs
and labels have no byte ceilings or Unicode-scalar validation. Resolution returns the caller's
mutable, unparsed ref by reference; after a successful lookup its id and digest can be rewritten.

Both historical inputs remain caller-mintable. `compileHistoricalPack` turns arbitrary JSON into a
sealed artifact without the immutable pack inventory and accepts duplicate/malformed concepts plus
extra keys. `recordHistoricalOccurrence` turns two matching plain objects into occurrence authority
without the stored attempt/run parsers. Those two local WeakSets certify each other, so the repair
has changed the shape of the circular authority without grounding it.

The migration remains a one-row mapper. It has no batch transaction, canonical population order,
collision/write-failure rollback, restart receipt or registered-plus-quarantine set equality. The
consumer closure likewise deduplicates a caller-provided string array; it reads no import graph and
even duplicate claimed consumers pass.

## Required repair

Compile canonical revision/head files with duplicate-key, exact-key, ordering, byte-bound and
Unicode checks; parse and deep-seal refs. Consume the immutable pack inventory and exact stored
attempt/run authorities rather than minting them locally. Model one atomic population migration and
its lossless partition receipt. Derive consumer closure from the repository import graph, with
duplicates and local resolvers failing. Then run another genuinely fresh review.

No schema, registry, migration, content, application, client or API implementation is authorized.
