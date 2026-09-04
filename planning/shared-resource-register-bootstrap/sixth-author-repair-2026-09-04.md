# Shared-resource register bootstrap — sixth author repair

- **Date:** 2026-09-04
- **Repairs:** [[D2559]]–[[D2562]]
- **Status:** author repair complete; another fresh independent review is required
- **Gate:** `make shared-resource-bootstrap-sixth-author-repair` — 4/4

## Repair

Canonical-resource parsing and projection now receive the catalogue descriptor id and require the
literal resource id to match it before accepting the digest. The adapter separately requires a
plain JSON object payload; the shared canonical byte authority retains its intentionally wider
value domain.

TypeScript projection now requires set equality between descriptor roots plus version selector and
the graph's selector roots. Every graph root must name a retained node, and the exact source-path
set must equal the program root set. Empty, extra, crossed-node and crossed-program images fail.

Retained repository declaration identity is now an ordered declaration list rather than an object
keyed by exported name. All overload signatures and the implementation retain distinct ids, while
an unrelated out-of-graph prefix remains invisible.

## Boundary and next action

No catalogue engine, transition reader, product authority, schema, API, storage, content, web or
protected-design byte landed. All retained author contracts remain required. Another genuinely
fresh independent review must reconstruct these four repairs before acceptance or implementation.
