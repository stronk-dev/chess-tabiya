# Codex wave 3 — the work that needs no ruling

**Opened 2026-08-24.** The 2026-08-23/24 wave produced ~180 ledger rows, twelve UX dossiers and a
four-tier reconciliation. Most of it is specification. **This file is the subset that is buildable
right now** — nothing here waits on an owner ruling, an RFC acceptance, or a document I still owe.

Ordered. Each item names its ledger row, its evidence, and what "done" means.

## 1. Instruments first — they are blocking other agents today

1. **`register-check` must not read the working tree** ([[D1509]]). It derives migration heads from
   the working tree, so one agent's uncommitted `STORAGE_VERSION` bump blocks the pre-commit hook for
   every other agent and forces the `--no-verify` escape the hook exists to prevent. Derive from the
   index or from HEAD. **Done:** a dirty unrelated storage edit no longer fails an unrelated commit.
2. **Chain `test-browser` back into CI** ([[D1507]]). The step that linked it was created and deleted
   the same day, so a deterministic failure has been invisible. **Done:** the suite runs before push.
3. **Fix the failure it hides** ([[D1507]]): the boundary sheet **announces authored commentary and
   does not render it**. **Done:** announce and render agree, asserted by the suite.
4. **A manifest-freshness check** ([[D1508]]). All 32 sourcing manifests are stale against their own
   packs — zero match — found by an accidental command rather than any check, and it puts *"full
   content"* in question. **Done:** staleness fails a gate instead of waiting for luck.

## 2. Accessibility — twelve defects, none needing a ruling

Full list and line references in `design/research/ux-accessibility-and-mobile.md` §4 ([[D1492]]).
Highest value first:

5. **Keyboard square-sight parity** ([[D1447]]) — two lines. `Chessboard.svelte:144` binds `onSelect`
   to Chessground's **pointer** select only; call it from the `activate` transition, and specifically
   **not** from `onActiveSquareChange`, since sight is on-request rather than on-cursor.
6. **The nine drill shortcuts are dead at all twelve verified tab stops** ([[D1492]]).
   `interactiveTarget()` classes every `<button>` in the composed path as interactive and the handler
   then declines the event. **Done:** shortcuts work from the tab stops a keyboard user actually
   reaches, with a key that returns focus to the region.
7. The remaining ten: `KeyboardHelp` clipping with no `overflow`; the skip link targeting the nav it
   should skip (**[[D1531]]: `<main>` is NOT missing — 17 landmarks ship, and adding one would nest
   landmarks; the skip-link target is the whole defect**); a static `<title>` across twelve routes; route changes moving no focus
   and announcing nothing; the busy live region `display:none` below 60rem so *"Thinking…"* is never
   announced on a phone; `ShapePanel` with no dialog role, focus move, restore or Escape; two
   sub-24px targets; `<kbd>` inside accessible names; phone tabs with no selected state.

## 3. The presentation layer — the part [[D1435]] unblocked

8. **The preset pill and disclosure footer** ([[D1435]], [[D1457]]). The blocker was never a missing
   feature — the config projection and clamp tables are now written, and §7.1 enumerates the eight
   values the surface reads. Every one of the nine config fields already has a shipped consumer.
   **Done:** a learner can see and change their preset without meeting a 72-control matrix.
9. **Label the assistance controls with questions, not producers** ([[D1454]]). `rfc/module-registration.md`
   §1.4 already writes each module's intent in the first person; bind `label = declaration.intent`.
   **Done:** no control in the run screen is named after the thing that produces it.

## 4. Authoring — wiring, not building ([[D1488]])

10. **`lintPackDraft` client caller.** The endpoint accepts arbitrary unsaved bytes and has no caller,
    so an author must upload a draft to be told it is wrong. `api.ts` already has `lintShapeDraft`.
11. **Studio and `make pack-check` must run the same checks** — the docs already claim they do. Two
    constructor arguments; four codes are currently unreachable in Studio.
12. **`GET /principles`** — `rest.ts` contains the string `principle` zero times while
    `principle-registry.ts:63` holds a finished, sorted browse projection.

## 5. Small and shipped-wrong

13. **[[D484]]'s control styling** — priced at ~4 lines in `planning/ux-work-lane.md:635`, open since
    2026-08-16, and the matrix grew 33% while it sat.
14. **[[D1441]]** — `evidenceKindLabel` labels one member of four, so `wdl` reaches a learner as `wdl`.
15. **[[D1421]]** — no suppression rule for already-decided positions; we grade +4.67 → +2.67 a
    *mistake* where Lichess says nothing. Worse under the ruled 2.5 floor, and freechess's published
    `Brilliant` already carries the not-already-winning cutoff, so the shape is not an invention.

## What is NOT here, and why

**Waiting on the owner:** twelve intent amendments (law 5, [[D1505]]); the casting fence and the
onboarding prohibition ([[D1451]]); the failure state ([[D1300]]/[[D1499]]); O5, O9 and O11; the
public-matchmaking question under [[D1414]]; cohort read symmetry ([[D1482]]).

**Waiting on me:** the [[D1505]] protocol clause — until it lands, any rollup we rebuild drifts again
by the same route; ~97 proposed dossier rows to land and route; repairs to the three blocked drafts
([[D1410]], [[D1411]], [[D1412]]); the `social-play` rebuild on native-first; the `hint-distance`
redraft behind codex's selector gate.

## ⚠ THIS FILE IS A CURATED SUBSET — [[D1522]], 2026-08-24

Fifteen hand-picked items against **hundreds** of recommendations across twelve UX dossiers. The
owner named the failure: *"why do i have to explicitly keep mentioning every single little thing?"*
Curating is the defect — everything unselected leaves the visible surface, and the owner becomes the
index.

**`planning/ux-implementation-index.md` is the complete enumeration**: every dossier item classified
(buildable now / blocked on a ruling / blocked on an RFC / already done / superseded), cross-checked
against every queue, with **in no queue at all** as a first-class count. Its buildable-now items are
appended below this file's section 5. **Work from the index, not from this list.**

Two items the owner had to name himself, both now tracked:

- **Bot personas / the honest bot card** ([[D1501]], [[D1502]]) — `design/research/ux-opponents.md`
  specifies it in full and it was queued **nowhere**. A card may describe the machinery and its
  absences in the language of what the learner will experience, never the bot as *a kind of chess
  player*; and the persona word-filter must become a **provenance rule**, since eight banned
  adjectives do not stop *"she likes to keep the position closed and grind"*.
- **Native ratings** ([[D1521]]) — ruled in scope by [[D1414]], **zero** occurrences in any queue.
  Blocked by [[D1516]]: `rated_games.run_id` is a PRIMARY KEY, one rated game per run, against a
  native match that is one run with two learners. **A named blocker is a queue entry, not an excuse
  for absence.**

**Standing constraint added today** ([[D1520]]): [[D1416]] deferred tournaments, leagues and operator
accounts **as features**; the **architecture must be ready for them**. Every 1.0 decision that would
make a later tournament expensive or impossible is in scope — the run/pairing aggregate and the
declared result ([[D1481]]) are the two already known.

### Why three enumerations did not stick — [[D1523]]

