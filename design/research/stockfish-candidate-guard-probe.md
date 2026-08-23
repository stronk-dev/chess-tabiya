# Stockfish candidate-guard probe

**Question:** what bounded Stockfish request can truthfully price every Maia candidate for
`guard.severe_error@1`, and when must that guard abstain?

**Feeds:** D969, `rfc/bot-policy.md` §2.4, F8 A6/A8.

**Verdict:** a single candidate-set search is the viable request shape; independent candidate
searches are not a common scale. The production-population arm then finds that neither tested node
bound is usable: only 15–16 of 50 pack roots return an all-exact set. Fixed depth 8/10/12 returns
all 958 requested Maia candidates exactly. Depth 8 is the only tested arm that keeps both the
Stockfish call and the cold sequential Maia+guard selection below 500 ms, but its 250 cp mask
differs from the depth-12 research reference on 7 of 49 cp-only positions. Depth 10 differs on 6
and needs a separately declared 729 ms selection tail; depth 12 breaches the per-call budget.
Production registration therefore still requires a literal depth choice plus recalibration of the
250 cp retention result at that depth. Mate scores remain typed and need a ruled transition policy.

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
  live shallow-call budget; depth 8 and depth 10 remain candidates with their measured latency and
  depth-12 disagreement recorded rather than hidden;
- remaining falsifier: rerun R11's predeclared guard retention gates at the literal chosen depth,
  declare the multi-call selection budget, and register no guarded profile until both pass.

## Consequence

D969 is narrowed to one explicit remeasurement and two policy choices, not closed. `searchmoves`
now has an attested product consumer, and the current capability disposition “unmeasured — no
attested authoring consumer” is stale in both halves: the consumer is opponent selection, not
authoring, and a working request shape has been measured. The amendment must choose depth 8 or 10,
rerun the R11 guard gates at that depth, declare the resulting per-selection budget, and rule the
typed mate transition. Changing the capability row belongs in the RFC implementation after those
steps; doing it in this research commit would advertise an unaccepted contract.
