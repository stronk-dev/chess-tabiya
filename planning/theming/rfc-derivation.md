# Theming lane — HEAD derivation for the D839/D840 RFC

**Written 2026-08-22 against `fbf3fc8` (working tree carries other agents' dirty files:
`apps/server/src/*`, `design/BACKLOG.md`, `tools/d872-semantic-tactics-harness/*` — ledger
line numbers below are working-tree at derivation time).** This is a derivation dossier,
not an RFC and not a fix. Nothing outside `planning/theming/` was touched.

---

## 0. Licensing status for drafting — stated first, per the D951 feedback

**LICENSED TO DRAFT. No planning document gates a theming RFC.** Derived, not assumed:

1. **The exploration gate is open.** `rfc/0000-rfc-process.md:29-31` closes product RFC
   drafting "until the vertical slice has passed the continuation gates … **or an owner
   ruling** (logged in `planning/exploration/log.md`) **opens a specific RFC early**."
   `planning/exploration/gates.md:191` records exactly that: *"**Owner override 2026-08-12**
   (logged): RFC drafting opened with E1 met, E2 advisory, and E3/E4/E5 accepted as
   in-flight risk."* Twenty active RFCs in `rfc/` sit on that override today.
2. **No theming-specific gate exists.** Grep for `D839|D840|theming` across `planning/`:
   the campaign gate that produced D951 (`planning/campaign-research-queue.md:4-5`) names
   the **campaign** RFC only; `planning/platform-alignment/decision-queue.md` has **zero**
   theming rows; `planning/rfc-drafting-queue.md` never queues the lane. Nothing holds it.
3. **Three documents affirmatively hand the draft to claude.** `rfc/play-composition.md:674`
   (accepted, implementing) Discharge **D3** assigns *"The [[D839]]/[[D840]] lane — dark/board/piece
   theming over this composition's tokens and the animation pref with a None option"* to owner
   **`claude`**, discharged at *"that lane's landing commit"*.
   `planning/platform-alignment/never-started-lanes.md:231` names the next step: *"claude-draft
   the D839/D840 theming-lane RFC over play-composition's tokens + the animation pref; owner
   picks palettes/piece sets"*, and ranks the lane **#4 by owner-stated interest** (`:257`).
4. **The owner statement is direct and repeated.** D839 is an OWNER row 2026-08-22
   (*"theming is a product need, not polish"*), matching the verbatim commissioning quote.
5. **Law 1 / law 8 exposure: none.** Theming is UX/mechanism work — presentation tokens, CSS,
   a client preference, an animation config. It creates no chess-truth content, grades no
   move, and touches no evidence *semantics* (§6 pins the evidence-color boundary it must
   respect). The research base already exists (`design/research/competitor-play-ux.md` §5,
   measured `[V]` from lila source), so "no RFC from a GAP row" is satisfied.

**One sequencing note, not a gate:** `rfc/play-composition.md` is `implementing` (its
2026-08-22 shell checkpoint landed — stable board instance, token discipline A10). The
theming RFC drafts now; its *implementation* should land over the finished composition's
token layer to avoid churning the same style blocks twice. Drafting waits on nothing.

---

## 1. The owner's requirement rows

### D839 — the commission (verbatim, `design/BACKLOG.md:375`)

> | D839 💡 | **OWNER 2026-08-22 — theming is a product need, not polish: dark theme
> first-class (the owner dislikes light websites), board and piece-set choices, and the
> visual identity generally.** The app ships one hard-coded light palette
> (`color-scheme: light`, `App.svelte:923`) and one board/piece combo. Scope: a dark theme
> as a real first-class theme (not an inversion), board colour themes and at least one
> alternative piece set, themed under the same token system the composition mockups lifted.
> **Constraint from [[D659]]**: theme choices are presentation and must never alter what
> evidence is visible | 💡 owner idea 2026-08-22 |

(Line-number drift: the row cites `App.svelte:923`; at `fbf3fc8` the constant sits at
`apps/web/src/App.svelte:931`. Same constant, verbatim `color-scheme: light;`.)

### D840 — the animation defect (verbatim, `design/BACKLOG.md:376`)

