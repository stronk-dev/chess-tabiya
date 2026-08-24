# UX research — arrival and getting into a session

**Date:** 2026-08-24
**Author:** claude
**Brief (owner, verbatim):** *"we need to go from a user perspective per feature… what do they
expect, what do competitors do, PROPER UX."* Standing context from the same conversation: the
webapp may need to be binned and redone; nothing is guided; settings offer *"10 million options"*
instead of proper flows; there is no theme preview.

**Scope.** Arrival and getting into a session: first run with no account and no history, the home
surface, choosing a drill or an opponent, choosing and understanding a preset, and the transition
into the board. It ends at the moment the first move is possible.

**Not in scope, with owners named.** In-run assistance composition (`rfc/intent-presets.md`,
`rfc/play-composition.md`, `rfc/evidence-presentation.md`); the in-run screen's layout
(`rfc/play-composition.md` Discharge D1); casting and stream-side surfaces (`rfc/live-following.md`
criterion 12); the campaign frame (`design/06-campaign.md`, unbuilt); pack authoring
(`rfc/pack-*`). Where arrival touches those, the touch is stated and the owner named rather than
designed here.

**Evidence labels** per `design/research/README.md` §House rules: `[V]` directly checked in this
pass against the cited source, a reproducible measurement, or hands-on observation; `[P]`
source-backed but partial, secondary, inherited desk research, or not reproduced hands-on; `[M]`
model knowledge with no external evidence. Every `[V]` in §§0–2 is a file-and-line reading at
`8a65a34` or a command run today; **every competitor claim in this dossier is `[P]`** unless
explicitly marked otherwise, and §4 says so per claim because much of it is load-bearing.

**Law 5.** This is a research dossier. `design/03-product-breadth.md` and
`design/05-in-run-experience.md` are intent tier and were consumed, not edited. Four places where
a recommendation needs intent to change are collected in §11 as owner decisions, not written into
design.

**Law 8.** Nothing here creates chess truth. The one place a recommendation touches what the
product *says* about chess — the opponent card's strength label, §7 — is resolved by refusing a
number rather than inventing one.

---

## 0. The first sixty seconds, measured

Read at `8a65a34` today. This is the baseline the brief asks me to replace, and it is worth stating
as a sequence rather than a list of defects, because the sequence is the problem.

| t | What the person does | What the product does | Source `[V]` |
|---|---|---|---|
| 0 s | Opens the app | A full-page gate: eyebrow *"Tabiya / hosted rehearsal"*, heading *"Return to your rehearsals."*, a **Handle** field, a **Password** field (`minlength=10`), a **Sign in** button, a *"Create an account"* toggle, and the sentence *"There is no password recovery yet. Keep your password somewhere safe."* Nothing else renders — no board, no preview, no explanation of what Tabiya is | `apps/web/src/App.svelte:693-709` |
| ~40 s | Invents a handle and a ten-character password | Lands on Home: eyebrow *"Tabiya / rehearsal workspace"*, H1 *"Return to the decision, not the answer."*, then — because there is no history — the single sentence **"No previous run yet. Start with a rehearsal pack."** and one button, **Go to Play** | `App.svelte:723-742` |
| ~45 s | Clicks Go to Play | `/play` renders two stacked things with no relationship stated: a 4-control form (**Your side** · **Opponent** [Human-common \| Strong engine] · **Optional FEN** · **Start game**) and, beneath it, a grid of **56 pack cards** | `App.svelte:743-752`; `JustPlayStarter.svelte:13-21`; `PackList.svelte:30-48` |
| ~50 s | Scans the grid for something to do | Every card carries, in this order: mode · phase · **"unreviewed draft"** · **"community"**, then the title, then a difficulty label. There is no search, no filter, no sort, no phase navigation, and no objective sentence | `PackList.svelte:32-44`; measured: all 56 drafts carry `provenance.reviewStatus: "draft"` and `content/packs/` holds **0** documents, so every served pack is stamped community + unreviewed |
| ~60 s | Picks one, or gives up and presses Start game | Either way: a board, and an objective line that for Just Play reads **"No pack is loaded. Nothing is claimed about this position."** | `DrillScreen.svelte:922-933` |

Two independent measurements taken today, both reproducible:

- `make graduation-report` → `content/drafts`: **documents 56; blocking 220; resolved 30;
  accepted 43**. `content/packs`: **documents 0**. *Graduable drafts and packs: (none).* `[V]`
  This reproduces the figure `planning/ux-work-lane.md` §4 Q2 recorded on 2026-08-16, unchanged
  eight days later.
- `grep -rn "preset" apps/web/src --include=*.svelte` → **0 hits**, and
  `loadWorkflowPreset` / `saveWorkflowPreset` / `presetDeclaration` have **zero non-test callers
  anywhere in the repository** (`apps/web/src/lib/assistance-preference.ts:20-40`;
  `packages/runtime/src/presets.ts:103-105`). `[V]`

**The shape of the failure, stated once.** Nothing in that sequence is broken. Every screen does
what it says. What is missing is that **no screen ever tells the person what this product is for,
and no screen ever narrows the field**. The nine-item primary navigation
(`ShellFrame.svelte:25-35`) offers Home · Play · Learn · Review · Record · Live · Create · Library ·
Settings, and a first-run learner who explores it meets nine empty states — *"No runs to review
yet"*, *"No open assignments"*, *"No repertoire imported yet"*, *"No milestones yet"*, *"Nothing is
due yet"*, *"No attempts recorded yet"*, *"No database drafts yet"*, *"No classrooms yet"* `[V]`
(`App.svelte:852, 877, 914, 922, 939, 968, 984, 1040`). Eight of nine destinations are empty by
construction on day one, and none of them offers a way in. That is not a content problem. It is an
arrival problem: **the product is organised for someone who already has a history with it.**

### 0.1 What is already known, and what this dossier adds

Five relevant findings are already in the ledger. This dossier does not re-derive them; it starts
where they stop.

| row | what it established | status |
|---|---|---|
| [[D484]] | *"Silence-by-default is a correct invariant and a hostile first run, and nothing in the design tier distinguishes those two claims"* | 💡 open since 2026-08-16 |
| [[D494]] | The app is silent about being silent — a simulated absence, which `05` §1 forbids in its own words | 💡 open |
| [[D1451]] | Two of the owner's four UX asks are **fenced by our own accepted documents**: `rfc/archive/adaptive-guidance.md:367` states *"guided mode is a choice, never an onboarding state"* `[V]`, and `rfc/theming.md` contains **0** occurrences of *preview*, *thumbnail* or *swatch* `[V]` | 🐞 open, 2026-08-24 |
| [[D1452]] | The control matrix grew **54 → 72** while its own defect row stayed open | 📊 2026-08-24 |
| [[D1427]] | `planning/ux-work-lane.md` — its **Q6** is exactly this dossier's question: *"Is there a first-run experience, and may it be modal? Nothing in `03` or `05` describes one."* | lane is live work |

Confirmed independently today: the settings grid is **8 contexts × 9 axes = 72** controls in one
`{#each}` (`AssistanceSettings.svelte:18, 60-74`) `[V]`, matching [[D1452]]. Also **corrected**:
[[D484]]'s clause *"a new user gets a board with no legal-move highlighting"* is now stale —
`SILENT_ASSISTANCE.boardLighting` is `"legal"` at HEAD (`packages/runtime/src/assistance.ts:18`)
`[V]`, and `planning/ux-work-lane.md` §5 item 2 has therefore been taken. Its Q4 is taken too:
`PROFILE_DEFAULTS.onramp` ships `guided: "live"` (`assistance-preference.ts:13`) `[V]`.

What is genuinely new here is the *arrival* half. The UX lane deliberately measured the in-run
screen and settings; [[D1451]] measured the fences. Nobody has written what should happen between
opening the app and the first move.

---

## 1. Who arrives, and what they came to do

### 1.1 The person

`design/00-thesis.md` §Target player: the product serves the **~1000 → 2000+ journey** (owner
ruling 2026-08-10), with a core band of **1400–2000+** — *"a serious improver who has crossed the
'hang fewer pieces' stage and now loses through plan selection, move order, timing, structure,
attack/counterplay races, transitions, and conversion"* — and an **on-ramp band 1000–1400** served
by the same runtime with three knobs turned. The frozen original
(`archive/brief-v2/product/target_player_and_scope.md`) said 1400–2200 and the living doc
supersedes it; both agree on the loss modes. `[V]` both files.

Practically, this is a person who plays online rapid, has a Lichess or Chess.com account, has tried
Chessable or a puzzle streak, and has an opinion about at least one opening. They are not a
beginner and they are not a professional. They arrive with a **specific, articulable frustration** —
"I always end up in this structure and never know the plan", "I keep losing rook endings a pawn
up", "my Najdorf falls apart on move 12" — and the arrival flow's job is to convert that sentence
into a position on a board.

### 1.2 What they came to do — and why the current entry cannot serve it

The three sentences above map exactly onto the product's three phases and onto packs that exist in
the repository today: `carlsbad-minority-attack`, `philidor-passive-rook-convert` /
`rook-4v3-same-side`, `najdorf-english-attack-black`. `[V]` (`content/drafts/`). **The material is
there and the arrival flow cannot reach it**, because the only affordance is scanning 56 titles.

The corpus, measured today, is not thin: 56 packs — **23 opening · 16 middlegame · 14 endgame · 3
cross-phase**, and **23 line · 14 plan · 15 outcome · 4 trajectory** — with rating bands spanning
1000–1400 (6 packs), 1400–2000 (33), and wider or narrower spans for the rest `[V]`. Every pack
carries a prose `objective.summary` — the Lucena pack's is 300+ characters of exactly the sentence
a learner needs to decide whether to click — plus `concepts`, a `difficulty.label`, a
`branchLengthTarget`, and an `opponentPolicy` with a `targetElo` `[V]`
(`content/drafts/lucena-bridge-convert.json`).

**None of that reaches the card.** `PackList.svelte:32-44` renders mode, phase, review status,
channel, title, and a difficulty band — and `screen-model.ts:85-88` contains an `objectiveSummary`
helper that the pack card never calls `[V]`. The single most decision-relevant string we author is
withheld from the only screen where the decision is made.

### 1.3 What makes them bounce

Ordered by how early it fires. Each is verified above.

1. **A password wall before any evidence of value.** The first thing Tabiya asks for is a
   ten-character password it cannot recover, in exchange for nothing seen yet.
2. **A wall of undifferentiated cards, every one labelled "unreviewed draft".** The provenance
   stamp is mechanically true and correct policy (`03` §Create and curate); as the *first* adjective
   attached to all 56 items it reads as "nothing here is finished".
3. **Two words of opponent choice with no strength.** *Human-common* and *Strong engine* are
   internal enum values (`RUN_OPPONENT_MODES`) surfaced as labels; neither says who you are about to
   play or how hard it will be.
4. **A board that claims nothing.** For the Just Play path, the objective region's first sentence is
   *"No pack is loaded. Nothing is claimed about this position."* — honest under `05` §1 invariant 5,
   and, as the first thing a new learner reads at the board, indistinguishable from a broken feature.
5. **Nowhere is the product's actual idea stated.** *Commit → play the consequence → rewind →
   branch → compare → replay under different resistance* appears nowhere in the arrival path. The
   nearest thing is the H1 *"Return to the decision, not the answer."*, which is a good line for
   someone who already knows what the product does and is opaque to someone who does not.

---

## 2. Feature A — first run, no account, no history

### 2.1 What the user expects

They expect to see the thing before they buy into it. On Lichess a person can play a bot, analyse a
position and open the board editor without ever creating an account; the account is what *keeps*
things. Every improver in our band has internalised that ordering: **look, try, then commit.**

