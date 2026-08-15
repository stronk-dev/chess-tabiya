# RFC: Live marker quality — the admission rule for anything that speaks unasked

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/05-in-run-experience.md` §3 (the assistance ladder and its 2026-08-14
  rung-0 scope corrections), §3-forms (*"render the same content as a sentence; if the sentence
  would be refused, so is the overlay"*), §3a (silence is the default, disclosure is
  learner-initiated), §5a (the four author-free forward detectors)
- **Exploration gate:** `design/research/census-hint-false-positives.md` (R3, 2026-08-15) — the
  first measurement of hint *usefulness* in the repo. Its §5 records that a **shipped** live
  marker has a **79.9%** false-positive rate; `design/BACKLOG.md:114` ledgers that as **D50 🐞**
  and explicitly declines to auto-fix it, because *"narrowing it is a live-surface change and
  belongs in an RFC"*. This is that RFC.
- **Depends on:** nothing unlanded. It reads `rfc/transition-primitives.md` §5.3 and §5.4 but
  does not depend on that RFC landing — §5 below exists precisely because it might not.
- **Parent / amends:** amends `rfc/archive/adaptive-guidance.md` §4 (the author-free pivotal
  marker projection it shipped). Amends it at the **surface**, not at the detector: every
  sub-kind that RFC specified still fires, is still recorded, and still renders on the surfaces
  the learner asked for.
- **Supersedes / superseded by:** —
- **Planning:** `planning/live-marker-quality/` (once implementing)


> **OWNER RULING 2026-08-15 (late) — open question 2 is decided: §6.2's conservative default
> STANDS.** D51 is closed by gating the marker behind the stronger `humanSplit` permission. No
> third permission value for mass-only rung-3 content. The owner accepted the stated cost with
> open eyes: the marker leaves participants and spectators entirely, and leaves solo play until
> delivery opens — which under `attempt_end` re-closes on the next committed move. Recorded as
> cheap to reverse, and worth revisiting after the surface is actually used rather than
> pre-emptively.

## Summary

R3 measured whether a census-built hint is worth reading and produced two results this repo did
not have: a **mechanical usefulness gate** (T ∧ C ∧ D) and the finding that **firing rarity does
not predict usefulness** (Spearman ρ = −0.143). It applied the gate to a marker that was being
*proposed* — `defended_duty_acquired`, refused at 29.5% clearing and 0.61× lift — and, in
passing, to a marker that is **already shipped and live**: `irreversibility`
(`packages/runtime/src/pivotal.ts:83`), whose three rendered sub-kinds clear the gate on **2.7%**
of a 13.4% firing rate — a **79.9% false-positive rate**. We were holding a proposal to a bar the
shipped surface fails.

This RFC does three things. It **audits all four kinds on the live surface** and states, per
kind, what evidence exists — which for three of the four is *none*. It **fixes D50** by narrowing
the live `irreversibility` marker to `last_of_role`, the one sub-kind that clears the gate,
without removing anything from the on-request and retrospective surfaces. And it proposes the
**standing admission rule for the live surface**, so the next marker proposal is settled by
measurement rather than by argument — which is R3's most reusable output, and the reason this RFC
is worth more than its diff.

The governing asymmetry, stated once and used everywhere below: **an 89%-false-positive
*on-request* reading is admissible and an 89%-false-positive *live* reading is not**, because
`design/05` §3a makes silence the default and disclosure learner-initiated. The learner who opens
a panel elected the cost. The learner who is spoken to unasked did not.

## Motivation

### What R3 found on the shipped surface

`design/research/census-hint-false-positives.md` §5, over 634 spine transitions from 37 committed
packs and 15,989 enumerated legal alternatives:

> `move_irreversibility` clears C by construction and only **2.7%** clear T — the `last_of_role`
> subkind. `castled`, `pawn_break` and `clock_zeroed` all restate the move the learner just
> played. This matters beyond this RFC, because `irreversibility` is **already a shipped live
> marker** (`packages/runtime/src/pivotal.ts:83`).

and §7c, restricting to the three sub-kinds the shipped code actually renders:

> it fires on **13.4%** of transitions and clears T on 2.7% — a **79.9%** false-positive rate,
> because `castled` and `pawn_break` restate the move the learner just played and only
> `last_of_role` names a fact about the board.

The dossier declined to propose a fix, correctly: it is a research pass, and the live surface is
an RFC-tier object. `design/BACKLOG.md:114` recorded D50 and left it unowned. Unowned is the
problem — a measured defect on the surface that speaks to a learner unasked is not a backlog
item that ages gracefully.

### Why the fix is the smaller half of this RFC

R3 was commissioned to judge one proposed marker. It produced an **instrument**: three mechanical
necessary conditions (T, C, D), an alternatives population to evaluate them against, and two
negative results about method that are worth more than either verdict.

**Method result 1 — selectivity does not predict usefulness.** ρ(firing rate, FP rate) =
**−0.143** (dossier §6). The rarest leaf is not the cleanest; the cleanest leaf
(`slider_lines_changed`, 41.7% FP) is the second-commonest (54.1% firing). "It fires rarely, so
it must be informative" has now been used and invalidated in two drafts. This RFC's rule
therefore forbids firing rate as *quality* evidence while retaining it as *cost* evidence — the
same number, two different jobs, and §3 keeps them apart by name.

**Method result 2 — the alternatives axis is load-bearing.** A primitive measured only on an
authored spine is measured on **endorsed moves**, so anything that fires on mistakes looks rare
there. Dossier §7b states the mechanism: *"overload is something bad moves create"* — hence
`defended_duty_acquired` signalling on 2.1% of played moves against 3.4% of quiet alternatives,
a lift of **0.61×**. And §6 records the near-miss this axis caught: T and C alone would have
recommended putting `slider_lines_changed` live, and its **1.05×** lift exposes it as *"R2's
renderer-not-detector in a new costume."* Any claim that a marker is informative must be measured
against the moves **not** played, or the process prefers the wrong instruments.

### Scope

**In scope:** which `PivotalKind` firings render on the live (unasked) surface; the standing rule
that decides that for future kinds; the D48 rendering-correctness defect on the same function,
re-homed here if `rfc/transition-primitives.md` sheds it (§5).

**Explicitly out of scope:** the detectors themselves (`irreversibility`, `phase_change`,
`human_divergence` and `option_collapse` continue to fire exactly as
`rfc/archive/adaptive-guidance.md` §4 specified); the on-request reading; the story, comparison
and evidence-packet surfaces; the transition-primitive grammar; any pack schema change; any new
research. This RFC ships **no new detection and no new sentence**. It removes two sentences from
one surface, adds a rule, and fixes a cast.

## Specification

### 1. The live surface today — a complete audit

#### 1.0 What "live" means mechanically, because it is narrower than it sounds

The live path is exactly one derivation and one component:

| Step | Site | Behaviour |
|---|---|---|
| Gate | `apps/web/src/lib/DrillScreen.svelte:277` | `assistance.markers === "live" ? pivotalMarkers(run, run.activeCursor.branchId) : []` |
| Default | `packages/runtime/src/assistance.ts:16-18` | `SILENT_ASSISTANCE` has `markers: "off"`; `DrillScreen.svelte:132` initialises to it and `:592` loads the learner's stored choice |
| Permission | `packages/runtime/src/assistance.ts:29` | `markers: "free"` — **unconditionally**, for every role and whether or not disclosure has opened |
| Render | `apps/web/src/lib/Timeline.svelte:75` (and `:48` for ply 0) | an **unlabelled dot** with `aria-label` *"Open pivotal marker at ply N"* |
| Disclosure | `DrillScreen.svelte:925-929` | clicking the dot opens a modal whose text is `renderPivotalMarker(marker)` |

Three consequences, all verified and all load-bearing for what follows:

1. **The unasked payload is the dot, not the sentence.** `DrillScreen.svelte:278` builds
   `{ nodeId, label }` rows where `label = marker.kind.replaceAll("_", " ")`, and
   `Timeline.svelte:75` **discards** `label` — contrast `:74`, where shape markers do render
   theirs. So the live disclosure is *"something the convention calls pivotal happened at this
   ply"*, and the sentence is one click away. That is a weaker unasked claim than "the product
   told the learner X", and this RFC does not overstate it.
2. **It is still an unasked claim, and a false-positive one is still a cost.** A dot on a ply is
   an assertion that this ply is worth returning to; it steers the rewind decision, which is the
   product's core loop. And `renderPivotalMarker` is the marker's *only* text surface, so a wrong
   sentence there is not one signal among several — it is the entire content of the disclosure.
3. **`markers: "live"` is opt-in but not opt-in *per kind*.** A learner who wants the one useful
   marker has to accept all of them. That is what makes the aggregate false-positive rate the
   right unit of judgement, not the per-kind one.

`markers` being off by default is a mitigation and is why D50 is a defect rather than an
incident. It is not a defence: `rfc/transition-primitives.md` §5.4 already stated the principle —
*"no learner meets it without opting in — but opting in should not buy noise."*

#### 1.1 The four kinds

`PivotalKind` (`packages/runtime/src/pivotal.ts:10`) has four members. All four reach the live
surface through the single gate above; none is separately switchable.

| Kind | Detector | Fires on | Rung | Measured? | Live disposition under §3 |
|---|---|---|---|---|---|
| `irreversibility` | `pivotal.ts:41-57`, pushed at `:83` | castling; a capture that empties a role for a colour; a pawn move that creates or resolves pawn contact | 0 | **Yes — fails.** 13.4% firing, 2.7% clearing, **79.9% FP** | **Narrowed to `last_of_role`** (§4) |
| `phase_change` | `pivotal.ts:77-81` | `classifyPhase` crossing definite→definite band, never from or into `unclear` | 0 (+ author-declared) | **No** | Grandfathered, measurement obligation, **predicted to fail axis D** (§6.1) |
| `human_divergence` | `pivotal.ts:59-69`, pushed at `:93` | a recorded `opponent.move_selected` with `policyModeApplied === "human_common"` whose normalised masses have max ≤ 0.50 and ≥ 3 candidates ≥ 0.15 (`:66`) | **3** | **No** | Grandfathered, **plus a permission fix** (§6.2) |
| `option_collapse` | `pivotal.ts:85-92` | same-side legal-move count ≥ 8, then ≤ 3 at two consecutive same-side decisions (`:90`) | 0, by the §3 redefinition | **No** | Grandfathered, measurement obligation (§6.3) |

#### 1.1a `irreversibility` — measured, and it fails

Three sub-kinds, in the detector's own precedence order (`pivotal.ts:46`, `:48`, `:49-55`), at
most one marker per transition:

| Sub-kind | Fires when | Sentence | R3 verdict |
|---|---|---|---|
| `castled` | `mover.role === "king"` and the king moves two files (`:46`) | `"white castled."` (`:103`) | **Fails T.** The learner castled. The marker restates the move |
| `last_of_role` | the move captures, and the captured colour then has zero pieces of that role (`:48`) | `"black has no queens remaining."` (`:104`) | **Clears T and C.** It is a fact about the board's remaining material, not about the move |
| `pawn_break` | a pawn capture, or a pawn move that newly attacks an enemy pawn (`:49-55`) | `"white created or resolved pawn contact."` (`:105`) | **Fails T.** Dossier §3d: *"the learner played the pawn capture. The marker restates the move"* |

R3's axis-D numbers for the leaf are the best in its table and belong to `last_of_role`
specifically, because it is capture-only: **2.7% of played moves signal against 0.2% of all
alternatives and 0.0% of quiet alternatives**, and within a signalling position only **9.9%** of
the alternatives also signal (dossier §6) — against 18.6% for the refused
`defended_duty_acquired` and 52.8% for routing, which R2 killed. On the axis that matters,
`last_of_role` is the strongest instrument the repo has measured.

**Phase honesty, stated because it constrains where the surviving marker is worth anything.**
`move_irreversibility` signals on **0.0%** of 236 opening and **0.0%** of 18 middlegame
transitions, **1.2%** of 259 endgame and **11.6%** of 121 cross-phase (dossier §5). The surviving
live marker is an endgame-and-cross-phase instrument. In an opening pack it will essentially
never appear, and this RFC claims no opening value for it.

Two smaller findings on the same code path, recorded rather than fixed here:

- `IrreversibilityDetail` carries `queensOff` (`pivotal.ts:13`), set at `:48` when the capture
  leaves both colours queenless — the fact `rfc/archive/adaptive-guidance.md` §4b called *"the
  version of this fact players actually track"*. `renderPivotalMarker:104` never reads it. A set,
  named, never-surfaced field on the one sentence that survives §4. See open question 3.
- `legalCount` (`pivotal.ts:23-30`) scores a pawn move to the last rank as **4** legal moves
  (`:27`). That is arithmetically right and interacts with the `≥ 8` / `≤ 3` constants at `:90`
  in a way nobody has measured; noted under §6.3, not changed here.

#### 1.1b `phase_change` — unmeasured

Fires at `pivotal.ts:79` when `classifyPhase(node.fen).phase` is definite and differs from the
last definite phase seen on the path; `:77-81` guarantees no marker from or into `unclear`.
Renders `"opening → middlegame, detected by Tabiya's phase bands."` (`:99`).

**No dossier in `design/research/` measures it.** Grepping the research tier for
`phase_change` / `classifyPhase` returns nothing; R1, R2 and R3 all measured transition
primitives, not this detector. Its firing rate on the pack corpus is unknown, its
false-positive rate under T/C/D is unknown, and — the important one — **its lift against
unplayed alternatives has never been computed.** §6.1 states why that number is the one to get
and why it is likely to be near 1.0.

#### 1.1c `human_divergence` — unmeasured, and the only rung-3 source on the live surface

Fires at `pivotal.ts:59-69` from persisted `opponent.move_selected` events; abstains structurally
when there are no candidates, no masses, or a non-Maia policy mode (`:61`, `:63`). Renders
`"Maia-1500's recorded policy split: 31% / 24% / 19% of recorded mass."` (`:100`).

Three properties, verified:

1. It marks the node the **opponent** moved from, not the learner's pending decision, so it
   leaks nothing about the move the learner is about to make. That is why it survives ADR-0006
   at all.
2. It names **no moves** — only normalised masses and the engine identity. The `humanSplit`
   endpoint two lines away in the same modal (`DrillScreen.svelte:935`) names
   `candidate.moveUci`. The marker is a materially weaker disclosure than the endpoint.
3. **And it is not gated like one.** `permittedAssistance` (`assistance.ts:29`) returns
   `humanSplit: "locked_off"` unless the viewer is solo-or-host *and* `feedbackDeliveryOpen`;
   `markers` is `"free"` unconditionally. `DrillScreen.svelte:934` enforces the humanSplit gate.
   `:929` — three lines above, same modal — renders the divergence sentence with no such check.
   **A participant or spectator with markers on receives rung-3 Maia distribution content that
   the same screen explicitly locks them out of five lines later.** That asymmetry is not
   documented in `design/05` §3a-i, is not stated in `rfc/archive/adaptive-guidance.md` §4d, and
   is not a measured question. §6.2 closes it.

The kind's three constants (0.50 / 0.15 / 3) are pinned parameters under adaptive-guidance §2b,
*"revision triggered by the marker rendering as routine noise in playtest"* — a revision trigger
that has never fired because nobody has looked.

#### 1.1d `option_collapse` — unmeasured, and its constants were chosen by the detector

Fires at `pivotal.ts:88-90`: for each colour, at the first same-side decision of a span where
`prior.count >= 8 && first.count <= 3 && second.count <= 3`. Renders `"One legal move is
available: forced under Tabiya's count convention."` or the n-move form (`:101`).

