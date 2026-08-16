# App reality check — what a user actually gets

**Date:** 2026-08-16
**Method:** hands-on. `make up` (docker compose, `ENGINE_MODE=mock`, no `NODE_ENV`), then the running
app at `http://localhost:3000` driven with the repo's own Playwright (`playwright-core@1.62.1`) as a
real browser: account created, all eight routes walked, a drill played to termination, forked,
compared. Live API queried with `curl`. Source read to explain what was observed.

**Evidence labels used below**
`[RUNNING]` — I saw it in the running app.
`[SOURCE]` — I read it in the code, did not exercise it.
`[UNCHECKED]` — I could not check it.

**Scope note.** This is a measurement pass. Nothing was fixed, no code, ledger, or design doc was
touched. **Row ids proposed from D481; none written.** (The brief said D478 was the high-water mark;
D479 and D480 were claimed by a concurrent session while this audit ran — see §11.)

---

## 0. The one-paragraph answer

The owner is right, and the documents are also right — about different things. **Eleven breadth
gates are green and a user still sees almost nothing, because the gates measure whether a
*capability* exists in the codebase and the owner measured whether a *product* exists on screen.**
Every one of the eight surfaces renders. The core loop (commit → consequence → rewind → branch →
compare) genuinely works end to end — I completed it. But it works on **one pack, and that pack is
the JSON schema example fixture**, whose authored prose reads *"Schema-only annotation; requires
human review."* The 56-pack content corpus is invisible not because of a bug but because a
correctness gate is doing exactly what it was specified to do. That is the fourth category, and it
is the dominant finding.

---

## 1. Why the user sees one pack — the exact predicate

**Verified `[RUNNING]`.** `curl http://localhost:3000/packs` returns exactly one object:

```
id:           najdorf-transition-schema-example
reviewStatus: schema_example
channel:      official
```

**The predicate is not `reviewStatus` and not `graduationBlockers`.** Neither is consulted at serve
time. `PackList.svelte` renders whatever `/packs` returns, and `PackRegistry.list()` returns every
record it loaded. The filter is one level up, in **`PackRegistry.loadDefault`** (`apps/server/src/pack-registry.ts`),
and it is a **directory split governed by a single boolean**:

```ts
const productionPaths = [fixture, ...(await jsonFiles(contentDirectory))];  // schemas/drill_pack.example.json + content/packs/
const draftPaths = options.development === true
  ? [...(await jsonFiles(draftsDirectory)), ...]                            // content/drafts/
  : [];
```

`development` comes from **`process.env.NODE_ENV === "development"`** in `apps/server/src/main.ts:20`,
passed through `createApplication` in `apps/server/src/application.ts:285`.

**`compose.yaml` never sets `NODE_ENV`.** So `make up` runs production mode, and production mode
loads:

| Source | Contents | Packs |
|---|---|---|
| `schemas/drill_pack.example.json` | the schema example fixture | **1** |
| `content/packs/` | **only `.gitkeep`** | **0** |
| `content/drafts/` | the entire 56-pack corpus | **excluded — 0** |

**So the visible count is `1` and that one is a schema fixture.** In full: *the user sees one pack
because `content/packs/` is empty and `content/drafts/` is development-only.*

### Why `content/packs/` is empty — the gate behind the gate

`make graduation-report` `[RUNNING]`:

```
## content/drafts
documents: 56; legacy: 0; blocking: 220; resolved: 30; accepted: 43

## content/packs
documents: 0; legacy: 0; blocking: 0; resolved: 0; accepted: 0

## Graduable drafts and packs
(none)
```

All 56 drafts carry `reviewStatus: "draft"` and **220 blocking graduation blockers between them —
5 to 8 each. Zero packs are graduable.** The five most common blockers are structural, not
clerical: `mechanical-objective-placeholder` (36), `target-elo-authored` (26),
`start-assessment-absent` (26), `outcome-ungraded` (26), `authored-teaching-absent` (26).

