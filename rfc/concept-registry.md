# RFC: Concept registry — one cross-pack identity authority

- **Status:** draft — **sixth fresh independent review returned the fifth repair on
  [[D2960]]–[[D2965]].** The claimed value-flow proof accepts counterfeit and dormant boundaries;
  project configuration is shallow-merged across server and web; artifact population identity is
  order-dependent; digest-shaped registry objects mint readiness; a failed post-commit composition
  can leak a valid ready token; and unsuccessful startup leaves the database open. `make
  concept-registry-sixth-fresh-review` retains the predecessor chain and passes 6/6 executable
  counterexamples plus strict TypeScript. Another bounded author repair, another genuinely fresh
  review and the independently-passed shared-resource bootstrap precede acceptance or implementation.
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
migration | position behind evidence-job-durability | rewrite attempt_concepts pack-scoped keys to registered global concept identities and canonical labels; fail closed on unknown or colliding legacy rows
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
Labels are trimmed 1–100-byte authored display strings. IDs and `labelCollisionKeyV1` values are
unique. The key is a versioned, locale-free build rule: validate Unicode scalar input; require the
supported runtime's pinned Unicode-data version `17.0`; apply NFKC, ECMA-262 default lowercasing,
the two explicit full-fold expansions `ß → ss` and `ς → σ`, then NFC. No locale-sensitive API or
host-default locale participates. This is deliberately the exact v1 collision rule, not a claim to
track an ambient or future Unicode case-fold table; changing the rule or Unicode-data version is a
registry-compiler version change with cross-platform fixtures.
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
repository-snapshot, dependency and compiler/config authority as
`shared-resource-register-bootstrap`; it does not accept a caller-supplied consumer-name array and
fails on every syntactic, semantic, resolution or options diagnostic before emitting a receipt.
Reachability starts at `apps/server/src/main.ts` and the web `main.ts → App.svelte → lib/api.ts`
entry chain, never an invented `client.ts`. Each of the six paths is paired with the exact public
operation it must call. TypeScript symbol resolution follows direct imports, aliases, barrels and
re-exports back to that operation's declaration. A call nested in a declaration is admitted only
when a reachable caller invokes that declaration and consumes the projection; an imported module,
unused/dead import or exported-but-uncalled helper therefore proves nothing.
The retained structural scan separately fails a duplicate import edge, second ID/label map, direct
JSON parser, local fallback, unregistered display transform, a missing/extra landing consumer or
either successor importing a local registry. The closure receipt records the exact repository
commit and ordered `path#operation` identities. Successor contracts later replace their discharge
with an import of this exact public projection; they do not widen the first landing's consumer
count. Callers carry
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

The application has one explicit recoverable two-phase startup instead of constructing a
service-ready `SQLiteRunStorage` before its migration authorities exist:

1. a bootstrap-only storage handle opens SQLite and completes/stamps the ordinary structural
   migrations through the concept migration's prerequisite version; it exposes only the exact
   hydration reads needed by Shape Studio and Pack Studio and cannot be passed to REST/services;
2. current shapes, principles, built-in packs and the concept registry compile; the bootstrap
   coordinator then starts one `BEGIN IMMEDIATE`, reads every stored registered/playtest pack,
   validates each complete document and recomputes its canonical digest, clones and recursively
   seals the complete built-in-plus-stored digest inventory, executes the concept data operation,
   validates/writes its receipt, stamps the concept `PRAGMA user_version`, and commits; and
3. only that successful commit mints `ReadyRunStorage`, from which Pack/Shape Studio and every
   service/server object are constructed. Any compilation, hydration, digest, migration, receipt,
   version-stamp or commit failure rolls back phase 2, leaves the prerequisite version restartable,
   closes the database, and makes `createApplication` reject before a server exists.

The claimed data migration is an operation invoked inside that already-open coordinator
transaction, not a row mapper and not a second transaction owner. Its only inputs are the open
transaction, exact compiled registry, the opaque sealed pack-artifact snapshot and an optional
test-only fault point. It asserts that the transaction is active but never issues `BEGIN`, `COMMIT`,
`ROLLBACK` or `PRAGMA user_version`. It reads `attempt_concepts` joined to the stored `attempts` row
and `drill_runs.snapshot_json`, reconstructs the run with the runtime's exact replay/parser, and
resolves `pack_digest` only through the sealed snapshot. `PackRegistry.byDigest` is not migration
authority. No public function accepts pack JSON, a caller-stamped digest, an attempt object, a run
object, a concept population or a pre-minted occurrence receipt.

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
7. writes the migration/version receipt only after set-equality over the canonical compound input
   keys versus the disjoint registered-plus-quarantine output, exact occurrence identities and
   exact input, registry-artifact, installed-pack-artifact and complete-output digests. On restart,
   it strictly parses the stored receipt and, inside a new `BEGIN IMMEDIATE`, recomputes all four
   authorities plus both output populations. A changed registry, unavailable/changed pack
   artifact, added/removed/changed source row, changed output row or malformed receipt fails startup
   rather than returning stale success, silently re-running or widening.

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

