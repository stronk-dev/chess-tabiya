# Wave C — complete the basic semantic evidence foundation

**Opened:** 2026-08-22  
**Authority:** D717 and D872  
**State:** research program; no production implementation or content mutation is authorized  
**Inputs:** `design/research/detection-landscape.md`,
`design/research/middlegame-evidence-and-style-taxonomy.md`,
`design/research/identity-retaining-three-edge-consequences.md`,
`design/research/bounded-reply-semantics.md`,
`design/research/review-map-and-reentry.md`,
`design/research/player-analysis-and-skills.md`, and
`planning/platform-alignment/evidence-collector-readiness.md`.

## Verdict

Waves A and B are necessary but not the whole 1.0 classifier foundation. They establish reusable
pieces, squares, rays, duties, exchanges, reply sets, pawn relations, mobility, king operands and
observed short sequences. A credible chess product still needs the **basic semantic tactics** that
players expect: overload, defender removal/deflection, interference, clearance, zwischenzug,
meaningful discovered tactics, mating patterns and promotion threats.

These are basic product capabilities. Some need more rigorous proof than a fork or literal ray,
because cheap geometry produces false names. The extra proof depth does not make the capability
optional or post-1.0.

The closure rule is:

> A foundation capability is complete when its versioned producer, exact operands, proof horizon,
> abstention and consumer eligibility are explicit. The platform may refuse a concept it cannot
> establish; it may not silently replace it with geometry or LLM prose.

## 1. Layers that must remain separate

| Layer | Authority | Examples | 1.0 role |
|---|---|---|---|
| Exact operands | rules and committed transitions | controller, ray, captured piece, duty, legal exchange, reply set | shared substrate; Waves A/B |
| Semantic tactics | declared bounded consequence over exact operands | overload, deflection, interference, clearance, zwischenzug, mating pattern | **basic Wave C foundation** |
| Sourced context | versioned model/corpus/theory source | Maia mass, Explorer frequency, opening identity, cited theory, engine/tablebase result | source adapters; never imitated by board geometry |
| Product interpretation | named consumer policy | Support warning, theory-only nudge, Review moment, bot transform, habit card | F5/F6/F7/F8/F9 |

The LLM is outside these authority layers. It may phrase the already selected packet at a chosen
answer distance. It may not promote an operand into a tactic, select a Review moment, invent theory,
grade a move or diagnose a player.

## 2. Foundation inventory

| Capability family | Current evidence | Missing work | Required for |
|---|---|---|---|
| Wave-A tactical projections | 20/30 implemented; ten author-spec gaps remain | accepted RFC amendment for trade/loose/pawn/rook/space/discovered/promotion semantics, then implementation | F5/F8 minimum substrate |
| Wave-B positional/sequence projections | research complete; 18-id draft repaired author-side | independent Claude reproduction/acceptance, then implementation | F5/F8 breadth substrate |
| Overload and defender manipulation | exact duties plus rare identity-retaining three-edge sequences; causal names refused | complete-reply/bounded-line definitions for overload, defender removal and deflection | full Support, Review, tactics drill grounding |
| Interference and clearance | exact slider/blocker/ray transitions | target-retaining consequence rules that distinguish a tactic from geometry | full Support, Review, tactics drill grounding |
| Zwischenzug and quiet threats | exact reply sets, exchanges, check/mate and one-reply consequences | line-order and counterfactual predicate with a declared stopping rule | full Review and advanced Support |
| Mating patterns and king sequences | exact check/mate-in-one, back-rank, escape and king-zone operands | bounded mating-net/forced-king-walk semantics, with honest refusal outside the horizon | full Review and king-attack drills |
| Promotion threats/races | passed-pawn, blocker, distance, control and Syzygy inputs | quiet promotion threat/race consequences and exact authority split with tablebase | full endgame Support/Review |
| Runtime opening identity | CC0 catalogue/transposition key and R8 collision/empty-path evidence | versioned runtime applicability adapter and coverage-by-ply report | F7 theory, Review openings, repertoire-aware bots |
| Cited theory bundle | R4 exact+FTS result and R8 exact-join prototype | O5/F4 provenance compiler and immutable local bundle | theory-only nudges and drill links |
| Engine-relative Review operands | Stockfish/Syzygy and some recorded deltas; uneven reach | typed eval/WDL/mate consequence records, coverage/cost/stability research and O7 label ruling | Analyze and optional engine Review |
| Candidate evidence for bots | shared vocabulary and F8 compiler boundary specified | one adapter applies registered projections to every complete candidate set | explainable bot policy |
| Player habits and skills | opportunity arithmetic and twelve measured candidates | longitudinal observation store, floors/baselines/privacy | F9; not another classifier wave |

