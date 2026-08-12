# RFC: Learner identity and the authorization boundary

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/02-product-shape.md` §Product posture (deployment axis, settled 2026-08-12); `design/03-product-breadth.md` §The foundation edge (F3), gate rows B5/B7/B8
- **Exploration gate:** opened by owner ruling 2026-08-12 — deployment posture amended to hosted multi-user (`planning/exploration/log.md`, entry "deployment posture amended to hosted multi-user")
- **Depends on:** none. Independent of F1 (`rfc/archive/authored-explanation-surface.md`, implemented) and of F2, per `planning/breadth/synthesis.md` §2
- **Parent / amends:** amends the shipped writer lease (`packages/runtime/src/errors.ts:37-44`, `apps/server/src/storage.ts:289-327`) and the shipped run storage schema (`apps/server/src/storage.ts:178-184`)
- **Supersedes / superseded by:** supersedes `planning/breadth/create-and-return.md` §B4.4 and slice B7-1, which pinned `learnerId` as "a single local profile default, no auth" — written before the hosted ruling
- **Planning:** `planning/learner-identity-and-authorization/` (once implementing)

## Summary

There is no user in this system. The only actor token is a browser-minted UUID
(`apps/web/src/lib/writer-session.ts:19-24`), there is exactly one database table
(`apps/server/src/storage.ts:178-184`), and there is no authentication anywhere in
application source. The server publishes each run's writer lease to every reader and
then accepts that same string, presented as a header, as full write authority. **A run
link is a write credential** — defect D1.

The owner ruled hosted multi-user deployment on 2026-08-12. That makes the lease the
whole access-control story, and it makes F3 an identity boundary rather than a local
profile column.

This RFC specifies one primitive: **an account, a session, and a per-run grant**, plus
the separation of *who may write* (authorization) from *who is currently writing* (the
lease). It closes D1 in the same change, because the two are the same change: once
authorization exists, the lease can stop pretending to be it, and the writer id can stop
being published.

## Motivation

### D1, re-verified against the tree

Every claim below was re-run for this RFC. Two of the dossiers' line numbers have
drifted and one consumer was missing from them; corrections are marked.

| Claim | Evidence |
|---|---|
| The lease check is string equality against a request header | `packages/runtime/src/errors.ts:37-44` — `if (activeWriterId !== writerId) throw …`. Its sole production caller is `apps/server/src/service.ts:413` |
| The header is unauthenticated and unqualified | `apps/server/src/rest.ts:188-190` — `requiredString(request.headers.get("x-writer-id"), …)`. No other check exists on any mutation |
| `GET /runs/:id/graph` publishes the active writer id | `apps/server/src/service.ts:53` (type), `apps/server/src/service.ts:258` (emit). **Correction:** the dossiers and `design/BACKLOG.md:100` cite `service.ts:258`; the emit is at `:258` |
| `GET /runs` publishes it on every summary | `apps/server/src/storage.ts:20` (type), `apps/server/src/storage.ts:278` (emit), route at `apps/server/src/rest.ts:402-405` |
| No authentication exists in application source | `grep -rniE "authorization\|bearer\|authenticate\|jwt\|cookie\|x-api-key\|password\|login\|oauth"` over `apps/server/src apps/web/src packages/runtime/src packages/schema/src workers tools deploy compose.yaml .github` → four hits, all in `.github/workflows/release.yml` (`docker/login-action`, GHCR). Zero in application source |
| No learner entity exists | `grep -rniE "learnerId\|userId\|profileId\|accountId\|learner_id\|user_id"` over `apps/*/src packages/*/src workers schemas tools` → zero hits |
| One table | `apps/server/src/storage.ts:178-184` creates `drill_runs` and nothing else; `STORAGE_VERSION = 1` at `:69` with one migration at `:347-353` |
| Read routes require nothing | `apps/server/src/rest.ts:426-449` (`graph`, `events`, `evidence`, `authored-feedback`, `pgn`) and `:531-539` (`compare`) never call `writerId(request)` |
| **Third consumer, absent from the dossiers** | `apps/web/src/App.svelte:103-108` — `writerAccess(run)` compares the locally stored writer id against `run.activeWriterId` from the run *list*, rendered at `:198`. D1's blast radius on the client is three sites, not two |

The exploit needs no tooling: `GET /runs` → copy `activeWriterId` → `POST
/runs/:id/moves` with that value in `x-writer-id`. The client's read-only mode
(`apps/web/src/lib/run-state.ts:248-250`) is a UI convention, not a boundary.

One thing that is **not** leaked, checked because it is the obvious adjacent hole: the
`NOT_ACTIVE_WRITER` error echoes the *caller's own* presented id, not the stored one —
`packages/runtime/src/errors.ts:41` and `apps/server/src/storage.ts:143-148` both
interpolate the parameter, and `apps/server/src/storage.ts:326` passes the caller's
value. The fixture at `apps/web/src/lib/api.test.ts:213` that puts `activeWriterId` in an
error `details` payload is client-side invention; no server code emits it.

### Why now, and why this shape

`design/02-product-shape.md:41-64` records the deployment ruling and its mechanical
consequences, two of which are this RFC: *"Identity is a real boundary"* and *"The writer
lease is not an authorization model … closing it is a prerequisite to hosting, not a
hardening task afterwards."* `design/03-product-breadth.md:185-188` names F3 as blocking
all of B7, both non-host roles in B5, and the D1 fix.

**Out of scope,** each with a reason:

| Out of scope | Why |
|---|---|
| Password reset, email, account recovery | This repo operates no mail transport and this RFC will not pretend otherwise. §12 states the operational consequence instead of shipping a flow that cannot work |
| OAuth / external identity providers | Adds a vendor, a secret store, and a callback surface. Nothing in the ruling requires federated identity |
| MFA, device management, audit log | No product requirement; each is a surface of its own |
| Unauthenticated share links / capability tokens for anonymous audiences | The Twitch case (`planning/breadth/live-and-platform.md` A3) needs an anonymous principal and a session record to attribute it. Grants in this RFC are learner-to-learner, which is producible and consumable today; token grants are one row-shape extension of the same table (§4.4) |
| A session/vote/proposal event log | `planning/breadth/live-and-platform.md` C3 places it outside the run log; it belongs with B5 |
| Per-viewer evidence scope (streamer overlay, coach-reveals) | §10 explains why this RFC must *not* introduce it, and what would have to exist first |
| Lease expiry / heartbeat | §5.3 rejects it on merits, not on sequencing |
| D3 (`POST /runs` silently accepts unknown nested fields) | Different endpoint, different parser. §8.6 hardens only the parsers this RFC adds and says so |
| Multi-tenant data isolation beyond run ownership | Packs are deployment-global content today (`apps/server/src/pack-registry.ts`); nothing here changes that |

## Specification

### 1. Architecture assumption, stated rather than re-decided

This RFC **relies on ADR-0004's modular monolith and does not re-decide it.** The
authorization boundary is a module inside the existing process — a new
`apps/server/src/identity.ts` and `apps/server/src/authorization.ts`, the same SQLite
database, the same HTTP handler chain (`apps/server/src/application.ts:303-313`). No new
service, no new datastore, no reverse-proxy dependency.

ADR-0004's revisit trigger fired with the deployment ruling (`design/BACKLOG.md:173`).
This RFC is evidence *for* the monolith surviving the re-decision, not the re-decision
itself: the hosted posture needs an auth boundary, and an auth boundary is a module.

**`packages/runtime` learns nothing about identity.** `assertActiveWriter`
(`packages/runtime/src/errors.ts:37-44`) keeps its exact signature and body; the
`RuntimeErrorCode` union (`packages/runtime/src/errors.ts:6-11`) is unchanged; no run
event type is added, so the closed union at `packages/runtime/src/types.ts:165-177` and
the closed JSON Schema enum at `schemas/drill_run.schema.json:254-267` are untouched.
Identity is a server concern; chess semantics stay chess semantics.

### 2. The subject

One entity. Named **learner**, because that is the domain word `design/01-training-model.md`
uses and because "user" would invite a generic account system.

```ts
export interface Learner {
  readonly id: string;            // "learner-" + crypto.randomUUID()
  readonly handle: string;        // unique, lowercase, /^[a-z0-9][a-z0-9_-]{2,31}$/
  readonly displayName?: string;  // free text, <= 64 chars, defaults to handle
  readonly createdAt: string;     // ISO-8601
}
```

The handle grammar is normative and enforced at the API boundary. It forbids a leading
underscore, which makes `__legacy` (§6) unregisterable by construction rather than by a
reserved-word list.

`Learner` is the public projection. The password hash and lockout counters live in the
row and **are never included in any response**.

### 3. Authentication

#### 3.1 Password storage

Node's built-in scrypt. No dependency is added (`package.json` gains nothing;
`apps/server/package.json` gains nothing).

Encoded verbatim as a single column value:

```
scrypt$N=16384,r=8,p=1$<salt-base64url>$<key-base64url>
```

- salt: 16 random bytes from `crypto.randomBytes`
- key: 32 bytes from `crypto.scrypt(password, salt, 32, {N: 16384, r: 8, p: 1})`
  (memory cost 128·N·r = 16 MiB, under Node's 32 MiB `maxmem` default)
- comparison: `crypto.timingSafeEqual` over the raw key buffers
- **a stored value that does not parse into exactly this shape fails verification with
  no fallback path.** Never-silent: an unparseable hash is a rejected login, not a
  skipped check.

Password constraints: 10–256 characters, no composition rules, rejected outside that
range with `INVALID_REQUEST`.

#### 3.2 Sessions

Server-side sessions, opaque token, hash at rest.

- token: 32 random bytes, base64url — the value the client holds
- stored: `sha256(token)` hex as the primary key. A database read never yields a usable
  token
- lifetime: **fixed 30-day absolute expiry, no sliding renewal.** Sliding renewal writes
  on every request for no product benefit; a fixed expiry is one column and one
  comparison
- logout deletes the row; expired rows are deleted lazily on lookup

#### 3.3 Transport: cookie, and why

```
Set-Cookie: tabiya_session=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000[; Secure]
```

Grounds, from shipped code:

- The client's API base URL defaults to the empty string (`apps/web/src/lib/api.ts:311`),
  so every request is same-origin relative. The browser harness serves the built SPA from
  the same node process (`playwright.config.ts:19-26`, `apps/server/src/application.ts:312`),
  and `apps/web/vite.config.ts` is five lines with no dev proxy — so same-origin is not an
  assumption, it is the only shipped configuration.
- `fetch`'s default `credentials` is `same-origin`, so **`apps/web/src/lib/api.ts:474-483`
  needs no change to send the cookie.** The request init gains an explicit
  `credentials: "same-origin"` for legibility, not for behaviour.
- `HttpOnly` puts the session out of reach of script, which matters more here than in a
  header scheme because this client renders authored prose.

`Secure` is emitted unless `TABIYA_COOKIE_SECURE=false`, parsed in
`apps/server/src/main.ts` alongside the existing env handling (`apps/server/src/main.ts:11-38`)
and threaded through `ApplicationOptions`. Default is secure; the dev compose sets it
false. This exists because Safari drops `Secure` cookies on `http://localhost`, which
would make plain-HTTP local development silently unusable.

