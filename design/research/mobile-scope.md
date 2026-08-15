# Mobile — scope, tolerate, or non-goal? (Q3)

**Question:** `planning/exploration/plan.md` Q3 — "is rewind/branch/compare usable on a
phone, and is mobile-web (PWA) good enough?" Working default since the plan was written:
"web-first, responsive; mobile-native remains a non-goal until an explicit reversal here"
(`planning/exploration/plan.md:109-118`, mirrored in `design/02-product-shape.md:83-86`).

**Verdict in one sentence: tolerate — responsive-only, with a stated floor of *the run
loop on a phone, the whole surface on a tablet-and-up*, and the floor is currently unmet
in the 720–992 px band, which is the one thing worth fixing; mobile-native stays a
non-goal.**

**Status of the evidence.** This is a desk question and I am saying so, per AGENTS.md
("hands-on beats desk research"). Three kinds of claim appear below and are labelled
separately:

- **`[V]` code-verified** — read in the shipped tree at the cited `file:line`, or
  measured in a headless-Chromium geometry harness that reproduces the shipped CSS rules
  verbatim (Appendix A; the harness lived in `/tmp/q3-geom`, is disposable per the
  `rfc/0000-rfc-process.md` exploration-gate rule, and is reproducible from the appendix).
- **`[P]`** — arithmetic over verified constants, or inherited desk research from an
  existing dossier.
- **`[M]`** — reasoning with no external evidence.

**What was NOT done, and it matters:** nobody used the app on a phone. No real device, no
real hand, no real thumb, no Maia over a cellular link. Every usability judgement below is
geometry and code reading, which can prove a board is 374 px and cannot prove the loop
feels good. The one thing that would settle Q3 properly is one owner run of a real pack on
a real phone; that is the standing recommendation in §6.

---

## 1. What actually ships today

