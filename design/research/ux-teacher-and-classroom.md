# The coach's side — classrooms, assignments, mid-session coaching and the standing

**Question (owner, 2026-08-24):** *"we need to go from a user perspective per feature… what do
they expect, what do competitors do, PROPER UX."* Six UX dossiers landed in this wave; **the
teacher, classroom and academy surfaces got one mention and no pass.** This is that pass.

**Scope:** the coach's side — running a session, addressing a class, assigning work, reviewing
what comes back, and what the coach sees about the people they teach — plus its mirror, **the
learner who is in a classroom**: being watched, being helped, and not being embarrassed. Each
feature in three passes: what the user expects, what competitors do, what we should do.

**Status:** code arms `[V]` at HEAD `f95aed8b` (2026-08-24), read at source. Competitor arms
`[P]`, bounded by [[D1458]] — **no product in this corpus has ever been driven hands-on**, and
the two nearest competitors to this scope (Chess.com Classroom, Lichess Classes) have **no
teardown at all**. The recommended UX is `[M]` design argument over those two. Four owner
decisions are named and not made. Two intent-tier changes are named and not written (law 5).

**Not respecified here.** `rfc/archive/teacher-surface.md` is **accepted and implemented**
(2026-08-22, commit `24e3379`) and is the governing document; `rfc/learner-rating.md` §10a owns
the cohort standing. This dossier does not redesign either. It specifies **the user-facing half
neither of them wrote**, and reports where the shipped client falls short of what they already
decided.

---

## Verdict

**The coach's side is a complete permissions architecture with almost no user experience on top
of it, and the one question a coach actually asks — *who needs me?* — is the one question the
surface cannot answer, in both of its tenses.**

Six findings carry this document.

**1. The teacher's submission list does not name the learner.** `apps/web/src/App.svelte:1053`
renders each submitted run as `{readableDate(submission.submittedAt)} · access available` with a
*Review run* button — **no handle, no pack, no assignment.** `[V]` This is not only a render
omission: `AssignmentSubmission` (`apps/web/src/lib/api.ts:314`) carries `learnerId` and
`grantedLearnerIds` as **opaque ids and no handles**, and `ClassroomService.detail`
(`apps/server/src/classroom.ts:59-65`) flattens submissions across every assignment before adding
`access`. `[V]` A coach with twelve students sees twelve undifferentiated timestamps. **The
after-the-session question — *who did the work, and who did not* — is unanswerable from the
shipped surface**, and the second half of it (who has *not* submitted) has no representation at
all: there is no roster×assignment grid, only a flat list of the submissions that exist. The
client already holds the join — `classroomDetail.members` carries handles (`:1046`), and
`moveAuthorHandle` (`:633`) is the identical id→handle lookup already written for the live studio.
`[V]`

**2. The learner's consent card cannot name who is watching, and the RFC made that a
requirement.** `teacher-surface` §2.4 requires that the `/learn` assignment card *"names, in
words, every teacher who currently holds access to each submitted run"*. The shipped card
(`App.svelte:868`) renders *"Submitted <date> · access until <date>"* and a *Revoke teacher
access* button. `[V]` It names **nobody**. The payload cannot support it: `grantedLearnerIds` is
ids, and `AssignedPack` (`api.ts:316`) carries no member list to resolve them against. `[V]`
**A revoke button whose subject is unnamed is a consent control that does not disclose what it
consents to** — and this is the exact surface the RFC's whole §2 exists to protect.

**3. Mid-session, the wall shows what is on each board and never how long it has been there.**
`LiveBoardSummary` (`apps/server/src/live-types.ts:135-146`) carries `lastMoveAt` and the wall
render (`App.svelte:1059`) **drops it** `[V]`, showing instead position, kind, board control,
side to move, paused flag, seated handles, lease holder and ply count. The three facts that
answer *who is stuck* — time since last move, whose move it is, and whether the board is paused —
are all present in the payload or derivable from it, and **none of them is a judgement about
play quality**, which is what makes a needs-attention ordering law-8-clean. §5 draws that line
precisely, because it is one field away from being crossed.

**4. The single most important coaching gesture in a coached session has a route, a client
method, and no button.** `resolveProposal` (apply/decline a participant's proposed move) exists
in `DrillClientApi` (`api.ts:864`, `:1171`) and is **called from nowhere in `App.svelte`** `[V]`.
The proposals list renders `<li><code>{proposal.moveUci}</code> · {proposal.status}</li>` —
dropping `proposedBy`, which the type carries (`live-types.ts:53`) `[V]`. So in a class of
twelve, a coach sees a stack of anonymous UCI strings and cannot act on any of them. *"Yes,
let's play Anna's move"* is the academy session's reason to exist and it is not reachable.

**5. There is no text channel anywhere in the product.** `grep -c chat apps/web/src/App.svelte`
→ **0** `[V]`. A coach's only in-product voices are a drawn mark (attributed,
`markAttribution`, `:1067`), a 120-character vote prompt (host-only, and only inside a vote
window), and the assignment note (asynchronous, `assignments.note`). This may be a deliberate
posture — coaches run voice out-of-band on Discord or Zoom — but it is nowhere **stated**, and a
surface that offers *Members / Proposals / Vote / Possession journal* and no way to say a
sentence reads as broken rather than as scoped. **Named as owner decision D-C below rather than
called a defect.**

**6. The cross-learner privacy question is already answered correctly at RFC tier, and the
shipped component honours it — the residue is a read/publish asymmetry nobody has examined.**
`rfc/learner-rating.md` §10a transposes `teacher-surface` §2.1 verbatim: *"No code path may
derive a `standing_members` row from a `classroom_members` row alone"*, entries are
learner-created only, `show_record` defaults on and `show_rating` defaults **off**, ordering is
by game points and never by rating, and the unwitnessed-games limitation renders on the standing
and again at the publish confirmation. `CohortStanding.svelte` implements all of it `[V]` (§7).
**What nobody has examined is that a member who publishes nothing still reads everything**, and
that the *abandoned* count — the most reputationally loaded cell in the table — rides on the same
`show_record` toggle as W/D/L with no separate control. §7.3 is the finding.

---

## 1. Two users, and the three places their expectations collide

Everything below is `[M]` product argument grounded in the two `[V]` consent contracts
(`teacher-surface` §2.1, `learner-rating` §10a.2) and in `[P]` pedagogy evidence from
`titled-player-training.md`.

**What the coach expects.** A named group. A way to say *"everyone do pack C by Thursday."* A
place that answers *who has done it* without asking. During a session: N boards, and a cue for
which one to walk to. The ability to stop a learner mid-error and hand them the board back
afterwards. After a session: the learner's actual attempt, not a summary of it.