## Third author repair — 2026-09-06

The bounded repair closes [[D2878]]–[[D2884]] at the requirements tier without publishing a
registry or changing product storage. The executable checkpoint reads the production
`attempt_concepts` compound key, stored `DrillRun` event stream through `readBackReplay`, and exact
full-document digest through `PackRegistry.byDigest`; no reduced pack projection or caller-minted
occurrence object remains. `BEGIN IMMEDIATE` now precedes receipt, population and artifact reads.
Both initial completion and restart validate the registry, source rows, referenced artifacts,
registered/quarantine partition and complete output bytes, with rollback and malformed-receipt
fixtures.

`compileConceptRegistry(headBytes, revisionFiles)` now validates canonical head/revision bytes,
filename-to-digest equality, complete predecessor reachability and lifecycle monotonicity, while
preserving exact historical resolution. Consumer closure names six operations rather than six
files and follows TypeScript aliases/barrels to the defining symbol, so dead imports fail. The
portable v1 label-collision key is now literal and version-bounded instead of relying on a locale;
both multi-code-point `Straße`/`STRASSE` and Greek final-sigma collisions execute.

The full gate found and closed [[D2898]] during this repair: the predecessor “historical” review
read the live RFC, storage and model text, so correcting D2884 made its retained falsifier fail.
Those reviewed text inputs now come from exact commit `da3fde39`, and the successor asserts the
pin. Later contract repairs can no longer rewrite the evidence that caused them.

`make concept-registry-third-author-repair` retains all 36 predecessor controls and passes 7/7
current repair groups plus strict TypeScript. Exact receipt:
`planning/concept-registry/third-author-repair-2026-09-06.md`. This is author-contract evidence, not
acceptance or implementation; another genuinely fresh independent review and the
shared-resource-register bootstrap still precede both.

## Fourth fresh independent review return — 2026-09-06

The third repair closes [[D2878]]–[[D2884]] but is returned on five real integration seams:

1. [[D2904]] — storage migrations finish before the built-in plus stored-pack `PackRegistry` the
   concept migration requires can exist;
2. [[D2905]] — both the shipped storage coordinator and the proposed data operation own
   `BEGIN IMMEDIATE`, producing an exact nested-transaction failure and no defined atomic
   `user_version` boundary;
3. [[D2906]] — an expected call inside an unimported function passes “live” consumer closure, and
   the named web anchor is an absent `client.ts` rather than the real `api.ts` boundary;
4. [[D2907]] — the partial TypeScript program never checks diagnostics, so type-invalid committed
   consumers receive a compiler-derived receipt; and
5. [[D2908]] — public PackRegistry mutation accepts a caller-stamped digest and exposes it through
   `byDigest` without recomputing exact complete-document identity.

`make concept-registry-fourth-fresh-review` retains every predecessor review/repair and passes 5/5
new executable falsifiers plus strict TypeScript. Exact evidence:
`planning/concept-registry/fourth-fresh-independent-buildability-review-2026-09-06.md`. The RFC
remains draft; no schema, registry, migration or consumer implementation is authorized.

## Fourth author repair — 2026-09-06

The bounded repair closes [[D2904]]–[[D2908]] and adjacent [[D2922]] at contract tier. Startup is now explicitly split at
the authority boundary: prerequisite structural migrations produce a bootstrap-only handle; the
coordinator compiles the registries, opens one concept transaction, hydrates and recomputes every
complete pack artifact inside it, executes the transaction-free data operation, stamps the version
and commits; only then can it mint storage usable by services. An injected failure rolls back data
and version together and leaves the prerequisite phase restartable.

Historical resolution no longer trusts mutable `PackRegistry.byDigest`: it consumes an opaque,
cloned, recursively sealed snapshot whose complete-document digests were recomputed inside the
transaction. Consumer closure now names the real `api.ts` web boundary, starts from both product
entries, requires each operation-bearing declaration to have a reachable caller, and refuses every
compiler/config/resolution diagnostic before receipt publication.