> | D840 🐞 | **Moves do not animate when playing, and nothing in the tree configures
> animation at all — chessground animates by default, so something is defeating it.**
> Verified: zero `animation` keys anywhere in `Chessboard.svelte`/`DrillScreen.svelte`; the
> board updates via `board.set(config())` on `$effect`, which *should* animate FEN diffs.
> Owner-observed: no animation. Candidate causes to investigate at the symbol: a keyed
> re-render recreating the component per move; `redrawAfterLayout` interrupting the tween;
> the full-config `set()` resetting more than the position. **A rehearsal product whose
> pieces teleport reads as a diagram, not a game** — this is the felt-quality half of K9's
> lesson | 💡 open, found 2026-08-22 |

### D840's state at HEAD — the defeat is FIXED; the row is NOT closed; residue is real

Play-composition criterion **A9** (`rfc/play-composition.md:628-633`) owned the *defeat*:
the `{#key}` remount at the then-`DrillScreen.svelte:928`. At `fbf3fc8`:

- `grep -n '#key' apps/web/src/lib/DrillScreen.svelte` → **zero matches**. The board is one
  stable instance: `Chessground(boardElement, config())` at `Chessboard.svelte:260` mounted
  once, updated via `board?.set(config())` at `:278` inside a single `$effect`.
- `planning/play-composition/plan.md:19-20` (landed checkpoint item 6): *"The keyed board
  remount is gone; a reset token re-asserts capture state through the existing
  `board.set()` path."* Browser suite: "30 passed" (`plan.md:24-25`).
- `grep -n 'animation' Chessboard.svelte DrillScreen.svelte` → still **zero** matches:
  no `animation` key in `config()` (`Chessboard.svelte:115-143`), so chessground's default
  tween (enabled, ~200 ms `[M]` — package default, verify at draft time) now runs.

**So A9 is not the whole of D840.** The RFC itself pins the split
(`rfc/play-composition.md:355-357`): *"The animation **pref** (None/Fast/Normal per the
[[D875]] floor) and the felt-quality verification are the [[D840]]/[[D839]] lane's — this
RFC only refuses to make that lane impossible."* And criterion A9's closing sentence
(`:633`): *"The animation pref and felt verification remain the D840 lane's."* Residue the
theming RFC must ship:

1. **The animation preference** — None / Fast / Normal(default) / (Slow?), per the D875
   floor (*"None-able animation"*); today no pref exists and the duration is whatever the
   package defaults to.
2. **Felt-quality verification** — the owner-observed symptom has never been re-verified by
   a human since the fix; D840 stays open (🐞) in the ledger until it is.
3. **Play-composition Open Question 3** (`rfc/play-composition.md:697-700`): the post-commit
   on-board echo *"rides the D840 lane's felt-quality pass, since a static echo without
   animation reads as noise"* — the theming/animation RFC inherits that decision.
4. `redrawAfterLayout()` (`Chessboard.svelte:176`, called after every `set()` at `:282`) was
   a named candidate tween-interrupter in D840; nothing has verified it is innocent now that
   the remount is gone. Cheap check owed at implementation.

### Sibling rows (grep of the ledger for theme/board/piece/animation/dark)