**This is a gate working exactly as specified and producing a broken product.** Nothing is
mis-implemented. The content simply has not passed review, and the serving path — correctly —
refuses to serve unreviewed chess claims to a learner.

### How big is the fix?

I ran the built server with `NODE_ENV=development` on port 3100 `[RUNNING]`:

```
PACKS: 57
  schema_example  najdorf-transition-schema-example
  draft           anti-caro-advance-early-c5
  draft           anti-caro-advance-c5-race
  ...
```

**All 56 drafts load, validate, and serve cleanly.** The corpus is healthy. The gap between "one
pack" and "a real library" is one environment variable — which is precisely why it must *not* be
flipped casually: doing so serves 220 unresolved blockers to a learner and walks straight into law
8. The honest options are (a) graduate a small number of packs properly, or (b) build a disclosed
"draft/preview" channel that shows unreviewed packs *labelled as such*. Both are decisions, not
fixes.

---

## 2. Navigational surfaces — which are reachable by clicking

**All eight are reachable and all eight render real content `[RUNNING]`.** `ShellFrame.svelte`
declares `destinations` = Home / Play / Learn / Review / Live / Create / Library / Settings, and
every one is an anchor in the top bar. I clicked through all of them.

| Surface | Reachable | What actually renders |
|---|---|---|
| Home | ✅ | *"No previous run yet. Start with a rehearsal pack."* + one "Go to Play" button |
| Play | ✅ | Just Play form (side / opponent / FEN) **+ one pack card** |
| Learn | ✅ | Repertoire import form; four empty states (no repertoire, no milestones, nothing due, no attempts) |
| Review | ✅ | Game-import form; *"No runs to review yet."* |
| Live | ✅ | Kind + board-control selects; *"No live sessions yet."* |
| Create | ✅ | Pack studio + shape editor, both raw JSON textareas |
| Library | ✅ | The same single pack, plus *"No run artifacts yet."* |
| Settings | ✅ | 54 assistance controls + provider status + account |

**Correction to a claim I should not pass on unverified:** `PLANNED_SURFACES` in
`apps/web/src/lib/api.ts:233` is an **empty frozen array** `[]` `[SOURCE]`, and
`/capabilities` reports all seven surface ids as `"available"` `[RUNNING]`. So the app tells the
user nothing is planned-but-missing. There is no "coming soon" anywhere. Everything either works or
is silently absent.

**So B1 is genuinely met.** The owner's *"so much of stuff I asked about seems simply not
implemented"* is not about missing routes. It is about the routes being empty — six of the eight
surfaces are pure empty states on a fresh account, because there is one pack to generate content
from.

### Capabilities that exist on the server with no way to reach them

Verified myself `[SOURCE]`, not relayed:

- **`POST /runs/:id/simulate` and `/simulate-enter`** are routed in `apps/server/src/rest.ts:653`
  and handled at `:1489`/`:1497`. **`apps/web/src/lib/api.ts` contains no `simulate` method.** The
  client can only *display* `origin: "simulated"` (`BranchRail.svelte:54`, `CompareView.svelte:83`)
  — it can never create one. B3's *"simulate-all authored variations"* is unreachable from a browser.
- **`duplicateRun`** is declared on `DrillClientApi` (`api.ts:631`) and **called by no component**.
  B7's "duplicate" is unreachable.

---

## 3. Settings

**The recorded residual is factually wrong, and the owner's complaint is right anyway.**

`design/03-product-breadth.md` B1 and `planning/exploration/gates.md` both record
*"`/settings` remains display-only"*. **That is false `[RUNNING]`: I counted 58 visible interactive
controls, of which 54 are live assistance controls** — 6 contexts × (3 `<select>` + 6 `<input
type=checkbox>`) — plus sign-out, password, delete. Every one writes to `localStorage` through
`saveAssistance`. The ledger already knows this: row **`D311 🐞`** states *"corrects `design/03:297`
— **`/settings` is not display-only**: it renders 36 live controls"*, and **`D397 ✅`** records the
axis set being completed. **The design doc and the gates mirror were never updated.** Two documents
still carry a residual their own ledger retracted.

