# Option collapse: what does the 8→3→3 marker actually detect?

**Question:** D53. The shipped `option_collapse` classifier marks a same-side span when legal
choices fall from at least 8 to at most 3 and remain at most 3 one turn later. The three constants
and the choice to count four promotion roles as four moves were detector conventions with no
measurement showing that they distinguish pivotal constraints from routine checks or recaptures
(`packages/runtime/src/pivotal.ts`).

**Instrument:** `tools/d53-option-collapse-harness/`, run by
`make option-collapse-measurement`. Its committed output is
`planning/live-marker-quality/d53-option-collapse-results.json`. Production code imports none of
the harness. `[V]`

## 1. Verdict

**Measured, but not validated as a generic “option collapse” live marker.** On the real-game
population the current predicate is a narrow repeated-check detector: **31/31 firings have the
marked side in check at both low-choice positions**. It finds no quiet constraint and fires zero
times on the current authored corpus. `[V]`

This does not mean the underlying facts are useless. The exact legal counts and check states are
rules-grounded evidence, and the fired continuation is highly unusual among legal continuations
from the same parent. But the unasked live sentence currently exposes only the count—*“One legal
move…”* or *“3 legal moves…”*—without naming the repeated-check mechanism or a learner question.
Calling that broad pivotal detection would claim more than the measurement establishes. `[V]`

**Recommendation `[M]`:** approve the alternative-continuation population as L2(ii)'s substitute,
remove the generic raw-count sentence from the unasked live tier, and preserve the operands for
on-request/retrospective modules. If the product wants a live event here, specify and validate the
narrow event actually observed—sustained checking constraint—rather than tuning 8/3/3 until a
generic label sounds plausible. This is an owner disposition because the archived RFC reserves
substitute-population approval to the owner.

## 2. Populations and method

The real-game arm walks every full path in the existing R2 fixture: **108 CC0 Lichess games**,
12 each in Bullet/Blitz/Rapid crossed with rating bands 1000–1399, 1400–1799 and 1800–2199. The
committed result embeds the fixture's source URL, byte range and SHA-256 identities. It contains
**6,991 played plies** and **6,667** eligible same-side spans. `[V]`

The content arm walks every root-to-leaf path in current non-browser draft packs, deduplicating
shared spans and shared ply identities within each pack. It contains **100 paths, 754 unique
plies and 555 eligible same-side spans**. This is a content-reach population, not a traffic
estimate. `[V]`

For every real-game firing, the harness returns to the position immediately before the first
low-choice state and enumerates every legal opponent reply, every legal response and every legal
next opponent move. A continuation co-signals only if it independently reaches both ≤3 ceilings.
That supplies the span-shaped counterfactual population required by `live-marker-quality` L2(ii).
Every legal continuation is weighted equally; implausible human continuations are therefore
overrepresented, just as in the standing legal-alternatives instrument. `[V]`

## 3. What fires

| Measure | Imported games | Authored corpus |
|---|---:|---:|
| Eligible same-side spans | 6,667 | 555 |
| Current 8→3→3 firings | 31 | 0 |
| Firings per played ply | 0.00443 | 0 |
| First low-choice position in check | 31/31 | — |
| Second low-choice position in check | 31/31 | — |
| Forced at either low-choice position | 16/31 | — |
| Recapture at the first low-choice position | 4/31 | — |
| Quiet, non-check, non-recapture firings | 0/31 | — |

`[V]` from the committed result.

The population contains **830** spans with check at either sampled position and **144** with check
at both, so the result is not caused by a corpus containing only checking lines. The predicate
selects 31 of those repeated-check spans and zero non-check spans. It is therefore selective, but
selective for a narrower semantic family than its name and raw rendering imply. `[V]`

Phase reach is also narrow: 19 firings classify as middlegame, four as endgame and eight as
unclear; none classify as opening. The authored result is honest-empty despite 50 spans touching
check and 13 having check at both sampled states. `[V]`

## 4. Alternatives: rare does not establish the right meaning

Across the 31 fired real-game spans, the first ≤3 state is reachable by a median **5.882%** of
legal opponent replies (p90 15%). After enumerating **1,206,199** three-ply continuations, only
**510** co-signal: pooled share **0.042%**, median per-span share **0.030%**, p90 **0.145%**.
No fired span exceeds the standing 18.6% co-signal reference. `[V]`

That is strong evidence for branch discrimination: the played checking continuation is unusual
among legal continuations. It is not evidence that the live count sentence helps a learner, nor
that “option collapse” denotes a general strategic event. The instrument labels legality,
check/recapture context and alternatives; it has no human usefulness judgement. `[V]`

## 5. The free parameters do not share one evidentiary status

The prior floor is nearly inert. With the two ceilings fixed at 3, imported firings are 33 at
floor 6 and **31 at floors 8, 10 and 12**. By contrast, keeping the prior floor at 8 and moving
both ceilings from 1 through 5 changes firings **6 → 16 → 31 → 46 → 71**. The event's volume is
therefore governed by the arbitrary low-choice ceiling, not by evidence for the claimed
high-to-low collapse. `[V]`

Asymmetric ceilings behave similarly: within {2,3,4} × {2,3,4}, imported firings range from 16
to 46. The current 3/3 cell is 31. No nearby cell is singled out by an external label, and this
pass deliberately does not select a best cell from the population used to inspect it. `[V]`

Promotion weighting has no observed effect: counting promotion destinations once rather than
four promotion roles produces exactly the same 31 imported and zero authored firings at the
current thresholds. The convention is mechanically real—the able-to-fail fixture proves a
promotion can add three counts—but it is unsupported and immaterial on both measured
populations. `[V]`

## 6. Producer, event and module must remain separate

The reusable evidence is smaller and cleaner than the current event:

- exact legal-move counts at three identified same-side positions;
- check state and the moves joining those positions;
- optional identities for forcing replies and recaptures;
- the alternative-continuation denominator and co-signal count.

Those operands can support a retrospective explanation such as a repeated checking sequence,
an on-request answer about available replies, a Review moment, or a drill objective. Which one is
interesting is a module decision, not a property of `legalMoves.length`. `[M]`

This is the same architecture D52 exposed from the other direction: retain precise vectors;
do not turn detector thresholds directly into unasked prose. D53 supplies no authority to delete
the evidence producer, grade a move, infer intent, or manufacture a strategic lesson.

## 7. Limits and owner decision

1. The 108-game fixture is deterministic and stratified, not representative of all chess or this
   product's eventual learners. `[V]`
2. Equal weighting of legal continuations exaggerates implausible choices. The comparison is
   valid against the standing legal-alternatives anchors, not an estimate of human frequency.
   `[V]`
3. Current packs are curated consequence paths and produce zero witnesses; they cannot validate
   or refute usefulness in ordinary play. `[V]`
4. No learner judged the sentence. This is a semantic and alternatives measurement, not an
   experience clearance. `[V]`

**Owner decision:** approve or reject this alternative-continuation population as L2(ii)'s
substitute, then choose whether the measured narrower meaning triggers L6 demotion of the raw
unasked sentence. Recommendation: **approve + demote**, retain the evidence, and route any future
live form through a named sustained-check module with its own validation.
