# UX — settings, appearance, theming, account, and the visual identity

- Date: 2026-08-24
- Owner ask, verbatim: *"we need to go from a user perspective per feature… what do they expect,
  what do competitors do, PROPER UX."* And: *"which app doesn't even have a effing preview for the
  themes? why are then 10 million options in settings as opposed to proper flows for presets when
  starting a game or w/e…"*
- Feeds: `rfc/theming.md` (accepted, D1/D5 open), `rfc/intent-presets.md` §7.1 (amended
  2026-08-24 — the preset surface is now buildable), `design/03-product-breadth.md` shell table
  (Settings row) and B1/B8, `design/05-in-run-experience.md` §3-forms O4 + §3a, ledger
  [[D484]] [[D839]] [[D875]] [[D976]] [[D982]] [[D1425]] [[D1426]] [[D1433]].
- Method: hands-on code measurement of the shipped tree at HEAD (every count below was run this
  pass, commands given inline); primary-source fetches of lila's `Theme.scala`, `PieceSet.scala`,
  `ui/dasher/src/board.ts`, `ui/dasher/src/piece.ts`, `ui/dasher/css/_board.scss`; direct reads of
  the owner's own reference implementations in `~/frameworks/`. **No competitor product was
  driven hands-on this pass** — see Residuals. Labels per `design/research/README.md`.
- Boundary: `competitor-play-ux.md` owns the *play screen's* anatomy and pattern language; this
  dossier owns everything a person **configures**, plus what the product **looks like**. Where
  the two meet (the in-play appearance entry, the preset pill) this dossier defers to that one on
  seating and takes the decision on content.

---

## 0. The finding, in one sentence

**The named layer exists twice in this codebase and ships zero times.**

Assistance has five presets with authored labels and promise sentences
(`packages/runtime/src/presets.ts:31-37`); **no `.svelte` file imports them** `[V]`, and the
settings page ships the raw nine-field enum matrix instead — eight times over. Appearance has a
ten-scheme catalog in the owner's own registry that the RFC read, counted and adopted the shape of
(`rfc/theming.md:209-212`); **three schemes ship** ([[D1425]]), presented as a native `<select>` of
text labels, with **no preview of anything** `[V]`.

Both are the same defect: **the axis was implemented and the layer above it was not.** The owner's
two complaints — no theme preview, and ten million options instead of presets at the start of a
game — are one complaint about one missing layer, in two lanes.

That framing decides the whole dossier, so it is stated once here and used as the through-line.

---

## 1. The shipped baseline, measured this pass

Every number `[V]`, from the working tree at HEAD.

| Fact | Value | Where |
|---|---|---|
| App themes | **3** — `paper`, `tokyo-night`, `warm-dark` | `apps/web/src/lib/theme/axes.ts:1` |
| …of which support **both** modes | **1** (`tokyo-night`) | `catalog.ts:75-97` |
| Board skins | **2** — `brown`, `olive` | `axes.ts:4` |
| Piece sets | **2** — `cburnett`, `mono` | `axes.ts:7` |
| Animation levels | 3 — none / fast / normal | `axes.ts:13` |
| Legal appearance combinations | 12, all selectable | asserted `theme.test.ts:137` |
| Occurrences of `preview` in `AppearanceSettings.svelte` | **0** | `grep -c preview` |
| Appearance controls | **5 native `<select>`**, zero previews, zero swatches | `AppearanceSettings.svelte:38-69` |
| Assistance controls | **8 contexts × 9 = 72**, one flat 3-column grid | `AssistanceSettings.svelte:59-75` |
| Presets defined in TS | **5**, with `label` + `promise` | `presets.ts:31-37` |
| Presets rendered in any `.svelte` | **0** | `grep -rl "PRESET_DECLARATIONS\|presetDeclaration\|loadWorkflowPreset" apps/web/src --include=*.svelte` → empty |
| Assistance config chosen at start of a session | **none** — side, opponent, optional FEN only | `JustPlayStarter.svelte:16-18`; `PackList` passes only `packId` |
| Onboarding / first-run flow | **none anywhere** | grep `onboarding\|first-run\|welcome\|tour\|hasSeen` → 0 |
| `/settings` `<h1>` | **"This deployment"** | `App.svelte:1099` |
| Form controls styled in `AssistanceSettings.svelte` | **0** — no `select`/`input`/`checkbox` rule at all | `:119` |
| Named/system colour declarations outside the token layer | **15 across 8 files** | command in §8.3 |
| `var()` references in `interaction-paint.css` | **0** — 15 hard-coded literals | `theme/interaction-paint.css` |
| CSS `transition:` / `animation:` declarations in the whole app | **0** | grep across `*.svelte`/`*.css` |
| `<HonestControl>` instances in run screens | **7**, across 4 components | `DrillScreen` ×3, `CompareView` ×2, `CheckpointSheet` ×1, `Timeline` ×1 |
| `HonestControl.svelte` uses in either settings component | **0** | same grep |

Two things this baseline gets **right** and which the rest of the dossier builds on rather than
replaces: appearance **applies live and says so** (`AppearanceSettings.svelte:36`), and inherited
palettes **publish their measured sub-AA pairs** rather than hiding or silently repairing them
(`:73-78`, per `rfc/theming.md:283-287`). Both are better than anything in the competitor set.

---

## 2. Appearance — the picker

### 2.1 What a user expects

A person opening Appearance in 2026 expects to **see the thing before choosing it**. Not the name
of the thing. This expectation is now so universal that it is invisible until violated: OS
settings show wallpapers, editors show syntax-highlighted code samples, every terminal emulator
shows a colour grid. The word "theme" has *meant* "a picture you click" for about fifteen years.

Concretely, they expect:

1. **A visual option, not a text option.** Reading "Warm olive" tells a person nothing; the whole
   content of the choice is a colour.
2. **To see it composed.** A board skin is not a colour — it is a colour *with pieces on it and a
   highlight painted over it*. Choosing it from a swatch and discovering that the last-move
   highlight is invisible on it is the failure the preview exists to prevent (and see §2.3: our
   `olive` board **fails its own contrast floor at ΔE 18.3**, `rfc/theming.md:560`).
3. **That the control tells the truth about what is on screen.** If the app is not using what the
   dropdown says, the dropdown is broken. Ours is (§4).
