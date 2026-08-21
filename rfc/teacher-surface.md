# RFC: Teacher surface — the roster is not a grant

- **Status:** **accepted 2026-08-16.** Both owner questions are discharged and the cross-review
  corrections are landed. **No item awaits an owner.** (Corrected 2026-08-16: this block read
  *"draft … ready to be marked accepted"* while the register read `accepted`, and the
  implementer correctly refused to build against the contradiction. That is claude's standing
  error — **a resolution in a register is not a resolution in the body** — and this is its
  fifth instance.) The 2026-08-16 ruling dissolved
  Open question 1 (*"add them and ship no deferral"*), and the one narrowing that ruling
  implied was **confirmed by the owner on 2026-08-16**: `live-marker-quality`'s recorded cost
  changes from *"the marker leaves participants and spectators entirely, on every run,
  **permanently**"* to **for the duration of live play**. The 2026-08-15 record is left intact
  and the amendment is stated beside it, not written over it. **Live play is unchanged** — a
  spectator watching a game in progress still gets nothing; the exception is a reviewing
  teacher on a **finished, disclosed** run with **no live session open**, where the gate's own
  contamination rationale is structurally absent. **The third-value permission stays refused**:
  the reviewer reaches the marker on the run host's own arm, not through a weaker permission.
  It was put to the owner rather than taken by an author because §6.2 is the recorded terms of
  an owner ruling, and citing-a-ruling-that-says-the-opposite failed twice in this repo on
  2026-08-16 alone.
  The block recorded in `rfc/README.md` was Open question 1: *does the
  review surface work without Maia and the corpus?* **The owner refused the fork and ruled
  that teacher mode ships complete** — *"why do you not give option: add them and ship no
  deferral… literally covered all options except 'implement properly'"*. The question is
  therefore **dissolved rather than answered**: §5.2 specifies the review rail, so there is
  no longer a version of this RFC that ships without it and no price to compare. §5.2
  replaces the *"deliberately not fixed here"* section the ruling struck out.
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/03-product-breadth.md` §Live and community — the *"Arena and
  events"* row (*"scheduled pack nights, invitations, **cohorts**, two-leg position
  matches, team relays"*) and the **B5** gate row; `design/03` §Learn and return (the
  return loop this RFC writes into); `design/05-in-run-experience.md:41` (*absence is
  stated, never simulated*) and its region 5 (*session/role controls appropriate to
  solo, host, participant, or spectator*); **`design/05` §3a-i, the disclosure model as
  shipped — *"`outcome.reached` discloses under every policy (a finished run has nothing
  left to contaminate)"* and *"the run — not the viewer — carries the barrier"*; these are
  the two sentences §5.2's review rail is built on, and the second is why its new input
  sits in the role conjunct rather than beside the disclosure one**; `design/00-thesis.md`
  §§70, 93-94 (no lesson content — an assignment points at a pack, it does not author
  teaching).
  *Every code site below is cited **by symbol name**; line numbers are advisory. The
  tree moved roughly thirteen times on 2026-08-15 and again on 2026-08-16. Locate
  `RUN_ROLES`, `run_grants`, `permittedAssistance`, `feedbackDeliveryOpen`,
  `feedbackDisclosed`, `mayManageGrants`, `updateGrant`, `LIVE_SESSION_KINDS`,
  `assistanceProfile`, `reviewingGrant`, `liveAdmitted` and `STORAGE_VERSION` by name,
  not by number.*
- **Exploration gate:** owner ruling 2026-08-15 — **scope it now**, explicitly
  overriding the *defer with a named trigger* verdict in
  `design/research/broadcast-and-teacher-surfaces.md` §7.2. That dossier is this RFC's
  entire evidence base and its §4 is the specification's starting point, including the
  finding it corrected: **the streamer and academy surfaces already ship**, as
  `LIVE_SESSION_KINDS = ["stream","academy","match"]` (`packages/runtime/src/types.ts`,
  re-exported as `SESSION_KINDS` by `apps/server/src/live-types.ts` — the D185
  hand-duplication is gone, so there is now exactly one definition), so nothing in this
  RFC is a live-session mode.
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
  - `rfc/archive/live-marker-quality.md` (*implemented*) — treats the `permittedAssistance` table
    as the **ceiling for the live surface** (its L4(b): *"The ceiling is
    `permittedAssistance`'s table, not what the endpoints happen to serve… The permission
    table is the invariant; a route that disagrees with it is a defect in the route"*), and
    its acceptance criterion 6 asserts that participants and spectators are refused on
    `/voice` and `/speech`. **Upgraded to a hard dependency by the author round of
    2026-08-16:** §5.1 narrows that table and §5.2 now *widens* it, so landing behind
    `live-marker-quality` is a correctness requirement rather than a courtesy. Verified by
    reading that RFC in full rather than by grep: it claims **no register at all** (§7,
    *"Nothing versioned. No register is claimed"*), it does **not** claim ownership of
    `permittedAssistance` itself — only of a consumer-side gate in `liveAdmitted` and of the
    D68 fix — and the words *teacher*, *reviewer*, *observer* and *coach* appear **nowhere**
    in its 1056 lines. The review case is therefore not something it decided and left for
    this RFC to respect; it is something it never contemplated. §5.2c shows the widening
    leaves its criterion 6's **fixtures** green, and states plainly that this holds by
    fixture convention rather than by construction. **The *"by construction"* claim of the
    author round is withdrawn by cross-review 2026-08-16:** criterion 6's first half is a
    `liveMarkers` unit test over `AssistanceContext` literals, in which no live session
    exists at any layer, so the third conjunct is not what saves it — the first is. Two of
    criterion 6's sentences and one sentence of its §6.2 owner ruling become false as
    universally quantified claims, and all three edits are owed at landing (§5.2c, §10).
  - `rfc/archive/live-surface-honesty.md` (*implemented 2026-08-15*) — **added by
    cross-review 2026-08-16.** It closed **D81 and D82**, which this draft was written
    the same day believing open: `session.kind` now selects an assistance *preference
    profile*, and `ASSISTANCE_PROFILES` has six exhaustive members. §6 is rewritten
    against it.
  - ~~`rfc/client-surface-floor.md` (*implementing*)~~ — **dependency CLEARED, cross-review
    2026-08-16.** It is `rfc/archive/client-surface-floor.md`, implemented, and **D62 is
    closed**: compact navigation has three real regions and a spelling-independent source
    guard now refuses any `viewerRole`-conditioned rendered control. §2.4's in-run leg
    therefore ships today and is no longer a blocked requirement — see §2.4.
- **Parent / amends:** amends `run_grants` (**two** nullable columns — `expires_at` §4.3 and
  `granted_via` §5.2), `live_sessions` (one nullable column) and `permittedAssistance`'s
  context (**two** required fields — `seatedInContest` §5.1 and `reviewing` §5.2).
  Introduces four new tables and one new client route pair. **No run-schema change. No
  pack-schema change. No new drill mode, no new session kind, no new token scope, no new
  `RunRole`, no new `AssistanceConfig` key and no `AssistanceConfig` version bump** — §5.2
  changes the *permission* function, never the persisted preference blob.
- **Supersedes / superseded by:** —
- **Planning:** `planning/teacher-surface/` (once implementing)

```tabiya-claims
migration | position next | classrooms; classroom_members; assignments; assignment_submissions; run_grants.expires_at; run_grants.granted_via; live_sessions.classroom_id
```

## Summary

A teacher can already watch a student play, hand them the board, reveal to a class, walk
N boards on the simul wall and distil the finished session into a pack — all of it
shipped, all of it verified in `broadcast-and-teacher-surfaces.md` §4.1. What does not
exist is anything **standing**: a named group, a unit of work addressed to it, and a way
for that work to come back. This RFC ships those three things, on one rule that decides
every detail: **enrolment is not observation.** A roster grants the right to *address* a
learner; only the learner's own act grants the right to *see* their run. The two consent
objects stay separate at the schema level, not merely in the UI.

It ships a fourth thing, added by the owner ruling of 2026-08-16: **the returned run is
reviewed on a complete rail, not a truncated one.** Today a granted teacher on a
submitted, disclosed run receives staged Stockfish from `RunService.evidence` and is
refused the Maia human-model split, the opening-explorer corpus, and every narration of
the numbers they *were* given. §5.2 closes that, and closes it by making the reviewer's
permission table **equal to the run host's own** rather than by inventing a reviewer
tier. The two halves of the RFC turn out to be one rule stated twice: the roster grants
nothing, and what the learner's own act grants is exactly what the learner had.

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

- **Any widening of `/progress*`.** All **seven** progress routes take only
  `authenticate()` and resolve to that principal (`rest.ts` `/progress`, `/progress/due`,
  `/progress/related`, `/progress/metrics`, `/progress/milestones`,
  `/progress/recommendations`, `/progress/schedules/:id`; `RunService.progress`, `.due`,
  `.related`, `.progressMetrics`, `.milestones`, `.shapeRecommendations`, each of which
  passes `principal.learnerId` down). **Corrected from six by cross-review 2026-08-16:
  `/progress/recommendations` is a seventh, and it is the most tempting one to widen** —
  it composes `RepertoireService.recommendations` with `RunService.shapeRecommendations`,
  so a teacher-facing variant would be a per-learner weakness feed, which is precisely
  the v1 identity this product rejected (§Motivation, *Tested against the two rejected
  shapes*). It stays principal-only.
  **No route in this RFC takes another learner's id as a subject.** A teacher never sees
  a learner's attempt history, due queue, metrics or milestones. Class analytics is the
  feature this RFC most conspicuously refuses.
- **Team relays and native matchmaking** — a relay is a play-format change, not a roster
  feature; matchmaking is outside minimal-real scope by the `design/03` B5 ruling.
- **Per-viewer withholding.** The 2026-08-12 ruling (`rfc/archive/live-session-platform.md`
  §3.8) stands: `feedbackDisclosed` and `feedbackDeliveryOpen`
  (`packages/runtime/src/feedback.ts`) take no viewer parameter and this RFC adds none.
  **§5.2 does not touch this and the distinction is exact rather than convenient.**
  Disclosure is the run's barrier and stays viewer-blind; *assistance* has taken a viewer
  parameter since it shipped — `permittedAssistance` reads `role` — and §5 changes what
  that parameter does, never who carries the barrier. §5.2b keeps `reviewing` inside the
  role conjunct for precisely this reason, and the direction is worth noting: the ruling
  exists to stop a viewer being shown *less* than the run has disclosed to everyone; §5.2
  moves a viewer *up to* that line and can never move them past it.
- **Grading, scoring, or any teacher-facing verdict.** A submission is received, never
  marked.
- **Making `session.kind` behavioural.** Considered and refused — see §6. (D81 was
  **closed by `live-surface-honesty` on 2026-08-15**; the refusal below is about not
  adding a fourth *kind*, not about the row.)

### Tested against the two rejected shapes, by name

Added by cross-review 2026-08-16. A document with "teacher" in its title must be held
against `AGENTS.md` §Rejected explicitly rather than by implication, because the two
nearest failure shapes are both *adjacent to this one and legitimate elsewhere*.

**"The v1 identity: personal game-analysis AI coach (mine games → detect weaknesses →
generate episodes)."** Each of the three verbs is refused by a shipped constraint, not
by intention:

- *mine games* — no route in §7.1 takes another learner's id as a subject, and the
  seven `/progress*` routes stay principal-only. A teacher's entire read surface is the
  set of `run_grants` rows learners minted at them, one attempt at a time. There is no
  query in this RFC that returns "this learner's games".
- *detect weaknesses* — §Out of scope refuses grading, scoring and any teacher-facing
  verdict; `/progress/recommendations` is not widened. Class analytics is named as the
  feature most conspicuously refused.
- *generate episodes* — a teacher may assign a **registered pack and nothing else**
  (§3.3). The assignment authors no content; it is a pointer plus a human sentence.
  `design/00-thesis.md` §§70, 93-94 forbids lesson content and this RFC creates none.

The v1 product also made import the entry point; this RFC touches `imported_games` not
at all and works with zero imported games.

**"An engine review screen with a rewind button."** The teacher's review of a submitted
run is the *shipped run view under an ordinary grant* — the same projection the learner
gets, byte-identical (§9.4), reached through `GET /runs/:id`, not through any new
teacher-facing evaluation surface. Concretely, the three things that would make it that
screen are each absent: this RFC adds **no evaluation projection** (no route in §7.1
returns an engine number, and §5.2 adds no route at all — it changes one conjunct in a
permission function so that *existing* routes stop discriminating), **no per-learner
dashboard of verdicts** (the classroom view lists submissions and their access status —
received-or-not, never marked), and **no second read path** (§2.2: a submission mints a
real `run_grants` row precisely so there is no parallel visibility rule to grow a
dashboard on). The teacher's affordance is the learner's affordance, granted; a review
screen is what you build when the reviewer gets a surface the player does not have.

**§5.2 makes this test *easier* to pass, not harder, and the reason is worth stating
because the intuition runs the other way.** Giving a reviewing teacher Maia and the
corpus sounds like moving toward the engine-review screen. It is the opposite move.
Before §5.2 the teacher's rail was *different* from the learner's — Stockfish yes, Maia
no, narration no — which is precisely the "reviewer gets a surface the player does not
have" shape, merely pointing downward instead of upward. A rail that differs by viewer is
a review screen in embryo whichever direction it differs in, because it is the difference
that has to be designed, explained and eventually widened. After §5.2 there is no
reviewer rail to design: `permittedAssistance` returns the same table for the reviewing
teacher and the run's host, and §9's criterion 10c asserts that equality field by field.
**The named anti-pattern is a viewer-specific evaluation surface; the fix for it is not
less evidence for the reviewer, it is no viewer-specific surface at all.**

**The honest residual, stated rather than argued away:** the classroom detail view for
teachers is a list over other people's activity, and that is the shape a dashboard grows
from. What keeps it on the right side is that every cell in it is *an act the learner
performed* — submitted, withdrawn, revoked, expired — and none is a judgement the
product formed. Criterion 3 and criterion 4 pin both halves.

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
4. **The one thing a teacher is refused today is a defect, not a policy — and §5.2 fixes
   it.** `RunService.evidence` gates on `requireRead` plus `feedbackDeliveryOpen` with **no
   role check** (verified at the symbol: `requireRead(...).stored.run`, then
   `if (!feedbackDeliveryOpen(run)) return empty`, then
   `this.#requiredEvidenceQueue().page(runId, sinceSeq)` — the page is keyed by run and
   sequence, never by viewer), so a granted teacher does receive staged engine evidence.
   But `/human-split`, `/corpus` and — since D68 closed on 2026-08-15 — `POST …/voice`,
   `POST …/speech` and `POST …/reasoning-review` all resolve
   `permittedAssistance({sessionKind, deliveryOpen, role})` and refuse every role except
   `solo`/`host` (`packages/runtime/src/assistance.ts`; `requireGuidanceDisclosure` in
   `rest.ts`). So on the same disclosed run a teacher receives Stockfish numbers and is
   refused Maia, the opening explorer, **and any narration of the numbers they were
   given** — the incoherence at its sharpest, because the rung-3 refusal also suppresses
   the rung-1 sentence.

   **The first draft carried this as Open question 1 and offered the owner a choice of
   ways to ship without it. The owner refused the fork on 2026-08-16 and ruled that the
   surface ships whole.** §5.2 is that ruling's specification: the reviewing teacher's
   permission table becomes the run host's table, so the answer to *"what may a teacher
   see of a submitted run"* stops having two clauses. It is now one clause — **exactly
   what the learner may see of it, at the same moment** — which is the answer this section
   was reaching for through three drafts and could not reach while the rail was truncated.

