# RFC: Learner identity and the authorization boundary

- **Status:** implemented
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/02-product-shape.md:50-63` (deployment axis, settled 2026-08-12); `design/03-product-breadth.md:185-188` (F3), gate rows B5/B7/B8 (`design/03-product-breadth.md:165,167,168`)
- **Exploration gate:** opened by owner ruling 2026-08-12 — deployment posture amended to hosted multi-user (`planning/exploration/log.md`, entry "deployment posture amended to hosted multi-user")
- **Depends on:** none.
- **Depended on by:** `rfc/archive/pack-optional-runs.md` (F2). This RFC holds **migration 2** in `rfc/README.md` §Migration register and landed first; F2 rebased its quarantine migration to 3. See §6.1
- **Parent / amends:** amends the shipped writer lease (`packages/runtime/src/errors.ts:37-44`, `apps/server/src/storage.ts:289-327`) and the shipped run storage schema (`apps/server/src/storage.ts:178-184`)
- **Supersedes / superseded by:** supersedes `planning/breadth/create-and-return.md` §B4.4 and slice B7-1, which pinned `learnerId` as "a single local profile default, no auth" — written before the hosted ruling
- **Planning:** `planning/archive/learner-identity-and-authorization/`

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

Every claim below was re-run against the working tree for this revision. Where the
`planning/breadth/` dossiers have drifted, the correction is marked; F1's implementation
moved `apps/server/src/service.ts` under every citation past its midpoint.

| Claim | Evidence |
|---|---|
| The lease check is string equality against a request header | `packages/runtime/src/errors.ts:37-44` — `if (activeWriterId !== writerId) throw …`. Its sole production caller is `#forWrite` at `apps/server/src/service.ts:411-415`, with the call at `:413`. **Correction:** `planning/breadth/live-and-platform.md:39` and `:50` cite `service.ts:395-399`; that range is now inside `evidence()`/`authoredFeedback()` |
| The header is unauthenticated and unqualified | `apps/server/src/rest.ts:188-190` — `requiredString(request.headers.get("x-writer-id"), …)`. No other check exists on any mutation |
| `GET /runs/:id/graph` publishes the active writer id | `apps/server/src/service.ts:53` (type), `apps/server/src/service.ts:258` (emit, inside `graph()` at `:252-263`), route at `apps/server/src/rest.ts:426` |
| `GET /runs` publishes it on every summary | `apps/server/src/storage.ts:20` (type), `apps/server/src/storage.ts:278` (emit, inside `list()`), route at `apps/server/src/rest.ts:402-405` |
| No authentication exists in application source | `grep -rniE "authorization\|bearer\|authenticate\|jwt\|cookie\|x-api-key\|password\|login\|oauth"` over `apps/server/src apps/web/src packages/runtime/src packages/schema/src workers tools deploy compose.yaml .github` → four hits, all in `.github/workflows/release.yml` (`docker/login-action`, GHCR). Zero in application source |
| No learner entity exists | `grep -rniE "learnerId\|userId\|profileId\|accountId\|learner_id\|user_id"` over `apps/*/src packages/*/src workers schemas tools` → zero hits |
| One table | `apps/server/src/storage.ts:178-184` creates `drill_runs` and nothing else; `STORAGE_VERSION = 1` at `:69` with one migration at `:347-353` |
| Read routes require nothing | `apps/server/src/rest.ts:426-448` (`graph`, `events`, `evidence`, `authored-feedback`, `pgn`) and `:531-539` (`compare`) never call `writerId(request)` |
| **Third consumer, absent from the dossiers** | `apps/web/src/App.svelte:103-108` — `writerAccess(run)` compares the locally stored writer id against `run.activeWriterId` from the run **list** (`App.svelte:50`, `:68`, `:128`, `:132`), rendered at `:198`. D1's blast radius on the client is three sites, not two. Recorded as a correction at `planning/breadth/synthesis.md:102` |

The exploit needs no tooling: `GET /runs` → copy `activeWriterId` → `POST
/runs/:id/moves` with that value in `x-writer-id`. The client's read-only mode
(`apps/web/src/lib/run-state.ts:247-249`) is a UI convention, not a boundary.

One thing that is **not** leaked, checked because it is the obvious adjacent hole: the
`NOT_ACTIVE_WRITER` error echoes the *caller's own* presented id, not the stored one —
`packages/runtime/src/errors.ts:41` and `apps/server/src/storage.ts:143-148` both
interpolate the parameter, and `apps/server/src/storage.ts:326` passes the caller's
value. The fixture at `apps/web/src/lib/api.test.ts:213` that puts `activeWriterId` in an
error `details` payload is client-side invention; no server code emits it.

### Why now, and why this shape

`design/02-product-shape.md:50-63` records the deployment ruling and its mechanical
consequences, two of which are this RFC: *"Identity is a real boundary"* (`:57-59`) and
*"The writer lease is not an authorization model … closing it is a prerequisite to
hosting, not a hardening task afterwards"* (`:60-63`).
`design/03-product-breadth.md:185-188` names F3 as blocking all of B7, both non-host
roles in B5, and the D1 fix.

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
| D3 (`POST /runs` silently accepts unknown nested fields) | Different endpoint, different parser. §8 hardens only the parsers this RFC adds and says so |
| Multi-tenant data isolation beyond run ownership | Packs are deployment-global content today (`apps/server/src/pack-registry.ts`); nothing here changes that |
| Administrative roles of any kind | Ruled out by the owner, 2026-08-12. §13 states the constraint and what it forbids a future surface from doing |

## Specification

### 1. Architecture assumption, stated rather than re-decided

This RFC **relies on ADR-0004's modular monolith and does not re-decide it.** The
authorization boundary is a module inside the existing process — a new
`apps/server/src/identity.ts` and `apps/server/src/authorization.ts`, the same SQLite
database, the same HTTP handler chain (`apps/server/src/application.ts:307-315`). No new
service, no new datastore, no reverse-proxy dependency.

ADR-0004's revisit trigger fired with the deployment ruling
(`design/BACKLOG.md:187` — "TRIGGER FIRED 2026-08-12"). This RFC is evidence *for* the
monolith surviving the re-decision, not the re-decision itself: the hosted posture needs
an auth boundary, and an auth boundary is a module.

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
underscore, which makes `__legacy` (§6.1) unregisterable by construction rather than by a
reserved-word list.

`Learner` is the public projection. The password hash and lockout counters live in the
row and **are never included in any response**.

**A handle is a public identifier, not a secret.** §4.4 addresses grants by handle,
§9.1 and §9.2 publish the handle of the person holding the board, and §3.6's
registration must tell a person their chosen handle is taken. §3.5 pins what the
authentication endpoints therefore do and do not conceal.

