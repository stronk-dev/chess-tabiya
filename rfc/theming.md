# RFC: Theming — three axes, schemes inherited whole

- **Status:** awaiting D1 — implementation complete 2026-08-23; criteria 1–13 are green and D4 is discharged. **D3 discharged 2026-08-23**: the owner-tier Settings intent amendment is written into `design/03-product-breadth.md` by claude under that row's own "claude may write it on the ruling" clause ([[D976]]/[[D982]]), owner-vetoable in place. The remaining holds are both owner-tier and neither is unfinished implementation: **D1**, the roster pick from the licensed candidate lists (second piece set, any additional board theme, the `--warning` repair variant, the olive-square repair), and **D5**, the felt-quality pass that rides the owner's own session ([[D840]]'s flip). Accepted 2026-08-22 by claude after three author/review passes; the full acceptance history remains in the changelog and RFC index.
- **Author:** claude (drafted from `planning/theming/rfc-derivation.md`, restructured on [[D982]] after two cross-review passes — see the changelog)
- **Created:** 2026-08-22
- **Design refs:** `design/03-product-breadth.md` shell table (Settings row — amendment owed, Deviation 1); `design/05-in-run-experience.md` §3a (assistance silence is untouched by any theme); ledger rows [[D839]] (the commission), [[D840]] (the animation defect), [[D875]] (the measured floor), [[D976]]/[[D977]]/[[D982]] (the three owner rulings this RFC encodes)
- **Exploration gate:** owner override 2026-08-12 (`planning/exploration/gates.md:191`) + the direct owner commission ([[D839]], [[D976]]) + `rfc/play-composition.md:674` Discharge D3 assigning this lane to claude. Licensing derivation: `planning/theming/rfc-derivation.md` §0.
- **Depends on:** `rfc/play-composition.md` (accepted, implementing — the composition token discipline A10 and the stable-board-instance guard A9 this RFC extends); `rfc/intent-presets.md` (accepted — the [[D493]] boundary is pinned against it, both directions)
- **Parent / amends:** —
- **Supersedes / superseded by:** —
- **Planning:** `planning/theming/`

```tabiya-claims
none
```

## Summary

The app ships one hard-coded light palette, one board, one piece set, and no animation
preference. Three owner rulings fix the shape. [[D976]]: the default **follows the device**
with a manual override, and the identity is **a catalog of known color schemes** — Tokyo Night
named as the favorite. [[D977]]: **no version machinery** on the preference and **no license
ceremony** on a palette. [[D982]], which returned the first draft and governs this one:

> *"what 'panel'? how hard is it to apply a theme??? how can there be overlapping colors are
> there two color schemes? Like have app theme, board theme, pieces theme. done."*

So this RFC specifies **three orthogonal axes** — `appTheme`, `boardTheme`, `pieceSet` — each
selectable alone, each with its own catalog, with no cross-axis composition rules; and an app
theme is **a complete scheme, applied**, not a token map Tabiya composes. Every color a scheme
paints comes from that scheme, **its own backgrounds included**. The token contract is
therefore not a Tabiya invention to be authored per theme: it is **the vocabulary real schemes
already carry** (§2), read out of the owner's own registry, so adding a scheme is a copy, not a
design exercise. The load-bearing engineering — splitting board *skin* from interaction/evidence
*paint*, which are fused in one CSS file today — is what makes the board axis a real axis rather
than a swap that silently repaints evidence. Claims nothing versioned.

## Motivation

[[D839]] (owner, verbatim): *"theming is a product need, not polish: dark theme first-class (the
owner dislikes light websites), board and piece-set choices, and the visual identity generally."*

**Why the first draft was returned, because it is the whole design rationale.** That draft
defined a 17-token contract of Tabiya's own devising — including two background levels,
`--paper` and `--panel` — and then filled it by taking a known scheme's *foreground* colors and
pairing them with *Tabiya's* surfaces. Two color schemes mixed in one screen. The visible
symptom was a WCAG question that had to be escalated to the owner: Tokyo Night's red measured
2.68:1 against our `panel` but 3.01:1 against our `paper`, so *which of our surfaces should
their red sit on?* The owner's answer was that the question should not exist. It exists only
because we composed. **Tokyo Night's authors already chose which of Tokyo Night's backgrounds
its red sits on.** Inherit the scheme whole and there is nothing to arbitrate.

The same blur produced a second, sharper failure, caught only in this restructure: the previous
cross-review changed `tokyo-night` light's accent-text from `#ffffff` to `#0d0e14` on the
explicit reasoning that *"`on-accent` is Tabiya's own token, so this does not touch D976's
verbatim rule."* **That reasoning was false.** The scheme carries `accentTextColor: '#ffffff'`
(`~/frameworks/mistserver/lsp/modules/core/themes.js`, `id: 'tokyo-night'`, light palette) — it
is upstream's own value, and editing it violated the verbatim rule while the reviewer believed
the opposite. A composed contract cannot tell you whose value you are holding; an inherited one
can only ever hold theirs. The value is restored (§3.2) and the near-miss is recorded (row C).

