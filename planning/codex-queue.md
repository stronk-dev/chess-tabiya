# Codex queue — refreshed 2026-08-16 (engine-leverage RETURNED)

**STOP the batches below. `engine-leverage` is returned with a list, and one item is the
doctrine.** Independent review re-ran both gates itself (`make verify` and
`ENGINES_REQUIRED=1 make verify` both pass at 637/101, cold-engine reproducibility 10/10 in
fresh processes) — your reported numbers all hold. The defects are elsewhere.

**All four rulings verified HONOURED**, criterion 4 stayed scoped (140 costs: 137 `cp/engine`,
3 `mate/engine`, 4 `unmeasurable`, **zero tablebase-basis**), and migration 21 froze its
literals correctly. That part is clean work.

## 0. D194 — an engine evaluation reaches the learner ungated, during committed play

**Verified independently by claude.** `§5.1`'s `candidateLines` change parses `score cp` for
every caller including `#strongEngine`; `SelectionCandidate` now carries `scoreCp` and `wdl`;
`opponent.move_selected` carries `selection: OpponentSelection`, which carries those
candidates; and `engineFeedbackEvent` — the barrier in `publicEvents` — matches only
`evidence.attached` and machine-ref `objective.state_changed`. **`opponent.move_selected` is
not barriered.** So `GET /runs/:id/events` serves Stockfish's centipawn score for positions
during committed play, before disclosure, behind no assistance gate.

**This is the named anti-pattern.** `AGENTS.md` §Rejected: *"an engine review screen with a
rewind button — the failure shape the whole product dies in"*, and ADR-0005's dashboard.
`design/02` §157-158's anti-contamination default says hide the eval bar until segment end or
explicit request. **The RFC's own §7 deviation 3 states the opposite of what shipped**, so
this is not a scope call anyone made — it is a defect.

**Fix the barrier, not the parse.** The scores are wanted; reaching an undisclosed learner is
not. And note D195 while you are there: **24 of 51 recorded `scoreCp` values are
aspiration-window bounds** (`upperbound`/`lowerbound` on the final `multipv 1` line), and 2
carry `score mate` with no `scoreCp` at all — so two of criterion 17's "score agreements" are
`undefined === undefined`. The numbers are both ungated and, as evaluations, unsound.

## 1. D196 — a failed tablebase probe deletes a different instrument's evidence

`#ensureStoryEvidence` builds `failed` from `queue.failures(run.id)` keyed by **nodeId, not
kind**, while the next line filters `outstanding` by `job.kind === "eval"`. One
`TABLEBASE_UNAVAILABLE` therefore permanently blocks the **Stockfish** eval for that node and
marks the path ready. Two instruments, one failure key.

## 2. D193 — the register is a table nothing checks, and it is already short

`assertAdvertisedCapabilityDispositions` has **one call site in the whole tree**:
`capabilities.test.ts`, handed a hand-authored six-name list built to match the register. It
is wired to no handshake and to no real engine. Diffed against the Stockfish 18 the repo's own
tests use, **eight advertised options have no disposition row** — `Debug Log File`,
`NumaPolicy`, `Move Overhead`, `UCI_Chess960`, `SyzygyProbeDepth`, `Syzygy50MoveRule`,
`EvalFile`, `EvalFileSmall`. Wired to a real engine it throws. Criterion 26 has no test at all
(`expect.any(Array)` passes on an empty register).

**This is the third register in a row to pass vacuously** — `format-surface`'s gate rejected
its own seed rows and an empty register passed every clause. Treat "the register is checked"
as a claim needing a real call site, every time.

## 3. Normative clauses that did not land

- **D197** — §3.6's producer budget: no queue-emptiness check, no yield to the interactive
  path, no drop-on-full. Rejected probes land in `#failures`.
- **D198** — the desugaring shipped as **two independent copies**, which is the one thing
  §3.1 made normative against (*"one shared helper, used by all three sites"*), plus a
  duplicated `CATEGORY_RANK` in `guard.ts` instead of reusing `sourcing/tablebase-category.ts`.
- **D199** — `guard.overrides` silently reorders authored `conditions`, breaking §3.4's
  declared-order firing rule.
- **D200** — declaring `conditions` silently kills an authored `evalSwingCp`/`fireOnMate`,
  with no lint and no refusal.
- **D201** — the cost checker cannot see the provenance rule it enforces, and `comparable`
  compares mate/category costs by `JSON.stringify`, which is key-order sensitive over
  author-written JSON.
- **D202** — the per-move explorer split renders to 0.1% with **no per-move sample floor**;
  the 100-game abstention is position-level only.

**Two criteria were never executed by either gate:** 21a and 22 live in
`maia.maia.integration.ts`, which `vitest.config.ts` excludes — they run only under
`pnpm test:maia`. Criterion 21a's whole purpose was to *report* observed `wdl` sums so a later
RFC can pin the encoding, and no sums are reported anywhere. Criterion 16's fixture-realism
registration is also unmet: `instrument-fed.fixture-register.json` holds one entry and its gate
scans only `practical-difficulty.ts`.