**Cross-origin deployment is unsupported by this RFC.** `VITE_API_URL`
(`apps/web/src/App.svelte:38`) may point the client at another origin; with cookie
sessions that configuration cannot authenticate. It gains a documented constraint, not a
CORS layer.

#### 3.4 CSRF

Analysed rather than assumed, because the shipped router permits shapes a "POST is
protected" rule would miss.

- Every existing mutation route already requires the custom header `x-writer-id`
  (`apps/server/src/rest.ts:398, 466, 486, 504, 515, 545`). A custom header forces a CORS
  preflight, which a cross-site form cannot produce. Those routes are already
  cross-site-unforgeable.
- The routes this RFC adds (`/auth/*`, `/runs/:id/grants`, `/runs/:id/lease`) carry no
  such header. `parseBody` (`apps/server/src/rest.ts:180-186`) calls `request.json()`
  without inspecting `content-type`, so a cross-site `<form enctype="text/plain">` whose
  body happens to be valid JSON would parse.

Two pins, both required:

1. `SameSite=Strict` on the session cookie — the cookie is not attached to any
   cross-site request at all.
2. **Every POST route added by this RFC rejects a request whose `content-type` is not
   `application/json` (optionally with parameters), with `INVALID_REQUEST`.** This closes
   the form vector independent of cookie policy.

