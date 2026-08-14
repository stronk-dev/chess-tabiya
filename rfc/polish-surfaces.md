# RFC: Polish surfaces — real settings, responsive/PWA transformation, and the assistance form slices

- **Status:** draft
- **Author:** claude (drafted on the owner's breadth program)
- **Created:** 2026-08-14
- **Design refs:** `design/03-product-breadth.md` B1/B8 rows and §Stable application shell; `design/05-in-run-experience.md` §3-forms, §3a, §3a-i; `design/BACKLOG.md` rows "Assistance form matrix" (line 231) and "Board lighting ladder" (line 232)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + exploration gate opened by owner ruling 2026-08-12 (`rfc/README.md`)
- **Depends on:** `rfc/archive/app-shell.md` (shell, viewport model, capability registry), `rfc/archive/adaptive-guidance.md` (AssistanceConfig, voice seam), `rfc/archive/structural-reading.md` (B9 observations), `rfc/archive/adoption-wave-1.md` (spoken preference v3, external voice wire), `rfc/archive/onramp-guard.md` (guard grounds), `rfc/archive/learner-identity-and-authorization.md` (account surface)
- **Parent / amends:** follow-up to `archive/app-shell.md` and `archive/adaptive-guidance.md`
- **Supersedes / superseded by:** —
- **Planning:** `planning/polish-surfaces/` (once implementing)

**Wave claim (three-draft wave, 2026-08-14 second — claim #1 of 3, before
`orphan-completion` and `grounding-pair`).** This RFC claims **no migration
number, no pack-schema version, and no run-schema version**: every persisted
shape is untouched (`STORAGE_VERSION` stays 17, `apps/server/src/storage.ts:387`;
pack 0.15 / run 0.12, `packages/schema/src/index.ts:1-2`). The only versioned
artifact it changes is the browser-local `AssistanceConfig`, version 3 → 4,
which lives in `localStorage` and is not a registered shared resource. Sibling
drafts may therefore claim migration 18+ and pack 0.16+ without waiting on this
one; the ownership pin this draft does take is **the `/settings` route body and
the `AssistanceConfig` type** — siblings adding preferences negotiate here.

## Summary

Close the last two named breadth residuals — B1's "`/settings` remains
display-only" and B8's "PWA transformation, settings controls"
(`design/03-product-breadth.md:281,288`) — and land the open form slices of the
`design/05` §3-forms matrix: the board-lighting dial, sight arrows and halos,
ambient presence, and TTS provider configuration over the shipped voice seam.
Everything here is form and surface over machinery that already ships; no new
evidence source, no persisted-shape change, no new chess claim.

## Motivation

The breadth gate B1–B11 is green except for residuals that are all
presentation: `/settings` renders provider information but controls nothing
(`apps/web/src/App.svelte:800-812`), the shell is desktop-only by declared
boundary ("full responsive/mobile and PWA behavior is deferred",
`docs/app-shell.md:207`), and the §3-forms matrix has three 💡 rows with their
machinery already shipped (`design/05-in-run-experience.md:129-141`). The
governing rule for every slice is the form-matrix acceptance rule
(`design/05-in-run-experience.md:148-151`): **render the same content as a
sentence; if the sentence would be refused, so is the overlay.**

Out of scope, explicitly: blunder-only pre-commit lighting (invariant-review
material per the BACKLOG row — it lands as a fourth dial level behind that
review or not at all); hardware-board integration (watch note); offline write of
any kind (§4); native mobile apps; any new evidence source or detector; the B4
residuals (Syzygy runtime rendering, evidence-bound LLM rendering — those are a
grounding concern, not a form concern, and belong to the sibling drafts' scope
if anywhere).

## Specification

### 1. `/settings` becomes real controls

The route keeps its place in the shell (`g s`, `docs/app-shell.md:162`) and
gains three sections. The page is same-origin, session-authenticated, and

renders inside the existing `shell-view` scroller (`apps/web/src/App.svelte:855`).

#### 1a. Assistance editor — sources and forms per context

`/settings` renders one editor per session kind — `pack`, `position`,
`imported` (`RunSessionKind`, surfaced at `apps/web/src/lib/api.ts:79`) — over
the existing preference storage (`loadAssistance`/`saveAssistance`,
`apps/web/src/lib/assistance-preference.ts:10-14`; key
`tabiya.assistance.v1.${kind}`, line 4). The editor writes the same records the
in-run "Assistance" popover writes (`apps/web/src/lib/DrillScreen.svelte:621-636`);
neither surface is renamed or removed.

`AssistanceConfig` (`packages/runtime/src/assistance.ts:3-11`) widens from
version 3 to **version 4**, adding the three form keys:

```ts
export interface AssistanceConfig {
  readonly version: 4;
  readonly markers: "off" | "live";
  readonly guided: "off" | "live";
  readonly humanSplit: "off" | "on_request";
  readonly corpus: "off" | "on_request";
  readonly voice: "authored" | "persona";
  readonly spoken: "off" | "browser" | "provider";   // was "off" | "on"
  readonly boardLighting: "off" | "legal" | "sight" | "evidence";
  readonly arrows: "off" | "sight" | "evidence";
  readonly ambient: "off" | "on";
}
```

`SILENT_ASSISTANCE` (`assistance.ts:13-15`) becomes `{ version: 4, markers:
"off", guided: "off", humanSplit: "off", corpus: "off", voice: "authored",
spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }`.
`boardLighting` defaults to `legal`, not `off`, because legal-destination dots
are shipped board mechanics (`showDests: true`,
`apps/web/src/lib/Chessboard.svelte:54`) and the BACKLOG row itself names legal
"already standard board behaviour"; silence (`05` §3a) governs assistance
*content*, and legal dests state no content. `off` exists for learners who want
a bare board (`movable.showDests: false` and no `lastMove`/`check` highlight
beyond check itself).

Local migration in `validV3`'s successor (`assistance-preference.ts:5-12`):
v3 records upgrade with `spoken: "on"` → `"browser"`, plus `boardLighting:
"legal"`, `arrows: "off"`, `ambient: "off"`; v1/v2 chains extend the same way.
The storage key is unchanged (it names the record family, not its version).
Because preferences are per-browser and never synced
(`docs/adaptive-guidance.md:48-50`), there is no cross-device migration: each
browser upgrades its own record on first read, and the migration is a pure
function of the record, so repeated loads are idempotent. The reverse direction
is also honest: a stale cached pre-v4 client reading a v4 record fails its
`validV3` check and falls back to `SILENT_ASSISTANCE` (the shipped
unknown-version behavior, `assistance-preference.ts:12`) — a silent reset to
defaults on that browser, never corruption; if that old client then saves a v3
record, the next v4 client re-migrates it.

`permittedAssistance` (`assistance.ts:24-27`) widens its return with the two
leveled keys as **caps**, not booleans: `boardLighting` and `arrows` report the
maximum permitted level — `"evidence"` when `(role === "solo" || role ===
"host") && deliveryOpen` (the existing human-split predicate, line 25), else
`"sight"`. The effective level is the weaker of preference and cap. `ambient`
and `spoken` are `"free"` always. This is honesty, not security: `legal` and
`sight` are client projections of the position the viewer already holds (the
same reasoning that keeps markers client-enforced,
`docs/adaptive-guidance.md:53-54`), and `evidence` renders only evidence the
client has already been given (§3), so no new server withholding seam exists to
pretend at. The settings page states that preferences are per-browser
`localStorage`, not account state — exactly what `docs/adaptive-guidance.md:48-50`
already documents.

#### 1b. Engine and provider status, honestly displayed

The existing provider list stays and grows to the full capability surface the
server already reports (`Capabilities`, `apps/server/src/capabilities.ts:59-70`):
provider identities (`opponent`/`judge`/`llm`/`corpus`, lines 48-53, plus `tts`
from §5), healthy engine identities, runnable policy modes, the run-schema
version, and the strong-engine profile. Rules preserved verbatim: mock never
claims Maia/Stockfish and an unhealthy supervisor's provider becomes `none`
(`docs/app-shell.md:108-113`); `planned` is a client annotation over
`unavailable-here`, never a server state (`PLANNED_SURFACES`,
`apps/web/src/lib/api.ts:227` — currently empty, so today nothing is annotated).
No control on this section *changes* deployment configuration: providers are
environment-owned (no operator account, `design/02-product-shape.md:71-73`),
and the page says so rather than rendering disabled knobs.

#### 1c. Account and session management

The account controls that exist only as top-bar actions move to a settings
section (the top-bar sign-out link remains): current handle, sign out
(`apps/web/src/lib/ShellFrame.svelte:87`, `App.svelte:368`), and delete account
with in-page password re-entry replacing the `window.prompt` at
`App.svelte:375-378`, keeping the exact contract of
`docs/identity-and-authorization.md`: deletion reassigns runs to `__legacy`
rather than deleting shared artifacts, and the confirmation text says so. The
section states the documented limits as facts: no password recovery, no device
list, no global sign-out, sessions expire after 30 days
(`docs/identity-and-authorization.md:10,77-79`). No new auth route is added.

### 2. Responsive transformation — the region model as tabs and sheets

`design/03-product-breadth.md:270-272` rules the transformation: "Phone/PWA may
transform these regions into tabs/sheets, but the information model remains the
same." The shell's viewport contract is unchanged — one `100dvh` viewport,
overflow owned by named inner regions (`docs/app-shell.md:127-138`).

Below a **compact breakpoint of 720px viewport width** (CSS `@media (max-width:
719px)`, matching the existing "narrower widths" stacking note,
`docs/app-shell.md:141-143`):

- **Shell navigation** collapses to a menu button in the top bar exposing the
  same eight primary destinations; routes, chords (where a keyboard exists),
  and the not-found view are unchanged.
- **The drill screen** renders its five regions (`design/05` §2) as a tab strip
  under the board: **Board+objective** (always visible — the board never leaves
  the viewport), then tabs **Timeline**, **Branches**, **Evidence**, **Session**
  (session tab only when a live session or non-solo role exists). The active
  tab owns vertical overflow; the board square is sized by
  `min(viewport width, remaining height)` exactly as the fitted grid already
  does (`docs/app-shell.md:140-143`). Checkpoint, terminal, and story surfaces
  — already sheets by construction — render as bottom sheets at this width.
- **Compare** renders its board pair stacked with the difference list as a tab.
- **The `/live` simul wall** (`docs/app-shell.md:24`) keeps its one-request
  polling contract (`docs/live-sessions.md:91-93`) and stacks its board
  summaries single-column inside the shell scroller; a board card is an entry
  point, and opening it lands on the drill screen, which transforms per the
  drill rule above. The session detail view's member/proposal/vote panels
  scroll as ordinary shell-view content; the chrome-free `/live/overlay/:runId`
  is already a single-region projection and does not transform.
- Touch has no keyboard; the keyboard dispatcher simply never receives events.
  No touch-only gestures are introduced — every action stays a visible control.

Region names are the information model, not component names (`design/05` §7);
this section fixes behavior per width, not a component tree.

### 3. The form slices

All four slices obey the matrix rule: **honesty attaches to the source, timing
to disclosure, form to neither** (`design/05-in-run-experience.md:122-127`).
Each overlay is a rendering of content that already renders (or could render)
as a sentence in the rail; the overlay is refused exactly when the sentence is.

#### 3a. The lighting dial — `boardLighting: off | legal | sight | evidence`

Rendered with chessground's shipped drawing surface
(`apps/web/src/lib/Chessboard.svelte:6`; `drawable.autoShapes` for
circles/arrows, `highlight` config at line 49). `Chessboard` gains an optional
`overlays` prop — a list of `{ square, brush } | { from, to, brush }` shapes
plus one **scope sentence** per shape group; it draws them and does nothing
else. The dial levels:

- **`off`** — bare board: no destination dots, no last-move highlight.
- **`legal`** — the shipped default: destination dots and last-move/check
  highlight, exactly today's behavior (`Chessboard.svelte:49-54`).
- **`sight`** — rung-0 sight on demand: selecting a piece or square lights the
  squares of the B9 structural observations that involve it
  (`StructuralObservation.squares`, `packages/runtime/src/structure.ts:69-80`,
  already computed client-side per displayed node at
  `apps/web/src/lib/DrillScreen.svelte:263`) and draws vacation/unblock arrows
  (`VacationReading.unblocks[].slider → gains`, `structure.ts:108-112`). Every
  lit group carries its scope sentence — the byte-identical output of
  `renderStructuralObservation` (`apps/web/src/lib/structural-sentences.ts:7-33`)
  shown as the overlay's caption — so the "while the current pawn files remain"
  scoping (`structural-sentences.ts:15-21`) travels with the light, per the
  rung-0 scope corrections (`design/05:71`). A square with no observation
  lights nothing; absence is stated by the caption area, never simulated.
- **`evidence`** — quality coloring **only where disclosure already permits**:
  recorded, already-revealed evaluations during comparison and deep analysis,
  guard grounds after the guard fires (`DrillScreen.svelte:648-665`), revealed
  checkpoint evidence, and post-`outcome.reached` review — the disclosure
  boundaries of `design/05` §3a-i, checked through the same
  `feedbackDeliveryOpen`/withheld state the client already holds
  (`packages/runtime/src/feedback.ts:22`; `DrillScreen.svelte:4`;
  `run-state.ts:42`). The disclosure source is traceable per context, and each
  is already unified under the same two functions: a **pack drill** discloses
  by its policy's recorded events (`checkpoint.reached` / `segment.completed` /
  `outcome.reached` / `feedback.revealed`, `feedback.ts:3-19`); **Just Play**
  and every other position session run `attempt_end`, whose delivery window
  opens on reveal or outcome and closes on the next committed move
  (`feedback.ts:22-29`; position sessions are `attempt_end` by construction,
  `docs/branch-runtime.md:64`); a **paused match** is that same window — the
  pause's staged-evidence delivery window is `attempt_end` delivery, and "the
  next live commit closes the staged-evidence delivery window again"
  (`docs/live-sessions.md:48-53`), so resuming extinguishes the coloring with
  no new rule. A read-only follower whose evidence is withheld
  (`run-state.ts:42`) lights nothing. The dial colors squares/moves **from
  evidence bytes the client already received**; it never requests fresh
  evaluation, so a mid-decision position with nothing disclosed renders as
  `sight` plus the honest note that no disclosed evidence exists here. Fresh
  engine verdicts mid-decision are the named ADR-0006 collision and do not
  ship at any dial position.