**Identity is by `id`, never by handle.** Every stored reference — grants, run
ownership, the lease binding — holds `learners.id`. A handle freed by account deletion
(§6.2) can be registered by a different person, and that person inherits nothing.

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
  skipped check. §3.5 pins that it still costs one derivation.

Password constraints: 10–256 characters, no composition rules, rejected outside that
range with `INVALID_REQUEST`. The length check runs on the *presented* password before
any database read; it is a request-shape rule and discloses nothing about any account.

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
  the same node process (`playwright.config.ts:19-26`, `apps/server/src/application.ts:312-314`),
  and `apps/web/vite.config.ts` is six lines with no `server.proxy` — so same-origin is
  not an assumption, it is the only shipped configuration.
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
- Of the routes this RFC adds, `POST /runs/:id/lease` (§5.3) and `POST /runs/:id/grants`
  (§4.4) also require `x-writer-id`, so they join that class. The `/auth/*` routes carry
  no such header. `parseBody` (`apps/server/src/rest.ts:179-186`) calls `request.json()`
  without inspecting `content-type`, so a cross-site `<form enctype="text/plain">` whose
  body happens to be valid JSON would parse.

Three pins, all required:

1. `SameSite=Strict` on the session cookie — the cookie is not attached to any
   cross-site request at all.
2. **Every POST route added by this RFC rejects a request whose `content-type` is not
   `application/json` (optionally with parameters), with `INVALID_REQUEST`.** This closes
   the form vector independent of cookie policy.
3. **Every POST added by this RFC sends a JSON body, even an empty object.** This is a
   boundary condition of the shipped client, not a style rule: `apps/web/src/lib/api.ts:480`
   attaches `content-type: application/json` only when `options.body !== undefined`, so a
   body-less `POST /auth/logout` or `POST /runs/:id/lease` would be rejected by pin 2 by
   its own client. `logout` and `lease` therefore send `{}`.

Extending the content-type check to the pre-existing POST routes is correct and is owned
by D3's parser hardening; this RFC does not change their parsers.

#### 3.5 Brute-force resistance, and exactly what the endpoints disclose

Two columns on `learners`: `failed_attempts INTEGER NOT NULL DEFAULT 0` and
`locked_until TEXT`. Ten consecutive failures lock authentication for that handle for 15
minutes; a success resets the counter to zero. A locked handle returns the same
`UNAUTHENTICATED` envelope as a wrong password.

**Equal bodies are not equal work, so equal work is specified as a code path.** The
dominant cost of a login is the scrypt derivation (16 MiB, §3.1). A missing handle, a
locked handle, or an unparseable stored hash would otherwise skip that cost entirely
while a real unlocked handle pays it, and the difference is measurable from outside. So:

- A module-level `DUMMY_PASSWORD_HASH` is derived once at server start: `crypto.scrypt`
  over 32 random bytes with §3.1's parameters, encoded in §3.1's format. It is never
  written to the database and matches no password.
- `POST /auth/login` performs **exactly one** `crypto.scrypt` derivation and one
  `crypto.timingSafeEqual` per request, whatever the outcome:

| Case | Verified against | Result |
|---|---|---|
| handle unknown | `DUMMY_PASSWORD_HASH` | `401 UNAUTHENTICATED` |
| handle locked | the stored hash, result discarded | `401 UNAUTHENTICATED` |
| stored hash unparseable (§3.1) | `DUMMY_PASSWORD_HASH` | `401 UNAUTHENTICATED` |
| wrong password | the stored hash | `401 UNAUTHENTICATED` |
| correct password | the stored hash | `200`, counter reset, session created |