**Counts, pinned at `fbf3fc8`** (`planning/theming/rfc-derivation.md` §2's derivation commit),
each recomputed in cross-review; drift since is stated because it argues for criterion 2. **No
dark-mode handling exists** — exactly one `color-scheme: light` declaration (`App.svelte:931` at
`fbf3fc8`, `:936` at HEAD); the token layer is nine color tokens + one shadow in a single
`:global(:root)` block (`App.svelte:930-943`); styling lives in 20 per-component Svelte
`<style>` blocks (`DrillScreen.svelte` alone 437 CSS lines); **306 `var(--…)` usages** against 27
color-literal occurrences, **17 of them strays** outside the token layer (5 hex + 12 `rgb()`).
**Drift**: `RatingScreen.svelte`/`CohortStanding.svelte` landed in the interim, taking the tree
to 330 `var()` uses, 22 style blocks, and **20 strays — three new color literals
(`RatingScreen.svelte:133-135`) in four days**, exactly the leak criterion 2 exists to stop. Two
**phantom tokens** — `var(--surface)` (`CheckpointSheet.svelte:228`) and `var(--panel-soft)`
(`CompareView.svelte:168`) — are used but defined nowhere and resolve to nothing (still true at
HEAD). Three light-paper constants live outside Svelte (`index.html:6` `theme-color`,
`manifest.webmanifest` theme/background). The board is themed by three imported CSS files, and
`chessground.brown.css` fuses square color with **all CSS-painted interaction and evidence
paint** (last-move, dests, selected, premove, check). Arrow/mark **brush** colors are NOT in that
file: they are chessground's JS `drawable.brushes` defaults
(`#15781B`/`#882020`/`#003088`/`#e68f00`), which the app never configures — a `config()` seam
(§6), not a CSS extraction.

**Out of scope:** hue/brightness sliders and free color config ([[D875]]: lichess's sliders are
*"a decade of accretion — ceiling, not floor"*), 3D boards, background images, per-context
themes, zen mode, and cosmetic-reward **gating** — the campaign consumes these catalogs by id as
its reward pool ([[D887]]/[[D893]]); earning is `campaign-core.md`'s lane
(`planning/campaign/rfc-derivation.md:497` records the split). Nothing here touches assistance
semantics, evidence eligibility, or any versioned resource.

## Specification

### §1. Three axes — the [[D982]] shape

```ts
// apps/web/src/lib/theme/axes.ts (new)
export interface ThemeSelection {
  appTheme:   AppThemeId;    // the color scheme: surfaces, text, accent, status
  boardTheme: BoardThemeId;  // squares + coordinates ONLY
  pieceSet:   PieceSetId;    // the 12 piece glyphs ONLY
}
```

Three catalogs, three ids, **no cross-axis composition rules and no cross-axis defaults**. Any
`appTheme` × any `boardTheme` × any `pieceSet` is a legal, shippable combination; picking one
axis never constrains, overrides, or silently re-picks another. This is the ruling's substance
and it is enforced mechanically by **criterion 13**: changing one axis leaves the other two
axes' computed values byte-identical.

Two consequences, both deletions from the returned draft:

- **Board colors leave the app theme.** The draft's `--board-light`/`--board-dark` tokens lived
  in the app-theme map "so a UI theme may pin its matching board default". That is a cross-axis
  composition rule and it is deleted. Square colors belong to the board axis (§6), full stop. A
  scheme that wants a matching board is expressed by the owner picking both — one click each,
  which is the point of having axes.
- **Interaction/evidence paint belongs to neither skin axis.** It is driven by app-theme tokens
  and rendered once for all board themes (§6), which is what keeps a board swap from repainting
  evidence.

The fourth stored value, `animation` (§8), is a **motion preference, not an axis** — it has no
catalog and no theme carries it.

### §2. The app-theme contract — the scheme's own vocabulary

**The contract is not designed here; it is read off what known schemes actually carry.** The
owner's registry (`~/frameworks/mistserver/lsp/modules/core/themes.js`, 10 schemes, verified
2026-08-22) supplies, for each mode: three background levels, two text levels, an accent with
its own text color and hover fill, a border color, a red, an orange/changed, and a shadow. That
is the vocabulary. Tabiya's CSS custom-property names are kept (so **330 existing `var()` uses
migrate by definition, not by edit** — with one re-definition, `--shadow`, called out below) and
mapped onto it 1:1:

| Tabiya token | scheme key | uses at HEAD |
|---|---|---|
| `--paper` | `backgroundColor` | 18 |
| `--panel` | `secondaryBackgroundColor` | 43 |
| `--surface` | `tertiaryBackgroundColor` | 1 *(phantom today — defined for the first time)* |
| `--ink` | `textColor` | 12 |
| `--muted` | `secondaryTextColor` | 54 |
| `--line` | `border-color` | 65 |
| `--accent` | `accentColor` | 45 |
| `--on-accent` | `accentTextColor` | 0 *(new; the scheme has always carried it)* |
| `--accent-soft` | `hover-bg` | 0 *(new)* |
| `--warning` | `changedColor` | 16 |
| `--danger` | `red` | 3 |
| `--shadow-color` | `shadowColor` | 7 *(via `--shadow`; see the geometry bullet below)* |

```ts
// apps/web/src/lib/theme/tokens.ts (new)
export const THEME_TOKENS = Object.freeze([
  "paper", "panel", "surface", "ink", "muted", "line",
  "accent", "on-accent", "accent-soft", "warning", "danger", "shadow-color",
] as const);
export type ThemeToken = (typeof THEME_TOKENS)[number];
export type Palette = Readonly<Record<ThemeToken, string>>;

// Not scheme keys: computed once from the active palette (or app chrome), never authored
// per theme. Criterion 1 admits these alongside THEME_TOKENS.
export const DERIVED_TOKENS = Object.freeze([
  "shadow", "scrim", "scrim-strong", "display-font",
] as const);
```

**Twelve tokens, down from the returned draft's seventeen, and every one is a key a scheme
already ships.** Authoring a new scheme is a transcription, not a design exercise — which is
the ruling's *"how hard is it to apply a theme??? done."* Three specific retirements:

- **`--paper-soft` (7 uses) and `--panel-soft` (1 use) are retired.** They were a second and
  third *Tabiya* background level layered on top of `--paper`/`--panel`, i.e. five
  surface tokens against a scheme's three. The implementing pass migrates their 8 call sites
  onto `--panel` or `--surface` per site; criterion 1's sweep fails on any survivor.
- **`--board-light`/`--board-dark` move to the board axis** (§1, §6).
- **`--scrim`/`--scrim-strong` are derived once, never authored.** Modal scrims are
  `color-mix(in srgb, var(--ink) 55%, transparent)`-family values computed from the active
  palette in one place. The rule (from [[D982]]): *a value the app needs that no scheme
  provides is a mapping decision stated once, not a per-theme authoring burden.* Same for
  `--display-font`, which is app chrome and not a color-scheme concern at all — it leaves the
  theme contract entirely. Both live in `DERIVED_TOKENS`, which criterion 1 admits: evicting a
  token from the *palette* must not evict it from the *sweep*, or the sweep is red forever
  (23 `var(--display-font)` uses at HEAD — the [[D984]] class, caught in verification).
- **`--shadow` is one scheme color plus geometry derived once.** All 7 call sites are
  `box-shadow: var(--shadow)` **shorthand** consumers (`App.svelte:970,974`,
  `DrillScreen.svelte:1400,1434,1478,1643`, `PackList.svelte:105`) while `shadowColor` is a bare
  color (`rgba(0,0,0,0.4)`), so a literal 1:1 substitution emits invalid CSS. The scheme key is
  therefore `--shadow-color`, and `--shadow: 0 0.8rem 2.5rem var(--shadow-color)` is derived once
  under the `--scrim` rule. The 7 call sites keep their spelling; **this is the one place where
  the "migrate by definition, not by edit" claim is a re-definition rather than a no-op.**

A palette is **total by type** — `Record<ThemeToken, string>` makes a missing token a compile
error — and criterion 3 re-asserts totality at runtime over the shipped catalog, because a type
can be defeated by `as` and a test cannot. Totality is what kills the phantom-token class
(row A): a `var()` reference outside `THEME_TOKENS` fails criterion 1; a palette missing a
token fails criterion 3.

