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
publications, live/social history, and rating/profile records.

The server emits the canonical bytes as a 64 KiB-chunked response stream and imposes
no account-size refusal. It does not create a temporary export file, so account export
has no temporary-disk allocation or cleanup bound; cancellation stops further chunks.

The export deliberately excludes password hashes, failed-login and lock state,
sessions, bearer tokens and token hashes, provider credentials, deployment
configuration, and installation-wide official content. Browser-local writer ids,
board-view preferences, assistance preferences, and workflow presets are named as an
exclusion because another device's copy is neither account data nor recoverable by the
server. There is no account-import endpoint.

Registration states this storage boundary before account creation: saved games and
rehearsals, learning progress, and authored or published work are tied to the account.
It points to the password-confirmed account download and deletion paths without
claiming recovery or a server-side account-import path that does not exist.

The account download is a Tabiya archive for safekeeping and inspection, not a
chess-interchange file: neither Tabiya nor other chess products import it. The
Account region states that boundary before download and links to Library, where
each visible game can be downloaded directly as standard PGN without opening the
run. Branch-selective export remains available inside the run.

Stored run text is not silently dropped. A valid document is emitted as parsed JSON;
invalid stored JSON uses a lossless raw UTF-8 arm with a typed diagnostic.

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

The client also states storage consequences at the action that creates each less-obvious
durable record. Starting a rated game names the per-game opponent, side, outcome or
abandonment, and void-reason record, plus its export and account-deletion fate. Accepting
a classroom invitation names the shared membership history and its possible read-only,
identity-scrubbed survival. Creating a public story link states that it has no automatic
expiry and remains readable until revocation or account deletion. Import states that the
original PGN, including third-party identifiers and annotations, is retained, exported,
and removed with the run or account subject to backup retention. Each notice is linked to
its action with `aria-describedby`; none interprets the behavioral record.
