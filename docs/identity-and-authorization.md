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

## Persistence and lifecycle

SQLite migration 2 adds learners, hashed sessions, grants, immutable ownership
provenance, and the learner-bound lease. Existing runs are assigned to a real
but non-authenticating `__legacy` sentinel with a host grant. Fresh databases do
not create that row until it is needed.

Deleting an account reassigns its owned runs and held leases to `__legacy`
rather than deleting shared artifacts. Other learners' grants survive. A surviving
participant retains access but needs the host-directed possession policy satisfied
before writing; a newly registered account
using the deleted handle inherits nothing because all references use learner ids.

## HTTP surface

`/auth/register`, `/auth/login`, `/auth/logout`, `/auth/delete`, and
`/auth/session` manage the account and cookie. All run routes and the hosted
opponent selector require a session. Run reads additionally require a grant;
missing grants return 404 to avoid disclosing run existence. Grant management and
lease claim use JSON POST bodies and retain the device writer header where it is
part of the concurrency operation.

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
