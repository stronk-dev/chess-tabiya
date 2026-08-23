# The bot roster — the concrete thing, assembled

**What this is.** The owner asked, three times, for *"a proper Elo range of bots that play
human-like, with personalities"* ([[D810]]), *"nice bots that play human / with personalities"*,
and honest labels — *"a stated Elo is a measured claim with its measurement cited, or it is not
stated"* ([[D819]], accepted as `rfc/bot-policy.md` §7). The seven-layer grammar was accepted, the
compiler shipped, and **zero instances were ever declared**: `BOT_POLICY_PROFILES =
compileBotPolicyCatalog([])` `[V]` (`apps/server/src/bot-policy-catalog.ts:296`). This document is
the missing instances — N named profiles spelled out layer by layer against the shipped contracts,
the trait set that would make them differ, the calibration that would make their numbers honest,
and the list of what none of it can deliver.

**Provenance.** Every number below is cited to the dossier that measured it. Nine dossiers exist in
the bot lane and `rfc/bot-policy.md` cites **one** of them (`design/research/bot-policy.md`, R11);
`maia-production-band-roster.md` — the dossier named for the roster itself — is cited **zero** times
by the RFC. Their numbers are assembled here for the first time. Where a dossier's number is stale
against HEAD it is re-derived and marked **⟳ re-derived**. Where a number is arithmetic over cited
measurements rather than a measurement it is marked **⊕ derived**.

**Working-tree note.** `apps/server/src/opponent-selector.ts` and 25 other files are dirty (codex).
`apps/server/src/bot-policy-catalog.ts` is **clean at HEAD** and every catalog line number below is
a HEAD position. Selector claims were read from `git show HEAD:` and are marked as such.

**This document is planning-tier.** It proposes; it does not amend `design/` (law 5) or the RFC.

---

## §1 — The profile table

### 1.1 Two axes, and the measurement says they are orthogonal

The roster is **4 bands × 3 families = 12 profiles**. The two axes are not the same kind of thing:

| axis | what it is | measured span | evidence |
|---|---|---|---|
| **band** (1000 / 1400 / 1800 / 2200) | the strength range | **346.8 Elo** [315.2, 378.3] corpus-wide; **479.8** [454.9, 504.7] at ≥21 pieces | `maia-band-outcome-transfer.md` §5, 16,660 games |
| **family** (baseline / guarded / pawn-heavy) | the behaviour at a fixed band | expected-loss shifts of **+1.36 cp** (guard) and **−1.01 cp** (trait) | `stockfish-candidate-guard-probe.md` §7; `bot-policy.md` §5 |

A 1.36 cp expected-loss shift is roughly **two orders of magnitude below** the ~60-Elo
session-resolution floor a learner can perceive (`maia-band-outcome-transfer.md` §3). **So the band
is the range and the family is the personality, and they do not contaminate each other.** That is
the honest one-sentence roster statement, and it is measured rather than asserted.

**The four bands are the four pre-registered D324 arms, not values inferred after reading results**
`[V]` (`maia-production-band-roster.md` §Verdict). Refused, with the measurement: a raw 100-point
grid (100-point steps buy 22.1 and 26.9 Elo, below the ~60 floor); band 2400 (2000→2400 buys 28.9
Elo, 95% CI [−16.7, 74.5], p = .21); any interpolated five-to-nine-rung ladder (a capacity estimate
from dividing a threshold by a slope, not a set of compared adjacent arms).

| rung | score vs internal band-1400 reference | Elo vs reference | 95% CI | segment gain | ≥ 60-Elo rung floor? |
|---:|---:|---:|---|---:|:--:|
| 1000 | 0.3069 | **−141.6** | [−161.5, −122.4] | — | — |
| 1400 | 0.4990 | **−0.7** | [−18.1, 16.8] | +141.6 | ✅ |
| 1800 | 0.6304 | **+92.7** | [75.1, 110.8] | +93.4 | ✅ |
| 2200 | 0.7652 | **+205.2** | [181.3, 231.0] | +112.5 | ✅ |

`[V]` `maia-band-outcome-transfer.md` §5, all three adjacent 95% CIs disjoint, 1,020 games per rung.

### 1.2 The shared layers, with the measured basis for every literal

Five of the seven layer kinds are **identical across all twelve profiles**, which matters
mechanically: `compileBotPolicyCatalog` rejects one layer `id@version` carrying different canonical
declarations across profiles `[V]` (`bot-policy-catalog.ts:283-290`), so a shared layer must be
byte-identical everywhere it appears.

| layer | id | literals | measured basis |
|---|---|---|---|
| **HumanPolicyModel** | `model.maia3.band-<b>@1` | `engineId: "maia-5m"`, `modelId: "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe"`, `band: <b>`, `historyCapability: "full_history"` | pinned image `chess-tabiya-maia:1e13597`, source commit `1e13597c…`, `eloHonored: true`, `seedHonored: false`, `bandRange {1000, 2400}` `[V]` (`apps/server/src/maia.ts:3-11`; handshake in `d333-band-outcome-harness/out/maia.identity.json`). Band-specific ids are **mandatory**, not stylistic: reusing `model.maia3@1` at four bands makes one versioned identity mean four things and now fails compilation ⟳ (`maia-production-band-roster.md` §Literal catalog consequence names this as D1014 future work; `bot-policy-catalog.ts:283-290` **already implements it**) |
| **Sampler** | `sampler.maia_reconstruction@1` | `temperature: 0.8`, `topP: 0.92`, `completenessThreshold: 0.97` | T/topP are the shipped production defaults `[V]` (`opponent-selector.ts:79-80`). The reconstruction `p^(1/T)` + cumulative `≤ topP` forcing top-1 predicts **19.84 cp** / **0.39%** severe mass against a captured production sample of **19.57 cp** / **0.36%** — agreement **0.27 cp / 0.03 pp** `[V]` (`bot-policy.md` §4). The raw vector predicts 59.13 cp / 1.20%. Threshold 0.97 sits deliberately below the measured MultiPV-20 raw-mass floor: median **0.999625**, minimum **0.979540** `[V]` (`maia-policy-scalar-stability.md` §3) |
| **Repertoire** | *— absent, not "off"* | — | Measured out, both arms: the authored-spine book fell off on **57/72 controlled plies (79.2%)** and the frozen statistical book — built from **2,519,503** parsed Lichess blitz games, 19,214 reaching a fixed root, 58,147 rooted positions — fell off on **57/72** as well, against a pre-registered **25%** ceiling `[V]` (`bot-policy.md` §8). Per profile the card says *"no opening book"*, not *"book disabled"* |
| **Memory** | *— cannot exist* | — | Not a promise: `assertLayer` fails **any** layer of kind `memory` `[V]` (`bot-policy-catalog.ts:195`). Ruled off by O8.3 and enforced by the compiler |
| **Presentation** | `persona.<name>@1` | `name`, `bio` | **Required** — `compileBotProfile` fails a profile with no presentation layer `[V]` (`:257-259`). `REFUSED_PERSONA_CLAIM` fails compilation for `human-like`, `aggressive`, `solid`, `tactical`, `positional`, `tricky`, `adaptive`, `plays like` `[V]` (`:172, :236-238`) |