4. **To reach it from where they noticed the problem.** Nobody decides their board is too dark
   while sitting on a settings page; they decide it mid-game.
5. **Not to be asked things the device already answered.** Light or dark is the OS's business
   unless overridden.

### 2.2 What competitors do

**Lichess — the picker, from primary source, fetched this pass `[V]`:**

- Board themes: **25** 2D + **19** 3D `[V]`
  (https://raw.githubusercontent.com/lichess-org/lila/master/modules/pref/src/main/Theme.scala).
- Piece sets: **42** 2D + **11** 3D `[V]`
  (…/`PieceSet.scala`). (`competitor-play-ux.md` §5 recorded "41–42"; the count at master today is
  42.)
- **Board options are 64×32 px thumbnails of the actual board texture**, one per theme, and the
  thumbnail carries the *live* hue filter from the user's own hue slider `[V]`
  (…/`ui/dasher/css/_board.scss`: `.list span { display:block; width:64px; height:32px; filter:
  hue-rotate(calc(var(---board-hue) * 3.6deg)); }`, with per-theme background images applied by an
  `@each` loop over `$board-themes-2d`).
- **Piece options render the actual white knight of that set** as the button's background image
  `[V]` (…/`ui/dasher/src/piece.ts` renders `h('piece', …)` with an inline
  `background-image:url(site.asset.url(pieceImage(t)))`, where `pieceImage` resolves
  `piece/<set>/wN.webp` for 2D sets and a Staunton `White-Knight` preview for 3D).
- **No hover preview; click applies immediately** and persists server-side `[V]` (…/`board.ts`
  `setBoard()` writes `document.body.dataset`, emits pubsub, POSTs the pref).
- The picker lives in the **dasher**, a menu on the board itself — not a settings page `[V]`
  (`ui/dasher/`), one click from any game.
- 5 backgrounds including **Device theme as the default**; 4 animation levels; zen bound to `z`
  `[P]` (`competitor-play-ux.md` §5, pinned from `Pref.scala` on 2026-08-22, not re-fetched here).

The design principle worth extracting is precise and it is not "have lots of themes":
**each axis previews itself in its own medium.** Board → a tile of the real texture. Pieces → a
real piece. Not a generic swatch for both.

**chess.com:** board colour, piece style and background live on a "Boards & Pieces" settings page,
reachable in-game from the gear beside the opponent's clock; mobile groups them as **"Theme" — "a
list of available themes, which are pre-designed sets of boards, pieces, and backgrounds"** `[P]`
(https://support.chess.com/en/articles/8594320, fetched this pass; the article does not state
whether the list is thumbnailed, so no claim is made either way). Named **Board Presets** save a
look per use-case `[P]` (`competitor-play-ux.md` §5). Piece-movement animation and pre/post-game
animation are separate toggles `[P]` (same article). Ten move classifications can be drawn **as
badges on the board** behind a setting `[V]` (`competitor-play-ux.md` §1.2).

The extractable idea here is the **bundle**: chess.com's mobile "Theme" is a curated
`(board, pieces, background)` triple with a name. That is the answer to combinatorics (§3.3).

**Chessable:** dark mode is **opt-in behind the profile menu**; board/piece pickers exist
in-lesson, counts unpublished `[P]`. **Aimchess:** dark and light plus board/piece appearance
settings `[V]` App Store description. **Chessiverse:** adjustable animation `[V]` faq. (All three
`[P]`/`[V]` as recorded in `competitor-play-ux.md` §5 and §1.3–1.4; not re-verified here.)

**The owner's own applications — the strongest benchmark, because the RFC already cites them
`[V]`, read this pass:**

- `~/frameworks/monorepo/website_application/src/lib/themes/palettes.ts:53-63` — `THEME_IDS`, ten
  schemes: tokyo-night, dracula, nord, catppuccin, gruvbox, one-dark, github-dark, rose-pine,
  solarized, ayu-mirage `[V]`.
- `~/frameworks/mistserver/lsp/modules/core/themes.js` — the same ten with per-mode palettes;
  **four carry both modes** (tokyo-night, catppuccin, gruvbox, solarized), six are dark-only `[V]`.
- `~/frameworks/monorepo/website_application/src/lib/components/ThemePicker.svelte` — **a
  responsive card grid (2 / 3 / 5 columns), each card a five-band colour swatch built from the
  scheme's own `bg`, `bgHighlight`, `blue`, `green`, `purple`, plus the theme's name, plus
  per-mode dots, plus a check mark on the active card** `[V]`.
- `…/ThemeModeToggle.svelte:5` — the light/dark toggle is wrapped in `{#if
  themeStore.hasMultipleModes}`: **when the chosen scheme has one mode, the control is not
  rendered at all** `[V]`.

So the reference implementation this RFC took its registry shape and its 40-line storage helper
from **already has the preview the owner is asking for**, in the same directory, 70 lines long.
[[D1425]] recorded that the 414-line `palettes.ts` was walked past; this dossier records that
`ThemePicker.svelte` was walked past in the same directory listing.

### 2.3 What we should do, and why it differs

**Three axes, three previews, three media** — matching the axes' own semantics (`rfc/theming.md`
§1, on [[D982]]), because a single generic swatch would re-blur exactly what that ruling separated.

**(a) App theme → a chrome card, not a colour bar.** The owner's five-band swatch is right for a
site whose theme *is* the palette. Ours has a specific screen to show, and the tokens that fail in
practice are the *pairs*: `--on-accent` on `--accent`, `--muted` on `--panel`. So the card renders
a miniature of the real thing: a `--paper` ground, a `--panel` card on it with a `--line` border, a
heading in `--ink`, a caption in `--muted`, a filled `--accent` button with its `--on-accent`
label, and a `--warning` chip. Six of the twelve tokens, arranged as they actually appear. That
card is the *only* place a person can see, before committing, that a theme's accent text is
readable — which is exactly the class of bug that shipped four times over (§8.3).

For `origin: "inherited"` entries the measured sub-AA notice moves **onto the card** as a badge.
`rfc/theming.md:286` asks for exactly this — *"the picker surfaces any pair below AA **on the entry
itself**"* — and what shipped is a page-level `<details>` below the whole grid
(`AppearanceSettings.svelte:73-78`) `[V]`. The mechanism is right and the seating is wrong.

