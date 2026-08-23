# RFC: Player style — measured habit cards, and the sentence they are allowed to say

- **Status:** draft — 2026-08-23. **The licence is honest and partial, and that is stated rather than finessed.** [[D1093]]'s drafting mandate enumerates exactly three lanes ([[D1031]] variants, [[D1041]] time controls, [[D1060]] famous games) and **this is not one of them**; worse, this lane carries a *contrary* routing note — [[D1055]]: *"foundation amendments + measurement precede D552 surface RFC"* (`design/BACKLOG.md:392`). What licenses the draft is that the owner has twice instructed full breadth and depth and **explicitly rejected the scope cut** this lane previously received ([[D1232]], [[D1230]]), and [[D552]] is their verbatim ask. **What no licence can supply is the measurement**: this is the one lane where the owner's signature is not the binding constraint — §11's blockers are named, cited, and several are ~8 weeks of somebody's real play. Acceptance is therefore split: the mechanism can be accepted; **no card renders until its own row clears its own floor.**
- **Author:** claude (drafted from `planning/style/rfc-derivation.md`, 560 lines, and the two dossiers below, which until today were cited by no RFC — [[D1091]])
- **Created:** 2026-08-23
- **Design refs:** `design/00-thesis.md:14` (*"closer to a rehearsal loop than to an analysis dashboard"* — the shape this surface must not become), `:93-95` (the assessability rule). **`design/03-product-breadth.md` has no style surface**; the amendment is proposed as a ledger row, never written here (law 5 — see Deviations).
- **Research:** `design/research/player-style-metrics.md` (R12 — 36 accounts × 200 blitz games, 7,200 games, 261,892 decisions), `design/research/longitudinal-style-feedback-contract.md` (R21 — the aggregation contract, executable), `design/research/shared-style-atoms-as-bot-traits.md` ([[D1062]] — a measured refusal, carried in §10.4)
- **Depends on:** `rfc/longitudinal-store.md` (accepted, **unimplemented, and its acceptance contested** — [[D973]]/[[D1011]]; §11.1), `rfc/runtime-opening-identity.md` (accepted, **compilation blocked by [[D1052]]**), `rfc/recorded-clocks.md` (draft — its Discharge D4 already owns the clock join), `rfc/review-map.md` (draft — owns the per-game surface this RFC must not duplicate)
- **Parent / amends:** none. Sibling of `rfc/review-map.md` (per-game facts) and of the future skills RFC ([[D549]]); the three-document split is argued in §9.
- **Supersedes / superseded by:** —
- **Planning:** `planning/style/`

```tabiya-claims
none
```

## Summary

This RFC specifies the **complete** learner-facing style surface the owner asked for: a registry of twelve measured habit cards, the grammar every card must carry, the two enforcement points that keep a habit from becoming a judgement, the privacy inheritance, the sharing contract, the drill-down, and the exactly-one-sentence licence an LLM gets. It also specifies **what the owner's own example sentence may and may not say**, fragment by fragment, and finds that three of its five fragments are grounded aggregates while two become legal only beside a shown baseline.

Nothing here is cut for document size. Where something does not ship, §11 names the blocker and cites it, and the acceptance criteria are written so that **an unblocked mechanism can be accepted while a blocked card stays dark** — because the alternative is a surface that lies for eight weeks and then becomes true.

Two findings drive the design. First, **zero of the twelve metrics are production-ready** — verified, not asserted: R21's instrument is set-equal to R12's retained rows and *fails* on an omitted, added or re-floored metric. Second, and less obvious, **a law-8 violation in this lane need not contain a single banned word**: it can live in the tier rule, where `voiceCheck` — which inspects sentences — cannot see it. §6 is the second enforcement point that exists for that reason.

## Motivation

The owner's ask, verbatim (`design/BACKLOG.md:148`, `:147`):

