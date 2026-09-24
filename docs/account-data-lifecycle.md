# Account data lifecycle

Tabiya keeps one exhaustive inventory in `apps/server/src/account-data.ts`. Every
application table has exactly one export/deletion disposition, and the schema test
compares that registry with `sqlite_schema`. A migration that adds a table without a
disposition fails verification. The same inventory also names the browser-only key
grammars that are outside the server account.

## Export

`POST /auth/export` requires an authenticated session and the current password. It
returns `application/vnd.tabiya.account+json; version=1` as an attachment and supplies
`X-Tabiya-Export-Sha256`. Unchanged storage produces byte-identical canonical UTF-8
JSON. The bundle separates owned run snapshots from references to runs owned by other
learners. It includes progress, marks, repertoires, authored drafts, immutable
publications, live/social history, and rating/profile records — including the four
longitudinal classes (denominators, observations, structure stats and projection jobs),
which account and per-run deletion previews list and deletion removes.

The server emits the canonical bytes as a 64 KiB-chunked response stream and imposes
no account-size refusal. It does not create a temporary export file, so account export
has no temporary-disk allocation or cleanup bound; cancellation stops further chunks.

The export deliberately excludes password hashes, failed-login and lock state,
sessions, bearer tokens and token hashes, provider credentials, deployment
configuration, and installation-wide official content. Durable evidence-job rows (batches, jobs,
result sequences and application transitions; `evidence-jobs.md`) are run-owned operational
state: they carry no learner identity, are not exported, and follow their run's deletion
classification by cascade. Concept occurrences (`concept-registry.md`) export in the progress
projection: a registered `attempt_concepts` row carries its exact `ConceptRef` (id, schema
version, registry revision digest) with its pack/run occurrence, and export validation refuses a
row whose key disagrees with its ref; quarantined `attempt_concept_legacy` rows export as-is with
their closed reason and are never promoted. Both cascade with their attempt on deletion. The
registry itself and the installation's `concept_registry_migration` receipt are installation
content: neither is exported, and deletion removes no registry revision. Browser-local writer ids,
board-view preferences, assistance preferences, and workflow presets are named as an
exclusion because another device's copy is neither account data nor recoverable by the
server.

The server also sends an exact `Content-Length` (the canonical bytes are built in memory
before streaming), and the Account region shows the download's received and total size
while it arrives.

Registration states this storage boundary before account creation: saved games and
rehearsals, learning progress, and authored or published work are tied to the account.
It points to the password-confirmed account download and deletion paths without
claiming recovery.

The account download is a Tabiya archive for safekeeping, inspection and moving the
learner's private record into another Tabiya account; it is not a chess-interchange file
and other chess products do not read it. The Account region states that boundary before
download and links to Library, where
each visible game can be downloaded directly as standard PGN without opening the
run. Branch-selective export remains available inside the run.

Each Library artifact action retains the run that initiated it. PGN preparation, deletion-preview
loading, and deletion confirmation are single-flight and visibly pending. A preview must carry the
requested run scope and a usable digest before the confirmation can appear; the confirmation keeps
that exact run/digest pair across its await. Provider diagnostics never become learner copy.
Finishing after Library is left cannot trigger a late download or mutate a newly loaded Library
projection, while a successful deletion still clears addressable browser-local run data.

Stored run text is not silently dropped. A valid document is emitted as parsed JSON;
invalid stored JSON uses a lossless raw UTF-8 arm with a typed diagnostic.

## What Tabiya has recorded

`GET /auth/account-inventory` returns one row per data class of `ACCOUNT_DATA_INVENTORY`
(twelve today; installation state is not account data and is omitted), each with its
stores' export and deletion dispositions and a count taken from the very bundle
`accountBundle` builds for export, so the disclosure can neither name a class the privacy
boundary lacks nor count a row export would not emit. Stores that are never exported
(sessions, run-owned evidence-job state, device-local preferences) report a `null`
count. The Account region renders it as *What Tabiya has recorded*: the class, its
record count, and its download and deletion fate, both derived from the dispositions
rather than written per class. It is a projection of stored rows; it never summarises
what the rows mean. The twelve learner-facing class names in
`apps/web/src/lib/account-inventory-copy.ts` are provisional pending the owner's wording
ruling (UX index IMP-b9); the class set is pinned to the server inventory by tests on
both sides.

## Import

`POST /auth/import-preview` (authenticated, no password) and `POST /auth/import`
(authenticated, current password) take `{ bundle }` / `{ password, bundle }`. The body is
read under a 32 MiB ceiling before parsing (`ACCOUNT_IMPORT_TOO_LARGE`, 413), after
authentication, so an anonymous upload is never buffered.

