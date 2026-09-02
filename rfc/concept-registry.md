# RFC: Concept registry — one cross-pack identity authority

- **Status:** draft 2026-08-31 — first author pass on [[D300]], [[D700]] and [[D2370]]. The product
  schema claim remains intentionally absent until `shared-resource-register-bootstrap.md` lands the
  absent root. No implementation before fresh independent review and accepted process dependency.
- **Author:** codex, factored from `rfc/skills.md` §4 and the D300/D700 measurements.
- **Created:** 2026-08-31
- **Design refs:** `design/01-training-model.md` §§60–65 (registry belongs to authoring);
  `design/06-campaign.md` §§368–397 (catalogue ruling).
- **Research refs:** `design/research/fun-mechanics-outside-roguelikes.md` D4;
  `design/research/ux-after-the-run.md` §4.3; `planning/skills/full-depth-derivation.md`.
- **Exploration gate:** [[D300]] measured the split identity and named the injectable seam; [[D1151]]
  made a global vocabulary a ruled Campaign prerequisite; [[D2370]] identifies the missing shared
  resource authority.
- **Depends on:** accepted and implemented `shared-resource-register-bootstrap.md`; accepted
  evidence value/manifest authority for the authored-reference projection; portable account data.
- **Parent / amends:** `skills.md` §4 (ownership transfers here), progress concept resolver and
  related-attempt query; no protected design byte.
- **Planning:** `planning/concept-registry/rfc-derivation-2026-08-31.md`.

```tabiya-claims
migration | position behind pack-capability-contract | rewrite attempt_concepts pack-scoped keys to registered global concept identities and canonical labels; fail closed on unknown or colliding legacy rows
```

**Proposed after the process prerequisite lands; not a live claim yet:**

```text
concept-registry-schema | first lane 1 | $id and exported version; closed registry document and entry grammar; active/retired identity lifecycle
```

## Summary

This RFC turns pack `concepts` from unrelated strings into one stable cross-pack vocabulary. It
adds a registered schema, one reviewed registry document, one compiler/digest, one global resolver,
publication and Pack Studio validation, an exact legacy-key migration, a source projection for
pack references, and set-equality checks over every consumer.

It deliberately does not create Skills or Campaign progression. Identity is the shared primitive:
Skills may later make grounded claims over it; Campaign may record that it appeared; pack cards may
say they contain an unseen registered entry. None may invent, rename or categorize it locally.

## 1. Shared schema and registry

After the absent root lands, this RFC changes its claims block atomically to the unique first-lane
claim and implements:

```ts
export const CONCEPT_REGISTRY_SCHEMA_VERSION = 1 as const;

interface ConceptRegistryDocument {
  readonly schemaVersion: 1;
  readonly entries: readonly ConceptRegistryEntry[];
}

interface ConceptRegistryEntry {
  readonly id: ConceptId;
  readonly label: string;
  readonly status: "active" | "retired";
}
```

`ConceptId` is a branded lower-case slug matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 1–80 bytes.
Labels are trimmed 1–100-byte authored display strings. IDs and case-folded labels are unique.
Entries sort by `id`; unknown keys fail; JSON duplicate keys, invalid Unicode and non-canonical
ordering fail. `content/concepts/registry.json` is validated against
`schemas/concept_registry.schema.json`, compiled to a deeply frozen `ConceptRegistry`, and sealed by
the canonical source-byte SHA-256 digest. Server, Pack Studio and web wire consume the compiled
artifact or a typed projection from it, never read/parse the file independently.

The initial entry ID set is exactly the set referenced by all official and community pack documents
at the implementation commit. Counts are printed by the generator but not hard-coded in the RFC.
Existing author-written slugs seed labels by a deterministic slug-to-words transform; every label is
reviewed in the same content change before publication. The transform makes no chess claim. No note,
definition, category, valence or teaching advice is generated.

### 1.1 Lifecycle

