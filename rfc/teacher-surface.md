# RFC: Teacher surface — the roster is not a grant

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/03-product-breadth.md` §Live and community — the *"Arena and
  events"* row (*"scheduled pack nights, invitations, **cohorts**, two-leg position
  matches, team relays"*) and the **B5** gate row; `design/03` §Learn and return (the
  return loop this RFC writes into); `design/05-in-run-experience.md:41` (*absence is
  stated, never simulated*) and its region 5 (*session/role controls appropriate to
  solo, host, participant, or spectator*); `design/00-thesis.md` §§70, 93-94 (no
  lesson content — an assignment points at a pack, it does not author teaching).
  *Every code site below is cited **by symbol name**; line numbers are advisory. The
  tree moved roughly thirteen times on 2026-08-15. Locate `RUN_ROLES`, `run_grants`,
  `permittedAssistance`, `feedbackDeliveryOpen`, `mayManageGrants`, `updateGrant`,
  `SESSION_KINDS`, `mintLink` and `STORAGE_VERSION` by name, not by number.*
- **Exploration gate:** owner ruling 2026-08-15 — **scope it now**, explicitly
  overriding the *defer with a named trigger* verdict in
  `design/research/broadcast-and-teacher-surfaces.md` §7.2. That dossier is this RFC's
  entire evidence base and its §4 is the specification's starting point, including the
  finding it corrected: **the streamer and academy surfaces already ship**, as
  `SESSION_KINDS = ["stream","academy","match"]` (`apps/server/src/live-types.ts:3`),
  so nothing in this RFC is a live-session mode.
- **Depends on:**
  - `rfc/archive/learner-identity-and-authorization.md` — owns `run_grants`, `RUN_ROLES`
    and the per-run consent object this RFC extends rather than replaces.
  - `rfc/archive/live-session-platform.md` — owns the academy session, spectator
    projection, possession journal and the 2026-08-12 *no per-viewer withholding*
    ruling, which this RFC **does not revisit**.
  - `rfc/archive/social-match.md` — owns `match_states` and the match seat whose
    asymmetry this RFC closes (§5).
  - `rfc/archive/adoption-wave-1.md` — owns `public_tokens`. This RFC **adds no token
    scope and creates no second token surface**; enrolment is handle-bound (§3.2).
  - `rfc/archive/return-and-progression.md` — owns `attempts`, `schedules` and `/learn`.
    This RFC writes a card into `/learn` and **does not touch the scheduler**.
  - `rfc/live-marker-quality.md` (*implementing*) — owns the `permittedAssistance`
    permission table as a ceiling, and its acceptance tests assert that participants
    and spectators are refused. §5 is deliberately shaped to be a **pure narrowing** of
    that table so this RFC can land behind it without forcing a rebase.
  - `rfc/client-surface-floor.md` (*implementing*) — owns the dead compact **Session**
    tab (D62). This RFC's honesty requirement in §2.4 is unmet on a phone until that
    lands; it is named as a dependency, not re-fixed here.
- **Parent / amends:** amends `run_grants` (one nullable column), `live_sessions` (one
  nullable column) and `permittedAssistance`'s context (one field). Introduces four new
  tables and one new client route pair. **No run-schema change. No pack-schema change.
  No new drill mode, no new session kind, no new token scope, no new `RunRole`.**
- **Supersedes / superseded by:** —
- **Planning:** `planning/teacher-surface/` (once implementing)

## Summary

A teacher can already watch a student play, hand them the board, reveal to a class, walk
N boards on the simul wall and distil the finished session into a pack — all of it
shipped, all of it verified in `broadcast-and-teacher-surfaces.md` §4.1. What does not
exist is anything **standing**: a named group, a unit of work addressed to it, and a way
for that work to come back. This RFC ships those three things and nothing else, on one
rule that decides every detail: **enrolment is not observation.** A roster grants the
right to *address* a learner; only the learner's own act grants the right to *see* their
run. The two consent objects stay separate at the schema level, not merely in the UI.

## Motivation

### The design problem, which is a consent problem

A spectator on a stream is watching a performance the host chose to give. A teacher
watching a student mid-drill is watching someone **be wrong on purpose** — which is the
product's method, not an accident of it (`design/05-in-run-experience.md`: *"it is
coaching you past the mistake that would have taught you"*). Two claims are both
legitimate and they point in opposite directions:

- the teacher's claim to see **more** than a stranger: they are responsible for this
  learner's progress, and a coach who can only see what was published cannot coach;
- the learner's claim to a **private attempt**: the rehearsal loop only works if being
  wrong is cheap, and it stops being cheap the moment someone is always watching.

The shipped product resolves the general case correctly. A grant is a row in
`run_grants` (`storage.ts`, `CREATE TABLE run_grants`, PK `(run_id, learner_id)`),
minted per run, host-only through `mayManageGrants` (`authorization.ts`), revocable
through the shipped `POST /runs/:id/grants {op:"revoke"}` route (`rest.ts`, `route.action
=== "grants"`; `RunService.updateGrant`). Its granularity is exactly one attempt at one
position, and the learner who owns the run is its host.

A roster is a different object in kind. It is **standing** — it does not end when the
run ends — and it is **ambient** — it is about a person, not an attempt. If enrolment
carried observation, then joining a class would silently convert every future private
attempt into an observed one, and the learner would have consented once, in the abstract,
to something they experience continuously. That is the smuggle this RFC exists to
prevent, and preventing it is most of the specification.

### Why the surface is scoped now rather than deferred

The research recommended deferring behind a named trigger. The owner overrode it on
2026-08-15. This RFC records the override honestly: the *live* teaching case genuinely
ships and could be piloted today with academy sessions and per-run grants; what is being
bought now is the **asynchronous** half — assignment and return — plus the consent
architecture that the live half will otherwise grow by accretion. The argument for doing
it now rather than later is that the consent model is cheap to get right while there are
zero rosters in existence and expensive afterwards.

### Explicitly out of scope

- **Any widening of `/progress*`.** All six progress routes take only `authenticate()`
  and resolve to that principal (`rest.ts` `/progress`, `/progress/due`,
  `/progress/related`, `/progress/metrics`, `/progress/milestones`,
  `/progress/schedules/:id`; `RunService.progress`, `.due`, `.related`,
  `.progressMetrics`, `.milestones`, each of which passes `principal.learnerId` down).
  **No route in this RFC takes another learner's id as a subject.** A teacher never sees
  a learner's attempt history, due queue, metrics or milestones. Class analytics is the
  feature this RFC most conspicuously refuses.
- **Team relays and native matchmaking** — a relay is a play-format change, not a roster
  feature; matchmaking is outside minimal-real scope by the `design/03` B5 ruling.
- **Per-viewer withholding.** The 2026-08-12 ruling (`rfc/archive/live-session-platform.md`
  §3.8) stands: `feedbackDisclosed` and `feedbackDeliveryOpen`
  (`packages/runtime/src/feedback.ts`) take no viewer parameter and this RFC adds none.
- **Grading, scoring, or any teacher-facing verdict.** A submission is received, never
  marked.
- **Making `session.kind` behavioural (D81).** Considered and refused — see §6.

## 1. What ships already, and is therefore not respecified

Verified in this pass; each is load-bearing below.

| Primitive | Symbol | What it gives the teacher surface |
|---|---|---|
| Per-run consent | `run_grants` table; `RUN_ROLES = ["host","participant","spectator"]` (`storage.ts`) | the only object that means "may see this run" |
| Consent management | `mayManageGrants` (host-only, `authorization.ts`), `RunService.updateGrant`, `POST /runs/:id/grants` | mint and revoke, already learner-controlled |
| Consent visibility | `GET /runs/:id/grants` → `RunStorage.grants(runId)`, returning handle + role per grantee | the learner can enumerate who may watch |
| Cross-learner run listing | `RunStorage.list`, whose SQL joins `run_grants g ON g.run_id = r.id AND g.learner_id = ?` and projects `viewerRole` | a granted teacher's `GET /runs` already contains the student's run |
| Read authorization | `requireRead` → `runRole(runId, learnerId)`; `mayRead` is true for every role | one chokepoint for "may this principal read this run" |
| Disclosure barrier | `feedbackDisclosed`, `feedbackDeliveryOpen` (`packages/runtime/src/feedback.ts`) — **run-parameterised only** | the teacher can never be shown a rung the run has not opened |
| Live coaching | `academy` session kind, `host_directed` board control, `POST /runs/:id/reveal` under the host lease, spectator projection with `withheld` truncation | *"class, here is what the pack says"* already works |
| Simul supervision | `GET /sessions` → `LiveBoardSummary` per active session | N student boards on one page |
| Session→pack | `distillRun` (`distill.ts`), emitting `provenance.sources: ["session_distilled", …]` with graduation blockers | a lesson recorded from a class is already a draft pack |
| Handle-bound invitation | `LiveSessionService.invite` (grants `participant` by handle); `mintLink` (`session_join` scope, 1 use / 14 d default, 1–90 d, 50 active links) | the invitation idiom this RFC copies rather than reinvents |
| Registered packs | `registered_packs` (PK `(pack_id, version)`); resolution through the pack registry's `get(packId)` | the unit an assignment points at |

## 2. The consent model

### 2.1 Two objects, never one

| | **Grant** | **Enrolment** |
|---|---|---|
| Object | one run | one person |
| Lifetime | until revoked or expired | standing, until either side leaves |
| Who may create | the run's host — the learner | a classroom teacher, **as a proposal only** |
| Who must consent | the learner (they are the host) | **both** — the invitee must accept |
| What it authorises | reading that run at its disclosure level | addressing the learner: assigning, inviting |
| What it does **not** authorise | anything about the person | **reading anything at all** |

**The normative rule, stated so it can be tested:** no code path may derive a
`run_grants` row from a `classroom_members` row alone. The only writer of
classroom-minted grants is `POST /assignments/:id/submissions`, whose actor is the
**learner**, on a run the learner hosts. §9 makes this an acceptance test.

### 2.2 Why submission, not observation, is the return path

The teacher's legitimate claim to see more is honoured by giving the learner a
one-gesture way to hand a specific attempt over — not by giving the teacher a standing
window. A submission is:

- **specific** — one run, chosen by the learner;
- **explicit** — a POST the learner makes, never a side effect of playing;
- **enumerable** — it produces an ordinary `run_grants` row, so it appears in the
  shipped `GET /runs/:id/grants` alongside every other watcher;
- **revocable by the shipped route** — the learner is the run's host, so
  `POST /runs/:id/grants {op:"revoke", handle}` already works on it with no new code;
- **expiring** — §4.3.

Minting a real grant row rather than inventing a parallel visibility rule is the whole
design. It means the teacher surface adds **no second authorization path**, which is the
D4/D8 two-sources-of-truth defect class the product has been bitten by before.

### 2.3 What a teacher may see of a submitted run — answered with the disclosure model

The question *"does the teacher see everything the learner saw, or more — including
engine evidence the learner declined?"* contains a false premise, and the code settles
it rather than intuition:

1. **There is no per-viewer disclosure and this RFC adds none.** `feedbackDisclosed(run)`
   and `feedbackDeliveryOpen(run)` take a run and nothing else
   (`packages/runtime/src/feedback.ts`). A teacher with a grant is projected the same
   run state as any other reader of that run.
2. **A completed run is disclosed for everyone.** Every arm of `feedbackDisclosed`
   returns true once `outcome.reached` is in the event log. So a submitted, finished
   attempt is fully open — to the learner and to the teacher identically. The teacher
   sees *more than a stranger* only because a stranger has no grant.
3. **"Evidence the learner declined" is not a persisted thing.** Assistance preference is
   client-local: `assistanceKey(kind)` writes `tabiya.assistance.v1.<kind>` into browser
   storage (`apps/web/src/lib/assistance-preference.ts`), and the server stores no record
   of what a learner chose to open. Evidence is computed on request against the run's
   disclosure state. What the teacher gains is **availability the learner also had and
   did not use** — the same rail, unopened. That is not a privilege and does not need
   one.
4. **The one thing a teacher is refused today is a defect, not a policy.** `RunService.evidence`
   gates on `feedbackDeliveryOpen` alone with no role check, so a granted teacher does
   receive staged engine evidence; but `/human-split` and `/corpus` call
   `permittedAssistance({sessionKind, deliveryOpen, role})` and refuse every role except
   `solo`/`host` (`packages/runtime/src/assistance.ts`). So on the same disclosed run a
   teacher receives Stockfish and is refused Maia and the opening explorer. This RFC
   **does not fix that half** — the permission table is owned in flight by
   `rfc/live-marker-quality.md`, whose acceptance tests assert spectator refusal — and it
   is carried as Open question 1 with a concrete proposal rather than taken unilaterally.

### 2.4 The learner must be able to see who is watching

Every classroom-minted grant is an ordinary `run_grants` row and therefore already
appears in `GET /runs/:id/grants` with the teacher's handle. Two client requirements
follow:

- the assignment card in `/learn` (§7.2) names, in words, every teacher who currently
  holds access to each submitted run, and offers revoke;
- **the in-run answer is D62's** — the compact **Session** tab is inert and its role
  condition is inverted, so the learner most likely to be observed (a student on a phone)
  cannot see the room. That is owned by `rfc/client-surface-floor.md`. This RFC declares
  the dependency and adds an acceptance criterion that the desktop session/grant list
  renders classroom-minted grants indistinguishably from any other (§9), so nothing about
  a teacher's presence is special-cased into invisibility.

## 3. Specification — the standing objects

### 3.1 Scope answer: what the unit is

**The unit is the assignment; the roster is what an assignment is addressed to.** Live
observation and completed-run review both already reduce to the per-run grant (§1), so
neither needs a new aggregate. What is genuinely absent is (a) a named standing group and
(b) an addressable unit of work with a return path. This RFC ships exactly those.

**Relationship to the events layer** (`design/BACKLOG.md` row *"Events layer: pack
nights, cohorts, team relays"*): this RFC **subsumes** its roster half and its
scheduling atom, and **does not** subsume the rest. Concretely —

| Events-layer item | Here |
|---|---|
| **Cohorts** | **subsumed** — a classroom *is* the cohort (§3.2) |
| **Scheduled pack nights** | **subsumed, minimally** — `live_sessions.scheduled_for` persists today with no producer, no consumer and no UI; §3.5 gives it both by letting a classroom own a scheduled session |
| **Team relays** | **not subsumed** — a relay changes who plays which ply, which is a play-format change, not a roster feature. The ledger row keeps it |
| **Native matchmaking** | **not subsumed** — outside minimal-real scope by the `design/03` B5 ruling |

Ledgering the roster and the calendar apart guarantees each waits for the other, which is
the research's §7.3 finding; ledgering relays *with* them would have hidden a play-format
change inside a permissions RFC. The proposed ledger edit is reported in §10, not made.

### 3.2 Classrooms and enrolment

```sql
CREATE TABLE classrooms (
  id TEXT PRIMARY KEY,
  owner_learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  archived_at TEXT
) STRICT;
CREATE INDEX classrooms_owner ON classrooms(owner_learner_id);