> *"chess.com has so much feedback after a session and can tell you all your openings and how accurate you are with them"* … *"maps your opening style to (aggressive-solid, theoretical-creative) and maps it to the greats"* … *"early game is solid, but in the midgame your play is too simple and positional, not enough tactics"*

Read as a specification that last sentence is this lane: **one sentence containing four claims, three of which are judgements about a person**, delivered over a sample the person did not choose. §5 decomposes it. The honest reply to it is not *no* — it is that the shape is legal, three fragments are grounded, and *"too"* and *"not enough"* become legal the moment a validated baseline stands next to them.

**What is out of scope, each with a named home and owner** (per [[D1230]]: a deferral without a home is not a deferral):

| Out of scope | Home | Owner |
|---|---|---|
| Per-game observation cards (*"Carlsbad appeared in 2 of 3 recorded opportunities"*) — these ship on the learner's **first** game and **must not be labelled style** | `rfc/review-map.md` §3 | claude (drafted) |
| Skill credits, tiers, mastery | the [[D549]] skills RFC | claude |
| Bot personas from the same atoms | `rfc/bot-policy.md`, `planning/bot-roster/` | claude / codex |
| Grounded coaching prose and advice | the R13 grounded-coaching contract | claude |
| The `design/03` surface amendment | a ledger row (law 5) | OWNER |
| Time as a longitudinal observation | `rfc/recorded-clocks.md` Discharge D4 | claude |

## Specification

### §1 — Three objects that a single careless sentence collapses into each other

| | **Catalogue** ([[D1151]], ruled) | **Per-game fact** (`review-map`) | **Habit card** (this RFC) |
|---|---|---|---|
| Denominator | the **content catalogue** | the decision's **legal alternatives** | the **declinable** legal-alternative population, across games |
| Subject of the claim | the content | the move | **the person's choices** |
| Direction over time | monotone — only fills up | n/a | **non-monotone; can go down** |
| Law-8 exposure | ~zero: it claims nothing about the learner | low: it restates one decision | **the highest in the product** |
| Home | the pack card | the review screen | a review/profile card |

**The catalogue is lawful precisely because it never claims skill.** It is the [[D345]] exposure-restatement pattern, which R20 names as a *disqualifier* for skill credit. The instant a catalogue cell is read as *"you are good at Carlsbad structures"* it becomes the thing R20 refused. A habit card is the opposite object: it claims something about the learner and must therefore carry every operand §4 requires. **They are near-opposites, and this RFC may not blur them** — criterion 12.

### §2 — The metric registry, defined by derivation and never by a copied list

`STYLE_METRICS` (new, `packages/runtime/src/style-metrics.ts`) is the production registry. Per [[D1240]] it is **not** specified here as a list of twelve; it is specified as a **set-equality obligation** against the instrument that measured it:

> `make style-registry-check` asserts `STYLE_METRICS` is **set-equal by feature id and floor** to the rows of `tools/r21-style-feedback-contract/registry.ts` whose `persistentFloors` value is non-null, and **fails on an omitted, added or re-floored metric**.

The count at drafting is **twelve** — recorded as a **drift tripwire only**, never as the criterion. R21's own instrument already enforces this shape against R12 (`longitudinal-style-feedback-contract.md:26-29`); this RFC extends the same assertion one layer down to production.

Each row carries, normatively:

| field | meaning |
|---|---|
| `featureId` | the literal versioned atom (e.g. `move.castle_side@1`) |
| `unit` | `decision` or `game` — **not interchangeable**; see §2.2 |
| `floor` | the metric's **own** measured floor in games — 25, 50, 100 or 200 |
| `blockerClass` | `opening_reference` \| `denominator` \| `collector_store` — §11 |
| `referenceId` | the versioned reference population, where one is used |
| `phaseScope`, `timeControlScope` | the window the floor was measured in |