### 2.4 The learner must be able to see who is watching

Every classroom-minted grant is an ordinary `run_grants` row and therefore already
appears in `GET /runs/:id/grants` with the teacher's handle. Two client requirements
follow:

- the assignment card in `/learn` (§7.2) names, in words, every teacher who currently
  holds access to each submitted run, and offers revoke;
- **the in-run answer was D62's, and D62 has closed** (cross-review 2026-08-16;
  `rfc/archive/client-surface-floor.md`, implemented). The first draft declared a
  dependency on a phone-side surface that did not exist. It exists now: compact
  navigation has exactly three real regions — Timeline, Branches and Evidence — and a
  spelling-independent source guard refuses any `viewerRole`-conditioned rendered
  control, so the inverted role condition that made the Session tab unreachable cannot
  be reintroduced. **The consequence for this RFC is a requirement, not a dependency:**
  the compact surface no longer has a Session region to put a watcher list in, so the
  learner-facing answer to *"who is watching"* must be carried by a region that survives
  the floor — the `/learn` card above, which is reachable on every viewport — and not by
  a fourth compact tab. The acceptance criterion stands and is unchanged in substance:
  the desktop session/grant list renders classroom-minted grants indistinguishably from
  any other (§9), so nothing about a teacher's presence is special-cased into
  invisibility.

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

  **Grounded in the shipped design rather than asserted — expanded by cross-review
  2026-08-16, because a note is the one place this RFC puts chess prose on a screen and
  §5's ladder governs everything on that screen.** `design/05-in-run-experience.md`
  §3-forms already rules exactly this case, for marks rather than sentences: *"HOST- or
  TEACHER-DRAWN marks relayed to viewers are a **person's** claim, not the product's —
  they need **attribution**, not a rung"*, and the same section's *"The config owns the
  matrix"* confirms that such marks are *"not assistance settings at all… governed by
  attribution and by the live surface's admission rule, not by the ladder"*. A teacher's
  note is that ruling's sentence form, and it inherits the ruling's condition:
  attribution is mandatory and structural, never a styling choice. Three consequences
  are normative here:

  1. **The note never enters the run.** It is not a `DrillRunEvent`, is not written to
     any run snapshot, and is never appended to `packet.sentences` or reachable by
     `evidencePacket` / `renderVoice`. The run stays the sole source of chess truth
     (`design/05` §1) and the voice provider's input is byte-identical to today's.
  2. **The note never renders inside a run.** It lives in the `/learn` assignment card
     and the classroom view, outside the board experience. It is therefore not live
     assistance, does not occupy a rung, and adds **no kind to the live surface** — so
     `rfc/archive/live-marker-quality.md`'s L5 burden (*a new live kind arrives with a dossier*)
     is not engaged by this RFC at all, and L1–L4 have nothing here to bind.
  3. **The note is pre-commitment, and that is deliberate rather than overlooked.** A
     learner reads it before starting the pack, which is the one timing §3a
     (*the default is silence*) and ADR-0006 (*commit before you learn anything*) are
     strictest about. It is admissible because the invariant governs what the **product**
     may tell you before you decide, not what another person may say to you — a coach
     saying *"watch the minority attack"* over the board is the shipped academy session,
     already ruled legitimate. The line that must hold is that the product never speaks
     in the note's voice and never launders a rung through it: no evidence value, engine
     number, corpus figure or generated sentence may be composed into a note by any code
     path, and the note is stored and rendered as the literal bytes the teacher typed.
     §9 criterion 3a tests it.
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
worth stating precisely.** **All three** shipped ways to make a durable object out of
somebody else's run are now closed to a submission-granted teacher — **corrected by
cross-review 2026-08-16, which found the first draft's one open case had been shut
under it.** `RunService.share` and `RunService.distillationAccess` both check
`mayManageGrants(role)` and refuse every role but `host`, so a granted teacher can
neither mint a `story_read` public token on a student's run nor distil it into a pack
draft of their own. The third, `RunService.flip`, was `requireRead`-only when this draft
was written; **D94 closed on 2026-08-16 and it now checks `mayWrite(access.role)`
first**, refusing `FORBIDDEN` before any derived run is created. A submission mints
`spectator` (§3.4 step 5), and `mayWrite` is false for `spectator`, so a teacher holding
only a classroom-minted grant cannot fork a position out of a student's run at all.

**This tightens the surface but does not make revocation an undo, and the copy in §7.2
must still not imply it does.** A teacher whom the learner has *separately* granted
`participant` — an ordinary shipped act, not something this RFC mints — passes `mayWrite`
and may `flip`, producing a run they own with a `run_derivations` row recording
`sourceRunId`/`sourceNodeId` that survives revocation, expiry and classroom deletion.
The residue is small and was never the interesting part: the derived run carries a FEN
and no part of the learner's event log, and a reader who can see a position can always
retype it. What revocation guarantees is that *future* reads stop — never that what was
read is forgotten.

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

**The refusal is named, not left to the implementer** (added by cross-review
2026-08-16 — a column with no named refusal is a declaration, not an executable rule).
Absence is produced at the chokepoint: `RunStorage.runRole` returns `undefined` for an
expired grant, so `requireRead` throws the shipped **`RUN_NOT_FOUND`** (`Unknown run:
<id>`) — byte-identical to the refusal a stranger receives, which is the uniform
non-disclosure this RFC applies everywhere else. **No new refusal code is introduced for
expiry**, and none is needed: an expired teacher is a stranger, and telling them their
access lapsed rather than that the run is unknown would itself disclose that the run
exists. The non-`runRole` sites fail closed to the same effect — the row is filtered out
of the join, so the run or session simply is not in the list.

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
10. **`RunStorage.grantMintedBySubmission` — the tenth reader, introduced by §5.2 of this
    RFC.** `SELECT granted_via FROM run_grants WHERE run_id = ? AND learner_id = ?`. It is
    listed here, in the same enumeration and under the same acceptance test, because the
    rule this section institutes is that **a reader of `run_grants` that is not on this
    list is a defect**, and an RFC that adds a reader while leaving the list at nine would
    be the first violation of its own rule. It must apply the expiry filter like every
    other site: an expired grant is absent, so it mints no review permission. Criterion 7
    is restated from *"a tenth reader"* to *"an eleventh reader"* accordingly.

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
**seven table rows covering twelve statements** exist. The count has been wrong twice and
the corrections are recorded because the rule is what matters, not the integer: the first
draft listed **five**; the 2026-08-16 cross-review added a sixth (the family of
run-creation inserts, relying on an unstated default); the author round of 2026-08-16
carried six; and the second cross-review of 2026-08-16 found a **seventh** row — the two
promotion sites each contain a fresh-grant `INSERT` as well as the `UPDATE` the table
described — plus one misnamed symbol inside the sixth. The default — leaving it alone — is
wrong in at least two of them, right in the rest, and **must be written down either way**.

**One further writer exists and is deliberately outside the table:** the legacy backfill
`INSERT INTO run_grants (run_id, learner_id, role, granted_at) SELECT id, ?, 'host', ? FROM
drill_runs` inside `#addLearnerTables`. It runs only in the migration that *creates*
`run_grants`, strictly before either column exists, so it can neither set nor mis-default
them. It is named so that criterion 7's enumerating test does not fail on it and does not
silently skip it.

**The table now carries a second column, `granted_via` (§5.2), at the same seven rows**,
because §5.2 would otherwise reintroduce exactly the defect this table was built to
prevent: a nullable column added to `run_grants` whose behaviour at most of its writers is
an unstated default. The two columns are **not** governed by the same rule, and the
difference is the row that matters:

> **`expires_at` is a limit and `granted_via` is a capability. A path that changes a
> grant's role preserves limits and drops capabilities.**

| Write site | `expires_at` | `granted_via` |
|---|---|---|
| the submission mint (§3.4) | sets it from `expiresInDays` | **writes `'submission'`** — this is the only writer of a non-NULL value anywhere in the product |
| **the four run-creation host inserts** — `RunStorage.create`, **`createImportedRun`**, `createDerivedRun` and `createRepertoireGapRun`, each `INSERT INTO run_grants (…) VALUES (…,'host',…)`. **Corrected by cross-review 2026-08-16: the author round's fourth entry was *"the live-run create path"*, which does not exist — `createLiveSession` inserts `'participant'`, never `'host'`. The real fourth is `createImportedRun`, whose host insert sits beside the `imported_games` insert in the same transaction** | **writes NULL, and the column is deliberately left unnamed in the statement so SQLite's NULL default supplies it.** A run's own host never expires. Listed rather than assumed, because "the default is already right" is exactly the reasoning that made two of the rows below wrong | **writes NULL, same mechanism.** A host does not need a review capability: they already satisfy the `role === "host"` arm |
| **the two fresh-grant INSERT arms inside the promotion sites** — `redeemSessionJoinToken`'s `INSERT INTO run_grants(…) VALUES (?,?,?,?)` when `#roleInTransaction` returns `undefined`, and `createLiveSession`'s match-player `INSERT … 'participant'` on the same condition. **Added by cross-review 2026-08-16: each promotion site is *two* statements, an INSERT and an UPDATE, and the author round's table specified only the UPDATE** | **writes NULL** — a grant minted by redeeming a link or taking a match seat carries no classroom expiry, because no submission produced it | **writes NULL.** Same reasoning. Named rather than defaulted, under this table's own rule — an unstated default at two of eight writers is exactly the defect the table exists to prevent, and it is the defect that made two of the author round's five original rows wrong |
| `#mutateGrant`'s upsert (`ON CONFLICT … DO UPDATE SET role, granted_at`) | **must also clear `expires_at`**. A host re-granting a teacher by hand is an unbounded act; inheriting a stale classroom expiry would silently expire a grant the learner deliberately made | **must also clear `granted_via`**. Same act, same reasoning run the other way: a hand-made grant is not a submission, and letting a re-grant inherit `'submission'` would hand a review rail to a learner who used the ordinary share control and never submitted anything |
| `redeemSessionJoinToken`'s `spectator` → `participant` promotion | **must preserve `expires_at`**, never clear it. Clearing it would convert an expiring classroom grant into a permanent participant grant through a path the learner did not intend — the leak this section exists to prevent, arriving through the promotion rather than the mint | **must clear `granted_via`.** The opposite disposition from `expires_at`, and deliberately so — the promotion is a *different act by a different party* than the submission, and carrying the review capability through it would let a teacher redeem a session-join link and keep a rail the learner granted them for reading a finished attempt. Belt and braces: §5.2's `reviewing` predicate independently requires that no live session is open on the run, and a redemption implies one is |
| `createLiveSession`'s match-player upgrade | same rule as the promotion above | same rule as the promotion above |
| `deleteLearner`'s legacy-host restore (`INSERT OR IGNORE … 'host'`) | writes NULL — a legacy host never expires | writes NULL — `LEGACY_ID` submits nothing |

Expiry is enforced at read time rather than by a sweep, precisely so the row never
outlives its truth. A background purge is permitted as housekeeping but is never the
mechanism.

## 5. Assistance keyed on governance role — the coach who takes a seat, and the coach who reads

Two defects in one function, found from opposite ends and fixed in one place. §5.1 is
D80: the table is too generous to a host who is *playing*. §5.2 is the incoherence §2.3.4
names: the table is too mean to a grantee who is *reading a finished attempt*. Both are
the same underlying error — **`permittedAssistance` keys assistance on governance role
and nothing else**, so it cannot distinguish a host at the board from a host at the
whiteboard, nor a spectator watching a live game from a teacher reading a submitted one.
Each fix adds one input and one conjunct; neither adds a route, a permission value, an
`AssistanceConfig` key or a role.

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

### 5.1 The seating fix is a pure narrowing

`AssistanceContext` gains one field and the rule gains one conjunct. **This is the first
of the two changes this section makes to the same function; §5.2b prints the final form,
and that block — not this one — is what the implementer types.** The intermediate form is
shown because the direction argument below is about this change in isolation:

```ts
//  §5.1 in isolation:
//  mayRequestSplit = (role === "solo" || role === "host") && deliveryOpen && !seatedInContest
```

