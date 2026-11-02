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
| `derived.opening.deepest_reached@2` | Internal complete recorded-prefix reduction: the greatest-ply exact endpoint reached, retaining every matched visit. It does not label the current position. |

Theory Breadcrumb now acquires the two genuine point projections from the shared installation
and its exact recorded move. It renders only a matched current endpoint; membership proves
applicability internally and is not an additional learner fact. Complete current Inspector,
Review, bot and longitudinal adoption remain open under their accepted contracts;
there is no generic “opening object.” The historical deepest-reached@1 factory still returns
its explicit unavailable result; its pure history helper is not current source authority.

## HTTP boundary

`GET /opening-identity?fen=<FEN>&ply=<non-negative integer>` returns current endpoint and catalogue
membership from one artifact identity. Invalid input returns `400 INVALID_REQUEST`. A missing,
invalid, or digest-mismatched artifact does not stop the server: the endpoint returns typed
abstentions and `/capabilities` reports the exact producer failure.

The production operation validates the ply and normalizes the FEN once, then reads both immutable
maps. Individual endpoint and membership methods remain available for consumers that need only one
projection.

Startup passes immutable file text to runtime's `admitInstalledOpeningCatalogueText`, which parses
its own private JSON graph once and hashes with built-in WebCrypto. It does not clone or
reflectively walk that already-private JSON a second time. Caller-object compilation/admission
still checks data descriptors and takes a detached snapshot before the same complete structural
validation. Both paths check every key, relationship and installed pin, then freeze both
tables, their rows and all source metadata. Mutating a retained caller input cannot change a
subsequent lookup; returned artifact objects cannot be edited in place. `make opening-source-check`
exercises those boundaries and the existing phase-source and manifest consumers.
`make opening-load-performance-check` retains the actual cold250ms load and full-population
50µs CPU-p95 lookup gates; no warmed installation or skipped validation is substituted.

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
catalogue tables or raw source files. Genuine point factories and an internal history successor
now use this source; the coordinated current Inspector/Review migration remains open.

The private recorded lookup now binds one genuine `run.record.position@1` factory invocation to
one admitted installation. Endpoint and membership share one calculation/normalization and the
original frozen table rows (including endpoint file/row location); there is no second index or
lookup algorithm. Memoization uses exact source/position objects, so repeated keys and equal-valued
but separately recorded positions do not borrow another occurrence's identity. Successful negative
lookups remain actual retained results, not unavailable sources or invented name facts. The existing
HTTP/phase operation uses the same admitted-source lookup and preserves its response meanings.

The sole point factories now accept exactly `{source, position}` and issue fresh frozen arrays
of zero or one genuine item. Their private result reader recognizes only the original array and
its exact source, position, projection and retained paired lookup, including successful negatives.
The evidence receipt includes the original position invocation, installed catalogue and actual
table-row locations. Caller names, FEN/ply replacements, copied handles, copied result arrays,
foreign occurrences and cross-projection substitutions cannot become authority.

Theory verifies the position's original run, event head and node before either lookup. The actual
service reuses its startup-loaded source and returns typed `EVIDENCE_UNAVAILABLE` for corrupt
source joins, not a successful empty card. An unavailable installation retains its exact
`artifact_missing`, `artifact_invalid` or `digest_mismatch` state. `make opening-point-check`
exercises real factory/module and authenticated application delivery; `make opening-point-browser-check`
exercises desktop/phone names, reload, unnamed advancement, empty-card recovery and layout.
Current Inspector/Review access and their full consumer migrations remain open under D3376/D3857;
neither point delivery nor the internal history reduction discharges them.
Normal source tests include real parsed imports after file-backed SQLite reopen for both learner
colors and every prefix, with no provider acquisition or rewritten recorded events.

## Captured opening history

`collectRecordedOpeningHistory({source, run, branchId, throughNodeId})` validates the full original
event/snapshot graph, every registered branch, canonical FEN and actual recorded edge before any
lookup or prefix narrowing. It detaches an immutable root-inclusive prefix through that exact
node. A corrupt suffix or unrelated branch refuses even when the requested prefix is only root.
This source records ancestry; it does not authorize access to a run.

Each occurrence retains its genuine recorded-position value, original endpoint and membership
arrays, and their one paired installed lookup. Negative results are actual successful invocations,
not fabricated absent facts. Equal position keys never merge node, ply or invocation identity.

The sole `derived.opening.deepest_reached@2` factory accepts only `{history}`. Its exact fourth
V2 reduction uses the ordered position/endpoint templates, one original row group per prefix
node, and complete positive/negative source authority. It preserves the existing greatest-ply,
lowest-node-id rule and every matched visit. Nested endpoints remain `@1`; only the history
payload's own projection is `@2`. No match produces a fresh authenticated empty items array,
not an absence sentence or unavailable source. Copied sources, arrays, plans and receipts refuse.
The historical `@1` factory and its explicit unavailable result are unchanged.

`make opening-history-check` exercises the complete source and all four installed reduction
operations, including genuine empties, exit/re-entry, exact original occurrence addresses,
coordinated corrupt event/snapshot suffixes, copied authority and foreign consumer plans.
Current Inspector/Review still need their full accepted source/access/renderer/receiver/API/native
images; no partial learner cutover or legacy input arm is introduced by this internal checkpoint.

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