Extending the content-type check to the pre-existing POST routes is correct and belongs
with D3's parser hardening; this RFC does not change their parsers.

#### 3.5 Brute-force resistance

Two columns on `learners`: `failed_attempts INTEGER NOT NULL DEFAULT 0` and
`locked_until TEXT`. Ten consecutive failures lock authentication for that handle for 15
minutes; a success resets the counter to zero. A locked handle returns the same
`UNAUTHENTICATED` envelope as a wrong password — the lock is not disclosed, so the
endpoint is not a handle oracle.

This is included, not deferred, because a hosted login endpoint with no failure limit is
a defect at the moment it is exposed, and the mechanism is two columns.

#### 3.6 Endpoints

| Route | Body | Response |
|---|---|---|
| `POST /auth/register` | `{handle, password, displayName?}` | `201 {learner}` + `Set-Cookie` |
| `POST /auth/login` | `{handle, password}` | `200 {learner}` + `Set-Cookie` |
| `POST /auth/logout` | `{}` | `200 {}` + expiring `Set-Cookie` |
| `GET /auth/session` | — | `200 {learner}` or `401` |

`apps/server/src/application.ts:204-212` (`isApiPath`) **must** gain
`pathname.startsWith("/auth/")` and `pathname === "/auth"`. Without it these paths fall
through to `staticResponse` and return `index.html` with status 200 — a silent failure of
exactly the shape this repo keeps rediscovering.

**No guest accounts.** Registration is two fields. An anonymous principal that can own
runs would require a merge-on-signup path and a second identity model, which is the
over-build this RFC's scope rules forbid.

### 4. Authorization

#### 4.1 The two questions, separated

| Question | Answer lives in | Checked |
|---|---|---|
| *May this person write this run at all?* | `run_grants.role` | before every mutation |
| *Is this device the one currently holding the board?* | `drill_runs.active_writer_id` + `active_writer_learner_id` | after authorization, on every mutation |

Authorization is durable, per-person, and survives losing a device. The lease is
transient, per-device, and exists to stop two clients writing the same run concurrently.
Today the lease is doing both jobs and doing the first one wrongly.

#### 4.2 Roles

A closed vocabulary of three, stored under a `CHECK` constraint:

| Role | May read | May write (authorization) | May claim the lease | May manage grants | Producer in this RFC |
|---|---|---|---|---|---|
| `host` | yes | yes | yes | yes | implicit, at run creation |
| `participant` | yes | yes | yes | no | `POST /runs/:id/grants` |
| `spectator` | yes | no | no | no | `POST /runs/:id/grants` |

Every role has a producer *and* a consumer in this RFC. That is deliberate: the
structural finding of `planning/breadth/synthesis.md` §1 is that this codebase's
characteristic defect is a contract that ships with zero producers and reads exactly like
a working feature. A role enum with one reachable value would be another one.

`participant` is the second writer-capable role B5's academy and Twitch scenarios need
(`planning/breadth/live-and-platform.md` A2, "Forbids / cannot express" point 2). This
RFC does not build those surfaces. It makes the shape real: a host grants a second
account `participant`, that account claims the lease, plays, and the board's holder is
recorded as a person.

What this model does **not** express, named because it is a real cost of making
`participant` producible now: **run events carry no learner attribution.** `move.committed`
carries `{node: Node}` (`packages/runtime/src/types.ts:106`) and `Node.actor` is
`"user" | "opponent" | "system"` (`packages/runtime/src/types.ts:65`) — there is no
identity field anywhere on a node, and this RFC refuses to widen the closed run
event union (§1). So on a run with two writer-capable members, the run log says a human
moved and `active_writer_learner_id` says who holds the board *now* — it cannot say who
made ply 14. That is acceptable for the coach-and-student case this enables (both parties
were present) and unacceptable for anything that must be audited or distilled, which is
precisely why the session event log is B5's (`planning/breadth/live-and-platform.md` C3)
and why nothing here should be read as delivering multi-participant sessions.

#### 4.3 The predicate

```ts
export type RunRole = "host" | "participant" | "spectator";

export interface Principal {
  readonly learnerId: string;
  readonly handle: string;
}

/** undefined when the learner holds no grant on the run. */
export function runRole(storage: RunStorage, runId: string, learnerId: string): RunRole | undefined;

export function mayRead(role: RunRole): boolean { return true; }
export function mayWrite(role: RunRole): boolean { return role === "host" || role === "participant"; }
export function mayManageGrants(role: RunRole): boolean { return role === "host"; }
```

Status mapping, chosen explicitly:

- no session → `401 UNAUTHENTICATED`
- session, no grant on the run → `404 RUN_NOT_FOUND`. A run's existence is not disclosed
  to someone with no relationship to it; it is indistinguishable from a bad id
