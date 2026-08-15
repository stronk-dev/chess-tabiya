# RFC: Live marker quality — the admission rule for anything that speaks unasked

- **Status:** implementing — **cross-reviewed 2026-08-15; owner rulings applied; D68 absorbed by the implementation**
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/05-in-run-experience.md` §3 (the assistance ladder and its 2026-08-14
  rung-0 scope corrections), §3-forms (*"render the same content as a sentence; if the sentence
  would be refused, so is the overlay"*), §3a (silence is the default, disclosure is
  learner-initiated), §5a (the four author-free forward detectors)
- **Exploration gate:** `design/research/census-hint-false-positives.md` (R3, 2026-08-15) — the
  first measurement of hint *usefulness* in the repo. Its §5 records that a **shipped** live
  marker has a **79.9%** false-positive rate; `design/BACKLOG.md` row *A shipped live marker has
  a 79.9% false-positive rate* (**D50 🐞**) ledgers it and explicitly declines to auto-fix it,
  because *"narrowing it is a live-surface change and belongs in an RFC"*. This is that RFC.
- **Ledger rows this RFC owns**, cited by title throughout (line numbers drift, titles are
  stable): *A shipped live marker has a 79.9% false-positive rate* (**D50**); *A pivotal marker
  discloses rung-3 content past a permission the same modal enforces* (**D51**); *Three of four
  live markers have never been measured, and the fourth failed* (**D52**); *`option_collapse`'s
  thresholds are detector-chosen free parameters* (**D53**); *`renderPivotalMarker` is not
  exhaustive and fails silently* (**D48**). All five were written to the ledger by claude on
  2026-08-15 and are **open at the time of this draft** — §Acceptance criteria 10 is about
  *flipping* them at archive time, not about creating them.
- **Depends on:** nothing unlanded. `rfc/archive/transition-primitives.md` (**implemented and
  archived, `57f86da`**) hands `renderPivotalMarker` to this RFC explicitly — its criterion 7
  reads *"SUPERSEDED BY R3. No `PivotalKind` is added, so this RFC does not modify
  `renderPivotalMarker`; D48 remains assigned to `live-marker-quality`"*, and its handoff repeats
  *"`renderPivotalMarker` remains owned by `live-marker-quality`"*. §5 is written against that
  landed fact, not against a prediction.

*Every code site below was re-verified against the working tree at `efdd7e0` on 2026-08-15.
The tree moved roughly ten times that day and `packages/runtime/src/pivotal.ts` was rewritten by
`930b367` ("feat: add transition primitives"), which moved the `irreversibility` detector and
`IrreversibilityDetail` out to `packages/runtime/src/transition.ts` and shortened `pivotal.ts`
from ~106 lines to 76. Every line number the first draft carried was stale and has been
corrected. **Locate by symbol name first — every line number in this document is advisory.**
The two block quotes from `design/research/census-hint-false-positives.md` in §Motivation are
reproduced verbatim and therefore still carry the dossier's pre-`930b367` line numbers
(`pivotal.ts:83`, `:103-105`); those are `pivotalMarkers`' irreversibility push (now `:53`) and
the three irreversibility sentences in `renderPivotalMarker` (now `:73-75`).*
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
>
> **Where it lands in the body:** §6.2 is rewritten as the specification of the ruling — the
> accepted cost is enumerated there, not only here — and open question 2 is closed **RESOLVED**
> with the ruling's terms. No section hedges toward the third-value alternative. Cross-review
> 2026-08-15 checked this specifically.


> **OWNER RULING 2026-08-15 — render the queens-off form.** Open question 3 is resolved and no
> longer blocks. After the narrowing, `last_of_role` is the **only** marker sentence a learner
> sees unasked, and `rfc/archive/adaptive-guidance.md` §4b calls the queens-off form *"the version
> of this fact players actually track"*. The field is computed (`transition.ts:255`) and never
> read (`pivotal.ts:74`) — wire it. **Criterion 5 pins all EIGHT constructible outputs**, with the new sentence
> written out; the six are not frozen. Rationale recorded: the archived judgement was made when
> this was one sentence among many, and it is now the only one, which raises the value of getting
> it right rather than lowering it.

## Summary

R3 measured whether a census-built hint is worth reading and produced two results this repo did
not have: a **mechanical usefulness gate** (T ∧ C ∧ D) and the finding that **firing rarity does
not predict usefulness** (Spearman ρ = −0.143). It applied the gate to a marker that was being
*proposed* — `defended_duty_acquired`, refused at 29.5% clearing and 0.61× lift — and, in
passing, to a marker that is **already shipped and live**: `irreversibility`
(`packages/runtime/src/pivotal.ts:53`), whose three rendered sub-kinds clear the gate on **2.7%**
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
an RFC-tier object. `design/BACKLOG.md` recorded D50 and left it unowned. Unowned is the
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
re-homed here, which `rfc/archive/transition-primitives.md` made explicit when it landed (§5).

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
| Gate | `apps/web/src/lib/DrillScreen.svelte:291` | `assistance.markers === "live" ? pivotalMarkers(run, run.activeCursor.branchId) : []` |
| Default | `packages/runtime/src/assistance.ts:16-18` | `SILENT_ASSISTANCE` has `markers: "off"`; `DrillScreen.svelte:136` initialises to it and `:631` loads the learner's stored choice |
| Permission | `packages/runtime/src/assistance.ts:29` | `markers: "free"` — **unconditionally**, for every role and whether or not disclosure has opened |
| Render | `apps/web/src/lib/Timeline.svelte:75` (and `:48` for ply 0) | an **unlabelled dot** with `aria-label` *"Open pivotal marker at ply N"* |
| Disclosure | `DrillScreen.svelte:988-991` | clicking the dot opens a modal whose text is `renderPivotalMarker(marker)` |

Three consequences, all verified and all load-bearing for what follows:

1. **The unasked payload is the dot, not the sentence.** `DrillScreen.svelte:292` builds
   `{ nodeId, label }` rows where `label = marker.kind.replaceAll("_", " ")`, and
   `Timeline.svelte:75` **discards** `label` — contrast `:74`, where shape markers do render
   theirs. So the live disclosure is *"something the convention calls pivotal happened at this
   ply"*, and the sentence is one click away. That is a weaker unasked claim than "the product
   told the learner X", and this RFC does not overstate it.
2. **It is still an unasked claim, and a false-positive one is still a cost.** A dot on a ply is
   an assertion that this ply is worth returning to; it steers the rewind decision, which is the
   product's core loop. And `renderPivotalMarker` is the marker's *only* text surface **on this
   path** — the dot carries no words — so a wrong sentence there is not one signal among several,
   it is the entire content of the live disclosure. (The same function also feeds the comparison
   strip, the story projection and the server evidence packet; those are the surfaces §4.1 keeps
   unnarrowed, and §1.1c-ii is about one of them.)
3. **`markers: "live"` is opt-in but not opt-in *per kind*.** A learner who wants the one useful
   marker has to accept all of them. That is what makes the aggregate false-positive rate the
   right unit of judgement, not the per-kind one.

`markers` being off by default is a mitigation and is why D50 is a defect rather than an
incident. It is not a defence: `rfc/archive/transition-primitives.md` §5.4 already stated the principle —
*"no learner meets it without opting in — but opting in should not buy noise."*

#### 1.1 The four kinds

`PivotalKind` (`packages/runtime/src/pivotal.ts:9`) has four members. All four reach the live
surface through the single gate above; none is separately switchable.

| Kind | Detector | Fires on | Rung | Measured? | Live disposition under §3 |
|---|---|---|---|---|---|
| `irreversibility` | `transition.ts:245-263`, pushed at `pivotal.ts:53` | castling; a capture that empties a role for a colour; a pawn move that creates or resolves pawn contact | 0 | **Yes — fails.** 13.4% firing, 2.7% clearing, **79.9% FP** | **Narrowed to `last_of_role`** (§4) |
| `phase_change` | `pivotal.ts:47-51` | `classifyPhase` crossing definite→definite band, never from or into `unclear` | 0 (+ author-declared) | **No** | Grandfathered, measurement obligation, **predicted to fail axis D** (§6.1) |
| `human_divergence` | `pivotal.ts:29-38`, pushed at `:63` | a recorded `opponent.move_selected` with `policyModeApplied === "human_common"` whose normalised masses have max ≤ 0.50 and ≥ 3 candidates ≥ 0.15 (`:36`) | **3** | **No** | Grandfathered, **plus a permission fix** (§6.2) |
| `option_collapse` | `pivotal.ts:55-61` | same-side legal-move count ≥ 8, then ≤ 3 at two consecutive same-side decisions (`:60`) | 0, by the §3 redefinition | **No** | Grandfathered, measurement obligation (§6.3) |

#### 1.1a `irreversibility` — measured, and it fails

Three sub-kinds, in the detector's own precedence order (`transition.ts:252`, `:255`, `:257-262`), at
most one marker per transition:

| Sub-kind | Fires when | Sentence | R3 verdict |
|---|---|---|---|
| `castled` | `mover.role === "king"` and the king moves two files (`transition.ts:252`) | `"white castled."` (`pivotal.ts:73`) | **Fails T.** The learner castled. The marker restates the move |
| `last_of_role` | the move captures, and the captured colour then has zero pieces of that role (`transition.ts:255`) | `"black has no queens remaining."` (`pivotal.ts:74`) | **Clears T and C.** It is a fact about the board's remaining material, not about the move |
| `pawn_break` | a pawn capture, or a pawn move that newly attacks an enemy pawn (`transition.ts:257-262`) | `"white created or resolved pawn contact."` (`pivotal.ts:75`) | **Fails T.** Dossier §3d: *"the learner played the pawn capture. The marker restates the move"* |

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

- `IrreversibilityDetail` carries `queensOff` (`transition.ts:242`), set at `transition.ts:255` when the capture
  leaves both colours queenless — the fact `rfc/archive/adaptive-guidance.md` §4b called *"the
  version of this fact players actually track"*. `renderPivotalMarker` (`pivotal.ts:74`) never
  reads it. A set,
  named, never-surfaced field on the one sentence that survives §4. See open question 3.
- `legalCount` (`pivotal.ts:19-26`) scores a pawn move to the last rank as **4** legal moves
  (`:23`). That is arithmetically right and interacts with the `≥ 8` / `≤ 3` constants at `:60`
  in a way nobody has measured; noted under §6.3, not changed here.

#### 1.1b `phase_change` — unmeasured

Fires at `pivotal.ts:49` when `classifyPhase(node.fen).phase` is definite and differs from the
last definite phase seen on the path; `:47-51` guarantees no marker from or into `unclear`.
Renders `"opening → middlegame, detected by Tabiya's phase bands."` (`:69`).

**No dossier in `design/research/` measures it.** Grepping the research tier for
`phase_change` / `classifyPhase` returns nothing; R1, R2 and R3 all measured transition
primitives, not this detector. Its firing rate on the pack corpus is unknown, its
false-positive rate under T/C/D is unknown, and — the important one — **its lift against
unplayed alternatives has never been computed.** §6.1 states why that number is the one to get
and why it is likely to be near 1.0.

#### 1.1c `human_divergence` — unmeasured, and the only rung-3 source on the live surface

Fires at `pivotal.ts:29-38` from persisted `opponent.move_selected` events; abstains structurally
when there are no candidates, no masses, or a non-Maia policy mode (`:31`, `:33`). Renders
`"Maia-1500's recorded policy split: 31% / 24% / 19% of recorded mass."` (`:70`).

Three properties, verified:

1. It marks the node the **opponent** moved from, not the learner's pending decision, so it
   leaks nothing about the move the learner is about to make. That is why it survives ADR-0006
   at all.
2. It names **no moves** — only normalised masses and the engine identity. The `humanSplit`
   endpoint two lines away in the same modal (`DrillScreen.svelte:997`) names
   `candidate.moveUci`. The marker is a materially weaker disclosure than the endpoint.
3. **And it is not gated like one.** `permittedAssistance` (`assistance.ts:27-29`) returns
   `humanSplit: "locked_off"` unless the viewer is solo-or-host *and* `feedbackDeliveryOpen`;
   `markers` is `"free"` unconditionally (`:29`). `DrillScreen.svelte:996` enforces the humanSplit
   gate. `:991` — five lines above, same modal — renders the divergence sentence with no such
   check. **A participant or spectator with markers on receives rung-3 Maia distribution content
   that the same screen explicitly locks them out of five lines later.** That asymmetry is not
   documented in `design/05` §3a-i, is not stated in `rfc/archive/adaptive-guidance.md` §4d, and
   is not a measured question. §6.2 closes it **on the client**.

##### 1.1c-ii The same payload is also reachable from the server, and §6.2 does not close that

Cross-review 2026-08-15 found a **second leg of D51 that the first draft did not look for**, and
it matters because a client-only gate is not a permission fix.

`evidencePacket` (`apps/server/src/guidance.ts:34`, `:44`) calls `pivotalMarkers` unfiltered and
folds `renderPivotalMarker`'s output into `packet.sentences` — so a `human_divergence` sentence,
masses and all, is in the packet, and the raw `DivergenceDetail` is in `packet.markers`. Two REST
routes serve that packet's text to any reader:

| Route | Site | Permission check |
|---|---|---|
| `GET …/human-split` | `apps/server/src/rest.ts:1032-1034` | **yes** — `permittedAssistance(…).humanSplit === "locked_off"` → `ASSISTANCE_WITHHELD` |
| `GET …/corpus` | `rest.ts:1049-1051` | **yes** — same shape, on `corpus` |
| `POST …/voice` | `rest.ts:1114-1120` | **none.** `guidanceAccess` (`service.ts:727`) is `requireRead` only, so a participant or spectator passes |
| `POST …/speech` | `rest.ts:1128-1133` | **none.** Same packet, synthesised to audio |

`renderVoice`'s deterministic fallback is `packet.sentences.join("\n")`, so the divergence
sentence is returned as text whether or not an external voice provider is configured. **The
viewer who is refused `ASSISTANCE_WITHHELD` on `/human-split` can obtain the same rung-3 source,
in weaker form, from `/voice` — with no marker preference set and with `markers: "off"`.** It is
the identical defect shape as the modal one, one tier down, and `liveMarkers` cannot reach it
because `/voice` is not a live surface.

**Scope ruling, amended by the refreshed implementation handoff.** D68 is acceptance-blocking and
is fixed in this wave. Both `/voice` and `/speech` compute the same
`permittedAssistance({ sessionKind, deliveryOpen, role })` value used by `/human-split` and refuse
with the existing `ASSISTANCE_WITHHELD` code when `humanSplit === "locked_off"`. This protects
every packet scope because every packet may contain the divergence source; it does not inspect or
redact prose after construction. No new permission value or refusal code is introduced.

**And it constrains L4(b).** L4(b)'s ceiling is *"what the viewer could obtain on request under
`permittedAssistance`"* — deliberately the permission table, not the endpoints' actual behaviour,
because otherwise a leaking on-request channel would silently raise the live channel's ceiling
with it. That wording is correct as drafted and is load-bearing precisely because of this
finding; §3 L4(b) now says so explicitly.

The kind's three constants (0.50 / 0.15 / 3) are pinned parameters under adaptive-guidance §2b,
*"revision triggered by the marker rendering as routine noise in playtest"* — a revision trigger
that has never fired because nobody has looked.

#### 1.1d `option_collapse` — unmeasured, and its constants were chosen by the detector

Fires at `pivotal.ts:58-60`: for each colour, at the first same-side decision of a span where
`prior.count >= 8 && first.count <= 3 && second.count <= 3`. Renders `"One legal move is
available: forced under Tabiya's count convention."` or the n-move form (`:71`).