**(b) Board → a real position with real paint on it.** Not the starting position: the start
position has no highlight, no check, no dest dots, and therefore hides everything the skin has to
survive. The preview board carries a fixed mid-game FEN plus, simultaneously:

- a **last-move** highlight (`rgb(155 199 0 / 41%)`),
- a **legal-dest** dot (`rgb(20 85 30 / 50%)`),
- a **check** radial,
- one of **each of the four `MARK_BRUSHES`** (`catalog.ts:105-110`).

Why these four and no others: they are precisely the paint `interaction-paint.css` emits, precisely
what criterion 7b measures against the square it sits on, and **`olive` fails that floor at ΔE
18.3 with the repair still unlanded** (`rfc/theming.md:556-563`, Discharge D1) `[V]`. A preview
that shows dest dots on olive squares makes a measured, still-open defect visible to the person
choosing, at zero extra cost. That is the interface form of "measured and published".

**(c) Pieces → both colours, both square colours, at legible size.** A 7 rem board renders a
knight at ~14 px; lichess's answer is one white knight at button size `[V]`. Ours needs more,
because `mono` is a **mask recolour** — one glyph set tinted `#211f1a` / `#f2eee2`
(`piece-skins/mono.css:3-4`) `[V]` — and the specific failure mode of a mask-recoloured set is
that white and black stop separating on one of the two square colours. So the piece strip shows
the six roles in both colours, laid over one light and one dark square of the **currently
selected** board.

**(d) The board preview is not only in Settings.** `Chessboard.svelte:321` already renders an
`Appearance` link on every non-disabled board `[V]` — the v1 floor `rfc/theming.md:470` asked for.
Promote it to the dasher pattern: a small on-board menu carrying the three strips, applying live,
over the position the person is actually looking at. That is not a preview; it is better than one,
and it is what both incumbents ship `[V]` lichess / `[P]` chess.com. `rfc/theming.md` Open
question 2 filed this as a candidate to confirm in use — the evidence says promote it, and the
owner's *"proper flows"* framing says the same.

### 2.4 Cost and dependencies

- **The hard part already ships.** A standalone miniature board — `fen`, `startSide`, `lastMove`,
  `overlays`, `disabled` — is rendered in **five** places today (`App.svelte:1059` at 7 rem/5 rem,
  `App.svelte:1075`, `GroupPanel.svelte:116`, `CompareView.svelte:95`,
  `CheckpointSheet.svelte:102`), and `.board-shell` is `width:100%; aspect-ratio:1`
  (`Chessboard.svelte:380-384`) `[V]`. The preview is a composition of shipped props.
- **One real blocker, small and named.** Skin selectors anchor on `.board-shell[data-board-theme]`
  / `[data-piece-set]`, and `Chessboard.svelte:320` reads those from the **global** controller, not
  from props. Previewing a *non-active* skin needs those two attributes as optional overrides —
  two props, no new CSS. `[V]`
- **One larger blocker for the app-theme card.** `controller.ts:118-127` writes the 12 tokens onto
  `document.documentElement` only. Previewing a non-active palette needs the same write scoped to
  an arbitrary element (`applyPalette(el, palette)`), with the root call becoming one caller of it.
  That is a refactor of one function and it makes criterion 13's orthogonality *easier* to test,
  not harder.
- **Blocked on nothing else.** No RFC, no server, no new asset. The catalog roster ([[D1425]],
  Discharge D1) is orthogonal: the preview is what makes a ten-entry catalog navigable, so it
  should land first or with it, not after.

---

## 3. The theme preview, and composition without explosion

### 3.1 The scale problem, stated honestly

| catalog | combinations |
|---|---|
| shipped today | 3 × 2 × 2 = **12** `[V]` |
| the ruled catalog ([[D976]]: the ten schemes) at today's skins | 10 × 2 × 2 = **40** |
| lichess | 5 × 25 × 42 = **5,250** `[V]` |

No picker renders a cross-product. Lichess does not try: three independent lists, and the burden of
composing them is entirely the user's. That is defensible for a site whose users are chess-fluent
and whose picker is one click from the board. It is a worse fit for a product whose first-run
posture is silence and whose learner is being taught to read a board.

### 3.2 The answer: Looks — a named layer over the axes

This is the same shape as intent presets over `AssistanceConfig`, and the same shape chess.com
ships as mobile "Theme" `[P]`.

- **Looks** is a short list of named `(appTheme, boardTheme, pieceSet)` triples. Each carries a
  `label`, a one-line `promise`, and — the point — is previewed as **one composed card**: the app
  chrome with the board sitting inside it. That is the *only* surface where the three axes are
  ever seen composed, and it is a **linear list**: as many cards as there are Looks. Four or five
  at v1 (e.g. *Warm paper*, *Tokyo Night*, *Warm dark*, *High contrast*).
- **Beneath it, three axis strips**, each previewing only its own axis against the currently
  selected other two. Touching any strip updates the composed card and moves the Look chip to
  **Custom**.
- **Custom is a first-class, honest state**, and it is where the `origin` distinction repeats one
  level up: a Look is a curated claim we make and gate; Custom is the person's own composition and
  we assert nothing about it — exactly as `rfc/theming.md` §3.3 gates `origin: "tabiya"` palettes
  and merely measures inherited ones.

**Why this does not breach [[D982]], and why the owner should rule on it anyway.** D982 forbids
*cross-axis composition rules* — "picking app theme X pins board Y". A Look sets three ids in one
click and then **releases** them; every strip stays free afterwards, no combination is refused,
defaulted away, or silently re-picked, so criterion 13 (`rfc/theming.md:593-600`) still passes
unchanged. A Look is a macro, not a rule. But D982 is an owner ruling and this is a layer above
it, so it is named as **Owner decision 1** (§10) rather than assumed. `[M]` — this is my
reading of the ruling's scope, not a quotation of it.

### 3.3 What a Look card actually shows

One card, three regions, all live-rendered from the real components:

```
┌──────────────────────────────────────┐
│  Tokyo Night                    ✓    │   ← label + active mark (owner's ThemePicker pattern)
│  ┌────────────┐  Objective           │   ← --panel card on --paper, --ink heading,
│  │  ▓▒▓▒▓▒▓▒  │  You are a pawn up.  │     --muted body, --line border
│  │  ▒▓♞▓▒▓▒▓  │  ┌──────────┐        │
│  │  ▓▒▓▒◉▒▓▒  │  │ Play on  │        │   ← --accent fill, --on-accent label
│  │  ▒▓▒▓▒▓♜▓  │  └──────────┘        │     (the pair that broke 4× — §8.3)
│  └────────────┘                      │
│  after folke/tokyonight.nvim         │   ← the `after` courtesy line
│  ⚠ 3 measured low-contrast pairs     │   ← inherited-palette badge, ON the entry
└──────────────────────────────────────┘
```

The board inside carries the last-move, dest, check and four-brush paint from §2.3(b). The card
therefore answers, in one glance, the four questions the current text `<select>` cannot: *what
colour is the app, what colour is the board, can I read the button, can I see the highlights.*

---

## 4. Mode, and the silent-substitution class

### 4.1 What a user expects

That a control shows what is true. This is not a preference, it is the definition of a control.

### 4.2 What we ship

Two instances of one defect, both `[V]`:

**(i) The app-theme fallback.** `controller.ts:32`:

```ts
const appTheme = selected.modes.includes(mode) ? preference.appTheme : MODE_DEFAULT[mode];
```

`preference.appTheme` is preserved untouched, and the `<select>` binds to it
(`AppearanceSettings.svelte:40`). So: choose *Tabiya paper* (light-only), let the device go dark →
the product paints `warm-dark` while the dropdown still reads *Tabiya paper*. The substitution is
disclosed **only** as prose beneath the grid — `:71`, *"Using {label} in {mode} mode."* — with no
warning, no diff, and no relation to the control that is wrong.

**(ii) The reduced-motion override.** `controller.ts:37`: `animation: reducedMotion ? "none" :
preference.animation`. A person who set *Normal* and has OS reduce-motion on sees the select
reading **Normal** while nothing moves. Nothing in the UI mentions it, and there is no CSS
`@media (prefers-reduced-motion)` block anywhere in the app — the single `matchMedia` at
`controller.ts:67` is the whole mechanism.

### 4.3 What competitors and the owner's own code do

Lichess sidesteps (i) entirely: background and board are separate axes, so no background can lack
a mode. `[V]` structural, from `Theme.scala` / the dasher.

**The owner's own store solves it the other way round, and this is the recommendation `[V]`:**

```ts
// ~/frameworks/monorepo/website_application/src/lib/stores/theme.svelte.ts:211-217
setTheme(id: ThemeId) {
  themeId = id;
  const available = getModesForTheme(id);
  if (!available.includes(mode)) { mode = available[0]; }   // keep the theme, move the mode
  persist();
}
```

…and it never renders a control that would lie: `ThemeModeToggle.svelte:5` wraps the whole toggle
in `{#if themeStore.hasMultipleModes}` `[V]`.

### 4.4 What we should do, and why it differs

**Invert the fallback: keep the theme, move the mode.** The theme is the deliberate choice — the
person went to a screen and picked it by name. The mode is, by [[D976]], *derived from the device*
by default. When they conflict, discarding the deliberate choice to preserve the derived one is
backwards, and the shipped code does exactly that. `resolveTheme` should hold `preference.appTheme`
and resolve `mode` to a mode that theme declares.

Then make the residue visible rather than silent, using the primitive already in the tree:

- The **Light/dark** control renders through `HonestControl.svelte` with the reason
  *"Tabiya paper is light only. Tokyo Night ships both."* — that component is rendered 7 times in
  the run screens and **zero** times in either settings component `[V]`.
- The **Piece movement** control renders through the same primitive when reduce-motion is on:
  *"Your device asks for reduced motion, so animation is off. This setting applies when that
  changes."*

This is a change to what [[D976]]'s *"follow the device"* means when the chosen theme is
single-mode, so it is **Owner decision 2** (§10) — but the owner's own shipped code already
answers it, which is the strongest evidence available for what the owner means.

### 4.5 Cost and dependencies

`controller.ts:32` is one line; `:37` is one line plus one disclosure. `theme.test.ts:97-99`
currently *asserts the wrong behaviour*, so it changes with the fix. `MODE_DEFAULT` and criterion
4(e) (`rfc/theming.md:506-509`) survive untouched — they govern the *no-preference* case, which is
a different case. No RFC amendment is strictly required; a changelog entry against §4 is.

---

## 5. Settings as a screen — the 72 controls

### 5.1 What a user expects

A settings screen is one of two things and must not be both:

- a **preference sheet** — short, ordinary, everything visible at once, everything meaningful to a
  person who does not know how the product is built; or
- a **control panel** — long, grouped, searchable, for someone who does.

`/settings` today is a control panel wearing a preference sheet's URL, and its own `<h1>` gives it
away: **"This deployment"** (`App.svelte:1099`) `[V]`. That is the operator's noun. A person who
came to make the board less bright is reading a page titled after a server.

What they expect specifically: to find the one thing they came for in seconds (grouping, or
search); to understand each option without knowing the architecture; to see which options are
non-default; to be told when an option cannot apply here.

### 5.2 What we ship

- **8 contexts × 9 controls = 72**, all rendered simultaneously in a 3-column CSS grid
  (`AssistanceSettings.svelte:59-75`, `:119`) `[V]`. No tabs, no accordion, no search, no
  "changed from default" mark, no reset, no bulk edit.
- The nine controls are **mechanism nouns**: *Board lighting · Arrows · Spoken guidance · Ambient
  presence · Passive markers · Named-pattern guidance · Human move split on request · Corpus
  counts on request · External voice* (`:63-71`) `[V]`. `competitor-play-ux.md` §3 already named
  this class — *"assistance exposes plumbing, not intent"* — for the run screen; it is worse here,
  eight-fold.
- **A second, divergent copy of the same panel ships in-run** (`DrillScreen.svelte:846-864`):
  seven of the nine, different labels for the same fields — settings says *"Passive markers"*, the
  run says *"Passive pivotal markers"*; settings *"Human move split on request"*, the run
  *"Evidence inspector: human move split"* `[V]`.
