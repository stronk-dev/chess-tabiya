# Accessibility and small screens — the cross-cutting pass nobody ran

**Question (owner, 2026-08-24):** *"we need to go from a user perspective per feature… what do
they expect, what do competitors do, PROPER UX."* This dossier takes the two axes that are
**cross-cutting rather than per-surface** and therefore fell between all six of the UX dossiers
that landed in the same wave: **accessibility and small screens**.

**Why it exists at all:** the one accessibility defect on record ([[D1447]], square sight
unreachable by keyboard *inside the surface built for accessibility*) was found **by accident,
during an audit of something else**. A defect class discovered by accident is a class with no
instrument pointed at it.

**Date:** 2026-08-24. Our-side facts derived at HEAD `acb17fa6`. **Shared-worktree caveat:**
concurrent agents have `apps/web/src/lib/board-input.ts` modified in the working tree; every
claim below rests on `Chessboard.svelte`, `DrillScreen.svelte`, `ShellFrame.svelte`,
`keyboard.ts`, `viewport-support.ts`, `play-composition.ts`, `theme/*` and `tests/browser/*`,
**none of which is modified**, and each was re-read at this HEAD. Ledger head **D1478** at
drafting; rows proposed unnumbered per [[D1130]] — renumber at landing.

**Scope:** keyboard, screen reader, contrast, colour vision, motion, touch and small screens,
**across every surface**, not only the board. Two questions are answered head-on:

1. **Is the product usable end-to-end by keyboard alone** — starting a run, asking for help,
   rewinding, branching, comparing, reviewing? §3.2 walks the whole loop. **Answer: no, and the
   break is not where anyone was looking.**
2. **What is this product on a phone?** §3.7. **Answer: on a large modern phone, a one-board
   loop with a drawer that covers 42% of the board; on iPhone SE, iPhone 12/13/14/15 Pro with
   Safari's address bar showing, any phone in landscape, and any desktop at 400% browser zoom,
   it is a refusal alert and no board at all.**

**Method:** code derivation and reproducible measurement at HEAD `[V]`; three measurement
harnesses written for this pass (contrast/ΔE, colour-vision simulation, board-edge-per-device),
scripts in the session scratchpad and reproducible from the formulas quoted inline `[V]`;
lichess pinned from **lila primary source fetched this pass** `[V]`; everything else from the
repo's own corpus, re-labelled per claim. No product was driven hands-on and **no assistive
technology was used** — see §7. Labels per `design/research/README.md`.

**Boundary with the neighbouring dossiers, so nothing is repeated or contradicted:**

| Dossier / spec | Owns | This dossier's relation |
|---|---|---|
| `mobile-scope.md` (2026-08-15) | the *tolerate-mobile* verdict and the two-tier floor | **its geometry is stale** — superseded by `rfc/play-composition.md`; its verdict stands, its numbers do not. §3.7 re-derives from the shipped function |
| `rfc/play-composition.md` (implementing) | the closed-form board edge and the seven-viewport matrix | this dossier **runs its shipped implementation** against real device viewports it does not enumerate |
| `rfc/accessible-board-input.md` (awaiting D3) | the board's move state machine and its four input projections | this dossier audits **everything outside the board**, plus the one thing the board's own RFC does not cover: sight |
| `rfc/theming.md` | the palette axes and the ΔE ≥ 20 evidence-separation criterion | this dossier measures **the paint criterion 7 does not enumerate**, and the channel ΔE cannot see |
| `ux-in-run.md` §3.2 | keyboard square-sight parity as a recommendation | **agreed and not repeated**; this dossier adds the seven other places the same class breaks |
| `competitor-play-ux.md` | screen anatomy, the two field layout invariants | this dossier fills its stated hole: it contains **zero accessibility content** (§2) |

**Status:** desk + code-derivation + three original measurements. It names **eleven defects that
need no owner ruling** (§4) and **six design questions that do** (§5), and keeps them apart,
because the accessibility half of [[D1447]] has already spent eight days waiting behind a ruling
it does not need.

---

## 0. The two answers, up front

**Keyboard.** The product is **not** usable end-to-end by keyboard alone, and the failure is not
the board — the board is the *best* keyboard surface in the app. The failure is that
`DrillScreen.svelte:497-510` classifies **every `<button>` and `<a>` in the composed path** as an
"interactive target" and suppresses the entire drill shortcut set for it. The drill region is
almost nothing *but* buttons. So the twelve shortcuts `KeyboardHelp.svelte:12-25` advertises —
rewind, fork, switch branch, step the timeline, replay, export — are live **only while focus
rests on one of the two `tabindex="-1"` container divs**, and the moment a keyboard user presses
Tab even once, all of them go dead with no announcement, no visual change and no documented way
back. There is no "return focus to the region" key. Ten further breaks are walked in §3.2.

**Phone.** The small-screen product is **the run loop on one board with a three-tab drawer**, and
the drawer is `position: fixed` at `min(68dvh, 38rem)` (`DrillScreen.svelte:1668`) over a board
that provably does not move (`tests/browser/drill.spec.ts:1436,1438` asserts byte-identical board
geometry before and after) — so **opening evidence, branches or the timeline occludes roughly
42% of the board** `[P]`. The five `design/05` regions become one visible region at a time. And
the run **refuses to mount at all** below 360×680 (`viewport-support.ts:1,11`;
`DrillScreen.svelte:207` measures `globalThis.innerHeight`), which excludes iPhone SE at
375×667, every phone in landscape, and — on the reported `innerHeight` of iOS Safari with its
address bar visible — the entire iPhone 12–15 Pro class `[P]`. §3.7 has the device table.

---

## 1. What each of five people expects, and what *rehearsal* owes them

The generic answer is the same as for any chess site. The interesting answer is the delta: a
rehearsal product's loop is **commit → play the consequence → rewind → branch → compare →
replay**, and four of those six stages have no analogue on an analysis board. Each one creates an
accessibility obligation an analysis board does not have. `[M]` throughout this section — it is
reasoning from the shipped loop and the cited standards, not measurement.

### 1.1 The keyboard-only player

**Expects, from any chess site:** to move a piece without a mouse; to walk the move list; to not
have single-letter shortcuts fire while typing; to see where focus is.

**What rehearsal owes them that analysis does not.** An analysis board's keyboard job ends at
"enter a move and step the line". Rehearsal's job is **four navigation verbs on a graph**:
rewind (jump to a checkpoint), branch (create a sibling), switch (enter a sibling), compare
(open N siblings side by side). Those are not stepping — they are structural edits and structural
reads, and each has to be reachable *from wherever the hands already are*. The shipped design
understood this and gave them all single-key shortcuts. It then made those shortcuts unreachable
from every focusable control (§3.2).

The sharper obligation is **the invariant "an attempt is never destroyed" (`design/05:38`)**.
That invariant is a promise about *state*. A keyboard user cannot see the branch rail and the
board at once on a small viewport, cannot hear it at all unless something announces it, and
therefore has to **trust** that the fork happened. Rewind and fork are the two actions in this
product where a silent no-op is indistinguishable from success. Both are bound to bare `R` and
`B`. Neither announces.

### 1.2 The screen-reader user

**Expects:** a board they can read square by square; a move list they can read; a running
commentary of what the opponent played; dialogs that take focus and give it back; a page title
that changes when the page does.

**What rehearsal owes them.** Three things, none of which an analysis board needs:

- **The consequence must be narrated.** The whole product is "commit, then find out". For a
  sighted user the finding-out is a board that changes. For a screen-reader user, if the
  opponent's reply is not announced, the core loop has no output. The board *does* announce
  committed moves (`Chessboard.svelte:360`, one polite live region) — but that region carries
  `inputState.lastAnnouncement`, which is the state of **your own input controller**. The
  opponent's reply arrives as a `fen` prop change.
- **Rewind must announce where you landed.** "Rewind is an experiment, not an undo"
  (`design/05:39`) is only legible if the user can tell which world they are in. After `R`, the
  board's aria-label recomputes (`Chessboard.svelte:118-122`, it includes the move number) but
  the label of a container is not announced on change; nothing else fires.
- **Comparison is the product's one original claim, and it is inherently visual.** N boards side
  by side is a layout. The screen-reader equivalent is a *structured difference*, and
  `CompareView.svelte` does ship one — `.strip-band`, `.results`, and a `role`-labelled narrative
  — but its evaluation chart is a row of identical `●` characters with the number in a `title`
  attribute (`CompareView.svelte:135`, already recorded as [[D1434]] and in `ux-in-run.md:98`),
  which is exactly the thing that is unreadable by every non-pointer route.

### 1.3 The low-vision user

**Expects:** to zoom to 200–400% without losing content; a board where the two square colours are
distinguishable; highlights that survive their contrast settings; a focus ring they can see.

**What rehearsal owes them.** The move-destination dots and the last-move highlight are not
decoration here — they are how you know **what the consequence was**. In an analysis product you
can always re-read the move list. In rehearsal the board *is* the feedback surface at the moment
of commit. §3.4 measures those paints: the last-move highlight is **1.02:1 luminance contrast on
brown dark squares, greyscale separation 3 out of 441** `[V]`.

And the whole run screen is `height: 100dvh; overflow: hidden` (`ShellFrame.svelte:97`,
`.shell-content { overflow: hidden }` at `:186-189`) with a hard refusal below 360×680. **WCAG
2.1 SC 1.4.10 Reflow** requires content to be usable at 320 CSS px width — equivalently, a
1280 px window at 400% zoom `[V]`
(https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). At 400% zoom the run screen shows the
refusal alert (§3.7).

### 1.4 The person with vestibular sensitivity

**Expects:** that setting "reduce motion" in the OS stops things sliding; and that if the app has
its own motion control, the two agree and the app says which one won.

