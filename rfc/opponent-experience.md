# RFC: Opponent experience

- **Status:** draft — D1610/D1611 owner inputs and cross-review remain
- **Author:** codex, on the owner's D1566 ruling
- **Created:** 2026-08-26
- **Design refs:** `design/03-product-breadth.md` (Play owns normal games and resistance as the
  branch control variable); `design/05-in-run-experience.md` (stable board, assistance silence,
  fixed stage chrome); `design/00-thesis.md` (refusal of a generic bot ladder)
- **Exploration gate:** `design/research/ux-opponents.md`, owner ruling [[D1566]], and the buildable
  card/route contracts in `design/research/bot-policy-axes-and-card-grounding.md` and
  `design/research/bot-production-route-and-selection-budget.md`
- **Depends on:** amended/accepted `bot-policy.md` and `bot-roster.md` (catalog, exact profile
  identity, grounded card compiler, production route, availability/calibration state);
  `play-composition.md` (fixed identity-bar slot and responsive board invariant)
- **Parent / amends:** learner-facing successor to the opponent portions of `bot-policy.md` and
  `bot-roster.md`; it changes no policy mechanism
- **Supersedes / superseded by:** —
- **Planning:** `planning/opponent-experience/` once accepted

```tabiya-claims
none
```

**Why none.** The only persisted/versioned change is `RunOpponentPolicy.profile` plus the policy
decision record already claimed by `bot-policy.md`/`bot-roster.md` in run-schema lanes 0.18/0.22.
This RFC consumes those fields. Its catalogue route, Svelte components, responsive composition,
client parser, browser tests and docs add no schema, migration, pack/principle/shape version,
evidence kind, assistance version or package-exported closed vocabulary. The server returns ordered
sections with display strings; the browser does not declare a second family enum.

## Summary

Ship one complete opponent outcome in Play:

1. a guided roster picker containing the measured four bands × three behavior families;
2. a grounded card before selection;
3. a fixed, always-visible identity bar during the game;
4. exact-digest resume and same-opponent rematch; and
5. explicit provider/calibration/degraded states.

The three learner surfaces land together. A picker without the card and in-run identity is the
generic bot ladder the thesis refuses and does not count as partial completion.

This RFC does not invent opponent behavior, ratings, personas, observed traits, tournaments or
chess prose. Policy layers and card statements come from the bot contracts. The final twelve
names/art and the first-run default are the two open owner decisions.

## Motivation

The shipped Play starter offers a narrow opponent selector; earlier work upgraded it to four named
Maia rungs plus a separate strong-engine choice, but a learner still chooses a resistance setting,
not an opponent. There is no profile card, no avatar, no persistent persona and no opponent bar.
The only detailed band/provider facts live in assistance/inspector surfaces, although who the
learner is playing is chrome rather than positional help. [V] (`ux-opponents.md` §0)

The roster foundation has the inverse problem: policy declarations, profile digests and measured
layers exist in draft/contract form, but no complete learner journey owns their presentation.
[[D1566]] settles the intended outcome: Play owns the picker, opponent identity is always visible,
the roster is four measured bands × three behavior families, and every profile is one persistent
persona. This RFC makes that ruling implementable without expanding bot policy.

## Scope

### In scope

- Play roster entry, selection and recommendation/default display;
- grounded profile card and explicit limitations;
- strong engine as a separate “sparring wall,” not a persona/rung;
- fixed identity bar in the board stage;
- exact profile identity through start, opponent play, result, resume and rematch;
- provider-off/degraded/calibration state;
- keyboard, screen-reader, 320×568 and post-gesture layout behavior;
- wire parser, route integration, browser journey and canonical docs.

### Out of scope

- composing moves, guards, traits or route proposals (`bot-policy`, `bot-roster`,
  `bot-route-source`);
