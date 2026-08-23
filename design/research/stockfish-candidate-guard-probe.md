# Stockfish candidate-guard probe

**Question:** what bounded Stockfish request can truthfully price every Maia candidate for
`guard.severe_error@1`, and when must that guard abstain?

**Feeds:** D969, `rfc/bot-policy.md` §2.4, F8 A6/A8.

**Verdict:** a single candidate-set search is the viable request shape; independent candidate
searches are not a common scale. Fixed nodes can stop with bound scores, so “one score per move” is
not sufficient completeness. Mate scores must remain typed. This pass narrows the amendment but
does not authorize production registration: the abstention/latency rate still needs measurement on
real Maia candidate vectors.

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

This is a mechanism probe, not a population estimate: three positions, one machine, one Stockfish
version, and deliberately small candidate sets. It does not revalidate the 250 cp threshold; that
comes from the committed 279-position R11 experiment (`planning/platform-alignment/bot-policy/results.json`).

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

### 4. Mate is a separate score domain

The forced-mate position returned `mate 1`, `mate 2`, `mate 3`, and `cp 0` across four legal
candidates in the same shared probe `[V]`. Stockfish formats mate as a distinct score variant and
does not pass it through its centipawn conversion `[V]`
([official `UCIEngine::format_score`](https://github.com/official-stockfish/Stockfish/blob/master/src/uci.cpp)).

A `mate → ±large cp` conversion would invent both magnitude and threshold distance. The guard input
must therefore retain `{kind:"cp", value}` versus `{kind:"mate", moves}`. The RFC still needs to
rule which typed transitions are masked. Mechanically safe options are either an explicit finite
ordering (for example, losing a forced mate is severe while preserving one is not assigned a cp
loss) or guard abstention whenever the probe mixes domains. This research does not choose between
them.

### 5. Score perspective can be pinned once at the root

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
- remaining falsifier: replay real production-shaped Maia vectors across the fixed R11 population
  under the candidate bound(s), report exact-completion and latency distributions, and register no
  guarded profile until the chosen arm clears a predeclared availability budget.

## Consequence

D969 is narrowed, not closed. `searchmoves` now has an attested product consumer, and the current
capability disposition “unmeasured — no attested authoring consumer” is stale in both halves:
the consumer is opponent selection, not authoring, and a working request shape has been measured.
Changing that capability row belongs in the RFC implementation after the amendment chooses the
budget and mate rule; doing it in this research commit would advertise an unaccepted contract.
