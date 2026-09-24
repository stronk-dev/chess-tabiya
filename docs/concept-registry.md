# Concept registry

Implemented by [`rfc/concept-registry.md`](../rfc/concept-registry.md) at storage migration 28. The
registry is the one cross-pack identity authority for pack `concepts[]`: an id means the same idea
in every pack, and nothing else in the tree mints, renames or categorises one.

It states only that an authored vocabulary entry exists. It carries no valence, category, definition,
difficulty, evidence predicate, teaching prose or learner claim. A pack referencing a concept is not
a sighting of it on the board, and a sighting is not a skill credit.

## Files and grammar

| Path | What it is |
|---|---|
| `content/concepts/revisions/<sha256-hex>.json` | one immutable revision; the filename is the SHA-256 of the file's bytes |
| `content/concepts/current.json` | the closed head `{ "digest", "schemaVersion": 1 }` naming the current revision |
| `schemas/concept_registry.schema.json` | the revision grammar (`$defs/head` for the head); lane `concept-registry-schema` in `rfc/README.md` |

A revision is `{ schemaVersion: 1, previousDigest, entries[] }` with entries `{ id, label, status }`
sorted by id. Ids are lower-case slugs (`^[a-z0-9]+(?:-[a-z0-9]+)*$`, at most 80 UTF-8 bytes); labels
are trimmed 1–100-byte strings; status is `active` or `retired`. Bytes are canonical: sorted keys,
two-space indentation and one trailing newline, so a duplicate JSON key, reordered key or different
spacing fails.

Ids and label-collision keys are unique within a revision. `labelCollisionKeyV1` is NFKC, ECMA-262
default lower-casing, `ß → ss`, `ς → σ`, then NFC, pinned to Unicode data 17.0; a runtime reporting
other Unicode data refuses to compile the registry.

## The compiler

`compileConceptRegistry(headBytes, revisionFiles)` in `packages/runtime/src/concept-registry.ts` is
the only parser and mint. It validates UTF-8, Unicode scalars, exact keys, byte bounds and canonical
bytes; walks `previousDigest` to `null`; refuses a missing, misnamed or orphan revision; and refuses
an id removed or a retired id reactivated by a later revision. Its output is deeply frozen and
recorded in a module-private `WeakSet`: every consumer calls `assertCompiledConceptRegistry`, so an
object that merely carries a valid digest is refused.

`apps/server/src/concept-registry-loader.ts` is the server's single reader of `content/concepts/`
and compiles it once per process (`installedConceptRegistry()`). The web never compiles a registry; it
strictly parses the server's typed projections (`parseConceptCatalogueView`,
`parseConceptLabelView`).

An exact historical `ConceptRef` (`{ id, registrySchemaVersion: 1, registryDigest }`) renders the
label and status of its named revision. If that revision is absent, the ref renders its stored
occurrence-time label marked `registry_revision_unavailable` and is never silently relabelled.

## Consumers

| Consumer | Operation |
|---|---|
| Pack lint and publication (`pack-validation.ts`, `make pack-check`, Pack Studio registration) | `validateConceptReferences` — unknown and retired-new ids are **errors**; a malformed id is the schema lint's `CONCEPT_KEY_NOT_SLUG` error |
| Pack Studio picker (`GET /packs/concepts`) | `conceptCatalogueView` — searchable, active entries only, retired shown for removal |
| Progress resolver (`RegisteredConceptResolver`) | `resolveRegisteredConcept` — writes `concept:<id>@1`, the exact ref and the pack digest as occurrence |
| Related attempts (`same_concept`) | `conceptLabelView` — cross-pack, filtered by learner, countable attempts and exact key |
| Account export validation | `parseConceptRef` — an exported row's key must agree with its ref |
| Web client (`lib/api.ts`) | `parseConceptCatalogueView` |

`apps/server/src/concept-registry-closure.test.ts` proves each of the six is a live, symbol-resolved
call reached from the real entry (`apps/server/src/main.ts`; `apps/web/src/main.ts → App.svelte →
lib/api.ts`), under each project's own TypeScript configuration, with its result used. The skills
section on `/profile` reads concept identity only through the identity-only evidence projection
`pack.authored.concept_reference@1`, and lists a concept as a candidate leaf only when at least two
installed packs name it.

## Storage (migration 28)

`attempt_concepts` holds only registered rows: `concept_key` (`concept:<id>@1`, checked against
`concept_id`), `registry_schema_version`, `registry_digest`, the revision-time `label`, and the
occurrence `pack_id`/`pack_digest`. `attempt_concept_legacy` is the quarantine for rows the registry
cannot vouch for, with a closed reason (`malformed_legacy_key`, `pack_mismatch`,
`artifact_unavailable`, `artifact_invalid`, `concept_absent_from_pack`, `unknown_concept`, and
`unregistered_at_projection` for a stored pre-registry pack's unregistered id). Quarantined rows
export as unverified history and never enter related attempts, Campaign or Skills.
`concept_registry_migration` holds the single canonical migration receipt.

The storage constructor is the coordinator. It completes migrations 1–27, then runs the concept
phase in its own `BEGIN IMMEDIATE`: it reads every legacy row with its attempt and stored run,
replays the run, resolves the exact complete-document pack digest through a sealed artifact snapshot
(the build's built-in packs plus stored registered/playtest packs, each digest recomputed and each
stored document validated), writes both populations and the receipt, stamps version 28 and commits.
The data operation receives a frozen repository with no SQL, transaction or pragma surface. Any
failure rolls everything back to version 27 (restartable), closes the database and rejects before a
storage object exists. A legacy population without the build's artifact inventory is refused rather
than quarantined wholesale.

Every later open verifies the receipt strictly (exact keys, canonical bytes, stored digest), requires
the migrated revision and every revision a stored row names to be in the installed registry's history,
and checks each registered key against its id. A version-28 database without a receipt is a
mixed-version database and refuses startup.

## Changing the registry

- Adding ids: reference them from a pack, run `make concept-registry-revise`, review every seeded
  label in the same content change, then `make concept-registry-census`.
- Renaming a label or retiring an id: write a new revision by hand with the same ids, then point
  `current.json` at it. Never delete or re-use an id; never reactivate a retired one.
- Changing the grammar, the collision rule or its Unicode version claims the next
  `concept-registry-schema` lane.
