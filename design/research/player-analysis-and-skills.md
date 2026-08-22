# Player analysis and skills — game review, longitudinal habits, and the progression surface

**Questions (owner, 2026-08-20, verbatim in D549/D552):**

- D549: *"chess.com has 'skills' you can earn from game review — 'fundamentals', 'openings',
  'tactics', 'strategy', 'endgames' — filled with chess concepts and patterns. We need something
  like THAT — it can support our campaign mode or general progress tracking and gamification."*
- D552: *"chess.com has so much feedback after a session and can tell you all your openings and
  how accurate you are with them… maps your opening style to (aggressive-solid,
  theoretical-creative) and maps it to the greats… maybe we can give personalized tips this way:
  'early game is solid, but in the midgame your play is too simple and positional, not enough
  tactics.'"*

Plus the Wave-B closing question nobody had designed: **opportunity-normalized player habits** as
a consumer of the new collector families (`wave-b-breadth-probe.md` §5.4; D729).

**Status:** desk + repo-synthesis design pass answered `[V]`/`[P]`; no corpus job run. This
dossier is the design basis for F9 (player metrics, profile, skills and grounded coaching) and the
longitudinal half of F6. It extends and does not replace `player-style-metrics.md` (R12),
`grounded-coaching-aggregation.md` (R13), `classifier-coverage-and-noise.md` §4/§4a, and the
Wave-B dossiers (`pawn-conversion-events.md`, `identity-retaining-three-edge-consequences.md`,
`middlegame-evidence-and-style-taxonomy.md`).

## Verdict