CREATE TABLE classroom_members (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  learner_id   TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  member_role  TEXT NOT NULL CHECK (member_role IN ('teacher','learner')),
  state        TEXT NOT NULL CHECK (state IN ('invited','active','left')),
  invited_by   TEXT REFERENCES learners(id) ON DELETE SET NULL,
  invited_at   TEXT NOT NULL,
  joined_at    TEXT,
  left_at      TEXT,
  PRIMARY KEY (classroom_id, learner_id)
) STRICT;
CREATE INDEX classroom_members_learner ON classroom_members(learner_id, state);
```

Rules:

- **`member_role` is not a `RunRole` and must not be conflated with one.** `RUN_ROLES`
  stays a three-member closed enum; no fourth role is added anywhere.
- Creation: the creator is inserted as `('teacher','active')` in the same transaction.
- **Invitation is handle-bound and requires acceptance.** A teacher POSTs a handle,
  resolved through `learnerByHandle` exactly as `LiveSessionService.invite` and
  `updateGrant` already do; the row lands `state='invited'` and confers nothing. Only the
  invitee may move it to `active`. No anonymous enrolment token exists — this RFC adds no
  scope to `public_tokens`, whose CHECK stays the two shipped scopes.
- A learner may be `active` in many classrooms; a classroom may have many teachers.
- Caps, mirroring the shipped `mintLink` bounds so the trust surface stays consistent:
  200 members per classroom, 50 classrooms owned per learner, 20 outstanding invitations
  per classroom.
- Leaving is always available to either side (§4.2) and is not a teacher privilege:
  `{op:"leave"}` acts on the caller, `{op:"remove", handle}` is teacher-only.

### 3.3 Assignments

```sql
CREATE TABLE assignments (
  id            TEXT PRIMARY KEY,
  classroom_id  TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  pack_id       TEXT NOT NULL,
  assigned_by   TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  note          TEXT,
  due_at        TEXT,
  created_at    TEXT NOT NULL,
  withdrawn_at  TEXT
) STRICT;
CREATE INDEX assignments_classroom ON assignments(classroom_id, created_at);
```

- **A teacher may assign a registered pack and nothing else.** `pack_id` carries no
  foreign key because `registered_packs` is keyed `(pack_id, version)` and served content
  also resolves through the registry; the service validates with the registry's
  `get(packId)` and refuses `INVALID_REQUEST` for an unknown pack. Assigning a position,
  a shape, an arbitrary FEN or a specific *branch* is refused in v1 and named in Open
  questions.
- **`note` is a human teacher's prose, attributed and never merged into evidence.** It is
  rendered under the assigning teacher's handle, in a card that is visually and
  structurally separate from the evidence rail, and it is never passed to any evidence,
  explanation or voice path. **Law 8 note:** nothing in this RFC generates chess content;
  an LLM is not invoked anywhere in it, and a teacher's sentence is attributed human
  speech, not product-voice chess truth.
- **`due_at` is advisory.** It does **not** create a `schedules` row. The return loop's
  scheduler is the learner's own (`schedules`, keyed `learner_id`, with `origin IN
  ('auto','learner')`); an assignment is a third party's request and conflating it with
  spaced repetition would corrupt B7's semantics and the `01` ruling that concepts select
  but never schedule. An overdue assignment is displayed as overdue and blocks nothing.
- Withdrawal (`withdrawn_at`) stops new submissions and hides the card; it does **not**
  retroactively revoke grants already minted, because each of those was an individual
  consenting act (the learner may still revoke each — §4.1).

### 3.4 Submissions — the only path from roster to grant

```sql
CREATE TABLE assignment_submissions (
  assignment_id       TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  learner_id          TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id              TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  granted_learner_ids TEXT NOT NULL,
  submitted_at        TEXT NOT NULL,
  access_expires_at   TEXT NOT NULL,
  withdrawn_at        TEXT,
  PRIMARY KEY (assignment_id, learner_id, run_id)
) STRICT;
CREATE INDEX assignment_submissions_run ON assignment_submissions(run_id);
```

`granted_learner_ids` is a JSON array of learner ids, following the shipped
`live_sessions.rotation_json` precedent for arrays inside a STRICT table.

`POST /assignments/:id/submissions {runId, expiresInDays?}` — the **learner** only:

1. the caller must be `('learner','active')` in the assignment's classroom, and the
   assignment must not be withdrawn;
2. `runRole(runId, caller) === 'host'` — a learner may only submit a run they host;
3. the run's `packId` must equal `assignment.pack_id`; otherwise `INVALID_REQUEST`;
4. `expiresInDays` defaults to 90 and is bounded 1–90, deliberately identical to
   `mintLink`'s shipped rule;
5. for every `('teacher','active')` member of the classroom **at this instant**, insert
   `run_grants(run_id, teacher, 'spectator', now, expires_at)` with `INSERT OR IGNORE`.
   Record in `granted_learner_ids` **only** the ids for which a row was actually created,
   so withdrawal can never delete a grant this submission did not mint;
6. all of it in one `BEGIN IMMEDIATE` transaction, following the repo's storage idiom.

Consequences, stated because they are choices:

- **A teacher who joins later gets nothing.** The consent was to the teachers present.
- **A teacher already holding a stronger role keeps it unchanged**, and it is not
  recorded as minted, so withdrawal will not touch it.
- Submission is idempotent per `(assignment, learner, run)`; re-submitting a withdrawn
  submission clears `withdrawn_at` and re-mints under a fresh expiry.
- A learner may submit more than one run to one assignment — three attempts at the same
  pack is the product working, and refusing that would push honest learners toward
  submitting only their best attempt.

### 3.5 Pack nights — the events-layer atom, given a producer and a consumer

```sql
ALTER TABLE live_sessions ADD COLUMN classroom_id TEXT REFERENCES classrooms(id) ON DELETE SET NULL;
```

(Nullable with a NULL default, which is what SQLite requires of an added column carrying
a `REFERENCES` clause while foreign keys are on; no table rebuild, unlike migration 14.)

- A classroom teacher may set `classroomId` when creating a live session
  (`LiveSessionService.create`), and only for a classroom in which they are
  `('teacher','active')`.
- `scheduled_for`, which persists today with no producer and no consumer, becomes
  readable: `GET /classrooms/:id` returns the classroom's sessions ordered by
  `scheduled_for`, and the classroom view renders upcoming ones.
- **A classroom session confers no membership and no grant.** Joining it uses the shipped
  paths — a handle invitation or a `session_join` link — unchanged. A pack night is an
  ordinary `academy` session that a classroom happens to own.
- `ON DELETE SET NULL`: deleting a classroom must never delete a session or its run.

## 4. Revocation and expiry — because a roster is standing

A per-run grant needed no expiry story. A standing relationship that can mint grants
does, or "standing" quietly becomes "ambient", which is the thing §2 exists to prevent.

### 4.1 Four revocation paths, all of which must reach the grant

| Trigger | Effect |
|---|---|
| Learner withdraws a submission (`{op:"withdraw", runId}`) | delete exactly the `run_grants` rows named in `granted_learner_ids`; set `withdrawn_at` |
| Learner leaves / is removed from the classroom | in one transaction: set `state='left'`, then revoke every grant minted by that learner's submissions in that classroom |
| A teacher leaves / is removed | in one transaction: set `state='left'`, then revoke that teacher's minted grants across every submission in that classroom |
| Classroom archived or deleted | revoke every grant minted by any submission in it |

Plus the shipped path, which needs no new code and must keep working: the learner is the
host of their own run, so `POST /runs/:id/grants {op:"revoke", handle}` removes a
teacher at any time.

**Divergence between the two records is expected and must be rendered, not hidden.** If
the learner revokes directly, the submission row survives with its grant gone. The
teacher's classroom view then shows *"submitted 2026-08-16 — access revoked by the
learner"*, computed by re-checking `runRole(run_id, teacher)`. It must never show a
working link that 404s, which is the `design/05:41` *absence is stated, never simulated*
invariant applied to a permissions surface. The `run_grants` row remains the **single**
source of truth for access; `assignment_submissions` is the record of the act.

### 4.2 Enrolment is symmetrically exitable

Either side may end the relationship, and ending it is a complete revocation, not a
cosmetic state change. A teacher cannot trap a learner in a classroom, and a learner
leaving does not need the teacher's cooperation.

### 4.3 Grant expiry — a real claim on shipped shape, stated loudly

```sql
ALTER TABLE run_grants ADD COLUMN expires_at TEXT;
```

`NULL` means never expires, which every existing row is, so the migration is additive
with no backfill. A grant whose `expires_at` is non-null and `<= now` is **treated as
absent everywhere**, not merely hidden.

This is the riskiest change in the RFC, because a single missed read site is a silent
access leak. Every reader of `run_grants` is therefore enumerated, and the enumeration is
an acceptance test (§9):

1. `RunStorage.runRole` — the authorization chokepoint behind `requireRead`;
2. `RunStorage.list` — the `GET /runs` join projecting `viewerRole`;
3. `RunStorage.grants` — `GET /runs/:id/grants`;
4. the host-count guard inside `grantRole`/`revokeGrant`;
5. the write-capable-member count used to derive board control;
6. `#roleInTransaction` — the handoff-target check;
7. the session-join upserts in `redeemSessionJoinToken` and in session member joining,
   which promote `spectator` to `participant`;
