# Longitudinal store — fifth fresh independent buildability review

- **Date:** 2026-09-04
- **Reviewer:** codex, independent of the fifth author repair
- **Input:** `rfc/longitudinal-store.md` after the [[D2514]]–[[D2517]] repair
- **Verdict:** **returned on [[D2570]]–[[D2573]]; no migration, worker, reader, consumer, API or
  client implementation is authorized**
- **Executable reproduction:** `make longitudinal-store-fifth-fresh-review` — 4/4 blocker controls
  pass

## What survived re-review

The fifth repair closes the four findings it claims. Mixed runs retain one discriminated result per
cut; required HTTP/worker composition shares one absolute file-backed database identity; the source
digest has one versioned, domain-separated canonical constructor; and startup, health, shutdown and
the separately emitted worker artifact are mapped to the real application lifecycle. The prior 36
author controls remain useful evidence for those properties.

The complete operation is still not buildable. Reconstructing the digest operands from live
collaboration storage and following the typed read into its downstream consumers found four new
false-green boundaries.

## Blocking findings

### D2570 — source-image mutation closure omits collaboration authority

The seven-operation census covers snapshot creates/saves only. `structureAttribution` and resolved
move authorship also depend on live-session, match-seat and write-capable grant state. Those records
can change at the same run event head through `createLiveSession`, grant/seat operations and lease
authority, with no job upsert or invalidation in their transactions. A completed single-player row
set can therefore remain labelled current even though calling the RFC's own source constructor now
produces different bytes. The non-live second-host path is sharper: it permits another durable
writer while the projector's “no collaboration journal” fallback attributes every user commit to
the owner.

Repair by deriving a set-equal mutation closure from every persisted digest operand, atomically
updating the job watermark in each source-changing transaction, and crossing same-head
single→shared plus journal-less second-writer positives and negatives.

### D2571 — the sole consumer API still returns `unknown`

The normative read union names `DenominatorRow`, `ObservationRow` and `StructureStatRow` without
defining them. Both retained author models replace the promised rows with `unknown[]`. Thus field
casing, typed/parsed decision references, provenance, immutability and corrupt-read behavior remain
implementation choices. Style, skills and opening-performance RFCs cannot compile against an exact
store boundary.

Publish the closed domain and wire rows, a parser that validates stored JSON and registry identity,
and process/JSON/cross-row forge negatives. The author test must consume those types rather than
`unknown[]`.

### D2572 — criterion 10 depends on a future migration

Live criterion 10 requires the same PGN to carry `learner_asserted`, `observed_other` and `unknown`
subject declarations. Discharge D2 assigns those durable fields to a future import-subject RFC, and
the production `ImportedGameRecord` contains none of them. The disposable model invents a local
`ImportSubject`, so its passing arm cannot be implemented at HEAD plus this RFC.

Revision 1 must fixture the observed-only boundary using fields available now and defer the
three-way admission test to D2, or this RFC must take the migration, register lane, account-data and
rebuild responsibility explicitly. It cannot require and defer the same state.

### D2573 — filter inputs have no closed language

The public query exposes five optional arrays but says nothing about empty arrays, duplicates,
unknown projection/version/sign tuples or contradictory `packIds`/`sessionKinds`. No parser or
normalizer exists in the RFC or author model. Empty-as-all and empty-as-none are both type-correct
implementations and return different learner history.

Define exact validation/normalization tied to the projection/sign registry, including stable order,
duplicate policy, empty semantics, unknown values and contradictions. Cross both in-process and JSON
inputs.

## Required next author round

Treat this as one typed snapshot authority:

1. derive and schedule every persisted source-operand mutation;
2. make the read rows and their validation exact;
3. make revision-1 import acceptance satisfiable without future state; and
4. publish one deterministic filter parser.

Retain the prior 36 author controls and these four fresh negatives. Another genuinely fresh
independent review remains mandatory before acceptance or implementation.