The full gate found the same historical-review defect class again: the fourth review read live RFC,
application, storage and registry bytes, so correcting its subject made its retained D2904
falsifier fail. [[D2922]] pins every reviewed text input to commit `8596c97c`; D2908's behavior is a
bounded vulnerable model tied to those pinned source bytes. A future product repair can now invert
the defect without erasing the evidence that returned it.

`make concept-registry-fourth-author-repair` retains every predecessor review/repair, passes 5/5
direct inversions and strict TypeScript. Exact receipt:
`planning/concept-registry/fourth-author-repair-2026-09-06.md`. This remains author-contract
evidence, not acceptance or implementation; another genuinely fresh review and the implemented
shared-resource bootstrap still precede both.

## Fifth fresh independent review return — 2026-09-06

The fourth repair closes [[D2904]]–[[D2908]], but its composed authority remains unbuildable on six
new seams:

1. [[D2923]] — exported `ReadyStorage.issue(database)` lets any importer mint service-ready storage
   without the coordinator, migration or receipt;
2. [[D2924]] — the transaction-free data callback receives raw `DatabaseSync`, can commit the outer
   transaction and lets data plus `user_version` escape the coordinator's failed rollback;
3. [[D2925]] — a matching digest seals an invalid complete pack because snapshot compilation never
   invokes schema/runtime validation;
4. [[D2926]] — an already-versioned database can run a no-op callback and mint readiness with no
   receipt or restart revalidation;
5. [[D2927]] — the graph loads only TypeScript/JSON and cannot traverse production's
   `main.ts → App.svelte → api.ts` chain, which the positive fixture replaces with a direct import;
   and
6. [[D2928]] — operation calls and their wrappers may discard every result while satisfying the
   claimed consumer-use closure.

`make concept-registry-fifth-fresh-review` retains the complete predecessor chain and executes six
new counterexamples. Exact evidence:
`planning/concept-registry/fifth-fresh-independent-buildability-review-2026-09-06.md`. A green
review target means the return is reproduced, not that the RFC is accepted. The next repair must
close capability issuance, transaction capability, pack validation, restart validation, the real
Svelte graph and operation-specific value flow before another genuinely fresh review.

## Fifth author repair — 2026-09-06

The service-ready token is now an opaque object whose issuer remains inside the coordinator's
lexical scope. No exported value constructs it, and every storage operation checks private runtime
authority, so a type assertion or lookalike object cannot cross the boundary. The coordinator gives
the concept rewrite a frozen operation-specific repository rather than `DatabaseSync`; transaction,
SQL and pragma controls are absent. It validates each complete pack through the shipped validator
before canonical hashing and snapshot admission.

Initial migration writes one canonical receipt inside the coordinator transaction. An
already-versioned database takes a distinct restart path that requires and strictly parses that
receipt, then recomputes registry, input, complete-artifact and output digests before minting
readiness. The committed consumer graph now includes `.svelte` instance scripts and therefore
traverses `main.ts → App.svelte → api.ts`. Consumer closure also changed from call reachability to
declared value flow: the registered operation must be returned by its wrapper and that wrapper's
result must enter the operation-specific publication, persistence, query, rendering or wire
boundary. A bare expression call proves nothing.

`make concept-registry-fifth-author-repair` retains every predecessor return/repair, passes 6/6
direct repair groups and strict TypeScript. Exact receipt:
`planning/concept-registry/fifth-author-repair-2026-09-06.md`. This remains author-contract evidence,
not acceptance or implementation; another genuinely fresh review and the implemented shared-
resource bootstrap still precede both.

## Sixth fresh independent review return — 2026-09-06

The fifth repair closes [[D2923]]–[[D2928]], but its composed startup and consumer authorities are
still not buildable:

1. [[D2960]] — boundary use is matched by identifier text in any reachable file, so a local
   counterfeit or a call inside an uncalled function satisfies every consumer;
2. [[D2961]] — server and web compiler options are shallow-merged into one program, allowing the
   later web configuration to erase a diagnostic required by the server project;
3. [[D2962]] — the exact same validated artifact population hashes differently when loader order
   changes;
4. [[D2963]] — a caller-created object carrying only a syntactically valid digest substitutes for
   the one compiled concept registry;
5. [[D2964]] — `afterCommit` receives valid readiness before complete composition succeeds and can
   retain that authority while throwing; and