- Handle-grammar validation runs **after** the verification on the login path, so a
  handle that cannot exist (`__legacy`, or anything violating §2's grammar) does not
  short-circuit the work.
- `POST /auth/delete` reuses the same single-derivation verifier against the *session's*
  learner, so it is one derivation too. It discloses nothing extra: the caller already
  holds a session for that account, and it is subject to the same lockout counters, so it
  is not a rate-limit-free password check.

**What this delivers, stated at its real size.** Lock state and password correctness are
not distinguishable by the cost of a login request. It does not equalize the cheap
remainder — a failure writes `failed_attempts`, a success writes a session row and a
longer response — and this RFC does not claim it does.

**Handle existence is disclosed on purpose, elsewhere.** `POST /auth/register` must
answer "is this handle available", §4.4 grants by handle, and §9.1/§9.2 publish the
handle holding the board. Per §2 a handle is a public identifier. The login endpoint is
not a lock-state or password oracle; no endpoint in this system treats handle existence
as confidential, and none is written as though it did.

#### 3.6 Endpoints

| Route | Body | Response |
|---|---|---|
| `POST /auth/register` | `{handle, password, displayName?}` | `201 {learner}` + `Set-Cookie` |
| `POST /auth/login` | `{handle, password}` | `200 {learner}` + `Set-Cookie` |
| `POST /auth/logout` | `{}` | `200 {}` + expiring `Set-Cookie` |
| `POST /auth/delete` | `{password}` | `200 {}` + expiring `Set-Cookie`; §6.2 |
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

**These two facts are never collapsed in a projection.** A role says what a person may
attempt; the lease says who currently holds the board. §9.1 and §9.2 publish both,
separately, on every surface that shows either — the run graph and the run summary.

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
POST /runs/:id/grants   -> 200 { grants: [...] }                                       (host only, x-writer-id required)
```

```ts
type GrantOp =
  | { readonly op: "grant";  readonly handle: string; readonly role: RunRole }
  | { readonly op: "revoke"; readonly handle: string };
```

`op` is a closed vocabulary; an unrecognised value is `INVALID_REQUEST`, never ignored.
Grants address the target by **handle**, not by learner id — a host knows a person's
handle and does not know their internal id, and this avoids an id-enumeration surface.
The handle is resolved to a learner id once, at the moment of the write; the stored row
holds the id (§2).

`POST /runs/:id/grants` requires `x-writer-id` because a grant mutation can displace the
lease and the replacement holder must be a real device (§4.5). A host whose browser has
no writer id for this run mints one first — `WriterSession.claimFor(runId, storage)`,
the shipped call at `apps/web/src/lib/session-controller.ts:208`.

Invariants, all enforced server-side:

- A learner holds **at most one** grant per run (`PRIMARY KEY (run_id, learner_id)`); a
  second `grant` for the same learner updates the role.
- **Every run has at least one `host` at all times.** A host may not revoke or downgrade
  their own grant if they are the only `host` on the run. A run with no host is
  unadministrable.
- A grant mutation that removes `mayWrite` from the current lease holder transfers the
  lease in the same transaction (§4.5).
- Granting `host` is permitted. Co-hosts are the academy shape and the invariants above
  make them safe.

The extension point for B5's anonymous audiences is this table's subject column, not a
new model: a token-subject row shape is additive to `run_grants` and to `runRole`.

#### 4.5 The lease is always held — atomic transfer, not a nullable column

A grant revocation that "clears the lease" would need storage to represent *no lease*.
It cannot, and making it able to is the more expensive of the two options:

- `active_writer_id` is `TEXT NOT NULL CHECK (length(active_writer_id) > 0)` in the
  shipped constructor (`apps/server/src/storage.ts:181`).
- SQLite's `ALTER TABLE` supports only `RENAME`, `ADD COLUMN`, and `DROP COLUMN`.
  Relaxing `NOT NULL` or dropping a `CHECK` requires the full table-rebuild procedure
  (https://sqlite.org/lang_altertable.html#otheralter): new table, copy, drop, rename.
- That procedure requires `PRAGMA foreign_keys = OFF`, and `PRAGMA foreign_keys` is a
  **no-op inside a transaction** (https://sqlite.org/pragma.html#pragma_foreign_keys).
  The constructor sets it `ON` at `apps/server/src/storage.ts:174`, and every migration
  runs inside `BEGIN IMMEDIATE` (`apps/server/src/storage.ts:354-364`). A rebuild would
  therefore have to run outside the migration machinery this RFC promises not to change.

**Decision: atomic transfer.** No column becomes nullable, `LeaseHolder` stays mandatory,
and `leaseHeldBy` (§9.1) stays mandatory. Instead, the lease is a total function — it
always names a learner — and every operation that could orphan it moves it in the same
transaction.

**The transfer rule, stated over every case a grant mutation permits.** Let `H` be the
host performing the mutation and `T` the target learner:

| Case | Effect |
|---|---|
| `T` is not the lease holder | Lease unchanged |
| `T` is the lease holder, `T ≠ H`, and the mutation removes `mayWrite` from `T` (revoke, or downgrade to `spectator`) | In the same statement batch: write the grant, then set `active_writer_learner_id = H` and `active_writer_id` = the `x-writer-id` presented on this request. `H` is a `host`, so `mayWrite(H)` holds by construction |
| `T` is the lease holder and `T = H` | Rejected with `INVALID_REQUEST`. A host who holds the board may not revoke or downgrade themselves; another writer-capable member claims the board first (§5.3), then the mutation is legal |
| `T = H`, `H` does not hold the lease, `H` is the only host | Rejected by the sole-host invariant (§4.4) |
| `T` is the lease holder and the mutation leaves them `mayWrite` (any move between `host` and `participant`, in either direction) | Lease unchanged |

The rule is total: after any accepted grant mutation, `active_writer_learner_id` names a
learner who holds a `mayWrite` grant on the run, or `__legacy` (§6.2, the account-deletion
path, which has no acting host to transfer to).

**`__legacy` is how "nobody holds the board" is encoded, and it is not a nullable column
in disguise.** `__legacy` is a real `learners` row that cannot authenticate (§6.1, pin 2),
holds no session, and passes step 4 of §5.2 for no principal. Any member with `mayWrite`
takes the board with one claim. The client renders `leaseHeldBy.handle === "__legacy"` as
*unclaimed* and shows the claim control (§11).

**Referential invariant, maintained by five writers.** `active_writer_learner_id` always
names an existing `learners` row: run creation (§7), lease claim (§5.3), grant transfer
(this section), migration backfill (§6.1), and account deletion (§6.2) are the only
writers, and each writes either a learner it has just resolved or `__legacy`, inserting
`__legacy` if absent. `list()` (§9.2) may therefore inner-join `learners` on that column.

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
POST /runs/:id/lease   -> 200 { holdsLease: true }     (body {}, x-writer-id required)
```

Any principal with `mayWrite(role)` may claim the lease. The claim is unconditional —
last claimer wins — and sets both `active_writer_id` (to the presented `x-writer-id`) and
`active_writer_learner_id` (to the claimant).

This single operation covers every case the shipped system cannot express
(`docs/branch-runtime.md:236-237`, the documented "continue on this device" gap):

- same learner, new device or cleared `localStorage` → claim
- host hands the board to a participant → the participant claims
- host takes the board back → the host claims
- the previous holder's grant was revoked or their account deleted → any writer-capable
  member claims, because §4.5 left the lease on the acting host or on `__legacy`

**Expiry is rejected on merits.** A TTL needs a heartbeat, a clock in the read path, and
an "expired" lease state; it takes authority away from someone mid-attempt without an
action, and it does not enable anything claim does not. Claim can never strand anyone,
because authorization — not possession — decides who may take the board.

What claim does not prevent: two authorized writers alternating claims. That is
acceptable, because both were authorized by a host, and the alternative (a grant/accept
handshake) is a surface, not a primitive.

#### 5.4 Cache invalidation — a boundary condition of the shipped code

`SQLiteRunStorage` memoizes `StoredRun` (which *contains* `activeWriterId`) in
`#snapshots` (`apps/server/src/storage.ts:164`, populated at `:205`, `:241`, `:316`).
`read()` returns the cached value without touching the database
(`apps/server/src/storage.ts:216-218`).

Therefore **every writer of the lease binding must write through the cache**, not only
the table. That is three operations, all normative: `claimLease` (§5.3), the grant
transfer (§4.5), and the deletion transfer (§6.2). A write that updates the row but
leaves `#snapshots` stale would leave the previous holder passing steps 4 and 5
indefinitely, and the failure would be invisible in an in-memory test that never evicts.
§Acceptance criteria tests all three with `clearSnapshotCache()`
(`apps/server/src/storage.ts:330-332`) both used and not used.

### 6. Migration and the account lifecycle

#### 6.1 Migration 2

This RFC holds **migration 2** and `STORAGE_VERSION` `1` → `2` under the migration
register in `rfc/README.md`, which also records the landing order: **F3 before F2**, and
`rfc/pack-optional-runs.md` rebases its `quarantine pre-0.5 run snapshots` migration to
3. That RFC's §8 states the dependency on this one.

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

Six pinned decisions, each because SQLite, the existing schema, or the migration register
forces it:

1. **The two new `drill_runs` columns carry no `REFERENCES` clause.** SQLite's
   `ALTER TABLE ADD COLUMN` accepts a `REFERENCES` clause only when the default is
   `NULL`, and accepts `NOT NULL` only with a non-null default. The two are mutually
   exclusive, and `PRAGMA foreign_keys = ON` is already set
   (`apps/server/src/storage.ts:174`). `NOT NULL DEFAULT` is chosen so no run row can
   exist without an owner; referential integrity for grants is enforced by `run_grants`'
   real foreign keys, and §4.5's referential invariant is maintained by the five writers
   named there.
2. **The backfill owner is `__legacy`, a learner nobody can authenticate as.** Its
   `password_hash` is `'!'`, which does not parse under §3.1 and therefore fails
   verification with no fallback (at the cost of one dummy derivation, §3.5); and its
   handle is unregisterable under §2's grammar. Pre-existing runs stay valid, replayable
   and foreign-key-clean. The alternative — assigning them to the first account created —
   would silently hand one person another person's data. §13 records why this sentinel is
   the opposite of a privileged account.
3. **The sentinel row is inserted only if runs exist.** A fresh hosted database gets no
   dead row — and the deletion path (§6.2) inserts it on demand, because a fresh database
   can reach a state that needs it without ever running the backfill.
4. **`owner_learner_id` is not redundant with the creator's `host` grant, and no
   authorization decision reads it.** Grants are mutable and plural — co-hosts are
   permitted (§4.4) — so they cannot answer "whose data is this" for the deletion path in
   §6.2, nor survive a host revoking themselves. The column is provenance; `run_grants`
   is authority. Keeping them separate is what lets §4.4 allow co-hosts at all.
5. **On a fresh database the constructor's `CREATE TABLE IF NOT EXISTS drill_runs`
   (`apps/server/src/storage.ts:178-184`) still runs first**, then migration 1 adds
   `summary_json`, then migration 2 adds these columns. That ordering already holds for
   migration 1 and is unchanged.
6. **Migration 2 replays nothing, so it cannot collide with F2's rewrite of migration 1's
   *body*.** `rfc/README.md` §Migration register records that `rfc/pack-optional-runs.md`
   §8 rewrites `#addRunSummaries` (`apps/server/src/storage.ts:376-400`) to stop calling
   `readBackReplay`. Migration 2 is DDL plus two `INSERT`s that read only `drill_runs.id`;
   it never parses `snapshot_json` and never constructs a `DrillRun`. It is therefore
   insensitive to any run-schema change F2 makes, in either landing order. Migration 2's
   own body is not edited by any other draft.

#### 6.2 Account deletion reassigns, it does not delete runs

Owner ruling, 2026-08-12: **a deleted account's runs are reassigned to `__legacy`, not
deleted.** A run someone else was granted access to, or that appears in another learner's
branch comparison, must not vanish because its original owner left.

`POST /auth/delete` requires a live session and re-entry of the password, verified on
§3.5's single-derivation path. It runs one `BEGIN IMMEDIATE` transaction, in this order —
the order is load-bearing because `ON DELETE CASCADE` removes the learner's grants:

1. `INSERT OR IGNORE` the `__legacy` learner row of §6.1. Necessary because pin 3 skips
   it on a database that never had legacy runs.
2. Record the set of runs on which the departing learner holds the **only** `host` grant.
   This must be read before step 5.
3. `UPDATE drill_runs SET owner_learner_id = '__legacy' WHERE owner_learner_id = ?`.
4. For every run where `active_writer_learner_id` is the departing learner, set
   `active_writer_learner_id = '__legacy'` and `active_writer_id` to an
   application-supplied `` `writer-legacy-${crypto.randomUUID()}` `` — a value no device
   holds, satisfying the shipped `length(active_writer_id) > 0` check. This is §4.5's
   transfer with `__legacy` as the target, because there is no acting host. Evict every
   affected run id from `#snapshots` in the same call (§5.4).
5. `DELETE FROM learners WHERE id = ?`. Sessions and grants cascade.
6. `INSERT OR IGNORE INTO run_grants (run_id, learner_id, role, granted_at) VALUES (?,
   '__legacy', 'host', <now>)` for the runs recorded in step 2, restoring §4.4's
   every-run-has-a-host invariant. `OR IGNORE` because `run_grants` is keyed
   `(run_id, learner_id)` and a run may already carry a `__legacy` grant from the §6.1
   backfill.

None of these statements touch `updated_at` or `summary_json`. Reassignment is not a run
mutation, and `list()` orders by `updated_at DESC` (`apps/server/src/storage.ts:261-264`);
someone else deleting their account must not reorder your run history.

Consequences, stated so none is rediscovered as a defect:

- **Other members keep exactly what they had.** Their grants are untouched, so a granted
  reader still reads a reassigned run. Acceptance criterion 20.
- **A run left with only a `__legacy` host is unadministrable** — nobody can add or
  remove grants on it — and its surviving `participant`s can still play it, because
  `mayWrite` is theirs and the board is claimable. This is the same state a migrated
  legacy run is in, deliberately, so there is one such state rather than two.
- **The handle is freed and confers nothing.** A new person may register it; grants and
  ownership hold learner ids (§2), so the new holder inherits no access. Acceptance
  criterion 20.
- **This is the only deletion path.** There is no route by which one account deletes
  another, and §13 forbids inventing one.

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

  // identity
  createLearner(input: NewLearner): Learner;
  learnerByHandle(handle: string): StoredLearner | undefined;
  learnerById(learnerId: string): Learner | undefined;
  recordLoginFailure(learnerId: string, at: string): void;
  clearLoginFailures(learnerId: string): void;
  deleteLearner(learnerId: string, at: string): void;      // §6.2, one transaction

  // sessions
  createSession(learnerId: string, tokenHash: string, expiresAt: string): void;
  learnerBySessionToken(tokenHash: string, now: string): Learner | undefined;
  deleteSession(tokenHash: string): void;

  // authorization
  grants(runId: string): readonly RunGrant[];
  runRole(runId: string, learnerId: string): RunRole | undefined;
  grantRole(runId: string, learnerId: string, role: RunRole, actor: LeaseHolder, at: string): void;
  revokeGrant(runId: string, learnerId: string, actor: LeaseHolder): void;
  claimLease(runId: string, lease: LeaseHolder): void;
}