1. **The competitors' analysis surfaces are aggregates over engine move-grades whose cut points
   are conventions, plus corpus lookups, plus editorial style prose — and the boundary between
   the three is documentable.** Chess.com's Skills feature is a **per-move absolute counter with
   undisclosed detection and no opportunity denominator**: a point per "move that demonstrates a
   Skill", mastery at "collect enough points", sequential unlock `[V]`
   ([support article](https://support.chess.com/en/articles/16243840-what-are-skills-on-chess-com)).
   That shape is grindable by volume and by seeking easy positions; ours must not be (§3.3).
2. **What our plane makes computable that theirs cannot** is exactly one thing said three ways:
   **the denominator.** F2 enumerates the complete legal-alternative population at every decision;
   the run log preserves rewind/branch/compare attempts no competitor keeps
   (`teardown-chesscom-desk.md` §Q1 `[V]`); and the new collectors are phase-banded at the source
   (passer creation 21.18×/14.45×/11.58× by ply band, `pawn-conversion-events.md` `[V]`). A habit,
   skill credit or tip is therefore an **opportunity-normalized, phase-aware, re-derivable
   aggregate** — a form no surveyed product ships (§2).
3. **The five chess.com categories map onto our grounded vocabulary**, and the map sorts cleanly
   into creditable-today, creditable-after-2c/2d, needs-Phase-3-or-engine-join, and
   refused-under-law-8 (§3). A skill credit is an aggregate over declared evidence with a declared
   credit rule: opportunity-normalized rate + per-metric sample floor + milestone thresholds over
   the rate — never a raw count (§3.3).
4. **Style axes ship only as continuous measured habits** (R12's standing result: 12 retained
   metrics, archetype clustering fails at ARI 0.251–0.417 vs the 0.70 gate `[V]`), and **one
   taxonomy serves both bot personas and player style** — the D812 persona vector read in reverse
   (§4). *"Maps to the greats"* from measured play stays refused; a clearly-labelled authored quiz
   is the only admissible entertainment framing.
5. **The owner's tip sentence decomposes** into three grounded phase-split aggregates, one word
   that is a population comparison (admissible with the baseline shown), and two words that are
   judgements the LLM may not add (§5). The sealed packet shape is F1 §6.1's
   `RenderedEvidenceView` unchanged.
6. **The blocking dependency is not a collector — it is the longitudinal store.** R13 measured
   that no shipped plane persists cross-game observations: imported runs are excluded from the
   attempt projection, F2 events enter no storage, and pack concepts are namespaced apart
   (`grounded-coaching-aggregation.md` §1 `[V]`). Everything in this dossier lands as projections
   over that personal observation ledger (§6).

---

## 1. What the competitors actually compute — the grounding table

Method: primary pages fetched this pass `[V]` where noted; the deep layer-by-layer grounding
analysis of chess.com Game Review/Insights, Lichess `Advice.scala` and WintrChess is **not
re-derived** — it is `classifier-coverage-and-noise.md` §4/§4a, verified there against primary
sources 2026-08-18 and cited as a bounded block below.

| Product / surface | What it computes | Grounded fact vs editorial judgement | Evidence |
|---|---|---|---|
| **chess.com Skills** (Game Review) | Five categories — Fundamentals ("core habits"), Openings, Tactics, Strategy, Endgame. One point per qualifying move ("developing your pieces early, spotting a fork, or castling at the right time"), marked in the move list during review; "collect enough points and you'll master that Skill and unlock a new one"; sequential unlock per category; celebration + Coach congratulation on mastery | Detection mechanism **undisclosed**; credits are **absolute counts** with no opportunity denominator, no sample floor, no population; the credited move classes themselves range from rules arithmetic (castling, development) to undocumented tactic detection | `[V]` [What are Skills on Chess.com](https://support.chess.com/en/articles/16243840-what-are-skills-on-chess-com) |
| **chess.com Game Review grades** | 12 move-quality words from engine multi-PV delta + thresholds | Number is a measurement; the word is a **convention** — and `Brilliant`/`Great`/`Miss` are additionally **rating-dependent** (easier to earn when lower-rated), so the same move gets different words for different players | `[V]` `classifier-coverage-and-noise.md` §4a layers 2–3 |
| **chess.com Insights / Advanced Stats** | Ratings across Openings/Tactics/Strategy/Endgames; "every stat is graded with a move classification… if you are better than other players at your rating, you will get a positive move classification"; drill-down into tactic types ("if you struggle more with spotting checkmates or trapped pieces"); recency-weighted; found/missed fork/pin/mate counts, hanging pieces, per-opening rows | Aggregates over the grade convention plus a **same-rating peer comparison** — the peer baseline is the honest part; the detector internals for found/missed motifs are unpublished | `[V]` [Advanced Stats announcement](https://www.chess.com/news/view/announcing-advanced-stats); `[V]` §4 family C/I of `classifier-coverage-and-noise.md` |
| **Aimchess** | Six aspects verbatim: Tactics, Endgame, Advantage Capitalization, Resourcefulness, Time Management, Opening Performance; compares against same-rating players; routes drills at the weakest aspect | Aspect scores are engine-delta composites with **undisclosed formulas**; the aspect *names* embed valence ("Resourcefulness") that the published material never grounds beyond eval trajectories | `[V]` [aimchess.com](https://aimchess.com/); `[P]` third-party detail ([MattPlaysChess](https://mattplayschess.com/aimchess/)) |
| **Lichess Insights** | 13 dimensions × 10 metrics (the "23 dimensions" of D544's shorthand): dimensions incl. opening, castling side, queen trade, piece moved, material imbalance, phase, opponent strength; metrics incl. ACPL, move time, result, and the composites Opportunism ("how often you punish opponent blunders") and Luck | Almost entirely grounded facts or disclosed engine aggregates; Opportunism/Luck are convention composites over the blunder threshold; **zero** structure/space/plan facts | `[V]` read in the 2026-08-18 pass, `classifier-coverage-and-noise.md` §4 ([blog](https://lichess.org/blog/VmZbaigAABACtXQC/chess-insights)) |
| **OpeningTree** | Consolidated tree of *your own* imported games (chess.com/Lichess/PGN); per-move W/D/L percentages and counts under filters | **Fully grounded** — pure corpus arithmetic over the player's games, no engine words, no judgement. The only surveyed product entirely on the legal side of law 8 | `[V]` [github.com/openingtree/openingtree](https://github.com/openingtree/openingtree) |
| **Style → "the greats"** | chess.com editorial ("Which Chess Legend Do You Play Like?"), Chessiverse's 51-metrics→30+-archetypes personality page, ChessBase 18 Style Report | **Editorial end to end.** Chessiverse publishes neither formulas nor stability; ChessBase's own follow-up shows the report fluctuates below ~200 games and changes with the window | `[P]` [chess.com article](https://www.chess.com/article/view/which-chess-legend-do-you-play-like); `[V]` [Chessiverse page](https://chessiverse.com/chess-personality) and `[P]` ChessBase via `player-style-metrics.md` §1 |

**Our law-8 line through their material** (the §4a five-layer result, applied): their families D/E
(structure, space) and most of F/G are rules arithmetic — grounded, and *absent from every one of
their classifiers*; their grade words are conventions admissible only with the threshold shown;
their `Brilliant`-class composites and rating-conditioned words are judgements dressed as
detections; their plan/intent labels are the law-8 line itself. `[V]`
(`classifier-coverage-and-noise.md` §4a). The consequence for this surface: **we may adopt their
category names and their comparison-to-peers framing; we may not adopt a single one of their
credit or score mechanisms as-is**, because none publishes a denominator, a floor, or a
re-derivable rule.

---

## 2. What our event log + collectors make computable that theirs cannot

Each row names its grounding; nothing here is a proposal to *show* all of it — module eligibility
and selection still decide (D717).

1. **Opportunity-normalized habit rates.** F2 materializes the complete legal-alternative
   population at each decision (`phase1-gap-matrix.md` §1 `[V]`), and R12 already computed
   `played_event − legal_alternative_share(event)` over 261,892 decisions with per-metric floors
   `[V]` (`player-style-metrics.md` §3). No surveyed competitor publishes any per-decision
   opportunity denominator; chess.com's found/missed motif counts come closest and disclose
   nothing. "You miss forks" becomes *"of N decisions where a meaningful double attack was
   available among your legal moves, you played one k times; band baseline b"* — with N, k, b all
   re-derivable.
2. **Phase-aware denominators from the collectors themselves.** The Wave-B instruments measured
   lift in disclosed ply bands precisely so no global prior is manufactured: passer creation
   12.46×/13.45×/7.72× and capture-created passage 21.18×/14.45×/11.58× across plies 1–20/21–40/41+,
   while advancing an existing passer is background mid-game (1.03×) and distinctive only late
   (3.17×) `[V]` (`pawn-conversion-events.md` §3). A habit metric built on these events inherits
   the band structure: the denominator is *eligible decisions in that band*, which is what makes
   "midgame" in the owner's tip sentence a measured window rather than vibes (§5).
3. **Attempt-structured denominators nobody else has.** Competitors destroy attempt history at
   every takeback ("the original game is not preserved" `[V]`, `teardown-chesscom-desk.md` §Q1);
   our runtime appends `run.rewound` and deletes nothing `[V]`
   (`feedback-versus-the-dashboard.md` §1). That makes computable: repeat-attempt success on the
   same root, behavior change after seeing a consequence (chose-again rate after rewind), and
   N-way branch comparison outcomes — longitudinal metrics whose *unit is the attempt*, a unit
   that does not exist in any surveyed product's data model.
4. **Identity-retaining sequence evidence.** The three-edge census retains defender/target
   identities through move–reply–move (29 + 13 witnessed forms across 6,775 imported windows,
   0 authored) `[V]` (`identity-retaining-three-edge-consequences.md` §3). Their tag systems
   assert a motif name over a line; ours can show the exact retained pieces — but §5 of that
   dossier already rules the habit use: raw sequence counts are too rare and opportunity-dependent
   to define tactical style; they are Review moments, not axes.
5. **Re-derivable numbers with versioned recomputation.** R13's ledger invariants: occurrence and
   opportunity travel together; every count reopens exact contributing rows; recomputation is
   versioned so classifier improvements do not rewrite old claims invisibly `[V]`
   (`grounded-coaching-aggregation.md` §2). This is the stale-figure discipline as a product
   property: **any number a learner sees is re-derivable from named events at a named version.**
   ChessBase's own report changing under the user's feet (§1 table) is the cautionary tale.
6. **One vocabulary for bot personas and player style.** Because personas are declared weights
   over the same registered features (D812), *"the same persona vector is readable by the
   style-mapping feedback lane — one vocabulary, two consumers, which no competitor has because
   none of them declare the features in the first place"* `[V]` (`human-like-opponents.md` §8).
7. **Analysis that cannot leak into grading.** R15's byte-identity rule — rating (and by
   extension any profile projection) *"may select WHAT a learner is shown … and may never appear
   as an input to WHAT IS SAID about a move they played"* — is enforced as a reachability test,
   not a principle `[V]` (`rfc/learner-rating.md` §8/AC-11). Competitors do the opposite by
   design: chess.com's `Brilliant` is rating-conditioned. Our skills/style store must extend the
   same reachability exclusion (§6).

---

## 3. The skills taxonomy — five categories over grounded vocabulary

### 3.1 Category map and when each credit family lands

"Today" = shipped F2 events + 17 structural detectors + tablebase + clock + explorer, **plus the
longitudinal store none of them currently reach** (§6). "2c"/"2d" = the accepted/drafted collector
RFC ids (`rfc/tactical-collectors.md` Appendix A, 30 ids; `rfc/breadth-collectors.md` Appendix A,
18 ids `[V]`). "Phase 3+" = F5 module contracts, engine/theory joins, or R8/F7 opening identity.

| chess.com category | Creditable from detected evidence today | After 2c | After 2d | Needs Phase 3+/joins | Refused (law 8) |
|---|---|---|---|---|---|
| **Fundamentals** | castled event; pawn-structure events (isolated/doubled/backward/passed ship); phase clock allocation | development (`rules.transition.event.developed@1`), castling-rights loss with cause, loose-piece avoidance (`derived.semantic_avoidance.loose_piece@1` — the D745-ruled signed reading, post-commit/review only, denominator always shown), capture class (`derived.exchange.capture_class@1`) | safe-mobility operands | — | "good habits" as a summary word; any credit from LLM opinion |
| **Openings** | opening surprisal + family entropy (R12-retained, explorer-grounded); early deviation rate | — | — | per-opening identity, accuracy-per-opening and theory-match depth — **blocked on D694/D544**: runtime opening identity is refused at `apps/server/src/position-evidence.ts:25` ("position naming, not a recorded measurement", verified at HEAD this pass) and the R8/F7 join is the gated route `[V]` | "your opening repertoire is bad/narrow" |
| **Tactics** | — (the measured gap: we detect no tactical family today, D544 `[V]`) | check, threat (`threat@1`), meaningful double attack, `fork_survives_reply@1` (census: all-reply persistence 0/10 authored, 2/29 imported — a *rare-event* credit, opportunity-gated, never a default expectation `[V]` `bounded-reply-semantics.md`), loose-piece capture taken/available, discovered_executed, trapped/back-rank/mate-in-one readings | defender exposure + three-edge defender consequences (Review moments feeding conversion denominators) | counterfactual "missed tactic" requires the engine/bounded-search arm under a disclosed policy | motif names implying intent (deflection, overload) without the reply-enumeration proof; "tactical vision" as a score |
| **Strategy** | `named_structure` (9.96× lift — the best shipped detector `[V]` `classifier-coverage-and-noise.md` §1b); shape encounters (`shapeRecommendations` already counts them) | space (`space@1` as ruled in D745), rook-on-seventh, pawn connectivity/islands | square control events, pawn dynamics (locked pairs 3.89×/2.08×, harassment 3.63×/3.18×), open-file occupancy, material-role asymmetry (2.47×/4.35×), candidate-majority | plan labels only as **cited literature over a detected antecedent** (the D530/D531 template) | "positional understanding", "plays too simple", prophylaxis/tempo/initiative words |
| **Endgame** | Syzygy-grounded technique on ≤7-piece roots (shipped); opposition reading; endgame clock spend | trade-completed → endgame entry | passer conversion family (`derived.pawn.event.transitions@1`): became-passed, capture-created passer (the strongest measured events in every band), protected/connected passer gains phase-gated | conversion *success* needs tablebase/engine/authored consequence — the detector supplies the event, never "converted well" | "endgame technique" as a graded verdict outside tablebase range |

Two structural notes. First, the tactics column being empty today is D544's inverted-premise
result: our 17 structural detectors are a lead over every surveyed classifier (they annotate zero
structure facts), and the gap is tactical — which is exactly what 2c ships `[V]`. Second, the
sparse rows (fork-survives-reply, three-edge sequences, zero authored witnesses) are **census
evidence, not credit fodder**: crediting a skill whose opportunity count is near zero produces
noise dressed as progress; those events enter as Review moments and only aggregate into a credit
when a learner's opportunity count clears the metric's floor.

### 3.2 The credit rule shape

A skill credit is an **aggregate over declared evidence**, and its rule is part of the registered
metric, not UI copy:

```text
SkillCredit (design shape, not a schema)
  skill id + version                      // e.g. skills.fundamentals.loose_piece_avoidance@1
  evidence projection id(s) + version     // what grounds it — 2c/2d ids above
  opportunity definition                  // eligible decisions where the event was available
                                          //   among legal alternatives (or reply_breadth@1 set)
  credit statistic                        // opportunity-normalized rate (played − alternative share),
                                          //   or conversion rate over available opportunities
  baseline                                // named population/window (band, time control, phase band)
  sample floor                            // per-metric, measured — R12 spans 25–200 games [V]
  milestone thresholds                    // discrete "mastery" tiers as monotone marks on the
                                          //   rate at ≥ floor opportunities — the gamification face
  drill-down                              // exact contributing run#node / game#ply rows
  producer/version/created-at             // versioned recompute (R13 invariant 7)
```

**Threshold, streak, or rate?** Rate-over-opportunities, with milestones on the rate. A raw
threshold ("earn 50 points") is chess.com's shape and is bought with volume. A streak is worse: it
punishes the learner for *facing* more opportunities. The milestone tiers give D549's progression
feel (unlock, celebrate) while the underlying statistic stays honest — and D297's
knowledge-as-key device is the right spender for the credits: a mastered skill *opens* content
(campaign doors, harder presets), it does not *grade* the player `[V]`
(`fun-mechanics-outside-roguelikes.md` via D297; D549).

### 3.3 The anti-gaming property (the D297/plyHorizon lesson, generalized)

D345 measured that `plyHorizon` equals the deepest authored spine ply in 29 of 31 non-endgame
packs — the field restates its input and therefore measures nothing `[V]` (BACKLOG D345). D603's
fianchetto instrument returned 586/586 because its denominator admitted only knight moves — an
all-ones credit is an instrument alarm, not a mastered skill `[V]` (`player-style-metrics.md` §5).
The generalized property a credit rule must satisfy:

1. **The denominator must include declinable opportunities** (D603). A credit computable only
   from moves that already exhibit the event is vacuous.
2. **The credit must not restate exposure.** Raw counts restate how many games you played and
   which positions you reached (the `passed_pawn_advanced` 18.81× authored headline is pack
   composition, not player skill `[V]` `pawn-conversion-events.md` §3). Opportunity-normalization
   is the fix, and pack-selected exposure additionally means **drill outcomes credit "rehearsal
   result", never "skill possessed"** — R13 §1.1's distinction: *"3 of 5 graded attempts on this
   exact root ended stable"*, not *"you struggle with this concept"* `[V]`.
3. **The credit must not be earnable by re-running the same position.** Attempts on one root
   contribute one opportunity row per distinct decision context; retries update the rehearsal
   module, not the habit metric.
4. **A validator must exist before the number ships** (the D440 lesson: 25 packs assert a
   terminality nothing validates `[V]`). Every credit rule ships with its positive fixture, its
   D603-style all-ones alarm, and a synthetic-control test.
5. **Credits are never LLM-derived** (D549's own constraint; law 8). The LLM may word a mastered
   milestone; the detection and the arithmetic are producer-side.

### 3.4 `attempt_concepts` is the credit stream's storage ancestor, not its schema

The shipped-but-consumerless `attempt_concepts` table is exactly a concept-credit stream (D549),
but its default resolver namespaces every concept `pack:<packId>#<raw>` — 199 references, 168 raw
identities, 199 separate keys — so cross-pack recurrence is impossible until F9 registers a
cross-pack identity and migrates `[V]` (D300; `grounded-coaching-aggregation.md` §1.2). The rfc
graph already pins this: *"reuse `attempt_concepts` only after semantics bind"* `[V]`
(`planning/platform-alignment/rfc-graph.md` F9 row).

---

## 4. The style mapping (D552)

### 4.1 Axes that are computable as declared-evidence aggregates

R12's gate is the template and its refusals bind: forcing-choice, non-pawn-capture,
opponent-reply-breadth and fianchetto-unblock all *looked* strong and failed the persistence gate
`[V]` (`player-style-metrics.md` §4). Against the owner's two named axes:

| Owner's axis | Grounded components (declared aggregates) | Status |
|---|---|---|
| **aggressive ↔ solid** | aggression side: check-choice, capture-choice, forcing-choice residuals + created-threat rate (post-2c `threat@1`/`check@1` with `reply_breadth@1` denominators); solidity side: structure-preservation residual, pawn-choice residual (R12-retained), castling timing | **composite not yet validated** — the forcing-choice residual is R12-*refused* (one band passed) and the composite needs its own §5.3 validation run before any two-pole label ships. Components may show as separate habit cards now |
| **theoretical ↔ creative** | opening surprisal (retained, floor 25) + family entropy (retained, floor 100) + early deviation rate; theory-match *depth* once the D694/R8/F7 opening-identity join lands | the two retained metrics are the strongest measured habits in the whole R12 table (rho 0.974/0.935 `[V]`) — this half of D552 is the cheapest honest style card |

The full candidate-axis table (12 families, each with named required collectors) is
`middlegame-evidence-and-style-taxonomy.md` §5.2 and is not duplicated here; its three-tier proof
ladder governs: per-game fact → opportunity-normalized stable habit → separately validated type,
and current evidence permits the first two only `[V]`.

### 4.2 Where "maps to the greats" crosses law 8

A nearest-grandmaster match from measured play is refused on two independent grounds already
measured: archetype clustering fails its stability gate on our own cohort (ARI 0.251–0.417 vs
0.70), and a GM reference corpus is a *differently sampled population* whose distances mean
nothing without the validation that just failed `[V]` (`player-style-metrics.md` §6). The
admissible entertainment framing is the one R12 §7 and the Wave-B taxonomy §5.3(10) both name: a
**playful authored quiz that says it is a quiz**, kept byte-separate from measured play. An LLM
rendering measured axes may not append "…like Tal" — that is a manufactured verdict over an
unvalidated mapping, not tone.

### 4.3 One taxonomy for personas and players — confirmed, with one asymmetry

The verdict is **yes, one vocabulary** — D812's construction ("aggression = weight
checks/captures/attack-count candidates; solidity = weight structure-preservation… the same
persona vector read by both the opponent and the style-mapping feedback") is confirmed against the
whole practitioner field in `human-like-opponents.md` §8: every vendor persona dimension lands on
a declared feature weight or candidate mask we already register `[V]`. The asymmetry that keeps
the two readings honest:

- a **persona** is a *policy* — weights are chosen, and R11's `controlledTraits` gate applies: a
  bot may not be labelled with a trait its policy does not measurably control `[V]`;
- a **style axis** is a *measurement* — rates are observed, and R12's stability gate applies: a
  player may not be labelled with an axis that does not persist across disjoint samples.

Same feature ids, two different proof obligations. Law 8 sits identically on both sides: a
persona weights candidate selection and never grades the learner; a style axis describes choice
rates and never grades a move.

---

## 5. The tip sentence, decomposed

> *"early game is solid, but in the midgame your play is too simple and positional, not enough
> tactics."*

| Fragment | Grounded core | What grounds it | What the LLM may not add |
|---|---|---|---|
| "early game is solid" | opening-band aggregate: structure-preservation residual + engine-loss distribution in the opening band, each vs the named band baseline | shipped structural events + engine deltas under a **disclosed** threshold convention (§4a layer 2 rule: print the number or the convention, never only the word) | "solid" as a trait; any causal reading |
| "in the midgame" | ply/phase band, disclosed exactly as the collectors measure it (the D774 band discipline) | `classifyPhase` / declared ply bands | a phase boundary the packet does not carry |
| "your play is too simple" | trade/simplification residual: capture-choice and trade-completed rates over opportunities, mid-band | 2c `derived.exchange.trade_completed@1` + capture events with legal-alternative denominators | **"too"** — a norm. Admissible only as an explicit population comparison with the baseline shown ("above the band median of b"); refused as a free adjective |
| "and positional" | (redundant with the above components) | — | "positional" as a diagnosis — refused; R12 refuses tactical/positional composites without a separately validated formula `[V]` |
| "not enough tactics" | phase-split tactic-opportunity conversion: of N mid-band decisions where a 2c tactical event was available (loose-piece capture, meaningful double attack, threat), played k; band baseline b | 2c events + `reply_breadth@1`/legal-alternative denominators | **"not enough"** — same rule as "too": comparison with baseline shown, yes; norm, no. And no prescription — "play more tactics" is advice R13 reserves for the separate grounded-coaching contract `[V]` |

**The sealed packet.** F1 §6.1 already defines the only legal shape and nothing new is needed: the
tip is a `RenderedEvidenceView` for a registered consumer (e.g. `coaching.longitudinal_tip@1`),
whose `items` are `RenderedEvidenceItem`s — each a `DeclaredEvidence` payload (one habit-card row:
metric id + version, value, opportunity count, baseline population/window, interval, floor,
drill-down refs) plus sentences produced only by that projection's registered renderer; the
provider body is `{ personaPrompt, scope, items }` serialized from a brand-asserted view, and
`voiceCheck`'s allow-list derives from the same admitted items `[V]`
(`rfc/archive/evidence-contract-manifest.md` §6.1). The LLM's whole degree of freedom is
connective prose, ordering and tone over those items. The rendered-items contract is also the
enforcement point for §4.2 and this table's refused words: they are simply not in any registered
renderer's output, so `voiceCheck` rejects them.

---

## 6. Where it lives — dependency edges

Owner F-lane: **F9** (contract: versioned metrics/denominators/sample/confidence; event
drill-down; rating/style/advice isolation; data controls; migration — `[V]`
`planning/platform-alignment/rfc-graph.md`). Edges, from nearest to farthest:

1. **The longitudinal store (F9's own core) blocks everything cross-game.** R13's census: imported
   sessions return an empty attempt projection; F2 semantic events enter no progress storage;
   `attempt_concepts` is pack-namespaced (D300); aggregate metrics return no source rows;
   `shapeRecommendations` drops node identity `[V]` (`grounded-coaching-aggregation.md` §1). The
   personal observation ledger (R13 §2) is the store; skills credits, habit cards and tips are
   projections over it.
2. **2c (`tactical-collectors`, implementing) unlocks the Fundamentals and Tactics credit
   columns**; **2d (`breadth-collectors`, drafted, lands after 2c)** unlocks Strategy/pawn/king
   and the passer-conversion Endgame family (§3.1). Nothing in this dossier asks for a collector
   either RFC does not already close.
3. **Phase 3 (F5 module contracts)** owns how any of this renders — module eligibility, budgets,
   presets, the sealed LLM boundary. Per D717, a registered metric is not a usable surface;
   skills/habit/tip modules are Phase-3 declarations over F9 data.
4. **F6 Review Map** consumes the *per-game* observations (Review moments from §2.3–2.4 events)
   and explicitly excludes longitudinal focus until F9 `[V]` (rfc-graph F6 row). The dependency
   is one-directional: F9's ledger ingests what F6's moments already declared; F6 never waits on
   F9.
5. **D694/R8/F7** gate everything opening-identity-shaped: per-opening accuracy, theory-match
   depth, the theoretical↔creative axis's third component (§4.1). Runtime opening identity is
   refused at HEAD and was deliberately removed from 2c's acceptance `[V]`
   (`tactical-collectors-review.md`).
6. **`learner-rating` R15 byte-identity extends to this surface.** Analysis may *select* what is
   shown — which card, which drill door, which campaign gate a mastered skill opens — and may
   never change what is *said* about a move; concretely, no skills/style/habit projection reaches
   guard/voice/feedback/objective inputs, enforced the AC-11 way (reachability test), and the
   style vector additionally stays out of rating (D552's own constraint: adjacent to the event-log
   projection, never a rating input) `[V]` (`rfc/learner-rating.md` §8/§8a).
7. **Privacy is load-bearing, not a footnote**: the R12 vector re-identifies 35/36 accounts from
   disjoint halves — a style profile is behavioral identifying data and feeds R18's
   export/delete/consent audit before production `[V]` (`player-style-metrics.md` §6–7).
8. **O9 remains the owner ruling**: continuous measured habit cards only; named natural types
   stay out until a stability/mapping result passes (`planning/evidence-foundation-ux/plan.md`
   question 6; `middlegame-evidence-and-style-taxonomy.md` §7.6).

## 7. Three cheapest first shippables

Ordered by cost; all three are F9-RFC slices (law 1 — nothing implements before acceptance), and
each consumes only evidence that exists or is already in an accepted/drafted collector RFC.

1. **The per-game observation module in Review — zero new collectors, zero longitudinal store.**
   Deterministic cards over the highest-lift *shipped* evidence (named_structure at 9.96×,
   top-transition leaves to 23.96×, Syzygy facts), R13's card grammar ("Carlsbad structure
   appeared in 2 of 3 recorded opportunities" — occurrence, opportunity, source node, applicable
   packs/theory), rendered through the existing F1 §6.1 path. This is the D549 surface's visible
   seed: the move-list marks chess.com's Skills feature shows, grounded our way.
2. **The theoretical↔creative half of D552 as two habit cards** — opening surprisal + family
   entropy. Both metrics are already validated with floors and intervals (rho 0.974/0.935), the
   harness exists, and they need only the minimal ledger projection (metric row + drill-down) plus
   game import. No collector dependency at all; the honest version of "tells you all your
   openings" while accuracy-per-opening waits on D694.
3. **One pilot skill-credit family with the full §3.2 rule shape: loose-piece avoidance
   (Fundamentals), first post-2c consumer.** It is the family with an owner-ruled learner-facing
   reading including its denominator ("you avoided leaving a piece loose; N% of your legal moves
   would not have" — D745), a shipped avoidance projection id in 2c, and a natural milestone
   ladder. Shipping *one* family end-to-end (event → ledger → credit rule → milestone → D297
   knowledge-as-key spend) proves the whole D549 mechanism before any taxonomy-wide build.

## 8. Proposed ledger rows (head verified at D831; proposed from D832 at audit time; landed as D842–D844 — the head moved to D841 while this dossier was in flight)

- **D842** — skill credits are opportunity-normalized rates with per-metric floors and milestone
  tiers; raw-count credits refused (the chess.com shape is grindable); credit rules ship with
  D603-style all-ones alarms and never read LLM output (§3.2–3.3).
- **D843** — one declared feature vocabulary for bot personas (policy weights, R11
  controlled-trait gate) and player style axes (measured rates, R12 stability gate); no second
  taxonomy (§4.3).
- **D844** — the longitudinal tip is a registered F1 §6.1 consumer over habit-card items;
  comparison words ("too", "not enough") admissible only as explicit baselined comparisons; norms
  and prescriptions refused pending the grounded-coaching contract (§5).

## 9. Limits

1. Competitor rows beyond the pages fetched this pass inherit `classifier-coverage-and-noise.md`'s
   2026-08-18 verification; chess.com's Skills detection internals are undisclosed and my
   grindability reading of its credit mechanics is inference from the published rules, not
   observation of abuse `[M]`.
2. Every "creditable after 2c/2d" cell assumes those RFCs land as written; 2c is implementing and
   2d awaits review/acceptance — ids could still change.
3. The R12 floors are short-session blitz floors; the §3.2 sample floors for production credits
   need the longitudinal arm (eight-week early/late windows, time-control transfer) R12 §8 already
   specifies.
4. No aggregation was run in this pass; all lifts, floors and counts are quoted from their source
   dossiers at their recorded versions.
5. Aggression/solidity composites are designed but unvalidated (§4.1); shipping them as a
   two-pole label before their own §5.3-style validation would repeat the exact failure R12's
   refused metrics exist to prevent.