**What rehearsal owes them.** Piece animation in this product is not ornament — the `250 ms`
normal-speed slide (`theme/controller.ts:43`) is the only thing distinguishing "the opponent
moved" from "the board re-rendered", which matters more here than in analysis because the loop's
whole rhythm is commit-then-wait. So "reduce motion" is a genuine trade for this user, not a free
win, and it is the one preference the product must let them **re-take**. It currently does not:
`controller.ts:37` reads `animation: reducedMotion ? "none" : preference.animation` — a hard
override with no escape hatch, while the Appearance select at `AppearanceSettings.svelte:66` is
bound to `resolved.preference.animation`, i.e. **it goes on displaying the choice the system has
overridden**. [[D1460]] records this; §3.5 adds that a browser test *pins the override as correct*.

### 1.5 The person on a phone on a train

**Expects:** one thumb, portrait, intermittent network, and a board big enough to tap a square.

**What rehearsal owes them.** `mobile-scope.md:246-248` already found the right sentence and it
is worth restating because nothing has acted on it:

> *"everything that is one board survives a phone; everything that is N boards does not — and the
> N-board surfaces are precisely the ones carrying the product's original claim… Mobile does not
> break the loop; it breaks the *comparison*, which is the half the product exists for."*

The train adds a second thing that dossier did not consider: **rehearsal is the chess activity
most suited to a phone**, because a drill is short, resumable and has a defined end, unlike a
game with a clock. That is a positioning argument for the phone, not against it. It runs into
§3.7's refusal gate.

---

## 2. What competitors actually do

### 2.1 The corpus's own answer: nothing