- **D875 📊** (`design/BACKLOG.md:355`, measured 2026-08-22): *"Theming benchmark pinned
  from lila source: 25+19 board themes, 41+11 piece sets, 4 animation levels with None;
  proposed floor for us: device-default dark, ≥2 boards, ≥2 piece sets, None-able animation
  ([[D840]]'s fix lands as this pref)"*. Full benchmark: `design/research/competitor-play-ux.md`
  §5 (`:273-297`), lichess numbers `[V]` from `Theme.scala`/`PieceSet.scala`/`Pref.scala`.
  Note: the research README proposed this floor as row "D872", but the D872 label was
  claimed by the concurrent semantic-tactics pass — the floor lives in **D875** and §5.
- **D887 💡 owner-tier** (`:347`): evidence-dark campaign nodes *"may pay out cosmetic
  rewards (piece skins, board themes)"* — the theming catalog becomes the campaign's
  cosmetic-reward pool. Sibling **D893 💡** (owner rulings, `:342`) repeats it. The theming
  RFC defines the catalog; reward *gating* is the campaign lane's
  (`planning/campaign/rfc-derivation.md:497` already records the split: *"D839 theming lane
  is separate"*).
- **D493 ✅** (`:594`) — the trap precedent, quoted in §6.
- **D659 🐞** (`:246`) — the presentation-never-alters-evidence class D839 carries.

---

## 2. The CSS/token surface at HEAD

**There are no `.css` files in `apps/web`** (`find apps/web/src apps/web/public -name '*.css'`
→ empty). All styling lives in Svelte `<style>` blocks: **20 components, one block each**
(App.svelte + 19 in `apps/web/src/lib/`). The big ones by CSS line count (lines between
`<style>` and `</style>`): `DrillScreen.svelte` **437**, `ShellFrame.svelte` 110,
`BranchRail.svelte` 110, `Timeline.svelte` 109, `PackList.svelte` 99,
`CheckpointSheet.svelte` 98, `App.svelte` 83, `Chessboard.svelte` 74.

**The token layer** is a single `:global(:root)` block, `apps/web/src/App.svelte:930-943`,
quoted:

```css
:global(:root) {
  color-scheme: light;
  --ink: #171713;
  --paper: #eeeade;
  --paper-soft: #e5e0d2;
  --panel: #f8f5ec;
  --muted: #6f6b61;
  --line: #cbc4b4;
  --accent: #3858c8;
  --warning: #df9d32;
  --danger: #ad3c32;
  --display-font: Iowan Old Style, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif;
  --shadow: 0 0.8rem 2.5rem rgb(40 35 25 / 10%);
  ...
}
```

Nine color tokens + one shadow. Dimensional tokens live where play-composition put them
(`DrillScreen.svelte:1242-1243` `--rail-w: 336px; --stage-pad: 16px;`, plus `--board-edge`
set inline at `:811`, `--band-h`/`--rim-h`/`--strip-h`/`--topbar-h`/`--objective-h` etc.).

**Dark-mode handling today: NONE.** `grep -rn 'prefers-color-scheme|data-theme|color-scheme'
apps/web/src` → exactly one hit, `App.svelte:931 color-scheme: light;`. Additionally
`apps/web/index.html:6` hard-codes `<meta name="theme-color" content="#eeeade" />` and
`apps/web/public/manifest.webmanifest` hard-codes `"theme_color": "#eeeade"` and
`"background_color": "#eeeade"` — three more light-paper constants outside any token layer.

**Hard-coded colors** (method: `grep -oE` for hex and `rgb()/hsl()` literals over
`apps/web/src/**/*.svelte`, case-folded, deduped — counts literals in source text, so a
token *definition* counts once and `var()` uses count zero): **14 hex occurrences, 11
distinct** (9 of the 14 are the App.svelte token definitions themselves; the strays:
`GameStoryScreen.svelte` 4, `DrillScreen.svelte` 1 — `#20180d`), plus **13 rgb()/rgba()
occurrences, 10 distinct** (e.g. `rgb(20 18 14 / 55%)`, `rgb(255 255 255 / 16%)` in
Chessboard/DrillScreen scrims). Against **306 `var(--…)` usages**, token discipline has
mostly held — the A10 criterion (`rfc/play-composition.md:634-636`) polices new components.

**Defect found by this pass — two phantom tokens:** `var(--surface)`
(`CheckpointSheet.svelte:228`, textarea background) and `var(--panel-soft)`
(`CompareView.svelte:168`, `.line-ended` background) are **used but defined nowhere**
(`grep -rn '\-\-surface:|\-\-panel-soft:' apps/web/src` → zero definitions), so both
resolve to nothing. A theming RFC that enumerates the token vocabulary closes this class;
its acceptance should include an "every `var()` reference has a definition" sweep.

**What play-composition §7 shipped as "token hooks" — exact obligations**
(`rfc/play-composition.md:547-558`, accepted):

> The composition consumes the existing token layer (`App.svelte:923-930` — `--paper`,
> `--panel`, `--line`, `--accent`, …) and adds only composition tokens (§3.1's dimensional
> tokens plus any new surface colors **as tokens**). Normative: **no new hard-coded color
> literal outside the token layer** in composition styles (criterion A10); board colors,
> square paint and piece rendering are consumed through whatever the D839 lane later
> re-roots — this RFC neither ships a dark theme nor blocks one. The canvas dark artboard
> (`FullDark.dc.html`) is evidence the token set suffices, not a shipped theme. Constraint
> carried from [[D659]]/[[D839]]: theme choices are presentation and never alter which
> evidence is visible.

And its Discharge **D3** (`rfc/play-composition.md:674`), naming this lane:

> | D3 | The [[D839]]/[[D840]] lane — dark/board/piece theming over this composition's
> tokens and the animation pref with a None option; this RFC's A9 removes the animation
> *defeat* but ships no pref and no theme | `claude` | that lane's landing commit | |

---

## 3. The board surface

**Package:** `@lichess-org/chessground@10.1.1` (`apps/web/package.json:14`), license field
`"GPL-3.0-or-later"`; README §License: *"Chessground is distributed under the **GPL-3.0
license** (or any later version, at your option)."* GPL-3.0+ combines lawfully with this
repo's AGPL-3.0 (AGPL-3.0 §13 permits the combination `[M]` — standard FSF compatibility,
restate in the RFC).

**How the board is themed at HEAD** — three CSS imports, `Chessboard.svelte:2-4`:

```
import "@lichess-org/chessground/assets/chessground.base.css";    (3,537 bytes — geometry, no colors)
import "@lichess-org/chessground/assets/chessground.brown.css";   (2,908 bytes — ALL board colors)
import "@lichess-org/chessground/assets/chessground.cburnett.css"; (11,548 bytes — all 12 pieces)
```

That is the **entire** shipped catalog: the package ships exactly these three assets — one
board theme (brown), one piece set (cburnett), nothing else. Contents `[V]`:

- `chessground.brown.css`: `cg-board { background-color: #f0d9b5; background-image:
  url('data:image/svg+xml;base64,…') }` — dark squares are an **embedded SVG data URI**,
  not a second color token. It also carries the *interaction* paint: last-move
  `rgba(155, 199, 0, 0.41)`, selected `rgba(20, 30, 85, 0.5)`, move-dest dots
  `rgba(20, 85, 30, 0.5)`, check radial `rgba(255, 0, 0, 1)`/`rgba(231, 0, 0, 1)`, arrow
  brush greens/blues `#208530`/`#203085`. **Square color and evidence/interaction paint are
  fused in one file** — the central mechanical fact for theming (see §6 trap 3).
- `chessground.cburnett.css`: 12 selectors (`.cg-wrap piece.pawn.white { background-image:
  url('data:image/svg+xml;base64,…') }` …), pieces are embedded SVG data URIs.

**Swapping mechanics:** a board theme = one CSS file redefining `cg-board`'s
background-color + dark-square SVG (or a flat two-color scheme); a piece set = one CSS file
remapping the same 12 selectors to different data URIs. No JS change; chessground reads
none of it. The natural implementation is N small CSS modules (or data-attribute-scoped
blocks) toggled by a `data-board-theme`/`data-piece-set` attribute, mirroring how lichess
does it. Vite inlines/bundles the imports; dynamic theme switching needs either all
variants loaded and attribute-scoped, or dynamic `import()`.

**Asset licensing for additional sets — the real constraint:** cburnett is by Colin M.L.
Burnett, CC BY-SA 3.0 `[M — verify]`. Lichess's lila repo carries the 40+ piece-set catalog
with **per-set licenses that vary** — several sets are free-for-lichess or
personal-use-only, NOT redistributable `[M — verify against lila's per-asset license
listing before adopting any set]`. Board-square colors are unprotectable color pairs; piece
SVGs are copyrighted works. The RFC must name each shipped set with its license and require
CC0/CC-BY/GPL-compatible terms only (AGPL app). Candidate safe pool `[M]`: cburnett
(CC BY-SA), the lichess sets marked GPLv2+/CC0 in lila, or commissioned originals.

**Coordinates:** rendered by chessground from `base.css` (`coords` config); colors inherit —
a dark board theme must check coord legibility on both square colors.

---

## 4. Settings + persistence precedent — and the not-assistance boundary

**The shipped preference grammars** (`apps/web/src/lib/assistance-preference.ts:17-18`):

```ts
export function assistanceKey(kind: AssistanceProfile): string { return `tabiya.assistance.v1.${kind}`; }
export function workflowKey(kind: AssistanceProfile): string { return `tabiya.workflow.v1.${kind}`; }
```

Both are **per-workflow-context** (7 contexts: pack/position/imported/match/stream/academy/
onramp), versioned inside the value (`{ version: 4, … }` with three migration branches
`:44-53`; `{ version: 1, preset }` for workflow). `rfc/intent-presets.md:280-284` pins the
convention: *"localStorage with the version inside the value."*

**A theme is a client preference but NOT an assistance field and NOT per-context.** Pin the
boundary three ways:

1. **Do not extend `AssistanceConfig`.** The v4 grammar (`assistance-preference.ts:40-42`)
   is nine evidence-bearing fields with a validator, migrations, permission clamps, and the
   intent-presets compiler over it (`rfc/intent-presets.md` §5, `compileAssistance`,
   `:213-262`). A theme field there would route presentation through the assistance ceiling
   machinery — exactly the category error D493 documents in reverse.
2. **Do not put it in `tabiya.workflow.v1.*`** — presets are per-context intent; the owner's
   theme follows the person, not the workflow. New namespace, e.g.
   **`tabiya.theme.v1`** (global, `{ version: 1, theme, boardTheme, pieceSet, animation }`),
   same versioned-value convention, same `PreferenceStorage` seam (`:16`) so it unit-tests
   without a browser.
3. **The compiler seam stays untouchable in the other direction too:**
   `rfc/intent-presets.md:164-171` makes *"a 'quiet-looking' constant flipping the board
   dark structurally impossible: no compiled output can carry `boardLighting: "off"`"* —
   the theming RFC's mirror obligation is that no theme value feeds `compileAssistance`'s
   inputs and no compiled output selects a theme.

**Settings surface:** design intent row `design/03-product-breadth.md:294` — *"| Settings |
opponent/rating, feedback/evidence, engines/models, LLM, data, accessibility |"* (no
theming word yet — an intent-tier amendment via BACKLOG/RFC route, law 5). In code,
`/settings` renders in `App.svelte:909-911` ("This deployment") and B1's corrected row
(`design/03:315`) records **54 live controls** with a quality residual. The theme picker's
natural homes: a Settings section plus (per the D875 field study) a lightweight in-play
entry like lichess's board menu — the RFC decides (fork §6-F5).