`work-index`'s entire check is *does this row's id appear as a string in a durable document*. It
cannot distinguish **queued** from **merely mentioned**. So each enumeration wrote a document, the
document cited the ids, the gate went green, and the work stayed undone — and because the
classification lived in the snapshot rather than on the item, the next enumeration began from zero.

**A fourth enumeration is not the fix.** The fix is a **persistent per-item state** — todo / doing /
blocked / done, with an owner — and an instrument that measures **assignment** rather than citation.
Until that exists, treat every "0 unrouted" line in this repository as saying nothing about whether
any work will happen.

---

## The complete buildable-now list — appended 2026-08-24 from `planning/ux-implementation-index.md`

**312 items**, and this is the whole of group (a) rather than a selection of it. Every one is
buildable at HEAD: no owner ruling, no unaccepted RFC, no document anybody still owes.
**195 of them were in no queue at all** before this section existed — which is [[D1522]],
measured rather than argued.

Ids are stable against the index. Read the index row for the blocker note, the code evidence and
the tournament flag; this list is the queue, the index is the reasoning. Items already named in
sections 1–5 above carry `[dup]` and are not new work. **🏆** marks an item where a 1.0 decision
touches tournament readiness ([[D1520]]).

**Ordered by dossier, not by priority.** Setting priority is the coordinator's job and doing it
here would reintroduce the defect this list exists to remove. If you want a starting point: the
items carrying `[dup]` are the ones somebody has already argued for, and every item whose note in
the index says *trivial*, *one string*, *one line* or *two lines* is an afternoon between them.

### Arrival and getting into a session — `ux-arrival-and-start.md` (25)

- **ARR-a1** (§2.3 A1) — The scripted first run: the loop itself on rails over a real `startPack` run — commit, consequence, rewind, the other move, both attempts on screen
- **ARR-a2** (§2.3 A2) — Say what this is above the fold: *"Do not just learn the move. Rehearse the game it creates."* + the loop in plain English
- **ARR-a3** (§2.3 A3) — Name the silence at the first board, not in settings — *"Tabiya doesn't comment while you're deciding."*
- **ARR-a4** (§3.3 B1) — Home **Continue** region degrades to *"Start here"* with a designated first-run pack, not to a button
- **ARR-a5** (§3.3 B1) — Home **Due and open** region: counts with verbs; `dueProgress`/`assignedPacks` are already fetched on the home route
- **ARR-a6** (§3.3 B1) — Home **Pick up a thread**: three specific suggestions returning, three phase entries on day one
- **ARR-a7** (§3.3 B2) — Delete the resume card's *"No previous run yet… Go to Play"* two-click abstraction
- **ARR-a8** (§3.3 B3) — A suggestion rail ranked on facts about the learner's own runs (permitted by `03` §Learn and return; nowhere near the rejected v1 identity)
- **ARR-a9** (§4.8) — **Measure our own cold start and catalogue-to-board time.** The protocol is written (`teardown-protocols.md:20-25`), the budget stated, the competitor number exists, and nothing has ever been run against Tabiya
- **ARR-a10** (§5.3 C1) — Phase-first filtered, searchable catalogue — three phase entries, band filter, free-text search over title + `concepts` + `objective.summary`, a sort
- **ARR-a11** (§5.3 C2) — The pack card leads with the authored objective sentence. `screen-model.ts:85` holds `objectiveSummary` and **has zero callers**
- **ARR-a12** (§5.3 C3) — Translate the mode enum into its verb — the card's first word is literally `line`, `plan`, `outcome`, `trajectory`
- **ARR-a13** (§5.3 C4) — Difficulty relative to the learner (*"sits at your band"*), with honest abstention where no band is measured
- **ARR-a14** (§5.3 C5) — Move the provenance stamp off the card's leading metadata row — *"unreviewed draft · community"* fires on 100% of 56 cards
- **ARR-a15** (§6.3 D1) — **Promote `/rating`'s four-rung named picker into `/play` and delete the two-word `<select>`.** The control, the honest footer and the `targetElo` plumbing all exist
- **ARR-a16** (§6.3 D1) — Rename the **"Record"** nav item — the product's only competent opponent picker is filed under a word meaning *history*
- **ARR-a17** (§6.3 D3) — Carry the no-Elo labelling verbatim: rung words + *"not FIDE, Lichess, or Chess.com"*
- **ARR-a18** (§7.3 E2) — Name the default preset instead of letting it be encountered as emptiness — the default does not move, the learner chooses it
- **ARR-a19** (§7.3 E3) `[dup]` — The 72-control grid becomes Advanced, reachable from the preset menu. Nothing is removed
- **ARR-a20** (§7.3 E4) — A refused preset is absent and explained, never greyed out (`match` admits exactly one preset)
- **ARR-a21** (§7.3 E5) — Order the presets by what they cost the learner, not by internal id
- **ARR-a22** (§8.3 F1) — The objective region states the promise, not the absence — *"Nothing is authored about this position — Tabiya reads it as you play"*
- **ARR-a23** (§8.3 F2) — The consequence contract, said once, at the first board
- **ARR-a24** (§8.3 F4) — **Appearance preview.** Five `<select>`s of text labels, zero rendered previews, one option labelled *"Cburnett"*. `<Chessboard>` already renders a FEN at arbitrary size in five places
- **ARR-a25** (§13) — The coverage-matrix row this dossier owes `design/research/README.md`

### The in-run experience — `ux-in-run.md` (11)

- **INR-a1** (§1.2) `[dup]` — Bind `label = declaration.intent` so the rail is a list of questions, not a producer census
- **INR-a2** (§1.3) — The help door states its disclosure cost in the same breath as the offer, **before** the click
- **INR-a3** (§1.4) `[dup]` — The preset pill and a **mandatory, always-visible** disclosure footer rendering `presetDeclaration(preset).promise`
- **INR-a4** (§2.3) — The honest empty carries the loop: *"Nothing recognizes this structure — play it and see, or rewind."*
- **INR-a5** (§3.2) `[dup]` — Keyboard square-sight parity — call `onSelect` from the `activate` transition, not from `onActiveSquareChange`
- **INR-a6** (§3.5) — Relayed (host-drawn) marks carry **visible attribution at all times**, not on hover
- **INR-a7** (§5.3) — Every declared honest-empty sentence gains its next legitimate action (the two verbs the post-commit guard already ships)
- **INR-a8** (§6.6) — Animation preference with a **None** option and a Normal default
- **INR-a9** (§8.1) — **Narrow `guided_hint`'s stage-3 admission now**: remove `live.stockfish.pv@1` from its accepts list and drop the ceiling to a single `move`. Today three documents jointly permit a guidance module to print an engine PV against that producer's own declared refusal
- **INR-a10** (§2.3) — The hint-reach harness must report **per rung**, not per family
- **INR-a11** (§4.3) — Stated caps rather than silent truncation (*"top 5 of 23 recorded moves"*)

### The core loop — `ux-core-loop.md` (24)

