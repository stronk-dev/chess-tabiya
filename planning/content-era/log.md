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

## 2026-08-15 — Grounding wave G1: the first engine pass over the ungrounded opening packs (claude)

The unpaid bill named in `design/research/pack-authoring-cost.md` §7 ("the
28.8-minute opening pack has an unpaid bill of unknown size") and §8 (a grounding
pass costing more than ~30 min/pack moves K10 back toward firing). It is now
paid and measured.

agent-research 55 · agent-encoding 50 · agent-engine-validation 85 · review 0 ·
agent-revision 15 · agent-tooling-friction 35 · **total 185 for 18 packs = 10.3
min/pack, friction 18.9%**

Machine time outside the clocks, per the convention wave 5a set: 214 s for the
main pass (5 parallel Stockfish processes) plus ~70 s for the targeted line
checks. 387 engine jobs at depth 22 in total.

### The list, derived rather than trusted

The dossier says "fifteen opening packs". Derived from the files: **18** packs
carry `phase: "opening"`, no `objective.grading` at all, no `*.evidence.json`
sidecar, and the blocker "No engine validation pass has been run on any position
in this pack" — `anti-caro-advance` (pack A), the six wave-2 packs
(`caro-kann-advance-black`, `french-advance-black`, `anti-french-advance-white`,
`london-system-white`, `anti-london-black`, `anti-caro-advance-early-c5`), the
eight wave-4a packs (`italian-center-attack-white`,
`anti-italian-center-attack-black`, `anti-sicilian-najdorf-english-attack`,
`najdorf-english-attack-black`, `anti-kid-classical-white`,
`kid-classical-black`, `anti-dutch-leningrad-white`, `leningrad-dutch-black`),
and the three wave-5a on-ramp packs (`opening-principles-white`,
`opening-principles-black`, `opponent-intent-early-queen`). The dossier's §4
table counts 14 (waves 2 + 4a only); §7's "fifteen" appears to add pack A and
drop the on-ramp three. Two more packs carry the same blocker but are not
opening-phase and were **not** touched: `carlsbad-minority-attack` (middlegame)
and the two cross-phase trajectories.

### Instrument

Stockfish 18 at the repo's own `AUTHORING_PROFILE` — depth 22, Threads 1, Hash
16MB, MultiPV 1 — driven through `apps/server`'s `EngineSupervisor` and
`StockfishEvidenceExecutor`, the same engine path `make candidate-emit
--engine-eval` uses. No second UCI integration was written; a scratch entry file
re-exported the repo's classes and was bundled with the repo's own esbuild.
Every spine node's resulting position, every authored deviation's resulting
position, and the engine's depth-22 first choice at each decision position:
180 decision positions (103 unique FENs, siblings share lines), 358 candidate
moves. Loss is reported **candidate-relative** — best evaluated candidate at a
position minus this move — so it is a lower bound; all legal moves were not
enumerated. Corpus claims were separately checked against
`content/candidates/priority/priority.json` and `priority-wave4a/priority.json`.

### What the engine refuted

1. **`anti-caro-advance-early-c5` authored a piece blunder into a spine
   mainline, and annotated it as an even trade.** The line 5.Be3 Bxc5 6.Bxc5
   was captioned "Material is level again and the position is the receipt". It
   is not: after 6.Bxc5 Black has **no legal recapture on c5**, material is
   38-35 and the position evaluates **+4.54** for White. It joins the seven
   authored chess errors machine validation caught in waves 5b and 5c
   (`log.md:1050`, `:1269`) as the first one caught in an opening pack, and the
   worst by magnitude. Spine nodes `bxc5-recoup` and `bxc5-trade`,
   checkpoint `price-collected` and the two `authoredBoundary` entries were
   **deleted**. No replacement line was authored — the `return-for-development`
   plan class now names a plan with no line under it, which is the honest state.
2. **`italian-center-attack-white` asserted a false legality fact.** The
   `p11-cxd4` annotation said "the wrong recapture question does not exist here
   — only the c-pawn can take". Qxd4, cxd4 and Nxd4 are all legal. Clause
   deleted.
3. **`italian-center-attack-white`'s central feedbackClaim is refuted at three
   points, against a blocker whose own bar was one.** `forcing-literacy` claimed
   "from 5.d4 to 9...Nxd5 nearly every move is the position's only good answer".
   5.d4 is 0.14 below 5.d3; 6.cxd4 is 0.28 below 6.e5; 7...Bxd2+ is 0.13 below
   7...Nxe4. The claim was **deleted**, not rewritten: a replacement would be a
   new authored judgment this pass cannot ground.
4. **`anti-dutch-leningrad-white` deviation #2's authored walked line drops a
   piece.** "8.e4 fxe4 9.Nxe4" — after 9...Nxe4 the knight is defended by
   nothing (the g2 bishop's diagonal is blocked by White's own knight on f3):
   **-3.11**. 8.e4 itself is 1.65 below 8.Qb3. The walked line was removed and
   no replacement ninth move authored.
5. **`anti-sicilian-najdorf-english-attack`'s move-order thesis has the engine
   against it.** Deviation #6 claimed 8.Qd2-before-f3 "re-opens the door:
   ...Ng4 now hits the e3 bishop". At depth 22, 8.Qd2 Ng4 leaves White **+1.08**
   (up from +0.40) — the door costs Black — and 8.Qd2 (+0.40) is the
   highest-scoring eighth move measured, **ahead of the spine's 8.f3 (+0.31)**.
   Mechanism deleted; class kept (see §"what the pass may not do"); the contrary
   number recorded in its place.
6. **`anti-caro-advance`'s model answer is the third-best of its own four
   candidates.** 6.O-O — classed `concept_violation`, `offObjective` — is the
   **top** candidate at +0.32; 6.c3 is +0.27; the spine's model answer 6.Be3 is
   +0.09. The deviation note's own words ("not a blunder") are confirmed. The
   pack's blocker asked exactly this question and got an answer it will not
   enjoy.
7. **`opponent-intent-early-queen` deviation #1 is classed `tactical_error` at a
   measured cost of 0.20** — below the pack's own declared 150-centipawn guard,
   which therefore can never fire on it. The note's *material* claim (3.Qxe5+
   wins a pawn with check) is confirmed; the *grading* is not.
8. **`anti-london-black`'s ...Bxg3 timing doctrine is unresolvable, not wrong.**
   ...Bxg3 -0.33 against ...O-O -0.28: 0.05, inside noise. The blocker asked it
   to "harden or fall on evidence"; the evidence does neither, which is the
   answer.

### What the engine confirmed

- **`anti-french-advance-white`'s Be2 trap wins**, as the blocker said only
  material arithmetic supported: 6.Be2 cxd4 7.cxd4 Nxd4 8.Nxd4 Qxd4 9.Bb5+ Bd7
  10.Bxd7+ Kxd7 11.Qxd4 = **+6.70**, material 31-23; the 9...Ke7 decline
  = +7.11. Blocker cleared.
- **`anti-kid-classical-white`'s "7.dxe5 resolves level" is literally true** —
  0.00 at depth 22 — and it costs White the whole 0.65 edge.
- **`anti-italian-center-attack-black`'s 6...Nxe4 does not equalize**, which was
  the stated condition for demoting the spine: -3.89, and -1.83 after the
  authored 7.d5. The sibling 6...Bb6 costs 1.86; 7.d5 Ne7 = +1.81 for White.
- **`opponent-intent-early-queen`'s three model-answer rankings reproduce
  exactly**: ...Nc6 +0.42 > ...d6 +0.37 > ...Qe7 +0.08; ...g6 +0.37 > ...Qe7
  +0.12 > ...Qf6 -0.21; ...Nf6 +0.39 > ...Qe7 +0.19 > ...Qf6 +0.14. Its
  punishments too: 2...g6 -4.60, and 3...Nf6, 3...d6, 4...Nd4 all forced mate.
  The strongest confirmation in the corpus.
- **Every `corpus_observed` claim in all 18 packs checks out** against the two
  shipped explorer artifacts — totals, share percentages and score percentages,
  exactly. Zero corpus refutations.
- **Zero structural problems.** All 200 spine moves legal with SAN/UCI
  agreement, all 115 authored deviations legal at their anchors, on the first
  walk. `pack-check` green on all 35 pack files after every edit.

### The finding that matters most: there is no grounding path for an opening claim

`make verify-draft FILE=content/drafts/anti-caro-advance.json` →
`ERROR [VERIFY_ASSESSMENT_NOT_SYZYGY] objective.grading.assessedBy.kind must be
syzygy`. That is not a tablebase-range accident that a Stockfish branch could
fix later, because the slot itself does not exist: all 18 packs are
`follow_theory` or `play_until_checkpoint`, and `pack-validation.ts:448` rejects
`objective.grading` on any non-outcome objective with
`OBJECTIVE_GRADING_UNSUPPORTED` (verified on a scratch copy). So an opening pack
**cannot declare an assessment, cannot be `ledger_verified`, and cannot emit an
`*.evidence.json` / `*.sources.json` / `*.job.json` sidecar** — the entire
authoring-evidence machine is reachable only by outcome packs inside seven
pieces. This is the same structural hole wave B+N hit from the trajectory side
(`log.md:1417-1430`), now attested from the opening side: **two of the three
phases in the product have no evidence-attachment path at all.**

Consequence for this wave: the evidence was written into
`provenance.engineValidation` (per-move FEN, SAN, UCI, role, centipawns, loss)
plus a prose `sources` entry per pack. `provenance` is `additionalProperties:
true`, so this validates — but it is a convention this wave invented, nothing
validates its shape, no registry reads it, and `sourcing-check` does not know it
exists. It is honest storage, not grounding.

### What the pass may not do, and did not

`rfc/archive/content-sourcing-foundation.md:772` rules that deviation classes are
relative to the pack's objective and that **no evaluation separates
`concept_violation` from `interesting_deviation`**. So no class was reclassified
on a centipawn number anywhere in this wave, including the four places where the
number plainly disagrees with the class (items 5, 6, 7 above and
`najdorf-english-attack-black`'s 7...d5 at -1.42, whose own blocker instructed a
future pass to harden the class). That instruction was **not** followed and the
disagreement is left visible in the file. Law 8 cuts both ways: the engine may
not manufacture the class any more than the LLM may.

What was changed is only: false factual statements (legality, material,
"nothing has evaluated this"), a spine line that hangs a piece, and one
feedbackClaim the evidence refutes. Three deletions, four note rewrites, one
plan-class description rewrite. Nothing was invented to replace what was
removed.

### Cost verdict — K10

`design/research/pack-authoring-cost.md` §8 names the trigger: *"A grounding pass
over the 15 opening packs costs more than ~30 min/pack"* would move K10 back
toward firing. Measured: **10.3 min/pack**, friction 18.9%. The trigger does not
fire. Fully-loaded opening pack = 28.8 (drafting) + 10.3 (grounding) ≈ **39.1
min/pack**, at or just under the Syzygy-grounded endgame rate of 40.6 — which is
§8's stated condition for closing K10 as settled-no on this half. The dossier's
diagnosis was right (cost tracks the grounding bar, not the format) and its
worry about the size of the bill was not: grounding 18 opening packs cost less
per pack than authoring one did, because the engine pass is batched machine work
and the expensive part — deciding what the numbers are allowed to change — is
per-wave, not per-pack.

The dossier's §4 "the 28.8-minute opening pack is a draft, not a publishable
one" still stands, for a reason the cost table cannot show: the pass grounded
**moves**, and every pack's prose, plan classes and deviation classes remain
exactly as ungrounded as before.

contract-gaps and frictions, sharpest first:
1. **No evidence slot for a non-outcome pack.** Above. Second independent
   attestation of the same hole after B+N. The `assessedBy` union would need an
   `engine` member and `pack-validation` would need to allow grading on
   `follow_theory` / `play_until_checkpoint` before an opening pack can carry
   evidence at all.
2. **No repo command evaluates a draft pack.** `make verify-draft` is
   tablebase-only; `make candidate-emit --engine-eval` evaluates *candidate
   seeds*, not an authored pack's spine and deviations. Every wave that wants
   engine numbers must bundle the repo's engine classes into a scratch harness
   itself — this wave did, with an esbuild `NODE_PATH` workaround because the
   scratch entry lives outside the workspace. This is the same "throwaway
   chess-verification harness" item `rfc/authoring-frictions.md` ranks first,
   now at a **fifth** attestation and for the first time on the *engine* rather
   than the tablebase side.
3. **The deviation class carries two incompatible jobs and the pass made it
   visible in four files.** A class that is objective-relative by rule cannot be
   checked, hardened or softened by the only mechanical instrument the phase
   has. Either the class needs an evaluation-bearing sibling field (an authored
   claim plus a measured cost, separately), or packs must stop writing blockers
   that promise a future engine pass will settle it — three packs currently do.
4. **`guard.evalSwingCp` and `deviations[].class` are unrelated in the schema
   and inconsistent in practice.** `opponent-intent-early-queen` declares a
   150cp guard and classes a 20cp move `tactical_error`. Nothing validates the
   pair.
5. **The corpus artifacts cover 1400/1600/1800 only.** All three on-ramp packs
   target 1000-1400, so every "what players at your level actually play" claim
   in them is unanswerable from repo data without a new explorer pull. Recorded
   as a blocker in each.

Not done, deliberately: no touch of `rfc/`, `design/`, `docs/`, `archive/`,
`apps/`, `packages/`, `schemas/`, `content/shapes/`, or any non-opening pack
(including `carlsbad-minority-attack` and the two cross-phase trajectories,
which carry the same blocker); no class reclassifications; no replacement lines
for anything deleted; no commits.

## 2026-08-15 — Wave 4b: the two commissioned shape entries, the Scandinavian judgment overturned, and the first prose-grounding pass (claude)

Three outstanding commissions cleared in one wave: the shape entries two earlier
packs blocked on, the Scandinavian deferral that wave 4a recorded rather than
resolved, and the prose residue grounding wave G1 explicitly did not reach.

agent-research 70 · agent-encoding 85 · agent-engine-validation 95 · review 0 ·
agent-revision 20 · agent-tooling-friction 40 · **total 310**, friction 12.9%

Machine time outside the clocks (wave-5a convention): 55 s for the main
Stockfish batch (5 parallel processes, 10 decisions / 50 candidates), ~40 s for
the White-side batch and ~25 s for the supplementary refutation lines — 130
engine jobs at depth 22 in total; four serialized Lichess explorer pulls (30
rows) through the repo's own emitter.

Delivered: 2 shape entries, 2 opening packs, 4 packs wired to the new entries,
5 packs prose-corrected, 4 new candidate artifacts. `make shape-check` green on
all 25 entries, `make pack-check` green on all 39 packs, and an independent
re-walk of all 527 spine positions in `content/drafts` legal with SAN/UCI
agreement.

### 1. The two commissioned entries

Both were commissioned **via blockers** — wave-4a authors wanted to reference an
entry that did not exist and correctly shipped without a wrong reference. Before
authoring either, the gap itself was verified rather than trusted: the trigger of
every one of the 23 existing entries was evaluated against all 487 then-shipped
spine positions with the repo's own `matchesStructuralExpression`. Result: **no
entry fires on any position of either London pack**, and on the King's Indian
packs only `fianchetto-g7` fires — `closed-centre-chain` matches nothing there,
exactly as its own provenance and the KID blockers claimed and nothing had
checked.

- **`content/shapes/london-wedge.json`** — c3/d4/e3 with the dark-squared bishop
  on f4, g3 or h2. Fires on exactly 14 nodes, the seven from `p11-c3` to
  `p17-ne5` in each London pack, and nowhere else in the corpus. Six plans, five
  with a machine-verified success signature and one honest `null`.
- **`content/shapes/kid-chain-arrangement.json`** — White c4/d5/e4 against Black
  d6/e5. Fires on exactly 14 nodes, the seven from `p15-d5` onward in each KID
  pack including both branch tips, and nowhere else. Six plans, four signed, two
  `null`. It is the reversed sibling `closed-centre-chain`'s provenance asked
  for.

