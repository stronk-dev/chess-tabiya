# The league as a return-loop shape

**Question.** `design/01-training-model.md` §Vocabulary defines the **return loop** as *"the
answer to 'why would you open this on Tuesday?'"* and records that we shipped one on
2026-08-13 (`return-and-progression`) — attempts recorded, scheduled on a blocked/varied
ladder, surfaced at `/learn` (`design/01-training-model.md:40-43`) `[V]`. **That loop is
solitary and self-paced.** A league is a different mechanism aimed at the same job: a fixed
cadence, a season, a team, and an opponent expecting you on a given day. This dossier asks
what a league actually is, why it pulls, whether we could express it, what it collides with,
and whether the pull is real or an artefact of who signs up.

**Provenance.** Owner-supplied, 2026-08-15 (commit `d0bc12f`, *"ledger: r/chess thread mined"*).
An r/chess commenter named **Lichess4545** unprompted: *"a very positive impact on my chess
learning"*, ledgered at `design/BACKLOG.md:585` with the note *"a **league** is a return-loop
shape we have not considered"* `[V]`. **Coverage before this dossier: zero** — `4545` returns
exactly one hit across `design/`, `planning/`, `docs/` and `rfc/`, and that hit is the ledger
row itself `[V]`.

**Method and its limits.**

- League rules were read from the league's own rule documents by direct fetch in this pass.
  The fetch pipeline returns a summarising read of the page rather than raw HTML, so **short
  quoted fragments below are reliable and any long verbatim quotation must be re-checked
  against the page before it is quoted in an RFC.** Labelled `[V]` because the primary source was
  loaded in this pass; the caveat is on transcription fidelity, not on the facts.
- Reddit is hard-blocked in this environment, so the originating comment itself is
  **unverifiable here** and is treated as owner-supplied testimony `[P]`, exactly as the
  ledger row records it.
- Every repo claim is `[V]` against the file and line cited, read at `d0bc12f`.
- **No controlled evidence on the causal question was found.** §7 says so plainly and
  explains why the naive statistic is uninterpretable regardless.

---

## 1. How a league actually works

### 1.1 The three leagues under the Lichess4545 umbrella

