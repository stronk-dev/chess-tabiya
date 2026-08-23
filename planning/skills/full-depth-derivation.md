# Skills as a progression surface — the full-depth derivation

**Lane:** F9. **Written:** 2026-08-23 by claude, on the owner's push-back against
`planning/skills/rfc-derivation.md`.
**Measured at:** HEAD `33f282c`, working tree dirty (codex committing continuously; 23 modified
files at read time). Where a line number differs between HEAD and the working tree it is given as
`WT / HEAD`. Nothing another agent holds dirty was touched: `planning/live-sources/`,
`planning/review/`, and every `M` file listed by `git status` were read only.
**Citation caveat:** `design/BACKLOG.md` is being edited live; its row line numbers drifted by 2–5
during the writing of this document (D842 read at both `:527` and `:529`). Cite the row **id**;
treat the line as a hint.
**Supersedes nothing.** The prior derivation's *findings* are almost all correct and are cited
throughout; its **central conclusion is wrong**, for one reason it did not check.

---

## 0. The correction that produced this document

The prior derivation closed with: *"do not draft a skills RFC. The lane's v1 is not a skills
feature… **the owner's D549 ask gets its first visible pixel from the review lane, not from this
one**"* (`planning/skills/rfc-derivation.md:568`, `:610-611`), landed as [[D1193]]
(`design/BACKLOG.md:445`).

The owner: *"well what do you mean no rfc at all? does it have the depth we need?"*

**It does not, and the reason is not scheduling.** A per-game observation card is one card, once,
about one game. The ask is a **taxonomy that accumulates** — a thing that is still there next
Tuesday and is *more* there than it was. Those are different objects, and the prior derivation
recommended the cheap one because it priced the expensive one against a blocker it read as
structural. That blocker is §2, and **it is not structural.**

### The ask, verbatim — [[D549]], `design/BACKLOG.md:145`

> **Skills/concepts earned from game review — chess.com's "skills" taxonomy as a progression
> surface (owner, 2026-08-20).** Chess.com fills five categories — *fundamentals, openings,
> tactics, strategy, endgames* — with named concepts and patterns a review detects and credits to
> the player. Owner: *"we need something like THAT too — it can support our campaign mode or
> general progress tracking and gamification."* Fits what already exists better than it first
> looks: the shipped-but-consumerless `attempt_concepts` ([[D300]]) is exactly a concept-credit
> stream, and [[D297]]'s knowledge-as-key device is the fun mechanism this feeds. **Constraint: a
> skill is credited from detected evidence, never LLM opinion (law 8), so this is downstream of the
> producer registry**

Four words in that row are the depth target and were not analysed as such: **taxonomy**,
**credited**, **progression**, **accumulating**. §1 makes each one concrete.

---

## 1. The depth target — what chess.com's skills surface actually is

