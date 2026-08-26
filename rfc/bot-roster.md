# RFC: Bot roster

- **Status:** draft — returned on buildability 2026-08-26. The measured four-band × three-family product and [[D1566]]'s one-persona-per-profile ruling stand, but the present contract cannot implement D969's typed mixed-domain guard, lets a pawn trait run after its required guard abstains, accepts caller-forged trait strings, has no production composition route, omits the combined selection budget, and does not own the ruled Play picker/card/identity outcome. Its orthogonality criterion is also both empirically overstated and mechanically incompatible with per-profile presentation layers. Exact return: `planning/bot-roster/buildability-return-2026-08-26.md`. `BOT_POLICY_PROFILES` remains intentionally empty.
- **Author:** claude (drafted from `planning/bot-roster/roster.md`, which assembled the dossier numbers for the first time)
- **Created:** 2026-08-23
- **Design refs:** `design/00-thesis.md` (*"a human-like opponent while truly applying an opening/middlegame/endgame"*); `design/03-product-breadth.md` §Just Play (*"choose a side/position/opponent"*). The bot lane has no design-tier section; its intent authority is the owner ideation [[D810]]–[[D812]] and the O8 ruling, quoted in `bot-policy` §0. A `design/` bot section remains owner work under law 5.
- **Exploration gate:** the owner's repeated ask, three times recorded — [[D810]] *"a proper Elo range of bots that play human-like, with personalities"*, *"nice bots that play human / with personalities"*, and the honest-label rule [[D819]]. Drafting licence: [[D1093]]'s mandate plus [[D1271]] funding the adjacent selector.
- **Depends on:** accepted `rfc/bot-policy.md` (the grammar, the compiler, §7's label rule — this RFC declares instances against it and amends it in exactly one place, §3.2 below). `rfc/evidence-move-selector.md` (draft, [[D1271]]) is the eventual variant-portable base and is cited, not depended on.
- **Parent / amends:** amends `rfc/bot-policy.md` §2.4's guard literals (depth-12 numbers quoted as production; production is depth 8) and its `ErrorGuardLayer.searchBound` union.
- **Planning:** `planning/bot-roster/`

```tabiya-claims
run-schema | lane 0.22 | ErrorGuardLayer.searchBound.kind admits "depth" (schemas/drill_run.schema.json:140 enum ["nodes","movetime"] gains "depth"; packages/runtime/src/types.ts and apps/server/src/bot-policy-catalog.ts unions widen in step)
```

## Summary

The accepted `bot-policy` RFC specifies a seven-layer composition **grammar** and ships **no
compositions**. This RFC registers **twelve profiles** — four measured bands × three families — as
the instances that grammar exists to carry, each spelled out layer by layer against the shipped
contracts, each with the measured basis for every literal.

The roster is coherent because of one measurement: at a fixed band the guard shifts expected loss
**1.36 cp** and the trait **1.01 cp**, two orders of magnitude below the **~60-Elo**
session-resolution floor a learner can perceive. **So the band is the strength range and the family
is the personality, and neither contaminates the other** (§2). That is asserted as a criterion, not
a remark.

Twelve is the roster. **Four ship first because eight are blocked, and the blockers are named with
their real sizes** — not because four is the scope ([[D1230]]). Two obligations gate the other
eight: `searchBound` cannot express **depth**, which is the only measured production bound (§3.2,
a run-schema lane), and **nothing populates `candidate.traits`**, so a registered trait multiplies
by 1 on every candidate (§3.3).

Every profile registers `uncalibrated` and shows **no strength number**, per [[D819]]. The
calibration ladder is specified (§5) and **is not funded**: Gate 0 ran on 2026-08-23 and
**abstained** on a failed positive control ([[D1184]]).

## Motivation

The owner has asked three times. The grammar was accepted, the compiler shipped, and the catalog
stayed empty — an outcome nobody chose and no ledger row recorded until [[D1181]]. `bot-policy`
cites **one** of the nine dossiers in its own lane; `maia-production-band-roster.md`, the dossier
named for this roster, is cited **zero** times. The numbers below were assembled for the first time
in `planning/bot-roster/roster.md`.

**Out of scope, each with a named home and owner** ([[D1230]] — a deferral without a home is not a
deferral):

| out of scope | why | home | owner |
|---|---|---|---|
| absolute human Elo on any card | the ladder is untimed engine-vs-engine; maia1's own rating spans ~230 Elo across time controls | Discharge D5 | OWNER |
| an opening book | measured out at **79.2%** fallthrough on both arms against a 25% ceiling | `bot-policy` §8 | — (refused, not deferred) |
| cross-game memory | `assertLayer` fails any `memory` layer; ruled off by O8.3 | `bot-policy` §2.6 | — (refused) |
| a variant-portable human base | Maia cannot parse a 960 position at all ([[D1161]]) | `rfc/evidence-move-selector.md` | codex |
| Stage-B `features` driving traits | `features` rides the record and never enters the composition ([[D1162]]) | Discharge D4 | OWNER |
| endgame guard behaviour | the R11 population stops at ply 20; zero endgame cells measured | `bot-policy` Open question 4 | claude |

## Specification

### §1 — The roster is a derivation, not a list

**Twelve is `bands × families`, and the criterion asserts set-equality against that product rather
than the integer** ([[D1240]] — a hand-summed total handed to a criterion is unfalsifiable).

```
BANDS    = [1000, 1400, 1800, 2200]        // the four pre-registered D324 arms
FAMILIES = ["human-baseline", "guarded-human", "pawn-forward"]
ROSTER   = FAMILIES × BANDS                 // ids: `${family}-${band}`
```

`make bot-roster-census` derives the expected id set from `BANDS × FAMILIES` and asserts
`BOT_POLICY_PROFILES` is **set-equal by `(id, version)`** to it. The count **12** is baked only as a
drift tripwire, never as the assertion.

**The four bands are the four pre-registered D324 arms, not values chosen after reading results**
`[V]` (`maia-production-band-roster.md` §Verdict). Refused, each with its measurement:

| refused | measurement |
|---|---|
| a 100-point grid | 100-point steps buy **22.1** and **26.9** Elo — below the ~60-Elo floor `[V]` |
| band 2400 | 2000→2400 buys **28.9** Elo, 95% CI **[−16.7, 74.5]**, p = .21 `[V]` |
| an interpolated five-to-nine-rung ladder | a capacity estimate from dividing a threshold by a slope, not compared adjacent arms `[V]` |

The measured ladder, all three adjacent 95% CIs disjoint, 1,020 games per rung `[V]`
(`maia-band-outcome-transfer.md` §5):

| rung | score vs band-1400 reference | Elo | 95% CI | segment gain | above the ~60 floor |
|---:|---:|---:|---|---:|:--:|
| 1000 | 0.3069 | **−141.6** | [−161.5, −122.4] | — | — |
| 1400 | 0.4990 | **−0.7** | [−18.1, 16.8] | +141.6 | ✅ |
| 1800 | 0.6304 | **+92.7** | [75.1, 110.8] | +93.4 | ✅ |
| 2200 | 0.7652 | **+205.2** | [181.3, 231.0] | +112.5 | ✅ |

Span **346.8 Elo** [315.2, 378.3] corpus-wide; **479.8** [454.9, 504.7] at ≥21 pieces `[V]` (§5).

### §2 — Orthogonality, and why it makes a roster rather than a difficulty slider

| axis | what it is | measured effect |
|---|---|---|
| band | the strength range | **346.8 Elo** across four rungs `[V]` |
| family | the behaviour at a fixed band | expected-loss shift **+1.36 cp** (guard), **−1.01 cp** (trait) `[V]` |

A 1.36 cp shift is two orders of magnitude below the ~60-Elo perception floor. **The band is the
range; the family is the personality; they do not contaminate each other.**

This is enforced structurally, not hoped for. §6's criterion 2 has two arms:

- **(a) same band ⇒ byte-identical model layer.** Any two profiles sharing a band declare the
  *same* `model.maia3.band-<b>@1` declaration. A wrong implementation that encodes family strength
  by nudging the band fails here.
- **(b) same family ⇒ byte-identical non-model layers.** Any two profiles sharing a family declare
  the same sampler, guard and trait layers. A wrong implementation that gives the 2200 rung a
  gentler guard fails here.

Arm (a) fails a band-as-personality encoding; arm (b) fails a personality-as-band encoding. The
compiler already helps: `compileBotPolicyCatalog` rejects one layer `id@version` carrying different
canonical declarations across profiles `[V]` (`bot-policy-catalog.ts:283-290`), which is why
**band-specific model ids are mandatory** rather than stylistic.

### §3 — The shared layers, and the two obligations that block eight profiles

#### 3.1 Five layer kinds are identical across all twelve

| layer | id | literals | measured basis |
|---|---|---|---|
| **HumanPolicyModel** | `model.maia3.band-<b>@1` | `engineId: "maia-5m"`, `modelId: "maia3-5m@b6559de2…"`, `band: <b>`, `historyCapability: "full_history"` | pinned image `chess-tabiya-maia:1e13597`, `eloHonored: true`, `seedHonored: false`, `bandRange {1000, 2400}` `[V]` (`maia.ts:3-11`) |
| **Sampler** | `sampler.maia_reconstruction@1` | `temperature: 0.8`, `topP: 0.92`, `completenessThreshold: 0.97` | shipped production defaults `[V]`. The reconstruction predicts **19.84 cp / 0.39%** severe mass against a captured production sample of **19.57 cp / 0.36%** — agreement **0.27 cp / 0.03 pp** `[V]` (`bot-policy.md` §4). Threshold 0.97 sits below the measured MultiPV-20 raw-mass floor: median **0.999625**, minimum **0.979540** `[V]` |
| **Repertoire** | *absent, not "off"* | — | measured out: **57/72 plies (79.2%)** fallthrough on both the authored-spine and the frozen 2,519,503-game statistical book, against a pre-registered 25% ceiling `[V]`. The card says *"no opening book"* |
| **Memory** | *cannot exist* | — | `assertLayer` fails any `memory` layer `[V]` (`:195`) |
| **Presentation** | `persona.<name>@1` | `name`, `bio` | **required** — `compileBotProfile` fails a profile lacking `human_policy_model`, `sampler` **or** `presentation` `[V]` (`:260-262`). `REFUSED_PERSONA_CLAIM` fails compilation on `human-like`, `aggressive`, `solid`, `tactical`, `positional`, `tricky`, `adaptive`, `plays like` `[V]` (`:173`) |

#### 3.2 Obligation A — `searchBound` cannot express depth (blocks 8 of 12)

`ErrorGuardLayer.searchBound.kind` is the union `"nodes" | "movetime"` `[V]`
(`bot-policy-catalog.ts:76`). **Depth 8 is the only measured production bound**, and node bounds are
**refused by population completeness**: at 25k nodes only **16/50** pack roots were all-exact, at
50k only **15/50**, and more nodes did not monotonically improve. Depth 8/10/12 each returned one
exact row for all **958** requested candidates across all 50 roots `[V]`
(`stockfish-candidate-guard-probe.md` §4). **The shipped type cannot declare the shipped answer.**

Depth 8 over depth 10/12: depth 12 breaks the live shallow-call budget (1,403 ms cold end-to-end);
depth 10 changes **no** gate outcome and costs a 729 ms tail; depth 8 stays at **499.1 ms** cold,
Stockfish-only p95/max **105/129 ms** `[V]` (§7).

**The widening is a run-schema change**, which is why this RFC claims a lane rather than treating it
as a local type edit: `searchBound` is a persisted field of the run schema at
`schemas/drill_run.schema.json:140` with `"enum": ["nodes", "movetime"]`. The sites, enumerated
rather than counted:

| site | what it is |
|---|---|
| `schemas/drill_run.schema.json:140` | the persisted enum — **the reason this is lane 0.22** |
| `packages/runtime/src/types.ts` | the shared union |
| `apps/server/src/bot-policy-catalog.ts:76` | the layer declaration union |
| `apps/server/src/rest.ts:260-265` | a **hard throw** on any other kind |
| `apps/server/src/opponent-selector.ts` (2 inline unions) | duplicated narrowings |
| `apps/server/src/candidate-evidence.ts` | the guard's caller |
| test/fixture sites | `storage.test.ts`, `opponent-selector.test.ts`, `candidate-evidence.test.ts`, `engine-supervisor.test.ts`, `bot-policy-catalog.test.ts`, `packages/schema/src/drill-run.test.ts` |

`make searchbound-sites` derives the set; criterion 5 asserts the widening reaches every member of
the derived set, so a partial widening fails rather than passing on a count.

**Two corrections to the record, both re-derived at HEAD:**

1. ⟳ **The timeout ternary is semantically wrong and currently harmless**, which is not what
   [[D1250]] recorded. At `opponent-selector.ts:664` (HEAD):
   `timeoutMs: searchBound.kind === "nodes" ? 5_000 : Math.max(5_000, searchBound.value * 10)`.
   A depth bound falls to the movetime arm and is multiplied as if it were milliseconds — but
   `Math.max(5_000, …)` floors it: depth 8 → `max(5000, 80)` = **5,000 ms**, depth 12 → **5,000 ms**.
   D1250's *"a depth-8 bound would be handed an 80 ms timeout"* is **wrong**; the floor saves it for
   every realistic depth. The defect is that a depth is treated as a duration at all, and the
   widening must give `depth` its own arm rather than relying on a floor to mask the category error.
2. `go ${searchBound.kind} ${searchBound.value}` at `:660` already emits valid UCI for `go depth 8`.
   The command layer needs **no change**; the type, validation and schema layers are the whole job.

**Amendment to `bot-policy` §2.4**, carried here because this RFC declares the guard instances:
§2.4 quotes *"removes all measured severe mass, −1.27 cp expected-loss shift, 100.2% explorer-match
retention"* and §0 quotes pawn ×4 at **+11.97 pp**. Those are the **depth-12** numbers. Production is
depth 8 `[V]` (`stockfish-candidate-guard-probe.md` §7):

| bound | severe mass removed | strengthening | human-match retention | pawn ×4 |
|---:|---:|---:|---:|---:|
| **depth 8** | **100%** | **1.36 cp** | **100.21%** | **+12.28 pp** |
| depth 12 | 100% | 1.27 cp | 100.2% | +11.97 pp |

**Mixed score domains abstain**: 11 of 279 positions (**3.94%**, 33 band cells) return a mixed
mate/cp candidate vector; the guard abstains for the whole position and leaves the base distribution
unchanged, measured to preserve every gate verdict `[V]`.

#### 3.3 Obligation B — nothing populates `candidate.traits` (blocks 4 of 12)

`applyPolicyMultiplier` keys the trait on `candidate.traits?.includes(layer.classifier)` `[V]`
(`bot-policy-catalog.ts:509`). A grep over `apps/server/src` and `packages/runtime/src` for
`traits:` outside test files returns **zero** results; the only writes are
`bot-policy-catalog.test.ts:204-205`. **A registered trait multiplies by 1 on every candidate**, so
family C is inert until a classifier registry exists.

The obligation: a pure `(rootPosition, moveUci) => string[]` registry, called where the Maia vector
is assembled, populating `traits` before the composition runs. Stage A only — no collector, no
evidence id, no learner input. Criterion 6 fails if a registered trait's multiplier changes no
candidate's mass on a fixture where the classifier matches.

#### 3.4 A correction to [[D1181]] — the trait gate DOES have a unit check

[[D1181]] and `planning/bot-roster/roster.md` §2.1 both record that the gate has no unit check and
that a declaration carrying `traitDelta: 12.28` would pass for the wrong reason. **Both are stale at
HEAD.** The field is `traitDeltaFraction`, and the gate is `[V]` (`bot-policy-catalog.ts:226-232`):

```
traitDeltaFraction < 0.1  ||  traitDeltaFraction > 1  ||  |expectedLossShiftCp| > 35
  ||  severeMassRise > 0.01  ||  explorerMatchRetention < 0.9   ⇒ fail
```

The `> 1` arm rejects `12.28` outright, and the field name states its unit. **No fix is owed.** The
roster's proposed obligation is withdrawn here rather than carried into an RFC that would have
specified work already done.

### §4 — The twelve profiles

Ledger: [[D1375]] — the adoption row this roster answers is stale in both halves; its *declared repertoire* is refused on measurement here (§6), and its five-to-nine rung figure is refused as a method at §1.

Persona names are **placeholder**: a name is presentation-tier and carries zero policy content. The
owner or design tier picks the final set; changing a name changes the profile digest and voids any
calibration, which is why the names ship before calibration rather than after.

**Family A — Human baseline.** `HumanPolicyModel → sampler → presentation`. No curator, no trait.
**Registrable today**: zero blockers beyond §3.3's registry, which family A does not need.

| profile id | v | band | persona | guard | traits | calibration |
|---|--:|--:|---|---|---|---|
| `human-baseline-1000` | 1 | 1000 | `persona.pip@1` | — | — | `uncalibrated` |
| `human-baseline-1400` | 1 | 1400 | `persona.wren@1` | — | — | `uncalibrated` |
| `human-baseline-1800` | 1 | 1800 | `persona.ora@1` | — | — | `uncalibrated` |
| `human-baseline-2200` | 1 | 2200 | `persona.kestrel@1` | — | — | `uncalibrated` |

**Family B — Guarded.** `… → guard.severe_error@1 → presentation`. Blocked on §3.2.

| profile id | v | band | persona | guard | traits | calibration |
|---|--:|--:|---|---|---|---|
| `guarded-human-1000` | 1 | 1000 | `persona.bramble@1` | depth 8 / 250 cp | — | `uncalibrated` |
| `guarded-human-1400` | 1 | 1400 | `persona.junco@1` | depth 8 / 250 cp | — | `uncalibrated` |
| `guarded-human-1800` | 1 | 1800 | `persona.marlow@1` | depth 8 / 250 cp | — | `uncalibrated` |
| `guarded-human-2200` | 1 | 2200 | `persona.harrow@1` | depth 8 / 250 cp | — | `uncalibrated` |

**Family C — Pawn-forward.** `… → guard → trait.pawn_preference@1 → presentation`. Blocked on §3.2
and §3.3. **There is no unguarded pawn-heavy profile**, and that is a measurement consequence: every
R11 trait arm was measured *after* the guard, and an unguarded trait can raise severe mass — which
the compiler's `severeMassRise ≤ 0.01` gate would then have no measurement to clear `[V]`.

| profile id | v | band | persona | guard | traits | calibration |
|---|--:|--:|---|---|---|---|
| `pawn-forward-1000` | 1 | 1000 | `persona.thatch@1` | depth 8 / 250 cp | `pawn_move` ×4 | `uncalibrated` |
| `pawn-forward-1400` | 1 | 1400 | `persona.furrow@1` | depth 8 / 250 cp | `pawn_move` ×4 | `uncalibrated` |
| `pawn-forward-1800` | 1 | 1800 | `persona.drover@1` | depth 8 / 250 cp | `pawn_move` ×4 | `uncalibrated` |
| `pawn-forward-2200` | 1 | 2200 | `persona.colter@1` | depth 8 / 250 cp | `pawn_move` ×4 | `uncalibrated` |

**What a learner would notice** — each sentence describes a declared mechanism or a measured rate,
uses none of the eight refused words, and states no strength number:

| profile | noticed |
|---|---|
| `human-baseline-*` | It plays the moves the largest number of players at that band play, and nothing checks those moves afterwards — so the pieces it leaves hanging stay hanging. |
| `guarded-human-*` | Before it draws, a depth-8 Stockfish search prices every move it was considering and removes anything 250 centipawns or more behind its own best candidate: the club moves stay, the one-move disasters go. |
| `pawn-forward-*` | It reaches for a pawn about twelve moves in a hundred more often than the same guarded profile at the same rung, and nothing else about how it chooses has changed. |

### §5 — The trait set

#### 5.1 What exists

One trait has ever cleared the gate, and it lives in a test file `[V]`
(`bot-policy-catalog.test.ts:181`; [[D1142]]).

| id | classifier | mult | traitDeltaFraction | loss shift | severe-mass rise | explorer retention | verdict |
|---|---|--:|--:|--:|--:|--:|---|
| `trait.pawn_preference@1` | `pawn_move` | ×4 | **0.1228** | **−1.01 cp** | **0** | **0.988** | **PASS** (depth 8) |

#### 5.2 The two laws that predict pass and fail

Three measured arms `[V]` (`bot-policy.md` §5):

| arm | class share (base) | mult | naive `mp/(mp+1−p)` ⊕ | measured | realised/naive |
|---|--:|--:|--:|--:|--:|
| pawn ×4 | 32.92% | ×4 | +33.3 pp | **+11.97 pp** | 36% |
| forcing ×3 | 21.50% | ×3 | +23.6 pp | **+3.02 pp** | 13% |
| quiet ×3 | 78.50% | ×3 | +12.5 pp | **+2.24 pp** | 18% |

**Law S — the suppression ceiling.** A multiplier < 1 on class *C* cannot move *C*'s rate by more
than *C*'s base rate. **Any class with a base rate below 10 pp can never clear the ≥0.1 gate by
suppression.** ⊕

**Law A — the amplification shortfall.** Shortfall is not explained by base rate: pawn (33%) and
forcing (22%) have similar shares yet realise 12 pp and 3 pp. The post-truncation distribution is
concentrated — **2.41 effective moves after the guard** `[V]` — so a position contributes only when
the class holds *intermediate* mass there. Ceiling-bound classes (quiet, 78.5%) and floor-bound ones
(truncated to ~zero) both realise little. **The predictor is the fraction of positions where the
class holds intermediate mass, not its mean share.** ⊕

**The screen is free.** Over the surviving R11/D815 capture (837 position-band cells, MultiPV-20,
**zero engine calls**), compute per-position class mass share, report the fraction of cells in
(0.05, 0.80), and simulate the multiplier by pure arithmetic over captured rows `[V]`. No trait
below is proposed on intuition.

#### 5.3 The proposed set, with predicted gate outcomes

All Stage A — pure arithmetic on root position and UCI move.

| id | classifier | mult | biases | predicted | why |
|---|---|--:|---|---|---|
| `trait.pawn_preference@1` | `pawn_move` | ×4 | pawn advances and captures | **MEASURED PASS** | +12.28 pp at depth 8 `[V]` |
| `trait.minor_piece_preference@1` | `minor_piece_move` | ×4 | knights and bishops stay busy | **LIKELY PASS** | closest structural analogue to pawn — a large class spread over several candidates, intermediate-mass in most positions (Law A). Screen first |
| `trait.central_destination_preference@1` | `central_destination` | ×4 | play aimed at the middle | **UNKNOWN — screen** | base rate and spread unmeasured; only intermediate-mass share matters |
| `trait.long_move_preference@1` | `long_move` | ×4 | sweeping slider moves | **UNKNOWN — screen** | correlation with engine loss unknown; the ≤35 cp arm is the one at risk |
| `trait.piece_repeat_avoidance@1` | `moved_piece_repeat` | ×0.25 | stops shuffling one piece | **UNKNOWN — screen, Law S first** | R11's repeat ×0.25 moved its named rate 25.5% but on a same-position metric R11 explicitly refuses as a personality result `[V]`. If the piece-repeat base rate is under 10 pp, Law S kills it before any run |
| `trait.rim_destination_avoidance@1` | `rim_destination` | ×0.25 | keeps pieces off the edge | **LIKELY FAIL** | suppression; Law S caps the delta at the base rate |
| `trait.capture_preference@1` | `capture` | ×4 | grabs material | **LIKELY FAIL** | strict subset of `forcing`, which failed at ×3 (+3.02 pp) and **still failed at ×8 (+5.94 pp)** `[V]`; a subset cannot beat its superset's ceiling |
| `trait.check_preference@1` | `gives_check` | ×4 | chases the king | **LIKELY FAIL** | the other, smaller half of `forcing` |
| `trait.rank_advance_preference@1` | `forward_move` | ×3 | pushes forward | **LIKELY FAIL** | ceiling-bound like quiet ×3 |
| `trait.king_activity@1` | `king_move` | ×4 | walks the king up | **FAIL ON THIS POPULATION** | the R11 corpus stops at ply 20 and `bot-candidate-sharpness.md` measured **zero endgame cells**. A trait whose domain is unrepresented cannot be measured — the gate working |

#### 5.4 Traits that must not be proposed

| refused | measurement |
|---|---|
| `forcing` ×3/×8, `quiet` ×3 | permanent negative fixtures; registration must be attempted and fail `[V]` |
| salience-shaped (threat-just-created) | [[D815]] refused: stationary-created class covered 7 positions; the augmented model *worsened* RMSE `[V]` |
| multi-band Maia disagreement | [[D817]] refused: Pearson **0.021–0.044**, sign agreement **47.2–52.0%** `[V]` |
| anything keyed on `features` | `features` rides the record and never enters the composition `[V]` ([[D1162]]) |
| temperature or top-p as a personality dial | **it is a strength dial**: T=5.0 scored 0.9368 → **+468.3 Elo** [417.9, 536.0] `[V]` — larger than the entire band range |
| any delay effect | `assertLayer` fails `effect: "delay"` `[V]`; [[D820]] |
| any learner-derived input **or parameter** | `LEARNER_INPUT` regex, extended to parameter provenance by `bot-policy` §3 |

### §6 — Calibration, and why the ladder is not funded

**The rule** ([[D819]], `bot-policy` §7): *a bot's stated Elo is a measured claim with its
measurement cited, or it is not stated.* The digest is an RFC-8785 SHA-256 over the whole canonical
composition `[V]` (`:241-273`), so **changing any layer voids the calibration by construction**.

**Gate 0 ran and abstained.** On 2026-08-23 the D1163 harness replayed the surviving capture (268
positions, bands 1400/1600/1800, zero engine calls). Its **Maia positive control failed** the
declared band-identity test — 1400/1600/1800 profiles peaked on human 1600/1800/1800 — while
Stockfish argmax and all four cp-Boltzmann profiles peaked on human 1800. The adverse direction is
consistent with the fail shape, but **a failed positive control bars the formal refutation**.
[[D1184]] requires a new preregistered statistic and population before this gate is reused `[V]`.
**Do not reinterpret the result and do not rerun a duplicate instrument.** The ladder below is
specified and **blocked on D1184**.

**The arms**, common reference raw Maia band 1400 at MultiPV 1:

| # | arm | games | answers |
|---|---|--:|---|
| C1 | null control (reference vs reference) | 800 | is the instrument biased? |
| C2 | positive control (T = 5.0) | 400 | is the instrument blind? |
| N | negative control: Stockfish `UCI_LimitStrength` at band | 800 | rejected doctrine, retained so the roster can be shown to beat it |
| A1–A4 | `human-baseline-*` vs reference | 4 × 800 | which rung each unguarded profile sits on |
| B1–B4 | `guarded-human-*` vs reference | 4 × 800 | which rung each guarded profile sits on |
| P1–P4 | `pawn-forward-*` vs reference | 4 × 800 | which rung each pawn profile sits on |
| G1 | `guarded-human-1400` vs `human-baseline-1400`, paired | 800 | **prices the guard** |
| G2 | `pawn-forward-1400` vs `guarded-human-1400`, paired | 800 | **prices the trait** |

**Total 12,400 games across 16 arms; ≈4–5 h** on the D333 host (13 Maia + 13 Stockfish
oversubscribe 14 cores, so the guarded portion runs at 7 paired workers) ⊕. D333 itself ran 16,660
games in 2 h 16 m — the same order of magnitude, not a new scale.

**A2 is not redundant with C1** and is the arm nobody has run: the reference draws from Maia's
internal unseeded RNG at MultiPV 1, while A2 draws from **our seeded sampler over the full-width
reconstructed vector**. Agreement is 0.27 cp / 0.03 pp per move `[V]`, but compounded over 63 plies
that is not obviously zero Elo. **A2 is the reconstruction-fidelity arm.**

**Size, stated before the run rather than discovered after it.** 95% CI ≈ ±500–700/√n ⇒ n = 800
gives ±17.7 to ±24.7 Elo ⊕. But D333's measured MDE from observed clustered dispersion was 13.8 Elo
at n = 3,400 and 24.9 at n = 1,020 `[V]` ⇒ **≈29 Elo at n = 800** ⊕.

> **This ladder resolves which rung each profile sits on. It does NOT resolve whether the guard or
> the trait costs Elo** — their shifts are 1.36 cp and 1.01 cp, far below anything 800 games can
> see. **G1 and G2 will return an upper bound, not a null, and must be reported as one.**

**[[D341]]'s seeding rules are mandatory.** The first D333 run produced **611/611** mirrored pairs
with byte-identical move lists, a **50.8%** duplicate rate, and a same-band control at exactly
0.500000 with standard error exactly 0.0 — *"the most confident possible wrong answer"* `[V]`.
Distinct seed per worker; **odd** worker count; count distinct move lists; **a zero-variance control
is a defect, not a result**; `Elo` on every request ([[D58]]); `SelfElo`/`OppoElo` **before** `Elo`
([[D91]]); paired openings colour-swapped; cluster-robust SE; no engine adjudication.

**The distribution acceptance test — never mean Elo alone**, predeclared before results are read:

| # | test | bound |
|---|---|---|
| 1 | eval-loss histogram vs band-binned human games | shape agreement, bounds fixed before reading |
| 2 | **Regan–Haworth (s, c) fit** | **both** parameters inside the band envelope. *s* falls .078 @2700 → **.165 @1600**; *c* stays **0.430–0.545** `[V]`. An arm can match a 1400 mean while carrying an (s,c) split no human 1400 has |
| 3 | blunder-rate-by-magnitude tail | Chabris: **5.02 / 6.85 / 7.63** per 1,000 moves classical/rapid/blindfold `[V]` — tail *shape*, not the GM rate |
| 4 | move-match rate | band-peaked (Maia 46–52%) not rating-rising (search 33–41%) `[V]` |

**Three gaps stated here rather than discovered in results:**

1. ⚠ **The guarded family cannot pass test 3 above 250 cp, by construction** — the guard removes
   **100%** of measured ≥250 cp mass. This is a predictable structural failure; the honest response
   is that the guarded card **states its tail is truncated at 250 cp**, not that the test is relaxed.
2. ⚠ **Regan's table starts at 1600**, so bands 1000 and 1400 have no published envelope — they must
   be fitted from our own band-binned corpus, not extrapolated.
3. ⚠ **The explorer reference dies at ply ~20** (zero games from ply 27), so tests 1–4 over full
   games need the frozen game corpus, not the explorer.

### §7 — The uncalibrated card

A profile with no calibration record **for that exact digest** shows **no strength number**.

| row | content |
|---|---|
| identity | *"Human-policy band 1400"* — **never** "1400 Elo", never beginner/intermediate/advanced/expert |
| model | engine, model, checkpoint, container digest |
| sampler | `sampler.maia_reconstruction@1`, T 0.8, top-p 0.92, completeness 0.97 |
| curator | the guard's `disclosure` string, which **must embed each declared literal verbatim or compilation fails** `[V]` (`:212-213`) |
| information advantage | the guard is an explicit information advantage and says so |
| controlled traits | the registered traits and multipliers, or *"none"* |
| opening book | *"none"* |
| memory | *"none"* |
| **strength** | **`uncalibrated` — no number** |
| band attenuation | *"below about ten pieces the band buys roughly **0.07** real Elo per band point instead of **0.40**"* — 1000 v 2400 is **−468.9** Elo at ≥21 pieces, **−145.5** at 11–20, **−72.4** at ≤10 `[V]` |
| endgame unknown | *"the guard's effect in the endgame is unmeasured"* |
| degraded path | when raw mass < 0.97 the selection falls back to Maia's `bestmove`, the record says `applied: false`, and **the card renders the base model, not the profile** |

**After calibration**: the band-relative figure, its 95% CI, harness, date, game count, time-control
scope — **and nothing else**. No absolute human Elo until Discharge D5 is ruled. Only the calibrated
value may feed a rating update; `targetElo` never may `[V]` ([[D344]]).

### §8 — Honest gaps

| gap | status |
|---|---|
| **Chess960 has no human-trained policy net** | the blocker is **absent weights**, not an absent instrument — Maia-1 is an Lc0 net and lc0 has supported `UCI_Chess960` since v0.23/v0.25 `[V]` ([[D1160]]). Worse: the pinned sidecar builds `chess.Board(fen)` with **no `chess960=True`**, so it cannot *parse* 960 and the failure is silent castling deletion `[V]` ([[D1161]]). Route: `rfc/evidence-move-selector.md` ([[D1271]]) |
| **Repertoire and Memory** | ⟳ **[[D1182]] corrects [[D1142]]**: `RepertoireLayer` (`:65`) and `MemoryLayer` (`:87`) both exist, are union members, and are executed/refused. The RFC's *prose* names were absent; the interfaces are not. Repertoire is measured out; memory is compile-refused |
| **Personalities are bounded by Stage A arithmetic** | the vocabulary is what a pure function of (position, move) can label. Binding `features` into the composition is Discharge D4, owner-owned |
| **Absolute human Elo** | Discharge D5. Until ruled, band-relative with citation is the ceiling of what any card may show |
| **Perceptual human-likeness** | zero human judgements exist; the 42-branch blind packet is an **owner-use** instrument that can reject a profile but cannot clear H5/C5 as a population claim |

## Deviations from design

One. `design/` has no bot section, so this RFC's intent authority is owner ideation plus the O8
ruling rather than a design document. Writing that section is owner work under law 5 and is not done
here.

## Acceptance criteria

1. **The roster is derived, not listed.** `make bot-roster-census` derives the expected id set from
   `BANDS × FAMILIES` and asserts `BOT_POLICY_PROFILES` set-equal by `(id, version)`. *Wrong
   implementation that passes a count-only check:* one that registers twelve profiles with a
   duplicated band and a missing one. The count 12 is a drift tripwire only.
2. **Orthogonality, two arms.** (a) any two profiles sharing a band declare a byte-identical
   `human_policy_model` layer; (b) any two sharing a family declare byte-identical non-model layers.
   *Fails:* a family that encodes strength by nudging a band (a), or a band that gets a gentler
   guard (b).
3. **No refused persona vocabulary.** Every `persona.<name>@1`'s `name` and `bio` are run against
   `REFUSED_PERSONA_CLAIM`; a fixture asserting a `bio` containing *"aggressive"* must **fail
   compilation**. *Fails:* a marketing string that survives registration.
4. **No strength number before calibration.** Every profile registers `calibrated: false` and its
   card renders no Elo. A negative fixture that adds a number to an uncalibrated card must fail.
5. **The `searchBound` widening reaches every site.** `make searchbound-sites` derives the site set;
   the criterion asserts each member admits `"depth"`. *Fails:* a partial widening that updates the
   TypeScript union and leaves `schemas/drill_run.schema.json:140` or `rest.ts:260-265` behind.
6. **A registered trait actually moves mass.** On a fixture where the classifier matches, a
   registered trait must change at least one candidate's post-composition mass. **Red at HEAD**,
   because nothing populates `candidate.traits` (§3.3) — this criterion is honestly red rather than
   vacuously green, and turns green when the classifier registry lands.
7. **The guard's disclosure embeds its literals.** A guard whose `disclosure` omits `"depth"`, `"8"`
   or `"250"` fails compilation `[V]` (`:212-213`). *Fails:* a generic *"plays carefully"* string.
8. **Depth-8 numbers, not depth-12.** Any citation of guard strengthening in this RFC or in
   `bot-policy` §2.4 asserts **1.36 cp / 100.21% / +12.28 pp**. A fixture carrying the depth-12
   triple fails.
9. **The band set is pinned.** Adding 2400, or an interpolated band, must fail a fixture.
   `HumanPolicyModelLayer.band` is an unconstrained `number` today, so this criterion is red until
   the fixture lands.
10. **Family A registers with no dependency on obligations A or B.** A fixture registers the four
    `human-baseline-*` profiles against the unmodified HEAD compiler and compiles clean.
11. **Gate 0 is not reused without a new preregistration.** A fixture asserts the D1163 harness
    cannot be rerun against the same statistic and population; [[D1184]] requires new ones.
12. **G1/G2 report an upper bound.** The calibration output for the two paired arms must render as a
    bound, not a null. *Fails:* a report stating "no difference detected" for a 1.36 cp effect at
    ≈29 Elo MDE.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
| --- | --- | --- | --- | --- |
| D1 | The candidate-classifier registry — a pure `(rootPosition, moveUci) => string[]` populating `candidate.traits` before composition (§3.3) | codex | this RFC's implementing commit | |
| D2 | The `searchBound` `"depth"` widening across the derived site set, including the run-schema enum (§3.2) | codex | this RFC's implementing commit | |
| D3 | The trait screen over the R11/D815 capture for the four UNKNOWN candidates in §5.3 | claude | `planning/bot-roster/` | |
| D4 | Whether Stage-B `features` may bind into the composition, making personalities richer than board arithmetic (§8) | OWNER | `planning/platform-alignment/decision-queue.md` | |
| D5 | Whether any card may ever show an absolute human-scale Elo — anchor accounts, learner Glicko, or stay band-relative (§7) | OWNER | `planning/platform-alignment/decision-queue.md` | |

## Open questions

1. **Persona naming.** The twelve placeholder names are claude's. Changing one voids that profile's
   calibration by digest, so the owner or design tier should pick before the ladder runs, not after.
2. **Default profile.** [[D1566]] fixes the picker, roster, visible identity and persona grain but
   does not choose the profile a new learner meets. The accidental hidden Maia-1500 default is not
   one of the measured rungs and may not survive as an implicit answer.

**Resolved after drafting:** [[D1566]] chooses **one persistent persona per profile**, not one per
family. The guard's engine configuration is no longer an owner question: the return requires a
dedicated supervised `stockfish-guard` request identity because neither the play nor analysis spec
declares D969's exact request and fallback contract.

## Ledger rows

Proposed — id assigned at landing; head was **D1293** at drafting.

- 🐞 **The trait-gate unit-check obligation is withdrawn**: [[D1181]] and the roster both record that
  `traitDelta: 12.28` passes for the wrong reason. At HEAD the field is `traitDeltaFraction` and the
  gate rejects `> 1`, so 12.28 fails. No fix is owed; an RFC nearly specified work already done.
- 🐞 **[[D1250]]'s 80 ms timeout claim is wrong.** `Math.max(5_000, value * 10)` floors a depth-8
  bound at **5,000 ms**, not 80 ms. The real defect is that a depth is routed to the movetime arm at
  all — a category error masked by a floor, which is why the widening must give `depth` its own arm.
- 📊 **The UCI command layer needs no change**: `go ${kind} ${value}` already emits valid
  `go depth 8`. The type, validation and schema layers are the whole of obligation A.

## Changelog

- 2026-08-23 — drafted from `planning/bot-roster/roster.md` and the eight dossiers `bot-policy` never
  cited. Registers twelve profiles; claims run-schema lane 0.22 for the `searchBound` widening;
  amends `bot-policy` §2.4's depth-12 numbers to production depth-8; withdraws the trait-gate
  unit-check obligation and corrects [[D1250]]'s timeout claim, both re-derived at HEAD.
- 2026-08-26 — independently returned before acceptance on [[D1601]]–[[D1609]]. [[D1566]] resolves
  persona grain at one persistent persona per profile; names and the default remain owner choices.
  No production, schema, migration or protected-design bytes changed.
