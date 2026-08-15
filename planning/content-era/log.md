# content-era — log (append-only)

## 2026-08-12 (claude, setup)

- Job opened after the owner's full-breadth content ruling
  (`design/04-content-architecture.md`). Codex's suggestion adopted: authoring
  cost is instrumented in six separate categories from the first minute, since
  one aggregate number cannot tell us what to fix.
- Second deliverable made explicit and equally weighted: batch 1 must yield the
  authoring contracts the four failed RFC attempts could not honestly define.
  A pack that produces content but no contract input has half-failed.
- Not started: no authoring yet.

## 2026-08-12 (claude) — cost-model correction before authoring starts

- Flagged before the first measurement, not after: the six-category model
  assumed a human author. Here the author is an agent and the reviewer is the
  owner, so `agent-*` and `owner-review` are logged as separate clocks and
  never merged. K10's verdict is on the pipeline total, and the load-bearing
  number is owner-review — tooling cannot reduce judgment time; only content
  reuse and better first drafts can.
- Division of labour set: claude authors (chess judgment), owner reviews,
  codex builds authoring tooling. Codex does not write chess content.

## 2026-08-12 (codex) — draft check and preview tooling

- Added `make pack-check FILE=<path>`. It validates the file against the
  living v0.2 schema, runs the shipped spine-legality and prediction-count
  lints, and rejects feedback/opponent policies or objective conditions that
  the current server cannot execute. Output is one human-readable line per
  issue with a JSON Pointer path; errors return a non-zero status while lint
  warnings remain visible and non-fatal.
- Added `make pack-preview FILE=<path>`. It checks and builds first, then starts
  the real app in development mode with the selected draft injected into the
  registry. The selected file is watched and restarts the app on change. A
  draft may replace an existing pack id in development, which makes editing
  the living example or a reviewed pack testable without copying it into the
  production registry.
- Added the committed `content/drafts/` author/reviewer workspace. Committing
  it keeps agent drafts and owner revisions reviewable as pipeline evidence.
  The registry reads it only in development, explicitly rejects
  `DRAFT_PACK_FILE` in production, and `.dockerignore` keeps the directory out
  of production image contexts.
- Exercised the actual command surface, not only unit helpers: the living
  Najdorf example passed `pack-check`; the illegal-spine fixture failed with
  `/spine/0/moveUci`; and a development preview served the selected pack from
  `GET /packs`. That preview run caught and fixed a bundle-relative schema-path
  defect before closeout.
- Tooling deliberately not built in this slice:
  - no visual/form pack editor or browser-side live linting — measured author
    friction must first show that the command loop is the bottleneck;
  - no PGN/FEN importer or spine generator — source-preparation cost has not
    yet been measured, and generating chess choices would cross into the
    author's judgment role;
  - no engine, Maia, corpus, or Syzygy authoring assistant — those belong to
    separate evidence passes and need Pack A's real workflow to define their
    useful contract;
  - no claim triggers, timing semantics, `provenanceMode`, or other authored
    vocabulary — the withdrawn RFCs and owner constraint require real content
    to produce those contracts rather than tooling inventing them;
  - no production upload/draft endpoint — drafts are intentionally a local,
    development-only surface, and a watched process restart is sufficient for
    the first measured loop.
- No Pack A cost-clock entry was recorded here. This was tooling work, not an
  agent authoring/research/encoding/revision pass, and Codex authored no chess
  content.

## 2026-08-12 — pack A (anti-caro-advance-c5-race), session 1 (claude)

agent-research 20 · agent-encoding 35 · agent-engine-validation 0 · owner-review 0 · agent-revision 5 · tooling-friction 5
notes: First real use of codex's `make pack-check`. It worked exactly as
intended — one schema error class (`annotations` must be an array, not a
string) reported with precise JSON paths and no stack trace; fixed in one pass,
second run green. Tooling-friction was 5 minutes and would have been 45+ without
the validator (hand-diffing a 260-line JSON against a schema). **Recorded
verdict: the validator paid for itself on its first use.** Engine validation not
yet run — that needs `pack-preview` + play-through, session 2.

contract-gaps (the second deliverable — what the format could NOT express):
1. **No claim triggers, exactly as predicted.** Both `feedbackClaims` are
   floating sentences. "The tempo claim should fire only when the player spent
   a move on h4 AND ...c5 has landed" is unsayable. This is EC-C1/AC-C1
   confirmed from the authoring side, with a concrete instance to encode against.
2. **The timing window has no vocabulary for what I actually wanted to say.**
   The teaching point is: White's plan-readiness vs Black's break arrival.
   I needed to declare (a) which move constitutes "ready" (Be3/c3 — a SET of
   moves, not one), (b) which Black move is "arrival" (...c5), (c) that h4 is
   the discretionary spend. `planMoves`/`opponentArrival` from the withdrawn
   RFC were the right shape after all — but they need to accept a move SET and
   allow the same move to be plan-completion on one branch and irrelevant on
   another. Neither withdrawn draft handled that.
3. **`preserve_plan_window` is a declared objective with no runtime meaning.**
   The registry accepts it; nothing evaluates it. So the pack's stated goal is
   currently decorative — this is the honest reason B4 matters.
4. **Deviation notes have nowhere to be shown.** I wrote five `deviations` with
   real teaching prose; no surface renders them (explanation-grounds ships
   objective grounds and engine evidence only). Authoring outran rendering.
5. **Boundary intuition check (the question the plan asked):** I set
   `spineNodeIds` + `plyHorizon: 14`. Under "plyHorizon caps, does not grant"
   this reads correctly — off-spine play inside 14 plies is NOT authored. Under
   the withdrawn union reading it would have wrongly claimed authority over
   every early deviation. **The corrected combinator matches author intuition.**

## 2026-08-12 (codex review of pack A draft; recorded by claude)

- Verified the draft passes the real validator and the tree is legal; confirmed
  the contract-harvest findings.
- **Governance finding accepted and acted on:** strategic claims and deviation
  judgments lack traceable grounding. "Original prose" answers copyright, not
  truth. Added §3b **graduation bar** to this plan; the draft's provenance now
  states the ungrounded status explicitly and lists graduation blockers, so the
  gap cannot be lost between sessions.
- Three findings that reshape session 2:
  1. **`intent_capture` is inert** — `CheckpointSheet.svelte` never reads
     `interaction`/`planClassIds`; it offers only Continue/Rewind/Compare. So
     the pack's plan choice cannot be recorded. **Contract gap #6: authoring
     outran rendering a second time** (first was deviation notes).
  2. **`pack-preview` uses the mock opponent and constant-zero evidence** —
     it validates playability and orchestration, NOT chess. Engine validation
     is a separate pass and must be logged as such.
  3. **`human_common` is unconstrained** — Maia may leave the spine, so
     `atSpineNode` checkpoints might never fire. Useful as resistance testing;
     a controlled authored-line walkthrough needs `theory_strict`.
- **Session 2 restructured into four separately-measured passes:** (a) controlled
  spine playability under theory_strict; (b) human_common off-spine behaviour;
  (c) real Stockfish validation; (d) an explicit inventory of authored
  structures that visibly do nothing — objective, intent capture, claims,
  deviation notes.

## 2026-08-12 (codex review #2; recorded by claude)

- Second governance finding accepted: the graduation bar enumerated only
  feedbackClaims + deviation judgments while the provenance block admitted that
  objective summary, plan-class descriptions, and spine annotations are equally
  ungrounded user-facing chess assertions. Bar widened to the **complete
  five-category assertion set**; under the previous wording three categories
  could have graduated ungrounded.
- Enforcement gap recorded rather than papered over: this is a process barrier,
  not a validator rule, and per-assertion grounding is unenforceable until the
  evidence encoding exists. Identified the cheap partial enforcement that IS
  possible with the shipped schema — `pack-check` should fail any pack whose
  `reviewStatus` is not `draft` while `provenance.sources` or
  `provenance.reviewers` is empty. Queued for codex.

## 2026-08-12 (codex) — coarse graduation enforcement

- Added the mechanically enforceable part of §3b to `pack-check`: a pack marked
  `reviewed` or `published` now fails unless both `provenance.sources` and
  `provenance.reviewers` are non-empty. Failures identify the missing field by
  JSON Pointer and direct the author to §3b.
- `draft` remains deliberately permissive, so ungrounded work can be made
  explicit and iterated. `schema_example` also remains non-promoted: treating
  it as graduated would make the living schema fixture falsely claim review.
- Tests cover a draft with both arrays empty, a reviewed pack missing its
  reviewer, and a reviewed pack with both arrays populated.
- Deliberately not built: per-assertion grounding enforcement. The shipped
  schema cannot associate evidence with each objective summary, plan-class
  description, spine annotation, feedback claim, or deviation judgment; §3b's
  owner review remains the barrier until Pack A yields that evidence contract.

## 2026-08-12 (claude, verification of the graduation enforcement)

- Tested the enforcement adversarially rather than trusting the unit tests:
  took the real Pack A draft, flipped `reviewStatus` to `reviewed`, ran
  `pack-check`. Result: refused, with `GRADUATION_REQUIRES_REVIEWERS` naming
  the exact JSON path and citing §3b. **The crudest promotion failure is now
  mechanically blocked**, not merely discouraged. 162 tests green.
- Codex's unprompted addition endorsed: `schema_example` stays non-promoted, so
  the living Najdorf fixture cannot claim review it never had — a case neither
  of us specified.
- Standing gap, unchanged and correctly deferred: per-assertion grounding
  (the five-category set) has no encoding yet and stays a process barrier
  enforced by owner review.

## 2026-08-12 (claude) — field lifecycle matrix built (codex's instrument)

- Built `field-consumer-matrix.md` by static code audit (encoded → evaluated →
  persisted → rendered per pack field), distinguishing type declarations from
  actual evaluation: `authoredBoundary`, `deviations`, and `interaction` appear
  ONLY in `types.ts`/`lint.ts`, so the schema accepts and lints them and then
  nothing reads them.
- **Headline: roughly half of what an author writes has no consumer.** Seven
  field groups fully dead (annotations, concepts, planClasses, checkpoint
  interactions, authoredBoundary, deviations, feedbackClaims). Pack A spent
  real effort on five of the seven.
- The useful part is that they cluster into three *kinds* of work:
  (1) **explanation UI needing NO new contracts** — annotations, deviation
  notes, planClasses, concepts are strings with ids, addressable today;
  (2) **runtime semantics needing contracts** — objective types beyond
  reach_checkpoint, interactions, boundary→provenanceMode, deviation classes;
  (3) **claim grounding needing both**.
