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

**Method.**

- League rules, FAQs, the player handbook, the captains' guidelines, the ToS, the league
  history, and the per-season roster/pairing/standings/stats pages were **fetched directly**.
  Quotes below are page text.
- **The league's own tournament software is open source** — `Lichess4545/heltour` — and is used
  here as a primary source wherever the encoded rule is sharper than the prose one. Where code
  and prose differ, both are given.
- **§5.4's randomised evidence was gathered against the hypothesis, not for it**, and it reversed
  this dossier's first draft. The draft concluded *"no controlled evidence exists in either
  direction"*; that was wrong, and the correction is recorded rather than quietly folded in
  (AGENTS.md law 6).
- **The attrition figures in §5 are computed**, not published: every per-round pairings page was
  parsed and each result cell classified (`1X`/`0F` = forfeit, `½Z` = scheduling draw, else
  played). The method is stated so it can be re-run. It was cross-checked against the league's
  own stats page for Season 49 and the two independent counts agree exactly.
- Reddit is hard-blocked in this environment, so the originating comment is **unverifiable
  here** and is treated as owner-supplied testimony `[P]`, exactly as the ledger row records it.
- Every repo claim is `[V]` against the file and line cited, read at `d0bc12f`.

---

## 1. How a league actually works

### 1.1 The three registration leagues, and the community leagues behind them

