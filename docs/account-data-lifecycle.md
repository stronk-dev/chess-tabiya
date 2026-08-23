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