- session, grant present, role insufficient → `403 FORBIDDEN`. Once you are in the run,
  being told you may not write it is not a leak and a 404 would be a lie
- authorized, but not the lease holder → `409 NOT_ACTIVE_WRITER`, exactly as today

#### 4.4 Grant management

The shipped route matcher is a single regex over `/runs/<id>/<action>`
(`apps/server/src/rest.ts:299`) and non-POST verbs on run subroutes return 405
(`apps/server/src/rest.ts:450-454`). So grants get **one** action with a discriminated
body, not a REST verb per operation.

```
GET  /runs/:id/grants   -> 200 { grants: [{ learnerId, handle, role, grantedAt }] }   (host only)
POST /runs/:id/grants   -> 200 { grants: [...] }                                       (host only)
```

```ts
type GrantOp =
  | { readonly op: "grant";  readonly handle: string; readonly role: RunRole }
  | { readonly op: "revoke"; readonly handle: string };
```

`op` is a closed vocabulary; an unrecognised value is `INVALID_REQUEST`, never ignored.
Grants address the target by **handle**, not by learner id — a host knows a person's
handle and does not know their internal id, and this avoids an id-enumeration surface.

Invariants, all enforced server-side:

- A learner holds **at most one** grant per run (`PRIMARY KEY (run_id, learner_id)`); a
  second `grant` for the same learner updates the role.
- A host may not revoke or downgrade **their own** grant if they are the only `host` on
  the run. A run with no host is unadministrable.
- Revoking the grant of the current lease holder clears the lease (§5.4).
- Granting `host` is permitted. Co-hosts are the academy shape and the constraint above
  makes them safe.

The extension point for B5's anonymous audiences is this table's subject column, not a
new model: a token-subject row shape is additive to `run_grants` and to `runRole`.

### 5. The lease, separated

#### 5.1 What does not change

`assertActiveWriter` (`packages/runtime/src/errors.ts:37-44`) is unchanged, byte for
byte. The writer id remains client-minted and per-device
(`apps/web/src/lib/writer-session.ts:19-24`, stored per-run at `:8-10`). It must remain
per-device: if the writer id became the learner id, the same person in two tabs would
pass the check and the concurrency guard would evaporate.

#### 5.2 What changes: the lease is bound to a learner

`drill_runs` gains `active_writer_learner_id`. The mutation path becomes, in order:

1. resolve the session → `Principal`, else `401`
2. `runRole(...)` → `404` if absent
3. `mayWrite(role)` → `403` if false
4. `stored.activeWriterLearnerId === principal.learnerId` → else `409 NOT_ACTIVE_WRITER`
5. `assertActiveWriter(stored.activeWriterId, writerId)` → unchanged

Step 4 is what makes a captured writer id useless even to another *authorized* member of
the same run. Steps 2–3 are what make it useless to everyone else.

The atomic storage predicate is extended to match, so the identity binding is enforced in
the same statement as the snapshot write. `apps/server/src/storage.ts:304-306` currently
reads:

```sql
UPDATE drill_runs
SET snapshot_json = ?, updated_at = ?, summary_json = ?
WHERE id = ? AND active_writer_id = ?
```

and becomes

```sql
UPDATE drill_runs
SET snapshot_json = ?, updated_at = ?, summary_json = ?
WHERE id = ? AND active_writer_id = ? AND active_writer_learner_id = ?
```

#### 5.3 Claim, not transfer; and no expiry

```
POST /runs/:id/lease   -> 200 { holdsLease: true }
```

Any principal with `mayWrite(role)` may claim the lease. The claim is unconditional —
last claimer wins — and sets both `active_writer_id` (to the presented `x-writer-id`) and
`active_writer_learner_id` (to the claimant).

This single operation covers every case the shipped system cannot express
(`docs/branch-runtime.md:236-237`, the documented "continue on this device" gap):

- same learner, new device or cleared `localStorage` → claim
- host hands the board to a participant → the participant claims
- host takes the board back → the host claims

**Expiry is rejected on merits.** A TTL needs a heartbeat, a clock in the read path, and
an "expired" lease state; it takes authority away from someone mid-attempt without an
action, and it does not enable anything claim does not. Claim can never strand anyone,
because authorization — not possession — decides who may take the board.

What claim does not prevent: two authorized writers alternating claims. That is
acceptable, because both were authorized by a host, and the alternative (a grant/accept
handshake) is a surface, not a primitive.

#### 5.4 Cache invalidation — a boundary condition of the shipped code

`SQLiteRunStorage` memoizes `StoredRun` (which *contains* `activeWriterId`) in
`#snapshots` (`apps/server/src/storage.ts:164`, populated at `:205`, `:240`, `:316`).
`read()` returns the cached value without touching the database
(`apps/server/src/storage.ts:216-218`).

Therefore **`claimLease` and grant revocation must write through the cache**, not only
the table. A claim that updates the row but leaves `#snapshots` stale would leave the
previous holder passing step 5 indefinitely, and the failure would be invisible in an
in-memory test that never evicts. This is normative, and §Acceptance criteria tests it
with `clearSnapshotCache()` (`apps/server/src/storage.ts:330-332`) both used and not used.

### 6. Migration

`STORAGE_VERSION` (`apps/server/src/storage.ts:69`) goes `1` → `2`. One entry is appended
to the `migrations` array (`apps/server/src/storage.ts:347-353`), which already runs each
migration once inside `BEGIN IMMEDIATE` and stamps `PRAGMA user_version`
(`apps/server/src/storage.ts:354-364`). No change to the migration machinery.