Concretely, in the first sixty seconds they expect: a sentence saying what this is; a board on
screen within a click or two; and — critically for this product — some demonstration of the one
mechanic that makes it different, because "chess training site" is a category with a dozen
incumbents and no arriving user will grant us the benefit of the doubt on novelty.

What they do **not** expect is to be asked for a password they cannot recover, before anything.

### 2.2 What competitors do

Evidence in §4.1 and §4.3. The three rows that drive the recommendation:

- **The guest-then-claim model already exists and is `[V]`-evidenced.** ChessMotive ships
  *"free, account-gated, **guest-playable**"* with both *"Create my free account and keep it all"*
  and *"Guests start from zero next visit"* in its bundle (`teardown-chessmotive-desk.md:30-32`).
  **Load-bearing and hands-on-unverified**: this is `[V]` as a *string read from a shipped JS
  bundle*, not an observed flow. Nobody in this repo has played ChessMotive as a guest. A2/A1's
  step 5 rests on it, and if the string turns out to describe an unshipped path the recommendation
  survives on its own logic but loses its precedent.
- **Unconditional free entry is the norm at the top of the funnel.** Chessigma: *"no signup
  required to start analyzing"* `[V]`; OpeningTrainer: *"free without signup"* `[V] desk`; CET:
  free, browser-only, FEN-in-URL, **observed hands-on** `[V]`. The products that gate hardest on an
  account (ChessMind AI, Take Take Take) make the account *be* the onboarding step, which is the
  mandatory-import shape CLAUDE.md rejects.
- **The dominant first-run pattern is a measurement, and we should decline it.** ChessMotive maps
  rating to track via import **or a manual slider** `[V]`; ChessMind AI's assessment *"measures level
  first"* `[V]`; Chessiverse runs a preference quiz whose own page contradicts its archetype count
  `[V]`. §4.3 argues why the slider is the adoptable half and the import is not.
- **Lichess ships no onboarding at all** `[V]` — and the same dossier records the cost:
  learn-from-mistakes sits three clicks deep and *"nothing at the moment of play points to it"*
  `[V]`. "No onboarding" is a viable strategy for a product whose value is legible from its name;
  ours is not.

### 2.3 What we should do, and why it differs

**A1 — Replace the auth gate with a demonstrated arrival, and move account creation to the point
where it buys something.**

The product's identity is a *loop*, not a screen, and a loop cannot be described — it has to be
run. So the first run should be the loop itself, on rails, on a real board, in under ninety
seconds:

1. **One position, chosen by us, that makes the point in four moves.** A pack whose consequence
   arrives fast — the on-ramp `branchLength` 2–8 plies that `00-thesis.md` §Target player already
   specifies — and whose objective is legible without theory. The learner plays a move.
2. **The consequence plays out.** Not a verdict, not an eval bar. The opponent answers; two or three
   plies pass; the position is now worse or better in a way the learner can see.
3. **Rewind is offered, once, in words.** *"That happened. It is kept. Go back and try the other
   move — you will have both."* This is the single sentence that distinguishes Tabiya from every
   product in the matrix, and it can only land while a learner is looking at a consequence they
   caused.
4. **They try the other move, and both attempts are on screen.** Compare, once, on two branches
   the learner made — not a diff of engine lines. `00-thesis.md` §The novelty claim is explicit that
   *"comparison of two preserved attempts by the same player"* is the one original claim; the first
   run is where it is proven or never noticed.
5. **Then, and only then, the account.** *"Keep these two attempts?"* An account that saves
   something the learner just made is a different transaction from an account that guards an empty
   room.

This is not a tour, a coach-mark overlay, or a modal sequence — all three are explicitly hostile to
`05` §3b's ruling that *"recognition annotates; it does not seize"*, and `planning/ux-work-lane.md`
Q6 already flags that a modal would collide with it. It is a **real run of a real pack with a
scripted narration rail**, which is why it also costs nothing in new runtime: it is the shipped
`startPack` path plus copy and a step cursor.

**A2 — Say what this is, above the fold, in the product's own words.** One line and one sub-line,
present before the first click:

> **Do not just learn the move. Rehearse the game it creates.**
> Play a position out. Rewind to the decision. Try it the other way. Keep both.

The first line is `00-thesis.md`'s own pull-quote `[V]`; the second is the loop in plain English.
Neither invents anything.

**A3 — Name the silence at the moment it first looks like a bug, not in settings.** `05` §1
invariant 5 binds the product: *absence is stated, never simulated.* [[D494]] established that the
app currently violates this by being silent about being silent. One sentence, once, at the board on
the first run — *"Tabiya doesn't comment while you're deciding. Play the move, then look."* —
converts an apparent defect into a stated opinion at zero disclosure cost. `planning/ux-work-lane.md`
§1.4 item 3 argues the same point for the in-run surface; this dossier's addition is **where**: at
the first board, as part of the first run, not as a settings note.

**Why this differs from the obvious design.** The obvious design is a signup form plus a tour. We
should not build a tour, because a tour of a rehearsal loop is a description of a rehearsal loop,
and the whole thesis is that describing it is what everyone else does. The differentiator is the
only thing the first run should contain.

### 2.4 What it costs and what it depends on

| item | cost | depends on |
|---|---|---|
| A1 scripted first run | the largest item in this dossier; a step cursor over an existing `startPack` run, ~6 authored copy strings, one designated first-run pack | **an owner ruling** — `rfc/archive/adaptive-guidance.md:367` says *"guided mode is a choice, never an onboarding state"* `[V]`, and while a scripted first run is not guided mode, it is close enough that building it without a ruling risks the same fence [[D1451]] names |
| A1 step 5 deferred account | server work: an anonymous run that can be claimed by a later account | **owner decision** — `design/02-product-shape.md:101-103` rules that *"the only anonymous access is a scoped token (`story_read`, `session_join`)"* `[V]`. A guest run is a new anonymous surface and reopens that ruling |
| A2 positioning copy | 2 strings on Home | — |
| A3 silence sentence | 1 string, first-run-scoped | — |

**Blocker, named with its owner.** A1 and the guest half of A1 each need one owner ruling; both are
in §11. Nothing else in Feature A is blocked.

---

## 3. Feature B — the home surface

### 3.1 What the user expects

A returning learner opens the app with one of three intentions, and a home surface earns its place
by answering all three without a click:

- **"Carry on."** The thing I was doing. This is the highest-frequency intention and the product
  gets it right today: the resume card is the first thing on Home and it carries branch count,
  objective state, timestamp, and who holds the board `[V]` (`App.svelte:727-737`).
- **"What should I do today?"** Not a catalogue — a small number of specific, defensible
  suggestions with the reason attached. Chess players are used to this from Chessable's due-count
  and from puzzle streaks; the expectation is a *number and a verb*, not a browse surface.
- **"I have a specific itch."** *That* rook ending. *That* opening. This needs search or a phase
  entry, and today there is neither.

A first-run learner has none of these, which is why Home currently degrades to one sentence and one
button.

### 3.2 What competitors do

Evidence in §4.2. The field runs two strategies and the dossiers record the failure mode of each:

- **The flat directory** — Lichess (*"every surface one hover away, no onboarding"* `[V]`) and
  Chessigma (15+ named tools listed flat in the nav `[V]`). Failure mode, measured on Lichess
  itself: depth is invisible, and *"nothing at the moment of play points to"* the surface that would
  help `[V]`.
- **The opinionated single action** — Chessbook's *"**Go to your biggest gap**"* button, which
  *"takes you to the most popular variation that your repertoire still doesn't cover"* `[V]`, and
  Chess.com's Game Review auto-offered in the post-game modal `[V]`. `adoption-audit.md:91` ranks
  the latter *"#1 cheap adoption"* for us and records it as MISSING.
- **The failure this warns against**: Aimchess's dashboard-first home is *"a six-axis skill report…
  not a board"* `[V]`, and its Training Room drew the corpus's sharpest usability complaint —
  *"a list of lists with no particular order of difficulty, frequency, priority, expected
  duration"* `[V]` App Store review. **This is what our `/play` route is today**: a list with no
  order, priority or duration.

**Load-bearing `[P]`:** the *"dashboard-first hub"* reading — that separating the analytical home
from the play surface is what keeps play surfaces sparse — is `[P]` synthesis
(`competitor-play-ux.md:186-188`), not an observed outcome. B1 leans on it for the *shape* of Home
(three regions, no board) and does not claim the causal benefit.

### 3.3 What we should do, and why it differs

**B1 — Home answers the three intentions in three regions, in that order, and each degrades to
something real on day one.**

| region | returning | first run |
|---|---|---|
| **Continue** | the resume card as shipped | replaced by *"Start here"* — the designated first-run pack with its objective sentence and a single **Play it** button |
| **Due and open** | `dueSchedules` + open assignments + unfinished attempts, as counts with verbs (*"3 attempts due"*, *"1 branch you never played"*) | *"Nothing is due yet. Played attempts create this queue."* — keep the honest empty state, but **pair it with the way in**, not leave it standing alone |
| **Pick up a thread** | three specific suggestions: the pack whose concept you last failed, the opposite side of your last run, the related position | three *phase* entries — **Openings · Middlegames · Endgames** — because that is the only navigation a first-run learner can reason about |

The third region is where this differs most from the shipped app and where it discharges an
outstanding promise. `design/03-product-breadth.md` §Learn and return states:
*"Phase-oriented discovery: opening/early game, middlegame, endgame, and connected trajectories are
**first-class navigation and filters**"* `[V]`. Measured today: `phase` appears in the entire client
**twice**, both in `PackList.svelte` — once in a static eyebrow string, once as a text label on a
card `[V]`. There is no phase navigation and no phase filter anywhere. This is a B7/B1 gap the
gate table does not record; it is flagged in §10.

**B2 — Delete the resume card's fallback sentence.** *"No previous run yet. Start with a rehearsal
pack."* followed by a button labelled *"Go to Play"* is two clicks and an abstraction to reach a
board. The first-run Continue region should be a specific position with a specific promise, not a
pointer to a catalogue.

**B3 — Home is where the product's opinion lives, and today it has none.** The product has real
opinions available at zero inference cost: which phase you have never touched; which pack matches
the band you declared; which of your attempts ended `undecided`. `03` §Learn and return permits
*"optional personal-history relevance"* and forbids it becoming *"the required entry point or
product identity"* `[V]` — a suggestion rail sourced from **your own runs in this product** is
squarely inside that permission and nowhere near the rejected v1 identity (mining external games to
diagnose weaknesses).

### 3.4 What it costs and what it depends on