The **ErrorGuard** is shared by eight of the twelve:

| layer | id | literals | measured basis |
|---|---|---|---|
| **ErrorGuard** | `guard.severe_error@1` | `engineId: "stockfish-analysis"`, `searchBound: {kind: "depth", value: 8}`, `thresholdCp: 250` | Depth 8 is the **only measured 1.0 candidate** `[V]` (`stockfish-candidate-guard-probe.md` §Consequence). Node bounds are refused by completeness: at 25k nodes only **16/50** pack roots were all-exact, at 50k only **15/50**, and more nodes did not monotonically improve. Depth 8/10/12 each returned one exact row for all **958** requested candidates across all 50 roots. Depth 12 breaks the live shallow-call budget (1,403 ms cold end-to-end); depth 10 changes **no** gate outcome and costs a 729 ms tail; depth 8 stays at **499.1 ms** cold end-to-end, Stockfish-only p95/max **105/129 ms** `[V]` (§4, §7) |

**Depth-8 guard retention, on the exact pre-registered R11 population** (279 positions, 804
evaluated band cells after the declared mixed-domain abstention) `[V]`
(`stockfish-candidate-guard-probe.md` §7):

| bound | severe mass removed | strengthening | human-match retention | guard | pawn ×4 | forcing ×3 | quiet ×3 |
|---:|---:|---:|---:|---|---|---|---|
| **depth 8** | **100%** | **1.36 cp** | **100.21%** | pass | **pass (+12.28 pp)** | fail (+3.12 pp) | fail (+2.31 pp) |
| depth 10 | 100% | 1.52 cp | 100.29% | pass | pass (+12.33 pp) | fail (+3.13 pp) | fail (+2.32 pp) |