**Portability versioning.** A bundle's `formatVersion` names its closed shape.
`ACCOUNT_BUNDLE_UPGRADES` lists every version this build reads with the upgrader that
lifts it to the current shape (today only version 1, whose upgrader is the identity); an
unknown or future version is refused with `ACCOUNT_IMPORT_UNSUPPORTED_VERSION` and the
readable set. The upgraded value then passes the same closed `validateAccountBundleV1`
export uses, including run replay; anything else is `ACCOUNT_IMPORT_INVALID`.

**What is restored.** Only the learner's private record, into the authenticated
account: replayable owned runs (hosted by the importer, under a placeholder writer the
learner's first client takes over), their imported-game records, flip-side links whose
both runs are in the file, board marks on restored runs, attempts on restored runs with
their registered and quarantined concept rows, schedules, repertoires with moves, scans
and gap links, and pack drafts, playtest documents and shape drafts. Imported-game PGN is
re-stripped of third-party annotations on the way in ([[D959]]), and its source kind must
be a durable `import-source-protocol` member. Position statistics are rebuilt from the
restored attempts and the longitudinal projections are re-derived from the restored runs
through the ordinary watermark (the restore is a registered longitudinal source mutation);
neither is copied from the file.

**What is not.** Runs that could not be replayed, access previously granted to other
people, runs owned by other people, published packs and shapes, live sessions,
classrooms and share links, and ratings, rated-game records, standings and earned marks
(installation-attested measurements). Each is counted in the receipt's `notRestored`
with its reason; none is silently dropped.

**No merge.** Every restored identity is probed first. If any run, derivation, mark,
schedule, repertoire, gap link, draft or playtest digest already exists in the
installation, the preview lists it and the commit refuses with
`ACCOUNT_IMPORT_CONFLICT` (409) inside the same `BEGIN IMMEDIATE`, writing nothing. A
learner therefore cannot claim another learner's objects by uploading their file, and
re-importing into the same installation is refused rather than duplicated. After an
account is deleted, its private objects are gone and its download restores cleanly into
a new account. The receipt carries the canonical bundle digest.

The Account region offers the import as a file choice that previews first — what would
be added, what would not and why, and any collisions — and asks for the password only
when the preview has no conflicts.

## Deletion

Deletion has preview and commit phases. The preview categorizes permanent deletion,
read-only shared tombstones, revoked anonymous access, and retained immutable
publications. The commit accepts that preview's digest. It recomputes the same plan in
an immediate SQLite transaction and refuses stale consent without changing storage.

A private run hard-deletes with its dependent storage. Anonymous story or join links
are revoked access, not a reason to retain it. An active authenticated grantee or a
foreign-owned derived run is a real dependency, so the run survives only as a neutral,
spectator-only tombstone. Published packs and shapes retain their exact document bytes,
licence, version, and digest while publisher display metadata becomes `deleted account`.

The confirming browser clears all `tabiya:*`, `tabiya.*`, and
`chess-tabiya:run:*:writer-id` keys after account deletion. Deleting one run clears its
addressable writer, mark-scope, and branch-fold keys. Other devices may retain obsolete
preferences, but learner deletion invalidates every server session.

Live storage is removed immediately. Backups are installation-owned and may retain an
older copy until the operator's configured retention period expires; deleting an
account cannot purge an existing backup artifact.

Those limits are stated before a learner starts either destructive flow. Library
warns that a shared run can remain as read-only collaborator history and that a
backup may retain an older copy. The normal Account view automatically loads the
same exact, digest-bound plan used by deletion and presents permanent removal,
shared read-only history, revoked access, retained publications, and backup
retention as a read-only privacy summary. Loading or refreshing the summary cannot
start deletion; a refresh failure removes the stale digest from the confirmation
form and remains retryable. The delete form reuses the current visible summary
instead of maintaining a second description of its effects.

The Account controls own their asynchronous lifecycles. Summary refresh, archive export, deletion,
and sign-out each allow one request, expose their pending state, and render bounded retry guidance
without server diagnostics. Only an account-scoped, digest-bearing preview becomes deletion
authority. Export and deletion retain the submitted password and preview digest while allowing no
late response to clear newer form input. Leaving Settings invalidates local presentation, and an
archive prepared afterwards cannot trigger an unexpected download on the learner's new screen.

The client also states storage consequences at the action that creates each less-obvious
durable record. Starting a rated game names the per-game opponent, side, outcome or
abandonment, and void-reason record, plus its export and account-deletion fate. Accepting
a classroom invitation names the shared membership history and its possible read-only,
identity-scrubbed survival. Creating a public story link states that it has no automatic
expiry and remains readable until revocation or account deletion. Import states that the
PGN tags (including third-party player names) and moves are retained, exported, and removed with
the run or account subject to backup retention, and that comments, engine evaluations and move
annotations are stripped before storage. Each notice is linked to
its action with `aria-describedby`; none interprets the behavioral record.
