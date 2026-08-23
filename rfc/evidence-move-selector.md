# RFC: Evidence-to-move selector — a base distribution built from registered evidence, not a policy net

- **Status:** draft — 2026-08-23
- **Author:** claude
- **Created:** 2026-08-23
- **Design refs:** `design/03-product-breadth.md` §Play (opponent selection); `design/01-training-model.md` (the opponent models human choice, never a weakened engine)
- **Exploration gate:** [[D1271]] — the owner ruled **fund it** on [[D1162]]'s fork (fund / defer / refuse). The research this draws on is `design/research/non-maia-bot-composition.md` and `planning/bot-roster/roster.md`, both landed 2026-08-23
- **Depends on:** `rfc/bot-policy.md` (accepted — the seven-layer composition this plugs into); the shipped `candidateFeatureVector` (`apps/server/src/candidate-evidence.ts:187`, [[D813]]); `tools/d1162-evidence-head-harness/` and its preregistered plan (codex, 2026-08-23)
- **Parent / amends:** amends `rfc/bot-policy.md` §2.1's `HumanPolicyModelLayer` field contract; unblocks `rfc/variants.md`'s acceptance ([[D1275]] blocker 1)
- **Supersedes / superseded by:** —
- **Planning:** `planning/platform-alignment/bot-policy/`

```tabiya-claims
none
```

## Summary

Every bot this product can compose today rests on **one** base distribution: Maia's raw policy
vector. That is a single point of failure with two measured consequences. **Maia cannot parse a
Chess960 position at all** — the pinned adapter builds its board without the 960 flag, so 858 of
960 arrangements lose every castling right, the adapter then bare-returns on the illegal replay,
and it answers `go` from a **stale board** ([[D1161]]). And no learned human-policy weights exist
for any variant, so the entire variant family inherits either a bare engine or nothing.

This RFC specifies the **fourth base type**: a selector that turns *registered candidate evidence*
into a distribution over legal moves — features → weights → mass, with **no policy net**. It is the
only route to a human-shaped opponent that ports across variants, because its inputs are the same
rules-arithmetic projections that already run on any position the move generator accepts.