8. the `onlyHostRuns` query in `deleteLearner`, which restores a legacy host so no run
   becomes hostless.

Sites 4, 5, 7 and 8 are **structural** rather than disclosure-facing: an expired grant
must not be counted as a host, must not keep a run in `host_directed`, and must not be
silently upgraded by a later session join. Site 8 in particular must treat an expired
host grant as absent, or account deletion could leave a run with no live host. Where a
site cannot distinguish, it fails closed.

Expiry is enforced at read time rather than by a sweep, precisely so the row never
outlives its truth. A background purge is permitted as housekeeping but is never the
mechanism.

## 5. D80 — assistance keyed on governance role, and the coach who takes a seat

`permittedAssistance` (`packages/runtime/src/assistance.ts`) computes
`mayRequestSplit = (role === "solo" || role === "host") && deliveryOpen`. In a native
match a `matchSlot` may only bind `invitedRole: "participant"` (`LiveSessionService.mintLink`,
re-enforced at the route boundary), while the host may occupy the other seat
(`docs/live-sessions.md` §Native human matches). At the mutually-accepted pause — which
is exactly when a write-capable member may reveal — the **host-seated player may request
the Maia human-split and corpus evidence and the guest may not.**

This is not a leak; it is asymmetric information in a competitive contest, produced by
keying assistance on governance role rather than playing status. **It bites the coach-vs-student
case identically and by construction**, which is why this RFC owns the fix: a classroom
makes coach-versus-student sparring a first-class flow, and shipping that flow over a
known seat asymmetry would be building over a defect silently.

