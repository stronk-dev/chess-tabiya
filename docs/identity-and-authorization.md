# Learner identity and run authorization

Tabiya's hosted server has one account subject: a learner. A learner signs in
with a public lowercase handle and password, receives an opaque server-side
session in an HttpOnly, SameSite=Strict cookie, and owns no deployment-wide
privileges. There is no operator or administrator account.

Passwords are stored with Node's built-in scrypt using `N=16384`, `r=8`, `p=1`,
a 16-byte random salt, and a 32-byte derived key. Session tokens are 32 random
bytes; only their SHA-256 hashes are stored. Sessions expire after 30 days.
Ten consecutive failures lock a handle for 15 minutes. Login performs one scrypt
derivation for known, unknown, locked, and malformed-hash cases.

## Per-run roles and the writer lease

| Role | Read | Write | Claim board | Manage grants |
|---|---:|---:|---:|---:|
| `host` | yes | yes | yes | yes |
| `participant` | yes | yes | policy-dependent | no |
| `spectator` | yes | no | no | no |

Authorization and possession are separate. A role says whether a learner may
write; the lease says which authorized learner and device currently hold the
board. Every mutation checks, in order: session, run grant, write-capable role,
learner lease holder, then opaque device writer id. Merely learning or capturing
a writer id grants nothing.

Run summaries expose `viewerRole` and the learner holding the lease. A graph
adds whether the requesting device itself holds the lease. No response exposes
the device writer id. Read projections other than that graph viewer block are
identical for every authorized role, so authorization cannot bypass feedback
withholding.

Hosts grant, update, and revoke roles by handle. A run always retains a host.
When removing write access from the current holder, the same SQLite transaction
transfers the lease to the acting host. A host may reclaim explicitly. A participant's
claim follows the board-control policy documented in `live-sessions.md`: a session may
offer or rotate possession, while a session-less multi-writer run is host-directed.
Claims use a transactional current-holder witness; there is no timeout.

For a native match, the board policy also checks the active FEN's side to move against
the learner seated for that color. After a successful ply only the next seated learner
can claim. During an agreed or coach-imposed pause, write-capable grantees may claim for
rehearsal while the match mainline remains locked.

## Persistence and lifecycle

SQLite migration 2 adds learners, hashed sessions, grants, immutable ownership
provenance, and the learner-bound lease. Existing runs are assigned to a real
but non-authenticating `__legacy` sentinel with a host grant. Fresh databases do
not create that row until it is needed.

Deletion is previewed before it mutates anything. A private owned run is permanently
deleted. A run with an active authenticated collaborator or a foreign-owned derived
run survives as a read-only tombstone: its owner and writer become `__legacy`, every
remaining real grant becomes `spectator`, anonymous links are removed, private import
and mark data is removed, and any live session closes. No collaborator can claim the
board, mutate grants, mint links, or reopen the session. Re-registering the deleted
handle inherits nothing because relationships use learner ids.

The preview digest covers the current run snapshots, grants, publications, and shared
classroom facts. Account and per-run deletion recompute that plan under
`BEGIN IMMEDIATE`; changed facts produce `DELETION_PREVIEW_STALE` and no mutation.
Shared classrooms archive as read-only history for active members. Private classrooms
delete. Registered pack and shape bytes remain immutable, with publisher display
metadata changed to `deleted account`; unpublished drafts delete.

## HTTP surface

`/auth/register`, `/auth/login`, `/auth/logout`, `/auth/session`,
`POST /auth/export`, `POST /auth/deletion-preview`, and `POST /auth/delete`
manage the account and cookie. Export and final account deletion re-confirm the
password. Export returns deterministic canonical JSON with its SHA-256 digest and
never includes password, session, token, or provider credentials. Final deletion
also requires the preview digest. `POST /runs/:id/deletion-preview` and
`POST /runs/:id/delete` provide the same stale-safe flow for one host-owned run.
All run routes and the hosted
opponent selector require a session. Run reads additionally require a grant;
missing grants return 404 to avoid disclosing run existence. Grant management and
lease claim use JSON POST bodies and retain the device writer header where it is
part of the concurrency operation.

`/shared/:token` is the sole public capability-token namespace. `story_read` can read a
bounded terminal story. `session_join` can do nothing anonymously: after login or
registration it atomically grants the invited role and, when declared, occupies one open
match seat. It never becomes a writer id and cannot dispatch a run mutation. Only hashes
are stored; join links are single-use by default, expiring, handle-bindable, and
revocable. Every invalid-token state deliberately looks like the same 404.

## Operational limits

- There is no password recovery, email, device list, global sign-out, or account
  administration UI. A forgotten password has no in-application recovery path.
- Rate limiting is per handle only; a hosted reverse proxy should add broader
  abuse controls.
- The application server speaks plain HTTP. Production must terminate TLS in
  front of it; secure cookies are the default. Local HTTP development must set
  `TABIYA_COOKIE_SECURE=false`.
- Cross-origin client/API deployment is unsupported; the shipped client and API
  are same-origin.
- Run events still identify chess actors only as user/opponent/system. A live session's
  possession journal derives the learner responsible for ordinary committed plies;
  Arena imports use their leg attribution instead.
- Account export is not an account-import format. It is a portable, intelligible copy
  of account data. Object-specific PGN and draft interchange remain separate.
- Live rows are removed immediately. Existing operator backups may retain an older
  copy until the deployment's backup policy expires; account deletion cannot rewrite
  a backup already made.