```sql
-- migration 2: "learner identity and run grants"

CREATE TABLE learners (
  id             TEXT PRIMARY KEY,
  handle         TEXT NOT NULL UNIQUE,
  display_name   TEXT,
  password_hash  TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until   TEXT,
  created_at     TEXT NOT NULL
) STRICT;

CREATE TABLE learner_sessions (
  token_hash  TEXT PRIMARY KEY,
  learner_id  TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL
) STRICT;

CREATE INDEX learner_sessions_learner ON learner_sessions(learner_id);

CREATE TABLE run_grants (
  run_id     TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('host','participant','spectator')),
  granted_at TEXT NOT NULL,
  PRIMARY KEY (run_id, learner_id)
) STRICT;

CREATE INDEX run_grants_learner ON run_grants(learner_id);

ALTER TABLE drill_runs ADD COLUMN owner_learner_id TEXT NOT NULL DEFAULT '__legacy';
ALTER TABLE drill_runs ADD COLUMN active_writer_learner_id TEXT NOT NULL DEFAULT '__legacy';
```

Then, **only when `drill_runs` is non-empty**:

```sql
INSERT INTO learners (id, handle, password_hash, created_at)
VALUES ('__legacy', '__legacy', '!', <now>);

INSERT INTO run_grants (run_id, learner_id, role, granted_at)
SELECT id, '__legacy', 'host', <now> FROM drill_runs;
```

Five pinned decisions, each because SQLite or the existing schema forces it:

1. **The two new `drill_runs` columns carry no `REFERENCES` clause.** SQLite's
   `ALTER TABLE ADD COLUMN` accepts a `REFERENCES` clause only when the default is
   `NULL`, and accepts `NOT NULL` only with a non-null default. The two are mutually
   exclusive, and `PRAGMA foreign_keys = ON` is already set
   (`apps/server/src/storage.ts:174`). `NOT NULL DEFAULT` is chosen so no run row can
   exist without an owner; referential integrity for grants is enforced by `run_grants`'
   real foreign keys.
2. **The backfill owner is `__legacy`, a learner nobody can authenticate as.** Its
   `password_hash` is `'!'`, which does not parse under §3.1 and therefore fails
   verification with no fallback; and its handle is unregisterable under §2's grammar.
   Pre-existing runs stay valid, replayable and foreign-key-clean, and are reachable only
   by an operator reassigning `owner_learner_id` by SQL. The alternative — assigning them
   to the first account created — would silently hand one person another person's data.
3. **The sentinel row is inserted only if runs exist.** A fresh hosted database gets no
   dead row.
4. **`owner_learner_id` is not redundant with the creator's `host` grant, and no
   authorization decision reads it.** Grants are mutable and plural — co-hosts are
   permitted (§4.4) — so they cannot answer "whose data is this" for the account-deletion
   question in Open questions 1, nor survive a host revoking themselves. The column is
   provenance; `run_grants` is authority. Keeping them separate is what lets §4.4 allow
   co-hosts at all.
5. **On a fresh database the constructor's `CREATE TABLE IF NOT EXISTS drill_runs`
   (`apps/server/src/storage.ts:178-184`) still runs first**, then migration 1 adds
   `summary_json`, then migration 2 adds these columns. That ordering already holds for
   migration 1 and is unchanged.

### 7. Storage interface

`RunStorage` (`apps/server/src/storage.ts:29-37`) changes shape. Quoted against the
shipped interface:

```ts
export interface RunStorage {
  create(run: DrillRun, lease: LeaseHolder, title?: string): void;
  read(runId: string): StoredRun | undefined;
  list(learnerId: string, limit: number, offset: number): readonly RunSummary[];
  save(run: DrillRun, lease: LeaseHolder): void;
  close(): void;

  // identity and authorization
  createLearner(input: NewLearner): Learner;
  learnerByHandle(handle: string): StoredLearner | undefined;
  createSession(learnerId: string, tokenHash: string, expiresAt: string): void;
  learnerBySessionToken(tokenHash: string, now: string): Learner | undefined;
  deleteSession(tokenHash: string): void;
  grants(runId: string): readonly RunGrant[];
  grantRole(runId: string, learnerId: string, role: RunRole, at: string): void;
  revokeGrant(runId: string, learnerId: string): void;
  runRole(runId: string, learnerId: string): RunRole | undefined;
  claimLease(runId: string, lease: LeaseHolder): void;
}

export interface LeaseHolder {
  readonly writerId: string;
  readonly learnerId: string;
}
```

`create` inserts the run row **and** the creator's `host` grant inside one
`BEGIN IMMEDIATE` transaction. The shipped `create`
(`apps/server/src/storage.ts:188-214`) is a bare `INSERT`; a run that exists with no host
grant would be permanently unadministrable, so the two writes are atomic.

`StoredRun` (`apps/server/src/storage.ts:23-26`) carries `activeWriterLearnerId`
alongside `activeWriterId`.

Splitting identity into a second class implementing a second interface is permitted but
not required; one SQLite file and one migration ladder is the constraint.

### 8. Endpoint-by-endpoint change

`P` = requires a session. `R` = requires a read grant. `W` = requires `mayWrite`, lease
identity, and lease id.

| Route | Today | After |
|---|---|---|
| `GET /capabilities` | open | open — deployment metadata, no run data |
| `GET /packs`, `GET /packs/:id` | open | open — pack content is deployment-global and authored prose is already stripped (`apps/server/src/pack-registry.ts:42-45`, `:47-74`) |
| `POST /auth/*`, `GET /auth/session` | absent | new (§3.6) |
| `POST /runs` | `x-writer-id` only | **P**; creator becomes owner + `host`; lease = `{writerId, learnerId}` |
| `GET /runs` | returns **every run in the database** | **P**; returns only runs the caller holds a grant on |
| `POST /select-move` | open | **P** — a hosted engine call is a metered cost (`design/02-product-shape.md:58-61`); no run scope, it is stateless |
| `GET /runs/:id/graph` | open, publishes `activeWriterId` | **R**; §9 |
| `GET /runs/:id/events` | open | **R** |
| `GET /runs/:id/evidence` | open | **R** |
| `GET /runs/:id/authored-feedback` | open | **R** |
| `GET /runs/:id/pgn` | open | **R** |
| `POST /runs/:id/compare` | open | **R** — a POST that is a read (`apps/server/src/rest.ts:531-539`, no `writerId(request)`). Called out because a "POST means write" rule would either break it or over-permit it |
| `POST /runs/:id/moves` | lease only | **W** |
| `POST /runs/:id/rewind` | lease only | **W** |
| `POST /runs/:id/fork` | lease only | **W** |
| `POST /runs/:id/evidence` | lease only | **W** |
| `POST /runs/:id/lease` | absent | **P** + `mayWrite`; §5.3 |
| `GET`/`POST /runs/:id/grants` | absent | **P** + `mayManageGrants`; §4.4 |