So the gate is not overstated here — it is *understated*, and still wrong. What is actually wrong is
everything the gate does not measure:

**No sane defaults `[RUNNING]` + `[SOURCE]`.** `loadAssistance` returns `SILENT_ASSISTANCE` for every
profile when storage is empty, and `SILENT_ASSISTANCE` is
`{markers:"off", guided:"off", humanSplit:"off", corpus:"off", voice:"authored", spoken:"off",
boardLighting:"off", arrows:"off", ambient:"off"}`. **Every one of the 54 controls ships in its
off/lowest position.** A new user gets an assistance ladder with every rung disabled, including
`boardLighting: "off"` — *no legal-move highlighting at all* on a chessboard. The owner's "no sane
defaults" is exactly and literally true.

**The assistance ladder on screen is six identical unlabelled columns.** The contexts are named
"Curated drill / Just Play / Imported game / Match / Arena / Streamed session / On-ramp" with **no
explanation of when each applies**, and the nine axes are named in vocabulary
("Structural sight", "Disclosed evidence", "Passive markers", "Named-pattern guidance",
"Human move split on request") that appears nowhere else in the UI. There is no preset, no
"recommended", no way to set all six at once.

**It is visually the weakest screen in the app `[RUNNING]`.** Native unstyled `<select>` and
`<input type=checkbox>` with OS default chrome, sitting under a carefully-set serif display face —
the contrast is jarring. And `AssistanceSettings.svelte:77` sets `label{display:grid;gap:.25rem}`,
which applies to the checkbox labels too, so **each checkbox renders centred *above* its own text**
rather than beside it: six orphaned boxes floating over six captions, per column, six columns. That
is a one-line CSS defect producing the single strongest visual impression of "just dumped".

**The page is titled "This deployment"** — for a page whose primary content is personal preference.

---

## 4. Campaign mode — plain answer

**Campaign mode does not exist. It has never been RFC'd and not one line of it is implemented.**

Verified across all four tiers:

| Tier | State |
|---|---|
| Idea / ledger | ~24 rows in `design/BACKLOG.md`, oldest 2026-08-15, almost all 💡. Founding rows: **"Build your coach — assistance as unlockable inventory (the campaign core)"**, **"Roguelike as the frame, not the decoration (owner posture 2026-08-15)"**, **"Rewind budget as a difficulty axis"** |
| Research | Extensive and real — `planning/campaign-research-queue.md` (R1–R11), 9+ dossiers, `planning/campaign-synthesis.md` (1,145 lines). **R6, R7, R8 are still open and explicitly gate building** |
| Design | `design/06-campaign.md`, 245 lines, which says of itself at line 9: *"Nothing here is an RFC. This is intent."* It has **zero inbound links** from any other design doc |
| RFC | **None.** No campaign RFC in `rfc/`, `rfc/archive/`, or `rfc/withdrawn/` |
| Implementation | **None.** No route (`router.ts` declares exactly the eight shell paths), no component, no store, no schema type, no table, no endpoint |

**No breadth gate mentions campaign** — `grep -i campaign design/03-product-breadth.md` returns
zero hits. The campaign postdates the breadth era entirely (gates closed 2026-08-14; campaign
ideation began 2026-08-15).

**The process finding is the sharp one.** `planning/campaign-research-queue.md:3` says *"Status:
research tier. Nothing here may become an RFC yet."* — but that line is now stale, because
`design/06-campaign.md` was subsequently written on that gate's own terms. So the owner has spent
days in campaign discussion across a research queue, a 1,145-line synthesis, and a 245-line design
doc, **and no document in the chain states plainly on its face that none of it is built.** Each
individual doc is honest about its own tier; nothing aggregates. `R8` is the question that matters
and it is still open in the queue: *"if the core loop does not hold attention for one session, the
campaign is scaffolding around a void. Nobody has played a run since 2026-08-12."*