### 5.1 The fix is a pure narrowing

`AssistanceContext` gains one field and the rule gains one conjunct:

```ts
export interface AssistanceContext {
  readonly sessionKind: RunSessionKind;
  readonly deliveryOpen: boolean;
  readonly role: "solo" | "host" | "participant" | "spectator";
  readonly seatedInContest: boolean;   // new
}
// mayRequestSplit = (role === "solo" || role === "host") && deliveryOpen && !seatedInContest
```

`seatedInContest` is true iff the run has a `match_states` row and the principal is its
`whiteLearnerId` or `blackLearnerId`. It is **not** conditioned on pause state: a seat is
a seat for the duration of the contest, and making the permission flicker at every pause
would be a worse contract than either extreme.

**The field is required, not optional-with-a-default**, so the compiler enumerates every
consumer rather than letting a missed site inherit a silent `false`. The consumers are:

| Consumer | Resolves `seatedInContest` from |
|---|---|
| `GET …/human-split` (`rest.ts`) | the run's `match_states` row versus `principal.learnerId` |
| `GET …/corpus` (`rest.ts`) | same |
| the machine-seeded group path (`RunService`, the `permittedAssistance` call guarding `GROUP_SEEDS`) | same |
| `assistanceContext` (`apps/web/src/lib/DrillScreen.svelte`) | the session detail's `match` state versus the signed-in learner — the client already computes this for `learnerOwnsActiveMatchTurn` in `App.svelte` |
| `liveMarkers` (`packages/runtime/src/pivotal.ts`, which calls `permittedAssistance` itself) | passed through its context |
| `packages/runtime/src/adaptive-guidance.test.ts` and `apps/web/src/lib/client-surface-floor.test.ts` | explicit in each case |