#### 3b. Arrows and halos — `arrows: off | sight | evidence`

The same rule, split out because arrows carry the move-shaped danger: **sight
arrows** (what a piece unblocks, where a line runs — `line_blockers` endpoints,
vacation `gains`) are rung-0 facts and render whenever the config allows;
**move arrows** (a disclosed best move, a recorded human-split candidate mass)
are verdicts and render only under `evidence` within the same disclosure
boundaries as 3a. A halo is a circle brush on an origin square — same content
rule, no separate key. No arrow ever renders without its scope sentence
available one interaction away (the caption or its rail row).

#### 3c. Ambient presence — `ambient: off | on`

The Dr. Wolf steal, form without content (`design/05:141`): a small persona
figure in the drill top bar whose idle/attentive states are driven only by
already-rendered state — `busy` ("Thinking…"), read-only/withheld, guard-fired
(`DrillScreen.svelte:611-618,642-665`). It emits **no sentences of its own**:
its only text is the existing status line, and activating it opens the
assistance rail. Because it says nothing, it is permitted under §3a silence and
requires no permission entry beyond `"free"`. Off by default.

#### 3d. TTS provider configuration over the shipped voice seam

The browser `SpeechSynthesis` path ships and stays the default spoken form
(`DrillScreen.svelte:303-306,565`; preference contract
`docs/adoption-wave-1.md` §Voice and spoken delivery). This slice adds the
**provider** option, configured exactly like the voice provider seam
(`apps/server/src/main.ts:21-32,56-61`):