**It is specified here and gated on a screen that can refute it for free.** Codex has preregistered
that screen ([[D1162]]'s plan, `tools/d1162-evidence-head-harness/`): move-match rate over an
already-captured corpus, **zero engine calls**, with a predeclared verdict. This RFC's §6 binds to
that verdict rather than restating it — if the representation cannot beat uniform, the RFC is
withdrawn and the ledger records that registered arithmetic is explanatory context rather than a
policy head. Nothing here licenses the phrase *human-like*, an Elo label, or a personality
adjective; those follow only from [[D819]]'s calibration, unchanged.

**Claims nothing versioned**, and §4 shows why that is a finding rather than a convenience: the
input vocabulary already admits an evidence-keyed base, so what blocked this was never a closed
union.

## Motivation

`rfc/bot-policy.md`'s composition stack is seven layers over a per-candidate `rawMass`, and every
layer above the base is `applyPolicyMultiplier` (`bot-policy-catalog.ts:350`). A multiplier cannot
originate mass ([[D1162]]), so a bot's *character* is bounded by what its base distribution already
proposes. Three facts make that binding:

1. **The base is Maia or nothing.** `BOT_POLICY_PROFILES` is a literal empty array at HEAD and the
   sampler has no production caller ([[D1087]]); the only shipped base provider is Maia's policy.
2. **Maia is standard-chess-only, and fails silently outside it.** Not "plays badly at 960" —
   *deletes castling rights and answers from a stale board* ([[D1161]]).
3. **Fairy-Stockfish cannot substitute** ([[D1160]]): it is alpha-beta plus an NNUE *evaluation*.
   Its option table holds nothing policy-shaped, so the sampler would have nothing to reconstruct.

The owner's framing was that a bot is a composition and the human-model slot is a slot. That is
right, and this RFC fills the slot with the one input family we already compute everywhere: the
registered tactical and breadth projections that `candidateFeatureVector` ([[D813]]) already
assembles per candidate move.

## Specification

### §1 — The feature set, and the honest portability boundary

The selector consumes exactly the shipped candidate closure: `CANDIDATE_COLLECTOR_IDS`
(`candidate-evidence.ts:67`) = `TACTICAL_COLLECTOR_PROJECTION_IDS` ∪
`BREADTH_COLLECTOR_PROJECTION_IDS`. **The count is asserted by derivation, never by a literal**
([[D1240]]): criterion 1 asserts set-equality against `make selector-feature-census`, with the HEAD
figure baked only as a drift tripwire.

Portability is not uniform across that closure, and this section states the boundary rather than
implying one:

| Class | Projections | Ports to Chess960? | Ports to Tier 2? |
|---|---|---|---|
| **Rules-general geometry** — square control, mobility, capture identity, ray classification, threat, double attack, check, loose/trapped piece, back rank, mate-in-one, exchange arithmetic | the majority of both sets | **Yes** — they read a board and a move, not a starting array | **No** — Tier 2 changes move generation or the goal, so the arithmetic is computed over rules the projection does not model |
| **Start-array dependent** | `rules.phase.development`, `rules.transition.event.developed` | **No, as written** — "developed" is defined against the standard back rank, which 960 randomises | No |
| **Castling-shape dependent** | `rules.castling.reading.rights`, `.legality`, `rules.castling.event.rights_lost` | **Only after the 960 castling dialect lands** — rights are a `SquareSet` of rook squares, which is 960-general, but the readings must not assume e-file/a-h geometry | No |
| **Not portable, and not evidence** | `human.maia.candidate_wdl` | **No** — it *is* Maia | No |

**Two findings this table records, both of which the prompt for this draft did not anticipate:**

- **`human.maia.candidate_wdl` sits inside the candidate collector closure.** An "evidence-only"
  base built naively over `CANDIDATE_COLLECTOR_IDS` would still call Maia, which defeats the entire
  purpose and would silently reintroduce the 960 failure. §3's admission rule **excludes every
  projection whose grounding is `human_model`**, and criterion 2 asserts that exclusion is
  non-empty and contains this id — a criterion that fails if the exclusion is ever quietly dropped.
- **`candidateFeatureVector` requires a finite `scoreCp` per candidate**
  (`candidate-evidence.ts:194`, throws otherwise). So the *feature vector as shipped* presumes an
  engine that can score the position. For Chess960 that is satisfied — Stockfish 18 ships
  `UCI_Chess960` — but it means the selector is **not** engine-free, and any claim that it is would
  be false. Discharge D2 carries the score-free variant for Tier 2, where no scoring engine exists.

**Consequence, stated plainly:** this selector ports to **Chess960** once the two start-array
projections are either fixed or excluded, and it does **not** port to Tier 2 without a separate
feature family. Tier 2 is Discharge D2, not a silent inheritance.

### §2 — Where the weights come from, and the law-8 line

The selector scores each legal candidate as a sparse dot product of its flattened feature vector
with a weight vector, then softmaxes over the **complete legal set**.

**Weights are FITTED, never authored.** This is the law-8 boundary and it is the whole reason the
design is admissible:

- **Admissible:** weights fitted to *measured human move choices* — the Lichess band-conditioned
  move counts already captured in the R11/D815 corpus. A weight so fitted is a statement about
  **what people at a rating band actually played**, which is a measurement, not a claim about
  chess. This is the same ground that licenses Maia itself.
- **Refused:** weights authored to express what is *good* — "reward central control", "penalise
  loose pieces". Those assert chess truth, are exactly what law 8 forbids us to originate, and
  would make the bot a disguised engine with our opinions in it. **`REFUSED_AUTHORED_WEIGHT` is a
  compile-time refusal**, not a review convention: a weight vector whose provenance is not a fitted
  measurement fails registration, and criterion 5 is a must-fail fixture asserting it.

The fitting procedure is codex's preregistered one ([[D1162]]'s plan): deterministic diagonal
linear head, ridge `λ` chosen on one inner validation fold, five-fold split keyed on the FEN
digest, **human counts as labels only — never as a candidate feature**. This RFC does not
re-specify it; §6 binds to it.

**Explanation without causation.** Every feature name retains its projection id and payload path,
so the pick record ([[D818]]) can say *which registered measurements moved mass*. It may never say
the feature *caused* the human move, and the presentation layer's existing refusals apply
unchanged.

### §3 — Completeness redefined as legal-set coverage

This is the single most important mechanical constraint in the RFC.

