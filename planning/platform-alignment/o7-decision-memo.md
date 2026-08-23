# O7 decision memo — what is a Review Map moment, and how may it label a move?

**For:** Marco · **Prepared:** 2026-08-23 · **Queue row:** `planning/platform-alignment/decision-queue.md:44`
**Handoff under review:** `planning/platform-alignment/review-map/o7-handoff.md` (last touched `4f0d341`, 2026-08-21)
**Active draft that overtook it:** `rfc/review-map.md` (`ecbcae7`, 2026-08-23)

Every claim below was re-read at HEAD. Where a cited line had drifted, the drift is named.

---

## The question

*On the post-game review surface, which positions are allowed to become a "moment", and what
words may the product put next to a move without becoming the engine review screen the thesis
says kills it?*

---

## What the research settled

Constraints, not choices. Each verified at HEAD:

1. **A moment is an actionable position, not a sentence.** The re-entry path is shipped:
   `apps/web/src/App.svelte:406-411` rewinds to the node, creates a `story-reentry` fork, *then*
   navigates — so the original continuation survives and N-way compare is possible `[V]`.
2. **Selection needs two stages.** [[D690]] (`design/BACKLOG.md:613`): with a narrow module
   allow-list *and* cap-one-per-position already applied, two 52/60-ply trajectories still yielded
   **13 and 16** candidate moments `[V]`.
3. **Zero moments is valid.** [[D690]] also measured 0–2 on short games and refused a fixed
   minimum `[V]`.
4. **Recorded engine pivots are phase-skewed.** [[D691]] (`design/BACKLOG.md:614`): consecutive
   recorded evaluations exist for **20/20 openings, 0/13 middlegames, 0/14 endgames, 0/2
   cross-phase** `[V]`. *(Correction: both the handoff `:17` and `rfc/review-map.md:223` render
   this as "0/29 middlegame/endgame". Middlegame+endgame alone is **0/27**; 29 only if the two
   cross-phase trajectories are folded in. The conclusion is unaffected; the figure is a lump.)*
5. **Two independent eights select the shared card.** Client: `story.rank.slice(0, 8)` — ranked —
   at `apps/web/src/lib/GameStoryScreen.svelte:14`. Server: `story.moments.slice(0,8)` —
   chronological, rank ignored — inside `publicStory` at `apps/server/src/service.ts:915`. Both
   verified at HEAD `[V]` ([[D688]]).
6. **A false provenance footer ships today.** `GameStoryScreen.svelte:30` stamps *"rendered from
   recorded engine evidence · Tabiya"* onto a card whose moment may be a rules marker or a shape
   firing `[V]` ([[D687]]).
7. **The grader is built and has zero callers.** `packages/runtime/src/grade.ts` is 214 lines;
   `moveQualityGrade` (`:151`) and `winPercentFromCp` (`:95`) have **no production caller** —
   only `index.ts` re-exports them `[V]`. `compileModuleRegistry`
   (`packages/runtime/src/module-contract.ts:190`) likewise has **zero production invocations**
   `[V]`. `grep -riw accuracy apps/` returns **0** `[V]`.

---

## What has changed since the handoff — the recommendation is partly moot and one clause is now wrong

The handoff is dated **2026-08-21**. Three things landed after it.

### (a) `rfc/move-quality-grades.md` was accepted 2026-08-22 — and it puts the forbidden words on this surface

The handoff's O7.3 reads, verbatim (`o7-handoff.md:49-50`):

> *"It does not say best, brilliant, good, inaccuracy, mistake or blunder."*