An active ID may become `retired`; it is never deleted or re-used and its label remains available
for historical rows. Retirement prevents new official pack references but preserves old pack/run/
export rendering. Renaming a label does not change identity. Changing an ID means adding a new ID
and an explicit separately reviewed content migration; aliases and silent normalization are absent
in v1. Unknown legacy IDs fail migration rather than becoming ad-hoc retired entries.

## 2. One compiler and consumer closure

`compileConceptRegistry(sourceBytes)` is the only mint. It returns the schema version, digest,
ordered entries, `required(id)`, `has(id)` and active/retired projections. No fallback resolver and
no `pack:<id>#<raw>` constructor remain in production.

The checked consumer set is:

1. pack lint and publication validation;
2. Pack Studio concept picker/validation;
3. progress `ConceptResolver` and `attempt_concepts` write path;
4. related-attempt cross-pack query;
5. Campaign catalogue projection;
6. Skills taxonomy/credit join;
7. account export/restore validation;
8. web/API parsers that render concept labels.

The compiler test scans imports and fails a second ID/label map, direct JSON parser, local fallback,
unregistered display transform or consumer absent from this list. Callers carry `ConceptRef`:

There is no second ID/label map: the compiled registry is the only identity-and-label authority.

```ts
interface ConceptRef {
  readonly id: ConceptId;
  readonly registryVersion: 1;
  readonly registryDigest: `sha256:${string}`;
}
```

Historical rows additionally retain their originating pack/run identity; a `ConceptRef` never
claims occurrence by itself.

## 3. Pack authoring and evidence reference

The drill-pack schema remains unchanged: an ID is already a non-empty string. Validation closes at
two stronger boundaries:

- lint upgrades unknown/malformed/retired-new-reference from warning to error;
- official/community publication resolves every `concepts[]` item against the exact installed
  registry and records its digest in the validation receipt.

Pack Studio uses an accessible searchable picker over active entries, displays labels with IDs,
and does not offer arbitrary strings. Existing source JSON keeps the stable IDs, not duplicated
labels.

F1 gains one authored-reference projection:

```text
pack.authored.concept_reference@1
{ packId, packDigest, concept: ConceptRef }
```

Its grounding is `authored_claim`, exactness `authored`, and allowed answer content is identity only.
It states “this pack references this registered concept,” never that the concept occurs on a board,
that the learner demonstrated it, or that it is desirable. The adapter accepts only a validated
pack plus the exact registry compiler output. This projection is the Campaign/Skills input; neither
parses pack JSON directly.

## 4. Global resolver and migration

`RegisteredConceptResolver` replaces `PackScopedConceptResolver` as the production default:

```ts
resolve(packId, raw) {
  const entry = registry.required(raw);
  return { key: `concept:${entry.id}@1`, label: entry.label, ref: registry.ref(entry.id) };
}
```

`packId` remains an occurrence operand, not part of concept identity. Tests prove the same ID in
six packs produces one key and six exact pack occurrences, while two different IDs with equal-
looking substrings never merge.

The claimed migration runs in one transaction:

1. validates the exact concept registry artifact/digest expected by the application build;
2. reads every `attempt_concepts` row in canonical primary-key order;
3. parses only the exact legacy `pack:<packId>#<rawId>` grammar and verifies stored `pack_id`;
4. resolves `rawId`, writes `concept:<id>@1` plus canonical label;
5. refuses malformed, unknown, retired-without-existing-reference, digest-mismatched or colliding
   rows and rolls back all changes;
6. writes the migration/version receipt only after set-equality over pre/post row identities.

Fresh databases write only global keys. Mixed-version reads are forbidden; the application refuses
startup if storage version and registry/migration receipt disagree. Export writes typed concept refs,
pack/run occurrence and registry digest. Restore resolves all refs or refuses before inserting any
row. Account/run deletion retains existing FK behavior and removes no registry entry.