The entries' hard facts are derived, not recalled. **c3, d4 and e3 are all dark
squares**, so the wedge stands on the colour its own bishop travels — and with
White pawns on b2 and e3, **a bishop on c1 has exactly one legal destination,
d2**, enumerated on two independent positions. The mirror holds for Black: in the
anti-London tabiya after ...e6, **the c8 bishop has exactly one destination,
d7**. Across all 14 London firing nodes, **White's b2 pawn has zero defenders**.
On the KID side, the two breaks are exact pawn-geometry mirrors: a White pawn on
c5 attacks d6, a Black pawn on f5 attacks e4 — each striking the pawn that holds
the other chain up. The KID entry's ...f5 signature fires at `p20-f5`, the last
spine node of both KID packs, so those packs now **end inside a named plan's
success condition** rather than beside one — the second instance of the "arrival
is a board fact" property after wave 4a's `iqp-white` handoff.

The standing finding held: no signature was invented that could not be expressed.
Three of the twelve plans ship `signature: null` with the reason stated.

All four commissioning packs were then wired (`shapes` reference plus
`shapePlan` on the matching plan classes) and their blockers rewritten to record
what the reference does and does not clear. `pack-check` green on all four.

**The wiring refuted an authored claim.** `anti-london-black`'s
`b2-counterattack` plan class said the bishop's departure from c1 "leaves b2
attended only by the queen". Counted with the repo's own `direct_attack_count` at
the pack's own deviation position (1.d4 Nf6 2.Nf3 d5 3.Bf4 c5 4.e3 Qb6): **zero**
White pieces bear on b2. The queen on d1 does not attack b2 on any line. With the
bishop still home the count is 1, and that one is the bishop. Corrected in place.

### 2. Scandinavian wave-4b — the deferral does not survive the data

Wave 4a deferred the Scandinavian on **depth-commensurability**: 56.3M games but
a 2-ply row, "not comparable to 5-ply roots". Re-examined against the real data,
that judgment was about the *pull*, not the opening. The CC0 catalogue carries 46
B01 rows up to 13 plies, and four fresh authenticated explorer pulls through the
repo's own emitter (`content/candidates/priority-wave4b`, `-deep`, `-bg4`,
`-sixth`; 1400/1600/1800, blitz+rapid, 2024-01..2026-07) measured the family at
tabiya depth for the first time:

| root | plies | games at band |
|---|---|---|
| 3...Qd8 Valencian | 6 | 7,841,794 |
| 3...Qa5 Main Line | 6 | 7,160,241 |
| 2...Nf6 3.d4 Modern | 5 | 1,670,518 |
| 3...Qd6 Gubinsky-Melts | 6 | 1,277,395 |

Three of the six families wave 2 and wave 4a actually authored sit **below** the
Scandinavian's 6-ply main branches: King's Indian 5,353,956 (4 plies), Dutch
4,845,395 (2 plies), London 3,851,145 (5 plies). **The correct outcome is
therefore authoring, not refusal**, and the recorded judgment is overturned by
its own instrument. The lesson generalises: a priority row's ply count is a
property of the lines TSV that was fed in, not of the opening, and must not be
read as evidence about drillability.

Two packs authored, both `pack-check` green:

- **`scandinavian-mainline-black`** — 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.d4 Nf6
  5.Nf3 Bg4 6.Be2 Nc6 7.O-O O-O-O 8.Be3, 16 spine nodes with three sibling
  branches, 10 deviations.
- **`anti-scandinavian-white`** — the same tabiya from the other chair, trunking
  into 6.h3 Bh5 7.g4 Bg6 8.Ne5, 22 spine nodes, with 6.Be2 kept as a full
  playable **consequence branch** rather than a footnote, 10 deviations.

The pair's thesis is the first content in this repo where **two independent
instruments agree on a band-specific recommendation**. Of the five White sixth
moves measured after 5...Bg4, only 6.h3 gives White a plus score at band (52.7%
against 43.6% in 71,349 games) and Stockfish at depth 22 ranks the same five in
nearly the same order with h3 first at +1.09 and Bc4 last at 0.00. The popular
6.Be2 scores 43.9% and evaluates +0.46; after 6...Nc6 7.O-O O-O-O White scores
**38.1%** in 41,554 games and every measured eighth move sits between -1.20 and
-1.70.

The packs also state where the instruments **disagree**, rather than hiding it:
the spine's 5...Bg4 is played by 53.7% at band and is the engine's fourth choice
of five, 0.34 behind 5...c6. That the popular move is the right thing to drill is
named in the Black pack's blockers as the pack's central ungrounded claim.

Every number in both packs was audited mechanically after encoding: all 59
distinct corpus-shaped numbers in the two packs' prose appear verbatim in the
four explorer artifacts, and every engine figure was checked against the
evaluation record.

### 3. Prose grounding — the residue G1 named and did not reach

G1 grounded moves and said so: prose, plan classes and deviation classes stayed
untouched, and `corpus_observed` claims were already clean. This pass took the
most checkable remaining kind — **attacker and defender counts, piece mobility
counts, legality, checkmate, and pawn geometry** — harvested 232 factual-shaped
statements from the opening packs, and mechanically checked 21 of them with the
repo's own `direct_attack_count`, `line_blockers` and chessops move generation.

**16 held. 5 were refuted and corrected in place; none was replaced by an
invented substitute.**

1. `anti-french-advance-white` — "after ...Qb6 the base has three attackers".
   Measured: **two** (the c5 pawn and the c6 knight) against three White
   defenders; the queen is a third only through Black's own c5 pawn.
2. `anti-dutch-leningrad-white` — "...f5 stopped guarding e4 and d5 forever".
   **Backwards.** A black pawn on f5 *guards* e4 and g4; what ...f5 gives up is
   the pawn guard on e6 and g6; no black f-pawn ever guarded d5.
3. `najdorf-english-attack-black` — "the c8 bishop has one square and the f8
   bishop has two", given as the reason for the move order. Measured at that
   position: **c8 has five (d7, e6, f5, g4, h3) and f8 has one (e7)** — exactly
   reversed. The stated reason was withdrawn, not rewritten.
4. `opening-principles-white` — "from h3 it touches two central squares instead
   of f3's four". Measured: **h3 touches none of d4/d5/e4/e5, f3 touches two**
   (d4 and e5).
5. `opening-principles-black` — "from c6 it would touch four central squares".
   Measured: **two**, d4 and e5. Same authored miscount as #4, in the sibling
   on-ramp pack — the only systematic error the pass found.

What held is worth recording too, because these are the claims a 1000-1400 pack
lives or dies on: all three `Qxf7#` claims in `opponent-intent-early-queen` are
real checkmates; the f7 attacker/defender counts (2 against 1) are exact; ...g6
does both block the h5-f7 diagonal and attack the queen; ...Nf6 does cut White's
second attacker on f7; 3.Nxe5 in `opening-principles-white` really is a
one-for-one trade by the counting rule the pack teaches; both `Ng5` deviations
really do hang the knight to `Qxg5` with zero defenders; the Damiano `Qh5+` is
check; f2-f3 really does open e1-h4; and the London `Ne5` fork geometry
reproduces exactly.

### What the machine refuted in my own drafting, before anything shipped

Seven drafted lines and two arithmetic claims died in the harness. Sixth
attestation of the standing lesson: **lines are derived, never recalled.**

- After 7...Nxd4 in the Scandinavian, `Bxg4` is **illegal** — White's own knight
  stands on f3.
- After 6.h3 Qh5, `Nxh5` is **not a knight move**.
- After 8.Ne5, `...Nxe5` is **not available to the f6 knight**.
- `6...Qxd4` is **not a queen move from a5**.
- In the London probe, `...cxd3` after `Bc2` (the bishop had already left d3),
  and Black's `d5-d4` (occupied by White's pawn) — both illegal.
- My deviation note said 4...Nc6 costs 0.74; the measured figure is **0.77**.
- My provenance said "47 candidate moves and 9 walked lines" and "14 decision
  positions, 57 candidate moves"; the actual counts are **50 / 4** and
  **13 / 58**. Both corrected.

### contract-gaps and frictions, sharpest first

1. **Shape plan success signatures are inert — nothing in the shipped system
   ever evaluates one.** Verified in source: `matchesStructuralExpression` is
   called on a shape's *trigger* in three places (`guidance.ts:38`,
   `shape-firing.ts:23`, `shape-validation.ts:55` and `:78`) and on
   `plans[].success.signature` **nowhere**. The signature is validated for
   well-formedness (`shape-validation.ts:52`) and rendered as an English sentence
   (`ShapePanel.svelte:39`); that is its entire life. The standing "75 of 103
   ship `signature: null`" finding therefore understates the situation: the
   non-null ones are equally unenforced. Either a consumer evaluates them or the
   field is documentation with a schema.
2. **A third shape-library orientation gap, found exactly like the first two.**
   The Scandinavian trunk reaches kings castled on opposite wings, but
   `opposite-castling-race` encodes only the White-long / Black-short
   orientation — its trigger matches none of either new pack's walked positions,
   and no other entry matches any of them. Adding a `mirrored` disjunct would be
   the wrong fix: the entry's plans are colour-owned and the mirroring law
   forbids re-pointing them. Both packs therefore ship with **no** shapes
   reference and commission the entry, following the wave-4a London precedent.
   Three commissions have now arrived by the same route; the library's gap shape
   is orientation, not subject matter.
3. **No repo command evaluates a draft pack, and none evaluates a shape entry
   against a corpus of positions.** Sixth attestation of G1's gap #2, now with a
   sibling. This wave rebuilt both harnesses from scratch — a walker, a firing
   census, a signature prober and an engine driver — none of which is repo
   surface. A `make shape-firing FILE=<entry> CORPUS=content/drafts` would have
   removed the single largest block of this wave's clock, and it is the exact
   instrument that proved the two commissioned gaps were real.
4. **`shape-check` drops a capability the library already ships.**
   `validateShapeEntry` accepts a `probeFen` and returns `probeMatches`, and the
   HTTP lint route exposes it — but `shape-check.ts` never passes it, so the CLI
   cannot answer "does this trigger fire on this position". One argument.