- absolute human Elo or any new calibration statistic;
- final persona content before D1610;
- observed cross-game traits, per-bot relationship pages and longitudinal records;
- bot tournaments, bot-vs-bot event presentation and campaign boss authoring;
- learner style/player-type classification;
- arbitrary user-authored bots or policy knobs in the ordinary picker;
- visual theme asset production beyond consuming the final D1610 assets.

Those are named downstream lanes, not reasons to ship a partial picker.

## Specification

### 1. Catalogue operation

`GET /opponents` returns one ordered page compiled server-side from the exact bot catalog and live
provider state:

```ts
interface OpponentCataloguePage {
  heading: string;
  explanation: string;
  sections: readonly {
    heading: string;
    explanation: string;
    profiles: readonly OpponentCard[];
  }[];
  recommendedProfileDigest: string | null;
  defaultProfileDigest: string;
  strongEngine: OpponentWallCard;
}

interface OpponentCard {
  profile: { id: string; version: number; digest: string };
  name: string;
  avatarUrl: string;
  band: number;
  bandLabel: string;
  available: boolean;
  unavailableReason: string | null;
  behavior: readonly { id: string; text: string; sourceIds: readonly string[] }[];
  limitations: readonly { id: string; text: string; sourceIds: readonly string[] }[];
  calibration: { text: string; sourceIds: readonly string[] };
}
```

The actual implementation may use generated types, but these semantics are fixed:

- ordering and section labels are server output; the web client carries no duplicate family map;
- every sentence is an output of the grounded card compiler, never free route/UI prose;
- `available` is computed from the exact profile's provider requirements and current capability;
- unavailable cards remain visible with the reason so the roster does not change shape silently;
- recommendation is an annotation, never a hidden choice;
- default is always explicit, returned, selected and printed; and
- no absolute rating field exists without exact-digest calibration authorization.

The client parser is closed over these fields and refuses missing profile identity, duplicate
digests, a default/recommendation absent from the page, missing source ids, or an available card
with an unavailable reason.

### 2. Picker workflow

Play shows an **Opponent** step before starting a normal game.

1. The page opens with the explicit default card selected (D1611).
2. The learner sees the selected persona's face/name, band label, behavior summary, limitations and
   calibration state without opening Advanced settings.
3. “Change opponent” opens the complete roster as three named server-supplied sections, each with
   four band-ordered profiles. Keyboard arrow movement changes focus; Enter/Space selects; Escape
   returns to the selected card. Pointer/touch uses the same selection state.
4. A recommendation, when available from an already-published learner rating, displays
   “Recommended” on one card but does not auto-select it.
5. Strong engine sits after the roster under **Sparring wall**. It has no persona, band or implied
   human scale and explains that it is full-strength engine resistance.
6. Start creates the run with the exact selected `{id, version, digest}`. The response must echo the
   same profile reference before navigation enters the game.

Raw ids such as `human_common`, `guarded-human-1400`, engine option names or source producer ids do
not render in ordinary Play. Advanced/Inspector may expose declared identifiers separately.

### 3. Card contract

The card has three visible zones:

- **Identity:** final D1610 name and art; no chess mechanism claim.
- **What it does:** compiler-owned mechanism/measurement statements.
- **What it does not:** compiler-owned absence, abstention, endgame/clock and calibration scope.

The optional calibration line is part of the third zone until an exact matching receipt exists.
The display identity never supplies the behavior copy. Removing all limitations or source ids is a
contract failure, not a compact-card variant.

The collapsed roster tile may show name, art, band label and one compiler-owned mechanism summary.
Selecting/focusing it reveals the complete card in a bounded detail region. Text growth scrolls or
collapses inside that region and never changes the board or picker layout.

### 4. In-run identity bar

Every profile run renders a fixed-height opponent bar immediately above the board frame. It contains:

- avatar, name and band label;
- one short server-supplied family/mechanism label;
- availability/degraded state when present; and
- an accessible “Opponent details” control opening the same grounded card in the companion region.

The bar is chrome. It ignores AssistanceConfig and remains present in Quiet, Guided, Support,
Analysis, campaign ceilings and provider-off states. Candidate frequencies, engine values and move
advice remain governed by assistance and never enter the bar.