- **CLP-a1** (§1.2 d2 / §12 rec 1) — Render `branch.intent` on the compare surface. It is captured at the fork and thrown away at the payoff screen
- **CLP-a2** (§1.2 d1 / §7.2 L2) — Render `ComparisonRow.groups` — the per-ply equivalence partition is computed and **no renderer reads it**
- **CLP-a3** (§7.2) — Render `rows[].nodes[].actor` so the grid can distinguish a learner's ply from the opponent's
- **CLP-a4** (§1.2 d10 / §12 rec 13) — Fix piece-route chaining: UCI string-slicing produces `e2: e2 → e4 → e5` and labels routes by origin square
- **CLP-a5** (§1.2 d7) — Stop rendering the same eval data three times, unaligned, with no shared ply axis
- **CLP-a6** (§1.2 d9 / §12 rec 9) — **Stop calling the compare surface an "Evidence inspector"** — it says so four times on the screen that carries the originality claim
- **CLP-a7** (§12 rec 4 (Layer 2)) — Render `transposeKey` so re-convergence is visible
- **CLP-a8** (§7.2) — Render `materialBalance(fen)` in compare — it ships and `GroupPanel` uses it; `CompareView` has the FENs and does not
- **CLP-a9** (§4 R1) — Move the rewind **offer** to the consequence of finishing rather than an always-present control
- **CLP-a10** (§4 R2) — The rewind offer names what survives: *"Your attempt is kept. Going back makes a second one."*
- **CLP-a11** (§4 R4) — Say once at the campaign boundary that this is where rewinds are counted
- **CLP-a12** (§5 B1) — Fork modal: intent first, machine label optional. `fork()` already makes both optional
- **CLP-a13** (§5 B2) — Name a branch from the move plus the intent, not `alt-3`
- **CLP-a14** (§5 B3) — Branches appear in the move list as well as the rail
- **CLP-a15** (§6 D1) — **Replay at a different band as a first-class exit action from compare** — the thesis's own last clause, with no gesture in the product
- **CLP-a16** (§6 D5) — The learner moves the ladder; any band suggestion is accepted, never applied silently; applied band always visible
- **CLP-a17** (§2 C2) — The first commit of a run states the rule once: *"You will play this out."*
- **CLP-a18** (§3 P1) — The run states the consequence's horizon before it starts and holds it visible
- **CLP-a19** (§3 P4) — Adopt Conversion Trainer's entry copy without exposing an evaluation before play
- **CLP-a20** (§7.4) — Narrate the four genuinely unvisualisable things with their grounds attached — causation, prophylaxis, practical difficulty, unequal-length branches — rather than drawing them
- **CLP-a21** (§7.5) — Adopt ChessMotive's row-indexed alignment with a per-row same/different marker keyed on aligned ply
- **CLP-a22** (§0.1) — **Merge the two conflicting Chessiverse rows in `competitor-matrix.csv` (`:16` and `:58`)** and settle whether rewound lines persist as branches
- **CLP-a23** (§0.1) — Close verification item #5 (chessfeed.ai's claimed saved-branch exploration and checkpoint rewind), open since 2026-08-10
- **CLP-a24** (§11) — Seven named hands-on residuals: does Chessigma's Bot Challenge preserve a second attempt; does Chessiverse preserve rewound lines; is *"Bot at your level"* a human model; does Dr. Wolf's undo erase the attempt; does Noctie preserve anything across a takeback; is Chess.com's Retry one ply

### After the run — `ux-after-the-run.md` (28)

- **ATR-a1** (§1.1) — Route `session-controller.resume()` through `sessionErrorMessage` — it is the one catch that bypasses it, so a raw runtime message can still reach a learner
- **ATR-a2** (§1.2) — `GameStoryScreen` renders raw centipawn integers with a ` cp` suffix
- **ATR-a3** (§1.2) — The story rail is at most eight moments (`story.rank.slice(0,8)`) with **no move list**
- **ATR-a4** (§1.2) — Internal enum members reach the learner by underscore substitution: `eval pivot`, `option collapse`
- **ATR-a5** (§1.2) — **A false provenance footer ships**: *"rendered from recorded engine evidence"* on rules-marker cards
- **ATR-a6** (§1.2) — Ranked-8 client versus chronological-8 server divergence inside `publicStory`
- **ATR-a7** (§1.3) — Attempt rows print the raw `AttemptVerdict` enum (`stable` / `unstable` / `open`)
- **ATR-a8** (§1.3) `[dup]` — `{JSON.stringify(page.scan.population)}` is rendered to a learner
- **ATR-a9** (§1.4) — Two `band()` formatters disagree one screen apart
- **ATR-a10** (§1.4) — 24 of 31 on-ramp packs claim *"opponent near your rating"* over a puzzle-difficulty rating, with no learner rating in that path
- **ATR-a11** (§1.7) — **The compare screen's prominence is inverted**: the grounded narrative is 7th of 8 and collapsed, beneath an expanded engine sparkline — on the screen every *Retry from here* lands on
- **ATR-a12** (§2.3) — Terminal sheet: order the two doors *Play it again from here* then *Review the whole game*
- **ATR-a13** (§2.3) — Four terminal-sheet prohibitions, written down: no accuracy figure, no grade counts, no rating movement on an unrated run, no praise class
- **ATR-a14** (§3.2) — Adopt the two field layout invariants verbatim: nothing grows in the board column; regions scroll, the board does not
- **ATR-a15** (§3.3) — Tier 1 lives in the move-list row and is **never painted on the board**; most rows stay empty; never invent a tier-0 "ok" chip
- **ATR-a16** (§3.4) — Split `eval_pivot` by rung so blunders rank above mistakes
- **ATR-a17** (§3.4) — **Drop `irreversibility` to last** — a 79.9% false-positive rate on a shipped, unasked marker, reproduced by two harnesses
- **ATR-a18** (§3.5) — Human rarity may **select** a moment and may never **valence** one; outcome correlation is refused by name as a valence authority
- **ATR-a19** (§3.6) — A decided position is never a tier-2 door, whatever its grade
- **ATR-a20** (§3.6) — State grade suppression once at region level — silent suppression is a second defect
- **ATR-a21** (§3.7) — Order is never shown as a rank; a permanent region line says *"these are the moments this game left evidence about… not a ranking"*; *"educational value"* never appears in copy
- **ATR-a22** (§3.8) 🏆 — **`App.svelte:369-371` throws on any device other than the one that played the run**, killing the primary CTA
- **ATR-a23** (§5.3) — The first rewind outside a campaign says once that it is free
- **ATR-a24** (§5.3) — The learner-facing noun is *"earned rewinds"*, never the schema's `charges`
- **ATR-a25** (§6.3) — Adopt Chessigma's return hook stating a recorded outcome and moment index, never an eval; name the Conversion-Trainer composition (near-level-in-a-loss + save/hold objective + opponent)
- **ATR-a26** (§6.3) — Six return prohibitions written down: no streak, no day count, no calendar grid, no falling-behind framing, no learner-set intervals, no hidden difficulty threshold
- **ATR-a27** (§0.3) — **Zero notification machinery exists repo-wide** — `notify`, `email`, `reminder` all return nothing. State the limit in the lane rather than letting a return recommendation imply outreach
- **ATR-a28** (§9) — The falsification instrument: one owner run through both rendered tiers — a wrong tier-2 door means the severity read was right after all

### Live, casting and social — `ux-live-and-social.md` (25)

