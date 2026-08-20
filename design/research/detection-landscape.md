# Detection landscape — atomic chess facts, semantic events, and the evidence planes they require

**Question (platform-alignment R1, owner 2026-08-20):** what can Tabiya honestly detect about a
position or move — pawn structures, outposts, forks, pins, discovered attacks, future threats,
castling rights, space, prophylaxis and plans — and which facts require board arithmetic, search,
human games, theory, or authorship?

**Verdict:** there must not be one monolithic “classifier.” The defensible foundation is a pool of
versioned **atomic facts** from six evidence planes. A separate, measured compiler may join those
facts into **semantic events** for a named consumer. The current runtime mixes exact literals,
house conventions and noisy census rows in one reading, then the UI exposes the union. That is why
the result feels both thin and loud. `[V]` (`classifier-coverage-and-noise.md`; A1
`planning/platform-alignment/capability-reality-audit.md`)

Four external-theme probes make the distinction concrete. Over 50,000 Lichess puzzle records, a
cheap geometry-only fork probe recalled 100.0% of records tagged `fork` but achieved only **32.3%
precision against the tag**; discovered attack was **19.7%**, hanging piece **7.9%**, and absolute
pin **39.0%**. Cheap discovered-attack geometry also fired on **20.48% of legal alternatives** to a
tagged solution move. These are not “slightly noisy labels.” They answer a broader question than
the pedagogical motif. `[V]` (`tools/detection-landscape-harness/output.md`)

