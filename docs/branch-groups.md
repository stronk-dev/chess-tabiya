# Branch groups

Branch groups let a learner capture two through eight candidate moves from one
position and then play every candidate as an ordinary branch. A group does not
replace the run tree or create a second game model: it is one durable fact that
names existing branches as a set. Those branches continue to rewind, receive
evidence, compare, and export through the normal runtime.

## Persisted model and replay

Run schema 0.9 adds `group.created`. Its payload records:

- a run-local group id and source node;
- the seed source: `hand_picked`, `authored`, `human_replies`, or
  `engine_top_n`;
- `fixed` or `per_branch` resistance;
- two through eight distinct `(branchId, seedMoveUci)` members; and
- for machine-seeded groups, the complete recorded opponent distribution that
  produced those candidates.

`groupsFromEvents` is the only group projection. A branch has no denormalized
group field, and group completion is derived from the member branches rather
than recorded as another event.

Read-back validates the record before exposing it. Every member must have a
direct child of the source node with the recorded branch and seed move; group
ids, member branches, and seed moves must be distinct; a branch can belong to
only one group; and machine sources must carry the matching recorded
distribution covering every seed. An existing child is adopted instead of
duplicated, so a move already played before group creation remains the same
attempt.

Machine-seeded child plies use `policyModeApplied: enumerated`. This means the
move was selected from an exposed distribution for the experiment; it does not
claim that the opponent policy sampled that move. Historical runs are upgraded
by storage migration 11, which stamps frozen literal versions `0.8` to `0.9`
without inventing group data.

## Creation and assistance gates

`POST /runs/:id/group` is writer-leased and accepts only the source, optional
resistance, and source-appropriate candidate/count input. Position, side to
move, pack, policy, and history come from the stored run.

- `hand_picked` validates the learner's explicit legal UCIs.
- `authored` resolves children from the registered pack's current spine node.
- `human_replies` records a human-common distribution (Maia in the
  engine-backed deployment) and is available only when the position is an
  opponent decision.
- `engine_top_n` obtains a strong-engine MultiPV distribution.

Machine sources reuse the shipped assistance gate. They are unavailable to
participant/spectator contexts and while feedback delivery is closed; hand and
authored sources remain usable because they do not expose hidden analysis.
Unavailable or undersized sources fail with typed errors rather than silently
creating a smaller or differently sourced group. `GROUP_SEEDS_UNAVAILABLE`
maps to HTTP 422 and `UNKNOWN_GROUP` to HTTP 404.

Strong-engine enumeration is serialized through the existing supervisor. Its
temporary MultiPV setting is reset after `bestmove`, while the request still
owns the shared engine process, so the next analysis cannot inherit it.

## Controlled resistance

`POST /runs/:id/group-reply` accepts only a group id plus the normal writer
credential. The server derives the active member, current FEN and history,
pack, requested policy, engine identity, and effective seed from durable run
state.

`fixed` resistance is implemented by a group-local reply journal over the
existing event log. When two member paths reach the same transpose key, a
compatible recorded opponent selection is returned byte-for-byte instead of
calling the selector again. Reuse also requires a compatible applied mode and
the same currently available engine identity, including the recorded applied Elo. A
theory-strict request may
reuse its recorded human-common off-spine fallback only for that same Maia
identity. An unavailable requested mode is refused rather than replaced with another policy.
If deployment capabilities or the applied band changed, the journal entry is skipped and
a fresh honest selection is made.

This journal is necessary because the Maia sidecar reports `seedHonored:
false`; a nominal fixed seed alone cannot promise identical replies. Under
`per_branch`, the journal is not consulted and member `i` uses the primary seed
plus `i + 1`.

## Client behavior

The drill screen can capture legal candidates without committing them, create
the group, and enter its first member. Grouped branches remain visible in the
ordinary branch rail. The group panel provides three semantic zoom bands:

- Overview: branch label, objective state, and terminal result;
- Summary: last move, plies, exact material count, checkpoints, and evidence
  absence;
- Boards: disabled boards for every member.

The horizontally scrollable grid is viewport-contained. It does not rank,
score, recommend, or prune candidates. Source and resistance sentences are
derived from the persisted group record.

Sequential advance is the default: the learner plays a member until choosing
the next one. Lockstep is an optional, versioned local preference that rotates
after each learner decision. Switching members uses the ordinary rewind path;
if that cancels staged evidence for a sibling, the panel shows the absence and
can explicitly request replacement analysis. “Compare group” sends the member
branch ids to the existing N-way comparison, and normal PGN export preserves
all selected variations.

## Measured envelope and limits

An eight-member hand-picked group took 1.265 ms in the local in-memory service
with mocked engines. This is a synthetic service measurement, not a storage or
network claim, and it is recorded rather than used as a test gate.

Current limits are deliberate:

- groups contain at most eight members, matching the comparison contract;
- runtime explorer counts now exist as disclosure-gated evidence, but the explorer is
  not a runtime seed source; corpus-derived choices reach groups only through authored packs;
- group membership is immutable; create another group to change the set;
- there is no group ranking, scoring, pruning, or special live-session voting;
- lockstep preference is local browser state, not shared run truth; and
- fixed resistance guarantees reuse only for the same position, compatible
  applied policy, and live engine identity—not deterministic Maia sampling in
  general.
