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