| item | cost | depends on |
|---|---|---|
| B1 Continue region | small; reuses `recentRun` | A1's designated first-run pack |
| B1 Due region | small; `dueProgress` and `assignedPacks` are already fetched on the home route (`App.svelte:291-293`) `[V]` | — |
| B1 phase entries | small on Home, **medium in total** — it needs C1's phase-filtered catalogue to land on | C1 |
| B3 suggestions | medium; needs a ranking rule that is honest under law 8 (see §5.3 — it must rank on *facts about the learner's runs*, never on a claim about chess) | — |

---

## 4. What competitors actually do

Sourced from the repository's competitor dossiers. The evidence is collected here rather than
repeated per feature so that each claim's label appears **exactly once** and cannot drift as it is
reused; each feature section points back to the rows it relies on.

### 4.0 The ceiling on everything in this section — read first

**Only one product in this corpus has ever been used hands-on.** `teardown-cet.md:5-7` is the sole
dossier whose provenance line reads *"everything below directly observed/measured this session"*.
Every other teardown header states desk research with no account and no play, and
`competitor-play-ux.md:11-13` caps itself explicitly: *"Browser driving was unavailable this
session… the strongest label here is `[V]`-fetched-primary-source, not `[V]`-hands-on."*

So when a row below reads `[V]`, it almost always means **"this string was read from the vendor's
own page or shipped bundle"** — which establishes what the vendor *claims*, not that the mechanism
works or that the screen looks like anything in particular. Two further cautions, both from the
dossiers themselves:

- `teardown-protocols.md`'s access-model statements (*"free, no account"*, *"paid SaaS, account
  needed"*) carry **no evidence label at all** and are framed as *"claims under test"*
  (`teardown-protocols.md:5, 18, 37, 55, 70`). They are not cited as evidence anywhere in this
  dossier.
- `competitor-matrix.csv` rows 2–29 are inherited and use `High`/`Medium-High`/`Medium` rather than
  bracket labels; per `design/research/README.md:65-68` every inherited claim is `[P]` unless a
  newer dossier upgrades it.

**Three absences that matter more than any presence**, because they are where I would otherwise
have leaned hardest:

1. **Nothing in the corpus describes Chessiverse's bot-*selection* screen** — no card grid, no
   photo/name/rating layout, no bot count, no account posture.
   `competitor-play-ux.md:358-359` states the Chessiverse in-game anatomy is *"`[P]`/not
   establishable"*. The intuition that "a bot picker is obviously a grid of character cards" is
   **`[M]` and is not evidenced here**; §6.3 therefore does not rest on it.
2. **No dossier states whether any competitor previews a theme before applying it.**
   `competitor-play-ux.md` §5's theming table (lines 273–298) counts options and lists settings
   paths; it has no preview column and makes no claim in either direction. §8.3's F4 rests on our
   own measured gap and on `05` §1, not on a competitor.
3. **No dossier describes any competitor's home/landing screen layout** except Lichess (`[V]`),
   chess.com (`[V]/[P]`), Aimchess (`[V]`), Chessigma (`[V]`), Take Take Take (`[V]`) and 365Chess
   (`[V]`). Everything else in §4.2 is those six.

### 4.1 Getting in: account, guest, and the free ceiling

| product | what it does | label as written | source |
|---|---|---|---|
| **Chessigma** | Homepage entry is a username box: *"Enter your Chess.com or Lichess username, pick a game, and get a full chess analysis report in seconds. No daily limit, no premium tier, and **no signup required to start analyzing**."* Free forever/unlimited/no account for game review, puzzles, analysis board, board editor, next-move, Elo calculator | `[V]` | `teardown-chessigma-desk.md:39-42, 185-189` |
| **Chessigma** (the other half) | **Every paid training module is behind a magic-link sign-in** — `/puzzles/blunder-training`, `/puzzles/blunder-shield`, `/supercoach/challenge` all render the sign-in page | `[V]` | `teardown-chessigma-desk.md:28-33` |
| **ChessMotive** | *"free, account-gated, **guest-playable**"* — the bundle carries both *"Create my free account and keep it all"* and *"**Guests start from zero next visit**"* | `[V]` | `teardown-chessmotive-desk.md:30-32` |
| **OpeningTrainer** | *"Freemium (**free without signup** + premium)"* | `[V] desk (site)` | `competitor-matrix.csv:37` |
| **Chess Endgame Training** | free, MIT, browser-only; positions launchable from FEN-in-URL | `[V]` **observed hands-on** | `teardown-cet.md:47, 57` |
| **Chess2Story** | *"No username/account sync, no auto-pull, no 'connect your account' anywhere — import is one game at a time, by hand"* | `[V]` **absence** | `teardown-chess2story-desk.md:121-123` |
| **Take Take Take** | Onboarding **is** connecting a Lichess account: *"When you connect your Lichess account, your games pull in automatically."* All features free | `[V]` | `teardown-taketaketake-desk.md:64-71, 55-57` |
| **Dr. Wolf** | Free trial is **3 coached games**; then $5.99/mo. Hints and undo are premium | `[V]` App Store; `[V]` thechessadvisor | `teardown-drwolf-desk.md:42-45` |
| **Chessbook** | Free to **400 moves**, then Pro $7.99/mo | `[V]` | `teardown-chessbook-desk.md:36-37` |
| **Chess.com** | Free tier's whole improvement stack: **1 game review/day + 3 puzzles + 1 daily lesson + 1 Coach game/month + a 4-move opening explorer** | `[V]` | `teardown-chesscom-platform-desk.md:75-90` |
| **365Chess** | Free registration; supporter tier is **pay-what-you-choose** (€20/30/40/50/100 per year, *"We don't charge a fixed amount"*) | `[V]` | `teardown-365chess-desk.md:56-59` |
| **ChessMind AI** | Free tier = **the assessment and account creation**; everything else subscription | `[V]` | `teardown-chessmindai-desk.md:51-54` |

**The pattern, stated carefully.** Of the twelve products above, the ones whose free entry is
*unconditional* — Chessigma, CET, OpeningTrainer, Chess2Story — all gate on **money or features**
rather than on an account, and the two that gate hardest on an account (ChessMind AI, Take Take
Take) make the account itself the onboarding step. **ChessMotive is the only product in the corpus
that ships an explicit guest-then-claim model**, and it states the cost of not claiming in the
learner's own terms: *"Guests start from zero next visit."* `[V]`

That single string is the design for §2.3's A1 step 5, already field-tested by someone else. It is
`[V]`-as-vendor-bundle-string, not hands-on, and §2.4 records that.

### 4.2 The home surface

| product | what it does | label | source |
|---|---|---|---|
| **Lichess** | *"Feature discovery is a fully server-rendered top nav with complete dropdowns (Play / Puzzles / Learn / Watch / Community / Tools — every surface one hover away, **no onboarding**)"* | `[V]` fetched lichess.org | `competitor-play-ux.md:68-70` |
| **Lichess** (the cost of that) | *"the same flat nav hides learn-from-mistakes three clicks deep behind 'request analysis'; **nothing at the moment of play points to it**"* | `[V]` | `competitor-play-ux.md:71-74` |
| **Aimchess** | *"the landing surface is a six-axis skill report over your imported games, **not a board**; drills are reached via a pushed Daily Plan or a **Training Room of 13 lesson types**"* | `[V]` | `competitor-play-ux.md:137-139` |
| **Aimchess** (the verdict on it) | An App Store review: the Training Room is *"a list of lists with **no particular order of difficulty, frequency, priority, expected duration**"* | `[V]` App Store review | `competitor-play-ux.md:140-141` |
| **Take Take Take** | The home IA is three named sections: **PLAY / IMPROVE / SHARE** | `[V]` | `teardown-taketaketake-desk.md:44-46` |
| **Chessigma** | The nav *is* the product surface — 15+ named tools listed flat (Game Review, Analysis Board, Board Editor, Puzzles, Blunder Training, Conversion Trainer, Sparring, Opening Trainer, Bot Challenge, Supercoach…) | `[V]` homepage nav | `teardown-chessigma-desk.md:85-101` |
| **Chessigma** (retention) | The signed-in home carries a **DAY STREAK** row and a *"Today's to-do 0/15"* checklist | `[V]` | `teardown-chessigma-desk.md:155-157` |
| **365Chess** | The browse funnel is **name → stats → games → play it**: every explorer position carries a *"Play Position"* button into play-vs-Stockfish from that position | `[V]` | `teardown-365chess-desk.md:74-76, 233-237` |
| **Chessbook** | A **single entry action**: a *"**Go to your biggest gap**"* button that *"takes you to the most popular variation that your repertoire still doesn't cover"* | `[V]` | `teardown-chessbook-desk.md:82-83` |
| **Chess.com** | The home of the improvement loop is the **post-game modal** — result + Rematch / New Game / green **Game Review** — auto-offered the moment a game ends | `[V]` | `teardown-chesscom-platform-desk.md:174-176` |
| — synthesis — | Pattern 5, *"Dashboard-first hub"*: *"the analytical home is a separate screen, which is precisely what keeps the drill/play screens sparse. An IA pattern, not a play-screen pattern — **the value is the separation**"* | `[P]` synthesis | `competitor-play-ux.md:186-188` |

**What this establishes.** There are exactly two home-surface strategies in the field: **the flat
directory** (Lichess, Chessigma) and **the opinionated single action** (Chessbook's *"Go to your
biggest gap"*, Chess.com's auto-offered Game Review). The dossiers also record the failure mode of
each: Lichess's flat nav *"hides learn-from-mistakes three clicks deep"* `[V]`, and Aimchess's
directory-of-directories drew the sharpest user complaint in the whole corpus — *"no particular
order of difficulty, frequency, priority, expected duration"* `[V]`.

**Our shipped Home is neither.** It is a resume card plus a button to a directory — the flat
strategy with the directory removed. §3.3's B1 adopts the opinionated-single-action strategy for the
Continue region and keeps a directory behind it, which is what Chessbook does.

### 4.3 First runs, wizards and ramps

| product | what it does | label | source |
|---|---|---|---|
| **ChessMotive** | *"**Onboarding maps rating to track** (FIDE foundationMax 1600, clubMax 2200) via Lichess/Chess.com import **or a manual slider**"* — feeding three difficulty tracks: Foundation (PT15M, move-category scaffolding), Club (PT20M, unscaffolded candidate comparison), Advanced (PT30M, line + evaluation) | `[V]` shipped JS bundles | `teardown-chessmotive-desk.md:26-30` |
| **ChessMind AI** | *"The free assessment (`/assessment`) **measures level first**"*; the scan profiles imported games into a plan that *"fix[es] the weakest link first"* | `[V]` | `teardown-chessmindai-desk.md:127-130` |
| **Chessiverse** | An FAQ describes **a short preference quiz and seven archetypes** — *and the same page later describes 51 metrics, eight axes and 30+ archetypes*, i.e. it contradicts itself | `[V]` | `competitor-love-hate-sweep.md:120-124` |
| **Chessiverse** (reception) | Users call the personality result fun but question a Carlsen match for a frequent blunderer, repeated types, and the sample size | `[P]` reddit | `competitor-love-hate-sweep.md:125-127` |
| **Chessable** | The ramp is learn → quiz → review: *"you read commentary on a single move, then you repeat the suggested move, then you read more commentary… At the end of a set of moves, you repeat them all as a sequence"*; homepage copy is literally *"Make the suggested move! You will be quizzed on this later!"* | `[V]` | `chessable-movetrainer.md:40-46` |
| **Chessable** (our reading of it) | *"the best onboarding ramp in the category and the reason 'book → trainable course' works at all"* — **and it collides squarely with commit-before-learning (ADR-0006)**; two candidate transformations named, ledgered as [[D867]] | analysis over the `[V]` mechanics | `chessable-movetrainer.md:265-276, 333-334` |
| **365Chess Coach** | A four-step guided ramp: *"Step 1: Review the lesson over the board… Step 2: Make the moves on the board [it shows you what to move]… Step 3: Play one side… from memory… You will have hints… Step 4: …different positions at random orders, **as flashcards**"* | `[V]` | `teardown-365chess-desk.md:124-138` |
| **Dr. Wolf** | The maker's own framing: *"I see it not as a playing-field leveler as much as **an on-ramp. It makes it possible for people to get in and get comfortable without the social pressure.**"* | `[V]` popsci interview | `teardown-drwolf-desk.md:38-41` |
| **Lichess** | **No onboarding at all** | `[V]` | `competitor-play-ux.md:68-70` |

**What this establishes, and where it cuts against us.** Every product that serves a band below
ours opens with a **measurement** — an import, an assessment, a slider, a quiz — and uses it to
pick a difficulty. That is the dominant first-run pattern in the corpus and it is the one we most
obviously *could* copy.

**We should not copy it, and the reason is in our own rejected list.** CLAUDE.md's first rejected
identity is *"personal game-analysis AI coach (mine games → detect weaknesses → generate
episodes)"*, and `03` §Learn and return permits personal-history relevance only if it *"never
becomes the required entry point or product identity"* `[V]`. ChessMind AI's *"measure level
first"* and Take Take Take's *"connect your Lichess account"* are precisely the mandatory-import
entry point the brief rejected. ChessMotive's **manual slider** is the escape hatch: the same
outcome (a difficulty track chosen before the first drill) with no import required, and it is
`[V]`-evidenced as shipping alongside the import rather than instead of it.

So §2.3's A1 deliberately opens with **a position, not a questionnaire** — and §3.3's B1 asks for
the band as an optional, changeable declaration rather than as a gate.

The other finding here is Chessable's, and it is uncomfortable: the corpus's best-regarded
onboarding ramp is *"make the suggested move"*, which is obedience — exactly what
`00-thesis.md` §The arc calls *"rehearsed obedience"* and what ADR-0006 forbids. [[D867]] already
carries the transformation question. This dossier's position is that A1's first run is the honest
version: the learner is not told a move, they are told **what the software will do with their
move** — play it out and keep it.

### 4.4 Choosing what to do: catalogues, filters and quick starts

| product | what it does | label | source |
|---|---|---|---|
| **Chessbook** | *"You pick **rating range and target** (e.g. '1 in 300 games'); once a branch's expected frequency falls below it, digging deeper is flagged as not worth it"* | `[P]` search extract + `[V]` App Store copy | `teardown-chessbook-desk.md:76-81` |
| **Chessbook** | Pre-made repertoires **with rating-range filtering** shipped 2024 — *"a curated on-ramp before personal authoring"* | `[V]` | `teardown-chessbook-desk.md:90-92` |
| **Chessable** | **Priority lines** — learn-next follows only lines marked important, either author-selected or algorithm-selected *"based on a database of online games in a certain rating range"* | `[V]` | `chessable-movetrainer.md:88-95` |
| **Chessable** | **Key moves** (up to two per variation mark a study window); three scheduling modes (default SRS, custom multiplier, cyclical for the Woodpecker Method); a **Difficult Moves** surface, PRO-gated, ordered by lowest accuracy with a graduation rule | `[V]` | `chessable-movetrainer.md:80-88, 66-72` |
| **Chessable** | Learning-status vocabulary the learner actually sees: **Not learned / Paused / Learning (1–7) / Mature (8+) / Difficult** | `[V]` | `chessable-movetrainer.md:73-79` |
| **365Chess** | Openings Trainer configuration is **database (Big/Masters) · colour · opening or ECO code**, plus *"Random Position / From Current Position"*; Endgames Training selects by **material class** | `[V]` | `teardown-365chess-desk.md:93-101, 111-122` |
| **Chess Endgame Training** | A real hierarchical catalogue, measured hands-on: **83 positions in R+P vs R alone, 20 subcategories under Rook & Pawn**, each launchable from a FEN-in-URL with a target objective | `[V]` **observed** | `teardown-cet.md:46-47` |
| **ChessMotive** | Positions tagged `phase` / `difficulty` / `themes` / `event` / `moveNumber`; `phase` is validated to `opening\|middlegame\|endgame` and **shown in the session spine alongside `difficulty` and `themes`** | `[V]` bundle | `teardown-chessmotive-desk.md:43-44, 72-73` |
| **Chess.com** | Practice has **four types** — Master Games, Openings, Drills, Custom Position (paste FEN); drill titles are **outcome-framed**, e.g. *"King vs King And Pawn: Holding The Draw"* | `[V]` / `[P]` | `teardown-chesscom-desk.md:34-36` |
| **Aimchess** | A **Training Room of 13 lesson types**, reached via a pushed Daily Plan | `[V]` | `competitor-play-ux.md:137-139` |
| **Chessigma** | *"**Climb the bot ladder. Nine sparring partners, each with a real repertoire.**"* Bot Challenge's entry offer: *"You blew a +3 in a real game. Pick it back up at that exact move. Same clock. Bot at your level. Finish it this time."* | `[V]` | `teardown-chessigma-desk.md:97, 99, 105-106` |
| — our own shelf, measured — | *"ChessMind sells 56–69 GM courses, 365chess 258, Chessable thousands; we hold ~3 packs and 4 shape entries… **a user comparing shelves today sees ours nearly empty**"* | `[V]` inherited | `adoption-audit.md:214-216` |
| — our own gap, ledgered — | 365Chess's **named-opening browse funnel (name → stats → games → play it)** is recorded as **MISSING** for us | `[V]` | `adoption-audit.md:83` (row 21) |

**What this establishes.** Every catalogue in the field filters on **at least two** of: phase or
material class, opening name or ECO, and a rating band. Chess.com's drill titles are the closest
thing in the corpus to §5.3's C2/C3 recommendation — *"King vs King And Pawn: Holding The Draw"* is
a title that is simultaneously the position, the objective and the verb. Chessable's learning-status
vocabulary is the model for a returning learner's card state, and its **Difficult Moves** surface is
the model for §3.3's B1 suggestion rail.

**Two things we have that nobody in the corpus has**, and both are currently invisible on our cards:
an authored **prose objective** per pack, and a **declared rating window** per pack. Chessigma's
nine sparring partners have *no published calibration at all* (`teardown-chessigma-desk.md:296-298,
455-457`, `[V]` as an absence), and our own measurement licenses five to nine honest partners across
`[1000, 2400]` — *"Chessigma's nine is at the top of what our own measurement would license, and
they have published no measurement at all"* `[V]`
(`teardown-chessigma-desk.md:382-390`). The shelf is thinner than theirs; the per-item honesty is
better, and we throw it away at render time.

**The correction our own audit already made about the shelf:** `adoption-audit.md:214-216`'s
*"~3 packs"* is stale against today's measurement of **56 drafts** — but zero graduable, so the
*visible* shelf is thin for a different reason than that row assumed. §5.3's C5 and O-C5 own it.

### 4.5 Choosing an opponent

| product | what it does | label | source |
|---|---|---|---|
| **365Chess** | *"You can challenge **Stockfish 18** choosing different levels of strength"* — **Level 1 (ELO ~1300)** through **Level 10 (ELO ~2700)** | `[V]` | `teardown-365chess-desk.md:103-109` |
| **ChessMind AI** | **Six bands conditioned on human rating** — roughly **1100 / 1300 / 1500 / 1700 / 1900 / 2000+** — *"so there is always an opponent slightly above your own strength"*; Maia-2 runs client-side (`maia2_rapid.onnx`, `elo_self`/`elo_oppo` tensors, moves **sampled** not argmaxed) | `[V]` FAQ; `[V]` code read | `teardown-chessmindai-desk.md:71-76, 64-71` |
| **Chessiverse** | **The only product in the corpus that calibrated against humans**: a dense bot-vs-bot ladder for relative strength, then **four calibration bots deployed on Lichess (833 / 1057 / 1454 / 2009)** earning real ratings against humans, everything else scaled to them; recalibrated three times; user-self-reported-rating feedback **tried and dropped** | `[V]` | `human-like-opponents.md:306-310` |
| **Chessiverse** | Bot construction: a "Move Curator" filter picks suspicious moves and grades them with a stronger engine; depth reduction explicitly rejected; every bot gets a human-derived repertoire with rating-conditioned frequencies; **Guardian→Savage styles are classified *after* generation, not controlled** (*"we do very little to influence it. Instead, we measure the output"*). Gimmick bots exist by name (e.g. *Gramps Pushwick*) | `[V]` | `human-like-opponents.md:257-267` |
| **Lichess** | Levels 1–8 = movetime 50–1000 ms, Skill −9…20, depth caps 5–22. **The level↔rating table is community lore with no official statement** | `[V]` fishnet source; `[V]` forum | `human-like-opponents.md:252, 300-301` |
| **Chess.com** | Bot ratings are *"not based on rated play"* and drift; **"Adaptive" bots** ship; presentation is *"avatars/celebrity"* | `[P]`; `[V]`; `[V]` | `human-like-opponents.md:301-302, 478-480` |
| **Chess.com Play Coach** | **Four coaches** *"each with their own looks and voice"*, plus toggles for move suggestions, threats and eval bar, a Hint button, and takebacks. Free members get **one Coach game per month** | `[V]` | `teardown-chesscom-platform-desk.md:103-111` |
| **Dr. Wolf** | **Four coach profiles** *"each with a unique voice, teaching style and personality"*; Voice Mode is a Settings toggle | `[P]` store-copy extract; `[V]` elevenlabs | `teardown-drwolf-desk.md:70-72` |
| **Dr. Wolf** (the failure) | *"The Advanced→Expert gap is 'astronomical'"* `[V]`, and a long-term user with 800+ wins: *"**If the game is actively using AI to adapt to my level of play without me increasing difficulty, then it's pointless**"* `[V]` | `[V]` ×2 App Store reviews | `teardown-drwolf-desk.md:160-165` |
| **Komodo/Dragon** | Eight named personalities (Default, Aggressive, Defensive, Active, Positional, Endgame, Human, Beginner) | `[P]` docs unreachable; list confirmed via retailer page `[V]` | `human-like-opponents.md:273-278` |
| **Chessmaster** | "The King" exposed strength/style sliders directly (Attack/Defender −100…+100, Randomness, Material/Position, per-piece values) | `[P]` forum-documented | `human-like-opponents.md:280-283` |
| **Noctie** | Advertises *"strengths, weaknesses and even move timings… similar to a human at your own skill level"* | `[V]` | `human-like-opponents.md:194-197` |
| **Take Take Take** | *"No bots, no Maia-style human-like engine, no resistance levels found"* — **you cannot choose resistance** | `[V]` **absence** | `teardown-taketaketake-desk.md:143-146` |
| — the verdict on all of it — | *"**No widely-used weakened-bot Elo label has ever been validated against humans by its author.**"* Stockfish's `UCI_Elo` is anchored to CCRL 40/4 with self-admitted ±100 slop; maia1's own Lichess rating spans ~230 Elo across time controls (bullet 1582 / blitz 1434 / classical 1666, against a target of 1100) | verdict; constituents `[V]` ×4 | `human-like-opponents.md:66-70, 291-304` |

**What this establishes, and it is the single most useful finding in §4.** The genre convention is
a **number on the card** — 365Chess's *"Level 1 (ELO ~1300)"*, ChessMind's six Elo-labelled bands,
Chessigma's *"Bot at your level"*. And the dossier's own verdict is that **not one of those numbers
has ever been validated against humans by the party publishing it** `[V]`, with the constituent
evidence measured: Lichess's own level table is community lore with no official statement `[V]`,
chess.com's bot ratings are explicitly not from rated play `[P]`, Chessigma publishes no
calibration at all `[V]` as an absence, and maia1 spans 230 Elo across time controls against a
target it misses by 300+ `[V]`.

**Chessiverse is the exception and it is instructive**: four bots deployed on Lichess to earn real
human ratings, everything else scaled to them, recalibrated three times, and self-reported ratings
tried and abandoned `[V]`. That is what it costs to put an honest number on a card — and
`rfc/bot-roster.md` records that our own equivalent ladder **is not funded**, and that Gate 0
abstained on a failed positive control (2026-08-23, [[D1184]]) `[V]`.

So §6.3's D3 — a rung ladder and a character, no Elo — is not a limitation we are apologising for.
It is the only position in this table that the evidence supports, and every competitor number here
is a claim its publisher cannot back.

**Two further transferable findings.** Chessiverse classifies style *after* generation rather than
controlling it (*"we measure the output"*) `[V]`, which is exactly `rfc/bot-roster.md`'s
band-vs-family separation arrived at independently. And Dr. Wolf's churn complaint is the sharpest
argument in the corpus **against** silent adaptation: *"If the game is actively using AI to adapt to
my level… without me increasing difficulty, then it's pointless"* `[V]`. A learner needs to feel
they chose the resistance. That is a direct argument for D1's explicit rung picker and against any
auto-tuning we might be tempted by.

### 4.6 Choosing how much help — the preset question

| product | what it does | label | source |
|---|---|---|---|
| **Chessiverse** | A three-level assistance dial with published names: **Full Help** (all legal moves colour-graded on the squares, always, plus an eval bar) · **Peek** (grades hidden while thinking; hold a piece to reveal) · **Hint Only** (no colours, no bar) — **with a measured graduation gate to rated play** | `[V]` chessiverse.com/guided-play | `competitor-play-ux.md:119-126` |
| **Chessiverse** | *"Its published vocabulary is '**levels of help**', not 'support mode'"* | `[V]` site-restricted search | `competitor-play-ux.md:122-123` |
| **Chessiverse** | Progressive hints change semantics when theory is present — from general threat/direction/piece/move support to book-move count / piece / common move / exact move; separate takeback of learner move or bot reply; branch preservation; PGN with variations; **exact-opening starts from 500+ guides** | `[V]` | `competitor-love-hate-sweep.md:41-46` |
| **Noctie** | *"Move quality feedback can now be set **separately for games and review**"*, and *"a setting for which move feedback qualities you want highlights for on the board while playing"*. (Deselecting all = fully hidden is flagged in the dossier as **an inference, not verified**) | `[V]` for the settings; inference flagged | `teardown-noctie-desk.md:62-66` |
| **Chess.com Play Coach** | Toggles for move suggestions, threats and eval bar; a Hint button; takebacks | `[V]` | `teardown-chesscom-platform-desk.md:103-111` |
| **Chess.com Game Review** | A moderator's answer to *"Retry is a puzzle"* is a **toggle to hide it** — *"You can turn on Show Best Moves and it won't show Retry"* | `[V]` | `teardown-chesscom-platform-desk.md:61-66` |
| **Dr. Wolf** | The mistake dialog is a **blocking pre-commit choice** — *"Are you certain?"* before allowing continue or retract. Whether it fires on every blunder or adaptively, **and whether it can be disabled, is an open residual** | `[V]`; residual unresolved | `teardown-drwolf-desk.md:63-67, 196-197` |
| **Lichess** | Zen is a one-key chrome-off switch with **three preference states** (No / Yes / *"In-game only"*), bound to `z` | `[V]` `_zen.scss`, `Pref.scala` | `competitor-play-ux.md:55-59` |
| — synthesis — | Pattern 7, *"Chrome-off switch"*: *"The two incumbents both ship a one-action path to 'board + clock only'. **A preset, in Phase-5 vocabulary — the quietest preset has a dedicated toggle, not a settings dive.**"* | `[V]`/`[P]` mixed, synthesis `[P]` | `competitor-play-ux.md:192-194` |
| — synthesis — | *"**Expert primitive configuration belongs in Advanced/Inspector/Authoring; normal workflows select named presets and honest ceilings.**"* | `[M]` synthesis | `competitor-love-hate-sweep.md:144-149` |

**What this establishes.** The market has already converged on our answer and named it in plainer
English than we have. **Chessiverse ships three named levels of help with a graduation gate**, and
its published vocabulary is *"levels of help"* — a phrase a learner understands without a glossary,
where our five names (*Quiet, Guide me, Theory only, Support, Analyze*) need their promise sentences
to be legible. This is the strongest single argument for §7.3's E1: **the promise sentence is not
decoration, it is the label**.

Two boundaries the same evidence draws:

- **Chessiverse's Full Help grades every legal move on the board pre-commit** `[V]`. Our own
  ledger's reading is that this *"cannot silently become the rehearsal default"*
  (`competitor-love-hate-sweep.md:51-53`, `[M]`), and `05` §Presentation as amended on O4 already
  rules it: *"proactive blunder prevention belongs only to an explicit Support preset and is not the
  rehearsal default"* `[V]`. So we adopt the **three-named-levels shape** and refuse the **default
  position** — which is exactly `02` §Adoption posture's transformation rule.
- **Dr. Wolf's blocking *"Are you certain?"* dialog** is what a support preset looks like when it
  seizes rather than annotates, and the dossier could not establish whether it can be turned off
  `[V]`-as-residual. `05` §3b's ruling — *"a passive marker the player may open, never a modal"* —
  is our answer, and it was ruled before this evidence arrived.

**And one warning aimed straight at us.** Lichess's zen is *one key*. Chess.com's Zen Mode is one
toggle. Neither is a settings dive, and neither is a matrix. We ship 72 controls and no preset
surface at all.

### 4.7 Appearance

| product | what it does | label | source |
|---|---|---|---|
| **Lichess** | **25** 2D + 19 3D board themes; **41–42** 2D + 11 3D piece sets; 5 backgrounds with **Device as the default**; board-image tuning sliders (brightness/contrast/opacity/hue); four animation levels with **Normal as default**; 4 coordinate states | `[V]` primary source (`Theme.scala`, `PieceSet.scala`, `Pref.scala`) | `competitor-play-ux.md:275-287` |
| **Chess.com** | Custom **background upload** `[V]`; premade board themes, counts unpublished `[V]`; named **Board Presets** that save a look per use-case `[P]`; settings path is cogwheel → All Settings → *"Boards & Pieces"*, and the same page is reachable **in-game via a gear next to the opponent's clock** `[V]`; mobile is More → **Theme with mix-and-match custom themes** `[V]` | as marked | `competitor-play-ux.md:93-97, 281-287` |
| **Chessable** | Dark mode is **opt-in behind the profile menu** `[P]`; board/piece pickers exist in-lesson, counts unpublished `[P]`. MoveTrainer 2.0 (2020) shipped dark mode and a resizable board as part of a replatform `[V]` | as marked | `competitor-play-ux.md:112-113`; `chessable-movetrainer.md:114-116` |
| **Aimchess** | Ships dark **and** light themes plus board/piece appearance settings | `[V]` App Store description | `competitor-play-ux.md:141-142` |
| — the absence — | **No dossier states whether any competitor previews a board or piece set before applying it.** §5's table counts options and records settings paths; it has no preview column and asserts nothing either way | `[V]` scoped absence over the fetched pages | `competitor-play-ux.md:273-298` |
| — our own floor — | The proposed appearance floor in that dossier is explicitly *"(proposal, `[M]` synthesis — Phase-4/5 RFC input, **not a ruling**)"* | `[M]` | `competitor-play-ux.md:289-290` |

**What this establishes.** Lichess's counts are the field's ceiling and they are `[V]` from source.
Ours are **3 app themes / 2 board themes / 2 piece sets** `[V]`. The relevant comparison for arrival
is not the count, though — it is **chess.com's in-game gear next to the opponent's clock** `[V]`,
which puts appearance one click from the board rather than behind a nav item called Settings.

And the honest statement of §8.3's F4's evidential position: **it does not rest on a competitor**,
because the corpus does not establish that any competitor previews. It rests on our own measured
blindness (five `<select>`s of text labels, zero rendered previews) and on a piece set labelled
*"Cburnett"*.

### 4.8 The transition into the board — the one hands-on measurement in the corpus

`teardown-cet.md` is the only dossier in this set whose claims were observed rather than fetched.
Session: 2026-08-11, desktop Chrome, `chess-endgame-trainer.mooo.com`, R+P vs R #1/83. All `[V]`
observed (`teardown-cet.md:11-24, 39-47`):

- **Cold app load: DOMContentLoaded 593 ms, load event 672 ms.**
- **Position open — catalogue list to playable board — under 2 s including render; "subjectively immediate".**
- First opponent reply ~2.1 s perceived; subsequent replies 150–300 ms; move-list navigation instant.
- *"The 'slow, poor UX' field report did not reproduce on desktop beyond the ~2 s first reply per
  position. The app is fast once warm."* Caveats recorded: single session, desktop only, one
  position; mobile, many-position sessions and offline untested.
- **Illegal moves are rejected silently — no feedback at all — *"which briefly confused even us"*.**

`teardown-protocols.md:20-25` names the metric this corner of the product should be judged on, and
it is unexecuted for every product except CET: *"**Cold start: time from URL open → first position
playable**"*, and *"time tap-to-board-ready for retry. Repeat 5×, note median. (Our budget to beat:
effectively instant; <250 ms warm.)"* `[V]` as a stated protocol.

**We have never measured our own cold start or catalogue-to-board time.** That is recorded in §12
and is the cheapest missing measurement in this dossier: the protocol is written, the competitor
number exists, and nothing has been run against ourselves.

---

## 5. Feature C — choosing a drill

### 5.1 What the user expects

They expect a catalogue to behave like a catalogue. Specifically, and this is uncontroversial
across every content product any of our learners uses:

- **Filter by the axis they think in.** For a chess improver that is, in order: phase (opening /
  middlegame / endgame), opening name, and difficulty relative to themselves.
- **Search.** By opening name most of all — "Najdorf", "Carlsbad", "Lucena". Our packs carry those
  words in their titles and in `concepts`, and no field on any screen accepts them.
- **A sentence per item saying what they will do**, so the choice is between activities, not between
  filenames.
- **A sense of size.** How long is this, how many moves, will I finish it.
- **A reason to trust it.** Who wrote this, is it any good.

They do **not** expect to be told the internal storage classification of every item before its
title.

### 5.2 What competitors do

Evidence in §4.4. Four rows drive C1–C5:

- **Every catalogue in the corpus filters on at least two axes.** 365Chess: database · colour ·
  opening/ECO for openings, **material class** for endgames `[V]`. Chessbook: **rating range** plus
  a frequency target (*"1 in 300 games"*) `[P]` extract + `[V]` App Store copy — **this pair is the
  load-bearing `[P]` for C4's relative-difficulty idea**, and the `[P]` half is precisely the part
  describing *how the learner sets it*. Chessable: priority lines selected *"based on a database of
  online games in a certain rating range"* `[V]`. ChessMotive tags positions with
  `phase`/`difficulty`/`themes` and **shows phase in the session spine** `[V]`.
- **Outcome-framed titles are the field's best practice and we already author them.** Chess.com's
  drills are titled *"King vs King And Pawn: Holding The Draw"* — position, objective and verb in
  one string `[V]`/`[P]`. Our `objective.summary` is a better version of that and never reaches a
  card.
- **A real hierarchical catalogue is achievable at our scale.** CET, the only hands-on measurement
  in the corpus, holds **83 positions in R+P vs R alone, 20 subcategories under Rook & Pawn**,
  each deep-linkable by FEN with a target objective `[V]` observed. Our 56 packs are a browsable
  hierarchy by the same standard; they are simply not presented as one.
- **The shelf comparison, honestly.** *"ChessMind sells 56–69 GM courses, 365chess 258, Chessable
  thousands… a user comparing shelves today sees ours nearly empty"* `[V]` inherited
  (`adoption-audit.md:214-216`). That row's *"~3 packs"* is stale — we hold 56 — but the visible
  shelf is still thin, for the different reason C5 and O-C5 address.

### 5.3 What we should do, and why it differs

**C1 — Phase-first, filtered, searchable.** Three top-level entries (Openings · Middlegames ·
Endgames, plus Trajectories as a fourth once populated), then within each: a band filter, a
free-text search over title + `concepts` + `objective.summary`, and a sort. The data is all present
and none of it is used: `phase` (23/16/14/3), `mode` (23/14/15/4), `difficulty.minOnlineRapid` /
`maxOnlineRapid`, and `concepts` are on every pack `[V]`. This also discharges `03` §Learn and
return's *"first-class navigation and filters"* promise, which §10 records as currently unmet.

**C2 — The card leads with the authored objective sentence.** `objectiveSummary` already exists in
the client (`screen-model.ts:85-88`) and the pack card does not call it `[V]`. The Lucena pack's
summary — *"The Lucena position: your king sits on the promotion square, the pawn is one step from
queening, and the defender's rook is ready to check forever…"* — is the sentence that makes the
choice. It should be the second line of the card, under the title.

**C3 — Translate the mode enum into the verb it names.** `PackList.svelte:34` renders
`pack.mode.replaceAll("_", " ")`, so the card's first word today is literally `line`, `plan`,
`outcome`, or `trajectory` `[V]`. `design/01-training-model.md` already gives each its learner-facing
meaning: recall the theory and continue past the book; commit to a plan and play the consequence;
convert / hold / save / resist; play all three phases in one session. Those are the words. The enum
is a storage detail.

**C4 — Difficulty relative to the learner, not as an absolute band.** Each pack declares an
`minOnlineRapid`/`maxOnlineRapid` window, and the product knows the learner's measured band from
`/rating` when they have one. *"Sits at your band"* / *"a rung above you"* / *"below your band —
technique practice"* is more decision-useful than *"1400–2000"*, and it is arithmetic over two
declared numbers, so it manufactures nothing. Where there is no measured band, the honest form is
the declared window plus the pack's own `difficulty.label`, which is already a full sentence
authored for exactly this purpose (*"Club player who reaches rook endings a pawn up and must convert
the textbook win"*) `[V]`.

**C5 — The provenance stamp moves off the primary line, and the corpus's real status is stated
once instead of 56 times.** This is the arrival half of `planning/ux-work-lane.md` Q2 and it does
**not** require that ruling to improve, though the ruling is still owed.

The facts: `content/packs/` holds **0** documents; the served library is `content/drafts/`, which
`pack-registry.ts:358` stamps `community` by construction; all 56 carry
`provenance.reviewStatus: "draft"`; `make graduation-report` returns **zero graduable** `[V]`. So
`PackList.svelte:36-37` renders *"unreviewed draft"* and *"community"* on 100% of cards. A signal
that fires on everything carries no information and costs the whole catalogue its credibility.

`03` §Create and curate requires the channel be *"visible wherever a pack is surfaced"* `[V]`, and
this recommendation keeps that — it moves it from the card's leading metadata row to the card's
provenance line and to the pack's detail view, and it adds a single honest statement at the top of
the catalogue saying what the corpus's state actually is. That is `05` §1 invariant 5 applied
properly: *absence stated, once, where it means something* — rather than a per-item badge that
readers learn to ignore in four seconds.

Which of Q2's three honest paths is taken — graduate 3–5 packs, ship a disclosed third channel
value, or state the emptiness on the surface — remains an owner ruling, recorded in §11. C5 is
compatible with all three.

### 5.4 What it costs and what it depends on

| item | cost | depends on |
|---|---|---|
| C1 filters + search | medium; client-side over the served `PackSummary` list, but `PackSummary` (`api.ts:29-40`) carries **no `concepts`, no `objective.summary` and no rating window** — it exposes `difficulty: unknown` `[V]`. So C1 and C2 both need `PackSummary` widened, which is a small server change | — |
| C2 objective sentence | trivial once `PackSummary` carries it | the same widening |
| C3 mode verbs | 4 strings | — |
| C4 relative difficulty | small | `/rating` publication being present, and honest abstention when it is not |
| C5 provenance placement | small | **owner ruling** on Q2 for the catalogue-level statement's wording |

---

## 6. Feature D — choosing an opponent

### 6.1 What the user expects

This is the expectation most strongly set by the rest of the market, and the one we currently meet
least. A player choosing an opponent expects **an opponent** — something with a name, a strength,
and a character — not a policy mode. They expect to be able to say "give me someone about my
level", and they expect to understand, before the first move, roughly how hard this will be.

They also expect the choice to be *reversible and cheap*: try one, it's too easy, pick another.

### 6.2 What competitors do

Evidence in §4.5, which is the richest and most decisive section in this dossier.

**The convention is a number, and the number is unbacked.** 365Chess sells *"Level 1 (ELO ~1300)"*
through *"Level 10 (ELO ~2700)"* `[V]`; ChessMind AI ships six bands *"so there is always an
opponent slightly above your own strength"* `[V]`; Chessigma offers *"Nine sparring partners, each
with a real repertoire"* and *"Bot at your level"* `[V]` **with no published calibration whatsoever**
(`[V]` as a scoped absence, `teardown-chessigma-desk.md:296-298`). And the corpus's own verdict:
*"No widely-used weakened-bot Elo label has ever been validated against humans by its author"* —
Lichess's level table is community lore with no official statement `[V]`, chess.com's bot ratings
are explicitly *"not based on rated play"* `[P]`, and maia1 spans ~230 Elo across time controls
against a target it misses by 300+ `[V]`.

**One product paid the price.** Chessiverse deployed four calibration bots on Lichess (833 / 1057 /
1454 / 2009) to earn real human ratings, scaled everything to them, and recalibrated three times
`[V]` — and dropped user-self-reported ratings as a signal. That is what an honest number costs.

**Two `[P]` claims I am explicitly not leaning on**, both flagged because they are the ones a reader
would expect to carry this section:

- **chess.com's bot ratings drifting** is `[P]` (`human-like-opponents.md:301-302`). It corroborates
  the verdict; it does not establish it. The verdict stands on the `[V]` Stockfish PR admissions and
  the `[V]` maia1 measurement.
- **Komodo's eight personalities** are `[P]` — the official docs were unreachable (expired TLS) and
  only the *list* was confirmed `[V]` via a retailer page. So "personality axes are an established
  convention" is weaker evidence than it looks, and D2's band-vs-family split rests on
  `rfc/bot-roster.md`'s own measurement (1.36 cp / 1.01 cp vs a ~60-Elo perception floor `[V]`)
  rather than on Komodo.

**And the corpus's sharpest warning about auto-difficulty**, which is a `[V]` App Store review from
a long-term Dr. Wolf user with 800+ wins: *"If the game is actively using AI to adapt to my level of
play without me increasing difficulty, then it's pointless."* Alongside it, the same product's
*"astronomical"* Advanced→Expert gap `[V]`. **A learner needs to have chosen the resistance and to
be able to move it by a step they can feel.**

**The absence that shapes what I did not recommend:** nothing in this repository describes
Chessiverse's bot-selection screen — no card layout, no photo, no rating placement, no bot count,
no account posture (`competitor-play-ux.md:358-359` marks its in-game anatomy
*"`[P]`/not-establishable"*). D2 below therefore specifies what a card must *say*, and deliberately
does not specify what it looks like.

### 6.3 What we should do, and why it differs

**The gap, measured.** Just Play's entire opponent surface is a two-option `<select>` reading
**Human-common** / **Strong engine** `[V]` (`JustPlayStarter.svelte:17`) — the two most common
members of the internal `RUN_OPPONENT_MODES` union `[V]` (`packages/runtime/src/types.ts:41-47`).
It sends `opponentPolicy: { mode }` with **no `targetElo`** `[V]`
(`session-controller.ts:289`), so the applied strength is whatever the engine advertises as its
default band (`engine-band.ts:68-81`), the learner cannot choose it, and is never told it. If the
configured engine is band-calibrated and publishes no default, that path throws
`TARGET_ELO_REQUIRED` `[V]` — a hard failure on the primary way into the product, caused by a
missing control rather than a bug.

Meanwhile `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` — a literal empty array, so **zero
named opponents are registered** `[V]` (`apps/server/src/bot-policy-catalog.ts:299`).

**D1 — The pattern we need already exists in this codebase, on the wrong screen, under the wrong
name.** `/rating` — labelled **"Record"** in the primary navigation `[V]`
(`ShellFrame.svelte:30`) — contains the best start form in the application `[V]`
(`RatingScreen.svelte:94-120`):

- a four-rung opponent picker with characterised labels: *"Band 1000 · first rung"*, *"Band 1400 ·
  steady"*, *"Band 1800 · testing"*, *"Band 2200 · top measured rung"*;
- a side picker;
- one sentence saying exactly what the session is and what voids it: *"One full game from the normal
  starting position. Rewinds and live assistance void the rating result, but never delete the
  game."*;
- and an honest-label footer: *"Band labels describe this calibrated Maia ladder. They are not FIDE,
  Lichess, or Chess.com ratings."*

That form is correct. It is behind a navigation item that no arriving learner reads as "play a
game", while the surface `03` §Play names as the primary entry has no band control at all. **The
recommendation is not to design a new opponent picker; it is to make the Just Play starter at least
as good as the one we already shipped, and to reconsider the word "Record" in the nav.**

**D2 — Named opponents with a character and no number.** `rfc/bot-roster.md` (draft, 2026-08-23)
registers twelve profiles as four measured bands × three families, each carrying a
`persona.<name>@1` presentation layer with a `name` and a `bio`, four shipping first `[V]`. Its
central measured claim is the one that makes a good picker possible: at a fixed band the guard
shifts expected loss **1.36 cp** and the trait **1.01 cp**, two orders of magnitude below the
~60-Elo session-resolution floor — **so the band is the strength range and the family is the
personality, and neither contaminates the other** `[V]` (`rfc/bot-roster.md` §Summary). That is
exactly the two-axis picker a learner wants: *how hard* and *what kind*.

**D3 — And the card may not show an Elo. This is the sharpest place where proper UX for us differs
from proper UX for everyone else.** Every bot picker in the market is a rating ladder; a number on
the card is the genre's defining convention. `rfc/bot-roster.md` registers every profile
`uncalibrated` and shows **no strength number** `[V]`, because no vendor has ever validated a
weakened-bot label against humans — Stockfish's own PRs admit ±100 engine-pool slop, and maia1
measures 1434–1666 against a target of 1100 `[P]` (relayed from [[D819]], which is a 💡 candidate
row, **not a ruling** — [[D1400]] is the standing warning against citing 💡 rows as rulings, and
this dossier does not).

So the design problem is: **convey difficulty without asserting a rating.** Three honest devices,
all available today:

1. **Relative ladder position.** *"first rung"*, *"steady"*, *"testing"*, *"top measured rung"* —
   the shipped `/rating` labels, which order the rungs without claiming any of them equals a FIDE
   number. This is already the answer and it is already written.
2. **Character, from the family.** The bio is a description of *how it plays*, which is a fact about
   the policy composition, not a claim about chess.
3. **Your own result against it.** After a few games the honest, learner-specific answer exists:
   *"you have drawn two and lost one against this rung"*. That is a fact about the learner's runs.

**D4 — The opponent choice belongs beside the preset, not inside it.** `rfc/intent-presets.md` §8.1
is explicit and I am adopting rather than reopening it: *"A preset is viewer preference layered over
a run; opponent policy is run-creation state. A preset therefore never writes run state: the Just
Play starter may pre-fill its run-creation form's policy independently of whatever preset is
active"* `[V]`. So the start form has two independent choices — **who you play** and **how much help
you want** — and they are correctly separable. §7 designs the second.

### 6.4 What it costs and what it depends on

| item | cost | depends on |
|---|---|---|
| D1 band picker in Just Play | small — the four-rung control, the honest footer and the `targetElo` plumbing all exist at `RatingScreen.svelte:94-120` and `service.ts:566, 585` `[V]` | — |
| D1 nav rename ("Record") | trivial | — |
| D2 named roster cards | **blocked** — `rfc/bot-roster.md` is a draft, and `BOT_POLICY_PROFILES` is empty `[V]`. Eight of twelve profiles are further blocked on `searchBound` admitting `depth` (a run-schema lane) and on nothing populating `candidate.traits` `[V]` | that RFC's acceptance; owner: the RFC's reviewer |
| D2 roster **picker surface** | **unowned** — `rfc/bot-policy.md:434-437` says *"the roster *picker* UI… is Just Play / `play-composition` surface work and is not this RFC's"* `[V]`, and `play-composition.md` stops at the in-run column | §11 routing decision |
| D3 no-number labelling | free; it is a copy decision already made | [[D819]] remains 💡 and the calibration ladder is **not funded** `[V]` — so this is permanent, not temporary |

---

## 7. Feature E — presets: where they are chosen and how they are explained

### 7.1 What the user expects

A learner does not want to configure assistance. They want to answer one question — *how much help
do I want right now?* — and they want to answer it **before they start**, because after they start
they are thinking about chess.

They expect three to five named options, each with one sentence saying what it does, one of them
marked as the recommended default, and the ability to change it later without losing anything.

They do not expect a matrix.

### 7.2 What competitors do

Evidence in §4.6. The market has already converged on the answer and named it better than we have.

- **Chessiverse ships exactly this: three named levels of help — Full Help / Peek / Hint Only —
  with a measured graduation gate to rated play** `[V]`. Its published vocabulary is *"levels of
  help"*, not "support mode" `[V]`. Three names a learner understands with no glossary is the
  benchmark our five candidate names must clear, and it is why E1 insists the **promise sentence
  ships with the label** rather than behind it.
- **Where we must diverge, and it is already ruled.** Full Help colour-grades every legal move
  pre-commit, always `[V]`. `05` §Presentation as amended on O4 states *"proactive blunder
  prevention belongs only to an explicit Support preset and is not the rehearsal default"* `[V]`,
  and our own reading of this exact evidence is that Full/Peek *"cannot silently become the
  rehearsal default"* (`[M]`, `competitor-love-hate-sweep.md:51-53`). So we adopt the **shape**
  (three-to-five named levels, chosen up front) and refuse the **default position** — the
  transformation move `02` §Adoption posture prescribes.
- **A quiet mode should be one action, not a settings dive.** Lichess's zen is a single key with
  three preference states `[V]`; chess.com ships a Zen Mode toggle `[P]`. The synthesis is explicit:
  *"the quietest preset has a dedicated toggle, not a settings dive"* `[P]`.
- **Noctie splits feedback settings between games and review** `[V]` — evidence that per-context
  assistance is a real user need and not our own over-engineering. Our eight contexts are the same
  idea; what is missing is the ordinary view in front of them.
- **Dr. Wolf shows what a support preset looks like when it seizes**: a blocking *"Are you certain?"*
  dialog before a mistake `[V]`, and the dossier could not establish whether it can be turned off
  (open residual). `05` §3b already ruled our version — *"a passive marker the player may open,
  never a modal"* — before this evidence arrived.

**Load-bearing `[P]`/`[M]` disclosure:** the framing statement I most agree with —
*"Expert primitive configuration belongs in Advanced/Inspector/Authoring; normal workflows select
named presets and honest ceilings"* — is `[M]` synthesis in our own sweep
(`competitor-love-hate-sweep.md:144-149`), not a competitor observation. E3 does not need it: `05`
§Presentation already rules the same thing on O4.

### 7.3 What we should do, and why it differs

**The situation, measured.** The preset layer is *fully built and reaches no screen.*

- Five presets ship with learner-ready labels **and authored promise sentences** —
  *Quiet*: "Legal interaction stays visible; no chess guidance appears unless you ask."; *Guide me*:
  "After you commit, a small consequence nudge; ask for more when you want it."; *Theory only*:
  "Cited applicable theory; no evaluation, no candidates, no line."; *Support*: "Staged-move risk
  warnings, on request, before you commit. Never the best move."; *Analyze*: "Attributed raw
  evidence, evaluations and lines, in an explicit inspector." `[V]`
  (`packages/runtime/src/presets.ts:31-38`).
- Eight workflow contexts declare a `defaultPreset`, an `allowedPresets` set and a `moduleCeiling`,
  and the module runs `assertPresetFoundation()` at import, which enforces **28 admitted / 12
  refused** context-preset pairs `[V]` (`presets.ts:41-68, 91-97`).
- The client has `loadWorkflowPreset` / `saveWorkflowPreset` over a dedicated
  `tabiya.workflow.v1.<context>` key `[V]` (`assistance-preference.ts:20-40`).
- **`grep -rn "preset" apps/web/src --include=*.svelte` → 0 hits**, and `presetDeclaration`,
  `loadWorkflowPreset` and `saveWorkflowPreset` have zero non-test callers in the repository `[V]`.

The user-visible consequence is exactly the owner's complaint. What a person actually finds is
`/settings` → *"This deployment"* → **Assistance by context**: a grid of eight fieldsets × nine raw
enum controls = **72 controls** `[V]` (`AssistanceSettings.svelte:18, 60-74`), each named after an
internal axis (*Board lighting*, *Arrows*, *Ambient presence*, *Passive markers*, *Named-pattern
guidance*, *Human move split on request*, *Corpus counts on request*, *External voice*, *Spoken
guidance*), below a read-only **Deployment capabilities** `<dl>` and a raw **Surface availability**
`<ul>` printing seven internal surface ids and their availability strings `[V]`
(`App.svelte:1102`; `apps/server/src/capabilities.ts:40-48`). That is the "10 million options"
surface, and [[D1452]] measured that it grew by a third — 54 → 72 — while its own defect row stayed
open.

**E1 — The preset is chosen at the start, in the same form as the opponent, with its promise
sentence visible.** Not discovered in-run, not found in settings. `rfc/intent-presets.md` §7 places
**the preset pill and the disclosure footer inside the run** (`play-composition.md:159-160,
169-170`) `[V]`, and §7.1 explicitly declines to decide their visual form, seating and motion,
naming `play-composition` Discharge D1 as the owner `[V]`. **Nothing in the corpus owns a pre-run
preset choice**, and §8.1 explicitly permits the start form to carry run-creation state beside it.
So this recommendation lands in genuinely open space rather than contradicting an RFC in
implementation — but it needs a home, which §11 records.

The values are all pinned as of the 2026-08-24 amendment: which presets to offer
(`workflowContextPolicy(context).allowedPresets`), which is active on entry (`loadWorkflowPreset`),
the label (`presetDeclaration(preset).label`), and the promise sentence
(`presetDeclaration(preset).promise`) `[V]` (`rfc/intent-presets.md` §7.1 table). The start form
needs nothing that does not exist.

**E2 — Name the default instead of letting it be encountered as emptiness.** This is the resolution
of [[D484]]'s standing sentence — *"silence-by-default is a correct invariant and a hostile first
run, and nothing in the design tier distinguishes those two claims"* — at the arrival surface. The
default does not move. `quiet` remains the default for six contexts and `guided` for `onramp` and
`academy` `[V]`. What changes is that a learner *chooses* it, sees the sentence
*"Legal interaction stays visible; no chess guidance appears unless you ask."*, and therefore
experiences an opinion rather than an unfinished feature. This costs zero disclosure and is the
single highest-leverage copy change in the arrival flow.

**E3 — The 72-control grid becomes Advanced, reachable from the preset menu. Nothing is removed.**
`design/05-in-run-experience.md` §The config owns the matrix, as amended 2026-08-20 on O4, already
rules this: *"Ordinary views expose modules and presets; raw source/form switches live in
Advanced/Custom surfaces or the inspector — and every registered primitive still has an explicit
disposition somewhere"* `[V]`. The shipped grid is the Advanced surface; it has simply never had
anything in front of it. This is not a scope cut — all 72 controls stay, all eight contexts stay,
and the disposition requirement is satisfied by construction.

**E4 — A refused preset is absent and explained, never greyed out.** `intent-presets` criterion 2
already requires typed refusal `[V]`, and the `match` context admits exactly one preset, `quiet`
`[V]` (`presets.ts:45`). At arrival that means: when a learner starts a match, the form shows one
posture and one sentence saying why — the shipped `SuppressionRecord` `{subject, by}` shape exists
for exactly this `[V]` (`intent-presets` §7.1). *"Support isn't available in a match"* is the RFC's
own example.

**E5 — Order the presets by what they cost the learner, not by internal id.** The authored order
today is `quiet, guided, theory_only, support, analysis`. Presented as a start-form choice they
should read as a ladder of assistance — *Quiet (recommended) → Theory only → Guide me → Support →
Analyze* — because the learner is choosing a position on a scale, and `05` §3's whole argument is
that the ladder's ordering is the meaningful structure.

### 7.4 What it costs and what it depends on

| item | cost | depends on |
|---|---|---|
| E1 preset in the start form | small — every value is pinned by `intent-presets` §7.1 and shipped | a **home**: no RFC owns the pre-run surface (§11) |
| E2 named default | free; it is E1's copy | E1 |
| E3 Advanced demotion | small; a route and a heading | E1 |
| E4 typed refusal copy | small | `SuppressionRecord` is specified; check it is populated at HEAD before relying on it |
| E5 ordering | trivial | — |

---

## 8. Feature F — the transition into the board

### 8.1 What the user expects

Three things, in this order, within two seconds of the board appearing: *whose move is it*, *what am
I trying to do*, and *what happens if I get it wrong*. The third is the one this product can answer
better than anything else in the market, and it is the one that never gets said.

They also expect the board to be theirs — their piece set, their colours — because for a chess
player that is not decoration, it is legibility.

### 8.2 What competitors do

Evidence in §4.7 and §4.8.

**On latency and the catalogue-to-board hop**, the corpus contains exactly one measurement and it is
ours to beat: CET, hands-on, **cold load 593 ms / 672 ms; catalogue list → playable board under 2 s,
"subjectively immediate"; first opponent reply ~2.1 s, subsequent 150–300 ms** `[V]` observed. The
same session recorded the field report of *"slow, poor UX"* **not reproducing** on desktop. **We have
never run the equivalent measurement on ourselves** (§12), and `teardown-protocols.md:20-25` already
specifies it: *"Cold start: time from URL open → first position playable"*, with a stated budget of
*"effectively instant; <250 ms warm"*.

**On the board's first sentence**, CET's one hands-on usability finding transfers directly: illegal
moves are rejected **silently**, *"which briefly confused even us"* `[V]`. Silence at the board
reads as breakage even to expert observers who know the product. That is the same mechanism as
[[D494]] and it is the argument for F1's rewording.

**On appearance**, the field's ceiling is Lichess — 25 board themes, 41–42 piece sets, five
backgrounds defaulting to Device, image-tuning sliders, four animation levels `[V]` from source —
and the arrival-relevant detail is **chess.com's gear next to the opponent's clock** `[V]`, which
puts board and piece choice one click from the board rather than behind a nav item.

**The absence, stated because F4 would otherwise appear to rest on it:** no dossier in this
repository establishes whether *any* competitor previews a board theme or piece set before applying
it. `competitor-play-ux.md` §5's table counts options and records settings paths and has no preview
column `[V]` as a scoped absence. F4 rests on our own measured blindness and on `05` §1, not on the
market.

### 8.3 What we should do, and why it differs

**F1 — Every entry into the board states its objective, and the pack-less case states the
*promise*, not the *absence*.** Today the objective region renders, for Just Play,
*"No pack is loaded. Nothing is claimed about this position."* `[V]`
(`DrillScreen.svelte:922-933`). Invariant 5 requires that absence be stated; it does not require
that absence be the *headline*. The same fact, stated as intent: *"Nothing is authored about this
position — Tabiya reads it as you play, and marks the moments worth returning to."* That is true
(pivotal detection is shipped: irreversibility, phase change, human divergence, option collapse —
`03` §Adaptive guidance `[V]`), it discloses the same absence, and it tells the learner what the
next sixty seconds hold instead of what they lack.

**F2 — The consequence contract is stated once, at the first board.** *"Play the move. You will see
what it does. Then you can go back — and you will still have this."* This is the product's thesis
(`00-thesis.md` §Why anyone would use it: *"experimentation without cost"*) and it is stated nowhere
in the product. It is not assistance and not evidence, so it touches no rung and no disclosure gate:
it is a statement about the software's behaviour.

**F3 — Where the target is honest, declare it before the first move; where it is not, say that
too.** `00-thesis.md` §Why anyone would use it makes this binding: *"the target must be honest, so
it can only be set where the result is assessable"*, and *"a product that declares 'this is held'
and is wrong has done real damage"* `[V]`. The arrival consequence is concrete: an Outcome pack that
opens with *"This is drawn with correct defence. Hold it."* has converted "you are worse" from a
failure into the premise — which is the second of the two mechanisms the thesis says nothing else in
chess offers. Below eight pieces a tablebase settles it; above, the pack's authored assertion must
be **labelled as an assertion**. Both halves are arrival copy, and the machinery
(`OutcomeContext.svelte`, `assessment`, `resistance`) is already wired into the run screen `[V]`
(`DrillScreen.svelte:979`).

**F4 — Appearance gets a preview, and it is an arrival feature.** The owner named this directly.
Measured: `AppearanceSettings.svelte` renders five `<select>` elements — App theme, Light or dark,
Board, Pieces, Piece movement — whose options are **text labels only**; nothing renders the thing
being chosen `[V]`. `rfc/theming.md` contains **0** occurrences of *preview*, *thumbnail* or
*swatch* `[V]` ([[D1451]] found the same). The catalogue is small — 3 app themes, **2** board
themes, **2** piece sets `[V]` (`theme/axes.ts:1-14, 35-43`) — so this is not an over-choice
problem; it is a *blind*-choice problem, and one option is labelled *"Cburnett"*, a piece-set
author's surname.

The fix is cheap because the component exists: `<Chessboard>` already renders a position from a FEN
at arbitrary size and is already used as a `mini-board` in the live wall `[V]`
(`App.svelte:1059`). A 4×4 or full 8×8 preview beside the selectors, plus per-option swatches, is
one small component. This should also be reachable from the first run — a chess player who cannot
find their pieces will not evaluate anything else you show them.

### 8.4 What it costs and what it depends on

| item | cost | depends on |
|---|---|---|
| F1 objective copy | 1 string | — |
| F2 consequence contract | 1 string, first-run-scoped | A1 |
| F3 honest target at entry | small copy; the labelling rule is already ruled | pack authoring supplying the assertion + its label |
| F4 theme preview | small; reuses `Chessboard.svelte` | `rfc/theming.md` names no preview; this is a new obligation for that RFC or its D5 felt pass (§11) |

---

## 9. The whole arrival flow, end to end

Collecting §§2–8 into the sequence they produce, so the recommendation can be read as one thing:

1. **Land.** *"Do not just learn the move. Rehearse the game it creates."* A board is visible. One
   button: **Try it**. (A2)
2. **The loop, on rails, ninety seconds.** One position → commit → the consequence plays → *"That
   happened. It is kept."* → rewind → the other move → both attempts side by side. (A1)
3. **The offer.** *"Keep these two attempts?"* → account. (A1 step 5, owner-gated)
4. **Home.** Continue · Due and open · Pick up a thread, degrading to Start here · the honest empty
   queue · three phase entries. (B1)
5. **Choose what to do.** Phase → filtered, searchable catalogue; cards leading with the authored
   objective sentence and a verb, difficulty stated relative to the learner. Or: Just Play. (C1–C5)
6. **Choose who and how much.** Two independent controls in one form: the opponent rung (named,
   characterised, no Elo) and the posture (five presets, promise sentence visible, default named).
   (D1–D4, E1–E5)
7. **The board.** Objective or promise, the consequence contract said once, the honest target where
   there is one, and pieces the learner recognises. (F1–F4)

Seven steps, of which the product today has parts of 4, 5 and 7.

---

## 10. Where this contradicts or outruns the design tier

Flagged per `design/research/README.md` — *"contradicting a design doc is a feature"*. None of these
were resolved by editing intent.

**DESIGN-GAP 1 — `03` §Learn and return promises phase navigation and filters that do not exist.**
*"Phase-oriented discovery: opening/early game, middlegame, endgame, and connected trajectories are
first-class navigation and filters"* `[V]`. Measured: `phase` appears in the client exactly twice,
both in `PackList.svelte`, both as static text `[V]`. No filter, no sort, no search, no phase route.
B7 is recorded as *"shipped 2026-08-13"* in the breadth gate table; the phase-discovery half of the
row is not shipped. This is a gate-row correction, and gate rows are mirrored intent — so it is
listed for the owner rather than edited.

**DESIGN-GAP 2 — the corpus's only statement on onboarding forbids it, and nothing else in the
tier mentions arrival at all.** `rfc/archive/adaptive-guidance.md:367`: *"guided mode is a choice,
never an onboarding state"* `[V]`. `planning/ux-work-lane.md` Q6 records that *"nothing in `03` or
`05` describes"* a first-run experience `[V]`, and [[D1451]] measured **zero** BACKLOG rows on the
subject. That archived sentence is correct about *guided mode* and is being read as a prohibition on
*onboarding*; they are different things, and §2.3's A1 is neither (it is a scripted run of a real
pack, not an assistance state). The distinction needs stating by someone entitled to state it.

**DESIGN-GAP 3 — `03` §Stable application shell's Home row is *"resume, due work, recent sessions,
quick start"*, and "quick start" has never been defined or built.** `[V]`. Home ships resume and a
button to `/play`. The other three are the subject of §3.3. Not a contradiction — an unbuilt row
that no gate tracks.

**DESIGN-GAP 4 — `02` §Adoption posture's ruled boundary is where the guest question sits.**
*"Reads are byte-identical per run, and the only anonymous access is a scoped token (`story_read`,
`session_join`)"* `[V]`. A first run before an account is a new anonymous surface. The adoption
posture also says *"an adopted feature enters through our invariants"* and that *"a conflict with an
invariant is a design prompt, not a veto"* `[V]` — which is the right frame for this: the
transformation is a run that exists locally and is *claimed* by the account created at the end,
rather than a broad anonymous read surface. That transformation is proposed, not ruled.