## 3. Wave-C research tracks

### C1 — defender and line tactics

Test the concepts independently; do not create a catch-all `tactic` enum.

- **Defender removal:** a named defender ceases a named duty and the same target becomes legally
  and locally positively capturable within the declared horizon.
- **Deflection/attraction:** retain exact relocation, duty and target identities plus the observed
  consequence. Quantify the complete relevant reply set only when the claim says forced or
  unavoidable.
- **Overload:** one defender has at least two retained duties and an exact continuation exploits
  the duty conflict. A complete-reply variant is a stronger separate claim, not the admission floor
  for the basic name.
- **Interference/clearance:** retain the changed ray, blocker, target and bounded consequence;
  opened geometry without an affected target is only an operand.
- **Zwischenzug/quiet threat:** retain the expected recapture/reply population, intervening edge
  and exact consequence without importing “best,” “forced” or intent.

Instrument requirements: canonical positives from cited published lines, constructed hard
negatives, color/file mirrors, capture/promotion identity checks, complete-reply enumeration for
the claims that quantify replies, and a fixed imported population. Lichess themes are a disagreement corpus only; its published tagger has
no working overload oracle. Report prevalence, abstention and disagreement separately. Zero
witnesses is a valid result.

**Falsifier:** a label fires from geometry alone without the relation its name asserts, loses a
subject identity, calls an observed reply forced, or cannot name a consumer that acts differently
on it. Lack of all-reply survival does not falsify a correctly phrased observed event.

### C2 — king and promotion consequences

Research separately:

- mating net versus exact mate-in-one/back-rank operands;
- forced king walk versus merely reduced escape squares;
- promotion race and quiet promotion threat versus distance-to-promotion;
- clearance/interference around the king versus generic king-zone counts;
- sacrifice versus literal material loss followed by a declared bounded or tablebase consequence.

Every result retains horizon, side to move, complete/refuting branches and its tablebase/search
authority. Syzygy owns outcome in-domain. Outside it, “winning,” “conversion” and “sacrifice
worked” require a declared engine/search boundary.

**Falsifier:** an engine scalar threshold sits on the optimality boundary and smuggles `bestmove`,
or a king-zone/escape delta is renamed “attack” without a consequence.

**Mating-net arm answered 2026-08-22:** exact complete-reply proof clears mate-through-four on
600/600 sampled positives and rejects 600/600 adjacent-depth controls, with zero 250k-node
abstentions. The source's `mateIn5` is verified as a five-or-more bucket; exact depth-five reaches
the computation boundary. The collector contract is proved/refuted/budget-exhausted with retained
horizon/tree or refuting branch.

**Promotion-race arm answered 2026-08-22:** exact geometry is useful and not outcome. Across 288
unique recorded Syzygy FENs, a side-to-move seventh-rank pawn splits 11 win / 1 draw / 11 loss,
immediate promotion includes a draw, and unblocked stride/turn ordering agrees only 7/10 with two
loss→win inversions. The collector splits geometry from a tablebase outcome join and abstains on
outcome outside the domain; D832's underspecified `ruleOfSquareVerdict` is refused.

