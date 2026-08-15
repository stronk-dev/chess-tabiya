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
| Simul supervision | `GET /sessions` → `LiveSessionService.list` → `RunStorage.listLiveSessions`, whose SQL joins `run_grants g ON g.run_id = s.run_id AND g.learner_id = ?`, projecting `LiveBoardSummary` per active session | N student boards on one page. **The grant join is the entire authorization** — this path never calls `requireRead`, which is why §4.3 lists it as a read site |
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
3. **"Evidence the learner declined" is not a persisted thing — but its inverse is, and
   that is the fact the disclosure section actually has to answer.** The *preference* is
   client-local: `assistanceKey(kind)` writes `tabiya.assistance.v1.<kind>` into browser
   storage (`apps/web/src/lib/assistance-preference.ts`), it is read and written only
   through `loadAssistance`/`saveAssistance`, and no request carries it — verified against
   the shipped file. So there is no server-side record of a *declined* rail, and the
   question as posed has no referent.

   **What the run log does record is what the learner opened.** `evidence.attached`,
   `feedback.revealed` and `group.created` with `source: "human_replies"` are ordinary
   `DrillRunEvent` members (`packages/runtime/src/types.ts`), persisted in the run, and
   `GET /runs/:id/events` serves them to **every** reader of the run. A granted teacher can
   therefore see that this learner asked for Maia at move 12 and staged Stockfish at move
   20. This is not a widening introduced here and it is not per-viewer — the learner sees
   the identical log — but it is the honest answer to *"what does the teacher learn about
   how I played, beyond the moves?"*, and stating it is cheaper than having a learner
   discover it. **The correction stands; the premise was inverted, not merely false.**
4. **The one thing a teacher is refused today is a defect, not a policy.** `RunService.evidence`
   gates on `requireRead` plus `feedbackDeliveryOpen` with **no role check**, so a granted
   teacher does receive staged engine evidence; but `/human-split`, `/corpus` and — since
   D68 closed on 2026-08-15 — `POST …/voice` and `POST …/speech` all resolve
   `permittedAssistance({sessionKind, deliveryOpen, role})` and refuse every role except
   `solo`/`host` (`packages/runtime/src/assistance.ts`; `requireGuidanceDisclosure` in
   `rest.ts`). So on the same disclosed run a teacher receives Stockfish numbers and is
   refused Maia, the opening explorer, **and any narration of the numbers they were
   given** — which is the incoherence at its sharpest: the rung-3 refusal now also
   suppresses the rung-1 sentence. This RFC **does not fix that half** — the permission
   table is owned in flight by `rfc/live-marker-quality.md`, whose acceptance tests assert
   spectator refusal on all four routes — and it is carried as Open question 1 with a
   concrete proposal rather than taken unilaterally.

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
| **Scheduled pack nights** | **subsumed, minimally** — `live_sessions.scheduled_for` persists and is settable today but **renders nowhere and changes nothing**; §3.5 gives it a surface by letting a classroom own a scheduled session |
| **Team relays** | **not subsumed** — a relay changes who plays which ply, which is a play-format change, not a roster feature. The ledger row keeps it |
| **Native matchmaking** | **not subsumed** — outside minimal-real scope by the `design/03` B5 ruling |

Ledgering the roster and the calendar apart guarantees each waits for the other, which is
the research's §7.3 finding; ledgering relays *with* them would have hidden a play-format
change inside a permissions RFC. The proposed ledger edit is reported in §10, not made.

### 3.2 Classrooms and enrolment