export interface LeaseHolder {
  readonly writerId: string;
  readonly learnerId: string;
}
```

`grantRole` and `revokeGrant` take the acting host's `LeaseHolder` because §4.5's
transfer happens in the same transaction as the grant write; they are not two calls the
service sequences, because a crash between them would strand the lease on a learner with
no grant.

`create` inserts the run row **and** the creator's `host` grant inside one
`BEGIN IMMEDIATE` transaction. The shipped `create`
(`apps/server/src/storage.ts:188-214`) is a bare `INSERT`; a run that exists with no host
grant would be permanently unadministrable, so the two writes are atomic.

`list` gains the caller's learner id and joins `run_grants` — it is the scoping mechanism
for `GET /runs`, not a filter applied afterwards.

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
| `GET /packs`, `GET /packs/:id` | open | open — pack content is deployment-global and authored prose is already stripped (`apps/server/src/pack-registry.ts:42-46`, `:47-74`) |
| `POST /auth/*`, `GET /auth/session` | absent | new (§3.6) |
| `POST /runs` | `x-writer-id` only | **P**; creator becomes owner + `host`; lease = `{writerId, learnerId}` |
| `GET /runs` | returns **every run in the database** | **P**; returns only runs the caller holds a grant on |
| `POST /select-move` | open | **P** — a hosted engine call is a metered cost (`design/02-product-shape.md:67-71`); no run scope, it is stateless |
| `GET /runs/:id/graph` | open, publishes `activeWriterId` | **R**; §9.1 |
| `GET /runs/:id/events` | open | **R** |
| `GET /runs/:id/evidence` | open | **R** |
| `GET /runs/:id/authored-feedback` | open | **R** |
| `GET /runs/:id/pgn` | open | **R** |
| `POST /runs/:id/compare` | open | **R** — a POST that is a read (`apps/server/src/rest.ts:531-539`, no `writerId(request)`). Called out because a "POST means write" rule would either break it or over-permit it |
| `POST /runs/:id/moves` | lease only | **W** |
| `POST /runs/:id/rewind` | lease only | **W** |
| `POST /runs/:id/fork` | lease only | **W** |
| `POST /runs/:id/evidence` | lease only | **W** |
| `POST /runs/:id/lease` | absent | **P** + `mayWrite` + `x-writer-id`; §5.3 |
| `GET /runs/:id/grants` | absent | **P** + `mayManageGrants`; §4.4 |
| `POST /runs/:id/grants` | absent | **P** + `mayManageGrants` + `x-writer-id`; §4.4, §4.5 |

The run-route matcher at `apps/server/src/rest.ts:299` — currently
`(moves|rewind|fork|graph|compare|events|evidence|authored-feedback|pgn)` — gains
`grants` and `lease`.

`grants` gets a GET branch alongside the existing `graph`/`events`/… GET branches
(`apps/server/src/rest.ts:426-448`). `lease` gets none, so `GET /runs/:id/lease` falls
through to the existing `request.method !== "POST"` check and returns 405
(`apps/server/src/rest.ts:450-454`) — the shipped behaviour, not a new one.

Parser hardening in this RFC is confined to the routes it adds: the content-type pin of
§3.4, the closed `op` vocabulary of §4.4, and §3.1's password-length rule. The
unknown-nested-field behaviour of `POST /runs` (D3) is a different parser and is not
touched.

### 9. Every site that publishes `activeWriterId`

Nine production sites, exhaustive — two response types, two emits, two client types, and
**three client consumers**. Test fixtures follow.

| # | Site | Change |
|---|---|---|
| 1 | `apps/server/src/service.ts:53` — `RunGraph.activeWriterId: string` | **removed**, replaced by §9.1 |
| 2 | `apps/server/src/service.ts:258` — the emit in `graph()` | **removed**; `graph()` takes a `Principal` and a `writerId?` |
| 3 | `apps/server/src/storage.ts:20` — `RunSummary.activeWriterId: string` | **removed**, replaced by §9.2 |
| 4 | `apps/server/src/storage.ts:278` — the emit in `list()` | **removed**; `list()` selects the caller's role and the lease holder via joins |
| 5 | `apps/web/src/lib/api.ts:33` — client `RunGraph.activeWriterId` | **removed**, mirrors §9.1 |
| 6 | `apps/web/src/lib/api.ts:46` — client `RunSummary.activeWriterId` | **removed**, mirrors §9.2 |
| 7 | `apps/web/src/lib/session-controller.ts:181-185` | §9.3 |
| 8 | `apps/web/src/lib/writer-session.ts:64-66` — `observe(runId, activeWriterId)` | §9.4 |
| 9 | `apps/web/src/App.svelte:103-108` + `:198` — `writerAccess(run)` on the run-**list** value | §9.2 |

Sixteen test occurrences name `activeWriterId` directly and must change:
`apps/web/src/lib/api.test.ts:79`, `:203`, `:213`;
`apps/web/src/lib/app-shell.test.ts:59`, `:114`;
`apps/web/src/lib/session-controller.test.ts:104`, `:141`, `:224`;
`apps/server/src/storage.test.ts:75`, `:116`, `:123`;
`apps/server/src/server.test.ts:115`, `:117`, `:194`, `:247`, `:273`.
Independently, `grep -c '\.create(\|\.save(' apps/server/src/*.test.ts` → 23 call sites
whose signature changes with `LeaseHolder`.

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
  /** Authorization: may this person write this run at all. */
  readonly mayWrite: boolean;
  /** Possession: is this request's device the one currently holding the board. */
  readonly holdsLease: boolean;
  /** The person holding the board, as a person. Never a writer id. */
  readonly leaseHeldBy: { readonly learnerId: string; readonly handle: string };
}
```

`mayWrite` and `holdsLease` are never derived from one another. `mayWrite` is
`mayWrite(role)`; `holdsLease` is a **conjunction of both lease facts**:

```
holdsLease = principal.learnerId === stored.activeWriterLearnerId
          && presented x-writer-id === stored.activeWriterId
