# RFC: Import-source protocol shared-resource registration

- **Status:** draft — first author pass 2026-09-06; fresh independent review and owner acceptance
  of the generic bootstrap are required before implementation
- **Author:** Codex
- **Created:** 2026-09-06
- **Design refs:** none; this is repository process and changes no learner behavior
- **Exploration gate:** [[D2278]] reproduced the request/source vocabulary as hand-copied across
  server REST/service/storage/export and web API/client while `live-sources` falsely called it
  server-local
- **Depends on:** accepted and implemented `shared-resource-register-bootstrap.md`
- **Parent / amends:** RFC-0000 rule 7, `rfc/README.md`, `rfc/live-sources.md`
- **Planning:** `planning/import-source-protocol-register/`

```tabiya-claims
none
```

```tabiya-resource-roots
import-source-protocol | sequential/canonical_resource@1/absent | packages/runtime/src/import-source-protocol.ts#export:IMPORT_SOURCE_PROTOCOL_RESOURCE | none
```

```tabiya-resource-descriptor-source
planning/import-source-protocol-register/catalogue-additions.v1.json
```

## Summary

This process RFC registers one absent canonical shared resource for the complete game-import source
boundary. The product resource will atomically own request kinds, durable source kinds, closed
resolution/error discriminants, broadcast choice/receipt fields, digest domains and external
resource limits. `live-sources.md` creates version 1 under the unique first-lane-1 whole-projection
claim.

This document adds only catalogue/register data. It does not create product types, widen a REST
route, change SQL, fetch a URL or choose any product semantic. All projection, claim, collision,
digest and landing behavior comes unchanged from the generic bootstrap.

## 1. Exact descriptor

| field | value |
|---|---|
| id | `import-source-protocol` |
| lifecycle | `sequential` |
| projection adapter | `canonical_resource@1` |
| claim mode | `whole_projection` |
| introduction | `absent` |
| owned selector | `packages/runtime/src/import-source-protocol.ts#export:IMPORT_SOURCE_PROTOCOL_RESOURCE` |
| introduced by | `import-source-protocol-register.md` |

Absence means the exact export selector does not resolve. A file with unrelated exports remains
absent; a malformed export is invalid. Once a landed row exists, deletion or rename is a
regression, never a return to legitimate absence.

The human register marker is `import-source-protocol head=absent`, with header-only Landed and
Live-claims tables. This transition carries no product claim. After it lands,
`live-sources.md` must carry exactly:

```text
import-source-protocol | first lane 1 | whole projection
```

## 2. Scope boundary

The root is deliberately one resource rather than separate request/result/source-kind roots.
Those fields change as one protocol: adding `broadcast` without its choice/refusal results or
adding `lichess_broadcast` without its storage/export member is precisely [[D2278]]. One atomic
projection makes partial widening a digest change that cannot land.

The root does not absorb repertoire-source vocabulary. Repertoire import is a different operation
with `lichess_study` and no game/broadcast choice or Story hand-off. If later work proves shared
semantics, it must do so through a new measured claim, not a name collision.

## 3. Acceptance criteria

1. The additions artifact validates under the generic descriptor schema and introduces exactly
   one absent `sequential/canonical_resource@1` root with whole-projection claims.
2. Applying it to the initial catalogue produces one unique `import-source-protocol` descriptor;
   duplicate id, wrong selector, non-absent introduction, member-set lifecycle or partial claim
   mode each fails.
3. At the pre-product tree the exact selector is absent and `make register-check` accepts the
   header-only marker. A fabricated landed head or live claim fails.
4. After this process RFC is implemented, a fixture copy of `live-sources.md` with no claim fails;
   the exact first-lane-1 claim passes; a second claimant, lane 2, wrong mode or changed resource
   name fails.
5. Existing catalogue descriptors and register rows remain byte-identical apart from the one
   appended descriptor/marker; the generic checker receives no resource-name branch.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | generic bootstrap accepted and implemented | `shared-resource-register-bootstrap.md` | archived bootstrap receipt | |
| D2 | descriptor/additions/register marker implemented and checked | `import-source-protocol-register.md` | this RFC's implementation commit plus RFC/register/log closeout | |
| D3 | product version 1 created under exact first-lane claim | `live-sources.md` | its accepted implementation | |

## Open questions

None. Product semantics stay in `live-sources.md`; this is the mechanical registration required by
[[D2278]].

## Changelog

- 2026-09-06: drafted from [[D2278]] and the generic bootstrap contract.
