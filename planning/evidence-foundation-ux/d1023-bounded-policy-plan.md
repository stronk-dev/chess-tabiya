# D1023 bounded-policy prevention research — predeclared plan

**Opened:** 2026-08-23

**Authority:** D1023 under RFC-0000's disposable exploration gate

**State:** **COMPLETE 2026-08-23.** Exact, Stockfish and Maia arms are measured over the corrected
paired 48+48 provider sample. Stockfish passes the frozen stability gate at 88/96 = 91.67%; Maia
admits 52/66/77/85 rows at bands 1000/1400/1800/2200 under the frozen per-node 90%-mass gate and
retains refused rows as unavailable. The bounded collector RFC may now be drafted from
`design/research/bounded-policy-targets.md`; learner wording, module selection, presets and bot
weighting remain downstream decisions

## Question

Can Tabiya truthfully describe that one legal move **removed or preserved one named
opponent continuation** over a 2–3-ply horizon, when the opponent policy is explicit—without
renaming attack geometry as prophylaxis, treating low reply breadth as force, or inferring what the
opponent intended?

This is the residue left by the owner's examples: a pawn makes a bishop/knight destination locally
unsafe; a pawn attacks a bishop which retreats while retaining a diagonal; a move stops an
opponent's threat; hovering a piece previews what it can threaten in a few moves. The shipped
foundation already supplies exact squares, legal moves, local exchanges, threat identities,
reply breadth, rays and recorded multi-edge identity. The experiment tests the missing
counterfactual/policy relation—not another attack map.

## Fixed semantic scope

Version 1 of the research recognizes only two named target families:

1. **material-or-mate target** — an exact `threat@1` identity: threatening piece/square,
   threatened UCI, optional captured piece/square, exchange result and mate flag;
2. **destination target** — one named bishop/knight and one named square which is legal before and
   after the candidate, plus the exact before/after local-exchange status and controlling pawn.

No other “plan” enters this experiment. In particular, opening plans, pawn breaks, positional
sacrifices, good/bad pieces, initiative and king attack need cited theory, engine consequence or an
authored claim and are not approximated here.

The line starts at a legal decision position `P0`, tests one legal candidate `c`, then evaluates:

- `P1`: after `c`, opponent to move;
- `P2`: after one opponent policy move;
- `P3`: after one defender policy move, giving the opponent its second turn.

The horizon is therefore the opponent's next move and next opportunity after one answer. Longer
search is outside the version and must return `horizon_exhausted`, never `false`.

For a material-or-mate target, the pre-candidate baseline is `threat@1`'s already declared pass
clone: give the move to the opponent and clear en-passant. It is not described as a legal pass. If
`P0` is in check or the clone is invalid, the row abstains. Policy-mass change remains a typed
numeric interval; this plan invents no threshold for the word “worsened.”

## Populations

Run the same definition over three fixed populations and report them separately:

1. every eligible decision and legal alternative in the canonical authored-spine population used
   by D794;
2. every eligible decision and legal alternative in D794's sealed imported fixed-ply population;
3. a canonical fixture set containing color/file mirrors, pins/check, captures, target movement,
   interposition, counterattack, promotion and terminal cases.

The fixture set proves mechanics; the two populations measure reach, abstention and whether a
default/proactive use would be noisy. No authored or imported rate becomes a universal chess prior.

Input digests, row counts and withheld reasons are emitted. A row is withheld if replay fails,
target identity cannot be retained, the source is unavailable, a score domain mixes cp/mate where
the requested relation requires comparison, or source probability mass cannot bound the result.

## Policy arms—never collapsed

The same target/horizon runs under three visibly different authorities:

### A. Complete legal-reply arm

Enumerate every legal opponent move and every legal defender reply. Report exact existential and
universal facts:

- `target_executable_now`;
- `target_removed_now`;
- `target_reappears_within_3ply`;
- `target_survives_every_defence_within_3ply`;
- first refuting and first preserving line in canonical UCI order.

Only the universal result may use “unavoidable within the declared horizon.” An existential result
means “available,” never “forced.” This arm is position-rules exact and carries the node count/cap.
Legal moves and branches sort by canonical UCI; the fixed cap is **25,000 visited positions per
candidate**. Exhausting it returns `budget_exhausted` with the visited count and no boolean result.

### B. Stockfish policy arm

Use official Stockfish at the already measured production candidate bounds **depth 8 and depth 10**
with complete root move coverage. Preserve engine id/version/bound and typed cp-or-mate. Select the
principal policy edge at each turn with the neutral tiebreak; do not convert mate to centipawns.

Depth 8 is the candidate product budget and depth 10 is the adjacent stability control. This arm
may say only “under Stockfish `<version>` at depth `<n>`.” It cannot prove human expectation,
unavoidability or intention.

### C. Maia human-policy arm

Use the measured candidate human-policy bands `[1000, 1400, 1800, 2200]`, identified as model
bands—not Elo promises and not treated as a production-default ruling. At each policy node retain
the complete returned candidate distribution, model
identity, band and unmapped/unlisted mass. Preserve two different quantities: at `P1`,
`next_execution_mass` is the mass assigned to actually selecting the named target move; after one
opponent move and one defender answer, `second_opportunity_available_mass` is the path mass arriving
at a `P3` state where the target is available again. Do not sum them. Actual execution from `P3`
would be a fourth ply and is outside this version. Compute lower/upper bounds for each quantity;
never redistribute missing mass.