`pivotal.ts` is also the file `rfc/live-marker-quality.md` is rewriting, which is the
second reason for the landing order below.

**Direction check.** This removes capability from the host-seated player and adds it to
nobody. Participants and spectators are unaffected, so
`rfc/live-marker-quality.md`'s acceptance assertions — markers absent and
`ASSISTANCE_WITHHELD` returned for participant and spectator contexts — continue to hold
unchanged, and its standing rule that *the ceiling is `permittedAssistance`'s table*
survives with the table merely lowered in one cell. **Landing order: behind
`live-marker-quality`.**

**Outcome for coaching:** a non-playing host — the coach — keeps host assistance, which
is right, because they are teaching rather than competing. Two students sparring get an
identical rail whoever hosted. The coach who *takes a seat* is levelled to their
opponent, which is the case the defect was found in.

### 5.2 What is deliberately not fixed here

The other half of the same defect — that a granted **observer** with a legitimate claim
(a teacher reviewing a submitted, disclosed run) is refused Maia and corpus while
receiving Stockfish from `RunService.evidence`, which has no role check at all — is a
change to the same table in the *widening* direction, and the table is in flight. It is
Open question 1, with a proposal, not a unilateral edit.

## 6. `session.kind` (D81) — considered and refused

The brief's suggestion that making `session.kind` behavioural might be the cheapest
correct foundation was tested against this design and rejected, for a reason worth
recording:

- a classroom is **not a session**. It is standing and asynchronous; `SESSION_KINDS` is
  a label on a live-session aggregate that ends. Hanging a roster off it would be the
  category error `broadcast-and-teacher-surfaces.md` §4.4 warns about, where three
  distinct objects hide under one word;
- this RFC needs **no per-context assistance policy**, so it has nothing to hang on
  `kind`. §5's fix reads match seating, which is already a persisted fact in
  `match_states` and carries no dependence on the label;
- adding a fourth kind (`classroom`) would widen a closed, SQL-constrained,
  route-validated enum with two behavioural branches to gain a label that
  `classroom_id` expresses better, as a relation.

**D81 therefore stays open and unclaimed by this RFC.** Making `kind` behavioural is a
live-session concern — most plausibly the vehicle for D82's five-contexts-versus-three-
preference-keys gap (`design/05:147` against `RunSessionKind = pack | position |
imported`, whose three keys collapse match, stream and on-ramp into `position`). Both
belong to whoever next owns the assistance-context surface. Naming them here without
claiming them is the point.

## 7. Routes and client surface

### 7.1 Routes

All authenticated; all following the shipped `POST` + `op` idiom used by
`/runs/:id/grants` and `/progress/schedules/:id`.

| Method + path | Actor | Effect |
|---|---|---|
| `POST /classrooms` `{name}` | any learner | creates; caller becomes `('teacher','active')` |
| `GET /classrooms` | any | classrooms where the caller is `invited` or `active`, with their `member_role` |
| `GET /classrooms/:id` | member | name, members (handle, `member_role`, `state`), assignments, upcoming sessions; **for teachers**, submissions with per-run access status |
| `POST /classrooms/:id` `{op:"archive"}` | owner | archives and revokes (§4.1) |
| `POST /classrooms/:id/members` `{op:"invite", handle, role}` | teacher | inserts `invited` |
| `POST /classrooms/:id/members` `{op:"accept"\|"decline"\|"leave"}` | the member themselves | own row only |
| `POST /classrooms/:id/members` `{op:"remove", handle}` | teacher | removes and revokes |
| `POST /classrooms/:id/assignments` `{packId, note?, dueAt?}` | teacher | validates `packId` against the registry |
| `POST /assignments/:id` `{op:"withdraw"}` | assigning teacher or owner | sets `withdrawn_at` |
| `GET /assignments` | any | the caller's open assignments across all their classrooms, with classroom name, assigning handle, note, `dueAt`, and their own submissions |
| `POST /assignments/:id/submissions` `{runId, expiresInDays?}` | the learner | §3.4 |
| `POST /assignments/:id/submissions` `{op:"withdraw", runId}` | the learner | §4.1 |

