# Semantic collectors promotion — tenth author repair

**Date:** 2026-09-05

## What changed

The bounded contract model closes [[D2765]]–[[D2770]] without changing production collectors:

- canonical `pack.json`, `sources.json` and `evidence.json` bytes are read from a realpath-bound
  directory and retain exact file digests;
- the real production manifest, ledger and linkage validators own schema admission;
- an internally observed current clock, loaded document and resolved JSON pointers gate every
  recorded record;
- the exact manifest entry, retrieval identity, HTTPS Syzygy response origin, record and evidence
  survive in one receipt;
- request identity is asserted before geometry, domain, lookup or any early result;
- actual missing storage and legal-authority artifacts construct failure/abstention and make zero
  provider calls; there is no public caller-selected failure factory.

`make semantic-collectors-promotion-tenth-author-repair` retains every predecessor target, passes
6/6 new behavioral groups, and passes strict TypeScript.

## Boundary

This is author evidence, not production code and not acceptance. Both promotion projections remain
held at 12/14 until another genuinely fresh independent review and the provider/value dependencies
land. The review must attack artifact generation/coherence, source-origin identity, legal-operation
ownership, request/result crossing and any route that can mint recorded evidence without the exact
loaded subject.