The archived `rfc/archive/polish-surfaces.md` (wave claim #1, 2026-08-14) is the only RFC
that touched this. Its §2 promised a responsive region transformation, §4 a manifest-only
PWA. Comparing intent to tree:

| Claimed in the archived RFC | Shipped state | Evidence |
|---|---|---|
| Compact breakpoint at 720 px (`@media (max-width: 719px)`) | **shipped**, five blocks: shell, app, drill, settings grid, plus `62rem`/`60rem`/`50rem`/`760px` predecessors | `ShellFrame.svelte:200`, `App.svelte:904`, `DrillScreen.svelte:1351`, `AssistanceSettings.svelte:73` `[V]` |
| Shell nav "collapses to a **menu button**" (`polish-surfaces.md:169-171`) | **deviation** — nav becomes a full-width horizontally scrolling row (`nav{display:flex;overflow-x:auto}`, `order:3`), never a menu button. `docs/app-shell.md:141-143` documents the shipped behaviour ("a compact scrolling menu"), so the doc is right and the RFC text is the stale one | `ShellFrame.svelte:139-142,200-204` `[V]` |
| Drill renders four region tabs: Timeline, Branches, **Evidence**, **Session** | **half shipped.** All four buttons render (`DrillScreen.svelte:740-745`), but only two are wired: `class:compact-active` exists on `.rail-stack` (Branches) and `.timeline-row` (Timeline) and nowhere else. `compactTab` is read in exactly four places in the file | `DrillScreen.svelte:158,741-744,814,847` `[V]` |
| Compare "renders its board pair stacked with the difference list as a tab" (`polish-surfaces.md:180`) | **not shipped.** `CompareView.svelte` contains **zero** `@media` rules; its board band is an N-column grid at every viewport | `CompareView.svelte:128` (0 matches for `@media`) `[V]` |
| `/live` simul wall stacks single-column | **shipped** (`.live-wall{grid-template-columns:1fr}`, mini-board 5 rem) | `App.svelte:907-909` `[V]` |
| Manifest + installability, no service worker | **shipped**: `apps/web/public/manifest.webmanifest`, linked from `apps/web/index.html`, `display: standalone`; no SW anywhere | `apps/web/index.html:7`, browser assertion `tests/browser/drill.spec.ts:899` `[V]` |
| New `tests/browser/responsive.spec.ts` | **shipped under a different name** — one test, `"mobile shell, settings, and install manifest preserve the run regions"`, at the end of `drill.spec.ts` | `tests/browser/drill.spec.ts:878-901` `[V]` |

Two findings from that comparison are load-bearing and neither is in any doc.

### 1a. The phone viewport assertion cannot fail

`drill.spec.ts:893-894` asserts, at 390×844, that
`document.scrollingElement.scrollHeight <= clientHeight + 1`. The shipped global CSS is
`html, body, #app { height: 100%; overflow: hidden }` (`App.svelte:849`), plus
`:global(#app){position:fixed;inset:0}` below 719 px (`App.svelte:905`) `[V]`.

Measured in the harness with those exact rules and a 5000 px child: `scrollHeight` = 844,
`clientHeight` = 844, assertion **passes**; with the rules removed, 5000 vs 844, assertion
fails `[V]` (Appendix A2). So the assertion is a regression guard on the global
`overflow:hidden` rule and **nothing else** — it cannot detect a board pushed out of view,
a clipped region, or an unreachable control. The *desktop* projection compensates by also
asserting the board's bounding box is inside the viewport and above the timeline
(`drill.spec.ts:866-874`); the phone test has no bounding-box assertion at all.

Consequence: `docs/app-shell.md:140-143`'s "the board remains visible" at compact width is
an unasserted claim. Arithmetic says it is probably false once a region tab is open — see
§2b `[P]`.

### 1b. The tablet band is the worst band, not the phone band

There are two independent breakpoints in the drill, and they do different things
(`DrillScreen.svelte:1323-1377`) `[V]`:

- **≤ 62 rem (992 px)**: `.drill-region{overflow:auto}`, `.drill{height:auto;overflow:visible}`,
  `.workspace{grid-template-columns:1fr}`, `.timeline-row{max-height:none;overflow:visible}`.
  The fitted, viewport-contained grid is abandoned; board, branch rail and timeline stack
  into one internally scrolling column, board up to 42 rem.
- **≤ 719 px**: adds the compact tab strip and `display:none` on the two stacked regions,
  which re-contains the layout by *hiding* things.

So the band **720–992 px — iPad portrait (768 px) sits in the middle of it** — loses
viewport containment and does not get the tabs that pay for it. That is exactly the shape
the owner rejected in the 2026-08-11 walkthrough: "the drill scrolls like a document"
(`design/BACKLOG.md:355`) `[V]`. No browser projection covers this band: the suite tests
1280×720, 1440×900 and 390×844 (`drill.spec.ts:824-826,881`) `[V]`. The tablet is the
viewport nobody looked at, and it is also the viewport that any honest "non-goal with a
floor" answer would name as the floor.

### 1c. Documentation drift found in passing

`design/03-product-breadth.md:288` still lists B8's residuals as "PWA transformation,
settings controls". Both shipped in `polish-surfaces` (manifest at `apps/web/index.html:7`;
real form controls in `AssistanceSettings.svelte`, exercised by
`drill.spec.ts:880-884`) `[V]`. `design/research/adoption-audit.md:217-218` inherits the
same stale statement ("our PWA transformation is an open B8 residual"). Design tier is
owner tier; flagged here for claude, not edited.

---

## 2. The interaction question, surface by surface

The loop is commit → play the consequence → **rewind** → branch → **compare**. Each verb
lands in a different region (`design/05-in-run-experience.md:44-61`), so the question
decomposes cleanly.

### 2a. Measured geometry (the eight-board hard case)