Non-members receive the same not-found response for every classroom and assignment id,
following the uniform-404 non-disclosure rule the token surface already applies. No route
in this table accepts another learner's id as a subject.

### 7.2 Client

Two additions, both minimal, split by whose surface each is:

- **Live → Classrooms** (teacher side): a list of the caller's classrooms; a detail view
  with members and their states, an invite-by-handle form, an assignment form (pack,
  optional note, optional due date), the assignment list with per-learner submission
  status, and the classroom's upcoming scheduled sessions. Submission rows link to the
  run through the shipped run view; a revoked or expired one renders its stated reason
  and no link.
- **Learn → Assigned** (learner side): a card section above *Due now* in the existing
  `/learn` view (`route.name === "learn"` in `App.svelte`), showing for each open
  assignment **who assigned it** (handle), **when**, **the classroom**, **their note if
  any**, and **the due date if any**; a button to start the pack; a submit control listing
  the caller's runs of that pack; and, per submitted run, the teacher handles that
  currently hold access with a revoke control (§2.4).

The `/learn` copy line *"This is an attempt history and return queue, not a mastery
score"* stays true and stays rendered: nothing in this RFC adds a score, and the assigned
section must not imply one.

## 8. Deviations from design

1. **`design/03` §Live lists cohorts and team relays in one row whose B5 gate reads
   "shipped".** This RFC ships cohorts and the pack-night scheduling atom and explicitly
   does not ship team relays. The row overstates in the way the reconciliation gate keeps
   finding; the correction is **reported in §10, not made** — `design/` is owner tier.
2. **`design/03` uses "academy" and "cohort"; this RFC introduces the noun "classroom".**
   Justified because the objects are genuinely different (`broadcast-and-teacher-surfaces.md`
   §4.4: session versus standing relationship) and reusing "academy" would hide that. The
   word "teacher" still appears in no design document; this RFC's title uses it because
   the owner's ruling does.
3. **`design/05:147` promises five per-context assistance defaults.** This RFC neither
   widens nor narrows that gap (D82); §5 changes one conjunct in the permission rule and
   leaves the preference keys alone. Recorded so the gap is not silently attributed here.

Otherwise: none.

## 9. Acceptance criteria

**Consent separation (the load-bearing ones):**

1. A teacher creates a classroom, invites a learner, the learner accepts, the learner
   plays a run. `GET /runs` for the teacher does **not** contain that run;
   `GET /runs/:runId` returns `RUN_NOT_FOUND`; `runRole(run, teacher)` is `undefined`.
   Enrolment alone yields nothing, in every one of these three ways.
2. A static test asserts that **no `run_grants` insert is reachable from a
   `classroom_members` read** other than through the submission path: the classroom
   service exposes exactly one grant-minting function and it is called only from
   `submitAssignment`.
3. Every `/progress*` route continues to take only `authenticate()`; a test asserts no
   route or service method in this RFC accepts a subject learner id.

**Submission and review:**

