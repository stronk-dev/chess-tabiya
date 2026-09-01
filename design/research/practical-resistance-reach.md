# `practical_resistance` reach after the float32 repair — D375 / D490

**Question.** On the exact 40 in-range roots used by the original R5 selector arm, how often does
current `practical_resistance` select, refuse by name, or fail, now that valid float32 policy mass
is admitted? Does that make the mode a general pack-level alternative, particularly for the two
in-range `hold` packs?

**Verdict.** **The arithmetic repair worked completely; the mode is real but conditional, not a
general pack policy.** Current code selects on **14/40 roots (35%)**, refuses honestly with
`PRACTICAL_RESISTANCE_UNDECIDABLE` on **26/40 (65%)**, and produces **zero internal/provider
errors**. Availability follows the root outcome: **0/22 side-to-move wins**, **10/12 losses**, and
**4/6 draws** select. The two `hold` packs split: all four sampled
`philidor-third-rank-hold` roots select, while both sampled `opposite-bishops-fortress-hold` roots
refuse.

This is not evidence for weakening the vacuity refusal. The refusal is the mode's honesty rule.
It is evidence that a single pack-level mode needs an explicit, recorded composition policy before
content can rely on it across learner deviations.

**Instrument.** `make practical-resistance-measurement` drives current production
`OpponentSelector`, the pinned Maia source/model, and retained Syzygy inputs. The disposable
instrument and its able-to-fail controls live in `tools/r5-maia-stability-harness/`; exact inputs
and deterministic results live in `planning/practical-resistance/` `[V]`.

---

## 1. Fixed population and authorities

The original R5 raw JSONL was discarded, but its committed summary retains all **40 unique exact
FENs**. The new harness refuses any other cardinality or duplicate population and seals that file
at SHA-256 `9aca0458abba70ed7488dfc76320f8d48fb3dc296def05b737ef5f1959e2219d`
`[V]`. Re-rooting each request at the exact recorded FEN preserves the board, side, clocks and
move identity consumed by both Maia and Syzygy; this measurement does not claim to reproduce the
discarded path metadata.

D457's retained exact-position JSONL maps all 40 FENs to **11 authored packs** and is sealed at
SHA-256 `896990af5b28d55d07fe2ce76746d5e8bad559b57f205a8656b33846ea34903d`
`[V]`. Two able-to-fail controls pin the historical denominator and its three mutually exclusive
outcome classes: 30 float-tolerance failures, five named undecidable refusals, five selections.

The current run used Maia source commit
`1e13597c42d4858b7cfd7cfdae01e297263364b2`, model
`maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe`, image ID
`sha256:b240b7c5c27ad8b578d856c4d8c1cabbc081dae5ef28840b03fd7b87f0530774`, and band 1500. The
harness verifies the image's source/model labels before probing. It retains **186 parsed tablebase
positions**, SHA-256 `db254364a94ad3fbd7ff02731cde5b0da71da563094795dde0c1783213808d93`,
with public-API rate limiting and retries beyond the source's negative-cache window `[V]`.

Every root ran three times through a fresh selector, defeating the in-process selection cache.
All **120/120 results** agree within root; `inconsistentRoots` is zero. A cached run needs no
tablebase network contact, and the result excludes timing so identical answers can reproduce
identical bytes.

## 2. Current result versus the confounded result

| Root outcome | Historical broken run | Current roots | Current selection | Current named refusal |
|---|---:|---:|---:|---:|
| win | included in 30 mass failures | 22 | **0** | **22** |
| draw | mixed | 6 | **4** | **2** |
| loss | mixed | 12 | **10** | **2** |
| **total** | 30 failures / 5 refusals / 5 selections | **40** | **14 (35%)** | **26 (65%)** |

The 95% Wilson interval for the 65% refusal rate is **49.5–77.9%**. This is a fixed-corpus
descriptive interval, not a claim about all tablebase positions or learner traffic.

The float32 fix closes the original defect exactly: none of the thirty former
`measured policy mass cannot exceed 1` errors survives. Those roots do not all turn into
selections; most reach the named vacuity branch the error previously masked. The historical
5/40 selection figure was therefore not a conservative estimate of current reach. It measured a
different program.

## 3. Why outcome class explains reach

Production first keeps replies that preserve the opponent's root result. For each candidate it
then measures Maia mass on **learner** replies that change the learner's resulting tablebase
class (`apps/server/src/opponent-selector.ts:751-831`) `[V]`.

If the opponent is already winning, the learner is losing after every preserving opponent reply.
A learner move cannot worsen below the loss class, so the measured conceding set is normally empty
and the mode must refuse. This is exactly what the fixed population shows: **22/22 opponent-win
roots refuse**. Conversely, where the opponent is losing, the learner is converting a win and can
often concede it: **10/12** select. Drawn roots are mixed (**4/6**).

That pattern corrects D375's original diagnosis. The refusal is not principally *"the
trivially-lost position where dragging the loss out is the whole job"* from the opponent's
perspective. It is most reliably the position where the **opponent is already winning** and there
is no learner advantage left for this objective to make difficult.

## 4. Pack consequence

The two named `hold` packs do not share one answer:

| Pack | Sampled roots | Selection | Refusal |
|---|---:|---:|---:|
| `philidor-third-rank-hold` | 4 | **4** | 0 |
| `opposite-bishops-fortress-hold` | 2 | 0 | **2** |

The small cells do not estimate each pack's future runtime distribution. They do refute the claim
that being an in-range `hold` pack is enough to make the mode available. No current authored draft
declares `practical_resistance` at all (**0/50 documents**) `[V]`, so this is a foundation decision
before content adoption rather than a live content regression.

The archived contract deliberately forbids silently falling back under the same applied-mode name
(`rfc/archive/resistance-spectrum.md` §2b/§2e) `[V]`. That ruling remains sound. The missing object
is an **explicit ordered composition**: attempt the measured objective when available; otherwise
apply a separately declared policy, recording both the abstention and the policy actually used.
Without it, one learner deviation into a vacuous outcome class can turn a valid pack declaration
into a run-stopping 422.

This successor is [[D2474]] and belongs to the active `bot-policy` author repair. The RFC currently
says `practical_resistance` inherits R5's shipped measured behavior unchanged; this dossier makes
that input stale. The author must preserve the selector's honest semantics while deciding whether
and how policies compose. An implementing agent must not invent the fallback.

## 5. Gate and limits

- D375 and D490 are answered and close.
- E4 remains unmet. A deterministic 35%-reach conditional objective is not evidence of believable
  multi-ply resistance, and the experiment did not measure realized drill length (the separate R5
  open question).
- The population is exact historical authored-pack material, not uniformly sampled tablebase
  states or learner traffic.
- The result measures availability and repeatability, not whether selected moves feel human.
- The mode's positive arm is still useful foundation for endgame conversion/holding pressure; the
  measurement narrows its composition boundary rather than refusing the primitive.

No LLM-generated chess judgement enters the result. Outcome classes and legal successors come
from Syzygy, policy mass comes from the pinned Maia model, and selection/refusal is current product
code.
