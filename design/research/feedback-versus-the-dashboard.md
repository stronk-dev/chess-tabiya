# Can feedback beat "Stockfish labels + prose"? — the shipped surface measured against the named anti-pattern

**Question:** **Q8**, *"Can feedback beat 'Stockfish labels + prose'?"*
(`planning/exploration/plan.md:30`, §Q8 at `:205-216`). Attached gates K6, C1 (C1 withdrawn
2026-08-13). The anti-pattern is a standing law rather than a hypothesis: *"Stockfish: +0.54 /
Maia: 31% / LLM: 'Ne5 centralizes the knight' is a dashboard, not a drill"* (`AGENTS.md:94-95`).

**Why it is answerable now.** Q8 was written as a paper exercise — *"write the feedback for one
real branch comparison by hand … and have the Q7 reviewer judge it"* (`plan.md:213-214`). That
route died with C1 (`gates.md:98`, no reviewers exist). What exists instead is a shipped feedback
surface, 37 authored packs, and — decisively — **R3's mechanical usefulness gate**
(`census-hint-false-positives.md` §3b), the first instrument in this repo that can call a true
statement useless without asking a person.

**Instrument:** `tools/q8-feedback-surface-harness/` — a disposable research harness under
`rfc/0000-rfc-process.md` §Exploration gate, not referenced by `packages/` or `apps/` and not part
of `pnpm test`. It imports the **shipped** runtime (`structuralReading`, `irreversibility`,
`classifyPhase`, `endgameReading`) and reuses R1/R2/R3's corpus walker verbatim
(`tools/r1r2-primitives-harness/corpus.ts`). Raw output: `q8-output.md`. Two further measurements
use the shipped CLIs `pack-check` and `sourcing-check` unmodified.

**Machine of record:** Apple M3 Max, Node v26.7.0 arm64, chessops 0.15.1 `[V]`.

**What is measured and what is argued.** §3 (the baseline) is desk research inherited from eight
teardowns, labelled `[V]`/`[P]` per claim. §4–§7 are measurements over the committed corpus and
the shipped code, labelled `[V]`. §8's axis-by-axis verdict is argument on top of those
measurements, and every step that is a judgement rather than a count says so `[M]`. **No move is
graded and no position is evaluated anywhere in this pass** — law 8 is live here for the same
reason it was in R3, and the boundary is held the same way.

---

## 1. Verdict

**Yes on three axes, no on two, and the two failures are ours rather than structural.**

**We beat the baseline where the difference is *when* and *what it is bound to*, and those wins
are shipped and real** `[V]`:

1. **Consequence before verdict.** The baseline's unit is a finished game annotated. Ours is a
   decision re-entered: disclosure is gated on commitment by construction
   (`packages/runtime/src/feedback.ts:22-30`), and the strongest competitor's re-entry is a
   *one-ply* Retry puzzle behind $119.99/yr (`teardown-chesscom-platform-desk.md` §2).
2. **Preserved alternatives.** Rewind appends `run.rewound` and deletes nothing
   (`packages/runtime/src/runtime.ts:385-414`). Every teardown that examined a competitor's undo
   found the attempt destroyed (`teardown-drwolf-desk.md`, `teardown-chesscom-desk.md`).
3. **Authored prose anchored to the move you did not play.** **235 deliverable deviation notes**,
   each bound to a named non-spine move at a named node `[V]` (§5e). This is the one thing R3's
   axis D says a census can never do and an eval label never does: it names the alternative.

**We do not beat it on the two axes the anti-pattern is actually about** `[V]`:

4. **Volume and selection.** The dashboard's sin is answering a question nobody asked. Our
   rung-0 reading answers it **58 times per position** (median; max 97, §5c), and the compare
   view's structure strip prints **8.31 entries per ply** and fires on **99.8%** of transitions —
   with **99.3%** of quiet alternatives producing an entry too and **90.4%** producing one of the
   *same kind* (§5d). Lift ≈ **1.01×**. That is R2/R3's *renderer, not a detector* verdict, now
   measured on the shipped comparison surface rather than on a proposed one. A census with no
   selection is a dashboard with more rows.
5. **The claim layer does not reach the learner at all.** **131 authored feedback claims exist
   across the 37 packs and 0 of them are deliverable** `[V]` (§6) — the exact artefact §Q8 names
   as the alternative to the dashboard (*"claims carry evidence refs + uncertainty"*,
   `plan.md:209`). And of the **66** machine-checkable evidence-type labels on the 32
   ledger-bearing packs, **66 are unbacked** `[V]`: the refusal machinery is built, wired, and
   currently refusing 100% of what it is pointed at.

**So the honest one-line answer: we beat the baseline on timing, preservation and anchoring —
today, in code — and we have not yet beaten it on saying the useful thing, because the layer that
was supposed to say it is authored but undelivered, and the layer that is delivered is a census.**
This is a *specific, cheap* gap, not a structural one: §9 names four changes, three of which are
delivery wiring rather than research.

**K6 (*"explanations remain generic despite curated packs"*) — partial evidence FOR firing, and it
should be recorded as such rather than left `open`.** The derived half is generic by construction:
the shipped evidence sentences say *"Tabiya's strict outpost detector condition holds at this
position"* with no square, piece or file (`apps/web/src/lib/evidence-sentences.ts:35`), because
`rules:` refs carry the feature kind and not its parameters (`docs/structural-reading.md:72-76`).
The authored half is emphatically **not** generic (§4c quotes it) — but 22.1% of the authored
prose corpus by volume cannot be delivered (§6). K6 fires on the delivered surface and does not
fire on the authored one, and the fix is to deliver the authored one.