The related-attempt query becomes `same_concept` and removes `a.pack_id = ?`; it still filters by
learner, countable attempts and exact concept key. API/client union changes in the same commit, with
the old `same_concept_in_pack` token rejected rather than silently re-meant.

## 5. Honesty boundary

The registry says only that an authored vocabulary entry exists. It cannot carry:

- positive/negative valence, skill tier, mastery, difficulty or rarity;
- evidence predicates, move grades or thresholds;
- category assignment or learner-facing teaching prose;
- per-learner counts, recommendation priority or unlock rules;
- LLM-generated definition, synonym or merge.

Skills owns any future grounded learner claim and must cite its own valence/evidence authority.
Campaign owns binary exposure and must link to the preserved occurrence. A concept referenced by a
pack but never reached is not a sighting. A concept sighting is not a skill credit. This separation
is enforced in types and dependency tests, not only prose.

## 6. UX and availability

Ordinary learners never configure the registry. Pack cards and Campaign receive label/id/digest
through their typed projections. Advanced authoring shows ID, status, registry digest and validation
errors. If the artifact is missing, invalid or digest-mismatched, pack publication and dependent
Campaign/Skills projections abstain with a typed reason; existing historical rows render their
stored canonical label plus “registry unavailable” and never disappear.

## 7. Refusals

- no second registry inside Campaign, Skills, Pack Studio or web;
- no pack-scoped identity fallback;
- no schema enum copied from current entries;
- no free-text concept creation during pack publication;
- no deletion/re-use of retired IDs;
- no fuzzy merge, alias guess or LLM taxonomy;
- no migration that partially rewrites rows;
- no claim that registry membership establishes chess truth or learner ability.

## Acceptance criteria

1. The process prerequisite's absent root exists before this RFC declares `first lane 1`; first
   implementation atomically creates schema, exported version, registry artifact, register landed
   row/digest and removes the live claim.
2. Schema/compiler crosses malformed IDs, duplicates, label collisions, ordering, extra keys,
   invalid Unicode, active/retired and canonical digest controls.
3. Current pack references and registry active/retired IDs are set-equal under the declared legacy
   policy; unknown pack refs fail lint and publication.
4. Import census proves exactly one compiler and the eight declared consumer families; a copied map,
   JSON parser or fallback fixture fails.
5. `pack.authored.concept_reference@1` retains pack/digest/concept registry identity and rejects
   caller objects, wrong digests and claims beyond identity.
6. The same concept across multiple packs stores one key with distinct occurrence rows; different
   IDs never merge.
7. Migration success, malformed legacy, unknown ID, pack mismatch, key collision, injected failure,
   restart and mixed-version startup fixtures are atomic and deterministic.
8. `same_concept` returns cross-pack rows and the old `same_concept_in_pack` wire token is rejected
   across runtime/server/client fixtures.
9. Pack Studio picker, keyboard/screen-reader operation, retired display and publication errors use
   the compiled registry and never allow an arbitrary string.
10. Export/delete/restore round trips exact refs and historical retired labels; unavailable registry
    produces typed abstention without erasing rows.
11. Campaign and Skills compile against the same `ConceptRef`; dependency tests fail either local
    registry and prove sighting is not credit.
12. `make verify` plus the focused author/implementation contract runs in local and GitHub software
    gates; no real corpus assertion enters the generic software tier except the separate content
    set-equality check.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Land the absent `concept-registry-schema` root and generic checker support | shared-resource-register-bootstrap | process archive receipt | |
| D2 | Author-review every initial canonical label without adding definitions or chess claims | OWNER | reviewed registry content commit | |
| D3 | Move `skills.md` §4 from owner to consumer and preserve its valence/taxonomy questions | codex | skills author-amendment commit | |
| D4 | Bind Campaign catalogue and Skills to the one compiled `ConceptRef` | codex | successor author/implementation contracts | |

## Open questions

No product choice remains in the identity layer. Labels are author-reviewed content; category,
valence, skill credit and Campaign presentation stay in their owning RFCs.