- **LIV-a1** (§1.1a) 🏆 — `kind: "match"` plus the default `host_directed` board silently produces a two-leg PGN-paste Arena. **Two selects jointly decide which product you get and neither names it**
- **LIV-a2** (§1.1b) — The eligible-run rule (untouched position run, named handle) is invisible until the server throws
- **LIV-a3** (§1.1c) — `createLive` is invoked as `void` with no catch — **the error path renders nothing**
- **LIV-a4** (§1.1d) 🏆 — Every live session is titled `` `${liveKind} session` `` — the user is never asked
- **LIV-a5** (§1.4a) — The broadcast overlay headline is a raw runtime enum (`node.objectiveState`) rendered untranslated
- **LIV-a6** (§4 C3) — Replace that enum with the run's human objective sentence, and say so when it is absent
- **LIV-a7** (§1.3a) — The overlay is the host's own OBS capture surface requiring an in-OBS sign-in and **nothing documents it**; name the seam once — copyable URL, transparent background, the cookie step
- **LIV-a8** (§3 B1) — **The audience preview**: one host-side control rendering exactly what a viewer sees
- **LIV-a9** (§3 B3a) — State that the board is never delayed, and instruct streamers to set delay in their streaming software
- **LIV-a10** (§3 B4) — Reframe the cast pitch as commit → play → rewind → fork → compare; *"{n} branches"* needs a noun
- **LIV-a11** (§1.5a / §11-5) — **`castVote` has zero client callers — the audience cannot cast a vote.** The server side is complete
- **LIV-a12** (§4 C5) 🏆 — `mintJoinLink` hardcodes `participant`; there is no *watch this* link mintable from the interface
- **LIV-a13** (§1.5c / §11-6) 🏆 — `session_invitations.state` has one producer and no `UPDATE` — the state can never move
- **LIV-a14** (§6 E1–E4) — **Streamer mode**: a three-state chrome preference on the existing keybinding registry that hides handles, ratings, the assistance rail, evidence panels, authored markers and shell chrome, states what it does *not* do, and stops the word *"Stream"* meaning two things
- **LIV-a15** (§7 F2) — Surface **pause-by-consent** in the invitation copy — the uncontested differentiator, unmentioned
- **LIV-a16** (§9 9-S) — The worked Stream preamble (five answers, including *no delay, no chat, no anonymous viewer*)
- **LIV-a17** (§9 9-Ma) — Match/Arena needs two preambles because it is two features
- **LIV-a18** (§10-q) 🏆 — `RunService.evidence` serves rung-2 numbers to **any granted reader with no role check**
- **LIV-a19** (§12-3) — `broadcast-and-teacher-surfaces.md` §3.3/§7.1 defects are fixed at HEAD — the dossier is stale and owes a correction (the chat-bridge item remains unfixed)
- **LIV-a20** (§12-4) — `docs/live-sessions.md` wrongly says player and spectator get the same projection
- **LIV-a21** (§12-7) — `rfc/README.md` rows 38 and 40 are stale on casting's unblocking and `social-play`'s return
- **LIV-a22** (§12-8) — `rfc/casting.md` does not carry its own Discharge D3, so readers re-derive the refusal
- **LIV-a23** (§12-5) 🏆 — The two delays are different objects; the interface must not let a user read one as the other
- **LIV-a24** (§15-1) — **No streamer, coach, viewer or opponent has been asked anything.** The cheapest fix is one conversation with one chess streamer
- **LIV-a25** (§0) — The overlay has never been captured in OBS; no two-account session; no relayed vote; no redeemed link

### Settings, appearance and identity — `ux-settings-and-identity.md` (27)

- **SET-a1** (§2.3a) — App-theme preview card: a miniature of the real chrome showing six tokens as they appear
- **SET-a2** (§2.3b) — Board preview: a mid-game FEN with last-move, dest dot, check radial and all four `MARK_BRUSHES`
- **SET-a3** (§2.3c) — Piece preview: six roles in both colours over one light and one dark selected square
- **SET-a4** (§2.4-2) — `Chessboard` reads board/piece attributes from the global controller — it needs two optional props to preview anything
- **SET-a5** (§2.3a2) — Move the inherited-palette sub-AA notice onto the entry card, where `rfc/theming.md` already specifies it
- **SET-a6** (§4.2/§4.4c) — Render **Piece movement** through `HonestControl` when reduce-motion is on — today the select displays a value that is not in effect
- **SET-a7** (§5.2d / §9) — **Settings never calls `permittedAssistance()`**, so Match/Arena renders nine live controls that are all inert. `HonestControl` is used 7× in run screens and **0×** here
- **SET-a8** (§5.2e) — First paint renders `SILENT_ASSISTANCE` then replaces it `onMount` — a visible flash
- **SET-a9** (§5.2c) — A second, divergent copy of the assistance panel ships in-run with different labels
- **SET-a10** (§5.4-4) `[dup]` — Rename the `/settings` h1 (*"This deployment"*) and move capability and surface-availability lists to an *About this deployment* section
- **SET-a11** (§5.4-5) — Give settings a table of contents (Appearance · Playing · Account · About) and a landmark structure
- **SET-a12** (§6C-4) — Replace eight identical *no provider* strings with one statement in About
- **SET-a13** (§6C-2) — Reduced motion is already inferred and must be **disclosed**, not silent
- **SET-a14** (§6C-3) — The word *"context"* and the matrix must never face a person; the workflow context is already derived
- **SET-a15** (§8.4-1) `[dup]` — **One control layer authored once, token-driven** — select, checkbox, radio, input, button. The single highest-leverage identity change in the app, and it costs one file
- **SET-a16** (§8.4-2) `[dup]` — Add `select` to the global `font: inherit` reset — one word
- **SET-a17** (§8.4-3) `[dup]` — Fix the checkbox-above-caption stacking with the `:has()` rule already correct in the sibling file
- **SET-a18** (§8.3a/§8.4-4) — Four `color: white` on `background: var(--accent)` where `--on-accent` is near-black in dark themes
- **SET-a19** (§8.3b) — Three hard-white mixes, **including the global `:focus-visible` ring and `::selection`**
- **SET-a20** (§8.3c) — `background: white` on every repertoire-form input, select and textarea
- **SET-a21** (§8.3d) — Eight `Canvas`/`CanvasText` uses plus four hexes follow the OS, not the theme
- **SET-a22** (§8.3f / §8.4-6) — Close the theming sweep's three holes — named colours, `.css` files excluded, the by-name exemption
- **SET-a23** (§8.3g) — `theme.test.ts:182` pins `#c0ae91`, a hand-computed constant absent from `brown.css` and recomputed by no test
- **SET-a24** (§8.2a) — There is no global stylesheet: 20+ component-scoped style blocks plus one `:global` section
- **SET-a25** (§4.5) — `theme.test.ts:97-99` asserts the **wrong** behaviour, so repairing the fallback means editing a green test
- **SET-a26** (§7.3) — The product ships a preview for deleting your account and none for changing its colours
- **SET-a27** (§Res R1) — A 20-minute browser pass over lichess's dasher and chess.com's *Boards & Pieces* — the highest-value follow-up, never run

### Teacher and classroom — `ux-teacher-and-classroom.md` (33)