The run-route matcher at `apps/server/src/rest.ts:299` — currently
`(moves|rewind|fork|graph|compare|events|evidence|authored-feedback|pgn)` — gains
`grants` and `lease`.

`grants` gets a GET branch alongside the existing `graph`/`events`/… GET branches.
`lease` gets none, so `GET /runs/:id/lease` falls through to the existing
`request.method !== "POST"` check and returns 405 (`apps/server/src/rest.ts:450-454`) —
the shipped behaviour, not a new one.

### 9. Every site that publishes `activeWriterId`

Nine production sites, exhaustive, plus eight test fixtures that must be updated or the
change does not compile.

| # | Site | Change |
|---|---|---|
| 1 | `apps/server/src/service.ts:53` — `RunGraph.activeWriterId: string` | **removed**, replaced by §9.1 |
| 2 | `apps/server/src/service.ts:258` — the emit in `graph()` | **removed**; `graph()` takes a `Principal` and a `writerId?` |
| 3 | `apps/server/src/storage.ts:20` — `RunSummary.activeWriterId: string` | **removed**, replaced by `viewerRole: RunRole` |
| 4 | `apps/server/src/storage.ts:278` — the emit in `list()` | **removed**; `list()` selects the caller's role via the `run_grants` join |
| 5 | `apps/web/src/lib/api.ts:33` — client `RunGraph.activeWriterId` | **removed** |
| 6 | `apps/web/src/lib/api.ts:46` — client `RunSummary.activeWriterId` | **removed** |
| 7 | `apps/web/src/lib/session-controller.ts:181-185` | §9.2 |
| 8 | `apps/web/src/lib/writer-session.ts:64-66` — `observe(runId, activeWriterId)` | §9.3 |
| 9 | `apps/web/src/App.svelte:103-108` + `:198` — `writerAccess(run)` | reads `run.viewerRole`; the copy at `:198` is driven by role, not by an id comparison |

Fixtures that must change: `apps/web/src/lib/api.test.ts:79`, `:203`, `:213`;
`apps/web/src/lib/app-shell.test.ts:59`, `:114`;
`apps/web/src/lib/session-controller.test.ts:104`, `:141`, `:224`.

**After this change the string `activeWriterId` appears in no response body from any
route.** That is asserted, not asserted-by-inspection — see acceptance criterion 3.

#### 9.1 The replacement on `GET /runs/:id/graph`

```ts
export interface RunGraph {
  readonly id: string;
  readonly viewer: RunViewer;
  readonly nodes: DrillRun["nodes"];
  readonly branches: DrillRun["branches"];
  readonly activeCursor: DrillRun["activeCursor"];
}

export interface RunViewer {
  readonly role: RunRole;
  readonly mayWrite: boolean;
  /** True when the request's x-writer-id is the run's active writer id. */
  readonly holdsLease: boolean;
  /** The person holding the board, as a person. Never a writer id. */
  readonly leaseHeldBy: { readonly learnerId: string; readonly handle: string };
}
```

`holdsLease` requires the client to send `x-writer-id` on the graph GET, which it does
not today (`apps/web/src/lib/api.ts:407-409`). It is added there. When the header is
absent, `holdsLease` is `false`.

`leaseHeldBy` names a person, which is what the academy and streaming scenarios actually
need and what an opaque UUID never gave them. It is not a credential: knowing that
`@marco` holds the board grants nothing, because writing requires a grant, a session, and
a matching writer id.

**Uniformity:** `viewer` is the only viewer-dependent field in any response, and it
describes the caller's own relationship to the run, never withheld content. Everything
else — nodes, branches, events, evidence, comparisons, PGN — is byte-identical for every
principal that may read the run. §10 depends on this.

#### 9.2 `session-controller.ts`

Shipped (`apps/web/src/lib/session-controller.ts:181-185`):

```ts
const claimed = WriterSession.peek(runId, this.#storage);
const session =
  claimed?.writerId === graph.activeWriterId
    ? claimed
    : WriterSession.observe(runId, graph.activeWriterId);
```

The client decides its own access level by comparing against a value the server should
never have sent, and then *stores the other writer's id in its own session object*. It
becomes:

```ts
const claimed = WriterSession.peek(runId, this.#storage);
const session =
  graph.viewer.holdsLease && claimed !== undefined
    ? claimed
    : WriterSession.observe(runId, this.#storage);
```

The read-only/writer decision moves to the server, which is the only party that can make
it correctly. The follower loop (`apps/web/src/lib/run-state.ts:296-307`) and the
`access` field (`:279-290`) are otherwise unchanged.

#### 9.3 `writer-session.ts`

```ts
/** Creates a non-persisted read-only session. Never holds another writer's id. */
static observe(runId: string, storage: KeyValueStorage = browserStorage()): WriterSession
```

It reuses the locally stored writer id when one exists, otherwise mints a fresh
non-persisted one. The constructor's non-empty invariant
(`apps/web/src/lib/writer-session.ts:32`) is preserved.

### 10. Read projections and anti-contamination

**`feedbackIsRevealed(pack, run)` (`apps/server/src/feedback-policy.ts:11-15`) keeps its
exact signature. It takes no viewer parameter, and this RFC does not add one.**