5. **The explorer priority lines input still lives outside `content/`** (wave-4a
   friction #1, second attestation). This wave again wrote scratchpad TSVs and
   used `--output-root`, which works, but means the four new artifacts' `job.json`
   records a scratchpad path as their input origin — provenance pointing at a
   directory that will not exist tomorrow.
6. **There is no evidenceType for "two independent instruments agree."** The
   Scandinavian pair's strongest claim is corpus and engine converging on 6.h3;
   it is encoded as `["corpus_observed","engine_validated"]`, which reads as two
   separate weaker claims rather than the one stronger one.
7. **A pack's own `guard` and its deviation classes remain unrelated** (G1 gap
   #4, second attestation): both new packs carry classes whose measured cost is
   far from what the class implies, named in their own blockers rather than
   quietly reclassified.

### What the pass may not do, and did not

`rfc/archive/content-sourcing-foundation.md:772` rules deviation classes
objective-relative, so **no class was reclassified on a number anywhere in this
wave**, including the five places in the new packs where the number plainly
disagrees with the class. Those disagreements are named in the packs' own
blockers and left visible in the files. Law 8 cuts both ways: the engine may not
manufacture the class any more than the LLM may. What was changed is only false
factual statements — counts, mobility, pawn geometry, defender arithmetic — and
one plan-class sentence whose arithmetic was simply wrong.

Not done, deliberately: no touch of `rfc/`, `design/`, `docs/`, `archive/`,
`apps/`, `packages/`, `schemas/`; no edit to `opposite-castling-race.json` (the
mirrored orientation is commissioned, not bolted on); no third shape entry
authored without a commission; no reclassifications; no replacement rationale
for the withdrawn Najdorf move-order reason; no commits.

## 2026-08-15 (claude) — the signature authoring pass

Owner ruling, this date: *"we need to fix this asap. fix all to include it
properly. **we are the authors**."* The target was
`plans[].success.signature` in `content/shapes/`, and the ruling's real content
was the second sentence: the null rate is not only a vocabulary ceiling, it is
half our own unwritten content.

```
agent-research 55 · agent-encoding 110 · agent-engine-validation 85 · review 0 · agent-revision 25 · agent-tooling-friction 70
```

### Re-measured first; the numbers in the commission were already stale

`design/research/authored-transitions-and-features.md` measured 103 plans across
23 entries, 75 null. The corpus had moved by the time this pass started:
**25 entries, 117 plans, 39 with a signature, 78 null (67%)** `[V]`. The
commission's `matchesStructuralExpression` line reference (`structure.ts:351`)
had also moved to `:417`, because `piece_count`, `king_zone` and
`piece_distance` landed the same day and the shape-entry schema went to 0.3.

### After

**96 of 117 plans carry a signature; 21 remain null.** 57 signatures authored:
48 of them required **restating the plan**, 9 did not.

| | before | after |
|---|---|---|
| plans with a signature | 39 (33%) | **96 (82%)** |
| plans with `signature: null` | 78 | **21** |
| entries with no signature at all | 3 | **0** |

### The three categories, and which one carried the pass

1. **Translation (9 plans).** The plan already named its own census and the old
   note was simply wrong about the vocabulary. The clearest case:
   `fianchetto-g7/white-trade-the-fianchetto-bishop` was null on "detection
   cannot tell a traded bishop from one that merely moved away" — but a bishop
   can never change shade, so `bishop_on_shade` decides exactly that, and
   `pieceOnSquare` was the wrong instrument rather than the vocabulary being
   short. Same shape at `london-wedge/black-challenge-the-outside-bishop`.
   `pawn-opposition-key-squares/black-hold-the-opposition` was null on "holding
   is an outcome" while `king_opposition` — a first-class predicate that reads
   the side to move — sat unused. `rook-4v3-same-side/black-trade-pawns-not-rooks`
   was null on "pawn-count progress is outside this vocabulary"; `piece_count`
   reaches it directly.
2. **Restatement (48 plans) — the owner's point, and the half we control.**
   Every one declares itself in its own note with the words `RESTATED PLAN.`,
   quotes the original success note verbatim, and states what the new census
   does *not* say. Nothing was silently rewritten. The recurring move is
   converting an unmeasurable claim into the checkable state it aims at:
   "hold the draw" → "the rook is on the sixth and White's king is not"
   (`philidor/black-third-rank-defence`); "squeeze on space" → "the bind stands
   and neither break has landed" (`maroczy-bind/white-space-squeeze`); "give the
   exchange back to win" → "no rooks, no Black minor, White a pawn up"
   (`up-an-exchange/white-return-the-exchange`). `rook-4v3-same-side` went 0/6
   to 6/6 this way and is referenced by two packs.
3. **Refusal (21 plans).** Left null with the reason stated. Fortresses,
   zugzwang, tempo ledgers, colour complexes, "was the trade worth it", race
   counting. **No signature was invented to clear a null.**

### Two null reasons were rewritten rather than cleared

`piece_distance` landed today and measures king-to-pawn distance exactly, which
retires the stated reason for `queen-vs-pawn-on-seventh/black-count-the-far-king`
("king distance is geometry outside this vocabulary") and half the reason for
`white-know-the-drawn-files`. Both stay null, with the honest reason substituted:
**the measurement now exists; the threshold that turns it into success does not.**
Writing "distance ≥ 4 means the defence holds" would be manufacturing a verdict
under a census label — ADR-0005 through the content door. This is the sharpest
contract note of the pass: a new predicate can retire a *reason* for a null
without retiring the null.

### Verification — what was actually run, and what it caught

Every signature was checked against the **shipped** `matchesStructuralExpression`
and `positionFromFen`, bundled unmodified with esbuild, never reimplemented.

- **114 witness assertions, 114 pass** `[V]`. Each authored signature has a
  success witness where it fires and a reference witness where it does not.
  Every witness is given as a legal FEN plus a SAN continuation, so the tested
  position is *legally reached* rather than hand-assembled.
- **Corpus firing census** over 668 positions from 37 packs, produced by
  replaying every spine node from each pack's `start.fen`.
- **Degenerate-position suite** — bare kings, kings plus one pawn, pawnless
  boards, off-shade bishops — run against every authored signature, after the
  `mate-two-bishops` defect (a condition vacuously true over an empty set).
- **Fan stress test** for the one enumerated signature, across all 18 squares
  in its domain, after the `knight-vs-bishop` `passed_pawn` defect (a well-formed
  12-arm fan that fired on 0 of 440 applicable positions).

Failures found *during* drafting, all fixed before landing:

- **4 signatures were vacuously true over empty piece sets** — the shipped
  `mate-two-bishops` defect, reproduced four times by this pass and caught by
  the suite written because of it. `knight-vs-bishop/black-fix-one-wing` said
  "every pawn is on one side" and fired on a board with no pawns;
  `rook-4v3-same-side/black-trade-pawns-not-rooks` counted trading the *last*
  pawn as success; `carlsbad/black-piece-trades` was satisfied by the c-pawn
  being **captured**, since `not(backward_pawn c)` is true when there is no
  c-pawn; `up-an-exchange/white-activate-before-cashing` fired on a pawnless
  board where every file is open for free. All four now carry an explicit
  existence clause and say so in their notes.
- **`closed-centre-chain/white-hold-the-base` was too loose twice.** First draft
  used fixed thresholds and fired on 52 of 77 in-shape positions, including
  roots where nothing was attacking d4. Adding "Black must actually be bearing
  on it" was still an approximation. It was then rewritten to express the plan's
  real claim — *defenders at least equal to attackers* — by case-splitting
  `direct_attack_count` over the attainable range. **The vocabulary has no
  operator comparing two counts, but the comparison is expressible by
  enumeration.** That is a contract finding, not a workaround.
- **5 witness lines were illegal chess** and the harness refused them: a king
  walking onto a square the enemy bishop covered, an ambiguous `Rxd1` with two
  rooks able to reach d1, a pinned pawn push, a king stepping onto a square a
  pawn attacked, and a "trade pawns" line that traded *White's* pawn.
- One signature hit **`STRUCTURAL_EXPRESSION_TOO_DEEP`** when a guard clause was
  wrapped around an existing four-level expression; fixed by pushing the guard
  into each arm instead of around the whole.

### The knight-vs-bishop fan, and why 0 firings is not the same defect twice

`knight-vs-bishop/black-anchor-the-knight` is an 18-arm enumeration of every
square where a Black knight can stand on a strict outpost. It fires on **0 of
the 346 corpus positions containing a black knight** — numerically the same
picture as the shipped defect. It is not the same thing, and the difference was
measured rather than asserted: across all 18 squares and both defending-pawn
configurations, **36 of 36 anchored positions fire true, 36 of 36
pawn-evictable positions fire false, and 36 of 36 undefended-knight positions
fire false**, with all 36 anchored positions also satisfying the entry's own
trigger `[V]`. The expression discriminates correctly; the corpus simply
contains no black knight on a strict outpost. **"Fires nowhere" is only a defect
when the expression is unsatisfiable, and that is a different measurement from
counting corpus hits** — which is exactly the check the shipped defect never got.

### 9 of 25 entries are referenced by no pack, and it bears on the number

`doubled-c-pawns`, `hanging-pawns`, `iqp-black`, `knight-vs-bishop`,
`maroczy-bind`, `open-centre`, `queenless-middlegame`, `up-an-exchange`,
`vancura`. **22 of the 57 signatures authored (39%) landed in entries no pack
references**, against 35 in entries authors actually use. Eight of those nine
orphans also have triggers that fire on **zero** corpus positions, so their
signatures could be verified only against constructed witnesses — legal and
legally reached, but not drawn from authored content. The 82% coverage headline
should be read with that split beside it: on used entries alone the pass moved
coverage from 39/74 to 74/74 minus the refusals, and the orphan half is
insurance against packs that do not exist yet.

A separate finding worth a row: **`opposite-castling-race` is referenced by two
packs and its trigger fires on 0 of 668 corpus positions.** A referenced entry
that never matches the referencing packs' own positions is a different failure
from an orphan, and it is not one this pass was commissioned to fix.

### Contract harvest

1. **Two counts can be compared by enumeration.** `direct_attack_count` has no
   relational form, but case-splitting over the attainable range expresses
   "defenders ≥ attackers" exactly. Applies wherever the shipped vocabulary
   offers a count but no comparison.
2. **`quantified` over a square region with the `piece` template is the king-geometry
   primitive**, and it was already shipped. "King on the sixth rank or beyond",
   "king on the passed pawn's file", "king sheltering beside its pawn" are all
   region tests. Eleven of this pass's signatures are king geometry that three
   separate null notes had declared outside the vocabulary.
3. **A new predicate can retire a null's stated *reason* without retiring the
   null.** See `piece_distance` above. The gap list should record reasons, not
   just nulls, or it will overstate what new predicates buy.
4. **`piece_count` retires the `piece_reach_count atLeast 0` existence idiom.**
   Every new signature uses `piece_count`; the 43 shipped uses of the old hack
   are now legacy. `pawn_count` is deprecated in the validator and none of this
   pass's work uses it.
5. **Success signatures are read at the end of a run, when the entry's own
   trigger may no longer hold.** `lucena/white-run-out-the-checks` is true when
   a queen exists, which the Lucena trigger forbids — correct, because the pawn
   promoted. Nothing in the schema states this evaluation order, and several
   signatures only make sense under it.

### Tooling friction — 70 of 345 minutes (20%)

1. **No "where does this expression fire" instrument, seventh attestation.**
   The single largest block of the clock. This pass again rebuilt a corpus
   walker, a firing census and an expression prober from scratch in a
   scratchpad. `make shape-firing FILE=<entry> CORPUS=content/drafts` remains
   the highest-value missing target, and it is what caught both loose
   signatures and all four vacuous ones.
2. **No legality feedback while writing witnesses.** Five illegal SAN lines were
   found only by running them. A `make fen FROM=<fen> SANS=...` would have
   removed the whole revision block.
3. **`shape-check` takes one file per invocation** and re-bundles with esbuild
   each time, so validating 25 entries means 25 bundles. A glob would help;
   `shape-check` still never passes the `probeFen` the library already accepts
   (fourth attestation).
4. **No degenerate-case harness in the repo.** The empty-set suite that caught
   four vacuous signatures is scratchpad code. Given that `mate-two-bishops`
   shipped exactly this bug, it belongs in `shape-check`.

### Not done, deliberately

No touch of `rfc/`, `design/`, `docs/`, `archive/`, `apps/`, `packages/`,
`schemas/`. No entry `version` field was changed — the edits are material and a
bump is defensible, but versions are pinned by a runtime test outside this
pass's boundary, so the decision is left to whoever owns that pin. No signature
invented to clear a null. No commits.

**Correction, same entry, same date.** Two numbers above were written from a
hand count and are wrong; the recomputed values are `[V]`. The used/orphan split
sentence in *"9 of 25 entries are referenced by no pack"* should read: on the 16
entries a pack actually references, coverage moved **23/73 → 58/73**; on the 9
orphan entries it moved **16/44 → 38/44**. And "eleven of this pass's signatures
are king geometry" undercounts — **15 of the 57 authored signatures test a king's
square or region**. The claims the two numbers support are unchanged: the orphan
half is a large minority of the work, and king geometry was the single biggest
category of null notes that turned out to be wrong about the shipped vocabulary.
Corrected by appending rather than editing, per the append-only law.

## 2026-08-15 — Content fix wave: the expression-census triage worked through (claude)

agent-research 55 · agent-encoding 60 · agent-engine-validation 50 · review 0 ·
agent-revision 15 · agent-tooling-friction 15 · **total 195**, friction **7.7%**

Scope: the five items in `planning/expression-census-triage.md` §7, plus two
degenerate-case defects of the same class found while verifying them. Only
`content/` and this log were touched. No commits. Instruments: the shipped
`make expression-census` (driven with `{ expression }` in a loop for per-arm
decomposition, i.e. the same `EXPR=` path the Makefile exposes),
`make shape-check`, `make pack-check`. `matchesStructuralExpression` is the only
oracle anywhere below; **no walker was rebuilt** — the first wave in eight that
did not have to. No engine and no tablebase was consulted, so
`agent-engine-validation` above is evaluator validation, not engine evidence.

**Baseline reproduced exactly before any edit** (43 packs / 694 positions /
159 subjects / 36 `neverFiresInCorpus` / 30 `firesOnlyOutsideShape` / 0
`unsatisfiable` / 35 `satisfiabilityUnknown`), so every before/after number
below is a diff against the triage's own figures `[V]`.

### 1. D75 — `rook-4v3-same-side`'s trigger, fixed as a trigger

Measured first: the trigger fired 41 times with no pawn constraint of any kind,
splitting **17 positions with 0 black pawns and 1 white pawn** (the spines of
`philidor-passive-rook-convert` 3 and `philidor-third-rank-hold` 14) from **24
with 3 black and 4 white** (`rook-4v3-same-side-hold`) `[V]`. Reproduces the
triage to the unit.

Added two clauses to the trigger: Black has at least one pawn, and White's pawn
count exceeds Black's by at least one. **`difference` semantics were verified
rather than assumed** — `piece_count(white, pawn, difference, atLeast 1)` fires
on the census's `king_and_one_white_pawn` degenerate board and not on
`king_and_one_black_pawn`, so it is white-minus-black `[V]`.

| Subject | Before | After |
|---|---|---|
| `/trigger` | 41/694, in-shape 41/41, fires on `rooks_only` | **24/694, 24/24, fires on no degenerate board** |
| `black-king-first` | 10/41 in-shape | 9/24 |
| `black-trade-pawns-not-rooks` | 0/41 | 0/24, now with a witness |
| `black-sixth-rank-restraint` | 7/41 | **0/24 + `FIRES_ONLY_OUTSIDE_SHAPE`** |
| `black-active-second-rank` | 7/41 | 7/24 |
| `white-king-up-pawns-forward` | 11/41 | 6/24 |
| `white-offer-rook-trades` | 0/41 | 0/24 |

The informative row is `black-sixth-rank-restraint`: all seven of its in-shape
hits were Philidor positions. A plan about restraining the stronger king in a
4v3 was scoring only on the pawnless-for-Black family the loose trigger let in.
That is the loose trigger's cost stated as a number, and it was invisible while
the denominator was 41.

**A claim of my own the machine refuted.** My first instinct was that the id
`rook-4v3-same-side` implied an exact `4 v 3` count constraint. Measured
against the corpus, **four candidate constraints — black ≥1; both sides ≥1;
both ≥1 plus a white pawn-difference ≥1; and exactly 4v3 — admit precisely the
same 24 positions, exclude precisely the same 17, and kill the `rooks_only`
degenerate firing in all four cases** `[V]`. The corpus cannot discriminate
between them at all, so the choice could not be made on evidence and had to be
made on the entry's own authored text: its name says "**4v3 family**" and its
declaring pack's objective says "rook and three against rook and four", while
its plans describe trading pawns down. The family reading was chosen for that
reason and the reason is recorded, not the number. The `watch` line "This fires
for the family; count the pawns yourself" — written to excuse the missing
constraint — was replaced with what the trigger now guarantees.

### 2. D76 — `fianchetto-g7`'s mirrored arm: the triage's premise is refuted

The triage calls arm 1 "an arm from the wrong side of the board … inside a
**g7-specific** entry". **The entry is not g7-specific.** Its own trigger is
`any[ all[pawn g6, bishop g7], mirrored(files, all[pawn g6, bishop g7]) ]` —
the file mirror is already at entry level, admitting a b6/b7 queenside
fianchetto `[V]`. All three non-null plan signatures carry the same mirror, and
`white-trade-the-fianchetto-bishop`'s authored note states the intent outright:
*"The mirrored arm covers the queenside fianchetto the trigger also admits,
where the bishop is the light-squared one."* A signature that did not mirror
could never be satisfied on a position the trigger admits.

**Decision: the mirror belongs and was kept.** What was corrected is the entry
`name`, which read "Kingside fianchetto (Black g7 bishop)" and is what makes
every reader — the triage, and me before measuring — treat the mirror as a
stray. It now names both wings. Measured: trigger 44/694, **all 44 through the
unmirrored arm, 0 through the mirror** `[V]`; the mirror's zero is a coverage
fact about the corpus, and a witness now proves the arm is satisfiable.

**Is the diagonal condition right? Measured segment by segment over the 44
in-shape positions:** `Bg7` fires 44/44; `Bg7 ∧ clear g7–f6` 44/44 (vacuous —
`between()` is endpoint-exclusive and adjacent squares have no interior);
`∧ clear g7–e5` 7/44; `∧ clear g7–d4` **0/44**, and every longer segment 0
`[V]`. **The blocker is d4** — one of the central pawns the plan's own prose
asks to be traded or levered away. The strict a1 endpoint additionally demands
c3 and b2, which the prose does not name, but it costs nothing measurable here:
0/44 either way. The condition was left alone and the measurement written into
the plan's note. A sweep of every `line_blockers` use in `content/` found this
is the only one, so no other expression carries the adjacent-square vacuity.

### 3. `iqp-black` and `maroczy-bind` — decomposed, then witnessed

Neither is broken; both are uncovered, and the decomposition says exactly where.

- **`iqp-black`**: conjuncts fire 219 (`d5` black pawn), **1** (isolated black
  d-pawn), 45 (d-file half-open for White) `[V]`. The killer is the isolated
  d-pawn at 1 of 694 — one position of `carlsbad-minority-attack` — and it never
  co-occurs with the half-open file (`isolated ∧ half-open = 0`).
- **`maroczy-bind`**: conjuncts fire 58 (`c4`), 150 (`e4`), 45, 53 `[V]`. `c4`
  never co-occurs with either half-open file: `c4 ∧ white half-open d = 0` and
  `c4 ∧ black half-open c = 0`, because the 58 `c4` positions are all KID and
  Leningrad spines where White keeps a d-pawn and Black a c-pawn.

The detector family does match content (`carlsbad` 41, `iqp-white` 4 on the same
corpus), so **this is a coverage fact about what has been authored, not evidence
against the detector**, and no such claim is made here. Both triggers now carry
a positive and a negative witness, so both are `satisfiable / basis: witness`
instead of `unknown`.

### 4. The eight c1 witnesses — 26 witnesses, 12 keys, all correct first try

Written to **`content/witnesses/expression-witnesses.json`**, following the
`knight-vs-bishop` template exactly: a legal `from` FEN, one SAN that makes the
placement, a `reference` control that is the same board with the piece
elsewhere. Every witness behaves as declared on the first run — **26/26 with
`actual === expect`, zero `WITNESS_LINE_ILLEGAL`** `[V]`.

`satisfiabilityUnknown` **35 → 24** `[V]`, better than the triage's predicted
27, because three subjects beyond the eight were cheap once the file existed:
the two §3 triggers and `rook-4v3-same-side/black-trade-pawns-not-rooks`. That
last one matters for item 1: the `[1,2]` black-pawn interval **is** reachable in
the corrected family (`hxg5` from a 4v3 leaves 4v2), so its 0/24 is now an
honest coverage fact about a 24-position spine instead of an artefact of a
trigger that admitted pawnless positions. Its third witness is a `degenerate`
control on a pawnless rooks-only board, re-testing the existence clause the
entry's note says was added after an earlier draft was vacuously true.

**These eight remain coverage facts, not authoring errors, and nothing was
"fixed" into something else.** Each expression still says what its prose says,
arm for arm; the witnesses change what is *known* about them, not what they
claim.

**Handoff, and the one thing this wave could not finish:** the census's default
witness path is `apps/server/src/fixtures/expression-witnesses.json`, inside
Codex's boundary. `make expression-census WITNESSES=content/witnesses/expression-witnesses.json`
gives 24; plain `make expression-census` still gives 35 `[V]`. The content file
is a strict superset of the fixture (the `knight-vs-bishop` key is copied
verbatim), so the change needed is one line — repoint the default at
`content/witnesses/` and delete the fixture. Witnesses are authored content and
belong beside the content, not in a server fixtures directory.

### 5. D44 — nine orphan entries, decided per entry

Two had machine evidence and were wired in; the other seven have none and were
recorded in place.

| Entry | Trigger firings | Decision |
|---|---:|---|
| `open-centre` | 1/694, all in `trajectory-qgd-exchange-minority` | **wired** into that pack (`present`) |
| `queenless-middlegame` | 7/694, all in `trajectory-caro-advance-chain-bishops` | **wired** into that pack (`present`) |
| `doubled-c-pawns`, `hanging-pawns`, `iqp-black`, `knight-vs-bishop`, `maroczy-bind`, `up-an-exchange`, `vancura` | 0/694 each | **stand alone**, reason recorded in each entry's `provenance.sources` |

Both wirings pass `pack-check`, which means `SHAPE_REFERENCE_NEVER_PRESENT`
does not fire — the validator confirms each trigger actually matches its new
host's authored spine `[V]`. **No `prospective` reference was invented for any
of the seven zero-firing orphans**: a prospective claim is a claim that the
structure may arise later, which is chess judgment with no measurement behind
it, and law 8 forbids manufacturing it. Five of the seven already carried a
trigger-narrowing or trigger-gap note explaining what they deliberately do not
cover; the new `D44 orphan status` line states the measurement (no referencing
pack, 0 of 694, signatures verified only against constructed witnesses) so the
next reader does not have to re-derive it.

### 6. Two degenerate-case defects found while verifying — same class as D75

The triage's §6 named three triggers firing on degenerate boards and observed
that "nobody has looked yet". D75's fix removed one (`rook-4v3-same-side` on
`rooks_only`) as a side effect. The other two are the same missing-existence-clause
bug and were fixed the same way, with a clause requiring at least one pawn on
the board:

| Entry | Corpus firings | Degenerate firings |
|---|---|---|
| `open-centre` | 1 → **1** (unchanged) | `[queens_only]` → **`[]`** |
| `pawn-opposition-key-squares` | 33 → **33** (unchanged) | `[bare_kings, king_and_one_white_pawn, king_and_one_black_pawn]` → **`[king_and_one_white_pawn, king_and_one_black_pawn]`** |

`open-centre` fired on two kings and two queens because `open_file` reads true
on any file with no pawns on it — a board with no pawns has an "open centre" on
every file. `pawn-opposition-key-squares` is a pure "nothing heavier than a
pawn" census and fired on bare kings, in an entry about pawn opposition. Both
keep the boards that are genuine family members: K+P vs K is the canonical
opposition ending and still fires. Corpus-firing counts are unchanged for both,
which is what makes these safe corrections rather than re-authoring.
`FIRES_ON_DEGENERATE` across the census: **45 → 43 subjects** `[V]`.

### Verification run at the end of the wave

- All **25** shape entries pass `shape-check` against `content/drafts`, exit 0.
- All **43** packs pass `pack-check`, exit 0.
- `make expression-census` exits 0 under both witness paths; **0 unsatisfiable**,
  as before.
- The full repo suite — **98 files / 608 tests** — passes with the edits in
  place, including `packages/runtime/src/shape-firing.test.ts`, which reads
  `rook-4v3-same-side` directly. The 2026-08-14 entry's caution that entry
  `version` fields are "pinned by a runtime test outside this pass's boundary"
  does **not** hold: nothing pins them, and every entry edited here had its
  patch version bumped `[V]`.

### Census diff, whole wave

| Total | Before | After |
|---|---:|---:|
| subjects | 159 | 159 |
| `neverFiresInCorpus` | 36 | 36 |
| `firesOnlyOutsideShape` | 30 | **31** |
| `inShapeDenominatorEmpty` | 40 | 40 |
| `unsatisfiable` | **0** | **0** |
| `satisfiabilityUnknown` | 35 | **24** |
| `FIRES_ON_DEGENERATE` subjects | 45 | **43** |

`firesOnlyOutsideShape` rising by one is the `black-sixth-rank-restraint` row
above — the number went up because the denominator got honest, which is the
intended direction.

### Contract harvest

1. **A shape entry has nowhere to record why its trigger says what it says.**
   The schema is `additionalProperties: false`, so a `triggerNote` sibling to
   `trigger` is rejected — I tried it and `shape-check` failed with
   `SCHEMA_ADDITIONALPROPERTIES`. Every plan gets a `success.note` for exactly
   this purpose and the trigger, the most consequential expression in the
   entry, gets none. The rationale for D75's fix had to go into `watch` (player
   text) and this log. **`trigger.note`, or a `triggerNote` string, is the
   cheapest schema addition this wave found.**