- **TCH-a1** (§Verdict F1) 🏆 — The teacher's submission list renders a date and an access window and **names no learner, no pack and no assignment**
- **TCH-a2** (§3.3a) 🏆 — Build the roster × assignment grid — four act-cells, no marks, no scores. *"Who has not submitted"* has no representation at all
- **TCH-a3** (§Verdict F2) — The learner's `/learn` consent card **names no teacher holding access**, which `teacher-surface` §2.4 requires
- **TCH-a4** (§Verdict F3 / §5.3-1) 🏆 — The simul wall drops `lastMoveAt` — it is in the payload and unrendered, and it is the one honest *who is stuck* signal
- **TCH-a5** (§Verdict F4) — **`resolveProposal` has a route and a client method and no button anywhere.** A learner can propose a move and a coach cannot accept it — the coached session's central gesture
- **TCH-a6** (§5.3 rule) 🏆 — Write the law-8 fence into the row: **the wall may order by elapsed time and never by evaluation**
- **TCH-a7** (§5.3-2) — Mark `sideToMove` against `board.players` so a coach can see whose turn it is
- **TCH-a8** (§5.3-3) — Surface `board.pausedAt` on the wall
- **TCH-a9** (§5.3) — Put the run's `objectiveState` on each wall card as an authored, not computed, signal
- **TCH-a10** (§5.3) 🏆 — The live studio never names the owning classroom — `live_sessions.classroom_id` ships; one server-side join
- **TCH-a11** (§5.3) — The studio is generic across stream/academy/match and does not know it is a lesson; it never says we ship host-side rewind/branch/teach that nobody else has
- **TCH-a12** (§3.3b) — Assignment lists and learner cards render `packId` instead of `pack.title`, in two places, with the packs already loaded
- **TCH-a13** (§3.3c) 🏆 — **Overdue does not exist** — zero grep hits across web, runtime and server, against `teacher-surface` §3.3 which specifies it
- **TCH-a14** (§3.3d) — The coach-side assignment list drops the teacher's note entirely
- **TCH-a15** (§4.3a) — Name the teachers who hold access on the `/learn` card; `grantedLearnerIds` is resolved server-side
- **TCH-a16** (§4.3a2) — Revoke copy must not imply revocation is an undo — it guarantees future reads stop, never that what was read is forgotten
- **TCH-a17** (§4.3b) — A submission confirmation stating who reads it and until when, and **that a granted teacher sees which assistance rungs the learner opened**
- **TCH-a18** (§4.3b3) — Submissions render as N bare, unbounded, undated, unordered buttons
- **TCH-a19** (§4.3c) — Offer submission at run end (`outcome.reached`), not only from the inbox
- **TCH-a20** (§7.2-1) — The rating cell prints an interval with no value when `pointEstimate` is absent
- **TCH-a21** (§7.2-2) 🏆 — The standing table's 48rem min-width scrolls sideways on a phone and a member must hunt for their own row
- **TCH-a22** (§7.2-3) — *"Join this standing"* precedes any statement of what a standing is
- **TCH-a23** (§7.3b) 🏆 — Give `abandoned` its own third toggle — a **conduct signal** currently rides the control labelled *"Show my record"*
- **TCH-a24** (§7.3c) — The mark pill shows the band as its glyph with the verb only in a `title` — invisible on touch
- **TCH-a25** (§7.3d) 🏆 — Say that the coach is not in the table and cannot publish
- **TCH-a26** (§6.2-1) — The review rail closes irreversibly if the learner opens the run live — unwarned and unexplained
- **TCH-a27** (§6.2-2) 🏆 — A hand-minted spectator grant confers read but not the review rail, and the asymmetry is invisible
- **TCH-a28** (§5.3 ladder) — Write the pedagogical rule: the cheapest coach intervention is the most expensive for the learner. Put reclaim behind a confirmation naming its cost; keep marks and reveal at hand
- **TCH-a29** (§2.3) — The classroom section must explain itself in one sentence before offering a Create control; the invitation must name the inviter, what it authorises and what it does not (`invitedBy`/`invitedAt` are on the type and unrendered)
- **TCH-a30** (§8) — The academy's two default layers disagree — `presets` says `guided`, `PROFILE_DEFAULTS.academy` ships SILENT. A guided session that says nothing
- **TCH-a31** (§5.4) — The desktop grants list satisfies watcher-disclosure; the compact-viewport half does not, and the RFC routes the phone answer to a `/learn` card that names nobody
- **TCH-a32** (§2.2/§13) — **The classroom competitor record is empty** — Chess.com Classroom, ChessKid Classroom, Chessity, Chess.Run and ChessPlay.io are name-drops; Lichess Classes returns zero hits across `design/research/`. The strongest candidate for the first hands-on pass in the programme
- **TCH-a33** (§13) — Nothing was exercised in a browser: no two-account classroom, assignment, standing or academy session

### Import, account and data — `ux-import-and-account.md` (30)

- **IMP-a1** (§2.4b) — Multi-game PGN: parse all, render a picker, import the chosen game. **The data is already in hand at `pgn-import.ts:26` when the refusal throws**
- **IMP-a2** (§2.4b2) — Variation-bearing PGN: import the mainline and state the omission on the run. `original_pgn` retains the bytes verbatim
- **IMP-a3** (§2.3-5) — **The product routes chess.com users into its own narrowest refusal** — self-inflicted by the copy at `App.svelte:844`
- **IMP-a4** (§2.4c) — A confirmation step before the run exists: players, date, result, plies, side, and what will be dropped
- **IMP-a5** (§2.4c2) — Side is a select set *before* parsing, though the PGN headers usually answer it
- **IMP-a6** (§2.4e / §11-12) 🏆 — **Flip `import-source.ts:73`'s `clocks=false`.** One word, and the only time-sensitive item in the dossier: the data is irreversibly lost for every game imported before it changes
- **IMP-a7** (§2.3-4 / §9-4) — Six independent hard refusals render as **one raw parser string in one `alert`**
- **IMP-a8** (§2.3-1) — Four import forms on four screens with no shared vocabulary and no shared component
- **IMP-a9** (§2.3-2) — Forms 1 and 2 disagree about whether a variation-bearing multi-game PGN is acceptable (`repertoire.ts:81` vs `pgn-import.ts:26-31`)
- **IMP-a10** (§2.3-6/-7 / §11-13) — Import stores another product's move verdicts and **both players' handles verbatim, and exports them**, undisclosed. Disclosure, not stripping — provenance needs the tags
- **IMP-a11** (§2.3-8) — Chess960 imports silently as standard chess when the `Variant` header is absent or misspelled
- **IMP-a12** (§5.4ii) — **The standing *"What Tabiya has recorded"* section**: twelve rows with live counts and each one's export/deletion fate, generated from `AC38ATA_INVENTORY` (which throws at startup on drift, so it cannot go stale like prose) via `planDeletion` in a non-destructive mode
- **IMP-a13** (§5.4ii3) — Reading your own inventory currently requires approaching the destroy control
- **IMP-a14** (§5.3) — **`behavioral_profiles` is the disclosure debt** — six tables named nowhere on the account screen, while [[D604]] measured that behavioural rows re-identify 35 of 36 accounts
- **IMP-a15** (§5.4i) — One data sentence on the registration screen beside the credential sentence
- **IMP-a16** (§5.4iii-a…d) — Four just-in-time notices, each seated where the shipped pattern is already proven: first rated game, first classroom join, first share link, first import
- **IMP-a17** (§5.4 guard) — The disclosure projects storage facts only — no inference, no profile narration. *That is the account-screen form of the law-8 anti-pattern*
- **IMP-a18** (§6-1) — Export never says it cannot be re-imported and that no other product reads it — the doc states it plainly and the `.honest` class exists for it
- **IMP-a19** (§6-2) — PGN export ships per run and is never mentioned or offered from the account screen. *"Download my games as PGN"* is the actual request
- **IMP-a20** (§6-3) — Export re-confirms a password with no recovery, so lockout is permanent data loss
- **IMP-a21** (§7-1) — Split reading the inventory from starting deletion — same query, two entry points
- **IMP-a22** (§7-2) — Per-run deletion ships and its only entry is inside the account-deletion list
- **IMP-a23** (§7-3) — Say what deletion cannot reach **before** it is chosen, not only inside the preview
- **IMP-a24** (§4.3-4 / §9-1) — **The acquisition funnel terminates in a wall**: the public story card's only CTA is `productLink:"/"`, hardcoded to the password gate, and neither surface says what Tabiya is
- **IMP-a25** (§4.3-1) — `GET /packs`, `GET /packs/:id` and `GET /capabilities` are **already unauthenticated**; only a blanket client `{:else if !learner}` hides the catalogue
- **IMP-a26** (§11-17) 🏆 — The `story_read` token **never expires** and nothing says so at the moment of sharing
- **IMP-a27** (§8) — The proposed data-tier rule, mirroring `design/05:41`: *presence is stated, never assumed, at the moment keeping starts*
- **IMP-a28** (§2.3-3) — None of the nine nav destinations is called Import; the importer lives under *"Run history"*
- **IMP-a29** (§11-14) — **No competitor in this corpus is documented as shipping any data-rights surface at all**, because `competitor-matrix.csv` has no column for it. Three privacy-policy fetches would settle it
- **IMP-a30** (§Res 4/5) — No import was performed against a live Lichess URL and the six parser refusals were read from source rather than reproduced by pasting

