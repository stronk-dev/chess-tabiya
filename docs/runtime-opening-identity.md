# Runtime opening identity

Tabiya compiles the pinned CC0 Lichess chess-openings catalogue into a deterministic local runtime
artifact. Runtime requests never scrape, search, or ask an LLM to decide which opening applies.

## What ships

The build input is the five-file catalogue at commit
`4b8622759e7ae6f93f011cc6c83a3823401ab45e`, vendored under `vendor/chess-openings/`. The compiler
uses the same TSV and legal-PGN parsers as pack sourcing and writes
`apps/server/artifacts/runtime-opening-catalogue.json`. The artifact contains:

- 3,810 unique exact named endpoints;
- 7,854 position keys occurring on catalogue paths;
- source-file, compiler-file, licence, commit, byte-count, and digest provenance.

Run `make opening-catalogue` to deliberately regenerate it. `make opening-catalogue-check` rebuilds
from the vendored inputs and fails when the committed artifact is stale. `make verify` includes the
check.

The production image contains the compiled artifact. It does not contain the raw TSV inputs.

## Evidence meanings

The runtime keeps four meanings separate:

| Projection | Meaning |
|---|---|
| `theory.opening.current_endpoint@1` | The current position exactly equals one named endpoint, or it does not. The result is never sticky. |
| `theory.opening.catalogue_membership@1` | The current position occurs on one or more catalogue paths. It exposes only the descendant count and never guesses a name. |
| `run.record.position@1` | An exact recorded node id, ply, and FEN. |
| `derived.opening.deepest_reached@1` | The greatest-ply exact endpoint reached in recorded history, retaining every matched visit. It does not label the current position. |

All four land as inspector-only evidence. Learner modules, Review selection, theory links, bot
features, and longitudinal aggregates must bind the exact projection they need in their own RFC;
there is no generic “opening object.”

## HTTP boundary

`GET /opening-identity?fen=<FEN>&ply=<non-negative integer>` returns current endpoint and catalogue
membership from one artifact identity. Invalid input returns `400 INVALID_REQUEST`. A missing,
invalid, or digest-mismatched artifact does not stop the server: the endpoint returns typed
abstentions and `/capabilities` reports the exact producer failure.

## Honesty boundaries

- Exact endpoint absence does not mean “out of book.”
- Path membership does not license a descendant name or move.
- The catalogue is identity evidence, not an opening policy or quality judgement.
- Renderers may restate admitted identity and provenance only; they do not add theory prose.

The executable contract lives in [the accepted RFC](../rfc/runtime-opening-identity.md). Source,
loader, lookup, history derivation, and renderers live in
`apps/server/src/opening-catalogue.ts`; the production-boundary regression lives in
`apps/server/src/application.test.ts`.