Three leagues run under one site, all built on the same weekly rhythm
(<https://www.lichess4545.com/>) `[V]`:

| League | Time control | Form | Structure |
|---|---|---|---|
| **Lichess4545** | 45+45 | **Team** | *"Play one game of 45+45 each week as part of a team"* — 8-round team Swiss |
| **Lichess LoneWolf** | 30+30 | Individual | *"one game of 30+30 each week in a large swiss tournament"* — 11-round Swiss, U1800 and Open sections |
| **Lichess960** | 20+20 Chess960 | Individual | *"one game of 20+20 Chess960 each week in a 7 week Swiss tournament"* |

The unit is identical across all three and it is the thing to notice: **one game per week,
for a fixed number of weeks.** Not a session, not a puzzle, not a streak — one long game
against one named person.

### 1.2 The obligation mechanism, isolated

This is the part with no analogue in our product, so it is worth writing out in full. From
the Team4545 rules (<https://www.lichess4545.com/team4545/document/rules/>) and the LoneWolf
rules (<https://www.lichess4545.com/lonewolf/document/rules/>), both fetched in this pass `[V]`:

1. **A round is a window with a hard edge.** Team4545 rounds run *"Mondays 12:00 UTC through
   following Monday 12:00 UTC"*; games *"must be completed by 12:00 UTC on Monday"*. LoneWolf
   pairings release *"Mondays at 21:00 UTC"* with the same seven-day span. The deadline is not
   a suggestion the learner sets — it is published by the league and is the same for everyone.
2. **Pairing is done to you, not by you.** Pairings are released on the league website with
   bot notifications; team rosters are *"assigned by moderators to minimize rating disparity"*,
   seeded on team average rating. You do not choose your opponent and you do not choose
   whether to have one.
3. **Scheduling is itself an obligation with its own deadline.** Players must make initial
   scheduling contact *"within the first 24 hours of a round"*, and each must offer *"a minimum
   of 3 distinct times across at least 2 separate days"* with *"at least 2 hours"* between
   offers. **This is the load-bearing detail:** the league does not merely give you a deadline
   to play, it gives you a deadline to *negotiate*, which converts a passive obligation into an
   active one within a day of the round opening.
4. **Failure is defined, enumerated, and escalating.** A player forfeits by failing to contact
   the opponent within 24 hours (which *"triggers alternate search"*), or by failing to appear
   and make a first move within *"a grace period of 20 minutes"* of the appointed time. A
   forfeit in LoneWolf scores 0 and draws a **yellow card**. Yellow cards are issued for
   *"missing games, failing to contact opponent within 24 hours, or insufficient scheduling
   effort"*. **A second yellow is automatically a red card, and a red card means immediate
   withdrawal from the running season**; one yellow carries into the next season, and repeated
   offences across seasons may draw a season ban or permanent expulsion. The Team4545 FAQ puts
   it in one sentence: *"Missing two games results in permanent replacement"*
   (<https://www.lichess4545.com/team4545/document/faq/>) `[V]`.
5. **The team has a designed repair path for your absence.** Non-league players form an
   **alternate pool**, ordered by rating and registration date; captains update player
   availability, which triggers automatic alternate messaging; alternates are notified from
   *"48 hours before each round"* and are moved to the bottom of the list if unresponsive after
   24 hours. So a missing player is a **staffing problem someone else has to solve**, and
   everyone in the chain can see it.
6. **Byes are the release valve, and their shape differs by league.** LoneWolf allows
   *unlimited half-point byes* with a request deadline *"4 hours before pairings are released"*,
   caps late joiners at 2, and lets moderators award **zero-point byes** to protect standings
   integrity. The Team4545 rules as fetched name **no bye system** — consistent with a team
   format, where your absence is covered by an alternate rather than by a bye.
7. **Entry is gated on a track record.** Both leagues require *"an established classical rating
   on Lichess"*; LoneWolf's U1800 section additionally requires not exceeding 1800 in the three
   months before registration. §7 returns to what this gate does to the evidence.

### 1.3 The result layer

Game points are 1 / 0.5 / 0. Team4545 additionally has **match points** — 2 for winning the
team match, 1 for a drawn match, 0 for a loss — and a tiebreak stack of match points → game
points → head-to-head → games won → Sonneborn-Berger `[V]`. Prizes are not what the rules lead
with; the standing, the card record and the alternate-queue priority are the stakes the
documents actually enumerate. **Status is the currency, and it is administered.**

---

## 2. Why it works as a return loop, mechanically

**The claim under test:** the pull is social obligation and cadence, not content. On the
evidence available, **the claim survives, and the rules are the evidence.**

Read the mechanism back with the chess removed. What remains is: a published deadline you did
not choose; a named person who is waiting; a 24-hour negotiation clock; a captain and a team
whose match result depends on your showing up; an alternate whose weekend gets rearranged if
you do not; a card that follows you into the next season; and a public table that records the
outcome. **Not one of those is a statement about chess.** The content of the league is
"a game of chess" — undifferentiated, unauthored, identical to the game you could play against
a stranger any minute of any day for free on the same site. The league adds nothing to the
chess and everything to the circumstances, and it is the circumstances people come back for.

The organisers say so themselves. The Team4545 FAQ's own answer to why the league is worth
doing is *"a hell of a lot of fun"* and *"camaraderie"*, and the moderator quote it leads with
is entirely about other people: *"The camaraderie that you build with your team mates as the
rounds progress is amazing. There really isn't anything quite like cheering on your team-mate
as he plays the deciding match"* `[V]`. **The stated appeal of a chess league, by its own
organisers, is watching someone else play.**

### 2.1 The two levers, side by side

| | **Our return loop (shipped)** | **A league** |
|---|---|---|
| What brings you back | **Material you attempted** — an attempt you made, resurfaced when it is due | **A person who is waiting** — a pairing published against your name |
| Who sets the timing | The scheduler, from your own history: the 1 / 3 / 7 / 16 / 35-day varied ladder (`docs/return-and-progression.md`) `[V]` | The league calendar, identical for everyone, indifferent to you |
| What happens if you don't | Nothing. The item stays due, or you dismiss it (`POST /progress/schedules/:id` with `dismiss`) `[V]` | An opponent waits 20 minutes, an alternate is hunted, a card is issued, two cards eject you |
| Who notices | No one. Every `/progress*` route is principal-scoped `[V]` | Your opponent, your captain, your team, the standings, the moderators |
| What it is denominated in | Your own history | Someone else's expectation |

**Which lever is stronger?** On the evidence I can actually cite, **the league's is stronger,
and the asymmetry is structural rather than a matter of degree.** Our loop's worst case for a
non-returning learner is a queue that grows; it has no consequence, no counterparty, and — as
§5 measures — **no way to reach the learner at all.** The league's worst case is a person
sitting at a board, a captain rearranging a roster, and an ejection rule. A mechanism whose
failure is visible to other people is a categorically different instrument from one whose
failure is visible to nobody, and every enumerated rule in §1.2 exists to make the failure
visible.

**Where I am reasoning rather than observing:** I have the rules and the organisers' stated
rationale; I do **not** have a measurement of return rates inside a league versus outside one,
and §7 argues that such a measurement would be very hard to interpret even if it existed. The
strength claim above is a claim about **mechanism**, not about measured effect size, and it
should be read as such.

### 2.2 The denomination this adds to the three we had

`design/research/fun-mechanics-outside-roguelikes.md` §10 enumerated the three things systems
without a power curve measure progress in: **(a) cadence and completion** (Wordle),
**(b) the learner's own history** (Zachtronics' histogram), **(c) the catalogue** (Guild Wars 2,
Stardew) `[V]`. A league is **none of the three**. It is a fourth: **(d) another person's
expectation** — and it is the only one of the four that **cannot be shipped for a single
learner**, which is exactly why the earlier sweep did not find it. That sweep was searching
single-player games.

It is also worth separating a league from the daily, which we have already ledgered.
`design/BACKLOG.md:381` (D301, one shared position a day) is denomination (a): a cadence that
is **the same for everyone and directed at no one**. A league is a cadence that is
**different for everyone and directed at exactly one other person.** A daily can be missed
invisibly; a pairing cannot. They are not the same idea at different sizes.

---

## 3. Does it compose with this product?

### 3.1 What we already ship, and it is more than expected

We ship two-human play. `design/03-product-breadth.md:81-92` and `docs/live-sessions.md`
describe it, and the code confirms it `[V]`:

- **`SESSION_KINDS = ["stream","academy","match"]`** is a closed enum (`live-types.ts:3`,
  SQL `CHECK` at `storage.ts:2309`).
- **A native match** is one position run with two learner seats; possession follows
  side-to-move; the server derives each move's actor from the seated learner, so clients
  cannot forge authorship; every turn is attributable through the possession journal
  (`docs/live-sessions.md:35-41`).
- **Live play is mainline-only**: rewind, fork, reveal, group/simulation mutations, duplicate
  and opposite-side replay all return `MATCH_LIVE` (`service.ts:1728`, `:1739`). Either player
  may propose a pause and only the other may accept.
- **Friend links already have the right shape for a pairing.** A `session_join` token is
  **single-use** (`usesRemaining: 1`), **expiring**, optionally **locked to a named handle**,
  can name a **specific colour seat** (`matchSlot: "white" | "black"`), and a session may hold
  at most 50 active links (`live-session.ts:140-149`) `[V]`.
- **A game is expressible from any start position.** `POST /runs` with
  `session.kind = "position"` takes an arbitrary FEN (`rest.ts:389`), so a league game from the
  standard start is a shipped object, not a new one `[V]`.
- **Position Arena is already the "play it elsewhere and bring it back" path.** A match session
  owns two legs around one root; each leg imports a validated mainline-only PGN, records the
  **human handle**, an **external challenge URL** (any HTTPS link — a Lichess challenge is one),
  and a **PGN-standard result** `'1-0' | '0-1' | '1/2-1/2' | '*'` (`storage.ts:2618-2628`,
  `live-session.ts:227-241`) `[V]`. This is precisely the shape a league needs if we never build
  clocks.
- **A directed invitation already exists as a persisted object with a lifecycle**:
  `session_invitations(leg, invited_handle, invited_role, external_challenge_url, state,
  created_at)` (`storage.ts:2608-2617`) `[V]`.
- **A calendar field already exists and is already load-bearing**: `live_sessions.scheduled_for`
  is the primary sort key of the session list —
  `ORDER BY COALESCE(s.scheduled_for, s.created_at), s.id` (`storage.ts:1827`) `[V]`.
- **A real game result already seals.** `terminalOutcome` decides rules-terminal positions
  (`packages/runtime/src/outcome.ts:5`) `[V]`.

So the play machinery, the seat, the invitation, the external handoff, the result and even the
calendar column are all present. **A league is a scheduling and standings layer over shipped
play, exactly as the task supposed.**

### 3.2 What genuinely does not exist

A term census over `apps/` and `packages/` (all `.ts`/`.svelte`, tests excluded) `[V]`:

| Term | Hits |
|---|---|
| `roster` | **0** |
| `standings` | **0** |
| `leaderboard` | **0** |
| `pairing` | **0** |
| `season` | **0** |
| `league` | **0** |
| `tournament` | **0** |
| `forfeit` | **0** |
| `bye` | **0** |
| `captain` | **0** |

And the same census over the machinery a league needs to *reach* anyone `[V]`:

| Term | Hits |
|---|---|
| `notify` | **0** |
| `notification` | **0** |
| `email` | **0** |
| `webpush` / `web-push` | **0** |
| `reminder` | **0** |

Beyond the zero-hit terms, six specific holes, each verified:

1. **Nothing can reach a learner who is not on the site.** There is no email, no push, no
   notification of any kind, and the live platform *"uses authenticated polling rather than
   WebSockets or SSE"* (`docs/live-sessions.md:140`) `[V]`. `/learn` is a pull surface:
   `GET /progress/due` returns what is due **when you ask**. A league's entire mechanism is a
   message arriving when you are not looking. **This is the single largest missing piece and it
   is not chess-shaped at all.**
2. **There is no way to discover another learner.** The HTTP route census contains no learner
   directory and no handle search; `/sessions` lists only sessions where you already hold a run
   grant (`storage.ts:1824-1828`, `JOIN run_grants g ON g.run_id=s.run_id AND g.learner_id=?`)
   `[V]`. You must already know a handle, out of band, to invite anyone. A league needs a pool.
3. **There is no organiser, by owner ruling.** *"No operator account exists (owner ruling
   2026-08-12/14). Administrative capability lives in environment and configuration, never a
   privileged user"* (`design/02-product-shape.md:71-73`) `[V]`. Every enumerated obligation in
   §1.2 — making pairings, awarding a bye, issuing a card, ruling a forfeit, promoting an
   alternate — is an act by a **privileged human**. A league is not merely missing an admin
   screen; it is missing the *role*, and the role was refused on purpose.
4. **The invitation lifecycle has a start state and no transitions.**
   `session_invitations.state` is written `'open'` by the only producer
   (`storage.ts:2030-2035`) and **no code path anywhere updates it** — `accepted` and `revoked`
   are declared `CHECK` values with **zero producers** `[V]`. The obligation-shaped state
   machine exists in the schema and does nothing. **The invitation ships; the acceptance, and
   therefore the non-acceptance, does not.**
5. **A forfeit is inexpressible.** `arena_legs.result` accepts a PGN result and the column is
   nullable, but the only writer is `importLeg`, which requires a parseable PGN starting at the
   arena root (`live-session.ts:227-241`) `[V]`. **A forfeit is a result with no moves**, and
   there is no route that can record one. This is a small hole that a league runs into on week
   one.
6. **A two-human game contributes nothing to the return loop.** `service.ts:1763` rewrites the
   projection so that a match run's **primary branch is forced `countable: false`** `[V]`; and
   attempts are attributed to `lease.learnerId`, the writer-lease holder at the moment of the
   commit, which in a match alternates with possession. So today the mode that has two humans
   in it and the mode that brings people back are **disjoint**. `docs/live-sessions.md:57`
   states the intent — *"The mainline stays in history but is not a countable solo attempt"* —
   and the consequence for a league is that winning your Tuesday game would put nothing on
   `/learn`.

Two smaller items, both already found by prior work and re-confirmed here: `scheduledFor` is
**accepted by the REST route** (`rest.ts:984-989`) but the browser client's `createLiveSession`
**cannot send it** (`apps/web/src/lib/api.ts:632, :877`) `[V]`, so the calendar field is
producer-less from the UI — as `design/research/broadcast-and-teacher-surfaces.md` §2.3
reported; and native matches have *"no clocks, ratings, matchmaking pool, resignation event,
or agreed-draw event"* (`docs/live-sessions.md:46`) `[V]`. A 45+45 league game with no clock and
no resignation is not a league game.

### 3.3 Is a league the parked events row?

**Substantially yes, and this is the answer the task asked for.** `design/03-product-breadth.md:87-88`
promises *"Arena and events: scheduled pack nights, invitations, cohorts, two-leg position
matches, team relays…"*, and `design/BACKLOG.md:650` carries it as **Events layer: pack nights,
cohorts, team relays** — *"named in design/03 §Live, deferred by no one, covered by nothing"*
`[V]`. `design/research/broadcast-and-teacher-surfaces.md` §4.4 already sharpened it: the events
layer and the missing teacher aggregate are *"one surface, not two — a roster with a calendar"*,
with `scheduledFor` as *"the one persisted atom"* `[V]`.

A league is that aggregate seen from a third side, and it contributes the half neither prior
framing named. **A cohort is a roster with a calendar. A league is a roster with a calendar
and a table** — a standing that persists across weeks and orders the members. The verdict
follows: **do not open a new parked row; a league is the events row plus a result layer**, and
the standings/result half is the genuinely new object, because it is also the half that
collides (§4).

---

## 4. The collisions, named

The standing ruling applies throughout: *"a conflict with an invariant is a design prompt, not
a veto… Rulings constrain the **form** a feature takes, never its existence"*
(`design/02-product-shape.md` §Adoption posture amendment, owner 2026-08-14) `[V]`. Each
collision below is therefore stated with the transformation that survives it, except where I
judge the ruling to be too fresh to route around — which is exactly one of them.

### C1 — The leaderboard refusal (fresh, deliberate, and hit head-on) ⚠️ owner ruling wanted

`rfc/learner-rating.md` §8 **R10** refuses *"**Leaderboards and cross-learner comparison** of
any kind"*, on Barth's *"the only thing a global leaderboard manages to tell you is that you
suck (and not even by how much)"* and *"a fantastic incentive for cheating"*, plus the standing
constraint that *"the population is the learner's own history, never other learners"* `[V]`.
The RFC's scope boundary independently excludes *"any cross-learner surface"* (`:176`) `[V]`,
and the shipped copy says the same thing three times over — milestones *"never add a skill
percentage, score, streak, rating, ranking, or cross-learner comparison"*
(`docs/return-and-progression.md:48-49`) `[V]`.

**A league standing is a ranked table of learners. There is no version of a league without
one.** This is the one collision in this dossier I do **not** propose to transform away, for
three reasons:

1. The refusal is **days old and deliberate** (RFC drafted 2026-08-16), and it is one of
   fourteen refusals each written as a named acceptance test (§AC-1: *"Each of R1–R14 has a
   named failing case… Each must be refused **by name**, not by absence"*) `[V]`.
2. It has **two independent reasons**, and only one of them is about honesty. The second —
   *"a fantastic incentive for cheating"* — is **sharper here, not weaker**, because a league
   result is competitive and our accepted limitation is explicit that we do not prevent a host
   from cheating on themselves: *"the streamer can grant and use a second spectator account…
   It protects every reader from premature evidence; it does not pretend to prevent a host from
   cheating on themselves"* (`docs/live-sessions.md:132-138`) `[V]`.
3. There is nonetheless a **real distinction available to the owner**, and it should be put in
   front of them rather than decided here. **R10 refuses ranking learners by a number the
   product manufactured about them.** A league table ranks by **what happened** — wins, draws,
   losses against named opponents — which is structurally the same object as the explorer result
   splits the owner ruled admissible as `corpus_observed` on 2026-08-15 (`design/BACKLOG.md:397`,
   D332: *"It says **what happened**, never **what was good**"*) `[V]`. A standings table is a
   record of events; a rating leaderboard is a published estimate. **Whether that distinction is
   load-bearing or a loophole is an owner ruling, not a researcher's call.**

**Recommendation: escalate, do not route around.** If the answer is "the distinction holds",
then R10 should be amended to say *what it refuses* (a manufactured skill number, compared
across learners) rather than *the shape it refuses* (a table), because as written it also
forbids a table of game results that nothing in its rationale objects to.

### C2 — ADR-0007 and the status currency

ADR-0007: *"**Progression is never monetized.** No unlock, encounter, path, or ceremony is
purchasable; no progression state is for sale"* (`design/BACKLOG.md:738`, owner override only)
`[V]`. A league is not money, and the 4545 rules do not lead with prizes — the enumerated
stakes are the standing, the card record and alternate-queue priority (§1.3). **ADR-0007 is not
touched by a league that pays nothing.** It becomes live the moment a season has a prize, a
sponsor, or an entry fee, and it is worth recording now that ADR-0007 already forbids all three
without further ruling.

The nearer clause is **D334** (owner ruling 2026-08-16): *"winning may unlock **convenience**
and **variety**, never **content**"* (`design/BACKLOG.md:399`) `[V]`. Alternate-queue priority —
the 4545 mechanism where cards and missed games lower your priority for future placement — is
**exactly a convenience gated on conduct**, and is therefore already inside the ruled envelope.
Priority based on *results* would not be.

### C3 — The thesis's own mechanism 1 ⚠️ the sharpest one

`design/00-thesis.md:76-79`: *"**Experimentation without cost.** …preserved branches make
trying something free. You can play the dubious sacrifice, see what a real opponent does to
it, and still have the position you left. **Every other context charges you a lost game for
that curiosity**"* `[V]`.

**A league is, precisely and by design, "every other context".** It charges you a lost game,
a team match point and a place in the table for curiosity. This is not a rules conflict — it
is the product's stated first reason for existing pointed at the feature. The transformation
is available and it is clean: **the league is the place you find out; the drill is the place
you try again.** The 4545 community's own behaviour is the precedent — the FAQ notes the league
has spawned *"newsletters, game review series, streaming content, and statistical analysis
projects"* `[V]`, i.e. **the rehearsal happens around the league, not in it.** That is our
product's shape, and it argues for us being the *companion* to a league rather than the host of
one. But it must be said out loud, because a league inside the drill product would make the
product's headline promise conditional on which mode you are in.

Note this collision is **already partly resolved in code and in the right direction**: rated
runs refuse rewind and fork outright (`rfc/learner-rating.md` R11) and refuse every assistance
route for the whole run (§5.2, enforced by the shipped `ASSISTANCE_WITHHELD`) `[V]`, and live
match play refuses rewind/fork/reveal with `MATCH_LIVE` `[V]`. The separation between
"a game that counts" and "a rehearsal" is already a shipped boundary; a league would sit on the
counting side of a line that already exists.

### C4 — The pause is a hole in any result that matters

Native matches allow a mutually-accepted pause, and *"A pause is consent to use the ordinary
rehearsal loop: a write-capable member may claim, rewind, fork, compare, and reveal"*
(`docs/live-sessions.md:49-52`) `[V]`. Two consenting players in a league game could pause and
analyse. **The mutually-accepted pause is exactly right for a coached game and exactly wrong
for a competitive one.** A league game must be a session kind where the pause is unavailable —
which is cheap, because `session.kind` is already a closed enum, and prior work found it is
*decorative*: `design/research/broadcast-and-teacher-surfaces.md` established there are
**exactly two behavioural branches in the whole server that read `session.kind`, both requiring
`match`** `[V]`. A competitive kind is a place to put behaviour that has nowhere else to live.

### C5 — No operator, no league

Restated from §3.2 because it is a collision and not just a gap: a league requires a tournament
director, and `design/02-product-shape.md:71-73` refused the privileged user by owner ruling
`[V]`. The transformations are (a) the league is **external** and we only import its games —
which the Position Arena path already supports; or (b) organiser capability is **per-league and
delegated**, i.e. a league creator is privileged inside their own league and nowhere else,
which is the same shape as the run-grant model already shipped and does **not** require a
platform operator account. (b) is the version that survives the ruling; it should be named as
such if this is ever designed.

### C6 — The population we do not have

`design/BACKLOG.md:711` records the owner's own framing — the validation design *"assumes user
cohorts we will not have (**'I don't expect much usage'**)"* — and
`design/research/fun-mechanics-outside-roguelikes.md:1039` states it flatly: *"this deployment
has one learner"* `[V]`. A 4545 team season needs 8–10 players **per team** plus an alternate
pool `[V]`. **A league is the one return-loop mechanism in the design space whose minimum input
is a population, and the population is the one input we do not have.** This is not a doctrinal
collision; it is a feasibility ceiling, and it is the reason the honest verdict in §8 is
"import, don't host".

### C7 — The one place a league is a *gift* rather than a collision

`rfc/learner-rating.md` Open question 6: *"**The human anchor.** Nothing here measures a human
against a band. The experiment is well-defined and cheap — learners with known Lichess rapid
ratings play a fixed schedule against the four rungs; regress recovered BCS on the external
rating. Until it runs, **R7 is permanent**. **This is the single highest-value unrun experiment
this RFC creates**"* `[V]`. R7 is the refusal to publish our rating as a FIDE/Lichess/Chess.com
equivalent, *"because the anchor is unmeasured; the whole calibration is engine-vs-engine"* `[V]`.

**A league is a machine that produces exactly that data.** Its entry gate requires *"an
established classical rating on Lichess"* `[V]` — so every participant arrives carrying a known
external rating — and its output is a fixed schedule of whole, unassisted, rewind-free games
against opponents whose external ratings are also known. If this product ever wants the human
anchor, a league is not a competing return loop; **it is the cheapest instrument for the
highest-value unrun experiment in the repo.** That is the strongest composition argument in
this dossier and it does not require hosting a league — importing games from one would do.

---

## 5. Selection versus causation

**The honest finding first: I found no controlled evidence in either direction, and I do not
believe any exists.** No random assignment, no matched control, no natural experiment on league
participation and chess improvement was located. Any claim that a league *causes* learning is,
at present, testimony — including the owner-supplied comment that started this dossier.

**But the verified rules make the naive statistic uninterpretable, and that is a stronger
result than a missing citation.** Three mechanisms, each read directly off §1.2:

1. **Entry selects on the exact behaviour being measured.** Both leagues require *"an
   established classical rating on Lichess"* `[V]`. A classical rating only exists if you have
   already chosen, repeatedly and unprompted, to play long games. The population is therefore
   pre-filtered for *people who voluntarily return to long chess*, which is the outcome variable.
2. **The scheduling burden is a second filter, applied before any chess happens.** Offering
   *"3 distinct times across at least 2 separate days"* within 24 hours, then keeping a 45+45
   appointment that can run three hours, is a commitment cost paid at registration `[V]`. Anyone
   unwilling to pay it never appears in the denominator.
3. **This is the decisive one: the league removes non-returners by rule, mid-season.** Two
   yellow cards is a red card and immediate withdrawal from the running season; *"Missing two
   games results in permanent replacement"* `[V]`. **So a within-season retention or completion
   statistic is definitionally conditioned on having returned** — the people who would have
   depressed it have been ejected and replaced from the alternate pool by the time the season
   ends. A league's own numbers cannot answer the causal question, because the rules delete the
   counter-evidence as a matter of policy.

**Verdict: selection is proven; causation is unestablished.** Mechanisms 1 and 2 are documented
entry filters and mechanism 3 is a documented exit filter, so the claim *"the league retains
people who would have returned anyway"* is not a sceptical hypothesis — it is partly what the
rules say the league does. Causation is not thereby refuted; it is unmeasured, and the
measurement is harder than it looks.

**What would move this.** The comparison that would carry weight is not league-versus-no-league
but **alternates versus rostered players within one season**: the alternate pool is a set of
people who registered — paying filters 1 and 2 in full — and then, for reasons of queue position
rather than motivation, did or did not receive an obligation. That is the closest thing to
random assignment a league produces on its own, and it is generated for free every season. I
could not verify whether any league publishes the data needed to run it; naming the design is
the contribution here.

**One caution for us specifically.** If we ever conclude a league "worked", mechanism 3 means we
will be measuring our own ejection rule. Any league we build or import must record the
**ejected** and the **never-paired** alongside the finishers, or its retention number will be
survivorship dressed as effect. That is the same lesson `design/research/census-hint-false-positives.md`
learned about the alternatives axis — the population you do not look at is the one that decides
the answer.

---

## 6. What this dossier does not establish

- **No participation numbers.** I could not verify current season sizes, team counts, forfeit
  counts per season, alternate-usage rates, or season-over-season retention for any league. The
  rules pages carry rules, not statistics.
- **No verification of the originating testimony.** Reddit is hard-blocked here; the comment
  remains `[P]` owner-supplied.
- **No comparative survey of other league forms.** Chess.com's automated tiered Leagues, Lichess
  team battles/Swiss/arena, daily team matches, and the professional team leagues are **not**
  covered. That matters for one specific reason: those systems are the natural place to look for
  a league-shaped pull **without** a scheduled human counterparty, which is the cheapest possible
  test of this dossier's central claim. Named as the follow-up in §8.
- **No rating-gain data** for league participants.
- **No literature review** on commitment devices, cohort-based courses versus self-paced ones, or
  deadline effects. §5's argument stands on the league's own rules and does not lean on any of
  it; a future pass that wants a general claim about social obligation would need it.
- **Exact rule wording.** Per §Method, the rule pages were read through a summarising fetch.
  Every rule stated here should be re-read verbatim before it is quoted in an RFC.

---

## 7. Verdict

**A league is a real and previously unconsidered return-loop shape, it is the parked events row
plus a result layer, and we should not host one.**

1. **The mechanism is confirmed and it is not about content.** Every enumerated rule in §1.2 is
   about circumstances, deadlines and other people. The organisers' own stated appeal is
   camaraderie and watching a team-mate play. **A league brings you back because someone is
   waiting** — one sentence, and nothing in it mentions chess.
2. **It is a stronger lever than ours, structurally.** Our return loop's failure mode is
   invisible to everyone including us; a league's is visible to an opponent, a captain, a table
   and a moderator. Reasoning, not measurement — see §2.1.
3. **We could express more of it than expected and less than needed.** Play, seats, single-use
   colour-locked invitations, external handoff, PGN import with a result, and even a calendar
   column all ship. Roster, standings, pairings, seasons, byes, forfeits, an organiser, a
   notification of any kind, and a way to find another learner do not — and **the missing pieces
   are almost entirely not chess-shaped**, which is both the good news (nothing about them
   threatens law 8) and the bad news (they are a different product's worth of plumbing).
4. **The leaderboard refusal is hit head-on and needs an owner ruling** (C1). Everything else
   transforms.
5. **Selection is proven, causation is unestablished, and the league's own rules make its
   numbers unable to settle it** (§5).
6. **The composition that is actually attractive is the inverse of the one proposed.** Not
   "build a league into the drill product", but **"be the rehearsal surface a league's players
   use between rounds"** — which is what the 4545 community already built for itself in
   newsletters, review series and analysis projects, which needs no organiser, no operator
   account, no notification system and no population of our own, and which — via C7 — is the
   cheapest route to the human anchor that `rfc/learner-rating.md` names as its highest-value
   unrun experiment.

**Recommended disposition: DEFER the hosted league; SCOPE the import path.** The trigger for
revisiting the hosted version is the one C6 names — a population — and it should be stated as a
number rather than a feeling: a league is not designable here until there are enough learners to
fill one section, and until then every hour spent on standings is an hour not spent on the
surface a league's players would actually visit.

---

## 8. Proposed ledger rows (report-only — `design/BACKLOG.md` not edited, per instruction)

1. **New row — "The league as a return-loop shape (denomination (d): another person's
   expectation)"** 💡, tagged `return loop, events layer, B5, Q1b`. Body: the mechanism is
   obligation and cadence, not content; verified rules in
   `design/research/league-as-return-loop.md` §1.2; it is a fourth progression denomination
   beside cadence / own-history / catalogue; **verdict DEFER-hosted / SCOPE-import**, trigger =
   a population large enough to fill one section.
2. **Amend `design/BACKLOG.md:650` (Events layer)** — add *"and a league is this row plus a
   standings layer; `broadcast-and-teacher-surfaces.md` already merged it with the teacher
   aggregate as 'a roster with a calendar' — a league is 'a roster with a calendar **and a
   table**'. Do not open a third row."*
3. **⚠️ Owner-facing row — "Does R10 refuse the table, or the number?"** `rfc/learner-rating.md`
   R10 forbids cross-learner comparison *of any kind*; a league standing is a record of game
   results, which is the same object class the owner ruled admissible as `corpus_observed`
   (D332: *"what happened, never what was good"*). **Needs a ruling; R10's wording should then
   say what it refuses rather than what shape it refuses.**
4. **🐞 Defect — `session_invitations.state` has one producer and no transitions.** Written
   `'open'` at `storage.ts:2030-2035`; `accepted` and `revoked` are declared `CHECK` values with
   zero producers repo-wide. The invitation lifecycle is schema-only.
5. **🐞 Defect — a forfeit / result-without-a-game is inexpressible.** `arena_legs.result` is
   nullable and enum-checked, but its only writer (`importLeg`) requires a parseable PGN, so no
   route can record a result with no moves.
6. **🐞/📊 — two-human play and the return loop are disjoint.** `service.ts:1763` forces
   `countable: false` on a match run's primary branch, and `#project` attributes attempts to the
   alternating writer-lease holder. A human-vs-human game puts nothing on `/learn`. Related to
   `design/BACKLOG.md:394` (D314), which found the same disjunction for Just Play.
7. **New row — "Nothing in this product can reach a learner who is not on the site."**
   `notify`/`notification`/`email`/`webpush`/`reminder` = **0 hits**; the live platform polls.
   Ledgered because it is a precondition for *any* cadence-based return mechanism, not only a
   league — including D301's daily.
8. **New row — "There is no way to discover another learner."** No directory route, no handle
   search; `/sessions` is grant-scoped. Every social surface we ship assumes the handle arrived
   out of band.
9. **Research follow-up** — the obligation-free comparison: Chess.com's automated tiered Leagues
   and Lichess team battles/Swiss are league-*shaped* with **no scheduled human counterparty**.
   If they retain comparably, this dossier's central claim is wrong and cadence alone is the
   lever. Cheapest available test; not run here.

---

## 9. Sources

**Primary (fetched in this pass, `[V]`)**

- Lichess4545 league index — <https://www.lichess4545.com/>
- Team4545 rules — <https://www.lichess4545.com/team4545/document/rules/>
- Team4545 FAQ — <https://www.lichess4545.com/team4545/document/faq/>
- LoneWolf rules — <https://www.lichess4545.com/lonewolf/document/rules/>

**Owner-supplied testimony (`[P]`, unverifiable in this environment)**

- r/chess comment, 2026-08-15, via `design/BACKLOG.md:585` (commit `d0bc12f`).

**Repo sources (`[V]`, read at `d0bc12f`)**

`design/00-thesis.md:76-79` · `design/01-training-model.md:40-43` ·
`design/02-product-shape.md` §Deployment axis (`:56-77`) + §Adoption posture amendment ·
`design/03-product-breadth.md:54, :81-92, :301` · `design/05-in-run-experience.md` §1 ·
`design/BACKLOG.md:381, :394, :397, :399, :585, :650, :707, :711, :738` ·
`design/research/broadcast-and-teacher-surfaces.md` §2.3/§4.4/§7.3 ·
`design/research/fun-mechanics-outside-roguelikes.md` §F8, §10 ·
`design/research/mechanics-by-mode.md` §5 item 11 ·
`docs/return-and-progression.md` · `docs/live-sessions.md:35-57, :82-92, :130-143` ·
`rfc/learner-rating.md` §1, `:176`, §8 R7/R10/R11, §5.2, §11.2, Open question 6 ·
`apps/server/src/live-session.ts:140-160, :221-241` ·
`apps/server/src/live-types.ts:3, :89-95` ·
`apps/server/src/progress.ts:75-140` · `apps/server/src/rest.ts:389, :618, :984-989` ·
`apps/server/src/service.ts:1728, :1739, :1747-1764` ·
`apps/server/src/storage.ts:1824-1828, :2030-2040, :2608-2628` ·
`apps/web/src/lib/api.ts:632, :877` · `packages/runtime/src/outcome.ts:5`

---

*Landed 2026-08-16. Coverage-matrix row added in `design/research/README.md`.*