### Authoring and library — `ux-authoring-and-library.md` (27)

- **AUT-a1** (§5 C1) `[dup]` — **Call `POST /packs/drafts/:id/lint` on the buffer, debounced, without saving.** The endpoint accepts arbitrary unsaved bytes and has never had a client caller
- **AUT-a2** (§5 C4) `[dup]` — Pass principles and sibling packs into `PackStudio` — two constructor arguments; four codes are currently unreachable in Studio and the docs claim otherwise
- **AUT-a3** (§6 D1) `[dup]` — **Ship `GET /principles`.** `rest.ts` contains the string `principle` **zero** times while `principle-registry.ts:63` holds a finished, sorted browse projection
- **AUT-a4** (§5 C2/C3) — Split *incomplete* from *wrong*; present the required-field set as a checklist; collapse the `oneOf` explosion by filtering on the discriminating key **before** display
- **AUT-a5** (§9 G5) — Add the shape editor's missing error path — four handlers have no `try`/`catch` and no error element
- **AUT-a6** (§3 A3) — Derive the version string from the schema `$id`. The studio's only instructional string names format **0.8**; the shipped schema is **0.27**
- **AUT-a7** (§3 A4) 🏆 — Ask the author for a title instead of hardcoding *"Distilled rehearsal"* on every distilled draft
- **AUT-a8** (§8 F1) — The graduation blocker list becomes the studio's primary right-hand column
- **AUT-a9** (§3 A1/A2) `[owner-resolved: D1563]` — `/create` opens on a four-door chooser (position · game · run · existing pack); the position door includes the funded authoring board, and the fourth door produces a ten-required-field scaffold with placeholders rather than an empty string
- **AUT-a10** (§9 G1) — The one-FEN probe becomes a corpus preview — *fires on N of M authored positions*, each opening a board
- **AUT-a11** (§6 D2) — Every registry-backed field becomes a picker showing name and statement, never a text input
- **AUT-a12** (§6 D4) — The studio states its dead entries: 1 orphan principle, 4 orphan shapes, unimplemented enum values
- **AUT-a13** (§7 E1/E4) — The provenance panel, filled as the author works, naming the two clean licence postures — and stating honestly that a CC0 source **cannot** be credited rather than degrading silently
- **AUT-a14** (§7 E3) — Studio runs `make sourcing-check` and shows `ATTRIBUTION_MISSING` / `LICENCE_MIXED` at import
- **AUT-a15** (§7 E-import-strip) — Imported Lichess study annotations are third-party copyright; the import path must strip them
- **AUT-a16** (§7 E5 / E-mixing) — Two named refusals to write down: **do not** build per-claim citation UI or auto-rewrite authored prose; **never** build a per-field or per-paragraph attribution model
- **AUT-a17** (§3.3f (campaign §3)) — Land `CAMPAIGN_PATH_WIDTH` — absent repo-wide, so a fully linear campaign validates silently against criterion 15
- **AUT-a18** (§1.5-13 / §11.3) — `docs/app-shell.md:28-29` describes a `/create` that predates the studio and a `/library` proposed for replacement
- **AUT-a19** (§16 row-5) — Graduation blocker ids are 56-character truncated prose sentences — 205 distinct, 184 firing exactly once
- **AUT-a20** (§16 row-9) — **284 authored knowledge units are reachable only by accidentally playing into them** — 25 shapes and 13 principles, with 21/25 and 12/13 actually reused across packs
- **AUT-a21** (§16 row-10) — An authoring limitation is narrated to learners as chess advice inside `lucena.json`'s watch text
- **AUT-a22** (§16 row-4) — Registry-backed vocabularies became shared; `concepts` became **143 orphan singletons of 168**
- **AUT-a23** (§16 row-6) — The pack schema is the loosest of the three on attribution and carries the most third-party material
- **AUT-a24** (§9 G3) — `success.signature: null` becomes a first-class authoring choice with its required note
- **AUT-a25** (§9 G2) — A structured expression builder over the 18-leaf grammar with the JSON alongside
- **AUT-a26** (§14 / §Res) — **Nobody has ever seen a competitor's authoring editor** — not Lichess studies, not Chessbook's builder, not Chessable's. Two free accounts and an hour fixes it; five further named `[P]`s (soft-fail batching, import paths, prose errors, the 43.5 min/pack figure, *"no wave since pack A has played a run"*) each have a stated cheap settlement
- **AUT-a27** (§14 not-checked-2) — **No pack has ever been authored end-to-end through `/create`** — the dossier's own strongest missing evidence, and it costs one session

### Accessibility and small screens — `ux-accessibility-and-mobile.md` (34)

