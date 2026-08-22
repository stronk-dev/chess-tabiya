# Middlegame evidence breadth and player-style taxonomy

**Question (owner, 2026-08-22):** is the Phase-2 collector list broad and sound enough to
describe what a move actually did—including square denial, harassment, preserved pressure and
multi-ply tactical/strategic consequences—and can the same primitives support player habits,
styles, bot personalities, Review and drills?

**Status:** taxonomy, twenty one-edge breadth probes, legal-exchange prerequisite and the first
multi-edge census answered `[V]`/`[P]`; bounded-search and longer identity-preserving sequences
remain open, and proposed collectors still require an accepted RFC.
This report extends, and does not replace,
`detection-landscape.md`, `player-style-metrics.md` and
`planning/evidence-foundation-ux/phase2-collector-audit.md`.

## Verdict

The Phase-2 audit is a sound **first build wave**, not a complete middlegame ontology. It correctly
puts SEE before tactical names and separates state, transition and consequence. It covers the
highest-leverage missing family: loose pieces, meaningful forks, ray relations, pawn connectivity,
castling rights, development, captures/trades, space, threats, promotion pressure, runtime opening
identity and discovered-line latency. `[V]` (`phase2-collector-audit.md` §§2–5)

Seven important families remain implicit or absent from that prioritized list: **square
denial/holes, safe mobility and restriction, pawn tension/levers/majorities/blockades,
file/diagonal control and coordination, king shelter/zone pressure, material imbalances, and
multi-edge persistence**. `[V]` Cross-check of the Phase-2 table against the current runtime,
Lichess's open tactic vocabulary/tagger and the 209 human chess concepts enumerated in the
AlphaZero concept study; sources below.