⟳ **The RFC quotes the depth-12 numbers** (§2.4: *"removes all measured severe mass, −1.27 cp
expected-loss shift, 100.2% explorer-match retention"*, and §0's pawn ×4 at **+11.97 pp**). Those
were correct for depth 12 and are **not** the production numbers. The roster cites depth 8
throughout, because the RFC *"cannot retain the depth-12 claim while executing a shallower score
definition"* `[V]` (§4).

**Mixed score domains abstain**: 11 of 279 positions (**3.94%**, 33 band cells) return a mixed
mate/cp candidate vector; the guard abstains for the whole position and leaves the base distribution
unchanged. This is measured to preserve every gate verdict `[V]` (§7).

### 1.3 The twelve profiles

Naming is **placeholder** — a name is presentation-tier and carries zero policy content; the owner
or design tier picks the final set. Each profile declares its own `persona.<name>@1` so that a rung
is a character rather than a setting; the alternative (one persona id per family, shared across four
bands, band shown separately by the card) also compiles and is a one-line fork.

**Family A — Human baseline.** `HumanPolicyModel → sampler → presentation`. No curator, no trait.
The one family that is registrable **today** with no type change and no RFC amendment: D970 licenses
exactly these four `[V]` (`maia-production-band-roster.md` §Literal catalog consequence).

| profile id | v | band | persona | guard | traits | repertoire | memory | calibration at registration |
|---|--:|--:|---|---|---|---|---|---|
| `human-baseline-1000` | 1 | 1000 | `persona.pip@1` | — | — | none | none | `uncalibrated` |
| `human-baseline-1400` | 1 | 1400 | `persona.wren@1` | — | — | none | none | `uncalibrated` |
| `human-baseline-1800` | 1 | 1800 | `persona.ora@1` | — | — | none | none | `uncalibrated` |
| `human-baseline-2200` | 1 | 2200 | `persona.kestrel@1` | — | — | none | none | `uncalibrated` |

**Family B — Guarded.** `HumanPolicyModel → sampler → guard.severe_error@1 → presentation`.
Blocked on one type widening (§1.5) and the RFC amendment that pins depth 8.

| profile id | v | band | persona | guard | traits | repertoire | memory | calibration at registration |
|---|--:|--:|---|---|---|---|---|---|
| `guarded-human-1000` | 1 | 1000 | `persona.bramble@1` | depth 8 / 250 cp | — | none | none | `uncalibrated` |
| `guarded-human-1400` | 1 | 1400 | `persona.junco@1` | depth 8 / 250 cp | — | none | none | `uncalibrated` |
| `guarded-human-1800` | 1 | 1800 | `persona.marlow@1` | depth 8 / 250 cp | — | none | none | `uncalibrated` |
| `guarded-human-2200` | 1 | 2200 | `persona.harrow@1` | depth 8 / 250 cp | — | none | none | `uncalibrated` |

**Family C — Pawn-forward.** `HumanPolicyModel → sampler → guard → trait.pawn_preference@1 →
presentation`. There is **no unguarded pawn-heavy profile**, and that is a measurement consequence
rather than a preference: every R11 trait arm was measured *after* the guard, and an unguarded trait
can raise severe mass — which the compiler's `severeMassRise ≤ 0.01` gate would then have no
measurement to clear `[V]` (`bot-policy.md` §5; O8.2 defines pawn-heavy as *"guarded plus"*).

| profile id | v | band | persona | guard | traits | repertoire | memory | calibration at registration |
|---|--:|--:|---|---|---|---|---|---|
| `pawn-forward-1000` | 1 | 1000 | `persona.thatch@1` | depth 8 / 250 cp | `pawn_move` ×4 | none | none | `uncalibrated` |
| `pawn-forward-1400` | 1 | 1400 | `persona.furrow@1` | depth 8 / 250 cp | `pawn_move` ×4 | none | none | `uncalibrated` |
| `pawn-forward-1800` | 1 | 1800 | `persona.drover@1` | depth 8 / 250 cp | `pawn_move` ×4 | none | none | `uncalibrated` |
| `pawn-forward-2200` | 1 | 2200 | `persona.colter@1` | depth 8 / 250 cp | `pawn_move` ×4 | none | none | `uncalibrated` |

### 1.4 What a learner would notice — one sentence each, no refused vocabulary, no unmeasured Elo

Each sentence describes a **mechanism the profile declares** or a **rate the corpus measured**.
None uses any of the eight compiler-refused words; none states a strength number.

| profile | what a learner would notice |
|---|---|
| `human-baseline-1000` | It plays the moves the largest number of players at the 1000 band play, and nothing checks those moves afterwards, so the pieces it leaves hanging stay hanging. |
| `human-baseline-1400` | Same moves-of-the-crowd behaviour one rung up: it loses to the 1000-band profile only about 31 games in 100 in our own ladder. |
| `human-baseline-1800` | It picks the crowd's move from a narrower crowd — the same shape of choice, made from a shorter list. |
| `human-baseline-2200` | The top rung of the band dial; past this the dial stops buying anything measurable, which is why there is no rung above it. |
| `guarded-human-1000` | Before it draws, a depth-8 Stockfish search prices every move it was considering and removes anything 250 centipawns or more behind its own best candidate — so the club moves stay and the one-move disasters go. |
| `guarded-human-1400` | The same curator at the next rung; when the engine is unavailable the curator steps aside and the card says so rather than pretending it ran. |
| `guarded-human-1800` | Its move list is filtered by an engine it does not otherwise use, which is an information advantage and is printed on its card. |
| `guarded-human-2200` | The narrowest crowd plus the curator: the fewest surprises available anywhere in the roster. |
| `pawn-forward-1000` | It reaches for a pawn about twelve moves in a hundred more often than the same guarded profile at the same rung. |
| `pawn-forward-1400` | Same curator, same rung, and a declared four-times weight on pawn moves that shifted its measured expected loss by about one centipawn. |
| `pawn-forward-1800` | You will see pawns come at you; nothing else about how it chooses has changed. |
| `pawn-forward-2200` | The pawn weight is the only difference from `guarded-human-2200`, and the profile card lists it as the one controlled trait. |

### 1.5 Per-profile blockers — what stops each one registering today

| blocker | families affected | what it is | fix |
|---|---|---|---|
| **`searchBound` cannot express depth** 🐞 ⟳ | B, C (8 profiles) | `ErrorGuardLayer.searchBound.kind` is the union `"nodes" \| "movetime"` `[V]` (`bot-policy-catalog.ts:76`). D969's only measured production bound is **fixed depth 8**, and node bounds are **refused by population completeness** (15–16/50 all-exact). **The shipped type cannot declare the shipped answer.** Not recorded in any ledger row found this pass | add `"depth"` to the union; the disclosure check at `:212-213` then embeds `"depth"` and `"8"` verbatim, unchanged |
| **Nothing populates `candidate.traits`** 🐞 ⟳ | C (4 profiles) | `applyPolicyMultiplier` keys the trait on `candidate.traits?.includes(layer.classifier)` `[V]` (`:509`). Grep over `apps/server/src`: `traits` is written **only** in `bot-policy-catalog.test.ts:189-190`. A registered trait would multiply by 1 on every candidate. **This is the hardest blocker on the word "personalities" and no ledger row names it** | a candidate-classifier registry: pure `(rootPosition, moveUci) => string[]`, called where the Maia vector is assembled |
| **`composeBotPolicySelection` has no production caller** | all 12 | Called only from its own test `[V]` (working-tree grep). But ⟳ **the request seam is fully built**: `BOT_POLICY_PROFILES` is imported, is the default `profiles` argument, and `validatePolicy` routes through `validateProfilePolicy` `[V]` (`git show HEAD:apps/server/src/opponent-selector.ts:36,174,511`). With an empty catalog every `profile` request is refused as *"does not match the compiled bot-policy catalog"*. **The door is installed and locked, not missing** | wire the composed path into `#humanCommon` when `policy.profile` is present |
| **Which Stockfish spec owns the guard call** | B, C | Two supervised specs exist: `stockfish-play` (`strong-engine.ts:49`) carries the ratified 50,000-node play profile; `stockfish-analysis` (`application.ts:190`) is the analysis spec `[V]`. The guard needs `Threads=1`, `Hash=16`, `ucinewgame` + `Clear Hash` per call, `MultiPV=candidateCount`, `searchmoves` `[V]` (`stockfish-candidate-guard-probe.md` §Amendment inputs) — a third configuration | RFC decision; not a measurement |
| **No fixture pins the band set** | all 12 | `HumanPolicyModelLayer.band` is an unconstrained `number`; nothing in the compiler restricts it to `[1000,1400,1800,2200]` or to `bandRange`. `appliedTargetElo` validates the *request*, not the *declaration* | add the able-to-fail fixture D970 already specifies: adding 2400 or an interpolated band must fail |

---

## §2 — The traits that would make the personalities real

### 2.1 What exists

Exactly one trait has ever cleared the gate, and it lives in a test file `[V]`
(`bot-policy-catalog.test.ts:181`; [[D1142]]).

| id | classifier | multiplier | traitDelta | loss shift | severe-mass rise | explorer retention | verdict |
|---|---|--:|--:|--:|--:|--:|---|
| `trait.pawn_preference@1` | `pawn_move` | ×4 | **+0.1228** (12.28 pp, depth 8) | **−1.01 cp** | **0** (post-guard) | **0.988** | **PASS** |

The shipped gate, read off the compiler `[V]` (`bot-policy-catalog.ts:224-231`) — a trait fails
registration unless **all four** hold:

```
traitDelta ≥ 0.1     |expectedLossShiftCp| ≤ 35     severeMassRise ≤ 0.01     explorerMatchRetention ≥ 0.9
```

🐞 ⟳ **The gate has no unit check.** `traitDelta` is a fraction in code but every dossier states
percentage points, so a declaration carrying `traitDelta: 12.28` passes for the wrong reason
(12.28 > 0.1). Only over-passing is possible; forcing ×3 at `0.0312` still correctly fails. Worth a
fixture, since the roster's one real trait is exactly the value most likely to be mis-scaled.

### 2.2 The two laws that predict pass and fail — derived from the three measured anchors

The R11 arms give three points on the curve. They are enough to derive why one passed and two
failed, and therefore enough to screen proposals before spending anything.

| arm | class share of played mass (base) | multiplier | naive prediction `mp/(mp+1−p)` ⊕ | measured delta | realised / naive |
|---|--:|--:|--:|--:|--:|
| pawn ×4 | 32.92% | ×4 | +33.3 pp | **+11.97 pp** | 36% |
| forcing ×3 | 21.50% | ×3 | +23.6 pp | **+3.02 pp** | 13% |
| quiet ×3 | 78.50% | ×3 | +12.5 pp | **+2.24 pp** | 18% |

`[V]` for the measured columns (`bot-policy.md` §5); ⊕ for the naive column.

**Law S — the suppression ceiling.** A trait with multiplier < 1 on class *C* cannot move *C*'s rate
by more than *C*'s base rate. **Any class whose base rate is below 10 percentage points can never
clear the ≥10-point gate by suppression.** ⊕ (arithmetic, not measurement.)

**Law A — the amplification shortfall, and what determines it.** Every amplification arm realises far
less than the naive prediction, and the shortfall is not explained by base rate: pawn (33%) and
forcing (22%) have similar shares yet realise 12 pp and 3 pp. The post-truncation distribution is
concentrated — **2.41 effective moves after the guard** `[V]` (`bot-policy.md` §5) — so a position
contributes to the delta only when the class holds *intermediate* mass there. Positions where the
class already holds ~all the mass are ceiling-bound (quiet, 78.5% base) and positions where top-p
truncated the class to ~zero are floor-bound (a multiplier on zero is zero). **The predictor is
therefore the fraction of positions in which the class holds intermediate mass — not the class's
mean share.** ⊕

**Which makes the screen concrete and free.** For any proposed classifier, compute over the
surviving R11/D815 capture (837 position-band cells, three bands, MultiPV-20, **zero engine
calls**; raw inputs uncommitted under D1166) the per-position class mass share, report the fraction of cells with share in (0.05, 0.80),
and then simulate the multiplier exactly — the R11 harness already does pure arithmetic over those
captured rows `[V]` (`bot-policy.md` §11, `tools/r11-bot-policy-harness/`). **No trait below is
proposed on intuition; each is a screening candidate and the screen costs nothing.**

### 2.3 The proposed trait set, with predicted gate outcomes

All are Stage A — pure arithmetic on the root position and the UCI move, no collector, no evidence
id, no learner input. Multipliers are starting points for the sensitivity grid, not claims.

| id | classifier | arithmetic | mult | what it biases | predicted | why |
|---|---|---|--:|---|---|---|
| `trait.pawn_preference@1` | `pawn_move` | moving piece is a pawn | ×4 | pawn advances and captures | **MEASURED PASS** | +12.28 pp at depth 8 `[V]` |
| `trait.minor_piece_preference@1` | `minor_piece_move` | moving piece is N or B | ×4 | knights and bishops come out and stay busy | **LIKELY PASS** | closest structural analogue to pawn: a large class, spread over several candidates, present with intermediate mass in most positions (Law A). Screen first |
| `trait.central_destination_preference@1` | `central_destination` | destination in the 16-square extended centre (c3–f6) | ×4 | play aimed at the middle of the board | **UNKNOWN — screen** | base rate and spread both unmeasured; the class is plausibly intermediate-mass, which is the only condition that matters |
| `trait.long_move_preference@1` | `long_move` | Chebyshev distance ≥ 3 | ×4 | sweeping slider moves over short shuffles | **UNKNOWN — screen** | cheap arithmetic; its correlation with engine loss is unknown, so the ≤35 cp arm is the one at risk |
| `trait.piece_repeat_avoidance@1` | `moved_piece_repeat` | the moving piece is the one the mover moved last | ×0.25 | stops the same piece being pushed around twice | **UNKNOWN — screen, and read Law S first** | R11's repeat ×0.25 moved *its* named rate by 25.5% but on a same-position-repeat metric that R11 explicitly refuses as a personality result `[V]` (§5). A *piece*-repeat classifier is a different, legal Stage-A object; if its base rate is under 10 pp, Law S kills it before any run |
| `trait.rim_destination_avoidance@1` | `rim_destination` | destination on the a/h file or the 1st/8th rank | ×0.25 | keeps pieces off the edge | **LIKELY FAIL** | suppression; Law S caps the delta at the base rate, and a rim-destination base rate above 10 pp across the corpus is not plausible without measurement |
| `trait.capture_preference@1` | `capture` | destination occupied, or en passant | ×4 | grabs material when offered | **LIKELY FAIL** | strict subset of `forcing`, which failed at ×3 (+3.02 pp) and **still failed at ×8 (+5.94 pp)** `[V]`; a subset cannot beat its superset's ceiling |
| `trait.check_preference@1` | `gives_check` | move gives check | ×4 | chases the king | **LIKELY FAIL** | the other half of `forcing`, and the smaller half |
| `trait.rank_advance_preference@1` | `forward_move` | destination rank strictly ahead for the mover | ×3 | pushes forward rather than regroups | **LIKELY FAIL** | ceiling-bound like quiet ×3: a majority class, so Law A's ceiling term dominates |
| `trait.king_activity@1` | `king_move` | moving piece is the king | ×4 | walks the king up in simplified positions | **FAIL ON THIS POPULATION — and the right population does not exist** | the R11 corpus stops at ply 20 `[V]` (`bot-policy.md` §10) and `bot-candidate-sharpness.md` §1 measured **zero endgame cells** in the fixed explorer population. A trait whose whole domain is unrepresented cannot be measured, which is the gate working |

### 2.4 Traits that must not be proposed — each already refused with a measurement

| refused | measurement |
|---|---|
| `forcing` ×3 and ×8, `quiet` ×3 | permanent negative fixtures; the catalog test must attempt registration and watch it fail (A7) `[V]` |
| anything salience-shaped (threat-just-created, attacker-just-moved) | [[D815]] **measured and refused 2026-08-23**: stationary-created class covered 7 positions, the augmented grouped-CV model *worsened* RMSE, the direction held in 1/3 bands `[V]` (`human-like-opponents.md` §10) |
| anything keyed on multi-band Maia disagreement | [[D817]] measured refusal: Pearson **0.021–0.044** against real human band movement, sign agreement **47.2–52.0%** `[V]` (`bot-candidate-sharpness.md` §4) |
| anything keyed on `features` (Stage B collector output) | `features` rides the record and **never enters the composition** `[V]` (`bot-policy-catalog.ts:161, :509`; [[D1162]]). The binding does not exist |
| temperature or top-p as a personality dial | **it is a strength dial, and a large one**: D333's positive control at T=5.0 scored 0.9368 → **+468.3 Elo** [417.9, 536.0] `[V]` (`maia-band-outcome-transfer.md` §4) — larger than the entire band range. It also voids criterion A4, whose positive control is specifically a T=0.8/topP=0.92 fixture |
| any layer with a delay effect | `assertLayer` fails `effect: "delay"` `[V]` (`:194`); [[D820]] |
| any layer with a learner-derived input **or parameter** | `LEARNER_INPUT` regex over input names `[V]` (`:171, :196`), extended to parameter provenance by RFC §3 — a per-learner constant has no population dossier to cite |

---

## §3 — The calibration plan that makes the Elo honest

Reuses `tools/d333-band-outcome-harness/` verbatim per `maia-band-outcome-transfer.md`
§Reproduction and the harness README. No new instrument is built.

### 3.1 Gate 0 — the free arm, run before anything is funded

The single D1163 harness replayed the surviving R11/D815 capture: 268 positions after withholding
11 mixed mate/cp rows, bands 1400/1600/1800, Stockfish depth-12 scores and Lichess explorer
frequencies — **zero engine calls, zero games, zero new data** `[V]`
(`tools/d1163-engine-composed-bot-harness/`; `design/research/engine-composed-band-discriminator.md`).
The raw capture is **not committed** and remains D1166's reproducibility debt.

- **Pass shape:** each profile's move-match curve **peaks at its own band**, in the shape Maia's
  46–52% does `[V]` (`human-like-opponents.md` §2.1).
- **Fail shape:** flat or **rising with the rating being predicted**, in the shape depth-limited
  Stockfish's 33–41% does — depth 15 matches 1900s five points better than 1100s `[V]` (ibid.).
- **Coverage gap, stated:** the surviving capture carries 1400/1600/1800, not the roster's 1000 and
  2200. Recapture cost is **279 positions × 2 bands = 558 MultiPV-20 probes** at a measured
  ~230.8 ms median `[V]` (`maia-band-calibrated-range.md` §3) ≈ **2.2 minutes** ⊕. Do it.

**Measured outcome (2026-08-23): Gate 0 abstains and the game ladder is not funded.** Its Maia
positive control failed the declared band-identity test (1400/1600/1800 profiles peaked on human
1600/1800/1800), while Stockfish argmax and all four cp-Boltzmann profiles peaked on human 1800.
That adverse direction is consistent with the fail shape, but the failed positive control bars the
formal refutation. D1184 requires a new preregistered statistic/population before this gate is
reused; do not reinterpret the result or rerun a duplicate instrument. `[V]`
(`planning/platform-alignment/bot-policy/d1163-engine-composed-results.json`)

### 3.2 Arms

Common reference: **raw Maia band 1400, MultiPV 1, production sampler** — the internal anchor the
D324 ladder is already gauged against (band 1400 ≡ 0).

| # | arm | opponent | games | what it answers |
|---|---|---|--:|---|
| C1 | null control | reference vs reference | 800 | is the instrument biased? (D333 got 0.4956, p = 0.68) |
| C2 | positive control | reference vs reference @ T = 5.0 | 400 | is the instrument blind? (D333 got +468.3 Elo at n = 680) |
| N | negative control | Stockfish `UCI_LimitStrength`/`UCI_Elo` at the band | 800 | rejected doctrine, retained so the roster can be shown to beat it `[V]` (`capabilities.ts:128`) |
| **A1–A4** | `human-baseline-{1000,1400,1800,2200}` | vs reference | 4 × 800 | which rung each unguarded profile sits on |
| **B1–B4** | `guarded-human-{…}` | vs reference | 4 × 800 | which rung each guarded profile sits on |
| **P1–P4** | `pawn-forward-{…}` | vs reference | 4 × 800 | which rung each pawn profile sits on |
| **G1** | `guarded-human-1400` vs `human-baseline-1400`, directly paired | — | 800 | **prices the guard**; same band, one layer differs |
| **G2** | `pawn-forward-1400` vs `guarded-human-1400`, directly paired | — | 800 | **prices the trait**; same band, one layer differs |

**A2 is not redundant with C1 and is the arm nobody has run.** `human-baseline-1400` and the
reference are the same band, but the reference draws from Maia's internal unseeded process RNG at
MultiPV 1 while A2 draws from **our seeded server-side sampler over the full-width reconstructed
vector**. The reconstruction agrees with the captured production sample to 0.27 cp / 0.03 pp `[V]`,
but 0.27 cp compounded over 63 plies is not obviously zero Elo. **A2 is the reconstruction-fidelity
arm and it must be in the plan.**

**Total: 12,400 games across 16 arms.**

### 3.3 Size, seeding, and the honest cost

**Size.** 95% CI ≈ ±500–700/√n Elo per arm `[V]` (`human-like-opponents.md` §5) ⇒ n = 800 gives
**±17.7 to ±24.7 Elo** ⊕. That is the ±25 target. But D333's own measured minimum detectable effect
at 80% power, computed from observed clustered dispersion rather than an assumed one, was **13.8 Elo
at n = 3,400** and **24.9 Elo at n = 1,020** `[V]` (§3) ⇒ **≈29 Elo at n = 800** ⊕.

> **Consequence, stated before the run rather than discovered after it: this ladder will resolve
> which rung each profile sits on and will NOT resolve whether the guard or the trait costs Elo.**
> Their measured expected-loss shifts are 1.36 cp and 1.01 cp — far below anything 800 games can
> see. G1 and G2 will therefore most likely return an **upper bound**, not a null, and must be
> reported as one. Sizing an arm that could actually resolve a sub-30-Elo family effect is a
> separate decision that needs a pilot, not a guess.

**Seeding — [[D341]]'s rules are mandatory, and they are not optional hygiene.** The first D333 run
produced **611 of 611** mirrored pairs with byte-identical move lists, a **50.8%** duplicate-game
rate, and a same-band control at **exactly 0.500000 with a standard error of exactly 0.0** — *"the
most confident possible wrong answer"* `[V]` (§9.3).

| rule | literal |
|---|---|
| explicit distinct seed per worker | `--seed 1000 + index` |
| **odd** worker count | 13 on the D333 host, so a worker never lines up with colour |
| count distinct move lists | final D333 run: 16,013/16,660 distinct, 133/8,330 mirrored pairs identical |
| a zero-variance control is a **defect**, not a result | C1 must show variance |
| `Elo` sent on **every** request without exception | [[D58]]: an `Elo`-less request inherits the previous band |
| `SelfElo`/`OppoElo` **before** `Elo` | [[D91]] order; the reverse silently discards the band |
| paired openings from the committed pack corpus, colour swapped inside each pair | 170 positions from 44 of 47 draft packs |
| paired mean as primary estimator, cluster-robust SE on the opening | CR0 with C/(C−1); D333 inflation factors 0.94–1.45 |
| termination natural or a 300-ply cap scored as a draw; **no engine adjudication of any kind** | the cap fired 0 times in 16,660 games |

**Two audits, one of them free and new.** D333's `verify-band-applied.py` first-ply χ² audit runs
unchanged (its two same-band controls must **not** fire; both 100-point arms did not fire, which is
a stated power limit of that channel, not a band failure). For composed arms there is a **stronger
and free** audit: every composed selection carries the §6 policy record, so layer application is a
direct read — count `layers[guard].action === "applied"` versus `"abstained"` per arm, and read the
pawn-rate delta straight off the played moves. Nothing needs to be inferred.

**Wall clock ⊕, derived from two measured figures, not measured end to end.**

| input | value | source |
|---|---|---|
| Maia forward pass, 1 thread, MultiPV 1 | 1,049,001 passes / (8,160 s × 13 workers) = **0.101 s** | `maia-band-outcome-transfer.md` §Cost `[V]` |
| composed move needs the full-width vector | ≈ **2 ×** (MultiPV 1 removes the second value-head forward pass) | harness README `[V]` |
| Stockfish depth-8 shared candidate search | p95 **105 ms**, max **129 ms** | `stockfish-candidate-guard-probe.md` §4 `[V]` |
| mean game length | **63.0** plies ⇒ ~31.5 moves per side | §2 `[V]` |

| arm class | per game ⊕ | games | worker-seconds ⊕ |
|---|--:|--:|--:|
| control / reference-only (C1, C2) | 6.4 s | 1,200 | 7,680 |
| unguarded composed (A1–A4) | 9.5 s | 3,200 | 30,400 |
| guarded composed (B, P, G1, G2, N) | 12.8 s | 8,000 | 102,400 |
| **total** | | **12,400** | **140,480** |

On 13 pinned single-thread Maia workers that is **≈3 h 0 m** ⊕. **But the guarded arms also need a
Stockfish process per worker**, and on the 14-core D333 host 13 Maia + 13 Stockfish processes
oversubscribe; running the guarded portion at 7 paired workers gives ≈14,600 s for that portion
alone. **Honest figure: 4–5 hours on the D333 host, or ~3 hours with more cores.** Compare D333
itself: 16,660 games in 2 h 16 m. The roster's ladder is the same order of magnitude, not a new
scale of investment.

### 3.4 The distribution acceptance test — never mean Elo alone

Predeclared **before** the run reads results (the R11 discipline). An arm passes only when the
interval **and** all four distribution bounds hold.

| # | test | reference | predeclared bound |
|---|---|---|---|
| 1 | **Eval-loss histogram**, not mean centipawn loss | band-binned human games | shape agreement, bounds fixed before reading |
| 2 | **Regan–Haworth (s, c) fit**, move probability ∝ `e^−(δ/s)^c` | published mileposts: *s* falls .078 @2700 → **.165 @1600**; *c* stays in **0.430–0.545** `[V]` | **both** parameters inside the band envelope. *"Two parameters under one Elo is the formal statement of the failure mode"* — an arm can match a 1400 mean while carrying an (s,c) split no human 1400 has |
| 3 | **Blunder-rate-by-magnitude tail**, at the arm's own time control | Chabris & Hearst: **5.02 / 6.85 / 7.63** true blunders (≥1.5 pawns) per 1,000 moves for classical / rapid / blindfold, with fast conditions producing *"more than twice the number of really big blunders"* `[V]` | tail **shape**, not the GM rate |
| 4 | **Move-match rate** against band-binned human games | Maia 46–52% band-peaked vs search-based 33–41% rating-rising `[V]` | band-peaked |

**Three honest gaps in this test, each of which must be stated in the calibration plan rather than
discovered in the results:**

1. ⚠ **The guarded family cannot pass test 3 above 250 cp, by construction.** The guard removes
   **100%** of measured ≥250 cp mass `[V]`. A human blunder distribution has a heavy tail; a guarded
   profile has none above the threshold. This is a **predictable structural failure**, not a
   surprise, and the honest response is that the guarded family's card states its tail is truncated
   at 250 cp — not that the test is relaxed.
2. ⚠ **Regan's published table starts at 1600**, so bands 1000 and 1400 have **no published (s, c)
   envelope**. Those envelopes must be fitted from our own band-binned corpus — the frozen
   2,519,503-game Lichess blitz prefix R11 already built `[V]` (`bot-policy.md` §8) — not
   extrapolated from Regan.
3. ⚠ **The explorer reference dies at ply ~20.** R9 measured usable human data ending at ply
   20/20/21 by band and **zero games from ply 27** `[V]` (cited in `maia-endgame-fidelity.md` §1).
   Tests 1–4 over full games therefore need the frozen game corpus, not the explorer.

### 3.5 The label the ladder can and cannot produce

**It cannot produce a time-control-scoped human Elo, and §7's label rule wants one.** The D333
harness plays **untimed** engine-vs-engine — there is no clock anywhere in the opponent path `[V]`
(`human-like-opponents.md` §2.5) — while every verified calibration in the field is TC-specific and
maia1's own rating spans **~230 Elo across time controls against the same human pool** (blitz 1434 →
classical 1666) `[V]` (§5). So the ladder's output is:

> `band-relative calibrated Elo, untimed engine-vs-engine ladder, vs internal band-1400 reference,
> n games, 95% CI, harness + date`

and **not** an absolute human rating. Closing that gap is Discharges **D4** — anchor accounts
earning real Lichess ratings (the Chessiverse pattern: 833/1057/1454/2009, recalibrated three times
`[V]`), learner-derived Glicko fed calibrated opponent values only ([[D365]]/[[D344]]), or staying
band-relative — and it is the owner's, not this plan's.

---

## §4 — What ships before calibration

**The rule, verbatim from `rfc/bot-policy.md` §7:** *a bot's stated Elo is a measured claim with its
measurement cited, or it is not stated.* A profile with no calibration record for **that exact
digest** shows **no strength number**. The digest is an RFC-8785 SHA-256 over the whole canonical
composition `[V]` (`bot-policy-catalog.ts:241-273`), so changing any layer version voids the
calibration **by construction**, not by policy.

**The profile card on day one — every row, and where it comes from:**

| row | content | source |
|---|---|---|
| identity | *"Human-policy band 1400"* | model layer's `band`. **Never** "1400 Elo", never beginner/intermediate/advanced/expert, never four equally-spaced levels `[V]` (`maia-production-band-roster.md` §What the roster means) |
| model | engine `maia-5m`, model `Maia3`, checkpoint `maia3-5m@b6559de2…`, container digest | `SelectionEngineIdentity` |
| sampler | `sampler.maia_reconstruction@1`, temperature 0.8, top-p 0.92, completeness threshold 0.97 | layer parameters, compiler-bound to the executable fields `[V]` (`:206-208`) |
| curator | *"a Stockfish depth-8 search prices every candidate; anything 250 cp or more behind the best candidate in the same probe is removed"* | the guard's `disclosure` string, which **must embed each declared literal verbatim or compilation fails** `[V]` (`:212-213`) |
| information advantage | the guard is an explicit information advantage and says so | R11 refusal list: a hidden guard is refused `[V]` |
| controlled traits | exactly the profile's registered traits and their multipliers — `pawn_move ×4`, or *"none"* | `CompiledBotProfile.controlledTraits` `[V]` (`:271`) |
| opening book | *"none"* | measured out at 79.2% fallthrough `[V]` |
| memory | *"none"* | compile-refused `[V]` (`:195`) |
| **strength** | **`uncalibrated` — no number** | A11 negative fixture |
| band attenuation | *"below about ten pieces the band buys roughly **0.07** real Elo per band point instead of **0.40**; the four bands are not four distinguishable difficulty levels there"* | `maia-band-outcome-transfer.md` §7: 1000 v 2400 is **−468.9** Elo at ≥21 pieces, **−145.5** at 11–20, **−72.4** at ≤10, and both 100-point low-material arms straddle parity `[V]` |
| endgame unknown | *"the guard's effect in the endgame is unmeasured"* | the R11 population stops at ply 20 `[V]`; `bot-candidate-sharpness.md` measured **zero** endgame cells |
| degraded path | when raw mass < 0.97 the selection falls back to Maia's `bestmove`, the record says `applied: false` with a reason, and **the card renders the base model, not the profile** | RFC §4.3 / `:455-476` `[V]` |