- **A11-a1** (§4 d1) `[dup]` — Keyboard cannot reach square sight — call `onSelect` from the `activate` transition (**not** from `onActiveSquareChange`; sight is on-request, not on-cursor)
- **A11-a2** (§4 d2) `[dup]` — `KeyboardHelp` clips at the viewport floor — copy `ShellKeyboardHelp`'s `max-height` rule, one line
- **A11-a3** (§4 d3) `[dup]` — **The skip link skips *to* the navigation.** Point it at the content instead
- **A11-a4** (§4 d4) `[dup]` — `<title>Tabiya</title>` is static across twelve routes; write `document.title` in the router subscription (WCAG 2.4.2)
- **A11-a5** (§4 d5) `[dup]` — Route changes move no focus and announce nothing
- **A11-a6** (§4 d6) `[dup]` — The busy live region is `display:none` below 60rem, so *"Thinking…"* is never announced on a phone
- **A11-a7** (§4 d7) `[dup]` — `ShapePanel` is an overlay with no dialog role, no focus move, no restore and no Escape
- **A11-a8** (§4 d8) `[dup]` — Two sub-24px touch targets **on the board** — `.appearance-link` (~21px) and `.text-move` input/Submit (~21px), the second being the accessibility fallback control
- **A11-a9** (§4 d10) `[dup]` — Keyboard hints live inside accessible names — *"Fork B"*, *"Replay Space"*, *"Export E"*
- **A11-a10** (§4 d11) `[dup]` — Phone region tabs carry no selected state in the accessibility tree — three attributes
- **A11-a11** (§4 d12) `[dup]` — 48 checkboxes render above their captions; one `:has()` rule
- **A11-a12** (§3.2 s3-c1…c9) `[dup]` — The nine shortcut defects individually: all nine suppressed from the board grid with only an undocumented double-Escape out; no key returns focus to a region; arrow stepping dead **inside** the timeline; Space toggles replay except on any button; Alt+C has a second undocumented guard; the `g` chord is live inside the grid and swallows the next keystroke for 1.2s; the checkpoint sheet swallows Escape silently; the timeline puts a non-interactive section in tab order (40-ply run = 40+ consecutive stops)
- **A11-a13** (§3.2 s0-packnames) — **Every pack card button's accessible name is *"Open position"*** — N indistinguishable entries
- **A11-a14** (§3.2 s0-tabstops) — Reaching the pack list costs ~12 tab stops
- **A11-a15** (§3.2 s2-two-maps) — The two help dialogs disagree and no single place lists the whole keyboard
- **A11-a16** (§3.1) — **Zero focus traps client-wide against ten dialogs; zero `inert` uses.** Should land as one change, not nine
- **A11-a17** (§3.1) — Zero `prefers-reduced-motion`, `prefers-contrast`, `forced-colors` and `prefers-color-scheme` CSS blocks anywhere
- **A11-a18** (§3.1) — Three separate `visually-hidden` implementations, one using deprecated `clip: rect()`
- **A11-a19** (§3.1 / §3.9) — **Zero axe-core, pa11y or Lighthouse in any `package.json` or source file**
- **A11-a20** (§3.4 B) — Criterion 7's population omits `square.oc.move-dest`; the capture ring fails at 12.5 and 18.6 against a floor of 20
- **A11-a21** (§3.4 E) — **Colour vision has never been considered anywhere** — the check indicator vanishes for tritanopes on brown dark squares
- **A11-a22** (§3.4 F) — Five hard-coded whites in themed colour, one of them the global `:focus-visible` outline
- **A11-a23** (§3.4 G) — `forced-colors` is unhandled and every dest and check indicator is a `radial-gradient` background image — which forced-colors mode removes
- **A11-a24** (§3.5) — `prefers-reduced-motion` reaches only Chessground interpolation; no CSS block exists
- **A11-a25** (§3.6) — `.identity-control` Sign out is ~24px, borderline; **the 24px guard regexes two CSS rules in one file and cannot see the two that fail**
- **A11-a26** (§3.7 fallout-3) 🏆 — The whole iPhone 12–15 Pro class is refused in Safari and **works installed as a PWA**
- **A11-a27** (§3.7 fallout-5) — Rotating an iPad to landscape shrinks the board 96px because the desktop branch subtracts the rail
- **A11-a28** (§3.7 phone-sheet) — The phone sheet has no dialog role, no `aria-modal`, no focus move, trap or Escape
- **A11-a29** (§3.8 surf-*) 🏆 — **Twenty-three per-surface findings**, one row each — shell, home, pack list, Just Play starter, drill, board, timeline, branch rail, phone tabs, compare, checkpoint sheet, terminal sheet, shape panel, inspector, story, rating, live list, live overlay, create, library, appearance, assistance, cohort standing, group panel
- **A11-a30** (§3.9) — Test-harness defects: no `projects` array (one implicit Chromium at 1440×1000); `devices[]` never imported, so 8 of 9 phone-width assertions run with desktop input semantics; 4.7% of 467 selector uses assert a11y semantics; 1 of 11 live regions asserted; **Escape is never pressed in the suite**; `forcedColors`/`colorScheme` emulation is zero; `keyboard.ts` owns the shortcut system and has no unit test
- **A11-a31** (§2.2) — Three things to steal from lichess's `nvui`: board layout as a **user preference** with named modes; squares as 64 focusable buttons carrying file/rank attributes; a published board-command query vocabulary
- **A11-a32** (§2.3 gap-shared) — The non-visual layer is not shared: Compare, Story and the Live overlay have no semantic layer at all
- **A11-a33** (§2.1 / §2.4) — **The repo has recorded zero accessibility observations about any competitor** and `competitor-matrix.csv` has no a11y column; chess.com's posture is unknown and is reported as unknown
- **A11-a34** (§7 res-P1…P5) — Five named `[P]`s each with a stated cheap settlement: iOS Safari `innerHeight` (the whole iPhone-12 finding rests on it), Pixel 7 chrome height, the ~42% sheet occlusion (arithmetic, not measured), touch-target heights (computed, not measured), iPhone SE installed base (`[M]`)

### The opponent — `ux-opponents.md` (19)

