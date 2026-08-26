# Theming

Tabiya treats appearance as three independent axes: application colors, board
colors, and piece artwork. A fourth preference controls piece movement. Changing
one axis never changes or constrains another, and appearance never changes which
assistance or evidence is available.

## Shipped choices

The application-color catalog contains Paper (light), Tokyo Night (light and
dark), and Warm Dark. Device light/dark mode is the default; a browser may pin an
explicit mode. The board catalog contains Brown and Olive. The piece catalog
contains Cburnett and Lichess Mono. Movement is Normal (250 ms), Fast (120 ms),
or None. Reduced-motion device preferences always force None. Settings exposes
that resolved device fact, disables the preference that is not currently in
effect, and states how to regain the choice; it never displays a selectable
speed while silently applying another.

Settings exposes every choice independently and applies it immediately. A small
Appearance link in the board region opens that section without adding another
in-run settings system. Inherited palettes disclose measured color pairs below
Tabiya's own accessibility floor rather than silently editing upstream colors.

## Preference and resolution

The global browser preference is stored at `tabiya.theme` as plain validated
JSON. It deliberately has no schema version. Each field is validated
independently, so one stale or unknown id falls back without discarding the other
valid choices. Storage events apply changes made in another tab. With no explicit
mode override, changes to `prefers-color-scheme` re-resolve the palette live.

`ThemeController` is the single runtime authority. It resolves the active theme,
sets `data-app-theme`, `data-mode`, `data-board-theme`, and `data-piece-set`, and
applies the complete palette as root custom properties. It also keeps the HTML
`color-scheme` and browser `theme-color` metadata current. Theme changes update
the existing Chessground instance; they never remount the board or alter its
position.

## CSS and asset boundaries

The palette contract is the twelve-token vocabulary in `theme/tokens.ts`.
Application components consume those tokens; a permanent sweep covers both
Svelte and CSS sources and rejects phantom tokens, retired surface aliases,
hex/rgb/hsl literals, named colors, and CSS system colors. Its literal
authorities are enumerated rather than directory-wide: palette defaults,
registered board and piece artwork, forced-colors paint, and the separately
tracked interaction-paint contract. Ordinary rendering does not inherit
`Canvas` or `CanvasText` from the operating system.

Board CSS is split into two layers:

- `board-skins/` paints only light and dark squares;
- `interaction-paint.css` paints destinations, selection, last move, premove,
  check, and other interaction state exactly once for every board skin.

Critical states do not depend on hue alone. Last move and check retain inset-ring
geometry in ordinary palettes. In forced-colors mode the browser-facing layer
replaces gradients with distinct solid, dotted, dashed, and double system-color
outlines for destinations, captures, premoves, history, selection, and check.
The occupied-destination capture ring is part of the same measured contrast
population as ordinary destinations.

Piece skins are similarly independent. `theme/assets.ts` is the exhaustive
artwork and redistribution manifest. Adding a board or piece file without a
matching manifest row fails the test suite.

Chessground performs movement interpolation in JavaScript. Responsive layout
repair refreshes its cached board bounds only after the selected movement
duration; an immediate `redrawAll()` would cancel the tween. Pointer selection
still refreshes bounds after its synchronous layout change so the next gesture
uses the visible board position.

## Verification contract

The permanent tests cover catalog totality and cross-product selection, device
and stored-mode resolution, reduced motion, palette contrast, exact inherited
palette bytes, source-derived board-square colors, evidence-paint color
separation, asset registration, token and literal sweeps, assistance/theme type
and import separation, live cross-tab
application, stable board identity and position, real post-gesture movement
interpolation, mode-aware browser chrome, and real forced-color projection from
a Chessground destination. Shared CSS also honors device color scheme before
controller startup, suppresses CSS motion under reduced motion, and strengthens
controls and focus under increased contrast.

The remaining acceptance item is deliberately subjective: the owner must report
in normal use that movement reads as a game rather than a diagram. That discharge
holds the animation defect row, not the implemented theming foundation.