**Application** (the owner's `ThemeManager` mechanism): `data-app-theme="<id>"` +
`data-mode="dark|light"` on `document.documentElement`, values applied as custom properties on
`:root`. Switching is **attribute + property changes only** — never a component remount
(criterion 8 extends play-composition A9's stable-board guard to all three axes).

**Migration:** the stray literals (17 at `fbf3fc8`, **20 at HEAD**) are replaced by tokens in
the implementing pass; the implementer recounts at the landing commit rather than trusting
either number. The three non-Svelte constants become mode-aware (§4; criterion 12).

### §3. The app-theme catalog

#### §3.1 The registry shape (inherited, not reinvented)

Read for this RFC from the owner's own repos, per [[D976]]:

- `~/frameworks/mistserver/lsp/modules/core/themes.js` — **the registry shape this RFC adopts**:
  `{id, label, icon, modes: ['dark','light'], palettes: {dark: {...}, light: {...}}}`, 10
  schemes, per-mode hex palettes, and single-mode entries (`dracula` is `modes: ['dark']`) which
  is why `modes` is an array rather than a boolean.
- `~/frameworks/monorepo/npm_player/…/ThemeManager.ts` — 14 JS-map presets (each a full 19-key
  token map) + 3 CSS-only presets; `applyTheme(root, preset)` sets `data-theme` + custom
  properties; `getAvailableThemes()`/`getThemeDisplayName()` drive the picker.
- `~/frameworks/monorepo/website_application/src/lib/stores/theme.svelte.ts` — localStorage
  `{themeId, mode}` with validation-on-load and a first-visit `matchMedia` fallback: the
  persistence pattern §5 adopts.

```ts
export interface AppThemeDef {
  id: AppThemeId;
  label: string;
  modes: ReadonlyArray<"dark" | "light">;
  palettes: Partial<Record<"dark" | "light", Palette>>;  // a key per declared mode — criterion 3
  origin: "tabiya" | "inherited";   // NORMATIVE — see §3.3
  after?: string;                   // OPTIONAL courtesy credit, display prose only.
                                    // Never a license obligation, never a criterion ([[D977]]).
}
```

#### §3.2 The v1 catalog (unit: catalog entries; total: 3 themes / 4 palettes)

> **[[D1425]] 2026-08-23 — this line is an undeclared cut and the catalog is owed the ruled set.**
> §3.1 counts **ten** schemes in the owner's own registries and adopts their shape as the evidence
> base for the 12-token contract; this line then ships three, of which `origin` records **one** as
> `inherited` and three palettes as `tabiya`. [[D976]] ruled for *"a CATALOG of known color schemes,
> not one bespoke palette"*. Unlike the board and piece axes, the app-theme axis carries no floor
> citation and no growth path — see [[D1426]] for why no instrument caught it.

1. **`paper`** — `origin: "tabiya"`, light. The shipped warm-paper identity, values
   byte-identical to `App.svelte:930-943` (`--ink #171713`, `--paper #eeeade`,
   `--panel #f8f5ec`, `--line #cbc4b4`, `--accent #3858c8`, `--danger #ad3c32`; the block is
   `:930-943` at `fbf3fc8` and `:936-947` at HEAD, all six values re-verified byte-equal at
   both) **except the two
   tokens [[D983]] requires repairing** (§3.4). It is Tabiya's own work and is therefore gated by
   criterion 5a.
2. **`tokyo-night`** — `origin: "inherited"`, dark + light. The owner's named favorite,
   **transcribed whole** from the registry above, backgrounds included:
   - dark: `paper #1a1b26`, `panel #1f2335`, `surface #15161e`, `ink #c0caf5`, `muted #a9b1d6`,
     `line #414868`, `accent #7aa2f7`, `on-accent #1a1b26`, `accent-soft #292e42`,
     `warning #e0af68`, `danger #f7768e`, `shadow-color rgba(0,0,0,0.4)`.
   - light: `paper #e1e2e7`, `panel #d5d6db`, `surface #c8c9ce`, `ink #3b4261`, `muted #4e5772`,
     `line #b4b5b9`, `accent #2e7de9`, **`on-accent #ffffff`**, `accent-soft #c8c9ce`,
     `warning #8c6c3e`, `danger #f52a65`, `shadow-color rgba(0,0,0,0.12)`.

   **`on-accent #ffffff` is restored to upstream's value.** The previous cross-review changed it
   to `#0d0e14` believing `on-accent` was a Tabiya token; the scheme carries
   `accentTextColor: '#ffffff'`, so that edit violated [[D976]]'s verbatim rule (Motivation;
   row C). Every value above is now a transcription with no Tabiya judgement in it, which is
   exactly what makes §3.3's policy honest. Picker prose: *"after folke/tokyonight.nvim"* —
   courtesy only; **no license criterion attaches to a palette** ([[D977]]).
3. **`warm-dark`** — `origin: "tabiya"`, dark. The FullDark canvas candidate, committed here as
   its durable record (the artboard is uncommitted scratchpad; dossier §5): `paper #16140f`,
   `panel #1e1b15`, `surface #2a2720`, `ink #e8e4d8`, `muted #97917f`, `accent #8fa4e8`,
   `warning #df9d32`. Demonstrates [[D839]]'s *"not an inversion"*: temperature carried, accent
   re-picked. Its `line`, `on-accent`, `accent-soft` and `danger` are unpinned here —
   implementation picks within the family, forced to exist by criterion 3 and constrained by
   criterion 5a (e.g. `on-accent` must be dark: white on `#8fa4e8` is 2.43:1). **This is a
   Tabiya theme, so it is gated**, and the matching olive board it was designed against is a
   *board-axis* entry (§6), not part of this palette.

Labels and any Tabiya-authored value adjustments ship `validation: "candidate"` behind the
owner-use gate ([[D906]](3)/[[D649]]). The catalog ids and the mechanism are normative now.

#### §3.3 The contrast policy — the honest consequence of inheriting whole

This is the section that replaces the returned draft's escalation to the owner.

- **`origin: "tabiya"` palettes are GATED.** `paper` and `warm-dark` are our work; they must
  meet WCAG AA (criterion 5a) and a failure blocks the landing.
- **`origin: "inherited"` palettes are MEASURED AND PUBLISHED, not gated.** A criterion that
  could only be satisfied by editing an inherited scheme would contradict [[D976]]'s verbatim
  rule; a criterion nothing can pass without breaking a ruling is the [[D984]] class. So
  criterion 5b **computes and records** every ratio for inherited schemes, and the picker
  surfaces any pair below AA on the entry itself. The learner opts into a known scheme with its
  known characteristics; we neither silently "fix" it nor silently hide it.
- **The default members are Tabiya's.** `MODE_DEFAULT` (§4) never resolves to an inherited
  scheme, so a user who expresses no preference always gets a gated palette. Choosing Tokyo
  Night is a deliberate act.

**Measured, 2026-08-22 — every number recomputed in this restructure** (WCAG 2.1 formula pinned
in criterion 5; ratios on opaque values):

| palette | origin | worst text pair | worst non-text pair | disposition |
|---|---|---|---|---|
| `tokyo-night` dark | inherited | `on-accent`/`accent` 6.79 | `danger`/`panel` 5.88 | clean anyway |
| `tokyo-night` light | inherited | **`on-accent`/`accent` 4.02** | **`danger`/`panel` 2.68**, `accent`/`panel` 2.77 | **published as upstream's own** (§3.3) |
| `paper` | tabiya | **`muted`/`paper` 4.42** → repaired | **`warning`/`paper` 1.94** → repaired | gated; §3.4 |
| `warm-dark` | tabiya | `muted`/`panel` 5.46 | `accent`/`panel` 7.07 | gated; unpinned tokens forced by criterion 3 |

*"Worst" is the minimum over **criterion 5a's enumerated pairs only** — `ink`/`paper`,
`ink`/`panel`, `muted`/`paper`, `muted`/`panel`, `on-accent`/`accent` for text; `accent`,
`warning`, `danger` against the worse of `paper`/`panel` for non-text. `surface`-backed pairs and
`line` are outside that set by construction (§2, criterion 5a), and `warm-dark`'s `on-accent`/
`danger` are unpinned in §3.2, so its row is the minimum over what exists. The two dark rows were
**corrected in verification 2026-08-22**: the restructure had recorded `muted`/`panel` 7.37 and
`accent`/`panel` 6.18 for `tokyo-night` dark, but `on-accent`/`accent` 6.79 and `danger`/`panel`
5.88 are lower; and `warm-dark`'s cited 7.37 is its `warning`/`panel` (its `warning`/`paper` is
7.89), while `accent`/`panel` 7.07 is the actual non-text minimum. No disposition changes.*