**Correction to a standing row (not a gap).** [[D484]]'s clause *"a new user gets a board with no
legal-move highlighting"* is stale: `SILENT_ASSISTANCE.boardLighting` is `"legal"` at HEAD `[V]`, and
`PROFILE_DEFAULTS.onramp` ships `guided: "live"` `[V]`, which also takes `planning/ux-work-lane.md`
Q4. The 72-control half of D484 stands and is [[D1452]].

---

## 11. Owner decisions this dossier asks for

Named, not written. Each blocks something specific; nothing else in §§2–8 is blocked.

**O-A1 — Is there a first run, and is a scripted play-through of a real pack an "onboarding state"
in the sense `rfc/archive/adaptive-guidance.md:367` forbids?** *Blocks A1, and A1 is the largest
item here.* My reading: no — that sentence governs `guided` as an assistance mode, and a scripted
first run changes no `AssistanceConfig` field and asserts nothing about chess. But the sentence is
the corpus's only statement on the subject and an implementer building against it would be building
a test failure by design ([[D1451]]). One clause settles it.

**O-A2 — May a person play before creating an account, with the run claimed at signup?** *Blocks
A1 step 5.* Reopens `02` §Deployment's anonymous-access ruling. The narrow form — a local run
claimed by the account that follows — is materially smaller than "guest mode" and is the version I
recommend asking about.

