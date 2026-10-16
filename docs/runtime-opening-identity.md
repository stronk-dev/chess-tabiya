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

Run `make opening-catalogue` to deliberately regenerate it and the small package-owned
`packages/runtime/src/opening-catalogue-registration.json`. Generation precedes the final application
build, so the runnable server embeds the new pin, not the previous one. `make opening-catalogue-check`
rebuilds from the vendored inputs and fails when either output is stale. `make verify` includes the check.

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

The production operation validates the ply and normalizes the FEN once, then reads both immutable
maps. Individual endpoint and membership methods remain available for consumers that need only one
projection.

Loading takes a detached snapshot of the artifact, validates that snapshot, and freezes both
tables, their rows and all source metadata. Mutating a retained parser input cannot change a
subsequent lookup; returned artifact objects cannot be edited in place. `make opening-source-check`
exercises those boundaries and the existing phase-source and manifest consumers. This does not
supply the point/history factory or complete learner-module bindings still required by D3376.

The loader also rejects blank endpoint names/ECO and malformed source/compiler SHA-256 values,
even when the outer document digest has been recomputed. These are invalid artifacts, not missing
files or successful unnamed lookups. Six permanent controls exercise direct compilation and actual
file loading; valid installed data and the original latency budgets remain unchanged. This checks
the declared field formats. Installed-source admission additionally checks the package-owned pin:
changing a name, count or source metadata and recomputing the document checksum cannot make a new
document authoritative.

The existing document grammar is registered as `opening-catalogue-schema@1`; the artifact gains no
version field. The pure loader and immutable paired lookup now live in runtime, with no Node imports.
The shared schema validates every field; the loader also checks canonical position keys, sorted
unique tables and endpoint-to-membership joins before either digest decision. Malformed structure
is `artifact_invalid`, even with a stale checksum. Only a structurally valid document whose complete
checksum or installed pin disagrees is `digest_mismatch`.

Application construction admits the document once and shares its frozen catalogue and genuine
`InstalledOpeningCatalogue` handle. That handle exposes only the source reference; its maps remain
in private runtime storage. A spread/JSON/method lookalike or structural compilation does not issue
such a handle. Parser inputs are detached before publication, and non-data fields/accessors refuse
before they can be erased or executed. The runtime bundle includes the small registration, not the
catalogue tables or raw source files. This source foundation does not yet replace the unavailable
sole point/history factories or complete the coordinated learner-facing migration.

The required performance test keeps catalogue load below 250 ms wall time and production lookup
work below 50 µs CPU time per position at the p95 of bounded batches over all 6,991 recorded sample
positions. CPU time deliberately excludes periods when a shared CI runner has descheduled the Node
process while retaining parsing, lookup, allocation and garbage-collection work. Browser arrival
and perceived-operation tests separately enforce user-visible wall latency.

## Honesty boundaries

- Exact endpoint absence does not mean “out of book.”
- Path membership does not license a descendant name or move.
- The catalogue is identity evidence, not an opening policy or quality judgement.
- Renderers may restate admitted identity and provenance only; they do not add theory prose.

The executable contract lives in [the accepted RFC](../rfc/runtime-opening-identity.md). Source,
loader, lookup, historical helper and renderers live in `packages/runtime/src/opening-catalogue.ts`;
`apps/server/src/opening-catalogue.ts` retains file I/O and source compilation and re-exports the
same implementation for existing real callers. No second parser or lookup map is maintained.
The production-boundary regression lives in
`apps/server/src/application.test.ts`.