```sql
CREATE TABLE classrooms (
  id TEXT PRIMARY KEY,
  owner_learner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  archived_at TEXT
) STRICT;
CREATE INDEX classrooms_owner ON classrooms(owner_learner_id);

CREATE TABLE classroom_members (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  learner_id   TEXT NOT NULL,
  member_role  TEXT NOT NULL CHECK (member_role IN ('teacher','learner')),
  state        TEXT NOT NULL CHECK (state IN ('invited','active','left')),
  invited_by   TEXT,
  invited_at   TEXT NOT NULL,
  joined_at    TEXT,
  left_at      TEXT,
  PRIMARY KEY (classroom_id, learner_id)
) STRICT;
CREATE INDEX classroom_members_learner ON classroom_members(learner_id, state);
```

**No column in this RFC declares a foreign key against `learners(id)`** — revised by
cross-review 2026-08-15; the first draft cascaded from `learners` in five places and §4.1a
shows why that strands grants. Learner-id columns follow the
`registered_packs.publisher_learner_id` precedent: a bare `TEXT` column with account
deletion handled explicitly inside `deleteLearner`'s transaction. Foreign keys **between**
this RFC's own tables stay, and `classroom_members.classroom_id`'s cascade is correct:
those rows have no meaning without the classroom and mint nothing.

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
  assigned_by   TEXT NOT NULL,
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
  learner_id          TEXT NOT NULL,
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
- `scheduled_for` **already has a producer and a projection, and the first draft of this
  section was wrong to say it had neither** (corrected by cross-review 2026-08-15): `POST
  /sessions` accepts `scheduledFor` in its closed body record and passes it through
  `LiveSessionService.create` into the insert; `#liveSessionRow` projects it onto every
  `LiveSession`; `listLiveSessions` already **sorts** on `COALESCE(scheduled_for,
  created_at)`; and `apps/web/src/lib/api.ts` carries it in the client session type. What
  it has never had is a **renderer or any behaviour**: no Svelte component reads it,
  nothing is gated on it, and a session scheduled for next Tuesday is indistinguishable
  from one opened now except in sort order. That is the real gap, and it is smaller than
  claimed — which matters, because the events atom being subsumed here is **a rendering,
  not a mechanism**. `GET /classrooms/:id` returns the classroom's sessions ordered by
  `scheduled_for`, and the classroom view renders upcoming ones.
- **A classroom session confers no membership and no grant.** Joining it uses the shipped
  paths — a handle invitation or a `session_join` link — unchanged. A pack night is an
  ordinary `academy` session that a classroom happens to own.
- `ON DELETE SET NULL`: deleting a classroom must never delete a session or its run.

## 4. Revocation and expiry — because a roster is standing

A per-run grant needed no expiry story. A standing relationship that can mint grants
does, or "standing" quietly becomes "ambient", which is the thing §2 exists to prevent.

### 4.1 Five revocation paths, all of which must reach the grant

| Trigger | Effect |
|---|---|
| Learner withdraws a submission (`{op:"withdraw", runId}`) | delete exactly the `run_grants` rows named in `granted_learner_ids`; set `withdrawn_at` |
| Learner leaves / is removed from the classroom | in one transaction: set `state='left'`, then revoke every grant minted by that learner's submissions in that classroom |
| A teacher leaves / is removed | in one transaction: set `state='left'`, then revoke that teacher's minted grants across every submission in that classroom |
| Classroom archived or deleted | revoke every grant minted by any submission in it |
| **Any party deletes their account** (`RunStorage.deleteLearner`) | §4.1a |

Plus the shipped path, which needs no new code and must keep working: the learner is the
host of their own run, so `POST /runs/:id/grants {op:"revoke", handle}` removes a
teacher at any time.

#### 4.1a Account deletion — the fifth trigger, added by cross-review 2026-08-15

