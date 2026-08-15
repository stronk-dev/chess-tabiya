# RFC: Client surface floor — the tablet band, and two shipped controls that lie

- **Status:** draft — cross-reviewed 2026-08-15; **blocked on open question 1** (the
  360×640 case, where acceptance criterion 5 cannot pass as specified)
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
  nav element, one marker's size, one browser spec and two new `apps/web` unit tests.
  Introduces **no new subsystem, no persisted state, no format change, no new product
  surface, and no new route.**
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

It touches exactly five kinds of thing: **`apps/web` component styles**, **one Svelte
markup element**, **one Playwright spec file**, **two new `apps/web` unit tests** (the
C6d binding guard and the C7c target-size gate — cross-review found the first draft's
"four kinds" list omitted them while §5 and §6 require them), and **`docs/app-shell.md`**
(on implementation, not in this draft). It can land in any order relative to
`live-marker-quality.md`, `engine-request-contract.md` and `fixture-realism.md`.

Two coordination notes that are not register claims.

1. **`CompareView.svelte` is disjoint from this RFC.** A compare-geometry draft (§8)
   will touch it in the same tree; `CompareView.svelte` contains **zero** `@media` rules
   today (verified: `grep -c @media` returns 0) and this RFC adds none.
2. **`Timeline.svelte` is genuinely shared with `live-marker-quality.md`, and the first
   draft missed it.** That RFC changes which pivotal markers render (its §4.2, its
   criterion 4); C7a changes `.pivotal-marker`'s declarations in the same component's
   `<style>` block. The rules do not conflict — one is a count, the other a size — but
   **Svelte derives each component's `svelte-<hash>` scoping class from its source**, so
   editing the `<style>` block changes the class attribute on every element that
   component renders. `live-marker-quality`'s criterion 4 requires *"a timeline
   byte-identical to today's"* with `markers: "off"`; if that is a rendered-DOM snapshot
   it breaks under C7a regardless of landing order. **Landing order is still free**, but
   whichever lands second re-baselines that snapshot, and the criterion should be read as
   *structurally* identical rather than byte-identical. Flagged to `live-marker-quality`;
   this RFC does not amend it.

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
assertion **cannot fail** — App.svelte's compact `#app{position:fixed;inset:0}` takes the
whole tree out of flow, so its subject is constant at ≤ 719 px whatever the drill does,
and `docs/app-shell.md`'s promise that *"the board remains visible"* is unasserted at
every viewport, not only on phones. (Above 719 px the same assertion is constant by
containment, not by construction, and it is **red today** on the run route in the
720–992 band — see §Motivation A2.) And two of the four compact region tabs render and do nothing, one of them
behind an inverted role condition — which is an honesty-invariant defect, not a
cosmetic one.

This RFC specifies **C1–C8**: the floor restated normatively (§1), the tablet band
(§2), containment and a board sized from its slot rather than from a hand-tuned
viewport reserve (§3), a phone assertion that can fail and **is demonstrated failing**
(§4), the two tabs — one wired, one removed (§5), the touch-target floor including one
correction to the dossier (§6), and the projection matrix (§7). §8 draws the scope
boundary against compare geometry.

**Cross-review status, 2026-08-15.** An independent re-derivation against the *running
application* (Appendix, harness 2) confirmed §2's tablet table cell for cell and left
C2 standing, and corrected several supporting claims in place — the vacuity mechanism
(§Motivation A2), every compact-tier figure (§3), C5-3's scope (§4b) and the register
claim. **One blocker remains open:** at 360×640 the C4 board floor and full board
visibility cannot both hold as specified, so acceptance criterion 5 needs an owner ruling
(open question 1) before this moves to `accepted`.

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

### The assertion that cannot fail — and the one band where it already does

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

`design/research/mobile-scope.md` Appendix A2 measured this at 390×844. **Cross-review
of 2026-08-15 re-measured it against the running application** (`pnpm build` + the
Playwright webServer command, driven by `playwright-core` from outside the repo —
Appendix E-1, which supersedes the synthetic Appendix A this section first carried) and
found the conclusion right, one table row wrong, and the stated mechanism wrong. Both
corrections are recorded here rather than quietly applied, for the same reason §6
records the `.shape-marker` figure.

**A1 — the vacuity, demonstrated by defect injection `[V]`.** A 3000 px child appended
to the live DOM does not move `document.scrollingElement.scrollHeight` by one pixel:

| Route | Viewport | Injection host | before → after |
|---|---|---|---|
| `/settings` | 1280×720 | `.shell-view` | 720/720 → **720/720** |
| `/settings` | 1440×900 | `.shell-view` | 900/900 → **900/900** |
| `/settings` | 768×1024 | `.shell-view` | 1024/1024 → **1024/1024** |
| `/settings` | 390×844 | `.shell-view` | 844/844 → **844/844** |
| run route | 390×844 | `.drill` | 844/844 → **844/844** |
| run route | 1280×720 | `.drill` | 720/720 → **720/720** |

This is stronger than the four-viewport table it replaces, because it is the shipped
application and because it moves the thing the assertion is supposed to catch and
observes the assertion not moving. It reproduces in kind the D61 ledger row's 5000 px
finding at 390×844 `[V]`. Note that the `/settings` row at 768×1024 does **not**
contradict A2 below: the shell routes are contained at every width; it is the *run
route* that is not, in the band.

**A2 — the correction: the vacuity is *not* width-independent, and the stated mechanism
was wrong.** On the **run route in the tablet band** the incumbent assertion moves, and
fails, on the shipped tree today `[V]`:

| Viewport | run-route `document.scrollingElement` | shipped assertion |
|---|---|---|
| 1440×900 | 900 / 900 | passes |
| 1280×720 | 720 / 720 | passes |
| 1024×768 | 768 / 768 | passes |
| **992×768** | **1256 / 768** | **fails today** |
| **900×700** | **1288 / 700** | **fails today** |
| **834×1194** | **1284 / 1194** | **fails today** |
| **768×1024** | **1280 / 1024** | **fails today** |
| **720×1024** | **1278 / 1024** | **fails today** |
| 390×844 · 414×896 · 360×740 · 360×640 | 844/844 · 896/896 · 740/740 · 640/640 | passes |