The bar is part of the fixed stage budget defined by `play-composition`: fixed height, no wrapping
growth, ellipsis/accessible full name where necessary, board geometry identical with short/long
names and normal/degraded state. On phone it remains above the board; a details sheet overlays only
the companion region and never covers/resizes the board.

An exact profile change can occur only by creating/entering another run. When a flip/rematch creates
a new run with another profile, the bar updates after the authoritative run response and announces
the change once. It never infers identity from `eloApplied` or the latest catalog entry.

### 5. Resume, rematch and unavailable state

- Resume resolves the exact stored profile id/version/digest. A missing historical declaration is
  a server/catalogue integrity failure; the run remains readable and names the unavailable stored
  identity, but opponent play is disabled.
- A temporarily absent Maia provider disables every roster profile; an absent guard provider
  disables guarded/pawn profiles for new selection. A sporadic in-run guard abstention retains the
  profile identity and displays the typed degraded reason from the decision record—it does not
  rename the opponent baseline.
- Result/Review actions offer **Play {name} again**, creating a new run with the exact profile
  digest and a new seed. The action never resolves “same name” to a newer digest.
- Strong-engine rematch retains the wall mode and does not manufacture a profile reference.

### 6. Recommendation and default

The product always distinguishes:

- **default:** what first use selects and prints;
- **recommendation:** a non-binding suggestion from an existing published learner rating; and
- **last played:** an explicit “again” shortcut, never a silent replacement for the default.

D1611 must choose the first-use default before acceptance. The current Maia/UCI default 1500 is
forbidden because it is not a registered rung. Recommended author input is
`human-baseline-1400`: the measured ladder's reference/middle-lower rung, with no hidden engine
guard. The learner can select any available profile before starting.

### 7. Accessibility and responsive behavior

- The roster is one labelled composite selection control, not twelve unrelated settings toggles.
- Arrow keys traverse cards, Home/End move within the roster, Enter/Space selects, and the selected
  card is announced with name, band, section, availability and calibration state.
- Avatar alt text repeats no information already in the accessible card name; decorative art uses
  empty alt.
- Color is never the sole indicator for recommendation, selection, availability or calibration.
- At 320×568 CSS pixels the selected-card summary, start action and roster opener are reachable
  without horizontal scrolling. Opening the roster/card does not cover or resize the board in an
  active run.
- Focus returns to the invoker after closing details, and provider-state updates do not steal focus.

### 8. Analytics without learner profiling

The experience records product-operation facts only: catalog viewed, profile selected, start
attempted/succeeded/refused, details opened, resume/rematch and availability reason. It records the
exact profile digest and no inferred preference/personality label. These events are operational
receipts, not the longitudinal learner-style store.

## Failure behavior

| failure | learner outcome |
|---|---|
| catalogue unavailable | Play offers the separately supported strong-engine wall only if truly available; otherwise start is disabled with retry |
| Maia unavailable | roster stays visible and unavailable with reason; no silent strong-engine substitution |
| guard unavailable before start | guarded/pawn cards unavailable; baseline cards remain if Maia is ready |
| guard abstains during a game | same opponent identity, visible degraded status, unchanged Maia fallback recorded |
| profile digest missing/mismatched | create/resume refuses; never resolve by id/name alone |
| calibration absent | card says uncalibrated and shows no human-scale number |
| stale recommendation | recommendation omitted; default remains explicit |
| atomic opponent route fails | board state unchanged; bar retains identity; retry uses the same idempotency key |

## Acceptance criteria

1. **One complete outcome.** Picker, full grounded card and in-run identity bar land together. A
   fixture deleting any one fails the experience gate.
2. **Exact 4×3 roster.** Against the accepted catalog, the page contains twelve unique exact
   profile digests in three server-ordered sections and four registered bands, plus the separate
   strong-engine wall. Missing/extra/duplicate profiles fail.
