# RFC: Import-source protocol shared-resource registration

- **Status:** implemented 2026-09-24 at the owner's direction to build ready RFCs without further
  review rounds (the fresh review was not run). The descriptor/claim vocabulary was corrected to the
  implemented bootstrap (see Changelog): `import-source-protocol` is one `members` row read by the
  existing `string_tuple` reader over a present `IMPORT_SOURCE_PROTOCOL_MEMBERS` tuple seeded with
  the four shipped request/source members, with its checked README register; `live-sources.md`
  claims the broadcast pair. Receipt: `planning/import-source-protocol-register/implementation-2026-09-24.md`.
  Previously: draft — first author pass 2026-09-06
- **Author:** Codex
- **Created:** 2026-09-06
- **Design refs:** none; this is repository process and changes no learner behavior
- **Exploration gate:** [[D2278]] reproduced the request/source vocabulary as hand-copied across
  server REST/service/storage/export and web API/client while `live-sources` falsely called it
  server-local
- **Depends on:** implemented `shared-resource-register-bootstrap.md` (catalogue + checker)
- **Parent / amends:** RFC-0000 rule 7, `rfc/README.md`, `rfc/live-sources.md`
- **Planning:** `planning/import-source-protocol-register/`

```tabiya-claims
none
```

```tabiya-resource-roots
import-source-protocol | members/string_tuple@present | packages/runtime/src/import-source-protocol.ts#export:IMPORT_SOURCE_PROTOCOL_MEMBERS | none
```

```tabiya-resource-descriptor-source
rfc/shared-resource-registers.json#import-source-protocol
```

## Implemented contract (2026-09-24)

This section is the active contract; §§1 and 3 below describe the withdrawn
`canonical_resource@1`/`absent`/lane vocabulary and are retained as the drafted intent they were.

1. `rfc/shared-resource-registers.json` gains exactly one `import-source-protocol` row with claim kind
   `members` and source `{ kind: "string_tuple", path: "packages/runtime/src/import-source-protocol.ts",
   exportName: "IMPORT_SOURCE_PROTOCOL_MEMBERS" }`. The historical
   `planning/import-source-protocol-register/catalogue-additions.v1.json` is evidence only.
2. The member grammar is `request_<ImportSource.kind>` and `source_<imported_games.source_kind>`. One
   tuple carrying both faces is how this row keeps the atomicity §2 asks for: a request kind cannot
   be added without editing the same tuple its durable kind lives in, and both faces are derived
   from it (`ImportSourceRequestKind`, `ImportSourceKind`, `IMPORT_SOURCE_REQUEST_KINDS`,
   `IMPORT_SOURCE_KINDS`).
3. The source is present before the row is admitted and is seeded with the four members the shipped
   importer already used — `request_lichess`, `request_pgn`, `source_lichess_url`,
   `source_pgn_paste` — each with a Landed row crediting `archive/game-import-and-story.md` (the
   evidence-kinds precedent for pre-register members). Absent-source admission ([[D3082]]) is not built.
4. The copies [[D2278]] counted now derive: the server resolver's `ImportSource` and
   `ResolvedImportSource.sourceKind`, the storage `ImportedGameRecord.sourceKind`, and the web API's
   `ImportedGameRecord.sourceKind`/`ImportGameRequest.source`. SQL cannot import TypeScript, so
   `apps/server/src/import-source-protocol.test.ts` requires the running `imported_games` CHECK to equal
   the `source_` face and the REST parser to admit every `request_` member and refuse another kind.
5. `live-sources.md` claims `import-source-protocol | members request_broadcast, source_lichess_broadcast`.
   A lane claim, a hyphenated member, a renamed resource and a second claimant of the same member all
   fail through the generic checker (`tools/register-check.test.mjs`).
6. Existing catalogue rows and registers are byte-identical apart from the appended row/section; the
   generic checker receives no resource-name branch.

The same landing fixes ledger [[D959]] at the import boundary this resource names: the `pgn` request
arm is bounded to the shared 64 KiB limit before any work and then re-serialized through the shipped
`stripPgnAnnotations`, so a pasted game stores and exports headers and moves only, exactly as the
lichess arm has since [[D410]]. The licence note says `annotations stripped`.

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
| D1 | generic bootstrap accepted and implemented | `shared-resource-register-bootstrap.md` | archived bootstrap receipt | **2026-09-24** — the catalogue and catalogue-driven checker are implemented; this RFC needs only the parser and C1–C8 |
| D2 | descriptor/additions/register marker implemented and checked | `import-source-protocol-register.md` | this RFC's implementation commit plus RFC/register/log closeout | **2026-09-24** — present `members` row, seeded tuple, README register and census; see `planning/import-source-protocol-register/implementation-2026-09-24.md`. Log closeout and Active-row flip are left to the consolidating session |
| D3 | product version 1 created under exact first-lane claim | `live-sources.md` | its accepted implementation | |

## Open questions

None. Product semantics stay in `live-sources.md`; this is the mechanical registration required by
[[D2278]].

## Changelog

- 2026-09-24: implemented (claude) at the owner's direction, with one genuine-defect correction inline:
  the draft assumed a `sequential/canonical_resource@1` adapter, an `absent` introduction and a
  `first lane 1 | whole projection` claim grammar, none of which exist in the implemented
  `shared-resource-register-bootstrap`. As `provider-protocol-register.md` did the same day, the row is
  the implemented `members`/`string_tuple` shape over a present source. Unlike that precedent the tuple
  is seeded rather than empty, because the four members it names already ship and [[D2278]]'s copies
  can derive from it now; `live-sources.md` claims only the broadcast pair. [[D959]] fixed in the
  same landing (pasted PGN stripped at the record boundary).
- 2026-09-06: drafted from [[D2278]] and the generic bootstrap contract.
