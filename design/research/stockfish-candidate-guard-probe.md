# Stockfish candidate-guard probe

**Question:** what bounded Stockfish request can truthfully price every Maia candidate for
`guard.severe_error@1`, and when must that guard abstain?

**Feeds:** D969, `rfc/bot-policy.md` §2.4, F8 A6/A8.

**Verdict:** a single candidate-set search is the viable request shape; independent candidate
searches are not a common scale. Neither tested node bound is usable. Fixed depth 8/10/12 returns
complete exact sets, and the full predeclared R11 population has now been rerun at depth 8 and 10.
Both depths pass the original guard-retention gate; both retain only the pawn ×4 trait and refuse
forcing/quiet ×3. The result survives the conservative typed policy that abstains on all 11/279
mixed mate/cp positions. Depth 10 changes no gate outcome and carries a measured 729 ms cold
selection tail, while depth 8 stays below 500 ms. **Depth 8 is therefore the only measured 1.0
candidate** `[M]`; the RFC still must declare that literal, its multi-call budget, and whether the
measured mixed-domain abstention is the product rule before any guarded profile registers.

## Method

`tools/d969-stockfish-guard-harness/probe.mjs` drove the installed Stockfish 18 binary through
three positions and 13 named legal root candidates on 2026-08-23 `[V]`. Each arm used one thread,
16 MB hash, `ucinewgame`, `Clear Hash`, and an explicit bound. It compared:

1. one unrestricted reference search;
2. one shared `MultiPV=N` search restricted to the exact candidate set with
   `searchmoves <uci...>`; and
3. N independent `MultiPV=1 searchmoves <uci>` searches.

