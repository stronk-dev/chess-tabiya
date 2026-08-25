# RFC: evidence-presentation — the component vocabulary between a typed fact and a pixel

- **Status:** draft, amended 2026-08-25 on [[D1564]]/[[D1568]]/[[D1569]] — arrow activation is a 1.0
  obligation, split between existing exact relation operands, a typed relation renderer, and the
  genuinely missing transition/per-family hint-horizon operand retention. It is no longer an owner-held
  optional future producer.
- **Author:** claude (evidence-presentation fork), from `design/research/evidence-presentation.md`
  (R3, 2026-08-20) and the HEAD census recorded as [[D1431]]/[[D1434]]
- **Created:** 2026-08-24
- **Design refs:** `design/05-in-run-experience.md:192-205` (the form inventory — nine forms,
  the layer this RFC sits *beneath*), `:41` (*"Absence is stated, never simulated"*),
  `:206-246` (the O4 amendment: *"Theory-only, honest-empty and source-unavailable are
  first-class states, rendered as themselves rather than as failures"*),
  `design/03-product-breadth.md:323` (B1's true residual — *"quality, not capability:
  unstyled natives, no presets, checkbox-above-label"*), `:326` (B4's standing residual —
  F1/F2 established authority and mechanics, *"not completeness or a learner experience"*),
  `design/00-thesis.md` law 8's named anti-pattern (quoted in §5)
- **Exploration gate:** the owner's direct commission 2026-08-24, opening the app and reporting
  the evidence surfaces are *"very very very poor"*, that *"raw info"* is still dumped, and
  asking *"where are all the nice ux components?"* — read under [[D1310]] as a drafting mandate.
  The measurement arm is complete and landed: [[D1431]] (42 specified affordances, 17 exist,
  8 designed) and [[D1434]] (the concrete dumps). R3's mechanical/desk/real-packet arms are `[V]`
  in the dossier; this RFC is the specification of the layer that dossier's §8 decision 3 named
  and nobody built.
- **Depends on:** `rfc/learner-modules.md` (accepted — the eleven modules, their `forms`,
  `budgets`, `emptyBehavior` and the [[D659]] class rule; **consumed, never re-decided**);
  `rfc/module-registration.md` (draft, concurrent — the eleven module seats and their
  facts/marks/arrows budgets; this RFC's components are what those seats render into, and the
  boundary is pinned in `rfc/README.md`); `rfc/theming.md` (awaiting D1 — the three axes and the
  12-token `THEME_TOKENS` contract every component here consumes)
- **Consumes without re-specifying:** `rfc/intent-presets.md` (accepted — which modules are
  active is a preset question, not a component question); `rfc/hint-distance.md` (the rung
  ladder — a component never widens a rung); `rfc/review-evidence-compiler.md` and
  `rfc/review-map.md` (their outputs are operands here, and this RFC adds no selection)
- **Owner ruling consumed:** [[D1564]] — every promised support option must have the typed
  producer operands it needs; arrows/highlights are activated, not retired or left dark behind
  availability. [[D1568]] records the re-derived split between existing relation evidence and
  genuinely lossy emitters.
- **Parent / amends:** amends nothing. **Repairs in place** the rendering half of
  `rfc/archive/adaptive-guidance.md`, `rfc/archive/n-way-comparison.md` and
  `rfc/archive/runtime-corpus-evidence.md` — each shipped a correct producer and a joined
  string, and each is named with its line in §1.
- **Supersedes / superseded by:** —
- **Planning:** `planning/platform-alignment/evidence-presentation/`

```tabiya-claims
none
```

## Summary

The product has an evidence contract with **20 producers, 126 projections, 25 consumers and 175
bindings** (`design/03-product-breadth.md:326`), and it renders that contract to a learner as
`JSON.stringify`, comma-joined arrays, de-underscored enum ids and a row of identical bullet
characters. The owner is not describing a taste disagreement. He is describing a **missing
layer**: between a typed fact and a pixel there is nothing that knows what shape the fact *is*.

Everything that reaches a screen today goes through one of two shapes — a `string`, or a
`readonly string[]` joined with `" · "`. That is why an opening-explorer distribution, which is a
win/draw/loss table with bars on every other chess site, renders as
`corpus-sentences.ts:9-24`'s sentence list; why a policy distribution renders as
`"Nf3 31% · e4 22%"` (`DrillScreen.svelte:1151`); and why the only chart in the product is
`CompareView.svelte:135`'s `●`-per-datapoint row with the value in a `title` tooltip, which
encodes exactly nothing visually. A repo-wide sweep for `<svg`, `<canvas`, `<meter` or
`<progress` across `apps/` and `packages/` returns **one file** — `GameStoryScreen.svelte:30`,
the share-card generator, which draws a picture for people who are not using the app.

**This RFC specifies the missing layer as a closed vocabulary of thirteen components** (§3), each
derived from what the evidence *is* rather than from what looks good: a distribution over moves,
an outcome split, a magnitude, a trail of magnitudes, a square set, a move path, an exact directed
board relation, a count against
a denominator, a citation, a categorical state, an authored claim, an abstention, and — for
author and operator surfaces only — a structured document. Each declares its **typed operand**,
its **convention obligation**, its **honest-empty state**, its image in `design/05`'s form
inventory, and the theme tokens it consumes.

Three rules bind all thirteen. **Honest empty is a shipped state, not a blank** (§4): every
component renders absence as itself, and abstention is visually and structurally distinct from
zero — a distribution with no candidates and a distribution where every candidate scored 0% are
different pictures. **The number and its convention travel together** (§5): a component that
renders a number cannot be constructed without what the number was measured against, which is
law 8's anti-pattern — *"Stockfish: +0.54 / Maia: 31% / LLM: 'Ne5 centralizes the knight'"* —
made structurally unrepresentable rather than merely discouraged. **Enum ids and raw ids never
reach a learner** (§6): every learner-visible closed vocabulary gets a total label registry, and
two independent instruments enforce it — a static sweep over rendered text nodes (**43 sites at
HEAD**, plus **11** `replaceAll("_", " ")` cosmetic-space sites, plus **1** `JSON.stringify`) and
a runtime guard at the component boundary, because [[D526]]'s lesson is that a single instrument
sharing the defect's assumption is not an instrument.

§7 closes the theming hole the same way. `rfc/theming.md` criterion 2's sweep matches
`/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/` and therefore **cannot see a named or system CSS colour**
([[D1433]]). Measured over `apps/web/src` at HEAD: **16 hard-coded colour declarations in 7
files** are invisible to it — 6 named (`background:white`, four `color: white`, one
`color-mix(… , white)`) and 10 CSS system colours (`Canvas`/`CanvasText`), which follow the *OS*
rather than the theme. Components consume tokens only, and §8's sweep sees all three classes.

## Motivation

**The owner, 2026-08-24, verbatim:** the evidence surfaces are *"very very very poor"*; *"raw
info"* is still being dumped; *"where are all the nice ux components?"*

He is right, and the repo already knew. `design/research/evidence-presentation.md` §8 decision 3,
landed 2026-08-20, reads:

> `[M]` Require every evidence UX to name a module/consumer, timing, budget, abstention and
> equivalent sentence before it can claim a form.

That decision produced `rfc/learner-modules.md`, which specifies all five of those things per
module and closes at a `forms` field whose members are `sentence | card | square | arrow |
timeline_mark | panel | spoken_voice`. **The gap is one level below.** `sentence` is not a
rendering; it is a channel. A probability distribution, a tablebase verdict, a citation and a
mate distance are four completely different objects that all currently satisfy "renders as a
sentence", and satisfying it is precisely how they became strings.

The dossier also measured the other half and nobody acted on it. §2's census over 611 authored-
spine positions and 12,236 occupied-square selections found a worst-case gesture producing **11
captions, 19 marks and 9 unique squares**, and named the cause exactly: *"a gesture is currently
a query against the producer census."* Its §4 named the transferable fix from Chess.com in one
sentence — *"a visual form should be an alternate rendering of one admitted sentence, not a
second unbounded query"* — and `learner-modules` §1.12 encoded that rule as contract text. **What
was never built is the object the rule binds.** `square_set` (§3.5) is that object: one admitted
fact, one caption, one mark set, one owner reference, budget-counted once.

And the reason to fix the layer rather than the symptoms is [[D1430]]: the eleven-module learner
layer was never built, `compileModuleRegistry` is exported and never called with declarations in
production, and no `.svelte` file names a module id. **Restyling the dumps without that layer
reproduces the same surface in nicer type** — which is why this RFC specifies the vocabulary and
`rfc/module-registration.md` specifies the seats, and neither specifies the other's half.

## Specification

### §1 — The rendering layer as it actually is, measured at HEAD

Every line below was read at `f0d5460`. Line numbers are the drafting commit's and the
implementer re-derives them rather than trusting them ([[D1240]]).

**a. Literal JSON at a learner.** `App.svelte:906` —
`<p>{JSON.stringify(page.scan.population)}</p>` — the repertoire-gap surface prints a
`CorpusPopulation` object (`api.ts:496`: source, rating buckets, speeds, since, until) as its
serialization. The object is five well-typed fields with obvious labels. Repaired by §3.9 +
§3.12's disposition rule.

**b. Two raw JSON textareas as the authoring interface.** `App.svelte:988` (`studio-json`) and
`:1013` (`shape-studio-json`) are `<textarea>` elements bound to `JSON.stringify(document, null,
2)`. These are **author** surfaces, so §3.12 keeps a raw view — but keeps it behind an explicit
toggle beside a schema-driven form, not as the whole editor.

**c. Raw ids as list content.** `App.svelte:1102` renders deployment surface availability as
`<li>{id}: {availability}</li>` over `Object.entries(capabilities.surfaces)` — surface ids and an
enum, unlabelled. `AssistanceSettings.svelte:80` renders provider capabilities as
`<dt>{name}</dt><dd>{value}</dd>` over `Object.entries(capabilities.providers)` — the same dump
with different markup — and follows it with `policies {capabilities.policyModes.join(", ")}`,
which prints `RUN_OPPONENT_MODES` (`types.ts:41-46`: `human_common`, `strong_engine`,
`theory_strict`, `perfect_tablebase`, `practical_resistance`) at a learner verbatim.

**d. The opening explorer, which is a table everywhere else, is a paragraph list here.**
`corpus-sentences.ts:9-24` builds `readonly string[]`; `DrillScreen.svelte:1157` renders one
`<p>` per element. Line 9 joins the rating buckets and speeds with `,`. Line 16 states
`White wins X%, draw Y%, Black wins Z%` as prose. Lines 17-21 emit one sentence per move with its
count, its share and its own W/D/L split. **The data is complete, correctly floored (a 100-game
per-move outcome floor, `CORPUS_MOVE_OUTCOME_FLOOR`), correctly guarded (`CORPUS_GUARD`: *"These
counts say what this population played, not what is good"*) and correctly abstaining** — and it
is rendered as forty lines of grey text. This is the single clearest instance of the finding:
the evidence work is done and the presentation work does not exist.

**e. A distribution as a joined string, with its convention in a different element.**
`DrillScreen.svelte:414-419` formats each Maia candidate as `` `${move} ${mass}` `` — e.g.
`"Nf3 31%"` — and `:1151` renders `humanCandidateSentences(humanSplit).join(" · ")` inside one
`<p>`. The band and engine identity are in a **separate** `<p>` at `:1150`
(`humanModelBandSentence`). Delete either paragraph and the other still renders: a percentage
with no stated model, or a model with no numbers. §5 exists because of this line.

**f. Enum ids with a cosmetic space.** `DrillScreen.svelte:385` derives pivotal timeline labels as
`marker.kind.replaceAll("_", " ")` — which is how `option_collapse` reaches the learner as
*"option collapse"*. **Eleven such sites** at HEAD: `DrillScreen.svelte:385`,
`App.svelte:1082`, `GameStoryScreen.svelte:39,49,61`, `PackList.svelte:34,35,36`,
`RatingScreen.svelte:58`, `screen-model.ts:88`, `transition-sentences.ts:28`.

**g. Raw enum and id values in text nodes.** The sweep in §8.1 finds **43** at HEAD, including
`CompareView.svelte:87` (`{node.objectiveState}` — one of six states from `types.ts:4-11`, as a
`<p>`), `WhyBanner.svelte:13` (`{model.state}` as the banner's own pill), `App.svelte:865`
(`<h3>{assignment.packId}</h3>` — an id as a heading), `:982`/`:1010`
(`{draft.packId} · {draft.state}`, `{draft.shapeId} · {draft.state}`), `:1068`
(`{invitation.state}`), `:730` is the honest counter-example (`{recentRun.title}` — a title, not
an id), `BranchRail.svelte:53`, `GroupPanel.svelte:104`, `RatingScreen.svelte:134`,
`DrillScreen.svelte:818,899,938,1179,1189`.

**h. The only chart is not a chart.** `CompareView.svelte:135` renders
`{#each strips[…]?.evalTrail ?? [] as point}<span … title={score(point)}>●</span>{/each}` under
`class="sparkline"`. Every glyph is identical; the magnitude lives in a `title` attribute, which
is invisible on touch, unreliable on keyboard, and not a graphic. The producer is real —
`compare-strips.ts` computes an ordered eval trail — and `score()` at `:46-49` already renders
the correct convention (`M+3` for mate, `+0.54` in pawns). **The trail is a `magnitude_trail`
(§3.4) with no component to put it in.**

**i. There is no charting anywhere.** `<svg`, `<canvas`, `<meter`, `<progress` across all
`.svelte` and `.ts` in `apps/` and `packages/`: exactly one file, `GameStoryScreen.svelte:30`.

**j. Sixteen hard-coded colours the theming sweep cannot see** ([[D1433]], widened here by
measurement — see §7).

### §2 — The layer this RFC adds, and exactly where its boundary runs

The stack, top to bottom, with the document that owns each rung:

```text
preset / workflow            rfc/intent-presets.md
  -> module (intent, timing, eligibility, budgets, emptyBehavior)
                             rfc/learner-modules.md
  -> seat (where it sits, what the seat's budget is)
                             rfc/module-registration.md   <- concurrent
  -> FORM (sentence | card | square | arrow | timeline_mark | panel | spoken_voice)
                             design/05-in-run-experience.md §3-forms  (intent tier)
  -> COMPONENT (what shape this typed operand takes inside that form)   <- THIS RFC
  -> tokens (colour, spacing, motion)
                             rfc/theming.md
```

**This RFC owns exactly one rung.** It does not choose which modules are active (presets), where
they sit (seats), what their budgets are (module-registration), which facts are eligible
(learner-modules §3/Appendix B), or what any colour is (theming). It owns: the closed set of
components, each component's operand type, each component's convention obligation, each
component's honest-empty rendering, the label registry, and the four instruments.

**Why "form" was not enough, stated as the design deviation it is.** `design/05`'s inventory is
a list of *channels*. `learner-modules` §1.12 binds each module's forms to shipped
`EvidenceForm` members (`evidence-contract.ts:6`). Neither layer distinguishes a distribution
from a citation from a mate distance, because both were correctly written at the altitude of
"what channel may this producer use". A channel cannot tell an implementer to draw a bar. That is
Deviation 1, and the design-tier amendment is owed to the owner (Discharge D1).

**The declaration lands in the runtime, the implementation lands in the client.**
`COMPONENT_DECLARATIONS` and the operand types land as
`packages/runtime/src/presentation-contract.ts` — shared, frozen, testable without a DOM, and
importable by the server-side renderers that already build sentences. The thirteen Svelte
implementations land under `apps/web/src/lib/evidence/`. **Nothing in this RFC edits
`packages/runtime/src/evidence-catalog.ts`**, which `rfc/module-registration.md` owns; the join
is one-way and by type only (a component declares which `EvidenceForm` members it may serve;
`evidence-catalog.ts` does not import this file), so landing order is free in either direction.
The pin is recorded in `rfc/README.md`.

**The sealed rendered item carries both representations.** The implementation amends
`RenderedEvidenceItem` from `{ evidence, sentences }` to
`{ evidence, sentences, components }`, where `components` is a readonly union of the thirteen
typed operands below. A registered renderer constructs the sentence and component operands from
the same admitted `DeclaredEvidence`; neither a module nor a Svelte call site may attach a board
overlay later. `renderEvidenceItems` seals both arrays in the same `RenderedEvidenceView`, and
`voiceCheck` continues to derive its allow-list from that view's sentences. This is the
producer→presentation join [[D1568]] requires and prevents a second, ungrounded overlay authority.

### §3 — The closed component vocabulary

**Thirteen components. This is the closed list; adding or dropping one is a spec change with a
changelog line.** Every component declares eight fields:

1. **`id`** — one of the thirteen.
2. **`renders`** — one sentence naming the object it draws.
3. **`operand`** — the typed input. **Total by type**: a component whose operand type does not
   compile cannot be constructed, which is `rfc/theming.md` §2's totality trick applied to
   presentation. There is no `unknown`, no `Record<string, unknown>` and no `string` operand in
   the vocabulary except where the string is authored prose or chess notation.
4. **`convention`** — `required | not_applicable`, per §5. Where required, it is a **field of the
   operand**, not a sibling element.
5. **`emptyBehavior`** — what it renders when the operand is absent, per §4. Never `null`, never
   a blank box, never a zero.
6. **`forms`** — the `design/05` forms this component may serve, and their `EvidenceForm` images
   under `learner-modules` §1.12's pinned mapping. A component may not invent a form.
7. **`equivalentSentence`** — the deterministic prose rendering of the *same* admitted content.
   `design/05` §3-forms' acceptance test in component shape: *render the same content as a
   sentence; if the sentence would be refused, so is the overlay.* Every component ships one, and
   it is what screen readers and provider-off deployments receive.
8. **`tokens`** — the `THEME_TOKENS` members it consumes. A component consumes tokens; it never
   names a colour (§7).

A component **never selects**. It receives an operand a module already admitted under its
budget, and draws it. A component that queries anything is the defect the dossier named
(*"a gesture is currently a query against the producer census"*).

---

#### 3.1 `distribution` — a probability or frequency distribution over moves

- **Renders:** ranked candidate moves with their share of a stated population or model output.
- **Operand:**
  ```ts
  interface DistributionOperand {
    readonly rows: readonly {
      readonly move: { readonly san: string; readonly uci: string };
      readonly share: number;              // 0..1, NOT pre-formatted
      readonly count?: number;             // present iff the basis is a corpus
      readonly withheld?: WithheldReason;  // per-row floor, e.g. the 100-game outcome floor
    }[];
    readonly residual: { readonly share: number; readonly label: string } | null;
    readonly convention: Convention;       // §5 — mandatory
    readonly highlight: { readonly uci: string; readonly why: HighlightReason } | null;
  }
  ```
- **Convention:** required. A share means nothing without *whose* distribution it is.
- **Renders as:** ranked rows, each a label + a proportional bar + the share as a numeral in
  tabular figures; the convention line inside the component's bounding box; `residual` drawn as
  the explicit remainder so the bars sum to the whole (an unlabelled gap is a lie about
  coverage). Rows are capped by the seat's `maxFacts`, and the cap is **stated** — *"top 5 of 23
  recorded moves"* — via §3.7's component, never by silent truncation.
- **`highlight`** exists so the learner's committed move can be located in the distribution
  without the component ranking or grading anything: `HighlightReason` is the closed set
  `{ "learner_committed", "position_in_view" }` and neither implies quality. **A component may
  never colour a row by goodness** — law 8.
- **Empty:** `stated_absence`, with the convention still rendered. *"This model returned no
  candidates for this position."* / *"No games from this population reached this position."* —
  and the abstention reason from `CorpusResult`'s `"abstention"` arm (`api.ts:497`) is carried
  through, not flattened.
- **Forms:** `card` (→ `panel`), `sentence`. **Not** `arrow` — an arrow per candidate is a ranked
  move recommendation on the board, which exceeds every module ceiling below `ranked_moves`.
- **Equivalent sentence:** today's `humanCandidateSentences` output, with the band sentence
  prepended rather than orphaned in a sibling `<p>`.
- **Replaces:** `DrillScreen.svelte:1151`, `corpus-sentences.ts:17-21`.

#### 3.2 `outcome_split` — a win/draw/loss triple over a population

- **Renders:** the three-way result share of a set of games, from a stated perspective.
- **Operand:**
  ```ts
  interface OutcomeSplitOperand {
    readonly white: number; readonly draws: number; readonly black: number;
    readonly total: number;
    readonly perspective: "white" | "black" | "side_to_move";
    readonly convention: Convention;
    readonly floor: { readonly threshold: number; readonly met: boolean };
  }
  ```
- **Convention:** required. **`perspective` is separately mandatory**: a W/D/L bar whose
  orientation is unstated is a coin-flip presented as information, and `corpus-sentences.ts:16`
  gets this right in prose today by naming White and Black explicitly. The component keeps that
  and adds the bar.
- **Renders as:** one stacked bar in three segments with the three numerals; the total and its
  population as the convention line. Segments use `--accent`, `--muted` and `--line` weightings —
  **never a red/green good/bad axis**, which would grade a move.
- **Empty:** two distinct states. `floor.met === false` renders *"N games recorded here — below
  the {threshold}-game floor. No frequencies are shown"* **with no bar drawn**; a genuine zero
  (`total === 0`) renders *"No games from this population reached this position"*. §4's rule in
  its sharpest form: a withheld split and an empty split must not look alike.
- **Forms:** `card` (→ `panel`), `sentence`.
- **Replaces:** `corpus-sentences.ts:16` and its per-move arm at `:18-20`.

#### 3.3 `magnitude` — one scalar with a unit, a perspective and a bound

- **Renders:** a single measured number.
- **Operand:**
  ```ts
  type MagnitudeUnit =
    | { readonly kind: "centipawn" }
    | { readonly kind: "mate_in"; }
    | { readonly kind: "percent" }
    | { readonly kind: "count" }
    | { readonly kind: "elo" }
    | { readonly kind: "clock_ms" }
    | { readonly kind: "distance_to_zero" };   // tablebase DTZ/DTM
  interface MagnitudeOperand {
    readonly value: number;
    readonly unit: MagnitudeUnit;
    readonly convention: Convention;   // carries perspective + search bound + producer
    readonly saturated: boolean;       // the value is at the instrument's limit, not the truth
  }
  ```
- **Convention:** required, and this is the component law 8 is about (§5).
- **Renders as:** the numeral in tabular figures at display weight, the unit rendered as a unit
  (`+0.54` / `M+3` / `31%` / `DTZ 14`), and the convention as a compact attribution beside it —
  producer name and version, perspective, and the bound (depth, node count, or *"exact"*). The
  existing `score()` formatting at `CompareView.svelte:46-49` is correct and is lifted into this
  component rather than reinvented.
- **`saturated`** exists because a clamped engine score and a true evaluation are different
  claims, and `rating.ts:203`'s `scoreSaturated` already proves the runtime knows the difference.
- **Empty:** `unavailable_source` when the producer is off (*"No engine is configured in this
  deployment"*) and `stated_absence` when it is on and returned nothing. **These are different
  sentences and the distinction is load-bearing** — `design/05:206-246`'s first-class
  source-unavailable state.
- **Forms:** `card` (→ `panel`), `sentence`, `timeline_mark`.
- **Replaces:** every bare number in `CompareView.svelte:149`, `DrillScreen.svelte`'s evaluation
  renders, and the `title=` tooltip at `CompareView.svelte:135`.

#### 3.4 `magnitude_trail` — an ordered sequence of magnitudes over plies

- **Renders:** how one measured quantity moved across a branch. **This is the component the
  product does not have.**
- **Operand:** `readonly { plyOffset: number; magnitude: MagnitudeOperand }[]` plus one shared
  `convention` asserted equal across every point (a trail mixing two producers or two units is a
  construction error, not a rendering choice), plus an explicit `domain` and `range` with their
  units.
- **Convention:** required, once, for the whole trail.
- **Renders as:** a real plot — an `<svg>` line or step path with a stated vertical extent and a
  zero reference, plies on the horizontal, points addressable by keyboard, **and** an
  `equivalentSentence` table available without hover. The vertical extent is **stated, not
  inferred silently**: an auto-scaled evaluation chart makes a 0.2-pawn drift look like a
  catastrophe, which is a graded move by geometry.
- **Empty:** `stated_absence` — *"No recorded evaluation covers this branch."* A trail of length
  1 renders as a `magnitude` (§3.3), not as a one-point chart.
- **Forms:** `card` (→ `panel`), `timeline_mark`.
- **Replaces:** `CompareView.svelte:135` in full. The operand already exists
  (`compare-strips.ts`'s `evalTrail`); only the component is missing.

#### 3.5 `square_set` — the squares of one admitted fact

- **Renders:** board squares belonging to exactly one admitted fact, with that fact's caption.
- **Operand:**
  ```ts
  interface SquareSetOperand {
    readonly squares: readonly Square[];      // deduplicated at construction
    readonly brush: MarkBrush;                // MARK_BRUSHES, types.ts:51
    readonly owner: { readonly factRef: string; readonly caption: string };
    readonly ordered: false;                  // a set, never a vector — see §3.6
  }
  ```
- **Convention:** not applicable (a square set is exact or it does not exist), but `owner` is
  mandatory and is the whole point.
- **Renders as:** lit squares plus **the one caption that owns them**, bound bidirectionally:
  focusing the caption lights the squares, focusing a square surfaces its caption, and both are
  reachable by keyboard (WCAG 2.2 hover/focus, dossier §6.1). **Deduplication is at
  construction**, which is what kills the measured 19-marks-for-9-squares tail.
- **The one-fact rule:** a `square_set` renders exactly one fact. A gesture selecting a square
  that matches four admitted facts produces four `square_set` operands, each counted against the
  seat's `maxMarks`, and the seat drops the ones that do not fit. **It never merges them into one
  overlay**, which is how eleven captions became one blue cloud.
- **Empty:** no marks drawn **and a stated reason** — *"Nothing admitted covers this square"* —
  never a silent no-op, which is indistinguishable from a broken gesture.
- **Forms:** `square` (→ `lit_squares` / `piece_halo`).
- **Replaces:** `DrillScreen.svelte:381-383`'s `flatMap` over every matching observation.

#### 3.6 `move_path` — an ordered sequence of plies

- **Renders:** a line: a principal variation, a piece route, an authored continuation, a repeated
  sequence.
- **Operand:** `readonly { ply: number; san: string; uci: string }[]` plus `convention`, plus
  `answerDistance: AnswerDistance` (`evidence-contract.ts:7`) declaring what the path *is*, plus
  `origin: "recorded" | "authored" | "learner_played"`.
- **Convention:** required when the path came from a search (a PV without its depth is a claim
  without a bound); `not_applicable` when `origin === "learner_played"`.
- **Renders as:** a numbered move list that steps the board, optionally an arrow per ply.
  **Arrows only from an ordered operand** — `learner-modules` §1.12's rule, restated at the
  component: a fact retaining only square *sets* draws marks, never arrows, so §3.5 and §3.6 are
  deliberately different components and the type system enforces it (`ordered: false` vs an
  array with `from`/`to`).
- **Ceiling:** the component refuses construction when the seat's module `answerCeiling` is below
  the operand's `answerDistance`. This duplicates no logic — it reads the ceiling
  `learner-modules` §1.6 already computes — but it fails **at the render boundary**, which is the
  last place a PV can leak.
- **Empty:** `stated_absence` — *"No line was recorded for this position."*
- **Forms:** `card` (→ `panel`), `arrow` (→ `arrows`), `sentence`.
- **Replaces:** `CompareView.svelte:137`'s `{route.squares.join(" → ")}`.

#### 3.6a `relation_overlay` — one admitted directed relation on the board

- **Renders:** the pieces and squares participating in one admitted fact, plus only the directed
  edges that fact retains. It is the component for controller→square, attacker→target,
  defender→duty, slider→target, screen→ray and played origin→destination relations. It is not a
  principal variation and never invents a candidate move.
- **Operand:**
  ```ts
  type BoardRelationKind =
    | "controls" | "attacks" | "defends" | "screens"
    | "pins" | "skewers" | "threatens" | "moves_to"
    | "opens_ray" | "closes_ray";
  interface RelationOverlayOperand {
    readonly nodes: readonly {
      readonly square: Square;
      readonly role?: Role;
      readonly color?: Color;
      readonly emphasis: "source" | "target" | "screen" | "context";
    }[];
    readonly edges: readonly {
      readonly from: Square;
      readonly to: Square;
      readonly relation: BoardRelationKind;
      readonly sign: "state" | "gained" | "lost";
    }[];
    readonly owner: { readonly factRef: string; readonly caption: string };
    readonly answerDistance: AnswerDistance;
    readonly convention?: Convention;
  }
  ```
- **Construction rule:** every node and edge is a literal projection operand or a mechanical UCI
  split retained by that same projection. The renderer may label and deduplicate; it may not run
  chess rules, query the position, choose a relation, connect two members of an unordered set, or
  infer importance. A projection retaining only square sets constructs `square_set`, never this
  component. A relation whose declared grounding is `declared_convention` carries that convention
  inside the operand.
- **Existing producer coverage:** `ThreatResult.threats[].threateningPiece/threatenedMove/target`,
  `SquareControlReading` and `SquareControlEvent`, `DefenderDutyReading` and its removal/relocation
  events, `RayClassificationReading`, `DiscoveredLatencyReading`/`DiscoveredExecutedEvent`,
  `PieceDestinationsReading/Event`, exact move anchors, and the observed semantic-tactic payloads
  already retain ordered identities and already declare the `arrows` form. They need registered
  relation renderers, not replacement chess collectors.
- **Mandatory producer repairs:** the six legacy transition families in Discharge D4 must retain
  their exact subject/source/target squares before they can construct this component or
  `square_set`. The final direct rung of `guided_hint` must consume one selected member of the
  literal, measured `HINT_HORIZON_PROJECTION_IDS` registry from `hint-distance`; raw
  `live.stockfish.pv` is not converted into a guidance arrow, and unlike hint families are not
  laundered through one generic projection ([[D1455]], [[D1569]]). Neither absence may be used to declare 1.0 presentation
  complete.
- **Renders as:** lit nodes and at most the owning module's arrow budget, with focus/touch parity.
  Focusing the caption exposes the relation; focusing either endpoint exposes the same caption.
  Gained/lost styling uses theme tokens and line pattern, never good/bad move colour.
- **Empty:** `stated_absence` for an explicit request and no overlay for a silent module. A
  missing required producer is a coverage-gate failure, not a fake empty fact.
- **Forms:** `arrow` (→ `arrows`), `square` (→ `lit_squares` / `piece_halo`), `sentence`.
- **Equivalent sentence:** mechanically names the same endpoints and registered relation label;
  for example, *"The bishop on b4 pins the knight on c3 to the queen on d2"* is permitted only
  from a `ray_classification` payload whose kind is `absolute_pin`/`relative_pin` and whose three
  identities are retained. The renderer cannot manufacture the word from geometry.

#### 3.7 `count_with_denominator` — a count that is only meaningful against its base

- **Renders:** a numerator against the base it was drawn from.
- **Operand:** `{ numerator: number; denominator: number; denominatorMeaning: string; floor?: {…} }`.
- **Convention:** required — `denominatorMeaning` **is** the convention (*"legal alternatives
  evaluated"*, *"games in this population"*, *"checkpoints in this pack"*).
- **Renders as:** *"2 of 25 legal alternatives evaluated"* with a proportional mark. **A bare
  count is a defect** and the operand makes it unconstructible: there is no single-number arm.
- **The percentage rule:** the component computes the percentage; the caller never passes one.
  A percentage without a denominator cannot be constructed, which is the structural form of *"how
  many games is 31% of?"* — the question `DrillScreen.svelte:1151` cannot answer today.
- **Empty:** `denominator === 0` renders *"nothing to count against"* explicitly and **draws no
  proportion**; a `numerator === 0` against a real denominator renders *"0 of 25"*, which is
  information. §4's distinction again.
- **Forms:** `sentence`, `card` (→ `panel`).
- **Replaces:** the truncation and coverage numbers in `App.svelte`'s repertoire surfaces,
  `CompareView.svelte:92`'s `{node.checkpointRefs.length}`, and the seat-cap statements §3.1
  requires.

#### 3.8 `citation` — an attributed reference to a source

- **Renders:** one cited passage or authored source with everything the licence requires.
- **Operand:** `{ sourceLabel; title; locator; licence: LicenceId; url?: string; revision?: string }`.
- **Convention:** not applicable; **attribution is mandatory and is part of the component**, not
  of the page that hosts it — which is what makes a citation safe to move between surfaces.
  Licence obligations are read from the sourcing register, never re-decided here.
- **Renders as:** an attributed block: quoted or summarised passage, source label, locator, and
  the licence line. The `revision` field renders when present, because an unpinned citation is a
  claim about a moving target (`theory-knowledge-pipeline` §9's P7).
- **Empty:** `stated_absence` — *"Nothing cited covers this position"* — which is
  `theory-presentation.ts:5`'s existing `UNKNOWN_THEORY_NOTE` discipline: *"Unknown is not a
  judgement."* That constant is lifted into this component's empty state verbatim.
- **Forms:** `card` (→ `panel`), `sentence`.

#### 3.9 `enum_state` — a categorical value from a closed vocabulary

- **Renders:** one member of a closed set, as a human label.
- **Operand:** `{ vocabulary: LabelVocabularyId; value: string }` where `value` is constrained by
  the vocabulary's own union type — so an unregistered vocabulary and an unregistered member are
  **both compile errors** (§6).
- **Convention:** not applicable; the vocabulary **is** the convention, and the component renders
  the vocabulary's own one-line gloss on request.
- **Renders as:** a label, optionally with a valence token (`--accent` / `--warning` /
  `--danger` / `--muted`) declared **in the registry, not at the call site**, so the same state
  cannot read as neutral on one screen and alarming on another. Valence is permitted only where
  the vocabulary is a rules or outcome fact; it is **forbidden** on any vocabulary describing a
  move (law 8 — a move-quality colour is a grade).
- **Empty:** a value absent from the operand renders the vocabulary's declared unknown label
  (*"not recorded"*), never an empty pill.
- **Forms:** `sentence`, `card` (→ `panel`), `timeline_mark`.
- **Replaces:** all 43 sites in §8.1's sweep and all 11 `replaceAll("_", " ")` sites.

#### 3.10 `claim` — an authored judgement with its ground attached

- **Renders:** a sentence somebody is responsible for, with the responsibility rendered.
- **Operand:** the shipped `guidance.authored_claim@1` view — `{ text; sourceLabel; binding:
  "ledger_bound" | "author_attributed" | "author_declared"; principles?; earnedEvidenceTypes }`
  (`claim-presentation.ts:12-29`).
- **Convention:** required in its authored form — the **binding** is the convention. A
  ledger-bound claim and an author-declared one are different epistemic objects and must not
  render identically, which `claim-presentation.ts` already gets right in prose.
- **Renders as:** the claim text with an attribution line whose wording is determined by
  `binding`, and the counter-case (*"It can be wrong when: …"*) rendered as part of the component
  rather than as an optional extra.
- **Empty:** `silent` — an absent authored claim is not an event, and asserting *"the author said
  nothing"* on every position is the alert-fatigue failure the dossier's §5 measured.
- **Forms:** `card` (→ `panel`), `sentence`, `spoken_voice` (→ `audio`).
- **Law 8:** this component renders authored or validated text. **It never accepts generated
  text without a binding**, and the LLM renderer boundary is `learner-modules` §6.3's, not
  widened here.

#### 3.11 `abstention` — the honest-empty state as a first-class component

- **Renders:** the fact that there is nothing to render, and why.
- **Operand:** `{ reason: AbstentionReason; producer?: VersionedEvidenceId; asked: string }`
  where `AbstentionReason` is the closed vocabulary already declared per projection
  (`ProjectionDeclaration.abstention.reasons`, `evidence-contract.ts:34`) plus the three
  `emptyBehavior` classes from `learner-modules` §1.10.
- **Convention:** not applicable; `asked` **is** the honesty — an abstention that does not say
  what question it is refusing is a blank with a border.
- **Renders as:** a bordered, `--muted`, deliberately *lighter*-weight block — never an error
  colour (nothing failed), never zero-height. Structurally distinct from every value component:
  a screen reader hears *"no data: …"*, and a `data-abstention` attribute makes the distinction
  assertable (§8.3).
- **Empty:** not applicable — this **is** the empty state, which is the point of making it a
  component instead of a fallback.
- **Forms:** every form its host component may serve, so an abstaining component never changes
  channel and never disappears from its seat.
- **This is the component every other component delegates to.** §4 makes that delegation a
  contract rather than a convention.

#### 3.12 `structured_document` — the machine object, for author and operator surfaces only

- **Renders:** a schema-typed object as a labelled form, with the raw serialization available.
- **Operand:** `{ schemaId: string; document: unknown }` — the **only** component admitting
  `unknown`, and it admits it only because the schema is the type.
- **Disposition:** `author_only | operator_only` (`EvidenceDisposition`,
  `evidence-contract.ts:4`). **A learner-facing surface may not construct this component**, and
  §8.4's sweep asserts it. `App.svelte:906`'s `JSON.stringify` is a learner surface and is
  therefore not a `structured_document` at all — it is a `distribution` basis line plus four
  `enum_state`s.
- **Renders as:** fields derived from the JSON Schema (label, type, required, description),
  validation errors bound to their field, and a **raw JSON view behind an explicit toggle** that
  round-trips byte-identically. Keeping the raw view is deliberate — `evidence-presentation.md`
  §8 decision 4: *"do not delete expert analysis in the name of simplicity."*
- **Empty:** an empty document renders the schema's own required-field skeleton, not `{}`.
- **Forms:** `panel`.
- **Replaces:** `App.svelte:988` and `:1013`.

---

**Coverage check.** The vocabulary is closed against the shipped evidence surface by
construction, not by assertion: §8.2's derivation walks every `ProjectionDeclaration` in
`PRIMARY_EVIDENCE_MANIFEST`, reads its `payloadType`, `operands`, `answerContent` and `forms`,
and asserts every projection maps to at least one component. **A projection with no component is
a build failure**, and that is what makes this list closed rather than merely long. Two mappings
are stated here because they are the ones an implementer would get wrong:

- **Clock readings** (`recorded-clocks.md`, `enforced-clocks.md`) are `magnitude` with
  `unit.kind === "clock_ms"`, not a thirteenth component. Their per-field abstention
  ([[D1131]]: 1,158 broadcast readings, zero declared controls) is `abstention` inside the
  `magnitude`'s empty slot — which is exactly why abstention is per-component.
- **Move-quality grades** are `enum_state` over the `rfc/move-quality-grades.md` vocabulary, and
  they are a **projection, not a module** (`learner-modules` §5). This RFC adds no grading and
  no grade colour beyond that vocabulary's own registered valence.

### §4 — Honest empty is a shipped invariant, and abstention is not zero

`design/05:41` — *"Absence is stated, never simulated"* — is an invariant with no rendering.
This section gives it one.

**Rule 4a — every component declares `emptyBehavior` and every component renders it.** The three
classes are `learner-modules` §1.10's, unchanged: `silent`, `stated_absence`,
`unavailable_source`. A component whose operand is absent renders `abstention` (§3.11) **in its
own seat**, at its own form. It does not disappear, and it does not render a zero.

**Rule 4b — abstention is structurally distinct from zero, not merely worded differently.** The
three cases must be told apart by a blind test:

| case | example | must render |
|---|---|---|
| a real zero | 0 of 25 alternatives matched | the value component, with `0` |
| a withheld value | below the 100-game per-move floor | `abstention`, floor reason, **no bar** |
| an absent producer | no engine in this deployment | `abstention`, `unavailable_source`, producer named |

`corpus-sentences.ts:10-12,18-20` already distinguishes all three **in prose** and is the
existing proof that the runtime knows the difference. The defect is that the renderer flattens
them into identical grey paragraphs. Criterion 6 asserts the three render differently at the DOM,
by attribute, not by copy.

**Rule 4c — a zero-value component never borrows an abstention's chrome, and vice versa.** An
`abstention` carries `data-abstention="<reason>"`; a value component never carries it. This is
the assertable form of the rule, and it is deliberately an attribute rather than a class so a
restyle cannot silently break it.

**Rule 4d — unused budget stays empty.** Restated from `learner-modules` §1.8 because it is a
*rendering* temptation: a seat with room for two facts and one admitted fact renders one fact and
whitespace. It never fills the gap with a locally-distinctive-but-useless fact — the
`occupied_defence` lesson, measured at the F2→module seam (dossier §6.1) — and it never stretches
one component to fill the seat, which reads as more evidence than exists.

**Rule 4e — a component never renders a placeholder, skeleton or spinner as though it were
content.** A pending operand renders `abstention` with reason `pending`, replaced when the
operand arrives. Simulated content, including a greyed-out fake bar, is the *simulated absence*
`design/05:41` prohibits.

### §5 — The number and its convention travel together

`design/00-thesis.md` law 8's named anti-pattern, quoted in `CLAUDE.md`:

> *"Stockfish: +0.54 / Maia: 31% / LLM: 'Ne5 centralizes the knight'" is a dashboard, not a
> drill — the named anti-pattern this product must not become.*

The usual reading is that the third item is the violation. **The first two are violations too**,
and this RFC's §1e is the proof that we shipped them: `+0.54` measured to what depth, from whose
perspective, by which engine version; `31%` of which model's policy, at which rating band,
counted over what.

**Rule 5a — the `Convention` type, and its mandatory presence.**

```ts
interface Convention {
  readonly producer: VersionedEvidenceId;      // id@version — the label layer renders it (§6)
  readonly producerLabel: string;              // from the label registry, never the id
  readonly perspective: "white" | "black" | "side_to_move" | "learner" | "not_applicable";
  readonly basis: string;                      // "Lichess explorer, 1600–1800, blitz, 2024-01..2026-06"
  readonly bound:
    | { readonly kind: "search"; readonly depth: number; readonly nodes?: number }
    | { readonly kind: "exact" }               // rules, tablebase
    | { readonly kind: "sample"; readonly n: number }
    | { readonly kind: "model"; readonly band: string };
}
```

**Rule 5b — a convention-requiring component cannot be constructed without one.** Not validated;
**unconstructible**. `convention` is a required non-nullable field of `DistributionOperand`,
`OutcomeSplitOperand`, `MagnitudeOperand`, `MagnitudeTrailOperand`, `MovePathOperand` (search
origin) and `CountWithDenominatorOperand` (`denominatorMeaning`). Law 8 becomes a type error.

**Rule 5c — the convention renders inside the component's bounding box.** Not in a sibling
element, not in a heading above, not in a `title` attribute, not in a caption that a responsive
breakpoint can drop. The failing shape is `DrillScreen.svelte:1150-1151` verbatim: two adjacent
`<p>` elements, either of which renders alone. Criterion 7 asserts this by deleting the
convention from the operand and observing the component fail to construct, **and** by asserting
the rendered convention text is a descendant of the component root.

**Rule 5d — `producerLabel`, never the producer id.** `Convention.producer` is `id@version`
because provenance needs it; `producerLabel` is what renders. This is §6's rule stated at the one
place a raw id is legitimately *carried* — it may be carried in a `data-` attribute for
inspection, and it may never be the text.

**Rule 5e — the convention is not a disclaimer.** `CORPUS_GUARD` (*"These counts say what this
population played, not what is good"*) is a **guard** and stays as authored text alongside the
convention; the convention is the measurement's own metadata. Collapsing them would let a
component satisfy 5b by printing a disclaimer.

### §6 — The label layer: an enum id or a raw id in learner-visible text is a defect

**Rule 6a — the rule, stated so it can be checked.** A string that reaches a learner-visible text
node is exactly one of four things:

1. **chess notation** — SAN, UCI, a square name, a FEN in an explicitly technical surface;
2. **a number with its convention** (§5), rendered by a component that requires one;
3. **a label from the label registry** (6b);
4. **authored or cited prose** — pack text, a theory passage, a registered sentence template.

**Anything else is a defect.** Not a style issue, not a polish item: a defect, with a ledger row.

**Rule 6b — the label registry, total by type.**

```ts
interface LabelEntry {
  readonly label: string;                 // what the learner reads
  readonly gloss?: string;                // one sentence, on request
  readonly valence?: "neutral" | "positive" | "caution" | "adverse";  // §3.9's constraint
}
type LabelVocabulary<T extends string> = Readonly<Record<T, LabelEntry>>;
```

Every closed union a learner can see gets one, keyed by its **own union type**, so a member added
to the union without a label is a **compile error** — `rfc/theming.md` §2's `Record<ThemeToken,
string>` totality trick, which that RFC's row A proves catches the phantom class. The registry
lands as `apps/web/src/lib/labels/` with one file per vocabulary and one frozen index.

The vocabularies required at HEAD, each with its source of truth:

| vocabulary | union | source |
|---|---|---|
| objective state | `ObjectiveState` | `types.ts:4-11` |
| run outcome | `RunOutcome` | `types.ts:49` |
| opponent mode | `RunOpponentMode` | `types.ts:41-46` |
| evidence kind | `EvidenceKind` | `types.ts:11` |
| evidence source | `EvidenceSource` | `types.ts:12` |
| evidence plane / grounding / exactness / confidence | 4 unions | `evidence-contract.ts:1-8` |
| answer distance | `AnswerDistance` | `evidence-contract.ts:7` |
| evidence form | `EvidenceForm` | `evidence-contract.ts:6` |
| evidence role | `EvidenceRole` | `evidence-contract.ts:8` |
| provider-off behavior | `ProviderOffBehavior` | `evidence-contract.ts:11` |
| availability / latency | 2 unions | `evidence-contract.ts:9-10` |
| session kind, live session kind | `RunSessionKind`, `LiveSessionKind` | `types.ts:35-38` |
| feedback policy | `RunFeedbackPolicy` | `types.ts:39` |
| mark brush | `MarkBrush` | `types.ts:51-52` |
| pivotal marker kind | the marker `kind` union | `pivotal.ts` |
| pack review status, pack mode, pack phase | 3 unions | pack schema |
| rating publication state | the `state` union | `rating.ts` |
| repertoire gap state | `"open" \| "addressed" \| "answered"` | `api.ts:501` |
| invitation state, arena retrieval state, grant role, vote window state | 4 unions | live/social schema |
| surface id, provider id | id sets | capability manifest |
| abstention reason | per-projection reason sets | `evidence-contract.ts:34` |
| module id, seat class | the eleven + five | `learner-modules.md` §4, §1.11 |

**The list is derived, not hand-maintained.** §8.2's command enumerates learner-reachable unions
from the manifest and the client's own types and asserts the registry is **set-equal** to it; the
row count above is a drift tripwire, not an assertion ([[D1240]]).

**Rule 6c — `evidenceKindLabel` is the shape to generalise, and the shape of the bug.**
`api.ts:1458` reads:

```ts
export function evidenceKindLabel(kind: EvidenceKind): string {
  return kind === "bestline" ? "best line" : kind;
}
```

It labels one member of four and returns the raw id for `eval`, `wdl` and `tablebase` — so
**`wdl` ships to a learner as `wdl`**. A partial map is worse than none, because it looks
discharged. Under 6b it becomes a total `LabelVocabulary<EvidenceKind>` and the three missing
members become compile errors.

**Rule 6d — `replaceAll("_", " ")` is banned in rendering paths.** A cosmetic space is not a
label: it produces *"option collapse"*, *"perfect tablebase"* and *"no data at band"*, which are
identifiers with the underscores filed off. All 11 sites (§1f) are replaced by registry lookups.
Criterion 9 fails on any survivor outside `apps/web/src/lib/labels/`.

**Rule 6e — two instruments, because one instrument shares the defect's assumption.**

- **Static (§8.1):** a sweep over the markup of every `.svelte`, flagging text-node mustaches
  whose expression is id- or enum-shaped, plus `replaceAll("_"`, plus `JSON.stringify` in
  markup. This is the cheap, fast, complete-over-*syntax* arm. **It is defeatable** by a
  template literal or an intermediate variable, and it is blind to a single-word enum like
  `degraded`, which is exactly the [[D1433]] failure shape re-armed.
- **Runtime (§8.3):** the component boundary itself. `enum_state` cannot render a value absent
  from its vocabulary, and every component's text-producing path passes through a guard that
  throws `PRESENTATION_RAW_ID` on a string matching an id shape (`^[a-z][a-z0-9]*(_[a-z0-9]+)+$`,
  `@\d+$`, or a 16+-character opaque token). **The runtime arm catches what the sweep cannot,
  and the totality of the registry catches what neither regex can** — `degraded` is caught not
  by looking at the string but by the fact that no vocabulary admitted it.

Three arms, deliberately. The dossier's whole method is that an instrument built from the
defect's own assumption reproduces it.

### §7 — Components consume tokens, and the sweep that guards them sees named colours

**Rule 7a — a component never names a colour.** Every colour reference is `var(--<token>)` over
`THEME_TOKENS ∪ DERIVED_TOKENS` (`rfc/theming.md` §2). No hex, no `rgb()`, no `hsl()`, **no
named CSS colour, no CSS system colour**, and no `color-mix()` whose second operand is any of
those.

**Rule 7b — the measured hole, widened by this pass.** [[D1433]] recorded that
`theme.test.ts:221`'s `/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/iu` cannot match named colours, citing
`App.svelte:1150` and `WhyBanner.svelte:38`. Re-derived at HEAD over every `<style>` block in
`apps/web/src`, the hole is **16 declarations in 7 files**:

| class | count | sites |
|---|---:|---|
| named colour | 6 | `App.svelte:1150` (`background:white`), `CheckpointSheet.svelte:302`, `DrillScreen.svelte:1589`, `Timeline.svelte:204`, `WhyBanner.svelte:38` (all `color: white`), `ShellFrame.svelte:128` (`color-mix(… var(--paper) 94%, white)`) |
| CSS system colour, unconditional | 7 | `Chessboard.svelte:426,456` (×2), `465`, `466`; `GameStoryScreen.svelte:67` (×3) |
| CSS system colour, as a `var()` fallback | 3 | `Chessboard.svelte:446,448` — `var(--line, CanvasText)`, `var(--panel, Canvas)` |

The third class is the subtle one and is reported separately rather than merged: a fallback fires
only when the token is undefined, so it is a *latent* OS-follows-theme bug rather than a live
one — and it is still a hard-coded colour that the theme cannot reach, so 7a covers it.
`GameStoryScreen.svelte` is exempted from the shipped sweep at `theme.test.ts:220` because it
generates a standalone share image; that exemption is correct for the image and **is not extended
to any component in §3**.

**Rule 7c — valence colour is registry-declared, never call-site chosen** (§3.9), and **never
applied to a move**. A red move is a graded move.

**Rule 7d — motion respects the animation preference** `rfc/theming.md` §8 already ships;
`magnitude_trail` in particular animates nothing by default.

**Rule 7e — the criterion may not repeat the hole it is fixing.** §8.4's sweep enumerates named
CSS colours and CSS system colours **from a list**, and the list is asserted non-empty and
asserted to contain the sixteen sites' own keywords, so a future edit that empties the list
fails the criterion rather than silently passing everything.

### §8 — Instruments

Four derivation commands. Each reports a **procedure and a measured baseline**; integers are
drift tripwires only ([[D1240]]).

**§8.1 `make label-sweep`** — over every `.svelte` under `apps/web/src`: strip `<script>` and
tag interiors preserving line numbers, then flag every text-node mustache whose expression's
final segment is id-, kind-, state-, role-, reason-, mode-, status-, scope-, origin- or
sign-shaped (dotted or camelCase), plus every `replaceAll("_", " ")` and every `JSON.stringify`
reachable from markup. Output is a list of `file:line: expression`. **Baseline at `f0d5460`: 43
id/enum text sites + 11 de-underscore sites + 1 `JSON.stringify`.** The criterion asserts the
output is **set-equal to a declared allowlist**, and the allowlist ships **empty** at landing.

**§8.2 `make component-coverage`** — walks `PRIMARY_EVIDENCE_MANIFEST`, and for every
`ProjectionDeclaration` asserts (a) its `payloadType`/`operands`/`answerContent` map to at least
one `COMPONENT_DECLARATIONS` member, (b) every `forms` member is served by one of that
projection's components under `learner-modules` §1.12's pinned mapping, and (c) the label
registry is **set-equal** to the derived set of learner-reachable closed unions. No total is
asserted; the count is printed for drift.

**§8.3 the runtime guard** — `PRESENTATION_RAW_ID` at the component text boundary, plus the
`enum_state` vocabulary lookup, plus `data-abstention` presence/absence per §4c. Exercised by
component tests over zero/one/many/withheld/unavailable operands for **all thirteen** components.

**§8.4 `make component-theme-sweep`** — over `apps/web/src/lib/evidence/**` and every file that
constructs a component: the shipped `theme.test.ts:221` pattern **plus** named CSS colours
**plus** CSS system colours **plus** `color-mix()` with a literal second operand, and a
`structured_document`-disposition check asserting no learner route constructs §3.12. Baseline at
`f0d5460` over all of `apps/web/src`: **16** (6 named, 10 system), listed in §7b.

All four join `make verify`.

### §9 — Refused by name, with the evidence that refuses each

1. **A dashboard.** Components render what a module admitted, in that module's seat, under that
   seat's budget. There is no surface in this RFC that shows every producer's output at once
   except `full_inspector`, which `learner-modules` §4 already scopes as an explicit analysis
   mode. *Refused by:* `design/00-thesis.md` law 8; the dossier's §8 decision 1.
2. **Move grading, ranking or colouring by quality.** No component takes a quality operand; the
   grade vocabulary is an `enum_state` projection (`learner-modules` §5) and nothing else.
   *Refused by:* law 8.
3. **A charting dependency.** `magnitude_trail` and the bars are inline `<svg>` and CSS over
   theme tokens. A charting library brings its own palette — the exact composition failure
   `rfc/theming.md`'s motivation is about — and would ship a second colour system.
4. **Selection, eligibility or budgets.** Owned by `learner-modules` and
   `rfc/module-registration.md`. A component that filters is a second selector.
5. **New seats, new forms, or a new `EvidenceForm` member.** The design tier owns the form
   inventory (law 5); this RFC maps onto it and asks for the amendment in Discharge D1.
6. **Generated text.** `claim` takes bound authored text; the LLM boundary is
   `learner-modules` §6.3's and is not widened. *Refused by:* law 8, [[D421]].
7. **Deleting the inspector or the raw view.** `structured_document` keeps raw JSON behind a
   toggle and `full_inspector` keeps attributed raw evidence. *Refused by:* dossier §8
   decision 4.
8. **A component that queries the board or the manifest.** Every operand is passed in.
   *Refused by:* the dossier's central finding — *"a gesture is currently a query against the
   producer census."*

## Deviations from design

1. **`design/05` §3-forms' inventory is one layer too coarse to specify a rendering, and this
   RFC adds a layer beneath it.** The design tier lists nine *forms* (channels); it does not
   distinguish a distribution from a citation from a mate distance, all three of which are
   "sentence rows / lists" today and all three of which are strings because of it. This RFC does
   not edit `design/05` (law 5). The amendment — a row acknowledging the component layer and
   pointing at this vocabulary — is **Discharge D1, owner's to write or to rule claude may
   write**.
2. **`design/03-product-breadth.md:323`'s B1 residual names three quality defects (*"unstyled
   natives, no presets, checkbox-above-label"*) and is silent on the two larger ones** —
   `JSON.stringify` at a learner and the absence of any chart. The row is understated rather
   than wrong. Correction owed with D1.
3. **`design/05:41`'s *"Absence is stated, never simulated"* is stated as an invariant with no
   rendering obligation.** §4 supplies one, which is a strengthening rather than a contradiction;
   flagged so the owner can see that a design invariant acquired a shipped meaning here.

## Acceptance criteria

> **Rows landed 2026-08-24.** [[D1440]] — `make schema-check` is red at HEAD because `verify-scaffold.mjs` pins the verify chain by exact literal and the Makefile already exceeds it. [[D1441]] — `evidenceKindLabel` labels one member of four. [[D1442]] — the enums learners see are single ordinary words, so registry totality is the only arm that can catch them; the theming hole is 16 declarations across 7 files. [[D1443]] — the dossier named this fix on 2026-08-20 and the contract closed at a `forms` field that a plain sentence satisfies.

Each names the tree state that makes it RED. A criterion that cannot be made to fail is a defect
class in this repo ([[D444]]/[[D984]]/[[D1274]]).

1. **`COMPONENT_DECLARATIONS` has exactly the thirteen §3 ids, is frozen, and every member declares
   all eight §3 fields.** *RED:* delete `emptyBehavior` from any member, or add a thirteenth id
   without a changelog line. *Wrong impl:* an optional field, which lets a component ship with no
   empty state — the defect this RFC exists to prevent.
2. **`make component-coverage` passes, and every `ProjectionDeclaration` in
   `PRIMARY_EVIDENCE_MANIFEST` maps to at least one component.** *RED:* add a projection with a
   `payloadType` no component accepts and observe the build fail. **Set-equality against the
   derivation; no integer asserted.** *Wrong impl:* a hand-written list of projections, which
   passes until the next producer lands.
3. **The label registry is set-equal to the derived set of learner-reachable closed unions, and
   every vocabulary is total over its union type.** *RED:* add a member to `ObjectiveState`
   without a label and observe a **type** error, not a test failure; separately, delete a
   vocabulary and observe `make component-coverage` fail. *Wrong impl:* `Partial<Record<…>>`,
   which is `evidenceKindLabel`'s exact bug at `api.ts:1458` re-shipped.
4. **`make label-sweep` output is set-equal to its allowlist, and the allowlist is empty at
   landing.** *RED:* re-add `{node.objectiveState}` to `CompareView.svelte:87` and observe the
   sweep name that file and line. *Wrong impl:* a sweep that reads only `App.svelte`, or one
   that counts and does not name — a total tells an implementer nothing about where.
5. **The runtime guard throws `PRESENTATION_RAW_ID` on an id-shaped string at the component
   text boundary, and `enum_state` throws on a value absent from its vocabulary.** *RED:*
   construct `enum_state` with `{ vocabulary: "objective_state", value: "degraded" }` after
   removing `degraded` from the registry — the string is a single lowercase word that **no
   regex arm matches**, so this criterion is RED only if the totality arm is real. *Wrong impl:*
   a regex-only guard, which is [[D1433]]'s shape exactly.
6. **The three §4b cases render distinguishably at the DOM.** A test renders a `distribution` and
   an `outcome_split` in all three states and asserts: the real zero carries no
   `data-abstention` and does carry a value node; the withheld case carries
   `data-abstention="floor_not_met"` and **no bar element**; the unavailable case carries
   `data-abstention="provider_unavailable"` and names the producer. *RED:* make the withheld case
   render a zero-width bar and observe the "no bar element" arm fail. *Wrong impl:* three
   different copy strings in one identical container, which is the current corpus renderer.
7. **A convention-requiring component cannot be constructed without a convention, and the
   convention renders inside the component root.** Two arms: a type-level arm (a fixture omitting
   `convention` fails `make typecheck`) and a DOM arm (the rendered convention text is a
   descendant of the component's root element). *RED:* move the convention into a sibling
   element — the shape at `DrillScreen.svelte:1150-1151` — and observe the DOM arm fail. *Wrong
   impl:* a nullable `convention` with a runtime check, which passes for every caller that
   passes `undefined` deliberately.
8. **No component renders a percentage it did not compute from a numerator and a denominator.**
   Asserted by the absence of any `number`-typed operand field named `*Pct`/`*Percent` across
   `presentation-contract.ts`, plus a positive test that
   `count_with_denominator({numerator: 2, denominator: 25, …})` renders both terms. *RED:* add
   `sharePct` as a component operand field — the shape `api.ts:497` hands us — and observe the
   assertion fail. *Wrong impl:* accepting the API's pre-computed `sharePct`, which loses the
   denominator at the exact seam this criterion guards.
9. **`replaceAll("_", " ")` appears in zero files outside `apps/web/src/lib/labels/`.** *RED:*
   restore `DrillScreen.svelte:385`. *Wrong impl:* a lint rule scoped to `.svelte`, which misses
   `screen-model.ts:88` and `transition-sentences.ts:28`.
10. **`JSON.stringify` reaches no learner-visible markup.** Asserted over markup regions of every
    `.svelte`, with `structured_document`'s raw-view module the single named exemption. *RED:*
    restore `App.svelte:906`. *Wrong impl:* an exemption by file rather than by module, which
    would exempt all of `App.svelte`.
11. **`make component-theme-sweep` is green over the component tree, and its keyword lists are
    non-empty and contain `white` and `CanvasText`.** *RED:* set `background: white` on any
    component and observe it named; separately, empty the named-colour list and observe the
    self-check fail. *Wrong impl:* reusing `theme.test.ts:221`'s pattern unchanged, which is the
    [[D1433]] hole reproduced in a new file.
12. **A `square_set` renders exactly one fact, deduplicated, with a bidirectional caption
    binding.** Asserted over the dossier's measured worst case — `d5` in
    `rnb1kbnr/ppp1pppp/8/3q4/8/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 3`, which produces **11 captions,
    19 marks and 9 unique squares** through the current path — by observing the component
    produce 11 separate operands of which the seat admits its budget, and **zero** duplicate
    marks within any one. *RED:* pass two facts to one `square_set`; the type rejects it, so the
    test asserts the seat produced N operands for N facts. *Wrong impl:* one merged overlay with
    a caption list, which is `DrillScreen.svelte:381-383` with better CSS.
13. **`move_path` refuses construction when the seat's module `answerCeiling` is below the
    operand's `answerDistance`.** *RED:* hand a `principal_variation` path to a `fact`-ceiling
    module and observe the refusal. *Wrong impl:* filtering the plies to a shorter path, which
    reveals a best move one ply at a time.
13a. **`relation_overlay` is sealed to one admitted fact and the arrow coverage join is
    set-equal.** A derived census lists every module-eligible projection that declares `arrows`,
    whether its retained payload constructs `relation_overlay`, and the exact registered
    renderer. Existing directed projections in §3.6a must all resolve; the six D4 transition
    families and every measured guided-hint horizon family remain named RED rows until their
    producer contracts and sealed rung compiler land.
    *RED:* join two members of an unordered square set, attach an edge not present in the payload,
    or remove one directed projection's renderer. *Wrong impl:* a Svelte component recomputing
    attacks from FEN, which creates a second chess authority after admission.
14. **`structured_document` is unconstructible from a learner route.** Asserted by a route→
    component reachability check over the router's learner routes. *RED:* construct it in
    `DrillScreen.svelte`. *Wrong impl:* a runtime role check, which passes in a test harness
    that runs as `author`.
15. **`magnitude_trail` renders an `<svg>` with a stated vertical extent and a keyboard-reachable
    point list, and its values are not carried only in `title`.** *RED:* revert to
    `CompareView.svelte:135`'s `●` row and observe both arms fail — the missing `<svg>` and the
    `title`-only value. *Wrong impl:* an `<svg>` of identical circles, which satisfies a naive
    "has a chart" check; the criterion therefore asserts **distinct geometry for distinct
    values**, by rendering a two-point trail with different magnitudes and asserting the
    rendered coordinates differ.
16. **Every component's `equivalentSentence` renders the same admitted content as its visual
    form, and a provider-off deployment gets byte-identical sentences.** *RED:* let
    `distribution`'s visual arm include a row its sentence omits. *Wrong impl:* generating the
    sentence from the rendered DOM, which makes the assertion circular.
17. **Every one of the thirteen components has a test at zero, one, many, withheld and
    provider-unavailable operands.** Set-equality between `COMPONENT_DECLARATIONS` ids and the
    ids covered by the state matrix. *RED:* add a component without its five states. *Wrong
    impl:* a shared parameterised test that skips inapplicable states silently — the matrix
    asserts an explicit `not_applicable` declaration instead.
18. **Scope fence.** A grep-able assertion that this RFC's landing adds no `EvidenceForm` member,
    no `ModuleDeclaration` field, no seat id, no `AnswerDistance` member and no edit to
    `packages/runtime/src/evidence-catalog.ts`. *RED:* add a form member. *Wrong impl:* one that
    "helpfully" adds a `chart` form, which would fork the design tier's inventory and collide
    with `rfc/module-registration.md`.
19. **`register-check` is green with this RFC active**, and its `tabiya-claims` block reads
    `none` consistently with `rfc/README.md`'s registers — this RFC claims no schema lane, no
    migration position and no evidence kind.
20. **All four §8 instruments are in the `verify` target, and `make schema-check` is green with
    them there.** *RED:* remove any one from the `verify` target. **This criterion is RED at
    HEAD for a reason that is not this RFC's:** `tools/verify-scaffold.mjs:104` pins `verify`'s
    dependency list by **exact-line regex**, and the shipped `Makefile:60` already carries two
    targets that regex does not admit (`work-index`, `account-data-lifecycle-check`), so
    `make schema-check` fails at `f0d5460` before this RFC touches anything. The implementer
    repairs the scaffold check to assert **set-containment** of the required targets rather than
    line equality, and only then adds the four. *Wrong impl:* editing the regex to hardcode a
    second exact line, which re-arms the same trap for the next instrument.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The `design/05` §3-forms amendment naming the component layer beneath the form inventory, and the `design/03:323` B1-residual correction (Deviations 1–2) — law 5 work, not this RFC's | OWNER | `planning/intent-amendment-handoff.md` | |
| D2 | Seat ids, seat budgets and the module→seat binding these components render into | claude (the concurrent `rfc/module-registration.md` fork; the pin is in `rfc/README.md`) | that RFC's landing commit | |
| D3 | `docs/evidence-presentation.md` — the canonical description of the shipped vocabulary, plus the `docs/theming.md` note for §8.4's widened sweep | codex | this RFC's implementing commit | |
| D4 | **The six legacy transition families lose the square identities required by `square_set` and `relation_overlay`**: A3 measured 0/3,371 transition observations retaining squares. [[D1564]] makes the retention repair a 1.0 producer obligation; honest-empty cannot discharge it | `semantic-collectors.md` | the emitter-retention landing with the 0/3,371 negative turned into set-equal typed coverage | |
| D5 | **Arrow activation has two halves.** Existing exact directed payloads in §3.6a need the sealed `relation_overlay`, while the `arrows` preference needs a real `effectiveArrows` consumption clamp. [[D1564]] resolves the former owner fork as **activate**; [[D1568]] records why this is not a request for a duplicate chess collector | `module-registration.md` + this RFC | the coupled relation-renderer/clamp landing | owner half discharged 2026-08-25 by [[D1564]]; implementation open |
| D6 | The `distribution` operand for Maia policy carries an **optional** `mass` (`DrillScreen.svelte:417` renders *"frequency unavailable"* when absent). Whether a candidate with no mass may appear in a distribution at all is a selection question | `learner-modules.md` | that RFC's next amendment | |
| D7 | The `rfc/theming.md` criterion-2 repair itself — this RFC's §8.4 guards the **component tree**; the shipped sweep at `theme.test.ts:221` still cannot see the 16 sites in §7b outside it | `theming.md` | that RFC's next revision ([[D1433]]) | |
| D8 | Move-quality grade valence: which grades, if any, carry a registered `valence` token (§3.9 forbids valence on move vocabularies; the grade vocabulary is the one case where the owner may want an exception) | `move-quality-grades.md` | that RFC's next revision | |
| D9 | Participant comprehension of these components. §3 is derived from the evidence's shape and from the dossier's measured tails; **no arm of this RFC establishes that a learner understands a bar** | `planning/platform-alignment/evidence-presentation/participant-plan.md` | the R3 participant arm | |

## Open questions

1. **Does the `full_inspector` module use these components, or its own raw view?** §3.12 is
   disposition-gated to author/operator, and the inspector is a learner-reachable analysis mode.
   Recommendation: **components, with `magnitude`/`move_path`/`citation` at their widest budgets,
   plus a per-fact provenance drawer** — an inspector that dumps is the surface the owner is
   complaining about, at maximum volume. Flagged because the opposite reading of dossier §8
   decision 4 (*"keep raw evidence… in an explicit inspector"*) is defensible.
2. **Should `distribution` ever draw on the board?** §3.1 refuses arrows because a per-candidate
   arrow is a ranked-move recommendation. A *heat* over destination squares is arguably the same
   information in a form that ranks nothing legible. Recommendation: **no in v1** — it is a
   ranking rendered as a gradient, and law 8's boundary should not be tested by a colour ramp.
3. **Does `outcome_split` render from the learner's perspective or from White's?** The operand
   requires a `perspective` and `corpus-sentences.ts:16` names both colours today.
   Recommendation: **`side_to_move` by default with the colour names always visible**, because a
   learner-relative bar silently inverts when the learner plays Black and nothing on screen says
   so. Flagged because the opposite is friendlier and is what most sites do.
4. **Is `claim`'s counter-case (*"It can be wrong when: …"*) always rendered, or on request?**
   `claim-presentation.ts:8` always includes it in prose. Always-rendering is honest and doubles
   the block's height in a rail seat; on-request risks a claim reading as settled.
   Recommendation: **always for `author_declared`, on request for `ledger_bound`** — the weaker
   the binding, the louder the caveat.
5. **Should the label registry carry a locale seam now or later?** Every entry is a user-facing
   string, and adding the seam after 25+ vocabularies exist is the expensive order.
   Recommendation: **structure the registry so a locale layer is additive** (entries keyed by
   vocabulary and member, no inline concatenation) **and do not build the layer**, since no
   locale requirement is ruled.

## Ledger rows

Proposed — ids assigned at landing; head was **D1434** at drafting.

- 🐞 **The label layer's one existing instance is a partial map that renders raw ids for three of
  its four members.** `api.ts:1458`'s `evidenceKindLabel` labels `bestline` and returns the id
  for `eval`, `wdl` and `tablebase` — so **`wdl` reaches a learner as `wdl`**. A partial map is
  worse than none because it reads as discharged. Repaired by §6b/6c; the totality requirement is
  criterion 3.
- 📊 **The [[D1433]] theming hole is 16 declarations in 7 files, not two.** Re-derived at HEAD
  over every `<style>` block in `apps/web/src`: 6 named CSS colours and 10 CSS system colours,
  of which 3 are `var()` fallbacks (a latent rather than live OS-follows-theme bug) and 3 are in
  `GameStoryScreen.svelte`, which the shipped sweep exempts at `theme.test.ts:220`. Sites in §7b.
- 📊 **The evidence layer is complete and correct in prose at exactly the place it renders
  worst.** `corpus-sentences.ts` implements a 100-game per-move outcome floor, a population
  guard, a typed abstention with two reasons, a committed-move locator and a recency arm — and
  emits `readonly string[]`. The presentation defect is **not** an evidence defect, and fixing it
  requires deleting no producer logic. This is the strongest argument that the missing layer is a
  layer and not a rewrite.
- 📊 **The convention and the number are in different DOM elements, and either renders alone.**
  `DrillScreen.svelte:1150` renders the model/band sentence and `:1151` renders
  `"Nf3 31% · e4 22%"`; neither depends on the other. Law 8's anti-pattern is usually read as a
  warning about the LLM's third clause; this is the first two clauses, shipped. Repaired by §5c.
- 💡 **Every instrument in this RFC needs a non-regex arm, because the enum ids that matter are
  single words.** `degraded`, `preserved`, `achieved`, `voided` and `stats` have no underscore
  and no `@version`; no id-shaped regex will ever see them. The registry's **totality** is the
  only instrument that can, which is [[D526]]/[[D1433]]'s lesson generalised: an instrument built
  from the defect's own assumption reproduces it, so the fix is a second instrument of a
  different *kind*, not a better pattern.
- 🐞 **`make schema-check` is RED at HEAD, and the cause is an instrument that forbids adding
  instruments.** `tools/verify-scaffold.mjs:104` asserts the `verify` target by exact-line regex;
  `Makefile:60` already carries `work-index` and `account-data-lifecycle-check`, which that line
  does not admit, so the check has been failing independently of any draft. Found while running
  this RFC's own gate. The repair is set-containment, not a longer literal — a scaffold check
  that fails whenever the scaffold grows will be satisfied by deleting targets. Criterion 20.
- 💡 **`design/05`'s form inventory is a channel list and cannot specify a rendering.** Nine
  forms, no row that distinguishes a distribution from a citation. Every string in §1 satisfied
  "renders as a sentence" honestly. The design-tier amendment is Discharge D1; the row exists so
  the gap is ledgered even if the amendment waits.

## Changelog

- 2026-08-25 — corrected on [[D1569]]. The guided-hint overlay consumes a selected member of the
  measured per-family horizon registry, never a generic hint-target wrapper or raw PV.
- 2026-08-25 — amended on [[D1564]]/[[D1568]]. The former “no vector producer” statement was
  split after re-deriving the catalogue: many exact payloads already retain directed relations,
  while six legacy transition families genuinely lose squares. Added the thirteenth component,
  `relation_overlay`, sealed it to the same admitted evidence item as its equivalent sentence,
  made existing directed projections renderer obligations, and converted transition/hint-horizon
  gaps from dark optional arms into explicit producer-coverage failures. Arrow activation is no
  longer an owner question.
- 2026-08-24 — drafted on the owner's *"where are all the nice ux components?"* commission, from
  R3's landed dossier and the [[D1431]]/[[D1434]] census. Twelve components derived from the
  shipped operand types rather than from a visual inventory (§3); honest-empty given a rendering
  obligation and a DOM-assertable distinction from zero (§4); law 8's anti-pattern made a type
  error rather than a guideline (§5); the label layer specified with **three** enforcement arms
  after finding that the single-word enums defeat every regex (§6, criterion 5); the [[D1433]]
  hole re-derived at 16 sites and its criterion given a self-check so it cannot be emptied (§7,
  criterion 11); nine discharges recorded, of which **two are genuine blockers with named
  owners** — D4's missing square operands for all six transition families and the then-unruled
  D5 arrow activation. The 2026-08-25 amendment supersedes D5's producer diagnosis without
  erasing its history. Cross-draft ownership pin with `rfc/module-registration.md` recorded in
  `rfc/README.md` per [[D1381]].