```

The conjunction is required, not tidy. Without the learner half, a reader who guessed or
captured a writer id would be told it holds the board, would enter writer mode, and would
then fail every mutation at step 3 or 4 of §5.2 — the client would be lying to its user
about a boundary it does not control.

`holdsLease` requires the client to send `x-writer-id` on the graph GET, which it does
not today (`apps/web/src/lib/api.ts:407-412`). `graph(runId, writerId?)` gains the
parameter and passes it through the shipped `#response` option, which attaches the header
independently of method (`apps/web/src/lib/api.ts:474-479`). When the header is absent,
`holdsLease` is `false`.

`leaseHeldBy` names a person, which is what the academy and streaming scenarios actually
need and what an opaque UUID never gave them. It is not a credential: knowing that
`@marco` holds the board grants nothing, because writing requires a grant, a session, and
a matching writer id. `leaseHeldBy.handle === "__legacy"` means the board is unclaimed
(§4.5).

**Uniformity:** `viewer` is the only viewer-dependent field in any response, and it
describes the caller's own relationship to the run, never withheld content. Everything
else — nodes, branches, events, evidence, comparisons, PGN — is byte-identical for every
principal that may read the run. §10 depends on this.

#### 9.2 The replacement on `GET /runs`, and why a role is not enough

```ts
export interface RunSummary {
  readonly id: string;
  readonly title: string;
  readonly packId: string;
  readonly updatedAt: string;
  readonly objectiveState: ObjectiveState;
  readonly branchCount: number;
  readonly viewerRole: RunRole;
  readonly leaseHeldBy: { readonly learnerId: string; readonly handle: string };
}
```

**`viewerRole` alone would be a regression, not a replacement.** "May write" and
"currently holds the board" are the two facts §4.1 exists to separate. A summary carrying
only `viewerRole` would let home and history label every `participant` as the active
writer merely because their role permits claiming — which is exactly the collapse this
RFC is removing from the mutation path. So the summary carries both, and
`apps/web/src/App.svelte:103-108` becomes a function of the summary plus the signed-in
learner:

```ts
/** Possession. Learner-level; see the limit below. */
function boardStance(run: RunSummary, me: Learner): "you" | "someone-else" | "unclaimed" {
  if (run.leaseHeldBy.handle === "__legacy") return "unclaimed";
  return run.leaseHeldBy.learnerId === me.id ? "you" : "someone-else";
}

/** Authorization. Decides whether a claim/resume control exists at all. */
const mayTakeTheBoard = run.viewerRole !== "spectator";
```

Neither is derived from the other, and neither is rendered as the other. A `participant`
whose host holds the board is shown as *able to take it*, never as holding it.

`list()` produces both in one query — an inner join to `run_grants` on
`(run_id, learner_id = :caller)` for `viewerRole`, which is also the scoping predicate,
and an inner join to `learners` on `active_writer_learner_id` for `leaseHeldBy`. The
second join is safe because of §4.5's referential invariant.

**The honest limit of a summary, pinned because the copy at `App.svelte:198` changes.**
A run summary cannot say whether *this browser* holds the board. Writer ids are per-run
values in `localStorage` (`apps/web/src/lib/writer-session.ts:8-10`) and a list request
carries no per-run writer id, so the server cannot compute device-level possession across
a list — and republishing `activeWriterId` to let the client compute it is D1. Summary
possession is therefore **learner-level**, and the shipped copy "This browser opens as
the writer" (`apps/web/src/App.svelte:198`) becomes learner-level too: *"You hold the
board"*, *"@handle holds the board"*, or *"No one holds the board"* when
`leaseHeldBy.handle === "__legacy"`. Device-level truth exists on one surface,
`viewer.holdsLease` from `GET /runs/:id/graph` (§9.1), because that request carries the
writer id.

The run-history view (`apps/web/src/App.svelte:240-248`) and the artifacts list (`:270`)
render summaries today without any access label. They may now render `viewerRole`, and
they must not render it as possession.

#### 9.3 `session-controller.ts` — and the ordering the new contract forces

Shipped (`apps/web/src/lib/session-controller.ts:176-185`), inside `resume()` at `:168`:

```ts
const [{ document, digest }, capabilities, graph] = await Promise.all([
  this.#api.pack(started.data.packId),
  this.#api.capabilities(),
  this.#api.graph(runId),
]);
const claimed = WriterSession.peek(runId, this.#storage);
const session =
  claimed?.writerId === graph.activeWriterId
    ? claimed
    : WriterSession.observe(runId, graph.activeWriterId);
```

Two faults. The client decides its own access level by comparing against a value the
server should never have sent, and then *stores the other writer's id in its own session
object*. But there is a third, created by §9.1: `viewer.holdsLease` is computed from the
`x-writer-id` on the graph request, and this code reads the local writer id **after** the
graph has already been fetched. **`peek()` must move above the request.** It is a
synchronous `localStorage` read (`apps/web/src/lib/writer-session.ts:39-47`), so hoisting
it costs nothing and does not change what `Promise.all` parallelises:

```ts
const claimed = WriterSession.peek(runId, this.#storage);
const [{ document, digest }, capabilities, graph] = await Promise.all([
  this.#api.pack(started.data.packId),
  this.#api.capabilities(),
  this.#api.graph(runId, claimed?.writerId),
]);
const session =
  graph.viewer.holdsLease && claimed !== undefined
    ? claimed
    : WriterSession.observe(runId, this.#storage);
```

Without the hoist the graph request carries no writer id, `holdsLease` is always `false`,
and every resume opens read-only — a silent, total loss of the resume path that no
server-side test would catch. The read-only/writer decision moves to the server, which is
the only party that can make it correctly. The follower loop
(`apps/web/src/lib/run-state.ts:296-307`) and the `access` field (`:279-290`) are
otherwise unchanged.

#### 9.4 `writer-session.ts`

```ts
/** Creates a non-persisted read-only session. Never holds another writer's id. */
static observe(runId: string, storage: KeyValueStorage = browserStorage()): WriterSession
```

It reuses the locally stored writer id when one exists, otherwise mints a fresh
non-persisted one. The constructor's non-empty invariant
(`apps/web/src/lib/writer-session.ts:32`) is preserved, as is the signature shape of
`peek` and `claimFor`, which already take storage as their second parameter.

### 10. Read projections and anti-contamination

**`feedbackIsRevealed(pack, run)` (`apps/server/src/feedback-policy.ts:11-15`) keeps its
exact signature. It takes no viewer parameter, and this RFC does not add one.**

The reasoning is not sequencing — it is that per-viewer widening cannot be made safe with
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

**The withholding surfaces this invariant covers — six, not five.** The count in
`planning/breadth/live-and-platform.md:87-89` predates F1 and omits the last row; the
correction is recorded at `planning/breadth/synthesis.md:103`. Re-verified for this
revision, with post-F1 coordinates:

| # | Surface | Where |
|---|---|---|
| 1 | `publicNodes` filters engine evidence refs off nodes | `apps/server/src/feedback-policy.ts:17-32`, called by `graph()` at `apps/server/src/service.ts:259` |
| 2 | `publicEvents` truncates at the first engine-feedback event | `apps/server/src/feedback-policy.ts:42-60`, called by `events()` at `apps/server/src/service.ts:280` |
| 3 | `comparisonWithoutEngineFeedback` empties comparison evidence | `apps/server/src/service.ts:64-93`, gated at `:273-274` |
| 4 | `evidence()` returns an empty page | `apps/server/src/service.ts:329-331` |
| 5 | `applyEvidence` raises `FEEDBACK_WITHHELD` | `apps/server/src/service.ts:355-359` |
| 6 | `authoredFeedback()` throws `PACK_NOT_FOUND` with no registered pack — the one surface that fails **closed** | `apps/server/src/service.ts:335-345` |

This RFC changes none of the six. It adds an authorization edge in front of the routes
that reach them, which is why criterion 8 asserts identity across roles both before and
after a checkpoint fires.

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
2. **`ShellFrame` gains an identity control** — handle, sign out, and delete account —
   alongside the existing nav (`apps/web/src/lib/ShellFrame.svelte:21-30`). Deletion
   re-prompts for the password (§6.2) and states in copy that runs are reassigned, not
   destroyed.
3. **A 401 from any API call clears client session state and shows the gate.** Without
   this the 2 s follower poll and the 1 s evidence poll
   (`apps/web/src/lib/run-state.ts:296-320`) become infinite 401 loops after a session
   expires.
4. **`DrillClientApi` (`apps/web/src/lib/api.ts:275-289`) gains** `session()`,
   `register()`, `login()`, `logout()`, `deleteAccount(password)`,
   `claimLease(runId, writerId)`, `grants(runId)`, `updateGrants(runId, op, writerId)`,
   and `graph` gains its optional `writerId` parameter (§9.1).