---

## 2. Method and corpus

**Corpus.** The same 37 committed drill packs in `content/drafts/` R3 used, replayed from each
pack's `start.fen` through its spine tree: **634 transitions**, **515 distinct positions** `[V]`.
Phase distribution **236 opening / 18 middlegame / 259 endgame / 121 cross-phase** `[V]` —
identical to R3, which makes every number below directly comparable to
`census-hint-false-positives.md` §5.

**Alternative-move population.** For the discrimination axis, every legal move from each parent is
enumerated and the quiet ones (non-capture, non-checking) retained — **14,463** evaluated `[V]`.
Same construction as R3 §2, same stated limitation: it over-weights blunders and under-weights
human-plausible moves.

**Surfaces in scope.** Everything a learner can see that is not the board itself:

| Surface | Source rung (`05` §3) | Push or pull | File |
|---|---|---|---|
| Timeline pivotal markers | 0 / 3 | **push** | `packages/runtime/src/pivotal.ts` |
| Post-commit guard prompt | 0 / 2 | **push** (on-ramp packs only) | `apps/server/src/guard.ts` |
| Checkpoint / terminal authored sheet | 5 | **push** (at a boundary the learner reached) | `apps/server/src/authored-feedback.ts` |
| Comparison strips + narrative | 0 / 2 | **push** (inside a compare the learner opened) | `packages/runtime/src/compare-strips.ts` |
| Story moments | 0 / 2 | **push** (post-game) | `packages/runtime/src/story.ts` |
| Structural reading | 0 | **pull** (closed by default) | `packages/runtime/src/structure.ts:452` |
| Corpus page | 4 | **pull** | `apps/web/src/lib/corpus-sentences.ts` |
| Human split | 3 | **pull**, delivery-gated | `apps/server/src/rest.ts:1049` |
| Voice re-rendering | 6 | **pull**, packet-checked | `packages/runtime/src/voice.ts:33` |

**The push/pull split is load-bearing and it is R3's own line.** R3 §7c endorses the on-request
tier explicitly — *"a true answer to a question the learner asked is not noise; the learner chose
the cost"* — while condemning the unasked marker. So the T/C/D gate is applied at full strength to
the push column and used as a *volume* diagnostic on the pull column. Conflating the two would
have condemned a surface R3 deliberately spared.

**Law 8 boundary.** Every number is a count over shipped code or shipped content. Where a sentence
says a surface is *better* or *worse* it is either (a) a count, labelled, or (b) flagged `[M]`. No
engine, tablebase or model was consulted in this pass.

---

## 3. The baseline, characterised honestly

A strawman here would invalidate the whole dossier, so the baseline gets its strengths first.

### 3a. What "Stockfish labels + prose" actually delivers

**It is always available.** One engine call answers every position on the board, in every phase,
in every opening, with no author. That is not a small property — it is the property our entire
content tier is paying 43.5 min/pack to approximate (`pack-authoring-cost.md`), and it is why
`design/05-in-run-experience.md` §5b concedes the middlegame *"has neither"* theory nor tablebase.

**It is never wrong about the number.** Rung 2's stated failure mode in our own ladder is precise:
*"it is right about the position and can still be wrong about the lesson"* (`05` §3, rung 2). An
eval is not a lie. WintrChess ships Stockfish + a chess.com-style classification layer as the
*entire* product and is a real, used product `[V]` (`quickpass-wintrChess-encroissant-chessmonitor.md`
§WintrChess).

**It has an installed ritual.** Chess.com auto-offers Game Review after every game — *"rematch
your opponent, start a new game, or run the Game Review"* `[V]` (support 8584089, via
`teardown-chesscom-platform-desk.md` §Adoptable). Our own adoption audit rates this the top cheap
adoption available to us (`adoption-audit.md`).

**And the prose half is genuinely wanted.** A 1200-rated App Store reviewer of Take Take Take,
100 games in `[V]`: *"the engine suggestions are a mystery to me at my ELO so the writing is
nice"* (`teardown-taketaketake-desk.md` §5). The demand for words over centipawns is real and
evidenced; that is exactly why the anti-pattern is tempting.

### 3b. Where it fails, and the failure is documented rather than assumed

**The number answers a question the learner did not ask.** This is the ladder's own formulation
(`05` §3, rung 2) and it is why "+0.54" cannot tell you *what to do differently* — only that
something happened.

**The prose half fabricates.** Take Take Take ships LLM review prose over Stockfish data and was
publicly caught, on launch day, describing a bishop as cutting a defence along a line no bishop
travels, describing a Stockfish PV as if it had been played, and softening a game-losing blunder
to *"incredibly risky"* — reviewer verdict *"almost everything this LLM says about chess is
irrelevant or wrong … a slop machine"* `[V]` (`teardown-taketaketake-desk.md` §5). This is the
anti-pattern shipped by a Carlsen-cofounded, Coatue-backed company. ChessMindAI's review prose
generator is undisclosed with no public confabulation catch — *unresolved, not passed* `[V]`
(`teardown-chessmindai-desk.md`).