- Direct consequence for the withdrawn-RFC retry: **do not design
  `provenanceMode` before `authoredBoundary` has any evaluator**, and the
  intent-capture question is a UI question first ("what does the sheet do with
  a recorded choice"), not a vocabulary question. `deviations` are the best
  first render — per-move authored judgment, addressable with no new contract,
  five real ones already written.
- Caveat recorded: static audit proves existence, not correctness. Session 2's
  play-throughs test behaviour.

## 2026-08-12 (codex review #3; verified and recorded by claude)

- **Correction accepted:** "explanation UI needs no new contracts" was wrong —
  it needs no new *authored vocabulary*, but it does need a delivery contract.
  Verified: `GET /packs/:id` returns the full pack document, so annotations,
  deviation notes and claims are all downloadable **before play**. Client-side
  reveal would recreate the "CSS hiding is theater" failure this repo already
  rejected for engine evidence (DC-C6). Matrix corrected.
- **Second defect verified in code:** the checkpoint-action vocabulary is open
  (schema = any non-empty string except `capture_intent`) while
  `CheckpointSheet` recognizes exactly one value (`compare_branches`). Pack A
  authored `"stop"` and `"compare"`; both validate and both do nothing. An open
  vocabulary against a closed consumer makes every authoring typo a
  validator-blessed no-op.
- **Pack A has now found two real product defects**, not merely missing
  features — authored-feedback leakage and the action-vocabulary mismatch.
  Neither was findable without content that exercises authored feedback.
- Both carried into the matrix as the next RFC's two exact inputs: (1) a
  server-side authored-prose projection honouring `feedbackPolicy`; (2) a
  closed, validated action vocabulary that fails `pack-check` on unknown values.

## 2026-08-12 (claude) — delivery RFC accepted after a fifth same-class finding

- The first draft of `authored-feedback-delivery` again asserted infrastructure
  that does not exist: a reveal endpoint, a `scope=` grammar, and a 425 status
  that lives only inside a withdrawn RFC. Fifth instance of this failure class.
- Correction went NARROWER than the reviewer's split suggestion: the leak is
  fully fixable **without any reveal path**, because nothing renders authored
  prose today (the field matrix proves it). So the RFC is now "stop shipping",
  full stop — and serving content back is explicitly blocked on per-scope
  reveal existing first.
- Standing lesson reinforced, now with five data points: when a draft needs a
  capability, check whether it shipped **before** writing the sentence that
  uses it. The withdrawn RFCs are the trap — their contracts read like history.

## 2026-08-12 — pack A, session 2 pass (a): controlled spine play-through (claude)

agent-research 0 · agent-encoding 0 · agent-engine-validation 0 · owner-review 0 · agent-revision 0 · tooling-friction 40
notes: Played the authored line end-to-end against the real server (dev mode,
mock engines) driving the REST API directly. All 40 minutes were friction, none
authoring — see defects below. **The chess worked; the platform seams did not.**

### What worked (first evidence that authored content drives the runtime)

- **Spine checkpoints fire correctly on real authored content.**
  `plan-commitment` fired exactly at Be2 (`atSpineNode: be2`), `break-arrived`
  at ...c5, and `segment.completed` was emitted between them. The orchestrator
  walks an authored spine as designed — previously only proven on the fixture.
- Moves, forking and persistence all behaved; 7 nodes, 1 branch after 6 plies.

### Defects found by playing (new, beyond the matrix)

1. **`policyConfigDigest` is validated inconsistently across endpoints.**
   `POST /runs` accepted the arbitrary string `"session2-theory-strict"`;
   `POST /select-move` rejected the identical value with
   `"must be an RFC-8785 SHA-256 digest"`. Same field, same run, two contracts —
   so a client can create a run it can then never get an opponent move for.
   **This is a real bug, not a usage error.**
2. **`preserve_plan_window` confirmed inert by observation.** Zero
   `objective.state_changed` events across the whole play-through; the pack's
   stated objective produced nothing. The matrix predicted it statically; this
   is the behavioural confirmation.
3. **`GET /runs/:id/graph` returns `events: []` while nodes/branches populate.**
   7 nodes and 1 branch came back, but no events at all — so checkpoint history
   is invisible to a graph consumer even though `checkpoint.reached` was
   emitted on the mutation responses. Either withholding is stripping events
   from this surface or the projection drops them; either way a client that
   reloads mid-run cannot reconstruct which checkpoints it has passed.
4. **No server-side "start a run from this pack" convenience.** The client must
   assemble `id`, `packDigest`, and a full `policyConfig` (incl. `locus`) — fine
   for the app, brutal for playtesting and for any future authoring tool. This
   was the bulk of the 40 minutes.

### Not yet measured

Pass (b) human_common off-spine, pass (c) real Stockfish validation (mock
executor was active — `judge: mock`), pass (d) the dead-field inventory is
already covered by `field-consumer-matrix.md`.

## 2026-08-12 — CORRECTION to session 2 pass (a) defect labels (claude, from codex review)

Append-only: the entry above is left intact. Two of its four findings were
mislabeled. Correcting before any of them reaches an RFC, because a mislabeled
defect propagating into a spec is exactly how the five withdrawn drafts failed.

**Stands as written:**

- **#2 `preserve_plan_window` is inert** — behaviourally confirmed. Correct.
- **#4 REST playtesting friction** — real, but the label overstated it.
  `POST /runs` *does* already start from a registered pack and derive
  `packDigest` and `startFen`. What is missing is a server-derived/default
  `policyConfig` and run id — a convenience gap, not "no pack-based creation".

**Corrected:**

- **#1 is not an inconsistent-validation bug.** `PolicyConfig` carries only
  `seedMode` and `locus`. The `policyConfigDigest` sent to `POST /runs` was
  therefore **silently ignored**, and `/select-move`'s separate required
  cache-key field validated correctly. The real defect is one level up:
  **`POST /runs` silently accepts unknown nested fields**, violating the
  never-silent contract — the same failure shape as the open checkpoint-action
  vocabulary (author writes something, validator blesses it, nothing happens).
  Secondary: a naming smell, since the client supplied `packDigest` under the
  name `policyConfigDigest`.
- **#3 is not a defect at all.** `GET /runs/:id/graph` is **intentionally
  event-free**: its documented shape is nodes, branches, cursor, writer id, and
  nodes retain `checkpointRefs`. Reload is specified to fetch
  `/events?sinceSeq=0` and rebuild via `projectRun`. So an empty `events` array
  implies nothing about checkpoint loss. The correct behavioural test is to
  refresh `/play/run/:id` and verify checkpoint/timeline reconstruction; only a
  failure *there* is a reload defect. Not yet run.

**Net effect on the next RFC inputs:** the "never-silent request validation"
item replaces the digest-consistency item; the graph/events item is withdrawn;
the reload test moves to session 2's pending passes alongside (b) and (c).

## 2026-08-12 — pack B (carlsbad-minority-attack), session 1 (claude)

agent-research 25 · agent-encoding 30 · agent-engine-validation 0 · owner-review 0 · agent-revision 5 · tooling-friction 5
notes: Second pack, first middlegame pack, first pack authored after the
authored-feedback delivery work shipped. `make pack-check` was green on the
second run; the one issue it raised was a **semantic** one, not a schema one
(see below), which is a different and better class of finding than Pack A's
`annotations`-must-be-an-array. Tooling friction stayed at 5 minutes.

Where the 25 research minutes went is worth recording, because it is not what
the cost model assumed: roughly 5 minutes on the design docs and 20 on
**mechanically verifying the chess** with chessops — deriving the start FEN
from a SAN move list, walking every spine path, checking every deviation is
legal from the position after its anchor, and computing attacker/defender
counts for b5, h4 and h7 rather than recalling them. That is a real,
repeatable, automatable cost and it is currently paid by hand in a scratch
script. **First tooling ask from the content side: a `pack-verify`-style
helper that takes SAN and emits FEN + UCI.** Encoding a spine means writing
UCI by hand for moves you thought of in SAN, and that is where errors want to
live.

### The brief was wrong about the structure, and checking cost nothing

The commissioning brief described the Carlsbad as "White c3/d4/e3 vs Black
c6/d5/e6" with "...e5" as Black's break. The Carlsbad reached from the QGD
Exchange has **no c-pawn for either side and no black e-pawn** (White a2/b2/d4/e3,
Black a7/b7/c6/d5), which is precisely why a two-pawn *minority* attacks a
three-pawn majority — the name only makes sense in the real structure, and
"...e5" is not available to a side with no e-pawn. Verified against the board
before writing a word of prose; the correction and the reasoning are recorded
in `provenance.sources` rather than silently applied. Recording it here because
it is the cheapest possible instance of Law 8 working: the check took under a
minute and would have produced a pack that taught a structure that does not
exist.

### New lint caught a class of authoring waste the field matrix predicted

`AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` fired on the `a5-prophylaxis` node:
prose on a spine node that is not on a path to any `atSpineNode` checkpoint can
never be revealed, so it is dead on arrival. This is exactly the "authoring
outran rendering" failure from Pack A, now **mechanically detectable**. Two
consequences for future authors:

1. **Checkpoint placement is not a separate concern from annotation placement.**
   Every authored branch tip needs a downstream checkpoint or its prose is
   invisible. I fixed it by adding a checkpoint at the sideline rather than by
   deleting the prose, which is the right direction — the sideline deserves a
   comparison anchor anyway.
2. The lint only covers `annotations`. Deviation notes have the same reveal
   rule (`docs/explanation-grounds.md`: a spine-node deviation reveals when its
   anchor is in scope) and are **not** checked. I audited all ten by hand; all
   are reachable. A future author will not. **Second tooling ask: extend the
   same reachability check to deviation notes and to intent-capture plan
   classes.**

### contract-gaps (second deliverable)

1. **The objective vocabulary cannot express "carry out the plan you declared".**
   This pack's entire point is that success is *relative to the intent the
   learner captured at the checkpoint*. There is no way to say "reaching b5 is
   success if you chose minority-attack and irrelevant if you chose
   kingside-attack". `successConditions` supports only `reach_checkpoint`, which
   is intent-blind, so I omitted it entirely rather than encode a checkpoint
   that biases one plan. **This is the first concrete case for
   intent-conditional success, and it is stronger evidence than Pack A's
   because the pack is unusable without it.** Pack A's finding was that
   `preserve_plan_window` is inert; this is that the vocabulary is not merely
   inert but structurally unable to express a plan drill's objective.
2. **Deviation classes cannot express "same plan, different move order".**
   11.a3 and 11.Rab1 are the same plan; `accepted_alternative` is the closest
   class and it undersells the relationship. What I wanted was a link from a
   deviation to a `planClass` id — the deviation is *in* a plan class. That
   link would also give the intent-capture checkpoint something to grade
   against, which is gap 1's cheapest partial fix. **Concrete proposal from
   real content: an optional `planClassId` on a deviation.**
3. **`concept_violation` is doing two different jobs.** I used it for 11.e4
   (right idea, wrong time — a timing error) and for 14.Na4 (removes the piece
   that supports your own pawn break — a plan-coherence error). Those are not
   the same mistake and a learner should not get the same label. Noted, not
   solved; the format should not grow a class until more packs confirm the
   split.
4. **`plyHorizon` intuition, second data point.** Set to 8, exactly the depth
   of the deepest authored path. Under "caps, does not grant" this is the
   correct conservative value and it was easy to choose. Confirms Pack A's
   reading; no new gap.
5. **Nothing in the format lets an author say a claim is mechanically checkable.**
   `b5-arithmetic` is derivable from the position — it is attacker/defender
   counting — and I tagged it `derived_feature` alongside `author_principle`
   to say so. But there is no way to record *what* would check it. That is the
   evidence-encoding gap §3b keeps deferring, now with an instance that is
   cheap enough to actually build against.

### Least confident claim in the pack, flagged for the owner

The two `concept_violation` judgments. Both assert that a legal, non-losing
move is a conceptual error, which is the strongest thing this file says and the
least supported. They are listed first among the graduation blockers.

## 2026-08-12 — pack C (rook-4v3-same-side-hold), session 1 (claude)

agent-research 25 · agent-encoding 30 · agent-engine-validation 0 · owner-review 0 · agent-revision 5 · tooling-friction 5
notes: Third pack, first endgame pack, first `mode: "outcome"` pack, first pack
with **no citable source of any kind**. `make pack-check` was green on the first
run — no schema errors, no lint warnings — which is the first time that has
happened and is the clearest signal yet that the validator's marginal value is
falling as the author learns the format. Tooling friction stayed at 5 minutes and
was entirely one thing: chessops is not resolvable from a scratch `.mjs` outside
the workspace, so the deviation-legality check had to be bundled with esbuild
from inside `apps/server` to run at all. Pack B's ask stands and grows: the
scratch chess-verification script is now a per-pack ritual.

Where the 25 research minutes went: about 8 on docs and 17 on the chess, and
**the single most valuable minute killed the first start position.** The obvious
schematic (White Kg1/Ra1 + e4/f2/g2/h2, Black Kg8/Rd8 + f7/g7/h7) makes the
pack's own second plan class lose on the spot: 1.Kf1 Rd2 2.Ra8+ Rd8 3.Rxd8#,
because Black has no luft and the rook leaving d8 is mate in two. The active-rook
scheme would have been a strawman and the drill would have taught a lie. Moving
the h-pawn to h6 fixes it and, better, turns the accident into the pack's actual
teaching point: the back-rank check is the *price* of the active rook, not a
refutation of it. Recorded because it generalises — see contract-gap 2.

### What endgame authoring demanded that opening/middlegame authoring did not

1. **There is no citation floor.** Pack A could cite lichess-org/chess-openings
   (CC0) for names and move order; Pack B could name the Carlsbad. R+4P vs R+3P
   at ten pieces has **no tablebase** (Syzygy stops at seven), no engine pass was
   run, and no game or book was consulted. So the `provenance` block is doing
   more work than the content: five of its six source lines are statements of
   what is *not* known. This is the first pack where the honest provenance is
   longer than the honest evidence, and that is the correct shape, not a defect.
2. **The start position is constructed, not derived — and construction is
   unverified in a way derivation is not.** Packs A and B derive their start FEN
   by replaying a legal SAN move list, so the position is reachable and sane by
   construction. An endgame root is placed by hand, and a hand-placed position can
   contain an accident that no move list would ever produce (the mate above).
   Nothing in the format or in `pack-check` catches this: the FEN is legal, the
   spine is legal, and the pack is a lie. **Ask: a position-sanity pass for
   constructed roots — at minimum "is either side mated/losing material inside 2
   plies from the root", which is cheap and would have caught this exactly.**
3. **`objective.type` stops being framing and becomes a truth claim.** In Pack A,
   `preserve_plan_window` was decorative. Here the choice between `win` and `hold`
   *is* an assertion about the position: this material is drawn with correct play,
   so a `convert`/`win` framing would have encoded a falsehood in a required
   enum field. Chose `hold` for that reason and said so. First place the objective
   vocabulary carries chess truth — and the runtime still evaluates none of it.
4. **The Outcome Drill's grading contract is unsayable.** `design/01` says outcome
   drills grade on **result preservation, not exact moves**. `mode: "outcome"` is
   accepted by the schema and means nothing to any consumer, and there is no field
   anywhere that says "grade the WDL, not the move". I ended up asserting it in a
   `feedbackClaim` (`result-not-moves`) — i.e. telling the *learner* the grading
   contract in prose because I cannot tell the *runtime*. That is the same failure
   shape as Pack A's floating claims, one level worse.
5. **The spine is the wrong shape for endgame technique.** Opening and middlegame
   content really is a tree of concrete moves. Endgame content is *schemes*:
   "rook on the second, king to e6, decline every rook trade, invite every pawn
   trade" is a set of target configurations reachable by many move orders. I had
   to encode four schemes as three concrete lines, which over-specifies badly —
   a defender who reaches the same configuration by a different route is off-spine
   and looks wrong. **Ask: `planClass` needs an optional target configuration
   (the `fenPredicate` vocabulary already exists and would nearly do it), and
   plan-class attainment should be gradeable against that, not against a line.**
   `planClass` currently has `id`, `label`, `description` and nothing else.
6. **`evidenceTypes` cannot express "established theory, uncited".** The enum
   offers `tablebase_exact`, `engine_validated`, `corpus_observed`,
   `author_principle`, `hypothesis`. The pack's load-bearing claim — this material
   is a theoretical draw — is none of those: it is textbook consensus that the
   author cannot cite and no tool here can check. I encoded it as
   `author_principle` + `hypothesis`, which is **a lie by rounding**: it is not
   the author's principle and it is not a hypothesis. **Ask: an evidence value for
   uncited established theory, and/or a per-claim `groundTruthAvailable: false`
   so a pack can say "no exact answer exists at this material count" in a field
   rather than in prose.** Law 8 makes this the highest-value gap in the pack.
7. **Endgame errors are drifts, not moves.** `deviations` anchor one UCI move at
   one node. The characteristic way this ending is lost is a rook going passive
   over three or four moves, or a king that never leaves the back rank — neither
   of which is any single illegal-or-inferior move. "You have not moved your king
   in four moves and White's has crossed the fifth rank" is unsayable. This is the
   withdrawn RFC's luxury/tempo accounting again, wearing endgame clothes: Pack A
   needed it for a race, Pack C needs it for slow drift, so the requirement is now
   attested from two independent directions.
8. **The opponent-policy gap is a contract gap, not a config gap.** Chose
   `human_common` at 1900 deliberately: the entire subject of the pack is the gap
   between theoretical draw and practical loss, so an opponent that *plays the
   standard winning attempts and occasionally misses one* is not a compromise
   here — it is the teaching instrument. `strong_engine` would replace practical
   resistance with a proof exercise, and the schema's `perfect_tablebase` is
   physically unavailable at ten pieces regardless of server support. But note
   what that means: `design/01`'s Outcome Drill contract says "vs exact/human
   resistance", and the **exact half is not merely unimplemented, it is
   unimplementable for every endgame family above seven pieces**. The contract
   should say so.
9. **First non-`atSpineNode` trigger in a draft.** `still-holding` uses a
   `materialBalance` trigger and is the pack's only executable success condition
   (`reach_checkpoint`, the one condition kind the server supports). Whether the
   runtime actually evaluates `materialBalance` was not verified — it is in the
   frozen trigger vocabulary and `pack-check` accepts it, which by now is known
   to prove nothing. Listed as a graduation blocker.

### Least-confident claims in the file (for the reviewer's attention)

- That the position is a theoretical draw at all. Stated as classical consensus,
  labelled ungrounded, and the whole pack's framing rests on it.
- The `w-ra8`/`w-ra7` line, which asserts that 1...Rd2 concedes a pawn move to
  the back-rank check. It is verified legal and it drives the entire
  king-first-versus-activity comparison; nothing has verified that it is *good*.
- That the pawn ending after a rook trade is harder to hold than the rook ending.
  Deliberately worded as a practical judgment ("a defence you can learn once
  versus a race you must calculate exactly") because it cannot honestly be stated
  as an evaluation — no tablebase, no engine pass.

### Verification actually performed

`make pack-check` green (schema + chessops spine-legality lint, first run). All
12 deviations independently checked legal from the position after their anchor
node with chessops, and all 12 confirmed to be *Black* moves — the lint does not
check deviations at all, which is worth knowing: an author can ship a deviation
that is illegal, or that belongs to the wrong side, and the validator is silent.
**Ask: extend the lint to deviations; it already has the position.** No engine
has seen any position in this pack.

## 2026-08-12 — CORRECTION: the 4v3 rook ending is eleven pieces, not ten (claude)

Append-only; the entries above stand as written. Two of them say the 4v3
same-side rook ending is "ten pieces". It is **eleven** — two kings, two rooks,
four white pawns, three black pawns.

The conclusion those entries draw is unaffected: eleven is past Syzygy's
seven-piece limit, so there is no tablebase ground truth for this material and
none of Pack C's positions can be machine-verified. Only the count was wrong.

Provenance of the error, recorded because it propagated: **I introduced it**, in
the authoring brief for Pack C and again in conversation. It reached Pack C's
`provenance.sources`, an RFC acceptance fixture, and both logs before a reviewer
counted the pieces. Pack C and the RFC are corrected; the logs carry this note
instead, being append-only.

The lesson is narrow and worth keeping: a number that travels inside a sentence
whose *conclusion* is correct will not be checked by anyone who agrees with the
conclusion. Both agents who consumed the brief reasoned correctly from it and
neither recounted.
## 2026-08-12 — authenticated explorer first-wave order (B6c)

- Query: Lichess explorer, rating buckets 1400/1600/1800, blitz+rapid,
  2024-01 through 2026-07. Counts are position totals derived from
  white + draws + black, not response-side `total` fields.
- Returned order: Sicilian Defense (104686766); Caro-Kann Advance (9346096);
  French Advance (9215262); King's Indian (5353956); Dutch (4845395);
  London (3851145).
- This is the first executable replacement for design/04 §2c's taste-based first-wave
  order. It ranks the exact line roots supplied to the instrument; it does not grade pack
  quality or instructional suitability.

## 2026-08-14 — endgame shape-library entries: seven families in ten entries (claude)

Landed ten shape entries under `content/shapes/`, covering design/04 §4's endgame
families beyond the existing `rook-4v3-same-side`: `lucena`, `philidor`, `vancura`
(ids match the runtime technique index in `packages/runtime/src/endgame.ts`, so
`endgameReading`'s `shapeEntryId` references now resolve to authored bodies);
`pawn-opposition-key-squares`; `pawn-breakthrough-outside-passer`;
`bishop-good-bad`; `opposite-coloured-bishops` (also carries the practical-conversion
"up-a-pawn OCB fortress" row — the censuses are structurally identical);
`knight-vs-bishop`; `queen-vs-pawn-on-seventh`; `up-an-exchange`. All ten pass
`make shape-check`. Additionally, a disposable probe harness (scratchpad, not
committed) ran each trigger against a canonical family FEN and a near-miss:
20/20 fire/hold checks pass through the one runtime evaluator.

**Cost split.** Roughly 30% trigger engineering (finding honest encodings inside the
twelve-predicate vocabulary: the `piece_reach_count atLeast 0` existence idiom from the
4v3 entry, `passed_pawn` any-of fans over rank/file windows, `pieceOnSquare` fans for
"pawn on the seventh"), 45% plan/watch/mistake prose (techniques described structurally,
never moves), 25% provenance and tablebase-honesty wording plus verification runs.

**Signatures.** Seven plans got real structural success signatures: Lucena's bridge
(promoted queen exists), Philidor's attacker plan and Vancura's attacker plan (passed
pawn reaches the seventh), breakthrough (far-advanced passer), OCB conversion (passers
on both wings), knight-vs-bishop (rook-file passer), queen-vs-pawn zigzag (no pawn one
step from promotion and no new queen — with an explicit stalemate-blindness note). All
defender/holding plans are `null` + note: holding and fortresses are outcomes, not
censuses.

**Tablebase honesty calls.** R+P-vs-R (5-piece minimal census) and Q-vs-P (4-piece)
entries state a tablebase CAN verify their families' result claims and that none was
consulted — the only check run was shape-check plus trigger probes. Pawn entries state
minimal cases are tablebase-range but the triggered family often exceeds seven pieces.
All other entries declare typical positions above seven pieces, authored-and-ungrounded.

**Format gaps (sharpest first).**
1. **No bishop square-colour predicate**: `bishop-good-bad` and
   `opposite-coloured-bishops` cannot be distinguished by census — different universes,
   co-firing triggers. Each entry's watch names the other. (OCB is narrowed by
   requiring a White passer, but that encodes "conversion attempt", not colour.)
2. **Kings are invisible** (outside per-square `pieceOnSquare`, which would overfit):
   opposition, key squares, Lucena/Philidor king placement — the defining content of
   pawn and rook technique — is inexpressible; every such trigger names the family and
   records the gap.
3. **No pawn-count or pawn-existence predicate**: "up a pawn", "only one pawn",
   "majority without a passer yet" (pre-breakthrough) are all inexpressible.
4. Verbose fans: rank/file windows of `passed_pawn` need up to 48 explicit leaves
   (OCB trigger); a range-over-squares leaf would collapse them.
5. `outpost` takes a specific square, so "anchored knight" family prose cannot use it
   without binding to one position (noted in the knight-vs-bishop entry).

Sibling agent is authoring middlegame entries in the same directory; no middlegame
family was touched here.

## 2026-08-14 — shape library: eight middlegame structure-family entries (claude)

agent-research 20 · agent-encoding 45 · agent-engine-validation 0 · owner-review 0 · agent-revision 10 · tooling-friction 10
notes: Authored the eight remaining middlegame families from design/04 §3 as
shape entries in `content/shapes/`: `hanging-pawns`, `maroczy-bind`,
`closed-centre-chain`, `open-centre`, `fianchetto-g7`, `doubled-c-pawns`,
`opposite-castling-race`, `queenless-middlegame`. All eight pass
`make shape-check`. Beyond the validator, every trigger was fired against a
hand-built representative FEN from its feeding opening through the runtime
evaluator (`matchesStructuralExpression`), plus six signature spot-checks
(four positive, two deliberate negatives). That probing caught two of my own
bad probe FENs, not entry bugs — and confirmed one honest surprise: the strict
outpost detector refuses a Maroczy knight on d5 while Black retains an e-pawn
able to reach e6, which matches the chess, and the d5-clamp success note now
says so. All prose is original and declared UNGROUNDED in provenance
(no Wikibooks adaptation; clean posture (a) from theory-sourcing).
Plan census: 35 plans total, 14 with real structural signatures, 21 null with
stated reasons.

What the vocabulary could not express (input to the next predicate wave):

1. **No mirror/orientation abstraction.** Five families are colour- or
   wing-symmetric but every square and file must be enumerated literally, and
   plan `side` labels flip with the orientation, so each entry was narrowed to
   one canonical orientation with the mirror recorded as unauthored:
   hanging-pawns (Black c5-d5 pair only), closed-centre-chain (French d4-e5
   orientation only), doubled-c-pawns (Nimzo White pair only; Ruy Exchange and
   Sveshnikov cases unauthored), opposite-castling-race (White long vs Black
   short only), fianchetto-g7 (Black kingside only; g2/b2/b7 corners
   unauthored). A `mirror`/`colorFlip` combinator or per-orientation entry
   generation would halve this cost.
2. **No file quantification.** "Some Black pawn is isolated or doubled" took a
   16-leaf `any` in queenless-middlegame; "an isolated pawn exists" is not
   otherwise sayable.
3. **No "colour X has no pawn on file f" primitive.** Only expressible as
   `any(half_open_file, open_file)`; used in three entries and easy to get
   wrong (half-open requires the *opponent's* pawn present).
4. **No castling rights/history.** Opposite-side castling uses king-square
   `pieceOnSquare` as a proxy; kings that walked there fire, kings on f1/a1
   don't.
5. **No material census, pawn counts, or symmetry test.** The
   "symmetrical/queenless" family can prove queenless-with-both-armies but not
   symmetry, and cannot mark the middlegame/endgame boundary.
6. **No pawn-tension or mobility notion.** "Open centre" had to mean a fully
   pawnless central file; practically-open centres with one mobile pawn each
   don't fire.
7. **No structure memory.** The fianchetto trigger dies the moment the bishop
   leaves g7, yet the family's central question (life after the bishop trade)
   is exactly that persisting structure; same for "traded vs merely moved" in
   two null success notes.

Two positives worth keeping: `line_blockers` expresses long-diagonal clearance
exactly (fianchetto's best signature), and the anticipated Maroczy trigger gap
did not exist — `named_structure maroczy-bind` already shipped in the runtime
catalogue.

Flag for the next code slice (not touched here, content-only pass):
`apps/server/src/shape-registry.test.ts` pins the official catalogue to the
original four ids, so the registry test fails until that list is extended with
the new entries (this sibling wave adds middlegame and endgame files).

## 2026-08-14 — content wave 2: six opening packs in explorer-priority order (claude)

Authored the first opening-pack batch per the B6c priority order (Sicilian
104,686,766 · Caro-Kann Advance 9,346,096 · French Advance 9,215,262), one
chosen-side and one anti pack per family, all in `content/drafts/`:

- `najdorf-english-attack-black` (chosen, Black) + `anti-sicilian-najdorf-english-attack`
  (anti, White — design/04 §2c's "facing Najdorf as White"). Shape handoff:
  `opposite-castling-race`.
- `caro-kann-advance-black` (chosen, Black — the §2c mirror of wave-1's
  anti-caro-advance-c5-race) + `anti-caro-advance-early-c5` (anti, White — the
  3...c5 Botvinnik-Carls family, 30.0% share in the B12 row; grows pack A's
  two-ply stub into its own pack per the one-claim rule). Shape handoff:
  `closed-centre-chain` for the Black pack; the early-c5 pack deliberately has
  NO shapes reference — after dxc5 the chain is gone and no library entry names
  the resulting structure (recorded in its blockers).
- `french-advance-black` (chosen, Black) + `anti-french-advance-white` (anti,
  White). Shape handoff: `closed-centre-chain`, both sides' plans referenced
  via `shapePlan`.

Cost split (minutes; engine-validation 0 and owner-review 0 everywhere):

- batch setup (docs, priority data, emitter runs, TSV volumes, verify harness):
  agent-research 25 · tooling-friction 15
- anti-sicilian-najdorf-english-attack: agent-research 10 · agent-encoding 25 · agent-revision 0 · tooling-friction 2
- najdorf-english-attack-black: agent-research 5 · agent-encoding 15 · agent-revision 0 · tooling-friction 0
- caro-kann-advance-black: agent-research 5 · agent-encoding 15 · agent-revision 0 · tooling-friction 0
- anti-caro-advance-early-c5: agent-research 10 · agent-encoding 20 · agent-revision 2 · tooling-friction 3
- anti-french-advance-white: agent-research 8 · agent-encoding 20 · agent-revision 0 · tooling-friction 0
- french-advance-black: agent-research 4 · agent-encoding 12 · agent-revision 0 · tooling-friction 0

Emitted skeletons used for five of six (B90 English Attack row ×2 sides, B12
Advance Short Variation, C02 Main Line, C02 Advance Variation);
`anti-caro-advance-early-c5` is hand-built because the Botvinnik-Carls TSV row
ends at 3...c5 itself — the pipeline covers named lines, not continuations.
Validator: 5/6 green on first `make pack-check` run; the sixth failed only on
`"shapePlan": null` (must be absent, not null) and was green after removal. All
38 deviations across the batch machine-checked with a scratch chessops harness
for legality, side-to-move and SAN agreement — `pack-check` still does not
check deviations (pack C's standing ask).

Format frictions and findings, sharpest first:

1. **Candidate directory identity is per TSV row, not per (row, side, split).**
   Both mirrored packs of a family want skeletons from the same row; the second
   emit overwrites `job.json`, so the committed candidate now records only the
   most recent side (B90 dir: black; C02 main-line dir: white). Ask: learner
   side in the candidate id, or a job list.
2. **The openings emitter's fixture covers only volume d.** B and C rows needed
   the pinned commit's `b.tsv`/`c.tsv` fetched to the scratchpad and passed via
   `--tsv`; the recorded source URL and sha256 remain honest because they are
   derived from the bytes actually read. Ask: ship all five volume fixtures or
   fetch under the source lock.
3. **First-move alternatives cannot be deviations** in a `follow_theory` pack —
   deviations need spine-node anchors and no node precedes ply 1 — so White's
   4.Nf3/4.c3 declines in the early-c5 pack are sibling root branches, exactly
   like pack A's c5-immediate. Second attestation; the format should either
   bless the idiom or grow a start-anchor.
4. **`planClass.shapePlan` rejects `null`** while shape entries' own success
   signatures embrace it; asymmetric and mildly surprising, but the validator
   error carried an exact pointer and the fix took two minutes.
5. **Shape references cannot say "hands off to" versus "present".** The
   opposite-castling-race reference in both Najdorf packs cannot fire during
   the authored spine (nobody has castled yet); it is a trajectory declaration
   riding on the only reference mechanism that exists. closed-centre-chain, by
   contrast, genuinely fires mid-spine once ...e6 stands. Both uses are honest;
   the format cannot distinguish them.
6. **The priority artifact is the first mechanical ground for frequency prose:**
   each pack carries one `corpus_observed` feedbackClaim citing exact counts and
   shares from `content/candidates/priority/priority.json` (e.g. ...c5 83.5% of
   9,215,262 in the C02 row). Below-root shares remain ungroundable without
   further explorer pulls, and every pack's blockers say so.
7. The scratch chessops ritual (pack B's ask, third occurrence) again required
   esbuild bundling because bare specifiers resolve from the script's location;
   the harness now also re-derives start FENs and checks boundary/checkpoint
   references, and it caught zero chess errors in the final drafts because the
   lines were derived with it rather than recalled.

Not done, deliberately: no engine pass on any position (blockers recorded per
pack), no explorer pulls below the family roots, no touch of `rfc/` (four
drafts running concurrently), no commits.

## 2026-08-14 — CORRECTION to the opening-wave entry above (claude)

Append-only; the entry stands. Its claim that "`pack-check` still ignores
deviations" is **false** — probed by injecting `a1a8` into a copy of the
Najdorf pack: `DEVIATION_WRONG_SIDE` fails the gate. D7's lint (line-drill RFC)
is live in `pack-check`. The author's hand-verification was redundant
belt-and-braces, not a workaround for a missing check. The other frictions in
the entry are unverified-but-plausible and stand as filed.

## 2026-08-14 — Content wave 3: the first real trajectory packs (claude)

**Landed.** Two guided trajectory packs — the first real content for the mode
that tests the product's central thesis — plus the shape entry the opening
wave's blocker commissioned:

- `content/drafts/trajectory-qgd-exchange-minority.json` (the flagship, White,
  60-ply mainline + 2 branches + 4 deviations): QGD Exchange → Carlsbad →
  minority-attack rook ending. Legs: `follow_theory` until the Carlsbad
  named-structure predicate fires (ply 12, ...c6); `execute_break` graded on
  Pack B's exact structural target (backward c6 + half-open white c, fires
  ply 40, ...bxc6); `win` (authored grading, checkpoint resolution) in the
  rook ending, entered when a rooks-only census predicate fires (ply 54,
  ...Rxa5). Both leg entries are fenPredicate structural facts, not plies:
  reach them by another order and the legs still open.
- `content/drafts/trajectory-caro-advance-chain-bishops.json` (Black, 52-ply
  mainline + 2 branches + 5 deviations): Caro Advance → closed-centre chain →
  same-colour bishop ending. Entries: the four-pawn chain test (ply 8, ...e6)
  and a single-bishop-each/no-majors-no-knights census (ply 45, Bxc1). The
  middlegame leg is graded by the `closed-centre-chain` entry's own
  black-strike-the-base success signature (fires ply 17, 9.cxd4). Endgame
  honesty per the wave brief: the chain forces NO particular ending; the leg
  entry is authored on the census alone and provenance says so. What IS
  mechanical: at leg entry five of White's seven pawns stand on White's
  bishop's colour against two of Black's — the census is fact, the judgment
  is authored.
- `content/shapes/advance-caro-dxc5-residue.json` — the post-dxc5 residue the
  early-c5 pack's blocker asked for. Honest name, predicates only: doubled
  white c-pawns (c2+c5) beside the e5 space pawn against d5; c-file
  HALF-OPEN FOR BLACK (not open — the wave-1 guess was wrong; White's own
  doubled pawns stand on it), d-file half-open for White, and d5 NOT isolated
  while Black's e-pawn stands. Trigger verified: first fires on 4.dxc5,
  survives both plan branches, stops the move the pawn is regained, false at
  root/Carlsbad/Caro-chain. Wired into `anti-caro-advance-early-c5` (v0.2.0):
  `shapes` + both plan classes now reference its white plans; the
  no-entry-exists blocker rewritten as resolved-with-record.

**Validators.** All five files green: `make pack-check` × 3 (both
trajectories + rewired early-c5), `make shape-check` × 2 (new entry, plus
carlsbad as a control). Both mainlines, all branches and all 9 deviations
machine-verified (python-chess 1.11.2 scratch harness — cheaper than the
esbuild/chessops ritual, and pack-check's chessops lint is the authoritative
second check anyway; recommend blessing python-chess for scratch work).
Checkpoint firing plies computed by reimplementing the runtime predicate
semantics (half-open/backward/census) against every mainline position.

**Cost split.** One long session. ~75% went to authoring the two causal
spines — specifically the liquidations: finding trade sequences where every
capture has a legal recapture AND the trades run down the files the
middlegame plan opened (the QGD's b-file/a6-b5-a5 grind; the Caro's c-file
corridor). This is the real authoring cost of guided trajectories and it is
an order of magnitude above per-phase packs. ~10% validator/format
archaeology (pack-validation.ts + pack-orchestrator.ts are the actual spec),
~10% shape entry + provenance prose, ~5% wiring/log.

**Format frictions, sharpest first — first real `legs` content:**

1. **An outcome leg with no `successConditions` silently grades nothing.**
   `objectiveRules` returns `[]` for any objective without a conditions
   array BEFORE compiling the automatic win/draw/loss rules, and
   `OBJECTIVE_GRADES_NOTHING` only covers plan objectives. A `hold` leg with
   grading but no conditions passes `pack-check` and is inert at runtime.
   Both endgame legs here carry a material_balance→degraded condition to
   force compilation. Ask: extend the refusal (or compile outcome rules
   unconditionally).
2. **`legs` carry only `{id, entryCheckpointId, objective}`.** Per-leg
   `shapes`, plan classes, opponent policy and difficulty are inexpressible.
   The brief said "shapes references per leg"; the format cannot say it —
   both packs park all shapes at top level and assign them to legs in
   provenance prose. Per-leg opponentPolicy is the one that bites next:
   theory_strict opening + human_common ending is a natural trajectory want.
3. **No piece-census vocabulary in the pack schema.** "Rooks only" /
   "one bishop each" is spelled as six `piece_reach_count scope:any
   atLeast:0` existence hacks (idiom borrowed from the endgame shape
   entries). The shape schema grew `pawn_count`/`bishop_on_shade` this very
   session (v0.2); the pack schema was mid-edit under Codex concurrently. I
   stayed on the documented 12-kind vocabulary so these packs validate under
   both.
4. **Concurrency hazard, resolved:** for part of the session BOTH
   `schemas/*.json` contained literal `+` diff-marker artifacts from the
   in-flight implementation work, making `pack-check`/`shape-check` fail on
   ALL files including committed ones (`FILE_READ_ERROR ... position 1672`).
   Validated against a scratchpad-patched schema copy until the repo files
   were fixed mid-session, then re-ran the real targets. Content-era work
   needs schema edits to land atomically.
5. **Wave-2 friction #5 recurs and sharpens:** `rook-4v3-same-side`'s
   trigger is the generic rooks-only census, so the flagship's both-wings
   rook-and-five ending fires an entry named "4v3 same side". Reference kept
   (the family teaching genuinely transfers) with a census-honesty source
   line; if a literal 4v3 trigger ever becomes expressible the reference
   must be reviewed. The "present vs hands-off-to" reference distinction
   still has no format encoding.
6. **What worked exactly as designed:** leg N's success condition may
   reference leg N+1's entry checkpoint ("reach the next boundary") — the
   validator's PRECEDES_ENTRY rule permits forward references and refuses
   backward ones; structural entry checkpoints compose with
   CHECKPOINT_TRUE_AT_ROOT to guarantee entries are earned, not given; and
   the trigger/census/signature reuse between shape entries and leg
   objectives means the middlegame legs are graded by the SAME expressions
   the shape library ships. The `legs` contract held real content without a
   single schema fight.

**Not done, deliberately:** no engine pass on any position (per-pack blockers
say so — the authored `win`/`hold` assessments and both liquidations are the
files' strongest ungrounded claims); no explorer pulls below family roots (no
D35 priority row exists, so the flagship's opening popularity is uncited); no
touch of `rfc/`, `design/`, `apps/`, `packages/`; no commits.

## 2026-08-14 — Content wave 5a: the on-ramp lane, first real guard content (claude)

**Landed.** The 1000–1400 lane's first content, unblocked by `immediate_guard`
shipping (pack schema 0.14/0.15): two machine-emitted candidate batches (24
candidates) and four hand-authored on-ramp packs, all with the lane's three
knobs turned — 2–8-ply spines, pack-declared guard, principle/threat-shaped
objectives, difficulty 1000–1400.

**Emitted (position-seeds, rating band 1000-1400, plies 6, count 12 each,
`--engine-eval` at the B6b/depth-22 authoring profile):**

- Batch 1, themes `hangingPiece,fork`: onramp-000lc, -001wr, -0050w, -00aas,
  -00bts, -00dnp, -00evs, -00jph, -00nej, -00o8m, -00pgi, -00puc.
- Batch 2, themes `pin,skewer,trappedPiece,discoveredAttack`: onramp-001xl,
  -003ep, -004mt, -007tv, -009fp, -00ab1, -00adi, -00aho, -00cy1, -00icz,
  -00jcd, -00kzf.
- All 24 pass `sourcing-check` strict. Each sidecar carries puzzle_provenance,
  position_legality, and a depth-22 engine_eval record. The emitter now emits
  `feedbackPolicy: "immediate_guard"` natively (the D8 substitution blocker is
  gone from the emitted blocker list).
- The brief's suggested second batch (back-rank/mate-threat recognition) is
  IMPOSSIBLE from this pipeline by design: the emitter rejects `mate`/`mateIn*`
  themes and terminal aftermaths, and `backRankMate` rows end in mate, so both
  filters exclude them. Substituted loose-piece geometry themes. See frictions.

**Hand-authored (all four: `immediate_guard` + explicit `guard.evalSwingCp`,
`content/drafts/`, validator-clean):**

- `opening-principles-white.json` — principles-not-theory as White. Italian
  scheme as VEHICLE; the success checkpoint is structural, not a line: king g1
  + rook f1 via fenPredicate, reached by any principled order. 7-ply spine, 14
  deviations (early queen, rim knight, wing pawns, two Qxg5 counting demos).
  Guard 250cp: fire on pieces, stay silent on tempo — at this band the habit
  is "don't lose pieces" and a tighter guard buries that signal in noise.
- `opening-principles-black.json` — the colour mirror. Structural success:
  b8/g8/f8 empty + king still e8 ("developed, ready to castle"). Damiano and
  Blackburne-Shilling as classified deviations with machine-replayed
  refutations. Guard 250cp, same rationale.
- `opponent-intent-early-queen.json` — the owner's two questions ("what does
  their move want; what is the moved piece no longer doing") as intent_capture
  checkpoints on all three opponent spine nodes (Qh5/Bc4/Qf3 vs the Scholar's
  pattern). Three deviation branches end in machine-verified Qxf7# — including
  4...Nd4??, the threats-outrank-attacks teaching case. Guard 150cp: here every
  materially costly move IS a misread threat, and the consequence should land
  in the same breath; nothing quieter than a misread can trip it.
- `conversion-up-a-piece.json` — outcome/win, up a clean knight: accept the
  rook trade, march the king, raid, promote. Authored root assessment
  (15 units, no Syzygy possible), resolveAt terminal, material_balance→degraded
  fires exactly when the piece is given back. Three Nd5?? give-back demos
  (exd5/Kxd5 machine-verified). Guard 200cp ≈ two-thirds of the knight: the
  guard is the material guard-rail, a won position played slowly is not an
  error.

**Validators.** `make pack-check` × 4 green. `sourcing-check` × 24 green
(strict). 19 claimed refutation/mate lines machine-replayed with chessops
(scratch `refute-check.mjs`), including three checkmate assertions verified as
mate, not just legal. The harness caught one real authoring error before it
shipped: the conversion pack's 1.Kf1 was drafted as a rook-losing
tactical_error and the replay refuted it — Nc3 recaptures on d1. Reclassified
concept_violation with the true consequence (knight dragged to d1); the pack's
provenance records the correction. Validation-by-use, working as designed.

**Cost split (agent clocks, minutes, approximate):**
research 35 · encoding 95 · engine-validation 25 · review 0 · revision 10 · tooling-friction 30
Machine time not counted above: 304MB dump download ~2m; two emitter passes
incl. 24 depth-22 evals ~6m background.
notes: encoding dominated by deviation notes and per-pack provenance honesty,
not by format fights — the schema absorbed all four packs without a single
validation battle. The structural-success-checkpoint pattern (castle/development
as FEN arithmetic) is the cheapest principle-shaped objective encoding found so
far and should be the lane's default.

**contract-gaps / frictions, sharpest first:**

1. **The guard's pack knob is one scalar.** `guard.evalSwingCp` is the entire
   authored surface. Could not express: (a) per-branch/per-deviation
   thresholds — the principles packs want piece-only 250cp EXCEPT on the
   Damiano branch, where the ~1.5-pawn swing IS the lesson and 250 may sleep
   through it; (b) "always fire on a missed forced mate regardless of cp" —
   the intent pack's three Qxf7# branches rely on the engine tier noticing a
   mate score; (c) any ply/phase window (guard wanted loud inside the 7-ply
   authored horizon, quieter beyond); (d) separate tuning of the deterministic
   rules tiers vs the recorded-engine tier (only global `null` disables the
   latter). Each pack's chosen number is therefore a compromise averaged over
   its branches, and the per-pack rationale lives in a feedbackClaim, which the
   runtime does not read.
2. **The emitter cannot tune the guard it declares.** Emitted candidates get
   `immediate_guard` with no `guard` block (default 200cp); there is no
   `--guard-cp` argument, so a batch cannot carry band-appropriate tuning even
   though the batch KNOWS its rating band. Hand-tuning 24 sidecar-checked
   files individually would invalidate the emission-digest idempotence.
3. **Node's zstd cannot read the real dump.** `createZstdDecompress` (Node
   v26.7) dies mid-stream with `ZSTD_error_prefix_unknown` on the current
   304MB puzzle dump (etag "6a6ef08b-12248997") — both the documented live
   streaming path and `--csv` on the .zst are broken against the real file;
   CLI `zstd -t` validates the same bytes. Workaround used: CLI-decompress,
   then `--csv` on the 6.1M-row plain file. Suspect multi-frame/window-size
   handling in node:zlib. Until fixed, the "stream and discard" design is
   aspirational and reproducing an emission requires a local CLI decompress.
4. **Back-rank/mate-threat recognition needs a different re-cut.** design/04
   §6 lists it for the lane; position-seeds structurally cannot produce it
   (mate filters + terminal aftermath, correctly, since play-the-consequence
   needs a non-terminal consequence). The natural encoding is the DEFENDER's
   chair one move BEFORE the threat lands — a pre-tactic re-cut the pipeline
   has no mode for. BACKLOG-worthy pipeline variant.
5. **intent_capture still has no validated-answer slot** (wave-3's gap,
   sharpened by first real intent content): the intent pack KNOWS by attack
   arithmetic which plan class each opponent move serves, the format's
   `direct_attack_count` could ground it mechanically, but no interaction
   field consumes it — so the answer lives in annotations, the interaction
   cannot grade, and consequently the guard cannot fire on a misread intent,
   only on its eventual material cost.
6. **theory_strict vs the guard's consequence promise.** The three line-mode
   packs pair the guard with theory_strict, whose opponent stops at the
   authored boundary; the guard's "opponent starts the consequence before the
   rewind offer" is only as good as the opponent's willingness to punish
   off-spine play. Whether deviation branches get real consequence play under
   theory_strict is a runtime behaviour question this author could not settle
   from docs; if not, on-ramp line packs may want human_common as their
   default resistance despite the spine.

**Not done, deliberately:** no engine pass on any hand-authored position (each
pack's blockers say exactly what a fixed-depth pass would settle); no
promotion of any candidate; no touch of `rfc/`, `design/`, `apps/`,
`packages/`, `schemas/`; no commits; stayed off sibling OPENING and ENDGAME
territory (their new candidate dirs appeared mid-session and were not touched).

## 2026-08-14 — pack wave 5b (endgame beyond rook-4v3), session 1
agent-research 40 · agent-encoding 70 · agent-engine-validation 45 · review 0 · agent-revision 15 · agent-tooling-friction 15
notes: **Landed six endgame packs in `content/drafts/`, all `make pack-check`
green, all six with real Syzygy grounding** — the first packs in the repo whose
roots, spines, and deviation classes carry machine-verified categories:

- `lucena-bridge-convert.json` (win, 5 pieces) — bridge mainline, 13 plies;
  root and every spine node queried win; Rc2?? queried loss, Ra1?/Rd7+?/Rd8?/
  Kc5? queried draws (the checking-distance refutation of walk-to-the-rook is
  now a tablebase fact in a deviation note).
- `philidor-third-rank-hold.json` (hold, 5 pieces) — fence → drop-behind, 13
  plies; root draw; the passive Rh8?? is a queried LOSS — "passivity loses" is
  machine truth here, not folklore. Structural resolveAt: pawn-on-e6 + rook on
  rank 1 (the rear-check machine), a position fact, not a ply number.
- `pawn-opposition-convert.json` (win, 3 pieces) — **first use of the wave-2
  `king_opposition` predicate in an objective**: taking direct/distant
  opposition transitions active→preserved, and an opposition-taken structural
  checkpoint fires the same fact for comparison. Root's one-move margin
  verified: e3/Kd4/Kf4 win, all three retreats draw.
- `pawn-breakthrough-convert.json` (win, 7 pieces) — 3v2 wing breakthrough
  chosen over the famous 3v3 PRECISELY to stay inside Syzygy range. Order
  claims all queried: c6/b6 win and a6 draws at the root; two moves later a6
  is the unique win and both recaptures draw; slow moves LOSE.
- `opposite-bishops-fortress-hold.json` (hold, 6 pieces) — division-of-labour
  fortress; root draw queried; Bb6 loses at the root and draws one move later
  (both queried) — fortress exactness in one deviation pair. Provenance is
  explicit that unbreakability is tablebase-provable for THIS root and
  censusable for none.
- `queen-vs-pawn-seventh-convert.json` (win, 4 pieces) — zigzag; root split
  queried (only the six checks win; two checks lose the queen outright);
  spine is the DTM-optimal winding; companion query (same position, pawn on
  c2) queried DRAW — the drawn-files claim grounded by one extra query.

**Grounding method:** tablebase.lichess.org /standard, direct queries via a
scratchpad harness (python-chess 1.11.2 for legality + FEN derivation, cached
JSON responses). Every spine move of all six packs verified category-
preserving for the learner; every deviation class that states a category is
the queried one. `assessedBy: syzygy` declared on all six with correct piece
counts and learner-perspective categories — pack-check's
SYZYGY_ASSESSMENT_OUT_OF_RANGE caught a real miscount (OCB root declared 7,
FEN has 6) and was fixed, i.e. the validator earns its keep.
**The harness also caught two authored chess errors before they shipped:** the
opposition pack's drafted mainline contained e5+?, a queried draw (now the
pack's sharpest deviation), and the first OCB root let the defender win a free
pawn (root redesigned). Objectives were written before the engine pass per the
authoring rule; the pass then disciplined the lines, which is the rule working.

**D28 dodge check (brief item): resolved and verified.** `objectiveRules`
(apps/server/src/pack-orchestrator.ts:226-256) compiles the automatic
win/draw/loss rules for outcome objectives UNCONDITIONALLY, before authored
conditions attach; conditions are additive. All six packs carry
resolveAt + structural conditions on top of the automatic floor, and none
depends on a material_balance hack to force compilation.

contract-gaps:
1. **The variants rule fights the format at the file boundary.** design/04 §4
   ("every root exists in convert/hold/save variants where the material
   permits") cannot be satisfied INSIDE a pack: one objective, one start side
   per file. The Q-vs-P save/convert pair the brief asked for became convert
   only + a `retryVariants: opposite_side` prose note pointing at the unbuilt
   hold/save sibling. `retryVariants` carries no machine link — sibling
   variant packs of one root have no format identity connecting them. If the
   variants rule is meant seriously, the format needs a root-identity field
   (or pack-group), else every "pair" is a prose promise.
2. **Learner-moves-first roots cannot capture intent before the first
   decision.** atPly 0 is (correctly) banned and no spine node precedes ply 1,
   so intent_capture lands after the opponent's first reply — one decision too
   late in five of six packs. rook-4v3 dodged this only because its opponent
   moved first. A `beforeFirstMove` interaction trigger is the missing piece.
3. **Real tablebase work has no home in a hand-authored draft.** The queries
   behind these packs exist only as provenance prose; `assessedBy` stays
   admission-unverified without candidate sidecars, and
   `candidate-emit PIPELINE=syzygy` emits a NEW spine-less pack from a FEN
   list — it cannot ground an EXISTING authored draft. A "attach tablebase
   evidence to this pack" path (sidecar emitter keyed on a draft) would
   upgrade all six declarations to ledger-verifiable without re-authoring.
4. **`king_opposition` first-use verdict: works, and one-directional.** The
   predicate's to-move requirement makes own-colour opposition checkpoints
   intrinsically root-safe for learner-to-move packs, and preserved-on-
   opposition is an honest progress grade. The inverse is inexpressible AND
   should stay that way: "opponent took the opposition → degraded" would be
   false chess (regaining it via the pawn tempo/triangulation is the very
   technique) — degraded's one-way law protects against the tempting wrong
   encoding. No gap; noted so nobody "fixes" it.
5. Minor: python-chess is not in the repo toolchain; installed to scratchpad
   again (wave-3 note recommended blessing it — recommendation stands).

Not done, deliberately: no sourcing sidecars/candidates for the six roots
(gap 3 is the ticket); no Stockfish pass (nothing here needs it — every root
is inside Syzygy range, which is the point of the root choices); the
rook-pawn drawn-file claim in the QvP pack is cited-not-queried and named in
its blockers; no touch of `rfc/`, `design/`, `apps/`, `packages/`,
`schemas/`, no commits; stayed off sibling OPENING and ON-RAMP territory.

## 2026-08-14 — Content wave 4a: eight opening packs — next priority tier + the §2c stragglers (claude)

**Landed.** Four families, one chosen-side and one anti pack each, all in
`content/drafts/`, all `make pack-check` green:

- **King's Indian** (E60 row, 5,353,956): `kid-classical-black` (chosen) +
  `anti-kid-classical-white` (§2c straggler anti-KID). E99 Traditional Line
  skeleton, both sides; 9.b4 Bayonet and ...Ne8 as branch tips. Shape handoff:
  `fianchetto-g7` (trigger arithmetic holds across every spine position).
- **Dutch** (A80 row, 4,845,395): `leningrad-dutch-black` (chosen) +
  `anti-dutch-leningrad-white` (§2c anti-Dutch). A87 skeleton via the 2.c4
  order (33.3% at band); Warsaw/Matulovic finishers as tips, with the A88/A89
  2.g3-order transpositions verified FEN-identical. Shape handoff:
  `fianchetto-g7` incl. the white-trade plan on the anti side.
- **London** (D02 row, 3,851,145): `london-system-white` (chosen) +
  `anti-london-black` (§2c anti-London). D02 mainline row + hand plies to the
  Bg3/Bd3/Ne5 tabiya; the ...Qb6 Poisoned Pawn row reached by transposition,
  FEN-verified. **No shapes reference, deliberately** — no library entry names
  the London wedge; entry commissioned in both packs' blockers.
- **Italian** (wave-4a C50 row, 44,467,486): `italian-center-attack-white` +
  `anti-italian-center-attack-black`. C54 Center Attack skeleton + the forcing
  9-ply hand extension to the isolani tabiya. Shape handoff: `iqp-white`, and
  the Black pack ARRIVES inside the entry's blockade success signature
  (knight on d5 + isolated white d-pawn, census-derived from the walked FEN).

**Priority evidence.** The committed artifact's next tier after wave 2 is
exactly KID/Dutch/London — the three §2c stragglers' families — so the design
commitment and the frequency order coincide. The eighth-pack family came from a
fresh authenticated explorer pull (same query surface: 1400/1600/1800,
blitz+rapid, 2024-01..2026-07) over seven candidate roots, emitted to
`content/candidates/priority-wave4a/` (separate output root: the committed
artifact's lines input is a fixture inside `apps/`, untouchable this wave).
Result: B01 Scandinavian 56,347,011 (2 plies) > C50 Italian 44,467,486
(5 plies) > C60 Ruy 20,756,268 > D30 QGD 13,978,493 > D10 Slav 10,340,215.
**Italian chosen over Scandinavian on depth-commensurability**: among
tabiya-depth roots (4-6 plies) the Italian leads 2:1, and a 2-ply funnel is not
comparable to 5-ply roots (the committed artifact's own Sicilian row has the
same property). Judgment recorded here and in the Italian packs' blockers; the
Scandinavian is the obvious wave-4b family on raw totals.

**Cost split (minutes; engine-validation 0 and owner-review 0 everywhere):**

- batch setup (nine docs/models read, priority pull incl. 401-then-token
  redo, four TSV volumes fetched, 8 skeleton emits, chessops walk harness):
  agent-research 35 · tooling-friction 12
- kid-classical-black: agent-research 6 · agent-encoding 16 · revision 0
- anti-kid-classical-white: agent-research 4 · agent-encoding 16 · revision 0
- leningrad-dutch-black: agent-research 6 · agent-encoding 14 · revision 0
- anti-dutch-leningrad-white: agent-research 4 · agent-encoding 15 · revision 2 (sibling-branch placement)
- london-system-white: agent-research 5 · agent-encoding 15 · revision 1 (evidenceTypes)
- anti-london-black: agent-research 3 · agent-encoding 14 · revision 0
- italian-center-attack-white: agent-research 6 · agent-encoding 15 · revision 0
- anti-italian-center-attack-black: agent-research 3 · agent-encoding 15 · revision 0

Validator: 6/8 green on first run; the two failures were mine (root-sibling
branches nested as children — `ILLEGAL_SPINE_MOVE` with exact pointers — and
one wrong evidenceTypes label), both fixed in minutes.

**Frictions and findings, sharpest first:**

1. **The explorer requires the token for every pull now**: the unauthenticated
   run returned a clean all-abstention artifact (HTTP 401 recorded per row) —
   the instrument degraded exactly as designed, and `.env.lichess` + re-run
   produced the real artifact. Cache note: the committed priority artifact's
   six cached responses are still present under `content/sources/`, so a
   future single-artifact re-emit with a widened lines file would reproduce
   the old rows byte-identical — but the lines input lives at
   `apps/server/src/sourcing/fixtures/explorer-lines.tsv`, which content-era
   agents may not edit. Ask: move the priority lines input to `content/`.
2. **Wave-2 friction #2 recurs, wider**: the openings emitter's fixture covers
   only a 3-row d.tsv stub — even the D02 London family needed the pinned
   commit's real volume fetched to the scratchpad. All four families (a, c, d,
   e volumes) ran through `--tsv`. Ship the five volumes or fetch under the
   source lock.
3. **Wave-2 friction #3 recurs, twice** (third and fourth attestations):
   first-move alternatives (anti-Dutch 2.Bf4/2.e4, anti-Italian ...Nf6 Two
   Knights) are sibling root branches again. The validator's
   ILLEGAL_SPINE_MOVE pointer caught my attempt to nest them as children —
   the error surface is good; the missing start-anchor idiom is still the ask.
4. **Wave-2 friction #5 recurs** (fianchetto-g7's white-trade plan and
   iqp-white references are hands-off declarations in three of the packs;
   genuinely-firing in the others). Same ask: a "present vs hands-off-to"
   distinction on shape references.
5. **Two shape-library gaps now block honest handoffs**: (a) no entry names
   the KID chain arrangement — `closed-centre-chain`'s trigger is pinned to
   the French/Caro squares and the mirroring law correctly forbids reusing its
   colour-owned plans for the reversed arrangement, so both KID packs inline
   their chain teaching; (b) no entry names the London wedge/system pyramid.
   Both commissioned via graduationBlockers (wave-3 dxc5-residue precedent).
6. **The walk harness caught a real authoring error before it shipped**: the
   drafted London "h-file trap" annotation claimed ...Bxg3 after Nxe5 dxe5 —
   illegal, the e5 pawn blocks the d6-g3 diagonal. The surviving annotations
   state only derived fork geometry. Lines must be derived, never recalled
   (fourth attestation of the wave-2/3 lesson; plain `node` + the pnpm-store
   chessops ESM path works without the esbuild ritual — cheaper than both
   prior methods).
7. **What worked as designed**: `derived_feature` is exactly the right
   evidenceTypes label for machine-walked square arithmetic (used in three
   packs); the anti-Italian pack ending INSIDE iqp-white's blockade success
   signature is the first pack whose shape handoff is a board fact on arrival
   rather than a promise.

**Not done, deliberately:** no engine pass on any position (every pack's
blockers say so); no explorer pulls below family roots; the shipped
named_structure evaluator was not executed against the walked FENs (census
arithmetic is declared as such); no touch of `rfc/`, `design/`, `apps/`,
`packages/`, `schemas/`; no commits; stayed off sibling ON-RAMP and ENDGAME
territory. Schema note: format constant verified at 0.15 (stated_reasoning
landed mid-wave); these packs use the wave-2 vocabulary, valid under both.

## 2026-08-14 — pack wave 5c (final endgame batch): theoretical mates + the variants-rule demonstration (claude)

agent-research 97 · agent-encoding 68 · agent-engine-validation 35 · review 0 · agent-revision 11 · agent-tooling-friction 10
notes: **Landed four packs in `content/drafts/`, all `make pack-check` green, all
fully Syzygy-grounded** — the theoretical-mates row of design/04 §4 ("drilled
once, never again"; owner ruling 2026-08-14: mates packs are IN) plus one
demonstration of the convert/hold variants rule:

- `mate-k-q-technique.json` (win, 3 pieces, 1000–1400, guard ON at 200cp) —
  19-ply spine: knight's-move tracking to the h8 corner, queen parks, king
  marches, Qe8#. **The stalemate traps ARE the content, as briefed**: Qf7 with
  the cornered king queried STALEMATE at TWO anchors — mid-drill and one move
  before mate — and the final-node enumeration shows 27 of 29 moves still win
  (the two failures are both stalemate). Four hang-the-queen checks at the
  root/early nodes all queried draws; the aimless Qd8+ queried win and
  classed interesting (progress reset, nothing lost).
- `mate-k-r-technique.json` (win, 3 pieces, 1000–1400, guard ON) — 19-ply
  spine with the full method: fence (Rh6), opposition shadow, THE TEMPO MOVE
  (Ra6 slide from the long side), drive check on opposition (Ra7+), herd,
  Ra8#. The same waiting-move idea from the short side (Rf6) queried DRAW —
  Kxf6 — at both nodes where it tempts; Rg7 at the final node queried
  STALEMATE one move from mate.
- `mate-two-bishops.json` (win, 4 pieces, 1400–2000, delayed_checkpoint) —
  the spine IS the DTM-optimal line for both sides (17 plies), drive-to-corner
  with the quiet full-length retreat Bb1 as the pivot move. Enumeration found
  a stalemate FIELD: at the final node 16 of 18 legal moves are stalemate, the
  17th hangs a bishop, the 18th is Bd4#; plus three mid-line king-approach
  stalemates (Ke7, Bf7, Kf7), all encoded as deviations with queried
  categories. First root drafted had both bishops on dark squares — the
  tablebase said DRAW and the root was rebuilt (harness catch #1).
- `philidor-passive-rook-convert.json` (win, 5 pieces, 1400–2200) — **the
  variants-rule demonstration**: the CONVERT sibling of wave-5b's
  `philidor-third-rank-hold`, root DERIVED not constructed (hold-root after
  the queried-losing 1...Rh8??, i.e. h6h8). The tablebase gave the pack its
  thesis for free: Ra8+ (the skewer through the king that blocks its own
  rook) is the UNIQUE winning move — all 21 root moves enumerated: 1 win, 13
  draws (including Kd6, the textbook squeeze, refuted HERE and honestly
  cross-referenced against the shape entry's white-squeeze plan), 7 losses
  (hanging the rook). At the collection node the geometry reverses: quiet
  eighth-rank rook moves and all four king moves queried LOSSES to Rxa8 once
  e8 is vacated. Conversion tail ends Rh8# via the K+R fence (deliberate
  reprise); the conversion has its own queried STALEMATE (Ke5 at the
  sixth-rank node) — now a deviation. Sibling cross-referenced in provenance
  prose + `retryVariants: opposite_side` both ways is impossible (hold pack
  is frozen content, not edited) — one-way prose link only, per the gap.

**Grounding method (wave-5b discipline replicated and extended):**
tablebase.lichess.org /standard via the scratchpad python-chess 1.11.2
harness with JSON cache and 429 backoff. Every spine move of all four packs
queried win-preserving; all four spines walked to CHECKMATE (rules
arithmetic); **full legal-move enumeration at every learner decision node**
(not spot checks), which is where the undrafted stalemates were found; every
deviation category is the queried one. A final self-check script re-reads the
four SHIPPED JSON files and re-verifies spines, deviations, declared piece
counts and root categories against the tablebase: 0 failures.

**The harness and validator caught five authored chess errors before ship:**
(1) same-coloured-bishops B+B root — queried draw; (2)+(3) two K+R finishes —
one mis-spliced (walk showed Ra8+ NOT mate, king off the mating post), one 23
plies (over the 20-ply format cap); (4) drafted claim "Ra7+ draws" at the
collection node — enumeration says WIN, and drafted "all root alternatives
draw" — seven are LOSSES; both notes rewritten to the queried facts;
(5) drafted root deviation e4e5 — ILLEGAL, own king on e5 blocks the pawn,
caught by pack-check ILLEGAL_DEVIATION_MOVE with exact pointer.

contract-gaps and frictions, sharpest first:
1. **Variants rule still fights the format (wave-5b gap #1, second
   attestation, now with a machine-derivable case).** This convert sibling's
   root is DERIVED from the hold pack's root by one recorded move — the
   strongest possible root-identity fact — and the format still cannot say
   it. Prose + one-way retryVariants remain the stand-in. If a root-identity
   field lands, this pair is the test fixture.
2. **Mates packs want the perfect_tablebase opponent and cannot have it**:
   the mode is declared-unimplemented (capabilities.ts), pack-check would
   refuse it, so all four packs run human_common with a blocker note. The
   whole point of a theoretical-mate drill is "works against best defence";
   revisit when tablebase opponent selection ships.
3. **branchLengthTarget's 20-ply cap constrains theoretical mates
   structurally**: K+R from a centre king is DTM 21–23 before method
   overhead — a full-length mate drill cannot fit one spine. Both 3-piece
   packs root one stage in (rank-7/centre-edge kings). Acceptable for
   "drilled once", but the cap is now a measured content constraint, not a
   hypothetical.
4. **AUTHORED_PROSE_AFTER_LAST_CHECKPOINT is a good lint**: it fired on the
   K+Q march annotations and forced a real improvement — the
   mate-or-stalemate checkpoints at the final decision node now exist in all
   three mates packs because prose needed a path to a checkpoint.
5. **Full-node enumeration should be standing discipline for ≤7-piece
   packs**: every stalemate deviation in the B+B and philidor packs that no
   draft contained was found by enumerating all legal moves at decision
   nodes and querying each. Cost is bounded (≤30 queries/node, cached); the
   content it surfaces (the B+B "16 of 18" fact) is the sharpest in the
   batch.
6. Rate limit: parallel enumeration streams tripped tablebase.lichess.org
   429s; fixed with 1s spacing + exponential backoff, cache reused across
   reruns. Batch discipline: one sequential stream.
7. python-chess still not blessed in the repo toolchain (third attestation;
   installed to scratchpad venv again).

Not done, deliberately: no B+N mate pack (design/04 lists it; deliberately
deferred with a note in the B+B pack's provenance — its place at any band is
an open product question, and "drilled once" cuts against authoring it
without a ruling); no sourcing sidecars/candidates (wave-5b gap #3
unchanged — all four Syzygy declarations remain admission-unverified); no
Stockfish pass (everything is inside Syzygy range — the point of the root
choices); no touch of `rfc/`, `design/`, `archive/`, `apps/`, `packages/`,
`schemas/`, opening-named drafts, or ON-RAMP territory; no commits.

## 2026-08-15 — B+N as a multi-segment trajectory (owner ruling 2026-08-15), session 1 (claude)

agent-research 25 · agent-encoding 70 · agent-engine-validation 55 · review 0 · agent-revision 20 · agent-tooling-friction 25
notes: **Two packs landed in `content/drafts/`, both `make pack-check` green.**
The commissioned deliverable is the trajectory; the second file exists because
of a format blockage described below.

- `trajectory-mate-bishop-knight.json` (trajectory, 3 legs, 39-ply spine,
  1400–2200, `perfect_tablebase` opponent) — **the commissioned pack.** Root is
  a constructed schematic: White Ke4, Bc3 (dark), Nd3; Black Ke6, White to move.
  Queried **win, DTM 39 plies, 4 pieces**. Spine is DTM-optimal for both sides —
  distance to mate falls by **exactly one ply after every one of the 39 moves**
  — and ends in `Bf6#` confirmed by rules arithmetic.
- `mate-bishop-knight.json` (outcome, win, same root, same 39 plies) —
  **`ledger_verified`**, sidecars emitted by `make verify-draft`. It exists only
  because verify-draft structurally cannot touch a trajectory pack (gap #1). It
  is also the theoretical-mates family member wave 5c deliberately deferred
  ("no B+N pack … its place at any band is an open product question") — the
  2026-08-15 ruling closed that question.

**The three-phase decomposition was measured, not assumed.** Black-king square
was computed after every ply of the verified line: the king first stands on an
edge after **ply 8** (…Kc8), first stands inside the g7–h8 corner box after
**ply 28** (…Kg8), and first stands **on h8 after ply 34**. Both leg boundaries
are structural predicates over the run FEN (`quantified some … piece = black
king`), and the **shipped** `matchesStructuralExpression` was run over the spine
to confirm they first fire at plies 8 and 28 — not my reimplementation. Legs are
therefore **8 / 20 / 11 plies**. The owner's decomposition survives contact with
the tablebase: against the most resistant reply available at every turn the lone
king ran to the a8 side — the corner a dark-squared bishop can never attack — so
leg two is not an artefact of the line, it is what leg one buys.

**THE 20-PLY CAP: it binds exactly, and only under one reading of leg two.**
Leg two as authored is **20 plies — the cap with zero margin**. Leg two under
the plain reading of the ruling ("drive it along the edge to a corner matching
the bishop's colour", i.e. the king standing **on h8**) is **26 plies and does
not fit**. The pack fits because I defined the leg-two boundary as the corner
**box** rather than the corner square. That is a defensible reading of the
phase, but it is a choice made to fit a cap, and it is recorded as one in the
pack's provenance. Option (b) from the brief was not needed and option (a) was
not used: the ruling's three phases stand.

**Verification discipline (wave-5c standard replicated).**
tablebase.lichess.org `/standard`, one request at a time, JSON cache, 429
backoff. Every spine position queried; **full legal-move enumeration at all
twenty White-to-move nodes** (the endpoint returns every legal move with its own
category, so enumeration is exhaustive rather than sampled); every deviation
category is the queried one after the documented inversion. A final self-check
script re-reads the two **shipped** JSON files and re-verifies spines, SAN/UCI
agreement, checkmate, per-ply DTM progress, every deviation category, every
stalemate claim, and every count quoted in prose: **0 failures**.

**Enumeration content the drafts could not have guessed:**
- Root: 23 legal, 22 win, **1 draw — Bf6**, the square the bishop mates from
  twenty moves later, played while the king still stands beside it.
- Ply-14 node (`3k4/4N3/2K5/8/8/6B1/8/8 w`): 20 legal, **7 win, 13 draw**. All
  five king retreats draw; seven of nine bishop moves draw, **including the
  check Bc7+**. This is the sharpest position in the pack and it sits exactly on
  the seam between phase one and phase two.
- Ply-38 mating node: 18 legal, 9 win, 9 draw — and **eight of the nine draws
  are STALEMATE. Every bishop move on the board except the mating one
  stalemates.** Sharper than the B+B pack's "16 of 18".
- Ply-28 node (leg-3 entry): **all 18 legal moves win**. Nothing there can lose
  the point; Ke7 wins in 24 plies instead of 10. Encoded as an
  `interesting_deviation` — the fifty-move rule as the real opponent.
- Ply-12 `Bc7` and ply-36 `Kh6`: a mid-drill stalemate, and a winning move that
  moves the mate from 2 plies to 58.

**perfect_tablebase is now usable and this is the first pack to use it.**
Wave 5c's gap #2 ("mates packs want the perfect_tablebase opponent and cannot
have it") is **CLOSED**: the mode is supported for roots of ≤7 pieces
(`pack-validation.ts` `PERFECT_TABLEBASE_OUT_OF_RANGE` is the only gate) and a
provider-configured deployment publishes it. Stronger: I reimplemented the
shipped selection rule (`opponent-selector.ts` — category-preserving moves only,
losing position ordered by longest absolute DTZ, ties by lexicographically least
UCI) and it **reproduced all nineteen authored Black replies**. The authored
line is literally what the declared opponent will play.

**Two authoring errors the harness caught in my own drafting:**
1. Drafted the "you lost a piece" success condition by copying
   `mate-two-bishops`'s shape, then reworked it into `quantified`/`pieceOnSquare`
   nodes — which **crashed `pack-check` with an unhandled `TypeError:
   Structural success condition has no feature leaf`** (see gap #4). Rebuilt on
   a `piece_reach_count` feature leaf with `scope: "any"`.
2. While doing (1) I found that **`mate-two-bishops.json`'s only success
   condition can never fire**: `not(piece_reach_count … scope "every" … atLeast
   0)`. `every` over an empty piece set is vacuously true, so the negation is
   false exactly when the bishops are gone — backwards. Not touched (out of
   scope, and it is frozen content), reported instead.
Two prose errors were also caught before ship by hand-checking annotations
against the position: a claim that Nd6+ "takes e8" (it *checks* on e8) and a
claim that from ply 33 "every white move is either mate, a check, or a
stalemate" (at ply 35 all nineteen legal moves win and none draw). Both
rewritten to what the board actually says.

contract-gaps and frictions, sharpest first:
1. **A TRAJECTORY PACK CANNOT BE `ledger_verified`. Structural, not
   incidental.** `make verify-draft` requires
   `objective.grading.assessedBy.kind === "syzygy"` on the **top-level**
   objective and refuses everything else with `VERIFY_ASSESSMENT_NOT_SYZYGY`
   (observed, exact error). A trajectory's top-level objective is
   `run_trajectory`, which the validator refuses to let carry grading at all
   (`OBJECTIVE_GRADING_UNSUPPORTED`), and a leg may not carry a Syzygy
   assessment either (`TRAJECTORY_LEG_SYZYGY_UNSUPPORTED`). So the *most*
   machine-grounded pack in the repo has to declare its root assessment as
   `kind: "authored"` and ships with **zero evidence sidecars**, while a
   worse-grounded outcome pack over the identical spine earns
   `ledger_verified` on the first try. A reader of the trajectory file alone
   cannot distinguish its grounded win from a guessed one. This is why
   `mate-bishop-knight.json` exists at all.
2. **A leg carries only `id`, `entryCheckpointId`, `objective` — so per-leg
   authoring is inexpressible, and a phase-rehearsal pack is exactly the thing
   that needs it.** Three concrete losses in this pack: (a) **per-leg
   `opponentPolicy`** — phase one is drillable against a weaker defender and
   phase three must be perfect; one policy is declared for all three;
   (b) **per-leg `shapes`**; (c) **per-leg `branchLengthTarget`** — this pack's
   legs are 8 / 20 / 11 plies and the single pack-level field can only say
   `20`, so the on-ramp-vs-core band the field encodes cannot be stated per
   phase. (a) is the one with teeth: the whole thesis of resistance-varied
   replay is per-phase.
3. **`branchLengthTarget`'s 2–20 range, third attestation, now from both
   sides.** Wave 5c hit it with a 23-ply K+R finish. Here: leg two is exactly
   20 (see above), and the outcome sibling's 39-ply spine **cannot declare the
   field at all** — no legal value describes the drill, so it is omitted and the
   length is stated in provenance instead. A field that must be omitted to stay
   honest is not doing its job.
4. **A schema-valid structural success condition can crash `pack-check` instead
   of failing it.** `conditionEvidenceRefs` throws a bare
   `TypeError("Structural success condition has no feature leaf")` for any
   expression built only from `quantified` / `pieceOnSquare` nodes — both are
   first-class schema constructs since 0.13. Worse, for **outcome** objectives
   `objectiveRules` is not called during validation at all (only
   `PLAN_OBJECTIVES` are checked), so the identical condition passes
   `pack-check` and would throw at runtime. Two defects in one: an unhandled
   throw where a typed validation issue belongs, and a validation path that
   does not exercise the rule compiler for outcome packs.
5. **The `authored` assessment note is capped at 400 characters.** The note is
   the only place to explain *why* an assessment is declared authored; my first
   draft explaining gap #1 was refused by `SCHEMA_MAXLENGTH` and had to be
   trimmed. Minor, but it bites precisely where honesty costs words.
6. **Structural leg boundaries need king geometry and the vocabulary has none.**
   "The black king is on an edge" had to be built from four `quantified` square
   regions, and the objective type is `reach_structure` — a pawn-structure word
   doing duty for a king-geometry target. It works and it is deterministic; it
   is also four times longer than the fact it states.
7. python-chess still not blessed in the repo toolchain (fourth attestation;
   scratchpad venv again, 1.11.2).

Not done, deliberately: no touch of `rfc/`, `design/`, `docs/`, `archive/`,
`apps/`, `packages/`, `schemas/`, or any existing content pack (including
`mate-two-bishops.json`, whose dead success condition is reported above rather
than fixed); no shape-library entry for theoretical mates (still none exists);
no Stockfish pass (everything is inside Syzygy range); no commits.