2. **`provenance.sources` is being used as the entry's notes field**, by three
   prior waves and now by nine of my edits ("Trigger narrowing:", "Trigger
   gap:", "Tablebase honesty:", "UNGROUNDED:", and now "D44 orphan status:").
   It is validated only as "non-empty for published packs". Either name the
   convention or give entries a `notes` array; right now provenance and
   authoring commentary are the same field.
3. **The witness fixture lives in `apps/`, and witnesses are content.** See the
   §4 handoff. A content agent cannot lower `satisfiabilityUnknown` on the
   default code path without writing outside `content/`.
4. **`between()` being endpoint-exclusive makes adjacent-square `line_blockers`
   vacuously true**, and nothing warns. `line_blockers g7→f6 = 0` fires on
   44/44 in-shape positions and on all seven degenerate boards. Only one
   `line_blockers` use exists in `content/` today and it is not adjacent, but a
   lint for `from`/`to` adjacency is a two-line check.
5. **The degenerate suite catches missing existence clauses, and it caught
   three in this wave** (one via D75, two directly). The seven boards in
   `DEGENERATE_POSITIONS` are doing more work per line than anything else in
   the instrument.

### Tooling friction — 15 of 195 minutes (7.7%)

**The seventh-attestation item was built and the number moved.** Friction was
70/345 (20%) in the signature-authoring pass and 40/310 (12.9%) in wave 4b;
`make expression-census` shipping is why this wave is at 7.7%. No corpus
walker, no firing census and no expression prober was written this session —
the first time that is true in eight passes. What remains:

1. **The census cannot probe an arbitrary FEN.** `shape-check` takes `PROBE=`
   but only against a whole entry; the census takes `EXPR=` but only against the
   corpus. Verifying "does this expression hold on *this* board" meant writing
   witnesses and running the full census to read the answer back. `make
   expression-census EXPR=… FEN=…` would close it.
2. **`shape-check` re-bundles with esbuild on every invocation** (fourth
   attestation), so checking 25 entries is 25 bundles. Calling
   `apps/server/dist/shape-check.js` directly in a loop is the workaround
   everyone is using; the target should take a glob.
3. **`pack-check` on a glob reports every `*.sources.json`, `*.job.json` and
   `*.evidence.json` sidecar as a failed pack.** The census already filters
   those by name; `pack-check` should skip them rather than exit non-zero on
   files that are not packs.

### Not done, deliberately

- **The 30 `FIRES_ONLY_OUTSIDE_SHAPE` subjects** (triage §4). Documented as
  correct-by-construction under the run-end evaluation order; a watch list, not
  a fix list. Re-diff after the next wave.
- **D43's `knight-vs-bishop` passed-pawn fan.** Reported as coverage by the
  instrument, unchanged here.
- **No `prospective` shape reference invented** for any zero-firing orphan.
- **No chess claim graded, created, or corrected on strategic grounds.** Every
  correction above is either a measurement, a mismatch between an expression and
  the entry's own authored text, or a degenerate-board vacuity.

## 2026-08-15 — Middlegame wave: ten structure packs, and the tempo layer's first use (claude)

lead-agent 155 min (orientation 25 · instruments 25 · exemplar pack 35 · engine
pass 5 · review and verification 35 · ledger and log 30) · three authoring
agents in parallel, 19.5 + 22.5 + 22.8 min wall · **friction ≈ 14%**
(lead 23 of 155; agents self-reported 15% / 10% / 11%). Compare wave F at 7.7%:
that wave rebuilt no walker, this one built four disposable instruments and
**three agents each rebuilt the same one** (D113). No commits. Files touched:
ten new packs in `content/drafts/`, three `content/shapes/` provenance
corrections, `design/BACKLOG.md`, this log.

### What landed — nine of the ten families in `design/04` §3

Every middle act in the corpus was `carlsbad-minority-attack`. It is now one of
eleven. Each pack is `mode: plan`, `phase: middlegame`, references exactly the
shape entry whose trigger fires on its own spine, and passes `make pack-check`
with exit 0.

| Pack | Structure / shape entry | Learner | Start-position games at the band | Window |
|---|---|---|---:|---|
| `maroczy-bind-white-squeeze` | Maroczy bind / `maroczy-bind` | White | 5069 | ✅ |
| `iqp-white-panov-attack` | White isolani / `iqp-white` | White | 795 | ✅ |
| `iqp-black-tarrasch-defence` | Black isolani / `iqp-black` | Black | 817 | — |
| `open-centre-ruy-exchange` | Open centre / `open-centre` | Black | 2634 | — |
| `french-advance-chain-white` | Pawn chain / `closed-centre-chain` | White | 7158 | — |
| `kid-mar-del-plata-white` | KID chain / `kid-chain-arrangement` | White | 10987 | ✅ |
| `nimzo-doubled-c-pawns` | Doubled c-pawns / `doubled-c-pawns` | White | 742 | — |
| `dragon-yugoslav-race` | Opposite castling / `opposite-castling-race` | Black | 8476 | ✅ |
| `grunfeld-exchange-fianchetto` | Fianchetto / `fianchetto-g7` | Black | 730 | — |
| `berlin-queenless-press` | Queenless / `queenless-middlegame` | White | 6011 | — |

Both chairs are represented (six White, four Black), and the isolani ships from
**both sides of the same structure**. All ten start-position counts were
re-queried at review and **all ten reproduce exactly** `[V]`.

**The band is stated, not assumed:** Lichess explorer, `ratings=1400,1600,1800`,
`speeds=rapid,classical`, `since=2023-01`, `until=2025-12`, authenticated with
the operator token. Shares are recomputed from `white+draws+black` because the
response carries no trustworthy total. **This is not the band the opening wave
used** (blitz+rapid, 2024-01..2026-07) — ledgered as D116, because nothing in a
pack records its population in a machine-readable field.

### The tempo layer stopped being shipped-and-unused

`timingWindows` was used by **0 of 20 opening packs** and 0 of everything else.
Four of these ten declare one, and each was **replayed through the shipped
evaluator** (`packages/runtime/src/tempo.ts` `windowStates`) rather than assumed:

| Pack | Readiness | Closes on | Verdict on the authored spine |
|---|---|---|---|
| `maroczy-bind-white-squeeze` | rook→c1, pawn→b3 | ...b5 arrival · c4-c5 release · deadline 4 | `in_time`, spend 0/1, closed by deadline |
| `iqp-white-panov-attack` | rook→e1, bishop→e4 | ...Ne7 arrival · d4-d5 release · deadline 4 | `in_time`, spend 0/1, closed by arrival |
| `kid-mar-del-plata-white` | knight→d3, pawn→f3 | ...f4 arrival · c4-c5 release · deadline 6 | `in_time`, spend 0/1, closed by arrival |
| `dragon-yugoslav-race` | rook→c8, knight→e5, rook→c5 | h4-h5 arrival · ...Rxc3 release · deadline 4 | `in_time`, spend 0/1, closed by deadline |

`dragon-yugoslav-race` also drove the evaluator over two off-spine paths and got
`too_slow` (2 of 3 readiness) and `in_time` at exactly budget, so the window
discriminates rather than always passing `[V]`.

**Every arrival is a measured frequency, not a feeling.** KID: after Nd3, ...f5
lands in 769/783 (98.2%) and ...f4 four plies later in 633/639 (99.1%). Dragon:
h4-h5 is the most-played move at 172/439 (39.2%) in the branch where the window
can close. Maroczy: the tolerated Qd2 is the most-played move at the root
(1161/5069). Panov: the arrival ...Ne7 is 12/29 (41.4%) at its node.

**Six packs declare no window, and the reason is measured in every case** — this
is the more useful half of the finding:

- `french-advance-chain-white`: ...f6, the head lever, appears in **0 of 3769**
  games at the node after 10.Na4 and at most 3 of 164 later. A window against a
  lever that never arrives is a feeling with a number pasted on it.
- `grunfeld-exchange-fianchetto`: the opposite failure — White's two central
  levers are the *two most-played moves* (35.7% and 28.7%), so any readiness set
  bigger than one move reports `too_slow` on the corpus's own main line. A lever
  with no room in front of it.
- `berlin-queenless-press`: Black's pawn skeleton is `a7 b7 c6 c7 f7 g7 h7` at
  **all 11** authored positions — nothing arrives; and both of the entry's Black
  plans carry a `null` success signature, so the library itself declines to name
  the moment counterplay appears.
- `iqp-black-tarrasch-defence`: the blockading knight is already on d4 at ply 0,
  and d4 is occupied in all nine authored positions, so ...d5-d4 is illegal
  throughout — there is no arrival to race.
- `open-centre-ruy-exchange`: the only candidate race ends in a forced recapture
  (Rxd1, 269 of 269).
- `nimzo-doubled-c-pawns`: neither side's candidate move is dominant enough to
  grade against (...c5 21.6%/31.0%; e3-e4 9.3%/15.2%).

### Census delta — `WITNESSES=content/witnesses/expression-witnesses.json` both times

| | Before | After |
|---|---:|---:|
| packs / positions / transitions | 43 / 694 / 651 | **53 / 791 / 738** |
| subjects | 159 | **184** (25 new expression sites) |
| `neverFiresInCorpus` | 36 | **30** |
| `inShapeDenominatorEmpty` | 40 | **19** |
| `firesOnlyOutsideShape` | 31 | **40** |
| `satisfiabilityUnknown` | 24 | **23** |
| `unsatisfiable` | 0 | **0** |

**13 subjects left `neverFiresInCorpus`** — the three D44 orphans this wave
adopted (`maroczy-bind` trigger 0→10, `doubled-c-pawns` 0→8, `iqp-black` 0→7),
`opposite-castling-race`'s trigger (0→12, an unlisted orphan in effect), and
seven plan signatures that had never been exhibited by any authored position.
`inShapeDenominatorEmpty` halving is the same fact from the other side: a plan
signature can only be measured *inside its shape* once some pack makes the
trigger fire.

**`firesOnlyOutsideShape` rising by 9 is the intended direction**, exactly as in
wave F: ten plan signatures now have a real denominator and fire only outside it.
The sharpest instance is a content finding, not a defect —
`opposite-castling-race`'s three storm signatures fire 0 times inside the shape
across the Dragon pack's 12 positions, i.e. **eight plies of the corpus's own
most-played moves open no file at either king.**

Three shape entries carried a `D44 orphan status` line asserting zero references
and zero firings. Those statements are now false, so each entry got a dated
supersession line (original text kept, per the log's own rules) and a patch
version bump. All 25 entries pass `shape-check`.

### The measured gap: hanging pawns has no tabiya at this band

Nine of ten `04` §3 families shipped. The tenth was skipped **on evidence**:
along the standard QGD Tartakower route the pre-break node has **39 games** and
the first position where `hanging-pawns`'s trigger can fire has **14** — under
the 100-game floor the repo's own explorer client uses to abstain. The trigger
requires White to have neither a c- nor a d-pawn and Black neither a b- nor an
e-pawn, which is four exchanges deep; the band's data is exhausted before the
structure exists. Ledgered as D117: *not authored* and *not reachable at this
band* currently look identical in the content map.

### What could not be grounded — the wave's most valuable output

Aggregated across four authors. Each line is a sentence someone wanted to write
and deleted, with the instrument that would settle it.

**Needs an engine pass** (Stockfish is installed; only `maroczy-bind-white-squeeze`
got one this wave): is this recapture better than that one · does 12.e5 concede
what it restrains · is the symmetric isolani after ...Nxd4 exd4 balanced · does
11.g4 weaken White's king (the vocabulary has `king_zone` but no king-safety
feature) · what does c4-c5 actually cost (four packs record
`cost: unmeasurable` purely for want of this) · is Ne1 or b4 the better KID move
order at 2795 vs 2557 games.

**Needs a corpus instrument the explorer cannot be** — anything conditioned on a
later event, because the explorer aggregates per position: does the Rc8/Ne5/Rc5
arrangement actually precede ...Rxc3 · does completing an arrangement before a
lever arrives correlate with results (this is the evidence *every* timing window
in the wave lacks, and it is why the budgets and deadlines are authored numbers) ·
does White's queenside break arrive before Black's storm in the Mar del Plata ·
is ...f6 the standard answer to the French chain that these players simply do not
play (0 of 3769 is one line at one band).

**Needs a citable source** — the four premises the packs are built on and admit
they cannot support: the isolani buys activity now and becomes a weakness later ·
the bishop pair compensates for doubled c-pawns · walking the king in is *the*
plan in the Berlin structure · restraint-before-the-lever is how a bind is held.

**Needs an owner ruling, and it is the cheap one:** the explorer returns a
white/draw/black split on every row the wave already fetched. All four authors
refused to use it, reading a win rate as a graded move assessment under law 8.
If result splits are admissible `corpus_observed` evidence, roughly half of the
first list becomes partially groundable at **zero additional cost**. Ledgered as
D118.

**One claim was refuted rather than merely ungrounded:** the brief handed the
Grünfeld agent "White has doubled c-pawns here". White has a single c-pawn on c3
after `bxc3` and none after `cxd4`; the agent verified it from the skeleton and
against the `doubled-c-pawns` trigger (0 of 7 positions) and recorded the
negative in the pack rather than the claim.

### Verification actually performed

- `make pack-check` on all ten packs: **10/10 exit 0**, no errors, no warnings.
- All ten start-position explorer counts re-queried at review: **10/10 exact**.
- Four timing windows replayed through the shipped `windowStates`: **4/4
  `in_time`, spend 0**, plus two deliberately failing paths on the Dragon pack.
- `shape-check` on all 25 shape entries after the provenance corrections: 25/25.
- `make expression-census` before and after with the explicit content witness
  file (D102's flagged path), 0 `unsatisfiable` both times.
- One engine pass: `make engine-walk` over the Maroczy pack, 21 queries at depth
  22, no abstentions; its five deviation costs are candidate-relative losses
  against the best evaluated candidate and are recorded as lower bounds.
- Targeted test run: `expression-census`, `pack-authoring`, `shape-validation`,
  `shape-firing` — **55 pass, 1 fails**, and the failure is D114: a test that
  pins a census snapshot as a content fact. Not edited, deliberately.

### Contract harvest

1. **`shape-check PROBE=` answers nothing** (D113). Three authors, three
   identical disposable evaluators, one missing print statement. This is the
   single highest-value fix before the next content wave.
2. **A test pins content facts and blocks `make verify`** (D114, same class as
   D47). Authoring correct content turned the gate red; the wave refused to edit
   the test to match its own output.
3. **`timingWindows[].note` caps at 400 characters** (D115) while every other
   prose field is unbounded — so the rationale for an authored threshold ends up
   in provenance, where the runtime cannot show it.
4. **Two explorer populations, both in prose** (D116). No pack can state its band
   in a field, so no two packs' numbers are comparable by machine.
5. **The library can author a signature the pack layer refuses to grade on**
   (D119): `queenless-middlegame/white-king-into-the-game` is placement-only and
   hits `STRUCTURAL_CONDITION_HAS_NO_FEATURE`. `shape-check` accepts the entry,
   `pack-check` refuses the pack that copies it.
6. **"Most-played" and "the shape keeps firing" are rival authoring rules**
   (friction row added to the ledger). The French chain dissolves within three
   plies of the most-played walk; the Grünfeld's most-played reply ends the race;
   the Maroczy survives intact. No instrument sees the conflict.
7. **Two hard lints are invisible from the template**: a plan whose
   `success.signature` is `null` can never back a success condition
   (`PLAN_CONSEQUENCE_NOT_COMPUTABLE`), and the signature must fire on an
   authored spine FEN (`PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT`). Both were
   found by reading `pack-validation.ts` before writing, not from any document.

### Not done, deliberately

- **No engine pass on nine of the ten packs.** One was run end to end to prove
  the path and to price it (80 seconds, 21 queries); the other nine record
  `cost: unmeasurable` where an engine would have measured, rather than
  borrowing a number.
- **No use of explorer result splits** anywhere, pending D118.
- **`expression-census.test.ts` left failing** (D114). A content wave editing a
  server test so its own output passes is the failure mode the pin exists for.
- **No shape entry's plans, triggers or watch text were changed** — only three
  provenance lines that had become factually false, each superseded rather than
  rewritten.
- **No `prospective` shape reference invented**, and no second shape referenced
  where the trigger did not fire on the spine (the Grünfeld pack wanted
  `doubled-c-pawns` and measured 0 of 7).
- **No chess claim graded or created.** Every deviation class in the ten packs is
  `accepted_alternative` or `interesting_deviation` except the four
  `concept_violation`s, each of which is true by the shape detector's own
  definition (the move removes a pawn the detector requires) and says so in those
  terms.

## 2026-08-15 — CORRECTION to the middlegame-wave entry above (claude, same session)

Two errors in the entry's final bullet, found by counting after writing it
instead of before, which is the wrong order and is why this correction exists.

1. **There are five `concept_violation` deviations across the ten packs, not
   four.** Full census of the 55 authored deviations, counted with a script:
   `accepted_alternative` **29**, `interesting_deviation` **21**,
   `concept_violation` **5**, `tactical_error` **0**, `required_theory` **0**.
   The five are `grunfeld-exchange-fianchetto` (…Bxd4), `iqp-white-panov-attack`
   (d4-d5), `kid-mar-del-plata-white` (c4-c5), `maroczy-bind-white-squeeze`
   (c4-c5) and `nimzo-doubled-c-pawns` (c4-c5) `[V]`.
2. **"the move removes a pawn the detector requires" is true of four of them, not
   five.** The Grünfeld case removes the *bishop* conjunct: `fianchetto-g7`'s
   trigger is a black pawn on g6 **and** a black bishop on g7, and …Bxd4 takes the
   second one off g7. The general form the bullet should have used: each of the
   five removes a conjunct of its own shape entry's trigger, so the structure
   stops being detected on that move — four pawn conjuncts and one piece conjunct.

Re-verified while correcting, and both hold: all five carry `offObjective: true`,
a declared `mistake` kind, and a `cost` of `unmeasurable` with a stated reason;
none asserts a chess consequence beyond the detector's own arithmetic and, where
quoted, an explorer rarity bound. Also re-checked and unchanged: `pack-check` on
all ten packs emits exactly one line each — **0 warnings and 0 errors**, not just
a passing exit code `[V]`.

## 2026-08-15 — Explorer-grounding wave: what the result-split ruling reaches, and the four places it does not (claude)

One agent, ~71 min (orientation 18 · instruments 13 · explorer queries 8 ·
authoring 12 · verification 8 · ledger and log 12) · **friction ≈ 27%**
(19 of 71). That is higher than wave F's 7.7% and the middlegame wave's ~14%,
and the reason is not waste: **this wave's subject had no instrument at all**, so
building one was the work rather than a detour. Detail in Frictions below. No
commits. Files touched: eleven packs in `content/drafts/`, two new disposable
instruments in `apps/server/src/`, `design/BACKLOG.md` (D148–D157), this log.
Nothing in `rfc/`, `design/00`–`06` or `archive/` was touched.

Ledger block: **D148–D157**, as issued. No id outside the block was minted.

### The ruling, applied

`design/BACKLOG.md` D126, owner 2026-08-15: explorer W/D/B result splits are
admissible `corpus_observed` evidence at rung 4 — *the split may be stated with
its population; it may never be converted into a move verdict or a quality
claim.* Read against `design/05` §3, which defines rung 4 as *"says what
happened, not what is good"* with **popularity read as quality** as its named
failure. A result split is neither popularity nor a verdict, which is why it
lands on rung 4 rather than being refused; the *conversion* is the whole
boundary.

**Population, stated once and used everywhere below:** Lichess opening explorer,
`variant=standard`, `ratings=1400,1600,1800`, `speeds=rapid,classical`,
`since=2023-01`, `until=2025-12`, authenticated with the operator token,
retrieved 2026-08-15 (UTC). This matches the middlegame wave, deliberately, per
D124. **Every number was re-queried live and uncached** — the probe bypasses
`ExplorerClient`'s 30-day cache — and **all eleven position totals reproduced the
counts already in the corpus exactly** `[V]`: 10987, 8476, 7158, 6011, 5069,
2634, 817, 815, 795, 742, 730.

### What it grounded — eleven packs

Every middlegame pack in the corpus now states its start position's recorded
outcomes. This is a rung-4 fact about a **position**, which is a kind of evidence
the corpus did not previously contain anywhere: until today every explorer number
in every pack was a *move share*.

| Pack | Games | W / D / B | % |
|---|---:|---|---|
| `kid-mar-del-plata-white` | 10987 | 5242 / 555 / 5190 | 47.7 / 5.1 / 47.2 |
| `dragon-yugoslav-race` | 8476 | 4390 / 401 / 3685 | 51.8 / 4.7 / 43.5 |
| `french-advance-chain-white` | 7158 | 3325 / 348 / 3485 | 46.5 / 4.9 / 48.7 |
| `berlin-queenless-press` | 6011 | 2419 / 589 / 3003 | 40.2 / 9.8 / 50.0 |
| `maroczy-bind-white-squeeze` | 5069 | 2629 / 371 / 2069 | 51.9 / 7.3 / 40.8 |
| `open-centre-ruy-exchange` | 2634 | 1309 / 197 / 1128 | 49.7 / 7.5 / 42.8 |
| `iqp-black-tarrasch-defence` | 817 | 432 / 67 / 318 | 52.9 / 8.2 / 38.9 |
| `carlsbad-minority-attack` | 815 | 390 / 60 / 365 | 47.9 / 7.4 / 44.8 |
| `iqp-white-panov-attack` | 795 | 404 / 53 / 338 | 50.8 / 6.7 / 42.5 |
| `nimzo-doubled-c-pawns` | 742 | 321 / 40 / 381 | 43.3 / 5.4 / 51.3 |
| `grunfeld-exchange-fianchetto` | 730 | 386 / 66 / 278 | 52.9 / 9.0 / 38.1 |

`carlsbad-minority-attack` was added to the middlegame wave's ten because it is
the eleventh middlegame pack and **it had no corpus evidence of any kind** — no
band, no game count, no explorer query in the file. The pack `design/04` §8 names
as the phase exemplar was the one pack that could not say which population it was
authored against. Ledgered D157.

Beyond the census, three packs got grounding the middlegame wave explicitly
wanted:

- **`kid-mar-del-plata-white`** — the wave's *"is Ne1 or b4 the better KID move
  order at 2795 vs 2557 games"*. Both splits are now on record: Ne1 2795 games,
  1377/149/1269; b4 2557 games, 1312/115/1130. **Neither is ranked**, and the
  pack says so in the claim. Also the window's three landmarks — after Nd3 (783,
  326/45/412), after f3 with readiness complete (639, 270/38/331), after ...f4,
  the arrival (644, 271/38/335) — three splits inside one percentage point of
  each other, recorded and left uninterpreted.
- **`dragon-yugoslav-race`** — the arrival node (439 games, 231/20/188) and
  h4-h5 itself within it (172 games, 92/9/71), plus the other branch's
  readiness-complete node (239, 138/9/92). Recorded **side by side and not
  compared**: they are different positions on different branches.
- **`maroczy-bind-white-squeeze`** — the tolerated Qd2 (1161 games, 598/83/480),
  and an explicit record that the window's own readiness-complete position
  **abstains**.

### What it did NOT reach — the more valuable half, four findings

**1. It reaches zero of the four `cost: unmeasurable` deviations, and the block
is the schema before it is the corpus.** `$defs/deviationCost` admits `cp`
(basis engine/material), `mate` (basis engine/tablebase) and `unmeasurable` —
there is no corpus basis, so a split cannot be written into the field. The
semantic block is stronger: *cost* is a quality claim, so converting a split into
one is exactly the refused conversion. And the corpus refuses independently —
measured at `moves=40`:

| Pack | Deviation | Games at its node | Verdict |
|---|---|---|---|
| `kid-mar-del-plata-white` | c4-c5 | **30** of 10987 | below floor |
| `iqp-white-panov-attack` | d4-d5 | **2** of 158 | below floor |
| `nimzo-doubled-c-pawns` | c4-c5 | **0** of 742 | no data |
| `grunfeld-exchange-fianchetto` | …Bxd4 | **0** of 730 | no data |

All four are under the **100-game floor at which this repo's own explorer client
abstains** (`explorer.ts:91`). The general form is worth keeping: **a move worth
authoring as a deviation is a move the band does not play, and that is the same
property that denies it a split.** The instrument is strongest exactly where
content needs it least. The four `cost.reason` strings now state the measured
count and the abstention instead of *"no corpus evidence bears on this"*; all
four costs stay `unmeasurable`. Ledgered D148 — which also corrects D126's own
summary: there are **four** such deviations, not five. `maroczy-bind-white-squeeze`'s
c4-c5 carries `{cp, 194, engine}` from the middlegame wave's single engine pass,
and that wave's correction entry above is wrong on this point.

**2. It reaches no timing-window budget or deadline, for a structural reason the
ruling does not touch.** The explorer aggregates **per position**, so no query
can condition an outcome on whether an event happened earlier or later in the
same game. Every window's graduation blocker asks for the same missing thing —
*"a corpus measurement relating the arrangement's completion to results at this
band"* — and D126 changes what may be **said about** a position, not what may be
**asked of** the index. All four budgets and deadlines remain authored numbers.
Ledgered D155: the capability is per-game traversal, and calling it "the
explorer" is why four waves have now re-derived that it does not exist.

**3. Half the windows are beneath the abstention floor before that problem is
even reached.** Measured:

| Pack | Readiness complete | Arrival close |
|---|---:|---:|
| `maroczy-bind-white-squeeze` | **80** (101 one ply earlier) | — |
| `iqp-white-panov-attack` | **29** | **12** |
| `kid-mar-del-plata-white` | 639 | 644 |
| `dragon-yugoslav-race` | 239 | 439 |

The Maroczy window **crosses the floor inside itself** — 101 games after Rac1, 80
after b3. Band data thins with depth and a window by construction lives deep;
nothing warns an author about the trade. Ledgered D151.

**4. Nothing at HEAD can bind a split to prose, so all of it is unbound.** Three
gates in series: `EVIDENCE_KINDS` has no census kind; `explorer_frequency`'s
values are validated **key-exact** against the eight move-share fields
(`check.ts:128-132`); and its supported text must be **byte-equal** to
`renderExplorerFrequency` (`check.ts:144`), which renders a share and no
outcomes. `check.ts:202` maps `corpus_observed` to `explorer_frequency` alone, so
a split sentence labelled `corpus_observed` would raise `EVIDENCE_TYPE_UNBACKED`
the moment its pack acquired a ledger. The eleven packs have **no `.evidence.json`
at all**, which is the only reason the label passes today.
`rfc/claim-backing.md`'s `explorer_position_census` is the named fix and is not
landed; per the brief it was not relied on and nothing was invented in its place.
Ledgered D150.

### Every claim wanted and refused — eleven, and the split between them is the answer

The brief asked how much of the gap is vocabulary versus instrument. Counted:
**seven of eleven are vocabulary and four are instrument**, and the seven are not
a gap at all — they are the boundary working.

*Refused because the sentence converts a split into a verdict (the number
exists):*

1. *"b4 scored 51.3 against Ne1's 49.3, so b4 is the better move order"* — the
   middlegame wave's own named question. Both numbers are now in the pack; the
   comparison is not.
2. *"the three KID window splits are flat, so blunting before the lock changes
   nothing"* — the flatness is stated, the inference is not.
3. *"Nc2 scored 78.9/0.9/20.2 over 218 games at the Maroczy root, so Nc2 is the
   move"* — the sharpest temptation in the whole dataset and the clearest refusal.
4. *"…Nxd4 gives White 63.9 over 324 games, so it is a mistake for Black"*
   (Dragon).
5. *"readiness-complete 57.7 for White vs the arrival branch's 52.6, so arranging
   first is worse for Black"* — refused twice: a verdict, and a comparison across
   two different positions on two different branches.
6. *"White scores 40.2 over 6011 games, so the Berlin queenless structure favours
   Black at this band"*.
7. *"Black scores 48.7 to White's 46.5 over 7158, so the French Advance chain is
   not working for White at this band"*.

*Refused because no admissible number exists (below the 100-game floor or zero
games):*

8. *"…f5 scores 90.9% for White"* (Grünfeld, 11 games).
9. *"d4-d5 scored 1/0/1 in its two games"* (Panov IQP).
10. *"d4-d5 scored 1/0/6 over seven games, so the premature break is punished"*
    (Nimzo) — a verdict *and* below floor.
11. *"the cost of c4-c5 is the drop from the position's split to the post-move
    split"* — the conversion the boundary names, in its purest form.

**The seven are permanent.** No amount of authoring turns a split into a verdict,
and treating them as a backlog would be reading popularity as quality with extra
steps. **The four are an instrument gap**, and three of the four are the same
gap: the explorer's floor. So the honest sizing is that D126 closed the
vocabulary question completely and left the instrument question exactly where it
was.

### Census delta — zero, and that is the finding

`make expression-census WITNESSES=content/witnesses/expression-witnesses.json`,
before and after:

| | Before | After |
|---|---:|---:|
| packs / positions / transitions | 53 / 791 / 738 | 53 / 791 / 738 |
| subjects | 184 | 184 |
| `neverFiresInCorpus` | 30 | 30 |
| `inShapeDenominatorEmpty` | 19 | 19 |
| `firesOnlyOutsideShape` | 40 | 40 |
| `satisfiabilityUnknown` | 23 | 23 |
| `unsatisfiable` | 0 | 0 |

Identical in all nine fields, which also reproduces the middlegame wave's
after-numbers exactly `[V]`. **The census measures structural expressions, and
this wave added none** — so the repo's only corpus-wide content instrument cannot
see rung-4 evidence at all, and a wave that adds nothing but corpus grounding
looks identical to a wave that adds nothing. Every prior wave used the census
delta as its headline; this one has no headline instrument. Ledgered D152.

**The default witness path now agrees**: `make expression-census` with no
`WITNESSES=` produces a byte-identical report to the explicit run. Codex's fix is
confirmed and D102's flagged path is closed.

### Verification actually performed

- `make pack-check` on all eleven packs: **11/11 exit 0**, each emitting exactly
  one line — 0 warnings, 0 errors.
- All eleven position totals re-queried **live and uncached**: 11/11 exact
  against the counts already in the corpus.
- `make expression-census` before (via `git stash` of `content/drafts`) and
  after, plus a third run on the default witness path: 0 `unsatisfiable`
  throughout, all three summaries identical.
- **`make verify` is green**: typecheck clean across four projects, **99 test
  files / 615 tests passing**, `schema:check` OK. Note for the record: D122's
  pinned census test no longer fails — it was rewritten to assert an invariant
  after the middlegame wave refused to edit it, and the gate is green without any
  test being touched this wave.

### Frictions, with time cost

1. **No shipped command answers "what did the band score here"** (~8 min). The
   only explorer path that reaches a pack is `make candidate-attach`, which
   writes a move-share sentence and nothing else; nothing prints a split. Built
   `apps/server/src/split-probe.ts`. This is D121's exact class — the question
   every author of this wave's content must ask, with no oracle — and it is
   ledgered for promotion as D156.
2. **No way to get the FEN of a pack's spine node or a deviation's result**
   (~5 min). `nodePosition` exists but is private to `explorer.ts` and only
   resolves spine ids, never a deviation's after-position, which is what every
   deviation-grounding question needs. Built `apps/server/src/fen-walk.ts`.
3. **`explorerUrl` hard-codes `moves=12`** (~4 min, mid-flight rebuild and
   re-query). Two packs could previously only *bound* their deviation's rarity;
   at `moves=40` both are exactly **0**, a materially different sentence.
   Ledgered D149.
4. **`make expression-census` prints the entire report to stdout** (~4 min) —
   232 KB of JSON with no summary mode, so the nine numbers every wave quotes
   have to be extracted by a throwaway script. `OUT=` exists and is the
   workaround; a `--summary` would have saved it.
5. **There is no way to census a clean tree** (~2 min). Getting a *before* number
   required `git stash push -- content/drafts`, run, `git stash pop`, with the
   wave's work in the stash while the census ran.
6. **The window note cap blocked the ruling's own sentence** (~0 min to hit,
   0 to work around, high to report). The four notes are 337/394/372/359 of 400
   characters and a population needs ~120, so the split could not go in the field
   that exists to justify a threshold. Ledgered D153 as the measured form of
   D123.