The default arm used `go nodes 50000`; comparison arms used 25,000 nodes and depth 12. Stockfish's
own parser makes `searchmoves` the final `go` operand, and its search clamps MultiPV to the root
move count and performs a distinct root search per PV line `[V]`
([official `uci.cpp`](https://github.com/official-stockfish/Stockfish/blob/master/src/uci.cpp),
[official `search.cpp`](https://github.com/official-stockfish/Stockfish/blob/master/src/search.cpp)).

The follow-up population arm restarted the local server to clear its selection cache, obtained the
real `human_common` Maia vector at every server-discoverable production draft root (50 positions:
20 opening, 14 middlegame, 14 endgame and 2 cross-phase), and passed the exact 6–20 returned moves
to one shared Stockfish search `[V]`
(`tools/d969-stockfish-guard-harness/population.mts`,
`planning/platform-alignment/bot-policy/d969-population-results.json`). It compared 25k/50k nodes
and depth 8/10/12 with a fresh hash and one thread. The 250 cp mask comparison uses depth 12 as the
reference because the committed 279-position R11 result was calculated at depth 12. This is full
coverage of current pack roots, not a chess-position population estimate, and it does not by itself
revalidate R11's threshold or retention gates at a shallower depth.

## Findings

### 1. Candidate-set `searchmoves` reaches every requested row

The shared 50,000-node arm returned an identified PV, typed cp/mate score, rank and depth for all
13/13 requested candidates `[V]` (`tools/d969-stockfish-guard-harness/probe.mjs`). Wall time for
the whole shared set was 13.5 ms in the forced-mate position, 24.7 ms in the black-to-move
disadvantage position, and 65.2–70.8 ms in the initial position across the recorded runs. The five
independent initial-position searches took roughly 350–390 ms in aggregate. This supports one
shared request, not N independent requests; it does not establish a production latency percentile.

### 2. Independent fixed-node searches do not produce a common loss scale

At the black-to-move position, the unrestricted 50,000-node search reported −723 cp while
independently restricted candidates reported −687 to −720 cp; several candidates therefore
appeared *better than the unrestricted best* `[V]`. The cause is visible in the instrument: each
restricted move spends the entire node budget inside its own subtree and reaches a different depth.
Subtracting those values from a separate reference would manufacture negative “losses.”

The RFC's own phrase “best candidate in the same probe” is therefore load-bearing. Loss must be
derived only from the top row and candidate rows of one shared candidate-set probe. An unrestricted
best move outside Maia's vector is not the reference for this layer.

### 3. Fixed nodes can yield a score that is present but not exact

At 50,000 nodes, the initial-position reference and top shared row ended with `upperbound`; at
25,000 nodes, the shared initial set also contained an upper-bound candidate, and independent rows
included both upper and lower bounds `[V]`. Depth 12 returned exact final rows for all 13 candidates
in this small sample, with shared-set wall times of 6–152 ms.

This refutes `score !== undefined` as a completeness test. A production probe is complete only if
every requested legal candidate occurs exactly once with a final **exact** score; any missing,
duplicate, `lowerbound`, or `upperbound` row must abstain the whole guard. Choosing depth 12 instead
of a node bound would avoid the observed bounds here but introduces an unmeasured latency tail; the
amendment cannot choose it from three positions.

The population arm makes that refusal decisive. At 25k nodes only 16/50 positions were all-exact;
at 50k, only 15/50 were all-exact. Opening exactness was 15–20%, middlegame 7.1–14.3%, cross-phase
0%, and endgame 71.4–78.6% `[V]`. More nodes did not monotonically improve exact completion.
Although both calls were fast (p95 34.2 and 63.1 ms), a guard that abstains on 68–70% of current
pack roots is not the measured `guard_250` whose benefit the RFC cites.

### 4. Fixed depth separates completeness from calibration

Depth 8, 10 and 12 each returned one exact row for all 958 requested candidates across all 50 pack
roots `[V]`. Their Stockfish-only p95/max latencies were respectively 105/129 ms, 404/431 ms and
1,170/1,258 ms. With cold Maia included sequentially, depth 8 remained below 500 ms even at the
maximum (499.1 ms); depth 10 reached 729 ms; depth 12 reached 1,403 ms. Under
`design/02-product-shape.md`'s two-axis rule, depth 8 and 10 meet the shallow-Stockfish per-call
line, depth 12 does not, and any multi-call selection still owes its own declared budget.

Completeness is not calibration. Excluding the one real mixed cp/mate position, depth 8 reproduced
the depth-12 severe-mask set on 42/49 positions and depth 10 on 43/49. Across 938 candidate labels,
depth 8 disagreed on 10 (5 false-severe, 5 missed-severe); depth 10 disagreed on 7 (3 false-severe,
4 missed-severe) `[V]`. Those rates are descriptive, not acceptance gates chosen after the result.
The RFC cannot retain the depth-12 claim “removes all measured severe mass” while executing a
shallower score definition. It must rerun R11's predeclared guard-retention gates at the literal
chosen depth.

### 5. Mate is a separate score domain

The forced-mate position returned `mate 1`, `mate 2`, `mate 3`, and `cp 0` across four legal
candidates in the same shared probe, and one production pack root also produced a mixed cp/mate
vector at every tested bound `[V]`. Stockfish formats mate as a distinct score variant and does not
pass it through its centipawn conversion `[V]`
([official `UCIEngine::format_score`](https://github.com/official-stockfish/Stockfish/blob/master/src/uci.cpp)).

A `mate → ±large cp` conversion would invent both magnitude and threshold distance. The guard input
must therefore retain `{kind:"cp", value}` versus `{kind:"mate", moves}`. The RFC still needs to
rule which typed transitions are masked. Mechanically safe options are either an explicit finite
ordering (for example, losing a forced mate is severe while preserving one is not assigned a cp
loss) or guard abstention whenever the probe mixes domains. This research does not choose between
them.

### 6. Score perspective can be pinned once at the root

All rows in one shared probe use the same root side-to-move frame. The black-to-move disadvantage
case returned four negative cp values, while the white-to-move initial case returned the familiar
positive-best ordering `[V]`. The production record should state `perspective: "root_side_to_move"`
and never flip individual candidates after their moves; comparison happens at the root.

### 7. The predeclared retention gates at depth 8 and 10

The follow-up did not substitute the easier 50-root latency population. It retained the exact R11
inputs: 279 positions, 837 position-band cells, the same Maia/explorer rows, SAN mapping, production
sampler reconstruction, 250 cp guard, trait multipliers and acceptance thresholds. The new probe
priced every legal root move from the retained population in one shared `MultiPV=N searchmoves`
call at depth 8 and depth 10. Every requested row was present and exact; input digests and aggregate
outputs are in `planning/platform-alignment/bot-policy/d969-depth{8,10}-abstain-results.json` `[V]`.

The first comparison reproduced the historical harness's mate-to-large-cp conversion only as a
negative control. It is not a production result. Both new depth files contain the same **11 mixed
mate/cp positions** (3.94% of positions; 33 band cells), so the production-shaped rerun used the
already-declared safe fallback: abstain the guard for the whole mixed-domain position and leave the
base Maia distribution unchanged. The evaluated population is therefore 804 cells; no mate score
is assigned a centipawn magnitude `[V]`.

| fixed depth | guard severe mass removed | strengthening | human-match retention | guard | pawn ×4 | forcing ×3 | quiet ×3 |
|---:|---:|---:|---:|---|---|---|---|
| 8 | 100% | 1.36 cp | 100.21% | pass | pass (+12.28 pp) | fail (+3.12 pp) | fail (+2.31 pp) |
| 10 | 100% | 1.52 cp | 100.29% | pass | pass (+12.33 pp) | fail (+3.13 pp) | fail (+2.32 pp) |

Both depths make the same four predeclared decisions `[V]`. Depth 10's small score differences buy
no retained layer and no human-match improvement that changes a gate, while the earlier cold
population timing records a 729 ms end-to-end maximum versus 499.1 ms at depth 8 `[V]`. This is the
missing empirical basis for choosing depth 8; it is not evidence that the resulting bot feels
human, coherent or fun.

## Amendment inputs

The D969 amendment can now be concrete without pretending the remaining measurement is done:

- request: one serialized Stockfish 18 candidate-set search, explicit `Threads=1`, `Hash=16`,
  `MultiPV=candidateCount`, `ucinewgame`, `Clear Hash`, exact root FEN/history, and
  `searchmoves` containing exactly the admitted Maia candidates;
- record: engine identity/version, bound kind/value, exact requested candidate identities, root
  perspective, each typed score/rank/depth/bound flag, and elapsed time;
- completeness: set equality with requested candidates plus exact (not bounded) final scores;
- loss: compare only within that shared probe; never compare N independently searched rows;
- mate: retain the typed domain and rule it explicitly or abstain;
- fallback: any provider error, timeout, incomplete/bounded row, or unruled score-domain mix records
  a guard abstention and leaves the base distribution unchanged;
- budget choice: node bounds are refused by population completeness; depth 12 is refused for the
  live shallow-call budget; depth 8 is the only measured candidate because depth 10 changes no
  gate outcome while carrying the 729 ms tail;
- mixed domains: abstaining on all 11 mixed mate/cp positions is measured and preserves the gate
  verdicts; any more permissive typed transition policy is a fresh contract and needs its own
  fixtures;
- remaining author action: declare depth 8, the multi-call selection budget and the score-domain
  fallback in the RFC, then bind those literals into the composed profile digest.

## Consequence

D969 has no remaining empirical arm. `searchmoves` has an attested opponent-selection consumer;
depth 8 passes the exact predeclared gates on the exact population; typed mixed-domain abstention
costs 3.94% of positions and preserves the verdict; and depth 10 buys no gate outcome. What remains
is RFC authoring, not more measurement: pin the depth-8 request, budget and abstention semantics,
then register only the guarded and pawn-heavy profiles their exact composed digests earn. Changing
the production capability row still belongs in that implementation, not in this research commit.
