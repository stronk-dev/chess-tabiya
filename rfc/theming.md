# RFC: Theming — a catalog of known schemes over a total token contract

- **Status:** draft — 2026-08-22
- **Author:** claude (drafted from `planning/theming/rfc-derivation.md`, the HEAD derivation of the styling surface, plus a read of the owner's reference implementations — see §2.1)
- **Created:** 2026-08-22
- **Design refs:** `design/03-product-breadth.md` shell table (Settings row — amendment owed, Deviation 1); `design/05-in-run-experience.md` §3a (assistance silence is untouched by any theme); ledger rows [[D839]] (the commission), [[D840]] (the animation defect), [[D875]] (the measured floor), [[D976]] (the two rulings this RFC encodes)
- **Exploration gate:** owner override 2026-08-12 (`planning/exploration/gates.md:191`) + the direct owner commission ([[D839]], [[D976]]) + `rfc/play-composition.md:674` Discharge D3 assigning this lane to claude. Licensing derivation: `planning/theming/rfc-derivation.md` §0.
- **Depends on:** `rfc/play-composition.md` (accepted, implementing — the composition token discipline A10 and the stable-board-instance guard A9 this RFC extends); `rfc/intent-presets.md` (accepted — the compiler seam §4's boundary is pinned against, both directions)
- **Parent / amends:** —
- **Supersedes / superseded by:** —
- **Planning:** `planning/theming/`

```tabiya-claims
none
```

## Summary

The app ships one hard-coded light palette (`color-scheme: light`, `App.svelte:931`), one
board, one piece set, and no animation preference. The owner ruled the shape twice on
2026-08-22 ([[D976]]): the default **follows the device setting** with a manual override, and
the identity is **a catalog of known color schemes** — Tokyo Night named as the favorite —
using the set-of-themes pattern the owner already runs in three other codebases. This RFC
specifies: a **total token contract** (every theme is a complete token map; a theme with a
missing token cannot ship), a **v1 catalog** of three themes (`paper` — the existing warm
light, retained; `tokyo-night` in both modes, palette inherited verbatim from the owner's own
registry; `warm-dark` — the committed record of the FullDark canvas candidate), **mode
resolution** (`prefers-color-scheme` picks each mode's default member; an explicit choice
wins), the **board/piece catalog** with the load-bearing mechanical move — splitting square/
piece *skin* from interaction/evidence *paint*, which are fused in one CSS file today — the
**animation preference** (None/Fast/Normal, the [[D840]] residue), and client-only persistence
under **`tabiya.theme.v1`**, structurally unreachable from the assistance compiler in both
directions (the [[D493]] boundary). Claims nothing versioned.

## Motivation

[[D839]] (owner, verbatim): *"theming is a product need, not polish: dark theme first-class
(the owner dislikes light websites), board and piece-set choices, and the visual identity
generally."* [[D976]] (owner, verbatim): *"we might as well give it a known color scheme?
personally i like tokyo night linux a lot. but we might as well provide multiple themes...
just like how ~/frameworks/monorepo the player and the webapp have a set of themes?
~/frameworks/mistserver also has it in the LSP there..."*

At HEAD (`planning/theming/rfc-derivation.md` §2, derived at `fbf3fc8`): **no dark-mode
handling exists** — exactly one `color-scheme: light` declaration; the token layer is nine
color tokens + one shadow in a single `:global(:root)` block (`App.svelte:930-943`); styling
lives in 20 per-component Svelte `<style>` blocks (`DrillScreen.svelte` alone 437 CSS lines);
**306 `var(--…)` usages** against ~27 stray color literals; and **two phantom tokens** —
`var(--surface)` (`CheckpointSheet.svelte:228`) and `var(--panel-soft)`
(`CompareView.svelte:168`) — are used but defined nowhere, resolving to nothing today. Three
more light-paper constants live outside Svelte entirely (`index.html:6` `theme-color`,
`manifest.webmanifest` theme/background). The board is themed by exactly three imported CSS
files, and `chessground.brown.css` fuses square color with **all interaction and evidence
paint** (last-move, dests, check, arrows) — the central mechanical fact this RFC exists to
untangle before any board theme can safely ship.

**Out of scope:** hue/brightness sliders and free color config (D875: lichess's sliders are
*"a decade of accretion — ceiling, not floor"*), 3D boards, background images, per-context
themes, zen mode, and cosmetic-reward **gating** — the campaign consumes this catalog by id
as its reward pool ([[D887]]/[[D893]]); earning/gating is `campaign-core.md`'s lane
(`planning/campaign/rfc-derivation.md:497` records the split). Nothing here touches
assistance semantics, evidence eligibility, or any versioned resource.

## Specification

### §1. The token contract — two layers, total by construction

**Layer 1 — semantic tokens** (new home: `apps/web/src/lib/theme/tokens.ts` as the single
vocabulary source; the CSS custom properties keep their shipped names so 306 existing `var()`
uses migrate by definition, not by edit):

The vocabulary is the shipped nine (`--ink`, `--paper`, `--paper-soft`, `--panel`, `--muted`,
`--line`, `--accent`, `--warning`, `--danger`) **plus** the promoted strays: `--surface` and
`--panel-soft` (the two phantom tokens, §2 of the dossier — defined for the first time),
`--scrim` and `--scrim-strong` (today's `rgb(20 18 14 / 55%)`-family literals in
Chessboard/DrillScreen), `--shadow`, `--accent-soft` (hover/focus tints currently derived
ad hoc), and `--on-accent` (text on accent — required for contrast criteria). Unit: token
names; total: **16** color-bearing tokens + `--shadow` + the composition's dimensional tokens
(unchanged, play-composition §3.1's). Criterion 1 counts the same unit.

```ts
// apps/web/src/lib/theme/tokens.ts (new)
export const THEME_TOKENS = Object.freeze([
  "ink", "paper", "paper-soft", "panel", "panel-soft", "surface",
  "muted", "line", "accent", "accent-soft", "on-accent",
  "warning", "danger", "scrim", "scrim-strong", "board-light", "board-dark",
] as const);
export type ThemeToken = (typeof THEME_TOKENS)[number];
export type TokenMap = Readonly<Record<ThemeToken, string>>;
```

(`board-light`/`board-dark` are the square-color hooks §5 consumes; they live in the same
map so a UI theme may pin its matching board default while board themes remain independently
selectable.)

**Layer 2 — themes.** A theme is a **`TokenMap` — total by type**. `Record<ThemeToken,
string>` makes a missing token a compile error, and criterion 3 re-asserts totality at
runtime over the shipped catalog (the type can be defeated by `as`; the test cannot). This
is the rule that kills the phantom-token class ([[D977]] proposed): a `var()` reference to a
token outside `THEME_TOKENS` fails criterion 1's sweep; a theme missing a token fails
criterion 3.

**Application** (inherited from the owner's player `ThemeManager` pattern — §2.1):
`data-theme="<id>"` + `data-mode="dark|light"` on `document.documentElement`; token values
applied as custom properties on `:root`. Theme switching is **attribute + property changes
only** — never a component remount (criterion 8 extends play-composition A9's stable-board
guard to theme switches; trap 4 of the dossier).

**Migration:** the ~27 stray literals (GameStoryScreen ×4, `DrillScreen.svelte` `#20180d`,
the scrim `rgb()`s, and the enumerated remainder in the dossier §2) are replaced by tokens in
the implementing pass; criterion 2 is the repo-wide ceiling that keeps them out. The three
non-Svelte constants (`index.html` `theme-color`, manifest `theme_color`/`background_color`)
become theme-aware (§3; criterion 12).

### §2. The theme catalog

#### §2.1 The inherited pattern (read, not reinvented)

Read for this draft from the owner's repos, per [[D976]]:

- `~/frameworks/monorepo/npm_player/packages/core/src/core/ThemeManager.ts` — 17 named
  presets (`tokyo-night`, `dracula`, `nord`, `catppuccin`, `gruvbox`, `one-dark`,
  `github-dark`, `rose-pine`, `solarized`, `ayu-mirage`, + light variants), each a total
  token map (bare HSL triplets consumed via `hsl(var(--fw-x) / alpha)`); CSS-only themes via
  `data-theme` selectors; `applyTheme(root, preset)` sets `data-theme` + inline custom
  properties; `getAvailableThemes()`/`getThemeDisplayName()` drive the picker.
- `~/frameworks/monorepo/website_application/src/lib/stores/theme.svelte.ts` — localStorage
  prefs `{themeId, mode}` with validation-on-load, first-visit `matchMedia("(prefers-color-scheme:
  light)")` fallback, `ThemeDef {name, dark?, light?}` keyed by `ThemeId` (10 schemes).
- `~/frameworks/mistserver/lsp/modules/core/themes.js` — the registry shape this RFC adopts:
  `{id, label, icon, modes: ['dark','light'], palettes: {dark: {...}, light: {...}}}`, 10
  schemes, per-mode hex palettes.

This RFC adopts the **registry shape** (mode-aware theme defs, kebab-case ids, display
labels), the **application mechanism** (data-attributes + custom properties), and the
**Tokyo Night palette values verbatim** from the LSP registry. It does not adopt the 10-17
scheme breadth in v1 — the catalog *mechanism* makes each additional scheme one `TokenMap`
(criterion 3 + criterion 5 run per entry), so breadth is cheap follow-on, not v1 scope.

#### §2.2 The v1 catalog (unit: catalog entries; total: 3 themes / 4 palettes)

```ts
export interface ThemeDef {
  id: ThemeId;                    // kebab-case
  label: string;                  // display name
  modes: ReadonlyArray<"dark" | "light">;
  palettes: Partial<Record<"dark" | "light", TokenMap>>; // a key per declared mode — criterion 3
  source: string;                 // attribution/license line, rendered in the picker's footer
}
export type ThemeId = "paper" | "tokyo-night" | "warm-dark";
```

1. **`paper`** (light) — the shipped warm-paper identity, values byte-identical to
   `App.svelte:930-943` today (`--ink #171713`, `--paper #eeeade`, `--paper-soft #e5e0d2`,
   `--panel #f8f5ec`, `--muted #6f6b61`, `--line #cbc4b4`, `--accent #3858c8`,
   `--warning #df9d32`, `--danger #ad3c32`) plus definitions for the seven new tokens
   (implementation picks within the same family; the existing rendered appearance is the
   regression baseline — criterion 4's "paper unchanged" arm). Nothing the owner sees in
   light mode changes at this RFC's landing.
2. **`tokyo-night`** (dark + light) — the owner's named favorite. Palette values inherited
   **verbatim** from the owner's own registry
   (`~/frameworks/mistserver/lsp/modules/core/themes.js`, `id: 'tokyo-night'`): dark —
   surfaces `#1a1b26` / `#1f2335` / `#15161e`, text `#c0caf5` / `#a9b1d6`, accent `#7aa2f7`
   (on-accent `#1a1b26`), red `#f7768e`, orange `#ff9e64`, green `#9ece6a`, changed/warning
   `#e0af68`, border `#414868`, hover `#292e42`; light — surfaces `#e1e2e7` / `#d5d6db` /
   `#c8c9ce`, text `#3b4261` / `#4e5772`, accent `#2e7de9` (on-accent `#ffffff`), red
   `#f52a65`, orange `#b15c00`, green `#587539`, changed `#8c6c3e`. Token assignment: `paper`
   ← background, `panel` ← secondaryBackground, `surface` ← input/tertiary, `ink` ← text,
   `muted` ← secondaryText, `line` ← border, `warning` ← changed, `danger` ← red. Upstream
   scheme: Tokyo Night (folke/tokyonight.nvim), MIT `[M — license verification is criterion
   11's first row, not a footnote]`; `source` line credits upstream and the owner's registry.
3. **`warm-dark`** (dark) — the FullDark canvas candidate, committed here as its durable
   record (the artboard is uncommitted scratchpad; dossier §5): surfaces `#16140f` /
   `#1e1b15` / `#2a2720` / `#35322a`, ink `#e8e4d8`, muted `#97917f`, accent `#8fa4e8`,
   warning `#df9d32` (unchanged from paper), board `#f0d9a8` light squares / olive
   `#8a9656`-family darks. Demonstrates D839's *"not an inversion"*: temperature carried,
   accent and squares re-picked.

All three ship `validation: "candidate"` for their *labels and any value adjustments* behind
the owner-use gate — the [[D906]](3)/[[D649]] pattern every accepted RFC this week used. The
catalog ids and the mechanism are normative now.

### §3. Mode resolution — the [[D976]] default

```
effectiveMode  = pref.modeOverride ?? (matchMedia("(prefers-color-scheme: dark)") ? "dark" : "light")
effectiveTheme = pref.themeId if catalog[pref.themeId].modes includes effectiveMode
                 else MODE_DEFAULT[effectiveMode]
MODE_DEFAULT   = { light: "paper", dark: "tokyo-night" }
```

- **Follow the device, live**: no stored override ⇒ the `matchMedia` listener re-resolves on
  OS theme change without reload (criterion 4).
- **Manual override wins**: an explicit mode or theme choice persists (§4) and beats the
  device until cleared ("Follow device" is the picker's first entry).
- A theme lacking the effective mode falls back to that mode's default member rather than
  rendering a half-defined palette (criterion 3 makes half-defined unrepresentable anyway;
  this rule covers the *selection* seam).
- `meta[name=theme-color]` is updated to the effective palette's `paper` value on every
  resolution; the manifest gains both a dark and light `theme_color` at build (criterion 12).

### §4. Persistence — `tabiya.theme.v1`, and the not-assistance boundary

One **global** key (the theme follows the person, not the workflow context — deliberately
NOT the per-context `tabiya.assistance.v1.*`/`tabiya.workflow.v1.*` grammars):

```ts
// key: "tabiya.theme.v1"   value: { version: 1, themeId, modeOverride, boardTheme, pieceSet, animation }
// version inside the value (the shipped convention, rfc/intent-presets.md:280-284);
// validated on load, silently reset to defaults on parse/shape failure;
// same PreferenceStorage seam (assistance-preference.ts:16) so it unit-tests without a browser.
```

**The [[D493]] boundary, pinned in both directions** (dossier §4; intent-presets §5's mirror
obligation): no theme value is an input to `compileAssistance`, and no compiled assistance
output selects or alters a theme. `AssistanceConfig` gains no field; the theme store imports
nothing from `assistance-preference.ts` except the storage seam type. Criterion 10 enforces
both directions mechanically. A theme changes **how** disclosed things look — never whether,
where, or which (§5's evidence rules).

### §5. Board and piece catalog — the skin/paint split

**The mechanical fact** (dossier §3): `chessground.brown.css` carries the square colors AND
all interaction/evidence paint — last-move `rgba(155,199,0,.41)`, selected, dest dots
`rgba(20,85,30,.5)`, check radial, arrow brush colors. A naive board-theme swap silently
swaps evidence paint. **The split is this RFC's load-bearing move:**

- **`board-skin` files** — one per board theme, containing ONLY `cg-board` background color
  + dark-square SVG (or flat two-color via `--board-light`/`--board-dark`) + coordinate
  colors. v1 ships: `brown` (the current, extracted unchanged) and `olive` (the warm-dark
  artboard's `#f0d9a8`/olive pair). Selected by `data-board-theme` on the board wrapper.
- **`piece-skin` files** — one per set, the 12 data-URI selectors only. v1 ships `cburnett`
  (current, Colin M.L. Burnett, CC BY-SA 3.0 `[M — criterion 11 verifies]`) plus **one**
  additional set chosen from lila's catalog rows whose per-asset license is CC0/CC-BY/GPL-
  compatible — the specific set is owner-picked from the licensed candidate list (Open
  question 1); the RFC pins the *count* (≥2, the [[D875]] floor) and the license rule, not
  the name.
- **`interaction-paint.css`** — ONE shared file, theme-token-driven, carrying last-move,
  selected, dests, premove, check, and arrow-brush paint for **all** board themes. Evidence
  rules over it:
  - The four `MARK_BRUSHES` (`green|red|blue|yellow`, `packages/runtime/src/types.ts:52`)
    are **identities in stored data**: every theme maps each to a color, the four-way
    distinction plus their difference from the lighting-blue overlay must survive every
    theme (criterion 7's pairwise floor), and no theme may add, drop, or collapse a brush.
  - Dests and last-move are D493-ruled (rules floor / run history): themes recolor them,
    never remove or conditionally render them. `--warning`/`--danger` never collapse into
    one hue (criterion 5 covers the pair).
  - Board-lighting overlays (`DrillScreen.svelte:374`) remain gated by assistance state
    exclusively; the paint file styles them, nothing in it conditions them.

Board/piece selection is per the same `tabiya.theme.v1` value, applied by attribute — all
variants are bundled (three skin files are ~3 KB each; no dynamic import in v1), so switching
is attribute-only and criterion 8's no-remount guard holds.

### §6. The animation preference — [[D840]]'s residue

Play-composition A9 removed the *defeat* (the `{#key}` remount — zero matches at HEAD, board
stable, chessground's default tween now runs). This RFC ships the *preference* and the
verification the row still owes:

- **`animation: "none" | "fast" | "normal"`** in `tabiya.theme.v1`; default `normal`.
  Wiring: `config()` in `Chessboard.svelte` gains
  `animation: { enabled: pref !== "none", duration: {fast: 120, normal: 250}[pref] }` —
  values are the normative v1 constants (lichess ships 4 levels; the floor is 3; whether
  `slow` exists is Open question 3).
- **`prefers-reduced-motion: reduce` forces `none`** regardless of the stored value —
  accessibility overrides the default and the choice (criterion 9).
- **`redrawAfterLayout` innocence check** (dossier §1 residue 4): with the remount gone,
  verify at implementation that the post-`set()` redraw (`Chessboard.svelte:176,282`) does
  not truncate the tween; if it does, gate it on layout-affecting changes only. Recorded in
  the implementing commit either way.
- **Felt-quality verification is the owner's** (Discharge D5): [[D840]] stays 🐞 until the
  owner has seen pieces glide in a real session — the row flips on that log entry, not on
  green tests. Play-composition Open Question 3 (the post-commit on-board echo) is inherited
  here and **deliberately deferred to that same felt pass**: a static echo without verified
  animation reads as noise; the echo decision is made with moving pieces in front of the
  owner, not before.

### §7. Surfaces

- **Settings** gains a Theme section (theme picker with mode override, board theme, piece
  set, animation) — the picker renders each `ThemeDef.label` + `source` line and applies
  live. The design/03 Settings-row amendment recording "appearance" as a settings family is
  owner-tier (Deviation 1, proposed row [[D978]]).
- **In-play entry**: v1 ships Settings-only; a lightweight in-play entry (the lichess board-
  menu pattern the [[D875]] study measured) is a `candidate` behind the owner-use gate (Open
  question 2) — one link from the board region to the Settings section is the v1 floor.

### §8. Sweeps and lifecycle (unit: ledger rows this RFC's landing flips; total: 3 + 1 cell)

The implementing commit: flips **[[D839]]** (theme catalog shipped), **[[D840]]** *only
after* the owner's felt pass (D5 — may trail the code landing), adopts **[[D875]]**'s floor
row as implemented, records **play-composition Discharge D3** discharged in
`rfc/play-composition.md`'s table, and appends the log entry — the content-era closeout
discipline, restated so the lane cannot complete invisibly.

## Deviations from design

1. `design/03-product-breadth.md:294`'s Settings row does not name appearance/theming; this
   RFC needs it to. Law 5: the row is amended by the owner or claude-on-ruling — proposed as
   [[D978]], not edited here.
2. None otherwise; design/05's assistance invariants are consumed, not modified.

## Acceptance criteria

1. **Token totality sweep** — a test enumerates every `var(--x)` reference under
   `apps/web/src` and asserts `x ∈ THEME_TOKENS ∪ dimensional-tokens`; **red at HEAD** on
   `--surface` (`CheckpointSheet.svelte:228`) and `--panel-soft` (`CompareView.svelte:168`).
   A wrong implementation that defines the phantoms but drops the sweep passes once and rots;
   the sweep is the criterion, its first green is the fix's evidence.
2. **Stray-literal ceiling** — the same sweep counts color literals (hex/rgb/hsl) outside
   `theme/` definitions; the allowlist is enumerated in the test (SVG data URIs inside skin
   files exempt). Ceiling at landing: **0** outside the allowlist. Fails when any new literal
   lands anywhere in `apps/web/src`, not only composition styles (closes A10's new-code-only
   gap, dossier trap 1).
3. **Catalog totality** — for every `ThemeDef`, for every declared mode, every `ThemeToken`
   has a non-empty value (runtime re-assertion of the type; kills `as`-cast half-themes).
4. **Mode resolution** — browser assertions: (a) no stored pref + emulated dark ⇒
   `tokyo-night` dark; (b) no stored pref + emulated light ⇒ `paper`, **byte-identical
   computed styles to the pre-RFC light baseline** on a reference screen; (c) stored override
   beats device; (d) OS-change event re-resolves without reload when no override is stored.
5. **Contrast floors, per theme × mode** — automated WCAG 2.1 AA check over the enumerated
   token pairs (`ink`/`paper`, `muted`/`paper`, `ink`/`panel`, `on-accent`/`accent`,
   `warning`/`paper`, `danger`/`paper`): 4.5:1 body, 3:1 large/UI; plus `warning` vs
   `danger` distinguishable (ΔE\*ab ≥ 20). Fails on any pair in any shipped palette.
6. **Skin/paint split** — lint: board-skin files contain zero interaction-paint selectors
   (`last-move|selected|move-dest|check|premove` selector list pinned in the test); browser:
   switching `data-board-theme` leaves the computed colors of last-move, dests, check, and
   all four mark brushes byte-identical.
7. **Brush distinguishability, per theme** — the four `MARK_BRUSHES` colors plus the
   lighting-blue overlay: pairwise ΔE\*ab ≥ 20 in every shipped theme; the test iterates
   themes × the 10 pairs.
8. **No remount on switch** — extend A9's browser guard: capture the board element identity,
   switch theme / board theme / piece set / mode mid-run, assert the same element instance
   and zero chessground re-instantiations, and the position unchanged.
9. **Animation** — unit: `none` ⇒ `animation.enabled === false`; `fast`/`normal` ⇒ 120/250;
   emulated `prefers-reduced-motion: reduce` ⇒ enabled false regardless of stored `normal`.
   Browser: one committed move under `normal` produces a transform transition on the moved
   piece (the D539 lesson — assert post-gesture, on the moving piece, not on config).
10. **The D493 boundary, both directions** — type/unit: `compileAssistance`'s input type
    contains no theme-typed field and the theme store's value type contains no
    `AssistanceConfig` field; grep-test: `theme/` modules import nothing from
    `assistance-preference.ts` beyond the storage seam type, and no `assistance-*` module
    imports from `theme/`.
11. **Licensing manifest** — every skin file ships a row in the RFC's asset table
    (asset → author → license → redistribution basis); a test walks the skin directory and
    fails on any file without a table row; the table's license claims are verified against
    upstream at implementation (first rows: chessground GPL-3.0+, cburnett CC BY-SA 3.0,
    Tokyo Night MIT — each currently `[M]`, flipped to `[V]` with URLs in the implementing
    commit or the asset does not ship).
12. **Chrome constants** — browser: `meta[name=theme-color]` equals the effective palette's
    `paper` value after each theme/mode switch; the manifest carries both mode colors.
13. **Felt quality (owner, holds [[D840]] not this RFC)** — the owner reports moving pieces
    reading as a game, not a diagram, in a real session; recorded as a log entry. Code
    criteria 1–12 gate `implemented`; D5/D840 may trail.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Owner picks the shipped roster from the licensed candidate lists — the second piece set, any additional board theme, and label/value adjustments to the three candidate palettes (Open questions 1–3 resolve here) | OWNER | logged rulings after real sessions, the [[D649]] owner-use gate | |
| D2 | Cosmetic-reward gating — the campaign consumes this catalog **by id** as its evidence-dark payout pool ([[D887]]/[[D893]]); nothing here builds earning | `campaign-core.md` | the campaign cosmetics slice's landing commit | |
| D3 | The design/03 Settings-row amendment naming appearance ([[D978]], law 5) | OWNER | the ruling's landing commit (claude may write it on the ruling) | |
| D4 | Implementation — tokens, catalog, split, pref, sweeps; flips [[D839]]/[[D875]] and records play-composition D3 discharged in the same commit | codex | the implementing commit | |
| D5 | Felt-quality verification — [[D840]]'s flip rides the owner's own session, plus the inherited play-composition OQ3 echo decision made in that pass | OWNER | the play-session log entry | |

## Open questions

1. **Which second piece set (and optional third board theme) ships** — owner pick from the
   licensed candidate list D4 assembles; the floor (≥2/≥2) and license rule are normative,
   the names are not. *(owner-level, non-blocking: v1 lands with cburnett + the first
   license-clean set as `candidate`.)*
2. **In-play picker entry** — Settings-only v1 is normative; the board-menu entry is a
   `candidate` the owner confirms or kills in use. *(owner-level, non-blocking.)*
3. **Does `slow` exist** — floor is 3 levels; lichess ships 4. v1 ships 3; adding `slow` is
   one constant if the owner asks. *(owner-level, non-blocking.)*

## Ledger rows (proposed — renumber at landing; head D976 at drafting, concurrent landings expected)

- **D977 (proposed)** — 🐞 two phantom tokens at HEAD: `var(--surface)`
  (`CheckpointSheet.svelte:228`) and `var(--panel-soft)` (`CompareView.svelte:168`) are used
  but defined nowhere and resolve to nothing; found by the theming derivation; defined by
  §1's contract and kept dead-reference-free by criterion 1's sweep (red at HEAD).
- **D978 (proposed)** — 💡 `design/03` Settings-row amendment owed: the shell table's
  Settings families do not name appearance/theming; owner-tier per law 5, written on the
  ruling this RFC's Discharge D3 records.

## Changelog

- 2026-08-22 — drafted (claude), from `planning/theming/rfc-derivation.md` + the owner's
  reference implementations (`~/frameworks/monorepo` player ThemeManager + webapp theme
  store, `~/frameworks/mistserver` LSP theme registry), encoding the [[D976]] rulings
  (device-default; catalog of known schemes, Tokyo Night first) and superseding the
  dossier's F1/F3 forks accordingly.