`MAX_COMPARISON_BRANCHES = 8` (`packages/runtime/src/compare.ts:15`), enforced both
client- and server-side, and `docs/n-way-comparison.md:17-19` calls eight "a readability
cap, not a data integrity limit" `[V]`. The compare board band is
`grid-template-columns: repeat(var(--branches), minmax(15rem, 1fr))` with
`article{min-width:15rem}` inside `overflow-x:auto` (`CompareView.svelte:128`) `[V]`.
Branch groups use the same shape at 9 rem (`GroupPanel.svelte:128`) `[V]`.

Harness measurement of those exact rules (Appendix A1) `[V]`:

| Viewport | N | compare band content width | visible width | screens to pan | per-column board |
|---|---|---|---|---|---|
| 390×844 (phone) | 2 | 493 px | 342 px | **1.44** | 216 px |
| 390×844 | 4 | 998 px | 342 px | **2.92** | 216 px |
| 390×844 | 8 | 2010 px | 342 px | **5.88** | 216 px |
| 360×640 (small Android) | 8 | 2010 px | 312 px | **6.44** | 216 px |
| 768×1024 (iPad portrait) | 8 | 2010 px | 720 px | **2.79** | 216 px |
| 1280×720 (desktop) | 4 | 1088 px | 1088 px | 1.00 | 238 px |
| 1280×720 | 8 | 2010 px | 1088 px | **1.85** | 216 px |

Branch groups (9 rem cells) at 8 members: 1214 px content — 3.55 screens at 390 px, 1.12
even at 1280 px `[V]`.

Three things fall out.

1. **Eight-way compare does not fit the desktop projection the suite tests.** 2010 px of
   content in 1088 px at 1280×720 is 1.85 screens of horizontal panning, and the aligned-ply
   stepper (`CompareView.svelte:62-72`) sits *below* the band, so stepping through the
   comparison means panning back each time. This is not a mobile defect that mobile
   exposes — it is a compare-scale defect, and mobile only makes it louder. It is the
   measured form of the owner's own "if you make 9 branches it becomes cumbersome"
   (`design/BACKLOG.md:269`) `[V]`.
2. **Column width has a hard floor of 240 px** (15 rem `min-width`), so the grid never
   adapts: on every viewport from 360 px to 1280 px an 8-way compare is the same 2010 px.
   Nothing in the CSS reads the viewport.
3. **The mitigation already exists in the tree, one component over.** `GroupPanel` ships a
   three-band semantic zoom — Overview / Summary / Boards (`GroupPanel.svelte:22,90-93,99-116`)
   — which is exactly the "cells render *different content* by scale" answer the ledger
   reached in `design/BACKLOG.md:313` `[V]`. Compare has no equivalent. (Note the zoom
   changes cell *content*, not the 9 rem column floor, so it reduces the reading load per
   cell without reducing the panning `[V]`.)

### 2b. Does the run itself survive a phone?

Board size below 719 px is `min(100%, calc(100dvh - 21rem), 30rem)`
(`DrillScreen.svelte:1376`) `[V]`. At 390×844 the width term binds: the drill is
`min(100% - 1rem, 86rem)` = 374 px, so the board is **374 px — 46.75 px squares** `[P]`
(arithmetic over verified constants). That is a real, playable board; the input layer is
Lichess's own chessground (`Chessboard.svelte:2-10`) `[V]`, which is the board shipped in
Lichess's touch clients `[M]`.

But the 21 rem (336 px) vertical reserve is not what actually remains: 844 − 374 = 470 px
of chrome budget, spent on shell top bar + wrapped nav row (≈ 92 px), drill top bar and
status (≈ 70 px), objective heading at `clamp(1.4rem, 3vw, 2.4rem)` over up to 30ch (2–3
lines, ≈ 70–100 px), phase reading (≈ 20 px), the compact tab strip (≈ 34 px) and grid
gaps (≈ 40 px) — roughly 330–360 px, leaving **≈ 110–140 px for whichever region tab is
open** `[P]`. The Timeline region needs its 1 rem padding ×2, heading, a 44 px ply-chip
row, the "Rewind to preview" confirm button and a two-row quick-actions block: **≈ 230 px**
`[P]`. So opening a region tab overflows by ~100 px, `.drill-region{overflow:auto}` takes
the scroll, and the board is pushed above the fold. On iOS Safari with browser chrome
visible `100dvh` is smaller still, widening the gap `[M]`. Nothing asserts otherwise
(§1a).