- Environment: `TABIYA_TTS_PROVIDER=external_http` with
  `TABIYA_TTS_PROVIDER_URL` (required), `TABIYA_TTS_PROVIDER_KEY` (optional),
  `TABIYA_TTS_PROVIDER_TIMEOUT_MS` (positive safe integer, defaulted); any
  other provider value throws at boot, mirroring `main.ts:22-23`.
- Capability: `CapabilityProviders` (`capabilities.ts:48-53`) gains
  `tts: "none" | "external"`; the client shows the spoken-source choice only
  when `external`.
- Endpoint: `POST /runs/:id/speech` (the runs action grammar,
  `apps/server/src/rest.ts:522`) with `{ nodeId, scope }`. **Packet-bound by
  construction:** the server first produces the exact text the voice path
  would return — deterministic sentences, or provider prose that passed
  `voiceCheck` (`packages/runtime/src/voice.ts:33-41`;
  `rest.ts:1063-1075`) — and sends *only that text* to the TTS provider, which
  returns audio bytes streamed back with their content type. The wire pin of
  the voice provider holds here verbatim: no learner, run, session, client, or
  raw-position identifier is ever in the outbound body
  (`docs/adoption-wave-1.md:63-64`) — the TTS request carries the checked
  sentences and nothing else. Audio is ephemeral: never persisted, never
  evidence, never a run event.