**And classification labels without grounding erode trust.** WintrChess carries public reliability
complaints for exactly this `[P]` (same quickpass §WintrChess).

**The structural ceiling: it cannot let you play it again.** Chess.com Game Review's only in-review
interaction is a **one-move** Retry puzzle; play re-entry is a manual, unlinked
Self-Analysis → Practice-vs-Computer chain that destroys attempts `[V]`
(`teardown-chesscom-platform-desk.md` §2). Dr. Wolf's undo *erases* the attempt and its blunder
guard retracts the move *before* the consequence `[V]` (`teardown-drwolf-desk.md`). Chess2Story's
moment slides are read-only `[V]`. **Nobody in the matrix re-enters play from the explanation.**

**So the baseline is: universally available, numerically honest, ritually established, and
structurally incapable of the one thing this product is for.** That is a strong opponent, and it
is the one to beat.

---

## 4. What we ship, read from the code

### 4a. The derived (rung-0/2) sentences — the vocabulary a learner actually gets

The durable evidence-reference vocabulary is **34 `rules:` facts, 1 `theory:` fact, plus `pack:`,
`pack-absent:`, `tempo:` and `engine:` families** (`packages/runtime/src/evidence-ref.ts:1-49`)
`[V]`. Their rendered sentences are a closed table
(`apps/web/src/lib/evidence-sentences.ts:23-62`) `[V]`, and the eighteen structural entries are
**parameter-free by design**:

> "Tabiya's strict outpost detector condition holds at this position."
> "The authored per-colour direct-attack count holds at this position; opposing counts are not
> combined." `[V]` (`evidence-sentences.ts:35,43`)

The reason is stated and correct: `rules:` refs carry the feature *kind*, not its square or file,
so a parameterised sentence would invent data that was never persisted
(`docs/structural-reading.md:72-76`) `[V]`. Position-specific prose is recomputed live instead, and
*that* vocabulary is properly scoped:

> "While the current pawn files remain, no opposing pawn can attack e5 by advancing on its file."
> "White's knight on f3 has 6 attack-reachable squares in the current occupancy; check and pins
> are not evaluated." `[V]` (`apps/web/src/lib/structural-sentences.ts:18,24`)

This is real rung-0 discipline and it is better than any competitor's classification layer on
honesty: every sentence carries its own scope, no sentence asserts a balance, and `outpost` and
`named_structure` name themselves as *Tabiya's* convention rather than as chess truth `[V]`
(`structural-sentences.ts:21,25`). The cost is measured in §5c.

### 4b. The refusal machinery

Four refusals ship, and all four are real code paths, not doctrine:

- **Voice packet check** — an LLM re-rendering is rejected if it introduces any square, move,
  chess noun, judgement word or prescriptive verb absent from the packet
  (`packages/runtime/src/voice.ts:21-40`); two failures fall back to deterministic text
  (`apps/server/src/guidance.ts:48-59`) `[V]`.
- **Objective refusal** — a plan-family pack that declares a graded objective but compiles to no
  transition rules is refused at load with `OBJECTIVE_GRADES_NOTHING`
  (`apps/server/src/pack-validation.ts:423`) `[V]`.
- **Assistance withholding** — human-split and corpus requests return typed `ASSISTANCE_WITHHELD`
  when the delivery window is closed or the role forbids it (`apps/server/src/rest.ts:1049,1066`)
  `[V]`.
- **Evidence-type refusal** — a claim labelled `corpus_observed`, `engine_validated` or
  `tablebase_exact` with no matching ledger record raises `EVIDENCE_TYPE_UNBACKED`, escalating
  from warning to **error** when `provenance.reviewStatus` is `published`
  (`apps/server/src/sourcing/check.ts:182-193`) `[V]`. §6 measures what it currently catches.

### 4c. The authored tier — what it actually reads like

The authored prose is not the generic layer, and quoting it is the fairest possible test. Three
real annotations, verbatim from the corpus `[V]`:

> `lucena-bridge-convert` / `w-rd4` (`Rd4`): *"The signature move of the whole position: the rook
> takes the fourth rank for no visible reason. The reason arrives four moves from now, when this
> rook becomes the wall your king hides behind. Building it on the fifth or sixth would leave the
> king with no roof at exactly the wrong moment."*

> `anti-italian-center-attack-black` / `p8-nf6` (`Nf6`): *"Hit e4 now, while c3 has taken the b1
> knight's defence square away. Every White centre move from here must also answer for the e4
> pawn."*

> `carlsbad-minority-attack` / `rab1-minority` (`Rab1`), second annotation: *"It also tells Black
> what you intend a move early. That is the honest cost, and the deviation at a3 is the same plan
> played in the other order."*

Each names a *timing beat*, a *cost*, or an *alternative ordering* — the vocabulary
`plan.md:209-210` asked for (*"timing/tempo events … beat eval deltas"*). None is derivable from
an eval. **This is the half of our surface that beats the baseline, and it is authored, not
computed** `[M]` — the judgement that these read better than "+0.54" is mine; the count of what
exists is §4d's.

### 4d. Content census — what has been written

Over the 37 packs `[V]`:

| Artefact | count | prose (chars) | delivered to a learner? |
|---|---|---|---|
| spine annotations | 425 | 79,268 | ✅ all statically reachable (§6) |
| deviation notes, spine/start-anchored | 235 | 54,139 | ✅ |
| deviation notes, FEN-anchored | 40 | 8,848 | ❌ excluded (`authored-feedback.ts:151`) |
| plan classes referenced by an `intent_capture` checkpoint | 103 | 24,394 | ✅ |
| plan classes not referenced | 2 | 500 | ❌ |
| **feedback claims** | **131** | **32,560** | ❌ **none** (§6) |
| concept identifiers | 146 | 2,770 | ❌ by design (`explanation-grounds.md:147`) |
| **total** | | **202,479** | **77.9% deliverable, 22.1% not** |

Checkpoint interactions: **38 `intent_capture`, 0 `stated_reasoning`, 107 with no interaction**,
over 145 checkpoints `[V]`. Feedback policies: **31 `delayed_checkpoint`, 6 `immediate_guard`**;
6 packs carry a `guard` block `[V]`. All 37 packs are `reviewStatus: draft` `[V]`.

---

## 5. The measured gate — R3's T/C/D applied to our own surfaces

R3's definition, unchanged (`census-hint-false-positives.md` §3b): a firing is useful **only if**
it is **(T)** not a restatement of the move, **(C)** about something contested under the rules
alone, and **(D)** not equally true of the moves not played.

### 5a. Which of our surfaces the gate binds

T and C are predicates over a *transition census firing*. They apply directly to the pushed
transition markers (§5b). D applies to anything that claims to be about a move or a branch —
including the compare strip (§5d). Neither T nor C is defined for a *position projection* asked
for by the learner, so the reading is measured on volume and on D's position-level analogue
instead (§5c), which is the same treatment R3 §7c prescribed for the on-request tier.

### 5b. The pushed markers — one already fails, two barely exist

**`irreversibility`** (`pivotal.ts:53`, rendered `:73-75`) fires on **85/634 = 13.4%** of spine
transitions: `pawn_break` **48 (7.6%)**, `castled` **20 (3.2%)**, `last_of_role` **17 (2.7%)**
`[V]`. This **independently reproduces R3 §7c's figure to the transition** — only `last_of_role`
clears T, because `castled` and `pawn_break` restate the move the learner just committed, giving a
**79.9% false-positive rate on a shipped, unasked marker** `[V]`. R3 declined to propose a fix and
this dossier does not either; it records that the number is now confirmed twice, by two harnesses,
on the same corpus.

**`phase_change`** (`pivotal.ts:49`) fires on **1 of 634 transitions = 0.2%** `[V]`, and **110
transitions (17.4%)** touch the `unclear` band where the marker cannot fire at all `[V]`. It is
not false-positive; it is very nearly absent on curated content, which is expected — a pack rarely
spans a phase boundary — and means the marker's value is a Just Play claim that this corpus cannot
test.

**`option_collapse`** (`pivotal.ts:60`) requires a sustained triple (prior ≥8, then ≤3, then ≤3,
same colour). The *floor* condition alone holds at **65/515 = 12.6%** of corpus positions
(legal-move count median 28, p95 43) `[V]`; the sustained form was not enumerated here and is
noted as unmeasured.

**`human_divergence`** (`pivotal.ts:29-38`) needs recorded `opponent.move_selected` events and so
cannot be measured on authored spines at all. It is the marker `05` §5a calls *"the most
product-native detector available"*, and it is **the one detector in the set that no census can
imitate and no eval can produce** — and it remains **unmeasured**, because no wave has played a
run since 2026-08-12 (`pack-authoring-cost.md`, carried qualification). That is the single
highest-value missing measurement in this dossier.

**The post-commit guard** (`apps/server/src/guard.ts`) fires on two rules conditions — a material
drop of ≥3 (`:161`) or an undefended major/minor (`:164`) — plus a recorded engine swing
(`:199-230`). It is the one place we *do* use an eval label live, and it is fenced three ways:
`immediate_guard` only, post-commit only, and pack-declared per band. It ships in 6 of 37 packs
`[V]`. The rules tier is T-clean by construction (a material drop is not a restatement of the
move; it is its consequence), which is worth stating because it is the one pushed surface designed
after R3's lesson rather than before it.

### 5c. The pulled reading — volume is the finding

`structuralReading(fen)` over the 515 corpus positions `[V]`:

**min 18 / median 58 / mean 57.90 / p95 92 / max 97 observations per position.**

| kind | per position | positions where present |
|---|---|---|
| `line_blockers` | 15.66 | 92.4% |
| `piece_count` | 12.00 | **100.0%** |
| `pawn_safe_square` | 7.17 | 93.6% |
| `piece_reach_count` | 7.17 | 93.6% |
| `direct_attack_count` | 6.35 | 75.7% |
| `open_file` | 3.27 | 58.4% |
| `bishop_on_shade` | 1.92 | 63.9% |
| `king_zone` | 1.46 | 83.5% |
| `piece_distance` | 1.00 | **100.0%** |
| `half_open_file` | 0.88 | 55.7% |
| `isolated_pawn` / `passed_pawn` / `backward_pawn` / `doubled_pawn` | 0.27 / 0.22 / 0.20 / 0.13 | 24.7 / 19.4 / 16.5 / 9.5% |
| `king_opposition` | 0.11 | 11.3% |
| `named_structure` | 0.07 | 7.0% |
| **`outpost`** | **0.00** | **0.4%** |