Note what the ruling bought: `tokyo-night` light's three sub-AA pairs are now *upstream's own
foreground on upstream's own background*, so they are a property of the scheme the owner asked
for by name — a fact to report, not a decision to escalate. Under the returned draft's composed
contract the identical numbers were an unanswerable question about whose surface to use.

#### §3.4 [[D983]] — the shipped light theme fails WCAG AA today, and this RFC fixes it

Independent of theming, found only because this lane was the first pass to compute the numbers:
`--warning #df9d32` on `--paper` is **1.94:1** while being rendered as small-text `color:` in
eight places (`CheckpointSheet.svelte:208`, `DrillScreen.svelte:1232,1308`,
`TerminalSheet.svelte:107`, `ShellFrame.svelte:180`, `Timeline.svelte:191`,
`CohortStanding.svelte:149`, `PackList.svelte:116`); `--muted #6f6b61` on `--paper` is
**4.42:1**. `paper` is `origin: "tabiya"`, so §3.3 gates it and **this RFC ships both repairs**:

- `--muted` → **`#6d6960`** (4.55 / 5.02 on paper/panel). ΔE\*ab **1.0** from the shipped value —
  below the just-noticeable threshold, so criterion 4(b)'s visual baseline survives in substance.
  Shipped unconditionally.
- `--warning` → **`#8e6116`** (4.51 / 4.98). ΔE\*ab **29.5** — genuinely owner-visible, so it is
  `candidate` under Discharge D1. The structural alternative is criterion 5c (status tokens
  stop being small-text colors), after which **`#b57b1c`** at the 3:1 non-text floor suffices;
  the implementer may land either, and says which in the commit.

Criterion 4(b)'s byte-identity is narrowed **by name** to these two tokens — enumerated, not
open-ended.

### §4. Mode resolution — the [[D976]] default

```
effectiveMode  = pref.modeOverride ?? (matchMedia("(prefers-color-scheme: dark)") ? "dark" : "light")
effectiveTheme = pref.appTheme  if catalog[pref.appTheme].modes includes effectiveMode
                 else MODE_DEFAULT[effectiveMode]
MODE_DEFAULT   = { light: "paper", dark: "warm-dark" }     // both origin: "tabiya" — §3.3
```

- **Follow the device, live**: with no stored override the `matchMedia` listener re-resolves on
  OS theme change without reload (criterion 4d).
- **Manual override wins** and persists (§5); *"Follow device"* is the picker's first entry.
- A theme lacking the effective mode falls back to that mode's default member rather than
  rendering a half-defined palette (criterion 3 makes half-defined unrepresentable anyway; this
  covers the *selection* seam — e.g. `warm-dark` selected, device flips to light).
- `meta[name=theme-color]` updates to the effective palette's `paper` on every resolution; the
  manifest carries both mode colors at build (criterion 12).

### §5. Persistence — `tabiya.theme`, and the not-assistance boundary

One **global** key — the appearance follows the person, not the workflow context, so
deliberately NOT the per-context `tabiya.assistance.v1.*` / `tabiya.workflow.v1.*` grammars:

```ts
// key: "tabiya.theme"
// value: { appTheme, boardTheme, pieceSet, modeOverride, animation }
// each field validated independently on load against its own closed catalog; an unknown or
// malformed field falls to that field's default without discarding the rest of the value.
// Same PreferenceStorage seam (assistance-preference.ts:16) so it unit-tests without a browser.
```

**Divergence from the versioned precedent, stated once** ([[D977]], owner): a preference whose
every field is a member of a closed catalog cannot have a migration problem worth machinery —
**validation IS the migration strategy**, because an id that stopped existing is precisely the
case validate-on-load already handles. This follows the owner's own `theme.svelte.ts`, not the
versioned assistance grammar, whose value is a nine-field config that genuinely does change
meaning.

**The [[D493]] boundary, pinned in both directions**: no theme value is an input to the
assistance compiler, and no compiled assistance output selects or alters a theme.
`AssistanceConfig` gains no field (verified: `packages/runtime/src/assistance.ts:4` is nine
fields + `version`, none appearance- or motion-typed); the theme store imports nothing from
`assistance-preference.ts` beyond the `PreferenceStorage` type. Criterion 10 enforces both
directions mechanically. A theme changes **how** disclosed things look — never whether, where,
or which.

**Symbol honesty** ([[D985]]): `compileAssistance` is declared at `rfc/intent-presets.md:218`
but has **zero occurrences in `apps/` or `packages/` at HEAD** — it is blocked by [[D971]], and
intent-presets' own status line says so. Criterion 10 is therefore written against mechanisms
that exist today, with the compiler arm carried by **Discharge D6** so it cannot complete
invisibly under a renamed symbol.

### §6. The board axis — the skin/paint split

**The mechanical fact** (re-verified against the imported `@lichess-org/chessground@10.1.1`,
`Chessboard.svelte:2-4`): `chessground.brown.css` carries square colors AND all CSS-painted
interaction/evidence paint — last-move `rgba(155,199,0,.41)`, selected and dest dots
`rgba(20,85,30,.5)`, premove `rgba(20,30,85,.5)`, check radial — in 64 lines, with the dark
square inside a base64 SVG (black at 0.2 over `#f0d9b5`, i.e. `#c0ae91`). **A naive board swap
silently swaps evidence paint**, which is why the board is only an *axis* once this is split:

- **`board-skin` files** — one per board theme, containing ONLY `cg-board` background + the
  dark-square SVG (or a flat pair) + coordinate colors. v1 ships **`brown`** (the current,
  extracted unchanged) and **`olive`** (the warm-dark artboard's pair). Selected by
  `data-board-theme` on the board wrapper. **Square colors live here and only here** — they are
  not app-theme tokens (§1).
- **`piece-skin` files** — §7.
- **`interaction-paint.css`** — ONE shared file, app-theme-token-driven, carrying last-move,
  selected, dests, premove and check paint for **all** board themes. Brush colors are not in it:
  they are set once through `config().drawable.brushes`. Evidence rules over both:
  - The four `MARK_BRUSHES` (`green|red|blue|yellow`, `packages/runtime/src/types.ts:52`) are
    **identities in stored data**: every theme maps each to a color, the four-way distinction
    must survive every theme (criterion 7a), and no theme may add, drop, or collapse a brush.
  - **The board-lighting overlay is not a fifth identity.** `DrillScreen.svelte:374` emits it as
    `brush: "blue"` into `drawable.autoShapes`, so it renders in the blue brush's color *by
    construction* and no color rule can separate the two. Giving selection-sight its own hue
    means a new brush id, which `MARK_BRUSHES`'s closedness forbids — named and declined (Open
    question 4), not papered over with a contrast floor. *(This is [[D984]]'s first instance:
    the returned draft demanded ΔE ≥ 20 between the blue brush and an overlay that **is** the
    blue brush — 0.0, unsatisfiable by identity.)*
  - Dests and last-move are [[D493]]-ruled (rules floor / run history): themes recolor them,
    never remove or conditionally render them. Every paint must clear ΔE\*ab ≥ 20 **against the
    square it is painted on**, in every board theme (criterion 7b).
  - `--warning`/`--danger` never collapse into one hue (criterion 7c).
  - Board-lighting overlays stay gated by assistance state exclusively; the paint file styles
    them, nothing in it conditions them.

All variants are bundled (skin files are ~3 KB each; no dynamic import in v1), so switching any
axis is attribute-only and criterion 8's no-remount guard holds.

### §7. The piece axis

A catalog of sets, each a `piece-skin` file of 12 data-URI selectors, selected by
`data-piece-set`. v1 ships **`cburnett`** (current — Colin M.L. Burnett, CC BY-SA 3.0
`[M — criterion 11 verifies]`) plus **one** additional set from lila's catalog whose per-asset
license is CC0/CC-BY/GPL-compatible; the specific set is the owner's pick from the licensed
candidate list (Open question 1). The RFC pins the **count** (≥2, the [[D875]] floor) and the
license rule, not the name.

**Criterion 11 covers artwork only** ([[D977]]): piece glyphs and board SVGs are real
copyrightable work with genuinely mixed per-asset licenses in lila's catalog — which is why this
arm survives while the palette arm does not. **No `AppThemeDef` participates in it.**

### §8. The animation preference — [[D840]]'s residue