The ToS draws the line itself
(<https://www.lichess4545.com/team4545/document/terms-of-service/>) `[V]`: *"The term 'website
leagues' is used when referring to leagues that accept registrations submitted through the
Lichess4545 website. Currently, there are three such leagues: the 4545 Team, LoneWolf and
Chess960 leagues."*

| League | Time control | Form | Rounds | Round boundary |
|---|---|---|---|---|
| **4545 Team** | 45+45 | Team Swiss, 8 boards, seated by rating | 8 | Mon 12:00 UTC → Mon 12:00 UTC |
| **LoneWolf** | 30+30 | Individual Swiss, **Open + U1800 sections** | 11 | Mon 21:00 UTC → Mon 21:00 UTC |
| **Chess960** | 20+20 960 | Individual Swiss | 7 | Tue 18:00 UTC → Tue 18:00 UTC |

`[V]`, from <https://www.lichess4545.com/>, `/team4545/document/rules/` §III,
`/lonewolf/document/rules/` §II, `/chess960/document/rules/`.

Behind them sits a **second tier of Slack-only community leagues** with no website registration:
Series (*"90+30 round-robin, 8-player groups w/ promotion + relegation, seasons span 10-12
weeks"*), Infinite Quest (*"Perpetually running tournament that players can join, pause or resume
when they want"*), Rapid Battle, Offseason Quads (*"Friendly 4545 games between 4545 seasons"*), a
**Correspondence** league (*"Players receive pairings each week. Time control: 2 days per move"*),
a Fantasy league, and a **Book Club** — *"Members cover a chapter of a book each week, and are
paired against other members to play casual games intended to cement their grasp of the
material. Currently working through Hellsten's Mastering Endgame Strategy"* `[V]` (official
overview doc, linked from the FAQ).

**That last one deserves a pause.** A volunteer community, unprompted, built a mechanism where
**a chapter of theory is paired with games chosen to make you play it** — and made it weekly.
That is the drill product's premise, assembled by hand out of a book and a pairing bot, by
people who had no product. It is the strongest demand signal in this dossier and it appears in
a footnote of a league's overview document.

The unit is identical across every one of them: **one game per week, for a fixed number of
weeks**, against one named person.

### 1.2 The obligation mechanism, isolated

This is the part with no analogue in our product, so it is written out in full. All from
`/team4545/document/rules/` unless marked `[V]`-elsewhere.

1. **A round is a published window with a hard edge.** *"Each round starts on Mondays at 12:00
   UTC and ends on the following Monday at 12:00 UTC"*; *"Games must be completed by 12:00 UTC
   on Monday"* — the deadline is **the start of the next round**, with no grace window. Eight
   rounds across *"eight consecutive weeks"* (Player Handbook) `[V]`.
2. **Pairing is done to you.** *"Pairings for a round are published on the league's website.
   Players will also receive a pairing message from the league bot @chesster that puts them in
   touch with their opponent"* `[V]`. You choose neither the opponent nor whether to have one.
3. **Scheduling is itself an obligation, with its own clock and a specified minimum effort.**
   *"Each player must make an initial offer to their opponent, consisting of a minimum of 3
   distinct times across at least 2 separate days. Suggested times must be separated by at least
   2 hours… **Those initial offers must be sent during the first 24 hours of a round**"* `[V]`.
   And it may not be abandoned: *"**Players shall not abandon the scheduling discussion as long
   as there is no resolution to any potential conflicts**"* `[V]`. **There is no default or
   fallback time** — only three moderator-mediated exits: a ½–½ if both made a reasonable effort
   and failed, a forfeit for the one who did not, and *"If neither player provides a reasonable
   effort to find a time, both will forfeit with a 0-0 score"* `[V]`.
4. **The enforcement point is 24 hours after pairing, and it is automated.** *"If one player does
   not contact their opponent in the first 24 hours after their pairing was published, **a search
   for an alternate will start**"* `[V]`. The bot fires at 25 hours, and — the sharp part — *"The
   tournament software starts the alternate search **by setting the unresponsive player
   unavailable**… If the player is not set available again before an alternate is found, **the
   alternate will play the game. It is not sufficient to start messaging the opponent now**"*
   (Captains' Guidelines) `[V]`. Captains watch a live compliance dashboard of green checks,
   yellow warnings and red crosses per player `[V]`. LoneWolf is harsher still: *"if you do not
   make contact on Slack within 24 hours, **you will automatically be withdrawn from the
   round**"* `[V]`.
5. **No-show is defined to the minute, and the claim is auto-approved.** *"they will have a grace
   period of 20 minutes to appear, otherwise they will forfeit"*; being online but not moving
   within 20 minutes forfeits too; the claimant supplies a *"time-stamped screenshot"* and
   *"**This claim will automatically be approved**"*, with an appeal offered to the other side —
   and if the accused proves they were there, *"**their OPPONENT shall lose by forfeit**"* `[V]`.
   The bot's real buffer is **21 minutes 30 seconds** (Captains' Guidelines), matching heltour's
   `timedelta(minutes=22)` in `tasks.py` `[V]`.
6. **Failure is cumulative and follows you between seasons.** A yellow card for *"Missing a
   scheduled game… Not contacting an opponent on Slack within 24 hours… Insufficient effort to
   schedule a game"*; *"**A second yellow card offence will automatically result in a red
   card**"*; a red card means withdrawal from the running season and *"they will carry over a
   yellow card into the next season they play"*; and *"Players who consistently receive cards
   over several seasons may be banned from playing the next season (or even permanently)"* `[V]`.
   The FAQ states it in one line: *"**Any player who misses two games in the season will be
   permanently replaced**"* `[V]`. It is literally two lines of code —
   `if self.games_missed >= 2 … _set_unavailable_for_season()` and
   `card_color: 'red' if games_missed >= 2 else 'yellow' if == 1` (`heltour/tournament/models.py`)
   `[V]`.
7. **Your absence is a staffing problem other people solve, in four tiers.** (i) an **alternate**
   from a rating-and-registration-ordered queue that *"rotates as alternates are used"*, contacted
   from **48 hours before the round**, 8–12 hours apart, moved to the bottom if unresponsive for
   24 hours; (ii) a teammate **plays up a board** — and plays *"TWO total games"* that week;
   (iii) **playing down** one board, which *"the opponent team grants permission"* for; (iv) a
   ruled draw or a forfeit `[V]`. The timings are configurable constants in
   `AlternatesManagerSetting` `[V]`.
8. **Byes: none in the team league, generous in LoneWolf.** The word *bye* does not appear in the
   team-league rules, FAQ, handbook or captains' guide — an absence is covered by a substitute,
   not by a score `[V]`. LoneWolf instead has *"**unlimited byes (worth 0.5 points)** provided
   they ask for them **4 hours before pairings are released**"*, a 2-bye cap for late joiners,
   and a moderator power to award a **zero**-point bye *"in order to maintain your approximate
   position in the standings"* `[V]`.
9. **Entry is gated on a track record, not on strength.** *"Have an established classical rating
   on Lichess"* — with no rating floor or ceiling, and the FAQ is explicit that a provisional
   rating is not enough and a lapsed one must be **re-established** `[V]`. The ToS adds: over 16,
   no Lichess ToS violations, *"Not have lost a game due to a 'cheat detected' mark"*, no prior
   league ban, no re-registration under a second account `[V]`. Registrations are **manually
   reviewed** `[V]`. Chess960 adds a second gate: *"we will generally never approve players
   completely new to Lichess4545 for chess960 only"* `[V]`.
10. **One elegant incentive worth stealing outright.** Declaring yourself unavailable **before**
    the round starts and finding no substitute yields *a ruled draw*; declaring **after** it
    starts yields *a forfeit loss* `[V]`. The changelog dates the switch: *"IV.C 1 Updated to
    change ruling from forfeit to draw if original player set unavailable before round start
    (20-Oct-2018)"* `[V]`. **The league prices lateness, not absence** — exactly the distinction
    a scheduling system needs and almost never makes.

### 1.3 The finding that most changes what we should build

The registration form once asked players to affirm they could commit. The organisers **removed
the question**, and left the reason in the source
(`heltour/tournament/forms.py`) `[V]`:

```python
# Can commit
# We do not want to ask about this anymore, it was decided that it is a useless question. Hide it for now.
self.fields['can_commit'] = forms.TypedChoiceField(initial=True, widget=forms.HiddenInput, choices=YES_NO_OPTIONS)
```

What replaced it is **`weeks_unavailable`** — *"Indicate any rounds you would not be able to
play"*, a concrete per-round toggle, guarded by one validation rule: *"You can't mark yourself
as unavailable for all upcoming rounds"* `[V]`.

**A league that has run for a decade concluded that asking someone whether they are committed is
useless, and replaced it with asking them which specific days they cannot make.** That is a
transferable design result and it is the cheapest thing in this dossier: **intention is not a
signal; a per-occasion declaration is.** Every scheduling surface we ever build should ask the
second question and never the first.

### 1.4 Scale and longevity

From the league history (`/team4545/document/league-history/`), the season roster pages, and the
Lichess team page, all `[V]`:

- **Founded October 2015**: 11 teams of 4 boards, run by hand in Google Docs. The founders'
  stated motive: *"One of the things we wanted to improve from other leagues was higher team and
  cross team interactions. A lot of other leagues felt very opaque… there wasn't much of a
  community so we saw that slack would help us build that"* (@mkoga).
- **4,614 unique players and 47,452 games over 46 seasons.**
- Team count by season: 11 → 26 (S10) → 28 (S20) → **48 (S30)** → 40 (S40) → 46 (S45) → 42 (S48)
  → **44 (S49, current)**, boards rising 4 → 6 → 8. Season 49 fields **352 team players plus 121
  alternates**.
- Sister leagues concurrently: **LoneWolf #41 = 325 players** (226 Open, 99 U1800), Chess960 #42
  = 39. The Lichess team has **1,752 members**.
- **Prizes: none.** The Player Handbook answers its own "Are there any prizes?" heading with
  *"The 45+45 Team League is free to enter and offers no cash prizes"*, and the ToS confirms
  *"Signing up to the leagues requires no payment"* `[V]`.

**A weekly obligation to play a three-hour game against a stranger, enforced by cards, staffed
by volunteers, paying nothing, has run for a decade and roughly fifty seasons and is currently
near its largest size.** Whatever else is uncertain here, the mechanism sustains. Our own return
loop has been shipped for three days.

### 1.5 The result layer, and the status economy that replaces prizes

Game points 1 / 0.5 / 0; **match points** 2 / 1 / 0 for the team result; tiebreaks in order:
match points → game points → head-to-head → games won → Sonneborn-Berger; Swiss pairing seeded
on team average rating; **no playoffs** — the season is a flat 8-round Swiss decided on
tiebreaks `[V]`. (heltour *supports* playoff brackets; 4545 does not use them `[V]`.)

With no money in the system, the stakes are entirely status, and the mechanisms are worth
listing because they are all **non-numeric records of events**:

- **Permanent standings shading.** *"Gold indicates previous 1st place finishers. Silver…
  Bronze… Blue indicates players who previously won either the 'Best U1600' award in the U1800
  section or the 'Best U2000' award in the Open section"* `[V]` — **a result in season N marks
  your name in every future season's table.**
- A live **Most Active Players** board — #1 with **314 games across 45 seasons**, last played
  this week `[V]`.
- A **100 Games Club**, with veteran interviews in the newsletter `[V]`.
- An end-of-season **awards stream** and a community vote for **best team name** `[V]`.
- heltour's `SeasonPrize` model is keyed on `(rank, max_rating)` with **no monetary field
  anywhere** `[V]`.

### 1.6 There is no post-game requirement — and the rituals people invented anyway

*"**No, players do not need to report the results of their game.** Chesster will automatically
know when your game starts and ends"* `[V]`. The only compulsory post-game acts are
exception-handling: claiming a forfeit with a screenshot, or summoning a moderator when the
result did not auto-record.

What the community built voluntarily in that space:

- **Whispering.** Player Handbook: *"some players like to post their innermost thoughts on their
  games while they're in progress… Neither player can see any whispered messages — including
  their own — until after the game. **Some players whisper to record their in-game thoughts to
  aid their postgame analysis**"* `[V]`. **This is `design/05-in-run-experience.md` §1's first
  invariant — *"You commit before you learn anything"* — invented by hand, by players, with no
  product.** They wanted their pre-move belief preserved and sealed until the consequence had
  played out. That is our thesis, practised as a folk custom, and it is the single best piece of
  external validation in this dossier.
- **Game nomination** (capped at 3 per user in code) feeding **end-of-season reviews by outside
  titled players** — the FAQ names IM John Bartholomew, IM Christof Sielecki, IM Andras Toth, GM
  Niclas Huschenbeth and others `[V]`.
- **Community annotations** of key games, credited by handle `[V]`.
- **The Ledger**, a periodic newsletter of *"updates from all current leagues, a healthy
  smattering of statistics, and (occasional) chess education content"* — **dormant since issue
  #157, May 2023** `[V]`.
- **Pre-game opponent preparation.** *"Most league players take at least a little time before
  each game to look up their opponent's games… the best and most popular resource for this is
  **OpeningTree**… **The value of doing at least some preparation cannot be overstated**"* `[V]`.
  (OpeningTree is already a row in our competitor matrix, added by coverage sweep 2 `[V]`.)

And the prohibition that shapes all of it — Rules VII bans *"discussing any matter relating to
an ongoing game… with anyone else (**including a team captain**)"*, *"observing the spectator
chat of one's own game for any reason"*, opening books, and *"playing out variations on a Lichess
analysis (or other online) board during a game"*; the Captains' Guidelines put it in the most
emphatic language on the site: *"**DO NOT DO IT.** Unlike in some team events, no communication
with a player is allowed at all, not even discussing about draw offers"* `[V]`.

**So the league is, by rule, a zero-assistance environment, and every act of learning is
displaced to strictly before or strictly after the game.** That is the shape of the market gap:
the obligation is theirs, the rehearsal is unserved, and the volunteer newsletter that partly
served it has been dead for three years.

---

## 2. Why it works as a return loop, mechanically

**The claim under test:** the pull is social obligation and cadence, not content. **The claim
survives, and the rules are the evidence.**

Strip the chess out of §1.2 and what remains is: a published deadline you did not choose; a
named person waiting; a 24-hour negotiation clock; a bot that starts replacing you at hour 25; a
captain watching a dashboard of green checks and red crosses; an alternate whose weekend gets
rearranged; a card that follows you into next season; and a public table. **Not one of those is
a statement about chess.** The content of a league is an undifferentiated game of chess,
available free on the same site any minute of any day. The league adds nothing to the chess and
everything to the circumstances.

The organisers say so. The founders built it for *"higher team and cross team interactions"*
against leagues that *"felt very opaque"* `[V]`. The FAQ gives the last word to a moderator whose
entire answer is about other people: *"Most importantly of all, the league is a hell of a lot of
fun! **The camaraderie that you build with your team mates as the rounds progress is amazing,
There really isn't anything quite like cheering on your team-mate as he plays the deciding match
of the round, only to stare in horror at your screen as he plays a dubious Rook sac.** It's also
a great excuse to play some longer time control games and improve your chess"* `[V]`. **The
stated appeal of a chess league, by its own organisers, is watching someone else play; improving
is the clause after "also".**

Even the format changes were engagement interventions rather than chess ones — on the move to 8
boards: *"This was the first season to feature 8 boards, to huge success. The mods are obviously
biased, but we think **the bigger teams lead to more active teams**"* `[V]`.

### 2.1 The two levers, side by side

| | **Our return loop (shipped)** | **A league** |
|---|---|---|
| What brings you back | **Material you attempted** — resurfaced when due | **A person who is waiting** — a pairing published against your name |
| Who sets the timing | The scheduler, from your own history: the 1 / 3 / 7 / 16 / 35-day varied ladder `[V]` | The league calendar, identical for everyone, indifferent to you |
| What happens if you don't | Nothing. The item stays due, or you dismiss it (`POST /progress/schedules/:id` `dismiss`) `[V]` | A bot replaces you at hour 25; an opponent waits 20 minutes; a card is issued; two cards eject you |
| Who notices | **No one.** Every `/progress*` route is principal-scoped `[V]` | Opponent, captain, team, standings, moderators |
| Denominated in | Your own history | Someone else's expectation |

**Which lever is stronger? The honest answer is a split, and the split is the most important
result in this dossier.**

**On visibility of failure, the league's is stronger and it is not close.** Our loop's failure
mode is a queue that grows, visible to nobody — and, as §4 measures, we have no way to reach the
learner at all. The league's failure mode is a person at a board and a roster being rewritten.
And it converts: **92–95% of scheduled obligations become a played game** (§5.1).

**On causing anyone to return who would not have, the evidence runs the other way, and it is
randomised.** §5.4 sets it out in full; the headline is that the largest preregistered test of
this exact mechanism — prompting learners *"to make a plan to ask people to regularly check in
about their course progress"*, across ~250,000 students and 247 courses — moved week-one activity
and produced **no significant effect on completion** (β = 0.89 pp, 95% CI −0.22 to 1.99,
P = 0.115) `[V]`. **So the strength claim above is a claim about the mechanism's grip on people
already inside it, and must not be read as a claim that the mechanism recruits or converts.** §5
shows the 4545 population is heavily pre-selected and that its median entrant plays about one
season and leaves.

**The lever with the best randomised support turns out to be the one we already shipped** —
imposed, evenly **spaced** deadlines — and §5.4 explains why that is a genuinely lucky outcome
rather than a consolation.

### 2.2 The denomination this adds to the three we had

`design/research/fun-mechanics-outside-roguelikes.md` §10 enumerated the three things systems
without a power curve measure progress in: **(a) cadence and completion**, **(b) the learner's
own history**, **(c) the catalogue** `[V]`. A league is **none of the three**. It is a fourth:
**(d) another person's expectation** — the only one of the four that **cannot be shipped for a
single learner**, which is why a sweep of single-player games did not find it.

It is also not the daily we have already ledgered. `design/BACKLOG.md:381` (D301, one shared
position a day) is denomination (a): a cadence **the same for everyone and directed at no one**.
A league is a cadence **different for everyone and directed at exactly one other person**. A
daily can be missed invisibly; a pairing cannot. They are not the same idea at different sizes.

### 2.3 The obligation-free control: Chess.com "Leagues"

The word *league* is doing double duty in the market, and the other thing it names is the
cleanest available control for this dossier's central claim. Chess.com's Leagues
(<https://www.chess.com/leagues>) `[V]`:

- Eight one-way tiers — Wood, Stone, Bronze, Silver, Crystal, Elite, Champion, Legend `[P]`.
- **Divisions of 50**, resetting weekly: *"Every division starts and ends at 12pm PT (UTC -7)
  each Sunday"* `[V]`.
- Points accrue from **games you were going to play anyway** — *"regular game play, open seeks,
  arenas, and tournaments"* — weighted by time control (Bullet win 3, Blitz 9, Rapid 15) `[V]`.
- Promotion by finishing high in your division; **and the downside is deliberately removed**:
  *"**You can never go back down once you advance**"* `[V]`.
- **There is no pairing.** The page names no scheduled opponent, no fixed matchup, and no
  deadline to negotiate `[V]`.

**So the two systems sit at opposite corners, and the contrast is the finding.** 4545: a named
counterparty, a negotiation deadline, an auto-replacement bot, cards, ejection, no prizes,
roughly 473 people. Chess.com Leagues: a table, a weekly reset, no counterparty, no obligation,
no consequence for absence, a launch contest reported at $50,000 `[P]`, and a population in the
tens of millions.

**One caution about using it as the control.** Chess.com Leagues **scores behaviour that was
already happening** — it asks for no change and imposes no new occasion — so a retention number
for it would not test whether obligation causes return; it would test whether *a table alone*
causes extra play. The genuinely comparable object is a system that creates a new occasion
without creating a counterparty, and the closest ones are the 4545 community's own
*"Perpetually running"* leagues (Infinite Quest, Correspondence) where *"players can join, pause
or resume when they want"* `[V]`. **They exist, they run alongside the obligation league, and a
side-by-side retention comparison between them and the 8-round team league is the sharpest test
available anywhere.** Nobody has published one, and I could not run it.

What Chess.com Leagues *does* establish for us: **a ranked table is not the thing that makes a
league a return loop.** The largest table in chess by orders of magnitude has no obligation
attached to it at all. That is a point in favour of C1's transformation — if the pull is
obligation rather than the table, then refusing the table costs less than it first appears.

---

## 3. What we already ship

`design/03-product-breadth.md:81-92` and `docs/live-sessions.md` describe two-human play; the
code confirms it `[V]`:

- **`SESSION_KINDS = ["stream","academy","match"]`**, a closed enum (`live-types.ts:3`, SQL
  `CHECK` at `storage.ts:2309`).
- **A native match** is one position run with two learner seats; possession follows side-to-move;
  the server derives each move's actor from the seated learner, so clients cannot forge
  authorship (`docs/live-sessions.md:35-41`).
- **Live play is mainline-only**: rewind, fork, reveal, group/simulation mutations, duplicate and
  opposite-side replay return `MATCH_LIVE` (`service.ts:1728`, `:1739`).
- **Friend links already have a pairing's exact shape**: `session_join` tokens are **single-use**
  (`usesRemaining: 1`), **expiring**, optionally **locked to a named handle**, and can name a
  **colour seat** (`matchSlot: "white" | "black"`), ≤50 active per session
  (`live-session.ts:140-149`).
- **A game from any start position is a shipped object** — `POST /runs` with
  `session.kind = "position"` takes an arbitrary FEN (`rest.ts:389`).
- **Position Arena is already the "play it elsewhere, bring it back" path.** Two legs around one
  root, each importing a validated mainline-only PGN, recording the **human handle**, an
  **external challenge URL** (any HTTPS link — a Lichess challenge qualifies) and a
  **PGN-standard result** `'1-0' | '0-1' | '1/2-1/2' | '*'` (`storage.ts:2618-2628`,
  `live-session.ts:227-241`). This is precisely what a league needs if we never build clocks.
- **A directed invitation is already a persisted object with a lifecycle**:
  `session_invitations(leg, invited_handle, invited_role, external_challenge_url, state,
  created_at)` (`storage.ts:2608-2617`).
- **A calendar column already exists and is already load-bearing**: `live_sessions.scheduled_for`
  is the session list's primary sort key —
  `ORDER BY COALESCE(s.scheduled_for, s.created_at), s.id` (`storage.ts:1827`).
- **A real result seals**: `terminalOutcome` (`packages/runtime/src/outcome.ts:5`).

**So a league is a scheduling and standings layer over shipped play**, as the task supposed.

---

## 4. What genuinely does not exist

Term census over `apps/` and `packages/` (`.ts`/`.svelte`, tests excluded) `[V]`:

| Term | Hits | | Term | Hits |
|---|---|---|---|---|
| `roster` | **0** | | `notify` | **0** |
| `standings` | **0** | | `notification` | **0** |
| `leaderboard` | **0** | | `email` | **0** |
| `pairing` | **0** | | `webpush` / `web-push` | **0** |
| `season` | **0** | | `reminder` | **0** |
| `league` · `tournament` | **0** · **0** | | | |
| `forfeit` · `bye` · `captain` | **0** · **0** · **0** | | | |

Six specific holes behind those zeros, each verified:

1. **Nothing can reach a learner who is not on the site.** No email, no push, no notification of
   any kind, and the live platform *"uses authenticated polling rather than WebSockets or SSE"*
   (`docs/live-sessions.md:140`) `[V]`. `/learn` is a **pull** surface: `GET /progress/due`
   answers when you ask. **A league's entire mechanism is a message arriving when you are not
   looking.** Measure it against what §1.2 requires — a pairing DM, a 24-hour contact check, a
   25-hour auto-replacement, alternate offers 48 hours out at 8–12-hour intervals, a 21:30
   no-show ping, and result posting. **Chesster is twelve distinct notification behaviours and we
   have zero.** This is the largest missing piece and it is not chess-shaped at all.
2. **There is no way to discover another learner.** No directory route and no handle search in
   the HTTP surface; `/sessions` lists only sessions where you already hold a run grant
   (`storage.ts:1824-1828`) `[V]`. You must already know a handle out of band. A league needs a
   pool — Season 49's is 473 people.
3. **There is no organiser, by owner ruling.** *"No operator account exists (owner ruling
   2026-08-12/14). Administrative capability lives in environment and configuration, never a
   privileged user"* (`design/02-product-shape.md:71-73`) `[V]`. Every obligation in §1.2 —
   pairings, byes, cards, forfeit rulings, alternate promotion, manual registration review — is
   an act by a privileged human. **A league is not missing an admin screen; it is missing the
   role, and the role was refused on purpose.**
4. **The invitation lifecycle has a start state and no transitions.**
   `session_invitations.state` is written `'open'` by its only producer
   (`storage.ts:2030-2035`); **no code path updates it** — `accepted` and `revoked` are declared
   `CHECK` values with zero producers `[V]`. **The invitation ships; the acceptance, and
   therefore the non-acceptance, does not** — and non-acceptance is the whole obligation.
5. **A forfeit is inexpressible.** `arena_legs.result` is nullable and enum-checked, but its only
   writer (`importLeg`) requires a parseable PGN from the arena root
   (`live-session.ts:227-241`) `[V]`. **A forfeit is a result with no moves**, and no route can
   record one. §5 measures forfeits at 4–5% of all scheduled games, so this is week-one traffic,
   not an edge case — and the league needs **four** result kinds we cannot express: `1X`/`0F`
   (forfeit), `½Z` (scheduling draw), `H` (half-point bye) and `B` (full-point bye) `[V]`.
6. **Two-human play contributes nothing to the return loop.** `service.ts:1763` rewrites the
   projection to force **`countable: false`** on a match run's primary branch, and `#project`
   attributes attempts to `lease.learnerId`, the writer-lease holder at commit time — which in a
   match alternates with possession `[V]`. **Winning your Tuesday league game would put nothing
   on `/learn`.** Same disjunction D314 found for Just Play (`design/BACKLOG.md:394`).

Two smaller items: `scheduledFor` is accepted by the REST route (`rest.ts:984-989`) but the
browser client's `createLiveSession` **cannot send it** (`apps/web/src/lib/api.ts:632, :877`)
`[V]` — the calendar field is producer-less from the UI, as
`design/research/broadcast-and-teacher-surfaces.md` §2.3 reported; and native matches have *"no
clocks, ratings, matchmaking pool, resignation event, or agreed-draw event"*
(`docs/live-sessions.md:46`) `[V]`. A 45+45 game with no clock and no resignation is not a
league game.

### 4.1 Is a league the parked events row?

**Substantially yes.** `design/03-product-breadth.md:87-88` promises *"Arena and events:
scheduled pack nights, invitations, cohorts, two-leg position matches, team relays…"*, and
`design/BACKLOG.md:650` carries it as **Events layer** — *"named in design/03 §Live, deferred by
no one, covered by nothing"* `[V]`. `broadcast-and-teacher-surfaces.md` §4.4 already sharpened
it: the events layer and the missing teacher aggregate are *"one surface, not two — a roster with
a calendar"*, `scheduledFor` being *"the one persisted atom"* `[V]`.

A league is that aggregate from a third side, and it contributes the half neither framing named.
**A cohort is a roster with a calendar. A league is a roster with a calendar and a table.**
Verdict: **do not open a new parked row** — a league is the events row plus a result layer, and
the result layer is the genuinely new object because it is also the colliding one (§6).

---

## 5. Attrition, retention, and the causal question

**No controlled evidence exists on chess leagues specifically.** But — correcting this dossier's
own first draft — **controlled evidence on the underlying mechanism does exist, it is large, it
is preregistered, and it is against the hypothesis.** §5.4 is the section that matters most here
and it was nearly written as "no evidence found", which would have been a much weaker and much
more flattering conclusion.

The league's own data comes first, because it says two things at once.

### 5.1 The obligation converts at 92–95%

Computed from every published pairings page (method in §Method) `[V]`:

| Season | Boards | Pairings | Played | Forfeits | Scheduling draws |
|---|---|---|---|---|---|
| 10 | 26 × 6 | 624 | 558 | 60 (**9.6%**) | 6 (1.0%) |
| 20 | 28 × 8 | 896 | 827 | 60 (**6.7%**) | 8 (0.9%) |
| 30 | 48 × 8 | 1,536 | 1,392 | 111 (**7.2%**) | 33 (2.1%) |
| 40 | 40 × 8 | 1,280 | 1,187 | 53 (**4.1%**) | 40 (3.1%) |
| 45 | 46 × 8 | 1,472 | 1,337 | 81 (**5.5%**) | 54 (3.7%) |
| 48 | 42 × 8 | 1,344 | 1,283 | 52 (**3.9%**) | 9 (0.7%) |
| 49 (R1–6) | 44 × 8 | 1,056 | 972 | 55 (**5.2%**) | 29 (2.7%) |

**The table is cross-validated twice.** The Season 49 stats page reports 1,107 completed games,
exactly matching the independent parse of rounds 1–7 `[V]`. And Season 48 closes arithmetically:
42 teams × 8 boards × 8 rounds ÷ 2 = **1,344 scheduled pairings**, against 1,283 played + 52
forfeits + 9 scheduling draws = **1,344**, with the 1,283 confirmed by a separate fetch of the
season's own stats page (578 white wins + 194 draws + 511 black wins) `[V]`.

Three readings. **(a) The mechanism works**: ~92–95% of a scheduled obligation to play a
three-hour game against a stranger becomes an actual game. **(b) It has improved by roughly half
over ten years**, from 9.6% forfeits to ~4–5% — which is a decade of rule iteration (the cards,
the 3-times-across-2-days minimum, the before/after-round-start asymmetry, the auto-replacement
bot) doing measurable work. **(c) Within a season, flakiness converts into negotiation**:
across Season 49, forfeits fall 13 → 7 per round while scheduling draws rise 1 → 12 `[V]`. People
do not stop failing to play; they get better at failing *politely and in advance*, which is
exactly what rule 10 in §1.2 prices.

**And the cost of that 92–95% is enormous.** Season 49's alternates page, captured ~22 hours
before a round opened, shows **46 of 352 boards (13.1%) needing a substitute for a single round**,
supported by a bench of **121 alternates for 352 seats — a 34% bench-to-roster ratio**, up from
88-for-368 (24%) in Season 45 `[V]`. The Player Handbook is candid: *"**In the course of an
eight-week tournament, there are typically many changes and substitutions**"* `[V]`. The founders
are blunter: *"**Flakes were a huge problem at first**"* (@mkoga) and *"**It was a nightmare
finding alts at the very beginning**"* (@parrotz) `[V]`.

**So the 92–95% is not a property of the players. It is a property of a volunteer-run
replacement machine that keeps a third of a roster's worth of people on standby.** That is the
real answer to "why does a league work", and it is an operations answer.

### 5.2 The league does not retain the median entrant

**4,614 unique players and 47,452 games over 46 seasons** `[V]`. Taking 47,452 as games (each
involving two league players — consistent with the per-season stats pages, e.g. 1,283 games in
Season 48), that is **≈20.6 game-appearances per player, or about two-and-a-half seasons' worth
of an 8-game schedule, as a mean** `[M]` *(arithmetic mine; the league publishes no per-player
distribution)*. And the mean is heavily inflated by a documented long tail: the Most Active
Players board's top entries are **314 games / 45 seasons**, 303 / 45, 272 / 39, all still playing
this week `[V]`. **A mean of ~20 with a maximum of 314 means the median is far below the mean:
most people who join play about a season and leave.**

The organisers describe exactly that: *"In this season membership seemed to level off. **Every
season there are many folks joining but also many folks stepping away (both temporarily and
permanently)**"* `[V]`. Team counts bear it out — 11 → 48 → 40 → 46 → 42 → 44 — a plateau with
±10% churn and no secular decline `[V]`.

### 5.3 Selection is proven, and the league's own numbers cannot settle causation

Four mechanisms, each read off verified rules or data:

1. **Entry selects on the outcome variable.** An *"established classical rating on Lichess"* only
   exists if you have already chosen, repeatedly and unprompted, to play long games; a lapsed one
   must be re-established; registrations are manually reviewed `[V]`.
2. **The scheduling burden is a second filter, paid before any chess.** Three offers across two
   days inside 24 hours, then a 45+45 appointment that can run three hours `[V]`.
3. **The league removes non-returners by rule, mid-season.** Two cards is a red card and
   immediate withdrawal; *"Any player who misses two games in the season will be permanently
   replaced"* `[V]`. **So any within-season completion statistic — including my 92–95% — is
   definitionally conditioned on having returned**: the people who would depress it have been
   replaced from the bench by the time the season ends. **The league's own numbers cannot answer
   the causal question, because the rules delete the counter-evidence as policy.**
4. **And the population-level number points the other way from the anecdote.** §5.2's mean of
   ~20 games against a 314-game maximum says the league retains a **hard core**, not a
   population. The commenter who told the owner the league had *"a very positive impact on my
   chess learning"* is, on the league's own distribution, more likely to be in the tail than at
   the median. **That is precisely what selection looks like.**

**So: selection is proven — mechanisms 1 and 2 are documented entry filters, 3 is a documented
exit filter, and 4 is the shape of the resulting distribution.** The honest summary is that a
league is a **retention machine for people who were already going to play, plus a very effective
machine for converting *their* intentions into actual games** — and the second half is real,
measured at 92–95%, and is the part worth copying.

**What would move this.** The comparison worth running is not league-versus-no-league but
**alternates versus rostered players within one season**. Alternates have paid filters 1 and 2 in
full and then, by **queue position rather than motivation**, do or do not receive an obligation —
and heltour stores everything needed (`games_missed`, `SeasonPlayer`, the ordered alternate
queue) `[V]`. That is the closest thing to random assignment a league generates, it is produced
free every season, and nobody appears to have run it. **Naming that design is this dossier's
contribution to the causal question.**

**One caution for us.** Mechanism 3 means that if we ever conclude a league "worked", we will be
measuring our own ejection rule. Any league we build or import must record the **ejected**, the
**never-paired** and the **bench** alongside the finishers, or the retention number will be
survivorship dressed as effect — the same lesson `census-hint-false-positives.md` learned about
the alternatives axis.

### 5.4 The controlled evidence on the mechanism — and it is against us

This dossier's first draft concluded "no controlled evidence exists in either direction". **That
was wrong, and correcting it reverses the recommendation's centre of gravity.** Scheduled social
accountability in learning has been randomised, repeatedly, at very large n, and it does not
produce completion.

**The direct test of the exact mechanism, preregistered, n ≈ 250,000.** Kizilcec, Reich, Yeomans,
Dann, Brunskill, Lopez, Turkay, Williams & Tingley (2020), *PNAS* 117(26):14900–14905 — 247
courses across Harvard, MIT and Stanford over 2.5 years. One arm prompts students *"to make a
plan to ask people to regularly check in about their course progress"* — social accountability,
isolated. **Effect on completion: β = 0.89 pp, 95% CI −0.22 to 1.99, P = 0.115.** Plan-making,
mental contrasting and value-relevance arms were also null. It *did* raise week-one activity
(β = 0.0788, P = 0.006) with a sustained activity effect (β = 0.0939, P < 0.001) — **and still
never converted into completion.** Single-course versions of these same interventions had
previously reported +29% and 17%→41%; at scale, effectiveness dropped *"by an order-of-magnitude"*
`[V]` — <https://www.pnas.org/doi/10.1073/pnas.1921417117>.

**Scheduling itself, randomised, n = 18,043, came back negative.** Baker, Evans & Dee (2016),
*AERA Open* 2(4): all enrolled students randomly assigned, treatment = an offer to schedule when
to watch lecture 1. Weakly significant **negative** effects; **treatment-on-treated −4.8 pp on
certificate attainment against a 9.3% control rate — a 52% relative reduction.** The authors are
explicit that they are confident the result was causally driven by the scheduling suggestion and
that they find it surprising `[V]` — <https://files.eric.ed.gov/fulltext/EJ1194402.pdf>.

**The only true cohort-versus-solo RCT of the same course found the cohort arm worst.** Russell,
Kleiman, Carey & Douglas (2009), *JRTE* 41(4):443–466 — 231 teachers stratified and randomly
assigned to four conditions of one 8-week course, from a fully supported scheduled cohort
(instructor + facilitator + peer discussion, moving together) down to pure self-paced with no
feedback. **Dropout: 53% fully supported cohort · 41% facilitated peer · 45% instructor-only ·
44% self-paced — not significant, and the cohort arm was directionally the worst.** Learning
gains comparable across all four `[V]` — <https://files.eric.ed.gov/fulltext/EJ844275.pdf>.

**The "cohorts complete at 85–96%" story that makes leagues sound obvious is not evidence.**
Every high figure traced back to a vendor, a founder, or an uncited marketing page: altMBA's 96%
originates with its own co-founder and appears nowhere on the current site; EdSurge's *"5% to
85%"* resolves to 2U's own impact report, a student-publication quote, and a figure written by an
author employed by the company being cited — all paid programmes, zero peer-reviewed sources; a
widely repeated *"72%, per a Research.com meta-analysis"* is **unverifiable — the page contains no
completion statistics at all when fetched** `[P]`. The one figure with a stated denominator
(Ruzuku, ~32,000 courses: 64.2% cohort vs 48.2% self-paced) is written by the founder and the
page itself concedes cohorts charge 2–5× more without controlling for it `[V]` —
<https://www.ruzuku.com/learn/articles/cohort-vs-self-paced>. **Where cohort structure is
randomised, the effect collapses**: MDRC's learning communities, ~7,000 students randomly
assigned across six colleges, produced **+0.5 credits and no measurable effect on college
persistence**; the best single site (Kingsborough, 1,500+ randomised, seven-year follow-up) got
**35.9% vs 31.3% degree completion, +4.6 pp**, bundled with extra credits, tutoring and textbook
vouchers, and MDRC states the research cannot say which component mattered `[V]` —
<https://www.mdrc.org/work/publications/effects-learning-communities-students-developmental-education>.

**The MOOC baseline everyone contrasts against is itself partly a denominator artefact.** Reich &
Ruipérez-Valiente (2019), *Science* 363(6423):130 — 565 course iterations, 12.67M registrations
from 5.63M learners: **52% of registrants never enter the courseware**, completion fell 4.96% →
3.13% across five years, but **intenders complete at 15.42% and the paying verified track at
46–56%** `[V]`. Jordan (2015) put the median at **12.6%** across 129 MOOCs and found attrition is
front-loaded into weeks 1–2, after which participation varies by **less than 3%** `[V]`. Celik &
Cagiltay (2024) recompute the same four courses three ways: **30.02% traditional, 43.08%
active-learner, 48.13% intention-based** `[V]`. **So much of the famous gap is payment and
denominator before format enters at all.**

**The real-world case that should settle intuitions.** parkrun — free, weekly, scheduled,
intensely social, no cost to attend — across **223,224 Australian participants** tracked over
their first three years: **76.4% are "Few-Timers"** (~4 attendances in three years), 12.4%
decliners, 6.9% low maintainers, and **4.3% high maintainers** `[V]` — *Health Promotion
International* 39(4) daae098,
<https://academic.oup.com/heapro/article/39/4/daae098/7736270>. **A weekly scheduled social
community event retains about 4% of the people who join it.**

**And the exercise literature says gathering people is not the ingredient.** Burke, Carron, Eys,
Ntoumanis & Estabrooks (2006), 44 studies / 214 effect sizes: deliberate group-dynamics work
("true groups") beats standard exercise classes at **d = .74**, but a standard class versus
home-based-with-periodic-phone-contact is **d = .09, n.s.**, and on objectively measured adherence
the class advantage is **d = .27, CI −.08 to .63, n.s.** `[V]`. Milkman et al. (2021), *Nature*
600:478–483 — **61,293 gym members, 53 conditions**: 45% of interventions raised visits 9–27%, but
**only 8% produced change still measurable four weeks after the programme ended**, and the social
arms are incoherent — *"Social Norms Shared (High and Increasing)"* ranked **3rd of 53** while
*"Social Norms Shared (High)"* ranked **53rd of 53, last** `[V]`. Notably, **no arm was an actual
scheduled group or a real human partner** — every "social" condition was messaging, so the closest
analogue to a league is untested even there.

**What DOES have durable randomised support is spacing, and cost.** Ariely & Wertenbroch (2002),
*Psychological Science* 13(3):219–224: **externally imposed, evenly spaced deadlines beat
self-set ones** (M = 88.76 vs 85.67, t(97) = 3.03, p = .003; final project 86 vs 77, p < .001) —
and, decisively for us, **restricting the self-imposed group to those who happened to space evenly
cut the effect sizes by 55–79% and killed significance, so the mechanism is *spacing*, not
self-imposition or commitment.** There is **no social component anywhere in the study**. It also
found structure made people work more and **enjoy it less** (liking 22.1 / 28.12 / 37.9,
p < .001) `[V]` — <https://web.mit.edu/ariely/www/MIT/Papers/deadlines.pdf>. Where commitment
devices do produce durable change, the binding agent is **money**: Royer, Stehr & Sydnor (2015),
*AEJ:Applied* 7(3) — 1,000 employees randomised, incentive alone left only 25% of the gain after
one month, incentive plus a **self-funded commitment contract** retained half and was still
detectable at 20–25% a year later, on **12% take-up** `[V]`; Giné, Karlan & Zinman (2010),
*AEJ:Applied* 2(4) — 2,000 smokers, deposit contract, **11% take-up, +3 pp** quitting at six
months, persisting to a surprise 12-month test `[V]`; Patterson (2018), *JEBO* 153:293–321 —
+11 pp completion, but from an **18% take-up** slice who installed monitoring software, were paid
$12, and were 85% college-completed, with the author stating the sample *"is not
representative"* `[V]`.

**Two heterogeneity findings that aim straight at our audience.** Zhou et al. (2023), *Internet
and Higher Education* 59 — an RCT of study-together groups helps low-achieving and less-motivated
students and **mildly hurts time management for highly motivated ones** `[P]`. And Burke et al.'s
result above says periodic contact does about as well as attendance. **A chess drill product's
users self-select as motivated, which is exactly the group the sociality literature says gains
least and can lose.**

**What this means for §2.1's claim.** The mechanism's grip on people already inside it is real
and measured (92–95%). Its power to make someone return who otherwise would not is **tested and
null-to-negative in every large randomised analogue available**, and the one free weekly
scheduled social event with public longitudinal data retains 4.3%. **The league is a container
for the committed, not a converter of the uncommitted** — which is exactly what §5.1–5.3 read off
the league's own rules and data, arrived at independently.

**And the corollary is the best news in this dossier.** The intervention with the cleanest
randomised support is *imposed, evenly spaced deadlines* — which is a description of
`return-and-progression`'s **1 / 3 / 7 / 16 / 35-day varied ladder**, shipped 2026-08-13 `[V]`.
**We already built the lever the evidence supports and were about to be talked out of it by a
lever the evidence does not.** The one transferable upgrade is narrow and cheap: Ariely's effect
came from deadlines that were **imposed**, and ours is fully dismissible
(`POST /progress/schedules/:id` `dismiss`) with no consequence and no record `[V]`. **Making the
spacing feel imposed — not adding a person — is what the evidence licenses.**

---

## 6. The collisions, named

The standing ruling applies: *"a conflict with an invariant is a design prompt, not a veto…
Rulings constrain the **form** a feature takes, never its existence"*
(`design/02-product-shape.md` §Adoption posture amendment, owner 2026-08-14) `[V]`. Each
collision is given with the transformation that survives it, except one.

### C1 — The leaderboard refusal ⚠️ **owner ruling wanted**

`rfc/learner-rating.md` §8 **R10** refuses *"**Leaderboards and cross-learner comparison** of any
kind"*, on Barth's *"the only thing a global leaderboard manages to tell you is that you suck
(and not even by how much)"* and *"a fantastic incentive for cheating"*, plus *"the population is
the learner's own history, never other learners"* `[V]`. Its scope boundary independently
excludes *"any cross-learner surface"* (`:176`), and the shipped copy says it three times —
milestones *"never add a skill percentage, score, streak, rating, ranking, or cross-learner
comparison"* (`docs/return-and-progression.md:48-49`) `[V]`.

**A league standing is a ranked table of learners, and no league exists without one.** I do not
propose to transform this away, for three reasons:

1. The refusal is **days old and deliberate** (RFC drafted 2026-08-16), one of fourteen each
   written as a named acceptance test (§AC-1: *"Each must be refused **by name**, not by
   absence"*) `[V]`.
2. **Its cheating rationale is now observed, not predicted.** The 4545 history records that
   **cheating investigations affected the final standings in Seasons 7, 8 and 17**, in some cases
   forcing tiebreakers to be re-applied `[V]`; the ToS bakes in permanent exclusion for prior
   cheat marks and treats closing your account mid-season as cheating, converting **all** your
   season's games to forfeit losses `[V]`. So the clearest real-world instance of a ranked
   amateur chess table produced repeated scandals and a body of anti-cheat rules. Against that,
   our accepted limitation is explicit that we do **not** prevent self-cheating: *"it does not
   pretend to prevent a host from cheating on themselves"* (`docs/live-sessions.md:132-138`)
   `[V]`. **A product that declines to police self-cheating should be very slow to publish a
   table that rewards it.**
3. **But a real distinction is available, and it belongs to the owner.** R10 refuses ranking
   learners by **a number the product manufactured about them**. A league table ranks by **what
   happened** — wins, draws and losses against named opponents — which is the same object class
   the owner ruled admissible as `corpus_observed` on 2026-08-15 (`design/BACKLOG.md:397`, D332:
   *"It says **what happened**, never **what was good**"*) `[V]`. **Whether that distinction is
   load-bearing or a loophole is a ruling, not a researcher's call.**

**Recommendation: escalate, do not route around.** If the distinction holds, R10 should be
reworded to say *what* it refuses (a manufactured skill number compared across learners) rather
than *what shape* it refuses (a table) — as written it also forbids a record of game results
that nothing in its rationale objects to.

**One transformation worth putting in front of the owner alongside it**, because the league
itself found it: the **permanent shading** mechanic (§1.5) — a past result marks your name
forever, with **no number and no ordering**. That is an honour roll, not a leaderboard, and it is
the same object class as our shipped milestones. If the ruling goes against the table, the
shading survives it intact.

### C2 — ADR-0007 is clean, and the league proves the point

ADR-0007: *"**Progression is never monetized**"* (`design/BACKLOG.md:738`, owner override only)
`[V]`. **A decade-old league with 4,600 participants pays nothing** — *"free to enter and offers
no cash prizes"*, *"Signing up to the leagues requires no payment"*, and heltour's prize model has
no monetary field `[V]`. **ADR-0007 is not merely un-violated by a league; the largest working
example of the mechanism is evidence that the status economy alone is sufficient.** ADR-0007
becomes live only if a season ever gains a prize, sponsor or entry fee, all three of which it
already forbids without further ruling.

The nearer clause is **D334** (owner, 2026-08-16): *"winning may unlock **convenience** and
**variety**, never **content**"* (`design/BACKLOG.md:399`) `[V]`. 4545's alternate-queue
priority — *"Any player that received a red card in a season will get low priority for a spot on
a team"* `[V]` — is **convenience gated on conduct**, squarely inside the ruled envelope.
Priority gated on *results* would not be.

### C3 — The thesis's own mechanism 1 ⚠️ the sharpest one

`design/00-thesis.md:76-79`: *"**Experimentation without cost.** …preserved branches make trying
something free… **Every other context charges you a lost game for that curiosity**"* `[V]`.

**A league is, precisely and by design, "every other context".** It charges a lost game, a team
match point and a place in the table. This is not a rules conflict — it is the product's stated
first reason for existing, pointed at the feature.

**The transformation is available, and §1.6 is the proof that the community already performs
it**: the league bans every form of in-game assistance including talking to your captain, and
displaces all learning to strictly before (OpeningTree prep, *"cannot be overstated"*) or
strictly after (whispers, nominations, titled reviews, annotations) the game `[V]`. **The league
is where you find out; the rehearsal is what happens around it.** That is our product's shape.
It argues we should be the **companion** to a league, not the host of one — and it must be said
out loud, because a league *inside* the drill product would make the headline promise conditional
on which mode you are in.

Note the boundary already exists in code and points the right way: rated runs refuse rewind and
fork (R11) and refuse every assistance route for the whole run (§5.2, via the shipped
`ASSISTANCE_WITHHELD`) `[V]`, and live match play refuses rewind/fork/reveal with `MATCH_LIVE`
`[V]`. A league game would sit on the counting side of a line we already drew.

### C4 — The pause is a hole in any result that matters

*"A pause is consent to use the ordinary rehearsal loop: a write-capable member may claim,
rewind, fork, compare, and reveal"* (`docs/live-sessions.md:49-52`) `[V]`. Two consenting players
in a league game could pause and analyse — and 4545 bans exactly this, for exactly this reason
(§1.6's *"DO NOT DO IT"*). **The mutually-accepted pause is right for a coached game and wrong
for a competitive one.** The fix is cheap: `session.kind` is a closed enum that prior work found
**decorative** — `broadcast-and-teacher-surfaces.md` established there are exactly two
behavioural branches in the whole server reading it, both requiring `match` `[V]`. A competitive
kind is a place to put behaviour with nowhere else to live.

### C5 — No operator, no league

Restated as a collision: a league requires a tournament director, and
`design/02-product-shape.md:71-73` refused the privileged user by owner ruling `[V]`. And the
role is not small — §1.2 shows 4545's moderators ruling on reasonable effort, awarding draws
versus forfeits, approving registrations by hand, and adjudicating forfeit appeals. Two
transformations survive: **(a) the league is external and we only import its games** — which
Position Arena already supports; or **(b) organiser capability is per-league and delegated**, so
a league creator is privileged inside their own league and nowhere else — the same shape as the
shipped run-grant model, and **not** a platform operator account. **(b) is the version that
survives the ruling** and should be named as such if this is ever designed.

### C6 — The population we do not have

`design/BACKLOG.md:711` records the owner's own framing — the validation design *"assumes user
cohorts we will not have (**'I don't expect much usage'**)"* — and
`fun-mechanics-outside-roguelikes.md:1039` states it flatly: *"this deployment has one learner"*
`[V]`. Season 49 fields **352 rostered players plus a 121-deep bench**, and §5.1 shows the bench
is not decoration — it covers 13% of boards in a single round `[V]`. **A league is the one
return-loop mechanism in the design space whose minimum input is a population, and it needs not
just players but *spare* players.** This is a feasibility ceiling, not a doctrinal collision, and
it is why §7's verdict is import-don't-host.

### C7 — The one place a league is a *gift*

`rfc/learner-rating.md` Open question 6: *"**The human anchor.** Nothing here measures a human
against a band. The experiment is well-defined and cheap — learners with known Lichess rapid
ratings play a fixed schedule against the four rungs… Until it runs, **R7 is permanent**. **This
is the single highest-value unrun experiment this RFC creates**"* `[V]`. R7 is the refusal to
publish our rating as an external-scale equivalent, *"because the anchor is unmeasured; the whole
calibration is engine-vs-engine"* `[V]`.

**A league is a machine that produces exactly that data.** Its entry gate *requires* an
established classical Lichess rating, so every participant arrives carrying a known external
number `[V]`; its output is a fixed weekly schedule of **whole, unassisted, rewind-free games**
(assistance is banned by rule, §1.6) against opponents whose external ratings are also published;
and its board-seating rule pairs you *"usually within 100 points"* of your own rating `[V]`.
**That is a better-controlled human-anchor dataset than the experiment the RFC proposes to run**,
and it needs no league of our own — importing games from one would do. This is the strongest
composition argument in the dossier.

---

## 7. Verdict

**A league is a real and previously unconsidered return-loop shape; it is the parked events row
plus a standings layer; the mechanism is obligation rather than content; and we should not host
one.**

1. **The mechanism is confirmed and contains no chess.** Every rule in §1.2 is about deadlines,
   counterparties and consequences. The organisers' stated appeal is camaraderie and watching a
   team-mate play. **A league brings you back because someone is waiting.**
2. **It grips the people already inside it far harder than ours does, and that is measured**:
   92–95% of scheduled obligations convert into a played game, improving from 9.6% to ~4%
   forfeits over a decade of rule iteration — though the conversion is bought by a volunteer
   replacement machine and a bench worth a third of the roster (§5.1).
   **But it does not convert anyone**, and this is the finding that changes the recommendation
   (§5.4): the mechanism has been randomised at n ≈ 250,000 and produced **no significant effect
   on completion** (P = 0.115) while moving week-one activity; a scheduling nudge at n = 18,043
   **halved** certificate attainment among takers; the only cohort-vs-solo RCT of one course found
   the scheduled cohort arm **directionally worst**; and parkrun — free, weekly, scheduled,
   social — retains **4.3%** of joiners over three years. **A league is a container for the
   committed, not a converter of the uncommitted.**
3. **We could express more than expected and less than needed.** Play, seats, single-use
   colour-locked invitations, external handoff, PGN import with a result, and a calendar column
   all ship. Roster, standings, pairings, seasons, byes, forfeits, an organiser, notifications of
   any kind, and any way to find another learner do not — and **the missing pieces are almost
   entirely not chess-shaped**, which is the good news (nothing about them threatens law 8) and
   the bad news (they are a different product's worth of plumbing).
4. **The leaderboard refusal is hit head-on and needs an owner ruling** (C1), with the league's
   own **permanent shading** as the honour-roll transformation if the ruling goes against a table.
   And the cost of refusing looks lower than it first appears: **the table is not the lever**
   (§2.3) — Chess.com's Leagues is the largest ranked table in chess and has no obligation
   attached to it at all. ADR-0007 is untouched and in fact **corroborated** (C2). Everything
   else transforms.
5. **Selection is proven; causation is not merely unestablished but tested and null-to-negative.**
   The league's rules make its own numbers unable to settle it (two documented entry filters, one
   documented mid-season exit filter, and a distribution whose *median* entrant plays about one
   season and leaves, §5.2–5.3) — and independently, every large randomised test of scheduled
   social accountability in learning has come back null or negative (§5.4). The high
   cohort-completion figures that make leagues sound obvious trace to vendors and founders, not
   to studies.
6. **The lever with the best randomised support is the one we already shipped.** Ariely &
   Wertenbroch's deadline effect is **spacing**, not commitment and not sociality — the study has
   no social component at all, and restricting to participants who spaced evenly killed the
   effect. That is a description of `return-and-progression`'s 1 / 3 / 7 / 16 / 35-day ladder.
   **The one upgrade the evidence licenses is making the spacing feel imposed rather than freely
   dismissible — not adding a person.**
7. **The attractive composition is the inverse of the one proposed.** Not "build a league into the
   drill product", but **"be the rehearsal surface a league's players use between rounds"** —
   which is what the 4545 community already built by hand and cannot sustain: the whisper
   convention *is* commit-before-you-learn; game nomination and titled reviews *are* the review
   surface; the Ledger *was* the return artefact and has been dead since May 2023; and
   OpeningTree — already in our competitor matrix — is what they use for prep. It needs no
   organiser, no operator account, no notification system and no population of our own, and via
   C7 it is the cheapest route to the human anchor `learner-rating` calls its highest-value unrun
   experiment.

**Recommended disposition: DEFER the hosted league; SCOPE the import path.** The trigger for
revisiting the hosted version is C6's, and it should be stated as a number rather than a feeling:
not designable here until there are enough learners to fill one section **with a bench**. §5.4
strengthens this from a feasibility call into an evidence-backed one — **building the obligation
layer would be building the intervention that has failed every large randomised test of it**,
while the spacing layer that has passed them is already shipped.

**The finding to escalate, because it cuts against this dossier's own first draft.** The
originating owner-supplied testimony (*"a very positive impact on my chess learning"*) is
consistent with everything measured here and still does not support building a league: on the
league's own distribution that commenter sits in a tail whose members play 300+ games across 40+
seasons, and the randomised literature says the structure around them is not what put them there.
**This is the shape law 6 exists for — evidence found against an attractive idea is the job
working.**

**And one thing to adopt immediately, at zero cost** (§1.3): the league removed *"can you
commit?"* as *"a useless question"* and replaced it with a concrete per-round availability
declaration. **Intention is not a signal; a per-occasion declaration is.** Any scheduling surface
we ever build should ask the second question and never the first.

---

## 8. Proposed ledger rows (report-only — `design/BACKLOG.md` not edited, per instruction)

1. **New row — "The league as a return-loop shape (denomination (d): another person's
   expectation)"** 💡, tagged `return loop, events layer, B5, Q1b`. Mechanism is obligation and
   cadence, not content; 92–95% conversion measured; fourth progression denomination beside
   cadence / own-history / catalogue; **DEFER-hosted / SCOPE-import**, trigger = a population that
   fills one section with a bench.
2. **Amend `design/BACKLOG.md:650` (Events layer)** — *"a league is this row plus a standings
   layer; `broadcast-and-teacher-surfaces.md` already merged it with the teacher aggregate as 'a
   roster with a calendar' — a league is 'a roster with a calendar **and a table**'. Do not open a
   third row."*
3. **⚠️ Owner-facing — "Does R10 refuse the table, or the number?"** Plus the **permanent-shading
   honour roll** as the transformation that survives either ruling.
4. **💡 Adopt now — replace intent with per-occasion availability.** 4545 deleted its
   commit-affirmation as *"a useless question"* and shipped `weeks_unavailable` instead. Applies
   to any scheduling surface, including D301's daily.
5. **📊 External validation — the whisper convention is our first invariant, invented by
   players.** *"Some players whisper to record their in-game thoughts to aid their postgame
   analysis"*, sealed until the game ends. Evidence for `design/05` §1 and for Q1b.
6. **💡 The Book Club league is our product assembled by hand** — a chapter of theory a week,
   paired with games chosen to cement it. Demand signal, Q1b.
7. **🐞 Defect — `session_invitations.state` has one producer and no transitions.** `accepted`
   and `revoked` are declared `CHECK` values with zero producers repo-wide.
8. **🐞 Defect — a result-without-a-game is inexpressible.** Only `importLeg` writes
   `arena_legs.result` and it requires a parseable PGN; forfeit, scheduling draw, half-point bye
   and full-point bye have no representation.
9. **🐞/📊 — two-human play and the return loop are disjoint.** `service.ts:1763` forces
   `countable:false` on a match run's primary branch; attempts follow the alternating writer
   lease. Second instance of D314's finding.
10. **New row — "Nothing in this product can reach a learner who is not on the site."**
    `notify`/`notification`/`email`/`webpush`/`reminder` = 0; Live polls. Precondition for **any**
    cadence-based return mechanism, D301 included. Reference scale: Chesster is twelve distinct
    notification behaviours.
11. **New row — "There is no way to discover another learner."** No directory route, no handle
    search; `/sessions` is grant-scoped. Every social surface assumes the handle arrived out of
    band.
12. **📊 The obligation-free control, partly answered (§2.3)** — Chess.com Leagues is a weekly
    50-player division table over *"regular game play, open seeks, arenas, and tournaments"*,
    with **no pairing, no deadline and no downside** (*"You can never go back down once you
    advance"*). **A ranked table is therefore not what makes a league a return loop** — the
    largest table in chess has no obligation attached — which lowers the cost of C1's refusal.
    **Residual test, not run:** 4545's own perpetual join-and-pause leagues (Infinite Quest,
    Correspondence) versus its 8-round obligation league, side by side in one community.
13. **Research follow-up (the causal design)** — alternates versus rostered players within one
    season, per §5.3. heltour stores everything needed.
14. **📊 ⚠️ The evidence is against the obligation lever, and FOR the one we shipped (§5.4).**
    Scheduled social accountability randomised at n ≈ 250,000: **P = 0.115 on completion**. A
    scheduling nudge at n = 18,043: **−4.8 pp TOT, a 52% relative reduction**. The only
    cohort-vs-solo RCT: cohort arm **directionally worst**. parkrun: **4.3%** three-year
    maintainers of a free weekly scheduled social event. Meanwhile Ariely & Wertenbroch's deadline
    effect is **spacing, with no social component**, and imposed spacing beats self-set — which is
    `return-and-progression`'s 1/3/7/16/35 ladder. **Record as validation of the shipped return
    loop**, and as the reason the league stays deferred on evidence rather than only on
    population.
15. **💡 The one licensed upgrade to the shipped loop: make the spacing imposed, not
    dismissible.** Today `POST /progress/schedules/:id` `dismiss` is free, silent and unrecorded.
    Ariely's effect came from *imposed* deadlines. Cheapest evidence-backed improvement to the
    return loop available, and it needs no second human. **Caveat from the same study: imposed
    structure made people work more and enjoy it less** — which is the gamification-backlash row
    (`BACKLOG:580`) arriving from a second direction.
16. **📊 Heterogeneity warning for the whole campaign cluster.** Study-together RCTs help
    low-achieving and less-motivated learners and **mildly hurt time management for highly
    motivated ones**; and in the exercise meta-analysis, periodic contact performs about as well
    as attendance (class vs home-with-phone-contact **d = .09, n.s.**). **Our users self-select as
    motivated — the group sociality helps least.**

---

## 9. What this dossier does not establish

- **Only one other league form was surveyed.** Chess.com's Leagues are covered (§2.3) and settle
  the structural half of the question — a table with no obligation. **Lichess team battles /
  Swiss / arena, Chess.com daily team matches, and the professional team leagues are not
  covered**, and neither is the comparison that would actually test the claim: the 4545
  community's own perpetual, join-and-pause leagues against its 8-round obligation league
  (§2.3). That comparison is the largest remaining evidence gap.
- **No controlled evidence on chess leagues specifically.** §5.4's randomised evidence is on
  online courses, gyms and a running event — the closest available analogues, not the thing
  itself. **Nothing anywhere tests scheduled social commitment in *skill practice* as opposed to
  course completion or attendance**, which is precisely the cell a chess league occupies. No
  randomised trial assigns learners to a paid, application-gated, scheduled cohort versus a solo
  self-paced version of the same product, and no study decomposes the cohort bundle into
  schedule / deadline / price / gate / instructor / peer visibility. Treat §5.4 as strong
  evidence about a neighbouring cell, not a direct refutation.
- **No rating-gain data** for league participants, despite leagues holding exactly the data
  needed.
- **Two claims surfaced during research and deliberately excluded for lack of a citation I
  hold**: that the top 10% of Lichess4545 players account for ~40% of games, and that Chess.com
  discontinued its flagship league on commitment cost. Both would strengthen §5.3 and §2.3 if
  verified; neither is asserted here. Named so a later pass can chase them.
- **No published attrition figures.** Everything in §5.1 is **computed by parsing pairings pages**
  — the league publishes no dropout, card-count or retention aggregate, its former stats site
  (`rahulan-c.github.io/lichess4545-stats`) now **404s**, and the Ledger stopped at #157 in May
  2023. `[V]` on the dead sources; the computations are reproducible but are not the league's own
  numbers.
- **§5.2's per-player mean is my arithmetic**, marked `[M]`, over a published total the league
  does not break down. The direction of the finding is safe (mean ≈20 against a maximum of 314
  forces a low median); the exact figure is not.
- **The rendered registration form's consent copy** was read from `heltour`'s form definitions,
  not the logged-in page; the `agreed_to_tos` / `agreed_to_rules` label strings are unverified.
- **Season 49 round 7 shows 171 pairings where 176 were expected**; the 5-pairing shortfall is
  flagged, not explained.
- **The originating Reddit comment is unverifiable in this environment** (`[P]`, owner-supplied).

---

## 10. Sources

**Primary — league (all fetched, `[V]`)**

<https://www.lichess4545.com/> ·
`/team4545/document/rules/` · `/document/faq/` · `/document/terms-of-service/` ·
`/document/captains/` · `/document/league-history/` · the Player Handbook ·
`/lonewolf/document/rules/` · `/lonewolf/document/faq/` · `/chess960/document/rules/` ·
`/team4545/season/{1,10,20,30,40,45,48,49}/rosters|standings|stats|alternates/` ·
`/team4545/season/{N}/round/{R}/pairings/` · `/team4545/active_players/` ·
`/team4545/document/stats-awards/` (stale; its linked stats site 404s) ·
<https://lichess.org/team/lichess4545-league> ·
Ledger blog: <https://lichess.org/@/Ledger4545/blog/season-45-has-begun/IrwWL1fj> ·
the community-league overview doc linked from the FAQ

**Randomised and observational evidence on the mechanism (§5.4)**

Kizilcec et al. (2020) *PNAS* 117(26) — <https://www.pnas.org/doi/10.1073/pnas.1921417117> ·
Baker, Evans & Dee (2016) *AERA Open* 2(4) —
<https://files.eric.ed.gov/fulltext/EJ1194402.pdf> ·
Russell, Kleiman, Carey & Douglas (2009) *JRTE* 41(4) —
<https://files.eric.ed.gov/fulltext/EJ844275.pdf> ·
Reich & Ruipérez-Valiente (2019) *Science* 363(6423) —
<https://dspace.mit.edu/bitstream/handle/1721.1/136215/post_print-MOOC_Pivot.pdf> ·
Jordan (2015) *IRRODL* 16(3) — <https://files.eric.ed.gov/fulltext/EJ1067937.pdf> ·
Ho et al. (2015) HarvardX/MITx Year-2 —
<https://dspace.mit.edu/bitstream/handle/1721.1/96825/SSRN-id2586847.pdf> ·
Celik & Cagiltay (2024) *Open Praxis* 16(3) —
<https://doi.org/10.55982/openpraxis.16.3.606> ·
MDRC learning communities —
<https://www.mdrc.org/work/publications/effects-learning-communities-students-developmental-education> ·
Ariely & Wertenbroch (2002) *Psych Science* 13(3) —
<https://web.mit.edu/ariely/www/MIT/Papers/deadlines.pdf> ·
Royer, Stehr & Sydnor (2015) *AEJ:Applied* 7(3) — <https://www.nber.org/papers/w18580> ·
Giné, Karlan & Zinman (2010) *AEJ:Applied* 2(4) ·
Patterson (2018) *JEBO* 153 —
<https://ecommons.cornell.edu/server/api/core/bitstreams/e1416733-677d-40cd-aa2e-689e5900c394/content> ·
Milkman et al. (2021) *Nature* 600 — <https://www.nature.com/articles/s41586-021-04128-4> ·
Burke et al. (2006) —
<https://pure-oai.bham.ac.uk/ws/files/2920673/BurkeNtoumanisGroupIndividualApproach.pdf> ·
parkrun retention, *Health Promotion International* 39(4) daae098 —
<https://academic.oup.com/heapro/article/39/4/daae098/7736270> ·
Zhou et al. (2023) *Internet and Higher Education* 59 `[P]` ·
Zhang, Allon & Van Mieghem (2017) *M&SOM* 19(3) `[P]` ·
vendor cohort-completion claims audited and rejected: altMBA `[P]`, EdSurge
<https://www.edsurge.com/news/2019-06-06-moving-from-5-to-85-completion-rates-for-online-courses>,
Ruzuku <https://www.ruzuku.com/learn/articles/cohort-vs-self-paced>

**Primary — the obligation-free control (`[V]`)**

<https://www.chess.com/leagues> · tier names and promotion thresholds corroborated `[P]` from
community blog posts surfaced in search, not from a support article (the support URL tried
404s).

**Primary — the league's own software (`[V]`)**

<https://github.com/Lichess4545/heltour> — `heltour/tournament/forms.py` (the removed
`can_commit`), `models.py` (`games_missed`/`card_color`, `AlternatesManagerSetting`,
`SeasonPrize`, `carry_over_red_cards_as_yellow`), `tasks.py` (the 22-minute forfeit window),
`alternates_manager.py`

**Owner-supplied testimony (`[P]`)** — r/chess comment 2026-08-15 via `design/BACKLOG.md:585`
(commit `d0bc12f`).

**Repo (`[V]`, read at `d0bc12f`)**

`design/00-thesis.md:76-79` · `design/01-training-model.md:40-43` ·
`design/02-product-shape.md` §Deployment axis (`:56-77`) + §Adoption posture amendment ·
`design/03-product-breadth.md:54, :81-92, :301` · `design/05-in-run-experience.md` §1 ·
`design/BACKLOG.md:381, :394, :397, :399, :585, :650, :707, :711, :738` ·
`design/research/broadcast-and-teacher-surfaces.md` §2.3/§4.4/§7.3 ·
`design/research/fun-mechanics-outside-roguelikes.md` §F8, §10, `:1039` ·
`design/research/census-hint-false-positives.md` · `design/research/coverage-sweep-2-notability.md`
(OpeningTree) · `docs/return-and-progression.md` ·
`docs/live-sessions.md:35-57, :82-92, :130-143` ·
`rfc/learner-rating.md` §1, `:176`, §5.2, §8 R7/R10/R11, §11.2, Open question 6 ·
`apps/server/src/live-session.ts:140-160, :221-241` · `apps/server/src/live-types.ts:3, :89-95` ·
`apps/server/src/progress.ts:75-140` · `apps/server/src/rest.ts:389, :618, :984-989` ·
`apps/server/src/service.ts:1728, :1739, :1747-1764` ·
`apps/server/src/storage.ts:1824-1828, :2030-2040, :2608-2628` ·
`apps/web/src/lib/api.ts:632, :877` · `packages/runtime/src/outcome.ts:5`

---

*Landed 2026-08-16. Coverage-matrix row added in `design/research/README.md`.*