**O-C5 — `planning/ux-work-lane.md` Q2, unanswered for eight days: does Tabiya serve unreviewed
content to a learner, and under what disclosure?** *Blocks the catalogue-level honesty statement's
wording; does not block C1–C4.* Today's state — correct gate, zero graduable, 56 items each badged
"unreviewed draft", and no message explaining why — is the one option that serves nobody. Three
honest paths were already named there.

**O-D2 — Who owns the roster picker surface?** `rfc/bot-policy.md:434-437` routes it to *"Just Play
/ `play-composition` surface work"* `[V]`; `play-composition.md` covers the in-run column and
[[D1450]] found it *"says almost nothing about `App.svelte`'s other 15 route bodies"*. The start
form has no owner. This is a routing decision, not a design one, but it needs making before D1/D2
can be scheduled.

**O-E1 — Where does the preset get chosen before a run starts?** `rfc/intent-presets.md` §7 seats
the pill and footer **in the run** and §7.1 declines the visual form; §8.1 permits the start form to
carry run-creation state beside it `[V]`. Nothing owns the pre-run choice. Same shape as O-D2 and
plausibly the same answer — one surface owns the start form, and it carries opponent + preset
together.

**O-F4 — Does `rfc/theming.md` gain a preview obligation, or does it go to its D5 felt pass?**
That RFC contains 0 occurrences of preview/thumbnail/swatch and specifies apply-then-see `[V]`
([[D1451]]).