- **The in-run copy is honest and the settings copy is not.** The run panel calls
  `permittedAssistance()` and renders `HonestControl` reasons when a field is `locked_off`
  (`:851-856`). The settings page never calls it `[V]` — so the **Match / Arena** card renders all
  nine controls fully enabled, while `match`'s policy allows only the `quiet` preset and a
  `moduleCeiling` of `["rules_floor"]` (`presets.ts:45`) `[V]`. Nine live-looking controls, all
  inert.
- On first paint every context renders `SILENT_ASSISTANCE` and is replaced `onMount` (`:19`,
  `:53`) — a visible flash of wrong values `[V]`.

### 5.3 What competitors do

Nobody in the surveyed field exposes a per-context assistance matrix; the comparison is with
products that **name an intent** and hide the machinery:

- **Chessiverse** — a three-level dial: *Full Help / Peek / Hint Only*, whose published vocabulary
  is "levels of help", not mechanism names `[V]` https://chessiverse.com/guided-play (via
  `competitor-play-ux.md` §1.4).
- **chess.com** — one verb, *Game Review*, over an entire analysis pipeline `[V]`.
- **Lichess** — the play screen has no assistance settings at all; zen is one key, three pref
  states `[V]`.
- **En Croissant** — raw evals exist but sit behind an Analysis tab, off by default `[V]`.
- **Nibbler** — the counter-example: every internal always on, which
  `competitor-play-ux.md` §1.5 correctly calls "the anti-pattern made flesh" `[V]`.

The whole field, in both directions, agrees on the same rule: **ordinary surfaces carry intents;
mechanisms live behind a dedicated inspector.** That is `design/05` §3-forms O4 word for word.

### 5.4 What we should do, and why it differs

**The shipped settings page contradicts the intent doc it implements.** `design/05:222-226` (O4,
2026-08-20): *"Ordinary views expose **modules and presets**; raw source/form switches live in
Advanced/Custom surfaces or the inspector."* Seventy-two raw switches in the ordinary view is the
negation. This is an implementation gap, not a design gap — no design change is needed to fix it.

Three moves:

1. **Ordinary Settings loses the matrix entirely — and does not replace it with a preset matrix
   either**, because a person does not think in contexts. What ordinary Settings shows is one
   sentence and a link: *"When you start something, Tabiya asks how much help you want, and
   remembers your last answer for that kind of activity."* → Advanced. The per-context memory keeps
   working exactly as it does today (`tabiya.workflow.v1.${kind}`, `assistance-preference.ts:19`);
   it is simply never *presented* as a grid.
2. **The preset moves into the flow** (§6).
3. **Advanced holds the nine raw fields *once*, not eight times,** with an explicit scope control
   ("apply to: this activity / everywhere") and every field rendered through `HonestControl` with
   its `permittedAssistance` reason. 72 → 9 + 1.

Net for the whole settings surface: **77 controls → ~8 ordinary + 10 advanced**, and the ordinary
ones are all appearance and account, which is what a person came for.

Two structural fixes to the page itself, both cheap:

- **The `<h1>` is wrong.** "This deployment" names the server. The page is *Settings*; the
  deployment-capability list (`AssistanceSettings.svelte:78-82`) and the surface-availability list
  (`App.svelte:1102`) are a **status page**, not settings — they explicitly say so themselves
  (*"These are status facts, not account controls"*, `:81`) and should sit under **About this
  deployment**, linked, not stacked in the middle of a person's preferences.
- **Sections need a table of contents** (Appearance · Playing · Account · About), because the page
  is a single flat scroll with no landmark structure inside the matrix and no skip.

### 5.5 Cost and dependencies

- Moving the preset into the flow is **unblocked as of 2026-08-24**: `rfc/intent-presets.md` §7.1
  enumerates exactly what the surface reads and states that every "the value does not exist"
  blocker is gone; `loadWorkflowPreset`/`saveWorkflowPreset` ship (`assistance-preference.ts:20`,
  `:36`) and are called by nothing in `.svelte` `[V]`.
- Advanced needs one scope control and `permittedAssistance` wired into the settings page — the
  run screen shows how (`DrillScreen.svelte:851-856`).
- **Owner-tier dependency:** `design/03-product-breadth.md:294`'s Settings row lists
  *feedback/evidence* as a Settings family. Under this proposal the ordinary feedback/evidence
  controls leave Settings for the flow and the raw ones go to Advanced. Law 5 — **Owner decision
  4** (§10).

---

## 6. What stays a setting, what moves into a flow, what is simply inferred

This is the owner's structural question, answered over every configurable thing that ships.

**The test used.** A decision belongs in a settings screen only if **(a)** it is a standing
property of the *person* rather than of the *session*, **and (b)** the product has no natural
moment at which to ask it. Fail (a) and it belongs in the flow. Pass both but be observable, and it
should be observed rather than asked.

### A — Stays a setting (standing property of the person)

| what | today | change |
|---|---|---|
| App theme, board, pieces | 3 selects | become previewed pickers + Looks (§2, §3); also reachable from the board |
| Light / dark override | select | keep; **hide or disable it honestly** when the chosen theme is single-mode (§4) |
| Piece movement | select | keep; disclose the reduce-motion override (§4) |
| Spoken guidance / external voice | 2 controls **× 8 contexts** | **one** control each. These are provider channels, not amounts of help — `rfc/intent-presets.md` §4a pins them at their floor in **all five** presets for exactly this reason, so per-context copies encode nothing |
| Account: sign out, download my data, delete account | present, and good | keep; see §7 |
| Accessibility (input mode, coordinates, contrast) | partially in the board controller | belongs here; `design/03:294` already names accessibility as a Settings family |

### B — Moves into the flow (property of the session, asked where it bites)

| what | today | where it should be asked |
|---|---|---|
| **The preset** — how much help | 72 raw controls in Settings | **at start**, in `JustPlayStarter` / on opening a pack, as `allowedPresets` for the derived context with its `promise` sentence under each; **and in-run**, as the preset pill (`play-composition.md:159-160` reserved the slot) |
| **Opponent strength** | `JustPlayStarter.svelte:17`: *"Human-common"* / *"Strong engine"* — two mechanism names | the measured roster: **1000 / 1400 / 1800 / 2200** (`maia-production-band-roster.md`; `App.svelte:391` already types exactly these four) named as what they are, not as which model serves them |
| Side | already in the flow | correct, unchanged |
| Evidence inspector requests (human split, corpus counts) | checkboxes × 8 | not preferences — they are **requests**, made in the inspector. The `analysis` preset already projects them as `on_request` (`rfc/intent-presets.md` §4a) |
| Board lighting / arrows level | selects × 8 | projections of the preset (§4a table); never chosen directly in an ordinary view |