The result does **not** make Lichess a perfect oracle. Its 6,057,356-puzzle export is generated from
analysed games, automatically tagged, and then refined by player votes; it is not a manually
adjudicated motif corpus. Its open-source tagger itself returns `False` unconditionally for
`overloading`. The export is a large external disagreement set, not ground truth. `[V]`
([Lichess open database](https://database.lichess.org/#puzzles),
[Lichess tagger](https://github.com/ornicar/lichess-puzzler/blob/master/tagger/cook.py))

The product consequence is strict: **show the atomic fact when it is useful; name a tactic, plan,
or quality only when the additional operands and evidence needed by that semantic claim are
present. Otherwise abstain.** An LLM may render the selected packet but cannot supply the missing
join.

---

## 1. Method and population

### 1.1 Current implementation inventory

The code audit was run at committed `2d2396e`, excluding the unrelated uncommitted
feedback-delivery work. It read every emitter in `packages/runtime/src/{structure,transition,
pivotal,phase,endgame,shape-firing}.ts`, the engine/corpus/theory producers, the schema enums, and
the current web consumers. `[V]`

This pass composes, rather than repeats, four earlier measurements:

- `classifier-coverage-and-noise.md`: 50 packs, 754 spine transitions, 643 positions and 19,636
  legal alternatives; per-kind volume, lift and consumer trace. `[V]`
- `census-hint-false-positives.md`: 89.0% observation-level false-positive rate under its declared
  relevance gate; selectivity did not predict usefulness (Spearman ρ = −0.143). `[V]`
- `conjunction-hypothesis.md`: primitive conjunctions did not repair precision; no measurable pair
  beat both components. `[V]`
- `move-primitive-computability.md`: 9 of 10 transition candidates were mechanical at 29.06 µs per
  ply over 593 transitions; only “tempo as forcing” required an opponent model. `[V]`

### 1.2 External disagreement instrument

`tools/detection-landscape-harness/` replays the first 50,000 complete records in a bounded
12 MiB compressed prefix of the official Lichess CC0 puzzle export, retrieved 2026-08-20. It tests
four deliberately cheap candidates over the entire solution line, measures legal-alternative
co-signalling at the first solution move, records hard-negative IDs, and verifies file-mirror
invariance over 250 records. The source digests and reproduction command are in the harness
README. `[V]`

Lichess documents the CSV semantics: the FEN precedes an opponent setup move, the second UCI move
starts the solution, and solution moves are intended to be “only moves” apart from the mate-in-one
exception. The export is CC0. `[V]`
([format and generation](https://database.lichess.org/#puzzles))

The 50,000 rows are a bounded prefix, not a declared random sample. The comparison is against
automatically generated and vote-refined tags. Therefore the report treats disagreement as a
reason not to promote a cheap definition, never as an estimate of human motif judgement. `[V]`

### 1.3 What “exact” means here

An **exact fact** is reproducible from declared inputs and a published rule: for example, “the FEN
contains no White castling right” or “after `Ne5`, the knight pseudo-attacks c6 and f7.” Exactness
does not imply relevance. A **convention** is also reproducible but depends on a disclosed boundary:
for example, Tabiya's definition of an outpost or opening/middlegame phase. A **model/corpus fact**
is a measured output with a named population/model/version. A **theory/authored fact** is a cited
statement with a source span or author identity. `[M]`

“Good move,” “meaningful fork,” “prevents castling,” “kingside space,” and “prophylaxis” are not
made exact merely by implementing deterministic code. Each phrase asserts more than a board
literal and must name its convention or additional evidence. `[M]`

---

## 2. The six evidence planes

| Plane | What it can establish | What it cannot establish by itself | Runtime cost / freshness | Current Tabiya state |
|---|---|---|---|---|
| **Rules / board** | Occupancy, legal moves, checks, pseudo/legal attacks, material, pawn files, castling flags, immediate rays and deltas | Importance, best play, human typicality, plan or teaching value | local, deterministic, usually microseconds | broad but semantically mixed |
| **Transition / bounded consequence** | What one move gained/lost/revealed; exact shallow counterfactuals if all legal replies are enumerated | A 2–3 move threat under good defence unless the search boundary is declared | local; cost grows with legal alternatives/depth | raw count deltas ship; semantic events mostly absent |
| **Search / engine / tablebase** | Eval/WDL change, forced mate, PV, ≤7-piece perfect outcome, bounded tactical consequence | Human likelihood, theory name, causal prose; NNUE inputs are not a semantic-label API | bounded by nodes/depth; tablebase exact in domain | Stockfish/Syzygy exist; semantic extraction absent |
| **Human corpus / behaviour model** | Frequency, result distribution, rating/time population, Maia move probability | Objective goodness, why a move works, individual intent | network/build-time or model inference; population/version sensitive | explorer and Maia exist |
| **Theory catalogue** | Opening/structure/motif names and cited general plans, keyed by EPD/ECO/shape/transposition | That a general plan is best now; uncited “chess truth” | immutable local bundle preferred; rebuild when sources change | opening identity is collected then refused; no theory bundle |
| **Authored drill truth** | Learning objective, intended timing, counter-case, explanation and permitted claim boundary | Automatic coverage off the authored path | zero inference cost; expensive human creation/review | rich pack vocabulary, all product packs still drafts |

Stockfish 18's NNUE architecture now includes `FullThreats` input features, but those inputs feed a
neural evaluation. UCI exposes search/evaluation results, not a stable semantic tactic or plan
label. Treating an internal threat feature as “Stockfish says this is a fork” would be an invented
API contract. `[V]`
([Stockfish NNUE architecture](https://github.com/official-stockfish/Stockfish/blob/master/src/nnue/nnue_architecture.h),
[Stockfish](https://github.com/official-stockfish/Stockfish))

Maia is the complementary human plane: its public models predict moves associated with rating
bands and are intended to run at one node; its maintainers explicitly note the models choose the
same move without an opening book and that the bots use developing books. It gives human-policy
mass, not strategic explanation. `[V]`
([Maia repository](https://github.com/CSSLab/maia-chess))

Opening identity is a theory-catalogue lookup, not a learned classifier. Lichess's CC0 opening
catalogue publishes ECO, name, UCI and EPD and recommends walking a game backwards until a named
position is found so transpositions work. `[V]`
([Lichess chess openings](https://github.com/lichess-org/chess-openings))

---

## 3. Current detector semantics: what the names really mean

### 3.1 Structural reading

The shipped reading declares 18 kinds, emits 17, and emits a median **80 observations per
position**. These are not one confidence level. `[V]` (`classifier-coverage-and-noise.md` §3)

| Class | Current kinds | Honest interpretation | Finding |
|---|---|---|---|
| **Exact literal** | `isolated_pawn`, `doubled_pawn`, `passed_pawn`, `open_file`, `half_open_file`, `piece_count`, `bishop_on_shade`, `king_zone`, `line_blockers` | True under the exact operands emitted; says nothing about importance | keep as atoms; select before rendering |
| **Declared convention** | `backward_pawn`, `outpost`, `named_structure`, `king_opposition` | Tabiya's deterministic definition, not a universal chess ontology | version and disclose the convention |
| **Pseudo-geometry** | `direct_attack_count`, `piece_reach_count`, `piece_distance` | Attack rays or empty-board distance; pinned pieces and blockers/legal sequences can make “can reach” misleading | rename/narrow; never render as a future threat |
| **Misleading projection** | `pawn_safe_square` | `safe` is derived from `pushAttackers.length === 0`; `captureAttackers` is recorded but does not affect the boolean, and blockers/legal pawn paths are not evaluated | not eligible for a “safe square” learner claim |
| **Cannot emit** | `pawn_count` | matcher exists, but `structuralReading()` never pushes it | D548 remains a defect |

The `pawn_safe_square` issue is not merely presentation. `pawnSafetyOnPosition()` calculates both
`pushAttackers` and `captureAttackers`, sets `safe` from the first collection alone, and does not
test intervening occupancy or legal pawn sequences. The emitted fact can honestly say “no enemy
pawn reaches the modeled adjacent-file stand square under the current-file projection”; it cannot
say “this square is safe.” `[V]` (`packages/runtime/src/structure.ts:136-166,347,468`)

`piece_reach_count` is immediate pseudo-attack geometry. The owner's “what can this knight or
bishop threaten in 2–3 moves?” is a different producer: a bounded search/tree query with a target,
opponent policy, horizon, path and abstention rule. `[V]` (`structure.ts:383-386`)

### 3.2 Transition reading

The six transition kinds are mostly exact **counts** of changed occupied targets, slider lines,
king escapes and defence duties. Their own provenance says significance is not evaluated. This is
the correct low-level posture, but the learner surface currently flattens those counts into the
same reading as named structures. `[V]` (`packages/runtime/src/transition.ts:337-365`)

The event stream also loses useful identity. A semantic event needs the mover, affected piece,
target squares, before/after relation, sign and counterfactual population. A count such as “two
defended squares changed” cannot ground “you overloaded the defender.” `[M]`

`vacationReading()` already computes the exact atom behind the owner's fianchetto example: remove
a named piece and list each slider and newly opened square. It has no learner consumer and does not
say that moving the blocker is good, legal to the intended square, or tactically sound. `[V]`
(`packages/runtime/src/structure.ts:512-527`; D546)

### 3.3 Phase and endgame labels

`classifyPhase()` is a four-band material/home-square convention, not recognition of an opening or
strategic phase. It can return `unclear`, which is good abstention; its raw `undevelopedMinors`
operands are computed and then discarded from learner-facing use. `endgameReading()` classifies a
small material catalogue and offers Lucena/Philidor/Vancura names for the entire material family,
not confirmation that the exact technique position is on the board. `[V]`
(`packages/runtime/src/phase.ts`; `packages/runtime/src/endgame.ts`)

---

## 4. Candidate landscape and admission decisions

The `grounding` column names the minimum plane needed for the **semantic phrase**, not merely the
cheapest geometry that can be computed. “Cost” is a class: `O(board)` is one board scan; `O(moves)`
enumerates legal moves; `search(h)` is horizon- and branching-dependent; corpus/theory should be a
local indexed lookup in ordinary runtime. `[M]`

### 4.1 Position and one-move facts

| Candidate | Sign and operands | Minimum grounding / exactness | Abstain when | Cost | Named consumer or refusal |
|---|---|---|---|---|---|
| Occupancy, material, legal moves, check/mate | state; pieces/squares/side | rules; exact | invalid position | O(board/moves) | inspector, board overlays, review anchors |
| Pseudo-attack vs legal attack | state; attacker, target, blockers, pin state | rules; exact if relation is named | consumer asks “threat” without horizon | O(board) | touch/hover; evidence packet atom |
| Newly attacked/defended/undefended | gained/lost/preserved/avoided; subject/object/squares | transition; exact relation | significance or tactical outcome is requested | O(board) | post-move explanation, compare |
| Opened/closed slider ray | gained/lost; blocker, slider, new squares/targets | transition; exact | no affected target and consumer requires relevance | O(board) | discovered-line highlight; fianchetto latent pattern |
| Absolute pin | state/gained/lost; king, pinned piece, slider, ray | rules/legal geometry; exact | phrase is only “pin” and functional consequence is absent | O(board) | board overlay; input to semantic pin |
| Fork geometry | gained/lost; moved piece and attacked pieces | rules; exact as simultaneous attacks | fewer than two eligible targets or no published value rule | O(board) | atom only; do not label a tactic yet |
| Pawn counts/files/islands | state/gained/lost; pawns and files | rules; exact | none; value claim requested | O(board) | structure panel, style metrics |
| Isolated/doubled/passed/open/half-open | state/gained/lost; pawns/files | rules; exact under published definitions | definition operands unavailable | O(board) | structure breadcrumb, theory key |
| Backward pawn | state/gained/lost; pawn, stop square, supports | convention | definition version absent or legal/path claim requested | O(board) | theory key; never bare “weakness” |
| Outpost/hole/pawn-safe | state; square, occupant/support, enemy pawn routes | convention plus exact operands | only the current `pawn_safe_square.safe` projection exists | O(board), or O(moves) for legal routes | theory key / touch highlight after replacement definition |
| Open/central/kingside space | state/gained/lost; region and controlled/occupied squares | published region/control convention | region or control definition not named | O(board) | style metric, theory breadcrumb; not advice |
| Development | state/gained/lost; home pieces/squares, move count | published home-square convention | “developed well/poorly” requested | O(board/history) | review aggregate; phase input |
| Rook on seventh / bishop shade | state/gained/lost; piece/square | geometry exact; value is not | consumer asks “good rook/bad bishop” without cited rule | O(board) | theory lookup key; atom in review |
| Castling rights / castled | state/gained/lost; side, king/rook move or capture | rules/transition; exact | reason is ambiguous; current imported-castling bug D547 | O(1) | review event, board warning |
| Trade/material imbalance | event/state; captured roles and before/after counts | rules; exact | consumer asks whether the trade was good | O(board) | review atom; engine/corpus join for value |
| Promotion distance | state; pawn, route, side to move | geometry exact only as distance | blockers, checks or opponent race matter | O(board) | endgame inspector |
| Opening identity | state/path; EPD/ECO/name/matched ply | theory catalogue; exact match, catalogue version | no catalogue match | indexed lookup | theory breadcrumb, review, profile |
| Static configuration (fianchetto, battery, shape) | state; matched pieces/squares and expression id | authored/theory catalogue plus exact trigger | trigger does not fire or source is ungrounded | indexed expressions | theory/drill link, style event |

### 4.2 Semantic tactics and strategic claims

| Candidate phrase | Required join | Exactness/confidence | Abstention rule | Cost | Consumer or refusal |
|---|---|---|---|---|---|
| “You created a fork” | fork atom + eligible-target/value rule + moved-piece safety + consequence window | convention over exact atoms; externally validate | geometry only, tactic existed before, or no material/forcing consequence | O(board) to shallow search | post-move module, Review Map |
| “This pin matters” | pin atom + prevented legal attack/escape or winning consequence | exact functional relation or bounded-search claim | absolute ray exists but changes no eligible action/outcome | O(moves) / search | board module; theory link |
| Skewer / X-ray | ordered ray victims + forced displacement/capture consequence | convention/search | only collinearity exists | O(board) / shallow search | post-move/review |
| Discovered attack/check | opened-ray atom + affected enemy target/check + mover identity | immediate relation exact; tactical value separate | ray opens onto no eligible target or line requires unsearched continuation | O(board) | hover squares, post-move |
| Hanging/loose piece | attacked/defended/legal-capture atoms + exchange/value rule + optional reply window | convention or shallow-search result | “undefended” alone, pinned attacker, poisoned capture, or unclear exchange | O(board) / shallow search | pre-commit risk, review |
| Removal/capture of defender | defender duty before + legal capture/deflection + newly vulnerable target + consequence | exact shallow relation or search | affected target cannot be named | O(board/moves) | dynamic hint, review |
| Deflection / attraction / interference / clearance | before/after duties/rays + forced or realised consequence | line-level semantic convention | only geometry changed; intent/force unproved | shallow search/authored line | authored drill and post-move only |
| Overload | one defender with multiple duties + move/reply that makes both unsustainable | search or authored consequence | duties counted but no failure line | shallow search/authored | refuse until external positives exist |
| Pawn break / “strike at the centre” | pawn contact/capture atom + named region/structure + cited plan or authored objective | event exact; plan phrase theory/authored | move is by another piece, centre convention absent, or plan source absent | O(board)+lookup | theory breadcrumb, authored hint |
| “Prevents castling” | before right + counterfactual line preserving it + move-caused loss/forced king-rook action | counterfactual/search; not equivalent to “right lost” | right was already lost, voluntarily castled, or causal line absent | O(moves)/search | review only |
| Prophylaxis | named opponent threat under declared policy + move reduces/refutes it without another stronger causal explanation | search + opponent model, often authored/theory | threat, policy, horizon or causal comparison absent | search(h) | guided drill; never raw classifier prose |
| “Can threaten X in 2–3 moves” | target + horizon + legal move tree + opponent policy + paths and success predicate | bounded-search/model fact | no target/policy, branches exceed budget, or result is unstable | search(h) | hover preview only with disclosed horizon |
| Promotion race / fortress / technique | tablebase in ≤7 pieces, otherwise search + theory/author | exact in tablebase domain; model outside | outside supported domain or rule unstable | tablebase/search | endgame module/drill |
| Blunder/mistake/good move | before/after engine WDL/eval + published thresholds + best-line comparison | convention over engine measurement | search unstable, threshold/model missing, or direct-help policy forbids | engine search | post-game review, optional guard preset |
| “Human players choose…” | explorer counts or Maia distribution + rating/speed/time/model population | probabilistic, population-specific | sample/model mass floor not met | lookup/model | opponent choice, evidence row, profile |
| Named plan / “why” | exact structure/event key + cited theory span or authored claim | source-backed general claim, not position-optimality | no citation/span, transposition mismatch, or source conflicts | local retrieval | theory breadcrumb, deterministic/LLM renderer |
| Teaching priority/timing | authored objective, timing window and counter-case | authored | outside authored boundary | lookup | drill guidance only |

This table is the answer to “could we detect a knight's squares in 2–3 moves?”: yes, but not as an
extension of `piece_reach_count`. It is a search query whose target, opponent model, horizon and
success condition are part of the evidence. Without those fields, “can threaten” is a vague plan
claim and must abstain. `[M]`

---

## 5. External theme comparison

### 5.1 Results

| Cheap detector | Tagged positives | Recall vs tag | Precision vs tag | Predicted on all puzzles | Fires on legal alternatives to tagged first solution move |
|---|---:|---:|---:|---:|---:|
| fork geometry | 6,393 | 100.0% | 32.3% | 39.61% | 8.08% (15,742 / 194,726) |
| new absolute pin | 3,043 | 41.4% | 39.0% | 6.46% | 2.37% (2,458 / 103,894) |
| opened slider attack | 2,575 | 99.4% | 19.7% | 25.93% | 20.48% (17,184 / 83,910) |
| capture of attacked, undefended non-pawn | 1,833 | 99.9% | 7.9% | 46.63% | 0.88% (438 / 49,981) |

`[V]` `tools/detection-landscape-harness/output.md`. All four detectors passed a file-mirror
invariance check on 250 records. The output records the first five disagreement IDs per kind for
reproduction.

### 5.2 Why the broad probes overcall

The official Lichess tagger demonstrates the missing joins. Its fork detector rejects a moved
king and a moved piece in a “bad spot,” then counts non-pawn targets only when they are more
valuable than the attacker or hanging under further conditions. Its hanging-piece detector is
tied to a capture and checks the resulting material sequence. Its pin detectors ask what attack or
escape the pin prevents. Discovered attack is recognized over the solution sequence, not by “a ray
opened” alone. `[V]`
([tagger source](https://github.com/ornicar/lichess-puzzler/blob/master/tagger/cook.py),
[tagger tests](https://github.com/ornicar/lichess-puzzler/blob/master/tagger/test.py))

Those rules are still conventions, and their implementation has explicit gaps: `overloading()` is
unimplemented, while the test file contains commented-out overload and clearance cases. This is
why the Lichess corpus is useful for disagreement and regression without becoming Tabiya's
ontology. `[V]` (same sources)

The current D542 candidate results now have a precise interpretation. `fork_created` at 0.72× and
`hanging_piece_created` at 0.26× measured broad atoms, not validated tactic events. Their negative
sign remains valuable — avoided-risk statements may be stronger — but only after the atom's name
is narrowed and its eligibility population is correct. `[V]` (`classifier-coverage-and-noise.md`
§6d; D545)

---

## 6. The minimum evidence record

Every emitted item eligible for a learner-facing module needs these fields, regardless of which
plane produced it. This is a research-derived requirement for a later RFC, not a schema change.
`[M]`

| Field | Why it is required |
|---|---|
| `kind` + semantic version | definitions such as “outpost” and “hanging” can change without corrupting old attempts |
| anchor | run/branch/node, before FEN, move UCI, after FEN; prevents off-cursor recomputation |
| sign | `state`, `gained`, `lost`, `preserved`, `removed`, `avoided`, `enabled`, `threatened` |
| operands | mover, subject, object, affected pieces, squares/files/rays, horizon and side |
| basis | rules, convention id, engine/model/version, corpus population, source span, or author |
| exactness/confidence | exact, convention, bounded-search, probabilistic, source-backed or authored; never one generic score |
| counterfactual | eligible legal alternatives and denominator when the claim compares the played move |
| cost/freshness | local cost or source/model timestamp; lets a module refuse unavailable producers |
| abstention | machine-readable reason: no match, below sample floor, unstable search, outside domain, missing source |
| consumers | allowed modules/rungs and forbidden contexts; solves D546's missing producer→feature join |

A module consumes a **bounded packet**, not every fact. Examples: a touch overlay may use legal
destinations and exact attack/ray atoms; a pre-commit safety preset may use a selected avoided-risk
event; a post-move explanation may join the realised event to a citation; Review Map may select a
small number of signed moments; the inspector may expose the full provenance tree. The LLM sees
only the packet selected for that module and may neither add operands nor raise the disclosure
rung. `[M]`

---

## 7. Decisions permitted and refused

### Permitted by R1

1. **Replace “the classifier” with a six-plane producer model.** Atomic board facts, search,
   human behaviour, theory and authored truth have different confidence and failure modes. `[M]`
2. **Standardise exact atomic facts before semantic events.** Immediate attacks, rays, castling
   flags, pawn files, captures and signed deltas are reusable across guidance, review, bots,
   profiles and drills. `[M]`
3. **Treat tactic names as composite events.** Fork/pin/skewer/hanging/discovered labels require
   named eligibility and consequence rules plus external disagreement tests. `[V]`
4. **Reuse the Lichess tagger and puzzle corpus as AGPL/CC0 references and regression evidence, not
   as unquestioned truth.** Tabiya is AGPL-compatible with the tagger's licence; the exported
   puzzle data is CC0. `[V]`
   ([tagger licence](https://github.com/ornicar/lichess-puzzler/blob/master/LICENSE),
   [database licence](https://database.lichess.org/))
5. **Keep multi-ply threats out of the static structure vocabulary.** They become bounded queries
   with target, horizon, opponent policy, path and stability/abstention. `[M]`
6. **Make theory and authorship explicit producers.** A detected shape may retrieve a cited plan;
   it cannot manufacture one. `[M]`

### Refused by R1

1. Shipping any D542 candidate under its broad semantic name because it had favourable lift or
   cheap arithmetic. `[V]`
2. Using Stockfish NNUE “threat inputs” as semantic explanation output. `[V]`
3. Calling `piece_reach_count` a 2–3 move threat detector or `pawn_safe_square.safe` a legal safety
   guarantee. `[V]`
4. Treating Lichess tags as complete ground truth: overload has no working tagger and the corpus is
   automatically generated/vote-refined. `[V]`
5. Letting an LLM bridge an absent consequence rule, theory citation, counterfactual or author
   judgement. That remains law 8. `[M]`

---

## 8. Consequences for the remaining program

- **R2 (selection/significance)** now owns which exact/composite events clear a learner-facing
  budget, including avoided/removed/preserved sign and eligibility denominators. R1 deliberately
  does not choose top-*k* defaults. `[M]`
- **R3 (presentation)** receives module-shaped packets and abstention, never the raw structural
  reading. `[M]`
- **R4 (knowledge)** must retrieve cited theory keyed by opening/shape/motif/position and preserve
  the distinction between a general plan and position-specific advice. `[M]`
- **R5 (LLM renderer)** can be evaluated against a closed evidence packet; added pieces, squares,
  causes or moves are measurable violations. `[M]`
- **R6 / Gate F** must version detector semantics independently of pack schema and prove migration
  cost before content resumes. `[M]`
- **R11 bots** may share atomic events for policy steering, but evidence available to the bot is a
  separate fair-play/policy question; it cannot silently become omniscient. `[M]`
- **R12 profiles** may aggregate only versioned eligible events with declared denominators; a
  recurring configuration is evidence of a habit, not proof of a weakness. `[M]`

No product RFC is authorised by this dossier alone. R1 clears the detection-landscape prerequisite;
R2 still owns admission and significance, A2/R3 own interaction presentation, and the owner/design
decision queue must rule the resulting v1 boundary before an evidence-contract or semantic-detector
RFC is drafted.