**System integration:** device-default dark (D875 floor: *"default = Device"* is the
lichess/field norm) means `prefers-color-scheme` as the unset-state input, an explicit
choice overriding it — plus updating the hard-coded `theme-color` meta and manifest colors
(§2) per theme.

---

## 5. The design-canvas evidence

The play-composition canvas is **session-scratchpad material, not committed**: no `*.dc.html`
exists in the repo (`find . -name '*.dc.html'` excluding node_modules → empty). The live
copies sit in the current session scratchpad `play-canvas/` (Main/Tablet/Phone/FullDark
`.dc.html` + `canvas.json` + `tabiya-play-composition.html`, dated 2026-08-22). The
**committed record** is textual, in the accepted RFC:

- `rfc/play-composition.md:147` — desktop row cites `play-canvas/Main.dc.html`,
  `FullDark.dc.html` as exhibits; `:154` — *"verified in `FullDark.dc.html` against
  `Main.dc.html` at drafting"*; `:554-555` — *"The canvas dark artboard (`FullDark.dc.html`)
  is evidence the token set suffices, not a shipped theme"*; `:777` — changelog notes the
  four artboards + canvas.json with the D876 fix applied.
- `canvas.json` titles FullDark: **"Desktop dark — MAX LOAD, all modules seated"** (1440×900,
  placed below Main).