**Proposed row D481 💡** — *"No document tells the owner that campaign mode is unbuilt."* The
research queue, the synthesis and `06` are each tier-honest and collectively misleading; a
one-line build-state banner on `06` is the fix.

---

## 5. "Just dumping raw info" — the honest judgement

`CLAUDE.md` names the failure shape: *"an engine review screen with a rewind button"*, and a
dashboard of raw numbers, as the thing this product must not become.

**Verdict: we have not become the named anti-pattern, but we ship its raw material with the
authored layer missing — and under `make up` defaults the dashboard reads all zeros.**

Three things are genuinely right, and I want to be fair before the criticism:

- **No LLM-manufactured chess truth.** Law 8 holds. The providers are `llm: "none"`; nothing on
  screen grades a move in prose.
- **Abstention is real and visible.** *"Tabiya's phase bands do not classify this position."* The
  system says when it does not know.
- **Attribution is real.** *"This pack declares… / Detected by Tabiya's phase bands…"* separates
  authored claim from computed observation, which is the whole point of the design.

But what a user reads on the drill screen `[RUNNING]`:

**(a) A raw internal identifier as the primary end-of-run message.** When the run terminated:

> `Run is terminal at node: run-456c8dec-97b8-4ae4-809c-bf9b06014391:node:4`

That is a debug string with a UUID, and it is the payoff of the core loop. This is the single
worst instance in the app.

**(b) Raw enum values.** *"This pack declares: cross_phase."* — underscore and all.

**(c) A counter dump with a pluralisation bug and a missing space.** The branch rail header renders
literally as `Branches1 branches · 0 settled · 0 hidden by you · 1 not classified` — four counters,
three of them zero, in monospace, before the user has done anything.

**(d) The structural reading is a mechanical trivia dump.** After one move, seven sentences:

> *"The line through e3–a7 contains 1 blocker. The line through e3–c1 contains 0 blockers. The line
> through e3–g1 contains 1 blocker. The line through e3–h6 contains 0 blockers. 1 White piece
> directly attack e3 in the current occupancy; pins are not evaluated. White's bishop on e3 has 5
> attack-reachable squares in the current occupancy; check and pins are not evaluated. White's
> bishop on e3 stands on a dark square."*

Every sentence is true, sourced, and hedged — law 8 is respected scrupulously. **And it teaches
nothing.** *"White's bishop on e3 stands on a dark square"* is not a reading; it is a fact the board
already shows. Grammar breaks too (*"1 White piece directly attack"*). This is not the banned
pattern — no move is graded — but it is its cousin: **a wall of computed numbers standing in for
insight, because the authored layer that was supposed to sit on top is empty.**

**(e) The authored layer, when it does appear, is placeholder text.** The checkpoint sheet — the
designed payoff moment — renders:

> **Authored commentary** · LINE NOTE · *"Schema-only annotation; requires human review."*
> **ALTERNATIVE F1E2** · *"Schema example only; classification requires review."*

Raw UCI `F1E2` upper-cased into a heading, and prose that tells the learner it has not been
reviewed. This is a direct consequence of §1: the only servable pack is a schema fixture.

**(f) Every evidence number is `+0.00`.** `make up` runs `ENGINE_MODE=mock`; `/capabilities` reports
`opponent: "mock", judge: "mock", corpus: "mock", tablebase: "mock"` `[RUNNING]`. The comparison
view's "Recorded engine evaluation" is therefore a literal column of zeros:

```
Fork   Sharp setup +0.00    main +0.00
+0: +0.00   +1: +0.00   +2: +0.00
```

**The default `make up` experience is a dashboard whose every number is zero.** `make up-engines`
exists and is not the documented default.