Sources: `design/research/player-analysis-and-skills.md:56-58` (primary page fetched 2026-08-23,
`[V]`, [support article](https://support.chess.com/en/articles/16243840-what-are-skills-on-chess-com)),
`:60` (Insights / Advanced Stats), `design/research/grounded-skills-taxonomy.md`.

### 1.1 Its five parts, enumerated

| # | Part | What chess.com does | Source |
|---|---|---|---|
| 1 | **The taxonomy** | Five categories — Fundamentals ("core habits"), Openings, Tactics, Strategy, Endgame — each filled with *named concepts*. The concept names are human-meaningful, not detector names ("spotting a fork", "castling at the right time") | `player-analysis-and-skills.md:56` |
| 2 | **The credit event** | *One point per qualifying move*, marked **in the move list during review** so the learner sees where it came from. Detection mechanism **undisclosed** | `:56` |
| 3 | **The per-concept progress display** | "collect enough points and you'll master that Skill" — a per-concept counter against a hidden threshold | `:56` |
| 4 | **The accumulation** | Points persist across games; mastery is permanent; mastering one skill **unlocks the next in that category** (sequential unlock), with a celebration and a Coach congratulation | `:56` |
| 5 | **What the learner does with it** | Progress + unlock is the whole loop; the adjacent Insights product routes to *"if you struggle more with spotting checkmates or trapped pieces"* drill-downs, recency-weighted, with a same-rating peer comparison | `:56`, `:60` |

**That is the depth.** Five parts, and the prior derivation's recommended v1 supplies part 2 only,
for a single game, with no part 1, 3, 4 or 5. Its own text says so: *"the move-list marks
chess.com's Skills feature shows, grounded our way"* (`:356`) — **the marks, not the surface.**

**One honest limit on the depth target, and it matters for §3.** The repo's `[V]` source describes
**categories and a point counter — not a named-concept inventory**. Across all of `design/` and
`archive/brief-v2/` the product name "Skills" appears in **4 files, 8 times**; nowhere is a concept
*count* or a leaf taxonomy stated. The claim that the categories are *"filled with named concepts
and patterns"* comes from the owner's own D549 wording, not from the fetched article. So the leaf
taxonomy is **not inheritable** — nobody publishes one we could bind to our detectors, which is
why §3's option C reaches the top tier only. And no source anywhere says Skills routes to lessons
or puzzles; part 5 above is the *progress-and-unlock* loop, plus Insights' separate drill-down.

### 1.2 Where we deliberately differ, and why

| Part | chess.com | Ours | Reason |
|---|---|---|---|
| 2 credit event | absolute count, **no opportunity denominator anywhere** | `rate = credited events ÷ declinable opportunities` over F2's complete legal-alternative population | *"grindable by volume and by seeking easy positions"* (`:56`); [[D842]] `design/BACKLOG.md:527`. R12 already ran this denominator over **261,892 decisions** |
| 2 detection | **undisclosed** | registered projection ids, versioned, with `occurred_refs` reopening exact nodes | law 3 + R13 invariant 2; *"none publishes a denominator, a floor, or a re-derivable rule"* (`:84-87`) |
| 3 display | a counter toward a hidden threshold | a **mark** (§5), or a rate co-rendered with interval, opportunity count, population, phase, time-control scope and version | `grounded-skills-taxonomy.md:117-127` |
| 3 wording | `Brilliant`/`Great`/`Miss` are **rating-dependent** — same move, different word per player | forbidden: *"selection, yes; rendering, never"* — `rfc/learner-rating.md:990`, enforced as reachability test AC-11 | the named counter-example |
| 4 unlock | sequential unlock per category | admissible and *wanted*: [[D297]] knowledge-as-key; [[D842]] *"mastered skills OPEN content, never grade the player"* | `design/BACKLOG.md:527`, `:1101` |
| 5 peer comparison | same-rating peer baseline | **framing adoptable, mechanism not** — and the store has **no cross-learner read path by construction** (`rfc/longitudinal-store.md:442-455`) | `:84-87` |
| 1 taxonomy | five categories with named concepts | five category **names** adoptable as navigation; the concepts must be ours and grounded | §3 |

**What we may take, stated once** (`player-analysis-and-skills.md:84-87`):

> *"we may adopt their category names and their comparison-to-peers framing; we may not adopt a
> single one of their credit or score mechanisms as-is, because **none publishes a denominator, a
> floor, or a re-derivable rule**."*

**And one honest empty state that is ours alone.** R20 closed all 67 semantic-event projections and
found **Openings and Strategy admit zero credits** — not "coming soon": opening identity establishes
*applicability*, not accuracy, and every structure/pawn/king/activity event is neutral until an
outcome or cited-theory join supplies valence (`grounded-skills-taxonomy.md:97-104`). *"An empty
category is not filled from a weaker detector"* (`:111-113`). So a five-card dashboard copied from
chess.com would ship two cards that lie. That is a deliberate difference, and it is the reason §2
matters more than anything else in this lane.

---

## 2. The valence blocker, priced properly — **THE CRUX, and the prior derivation got it wrong**

### 2.1 What the code says

Three lines, all at HEAD, all outside codex's current diff (`git diff …/evidence-catalog.ts | grep
-i valence` → empty; the file's only hunk is a 9-line insert at `:599`):

| WT / HEAD | Code | Scope |
|---|---|---|
| `evidence-catalog.ts:951 / 942` | `valence: "none" as const,` | inside a `.map()` over `SEMANTIC_EVENT_PROJECTION_IDS` — **one literal, applied to all 67** |
| `evidence-catalog.ts:980 / 971` | `valenceAuthority: Object.freeze([]),` | inside the `.map()` building `EVIDENCE_ELIGIBILITY_DECLARATIONS` — **one literal, applied to all 67** |
| `evidence-catalog.ts:962 / 953` | `"valence_unbacked"` | a registered eligibility reason id, **with zero emission sites** |

[[D1191]] (`design/BACKLOG.md:433`) reads this as: *"a skill credit would **add a valence the
producer explicitly refused to declare**. **That is the mechanism, not a policy preference.**"*

### 2.2 Is the empty array a refusal or an unfilled slot? — **an unfilled slot, with a compiler-enforced filling procedure**

This is the question the brief asked and it decides the lane. The answer is unambiguous once the
*types* and the *validator* are read rather than the literals.

**(a) The declaration type has a second value, and it is a pointer, not a verdict.**
`packages/runtime/src/evidence-contract.ts:108` — `readonly valence: "none" | "source_required";`.
`"source_required"` means *the verdict lives in a named authority elsewhere*. The catalogue
hardcodes `"none"`; the type does not.

**(b) `valenceAuthority` is a populatable array of refs, not a literal empty type.**
`evidence-contract.ts:123` — `readonly valenceAuthority: readonly VersionedEvidenceId[];`.

**(c) The validator is a biconditional that explicitly permits population — it is not an emptiness
assertion.** `evidence-contract.ts:551`:

```ts
if ((event.valence === "source_required") !== (row.valenceAuthority.length > 0))
  fail("EVIDENCE_EVENT_VALENCE_UNBACKED",
       "event valence lacks exact declared authority or invents authority for a valence-free event", [key]);
```

It fails only on **mismatch**. `valence: "source_required"` **plus** a non-empty `valenceAuthority`
**passes today**. Two further checks then constrain the authority — `:552-554` requires it to be a
literal ref naming a *declared projection*, and `:598` requires it to be **bound to the same
consumer** as the eligibility row. Three conditions, all satisfiable, all implemented.

**(d) No test asserts emptiness.** The only valence test is a *negative* fixture
(`evidence-contract.test.ts:228`) proving the biconditional fires when valence is claimed *without*
an authority. Nothing asserts `valenceAuthority.length === 0`.

**(e) The prose says "not yet", and enumerates the admissible authorities.**
`docs/semantic-evidence.md:41-45`, §"Sign is not valence": *"**F2 emits no valence.** A future
valenced event must declare and carry a separately admitted authority; rarity, global lift, Maia
mass and Explorer frequency are not such authority."* And
`rfc/archive/semantic-evidence-selection.md:260-263`: *"**Future events may carry valence only with
an admitted authored, cited-theory, engine/tablebase convention or validated event authority named
in both declarations.** The compiler refuses absent, unbound or answer-widening authority."*

`design/research/selection-sign-and-significance.md:233-236` — the canonical five:

> **Allowed sources of valence are separate and explicit: an authored claim, a cited theory rule
> with matching antecedents and scope, a disclosed engine-delta convention, a tablebase result, or a
> validated semantic event whose contract includes valence.** Human popularity can establish common
> or unusual, never good or bad.

**Verdict.** `valenceAuthority: []` is **an unfilled slot with a documented, enumerated,
compiler-validated filling procedure** — not a refusal. The refusal is real and law-8-grounded, but
its stated form is *"no authority has been admitted yet"*, never *"valence is forbidden"*. [[D1191]]'s
*"that is the mechanism, not a policy preference"* is exactly backwards: **the mechanism is
complete and unexercised; what is missing is the policy.** That is a ledger row (§8 row 1), and it is
the single most consequential correction in this document, because it converts the lane from
*blocked by architecture* to *blocked by one owner decision*.

### 2.3 Which concepts could carry a valence that is a rules fact or a measured outcome

The catalogue already carries the field that classifies this. `EvidenceGrounding`
(`evidence-contract.ts:3`) is a nine-value closed union, and it maps almost 1:1 onto the five
admissible authorities:

| `grounding` | Admissible as valence authority? | Why | Projections at HEAD |
|---|---|---|---|
| `position_rules` | **Yes — the rules supply the sign** | checkmate is a win *by the rules*; promotion is a rules fact; the alternative was legally available and declinable | default for the helper (`evidence-catalog.ts:63`), so the large majority |
| `authored_claim` | **Yes — authority 1** | a human author declared it, and law 8 constrains *LLMs*, not authors | 5 explicit, incl. `theory.shapes.firing` (`:757`) |
| `cited_theory` | **Yes — authority 2**, with matching antecedents and scope | the D530/D531 citation template | 1 (`theory.opening_identity.record`, `:790`) |
| `tablebase_exact` | **Yes — authority 4** | a Syzygy category is a proof | 6, incl. `live.syzygy.category` / `.distance` (`:777-778`), `recorded.tablebase.result` (`:767`) |
| `bounded_search` | **Yes — authority 3**, only with the convention disclosed | *"the number is a measurement; the word is a convention"* (`:58`) | 10 |
| `declared_convention` | **Conditionally** — the convention must be cited (`space@1` → `chess_tradition`, [[D745]](1)) | a convention is an authored claim wearing a different hat | 36 |
| `human_model` (Maia) | **NO** | *"rarity, global lift, Maia mass and Explorer frequency are not such authority"* | 4 |
| `human_corpus` (Explorer) | **NO** | *"Human popularity can establish common or unusual, never good or bad"* | 3 |
| `recorded_run` | **NO** — it is the learner's own history, not an authority | circular | 11 |

**That table is the answer to (a), and it is mechanical rather than editorial.** A projection may
serve as a `valenceAuthority` iff its `grounding` is in the first five rows. Nothing has to be
invented; the classification already ships.

Applied to the R20 disposition (`tools/r20-skills-taxonomy/output.md`), the split is exactly the one
the brief guessed:

| Basis | Count | Examples | Standing |
|---|---:|---|---|
| **Rules fact** — the rules supply the sign, an alternative was declinable | **5** | `rules.transition.event.checkmate@1`, `rules.transition.event.promotion@1`, `rules.tactic.event.double_attack@1`, `derived.tactic.discovered_executed@1`, `derived.semantic_avoidance.loose_piece@1` | R20 `credit_candidate`; denominator complete; **floor unmeasured** |
| **Authored claim** — a human declared the goal | **96 plan signatures over 25 shapes** | §2.4 | **shipped, live, unused as valence** |
| **Tablebase** — a proof | Syzygy category/distance on ≤7-piece roots | shipped; **excluded from the store's landing ingest set** (`rfc/longitudinal-store.md:266-270`) | this is why `promotion_completion` says *completion*, never *conversion* |
| **Opinion — refused** | **47 habit-only + 4 refused** | *"creates an isolated pawn"*, *"increases king-zone attackers"*, piece counts, direct-attack counts | *"Higher is neither better nor worse"* (`output.md:34-35`) |

"Converted a won endgame" has a tablebase basis and no store row. "Played actively" has none of the
five and is refused permanently. The brief's intuition is confirmed by the shipped classification.

### 2.4 The authority nobody counted — **117 authored plans, 96 with a rules-arithmetic success signature, live in production**

Measured this pass over `content/shapes/*.json` at HEAD:

| Quantity | Value |
|---|---:|
| Shapes in the library | **25** |
| Authored plans across them | **117** |
| Plans with a rules-arithmetic `success.signature` | **96 (82%)** |
| Plans left `signature: null` with the reason stated | **21** |
| Plans carrying the literal `RESTATED PLAN.` audit note | **48** |

A plan's `success.signature` **is a valence declaration**: it says *reaching this state is the
achievement of this plan*, authored by a human, evaluated by rules arithmetic. It is authority
type 1 in the enumeration, it ships, it is loaded and evaluated
(`apps/server/src/guidance.ts:121-141`; census at `expression-census.ts:191-192`; satisfiability at
`expression-satisfiability.test.ts:62`), and it is exposed as the registered projection
`theory.shapes.firing` with `grounding: "authored_claim"` (`evidence-catalog.ts:757`).

**And it already survived the exact discipline the skills lane needs**
(`planning/content-era/log.md:1983-2005`). Restatement: *"Every one declares itself in its own note
with the words `RESTATED PLAN.`, quotes the original success note verbatim, and states what the new
census does not say. Nothing was silently rewritten"* — *"hold the draw"* became *"the rook is on
the sixth and White's king is not"*. Refusal: 21 left null — fortresses, zugzwang, tempo ledgers,
*"was the trade worth it"* — and **"No signature was invented to clear a null."** And the precedent
that is *literally* the skills aggregation defect: writing *"distance ≥ 4 means the defence holds"*
would be **"manufacturing a verdict under a census label — ADR-0005 through the content door."**

**This is decisive for the lane.** The product has already run an authored-valence pass over 117
claims, achieved 82% coverage in rules arithmetic, refused 18% with stated reasons, and left an
audit trail on every restatement. The skills lane does not need to invent a valence procedure — **it
needs to point the existing one at a second object.**

### 2.5 Who may declare valence — the answer to (b)

| Authority | Who declares | Admissible for | Standing today |
|---|---|---|---|
| **Rules** (`position_rules`) | nobody — it is arithmetic | the 5 R20 candidates | available; needs a floor, not a decision |
| **Author** (`authored_claim`) | the **content author**, exactly as for the 117 plans | shape plans, pack objectives, pass-mark schedules ([[D861]]) | **shipped mechanism, zero skills use** |
| **Cited theory** (`cited_theory`) | a named source under the D530/D531 template | opening/strategy concepts — the only route out of §1.2's two empty categories | 1 projection; the D694/R8/F7 join is gated |
| **Tablebase** (`tablebase_exact`) | nobody — it is a proof | endgame conversion | shipped; **store excludes it at landing** |
| **Engine convention** (`bounded_search`) | the RFC that discloses the threshold | missed-tactic counterfactuals | needs the disclosed-policy arm |
| **Measured outcome correlation** | — | **not in the enumerated five** | see below |
| **LLM** | **never** | — | law 8; `BANNED_JUDGEMENTS`, `voiceCheck` |

**One thing the brief proposed that the enumeration does not contain, and it matters.** "Measured
from outcomes" — *this event correlates with winning, therefore it is good* — **is not one of the
five admissible authorities.** It is closest to `recorded_run`, which is refused as circular. The
prose is explicit that valence may not be derived from *"rarity, global lift, Maia mass or Explorer
frequency"* (`semantic-evidence-selection.md:610-614`), and lift is exactly an outcome correlation.
So the honest answer to (b) is **three ways, not three-plus-outcomes**: the rules declare it, an
author declares it, or a cited source declares it — and for endgames, a tablebase proves it.
Admitting outcome correlation as a sixth authority is an **owner decision** (fork 2, §7), not
something this derivation may grant, and it would be the first time this product let a statistic
create a chess judgement.

### 2.6 What a valence declaration would cost, concretely

Three coordinated edits, all validated by machinery that already exists:

1. `evidence-catalog.ts:951` — replace the hard `"none"` with a per-projection lookup, defaulting to
   `"none"` and returning `"source_required"` for the admitted set.
2. `evidence-catalog.ts:980` — replace the hard `Object.freeze([])` with the authority refs for
   those same projections.
3. Add an adapter binding each authority projection to the eligibility row's consumer, or `:598`
   fails with `EVIDENCE_EVENT_VALENCE_UNBACKED`.

Plus one thing not in the code: a **valence register** — the admitted (event, authority, declarer,
date, scope) rows, so that a future reader can see *who said this is good and on what basis*. That
register is the skills lane's genuinely new artefact, and it is small.

---

## 3. The taxonomy question — who authors the human-meaningful grouping

### 3.1 Two vocabularies exist and neither is the taxonomy

**Measured this pass** over the content tree at HEAD (corrects [[D300]]'s figures, which are stale —
the corpus grew):

| Quantity | [[D300]] (`design/BACKLOG.md:1104`) | **Measured 2026-08-23** |
|---|---:|---:|
| Pack files declaring `concepts` | 47 | **50** |
| Concept references | 186 | **199** |
| Distinct concept ids | 156 | **168** |
| Ids appearing in ≥2 packs | 24 | **25** |
| Singletons | 132 | **143 (85%)** |

**The names are exactly the right kind.** `advance-chain-base`, `break-timing`, `minority-attack`,
`carlsbad-structure`, `outside-passer`, `backward-pawn-target`, `castle-before-attacking` — these
are human-meaningful chess concepts of precisely the grain D549 asks for ("back-rank awareness",
"converting an extra pawn"), and they were written by human authors, not generated. **The
vocabulary problem is not that the names are missing. It is that 143 of 168 occur once, and that the
resolver keys them apart anyway.**

**And the 25 is weaker than it looks — a finding no ledger row records.** Most of the sharing is an
artefact of *paired* packs, not genuine cross-topic recurrence:

| Pair | Concepts shared only within it |
|---|---|
| `mate-bishop-knight` ↔ `trajectory-mate-bishop-knight` (base/trajectory twins) | **7** — `bishop-coloured-corner`, `diagonal-fence`, `fifty-move-pressure`, `knight-crossing`, `phase-decomposition`, `stalemate-field`, `wrong-corner-defence` |
| `carlsbad-minority-attack` ↔ `trajectory-qgd-exchange-minority` | **3** — `backward-pawn-target`, `carlsbad-structure`, `minority-attack` |
| `opening-principles-white` ↔ `opening-principles-black` (colour mirrors) | **2** — `castle-before-attacking`, `new-piece-every-move` |
| `iqp-white-panov-attack` ↔ `iqp-black-tarrasch-defence` | **2** — `blockade-square`, `isolated-queens-pawn` |

Strip the twins and the mirrors and **roughly 11 of 25 remain as real cross-topic recurrence**:
`advance-chain-base` (6 packs), `break-timing` (3), `arrangement-before-action` (3),
`direct-opposition`, `doubled-c-pawns`, `lever-arrival`, `opposite-castling-commitment`,
`outside-passer`, `plan-continuity-across-phases`, `problem-bishop-first`,
`structure-ends-on-a-recapture`. **That is the honest size of the cross-pack concept vocabulary
today: eleven.**

**How much of the fragmentation is naming drift?** Measured: **18 pairs** at Jaccard ≥ 0.5 over
stopword-stripped tokens — `advance-chain-base` ~ `chain-base`, `doubled-c-pawns` ~ `doubled-pawns`,
`attacker-counting` ~ `attacker-count-on-the-blockade-square`, `half-open-file` ~ `half-open-b-file`,
`opposite-side-castling` ~ `opposite-castling-commitment`. So a normalization pass recovers roughly
**12–15 ids**, taking 168 → ~155. **The fragmentation is real, not an artefact.** Merging is also an
*authoring* act with a law-8 edge (fork 3, §7).

**Why they stay apart:** `apps/server/src/progress.ts:55-59` —
`resolve(packId, raw) { return { key: \`pack:${packId}#${raw}\`, label: raw } }`. `ConceptResolver`
is an injectable interface (`:52-54`), so a corpus-global resolver is a one-class change.

**Why the vocabulary is not closed — and the non-globality is deliberate.** There is **no registry**:
no `enum`, no `$ref`, no closed list. `schemas/drill_pack.schema.json:30-34` constrains `concepts`
only to `nonEmptyString` + `uniqueItems`. The single validator is a **warning-severity slug lint**
whose own message says the quiet part — `packages/schema/src/drill-pack/lint.ts:390-398`,
`CONCEPT_KEY_NOT_SLUG`: *"Concept … **is pack-local** and not slug-shaped"*. `pack-validation.ts`
has **zero** concept references, so concepts are not part of publication or graduation validation at
all. And `docs/drill-pack-format.md` — the authoring contract — **contains the word "concept" zero
times**. The prose lives only in `docs/return-and-progression.md:64-66`: *"non-slug keys produce a
lint warning rather than silently becoming a global taxonomy."*

**The intent tier already names the fix, and names it as an authoring contract.**
`design/01-training-model.md:60-65`:

> **Concepts are cross-cutting tags, not the scheduling key.** They are what makes a weakness
> statement possible across packs. This requires a contract that does not exist yet: concepts are
> currently unique *within a single pack*, so two packs both naming `break-timing` are unrelated
> strings. **A concept registry — ids defined once, packs referencing them — is an authoring
> contract and belongs with the pack studio**, not with the scheduler.

**Contrast: shapes ARE a closed registry.** `content/shapes/` holds **25 entries**, each with an id,
a `named_structure` trigger, and the 96 authored plan signatures of §2.4, validated against a loaded
catalogue — *"the official catalogue IS the content/shapes directory"*
(`apps/server/src/shape-registry.test.ts:11`). **That asymmetry is the whole of [[D300]]**, and it is
why the shapes half of the taxonomy is usable today and the concepts half is not.

### 3.2 `attempt_concepts` — real, with three consumers, none a credit stream

Table DDL `apps/server/src/storage.ts:4135-4144` (D300's cited `:2529-2538` is stale); write path
`:2580`, `:2583`. Consumers: account export / hard delete (`account-data.ts:47`, `:119`, `:266`);
the `same_concept_in_pack` related-attempt selector, **additionally scoped `AND a.pack_id = ?`**
(`storage.ts:2721-2724`); and `RunStorage.metrics()`, explicitly *"not a claim made by the learner
UI"* (`docs/return-and-progression.md:71-73`). D549's *"shipped-but-consumerless"* is wrong; the
defect is **identity**, not absence of a consumer.

**And the corpus gap that matters most for D549's own words.** `projectAttempts` returns frozen
empties for `sessionKind === "imported"` (`apps/server/src/progress.ts:83-85`), so *"earned from
game review"* — the learner's own real games — contributes **zero** concept rows today. The
longitudinal store is the fix and knows it: its `session_kind` CHECK **includes `'imported'`**, the
deliberate difference from `attempts` (`rfc/longitudinal-store.md:169`, `:229-233`).

### 3.3 Three ways to author the grouping, priced

| Option | What it means | Cost | Law-8 standing | Verdict |
|---|---|---|---|---|
| **A. Owner authors it** | the owner writes N skill names and the (concept ids / projection ids / plan ids) each subsumes | one document; owner-tier; hours-to-days of owner time, not agent time | **clean** — an owner is an author | **viable, and it is what law 5 implies anyway** |
| **B. Derived mechanically from projection families** | group the 67 projections by their `producer` / family prefix | free, automatic | clean | **fails the ask.** It yields `derived.semantic_avoidance.*` — detector names, not "back-rank awareness". R20 already did the closest honest version and its own output calls the five categories *"a usable navigation vocabulary… not a credit mechanism"* (`grounded-skills-taxonomy.md:7-9`) |
| **C. Inherit a published taxonomy with attribution** | adopt chess.com's five categories as the top level, or a book's concept index (Yusupov — [[D861]]) as the leaves | licensing + citation work | clean under `cited_theory` if genuinely cited; **the five category names are already ruled adoptable** (`:84-87`) | **viable for the top level only.** Nobody publishes a leaf taxonomy we can bind to our detectors |

**What law 8 forbids, precisely.** An LLM may not *invent* a chess concept. It may (i) render an
author's grouping, (ii) propose a grouping as a BACKLOG row for the owner to rule on, and (iii)
perform mechanical operations over author-written names — deduplicating `chain-base` into
`advance-chain-base` is a *string* judgement, not a chess judgement, though a careless merge becomes
one (fork 3).

**Recommendation: A over C over B, with a two-tier shape.** The top tier is the five inherited
category names (option C, already ruled adoptable). The leaf tier is **the 25 registered shapes plus
the ~11 genuinely cross-cutting concept ids** — both author-written, both already grounded in a
registered projection (`theory.shapes.firing`, `attempt_concepts`) — with the owner authoring only
the *assignment* of leaves to categories. That is a table of roughly **36 rows**, and it is the
smallest owner-authored artefact that produces a real taxonomy. The remaining 157 concept ids stay
where they are: useful pack-local tags, not skills.

**Is the 168-id vocabulary usable as the taxonomy today? No — and the reason is arithmetic, not
taste.** `design/06-campaign.md:384-386`: *"a collection screen over a namespaced-apart vocabulary
would display 156 things nobody can complete."* At 143 singletons, a *skills* screen over it would
show 143 skills earnable exactly once, in one pack, forever. **The 25 shapes plus ~11 recurring
concepts are usable today** — a ~36-row taxonomy, and that is enough for a real surface. It is also
enough to make the point that the constraint on this lane is **authored content breadth**, not
detectors: the way to grow the taxonomy is to author more packs that reuse existing concept ids,
which is exactly what the registry of `01`'s missing contract would make possible.

---

## 4. The accumulation mechanics

### 4.1 What is accepted, and that it is 100% paper

`rfc/longitudinal-store.md:3` — status `accepted — 2026-08-22`, while `:9-10` says the three open
questions *"still resolve before `accepted`"*. Blocked by [[D973]] (`design/BACKLOG.md:50`) and
[[D1011]] (`:303`), which are duplicates of each other.

Confirmed at HEAD: `learner_observations`, `learner_structure_stats`, `projectObservations`,
`OBSERVATION_DERIVATION_REV` — **zero hits** in `apps/`, `packages/`, `workers/`, `tools/`. No
`longitudinal-*` target in the Makefile (its 33 targets run `setup` … `down`; none is
`longitudinal-rebuild`, which the RFC names as its own trust instrument at `:289`, `:386`).
`planning/longitudinal-store/`, declared at `:46`, does not exist. `STORAGE_VERSION` is **25**
(`apps/server/src/storage.ts:631`); the store's migration would be 26.

### 4.2 The accepted grain, and what it already gets right

`rfc/longitudinal-store.md:164-186`, `learner_observations`: PK
`(learner_id, run_id, projection_id, projection_version, phase, decision_class)`, with
`decisions`, `opportunities`, `occurred`, `alternative_share_sum`, `occurred_refs`,
`opportunity_refs`, `derived_rev`, `derived_at`, and `CHECK (opportunities > 0)` /
`CHECK (occurred <= opportunities)`.

Four properties a credit record needs and gets for free:

1. **The denominator is structural.** *"a denominator-free row is unrepresentable"* (`:217-220`);
   opportunity is defined as *"a decision at which the family's event is exhibited by at least one
   edge of `{played edge} ∪ legalAlternativeEdges(…)`"* (`:144-148`) — [[D603]]'s all-ones alarm
   made schema.
2. **Drill-down is mandatory.** `occurred_refs` / `opportunity_refs` carry exact node ids (`:246-249`).
3. **Nothing accumulates in storage.** Per-run grain; *"No cross-game total is ever stored"* —
   windows computed at read (`:210-216`). *A fact you never write cannot go stale.*
4. **Imported games are in scope** (`:169`, `:229-233`) — the D549 corpus that `attempts` refuses.

### 4.3 What a credit record must contain to be honest

A skill credit asserts *you did X, where X was declinable, more often than a named reference, over a
named window, and someone with standing says X is good*. Every clause is a required field:

| Field | Why it is required | Source today |
|---|---|---|
| `skill_id` + version | the human-meaningful name; the unit of the taxonomy | §3 — **does not exist** |
| `projection_ids` + versions it rests on | law 3; and *"old rows are never silently re-meant"* (`:141-143`, `:575-579`) | `learner_observations.projection_id` |
| `valence_authority` ref + version + declarer + date | §2 — *who said X is good, on what basis* | **does not exist** |
| `opportunity_definition_id` + version | the declinability rule; two rules over one projection are two skills | implicit in `projection_id`; **must become explicit** |
| `occurred` / `opportunities` | the rate and its denominator, never separated | present |
| `decisions` | opportunity *density* — how often the chance even arose | present (`:236-238`) |
| exact contributor refs | every number reopens its rows | present |
| **time window** (games, and calendar bounds) | *"25–200 games per metric"* is meaningless without a window; R12's floors are 59-hour blitz | **absent — only `derived_at`, a derivation timestamp** |
| **scope**: phase, time control, opponent band | the tier convention requires all three co-rendered (`grounded-skills-taxonomy.md:117-127`) | phase ✓; `session_kind`/`pack_id` ✓; **time control and band absent** |
| `reference_population_id` + version | `above_reference` is undefined without a pinned distribution | **absent, and no such distribution exists anywhere** |
| `floor_id` + measured value | a rate below floor is `insufficient_evidence`, not a small number | **absent, unmeasured for all five candidates** |
| `derived_rev` | versioned recompute (R13 invariant 7) | present |

### 4.4 What the store must add, and what it must not

**Must add — four things, all small, none contradicting the accepted design:**

1. **Time-control and opponent-band scope columns** on `learner_observations` (or a joinable run
   dimension). The tier convention names time-control scope as mandatory; the schema cannot express
   it, and blitz↔rapid transfer is a preregistered gate (`grounded-skills-taxonomy.md:141-142`).
2. **A calendar anchor per run** distinct from `derived_at`, so an eight-week early/late split is
   computable. `derived_at` moves on every rebuild; the game's date does not.
3. **`theory.shapes` in the ingest set** — open question 1 (`rfc/longitudinal-store.md:726-731`).
   **This is not process trivia: it is the ingest question for the one projection family that
   carries authored valence** (§2.4). The RFC's own proposal is *"no at landing… yes as the first
   post-landing rev bump"*, and it names the exact obstacle: *"a shapes family needs its own
   opportunity definition, which is not the legal-alternative population."* Writing that definition
   is the skills lane's single largest piece of genuinely new design work.
4. **A valence register** (§2.6) — not a store table; a registered resource beside the catalogue.

**Must NOT add — and the RFC is right to refuse these:** `rfc/longitudinal-store.md:489-494`:

> Rates, floors-cleared, milestones and windows are **consumer arithmetic at read time** over
> per-run rows. **A stored tier would be the first learner-facing number this product ever persisted
> about a learner's skill**, and it belongs to the F9 RFC that can validate it — with [[D842]]'s
> floors and [[D603]]'s alarms — not to storage.

And `:480-487`: *"There is no sentence column, no label column, no verdict column."* A skill credit
is therefore **a read-time projection over stored per-run rows plus a declared valence authority** —
never a row. That is the correct architecture and it should be carried verbatim into the F9 RFC.

---

## 5. The progression display — how a learner sees improvement without a number about themselves

### 5.1 The honest template already ships, twice, in two different shapes

[[D1192]] (`design/BACKLOG.md:434`) found there are **three** progression denominations and only one
is written down. Denomination 2 — marks — ships in two distinct implementations:

| | **Derived milestones** | **Durable marks** |
|---|---|---|
| Where | `apps/server/src/service.ts:938-942`; `GET /progress/milestones` (`rest.ts:1199-1200`) | `learner_marks` DDL `storage.ts:4615-4622` |
| Stored? | **no** — recomputed per read | **yes** — `PRIMARY KEY (learner_id, mark)` |
| Record | `{ kind, occurredAt, sentence, link: { runId, branchId } }` (`apps/web/src/lib/api.ts:529`) | `{ learnerId, mark, calibrationId, runId, earnedAt }` |
| Kinds | 7: `first_attempt`, `first_stable`, `first_objective_achieved`, `first_win`, `first_scheduled_return`, `ten_attempts_one_root`, `first_flip_sides` | 3: bronze / silver / gold |
| Earned when | first attempt row satisfying the predicate; `add` dedupes by kind | win a sealed rated game vs band 1400/1800/2200 (`storage.ts:1586-1594`), `INSERT OR IGNORE` |
| Displayed | `App.svelte:919-924`, each with an "Open run" button | `RatingScreen.svelte:145-149` — *"Beat band 1800 on <date>"* |
| Guarded | `adoption-wave.test.ts:47`: `.not.toMatch(/%\|score\|streak\|rating\|ranking/i)` | the D1151 line |

**Five properties make this law-8 clean by construction**, and every one is exactly what a skill
credit needs: it records an **event**, not a trait; it carries **no denominator** because its
denominator is a whole game; it is **monotone** — nothing takes it back; it is **unfarmable** —
dedupe by kind means repetition earns nothing; and it **links to the preserved run**, so the claim
reopens its own evidence.

### 5.2 A mark per concept, concretely

The extension is small and mechanical. Add a mark kind keyed by taxonomy leaf:

```
kind:       "first_concept:<leafId>"          // leafId ∈ the ~36-row taxonomy of §3.3
occurredAt: the run's end timestamp
sentence:   "First <label> recorded."          // label = the author-written concept/shape name
link:       { runId, branchId, nodeId }        // nodeId is new and is the point
authority:  the valence-authority ref that makes this leaf creditable   // §2
```

**When it is earned.** At the first decision where (a) the leaf's opportunity rule finds ≥1 legal
alternative exhibiting the event **and** ≥1 declining it, and (b) the played edge exhibits it. Both
halves are already computable today: F2's complete legal-alternative population is implemented, and
R12 ran it over 261,892 decisions. **No floor. No reference population. No interval. No store.**
A first is an event, not a rate.

**Why it is honest where a counter is not.** chess.com's part 3 is a counter against a hidden
threshold, which is grindable. A mark is earned once, at a named moment, with a link to the board
where it happened. The learner cannot farm it and cannot lose it.

### 5.3 How a set of marks reads as progress

**A filled-in taxonomy is the progress display.** ~36 leaves, grouped under five category names,
each either *earned on <date> — open the game* or *not yet*. The learner's sense of advance is
"nineteen of the things I can do are things I have now demonstrably done", and the screen never
computes a nineteen-out-of-thirty-six percentage — the same discipline the catalogue ruling already
requires (`design/06-campaign.md:381-386`: *"a daily position and per-unit mastery marks over a
named vocabulary, no number about the learner anywhere"*). Growth comes from **authoring more packs
that reuse existing concept ids**, which the registry of §3.1 is what makes possible.

**The ladder, and it is a ladder, not a fork:**

| Rung | Object | Needs | Available |
|---|---|---|---|
| 1 | **Mark** — *"first minority attack executed"* | the taxonomy (§3), a valence declaration per leaf (§2), the existing milestone shape | **as soon as the owner rules §7's forks 1–3** |
| 2 | **Reading with a denominator** — *"you avoided leaving a piece loose; N% of your legal moves would not have"* | already ruled learner-facing by [[D745]](2), `design/BACKLOG.md:604`; post-commit and review only | run-local today; cross-run needs the store |
| 3 | **Rate with a tier** — `established` → `above_reference` → `distinctive` | floors, reference populations, transfer arms | store + the R20 measurement arm — **eight weeks of real play minimum** ([[D1170]], `design/BACKLOG.md:427`) |

Rung 3 is the differentiator — *"the denominator… the only defensible reason to build this at all"*
— and it is the one thing no schedule can shorten. Rungs 1 and 2 are not consolation prizes; they
are the surface, and rung 3 upgrades individual leaves in place as measurement arrives.

### 5.4 Is the skills surface the catalogue with valence added?

**No, and the prior derivation was right about that — but for one wrong reason, so re-test it.**

| Axis | Catalogue ([[D1151]], ruled) | Skills marks (this document) |
|---|---|---|
| Denominated in | **content**: shapes met, structures played | **decisions**: was the alternative declinable, and did you take it |
| Subject | the corpus — *what you have now seen* | the learner's choice — *what you have now done* |
| Valence | **none, and that is why it is lawful** | **required** — a leaf is not a skill without one |
| Monotone | yes | yes (marks); no (rates) |
| Home | *"the what's-missing mark on the pack card"* | a progression surface |

The load-bearing distinction is [[D1171]] (`design/BACKLOG.md:428`): *"**the catalogue IS the
[[D345]] exposure-restatement pattern that R20 disqualifies for skill credit** — it is lawful
precisely because it makes no claim about the learner, and **one careless sentence collapses it into
the refused thing.**"* Seeing a Carlsbad structure is exposure. *Executing the minority attack when
you could have declined* is a choice. **Adding valence to the catalogue would not produce the skills
surface; it would destroy the catalogue.** They must stay two objects on two screens — while sharing
one prerequisite, [[D300]], so one change unblocks a ruled surface and this one.

---

## 6. The full sequence to depth

Owner column: **⚖ owner-decision** · **✍ claude-draft** · **⚙ codex-build** · **⏳ waiting-on-data**.

| # | Step | Owner | True cost | Decision or work? |
|---:|---|---|---|---|
| 1 | Rule forks 1–3 (§7): may valence be declared, by which authorities, and who authors the taxonomy | ⚖ | **one sitting** | **decision** |
| 2 | Rule O9 as drafted (`grounded-coaching/o9-handoff.md`), plus forks 4–6 | ⚖ | one sitting; the document is written and READY FOR OWNER | **decision** |
| 3 | Author the ~36-row taxonomy: five categories over (25 shapes + ~11 genuinely recurring concept ids), each leaf naming its valence authority | ⚖ + ✍ | owner authors assignments; claude drafts the table from measured data | **half decision** |
| 4 | Land [[D300]]: corpus-global `ConceptResolver` + key migration **+ drop `AND a.pack_id = ?` from `same_concept_in_pack`** (`storage.ts:2708-2714`) — the resolver swap alone leaves the one product consumer still pack-scoped **+ the concept registry `01` names as an authoring contract** | ⚙ | one injectable class (`progress.ts:52-59`) + one migration + one query + a registry file | work — small |
| 5 | Normalize the 18 near-duplicate concept ids | ⚖ + ⚙ | 12–15 merges; each is an authoring call | **half decision** (fork 3) |
| 6 | Populate `valence` / `valenceAuthority` for the admitted set, + the valence register | ✍ + ⚙ | 2 catalogue edits + adapter bindings; **the validator already exists** (§2.6) | work — small, gated on 1 |
| 7 | Ship concept marks: extend `milestones()` with `first_concept:<leafId>` | ⚙ | one predicate per leaf over the existing shape; **no store, no floor** | work — small |
| 8 | Reconcile [[D973]]/[[D1011]] (duplicates; close one), answer the store's three open questions | ⚖ + ✍ | one pass; question 1 is the shapes-ingest question of §4.4 | **decision** |
| 9 | Implement `longitudinal-store` as accepted, + the four additions of §4.4 | ⚙ | migration 26, two tables, deriver, `make longitudinal-rebuild` + tamper fixture. **Fully specified; scale unmeasured** | work — medium |
| 10 | Write the shapes opportunity definition (store OQ1's named obstacle) | ✍ | the largest genuinely new design in the lane | work — design |
| 11 | Accumulate observations | ⏳ | **≥ 8 weeks of real play** ([[D1170]]) | **waiting** |
| 12 | Run the R20 measurement arm: 5 candidates × floors 25/50/100/200, R12's gate unchanged, transfer arms, D603 alarms | ✍ | research; the instrument exists and has run 261,892 decisions | work, after 11 |
| 13 | Upgrade passing leaves from marks to rates with tiers | ⚙ | per-leaf, in place | work — small each |
| 14 | Draft `rfc/skills.md` over the shape steps 1–7 defined and the rows step 12 passed | ✍ | | work |

**The shape of that table is the message.** Steps 1, 2, 3, 5 and 8 are **decisions**, not builds.
Steps 4, 6 and 7 are each measured in a class or a predicate. The one long pole is step 11, and it is
**calendar, not effort** — nothing anyone does makes eight weeks shorter, and [[D1170]] found the
same thing independently for style: *"the gate is roughly EIGHT WEEKS OF REAL PLAY… A ruling can
license a foundation RFC today; it cannot license a learner-facing style card."*

**So the schedule is not the binding constraint — and neither is the code.** Steps 1–7 deliver a
real, accumulating, chess-shaped skills surface with parts 1, 2, 3, 4 and 5 of §1.1 all present, and
every one of them is gated on an owner ruling rather than on engineering. Step 11 onward upgrades
that surface from marks to rates, leaf by leaf, without ever rebuilding it.

**Draft the RFC.** [[D1193]]'s *"do not draft a skills RFC"* was correct only under the reading that
valence is structurally refused. It is not (§2.2). An RFC that specifies the taxonomy shape, the
valence register, the mark form, the credit record of §4.3, the store additions of §4.4 and the
rate-upgrade path is writable **today**, and every number in it is honestly `null` **only in the
rate section** — which is exactly what §5.3's ladder is for.

**One law-5 note, flagged not acted on.** `design/03-product-breadth.md:329` records **B7 — return**
as *"shipped 2026-08-13"* with *"Cross-pack concept identity deliberately absent (a studio/B11
contract)"*. A skills progression surface is an **amendment to a row the intent tier calls shipped**,
whose one named omission is this lane's prerequisite. That amendment is owner-tier and goes through a
BACKLOG row, never by writing `design/03`.

---

## 7. Gaps and owner forks

Numbered, each stated as a question with its options and consequences.

**Fork 1 — May valence be declared at all?** `valenceAuthority: []` is an unfilled slot with a
compiler-validated filling procedure, not a refusal (§2.2). *(a)* Yes, from the enumerated
authorities → the lane opens; a skill credit becomes a legitimate object. *(b)* No, keep `"none"`
across all 67 permanently → **the skills lane is dead** and D549 is answerable only as the
catalogue. *(c)* Yes, but only for `position_rules` and `tablebase_exact` → the 5 R20 candidates
only; Openings and Strategy stay empty forever. **This is the decision the whole document turns on.**

**Fork 2 — Is "measured outcome correlation" a sixth valence authority?** The enumerated five do not
include it, and lift/rarity/Maia mass are explicitly refused
(`semantic-evidence-selection.md:610-614`). *(a)* Admit it under a disclosed convention → most of the
47 habit-only projections become creditable, and this is the first time a statistic creates a chess
judgement here. *(b)* Refuse it → Strategy stays honestly empty until a cited-theory join exists.
**Recommend (b)**, on [[D1171]]'s reasoning: the surfaces that survive are the ones that make no
claim they cannot ground.

**Fork 3 — Who authors the taxonomy, and may claude merge synonyms?** §3.3 prices A/B/C.
Sub-question: 18 measured near-duplicate pairs. *(a)* Owner merges them → correct, costs owner time.
*(b)* Claude proposes merges as a table, owner ratifies → cheap, and merging author-written strings
is a string judgement, not a chess claim. *(c)* Leave them → the taxonomy carries visible duplicates.
**Recommend (b)**, with every merge quoting both originals — the `RESTATED PLAN.` discipline of §2.4
applied to names.

**Fork 4 — Marks now, or rates only?** §5.3's ladder. *(a)* Ship rung 1 as soon as forks 1–3 are
ruled → a real surface within the small-work steps 4–7, upgraded in place later. *(b)* Wait for
rung 3 → nothing ships for ≥ 8 weeks after the store lands, and the store has zero lines today.
**Recommend (a)**, and note it is a *ladder*: choosing (a) does not forgo (b).

**Fork 5 — May a five-category navigation exist over two honestly-empty categories?** R20:
*"An empty category is not filled from a weaker detector… no five-card dashboard is required merely
because the taxonomy has five names"* (`:111-113`). But the owner asked for chess.com's five.
*(a)* Show five, two empty with a stated reason. *(b)* Show three. *(c)* Show five and fill Openings
from cited theory first (D694/R8/F7 — gated).

**Fork 6 — Does O9's recommended ruling extend to credits, marks and tiers?** As drafted it covers
habit cards, a versioned observation ledger, three modules, description-vs-advice, deterministic-first
wording, privacy and admission — and **says nothing about credits, milestones or tiers**
(`o9-handoff.md:35-38`). Ruling O9 alone leaves D549's half unlicensed.

**Fork 7 — Does the store ingest `theory.shapes`, and who writes its opportunity definition?**
(`rfc/longitudinal-store.md:726-731`.) This is the ingest question for the only shipped
authored-valence family (§2.4). *(a)* No at landing, yes at rev 1 (the RFC's own proposal) → the
authored-valence route is deferred one rev. *(b)* Yes at landing → the opportunity definition must be
written first, and nobody has.

**Fork 8 — [[D1190]] is still owed.** The owner ruled [[D1151]] on the premise *"the first number
this product has ever shown a learner about themselves"* — and `RatingScreen.svelte` already ships a
rating with disclosures and band marks, plus `CohortStanding.svelte`'s cross-learner comparison. The
ruling may still be right; **the ground given for it was false when given**. Owed: re-put the premise
honestly. This fork is a prerequisite for fork 4, because the *reason* rates were refused is the
premise in question.

### Traps and unowned work — not forks, but nothing ships without them

| # | Item | Cite |
|---|---|---|
| 9 | **[[D973]] and [[D1011]] are duplicates** — same defect, filed a day apart with different owners. One should close as such so the store has one blocker | `design/BACKLOG.md:50`, `:303` |
| 10 | **[[D300]] is owned by nobody**, and it blocks the ruled catalogue *and* this lane | `design/BACKLOG.md:1104` |
| 11 | **Imported games project no attempts or concept tags** — the D549 corpus feeds zero rows today; the store is the fix and `attempts` is not | `apps/server/src/progress.ts:83-85` |
| 12 | **The `skills.*@1` ids are research vocabulary** — `tools/r20-skills-taxonomy/registry.ts` only, zero hits in `packages/runtime/src`. Citing them as production ids repeats the [[D921]] placeholder-id defect | measured |
| 13 | **Do not inherit R12's floors.** 25–200 games came from 200 blitz games per account over 59 hours; only the two opening habits quote measured floors and **neither has a production projection** | `grounded-skills-taxonomy.md:174-176` |
| 14 | **The tier convention `reference_quantile_lower_bound@1` is `[M]`** — synthesized, not measured; the one part of the R20 dossier not carrying `[V]` | `:127` |
| 15 | **A style vector re-identifies 35 of 36 accounts (97.2%).** A skill vector is behavioral identifying data; privacy is a design input | `player-style-metrics.md:154` |
| 16 | **Rating isolation must be asserted, not assumed.** R15/AC-11 is a reachability test for the rating; a skills aggregate needs the symmetric one | `rfc/learner-rating.md:990`, `:1004` |
| 17 | **Every credit ships with a validator before the number** — positive fixture, D603 all-ones alarm, synthetic control. The precedent for skipping it is [[D440]]: 25 packs assert a terminality nothing validates | `player-analysis-and-skills.md:216-218` |
| 18 | **`docs/evidence-contract.md:114` defers valence to "a later RFC" and names no RFC.** If fork 1 is ruled (a), that RFC is this one, and the doc needs the pointer | measured |
| 19 | **`rfc/tactical-collectors.md:108-113` says "33 shipped `SEMANTIC_EVENT_DECLARATIONS`"; HEAD has 67.** It binds new-collector authors to `valence: "none"` on a stale count | measured |
| 21 | **`docs/drill-pack-format.md` — the authoring contract — never mentions `concepts`.** Zero occurrences. Authors are minting the taxonomy's vocabulary against an undocumented field validated only by a warning-level slug regex | measured |
| 22 | **A failed skill measure may never block the core path.** [[D1040]] ruled *"progression is unlocked by PLAYING; WINNING gates the PRESTIGE layer only"*; R20 reaches it independently. A skills surface that gates campaign advance has broken a standing ruling | `design/BACKLOG.md` D1040; `grounded-skills-taxonomy.md:160-162` |
| 23 | **Skills and Insights carry the same four category names and the repo never reconciles them.** chess.com ships Openings/Tactics/Strategy/Endgame as *counters* in Skills and as *ratings* in Insights; our five-category navigation inherits an ambiguity nobody has resolved | `player-analysis-and-skills.md:71`, `:73` |
| 24 | **[[D861]] pass-mark packs and [[D865]] difficult roots need none of this lane's blockers** — both pack- or position-scoped over shipped data, both parked behind F9. Route them out | `design/BACKLOG.md:524`, `:519` |

---

## 8. Ledger rows this derivation proposes

Written unnumbered per [[D1130]] — id assigned at landing; head was D1212 at drafting.

1. 🐞 **[[D1191]] and [[D1193]] are wrong on the crux: `valenceAuthority: []` is an unfilled slot,
   not a structural refusal.** `evidence-contract.ts:108` types valence as
   `"none" | "source_required"`; `:123` types the authority as a populatable ref array; `:551` is a
   **biconditional** that passes a populated authority, with `:552-554` and `:598` constraining it to
   a declared, consumer-bound literal; **no test asserts emptiness**. The prose says *"not yet"* and
   enumerates five admissible authorities
   (`docs/semantic-evidence.md:41-45`; `rfc/archive/semantic-evidence-selection.md:260-263`;
   `design/research/selection-sign-and-significance.md:233-236`). D1191's *"that is the mechanism,
   not a policy preference"* is inverted: **the mechanism is complete; the policy is missing.** The
   lane is gated on an owner ruling, not on architecture.
2. 📊 **An authored-valence layer already ships and nobody counted it: 117 authored plans over 25
   shapes, 96 (82%) with a rules-arithmetic `success.signature`, 21 refused-null with the reason
   stated, 48 carrying a `RESTATED PLAN.` audit note.** Exposed as `theory.shapes.firing` with
   `grounding: "authored_claim"` (`evidence-catalog.ts:757`). `planning/content-era/log.md:2003-2005`
   already states the skills defect in content terms: *"manufacturing a verdict under a census label
   — ADR-0005 through the content door."* **The lane does not need a new valence procedure; it needs
   to point the existing one at a second object.**
3. 📊 **`EvidenceGrounding` (`evidence-contract.ts:3`) already classifies which projections may
   carry valence, so the admissibility rule is mechanical, not editorial.** `position_rules`,
   `authored_claim`, `cited_theory`, `tablebase_exact` and disclosed `bounded_search` are the
   admissible five; `human_model`, `human_corpus` and `recorded_run` are refused by name in the
   prose. Distribution at HEAD: 36 `declared_convention`, 11 `recorded_run`, 10 `bounded_search`,
   6 `tablebase_exact`, 5 `authored_claim`, 4 `human_model`, 3 `human_corpus`, 1 `cited_theory`, the
   remainder defaulting to `position_rules` (`evidence-catalog.ts:63`).
4. 📊 **[[D300]]'s concept census is stale, and the 24-shared figure overstates the vocabulary
   twice over.** Measured at HEAD: **50 packs / 199 refs / 168 distinct / 25 recurring / 143
   singletons (85%)**, versus 47/186/156/24/132. But of the 25 recurring, **~14 are base/trajectory
   twins or colour mirrors** (7 from `mate-bishop-knight` ↔ its trajectory pack alone), so **genuine
   cross-topic recurrence is ~11 concepts**. Separately, **18 near-duplicate pairs** at Jaccard ≥ 0.5
   (`advance-chain-base` ~ `chain-base`, `doubled-c-pawns` ~ `doubled-pawns` …) mean normalization
   recovers only ~12–15 of the singletons. **The usable taxonomy today is 25 shapes + ~11 concepts
   ≈ 36 rows**, and its growth constraint is authored pack breadth, not detectors.
5. 💡 **"Measured outcome correlation" is not among the five admissible valence authorities, and
   admitting it would be a first for this product.** Lift, rarity, Maia mass and Explorer frequency
   are refused by name. An owner fork, not a derivation's to grant.
6. 💡 **Store open question 1 is the skills lane's central dependency, not process trivia.**
   `theory.shapes` is the only shipped family carrying authored valence, and the RFC names the exact
   obstacle: *"a shapes family needs its own opportunity definition, which is not the legal-
   alternative population."* Writing that definition is the largest genuinely new design in F9.
7. 💡 **The accepted store cannot express two fields a skill credit requires: time-control /
   opponent-band scope, and a calendar anchor distinct from `derived_at`.** The tier convention makes
   time-control scope mandatory and the transfer arm makes it a gate; `derived_at` moves on every
   rebuild, so an eight-week early/late split is not computable from the accepted schema.
8. 💡 **A concept mark is the shippable full-depth v1, and it is a small extension of shipped code.**
   `milestones()` (`service.ts:938-942`) already produces event records with a run link, dedupes by
   kind, and is copy-guarded (`adoption-wave.test.ts:47`). Adding `first_concept:<leafId>` needs no
   floor, no reference population, no interval and no store — a first is an event, not a rate.
9. 🐞 **[[D300]] is under-priced everywhere it is cited as "one injectable class."** Landing it also
   requires dropping `AND a.pack_id = ?` from `same_concept_in_pack`
   (`apps/server/src/storage.ts:2708-2714`) — its only product consumer stays pack-scoped otherwise —
   plus the concept registry `design/01-training-model.md:60-65` names as *"an authoring contract
   [that] belongs with the pack studio."* And `docs/drill-pack-format.md` documents `concepts` **zero
   times**: the vocabulary is authored against an undocumented field guarded by one warning-level
   regex whose own message reads *"is pack-local"*.
10. 📊 **The depth target's leaf taxonomy is not inheritable.** Across `design/` and
    `archive/brief-v2/` the product name "Skills" appears in 4 files, 8 times, and the `[V]` source
    describes **categories and a point counter, never a named-concept inventory**. D549's *"filled
    with named concepts"* is the owner's own description, not a verified fetch. Option C reaches the
    five category names and no further — the leaves must be ours.
11. 💡 **Law 5: a skills progression surface amends `design/03-product-breadth.md:329`, a row the
    intent tier marks shipped**, whose one named omission — *"Cross-pack concept identity
    deliberately absent"* — is this lane's prerequisite. Proposed here as a row, not written into
    `design/03`.