Report each band separately. A cross-band aggregate or one “human probability” is forbidden. Maia
may establish a population-model likelihood, never the objective quality of the candidate or why a
person chose it.

The source-backed arms do not run over every legal edge. After the complete-reply census, take
**48 target/candidate rows from each population** (96 total) in two declared parts:

- 16 material-target anchors, round-robin across phase and the played candidate's exact result;
  include the played candidate and one SHA-256-selected legal alternative for the **same exact
  attacker/target identity** (32 rows);
- 16 destination-target rows, round-robin across played/alternative, phase and exact result (16
  rows). These are standalone policy-return probes: a target created by one pawn candidate usually
  has no same-target identity under another candidate, so no unrelated-square delta is invented.

The sample rule and shortages are emitted before provider calls. Maia expands at most eight moves
per node after its existing temperature
0.8 / top-p 0.92 transform; discarded and unreturned mass remains in the bound. If the kept tree
accounts for less than 90% mass at any node, that branch abstains rather than being renormalized.

The authored/theory case is not a fourth statistical policy. A cited line may be replayed as a
separate `recorded_line` witness with its literal source; it does not generalize beyond its
applicability set.

## Candidate comparison

For every position, compare the played candidate with every legal alternative that reaches a
distinct result position. Preserve the full denominator and report:

- exact alternatives which remove/preserve/reintroduce the same target;
- Stockfish depth-8/depth-10 category and target-line agreement;
- Maia per-band lower/upper `next_execution_mass` and `second_opportunity_available_mass`; for
  material targets only, like-for-like played-minus-alternative delta intervals over the paired
  identity, with no invented categorical threshold. Destination delta is explicitly inapplicable;
- source disagreement as first-class output;
- candidate cost and abstention by source.

The instrument does **not** rank by rarity or select a learner hint. Counterfactual lift is reported
only to judge whether proactive default presentation would be background; R2/R3 already establish
that distinctiveness is necessary and not sufficient for usefulness.

## Able-to-fail controls

The harness must fail if any of these cases produces the stronger claim:

1. a pawn newly attacks a square but the named minor still has a legal, locally non-losing route;
2. a target capture is removed immediately but restored after one legal interposition/retreat;
3. one legal defender refutes a line labelled universal;
4. the named attacker or target is captured/replaced and square equality launders identity;
5. a check position is passed through `threat@1` rather than abstaining;
6. depth 8 and 10 disagree but one stable engine-policy result is emitted;
7. Maia missing mass makes a claimed delta direction cross zero;
8. cp and mate are coerced into one comparison scalar;
9. a policy-specific result loses its policy/model/version/band/horizon label;
10. the words `prophylaxis`, `forced`, `best`, `mistake`, `good`, `bad`, `plan` or `intent` appear in
    a collector payload or deterministic fact renderer.

Positive controls include immediate threat removal, preserved threat, reintroduced threat,
universal bounded survival and a destination becoming locally unsafe to the moved pawn. Every
control is mirrored by color; ray cases are file-mirrored where legal.

## Exit criteria

The research may recommend one or more versioned projections only if all applicable clauses pass:

1. **mechanical closure:** all ten able-to-fail controls pass and every positive retains exact
   target/piece/square identities and a canonical witness/refutation line;
2. **non-vacuity:** each recommended result has at least one positive and one hard negative in the
   permanent fixture set; zero corpus occurrences are reported rather than used to delete it;
3. **engine stability:** among engine-eligible rows, depth-8/depth-10 result-category agreement is
   at least 90%; unstable rows must abstain in the product candidate;
4. **human-policy bounds:** at least 90% of Maia-returned probability mass is accounted for at every
   admitted node; a signed change is admitted only when its before/after delta interval excludes
   zero, otherwise the result is the interval without a direction word;
5. **reach:** at least 20 eligible decision positions per authored/imported population for any
   claim proposed for proactive/default use. Lower reach permits on-request/Review operands only;
6. **cost:** report cold and warm p50/p90/p99 separately for exact, Stockfish and Maia arms. No
   latency threshold is invented here; the future consumer RFC compares it to its workflow budget;
7. **honesty:** the output vocabulary stays `removed`, `preserved`, `reintroduced`, `available`,
   `unavoidable_within_horizon` and policy-qualified probability bounds/deltas. “Worsened” has no
   threshold in this plan. Strategic labels remain a theory/authored presentation join.

Failure routes are explicit:

- if only the complete-reply arm passes, ship exact bounded facts and no policy claim;
- if engine stability fails, retain the exact arm and refuse engine-policy prevention;
- if Maia bounds fail, retain raw policy rows for the inspector/bot and refuse human-likelihood
  prose;
- if the corpus is background, keep the primitive for requested sight, Review, bots and authored
  drills but do not make it a default nudge;
- if target identity cannot survive the horizon, do not draft an RFC.

## Artifacts and closeout

The disposable harness will live at `tools/d1023-bounded-policy-harness/`. Commit aggregate
results, fixtures, source identities/digests and able-to-fail tests; do not commit large raw engine
or model dumps. The result updates a bounded dossier in `design/research/`, the coverage matrix,
D1023, this program plan, any affected gate, and the append-only exploration log.

An RFC may follow only for the identities the experiment admits. Learner wording, module
eligibility, presets and bot weighting remain separate consumer decisions even if a producer passes.