### C — Inferred, and never asked

| what | status |
|---|---|
| Light vs dark, absent an override | **already correct** — `matchMedia`, live, no reload (`controller.ts:66-71`) |
| Reduced motion | already inferred; **must be disclosed**, not silent (§4) |
| The workflow context | already derived (`deriveWorkflowContext`, `presets.ts:107-117`). The word "context" and the eight-row matrix should never appear in a person-facing surface |
| Provider availability (LLM, TTS, corpus) | already inferred from `/capabilities`; today it renders as **eight identical** *"No external voice provider is configured for this deployment"* strings (`AssistanceSettings.svelte:72`) `[V]`. One statement, in About |
| Per-context ceilings | computed (`moduleCeiling`, `configClamp`); never asked. Disclosed only when they bite, through the standing footer — *"Support isn't available in a match"* (`rfc/intent-presets.md` §7) |

**The one-line answer to the owner's question:** *appearance and account stay in Settings; how much
help you want moves to the start of the session and the preset pill; everything derived from the
device, the deployment or the context is inferred and only ever disclosed.*

---

## 7. Account

### 7.1 What a user expects

That signing in carries their setup with them. A theme chosen on the laptop is expected on the
phone; this is table stakes wherever an account exists.

### 7.2 What we ship `[V]`

- A **complete identity layer**: `apps/server/src/identity.ts` (sessions, hashed tokens, expiry),
  routes `/auth/register|login|logout` (`rest.ts:812-829`), `authorization.ts` principals.
- Appearance persisted **only** to `localStorage` under `tabiya.theme`
  (`theme/preference.ts:12`), with per-field validate-on-load (`:18-38`) and cross-tab sync
  (`controller.ts:104-108`). Zero server references to theme or appearance.
- Assistance the same: `tabiya.assistance.v1.${kind}` / `tabiya.workflow.v1.${kind}`.
- **Account export explicitly excludes it, by design**: `apps/server/src/account-data.ts:79-86`
  classifies these as `store: "browser_local"`, `dataClass: "device_local_preferences"`,
  `exportDisposition: "exclude"`, `deletionDisposition: "clear_browser"`.

So: sign in on a second device and you are back to warm paper, with silence in all eight contexts,
and nothing tells you why. The UI does state *"Saved in this browser"*
(`AppearanceSettings.svelte:36`) — honest, and still the wrong outcome.

### 7.3 The observation worth writing down

**The product ships a preview for deleting your account and no preview for changing its colours.**
`AssistanceSettings.svelte:97-108` requires *Review deletion effects* before the delete button
exists, then renders four categorised lists — permanently deleted, kept read-only for
collaborators, access revoked, published work retained — under `aria-live="polite"` `[V]`. It is
genuinely excellent, and it is the best evidence available that this codebase knows how to build a
preview. It built one for the rarest action in the product and none for the most common.

### 7.4 What we should do

Give **appearance** (not assistance) an account-scoped home, with device-local as the fallback:
last write wins, no sync ceremony, no version machinery ([[D977]] applies unchanged — every field
is still a member of a closed catalog). Assistance presets are more arguable: a preset is a
statement about a *session*, and per-device is defensible.

This changes the export and deletion contract (`account-data.ts:79-86` would gain an included row),
so it is **Owner decision 3** (§10). It also intersects B8's still-unmet account
export/backup floor (`design/03:308`).

### 7.5 Cost

Identity, sessions and the export bundle format all exist. One table, one route pair, one fallback
rule in `loadThemePreference`. The blocking question is contractual, not technical.

---

## 8. The visual identity

### 8.1 What a user expects

That the product looks like one thing. Specifically: that its own controls belong to it.

### 8.2 What we ship `[V]`

- **No global stylesheet.** Styling is 20+ component-scoped `<style>` blocks plus one `:global`
  section in `App.svelte`.
- **`select` is missing from the font reset.** `App.svelte:1131` reads `:global(button),
  :global(input), :global(textarea) { font: inherit; }`. Every `<select>` in the product —
  including all 8 in Settings — therefore renders in the **browser's default UI font** beneath a
  carefully-set display face (`--display-font`, 23 uses).
- **`AssistanceSettings.svelte` contains no `select`, `input` or `checkbox` rule at all** (`:119`).
  Seventy-two OS-native widgets.
- **[[D484]] is still live and still trivial**: `label{display:grid;gap:.25rem}` (`:119`) applies
  to the six checkbox labels, so every checkbox sits **above** its own caption. The correct
  pattern already exists in the sibling panel — `DrillScreen.svelte:1426`:
  `.assistance-grid label { display:flex; gap:.4rem; align-items:center; }`. Open since
  2026-08-16; the fix is one CSS rule that is already written, correctly, in the sibling panel.
- **Motion vocabulary is one item.** Zero CSS `transition:` or `animation:` declarations exist
  anywhere in the app. The only thing that moves is the chessground piece tween — which makes
  "Piece movement" accidentally the most honest label on the page, and makes [[D840]]'s
  felt-quality pass (Discharge D5) load-bearing for the whole product's sense of being alive.

### 8.3 The colour leaks, re-measured

```
grep -rnoE "(color|background|background-color|border-color|outline|fill|stroke)\s*:[^;\"}]*\b(white|black|Canvas|CanvasText)\b" \
  apps/web/src --include="*.svelte" --include="*.css"
```
→ **15 declarations across 8 files** `[V]`. (The brief's re-derivation gave 16/7; the difference is
regex boundaries, not substance.) The important structure inside that number:

- **Four are `color: white` on `background: var(--accent)`** — `WhyBanner.svelte:38`,
  `CheckpointSheet.svelte:302`, `DrillScreen.svelte:1589`, `Timeline.svelte:204`. The token that
  exists for exactly this is `--on-accent` (`tokens.ts:8`), and it is **near-black in both dark
  themes** (`#1a1b26` tokyo-night dark, `#16140f` warm-dark) `[V]`. White-on-accent is wrong in
  both. This is the single most consequential leak and it is why the app-theme preview card in
  §3.3 renders the accent button with its `on-accent` label.
