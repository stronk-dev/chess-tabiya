# RFC: Client surface floor — the tablet band, and two shipped controls that lie

- **Status:** draft (awaiting cross-review)
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/02-product-shape.md:81-86` (Platform — OPEN, exploration Q3);
  `design/05-in-run-experience.md:41` (the *"Absence is stated, never simulated"*
  invariant) and `:44-61` (the five regions, of which **Evidence** is region 4 and
  **Session** is region 5); `design/03-product-breadth.md` B8. Ledger rows shipped by
  this RFC, **cited by title** because D-numbers are not stable across the ledger's
  reordering: **"The phone-viewport browser assertion cannot fail."**, **"Two of four
  compact region tabs are inert, and one is dead by construction."**, and the tablet
  half of **"Q3 answered: tolerate mobile, and the TABLET floor is the unmet one"**.
  Explicitly **not** shipped here: **"Eight-way compare overflows the DESKTOP
  projection, not just phones."** — see §8.
  *Every code site below is cited **by symbol name or by CSS selector**; line numbers
  are advisory. The tree moved during the drafting of `fixture-realism.md` this
  morning and will move again. Locate `compactTab`, `.drill-region`, `.board-frame`,
  `.pivotal-marker` and the two `@media` blocks by name, not by number.*
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md`
  §Exploration gate). This RFC is opened by the **Q3 answer of 2026-08-15**
  (`design/research/mobile-scope.md`), whose verdict is *tolerate — responsive-only,
  mobile-native stays a non-goal*, with a two-tier floor of which **the upper tier is
  unmet**.
