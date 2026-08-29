# UX implementation index — the complete enumeration

**Opened 2026-08-24 by claude, commissioned by [[D1522]].** HEAD at derivation: `0d347288`.

**Why this file exists, in the owner's words:** *"is that ledgered for codex SOMEWHERE? still feels
like we're not giving them the proper queue of work every single time and then keep losing track of
features, surfaces, etc... like what about the bot personas? why do i have to explicitly keep
mentioning every single little thing?"*

He is right, and the mechanism is named in [[D1522]]: **the coordinator curated instead of
enumerating.** `planning/codex-wave-3.md` held fifteen hand-picked items against twelve UX dossiers
carrying **1,118 raw recommendations, defects, repairs and open questions**. Everything unselected
left the visible surface, and the owner became the index.

**This file is the enumeration.** Every actionable item in all twelve dossiers, classified, with its
blocker named and its queue status checked. It is not a selection.

---

## The counts

| | |
|---|---|
| **Raw extractions across twelve dossiers** | **1,118** |
| **Distinct items after collapsing restatements** | **569** |
| **(a) Buildable now** — no ruling, no missing document | **304** |
| **(b) Blocked on an owner ruling** | **98** |
| **(c) Blocked on an RFC** | **97** |
| **(d) Already done at HEAD** | **46** |
| **(e) Superseded, stale or wrong** | **24** |
| | |
| **Already queued** (named as work in a queue document) | **54** |
| **Ledgered but unqueued** (a `design/BACKLOG.md` row names it; no queue does) | **217** |
| **⚠ IN NO QUEUE AT ALL** | **228** |
| **Tournament-readiness flags** ([[D1520]]) | **84** |

The queue counts are taken over the **499 live items** — groups (a), (b) and (c). Groups (d) and (e)
are done or retired, so a queue status for them is moot.

**228 — 46% of everything still live — is the number the owner is angry about.** It is not a
backlog of nice-to-haves. It contains the opponent identity bar, observed traits, the whole
first-run flow, the phase catalogue the design tier records as *shipped*, the entire
data-disclosure surface, the audience preview, the streamer mode, the coach's simul-wall signals,
twenty-three unspecified responsive surfaces, and the four opponent teardowns that would end the
*"nothing in the corpus has been driven hands-on"* limit.

**A second number matters almost as much: 217 items are ledgered and unqueued.** [[D1428]] found
that pattern on the owner's six UX complaints — *the recording works and the routing does not* — and
[[D1523]] found the instrument cannot tell the two apart. For routing purposes `ledger` is much
closer to `none` than to `wave3`: **445 of 499 live items, 89%, are in no queue a worker reads.**

---

## How to read this

Columns: **id · source dossier and section · what it is · queued? · blocker or note · 🏆**

**queued?** is checked against `planning/codex-wave-3.md`, `planning/codex-queue.md`,
`planning/ux-work-lane.md`, `planning/rfc-drafting-queue.md` and `design/BACKLOG.md`:

- `wave3` — named as work in `planning/codex-wave-3.md` §§1–5
- `queue` — named as work in `planning/codex-queue.md`
- `lane` — a numbered pass item in `planning/ux-work-lane.md`
- `rfcq` — a lane in `planning/rfc-drafting-queue.md`
- `ledger` — **a `design/BACKLOG.md` row names it and no queue does.** Recorded, not routed
- `none` — **in neither.** Nobody would ever get to it

**🏆** marks an item where a 1.0 decision would make a later tournament, league, round/pairing or
declared result expensive or impossible ([[D1520]]: *"deferred the features, not the readiness"*).
The full register with its schema evidence is at the end of this file.

### Method, and its one honest limit

Raw extraction was exhaustive per dossier — every numbered recommendation, named defect, proposed
repair, proposed ledger row, owner decision, DESIGN-GAP, cost-table row and residual naming a
missing measurement. **Nothing was dropped for importance**; that filtering is the defect this file
exists to fix. The only reduction applied is **collapsing restatements**: where a dossier states the
same item in its verdict, its recommendation section, its cost table and its proposed-ledger-rows
section, that is one item, not four. Restatements are **not** collapsed across dossiers: where two
dossiers independently find the same defect, both rows survive with a cross-reference, because two
dossiers agreeing is evidence.