**Measured floors, quoted from R12's stability table** (`player-style-metrics.md:107-126`) — reproduced so a reader can check the tripwire, not so an implementation can copy them: surprisal 25 (ρ 0.974), family entropy 100 (0.935), fianchetto setup 25 (0.865), fianchetto knight-screen **200, ceiling** (0.757), castle kingside 50 (0.896), castle queenside 50 (0.907), clock spend opening 100 (0.950) / middlegame 50 (0.971) / endgame 25 (0.932), pawn residual 100 (0.932), extended-centre-pawn **200, ceiling** (0.871), early-queen 100 (0.931).

#### §2.1 Per-metric floors; a global confidence label is unrepresentable

Floors range 25 → 200. R12: *"a display floor must pass every larger measured sample, not merely one isolated size"* (`:104`). Therefore `floor` is a **required per-row field with no default**, and no type in this RFC admits a registry-wide confidence label. **A failing row abstains; it does not inherit another row's floor** (`longitudinal-style-feedback-contract.md:171`). Criterion 4.

#### §2.2 `unit` is load-bearing: the castling denominator may not be relabelled

Seven metrics are per **decision**; five are per **game** (2 castling, 2 fianchetto, 1 entropy). The accepted store defines opportunity **per decision**; R12 defines castling rate **per game**, eligibility fixed by whether the learner retained a castling right at their first move. R21: *"These are different populations and can produce different numbers. Reusing the store's generic opportunity count would silently change the measured metric"* (`:70-74`).

**The two lawful resolutions, and only these** (`:78-80`): add the exact **game-level eligibility projection**, or define a new **decision-level** castling metric and **re-run R12's stability gate**. This RFC selects the first — it preserves a measured floor of 50 rather than spending a new measurement campaign — and **forbids the third option by type**: a `unit: "game"` row may not read a decision-scoped opportunity count. Criterion 5.

#### §2.3 The five missing atoms — specified here, registered elsewhere

Metrics 3, 4, 10, 11 and 12 need five literal projections that do not exist in production. Their exact semantics are **already implemented** as reference code in `tools/d1062-style-bot-harness/style-atoms.test.ts` — the strongest wiring finding in the lane, and it includes the Chess960-correct castling classifier.

| atom | semantics |
|---|---|
| `structure.fianchetto_setup@1` | the declared bishop + advanced-pawn configuration |
| `structure.fianchetto_knight_screen@1` | the same, plus the same-side knight screen |
| `move.role.pawn@1` | move-role residual over the legal-alternative population |
| `move.pawn_to_extended_center@1` | destination-set residual |
| `move.early_queen@1` | role × ply (queen move before ply 16) |

**Castling classification is pinned**: `chessops.castlingSide`, **never a two-file heuristic** — D1062 proved a `b1`/`a1` fixture makes the heuristic disagree (`shared-style-atoms-as-bot-traits.md:42-46`), and this intersects [[D1031]]'s Chess960 admission. Criterion 6.

**Registration lands by amendment to the owning collector RFC, not here** — R21's order is explicit: *"No style prose lands in those RFCs"* (`:166-167`). Home: the semantic-collector RFC family; owner: claude to draft, codex to implement. **[[D1062]] removed the one argument for delay**: their failure as global bot weights *"is not a reason to omit them from the shared registry"* (`:87-91`).

### §3 — What every card carries

Non-negotiable, from R21's presentation contract (`:124-127`). A card missing any field **does not render**; it abstains with a reason.

| field | why |
|---|---|
| metric id **and version** | a version change is a new metric, not a substitution (§7) |
| the literal value | the arithmetic is never hidden behind a word (§6) |
| 95% game-bootstrap interval | at 200 games the median widths are 0.064 (fianchetto setup), 0.117 (kingside castling), 0.193 bits (surprisal), 0.424 bits (ECO entropy) — `player-style-metrics.md:130-132` |
| game **and** decision counts | the two denominators are different populations (§2.2) |
| **this metric's** floor | never a global one (§2.1) |
| window, phase scope, time-control scope | *"the measured window that makes 'midgame' a fact rather than vibes"* |
| reference id + version, where used | §7 |
| exact contributing game/ply refs | the drill-down (§8) |
| abstention reason, when abstaining | §3.1 |