**Where the loop's verbs live on a phone** `[V]`:

- *commit* — board, always visible. Fine.
- *rewind* — tap a ply chip (preview), then the "Rewind to preview" button
  (`Timeline.svelte:79-83`). Both live in the **Timeline tab**.
- *branch/fork*, *branch group*, *compare*, *replay*, *export* — all five are in
  `.quick-actions`, which is inside `.timeline-row` (`DrillScreen.svelte:847,867-882`),
  i.e. also behind the **Timeline tab**.
- *switch branch* — the **Branches tab**.
- *evidence* — the "Evidence" tab is inert; the structural/transition reading controls are
  in the always-visible position column and the assistance popover is a `<details>` in the
  top bar (`DrillScreen.svelte:690-708`), so evidence is reachable but not where the tab
  says it is.
- *session* — the "Session" tab is inert by construction: `viewerRole` is used only for
  permissions and to render the button (`DrillScreen.svelte:286,744`); there is no session
  region inside the drill at all (session controls live at `/live/session/:sessionId`).
  Its condition `viewerRole !== "host"` is also inverted relative to the RFC's intent — a
  solo run (default `"host"`) hides it, while a participant or spectator gets a tab that
  does nothing.

So on a phone the loop is a tab dance: commit on the board, switch to Timeline to rewind
or fork, switch to Branches to enter the fork, and compare takes over the whole region
(`DrillScreen.svelte:666-676` — `CompareView` replaces `<main class="drill">` entirely).
That is coherent, and every action is a visible control with no touch-only gesture, as the
RFC required — but two of the four advertised tabs do nothing, which is a shipped honesty
defect under the "absence is stated, never simulated" invariant
(`design/05-in-run-experience.md:39`) `[V]`.

### 2c. Touch-target floor

WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA, requires pointer targets of at least
**24×24 CSS px**, with a spacing exception based on a 24 px-diameter circle test `[V]`
(https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Timeline ply chips
clear it comfortably (3.8 rem min-width, 0.55 rem padding ≈ 44 px tall) `[V]`. The pivotal
marker does not: `width:1.1rem!important;height:1.1rem` = **17.6×17.6 px**
(`Timeline.svelte:180`), and the shape marker at `padding:.3rem .45rem` with a 0.65 rem
font is ≈ 23 px tall (`Timeline.svelte:179`) `[V]`. Both may survive on the spacing
exception; neither has been checked against it. Hover reliance is small and not a phone
problem: 5 `:hover` rules and 2 `title=` attributes across the whole client `[V]`.

### 2d. The verdict table

| Surface | Phone (≤ 719 px) | Why |
|---|---|---|
| Board + commit + objective | **survives** | 374 px board, chessground touch input, always visible `[V]`/`[P]` |
| Timeline + rewind + fork | **survives, degraded** — behind a tab, pushes the board above the fold | §2b `[P]` |
| Branch rail (switch, fold, compare-select) | **survives, degraded** — behind a tab; selection is checkboxes, which the walkthrough already called cumbersome on desktop (`README.md` row: "compare selection cumbersome") | `[V]`/`[P]` |
| Single-branch replay | **survives** | board + Space/Replay button `[P]` |
| **2-column compare** | **marginal** — 1.44 screens of horizontal pan, 216 px boards | measured `[V]` |
| **4–8-column compare** | **not phone-shaped** — 2.9–5.9 screens of pan, stepper off-screen, and it already fails at 1280×720 | measured `[V]` |
| **Branch groups ≥ 4 members** | **not phone-shaped** — 3.6 screens at 8 members | measured `[V]` |
| Live simul wall | **survives** — single column, 5 rem mini-boards | `App.svelte:907-909` `[V]` |
| Live session detail (members/proposals/votes/invitations/Arena legs/journal) | **not phone-shaped** — a multi-panel console with no compact rule of its own | `[M]` from `docs/app-shell.md:25` |
| `/live/overlay/:runId` | **survives / not applicable** — a stream projection, single region, `grid-template-columns:1fr` at ≤ 719 px | `App.svelte:911` `[V]` |
| Pack studio / create (`.studio-grid`) | **survives geometrically, not shaped for it** — collapses to one column; authoring is a 43.5 min/pack desk activity (`pack-authoring-cost.md`) | `[V]`/`[M]` |
| Settings, Library, Review, Learn lists | **survives** — `.shell-view{overflow:auto}` gives every shell view its own scroller | `App.svelte:859` `[V]` |
| **The whole surface at 720–992 px (tablet portrait)** | **worse than the phone** — document-shaped drill, no tabs, untested | §1b `[V]` |

The pattern is the honest headline: **everything that is one board survives a phone;
everything that is N boards does not** — and the N-board surfaces are precisely the ones
carrying the product's original claim (`design/00-thesis.md`, comparison of preserved
attempts). Mobile does not break the loop; it breaks the *comparison*, which is the half
the product exists for.