**What the learner in a classroom expects.** To know they are in one. To know exactly what their
teacher can see, and when it stops. To fail privately by default — the rehearsal loop only works
if being wrong is cheap, and `design/05-in-run-experience.md` is explicit that the product's
method is *"coaching you past the mistake that would have taught you"*. To not be the only name
on a list of people who have not done the homework.

**Collision 1 — the coach wants standing visibility; the learner consented to being addressed.**
This is `teacher-surface`'s founding argument and it is settled: enrolment grants the right to
*address*, only the learner's own act grants the right to *see* (§2.1). **The design consequence
the RFC did not draw is that the coach's legitimate question survives the refusal in a weaker
form.** *"Who has submitted"* is a fact about acts the learner performed inside the classroom,
not a fact mined from their private history — the RFC says so itself (*"every cell in it is an
act the learner performed… none is a judgement the product formed"*, §Motivation). So the
roster×assignment grid in §3.3 is **inside** the contract, and the flat unnamed list we ship is
not a privacy protection — it is an omission that protects nothing while costing the coach the
whole surface.

**Collision 2 — the coach wants to intervene; the product is silent by design.** `design/05`
§3a: *the default is silence*. Law 8: the product may not grade a move. So mid-session coaching
is a **human channel running over a deliberately mute product**, and the product's job is to
hand the coach cheap non-judgemental facts (whose move, how long, is the pack's authored
objective still reachable) rather than a verdict to relay. §5.

**Collision 3 — the coach wants a class culture; the learner does not want to be compared.** The
corpus is unusually clear that peer visibility is a *pedagogical* tool in strong hands —
Botvinnik's school had *"each student presented four games (including at least one loss); the
other students critiqued the analysis"* `[P]`
(`titled-player-training.md`) — and equally clear that it is a *product* hazard: R10's original
refusal cited *"a fantastic incentive for cheating"*, and Lichess4545 records **cheating
investigations affecting final standings in Seasons 7, 8 and 17** `[V]`
(`league-as-return-loop.md` §C1). The owner ruled on 2026-08-16 in favour of the bounded table.
§7 is the UX of living inside that ruling.

---

## 2. Feature — the classroom itself

### 2.1 What a user expects

A coach expects to create a group, name it, invite people by something they already know (a
handle, a link, an email), and see who has accepted. A learner expects an invitation that says
**who is inviting them, to what, and what it will let that person do** — an invitation to a
"classroom" in a chess app is ambiguous between *a place I practise* and *a place I am watched*,
and the difference is the entire product.

### 2.2 What competitors do — `[P]`, and the corpus is thin here by its own admission

- **Chess.com Classroom and ChessKid Classroom are name-drops with no teardown.**
  `broadcast-and-teacher-surfaces.md` §9 says so in its own words: *"Chess.com Classroom and
  ChessKid Classroom remain name-drops `[P]` with no teardown; if the teacher trigger fires, one
  grounded classroom teardown is the first thing owed."* `[P]` ChessKid's scale is recorded —
  *"classroom tools in 2000+ schools"* (`competitor-matrix.csv` row 47, `[V] desk (site)`) — and
  nothing about its flow is.
- **Lichess Classes does not appear anywhere in `design/research/`.** Zero hits `[V]` (grep over
  the corpus). Lichess coverage is Studies (*"loved as a teaching medium"* `[P]`) and Teams (only
  as the 4545 team page).
- **Chessido is the one grounded classroom product** (`competitor-matrix.csv` row 34, `[V] desk
  (site)`): *"Classroom board sync + academy ops"*, *"Homework analytics (score/accuracy/weak
  topics)"*, verdict *"Ops and puzzles; class board is broadcast, not consequence play; no branch
  runtime."* `[V] desk` Its love/hate cells are `not_found` — *"not positive evidence"*
  (`competitor-love-hate-sweep.md`) `[V]`.
- **Chessity** (row 46) ships *"teacher analytics"*; **Chessable** ships one clause — *"Classroom
  video-call tool for schools, up to 1000 students"* `[V]` homepage, with no assignment or
  progress detail documented anywhere in this repo.
- **The category verdict is the corpus's own** `[M]`: *"classroom tooling is scheduling-and-
  analytics ops… Both categories treat the board as read-only"*
  (`broadcast-and-teacher-surfaces.md` §5).

**The `[P]` load-bearing here, named:** everything above is vendor-page or snippet evidence. **No
claim in this dossier rests on a competitor's classroom flow, step count or screen layout**,
because no such evidence exists in this corpus at any confidence.

### 2.3 What we should do — `[M]`