It is honest about its rung: `design/05` §3's 2026-08-14 correction says option collapse *"needs
reasonable continuations, which is evaluation, so it is rung 2/3 unless redefined as raw
legal-move count"*, and `rfc/archive/adaptive-guidance.md` §4e took the redefinition completely.
The shipped code counts raw legal moves; no evaluation is read.

What is **not** established is anything about usefulness. The three constants are the detector
choosing what to look at — the exact free-parameter hazard `rfc/archive/transition-primitives.md` §5.4
worried about in a new marker and never applied to an old one. The `≥ 8` prior and the
two-consecutive condition are argued in §4e from first principles (*"a one-off spite check is not
a funnel"*), which is a good argument and is not a measurement. Firing rate, FP rate and lift are
all unknown.

#### 1.2 Audit conclusion

**One of four live kinds has been measured. It failed. The other three have not been measured at
all, and this RFC does not assert that they are fine.** Two of the three (`phase_change`,
`option_collapse`) rest on arguments that predate any usefulness instrument; the third
(`human_divergence`) additionally carries a permission bypass that is a defect independent of
usefulness, on **two** surfaces (§1.1c, §1.1c-ii), of which this RFC closes one.

Ledgered as D52 (*Three of four live markers have never been measured, and the fourth failed*)
and D53 (*`option_collapse`'s thresholds are detector-chosen free parameters*). The register in
§3.1 records `phase_change`, `human_divergence` and `option_collapse` with an **Evidence** value
of **none** and an explicit *unmeasured* status, and criterion 9 pins that table against the
code, so "unmeasured" cannot quietly become "fine" by omission.

**A limit on how far even the measured one is measured**, stated here because §3 leans on it.
R3's conditions T and C are *necessary*, not sufficient, and the dossier says so (§3c, §8.1:
*"No reader was asked… signal rates are upper bounds, FP rates lower bounds"*). So "clears T and
C" means *survived two mechanical filters*, not *a reader found it useful*. Every "0% by
construction" in §3 is 0% **against T and C**, which is a floor claim, not a usefulness claim.

### 2. The asymmetry that decides every case here

`design/05` §3a:

> Assistance is *available* — the rail exists, the ladder is honest, the learner may open it —
> but the default during committed play is **silence**, and everything the product knows arrives
> after the commitment.

That is why R3's headline number does not condemn the on-request reading. **6.18 observations per
ply, 0.68 informative, 89.0% FP at the observation level** (dossier §5) is a bad number for
anything that speaks unasked and an acceptable one for a panel the learner opened, for the reason
`rfc/archive/transition-primitives.md` §5.2 already gave: *"a true answer to a question the learner asked
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

> **A firing of an admitted kind may appear on the live surface only if it satisfies L1–L4. A
> kind may be *added* to the live surface only with L5's evidence. L6 governs the kinds that
> were live before this rule existed, and L6 — not L1 — is what they are held to until they are
> measured.**

**Precedence, because L1 and L6 would otherwise contradict each other.** L1 says a firing renders
live *only if* it clears T ∧ C. L6 says a kind that has never been measured is not removed. The
three grandfathered kinds have never been evaluated against T ∧ C at all, so under a
literal reading of L1 they would all be inadmissible today — which is exactly the removal-by-
argument L6 forbids. **L6 wins for grandfathered kinds; L1 binds every kind admitted under this
rule and every grandfathered kind from the moment its measurement lands.** §4.2's predicate
implements that split literally: `last_of_role` is an L1 test, the other three are unconditional
`true` with a comment naming their register row. Without this paragraph the rule is
self-contradicting on its own first day, and an implementer would have to guess.

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

**What that 0% is and is not.** T and C are *necessary* conditions, and the dossier is explicit
that no reader was asked (§3c, §8.1). So L1 guarantees zero firings that a mechanical test can
call tautological or uncontested; it guarantees **nothing** about whether a reader finds the
survivors worth reading. It converts an unbounded question into a bounded one — the honest claim,
and smaller than "0% false positives" reads on its own. L2 exists because L1 alone is not enough,
and R3 §6 is the proof: T and C alone would have put `slider_lines_changed` live.

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

Three clauses cross-review had to add, because L2 as first drafted was breakable:

- **(i) Zero-denominator.** R3's quiet population is *non-capture, non-check* by definition
  (dossier §2). A detector whose firing condition **entails** a capture or a check therefore
  signals on 0.0% of it and its lift is not a number — it is a division by zero. This is not
  hypothetical: it is the state of the one instrument this RFC admits. `move_irreversibility`'s
  row in R3 §6 reads *"— (no quiet firings)"*, and `last_of_role` is capture-only, so **its
  0.0%-against-quiet is a definitional artefact of the population, not a discovery about the
  detector.** The rule: where the quiet signal rate is structurally zero, **lift is reported as
  *undefined (population excludes the firing condition)*, the L2 refusal on lift < 1.0 does not
  apply, and the decision falls to the all-alternatives rate and the co-signal share** — for
  `last_of_role`, **0.2%** of all 15,989 alternatives and **9.9%** co-signal, which are real
  numbers measured on a population that *can* contain the firing. A proposal may not claim a
  0.0%-quiet rate as its evidence; §3.1 and §4.1 are corrected to say which number is doing the
  work.
- **(ii) Applicability.** L2's instrument is defined only for kinds whose firing is a function of
  **(parent position, move)** — that is what "enumerate the legal alternatives of the same parent
  position" means. It does not define a counterfactual for `human_divergence` (which fires from a
  recorded `opponent.move_selected` event, not from a move the learner could have played
  otherwise) or, without redefinition, for `option_collapse` (which fires on a **span of three
  same-side decisions**, so the counterfactual is an alternative *continuation*, not an
  alternative move). **Two of the four existing kinds cannot be measured by the mandated
  instrument at all.** Where a kind is outside the instrument's domain, L2 is satisfied by a
  **named substitute population, defended in the dossier and approved by the owner** — for
  divergence, the natural one is the recorded-selection population under the same policy mode;
  for collapse, alternative continuations from the span's parent. What is *not* permitted is
  proceeding with no alternatives axis at all, and what is not permitted is silence about the
  substitution.