- **OPP-a1** (§0.2 / §1 rec-2) — **Always send a band from Just Play.** The starter sends no `targetElo`, `appliedTargetElo` falls to `profile.default`, and the default is Maia's UCI spin value `1500` — a rung nobody chose, nobody measured, and no learner is ever told about
- **OPP-a2** (§0.1c / §3 rec-3) — `Requested resistance: human_common` renders a raw internal identifier to learners (`outcome-presentation.ts:112`)
- **OPP-a3** (§3 rec-4) — Render the resistance sentences in Just Play — they are gated on `pack !== undefined`, which is backwards: the pack-less game is the one with no author to explain it
- **OPP-a4** (§3 rec-1) — **Ship the opponent identity bar**: name, art, rung, one word of family. Greenfield — `avatar` occurs **zero** times in `apps/web/src`
- **OPP-a5** (§3 rec-5) — Announce a mid-run opponent change in the bar when `flipRun` changes resistance
- **OPP-a6** (§4 rec-1) — Put the *"not FIDE, Lichess, or Chess.com"* disclaimer on **every** opponent surface, verbatim
- **OPP-a7** (§4 rec-2) — Never render `targetElo` as a strength; reword the provenance sentence into band vocabulary (O8.4)
- **OPP-a8** (§4 rec-4) — Tell the learner once, in the endgame, that the chosen rung has almost stopped applying — below ten pieces the dial buys ~0.07 Elo per band point instead of 0.40
- **OPP-a9** (§4 fact-1…4) — Four measured, learner-reachable facts nothing surfaces: ladder width 479.8 Elo [454.9, 504.7]; adjacent gaps 141.6 / 93.4 / 112.5, all above the ~60-Elo floor; a 100-point step buys 22.1–26.9 Elo; ≤10 pieces costs −72.4 Elo total
- **OPP-a10** (§1 rec-5) 🏆 — Keep `strong_engine`, place it **outside** the ladder, and stop calling it a rung
- **OPP-a11** (§5.2) — **Build observed traits.** `observedTrait` appears nowhere in `apps/` or `packages/`; every input exists (persisted selections, `candidateFeatureVector`); *"Wren has taken the b2 pawn in 2 of your 4 games"* is law-8-safe by construction
- **OPP-a12** (§5.1c) 🏆 — The rule to write down: a name is free under law 8 and is **not perceptually neutral** — `docs/bot-policy.md` says a name cannot change a move while our own blind-review protocol forbids showing reviewers a bot name. Both are true, and the combination is the design rule
- **OPP-a13** (§5.5a/b) — Two refused shapes, written down: temperature/top-p is a **strength** dial (+468.3 Elo), not a personality dial; *"thinks a while on hard moves"* fails `assertLayer` on `effect: "delay"`
- **OPP-a14** (§7 rec-4) — State the no-adaptation promise on the card once — a refusal that reads as a feature
- **OPP-a15** (§7 rec-5) — Do not build rivalry mechanics on an uncalibrated ladder, and say which it is
- **OPP-a16** (§0.2c) — Adopt `maia.ts:8-10`'s clamp comment as the pattern for every card sentence: a deployment bound stated as a bound, never as a claim
- **OPP-a17** (§Residuals 1) — **Four named opponent teardowns owed, in priority order**: chess.com's bot-selection gallery and per-bot card content; lichess's level picker and the `maia1/5/9` account presentation; Chessiverse's bot detail page; ChessMind's six-band picker — *"the closest stack neighbor in the entire matrix"*. Two protocols already exist for it
- **OPP-a18** (§Residuals 1) — **Add a fourth teardown question**: *who does this product say you are playing, and what does it claim about them?* A case-insensitive search of `teardown-noctie-desk.md` for *bot*, *opponent* and *persona* returns **zero** hits, and most of the sweep has the same shape. This is the protocol gap that produced *"a mention in six dossiers and a pass in none"*
- **OPP-a19** (§Residuals 3) — The 42-branch blind packet is prepared, integrity-checked and **unused**. It cannot establish a population claim but it can reject an incoherent profile — the cheapest available check on whether the card's sentences describe play a person experiences

### Campaign and progression — `ux-campaign.md` (29)

- **CMP-a1** (§0.2) — The campaign mechanism is fully built with **zero consumers**: `content/campaigns/` does not exist and zero campaigns are authored
- **CMP-a2** (§2 Rec 1) — State the run's length before it starts — in plies now, in minutes only after one owner run with a clock
- **CMP-a3** (§2.4-3) — **One owner run with a clock** — the cheapest `[M]`→`[V]` upgrade in the dossier, converting §2.3, §7.5 and §9.3a at once
- **CMP-a4** (§3.3c) — Say the act ladder in one sentence: escalation in **decidability**, not in numbers
- **CMP-a5** (§3.3c-bis) — **Act II is the shortest act** (11 → 8 → 24 ply). Either the act structure or the middlegame horizons are wrong
- **CMP-a6** (§3.3d) — Act III's `perfect_tablebase` is unbeatable and must be disclosed before entry, in the briefing copy
- **CMP-a7** (§3.3e) — One sentence on *"Declare done"*: it locks the node and the attempts are kept
- **CMP-a8** (§4.3c) 🏆 — Say *"one run at a time — finish it or abandon it"*; the campaign cannot accumulate a backlog
- **CMP-a9** (§4.3d-bis) — Survival nodes over-state the envelope; present their contribution as *"up to"* — decide before the first survival node ships
- **CMP-a10** (§4.3e) — Tell a learner who leaves an encounter what happened to it — one sentence
- **CMP-a11** (§5.1) — **The deck framing is three-quarters false**: no synergy, no power, no run-to-run difference. Do not ship synergy discovery or *"pays off in combination"* copy
- **CMP-a12** (§5.3b) — The unlock ceremony must state whether the module is active under the current preset, and what switching costs
- **CMP-a13** (§5.3c-1…4) — Four suppressor-boss rules: disclosed before entry by name and effect; suppression attributed to the boss, **never** to the learner; restoration visible on the seal; and the suppression sentence must never share a template with the honesty-withholding sentence
- **CMP-a14** (§5.3d/§5.3e) — The surface is an unlock **schedule**, not a deck-builder — do not draw it as one; and the act-end screen looks identical whether the act was swept or failed at every node
- **CMP-a15** (§6 R1–R6) 🏆 — The rewind economy's presentation: never a bare number — show the rule with the number as its receipt (*"win or lose"*); earn loud, spend quiet; the counter is never on screen at the moment of the mistake; the refusal names the **income**, not the shortage; the learner-facing noun is *earned rewinds*; **and the drill-side clause — *"rewinding here costs nothing"* — can land today and should land first**
- **CMP-a16** (§6 never-1…5) 🏆 — Five prohibitions written down: no timer or regeneration clock; no *get more* affordance; no second currency; no rewind count in any verdict, seal payload, export or module sentence; no comparison of one learner's frugality with another's
- **CMP-a17** (§7.7-1…3) — Three properties that hold whatever [[D1300]] is ruled: losing never locks content; the ending names the node that ended it and offers the preserved run; the catalogue diff renders identically on a lost run and a won one
- **CMP-a18** (§8.2) — Balatro-style escalating requirement is **refused by measurement** — do not build a chess-legal imitation
- **CMP-a19** (§8.3a-bis) — **35 of 47 packs hard-code band 1800**, so a band ladder is an authoring change; and R10 means band shifts above ≈2500 must be visibly clamped
- **CMP-a20** (§8.3b-bis) — The document should state which learner it was written for — a start-screen sentence
- **CMP-a21** (§8.3c) — A strong player's axis is suppression breadth and slot scarcity, **not** opponent strength — weakened Stockfish is refused and above 2400 only `strong_engine` exists
- **CMP-a22** (§8.3d) — The replay ceiling is authored-content decay: **6.2 runs before repetition at 56 packs.** No difficulty tuning moves it — only content does
- **CMP-a23** (§9.2) — The return loop and the campaign do not touch, and there is zero outbound notification capability
- **CMP-a24** (§9.3b) — Do not build a campaign streak — the map is already the progress display
- **CMP-a25** (§9.3c) 🏆 — **A campaign surface will attract the refused progression denomination (d), *another person's expectation*.** [[D1151]] ruled (c), the catalogue, is the answer — and [[D1416]] *defers* leagues and tournaments rather than refusing them, so the pressure is scheduled, not closed
- **CMP-a26** (§1.6a/b) — [[D1437]] correction: the campaign context is byte-identical to `pack` except for its default preset and storage key. The real harm is that a campaign starts **Quiet** rather than Guide-me and writes a preference key no run reads
- **CMP-a27** (§1.2) — Every pack a campaign could reference today is an ungraduated draft: 55 of 56 carry blocking `graduationBlockers` and `content/packs/` is empty
- **CMP-a28** (§1.3) — The shipped exhaustion string is an internal error id plus a bare shortage, with no income statement
- **CMP-a29** (§10 res-9/10) — Two bounded evidence limits recorded: some prior art came via search-index snapshots (Fandom HTTP 402), and two claims are unverifiable anywhere (Chessable's *"up to 95%"*, the *Chess Life* Solitaire table) — used for nothing
