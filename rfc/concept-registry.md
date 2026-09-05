# RFC: Concept registry — one cross-pack identity authority

- **Status:** draft — **returned by third fresh independent review on [[D2878]]–[[D2884]].** The
  second repair uses invented storage/run shapes and a reduced artifact digest; reads the migration
  population before its transaction; trusts stale restart receipts; omits the promised revision-file
  compiler; proves import anchors rather than consumption; and implements locale lowercasing rather
  than Unicode case folding. `make concept-registry-third-fresh-review` retains the full chain and
  passes 7/7 reproductions. Author repair, another fresh review and the process dependency precede
  implementation.
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
  evidence value/manifest authority for the authored-reference projection; implemented portable
  account-data export/deletion inventory. Account import is explicitly not a dependency.
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
  readonly previousDigest: `sha256:${string}` | null;
  readonly entries: readonly ConceptRegistryEntry[];
}

interface ConceptRegistryHead {
  readonly schemaVersion: 1;
  readonly digest: `sha256:${string}`;
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
ordering fail. Immutable revision bytes live at
`content/concepts/revisions/<sha256-hex>.json`; the filename must equal the canonical source-byte
SHA-256 digest. `content/concepts/current.json` is a closed `ConceptRegistryHead`, not a second copy.
The compiler walks `previousDigest` to `null`, refuses missing/cyclic/misnamed revisions, removed or
re-used IDs and retired-to-active transitions, then returns a deeply frozen current
`ConceptRegistry` plus exact historical resolver. Server, Pack Studio and web wire consume that
compiled catalogue or a typed projection from it, never read/parse either file independently.

The initial entry ID set is exactly the set referenced by all official and community pack documents
at the implementation commit. Counts are printed by the generator but not hard-coded in the RFC.
Existing author-written slugs seed labels by a deterministic slug-to-words transform; every label is
reviewed in the same content change before publication. The transform makes no chess claim. No note,
definition, category, valence or teaching advice is generated.

### 1.1 Lifecycle

An active ID may become `retired` only in a new revision; it is never deleted, re-used or
reactivated. Retirement prevents new official pack references. Renaming a label likewise publishes
a new revision and does not change the stable ID. An exact historical `ConceptRef` always renders
the label/status from its named revision; an explicitly typed current-catalogue projection may show
the current label alongside it but may not overwrite history. Changing an ID means adding a new ID
and an explicit separately reviewed content migration; aliases and silent normalization are absent
in v1. Unknown or unverifiable legacy IDs never become ad-hoc retired entries.

## 2. One compiler and consumer closure

`compileConceptRegistry(headBytes, revisionFiles)` is the only mint. Both the head and every
revision pass the repository's duplicate-key-refusing JSON parser, exact-key grammar, Unicode-scalar
validation and canonical-byte equality check before any digest is computed. Byte limits are UTF-8
byte limits, not JavaScript string lengths. It returns the schema version,
current digest, ordered current entries, exact revision lookup, `required(id)`, `has(id)` and
active/retired projections. No fallback resolver and no `pack:<id>#<raw>` constructor remain in
production registered-concept paths.

The checked landing-consumer set is exactly six:

1. pack lint and publication validation;
2. Pack Studio concept picker/validation;
3. progress `ConceptResolver` and `attempt_concepts` write path;
4. related-attempt cross-pack query;
5. account export validation;
6. web/API parsers that render concept labels.

Two successor discharges are declared separately and must be absent at this landing:

7. Campaign catalogue projection, owned by `campaign-catalogue-progression.md`;
8. Skills taxonomy/credit join, owned by `skills.md`.

The compiler test consumes an exact committed TypeScript import graph compiled with the same
repository-snapshot and compiler authority as `shared-resource-register-bootstrap`; it does not
accept a caller-supplied consumer-name array.
It scans imports and fails a duplicate import edge, second ID/label map, direct JSON parser, local
fallback, unregistered display transform, a missing/extra landing consumer or either successor
importing a local registry. The closure receipt records the exact repository commit and ordered
consumer paths. Successor contracts later replace their discharge with an import of this exact
public projection; they do not widen the first landing's consumer count. Callers carry
`ConceptRef`:

There is no second ID/label map: the compiled registry is the only identity-and-label authority.

```ts
interface ConceptRef {
  readonly id: ConceptId;
  readonly registrySchemaVersion: 1;
  readonly registryDigest: `sha256:${string}`;
}
```

Historical rows additionally retain their originating pack/run identity; a `ConceptRef` never
claims occurrence by itself. `parseConceptRef` accepts exactly the three displayed keys, validates
the slug, schema literal and full lowercase SHA-256 digest, copies the values and recursively seals
the result before lookup. Resolvers never retain or return a caller object.

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

The claimed migration is a storage operation, not a row mapper with authority arguments. Its only
inputs are the open application database, the exact compiled registry and an optional test-only
fault point. It starts `BEGIN IMMEDIATE`, reads `attempt_concepts` joined to the stored `attempts`
row and `drill_runs.snapshot_json`, reconstructs the run with the runtime's exact replay/parser,
and resolves `pack_digest` only through `PackRegistry.byDigest` over built-in artifacts plus the
validated `registered_packs` inventory loaded by Pack Studio. No public function accepts pack JSON,
an attempt object, a run object, a concept population or a pre-minted occurrence receipt.

The migration creates a registered table and a separate
`attempt_concept_legacy` quarantine; only the former is a `ConceptRef` source:

1. validates the exact concept registry artifact/digest expected by the application build;
2. reads every `attempt_concepts` row joined to its exact attempt and parsed run snapshot in
   canonical primary-key order, retaining run, branch, pack ID and pack digest;
3. resolves that digest through the immutable built-in/registered-pack artifact inventory and
   parses only the exact legacy `pack:<packId>#<rawId>` grammar;
4. writes `concept:<id>@1`, exact `ConceptRef`, occurrence pack digest and revision-time label only
   when the exact historical pack document contains `rawId`;
5. moves malformed, unknown, mismatched, unavailable-artifact or concept-absent rows to
   `attempt_concept_legacy` with raw key/label and a closed reason. Quarantine rows render as
   unverified history but are excluded from related attempts, Campaign and Skills;
6. refuses key collisions or injected write failures and rolls back all changes;
7. writes the migration/version receipt only after set-equality over the canonical input primary
   keys versus the disjoint registered-plus-quarantine output, exact foreign-key occurrences and
   exact input/partition digests. On restart, the receipt is returned only when the recomputed
   input digest agrees; changed input fails startup rather than silently re-running or widening.

Fresh databases write only registered global keys. Mixed-version reads are forbidden; the
application refuses startup if storage version and registry/migration receipt disagree. Account
export writes typed concept refs with pack/run occurrence and exact revision digest, and separately
exports quarantined legacy rows without promoting them. Account/run deletion retains existing FK
behavior and removes no registry revision. A future portable-account-import RFC must resolve every
exact revision before insertion and preserve quarantine; this RFC adds and claims no restore
operation.

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

Ordinary learners never configure the registry. Pack cards and later Campaign receive label/id/
digest through typed projections. Advanced authoring shows ID, status, registry digest and
validation errors. If the current artifact is missing, invalid or digest-mismatched, pack
publication and dependent projections abstain with a typed reason. An exact historical ref resolves
from its immutable named revision; if that revision is absent, it renders its stored occurrence-time
label plus “registry revision unavailable” and never silently substitutes the current label or
disappears.

## 7. Refusals

- no second registry inside Campaign, Skills, Pack Studio or web;
- no pack-scoped identity fallback;
- no schema enum copied from current entries;
- no free-text concept creation during pack publication;
- no deletion/re-use of retired IDs;
- no fuzzy merge, alias guess or LLM taxonomy;
- no migration that partially rewrites rows;
- no use of a quarantined legacy attribution as registered evidence;
- no account-import claim hidden inside export validation;
- no claim that registry membership establishes chess truth or learner ability.

## Fresh independent review return — 2026-09-04

The first author pass is returned on [[D2661]]–[[D2666]]. Its migration-order target still asserts
the superseded register position and currently fails 2/7 while the index says it passes; criterion
12 does not enroll that target in either local or GitHub verification. Exact-digest refs cannot
survive allowed label/status edits without immutable registry revision bytes and a label-authority
rule. The legacy row contains no historical pack digest/version/concept snapshot, so matching its
two pack-id strings cannot prove that the pack referenced the concept. The exact eight-consumer
criterion also requires draft Campaign/Skills consumers before their own RFCs land, and the account
dependency explicitly excludes the restore operation criterion 10 requires. Exact receipt:
`planning/concept-registry/fresh-independent-buildability-review-2026-09-04.md`.

The first author repair closes all six findings without broadening identity into chess meaning. The
current 50-pack/199-reference/168-ID corpus census is grammar-clean and is retained as reach
evidence, not used to hide the contract defects. `make concept-registry-author-repair` retains the
corrected baseline and executes six repair groups; another genuinely fresh review is required.

| Finding | Exact author-repair owner |
|---|---|
| [[D2661]] | maintained author target and live migration-order assertion |
| [[D2662]] | immutable registry revisions and historical/current label authority |
| [[D2663]] | occurrence-backed legacy migration or explicitly unverified attribution |
| [[D2664]] | present consumer closure plus successor discharge protocol |
| [[D2665]] | repaired target enrollment in the standard local/GitHub governance gate |
| [[D2666]] | exact account-restore ownership or an honest export-only boundary |

## Second fresh independent review return — 2026-09-05

The first repair is returned on [[D2709]], [[D2710]], [[D2711]], [[D2712]], [[D2713]], [[D2714]],
[[D2715]] and [[D2716]]. Publication accepts ambiguous/noncanonical revision bytes and invalid
entry values; resolved refs remain mutable. Arbitrary caller pack JSON and matching plain
attempt/run objects mint the two authorities migration trusts. The migration operates one row at a
time without an atomic lossless population receipt, and the consumer “census” is a deduplicated
caller string array rather than a repository import graph.

`make concept-registry-second-fresh-review` retains all 13 predecessor controls and passes 8/8 new
falsifiers. Exact receipt:
`planning/concept-registry/second-fresh-independent-buildability-review-2026-09-05.md`. A bounded
author repair and another genuinely fresh review remain mandatory; no production schema,
registry, migration or consumer work is authorized.

## Second author repair — 2026-09-05

The bounded repair closes [[D2709]]–[[D2716]] at the requirements tier. Revision and ref parsing now
reject duplicate/unknown keys, noncanonical bytes, invalid UTF-8 byte bounds, invalid Unicode
scalars and mutable caller identity. The executable migration no longer accepts separately minted
pack or occurrence objects: one transaction reads stored attempt/run rows, parses the snapshot and
resolves the exact pack digest through the installed artifact inventory. Registered and quarantine
rows form a disjoint set-equal partition, any collision or injected failure rolls back, and an exact
receipt governs restart.

Consumer closure is derived from a committed TypeScript import graph. Missing, extra and duplicate
imports plus a local pack-scoped resolver fail; the receipt records the repository commit rather
than echoing claimed consumer strings. `make concept-registry-second-author-repair` retains all 21
predecessor controls and passes eight new repair groups. Exact receipt:
`planning/concept-registry/second-author-repair-2026-09-05.md`. This remains contract evidence only;
another genuinely fresh review and the shared-resource bootstrap dependency precede implementation.

## Third fresh independent review return — 2026-09-06

The second repair closes its eight named findings but remains unbuildable on seven seams:

1. [[D2878]] — its SQL model invents `attempt_concepts.row_id`, and its four-key snapshot parser
   rejects the production `DrillRun` shape instead of consuming the runtime replay/parser;
2. [[D2879]] — it hashes a reduced `{id, concepts}` projection as the pack digest, while production
   run occurrences name the digest of the complete pack document stored as `document_json`;
3. [[D2880]] — both the existing receipt and migration population are read before `BEGIN IMMEDIATE`,
   so the operation does not read its accepted preimage inside the transaction it claims;
4. [[D2881]] — restart compares only the legacy-row input digest and returns stored receipt JSON
   without revalidating the registry digest, installed artifacts or registered/quarantine outputs;
5. [[D2882]] — `compileConceptRegistry(headBytes, revisionFiles)` does not exist in the repair, so
   current-head parsing, filename/digest equality and missing/cyclic revision history remain untested;
6. [[D2883]] — consumer closure counts syntactic imports; six dead imports and zero consumer
   operations satisfy it, while re-exported or barrel-routed authority is not resolved; and
7. [[D2884]] — label uniqueness uses locale lowercasing, which accepts `Straße` and `STRASSE`
   although full Unicode case folding identifies them.

`make concept-registry-third-fresh-review` retains all predecessor reviews and repairs, then passes
7/7 executable falsifiers. Exact evidence:
`planning/concept-registry/third-fresh-independent-buildability-review-2026-09-06.md`. The RFC
remains draft and no production schema, registry, migration or consumer work is authorized.

## Acceptance criteria

1. The process prerequisite's absent root exists before this RFC declares `first lane 1`; first
   implementation atomically creates schema, exported version, head plus initial immutable revision,
   register landed row/digest and removes the live claim.
2. Schema/compiler crosses malformed IDs, duplicates, label collisions, ordering, extra keys,
   invalid Unicode, active/retired, canonical digest, missing/cyclic history, ID deletion/re-use and
   retired reactivation controls. Label rename and retirement retain exact old-ref rendering.
3. Current pack references and registry active/retired IDs are set-equal under the declared legacy
   policy; unknown pack refs fail lint and publication.
4. Import census proves exactly one compiler and the six landing consumers; a copied map, JSON
   parser, fallback, missing/extra live consumer or premature Campaign/Skills implementation fails.
5. `pack.authored.concept_reference@1` retains pack/digest/concept registry identity and rejects
   caller objects, wrong digests and claims beyond identity.
6. The same concept across multiple packs stores one key with distinct occurrence rows; different
   IDs never merge.
7. Migration success, globally-valid-but-pack-absent ID, unavailable historical pack, malformed
   legacy, unknown ID, pack mismatch, key collision, injected failure, restart and mixed-version
   startup fixtures are atomic and deterministic. Registered plus quarantined outputs are a
   lossless partition, and quarantine never enters registered consumers.
8. `same_concept` returns cross-pack rows and the old `same_concept_in_pack` wire token is rejected
   across runtime/server/client fixtures.
9. Pack Studio picker, keyboard/screen-reader operation, retired display and publication errors use
   the compiled registry and never allow an arbitrary string.
10. Export/delete round trips exact refs, quarantined legacy rows and historical retired labels;
    unavailable historical revision produces typed abstention without erasing rows. No account
    import/restore route or claim is added by this RFC.
11. Campaign and Skills remain explicit successor discharges; dependency tests fail either local
    registry now and, when their accepted RFCs land, require the same `ConceptRef` while proving
    sighting is not credit.
12. `make verify` plus the focused author/implementation contract runs in the local and GitHub
    governance gate; no real corpus assertion enters the generic software tier except the separate
    content set-equality check.

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