4. After submission, the teacher's `GET /runs` contains the run with `viewerRole:
   "spectator"`; `GET /runs/:id/grants` shows the teacher's handle to the **learner**;
   `GET /runs/:id/evidence` returns the same page for teacher and learner on a terminal
   run (byte-identical projection).
5. Submitting a run of the wrong pack, a run the caller does not host, or to an
   assignment in a classroom the caller has left, each returns `INVALID_REQUEST` or the
   uniform not-found.

**Revocation and expiry:**

6. Each of the four §4.1 triggers deletes exactly the grants named in
   `granted_learner_ids` and no others — including the case where the teacher already
   held an independent grant, which must survive.
7. A grant with `expires_at` in the past is invisible at **all eight** enumerated read
   sites; the test enumerates them by symbol and fails if a ninth reader of `run_grants`
   is introduced without a case.
8. An expired host grant does not leave a run hostless through `deleteLearner`, and does
   not keep a run in `host_directed` board control.
9. Learner-side direct revoke (`POST /runs/:id/grants {op:"revoke"}`) removes access
   while the submission row survives, and the teacher's classroom view renders the stated
   reason rather than a broken link.

**D80:**

10. In a native match with the host seated White and a friend-linked guest Black, at a
    mutually-accepted pause, `GET …/human-split` and `GET …/corpus` return
    `ASSISTANCE_WITHHELD` for **both** players. A non-seated host in the same session,
    with the same run state, is still permitted.
11. `permittedAssistance` returns identical tables for participant and spectator contexts
    before and after this change — the regression guard that
    `rfc/live-marker-quality.md`'s assertions are untouched.

**Migration:**

12. Migration 21 applies to a database at version 20 and to a fresh one; all existing
    `run_grants` rows read back with `expires_at` null and unchanged behaviour; no run
    snapshot is rewritten and `DRILL_RUN_SCHEMA_VERSION` stays `0.15`.

**Docs:** `docs/` gains a classrooms page stating the enrolment-is-not-observation rule
and the revocation table, and `docs/live-sessions.md`'s §Accepted limitation gains the
seat-symmetry sentence from §5.

## 10. Register claims — stated loudly

| Register | Claim |
|---|---|
| **Migration** | **21** (`STORAGE_VERSION` 20 → 21), owner: this RFC. Creates `classrooms`, `classroom_members`, `assignments`, `assignment_submissions`; adds nullable `run_grants.expires_at`; adds nullable `live_sessions.classroom_id` with `ON DELETE SET NULL`. Create-table/index plus two `ADD COLUMN`s — **no table rebuild, no backfill, no snapshot rewrite** |
| **Run schema** | **none.** Stays `0.15` (`packages/schema/src/index.ts`). A classroom is not run state and no new run event is emitted |
| **Pack schema** | **none.** Stays `0.22`. An assignment references a registered `packId`; no pack document changes, so no digest moves and there is no rebase pressure against the pack lane |
| **Token surface** | **none.** `public_tokens` keeps its two shipped scopes; enrolment is handle-bound, per the `adoption-wave-1` ownership pin |
| **Cross-draft ownership** | `rfc/live-marker-quality.md` owns the `permittedAssistance` table; this RFC changes one conjunct in the **narrowing** direction only and lands **behind** it |
| **Ledger rows this RFC ships** (owner tier; reported, not edited) | **D80** — closed by §5. **Events layer** row — its cohort and pack-night halves ship here; the row should be split so team relays and matchmaking survive it. **D81** and **D82** — explicitly **not** claimed (§6). **D62** — depended on, owned by `client-surface-floor` |
| **`rfc/README.md`** | **not edited by this draft**, per the drafting instruction. Its Active table, migration register and cross-draft pins need the rows above added by whoever accepts this RFC |

## Open questions

1. **May a reviewing teacher request Maia and corpus evidence on a submitted, disclosed
   run?** Today: no, and yet `RunService.evidence` hands them staged Stockfish on the
   same run with no role check — an incoherence, not a policy. Proposal, deliberately not
   taken here: add a `reviewing` input to `permittedAssistance`, true when the run is
   terminal-and-disclosed **and** the viewer holds a submission-minted grant, permitting
   `humanSplit`/`corpus`. This is a **widening** and must be negotiated with
   `rfc/live-marker-quality.md`, whose acceptance tests assert spectator refusal.
   **Resolve before `accepted`** — it decides whether the review surface is worth having.
2. **Teacher-initiated observation requests.** This RFC ships only learner-initiated
   sharing, because a request from a teacher is a pressure surface: a student who can
   technically decline may not feel able to. Should a request primitive exist at all, and
   if so what makes declining costless? Deferred to a follow-up RFC unless the owner
   rules otherwise.
3. **Assigning something other than a pack.** A position, a shape entry, a specific
   branch of the teacher's own run, or a repertoire gap are all plausible units and all
   are refused in v1. Which one arrives first should follow a real coaching session, not
   this draft.
4. **Should a submission carry a learner's message?** A one-line *"I could not hold the
   endgame after move 30"* is the most useful thing a teacher could receive and costs one
   column. Left out to keep the consent surface minimal; genuinely uncertain.
5. **Does an expiring grant need to warn?** A teacher losing access at day 90 mid-review
   is a bad experience; a notification surface does not exist. Currently silent, which is
   defensible only because the learner can re-submit.
6. **What happens to submissions when a pack version moves?** `registered_packs` is keyed
   `(pack_id, version)` and an assignment stores only `pack_id`, so a learner may submit a
   run of a later version than the teacher assigned. Acceptable — the run records its own
   `packDigest` — but the teacher view should probably say so.
7. **Is 90 days the right cap?** It was chosen to match `mintLink`'s shipped bound rather
   than from any evidence about how long a coach needs a submitted game.

## Changelog

- 2026-08-15: created. Drafted on `design/research/broadcast-and-teacher-surfaces.md`
  and the owner ruling of the same day overriding its defer verdict.