**Overload response arm answered 2026-08-22:** the broad lost-duty-edge rule is rejected after
firing on 52/754 authored and 515/6,991 imported moves. The exact candidate-time event requires the
same piece to be sole defender of the captured and retained targets, at least one legal recapture,
and a positive named target capture after every such recapture. It fires on 0 authored and 12
imported moves. Multi-duty state, response conflict and observed exploitation are separate basic
projections; an all-opponent-reply or winning claim remains stronger and separate.

### C3 — opening and theory applicability

This is mostly closure of completed R4/R8 research, not a new algorithm hunt:

1. audit catalogue ingestion, `transposeKey`, packet omission and every Review/theory consumer;
2. report named-endpoint and all-prefix coverage by ply/population; preserve the measured uniqueness
   of named endpoints and never choose among descendant identities at an unnamed prefix;
3. fixture two move orders reaching one key, unnamed prefixes, retrospective deepest-match ordering,
   catalogue exit/re-entry and out-of-catalogue abstention;
4. split the handoff between F4 bundle production and F7 runtime/applicability UX.

**Falsifier:** the adapter carries the last known opening beyond a catalogue match, or LLM/FTS can
create applicability.

**Answered 2026-08-22:** `design/research/runtime-opening-identity.md` measures 3,810 unique named
endpoints and 7,854 all-prefix keys. Named endpoints reach 5.7% of fixed imported nodes; deepest
match is median/p90 ply 4/8; sticky identity becomes stale in 108/108 games. Current named endpoint,
catalogue membership and retrospective deepest reached are separate projections. The runtime RFC
and F4/F7 handoff remain.

### C4 — engine and human consequence operands for Review

Measure:

1. consecutive eval/WDL/mate availability by phase and run type;
2. latency/storage cost of a bounded post-game enrichment pass;
3. moment stability across depth/budget and engine version;
4. overlap/disagreement among engine swing, human-policy mass, Explorer frequency, exact semantic
   tactics, opening exit and tablebase state;
5. how often a useful factual card exists without an engine grade.

The output is typed operands plus a coverage matrix. Whether an explicit engine-review preset may
say inaccuracy/mistake/blunder, with its convention visible, is an O7/F6 product ruling. Ordinary
Review must remain useful with zero engine labels and permit zero moments.

**Falsifier:** engine availability is inferred from openings, raw PV/bestmove enters ordinary
Support, or a model/corpus probability becomes a chess-quality verdict.

**Engine operand arm answered 2026-08-22:** the shipped 100-ms executor is affordable as a
post-game source but not a grade oracle. Across 24 fixed imported transitions, delta-sign agreement
is 68.2–81.8% between adjacent tested budgets and top-eight moment Jaccard is .455–.778. Keep
`centipawns | mateIn` typed, derive deltas only for cp→cp, and retain engine/version/budget. On 72
already-proved mate-through-four positions, the 100-ms engine agrees on winner and exact remaining
distance 72/72; the legal-tree proof and engine reading remain separately cited. Current Story
instead coerces mate into ±1000 cp (D917), and the post-game pass requests eval without compiling
the other declared sources (D918). Cross-source overlap, engine-version stability and whole-game
selection remain.

**Whole-game source arm answered 2026-08-22:** 8 deterministic complete imported games contribute
658 transitions. Raw side-to-move WDL correlates **.015** with White-perspective cp and its adjacent
delta agrees in sign with cp on **49.4%**; normalizing WDL to White raises those to **.847** and
**68.5%**. D927 owns the production perspective defect. Selected semantic facts, exact opening
endpoints or seven-piece tablebase-domain eligibility exist beside **19/24** engine top-three
moments, so factual Review need not collapse to engine grading. D928 owns the typed whole-game
selector: source-local admission plus declared family quotas/priorities, never one score spanning
cp/mate, WDL, human likelihood, opening identity, semantic relations and DTZ. Engine-version
stability and learner usefulness remain.