- **Three mix a hard white into token values** — `App.svelte:1132` (the global `:focus-visible`
  outline), `:1133` (`::selection`), `ShellFrame.svelte:128`. The focus ring is an accessibility
  control that lightens toward white in every theme.
- **`App.svelte:1150`** — `background:white` on every repertoire-form input/select/textarea.
- **Eight `Canvas`/`CanvasText` uses in `Chessboard.svelte`** (`:423-466`) and four hexes in
  `GameStoryScreen.svelte` — both follow the **OS**, not the theme.

**And a defect the brief did not have `[V]`:** `theme/interaction-paint.css` contains **zero
`var()` references** — all 15 values are literals. `rfc/theming.md:404` specifies it as *"ONE
shared file, app-theme-token-driven"*. Evidence paint does not follow the app theme at all, and
criterion 6 cannot see it: it asserts the paint is **byte-identical** across board swaps, which a
hard-coded file satisfies trivially. Mark brushes are likewise fixed (`catalog.ts:105-110`).

**The instrument, extending [[D1433]].** `theme.test.ts:220`'s regex
`/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/iu` has **three** independent holes, not one: no named-colour
alternation; **`.css` files are excluded from the literal sweep entirely** (the filter requires
`.endsWith(".svelte")`); and two blanket exemptions — anything under `/theme/`, plus
`GameStoryScreen.svelte` **by name** (`:219`). Separately, `theme.test.ts:182` pins the brown dark
square as `#c0ae91`, a hand-computed constant that appears **nowhere** in `brown.css` (the real
value is a 20 %-opacity black overlay inside a base64 SVG) and that no test recomputes.

### 8.4 What we should do

1. **One control layer, authored once, token-driven** — `select`, `checkbox`, `radio`, `input`,
   `button`, with real padding, a `--line` border, a `--accent` focus ring and a `--panel`/
   `--surface` ground. `AppearanceSettings.svelte:85` already sets `color`/`background` on select
   and stops there; `JustPlayStarter.svelte:24` sets padding/border/radius on its own. Neither is a
   layer. This is the single highest-leverage identity change in the product: it is what makes the
   settings screen stop looking like a 1998 form, and it costs one file.
2. **Add `select` to the font reset.** One word.
3. **Fix [[D484]] with the pattern from the sibling file.** One line.
4. **Retire the four `color: white`-on-accent leaks onto `--on-accent`**, and the three
   white-mixes onto `--paper`/`--ink`.
5. **Drive `interaction-paint.css` from tokens**, and land `olive`'s ΔE repair (Discharge D1).
6. **Close the sweep's three holes** — named colours, `.css` files, and the by-name exemption.
7. **The identity thesis, stated so it can be argued with:** *the board is the product's face;
   everything else is chrome whose job is to get out of its way.* This is not aesthetic
   preference — it is `competitor-play-ux.md` §2's two field invariants, held by every product from
   Noctie to Nibbler `[V]/[P]`. It has a direct consequence for this dossier: the settings screen
   should be **quiet, spacious and unremarkable**, and the *only* place appearance work is allowed
   to be expressive is the preview, because the preview is a picture of a board.

### 8.5 Cost

One stylesheet, ~120 lines, no dependencies. Items 2, 3 and 4 are under an hour combined and close
a ledger row open since 2026-08-16.

---

## 9. Honest absence must be visible in the interface

`design/05-in-run-experience.md:41` is an invariant: **"Absence is stated, never simulated. If the
product does not know, it says so."** The settings surface breaks it five times, and the primitive
that fixes it is already written.

| # | violation | evidence |
|---|---|---|
| 1 | **Match / Arena shows nine live controls that are all inert** — `match` allows only `quiet` with `moduleCeiling: ["rules_floor"]` | `presets.ts:45` vs `AssistanceSettings.svelte:63-71` `[V]` |
| 2 | `permittedAssistance()` is **never called** by the settings page, so it cannot know | `[V]` |
| 3 | The theme control shows `paper` while the product paints `warm-dark`; disclosed only in prose, elsewhere on the page | `controller.ts:32`, `AppearanceSettings.svelte:40` vs `:71` `[V]` |
| 4 | The animation control shows *Normal* while reduce-motion has forced *none*; disclosed nowhere | `controller.ts:37` `[V]` |
| 5 | Measured sub-AA pairs are real and correct, but sit in a page-level `<details>` beneath the grid rather than **on the entry**, which is what the RFC specifies | `AppearanceSettings.svelte:73-78` vs `rfc/theming.md:286` `[V]` |

And the finding that ties them: **`<HonestControl>` is rendered 7 times across 4 run-screen
components and zero times in either settings component** `[V]`
(`grep -o "<HonestControl" apps/web/src --include="*.svelte" -r`). The product built a component whose entire job is
"this control is disabled and here is why", uses it correctly everywhere it is playing chess, and
does not use it once on the screen where a person configures the product. Every one of the five
rows above is that component plus a sentence.

Nothing here is a new mechanism. Fixing all five is a wiring pass.

---

## 10. Owner decisions this dossier names (intent tier — not written)

1. **Does a "Look" — a named `(appTheme, boardTheme, pieceSet)` triple that sets three ids and then
   releases them — sit inside [[D982]]?** My reading is yes: it is a macro, not a cross-axis
   composition rule, and criterion 13 (`rfc/theming.md:593-600`) passes unchanged because no
   combination is refused, defaulted away or silently re-picked. But D982 is an owner ruling and
   this layers above it. `[M]`
2. **Invert the single-mode fallback: keep the theme, move the mode** (§4). This changes what
   [[D976]]'s *"follow the device"* means when the chosen theme declares one mode. The owner's own
   `theme.svelte.ts:211-217` and `ThemeModeToggle.svelte:5` already answer it this way `[V]`.
3. **Should appearance follow the account?** Today it is device-local by construction and
   explicitly excluded from account export (`account-data.ts:79-86`). Including it changes the
   export/deletion contract and touches B8's unmet floor.