5. **The claim control appears when `viewer.mayWrite` is true and `viewer.holdsLease` is
   false** — the first honest surface for "continue on this device", and the only control
   that resolves an unclaimed board (`leaseHeldBy.handle === "__legacy"`).
6. **Home and history render role and possession as two separate statements** (§9.2). A
   `participant` who does not hold the board is shown as able to take it, never as
   holding it.

### 12. What this deliberately does not do

Named, because a security primitive that overstates itself is worse than one that does not
exist.

- **No password reset and no account recovery.** There is no mail transport in this repo
  and this RFC does not invent one. A forgotten password is unrecoverable through the
  application; the only in-band remedy is a new account, and the only out-of-band one is
  a direct edit of the database by whoever operates the deployment. This is a real
  operational limitation of a hosted deployment and must be stated in `docs/` and in the
  sign-up copy, not discovered.
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

### 13. There is no operator, and no surface may invent one

Owner ruling, 2026-08-12: **there is no operator concept.** No `operator` flag, no
`admin` role, no privileged account of any kind. `RunRole` (§4.2) is closed at three
values, all of them per-run; `learners` (§6.1) has no capability column; and no route in
§8 grants authority over a run the caller holds no grant on.

**The consequence, stated so it is not rediscovered as a defect: every administrative
capability lives outside the account model — in environment and configuration, never in a
privileged user.** The repo already works this way for the one administrative capability
it has: draft-pack loading is gated on `NODE_ENV=development` at two independent points,
`apps/server/src/main.ts:18-20` (`DRAFT_PACK_FILE requires NODE_ENV=development`) and
`apps/server/src/pack-registry.ts:171-181` (`options.development !== true` throws, and
`content/drafts/` is scanned only when `development === true`). Deployment settings and
engine/provider configuration are environment concerns for the same reason.

Three specific things this forbids, because they are the plausible back doors:

1. **`__legacy` is not an operator.** It is the *least* privileged row in the database: a
   learner with an unparseable password hash (§6.1, pin 2) and an unregisterable handle
   (§2) that no session can ever resolve to. It exists so that ownership and the lease
   remain total functions (§4.5), not so that anyone can act as it. Anything that would
   let a request authenticate as `__legacy` is a defect, and criterion 2 tests for it.
2. **Account deletion is self-service only** (§6.2). There is no route by which one
   account deletes, locks, suspends, or reassigns another. "An admin needs to clean up
   spam accounts" is not a reason to add a role; it is a reason to add an
   environment-gated route or an operational procedure against the database.
3. **Cross-run visibility is never a capability.** `GET /runs` is scoped by grant (§7),
   and a learner with no grant receives 404, not 403 (§4.3) — including the
   first-registered account, which is otherwise the traditional place a superuser
   appears.

If a surface ever genuinely cannot be expressed as an environment-gated capability, that
is new evidence and goes back to the owner as a fresh ruling, not an improvised column.

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
3. **`design/03-product-breadth.md:261-262` permits shared roles/events plumbing to land
   earlier "if another RFC genuinely needs it".** This RFC lands the roles half and none
   of the events half. The session event log stays with B5.

## Acceptance criteria

1. **Migration.** A database written by the current build (schema 1, runs present) opens
   under the new build, reports migration 2 once via `onMigration`
   (`apps/server/src/storage.ts:64-67`), backfills every run to `__legacy` with a `host`
   grant, and on a second open reports no migration and leaves `user_version = 2`. A
   fresh database reaches version 2 with no `__legacy` row.
2. **`__legacy` cannot authenticate.** `POST /auth/login` with handle `__legacy` and any
   password fails; `POST /auth/register` with handle `__legacy` fails handle validation;
   no session token ever resolves to learner id `__legacy`.
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
   `POST /runs/:id/moves` and from `POST /runs/:id/lease`. C is the first account
   registered on the deployment, so the test also pins §13's point 3.
7. **`GET /runs` is scoped, and separates role from possession.** With A owning two runs
   and B granted `participant` on one, `GET /runs` returns two rows for A and one for B.
   While A holds the lease, B's row carries `viewerRole: "participant"` **and**
   `leaseHeldBy.learnerId === A`, and the client's `boardStance` (§9.2) returns
   `"someone-else"` for it while `mayTakeTheBoard` is true — the two facts disagree, and
   the rendered row says so. After B claims the lease, the same row carries the same
   `viewerRole` and `leaseHeldBy.learnerId === B`, and `boardStance` returns `"you"`.
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
    instance. The same pair is asserted for the grant transfer (criterion 12) and the
    deletion transfer (criterion 20).
11. **`holdsLease` needs both halves.** `GET /runs/:id/graph` as spectator B, presenting
    A's real active writer id in `x-writer-id`, returns `viewer.holdsLease === false`.
    `GET /runs/:id/graph` as A with no `x-writer-id` header also returns `false`. A with
    the correct header returns `true`.
12. **Grant invariants and the lease transfer.** The sole host cannot revoke or downgrade
    their own grant (400); a repeated `grant` for the same learner updates rather than
    duplicates; an unrecognised `op` returns `INVALID_REQUEST`; and, over §4.5's table:
    - B (participant) holds the lease; A revokes B with A's own `x-writer-id`. B's next
      mutation is 404; A's next mutation succeeds **with no intervening claim**;
      `leaseHeldBy.learnerId === A`.
    - The same with a downgrade of B to `spectator` instead of a revoke.
    - Co-host A holds the lease and revokes A: `INVALID_REQUEST`. Co-host B claims the
      lease, then A revokes A: succeeds, and `leaseHeldBy.learnerId === B`.
    - Revoking a learner who does not hold the lease leaves `active_writer_id` and
      `active_writer_learner_id` byte-identical.
13. **Atomic creation.** An induced failure inserting the host grant leaves no
    `drill_runs` row.
14. **CSRF pins.** A `POST /runs/:id/grants` with `content-type: text/plain` and a valid
    JSON body is rejected with `INVALID_REQUEST` even with a valid session cookie. A
    body-less `POST /runs/:id/lease` from `DrillApi` is rejected, and the shipped client
    sends `{}` so it is not (§3.4 pin 3). The `Set-Cookie` header contains `HttpOnly`,
    `SameSite=Strict`, and contains `Secure` under default configuration and omits it
    under `TABIYA_COOKIE_SECURE=false`.
15. **Lockout and equal work.** Ten failed logins lock the handle for 15 minutes; the
    eleventh attempt with the *correct* password also fails, and its response is
    indistinguishable from a wrong password. A success before the tenth resets the
    counter. Separately, with `crypto.scrypt` instrumented, **exactly one derivation per
    request** is observed for each of: unknown handle, locked handle, unparseable stored
    hash, wrong password, correct password. This asserts the code path, not a wall-clock
    measurement, so it is deterministic.