**The classroom section explains itself in one sentence before it offers a control.** Today
`App.svelte:1032-1034` is `<h2>Classrooms</h2>` followed immediately by a name field and a
*Create* button `[V]` — the exact shape the owner named for casting (*"it's just a form you fill
in with ZERO info on what it is"*). The repo already enforces the harder version of this rule:
`expectDisabledControlsExplained()` **fails the build** when a disabled control carries no
rendered reason (`screens.test.ts:64`), and the `class="honest"` dialect appears 21 times in
`App.svelte` alone `[V]`. The clause that does not exist is *a surface being offered must say
what it is* — `ux-live-and-social.md` §9 proposes it for the live half; **the classroom section
is the second consumer of the same clause and should land under it, not beside it.**

The sentence has to carry the consent model, because the consent model is the product decision a
user is making when they click Create or Accept:

> **A classroom lets a teacher assign packs to you and schedule sessions. It does not let them
> see your runs — you hand over an attempt one at a time, and you can take it back.**

**The invitation is where this matters most.** Today an invited learner sees
`{classroom.memberRole} · {classroom.memberState}` and Accept/Decline buttons (`:1037-1038`)
`[V]` — role and state as raw enum words, no inviter, no explanation. The invitation should name
**who invited you**, **what they will be able to do**, and **what they will not**. The data is
present: `ClassroomMember.invitedBy` and `invitedAt` are on the type (`api.ts:312`) and
unrendered `[V]`.

**IA: the classroom does not belong on the Live route.** It is the first section of
`route.name === "live"`, under the heading *"Live / shared rehearsal — Rehearse with other
people"* (`App.svelte:1029-1032`) `[V]`. This contradicts the governing RFC's own central
argument in navigation while honouring it in schema: *"a classroom is **not a session**. It is
standing and asynchronous"* (`teacher-surface` §6). A coach's standing work — roster,
assignments, submissions — is asynchronous and is filed under the page for things happening now.
**Named as owner decision D-A** (§11), because moving it needs a route and a nav slot, both
intent-tier.

---

## 3. Feature — assigning work (the coach's side)

### 3.1 What a user expects

Pick a pack, say a sentence about it, set a date, send it. Then: **see who has done it.** The
second half is not analytics — it is the reason the first half exists. A coach who cannot see
who has done the work has been given a broadcast tool, not an assignment tool.

### 3.2 What competitors do — `[P]`

The only documented assignment loop in the corpus is Chessido's *"Homework analytics
(score/accuracy/weak topics)"* `[V] desk (site)` — i.e. **graded**, which is the shape we refuse
(`teacher-surface` §Out of scope: *"A submission is received, never marked"*). Chessity ships
*"teacher analytics"* and ChessKid *"parental reports"* `[V] desk (site)`. Chessable's nearest
scoping primitive is **Key moves** — *"up to two per variation mark a study window so students
drill only the segment between them"* `[V]`
(`chessable-movetrainer.md`) — which is the one adoptable idea in the category for us, since it
is *scope narrowing without grading*. The register's own posture row is explicit:
`capability-watch.json` `coach_classroom_ops` — *"Use roster/assignment/return operations around
shared run grants and grounded modules"*, `doNotCopy`: *"Do not let roster membership silently
grant run or progress access."* `[V] vendor site, handsOn: none`.

### 3.3 What we should do — `[M]`, and most of it is a render, not a design

**(a) The roster × assignment grid is the coach's home, and it is inside the consent contract.**
Rows are `classroomDetail.members` where `memberRole === "learner"` and `state === "active"`;
columns are open assignments; each cell is one of exactly four **acts**, never a judgement:

| cell | source | why it is admissible |
|---|---|---|
| *not submitted* | absence of an `AssignmentSubmission` row | the absence of an act, stated — `design/05:41` |
| *submitted <date>* | `submission.submittedAt` | the learner's own act |
| *withdrawn* | `submission.withdrawnAt` | the learner's own act |
| *access revoked or expired* | `submission.access`, already computed server-side (`classroom.ts:61-64`) | the learner's own act, or the clock |

**No cell is a mark, a score, a completion percentage or a verdict**, which is `teacher-surface`
§Out-of-scope satisfied by construction rather than by restraint. The grid needs **one payload
change** — a handle on the submission projection, or a `learnerId → handle` join the client
performs against `members` (which it already holds) — and **no new route, no new permission and
no widening of `/progress*`**.

**(b) Assignments render pack titles, not pack ids.** The assign form's dropdown shows
`pack.title` (`:1049`); the assignment list shows `assignment.packId` (`:1051`) and the learner's
card uses `packId` as its `<h3>` (`:865`) `[V]`. A coach assigns *"Rook endgames: the Lucena"*
and reads back `rook-lucena-v3`. `packs` is already loaded into the same component (`:304`).

**(c) Overdue does not exist.** `teacher-surface` §3.3 specifies *"An overdue assignment is
displayed as overdue and blocks nothing."* `grep -ni overdue apps/web/src packages/runtime/src
apps/server/src` → **zero hits** `[V]`. Advisory-and-visible is the whole point of a due date
that deliberately does not touch the `schedules` scheduler; today it is advisory and invisible.

**(d) The teacher note needs its attribution rendered on the coach's side too.** The learner's
card gets it right — `<blockquote>` with `<footer>— @{handle}, your teacher</footer>` (`:867`)
`[V]`, which is `design/05` §3-forms' *"a person's claim, not the product's — they need
attribution, not a rung"* honoured exactly. The classroom-side assignment list drops the note
entirely (`:1051`), so a coach cannot see what they told the class.

---

## 4. Feature — being assigned work (the learner's side)

### 4.1 What a user expects

To see it without hunting. To know who asked and by when. To start it in one click. To hand in a
*specific attempt* — and to understand, before handing it in, what the teacher will then be able
to see, and how to take it back.

### 4.2 What competitors do — `[P]`

Nothing in the corpus documents a student-side assignment inbox in any chess product. The nearest
grounded evidence about how a return ritual should feel is Chess.com's post-game funnel —
*"one continuous, ritualized path from the game-over modal to coached retry; nothing in the field
matches its completeness"* `[V]` primary-source, no hands-on (`competitor-play-ux.md`) — and
`adoption-audit.md`'s top cheap adoption is the auto-offered post-game review. **The transposition
for us is that submission should be offered at the moment the run ends, not only from an inbox.**

### 4.3 What we should do — `[M]`

The `/learn` → **Assigned** section ships and is placed correctly (`App.svelte:859-877`, above
the return queue) `[V]`. Four repairs, all on the same card:

**(a) Name the teachers who hold access.** Finding 2. This is the §2.4 requirement, and it needs
handles on the payload — `grantedLearnerIds` resolved server-side, or the teacher list carried on
`AssignedPack`. The revoke control stays exactly where it is; it simply acquires a subject.
**Copy must not imply that revocation is an undo** — `teacher-surface` §4.1 is explicit that
*"What revocation guarantees is that future reads stop — never that what was read is forgotten"*,
and *"Revoke teacher access"* on its own reads like an erase.

**(b) Say what handing in *means*, at the moment of handing in.** Today submission is N bare
buttons — `{#each runs.filter(…host) as run}<button>Submit {run.title}</button>` (`:872-873`)
`[V]` — one per matching attempt, unbounded, undated, unordered, and with no statement of
consequence. The shipped standing already models the right gesture: `CohortStanding.svelte`
requires a **confirmation step** that restates the limitation and the defaults before publishing
(`:91-97`) `[V]`. Submission is the same class of act — a consent to be read — and deserves the
same confirmation: *"@coach and @assistant will be able to open this attempt and everything you
opened during it, until <date>. You can revoke at any time."*

**The third clause of that sentence is the one nobody has told a learner.** `teacher-surface`
§2.3(3) establishes that `evidence.attached`, `feedback.revealed` and `group.created` are
ordinary run events served to every reader of the run, so *"a granted teacher can therefore see
that this learner asked for Maia at move 12 and staged Stockfish at move 20"* — and the RFC's own
judgement is that *"stating it is cheaper than having a learner discover it"* `[V]`. It is stated
in the RFC and **rendered nowhere** `[V]`. For the learner in §1 who is afraid of being
embarrassed, *how much help I asked for* is more sensitive than the moves, and it is the one
thing the interface is currently silent about.

**(c) Offer submission from the run's end, not only from the inbox.** When a run of an assigned
pack reaches `outcome.reached`, the after-the-run surface should carry the hand-in. This is the
Chess.com funnel transposition `[P]→[M]`, and it costs one conditional on an already-loaded list.

**(d) Overdue, per §3.3(c), is a learner-side render before it is a coach-side one.**

---

## 5. Mid-session — what a coach sees, and what they may do about it

> **Owner question 1, answered here.**

### 5.1 What ships, exactly — `[V]`

**Across boards (the simul wall, `GET /sessions` → `LiveSessionSummary.board`,
`App.svelte:1059`):** a mini board at `board.activeFen`, the title, `kind · boardControl ·
sideToMove` plus a *paused* flag, seated players' handles where `board.players` exists, the lease
holder's handle, ply count, and an *Open* button. `lastMoveAt` is in the payload and **is not
rendered**. Ordering is the server's list order — `listLiveSessions` sorts on
`COALESCE(scheduled_for, created_at)` (`teacher-surface` §3.5) — i.e. **creation order**.

**Inside one session (the studio, `App.svelte:1067`, one minified source line):** *Members* (lease
holder, then every grant as `@handle — role`), *Offer board* (host only, with an `class="honest"`
reason when unavailable), *Move authorship* (`Move N · @handle`, resolved through
`moveAuthorHandle`), *Board marks* (an attribution line, with the marks themselves painted on the
board via `relayedMarkShapes`), *Proposals* (a propose box for non-spectators; a list of
`moveUci · status`), *Vote* (host-only editor, 2–8 options, 15–600 s, tally plus attribution),
and the *Possession journal*. Plus `Reveal` (`api.reveal`, `:361`, `:386`) and the match
pause/resume operations.

**What the coach is refused mid-session, by construction:** the Maia human-model split, the
opening-explorer corpus, and every narration of a number — `permittedAssistance`'s third conjunct
refuses `reviewing` while a live session is open (`teacher-surface` §5.3) — and, in an academy
session, `support` and `analysis` presets plus `blunder_prevention` and `full_inspector`
(`packages/runtime/src/presets.ts:47`: `allowedPresets: ["quiet","guided","theory_only"],
moduleCeiling: except("blunder_prevention","full_inspector")`) `[V]`. Also refused permanently:
any per-learner history, due queue, metrics or milestones — all seven `/progress*` routes are
principal-only.

### 5.2 What competitors do — `[P]`

Chessido treats *"synchronized class boards, homework and academy operations as a coherent
workflow"* and its class board is *"broadcast, not consequence play"* `[V] desk`. Chess vs Chat
is the corpus's only live vote product and is *"entertainment only"* `[V] desk (Steam listing)`.
The sweep's closing sentence is the differentiator: *"Nobody ships host-side rewind / branch /
teach semantics; chat-vote entertainment is the whole category"* `[P]`
(quoted in `broadcast-and-teacher-surfaces.md` §5). **We ship the half nobody has, and the studio
does not say so** — the same finding `ux-live-and-social.md` made for casting, reaching the
academy surface by the same route.

### 5.3 The answer — `[M]`, and the law-8 line is one field wide

**What a coach sees mid-session should be: the position, whose move it is, how long it has been
their move, and whether they are stuck on the pack's own authored objective. Nothing else.**

The wall's job is triage. The three facts that perform it are already shipped or free:

1. **Time since `lastMoveAt`** — in the payload, unrendered. A rules fact about a clock.
2. **`sideToMove` matched against `board.players`** — it is *this learner's* move. A rules fact.
3. **`board.pausedAt`** — a session fact.

**A wall sorted on those three is law-8 clean, and a wall sorted on anything else is not.** The
tempting fourth signal — evaluation, "accuracy", a struggling score, a Maia agreement rate — is
the named anti-pattern (*"Stockfish: +0.54 / Maia: 31% / LLM: 'Ne5 centralizes the knight'"* is a
dashboard, not a drill), and it is worse here than in solo play because the number would be
**about a person, shown to a different person**. The rule to write down: **the wall may order by
elapsed time and never by evaluation.** "Waiting 4 minutes" is a fact about a clock; "struggling"
is a verdict about a player, and the product does not form verdicts about players even for their
coach.

**One further signal is admissible and is the best one available**, because it is authored rather
than computed: the run's `objectiveState` — already rendered in the overlay (`App.svelte:1075`,
`<h1>{node.objectiveState}</h1>`) and derived from the pack author's own claim, not from an
engine `[V]`. *"Objective: hold the draw — no longer reachable"* is an author's statement about a
position, which is exactly the class of claim law 8 permits. It belongs on each wall card.

**What a coach may *do* about it — the shipped ladder, in ascending intrusiveness:**

| gesture | shipped? | what it costs the learner |
|---|---|---|
| watch | `[V]` yes | nothing — but see §5.4 |
| draw a mark | `[V]` yes (`drawable: { enabled: true }`, `Chessboard.svelte:134`; relayed with `markAttribution`) | a person's claim, attributed, no rung — `design/05:199`. **Note: `design/05:199`'s parenthetical *"Shipped-off today: `drawable: { enabled: false }`"* is stale at HEAD** |
| open a vote | `[V]` yes, host-only | frames the choice — the strongest pre-commitment nudge in the product |
| offer the board | `[V]` yes, host-only | hands over authorship; possession journal records it |
| reveal | `[V]` yes, under the host lease | opens the pack's authored prose to the room; irreversible for that scope |
| apply a proposal | **`[V]` NO — route and client method exist, no UI** (finding 4) | commits someone else's move on the shared run |
| say a sentence | **`[V]` NO — no chat anywhere** (finding 5) | — |
| take over the board | `[V]` yes, `reclaim` | this is the intervention that ends the learning |

**The pedagogical rule this ladder needs, and does not state: the intervention that is cheapest
for the coach is the most expensive for the learner.** Taking the board is one click and destroys
the attempt-in-progress as a learning object; drawing a mark is three clicks and destroys nothing.
`design/05`'s own framing is that the product exists to stop *"coaching you past the mistake that
would have taught you"* — and a coach with a `reclaim` button is precisely the mechanism for
doing that. The UI should be ordered against the coach's convenience: marks and reveal at hand,
`reclaim` behind a confirmation that says what it does (*"You will take the board. @student's
current line stays in the branch rail"* — which is true, because an attempt is never destroyed).

**And the shipped studio does not know it is a lesson.** It is generic across
`stream | academy | match`: the roster region is headed *Members*, participants are listed as
`@handle — spectator`, and **the classroom that owns the session is never named** even though
`live_sessions.classroom_id` ships for exactly this (`teacher-surface` §3.5) `[V]`. A pack night
created from the classroom picker (`App.svelte:1058`) loses its classroom identity the moment it
opens. One join, already available server-side.

### 5.4 Watching is not passive, and the learner must be able to see it

`teacher-surface` §2.4 makes this a requirement and `broadcast-and-teacher-surfaces.md` §4.3
calls it *"the teacher surface's sharpest honesty defect"* `[V]`. In the studio, the grants list
`{#each liveDetail.grants as grant}<li>@{grant.handle} — {grant.role}</li>` renders for every
role including spectators `[V]` — so a participant on desktop **can** see who is in the room. The
RFC's own resolution for compact viewports is that the answer must be carried by the `/learn`
card instead, since the floor leaves three regions and no Session tab (§2.4) — and that card is
the one that names nobody (finding 2). **The desktop half holds; the phone half does not, and it
is the phone half the RFC promised.**

---

## 6. After the session — the review rail

### 6.1 What a user expects

A coach expects to open the attempt and see what the learner saw, at full strength, without a
second tool. A learner expects the review to be *of the attempt they handed over*, bounded, and
over when it is over.

### 6.2 What we ship — `[V]`, and this part is genuinely finished

`teacher-surface` §5.2 gives the reviewing teacher **the run host's own assistance table** — the
same one, not a reviewer's variant — on a terminal, disclosed run with no live session open:
`/human-split`, `/corpus`, `/voice`, `/speech`, `/reasoning-review`, and `boardLighting`/`arrows`
at `"evidence"` (§5.2e). The design commitment is the one worth preserving in any UX pass: *"A
rail that differs by viewer is a review screen in embryo whichever direction it differs in"*, so
**there is no teacher review screen and must not be one** — the coach reaches the shipped run
view from a submission row (`App.svelte:1053`) and uses the learner's components.

**The two UX consequences of that architecture are unrendered.** §5.2e names both:

1. **The rail closes if the learner opens the run live — once, and never again.** A coach
   mid-review can lose Maia, corpus and narration with no warning and no explanation.
2. **A hand-minted spectator grant confers nothing.** A learner who shares a run through
   `POST /runs/:id/grants` gives read access, *not* the review rail — *"a real asymmetry between
   two learner acts that look similar"*, deliberate, and invisible in the interface.

`design/05:41` governs both: **absence is stated, never simulated.** The rail must say *"the
human-model split is closed because this run has a live session open"* and *"…because this
attempt was shared rather than submitted"*, not render a control that refuses. The RFC says so
(§7.2); nothing renders it.

---

## 7. The classroom standing — the cross-learner privacy pass

> The brief's sharp question. **Answer: the contract is right, the component honours it, and the
> unexamined residue is asymmetry and one bundled column — not the table itself.**

### 7.1 What is decided, and by whom — `[V]`

`rfc/learner-rating.md` §8 R10 originally refused *"Leaderboards and cross-learner comparison of
any kind"*. **The owner reversed it on 2026-08-16** — *"add leaderboards and cross-learner
comparison… maybe local chess clubs want to use us"* — and the reversal is bounded, not
open-ended. R10 now refuses three things: **(a)** any standing spanning more than one classroom,
global or otherwise; **(b)** the rating as a rank, sort key, seed, section boundary or tiebreak;
**(c)** any entry the learner did not publish by their own act, *"including one derived from
`classroom_members` alone"*.

`league-as-return-loop.md` §C1 is the dossier that forced the ruling and **it is superseded as a
statement of current policy** — a reader citing its refusal today is citing a state that ended.
Its evidence survives intact: Lichess4545's cheating investigations altering standings in three
seasons `[V]`, and the honour-roll alternative (*"a result in season N marks your name in every
future season's table"*, no number, no ordering) `[V]` which the ruling adopted as **layer 1**.

### 7.2 What the shipped component does — `[V]`, and it is faithful

`apps/web/src/lib/CohortStanding.svelte`, mounted from the classroom detail for any member
(`App.svelte:1052`):

- **Entries are self-created only.** `{ op: "publish" }` acts on the caller; there is no handle
  parameter on any op (`api.ts:855-860`) — R10(c) enforced by the absence of the argument.
- **A confirmation precedes publishing** (`:91-97`), restating `view.limitation` and the defaults
  — §10a.5's site 2, met.
- **The unwitnessed-games limitation renders permanently on the standing** (`:87`,
  `<p class="limitation">`, styled with a warning rule) — site 1, met.
- **`show_record` on, `show_rating` off**, each independently toggleable, plus *Withdraw* with no
  teacher veto (`:102-106`).
- **A teacher may open, re-window and close a standing and may not enter anyone into it**
  (`:78-85`, `:120-122`) — `teacher-surface` §2.1's asymmetry preserved.
- **Ordering comes from the server**; the client derives no rank and prints no position number.
- **No evaluative copy anywhere** — R16 held; the only prose is the limitation and the
  confirmation.

**Three UX faults, all small, none doctrinal:**

1. **The rating cell prints an interval with no value when `pointEstimate` is absent** (`:116`:
   `{entry.rating.pointEstimate ? \`Band ${…}\` : ""}` followed unconditionally by
   `<small>Interval …</small>`). §10a.3 requires that *"A member whose §7.2 state withholds a
   point estimate has no rating cell — not a blank, not 'provisional', not a dash that sorts:
   the field is absent."* If the server ever emits `rating` without `pointEstimate`, this renders
   the blank the spec names. Worth an assertion rather than an argument.
2. **The table is `min-width: 48rem` inside `overflow-x: auto`** (`:138-139`), so on a phone the
   standing scrolls sideways and the own-row tint (`tr.self`) is the only wayfinding — the same
   compact-viewport problem `client-surface-floor` was written for. A learner's own row should be
   reachable without horizontal hunting.
3. **The *Join this standing* button precedes any statement of what a standing is** (`:99`) —
   §2.3's missing clause again. The confirmation explains it *after* the user has committed to
   asking.

### 7.3 What nobody examined — `[M]`, and this is the finding

**(a) Reading is free; publishing is a choice. Nobody decided that.** `cohortStanding(classroomId)`
is available to any member (`App.svelte:1052` gates only on `learner` being defined and passes
`membership.memberRole`) `[V]`. So a learner who publishes nothing still sees every published
record. That is defensible — the entries are consented, and a member who could not read could not
make an informed choice about joining — but it produces the social gradient the ruling's own
rationale was worried about: **the visible population is the population that opted in, so the
table reads as "everyone who is doing well", and declining is itself legible.** The corpus's one
relevant precedent points the other way: Chess.com Leagues *"can never go back down once you
advance"* `[V]` — the category's answer to visible failure is to remove the downside, not the
visibility. **Named as owner decision D-B**, with the cheap middle option stated: a standing
could render its own denominator (*"6 of 14 members have published"*), which makes the selection
bias visible instead of hiding it, and is a count rather than a judgement.

**(b) `abandoned` rides on `show_record` and is the wrong bedfellow for W/D/L.** The table's
Record cell renders `{wins}–{draws}–{losses}` plus `{games} games · {abandoned} abandoned`
(`:114`) `[V]`, all gated by one toggle. W/D/L is a chess result; **abandonment is a conduct
signal**, and it is the cell a learner will most want to withhold and least expect to have
published by a control labelled *"Show my record"*. §7.4 obligation 3 requires the abandonment
count to survive the surface getting wider — it does not require it to share a switch. **The
minimal correct fix is a third toggle**, matching the layer structure the spec already uses.

**(c) The mark's tooltip is doing the honesty work that should be in the cell.** Marks render as
band-number pills with the fact in a `title` attribute — `Beat band 2200 on <date>` (`:113`)
`[V]`. §10a.3's constraint (a) is that *"A mark names the event, never a level: 'beat band 2200
on 2026-09-01', never 'reached 2200'"*. A pill reading **2200** next to a learner's handle, with
the verb only on hover, is read as a level by every user who never hovers — and on touch, nobody
hovers. The visible glyph should carry the verb.

**(d) The standing is the one place a coach sees learners compared, and the coach cannot
publish.** A teacher is not entered by default (§10a.2) and there is no teacher row. This is
correct and worth stating in the copy: **the coach is not in the table**, which is the difference
between a class record and a scoreboard the teacher tops.

---

## 8. What a coached session feels like — the academy ceiling

`presets.ts:47` is the whole answer and it shipped 2026-08-22: academy admits
`quiet | guided | theory_only`, defaults to `guided`, and puts `blunder_prevention` and
`full_inspector` off the ceiling, with the stated reason *"the coach relays; the participant's own
inspector waits for the review surface"* (`rfc/intent-presets.md:148`) `[V]`. **Support and
Analyze are refused** — which contradicts the O11 handoff's point 3 and is the memo's fork A,
still unruled (`planning/platform-alignment/o11-decision-memo.md` §6). The memo recommends A1
(confirm as shipped) and states plainly that *"Evidence does not discriminate — this is a taste
call about what a coached session feels like."*

**From the user's side there is a discriminator the memo did not have, and it favours A1** `[M]`:
in a `host_directed` academy session there is **one board and many people**, and an inspector open
on a participant's screen is a private channel running underneath the lesson. It is the classroom
equivalent of a phone under the desk. Between the coach relaying and twelve people each reading
their own engine, only the first is a lesson. A2's cost is not the grid change; it is that the
coach loses the room.

**One live defect the memo flagged and nobody has ledgered as a UX fact:** the two default layers
disagree — `presets.ts:47` gives academy `defaultPreset: "guided"` while
`assistance-preference.ts:12` gives `PROFILE_DEFAULTS.academy = SILENT_ASSISTANCE` `[V]`
(re-verified at HEAD). **A coached session therefore opens guided-and-silent simultaneously**, and
the user-visible consequence is that a learner in their first academy session sees a mode label
promising pattern naming and gets nothing, which is `design/05:41` violated by disagreement rather
than by omission.

---

## 9. Is the deferred operator account redundant against the shipped teacher surface?

> **Owner question 2, answered concretely so no lane is opened for something we have.**

**Answer: the operator *account* is redundant — and doctrinally refused twice over — but the
tournament-director *capability* is not. Two objects are genuinely missing, and one of them
collides with a standing refusal. Open a lane for the objects, never for the account.**

**Why the account is redundant.** [[D1416]] converts `rfc/social-play.md` §8 refusals 5 and 6
into post-1.0 deferrals and asks whether refusal 6 overlaps the Teacher surface. It does, and the
overlap was already named before the Teacher surface existed: `league-as-return-loop.md` §C5
states that of the two shapes surviving the no-privileged-user ruling, **(b) organiser capability
is per-league and delegated, so a league creator is privileged inside their own league and
nowhere else — the same shape as the shipped run-grant model, and not a platform operator
account** `[V]`. That shape is now shipped, twice:

| what a director needs | shipped as | where |
|---|---|---|
| a bounded population | `classrooms` + `classroom_members`, invite-and-accept, symmetric exit | `teacher-surface` §3.2 |
| authority scoped to that population and nowhere else | `member_role = 'teacher'`, per classroom, revocable by either side | §3.2, §4.2 |
| addressing the population | `assignments`, pack-pointer + note + advisory date | §3.3 |
| a calendar | `live_sessions.classroom_id` + `scheduled_for` | §3.5 |
| a results table | `cohort_standings` / `standing_members`, learner-published | `learner-rating` §10a |
| seating two named humans at one board | `matchPlayers: {white, black}` at session creation | `App.svelte:1058` `[V]` |

**Two things are genuinely absent, and they are objects, not an account:**

1. **A round / pairing aggregate.** An assignment addresses a *pack*; nothing addresses an
   *opponent*. A teacher can hand-seat one match at a time and there is no object that says
   "round 3: these six pairings, by Sunday." This is the real post-1.0 lane and it is
   classroom-scoped, so it needs no new principal.
2. **A declared result** — forfeit, default, adjudicated draw. This is the director's defining
   power (`league-as-return-loop.md` §1.2 records 4545 moderators *"awarding draws versus
   forfeits… adjudicating forfeit appeals"* `[V]`) and **it collides with two shipped refusals**:
   `teacher-surface`'s *"A submission is received, never marked"*, and §10a's *"Every cell is
   `attempts.result` counted — nothing derived, nothing estimated."* A director who cannot declare
   a result is not a director; a product where a human can declare a result has a person's
   judgement inside the record. **That is an owner ruling, not a design choice, and it is the one
   thing an operator lane would actually be buying.**

**And the account form is refused on its own terms, independent of redundancy.**
`design/02-product-shape.md:98-99`: *"**No operator account exists (owner ruling 2026-08-12/14).**
Administrative capability lives in environment and configuration, never a privileged user"* `[V]`.
[[D1416]] deferred *the feature*; it did not reverse *the account model*, and §10 below shows the
Teacher surface satisfies the account model rather than excepting itself from it.

**Concrete recommendation for the owner:** close the operator-account half of [[D1416]] as
**redundant with a citation** rather than giving it a home, and re-home the deferral as
*"classroom rounds and pairings (post-1.0), plus an owner ruling on whether a result may ever be
declared rather than played."* The bot-tournament and league halves of [[D1416]] are untouched by
this finding.

---

## 10. "Never a privileged user" — reconciled with a teacher's authority

`design/02:98-99` is about **the operator account**, not about teachers, and the Teacher surface
satisfies it rather than needing an exception `[M]` over `[V]` code:

- **A teacher is an ordinary learner principal.** Every classroom route takes `authenticate()` and
  resolves to that principal; `member_role` is a **relation** (a column on
  `classroom_members`) and not a property of the account. `RUN_ROLES` stays three members and no
  fourth `RunRole` exists (`teacher-surface` §3.2) `[V]`.
- **Every extra thing a teacher can reach was created by somebody else's act.** A
  `classroom_members` row requires the invitee's acceptance; a `run_grants` row is minted by the
  learner's submission; a `standing_members` row is created by the learner alone. A teacher with
  an empty classroom can do nothing to anyone.
- **The authority is symmetrically exitable** (§4.2) — a teacher cannot trap a learner, and a
  learner leaving needs no cooperation. A privileged user is one you cannot leave.
- **The authority is bounded to one classroom.** There is no cross-classroom read, no global
  view, and R10(a) refuses any standing that spans two.

**The sentence to add to intent, if the owner wants it stated rather than inferred** `[M]`:
*"A teacher is not a privileged user. Teaching authority is a relation between two accounts,
created by both of them, bounded to one classroom, and endable by either side."* That is a
`design/02` amendment and law 5 makes it the owner's — named in §11 as **D-D**, not written.

---

## 11. Intent-tier changes and owner decisions — named, not made (law 5)

**Intent changes required (`design/03`, `design/05` — not edited by this dossier):**

- **`design/03` §Live and community, the *"Arena and events"* row.** It lists *"scheduled pack
  nights, invitations, cohorts, two-leg position matches, team relays"* under a B5 gate row
  reading *shipped 2026-08-13*. Cohorts and the pack-night atom shipped in `teacher-surface`;
  **team relays did not**. `teacher-surface` §8.1 already reported this and correctly declined to
  fix it. It is still unfixed at HEAD `[V]`, and the row now also fails to mention the classroom,
  the assignment or the standing — three shipped surfaces with no intent-tier description at all.
- **`design/05:199`, the board-overlay row**, carries the parenthetical *"Shipped-off today:
  `drawable: { enabled: false }`"*. At HEAD `Chessboard.svelte:134` sets `enabled: true` and marks
  relay with attribution `[V]`. The ruling is unaffected; the shipped-state note is stale, and it
  is the note a reader uses to decide whether the coach's core communication tool exists.

**Owner decisions (four):**

- **D-A — where the classroom lives.** Today it is the first section of the Live route. A
  classroom is standing and asynchronous by its own RFC's argument; Live is the page for things
  happening now. Options: leave it (cheapest, and the coach's live and standing work sit
  together); give classrooms their own route (honest, costs a nav slot); or split — roster and
  assignments under Learn, pack nights under Live (most honest, most work, and it separates two
  things a coach does in one sitting).
- **D-B — read-without-publish on the standing.** Should a member who has published no entry see
  the standing? Options: yes (shipped, and informed consent arguably requires it); yes with the
  denominator rendered (*"6 of 14 members have published"* — makes the selection visible as a
  count, not a judgement); or no. This was never put to anyone; the 2026-08-16 ruling settled
  *whether the table exists*, not *who reads it*.
- **D-C — is the absence of a text channel a posture or a gap?** There is no chat anywhere in the
  product `[V]`. If coaching voice is deliberately out-of-band, the studio should say so once
  (*"Tabiya carries the board, not the conversation"*) rather than leaving a room with no way to
  speak in it. If it is a gap, it is a real feature with moderation consequences and belongs in a
  lane.
- **D-D — state the teacher/privileged-user reconciliation in `design/02`** (§10), or leave it
  inferred.

**One already-open decision this dossier bears on:** O11 **fork A** (academy's ceiling). §8 adds
a user-side argument for A1 that the decision memo did not have.

---

## 12. Proposed ledger rows — report only, unnumbered per [[D1130]]

**Head was D1478 at drafting; assign at landing.**

`design/BACKLOG.md` is not edited by this dossier.

1. 🐞 **The teacher's submission list names no learner, and the payload cannot.**
   `App.svelte:1053` renders date + access status only; `AssignmentSubmission` carries opaque ids
   (`api.ts:314`) and `ClassroomService.detail` flattens across assignments
   (`classroom.ts:59-65`). A coach cannot tell whose run they are opening or who has not
   submitted. The client already holds the join (`members`, and `moveAuthorHandle:633` is the
   same lookup). Fix: handle on the projection or a client-side join, plus the roster×assignment
   grid of §3.3(a).
2. 🐞 **`teacher-surface` §2.4 is unmet on the learner side: the `/learn` card names no teacher.**
   The RFC requires the card to name *"in words, every teacher who currently holds access"*;
   `App.svelte:868` renders an expiry and an unnamed revoke button, and `AssignedPack` has no
   handles to render. A consent control whose subject is unnamed.
3. 🐞 **`resolveProposal` has a route and a client method and no UI**, and the proposals list
   drops `proposedBy` (`live-types.ts:53`). Applying or declining a participant's proposed move —
   the academy session's central gesture — is unreachable.
4. 💡 **The simul wall drops `lastMoveAt` and sorts by creation order.** The wall answers *what is
   on each board* and not *who needs me*. Fix: render elapsed-since-last-move, mark the learner's
   own turn, surface `objectiveState`, order on those. **With the law-8 fence written into the row:
   order by elapsed time, never by evaluation.**
5. 🐞 **Overdue does not exist.** `teacher-surface` §3.3 specifies an overdue rendering that
   blocks nothing; zero hits for *overdue* across `apps/web/src`, `packages/runtime/src`,
   `apps/server/src`.
6. 🐞 **Assignments render pack ids, not titles** — `App.svelte:865` (learner card `<h3>`) and
   `:1051` (classroom list), while the assign form's own dropdown uses `pack.title` at `:1049`.
7. 🐞 **Academy's two default layers disagree** — `presets.ts:47` `defaultPreset: "guided"` vs
   `assistance-preference.ts:12` `PROFILE_DEFAULTS.academy = SILENT_ASSISTANCE`. Flagged in the
   O11 memo §4.1 as owed to F5; recorded here as the user-visible consequence (a guided session
   that says nothing).
8. 💡 **The classroom and standing surfaces need the `ux-live-and-social.md` §9 explanation
   clause**, not a second one. `<h2>Classrooms</h2>` → create form with no statement of what a
   classroom is or what enrolment does or does not authorise; *Join this standing* offered before
   the standing is explained.
9. 💡 **Submission needs a confirmation, and it must state the evidence-events consequence.**
   `CohortStanding`'s publish confirmation is the shipped model. `teacher-surface` §2.3(3)
   establishes that a granted teacher sees which rungs the learner opened, and judges that
   *"stating it is cheaper than having a learner discover it"* — it is stated in the RFC and
   rendered nowhere.
10. 💡 **The standing's `abandoned` count should not share a toggle with W/D/L.** A conduct signal
    on a control labelled *"Show my record"*.
11. 🐞 **The standing's mark pill carries the level and hides the verb.** `:113` renders the band
    number as the glyph with *"Beat band N on <date>"* in a `title` — invisible on touch. §10a.3
    constraint (a) requires the event, not the level.
12. 💡 **The review rail's two closures are unrendered** — a live session opening on a submitted
    run (once, irreversibly) and the share-vs-submit asymmetry. `design/05:41` and
    `teacher-surface` §7.2 both require the rail to state the closure rather than refuse a
    control.
13. 💡 **The live studio never names the classroom that owns the session.**
    `live_sessions.classroom_id` ships (`teacher-surface` §3.5) and the studio is generic across
    all three kinds; a pack night loses its identity on opening.
14. 📊 **[[D1416]]: the operator account is redundant against the shipped Teacher surface; the
    tournament-director capability is not.** §9. Two objects are missing — a round/pairing
    aggregate and a declared result — and the second collides with *"received, never marked"* and
    with §10a's counts-only rule. Recommend closing the account half with a citation and
    re-homing the deferral as the two objects plus one owner ruling.
15. 📊 **`design/03` §Live's *"Arena and events"* row is stale in both directions** — it claims
    team relays that did not ship and omits classrooms, assignments and the standing that did.
    Reported by `teacher-surface` §8.1 in August and still unfixed. Owner tier.
16. 📊 **`design/05:199`'s shipped-state parenthetical is stale** — `drawable` is `enabled: true`
    at HEAD; the coach's core communication tool ships. Ruling unaffected. Owner tier.
17. 📊 **`league-as-return-loop.md` §C1 is superseded as policy** by the 2026-08-16 R10 reversal
    and reads as current. Anyone citing its leaderboard refusal today cites a state that ended;
    its cheating and honour-roll evidence survives. A pointer line is owed on that dossier.
18. 🐞 **Chess.com Classroom and Lichess Classes have no teardown**, and they are the two nearest
    competitors to a shipped surface. `broadcast-and-teacher-surfaces.md` §9 owed one in August
    (*"if the teacher trigger fires, one grounded classroom teardown is the first thing owed"*);
    the trigger fired, the surface shipped, and the teardown never happened. Under [[D1458]] it
    would be desk-grade anyway — **this is the strongest candidate in the wave for the first
    genuinely hands-on competitor pass.**

---

## 13. Where this dossier relies on `[P]`, named rather than buried

Per [[D1458]], every competitor claim in this repo means *we read the vendor page or the source*,
never *we used it*. This dossier's competitor arm is weaker than that baseline in one specific
place and it should not be papered over:

- **Chess.com Classroom, ChessKid Classroom, Chessity, Chess.Run and ChessPlay.io are `[P]`
  name-drops with no feature detail anywhere in the corpus.** No assignment flow, no
  student-progress visibility, no peer-visibility claim exists for any of them at any confidence.
- **Lichess Classes returns zero hits** across `design/research/`.
- **Chessido** (`[V] desk (site)`) is the only grounded classroom product, and its love/hate cells
  are explicitly `not_found` — *"not positive evidence"*.
- **Chessable's classroom** is one homepage clause `[V]`.
- **The peer-critique pedagogy in §1** (Botvinnik's school, Dvoretsky's endgame blitz, ChessDojo
  cohorts) is `[P]` throughout in `titled-player-training.md`, one item of which returned 403 to
  direct fetch and rests on a search snapshot.

**Consequently: no recommendation in §§2–8 rests on a competitor's classroom flow, screen layout
or step count.** The recommendations rest on (a) shipped code read at HEAD `[V]`, (b) two accepted
contracts this repo authored `[V]`, and (c) `[M]` argument from the two users' expectations. Where
a competitor is cited it is as a **precedent that a thing is possible or a category norm** —
Chess.com Leagues removing the downside of a visible table `[V]`, Lichess4545's honour-roll
shading `[V]`, Chessable's Key moves `[V]` — never as a design to copy.

**Also not established here:** nothing was exercised in a browser. No two-account classroom was
created, no assignment was submitted, no standing was published, and no academy session was run
with a second human. Every behavioural claim is read from source. A single hands-on pass with two
accounts would likely find more than this dossier did, and would settle §7.3(a) — whether a
half-published standing reads as a class record or as a scoreboard — by observation instead of
argument.

---

## 14. Provenance

Read in full at HEAD `f95aed8b`: `rfc/archive/teacher-surface.md` (§§Summary–8, 5.2a–5.3, 6, 7,
10), `rfc/learner-rating.md` §§8/10a, `planning/platform-alignment/o11-decision-memo.md`,
`apps/web/src/lib/CohortStanding.svelte`, `apps/server/src/classroom.ts` `detail`,
`apps/server/src/live-types.ts`, `design/research/league-as-return-loop.md` §§6–7,
`design/research/README.md` §House rules. Read in part: `apps/web/src/App.svelte` (routes `live`,
`learn`, the live studio at `:1067`, the wall at `:1059`), `apps/web/src/lib/api.ts` (classroom,
assignment and standing types and methods), `packages/runtime/src/presets.ts`,
`apps/web/src/lib/assistance-preference.ts`, `packages/runtime/src/types.ts`
(`LIVE_SESSION_KINDS`), `design/02-product-shape.md:92-104`, `design/03-product-breadth.md`
§§Live/B5, `design/05-in-run-experience.md` §§1, 2, 3-forms, 4.

Competitor evidence is inherited from `broadcast-and-teacher-surfaces.md`,
`league-as-return-loop.md`, `chessable-movetrainer.md`, `teardown-chessable-desk.md`,
`teardown-chesscom-desk.md`, `teardown-chesscom-platform-desk.md`, `competitor-matrix.csv` (rows
3, 12, 13, 34, 39, 46, 47, 64), `competitor-play-ux.md`, `competitor-love-hate-sweep.md`,
`capability-watch.json` (`coach_classroom_ops`), `titled-player-training.md` and
`social-play-and-event-boundary.md`. No new external fetch was made in this pass.

This dossier writes no intent, no RFC and no ledger row (law 5); `design/BACKLOG.md`,
`design/research/README.md` and `planning/exploration/log.md` are untouched by instruction.