3. **No hidden default.** The selected first-use profile equals the ruled D1611 digest, renders its
   name/band/card, and the create request/run echo match exactly. No code path reads Maia's 1500 UCI
   default as a product choice.
4. **Grounded copy only.** Every behavior/limitation/calibration sentence carries non-empty source
   ids from the compiled card. A raw caller sentence, missing source, profile/source swap or
   client-authored mechanism label fails.
5. **Provider matrix.** Maia-on/guard-on, Maia-on/guard-off, Maia-off/guard-on and both-off fixtures
   prove exact card availability and no substitution. Runtime guard deadline/mixed-domain arms keep
   identity and show degraded status.
6. **Run identity.** Create, opponent move, persisted event, reload/resume, result and rematch retain
   the exact profile id/version/digest. Wrong-digest and missing-historical-profile negatives fail.
7. **No client authority.** Ordinary profile play uses the server-owned atomic opponent operation;
   the browser cannot supply FEN/history/seed/profile to choose a different move. A stale expected
   node and duplicate request id exercise refusal/idempotency.
8. **Chrome, not assistance.** The bar is visible under every named preset/effective ceiling and
   does not render candidate moves, frequencies, evals or advice. Assistance-off cannot hide it;
   assistance-on cannot widen it.
9. **Board invariant.** At all `play-composition` viewports, calm/card-open/degraded/long-name states
   leave board x/y/width/height identical after gesture. No card text is a layout child of the board
   stage.
10. **Accessible control.** Keyboard selection, focus return, announcements, non-color states and
    320×568 reflow pass browser tests; the twelve-card composite does not require twelve Tab stops.
11. **Vocabulary.** Learner-visible Play contains zero raw `human_common`, profile ids, UCI engine
    options or producer ids. Inspector remains allowed to expose declared technical identity.
12. **Strong wall separation.** Strong engine carries no profile/band/persona, cannot be recommended
    as a rung, and creates an unrated wall run through the existing mode.
13. **Recommendation honesty.** A published learner rating may annotate exactly one available card;
    absent/private/stale rating annotates none and never changes selection.
14. **Docs and journeys.** `docs/opponent-experience.md`, app-shell/drill-client links and the release
    journey “choose → inspect → play → resume → rematch” ship with the implementation.
15. **Normal gates.** Relevant package typechecks/unit tests, browser CI and release-journey tests
    pass through standard Make targets; no harness-only command is the acceptance proof.

## Open questions

### O1 — final identities and art (D1610; owner)

Choose the twelve final names and assets before implementation/digest calibration. Placeholder
identities may be used only in disposable prototypes and fixtures, never in a shipping profile.

### O2 — first-run default (D1611; owner)

Recommended: `human-baseline-1400`. It is an actual measured rung, not the accidental 1500 provider
default; it exposes normal Maia behavior without a hidden engine information advantage. The picker
prints the choice and keeps all profiles one action away.

## Deviations from design

None. [[D1566]] explicitly rules that the 4×3 picker is exempt from the generic-ladder refusal only
as a complete opponent outcome. Criterion 1 makes that condition able to fail.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Final twelve names/art selected before any shipping profile digest/calibration | OWNER ([[D1610]]) | exact asset/profile registry | |
| D2 | First-run default ruled and encoded without provider fallback | OWNER ([[D1611]]) | create/browser fixture | |
| D3 | Bot policy/roster production route, cards and availability accepted/implemented | `bot-policy` / `bot-roster` | non-test operation + exact catalog | |
| D4 | Picker/card/bar client outcome, responsive/accessibility matrix and docs | `opponent-experience` | implementation commit | |
| D5 | Owner-use play session on own devices: selection understood, identity remains legible, fallback not misleading | OWNER | dated owner-use receipt | |

## Changelog

- 2026-08-26: drafted from `ux-opponents.md`, [[D1566]], D1608 and the measured route/card repair
  contracts. Kept persona names and the default open; refused a client-authoritative `/select-move`
  profile pass-through; made picker/card/identity one indivisible learner outcome.