**Engine-version arm answered 2026-08-22:** official Stockfish 17.1 versus 18 at the same 100-ms
bound over 24 fixed transitions yields cp-delta sign agreement **77.3%**, White-normalized WDL
delta agreement **87.0%**, and top-eight moment Jaccard **.600** for both families. Cp/mate point
type agrees 48/48. Version remains a required operand because moment identity still changes;
learner usefulness is the remaining C4/F6 arm.

### C5 — cross-consumer closure

Every admitted projection must publish:

```text
projection/version
  producer + literal operands + abstention
  eligible consumers: support / review / theory / bot / habit / inspector / authoring
  timing: pre-commit / post-commit / post-game / offline
  answer distance: square / relation / concept / candidate / move / line
  source ceiling and workflow ceiling
  positive + hard-negative + abstention fixture
  availability/latency disposition
```

The same projection may be quiet in Support, visible in Review, weighted by a bot and counted in a
habit card. That is reuse. Four consumers implementing four near-identical detectors is failure.

**Candidate matrix answered 2026-08-22:** 20 research-admitted rows carry every field above in an
executable handoff. Candidate reach is Support 16, Review 20, bot 13, inspector 20, authoring 17 and
theory 3. Pre-commit rows are position-rules-grounded and expose no move, line or evaluation answer.
Habits receive zero rows until an opportunity denominator, sample floor and longitudinal store
exist; raw counts would measure exposure. The matrix does not authorize production names: the
Wave-C collector/source RFC owns those, followed by a literal-id amendment to `learner-modules` and
the Review successor (D921).

## 4. Downstream gates

| Node | Minimum dependency | Wave-C effect |
|---|---|---|
| F5 module architecture | landed A/B projections, eligibility and honest absence | may draft after A/B; **full 1.0 Support acceptance waits on admitted C1/C2 semantics** |
| F6 Review Map | F5 eligibility, whole-game selector and factual events | may build factual shell; **full tactical Review waits on C1/C2 and engine-grade features wait on C4/O7** |
| F7 theory/drills | F3 capabilities + F4 bundle + C3 runtime applicability | waits on C3 for contextual theory |
| F8 bots | landed A/B + candidate adapter + compiled decision record | baseline/guarded/pawn-heavy may proceed; richer tactical personas consume C1/C2 later |
| F9 habits/skills | versioned events + longitudinal store + opportunities | existing validated metrics may proceed; each new semantic metric earns its own stability gate |
| Campaign | usable F5/F7 core loop and R14 owner use | waits on the credible consumer experience, not on every future chess concept |
| Content scale-up | Gate F, version negotiation and sacrificial pilot | waits; required pilot capabilities must be stable, optional future projections need no pack edits |

## 5. Content-stability rule

Collectors produce facts; packs declare only capabilities they require. Adding an optional
projection does not edit a pack. Replacing semantics creates `@2`; `@1` remains supported through
1.x or the runtime refuses the pack explicitly. A mechanical migration adds a capability stamp
only after its read-only plan proves there is no chess/provenance judgement.

“Foundation first” therefore means stable extension, versioning and refusal **plus the basic
semantic set above**. It does not mean freezing an impossible final list of every chess idea.

## 6. Execution order and closeout

1. Finish Wave A's ten author-spec returns; do not improvise them in code.
2. Obtain independent review/acceptance for Wave B, then implement its 18 projections.
3. Run C1 and C2 as disposable research instruments; each label may pass, narrow or be refused.
4. Run C3 symbol/coverage closure and route it to F4/F7.
5. Run C4 over real imported and pack trajectories; return the engine-label choice to O7.
6. Compile C5 from the catalogue and research results.
7. Draft only admitted RFCs. Do not combine source adapters, engine Review and tactical semantics
   merely because they all produce evidence.
8. Close each track with a dossier or explicit refusal, a `design/research/README.md` row, affected
   gate/backlog reconciliation and an append-only exploration-log entry.

No research result itself authorizes product code, content changes, learner wording or an LLM
prompt.