**Ledger note.** Law 4 requires a row for every idea. This dossier's recommendations are not yet in
`design/BACKLOG.md`; the commit that lands it touches only this file (concurrent agents share the
worktree). The rows owed are: the arrival flow itself (§9), phase navigation (DESIGN-GAP 1), the
pre-run preset surface (O-E1), the Just Play band picker (D1), and the theme preview (F4 — though
[[D1451]] arguably already carries it).

---

## 12. What I did not check

- **I did not run the application.** Every `[V]` here is a file-and-line reading at `8a65a34`, a
  `make` target run today, or a JSON census of `content/`. Claims relayed from
  `planning/app-reality-check.md` and `planning/ux-work-lane.md` are cited to those documents.
- **I did not verify any competitor claim hands-on.** §4 states this per claim.
- **I did not check mobile or the responsive transformation of any arrival surface.**
  `design/research/mobile-scope.md` owns that and the answer there is "tolerate, responsive-only".
- **I did not check the accessibility of the proposed flows.** `05` §Presentation as amended
  requires input semantics equivalent across touch, pointer and keyboard/assistive use; the shipped
  board input was repaired by `accessible-board-input` (`2b68103`) but nothing in §§2–8 has been
  reviewed against it.
- **I did not check whether `SuppressionRecord` is populated at HEAD** — E4 assumes it is, and
  `rfc/intent-presets.md` is *implementing*, not landed.