It is honest about its rung: `design/05` §3's 2026-08-14 correction says option collapse *"needs
reasonable continuations, which is evaluation, so it is rung 2/3 unless redefined as raw
legal-move count"*, and `rfc/archive/adaptive-guidance.md` §4e took the redefinition completely.
The shipped code counts raw legal moves; no evaluation is read.

What is **not** established is anything about usefulness. The three constants are the detector
choosing what to look at — the exact free-parameter hazard `rfc/transition-primitives.md` §5.4
worried about in a new marker and never applied to an old one. The `≥ 8` prior and the
two-consecutive condition are argued in §4e from first principles (*"a one-off spite check is not
a funnel"*), which is a good argument and is not a measurement. Firing rate, FP rate and lift are
all unknown.

#### 1.2 Audit conclusion

**One of four live kinds has been measured. It failed. The other three have not been measured at
all, and this RFC does not assert that they are fine.** Two of the three (`phase_change`,
`option_collapse`) rest on arguments that predate any usefulness instrument; the third
(`human_divergence`) additionally carries a permission bypass that is a defect independent of
usefulness.

### 2. The asymmetry that decides every case here

`design/05` §3a:

> Assistance is *available* — the rail exists, the ladder is honest, the learner may open it —
> but the default during committed play is **silence**, and everything the product knows arrives
> after the commitment.

That is why R3's headline number does not condemn the on-request reading. **6.18 observations per
ply, 0.68 informative, 89.0% FP at the observation level** (dossier §5) is a bad number for
anything that speaks unasked and an acceptable one for a panel the learner opened, for the reason
`rfc/transition-primitives.md` §5.2 already gave: *"a true answer to a question the learner asked
is not noise; the learner chose the cost."*

Stated as the rule this RFC applies:

> **The false-positive budget of a surface is set by who initiated it.** On a learner-initiated
> surface, a false positive costs the learner a sentence they chose to read; the remedy is theirs
> (stop reading, close the panel) and the product's honesty is intact because every sentence is
> true. On an unasked surface, a false positive spends the learner's attention without their
> consent, and — because a marker is an implicit claim that *this ply is worth returning to* — it
> also mis-steers the rewind decision, which is the product's core loop. **The live surface is
> therefore held to a per-firing standard, and the on-request surface to a truth standard.**

Two corollaries used below:

- **Demotion, not deletion.** A kind that fails the live rule is moved to the on-request and
  retrospective surfaces, where it was already admissible and where it stays useful. Nothing in
  §4 removes a fact from the record, the evidence packet, the story projection or the comparison
  strip.
- **Silence is not a verdict.** `rfc/archive/adaptive-guidance.md` §4d already made this
  normative for divergence abstention: *"absence of a marker is never a verdict that the moment
  was routine."* Narrowing the live set narrows what the product claims, not what happened.

### 3. The standing admission rule for the live surface

Normative. It governs `PivotalKind` today, and any future kind, sub-kind, board overlay, arrow,
halo, ambient cue or spoken line that fires **without the learner asking for it in that
moment** — `design/05` §3-forms already requires this: *"render the same content as a sentence;
if the sentence would be refused, so is the overlay."*

> **A firing may appear on the live surface only if it satisfies L1–L4. A kind may be *added* to
> the live surface only with L5's evidence. L6 governs what happens to everything else.**

**L1 — Per-firing necessity (no free parameter).** Live admission is a property of the
**firing**, not of the kind. A firing renders live only if it individually clears:

- **(T)** it is not a restatement of the move just committed — its cause is a departure, a
  discovery, a block, a capture, or a third piece, not what the moved piece does from the square
  the learner chose;
- **(C)** it names something contested under the rules alone — a 0-versus-nonzero status, never
  a value comparison and never a count balance (`design/05` §3's 2026-08-14 correction: counts
  are exact, *"pressure balance" as a conclusion* is not rung 0).

Definitions and their grounding are `design/research/census-hint-false-positives.md` §3b, which
is normative for this rule. Where the same predicate can be evaluated at detection time, it is
evaluated there, and the live false-positive rate against T and C is **0% by construction** —
which is the point. **L1 dissolves the threshold problem rather than solving it:** there is no
rate to pick, no band to defend, and no argument about where the line goes.

A kind whose T ∧ C-clearing subset is empty is simply not live. A kind whose subset is non-empty
is live *for that subset only*.

**L2 — The alternatives axis is mandatory, and rarity is not evidence of quality.** A kind
proposed for the live surface must be measured against the **enumerated legal alternatives of the
same parent positions**, and must report both:

- **lift** = (signal rate on played moves) ÷ (signal rate on quiet alternatives). **Lift < 1.0
  refuses outright** — a marker that describes unplayed moves more often than played ones is
  describing the position, not the move (R2's *renderer, not a detector*; R3 §6);
- **within-position co-signal share** — given the played move signalled, the share of the same
  position's other legal moves that also signal.

Measured precedents, which is what a bar made of anchors rather than of a chosen number looks
like: **9.9%** co-signal — `last_of_role`, admitted; **18.6%** — `defended_duty_acquired`,
refused (on the majority-informative bar, with 0.61× lift); **32.5%** — `slider_lines_changed`,
refused on this axis alone; **52.8%** — routing, killed by R2 at 98.7% FP. A proposal landing
above the highest admitted anchor and below the lowest refused one is an owner call, not an
implementer's.

**Firing rate is inadmissible as quality evidence and admissible as cost evidence.** ρ = −0.143
(R3 §6) settles the first; L3 is the second. The same number, two jobs, and conflating them is
the error §5.4 made.

**L3 — Volume ceiling on the union, not per kind.** The learner sees the union of all live kinds,
so the budget belongs to the union. **The admitted firings of all live kinds together must not
exceed 1 per 10 plies on the alternatives population** (the learner-proxy of R3 §2, since real
Just Play is closer to it than to an authored spine).

This is a chosen number and says so. Its defence is that it sits an order of magnitude below the
two confetti cases the archive already refused by argument — halfmove-clock irreversibility,
*"true of half the moves in a game"* (adaptive-guidance §4b), and un-suppressed check spam (§4e)
— and roughly 3× above the one instrument that clears L1 and L2 (`last_of_role`, 2.7% on spines).
It is the first budget anyone has written down for this surface; R3 measured the union at **6.18
observations per ply** on the on-request reading and nobody had a number to compare it to.

**L4 — Rung and disclosure discipline.** Unchanged law, restated so the rule is one surface:

- **(a)** The sentence states a fact with its scope and its provenance, never a verdict. `BANNED_JUDGEMENTS`
  (`packages/runtime/src/voice.ts:21`) is the mechanical floor; law 8 / ADR-0005 is the ceiling.
  A marker may say *"black has no queens remaining"*; it may never say that this is good, bad,
  a mistake, or a moment the learner should have played differently.
- **(b)** No live firing may disclose more than the same viewer could obtain **on request at that
  moment** under `permittedAssistance`. A marker channel may not route around a permission the
  product enforces on the endpoint that carries the same source. (This is the rule §6.2 applies
  to `human_divergence`.)
- **(c)** No live detector reads an evaluation. `design/05` §3a's forward/backward table and
  adaptive-guidance §4f are unchanged: eval swing is backward-only, and
  `retrospectivePivot` (`packages/runtime/src/adaptive.ts:5`) is where it lives.

**L5 — The burden is on the addition.** A new live kind arrives with a dossier in
`design/research/` reporting T, C, D, lift, co-signal share, firing rate, phase split, and the
corpus it was measured on. **Argument is not evidence, and selectivity is not evidence.** A
proposal without an alternatives measurement is refused without reading the argument, because R3
§6 showed that T and C alone would have recommended the wrong instrument.

**L6 — Demotion, grandfathering, and the standing obligation.** The rule is deliberately
asymmetric between adding and keeping:

- **Failing a measurement removes a firing from the live surface** and demotes it to on-request,
  by amendment of the owning RFC. This is what §4 does to `castled` and `pawn_break`.
- **Lacking a measurement does not.** Removing an unmeasured kind by argument would be the same
  error as admitting one by argument, run backwards. Kinds live before this RFC are
  **grandfathered** — and every grandfathered kind is **recorded as unmeasured on the live
  surface's register (§3.1) and carries a standing R-lane measurement obligation.** Nobody may
  cite a grandfathered kind as precedent for a new one.
- **A grandfathered kind that is later measured and fails is demoted automatically**, under this
  rule, without a new RFC — a one-line change to the admission predicate in §4.2 plus a test.
  That is what makes the rule *standing* rather than a one-off ruling.

#### 3.1 The live-surface register

Normative and maintained in this RFC, as the single place where the state of the live surface is
readable. Amending it is how a kind's status changes.

| Live kind / sub-kind | Evidence | Admitted live | Rule |
|---|---|---|---|
| `irreversibility:last_of_role` | R3 §5, §6: 2.7% signal, 0.0% on quiet alternatives, 9.9% co-signal, T ∧ C by construction | **yes** | L1, L2 |
| `irreversibility:castled` | R3 §5, §7c: fails T | **no** — on-request only | L1(T) |
| `irreversibility:pawn_break` | R3 §5, §7c: fails T | **no** — on-request only | L1(T) |
| `phase_change` | **none** | grandfathered | L6 |
| `human_divergence` | **none** | grandfathered, gated per §6.2 | L6, L4(b) |
| `option_collapse` | **none** | grandfathered | L6 |
| `defended_duty_acquired` | R3 §7: 29.5% clearing (upper bound), 0.61× lift | **never admitted** — refused before landing | L2 |

### 4. The D50 fix

#### 4.1 The disposition, and it is not "drop the other two"

Narrowing to `last_of_role` is right, and it is right on the evidence rather than by elimination:
`last_of_role` clears T (it is a fact about remaining material, not about the move), clears C
vacuously (irreversibility is a moment marker), and is the **strongest instrument in R3's D
table** — 0.0% of quiet alternatives fire it, 9.9% of a signalling position's alternatives
co-signal.

`castled` and `pawn_break` are **demoted, not deleted**. Both remain:

- detected, unchanged (`pivotal.ts:41-57` is not modified);
- rendered, unchanged, on every learner-initiated and retrospective surface — the comparison
  strip (`packages/runtime/src/compare-strips.ts:38`), the story projection
  (`packages/runtime/src/story.ts:78`), and the server evidence packet
  (`apps/server/src/guidance.ts:34`), all of which call `pivotalMarkers` and are opened by the
  learner or reached after the outcome;
- available in the modal when the learner opens a dot that another kind placed.

This is the §2 corollary: a fact that restates the move is a poor thing to volunteer and a fine
thing to answer with. *"White created or resolved pawn contact"* in a post-game story slide is a
true statement about a moment the learner is reviewing on purpose.

#### 4.2 The mechanism

A new exported projection in `packages/runtime/src/pivotal.ts`, so the rule is single-sourced and
testable in the runtime rather than duplicated in the client:

```ts
/** §3 L1: the per-firing admission predicate for the live (unasked) surface. */
export function liveAdmitted(marker: PivotalMarker): boolean;

/** pivotalMarkers, filtered to firings admitted live. The only projection the client's
 *  `markers: "live"` path may call. */
export function liveMarkers(run: DrillRun, branchId: string): readonly PivotalMarker[];
```

`liveAdmitted` is a `switch` over `marker.kind` ending in a `never` binding (the D26 law), with
exactly one non-trivial arm today:

- `irreversibility` → `detail.subkind === "last_of_role"`;
- `phase_change`, `human_divergence`, `option_collapse` → `true`, each carrying a comment naming
  its §3.1 register row as **grandfathered-unmeasured** — so the next reader of this function
  sees the obligation rather than an endorsement.

`human_divergence`'s arm additionally takes the §6.2 permission argument; see below for the
signature consequence.

**Call-site change, and it is one line.** `DrillScreen.svelte:277` calls `liveMarkers` instead of
`pivotalMarkers`. Everything downstream of `projectedPivotal` — the timeline rows at `:278`, the
modal filter at `:279`, `openPivotalMarker` at `:329` — is unchanged and correctly narrows with
it, because a dot that is never placed cannot be opened.

**Sites that do not change**, verified by grep for `pivotalMarkers` across `packages/` and
`apps/` excluding tests: `compare-strips.ts:38`, `story.ts:78`, `guidance.ts:34`. All three are
learner-initiated or post-outcome and keep the full marker set. `packages/runtime/src/index.ts:39`
gains the two new exports.

#### 4.3 What the learner sees change

The timeline loses dots at castling plies and at pawn-contact plies when `markers: "live"` is on.
On the pack corpus that is the difference between ~13.4% and ~2.7% of plies carrying an
irreversibility dot. In an opening pack, effectively all of them: R3's phase split records
**0.0%** irreversibility signal across 236 opening transitions, so an opening drill's
irreversibility dots go to zero. That is the intended result — every one of them was a
restatement of a move the learner had just played and watched.

### 5. D48 — the rendering defect, and whether it is still owned

`design/BACKLOG.md:117` records **D48 🐞**: `renderPivotalMarker` (`pivotal.ts:98-106`) tests
three kinds and then falls through at `:102` with `marker.detail as IrreversibilityDetail`, so a
marker of an unhandled kind renders `"… created or resolved pawn contact."` — **a wrong sentence
shown to a learner, silently**, because the cast defeats the exhaustiveness check.

`rfc/transition-primitives.md` §5.3 fixes this, and its criterion 7 gates it. **But it fixes it
as a side effect of widening `PivotalKind` by one**, and that widening is now withdrawn: that
RFC's own banner (`:105-107`) reads *"Take the pre-authorised fallback: remove
`defended_duty_acquired` from the live tier"*, and §5.4's fallback is *"`"defended_duty_acquired"`
is removed from `PivotalKind` … one enum member."*

**So the fix goes with it.** With no fifth kind, §5.3's motivation (*"a latent defect that the
widening would trip"*) evaporates, and criterion 7's regression test — *"constructs a
`defended_duty_acquired` marker and asserts it does not render 'created or resolved pawn
contact'"* — cannot even be written, because the kind no longer exists. A defect that is only
fixed by a change that is no longer happening is an unfixed defect.

**This RFC re-homes it.** It belongs here on the merits regardless of the accident: D48 is a
correctness defect on **the marker's only text surface**, and §1.0 established that
`renderPivotalMarker` is exactly that — `Timeline.svelte:75` discards the `label`, so the modal
sentence is the entire disclosure. Also, this RFC is now the second consumer of that function's
shape (`liveAdmitted` switches on the same `kind`), which is precisely when a non-exhaustive
dispatch stops being latent.

**The fix, unchanged from transition-primitives §5.3 minus its dependency:**

- `renderPivotalMarker` becomes a `switch` over `marker.kind` ending in a `never` binding.
- **All six existing outputs across the four kinds are byte-identical**: `phase_change` (`:99`);
  `human_divergence` (`:100`); `option_collapse` in both its one-move and n-move forms (`:101`);
  and the three irreversibility sentences `castled`, `last_of_role`, pawn contact (`:103-105`).
  Pinned by a test written **before** the conversion.
- **The `never` binding fixes the defect; it does not remove the casts.** `PivotalMarker`
  (`pivotal.ts:18`) is a flat interface, not a discriminated union — `kind` and `detail` are
  independent fields — so `switch (marker.kind)` narrows `kind` and leaves `detail` at the full
  union, and each arm still casts. What the binding buys is that **adding a fifth kind becomes a
  compile error instead of a wrong sentence**, which is the whole of D48. Making `PivotalMarker`
  a discriminated union is a larger change with consumers in `voice.ts`, `story.ts`,
  `compare-strips.ts` and the server evidence packet; see open question 4.
- If `rfc/transition-primitives.md` is later re-drafted with a live tier and lands first, this
  section is satisfied by its criterion 7 and becomes a no-op. The RFCs do not conflict; whichever
  lands first discharges it, and neither depends on the other.

### 6. The three unmeasured kinds

#### 6.1 `phase_change` — the measurement to get, and what it will probably say

**Predicted, not measured, and flagged as a prediction:** phase classification reads the position
reached, and most legal alternatives from the same parent reach positions in the same band. So a
band crossing is likely to be a property of `after` that a large share of unplayed moves would
also produce — the lift is likely near **1.0**, and under L2 that refuses it. This is the same
shape as `slider_lines_changed`, which looked clean on T and C and died on the alternatives axis
(R3 §6).

It is a prediction because the counter-argument is real: material-driven crossings (a queen trade
into the endgame band) are produced by *specific* moves, and a capture that crosses the band is
much closer to `last_of_role` than to a ray-blocker count.

**This RFC does not remove `phase_change`.** L6 forbids removal on argument. It records the
obligation: an R-lane pass evaluating `classifyPhase` on the 634-transition corpus and on the
15,989-alternative population, reporting firing rate, lift and co-signal share. **If lift < 1.0,
the kind is demoted under L6 with no further RFC.**

#### 6.2 `human_divergence` — one normative change, and it is not about usefulness

Usefulness is unmeasured and this RFC does not judge it. The **permission bypass** in §1.1c is
judged, because L4(b) settles it without any measurement:

> **Normative:** a `human_divergence` firing is admitted live only where
> `permittedAssistance(context).humanSplit === "free"` — that is, for a solo or host viewer while
> `feedbackDeliveryOpen`. Where it is `"locked_off"`, the marker is not placed and its sentence is
> not rendered on the live surface.

`liveAdmitted` therefore takes the permission as an argument:
`liveAdmitted(marker, permission: ReturnType<typeof permittedAssistance>)`, and `liveMarkers`
takes an `AssistanceContext`. `DrillScreen.svelte:277` already computes `assistancePermission` at
`:272` and passes it.

Rationale in one line each: the same screen enforces this gate on the endpoint carrying the same
rung-3 source (`DrillScreen.svelte:934`); a spectator or participant should not learn from a dot
what they are locked out of learning from a button; and `design/05` §3a's *"everything the product
knows arrives after the commitment"* is the disclosure model the gate implements. The
counter-argument — masses without moves is a much weaker disclosure than moves with masses, and
adaptive-guidance §4d deliberately renders no moves — is real and is open question 2. The
retrospective and story surfaces are untouched; this gates the **live** placement only.

#### 6.3 `option_collapse` — obligation only

No change. Recorded as grandfathered-unmeasured, with the obligation: firing rate, lift and
co-signal share on the same corpus, plus a sensitivity check on the three constants at
`pivotal.ts:90` and on `legalCount`'s promotion arithmetic at `:27`. Under L2 the lift is the
number that decides it; the argument in adaptive-guidance §4e predicts a good one (a funnel is
created by *this* forcing move, not by the position) and predictions are not evidence.

### 7. Registers

**Nothing versioned. No register is claimed.** Verified per lane:

| Register | Claim | Why not |
|---|---|---|
| Pack schema | **none** | No `$defs`, no condition arm, no predicate member, no validation code. `0.20` has landed, `0.21` (`deviation-classes`) and `0.22` (`transition-primitives`) are claimed, `0.19` is frozen shut — this RFC touches none of them and the monotonic constant is untouched |
| `AssistanceConfig.version` (`assistance.ts:4`, currently **4**) | **none** | No key is added or removed and no stored value changes validity: `markers` keeps its `"off" \| "live"` domain (`assistance-preference.ts:5`) and `"live"` keeps its meaning — *live markers on*. Only the admitted set narrows, which is not persisted. `migrate` (`:10-17`) is untouched, and a v4 blob written before this RFC loads identically after it |
| Run schema (`DrillRun.schemaVersion`) | **none** | No event type, no event payload, no node field. `pivotalMarkers` is and stays a pure projection over the run |
| `PivotalKind` | **unchanged at four members** | The enum is not widened or narrowed; `last_of_role` is a `detail.subkind`, not a kind |
| Shape / evidence-fact registers | **none** | No `RULES_EVIDENCE_FACTS` entry, no shape schema change |

If a future proposal adds a **per-kind** live toggle — the natural response to §1.0's "opt-in but
not opt-in per kind" — that is a new `AssistanceConfig` key and a **version 5** bump with a
`migrate` arm. It is not proposed here; see open question 1.

## Deviations from design

**None.** Each element traces to a design statement already in force:

- Narrowing the live set implements `design/05` §3a's *"the default during committed play is
  **silence**"* against a measurement showing four in five live firings restate the move. §5a
  lists irreversibility as an honest detector and enumerates it as *"a pawn break, a trade that
  removes the last of a piece type, castling"* — this RFC keeps all three as **detections** and
  narrows only what is **volunteered**, which is the §3a axis, not the §5a one.
- L4(a) is law 8 / ADR-0005 restated at the surface where it bites hardest.
- L4(b) implements §3a-i's *"disclosure follows commitment, and the run — not the viewer —
  carries the barrier"* on a channel that currently does not carry it.
- L2 makes normative what `design/05` §5's *"detection is cheap, significance is not"* has always
  implied and what R2 and R3 measured twice.

**One thing design does not yet say, and this RFC does not write into it:** `design/05` has no
section on *how much* the live surface may say — no volume budget, no admission bar. L3 and §3.1
are the RFC-tier form of that. Per the RFC-0000 agent rule, an implementing agent does not edit
`design/`; if the owner wants the rule in the intent tier, it lands in `design/05` §3a on the
owner's ruling and this RFC's §3 becomes its mirror.

## Acceptance criteria

1. **`liveAdmitted` and `liveMarkers` exist, exported from `packages/runtime/src/index.ts`,** and
   `liveAdmitted` is a `switch` over `marker.kind` ending in a `never` binding.
2. **`last_of_role` in, `castled` and `pawn_break` out, live.** A test constructs runs producing
   each of the three sub-kinds and asserts `liveMarkers` contains exactly the `last_of_role`
   marker while `pivotalMarkers` contains all three. The castling and last-of-role fixtures at
   `packages/runtime/src/adaptive-guidance.test.ts:62,64` are reused so the detector's behaviour
   is pinned unchanged alongside the surface's change.
3. **No other consumer narrows.** A test asserts `comparisonStrips`, `storyMoments` and
   `evidencePacket` still carry `castled` and `pawn_break` sentences for the same fixtures, and a
   grep test asserts `liveMarkers` has exactly one call site in `apps/` — `DrillScreen.svelte`.
4. **The client's live path calls `liveMarkers`.** A component test with `markers: "live"` renders
   a run containing a castling ply, a pawn-break ply and a last-of-role ply and asserts exactly
   one `.pivotal-marker` dot, on the last-of-role node; with `markers: "off"`, zero, and a
   timeline byte-identical to today's (adaptive-guidance law 1d, unchanged).
5. **D48 is closed.** `renderPivotalMarker` is a `switch` with a `never` binding; a test written
   before the conversion pins **all six** outputs byte-identically (`phase_change`;
   `human_divergence`; `option_collapse` × 2; `castled`; `last_of_role`; pawn contact — six
   strings across four kinds); and a type-level test asserts that adding a fifth `PivotalKind`
   member fails to compile rather than rendering the pawn-contact sentence.
6. **The divergence gate holds.** A test asserts a `human_divergence` marker is present in
   `pivotalMarkers` and absent from `liveMarkers` for a participant, for a spectator, and for a
   solo viewer with `feedbackDeliveryOpen === false`; and present for solo/host with delivery
   open. A second test asserts `DrillScreen` renders no divergence sentence in the modal in the
   locked cases.
7. **Law 8 at the surface.** A test asserts no string returned by `renderPivotalMarker` for any
   constructible marker contains a member of `BANNED_JUDGEMENTS`
   (`packages/runtime/src/voice.ts:21`).
8. **No register moved.** A test asserts `SILENT_ASSISTANCE` equals its current value verbatim
   (extending `adaptive-guidance.test.ts:89`), that `AssistanceConfig["version"]` is still `4`,
   that a v4 preference blob written before the change loads unchanged, and that `PivotalKind`
   has exactly four members.
9. **The register in §3.1 matches the code.** A test enumerates the kinds and sub-kinds
   `liveAdmitted` returns `true` for and asserts the set equals the "admitted live: yes" rows of
   §3.1 — so the table cannot drift from the behaviour.
10. **The obligation is recorded, not implied.** `design/BACKLOG.md` gains rows for the three
    unmeasured kinds' measurement obligations and for the `human_divergence` permission bypass,
    and D50 flips with a one-line summary in the same commit that archives this RFC (the ledger
    half of the RFC completion protocol). **Ledger rows are owed now, not at archive time** —
    this draft did not write them, and that is a process debt this criterion pays.

## Open questions

1. **Should `markers` become per-kind rather than one switch?** §1.0's finding — a learner who
   wants the one measured-useful marker must accept three unmeasured ones — argues yes, and it
   would make the grandfathering in L6 much cheaper to live with. It is an `AssistanceConfig`
   version-5 bump with a `migrate` arm, and it is a bigger surface change than D50 warrants.
   Deferred; not blocking. **Owner-facing if the answer is yes**, because it changes the shape of
   the assistance control at `DrillScreen.svelte:652`.
2. **Is §6.2's divergence gate right, or over-tight?** The marker names masses without moves; the
   `humanSplit` endpoint names moves with masses. Gating the weaker disclosure by the stronger
   one's permission is conservative and closes a real bypass, but it also removes the marker from
   participants and spectators entirely and from solo play until delivery opens — which, under
   `attempt_end`, re-closes on the next committed move. The alternative is a **third** permission
   value for mass-only rung-3 content. **Owner call**; this RFC's §6.2 is the conservative
   default and is cheap to reverse.
3. **Should the `last_of_role` sentence render `queensOff`?** The field is set (`pivotal.ts:48`)
   and never read (`:104`), and `rfc/archive/adaptive-guidance.md` §4b calls the queens-off form
   *"the version of this fact players actually track"*. It is now the **only** sentence on the
   live surface, which raises the value of getting it right — but changing it edits a pinned
   string and criterion 5 pins the six outputs byte-identically. Resolve before `accepted`:
   either the six stay frozen and this waits, or criterion 5 pins seven with the new one written
   first.
4. **Should `PivotalMarker` become a discriminated union?** The `never` binding fixes D48's
   symptom; the casts at `:99-102` remain because `kind` and `detail` are independent fields
   (`:18`). The union is the real fix and touches `voice.ts`, `story.ts`, `compare-strips.ts`,
   `guidance.ts` and the `EvidencePacket` type. Inherited verbatim from
   `rfc/transition-primitives.md` open question 9; deferred with it, not resolved here.
5. **Does L3's ceiling survive contact with a second admitted kind?** With one kind live the
   union budget is untested. The first proposal to clear L1 and L2 will be the first real test of
   whether 1-per-10-plies is generous, tight, or the wrong shape of budget entirely (a per-branch
   count might be the honest unit, since the learner experiences a branch, not a ply rate).
   Revisit then rather than guessing now.
6. **What happens to a grandfathered kind that is never measured?** L6 creates an obligation with
   no expiry. An expiry would be honest — *unmeasured kinds are demoted at date X* — and would
   also be a deadline nobody agreed to. **Owner call**; this RFC deliberately sets none, and
   records that as a known softness in the rule rather than an oversight.

## Changelog

- 2026-08-15: created. Audits the four live `PivotalKind` members against
  `design/research/census-hint-false-positives.md`; fixes D50 by narrowing live `irreversibility`
  to `last_of_role` while demoting `castled` and `pawn_break` to the on-request and retrospective
  surfaces; re-homes the D48 exhaustiveness fix from `rfc/transition-primitives.md`, whose live
  tier was withdrawn by the same measurement that would have carried it; proposes L1–L6 as the
  standing admission rule for the live surface, with §3.1 as its register. Records that three of
  the four live kinds have **never** been measured, and closes an unstated rung-3 permission
  bypass on `human_divergence`. No register claimed.