**The repo has recorded no accessibility observation about any competitor.** Verified this pass
across `design/research/`: `competitor-play-ux.md` (359 lines, the anatomy dossier, which reads
lichess's SCSS and Scala at primary source) contains **zero hits** for
`accessib|a11y|aria|WCAG|screen reader|keyboard|contrast ratio|touch target|colour-blind|reduced
motion` — the single "contrast" hit at `:284` is a board-image tuning slider `[V]`.
`competitor-matrix.csv`'s twenty column headers contain **no accessibility and no mobile axis**
`[V]`; its Lichess row (line 13) says nothing about keyboard entry, the mobile app or
accessibility `[V]`. Neither chess.com row mentions either `[V]`. No teardown carries an
accessibility section.

This is bounded by [[D1458]]: **every competitor `[V]` in this repo means "we read the vendor page
or the source", never "we used it"**. Nothing in §2.2 changes that — it is source-read, not
hands-on, and the difference matters more for accessibility than for anything else, because a
correct ARIA tree and a usable screen-reader experience are different claims (the repo already
knows this: `release-platform-audit.md:206-209` refuses to call ARIA inspection an accessibility
pass `[V]`).

### 2.2 Lichess, pinned from lila source this pass `[V]`

The reputation is real and it is architectural. Fetched from
`https://raw.githubusercontent.com/lichess-org/lila/master/` on 2026-08-24; the tree listing
returns 16,729 paths and the accessibility modules are a first-class `ui/` package, not a
sprinkle of attributes:

| Module | What it is |
|---|---|
| `ui/lib/src/nvui/` — `chess.ts`, `command.ts`, `render.ts`, `setting.ts`, `directionScan.ts`, `handler.ts`, `notify.ts` | a **shared non-visual UI layer** consumed by round, analyse, puzzle and study (`ui/round/src/round.nvui.ts`, `ui/analyse/src/analyse.nvui.ts`, `ui/puzzle/src/puzzle.nvui.ts`), with its own tests at `ui/lib/tests/nvui.test.ts` |
| `ui/keyboardMove/` | a separate package — `keyboardMove.ts`, `keyboardSubmit.ts`, `keyboardChecker.ts`, `exports.ts`, its own CSS build and **its own test file** `tests/keyboardSubmit.test.ts`, plus a fully localised string bundle (`translation/dest/keyboardMove/` in ~80 locales) |
| `ui/voice/` | voice move entry — per-language grammars and lexicons for de/en/fr/it/pl/ru/sv/tr/vi, a Vosk backend |
| `ui/round/css/_nvui.scss` | a **different round-screen grid** for nvui: `grid-template-areas: 'nvui' 'side' 'uchat'`, with the board rendered `font-family: monospace` |
| `ui/*/css/_zen.scss` (round, puzzle, storm, racer, botPlay, coordinateTrainer) | zen/chrome-off per surface |

Three specifics worth stealing, all `[V]` from source:

**(a) Board layout is a user preference with two named modes.** `ui/lib/src/nvui/setting.ts`:

```
export type BoardStyle = 'plain' | 'table';
choices: [
  ['plain', 'plain: layout with no semantic rows or columns'],
  ['table', 'table: layout using a table with rank and file columns and row headers'],
],
default: 'plain',
```

Alongside it: `MoveStyle` = `'uci' | 'san' | 'literate' | 'nato' | 'anna'` (default `literate`),
`PieceStyle` = letter / white-uppercase-letter / name / white-uppercase-name (default *white
uppercase name*), `PrefixStyle`, `PositionStyle` = before / after / none, and `PageStyle` =
`'board-actions' | 'actions-board'` — **the user chooses whether the board or the action controls
come first in reading order**. Every one persists via `storage.make('nvui.*')`.

**(b) Squares are real focusable buttons carrying their coordinates as attributes.**
`ui/lib/src/nvui/command.ts`'s `board` command does
`$('button[file="' + file + '"][rank="' + rank + '"]').get(0)` then `button.focus()` — so lichess's
non-visual board is **64 tab-reachable buttons with `file`/`rank` attributes**, not one grid with
`aria-activedescendant`. Both are legitimate ARIA patterns; the difference shows up in §2.3.

**(c) A published board-command vocabulary, not just navigation.** `command.ts`'s
`boardCommands()` renders this help list verbatim:

```
i: go to input form            o: announce current square
c: announce last move capture  l: announce last move
t: read out clocks             m: announce possible moves
arrow keys: move with arrows   k-q-r-b-n-p: move to piece by type
1 to 8: move to rank           shift+1 to 8: move to file
shift+a/d: move backward or forward
x: announce pieces around this square (try shift and alt)
shift+m: announce possible captures
v: announce computer evaluation
g: announce computer best move    shift+g: play computer best move
alt+shift+a/d: cycle previous or next variation
```

Plus `/p <piece>` (announce all locations of a piece type), `/s <file-or-rank>` (scan a rank or
file), and `directionScan.ts`, which walks the eight rays from a square. **This is a
query language for a position, delivered through the keyboard.** It is not an accessibility
affordance bolted onto a visual board; it is a second, complete interface to the same game.

**And note the last four lines.** `v`, `g` and `shift+g` expose engine evaluation and best move
through the non-visual layer. That is precisely what `rfc/accessible-board-input.md:164-165`
forbids for us — *"It does not announce engine evaluation, detector output, attacks, hints or
hidden evidence"* — correctly, because ADR-0006's commit-before-you-learn invariant means our
assistive layer **must inherit the sight ceiling, not exceed it** ([[D659]]). So lichess's
command list is a menu to shop from, not to copy: `o`, `c`, `l`, `m`, `shift+m`, `x`, the piece
and rank/file jumps, and `/p` and `/s` are all rung-0 rules arithmetic and are all admissible
here; `v`, `g`, `shift+g` are not.

### 2.3 What the comparison actually says about our board

Our board is **not behind** lichess on the axis the two share. `Chessboard.svelte:332-359` ships
a `role="grid"` with `aria-rowcount`/`aria-colcount`/`aria-activedescendant`, 64 `role="gridcell"`
children with per-square labels and `aria-selected`, arrow/Home/End/PageUp/PageDown navigation,
Enter/Space activation, double-Escape exit, a labelled promotion dialog, a polite live region, and
a SAN/UCI text-entry fallback available to everyone (`:322-329`). `rfc/module-registration.md`
§4.1 rules *"All of it stays exactly as it is"*, and that ruling is right.

Three genuine gaps against the field, each cheap:

| Gap | Lichess | Us |
|---|---|---|
| **Announcement vocabulary** | 13 board commands + 2 slash commands + ray scan | navigation and move-state announcements only; no "what is around this square", no "what can this piece take", no piece-type jump — all rung-0-legal here |
| **Presentation is a user preference** | 6 persisted settings incl. plain-vs-table and board-vs-actions reading order | none; one fixed presentation |
| **Non-visual layer is shared across surfaces** | one `ui/lib/src/nvui` used by 4 surfaces | one component; Compare, Story and the Live overlay each render boards with no semantic layer at all (§3.8) |

**And the one place we are ahead and should say so:** our text-move fallback is *"available to all
users, not screen-reader sniffed"* (`rfc/accessible-board-input.md:180-198` `[V]`), whereas
lichess's input form is inside the nvui build. Ours is a `<details>` on the board for everyone.

### 2.4 Chess.com, and everyone else

**The corpus says nothing** and this pass did not fetch chess.com's client. `competitor-play-ux.md`
records its Zen Mode from a blog `[P]` and nothing else. **Reporting this as unknown rather than
inferring it** — the field's second-largest product has an unmeasured accessibility posture in
this repo, and so do the other 61 rows of the matrix.

---

## 3. What actually ships — the audit

### 3.1 Inventory

Whole-client counts at HEAD, `apps/web/src` `[V]`:

| Measure | Count |
|---|---|
| ARIA attribute uses | **196** — `aria-label` 66, `aria-labelledby` 59, `aria-describedby` 30, `aria-live` 11, `aria-pressed` 9, `aria-modal` 9, `aria-hidden` 6, `aria-current` 5, `aria-expanded` 4, `aria-busy` 2, and **one each** of `aria-selected`, `aria-rowcount`, `aria-colcount`, `aria-readonly`, `aria-haspopup`, `aria-controls`, `aria-activedescendant` |
| `role="dialog"` | **10**, of which **9** carry `aria-modal="true"` (the exception is the promotion picker, `Chessboard.svelte:366`) |
| **focus traps** | **0** |
| **`inert` uses** | **0** (already found as prose at `planning/ux-work-lane.md:375-387`, never ledgered) |
| `.focus()` calls | 21, across 8 files |
| `tabindex` uses | 11 — nine `-1`, two `0` (`Chessboard.svelte:337` the grid; `Timeline.svelte:40` a `<section>` with an `a11y_no_noninteractive_tabindex` suppression comment) |
| `@media` blocks | 10, all width-based |
| `@media (prefers-reduced-motion)` | **0** |
| `@media (prefers-contrast)` | **0** |
| `@media (forced-colors)` | **0** |
| `@media (prefers-color-scheme)` | **0** in CSS; one `matchMedia` in JS (`theme/controller.ts:66`) |
| visually-hidden implementations | **3 separate ones** — `Chessboard.svelte:429-437` (`clip-path`), `DrillScreen.svelte:1647-1653` (`clip-path`, inside a media query), `GameStoryScreen.svelte` `.sr-only` (deprecated `clip: rect(0,0,0,0)`) |
| axe-core / pa11y / Lighthouse / any a11y scanner | **0**, repo-wide, including all `package.json` files |

The foundation is genuinely real — 196 ARIA uses and a `HonestControl` pattern that binds a
reason to **every** disabled control, gated by a DOM sweep (`screens.test.ts:64-70` `[V]`), is
above the median for an app of this size. The holes are structural, not sloppy.

### 3.2 The keyboard walk, end to end

Walked against the shipped handlers. **Verdict: eight of the loop's stages are reachable by
keyboard and three are conditionally reachable in a way no user could discover.**

#### Stage 0 — arrival and starting a run

| Step | Result |
|---|---|
| Land on `/` | `<html lang="en">` `[V]` `apps/web/index.html:2`. **`<title>Tabiya</title>` is static across all twelve routes** — no `document.title` write exists anywhere in `apps/web/src` `[V]`. **WCAG 2.4.2 Page Titled fails for an SPA** |
| First Tab | hits `ShellFrame.svelte:58`, the skip link. **It targets `#primary-navigation`** — i.e. **the skip link skips *to* the navigation, which is the block it should let you skip.** There is no skip-to-content link and no `<main>` in the shell (`.shell-content` at `:92` is a plain div). WCAG 2.4.1 Bypass Blocks is not satisfied by a link into the thing being bypassed `[V]` |
| Reach the pack list | ~12 tab stops first: wordmark + 9 nav links + handle + Sign out `[V]` `ShellFrame.svelte:60-88` |
| Choose a pack | every pack card's button has the accessible name **"Open position ↗"** — identical for all N packs; the `<h2>` title is not in the name `[V]` `PackList.svelte:41-43`. A screen-reader user listing buttons gets N indistinguishable entries |
| Route changes | **nothing happens.** `App.svelte:651-656` sets `route`, loads data and syncs polling; **no focus move, no title change, no announcement** `[V]`. The whole page replaces itself silently |
| `g`-chord navigation | works, and is the one route-change path that *does* end somewhere sensible (`g m` focuses the first nav link, `keyboard.ts:85`) `[V]` |

#### Stage 1 — commit a move

**This stage works, and is the best part of the app.** `tests/browser/drill.spec.ts:747-784`
drives a full keyboard move — focus the grid, read `aria-activedescendant`, arrow to origin,
Enter, arrow to destination, Enter — and asserts the resulting **network POST body carries the
intended UCI** `[V]`, i.e. keyboard input is proved wire-equivalent to pointer input. Tab order
into and out of the drill region is tested in both directions across 12 markers
(`drill.spec.ts:1363-1412` `[V]`). Promotion moves focus to the picker's first button
(`Chessboard.svelte:163`) and Escape returns it to the grid (`:217-220`) `[V]`.

**The one break here is [[D1447]], and this pass pins its exact mechanism.**
`Chessboard.svelte:144` wires `onSelect` into Chessground's `events: { select }` — the **pointer**
select event — and nothing else. The keyboard path runs through `dispatch()` → `apply()`
(`:156-177`), which calls `onActiveSquareChange` and, on commit, `onMoveCommitted`/`onMove` —
**and never `onSelect`.** `DrillScreen.svelte:892` is the sole writer of `selectedSquare`;
`:381` filters sight features by it; `:382` builds `boardOverlays` from that. So structural sight
— the rung-0 feature that is *free, always-permitted and never a spoiler* — is pointer-only.

**The repair, precisely:** call `onSelect?.(square)` from the `activate` path in
`Chessboard.svelte`'s `dispatch`/`apply`, on the transition into `origin_selected`. It must be
the `activate` path and **not** `onActiveSquareChange`, because sight is `sight_on_request` and
binding it to cursor movement would repaint on every arrow key. Two lines. **No ruling needed.**

#### Stage 2 — ask for help

| Step | Result |
|---|---|
| Press `?` on the board grid | works — `DrillScreen.svelte:675` handles `?` **before** the interactive-target check `[V]` |
| The help dialog | `role="dialog" aria-modal="true"`, focus moves to the heading (`KeyboardHelp.svelte:29-33`) `[V]` |
| Tab inside it | **escapes into the page behind.** No trap, no `inert`, nothing `aria-hidden`. `aria-modal="true"` hides the background from *assistive technology* and does nothing for Tab, so keyboard and screen-reader users get **different and contradictory models of what exists** `[V]` |
| Escape | closes it, and the drill path restores focus to the invoker (`DrillScreen.svelte:527-529, 679`) `[V]` — this is done well |
| Read it at 360×680 | **`KeyboardHelp.svelte:57-62` has no `max-height` and no `overflow`.** Twelve `<dl>` rows in a `place-items: center` grid with no scroll: the ends of the list are clipped and unreachable. `ShellKeyboardHelp.svelte:58` — the *other* help dialog — gets `max-height: calc(100dvh - 2rem); overflow: auto` `[V]`. Same author, same week, one has it |
| The two maps disagree | `KeyboardHelp` lists 12 drill keys and **no `g` chords**; `ShellKeyboardHelp` lists 11 chords and no board keys, then names the drill's set in a prose sentence (`:43`). There is no single place a user can read the whole keyboard `[V]` |

#### Stage 3 — rewind, fork, switch branch, compare, replay, export

**This is where it breaks.** `DrillScreen.svelte:497-510`:

```ts
function interactiveTarget(event: KeyboardEvent): boolean {
  return event.composedPath().some((target) =>
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLButtonElement ||
    target instanceof HTMLAnchorElement ||
    ... target.dataset.boardInputGrid !== undefined ),
  );
}
```

`keyboard()` at `:693-701` returns `false` — declining the event — whenever that is true. So:

**`R`, `Shift+R`, `B`, `1`–`9`, `Alt+C`, `←`, `→`, `Space` and `E` are live only when the focused
element is `main.drill` or `.drill-region`** — the two `tabindex="-1"` containers focused on
mount (`:778`) and on dialog close (`:528`). Every `<button>` and `<a>` in the region kills all
nine. The browser suite's own verified tab order is
`assistance → inspector → help → text-summary → text-input → text-submit → board-grid →
timeline → companion-tabs → branches → board-marks → run-actions` (`drill.spec.ts:1397` `[V]`) —
**twelve stops, and at every one of them the drill keyboard map is dead.**

Consequences, each derived from the handler:

1. **From the board grid**, all nine are suppressed (`:507`, the `boardInputGrid` clause) — arguably
   correct, since the grid owns arrows and Space. But the **only** documented way out is
   double-Escape (`Chessboard.svelte:252-264` → `onExitGrid` → `regionElement.focus()`,
   `DrillScreen.svelte:893`), and `KeyboardHelp.svelte:20` describes it as *"Board Escape: Cancel
   selection; press again to leave the board"* — which does not say that leaving the board is
   what re-arms the other eleven shortcuts.
2. **From anywhere else** — the timeline, the branch cards, the companion tabs, the run actions —
   there is **no key at all** that returns focus to the region. Escape falls through
   `:684-692` and returns `false` when no overlay is open. The user is stranded with a keyboard
   map that no longer works and no message saying so.
3. **`←`/`→` step the timeline (`:741-744`) — except while focus is inside the timeline**, because
   timeline plies are `<button>`s. The one place arrow-stepping is discoverable is the one place
   it is off `[V]`.
4. **`Space` toggles replay (`:745-748`) — except on any button, where Space activates the
   button.** Correct browser behaviour, and it means the advertised shortcut silently changes
   meaning depending on invisible state.
5. **`Alt+C` for compare has a *second*, stricter guard**: `:729-733` additionally requires
   `event.target === mainElement || event.target === regionElement`. So Alt+C is narrower than the
   other eight, and `KeyboardHelp.svelte:17` says only *"when the drill region is focused"* `[V]`.
6. **The `g` chord is live inside the board grid.** `keyboard.ts:52-59`'s `interactive()` covers
   input/textarea/select/contenteditable and **not** the `role="grid"` div, so after
   `DrillScreen` declines, `keyboard.ts:104-109` arms a 1.2 s navigation chord. A stray `g` while
   reading the board swallows the next keystroke `[V]`.
7. **The checkpoint sheet swallows Escape.** `:684-692`: with `checkpoint !== undefined` and no
   overlay open, control falls past every branch to `event.preventDefault(); return true;` —
   Escape is consumed and **does nothing**. It is an `aria-modal="true"` dialog
   (`CheckpointSheet.svelte:94`) that eats the universal dismiss key silently. If the gate is
   deliberate — and it may well be, it is the commit-before-you-learn checkpoint — it must *say*
   so; a silently swallowed Escape reads as a hang.
8. **`ShapePanel` is an overlay with no focus behaviour at all.** Opened from a timeline marker
   button (`Timeline.svelte:51,78`), it renders `<aside aria-labelledby=…>` with a Close button
   (`ShapePanel.svelte:12-19`) — **no `role="dialog"`, no focus move on open, no focus restore on
   close, no Escape handler** `[V]`. A keyboard user activates a marker and nothing observable
   happens.
9. **`Timeline.svelte:40` puts a non-interactive `<section>` in the tab order** and then gives
   every ply its own button, plus per-ply shape and pivotal markers. **A 40-ply run is 40+
   consecutive tab stops** with no roving tabindex and no skip `[V]`.
10. **Keyboard hints are inside accessible names** — `<kbd>` elements inside buttons with no
    `aria-label` override, so the tree reads *"Fork B"*, *"Replay Space"*, *"Export E"*,
    *"Rewind to preview Enter"* (`DrillScreen.svelte:1025`, `Timeline.svelte:96`,
    `CompareView.svelte`). Recorded at `planning/ux-work-lane.md:267-276` as proposed D494; **never
    ledgered, still true at HEAD** `[V]`.

#### Stage 4 — review, story, live

- `CompareView` focuses its heading on mount and has `aria-pressed` zoom controls `[V]` — good.
  Its `●` sparkline is `title`-only `[V]` (`:135`) — [[D1434]].
- `GameStoryScreen` is keyboard-reachable throughout and is the **only** file using `Canvas`/
  `CanvasText` system colours, so it is the only surface that would survive forced-colors mode
  `[V]`.
- The **live overlay** (`App.svelte:1074`) renders a `Chessboard` with `disabled={true}` — which
  still mounts the full `role="grid"` and its 64 cells inside a `<main aria-label="Live session
  overlay">` intended for a broadcast capture, not a reader `[V]`. Harmless but noisy.

#### The one keyboard thing that is unambiguously good

`keyboard.ts:103` — `if (interactive(target)) return;` — means single-letter shortcuts never fire
while typing in an input, textarea, select or contenteditable `[V]`. That is the mistake most
apps make and this one does not. It is also **the module with no unit test** (`keyboard.ts`, 132
lines; `screens.test.ts:45-48` imports it **types-only** and supplies its own fake dispatcher, so
zero lines of its runtime execute in any test) `[V]`, already recorded at [[D1453]].

### 3.3 Screen reader

Eleven `aria-live` regions ship. **One is asserted through its live-region identity in the whole
1,779-line browser suite** (`Chessboard.svelte:360`, asserted at `drill.spec.ts:1360`) `[V]`. The
others — `App.svelte:1085`, `AssistanceSettings.svelte:101`, `WhyBanner.svelte:12`,
`DrillScreen.svelte:835/965/977`, `BranchRail.svelte:72`, `ShellFrame.svelte:70`,
`PackList.svelte:28`, `CompareView.svelte:79` — are never exercised as announcements `[V]`.

Two of them have defects that only appear at small widths:

- **`ShellFrame.svelte:70`, the `.run-context` region carrying "Thinking…" / "Writer" /
  "Read-only", is `display: none` below 60rem (`:196-198`)** `[V]`. A `display:none` element is
  removed from the accessibility tree, so **the busy state is not announced at all on tablet or
  phone.** The one live status a screen-reader user needs while waiting for the opponent
  disappears on the viewport where waiting is longest.
- **`DrillScreen.svelte:835`, the `.status` region, is visually hidden below 719px
  (`:1647-1653`)** using `clip-path` — that one is correct (clipped, not `display:none`) `[V]`,
  and is the right pattern the other should copy.

Of the ~467 `getByRole`/`getByLabel`/`getByText` uses in the browser suite, **roughly 22 (4.7%)
assert accessibility semantics**; the rest are convenient click selectors `[V]`. Zero assertions
exist on `aria-pressed`, `aria-current`, `aria-modal`, `aria-checked`, `aria-busy` or heading
hierarchy `[V]`.

### 3.4 Contrast, colour vision, and the board paint — measured this pass

`interaction-paint.css` contains **15 hard-coded colour literals and zero `var()`** ([[D1461]],
re-verified `[V]`). This pass measured what those literals actually do.

**Method `[V]`, reproducible:** sRGB → linear per WCAG relative-luminance; alpha composited over
each square colour; WCAG contrast ratio; CIE76 ΔE\*ab (the formula `rfc/theming.md:543` pins for
criterion 7) and CIE2000; greyscale distance; and Viénot-1999 LMS dichromat simulation for
protan/deutan/tritan. Square colours read from `theme/board-skins/olive.css:2-3` and `brown.css:2`
(brown's dark square is the base `#f0d9b5` under the embedded SVG's `opacity="0.2"` black
rect → `rgb(192,174,145)`).

**Finding A — the ΔE 18.3 olive failure is repaired at HEAD, and the ledger is stale.**
`rfc/theming.md:557` records `selected + dests` at **18.3 ✗** on olive, and `:561` proposes
*"lighten the olive dark square to `#96a25e` (ΔE 20.0)"*. `olive.css:2-3` **already carries
`#96a25e`**, and this pass reproduces the predicted value exactly: **CIE76 ΔE 20.0** `[V]`. The
brief's premise that olive has "an unrepaired ΔE 18.3 contrast failure" does not hold at HEAD.

**Finding B — criterion 7's population is incomplete, and the paint it misses is the capture
indicator.** Criterion 7 enumerates the brush pairs and the dests fill. It does **not** enumerate
`square.oc.move-dest` (`interaction-paint.css:7`) — the ring drawn on an *occupied* destination,
i.e. **the only signal that a legal move is a capture**. Measured against the same ΔE ≥ 20 floor:

| Paint | olive dark | olive light | brown dark | brown light |
|---|---|---|---|---|
| dests / selected `rgba(20,85,30,.5)` | **20.0** | 33.0 | 27.8 | 33.4 |
| last-move `rgba(155,199,0,.41)` | 25.2 | 32.1 | 36.3 | 35.1 |
| check `rgb(255,0,0)` | 101.6 | 95.3 | 94.5 | 96.8 |
| premove `rgba(20,30,85,.5)` | 41.2 | 44.8 | 36.9 | 43.1 |
| **occupied-dest ring `rgba(20,85,0,.3)`** | **12.5 ✗** | 20.5 | **18.6 ✗** | 21.2 |

CIE76 ΔE\*ab, criterion 7's own formula and floor `[V]`. **Two of four cells fail, on both
shipped board skins, on the dark squares — and nothing sees it, because the ring is not in the
enumerated set.** This is [[D1461]]'s pattern a second time: the criterion passes because its
population does not include the thing that is wrong.

**Finding C — criterion 7's metric is blind to the channel low-vision users depend on.** ΔE is
chroma-dominated. WCAG contrast is luminance-only. They disagree sharply on the same paints:

| Paint on brown dark square | ΔE\*ab | WCAG contrast | greyscale distance (0–441) |
|---|---|---|---|
| last-move | 36.3 ✓ | **1.02 : 1** | **3** |
| check | 94.5 ✓ | **1.84 : 1** | 85 |
| dests | 27.8 ✓ | 1.97 : 1 | 93 |

`[V]`. **The last-move highlight is a pure hue shift with essentially no luminance change.** In
greyscale, in monochrome mode, on a sun-washed phone screen, or for anyone whose vision is
luminance-dominated, *the square telling you what your opponent just played is invisible* — and
criterion 7 rates it a comfortable pass. Olive dark is only marginally better (1.14:1, greyscale
19).

**Finding D — the two board skins are 1.58:1 and 1.99:1 between their own light and dark
squares** (brown, olive; WCAG contrast) `[V]`. That is a deliberate aesthetic inherited from the
field and is not by itself a violation — but it means the *board* contributes almost no
luminance separation, so every semantic paint on it is carrying the whole signal, which makes
Finding C worse rather than academic.

**Finding E — colour vision was never considered anywhere in the corpus, and one indicator
fails.** Zero hits for `colour-blind|color-blind|deuteran|protan|tritan|achromat` across
`design/`, `planning/`, `docs/`, `rfc/` `[V]`. Simulated (Viénot 1999), sRGB distance of paint
against its own square:

| Paint / square | normal | protan | deutan | tritan |
|---|---|---|---|---|
| check / brown dark | 235 | 175 | 151 | **5** |
| check / olive dark | 215 | 124 | 96 | 151 |
| last-move / olive dark | 41 | 44 | 41 | 31 |
| dests / olive dark | 82 | 66 | 70 | 73 |

`[V]`. **The check indicator vanishes for tritanopes on brown dark squares.** Tritanopia is rare
(~0.01% of the population `[M]`); the *pattern* — a single unbacked hue carrying a critical
state — is not, and this is the only measurement anyone has made.

**Finding F — three hard-coded whites in themed colour, one of them the focus ring.** Already
found by `ux-settings-and-identity.md:627-629`; re-verified `[V]`: `App.svelte:1132` (the global
`:focus-visible` outline), `:1133` (`::selection`), `ShellFrame.svelte:128`
(`color-mix(in srgb, var(--paper) 94%, white)` on the topbar). Add two more this pass:
`App.svelte:1150` sets `background: white` on the repertoire form's inputs, selects and textareas
`[V]`, and `Timeline.svelte:204` sets `color: white` on the Rewind confirm button `[V]`. The
focus ring being the accessibility control that lightens toward white in every theme is the
sharpest of these.

**Finding G — forced-colors mode is unhandled.** No `@media (forced-colors)` anywhere `[V]`. In
Windows High Contrast, `background-color` is forced but `background-image` is not — and **every
move-destination and check indicator in `interaction-paint.css` is a `radial-gradient`, i.e. a
background-image** (`:2,5,7,8,16` `[V]`). The board's system-colour work in
`Chessboard.svelte:423-427` (`CanvasText` for the focus ring and active cell) is correct and is
the only forced-colors-aware code in the client; the paint it sits on top of is not.

### 3.5 Motion

- `theme/controller.ts:37` — `animation: reducedMotion ? "none" : preference.animation` `[V]`.
  The OS wins, the user cannot re-take the choice, and `AppearanceSettings.svelte:66` binds the
  select to `resolved.preference.animation`, so **the control keeps displaying a value that is
  not in effect**. [[D1460]]; the fix text is already drafted at
  `ux-settings-and-identity.md:365-368`.
- **A browser test pins the defect as correct behaviour.** `tests/browser/theme.spec.ts:52-53`:
  `await page.emulateMedia({ reducedMotion: "reduce" });` then
  `await expect(shell).toHaveAttribute("data-animation", "none");` — with `animation: "fast"`
  stored `[V]`. Repairing [[D1460]] therefore requires editing a green test, which is worth
  knowing before it is scheduled.
- **`prefers-reduced-motion` reaches exactly one thing: Chessground's piece interpolation.** There
  is no CSS block for it `[V]`, so `KeyboardHelp`/`ShellKeyboardHelp`'s `backdrop-filter: blur(6px)`
  and every `transform`/transition elsewhere are unaffected.
- `theme.spec.ts:52-53` is also the *only* `emulateMedia` call in 1,779 lines of browser tests.
  `forcedColors` and `colorScheme` emulation: **zero** `[V]`.

### 3.6 Touch and target size

WCAG 2.2 SC 2.5.8 Target Size (Minimum), AA, requires 24×24 CSS px `[V]`
(https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Measured from the shipped CSS `[P]` (computed from font-size × line-height + padding + borders,
not from a rendered DOM):

| Control | Site | Height | |
|---|---|---|---|
| Chess squares at the 360×680 floor | `play-composition.ts:27-61` | **43 px** | ✅ comfortably |
| `.pivotal-marker` | `Timeline.svelte:196` | `min-height:1.5rem` = 24 px | ✅ exactly |
| `.shape-marker` | `Timeline.svelte:195` | ≈ 24.1 px | ✅ by 0.08 px |
| `.ambient` | `DrillScreen.svelte:1375` | 32 px | ✅ |
| `.objective-line` (phone) | `DrillScreen.svelte:1664`, `--objective-h: 32px` | 32 px | ✅, and it is the **only** route to the objective dialog on a phone |
| `.appearance-link` on the board | `Chessboard.svelte:386-398` | ≈ **21 px** (0.65 rem text + 0.25 rem padding + border) | ❌ |
| `.text-move` input and Submit | `Chessboard.svelte:456` | ≈ **21 px** (0.25 rem padding, 0.72 rem context) | ❌ — and this is the **accessibility fallback control** |
| `.identity-control button` (Sign out) | `ShellFrame.svelte:184` | ≈ 24 px | ⚠ borderline |
| `nav a` | `ShellFrame.svelte:143-150` | ≈ 31 px | ✅ |

The existing guard, `client-surface-floor.test.ts:22-35`, checks the 24 px floor by **regexing
two CSS rules in one file** (`Timeline.svelte`'s two markers) and asserting arithmetic on the
literal values `[V]`. It cannot see any of the other ~200 controls, and in particular cannot see
the two that fail — both of which live in `Chessboard.svelte`, absolutely positioned **on top of
the board**.

Also `[V]`: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
(`index.html:5`) — **no `maximum-scale`, no `user-scalable=no`.** Pinch-zoom works. That is the
right call and worth recording as a pass.

### 3.7 What the product is on a phone

#### The refusal gate

`viewport-support.ts:1` — `MINIMUM_RUN_VIEWPORT = { width: 360, height: 680 }`. `:11` — both
dimensions must be met. `DrillScreen.svelte:207` measures `globalThis.innerWidth/innerHeight` on
mount and on every `resize`. Below the floor, `:814-818` renders a `role="alert"` section and
**`:832` never mounts the board at all**; `:1080`, `:1103`, `:1121`, `:1123`, `:1133`, `:1198`,
`:1212`, `:1230`, `:1231` gate every checkpoint, terminal, help, objective, inspector, fork,
picker, shape and pivotal surface on `viewportSupport.supported` `[V]`. `docs/app-shell.md:161-166`
states the floor and its rationale.

**The stated rationale does not support the constant it enforces.** The refusal text is *"Below
that, 24-pixel chess-square targets and a fully visible board cannot both fit"*
(`viewport-support.ts:18` `[V]`). 24 px squares are a 192 px board; with the phone class's 8 px
stage padding that needs **208 px of width**, and with the 56+40+32+48+32 px of chrome
`play-composition.ts:49-60` subtracts, **400 px of height**. The enforced floor is 360×680. At
that floor the squares are **43 px**, not 24. The width floor is 1.7× its own justification and
the height floor is 1.7× as well — and the height floor is the one that excludes real devices.

#### The device table

Computed by running the shipped `playBoardEdge`/`playViewportClass`
(`apps/web/src/lib/play-composition.ts:16-62`, the file `rfc/play-composition.md` §2.5 designates
as *"one authority for both rendered geometry and the browser acceptance matrix"*) against real
viewport sizes `[V]`. Board edge reproduces `rfc/play-composition.md:277-289` exactly at the
viewports both cover.

| Device / condition | vw × vh | gate | class | board | square |
|---|---|---|---|---|---|
| iPhone SE 2nd/3rd gen, portrait | 375 × 667 | **REFUSED** | phone | — | — |
| iPhone 12/13/14, Safari, address bar visible `[P]` | 390 × 664 | **REFUSED** | phone | — | — |
| iPhone 15/16 Pro, Safari, address bar visible `[P]` | 393 × 672 | **REFUSED** | phone | — | — |
| Galaxy Fold, closed | 280 × 653 | **REFUSED** | phone | — | — |
| **any phone in landscape** (iPhone 14) | 844 × 390 | **REFUSED** | *tablet* | — | — |
| **any phone in landscape** (Pixel 5) | 851 × 393 | **REFUSED** | *tablet* | — | — |
| **1280 px desktop at 400% zoom (WCAG 1.4.10)** | 320 × 256 | **REFUSED** | phone | — | — |
| Galaxy S8+ / the tested floor | 360 × 740 | runs | phone | 344 px | 43 px |
| iPhone 13 mini | 375 × 812 | runs | phone | **352 px** | 44 px |
| iPhone 12/13/14, full layout viewport | 390 × 844 | runs | phone | 368 px | 46 px |
| iPhone 15 Pro / Pixel 5, full layout viewport | 393 × 852 | runs | phone | 376 px | 47 px |
| Pixel 7, Chrome chrome visible `[P]` | 412 × 742 | runs | phone | 392 px | 49 px |
| iPhone 14/15 Plus & Pro Max | 430 × 932 | runs | phone | 408 px | 51 px |
| iPad mini portrait | 744 × 1133 | runs | tablet | 712 px | 89 px |
| iPad Pro 11 portrait | 834 × 1194 | runs | tablet | 800 px | 100 px |
| iPad Pro 11 **landscape** | 1194 × 834 | runs | desktop | **704 px** | 88 px |
| laptop | 1280 × 720 | runs | desktop | 592 px | 74 px |
| desktop | 1440 × 900 | runs | desktop | 768 px | 96 px |

Five things fall out of that table.

1. **The "352 px board" in the brief is a desktop figure and it is fixed.**
   `planning/ux-work-lane.md:209-221` measured 352 px at **1440×900** from
   `.board-frame { width: min(100%, max(10rem, calc(100dvh - 34rem)), 40rem) }` `[V]`; it was
   closed as [[D496]] and the same viewport now yields **768 px** `[V]`. The 352 px figure survives
   at HEAD only as a coincidence: it is what a **375 px-wide phone** gets. Do not carry it forward
   as a live desktop defect.
2. **iPhone SE is refused.** 375×667 fails the 680 height floor by 13 px. It was sold new until
   2024 and is a large installed base `[M]`.
3. **The iPhone 12–15 Pro class is refused in Safari with the address bar showing** `[P]` — the
   default state on page load. `window.innerHeight` there is widely reported at 664–672 against a
   layout viewport of 844–852 `[P]`, and the address bar collapses **on scroll**, which cannot
   happen here because `ShellFrame.svelte:97` is `height: 100dvh` with `overflow: hidden` and
   `.shell-content` at `:186-189` is `overflow: hidden` too — **there is nothing to scroll.** If
   that `innerHeight` figure is right, the most common phone class in the target market gets a
   refusal alert permanently, and the same phone **installed as a PWA works**, because standalone
   display (`manifest.webmanifest`, `"display": "standalone"` `[V]`) removes the chrome. **This is
   the single highest-value thing to check on a real device, and nobody has ever opened this app
   on one.**
4. **Every phone in landscape is refused twice over.** The height gate rejects 390–393 px; and if
   it did not, `playViewportClass` (`play-composition.ts:17`) classes 844 px wide as **tablet**,
   so a landscape phone would get the tablet composition — board plus a 176 px companion band —
   in 390 px of height. The manifest declares no `orientation` `[V]`, so an installed PWA can be
   rotated into this state. `rfc/play-composition.md:690` is the **only** portrait/landscape
   sentence in the entire corpus and it is about an iPad `[V]`.
5. **Rotating an iPad to landscape shrinks the board by 96 px** (800 → 704), because the desktop
   branch subtracts the fixed 336 px rail `[V]`. Getting more screen makes the board smaller.

#### WCAG 1.4.10 Reflow

A 1280 px window at 400% zoom presents a 320×256 CSS-px viewport `[V]`
(https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). The run screen refuses. Combined with
`overflow: hidden` on the shell and content, **the run screen is a Level AA Reflow failure by
construction**, and the refusal *is* the failure — a stated refusal is more honest than a broken
layout, and it is still non-conformance. This needs no ruling to *record*; what to do about it is
§5.

#### What the phone product actually is, region by region

At ≤719 px (`DrillScreen.svelte:1636-1679` `[V]`):

- `.position-column` = **board** (`--board-edge`) → **timeline strip** (40 px) → **objective line**
  (32 px). Nothing above the board, correctly, per [[D911]].
- `.rail-stack` becomes a **48 px rim** (`--rim-h`) below that, carrying
  `<nav aria-label="Run regions">` with three tabs — **Support, Branches, Actions**
  (`DrillScreen.svelte:947-952` `[V]`). Those three buttons carry **no `aria-pressed`, no
  `aria-current` and no tab/tablist roles** — only a `class:active` — so on the viewport where
  exactly one region is visible, **a screen-reader user cannot tell which one it is** `[V]`. The
  same file uses `aria-pressed` correctly on the replay toggle at `:1044`, and `CompareView.svelte:70-72`
  uses it correctly on its zoom control, so the pattern is present in the codebase and simply
  missing here.
- `.companion-section` is `display: none` unless `compact-active` — so **exactly one of
  `design/05`'s regions 2, 3 and 4 is visible at a time, and by default none of them is** (the
  rim shows tabs; `.rail-stack:not(.sheet-open) .companion-scroll { display: none }` at `:1674`).
- Opening one sets `.sheet-open`: `position: fixed; right:0; bottom:0; left:0; height: min(68dvh,
  38rem)` (`:1668`). The board does not move —
  `tests/browser/drill.spec.ts:1436,1438` asserts its bounding box is byte-identical before and
  after `[V]` — so the sheet **overlays** it. At 390×844: board occupies roughly y=56→424, sheet
  top is at y≈270, so **≈154 px of a 368 px board, about 42%, is covered** `[P]` (arithmetic over
  the CSS, not a rendered measurement).
- The sheet has **no `role="dialog"`, no `aria-modal`, no focus move, no focus trap, no Escape**
  — it is an `<aside aria-label="Run companion">` (`:929`) `[V]`. Tab order still runs through the
  board underneath it.
- Everything else — `.companion-identity` — is hidden (`:1669`).

**So: the small-screen product is one board, a strip, one line of objective, and a drawer that
shows one region at a time and covers two-fifths of the board while it is open.** That is a
defensible phone design and it is close to what lichess does structurally (board full-width,
working content below `[V]` `competitor-play-ux.md:51-54`). Two things separate it from a good
one: lichess's content goes *below the board in one scroll* rather than *over the board in a
drawer*, and lichess never refuses to render.

And the loop-level consequence `mobile-scope.md` named still holds: **compare is the stage that
does not fit.** `CompareView`'s grid is
`repeat(var(--branches,2), minmax(var(--cell-floor,15rem),1fr))` — 15 rem floors per column, so
two columns need 480 px before gaps `[V]`. On a 390 px phone, two-branch compare — the product's
one original claim — horizontally scrolls from the first column.

### 3.8 Per-surface summary

`✔` = handled, `~` = partial, `✘` = absent. Derived from the file cited in each row `[V]`.

| Surface | Keyboard reach | Focus mgmt | Live region | Landmark + H1 | Small screen |
|---|---|---|---|---|---|
| Shell / nav (`ShellFrame.svelte`) | ✔ but 12 stops, skip-link points at the nav | n/a | ~ (`display:none` <60rem) | ✘ no `<main>` in shell | ✔ nav scrolls horizontally |
| Home (`App.svelte:724`) | ✔ | ✘ no focus on route change | ✘ | ✔ | ~ untested |
| Play / pack list (`PackList.svelte`) | ✔ | ✘ | ✔ loading | ✔ | ~ untested; N identical button names |
| Just Play starter (`JustPlayStarter.svelte`) | ✔ | ✘ | ✘ | ✘ (section) | ✔ 1-col ≤50rem |
| **Run / drill** (`DrillScreen.svelte`) | ~ — see §3.2 | ~ invoker-restore on dialogs, no traps | ✔ ×3 | ✔ | ✔ sheet, **refuses <360×680** |
| Board (`Chessboard.svelte`) | ✔ **the best surface** | ✔ | ✔ | n/a | ✔; 2 sub-24 px controls on it |
| Timeline (`Timeline.svelte`) | ~ N+1 tab stops, arrows dead inside | ✘ | ✘ | n/a | ✔ 40 px strip |
| Branch rail (`BranchRail.svelte`) | ✔ | ✘ | ✔ | n/a | ✔ tab |
| Phone region tabs (`DrillScreen.svelte:947`) | ✔ | ✘ | ✘ | n/a | ✘ **no selected state in the tree** |
| Compare (`CompareView.svelte`) | ✔ | ✔ heading focus | ✔ | ✔ | ✘ 2 cols = 480 px min |
| Checkpoint sheet (`CheckpointSheet.svelte`) | ✔ | ~ heading focus, **Escape swallowed** | ✘ | ✔ | ✔ 1-col ≤760px |
| Terminal sheet (`TerminalSheet.svelte`) | ✔ | ~ heading focus, no trap | ✘ | ✔ | ✔ |
| Shape panel (`ShapePanel.svelte`) | ✘ **no focus, no role, no Escape** | ✘ | ✘ | ✘ | ✘ no media query |
| Inspector (`DrillScreen.svelte:1133`) | ✔ `aria-expanded` sections | ~ no trap | ✘ | ✔ | ✔ 1-col |
| Review / story (`GameStoryScreen.svelte`) | ✔ | ✘ | ✔ ×2 `role="status"` | ✔ | ✔ **best responsive surface**; only forced-colors-safe file |
| Rating / Record (`RatingScreen.svelte`) | ✔ | ✘ | ✘ | ✔ | ✔ ≤720px |
| Live list / session (`App.svelte:1030,1064`) | ✔ | ✘ | ✘ | ✔ | ✘ no media query |
| Live overlay (`App.svelte:1074`) | n/a broadcast | n/a | ✘ | ~ | ✘ |
| Create / studio (`App.svelte:974`) | ✔ | ✘ | ✘ | ✔ | ✘ no media query; hard-coded white inputs |
| Library (`App.svelte:1080`) | ✔ | ✘ | ✔ | ✔ | ~ |
| **Settings — Appearance** (`AppearanceSettings.svelte`) | ✔ | ✘ | ✘ | ✔ h2 | ✔ auto-fit grid |
| **Settings — Assistance** (`AssistanceSettings.svelte`) | ✔ | ✘ | ✔ deletion preview | ✔ h2 | ✔ 1-col ≤719px |
| Cohort standing (`CohortStanding.svelte`) | ✔ | ✘ | ✘ | ✘ | ✘ no media query |
| Group panel / creator (`GroupPanel.svelte`) | ✔ | ✘ | ✘ | ✘ | ~ `flex-wrap` |

**The pattern the table shows:** the drill got the attention, the board got the most, and
**seven surfaces have no width media query at all** — Shape panel, Live list, Live session,
Create/studio, Cohort standing, and the two overlays. `rfc/play-composition.md` covers the run
screen and explicitly nothing else `[V]`; no RFC and none of the six UX dossiers specifies the
responsive composition of Settings, Create, Live or Library.

### 3.9 What the test suite proves, and what it cannot

1,779 lines of Playwright across four spec files; 467 role/label/text selector uses `[V]`.

**Genuinely proved:** keyboard board input is wire-equivalent to pointer
(`drill.spec.ts:747-784`); the semantic grid keeps 8 rows / 64 cells / exactly one
`aria-selected` after a keyboard move (`:1344-1361`); Tab traverses 12 drill regions in **both**
directions and exits the region (`:1363-1412`); every disabled control has a resolvable
`aria-describedby` (`screens.test.ts:64-70`, a DOM sweep); the 360×680 refusal fires at 360×679
with the exact copy (`:1464-1467`); phone sheets do not move the board (`:1414-1468`); every
Tabiya-authored palette clears 4.5:1 / 3:1 (`theme/theme.test.ts:147-171`).

**Cannot be proved by it, and is not:**

| Gap | Evidence |
|---|---|
| **No `projects` array; one implicit Chromium project at 1440×1000** | `playwright.config.ts:12-18` `[V]` |
| **`devices[…]` is never imported repo-wide**; `hasTouch` appears in exactly **one** test body (`drill.spec.ts:1324`) | `[V]` — so 8 of 9 phone-width assertions run with **desktop input semantics**: no touch, no coarse pointer, no mobile UA |
| **Zero automated a11y scanning** — no axe, pa11y or Lighthouse in any `package.json` or source file | `[V]`; already noted at `planning/breadth/live-and-platform.md:277` |
| Only ~22 of 467 selector uses (**4.7%**) assert accessibility semantics | `[V]` |
| **1 of 11 live regions** is asserted as an announcement | `[V]` |
| `Escape` is **never pressed** in the entire suite; no focus-trap or focus-restore-on-close test exists, against 10 dialogs | `[V]` |
| `forcedColors` and `colorScheme` emulation: **zero**; `reducedMotion`: one assertion, which pins [[D1460]] | `[V]` |
| `keyboard.ts` — the module owning the whole shortcut system — has **no unit test**; its only test-layer import is types-only | `[V]`, [[D1453]] |
| The 24 px target-size guard regexes **two CSS rules in one file** | `client-surface-floor.test.ts:22-35` `[V]` |
| No screen reader has ever been used against this product | `release-platform-audit.md:206-209`; `rfc/accessible-board-input.md:292` (Discharge D3, unrun) `[V]` |

---

## 4. Defects that need no owner ruling

Twelve. Each is a repair to something already specified, or to a pattern already implemented
correctly elsewhere in the same codebase; none needs a design decision. Ordered by cost-to-value,
cheapest first.

| # | Defect | Site | Repair |
|---|---|---|---|
| **1** | **Keyboard cannot reach square sight** ([[D1447]]) | `Chessboard.svelte:144,156-177`; `DrillScreen.svelte:892` | call `onSelect?.(square)` from the `activate` transition into `origin_selected`. **Two lines.** Not from `onActiveSquareChange` — sight is on-request, not on-cursor. Already recommended first in `ux-in-run.md:391-397` |
| **2** | **`KeyboardHelp` clips at the viewport floor** — no `max-height`, no `overflow` | `KeyboardHelp.svelte:57-62` | copy `ShellKeyboardHelp.svelte:58` verbatim. **One line** |
| **3** | **The skip link skips *to* the navigation** | `ShellFrame.svelte:58` | wrap `.shell-content` in `<main id="main-content">` and point the skip link there; keep the nav link as a second one if wanted. WCAG 2.4.1 |
| **4** | **`<title>` never changes across 12 routes** | `apps/web/index.html:9`; `App.svelte:651-656` | set `document.title` in the router subscription. WCAG 2.4.2. **~3 lines** |
| **5** | **Route change moves no focus and announces nothing** | `App.svelte:651-656` | focus the new view's `<h1>` (they all have `id`s and `aria-labelledby` already) or announce the route name in a polite region |
| **6** | **The busy/read-only live region is `display:none` below 60rem**, so "Thinking…" is never announced on tablet or phone | `ShellFrame.svelte:70,196-198` | swap `display:none` for the `clip-path` visually-hidden pattern already used at `DrillScreen.svelte:1647-1653`. **One rule** |
| **7** | **`ShapePanel` has no dialog role, no focus move, no focus restore, no Escape** | `ShapePanel.svelte:12-19` | give it `role="dialog"`, focus the heading on mount, handle Escape, restore to the invoker — the pattern `DrillScreen.svelte:527-529` already implements for six other overlays |
| **8** | **Two sub-24 px touch targets, both on the board, one of them the accessibility fallback** | `Chessboard.svelte:386-398` (`.appearance-link` ≈21 px), `:456` (`.text-move` input/Submit ≈21 px) | raise padding to clear 24 px. WCAG 2.5.8 |
| **9** | **The capture indicator fails the theming RFC's own ΔE floor on both skins' dark squares** (12.5 and 18.6 against 20) | `interaction-paint.css:7`; criterion population at `rfc/theming.md:543-562` | add `square.oc.move-dest` to criterion 7's enumerated set and repair the value. §3.4 Finding B |
| **10** | **Keyboard hints live inside accessible names** — *"Fork B"*, *"Replay Space"*, *"Rewind to preview Enter"* | `DrillScreen.svelte:1025`, `Timeline.svelte:96`, `CompareView.svelte` | `aria-label` on the button. Found at `planning/ux-work-lane.md:267-276` as proposed D494, never ledgered |
| **11** | **The phone's three region tabs have no selected state in the accessibility tree.** `DrillScreen.svelte:947-952` renders `<button class:active={compactTab === …}>` for Support / Branches / Actions with no `aria-pressed`, `aria-current` or tablist roles — on the one viewport where exactly one region is visible | `DrillScreen.svelte:947-952` | add `aria-pressed`, exactly as `:1044` and `CompareView.svelte:70-72` already do. **Three attributes** |
| **12** | **[[D484]], still exactly true at HEAD, and now quantifiable**: `AssistanceSettings.svelte:119`'s `label{display:grid;gap:.25rem}` applies to eight `<label><input type="checkbox"/> Text</label>` rows at `:66-71` across eight profiles — the input becomes grid row 1 and the caption an anonymous item in row 2, so **48 checkboxes render above their captions** | `AssistanceSettings.svelte:66-71,119` | `label:has(> input[type=checkbox]) { display: flex; align-items: center; }`. **One rule.** Open since 2026-08-16 |

Two more that are defects but sit inside an accepted contract, so they are listed here with a
caveat rather than in §5:

- **Nine `aria-modal="true"` dialogs with zero focus traps and zero `inert`.** Keyboard users Tab
  into a page that assistive technology has been told does not exist. The repair (`inert` on the
  shell while a modal is open) is mechanical, but it interacts with `DrillScreen`'s region
  registration and with the phone sheet, so it should land as one change rather than nine.
- **The reduced-motion hard override** ([[D1460]]). The repair is specified
  (`ux-settings-and-identity.md:365-368`) but **`tests/browser/theme.spec.ts:52-53` asserts the
  current behaviour is correct**, so landing it means editing a green test — which is a review
  question, not a design one.

---

## 5. Design questions that need an owner decision

Law 5: `design/03-product-breadth.md` and `design/05-in-run-experience.md` are intent tier and
this dossier does not touch them. Each item below names the intent text it would change.

**Q1 — Does the phone product get one region at a time, and may the drawer cover the board?**
`design/05:49-61` names five regions and `design/03:312-314` permits *"Phone/PWA may transform
these regions into tabs/sheets, but the information model remains the same."* Shipping behaviour
is stronger than "tabs/sheets": at ≤719 px, **regions 2, 3 and 4 are mutually exclusive, none is
visible by default, and opening one occludes ~42% of region 1** (§3.7). `rfc/play-composition.md:435`
asserts *"The five design/05 regions remain reachable at every viewport"* — reachable, which is
true, and not *legible together*, which is what the loop needs when you rewind while looking at
the board. **Owner decision: is one-at-a-time-plus-occlusion the intended phone product, or is
the phone floor "board plus one region simultaneously"?** If the latter, the sheet must dim-and-
overlay only the board's lower edge (already the field pattern
`competitor-play-ux.md:310-317` recommends) or the content must go below the board in a scroll
(lichess's structural answer `[V]`).

**Q2 — What is the minimum supported viewport, and what happens below it?** `docs/app-shell.md:161-166`
pins 360×680; §3.7 shows the stated 24 px rationale supports roughly 208×400, and that the
enforced constant excludes iPhone SE, the iPhone 12–15 Pro class with Safari chrome `[P]`, every
phone in landscape, and 400% browser zoom (a Level AA Reflow failure). Three options, priced:
**(a)** lower the floor to what the rationale actually justifies and let the board shrink toward
24 px squares; **(b)** keep the board floor but let the run screen *scroll* below it instead of
refusing, which also fixes Reflow and would let Mobile Safari collapse its address bar; **(c)**
keep the refusal and state the supported-device list honestly in the copy. **This is an intent
question because the refusal is a product promise, not a bug** — someone decided that a too-small
board is worse than no board, and that may still be right.

**Q3 — Is portrait-only the phone posture?** The corpus contains **one** landscape sentence and it
is about an iPad (`rfc/play-composition.md:690` `[V]`). The manifest declares no `orientation`
`[V]`. A landscape phone is refused by the height gate and, but for that, would be classed as a
tablet. **Owner decision: declare `"orientation": "portrait"` and say so, or design the landscape
composition.** Doing neither is what ships.

**Q4 — Does the assistive layer get a query vocabulary?** Lichess exposes ~15 board commands
including ray scan and piece-type jump (§2.2 `[V]`). Every one of those that is rules arithmetic
is **rung 0 by `design/05:71`** and therefore free and always-permitted; the three that are engine
output are forbidden here by ADR-0006 and [[D659]]. `rfc/accessible-board-input.md` §4 correctly
scopes the grid to move state and explicitly excludes *"attacks"* (`:164-165` `[V]`) — but attack
maps are named as rung 0 in `design/05:71`. **These two documents may be in tension**, and the
resolution is an owner call about whether the *assistive* projection may voice rung-0 sight that
the visual board also offers. `[[D659]]`'s inheritance rule gives the safe answer: whatever
pointer sight is permitted, keyboard gets, and no more.

**Q5 — Is there an Accessibility settings family, and what is in it?** `design/03:294` already
names accessibility as a Settings destination `[V]` and **nothing implements it**; the only
accessibility-adjacent controls are the five Appearance selects. Lichess ships six persisted
non-visual presentation settings (§2.2 `[V]`). `ux-settings-and-identity.md:508` proposes
*"Accessibility (input mode, coordinates, contrast)"*. **Owner decision: does 1.0 ship an
Accessibility panel, and does it include a high-contrast board skin** — the one thing §3.4 shows
cannot be fixed inside the existing two skins, because both are ~1.6–2.0:1 by design.

**Q6 — Is a contrast/colour floor a *product* promise or a *palette* promise?** `rfc/theming.md`
gates Tabiya-authored palettes and deliberately publishes inherited-palette failures without
rewriting them ([[D976]] `[V]`) — a defensible posture. But §3.4 Finding C shows the ΔE criterion
that governs board paint is chroma-only and rates a **1.02:1** luminance highlight a pass, and
Finding E shows colour vision has never been considered anywhere in the corpus. **Owner decision:
does the board's semantic paint carry a *second* floor — a luminance/greyscale one — alongside
ΔE?** If yes, `interaction-paint.css` needs tokens (which [[D1461]] already asks for) and the
criterion needs a second metric. If no, that should be a stated posture, because a learner who
cannot see the last-move highlight has no way to know it exists.

---

## 6. Proposed ledger rows

Unnumbered per [[D1130]]; head was **D1478** at drafting; renumber at landing. Existing rows are
referenced, not duplicated — [[D1447]], [[D484]], [[D1460]], [[D1461]], [[D1453]], [[D1434]] all
already cover part of this ground.

| Proposed | Row |
|---|---|
| 🐞 | **THE DRILL'S TWELVE ADVERTISED SHORTCUTS ARE DEAD AT ALL TWELVE OF ITS OWN TAB STOPS.** `DrillScreen.svelte:497-510` classes every `<button>` and `<a>` in the composed path as an interactive target and `:693-701` declines the event, so `R`/`Shift+R`/`B`/`1-9`/`Alt+C`/`←`/`→`/`Space`/`E` are live only on the two `tabindex="-1"` containers. The browser suite's own verified tab order (`drill.spec.ts:1397`) is twelve stops and **all nine shortcuts are suppressed at every one**. There is no key that returns focus to the region, no announcement when they die, and `KeyboardHelp.svelte` does not mention the condition. The `←`/`→` timeline step is off precisely inside the timeline |
| 🐞 | **THE RUN REFUSES TO MOUNT ON iPHONE SE, ON ANY PHONE IN LANDSCAPE, AND AT 400% BROWSER ZOOM — AND THE REFUSAL'S OWN STATED REASON SUPPORTS A FLOOR 1.7× SMALLER.** `viewport-support.ts:18` says 24-px squares and a whole board cannot both fit below 360×680; 24-px squares need 208×400 by `play-composition.ts`'s own arithmetic, and at the enforced floor squares are **43 px**. 375×667 (iPhone SE) is refused; 844×390 (any phone in landscape) is refused *and* would be classed tablet; 320×256 (WCAG 1.4.10 Reflow, 1280 px at 400% zoom) is refused, making the run screen a Level AA Reflow failure by construction. **And on the reported iOS Safari `innerHeight` with the address bar visible (664–672), the entire iPhone 12–15 Pro class is refused — while the same device works installed as a PWA.** `ShellFrame.svelte:97` `overflow:hidden` means the bar can never collapse. Nobody has opened this app on a phone. **And on the phone that does run, the composition is one region at a time behind a `position:fixed` drawer that covers ~42% of the board, whose three tabs (`:947-952`) carry no `aria-pressed`, `aria-current` or tablist role — so the one viewport where a single region is visible is the one where a screen-reader user cannot tell which** |
| 🐞 | **THE THEMING CRITERION'S ΔE METRIC RATES A 1.02:1 HIGHLIGHT A PASS, AND ITS POPULATION OMITS THE CAPTURE INDICATOR.** Measured this pass: `last-move` on brown dark squares is ΔE\*ab **36.3** (floor 20, comfortable pass) and **1.02:1 WCAG contrast, greyscale distance 3/441** — a pure hue shift, invisible in monochrome, and it is the channel that says what the opponent just played. Separately, `square.oc.move-dest` (`interaction-paint.css:7`) — the only signal that a legal move is a **capture** — is **not in criterion 7's enumerated set** and measures **12.5 on olive dark and 18.6 on brown dark** against the same floor of 20. [[D1461]]'s pattern twice more: the instrument passes because the population and the metric both miss. Also: the ΔE 18.3 olive failure at `rfc/theming.md:557` **is repaired at HEAD** (`olive.css:2` carries `#96a25e`, reproducing the predicted 20.0) — the ledger reference to it is stale |
| 🐞 | **NINE `aria-modal="true"` DIALOGS, ZERO FOCUS TRAPS, ZERO `inert` — KEYBOARD AND SCREEN-READER USERS GET CONTRADICTORY MODELS OF WHAT EXISTS.** `inert` appears nowhere in `apps/web/src`; `aria-modal` hides the background from AT and does nothing for Tab. Found as prose at `planning/ux-work-lane.md:375-387` and never ledgered. The suite never presses Escape and has no focus-trap or focus-restore test against ten dialogs. `ShapePanel.svelte` is worse than the nine: no dialog role, no focus move, no restore, no Escape at all |
| 🐞 | **COLOUR VISION HAS NEVER BEEN CONSIDERED ANYWHERE IN THE CORPUS, AND THE CHECK INDICATOR VANISHES FOR TRITANOPES ON BROWN DARK SQUARES.** Zero hits for `colour-blind\|color-blind\|deuteran\|protan\|tritan\|achromat` across `design/`, `planning/`, `docs/`, `rfc/`. Simulated (Viénot 1999): check-red on a brown dark square is sRGB distance **5/441** under tritanopia against **235** normal. The product paints semantics onto squares as its primary feedback channel and has one shipped metric, ΔE, which is chroma-dominated and therefore blind to exactly the deficits that matter |
| 🐞 | **SEVEN SURFACES HAVE NO WIDTH MEDIA QUERY AT ALL, AND NO SPEC OWNS THEM.** `rfc/play-composition.md` covers the run screen and says so; nothing covers Settings, Create/studio, Live list, Live session detail, Library, the shape panel or the cohort panel. Ten `@media` blocks exist client-wide, all width-based; there is no `prefers-reduced-motion`, no `prefers-contrast`, no `forced-colors` and no `prefers-color-scheme` block anywhere. Every move-destination and check indicator is a `radial-gradient`, i.e. a background-image, which Windows High Contrast does not force |
| 🐞 | **THE SHELL SKIPS *TO* THE NAVIGATION, THE TITLE NEVER CHANGES, AND ROUTE CHANGES ARE SILENT.** `ShellFrame.svelte:58`'s skip link targets `#primary-navigation` — the block it should let you skip; there is no `<main>` in the shell. `<title>Tabiya</title>` is static across all twelve routes with no `document.title` write anywhere in the client (WCAG 2.4.2). `App.svelte:651-656` changes the whole page with no focus move and no announcement. Three cheap fixes; all three are AA criteria |
| 📊 | **A 1,779-LINE BROWSER SUITE WITH 467 ROLE/LABEL/TEXT SELECTORS ASSERTS ACCESSIBILITY SEMANTICS IN ~22 OF THEM (4.7%), AND HAS NO PROJECTS ARRAY.** One implicit Chromium project at 1440×1000; `devices[…]` never imported; `hasTouch` in exactly one test body, so 8 of 9 phone-width assertions run with desktop input semantics. 1 of 11 live regions asserted as an announcement. `Escape` never pressed. `forcedColors`/`colorScheme` emulation zero; `reducedMotion` one assertion, **which pins [[D1460]]'s defect as correct behaviour**. No axe/pa11y/Lighthouse anywhere. The 24-px target guard regexes two CSS rules in one file and cannot see the two controls that fail — both on the board, one of them the accessibility text-entry fallback |
| 📊 | **THE `352 px` BOARD IS A FIXED DESKTOP DEFECT BEING CARRIED FORWARD AS A LIVE MOBILE ONE.** `planning/ux-work-lane.md:209-221` measured it at 1440×900 from a `calc()` magic constant; that closed as [[D496]] and the same viewport now yields **768 px**. 352 px survives only as what a 375-px-wide phone gets from `playBoardEdge`. Three stale geometry sources are now in circulation — `ux-work-lane.md`'s 352 px, `mobile-scope.md:167-169`'s 374 px, and `rfc/play-composition.md`'s live table — and only the last is true |
| 💡 | **LICHESS'S ACCESSIBILITY IS A SHARED `ui/lib/src/nvui` PACKAGE WITH ITS OWN TESTS AND SIX PERSISTED PRESENTATION SETTINGS, AND OUR CORPUS RECORDS NOTHING ABOUT ANY COMPETITOR'S.** Pinned from lila source: `BoardStyle` plain-vs-table, `PageStyle` board-vs-actions reading order, five move notations, four piece styles, a 15-command board vocabulary incl. ray scan and piece-type jump, a separate `ui/keyboardMove` package with its own test file and ~80 locale bundles, and `ui/voice` grammars in nine languages. Every rules-arithmetic command in that list is rung 0 by `design/05:71` and admissible here; the three engine ones are not. **`competitor-play-ux.md` reads lichess's SCSS and Scala at primary source and contains zero accessibility content**, and `competitor-matrix.csv` has neither an accessibility nor a mobile column across all 63 rows |

---

## 7. Residuals, method limits, and every `[P]`

**The whole-pass limit, stated plainly:** **no assistive technology was used and no phone was
touched.** Everything above is code derivation and arithmetic. This is the third document in the
repo to say so — `release-platform-audit.md:206-209`, `mobile-scope.md:25-29` (*"no real device,
no real hand, no real thumb"*), and `rfc/accessible-board-input.md` Discharge D3, which is an
**unrun validation step** for an RFC that is otherwise landed. Per
`planning/platform-alignment/release-platform/f12-work-order.md:203`, owner validation covering
phone/tablet, keyboard-only and an available screen reader is the designated proof. **This
dossier cannot substitute for it and does not claim to.**

**Every load-bearing `[P]` in this document, named rather than buried:**

| `[P]` claim | Why it is `[P]` | What would make it `[V]` |
|---|---|---|
| iOS Safari `window.innerHeight` is 664–672 on a 390–393 px device with the address bar visible | widely reported, not measured here; the whole iPhone-12-class refusal finding rests on it | open the run screen on one iPhone |
| Pixel 7 / Chrome visible-chrome height 742 | same class | same |
| The phone sheet occludes ≈42% of the board at 390×844 | arithmetic over the CSS grid, not a rendered measurement; the *fact* of occlusion is `[V]` from `drill.spec.ts:1436,1438` | measure the two bounding boxes in a phone-project Playwright run |
| Touch-target heights in §3.6 other than the four with explicit `min-height` | computed from font-size × line-height + padding + borders | `getBoundingClientRect` in a browser test |
| iPhone SE's installed base | model knowledge — marked `[M]` inline | — |
| Every competitor claim except §2.2's lila source reads | [[D1458]]: no product in this corpus has ever been driven hands-on | drive one |
| chess.com's accessibility posture | **unknown** — the corpus says nothing and this pass did not fetch its client. Reported as unknown rather than inferred | fetch or drive it |

**What this pass deliberately did not do:**

- It did not audit the server, the worker or the CLI surfaces — accessibility is a client
  question here.
- It did not price any repair beyond naming its site and shape. Per [[D1230]] there is no
  recommended-scope-cut section and none of §4 or §5 is trimmed for landability; §4's ordering is
  cost-to-value, not a proposed slice.
- It did not check localisation, text scaling beyond browser zoom, or dyslexia-oriented
  typography. All three are corpus-wide zeroes and none was in scope.
- It measured `interaction-paint.css` and the two shipped board skins. It did not measure the
  twelve app palettes — `theme/theme.test.ts:147-171` already gates the Tabiya-authored ones and
  `AppearanceSettings.svelte:73-78` already discloses the inherited failures, which is the
  correct posture and needs no re-measurement.

**One correction to the brief, recorded so it does not propagate:** olive's ΔE 18.3 failure
(`rfc/theming.md:557`) **is repaired at HEAD** — `olive.css:2` carries `#96a25e`, the exact repair
`:561` proposes, and this pass reproduces its predicted **20.0** `[V]`. The live contrast defects
are the two in §3.4 Findings B and C, which are different, larger, and were not previously known.