6. [[D2965]] — migration and post-commit failures reject without closing the bootstrap database.

`make concept-registry-sixth-fresh-review` retains the complete predecessor return/repair chain,
passes all six current counterexamples and compiles them under the repository TypeScript contract.
Exact receipt:
`planning/concept-registry/sixth-fresh-independent-buildability-review-2026-09-06.md`. This is a
return, not acceptance or implementation. The next author repair must use symbol-resolved live
boundary calls under each exact project configuration, sort the artifact population before hashing,
consume private compiler authority, and make readiness publication plus failure closure one atomic
application-composition boundary.

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
13. Migration fixtures use the shipped `(run_id, branch_id, concept_key)` source identity and a
    production-shaped `DrillRun`; any private `row_id` or reduced run-snapshot authority fails.
14. Historical occurrence is admitted only when `readBackReplay` validates the stored run and
    `PackRegistry.byDigest` resolves its exact complete document digest; reduced `{id, concepts}`
    projections and caller pack bytes cannot mint authority.
15. Receipt lookup, source join, artifact resolution, writes and final validation all occur after
    one `BEGIN IMMEDIATE`; an injected write failure rolls back registered rows, quarantine rows
    and the receipt together.
16. Restart strictly parses the receipt and recomputes registry, input, referenced artifact,
    partition and complete-output digests; registry replacement, missing/changed artifact, deleted
    output, changed input or malformed receipt each fails closed.
17. The on-disk compiler rejects malformed/noncanonical head bytes, misnamed/missing/orphan/cyclic
    history and lifecycle reversal, and resolves both current and exact historical refs from the
    complete reachable revision chain.
18. Each of the six landing paths calls its distinct registered operation. TypeScript symbol
    resolution follows an alias/barrel to the declaration, while the same six imports with no calls
    fail operation closure.
19. Label collision uses exactly `labelCollisionKeyV1` under Unicode data 17.0, independent of
    locale. Expansion and contextual-equivalence fixtures at minimum cover `Straße`/`STRASSE` and
    Greek `σ`/`ς`; a runtime with different Unicode data refuses the build pending a versioned rule
    update.
20. A production-shaped startup fixture proves the only order is prerequisite structural migration
    → registry compilation → coordinator transaction → stored-pack hydration and complete-document
    digest validation → concept rewrite/receipt/version stamp → commit → service-ready storage.
    Failure at every phase refuses application readiness; a phase-2 failure leaves the prerequisite
    version and can restart without partial concept rows.
21. The storage coordinator is the sole owner of `BEGIN IMMEDIATE`, rollback, commit and
    `PRAGMA user_version`. The concept data operation requires an active transaction and is unable to
    open or close one; its writes, receipt and version stamp roll back together.
22. Historical pack resolution consumes only an opaque snapshot compiled inside the transaction
    from cloned, recursively sealed documents whose complete canonical digest is recomputed. A
    caller-stamped mismatch, later caller mutation, unavailable digest or forged snapshot fails.
23. Consumer closure uses `api.ts`, not absent `client.ts`, starts at both real application entries,
    and proves each containing operation is called from another reachable module. A reachable module
    containing an uncalled export and an unreachable module containing a call both fail.
24. The exact committed repository compiler/config/dependency authority rejects all diagnostics
    before the closure receipt is minted; the same reachable graph with one type-invalid consumer,
    unresolved import or incompatible config fails.
25. Service-ready storage has no exported value constructor or issuer. Only the coordinator's
    successful post-commit path can mint it, and direct, static, cast and structural forgeries fail
    the private runtime authority check.
26. The concept rewrite receives only a frozen operation-specific repository capability. It has no
    raw database, SQL, begin, commit, rollback or pragma surface; the coordinator remains sole owner
    of transaction state and the version stamp.
27. Every historical pack crosses the shipped complete-document validator before its canonical
    digest is admitted. A hash-matching document with any schema, lint or runtime error fails with
    pointed diagnostics.
28. Initial migration and restart are distinct closed paths. Restart requires a canonical receipt
    and recomputes registry, input, complete-artifact and output digests; missing, malformed or stale
    receipt authority refuses readiness.
29. Consumer closure follows committed `.svelte` instance-script imports, including the production
    `main.ts → App.svelte → api.ts` chain. Replacing it with a direct fixture or disconnecting
    `api.ts` fails.
30. Each registered operation result returns through its owning wrapper and enters its declared
    operation-specific product boundary. Bare expression calls, unused wrapper returns and a result
    routed to another operation's boundary all fail.

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
