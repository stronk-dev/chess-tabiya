# RFC: Portable account data and dependency-aware deletion

- **Status:** accepted — 2026-08-22, by claude as register owner on the buildability test, after buildability (D711–D714) and an independent cross-review that re-derived ~45 claims at source and failed 5, all corrected in place: the browser-clearing promise named one localStorage prefix where the shipped grammars are three (`tabiya:` / `tabiya.` / `chess-tabiya:`) plus the same-day `tabiya.workflow.v1.*`; the §4.3 tombstone journal record was impossible under `session_journal.kind`'s closed CHECK with no migration claimed (pinned to `session.closed`); the migration-position queue predated the 2026-08-22 acceptances (all three named, with longitudinal-store's D1 hand-off); the migration-24 column enumeration missed `live_sessions.classroom_id`; `archive/teacher-surface.md` joins Parent/amends. *(Prior line for history: draft — buildability review 2026-08-22 corrected D711–D714; independent cross-review 2026-08-22 corrected five findings; ready for acceptance)*
- **Author:** Codex on the owner's 2026-08-21 retention ruling
- **Created:** 2026-08-21
- **Design refs:** `design/02-product-shape.md` deployment axis and appliance clauses;
  `design/03-product-breadth.md` B8; `design/research/release-platform-audit.md` §4;
  `planning/platform-alignment/release-platform/f12-work-order.md` F12-B; D605, D606, D656
- **Exploration gate:** O13/D616 chose the Choice-C appliance floor; D656 rules the remaining
  private-delete versus shared/public-retain boundary
- **Depends on:** `archive/teacher-surface.md` landed first so its classroom/submission tables enter the
  exhaustive inventory and its pre-D656 deletion clause can be superseded atomically; F12-C supplies
  only the final configured backup-retention sentence
- **Parent / amends:** `archive/learner-identity-and-authorization.md`,
  `archive/pack-studio.md`, `archive/shape-library.md`, `archive/game-import-and-story.md`,
  `archive/return-and-progression.md`, `archive/live-session-platform.md`,
  `archive/social-match.md`, `archive/board-annotation.md`,
  `archive/teacher-surface.md` (its §4.1a/criterion 9a account-deletion outcome only — §4.6)
- **Supersedes / superseded by:** —
- **Planning:** `planning/portable-account-data/` once implementing

```tabiya-claims
none
```

## Summary

This RFC makes account exit truthful. It adds a deterministic, versioned account-data export;
an exact deletion preview; per-run deletion; and one dependency-aware deletion classifier. Private
and solo data is hard-deleted. An anonymous link is revoked and does not preserve its run. Only an
artifact that another authenticated learner currently depends on, or an explicitly registered
pack/shape, survives as an immutable tombstone. Surviving records detach account identity and lose
all real writers. The current behavior—moving every run, including a solo imported game, to
`__legacy`—is removed.

## Motivation

R18 measured the current account flow rather than inferring it. After deleting the database's only
real learner, the session, attempt and schedule were gone but the solo run, imported PGN and restored
host grant remained under `__legacy`. `GET /auth/export` returned 405. Object-specific PGN,
repertoire, pack and shape exports cannot reconstruct progress, schedules, grants, social state or
future private behavioral metrics. The browser says only “Shared runs are reassigned,” even when the
run was never shared.

There are two distinct promises:

1. A learner can take away a complete, intelligible copy of their durable data.
2. Deleting an account erases private history without destroying an artifact another person already
   relies on.

Neither promise is met by raw SQLite, PGN alone, broad foreign-key cascades, or blanket reassignment
to a sentinel. The owner ruled the boundary in D656. This RFC turns it into one inventory, one
classifier and destructive-path tests.

Out of scope:

- importing an account bundle into this or another installation;
- server backup/restore and backup expiry, owned by F12-C;
- federation, cross-instance identity or account transfer;
- changing registered pack/shape bytes, licences or digest identity;
- inventing a public-run publication state; no such state ships today;
- legal claims about statutory compliance. This is the product's technical data contract.

