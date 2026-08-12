# Learner identity and authorization log

Append-only.

## 2026-08-12 — Codex implementation start

- Owner instruction treated as acceptance of revised F3 and F2; F3 moved to `implementing`, F2 to `accepted` and waiting on F3.
- Re-read RFC-0000 and the revised F3 in full before changing code.
- The preceding adversarial findings are incorporated in revision 2: atomic lease transfer, resume request ordering, role/possession separation, fixed-work login path, and the migration register.
- B6a–d remain draft and were reviewed separately; their blockers do not widen F3.

## 2026-08-12 — Codex F3 implementation

- Added migration 2 with learners, hashed sessions, per-run grants, learner-bound
  leases, scoped summaries, and cache-safe atomic lease transfer for grant changes
  and account deletion. The legacy sentinel is created only for migrated runs or
  deletion reassignment, never on a fresh database.
- Added fixed-work scrypt authentication, hardened same-origin cookies, lockout,
  typed 401/403/404/409 boundaries, host/participant/spectator grants, and
  unconditional lease claim. Full-application construction always installs the
  identity boundary; the identity-less REST form remains only for pre-F3 unit
  harnesses that instantiate the low-level handler directly.
- Removed writer ids from graph and summary responses. Browser resume now peeks
  before graph fetch, sends its local id, and trusts the server's two-factor
  `holdsLease` projection. Observer sessions never receive or persist another
  device's id.
- Added the account gate, identity control, role/possession copy, claim control,
  session-expiry handling, and a real two-browser spectator-follow acceptance.
- Tests cover migration replay, no sentinel on fresh storage, fixed derivation
  count, lockout, forged writer ids, scoped lists, spectator denial, grant
  transfer, deletion reassignment, cache eviction, cookie flags, and resume
  ordering. Canonical behavior is in `docs/identity-and-authorization.md` and the
  writer-lease section of `docs/branch-runtime.md`.