**What appears only after calibration:** the band-relative calibrated figure, its 95% CI, the
harness, the date, the game count, and the time-control scope — **and nothing else**. No absolute
human Elo until D4 is ruled. Only the calibrated value may ever feed a rating update; `targetElo`
never may `[V]` ([[D344]]).

**Also shipped on day one:** `/capabilities` gains `policyProfiles.human_common.profiles` with
id/version/digest, the disclosure card, the controlled-trait list, and `calibrated | uncalibrated`
(RFC §8), plus the five new `CAPABILITY_DISPOSITIONS` rows including the two measured refusals
(multi-band Maia queries; artificial move delay).

---

## §5 — Sequencing, and the smallest roster that is genuinely a range

| wave | what lands | blocked on | profiles after |
|---|---|---|--:|
| **0** | candidate-classifier registry (`(position, move) => string[]`) + wire `composeBotPolicySelection` into the profile path | nothing — both are code the RFC already specifies | 0 |
| **1** | register **family A**, the four `human-baseline-*` | nothing else; D970 licenses exactly these four with **no D969 dependency** `[V]` | **4** |
| **2** | `searchBound: "depth"` widening + RFC amendment pinning depth 8, the multi-call budget and the mixed-domain abstention → register **family B** | one type union member + RFC authoring; *"D969 has no remaining empirical arm"* `[V]` | **8** |
| **3** | register `trait.pawn_preference@1` citing the depth-8 numbers → **family C** | wave 0's registry (a trait with nothing to classify multiplies by 1) | **12** |
| **4** | Gate 0 free screen over 3–5 new classifiers → at most one or two new traits → a fourth family | D1166 reproducible capture/rebuild recipe | 12 + |
| **5** | the §3 ladder | ~12,400 games, 4–5 h | 12, now with numbers |

