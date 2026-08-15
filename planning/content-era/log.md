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