The four triggers above are all *application-level* actions, and the first draft's schema
provided a path that **bypassed every one of them**. It declared
`classrooms.owner_learner_id`, `classroom_members.learner_id`, `assignments.assigned_by`
and `assignment_submissions.learner_id` as `REFERENCES learners(id) ON DELETE CASCADE`,
while `deleteLearner` ends with `DELETE FROM learners WHERE id = ?`. Deleting a classroom
owner's account would have cascaded `classrooms → assignments → assignment_submissions`,
**destroying the `granted_learner_ids` records while the grants themselves survive** —
`run_grants` has no foreign key to `assignment_submissions` and never can, since the grant
must outlive the record of the act by design (§4.1's divergence rule). The result is
co-teacher spectator grants on a learner's run that **no path can ever revoke**, because
every §4.1 trigger reads the row that was just cascaded away. The learner's own
`POST /runs/:id/grants {op:"revoke"}` still works, but it is now the *only* thing that
does, and the learner has no reason to know they need to use it. The symmetric case is the
same defect from the other side: a learner deleting their account cascades their submission
rows while `deleteLearner` reassigns their runs to `LEGACY_ID` rather than deleting them,
so the teachers' grants survive on a run nobody owns.

Two corrections follow, the first already applied to §3.2–§3.4:

1. **Follow the shipped account-deletion precedent instead of cascading.** The repo does
   not cascade user-owned aggregates: `registered_packs.publisher_learner_id` carries **no
   foreign key at all** and is reassigned to `LEGACY_ID`; `pack_drafts`, `shape_drafts`,
   `registered_shapes` and `live_sessions.created_by` are likewise reassigned; repertoires
   are deleted row-by-row through `#deleteRepertoireRows`. `ON DELETE CASCADE` from
   `learners` is the exception in this codebase, not the idiom, and §3's tables had adopted
   it by reflex. **Applied:** no column in §3.2–§3.4 carries a foreign key against
   `learners(id)`.
2. **`deleteLearner` gains a classroom clause, inside its existing `BEGIN IMMEDIATE`**, and
   it runs **before** `DELETE FROM learners`: revoke every grant minted by any submission
   the departing learner made, and every grant minted *to* the departing learner, then
   archive any classroom they solely own after revoking its outstanding minted grants. Only
   then may the rows be removed. `deleteLearner` is therefore a **mutation site of this
   RFC's tables**, not merely read site 8 of §4.3, and §9 tests it as both.

**Divergence between the two records is expected and must be rendered, not hidden.** If
the learner revokes directly, the submission row survives with its grant gone. The
teacher's classroom view then shows *"submitted 2026-08-16 — access revoked by the
learner"*, computed by re-checking `runRole(run_id, teacher)`. It must never show a
working link that 404s, which is the `design/05:41` *absence is stated, never simulated*
invariant applied to a permissions surface. The `run_grants` row remains the **single**
source of truth for access; `assignment_submissions` is the record of the act.

**Revocation ends access; it does not undo what access permitted, and the boundary is
worth stating precisely.** Two of the three shipped ways to make a durable object out of
somebody else's run are already closed to a teacher: `RunService.share` and
`RunService.distillationAccess` both check `mayManageGrants(role)` and refuse every role
but `host`, so a granted teacher can neither mint a `story_read` public token on a
student's run nor distil it into a pack draft of their own. The third is open:
**`RunService.flip` is `requireRead`-only.** Any grant-holder may fork a position out of
the run into a *new run they own*, with a `run_derivations` row recording
`sourceRunId`/`sourceNodeId`, and that object survives revocation, expiry and classroom
deletion. This RFC does **not** propose narrowing `flip` — the derived run carries a FEN
and no part of the learner's event log, and a reader who can see a position can always
retype it — but the learner-facing copy in §7.2 must not imply that revoking restores the
pre-submission state, and Open question 8 asks whether `flip` on another learner's run
should be host-only anyway.

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
7. the session-join upserts in `redeemSessionJoinToken` and in `createLiveSession`'s
   match-player path, which promote `spectator` to `participant`;
8. the `onlyHostRuns` query in `deleteLearner`, which restores a legacy host so no run
   becomes hostless;
9. **`RunStorage.listLiveSessions` — the `GET /sessions` join.** Found by cross-review
   2026-08-15; the first draft of this section enumerated eight and this was the ninth.
   `SELECT s.* FROM live_sessions s JOIN run_grants g ON g.run_id = s.run_id AND
   g.learner_id = ? ORDER BY COALESCE(s.scheduled_for, s.created_at), s.id`, consumed by
   `LiveSessionService.list`.

Sites 4, 5, 7 and 8 are **structural** rather than disclosure-facing: an expired grant
must not be counted as a host, must not keep a run in `host_directed`, and must not be
silently upgraded by a later session join. Site 8 in particular must treat an expired
host grant as absent, or account deletion could leave a run with no live host. Where a
site cannot distinguish, it fails closed.

**Site 9 is the dangerous one and is disclosure-facing, not structural.** Unlike
`GET /runs/:id`, `LiveSessionService.list` performs **no `requireRead`** — the SQL join is
the whole authorization — and it projects `LiveBoardSummary`: the live FEN, side to move,
ply count, lease-holder handle, last-move timestamp, pause state and match-player handles.
An expired grant left unfiltered here keeps a student's live board on the teacher's simul
wall after access has lapsed, and it does so on the exact primitive §1 credits as *"N
student boards on one page"*. It is also the one site where the run-level chokepoint does
not save an implementer who forgets: `runRole` is not on this path at all.

**The enumeration is of *readers*; the *writers* of `expires_at` must be decided too**, and
five of them exist. Each `run_grants` insert or upsert must state what it does with the
column, because the default — leaving it alone — is wrong in at least two of them:

| Write site | Required behaviour |
|---|---|
| the submission mint (§3.4) | sets `expires_at` from `expiresInDays` |
| `#mutateGrant`'s upsert (`ON CONFLICT … DO UPDATE SET role, granted_at`) | **must also clear `expires_at`**. A host re-granting a teacher by hand is an unbounded act; inheriting a stale classroom expiry would silently expire a grant the learner deliberately made |
| `redeemSessionJoinToken`'s `spectator` → `participant` promotion | **must preserve `expires_at`**, never clear it. Clearing it would convert an expiring classroom grant into a permanent participant grant through a path the learner did not intend — the leak this section exists to prevent, arriving through the promotion rather than the mint |
| `createLiveSession`'s match-player upgrade | same rule as the promotion above |
| `deleteLearner`'s legacy-host restore (`INSERT OR IGNORE … 'host'`) | writes NULL — a legacy host never expires |

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
| **`requireGuidanceDisclosure` (`rest.ts`), which gates `POST …/voice` and `POST …/speech`** | same. **Added by cross-review 2026-08-15** — the first draft of this table missed it. This is the site `live-marker-quality` landed as the D68 fix (`design/BACKLOG.md` D68, closed 2026-08-15), so it did not exist when the source dossier was written and it is exactly the site this RFC claims to land behind. It must resolve the real seating, not a hardcoded `false`: a `false` here would leave `/voice` and `/speech` narrating the human-split content that `/human-split` refuses on the same run — reinstating D68 for the seated host |
| the machine-seeded group path (`RunService`, the `permittedAssistance` call guarding `GROUP_SEEDS`) | same |
| `assistanceContext` (`apps/web/src/lib/DrillScreen.svelte`) | the session detail's `match` state versus the signed-in learner — the client already computes this for `learnerOwnsActiveMatchTurn` in `App.svelte` |
| `liveMarkers` (`packages/runtime/src/pivotal.ts`, which calls `permittedAssistance` itself) | passed through its context |
| `packages/runtime/src/adaptive-guidance.test.ts` and `apps/web/src/lib/client-surface-floor.test.ts` | explicit in each case |

`pivotal.ts` is also the file `rfc/live-marker-quality.md` is rewriting, which is the
second reason for the landing order below.

**Direction check, done as arithmetic rather than assertion.** The rule changes from `X` to
`X ∧ ¬seatedInContest`, which is monotone decreasing: no input that returned `locked_off`
can return `free` afterwards. Participant and spectator contexts had `mayRequestSplit ===
false` already, and a conjunction cannot raise a false. `markers` is unconditionally
`"free"` in the shipped table and this change does not touch it. So
`rfc/live-marker-quality.md`'s **refusal** assertions — markers absent and
`ASSISTANCE_WITHHELD` returned for participant and spectator contexts on `/human-split`,
`/corpus`, `/voice` and `/speech` — continue to hold unchanged, and its standing rule that
*the ceiling is `permittedAssistance`'s table* survives with the table merely lowered in
one cell. This is a narrowing, and it is one all the way down.

**Two consequences the first draft did not state, both in-direction but neither free:**

- `boardLighting` and `arrows` are driven by the same `mayRequestSplit` conjunct, so a
  host-seated player also drops from `evidence` to `sight` on both. That is the correct
  outcome under the same argument — a seated competitor should not get evidence lighting
  their opponent cannot — but it is a wider behaviour change than *"Maia and corpus"*, and
  §9's criterion 10 is extended to pin it.
- **`live-marker-quality`'s acceptance criterion 6 has a second half this RFC can break.**
  Its full text is *"…`ASSISTANCE_WITHHELD` for participant, spectator, and pre-disclosure
  solo contexts, **then open for solo/host after disclosure**"*. The narrowing keeps
  `/voice` and `/speech` closed for a **host who is match-seated** even after disclosure.
  The two RFCs are compatible only because that criterion's host is a non-seated host; the
  implementer must confirm the fixture does not seat it, and if it does, the fixture — not
  this rule — is what moves. Named here so the collision is negotiated rather than
  discovered by a red test.

**Landing order: behind `live-marker-quality`.**

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

**The refusal stress-tested (cross-review 2026-08-15): does refusing `kind` cost more than
it saves when per-context assistance policy eventually needs a field?** It does not, and
the reason is a symbol-level fact the original three bullets gestured at but did not
close. D82's gap is between `design/05`'s five contexts and **`RunSessionKind = pack |
position | imported`** (`packages/runtime/src/types.ts`) — the type that keys
`assistanceKey(kind)`'s three `localStorage` entries and `AssistanceContext.sessionKind`.
`SESSION_KINDS = stream | academy | match` lives in a different package
(`apps/server/src/live-types.ts`), on a different aggregate, and is **not** what any
preference or permission is keyed on. So a fourth `SESSION_KINDS` member would not have
paid for D82 even in the future where D82 is paid for: the widening D82 needs is on
`RunSessionKind`, and it is available whether or not `session.kind` is behavioural. The
refusal forgoes nothing it could have bought. What it costs is one join — a policy that
wants to know *"is this a classroom context?"* reads `live_sessions.classroom_id` rather
than a label — and a relation that can answer *which* classroom is strictly more than a
label that cannot.

**D81 therefore stays open and unclaimed by this RFC.** Making `kind` behavioural is a
live-session concern; D82 is an `AssistanceContext` concern; the two are separable and the
original framing that made `kind` "most plausibly the vehicle" for D82 is withdrawn. Both
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
   plays a run and opens a live session on it. `GET /runs` for the teacher does **not**
   contain that run; `GET /runs/:runId` returns `RUN_NOT_FOUND`; **`GET /sessions` for the
   teacher does not contain that session**; `runRole(run, teacher)` is `undefined`.
   Enrolment alone yields nothing, in every one of these four ways. The session leg is
   named separately because `GET /sessions` reaches `run_grants` without passing
   `runRole` (§4.3 site 9), so criterion 1 is not implied by the other three.
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
   uniform not-found (the named code is fixed in §10's refusal-code row, not left to the
   implementer).

**Revocation and expiry:**

6. Each of the five §4.1 triggers deletes exactly the grants named in
   `granted_learner_ids` and no others — including the case where the teacher already
   held an independent grant, which must survive.
7. A grant with `expires_at` in the past is invisible at **all nine** enumerated read
   sites — `GET /sessions` explicitly among them — and the test enumerates them by symbol
   and fails if a **tenth** reader of `run_grants` is introduced without a case. A second
   test pins the five §4.3 **write** sites: a host's manual re-grant clears `expires_at`,
   and a session-join promotion of an expiring spectator grant preserves it.
8. An expired host grant does not leave a run hostless through `deleteLearner`, and does
   not keep a run in `host_directed` board control.
9. Learner-side direct revoke (`POST /runs/:id/grants {op:"revoke"}`) removes access
   while the submission row survives, and the teacher's classroom view renders the stated
   reason rather than a broken link.
9a. **Account deletion strands nothing (§4.1a).** A classroom with two teachers and one
    submitted run: deleting the *owning* teacher's account leaves the co-teacher with no
    grant on the learner's run, and leaves no `run_grants` row whose minting record has
    been cascaded away. The symmetric case — the submitting learner deletes their account
    — likewise leaves no teacher grant on the reassigned `LEGACY_ID` run. A schema test
    asserts no table in this RFC declares `ON DELETE CASCADE` against `learners(id)`.

**D80:**

10. In a native match with the host seated White and a friend-linked guest Black, at a
    mutually-accepted pause, `GET …/human-split`, `GET …/corpus`, `POST …/voice` and
    `POST …/speech` all return `ASSISTANCE_WITHHELD` for **both** players, and
    `permittedAssistance` returns `boardLighting: "sight"` and `arrows: "sight"` for both.
    A non-seated host in the same session, with the same run state, is still permitted on
    all four routes and still gets `evidence` lighting.
11. `permittedAssistance` returns identical tables for participant and spectator contexts
    before and after this change — the regression guard that
    `rfc/live-marker-quality.md`'s refusal assertions are untouched. Separately, a test
    asserts `live-marker-quality`'s *"then open for solo/host after disclosure"* fixture
    uses a **non-seated** host, so the two RFCs' criteria are compatible by construction
    rather than by luck (§5.1).

**Migration:**

12. Migration 21 applies to a database at version 20 and to a fresh one; all existing
    `run_grants` rows read back with `expires_at` null and unchanged behaviour; no run
    snapshot is rewritten and `DRILL_RUN_SCHEMA_VERSION` stays `0.15`. It runs inside the
    migration loop's ordinary `BEGIN IMMEDIATE` arm with **neither** `PRAGMA foreign_keys
    = OFF` nor `legacy_alter_table = ON` — that arm is `migration.version === 14` only, and
    21 must not extend it. Both `ADD COLUMN`s carry a NULL default, which is what SQLite
    requires of an added `REFERENCES` column while foreign keys are on.

**Docs:** `docs/` gains a classrooms page stating the enrolment-is-not-observation rule
and the revocation table, and `docs/live-sessions.md`'s §Accepted limitation gains the
seat-symmetry sentence from §5.

## 10. Register claims — stated loudly

| Register | Claim |
|---|---|
| **Migration** | **21** (`STORAGE_VERSION` 20 → 21), owner: this RFC. Verified free by cross-review: `STORAGE_VERSION` is `20` and migration 20 (`archive/engine-request-contract.md`) is `implemented`. Creates `classrooms`, `classroom_members`, `assignments`, `assignment_submissions`; adds nullable `run_grants.expires_at`; adds nullable `live_sessions.classroom_id` with `ON DELETE SET NULL`. Create-table/index plus two `ADD COLUMN`s — **no table rebuild, no backfill, no snapshot rewrite**, verified against the two closest precedents: migration 15 (`repertoire-gap-finding`, create-table/index only) rather than migration 14 (`social-match`, the only rebuild). The one shipped read that filters on a version is `RunStorage.list`'s `WHERE r.schema_version = ?` against `DRILL_RUN_SCHEMA_VERSION`, which is why migration 11 needed a stamp; 21 moves no run schema, so existing rows stay `0.15` and stay listed, and **no stamp is required** |
| **Run schema** | **none.** Stays `0.15` (`packages/schema/src/index.ts`). A classroom is not run state and no new run event is emitted |
| **Pack schema** | **none.** Stays `0.22` (`archive/transition-primitives.md`, implemented; **0.19 is frozen shut**, not free — so no draft may reach for it). An assignment references a registered `packId`; no pack document changes, so no digest moves and there is no rebase pressure against the pack lane |
| **Token surface** | **none.** `public_tokens` keeps its two shipped scopes; enrolment is handle-bound, per the `adoption-wave-1` ownership pin |
| **Refusal codes** | **none** — added by cross-review 2026-08-15, because the first draft made no claim here and §7.1 named a *"uniform not-found"* with no code behind it. There is no `NOT_FOUND` member of `ServerErrorCode` (`errors.ts`); the literal in `rest.ts` is the unrouted-path response, and `RUN_NOT_FOUND` is run-specific. **Ruling: every classroom and assignment non-disclosure refuses `INVALID_REQUEST`**, identical in body for "does not exist", "you are not a member" and "you have left". Reusing `RUN_NOT_FOUND` for a classroom would lie about the subject; minting `CLASSROOM_NOT_FOUND` would both add a versioned member and *be* the disclosure it is meant to prevent, since only a member could ever see it |
| **Cross-draft ownership** | `rfc/live-marker-quality.md` owns the `permittedAssistance` table **and its four enforcement sites** — `/human-split`, `/corpus`, and (as of the D68 fix) `requireGuidanceDisclosure`'s `/voice` and `/speech`. This RFC changes one conjunct in the **narrowing** direction only, touches all four sites because the new field is required, and lands **behind** it |
| **Ledger rows this RFC ships** (owner tier; reported, not edited) | **D80** — closed by §5. **Events layer: pack nights, cohorts, team relays** (row title verbatim) — its cohort and pack-night halves ship here; the row should be **split, not closed**, so team relays and native matchmaking survive it with their own row. **D81** and **D82** — explicitly **not** claimed (§6). **D62** — depended on, owned by `client-surface-floor` |
| **`rfc/README.md`** | **not edited by this draft**, per the drafting instruction — but its **Active table row already exists** (added when this draft was registered), so only two things are missing and cross-review names them precisely: a **migration-register row for 21** (the register currently ends at 20, `archive/engine-request-contract.md`), and a **cross-draft ownership pin** for the `permittedAssistance` table and its four enforcement sites. Whoever accepts this RFC adds those two, in the accepting commit |

## Open questions

1. **May a reviewing teacher request Maia and corpus evidence on a submitted, disclosed
   run?** Today: no — and since the D68 fix, no narration of it either — and yet
   `RunService.evidence` hands them staged Stockfish on the same run with no role check.
   That is an incoherence, not a policy, and cross-review confirms it against the shipped
   files: `evidence` is `requireRead` + `feedbackDeliveryOpen`, while all four assistance
   routes resolve `permittedAssistance` and refuse every role but `solo`/`host`. Proposal,
   deliberately not taken here: add a `reviewing` input to `permittedAssistance`, true when
   the run is terminal-and-disclosed **and** the viewer holds a submission-minted grant,
   permitting `humanSplit`/`corpus`.

   **Cross-review's judgement, 2026-08-15: it cannot be taken here, and the question is
   mis-posed as one this RFC could resolve.** The `reviewing` input widens
   `permittedAssistance` for the **spectator** role — precisely the role
   `rfc/live-marker-quality.md`'s acceptance criterion 6 pins refused, on the four routes
   it is *in the middle of gating*, two of which (`/voice`, `/speech`) it gated only hours
   before this draft. §5's narrowing lands cleanly because a conjunction cannot raise a
   false; a `reviewing` disjunct raises exactly the falses that RFC asserts. Taking it here
   would not be a rebase risk — it would make the two documents assert opposite things
   about the same test.

   **The re-posed question, which is the one to resolve before `accepted`:** *does the
   review surface work at all without Maia and corpus?* If yes, this RFC ships as drafted
   and the widening becomes a follow-up owned by whoever next holds the assistance table,
   with `live-marker-quality` implemented rather than in flight. If no, this RFC is
   **blocked on `live-marker-quality` reaching `implemented`** and should say so in
   `Depends on:` rather than carrying a widening it cannot land. Cross-review's read is
   that the answer is *yes* — a teacher reviewing a finished attempt has the moves, the
   authored feedback, the run's own evidence rail and Stockfish, and what they most lack is
   the learner's sentence (Open question 4), not a second engine — but this is a product
   call and it is the owner's.
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
   than from any evidence about how long a coach needs a submitted game. (`mintLink`'s
   bounds are verified as claimed: default 14 days, range 1–90, one use, 50 active links.)
8. **Should `RunService.flip` be host-only on another learner's run?** Raised by
   cross-review 2026-08-15 (§4.1). `share` and `distill` both check `mayManageGrants` and
   refuse a granted teacher; `flip` checks only `requireRead`, so a teacher can fork a
   position out of a student's run into a run of their own that survives revocation, with
   a `run_derivations` row still naming the source. The residue is small — a FEN, not the
   learner's log — and narrowing `flip` would change a shipped route this RFC otherwise
   does not touch, which is why it is a question and not a specification. It is named
   because §4.1 would otherwise imply that revocation restores the pre-submission state,
   and it does not.

## Changelog

- 2026-08-15: created. Drafted on `design/research/broadcast-and-teacher-surfaces.md`
  and the owner ruling of the same day overriding its defer verdict.
- 2026-08-15: adversarial cross-review, by an agent that did not write the draft, against
  the shipped tree. **The consent model survives the attack** — no path derives a grant
  from a membership row, and `share` and `distill` are host-only. Nine changes landed:
  (1) **a ninth reader of `run_grants` — `RunStorage.listLiveSessions`, the `GET /sessions`
  join**, which performs no `requireRead` and projects `LiveBoardSummary`, so an expired
  grant would have kept a student's live board on the simul wall (§4.3, §9.1, §9.7);
  (2) §4.3 gained the five **write** sites of `expires_at`, two of which were about to
  default wrongly; (3) §5.1's consumer table gained `requireGuidanceDisclosure`
  (`/voice`, `/speech`) — the D68 fix, landed the same day, and the site this RFC most
  needed to enumerate; (4) §5's direction check restated as arithmetic, with the
  `boardLighting`/`arrows` consequence and the `live-marker-quality` criterion-6 fixture
  collision named; (5) §2.3's false-premise correction kept but **inverted** — the log
  records what the learner *opened* (`evidence.attached`, `feedback.revealed`,
  `group.created`), served to every reader by `GET /runs/:id/events`; (6) **§4.1a**, a
  fifth revocation trigger, after `ON DELETE CASCADE` from `learners` was found to strand
  co-teacher grants permanently — the DDL in §3.2–§3.4 is corrected; (7) §3.5's
  `scheduled_for` claim corrected — it has a producer and a projection, and lacks only a
  renderer; (8) a refusal-code register row, and a corrected `rfc/README.md` row; (9) Open
  question 1 re-posed — the `reviewing` widening **cannot be taken here** — and Open
  question 8 added for `flip`'s `requireRead`-only residue. Verified sound and unchanged:
  migration 21 free and backfill-free, run `0.15`, pack `0.22` with `0.19` frozen shut,
  `mintLink`'s bounds, the two `public_tokens` scopes, `RUN_ROLES`, all six `/progress*`
  routes, the ledger row titles, and template compliance.