16. **Password hash encoding.** A stored hash that does not parse under §3.1 fails
    verification and never falls through to a success path.
17. **`/auth` is routed as API.** `POST /auth/login` against the full application
    (`createApplication`) with a static directory present returns JSON, not `index.html`
    — the `isApiPath` regression.
18. **Resume sends the writer id.** `DrillSessionController.resume` is asserted to read
    the local writer id **before** issuing `GET /runs/:id/graph`: a fake API records the
    `writerId` argument it received, and a resume by the lease-holding device yields
    `access === "writer"`. The regression this pins — `peek()` after the request — makes
    every resume read-only, so the test also asserts the fake received a defined
    `writerId`.
19. **Browser acceptance.** In `tests/browser/drill.spec.ts`: a fresh browser registers,
    plays Pack A to the first checkpoint, reloads `/play/run/:id` and remains the writer;
    a second browser context with a second account and a spectator grant follows the run
    read-only, sees the move appear within one poll interval, and has no control that
    commits a move. The harness's server needs no configuration change beyond
    `TABIYA_COOKIE_SECURE=false` (`playwright.config.ts:19-26`).
20. **Deleted accounts reassign, and grants survive.** A creates run R and grants B
    `spectator`; A holds the lease. A calls `POST /auth/delete`. Then:
    - R still exists; `owner_learner_id = '__legacy'`; `active_writer_learner_id =
      '__legacy'` and `leaseHeldBy.handle === "__legacy"`, asserted with and without
      `clearSnapshotCache()`
    - **B still gets 200 from `GET /runs/:id/graph`, `/events`, `/evidence`,
      `/authored-feedback`, `/pgn` and `POST /compare`**, and R appears in B's `GET /runs`
      with `viewerRole: "spectator"` — the granted reader retains access to a reassigned
      run
    - A's session token returns 401; `POST /auth/login` with A's handle fails
    - a **new** learner registers A's freed handle and gets 404 from every route on R
    - the same test run against a database that never had legacy runs (no `__legacy` row
      after migration, pin 3) succeeds, proving the on-demand insert of §6.2 step 1
    - the variant where B is a `participant` leaves B able to claim the lease and play,
      and unable to manage grants
21. **No privileged account exists.**
    `grep -rniE "operator|superuser|is_admin|\badmin\b"` over `apps/server/src`,
    `apps/web/src`, `packages/*/src` and the migration SQL returns no capability
    construct, and `RunRole` has exactly three members.
22. **`make verify` green**, including `pnpm schema:check` — no JSON Schema changes are
    expected and `tools/verify-scaffold.mjs` must confirm it.
23. **`docs/` updated:** `docs/branch-runtime.md` §Writer lease gains the authorization
    edge and its "no transfer" limitation (`docs/branch-runtime.md:236-237`) is replaced
    by the claim contract; a new `docs/identity-and-authorization.md` records the account
    model, the role table, the lease-transfer rule, the account-deletion behaviour, the
    no-operator constraint of §13, the operational limitations of §12, and the TLS
    obligation.

## Open questions

None.

## Changelog

- 2026-08-12: implemented and approved after independent verification; canonical behavior
  is in `docs/identity-and-authorization.md` and the lease/storage sections of
  `docs/branch-runtime.md`.
- 2026-08-12: created.
- 2026-08-12: revision 2, after adversarial review. Five blockers closed and both owner
  rulings folded into the specification body.
  - **Lease orphaning (§4.5, new).** Grant revocation previously promised to "clear the
    lease" while `active_writer_id` is `NOT NULL CHECK (length > 0)`
    (`apps/server/src/storage.ts:181`) and both the learner binding and `leaseHeldBy` were
    mandatory. Resolved as **atomic transfer**, not nullability, because relaxing the
    shipped constraint requires SQLite's full table rebuild and a `PRAGMA foreign_keys`
    toggle that is a no-op inside the migration's `BEGIN IMMEDIATE`. §4.5 states the
    transfer rule over every case a grant mutation permits, `POST /runs/:id/grants` now
    requires `x-writer-id` so a displaced lease has a real device to land on, and
    `__legacy` is the encoding for an unclaimed board.
  - **Resume ordering (§9.3).** `WriterSession.peek` is hoisted above the `Promise.all`
    that fetches the graph, and `graph(runId, writerId?)` carries the id, because
    `viewer.holdsLease` cannot be computed from a request that does not present one. The
    unhoisted form would make every resume read-only. Criterion 18 pins it.
  - **Role is not possession (§9.2, §4.1, §11.6).** `RunSummary` carries `viewerRole`
    **and** `leaseHeldBy`; `viewerRole` alone would have let home and history call every
    `participant` the active writer. The section also pins why summary possession is
    learner-level and device-level possession exists only on `/graph`.
  - **Login timing (§3.5).** The "not a handle oracle" claim is replaced by a specified
    fixed dummy-hash path: exactly one scrypt derivation per login regardless of outcome,
    with the residual non-equalized work named. Handle existence is restated as public by
    design (§2), which is what registration and grant-by-handle already require.
  - **Migration 2 (§6.1).** Collision with `rfc/pack-optional-runs.md` resolved centrally
    in `rfc/README.md` §Migration register: this RFC keeps migration 2 and lands first;
    F2 rebases to 3 and is recorded as depending on this RFC in the header.
  - **Deleted accounts (§6.2).** Reassignment to `__legacy` specified as a six-step
    transaction with the ordering constraint that `ON DELETE CASCADE` imposes, plus the
    on-demand `__legacy` insert a fresh database needs. Criterion 20 asserts a granted
    reader retains access, and that a re-registered handle inherits nothing.
  - **No operator (§13, new).** The ruling is stated as a standing constraint with the
    three back doors it forbids, grounded in the existing environment gate for draft
    packs (`apps/server/src/main.ts:18-20`, `apps/server/src/pack-registry.ts:171-181`).
  - **Citations re-verified against the tree.** Corrected: `service.ts:395-399` →
    `:411-415` for `#forWrite` (F1 shifted the file); `design/BACKLOG.md:173` → `:187`
    for the ADR-0004 trigger; `design/02-product-shape.md:41-64` → `:50-63`, and the
    hosting-cost citation → `:67-71`; `design/03-product-breadth.md:219-220` →
    `:261-262`; `rest.ts:180-186` → `:179-186`; `run-state.ts:248-250` → `:247-249`;
    `application.ts:303-313` → `:307-315`. The withholding-surface count is corrected to
    six (§10) and the test-fixture list to sixteen occurrences plus 23 `create`/`save`
    call sites (§9). The malformed self-referential correction row in §Motivation is
    removed. `§8.6` and `Open questions 1`, both cross-references to sections that do not
    exist, are replaced by real ones.