But `rfc/move-quality-grades.md` (status **implementing**; *"Accepted 2026-08-22 by claude after
adversarial cross-review"*, `:3`) routes context `review` and `imported_analysis` to the **`report`
ladder**, whose closed class is exactly `inaccuracy | mistake | blunder`
(`packages/runtime/src/grade.ts:44-47` context map, `:72-76` payload type, `:30-32` constants
5/10/15) `[V]`. The renderer that emits those words is shipped:
`renderMoveQualityGrade` (`grade.ts:196-206`) `[V]`.

**So the handoff's O7.3, as literally worded, contradicts an accepted RFC.** Approving the queue's
recommendation verbatim would approve a self-contradiction.

### (b) You already ruled the central question on 2026-08-23 — [[D1273]]

`design/BACKLOG.md:458`: *"OWNER RULING 2026-08-23 (review depth): FULL SURFACE PLUS ACCURACY AND
LONGITUDINAL. Navigable move list, **per-move grades on the accepted ladder**, the moment map,
Retry-from-here on every row… plus an accuracy figure and cross-game trends."* `[V]`

That ruling settles the half of O7.3 the handoff got wrong: grades are in.

### (c) `rfc/review-map.md` was drafted on that ruling and has already fixed most of the rest

| Queue clause (`decision-queue.md:44`) | Status at HEAD |
|---|---|
| *"default 0..3 bound"* | **Still yours.** Assumed at `review-map.md:175-177`, registered as open question 1. `learner-modules.md:726-730` deliberately leaves the count unbounded, so nothing else fixes it. |
| *"eligible families"* | **Narrower than stated.** The *shape* of the policy is already fixed by `rfc/review-evidence-compiler.md:368-375`: typed family-local policy, per-family admission predicate, per-family quota, fixed cross-family priority, deterministic ties, explicit overflow and absence, **no universal numeric score**. Only *membership* is open. |
| *"optional engine context"* | **Superseded.** Evaluations are now the *input* to every grade and the *denominator* of the accuracy figure (`review-map.md:198-214`). They are mandatory where present and abstain where absent — not "optional context". |
| *"retry-first actions"* | **Mostly moot.** [[D1273]] ruled Retry-on-every-row; `review-map.md:145-167` specifies it and acceptance criterion 4 (`:337-341`) asserts the fork-before-open ordering. |
| *"exact theory/drill joins"* | **Not yours to rule here.** `review-map.md:65` defers theory/drill identity joins to F7 (`rfc/runtime-opening-identity.md`). The only clause left is *"absence renders honestly, never filled by search"*. |
| *"shared provenance"* | **Already fixed regardless of ruling.** `review-map.md:395` says the divergence fix lands either way; criterion 8 (`:351-353`) asserts byte-identical moment ids across private/share/card and criterion 10 (`:357-359`) forbids the literal false footer string appearing in source at all. Only the public share **form** (layout, card art) remains yours (`:66`). |

**One thing the queue row omits that genuinely needs you:** game review has **no home in the intent
tier**. `design/03-product-breadth.md:290` defines Review as *"runs, branch comparisons, deep
analysis, shared sessions"*, `:57-67` lists rewind/fork/compare/difference-strips with no post-game
report, and B3 is recorded *shipped in full* at `:325` `[V]`. Law 5 forbids the RFC writing that
home; it is Discharge D2 (`review-map.md:376`) and open question 6.

---

## The recommendation — the clauses actually being approved

1. **O7.1 — map size: 0..3, no minimum, at most one per phase actually represented in the game;**
   a declared critical exact event may displace phase balance. "Show more" opens the inspector and
   never silently enlarges the default map. *(The current 8 is a mechanical ceiling, never a
   researched default — `learner-modules.md:726-730`.)*
2. **O7.2 — moment membership: a workflow-declared allow-list** of exact semantic events, exact
   tablebase state, authored pack/checkpoint facts, opening identity/exit where recorded, and
   terminal outcome. **Shape firings and engine pivots may only *nominate*** a position; the card
   ships only if it also carries an admitted learner-facing fact *and* an action. Every admitted
   family needs a positive fixture, a hard negative and an abstention case.
3. **O7.3 — labelling: replace the handoff's wording.** Grade words are permitted on this surface
   **only** under the law-8 rules in the next section. The moment cards remain factual; the grade
   lives on the move list. Evaluation and PV sit behind an explicit, secondary Analyze action, with
   the verdict hidden while a retry is in progress.
4. **O7.4 — doors: ratify what [[D1273]] already implies.** Retry-from-here on every move-list row
   and every moment card; Compare after a second branch exists; theory/drill only on an exact
   registered identity join, absence stated honestly; Analyze explicit and secondary.
5. **O7.5 — share: one projection, computed footer.** Same moment ids, order and provenance as the
   private map; footer derived from the admitted items. The card *form* stays open.
6. **Authorize the `design/03` amendment (D2)** so game review has an intent home, or say
   explicitly that it does not get one and the RFC must justify itself on `design/03:290` as it
   stands.

---

## The genuine choice points

Only these five are unsettled by evidence.

**1. Map size — 0..3 (recommended), 1, or 0..5.**
Cost of 3: three cards on a 60-ply game is a 5:1 to 5.3:1 compression of [[D690]]'s 13–16
candidates; some real moments are dropped silently. Cost of 1: the surface becomes Lichess's
"one engine-identified mistake", which `review-map.md:53-54` cites as the thing we differ from.
Cost of 5: closer to the current 8 and to [[D686]]'s measured failure — cap two filled by
`occupied_defence` merely because it was locally distinctive (`design/BACKLOG.md:609`).

**2. Two ladders, one product — does review re-grade a drill run?**
`grade.ts:44-47` routes `drill → practice` (2.5/6/14, `:33-35`) and `review → report` (5/10/15,
`:30-32`) `[V]`. **Consequence nobody has ruled: a 7-win-point drop is a "Mistake" in the
post-commit nudge during the drill, and is ungraded thirty seconds later when the same ply is
reviewed.** `rfc/move-quality-grades.md:405-408` names *"the chess.com pattern where the same move
earns different words"* as its own counter-example — it meant different *players*, but the ladder
split produces different words for the same move on two of our surfaces. `rfc/review-map.md` does
not mention it.
- (a) **Keep both, print the convention** — the sentence already ends `(grade-convention@1/review)`
  vs `/drill` (`grade.ts:198`). Honest, cited to Lichess's own precedent, and asks the learner to
  read a convention id to explain a contradiction.
- (b) **Context follows the run, not the surface** — a drill run reviews on `practice`. Internally
  consistent per run; breaks the *"imported real games use the ladder the tradition reports on"*
  rationale (`move-quality-grades.md:260`) only for native runs.
- (c) **Suppress in-run grading**, leaving `postcommit_nudge` factual and grades review-only.
  Cleanest learner story; discards a consumer the accepted RFC exists to serve.

**3. Do moment cards carry grade chips at all?**
`review-map.md:96` permits a grade chip *and* a moment marker on the same row. The handoff forbade
both. Cost of allowing: the moment card becomes a verdict card, which is the failure shape.
Cost of forbidding: a genuine blunder can be a moment and the card cannot say why it was selected.
Recommended: the grade lives only in the move list; the moment card states the admitted *fact*.

**4. Moment allow-list membership** — specifically, whether a ≥150 cp recorded swing may be a
moment *on its own*. Recommended no (nominate-only). Cost: on the 20/20 opening mainlines that is
often the only thing we have, so opening review becomes thinner rather than richer.

**5. Does game review become a named `design/03` surface (D2)?** Cost of yes: a protected intent
edit you must author or authorize. Cost of no: `rfc/review-map.md` ships a surface its design
authority does not describe, which is the drift class the reconciliation gate exists to catch.

---

## The law-8 boundary

Stated so an implementer cannot misread it. `design/00-thesis.md:134-138`: *"The product dies if
it becomes a Stockfish review screen with a rewind button."*

**R1 — Four vocabularies are permitted on this surface, and nothing else.**

| Vocabulary | What grounds it | Where it may appear |
|---|---|---|
| The **grade class** — `inaccuracy \| mistake \| blunder`, closed, no praise member, no default member (`grade.ts:72-76`, `move-quality-grades.md:305`) | two paired engine evaluations from **one** instrument at **one** search limit, the unrounded win-percent drop, the threshold crossed, and `grade-convention@1/<context>` | the move list only, and only inside the frozen renderer sentence (R2) |
| **Registered facts** from `review_map`'s 48 admitted evidence rows (`rfc/learner-modules.md:1183`) | the projection's own typed operands | move list, evidence panel, moment cards |
| The **recorded human-policy distribution** | a measurement of behaviour, never a verdict | evidence panel |
| **Honest absence** — "zero moments were found", "no evaluation was recorded for this region" | the coverage computation itself | every region (`review-map.md:102-104`) |

**R2 — A grade word may exist only as the byte-exact output of `renderMoveQualityGrade`
(`grade.ts:196-206`), asserted by `assertMoveQualityGradeSentence` (`grade.ts:208-210`), which
throws `GRADE_RENDER_INCOMPLETE` on any deviation.** Consequence for the UI: **the move-list "grade
chip" must carry no class word.** A word in a table cell is a word-only rendering, which
`move-quality-grades.md:361-374` makes permanently red (fixture F-COR-1) and which
`review-map.md:129-135` restates. The chip is a non-verbal marker whose accessible name and
expanded row are the full sentence — or there is no chip. `review-map.md:96` (*"a grade chip"*) and
`:129-135` currently contradict each other on exactly this point.

**R3 — THE HOLE NOBODY HAS NAMED: landing the grade producer un-bans the judgement words for the
LLM.** `voice.ts:93-98` lists `mistake`, `blunder`, `inaccuracy`, `inaccurate`, `best`, `good`,
`brilliant` in `BANNED_JUDGEMENTS`. But `absentWords` (`voice.ts:107`) flags a banned word **only
when it is absent from the packet**, and `voiceCheck` (`:110-118`) builds its `source` string from
`view.items.flatMap(item => item.sentences)`. The moment `derived.grade.move_quality@1` renders on
this surface, the sentence *"Mistake — the recorded evaluation moved…"* enters `packet.sentences`,
and the LLM is thereafter licensed to write "mistake" and "blunder" free-form **anywhere in its
output on that surface** `[V]`. This is [[D421]]'s widening mechanism (`design/BACKLOG.md:819`)
firing through our **own producer** rather than through authored prose, and `rfc/review-map.md` §7
does not name it.
**Therefore, normative: the LLM voice path receives no grade item.** Grade sentences are excluded
from the packet handed to `VoiceProvider.render()`, or — equivalently — excluded from the `source`
string `voiceCheck` computes. Without this, law 8's *"may not grade moves"* has a hole the width of
the surface's own vocabulary.

**R4 — May never be said, on any ruling.** Any praise class, including an "ok" or "solid" for
below-threshold moves — *"good is the absence of a grade"* (`move-quality-grades.md:240-241`), so
most rows carry no chip at all. *"Best move was…"*, a principal variation or a candidate shortlist
in the ordinary map (PV lives behind explicit Analyze, verdict hidden during retry). Any
LLM-**selected** moment, LLM-inferred significance, or LLM-invented theory join. Attributed
**intent** for an imported game's player — `decision_class` has **0 occurrences in production code**
`[V]`; the colour rule at `apps/server/src/service.ts:828` commits every move of the chosen colour
with `actor: "user"`, and `rfc/longitudinal-store.md:128-140` already guards that the store *"does
not assert that player is the learner"*. Third-party verdicts relayed as ours: the direct fetch
asks Lichess for `evals=false&literate=false` (`apps/server/src/import-source.ts:73`) `[V]`, but a
**pasted** PGN bypasses that path and must be stripped of SAN suffix glyphs at the record boundary.

**R5 — Every authored string is a frozen, instrument-attributed template.** A review screen is
overwhelmingly *our own* prose — card titles, empty states, the accuracy caption — which is
precisely the class `voiceCheck` does not gate at all ([[D421]]). Free-form authored prose is not
admitted here. The provenance footer is computed from the admitted items; the literal *"rendered
from recorded engine evidence"* must not appear in source (`review-map.md:357-359`).

**The one-line version:** *the product may print a number it measured and the convention it
measured it against; it may never print the judgement without them, and it may never let the
language model reach either.*

---

## The D1330 rank-9 recount ([[D1374]])

[[D1374]] (`design/BACKLOG.md:1664`) correctly refutes [[D1330]]'s claim that the Chessigma
teardown was *"in no lane, in no RFC"*. The lane is real: `design/research/capability-watch.json:115-119`
carries a `chessigma` entry re-checked **2026-08-20** with `"consumer": "review_map"` and
`"route": ["R7","O7","F6"]` `[V]`. **But the routing summary is looser than the ledger and looser
than HEAD**, and since the queue offered it as part of this ruling, here is what survives:

- **`rfc/review-map.md` contains zero occurrences of "chessigma"** `[V]`. Its only teardown citation
  is chess.com (`:53`). Every route is indirect, through `capability-watch.json`.
- **Candidate A** (*"re-entry at the exact ply with the original clock"*,
  `design/research/teardown-chessigma-desk.md:354`) is **split, not routed to one place**: the
  re-entry half is genuinely §4 (`review-map.md:151-157`), the clock half is in
  `rfc/recorded-clocks.md` — `grep -i clock` over `review-map.md` finds nothing `[V]`. D1374 says
  this correctly; the queue's compressed form does not.
- **Candidate B** (*"You blew a +3. Finish it this time."*, `:363`) is **in neither §4 nor §5** `[V]`.
  The nearest material is §7's generic disclosure rule (`:246-247`, verdict hidden during retry) —
  which is policy, not B's transformation.
- **Candidate C** (Conversion Trainer, `:371-375`) is **half-covered**: its detector appears as one
  family in §5's list (*"last near-level position before an imported loss"*, `review-map.md:180`),
  but the *"named entry that composes them"* the dossier calls C's **only missing piece** (`:375`)
  is specified nowhere `[V]`.
- **"§4/§5" is an addition.** The ledger row itself says *"`review-map.md` §4 (A/B/C)"* — §4 alone,
  no §5, no §6 (`design/BACKLOG.md:1664`) `[V]`.
- **"Routed to §6" overstates a planning assertion.** The only sentence is
  `planning/rfc-drafting-queue.md:1231-1234`, and its verb is *"**belonging to**"*, not "routed
  to". No edit to `review-map.md` corresponds. §6 contains **no** restraint metric, per-family
  false-positive figure, precision or recall — a grep for those terms over all 425 lines returns
  zero `[V]`. D1374's own row is consistent with the weaker reading: it still counts this candidate
  among the three that *"lack only a destination"*.

**Whether it belongs in this ruling:** a published per-family false-positive figure is a *different
kind of claim* from the coverage-gated accuracy figure §6 specifies. §6's accuracy is arithmetic
over our own evaluations (`100 − mean(dropWinPercent)` through the single exported
`winPercentFromCp`, `review-map.md:200-204`), and it abstains when coverage is incomplete. A
false-positive rate is a claim about **classifier quality**, which requires a labelled ground truth
we do not have. Routing it to §6 because §6 "already abstains" reuses an abstention mechanism for a
measurement that has no numerator — and the dossier's own form (`teardown-chessigma-desk.md:377-380`)
names its answer key as *"tablebase/rules rather than a competitor's labels"*, which is a collector
obligation, not a rendering rule. **Recommendation: it does not belong in this ruling.** Keep it
as a ledger row against the collector/classifier lane, not as a Review Map clause — publishing a
false-positive figure is a research obligation on whoever admits the family, not a rendering rule
on the surface that consumes it.

---

## What turns on it

- **F6 may draft.** The handoff's own self-block (`o7-handoff.md:5`) named O7 as the gate;
  `rfc/review-map.md:375` (Discharge D1) records these five sub-choices as the acceptance blocker.
- **`compileModuleRegistry` gets its first production invocation ever** (D5, `review-map.md:379`).
- **`rfc/move-quality-grades.md` leaves `implementing`.** Its D1 stays open until `review_map` and
  `postcommit_nudge` are compiled as real consumers; this surface is that consumer.
- **[[D1088]]'s remaining half closes** (`design/BACKLOG.md:410`): *"`grade.ts` has zero production
  callers, the Review surface remains ≤8 highlight cards with no accuracy figure or move list."*
- **Two shipped defects die**: the two-slice share divergence ([[D688]]) and the false provenance
  footer ([[D687]]).
- **The longitudinal store work front-loads**, which style and skills also need — one build instead
  of three ([[D1273]]).

---

## Citation drift found while verifying (for the RFC author, not for your ruling)

`rfc/review-map.md` cites `App.svelte:326-332` and `:369-371` for the re-entry path and the
cross-device throw; both are actually at **`:406-411`** and **`:408`** `[V]`. It cites
`module-contract.ts:188`; `compileModuleRegistry` is at **`:190`** `[V]`. It cites
`design/BACKLOG.md:485` for [[D880]]; the row is at **`:550`** `[V]`. The mechanisms are all real
and verified — only the line numbers moved. Everything else load-bearing in the RFC (the two
independent eights, the false footer, `disabled={true}` at `GameStoryScreen.svelte:46`, the 68-line
screen, 0 hits for `accuracy`, the 5/10/15 constants, zero production callers, `0.00368208`
appearing only at `grade.ts:41`) reads exactly as claimed at HEAD `[V]`.