## Specification

### 1. One exhaustive durable-data inventory

`apps/server/src/account-data.ts` owns `ACCOUNT_DATA_INVENTORY`. Each entry names the storage table
or non-table durable store, ownership/join rule, export projection and deletion disposition. For
every identity-bearing table it also names each learner/account column and one exact transform:
`delete_row`, `set_null`, `legacy_identity`, or `deletion_scoped_key`. A test
reads `sqlite_schema`, excluding only `sqlite_*`, and fails when any application table has no entry or
one table has two entries. A second set-equality test reads table metadata and the known JSON identity
field registry and fails when an identity-bearing column or payload field has no transform, or when
the declared transform contradicts its foreign-key action. Future browser persistence holding learner history must add a named
non-table entry in the same inventory.

The initial inventory has these semantic classes. This is a classification of all current durable
data, not permission to omit a table-level entry.

| Data class | Account export | Account deletion |
|---|---|---|
| learner identity | handle, display name, account creation time | hard-delete |
| password/session/security state | excluded, with the exclusion named in the manifest | hard-delete; never serialized or logged |
| owned run snapshot/events and summary | full-fidelity stored snapshot plus schema/provenance metadata | hard-delete if private; otherwise shared tombstone (§4) |
| run grants on owned runs | role, grantee display handle and grant time; never a credential | departing grant deleted; other grants retained only on a tombstone and demoted to read-only |
| access to another learner's run | reference, title, role and grant time; not a second copy of the owner's run | departing grant deleted; run untouched |
| imported-game source | full original PGN, source, headers, digest, licence note and import time for owned runs | hard-delete; also removed from a retained shared tombstone |
| attempts, concept projections, schedules and position statistics | full typed learner projection and its source references | hard-delete; aggregates recomputed after per-run deletion |
| run marks | the learner's own marks, including relay state | hard-delete even when the run survives |
| repertoires, moves, scans and gap links | full typed records plus original source | hard-delete |
| unregistered pack/shape drafts and playtest bytes | exact document plus draft provenance/state | hard-delete |
| registered pack/shape artifacts | exact registered document, digest, licence, version and publication time | retain immutable artifact; tombstone publisher metadata (§4.4) |
| live/session/social state | owned-session references and the learner's typed contributions; no bearer token | private session cascades with run; shared session follows tombstone scrub (§4.3) |
| anonymous public tokens | metadata says a link exists; token and token hash are excluded | revoke/delete; never a retention reason |
| run derivations | learner-owned source/derived references | delete dangling private references; a foreign-owned derived run is a shared dependency |
| future behavioral/style profiles | full metric values, sample/version/provenance and sharing state | hard-delete unless a later explicit publication contract says otherwise |
| browser-local writer ids and view/assistance preferences | not account-scoped and therefore named in exclusions; they cannot be recovered from another device | clear every key in all three shipped grammars on the confirming browser — `tabiya:*` (mark scope, branch fold, branch group), `tabiya.*` (`tabiya.assistance.v1.*` and `intent-presets`' `tabiya.workflow.v1.*`) and `chess-tabiya:run:*:writer-id`; obsolete keys on another device carry no server data or valid session and are disclosed as device-local |
| global registries, official content and deployment configuration | excluded and named as installation data | untouched |

The inventory is the guard against “new table, old privacy policy.” Schema migration tests and
`make verify` read it. An implementation may split one class into several entries; it may not merge
away a table or silently use `not_applicable`.

`archive/teacher-surface.md` is implemented at migration 24. It adds classrooms, members,
assignments, submissions, two grant columns (`run_grants.expires_at`, `run_grants.granted_via`) and
the `live_sessions.classroom_id` ownership column while specifying account deletion under the old
blanket-reassignment policy. It therefore lands before this RFC. F12-B inventories every table it
adds and supersedes its §4.1a/criterion 9a deletion outcome in the same commit; there is no interval
in which the new classifier sees an unregistered classroom table. Later migrations must add
inventory entries as part of their own schema guard; the three queued at HEAD are `learner-rating`
(rating tables), `longitudinal-store` (`learner_observations` and `learner_structure_stats`, whose
accepted Discharge D1 routes both classes into this inventory — they export under the
attempts/concepts/statistics class and hard-delete by their declared learner/run cascades) and
`bot-policy` (stamp-only, no table).

### 2. Portable account bundle

#### 2.1 Representation

`POST /auth/export` requires an authenticated session and password re-confirmation. Success returns:

- `content-type: application/vnd.tabiya.account+json; version=1`;
- `content-disposition: attachment; filename="tabiya-account-<safe-handle>.json"`;
- `cache-control: no-store`;
- `x-tabiya-export-sha256: sha256:<lowercase hex>` over the response bytes.

The response is canonical UTF-8 JSON with this top-level closed shape:

```ts
interface AccountBundleV1 {
  readonly format: "tabiya-account-export";
  readonly formatVersion: 1;
  readonly source: {
    readonly applicationVersion: string;
    readonly storageVersion: number;
    readonly runSchemaVersion: string;
  };
  readonly account: AccountIdentityExport;
  readonly ownedRuns: readonly OwnedRunExport[];
  readonly sharedAccess: readonly SharedRunReference[];
  readonly progress: ProgressExport;
  readonly marks: readonly MarkExport[];
  readonly repertoires: readonly RepertoireExport[];
  readonly drafts: DraftExport;
  readonly publications: PublicationExport;
  readonly liveAndSocial: LiveAndSocialExport;
  readonly behavioralProfiles: readonly BehavioralProfileExport[];
  readonly exclusions: readonly ExportExclusion[];
}
```

Each section carries `projectionVersion` and a `provenance` array naming its source tables or store.
Nested shapes are closed TypeScript types beside the projector, not `unknown` maps. Stored pack,
shape and run documents retain their own schema versions. The account format does not replace them.

Format version 1 is owned wholly by this server projection. The web client treats the response as an
opaque download and no package exports its type; this RFC therefore claims none of the six shared
resources. If an importer, second producer or package-level consumer is introduced, the account
format becomes a shared versioned resource and must earn a register before it changes.

#### 2.2 Completeness and boundaries

- Every run owned by the learner is exported from its stored snapshot, including its complete event
  log. A quarantined or older-schema snapshot is exported losslessly with `replayable: false` and an
  error code; export never drops it merely because the current runtime cannot project it. The
  snapshot field is a closed union: `{kind:"parsed", value: StoredRunDocument}` for valid JSON or
  `{kind:"raw", utf8:string, diagnostic: StoredRunDiagnostic}` for invalid/unprojectable stored
  text. The raw arm preserves the exact stored UTF-8 string; it is never parsed by the browser.
- Imported source is embedded beside its owned run. The same bytes do not appear in a second section.
- For a run owned by somebody else, `sharedAccess` includes only the relationship and the learner's
  own contributions. It does not clone the other account's snapshot into this bundle.
- Registered artifacts are exported independently of their retained internal draft rows.
- IDs remain stable inside the bundle so references are intelligible. Another learner's internal id,
  password material, session/token material, engine credentials and deployment paths never appear.
- Visible collaborator handles already exposed by the product may appear in grant/session context;
  raw learner ids do not.
- Anonymous bearer tokens and token hashes never appear. The bundle may say a share of a given scope
  existed and whether it was revoked.
- The exclusions section must name `password_hash`, login-failure/lock state, sessions, bearer tokens,
  token hashes, provider credentials, deployment configuration and global installation content.

Account export runs in one read transaction. Arrays sort by stable primary key, object keys use the
repo's canonical JSON ordering, and no request-time timestamp, random id or current locale enters the
body. Two exports of unchanged state are byte-identical. The digest is checked by a round-trip test.

No account-import route, parser or UI is added. Object-specific import/export paths continue to work.

#### 2.3 Browser flow

The Account region gains a primary “Download my data” action. It asks for the current password,
starts the download, and clears the password field on success or failure. The UI does not parse or
cache the body and never sends it to an external provider. The bundle names current-device-only
preferences as an exclusion: they are not account-scoped, the server cannot see another browser's
copy, and another device's copy contains no run snapshot or reusable authenticated session.

### 3. Deletion preview and stale-plan guard

Deletion is always two-phase.

`POST /auth/deletion-preview` authenticates the learner and returns `DeletionPreviewV1`:

```ts
interface DeletionPreviewV1 {
  readonly version: 1;
  readonly scope: { readonly kind: "account" } | { readonly kind: "run"; readonly runId: string };
  readonly digest: `sha256:${string}`;
  readonly hardDelete: readonly DeletionEffect[];
  readonly tombstone: readonly DeletionEffect[];
  readonly revoke: readonly DeletionEffect[];
  readonly retainedPublished: readonly DeletionEffect[];
  readonly backupNotice: string;
}
```

Each effect carries a closed `kind`, count, stable object ids and a human label. It contains no secret
and no other learner's internal id. Empty categories remain present. The digest covers the canonical
plan excluding `digest` itself.

`POST /auth/delete` changes from `{password}` to `{password, previewDigest}`. After password
verification, storage begins `BEGIN IMMEDIATE`, recomputes the plan inside that transaction, and
returns typed `DELETION_PREVIEW_STALE` without changing data when the digest differs. It then applies
exactly that plan and commits. A response cannot claim deletion if any effect failed.

Per-run deletion uses `POST /runs/:id/deletion-preview` and
`POST /runs/:id/delete {previewDigest}`. The authenticated host-owner relationship is required.
A normal confirmation gesture is sufficient for one run; account deletion continues to require the
password. Uniform 404 non-disclosure applies when the caller has no owner relationship.

The preview's backup notice says that live data is removed immediately but existing operator backups
may retain an older copy until the deployment's configured F12-C retention period expires. Before
F12-C lands it says “backup retention is deployment-managed and account deletion cannot purge an
existing backup”; F12-H refuses 1.0 until the configured sentence is available.

### 4. The dependency-aware deletion classifier

The same pure `planDeletion` function produces preview and commit input. No route, UI or storage
method reimplements its predicates.

#### 4.1 Private versus genuinely shared runs

For a run owned by the departing learner, `externalDependency` is true at the plan timestamp iff either:

1. a non-expired `run_grants` row names a different authenticated learner other than `__legacy`; or
2. `run_derivations` names the run as a source and the derived run is currently owned by a different
   authenticated learner.

The implemented `teacher-surface` migration's submission grants enter through rule 1; no special
classroom exception is needed. A `story_read` or `session_join` token, a live session with no other
current grantee, a previously revoked grant, or an unredeemed invitation is **not** an external
dependency. An anonymous link is revocable access, not co-ownership.

Future storage adding a public/published run state must add a third explicit predicate and an
inventory entry; absence fails the storage-coverage test rather than silently widening retention.

If `externalDependency` is false, the run is hard-deleted. If true, it becomes a shared tombstone.

#### 4.2 Hard-deleting a private run

The transaction deletes the run and all FK-cascade children, then explicitly removes every non-FK
reference whose inventory entry names that run: public tokens, derivation rows, repertoire-gap links,
schedule source/started links, and draft seed references. Any surviving draft seeded from the run,
including the backing draft of a registered artifact, keeps its copied document but loses the
now-invalid/private seed reference; the preview names that effect.

The affected learner's attempts/concepts and schedules for that run are removed. Position-stat
aggregates are rebuilt from their remaining attempts, so deleting a run cannot leave a ghost count.
All snapshot-cache entries for deleted runs are evicted after commit.

Account deletion takes the closure of private owned derivations before applying the plan. A private
chain is deleted together; encountering a foreign-owned derived run stops the source at a tombstone.

#### 4.3 Tombstoning a shared run

A shared tombstone preserves the stored run snapshot/event log because that is the artifact the other
learner can already read. This includes authored reasoning embedded in the event log. The preview
states that those shared bytes survive; deletion does not rewrite chess history into a different run.

Inside the same transaction:

1. owner and active writer become `__legacy` with a fresh legacy writer id;
2. every surviving real learner grant becomes `spectator`; the departing grant is deleted and one
   `__legacy` host grant is inserted;
3. the live session, if any, is closed and a final identity-free tombstone journal record is
   appended using the existing `session.closed` kind with a null actor and a tombstone payload —
   `session_journal.kind` is a closed CHECK vocabulary at HEAD, and this RFC claims no migration,
   so a new journal kind is not available to it;
4. all anonymous tokens for the run are revoked/deleted;
5. all marks authored by the departing learner, attempts/progress owned by them, imported-game
   source bytes/headers and private repertoire links are deleted;
6. summary/title metadata that identifies the account becomes a neutral “Shared run from deleted
   account” projection; the event log and moves remain unchanged;
7. typed live/social identity fields are scrubbed through the inventory's declared transform:
   nullable learner foreign keys become null, cascade-owned contributions delete, required retained
   foreign keys use `__legacy`, and non-FK retained classroom identities use the deletion-scoped key;
   handle arrays/invitations remove the departing handle, and every registered identity field in
   journal payloads becomes the tombstone marker. Blind string replacement is forbidden, and an
   unregistered identity-bearing column or payload key fails before mutation.

Because no real host or writer remains, a surviving reader can read/export the tombstone but cannot
commit, transfer the lease, mint links, reopen the session or change grants. Tests exercise each verb;
setting `owner_learner_id = '__legacy'` alone is not accepted as proof of immutability.

Deleting one run uses the same transition but removes only the requesting learner's private rows and
grant. Account deletion subsequently removes all of that learner's remaining data.

#### 4.4 Published pack and shape artifacts

Unregistered `draft` and `withdrawn` pack/shape rows owned by the learner are hard-deleted, including
unregistered playtest bytes. A `registered` draft remains only because the immutable registered row
names it; it is reassigned to `__legacy` and cannot be edited. Registered pack/shape document bytes,
version, digest, licence and registration time remain unchanged.

`publisher_learner_id` becomes `__legacy`; account-display publisher metadata becomes
`deleted account`. Immutable document bytes may themselves contain authored prose or attribution and
are not rewritten because that would change the published digest. The account preview enumerates
each such artifact and says this explicitly. Publication UI documentation must carry the same warning
before a learner registers an artifact.

This is retention, not ownership transfer. No later account may claim the id or mutate the retained
version.

#### 4.5 Learner-only state and account row

After run classification and artifact handling, the transaction hard-deletes repertoires, private
marks, attempts/concepts, schedules, position statistics, future behavioral profiles, unpublished
drafts, sessions, grants and the learner row. Cascades may implement a deletion only when the
inventory names and tests that cascade. The operation does not create a legacy grant for any deleted
private run.

#### 4.6 Classroom and submission integration

This subsection applies after the implemented `archive/teacher-surface.md` migration.

Its §4.1a currently revokes submission-minted grants before deleting either party because every run
was assumed to survive under `__legacy`. That order would erase the very authenticated dependency
D656 now says must retain a learner-owned run. F12-B supersedes that clause and its criterion 9a:

- when a learner deletes an account, a current submission-minted teacher grant participates in
  `externalDependency` exactly like any other authenticated grant; the run becomes the read-only
  tombstone of §4.3 and the teacher keeps spectator read access;
- the submission and departing membership records remain as shared history but their learner/account
  identity becomes one fresh deletion-scoped random tombstone key; assignments authored by the
  departing teacher use the same key, and `granted_learner_ids` removes that teacher id. No retained
  field contains the old learner id or handle, and the new key cannot recover either;
- when a teacher deletes an account, only that teacher's grant and contributions are removed. A
  co-teacher's independently minted/current grant is not revoked merely because the classroom owner
  disappeared;
- a classroom with no other active member is private and hard-deletes with its assignments and
  submissions; a classroom with another authenticated active member is archived as an immutable
  shared tombstone. It can be read by surviving members but cannot mint grants, accept members,
  schedule sessions or receive submissions;
- invitations that were never accepted are revoked and do not retain a classroom. Existing linked
  live sessions/runs follow their own classifier rather than being deleted by the classroom row;
- explicit classroom deletion still follows `teacher-surface`'s revocation contract. Account
  deletion is the narrower identity-erasure path and does not masquerade as that user action.

The classroom UI renders “deleted learner”/“deleted teacher,” never the deletion-scoped tombstone
key. The storage key exists only to keep multiple deleted accounts and their submissions distinct
under existing uniqueness constraints. It is generated only while applying the transaction and is
not part of the deterministic preview. The preview names each retained classroom and submission
count.

The read-only promise is an application change, not a storage assumption: classroom detail/list
projectors admit an archived classroom only to a surviving active member and label it archived;
every member, assignment, submission and scheduling mutation refuses it. The Live classroom surface
renders the retained roster/assignment/submission history without actionable controls. The current
`ClassroomService.#memberRecord` blanket archived-room refusal must therefore be split into explicit
read and mutation guards.

### 5. Account and run UX

The Account region becomes a guided lifecycle panel, not another settings matrix:

1. “Download my data” is available independently.
2. “Delete account” first loads and renders the categorized preview.
3. The confirmation page says plainly: private runs will be permanently deleted; named shared runs
   remain read-only for their collaborators; published artifacts and embedded authored bytes remain;
   anonymous links stop working; backups expire separately.
4. The final action requires the password and the preview digest. Nothing is pre-checked and there is
   no dark-pattern cancellation copy.

Run actions add “Delete this run.” A private-run preview says it will be permanently removed. A
shared-run preview says the learner will leave and a read-only tombstone will remain for the named
number of collaborators. No raw `__legacy`, table name or retention classifier vocabulary appears in
ordinary UI.

On success, account deletion expires the cookie and clears every key in the three shipped
localStorage grammars on the confirming browser—`chess-tabiya:run:*:writer-id` writer ids,
`tabiya.assistance.v1.*` assistance preferences, `tabiya.workflow.v1.*` workflow presets, and the
`tabiya:*` mark-scope, branch-fold and group-mode keys—before returning to the signed-out shell. A
key grammar added later joins this clearing list through the same inventory exclusion entry that
names it. Server-side sessions on every device are invalidated by
learner deletion. A browser that is not present during deletion can retain only those device-local
preferences/obsolete writer ids; the confirmation says so rather than promising remote browser
erasure. Run deletion clears that run's local writer/view keys and removes it from every local list
without requiring a reload. Failures retain the preview and explain whether it became stale.

### 6. Security, resource and failure behavior

- Export and preview are authenticated; export and account deletion re-confirm the password using the
  existing constant-time path and lockout behavior.
- No export body, digest input, deletion preview, password or object content is written to logs.
- Export has no arbitrary “too large” refusal that strands an account. The implementation streams or
  uses a bounded temporary artifact, cleans it on disconnect/error, and documents the disk bound.
- The canonical projection rejects invalid stored JSON by exporting the raw owned bytes with a typed
  diagnostic, not by omitting the object. It never executes imported content.
- Deletion is one transaction. Fault injection after every effect group proves rollback leaves both
  SQLite rows and snapshot cache semantically unchanged.
- A concurrent grant/publication/run mutation makes the supplied preview stale; it is never absorbed
  into an older consent silently.
- The implementation checks foreign keys after each destructive integration test.

### 7. Implementation surface

The table's unit is one module or route/UI family with a distinct responsibility; total **14**.

| # | Surface | Required change |
|---:|---|---|
| 1 | `apps/server/src/account-data.ts` (new) | exhaustive inventory, bundle projector, deletion plan and canonical digest |
| 2 | `apps/server/src/storage.ts` | snapshot-consistent reads, per-run hard delete, shared tombstone and account-plan transaction |
| 3 | `RunStorage`/progress/live storage interfaces | typed export inputs, plan preview and apply methods; no raw database handle escape |
| 4 | `apps/server/src/identity.ts` | password-confirmed export and preview-digest account deletion |
| 5 | `apps/server/src/service.ts` | owner-scoped per-run preview/delete and shared-tombstone read behavior |
| 6 | `apps/server/src/rest.ts` | four routes, attachment headers, closed request parsing and typed stale refusal |
| 7 | `apps/server/src/errors.ts` plus refusal fixtures | `DELETION_PREVIEW_STALE` mapping and coverage |
| 8 | `apps/web/src/lib/api.ts` | opaque export download and typed preview/delete calls |
| 9 | `apps/web/src/lib/AssistanceSettings.svelte` or extracted Account panel | guided export/preview/confirm UX and corrected disclosure |
| 10 | run-list/run-action client surface | per-run preview/delete entry and list/cache update |
| 11 | classroom service/routes and Live classroom surface | surviving-member read-only archived projection; every archived mutation refused; deleted identities rendered without exposing keys |
| 12 | Pack Studio and Shape Studio registration confirmations | before publication, warn that immutable authored bytes and attribution survive later account deletion |
| 13 | server/component/browser tests plus R18 harness | inventory, classifier, rollback, deterministic export and user-visible flows |
| 14 | `docs/identity-and-authorization.md` plus data-lifecycle documentation | canonical shipped behavior, bundle format, backup caveat and operator-facing semantics |

The account panel may be extracted from `AssistanceSettings.svelte`; this RFC does not require
account lifecycle to remain inside an assistance component.

## Deviations from design

`design/02-product-shape.md` still says deleted learners' runs reassign to `__legacy`. That sentence
described the old implementation and now conflicts with the later D656 owner ruling. This RFC
narrows reassignment to genuinely shared tombstones and hard-deletes private runs. The protected
design sentence requires an owner/Claude-on-ruling correction; this RFC does not edit it.

The implemented `archive/teacher-surface.md` §4.1a and criterion 9a revoke every submission grant before
deleting a learner and expect no teacher grant on the legacy run. D656 reverses that result for a
current authenticated dependency. `teacher-surface` lands first; this RFC then supersedes only its
account-deletion outcome while preserving explicit withdrawal, leave, removal, archive, classroom
delete and grant-expiry behavior.

No other deviation.

## Acceptance criteria

1. **Inventory completeness:** a fresh database at the contiguous `STORAGE_VERSION` current when
   this RFC lands has every application table—including all `teacher-surface` tables—represented by
   exactly one `ACCOUNT_DATA_INVENTORY` entry; adding a table without a disposition fails.
2. **Deterministic export:** two exports of unchanged state are byte-identical and match the digest
   header; changed state changes the digest.
3. **Export round trip:** the V1 validator accepts the emitted canonical JSON and rejects an unknown
   top-level or nested field, missing section, wrong projection version and broken reference.
4. **Completeness fixture:** one account holding every current durable data class produces every
   required section, including a quarantined raw run; no password/session/token hash or credential
   appears in bytes or logs.
5. **Ownership boundary:** a grantee's export contains the shared reference and their contributions,
   not the other learner's full snapshot or internal learner id.
6. **Private account deletion:** R18's one-account/one-solo-import fixture leaves no run, import,
   grant, attempt, schedule, mark, repertoire, draft, token, derivation or learner row and creates no
   `__legacy` grant for the deleted run.
7. **Anonymous link:** a private run with only a `story_read` token is hard-deleted and the old link
   returns uniform 404.
8. **Authenticated sharing:** a run granted to a second learner survives; the second learner can read
   and export it but every write, grant, link and reopen verb is refused. No real host/writer remains.
9. **Derived dependency:** a foreign-owned derived run causes its source to tombstone; a wholly
   private derivation chain hard-deletes as a closure.
10. **Shared scrub:** departing marks/import metadata/progress disappear, every identity-bearing
    database column and registered journal payload field matches its declared transform, event/move
    bytes remain unchanged and foreign-key check is green. Adding an unregistered identity field
    makes the inventory guard fail.
11. **Published artifact:** registered pack and shape bytes/digests remain exact, publisher account
    metadata is tombstoned, ids remain unclaimable, and unregistered drafts/playtests are absent.
12. **Per-run deletion:** a private run hard-deletes; a shared run tombstones; unrelated runs and
    progress remain. Position statistics equal a full reprojection from the remaining attempts.
13. **Classroom integration:** deleting a submitting learner preserves the current teacher's read
    grant on a run tombstone and scrubs the submission identity; deleting a teacher removes only that
    teacher's grant; shared classrooms archive read-only, private classrooms hard-delete, and
    explicit classroom deletion still executes the original revocation contract. A surviving member
    can list/read the archived classroom, while every archived-room mutation is refused and no
    deletion-scoped key appears in the response.
14. **Stale preview:** adding a grant, publishing a draft, or changing a run after preview causes
    `DELETION_PREVIEW_STALE` and zero mutation.
15. **Rollback:** injected failure after each deletion effect group leaves the pre-operation database
    and cache observable byte-for-byte/semantically unchanged.
16. **Browser:** export downloads without body parsing; account and run previews render every nonempty
    category; password and digest are required; success signs out or updates the list; failure is
    recoverable. Keyboard and assistive navigation cover the full flow.
17. **Disclosure:** UI and docs distinguish live deletion from backup expiry and both Pack Studio
    and Shape Studio warn before registration that immutable
    shared/published authored bytes survive. They distinguish server account data from device-local
    preferences, clear the confirming browser, and never claim remote-browser or blanket erasure.
18. **No import:** there is no account-import route or control, and object-level import behavior is
    unchanged.
19. **Regression:** `make verify`, server tests and the refreshed R18 data-lifecycle arm are green;
    the R18 harness fails if a solo run is again reassigned rather than deleted.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | [[D605]] — portable account export | `portable-account-data` | implementation commit satisfying criteria 1–5 and 16–19 | |
| D2 | [[D606]] — private history survives deletion and no per-run delete exists | `portable-account-data` | implementation commit satisfying criteria 6–17 and 19 | |

## Open questions

None. The material product boundary was answered by D656. Exact helper names and whether export uses
streaming or a bounded temporary file are implementation decisions constrained by §6.

## Changelog

- 2026-08-21: drafted from R18, the F12 split and owner ruling D656; specifies deterministic export,
  exhaustive inventory, stale-safe previews, per-run deletion and the private/shared/published
  retention classifier.
- 2026-08-22: buildability review corrected D711–D714: identity transforms are exhaustive, invalid
  stored run JSON has a closed raw representation, archived classroom history gains a real read-only
  consumer, and both publication surfaces own the required retention warning.
- 2026-08-22: independent cross-review corrected five findings against HEAD and the RFCs accepted
  the same day: (1) the browser-clearing grammar named only `tabiya:` keys while the shipped
  writer ids are `chess-tabiya:run:*:writer-id` and assistance preferences are
  `tabiya.assistance.v1.*` — a prefix clear would have missed both, plus `intent-presets`'
  accepted `tabiya.workflow.v1.*`; §1 and §5 now name all three grammars. (2) The §4.3 tombstone
  journal record is pinned to the existing `session.closed` kind — `session_journal.kind` is a
  closed CHECK vocabulary and this RFC claims no migration, so a new kind was impossible as
  written. (3) §1's later-migration sentence named only `learner-rating`; it now names all three
  queued positions, including `longitudinal-store`'s two tables whose accepted Discharge D1 routes
  them into this inventory. (4) The teacher-surface column enumeration omitted
  `live_sessions.classroom_id`. (5) `archive/teacher-surface.md` joins Parent/amends, since §4.6
  supersedes its §4.1a/criterion 9a outcome. Everything else re-derived clean: register count
  (six), migration 24 ownership, deleteLearner/405/disclosure motivation claims, FK-free classroom
  identity columns under the deletion-scoped key, and the 14-surface/19-criterion/discharge grids.