### Not done, deliberately

- **No `cost` was changed from `unmeasurable`.** Four reasons were sharpened with
  measured counts; no split became a cost.
- **No `explorer_position_census` record, and no evidence ledger invented** for
  any of the eleven packs. `rfc/claim-backing.md` is in cross-review and was
  neither read as binding nor pre-empted; where a claim needs a binding that does
  not exist, the log says so (D150) rather than the pack inventing one.
- **No timing window edited** — not the budgets, not the deadlines, not the
  readiness sets, not the notes. Nothing measured this wave bears on any of them.
- **No split below the 100-game floor was quoted as evidence** anywhere. Where a
  position falls under it, the packs record the abstention instead.
- **No move, plan or side graded**, and no split compared to another. Eleven
  wanted sentences are recorded above instead of written.
- **No shape entry, no `design/00`–`06`, no `rfc/`, no `archive/` touched.**
- **No test edited.** `make verify` was green on the first run.

### One correction owed upward

D126's illustrative example reads *"1400–1800 players scored 47/31/22 over 5,069
games"*. **5,069 is real** — it is the Maroczy root at this band, reproduced
exactly this wave. **47/31/22 is not**: the measured split there is
**51.9/7.3/40.8**, and a 31% draw rate occurs nowhere in the eleven positions
censused (range 4.7–9.8%). No one has been misled and the illustration did its
job, but a plausible split paired with a real count is D110's shape one tier up,
in the document every agent reads first. Ledgered D154; the fix is one edit and
it is the owner's, not this wave's.

## 2026-08-16 — Citation pass: 22 packs get sources, 0 packs get closer to publishing (claude)

**Ledger block D267–D276, all ten used.** The wave `rfc/pack-graduation.md` §7
prices as the cheapest step on the publishability ladder — *"+ the above **and** a
citation pass → 10 of 47"* — run against 47 authored packs. The headline is a
measurement, not an argument: **the checker cannot see a citation, so the number
it moves is zero.**

### The measurement, run rather than reasoned

`checkSourcingFile` over all 47 `content/drafts/` packs, at `c55b9cf`, before and
after this wave's 22 edits, at both severities (published severity measured by
running the same checker against a copy with `reviewStatus: "published"`):

| | Draft severity clean | Published severity clean |
|---|---|---|
| Before | **32 of 47** | **4 of 47** |
| After 22 packs cited | **32 of 47** | **4 of 47** |

The 4 are `anti-caro-advance`, `opening-principles-black`,
`opening-principles-white`, `opponent-intent-early-queen`. §7's corrected
right-hand column said **4**, not 7, and that reproduces exactly. The 15 draft
failures are all `EVIDENCE_READ_ERROR` + `MANIFEST_READ_ERROR` — packs with no
sidecars at all — which reproduces D238's *15 of 47* independently.

**Why zero.** Every remaining published-severity error in the corpus is
`EVIDENCE_TYPE_UNBACKED`, which fires when a `feedbackClaims[].evidenceTypes`
label has no evidence **record of a matching kind**. A bibliographic source
produces no record of any kind, because `EVIDENCE_KINDS` has six members and none
of them is a citation (D268). §7's *"10 after a citation pass"* is a hand audit
against the **blocker gate**, which is prose; it can be true while the instrument
is unmoved. Both statements are now measured, which is what the RFC's own
cross-review asked for. Ledgered **D267**.

### What was cited — 22 packs, 19 sources, every one fetched and quoted

All sources are CC BY-SA 4.0 and compatible with the owner ruling that pack prose
is `CC-BY-SA-4.0` (`design/02` §Content/data rights). Every URL was retrieved on
2026-08-16 and the sentences relied on are quoted inside each pack's
`provenance.sources`. **No source text was paraphrased closely enough to be a
derivative** — the idea is cited, the prose stays ours.

**Endgame class — the 11 packs carrying the two tablebase-family blockers:**

| Pack | Source | What it backs |
|---|---|---|
| `mate-bishop-knight`, `trajectory-mate-bishop-knight` | en.wikipedia.org/wiki/Bishop_and_knight_checkmate | the three-phase method, the W manoeuvre, Delétang's triangles, the 33-move bound |
| `mate-k-q-technique` | en.wikipedia.org/wiki/Checkmate §Basic checkmates | shrink-the-rectangle, bring the king, "at most ten moves" |
| `mate-k-r-technique` | same, + en.wikipedia.org/wiki/Opposition_(chess) | the rectangle drive and "at most sixteen moves"; the opposition and who must give way |
| `mate-two-bishops` | en.wikipedia.org/wiki/Checkmate §Basic checkmates | drive to an edge then a corner, "a maximum of 19 moves" |
| `philidor-third-rank-hold` | en.wikipedia.org/wiki/Philidor_position | the third-rank fence, then check from behind when the pawn arrives |
| `philidor-passive-rook-convert` | same | "A passive defense does not work" — the root's premise |
| `pawn-opposition-convert` | Opposition (chess) + King and pawn versus king endgame | the opposition, key squares, and Averbakh's king-leads-the-pawn |
| `queen-vs-pawn-seventh-convert` | en.wikipedia.org/wiki/Queen_versus_pawn_endgame | the zigzag **and** the bishop/rook-pawn stalemate exception — the closest source-to-prose match in the corpus |
| `opposite-bishops-fortress-hold` | en.wikipedia.org/wiki/Opposite-coloured_bishops_endgame | the drawing tendency, two extra pawns often insufficient, the fortress method |
| `pawn-breakthrough-convert` | en.wikibooks.org/wiki/Chess_Strategy/Queenside_pawn_majority | the majority-with-distant-kings premise only — see D273 |

**Middlegame and opening class — the 11 "objective's premise is uncited" packs:**

| Pack | Source | What it backs |
|---|---|---|
| `carlsbad-minority-attack` | Pawn structure §Carlsbad + Minority attack + Queenside pawn majority | two of the three plans, and the lasting weak c-pawn — see D271 |
| `maroczy-bind-white-squeeze` | Maróczy Bind + Pawn structure §Maróczy Bind | what the bind restrains and Black's three freeing breaks |
| `iqp-white-panov-attack` | Isolated pawn + Pawn structure §Queen's Gambit – Isolani | the d5 break, the e5 outpost, blockade-and-trade as the answer |
| `iqp-black-tarrasch-defence` | Isolated pawn + Pawn structure §Giuoco Piano – Isolani | the blockade of the square in front of the isolani as the pawn's central problem |
| `kid-mar-del-plata-white` | King's Indian Defence | White's c4–c5 break against Black's ...f5/...g5 storm |
| `dragon-yugoslav-race` | Sicilian Defence, Dragon Variation | the c-file/...Ne5-c4 counterplay and the "race-to-mate pawn storms" framing |
| `french-advance-chain-white` | French Defence + Pawn structure §e5-chain | ...c5 attacking the chain at its base — see D270 |
| `nimzo-doubled-c-pawns` | Nimzo-Indian Defence | the bishop-pair-for-doubled-c-pawns bargain |
| `open-centre-ruy-exchange` | Ruy Lopez, Exchange Variation | "White aims to reach an endgame with a superior pawn structure" |
| `grunfeld-exchange-fianchetto` | Grünfeld Defence | the g7-bishop-plus-...c5 attack on the big centre |
| `berlin-queenless-press` | Berlin Defence | the position and the ...Kc8 walk — and it argues against the objective, see D270 |

### How a citation is encoded, and why not as evidence

Each cited pack gained `provenance.licence: "CC-BY-SA-4.0"`, a
`provenance.attribution[]` row per source (`sourceId`, `licence`, `noticeText`,
`url`, `retrievedAt`), and a `CITATION PASS (2026-08-16)` entry in
`provenance.sources` quoting what was actually read and naming what the source
does **not** reach.

**No evidence record and no manifest entry was invented.** `linkage` requires
every manifest entry to be consumed by a record or an abstention, `EVIDENCE_KINDS`
has no bibliographic member, and `evidenceSupports` raises `EVIDENCE_OVERREACH`
for any non-template record supporting a prose pointer. An abstention was
considered and rejected as dishonest: the sources are available and were fetched;
what is missing is a **record kind**, not a source. `rfc/claim-backing.md` owns
that mechanism, is not landed, and was neither pre-empted nor read as binding.
Ledgered **D268**.

### Blockers were split, never deleted

Every citation-shaped blocker became **two** entries — a `CITED 2026-08-16` entry
naming what the source now backs, and a `STILL UNBACKED` / `STILL UNCITED` entry
naming what it does not. The corpus went from **240** blocker entries to **265**
(22 splits, +22; three stale-digest findings, +3), which is the direction a
truthful pass moves it. The
previous wave's finding that 42 of 48 resolution-marked entries were compound is
exactly why no prefix-and-retire was attempted.

### What could not be cited — the more valuable half, three distinct failures

The three are not the same failure and the distinction is the output:

1. **The claim is not the kind of thing a source can settle — 5 packs.** Every
   remaining middlegame premise reduces to *arrangement before X*:
   `maroczy-bind-white-squeeze` (before lever), `kid-mar-del-plata-white` (before
   the lock), `dragon-yugoslav-race` (before the h-pawn arrives),
   `iqp-white-panov-attack` (Re1 and Be4 before ...Nce7), and
   `carlsbad-minority-attack` implicitly. **Wikipedia's structure articles are
   theme inventories by construction** — they list what each side plays and never
   sequence it. No encyclopedic source settles an order claim. Per D155 the
   instrument that would is a game-level corpus, which does not exist at HEAD.
   This is the third wave to arrive at that missing instrument from a new
   direction. Ledgered **D272**.
2. **No compatible source exists — 1 claim.** The three-against-two pawn
   breakthrough. `Breakthrough_(chess)` is a 404; `Passed_pawn` covers **piece**
   sacrifices clearing a promotion path, not the pawn breakthrough;
   `Chess/The_Endgame/Pawn_Endings` has no breakthrough section; the MediaWiki
   search API returns no article on either wiki. The shelf is genuinely empty for
   the mechanism. Ledgered **D273**.
3. **A source exists and points the other way — 2 packs, and this is the
   finding.** `berlin-queenless-press` wants a king-activity plan for queenless
   middlegames; the Berlin Defence article calls the position an **endgame**,
   calls Black's king **"misplaced in the centre"**, and says **"Black can hold
   the endgame with accurate play"**. The pack's own corpus measurement already
   said nobody plays it, so two independent signals now lean against that
   objective, and the honest next step is to re-examine it rather than to cite
   harder. `french-advance-chain-white` premises that holding the base census is
   **White's** plan; Pawn structure §e5-chain gives White's themes as *"Kingside
   mating attack, f2–f4–f5 break"* and names d4 only as what **Black** attacks.
   Both are recorded in the packs unchanged and unrationalized. Ledgered
   **D270**; `carlsbad-minority-attack`'s third plan class is the same shape at
   the level of one plan and is **D271**.

### Found on the way, not looked for

**Three evidence sidecars were already digest-stale at HEAD** —
`mate-bishop-knight`, `mate-k-q-technique`, `mate-k-r-technique`, 3 of 32. Their
evidence was confirmed against a different version of their pack and
`EVIDENCE_DIGEST_STALE` has been firing on them unnoticed because it is a
*warning*. This wave did **not** re-stamp them; the finding was written into each
pack's `graduationBlockers` so it survives the re-stamp `pack-graduation` §4.5
plans for all 32 ledgers. The eight sidecars this wave itself staled **were**
re-stamped, by string-substituting the digest literal, because no evidence record
in the corpus supports any pointer under `/provenance` (checked: zero) so nothing
the ledger attests changed. Ledgered **D269**.

**`provenance.attribution` is validated for one field.** `licenceObligations`
refuses a row whose `licence` is not `CC-BY-SA-4.0` and demands a row for every
prose-contributing CC-BY-SA **manifest** entry — which, by D268, a citation can
never be. So the 22 packs would pass identically with invented URLs. Every source
here was fetched and quoted by hand; that discipline is a convention, not a gate.
Ledgered **D275**.

### Verification actually performed

- `make pack-check FILE=…` on all 22 edited packs: **22 passed**, one advisory
  `CONSTRUCT_UNREACHED` warning that predates the wave.
- `sourcing-check` on the 11 edited packs that have sidecars: **11 passed
  (strict)**. The other 11 have no sidecars and fail exactly as they did before.
- `checkSourcingFile` over all 47 at both severities, before and after: table
  above.
- `digestDrillPack` over all 32 sidecars, before and after.
- `make verify`: **green**, first run — 103 test files, 661 tests, typecheck and
  schema-check clean. **No test was edited and none needed to be.**

### Frictions, with time cost — ~47 of ~155 minutes (30%)

1. **A JSON round-trip destroys the corpus's hand-formatting** (~18 min, and a
   full revert-and-rewrite). `content/drafts/*.json` mixes pretty-printed and
   hand-compacted arrays; `*.evidence.json` files are single-line. A naive
   `json.dump(indent=2)` turned a one-field edit into **2,101 insertions**, and
   the digest re-stamp turned a one-character change into **1,222 lines** on one
   sidecar. The pass that shipped splices only the `provenance` block by
   brace-matching, and substitutes the digest literal as a string. There is no
   `make` target that edits a pack field, so every content wave writes this by
   hand. Ledgered **D276**.