At HEAD, `completeness` is a **mass sum**: `rows.reduce((sum, row) => sum + row.mass, 0)`
(`bot-policy-catalog.ts:327`), checked against `sampler.completenessThreshold` at `:458`. That gate
exists to catch a **truncated** policy vector — Maia returning eight of forty legal moves. It works
for a policy net, whose masses are a genuine subset of a distribution.

**It is vacuous for any score-derived base.** A softmax sums to 1 by construction, so a selector
that scored *three* of forty legal moves would report `completeness = 1.0` and sail through the
guard protecting the base layer ([[D1161]]). The gate would be measuring nothing — [[D444]]'s class,
inside the one check that stands between a fabricated distribution and a learner.

**The replacement, for every base whose mass is derived rather than emitted:**

> `coverage = |candidates scored| / |legal moves in the position|`, computed against the move
> generator's own legal set, and required to be **exactly 1.0**.

Not a threshold — **identity**. A policy net legitimately truncates; a selector has no excuse,
because it computes a feature vector per legal move and any absence is a bug. The base declares
which discipline it is under via a required `completenessKind: "mass_sum" | "legal_coverage"` field
on the layer, and:

- `mass_sum` remains for `provider.maia.raw_policy`, unchanged, so nothing about the shipped Maia
  path moves;
- `legal_coverage` is mandatory for this selector, and a `legal_coverage` base reporting anything
  below 1.0 **fails the run** rather than degrading.

**Criterion 3 is the one that matters**, and it is failable by construction: a fixture supplying a
selector base that scores a strict subset of the legal set must fail, *and* the same fixture under
the old mass-sum rule must pass — demonstrating the vacuity rather than asserting it.

### §4 — Composition: what actually changes, and what does not

**The input union already admits this.** `BotPolicyInput` at `bot-policy-catalog.ts:16-19` is:

```ts
export type BotPolicyInput =
  | "provider.maia.raw_policy"
  | "provider.stockfish.fixed_bound_loss"
  | `evidence.${string}@${number}`;
```

The templated `evidence.*` member is **already there**, and nothing in the file pins a base to
Maia — the only occurrence of the string `maia` is that type member. **So the premise that a closed
union blocks an evidence base is false at HEAD**, and this RFC records that rather than widening
something that needs no widening.

**What actually blocks it is the `HumanPolicyModelLayer` field contract** (`:49-56`), which is
Maia-shaped:

| Field | Today | Under this RFC |
|---|---|---|
| `engineId`, `modelId` | required strings identifying a model container | the selector declares its **fitted weight-set digest** as `modelId` and `"selector"` as `engineId`; both stay required, so provenance is not weakened |
| `band` | required number, validated against `engine-band.ts` | unchanged — a fitted weight set is fitted *per band*, which is exactly what the field means |
| `historyCapability` | the literal `"full_history"` — **one admissible value** | widened to `"full_history" \| "position_only"`. The selector is positional: it reads a FEN and a candidate list, with no game history. **Declaring `"full_history"` would be false**, and the field exists to be true. |

That widening is the RFC's one type change, and it is a **vocabulary** change, not a versioned
register change — argued in §5.

**Everything above the base is unchanged.** The sampler's `p^(1/T)` re-tempering, `ErrorGuard`'s
mask, `ControlledTrait[]`'s multipliers, `MemoryPolicy` and the presentation layer all operate on
`rawMass` rows and neither know nor care how the base produced them. Concretely: `applyPolicyMultiplier`
takes rows and a per-move multiplier and is base-agnostic (`:350`). **This is the payoff of the
composition design** — the roster's twelve profiles ([[D1180]]) compose over this base with no
change to their trait or guard declarations.

### §5 — The claims decision, argued

**`none`, and the argument is that nothing versioned is touched:**

- **No pack-schema lane.** Packs do not declare opponents' internals; `run.opponentPolicy` carries
  the profile triple ([[D938]]) and gains no field.
- **No run-schema lane.** The pick record already carries `features` ([[D813]]); this RFC makes
  them *originate* mass rather than accompany it, which changes no persisted shape.
- **No migration.** Fitted weight sets are build artifacts addressed by digest, stored beside the
  model containers the engine supervisor already mounts — not database rows.