- **I did not exercise Create, Live, or the campaign** (unbuilt).
- **I did not measure our own cold start or catalogue-to-board time**, which is the cheapest missing
  measurement here: `teardown-protocols.md:20-25` already specifies the procedure and states the
  budget (*"effectively instant; <250 ms warm"*), and CET's hands-on numbers exist to compare against
  (§4.8). Nothing has ever been run against Tabiya.
- **I did not measure how long the loop in A1 actually takes.** "Ninety seconds" is `[M]`.

---

## 13. Coverage-matrix row owed

`design/research/README.md:3-5` makes the README the coverage matrix and requires a row per landed
dossier; `teardown-protocols.md:8-9` restates the obligation. **The row is not written by this
dossier's commit**, because two sibling UX dossiers (`ux-after-the-run.md`,
`ux-live-and-social.md`) are untracked in the same worktree at this moment and staging
`design/research/README.md` would absorb their rows — the staging discipline in `CLAUDE.md`
§Command authority. The row, ready to paste under `## Coverage matrix` in the shipped
`| Area | Feeds | Status | Report |` format:

```
| UX — arrival and getting into a session (first run, home, choosing a drill/opponent/preset, into the board) — owner ask 2026-08-24 *"from a user perspective per feature… PROPER UX"* | [[D484]], [[D494]], [[D1427]] Q6, [[D1451]], [[D1452]], `rfc/intent-presets.md` §7/§8.1, `rfc/bot-roster.md`, `rfc/theming.md`, B1/B7 | covered `[V]` for our own surfaces (source read at `8a65a34`, `make graduation-report`, `content/` census) + `[P]` desk for every competitor claim — **no competitor was used hands-on except CET**; four owner rulings requested (first-run legality, guest-then-claim, unreviewed-content disclosure, pre-run preset/opponent surface ownership); DESIGN-GAP on `03` §Learn and return's unbuilt phase navigation | `ux-arrival-and-start.md` |
```
