# Codex queue — refreshed 2026-08-16 (engine-leverage defects fixed)

**D194 verified fixed by claude, and your remedy was the better one.** Barriering
`opponent.move_selected` outright — which is what I would have specified — would have stopped
the opponent-s move reaching the client and broken play. Projecting the payload instead is
right. **One follow-up, small, take it on your next touch of that file: D235.**
`publicSelectionEvent` strips by **spread-minus-two**
(`const { scoreCp: _scoreCp, wdl: _wdl, ...publicCandidate }`), so it enumerates what to
*remove*, not what to *keep* — and a third measurement on `SelectionCandidate` would be public
the moment it exists, with no test failing. That is D194-s failure mode one layer in.
`projectPackDocument` and `PackSummary` already build public objects field by field; copy that.
While you are there, note the strip leaves `mass` — the Maia policy mass — in the public
event, while `pivotal.ts` gates the same quantity behind `humanSplit` when it renders it.

**D236 recorded from your Maia run**: candidate WDL sums to exactly **1000**, so the encoding
is per-mille. Criterion 21a existed to report that rather than assume it, and it worked. It is
now a citable constant instead of a number in a test log.

**D233 — you are right that it needs an RFC.** Direct selection-response leakage is an API
contract question, not a defect fix, and it is registered as such.

## 0. Take these now — two accepted RFCs

| # | RFC | Claims | Notes |
|---|---|---|---|
| 1 | `rfc/vocabulary-wiring.md` | **pack 0.24** | **Accepted 2026-08-16.** Q1 and Q8 owner-ruled, Q9 closed against `planning/work-register.md` §4a. **Read the open questions rather than grepping them** — superseded *"resolve before `accepted`"* strings inside preserved original text are struck through and labelled, because that search gave you a false clear on this RFC once. Merges `plan_consequence` into a `plan_signature` expression leaf and publishes the selection rule D89 says is missing |
| 2 | `rfc/format-surface.md` | **pack 0.25** | **Accepted 2026-08-16.** Two owner rulings are applied **throughout the body**, not just in the questions — I had left four sites saying the opposite and fixed them. **`arrows` is `unmeasured`, NOT retired, and the `<select>` STAYS**: `design/05` promises arrows-for-sight, and legs (a) learner-drawn and (b) host-relayed belong to `board-annotation`. **`formatDispositions` does NOT go on `/capabilities`** — it ships with the schema, because a pack format is a property of the schema version, not the deployment |

**Pack lane order is 0.24 then 0.25.** `DRILL_PACK_SCHEMA_VERSION` reads 0.23 at HEAD.

## 1. The authoring-instrument batch — still yours, still the content unblocker

- **D121** — `make shape-check PROBE=<fen>` computes the probe and prints nothing. Three
  agents each rebuilt the same evaluator over one missing print; highest ratio in the ledger.
- **D149** — `explorerUrl` hard-codes `moves=12`, so a deviation outside the twelve
  most-played can be bounded but never counted. At `moves=40` two packs measured exactly **0**,
  a materially different sentence from "fewer than N".
- **D152** — `make expression-census` is blind to corpus grounding: identical in all nine
  fields before and after eleven packs gained 16 `corpus_observed` claims.

## 2. Migration numbering — a register rule changed under you

**Migration numbers are now assigned at LANDING, not at claim** (`rfc/README.md`). `storage.ts`
skips with `if (migration.version <= version) continue`, so a database that reaches N skips
every lower migration landing afterwards, silently and permanently. I created exactly that
hazard by telling `board-annotation` to claim 23 while 22 was unlanded. **A draft now claims a
position in the landing order; the number is `STORAGE_VERSION + 1` at the moment it lands.**

## 3. Ledger ids — the block convention was amended

Blocks are now **registered in `design/BACKLOG.md` when issued**, with a table in the file.
Previously they lived only in agent briefs, which is why you took D203 — correctly following
*"next free above the highest issued block"* for a block you could not see. Renumbered to
D233. **The hole was the convention-s, not yours.**

## 4. Closed — D140 landed in `a452abb`

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