**Where it is genuinely good.** The comparison view is the best screen in the app: *"Same decision,
two consequences."*, two aligned boards side by side, an aligned-ply scrubber, Overview/Summary/
Boards tabs. It is well-typeset and well-composed. Its weakness is that under mock everything it
reports is 0.00, and the two boards it showed me were the *same position* (both "Last move e6, Ply
2") because alignment starts at the fork — while the Summary tab simultaneously called one branch
"2 plies · objective achieved" and the other "0 plies · No moves on this branch yet". **Overview and
Summary disagree about the same two branches on the same screen.**

---

## 6. Playing a drill end to end

I played the only pack, to termination, twice, plus a fork-and-compare pass.

**The loop works.** Fork → modal *"BRANCH FROM HERE / Name the experiment"* with Label + Intent →
"Create branch" → branch count goes 1 → 2 → Compare (`Tab`) enables → full comparison view. **I
completed commit → consequence → rewind → branch → compare.** I want to state that clearly, because
my first pass wrongly concluded Fork was inert — my selector `button:has-text("Fork")` had matched
*"Compare all forked here"*. **The core mechanic is real.** Correcting that was the most important
thing I did.

What is confusing, broken, ugly, or silent:

1. **The checkpoint sheet is a modal that swallows clicks silently `[RUNNING]`.** It is
   `role="dialog" aria-modal="true"` with a `.backdrop`. While it is open the main board and the
   entire branch rail are **fully visible and completely dead**. I made two moves (`f2f3`, `d1d2`)
   against a live-looking board and **nothing happened — no move, no error, no message, no cursor
   change.** Playwright's log names it exactly: *"backdrop intercepts pointer events"*. A user will
   read this as "the app is broken", not "there is a dialog".

2. **The prediction checkpoint puts a second chessboard inside the modal** and says *"Play one
   candidate on the board"*. There are now two boards on screen; **the big obvious one is dead and
   the small one in the sheet is live.** No visual cue distinguishes them.

3. **The run ends after 4 plies** and then everything stays interactive-looking but is not. The
   header still reads **"YOUR MOVE"** after termination — a straight falsehood — and `Fork` returns
   **HTTP 409 with no user-visible message at all** `[RUNNING]`.

4. **"Rewind here" appears to do nothing.** Pressing it at the first checkpoint left the board,
   ply count (1) and move list (Be3) identical, because it rewinds *to* the checkpoint you are
   already at. No animation, no confirmation, no state change.

5. **The board is the smallest thing on screen `[RUNNING]`.** Measured: **352 px wide at 1440×900**
   (24% of viewport width) and **256 px at 1280×800**, while the objective headline is set around
   40 px and roughly a 500×500 px region to the right of the board is empty. The primary object of a
   chess product is dwarfed by its own caption.

6. **Keyboard hints are concatenated into labels** — buttons read "Fork B", "Compare Tab", "Replay
   Space", "Export E". And the hint for a disabled control floats free beside it rather than being
   attached: *"Create at least two branches before comparing."*

7. **The status line advertises absence**: *"YOUR MOVE · AUTHORED COMMENTARY WITHHELD UNTIL
   CHECKPOINTS"*. The first thing the user learns is what they are not going to be shown.

8. **I must correct one thing I nearly reported as a bug.** In full-page screenshots the board
   appears clipped and overlapped by the structural-reading panel. **It is not.** I measured board
   geometry against the viewport at 1440×900, 1280×800 and 390×844: no clipping, no overlap at any
   of the three. It is an artifact of full-page capture on a `height:100dvh; overflow:hidden`
   layout. **No layout defect here.**

---

## 7. The four-way classification

### NEVER BUILT — 1 major item
| Item | Evidence |
|---|---|
| **Campaign mode** | No RFC at any status, no route, component, store, schema, table or endpoint. Research + design intent only. §4 |

*No breadth gate is wrong in the sense of claiming code that does not exist.* Two prior
false claims (B6 session-distillation, B7 recommender) were already caught and re-ledgered by the
2026-08-14 forward trace.

### BUILT, NOT HOOKED UP — 2 verified
| Item | Evidence |
|---|---|
| **`simulate` / `simulate-enter`** | Routed `rest.ts:653`, handled `:1489`/`:1497`; **no client method exists**. B3's "simulate-all authored variations" cannot be triggered from a browser `[SOURCE]` |
| **`duplicateRun`** | On `DrillClientApi` (`api.ts:631`), **called by no component**. B7's "duplicate" is unreachable `[SOURCE]` |

`planning/exploration/gates.md:169–182` records further items in this class (live audience cannot
vote from a browser; rungs 3, 4 and 6 unreachable during Just Play) which I did **not**
independently verify — `[UNCHECKED]`, flagged rather than relayed as fact.

### BUILT, HOSTILE — 4 verified
| Item | Evidence |
|---|---|
| **Settings** | 54 controls, **all defaulting to off**, six unexplained identical columns, native unstyled widgets, checkboxes rendered above their labels by `label{display:grid}` (`AssistanceSettings.svelte:77`). §3 |
| **Terminal-run message** | `Run is terminal at node: run-<uuid>:node:4` shown to the user; "YOUR MOVE" persists after termination; Fork 409s silently. §6 |
| **Structural reading** | Seven mechanically-generated sentences per move, grammatically broken, insight-free. §5(d) |
| **Checkpoint modal** | Silently eats every click on a fully-visible board and rail; two live-looking boards at prediction checkpoints. §6(1)(2) |

### BUILT, GATED OFF — 1 item, and it is the whole product
| Item | Evidence |
|---|---|
| **56 of 57 packs** | `PackRegistry.loadDefault` loads `content/drafts/` only when `NODE_ENV=development`; `compose.yaml` never sets it; `content/packs/` holds only `.gitkeep`. `make graduation-report`: **220 blocking blockers, zero graduable packs.** With `NODE_ENV=development` all 56 load and serve cleanly. §1 |

**This was the suspected category and it is confirmed.** The gate is not misbehaving. It is
refusing to serve 220 unresolved chess-truth blockers to a learner — which is law 8 working. The
product is broken *because the gate is correct and the content has not cleared it.*

---

## 8. The three things that would most change a user's first five minutes

**1. Ship more than one pack — as a disclosed draft channel, not by flipping `NODE_ENV`.**
Everything else on this page is downstream of the pack count. Six of eight surfaces are empty
states because there is one pack; the authored commentary is placeholder because that pack is a
schema fixture; the "compare two consequences" payoff has nothing worth comparing. The registry
already carries a `channel: "official" | "community"` distinction and the UI already renders the
badge — **a third disclosed value, or a `draft` channel surfaced behind an explicit "unreviewed
content" acknowledgement, gets 56 packs on screen without pretending they passed review.**
Alternatively, graduate 3–5 packs properly. Either is a decision for the owner; the current state —
correct gate, empty product, no message explaining it — is the one option that serves nobody.
*Proposed row **D482 💡** — "Production serves one schema fixture; the corpus is development-only
and zero packs are graduable."*

**2. Give the assistance ladder a default other than silence, and a preset row.**
`SILENT_ASSISTANCE` on all six profiles means a first-time user gets a chessboard with no
legal-move highlighting, no markers, no guidance, and 54 identical-looking switches to discover it
through. At minimum `boardLighting: "legal"` should be the floor for the `pack` and `position`
profiles. A three-button preset ("Quiet / Balanced / Show me everything") writing all six profiles
at once would collapse the entire screen's cognitive load. Fix the `label{display:grid}` checkbox
stacking in the same pass — it is one line and it is most of why the page reads as "dumped".
*Proposed row **D483 💡** — "The assistance ladder ships fully silent and unstyled."*

**3. Stop the drill screen speaking in internals, and make the modal's blocking visible.**
Three concrete edits, in descending value: replace `Run is terminal at node: run-<uuid>:node:4`
with a sentence, and stop showing "YOUR MOVE" once the run is over; dim or visibly disable the main
board and branch rail while the checkpoint sheet is open, so a swallowed click reads as "not now"
instead of "broken"; render `cross_phase` as "cross-phase" and fix `Branches1 branches`. These are
the three moments where a user concludes the app is unfinished, and none of them is a deep change.
*Proposed row **D484 💡** — "The drill screen speaks in internals and the checkpoint modal blocks
silently."*

---

## 9. Document defects found on the way

Recorded because they are cheap to fix and they are why the gap went unnoticed. **Not written to
any ledger or design doc — law 5.**

1. **`/settings` is not display-only.** `design/03-product-breadth.md` B1 and
   `planning/exploration/gates.md` both still carry that residual; **`D311 🐞` already corrected it**
   and `D397 ✅` closed the axis gap. Two intent documents contradict their own ledger.
2. **`gates.md:139` declares "B1–B11 all green"; `design/03` never declares completion**, and B4's
   own status cell lists two unmet residuals. `planning/traceability-forward.md:309-310` already
   flags this as false and unmirrored.
3. **`gates.md`'s section title says `(B1–B8)` over a table carrying B1–B11**, and B6's mirrored
   gate wording still names *review* (struck by owner ruling 2026-08-13) and *session-distill*
   (corrected as nonexistent in the adjacent cell).
4. **`planning/campaign-research-queue.md:3`** — *"Nothing here may become an RFC yet"* — is stale;
   `design/06-campaign.md` was written after it.
5. **The gate rows cite specifications, not executions.** Every B-row's evidence is an RFC slug (or,
   for B6, a Makefile target; for B8, nothing). A Playwright suite *does* exist —
   `tests/browser/drill.spec.ts` is 52 KB — so the claim that no e2e harness exists is wrong. **But
   `playwright.config.ts` starts its server with `NODE_ENV=development … DRAFT_PACK_FILE=schemas/fixtures/drill-pack/terminal-outcome.browser.json`.**
   **Every browser test that backs a breadth gate runs against a configuration `make up` cannot
   produce.** That is the mechanical reason 736 green tests and the owner's experience are both
   true: *the tests and the user are not running the same product.*
   *Proposed row **D485 🐞** — "The browser suite runs `NODE_ENV=development` with a draft fixture;
   no automated test ever exercises the production pack path."*