- **(iii) The population is a proxy and inherits its bias.** R3 §8.4: the alternatives population
  *"over-weights bad moves… and under-weights the human-plausible ones."* A lift computed against
  it is a lift against *legal* moves, not against moves a learner would play. Every anchor above
  carries that bias identically, so comparisons between anchors are sound and absolute readings
  are not.

**L3 — Volume ceiling on the union, not per kind.** The learner sees the union of all live kinds,
so the budget belongs to the union. **The admitted firings of all live kinds together must not
exceed 1 per 10 plies** — that is, **≤ 0.10 admitted firings per ply of play**.

**The unit, stated because the first draft's was ambiguous and the ambiguity was exploitable.**
The denominator is **plies played**, not alternatives enumerated. Say "on the alternatives
population" and a capture-gated kind scores near zero against ~24 alternatives per ply and passes
trivially — the same population artefact L2(i) catches, arriving through the back door. The
alternatives population is used **only** to *estimate* the played-ply rate for a kind that has
never run on real play: the estimator is the kind's signal rate on **all** alternatives (R3's
15,989, not the 14,980 quiet ones), read as the expected share of plies on which a
learner-selected move fires. R3's §2 population is the learner-proxy because Just Play is closer
to it than to an authored spine; it is a proxy for *which move gets played*, never a
multiplier on the count.