- **No evidence-kinds member.** The selector consumes registered projections; it declares none.
- **The `historyCapability` widening and `completenessKind` addition are catalog-local**, exactly
  as `bot-policy` §1 argued for policy definitions ([[D936]]): they are TypeScript vocabulary inside
  one server module with no cross-package consumer and no persisted representation. **If a second
  consumer ever reads them, that consumer registers them as a shared resource first** — stated here
  so the exit is named rather than discovered.

`register-check` C1–C6 must be green with this RFC active, and criterion 11 asserts it.

### §6 — Calibration, and the free screen that gates everything

**This RFC is gated on codex's preregistered screen and does not restate it.**
`planning/platform-alignment/bot-policy/d1162-evidence-head-plan.md` fixes the population, the
folds, the flattening, the models, the measures and — critically — a **predeclared verdict** written
before any result was read. Its harness is `tools/d1162-evidence-head-harness/`. [[D1183]] records
that codex built this while the roster specified the same screen; **this RFC consumes their
instrument and adds none.**

The binding, restated as this RFC's obligations:

1. **The screen runs first, and it costs nothing** — zero engine calls over an already-captured
   corpus. If evidence-only fails to beat uniform, or evidence+engine fails to beat engine-only,
   **this RFC is withdrawn** and its ledger row records that registered arithmetic is explanatory
   context, not a policy head. That is a real outcome, not a formality.
2. **A pass licenses only the next preregistered population**, never production, never a label.
3. **Calibration is [[D819]], unchanged**: a stated Elo is a measured claim with its measurement
   cited, or it is not stated. Reuse `tools/d333-band-outcome-harness/` under [[D341]]'s seeding
   rules — distinct seed per worker, odd worker count, and **a zero-variance control treated as a
   defect rather than a result**.
4. **Acceptance is the error distribution, never mean Elo**: the eval-loss histogram and the
   blunder-rate-by-magnitude profile against band-binned human reference games. Mean-Elo equality
   is necessary and not sufficient, because skill is an error *distribution*.
5. **A composition change voids calibration**, because the profile digest covers the composition.
   A refitted weight set is a new base, and its profile card shows **no strength number** until
   re-measured.

### §7 — What this refuses

- **`human-like` as a word.** The compiler's existing `REFUSED_PERSONA_CLAIM` applies unchanged. A
  fitted-to-human-choices base is *a model of what people played*; whether it **feels** human is a
  measurement that the screen and then calibration either support or refuse.
- **Authored weights** (§2), by compile-time refusal.
- **Any implied Tier-2 support.** §1's table is the boundary; Discharge D2 owns the score-free
  feature family, and until it lands, Tier 2 gets no selector.
- **Silent degradation.** A `legal_coverage` base below 1.0 fails; it never falls back to a partial
  distribution.

## Deviations from design

One. `design/01-training-model.md` frames the opponent as modelling human choice, and names a
learned policy model as the mechanism. This RFC adds a second mechanism with the same *ground*
(measured human choices) and a different *representation* (fitted feature weights). The design's
intent is preserved and its stated mechanism is widened; recorded here rather than silently, and
the owner may veto the widening on [[D1271]]'s own authority.

## Acceptance criteria

1. **The feature census is derived, not asserted.** `make selector-feature-census` emits the
   admitted projection ids; the selector's declared input set is asserted **set-equal by id** to
   that output. The HEAD count is baked only as a drift tripwire. *Wrong implementation that would
   pass a literal count: one that drops a projection and adds another.*
2. **The `human_model` exclusion is non-empty and contains `human.maia.candidate_wdl`.** Fails if
   the exclusion is dropped, which would silently reintroduce Maia into an "evidence-only" base.
3. **Coverage identity, demonstrated against the old rule.** A fixture whose selector base scores a
   strict subset of the legal set **fails** under `legal_coverage`, **and passes** under
   `mass_sum` — the second half is what proves the old gate was vacuous rather than merely asserting
   it. *Red before the change, green after.*
4. **A `legal_coverage` base reporting < 1.0 fails the run**, with a typed refusal; no partial
   distribution reaches a sampler.
5. **`REFUSED_AUTHORED_WEIGHT` is a must-fail fixture**: a weight set whose provenance is not a
   fitted measurement fails registration.
6. **`historyCapability: "position_only"` is declared by the selector and refused for Maia** — a
   fixture asserting Maia cannot claim it and the selector cannot claim `"full_history"`.
