# Exact-DTZ selector census rerun — D457

**Question.** Does the `perfect_tablebase` capture-or-pawn enrichment survive when the census
retains `preciseDtz`, reproduces the shipped selector exactly, and keeps the probed population so
another reader can rerun the calculation? This is the unresolved arm of D457 and the withdrawn
post-fix record behind D451/D456.

**Verdict.** **The winning-position enrichment survives against a uniform preserving-move null,
but it is explained by the selector's intended DTZ ordering; no residual hash-tiebreak bias is
demonstrated.** The new result is reproducible and narrower than both historical readings. It says
what `perfect_tablebase` selects on this authored-pack walk population. It does not establish
human-like endgame play or pedagogical usefulness.

**Instrument.** `make dtz-census-measurement` builds the disposable TypeScript collector, resumes
from retained tablebase responses, runs four able-to-fail Python controls, and derives the report.
The committed source is `planning/dtz-census/d457-positions.jsonl`; the derived report is
`planning/dtz-census/d457-census.json`. Both are inputs to the normal target rather than an
unrecoverable run record `[V]`.

---

## 1. Population and exact identity

The collector took every authored endgame start, spine and deviation position inside the
seven-piece tablebase, then ran two deterministic five-ply category-preserving walks per seed.
It emitted **1,919 distinct FENs** from **275 eligible seeds across 12 packs**, with **1,618 live
tablebase probes** and no final probe errors `[V]`. The report attributes rows to 11 pack ids
because `mate-bishop-knight` and `trajectory-mate-bishop-knight` share the exact start FEN and the
collector deduplicates positions globally; that is an attribution collision, not a missing probe.

The retained JSONL is **3,137,933 bytes**, SHA-256
`896990af5b28d55d07fe2ce76746d5e8bad559b57f205a8656b33846ea34903d`. Every recorded legal move
contains the `preciseDtz` key. A second complete target run rehydrated all 1,919 answers from that
file and issued **zero network probes**, reproducing the report `[V]`.

The population splits into 821 winning, 209 drawn and 889 losing positions. It is a deterministic
walk outward from authored endgame material, not learner traffic and not a uniform sample of legal
endgames. All rates below are conditional on this fixed population.

## 2. Selector reproduction and controls

Production filters to category-preserving legal moves, orders wins by ascending
`abs(preciseDtz ?? dtz ?? 0)`, losses by descending value, and draws by the position-pure neutral
SHA-256 key (`apps/server/src/opponent-selector.ts:712-748`) `[V]`. The census uses the same
ordering. It refuses an input row that omits the `preciseDtz` field rather than silently recreating
the old rounded-DTZ instrument `[V]`.

Four controls establish that the calculation can fail:

- unequal `preciseDtz` values break an equal rounded-`dtz` tie;
- rounded `dtz` is used only when `preciseDtz` is explicitly null;
- winning and losing directions match production;
- the exact Poisson-binomial upper tail uses each position's own candidate-pool probability.

Two nulls separate the two mechanisms:

1. **Uniform preserving move:** choose uniformly from every category-preserving legal move. This
   tests the complete selector, including its DTZ primary ordering.
2. **Uniform DTZ-primary tie set:** first apply the production DTZ optimum, then choose uniformly
   only among moves tied at that optimum. This isolates the neutral hash tie-break.

## 3. Results

| Root class | Positions | Selected capture/pawn | Uniform expected | Enrichment / upper-tail p | DTZ-primary expected | Residual enrichment / upper-tail p |
|---|---:|---:|---:|---:|---:|---:|
| win | 821 | 59 (7.19%) | 46.27 (5.64%) | **1.275× / 0.0096** | 54.68 (6.66%) | **1.079× / 0.172** |
| draw | 209 | 10 (4.78%) | 7.53 (3.60%) | 1.328× / 0.217 | 7.53 (3.60%) | 1.328× / 0.217 |
| loss | 889 | 25 (2.81%) | 24.59 (2.77%) | 1.017× / 0.503 | 23.56 (2.65%) | 1.061× / 0.361 |

Winning roots therefore do select a capture or pawn move more often than a uniform preserving
move on this population. Once the intended DTZ primary ordering is held fixed, the remaining
7.9% excess is not statistically distinguished from the tie-set null. Draws have no DTZ direction
by design, and neither their hash-only result nor the losing result establishes an enrichment.

The winning selected-rate Wilson 95% interval is **5.61–9.16%**. There are many primary ties—461
winning, 203 drawn and 376 losing roots—so the absence of a detected residual is not an artefact of
having no opportunity for the hash to act `[V]`.

## 4. What changed from the historical records

The historical pre-fix snapshot reported **1.571×** winning enrichment and used lexical UCI order
inside ties. The discarded post-fix run reported **24/218 = 11.01%** against 9.34% expected
(1.178×), but its source JSONL was not retained and it ordered the recorded rounded `dtz`, not the
runtime's `preciseDtz`. Neither number is promoted into the new result.

The reproducible current result is **1.275× against full uniform**, and the new causal split shows
that this is compatible with the intended DTZ primary rule rather than evidence of a biased neutral
tie-break. D451's diagnosis that most of the old excess was lexical remains a diagnosis of the old
comparator. It is not a description of current production.

## 5. Product consequence and limits

- D457 is closed: the source population, exact comparator, nulls and derived report are retained
  and runnable through one normal Make target.
- `perfect_tablebase` is accurately described as **outcome-preserving and DTZ-directed**. Calling
  it human-like, pedagogically optimal, or generally simplification-seeking would exceed this
  measurement. DTZ is distance to the next zeroing move, not a human difficulty or quality score.
- E4 remains unmet. Exact tablebase behavior is a useful deterministic opponent policy at one end
  of the product, but this census does not measure believable multi-ply resistance.
- The next bot-foundation measurement remains D375/D490: rerun the
  `practical_resistance` refusal rate after the float32 fix, against current code.

No LLM-generated chess judgement enters this dossier. Move category and DTZ come from Syzygy;
capture/pawn status is deterministic SAN/move arithmetic; the conclusions are limited to those
operands.