Worked, so the number is checkable: `last_of_role` signals on **2.7%** of played spine moves and
**0.2%** of all alternatives; both are well inside 0.10/ply, and the live union today is that one
kind plus three grandfathered ones whose rates **are unknown** — so **L3 is currently unverified
for the surface it governs**, and cannot be verified until the §6 obligations are discharged.
That is a consequence of L6, not a loophole in L3, and it is recorded rather than glossed.

This is a chosen number and says so. Its defence is that it sits an order of magnitude below the
two confetti cases the archive already refused by argument — halfmove-clock irreversibility,
*"true of half the moves in a game"* (adaptive-guidance §4b), and un-suppressed check spam (§4e)
— and roughly 3.7× above the one instrument that clears L1 and L2 (`last_of_role`, 2.7% on
spines). It is the first budget anyone has written down for this surface; R3 measured the union
at **6.18 observations per ply** on the on-request reading and nobody had a number to compare it
to.

**L4 — Rung and disclosure discipline.** Unchanged law, restated so the rule is one surface:

- **(a)** The sentence states a fact with its scope and its provenance, never a verdict. `BANNED_JUDGEMENTS`
  (`packages/runtime/src/voice.ts:21`) is the mechanical floor; law 8 / ADR-0005 is the ceiling.
  A marker may say *"black has no queens remaining"*; it may never say that this is good, bad,
  a mistake, or a moment the learner should have played differently.
- **(b)** No live firing may disclose more than the same viewer could obtain **on request at that
  moment** under `permittedAssistance`. A marker channel may not route around a permission the
  product enforces on the endpoint that carries the same source. (This is the rule §6.2 applies
  to `human_divergence`.) **The ceiling is `permittedAssistance`'s table, not what the endpoints
  happen to serve** — deliberately, because §1.1c-ii found an on-request route (`POST …/voice`)
  that serves the same rung-3 source with no permission check at all. Were the ceiling defined by
  observed endpoint behaviour, a leak on the on-request tier would silently raise the live tier's
  ceiling to match it. The permission table is the invariant; a route that disagrees with it is a
  defect in the route.
- **(c)** No live detector reads an evaluation. `design/05` §3a's forward/backward table and
  adaptive-guidance §4f are unchanged: eval swing is backward-only, and
  `retrospectivePivot` (`packages/runtime/src/adaptive.ts:5`) is where it lives.

**L5 — The burden is on the addition.** A new live kind arrives with a dossier in
`design/research/` reporting T, C, D, lift, co-signal share, firing rate, phase split, and the
corpus it was measured on. **Argument is not evidence, and selectivity is not evidence.** A
proposal without an alternatives measurement is refused without reading the argument, because R3
§6 showed that T and C alone would have recommended the wrong instrument.

**Refused-unread is a refusal of the *submission*, not a verdict on the kind.** L2(ii) is what
keeps this from being a rule that refuses good work: a kind outside the alternatives instrument's
domain is not refused for lacking the impossible, it is required to name and defend a substitute
population. `human_divergence` proposed today would fail L5 as first drafted, not because it is
noise but because the mandated instrument does not apply to it — which would have been the rule
refusing something purely for the shape of its detector. The remedy is L2(ii), and a resubmission
with a defended substitute population is a first submission, not an appeal.

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

#### 3.0a Two constructions the rule survives, and one it only survives because of L2(i)

Recorded because a standing rule that has never been attacked is an untested rule, and this one
will govern proposals nobody has written yet.

**Refuses something good?** The case is L5 refusing `human_divergence` — a kind already shipped
and plausibly the most interesting one on the surface — purely because the alternatives
instrument has no counterfactual for an opponent-selection event. That is a real refusal of good
work by an accident of instrument shape, and **L2(ii) is the fix**, added above for this reason.