---

## 3. What competitors do

Cited from dossiers already in this repo; no new external research this pass. Chess.com's
and Lichess's traffic split is widely assumed to be mobile-majority, and I have **no
sourced figure**, so no number is asserted here `[M]`.

- **The band we serve lives on phones, and the closest competitors are native.** Dr. Wolf,
  Take Take Take and ChessMind AI are native apps; the adoption audit already lists mobile
  as one of five places we are weaker than the incumbents (`adoption-audit.md:217-218`)
  `[P]`. Chessbook is web + iOS/Android with 2,000+ App Store ratings — and its unit is a
  *card*, which is exactly the phone-shaped unit (`teardown-chessbook-desk.md:27,30`) `[P]`.
- **The strongest counter-datum is Lichess's own mobile client.** The #1 complaint about
  the new Lichess app is *missing features* — learn-from-mistakes, tournaments, interactive
  studies, request-analysis (`coverage-sweep-2-notability.md:158-164`, forum + review
  sources) `[P]`. The incumbent with the best branching-study tool in chess shipped a phone
  client **without** the study surfaces, took the complaints, and still shipped it that way.
  That is the market's answer to "does branching study go on a phone" `[M]` as
  interpretation.
- **En Croissant's maintainer on mobile: "not an easy task"**
  (`quickpass-wintrChess-encroissant-chessmonitor.md:53`) `[V]` — the desktop-workbench
  shelf, which is where our compare surface actually sits.
- **The PWA route is proven on our exact stack.** Chess Endgame Training is an
  Ionic/TypeScript PWA using chess.js + chessground — the same board library we ship
  (`competitor-value-props.md:17-24,194`) `[V]`. So "mobile-web is good enough" is
  answered for the *play* half: a free, self-hosted, browser-engine PWA is a demonstrated
  shape.
- **And a caution about that same product:** the owner's original "slow / poor UX"
  impression of CET may itself have come from mobile — `teardown-cet.md:23-24,52` records
  that the hands-on pass was desktop-only and lists "mobile/PWA feel" as untested `[V]`.
  The one competitor we have touched by hand is untested on the exact axis Q3 asks about.