**Do not archive `engine-leverage`.** Fix D194 and D196 first — those two are shipping
defects, not polish.

## 4. Then: a live disclosure gap

**D140.** Four `/runs/:id/*` routes build an `evidencePacket`; **three call
`requireGuidanceDisclosure` and `/reasoning-review` does not.** Verified at HEAD: the
packet is built right after `service.reasoningReviewAccess`, gated only on a role-blind
checkpoint predicate. That packet carries **rung-3 content** — `human_divergence` markers
built from recorded Maia policy masses — so it is a rung-3 egress skipping the gate its
three siblings enforce. **This is D68's shape at a fourth site**, after D68 was closed.
Small fix, real exposure, take it ahead of everything else.

## 5. The authoring-instrument batch — this is what unblocks content

Every row here cost a content agent real time this week, measured. The owner's priority is
content velocity, and these are the friction.

- **D121** — `make shape-check PROBE=<fen>` **computes the probe and prints nothing**
  (`shape-check.ts` passes `probeFen` in and drops `probeMatches`). **Three separate agents
  each rebuilt the same disposable evaluator** because of one missing print, ~30 agent-minutes
  for a one-line fix. Highest ratio in the ledger.
- **D149** — `explorerUrl` **hard-codes `moves=12`**, so an authored deviation outside the
  twelve most-played can be *bounded* but never *counted*. At `moves=40` two packs' deviations
  measured exactly **0**, which is a materially different sentence from "fewer than N".
- **D152** — `make expression-census` is **blind to corpus grounding**: identical in all nine
  fields before and after eleven packs gained 16 `corpus_observed` claims. The repo's only
  corpus-wide content instrument cannot see rung-4 evidence, so a grounding wave looks
  exactly like a wave that did nothing.

## 6. The selection-integrity batch — one file family, found together

All four came out of `format-surface`'s cross-review while verifying the same code path, and
routing them into one change is the point.

- **D107** — `selectorMode` **rewrites an authored mode by name, in the browser, with no
  record**, and `compatibleAppliedMode` has an arm for `theory_strict` and none for
  `strong_engine`.
- **D108** — `sameEngine` **omits `eloApplied`**, so selection reuse can straddle an Elo
  change. Sibling of the already-closed D95.
- **D109** — the two `SelectMoveRequest` builders **disagree about `policyConfigDigest`** for
  the same run.
- **D117** — `/capabilities` **advertises three opponent modes without checking any engine
  exists**: it gates `perfect_tablebase` and `practical_resistance` on provider availability
  and publishes `human_common`, `strong_engine` and `theory_strict` unconditionally. The
  declared-vs-executable law on the capabilities payload itself. *(Note: the owner ruled
  `formatDispositions` off `/capabilities` partly on the strength of this row, so the two are
  related but separate — this one is the false advertisement, not the siting.)*

## 7. Gathered for an RFC — do NOT take these

Schema-shaped, so they need a lane and a draft. Listed so you can see why they are not in §1
despite being the same kind of friction: **D123/D153** (the 400-char `timingWindows[].note`
cap, which now blocks the D126 ruling's own sentence — the four shipped notes measure
337/394/372/359 and a population needs ~120), **D124** (no pack states its explorer band in
a machine-readable field), **D112** (`$defs/feedbackClaim` is `additionalProperties: true`),
**D106** (`targetElo` accepted beside `strong_engine` and dropped — `format-surface` scoped
it out explicitly), **D148/D150** (no record kind can carry a result split; `claim-backing`
round 2 owns it).

## 8. In flight elsewhere — for your awareness only

`claim-backing` round 2 (claim routing to rung 5 + a principle registry), `pack-graduation`
(D162 — **production serves one pack, and it is the schema example**), `board-annotation`
(the owner's arrows ruling, legs a and b). `format-surface` is accepted pending a body edit
I owe it from the arrows ruling. `vocabulary-wiring` needs one destination recorded before it
is yours.

## Protocol reminders

- **The ledger flip rides in the implementing commit**; **the exploration-log entry rides
  in the archiving commit.** You did both on `2d0f7be`.
- **`design/BACKLOG.md` is a shared ledger, not an intent doc.** Law 5 protects
  `design/00`–`06`.
- Cite ledger rows by **row title**, never line number. Locate code by **symbol name**.
- Claude's standing error, caught by you three times: **a resolution in a queue file is not
  a resolution in the body** — `deviation-classes`, `fixture-realism` + `live-marker-quality`,
  `engine-leverage`.
- Claude's **third** standing error, new tonight and now twice: **a line-based grep is not a
  reading.** It missed a `"Resolve before \`accepted\`"` that wrapped across a line break,
  and separately inverted a negation into a claim about "23 packs" that had to be withdrawn.
  When I tell you a document contains or lacks something, ask whether I read it.
- Claude's second standing error: **`git add` on shared ledger paths while you have
  uncommitted edits there.** Say so if it happens again.