**A few rows are declared bundles** and say so in the row — A11-a12 (the nine individual shortcut
defects), A11-a29 (twenty-three per-surface findings), A11-a30 (eight test-harness defects),
CMP-a15 and CMP-a16 (the economy's presentation rules and its five prohibitions), ATR-a13 and
ATR-a26 (the terminal-sheet and return prohibitions), A11-b7 (five refused device classes). They are
counted once each. The true item count is therefore **higher** than 569, never lower.

**The limit, stated first because [[D1523]] predicts it.** `work-index` measures *citation*, not
*assignment*, and three previous enumerations went green while the work stayed undone. **This is a
fourth snapshot.** It carries a per-item classification and a per-item queue check, which the
previous three did not, but it is still a document rather than state on an item. If nothing consumes
it, it decays exactly as the other three did. The instrument [[D1523]] asks for — persistent
per-item state with an owner — is what makes this the last one.

---

## (a) BUILDABLE NOW — 312 items

Nothing here waits on an owner ruling, an RFC acceptance, or a document anybody still owes.
**189 of them are in no queue at all.**

### Arrival and getting into a session — `ux-arrival-and-start.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| ARR-a1 | §2.3 A1 | The scripted first run: the loop itself on rails over a real `startPack` run — commit, consequence, rewind, the other move, both attempts on screen | none | fence lifted today by [[D1513]]; ~6 copy strings and a step cursor, no new runtime | |
| ARR-a2 | §2.3 A2 | Say what this is above the fold: *"Do not just learn the move. Rehearse the game it creates."* + the loop in plain English | none | 2 strings on Home | |
| ARR-a3 | §2.3 A3 | Name the silence at the first board, not in settings — *"Tabiya doesn't comment while you're deciding."* | ledger | [[D494]]; 1 first-run-scoped string | |
| ARR-a4 | §3.3 B1 | Home **Continue** region degrades to *"Start here"* with a designated first-run pack, not to a button | none | reuses `recentRun` | |
| ARR-a5 | §3.3 B1 | Home **Due and open** region: counts with verbs; `dueProgress`/`assignedPacks` are already fetched on the home route | none | | |
| ARR-a6 | §3.3 B1 | Home **Pick up a thread**: three specific suggestions returning, three phase entries on day one | none | lands on ARR-a10 | |
| ARR-a7 | §3.3 B2 | Delete the resume card's *"No previous run yet… Go to Play"* two-click abstraction | none | | |
| ARR-a8 | §3.3 B3 | A suggestion rail ranked on facts about the learner's own runs (permitted by `03` §Learn and return; nowhere near the rejected v1 identity) | none | needs a law-8-honest ranking rule | |
| ARR-a9 | §4.8 | **Measure our own cold start and catalogue-to-board time.** The protocol is written (`teardown-protocols.md:20-25`), the budget stated, the competitor number exists, and nothing has ever been run against Tabiya | none | cheapest missing measurement in the dossier | |
| ARR-a10 | §5.3 C1 | Phase-first filtered, searchable catalogue — three phase entries, band filter, free-text search over title + `concepts` + `objective.summary`, a sort | ledger | [[D1474]]; needs `PackSummary` widened (it exposes `difficulty: unknown` and no concepts/summary/window) | |
| ARR-a11 | §5.3 C2 | The pack card leads with the authored objective sentence. `screen-model.ts:85` holds `objectiveSummary` and **has zero callers** | ledger | [[D1474]] | |
| ARR-a12 | §5.3 C3 | Translate the mode enum into its verb — the card's first word is literally `line`, `plan`, `outcome`, `trajectory` | none | 4 strings; meanings already in `design/01` | |
| ARR-a13 | §5.3 C4 | Difficulty relative to the learner (*"sits at your band"*), with honest abstention where no band is measured | none | arithmetic over two declared numbers | |
| ARR-a14 | §5.3 C5 | Move the provenance stamp off the card's leading metadata row — *"unreviewed draft · community"* fires on 100% of 56 cards | none | the catalogue-level wording needs O-C5; the placement does not | |
| ARR-a15 | §6.3 D1 | **Promote `/rating`'s four-rung named picker into `/play` and delete the two-word `<select>`.** The control, the honest footer and the `targetElo` plumbing all exist | ledger | [[D1473]] | |
| ARR-a16 | §6.3 D1 | Rename the **"Record"** nav item — the product's only competent opponent picker is filed under a word meaning *history* | ledger | [[D1473]]; overlaps two IA lanes | |
| ARR-a17 | §6.3 D3 | Carry the no-Elo labelling verbatim: rung words + *"not FIDE, Lichess, or Chess.com"* | none | copy decision already made; permanent, not temporary | |
| ARR-a18 | §7.3 E2 | Name the default preset instead of letting it be encountered as emptiness — the default does not move, the learner chooses it | none | resolves [[D484]]'s standing sentence at the arrival surface | |
| ARR-a19 | §7.3 E3 | The 72-control grid becomes Advanced, reachable from the preset menu. Nothing is removed | lane | ux-work-lane Pass E; already ruled by `design/05` §The config on O4 | |
| ARR-a20 | §7.3 E4 | A refused preset is absent and explained, never greyed out (`match` admits exactly one preset) | none | check `SuppressionRecord` is populated at HEAD first | |
| ARR-a21 | §7.3 E5 | Order the presets by what they cost the learner, not by internal id | none | trivial | |
| ARR-a22 | §8.3 F1 | The objective region states the promise, not the absence — *"Nothing is authored about this position — Tabiya reads it as you play"* | none | 1 string; pivotal detection ships | |
| ARR-a23 | §8.3 F2 | The consequence contract, said once, at the first board | none | 1 string | |
| ARR-a24 | §8.3 F4 | **Appearance preview.** Five `<select>`s of text labels, zero rendered previews, one option labelled *"Cburnett"*. `<Chessboard>` already renders a FEN at arbitrary size in five places | ledger | [[D1451]], [[D1463]]; `rfc/theming.md` has 0 occurrences of preview/thumbnail/swatch | |
| ARR-a25 | §13 | The coverage-matrix row this dossier owes `design/research/README.md` | none | written, not landed (shared worktree) | |

### The in-run experience — `ux-in-run.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| INR-a1 | §1.2 | Bind `label = declaration.intent` so the rail is a list of questions, not a producer census | wave3 #9 | [[D1454]] | |
| INR-a2 | §1.3 | The help door states its disclosure cost in the same breath as the offer, **before** the click | none | the shipped disclosure copy is the template | |
| INR-a3 | §1.4 | The preset pill and a **mandatory, always-visible** disclosure footer rendering `presetDeclaration(preset).promise` | wave3 #8 | [[D1435]]/[[D1457]]; all eight reads ship | |
| INR-a4 | §2.3 | The honest empty carries the loop: *"Nothing recognizes this structure — play it and see, or rewind."* | ledger | [[D1456]], called the strongest product idea in the wave, and in no queue | |
| INR-a5 | §3.2 | Keyboard square-sight parity — call `onSelect` from the `activate` transition, not from `onActiveSquareChange` | wave3 #5 | [[D1447]] | |
| INR-a6 | §3.5 | Relayed (host-drawn) marks carry **visible attribution at all times**, not on hover | none | a teaching arrow that looks like a product arrow launders opinion as arithmetic | |
| INR-a7 | §5.3 | Every declared honest-empty sentence gains its next legitimate action (the two verbs the post-commit guard already ships) | none | highest-value small item in that dossier | |
| INR-a8 | §6.6 | Animation preference with a **None** option and a Normal default | ledger | [[D840]]; without it a commit and a rewind are visually indistinguishable | |
| INR-a9 | §8.1 | **Narrow `guided_hint`'s stage-3 admission now**: remove `live.stockfish.pv@1` from its accepts list and drop the ceiling to a single `move`. Today three documents jointly permit a guidance module to print an engine PV against that producer's own declared refusal | ledger | [[D1455]]; the edit only ever *narrows*, so it does not wait for `hint-distance`'s redraft | |
| INR-a10 | §2.3 | The hint-reach harness must report **per rung**, not per family | ledger | [[D1457]]; a ladder whose top rungs are usually empty is a different product | |
| INR-a11 | §4.3 | Stated caps rather than silent truncation (*"top 5 of 23 recorded moves"*) | none | a stated cap is trustworthy; a silent one sends the learner to the raw view | |

### The core loop — `ux-core-loop.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| CLP-a1 | §1.2 d2 / §12 rec 1 | Render `branch.intent` on the compare surface. It is captured at the fork and thrown away at the payoff screen | ledger | [[D1464]] | |
| CLP-a2 | §1.2 d1 / §7.2 L2 | Render `ComparisonRow.groups` — the per-ply equivalence partition is computed and **no renderer reads it** | ledger | [[D1464]] | |
| CLP-a3 | §7.2 | Render `rows[].nodes[].actor` so the grid can distinguish a learner's ply from the opponent's | ledger | [[D1464]] | |
| CLP-a5 | §1.2 d7 | Stop rendering the same eval data three times, unaligned, with no shared ply axis | none | | |
| CLP-a6 | §1.2 d9 / §12 rec 9 | **Stop calling the compare surface an "Evidence inspector"** — it says so four times on the screen that carries the originality claim | none | self-description of the rejected shape | |
| CLP-a7 | §12 rec 4 (Layer 2) | Render `transposeKey` so re-convergence is visible | none | | |
| CLP-a8 | §7.2 | Render `materialBalance(fen)` in compare — it ships and `GroupPanel` uses it; `CompareView` has the FENs and does not | none | | |
| CLP-a9 | §4 R1 | Move the rewind **offer** to the consequence of finishing rather than an always-present control | ledger | [[D945]] context; see the objection recorded in §What a dossier got wrong | |
| CLP-a10 | §4 R2 | The rewind offer names what survives: *"Your attempt is kept. Going back makes a second one."* | none | copy must respect fork timing or it lies | |
| CLP-a11 | §4 R4 | Say once at the campaign boundary that this is where rewinds are counted | none | one sentence at an existing boundary | |
| CLP-a12 | §5 B1 | Fork modal: intent first, machine label optional. `fork()` already makes both optional | none | | |
| CLP-a13 | §5 B2 | Name a branch from the move plus the intent, not `alt-3` | none | | |
| CLP-a14 | §5 B3 | Branches appear in the move list as well as the rail | none | coupled to the timeline clipping fix | |
| CLP-a15 | §6 D1 | **Replay at a different band as a first-class exit action from compare** — the thesis's own last clause, with no gesture in the product | none | wires to an existing run-creation path | |
| CLP-a16 | §6 D5 | The learner moves the ladder; any band suggestion is accepted, never applied silently; applied band always visible | none | Dr. Wolf's churn complaint is the field evidence | |
| CLP-a17 | §2 C2 | The first commit of a run states the rule once: *"You will play this out."* | none | | |
| CLP-a18 | §3 P1 | The run states the consequence's horizon before it starts and holds it visible | none | pack boundary ships; `PivotalMarker` kinds present | |
| CLP-a19 | §3 P4 | Adopt Conversion Trainer's entry copy without exposing an evaluation before play | none | cheapest adoption in its teardown | |
| CLP-a20 | §7.4 | Narrate the four genuinely unvisualisable things with their grounds attached — causation, prophylaxis, practical difficulty, unequal-length branches — rather than drawing them | none | | |
| CLP-a21 | §7.5 | Adopt ChessMotive's row-indexed alignment with a per-row same/different marker keyed on aligned ply | none | the marker is `groups` | |
| CLP-a22 | §0.1 | **Merge the two conflicting Chessiverse rows in `competitor-matrix.csv` (`:16` and `:58`)** and settle whether rewound lines persist as branches | ledger | [[D1468]] — law 6 territory: a confirmed competitor with preserved branches is kill-criterion evidence | |
| CLP-a23 | §0.1 | Close verification item #5 (chessfeed.ai's claimed saved-branch exploration and checkpoint rewind), open since 2026-08-10 | none | same law-6 exposure | |
| CLP-a24 | §11 | Seven named hands-on residuals: does Chessigma's Bot Challenge preserve a second attempt; does Chessiverse preserve rewound lines; is *"Bot at your level"* a human model; does Dr. Wolf's undo erase the attempt; does Noctie preserve anything across a takeback; is Chess.com's Retry one ply | ledger | [[D1458]] bounds all of them; none is scheduled | |

### After the run — `ux-after-the-run.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| ATR-a3 | §1.2 | The story rail is at most eight moments (`story.rank.slice(0,8)`) with **no move list** | none | | |
| ATR-a5 | §1.2 | **A false provenance footer ships**: *"rendered from recorded engine evidence"* on rules-marker cards | ledger | [[D687]] | |
| ATR-a6 | §1.2 | Ranked-8 client versus chronological-8 server divergence inside `publicStory` | ledger | [[D688]] | |
| ATR-a10 | §1.4 | 24 of 31 on-ramp packs claim *"opponent near your rating"* over a puzzle-difficulty rating, with no learner rating in that path | none | a shipped surface claiming personalisation it does not have | |
| ATR-a11 | §1.7 | **The compare screen's prominence is inverted**: the grounded narrative is 7th of 8 and collapsed, beneath an expanded engine sparkline — on the screen every *Retry from here* lands on | ledger | [[D1478]] | |
| ATR-a12 | §2.3 | Terminal sheet: order the two doors *Play it again from here* then *Review the whole game* | none | | |
| ATR-a13 | §2.3 | Four terminal-sheet prohibitions, written down: no accuracy figure, no grade counts, no rating movement on an unrated run, no praise class | none | | |
| ATR-a14 | §3.2 | Adopt the two field layout invariants verbatim: nothing grows in the board column; regions scroll, the board does not | none | | |
| ATR-a15 | §3.3 | Tier 1 lives in the move-list row and is **never painted on the board**; most rows stay empty; never invent a tier-0 "ok" chip | none | see the cross-dossier conflict noted at the end | |
| ATR-a16 | §3.4 | Split `eval_pivot` by rung so blunders rank above mistakes | none | | |
| ATR-a17 | §3.4 | **Drop `irreversibility` to last** — a 79.9% false-positive rate on a shipped, unasked marker, reproduced by two harnesses | none | | |
| ATR-a18 | §3.5 | Human rarity may **select** a moment and may never **valence** one; outcome correlation is refused by name as a valence authority | none | *"will be built by accident"* is the dossier's own warning | |
| ATR-a19 | §3.6 | A decided position is never a tier-2 door, whatever its grade | none | free; a selector rule | |
| ATR-a20 | §3.6 | State grade suppression once at region level — silent suppression is a second defect | ledger | [[D1421]] | |
| ATR-a21 | §3.7 | Order is never shown as a rank; a permanent region line says *"these are the moments this game left evidence about… not a ranking"*; *"educational value"* never appears in copy | none | | |
| ATR-a22 | §3.8 | **`App.svelte:369-371` throws on any device other than the one that played the run**, killing the primary CTA | none | | 🏆 |
| ATR-a23 | §5.3 | The first rewind outside a campaign says once that it is free | none | can land today on the drill surface | |
| ATR-a24 | §5.3 | The learner-facing noun is *"earned rewinds"*, never the schema's `charges` | none | | |
| ATR-a25 | §6.3 | Adopt Chessigma's return hook stating a recorded outcome and moment index, never an eval; name the Conversion-Trainer composition (near-level-in-a-loss + save/hold objective + opponent) | none | detector already shipped | |
| ATR-a26 | §6.3 | Six return prohibitions written down: no streak, no day count, no calendar grid, no falling-behind framing, no learner-set intervals, no hidden difficulty threshold | none | | |
| ATR-a27 | §0.3 | **Zero notification machinery exists repo-wide** — `notify`, `email`, `reminder` all return nothing. State the limit in the lane rather than letting a return recommendation imply outreach | ledger | | |
| ATR-a28 | §9 | The falsification instrument: one owner run through both rendered tiers — a wrong tier-2 door means the severity read was right after all | none | | |

### Live, casting and social — `ux-live-and-social.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| LIV-a1 | §1.1a | ✅ **Closed 2026-08-29:** one guided workflow selector names Teach/Coach, Stream rehearsal, native friend match and Position Arena; each sets a valid default while advanced handoff keeps the primitive controls | closed | [[D1470]]/[[D2024]]; exhaustive mapping unit contract plus browser match journeys | 🏆 |
| LIV-a2 | §1.1b | ✅ **Closed 2026-08-29:** run summaries expose snapshot-derived recorded-move count, and native-match cards refuse non-position or already-played runs with a visible pre-submit reason | closed | [[D2024]]; no migration or copied summary authority | |
| LIV-a3 | §1.1c | ✅ **Closed 2026-08-29:** creation has pending and visible failure states; incomplete rotation, match and title inputs are disabled with reasons | closed | [[D1470]]; component contract exercises a rejected rotation learner | |
| LIV-a4 | §1.1d | ✅ **Closed 2026-08-29:** the host names the session before choosing a source run; the submitted title is trimmed and becomes the session heading | closed | component contract proves the title reaches creation | 🏆 |
| LIV-a5 | §1.4a | ✅ **Closed 2026-08-29:** the overlay translates all six objective states into fixed product language; no runtime enum is rendered | closed | [[D2022]]; unit table and desktop/mobile browser matrix | |
| LIV-a6 | §4 C3 | ✅ **Closed 2026-08-29:** the headline uses the authored pack objective, or explicitly says no rehearsal objective is attached; singular/plural branch copy is fixed in the same projection | closed | [[D2022]]; real overlay browser assertion | |
| LIV-a7 | §1.3a | ✅ **Closed 2026-08-29:** the host gets a selectable/copyable OBS browser-source URL plus the transparent-background, source-cookie and in-OBS sign-in instructions | closed | [[D2023]]; host component contract binds the exact run URL | |
| LIV-a8 | §3 B1 | ✅ **Closed 2026-08-29:** **See what your audience sees** mounts the exact chrome-free overlay route inline and labels it as the spectator-safe projection | closed | [[D1469]]/[[D2023]]; real browser crosses the nested projection | |
| LIV-a9 | §3 B3a | ✅ **Closed 2026-08-29:** the audience-output region states that the board is never delayed, sends live-game delay to streaming software and distinguishes poll duration | closed | [[D2023]] | |
| LIV-a10 | §3 B4 | ✅ **Closed 2026-08-29:** Stream copy now leads with commit → consequence → rewind → fork → compare, and the overlay calls branches preserved attempts | closed | [[D2023]]; component copy plus real overlay assertion | |
| LIV-a11 | §1.5a / §11-5 | ✅ **Closed 2026-08-29:** every signed-in session viewer can cast or change an open advisory vote; the client sends no external voter key and renders the authoritative returned tally | closed | [[D315]]; component contract crosses a spectator through the real client shape | |
| LIV-a12 | §4 C5 | ✅ **Closed 2026-08-29:** every live kind exposes a distinct single-use **Create watch link** action; it requests spectator access without a match seat and states the sign-in, expiry and read-only limits | closed | [[D315]]; host component contract binds the request and rendered result | 🏆 |
| LIV-a13 | §1.5c / §11-6 | `session_invitations.state` has one producer and no `UPDATE` — the state can never move | ledger | [[D1344]] | 🏆 |
| LIV-a14 | §6 E1–E4 | **Streamer mode**: a three-state chrome preference on the existing keybinding registry that hides handles, ratings, the assistance rail, evidence panels, authored markers and shell chrome, states what it does *not* do, and stops the word *"Stream"* meaning two things | none | depends on nothing; the dossier's own #1 sequenced item | |
| LIV-a15 | §7 F2 | ✅ **Closed 2026-08-29:** match invitation copy names either player's pause proposal, the other player's acceptance and the preserved main line | closed | [[D2023]]; native-match browser journey | |
| LIV-a16 | §9 9-S | The worked Stream preamble (five answers, including *no delay, no chat, no anonymous viewer*) | none | the contract's *home* needs Q1; this instance does not | |
| LIV-a17 | §9 9-Ma | Match/Arena needs two preambles because it is two features | none | | |
| LIV-a18 | §10-q | `RunService.evidence` serves rung-2 numbers to **any granted reader with no role check** | ledger | [[D448]]; should close before any viewer list is printed | 🏆 |
| LIV-a19 | §12-3 | `broadcast-and-teacher-surfaces.md` §3.3/§7.1 defects are fixed at HEAD — the dossier is stale and owes a correction (the chat-bridge item remains unfixed) | none | | |
| LIV-a20 | §12-4 | `docs/live-sessions.md` wrongly says player and spectator get the same projection | none | one clause; flagged as a docs DESIGN-GAP and unrepaired | |
| LIV-a21 | §12-7 | `rfc/README.md` rows 38 and 40 are stale on casting's unblocking and `social-play`'s return | none | | |
| LIV-a22 | §12-8 | `rfc/casting.md` does not carry its own Discharge D3, so readers re-derive the refusal | none | same class as [[D1413]] | |
| LIV-a23 | §12-5 | The two delays are different objects; the interface must not let a user read one as the other | ledger | [[D1291]] | 🏆 |
| LIV-a24 | §15-1 | **No streamer, coach, viewer or opponent has been asked anything.** The cheapest fix is one conversation with one chess streamer | none | the whole streamer experience is proposed on zero testimony | |
| LIV-a25 | §0 | The overlay has never been captured in OBS; no two-account session; no relayed vote; no redeemed link | none | | |

### Settings, appearance and identity — `ux-settings-and-identity.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| SET-a1 | §2.3a | App-theme preview card: a miniature of the real chrome showing six tokens as they appear | ledger | [[D1463]]; needs `applyPalette(el, palette)` — the controller writes 12 tokens only to `documentElement` | |
| SET-a2 | §2.3b | Board preview: a mid-game FEN with last-move, dest dot, check radial and all four `MARK_BRUSHES` | ledger | [[D1463]] | |
| SET-a3 | §2.3c | Piece preview: six roles in both colours over one light and one dark selected square | none | mono is a mask recolour that can fail to separate | |
| SET-a4 | §2.4-2 | `Chessboard` reads board/piece attributes from the global controller — it needs two optional props to preview anything | none | small and named | |
| SET-a5 | §2.3a2 | Move the inherited-palette sub-AA notice onto the entry card, where `rfc/theming.md` already specifies it | none | mechanism right, seating wrong | |
| SET-a6 | §4.2/§4.4c | Render **Piece movement** through `HonestControl` when reduce-motion is on — today the select displays a value that is not in effect | ledger | [[D1460]] | |
| SET-a7 | §5.2d / §9 | **Settings never calls `permittedAssistance()`**, so Match/Arena renders nine live controls that are all inert. `HonestControl` is used 7× in run screens and **0×** here | ledger | [[D1462]] | |
| SET-a8 | §5.2e | First paint renders `SILENT_ASSISTANCE` then replaces it `onMount` — a visible flash | none | | |
| SET-a9 | §5.2c | A second, divergent copy of the assistance panel ships in-run with different labels | none | | |
| SET-a10 | §5.4-4 | Rename the `/settings` h1 (*"This deployment"*) and move capability and surface-availability lists to an *About this deployment* section | lane | ux-work-lane E3 | |
| SET-a11 | §5.4-5 | Give settings a table of contents (Appearance · Playing · Account · About) and a landmark structure | none | | |
| SET-a12 | §6C-4 | Replace eight identical *no provider* strings with one statement in About | none | | |
| SET-a13 | §6C-2 | Reduced motion is already inferred and must be **disclosed**, not silent | none | | |
| SET-a14 | §6C-3 | The word *"context"* and the matrix must never face a person; the workflow context is already derived | none | | |
| SET-a15 | §8.4-1 | **One control layer authored once, token-driven** — select, checkbox, radio, input, button. The single highest-leverage identity change in the app, and it costs one file | lane | ux-work-lane A2/A3 | |
| SET-a16 | §8.4-2 | Add `select` to the global `font: inherit` reset — one word | wave3 #13 / lane A2 | [[D484]], open since 2026-08-16 | |
| SET-a17 | §8.4-3 | Fix the checkbox-above-caption stacking with the `:has()` rule already correct in the sibling file | wave3 #13 / lane A3 | [[D484]]; 48 checkboxes | |
| SET-a18 | §8.3a/§8.4-4 | Four `color: white` on `background: var(--accent)` where `--on-accent` is near-black in dark themes | none | | |
| SET-a19 | §8.3b | Three hard-white mixes, **including the global `:focus-visible` ring and `::selection`** | none | | |
| SET-a20 | §8.3c | `background: white` on every repertoire-form input, select and textarea | none | | |
| SET-a21 | §8.3d | Eight `Canvas`/`CanvasText` uses plus four hexes follow the OS, not the theme | none | | |
| SET-a22 | §8.3f / §8.4-6 | Close the theming sweep's three holes — named colours, `.css` files excluded, the by-name exemption | ledger | [[D1433]], [[D1461]] | |
| SET-a23 | §8.3g | `theme.test.ts:182` pins `#c0ae91`, a hand-computed constant absent from `brown.css` and recomputed by no test | none | | |
| SET-a24 | §8.2a | There is no global stylesheet: 20+ component-scoped style blocks plus one `:global` section | none | | |
| SET-a25 | §4.5 | `theme.test.ts:97-99` asserts the **wrong** behaviour, so repairing the fallback means editing a green test | ledger | [[D1460]] | |
| SET-a26 | §7.3 | The product ships a preview for deleting your account and none for changing its colours | ledger | [[D1463]] | |
| SET-a27 | §Res R1 | A 20-minute browser pass over lichess's dasher and chess.com's *Boards & Pieces* — the highest-value follow-up, never run | ledger | [[D1458]] | |

### Teacher and classroom — `ux-teacher-and-classroom.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| TCH-a1 | §Verdict F1 | The teacher's submission list renders a date and an access window and **names no learner, no pack and no assignment** | ledger | [[D1480]] | 🏆 |
| TCH-a2 | §3.3a | Build the roster × assignment grid — four act-cells, no marks, no scores. *"Who has not submitted"* has no representation at all | ledger | [[D1480]]; a round is exactly this grid | 🏆 |
| TCH-a3 | §Verdict F2 | The learner's `/learn` consent card **names no teacher holding access**, which `teacher-surface` §2.4 requires | ledger | | |
| TCH-a4 | §Verdict F3 / §5.3-1 | The simul wall drops `lastMoveAt` — it is in the payload and unrendered, and it is the one honest *who is stuck* signal | ledger | [[D1479]] | 🏆 |
| TCH-a5 | §Verdict F4 | **`resolveProposal` has a route and a client method and no button anywhere.** A learner can propose a move and a coach cannot accept it — the coached session's central gesture | ledger | [[D1480]]; verified at HEAD: zero `.svelte` callers | |
| TCH-a6 | §5.3 rule | Write the law-8 fence into the row: **the wall may order by elapsed time and never by evaluation** | ledger | [[D1479]] — a doctrine sharpening, not a repair | 🏆 |
| TCH-a7 | §5.3-2 | Mark `sideToMove` against `board.players` so a coach can see whose turn it is | none | a rules fact, derivable | |
| TCH-a8 | §5.3-3 | Surface `board.pausedAt` on the wall | none | | |
| TCH-a9 | §5.3 | Put the run's `objectiveState` on each wall card as an authored, not computed, signal | none | already rendered in the overlay | |
| TCH-a10 | §5.3 | The live studio never names the owning classroom — `live_sessions.classroom_id` ships; one server-side join | none | pack night loses its identity the moment it opens | 🏆 |
| TCH-a11 | §5.3 | The studio is generic across stream/academy/match and does not know it is a lesson; it never says we ship host-side rewind/branch/teach that nobody else has | none | | |
| TCH-a12 | §3.3b | Assignment lists and learner cards render `packId` instead of `pack.title`, in two places, with the packs already loaded | ledger | | |
| TCH-a13 | §3.3c | **Overdue does not exist** — zero grep hits across web, runtime and server, against `teacher-surface` §3.3 which specifies it | ledger | | 🏆 |
| TCH-a14 | §3.3d | The coach-side assignment list drops the teacher's note entirely | none | | |
| TCH-a15 | §4.3a | Name the teachers who hold access on the `/learn` card; `grantedLearnerIds` is resolved server-side | none | | |
| TCH-a16 | §4.3a2 | Revoke copy must not imply revocation is an undo — it guarantees future reads stop, never that what was read is forgotten | none | | |
| TCH-a17 | §4.3b | A submission confirmation stating who reads it and until when, and **that a granted teacher sees which assistance rungs the learner opened** | none | stated in the RFC, rendered nowhere; `CohortStanding` publish confirmation is the shipped model | |
| TCH-a18 | §4.3b3 | Submissions render as N bare, unbounded, undated, unordered buttons | none | | |
| TCH-a19 | §4.3c | Offer submission at run end (`outcome.reached`), not only from the inbox | none | one conditional on an already-loaded list | |
| TCH-a20 | §7.2-1 | The rating cell prints an interval with no value when `pointEstimate` is absent | none | §10a.3 requires the field to be absent | |
| TCH-a21 | §7.2-2 | The standing table's 48rem min-width scrolls sideways on a phone and a member must hunt for their own row | none | | 🏆 |
| TCH-a22 | §7.2-3 | *"Join this standing"* precedes any statement of what a standing is | none | | |
| TCH-a23 | §7.3b | Give `abandoned` its own third toggle — a **conduct signal** currently rides the control labelled *"Show my record"* | ledger | [[D1482]]; needs no ruling | 🏆 |
| TCH-a24 | §7.3c | The mark pill shows the band as its glyph with the verb only in a `title` — invisible on touch | ledger | [[D1482]]; needs no ruling | |
| TCH-a25 | §7.3d | Say that the coach is not in the table and cannot publish | none | | 🏆 |
| TCH-a26 | §6.2-1 | The review rail closes irreversibly if the learner opens the run live — unwarned and unexplained | none | `design/05:41` and `teacher-surface` §7.2 both require it be stated | |
| TCH-a27 | §6.2-2 | A hand-minted spectator grant confers read but not the review rail, and the asymmetry is invisible | none | must be stated, not rendered as a refusing control | 🏆 |
| TCH-a28 | §5.3 ladder | Write the pedagogical rule: the cheapest coach intervention is the most expensive for the learner. Put reclaim behind a confirmation naming its cost; keep marks and reveal at hand | none | | |
| TCH-a29 | §2.3 | The classroom section must explain itself in one sentence before offering a Create control; the invitation must name the inviter, what it authorises and what it does not (`invitedBy`/`invitedAt` are on the type and unrendered) | none | | |
| TCH-a30 | §8 | The academy's two default layers disagree — `presets` says `guided`, `PROFILE_DEFAULTS.academy` ships SILENT. A guided session that says nothing | ledger | | |
| TCH-a31 | §5.4 | The desktop grants list satisfies watcher-disclosure; the compact-viewport half does not, and the RFC routes the phone answer to a `/learn` card that names nobody | none | | |
| TCH-a32 | §2.2/§13 | **The classroom competitor record is empty** — Chess.com Classroom, ChessKid Classroom, Chessity, Chess.Run and ChessPlay.io are name-drops; Lichess Classes returns zero hits across `design/research/`. The strongest candidate for the first hands-on pass in the programme | ledger | desk arm completed in `classroom-competitor-workflows.md`; [[D1483]] remains for the exact authenticated two-account hands-on protocol | |
| TCH-a33 | §13 | Nothing was exercised in a browser: no two-account classroom, assignment, standing or academy session | none | a hands-on pass would settle the read-symmetry question by observation | |

### Import, account and data — `ux-import-and-account.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| IMP-a1 | §2.4b | Multi-game PGN: parse all, render a picker, import the chosen game. **The data is already in hand at `pgn-import.ts:26` when the refusal throws** | ledger | [[D1486]] | |
| IMP-a2 | §2.4b2 | Variation-bearing PGN: import the mainline and state the omission on the run. `original_pgn` retains the bytes verbatim | ledger | [[D1486]] | |
| IMP-a3 | §2.3-5 | **The product routes chess.com users into its own narrowest refusal** — self-inflicted by the copy at `App.svelte:844` | ledger | [[D1486]] | |
| IMP-a4 | §2.4c | A confirmation step before the run exists: players, date, result, plies, side, and what will be dropped | none | one server dry-run route or a client-side parse; `chessops/pgn` is already a dependency | |
| IMP-a5 | §2.4c2 | Side is a select set *before* parsing, though the PGN headers usually answer it | none | | |
| IMP-a6 | §2.4e / §11-12 | **Retain own-game clocks end to end.** Request them, extract `[%clk]` before annotation stripping, persist the typed per-ply readings, and include them in account export/delete inventory. `clocks=true` alone still loses every reading in `stripPgnAnnotations` | ledger | [[D1048]], [[D2021]]; implementation is one `recorded-clocks` unit, not a query-string edit | 🏆 |
| IMP-a7 | §2.3-4 / §9-4 | Six independent hard refusals render as **one raw parser string in one `alert`** | none | | |
| IMP-a8 | §2.3-1 | Four import forms on four screens with no shared vocabulary and no shared component | ledger | [[D1486]] | |
| IMP-a9 | §2.3-2 | Forms 1 and 2 disagree about whether a variation-bearing multi-game PGN is acceptable (`repertoire.ts:81` vs `pgn-import.ts:26-31`) | none | | |
| IMP-a10 | §2.3-6/-7 / §11-13 | Import stores another product's move verdicts and **both players' handles verbatim, and exports them**, undisclosed. Disclosure, not stripping — provenance needs the tags | ledger | [[D410]]/[[D959]]/[[D1486]] | |
| IMP-a11 | §2.3-8 | Chess960 imports silently as standard chess when the `Variant` header is absent or misspelled | ledger | [[D1033]] | |
| IMP-a12 | §5.4ii | **The standing *"What Tabiya has recorded"* section**: twelve rows with live counts and each one's export/deletion fate, generated from `AC38ATA_INVENTORY` (which throws at startup on drift, so it cannot go stale like prose) via `planDeletion` in a non-destructive mode | ledger | [[D1484]]; the twelve *labels* need a ruling, the section does not | |
| IMP-a13 | §5.4ii3 | Reading your own inventory currently requires approaching the destroy control | ledger | [[D1484]] | |
| IMP-a14 | §5.3 | **`behavioral_profiles` is the disclosure debt** — six tables named nowhere on the account screen, while [[D604]] measured that behavioural rows re-identify 35 of 36 accounts | ledger | [[D604]] | |
| IMP-a15 | §5.4i | One data sentence on the registration screen beside the credential sentence | none | see §What a dossier got wrong — the proposed wording is false | |
| IMP-a16 | §5.4iii-a…d | Four just-in-time notices, each seated where the shipped pattern is already proven: first rated game, first classroom join, first share link, first import | none | generalises two shipped publication notices | |
| IMP-a17 | §5.4 guard | The disclosure projects storage facts only — no inference, no profile narration. *That is the account-screen form of the law-8 anti-pattern* | none | | |
| IMP-a18 | §6-1 | Export never says it cannot be re-imported and that no other product reads it — the doc states it plainly and the `.honest` class exists for it | none | | |
| IMP-a19 | §6-2 | PGN export ships per run and is never mentioned or offered from the account screen. *"Download my games as PGN"* is the actual request | none | | |
| IMP-a20 | §6-3 | Export re-confirms a password with no recovery, so lockout is permanent data loss | none | B8 and the recovery gap meet here | |
| IMP-a21 | §7-1 | Split reading the inventory from starting deletion — same query, two entry points | none | | |
| IMP-a22 | §7-2 | Per-run deletion ships and its only entry is inside the account-deletion list | ledger | | |
| IMP-a23 | §7-3 | Say what deletion cannot reach **before** it is chosen, not only inside the preview | none | | |
| IMP-a24 | §4.3-4 / §9-1 | **The acquisition funnel terminates in a wall**: the public story card's only CTA is `productLink:"/"`, hardcoded to the password gate, and neither surface says what Tabiya is | ledger | [[D1485]], [[D1473]] | |
| IMP-a25 | §4.3-1 | `GET /packs`, `GET /packs/:id` and `GET /capabilities` are **already unauthenticated**; only a blanket client `{:else if !learner}` hides the catalogue | ledger | [[D1485]] | |
| IMP-a26 | §11-17 | The `story_read` token **never expires** and nothing says so at the moment of sharing | none | a permanent public window | 🏆 |
| IMP-a27 | §8 | The proposed data-tier rule, mirroring `design/05:41`: *presence is stated, never assumed, at the moment keeping starts* | none | | |
| IMP-a28 | §2.3-3 | None of the nine nav destinations is called Import; the importer lives under *"Run history"* | none | the routing half needs a ruling; the naming does not | |
| IMP-a29 | §11-14 | **No competitor in this corpus is documented as shipping any data-rights surface at all**, because `competitor-matrix.csv` has no column for it. Three privacy-policy fetches would settle it | ledger | [[D1458]]; a matrix gap, not a field absence | |
| IMP-a30 | §Res 4/5 | No import was performed against a live Lichess URL and the six parser refusals were read from source rather than reproduced by pasting | none | | |

### Authoring and library — `ux-authoring-and-library.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| AUT-a1 | §5 C1 | **Call `POST /packs/drafts/:id/lint` on the buffer, debounced, without saving.** The endpoint accepts arbitrary unsaved bytes and has never had a client caller | wave3 #10 | [[D1488]]; `api.ts` already has `lintShapeDraft` | |
| AUT-a2 | §5 C4 | Pass principles and sibling packs into `PackStudio` — two constructor arguments; four codes are currently unreachable in Studio and the docs claim otherwise | wave3 #11 | [[D1488]] | |
| AUT-a3 | §6 D1 | **Ship `GET /principles`.** `rest.ts` contains the string `principle` **zero** times while `principle-registry.ts:63` holds a finished, sorted browse projection | wave3 #12 | [[D695]] | |
| AUT-a4 | §5 C2/C3 | Split *incomplete* from *wrong*; present the required-field set as a checklist; collapse the `oneOf` explosion by filtering on the discriminating key **before** display | none | C3 must land with C1 or continuous linting makes things worse — see the ordering objection at the end | |
| AUT-a5 | §9 G5 | Add the shape editor's missing error path — four handlers have no `try`/`catch` and no error element | none | | |
| AUT-a6 | §3 A3 | Derive the version string from the schema `$id`. The studio's only instructional string names format **0.8**; the shipped schema is **0.27** | none | | |
| AUT-a7 | §3 A4 | Ask the author for a title instead of hardcoding *"Distilled rehearsal"* on every distilled draft | none | | 🏆 |
| AUT-a8 | §8 F1 | The graduation blocker list becomes the studio's primary right-hand column | none | | |
| AUT-a9 | §3 A1/A2 | `/create` opens on a four-door chooser (position · game · run · existing pack); the fourth door produces a ten-required-field scaffold with placeholders rather than an empty string | none | the first door wants a board (owner decision 4) | |
| AUT-a10 | §9 G1 | The one-FEN probe becomes a corpus preview — *fires on N of M authored positions*, each opening a board | none | needs a served position corpus | |
| AUT-a11 | §6 D2 | Every registry-backed field becomes a picker showing name and statement, never a text input | none | depends on AUT-a2 | |
| AUT-a12 | §6 D4 | The studio states its dead entries: 1 orphan principle, 4 orphan shapes, unimplemented enum values | none | `capabilities.ts` already declares it | |
| AUT-a13 | §7 E1/E4 | The provenance panel, filled as the author works, naming the two clean licence postures — and stating honestly that a CC0 source **cannot** be credited rather than degrading silently | ledger | [[D1394]] | |
| AUT-a14 | §7 E3 | Studio runs `make sourcing-check` and shows `ATTRIBUTION_MISSING` / `LICENCE_MIXED` at import | none | the checker is CLI-shaped and needs a server entry point | |
| AUT-a15 | §7 E-import-strip | Imported Lichess study annotations are third-party copyright; the import path must strip them | ledger | [[D410]] | |
| AUT-a16 | §7 E5 / E-mixing | Two named refusals to write down: **do not** build per-claim citation UI or auto-rewrite authored prose; **never** build a per-field or per-paragraph attribution model | none | provenance will not survive edits | |
| AUT-a17 | §3.3f (campaign §3) | Land `CAMPAIGN_PATH_WIDTH` — absent repo-wide, so a fully linear campaign validates silently against criterion 15 | ledger | [[D277]]; a defect against an accepted RFC, not a design question | |
| AUT-a18 | §1.5-13 / §11.3 | `docs/app-shell.md:28-29` describes a `/create` that predates the studio and a `/library` proposed for replacement | none | filed three times in the dossier; one repair | |
| AUT-a19 | §16 row-5 | Graduation blocker ids are 56-character truncated prose sentences — 205 distinct, 184 firing exactly once | none | measurement; feeds the typed vocabulary (RFC) | |
| AUT-a20 | §16 row-9 | **284 authored knowledge units are reachable only by accidentally playing into them** — 25 shapes and 13 principles, with 21/25 and 12/13 actually reused across packs | ledger | [[D692]], [[D695]] | |
| AUT-a21 | §16 row-10 | An authoring limitation is narrated to learners as chess advice inside `lucena.json`'s watch text | ledger | [[D103]] | |
| AUT-a22 | §16 row-4 | Registry-backed vocabularies became shared; `concepts` became **143 orphan singletons of 168** | ledger | [[D700]] | |
| AUT-a23 | §16 row-6 | The pack schema is the loosest of the three on attribution and carries the most third-party material | none | closing it is an RFC | |
| AUT-a24 | §9 G3 | `success.signature: null` becomes a first-class authoring choice with its required note | none | | |
| AUT-a25 | §9 G2 | A structured expression builder over the 18-leaf grammar with the JSON alongside | none | the grammar sync test is the contract | |
| AUT-a26 | §14 / §Res | **Nobody has ever seen a competitor's authoring editor** — not Lichess studies, not Chessbook's builder, not Chessable's. Two free accounts and an hour fixes it; five further named `[P]`s (soft-fail batching, import paths, prose errors, the 43.5 min/pack figure, *"no wave since pack A has played a run"*) each have a stated cheap settlement | ledger | [[D1491]], [[D1458]] | |
| AUT-a27 | §14 not-checked-2 | **No pack has ever been authored end-to-end through `/create`** — the dossier's own strongest missing evidence, and it costs one session | none | | |

### Accessibility and small screens — `ux-accessibility-and-mobile.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| A11-a1 | §4 d1 | Keyboard cannot reach square sight — call `onSelect` from the `activate` transition (**not** from `onActiveSquareChange`; sight is on-request, not on-cursor) | wave3 #5 | [[D1447]]; two lines | |
| A11-a2 | §4 d2 | `KeyboardHelp` clips at the viewport floor — copy `ShellKeyboardHelp`'s `max-height` rule, one line | wave3 #7 | | |
| A11-a3 | §4 d3 | **The skip link skips *to* the navigation.** Point it at the content instead | wave3 #7 | see the correction at the end — the *"no `<main>`"* half of this row is false at HEAD | |
| A11-a4 | §4 d4 | `<title>Tabiya</title>` is static across twelve routes; write `document.title` in the router subscription (WCAG 2.4.2) | wave3 #7 | verified at HEAD | |
| A11-a5 | §4 d5 | Route changes move no focus and announce nothing | wave3 #7 | | |
| A11-a6 | §4 d6 | The busy live region is `display:none` below 60rem, so *"Thinking…"* is never announced on a phone | wave3 #7 | `.status`'s `clip-path` below 719px is the correct pattern to copy | |
| A11-a7 | §4 d7 | `ShapePanel` is an overlay with no dialog role, no focus move, no restore and no Escape | wave3 #7 | | |
| A11-a8 | §4 d8 | Two sub-24px touch targets **on the board** — `.appearance-link` (~21px) and `.text-move` input/Submit (~21px), the second being the accessibility fallback control | wave3 #7 | WCAG 2.5.8 | |
| A11-a9 | §4 d10 | Keyboard hints live inside accessible names — *"Fork B"*, *"Replay Space"*, *"Export E"* | wave3 #7 / lane A7 | proposed as **D494** in the lane and never ledgered | |
| A11-a10 | §4 d11 | Phone region tabs carry no selected state in the accessibility tree — three attributes | wave3 #7 | | |
| A11-a11 | §4 d12 | 48 checkboxes render above their captions; one `:has()` rule | wave3 #13 | [[D484]], open since 2026-08-16 | |
| A11-a12 | §3.2 s3-c1…c9 | The nine shortcut defects individually: all nine suppressed from the board grid with only an undocumented double-Escape out; no key returns focus to a region; arrow stepping dead **inside** the timeline; Space toggles replay except on any button; Alt+C has a second undocumented guard; the `g` chord is live inside the grid and swallows the next keystroke for 1.2s; the checkpoint sheet swallows Escape silently; the timeline puts a non-interactive section in tab order (40-ply run = 40+ consecutive stops) | wave3 #6 | [[D1492]] names the class; the nine are individually unqueued | |
| A11-a13 | §3.2 s0-packnames | **Every pack card button's accessible name is *"Open position"*** — N indistinguishable entries | none | | |
| A11-a14 | §3.2 s0-tabstops | Reaching the pack list costs ~12 tab stops | none | | |
| A11-a15 | §3.2 s2-two-maps | The two help dialogs disagree and no single place lists the whole keyboard | none | | |
| A11-a16 | §3.1 | **Zero focus traps client-wide against ten dialogs; zero `inert` uses.** Should land as one change, not nine | none | interacts with region registration and the phone sheet | |
| A11-a17 | §3.1 | Zero `prefers-reduced-motion`, `prefers-contrast`, `forced-colors` and `prefers-color-scheme` CSS blocks anywhere | none | | |
| A11-a18 | §3.1 | Three separate `visually-hidden` implementations, one using deprecated `clip: rect()` | none | | |
| A11-a19 | §3.1 / §3.9 | **Zero axe-core, pa11y or Lighthouse in any `package.json` or source file** | none | | |
| A11-a20 | §3.4 B | Criterion 7's population omits `square.oc.move-dest`; the capture ring fails at 12.5 and 18.6 against a floor of 20 | ledger | [[D1461]]; the criterion amendment is an RFC edit — see (c) | |
| A11-a21 | §3.4 E | **Colour vision has never been considered anywhere** — the check indicator vanishes for tritanopes on brown dark squares | ledger | [[D1494]] | |
| A11-a22 | §3.4 F | Five hard-coded whites in themed colour, one of them the global `:focus-visible` outline | none | | |
| A11-a23 | §3.4 G | `forced-colors` is unhandled and every dest and check indicator is a `radial-gradient` background image — which forced-colors mode removes | none | | |
| A11-a24 | §3.5 | `prefers-reduced-motion` reaches only Chessground interpolation; no CSS block exists | none | | |
| A11-a25 | §3.6 | `.identity-control` Sign out is ~24px, borderline; **the 24px guard regexes two CSS rules in one file and cannot see the two that fail** | none | | |
| A11-a26 | §3.7 fallout-3 | The whole iPhone 12–15 Pro class is refused in Safari and **works installed as a PWA** | ledger | [[D1493]]; nobody has opened this app on a phone | 🏆 |
| A11-a27 | §3.7 fallout-5 | Rotating an iPad to landscape shrinks the board 96px because the desktop branch subtracts the rail | none | | |
| A11-a28 | §3.7 phone-sheet | The phone sheet has no dialog role, no `aria-modal`, no focus move, trap or Escape | none | | |
| A11-a29 | §3.8 surf-* | **Twenty-three per-surface findings**, one row each — shell, home, pack list, Just Play starter, drill, board, timeline, branch rail, phone tabs, compare, checkpoint sheet, terminal sheet, shape panel, inspector, story, rating, live list, live overlay, create, library, appearance, assistance, cohort standing, group panel | none | the pattern beneath them: **seven surfaces have no width media query and no RFC or dossier specifies their composition** | 🏆 |
| A11-a30 | §3.9 | Test-harness defects: no `projects` array (one implicit Chromium at 1440×1000); `devices[]` never imported, so 8 of 9 phone-width assertions run with desktop input semantics; 4.7% of 467 selector uses assert a11y semantics; 1 of 11 live regions asserted; **Escape is never pressed in the suite**; `forcedColors`/`colorScheme` emulation is zero; `keyboard.ts` owns the shortcut system and has no unit test | none | | |
| A11-a31 | §2.2 | Three things to steal from lichess's `nvui`: board layout as a **user preference** with named modes; squares as 64 focusable buttons carrying file/rank attributes; a published board-command query vocabulary | none | the vocabulary needs Q4; the other two do not | |
| A11-a32 | §2.3 gap-shared | The non-visual layer is not shared: Compare, Story and the Live overlay have no semantic layer at all | none | | |
| A11-a33 | §2.1 / §2.4 | **The repo has recorded zero accessibility observations about any competitor** and `competitor-matrix.csv` has no a11y column; chess.com's posture is unknown and is reported as unknown | ledger | [[D1458]] | |
| A11-a34 | §7 res-P1…P5 | Five named `[P]`s each with a stated cheap settlement: iOS Safari `innerHeight` (the whole iPhone-12 finding rests on it), Pixel 7 chrome height, the ~42% sheet occlusion (arithmetic, not measured), touch-target heights (computed, not measured), iPhone SE installed base (`[M]`) | none | one phone, one browser-test run | |

### The opponent — `ux-opponents.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| OPP-a1 | §0.2 / §1 rec-2 | **Always send a band from Just Play.** The starter sends no `targetElo`, `appliedTargetElo` falls to `profile.default`, and the default is Maia's UCI spin value `1500` — a rung nobody chose, nobody measured, and no learner is ever told about | ledger | [[D1502]]; `TARGET_ELO_REQUIRED` exists as the refusal and never fires | |
| OPP-a3 | §3 rec-4 | Render the resistance sentences in Just Play — they are gated on `pack !== undefined`, which is backwards: the pack-less game is the one with no author to explain it | ledger | [[D1502]] | |
| OPP-a4 | §3 rec-1 | **Ship the opponent identity bar**: name, art, rung, one word of family. Greenfield — `avatar` occurs **zero** times in `apps/web/src` | none | ⚠ the owner's example. In no queue at all | |
| OPP-a5 | §3 rec-5 | Announce a mid-run opponent change in the bar when `flipRun` changes resistance | none | | |
| OPP-a6 | §4 rec-1 | Put the *"not FIDE, Lichess, or Chess.com"* disclaimer on **every** opponent surface, verbatim | none | | |
| OPP-a7 | §4 rec-2 | Never render `targetElo` as a strength; reword the provenance sentence into band vocabulary (O8.4) | ledger | [[D344]] | |
| OPP-a8 | §4 rec-4 | Tell the learner once, in the endgame, that the chosen rung has almost stopped applying — below ten pieces the dial buys ~0.07 Elo per band point instead of 0.40 | none | material count is already available | |
| OPP-a9 | §4 fact-1…4 | Four measured, learner-reachable facts nothing surfaces: ladder width 479.8 Elo [454.9, 504.7]; adjacent gaps 141.6 / 93.4 / 112.5, all above the ~60-Elo floor; a 100-point step buys 22.1–26.9 Elo; ≤10 pieces costs −72.4 Elo total | none | | |
| OPP-a10 | §1 rec-5 | Keep `strong_engine`, place it **outside** the ladder, and stop calling it a rung | none | `policyUsesMaiaBand` already excludes it | 🏆 |
| OPP-a11 | §5.2 | **Build observed traits.** `observedTrait` appears nowhere in `apps/` or `packages/`; every input exists (persisted selections, `candidateFeatureVector`); *"Wren has taken the b2 pawn in 2 of your 4 games"* is law-8-safe by construction | ledger | [[D1501]]; needs a home RFC, no external blocker | |
| OPP-a12 | §5.1c | The rule to write down: a name is free under law 8 and is **not perceptually neutral** — `docs/bot-policy.md` says a name cannot change a move while our own blind-review protocol forbids showing reviewers a bot name. Both are true, and the combination is the design rule | ledger | [[D1501]] | 🏆 |
| OPP-a13 | §5.5a/b | Two refused shapes, written down: temperature/top-p is a **strength** dial (+468.3 Elo), not a personality dial; *"thinks a while on hard moves"* fails `assertLayer` on `effect: "delay"` | ledger | [[D820]] | |
| OPP-a14 | §7 rec-4 | State the no-adaptation promise on the card once — a refusal that reads as a feature | none | O8.3 already rules it | |
| OPP-a15 | §7 rec-5 | Do not build rivalry mechanics on an uncalibrated ladder, and say which it is | none | see the internal conflict noted at the end | |
| OPP-a16 | §0.2c | Adopt `maia.ts:8-10`'s clamp comment as the pattern for every card sentence: a deployment bound stated as a bound, never as a claim | none | | |
| OPP-a17 | §Residuals 1 | **Four named opponent teardowns owed, in priority order**: chess.com's bot-selection gallery and per-bot card content; lichess's level picker and the `maia1/5/9` account presentation; Chessiverse's bot detail page; ChessMind's six-band picker — *"the closest stack neighbor in the entire matrix"*. Two protocols already exist for it | ledger | [[D1458]] | |
| OPP-a18 | §Residuals 1 | **Add a fourth teardown question**: *who does this product say you are playing, and what does it claim about them?* A case-insensitive search of `teardown-noctie-desk.md` for *bot*, *opponent* and *persona* returns **zero** hits, and most of the sweep has the same shape. This is the protocol gap that produced *"a mention in six dossiers and a pass in none"* | none | a `design/research/README.md` edit | |
| OPP-a19 | §Residuals 3 | The 42-branch blind packet is prepared, integrity-checked and **unused**. It cannot establish a population claim but it can reject an incoherent profile — the cheapest available check on whether the card's sentences describe play a person experiences | none | not scheduled | |

### Campaign and progression — `ux-campaign.md`

| id | § | what it is | queued? | note | 🏆 |
|---|---|---|---|---|---|
| CMP-a1 | §0.2 | The campaign mechanism is fully built with **zero consumers**: `content/campaigns/` does not exist and zero campaigns are authored | ledger | [[D1497]]; the door is ruled ([[D1514]]) and opens onto nothing | |
| CMP-a2 | §2 Rec 1 | State the run's length before it starts — in plies now, in minutes only after one owner run with a clock | none | no per-attempt timing telemetry exists | |
| CMP-a3 | §2.4-3 | **One owner run with a clock** — the cheapest `[M]`→`[V]` upgrade in the dossier, converting §2.3, §7.5 and §9.3a at once | none | | |
| CMP-a4 | §3.3c | Say the act ladder in one sentence: escalation in **decidability**, not in numbers | none | | |
| CMP-a5 | §3.3c-bis | **Act II is the shortest act** (11 → 8 → 24 ply). Either the act structure or the middlegame horizons are wrong | none | an authoring decision | |
| CMP-a6 | §3.3d | Act III's `perfect_tablebase` is unbeatable and must be disclosed before entry, in the briefing copy | none | | |
| CMP-a7 | §3.3e | One sentence on *"Declare done"*: it locks the node and the attempts are kept | none | | |
| CMP-a8 | §4.3c | Say *"one run at a time — finish it or abandon it"*; the campaign cannot accumulate a backlog | none | `CAMPAIGN_RUN_ACTIVE_EXISTS` is a shipped typed error | 🏆 |
| CMP-a9 | §4.3d-bis | Survival nodes over-state the envelope; present their contribution as *"up to"* — decide before the first survival node ships | none | | |
| CMP-a10 | §4.3e | Tell a learner who leaves an encounter what happened to it — one sentence | none | open question 3 ships the free reading | |
| CMP-a11 | §5.1 | **The deck framing is three-quarters false**: no synergy, no power, no run-to-run difference. Do not ship synergy discovery or *"pays off in combination"* copy | ledger | [[D277]]; R11 refuted the conjunction | |
| CMP-a12 | §5.3b | The unlock ceremony must state whether the module is active under the current preset, and what switching costs | none | strings plus reading `effectiveCampaignModules` | |
| CMP-a13 | §5.3c-1…4 | Four suppressor-boss rules: disclosed before entry by name and effect; suppression attributed to the boss, **never** to the learner; restoration visible on the seal; and the suppression sentence must never share a template with the honesty-withholding sentence | none | criterion 7 already makes card disclosure failable | |
| CMP-a14 | §5.3d/§5.3e | The surface is an unlock **schedule**, not a deck-builder — do not draw it as one; and the act-end screen looks identical whether the act was swept or failed at every node | ledger | [[D1040]] grants on any verdict | |
| CMP-a15 | §6 R1–R6 | The rewind economy's presentation: never a bare number — show the rule with the number as its receipt (*"win or lose"*); earn loud, spend quiet; the counter is never on screen at the moment of the mistake; the refusal names the **income**, not the shortage; the learner-facing noun is *earned rewinds*; **and the drill-side clause — *"rewinding here costs nothing"* — can land today and should land first** | ledger | [[D945]], [[D1496]] | 🏆 |
| CMP-a16 | §6 never-1…5 | Five prohibitions written down: no timer or regeneration clock; no *get more* affordance; no second currency; no rewind count in any verdict, seal payload, export or module sentence; no comparison of one learner's frugality with another's | ledger | ADR-0007, [[D302]], [[D1416]] | 🏆 |
| CMP-a17 | §7.7-1…3 | Three properties that hold whatever [[D1300]] is ruled: losing never locks content; the ending names the node that ended it and offers the preserved run; the catalogue diff renders identically on a lost run and a won one | ledger | [[D304]], [[D1040]], [[D1515]] | |
| CMP-a18 | §8.2 | Balatro-style escalating requirement is **refused by measurement** — do not build a chess-legal imitation | ledger | R4/R9: difficulty measured on two islands that do not touch | |
| CMP-a19 | §8.3a-bis | **35 of 47 packs hard-code band 1800**, so a band ladder is an authoring change; and R10 means band shifts above ≈2500 must be visibly clamped | none | | |
| CMP-a20 | §8.3b-bis | The document should state which learner it was written for — a start-screen sentence | none | | |
| CMP-a21 | §8.3c | A strong player's axis is suppression breadth and slot scarcity, **not** opponent strength — weakened Stockfish is refused and above 2400 only `strong_engine` exists | none | forced, not chosen | |
| CMP-a22 | §8.3d | The replay ceiling is authored-content decay: **6.2 runs before repetition at 56 packs.** No difficulty tuning moves it — only content does | none | | |
| CMP-a23 | §9.2 | The return loop and the campaign do not touch, and there is zero outbound notification capability | none | `return-scheduling` §12 refuses repetition inside a campaign node | |
| CMP-a24 | §9.3b | Do not build a campaign streak — the map is already the progress display | none | | |
| CMP-a25 | §9.3c | **A campaign surface will attract the refused progression denomination (d), *another person's expectation*.** [[D1151]] ruled (c), the catalogue, is the answer — and [[D1416]] *defers* leagues and tournaments rather than refusing them, so the pressure is scheduled, not closed | ledger | this is the campaign dossier's explicit tournament hook | 🏆 |
| CMP-a26 | §1.6a/b | [[D1437]] correction: the campaign context is byte-identical to `pack` except for its default preset and storage key. The real harm is that a campaign starts **Quiet** rather than Guide-me and writes a preference key no run reads | ledger | [[D1500]] | |
| CMP-a27 | §1.2 | Every pack a campaign could reference today is an ungraduated draft: 55 of 56 carry blocking `graduationBlockers` and `content/packs/` is empty | ledger | [[D1504]] | |
| CMP-a28 | §1.3 | The shipped exhaustion string is an internal error id plus a bare shortage, with no income statement | ledger | | |
| CMP-a29 | §10 res-9/10 | Two bounded evidence limits recorded: some prior art came via search-index snapshots (Fandom HTTP 402), and two claims are unverifiable anywhere (Chessable's *"up to 95%"*, the *Chess Life* Solitaire table) — used for nothing | none | | |

---
## (b) BLOCKED ON AN OWNER RULING — 98 items

Grouped by the ruling, because one ruling usually unblocks several items. **Every ruling named here
is unasked or unanswered at HEAD**, and the rulings landed today ([[D1513]], [[D1514]], [[D1515]])
are already reflected in group (a).

### O-A2 — may a person play before creating an account, with the run claimed at signup?

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| ARR-b1 | arrival §2.3 A1 step 5 | The deferred account: *"Keep these two attempts?"* after the loop has run | ledger | |
| ARR-b2 | arrival §10 GAP 4 | `design/02:101-103` rules the only anonymous access is a scoped token; a first run before an account is a new anonymous surface | ledger | |
| IMP-b1 | import §4.2 | The stated reason for refusing guests is **false at HEAD**: nothing merges (every table keys on learner id) and `__legacy` is already a shipped second identity model | ledger | |
| IMP-b2 | import §4.4 A–E | Five costed options with no pick — keep the gate · anonymous read-only · guest learner row claimed by one `UPDATE` · a third `trial` token scope · guest-by-default | ledger | 🏆 |
| IMP-b3 | import §4.4 C2 | A guest has no path to its own data: export and deletion both re-confirm a password | none | |
| IMP-b4 | import §4.5 | The guest data-rights predicate and its five classes — reserved handle namespace, `behavioral_profiles` withheld, `live_social` handle visibility, no immutable publications, an abandoned-row retention rule | none | 🏆 |

### O-C5 — does Tabiya serve unreviewed content to a learner, and under what disclosure?

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| ARR-b3 | arrival §5.3 C5 | The catalogue-level honesty statement's wording. Today's state — correct gate, **zero graduable**, 56 items each badged *"unreviewed draft"*, no message explaining why — is the one option that serves nobody | lane | |

### O-D2 / O-E1 / 11.6 — who owns the pre-run start form, and where does the opponent ladder live in the IA?

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| ARR-b4 | arrival §11 O-D2 | `rfc/bot-policy.md:434-437` routes the roster picker to *"Just Play / `play-composition` surface work"*; `play-composition` covers only the in-run column. **The start form has no owner** | ledger | |
| ARR-b5 | arrival §11 O-E1 | Nothing owns the **pre-run preset choice**: `intent-presets` §7 seats the pill inside the run, §7.1 declines its visual form, §8.1 explicitly permits the start form to carry it | ledger | |
| OPP-b1 | opponents §11.6 | Where the opponent ladder lives in the IA — the only competent picker is behind a nav item called *Record*. Overlaps three dossiers and **should be decided once for all three** | ledger | 🏆 |
| AUT-b1 | authoring §13 d-3 | Does `/library` become a knowledge surface or get deleted? | ledger | |
| AUT-b2 | authoring §13 d-6 | Is Create's nav rank right? Depends entirely on decision 1 | none | 🏆 |
| IMP-b5 | import §2.4a / §10.4 | A single `/import` destination adds a tenth shell route to `design/03`'s table | none | |
| TCH-b1 | teacher §11 D-A | Where the classroom lives — Live / its own route / split across Learn and Live. It is standing and asynchronous and is filed under Live | ledger | 🏆 |
| CMP-b1 | campaign §11 O-CAMP-6 | The campaign's place in the IA **and its learner-facing name** — *campaign* carries a military metaphor into a rehearsal product | ledger | 🏆 |

### 11.1 — the thesis rider: does the four-rung picker clear *"not a generic bot ladder"*?

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| OPP-b2 | opponents §11.1 | `design/00-thesis.md:136` lists *"a generic bot ladder"* under **What it is not**. §1 recommends putting a four-rung picker on the primary play surface. The exemption has three conditions and the dossier states plainly that **if only the picker ships and the card and record do not, the result IS the refused object.** Ratify with the conditions, or refuse the picker | ledger | |
| OPP-b3 | opponents §9.3 / §11.1 | **DESIGN-GAP: the design tier has no opponent section.** Three RFC drafts each record the absence and each decline to fix it under law 5. The product's central promise has one line of intent. Three options: a `design/07-the-opponent.md`; an amendment to `design/03` §Just Play; or accept the absence and record it | ledger | |

### 11.2 — is the opponent's applied band assistance, or is it chrome?

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| OPP-b4 | opponents §11.2 | Today the applied band reaches a learner only inside the evidence-inspector modal behind `assistancePermission.humanSplit === "free"` and a click. **In the silent default profile the learner can never discover who they are playing.** Recommendation: chrome — who you are playing is not a hint about the position | ledger | |

### 11.3 — may a shipped profile carry a route source?

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| OPP-b5 | opponents §11.3 / §5.4 | O8.3 predates the mechanism and bars it. [[D1084]] passed **eight of eight** gates. Consequence of not lifting: the thesis clause *"truly applying an opening"* has **no shipping mechanism**, because the book arm is refused on measurement | rfcq | |

### 11.4 — may a card ever show an absolute human-scale Elo? (Discharge D5)

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| OPP-b6 | opponents §11.4 | Three options: anchor accounts on a public server; derive from the learner Glicko pool; or stay band-relative permanently and say so. The field has **exactly one** known solution and it is not arithmetic (Chessiverse's four Lichess calibration bots, recalibrated three times) | ledger | 🏆 |
| OPP-b7 | opponents §8.2g / §4 cost | Calibrated strength numbers need a **new preregistration**: Gate 0 abstained 2026-08-23 on a failed positive control, so its statistic and population may not be reused. ~4–5 h machine time on top | ledger | |
| OPP-b8 | opponents §8.2e | **Every calibration claim must name its clock**, and our harness plays untimed with no clock anywhere in the opponent path | none | 🏆 |

### 11.5 — persona naming

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| OPP-b9 | opponents §11.5 | The twelve placeholder names are claude's, and **changing a name voids that profile's calibration by digest** — so the set must be chosen *before* the ladder runs. Plus: one persona per profile, or one per family? Recommendation: per profile — a learner returns to *Wren*, not to *guarded, 1400* | rfcq | 🏆 |

### [[D1429]] — `assistance.arrows`: activate or retire

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| INR-b1 | in-run §3.4 | A fully-plumbed no-op: typed, persisted, migrated across four schema versions, permission-clamped, rendered as a three-option `<select>`, read by **no renderer**. The recommendation is **retire with a stated reason** through `HonestControl` — no module declares the `arrow` form and the structural reader emits square sets, not vectors | queue | |
| CLP-b1 | core-loop §9 d-1 | The same ruling, from the other side: **may a compare surface render the learner's own committed moves as arrows?** `design/05` form (c) has no producer. Layer 1 of the compare redesign depends on it | none | |

### Assistance-composition rulings

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| INR-b2 | in-run §8.4-2 | Is `structure_nudge` proactive or on-request? Recommendation: proactive marker, on-request content — the only reading under which §3a's silence and §3b's *"beautifully annoying"* both hold | none | |
| INR-b3 | in-run §8.4-3 | Which contexts may offer **Support**? Compatible with widening to `imported`; incompatible with `pack` and `campaign`, where withholding is the point | none | |
| INR-b4 | in-run §8.4-4 | Do the five preset labels and promises survive use? They ship `validation: "candidate"` | none | |
| SET-b1 | settings §10 OD1 | **Looks** — a named `(appTheme, boardTheme, pieceSet)` triple layer with a composed-card preview, three axis strips beneath, and *Custom* as a first-class honest state. Does a Look sit inside [[D982]] or layer above it? | ledger | |
| SET-b2 | settings §10 OD2 | Invert the single-mode fallback: **keep the chosen theme, move the mode.** Our fallback is the exact inverse of the file we copied it from | ledger | |
| SET-b3 | settings §10 OD3 | Should appearance follow the account? Today it is `localStorage` only, so a second device resets silently; changing it touches the export and deletion contract | ledger | 🏆 |
| SET-b4 | settings §10 OD4 | `design/03:294`'s Settings row lists feedback and evidence as a Settings family, against `design/05` §The config as amended on O4 | ledger | |
| SET-b5 | settings §10 OD5 | The app-theme roster — ten schemes exist in the owner's own registries and three ship; plus a second piece set and a `--warning` variant | ledger | |
| CMP-b2 | campaign §11 O-CAMP-5 | **`threat_radar` can be granted and can never turn on**, because campaign `allowedPresets` never include `support` — so the reward pool is eight, not ten. Widen campaign reachability to Support, or remove it from the pool | ledger | |
| CMP-b3 | campaign §0.3c | Choosing Analyze to use one earned module **silently removes four others**. Progression by playing is currently intersected with a dropdown | ledger | |

### The failure state and the campaign economy

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| CMP-b4 | campaign §7 / §11 O-CAMP-1 | **Does failing end a run, and where?** Six options costed (A no failure · B act boss ends the run · C run-scoped failure budget · D gets harder · D-inverse failure *lifts* suppression · E failing spends rewinds · F seals decide), plus the vocabulary problem: *"abandoned"* is not *"lost"* and two words are needed for two non-completed endings | ledger | 🏆 |
| CMP-b5 | campaign §7.6 / O-CAMP-2 | **What survives a run** — persist unlocks across runs, run-scoped (what ships), or catalogue-only. Independent of the above and cheaper | ledger | 🏆 |
| CMP-b6 | campaign §11 O-CAMP-3 | One pool or a per-act reset for earned rewinds. **The carry-forward pool prices early experimentation**, so the rational play is to experiment least where the product most wants it. May require inverting `CAMPAIGN_ECONOMY_MONOTONE` | ledger | 🏆 |
| CMP-b7 | campaign §11 O-CAMP-4 | Where the balance lives — the in-run coaching rail (where the RFC currently seats it, which teaches that the coach is metered) or the map plus the offer | ledger | |
| CMP-b8 | campaign §11 O-CAMP-7 | **Does the run accumulate help or lose it?** The unlock curve and the suppression curve are opposite felt experiences and both are being built without anyone noticing | ledger | |
| CMP-b9 | campaign §11 O-CAMP-8 | Is difficulty declared per document or chosen by the learner at run start? `actGrants` is per-**document**, so every learner of a campaign gets identical income and no per-learner generosity parameter exists | ledger | 🏆 |
| CMP-b10 | campaign §10 res-2/3/4 | Three open research questions answerable only by owner play: does a count budget preserve punishment-free experimentation; is a withheld module legible or merely frustrating; **is the loop worth wrapping** — which gates the whole build | ledger | |
| CLP-b2 | core-loop §10 d-1 | Does the earned-rewind counter appear during play, or only at earn-time and in the summary? | none | |
| CLP-b3 | core-loop §10 d-4 | [[D1313]]'s reveal-budget alternative — pricing *looking* rather than *retrying* — should be visible when R6 re-tables the numbers | none | |
| CLP-b4 | core-loop §4 numbers | The rewind economy's numeric values are owner-owned, not a research gap | rfcq | |

### The review tier, the grade and the fifth signal

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| ATR-b1 | after-run §8 d-1 | **The tier-2 budget.** O7.1's `0..3` applies to **doors** only; tier-1 notes are uncapped. That makes [[D1423]] derivable rather than chosen — a tier-2 moment is one where *Retry from here* means something | ledger | |
| ATR-b2 | after-run §8 d-2 | Adopt the decided-position grade suppression as a cited `decidedness` cell in `grade-convention@2` — we grade +4.67 → +2.67 a *mistake* where Lichess says nothing, and the ruled 2.5 floor makes it worse | wave3 #15 | |
| ATR-b3 | after-run §8 d-3 | **Re-cut the fifth signal as narrowness** — *"only one move held this"* — never *excellent*, never rating-conditioned. `BANNED_JUDGEMENTS` makes praise unsayable by construction while narrowness uses no banned word | ledger | |
| ATR-b4 | after-run §8 d-4 | Fund signal 1's per-node learner-side human-policy pass — entropy over the human-policy distribution, the owner's most-named detector, with no data behind it | ledger | |
| ATR-b5 | after-run §8 d-5 | May a categorical maturity word render on a due row? The dossier's position is (a): counted published events only | none | |
| ATR-b6 | after-run §8 d-6 / §1.4 | **[[D1151]]'s stated ground is false at HEAD** — `RatingScreen` ships a number about the learner. The conclusion may stand; the ground does not. Restate it or accept the refusal is narrower than its wording | ledger | 🏆 |
| ATR-b7 | after-run §8 d-7 | Does a Yusupov-style pack-scoped pass mark join the act-end screen? Admissible only as an authored pack property or a prestige input, and it must never gate map advance | ledger | |
| ATR-b8 | after-run §3.4 | The nine-rung declared priority list with an abs-ΔWin%-then-ply tiebreak, published in the surface's help — offered to O7.2's ruling on admissible families, not asserted | none | |
| CLP-b5 | core-loop §10 d-2 | **Is it stated that the reveal window survives a rewind, contaminating the retry?** Disclosure semantics are intent tier | none | |
| CLP-b6 | core-loop §10 d-3 / §6 D2 | Do we ship personas over bands, and add rungs? Measurement licenses five to nine honest rungs and four ship | ledger | 🏆 |
| CLP-b7 | core-loop §10 d-5 | Does optional pre-commit intent capture belong in rehearsal at all? It adds friction to the most frequent interaction | none | |
| CLP-b8 | core-loop §3 P3 | Rename the exit — *"I've seen enough — take me back"*, not Resign or Undo. Is **"declare done"** a first-class run verb, or only an encounter word (`design/06:580`)? | none | 🏆 |

### Live, viewer scope and the public pool

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| LIV-b1 | live-social §13 Q1 | **Where does the explanation contract live**, and is *"it never speaks about the board"* confirmed? Five answers — what this is · who can see it · what they see · what is recorded · what it refuses — at three moments. Nine further items in that dossier are downstream of this one ruling | ledger | |
| LIV-b2 | live-social §13 Q2 | **Is there an anonymous live viewer, or does `design/03:83,:90` need rewording?** There is no viewer scope at all: `public_tokens.scope` is `CHECK (scope IN ('story_read'))` — one value — on a `STRICT` table | ledger | 🏆 |
| LIV-b3 | live-social §4 C1 | The `live_view` token scope itself: run-scoped, host-minted, revocable, capped, expiring; renders `casting.md` §5's closed seven-item list and nothing else; must not throw `SOURCE_GAME_LIVE` for a rehearsal run; visible and countable by the host | none | 🏆 |
| LIV-b4 | live-social §4 C2 | Viewer-side vote casting plus a **third voter class** (link viewer, unverifiable) | ledger | 🏆 |
| LIV-b5 | live-social §13 Q3 | **The public matchmaking pool** — explicitly not ruled by [[D1414]]. Branch B needs a seek queue with an honest empty, a report flow, symmetric block/mute in the pairing predicate, a moderation queue someone must read (colliding with `design/02:98-99`), and a population with a bench | ledger | 🏆 |
| LIV-b6 | live-social §8-A2 | Even Branch A has no way to discover another learner: no directory route, no handle search, handles known only out of band | none | 🏆 |
| LIV-b7 | live-social §8-B6 | The human anchor experiment: a pool would run it continuously, or we import externally-rated league games instead. `learner-rating` R7 stands until it runs | ledger | 🏆 |
| LIV-b8 | live-social §13 Q4 | **Does Academy have an identity, or should the option be withdrawn?** It cannot answer question 1 of the explanation contract | ledger | |
| LIV-b9 | live-social §13 Q5 | **Who owns resignation and agreed draw?** `enforced-clocks` explicitly does not claim them; `clock.flagged` is designed as a run event and `terminal_reason` needs a `CHECK` rebuild | queue | 🏆 |
| LIV-b10 | live-social §13 Q6 | Does a **self-updating surface** need a `design/05` clause? A ticking clock and a self-updating followed board are the same new element class and nothing in the sixteen-state composition self-changes | none | 🏆 |
| LIV-b11 | live-social §12-6 | `design/03:87-88`'s *"team relays"* ambiguity is undischarged, owner-tier, and **has now cost three agents** | ledger | 🏆 |

### Classroom, cohort and the operator capability

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| TCH-b2 | teacher §7.3a / §11 D-B | **Cohort read symmetry.** A member who publishes nothing still reads everything, which produces a selection gradient in which declining is legible. Cheap middle option: render the denominator — *"6 of 14 published"*, a count, not a judgement | queue | 🏆 |
| TCH-b3 | teacher §11 D-C | Is the absence of a text channel a **posture or a gap**? Zero repo-wide hits for `chat`. If a gap, it is a real feature with moderation consequences and a lane | ledger | 🏆 |
| TCH-b4 | teacher §11 D-D / §10 | Add to `design/02`: **a teacher is not a privileged user; teaching authority is a relation between two accounts, bounded to one classroom, endable by either side** | ledger | 🏆 |
| TCH-b5 | teacher §9 obj-2 | **The declared result** — forfeit, default, adjudicated draw. It collides head-on with `teacher-surface`'s *"a submission is received, never marked"* and its counts-only rule, so it is a ruling, not a design choice | ledger | 🏆 |
| TCH-b6 | teacher §9 obj-1 | **The round/pairing aggregate** — an assignment addresses a *pack*; nothing in the product addresses an *opponent* | ledger | 🏆 |
| TCH-b7 | teacher §9 | Close the account half of [[D1416]] by citation (`design/02:98-99` refuses the account form on its own terms) and re-home the deferral as those two objects | ledger | 🏆 |
| TCH-b8 | teacher §8 | O11 fork A1 gains a user-side argument: an inspector in an academy session is a phone under the desk | rfcq | |

### Intent-tier sentences that are false, and gate rows that outran the client

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| ARR-b6 | arrival §10 GAP 1 | `design/03` §Learn and return promises phase as *"first-class navigation and filters"* and **B7 is recorded shipped**. `phase` appears in the client exactly twice, both as static text. A gate-row correction | ledger | |
| ARR-b7 | arrival §10 GAP 3 | `design/03` §Stable application shell's Home row promises *"quick start"*, which has never been defined or built | none | |
| IMP-b6 | import §7 GAP 1 | `design/03:330`'s B8 residual is **false in both halves** — export landed, and unshared runs hard-delete | ledger | |
| IMP-b7 | import §7 GAP 2 | `design/02:100`'s *"`__legacy` reassignment"* is falsified by shipped code, outstanding since 2026-08-23 and now flagged three times without repair | ledger | |
| IMP-b8 | import §10.6 | The design tier's account of anonymous access is **two RFC amendments behind the code** | ledger | 🏆 |
| IMP-b9 | import §10.2 | Rule the **twelve learner-facing data-class labels** rather than let an implementer draft product prose adjacent to `design/02`'s adoption posture | ledger | |
| IMP-b10 | import §10.3 | How far does *"import is a capability"* permit the username path? Listing a public archive is legal; automatic selection sits on the edge of the rejected v1 identity | ledger | |
| TCH-b9 | teacher §11 intent-1 | `design/03`'s *"Arena and events"* row claims team relays that never shipped **and omits classroom, assignment and standing — three shipped surfaces it does not describe** | ledger | 🏆 |
| TCH-b10 | teacher §11 intent-2 | `design/05:199`'s parenthetical *"`drawable: enabled false`"* is stale — HEAD sets it true | none | |
| AUT-b3 | authoring §12 | Four `design/03`–`design/04` gaps: Create's *imports* destination is wrong or its placement is; Library promises five destinations with no record types; **B6's correction says distillation does not exist and it ships at HEAD**; and `design/04`'s pipeline still ends *"review → publish"* while two owner rulings split F4/F5 | ledger | |
| AUT-b4 | authoring §12 / §13 d-1 | **Does population C — the community author — exist as product intent, or is `/create` a first-party instrument?** `design/04` §8's production model has no population C, and every other authoring decision depends on this one | ledger | 🏆 |
| AUT-b5 | authoring §13 d-2 | Ship a principles browse surface while all thirteen self-declare `standsOn: authors_practice`? | ledger | |
| AUT-b6 | authoring §13 d-4 | Is a board in the authoring surface funded, against the stated low-level posture? Six lint error classes become unconstructible if it is | ledger | |
| AUT-b7 | authoring §13 d-5 / §8 F4 | **The owner-review instrument**, required by three rulings, with zero instrument and **0.0% of 1,434 measured minutes** spent on review | ledger | |
| CMP-b11 | campaign §1.6c | [[D1445]]'s campaign consequence: the progression currency is a **set, not an ordered ladder**. Whatever fixes D1445 decides ladder-or-set | ledger | |
| A11-b1 | a11y §5 Q1 | Does the phone get one region at a time, and **may the drawer cover the board**? It covers ~42% of it today | ledger | |
| A11-b2 | a11y §5 Q2 | **What is the minimum supported viewport and what happens below it?** Three priced options. The refusal's own 24px rationale supports a floor ~1.7× smaller, and the refusal is a product promise | ledger | 🏆 |
| A11-b3 | a11y §5 Q3 | Is portrait-only the phone posture? The manifest declares no orientation, and every phone in landscape is refused *and misclassified as a tablet* | ledger | 🏆 |
| A11-b4 | a11y §5 Q4 | Does the assistive layer get a **rung-0 query vocabulary** — around-this-square, captures, piece-type jump? All are rung-0-legal; [[D659]]'s inheritance rule bounds it | ledger | |
| A11-b5 | a11y §5 Q5 | Is there an Accessibility settings family, and does it include a **high-contrast board skin**? `design/03:294` names the family and nothing implements it. The two board skins are 1.58:1 and 1.99:1 internally, so the paints carry the whole signal | ledger | |
| A11-b6 | a11y §5 Q6 / §3.4 C | **Does board semantic paint carry a second luminance/greyscale floor alongside ΔE?** `last-move` passes at ΔE 36.3 while measuring **1.02:1 luminance** — a greyscale distance of 3 out of 441 | ledger | |
| OPP-b10 | opponents §6 cost-3 | Feature-grounded miss explanations need the Stage-B `features` binding, which is Discharge D4 and owner-owned | ledger | |
| A11-b7 | a11y §3.7 dev-* | The five refused device classes as separate decisions under Q2: iPhone SE (fails the height floor by 13px) · iPhone 12/13/14 · iPhone 15/16 Pro · Galaxy Fold closed · **1280px desktop at 400% zoom, which is a WCAG Reflow failure by construction** | ledger | 🏆 |

---

## (c) BLOCKED ON AN RFC — 97 items

RFC status read from `rfc/README.md` at HEAD.

### `rfc/module-registration.md` — **draft 2026-08-24**

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| INR-c1 | in-run §1.1 | One door labelled with the learner's question, and **the nine producer buttons deleted from ordinary view** | queue | |
| INR-c2 | in-run §5.2 | Replace every producer-shaped honest empty (*"No human-model page loaded"* is a network status leaking into a chess surface) with its declared replacement | queue | |
| INR-c3 | in-run §5.1 | Make the three empty classes — `silent` / `stated_absence` / `unavailable_source` — distinguishable without knowing our architecture | none | |
| INR-c4 | in-run §6.2 | Generalise the post-commit guard card's shape (frame · grounds · preservation promise · two verbs) to **every** post-commit delivery | none | |
| INR-c5 | in-run §6.4 | The one-interrupter rule: exactly one thing may claim attention unasked at a commitment, and it is never a grade of an alternative | none | |
| INR-c6 | in-run §1.3 | The durable record of *which* hint stage a learner asked for (Discharge D5) — not recomputable | none | |
| ATR-c1 | after-run §1.5 / §7 | **`ModuleAnswerCeiling` has no `evaluation` member**, so the ruled move-quality grade has no admissible module and every grade recommendation in that dossier is inert | queue | |

### `rfc/evidence-presentation.md` — **draft 2026-08-24**

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| INR-c7 | in-run §4.1 | `distribution` and `outcome_split` replace the comma-joined string and the `"Nf3 31%"` sentences | none | |
| INR-c8 | in-run §4.1 | **`magnitude_trail`** — the product's first real chart, and the component that answers *where did it turn?* | none | |
| INR-c9 | in-run §4.2 | `Convention` renders **inside** the component's box, never as a sibling, heading, `title` or droppable caption | none | |
| INR-c10 | in-run §4.4 / §5.4 | Fixed seat size, rotating content; never a spinner, a skeleton or a shrinking seat | none | |
| INR-c11 | in-run §4.5 | Four of that RFC's five open questions answered from the learner's side: `distribution` never draws on the board; `outcome_split` uses `side_to_move` with colour names always visible; `claim`'s counter-case is always shown for `author_declared`; `full_inspector` uses components at widest budgets **and keeps the raw view reachable** | none | |
| CLP-c1 | core-loop §7.2 L4 / §12 rec 8 | `magnitude_trail` with real SVG, a stated extent, a zero reference, keyboard-reachable points and a table — replacing the row of identical `●` characters | ledger | |
| CLP-c2 | core-loop §1.3 / §12 rec 7 | Mid-run compare renders `abstention`, not an empty box. Today `comparisonWithoutEngineFeedback` blanks it and **nothing on screen says why**, so a withheld comparison looks like a broken one | ledger | |
| CLP-c3 | core-loop §12 rec 3 / §6 D3 | Render `BranchConsequence.resistance` as every comparison's **convention** — two branches played against different resistance are compared as if they were not, on the surface whose whole purpose is replay under different resistance | ledger | |
| CLP-c4 | core-loop §12 rec 6 | `enum_state` over a total label registry for the compare and rail vocabularies; stop re-deriving `outcome` by rescanning `run.events` | ledger | |
| CLP-c5 | core-loop §5 B4 | Retire the rail's bookkeeping header; show the attempts and which one you are in | none | |

### `rfc/hint-distance.md` — **draft rebuilt 2026-08-26; awaiting independent buildability review**

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| INR-c12 | in-run §2.1 | **The rung is the request, not a setting** — it advances on each request within a decision and resets at the next commitment, with the config field acting as a *ceiling* rather than a starting point | ledger | |
| INR-c13 | in-run §2.2 | Each rung states what the next one would add, before you ask for it (*"Name the piece"*, then *"Say how far away"*) | none | |
| INR-c14 | in-run §2.4 | Rung 0 (`pattern`) is the default first press and should be generous | none | |

### `rfc/bot-roster.md` — **draft 2026-08-23**

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| OPP-c1 | opponents §2 | **The honest bot card, registers 1 and 3** — mechanism-as-consequence plus the six declared-absence rows. Every sentence is already drafted in that RFC's §4 and §7 | ledger | 🏆 |
| OPP-c2 | opponents §2 reg-2 | Register 2, a measured rate with its denominator. Only `pawn_move` ×4 has ever cleared the gate; the rest needs obligation B, because **nothing populates `candidate.traits`** | ledger | |
| OPP-c3 | opponents §1 rec-3 / cost-3 | Family and band as two controls, orthogonal by measurement (346.8 Elo across rungs vs 1.36 cp and 1.01 cp for guard and trait). **Family A's four profiles have zero blockers by the RFC's own criterion 10** | ledger | |
| OPP-c4 | opponents §1 cost-4 / §8.1c | All twelve profiles are blocked on obligations A and B — `searchBound` admitting `depth`, and a candidate-classifier registry | ledger | |
| OPP-c5 | opponents §6 rec-4 | *"This opponent cannot hand you a piece"* — the guard truncates the tail at 250 cp | ledger | |
| OPP-c6 | opponents §7 rec-1/-2 | Attach the record and the marks to a **name**: `Band 1400` becomes `Wren · band 1400 · guarded`, with a per-bot page carrying card, head-to-head record, observed traits and a rematch button | ledger | 🏆 |
| OPP-c7 | opponents §8.2a | The bot-Elo run is fully specified — 12,400 games, 16 arms, C1/C2/N controls, ≈4–5 h, [[D341]] seeding mandatory — and its **third caveat is that it will not price personality**: paired arms return an upper bound and must be reported as one | ledger | |
| OPP-c8 | opponents §0.3 | Seven-layer grammar, twelve profiles, twelve names and a passing route source, and **`composeBotPolicySelection` has no production caller** | ledger | |

### `rfc/bot-policy.md` (implementing) / `rfc/bot-roster.md` — the provenance amendment

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| OPP-c9 | opponents §5.3 | **Replace the persona word-filter with a provenance rule**: every card sentence carries the id of the layer or measurement it restates, and a sentence with no id does not render. It generalises the guard's existing rule that a disclosure omitting `depth`, `8` or `250` fails compilation | ledger | 🏆 |
| OPP-c10 | opponents §5.3a | `REFUSED_PERSONA_CLAIM`'s **false negatives**: *"she likes to keep the position closed and grind"* passes eight banned adjectives and is an unmeasured chess claim | ledger | |
| OPP-c11 | opponents §5.3b | Its **false positives**: a bot named *Solid* fails compilation. It is vocabulary policing where claim checking is wanted | none | |
| OPP-c12 | opponents §5.1 | O8.2's three categories as three visually distinct zones, each carrying a different proof obligation | none | |

### `rfc/campaign-core.md` — **implementing 2026-08-23**, behind two migrations

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| CMP-c1 | campaign §4.3a | **No mid-run state persists at all** — no charge, unlock, seal or active pointer — until the `longitudinal-store` and `bot-policy` migrations land ahead of campaign-core's fifth position | queue | 🏆 |
| CMP-c2 | campaign §4.3b | Resume returns to the **map**, not the board; `GET /campaigns/active` is specified and unbuilt | queue | |
| CMP-c3 | campaign §9.3a | The active run comes first on the home surface, stating its remainder in positions and plies | none | |
| CMP-c4 | campaign §9.3d | `CAMPAIGN_RUN_ACTIVE_EXISTS`'s user text should offer resume or abandon, not report a conflict | none | |
| CMP-c5 | campaign §3.3a | The node card states the reward's **effect and reachability**, not its module id — and the card vocabulary is a closed list, so widening it is a spec change | ledger | |
| CMP-c6 | campaign §7.7-4 | *"This node can end your run"* cannot be said today: the node-card vocabulary is closed and has no way to disclose it | ledger | 🏆 |
| CMP-c7 | campaign §6 R2 | The earn moment needs a `submit` endpoint that is unbuilt | none | |
| CMP-c8 | campaign §6.4 cost-6 | Enforcement is blocked: `RunService.#campaignCharge` does not exist and no charge is persisted | queue | 🏆 |
| CMP-c9 | campaign §1.1 | **The only shipped campaign sentence** (`RatingScreen.svelte:160`) promises rated campaign entry — the most deferred feature in the lane — and its Discharge D1 is blocked on `learner-rating` plus persona/targetElo disjointness | ledger | 🏆 |
| CMP-c10 | campaign §0.3d | The build space is *"pick one of four presets"*, not the design's 278,256 loadouts — Deviation 4 dropped the loadout from v1 | ledger | |
| CMP-c11 | campaign §5.3a | The demonstrated unlock — render the earned module's grounded output against the position that just ended | ledger | |
| CMP-c12 | campaign §4.3d | Four encounter kinds get verb headlines (*play it out · guess · last · play a game*), which needs `training-mode-variants` to widen `encounter.kind` | rfcq | |
| CMP-c13 | campaign §2.4-2 | The ply envelope on the start screen needs `training-mode-variants` §5.3's total arithmetic | rfcq | |
| CMP-c14 | campaign §3.3b | The difficulty-availability label's fourth ground — a human-outcome `DecidednessGround` — **does not exist**, so Act I's label has no producer | ledger | |
| ATR-c2 | after-run §4.3 | The act-end screen as a **catalogue diff** — shapes met, structures played, modules unlocked — naming content and never the learner, with the catalogue as a shown denominator and every entry reopening its own evidence | ledger | |
| ATR-c3 | after-run §4.3 prereq | It must ship over the 25-entry shape library with the `concepts` axis rendered honestly absent: [[D300]]'s bounded naming job is a prerequisite, not a footnote (132 of 156 concepts are singletons) | ledger | |
| ATR-c4 | after-run §5.3 | The campaign strip states the **income rule** beside the balance, `CAMPAIGN_REWIND_EXHAUSTED` names the next income event rather than the shortage, and the first spend is disclosed at the moment it costs | ledger | |

### `rfc/review-map.md` — **draft, blocked** ([[D1409]]/[[D1419]] block acceptance)

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| ATR-c5 | after-run §3.1/§3.8-1 | The move list — every ply, clickable, live board — one new screen object | ledger | |
| ATR-c6 | after-run §3.8-2 | Tier-1 note rendering: one renderer per admitted family into the row, under the frozen-template table | ledger | |
| ATR-c7 | after-run §3.8-4 | The whole-game selector (~1 function; the families exist in `story.ts`) | ledger | |
| ATR-c8 | after-run §2.3-1 | The objective verdict as a sentence, with honest absence where nothing was authored | ledger | |
| ATR-c9 | after-run §2.3-2 | Exactly one turning-point moment on the terminal sheet, with board, reason and door | ledger | |
| ATR-c10 | after-run §7-4 | **Game review has no home in the intent tier** — `design/03`'s Review area is branch-compare | ledger | |
| ATR-c11 | after-run §7-3 | Law 8 on this surface: `voiceCheck` must bind judgement words to grounding sentences, and `plan`/`initiative`/`compensation`/`pressure` are in no list | ledger | |
| CLP-c6 | core-loop §1.3 / §8 / §12 rec 10 | **A compare door on the review surface.** The core loop runs five-sixths of a circle and both dead handoffs are at the end | ledger | |

### `rfc/return-scheduling.md` — **draft 2026-08-23**

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| ATR-c12 | after-run §6.3 ladder | **The shipped scheduling ladder diverges from its accepted RFC on five of eight histories.** Nothing on the return surface is trustworthy until it lands | ledger | 🏆 |
| ATR-c13 | after-run §6.3-1 | The offer names the **variation**, not the count; `schedules.variant` is written as a literal `NULL` | ledger | |
| ATR-c14 | after-run §2.3-4 | One line on the terminal sheet about coming back, naming the already-computed `due_at` — **our only outbound channel** | ledger | |
| ATR-c15 | after-run §6.3 vacation | Bounded intake on return: ask which occasions they cannot make; price lateness, not absence | ledger | 🏆 |

### `rfc/move-quality-grades.md` — **implementing**, amendment owed

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| INR-c15 | in-run §6.3 | The grade rendered **at commit, post-commit**, with the word, the numbers, the threshold crossed and the convention version co-rendered always | ledger | |
| ATR-c16 | after-run §1.6 / §3.8-5 | Six shipped ladder constants against the ruled single `2.5/10/15`; the amendment **inverts acceptance criterion 4** | ledger | |
| ATR-c17 | after-run §3.4-2 | Blunders via the ladder need coverage that does not exist: 20/20 opening, **0/27 middlegame and endgame** | ledger | |
| ATR-c18 | after-run §2.1-2 | Accuracy cannot render at all: 0/13 middlegame and 0/14 endgame consecutive-eval coverage, and §6 gates accuracy on full coverage | ledger | |
| ATR-c19 | after-run §3.3 normative-1 | Tier 1 is **not** a summary of tier 2 — a note is a complete grounded sentence with its operands, and F-COR-1 is permanently red until it is | ledger | |

### Selection (F2/F5), `rfc/tactical-collectors.md`, `rfc/theming.md`, `rfc/play-composition.md` and others

| id | § | what it is | queued? | 🏆 |
|---|---|---|---|---|
| CLP-c7 | core-loop §7.3 / §1.2 d11 | **The positional diff is selection-blocked, not presentation-blocked.** The difference strip fires on 97.3% of plies at 1.017× lift — a difference present at 97% of plies is the weather. Layer 3 ships only when a selector bounds it to ~2 marks | ledger | |
| CLP-c8 | core-loop §7.2 L3 | Layer 3 itself: one board, one branch as base, the other's positional differences marked as squares, one fact per overlay | ledger | |
| ATR-c20 | after-run §1.7 / §3.8-9 | The review lane inherits the same density problem: the strip fires 633/634 at 8.31 entries per ply, lift ≈1.01×, median 36 differing observations per pair | ledger | |
| INR-c16 | in-run §3.1 | One gesture, one fact, both directions — the direct repair of the measured 11 captions / 19 marks / 9 squares from a single square selection | none | |
| ATR-c21 | after-run §3.4-4 | Tactical families are research- and inspector-only at landing; none is unconditionally admitted (A3/O2 bar) | rfcq | |
| SET-c1 | settings §2.3b / §8.4-5 | Drive `interaction-paint.css` from tokens — it contains **zero `var()`**, fifteen literals in a file the RFC calls token-driven, and criterion 6's byte-identity test **cannot see it** | ledger | |
| SET-c2 | settings §8.2e | The motion vocabulary is one item, and the felt-quality pass (Discharge D5) is load-bearing for the whole product | ledger | |
| SET-c3 | settings §2.3d | Promote the on-board Appearance link to a dasher-style menu carrying three live strips (that RFC's open question 2) | ledger | |
| A11-c1 | a11y §7 res-limit | **No screen reader has ever been used against this product** — Discharge D3 is unrun and owner validation is the designated proof. Third document to say so | ledger | |
| CLP-c9 | core-loop §3 P2 | The honest target as the headline (*being worse is the premise, not the failure*) — strong form blocked by **B4**, which needs authored vocabulary | ledger | |
| ARR-c1 | arrival §8.3 F3 | The same at the arrival surface: an Outcome pack opening with *"This is drawn with correct defence. Hold it."* needs the authored assertion **and its label** | ledger | |
| CLP-c10 | core-loop §7.4-2 | Narrating plans from the learner's own `intent` string needs Q4b feature-level predicates that **do not exist** | ledger | |
| OPP-c13 | opponents §6 rec-1/-2 | **The bot's own decision record as a surface** — the one legal dashboard in this product, because its subject is the machine. `BotPolicyDecisionRecord` exists and is **not persisted**; the surface rides run-schema lane 0.18 | ledger | 🏆 |
| OPP-c14 | opponents §8.1a | The non-Maia, variant-portable base: `evidence-move-selector` is funded, both heads were returned, and the composition does not yet replicate | rfcq | |
| LIV-c1 | live-social §Verdict V-6 / §11-f | **`live-following` criterion 12's grep fence** — the scope clause says *"introduced by this RFC's implementation"* while the instrument greps the whole tree. Ruled today by [[D1513]]: narrow the instrument to the diff. Until it lands, the casting screen is *illegal*, not unbuilt | queue | 🏆 |
| LIV-c2 | live-social §5 D1–D4 | Broadcast following: the discovery list, round and board grid from the measured unauthenticated Lichess index; the no-evaluation-while-live lock as the loudest promise; a user-facing name and stated ply for *"cut"*; and one **Cast this** action from a followed board | rfcq | 🏆 |
| LIV-c3 | live-social §5 cost | That lane is acceptance-blocked: two acceptance-blocking questions, an unmeasured revise-an-earlier-ply prerequisite, and a 30–60 minute stream-diff harness that has never been run | rfcq | |
| LIV-c4 | live-social §7 F3 / §12-1 | The honest terms label becomes a **projection** of accepted terms — a five-row table, not a constant. [[D1414]] falsifies `social-play` §5's fixed casual line and overturns its §8 refusal 2 | queue | 🏆 |
| LIV-c5 | live-social §7 F4 / §11-10 | Clocks, resign, agreed draw and flag. `flag` is solvable as a `clock.flagged` run event; **resign and agreed draw have no owner**; the clock must run with the tab closed; `terminal_reason`'s `CHECK` needs a rebuild | queue | 🏆 |
| LIV-c6 | live-social §11-m | `enforced-clocks` is queued **behind blocked `live-following`** in the migration chain | rfcq | 🏆 |
| LIV-c7 | live-social §3 cost | Casting a *followed* game is blocked: `sourceGameLive` has zero matches, so the liveness guard is unbuilt | rfcq | 🏆 |
| AUT-c1 | authoring §7 E2 | Close `provenance.attribution` to `{title, author, licence}` as the shape and principle schemas already do — a format change, RFC-gated, fenced by the content hold | rfcq | 🏆 |
| AUT-c2 | authoring §9 G4 | Add `triggerNote` so a shape can record why its trigger says what it says | rfcq | |
| AUT-c3 | authoring §8 F2/F3 | A typed graduation-condition vocabulary with a picker, plus the corpus-level blocker view — a format change and a migration of 205 ids | rfcq | 🏆 |
| AUT-c4 | authoring §7 E5 | The per-claim citation deadlock: `pack-population-provenance` is accepted and unimplemented while `claim-semantic-anchors` is a blocked draft | rfcq | |
| AUT-c5 | authoring §10.5 H4/H5 | Principles render `standsOn` and `counterCase` on the card face **or do not ship**; and the page must state that theory lives inside packs, because no theory record type exists | ledger | |
| AUT-c6 | authoring §10.5 H3 | The *"packs that rehearse this"* door is computed server-side and needs [[D693]]'s relation fix, excluding prospective links | ledger | |
| TCH-c1 | teacher §7.2-1 | The rating-cell fault sits under `learner-rating` §10a.3, which requires the field to be **absent** rather than empty | rfcq | |
| ATR-c22 | after-run §1.4-1 | The frozen-template table's scope does not cover rating surfaces, which is why two `band()` formatters can disagree | ledger | |
| IMP-c1 | import §2.3-6 | Extending `live-sources`' third-party-annotation assertion to the **paste** path, which it does not currently cover | ledger | |
| CMP-c15 | campaign §10 res-8 | The six failure-state options are not costed in engineering terms; that belongs to campaign-core's successor amendment | ledger | |

---
## (d) ALREADY DONE AT HEAD — 38 items

Verified in this pass at `0d347288`. Several are things a dossier records as missing.

| id | § | what it is | evidence at HEAD |
|---|---|---|---|
| INR-d1 | in-run §3.3 | **Learner-drawn marks are already on.** The dossier records *"shipped state is `drawable: { enabled: false }`"*; that is the component's default prop. `DrillScreen.svelte:890` passes `drawingEnabled={previewNodeId === undefined}` and `Chessboard.svelte:135` binds it, with `onMarksChange` wired | verified; only *persistence across a rewind* remains undecided |
| ARR-d1 | arrival §0.1 | [[D484]]'s clause *"a new user gets a board with no legal-move highlighting"* is stale — `SILENT_ASSISTANCE.boardLighting` is `"legal"` | `packages/runtime/src/assistance.ts:18` |
| ARR-d2 | arrival §0.1 | `planning/ux-work-lane.md` Q4 is taken: `PROFILE_DEFAULTS.onramp` ships `guided: "live"` | `assistance-preference.ts:13` |
| A11-d1 | a11y §3.8 | **A `<main>` landmark exists on every route.** `App.svelte` emits 17 of them. The real defect is narrower: `ShellFrame`'s `.shell-content` is a plain div and the skip link points at the nav | verified; see the correction in §What a dossier got wrong |
| A11-d2 | a11y §3.2 | Keyboard board input is proved wire-equivalent to pointer — 90/90 live click/drag/touch cells across five viewports, up from 4/90, with a permanent browser gate | `interaction-state-correctness.md` |
| A11-d3 | a11y §3.2 | The `g`-chord navigation, `?` help, Escape-closes-and-restores-focus on the help dialog, `.status`'s `clip-path` pattern, and the viewport meta with no `maximum-scale` are all correct and should be copied, not rebuilt | |
| A11-d4 | a11y §2.3 | Our text-move fallback is available to **all** users rather than screen-reader-sniffed — ahead of the field; keep it and say so | |
| LIV-d1 | live-social §7 F5 | The seated-player assistance asymmetry (F5) **does not exist**: `seatedInContest` is production code and the case is closed. The real residual is a **non-seated host**, which is narrower and different | [[D1518]] retired it today; `seatedInContest` has zero non-test hits because the mechanism moved |
| LIV-d2 | live-social §7 F6 | `countable: false` forcing on native matches is already ruled | [[D1415]], [[D1348]] |
| LIV-d3 | live-social §3 B3b | The vote delay is already ruled owner-configurable | [[D1291]] — the *interface* is unbuilt (that is LIV-b4) |
| CLP-d1 | core-loop §1.1 | Five things to protect through any redesign: the compare heading *"Same decision, two consequences."*; the fork modal's *"What are you testing?"* (nothing in the corpus asks it); the comparison payload never ranking or recommending; `HonestControl`'s inline disabled-reason pattern; and review re-entry already forking correctly with no one-ply puzzle | |
| CLP-d2 | core-loop §2 | The confirm-move *"Are you certain?"* step is already refused and ledgered as the post-commit guard | |
| ATR-d1 | after-run §1.2 | The story re-entry door is real and differentiating: it rewinds to `entryNodeId` and forks `story-reentry`, disabled until `story.ready` | |
| ATR-d2 | after-run §1.1 | Two shipped sentences to protect: *"Not perfect play."* and *"end of this drill, not a proof"* | a redesign will delete them by accident |
| ATR-d3 | after-run §3.2 | Our grade is validated against Lichess output at **952/956 = 99.6% exact agreement** | [[D1420]] |
| ATR-d4 | after-run §3.4-5 | Phase transition already ships with declared abstention — `phase_change` and `endgame_entry` emit | |
| ATR-d5 | after-run §1.2 | The shipped `rank` is already a declared categorical selector, honest as a presentation convention | §3.7 builds on it rather than replacing it |
| TCH-d1 | teacher §7.1 | The 2026-08-16 R10 reversal is fully implemented in `CohortStanding.svelte`: self-created entries only (enforced by the **absence** of a `handle` parameter on every op), confirmation before publish, permanent unwitnessed-games limitation, `show_rating` off by default, ordering by game points never rating, no evaluative copy | |
| TCH-d2 | teacher §6.2 | **There must be no teacher review screen** — a coach uses the learner's own components. A design commitment already honoured | |
| TCH-d3 | teacher §1 | Peer visibility as a bounded table was already ruled by the owner 2026-08-16 | |
| IMP-d1 | import §1 | The deletion preview is a digest-pinned consent artifact under `BEGIN IMMEDIATE`, and `AC38ATA_INVENTORY` is enforced by `assertAccountDataInventory` at startup so it **cannot drift**. Build on it; do not replace it | verified: the inventory ships, `planDeletion` computes the counts |
| IMP-d2 | import §5.4iv | Export and deletion disclosure is already correct and should be left alone | |
| IMP-d3 | import §2.1-5 | Nobody is required to import, and non-importers are not crippled — the rejected-list constraint is honoured | |
| CMP-d1 | campaign §7.4i | *Can a node be failed* — already yes, `verdict: "failed"` ships and is reachable | |
| CMP-d2 | campaign §7.4iv | *Which branch seals* is already ruled (b), the branch you submit, at `design/06:558-564` — it prices committing, not retrying | |
| CMP-d3 | campaign §7.6c | *Catalogue persists, inventory does not* is the one option already ruled | [[D1151]] |
| CMP-d4 | campaign §8.3a | **The band dial is live, not inert** — closed 2026-08-15 by `0985fa4` and verified against a real Maia engine | [[D91]]; `roguelike-run-design.md` rank 8 / requirement 5 is stale |
| OPP-d1 | opponents §8.1e/f | Two knobs already work and are measured: `trait.pawn_preference@1` (+12.28 pp, −1.01 cp) and strength (four rungs, 346.8 Elo, orthogonal to family) | |
| OPP-d2 | opponents §8.2f | Learner rating is deliberately asymmetric — Glicko-2 over their own games, voids never delete, ≤10 pieces admits no update at any RD | specified and correct |
| OPP-d3 | opponents §9.1 | Four confirmations of standing rows: [[D1087]] (the catalog is a literal empty array — verified at `bot-policy-catalog.ts:299`), [[D1181]] (two unledgered blockers explain it), [[D561]] (the grammar exists; instances and surface do not), and the identity-bar absence (`avatar` occurs zero times) | |
| AUT-d1 | authoring §1.4 | Five things to protect in the studio: honest disabled reasons via `aria-describedby`; the retention warning before registration; *Save & playtest* opening a server-configured real run; the server-derived unforgeable channel; and the shape editor's law-8 honesty line | |
| AUT-d2 | authoring §10.4 | Library search is decided — exact plus FTS; semantic retrieval is already refused for 1.0 | [[D564]] |
| AUT-d3 | authoring §8 F5 / §2 | Do **not** build a community-pack review queue or a course marketplace — already ruled at `docs/pack-graduation.md:42` | |
| INR-d2 | in-run §7 | The feel of making a move is measured good: 90/90 after repair, with fifteen `board-input.ts` announcement strings protected verbatim by A12 | |
| INR-d3 | in-run §8.3 | `rfc/module-registration.md` §2.3a already repairs [[D1445]] **in draft** — the eight-token monotone chain adds `evaluation` and gives `postcommit_nudge` that ceiling | the repair exists; the draft has not landed |
| ARR-d3 | arrival §6.3 D4 | The opponent choice belongs beside the preset, not inside it — already ruled by `intent-presets` §8.1 and adopted rather than reopened | |
| SET-d1 | settings §6A-5 / §6B-3 / §6C-1 | Three things already right: account sign-out / download / delete; side in the flow; and light-vs-dark absent an override applying live with no reload | |
| SET-d2 | settings §1-h | Appearance applies live and says so; inherited palettes publish their measured sub-AA pairs | keep |
| ATR-a1 | after-run §1.1 | Resume failures use the same recovery copy as in-session mutations; raw terminal node ids no longer escape | implemented 2026-08-24; controller regression |
| ATR-a2 | after-run §1.2 | Story evaluations name White's perspective and render pawn units rather than raw centipawn integers | implemented 2026-08-24; copy regression |
| ATR-a4 | after-run §1.2 | Story moment kinds use an exhaustive learner vocabulary rather than underscore substitution | implemented 2026-08-24; copy regression |
| ATR-a7 | after-run §1.3 | Attempt verdicts render objective meaning rather than the `AttemptVerdict` enum | implemented 2026-08-24; copy regression |
| ATR-a8 | after-run §1.3 | Explorer population metadata renders as a readable source/rating/speed/date disclosure instead of JSON | implemented 2026-08-24; copy regression |
| ATR-a9 | after-run §1.4 | Rating and cohort surfaces share one point and interval formatter | implemented 2026-08-24; copy regression |
| CLP-a4 | core-loop §1.2 d10 / §12 rec 13 | Piece routes retain occupant identity across captures and special moves, and label the piece rather than its origin square | implemented 2026-08-24; capture-chain regression |
| OPP-a2 | opponents §0.1c / §3 rec-3 | Requested and applied resistance use a complete learner vocabulary; internal mode ids do not render | implemented 2026-08-24; all modes covered |

---

## (e) SUPERSEDED, STALE OR WRONG — 24 items

Three findings were retired today as unreproducible ([[D1388]], [[D1477]], [[D1518]]). These are the
rest, including several a dossier itself corrected mid-flight.

| id | § | what it is | disposition |
|---|---|---|---|
| ATR-e1 | after-run §1.1 | The standing audit's *"Run is terminal at node: run-&lt;uuid&gt;:node:4"* claim is **stale** — it is intercepted at `session-controller` | superseded; only `resume()` still leaks (ATR-a1) |
| ATR-e2 | after-run §3.2 erratum | `classifier-coverage-and-noise.md`'s Lichess ladder gloss (10/20/30) is wrong; the corrected values are 5/10/15 and 2.5/6/14 | superseded by [[D939]]; the erratum has **not** landed in that file and the stale number will propagate until it does |
| ATR-e3 | after-run §3.5 erratum | `band-flattery.md` §5.1's praise-register hole is stale — `BANNED_JUDGEMENTS` now carries thirty words | superseded by [[D1418]]; same unlanded-erratum problem |
| ATR-e4 | after-run §Ledger | [[D1477]] retires a reported shipped false-personalisation claim that does not reproduce | retired today, before it reached a design document |
| A11-e1 | a11y §3.4 A | Olive's ΔE 18.3 contrast failure is **already repaired at HEAD** — `olive.css:2` carries `#96a25e`, the exact remedy `rfc/theming.md:561` proposes | retired by [[D1495]]; verified |
| A11-e2 | a11y §3.7 fallout-1 | The *"352px board"* is a **fixed desktop defect** ([[D496]]), not a live mobile one; 1440×900 now yields 768px | retired by [[D1495]]; it survives only as what a 375px phone gets |
| A11-e3 | a11y §Boundary | `mobile-scope.md`'s 374px geometry is stale, superseded by `rfc/play-composition.md`. **Its verdict stands; its numbers do not** | retired by [[D1495]] — and one of the three was a premise the briefer had themselves landed |
| A11-e4 | a11y §4 d3 | The *"no `<main>` in the shell"* half of defect 3 is **false as a page-level claim** — 17 `<main>` elements ship. Wrapping `.shell-content` in another would nest landmarks | narrowed: the defect is the skip-link target, not a missing landmark |
| LIV-e1 | live-social §12-3 | Two `broadcast-and-teacher-surfaces.md` defects are fixed at HEAD; that dossier is stale | correction owed to it; the chat-bridge item remains live |
| LIV-e2 | live-social §7 F5 | The host/guest assistance asymmetry is closed | retired by [[D1518]] today |
| CMP-e1 | campaign §12 row-11 | `roguelike-run-design.md`'s requirements table is three rows stale — requirements 3, 5 and 7 are discharged, closed and refuted | superseded by [[D91]], [[D277]] |
| CMP-e2 | campaign §1.6a | [[D1437]] was landed wrong: the ceiling inherits correctly, and the harm is the **default preset** | corrected by [[D1500]] |
| CLP-e1 | core-loop §11 refuted-1 | Do **not** claim *"nobody re-enters a reviewed game into live play"* — Chessigma does | refuted; a positioning claim that must not ship |
| CLP-e2 | core-loop §11 refuted-2 | Do **not** claim opening → play-out-versus-human-like-bot is ours — ChessMind AI ships it | refuted |
| TCH-e1 | teacher §12 row-17 | `league-as-return-loop.md` §C1 is superseded as policy; the evidence survives | a pointer line is owed — and it must be a pointer, not an edit, wherever law 7 applies |
| ARR-e1 | arrival §4.4 | `adoption-audit.md:214-216`'s *"~3 packs"* is stale against today's 56 drafts — but the visible shelf is still thin, for a different reason (zero graduable) | corrected in place |
| OPP-e1 | opponents §9.2-1 | [[D561]]'s framing is half-stale: its architectural half is discharged (the layers exist as an accepted compiled grammar with digests and gates); **its live half is a UX defect, not an architecture one** — a different owner and a different fix | re-read, not retired |
| OPP-e2 | opponents §12 | *"A bot picker is obviously a grid of character cards"* is **`[M]`** — no named bots, bios, avatars or displayed bot Elo appear in either chess.com teardown, the play-UX dossier, the matrix or the love/hate sweep. **Any future RFC citing a chess.com bot roster as precedent is citing model knowledge** | the dossier removed its own illustrative bot card mid-flight on finding this |
| OPP-e3 | opponents §9.0 | The opponent-choice findings are re-credited to [[D1473]] rather than presented as new | self-correction; §1 inherits D1–D4 by citation |
| ARR-e2 | arrival §11 O-A1 | *Is a scripted first run an "onboarding state"?* — **answered today**: [[D1513]] lifts the fence | resolved; ARR-a1 moves to buildable |
| LIV-e3 | live-social §Verdict V-6 | *Is the casting screen legal?* — **answered today**: [[D1513]] narrows the instrument to the diff | resolved; the one-line repair is LIV-c1 |
| CMP-e3 | campaign §0.1 | *Does the campaign get a door?* — **answered today**: [[D1514]] makes it a first-class surface with a route and an IA place, and authorises the `design/03` amendment | resolved; the name is still open (CMP-b1) |
| CMP-e4 | campaign §7 | *The failure state* was **not** ruled — the owner declined all four costed options and redirected to research with three constraints | [[D1515]]; it is a GAP row under law 1 until the research lands, so **no campaign failure RFC may be drafted from it** |
| AUT-e2 | authoring §1.5-13 | The `docs/app-shell.md:28` staleness is filed three times as three findings | one repair, not three |

---
## 🏆 Tournament readiness — the register

**[[D1520]], the owner today:** *"we def want to be ready for tournaments, 'native ratings' — like i
have asked for that 10 effing times already; i only said push the tournaments and operator
accounts."*

[[D1416]] deferred **tournaments, leagues and operator accounts as features.** The clarification is
that the **architecture must be ready for them**, which is a different status: a deferred feature is
nobody's work; a live constraint binds every 1.0 decision. [[D1481]] already named two objects — the
**round/pairing aggregate** and the **declared result**. This section is the rest, enumerated as the
ruling asks rather than waited for.

### The schema facts, measured at HEAD

Verified in this pass against `apps/server/src/storage.ts`:

1. **There are 37 application tables and not one of them is a pairing, round, event or tournament.**
   A search of the whole storage layer for `pairing`, `rounds` or `tournament` returns **zero**.
2. **`rated_games.run_id` is `TEXT PRIMARY KEY`** — one rated game per run — and `opponent_band` and
   `engine_identity_digest` are both `NOT NULL`, presupposing a bot. On a `STRICT` table that is a
   rebuild ([[D1516]]).
3. **`live_sessions.run_id` is `NOT NULL UNIQUE`** — one session per run, one run per session, and
   **no aggregate above it**. A round is many simultaneous sessions and has nowhere to be.
4. **`assignments` addresses `pack_id`.** Nothing in the schema addresses an *opponent* — this is
   [[D1481]]'s first missing object, visible in the DDL.
5. **`assignment_submissions` has no result column at all.** Its key is
   `(assignment_id, learner_id, run_id)` and it records `submitted_at`, not an outcome — [[D1481]]'s
   second missing object.
6. **`arena_legs` is the only table in the product with a declared `result`**, and it is
   `CHECK (leg IN (1,2))` — hard-capped at two legs, keyed to one live session. A multi-round event
   rebuilds it.
7. **`cohort_standings.classroom_id` is a `PRIMARY KEY`** — **one standing per classroom, ever.** A
   club that runs two seasons has nowhere to put the second, and `standing_members` is
   self-published by construction, so an organiser cannot enter a result for anybody.
8. **`learner_marks` is keyed `(learner_id, mark)`** — one bronze, one silver, one gold per learner
   for all time, with no event dimension.
9. **`public_tokens.scope` is `CHECK (scope IN ('story_read'))` — a single value.** There is no
   viewer, spectator, caster or arbiter scope, and adding one is a `STRICT`-table rebuild.
10. **`drill_runs` carries a single `active_writer_id`.** One writer per run is the seam a
    two-learner native match runs into, and `App.svelte:369-371` throws outright on any device other
    than the one that played the run.

### The decisions that get expensive

| # | The decision | Where it is decided | Why a tournament pays for it later |
|---|---|---|---|
| T1 | **The rated-game table's shape** | [[D1516]] → `rfc/learner-rating.md` | One rated game per run, bot-presupposing columns, `STRICT`. This is native ratings' blocker and a tournament's foundation, and they are the same rebuild |
| T2 | **The round/pairing aggregate** | [[D1481]], re-homed from [[D1416]] | Named and unowned. Fixing the roster × assignment projection now (TCH-a2) is the cheap version of the same join |
| T3 | **The declared result** | [[D1481]] + TCH-b5 | Collides with `teacher-surface`'s *"received, never marked"* and its counts-only rule. Forfeit, default, bye, adjudication and no-show have no representation anywhere |
| T4 | **The viewer/spectator token scope** | LIV-b2/b3 | One scope value on a `STRICT` `CHECK`. Ruling *no anonymous viewer* at 1.0 makes any tournament broadcast, crosstable or public round page a migration |
| T5 | **Resign, agreed draw and flag** | LIV-b9, [[D1519]] lane 0.23 | A game ending with no move cannot be an `outcome.reached` — appending one corrupts every later read of that run. Every tournament result type is one of these |
| T6 | **The organiser as a relation, not an account** | TCH-b4, [[D1481]] | `design/02:98-99` refuses the account form and `teacher-surface` shipped the delegated capability. Whether that capability can be **delegated onward** (assistant arbiters) is unaddressed and is the schema question a league needs |
| T7 | **Cohort standing scope and read symmetry** | TCH-b2, `learner-rating` R10(a) | One standing per classroom; ordering by game points with **no rank, no seed, no tiebreak** and rating explicitly barred as a sort key. Swiss pairing needs all three |
| T8 | **`abandoned` as a learner-controlled toggle** | TCH-a23 | Forfeit handling needs abandonment as an independent, non-withholdable field; a *"Show my record"* switch over it is incompatible with a results table |
| T9 | **Time control** | LIV-c5/c6, `recorded-clocks`, `enforced-clocks` | There is no time control anywhere ([[D300]]), the clock must run tab-closed, and `enforced-clocks` is queued behind a **blocked** `live-following`. Every bot calibration we have is untimed, so timed play invalidates it (OPP-b8) |
| T10 | **Bot entrant identity** | OPP-b9, [[D708]] | Changing a persona name **voids that profile's calibration by digest**. A published bot rating pins name and digest together permanently |
| T11 | **One active run per campaign, strictly forward map** | CMP-a8, campaign §1.4 | Concurrent rounds, replayed rounds and adjudication of a single game are all refused by an invariant currently presented as a feature |
| T12 | **Per-document, not per-learner, campaign income** | CMP-b9 | `actGrants` lives on the authored document, so a handicapped or seeded event is impossible without parallel documents. `CampaignRun` pinning `(id, version)` is the one property that *helps* — keep it |
| T13 | **Progression state folded per run** | CMP-b5 | If a league standing or a season carry-over is ever wanted, the fold's scope is the thing that changes |
| T14 | **The minimum supported viewport and orientation** | A11-b2/b3 | *"Round starts at 20:00, play from anywhere"* is false today: iPhone SE, the whole iPhone 12–15 Pro class in Safari, and **every phone in landscape** get a refusal alert |
| T15 | **Grid-shaped surfaces with no responsive spec** | A11-a29 | `CompareView`'s `repeat(var(--branches,2), minmax(15rem,1fr))` hard-floors N-board views at 480px. A pairing grid and a crosstable are the same shape, and `CohortStanding`/`GroupPanel` have no owning spec at all |
| T16 | **`RunService.evidence` has no role check** | LIV-a18, [[D448]] | Any granted reader gets rung-2 numbers. In an event, *granted reader* eventually includes spectators |
| T17 | **Session titles and event names** | LIV-a4 | Every live session is `` `${kind} session` ``. An event name has nowhere to live |
| T18 | **`session_invitations` has no state machine, and seats are link-claimed** | LIV-a13, LIV-a12 | There is no notion of a seat **assigned by an organiser** rather than claimed by whoever holds the link |
| T19 | **Head-to-head records keyed to band strings, not opponent entities** | OPP-c6 | `Band 1400` → `Wren · band 1400 · guarded` is the cheap moment to give records an opponent key. Without it a later pairing or standings feature has strings |
| T20 | **The account-data disclosure labels** | IMP-b9 | `rated_games` already stores `result`, `void_reason`, `terminal_reason` and `opponent_band` — the closest shipped thing to a tournament record, and it is undisclosed. Its twelve labels should be written to survive a later event context |
| T21 | **The guest predicate's class list** | IMP-b4 | Pairing and results rows are `live_social`. Deciding at 1.0 whether an unclaimed player may hold `live_social` rows determines whether guests can ever be paired |
| T22 | **The campaign attracts denomination (d)** | CMP-a25, [[D1151]] | The campaign dossier flags directly that a campaign surface invites *another person's expectation*, that (c) the catalogue is the ruled answer, and that [[D1416]] **defers rather than refuses**. The pressure is scheduled, not closed |

---

## The two the owner named himself

### Bot personas and the honest bot card

**Status: specified in full, queued nowhere until today.**

`design/research/ux-opponents.md` §2 specifies the card completely — three legal registers rendered
into three zones, with every sentence already drafted in `rfc/bot-roster.md` §4 and §7:

- **Register 1 — mechanism stated as consequence, in the second person.** *"It plays the moves the
  largest number of players at that rung play, and nothing checks those moves afterwards — so the
  pieces it leaves hanging stay hanging."* **The mechanism sentence is the personality.**
- **Register 2 — a measured rate with its denominator.** Legal only for a trait that cleared the
  controlled-trait gate. Exactly one ever has (`pawn_move` ×4).
- **Register 3 — declared absence, six rows, each with a measured basis.** *No opening book · it
  does not remember your last game · endgame behaviour never measured · below ten pieces the rung
  stops meaning much · not calibrated yet · the safety check uses a real engine, which is an
  advantage over a human at this rung.* **The refusals are the most personality-dense sentences
  available to us, because no competitor prints them.**
- **Zone 3, *"You and Wren"* — the relationship.** *"4 games · 1 win, 3 losses · last played
  Tuesday"*, plus an O8.2-licensed observed trait: *"Wren has taken the b2 pawn in 2 of your 4
  games."*

**The line, verbatim:** *"A bot card may describe the machinery and its absences in the language of
what the learner will experience; it may not describe the bot as a kind of chess player. What makes
it a someone is not an adjective — it is a specific flaw, a specific refusal, and a record of what
it has done to you."*

**Where the work sits in this index:** OPP-c1 (registers 1 and 3) · OPP-c2 (register 2) · OPP-c3
(family + band as two controls; **family A's four profiles have zero blockers by the roster's own
criterion 10**) · OPP-c6 (attach the record to a name) · OPP-c9 (the provenance rule that replaces
the eight-adjective filter) · OPP-a4 (the identity bar — greenfield, unblocked, and in no queue) ·
OPP-a11 (observed traits — licensed, unbuilt, every input already persisted).

**What was blocking it, honestly:** the card needs `rfc/bot-roster.md` to be accepted, and
`BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` is a literal empty array at HEAD. But **six
items in the opponent lane need nothing at all** — always send a band, promote the picker, render
the resistance sentences, ship the identity bar, put the disclaimer everywhere, add the
endgame-attenuation notice — and those six take the opponent from *two words and silence* to *a
named, described, recorded someone.* None of the six was in any queue.

**The rider the owner must settle (OPP-b2):** `design/00-thesis.md:136` refuses *"a generic bot
ladder"*. Shipping the picker **without** the card produces exactly the refused object. Ratify the
exemption with its three conditions, or refuse the picker.

### Native ratings

**Status: ruled in scope, asked for repeatedly, in zero queue documents until today, and blocked by
a real schema fact.**

- **Ruled in scope** by [[D1414]] (O12, native-first). It was **never** part of [[D1416]]'s
  deferral, whose verbatim text covers *tournaments against bots, leagues, operator accounts* and
  never mentions ratings.
- **The blocker is [[D1516]] and it is verified at HEAD:** `rated_games.run_id` is
  `TEXT PRIMARY KEY` — one rated game per run — against a native match, which is **one run with two
  learners**; and `opponent_band INTEGER NOT NULL` and `engine_identity_digest TEXT NOT NULL` both
  presuppose a bot. On a `STRICT` table that is a **rebuild**, of the `live-sources` migration class,
  not an additive column.
- **How it disappeared:** it existed only as a discharge handed to `rfc/learner-rating.md`. A
  discharge is a pointer, not a queue entry. **A named blocker is a queue entry, not an excuse for
  absence** ([[D1521]]).
- **What it is coupled to:** T1 above. The rated-game rebuild that native ratings needs is the same
  rebuild a tournament needs, and doing it once is the whole argument for treating
  tournament-readiness as a live constraint rather than a deferred feature.
- **Related unqueued items in this index:** LIV-b5 (does native-first include a public pool — not
  ruled by [[D1414]] and explicitly flagged as unruled), LIV-b6 (there is no way to discover another
  learner at all), LIV-b7 (the human anchor experiment `learner-rating` R7 waits on), LIV-c4 (the
  terms label as a projection), LIV-c5 (resign, agreed draw, flag).

---

## Proposed ledger rows — NOT written

Unnumbered per the drafting convention; head was **D1523** at drafting. Routed to the durable
sections above, never to a `## Ledger rows` heading.

- 🐞 **The opponent identity bar is greenfield, unblocked, and was in no queue.** `avatar` occurs
  zero times in `apps/web/src`; the applied band is already persisted on
  `opponentSelection.engine.eloApplied`. Six unblocked items take the opponent from two words and
  silence to a named, described, recorded someone, and **none of the six needs a new measurement.**
- 🐞 **`public_tokens.scope` is a one-value `CHECK` on a `STRICT` table**, so every future viewer,
  spectator, caster or arbiter scope is a rebuild. This is the cheapest tournament-readiness
  decision to take early and the most expensive to take late.
- 📊 **The product has thirty-seven application tables and not one pairing, round or event.**
  `arena_legs` is the only table carrying a declared `result`, and it is `CHECK (leg IN (1,2))`.
  `cohort_standings.classroom_id` is a `PRIMARY KEY`, so a club can hold exactly one standing ever.
  This is [[D1481]]'s two missing objects, visible in the DDL rather than argued from the surface.
- 🐞 **`ShellFrame`'s skip link is a real defect and *"there is no `<main>`"* is not.** Seventeen
  `<main>` elements ship in `App.svelte`, one per route body. Wrapping `.shell-content` in another
  would nest landmarks. The repair is to point the skip link at the content, not to add a landmark.
- 🐞 **`drawable` is already enabled in the run screen.** `DrillScreen.svelte:890` passes
  `drawingEnabled={previewNodeId === undefined}`. Two dossiers and one intent-tier parenthetical
  (`design/05:199`) record it as off. The live question is narrower: **do learner marks survive a
  rewind?**
- 📊 **Two errata are recorded in dossiers and have not landed in the files they correct** —
  `classifier-coverage-and-noise.md`'s Lichess ladder gloss ([[D939]]) and `band-flattery.md` §5.1's
  praise-register hole ([[D1418]]). A correction that lives only in the correcting document
  propagates the stale number anyway. Same class as [[D1495]].
- 💡 **Add a fourth teardown question to `design/research/README.md`:** *who does this product say
  you are playing, and what does it claim about them?* A case-insensitive search of
  `teardown-noctie-desk.md` for *bot*, *opponent* and *persona* returns zero hits, and most of the
  sweep has the same shape. **That protocol gap is why bots got a mention in six UX dossiers and a
  pass in none** — it is not an oversight by any individual teardown.
- 📊 **This index is the fourth enumeration and says so.** [[D1523]] is correct that a snapshot
  cannot fix a citation-shaped instrument. What this one adds is a per-item classification and a
  per-item queue check; what it still lacks is state on the item. It should be consumed and
  superseded by that instrument, not maintained.

---

## What a dossier recommended that I believe is wrong

Reported as the brief asks, and separated from the merely stale (which is group (e)).

1. **Both the teacher and import dossiers defer ~35 ledger rows to "assigned at landing" and cite
   law 5 for it.** Law 5 protects `design/00`–`06`. `CLAUDE.md` is explicit that the ledger *"is a
   shared ledger, not an intent doc… a register every tier writes to"*, and law 4 says every idea
   gets a row **the moment it is uttered**. Deferring the rows is the exact flow-back failure the
   2026-08-14 reverse-trace found. (This index proposes rows unnumbered because it was told to; the
   dossiers had no such instruction.)

2. **`ux-import-and-account.md` §5.4(i)'s proposed registration sentence — *"You can download all of
   it or delete it at any time"* — would ship an untrue claim on the first screen.** The same
   dossier's §6 gap 3 records that export re-confirms a password with no recovery, and its §4.4
   Option C records that a guest can do neither until they claim. An honesty recommendation that
   creates a `design/05:41` violation is worse than the silence it replaces.

3. **`ux-teacher-and-classroom.md` §2.3's proposed classroom sentence — *"It does not let them see
   your runs"* — is false once a run is submitted,** and specifically false about the consequence
   the same dossier surfaces in §4.3(b2): a granted teacher sees which assistance rungs the learner
   opened. The trailing clause partly repairs it; the flat denial is what a user will remember. The
   same section's *"You can revoke at any time"* contradicts §4.3(a)'s own rule that revoke copy
   must not imply an undo.

4. **`ux-after-the-run.md` §3.6 proposes declaring a decided-position threshold as *"a Tabiya
   composition of cited values"* after conceding the value is unpinnable.** That is a chess-truth
   threshold with no citable derivation. The [[D1422]] precedent it leans on is one day old and is
   itself a composition rather than evidence. The suppression **rule** is right (freechess's
   published `Brilliant` already carries a not-already-winning cutoff, so the shape is not an
   invention); the **number** needs a derivation or an owner ruling, not a citation of a sibling
   composition.

5. **`ux-after-the-run.md` §3.5's "narrowness" is praise wearing different vocabulary.** *"Only one
   move held this. You played it."* is a positive evaluation of the learner's move selected by an
   engine multi-PV comparison — the same measurement the dossier itself argues cannot ground praise.
   Its own §3.5 rule (praise needs a different *measurement*, not a different threshold on the same
   one) applies to it. It also collides with `EVIDENCE_DERIVATION_WIDENS`, since narrowness is
   defined over legal alternatives within ε of the played move.

6. **`ux-after-the-run.md` §3.1/§3.3's end-to-end annotated clickable move list with an uncapped
   tier-1 note column is structurally the named death** — *"an engine review screen with a rewind
   button"*. The defence is that the door organises the hierarchy, but the door is one row's
   affordance inside a screen whose dominant object is per-ply engine annotation. **The dossier's own
   §1.7 finding is the evidence against it**: on the surface we already ship, the grounded narrative
   loses to the sparkline by default. The tier-2 budget (ATR-b1) is what keeps this honest and it is
   unruled.

7. **`ux-authoring-and-library.md` §15 orders C1 before C3 against its own §5 constraint.** C3 says
   plainly *"without this, C1's continuous linting would make things worse, not better"*, and §15
   ranks C1 first and C2/C3 ninth. They must land together (this index files them as AUT-a1 and
   AUT-a4 with the constraint stated).

8. **`ux-authoring-and-library.md` §6 D3's `concepts` autocomplete is the mechanism [[D700]]
   refuses.** The dossier concedes D700 rules that grouping labels would launder identity, then
   proposes suggesting prior strings at the input. That is precisely how two packs' unrelated uses
   converge on one token. True of the data model, false of the behaviour it induces.

9. **`ux-authoring-and-library.md` §10.1 and §10.5 assert opposite findings** — *"it should be
   deleted rather than improved"* and *"replace it with a knowledge surface"* — before §13 frames
   either as an owner fork. And §10.5 H4 proposes shipping thirteen principles that all self-declare
   `standsOn: authors_practice` as a learner-facing knowledge surface; **its own alternative (wait
   for [[D531]]'s regrounding) is the law-8-safe branch and should be the default rather than a
   fork.**

10. **`ux-live-and-social.md` §4 C4 resolves an intent question by analogy.** [[D1291]] ruled on chat
    votes on a live cast run; C4 asserts a spectator whisper channel *"inherits the identical
    treatment"* and — uniquely among that dossier's contested items — is **not** routed to §13 as an
    owner question. It also sits against §10's Stream row promising *no chat*.

11. **`ux-live-and-social.md` §11 row 1 calls streamer mode *"depends on nothing"* while §6 E4 says
    the word "Stream" must be disambiguated first.** Shipping a *streamer mode* beside a session kind
    called *Stream* is the collision E4 exists to prevent. (Filed here as LIV-a14 with E4 folded in.)

12. **`ux-settings-and-identity.md` §5.4 says *"no design change is needed"* and §5.5 names Owner
    decision 4 — a law-5 change to `design/03:294` — as a dependency of the same three moves.**

13. **`ux-settings-and-identity.md` §6B-2 relabels opponents as bare `1000 / 1400 / 1800 / 2200`.**
    `learner-rating` R7 declines to publish our numbers as an external-scale equivalent because the
    anchor is unmeasured; four-digit numbers on an opponent control are that same unearned scale
    claim, offered as the honest alternative to model names. `ux-opponents.md` §4 has this right —
    rung words plus the disclaimer — and the two dossiers should not ship different answers.

14. **`ux-campaign.md` §6.3 R1's *"win or lose"* copy is not guaranteed by the schema.**
    `CAMPAIGN_ECONOMY_MONOTONE` only requires `actGrants` to be non-increasing, so an author may set
    an act's grant to zero. The dossier quotes that rule in §1.3 and then builds its whole
    non-punitive answer on a promise the schema does not make. Either the copy is document-derived or
    the grant is floored above zero.

15. **`ux-campaign.md` §3.3b recommends a learner-facing sentence whose producer the same dossier
    says does not exist.** *"We know how this goes because we can see what players at your band
    actually did here"* with no `DecidednessGround` behind it is a manufactured claim about a
    position. Right in intent, wrong in ordering.

16. **`ux-opponents.md` §5.1's *"Grabby"* example calls an adjective legal when only the report is.**
    *"In your 4 games it captured on b2 3 times out of 3 opportunities"* is legal; the adjective
    attached to it is a characterisation of chess behaviour at n = 4, and **the dossier's own §5.3
    provenance rule would reject the word and keep the sentence.** It should have said so.

17. **`ux-opponents.md` §6's example — *"it weighted your fork square at 3%"* — names a fork.** The
    mass and the guard decision are the bot's own record and legal; *your fork square* is a claim
    about the position. Unless it is bound to a declared detector id it is the ungrounded strategic
    claim law 8 refuses, wearing the dashboard-of-the-machine exemption. The Stage-B `features`
    binding that would ground it is Discharge D4 and unlanded, while §6 lists the sentence as legal
    today.

18. **`ux-opponents.md` §7 rec-3 and rec-5 pull against each other in the same section.** Promoting
    bronze/silver/gold pills onto the primary play surface, while rec-5 warns against rivalry
    mechanics on an uncalibrated ladder, is the same object twice. A gold pill for *"Beat band
    2200"* is a rivalry mechanic on an uncalibrated ladder.

19. **`ux-core-loop.md` §12's closing paragraph contradicts its own table** — recommendation 3 is
    listed as blocked on `evidence-presentation` §5 and then named among those *"blocked on
    nothing"*. §6 D3's cost row sides with **blocked**, and this index files it as CLP-c3.

20. **`ux-core-loop.md` §4 R1 removes an affordance its own §1.3 depends on.** Making rewind *"a
    consequence of finishing, never an always-present control"* makes mid-run checkpoint comparison —
    which §1.3 treats as a real learner behaviour — unreachable without an outcome. Filed as CLP-a9
    with the objection attached.

21. **`ux-core-loop.md` §2 C1 and `ux-after-the-run.md` §3.3 hand the same board opposite defaults.**
    C1 paints a semantic layer at commit; after-run adopts the Nibbler warning and rules tier-1 notes
    off the board entirely. They are different moments — play and review — but neither dossier
    cross-references the other, and one renderer will have to hold both.

22. **`ux-accessibility-and-mobile.md` §4 defect 9 is filed as needing no ruling and its repair is an
    RFC amendment.** *"Add `square.oc.move-dest` to criterion 7's enumerated set"* edits an accepted
    RFC's acceptance criterion, and the dossier's own §5 Q6 concedes the metric question is an owner
    decision. Defect 9 and Q6 are one finding split across the ruling boundary; filed here as A11-a20
    (measurement) and A11-b6 (the ruling).

23. **`ux-authoring-and-library.md` treats a new public API route as a defect repair.** *"Ship
    `GET /principles`"* is new surface area, and `rfc/README.md` carries no active product RFC for
    it. Law 1 does not carve out *trivial*. It is in group (a) here because `planning/codex-wave-3.md`
    §4 already queued it as buildable — but that is a decision somebody made, not one law 1 grants.

---

## Residuals and limits

1. **This is a document, not an instrument.** [[D1523]] says a fourth enumeration is not the fix, and
   it is right. The classification and queue columns here are what the previous three snapshots
   lacked; **state on the item, with an owner, is what this still lacks.** If the persistent-state
   instrument lands, this file should be consumed and deleted rather than maintained.

2. **The 1,118 → distinct reduction is the one judgement call in the method.** It collapses a
   dossier's verdict, recommendation, cost row and proposed-ledger row about the same thing into one
   item. It does **not** collapse across dossiers, so where two dossiers independently name the same
   defect (the compare density problem, the theming sweep holes, the `<main>`/skip-link pair) both
   rows survive with a cross-reference. Nothing was dropped for importance.

3. **The queue check is a text search over five documents.** It shares `work-index`'s weakness: it
   can tell *named* from *not named*, not *assigned* from *mentioned*. `ledger` in the queued column
   means *a `design/BACKLOG.md` row names this and no queue document does* — which for routing
   purposes is much closer to `none` than to `wave3`.

4. **Eight dossiers' recommendations were extracted by subagents reading the full text; two
   (`ux-arrival-and-start.md`, `ux-in-run.md`) were read directly.** Every classification, every
   HEAD verification and every queue check in this file is mine. The HEAD checks are file-and-line
   reads at `0d347288`, not a running application.

5. **I did not run the app, drive a competitor, or open a phone.** Neither did any of the twelve
   dossiers — [[D1458]] bounds the whole corpus, and `CLAUDE.md`'s *"hands-on beats desk research"*
   is unmet across every one of them. The cheapest fixes are enumerated as items rather than
   summarised: ARR-a9, CLP-a22/a23/a24, TCH-a32/a33, IMP-a29/a30, AUT-a26/a27, A11-a33/a34,
   OPP-a17/a19, SET-a27, LIV-a24/a25, CMP-a3.

6. **I did not price anything in hours.** Where a dossier stated a cost I carried its own word
   (*small*, *medium*, *two lines*); where it did not, the note says what the item touches.

7. **The tournament register is derived from the shipped DDL plus the dossiers, not from a
   tournament specification.** Nobody has written what a Tabiya tournament is. T1–T22 are the places
   a 1.0 decision forecloses one — which is what [[D1520]] asks for — and they are not a design.