The reasoning is not "later" — it is that per-viewer widening cannot be made safe with
the model this RFC introduces. The tempting case is B5's streamer overlay: the audience
sees the evaluation while the streamer plays blind. Grant a `spectator` a wider evidence
scope and the leak is immediate and unstoppable: the player creates a second account,
has it granted spectator on their own run, and reads the evidence the withholding barrier
exists to keep from them. Nothing in an account model can prevent one person holding two
accounts.

So the invariant this RFC pins is stronger than the one it inherits:

> For a given run and a given `sinceSeq`, `GET /runs/:id/events`, `/evidence`,
> `/authored-feedback`, `/graph` (excluding `viewer`), `/pgn` and `POST /compare` return
> **byte-identical** bodies to every principal authorized to read the run.

Authorization decides *whether* you may read. It never decides *what* you read. That
keeps the defence-in-depth property `planning/breadth/live-and-platform.md` A2 verified —
engine evidence enters the log only through `applyEvidence` → `attachEvidence`, gated
before reveal — and it means the barrier has exactly one behaviour to test rather than
one per role.

The overlay case therefore needs something this RFC deliberately does not supply: a
per-viewer scope built on F1's path-relative reveal (`rfc/archive/authored-explanation-surface.md`
§1, implemented) plus a threat model for a player who controls both endpoints. That is
B5's, and it is a real design problem rather than a missing parameter.

**What a spectator may fetch, concretely:** the same five read routes and the same
comparison as the host, with `viewer.role === "spectator"` and `viewer.mayWrite === false`.
The shipped follower loop is reused verbatim — it already polls
`/events?sinceSeq` every 2000 ms whenever `access === "read_only"`
(`apps/web/src/lib/run-state.ts:296-307`) — and a spectator client is that loop plus a
role, not a second client.

### 11. Client surface

Minimal and real; the IA is unchanged.

1. **Sign-in is a gate, not a route.** `apps/web/src/lib/router.ts:18-27` keeps its eight
   static routes and the run route; `design/03-product-breadth.md:131-140`'s IA table is
   untouched. `App.svelte` calls `GET /auth/session` on mount and renders a sign-in /
   register view instead of the routed content when it returns 401. A gate avoids
   redirect-after-login state entirely.
2. **`ShellFrame` gains an identity control** — handle and sign out — alongside the
   existing nav (`apps/web/src/lib/ShellFrame.svelte:21-30`).
3. **A 401 from any API call clears client session state and shows the gate.** Without
   this the 2 s follower poll and the 1 s evidence poll
   (`apps/web/src/lib/run-state.ts:296-320`) become infinite 401 loops after a session
   expires.
4. **`DrillClientApi` (`apps/web/src/lib/api.ts:275-289`) gains** `session()`,
   `register()`, `login()`, `logout()`, `claimLease(runId, writerId)`, `grants(runId)`,
   `updateGrants(runId, op)`.
5. **A run whose `viewer.mayWrite` is false and whose lease is held elsewhere shows a
   claim control** when `mayWrite` is true — the first honest surface for
   "continue on this device".

### 12. What this deliberately does not do

Named, because a security primitive that overstates itself is worse than one that does not
exist.

- **No password reset and no account recovery.** There is no mail transport in this repo
  and this RFC does not invent one. A forgotten password is an operator action against
  the database. This is a real operational limitation of a hosted deployment and must be
  stated in `docs/` and in the sign-up copy, not discovered.
- **No email address is collected.** Nothing is sent anywhere.
- **No rate limiting beyond §3.5's per-handle lockout.** No IP-based limiting, no global
  throttle. A hosted deployment fronted by a proxy should add one; the application does
  not pretend to.
- **No TLS opinion.** `apps/server/src/main.ts:40-44` listens on plain HTTP. Cookie
  `Secure` assumes something terminates TLS in front. That is a deployment obligation
  this RFC records and does not implement.
- **No session revocation UI, no device list, no "sign out everywhere".**
- **No authorization on packs.** Pack content stays deployment-global.
- **No audit log.** Current state only (§4.2).
- **No anonymous access of any kind**, including to read routes. That is the change with
  the largest product consequence and it is intentional: on a hosted deployment, a run
  belongs to somebody.

## Deviations from design

1. **`planning/breadth/create-and-return.md` §B4.4 and slice B7-1 are superseded.** They
   pin `learnerId` as "a single local profile default, no auth", explicitly justified by
   ADR-0004's local-first posture. That dossier predates the 2026-08-12 deployment
   ruling. B7-1's *acceptance* survives intact — existing runs backfill, the migration is
   not re-applied on reopen — and is folded into criterion 1 below.
2. **`planning/breadth/live-and-platform.md` C1 proposed a `Session` aggregate with
   capability tokens as the authorization unit.** This RFC uses accounts and per-run
   grants instead. The capability-token model was designed under the self-hosted
   trusted-network assumption that C1's own owner question Q-1 flagged as the fork; the
   ruling took the other branch. C1's central instruction is honoured exactly: the lease
   stays a concurrency guard behind an authorization edge, and `service.ts` and
   `storage.ts` stop emitting `activeWriterId`.
3. **`design/03-product-breadth.md:219-220` permits roles/events plumbing to land with
   program item #3.** This RFC lands the roles half and none of the events half. The
   session event log stays with B5.

## Acceptance criteria

1. **Migration.** A database written by the current build (schema 1, runs present) opens
   under the new build, reports migration 2 once via `onMigration`
   (`apps/server/src/storage.ts:64-67`), backfills every run to `__legacy` with a `host`
   grant, and on a second open reports no migration and leaves `user_version = 2`. A
   fresh database reaches version 2 with no `__legacy` row.
