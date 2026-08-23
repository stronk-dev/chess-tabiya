# Relation-safe engine hints — honest reach is sparse and immediate

**Status:** perspective/sign contract answered for the fixed provider population `[V]`; shared-packet
end-to-end latency and owner usefulness remain open.

**Question.** After the raw all-edge hint policy failed, what survives when every occurrence has a
literal perspective relation and each family admits only the sign its operands can support?

**Inputs.** The complete 150-occurrence D1363 population, frozen before inspection by
`planning/evidence-foundation-ux/d1397-hint-relation-preregistration.md`. The disposable projection
is `tools/d1397-hint-relation-harness/`; the result is
`planning/evidence-foundation-ux/d1397-hint-relation-results.json`. It consumes the same immutable
D1061 input and runtime digest recorded by D1363 and recomputes no chess truth. All findings below
are `[V]` against that result.

## Verdict

A relation-safe selector is mechanically buildable, but the drafted seven-family engine ladder is
a **sparse supplemental source**, not a default hint system. Strict direct events reach **10/64
(15.6%)** positions in both engine arms. Allowing a later root-side event in the searched line
raises depth-12 reach to **16/64 (25.0%)** and leaves 100-ms reach unchanged at **10/64**.

This is the honest cost of refusing three false equivalences:

- an opponent event is not a reason for the root move;
- leaving or keeping one's own piece loose is not a helpful nudge toward an engine move;
- a passed pawn whose promotion is not available after every immediate reply is not a persistent
  promotion horizon.

The result does not justify widening the table after inspection. It confirms the required product
architecture: engine-semantic hints may be excellent when present, while cited theory, authored
guidance, tablebase facts and an honest empty state supply independent module paths.

## 1. What survived

| arm | strict direct | strict horizon | selected mix |
|---|---:|---:|---|
| depth 12 | 10/64 | 16/64 | 11 secured-loose-piece, 4 double attack, 1 discovered execution |
| 100 ms A | 10/64 | 10/64 | 6 secured-loose-piece, 2 double attack, 2 discovered execution |

The complete population contains 48 direct root events, 24 later root-side events and 78 opponent
events. After family/sign admission, **35/150 occurrences** remain. Refusals are exact and
exhaustive:

| refusal | occurrences | reason |
|---|---:|---|
| opponent-line event | 78 | a separate line/reply fact, never the root hint |
| mover created own loose piece | 16 | post-commit self-risk reading, not positive guidance |
| mover's own piece remained loose | 20 | preserved risk, no useful transition for this module |
| promotion not reply-persistent | 1 | both exact availability booleans are false |

`loose_piece:lost` means the mover's own previously en-prise piece is no longer en prise; this is
why it can support the literal direct reading “this move secures that piece.” It is not a generic
claim that a loose piece disappeared somewhere. The opposite signs are deliberately routed away
from the hint module rather than worded optimistically.

Mate-in-one and forced-mate remain honest-zero on this population. The sole fork-survival
occurrence is opponent-side and is therefore refused. Constructor fixtures still establish all
branches can fire; no zero is treated as a detector defect.

## 2. Immediate events are the stable part

The post-result cross-arm diagnostic has no acceptance threshold. It exists to price the policy,
not to retrofit one.

- Strict-direct is non-empty on the same 10 positions in both arms. Family/status/relation agrees
  10/10, first move 9/10 and exact occurrence 9/10.
- Strict-horizon is non-empty on 16 positions in either arm but only 10 in both. The six added
  depth-12 positions disappear entirely at 100 ms; among the 10 shared positions,
  family/status/relation agrees 9/10 and exact occurrence 8/10.

Later root-side occurrence is therefore materially budget-sensitive in this small fixed sample.
It may remain a disclosed “in this searched line” fact, with engine budget in its identity. It must
not become the availability backbone or a budget-independent lesson.

## 3. Contract the RFC may consume

The selector may emit only these relations:

1. `root_direct`: the event holds after the first root move;
2. `root_followup_in_line`: the root side produces the event on ply 3 of this exact searched line;
3. `opponent_line_event`: recorded and routable to a separate reply/threat surface, refused from
   this root hint.

The third relation is not called a threat without an additional adverse-target predicate. The
second never says the first move caused the event. Every rendered sentence must retain the search
identity/budget, exact actor/targets and family sign/status.

The family admission table is now measured rather than prose: mate exact; bounded forced-mate
proof; gained double/discovered attack; matched fork-survival; `loose_piece:lost`; and promotion
only when both pass availability and all-reply persistence are true. Other signs stay available to
post-commit Review modules with their own eligibility rules.

## 4. Remaining gate

This closes the perspective/polarity research arm. It does not clear implementation:

- D1071's shared score-free candidate/event packet must supply the occurrences without independent
  legal-alternative recompilation;
- the sealed per-rung disclosure packet must prevent lower rungs and the optional LLM from seeing
  moves/squares they may not render;
- cold, warm and provider-off latency must be measured through request → packet → relation selector
  → disclosure compiler → deterministic rendering;
- theory-only, authored-only and tablebase-only positive fixtures must remain reachable when the
  engine selector is empty;
- owner play decides whether the sparse exact hints are useful and whether later-line language is
  understandable. No LLM or offline metric substitutes for that judgment.

The right 1.0 result is not “a hint on every move.” It is a quiet module that speaks precisely
when grounded evidence survives, with other grounded sources composing around its honest silence.