7. **Layers above the base are untouched**: the same trait, guard and sampler declarations produce
   byte-identical multiplier application over a Maia base and a selector base, given equal input
   rows. *This is the composition claim, made failable.*
8. **The screen's verdict is honoured mechanically**: a profile carrying a selector base cannot
   register unless the screen's recorded verdict is `pass`, keyed to the plan's digest.
9. **No strength number without a calibration record** for that exact profile digest ([[D819]]).
10. **Chess960 portability, demonstrated**: the selector produces a coverage-1.0 distribution over a
    960 position's legal set, including a castling move in the king-takes-rook dialect ([[D1029]]) —
    the case Maia cannot parse at all.
11. **`register-check` C1–C6 green** with this RFC active and its claims block reading `none`.
12. **The two start-array projections are excluded or fixed**, asserted per-variant: a 960 position
    must not receive a `rules.phase.development` feature computed against the standard back rank.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Run [[D1162]]'s preregistered screen and record its verdict; a refutation **withdraws this RFC** | codex | `tools/d1162-evidence-head-harness/` | |
| D2 | The score-free feature family for Tier 2 variants, where no scoring engine exists (§1) | claude | `planning/platform-alignment/bot-policy/` | |
| D3 | Fix or exclude `rules.phase.development` / `rules.transition.event.developed` for randomised start arrays (§1) | codex | `planning/platform-alignment/bot-policy/` | |
| D4 | Calibrate every shipped selector profile per [[D819]]; no strength label before its record exists | codex | `planning/platform-alignment/bot-policy/` | |
| D5 | Register `historyCapability` / `completenessKind` as shared resources **if** a second consumer appears (§5) | claude | `rfc/README.md` | |

## Open questions

1. **Which band set does the first fitted weight release cover?** The roster's four
   (1000/1400/1800/2200) are the pre-registered D324 arms, but the R11 capture holds 1400/1600/1800.
   Fitting outside the captured bands requires a new capture. *Recommendation: fit the three captured
   bands first and treat the roster's four as the target after D1 passes.* Not blocking.
2. **Does a selector base need its own `ErrorGuard` default?** The shipped 250 cp threshold was
   measured against Maia's error profile; a selector's profile is unknown until D1 runs.
   *Recommendation: inherit 250 cp, and re-measure as part of D4.* Not blocking.

## Ledger rows

*(Proposed — id assigned at landing; head was **D1284** at drafting.)*

- **📊** — `BotPolicyInput` **already admits** `` `evidence.${string}@${number}` `` at
  `bot-policy-catalog.ts:16-19`, and nothing in the module pins a base to Maia. The premise that a
  closed union blocks an evidence base is **false at HEAD**; the real obstacle is
  `HumanPolicyModelLayer`'s Maia-shaped field contract (`engineId`, `modelId`, `band`, and
  `historyCapability` as a **one-value literal**). A materially smaller problem than "widen a closed
  union", and it changes what the work is.
- **🐞** — **`human.maia.candidate_wdl` is inside `CANDIDATE_COLLECTOR_IDS`**
  (`candidate-evidence.ts:67`), so an "evidence-only" base built over the shipped closure **would
  still call Maia** and would silently reinherit the 960 parse failure. Criterion 2 makes the
  exclusion failable.
- **🐞** — **`candidateFeatureVector` requires a finite `scoreCp` per candidate**
  (`candidate-evidence.ts:194`, throws otherwise), so the selector is **not engine-free**. True for
  960 (Stockfish ships `UCI_Chess960`); false for Tier 2, where no scoring engine exists — hence
  Discharge D2 rather than an assumed inheritance.
- **📊** — the shipped `completeness` is a **mass sum** (`bot-policy-catalog.ts:327`) checked at
  `:458`, so any softmax-derived base passes it **vacuously**. Replaced for derived bases by
  **legal-set coverage as an identity**, with criterion 3 proving the vacuity against the old rule
  rather than asserting it.

## Changelog

- 2026-08-23 — drafted on owner ruling [[D1271]] (fund [[D810]]'s evidence-to-move selector), from
  `design/research/non-maia-bot-composition.md` and `planning/bot-roster/roster.md`. Consumes
  codex's preregistered [[D1162]] screen rather than duplicating it ([[D1183]]). Four source
  corrections recorded in the ledger rows above, the first of which narrows this RFC's own premise.