**The smallest roster that is genuinely a *range*: 4** — family A's four bands, spanning **346.8
measured Elo** corpus-wide (479.8 at full material) with **all three adjacent segments above the
~60-Elo session-resolution floor** (141.6 / 93.4 / 112.5). That is a real range and it is
registrable today. It is not personalities.

**The smallest roster that is a range *and* has personalities: 6** — family B at all four bands (the
spine, because the curator is what the owner described as *"preventing blunders but playing low-elo
moves"*), plus family C at **1400 and 1800 only**, the two bands where the R11 population and the
explorer coverage are centred. Pawn-forward at 1000 and 2200 adds two calibration arms for a
behaviour already demonstrated at two rungs.

**Recommended day-one ship: family A's four.** They are the only profiles with **zero** blockers
beyond wave 0, they make the locked door open, and every later wave is additive.

---

## §6 — The honest gaps

| # | gap | status | owner fork? |
|---|---|---|---|
| 1 | **Chess960 has no human-trained policy net** | `HumanPolicyModel`'s contract is *a normalized mass over every legal move*, not *an engine*. Maia-1 is an Lc0 net and lc0 has supported `UCI_Chess960` since v0.23/v0.25, so the blocker is **absent weights**, not an absent instrument `[V]` ([[D1160]]). Worse: the pinned sidecar builds `chess.Board(fen)` with **no `chess960=True`** — it cannot *parse* 960, and the failure is silent castling corruption `[V]` ([[D1161]]) | **YES.** (a) ship 960 with an engine-composed opponent, disclosed and labelled uncalibrated; (b) fund a cp→mass base layer with its own positive control **and a redefined completeness statistic** — reusing the 0.97 mass threshold on a cp-derived distribution **passes vacuously at MultiPV-3**, the silent-failure trap `[V]`; (c) no 960 bot. Dossier recommends (a) |
| 2 | **Repertoire** | Measured out, not undecided: **79.2%** fallthrough on both arms against a 25% ceiling `[V]`. ⟳ **Correction:** [[D1142]] records `RepertoirePolicy`/`MemoryPolicy` as *"absent from the source tree entirely"* — that is a **name-scoped artifact**. `RepertoireLayer` (`:65-70`) and `MemoryLayer` (`:87-90`) both exist, both are members of `BotLayerDeclaration` (`:102, :105`), the composer executes a repertoire prior (`:484-492`) and refuses a memory instance (`:195`). The RFC's *prose* names are what is absent | No. A root-conditioned opening layer through ply 24 with explicit fallthrough is a different object and remains sacrificial research (D560/Gate F) |
| 3 | **Memory** | Ruled off (O8.3) and compile-refused `[V]` | Only if cross-game memory becomes opt-in exportable/deletable learner data under O13/F12 |
| 4 | **Personalities are bounded by what Stage A arithmetic can classify** | The vocabulary is *what a pure function of (position, move) can label*. Stage B's `candidateFeatureVector` ships ([[D813]] ✅) and the record carries `features` — but **`features` never enters the composition** `[V]` ([[D1162]]); traits key on `traits: string[]` and nothing populates it | **YES.** Fund the features→traits binding, or accept that personalities are board-arithmetic classes permanently |
| 5 | **The genuine article is unbuilt** | [[D810]]'s evidence-to-move selector — features → weights → distribution with **no policy net underneath** — is a fourth thing neither the RFC nor the code contains, and it is the only **variant-portable** route to a human-shaped base. The available R11/D815 capture is a screening set, not a committed training corpus (D1166) | **YES.** Fund / defer / **refuse explicitly** — a refusal must be recorded, not implied ([[D1030]]'s pattern) |
| 6 | **Absolute human Elo** | Discharges D4. Until ruled, the band-relative calibrated figure with its citation is the ceiling of what any card may show | **YES — this is the fork that decides whether a card ever shows a human-scale number.** Anchor accounts / learner Glicko / stay band-relative |
| 7 | **Time control** | The ladder is untimed; the label rule wants a clock; maia1's own rating spans ~230 Elo across time controls `[V]` | Sub-fork of 6 |
| 8 | **Timing behaviour** | No clock input exists anywhere in the opponent path `[V]`; fake delays are refused ([[D820]]) | Not a fork — a corpus/model programme |
| 9 | **The endgame** | Band inert below ten pieces (~0.07 Elo per band point). Maia converts **88.1–91.9%** of won tablebase-critical endgames; **all 84 errors were `win→draw`, zero `win→loss`** in 810 probes; the errors are the model's *belief*, not the sampler's tail (argmax preserves at the same rate); and band 1100 vs 1900 ties on **43 of 45** positions `[V]` (`maia-endgame-fidelity.md`). `guard.endgame_floor` is named, unregistered, unmeasured | Not yet a fork — a measurement (RFC Open question 4) |
| 10 | **Perceptual human-likeness** | Zero human judgements exist. The validated 42-branch blind packet is retained as an **owner-use** instrument that can reject a profile but cannot clear H5/C5 as population claims `[V]` (O8.5, Discharges D5) | Owner use, not a fork |