2. **Nothing reports the corpus's clean/failing counts** (~10 min). `make
   sourcing-check` is per-file, `make verify` never runs it (D208), and
   published-severity is only reachable by mutating `reviewStatus` on a copy.
   Built a disposable scanner to get the six numbers this entry quotes.
3. **Nothing reports digest staleness** (~5 min). `EVIDENCE_DIGEST_STALE` is
   emitted per-file at warning severity and aggregated nowhere, which is why D269
   sat unnoticed. Built a disposable digest walker.
4. **A rendered Wikipedia page truncates before the section a citation needs**
   (~8 min). `Pawn_structure` carries 20 structure sections and the fetch was cut
   off before *Carlsbad formation* — the exact section three packs needed. The
   MediaWiki `action=parse&prop=sections` / `&prop=wikitext&section=N` pair
   returns any one section in full in a small request, and turned that article
   into the wave's highest-yield source (six sections, five packs). Recorded as a
   method for future waves: **D274**.
5. **`git checkout -- content/drafts/` in a live multi-agent tree** (~6 min, a
   near miss). Reverting the wave's own reformatting churn also reverted two pack
   files another agent had been editing. Nothing was lost — the other agent had
   committed two minutes earlier (`caa8afa`) — but the wave had no way to know
   that before running the command, and no cheaper undo than a whole-directory
   checkout. Reported, not ledgered: this is a working-practice hazard, not a
   repo defect.

### Not done, deliberately

- **No evidence record, abstention or manifest entry invented** for any
  bibliographic source. `rfc/claim-backing.md` owns binding instruments to prose;
  this wave attached bibliography and said so (D268).
- **No blocker deleted.** 22 split into 44; the corpus's blocker count went up.
- **No `graduationBlockers` restructure.** `rfc/pack-graduation.md` is accepted
  but the blocker-state object is not implemented at HEAD — the field is still a
  bare `string[]` — and this wave authored against the schema as it stands.
- **No prose rewritten to match a source.** Where a source contradicted a pack
  (D270, D271), the contradiction was recorded and the pack left alone; changing
  the claim to fit the citation would be the citation writing the chess.
- **No source paraphrased into pack prose.** CC BY-SA share-alike is satisfied by
  attribution, but a close paraphrase would make the pack a derivative of that
  specific text; the ideas are cited and the sentences are ours.
- **The three pre-existing stale digests were not re-stamped** (D269).
- **No test edited, no `design/00`–`06`, no `rfc/`, no `archive/` touched.**

## 2026-08-16 — The 1400–1799 band wave: three received middlegames, and why "make Act II longer" is the wrong instruction (claude)

**Ledger block D345–D354, all ten used.** One agent, ~157 min (orientation and
reading 25 · instruments 12 · explorer probing 35 · authoring 45 · verification
and correction 20 · ledger and log 20) · **friction ≈ 23%** (36 of 157, itemised
below). No commits. Files touched: three new packs in `content/drafts/`, two new
disposable instruments in `apps/server/src/`, `design/BACKLOG.md`, this log.
Nothing in `rfc/`, `design/00`–`06` or `archive/` was touched, and no test was
edited.

### The gap, and what was authored against it

`design/research/coaching-versus-cheating-and-the-band-curve.md` measured that the
declared opponent band is a two-point step function while the declared *learner*
band is continuous across 1000–2000. Reproduced at HEAD before authoring:
`targetElo` **< 1400: 6 · 1400–1799: 2 · ≥ 1800: 37 · none: 2** over 47 packs.

Three packs, all `phase: middlegame`, all `mode: plan`, all `human_common`:

| Pack | Structure / shape entry | Chair | `targetElo` | Root games | Spine ply | `plyHorizon` |
|---|---|---|---:|---:|---:|---:|
| `london-wedge-black-counterplay` | London wedge / `london-wedge` | Black | **1500** | 16116 | 6 | 16 |
| `open-centre-french-exchange-black` | Open centre / `open-centre` | Black | **1650** | 2695 | 6 | 16 |
| `closed-centre-chain-black-base-strike` | d4/e5 chain / `closed-centre-chain` | Black | **1750** | 28420 | 8 | 18 |

**Why these three and not a count.** Each earns its place three ways, and all
three are measured rather than argued:

1. **Act II is the thinnest act by decidability** (`design/06` §5 — Act I
   outcome-measured, Act II authored, Act III tablebase-measured), so a pack in
   the missing band is worth most there.
2. **All three put the learner in the structure the OPPONENT chose.** The London,
   the Exchange French and the French Advance are what a 1500 receives, not what
   they pick. `design/04` §2c's anti-opening whitespace — *"half of real losses
   come from positions your opponent chose"* — has never been applied to Act II
   before; every existing middlegame pack drills a plan its owner selected.
3. **Each is the first customer for a shape entry's unserved chair.**
   `london-wedge`'s **five Black plans**, `open-centre`'s **two White plans** and
   `closed-centre-chain`'s **two Black plans** had **zero middlegame customers
   between them** at HEAD `[V]`. `london-wedge` had two customers and both were
   opening packs.

**Population, stated once:** Lichess opening explorer, `variant=standard`,
`ratings=1400,1600,1800`, `speeds=rapid,classical`, `since=2023-01`,
`until=2025-12`, authenticated, retrieved 2026-08-16 (UTC) — the middlegame and
explorer waves' population, matched deliberately per D124. **Every number was
queried live**, and the three root totals plus one interior node were **re-queried
at review and reproduced exactly** `[V]`.

### Band distribution after the wave, re-measured with the same script shape

| `opponentPolicy.targetElo` | before | after |
|---|---:|---:|
| < 1400 | 6 | **6** |
| **1400–1799** | **2** | **5** |
| ≥ 1800 | 37 | **37** |
| none declared | 2 | **2** |
| total packs | 47 | **50** |

The five are `london-wedge-black-counterplay` (1500), `pawn-opposition-convert`
(1500), `open-centre-french-exchange-black` (1650), `mate-two-bishops` (1700),
`closed-centre-chain-black-base-strike` (1750). **The step function survives**:
37 of 50 packs still sit at ≥1800, and most of them declare a *learner* band of
1400–2000. Closing that is a **re-band of existing packs**, which is an owner call
about what a declared opponent Elo means, not another authoring round. Ledgered
D354.

### The brief's horizon question, answered — and the instruction was the wrong one

The brief noted the act ramp runs **11 → 8 → 24** and asked whether Act II's
horizon should be longer. Three measurements, in the order they were taken:

**1. The ramp is not an encounter-length knob.** Over all 47 packs at HEAD,
`plyHorizon` equals the **deepest authored spine ply exactly** in **19 of 20**
opening packs and **10 of 11** middlegame packs; endgames are the only family with
slack (12 of 14, median +7). And **`authoredBoundary.fenPredicates` has 0 uses in
47 packs**. So the number records how much spine an author typed. Ledgered D345.

**2. The one middlegame exception is the exemplar, and it is broken.**
`carlsbad-minority-attack` has `plyHorizon: 8` and a deepest spine node at **ply
11**; its last three nodes are in neither `spineNodeIds` nor under the cap — and
its objective (backward c6 on White's half-open c-file) materialises exactly
there. **The pack `design/04` §8 names as the phase exemplar grades a state its
own boundary declares unauthored.** Nothing warns, because
`BOUNDARY_NODE_BEYOND_HORIZON` only fires on *listed* nodes. Ledgered D346.

**3. A longer Act II cannot be bought with more spine, because the band's evidence
dies first.** Measured live on three independent lines: London **139 games at ply
6, 7 at ply 7**; Exchange French **141 at ply 4, 18 at ply 5**; French Advance
**3816 at ply 8** — the exception, and its cause is measured too (six of its eight
moves are recaptures played at 72–98%, so the depth is bought by *forcing*). Add
6–8 to a middlegame tabiya's ply 13–21 and you land at 19–29, which is where
`design/06` §2a's inherited *"human outcome data dies at ply ~20"* already put it.
**They are the same number.** Ledgered D349.

**So the answer is: not longer spine — different territory.** All three packs
declare a horizon above their deepest spine node and grant the difference through
`authoredBoundary.fenPredicates`, keyed on the shape entry's trigger and, where
one exists, the objective plan's signature. These are the **corpus's first three
uses of the field**. The claim is that a library entry is authored guidance valid
wherever its trigger fires, so authored territory keyed to the trigger is honest
in a way that territory keyed to how far someone typed is not. **It is a proposal,
labelled as one in all three packs and in D352**: nothing measured says 16 or 18
is the right cap, or that a structure-keyed grant serves a learner better.

### The construct the checker demands, refuses and faults on

The first draft of pack one used `plan_consequence`, like the four packs in the
corpus that use it. `make pack-check` answered `PLAN_CONSEQUENCE_DEPRECATED` —
*"use `structural_feature` with a `plan_signature` leaf"* — and
`PLAN_SIGNATURE_INLINED` on two hand-written expressions. Following both
instructions produced three different answers from three code paths `[V]`:

| Where | Result |
|---|---|
| objective `successConditions[].feature` | **passes** — `pack-orchestrator.ts:84` expands it at compile time |
| `checkpoints[].trigger.fenPredicate` | **`ERROR START_POSITION_UNRUNNABLE`**, *"plan_signature must be expanded before runtime evaluation"* (`structure.ts:303`) |
| `authoredBoundary.fenPredicates[]` | same error, pack stops passing |
| `make expression-census` | **827 faults per subject**, satisfiability `unknown` — it evaluates raw expressions |

Before this wave: **4 packs on the deprecated construct, 0 packs anywhere using
`plan_signature`**, and neither code named in `design/BACKLOG.md` or in this log —
the deprecation has been printing unnoticed exactly as D269's stale digests were.
All three packs use `plan_signature` in the one place it works and keep the hand
copies where it is refused, so **`PLAN_SIGNATURE_INLINED` is raised on two
expressions that cannot legally be written any other way.** Choosing the
deprecated construct instead, to make a census number look better, was considered
and refused. Ledgered D347.

**And the copy cannot be removed even in principle for the trigger half.**
`plan_signature` resolves a *plan class*; the only trigger-shaped leaf,
`named_structure`, has a closed id vocabulary of four structures, so **21 of the
25 shipped shape entries cannot be named in any expression** — including all three
this wave used. Ledgered D348 with the cheapest fix (`shape_trigger`, mirroring
`plan_signature`).

### Census delta — and it goes the wrong way for doing the right thing

`make expression-census WITNESSES=content/witnesses/expression-witnesses.json`,
before and after:

| | Before | After |
|---|---:|---:|
| packs / positions / transitions | 53 / 791 / 738 | **56 / 827 / 771** |
| subjects | 184 | **192** |
| `neverFiresInCorpus` | 30 | 30 |
| `inShapeDenominatorEmpty` | 19 | 19 |
| `firesOnlyOutsideShape` | 40 | **39** |
| `satisfiabilityUnknown` | 23 | **26** |
| `unsatisfiable` | 0 | **0** |

The before-numbers reproduce the explorer wave's after-numbers exactly `[V]`.
**D152 said the census is blind to corpus grounding; this wave is the control** —
it added structural expressions and the census moved, so D152 is a statement about
the census's *subject*, not a defect. But **`satisfiabilityUnknown` rose by
exactly 3, and the three are this wave's three `plan_signature` objectives**: 0
subjects in the corpus faulted before, 3 do now. A wave quoting the delta as a
headline without reading the fault list would have reported a regression.
Ledgered D353.

### What could not be grounded — the more valuable half

**Refused because the sentence would convert a split into a verdict.** Four
positions carry result splits in pack one alone and they are stated side by side
and never compared, because they are four different positions on three different
branches — the comparison the explorer-grounding wave refused by name. The
sharpest temptation this time was pack three's root: **41.6 / 4.5 / 53.9 over
28,420 games**, the most lopsided root split in the corpus, in a pack about
whether Black's plan works. Not written.

**Refused because no admissible number exists.** The head-strike plan in the
French Advance (`black-chip-the-head`) is played **17 times in 28,420 games** at
the root — a shape-library plan the band effectively does not contain. Stated as
rarity; nothing inferred. Two `unmeasurable` costs carry that reason verbatim.

**Wanted and impossible for a structural reason.** All three packs are about
**order** — take the file before the clamp lands, contest before you develop,
strike before White releases the tension — and D155's per-game traversal still
does not exist. What the wave found instead is the one timing-shaped thing the
explorer *can* say: in pack two, `...Re8` occurs **339 of 2695** at the root and
**48 of 822** six plies later on the other branch, i.e. **above the floor at one
depth and below it at the other**. That is a fact about what the corpus can be
asked, not about which timing is better, so it survives D126 intact. Ledgered
D350 as a technique, explicitly not as a substitute.

**Needs a citation and did not get one.** All three objective premises are
uncited. The 2026-08-16 citation pass established (D272) that encyclopedic
structure articles are theme inventories that never sequence what they list, which
is the exact shape of all three claims. One is *nearly* cited by accident: D270
recorded that `Pawn_structure` §e5-chain names d4 as the square **Black** attacks
— which is why pack three exists at all — but that source was read for a different
pack, was not re-fetched here, and is quoted in provenance as a ledger finding
rather than as a citation. Fetching it is the cheapest single improvement anyone
could make to that file and its graduation blockers say so.

### One claim was wrong until an evaluator was run

The first draft of `closed-centre-chain-black-base-strike` asserted that d4 is
attacked **three** times (c5 pawn, c6 knight, b6 queen) and defended **two** (c3
pawn, f3 knight). The repo's own `direct_attack_count` says **two against three**:
the b6 queen is blocked by **Black's own c5 pawn**, and the **White queen on d1**
defends d4. Both halves wrong, in opposite directions, from a diagram any reader
would read the same way — and it is the one kind of sentence that looks least like
a chess opinion. Same family as D110, D161 and D119. The correction is in the
pack's own provenance rather than silently applied, and D351 carries the standing
rule: **an attack count may only be asserted after the evaluator has returned it**,
and no `make` target computes one.

The probe also corrected a second, smaller claim before it shipped: the White e5
clamp's signature was described as holding "at both Ne5 nodes and nowhere else",
and it in fact holds at **four** positions, because on the `...b6` branch nothing
dislodges the knight.

### Verification actually performed

- `make pack-check` on all three packs: **3/3 pass**. Pack one emits two
  `PLAN_SIGNATURE_INLINED` warnings that cannot be cleared (D347) and all three
  emit the pre-existing corpus-wide `CONSTRUCT_UNREACHED` advisory; **0 errors**.
- Every referenced shape trigger and every plan signature evaluated at **every
  authored position** of all three packs with the repo's own
  `matchesStructuralExpression`, and each pack's prose states the result. Two
  prose claims were corrected by that run.
- Legal-move enumeration for the locked c8 bishop (exactly one destination, d7)
  and `direct_attack_count` at five positions, with the repo's own evaluator.
- Four positions re-queried **live** at review: 16116, 2695, 28420, 25172 — **4/4
  exact**.
- `make expression-census` before and after with the explicit witness file, plus a
  fault-list read; **0 `unsatisfiable` both times**.
- **`make verify` is green, first run** — typecheck clean across four projects,
  **104 test files / 670 tests passing**, `schema:check` OK. **No test was edited
  and none needed to be.**

### Frictions, with time cost — ~36 of ~157 minutes (23%)

Compare wave F 7.7%, middlegame ~14%, explorer ~27%, citation pass ~30%.

1. **Nothing walks a line and prints what the band did** (~7 min). `split-probe.ts`
   takes FENs, hard-codes `ratings=1400,1600,1800`, and prints one position at a
   time; authoring a middlegame pack means walking twenty candidate plies and
   reading the counts at each. Built `apps/server/src/line-probe.ts` (SAN line
   walk, `RATINGS=`/`SPEEDS=`/`FEN=` overrides, per-ply split and top moves). This
   is D121's class again and it is the third wave to build a variant.
2. **Nothing answers "does this plan's signature fire here"** (~6 min). D113 was
   fixed — `shape-check PROBE=` now prints trigger firing — but plan **signatures**
   are what `plan_consequence` and `plan_signature` grade on, and nothing prints
   them. Built `apps/server/src/shape-probe.ts`, which also walks a whole pack.
   It immediately corrected two prose claims, so this is the highest-value 6
   minutes in the wave.
3. **The `plan_signature` round trip** (~9 min): write the deprecated construct →
   warned → switch all three sites → pack fails → revert two of three → rewrite
   the provenance and the blocker that had described the situation wrongly.
   Ledgered D347.
4. **No target computes an attacker/defender count** (~5 min, two throwaway
   bundles). See D351 — this is the friction that let a wrong number nearly ship.
5. **No target reports `plyHorizon` against spine depth** (~5 min, a third
   throwaway). The census in D345/D346 is nine lines of script and answers a
   question every content wave has an opinion about.
6. **`make expression-census` still prints 232 KB to stdout** (~4 min). `OUT=` is
   the workaround and was used; the fault list that turned out to matter most had
   to be extracted with another throwaway.

### Not done, deliberately

- **No engine pass.** All three packs record `cost: unmeasurable` where an engine
  would have measured, with the reason stated per deviation, rather than borrowing
  a number.
- **No result split converted into a cost, a verdict, a preference or a
  comparison**, and no split below the 100-game floor quoted as evidence. The one
  sub-floor number in the wave (48 games) is used only to say the corpus abstains,
  and its own pack flags that a reader could mistake it for a measurement.
- **No shape entry edited.** Three entries gained their first middlegame customer;
  none had its trigger, plans, watch text or provenance touched.
- **No `graduationBlocker` deleted.** All three packs ship with blockers written
  from scratch; where a finding was half-cleared (the boundary-copy blocker in
  pack one) it was **split and rewritten**, not retired.
- **No test edited, and no construct chosen for how it scores.** `plan_signature`
  costs this wave three `satisfiabilityUnknown` subjects and was used anyway.
- **No `design/00`–`06`, `rfc/` or `archive/` file touched.**

## 2026-08-16 — Carlsbad exemplar boundary correction

- D346's mechanical reproduction was correct: the objective transition occurs on pack ply 11,
  while the exemplar declared `plyHorizon: 8` and therefore graded outside its own authored
  boundary.
- Raised the horizon to 11 and pinned the objective node against it in the existing structural
  orchestration test. The pack still validates; no chess claim or authored move changed.
- Deliberately did not generalise this into a blanket spine-depth rule: trajectory roots carry
  leg boundaries and are the known counterexample to that inference.

## 2026-08-16 — content wave F, second pass: the cluster had already run, and its measurements had gone stale

**What this pass was asked to do, and what it found instead.** `planning/work-register.md`
§2 lists cluster F (D75, D76, D43, D44, D55, D63) as *"queued since 2026-08-15 and never
launched"*. It was launched. Commit `41afe00` — *"content: fix wave F — trigger tightening,
witnesses, orphan disposition"*, 2026-08-15 22:32 — is an ancestor of HEAD and shipped the
work. What never happened is the flow-back: the `design/BACKLOG.md` rows still read
`💡 open, found 2026-08-15`, and the register still says the cluster is unlaunched. **This is
the failure the RFC completion protocol was written to catch, arriving through the one door
that protocol does not cover — a content wave is not an RFC, so nothing required it to flip
its own rows.** The ledger rows are outside this pass's boundary and are not touched here;
they are named at the end so the next writer with authority can flip them.

**So the real defect this pass found is a different one, and it is the more interesting one:
the corpus grew from 43 packs / 694 spine positions to 56 packs / 827, and nine shape entries
plus two packs carry measured claims pinned to the old denominator. Four of those claims are
now materially false, not merely stale.** Corpus growth silently refuted content that was
correct when written. That is failure mode 4 from the wave brief — refuted authored claims —
reaching the repo by aging rather than by error.

### Verdict per item, verified before touching anything

| Item | Reproduces? | Evidence |
|---|---|---|
| **D75** — `rook-4v3-same-side` trigger loose | **MOOT.** Fixed in `41afe00` and the fix holds at the larger corpus | Trigger fires **24 of 827**, every firing in `rook-4v3-same-side-hold`. Neither Philidor pack appears — `philidor-third-rank-hold` and `philidor-passive-rook-convert` are absent from the trigger's pack list, which is exactly what the two added clauses (Black holds ≥1 pawn; White's pawn count exceeds Black's by ≥1) were for. 13 new packs entered the corpus and none entered this shape |
| **D76** — `fianchetto-g7` arm from the wrong side | **MOOT as a defect, and now positively refuted.** `41afe00` refuted the premise (the entry's own trigger is `any[g6/g7, mirrored(files, g6/g7)]`, so the mirror is correct and the *name* was the defect) and corrected the name. This pass adds the confirmation the earlier one could not have: **the mirrored arm now fires 10 times on authored content** | Trigger 95 of 827: arm 0 (g6/g7) **85**, arm 1 (file mirror, b6/b7) **10**, in `london-wedge-black-counterplay` (2) and `nimzo-doubled-c-pawns` (8). The 2026-08-15 zero was recorded as a coverage fact rather than a defect; the corpus has since supplied the coverage. Separately machine-checked: `mirrorFeature` in `packages/runtime/src/structure.ts` **does** flip `bishop_on_shade` under the files axis, so plans/2's authored claim that the mirrored arm covers a light-squared queenside bishop is true, not assumed |
| **D43** — signature fires on zero of its own shape's positions | **Reproduces, and it is a COVERAGE FACT, not a bug.** The row's own rule decides it: *"fires nowhere" is a coverage fact and "cannot fire" is a bug* | Ran `all[trigger, plans/1 signature]` as a bare expression through the census. **No R1–R8 rule refutes it**, and a played witness exhibits it **true**: `4k3/8/5n2/1p6/P7/8/8/3BK3 w - - 0 1` then `a5` — White bishop, Black knight, and a white a-pawn that passes the moment the black b-pawn stops being ahead of it. Reference witness `Kf2` from the same position is false. So trigger and signature are **jointly satisfiable** and nothing is changed. Two witnesses committed for the trigger itself, which moved it `unknown` → `satisfiable` |
| **D44** — nine of twenty-five shape entries orphaned | **Reproduces, but the count is stale: it is 4 of 25, not 9 of 25** | Structured walk over every `shape` / `shapes` reference field in all 56 packs. Orphans: `hanging-pawns`, `knight-vs-bishop`, `up-an-exchange`, `vancura`. This confirms `D297`'s fact refresh (21 of 25 attested) and extends it from 47 packs to 56 |
| **D55** — census convention (fixture packs) | **The residual is discharged by the shipped instrument, and the pattern reproduces exactly** | The census report **states its own convention**: `corpus.roots`, `corpus.fixturePacks` (the six `.browser` packs, by name) and `corpus.packsWithoutSpine`, with per-pack counts on every subject — so **both denominators are derivable from one report**, which is stronger than picking one. Measured: 827 positions total, **23 fixture / 804 non-fixture**. D43's fan reproduces the row's exact numerator exception at the new size: **9 of 827** under the census convention, **4 of 804** once fixtures are excluded, because 5 of its 9 hits are in `immediate-guard-browser` and `stated-reasoning-browser` |
| **D63** — eight-way compare overflow | Already closed 2026-08-16, outside this pass | — |

### Every claim the machine refuted in shipped content

Measured with `make expression-census` over 827 authored spine positions / 56 packs. All were
true when written.

| File | Shipped claim | Measured 2026-08-16 |
|---|---|---|
| `content/shapes/doubled-c-pawns.json` | orphan; trigger fires 0 of 694 | **referenced** by `nimzo-doubled-c-pawns`; fires **8 of 827** |
| `content/shapes/iqp-black.json` | orphan; 0 of 694; *"the killing conjunct is the isolated black d-pawn at 1 of 694"* | **referenced** by `iqp-black-tarrasch-defence`; fires **7 of 827**. The conjunct decomposition explained a zero that no longer exists |
| `content/shapes/maroczy-bind.json` | orphan; 0 of 694; *"a white pawn on c4 never co-occurs with either half-open file"* | **referenced** by `maroczy-bind-white-squeeze`; fires **10 of 827** — all 10 are exactly that co-occurrence |
| `content/shapes/open-centre.json` | *"corpus firings 1 of 694 (the single trajectory-qgd-exchange-minority spine position)"* | **16 of 827** across four packs |
| `content/shapes/fianchetto-g7.json` | *"the trigger fires 44 times, all 44 through the unmirrored arm and 0 through the mirror … g7-d4 clear fires 0 … the blocker is d4"* | trigger **95**, mirror **10**; **g7–d4 clear fires 5**, not 0. Segment walk over the 86 Bg7 positions: f6 **86**, e5 **23**, d4 **5**, c3/b2/a1 **0** |
| `content/drafts/grunfeld-exchange-fianchetto.json` | *"the seven positions this pack authors"*; cites *"g7-d4 clear fired 0 times"* | the pack authors **8**; g7–d4 clear fires **5** corpus-wide, **2 of them this pack's own first two positions** |
| `content/drafts/nimzo-doubled-c-pawns.json` | *"that line … is now out of date; this pack does not edit it"* | true, and now closed — the line is corrected |
| three `SUPERSEDED 2026-08-15` notes | denominator **791** | **827**; every numerator in all three unchanged |
| `content/shapes/pawn-opposition-key-squares.json` | 33 of 694 (9 + 24) | **33 of 827**, same split — substance intact, denominator only |
| `iqp-black` + `maroczy-bind` sibling reading | *"carlsbad fires 41 and iqp-white 4"* | carlsbad **still 41**; iqp-white **12** across three packs |

**A limit found while re-measuring, recorded rather than papered over.** Of the 5 positions
that now reach `g7–d4 clear`, **2 have a white pawn on d4** (`grunfeld`) and **3 have a white
knight** (`maroczy-bind-white-squeeze`); none has it empty. So `black-long-diagonal-pressure`'s
prose — *"trade or lever away the central pawns in the bishop's path"* — **does not describe
the obstruction in 3 of the 5 closest positions in the corpus**. Stated in the entry. No
replacement claim was invented and no signature was changed to make the number move.

### Changed

- `content/witnesses/expression-witnesses.json` — four witnesses across two new keys
  (`knight-vs-bishop.json#/trigger`, `#/plans/1/success/signature`). Both lines were **played**
  through the harness, not assembled; none was refused.