There is no honest point at which Tabiya can claim it has enumerated “all chess concepts.” The
AlphaZero study itself calls its 93 Stockfish concepts plus 116 custom concepts only a starting
point and says the list is far from the accumulated breadth of chess knowledge. `[V]`
[McGrath et al., pp. 7–8 and 35](https://arxiv.org/pdf/2111.09259).

The correct 1.0 target is therefore not a frozen mega-enum. It is a **versioned coverage frontier**:
an extensible set of exact atoms, disclosed conventions and bounded consequences, each with
operands, hard negatives, abstention and named consumers. New semantic vocabulary must be
additive/versioned so authored packs opt into it; improving the foundation must not force a corpus
rewrite. `[M]`

Player classification sits one level later. A rare event can be excellent evidence for a hint and
still be unusable as a style axis. Current local measurement supports twelve continuous habit
metrics with per-metric floors of 25–200 games, identifies 35/36 players across disjoint halves,
and finds no stable natural clustering. `[V]` (`player-style-metrics.md` §§4–6). Learned models can
also capture individual signatures, but that does not produce an interpretable personality label:
published stylometry identifies players from later-game decisions while warning about
de-anonymization, and learned style-vector work interprets latent behavior only by evaluating a
model on fixed positions with chess heuristics. `[V]`
[McIlroy-Young et al.](https://arxiv.org/abs/2208.01366),
[Tang et al.](https://arxiv.org/pdf/2502.14998).

The first predeclared Phase-2b probe confirms that breadth is not synonymous with volume. Pawn
harassment is sharp in both populations (3.63× authored, 3.18× imported), as are exact opponent
defence-edge loss (2.66×/3.36×) and a newly locked pawn pair (3.89×/2.08×). Generic pawn contact
is only 1.03×/1.19×; same-color slider alignment is 0.82×/0.99×; relative line constraints reverse
direction across the two populations (0.74×/1.33×). `[V]`
(`tools/d723-breadth-harness/output.md`). These are prioritization and selection results, not
correctness, valence or learner-usefulness judgments.

---

## 1. Research method: triangulation, not a brainstormed checklist

The breadth inventory uses four independent inputs:

1. **The shipped tree and measured gaps.** Phase 1 re-derived 20 producers, 126 projections, 25
   consumers, 175 bindings and a production-inert 33-event semantic layer at HEAD; Phase 2 traced
   every proposed primitive to symbols and recorded where an adapter—not a collector—is missing.
   `[V]` (`phase1-gap-matrix.md`, `phase2-collector-audit.md`)
2. **An operational tactic implementation.** Lichess publishes the generator/tagger used for its
   puzzle corpus. Its fork logic applies piece value and safety filters; hanging-piece logic checks
   capture/material sequences; its pin labels ask which attack or escape the pin prevents; many
   motifs inspect multiple plies. Its `overloading()` implementation is still an unconditional
   false, proving that even a large production vocabulary has holes. `[V]`
   [tagger source](https://raw.githubusercontent.com/ornicar/lichess-puzzler/master/tagger/cook.py),
   [tagger tests](https://raw.githubusercontent.com/ornicar/lichess-puzzler/master/tagger/test.py).
3. **A broad human-concept inventory.** McGrath et al. expose 93 Stockfish-8 concepts rooted in
   material, imbalance, pawn structure, pieces, mobility, king safety, threats, passed pawns and
   space, plus 116 custom concepts including bishop pair, connected rooks, open-file control,
   mate threat, king-zone attacks, contested files, pawn islands, IQP and connected/protected
   passers. `[V]` [concept tables, pp. 33–35](https://arxiv.org/pdf/2111.09259).
4. **Owner scenarios and current product consumers.** Every family must ground at least one named
   use in support, Review, theory, drills, bots or longitudinal habits. A concept included only
   because chess vocabulary contains it is not automatically a 1.0 collector. `[M]`

The official Lichess puzzle database is useful as a large external disagreement/regression set,
not as truth for arbitrary positions: it was generated from 600 million analysed games, reanalysed
with Stockfish and automatically tagged; player votes refine tags. `[V]`
[Lichess database documentation](https://database.lichess.org/#puzzles). The local 50,000-record
probe already demonstrated why this distinction matters: geometry-only precision against tags was
32.3% for forks, 39.0% for new absolute pins, 19.7% for discovered attacks and 7.9% for hanging
pieces. `[V]` (`detection-landscape.md` §5)

### Admission rule for a primitive

A primitive enters the implementation queue only when it declares all of:

- evidence plane and semantic version;
- state / one-edge transition / multi-edge sequence / bounded consequence / population lookup;
- exact operands (pieces, squares, rays, before/after identities and horizon);
- rules basis, convention id, engine/model/population version, citation or author;
- exactness and abstention reasons;
- no valence, or the separate authority that permits valence;
- positive fixture, hard negative and non-vacuity fixture;
- external validation or explicit absence of a suitable oracle;
- prevalence and played-vs-legal-alternative measurement on authored and imported populations;
- learner modules and bot/style consumers allowed to read it;
- schema/content migration effect.

This is stricter than “the detector returns true,” because the existing product already proved that
true census facts can be useless at 8.83 entries per ply and that a correct assertion can pass while
never seeing the state that breaks the product. `[V]` (`classifier-coverage-and-noise.md`, D507,
D542, D564)

---

## 2. The evidence ladder

The vocabulary must preserve five layers rather than flatten them into one classifier:

| Layer | Example | Permitted claim | Extra proof needed for the next layer |
|---|---|---|---|
| **Atomic topology** | pawn h3 controls g4; bishop h5 lies on a ray through f3 to d1 | exact pieces/squares/relation | before/after identity |
| **Signed event** | h3 newly attacks the bishop; ...Bh5 preserves the bishop→knight→queen ray | exact gained/lost/preserved relation | eligible target/value/response rule |
| **Functional situation** | the bishop is harassed while its relative queen-line constraint survives | disclosed composition over exact events | bounded legal replies/search/theory |
| **Consequence** | the move forces a concession, wins material, prevents a plan, or gains a tempo | search/tablebase/corpus/theory/authored claim with horizon | repeated opportunities over games |
| **Habit/style** | the player often chooses pawn harassment when that option exists | versioned event rate minus opportunity baseline, sample floor and interval | validated mapping to any named type |

The Lichess implementation independently supports the middle distinction: it does not call every
simultaneous attack a fork or every ray a meaningful pin; it checks value, safety, prevented action
or the subsequent line. `[V]` [tagger source](https://raw.githubusercontent.com/ornicar/lichess-puzzler/master/tagger/cook.py).

An LLM may word an admitted item at any layer. It may not promote an atom into a situation, a
situation into a consequence, or a habit into a diagnosis/personality. That boundary is already
empirically necessary: typed provider output retained IDs while dropping required citations, and
one sentence arm stated a false absence that `voiceCheck` accepted. `[V]`
(`llm-renderer-contract.md`)

---

## 3. Breadth map and current coverage frontier

The table groups reusable evidence rather than UI labels. `Wave A` means the Phase-2 collector RFC
can own it; `Wave B` needs a follow-on measurement/convention; `join` means existing producers
should be composed rather than duplicated.

| Family | Required atoms/situations | Current state | Route |
|---|---|---|---|
| Rules/material | occupancy, legal/pseudo attacks, check, capture identity, material inventory, bishop pair, minor/rook/queen imbalance | occupancy broad; capture identity lossy; imbalances absent | Wave A: capture/SEE; Wave B: imbalance |
| Attack/defence topology | attacker/defender identities, legal vs pseudo attack, loose/under-defended, slider blockers, X-rays, defender duties | counts/rays exist; identities partly lost; loose absent | Wave A: SEE + loose/rays; D724/D727 extend |
| Square control/denial | controlled, contested, newly denied/released squares; hole/weak-square convention; route availability | attack counts exist; no denial/restriction family | **D724, Wave B** |
| Piece mobility/restriction | legal and safe mobility, trapped/restricted piece, escape squares, newly opened/closed routes | pseudo reach and piece escape atoms exist; semantic family absent | Phase 2 trapped + **D726** |
| Coordination/lines | connected rooks, battery, open/semi-open/contested file control, diagonal control, piece support network | open files and raw rays exist; coordination absent | **D726, Wave B** |
| Piece placement | development, rook seventh, outpost, bishop pair, bishop/color-complex relation, queen exposure | development count lossy; rook seventh absent; outpost/bishop shade narrow | Wave A + **D726/D727** |
| Pawn topology | isolated, doubled, backward, passed, islands, connected pawns, chains/base, IQP/hanging pawns | first four ship; connectivity absent | Phase 2 Wave A |
| Pawn dynamics | tension/contact, lever/break, locked chain, majority/minority, candidate passer, blockade, pawn storm/shelter change | `pawn_break` is broad irreversibility; rest absent | **D725, Wave B** |
| Space/centre | central/kingside/queenside controlled safe squares, centre occupancy, space differential | absent; one weak probe | Phase 2 `space@1` + D724 |
| King state | castling rights/loss/legality, shelter pawns, pawnless/open flank, king-zone attackers/defenders, escape squares, back rank | castled event; rights absent; king-zone count/no composite | Phase 2 + **D727** |
| Immediate tactics | meaningful fork, functional pin, skewer, X-ray, discovered attack/check, double check, hanging piece | geometry/ray probes only | Phase 2 Wave A, SEE first |
| Defender manipulation | capture/removal of defender, overload, deflection, attraction/decoy, interference, clearance | duties/counts exist; no consequence joins | Wave B; use Lichess lines as disagreement fixtures |
| Move-order tactics | zwischenzug, quiet threat, forcing reply, clearance then attack | absent | Wave B, bounded sequence/search |
| Exchanges | capture, recapture/trade, queens-off, simplification, exchange sacrifice/material recovery | queens-off only; capture identity lossy | Phase 2 + engine/search for value |
| Promotion/endgame | passed/protected/connected passers, promotion pressure/race, opposition, technique/tablebase result | passed/opposition/Syzygy; pressure absent | Phase 2 derived join; tablebase for outcome |
| Threats/prophylaxis | immediate material/mate threat, created-by-last-move, refuted threat, 2–3 ply target under policy | absent beyond raw attack deltas | Phase 2 `threat@1`; deeper query Wave B |
| Engine consequence | eval/WDL delta, mate distance, PV, candidate spread/sharpness, only-move robustness | engine data broad; candidate spread and semantic joins absent | join; Analyze/Review policy |
| Human evidence | Maia policy/WDL, explorer frequency/results, rating/time population, common reply/error | policy/frequency ship; Maia WDL lossy | Phase 2 repair + F5/F8 |
| Theory identity | opening/transposition, named structure/motif/plan, cited source span, timing window | opening sourcing-only; shapes/claims authored | Phase 2 runtime identity + O5/F7 |
| Multi-edge persistence | pressure retained after retreat, repeated attack, forced relocation, plan continuation, capture→recapture | run records exist; no general sequence events | **D728, Wave B** |

This map is deliberately broader than competitor annotation lists. Chess.com's visible review
labels do not define the product's evidence ontology; Tabiya needs atoms that also power drills,
touch explanations, theory links, bots and habits. Conversely, a human-concept inventory does not
make every concept learner-relevant. Module eligibility and selection still decide what appears.
`[M]`

---

## 4. Worked fixture: pawn harassment while pressure survives

Use this legal sequence as a mandatory positive fixture:

`1. d4 d5 2. Nf3 Nf6 3. e3 Bg4 4. h3 Bh5`

Before `h3`, Black's bishop on g4, White's knight on f3 and queen on d1 are collinear after the
e-pawn has left e2. The relation is a **relative queen-line constraint**, not an absolute king pin.
`h3` moves a pawn from h2 to h3 and newly controls g4, attacking the bishop. `...Bh5` retreats the
bishop and the h5–g4–f3–e2–d1 diagonal retains the same ordered bishop→knight→queen relation.
These are rules-derived facts. `[V]` (`tools/d723-breadth-harness/breadth.test.ts`; the positive
fixture and broken-ray, changed-target, two-blocker, no-target and capture-screen negatives pass)

The event packet should be able to say, deterministically:

- `relative_line_constraint(state)`: slider b:g4 → screen N:f3 → target Q:d1;
- `square_control(gained)`: pawn h3 newly controls g4;
- `minor_harassed(gained)`: the pawn attacks the bishop occupying g4;
- `relocation(realized)`: bishop g4→h5 on the next committed edge;
- `relative_line_constraint(preserved_after_relocation)`: b:h5 → N:f3 → Q:d1.

It must **not** automatically say:

- “White gained a tempo”—Black retained the pressure, and whether the pawn move improved White's
  position requires a comparison or cited theory;
- “White played prophylactically”—that attributes purpose and requires a named threat plus
  counterfactual;
- “Black was forced to retreat”—captures, exchanges or alternative bishop squares must be checked;
- “h3 was good” or “Bh5 was best”—engine/theory evidence is separate.

Required hard negatives:

1. a pawn attacks a bishop but no valuable target lies behind the screened piece;
2. the bishop retreats and the ordered ray breaks;
3. the geometry remains but the queen has moved, so the target identity changed;
4. the bishop captures the screen instead of retreating;
5. two blockers exist on the ray;
6. a preserved ray exists but the screened piece can legally move without material consequence.

This fixture demonstrates why `vacationReading()` alone is insufficient. It computes newly opened
slider squares when a blocker moves; this example concerns **pressure retained after the attacker
moves**, so it needs identity-preserving ray state across two edges. `[V]`
(`packages/runtime/src/structure.ts`; Phase-2 §3.14)

### 4.1 First breadth-probe result

The disposable D723 instrument ran eleven one-edge probes over 754 authored spine transitions and
579 decisions from the
sealed CC0 human-game sample. Every played move was compared with all distinct legal-result
alternatives from the same position. `[V]` (`tools/d723-breadth-harness/README.md`, `output.md`)

| Exact fact or disclosed convention | Authored lift | Imported lift | Decision |
|---|---:|---:|---|
| pawn newly attacks an occupied enemy minor square | 3.63× | 3.18× | strong Wave-A candidate with exact operands |
| opponent minor pseudo-mobility decreases | 1.51× | 2.01× | retain as topology; never call it restriction without the convention id |
| attacked-square-filtered minor mobility decreases | 1.15× | 1.47× | useful operand, but too broad to surface alone |
| attacked enemy-king-neighbour squares increase | 1.56× | 1.53× | stable topology; “king attack” still needs composition |
| moved rook/queen newly occupies an open/half-open file | 1.47× | 1.24× | exact placement candidate; no automatic praise |
| pawn-to-enemy-pawn contact count increases | 1.03× | 1.19× | atom only; generic presentation would be noise |
| lower-value screen on slider→rook/queen ray appears | 0.74× | 1.33× | retain exact relation; select contextually or use signed avoidance |
| opposing defence edge disappears | 2.66× | 3.36× | retain both piece identities; tactical naming still needs consequence |
| directly locked opposing pawn pair appears | 3.89× | 2.08× | strong topology candidate; no automatic claim about a closed centre |
| unobstructed same-color slider alignment appears | 0.82× | 0.99× | operand only; “battery” requires a target/theory join |
| `king-shelter-probe@1` pawn count decreases | 1.13× | 0.72× | convention operand; imported negative direction requires signed/contextual use |

The population disagreement is itself a hard warning against one global “interestingness” rank.
Authored packs are purpose-selected and human games are ordinary play; module, phase and source
population must remain inputs to selection. A low lift does not invalidate an exact detector—the
owner has explicitly admitted signed avoidance post-commit/review—but it does forbid treating the
positive event as inherently helpful. `[V]` (D745; D723 output)

The sequence arm inspected 692 consecutive authored branch pairs and 6,883 pairs across the
sealed imported games. Pawn harassment appeared in 25/276 pairs; the attacked minor immediately
relocated in 19/180; the same lower-value-screen→rook/queen line constraint survived in only 3/6.
The harness records concrete pack/game ids for every preserved example. `[V]` (D723 output)

That rarity is not a defect. It means the owner's `...Bg4 h3 ...Bh5` pattern is a high-specificity
multi-edge fact suited to a selected Review moment, theory link, habit observation or bot feature.
It is not a generic hint to emit after every pawn attack. The 174 imported relocations that did
not preserve the relation are the natural disagreement set for the later sequence collector.

### 4.2 Second Wave-B probe

The D754 follow-up tested nine more events on the same two populations with paired bootstrap
intervals. `[V]` (`wave-b-breadth-probe.md`; `tools/d754-wave-b-harness/output.md`)

- Defender loss joined to positive legal exchange on the retained target is stable and selective:
  **4.50× authored / 6.52× imported**, with illegal hypothetical pass states excluded from
  each probe's denominator rather than counted as negative examples.
- Increased material-role asymmetry is also stable: **2.47× / 4.35×**. The broader
  material-signature change is higher but generic, proving high lift alone does not buy a hint.
- Future-square pawn contest is background (**0.96× / 0.95×**); connected rooks are near 1;
  majority advances are below 1; blockades and target-bearing slider coordination reverse across
  populations; the tested king-exposure conjunction has zero authored played positives.

This narrows the remaining frontier. Exact operands for those low/unstable events are still useful
for hover, theory, bots and opportunity-normalized habits, but the only new globally stable
Wave-B event candidates from this pass are defender exposure and valence-free material-role
asymmetry. Legal per-piece mobility, pawn lever/passer conversion, decomposed king state,
forcing-reply/search semantics and identity-preserving three-edge sequences remain open.

### 4.3 Legal destination versus locally safe destination

D771 tested the owner's “pawn prevents a bishop or knight from taking the spot” example at a
stricter level. `[V]` (`legal-square-denial.md`; `tools/d771-legal-denial-harness/output.md`)

A pawn attack does not make a non-king move illegal. The exact tested event retains the named minor
and destination, requires the move to remain legal before and after, then records that the square
changes from locally non-losing to a positive `legal-exchange@1` capture specifically by the moved
pawn. It measures **1.00× authored / 1.02× imported**, with both intervals spanning 1. The safety
join is sound and useful for touch/hover, theory joins, bot features and opportunity-normalized
habits; it earns no default hint and cannot be worded as intention, force or prevention.

This also keeps two apparently similar examples separate: attacking a minor already occupying its
square is selective at 3.63×/3.18×, while changing a future empty destination's local safety is
background. The next semantic step is multi-edge/counterfactual evidence, not a stronger adjective.

### 4.4 Three-edge identity retention

D772 follows defender and target identities through a move, reply and next move. `[V]`
(`identity-retaining-three-edge-consequences.md`; `tools/d772-three-edge-harness/output.md`)

The sealed imported paths contain 29/6,775 windows where a defender edge disappears first and the
same target is positively captured third; 26 literally capture that defender first. A separate 13
newly expose the defender to a positive local capture, observe it relocate and lose the edge, then
capture the retained target. The authored corpus contains 0/622 examples.

These exact sequences are suitable Review/drill/module operands. They do not establish that the
reply was forced or that the first move was removal, deflection or overload. That requires reply
enumeration and distinct counterfactuals. The zero authored count also means permanent work needs
canonical fixtures before pack authors can safely adopt the vocabulary.

### 4.5 Pawn conversion, separated from generic contact

D774 measures identity-retaining passer transitions and adds full imported paths in three disclosed
ply bands to prevent the endgame-heavy authored corpus from supplying a global prior. `[V]`
(`pawn-conversion-events.md`; `tools/d774-pawn-conversion-harness/output.md`)

- A moved pawn becoming passed is robust at **12.46× / 13.45× / 7.72×** over plies
  1–20 / 21–40 / 41+.
- A capture creating that moved passer is sharper: **21.18× / 14.45× / 11.58×**.
- Advancing an existing passer is background in the middle band (**1.03×**) and distinctive only
  late (**3.17×**). Its **18.81×** authored lift is pack-composition evidence, not a universal rank.
- Protected and connected passer gains become stable later (~2.7×) but are sparse/uncertain earlier.

The first two events earn exact foundation identities. The latter three require phase-aware module
eligibility. None supplies “dangerous,” “winning,” “good plan” or conversion success without theory,
search, tablebase or authored consequence.

### 4.6 King state decomposes; the strongest headlines are joins

D778 measures eleven shelter, escape, zone and check transitions over the same populations and full
imported horizon bands. `[V]` (`decomposed-king-state.md`;
`tools/d778-king-state-harness/output.md`)

- Broad king-zone defender loss is 6.07×/5.12×/3.94×, but excluding captures reverses it to
  0.00×/0.07×/0.38×. The useful identity is capture + the captured piece's prior zone-defender role.
- King relocation to more shelter is chiefly castling: the castling subset is
  10.08×/8.19×/5.31× while non-castling relocation is 0.32×/0.87×/1.57×. Shelter is an operand of
  the existing castling event, not a duplicate semantic event.
- Opponent escape reduction, direct slider check and increased zone attackers are background or
  uncertain early, then stable in middle/later bands. They require phase-aware eligibility.
- Shelter loss and mover escape gain are weak/mixed. They remain on-demand state, not default hints.

The failed king-exposure conjunction stays failed. Decomposition identifies useful operands and
their joins; it does not license “king unsafe,” “attack,” “exposed” or “mating net.”

---

## 5. From evidence to player habits—not invented personalities

### 5.1 Three products, three proof burdens

| Product output | Minimum evidence | What present research permits |
|---|---|---|
| Per-game observation | one exact/versioned event with source node | broad; suitable for Review and drill links |
| Habit card | repeated eligible opportunities, played choice, population baseline, sample floor, interval and window | twelve current metrics in the measured blitz cohort; new metrics require the same gate |
| Player type/personality | stable multidimensional mapping, reproducible clusters or an explicitly playful authored mapping, uncertainty, privacy and no diagnostic/advice implication | **not validated**; current clustering fails |

Published behavioral stylometry establishes that player identity survives beyond memorized
openings: with opening moves removed, McIlroy-Young et al. report 86% top-1 identification among
2,844 candidates from 100 reference/query games, and the model remains strong inside narrow rating
bands. This proves rich individual signature, not an interpretable set of “aggressive/positional”
axes. `[V]` [paper §§4.2–4.4](https://arxiv.org/abs/2208.01366).

Tang et al. learn generative style vectors and compare them using human-coded Stockfish heuristics
such as king danger, bishop-pair use, material imbalance, mobility, threats and passed pawns over a
fixed position set. This is evidence for a future **latent-model inspector or bot steering
experiment**, not authority to display those dimensions from ordinary game counts. `[V]`
[paper §§4–5](https://arxiv.org/pdf/2502.14998).

Maia models human move probability rather than optimality, and personalized Maia work improves
individual move prediction and performs stylometry. It can provide a behavioral prior or latent
signature; it still cannot explain a person's intention or assign a chess personality by itself.
`[V]` [Maia paper](https://arxiv.org/abs/2006.01855),
[personalized behavior paper](https://arxiv.org/abs/2008.10086).

### 5.2 Candidate continuous axes after the collector waves

These are **research candidates**, not 1.0 labels. Every choice-shaped row uses the existing
opportunity residual: `played_event - legal_alternative_share(event)` at each eligible decision.
`[M]`

| Axis family | Candidate literal metrics | Required collectors |
|---|---|---|
| Repertoire | opening surprisal, family entropy, transposition depth, early deviation rate | runtime opening identity + explorer |
| Configurations | fianchetto, bishop pair, IQP/hanging pawns, opposite-side castling, locked/open centre | topology/theory identity |
| Space/restriction | space-gain residual, square-denial residual, restriction/safe-mobility change | D724/D726 + `space@1` |
| Pawn play | pawn-choice residual, lever/break choice, minority/majority play, structure-preservation rate | D725 |
| Piece activity | development timing, rook-file/seventh use, bishop-pair retention, piece-route recurrence | D726/D727 + development |
| Tension/exchange | capture/trade residual, queen-trade choice, recapture patterns, accepted material imbalance | capture/SEE/imbalance |
| King decisions | castling side/delay, rights forfeiture, shelter investment, king-zone risk exposure | castling + D727 |
| Tactical opportunities | fork/loose/pin/threat opportunities created, converted, allowed and avoided by motif | SEE-backed tactical events |
| Initiative | forcing-choice residual, newly created threat rate, forced-reply breadth | threats + bounded reply set |
| Defence/recovery | named threat neutralized, loose-piece repair, escape creation, eval/WDL recovery after error | threats/loose/king escape + engine |
| Endgame transition | queen/rook trade into endgame, passer creation, technique entry and conversion | trades/passers/Syzygy |
| Time use | phase clock allocation and spend conditional on engine/candidate sharpness | clock + engine spread |

The current R12 experiment already refused forcing-choice, non-pawn-capture,
opponent-reply-breadth and fianchetto-unblock as display metrics despite superficially strong or
interesting behavior. They remain useful per-game facts. This refusal must remain the template:
collector breadth does not imply profile breadth. `[V]` (`player-style-metrics.md` §§4–5)

### 5.3 Validation required before a new habit axis ships

1. Define the exact eligible opportunity; controls must include decisions where the learner could
   decline the event. The fianchetto-unblock instrument initially returned 586/586 because it
   admitted only knight moves, and was corrected before publication. `[V]` D603.
2. Measure prevalence and missingness separately by color, rating band, phase and time control.
3. Establish a per-metric minimum sample, not one product-wide threshold.
4. Pass random split-half **and** early-vs-late windows over at least eight weeks.
5. Test blitz↔rapid/classical transfer; if it fails, label the profile by time control.
6. Residualize/test against strength and opportunity mix; a “style” axis cannot merely restate
   rating or repertoire exposure.
7. Publish bootstrap intervals and evidence drill-down; abstain below the floor.
8. Treat the vector as identifying personal data: private by default, export/delete, explicit share.
9. Do not derive a weakness or training prescription without the separate grounded-coaching
   contract and exact source events.
10. Do not introduce named types until cluster/mapping stability passes its own gate. A playful
    authored persona quiz may exist, but it must say it is a quiz and stay separate from measured
    play.

---

## 6. Implications for bots, modules and authored packs

### Bots

The same versioned primitives can feature every candidate move: SEE risk, loose pieces, threats,
space, pawn structure, king safety, file control and repertoire identity. A persona is then a
declared policy over candidate evidence, not a new detector. This makes behavior reviewable:
Tabiya can state which registered feature caused a candidate to be admitted/downweighted without
claiming that a bot “understood” a plan. `[M]` (D669–D671; `bot-policy.md`)

Learned style vectors are a later alternative/augmentation. They may generate coherent individual
behavior, but their latent dimensions and strength can entangle; the interpretable policy stack is
still needed for product controls, reproducible tournaments and post-game explanations. `[M]`

### UX modules

Collector breadth must never recreate the raw dump. Modules ask narrow questions:

- touch/hover: exact legal/safe destinations, defenders, rays and one selected consequence;
- pre-commit support: one bounded risk or threat, according to the workflow ceiling;
- post-commit nudge: one signed functional event, optionally linked to theory;
- Review: a few whole-game moments selected after local eligibility;
- theory: exact matched opening/shape/motif with source and drill door;
- inspector: the full evidence graph, explicitly opt-in.

Unused evidence budget remains empty. A module with no significant eligible fact says nothing.
`[M]` (`evidence-presentation.md`; D717)

### Packs and content stability

Atomic and semantic collectors are added as new versioned identities. Existing pack expressions
remain valid; no pack is auto-rewritten to claim a new semantic meaning. Authors can adopt a new
primitive when it improves a pack, while generic modules and Review can use it immediately where
eligible. Redefining an existing predicate requires a new version plus the Gate-F impact/migration
report—especially `pawn_safe_square`, whose current semantics feed `outpost`. `[V]`
(`phase2-collector-audit.md` §6; D632)

This is the foundation-stability answer to the owner's concern: build broad reusable atoms first,
but do not wait for a mythical complete ontology before authoring forever. Versioning and
capability-based pack dependencies let the foundation grow without repeated global content edits.
`[M]`

---

## 7. Recommended sequence

1. Land Phase 1/2's ledger residues and this breadth correction.
2. Add **Phase 2b** before F5: formalize D724–D728 families, build only disposable probes, and
   measure prevalence/disagreement on the authored and sealed imported populations.
3. Draft one collector RFC with **SEE + exact/identity-retention Wave A**, additive schemas and
   hard negatives; do not bundle every Wave-B convention.
4. Draft F5 against both the existing F2 events and Wave-A projection ids. A missing Wave-B
   collector may make a module abstain; it must not make F5 invent prose.
5. Run Wave-B RFCs by shared downstream leverage: square/restriction and pawn dynamics first,
   then king/activity/imbalance, then multi-edge sequences.
6. Rule O9 only as continuous habit cards plus privacy/sample gates. Defer named natural types;
   allow bot personas as explicit policy configurations, not claims about human psychology.
7. Keep campaign blocked until the repaired modules/presets/layout survive owner use; the campaign
   should compose the trusted loop, not hide a weak one.

## 8. Limits

1. The eleven candidate probes are rules/convention arithmetic, not SEE/search validation.
   Pawn majority/blockade beyond the locked-pair atom, functional coordination/battery, material
   imbalance, defender manipulation beyond edge loss and multi-ply consequences still need their
   Phase-2b/2c treatment before the breadth arm closes.
2. McGrath et al.'s concepts are based partly on Stockfish 8 and research-defined features. They
   demonstrate breadth and candidate definitions, not current Stockfish API guarantees or learner
   relevance.
3. Lichess puzzle tags are automatic/vote-refined labels on engine-selected tactical lines; they
   are not a complete or independently human-adjudicated ontology.
4. The local R12 population is 36 highly active blitz accounts over 59 hours. Its retained metrics
   do not establish longitudinal or cross-time-control defaults.
5. Strategic notions such as “initiative,” “prophylaxis,” “good bishop,” “favorable imbalance” and
   “gained a tempo” remain composite claims. This taxonomy records the atoms needed to test them;
   it does not authorize the words.