---

## §7 — Corrections re-derived at HEAD

| # | claim as recorded | re-derived at HEAD |
|---|---|---|
| 1 | *"`RepertoirePolicy` and `MemoryPolicy` are absent from the source tree entirely"* ([[D1142]]) | **Stale/name-scoped.** `RepertoireLayer` and `MemoryLayer` exist at `bot-policy-catalog.ts:65,87`, are union members at `:102,:105`, and are executed/refused at `:484-492`/`:195`. The RFC's prose names are absent; the interfaces are not |
| 2 | *"The sampler has no production caller"* | **Precise but incomplete.** `composeBotPolicySelection` is called only from its own test — **and** the request seam is fully wired: `BOT_POLICY_PROFILES` is imported, is the default `profiles` argument, and `validatePolicy` routes through `validateProfilePolicy` (`git show HEAD:apps/server/src/opponent-selector.ts:36,174,511`). With an empty catalog every `profile` request is refused. **Installed and locked, not missing** |
| 3 | RFC §2.4's guard numbers (−1.27 cp, 100.2% retention) and §0's pawn ×4 (+11.97 pp) | **Depth-12 numbers.** Production is depth 8: **100% / +1.36 cp / 100.21%** and pawn ×4 at **+12.28 pp** `[V]` (`stockfish-candidate-guard-probe.md` §7) |
| 4 | `ErrorGuardLayer.searchBound` | 🐞 **New.** The union is `"nodes" \| "movetime"` (`:76`). The only measured production bound is fixed **depth 8**; node bounds are **refused by population completeness**. The shipped type cannot declare the shipped answer. Blocks 8 of 12 profiles |
| 5 | `BotPolicyCandidateInput.traits` | 🐞 **New.** Written only in `bot-policy-catalog.test.ts:189-190`. A registered trait multiplies by 1 on every candidate. **The hardest blocker on "personalities" and no ledger row names it** |
| 6 | the controlled-trait gate | 🐞 **New.** `traitDelta` is a fraction in code (`< 0.1`) while every dossier states percentage points, and nothing checks units — a declaration carrying `12.28` passes for the wrong reason |
| 7 | *"D1014 records the general fix: add a catalog-wide conflicting-declaration rejection before registration"* (`maia-production-band-roster.md`) | ✅ **Already implemented.** `compileBotPolicyCatalog:283-290` fails when one layer id carries different canonical declarations across profiles. Band-specific model ids are therefore enforced, not merely advised |
| 8 | profile composition requirements | Under-specified in the RFC: `compileBotProfile:257-259` requires `human_policy_model`, `sampler` **and `presentation`**. Every one of the twelve must declare a persona layer or nothing compiles |
| 9 | the band set | No fixture pins it. `HumanPolicyModelLayer.band` is an unconstrained `number`; D970's able-to-fail fixture (*"adding 2400 or an unmeasured interpolated band fails"*) does not exist |