**Admits something bad?** Take a proposed kind *"the piece you captured was defended"*. It passes
**T** (its cause is a third piece — the defender — not what the moved piece does from its
destination). It passes **C** (defender count is a 0-versus-nonzero status under the rules alone,
no value comparison). Its quiet-alternative signal rate is **0.0%** by construction, because
quiet means non-capture — so **lift is +∞ and, under L2 as first drafted, it clears the axis that
killed `slider_lines_changed` without the axis ever having been applied to it.** That is a marker
firing on a large share of captures, telling the learner something they can see, and L1 + L2 as
first drafted would have admitted it. **L2(i) is what stops it**: the lift is undefined rather
than infinite, and the decision falls to the all-alternatives rate (captures are ~10–15% of legal
moves in a middlegame, so a defended-capture predicate lands far above `last_of_role`'s 0.2%) and
to the co-signal share (in a position with one defended hanging piece, other captures of the same
piece co-signal). L3's 0.10/ply ceiling then bites as well, on the played-ply denominator that
L3's unit paragraph fixes. **Both repairs were needed; either alone leaves the hole open.**

**Not a defence, an admission.** The bad case was constructible only because the population's
definition of "quiet" happens to be correlated with a whole family of firing conditions. There is
no reason to think capture and check are the only such correlations, and L2(i) is written as a
general zero-denominator clause rather than a capture special-case for that reason.

#### 3.1 The live-surface register

Normative and maintained in this RFC, as the single place where the state of the live surface is
readable. Amending it is how a kind's status changes.

**Two columns, not one**, because the first draft's single "Admitted live" column conflated *does
this render live today* with *is there evidence for it*, and answered "grandfathered" to a
yes/no question — which criterion 9 cannot test and a reader can misread as "not live". The
grandfathered kinds **do** render live; what they lack is evidence.

| Live kind / sub-kind | Renders live today | Evidence basis | Measurement status | Rule |
|---|---|---|---|---|
| `irreversibility:last_of_role` | **yes** | R3 §5, §6: 2.7% signal on played moves, **0.2% on all 15,989 alternatives**, 9.9% co-signal, T ∧ C by construction. Its 0.0%-on-quiet is a definitional artefact (capture-only) and is **not** the evidence — L2(i) | **measured, passes** | L1, L2 |
| `irreversibility:castled` | **no** — on-request and retrospective only | R3 §5, §7c: fails T | **measured, fails** | L1(T), L6 |
| `irreversibility:pawn_break` | **no** — on-request and retrospective only | R3 §5, §7c: fails T | **measured, fails** | L1(T), L6 |
| `phase_change` | **yes** | **none** | **never measured** — obligation §6.1 | L6 |
| `human_divergence` | **yes, and only where `humanSplit === "free"`** (§6.2) | **none** | **never measured** — obligation §6.2; outside L2's instrument domain, see L2(ii) | L6, L4(b) |
| `option_collapse` | **yes** | **none** | **never measured** — obligation §6.3; outside L2's instrument domain without a redefined population, see L2(ii) | L6 |
| `defended_duty_acquired` | **no** — never landed; not a `PivotalKind` member | R3 §7: 29.5% clearing (upper bound), 0.61× lift | **measured, refused** | L2 |

Three of the four kinds that render live have **no evidence of any kind**. That is the audit
result of §1.2 and D52, restated in the one table an implementer will read, and it is the
register's main job.

### 4. The D50 fix

#### 4.1 The disposition, and it is not "drop the other two"

Narrowing to `last_of_role` is right, and it is right on the evidence rather than by elimination:
`last_of_role` clears T (it is a fact about remaining material, not about the move), clears C
vacuously (irreversibility is a moment marker), and is the **best-discriminating instrument in
R3's D table** — it signals on **2.7%** of played spine moves against **0.2%** of all 15,989
alternatives, and in a signalling position only **9.9%** of that position's other legal moves
co-signal, the lowest co-signal share R3 measured.

**With one qualification the first draft did not make, and it matters because this is the only
sentence left on the live surface.** `last_of_role`'s **0.0% on quiet alternatives** is not
evidence. R3's quiet population is non-capture by definition and `last_of_role` is capture-only,
so a 0.0% there is guaranteed before anything is measured — L2(i). The numbers that carry weight
are the all-alternatives 0.2% and the 9.9% co-signal, both computed on populations that *can*
contain the firing. On those, `last_of_role` is still the strongest thing R3 measured; it is just
strong by a factor of ~13×, not by an infinite one. And the co-signal figure rests on **n = 17**
signalling positions (R3 §6), which is a small sample and is why this is a *narrowing* on
measured grounds rather than a claim that the survivor is good.

`castled` and `pawn_break` are **demoted, not deleted**. Both remain:

- detected, unchanged — the detector is `irreversibility` in
  `packages/runtime/src/transition.ts:245-263` (moved there from `pivotal.ts` by `930b367`) and
  is not modified;
- rendered, unchanged, on every learner-initiated and retrospective surface — the comparison
  strip (`packages/runtime/src/compare-strips.ts:38`), the story projection
  (`packages/runtime/src/story.ts:78-79`), and the server evidence packet
  (`apps/server/src/guidance.ts:34`, `:44`), all three of which call `pivotalMarkers` unfiltered
  and are opened by the learner or reached after the outcome. **Verified in the tree at
  `efdd7e0`**: all three are the complete set of non-test `pivotalMarkers` callers outside
  `DrillScreen.svelte`, and all three keep `castled` and `pawn_break`. Criterion 3 pins it.

**One claim from the first draft is withdrawn as false.** It said the demoted sub-kinds stay
*"available in the modal when the learner opens a dot that another kind placed."* They do not.
`DrillScreen.svelte:293` derives `openPivotal` from `projectedPivotal`, and `:345` builds the
modal's sentences from `projectedPivotal` too — so once `:291` calls `liveMarkers`, the modal
shows **only admitted markers**, on any dot. This is self-consistent (§4.2's *"a dot that is never
placed cannot be opened"* is the same fact stated correctly) but it means the live-tier learner
loses the castling and pawn-contact sentences **entirely**, not merely their dots. That is the
right outcome under §2 — the modal is the live channel's disclosure, not a second surface — and
it is stated here so the cost is not discovered during implementation.

This is the §2 corollary: a fact that restates the move is a poor thing to volunteer and a fine
thing to answer with. *"White created or resolved pawn contact"* in a post-game story slide is a
true statement about a moment the learner is reviewing on purpose.

#### 4.2 The mechanism

A new exported projection in `packages/runtime/src/pivotal.ts`, so the rule is single-sourced and
testable in the runtime rather than duplicated in the client:

**The signatures, given once and including §6.2's permission argument** — the first draft
declared them without it and then changed them in §6.2, which left two incompatible signatures in
one document:

```ts
/** §3 L1/L4(b): the per-firing admission predicate for the live (unasked) surface.
 *  `permission` is the result of `permittedAssistance` for the viewing context; the
 *  `human_divergence` arm reads `permission.humanSplit` (§6.2). */
export function liveAdmitted(
  marker: PivotalMarker,
  permission: ReturnType<typeof permittedAssistance>,
): boolean;

/** pivotalMarkers, filtered to firings admitted live. The only projection the client's
 *  `markers: "live"` path may call. */
export function liveMarkers(
  run: DrillRun,
  branchId: string,
  context: AssistanceContext,
): readonly PivotalMarker[];
```

`liveMarkers` takes the `AssistanceContext` (not the permission) so that a caller cannot pass a
permission computed for a different run or role; it calls `permittedAssistance` itself.
`AssistanceContext` and `permittedAssistance` are already exported from
`packages/runtime/src/assistance.ts:20-30`, so this adds no import cycle: `pivotal.ts` gains an
import of `./assistance.js`, which imports only `./types.js`.

`liveAdmitted` is a `switch` over `marker.kind` ending in a `never` binding (the D26 law), with
two non-trivial arms today:

- `irreversibility` → `(marker.detail as IrreversibilityDetail).subkind === "last_of_role"` (the
  cast is unavoidable until open question 4; see §5);
- `human_divergence` → `permission.humanSplit === "free"` (§6.2), with a comment naming its §3.1
  register row as **grandfathered-unmeasured but permission-gated**;
- `phase_change`, `option_collapse` → `true`, each carrying a comment naming its §3.1 register row
  as **grandfathered-unmeasured** — so the next reader of this function sees the obligation rather
  than an endorsement.

**Call-site change, and it is one line.** `DrillScreen.svelte:291` calls `liveMarkers` instead of
`pivotalMarkers`. Everything downstream of `projectedPivotal` — the timeline rows at `:292`, the
modal filter at `:293`, `openPivotalMarker` at `:344-345` — is unchanged and correctly narrows with
it, because a dot that is never placed cannot be opened.

**Sites that do not change**, verified by grep for `pivotalMarkers` across `packages/` and
`apps/` excluding tests: `compare-strips.ts:38`, `story.ts:78`, `guidance.ts:34`. All three are
learner-initiated or post-outcome and keep the full marker set. `packages/runtime/src/index.ts:41`
gains the two new exports.

#### 4.3 What the learner sees change

The timeline loses dots at castling plies and at pawn-contact plies when `markers: "live"` is on.
On the pack corpus that is the difference between ~13.4% and ~2.7% of plies carrying an
irreversibility dot. In an opening pack, effectively all of them: R3's phase split records
**0.0%** irreversibility signal across 236 opening transitions, so an opening drill's
irreversibility dots go to zero. That is the intended result — every one of them was a
restatement of a move the learner had just played and watched.

### 5. D48 — the rendering defect, re-homed, and the re-homing is now a landed fact

`design/BACKLOG.md` row *`renderPivotalMarker` is not exhaustive and fails silently* (**D48 🐞**)
records it: `renderPivotalMarker` (`pivotal.ts:68-75`) tests three kinds and then falls through at
`:72` with `marker.detail as IrreversibilityDetail`, so a marker of an unhandled kind renders
`"… created or resolved pawn contact."` — **a wrong sentence shown to a learner, silently**,
because the cast defeats the exhaustiveness check.

**The first draft argued this conditionally. It no longer needs to.** That draft reasoned that
`transition-primitives` §5.3 would have fixed the defect as a side effect of widening
`PivotalKind`, that R3 had withdrawn the widening, and that the fix would therefore leave with it
*if* that RFC landed in its reduced form. It has since landed, been implemented, and been archived
(`930b367`, `57f86da`), and the reasoning is now checkable rather than predictive. Three things
are verified at `efdd7e0`:

1. **The widening did not land.** `PivotalKind` (`pivotal.ts:9`) still has exactly four members;
   `defended_duty_acquired` is not among them.
2. **The cast fix did not land with it.** `renderPivotalMarker` (`pivotal.ts:68-75`) is still an
   `if`-chain, still falls through to `marker.detail as IrreversibilityDetail` at `:72`, and still
   has no `never` binding. The defect is present in shipped code today.
3. **The archived RFC assigns it here in its own normative text**, so this is a handoff and not a
   claim this RFC makes about itself. Its criterion 7 reads *"SUPERSEDED BY R3. No `PivotalKind`
   is added, so this RFC does not modify `renderPivotalMarker`; D48 remains assigned to
   `live-marker-quality`"*, and its handoff section repeats *"`renderPivotalMarker` remains owned
   by `live-marker-quality`"*. The ledger row agrees: *"the transition live tier was removed by
   R3, so `transition-primitives` deliberately does not widen or fix this path;
   `live-marker-quality` owns the exhaustive correction."*

**So D48 is unowned by anything else and unfixed in code.** It belongs here on the merits too: D48 is a
correctness defect on **the marker's only text surface**, and §1.0 established that
`renderPivotalMarker` is exactly that — `Timeline.svelte:75` discards the `label`, so the modal
sentence is the entire disclosure. Also, this RFC is now the second consumer of that function's
shape (`liveAdmitted` switches on the same `kind`), which is precisely when a non-exhaustive
dispatch stops being latent.

**The fix, unchanged from `rfc/archive/transition-primitives.md` §5.3 minus its dependency:**

- `renderPivotalMarker` becomes a `switch` over `marker.kind` ending in a `never` binding.
- **All seven existing outputs across the four kinds are byte-identical**: `phase_change` (`:69`);
  `human_divergence` (`:70`); `option_collapse` in both its one-move and n-move forms (`:71`);
  and the three irreversibility sentences `castled`, `last_of_role`, pawn contact (`:73-75`).
  Pinned by a test written **before** the conversion.
- **The `never` binding fixes the defect; it does not remove the casts.** `PivotalMarker`
  (`pivotal.ts:14`) is a flat interface, not a discriminated union — `kind` and `detail` are
  independent fields — so `switch (marker.kind)` narrows `kind` and leaves `detail` at the full
  union, and each arm still casts. What the binding buys is that **adding a fifth kind becomes a
  compile error instead of a wrong sentence**, which is the whole of D48. Making `PivotalMarker`
  a discriminated union is a larger change with consumers in `voice.ts`, `story.ts`,
  `compare-strips.ts` and the server evidence packet; see open question 4.
- **The escape hatch the first draft wrote is gone and is not replaced.** It said that if
  `transition-primitives` were *"later re-drafted with a live tier and lands first, this section
  is satisfied by its criterion 7 and becomes a no-op."* That RFC has landed and is archived; its
  criterion 7 was superseded rather than met, and it discharged nothing. **No other document owns
  this fix.** If this RFC does not ship §5, D48 stays open with no assignee — which is how it
  reached its second RFC in the first place.

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
judged, because L4(b) settles it without any measurement.

**This is decided, not proposed.** The owner ruled on 2026-08-15 (late) that this section's
conservative default stands and that **no third permission value** is created for mass-only rung-3
content (banner above; `planning/exploration/log.md`, entry *four rulings; nothing owner-gated
remains before codex*, ruling 3). What follows is the ruling, written as the specification —
there is no remaining choice in this section and no hedge toward the third-value alternative
anywhere in it.

> **Normative:** a `human_divergence` firing is admitted live only where
> `permittedAssistance(context).humanSplit === "free"` — that is, for a solo or host viewer while
> `feedbackDeliveryOpen`. Where it is `"locked_off"`, the marker is not placed and its sentence is
> not rendered on the live surface.

`liveAdmitted` therefore takes the permission as an argument and `liveMarkers` takes an
`AssistanceContext`; both signatures are given once in §4.2. `DrillScreen.svelte:291` already has
`assistancePermission` in scope from `:286`, and the `AssistanceContext` it is built from —
`{ sessionKind, deliveryOpen: feedbackDeliveryOpen(run), role: viewerRole }` — is available at the
same site.

Rationale in one line each: the same screen enforces this gate on the endpoint carrying the same
rung-3 source (`DrillScreen.svelte:996`); a spectator or participant should not learn from a dot
what they are locked out of learning from a button; and `design/05` §3a's *"everything the product
knows arrives after the commitment"* is the disclosure model the gate implements. The
retrospective and story surfaces are untouched; this gates the **live** placement only.

**The cost, accepted with open eyes, stated in the body rather than only in the banner.** The
counter-argument was that masses-without-moves is a materially weaker disclosure than
moves-with-masses, and that `rfc/archive/adaptive-guidance.md` §4d renders no moves deliberately —
so gating the weaker disclosure by the stronger one's permission over-tightens. The owner heard it
and ruled for the conservative gate anyway. Consequently, and by design:

- the marker **leaves participants and spectators entirely**, on every run, permanently;
- it **leaves solo and host play until the run opens feedback delivery** — and because
  `feedbackDeliveryOpen` closes again on `attempt_end`, it **re-closes on the next committed
  move**. In a drill that is a narrow and intermittent window, not a steady state;
- the ruling is **recorded as cheap to reverse**, to be revisited after the surface has actually
  been used rather than pre-emptively. Reversal is a change to one arm of `liveAdmitted` plus
  criterion 6's test.

**And the wave closes both delivery legs.** The runtime/client projection closes D51's live-modal
leg. The REST checks specified in §1.1c-ii close D68's `/voice` and `/speech` leg. Both use the
same `humanSplit` permission; neither invents a weaker mass-only permission.

#### 6.3 `option_collapse` — obligation only

No change. Recorded as grandfathered-unmeasured, with the obligation: firing rate, lift and
co-signal share on the same corpus, plus a sensitivity check on the three constants at
`pivotal.ts:60` and on `legalCount`'s promotion arithmetic at `:23`. Under L2 the lift is the
number that decides it; the argument in adaptive-guidance §4e predicts a good one (a funnel is
created by *this* forcing move, not by the position) and predictions are not evidence.

### 7. Registers

**Nothing versioned. No register is claimed.** Verified per lane:

| Register | Claim | Why not |
|---|---|---|
| Pack schema | **none** | No `$defs`, no condition arm, no predicate member, no validation code. `0.20`, `0.21` (`deviation-classes`, archived `63bb6ab`) and `0.22` (`transition-primitives`, archived `57f86da`) have all **landed** since this draft was started; `0.19` is frozen shut and `0.23` is left free for `engine-request-contract`. This RFC touches none of them and the monotonic constant is untouched |
| `AssistanceConfig.version` (`assistance.ts:4`, currently **4**) | **none** | No key is added or removed and no stored value changes validity: `markers` keeps its `"off" \| "live"` domain (`apps/web/src/lib/assistance-preference.ts:5`) and `"live"` keeps its meaning — *live markers on*. Only the admitted set narrows, which is not persisted. `migrate` (`:10-17`) is untouched, and a v4 blob written before this RFC loads identically after it |
| Run schema (`DrillRun.schemaVersion`) | **none** | No event type, no event payload, no node field. `pivotalMarkers` is and stays a pure projection over the run |
| `PivotalKind` | **unchanged at four members** | The enum is not widened or narrowed; `last_of_role` is a `detail.subkind`, not a kind |
| Shape / evidence-fact registers | **none** | No `RULES_EVIDENCE_FACTS` entry, no shape schema change |
| Refusal codes (`ServerErrorCode`, `apps/server/src/errors.ts:1-...`) | **none** | D68 reuses **`ASSISTANCE_WITHHELD`**, already emitted by `/human-split` and `/corpus`; no new member is introduced |
| Migrations | **none** | No storage migration; nothing is persisted by this RFC |

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

1. **`liveAdmitted` and `liveMarkers` exist, exported from `packages/runtime/src/index.ts`,** with
   the §4.2 signatures — `liveAdmitted(marker, permission)` and `liveMarkers(run, branchId,
   context)` — and `liveAdmitted` is a `switch` over `marker.kind` ending in a `never` binding.
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
   before the conversion pins **all eight** outputs byte-identically (`phase_change`;
   `human_divergence`; `option_collapse` × 2; `castled`; `last_of_role`; pawn contact — six
   existing strings across four kinds, plus the queens-off `last_of_role` form); and a type-level test asserts that adding a fifth `PivotalKind`
   member fails to compile rather than rendering the pawn-contact sentence.
6. **The divergence gate holds on every delivery path.** A test
   asserts a `human_divergence` marker is present in `pivotalMarkers` and absent from
   `liveMarkers` for a participant, for a spectator, and for a solo viewer with
   `feedbackDeliveryOpen === false`; and present for solo/host with delivery open. A second test
   asserts `DrillScreen` renders no divergence sentence in the modal in the locked cases. **This
   criterion closes the client leg of D51.** Server tests assert `/voice` and `/speech` return
   `ASSISTANCE_WITHHELD` for participant, spectator, and pre-disclosure solo contexts, then open
   for solo/host after disclosure. `evidencePacket` remains a viewer-independent projection; the
   permission is enforced before either route serves or synthesises its sentences.
7. **Law 8 at the surface.** A test asserts no string returned by `renderPivotalMarker` for any
   constructible marker contains a member of `BANNED_JUDGEMENTS`
   (`packages/runtime/src/voice.ts:21`).
8. **No register moved.** A test asserts `SILENT_ASSISTANCE` equals its current value verbatim
   (extending `adaptive-guidance.test.ts:89`), that `AssistanceConfig["version"]` is still `4`,
   that a v4 preference blob written before the change loads unchanged, and that `PivotalKind`
   has exactly four members.
9. **The register in §3.1 matches the code.** A test enumerates the kinds and sub-kinds for which
   `liveAdmitted` returns `true` — under a permission where `humanSplit === "free"`, and again
   where it is `"locked_off"` — and asserts the set equals §3.1's **"Renders live today: yes"**
   rows for each case. (The first draft said *"admitted live: yes"*, a column §3.1 no longer has
   and which answered "grandfathered" to a yes/no question; the split into *Renders live today* /
   *Evidence basis* / *Measurement status* is what makes this criterion testable at all.) A second
   assertion checks that every row whose **Measurement status** is *never measured* has an
   **Evidence basis** of *none*, so the table cannot silently acquire evidence it does not have.
10. **The obligation is recorded, not implied.** The ledger rows this RFC's findings require —
    D51, D52 and D53 — **already exist**, written by claude on 2026-08-15; the first draft's claim
    that *"this draft did not write them"* was true when written and is now stale. What this
    criterion requires is therefore the **flip**, not the creation: **D50, D48, D51, D52 and D53
    are each resolved or explicitly re-scoped with a one-line summary in the owner-tier closeout
    archives this RFC** (the ledger half of the RFC completion protocol) — D50 and D48 to ✅, D51
    to a closure naming the client leg, D68 to a closure naming the server leg, and D52/D53 left
    ✅-less with their obligations restated, since this RFC records them rather than discharging
    them. The implementing agent does not edit the owner-tier backlog.

## Open questions

1. **Should `markers` become per-kind rather than one switch?** §1.0's finding — a learner who
   wants the one measured-useful marker must accept three unmeasured ones — argues yes, and it
   would make the grandfathering in L6 much cheaper to live with. It is an `AssistanceConfig`
   version-5 bump with a `migrate` arm, and it is a bigger surface change than D50 warrants.
   Deferred; not blocking. **Owner-facing if the answer is yes**, because it changes the shape of
   the assistance control at `DrillScreen.svelte:695`.
2. ~~**Is §6.2's divergence gate right, or over-tight?**~~ **RESOLVED — owner ruling 2026-08-15
   (late).** §6.2's conservative default **stands**: the marker is gated behind the stronger
   `humanSplit` permission, and **no third permission value is created** for mass-only rung-3
   content. The question was whether gating the weaker disclosure (masses without moves) by the
   stronger one's permission (moves with masses) over-tightens; the owner accepted the cost
   knowingly — the marker leaves participants and spectators entirely and leaves solo play until
   delivery opens, which under `attempt_end` re-closes on the next committed move. Recorded as
   cheap to reverse and worth revisiting **after** the surface is used, not pre-emptively. §6.2 is
   the specification of this ruling; nothing in this RFC hedges toward the third-value option.
   *No action for the implementer beyond §6.2 and criterion 6.*
3. ~~**Should the `last_of_role` sentence render `queensOff`?**~~ **RESOLVED by owner ruling 2026-08-15: YES, render it.** Criterion 5 pins **eight** constructible outputs with the new sentence written out; the seven existing outputs are not frozen. Rationale: the archived judgement calling the queens-off form *"the version of this fact players actually track"* was made when this was one sentence among many, and it is now the **only** sentence on the unasked surface — which raises the value of getting it right. *Superseded question:* The field is set
   (`transition.ts:255`) and never read (`renderPivotalMarker`, `pivotal.ts:74`), and
   `rfc/archive/adaptive-guidance.md` §4b calls the queens-off form
   *"the version of this fact players actually track"*. It is now the **only** sentence on the
   live surface, which raises the value of getting it right — but changing it edits a pinned
   string and criterion 5 pins the six outputs byte-identically. Resolve before `accepted`:
   either the six stay frozen and this waits, or criterion 5 pins seven with the new one written
   first.
4. **Should `PivotalMarker` become a discriminated union?** The `never` binding fixes D48's
   symptom; the casts at `:69-72` remain because `kind` and `detail` are independent fields
   (`pivotal.ts:14`). The union is the real fix and touches `voice.ts`, `story.ts`, `compare-strips.ts`,
   `guidance.ts` and the `EvidencePacket` type. Inherited verbatim from
   `rfc/archive/transition-primitives.md` open question 9; deferred with it, not resolved here.
5. **Does L3's ceiling survive contact with a second admitted kind?** With one kind live the
   union budget is untested — and, as L3 now states, **unverified even for today's surface**,
   because three of the four live kinds have unknown firing rates. The first proposal to clear L1
   and L2 will be the first real test of whether 0.10 firings per ply is generous, tight, or the
   wrong shape of budget entirely (a per-branch count might be the honest unit, since the learner
   experiences a branch, not a ply rate). Revisit then rather than guessing now.
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
- 2026-08-15 (cross-review, by an agent that did not write the draft). Ten changes, in descending
  severity. **(1)** New §1.1c-ii: **D51 has a second leg the draft never looked for** —
  `evidencePacket` folds the `human_divergence` sentence into `packet.sentences`, and `POST
  …/voice` and `POST …/speech` serve it with **no permission check at all**, while their siblings
  `/human-split` and `/corpus` refuse with `ASSISTANCE_WITHHELD`. A client-only gate does not close
  a permission defect; the section names it, scopes it out with reasons, owes a ledger row, and
  criterion 6 gains a characterisation test so it cannot be mistaken for closed. **(2)** L2 gains
  three clauses. **L2(i)**, the zero-denominator clause: R3's quiet population is non-capture by
  definition, so a capture-gated detector's 0.0%-on-quiet is a **definitional artefact** and its
  lift is undefined, not infinite. This is the state of the one instrument the RFC admits, and
  §3.1 and §4.1 now name the all-alternatives 0.2% and the n=17 co-signal as the evidence instead.
  **L2(ii)**, applicability: the alternatives instrument has no counterfactual for
  `human_divergence` (an event, not a move) or `option_collapse` (a three-decision span), so **two
  of four existing kinds cannot be measured by the mandated instrument** — a substitute population
  must be named and defended rather than the proposal refused. **L2(iii)**, the population's bias
  is inherited by every anchor. **(3)** New §3.0a records the adversarial constructions: a
  *"the piece you captured was defended"* marker clears L1 and, under the draft's L2, clears the
  alternatives axis with infinite lift — **L2(i) plus L3's corrected unit are what stop it, and
  either alone leaves the hole open.** **(4)** L1 and L6 contradicted each other on day one — L1
  says *only if* T ∧ C, L6 forbids removing kinds that have never been tested against T ∧ C; a
  precedence paragraph now states that L6 wins for grandfathered kinds and L1 binds from the
  moment a measurement lands. **(5)** L3's unit was ambiguous and the ambiguity was exploitable
  (per-ply vs per-alternative); fixed to **≤ 0.10 admitted firings per ply played**, with the
  alternatives population demoted to an estimator, and L3 recorded as **currently unverified**
  for its own surface. **(6)** §5 rewritten: `transition-primitives` **landed and was archived**
  (`930b367`, `57f86da`) while this draft sat, so the conditional argument is replaced by three
  verified facts — the widening did not land, the cast fix did not land with it, and the archived
  RFC's criterion 7 and handoff **assign `renderPivotalMarker` to this RFC by name**. The
  draft's escape hatch (*"whichever lands first discharges it"*) is deleted as false. **(7)** The
  owner ruling on open question 2 was in the banner only; §6.2 is rewritten as the specification
  of the ruling with the accepted cost enumerated in the body, and open question 2 is closed
  **RESOLVED**. **(8)** §4.1's claim that demoted sub-kinds stay *"available in the modal"* is
  **withdrawn as false** — `openPivotal` derives from `projectedPivotal`, so the live-tier learner
  loses those sentences entirely, which §4.2 already implied and §4.1 contradicted. **(9)** §3.1's
  single *Admitted live* column answered "grandfathered" to a yes/no question; split into
  *Renders live today* / *Evidence basis* / *Measurement status*, which is what makes criterion 9
  testable. §4.2's two incompatible `liveAdmitted` signatures unified. Criterion 10 corrected:
  D51/D52/D53 **already exist** in the ledger, so the criterion is a flip, not a creation — and
  the one genuinely owed row is named. **(10)** Every code citation re-verified at `efdd7e0` and
  **~50 stale line numbers corrected** — `930b367` rewrote `pivotal.ts` and moved the
  `irreversibility` detector and `IrreversibilityDetail` to `transition.ts`, so essentially every
  `pivotal.ts:` and `DrillScreen.svelte:` reference the draft carried was wrong; ledger rows
  re-cited **by title** per repo convention; `rfc/transition-primitives.md` re-pathed to
  `rfc/archive/`; `assistance-preference.ts` re-pathed to `apps/web/src/lib/`; a
  locate-by-symbol advisory added to the header. Refusal-code collision sweep run and recorded in
  §7: **clean, no new code, and the future server fix needs only the existing
  `ASSISTANCE_WITHHELD`.** Template compliance verified. **Still nothing versioned.**