**Thirteen of the median 58 observations are unconditional** — twelve per-colour/per-role piece
counts and one king-to-king distance are emitted for *every* position by construction
(`structure.ts:454`, and `docs/structural-reading.md:49-53` states this as intended) `[V]`. Against
that, the feature the whole rung-0 argument is built on — the outpost, named in `05` §5 and §5c —
**fires on 2 of 515 positions** `[V]`.

**This is the honest cost of the closed-by-default reading.** It is *pulled*, so R3's exemption
applies and none of this is a false positive in R3's sense. But the shape is unmistakable: a
learner who opens the panel to ask *"what changed here"* receives a 58-line census in canonical
order that *"never ranks or compares"* (`docs/structural-reading.md:61-63`) `[V]`, of which the
rarest and most interesting entries are buried among twelve piece counts. **A dashboard is not
redeemed by being opt-in; it is only made polite** `[M]`.

### 5d. The compare strip — axis D, and this is the failing one

`comparisonStrips` emits one structure entry for every observation present at a node and absent at
its predecessor (`packages/runtime/src/compare-strips.ts:32`), rendered as *"A recorded structural
observation changed: `<kind>`."* Measured on the same 634 transitions `[V]`:

- fires on **633/634 = 99.8%** of transitions;
- **5,266 entries, mean 8.31 per ply**, median 8, p95 16, max 24.

**Axis D, run exactly as R3 §6 ran it** — for each of the 596 parents where the played move
produced an entry, every quiet alternative from the same parent is evaluated `[V]`:

| measure | value |
|---|---|
| quiet alternatives evaluated | 14,463 |
| that also gain ≥1 observation (pooled) | 14,388 = **99.5%** |
| mean within-position share that also gain ≥1 | **99.3%** |
| mean within-position share that gain ≥1 of the **same kind** | **90.4%** |

**Lift over a random quiet move ≈ 1.01×.** R3 condemned `slider_lines_changed` at **1.05×** with
32.5% of alternatives also signalling (`census-hint-false-positives.md` §6). The shipped compare
strip is **worse on both numbers**, and it is not a proposal — it is the difference layer of the
surface `00-thesis.md` calls the product's one original claim.

`DESIGN-GAP:`-adjacent, for `n-way-comparison`/`branch-set-scale` rather than for design tier:
**the compare strip's structural half tells the learner that moving changed the position.** It is
true, it is unranked, and it is ~99% shared with every move not played.

**The sibling-branch measurement makes the consequence concrete.** At the 44 authored fork pairs
in the corpus — genuinely different continuations from the same parent — the two branches' full
structural readings overlap at **Jaccard median 65.7%** (mean 65.4%, min 51.8%, max 80.2%), leaving
a **median of 36 differing observations** between the two branches `[V]`. `CompareView.svelte:119`
prints both readings in full, side by side, and by contract never says which difference matters.
**So the answer to "why did these two attempts turn out differently" is currently 36 unranked
sentences per pair** `[V]`. The baseline answers it with one number that is wrong about the
lesson. Neither is good; ours is at least not misleading, and that is a real but thin win `[M]`.

### 5e. The authored tier — the gate does not apply, and the analogue passes

T, C and D are defined over census firings; authored prose has no firing. The defensible analogue
is D's substance: **is the statement about the decision, and does it name what was not played?**

- **235 deliverable deviation notes pass by construction** `[V]`: each is anchored to a specific
  non-spine `moveUci` at a specific spine node (`authored-feedback.ts:150-165`), and each is
  revealed when its anchor node is in scope *whether or not the learner chose that move*
  (`explanation-grounds.md:148-149`). That is the exact object R3 says a census cannot produce.
- **Annotations, lexical proxy** `[V]`: **68.5%** (291/425) contain at least one SAN-shaped board
  token other than the node's own move; **30.4%** (129/425) contain none. The regex counts squares
  as well as moves, so this is indicative rather than exact and is labelled as a proxy.
- **131 feedback claims cannot be measured on this axis at all**, because they are never delivered
  (§6).

### 5f. Endgame steering — the named-technique surface is thinner than the gate row claims

`gates.md:B10` records *"endgame steering by named technique"* as shipped. Measured `[V]`:

- `endgameReading` is non-null on **256/515 = 49.7%** of corpus positions;
- of those, **147 (57.4%) are untyped**, rendering *"Endgame; the material is outside Tabiya's
  material-census convention."*;
- a named technique is emitted on **31 positions = 6.0%** of the corpus — only the
  rook-and-pawn-versus-rook family reaches the branch (`endgame.ts:35-38`);
- and the rendered sentence is:

> *"Rook and pawn versus rook under Tabiya's material-census convention. Named technique: Lucena
> (Standard endgame-literature name; Tabiya's material-census convention.) **No technique entry is
> available yet.** Named technique: Philidor (…) No technique entry is available yet."* `[V]`
> (`endgame.ts:47`, sample FEN `1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1`)

`design/05-in-run-experience.md` §5b is the repo's clearest statement of what guidance should
sound like — *"this is endgame X, so use the rook to push the enemy king into a small box while
you promote"*. What ships names the family, names two techniques **without distinguishing which
applies**, and states that the content does not exist. The naming is honest; the steering is not
there. **Q8's strongest structural claim — endgames are the phase where honest guidance is most
achievable — is currently the least populated surface in the product** `[V]`.

---

## 6. The claim layer — authored, checkable, and unreachable

This is the dossier's sharpest single finding and it is a delivery defect, not a research result.

**131 feedback claims exist. Zero can be delivered.** `[V]` Three independent confirmations:

1. `projectAuthoredFeedback` — the only shipped path for authored prose
   (`explanation-grounds.md:120-122`) — delivers exactly three shapes: spine annotations,
   spine/start-anchored deviation notes, and referenced plan classes
   (`authored-feedback.ts:129-167,235-249`). `feedbackClaims` is not among them, and
   `explanation-grounds.md:147` states this deliberately: *"unanchored feedback claims … remain
   absent."*
2. The public pack projection strips them — asserted by a shipped regression
   (`apps/server/src/drill-client-server.test.ts:158`).
3. The **one** runtime consumer is `keyPointViews` at `apps/server/src/reasoning.ts:64`, which
   resolves an `authored_claim` ground on a `stated_reasoning` checkpoint. **The corpus contains
   0 `stated_reasoning` checkpoints** `[V]` (§4d). So the single door is shipped, correct, and
   unopened.

**And the binding those claims advertise is currently 0% honoured** `[V]`. `sourcing-check`, run
unmodified over all 37 packs:

| | count |
|---|---|
| evidence-type labels that are machine-checkable (`corpus_observed`, `engine_validated`, `tablebase_exact`) | 67 |
| …on the 32 packs that have an evidence ledger | 66 |
| **raising `EVIDENCE_TYPE_UNBACKED`** | **66 (100%)** |
| packs with no `.evidence.json` ledger at all | 5 |
| packs at `reviewStatus: published` (where the warning becomes an error) | **0** |

The remaining **121** labels (`author_principle` 80, `hypothesis` 24, `derived_feature` 17) are
self-declared and not machine-checkable by design — which is the correct design, and is exactly
the *"uncertainty"* half `plan.md:209` asked for.

A worked example, because the shape matters `[V]`. `anti-italian-center-attack-black`'s first
claim reads *"…the position after 3.Bc4 was reached 44,467,486 times … and White scores 50.1%
against 45.9%. Your own most common answer is already 3...Bc5 (34.2%)"*, labelled
`corpus_observed`. Its ledger sidecar contains real `engine_eval` and `position_legality` records —
but they support `/start/fen`, not `/feedbackClaims/0/text`. **The author ran the query, typed the
number, and the ledger never learned about it.** The checker catches this precisely and today it
is a warning because nothing is published.

**Read together:** the product has 32,560 characters of the most specific, most learner-relevant,
most citation-bearing prose in the corpus; none of it reaches a learner; and the mechanism that
would prove its citations correct is currently rejecting every one it can see. That is not the
dashboard anti-pattern — it is the opposite failure, and it is why Q8 cannot be answered "yes"
today.

---

## 7. What we do that the baseline structurally cannot — with evidence status

| # | Claim | Status | Evidence |
|---|---|---|---|
| 1 | **Consequence before verdict.** The learner plays it out before being told anything | **shipped and measured** | `feedbackDisclosed`/`feedbackDeliveryOpen` split, and `attempt_end` **re-closes on the next committed move** (`packages/runtime/src/feedback.ts:22-30`) `[V]`; `compare()` strips `engine:` refs and returns empty evidence before disclosure, with a regression that first failed against the leak (`explanation-grounds.md:81-99`) `[V]`; 31/37 packs are `delayed_checkpoint` `[V]`. Baseline ceiling: Game Review's only re-entry is a one-ply Retry, Diamond-tiered `[V]` |
| 2 | **Preserved alternatives for comparison.** Rewind forks, never erases | **shipped, comparison content measured and weak** | `rewind` appends `run.rewound`; no node is removed (`runtime.ts:385-414`) `[V]`. But §5d: the compare strip's structural half has ≈1.01× lift and 36 unranked differences per sibling pair `[V]`. The *mechanism* beats every competitor; the *explanation of the difference* does not yet |
| 3 | **Authored claims bound to evidence, with a refusal when unbacked** | **shipped and refusing; content 0% bound, 0% delivered** | Refusal code at `sourcing/check.ts:182-193` and `pack-validation.ts:423` `[V]`; 66/66 checkable labels unbacked `[V]`; 0/131 claims deliverable `[V]` (§6) |
| 4 | **Disclosure timing as a designed property** | **shipped and measured** | Five policies, path-relative reveal derived from the append-only log rather than an authored scope field, rewind cannot un-reveal (`explanation-grounds.md:125-131`) `[V]`; `outcome.reached` discloses under every policy `[V]`. No competitor in the matrix has a disclosure model at all `[P]` |
| 5 | **Prose anchored to the move you did not play** | **shipped and measured** | 235 deliverable deviation notes, each bound to a named non-spine move, revealed whether or not the learner played it `[V]` (§5e) |
| 6 | **The learner states reasoning before seeing the answer, and is never graded on it** | **shipped and entirely unused** | `stated_reasoning` with literal-only matching, a fixed honesty sentence, and no score/percentage/verdict of any kind (`docs/open-answer-grading.md`; `packages/runtime/src/reasoning.ts:38-63`) `[V]`. **0 of 145 corpus checkpoints use it** `[V]` |
| 7 | **LLM as mouth, never source, machine-checked** | **shipped, unmeasured in use** | `voiceCheck` rejects any square, move, chess noun, judgement or prescriptive verb absent from the packet (`voice.ts:21-40`) `[V]`; two failures → deterministic text `[V]`. No provider is configured in any measured run, so the check's real-world rejection rate is unknown |
| 8 | **Human divergence as a decision detector** — *"players at your level split three ways here"* | **shipped, unmeasured** | `pivotal.ts:29-38`; requires ≥3 candidates at ≥15% mass and no move above 50% `[V]`. Needs played runs; none since 2026-08-12 |
| 9 | **Endgame steering by named technique** | **designed only** | 6.0% firing, technique text absent (§5f) `[V]` |
| 10 | **Corpus evidence with an abstention floor and an anti-quality guard sentence** | **shipped** | *"These counts say what this population played, not what is good."* plus a 100-game abstention floor rendered as a refusal (`apps/web/src/lib/corpus-sentences.ts:3,10-12`) `[V]`. R9 validated the 100-game floor as exactly the 60/40 line (`human-outcome-coverage-depth.md`) `[V]` |

---

## 8. The verdict, axis by axis

**Axis: honesty.** We win, decisively and structurally `[V]`. Every sentence names its convention;
the LLM is machine-fenced; absence is rendered as absence (abstention floor, "not detected", "no
technique entry is available yet"). The baseline's prose half is caught fabricating in public.
**Cost: none — this is free and already banked.**

**Axis: timing.** We win `[V]`. Disclosure follows commitment by construction, and the barrier is
carried by the run rather than the viewer. No competitor has this. **Cost: none.**

**Axis: re-entry.** We win `[V]`. Fork-not-undo, preserved attempts, replay under different
resistance. Every teardown confirms the field destroys attempts. **Cost: none.**

**Axis: specificity — "does it tell me something about *this* decision".** **We lose today** `[V]`.
The delivered derived layer is a 58-line census with ~1.01× move discrimination and parameter-free
evidence sentences. The delivered authored layer is good (§4c) but is 425 annotations + 235
deviation notes across 37 packs — thin, and confined to the spine. The baseline gives a number on
every move of every game. **This is where "Stockfish labels" wins on availability and we win only
where an author has been.**

**Axis: the claim layer.** **We forfeit** `[V]`. 0/131 delivered.

**Authoring cost, honestly.** `pack-authoring-cost.md` measures **43.5 min/pack** over 33
instrumented packs, tooling friction 11.6%, K10 not firing; openings 28.8 min (39.1 fully loaded
with grounding), Syzygy endgames 40.6, trajectories 97.5. Against that, this dossier's census says
**22.1% of the prose those minutes bought is currently undeliverable** `[V]`. The marginal cost of
fixing that is not authoring time — the words are already written. It is delivery wiring.

**So: can we beat the baseline?** **Yes, on honesty, timing and re-entry — today, measurably, and
structurally rather than by degree. Not yet on specificity, and not at all on the claim layer.**
And the gap is not that our idea is wrong; it is that **the part of our idea that answers Q8 is
authored and undelivered, while the part that is delivered is a census R3 already told us not to
trust unranked.**

**A defensible restatement of the anti-pattern for our own case** `[M]`: *the dashboard failure is
not caused by using Stockfish, Maia and an LLM — it is caused by rendering everything you know at
the moment you know it, with no selection and no anchoring.* By that definition our derived layer
is a dashboard with better manners, and our authored layer is not a dashboard at all. **Q8's
answer therefore depends on which of the two the learner actually receives, and today it is
mostly the first.**

---

## 9. What would change the verdict

Four items, in ascending cost. None requires new research to *start*.

1. **Deliver the claims** (wiring, ~small). Give `feedbackClaims` an anchor — the schema already
   has `stated_reasoning` grounds, `intent_capture` checkpoints and per-node annotations to hang
   them on — and 32,560 characters of the corpus's best prose becomes reachable. This is the
   single change most likely to flip axis 5. *Needs an RFC because it changes the delivery
   contract, not because the answer is unknown.*
2. **Bind the claims that can be bound** (content wave, ~small). 66 unbacked labels, all with a
   shipped attach path (`make candidate-attach … --target /feedbackClaims/<i>/text`,
   `apps/server/src/sourcing/explorer.ts:239-262`). This is the difference between "claims carry
   evidence refs" as a design sentence and as a fact.
3. **Rank or filter the compare strip and the reading** (RFC, medium). The measurement in §5c–§5d
   is exactly the input such an RFC needs, and R3's T/C/D conjunction is a ready-made,
   already-validated filter that ran at 0% false-positive by construction on its own leaf. *This
   is the one item that is genuinely a design fork*: `05` §3 says rung 0 cannot be wrong, but
   ranking rung-0 facts is a significance judgement, which is rungs 2–5 by `05` §5. A defensible
   middle is to rank by *change* rather than by *importance* — surface only what the move altered,
   suppress the standing census — which is arithmetic, not judgement `[M]`.
4. **Play a run and measure `human_divergence` and the voice check** (research, small). Both are
   shipped, both are unmeasured, and both are things no competitor can do. The blocker is the same
   one `pack-authoring-cost.md` already flags: **no wave has played a run since 2026-08-12.**

**What would make the verdict worse:** if a played-run measurement showed `human_divergence` firing
at census-like rates with census-like discrimination, the "most product-native detector" claim in
`05` §5a would be in the same position `defended_duty_acquired` was after R3, and the honest
detector list would be down to one member.

---

## 10. Limits of this pass

1. **No learner and no reader was asked.** Every number is a count over code or content. §5d's
   D-axis is a mechanical discrimination measure, not a judgement about whether 36 unranked
   sentences are usable; that judgement is flagged `[M]`.
2. **The corpus is 37 authored packs and the middlegame sample is 18 plies** — the same standing
   limitation R3 and R1 recorded. Every middlegame-resolved figure here is indicative only.
3. **Three shipped surfaces could not be measured at all** because they need a *played* run:
   `human_divergence`, the recorded-engine half of the guard, and the voice provider check. This
   is the pass's largest hole and it is the same hole `pack-authoring-cost.md` flagged.
4. **The annotation D-proxy in §5e is lexical**, counts squares as moves, and over-counts. It is
   labelled as a proxy and no conclusion rests on it alone.
5. **`option_collapse`'s sustained-triple form was not enumerated**; only its floor condition was.
6. **The baseline characterisation is inherited desk research** from eight teardowns. No
   competitor was operated hands-on in this pass; every §3 claim carries the label its source
   dossier gave it.
7. **§5c compares a pulled surface to a pushed one.** R3's exemption for on-request reading is
   respected — the reading is *not* counted as false-positive — but the argument that volume
   without ranking is still a dashboard is an argument, not a measurement `[M]`.

---

## Appendix — reproduction

```sh
# §5b–§5f, §2: the shipped derived surfaces over the pack corpus
npx vitest run --config tools/q8-feedback-surface-harness/vitest.config.ts
# writes tools/q8-feedback-surface-harness/q8-output.md

# §6: claim binding, over every pack
make sourcing-check FILE=content/drafts/<pack>.json

# §6: annotation reachability (no AUTHORED_PROSE_AFTER_LAST_CHECKPOINT on any pack)
make pack-check FILE=content/drafts/<pack>.json
```

`§4d`'s content census is plain arithmetic over `content/drafts/*.json`; the field paths are
`spine[].annotations[]`, `deviations[].note`, `planClasses[]`, `feedbackClaims[]`, `concepts[]`,
and `checkpoints[].interaction.type`.

---

## Proposed ledger updates

*(This dossier does not edit `plan.md`, `gates.md`, `log.md` or `BACKLOG.md`; claude lands them.)*

**`planning/exploration/plan.md:30` — Q8 row:**

> | Q8 | Can feedback beat "Stockfish labels + prose"? | 📊 evidence 2026-08-15 — **yes on honesty, timing and re-entry; not yet on specificity; forfeit on the claim layer**: the shipped compare strip has ≈1.01× move discrimination (99.3% of quiet alternatives also fire), the rung-0 reading prints a median 58 observations per position, and **0 of 131 authored feedback claims are deliverable** while 66/66 checkable evidence labels are unbacked. `design/research/feedback-versus-the-dashboard.md` | K6, ~~C1~~ |

**`planning/exploration/gates.md:69` — K6:**

> | K6 | Explanations remain generic despite curated packs | **📊 partial evidence FOR firing** | `design/research/feedback-versus-the-dashboard.md`: the *derived* half is generic by construction — `rules:` evidence sentences carry the feature kind but no square/file (`evidence-sentences.ts:35`), the compare strip renders *"a recorded structural observation changed: `<kind>`"* at ≈1.01× lift over a random quiet move, and the closed-by-default reading emits a median 58 unranked observations per position. The *authored* half is **not** generic — but 22.1% of the authored prose corpus by volume cannot be delivered, including **all 131 feedback claims**. K6 fires on what is delivered and does not fire on what is written; the remedy is delivery, not authoring |

**`planning/exploration/gates.md:127` — B4 (residual list):** add *"authored feedback claims have
no delivery path (0/131 reachable) and no bound evidence (66/66 checkable labels unbacked) —
measured 2026-08-15"*.

**`planning/exploration/gates.md:132` — B10:** qualify *"endgame steering by named
technique"* — the technique branch reaches **6.0%** of corpus positions and renders *"No technique
entry is available yet."*; 57.4% of non-null endgame readings are untyped.

**`design/BACKLOG.md` — four rows proposed:**

1. *Deliver authored `feedbackClaims` to a learner* — 131 claims, 32,560 chars, currently zero
   delivery paths; the only consumer is a `stated_reasoning` ground and no pack uses one.
2. *Bind the 66 unbacked evidence-type labels* via the shipped `candidate-attach` explorer/engine
   path so `corpus_observed` / `engine_validated` / `tablebase_exact` mean what they say before any
   pack is published.
3. *Rank or filter the compare strip and the structural reading by change rather than by census* —
   the 1.01× lift and the 36-differences-per-sibling-pair figures are the inputs.
4. *Author one `stated_reasoning` checkpoint* — the surface that most clearly beats the baseline
   (learner states reasoning before disclosure, never graded) is shipped and used by 0 of 145
   checkpoints.