**FullDark's palette choices** (hex census of the artboard, top values): surfaces
`#16140f` / `#1e1b15` / `#2a2720` / `#35322a` (warm near-blacks — the light theme's warm
paper family inverted in temperature, not hue-flipped), ink `#e8e4d8` (16× `#97917f` muted),
accent **`#8fa4e8`** (the light `--accent` `#3858c8` lightened for dark contrast), warning
`#df9d32` **unchanged**, board squares `#f0d9a8` light / olive-green darks
(`#8a9656`/`#7d8a4c`/`#6e7a45`). Two design facts an RFC should carry from this: (a) the
artboard demonstrates D839's *"not an inversion"* — it re-picks accent and squares rather
than inverting; (b) it is uncommitted evidence — the RFC should either commit the artboards
or restate the palette in its own text, or the record evaporates with the scratchpad.

**Design-tier visual-identity statements: essentially none.** `grep 'visual identity|palette'
design/*.md` hits only the D839 ledger row. The only design-tier sentence near "dark" is
the D493-implicated parenthetical (`planning/ux-work-lane.md:55-62` quoting `design/05`
§3-forms) — which is about assistance forms, not visual theme, and was ruled a
misreading. **The visual identity has no intent-tier home**; D839 ("the visual identity
generally") is the mandate to give it one — via the RFC + a design/03 Settings-row
amendment on the owner's ruling, not by an implementer writing design docs (law 5).

---

## 6. Gaps — everything the theming RFC must decide

### Decisions the RFC owns

1. **Token architecture.** Promote the nine-color `:root` block to a two-layer system:
   semantic tokens (the shipped `--paper/--ink/…` vocabulary) over per-theme palettes,
   selected by `data-theme` on `:root` + `prefers-color-scheme` for the device-default
   state. Must define the missing `--surface`/`--panel-soft` (phantom tokens, §2) and
   decide whether `--shadow` and the scrim rgb() literals join the vocabulary.
2. **Theme enumeration vs free config.** Named themes (light-paper, dark) vs user-tunable
   channels. D875's evidence: lichess's hue/brightness sliders are *"a decade of accretion —
   ceiling, not floor"*. Floor answer: enumerated themes; sliders out of 1.0.
3. **Board/piece catalog + licensing.** ≥2 board themes, ≥2 piece sets (D875 floor), each
   with a named license compatible with AGPL redistribution (§3 — per-set licenses vary in
   lila's catalog; verification is an acceptance criterion, not a footnote).
4. **The animation preference** — enumeration (None/Fast/Normal[/Slow]), default Normal,
   storage in `tabiya.theme.v1`, wiring into chessground `animation: { enabled, duration }`
   in `Chessboard.svelte`'s `config()`; the D840 felt-quality verification and the
   `redrawAfterLayout` innocence check; play-composition OQ3 (post-commit echo) resolved
   here.
5. **Persistence + surface.** `tabiya.theme.v1` grammar (versioned value, global not
   per-context); Settings section + in-play access point; the `theme-color` meta and
   manifest colors made theme-aware.
6. **A11y floors.** WCAG 2.1 AA contrast — 4.5:1 body text, 3:1 large text/UI components
   `[M — standard figures]` — asserted per theme over the token pairs actually used
   (ink/paper, muted/paper, accent/panel …), plus coordinate legibility on both square
   colors of every board theme, plus `prefers-reduced-motion` ⇒ animation None (a11y
   overrides the Normal default).
7. **Scope boundary with the campaign.** The catalog is this RFC's; cosmetic-reward
   *earning/gating* (D887/D893: piece skins, board themes as evidence-dark node payouts) is
   the campaign RFC's, consuming this catalog by id.

### Owner-level forks (surface these, don't decide them)

- **F1 — Dark-only vs both, and the default.** The owner dislikes light sites; D875's field
  norm is device-default. Options: (a) device-default with both first-class (D875 floor),
  (b) dark default, light kept, (c) dark-only. The FullDark artboard proves (a)/(b) are
  drawable; D839 says "first-class", not "only".
- **F2 — Which piece sets and board themes ship** — "owner picks palettes/piece sets"
  (`never-started-lanes.md:231`). Needs the licensed candidate list in the RFC first.
- **F3 — Does the light-paper identity stay the brand?** The current warm-paper palette is
  distinctive; whether dark inherits its warmth (as FullDark chose) or the identity is
  re-picked is "the visual identity generally" — owner taste, canvas-able.
- **F4 — Animation default and whether Slow exists** (lichess ships 4 levels; floor is 3).
- **F5 — Where the picker lives** (Settings only, vs in-play board menu, vs both).

### Traps, named

1. **Per-component style blocks bypassing tokens.** 20 components × 1 block; A10 only
   polices *composition* styles. The stray literals (`GameStoryScreen` ×4,
   `DrillScreen` `#20180d`, scrim rgb()s) will silently ignore a theme switch. The RFC
   needs a repo-wide sweep criterion, not a new-code-only one — and the phantom-token
   check (§2) in the same sweep.
2. **The D493 lesson — a theme must never silently change assistance-bearing paint.**
   D493 ✅ (`design/BACKLOG.md:594`): *"the dark board is a SAME-DAY REGRESSION … a
   'quiet-looking' constant flipping the board dark"* — one constant changed presentation
   *and* assistance in the same gesture. Its codified successor:
   `rfc/intent-presets.md:170-171` makes the assistance side structurally safe; the theming
   RFC must add the presentation side: **theme values are unreachable from
   `compileAssistance` and vice versa** (§4 item 3).
3. **The EVIDENCE colors — pinned, law-8-adjacent. Theming may restyle these but must
   never change *whether/where* they render, and must keep them distinguishable:**
   - **Board-lighting squares**: `brush: "blue"` overlays,
     `DrillScreen.svelte:374` (`effectiveLighting === "sight" | "evidence"`) — disclosed
     evidence/sight. Gated by assistance, not by theme.
   - **Legal-move dests + last-move + check**: `showDests`/`highlightMoves`
     (`DrillScreen.svelte:865-866`, gate `effectiveLighting !== "off"`), painted by
     `chessground.brown.css`'s `rgba(20,85,30,…)` dots, `rgba(155,199,0,0.41)` last-move,
     red check radial. D493 ruled dests the **rules floor** and last-move **run history** —
     a board theme recolors them per-theme but a theme may not drop or add them.
   - **Mark brushes**: `MARK_BRUSHES = ["green","red","blue","yellow"]`
     (`packages/runtime/src/types.ts:52`) — persisted user/system marks (`RunMark.brush`),
     round-tripped through storage and live sessions (`live-marks.ts:10`). The four
     brushes are *identities* in stored data; a theme maps each to a color but the
     four-way distinction (and their difference from the lighting blue) must survive
     every theme — this is the per-theme contrast floor of §6 item 6 applied to evidence.
   - **Semantic UI tokens**: `--warning`/`--danger`/`--accent` where they carry state
     (guards, honest-empty, terminal banners). Restyle per theme; never collapse warning
     and danger into one hue.
   Because board-square paint and this evidence paint currently live **fused in one file**
   (`chessground.brown.css`, §3), a naive board-theme swap silently swaps evidence paint
   too — the RFC must split "square/piece skin" from "interaction/evidence paint" so board
   themes change only the former. This is the mechanical restatement of D839's closing
   constraint and D659's class (*"the ceiling must be inherited, not re-decided per
   projection"* — a theme is a projection).
4. **The keyed-remount class returning.** A9's browser test (stable board DOM identity)
   is permanent CI; any theming implementation that remounts the board to switch piece
   CSS re-creates D840. Theme switching must go through CSS/attribute changes, never
   component identity.
5. **Three hard-coded light constants outside Svelte** (`index.html` theme-color, manifest
   theme/background) — a dark theme that misses them ships a light browser chrome flash.
6. **Closeout discipline.** The lane flips D839/D840 (and D875's proposal row if adopted)
   in `design/BACKLOG.md` and appends to `planning/exploration/log.md` in the landing
   commit, per the RFC completion protocol; Discharge D3 in `rfc/play-composition.md` is
   recorded discharged in the same commit (play-composition may be `awaiting` on D1/D4 by
   then — D3's cell is this lane's to fill).

### Recommended RFC scope cut (claude proposal, for the draft)

**In:** token architecture + dark theme (device-default), 2-3 board themes + 2 piece sets
(licensed), animation pref with None + reduced-motion, `tabiya.theme.v1`, Settings/in-play
picker, evidence-paint split + per-theme contrast criteria, meta/manifest wiring, D840
felt-quality closure. **Out:** hue/brightness sliders, 3D, backgrounds/custom images,
per-context themes, cosmetic-reward gating (campaign), zen mode (Phase 5's quietest preset
per `competitor-play-ux.md` §5). **Forks F1-F5 to the owner in the draft's open questions.**
