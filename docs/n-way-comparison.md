# N-way comparison and review surfaces

Tabiya compares two through eight preserved attempts on one structural axis. The
runtime finds the deepest node shared by every selected branch, aligns all rows
to it, and groups columns that still occupy the same node. Adding a branch may
move the common fork earlier; clients therefore request a fresh comparison and
reset their stepper whenever the set changes.

Each branch column carries its label, origin, own fork, leaf, objective and
checkpoint timeline, recorded engine evidence, theory membership, resistance,
and a consequence row. These are facts about that branch. The payload never
ranks branches, computes an eval delta, or recommends a winner. Missing
checkpoints use a fixed pack-grounded absence sentence. Objective-timeline
grounds resolve payloads from the same run snapshot, so recorded engine and
tablebase references do not remain in a permanent “details pending” state.

The branch rail provides manual checkboxes and “compare all forked here.” The
same selection drives branch-selective PGN export. The comparison screen renders
an N-column board grid and per-branch strips; shared-prefix groups are one
position, not duplicated differences. Eight is a readability cap, not a data
integrity limit.

The strip band is derived from the same run snapshot and comparison payload. It
shows recorded cp/mate points, attributed structural and timing changes, and
piece routes computed from persisted moves; it never interpolates missing
evidence or ranks columns. Narrative mode groups those same facts into a closed,
deterministic causal template. Optional `compare` voice may rephrase only that
packet after the ordinary disclosure gate, and never receives learner branch
labels or intent text.

Forward simulation is scratch. `/simulate` walks at most four authored
variations for at most twelve plies in memory and writes no events, evidence, or
attempts. `/simulate-enter` explicitly promotes one result to a real branch with
origin `simulated`; only then does it enter replay, progress, compare, and PGN.

Prediction checkpoints record the learner's move before selecting the reply.
The atomic endpoint persists the exact policy distribution, mass, rank, and
applied engine identity and returns that same selection for the opponent ply.
The UI presents numbers only—never correct/incorrect, a score, or approval
colour. Pack schema 0.9 removes the old grading declaration.

Deep analysis accepts one to sixteen node ids and per-job MultiPV 1–8. The
shared Stockfish judge is reset to MultiPV 1 after a widened job, preventing a
request from changing later evaluations. Results still use the existing staged
evidence queue and writer-applied durable events.

Run schema v0.8 adds `Branch.origin` and `prediction.recorded`. SQLite migration
8 upgrades v0.7 snapshots, stamps every historical branch `played`, and never
infers prediction data that was not recorded.