- Absence: no provider configured → typed `TTS_UNAVAILABLE` joining the 503
  family at `rest.ts:450` (`errors.ts:10`), and the client's `spoken:
  "provider"` option is not offered — **provider-absent = text**, the correct
  thing to lose first (`design/05:295-299`). Disclosure is inherited: speech is
  synthesized only from surfaces the learner explicitly opened, exactly as
  browser speech is today (`docs/adaptive-guidance.md:128-130`).

### 4. PWA — manifest and installability, no offline write

- `apps/web/public/manifest.webmanifest`: `name`/`short_name` Tabiya,
  `display: "standalone"`, `start_url: "/"`, theme/background colors from the
  shipped palette (`App.svelte:828-844`), maskable icons generated into the
  build. Linked from `apps/web/index.html` (which today is a minimal
  twelve-line skeleton with a viewport meta and no manifest link) and served by
  the existing static directory (`main.ts:47`).
- **No offline write, and no service worker in v1.** The identity argument
  excludes exactly offline *write*, no more: every mutation checks session →
  grant → role → learner lease → device writer id in order
  (`docs/identity-and-authorization.md:23-27`); the writer lease is a
  transactional current-holder witness (`:39`); an offline write queue would
  fabricate that witness and replay stale leases — it is structurally a second
  writer under the hosted multi-user ruling
  (`design/02-product-shape.md:50-53`). A **read-only** app-shell cache
  violates none of that and stays compatible with the ruling; it is excluded
  from this RFC as scope, not refused on principle — deliberately not built
  here so there is no half-fresh cache to present a stale simulacrum of a run,
  and it remains the permitted ceiling for a later RFC. Until then offline is
  **honestly absent**: an installed app with no network shows the browser's
  offline state.
- Installability requires manifest + HTTPS only on current Chromium; TLS is
  already the production posture (`docs/identity-and-authorization.md:81-83`).

### 5. Documentation

`docs/app-shell.md` (settings, responsive sections, boundary removal),
`docs/adaptive-guidance.md` (AssistanceConfig v4, forms, TTS seam), and the
B1/B8 rows plus the two BACKLOG rows update in the implementing change, per the
canonical-docs rule.

## Deviations from design

- `boardLighting` defaults to `legal`, not `off`, where §3a's blanket default
  is silence. Rationale in §1a: legal dests are shipped board *mechanics* with
  no assistance content, and the BACKLOG lighting row itself calls legal
  "standard board behaviour". `off` remains available.
- The BACKLOG form-matrix row lists forms generically; this RFC fixes `arrows`
  as a separate key from `boardLighting` so a learner can light squares without
  move-shaped arrows. Same matrix, one more dial.
- None otherwise; the responsive model implements `design/03:270-272` as
  written, and offline-write absence implements the `design/02` ruling.

## Acceptance criteria

Baselines verified on this draft's day: vitest **458 tests / 77 files** green;
pack schema **0.15** / run schema **0.12** (`packages/schema/src/index.ts:1-2`);
`STORAGE_VERSION` **17** (`apps/server/src/storage.ts:387`). All must be
unchanged-or-grown, never renumbered, by this RFC.

1. **Viewport-transformation browser test** (new `tests/browser/responsive.spec.ts`,
   same server fixture as `playwright.config.ts`): at 390x844, every shell
   route passes the existing viewport-ownership assertion
   (`document.scrollingElement.scrollHeight <= clientHeight + 1`, the pattern
   at `tests/browser/drill.spec.ts:805-857`); on a run, the board fits the
   viewport, the region tabs render, and switching to Timeline/Branches shows
   that region without the board leaving the viewport; `GET /manifest.webmanifest`
   returns 200 and `index.html` links it. Desktop projections (1280x720,
   1440x900) stay byte-for-byte on the existing assertions.
2. **Sentence-equivalence asserted for one overlay** (browser test): with
   `boardLighting: "sight"`, selecting the square of a known `pawn_safe_square`
   fixture position lights exactly the observation's `squares` and shows the
   byte-identical `renderStructuralObservation` sentence as its caption; with
   `boardLighting: "evidence"` **before** any disclosure, no quality coloring
   renders and the honest-absence note shows — the overlay is refused exactly
   where the evidence sentence row is refused.
3. **Settings controls**: browser test edits the `position`-context lighting
   dial on `/settings`, reloads, and the drill honors it; vitest covers v1/v2/v3
   → v4 preference migration (including `spoken "on" → "browser"`),
   `permittedAssistance` caps (`evidence` only for solo/host with delivery
   open), and the settings save/load round trip.
4. **Provider honesty**: capabilities tests extend for `tts` (`none` in every
   mock default; `external` only when configured); `/settings` never renders a
   control for environment-owned deployment configuration; disabled controls
   keep the `HonestControl` reason convention and the existing DOM sweep stays
   green.
5. **TTS seam**: unit tests prove `POST /runs/:id/speech` with no provider
   returns typed `TTS_UNAVAILABLE` (503); with a stub provider, the bytes sent
   to the provider are exactly the checked text (deterministic fallback
   included) and the response is not persisted anywhere.
6. **No-offline honesty**: the built client registers no service worker
   (asserted in the responsive spec via `navigator.serviceWorker.getRegistrations()`
   returning empty); no write path acquires a lease without the server
   transaction.
7. Full suite green: all 458+ vitest tests, existing `drill.spec.ts`,
   `match.spec.ts`, `maia-latency.spec.ts` unmodified and passing.

## Open questions

None.

## Changelog

- 2026-08-14: created; wave claim #1 registered in `rfc/README.md` (no
  migration/pack/run version claimed).
- 2026-08-14 (adversarial review, fixed in place): corrected the two BACKLOG
  row numbers (231/232) and the `index.html` description (twelve-line skeleton,
  not six); §1a now states the stale-client forward path for v4 records
  (`validV3` rejection → `SILENT_ASSISTANCE`, idempotent re-migration); §2
  gains the `/live` simul wall and overlay transformation rule; §3a's
  `evidence` level now traces its disclosure source per context (pack policy
  events / `attempt_end` window / paused-match staged window,
  `docs/live-sessions.md:48-53`); §3d pins the adoption-wave-1 no-identifier
  wire rule onto the TTS request; §4 states explicitly that the identity
  argument excludes only offline write and that the read-only cache is a scope
  exclusion, not a refusal.
