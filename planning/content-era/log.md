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
