# Semantic collectors promotion — eleventh author repair

**Date:** 2026-09-05

## What changed

The bounded contract model closes [[D2789]]–[[D2794]] at the author tier without changing a
production collector:

- one installation inventory admits named immutable generations; callers cannot pass an artifact
  directory to collection, and a structural store copy is refused;
- each generation retains its inventory and manifest digests, resolves canonical non-symlinked
  files, and reopens only while every declared byte identity still matches;
- the complete production pack and strict sourcing checks run before admission, while ledger pack
  id, version and semantic digest are joined and retained separately from the pack file digest;
- `/start/fen` is the only admitted tablebase support in this bounded model, and its resolved value,
  response declaration, record anchor/value, source URL query and request FEN must agree;
- canonical response bytes are length- and digest-checked, parsed by the production Syzygy parser,
  and value-joined to the durable record;
- an available legal-map artifact contains the exact FEN-derived move authority; invalid bytes fail
  generation admission, while a declared unavailable map yields the typed input-abstained result;
- only the registered `syzygy` source at a non-future observation time is admitted; and
- the current aggregate assertion requires the current request/result seal and durable receipt, so
  a predecessor-only recorded reading fails.

The maintained target retains the complete predecessor promotion chain. It passes 7/7 new
behavioral groups and strict TypeScript under
`make semantic-collectors-promotion-eleventh-author-repair`.

## Boundary

This is executable author evidence, not production code and not acceptance. The evidence spine
remains 12/14. Both promotion projections stay held until a twelfth genuinely fresh independent
review attacks installation bootstrap authority, generation replacement/coherence, complete
manifest parsing, duplicate declarations, pack/support/response/legal crossings, unavailable and
live result seals, and production-composition parity. Provider/value dependencies must also land
before implementation.