---

## 10. What I could not check

- Maia as the real opponent — `make up` is `ENGINE_MODE=mock`; I did not run `make up-engines`.
  Every evidence number in this report is therefore a mock's `+0.00` `[UNCHECKED]`.
- Live/multiplayer with two participants, Arena handoff, Twitch overlay — single-session only.
- PWA install, offline, and mobile hardware behaviour (I measured phone *viewport* geometry only).
- The Create studio write path beyond rendering — I did not author or register a pack.
- Accessibility beyond noting a skip-link, `aria-current`, `aria-live` and `aria-modal` are present.

---

## 11. Concurrency note

This audit began at `790a4de` and finished at `60168d5` — **a concurrent session landed five commits
while it ran** (`d054049` routing 289 ledger rows into batches, `cb808eb` "fix(dev): launch persisted
stack and reload auth routes", and three queue/ledger commits), and claimed **D479** and **D480**.

The running container was built from the tree at `make up` time. **I re-verified every load-bearing
fact against the final HEAD before writing this:** `compose.yaml` still sets no `NODE_ENV`;
`content/packs/` still holds only `.gitkeep`; `pack-registry.ts:333` still gates drafts on
`options.development === true`; `/packs` still returns exactly one `schema_example`; and the
*"`/settings` remains display-only"* residual is still present at `design/03-product-breadth.md:297`
and `planning/exploration/gates.md:152`. All findings hold on current HEAD.

One item to be aware of: `cb808eb` touches dev stack launch and auth routes, so the sign-in wall and
persisted-stack behaviour I observed may already have moved. My §6 UI findings were taken before it
landed.