The mechanism is therefore **not** *"`#app{overflow:hidden}` is unconditional, so the
subject is constant regardless of width"* — that sentence, in this draft and in the D61
ledger row, is wrong. Measured, three regimes `[V]`:

- **≤ 719 px:** `#app{position:fixed;inset:0}` (App.svelte's own compact block) takes the
  entire tree out of flow, so `document.documentElement.scrollHeight` equals
  `clientHeight` **structurally**, whatever the drill does. This is where the assertion
  is genuinely constant, and it is the phone case the ledger row names.
- **≥ 1024 px:** the base chain `.shell-content{overflow:hidden}` →
  `.drill{height:100%;overflow:hidden}` clips, so the assertion is constant *by
  containment* — true today and only as durable as the containment.
- **720–992 px:** the `62rem` block sets `.drill{height:auto;min-height:100%;overflow:visible}`
  and `.drill-region{overflow:auto}`; layout overflow then reaches the root element
  (`html.scrollHeight` 1280 against `body.scrollHeight` 1024 at 768×1024, because the
  root's `overflow:hidden` is propagated to the viewport and the root's own used
  overflow becomes `visible`). This is the one width where the assertion still means
  something — and it is red.

Three consequences.

1. The phone assertion detects nothing. It cannot see a clipped region, an unreachable
   control, or a board pushed out of view, and no defect can make it say so.
2. The same assertion appears in the desktop test `"every shell route owns the viewport
   at both desktop projections"`, where it runs over nine routes. Only the `runPath`
   iteration is saved, by the bounding-box block that follows it (`board!.y +
   board!.height <= timeline!.y + 1` and the four in-viewport comparisons).
   `docs/app-shell.md:155-158` describes that assertion as the coverage that *"caught and
   prevented a real board/timeline overlap"* — the bounding-box half did that; the
   scrollHeight half did not. **Stated at the strength the evidence supports:** at the
   two shipped desktop projections the injection test moves nothing, so the eight
   non-run routes are asserted by a value no injected overflow could change; whether
   that is *structural* constancy or merely *current* containment is not established,
   and A2 shows the same root-element chain does propagate on the run route 32 px below
   1024. Do not repeat the "constant on 8 of 9 routes" formulation without that
   qualifier.
3. **C8's 768×1024 projection turns the incumbent assertion red on the pre-change tree
   for free.** The demonstration obligation in criteria 2 and 4 is therefore satisfiable
   by the assertion that already exists, before C5-2 is written — which is a better
   result than this RFC first claimed, and the implementation should record it.

### A control that renders and does nothing

`DrillScreen.svelte` declares
`let compactTab: "timeline" | "branches" | "evidence" | "session" = $state("timeline")`
and declares four buttons inside `<nav class="compact-tabs" aria-label="Run regions">`
(three of which render for a host — the fourth is gated, see below).
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
`62rem` block deleted (Appendix B) `[V]`, and **re-measured by cross-review against the
running application (Appendix E-2) with the `62rem` block neutralised for 720–992 px — every cell
below reproduced exactly, and the two *ships today* rows reproduced exactly on the
untouched tree** `[V]`:

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

**What the band does today, which the first draft did not state.** The same in-app run
measured the *untouched* tree in the band `[V]`: at 768×1024 the `.drill-region`
overflows by **402 px**, at 720×1024 by **401 px**, at 834×1194 by **236 px**, at
992×768 by **634 px** and at 900×700 by **735 px** — and at **992×768 and 900×700 the
board's bounding box is already outside the viewport**. So C2 does not only restore
containment; at the two short-and-wide viewports it restores a board that is *fully
visible*, which today it is not. That belongs in the trade below.

**The honest cost, stated rather than buried.** Short-and-wide viewports inside the
band — 992×768 and below, i.e. a landscape tablet or a half-height desktop window —
move from a 672 px board that scrolls (and, measured, is already partly off-screen) to
a 224 px board (160 px in the `.outcome` variant) that does not. That is a real
regression in board size, bought with containment. Three reasons this RFC takes that
trade and does not special-case it:

1. **1024×768 already behaves exactly that way today** (it is above `62rem`), measured
   in-app at 224 px board / 269 px rail `[V]`. C2 makes 992×768 consistent with its
   immediate neighbour rather than introducing a new behaviour.
2. C1c admits no exception. A second band with a second shape is how this defect was
   built the first time.
3. The board that C2 leaves in the band is at least *whole*: at 992×768 and 900×700 the
   shipped tree puts the board's bottom edge below the viewport, and C2 puts it back
   inside `[V]`. A smaller board that is entirely reachable is the trade being bought.

> **Cross-review correction, 2026-08-15.** The first draft's third reason read *"the
> 160 px floor … is below the C4 floor this RFC introduces. §3 raises it, which is where
> that regression is actually paid off."* **That is false and has been replaced.** C4 is
> scoped to the compact tier (§8 says so explicitly), so it raises nothing at 992×768 or
> 900×700. Measured under C2 in the running application, **900×700 gives a 160 px board
> — 20 px squares — which is below C4's own derived floor and below SC 2.5.8** `[V]`.
> The tension between C4's derivation and the geometry this RFC leaves untouched above
> 719 px is real, is not resolved by C2, and is named in §6 and §8 rather than papered
> over here.

### 3. C3 / C4 — containment on the phone, and a board sized by its slot

Deleting the `62rem` block removes the phone tier's scroller too, so the compact tier
must supply its own containment. Today it does not. **Measured in the running
application, which supersedes the synthetic figures the first draft carried** `[V]`:

| Viewport | tab | `.drill-region` overflow | board | board fully in viewport |
|---|---|---|---|---|
| 390×844 | initial / Timeline / Branches / Evidence | **228 / 228 / 202 / 0 px** | 374 px | yes |
| 414×896 | initial / Timeline / Branches / Evidence | **144 / 144 / 119 / 0 px** | 398 px | yes |
| 360×740 | initial / Timeline / Branches / Evidence | **302 / 302 / 276 / 65 px** | 344 px | **no** |
| 360×640 | initial / Timeline / Branches / Evidence | **362 / 362 / 336 / 125 px** | 304 px | **no** |

> **Cross-review corrections, 2026-08-15, both against the first draft's own numbers.**
> (a) The synthetic harness **understated the overflow everywhere** — 116 → 228 px at
> 390×844, 88 → 144 px at 414×896, 250 → 362 px at 360×640 with Timeline, and 77 → 336 px
> at 360×640 with Branches. The direction and the defect are confirmed; the magnitudes in
> the first draft are not to be quoted.
> (b) **The first draft's own "correction to the dossier" was itself wrong at the small
> phone sizes.** It asserted that *"the board happens to remain in the viewport … so the
> dossier's §2b prediction that the board is pushed above the fold is not what the
> geometry shows"*. Measured in-app: at **360×640 and 360×740 the board's bottom edge is
> below the fold on every tab** on the shipped tree (board top at y = 451, height 304 and
> 344). The dossier was right there and this draft was wrong. The claim holds only at
> 390×844 and 414×896. The D61 ledger row repeats the wrong version and is routed for
> amendment in §Deviations.

The mechanism is still the one C1c names: `.position-column` precedes the region
containers in DOM order, so at 390 px and 414 px what falls below the fold is the
timeline rather than the board; at 360 px the content above the board is tall enough
that the board goes with it. Either way the drill region is a page scroller, which C1c
forbids — **and one consequence of (b) is that C5-1 also fails on the shipped tree at
360×640, so §4c(ii)'s "which halves fail today" is understated in this RFC's favour.**

> **C3.** In the `@media (max-width: 719px)` block, the drill region and the drill are
> contained (`.drill-region{overflow:hidden}`, `.drill{height:100%;overflow:hidden}`)
> and the workspace becomes a three-row fitted stack:
> `grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr) minmax(4rem, auto); overflow: hidden`
> — tab strip, position column, active region. **The active region is the scroller:**
> `.rail-stack.compact-active, .timeline-row.compact-active { display: grid; grid-template-columns: 1fr; min-height: 4rem; overflow: auto }`.
> `.position-column` stays `overflow: hidden`.

> **C4.** `.board-frame`'s hand-tuned viewport reserve is replaced by a size derived
> from the slot it actually occupies. **All three declarations live inside the
> `max-width: 719px` block** — cross-review found the first draft ambiguous about
> whether `container-type` and `min-height` were base rules, and acceptance criterion 10
> assumed they were: `.board-slot { container-type: size; min-height: 12rem }` and
> `.board-frame { width: min(100cqw, 100cqh) }`. Nothing above 719 px changes, so
> criterion 10's before/after table has no shared selector to worry about.
>
> **C4a — the `.outcome` variant must be overridden too, and is a live cascade bug
> today.** `.position-column.outcome .board-frame` (specificity 0,3,0) outranks a bare
> `.board-frame` rule (0,1,0) **inside the same media query** — a media query adds no
> specificity — so the shipped compact
> block's `width: min(100%, calc(100dvh - 21rem), 30rem)` is already dead in `.outcome`
> runs — a phone in an outcome drill is sized by the *desktop* `calc(100dvh - 42rem)`
> formula, which at 390×844 yields a **172 px board (21.5 px squares)** where the
> compact rule intended 374 px `[V]`, derived from the shipped cascade rather than
> measured, because the fixture pack does not enter an outcome state at open. C4
> therefore restates the container query at the same specificity:
> `.position-column.outcome .board-frame { width: min(100cqw, 100cqh) }`. The
> cross-review measurements above include this override; without it they do not
> reproduce.
>
> **C4b — `.board-slot` must be guaranteed the `minmax(0, 1fr)` track.**
> `.position-column`'s `grid-template-rows: auto auto auto minmax(0, 1fr)` gives
> `.board-slot` a determinate height only while the column has exactly four children.
> It has four in the fixtures measured here, but `trajectory-status`, `OutcomeContext`
> and `WhyBanner` are all conditional siblings; with any one of them present
> `.board-slot` falls into an **implicit `auto` row**, and under `container-type: size`
> an auto-height size container does not size to its contents — the slot would collapse
> to `min-height` and the board would pin at exactly 192 px for the rest of the run.
> The implementation must make the placement explicit (`grid-row: -1` on `.board-slot`,
> or a row template that cannot run out) and assert it: **a component test renders the
> compact tier with `WhyBanner` and `OutcomeContext` present and asserts the board is
> larger than 192 px where the viewport allows it.** This is a sharper statement of open
> question 5 and it is checkable without a real browser.
>
> **The 12 rem floor is derived, not chosen.** A chess square is a pointer target: a
> 192 px board is 8 × 24 px squares, which is exactly WCAG 2.2 SC 2.5.8's minimum
> (§6). Below that floor the *primary control of the entire product* fails the same
> criterion §6 applies to two markers.

`21rem` and `34rem` are guesses about how much chrome sits above the board, and a guess
about a viewport reserve is wrong at some viewport by construction — that is the same
shape as `fixture-realism`'s open question 2 about an untestable tolerance constant. A
container query asks the layout instead of predicting it.

**Measured with C2 + C3 + C4 injected into the running application** (Appendix E-3;
the synthetic Appendix C figures the first draft carried are withdrawn) `[V]`:

| Viewport | tab open | board under C3+C4 | square | ships today | `.drill-region` overflow | board fully in viewport |
|---|---|---|---|---|---|---|
| 390×844 | initial / Timeline / Branches / Evidence | 232 / 232 / **192** / 304 px | 24.0–37.9 px | 374 px | **0 / 0 / 0 / 0** | yes |
| 414×896 | initial / Timeline / Branches / Evidence | 339 / 339 / 279 / 398 px | 34.9–49.8 px | 398 px | **0 / 0 / 0 / 0** | yes |
| 430×932 | initial / Timeline / Branches / Evidence | 375 / 375 / 315 / 414 px | 39.4–51.8 px | 414 px | **0 / 0 / 0 / 0** | yes |
| 360×740 | initial / Timeline / Branches / Evidence | **192 / 192 / 192** / 200 px | **24.0 px** | 344 px | **0 / 0 / 0 / 0** | yes |
| 360×640 | initial / Timeline / Branches / Evidence | **192 / 192 / 192 / 192** px | **24.0 px** | 304 px | **0 / 0 / 0 / 0** | **no — see below** |

Three things follow, and the second and third are costs the first draft did not state.

**(1) C3 works.** Containment is total: `.drill-region` overflow is **0 at every phone
viewport, on every tab**, against 65–362 px today. That is the C1c property, delivered.

**(2) The C4 floor is load-bearing, and more so than the first draft said.** Without
`min-height: 12rem`, the same in-app run measures at 360×640: **28 px board (3.44 px
squares)** on the initial and Timeline tabs, **100 px** on Evidence, and — with Branches
open — a **0 px board**. At 360×740 it measures 128 px / 68 px. The first draft's "54 px
board (6.75 px squares)" is withdrawn as too generous; the pathological case is a board
that disappears entirely. The floor is normative, not advice.

**(3) The honest cost on the phone, which the first draft omitted entirely.**
Containment is paid for in board size, because today's larger board is precisely what
the overflow buys. Under C3 + C4 the board **shrinks against the shipped tree at every
phone viewport**: 374 → 232 px at 390×844 (−38%), 398 → 339 at 414×896, 414 → 375 at
430×932, 344 → 192 at 360×740 (−44%), 304 → 192 at 360×640 (−37%). The RFC still takes
the trade — a smaller board that is entirely reachable beats a larger one whose region
scrolls, and it is the same trade §2 takes at 992×768 — but it must be stated at the
same volume as the tablet-band cost, and it makes open question 3 (moving `WhyBanner`
and `OutcomeContext` behind the Evidence tab) load-bearing rather than cosmetic: the
board top sits at **y = 451 px** on every phone, and that 451 px of chrome is the whole
of the cost.

> **Blocker for the owner, found by cross-review: at 360×640 the C4 floor and full board
> visibility are mutually unsatisfiable as specified `[V]`.** With the floor applied, the
> board is 192 px at y = 451 — bottom edge at **643 px against a 640 px viewport**. The
> `min-height: 12rem` forces a slot taller than the space `.position-column` has, and
> `.position-column{overflow:hidden}` then *clips* the remainder with **no scroller to
> reach it** (region overflow is 0 by construction). So C5-1 fails at 360×640 under this
> RFC's own specification, acceptance criterion 5 cannot pass as written, and
> `docs/app-shell.md:142`'s *"the board remains visible"* is violated **silently** —
> which is worse than the scroller C3 removes. The margin is 3 px on this fixture, so it
> moves with the objective heading's line count; it is not a rounding artefact of the
> harness, it is the geometry. Three exits, none of which this draft may choose alone:
> **(a)** state the phone floor as 360×**740** and refuse 360×640 out loud via
> `HonestControl` (consistent with C1a's *"may be refused, but must be refused out
> loud"*); **(b)** buy the 3 px back by moving `WhyBanner`/`OutcomeContext` behind the
> Evidence tab (open question 3), which returns far more than 3 px; **(c)** let the
> *position column* be the scroller when its content exceeds its slot, which weakens C1c.
> **This supersedes open question 1's recommendation**, which assumed the 360×640 case
> was merely unpleasant rather than non-conforming.

**Interaction with C2 that must not be lost:** C3's rules are scoped to
`max-width: 719px` and C2 deletes the `62rem` block, so the tablet band inherits the
base (desktop) rules unchanged. No third band exists **in the drill**, and none may be
added there without amending C1c.

**Correction: a third band does exist in the shell, and it lands inside the tablet
band.** `ShellFrame.svelte` ships `@media (max-width: 60rem)` (960 px), which drops
`.run-context` and collapses `.shell-topbar` to two columns; the identity control then
wraps to a second row and the topbar grows. Measured in-app at 768×1024 the shell topbar
is **93.8 px** tall, against a `min-height: 3.5rem` (56 px) elsewhere `[V]`. C1c is about
the *drill region*, not the shell chrome, so this is not a C1c violation — but the first
draft's flat *"no third band exists"* is wrong as written, and the 38 px matter because
they come out of the drill's height in exactly the band C2 restores. The C2
measurements above were taken with that band active, so they already include the cost.
`ShellFrame.svelte` is otherwise untouched by this RFC.

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
> 3. **Board floor (C5-3), compact projections only.** At the phone projections the
>    board's rendered width is `>= 192` px and its squares are therefore `>= 24` px
>    (C4, §6). **It is deliberately not asserted at ≥ 720 px**, because the shipped
>    fitted grid does not meet it: the board measures **176 px at 1280×720** (22 px
>    squares), **160 px in the `.outcome` variant** at both desktop projections, and
>    **160 px at 900×700** under C2 `[V]`. The first draft asserted C5-3 "at each" of
>    the five projections; that would have turned the suite red at the desktop
>    projection this RFC promises not to change (criterion 10), so cross-review scoped
>    it. **The gap is not thereby excused** — §6 and §8 record that the desktop board
>    fails the very criterion C4's floor is derived from, and route a ledger row for it.
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

**(i) Demonstrated vacuous by defect injection, in the running application `[V]`.**
§Motivation A1: a 3000 px child appended to `.shell-view` (four viewports) or to
`.drill` (two viewports) moves the incumbent assertion by **zero pixels** while C5-1's
subject — the board's bounding box — is exactly the thing such a defect would move.
This replaces the first draft's synthetic *"board pushed 2000 px down a copied rule
chain"* argument, which measured a document this repo does not serve.

**(ii) C5-1 *and* C5-2 fail on the shipped tree right now `[V]`.** Measured in-app
(§3): `.drill-region` overflows by **228 px** (390×844, Timeline), **144 px** (414×896,
Timeline), **362 px and 336 px** (360×640, Timeline and Branches) — and at 360×640 and
360×740 the **board's bounding box is already outside the viewport on every tab**, so
C5-1 is red there too. Above the phone tier, the *incumbent* assertion is red at
768×1024 the moment C8 projects it. Adding C5-1 and C5-2 before C3 lands turns
`make verify` red at three of the five projections — which is the correct order, and
the acceptance criteria require the implementation to record that red run.

**(iii) The mechanism, corrected.** The incumbent's subject is pinned at ≤ 719 px
because `#app{position:fixed;inset:0}` removes the tree from flow, and at ≥ 1024 px
because `.shell-content` / `.drill` clip — **not** because `overflow:hidden` is
unconditional; see §Motivation A2, which measures the same assertion moving in the
720–992 px band. C5-1's subject is a `getBoundingClientRect()` on an element inside that
clip, and **no shipped rule pins it**: it moves with every row of the workspace grid,
with `.board-frame`'s width formula, with the objective heading's line count, and with
the compact tab selection — demonstrated by the fact that it already disagrees with the
incumbent at 360×640 today. C5-2's subject is the scrollHeight of the element that C3
makes `overflow:hidden` and that the `62rem` block currently makes `overflow:auto` — the
two states differ by construction. C5-3's subject is a computed width whose formula this
RFC changes.

**The honest caveat.** C5-1 evaluated at scroll-top on a phone proves *initial*
visibility, not visibility after the learner scrolls a region. That is why C5-2 exists
and is the stronger of the two: under C1c there is no scroll position at which the
board can leave, because the drill region does not scroll at all. **C5-1 alone would be
a weaker guard than it looks; C5-1 plus C5-2 is the pair that means something.**

**A second caveat, added by cross-review, and it cuts the other way.** Containment makes
C5-2 a *weaker* guard than it looks in one specific mode: `overflow: hidden` reports
`scrollHeight === clientHeight` whether the content fits or is silently clipped. The
360×640 case in §3 is exactly that — region overflow 0, board bottom 3 px past the fold,
nothing scrollable. **C5-2 cannot see clipping; only C5-1 can.** That is why C5-1 is
retained at the phone projections despite the scroll-top caveat, and why neither may be
dropped in favour of the other.

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
| Pivotal marker | `.pivotal-marker` in `Timeline.svelte` | **17.59 × 17.59 px** (`1.1rem` = 17.6 px, less Chromium's subpixel rounding) | **fails** |
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
> **C7d — the target this RFC's own derivation indicts and does not fix: the board
> square.** C4 argues that a chess square is a pointer target and derives a 192 px board
> floor from SC 2.5.8. Applied consistently, the *shipped* fitted grid fails it:
> **176 px board = 22 px squares at 1280×720**, **160 px = 20 px squares in the
> `.outcome` variant at both desktop projections**, and 160 px at 900×700 under C2
> `[V]`. C7d states the finding and refuses to hide it behind the compact-tier scope:
> the derivation either applies to the board everywhere or it does not justify the
> compact floor either. This RFC does **not** raise the desktop board — that is the
> geometry change §8 declines and criterion 10 forbids — but the finding is no longer
> filed as *"the desktop board under-uses its slot"* (an efficiency observation); it is
> an SC 2.5.8 non-conformance of the product's primary control at the projection the
> suite asserts as correct. The ledger row owed in §Deviations is rewritten to say so,
> and it is the owner's call whether it outranks criterion 10.
>
> `.pivotal-marker`'s specificity is worth pinning while the implementation is in that
> file: `.pivotal-marker` (0,1,0) already outranks `li > button` (0,0,2), so
> `min-width: 1.5rem` needs no `!important` at all, and dropping the existing
> `min-width: 0 !important` is required, not optional — it would otherwise beat the new
> floor. Dropping `width: 1.1rem !important` also lets the button fill its `<li>`
> (≈ 83.6 px wide), which is why C7a specifies `min-width` rather than `width`: the mark
> stays a 0.55 rem dot centred by its own `margin: auto`.
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
> annotated in-file** — as a guard that is *structurally* constant at ≤ 719 px
> (`#app{position:fixed}`) and constant *by containment* at ≥ 1024 px, and that
> genuinely moves in the 720–992 px band (§Motivation A2) — so the next reader is not
> misled the way `docs/app-shell.md:155-158` currently misleads. **Note the ordering
> consequence:** adding 768×1024 to this sweep makes it red on the pre-change tree, so
> C8 and C2 land in the same commit or C8's new projection lands first as the recorded
> demonstration (criterion 2).

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

> **Scope boundary, forward-declared — not a dependency.** `rfc/compare-geometry.md`
> **does not exist** (verified: no such file in `rfc/` or `rfc/archive/`), and this RFC
> is deliberately **not** listed against it in `Depends on:`. Nothing here waits on it:
> this RFC can land, be implemented and be archived with no compare RFC ever written.
> What is declared is the opposite of a dependency — a promise not to touch
> `CompareView.svelte`, held by criterion 12, so that whoever picks up D63 inherits the
> file unmoved. The first draft's *"Dependency, declared"* heading (and the
> `rfc/README.md` register row repeating it) overstates the relationship; the register
> row is `rfc/` tier and out of bounds for this draft, so it is routed in §Deviations.
>
> This RFC adds **no** `@media` rule to `CompareView.svelte` and asserts nothing about
> compare column geometry. C1a's *"compare is guaranteed to two columns"* is a floor
> statement restated from the Q3 verdict, not a geometry specification; if a compare RFC
> changes what two columns mean, C1a follows it without amendment here.
>
> Should a compare draft appear, the two share `tests/browser/drill.spec.ts`. **Landing
> order is free**, but whichever lands second rebases its projections onto the other's
> helper rather than adding a second one.

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
- **The desktop board's under-use of its slot — which cross-review reclassifies as an
  accessibility non-conformance, not an efficiency note.** At 1280×720 the fitted board
  is 176 px (22 px squares) while its slot is 893 px wide, because `calc(100dvh - 34rem)`
  is the binding term; the `.outcome` variant is 160 px (20 px squares) at both desktop
  projections `[V]`. By C4's own derivation (§6, C7d) those squares fail SC 2.5.8. C4's
  container-query sizing would fix it, and this RFC **still deliberately scopes C4 to
  the compact tier** rather than changing a desktop geometry that ships and passes its
  test — but the reason is blast radius, not that the desktop geometry is fine. Routed
  to the ledger with the SC 2.5.8 framing, not fixed here (§Deviations).
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

Items are **routed rather than made**, per the design-tier-is-intent-tier law:

1. **`docs/app-shell.md:155-158` overstates its own coverage.** It presents the
   `document.scrollingElement` assertion as the guard that *"caught and prevented a real
   board/timeline overlap"*; the bounding-box block did that. The doc is `docs/` tier
   and is corrected by whoever implements this RFC, in the same commit, per the
   completion protocol — not by this draft.
2. **Ledger rows are owed and this draft does not write them.** (a) The SC 2.5.8
   `.pivotal-marker` violation (no row exists — verified by grep for `2.5.8`, `WCAG` and
   `touch target` in `design/BACKLOG.md`). (b) The desktop board's geometry, which §8 and
   C7d reclassify from *slot under-use* to an **SC 2.5.8 non-conformance of the board
   itself** (22 px squares at 1280×720, 20 px in `.outcome`); the row must carry the
   accessibility framing, not the efficiency one. (c) **The D61 row needs amending on two
   points this cross-review measured against the running application** — its
   *"`#app{overflow:hidden}` is unconditional, so the vacuity is width-independent … the
   desktop test's same assertion is equally constant on 8 of its 9 routes"* is wrong as a
   mechanism (§Motivation A2 measures the same assertion failing at five viewports in the
   720–992 band), and its *"Also corrected: the board is NOT pushed above the fold on
   phones"* is wrong at 360×640 and 360×740, where it is (§3). Both are `design/` tier.
   Flagged for claude/owner; law 4 is satisfied by the routing, not by this file.
3. **`rfc/README.md`'s Active row for this draft** describes the compare relationship as
   *"declares a dependency on `compare-geometry`"*. §8 now states it as a forward-declared
   scope boundary against an RFC that does not exist, and the row should follow. The
   register is `rfc/` tier and out of bounds for this draft; the rest of that row —
   *claims nothing versioned*, *lands in any order*, *deletes the `62rem` breakpoint
   rather than retargeting it*, *asserts `CompareView.svelte` is unmodified* — was
   checked against this text and is accurate.

Corrections to a living research doc, recorded in-place rather than applied: the
`.shape-marker` figure in `design/research/mobile-scope.md` §2c (§6), and — against this
draft's own first version, not the dossier — the §2b above-the-fold prediction, which
the dossier got **right** at 360 px and this draft wrongly "corrected" (§3). Same
routing.

## Acceptance criteria

1. `DrillScreen.svelte` contains **no** `@media (max-width: 62rem)` block, and exactly
   one responsive block at `max-width: 719px`. A grep for `@media (max-width: 62rem)` in
   `apps/web/src/` returns nothing. (A bare `62rem` grep is not the gate: three
   `0.62rem` font declarations match it in `CheckpointSheet.svelte`, `BranchRail.svelte`
   and `DrillScreen.svelte`, and `ShellFrame.svelte`'s `@media (max-width: 60rem)` is a
   different, untouched block.)
2. At **768×1024**, the run route renders the two-column fitted workspace: the branch
   rail and the timeline row are both visible simultaneously with the board, the board
   measures ≥ 400 px, and `.drill-region`'s `scrollHeight <= clientHeight + 1`. *The
   pre-change run of this same assertion is recorded as failing.*
3. `assertRunViewport` (C5) runs at all five projections of C8 and asserts C5-1 and C5-2
   at each, and C5-3 at the two compact projections (C5-3 is compact-tier only — see
   §4b; asserting it at 1280×720 would fail against a 176 px shipped board). No
   projection is covered by the `document.scrollingElement` comparison alone.
4. **C5-1 and C5-2 are demonstrated failing before they pass.** The implementation
   records a run of the new assertions against the tree *before* C2/C3/C4 land, showing
   at minimum the 390×844 Timeline case red for C5-2 (measured 228 px overflow), the
   360×640 case red for C5-1 (board bottom below the fold on every tab), and the
   *incumbent* `document.scrollingElement` assertion red at 768×1024 (measured
   1280/1024) — then the same runs green afterwards. *Demonstrated, not assumed — this
   is F1b's whole content and criterion 3 of `fixture-realism` in the same form.*
5. At every phone projection and for every compact tab selection, the board's rendered
   width is ≥ 192 px, `.drill-region` does not scroll, **and the board's bounding box is
   inside the viewport**. The 360×640 + Timeline case is asserted explicitly, because it
   is the case that binds the C4 floor. **This criterion cannot pass as the RFC now
   stands** — §3 measures the 360×640 board at 192 px with its bottom edge 3 px below the
   fold, clipped and unreachable — so the owner's answer to the §3 blocker (exit a, b or
   c) is a precondition for `accepted`, not for `implemented`.
6. Selecting the **Evidence** tab at ≤ 719 px shows the structural- and
   transition-reading controls and hides Timeline and Branches; selecting Timeline
   hides the reading controls. Asserted in the browser suite, not only by unit test.
7. `compactTab`'s union has **three** members; no `Session` button renders at any
   viewport for any of the three `RUN_ROLES`; and the C6d guard asserts every union
   member has a `compact-active` binding. *The guard is demonstrated failing on the
   pre-change file.*
8. **The two Session defects are pinned separately.** (a) A test asserts no
   `viewerRole`-conditioned control renders in `DrillScreen.svelte` — verified in
   cross-review to be a two-site surface: `viewerRole` is read at exactly the tab gate
   and at `permittedAssistance`, and nowhere else `[V]`. (b) A test asserts
   `permittedAssistance` still receives `viewerRole` and still returns `locked_off` for
   `humanSplit` and `corpus` (and `sight` rather than `evidence` for `boardLighting` and
   `arrows`, which the same `role === "solo" || role === "host"` test derives —
   `packages/runtime/src/assistance.ts:28-29`) for `"participant"` and `"spectator"` —
   i.e. C6b did not collaterally remove the role plumbing it shares with the permission
   path.
9. `.pivotal-marker` measures ≥ 24 × 24 CSS px at a 16 px root font; the C7c gate
   asserts it and `.shape-marker`, and is recorded failing on the pre-change file for
   `.pivotal-marker` only.
10. No desktop regression: the 1280×720 and 1440×900 measurements for board width, rail
    width and board-above-timeline are unchanged from the pre-change tree — cross-review
    pins the pre-change values as **176 px / 339 px** and **356 px / 375 px**, measured
    in-app `[V]`. *Recorded as a before/after table in the planning log. C4 is now
    explicitly compact-tier-only (§3), so no selector is shared above 719 px; the table
    exists to prove that, not because a shared selector is expected.*
11. **The C4b placement guard holds.** A test renders the compact tier with
    `WhyBanner` and `OutcomeContext` present and asserts the board is not pinned at
    192 px where the viewport allows more — i.e. `.board-slot` still occupies a
    determinate-height track under `container-type: size`.
12. `CompareView.svelte` is **unmodified** by this RFC's commits.
13. `make verify` and the Playwright suite are green at landing, with no test skipped,
    no timeout raised, and no assertion weakened to achieve it. The suite's wall-clock
    change from C8 is recorded.

## Open questions

1. **Is the phone floor 360 px wide, or 360×640? — reopened by cross-review, and it is
   now the RFC's blocking question.** The Q3 verdict states the phone floor in width only
   (*"a 360 px-wide phone"*), but §3 shows the binding constraint is **height**. The first
   draft recommended accepting a 192 px board at 360×640 as *"compliant, and unpleasant"*.
   Measured in the running application it is **not compliant**: the C4 floor forces a slot
   taller than `.position-column` has, the column clips it, and the board's bottom edge
   lands 3 px below the fold with no scroller to reach it (§3 blocker). At 360×740 the
   same case is **192 px**, not the 273 px the first draft reported. **The recommendation
   is withdrawn.** The choice is now between (a) refusing 360×640 out loud under C1a,
   (b) taking open question 3's larger reading so the 451 px of chrome above the board
   shrinks, or (c) letting `.position-column` scroll, which weakens C1c. **Owner call, and
   it gates `accepted`, because acceptance criterion 5 cannot pass without it.**
2. **Does C2's 992×768 regression need a landscape escape after all?** §2 argues no on
   three grounds, the strongest being that 1024×768 already behaves that way. But a
   half-height desktop browser window at 900×700 is a plausible development and
   presentation posture and it drops from a scrolling 672 px board (whose bottom is
   already off-screen today) to a contained **160 px** one — measured in-app, not the
   *"~200 px"* the first draft estimated, and **20 px squares, below the very SC 2.5.8
   floor C4 derives** `[V]`. A `@media (max-height: …)` escape is expressible; it also
   reintroduces a second band, which C1c exists to prevent. **Recommendation: ship
   without the escape, add 900×700 to the projection matrix so the number is visible,
   and revisit if the owner meets it** — but note that C7d now makes 900×700 an instance
   of the desktop board's accessibility gap rather than a taste question, and adding it
   to the matrix would make C5-3 red there if C5-3 were not compact-scoped.
3. **Should `.reading-controls` be the Evidence region, or should the region be a new
   container that also holds `WhyBanner` and `OutcomeContext`?** C6a takes the minimal
   reading: Evidence = the two rung-0 disclosures. But `WhyBanner` and `OutcomeContext`
   are also evidence by any plain reading of region 4, and they currently sit above the
   board in the position column, consuming compact vertical budget unconditionally.
   **Recommendation: minimal now** (the two disclosures), because moving a `WhyBanner`
   behind a tab changes *when a learner sees disclosed evidence*, which is a
   `design/05-in-run-experience.md` §3 question and not a layout one. **Cross-review
   does not overrule it, but records that it is now load-bearing:** the board top sits at
   y = 451 px on every phone measured, open question 1's blocker is a 3 px shortfall, and
   the larger reading is the cheapest of the three exits. If the owner takes exit (b)
   there, this question is answered with it.
4. **Does F1b belong here or in `fixture-realism.md`?** Both drafts are in flight on the
   same day and both are about tests that cannot fail. §4a states F1b as an extension of
   F1 and offers it for absorption. **Recommendation: absorb it into `fixture-realism`
   if that RFC is still open at cross-review, leaving §4a here as a citation.** A rule
   with two homes is the split-gate-surface failure the AGENTS.md gate-mirroring law
   exists to prevent.
5. **Is `container-type: size` on `.board-slot` safe against the shipped board
   component? — partly answered, and the residue is sharper.** Cross-review re-ran C2,
   C3 and C4 **in the running application** (Appendix E), so the layout half is now
   settled: `Chessground` sizes correctly inside a size container, containment is total,
   and the numbers in §2 and §3 are in-app. Two residues remain. (a) The overlay layers
   (`boardOverlays`), the previewing outline and `.preview-label` were not exercised;
   size containment establishes a new containing block and the implementation must still
   verify them against a real run before C4 is done. (b) **C4b is the sharp one**:
   `.board-slot` only has a determinate height while it occupies `.position-column`'s
   `minmax(0, 1fr)` track, and three conditional siblings can push it into an implicit
   `auto` row, where a size container collapses to `min-height` and pins the board at
   192 px for the rest of the run. Criterion 11 gates it. The fallback if containment
   misbehaves is unchanged: `width: min(100%, calc(100dvh - Nrem), 30rem)` with `N`
   *derived from a measurement* rather than chosen.
6. **Does `docs/app-shell.md` need a new section, or an edit?** The viewport-and-region
   model section is accurate about intent and wrong about coverage. **Owner call**;
   `docs/` is out of bounds for this draft either way, and §Deviations routes it.

## Appendix — the measurement harnesses

Disposable research instruments under `rfc/0000-rfc-process.md` §Exploration gate, tied
to Q3. Both ran outside the repo, wrote nothing into `apps/`, `packages/` or `tests/`,
and drove the repo's already-installed headless Chromium via
`node_modules/.pnpm/playwright-core@1.62.1`.

**Harness 1 — synthetic DOM (`/tmp/q3-floor`), authoring pass.** It measures the shipped
CSS rules, copied verbatim and in source order, in a synthetic DOM — **not** the running
application. Source order matters and was checked: an earlier run placed the `@media`
block before the base `.drill` rule and silently lost the cascade.

- **A — assertion vacuity.** Shipped globals with a board pushed 2000 px down a `.drill-region` / `.drill` chain, at 1280×720, 1440×900, 768×1024 and 390×844. **Superseded by E-1: its 768×1024 row is wrong against the running application and its stated mechanism was wrong.**
- **B — the fitted grid in the tablet band.** The full shipped rule chain from `ShellFrame.svelte`'s `.shell` / `.shell-topbar` / `.shell-content` through `.drill-region`, `.drill`, `.topbar`, `.workspace`, `.position-column`, `.board-slot`, `.board-frame`, `.rail-stack` and `.timeline-row`, with `*{box-sizing:border-box}` from `App.svelte`, and the `62rem` block **deleted** — that deletion being the proposal under test. Both `.board-frame` variants at eight viewports. **Confirmed cell-for-cell by E-2.**
- **C — the compact tier.** The same chain with both shipped `@media` blocks, as shipped and with C3 + C4 substituted. **Superseded by E-3: every number in it is wrong, in both directions.**
- **D — touch targets.** `.pivotal-marker`, `.shape-marker`, `.compact-tabs button` and `.guard-marker` rendered verbatim from `Timeline.svelte` and `DrillScreen.svelte` at a 16 px root font. **Confirmed** — the `.shape-marker` arithmetic re-derives exactly (12.48 + 9.6 + 2 = 24.08) and `1.1rem` is 17.6 px.

**Harness 2 — the running application (`/tmp/xr-floor`), cross-review pass, 2026-08-15.**
`pnpm build` plus the `playwright.config.ts` webServer command (mock engine, in-memory
DB, `terminal-outcome.browser.json` draft pack) on port 4199, driven by `playwright-core`
from a script outside the repo. It registers a learner, opens the *"schema example"* pack
from `/play`, and measures the real component tree. Proposals are simulated by injecting a
`<style>` element whose declarations carry `!important`, which is what beats Svelte's
`.cls.svelte-<hash>` scoped specificity; C4's `.position-column.outcome .board-frame`
override is part of the injection, without which the numbers do not reproduce. **The
honest boundary of harness 2:** the injection is not the same artefact as the edited
component, and the fixture is one pack — the objective heading's line count moves `y` by a
few pixels, which is exactly the margin the 360×640 blocker turns on.

- **E-1 — assertion vacuity by defect injection.** A 3000 px child appended to `.shell-view` (`/settings` at 1280×720, 1440×900, 768×1024, 390×844) and to `.drill` (run route at 390×844 and 1280×720); reports `document.scrollingElement` before and after, plus the `html` / `body` / `#app` / `.shell` / `.shell-content` / `.drill-region` / `.drill` scrollHeight chain at 768×1024. Results in §Motivation A1–A2.
- **E-2 — the tablet band, shipped and under C2.** Eight viewports on the untouched tree, then the same six in the band with the `62rem` block neutralised for 720–992 px. Reports board and rail width, `.drill-region` overflow, board-above-timeline and board-in-viewport. Results in §2.
- **E-3 — the compact tier under C2 + C3 + C4, with and without the `12rem` floor.** Five phone viewports × four tab states. Results in §3, including the withdrawn 54 px figure (measured 28 px, and 0 px with Branches open) and the 360×640 clipping blocker.

## Changelog

- 2026-08-15: created.
- 2026-08-15: adversarial cross-review (independent agent, harness 2 above). **The central
  proposal survives**: every cell of §2's tablet table reproduces in the running
  application, including the 176 px board that ships at 1280×720. Corrections landed in
  place — §Motivation A1/A2 (the vacuity mechanism was wrong and the assertion **fails
  today** in the 720–992 band), §2 (reason 3 was false; 900×700 is 160 px, not ~200),
  §3 (all shipped and all C3+C4 figures re-measured; the phone board *shrinks* under
  C3+C4, which was unstated; the draft's own "board is not above the fold" correction was
  wrong at 360 px), §3 C4/C4a/C4b (the `.outcome` cascade override and the `.board-slot`
  track guarantee were missing), §4b (C5-3 scoped to the compact tier — it contradicted
  the shipped 176 px board), §6 C7d (the desktop board fails the SC 2.5.8 derivation C4
  relies on), §Register claim (unit tests and the shared `Timeline.svelte` were missing),
  §8 (the compare "dependency" is a forward-declared boundary against a file that does not
  exist). **One blocker is raised and not fixable in this file**: at 360×640 the C4 floor
  and full board visibility are mutually unsatisfiable, so acceptance criterion 5 cannot
  pass until the owner picks an exit (open question 1).