`seatedInContest` is true iff the run's live session is **open** (`live_sessions.closed_at
IS NULL`) and that session has a `match_states` row whose `whiteLearnerId` or
`blackLearnerId` is the principal. It is **not** conditioned on pause state: a seat is
a seat for the duration of the contest, and making the permission flicker at every pause
would be a worse contract than either extreme.

**The `closed_at IS NULL` clause was added by cross-review 2026-08-16 and it is not a
detail — without it §5.2's central equality claim is false on every match run.** The first
spelling of this predicate was *"the run has a `match_states` row and the principal is its
white or black learner"*, with no time bound at all. `match_states` is keyed
`session_id TEXT PRIMARY KEY REFERENCES live_sessions(id) ON DELETE CASCADE` and a session
is **closed, never deleted** (`UPDATE live_sessions SET closed_at=? WHERE id=? AND closed_at
IS NULL`), so the row survives the contest **permanently**. Under the unbounded spelling a
learner who once played a native match on a run is `seatedInContest` on that run forever —
locked out of Maia, corpus, narration and evidence lighting **on their own finished game,
for the rest of the run's life**, which is a far wider narrowing than D80 asked for and one
§5.1's own prose (*"for the duration of the contest"*) did not intend. Worse, it puts a
submission-granted reviewer — who is not seated — **strictly above the run's own host** on
all seven surfaces, which is precisely the asymmetry §5.2 exists to abolish, arriving
through §5.1's door. Bounding the seat to the open session is what the prose already said;
the predicate merely failed to say it. §9's criterion 10g pins both halves.

**The field is required, not optional-with-a-default**, so the compiler enumerates every
consumer rather than letting a missed site inherit a silent `false`. The consumers are:

| Consumer | Resolves `seatedInContest` from |
|---|---|
| `GET …/human-split` (`rest.ts`) | the run's **open** live session's `match_states` row versus `principal.learnerId` (`liveSessionByRun` does **not** filter `closed_at`; the resolver must) |
| `GET …/corpus` (`rest.ts`) | same |
| **`requireGuidanceDisclosure` (`rest.ts`), which gates `POST …/voice` (both the `compare` and the node arms), `POST …/speech` **and `POST …/reasoning-review`** | same. **Added by cross-review 2026-08-15; the route list corrected upward by cross-review 2026-08-16 — it is called from four places, not three, and `/reasoning-review` is the one nobody had counted.** This is the site `live-marker-quality` landed as the D68 fix (`design/BACKLOG.md` D68, closed 2026-08-15), so it did not exist when the source dossier was written and it is exactly the site this RFC claims to land behind. It must resolve the real seating, not a hardcoded `false`: a `false` here would leave `/voice` and `/speech` narrating the human-split content that `/human-split` refuses on the same run — reinstating D68 for the seated host. **Because the seating check lives inside `requireGuidanceDisclosure` rather than at each call site, `/reasoning-review` is covered for free** — but it is named so the implementer knows a fourth route's behaviour changes, and so a future refactor that inlines the check cannot drop it silently |
| the machine-seeded group path (`RunService`, the `permittedAssistance` call guarding `GROUP_SEEDS`) | same |
| `assistanceContext` (`apps/web/src/lib/DrillScreen.svelte`) | the session detail's `match` state versus the signed-in learner — the client already computes this for `learnerOwnsActiveMatchTurn` in `App.svelte` |
| `liveMarkers` (`packages/runtime/src/pivotal.ts`, which calls `permittedAssistance` itself) | passed through its context |
| `packages/runtime/src/adaptive-guidance.test.ts` and `apps/web/src/lib/client-surface-floor.test.ts` | explicit in each case |

`pivotal.ts` is also the file `rfc/archive/live-marker-quality.md` is rewriting, which is the
second reason for the landing order below.

**The same seven consumers resolve `reviewing` (§5.2), and for the same reason — the field
is required, so the compiler enumerates them.** The five server-side consumers resolve it
with `reviewingGrant` (§5.2d) from the run they already hold plus two storage lookups;

**Two mechanical consequences at `requireGuidanceDisclosure`, added by cross-review
2026-08-16 because both are invisible from the table above.** (i) Its shipped signature is
`requireGuidanceDisclosure(access: GuidanceAccess)`, and `GuidanceAccess` is
`{ run, node, role, pack?, historyUci, branchSeed }` — it carries **no principal and no
storage handle**, so neither new field can be resolved inside it as written. All **four**
call sites must pass the resolved fields (or the principal plus the service) explicitly;
the function is not a place a resolver can hide. (ii) `apps/server/src/guidance.test.ts`
carries a shipped source guard — *"pins every evidence-packet construction site behind
disclosure"* — which locates the **four** `evidencePacket(` occurrences in `rest.ts` and
asserts each is preceded, **within 800 characters of source**, by the literal token
`requireGuidanceDisclosure(`. Widening the call must keep that literal spelling and must
not push any site past the 800-character window, or a shipped guard turns red for a reason
that is not a defect. Named so the implementer does not discover it as a mystery failure.

`DrillScreen.svelte` reads it from the `reviewing` prop the run-detail projection carries
and **never derives it**; the two test files state it explicitly, both as `false`, which is
what keeps their existing assertions byte-identical. The consumer list is one list, walked
twice, precisely so an implementer cannot wire one field at seven sites and the other at
five — the failure mode a second optional-with-a-default field would have made invisible.

**Direction check, done as arithmetic rather than assertion.** The rule changes from `X` to
`X ∧ ¬seatedInContest`, which is monotone decreasing: no input that returned `locked_off`
can return `free` afterwards. Participant and spectator contexts had `mayRequestSplit ===
false` already, and a conjunction cannot raise a false. `markers` is unconditionally
`"free"` in the shipped table and this change does not touch it. So
`rfc/archive/live-marker-quality.md`'s **refusal** assertions — markers absent and
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

### 5.2 The review rail — the owner ruling of 2026-08-16, specified

**What was ruled.** The first draft carried this as Open question 1 and offered three ways
to ship without the rungs: ship degraded, defer behind a trigger, or hide the absent
controls. The owner refused all three — *"why do you not give option: add them and ship no
deferral… literally covered all options except 'implement properly'"* — and ruled that
teacher mode ships complete. The `design/BACKLOG.md` row **"Teacher mode ships COMPLETE —
build the missing rungs (owner ruling 2026-08-16)"** records it, and its sibling row
**"Claude's decision prompts systematically omit 'implement properly' — twice tonight"**
records why the question was wrong: *"every fork offered to the owner must include the
option of removing the constraint, or state in the prompt why removing it is impossible."*
This section removes the constraint. §5.3 is the only thing left outside it, and it is
outside for the one admissible reason.

#### 5.2a The rule, in one sentence

> **On a terminal, disclosed run with no live session open on it, a teacher holding a
> submission-minted grant gets the run host's own assistance table — the same one, not a
> reviewer's variant of it.**

**"Terminal" in that sentence is a summary, not the predicate, and cross-review 2026-08-16
requires the difference to be printed rather than glossed.** What conjunct two tests is
`run.events.some((event) => event.type === "outcome.reached")` — **monotone and sticky**.
A run is not frozen by reaching an outcome: the learner may rewind, branch and commit
further moves, and the flag never comes back off. Under `attempt_end` that is harmless,
because `feedbackDeliveryOpen` re-closes on the next `move.committed` and the first
conjunct shuts the rail with it. Under `delayed_checkpoint`, `segment_end` and
`immediate_guard`, `feedbackDeliveryOpen` **is** `feedbackDisclosed`, which is monotone
too — so on those policies a teacher keeps the full rail while the learner plays new
branches on a submitted run. **That is not a disclosure breach and must not be described as
one:** the learner is disclosed at the same instant on the same run, so the teacher never
passes the run's line, and §5.2b property 1 holds unchanged. But it does mean the rail is
scoped to *"a run that has finished at least once"*, not to *"a finished attempt"*, and the
sentences in §5.3 and §Motivation that lean on the second reading are leaning on something
the code does not say. Tightening it — for instance to *no `move.committed` after the last
`outcome.reached`* — is a coherent alternative and is **Open question 10**, not a silent
default.

Everything below is that sentence made executable. The design commitment worth naming
first is the one it *refuses*: there is no reviewer tier, no third permission value, and
no cell whose value depends on being a teacher. The permission function gains a boolean
that says *"this reader is reading a finished attempt they were handed"*, and that boolean
puts them on the existing solo/host arm. **A rail that differs by viewer is the thing this
RFC is trying not to build (§Motivation); equality is the fix, and truncation was never
the safe choice — it was a different shape of the same mistake.**

#### 5.2b The change to `permittedAssistance`

`AssistanceContext` gains a second required field, and `mayRequestSplit` is re-associated
so that both new inputs sit in their correct conjunct. **This block is the final form and
supersedes §5.1's intermediate one:**

```ts
export interface AssistanceContext {
  readonly sessionKind: RunSessionKind;
  readonly deliveryOpen: boolean;
  readonly role: "solo" | "host" | "participant" | "spectator";
  readonly seatedInContest: boolean;   // §5.1
  readonly reviewing: boolean;         // §5.2
}
// mayRequestSplit =
//   context.deliveryOpen
//   && !context.seatedInContest
//   && (context.role === "solo" || context.role === "host" || context.reviewing);
```

**Three properties of this exact spelling, each of which is a decision:**

1. **`reviewing` joins the `role` disjunction, never the `deliveryOpen` conjunction.**
   `design/05-in-run-experience.md` §3a-i is explicit that *"the run — not the viewer —
   carries the barrier"*, and the disclosure barrier is `deliveryOpen`. A reviewer term
   placed beside `deliveryOpen` would let a viewer open a barrier the run has not opened,
   which is the one thing that section forbids. Placed inside the role disjunction it does
   what it says: it admits a reader to the arm the run's host is already on, subject to
   the run's own barrier unchanged. **A reviewing teacher on a run whose delivery is shut
   is refused, exactly as the learner is.**
2. **`seatedInContest` dominates, and it dominates *symmetrically* — which is a claim about
   §5.1's predicate, not about this one.** A reviewer who is also a seated contestant is
   refused; the two fixes compose in the safe order without a special case. But the
   composition is only safe because §5.1's seat is now bounded to an **open** session.
   **Cross-review 2026-08-16 found the unbounded spelling and it broke this section's
   central claim outright:** with a permanent seat, the run's own host on a finished native
   match is `mayRequestSplit === false` forever while a submission-granted reviewer is
   `true`, so the reviewer sits **strictly above the host** on all seven surfaces. The
   equality this section is built on — and criterion 10c's deep-equal assertion — is false
   on every such run, and 10a's solo-pack fixture cannot see it. The fix is in §5.1, the
   pin is criterion 10g, and the lesson is recorded here because §5.2's whole safety
   argument is *"the reviewer is put on an arm the host is already on"*: any input that can
   knock the **host** off that arm while leaving the reviewer on it falsifies it, and
   `seatedInContest` is currently the only such input. A third field with that property
   would have to be checked the same way.
3. **When both new fields are `false` the function is byte-identical to the shipped one.**
   `deliveryOpen && true && (solo || host)` is the shipped `(solo || host) && deliveryOpen`.
   Criterion 10d pins this, so the migration of every existing call site is provably a
   no-op before either new behaviour is switched on.

#### 5.2c What this does to `live-marker-quality` — its fixtures survive, one of its sentences does not, and the difference matters

`reviewing` is **true** for a principal on a run iff **all three** hold:

| Conjunct | Resolved from | Why it is here |
|---|---|---|
| the principal's `run_grants` row on this run has `granted_via = 'submission'` | `RunStorage.grantMintedBySubmission` (§4.3 read site 10) | the learner's own act is the only source of the capability, which is §2.2's whole design applied one level down. A hand-minted spectator grant does **not** confer it — see the disposition question below |
| the run has an `outcome.reached` event | `run.events` — already in memory at every consumer | `design/05` §3a-i: *"`outcome.reached` discloses under every policy (a finished run has nothing left to contaminate)"*. This is the design tier's own sentence, and it is the reason the review rail is admissible at all |
| no live session is open on the run | one lookup on `live_sessions` by `run_id` — **`NOT NULL UNIQUE` in the shipped DDL at both sites, verified** — with `closed_at IS NULL`. The shipped `liveSessionByRun` does **not** apply that filter and must not be reused unmodified | a submitted run can later carry a live session; without this the teacher would hold a rung-3 rail over a game somebody is playing, which is precisely what `live-marker-quality` refuses |

**On the race, since a permission surface has to answer it** (cross-review 2026-08-16).
`reviewingGrant`'s three inputs are resolved by three reads that are not in one
transaction, so a session opened between the lookup and the response yields **one** stale
answer. That is acceptable and is not a new property: `deliveryOpen` has had exactly the
same shape since it shipped, `permittedAssistance` is evaluated per request, and the next
request refuses. **What would not be acceptable is a cached or sticky `reviewing`**, and
§5.2e's first bullet already forbids it — the flag is recomputed per request on the server
and arrives at the client as a projection field it *never derives* (§5.2d). The one
implementation note: the client's copy is as old as its last `GET /runs/:id/graph`, so the
client may render a rail the server will refuse. That is the ordinary refusal path
(`ASSISTANCE_WITHHELD`), and §7.2 already requires the rail to state a closure rather than
render a dead control — but the client must treat a refusal on a rail it believed open as
a **re-fetch**, not as an error toast.

**The author round claimed this compatibility *"by construction, not by fixture edit"*, on
the ground that *"every context criterion 6 constructs is a live-session context, so the
third conjunct makes `reviewing` false in all of them."* **Cross-review 2026-08-16 read
criterion 6 and that ground is false in both of its halves.** The conclusion survives; the
argument does not, and the argument was what Open question 1's closure rested on, so it is
replaced rather than patched.

Criterion 6's verbatim text is two claims on two layers:

> *"A test asserts a `human_divergence` marker is present in `pivotalMarkers` and **absent
> from `liveMarkers` for a participant, for a spectator**, and for a solo viewer with
> `feedbackDeliveryOpen === false`; and present for solo/host with delivery open. […]
> Server tests assert `/voice` and `/speech` return `ASSISTANCE_WITHHELD` for participant,
> spectator, and pre-disclosure solo contexts, then open for solo/host after disclosure."*

- **Its first half is a runtime unit test.** `liveMarkers(run, branchId, context)` takes an
  `AssistanceContext` **object literal**. There is no live session anywhere in it — no
  `live_sessions` row, no storage, no run id to look one up by. "Every context is a
  live-session context" is not merely unproven there; the layer has no sessions in it.
- **Its second half does not need a live session either.** A `spectator` row in
  `run_grants` is mintable by the shipped `POST /runs/:id/grants` on a run that has never
  had a session, and `POST …/voice` reaches `requireGuidanceDisclosure` through
  `guidanceAccess` → `requireRead`, which consults `runRole` and nothing else. A server
  test can construct that spectator with no session at all.

**Why the fixtures nevertheless stay green, stated as the real reason.** Not conjunct
three. It is conjunct **one**: `reviewing` is `false` unless the grant carries
`granted_via = 'submission'`, and criterion 6 mints no submission — the word *submission*
does not occur in `live-marker-quality`. At the runtime layer the field is a literal the
compiler forces the fixture to spell, and it will be spelled `false`. **So this RFC's
compatibility with criterion 6 is exactly as strong as §5.1's was, and no stronger: it
holds by fixture convention, checked by criterion 11's third test, not by a structural
impossibility.** The author round's claim of a stronger guarantee is withdrawn. The
practical difference is that a *future* edit to `live-marker-quality`'s fixtures could
break it silently, which is why criterion 11 asserts the property over that RFC's contexts
rather than trusting the reading.

**Two of its sentences become false as universally quantified claims, not one.** This is
the honest cost and the author round undercounted it:

1. **The `/voice` + `/speech` sentence** — *"for participant, spectator, and pre-disclosure
   solo contexts"* — needs *"non-reviewing spectator"*.
2. **The `liveMarkers` sentence** — *"absent from `liveMarkers` for a participant, for a
   spectator"* — needs the same qualification, because §5.2e's seventh row and criterion
   10a **do place the `human_divergence` marker for a reviewing spectator**. `liveAdmitted`'s
   `human_divergence` arm is `return permission.humanSplit === "free"` (verified at the
   symbol), so opening the table opens the marker; that is the mechanism §5.2e credits, and
   it is the same mechanism that falsifies this sentence.
3. **And `live-marker-quality` §6.2's body** carries the owner ruling's cost in a stronger
   form still — *"the marker **leaves participants and spectators entirely, on every run,
   permanently**"*. That sentence is a recorded owner ruling, not a test, and §5.2 crosses
   it. **§5.3 is rewritten against this finding**, because the first draft of §5.3 cited
   the same ruling as the reason this RFC may not touch the live case while §5.2 was
   already crossing it in the review case.

None of the three edits is made here — this RFC lands behind `live-marker-quality` and a
draft does not edit an implementing sibling — and all three are carried in §10's cross-draft
row, which the author round left claiming *"the only edit §5.2 requires anywhere outside
this document"* in the singular.

Two further compatibility facts, both verified at the symbol rather than assumed:

- **L4(b) is satisfied automatically and needs no second edit.** That rule says *"No live
  firing may disclose more than the same viewer could obtain on request at that moment
  under `permittedAssistance`… The permission table is the invariant."* `liveAdmitted`
  reads the table. So when the table opens for a reviewing teacher, the `human_divergence`
  marker becomes admissible on their timeline **by the rule's own mechanism**, with no
  change to `liveAdmitted` and no second definition to drift. The learner sees the
  identical marker on the identical terminal run, which is §9.4's byte-identical
  projection holding rather than being breached. Stated because it is a real behaviour
  change that arrives without a line of code, and an unstated one of those is how a
  surface grows by accretion.
- **`client-surface-floor`'s shipped guard survives.** `apps/web/src/lib/client-surface-floor.test.ts`
  asserts *"every non-host assistance permission pointwise at or below the host ceiling"*,
  comparing a non-host context to a host context **with the other inputs held fixed**.
  With `reviewing` true on both sides, host and spectator return the *same* table, so the
  ordering holds at equality; with `reviewing` false on both sides nothing moves. The
  guard is therefore not weakened, and criterion 10e extends its loop over the two new
  fields so it stays a real guard rather than one that stopped covering the input space.

#### 5.2d The schema and the seam

```sql
ALTER TABLE run_grants ADD COLUMN granted_via TEXT;
```

Nullable with a NULL default; every existing row reads back NULL, so the migration is
additive with no backfill, exactly like `expires_at`. **No CHECK constraint.** The only
value written is `'submission'` (§4.3's write table) and a one-value CHECK would be a
literal frozen into a migration body for no gain — the migration-9 freeze lesson cuts
against adding vocabulary, not for it. The column is provenance, not a capability flag:
it records *how the row came to be*, and the permission is derived from it.

**Why the flag lives on the grant and not on the submission record.** The alternative —
joining `assignment_submissions` and testing membership of `granted_learner_ids` — needs
no new column and was rejected for a reason §4.1a already established: **the grant must
outlive the record of the act.** A classroom deletion cascades `assignments →
assignment_submissions` while the `run_grants` rows survive by design, so a join-derived
capability would silently vanish while read access remained, producing exactly the
divergence between the two records that §4.1 renders rather than hides — but in a place
nothing renders. Keeping the flag on the grant also keeps this RFC's own promise that the
`run_grants` row is *"the **single** source of truth for access"* (§4.1), now for the
level of access as well as the fact of it.

**It also does not weaken the normative rule.** §2.1's rule is that no code path may
derive a `run_grants` **row** from a `classroom_members` row alone, and `learner-rating`
§10a.2 transposes it verbatim in form for `standing_members`. `granted_via` is written by
the submission mint — whose actor is the learner, on a run they host — and read by nothing
that creates a row. **No classroom table is read on the assistance path at all**, which is
strictly further from the smuggle than the join alternative would have been.

**The resolver is one function, defined once.** Placed beside the table it feeds, so the
server and the client cannot disagree — the D185 hand-duplication class this RFC's own
header cites:

```ts
// packages/runtime/src/assistance.ts
export function reviewingGrant(input: {
  readonly run: DrillRun;
  readonly grantMintedBySubmission: boolean;
  readonly liveSessionOpen: boolean;
}): boolean {
  return input.grantMintedBySubmission
    && !input.liveSessionOpen
    && input.run.events.some((event) => event.type === "outcome.reached");
}
```

**The client never recomputes it.** `DrillScreen.svelte`'s `assistanceContext` is built
from `run` and the `viewerRole` prop; it has no way to know a grant's provenance and must
not guess. `RunService.graph` — the run-detail projection the drill screen renders from,
reached by `GET /runs/:id/graph` — carries `reviewing: boolean` alongside the role it
already resolves through `requireRead`, and `DrillScreen` takes it as a prop defaulting to
`false`, exactly as `viewerRole` defaults to `"host"`. `RunSummary` and `RunStorage.list`
are **not** changed: the list projection would have to load every snapshot to test
terminality, and the review rail is a property of the run you opened, not of the list.

#### 5.2e What the teacher actually gets, enumerated

All five routes behind the two enforcement shapes, plus the two lighting cells — the
complete set §2.3.4 named as refused:

| Surface | Before | After, on a reviewing grant |
|---|---|---|
| `GET …/human-split` | `ASSISTANCE_WITHHELD` | the Maia distribution at the node, identical bytes to the host's |
| `GET …/corpus` | `ASSISTANCE_WITHHELD` | the explorer corpus stats at the node |
| `POST …/voice` (both the `compare` and node arms) | `ASSISTANCE_WITHHELD` | narration of the evidence the run already carries |
| `POST …/speech` | `ASSISTANCE_WITHHELD` | the same, synthesised |
| `POST …/reasoning-review` | `ASSISTANCE_WITHHELD` | quotation proposals over the learner's own recorded transcript |
| `permittedAssistance().boardLighting` / `.arrows` | `"sight"` | `"evidence"` |
| `liveAdmitted` on `human_divergence` | not placed | placed — via L4(b), **with no change to `liveAdmitted` or `pivotalMarkers`**. Not *"no code change"*: `liveMarkers`' only caller is `DrillScreen.svelte`, which must forward the `reviewing` prop (§5.2d), and the dot renders only if the *viewer's own* `assistance.markers` is `"live"` — `SILENT_ASSISTANCE.markers` is `"off"` and `loadAssistance` returns it for every unset profile. Criterion 10a states both (corrected by cross-review 2026-08-16) |
| `GET …/evidence` (`RunService.evidence`) | **already open** — no role check | unchanged; it is now *coherent* with the rest rather than an exception |

**Law 8 holds unchanged at every one of them, and none of it is new machinery.** These are
the shipped routes serving the shipped sources: Maia is a measured human-move
distribution, the corpus is observed game counts, and `renderVoice` renders
`evidencePacket`'s sentences under `BANNED_JUDGEMENTS`. This RFC invokes no model and
composes no sentence. What changes is *who* the shipped routes will answer, and the answer
is byte-identical to the one the learner gets — so a teacher cannot be shown a grading of
a learner's move that the learner is not shown, because nothing is graded for anybody.

**The two consequences a reader should not have to discover:**

- **The rail closes if the learner opens the run live — *once*, and never again.** Conjunct
  three is not sticky. A teacher mid-review whose student opens a live session on the
  submitted run loses Maia, corpus and narration until it closes; read access is untouched.
  **The word is "opens", not "reopens"** (cross-review 2026-08-16): `live_sessions.run_id`
  is `NOT NULL UNIQUE` and a session is closed by `UPDATE … SET closed_at`, never deleted,
  so a run carries **at most one live session in its entire life**. The transition this
  bullet describes can happen exactly once per run and is irreversible in the other
  direction. The implementer's corollary is that `liveSessionByRun` — which selects the row
  by `run_id` with **no `closed_at` filter** — cannot be reused for conjunct three as it
  stands; the resolver needs its own `closed_at IS NULL` predicate, or every run that ever
  hosted a session loses the rail forever. That is `design/05:41`'s
  *absence is stated, never simulated* applied here: the classroom view and the run rail
  must say the rungs are closed and why, never render dead controls. It is also the
  inverse of §4.1's divergence rule and gets the same treatment.
- **A hand-minted spectator grant confers nothing.** A learner who shares a run with a
  coach through the shipped `POST /runs/:id/grants` gives read access, not the review
  rail. That is a real asymmetry between two learner acts that look similar, and it is
  deliberate: the submission is the act this RFC gave a consent story, an expiry, a
  revocation table and a rendering, and the share control has none of those. Widening the
  capability to every host-minted spectator grant on a terminal run is a coherent future
  position and it is **Open question 9**, not a silent default.

### 5.3 What stays outside, and why it is not a deferral

Exactly one thing does: **a teacher watching a student play *live* still gets no Maia and
no corpus.** Under §5.2 the third conjunct refuses it by construction.

This is not the ruling being trimmed, and the distinction is worth being precise about,
because the ruling was made against exactly this kind of trimming. What the owner ruled
complete is the **review** surface — §2.3's question, Open question 1's subject, and the
`design/BACKLOG.md` row's own words (*"ship without Maia and corpus"* → *"build the
human-model split and the corpus rungs into the teacher surface"*). §5.2 builds all of it.
The live case was never inside that question; it is a different surface with a different
answer already given.

**The author round justified this by citing an owner ruling of 2026-08-15 in
`rfc/archive/live-marker-quality.md`, and cross-review 2026-08-16 went and read that ruling.
It does not say what the citation claimed, and the direction of the error is the
dangerous one: the ruling is *wider* than the use made of it, so §5.2 crosses it while
§5.3 was arguing the RFC may not.** The banner form quoted by the author round is
*"the marker leaves participants and spectators entirely, and leaves solo play until
delivery opens"*, accepted *"with open eyes"*. But §6.2's body — which that ruling
directs into the specification — records the accepted cost as:

> *"the marker **leaves participants and spectators entirely, on every run, permanently**"*

**On every run, permanently.** A reviewing teacher is a `spectator`, and §5.2e's seventh
row plus criterion 10a place the `human_divergence` marker for them. So §5.2 already
narrows that ruling's scope from *all spectators* to *non-reviewing spectators*, on the
authority of the owner's **later** ruling of 2026-08-16 that teacher mode ships complete.
That is a defensible reading — a later ruling on the review surface is entitled to move an
earlier ruling's boundary where the two touch — but **it has to be stated as what it is,
not concealed behind a citation of the ruling being narrowed.** Citing a ruling for a
proposition it does not support is the failure `feedback-delivery`'s closure shipped on
2026-08-16 and it is not repeated here.

**So the reason the live case stays outside is restated, smaller and true.** It is not
that the 2026-08-15 ruling is untouchable — §5.2 touches it. It is that the 2026-08-16
ruling **is about the review surface and says nothing about the live one**: the row it is
recorded in is *"Teacher mode ships COMPLETE — build the missing rungs"*, its named subject
is Open question 1, and Open question 1's subject was a submitted, finished attempt. The
review boundary of the earlier ruling is moved by an owner ruling; the **live** boundary
has no such ruling behind it, and an author may not move it by specification. That is a
narrower claim than *"it is occupied"*, it is the true one, and it survives the reader who
notices §5.2 in the other direction.

If the owner wants the live case too, the ruling to revisit is `live-marker-quality`'s and
the revisit is cheap: that RFC records its own ruling as *"cheap to reverse… worth
revisiting after the surface is actually used"*, and under §5.2's shape the reversal is one
conjunct, not a design. **This is therefore an owner question this RFC does not open and
does not need answered to land** — §5.2 is complete without it — but it is named as one
rather than as a closed matter, because the previous draft closed it with a citation that
did not hold.

**The other half of §2.3.4's incoherence is also left, and it is left to its owner.**
`RunService.evidence` serves staged Stockfish to **any** granted reader on **any**
disclosed run, live ones included, with no role check — so a live spectator today gets
rung-3 engine numbers that `/human-split` refuses them on the same run. §5.2 makes the
*review* case coherent and does not touch the live case, which by `live-marker-quality`'s
own L4(b) — *"a route that disagrees with [the table] is a defect in the route"* — is a
defect in `RunService.evidence`, on the surface that RFC owns, in the **narrowing**
direction this RFC has no business taking unilaterally. Reported as a new ledger row in
§10 rather than fixed here.

## 6. A fourth `session.kind` — considered and refused

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

**The stress test, rebuilt from scratch by cross-review 2026-08-16, because the version
it replaces was reasoning from a tree that no longer exists.** The 2026-08-15 argument
ran: *D82's gap is against `RunSessionKind = pack | position | imported`, which keys
`assistanceKey`'s three `localStorage` entries; `SESSION_KINDS` is a different type on a
different aggregate and keys no preference, so a fourth member would not have paid for
D82 anyway.* **Every load-bearing clause of that is now false**, and the refusal has to
survive without it:

- **D81 and D82 are both CLOSED**, by `live-surface-honesty`, implemented 2026-08-15 —
  the same day this draft was written, which is how it missed them.
- **`assistanceKey` no longer takes `RunSessionKind`.** It takes
  `AssistanceProfile`, and `ASSISTANCE_PROFILES` has **six** exhaustive members —
  `pack`, `position`, `imported`, `match`, `stream`, `onramp`
  (`apps/web/src/lib/assistance-preference.ts`). There are six preference slots, not
  three.
- **`session.kind` *is* behavioural in the preference layer.** `assistanceProfile({
  sessionKind, feedbackPolicy, liveKind })` reads `liveKind` — a `SessionKind` — and
  returns `stream` or `match` from it. So the premise that a `SESSION_KINDS` member keys
  no preference is exactly inverted: **a fourth member would flow straight into
  `assistanceProfile` and produce a seventh profile.** The refusal below is therefore
  giving something up, and has to be worth it.

**It is, and the surviving reason is the first bullet of the three above, not the symbol
argument.** A classroom is not a session — it is standing and asynchronous, while
`LIVE_SESSION_KINDS` labels an aggregate that ends — and a *classroom pack night is an
ordinary `academy` session that a classroom happens to own* (§3.5). A `classroom` kind
would therefore not name a new kind of live session; it would name the same live session
with a relation attached, and the relation is what `live_sessions.classroom_id` already
carries. The seventh preference profile it would buy is a profile for *"an academy
session whose host wrote a roster"* — a distinction no learner experiences and no
permission reads. **Both of §5's fields are persisted facts with no dependence on the
label**, and this survived the author round of 2026-08-16 that added the second one:
`seatedInContest` reads `match_states`, and `reviewing` reads `run_grants.granted_via`,
the run's own event log and `live_sessions.closed_at`. Neither reads `sessionKind`, which
is D307's finding restated — the function takes the field and never touches it. Widening a
closed, SQL-constrained, route-validated
enum to gain that is the category error `broadcast-and-teacher-surfaces.md` §4.4 warns
about, where three distinct objects hide under one word.

What the refusal costs is one join — a policy that wants to know *"is this a classroom
context?"* reads `live_sessions.classroom_id` rather than a label — and a relation that
can answer *which* classroom is strictly more than a label that cannot.

**The live row in this territory is now D307, and this RFC does not touch it.**
`permittedAssistance` takes `sessionKind` and never reads it, and `loadAssistance`
returns `SILENT_ASSISTANCE` for every unset profile — so the six profiles ship the
*permission* half of per-context assistance and not the *defaults* half. That is an
owner-tier design gap on the assistance-context surface, it is unaffected in both
directions by anything here, and it belongs to whoever next owns that surface. Naming it
without claiming it is the point.

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

**Neither surface renders an assistance control of its own.** The teacher's review happens
in the shipped run view, reached from a submission row, with the rail §5.2 opens — the
same components the learner uses, driven by the same `assistancePermission` derivation. No
"teacher review" screen, no second rail, no control that exists only for a teacher. Where
a rung is closed — delivery shut, the run reopened live, the grant expired or revoked —
the rail states the closure rather than rendering a control that refuses
(`design/05:41`), which is the shipped `client-surface-floor` posture and not a new one.

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
3. **`design/05-in-run-experience.md` §3-forms, *"The config owns the matrix"*, promises
   that *"a curated drill, Just Play, a match, a stream, and the on-ramp each get their
   own defaults"*.** **Re-pointed by cross-review 2026-08-16** — the first draft cited
   this as `design/05:147` against **D82**, and both halves have moved: the line number
   now lands inside the honesty blockquote rather than on the promise, and **D82 is
   closed** (six exhaustive `ASSISTANCE_PROFILES` ship). The residual is **D307**: the
   profiles select *permission* but every unset profile still resolves to
   `SILENT_ASSISTANCE`, so the *defaults* half of the promise is unshipped. This RFC
   neither widens nor narrows D307 — §5 changes **two** conjuncts in the permission rule
   and leaves the preference keys and their defaults entirely alone. Neither new field
   reads `sessionKind`, so D307's *"takes `sessionKind` and never reads it"* is as true
   after this RFC as before it, and no unset `AssistanceProfile` stops resolving to
   `SILENT_ASSISTANCE`. Recorded so the gap is not silently attributed here.

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
3. Every one of the **seven** `/progress*` routes continues to take only
   `authenticate()` — `/progress/recommendations` explicitly among them; a test asserts
   no route or service method in this RFC accepts a subject learner id.
3a. **Law 8 at the note (§3.3).** A test asserts an assignment `note` round-trips as the
    literal bytes submitted, is absent from the run's event log and from every
    `evidencePacket` / `renderVoice` input on a run submitted to that assignment, and is
    rendered only with its author's handle. A source guard asserts no code path composes
    a note from an evidence value, engine reading, corpus figure or provider output. A
    second guard asserts this RFC introduces no `PivotalKind` member and no live-surface
    firing, so `rfc/archive/live-marker-quality.md`'s L5 admission burden is untouched.

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
7. A grant with `expires_at` in the past is invisible at **all ten** enumerated read
   sites — `GET /sessions` and `RunStorage.grantMintedBySubmission` explicitly among them,
   so an expired grant mints no review permission either — and the test enumerates them by
   symbol and fails if an **eleventh** reader of `run_grants` is introduced without a case.
   A second test pins the **seven** §4.3 write rows **for both columns**: a host's manual
   re-grant clears `expires_at` *and* `granted_via`; a session-join promotion of an
   expiring, submission-minted spectator grant **preserves `expires_at` and clears
   `granted_via`** — the one row where the two columns are required to diverge, and
   therefore the row a single-column test would pass while measuring nothing. **The
   divergence row's reachability is asserted, not assumed** (cross-review 2026-08-16): the
   state it needs is a learner who submits a finished run and *then* opens an academy
   session on that same run and invites the teacher as a `participant`, which
   `redeemSessionJoinToken` reaches only while `closed_at IS NULL`. A criterion whose
   fixture cannot be built is a criterion that cannot be satisfied, so the path is written
   out here.
7a. **The write enumeration is a source guard, not a behaviour test, and it must count
    statements rather than sites.** A test greps `storage.ts` for every `INSERT INTO
    run_grants`, `INSERT OR IGNORE INTO run_grants`, `INSERT … ON CONFLICT(run_id,
    learner_id)` and `UPDATE run_grants SET role` occurrence, asserts the count matches
    §4.3's table plus the named migration backfill, and fails when an unlisted one appears.
    **This exists because the site count has been wrong in every revision of §4.3** — five,
    then six, then seven — and each error had the same shape: a *function* was listed while
    one of its two statements was not. Counting functions is what let
    `redeemSessionJoinToken`'s fresh-grant `INSERT` and `createLiveSession`'s match-player
    `INSERT` sit unspecified through three drafts of a table whose stated purpose is that no
    writer defaults silently.
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
    mutually-accepted pause, `GET …/human-split`, `GET …/corpus`, `POST …/voice`,
    `POST …/speech` **and `POST …/reasoning-review`** all return `ASSISTANCE_WITHHELD`
    for **both** players, and `permittedAssistance` returns `boardLighting: "sight"` and
    `arrows: "sight"` for both. A non-seated host in the same session, with the same run
    state, is still permitted on all **five** routes and still gets `evidence` lighting.
    (`/reasoning-review` added by cross-review 2026-08-16: it is the fourth caller of
    `requireGuidanceDisclosure` and inherits the narrowing whether or not anyone tests
    it — so it is tested.)
**The review rail (§5.2):**

10a. **The rail opens, on all seven surfaces §5.2e enumerates.** A learner plays a pack run
     to `outcome.reached`, submits it, and closes any live session. For the granted
     teacher, `GET …/human-split` and `GET …/corpus` return content rather than
     `ASSISTANCE_WITHHELD`; `POST …/voice` (both arms), `POST …/speech` and
     `POST …/reasoning-review` return content; `permittedAssistance` returns
     `boardLighting: "evidence"` and `arrows: "evidence"`; and `liveMarkers` places the
     `human_divergence` marker. The last one is asserted **because no change to
     `liveAdmitted` produces it** — it arrives through `live-marker-quality`'s L4(b) reading
     the table, and an untested behaviour that appears without a diff is the one most likely
     to be removed by accident later.

     **Two fixture requirements the criterion is unsatisfiable without, added by
     cross-review 2026-08-16.** (i) `pivotalMarkers` only emits a `human_divergence` marker
     from an `opponent.move_selected` event whose `selection.policyModeApplied` is
     `"human_common"` and whose on-window candidates carry masses with `max ≤ 0.50` and at
     least three at `≥ 0.15` (`packages/runtime/src/pivotal.ts`, the `divergence` helper) —
     verified at the symbol. A 10a fixture without such an event asserts the presence of a
     marker that never existed for anybody, which is the criterion-that-cannot-be-satisfied
     class. (ii) The marker reaches a **screen** only through `DrillScreen.svelte`'s single
     `liveMarkers` call, which is itself gated on the *viewer's own client-local*
     `assistance.markers === "live"` preference — and `loadAssistance` returns
     `SILENT_ASSISTANCE`, whose `markers` is `"off"`, for every unset profile. So §5.2e's
     *"no code change"* is true of `liveAdmitted` and **false of the delivery path**:
     `DrillScreen` must receive and forward the `reviewing` prop (§5.2d) before the teacher
     can see anything, and the teacher must have turned their own markers on. The criterion
     therefore asserts `liveMarkers`' return value, which is the permission fact, and states
     the preference gate rather than implying the dot appears unbidden.
10b. **Each of the three `reviewing` conjuncts is load-bearing, tested one at a time.**
     From the passing state of 10a, flipping exactly one input closes the rail and leaves
     read access intact: (i) the grant is hand-minted through `POST /runs/:id/grants`
     rather than submitted, so `granted_via` is NULL; (ii) the run has no `outcome.reached`
     event; (iii) a live session is open on the run (`closed_at IS NULL`). Each case
     returns `ASSISTANCE_WITHHELD` on all five routes and `"sight"` on both lighting cells,
     while `GET /runs/:id` still succeeds. **A conjunct that cannot be shown to refuse
     anything is a conjunct that is not doing work**, and this criterion is what stops the
     predicate degenerating into `granted_via = 'submission'` under a later refactor.
10c. **The reviewing teacher's table equals the run host's, field by field — on two runs,
     not one.** `permittedAssistance` is called once with the teacher's resolved context and
     once with the host's, and the two frozen records are asserted **deep-equal** — not
     merely that `humanSplit` is `"free"`. This is §Motivation's *"no viewer-specific
     surface at all"* claim made falsifiable; if any future cell diverges by viewer, this
     fails. **The second run is required and is the whole point** (cross-review 2026-08-16):
     the first is 10a's solo pack run, on which the equality is trivial and would hold under
     the defective predicate too; the second is a **finished native match** — a run whose
     closed live session still carries a `match_states` row naming the host as White,
     submitted after the contest ended. Under §5.1's original unbounded `seatedInContest`
     the host reads `"locked_off"` while the teacher reads `"free"`, so this assertion is
     what catches it. A deep-equality test whose only fixture is the case where every
     candidate implementation agrees is the [[D444]] class — it passes while measuring
     nothing — and 10a's run is exactly that case.
10d. **The migration of the call sites is provably a no-op.** A test asserts that for the
     full cross-product of `sessionKind × deliveryOpen × role` with `seatedInContest:
     false, reviewing: false`, the new `permittedAssistance` returns records deep-equal to
     the shipped function's output, captured as literals before the change. Both new
     behaviours are therefore switched on by the resolvers, never by the edit.
10e. **Both of `client-surface-floor`'s shipped permission tests, and the extended loop must
     be able to fail.** `apps/web/src/lib/client-surface-floor.test.ts` carries **two**, and
     the author round named only one:
     - *"keeps every non-host assistance permission pointwise at or below the host
       ceiling"* — its loop is extended over `seatedInContest` and `reviewing` as well as
       `deliveryOpen`, and still passes, at equality where `reviewing` is true on both
       sides.
     - *"keeps participant and spectator evidence permissions role-scoped"* — which asserts
       `humanSplit`/`corpus` are `"locked_off"` and `boardLighting`/`arrows` are `"sight"`
       for spectator **unconditionally**. This is the shipped embodiment of the invariant
       §5.2 narrows; it stays green only because the compiler forces its literal to spell
       `reviewing: false`. Named here because an unnamed green test is not evidence.

     **And the extended loop must cross the two sides, not hold them equal.** The shipped
     guard builds host and candidate *with the other inputs held fixed*, so extending it
     over the new fields pairs host(seated, reviewing) with candidate(seated, reviewing) and
     can never construct the pairing that actually occurs in production: a host whose
     `reviewing` is always `false` (host grants write `granted_via` NULL, §4.3) against a
     spectator whose `reviewing` may be `true`. The loop must therefore range over the two
     sides **independently**, and it must be shown to **fail** against §5.1's original
     unbounded `seatedInContest` — a guard extended in a way that cannot generate the
     asymmetry it guards against is the *passes-while-measuring-nothing* class wearing a
     larger loop.
10f. **Law 8 and the byte-identity of the review projection.** On the 10a run, the teacher
     and the learner receive byte-identical responses from `GET …/human-split`,
     `GET …/corpus`, `GET …/evidence` and `GET …/events`. A source guard asserts this RFC
     adds no call to a voice or model provider and composes no sentence: the only providers
     reached are the shipped ones, through the shipped `renderVoice` / `evidencePacket`
     path, with `BANNED_JUDGEMENTS` unchanged.
10g. **The seat ends when the contest ends, and the run's own player is never below their
     reviewer.** Added by cross-review 2026-08-16 as §5.1's missing pin. One learner hosts a
     native match on a pack run, plays it to `outcome.reached`, and the session is closed.
     Three assertions on that run afterwards: (i) `seatedInContest` resolves **false** for
     both former players, because the session's `closed_at` is set; (ii) the host-player's
     `permittedAssistance` returns `humanSplit: "free"` and `boardLighting: "evidence"` —
     they are not locked out of their own finished game; (iii) after the learner submits it,
     the teacher's table and the host's are deep-equal (10c's second fixture). A fourth
     assertion runs the *same* three during an **open** match at a mutually-accepted pause
     and gets the opposite of (i) and (ii), so D80's narrowing is shown still to bite. **The
     criterion exists because the unbounded predicate satisfied every other criterion in
     this section**: `match_states` survives session close, so nothing in 10a–10f, in
     criterion 10, or in either `client-surface-floor` guard as extended would have gone red.

**Both directions at once:**

11. `permittedAssistance` returns identical tables for **non-reviewing** participant and
    spectator contexts before and after this change — the regression guard that
    `rfc/archive/live-marker-quality.md`'s refusal assertions are untouched, and the reason
    criterion 10b's case (i) exists. Separately, a test asserts `live-marker-quality`'s
    *"then open for solo/host after disclosure"* fixture uses a **non-seated** host, so the
    two RFCs' criteria stay compatible (§5.1), and a third asserts that **every context that
    RFC constructs has `reviewing === false`** — the §5.2c claim, made falsifiable rather
    than argued. **Both of those tests are fixture-convention guards and are labelled as
    such** (cross-review 2026-08-16): §5.2c's *"by construction"* argument is withdrawn, so
    criterion 11 is not a restatement of a structural fact but the *only* thing standing
    between this RFC and a silent break the next time `live-marker-quality`'s fixtures are
    edited. It is therefore acceptance-blocking rather than confirmatory, and it must name
    the file and test titles it ranges over so a renamed fixture fails loudly instead of
    matching nothing — the census-join-key failure, one tier over.

**Migration:**

12. **The migration is written as `STORAGE_VERSION + 1` at the moment it lands, never as
    a literal chosen while drafting** (restated by cross-review 2026-08-16 under the
    register's *assigned at landing* rule; the first draft pinned `21`, then `22`, and
    both were stale within a day). It applies to a database at the immediately preceding
    version and to a fresh one; all existing `run_grants` rows read back with
    `expires_at` null and unchanged behaviour; **no run snapshot is rewritten and this
    RFC moves no run-schema version** — a test asserts `DRILL_RUN_SCHEMA_VERSION` is
    byte-identical before and after, whatever it reads at the time. It runs inside the
    migration loop's ordinary `BEGIN IMMEDIATE` arm with **neither** `PRAGMA foreign_keys
    = OFF` nor `legacy_alter_table = ON` — that arm is `migration.version === 14` only,
    and this migration must not extend it. **All three `ADD COLUMN`s** carry a NULL default
    — `run_grants.expires_at`, `run_grants.granted_via` and `live_sessions.classroom_id` —
    which is what SQLite requires of an added `REFERENCES` column while foreign keys are
    on, and what makes all three backfill-free. A test asserts every pre-existing
    `run_grants` row reads back `granted_via` NULL and behaves exactly as before.

**Docs:** `docs/` gains a classrooms page stating the enrolment-is-not-observation rule,
the revocation table and the review rail's three conjuncts; `docs/live-sessions.md`'s
§Accepted limitation gains the seat-symmetry sentence from §5.1 **and one amendment
required by §5.2**. Its shipped sentence reads *"role may cap it lower for a participant or
spectator, never raise it, and never exceed what the run itself has disclosed"* — verified
verbatim at HEAD. The second and third clauses stand unchanged and are the important ones:
the review rail **never exceeds what the run has disclosed**, because `deliveryOpen`
remains a conjunct. The first clause becomes *"role may cap it lower for a participant or a
**non-reviewing** spectator"*. Named as an amendment rather than left to be discovered,
because a docs sentence that contradicts a shipped permission is the same defect class as
a route that contradicts the table.

## 10. Register claims — stated loudly

| Register | Claim |
|---|---|
| **Migration** | **A POSITION IN THE LANDING ORDER, NOT AN INTEGER.** This RFC takes `STORAGE_VERSION + 1` **at the moment it lands**, per the register's *assigned at landing* rule. It does not claim a number, and the integer printed in `rfc/README.md`'s row is a record of order, not a reservation. **Verified at HEAD by the author round of 2026-08-16: `STORAGE_VERSION` is `23` (`apps/server/src/storage.ts`, `export const STORAGE_VERSION = 23`), landed by `opponent-contracts` at `6ba0736`.** The three literals this document has carried — 21, then 22, then a row still reasoning from 21 — are all dead, and the point is that **the fourth would be too**: the position is the claim. What this RFC **does not move**: no run-schema version, no pack-schema version, no `public_tokens` scope, no `RunRole`, no `LIVE_SESSION_KINDS` member, no `AssistanceConfig` version. What it adds: creates `classrooms`, `classroom_members`, `assignments`, `assignment_submissions`; adds nullable `run_grants.expires_at`; adds nullable `run_grants.granted_via` (§5.2d); adds nullable `live_sessions.classroom_id` with `ON DELETE SET NULL`. Create-table/index plus **three** `ADD COLUMN`s — **no table rebuild, no backfill, no snapshot rewrite**, verified against the two closest precedents: migration 15 (`repertoire-gap-finding`, create-table/index only) rather than migration 14 (`social-match`, the only rebuild). The one shipped read that filters on a version is `RunStorage.list`'s `WHERE r.schema_version = ?` against `DRILL_RUN_SCHEMA_VERSION`; this RFC moves no run schema, so existing rows stay stamped and stay listed, and **no stamp is required** |
| **Migration position — who else holds it** | **Two documents, three claims — restated by the author round 2026-08-16 and it moved twice under this draft.** [[D423]] recorded a three-way contest on `STORAGE_VERSION + 1`; [[D447]] corrected it to **two-way** because `opponent-contracts` *landed* 23 and left the ladder. The two remaining documents are **this RFC and `learner-rating`** — and by claim it is three, because [[D423]]'s own addendum notes `learner-rating` carries two independent table sets (§10.1's rating tables and §10a.7's standing tables). `learner-rating` §11.1 lands **behind** this RFC and calls that *"a **correctness** requirement, not a courtesy: §10a.7's tables carry a foreign key into `classrooms`"* — verified by reading its DDL: `cohort_standings.classroom_id TEXT PRIMARY KEY REFERENCES classrooms(id) ON DELETE CASCADE`. So the ladder is **`teacher-surface` → `learner-rating`**, and it is enforced by a foreign key rather than by agreement. `graduation-clearance` and `feedback-delivery` both deliberately took **no** position, which is why they are not on it |
| **Landing position vs `board-annotation`** | **WITHDRAWN — the question resolved itself while the draft carried it.** The prior row proposed swapping this RFC behind `board-annotation`. That proposal is moot: `board-annotation` is **implemented**, archived at `rfc/archive/board-annotation.md`, and holds **migration 22** in the register (`22 \| 21→22 \| archive/board-annotation.md \| implemented 2026-08-16`). Nothing is left to swap. Recorded as withdrawn rather than deleted, because the reasoning that produced it — *a draft that cannot land ahead of an accepted RFC renegotiates* — is the rule that now sends `learner-rating` behind **this** one, and the register row above is where it applies |
| **Run schema** | **none.** This RFC moves no run-schema version. (`DRILL_RUN_SCHEMA_VERSION` reads **`0.17`** at HEAD — `packages/schema/src/index.ts:1`; `opponent-contracts` moved it from `0.16` on 2026-08-16, and the row above this one said `0.16` a few hours earlier. Third stale reading of this constant in three days, which is the argument for *moves nothing* over any number.) A classroom is not run state, no new run event is emitted, and §5.2 adds no event either — `reviewing` is derived from events that already exist |
| **Pack schema** | **none.** This RFC moves no pack-schema version. (`DRILL_PACK_SCHEMA_VERSION` reads **`0.27`** at HEAD — `packages/schema/src/index.ts:2`, landed by `pack-graduation`. **`0.28` is NOT free**: it is *claimed and kept* by `graduation-clearance`, accepted 2026-08-16, and the register's *"0.28 is the next free pack lane"* line is stale beneath its own table. **`0.19` is frozen shut.** This document has now printed `0.22`, `0.24` and `0.27` for the same constant on three consecutive readings.) An assignment references a registered `packId`; no pack document changes, so no digest moves and there is no rebase pressure against the pack lane in either direction |
| **Token surface** | **none.** `public_tokens` keeps its two shipped scopes; enrolment is handle-bound, per the `adoption-wave-1` ownership pin |
| **Refusal codes** | **none** — added by cross-review 2026-08-15, because the first draft made no claim here and §7.1 named a *"uniform not-found"* with no code behind it. There is no `NOT_FOUND` member of `ServerErrorCode` (`errors.ts`); the literal in `rest.ts` is the unrouted-path response, and `RUN_NOT_FOUND` is run-specific. **Ruling: every classroom and assignment non-disclosure refuses `INVALID_REQUEST`**, identical in body for "does not exist", "you are not a member" and "you have left". Reusing `RUN_NOT_FOUND` for a classroom would lie about the subject; minting `CLASSROOM_NOT_FOUND` would both add a versioned member and *be* the disclosure it is meant to prevent, since only a member could ever see it |
| **Refusal codes, second pass** | **still none**, re-swept 2026-08-16 across `apps/`, `packages/`, `schemas/` and the other nine active RFCs. The four codes this RFC emits — `INVALID_REQUEST`, `RUN_NOT_FOUND`, `FORBIDDEN`, `ASSISTANCE_WITHHELD` — are all shipped members of `ServerErrorCode`. No other active draft mints a classroom-, assignment-, enrolment- or grant-shaped code (`claim-backing`'s `CLAIM_*`, `pack-graduation`'s `GRADUATION_*`, `vocabulary-wiring`'s `PLAN_SIGNATURE_*`, `format-surface`'s `LEG_*` and `engine-leverage`'s `DEVIATION_COST_*` families are disjoint from this surface), so the sweep is clean in both directions |
| **Cross-draft ownership — and one clause owed to `live-marker-quality`** | That RFC's enforcement sites are `/human-split`, `/corpus`, and (as of the D68 fix) `requireGuidanceDisclosure`, which gates `/voice`, `/speech` **and `/reasoning-review`**: **five routes across three sites.** Correction, author round 2026-08-16, from reading the whole document rather than the summary this draft had been repeating: **`live-marker-quality` does not claim ownership of the `permittedAssistance` table.** Its §7 reads *"Nothing versioned. No register is claimed"*, and what it owns is the D68 fix plus a consumer-side gate in `liveAdmitted`. It treats the table as an **invariant** (L4(b)) rather than as property. This RFC therefore does not need its permission to change the table; it needs to land **behind** it and to leave its criterion 6's fixtures green, which §5.2c establishes — **by fixture convention, not by construction; that claim is withdrawn and criterion 11 is what carries it instead.** **What is owed at landing — three edits, not one. Corrected by cross-review 2026-08-16, which read criterion 6 and §6.2 rather than the author round's summary of them:** (1) criterion 6's server sentence *"for participant, spectator, and pre-disclosure solo contexts"* gains one word — *"for participant, **non-reviewing** spectator, …"*; (2) **criterion 6's *first* sentence** — *"absent from `liveMarkers` for a participant, for a **spectator**"* — needs the identical qualification, because §5.2e's seventh row and criterion 10a place the `human_divergence` marker for a reviewing spectator and `liveAdmitted`'s arm for that kind is literally `permission.humanSplit === "free"`; (3) **§6.2's body sentence recording the owner's accepted cost** — *"the marker leaves participants and spectators **entirely, on every run, permanently**"* — is narrowed by this RFC to non-reviewing spectators, which is a **change to the recorded terms of an owner ruling** and is therefore the owner's to confirm at acceptance, not the implementer's to edit. None of the three is made here. **`rfc/README.md` carries no ownership pin on `permittedAssistance` at all** — verified, the Cross-draft ownership pins section holds exactly two pins, on the position player and on `public_tokens` — so the pin this row asks for is a **new** entry recording the table as shared with this RFC's two fields named, not an amendment of an existing one. (`learner-rating` §11.1's phrase *"its ownership pin on `permittedAssistance`"* refers to a pin that does not exist; that correction belongs to that document.) |
| **Cross-draft — `learner-rating`, and one collision neither document names** | The author round checked §2.1's normative rule against `learner-rating` §10a.2 and found it **strengthened, which is verified**: §10a.2's transposed sentence is *"No code path may derive a `standing_members` row from a `classroom_members` row alone"*, §10a.2 states *"What this RFC does not touch: `run_grants`, `assignments`, `assignment_submissions`, `permittedAssistance`, and the grant-expiry rule of `teacher-surface` §4.3"*, and §5.2d reads **no classroom table on the assistance path at all**. Two things it did **not** check, both found by cross-review 2026-08-16 and both consequences of `learner-rating` landing *behind* this RFC: (a) its §5.2 asserts `AssistanceContext` *"carries three fields (`sessionKind`, `deliveryOpen`, `role`)"* and its **AC-5** asserts `permittedAssistance`'s output is *"byte-identical to today's for the same inputs"* — written against a shape that will have five fields by the time it lands. AC-5 stays **satisfiable** (criterion 10d gives byte-identity when both new fields are `false`) but must be re-expressed, and nothing in either document says so; (b) its §5.2 also refuses *"every server-routed assistance route for [a rated run's] whole lifetime"* with no role exception, which voids §5.2's review rail on any rated run a learner submits — Open question 11. Both are `learner-rating`'s to resolve as the document landing second; **reported, not fixed, and named here so the ladder is not mistaken for coordination** |
| **Ledger rows this RFC ships** (owner tier; reported, not edited) | **D80** — closed by §5.1. **Correction, cross-review 2026-08-16:** the author round said *"its row already reads 'owned by `rfc/teacher-surface.md`', so no title changes"*. The phrase is there, but it is in **column 2**, and D80's title has **already been rewritten** — the row now opens *"owned by `rfc/teacher-surface.md`, fixed as a pure NARROWING"* and preserves the original title only after an *"`*Original:*`"* marker. Its column 1 reads `🔨` while its column-3 disposition still reads *"💡 open, found 2026-08-15"*, which is [[D419]] firing on this RFC's own row. **What the closing commit flips is column 1 (`🔨` → `✅`), and it must not read column 3 to decide.** Note also that §5.1's fix changed under this cross-review: what closes D80 is the seat bounded to an **open** session, not the unbounded seat the row's rewritten title describes, so the row's summary needs the qualifier or it records a rule the code does not have. **D92** (*"A ninth reader of `run_grants`, and it is disclosure-facing rather than structural"*) and **D93** (*"Account deletion would strand grants permanently"*) — both already carry *"🔨 owned by `rfc/teacher-surface.md`"* in their disposition column, both ship here (§4.3 site 9, §4.1a), and **neither was named in this row before the author round of 2026-08-16.** An RFC that ships a row assigned to it and does not claim it is how a wave completes invisibly, which is the failure the closeout protocol exists to prevent. **Teacher mode ships COMPLETE — build the missing rungs (owner ruling 2026-08-16)** (row title verbatim) — discharged by §5.2. **Locate it before editing it (cross-review 2026-08-16): it is *not* in the defect table.** It lives in the *"Strategic reading and pivotal detection"* `| Idea | Take | Home |` table, so its `✅ **RULED**` sits in column 2 (the *Take*) and column 3 holds a *Home* (`` `teacher-surface`, `05` §3 ``), not a disposition. [[D419]]'s "column 3 is not a status" hazard does not apply to this row — a different one does: an editor who applies the defect-table convention here will write a status into a Home column. **Events layer: pack nights, cohorts, team relays** (row title verbatim) — its cohort and pack-night halves ship here; the row should be **split, not closed**, so team relays and native matchmaking survive with their own row, and [[D412]] asks for the same disambiguation. **Named and explicitly not claimed:** **D307** (§6, §8.3), **D419** — this row's own hazard, since D92 and D93 both read `🔨` in a column that is not a status. **Closed by others and no longer claimed here:** D81, D82 (`live-surface-honesty`), D62 (`client-surface-floor`), D94 (the permission-and-correctness batch) |
| **Ledger rows this RFC's author round produced — ALREADY LANDED, do not re-land** | **Corrected by cross-review 2026-08-16: D448, D449 and D450 are present in `design/BACKLOG.md` at HEAD, each reading `💡 open, found 2026-08-16`.** The row below was written as *"reported for claude to land… not written here"*, and a reader acting on it would mint duplicates — the wave-completes-invisibly failure running in reverse. The three rows, as landed: **D448** — `RunService.evidence` serves rung-3 Stockfish to any granted reader on any disclosed run with no role check, so a *live* spectator gets engine numbers that `/human-split` refuses them on the same run. By `live-marker-quality`'s own L4(b) this is a defect in the route, in the narrowing direction, on the surface that RFC owns; §5.2 makes the review case coherent and deliberately does not touch it (§5.3). **D449** — the assistance permission function now takes two viewer-side inputs that are neither `role` nor persisted in the run, and there is no register for *inputs to `permittedAssistance`*; a third would collide the way migration numbers did before 2026-08-12. **D450** — `docs/live-sessions.md` §Accepted limitation asserts a permission rule in prose (*"role may cap it lower… never raise it"*) that no test reads; the same defect class as [[D257]]'s producerless corpus figure, one tier over |
| **New ledger rows this cross-review produced** (reported for claude to land, ids from **D451** — **D448–D450 are taken**; not written here) | **D451** — `design/BACKLOG.md`'s defect table prints its own header as `\| Block \| Issued to \| Status \|` while its rows are `\| <id> <status> \| <description> \| <disposition note> \|`. The header therefore labels **column 3 "Status"** — the exact misread [[D419]] exists to prevent, printed at the top of the table D419 describes, and a second header disagreement (rows are defects, not blocks) beside it. D419 asks for the column to update on flip or carry a historical marker; **it should also ask for the header to stop naming it.** A guard that is contradicted by its own table header is not a guard. **D452** — `permittedAssistance`'s two new inputs are each a *predicate over storage that the function cannot see*, and both were mis-specified on their first writing in the same way: `seatedInContest` omitted the session's `closed_at` and `reviewing` had to be told that `liveSessionByRun` does not filter it either. The shared root is that `assistance.ts` takes booleans and every caller resolves them independently — five server sites, one client site, two test files. **Either the resolvers live beside the table (as `reviewingGrant` does and `seatedInContest` does not), or the next input repeats the defect.** This is the mechanism half of [[D449]], which records only that there is no register. **D453** — `rfc/README.md`'s pack-lane table asserts, in two consecutive rows, that `0.28` is *"claimed 2026-08-16 and kept"* by `graduation-clearance` **and** that *"0.28 is the next free pack lane"*; two Active rows (`opponent-contracts`, `measurement-records`) repeat the stale half as *"0.28 stays free"*. The next genuinely free lane is **0.29** and the register says so nowhere. Three documents now reason from a line that is false beneath its own table |
| **`rfc/README.md`** | **not edited by this draft**, per the drafting instruction — **but it has been edited by someone, and three of the four staleness claims below were true when the author round wrote them and are false at HEAD.** Corrected by cross-review 2026-08-16, which read the row: (1) *"the headline is `OWNER-BLOCKED`"* — **no longer true**; it reads *"draft — OWNER BLOCK DISCHARGED 2026-08-16; the new §5.2 awaits cross-review before acceptance"*; (2) *"it says this RFC holds the next free migration position after `opponent-contracts`' implementing 23"* — **no longer true**; it reads *"claims one migration position (`STORAGE_VERSION + 1`; head is **23** at `6ba0736`)"*, which is the *assigned at landing* form this row asks for; (3) **still true and the only surviving claim**: the pack-lane constants are stale in the register, `0.28` is claimed and kept by `graduation-clearance`, and the register's *"0.28 is the next free pack lane"* line contradicts the row two lines above it ([[D453]], above); (4) *"the summary should name four tables, `run_grants.expires_at`, `run_grants.granted_via`, `live_sessions.classroom_id`"* — **half true**: the row now names the review rail and the `granted_via` `ALTER`, but its table enumeration is still *"Four tables, `run_grants.expires_at`, `live_sessions.classroom_id`"* with `granted_via` missing from the list. **The lesson, which is why this is rewritten rather than deleted:** a register row a draft describes as stale is itself a fact with a timestamp, and this one moved under the description. Still owed at landing: the migration-register row in position **ahead of `learner-rating`** (the register has no `teacher-surface` row and its integer-only shape cannot express the ladder — [[D423]], [[D449]]), the **new** cross-draft pin on `permittedAssistance` naming both fields, and — new — the row's own claim that the seventh surface arrives *"with **no code change**"*, which §5.2e and criterion 10a now qualify: no change to `liveAdmitted`, a required change to `DrillScreen` |

## Open questions

1. ~~**May a reviewing teacher request Maia and corpus evidence on a submitted, disclosed
   run?**~~ **RULED AND SPECIFIED, 2026-08-16 — and the ruling is that the question was the
   wrong shape.** It had been re-posed twice, each time as a choice between ways of
   shipping without the rungs: first *"may the widening be taken here"*, then *"does the
   review surface work at all without Maia and corpus"*. The owner refused both framings —
   *"why do you not give option: add them and ship no deferral… literally covered all
   options except 'implement properly'"* — and ruled that teacher mode ships complete.

   **§5.2 is the specification.** The `reviewing` input exists, it is required rather than
   optional, and it puts the reviewing teacher on the run host's own arm of the permission
   rule rather than creating a reviewer tier. The three conjuncts, the schema column, the
   resolver, the seam to the client and the **seven** acceptance criteria (10a–10g, the
   last added by cross-review 2026-08-16) are all there.

   **The 2026-08-15 objection was real. It is *partly* answered, and cross-review
   2026-08-16 downgrades the author round's claim to have answered it whole.** That
   objection was that a `reviewing` disjunct *"raises exactly the falses that
   [`live-marker-quality`] asserts"* and would make the two documents assert opposite
   things about the same test. The author round answered it with the third conjunct —
   *"every context criterion 6 constructs is a live-session context"* — and **that premise
   is false**: criterion 6's first half is a `liveMarkers` unit test over `AssistanceContext`
   object literals with no session at any layer, and its second half reaches a spectator
   through `run_grants` alone. What actually keeps the fixtures green is the **first**
   conjunct (`granted_via = 'submission'`, a value criterion 6 never mints), which is a
   fixture-convention guarantee of exactly the strength §5.1 already had. **The two
   documents therefore do assert opposite things about the same *sentence*, and the count is
   three, not one:** criterion 6's server clause, criterion 6's `liveMarkers` clause, and
   §6.2's recorded owner-ruling cost *"entirely, on every run, permanently"*. All three are
   proposed in §10 and not taken here; the third is the owner's, because narrowing the
   recorded terms of a ruling is not an author's edit. **The objection was to a version of
   the widening
   with two conjuncts; the version with three has the property in a narrower form — over
   *sentences* rather than over *tests* — which is why the remedy is three textual edits
   and not a redesign.**

   **ANSWERED — nothing is waiting on an owner.** The one item that was, **edit (3)**, was
   **confirmed by the owner on 2026-08-16**: `live-marker-quality` §6.2's recorded cost
   narrows from *"participants and spectators entirely, on every run, **permanently**"* to
   **"for the duration of live play"**. The 2026-08-15 record is left intact and the
   amendment is stated beside it, not written over it. **Live play is unchanged** — a
   spectator watching a game in progress still gets nothing — and **the third-value
   permission stays refused**; the reviewer reaches the marker on the run host's own arm.
   It was surfaced rather than assumed because the author round both crossed that ruling
   (§5.2e) and cited it as untouchable (§5.3) in the same pass, and a document may not do
   both. Open questions 9, 10 and 11 are author calls
   with stated defaults, not blocks (11 is `learner-rating`'s to resolve); questions 2–7
   were never blocks.
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
8. ~~**Should `RunService.flip` be host-only on another learner's run?**~~ **ANSWERED AND
   RETIRED, cross-review 2026-08-16 — the tree closed it under the draft.** Raised
   2026-08-15 on the finding that `flip` was `requireRead`-only. **D94 closed on
   2026-08-16**: `flip` now calls `mayWrite(access.role)` and refuses `FORBIDDEN` before
   creating any derived run, so a `spectator` — which is all a submission mints — cannot
   fork a position out of a student's run at all. Not host-only, but write-capable-only,
   which is the narrower answer this question was reaching for and it costs this RFC
   nothing. §4.1 is corrected accordingly, including the part this question existed to
   protect: revocation still does not restore the pre-submission state, because a teacher
   separately granted `participant` by the learner does pass `mayWrite`. Nothing remains
   for the owner to rule.
9. **Should the review rail attach to *every* host-minted spectator grant on a terminal
   run, rather than only to submission-minted ones?** Opened by the author round of
   2026-08-16 as the one real choice §5.2 makes that could reasonably go the other way.
   **Author's position, and the shipped default:** no — bind it to the submission. The
   argument for widening is that both grants are the learner's own deliberate act on their
   own run, so distinguishing them is arbitrary from the learner's side. The argument
   against, which wins for now, is that the shipped share control has no consent story, no
   expiry, no revocation table and no rendering of who holds what, while the submission has
   all four — and a `session_join`-redeemed spectator on a closed academy session would
   acquire the rail through a path nobody designed for it. **This is an author call with a
   stated default, not an owner block**, and it is cheap to reverse in exactly one place:
   the first conjunct of §5.2c. Named so that a later widening is a decision rather than a
   discovery.
10. **Should conjunct two mean "has finished at least once" or "is finished now"?** Opened
    by cross-review 2026-08-16. As specified it is `events.some(outcome.reached)`, which is
    monotone: a learner who submits a finished run and then rewinds and plays new branches
    keeps the teacher's rail open throughout, on every feedback policy except `attempt_end`
    (§5.2a). **Author's position and the shipped default:** leave it monotone. The learner
    is disclosed on the identical run at the identical instant, so nothing is shown to the
    teacher that is withheld from the player, and the alternative — *no `move.committed`
    after the last `outcome.reached`* — makes the rail flicker branch by branch, which is
    the contract §5.1 rejected for `seatedInContest` and for the same reason. **The cost is
    honest and is the reason this is a question rather than a footnote:** §Motivation's case
    for the private attempt is that *"the rehearsal loop only works if being wrong is
    cheap, and it stops being cheap the moment someone is always watching"*, and a monotone
    conjunct means that after one submission the teacher's rail is open over every later
    branch of that run. The learner can revoke, and the classroom card names who holds
    access (§2.4), so the surface is visible rather than silent — but this is the one place
    in §5.2 where the rule and the motivation are not the same shape.
11. **What happens to the review rail on a *rated* run?** Opened by cross-review
    2026-08-16 and it is a cross-draft question, not an author call. `rfc/learner-rating.md`
    §5.2 specifies that *"a rated run refuses every server-routed assistance route for its
    whole lifetime"*, keyed on its `rated_games` row, with **no role exception** — and that
    RFC lands **behind** this one by its own §11.1. A learner who plays a rated game and
    then submits it to an assignment therefore gets a teacher whose review rail is silently
    void. **This is currently consistent rather than broken** — the host is refused too, so
    §5.2's *"the teacher's table equals the host's"* still holds, at zero — and neither
    document mentions the other's mechanism: the string `rated` does not occur in this RFC
    and `review` does not occur in `learner-rating`'s assistance sections. Consistency by
    coincidence between two documents on one ladder is the D4/D8 class §2.2 cites, so the
    resolution belongs in whichever lands second, which is `learner-rating`. Reported in
    §10's cross-draft row.

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
  the migration free and backfill-free, `mintLink`'s bounds, the two `public_tokens`
  scopes, `RUN_ROLES`, the `/progress*` routes, the ledger row titles, and template
  compliance.
- 2026-08-16: **second adversarial cross-review**, by a different agent that did not write
  the draft or the first review, against the tree at `STORAGE_VERSION` 21. **The consent
  model survives a second attack unchanged** — enrolment still derives no grant, the
  submission path is still the only minter, and the tree has since closed *more* of the
  residue than the draft claimed. **The finding that organises the rest: this draft was
  written on 2026-08-15 and four ledger rows it reasons from closed on 2026-08-15 or
  2026-08-16, three of them in its favour.** Eleven changes landed:

  1. **The migration claim is withdrawn as an integer and restated as a position.** The
     first draft claimed 21, was reassigned to 22 on the premise *"`STORAGE_VERSION` is 20
     at HEAD"*, and that premise was already false: **`STORAGE_VERSION` is 21**,
     `engine-leverage`'s migration has landed, and `migration 21` is `engine-leverage`'s,
     not `22`. Under the register's *assigned at landing* rule a held-but-unlandable
     integer is a hazard rather than a reservation, so §10 now claims `STORAGE_VERSION + 1`
     at landing and states what this RFC **does not move** (§10, criterion 12).
  2. **The landing position is proposed to swap with `board-annotation`** — that RFC is
     accepted; this one is a draft with an owner-gated question, and the register's own
     rule sends the draft behind (§10).
  3. **Two more stale constants:** run schema reads **`0.16`**, not `0.15`; pack schema
     reads **`0.24`**, not `0.22`, with `0.28` the next free lane. Both rows now claim
     *moves nothing* rather than a number (§10).
  4. **§6 rebuilt from scratch: D81 and D82 are CLOSED** by `live-surface-honesty`, and
     every load-bearing clause of the old symbol argument is now false —
     `assistanceKey` takes `AssistanceProfile` (**six** members, not three), and
     `assistanceProfile` reads `liveKind`, so a fourth `LIVE_SESSION_KINDS` member **would**
     reach the preference layer. The refusal survives on the category-error ground alone,
     which is now the only ground stated. **D307** replaces D82 as the live row (§6, §8.3).
  5. **`client-surface-floor` is archived and D62 is closed**, so §2.4's phone dependency
     has cleared — and it inverts into a requirement, because the compact floor now has
     no Session region to host a watcher list (§2.4, `Depends on:`).
  6. **D94 is closed and `RunService.flip` now checks `mayWrite`**, so a submission-minted
     `spectator` cannot fork a student's position at all. §4.1's *"the third is open"*
     paragraph was false; **Open question 8 is retired**, answered by the tree.
  7. **A fifth route behind `requireGuidanceDisclosure`: `POST …/reasoning-review`.** The
     seating field reaches it for free, which is exactly why it is now named and tested
     rather than left to be discovered (§5.1, §9.10, §10).
  8. **A seventh `/progress*` route: `/progress/recommendations`** — and it is the one a
     teacher surface is most tempted to widen, since it is literally a per-learner
     weakness feed. Named and refused (§Out of scope).
  9. **A sixth `expires_at` write site**, the four run-creation host inserts, which the
     first table left to an unstated default — the same reasoning that had made two of its
     five rows wrong (§4.3).
  10. **The expiry refusal is named:** `RUN_NOT_FOUND` via `runRole` → `requireRead`, with
      the reasoning for why a distinct "your access lapsed" code would itself be a
      disclosure. An expiry column with no named refusal is a declaration, not a rule (§4.3).
  11. **Two additions of substance rather than correction**, both in territory a document
      with "teacher" in its title cannot leave implicit: a **§Motivation subsection testing
      this RFC against *"the v1 identity"* and *"an engine review screen with a rewind
      button"* by name**, including the honest residual that a classroom view is the shape
      a dashboard grows from; and **§3.3's note grounded in `design/05` §3-forms'
      attribution ruling** — never in the run, never inside a run, never composed from an
      evidence value, and pre-commitment by design rather than by oversight, with
      criterion 3a to pin it. Also recorded: this RFC admits **no live-surface kind**, so
      `live-marker-quality`'s L5 burden is not engaged.

  **The owner block is disentangled and it is smaller than it read:** the live block is a
  single product call (Open question 1's re-posed question), not a wait on
  `live-marker-quality` — which is `implementing`, and which only blocks this RFC on the
  branch where the owner answers *no*. Verified sound and unchanged in this pass: the
  consent separation and its normative rule, all nine `run_grants` read sites, the five
  §4.1 revocation triggers and §4.1a's account-deletion correction, `RunService.evidence`
  being `requireRead` + `feedbackDeliveryOpen` with no role check, `share` and
  `distillationAccess` being host-only, §5's narrowing direction and its `boardLighting` /
  `arrows` consequence, `mintLink`'s bounds (14 default, 1–90, one use, 50 links), the two
  `public_tokens` scopes and their CHECK, `RUN_ROLES`, `LIVE_SESSION_KINDS`, the refusal-code
  register (no new code, and no collision with the other nine active RFCs), the
  `design/05:41` citation, the ledger row titles, and template compliance.
- 2026-08-16: **author round implementing the owner ruling *teacher mode ships COMPLETE*.**
  The RFC was `OWNER-BLOCKED` on *"does the review surface work without Maia and the
  corpus?"*, a question that offered three ways to ship without them. The owner refused the
  fork. **The block is discharged by building the rungs, not by answering the question**,
  and the question is recorded as dissolved rather than resolved.

  **What was built (§5.2, ~200 lines, the largest single addition since the draft was
  created):** `AssistanceContext` gains a second required field, `reviewing`;
  `mayRequestSplit` is re-associated to `deliveryOpen && !seatedInContest && (solo || host
  || reviewing)`, which is byte-identical to the shipped function when both new fields are
  false (criterion 10d); `run_grants` gains a second nullable column, `granted_via`, whose
  only writer is the submission mint; a `reviewingGrant` resolver is defined once beside
  the table it feeds; and the flag reaches the client on the run-detail projection rather
  than being recomputed there. The teacher gains **all five** routes behind the two
  enforcement shapes, both lighting cells, and — through `live-marker-quality`'s own L4(b),
  with no code change — the `human_divergence` live marker. Six acceptance criteria,
  10a–10f, pin it.

  **The 2026-08-15 objection is answered rather than overridden**, which is the round's
  substantive finding. That objection — a `reviewing` disjunct raises exactly the falses
  `live-marker-quality`'s criterion 6 asserts — was correct about a two-conjunct predicate.
  The shipped predicate has **three**, and the third is *no live session open on the run*.
  Every context criterion 6 constructs is a live-session context, so its fixtures stay
  green **with no edit at all** — a stronger guarantee than §5.1 could give for the same
  criterion's other half. One word is owed to that criterion's sentence at landing,
  proposed in §10 and not taken here.

  **Five things the round found by reading rather than assuming, all corrected in place:**
  (1) **`live-marker-quality` does not own the `permittedAssistance` table** — §7 reads
  *"Nothing versioned. No register is claimed"*, and the words *teacher*, *reviewer*,
  *observer* and *coach* appear nowhere in its 1056 lines; this draft had been repeating a
  summary of it for three revisions. (2) **`board-annotation` is implemented and archived
  at migration 22**, so §10's proposed landing-position swap is moot and is withdrawn as
  history. (3) **`STORAGE_VERSION` is 23**, run schema **`0.17`**, pack schema **`0.27`**,
  and **`0.28` is claimed and kept by `graduation-clearance`** — this document has now
  printed three different values for the pack constant on three consecutive readings, which
  is the argument for the *moves-nothing* form over any number. (4) **[[D423]]'s contest is
  two-way by document and three-way by claim**, and the remaining ladder is
  `teacher-surface` → `learner-rating`, enforced by that RFC's `cohort_standings.classroom_id
  REFERENCES classrooms(id)` rather than by agreement. (5) **D92 and D93 both read
  *"owned by `rfc/teacher-surface.md`"* and neither was claimed in §10's ledger row** —
  an RFC that ships a row assigned to it without claiming it is how a wave completes
  invisibly.

  **Also landed:** §4.3's write table now governs both `run_grants` columns at all six
  sites, with the one row where they are required to **diverge** — a session-join promotion
  preserves `expires_at` and clears `granted_via` — named as the row a single-column test
  would pass while measuring nothing; the read enumeration goes to **ten** and criterion 7
  to *"an eleventh reader"*; `docs/live-sessions.md`'s §Accepted limitation is named as
  requiring one word, since its shipped sentence *"role may cap it lower for a participant
  or spectator, never raise it"* contradicts the new rule while its other two clauses do
  not; `client-surface-floor`'s pointwise guard is extended over the new inputs rather than
  left covering a shrinking share of them; and §Motivation's *"an engine review screen with
  a rewind button"* test is rewritten, because its old text argued that §5 *narrows* engine
  access — now false, and the honest replacement is stronger: **a rail that differs by
  viewer is a review screen in embryo whichever direction it differs in**, and equality is
  the fix.

  **One thing stays outside, and §5.3 states why in the form the ruling requires.** A
  teacher watching a student play **live** still gets no Maia and no corpus. That is not
  this ruling trimmed — the ruling was about the review surface, and all of it is built.
  It is a different surface already occupied by `live-marker-quality`'s **own owner ruling
  of 2026-08-15**, accepted *"with open eyes"*, that the marker *"leaves participants and
  spectators entirely"*. Reversing an owner ruling by specification is not an author's act.
  The revisit is cheap if wanted — that RFC records its ruling as *"cheap to reverse"* —
  and under §5.2's shape it is one conjunct. **Three new ledger rows are reported for
  claude to land (D448–D450), not written here**, the first of which is the other half of
  §2.3.4's incoherence: `RunService.evidence` serves rung-3 Stockfish to live spectators
  with no role check, which by L4(b) is a defect in the route on the surface
  `live-marker-quality` owns, in the narrowing direction this RFC may not take.

  Verified sound and unchanged in this round: the consent separation and §2.1's normative
  rule, which `learner-rating` §10a.2 transposes and which §5.2d does not weaken — no
  classroom table is read on the assistance path at all; the five §4.1 revocation triggers
  and §4.1a; `RunService.evidence` being `requireRead` + `feedbackDeliveryOpen` with no
  role check; `share` and `distillationAccess` being host-only; every arm of
  `feedbackDisclosed` returning true on `outcome.reached`; `RUN_ROLES`, `LIVE_SESSION_KINDS`,
  the two `public_tokens` scopes; `live_sessions.run_id` being `UNIQUE`, which is what makes
  §5.2c's third conjunct a single-row lookup; and the refusal-code register — the widening
  emits no new code, because the routes it opens already return content.
- 2026-08-16: **third adversarial cross-review, by an agent that wrote neither the draft nor
  the two prior reviews, targeted at §5.2 and everything it touches** — the ~230 lines and
  six criteria the second cross-review never saw. **The consent model survives a third
  attack unchanged**, and §5.2's central design — put the reviewer on the host's arm rather
  than build a reviewer tier — survives as the right shape. Three defects were load-bearing:

  1. **A reviewer could see strictly more than the run's own host, and the equality
     criterion could not see it.** §5.1's `seatedInContest` had no time bound —
     *"the run has a `match_states` row and the principal is white or black"*. `match_states`
     is `PRIMARY KEY REFERENCES live_sessions(id) ON DELETE CASCADE` and a session is
     **closed, never deleted**, so the seat was permanent: on a finished native match the
     host-player was locked out of Maia, corpus, narration and evidence lighting **on their
     own game forever**, while a submission-granted teacher reading it was not. §Motivation's
     *"no viewer-specific surface at all"* and criterion 10c's deep-equality were both false
     on that run, and 10c's solo-pack fixture is exactly the case where every candidate
     implementation agrees. **Fixed in §5.1** by bounding the seat to `closed_at IS NULL`,
     which is what §5.1's own prose (*"for the duration of the contest"*) already said;
     criterion **10g** is new and pins both directions; 10c gains a second fixture; 10e's
     extended loop is required to range over the two sides independently and to be shown
     failing against the old predicate, because held equal it can never construct the
     pairing that occurs in production.
  2. **§5.2c's *"by construction, not by fixture edit"* is false and is withdrawn.** Its
     premise — *"every context `live-marker-quality`'s criterion 6 constructs is a
     live-session context"* — does not survive reading criterion 6: its first half is a
     `liveMarkers` unit test over `AssistanceContext` **object literals**, a layer with no
     sessions in it, and its second half reaches a spectator through a hand-minted
     `run_grants` row on a run that need never have had a session. The fixtures do stay
     green, by the **first** conjunct (`granted_via = 'submission'`, which that RFC never
     mints) — a fixture-convention guarantee of exactly the strength §5.1 already had.
     Criterion 11 is promoted from confirmatory to acceptance-blocking accordingly.
  3. **§5.3 cited an owner ruling that says the opposite of what it claimed — the
     `feedback-delivery` failure, repeated.** `live-marker-quality` §6.2's body records the
     2026-08-15 accepted cost as *"the marker leaves participants and spectators **entirely,
     on every run, permanently**"*. §5.2e's seventh row and criterion 10a **place that marker
     for a reviewing spectator**, so §5.2 was already crossing the ruling while §5.3 argued
     the RFC may not. §5.3 is rewritten: the review boundary moves on the authority of the
     *later* 2026-08-16 ruling; the **live** boundary has no ruling behind it and an author
     may not move it — a narrower claim and a true one. The edits owed to
     `live-marker-quality` go from **one word to three sentences**, the third being the
     ruling's own terms and therefore the owner's to confirm (Open question 1, Status).

  **Also landed:** §4.3's write table was wrong in two ways — its fourth run-creation insert
  was *"the live-run create path"*, which does not exist (`createLiveSession` inserts
  `'participant'`; the real fourth is **`createImportedRun`**), and **both promotion sites
  contain a fresh-grant `INSERT` as well as the `UPDATE` the table described**, leaving two
  writers on an unstated default inside the table built to prevent exactly that. Seven rows,
  twelve statements, plus the migration backfill named as outside; criterion **7a** counts
  *statements* rather than sites, because every miscount in three revisions had the same
  shape. `requireGuidanceDisclosure`'s shipped signature carries neither principal nor
  storage, so all four call sites change — and `guidance.test.ts`'s shipped source guard
  requires the literal `requireGuidanceDisclosure(` within 800 source characters of each of
  the four `evidencePacket(` sites. `client-surface-floor.test.ts` has **two** permission
  tests and §5.2c named one. Criterion 10a is unsatisfiable without a fixture carrying a
  qualifying `opponent.move_selected` event, and *"no code change"* is corrected to *"no
  change to `liveAdmitted`"* — `DrillScreen` must forward the prop and the viewer's own
  `markers` preference must be `"live"`. §5.2a states that conjunct two is **monotone**, so
  the rail is scoped to *"a run that has finished at least once"* rather than to a finished
  attempt (**Open question 10**). §5.2e's *"reopens"* becomes *"opens"*: `live_sessions.run_id`
  is `NOT NULL UNIQUE` and closed rows persist, so a run carries at most one session ever,
  and `liveSessionByRun` does not filter `closed_at`. §10's three stale rows are corrected —
  **D448–D450 are already landed** and the row instructing claude to land them would have
  minted duplicates; `rfc/README.md`'s row has been edited and three of the four staleness
  claims against it are themselves stale; **no `permittedAssistance` ownership pin exists**
  in that register, so the pin owed is a new entry. **One unnamed cross-draft collision:**
  `learner-rating` §5.2 refuses *"every server-routed assistance route for [a rated run's]
  whole lifetime"* with no role exception, voiding this rail on any rated submitted run, and
  its AC-5 pins byte-identity of a three-field `AssistanceContext` that will have five by the
  time it lands — **Open question 11**, that document's to resolve. Three ledger rows are
  reported for claude to land from **D451**.

  **Verified sound at the symbol in this round and unchanged:** `live_sessions.run_id` is
  `NOT NULL UNIQUE` at both DDL sites; `liveAdmitted`'s `human_divergence` arm is
  `permission.humanSplit === "free"`, so L4(b) really does deliver the seventh surface with
  no edit to `pivotal.ts`; `requireGuidanceDisclosure` really gates on
  `permission.humanSplit === "locked_off"` and really has four callers; the three conjuncts
  are each independently reachable, so criterion 10b can refuse on each; §4.3's divergence
  row is reachable and does measure something; `STORAGE_VERSION` is **23**,
  `DRILL_RUN_SCHEMA_VERSION` **0.17**, `DRILL_PACK_SCHEMA_VERSION` **0.27** with 0.28 taken
  and kept by `graduation-clearance`; `run_grants` is PK `(run_id, learner_id)`;
  both `design/05` quotations are verbatim at `:133` and `:137`; §2.1's normative rule and
  its transposition in `learner-rating` §10a.2 are intact and **strengthened** by §5.2d,
  which reads no classroom table on the assistance path at all; and §5.2b property 1 holds —
  the reviewer reaches the run's disclosure line and never passes it, because `deliveryOpen`
  remains a conjunct in every arm.
