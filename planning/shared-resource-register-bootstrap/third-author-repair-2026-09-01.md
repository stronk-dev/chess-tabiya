# Shared-resource register bootstrap — third author repair

- **Date:** 2026-09-01
- **Repairs:** [[D2488]]–[[D2494]]
- **Status:** author repair complete; another fresh independent review is required
- **Executable receipt:** `make shared-resource-bootstrap-third-author-repair` — 8/8 green

## What changed

The central descriptor is now literal rather than suggestive. The RFC defines the exact closed
`SharedResourceProjectionV1` union and lifecycle/adapter/claim-mode compatibility table. The full
ten-resource bootstrap image is checked in at `initial-catalogue.v1.json` and is set-equal to the
ten-row `tabiya-resource-roots` block.

Selector population now produces four typed outcomes: absent, partial, invalid and landed. A
transition receives those outcomes directly, so an adapter error cannot be reinterpreted as
absence. The missing adapter normal forms are closed before canonical byte encoding: migrations
retain decoded SQL literals in their TypeScript apply graph; literal unions are sorted member
sets; versioned declarations are recursively canonical literal objects. The TypeScript adapter
now names every repository edge class and closes Node builtin, TypeScript library and external
package boundaries against their pinned identities.

The README boundary returns to the implemented parent's decision: check, do not generate. The
checker owns no README bytes and must preserve unrelated prose. The sixteen able-to-fail families
remain mandatory implementation acceptance tests, but fresh pre-acceptance review now executes a
bounded author contract rather than pretending the unimplemented engine exists.

## Verification

- `make shared-resource-bootstrap-third-author-repair` — 8/8
- `make shared-resource-bootstrap-second-author-repair` — 8/8
- `make shared-register-reconciliation-author-repair` — 6/6

## Boundary

No catalogue runtime, register engine, README register section, product authority, schema, API,
storage, content or web bytes changed. This is an author repair only. It does not accept the RFC or
authorize implementation.
