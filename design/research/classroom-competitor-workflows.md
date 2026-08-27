# Classroom competitors — six different products hiding behind one category

**Pass date:** 2026-08-27

**Feeds:** [[D1483]], TCH-a32, professional-workflows 1.0 scope, Q1a, B5

**Evidence ceiling:** primary-source desk teardown plus public community reports. **No
competitor was driven hands-on.** The in-app browser skill advertised to this session was absent
from disk, and several complete flows require teacher/student accounts. A fetched page is not a
used product; nothing below claims step count, latency, layout quality, or end-to-end reliability
from vendor screenshots.

## Verdict

The old corpus sentence — *classroom tooling is scheduling-and-analytics ops* — collapses four
different products and is not precise enough to guide Tabiya `[V]` (`design/research/
broadcast-and-teacher-surfaces.md` §5). The six products checked here divide into four jobs:

1. a **synchronous teaching room** (Chess.com Classroom, ChessKid Live Classroom);
2. **safe student identity and progress administration** (Lichess Classes, ChessKid);
3. a **curriculum and diagnostic dashboard** (Chessity, ChessKid); and
4. an **academy operating system** joining lessons, homework, scheduling, reports and money
   (Chess.Run, ChessPlay.io).

Tabiya already has a fifth and materially different job: **consent-bounded rehearsal hand-off**.
A learner receives an assignment, plays a consequence, and explicitly submits one preserved run;
class membership never grants the teacher general progress or run access `[V]`
(`docs/classrooms.md`). None of the checked competitor sources claims preserved attempt branches,
rewind/compare/replay, or per-run revocable evidence access. That keeps E1 intact at this evidence
level `[V]` for source absence, not proof of product absence.

The product lesson is therefore not “copy a classroom dashboard.” It is to keep the consent model
and rehearsal runtime, while making the already-related objects feel like one workflow: **prepare
or select work → teach or schedule it → learner rehearses it → learner chooses what to hand back →
coach sees the factual return and can enter that exact attempt.** Academy billing, payroll and
white labelling are real competitor strengths, but they do not improve that loop and are a separate
scope decision `[M]`.

## Method

- Searched each name explicitly: Chess.com Classroom, Lichess Classes, ChessKid Classroom,
  Chessity, Chess.Run and ChessPlay.io.
- Preferred current official help/product pages for capability claims. A vendor page proves that
  the vendor currently claims a feature, not that the feature works well.
- Ran targeted love/hate searches. Public reports are `[P]`; absence after a targeted search is
  recorded as `not_found`, not as satisfaction.
- Re-read Tabiya's shipped boundary in `docs/classrooms.md`, `docs/live-sessions.md` and
  `docs/app-shell.md` `[V]` rather than inheriting the 2026-08-24 UX dossier's then-current screen.

## Capability decomposition