Play-composition A9 removed the *defeat* (the `{#key}` remount — zero matches at HEAD, board
stable, chessground's default tween now runs). This RFC ships the *preference* and the
verification the row still owes:

- **`animation: "none" | "fast" | "normal"`** in `tabiya.theme`; default `normal`. Wiring:
  `config()` in `Chessboard.svelte` gains
  `animation: { enabled: pref !== "none", duration: {fast: 120, normal: 250}[pref] }` — the
  normative v1 constants (lichess ships 4 levels; the floor is 3; whether `slow` exists is Open
  question 3).
- **`prefers-reduced-motion: reduce` forces `none`** regardless of the stored value (criterion 9).
- **`redrawAfterLayout` innocence check**: with the remount gone, verify at implementation that
  the post-`set()` redraw (`Chessboard.svelte:176,282`) does not truncate the tween; if it does,
  gate it on layout-affecting changes only. Recorded in the implementing commit either way.
- **Felt-quality verification is the owner's** (Discharge D5): [[D840]] stays 🐞 until the owner
  has seen pieces glide in a real session — the row flips on that log entry, not on green tests.
  Play-composition Open Question 3 (the post-commit on-board echo) is inherited here and
  deliberately deferred to the same pass: a static echo without verified animation reads as
  noise.

### §9. Surfaces

- **Settings** gains an Appearance section with **three independent pickers** (app theme + mode
  override, board theme, piece set) plus animation. Each picker lists `label`, the optional
  `after` courtesy line, and — for `origin: "inherited"` entries — any measured sub-AA pair
  (§3.3). Applies live. The design/03 Settings-row amendment naming appearance is owner-tier
  (Deviation 1, row B).
- **In-play entry**: v1 ships Settings-only; a lightweight in-play entry (the lichess board-menu
  pattern the [[D875]] study measured) is a `candidate` behind the owner-use gate (Open question
  2) — one link from the board region to the Settings section is the v1 floor.

### §10. Sweeps and lifecycle

The implementing commit: flips **[[D839]]** (catalogs shipped), **[[D983]]** (the WCAG repairs),
adopts **[[D875]]**'s floor row as implemented, records **play-composition Discharge D3**
discharged in that RFC's table, and appends the log entry. **[[D840]]** flips only after the
owner's felt pass (D5) and may trail the code landing.

## Deviations from design

1. `design/03-product-breadth.md:294`'s Settings row does not name appearance/theming; this RFC
   needs it to. Law 5: amended by the owner or claude-on-ruling — proposed as row B, not edited
   here.
2. None otherwise; design/05's assistance invariants are consumed, not modified.

## Acceptance criteria

1. **Token totality sweep** — a test enumerates every `var(--x)` under `apps/web/src` and
   asserts `x ∈ THEME_TOKENS ∪ DERIVED_TOKENS ∪ dimensional-tokens` (the derived set is §2's
   four: `shadow`, `scrim`, `scrim-strong`, `display-font` — without it the sweep is red forever
   on 23 `var(--display-font)` uses, which is the [[D984]] class); **red at HEAD** on `--surface`
   (`CheckpointSheet.svelte:228`) and `--panel-soft` (`CompareView.svelte:168`), and red on
   every surviving `--paper-soft`/`--panel-soft` reference after the §2 retirement. The sweep is
   the criterion; its first green is the fix's evidence.
2. **Stray-literal ceiling** — the same sweep counts color literals (hex/rgb/hsl) outside
   `theme/` definitions; allowlist enumerated in the test (SVG data URIs inside skin files
   exempt). Ceiling at landing: **0** outside the allowlist. Fails when any new literal lands
   anywhere in `apps/web/src`, not only composition styles (closes A10's new-code-only gap).
3. **Catalog totality** — for every `AppThemeDef`, for every declared mode, every `ThemeToken`
   has a non-empty value (runtime re-assertion of the type; kills `as`-cast half-palettes).
4. **Mode resolution** — browser assertions: (a) no stored pref + emulated dark ⇒ `warm-dark`;
   (b) no stored pref + emulated light ⇒ `paper`, **computed styles byte-identical to the
   pre-RFC light baseline except `--muted` and `--warning`**, which the test pins by name with
   their §3.4 values — the exception is enumerated, not open-ended; (c) stored override beats
   device; (d) OS-change event re-resolves without reload when no override is stored;
   **(e) the invariant, not the ids** — for every mode, `catalog[MODE_DEFAULT[mode]].origin ===
   "tabiya"` and `MODE_DEFAULT[mode]` declares that mode. (a)/(b) pin today's literal ids and so
   would catch a promoted inherited default only incidentally; (e) is what makes §3.3's
   *"`MODE_DEFAULT` never resolves to an inherited scheme"* a mechanism rather than prose.
5. **Contrast.** Formula pinned: **WCAG 2.1 relative luminance** (sRGB linearized `c/12.92`
   below 0.04045 else `((c+0.055)/1.055)^2.4`; `L = 0.2126R + 0.7152G + 0.0722B`; ratio
   `(L₁+0.05)/(L₂+0.05)`), computed on **opaque token values**. Three arms, split by `origin`
   per §3.3:
   - **5a — GATED, `origin: "tabiya"` only.** Text pairs at 4.5:1 (`ink`/`paper`, `ink`/`panel`,
     `muted`/`paper`, `muted`/`panel`, `on-accent`/`accent`) and non-text UI at 3:1 (`accent`,
     `warning`, `danger` against the worse of `paper`/`panel`). A failure blocks the landing.
     `line` is a **decorative separator, deliberately excluded** — WCAG 1.4.11 exempts purely
     decorative rules, and no shipped palette's `line` reaches 3:1 (against the worse of
     `paper`/`panel`: `paper` 1.44, `tokyo-night` dark 1.74, `tokyo-night` light **1.41**;
     `warm-dark`'s `line` is unpinned in §3.2 and therefore uncomputable here); listing it would
     make the criterion red forever for no accessibility gain. *(Verification 2026-08-22
     corrected two of these: `tokyo-night` light was recorded as 1.96 — no background gives that
     value; its `line` `#b4b5b9` is 1.58 on `paper` and 1.41 on `panel` — and `warm-dark` was
     recorded as 1.34 for a token this RFC never pins. The conclusion is unchanged: still none
     reaches 3:1.)*
   - **5b — MEASURED AND PUBLISHED, `origin: "inherited"`.** The same pairs are computed and
     asserted **equal to a committed measurements table**; the test fails if a number changes
     without the table changing, never because upstream's own value is low. The picker renders
     any sub-AA pair on the entry. **Two shapes the table must have, or it does not catch the
     row-C class it exists for** (tightened in verification 2026-08-22): the committed table
     enumerates **every** 5a pair for every inherited palette and mode, not the worst-pair
     summary §3.3 prints for humans; **and** each inherited palette's twelve values are asserted
     **byte-identical to §3.2's transcription**. Ratios alone under-catch — a silent edit to
     `ink`, `surface`, `line`, `accent-soft` or `shadow-color` moves no worst-pair number at all,
     and row C's actual near-miss was an edit to `on-accent`, i.e. a *value*, not a *ratio*.
   - **5c — status tokens are not body-text colors**: a lint forbids `color: var(--warning)` and
     `color: var(--danger)` on text below 18.66px/700; status is carried by border or fill plus
     `--ink`. The eight `color: var(--warning)` sites in §3.4 are the repair list.
6. **Skin/paint split** — lint: board-skin files contain zero interaction-paint selectors
   (`last-move|selected|move-dest|check|premove` pinned in the test); browser: switching
   `data-board-theme` leaves the computed colors of last-move, dests, check and all four mark
   brushes byte-identical.
7. **Evidence separation, per theme.** Formula pinned: **CIE76 ΔE\*ab** — Euclidean distance in
   CIELAB, sRGB → linear → XYZ → Lab under **D65**; alpha-bearing paint is **composited over the
   square it sits on before conversion**; opaque values converted directly.
   - **7a — brush pairwise, ≥ 20**: the four `MARK_BRUSHES` in every shipped theme — **6 pairs,
     not 10** (§6: the "lighting overlay" is the blue brush; [[D984]]). Chessground's untouched
     defaults already pass: green/red 91.3, green/blue 118.3, green/yellow 80.9, red/blue 82.2,
     red/yellow 61.1, blue/yellow 132.2.
   - **7b — evidence paint against its own square, ≥ 20.** The population includes occupied
     move destinations (`square.oc.move-dest`) as a separate capture signal; omitting a
     selector from the table is a criterion failure. Measured 2026-08-22 and amended
     2026-08-26 (brown squares
     `#f0d9b5` / `#c0ae91`, the dark decoded from the theme's own base64 SVG; olive `#f0d9a8` /
     `#96a25e`):

     | paint | brown light | brown dark | olive light | olive dark |
     |---|---|---|---|---|
     | last-move `rgba(155,199,0,.41)` | 35.1 | 36.2 | 32.1 | 26.3 |
     | selected + dests `rgba(20,85,30,.5)` | 33.4 | 27.8 | 33.0 | 20.0 |
     | premove `rgba(20,30,85,.5)` | 43.1 | 36.9 | 44.8 | 39.6 |
     | occupied destination `rgba(20,85,0,.55)` | ≥20 | ≥20 | ≥20 | ≥20 |

     The implemented D1 choice lightened the olive dark square to **`#96a25e`**, bringing the
     ordinary destination to the 20.0 floor. The 2026-08-26 capture-ring amendment independently
     raises that signal's alpha to 0.55; the test enumerates all four board-square combinations.
   - **7c — `warning` vs `danger`, ≥ 20**: paper 51.3, tokyo-night dark 53.6, tokyo-night light
     69.7 — all pass; `warm-dark` is uncomputable until its `danger` is pinned, which criterion
     3 forces anyway.
   - **7d — semantics do not depend on hue alone.** Last move and check each carry persistent
     inset-ring geometry in ordinary rendering. Under `forced-colors: active`, gradients and
     fills are removed and destination, occupied destination/capture, premove, last move,
     selection and check each receive a system-colour outline with distinct
     solid/dotted/dashed/double geometry. A browser assertion begins from a real Chessground
     destination and proves the forced-colour projection; a source assertion keeps the complete
     state population closed. This is the 2026-08-26 amendment that closes [[D1494]]: the old
     ΔE-only gate rated a last-move highlight with 1.02:1 luminance as healthy, omitted the
     capture ring, and let check disappear under a tritan simulation.
8. **No remount on any axis switch** — extend A9's browser guard: capture the board element
   identity, switch app theme / board theme / piece set / mode mid-run, assert the same element
   instance, zero chessground re-instantiations, and the position unchanged.
9. **Animation** — unit: `none` ⇒ `enabled === false`; `fast`/`normal` ⇒ 120/250; emulated
   `prefers-reduced-motion: reduce` ⇒ enabled false regardless of stored `normal`. Browser: one
   committed move under `normal` produces a transform transition on the moved piece (the [[D539]]
   lesson — assert post-gesture, on the moving piece, not on config).
10. **The [[D493]] boundary, both directions — three named mechanisms, no prose** ([[D985]]):
    - **(a) Type, runnable today**: an assertion that `AssistanceConfig`
      (`packages/runtime/src/assistance.ts:4`) is exactly its nine fields plus `version`, and
      that the theme preference type shares **no** key with it. Fails the moment either side
      grows a field the other names.
    - **(b) Import lint, runnable today**: `theme/` imports nothing from
      `assistance-preference.ts` beyond the `PreferenceStorage` type, and no `assistance-*` or
      preset module imports from `theme/`. Enumerated import graph, asserted set-equal.
    - **(c) Deferred arm, named not assumed**: when the assistance compiler is built (whatever
      [[D971]]'s amendment names it), its input type joins (a)'s assertion — carried by
      **Discharge D6**.
11. **Artwork licensing manifest — artwork only** ([[D977]]). Every `piece-skin` and
    `board-skin` file ships a row in the RFC's asset table (asset → author → license →
    redistribution basis); a test walks the skin directories and fails on any file without a
    row; license claims are verified against upstream at implementation (first rows: chessground
    GPL-3.0+, cburnett CC BY-SA 3.0 — each `[M]`, flipped to `[V]` with URLs in the implementing
    commit or the asset does not ship). **No palette participates.**
12. **Chrome constants** — browser: `meta[name=theme-color]` equals the effective palette's
    `paper` after each theme/mode switch; the manifest carries both mode colors.
13. **Axis orthogonality — the [[D982]] enforcement.** For each axis: change it and assert the
    other two axes' computed values are **byte-identical**. Concretely — switching `appTheme`
    leaves every square color and piece data-URI unchanged; switching `boardTheme` leaves every
    `THEME_TOKENS` value and every piece glyph unchanged; switching `pieceSet` leaves both.
    Additionally, the full catalog cross-product is asserted **selectable**: no combination is
    refused, defaulted away, or silently re-picked. *A wrong implementation that reintroduces a
    board default inside an app theme — the exact composition rule this RFC deleted — fails
    here and nowhere else.*
14. **Felt quality (owner, holds [[D840]] not this RFC)** — the owner reports moving pieces
    reading as a game, not a diagram, in a real session; recorded as a log entry. Criteria 1–13
    gate `implemented`; D5/D840 may trail.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Owner picks the shipped roster from the licensed candidate lists — the second piece set, any additional board theme, the `--warning` repair variant, and the olive-square repair choice (Open questions 1–3 resolve here) | OWNER | logged rulings after real sessions, the [[D649]] owner-use gate | |
| D2 | Cosmetic-reward gating — the campaign consumes these catalogs **by id** as its evidence-dark payout pool ([[D887]]/[[D893]]); nothing here builds earning | `campaign-core.md` | the campaign cosmetics slice's landing commit | |
| D3 | The design/03 Settings-row amendment naming appearance (row B, law 5) | OWNER | the ruling's landing commit (claude may write it on the ruling) | **DISCHARGED 2026-08-23** — written by claude on the [[D976]]/[[D982]] rulings under the row's own "claude may write it on the ruling" clause, and marked owner-vetoable in place. `design/03-product-breadth.md`'s shell table Settings row now names **appearance**, with the three-axis shape (app theme / board theme / piece set) and the not-assistance boundary stated beneath it |
| D4 | Implementation — tokens, three catalogs, the split, the preference, the sweeps; flips [[D839]]/[[D983]]/[[D875]] and records play-composition D3 discharged in the same commit | codex | the implementing commit | **2026-08-23 — complete; 3 app themes / 2 boards / 2 piece sets, live validated preference, split skin/paint, animation, sweeps, Settings, docs and browser gates** |
| D5 | Felt-quality verification — [[D840]]'s flip rides the owner's own session, plus the inherited play-composition OQ3 echo decision made in that pass | OWNER | the play-session log entry | |
| D6 | Criterion 10(c) — the assistance compiler does not exist at HEAD ([[D985]]); when it lands under whatever name [[D971]]'s amendment gives it, its input type joins criterion 10(a)'s no-shared-key assertion | `intent-presets.md` | the commit that builds the compiler | |

## Open questions

1. **Which second piece set (and optional third board theme) ships** — owner pick from the
   licensed candidate list D4 assembles; the floor (≥2/≥2) and the license rule are normative,
   the names are not. *(owner-level, non-blocking: v1 lands with cburnett + the first
   license-clean set as `candidate`.)*
2. **In-play picker entry** — Settings-only v1 is normative; the board-menu entry is a
   `candidate` the owner confirms or kills in use. *(owner-level, non-blocking.)*
3. **Does `slow` exist** — floor is 3 levels; lichess ships 4. v1 ships 3; adding `slow` is one
   constant if the owner asks. *(owner-level, non-blocking.)*
4. **Selection-sight has no identity of its own** — the board-lighting overlay renders as the
   `blue` mark brush (`DrillScreen.svelte:374`), so a learner's own blue mark and the system's
   structural-sight overlay are the same color in every theme, by construction. Separating them
   needs a new brush id, and `MARK_BRUSHES` is closed in stored data. *(Named and declined for
   v1; reopen if the owner reports confusing the two in a real session — a felt-quality question
   for the D5 pass, not a color-floor question.)*

*(The returned draft's Open question 4 — "which of our surfaces should Tokyo Night's red sit
on?" — is **dissolved by [[D982]]**, not answered: under inherit-whole its red sits on its own
background, and the resulting ratios are §3.3's published property of a scheme the owner chose
by name. No owner ruling is owed.)*

## Ledger rows (landed at acceptance 2026-08-22)

Committed head at drafting is **D985** (`202f7f2`, re-verified at HEAD `6677dbb` in verification
2026-08-22 — max committed id is D985 and `design/BACKLOG.md` is clean). D978/D979 exist nowhere
in the ledger: they are gaps left by the id-block renumbering whose convention
`design/BACKLOG.md:124-133` records, and are **not** backfilled. Rows below are written as
**D986–D988**, landed at acceptance 2026-08-22 (head was D985; D978/D979 stay unbackfilled — gaps from codex's renumbering).

- **D986 (landed 2026-08-22)** — 🐞 two phantom tokens at HEAD: `var(--surface)`
  (`CheckpointSheet.svelte:228`) and `var(--panel-soft)` (`CompareView.svelte:168`) are used but
  defined nowhere and resolve to nothing. Found by the theming derivation, re-verified at HEAD
  twice. §2 defines `--surface` by *mapping it to the scheme's third background level* and
  retires `--panel-soft` entirely; criterion 1's sweep keeps the class dead.
- **D987 (landed 2026-08-22)** — 💡 `design/03` Settings-row amendment owed: the shell table's Settings
  families (`design/03-product-breadth.md:294`: *"opponent/rating, feedback/evidence,
  engines/models, LLM, data, accessibility"*) do not name appearance/theming; owner-tier per
  law 5, written on the ruling Discharge D3 records.
- **D988 (landed 2026-08-22, new in this restructure)** — 🐞 **a composed token contract let a reviewer
  edit an inherited value while believing it was ours.** The 2026-08-22 cross-review changed
  `tokyo-night` light's `on-accent` from `#ffffff` to `#0d0e14` to satisfy a contrast criterion,
  reasoning explicitly that *"`on-accent` is Tabiya's own token, so this does not touch D976's
  verbatim rule"* — but the scheme carries `accentTextColor: '#ffffff'`, so the edit **violated
  the verbatim ruling in the act of citing it**. Restored in §3.2. The structural fix is
  [[D982]]'s own: `origin: "tabiya" | "inherited"` is a required field, §3.3 gates only our own
  palettes, and **criterion 5b's committed measurements table fails on any silent change to an
  inherited palette**. Sibling of [[D984]] — both are failures that only surface when someone
  computes rather than asserts.

## Changelog

- 2026-08-22 — drafted (claude) from `planning/theming/rfc-derivation.md` + the owner's
  reference implementations, encoding [[D976]] (device-default; catalog of known schemes,
  Tokyo Night first).
- 2026-08-22 — **owner ruling [[D977]] applied**: the version wrapper removed from the
  preference (`tabiya.theme`, `version` dropped, divergence stated once in §5) and the palette
  arm of the license criterion removed (`source` → optional `after` courtesy prose; criterion 11
  narrowed to artwork, where lila's mixed per-asset licenses actually live).
- 2026-08-22 — **cross-review corrections (independent adversarial pass)**, all measured rather
  than asserted: stray count 17 at `fbf3fc8` / 20 at HEAD; the reference `ThemeManager` is 14
  JS-map presets + 3 CSS-only; brush colors are a JS `config()` seam, not in
  `chessground.brown.css`; criterion 5 given a pinned formula and its four measured palettes;
  criterion 7's brush-pair count corrected 10 → 6 (the overlay **is** the blue brush, ΔE 0.0 —
  unsatisfiable by identity, [[D984]]) and 7b added, which the proposed `olive` board fails at
  18.3; criterion 10 rewritten onto three named mechanisms after `compileAssistance` was found
  to have zero occurrences at HEAD ([[D985]], Discharge D6).
- 2026-08-22 — **RESTRUCTURED on owner ruling [[D982]]** (*"have app theme, board theme, pieces
  theme. done."*). The draft composed: it defined a 17-token contract of our own and filled it
  by pairing inherited foregrounds with Tabiya surfaces, which manufactured a WCAG question the
  owner refused to arbitrate. Now: **three orthogonal axes** (§1) enforced by new criterion 13;
  the token contract is **the scheme's own vocabulary** read from the owner's registry — **12
  tokens, all scheme-supplied**, down from 17 authored (§2), retiring `--paper-soft`/
  `--panel-soft` (8 call sites migrate), moving `--board-light`/`--board-dark` to the board axis,
  deriving `--scrim`/`--scrim-strong` once instead of authoring them per theme, and dropping
  `--display-font` from the theme contract entirely; palettes are **transcribed whole,
  backgrounds included** (§3.2); `origin: "tabiya" | "inherited"` becomes a required field and
  **§3.3's contrast policy gates our own palettes while measuring-and-publishing inherited ones**
  — a criterion that could only be met by editing an inherited scheme would contradict [[D976]]
  and is the [[D984]] class. Consequently **the returned draft's Open question 4 is dissolved,
  not answered**. Restored `tokyo-night` light `on-accent` to upstream's `#ffffff` after finding
  the previous pass had edited an inherited value while believing it was ours (row C), and added
  criterion 5b's committed measurements table so that class cannot recur silently. [[D983]]'s
  live WCAG defect is now **fixed by this RFC** rather than deferred, because `paper` is
  `origin: "tabiya"` and §3.3 gates it (§3.4).
- 2026-08-22 — **verification pass 2026-08-22** (independent, restructure-only scope; every
  number recomputed at source). **Confirmed:** all 12 contract keys exist in
  `~/frameworks/mistserver/lsp/modules/core/themes.js` spelled exactly as claimed, and **all 10
  schemes carry all 12** — the contract really is the registry's vocabulary; all **24**
  `tokyo-night` values in §3.2 byte-exact against upstream in both modes, **zero drift**,
  including the restored `on-accent #ffffff`; every OQ4-dissolution number exact (ink
  7.59/6.77/5.94, muted 5.54/4.94, accent 3.11/2.77, red 3.01/2.68, `on-accent`/`accent` 4.02) on
  backgrounds that are genuinely upstream's; both [[D983]] repairs exact (`#6d6960` 4.55/5.02,
  ΔE\*ab 0.97; `#8e6116` 4.51/4.98, ΔE\*ab 29.53; alternative `#b57b1c` 3.00, exactly the 3:1
  floor) with all eight small-text `--warning` call sites present at HEAD and **no ninth**; every
  criterion 7a/7b/7c ΔE reproduced to ±0.05; all twelve §2 use-counts and the 330-`var()` total
  exact; `--paper-soft` 7 uses + 1 definition, `--panel-soft` 1 use + **0** definitions (so it is
  simultaneously a phantom and a retirement — both framings in the RFC are correct); 14 criteria
  contiguous, 6 five-column discharges, 4 open questions, 3 proposed rows, head **D985** with
  D978/D979 absent; `node tools/register-check.mjs` green, `claims: none`. **Corrected:** §3.3's
  two dark worst-pair cells (`tokyo-night` dark → `on-accent`/`accent` 6.79 and `danger`/`panel`
  5.88; `warm-dark` → `muted`/`panel` 5.46 and `accent`/`panel` 7.07), with the pair set the
  minimum is taken over now stated; criterion 5a's `line` figures (`tokyo-night` light 1.96 → the
  measured 1.41, and `warm-dark` 1.34 struck as a number for a token §3.2 never pins) —
  conclusion unchanged; **`--shadow` split into the scheme's `--shadow-color` plus geometry
  derived once**, because all 7 call sites are `box-shadow:` shorthand consumers and a bare
  `shadowColor` would emit invalid CSS; **`DERIVED_TOKENS` added and criterion 1's admitted set
  widened to it**, because the restructure evicted `--display-font` from the palette without
  widening the sweep, leaving 23 uses red forever — the [[D984]] class inside the RFC that names
  it; criterion 4 gains **(e)**, asserting `MODE_DEFAULT`'s members are `origin: "tabiya"` as an
  invariant rather than leaving §3.3's promise resting on pinned ids; criterion 5b tightened to
  an all-pairs table **plus byte-identity of each inherited palette against §3.2**, since ratios
  alone miss a silent edit to `ink`/`surface`/`line`/`accent-soft`/`shadow-color` and row C's
  actual near-miss was a value edit, not a ratio change. §3.3's gate asymmetry was verified as
  honestly implemented and is left as [[D982]]'s forced consequence, the owner's to veto.
- 2026-08-23 (**Discharge D3 discharged, by claude on the rulings**): the `design/03` Settings-row
  appearance amendment is written, under that row's own *"claude may write it on the ruling"*
  clause and marked owner-vetoable in place. The shell table's Settings row now names
  **appearance**, with the three-axis shape (app theme / board theme / piece set), the animation
  preference, and the [[D493]] not-assistance boundary stated beneath it — *a theme changes how
  the product looks, never what it is willing to say*. The awaiting pointer moves **D3 → D1**: the
  remaining holds are the owner's roster pick (second piece set, additional board theme, the
  `--warning` repair variant, the olive-square repair) and D5's felt-quality pass, which rides the
  owner's own session. Neither is unfinished implementation — D4 is discharged and criteria 1–13
  are green.
- 2026-08-26 (**criterion 7 amended after measured accessibility evidence**): 7b's closed
  population now includes the occupied-destination capture ring and its repaired 55% paint; new
  7d requires non-hue geometry for last move and check plus distinct system-colour geometry for
  every board state under forced colors. The implementation adds all four system-preference CSS
  blocks, replaces themed hard-coded white with palette tokens, and proves dark-device startup,
  real Chessground destination projection, forced colors and reduced motion in Chromium. This
  closes the concrete [[D1494]] failures without claiming [[D1461]]'s broader token-driven-paint
  defect or [[D1460]]'s separate owner choice about OS motion override.
