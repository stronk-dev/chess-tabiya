# Shared-resource register bootstrap — second fresh independent buildability review

- **Date:** 2026-08-31
- **Subject:** `rfc/shared-resource-register-bootstrap.md`
- **Verdict:** returned to author on [[D2442]]–[[D2444]]
- **Scope:** process/buildability and the exact evidence-presentation handoff; no checker, register
  or product implementation was attempted

## What survives

The header-only absent image, four-kind catalogue, exact ten-row starting population and
before/after transition model repair the prior return. Separate process introduction, first claim
and first landing is still the correct lifecycle. The new `versioned_registry` kind does not yet
describe the source-attribution resource it was introduced for, and two supposedly generic rules
would make later roots depend on file layout and implementer-chosen hash bytes.

## D2442 — the generic object excludes required semantic fields

The bootstrap requires a frozen object with exact keys `{id,version,digest,rows}` and defines its
digest as `sha256(canonical(rows))`. Evidence presentation's proposed
`SOURCE_ATTRIBUTION_REGISTRY_RESOURCE` also carries `resolver` and `missingReceiptField`; the fifth
presentation review proves changing those fields while retaining the digest changes citation
semantics invisibly.

As written, a checker must either reject the product resource for extra keys or accept a digest
that does not identify the resolver contract. Define a generic descriptor/payload image whose
closed semantic fields are declared and all covered by one resource digest. Then make the
source-attribution product object inhabit that exact image rather than special-casing its name.

## D2443 — absence and uniqueness are tied to files, not selectors

The absent lifecycle requires the declared tree file and version symbol not to exist, and C0 is
required to reject duplicate paths. A later resource cannot therefore introduce a second export
in an existing registry module even when its structural selector is distinct. That contradicts
the claim that the next legitimate resource uses this protocol unchanged.

Absence must mean that the exact `(path, structural selector)` and version selector do not resolve.
Catalogue uniqueness should reject duplicate selector identities, not reuse of a module path by
different exported authorities. Fixtures must introduce a second root into an already-existing
file without letting it borrow the first root's symbol.

## D2444 — canonical digest bytes are undefined

`sha256(canonical(rows))` names neither a canonicalization algorithm nor a shared symbol, JSON
domain, text encoding or digest domain. The current evidence-presentation author control uses
insertion-order `JSON.stringify`, already demonstrating a second plausible byte image. Row-key
order changes can therefore produce two digests with no contract deciding which is correct.

Reuse one named canonical-JSON authority and define the exact domain-separated digest image for
every versioned registry. Cross-key-order, unsupported-value and independent implementation
fixtures must produce one result or fail closed.

## Verification

- `make shared-resource-bootstrap-author-contract`: original author boundary remains green.
- `make shared-resource-bootstrap-author-repair`: D2381–D2384/D2401 repair assertions remain green.
- `make shared-resource-bootstrap-second-fresh-review`: reproduces [[D2442]]–[[D2444]] 3/3.

The RFC remains draft. Repair these three generic boundaries, then run another fresh independent
review before acceptance. `release-manifest-schema`, `concept-registry-schema` and
`source-attribution-registry` remain unregistered and unclaimable; no product bytes are authorized.