| Product | The one thing it does especially well | Grounded workflow | What the source does **not** establish |
|---|---|---|---|
| **Chess.com Classroom** | A shared analysis room with media and fine-grained board control | Create/join by room id; load collections, archived games, studies, FEN or PGN; use master-game Explore; host may mute/remove participants or grant White, Black or full control `[V]` ([official help](https://support.chess.com/en/articles/8708915-how-do-i-use-classroom-on-chess-com)) | No async assignment/return loop, longitudinal class record, preserved retry comparison, or reliability claim |
| **Lichess Classes** | Free, ad-free managed student identities plus a compact progress surface | Generate student credentials, track games and puzzles, and message a class `[V]` ([official Classes page](https://lichess.org/class)); its open-source routes include a distinct class login `[V]` ([lila routes](https://github.com/lichess-org/lila/blob/master/conf/routes/)) | The landing page does not claim a synchronous classroom board, homework hand-in, or attempt-level consent |
| **ChessKid** | Child/institution administration joined to curriculum and live teaching | Individual and club report cards cover games, puzzles, lessons, workouts, videos and articles; organizations manage students, teachers, groups and nested subgroups; Live Classroom adds saved games/positions, audio/video and learner board control `[V]` ([report cards](https://support.chesskid.com/en/articles/8867959-coach-how-can-i-review-my-students-games), [enterprise organization](https://www.chesskid.com/learn/articles/new-chesskid-experience-for-your-teachers-schools-districts), [live classroom](https://www.chesskid.com/learn/articles/how-to-use-the-chesskid-live-classroom-tool)) | The pages do not establish learner-controlled access, preserved branch comparison, or whether reported progress produces useful coaching decisions |
| **Chessity** | A filterable curriculum/skill dashboard that can change what a teacher does next | Teachers group learners, show lesson mastery, activity, performance, trouble spots and exam progress, then filter to learners who share a specific need; account settings choose recommended-path versus free navigation `[V]` ([teacher dashboard](https://www.chessity.com/en/blog/1405/New_teacher_dashboard_now_available_), [school product](https://www.chessity.com/en/school), [group plan](https://www.chessity.com/en/group-prices)) | Adaptive/personalized effectiveness is a vendor claim `[P]`; no attempt-preservation or learner-consent model is documented |
| **Chess.Run** | The lesson is the transaction that updates both learning and school operations | One room contains video, board, chat, material and assignments; homework can come from a ready study, PGN, Lichess study or own material; the learner completes it and the coach sees progress, mistakes and hints; completing a lesson updates balances and coach earnings `[V]` ([school workflow](https://chess.run/en_gb/chess-school), [homework](https://chess.run/features/homework-progress), [lesson room](https://chess.run/en-gb/features/first-online-lesson)) | The vendor pages do not establish grading quality, learner data boundaries, branch comparison or operational reliability |
| **ChessPlay.io** | A branded academy-in-a-box with parent-facing operations | The vendor claims recurring live classes, integrated boards/video, self-graded homework, reports, attendance, leaderboards, tournaments, fee collection, parent access, auto-synced external games and branded portals `[V]` as claimed ([official product page](https://chessplay.io/), [help center](https://help.chessplay.io/)) | Most detail is marketing copy; no hands-on workflow, evidence-grounding contract, preserved attempts or independent effectiveness evidence was found |

## Love, hate and the cost of integration

### Chess.com Classroom

**Loved/valued `[P]`:** the product joins a shared board, participant control, audio/video and
multiple source formats in one room; a 2025 community post calls the room useful for coaching club
members ([Chess.com forum](https://www.chess.com/forum/view/clubs-and-teams/clubs-and-chess-com-classrooms-122126726)).

**Hated/reported `[P]`:** coaches report board-sync failures, lockups, broken media and needing a
separate Zoom room; one coach moved to Lichess Studies because it was more stable and retained
lesson material ([2023 failure report](https://www.chess.com/forum/view/general/classroom-problems-any-online-coaches-having-problems-too),
[format comparison](https://www.chess.com/forum/view/chess-lessons/best-format-for-getting-coaching),
[sync report](https://www.chess.com/forum/view/general/live-analysis-where-is-it-now-and-how-can-we-use-it)).
These reports are historical and do not prove the 2026 build still fails.

**Lesson:** integration only counts when board state, media and materials fail independently and
recover honestly. “All in one room” is not itself a benefit if one subsystem takes the lesson down
`[M]`.

### Lichess Classes

**Loved/valued `[P]`:** a high-school coach specifically praises the coach data, class messaging
and learning-module progress ([Lichess forum](https://lichess.org/forum/lichess-feedback/lichess-classes-what-is-it)).
The official surface is free, ad-free and tracker-free `[V]` ([Classes](https://lichess.org/class)).

**Hated/reported `[P]`:** teachers request easier login for young children, removal/discovery help,
and teaching-specific simultaneous games ([lila issue 18341](https://github.com/lichess-org/lila/issues/18341),
[removal question](https://lichess.org/forum/lichess-feedback/how-to-remove-students-from-lichess-classes),
[teaching simul request](https://lichess.org/forum/lichess-feedback/feature-request-for-lichess-classes-simultaneous-exhibitions-between-teacher-and-students)).
A 2026 public security advisory reports that an invited, non-managed learner's password could be
reset through a teacher endpoint even though the UI hid the action `[V]` as an advisory claim
([GHSA-8738-rh94-9c27](https://github.com/lichess-org/lila/security/advisories/GHSA-8738-rh94-9c27)).
This is not evidence about Tabiya; it is evidence that **managed-account powers and ordinary
membership must be different capabilities at the route, not just in the UI** `[M]`.

### ChessKid

The official case studies and product pages praise curriculum, reporting and reduced preparation
work, but those are vendor-selected testimonials `[P]`. A targeted independent search did not find
a sufficiently specific current classroom-flow complaint or endorsement to generalize from;
love/hate is `not_found`, not positive evidence.

### Chessity

The official dashboard post says it was shaped by coach feedback and presents filtering as the way
to turn broad progress data into a teachable group `[V]` as the vendor's documented design. The
testimonials are vendor-selected `[P]`. A targeted independent search did not find a specific
current teacher-workflow complaint; hate is `not_found`.

### Chess.Run and ChessPlay.io

Both products sell relief from tool fragmentation: video, board, homework, schedule and finances
in one workflow `[V]` as vendor positioning. ChessPlay publishes named academy testimonials, but
they remain vendor-selected `[P]`; targeted independent searches found no usable workflow-level
love/hate record for either product. Their reliability and usability therefore remain unmeasured.

## Tabiya against the field

| Job | Tabiya at HEAD | Field pressure | 1.0 consequence |
|---|---|---|---|
| Shared teaching board | Academy session, board possession, proposals, marks, preserved branches and review rail `[V]` (`docs/live-sessions.md`) | Chess.com/ChessKid make media, source loading and control feel like one room | Keep the rehearsal runtime central; do not make embedded video a dependency of board truth `[M]` |
| Assignment and return | Pack assignment, terminal hand-in, factual roster state and one-run consent `[V]` (`docs/classrooms.md`) | Chess.Run makes material→assignment→completion→review continuous | The next useful primitive is **entry from an assignment/submission into the exact teaching/rehearsal context**, not a larger analytics table `[M]` |
| Student progress | Deliberately principal-only; a coach sees only submitted attempts `[V]` (`rfc/archive/teacher-surface.md` §§Out of scope, 2.2) | Lichess, ChessKid and Chessity expose broad progress/weakness dashboards | This is a doctrine difference, not missing wiring. Any cohort aggregate needs an owner ruling and a grounded, consented factual denominator; do not smuggle `/progress*` widening through “parity” `[M]` |
| Child/school identities | Existing learners accept invitations; teachers do not create or control their accounts `[V]` (`docs/classrooms.md`) | Lichess/ChessKid reduce classroom setup with managed child accounts and organization hierarchy | A real uncovered product question: whether 1.0 serves minors/institutions, and if so what custodian, recovery, release, audit and safeguarding model exists. This requires research and an owner decision before an RFC `[M]` |
| Curriculum/personalization | Registered packs, return scheduling and support evidence exist; teacher assignment is pack-scoped `[V]` | Chessity joins a fixed curriculum to filtered skill/progress views | Evidence-derived opportunity denominators and the longitudinal store are the prerequisite; a teacher-facing “weakness” label cannot precede them or bypass law 8 `[M]` |
| Academy operations | Scheduled pack nights exist; no billing, payroll, parent portal or white label `[V]` (`docs/app-shell.md`, `docs/classrooms.md`) | Chess.Run/ChessPlay are much broader operationally | Record as an explicit scope fork. These features may matter to hosted academies, but they neither power evidence nor improve the core rehearsal loop `[M]` |

## Findings routed to 1.0

1. **D1483 is no longer “no desk coverage.”** Six products now have current primary-source feature
   records and the category has a usable decomposition. It remains bounded by [[D1458]]: no product
   was driven, so geometry, friction and reliability remain unverified.
2. **The teacher surface should be judged on continuity, not feature count.** Tabiya already owns
   the objects competitors advertise separately. The product test is whether a teacher or learner
   can move through assignment → run → submission → exact review/rehearsal without reconstructing
   context `[M]`. The terminal hand-in now closes one important seam `[V]` (`docs/classrooms.md`).
3. **Managed learner identity is a missing primitive, not a sign-up checkbox.** Lichess and
   ChessKid show why it is valuable; Lichess's public advisory shows why custodian authority must
   be route-level and explicit. This becomes a research/owner item, not an implementation shortcut.
4. **Full academy administration is a product-scope fork.** Track it explicitly so “one FOSS
   platform” does not silently mean payroll and tax infrastructure, and so it cannot fall out of
   scope unnoticed either.
5. **No new evidence collector is implied by this pass.** The pressure is consumer continuity and
   longitudinal denominators. Chessity's “trouble spots” are not portable chess truth; Tabiya may
   show a factual opportunity/attempt record only once the evidence and longitudinal contracts can
   produce it.

## Residual hands-on protocol

TCH-a32 should not be called hands-on complete. A real discharge needs two accounts per product
where feasible and records the same journey, not a tour of settings:

1. create a class and invite/join as the learner;
2. prepare one non-starting position or lesson artifact;
3. let the learner act on the board or complete assigned work;
4. inspect what persists for learner and teacher after leaving/re-entering;
5. revoke/remove/leave and observe retained access;
6. repeat at desktop and 390 px; record steps, board size, overflow, failure recovery and what the
   learner is told about teacher powers.

Chess.com and Lichess are the first pair: they represent opposite halves (live room versus managed
class), have free entry points, and have public love/hate claims that a current run can confirm or
refute. ChessKid/Chessity/Chess.Run/ChessPlay may require educator approval, trials or sales demos;
that is recorded as access cost, not worked around with invented observations.

## Source register

New source-index entries: R58–R64 in `design/research/source-index.md`. Accessed 2026-08-27.