- Ten shape entries, prose and version only: `knight-vs-bishop` 0.1.2→0.1.3, `fianchetto-g7`
  0.2.1→0.2.2, `doubled-c-pawns`/`iqp-black`/`maroczy-bind`/`open-centre`/`up-an-exchange`/
  `vancura` 0.1.2→0.1.3, `hanging-pawns` 0.1.1→0.1.2, `pawn-opposition-key-squares`
  0.2.2→0.2.3.
- Two pack `sources` notes: `nimzo-doubled-c-pawns`, `grunfeld-exchange-fianchetto`.
- **No trigger, no plan signature, no objective, no spine move and no deviation class was
  edited anywhere.** Every change is a measured claim corrected to what the instrument says.

### Before / after census

`make expression-census` run before and after, same corpus both times (56 packs / 827
positions, unchanged during the pass).

| Total | Before | After |
|---|---|---|
| `subjects` | 192 | 192 |
| `unsatisfiable` | **0** | **0** |
| `satisfiabilityUnknown` | 23 | **22** |
| `neverFiresInCorpus` | 30 | 30 |
| `firesOnlyOutsideShape` | 39 | 39 |
| `inShapeDenominatorEmpty` | 19 | 19 |

Subject-level diff: **exactly one subject changed** — `knight-vs-bishop.json#/trigger`,
`unknown` → `satisfiable`, on a witness basis, coverage unchanged at 0. Nothing else moved,
which is the intended result for a pass that corrected prose and added witnesses.

Regression: `make shape-check` green on **25 of 25** shapes with
`CORPUS=content/drafts,content/packs`; `make pack-check` green on **56 of 56** packs.

### Cost — six categories, `agent-*` clock

```
## 2026-08-16 — content wave F second pass, session 1
research 35 · encoding 30 · engine-validation 40 · review 0 · revision 15 · tooling-friction 25
```

Total ~145 min. `engine-validation` here is corpus validation, not engine: the baseline census,
**18 bare-expression census runs** for the arm and segment decompositions, the witness
verification runs, and the 25-shape / 56-pack regression sweep. No Stockfish, Syzygy or Maia
call was made and none is claimed. `tooling-friction` **25 of 145 = 17%**, below the ~25%
tooling verdict line — compare wave F 7.7%, middlegame ~14%, explorer ~27%, citation pass ~30%.
`revision` is 15 because two decisions were reworked after measurement, both recorded below.

### Frictions, with time cost

1. **Nothing answers "which shape entries are orphans"** (~8 min). D44 is a standing ledger
   row and every wave that touches it hand-rolls the reference walker. The census enumerates
   shape *subjects* but never the pack→shape reference edge, so a `shapes` / `shape` field walk
   had to be written again. This is the eighth-walker problem the brief warns about, one level
   over from the expression walker the census did fix.
2. **No target decomposes an expression into its arms** (~7 min). Answering D76 meant hand-
   writing 18 sub-expression files and invoking `EXPR=` 18 times. `make expression-census`
   already walks the corpus; a `--decompose` that reports per-conjunct and per-arm coverage for
   one subject would have replaced all of it, and both the 2026-08-15 wave and this one built
   the same thing by hand.
3. **A witness under a corpus-basis subject is silently never exercised** (~5 min, and it cost
   a revision). The two witnesses added under `knight-vs-bishop#/plans/1` are **not evaluated**
   by the default run, because the fan fires 9 times outside the shape and the corpus basis
   wins — so `satisfiability.witnesses` is absent and an illegal line there would go undetected.
   They were verified only because the conjunction was run explicitly. The entry now says so in
   writing. **This is the shape of D105 applied to witnesses: something committed that nothing
   can see.**
4. **`make expression-census` still prints its whole report to stdout** (~3 min). `OUT=` is
   the workaround and was used throughout, as the previous wave also recorded.
5. **The staleness itself had no detector** (~2 min to conclude, and it is the finding).
   Nine entries stated *"0 of the 694 authored spine positions"* with no corpus size, no pack
   count and nothing that could notice the corpus had moved. See the contract gap below.

### Contract gaps

- **A measured claim in content has no machine-readable denominator.** Every one of the ten
  refuted claims above was prose of the form *"N of 694"*. Nothing links the number to the
  corpus it was measured against, so nothing can flag it when the corpus grows — the entire
  finding of this pass would have been a lint rule if measured claims carried
  `{ measuredAt, packs, positions }`. **This is the same subject as D103** (a shape entry has
  nowhere to record why its trigger says what it says) and argues that D103's `triggerNote`
  should be a *measurement* record rather than a free-text note. Both are blocked on the same
  `additionalProperties: false` in the shape-entry schema, which is outside a content wave.
- **`FIRES_ONLY_OUTSIDE_SHAPE` is the comparative form that carries a defect** (the ledger's
  own words) and there are **39** of them, unchanged by this pass. None was triaged here.

### Not done, deliberately

- **No signature, trigger, objective, spine move or deviation class edited.** D43 and D44 both
  resolved to coverage facts; under the standing rule neither justifies a change, and none was
  made to improve a number.
- **No deviation class reclassified.** They are objective-relative
  (`rfc/archive/content-sourcing-foundation.md`) and no evaluation separates them.
- **No orphan given an invented `prospective` reference** to look owned — the same restraint
  `41afe00` recorded.
- **No `design/`, `rfc/`, `docs/`, `apps/`, `packages/` or `archive/` file touched**, and
  nothing committed.

### Blocked, and it needs someone with ledger authority

The whole cluster's flow-back is missing and this pass cannot write it. **`design/BACKLOG.md`
D75, D76, D43, D44 and D55 should flip**, with the dispositions measured above: D75 and D76
fixed by `41afe00` and re-verified at 56 packs; D43 and D44 resolved as coverage facts, with
D44's headline corrected from **9 of 25 to 4 of 25**; D55's convention residual discharged by
the shipped census, which reports both denominators. `planning/work-register.md` §2 should stop
describing cluster F as never launched. **And the generalisable finding is the one worth
routing:** a content wave has no completion protocol, which is exactly why this cluster shipped
its fixes and lost its rows — the RFC protocol's ledger-and-log clause has no content-tier
counterpart.