- **Depends on:** `rfc/archive/polish-surfaces.md` (shipped the compact breakpoint, the
  four region tabs and the mobile browser test this RFC repairs);
  `rfc/archive/app-shell.md` (owns the viewport and region model in
  `docs/app-shell.md:125-158`, whose "the board remains visible" promise §4 makes
  assertable); `rfc/fixture-realism.md` (in flight — §4a states this RFC's
  can-it-fail rule as an **extension of that RFC's F1**, not a parallel invention).
- **Parent / amends:** amends the drill client's two responsive `@media` blocks, one
  nav element, one marker's size, and one browser spec. Introduces **no new subsystem,
  no persisted state, no format change, no new product surface, and no new route.**
- **Supersedes / superseded by:** —
- **Planning:** `planning/client-surface-floor/` (once implementing)

## Register claim

**This RFC claims nothing versioned. Loudly, because it is worth saying plainly: the
whole thing is CSS, one Svelte nav, and one Playwright spec.**

No pack schema version (**0.20 landed; 0.21 and 0.22 landed or are claimed; 0.19 is
frozen shut** by `rfc/archive/transition-primitives.md` and is not available to anyone).
No run schema version — **run 0.15 and migration 20 are claimed contingently by
`engine-request-contract.md`** and this RFC neither wants nor touches them. No
shape-entry schema version, no migration number, no `$id` change, no new event, no new
persisted field, no new HTTP route, no new `ServerErrorCode`, no new `SourcingError`
code, no cross-draft ownership pin.

It touches exactly four kinds of thing: **`apps/web` component styles**, **one Svelte
markup element**, **one Playwright spec file**, and **`docs/app-shell.md`** (on
implementation, not in this draft). Nothing here has to negotiate landing order with
`live-marker-quality.md`, `engine-request-contract.md`, `fixture-realism.md`, or any
recent wave. It can land in any order relative to all three.

The one coordination note that is not a register claim: **`apps/web/src/` and
`tests/browser/` are the shared resource here**, and a compare-geometry draft (§8) will
touch `CompareView.svelte` in the same tree. The two files are disjoint —
`CompareView.svelte` contains **zero** `@media` rules today (verified: `grep -c @media`
returns 0) and this RFC adds none.

## Summary

Q3 was answered on 2026-08-15: **tolerate mobile, responsive-only, mobile-native stays
a non-goal**, with a two-tier floor — the run loop and every read surface on a phone,
the whole surface at 768 px and up. The upper tier is **unmet**, and the reason is
counter-intuitive: the tablet is worse than the phone. Between **720 px and 992 px** —
iPad portrait sits at 768 px, in the middle of it — the drill loses the fitted,
viewport-contained grid at the `max-width: 62rem` breakpoint without gaining the compact
region tabs at `max-width: 719px`. What is left is the document-shaped drill the owner
rejected in the 2026-08-11 walkthrough. No browser projection covers that band, which is
why nobody saw it.

Alongside it sit two measured client defects with no other home. The phone browser
assertion **cannot fail** — a shipped global `overflow` rule makes its subject constant,
so it is a regression guard on that rule and nothing else, and `docs/app-shell.md`'s
promise that *"the board remains visible"* is unasserted at every viewport, not only on
phones. And two of the four compact region tabs render and do nothing, one of them
behind an inverted role condition — which is an honesty-invariant defect, not a
cosmetic one.

This RFC specifies **C1–C8**: the floor restated normatively (§1), the tablet band
(§2), containment and a board sized from its slot rather than from a hand-tuned
viewport reserve (§3), a phone assertion that can fail and **is demonstrated failing**
(§4), the two tabs — one wired, one removed (§5), the touch-target floor including one
correction to the dossier (§6), and the projection matrix (§7). §8 draws the scope
boundary against compare geometry and names the dependency.

## Motivation

### The band nobody looked at

There are two independent breakpoints in `DrillScreen.svelte`'s `<style>` block and
they do different things `[V]`:

| Block | What it does |
|---|---|
| `@media (max-width: 62rem)` (992 px) | `.drill-region{overflow:auto}`, `.drill{height:auto;min-height:100%;overflow:visible}`, `.workspace{grid-template-columns:1fr;grid-template-rows:auto;overflow:visible}`, `.timeline-row{max-height:none;overflow:visible}`, `.position-column{overflow:visible}`, `.board-frame{width:min(100%,42rem)}`. **The fitted grid is abandoned; the drill becomes a document.** |
| `@media (max-width: 719px)` | Adds `.compact-tabs{display:flex}`, `.rail-stack,.timeline-row{display:none}` with a `.compact-active` escape, and `.board-frame{width:min(100%,calc(100dvh - 21rem),30rem)}`. **Re-contains the layout by hiding two of the three regions.** |

So 720–992 px pays the first block's cost and receives none of the second block's
compensation. `design/BACKLOG.md`'s row *"Viewport-contained desktop app shell"* records
the origin of the whole fitted-grid program as the owner's 2026-08-11 walkthrough
verdict — *"the drill scrolls like a document"*. That verdict is currently true again on
an iPad in portrait, and the reason it went unnoticed is in `drill.spec.ts`: the suite
projects **1280×720**, **1440×900** and **390×844** and nothing between `[V]`.

### The assertion that cannot fail, and it is not only the phone one

`tests/browser/drill.spec.ts`'s test `"mobile shell, settings, and install manifest
preserve the run regions"` asserts, at 390×844:

```ts
const dimensions = await page.evaluate(() => ({ scrollHeight: document.scrollingElement!.scrollHeight, clientHeight: document.scrollingElement!.clientHeight }));
expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight + 1);
```

`App.svelte` ships `:global(html), :global(body), :global(#app) { height: 100%; overflow: hidden; }` — **unconditionally, outside any media query** — plus
`:global(#app){position:fixed;inset:0}` inside its own `@media (max-width: 719px)` `[V]`.
Because `#app` clips, `document.scrollingElement` never observes overflow, so the
assertion's subject is a constant.

`design/research/mobile-scope.md` Appendix A2 measured this at 390×844. **Re-measured
here across four viewports, with a board pushed 2000 px down the document under the
shipped globals `[V]`** (Appendix A):

| Viewport | `document.scrollingElement` scrollHeight / clientHeight | shipped assertion | board bounding box inside viewport |
|---|---|---|---|
| 1280×720 | 720 / 720 | **passes** | **fails** |
| 1440×900 | 900 / 900 | **passes** | **fails** |
| 768×1024 | 1024 / 1024 | **passes** | **fails** |
| 390×844 | 844 / 844 | **passes** | **fails** |

Two consequences, and the second is larger than the ledger row records.

1. The phone assertion detects nothing. It cannot see a clipped region, an unreachable
   control, or a board pushed out of view.
2. **The same assertion appears in the desktop test** `"every shell route owns the
   viewport at both desktop projections"`, where it runs over nine routes and is
   equally constant. Only the `runPath` iteration is saved, by the bounding-box block
   that follows it (`board!.y + board!.height <= timeline!.y + 1` and the four
   in-viewport comparisons). **Eight of the nine routes at both desktop projections are
   asserted by a constant.** `docs/app-shell.md:155-158` describes that assertion as the
   coverage that *"caught and prevented a real board/timeline overlap"* — the
   bounding-box half did that; the scrollHeight half has never been able to.

### A control that renders and does nothing

`DrillScreen.svelte` declares
`let compactTab: "timeline" | "branches" | "evidence" | "session" = $state("timeline")`
and renders four buttons inside `<nav class="compact-tabs" aria-label="Run regions">`.
`compactTab` is then read in exactly two binding sites: `class:compact-active` on
`.rail-stack` and on `.timeline-row` `[V]`. **Evidence and Session set the state and
nothing consumes it**; selecting either hides Timeline *and* Branches (both are
`display:none` unless `.compact-active`) and puts nothing in their place.

Session carries a second, independent defect. Its button is gated on
`{#if viewerRole !== "host"}`, while `viewerRole` defaults to `"host"`
(`DrillScreen.svelte`'s props destructuring) and `RUN_ROLES` is
`["host", "participant", "spectator"]` (`apps/server/src/storage.ts:32-33`) `[V]`. So a
solo run — the overwhelmingly common case, and the one with the most session state to
show — never sees the tab, while a participant or spectator, who has the *least* control
over the session, gets a tab that does nothing. The condition is inverted relative to
its own intent **and** the thing it gates is inert. These are two bugs, and fixing
either alone leaves a lie standing.

`design/05-in-run-experience.md:41` states the invariant: *"Absence is stated, never
simulated. If the product does not know, it says so. A confident wrong verdict costs
more than a visible gap, and the gap is recoverable."* A tab that advertises a region
the product does not have on that surface is a simulated presence. That is why this is
in an RFC and not a chore.

## Specification

### 1. C1 — the floor, restated normatively

`design/research/mobile-scope.md` §5 states the floor as a research verdict. This RFC
restates it as the contract the client is tested against. **It adds nothing to the
verdict and narrows nothing**; where the two disagree, the dossier is the intent and
this section is the bug.

> **C1a — phone tier (≤ 719 px).** The run loop and every read surface work: commit,
> play the consequence, rewind, fork, switch branch, replay one branch, read evidence,
> resume, and browse Review / Library / Learn / Settings. Compare is guaranteed to
> **two columns**. Everything else may be refused, but must be refused *out loud*.
>
> **C1b — full-surface tier (≥ 768 px).** The whole surface — the fitted drill grid
> with board, branch rail and timeline simultaneously visible; N-way compare; branch
> groups; live session detail; create — is designed for this tier and is asserted at
> it.
>
> **C1c — no viewport is document-shaped.** At every width, the drill region is *not*
> a page scroller. Overflow belongs to a named inner region, per
> `docs/app-shell.md:131-138`. This is the property the 2026-08-11 walkthrough bought
> and the `max-width: 62rem` block currently sells back between 720 px and 992 px.

C1c is the load-bearing clause. C1a and C1b describe *what* must work; C1c describes
*how*, and it is what makes C2 and C3 one change rather than two.

### 2. C2 — the tablet band gets the fitted grid, not tabs

The dossier offered two directions: extend the compact tabs upward, or restore the
fitted grid downward. **This RFC specifies the second**, on measured grounds.

> **C2.** The `@media (max-width: 62rem)` block in `DrillScreen.svelte` is **deleted**.
> Its containment-breaking rules are not retargeted to a narrower band; they are
> replaced by C3's compact-tier rules, which achieve containment by a different
> mechanism. The fitted two-column workspace
> (`grid-template-columns: minmax(0, 1fr) minmax(15rem, 0.38fr)`) therefore applies at
> every width above 719 px, and the compact tab tier applies at and below it.

**Why the fitted grid, and why it is not a squeeze.** The `.workspace` grid's rail
column has a floor of `15rem` (240 px) and the board column takes the remainder; the
board is additionally height-bounded by `.board-frame`'s
`width: min(100%, max(10rem, calc(100dvh - 34rem)), 40rem)`. The binding constraint on
that formula is **height**, and a portrait tablet is *taller* than either desktop
projection the suite already accepts. Measured over the shipped rule chain with the
`62rem` block deleted (Appendix B) `[V]`:

| Viewport | board (normal) | board (`.outcome`) | rail | board above timeline | region overflows |
|---|---|---|---|---|---|
| 720×1024 | **432 px** | 352 px | 240 px | yes | **no** |
| **768×1024** (iPad portrait) | **480 px** | 352 px | 240 px | yes | **no** |
| 810×1080 | 522 px | 408 px | 240 px | yes | **no** |
| 834×1194 | 546 px | 522 px | 240 px | yes | **no** |
| 992×768 | 224 px | 160 px | 260 px | yes | **no** |
| 1280×720 *(ships today)* | 176 px | 160 px | 339 px | yes | no |
| 1440×900 *(ships today)* | 356 px | 228 px | 375 px | yes | no |

Read the last two rows first: **the fitted grid already ships a 176 px board at
1280×720**, and the suite asserts that as correct. Tablet portrait under C2 is
**2.4× to 3.1× more generous than the desktop projection the product already accepts**,
with full containment and the branch rail visible beside the board. There is no
trade-off to argue about in portrait.

**The honest cost, stated rather than buried.** Short-and-wide viewports inside the
band — 992×768 and below, i.e. a landscape tablet or a half-height desktop window —
move from a 672 px board that scrolls to a 224 px board (160 px in the `.outcome`
variant) that does not. That is a real regression in board size, bought with
containment. Three reasons this RFC takes that trade and does not special-case it:

1. **1024×768 already behaves exactly that way today** (it is above `62rem`), measured
   at 224 px / 160 px `[V]`. C2 makes 992×768 consistent with its immediate neighbour
   rather than introducing a new behaviour.
2. C1c admits no exception. A second band with a second shape is how this defect was
   built the first time.
3. The 160 px floor is `max(10rem, …)` in the shipped `.board-frame` rule and is
   **below the C4 floor this RFC introduces**. §3 raises it, which is where that
   regression is actually paid off.

### 3. C3 / C4 — containment on the phone, and a board sized by its slot

Deleting the `62rem` block removes the phone tier's scroller too, so the compact tier
must supply its own containment. Today it does not: measured with the shipped rules at
390×844, the `.drill-region` overflows by **116 px** with the Timeline tab open and by
**88 px** at 414×896; at 360×640 it overflows by **250 px** with Timeline open and
**77 px** with Branches open `[V]` (Appendix C). The board happens to remain in the
viewport at initial scroll position because `.position-column` precedes the region
containers in DOM order — **so the dossier's §2b prediction that the board is pushed
above the fold is not what the geometry shows, and this RFC records the correction.**
What is below the fold is the timeline itself, and the drill region is a page scroller,
which C1c forbids.

> **C3.** In the `@media (max-width: 719px)` block, the drill region and the drill are
> contained (`.drill-region{overflow:hidden}`, `.drill{height:100%;overflow:hidden}`)
> and the workspace becomes a three-row fitted stack:
> `grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr) minmax(4rem, auto); overflow: hidden`
> — tab strip, position column, active region. **The active region is the scroller:**
> `.rail-stack.compact-active, .timeline-row.compact-active { display: grid; grid-template-columns: 1fr; min-height: 4rem; overflow: auto }`.
> `.position-column` stays `overflow: hidden`.

> **C4.** `.board-frame`'s hand-tuned viewport reserve is replaced by a size derived
> from the slot it actually occupies. `.board-slot` becomes a size container
> (`container-type: size`) and, **in the compact tier only**,
> `.board-frame { width: min(100cqw, 100cqh) }`. `.board-slot` carries
> `min-height: 12rem`.
>
> **The 12 rem floor is derived, not chosen.** A chess square is a pointer target: a
> 192 px board is 8 × 24 px squares, which is exactly WCAG 2.2 SC 2.5.8's minimum
> (§6). Below that floor the *primary control of the entire product* fails the same
> criterion §6 applies to two markers.

`21rem` and `34rem` are guesses about how much chrome sits above the board, and a guess
about a viewport reserve is wrong at some viewport by construction — that is the same
shape as `fixture-realism`'s open question 2 about an untestable tolerance constant. A
container query asks the layout instead of predicting it.

Measured with C3 + C4 applied to the shipped rule chain (Appendix C) `[V]`:

| Viewport | tab open | board | square | drill-region overflow | board in viewport |
|---|---|---|---|---|---|
| 390×844 | none / Timeline / Branches | 374 / 374 / 374 px | 46.8 px | **0 / 0 / 0** | yes |
| 414×896 | none / Timeline / Branches | 398 / 398 / 398 px | 49.8 px | **0 / 0 / 0** | yes |
| 430×932 | none / Timeline / Branches | 414 / 414 / 414 px | 51.8 px | **0 / 0 / 0** | yes |
| 360×740 | none / Timeline / Branches | 344 / 273 / 327 px | 34.1–43 px | **0 / 0 / 0** | yes |
| 360×640 | none / Timeline / Branches | 245 / **192** / 227 px | **24.0 px** | **0 / 0 / 0** | yes |

The worst supported case — a 360×640 Android phone with the Timeline region open —
lands *exactly* on the C4 floor: a 192 px board, 24 px squares, nothing scrolling that
should not. Without the `min-height: 12rem` floor the same case measures a **54 px
board (6.75 px squares)** `[V]`, which is why the floor is normative and not advice.

**Interaction with C2 that must not be lost:** C3's rules are scoped to
`max-width: 719px` and C2 deletes the `62rem` block, so the tablet band inherits the
base (desktop) rules unchanged. No third band exists, and none may be added without
amending C1c.

### 4. C5 — a phone assertion that can fail

#### 4a. The rule this is an instance of

`rfc/fixture-realism.md` §F1 governs assertions whose *subject is invented*. This
defect is the same family reached by a different route: the subject is real, but a
shipped rule makes it constant. **Stated as an extension of F1, not as a parallel rule,
and offered to that RFC to absorb if cross-review prefers a single home:**

> **F1b.** An assertion whose observed value cannot vary with the defect it names is
> not a test. Where a shipped rule pins the subject — a global `overflow`, a clamp, a
> constant-returning code path — the assertion is replaced by one whose subject the
> defect can move, and **the implementation demonstrates the replacement failing**
> before it demonstrates it passing.

The demonstration obligation is deliberately identical in form to `fixture-realism`'s
acceptance criterion 3 (*"This is demonstrated, not assumed — the implementation records
the observed failure"*). Two RFCs in flight on the same day about tests that cannot fail
should not invent two vocabularies for it.

#### 4b. What replaces `document.scrollingElement`

> **C5.** Both browser tests gain a shared `assertRunViewport(page, viewport)` helper
> asserting three things on a run route. The existing `document.scrollingElement`
> comparison is **retained** — it is a cheap, honest guard on the global `overflow`
> rule, which is a real rule worth guarding — but it is **no longer the only
> assertion at any projection**.
>
> 1. **Board box (C5-1).** The `Chessboard` bounding box satisfies `x >= -1`,
>    `y >= -1`, `x + width <= viewport.width + 1`, `y + height <= viewport.height + 1`.
>    This is the desktop test's existing block, lifted verbatim and applied at every
>    projection including the phone.
> 2. **Region containment (C5-2).** `.drill-region`'s `scrollHeight <= clientHeight + 1`.
>    The drill region is not a page scroller (C1c); the *active region* is, and it is a
>    different element.
> 3. **Board floor (C5-3).** The board's rendered width is `>= 192` px and its squares
>    are therefore `>= 24` px (C4, §6).
>
> On the desktop and tablet projections the helper additionally asserts
> `board.y + board.height <= timelineRow.y + 1` — the existing overlap guard. On the
> phone projection that comparison is **not** asserted, because the timeline is
> `display:none` unless its tab is active; the phone assertion instead runs C5-1
> through C5-3 **after** clicking each region tab in turn, which the shipped test
> already does for Branches and Timeline.

#### 4c. How I know it can fail — and which halves fail today

This is the whole point of the section, so it is answered three ways, in descending
order of strength.

**(i) Demonstrated failing, under the shipped globals `[V]`.** Appendix A renders a
document carrying the shipped `html, body, #app { height:100%; overflow:hidden }` and
the ≤719 px `#app{position:fixed;inset:0}`, containing a board pushed 2000 px down.
At all four viewports the incumbent assertion **passes** and C5-1 **fails**. The two
assertions are measured on the same document at the same instant and disagree, which is
the strongest available evidence that they are not the same assertion.

**(ii) C5-2 fails on the shipped tree right now, at every phone viewport `[V]`.**
Appendix C measures `.drill-region` overflowing by 116 px (390×844, Timeline), 88 px
(414×896, Timeline), 250 px and 77 px (360×640, Timeline and Branches). Adding C5-2
before C3 lands turns `make verify` red — which is the correct order, and the
acceptance criteria require the implementation to record that red run.

**(iii) The mechanism, stated so cross-review can attack it rather than trust it.**
The incumbent's subject is constant because a shipped CSS rule clips at `#app`, so
content height never propagates to `document.scrollingElement`. C5-1's subject is a
`getBoundingClientRect()` on an element inside that clip, and **no shipped rule pins
it**: it moves with every row of the workspace grid, with `.board-frame`'s width
formula, with the objective heading's line count, and with the compact tab selection.
C5-2's subject is the scrollHeight of the element that C3 makes `overflow:hidden` and
that the `62rem` block currently makes `overflow:auto` — the two states differ by
construction. C5-3's subject is a computed width whose formula this RFC changes.

**The honest caveat.** C5-1 evaluated at scroll-top on a phone proves *initial*
visibility, not visibility after the learner scrolls a region. That is why C5-2 exists
and is the stronger of the two: under C1c there is no scroll position at which the
board can leave, because the drill region does not scroll at all. **C5-1 alone would be
a weaker guard than it looks; C5-1 plus C5-2 is the pair that means something.**

### 5. C6 — Evidence is wired, Session is removed

The two tabs get **opposite** dispositions, and the reason is the same fact in both
cases: whether the region exists in the drill.

> **C6a — Evidence is wired.** The evidence region exists in the drill; it is simply
> not in a bindable container. `.reading-controls` (holding the `Structural reading`
> and `What changed on this move?` disclosures) currently sits inside
> `.position-column` and is always visible at compact widths. It gains
> `class:compact-active={compactTab === "evidence"}`, and the compact block gains
> `.reading-controls{display:none}` / `.reading-controls.compact-active{display:grid}`
> alongside the two existing pairs.
>
> The change is **compact-tier only** — at ≥ 720 px `.reading-controls` keeps its base
> `display:flex` and its position in the column, so no desktop or tablet layout moves.
> On a phone it becomes a fourth mutually-exclusive region, which is what the tab
> already claims, and it returns roughly 40 px of vertical budget to the board whenever
> Timeline or Branches is the active tab.
>
> **What Evidence does not become:** the assistance popover
> (`<details class="assistance-control">`) stays in the top bar and is not moved into
> the tab. It is a control over what the product is permitted to disclose, not a
> reading of this position, and moving a permission control behind a region tab is a
> change to `design/05-in-run-experience.md` §3's surface that no defect here
> justifies.

> **C6b — Session is removed.** Region 5 (*"Session and role controls"*,
> `design/05-in-run-experience.md:60-61`) has **no in-drill surface at all**: `grep`
> for `sessionId` and `live/session` in `DrillScreen.svelte` returns nothing `[V]`, and
> the controls live at `/live/session/:sessionId`. The `{#if viewerRole !== "host"}`
> button and the `"session"` member of `compactTab`'s union are deleted.
>
> **Removing an affordance the product does not have is the honest move**
> (`design/05-in-run-experience.md:41`). Building an in-drill session region is a
> product decision belonging to whoever owns Live, not a defect repair, and inventing
> one inside a bug-fix RFC would be the larger error.

> **C6c — the inverted condition is fixed, not dissolved, and the distinction is
> recorded.** C6b deletes the only site where `viewerRole` gates a *control*, so after
> C6b there is no inverted condition left to invert. **That is a real risk of masking
> and it is closed explicitly:** the implementation must not "fix" the tab by flipping
> the condition to `=== "host"` (which yields a dead tab for solo runs instead of a
> dead tab for spectators — the same defect, relocated), and must verify that
> `viewerRole`'s **other** consumer is correct. That consumer is
> `permittedAssistance({ …, role: viewerRole })`, whose result gates the human-split
> and corpus controls; it is read positively, not negatively, and it is **not** part of
> this defect. The acceptance criteria pin both halves separately so neither can be
> reported as fixed by the other.

> **C6d — a tab may not render without a binding.** A guard, in the same spirit as
> `fixture-realism` §F3a: a unit test over `DrillScreen.svelte`'s source asserts that
> every member of `compactTab`'s union literal appears in at least one
> `class:compact-active={compactTab === "…"}` binding. It fails today on `"evidence"`
> and `"session"`; after C6a and C6b it passes with three members. This is what stops
> the defect recurring the next time a region is added ahead of its container.

### 6. C7 — touch targets, in scope, with one correction

Q3 flagged this and this RFC takes it rather than deferring it, because C4 already
derives the board floor from the same criterion and splitting them would leave the
board floor unexplained.

**WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA** requires pointer targets of at
least **24 × 24 CSS px**, subject to a spacing exception based on a 24 px-diameter
circle test (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

**Measured from the shipped rules at a 16 px root font (Appendix D) `[V]`:**

| Target | Selector | Measured | SC 2.5.8 |
|---|---|---|---|
| Pivotal marker | `.pivotal-marker` in `Timeline.svelte` | **17.59 × 17.59 px** | **fails** |
| Shape marker | `.shape-marker` in `Timeline.svelte` | 120 × **24.08 px** | **passes** |
| Compact region tab | `.compact-tabs button` in `DrillScreen.svelte` | 64.67 × 29.78 px | passes |
| Timeline ply chip | `.timeline li > button` | 60.80 × 46.58 px | passes |

> **Correction to `design/research/mobile-scope.md` §2c and to the task that opened
> this RFC.** Both state **two** sub-24 px targets, putting `.shape-marker` at ≈ 23 px.
> It measures **24.08 px**: `0.65rem × 1.2` line box (12.48 px) + `0.3rem × 2` padding
> (9.6 px) + 2 × 1 px border. It clears the criterion by 0.08 px, and the value is
> font-family-independent because the line height is a unitless multiplier. **There is
> one violation, not two.** Recorded rather than quietly corrected, for the same reason
> `fixture-realism` records the D56 order-of-magnitude drift: a figure that changes
> between the measurement and the document citing it is this class of defect happening
> in prose. The 0.08 px margin also means `.shape-marker` fails under any root-font
> reduction, which C7c covers.

> **C7a.** `.pivotal-marker`'s `width: 1.1rem !important; height: 1.1rem` becomes
> `min-width: 1.5rem; min-height: 1.5rem` (24 px), with the visible 0.55 rem dot
> unchanged — the *target* grows, the *mark* does not. The `!important` declarations
> are retained only where they are still needed to beat `Timeline.svelte`'s
> `li > button` rules; gratuitous `!important` is not added.
>
> **C7b.** No change to `.shape-marker`, `.compact-tabs button`, or the ply chips. They
> pass as measured.
>
> **C7c.** A unit test computes the rendered box of `.pivotal-marker` and
> `.shape-marker` from the component styles and asserts both dimensions `>= 24`. It
> fails today on `.pivotal-marker` and passes on `.shape-marker` by 0.08 px — which is
> the point: the margin is recorded by a gate rather than by a comment.

**Explicitly deferred, and named so the omission is not read as an oversight:** the
spacing-exception analysis. `.pivotal-marker` sits 0.25 rem below `.shape-marker` inside
a timeline `<li>`, and the 24 px circle test *may* have exempted it. This RFC does not
run that analysis, because C7a makes the target compliant outright and an exemption
argument that must be re-run every time the timeline's spacing changes is worth less
than 6.4 px. Non-interactive marks (`.guard-marker`, `.authored-marker`, `.marker`) are
`<span>`s, not targets, and are out of scope `[V]`.

### 7. The projection matrix

> **C8.** `tests/browser/drill.spec.ts` projects the run route at **five** viewports:
> 1280×720 and 1440×900 (existing desktop pair), **768×1024 (iPad portrait — the band
> that had no coverage)**, 390×844 (existing phone), and **360×640 (the small-Android
> worst case, which is where the C4 floor binds and is therefore the only projection
> that tests it)**.
>
> The nine-route sweep in `"every shell route owns the viewport at both desktop
> projections"` gains 768×1024 as a third projection and is renamed to stop claiming
> "desktop". The `document.scrollingElement` assertion in that sweep is kept **and
> annotated in-file** as a guard on the global `overflow` rule rather than on route
> layout, so the next reader is not misled the way `docs/app-shell.md:155-158`
> currently misleads.

Cost note, because a browser suite is the repo's slowest gate: the sweep goes from 2 × 9
to 3 × 9 route loads and the run-route helper from 3 to 5 projections. `fullyParallel:
false, workers: 1` (`playwright.config.ts`) means this is real wall-clock time. If
cross-review judges the third full sweep too expensive, the fallback is to add 768×1024
to the **run route only** and leave the eight shell routes at two projections — the
tablet defect is entirely in `DrillScreen.svelte`, so that variant loses little. Stated
as a fallback, not chosen, because the shell views have never been measured in the band
either.

### 8. Scope — what this RFC does not touch

**Compare geometry is a parallel RFC and this one stays out of it.** The ledger row
*"Eight-way compare overflows the DESKTOP projection, not just phones."* records that
`CompareView.svelte`'s board band measures **2010 px at 8 columns on every viewport**,
from a `minmax(15rem, 1fr)` column with a hard 240 px floor and no viewport awareness —
1.85 screens of horizontal pan at 1280×720 `[V]`. That is not a mobile defect and it
cannot be fixed by a breakpoint; it needs a different cell model (the ledger's semantic
zoom, already shipped one component away in `GroupPanel.svelte`).

> **Dependency, declared:** `rfc/compare-geometry.md` owns that row and owns
> `CompareView.svelte`. This RFC adds **no** `@media` rule to that file and asserts
> nothing about compare column geometry. C1a's *"compare is guaranteed to two
> columns"* is a floor statement restated from the Q3 verdict, not a geometry
> specification; if the compare RFC changes what two columns mean, C1a follows it
> without amendment here.
>
> The two drafts share `tests/browser/drill.spec.ts`. **Landing order is free**, but
> whichever lands second rebases its projections onto the other's helper rather than
> adding a second one.

Also deliberately untouched:

- **The `.compare` route's own containment.** `CompareView` replaces `<main class="drill">`
  entirely when a comparison is open, so C5's run-route helper does not run against it.
  Whether compare is viewport-contained is the compare RFC's question.
- **Live session detail, pack studio authoring, branch groups ≥ 4 members.** The Q3
  verdict names all three as *not phone-shaped and they should say so rather than
  degrade silently*. Saying so is the `HonestControl` convention
  (`docs/app-shell.md:187-197`, and the component ships in `HonestControl.svelte`).
  **This RFC does not apply it to them** — that is four surfaces of copy and refusal
  logic, it is not what makes the tablet floor unmet, and bundling it would double this
  RFC's blast radius. Named as follow-on, not forgotten.
- **The desktop board's under-use of its slot.** At 1280×720 the fitted board is 176 px
  while its slot is far larger, because `calc(100dvh - 34rem)` is the binding term. C4's
  container-query sizing would fix that too, and this RFC **deliberately scopes C4 to
  the compact tier** rather than changing a desktop geometry that ships and passes its
  test. Routed to the ledger, not fixed here (§Deviations).
- **A service worker, offline cache, or native packaging.** The Q3 verdict is
  *responsive-only, mobile-native stays a non-goal*. The deployment axis is settled as
  **hosted multi-user** (`design/02-product-shape.md:50-53`), from which
  `design/research/mobile-scope.md` §4a infers that offline *write* is structurally
  refused by the lease model — an inference this RFC repeats rather than re-derives,
  and does not need, since it proposes no offline behaviour either way.
- **Every other test in the repo.** F1b binds the assertions this RFC touches. It is
  not retroactive homework, for the same reason `fixture-realism` §6 gives.

## Deviations from design

**None.** This RFC specifies no learner-visible claim about chess, no content rule, and
no new surface. Law 8 is not engaged at any point: nothing here renders, grades, or
generates a statement about a position — C4's board floor is a pointer-target
requirement and C6a moves an existing disclosure into a container without changing what
it may disclose or when.

Two items are **routed rather than made**, per the design-tier-is-intent-tier law:

1. **`docs/app-shell.md:155-158` overstates its own coverage.** It presents the
   `document.scrollingElement` assertion as the guard that *"caught and prevented a real
   board/timeline overlap"*; the bounding-box block did that. The doc is `docs/` tier
   and is corrected by whoever implements this RFC, in the same commit, per the
   completion protocol — not by this draft.
2. **Two ledger rows are owed and this draft does not write them**: the SC 2.5.8
   pivotal-marker violation (no row exists — verified by grep for `2.5.8`, `WCAG` and
   `touch target` in `design/BACKLOG.md`), and the desktop board's slot under-use
   observed in §8. Both are `design/` tier. Flagged here for claude/owner; law 4 is
   satisfied by the routing, not by this file.

One item is a **correction to a living research doc**, recorded in §6: the
`.shape-marker` figure in `design/research/mobile-scope.md` §2c. Same routing.

## Acceptance criteria

1. `DrillScreen.svelte` contains **no** `@media (max-width: 62rem)` block, and exactly
   one responsive block at `max-width: 719px`. A grep for `62rem` in `apps/web/src/`
   returns no layout rule.
2. At **768×1024**, the run route renders the two-column fitted workspace: the branch
   rail and the timeline row are both visible simultaneously with the board, the board
   measures ≥ 400 px, and `.drill-region`'s `scrollHeight <= clientHeight + 1`. *The
   pre-change run of this same assertion is recorded as failing.*
3. `assertRunViewport` (C5) runs at all five projections of C8 and asserts C5-1, C5-2
   and C5-3 at each. No projection is covered by the `document.scrollingElement`
   comparison alone.
4. **C5-2 is demonstrated failing before it passes.** The implementation records a run
   of the new assertion against the tree *before* C3/C4 land, showing the 390×844
   Timeline case red, and the same run green afterwards. *Demonstrated, not assumed —
   this is F1b's whole content and criterion 3 of `fixture-realism` in the same form.*
5. At every phone projection and for every compact tab selection, the board's rendered
   width is ≥ 192 px and `.drill-region` does not scroll. The 360×640 + Timeline case
   is asserted explicitly, because it is the case that binds the C4 floor.
6. Selecting the **Evidence** tab at ≤ 719 px shows the structural- and
   transition-reading controls and hides Timeline and Branches; selecting Timeline
   hides the reading controls. Asserted in the browser suite, not only by unit test.
7. `compactTab`'s union has **three** members; no `Session` button renders at any
   viewport for any of the three `RUN_ROLES`; and the C6d guard asserts every union
   member has a `compact-active` binding. *The guard is demonstrated failing on the
   pre-change file.*
8. **The two Session defects are pinned separately.** (a) A test asserts no
   `viewerRole`-conditioned control renders in `DrillScreen.svelte`. (b) A test asserts
   `permittedAssistance` still receives `viewerRole` and still locks the human-split
   and corpus controls for `"participant"` and `"spectator"` — i.e. C6b did not
   collaterally remove the role plumbing it shares with the permission path.
9. `.pivotal-marker` measures ≥ 24 × 24 CSS px at a 16 px root font; the C7c gate
   asserts it and `.shape-marker`, and is recorded failing on the pre-change file for
   `.pivotal-marker` only.
10. No desktop regression: the 1280×720 and 1440×900 measurements for board width, rail
    width and board-above-timeline are unchanged from the pre-change tree. *Recorded as
    a before/after table in the planning log, since C2 deletes a block that those
    viewports do not match but C4's container query touches a shared selector.*
11. `CompareView.svelte` is **unmodified** by this RFC's commits.
12. `make verify` and the Playwright suite are green at landing, with no test skipped,
    no timeout raised, and no assertion weakened to achieve it. The suite's wall-clock
    change from C8 is recorded.

## Open questions

1. **Is the phone floor 360 px wide, or 360×640?** The Q3 verdict states the phone floor
   in width only (*"a 360 px-wide phone"*), but §3 shows the binding constraint is
   **height**: at 360×640 with a region open, the C4 floor is hit exactly and the board
   is 192 px with 24 px squares — compliant, and unpleasant. At 360×740 the same case is
   273 px. **Recommendation: state the floor as 360×640 and accept the 192 px worst
   case**, because it is a real device class, the alternative (hiding the board when a
   region opens) contradicts `docs/app-shell.md:142`'s promise, and 24 px squares are
   the accessibility floor rather than a guess. **Owner or cross-review call**, because
   it is the one place this RFC's geometry is genuinely uncomfortable.
2. **Does C2's 992×768 regression need a landscape escape after all?** §2 argues no on
   three grounds, the strongest being that 1024×768 already behaves that way. But a
   half-height desktop browser window at 900×700 is a plausible development and
   presentation posture and it drops from a scrolling 672 px board to a contained
   ~200 px one. A `@media (max-height: …)` escape is expressible; it also reintroduces
   a second band, which C1c exists to prevent. **Recommendation: ship without the
   escape, add 900×700 to the projection matrix so the number is visible, and revisit
   if the owner meets it.**
3. **Should `.reading-controls` be the Evidence region, or should the region be a new
   container that also holds `WhyBanner` and `OutcomeContext`?** C6a takes the minimal
   reading: Evidence = the two rung-0 disclosures. But `WhyBanner` and `OutcomeContext`
   are also evidence by any plain reading of region 4, and they currently sit above the
   board in the position column, consuming compact vertical budget unconditionally.
   **Recommendation: minimal now** (the two disclosures), because moving a `WhyBanner`
   behind a tab changes *when a learner sees disclosed evidence*, which is a
   `design/05-in-run-experience.md` §3 question and not a layout one. Flagged so
   cross-review can overrule.
4. **Does F1b belong here or in `fixture-realism.md`?** Both drafts are in flight on the
   same day and both are about tests that cannot fail. §4a states F1b as an extension of
   F1 and offers it for absorption. **Recommendation: absorb it into `fixture-realism`
   if that RFC is still open at cross-review, leaving §4a here as a citation.** A rule
   with two homes is the split-gate-surface failure the AGENTS.md gate-mirroring law
   exists to prevent.
5. **Is `container-type: size` on `.board-slot` safe against the shipped board
   component?** The measurement in Appendix C is a synthetic DOM carrying the shipped
   CSS rules, not the running application: `Chessground` mounts inside `.board-frame`
   and size containment establishes a new containing block, which could interact with
   the board's own absolutely-positioned overlay layers (`boardOverlays`). The harness
   cannot see that. **Recommendation: the implementation verifies overlays, the preview
   outline and `.preview-label` against a real run before C4 is considered done**, and
   falls back to `width: min(100%, calc(100dvh - Nrem), 30rem)` with `N` *derived from a
   measurement* rather than chosen, if containment misbehaves. This is the largest
   implementation risk in the RFC and it is the honest boundary of every `[V]` in
   Appendices B and C.
6. **Does `docs/app-shell.md` need a new section, or an edit?** The viewport-and-region
   model section is accurate about intent and wrong about coverage. **Owner call**;
   `docs/` is out of bounds for this draft either way, and §Deviations routes it.

## Appendix — the measurement harness

Disposable research instrument under `rfc/0000-rfc-process.md` §Exploration gate, tied
to Q3. It ran outside the repo (`/tmp/q3-floor`), wrote nothing into `apps/`,
`packages/` or `tests/`, and drove the repo's already-installed headless Chromium via
`node_modules/.pnpm/playwright-core@1.62.1`. **It measures the shipped CSS rules, copied
verbatim and in source order, in a synthetic DOM — not the running application.** That
is the honest boundary of every `[V]` geometry claim above: the rules are the shipped
rules and the numbers are real browser layout, but a component tree can add constraints
the harness does not see (open question 5). Source order matters and was checked: an
earlier run placed the `@media` block before the base `.drill` rule and silently lost
the cascade.

- **A — assertion vacuity.** Shipped globals (`App.svelte`'s `:global(html), :global(body), :global(#app)` rule, plus the ≤719 px `#app{position:fixed;inset:0}`) with a board pushed 2000 px down a `.drill-region` / `.drill` chain. Reports `document.scrollingElement` scrollHeight/clientHeight, `.drill-region` scrollHeight/clientHeight, and the board's bounding box, at 1280×720, 1440×900, 768×1024 and 390×844. Results in §Motivation.
- **B — the fitted grid in the tablet band.** The full shipped rule chain from `ShellFrame.svelte`'s `.shell` / `.shell-topbar` / `.shell-content` through `.drill-region`, `.drill`, `.topbar`, `.workspace`, `.position-column`, `.board-slot`, `.board-frame`, `.rail-stack` and `.timeline-row`, with `*{box-sizing:border-box}` from `App.svelte`, and the `62rem` block **deleted** — that deletion being the proposal under test. Both `.board-frame` variants (base and `.position-column.outcome`) at eight viewports. Results in §2.
- **C — the compact tier.** The same chain with both shipped `@media` blocks, measured first as shipped and then with C3 + C4 substituted, at 390×844, 414×896, 430×932, 360×740 and 360×640, for each of `none` / Timeline / Branches. Reports board width, square width, slot box, clipping, `.drill-region` overflow and board-in-viewport. Results in §3. The no-floor variant (C4 without `min-height: 12rem`) is the source of the 54 px figure.
- **D — touch targets.** `.pivotal-marker`, `.shape-marker`, `.compact-tabs button` and `.guard-marker` rendered verbatim from `Timeline.svelte` and `DrillScreen.svelte` at a 16 px root font, reporting `getBoundingClientRect()` and a `>= 24` predicate on both axes. Results in §6.

## Changelog

- 2026-08-15: created.
