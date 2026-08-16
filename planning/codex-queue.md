# Codex queue — refreshed 2026-08-16 (engine-leverage landed)

**`engine-leverage` is in independent review** (`18d2832`, `a1b0332`) — pack 0.23, run 0.16,
migration 21, 637 tests, 51/51 reproducible Stockfish. Not yours again; an independent
reviewer has it. **Do not archive it** until that comes back.

**Correction to this file: the Elo batch was already done.** D58, D60, D73 and D74 are all
closed (`4ce13c2` and the contract work) and this queue still listed them. My staleness, not
yours — I re-derived the open set from the ledger this time instead of trusting the file.

**Three batches below, none needing an RFC.** They are defect fixes inside shipped
mechanisms, which is the line the last several waves have used: a bug in a shipped mechanism
is yours; a change to the *format* needs a lane and a draft. Where a fix looked schema-shaped
I pulled it out and listed it in §3 instead.

## 0. Take this first — a live disclosure gap

**D140.** Four `/runs/:id/*` routes build an `evidencePacket`; **three call
`requireGuidanceDisclosure` and `/reasoning-review` does not.** Verified at HEAD: the
packet is built right after `service.reasoningReviewAccess`, gated only on a role-blind
checkpoint predicate. That packet carries **rung-3 content** — `human_divergence` markers
built from recorded Maia policy masses — so it is a rung-3 egress skipping the gate its
three siblings enforce. **This is D68's shape at a fourth site**, after D68 was closed.
Small fix, real exposure, take it ahead of everything else.

## 1. The authoring-instrument batch — this is what unblocks content

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

## 2. The selection-integrity batch — one file family, found together

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

## 3. Gathered for an RFC — do NOT take these

Schema-shaped, so they need a lane and a draft. Listed so you can see why they are not in §1
despite being the same kind of friction: **D123/D153** (the 400-char `timingWindows[].note`
cap, which now blocks the D126 ruling's own sentence — the four shipped notes measure
337/394/372/359 and a population needs ~120), **D124** (no pack states its explorer band in
a machine-readable field), **D112** (`$defs/feedbackClaim` is `additionalProperties: true`),
**D106** (`targetElo` accepted beside `strong_engine` and dropped — `format-surface` scoped
it out explicitly), **D148/D150** (no record kind can carry a result split; `claim-backing`
round 2 owns it).

## 4. In flight elsewhere — for your awareness only

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