4. **`design/03-product-breadth.md:294`'s Settings row** — the *feedback/evidence* family moves out
   of ordinary Settings (to the session flow and the preset pill) with raw switches to Advanced,
   per `design/05` §3-forms O4. Law 5: owner or claude-on-ruling.
5. **The app-theme roster** ([[D1425]], Discharge D1) — the ruled *"CATALOG of known color
   schemes"* is ten in the owner's own registry, of which four carry both modes `[V]`. Related
   pick: the second piece set and the `--warning` repair variant, both still open under D1.

---

## 11. Proposed ledger rows (NOT written)

Head at pass start was **D1453** `[V]`; **a concurrent pass landed D1454–D1458 into the working-tree
ledger while this dossier was being written**, so the block below starts at D1459. Ids remain
proposals — renumber from head at write time, per the block-registration convention at
`design/BACKLOG.md:118-133`.

- **D1459** — this dossier: the per-feature UX pass over settings, appearance, theming, account and
  identity; the stays-a-setting / moves-to-a-flow / inferred split; the three-medium preview and
  the Looks layer; honest-absence audit of the settings surface.
- **D1460** 🐞 — **Silent substitution is a class with two shipped instances, and the owner's own
  code resolves it the other way.** `controller.ts:32` discards the deliberately-chosen theme to
  preserve the device-derived mode; `controller.ts:37` overrides the animation choice for
  reduce-motion. Neither is surfaced on its control. `~/frameworks/…/theme.svelte.ts:211-217` keeps
  the theme and moves the mode; `ThemeModeToggle.svelte:5` refuses to render a toggle that would
  lie.
- **D1461** 🐞 — **No theme preview exists, while every part of one already ships.** Zero
  `preview` occurrences in `AppearanceSettings.svelte`; the miniature-board composition is rendered
  in five places (`App.svelte:1059`, `:1075`, `GroupPanel.svelte:116`, `CompareView.svelte:95`,
  `CheckpointSheet.svelte:102`); and `~/frameworks/…/ThemePicker.svelte` previews ten schemes as
  swatch cards in 70 lines, in the **same directory** whose 40-line storage helper
  `theme/preference.ts` faithfully copies. Sibling of [[D1425]]: the same directory listing was
  read and the same two files walked past.
- **D1462** 🐞 — **`interaction-paint.css` contains zero `var()`.** `rfc/theming.md:404` specifies
  it as *"ONE shared file, app-theme-token-driven"*; evidence paint is theme-invariant, and
  criterion 6 cannot see it because it asserts byte-identity across board swaps, which a hard-coded
  file satisfies trivially. Mark brushes are likewise fixed (`catalog.ts:105-110`). `olive`'s
  failing ΔE 18.3 (`rfc/theming.md:560`) is still unrepaired.
- **D1463** 🐞 — **The settings page simulates absence.** It never calls `permittedAssistance()`,
  so **Match / Arena** renders nine live controls while `match` allows only `quiet` with a
  `rules_floor` ceiling (`presets.ts:45`). `<HonestControl>` is rendered 7× across 4 run-screen
  components and **0×** in either settings component. Violates
  `design/05-in-run-experience.md:41`.
- **D1464** 🐞 — **`select` is missing from `App.svelte:1131`'s `font: inherit` global**, so every
  `<select>` in the product renders in the browser UI font under the display face; and
  `AssistanceSettings.svelte:119` styles no form control at all. With [[D484]]'s
  checkbox-above-caption (the correct rule already exists at `DrillScreen.svelte:1426`) this is the whole
  of the missing control layer.
- **D1465** 💡 — **Looks: a named `(appTheme, boardTheme, pieceSet)` layer over the three axes**,
  previewed as one composed card, with the axis strips beneath and *Custom* as a first-class state.
  Answers the cross-product (12 today, 40 at the ruled catalog, 5,250 at lichess). Needs Owner
  decision 1 against [[D982]].
- **D1466** 💡 — **Appearance does not travel with the account.** Full identity ships
  (`identity.ts`, `/auth/*`); theme is `tabiya.theme` in localStorage only; `account-data.ts:79-86`
  marks device-local preferences `exportDisposition: "exclude"` by design. Intersects B8's unmet
  export/backup floor.
- **D1467** 💡 — **Settings IA.** `/settings`'s `<h1>` is *"This deployment"*; the page is one flat
  scroll of appearance + 72 assistance controls + capability status + surface availability +
  account, with no grouping, search, default marking or landmark structure. Split
  ordinary/Advanced per `design/05` O4 and move the two status lists to *About this deployment*.
- **D1468** 🐞 — **The theming sweep has three holes, not one** (extends [[D1433]]):
  `theme.test.ts:219` excludes **`.css` files entirely** from the literal sweep and exempts
  `GameStoryScreen.svelte` **by name**, in addition to the named-colour gap D1433 records. Also
  `theme.test.ts:182` pins `#c0ae91` for the brown dark square — a hand-computed constant present
  nowhere in `brown.css` and recomputed by no test.

---

## Residuals and limits

- **No competitor product was driven hands-on.** Lichess claims are primary-source code fetched
  this pass — stronger than screenshots, weaker than felt UX. chess.com's picker presentation is
  genuinely unresolved: its own support article says *"a list of available themes"* without stating
  whether the list is thumbnailed, so §2.2 makes no claim either way. The single highest-value
  follow-up is a 20-minute hands-on pass over lichess's dasher and chess.com's Boards & Pieces with
  a browser session.
- **The Looks proposal is `[M]`** — a synthesis over chess.com's bundle pattern `[P]`, our own
  preset shape `[V]`, and the arithmetic of §3.1. No product was observed shipping the specific
  "composed card + axis strips + Custom" form.
- **The 8-control / 10-advanced arithmetic in §5.4 is a proposal, not a measurement.** The
  measurement is the 77 that ship today.
- **`design/05` and `design/03` are intent tier and were read, not edited.** Every change this
  dossier implies to them is named in §10 as an owner decision.
- Nothing here touches assistance semantics, evidence eligibility, or the [[D493]] boundary. The
  Looks layer sits entirely inside the appearance axes; §6's bucket B moves *presentation of* the
  preset choice, never what a preset may narrow to (`rfc/intent-presets.md` §9's ruled floor is
  untouched).
