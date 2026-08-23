# Production hint-selector table — measured reach is not grounded explanation

**Status:** current seven-family RFC selector refuted `[V]`; a perspective-safe replacement and
end-to-end latency remain research work.

**Question.** What does the exact precedence table in `rfc/hint-distance.md` select when its real
constructors run over the fixed D1061 Stockfish lines, and can those selections honestly explain
the root move?

**Inputs.** The committed 64-position D1061 population, both recorded engine arms, the first four
legal PV plies, and the seven production constructors frozen in
`planning/evidence-foundation-ux/d1363-hint-selector-preregistration.md`. The executable instrument
is `tools/d1363-hint-selector-harness/`; the immutable input digest is
`sha256:53051e9671e801ecb71c209a052b54da53d97873b07d0c85298b8d70043d4162` and the three runtime
source files hash to
`sha256:9b9831400163b62a159377b8a9e1921509bfd665e9aa5b27687dc7f74839159c`.
All findings below are `[V]` against
`planning/evidence-foundation-ux/d1363-hint-selector-results.json` unless stated otherwise.

## Verdict

The proposed raw selector is not a grounded hint selector. It is a deterministic occurrence
selector over both players' actions. It fails the preregistered perspective gate in **28 of 72
non-empty arm/position rows**: 16/39 depth-12 selections and 12/33 100-ms selections explain an
opponent edge while the disclosed first move belongs to the root side. The failure is largest in
opening positions, where 18/28 non-empty rows select the opponent.

Filtering to root-side events prevents that exact misattribution, but does not establish why the
first move caused, enabled, avoided or answered the later event. It also lowers measured reach to
30/64 at depth 12 and 22/64 at 100 ms. Restricting to the first edge reaches 21/64 in both arms.
Those are diagnostic bounds, not candidate product policies.

The selector also fails its machine-local latency headroom: depth-12 p95 is **1,595.9 ms** against
the preregistered 1,400-ms boundary. The 100-ms arm is inside that boundary at 1,362.7 ms. These
figures exclude the engine request, transport, packet compilation and rendering, so they do not
satisfy the required cold/warm/provider-off end-to-end receipt.

The result returns `rfc/hint-distance.md` to authoring after a second, relation-aware research
generation. It does not reject progressive hints, the five disclosure distances, or any tactic
constructor.

## 1. Exact reach and perspective

| arm | raw reach | root-side reach | root-edge reach | raw opponent selections | raw differs from root-side |
|---|---:|---:|---:|---:|---:|
| depth 12 | 39/64 (60.9%) | 30/64 (46.9%) | 21/64 (32.8%) | 16 | 16 |
| 100 ms A | 33/64 (51.6%) | 22/64 (34.4%) | 21/64 (32.8%) | 12 | 12 |

Across all 150 candidates, **72 are root-side and 78 opponent-side**. There are no unclassified
edges because side to move is exact in every legal PV position. A majority-opponent candidate pool
is not itself wrong—the engine line contains alternating play—but it proves that precedence over
the undifferentiated pool cannot ground advice about the root move.

| arm / phase | candidates | raw reach | raw opponent selections |
|---|---:|---:|---:|
| depth 12 / opening | 36 | 15/24 | 9 |
| depth 12 / middlegame | 23 | 9/16 | 1 |
| depth 12 / cross-phase | 29 | 15/24 | 6 |
| 100 ms / opening | 17 | 13/24 | 9 |
| 100 ms / middlegame | 22 | 8/16 | 0 |
| 100 ms / cross-phase | 23 | 12/24 | 3 |

The phase split is descriptive only. This pack-shaped population is not a phase-balanced sample
of chess and cannot license phase-specific hint rankings.

## 2. The production family mix

| family | candidates | interpretation |
|---|---:|---|
| mate in one | 0 | honest zero incidence; permanent positive/negative constructors pass |
| forced mate through four attacker moves | 0 | honest zero incidence; permanent constructors pass |
| double attack | 8 | emitted with exact mover and targets |
| fork survives reply | 1 | exact bounded-reply predicate over a matched double attack |
| discovered attack executed | 8 | emitted with the moved screen and declared ray/target operands |
| loose piece | 130 | 30 gained, 57 lost, 43 preserved |
| promotion pressure | 3 | availability and reply-persistence booleans preserved, not upgraded to outcomes |

`loose_piece` supplies **86.7%** of all candidates and 58/72 raw selections. Family precedence
therefore does not make the table diverse in practice: once mate/fork families are absent, a
high-volume signed state change dominates. The three signs cannot be rendered as one positive
notion. In particular, `lost`, `gained` and `preserved` say what changed in the local reading; they
do not say that the root move is good or that a later opponent edge is its reason.

Zero mate incidence does not refute mate detection, and the one fork witness does not establish
usefulness. Permanent constructor fixtures prove ability to fire; this fixed population measures
only observed incidence.

## 3. What the measurement does and does not license

The result licenses four contract corrections:

1. Every horizon occurrence carries exact engine-line identity, root side, edge side, edge ply,
   actor, targets and signed/status operands. Catalogue `{id, version}` remains insufficient for
   occurrence identity.
2. The raw all-edge precedence policy is refused. An opponent action may be rendered as an
   **opponent threat or reply**, never as the reason for the root move merely because it appears
   later in the PV.
3. Root-side and root-edge filters remain research readings only. A replacement must declare a
   closed relation such as `root_action_event`, `opponent_reply_event` or a separately proven
   counterfactual relation; it may not infer causality or benefit from time order.
4. The complete line scan cannot be a default synchronous UX path until shared candidate caching
   and an end-to-end cold/warm/provider-off measurement clear the interaction budget.

It does **not** license the words *helpful*, *best*, *forced*, *wins*, *prevents* or *because*.
Those require an exact predicate appropriate to the family. The LLM may later render a sealed
relation; it cannot manufacture the relation.

## 4. Remaining exploration gate

The next generation must be preregistered before reading results and must close the research
receipt left open by the buildability review:

- define per-family typed perspective and polarity, including explicit opponent-threat fixtures;
- distinguish occurrence from a counterfactual relation to the root move;
- count every admission/refusal by phase and source, with exact occurrence identities;
- run from the shared score-free candidate/event packet rather than recompiling legal
  alternatives independently for every consumer;
- measure cold, warm and provider-off **end to end**, including request, compilation, disclosure
  packet and deterministic rendering;
- retain theory/authored/tablebase as independent adapters so engine abstention does not disable a
  theory-only nudge.

Until that lands, the honest product behavior is an unavailable engine-semantic nudge with other
grounded modules still eligible—not a raw PV string and not an LLM guess.