- **Chess.com's play-from-position route on mobile is a different feature name**
  ("Finish vs Bot" rather than the website's Set Up Position → Practice vs Computer chain),
  and mobile parity for the Self-Analysis → Practice chain is explicitly unverified
  (`teardown-chesscom-desk.md:11`, `teardown-chesscom-platform-desk.md:233`) `[P]` — i.e.
  even the largest player ships a *reduced, renamed* re-entry loop on phones.

Market summary: phones win where the unit is one board and one decision (play, puzzles,
cards, following games). Every product whose unit is a *tree* — Lichess studies, En
Croissant, ChessBase-shelf tools — is desktop-first, and the one that tried shipping a
phone client shipped it with the tree features removed `[P]`/`[M]`.

---

## 4. The honest cost of each option

Costs are expressed as work *shape*, not hours — this repo's one measured authoring/
implementation datapoint (`pack-authoring-cost.md`) does not generalise to client work, and
inventing hours would be worse than saying so `[M]`.

**(a) Phone-first — a program, comparable to a B-row.** Requires: a compare surface with a
different interaction model (one board + swipe/step between branches, or semantic zoom
ported from `GroupPanel`); branch rail and evidence as bottom sheets; a touch-target sweep;
a service worker and read-only offline cache (deliberately excluded by
`polish-surfaces.md:307-325`, and *offline write is structurally refused* by the hosted
multi-user lease model — `design/02-product-shape.md:50-53`); cellular-latency work against
the ~580 ms Maia per-selection budget (`docs/engine-workers.md:270`) `[V]`; and, if "app"
means store presence, native packaging, which `docs/app-shell.md:217` currently defers.
**Nothing in the evidence base justifies this today**: Q1b (do learners want this at all)
is still 💡 advisory, and phone-first would re-shape the one surface — compare — that
carries the differentiator.

**(b) Responsive-tolerable — one RFC.** Fix the 720–992 px band (either extend the compact
tabs upward or restore the fitted grid downward); wire or remove the two dead tabs; make
the compare column budget viewport-aware (or port `GroupPanel`'s semantic zoom, which also
fixes the desktop 8-column overflow); a touch-target pass on the two sub-24 px markers; add
a 768×1024 projection and a real bounding-box assertion to the phone browser test. Most of
this is not "mobile work" at all — it is compare-scale work that the ledger already wants
(`design/BACKLOG.md:269,313`).

**(c) Non-goal with a stated floor — small.** State the floor, make the refused surfaces
say so honestly (the `HonestControl` "disabled controls carry a reason" convention already
exists, `docs/app-shell.md:187-197`), and add the tablet projection. Without a floor,
"non-goal" decays into "broken on phones by accident", which is where 1a/1b show we
currently are: the phone is nominally supported by an assertion that cannot fail, and the
tablet is not covered at all.

**Doctrine check — is Q3 redundant against an existing position?** No.
`design/02-product-shape.md:83-86` is the *open* platform section and names Q3 as its
owner; the only adjacent settled rulings are free/self-hosted with browser-pushed compute
(`02:` deployment, and `design/BACKLOG.md:340` browser-run engines — which *favours* the
PWA route), and hosted multi-user, which *forbids* offline writes. Neither answers Q3.

---

## 5. Verdict

**Tolerate — responsive-only. Mobile-native remains a non-goal. The floor is stated in two
tiers, and one tier is currently unmet.**

1. **Phone floor (≤ 719 px): the run loop, plus every read surface.** Commit, play the
   consequence, rewind, fork, switch branch, replay one branch, read evidence, resume, and
   browse Review/Library/Settings must work on a 360 px-wide phone. Compare is guaranteed
   to **two columns only**. This is roughly what ships; the gaps are the two inert tabs and
   the unasserted board-in-viewport claim.
2. **Full-surface floor: 768 px and up (tablet portrait).** The whole surface — N-way
   compare, branch groups, live session detail, create — is designed for tablet-and-up.
   **This floor is currently NOT met**, because 768 px sits inside the 720–992 px band that
   loses the fitted grid without gaining the tabs (§1b). Fixing that band is the single
   highest-value item this dossier produces.
3. **Explicitly not phone-shaped, and they should say so rather than degrade silently:**
   4–8-column compare, branch groups of 4+ members, live session detail, pack studio
   authoring. "Say so" means the honest-absence convention already in the shell, not a
   blank screen and a 6-screen horizontal pan.
4. **Not a mobile problem at all:** 8-way compare overflows 1280×720 by 1.85 screens.
   Whatever is built for compare scale (`BACKLOG:269` pruning ruling, `BACKLOG:313`
   semantic zoom) fixes the phone case as a side effect. **Do the compare-scale work; do
   not do "mobile work".**

**What would change this verdict:**

- **Scope it (phone-first)** if Q1b returns evidence that target learners are
  phone-primary for rehearsal rather than for play — the adoption audit's "the band we
  serve lives on phones" is currently an assertion, not a measurement
  (`adoption-audit.md:218`).
- **Scope it** if the campaign/gamification program (`design/BACKLOG.md:263,265`) ships and
  turns runs into short, repeatable, budgeted encounters — that is the "short, repeatable,
  tactile" session shape the plan says was never examined, and it is genuinely
  phone-shaped `[M]`.
- **Reopen the compare half** if semantic zoom lands on compare: with an overview band that
  renders result/structure/objective instead of a board, the 8-column case stops being a
  panning problem and phone compare becomes arguable.
- **Harden to non-goal-with-floor** if a hands-on phone session shows the tab dance in §2b
  breaks the loop's rhythm — that is a felt-experience judgement no geometry can make.
- **Nothing here touches mobile-native.** Reversal would need an evidence path this
  dossier found no start for; the PWA/WASM route (`BACKLOG:340`, CET as proof) reaches the
  same users without a store.

---

## 6. Findings for the ledger (report-only; BACKLOG and gates are owner/claude tier)

1. 🐞 **Two inert region tabs.** "Evidence" and "Session" render at ≤ 719 px and bind to
   nothing; selecting either hides Timeline and Branches and shows nothing in their place.
   Session is dead by construction (no session region exists in the drill) and its
   `viewerRole !== "host"` condition is inverted relative to the RFC's intent.
   `DrillScreen.svelte:741-744,814,847`. Honesty-invariant defect, not cosmetic.
2. 🐞 **The 720–992 px band loses viewport containment without compensation.** iPad
   portrait gets the rejected document-shaped drill. `DrillScreen.svelte:1323-1349`; no
   browser projection covers it.
3. 🐞 **The phone viewport assertion is vacuous** (measured): global `overflow:hidden` plus
   `#app{position:fixed}` make it unfailable. Needs the desktop test's bounding-box
   assertions to mean anything. `drill.spec.ts:893-894` vs `:866-874`.
4. 💡 **Compare has no viewport awareness and no semantic zoom**, while `GroupPanel` ships
   a three-band zoom one component away. 8 columns = 2010 px on every viewport including
   1280×720. Feeds `BACKLOG:313`.
5. 🐞 **Sub-24 px touch targets**: pivotal marker 17.6 px, shape marker ≈ 23 px
   (`Timeline.svelte:179-180`) against WCAG 2.2 SC 2.5.8 AA.
6. 📄 **Doc drift**: `design/03-product-breadth.md:288` (B8 residuals) and
   `adoption-audit.md:217` still call PWA transformation and settings controls
   outstanding; both shipped in `polish-surfaces`.
7. 🔬 **The standing residual, and it is the whole hands-on gap**: one owner run of a real
   pack on a real phone and on a real tablet. Everything above is geometry. The README
   coverage row for branch/compare comprehension already lists phone as GAP; this dossier
   closes the *geometry* half of it and leaves the *comprehension* half exactly where it
   was.

---

## Appendix A — the geometry harness

Disposable research instrument under `rfc/0000-rfc-process.md` §Exploration gate, tied to
Q3. It ran outside the repo (`/tmp/q3-geom`), wrote nothing into `apps/` or `packages/`,
and drove the repo's already-installed headless Chromium via
`node_modules/.pnpm/playwright-core@1.62.1`. It measures **the shipped CSS rules**, copied
verbatim, in a synthetic DOM — not the running application. That is the honest boundary of
every `[V]` geometry claim above: the rules are the shipped rules and the numbers are real
browser layout, but a component tree could add constraints the harness does not see.

**A1 — compare/group grid.** Rules under test, verbatim from `CompareView.svelte:128` and
`GroupPanel.svelte:128`:

```css
.boards { display:grid; grid-template-columns:repeat(var(--branches,2), minmax(15rem,1fr));
          gap:.8rem; overflow-x:auto }
.boards article { min-width:15rem; padding:.7rem; border:1px solid }
.canvas { display:grid; grid-template-columns:repeat(var(--members), minmax(9rem,1fr));
          gap:.55rem; overflow:auto }
.canvas article { min-width:9rem; padding:.5rem; border:1px solid }
```

nested in `.shell-view{width:min(100% - 1rem,70rem)}` (the ≤ 719 px rule, `App.svelte:906`)
and `.compare{width:min(96rem,calc(100% - 2rem))}`. Reported per viewport × N ∈ {2,4,8}:
`clientWidth`, `scrollWidth`, column width, inner board width, and screens-to-pan =
`scrollWidth / clientWidth`. Results in §2a.

**A2 — assertion vacuity.** Three documents at 390×844, each containing a 5000 px child,
measuring `document.scrollingElement.scrollHeight` vs `clientHeight`:

| Case | scrollHeight | clientHeight | `scrollHeight <= clientHeight+1` |
|---|---|---|---|
| shipped globals (`html,body,#app{height:100%;overflow:hidden}`, `body{min-height:100vh}`) | 844 | 844 | **passes** |
| shipped globals + `#app{position:fixed;inset:0}` (the ≤ 719 px rule) | 844 | 844 | **passes** |
| control: no overflow rules | 5000 | 844 | fails |

---

## Sources

Living/repo: `planning/exploration/plan.md:109-118`; `design/02-product-shape.md:50-53,83-86`;
`design/03-product-breadth.md:248,270-272,288`; `design/05-in-run-experience.md:21-61`;
`design/BACKLOG.md:263,265,269,313,331,340,355`; `docs/app-shell.md:125-158,187-197,199-218`;
`docs/n-way-comparison.md:1-19`; `docs/engine-workers.md:270`;
`rfc/archive/polish-surfaces.md:158-190,306-325,357-364`;
`design/research/adoption-audit.md:217-218`; `design/research/competitor-value-props.md:17-24,194`;
`design/research/coverage-sweep-2-notability.md:158-164`;
`design/research/quickpass-wintrChess-encroissant-chessmonitor.md:53`;
`design/research/teardown-cet.md:23-24,52`; `design/research/teardown-chessbook-desk.md:27,30`;
`design/research/teardown-chesscom-desk.md:11`;
`design/research/teardown-chesscom-platform-desk.md:233`.

Code (read 2026-08-15): `apps/web/index.html`; `apps/web/public/manifest.webmanifest`;
`apps/web/src/App.svelte:849,859,904-912`; `apps/web/src/lib/ShellFrame.svelte:139-142,190-204`;
`apps/web/src/lib/DrillScreen.svelte:158,286,666-676,740-745,814,847,867-882,1100-1108,1323-1377`;
`apps/web/src/lib/CompareView.svelte:44-72,128`; `apps/web/src/lib/GroupPanel.svelte:22,90-116,128`;
`apps/web/src/lib/Timeline.svelte:53-83,127-180`; `apps/web/src/lib/Chessboard.svelte:1-10`;
`apps/web/src/lib/AssistanceSettings.svelte:73`; `packages/runtime/src/compare.ts:15`;
`apps/server/src/service.ts:973-988`; `tests/browser/drill.spec.ts:821-901`;
`playwright.config.ts:15`.

External: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (fetched
2026-08-15).