---

## §8 — Citation index

| dossier | what the roster took from it | cited by the RFC? |
|---|---|:--:|
| `maia-production-band-roster.md` | the four bands, band-specific model ids, band-relative wording, the six able-to-fail fixtures | **0 times** |
| `maia-band-outcome-transfer.md` | the ladder (−141.6 / −0.7 / +92.7 / +205.2), the 346.8/479.8 spans, the 0.289/0.400/~0.07 transfer ratios, the ~60-Elo rung floor, D341's seeding rules, throughput, the T=5.0 control | via [[D335]]/[[D336]] only |
| `maia-band-calibrated-range.md` | `bandRange {1000, 2400}`, the readable window `[800, 3500]`, probe latency, the clamp | no |
| `stockfish-candidate-guard-probe.md` | depth 8, the node-bound refusal, latency, the depth-8 retention table, mixed-domain abstention | no |
| `bot-policy.md` (R11) | the sampler positive control, the arm table, the trait gate, the repertoire refusal, effective-moves 2.41 | **yes — the only one** |
| `bot-candidate-sharpness.md` | Law A's screen design, the zero-endgame-coverage limit, D817's refusal | via [[D816]]/[[D817]] |
| `maia-policy-scalar-stability.md` | the completeness floor (0.999625 / 0.979540), `bestmove` instability (34.3%), the MultiPV-20 cap | via §2.1's floor only |
| `maia-endgame-fidelity.md` | 88.1–91.9%, zero `win→loss`, belief-not-sampler, 43/45 band ties | via §Motivation only |
| `human-like-opponents.md` | Regan (s,c), Chabris tails, move-match 46–52% vs 33–41%, the anchor survey, ±500–700/√n | yes |
| `non-maia-bot-composition.md` | the base-layer contract, the 960 forks, the completeness vacuity trap, `REFUSED_PERSONA_CLAIM` | n/a (dated today) |

---

**Not committed. Nothing in `design/` was edited. No file held dirty by another agent was touched.**