2. **`__legacy` cannot authenticate.** `POST /auth/login` with handle `__legacy` and any
   password fails; `POST /auth/register` with handle `__legacy` fails handle validation.
3. **A reader of `GET /runs` cannot obtain write authority.** The load-bearing test:
   - learner A registers and creates a run against Pack A; learner B registers
   - A grants B `spectator`
   - B calls `GET /runs`, `GET /runs/:id/graph`, `/events?sinceSeq=0`, `/evidence`,
     `/authored-feedback`, `/pgn`, and `POST /compare`
   - **assert the substring `activeWriterId` appears in none of the raw response bodies**
   - collect **every string value** appearing anywhere in those bodies (recursive walk),
     and for each, send `POST /runs/:id/moves` as B with that value as `x-writer-id`
   - **every attempt fails with 403 `FORBIDDEN`**, the run's event count is unchanged,
     and no `move.committed` is appended
   The test is non-vacuous: it asserts the collected string set is non-empty and contains
   the run id and at least one node id.
4. **Forged writer id from an authorized peer.** Repeat criterion 3 with B granted
   `participant` instead of `spectator`, and with B additionally presenting A's real
   active writer id obtained out of band (from the test's own knowledge, not from a
   response). Every attempt fails with 409 `NOT_ACTIVE_WRITER` — step 4 of §5.2 rejects
   it on learner identity. B then calls `POST /runs/:id/lease` and succeeds, and the
   subsequent move succeeds with B's own writer id.
5. **Unauthenticated is 401 everywhere it should be.** With no cookie: `GET /runs`,
   `POST /runs`, `POST /select-move`, and all six run read routes return 401. `GET
   /capabilities`, `GET /packs`, `GET /packs/:id` and `/healthz` return 200.
6. **No grant is 404, wrong role is 403.** Learner C with no grant gets 404 from
   `GET /runs/:id/graph`; spectator B gets 200 from the same route and 403 from
   `POST /runs/:id/moves` and from `POST /runs/:id/lease`.
7. **`GET /runs` is scoped.** With A owning two runs and B granted spectator on one,
   `GET /runs` returns two rows for A and one for B, and B's row carries
   `viewerRole: "spectator"`.
8. **Read projections are identical across roles.** For the same run and `sinceSeq`, the
   bodies of `/events`, `/evidence`, `/authored-feedback`, `/pgn` and `POST /compare` are
   byte-identical for host and spectator; `/graph` differs only in `viewer`. Asserted
   both before and after a checkpoint fires, so the withholding barrier is exercised in
   both states.
9. **`feedbackIsRevealed` is untouched.** Its signature and body are unchanged, asserted
   by the existing feedback-policy tests remaining green and unmodified.
10. **Lease claim invalidates the snapshot cache.** After `claimLease`, a `save` by the
    previous holder fails with `NOT_ACTIVE_WRITER` — asserted twice, once with
    `clearSnapshotCache()` called and once without, on the same in-memory storage
    instance.
11. **Grant invariants.** The sole host cannot revoke or downgrade their own grant (400);
    revoking the current lease holder's grant clears the lease and their next mutation
    fails; a repeated `grant` for the same learner updates rather than duplicates; an
    unrecognised `op` returns `INVALID_REQUEST`.
12. **Atomic creation.** An induced failure inserting the host grant leaves no
    `drill_runs` row.
13. **CSRF pins.** A `POST /runs/:id/grants` with `content-type: text/plain` and a valid
    JSON body is rejected with `INVALID_REQUEST` even with a valid session cookie. The
    `Set-Cookie` header contains `HttpOnly`, `SameSite=Strict`, and contains `Secure`
    under default configuration and omits it under `TABIYA_COOKIE_SECURE=false`.
14. **Lockout.** Ten failed logins lock the handle for 15 minutes; the eleventh attempt
    with the *correct* password also fails, and its response is indistinguishable from a
    wrong password. A success before the tenth resets the counter.
15. **Password hash encoding.** A stored hash that does not parse under §3.1 fails
    verification and never falls through to a success path.
16. **`/auth` is routed as API.** `POST /auth/login` against the full application
    (`createApplication`) with a static directory present returns JSON, not `index.html`
    — the `isApiPath` regression.
17. **Browser acceptance.** In `tests/browser/drill.spec.ts`: a fresh browser registers,
    plays Pack A to the first checkpoint, reloads `/play/run/:id` and remains the writer;
    a second browser context with a second account and a spectator grant follows the run
    read-only, sees the move appear within one poll interval, and has no control that
    commits a move. The harness's server needs no configuration change beyond
    `TABIYA_COOKIE_SECURE=false` (`playwright.config.ts:19-26`).
18. **`make verify` green**, including `pnpm schema:check` — no JSON Schema changes are
    expected and `tools/verify-scaffold.mjs` must confirm it.
19. **`docs/` updated:** `docs/branch-runtime.md` §Writer lease gains the authorization
    edge and its "no transfer" limitation (`docs/branch-runtime.md:236-237`) is replaced
    by the claim contract; a new `docs/identity-and-authorization.md` records the account
    model, the role table, the operational limitations of §12, and the TLS obligation.

## Open questions

1. **Does the hosted deployment need account deletion before it is public?** GDPR-shaped
   obligations depend on jurisdiction and on whether the service is offered to others at
   all. `ON DELETE CASCADE` on `learner_sessions` and `run_grants` makes deletion
   mechanically cheap; what a deleted learner's *runs* become (deleted, or reassigned to
   `__legacy`) is a product decision, not a technical one. Owner ruling required before
   `accepted`.
2. **Is the first account privileged?** A hosted instance has an operator. Nothing here
   distinguishes them, so pack draft loading, deployment settings and future
   administrative surfaces have no subject. Naming an `operator` flag on `learners` now
   is one column; guessing its powers is not. Owner ruling required before `accepted`.

## Changelog

- 2026-08-12: created.