#### §3.1 Abstention is a first-class render, not an empty state

A card below its floor renders **the reason and the distance**: *"This card's floor is 25 games; 11 measured."* It is never filled from a weaker detector, and an empty category is not a gap to be closed — R20: *"no five-card dashboard is required merely because the taxonomy has five names"*. Criterion 7.

### §4 — The law-8 boundary in prose

**Permitted** (R21's own example, `:139-141`):

> Across 63 measured rapid games, you reached the declared fianchetto setup in 18 of 63 games (95% interval …). This card's floor is 25 games.

**Refused from the identical bytes** (`:143-146`):

> You are a solid positional fianchetto player and should seek sharper kingside attacks.

*"The second sentence adds a **type**, **valence** and **prescription**. None is an operand."*

The rule, in one sentence: **measured frequencies over registered projections, with denominators, floors, intervals and drill-down references, may be stated; types, valences and prescriptions may not.**

#### §4.1 The vocabulary gap this RFC must close, measured at HEAD

`voiceCheck` enforces an allow-list derived from the admitted packet, plus `BANNED_JUDGEMENTS` and `PRESCRIPTIVE_VERBS` (`packages/runtime/src/voice.ts:110-119`). Executed at HEAD: `BANNED_JUDGEMENTS.length === 32`, `PRESCRIPTIVE_VERBS.length === 24`.

**And the three words in the owner's own sentence are not among them.** Executed: `BANNED_JUDGEMENTS` contains **`"too"` → false, `"simple"` → false, `"positional"` → false**. So the exact sentence R21 refuses would pass the shipped filter today.

This RFC therefore adds a **card-scoped** refusal set — `STYLE_REFUSED_TERMS` — covering at minimum `too`, `enough`, `simple`, `positional`, `tactical`, `aggressive`, `solid`, `creative`, `patient`, `strength`, `weakness`, and requires that a term in it renders **only when a baseline operand is present in the same sealed card** (§5). Criterion 8 is the failable form: a card rendering *"too simple"* with no baseline operand must fail, and the same card with the baseline present must pass.

### §5 — The owner's sentence, decomposed

Verified verbatim against `design/research/player-analysis-and-skills.md:286-296`. **This table is normative.**

| Fragment | Grounded core | May **not** be added |
|---|---|---|
| *"early game is solid"* | opening-band aggregate: structure-preservation residual + engine-loss distribution vs the **named band baseline** | **"solid"** as a trait; any causal reading. Print the number or the convention — never only the word |
| *"in the midgame"* | ply/phase band, disclosed exactly as the collectors measure it | a phase boundary the packet does not carry |
| *"your play is too simple"* | trade/simplification residual over opportunities, mid-band | **"too"** — a norm. Admissible **only** as an explicit population comparison with the baseline shown (*"above the band median of b"*) |
| *"and positional"* | redundant with the above | **"positional"** as a diagnosis — **refused**; R12 refuses composites without a separately validated formula |
| *"not enough tactics"* | phase-split tactic-opportunity conversion: of N mid-band decisions where a tactical event was available, played k; band baseline b | **"not enough"** — same rule. **And no prescription**: *"play more tactics"* belongs to the coaching contract |

R21 restates it at the aggregate level, and this is the sentence the RFC binds itself to (`:157-161`):

> *"Nor may a summary say 'your middlegame is too simple' merely because it has a pawn or reply-breadth residual. Four candidate metrics, **including reply breadth**, failed R12's persistence gate; the words 'simple,' 'positional,' 'not enough tactics,' 'strength,' 'weakness' and 'needs work' require a separately validated aggregation rule and baseline. **The LLM is not that rule.**"*

### §6 — The second enforcement point: a judgement can hide in the tier rule

**This section exists because `voiceCheck` cannot catch the violation it is meant to catch.** R20 states it exactly: converting neutral occurrence into a badge *"would be an **LLM-free violation of law 8**: the manufactured judgement would live in the aggregation rule instead of the prose"*. A tier threshold is a number; a sentence filter inspects words.

The **only** admissible tier rule is `reference_quantile_lower_bound@1`, adopted verbatim from R20, with four states — `insufficient_evidence`, rate rendered as `established`, `above_reference`, `distinctive` — and the binding constraint that **each state renders the rate, interval, population, phase, time-control scope and version alongside the label**. A later owner ruling *"may put a ceremony over these states, but may not hide the arithmetic or rename insufficient evidence"*.

Enforcement is a **rule check, not a text check**: `assertTierRuleGrounded` fails at build time if any registered tier rule is not `reference_quantile_lower_bound@1`, or if any state is reachable without its arithmetic operands in the same card. Criterion 9 is failable in both directions: a rule mapping a rate to a bare word must fail; the admissible rule must pass.

### §7 — The reference population, and the rating that may select but never speak

R12 selected the opening-surprisal reference by the decision player's **rating band**. [[R15]] permits a rating to *select* a population and forbids it from changing what is said: *"Selection, yes; rendering, never"* (`rfc/longitudinal-store.md:462-465`).

Therefore: a production card **exposes the versioned reference id**, stays descriptive, and the same value **may not** feed move grades, voice, hints or verdict wording. And the trap, stated because it is easy to walk into: **a fixed all-learner reference is a different metric version requiring re-measurement, not a substitution** (`longitudinal-style-feedback-contract.md:60-66`). Criterion 10.

### §8 — Drill-down, privacy, and sharing

**Drill-down.** Every card links to its exact contributing game/ply references. A truncated list states **how many examples are hidden** — never silently truncated.

**Privacy is load-bearing and inherited, not invented.** R12's continuous vector re-identifies **35 of 36 accounts** across disjoint halves (`player-style-metrics.md:151-157`), which makes a style vector **behavioral identifying data**. The accepted store already answers this structurally: *"No table stores a per-learner metric vector, archetype, axis label, or composite"*, no cross-learner read path exists, and export is owner-only (`rfc/longitudinal-store.md:440-459`). **This RFC inherits those three pins and adds none of its own** — and adds sharing consent as an acceptance criterion (criterion 11), per R12's requirement that the vector *"must feed R18's export/delete/share-by-consent audit before production"*.

**Sharing** is explicit and per-card. A share card may render measured rows; it may not render a type, an axis, or a composite.

### §9 — Why this is one of three documents

Style, skills and the shared atoms are three RFCs. The full argument is `planning/style/rfc-derivation.md` §5.2; the decisive reason is **failure isolation**: if skills and style were one document, a failing *skill* measurement would block the two opening habit cards that already pass at ρ 0.974 and 0.935. [[D843]] already formalises it — *"same feature ids, two gates"* — and R21 gives four consumers four different must-prove columns (`:105-111`).

### §10 — What this RFC refuses

Each refusal is a **measured failure against a pre-declared gate**, not a preference. Carrying them is the difference between this lane and astrology.

| Refusal | The measurement |
|---|---|
| **Natural archetypes / player types** | k=4–12 clustering, median ARI **0.251–0.417** against a **pre-declared 0.70 gate**; seven of nine baseline solutions contain a one-account cluster |
| **Maps-to-the-greats / "GM twin"** | two independent grounds: the clustering above failed, *and* a GM corpus is a differently-sampled population whose distances mean nothing without the validation that just failed |
| **The four refused metrics** | fianchetto-unblock (ρ 0.188, same-side 50.0%), forcing-choice (one band), non-pawn-capture (72.2%), opponent-reply-breadth (one band). *"Using the four refused metrics merely because their rank correlation looks high"* is named as refused |
| **A global confidence label** | §2.1 |
| **Composite trait words** | *"tactical," "positional," "aggressive," "creative," "patient" or similar compositions without a separately validated formula"* |
| **Absence readings** | *"interpreting failure to reach an endgame as a preference to avoid it"* |
| **LLM-written weaknesses or advice** | refused from these atoms; R13 owns coaching aggregation |
| **The aggressive↔solid axis** | its components include an R12-**refused** metric (forcing-choice). The theoretical↔creative half is buildable — but ships as **two separate cards, not an axis**, because a two-pole label is itself a composite needing its own validation |

**The honest substitute for maps-to-the-greats**, named by both dossiers: a **labelled authored quiz that says it is a quiz**, byte-separate from measured play, *"because it reports answers the learner deliberately supplied rather than pretending a natural type was discovered."* Not specified here; home is a future product-surface RFC, owner OWNER to commission.

#### §10.1 The LLM's entire licence

It *"may paraphrase **one sealed admitted card**. It may not choose the card, compare against an undeclared population, diagnose, advise, grade, create an archetype or recommend a move"* (`:130-135`). Criterion 13.

### §11 — The blockers, named and cited

**None of these is a deferral.** Each is a thing that is not true yet, with its owner.

#### §11.1 The store: accepted on paper, absent in code — and the chain is three deep

Executed at HEAD: `grep -rn "learner_observations\|learner_structure_stats\|decision_class" apps packages tools` → **zero hits**. The identifiers appear in five files, all documents. Its acceptance is itself contested twice ([[D973]]/[[D1011]]: marked `accepted` while all three Open questions say *"resolve before implementation"*).

**So the sequence is: resolve D973/D1011 → implement migration 26 + the derivation → then a style consumer.** This RFC **must not** claim the store as a satisfied dependency. Criterion 14 asserts the precondition explicitly rather than assuming it.

**The one genuine accelerant, and its exact limit.** The store is *a projection of the run event log*, so **every game already imported or played back-derives** when it lands — deferral *"costs a rev bump and a rebuild, not a migration"*. Delay loses nothing already recorded. It does **not** manufacture `played` decisions that were never made.

#### §11.2 The other three blockers

| Blocker | Metrics | Owner | Note |
|---|---|---|---|
| **Opening reference + runtime identity** | 1, 2 | claude | `runtime-opening-identity` is accepted but **[[D1052]] blocks compilation on a mis-transcribed SHA** — a one-line fix unblocking the lane's two best-measured habits. Opening identity is additionally **refused in shipped behaviour** today (`apps/server/src/position-evidence.ts:25`) |
| **Typed clocks** | 7, 8, 9 | claude | Already answered — `rfc/recorded-clocks.md` Discharge D4 owns *"time as a longitudinal observation"*. **Wire it; do not re-derive it.** The store's landing ingest explicitly excludes clock spend |
| **The five atoms + castling eligibility** | 3, 4, 5, 6, 10, 11, 12 | claude / codex | §2.3 |

#### §11.3 The blocker no ruling can lift

All twelve floors additionally require **≥8-week early/late split and blitz↔rapid transfer**, because R12's population is a deliberately biased **59-hour, high-activity blitz** cohort which says so in its own limits: *"the measured floors below are prototype floors for this population, not 1.0 defaults."*

Import shortens this for `game`-class rows — a learner can import 200 games in a minute — but **import cannot produce `played` rows**, and `played` is the class every *"your play"* sentence means. **There is no way to buy this.** It is why §12's acceptance separates mechanism from card.

### §12 — Ledger lifecycle

The rows this RFC's landing flips, and the rows its implementation flips, are listed in §Ledger rows. **Acceptance of this RFC asserts the mechanism, not the cards**: criteria 1–13 are satisfiable today or on a named blocker's landing; criterion 15 is the gate that keeps every card dark until its own row clears its own floor.

## Deviations from design

**One, and it is owner-tier.** `design/03-product-breadth.md` has **no style surface** — its only `style` hits are unrelated CSS. A habit card therefore has no home in the intent tier, exactly as game review did not. Per law 5 this RFC **proposes** the amendment through a ledger row and does not write `design/03`. Owner: OWNER.

## Acceptance criteria

1. **The registry is derived, never copied.** `make style-registry-check` passes, asserting `STYLE_METRICS` set-equal by feature id and floor to R21's non-null-floor rows. *Wrong implementation that passes without this:* one that hard-codes twelve rows and silently drifts when R12 is re-measured. The count is a tripwire, not the assertion.
2. **A re-floored metric fails.** Mutating one `persistentFloors` value in the R21 registry fixture turns criterion 1 red. *(Able-to-fail control for criterion 1.)*
3. **An added or omitted metric fails.** Same, by adding a thirteenth row and by removing one. *(Two arms; both must be red.)*
4. **No global confidence label is representable.** A type-level assertion that `floor` is required per row with no default, plus a fixture where two cards with floors 25 and 200 render **different** floor text. *Wrong implementation:* a single "high confidence" badge above the set.
5. **A `unit: "game"` row cannot read a decision-scoped opportunity count.** Type-level refusal plus a fixture: the castling metric fed the store's generic per-decision opportunity count fails to compile. *Wrong implementation:* one that relabels the denominator and produces a plausible different number.
6. **Castling classification uses `chessops.castlingSide`.** The `b1`/`a1` Chess960 fixture from D1062 must classify correctly, and a two-file heuristic must fail it. *(Red before, green after.)*
7. **Abstention renders the reason and the distance.** A card at 11 games against a floor of 25 renders both numbers; a card that renders an empty state with no reason fails. A second arm: an abstaining category **must not** be filled from a lower-floor detector.
8. **`STYLE_REFUSED_TERMS` requires a baseline operand.** Two arms, both required: a card rendering *"too simple"* with **no** baseline operand in the sealed card **fails**; the identical card **with** the baseline operand present **passes**. *(This criterion is red at HEAD by construction: `BANNED_JUDGEMENTS` contains none of `too`/`simple`/`positional`, executed.)*
9. **`assertTierRuleGrounded` is a rule check, not a text check.** A registered tier rule other than `reference_quantile_lower_bound@1` fails the build; a state reachable without its arithmetic operands in the same card fails; the admissible rule with full operands passes. *Wrong implementation:* a `voiceCheck`-only guard, which inspects sentences and cannot see a threshold.
10. **Reference version is exposed and rating never renders.** A card using a reference exposes its id and version; a fixture asserting the reference value reaches any grade, hint, voice or verdict path fails. A fixed all-learner reference is asserted to be a **new metric version**, not a substitution.
11. **The privacy pins are inherited, not restated.** The store's three pins hold by reference; a sharing action without recorded consent fails; export remains owner-only.
12. **The catalogue and a habit card are distinguishable by type.** A fixture attempting to render a catalogue cell through the habit-card renderer fails. *Wrong implementation:* one where a catalogue count and a habit rate share a component and differ only by label.
13. **The LLM paraphrases one sealed card or nothing.** Fixtures: paraphrasing two cards fails; choosing the card fails; comparing against an undeclared population fails; paraphrasing one sealed admitted card passes.
14. **The store precondition is asserted, not assumed.** A build-time check that fails while `learner_observations` is absent, with the message naming D973/D1011 and migration 26. *(Red at HEAD; this is correct, not a defect.)*
15. **No card renders below its own floor — the gate that keeps this honest.** For each registry row, a fixture at `floor − 1` games renders abstention and a fixture at `floor` renders the value. *Wrong implementation:* one that renders a rate at 3 games because the mechanism works.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The five missing atoms + the castling game-eligibility projection are registered by amendment to the owning collector RFC — §2.3, with no style prose landing there | claude | that RFC's amendment commit | |
| D2 | The store's move-role, clock and configuration observation rows — the rev `longitudinal-store` already licenses as a rev bump, not a migration | `longitudinal-store.md` | that RFC's next rev | |
| D3 | [[D1052]]'s one-line SHA correction, unblocking metrics 1–2 | claude | the `runtime-opening-identity` amendment commit | |
| D4 | The clock join — already owned by `recorded-clocks` Discharge D4; this row exists so the dependency is visible from both ends | `recorded-clocks.md` | that RFC's landing | |
| D5 | The `design/03` style-surface amendment (law 5) | OWNER | the ruling's landing commit | |
| D6 | The ≥8-week early/late and blitz↔rapid transfer measurement — R12 §8's residual arm; **no ruling substitutes for it** | claude | `planning/style/` measurement landing | |
| D7 | The labelled authored quiz as the honest substitute for maps-to-the-greats — a separate product surface, if wanted | OWNER | the ruling's landing commit | |

## Open questions

1. **⚠ OWNER — does [[D1151]]'s refusal reach a habit card in review?** D1151 ruled campaign progression is denominated in the catalogue, *"Refused thereby: (b) the learner's own history, which would have introduced the first number this product has ever shown a learner about themselves."*
   **The premise is false and [[D1190]] records it**: `RatingScreen.svelte` already renders a learner rating with disclosures and band marks. The threshold that ruling invoked had already been crossed.
   Also relevant, and also the owner's: the refused object was [[D302]]'s **process** histogram (plies · assistance rungs · seal), which shares **no metric, no denominator and no data source** with R12's habits — and [[D332]] records the owner wanting learner history.
   **This RFC assumes nothing.** Recommendation: **yes for review, no for progression**, with D1151's own discipline applied — the *what's-missing* mark lives on the card, the number never becomes a tier, and no card is a gate. **Acceptance-blocking**, because it decides whether the surface exists.
2. **⚠ OWNER — which `decision_class` does a card count?** `played` only, or `played` + `game` behind an explicit filter? Recommendation: **`played` only** for any *"your play"* sentence; `game` rows may power a separately-labelled *"in the games you imported"* card that never says *"you"* — the store *"does not assert that player is the learner"*.
3. **⚠ OWNER — the aggressive↔solid axis.** Refused on measurement (§10). Confirm the refusal, or commission the separate validation its own formula would need.

## Ledger rows

Proposed — id assigned at landing; head was **D1297** at drafting.

- 🐞 **`BANNED_JUDGEMENTS` does not contain `too`, `simple` or `positional`** — executed at HEAD; `BANNED_JUDGEMENTS.length === 32`. The exact sentence R21 refuses passes the shipped filter. Closed by criterion 8's `STYLE_REFUSED_TERMS`.
- 💡 **`design/03-product-breadth.md` has no style surface** — law 5; the amendment is the owner's (Discharge D5).
- 📊 **The five style atoms already have exact reference implementations** in `tools/d1062-style-bot-harness/style-atoms.test.ts`, including the Chess960-correct castling classifier — production registration is transcription plus a gate, not design.
- 🐞 **[[D1055]]'s routing note and this RFC's existence are in tension** — the note says foundation and measurement precede the surface RFC; the owner rejected the cut that note produced. Recorded so the next reader sees both.

## Changelog

- 2026-08-23 — drafted. Full-ask scope per [[D1230]]: all twelve metrics, both enforcement points, privacy, sharing, drill-down and the sealed paraphrase specified; every gap in §11 is a **named blocker with a citation and an owner**, never a scope cut. Licence stated honestly in Status: [[D1093]] does not reach this lane and [[D1055]] points the other way, but the owner rejected the previous cut and [[D552]] is verbatim. Three findings verified at HEAD rather than quoted: the store has **zero** hits in `apps`/`packages`/`tools`, `SEMANTIC_EVENT_PROJECTION_IDS` is **67**, and `BANNED_JUDGEMENTS` (**32**) contains none of the owner's three words — which became criterion 8 rather than a note.
