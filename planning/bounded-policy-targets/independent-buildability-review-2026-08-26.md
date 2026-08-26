# Bounded policy targets — independent buildability return

**Reviewed:** 2026-08-26

**Reviewer:** codex

**Document:** `rfc/bounded-policy-targets.md` after the [[D1411]] amendment
**Verdict:** **RETURNED.** The D1023 research gate remains sound and the exact rules question is
worth implementing. The current provider and registration contract is not safe to implement.

## Method

The pass re-derived the draft against the committed D1023 artifacts and the current production
boundaries rather than inheriting the earlier cross-review:

- `compileEvidenceManifest`, the literal catalogue rows and exact evidence adapters;
- `OpponentSelector`'s Maia request, cache identity and `human-split` REST receipt;
- `EvidenceQueue`/engine-supervisor identity and the shipped legal-move authority;
- capability/availability compilation and the proposed eight-file implementation surface;
- every proposed acceptance criterion that claims a source table is complete or a projection is
  buildable.

The measured result survives unchanged: exact target removal/return must remain separate from
Stockfish search, Maia policy, strategic meaning and move quality. The draft is returned because
the production types collapse those authorities after the research correctly separated them.

## What survives

- One exact attacker/victim/capture identity, three plies, separate immediate, exists-exists and
  exists-for-all facts, witness/refutation lines and a hard visited-position cap are the right
  rules primitive.
- The destination-denial result is a negative and should remain a permanent negative fixture; no
  generic `prevention`, `prophylaxis`, `intent` or `plan` classifier is earned.
- Depth disagreement, missing Maia mass, identity loss and budget exhaustion must abstain rather
  than be coerced into a fact.
- Stockfish and Maia are separate opinions over the rules target. Neither may become the target's
  meaning, selector or learner sentence merely because it is available.
- All six proposed projections may initially remain inspector-only. That is honest foundation work
  provided the registered provider operations can actually execute and their identities are true.

## Blockers

### 1. The Stockfish source record already contains the target interpretation ([[D1652]])

`live.stockfish.target_policy@1` is called a source record, but its promised payload already says
`nextExecution` and `secondOpportunityAvailable` for one named rules target and candidate. Those
booleans are not bytes emitted by Stockfish. They are a derivation over an exact-FEN/depth legal-root
table, target identity, candidate and continuation convention.

Keep the live record node-free and generic: exact request FEN, requested bound/depth, complete
per-legal-move rows, typed score/PV and same-exchange engine receipt. Derive the target category in
`derived.bounded_target` while retaining that raw record and the exact rules target/counterfactual.
The same raw table can then serve candidate scoring and Review without duplicating an interpreted
source for each consumer question.

### 2. The shipped Maia page cannot identify hypothetical policy nodes ([[D1653]])

The draft reuses `human.maia.policy@1`, whose operands are
`nodeId, engine, targetElo, candidates`. The bounded expansion needs a root plus up to eight
hypothetical second positions; those positions are not run nodes and `HumanSplitPage` carries no
FEN, history, sampler parameters, request digest or applied model receipt.

This is not cosmetic. Production Maia receives `position fen <startFen> moves <historyUci...>`.
Two histories reaching the same board need not have the same policy, while hypothetical expansion
requests may deliberately start from an exact FEN with no history. Define one generic node-free
Maia policy source over its complete request identity—position/history convention, model and
applied band, temperature, top-p, requested width and returned candidates—then derive the run's
`human-split` occurrence separately. Do not attach invented node ids to counterfactual positions or
call a FEN-only query equivalent to the live history-conditioned policy.

### 3. The six F1 declarations are prose, not compileable declarations ([[D1654]])

Section 6.1 publishes only producer, projection, role, grounding and exactness. It does not publish
literal `payloadType`, semantics, operands, signs, confidence, answer content, forms, abstention,
limitations, dispositions or complete `dependsOn`/`derivation` members for any of the six ids.
Section 6.2 consequently argues that the compiler forces a result it cannot test from the RFC.

This matters twice. First, the current compiler validates exactness, grounding, answer content and
abstention but does **not** enforce weakest-input confidence; a provider-derived row can still be
declared `exact`. Second, the Stockfish and Maia rows currently blur source and derivation, so there
is no truthful input graph to compile. Publish the exact proposed catalogue image, compile that
image through the real manifest, and add a confidence-widening negative alongside the existing four
widening checks.

### 4. The provider code has no production operation or composition path ([[D1655]])

The implementation table adds `apps/server/src/bounded-target-policy.ts` but names no application
composition, engine/Maia client injection, internal operation, request type, service/route/worker
entry, queue identity, cancellation/timeout rule or caller. Updating an implementation path in the
manifest proves only that a file exists. It does not make either provider arm executable.

Specify literal server operations for the raw Stockfish table, raw Maia page and bounded derivation;
name who constructs them and who may request them even while every learner binding remains absent.
If this RFC intends only offline/permanent-fixture work, narrow the claim and do not register live
availability. Otherwise the implementation surface must include the actual composition root and
execution path.

### 5. Root-table completeness compares two provider-owned counts ([[D1656]])

`moves === entryCount` can be true for a table missing the same legal move from both fields. It is a
self-consistency check, not completeness. The repository already has an independent authority:
`exactLegalMoves(fen)` under the canonical move-identity convention.

Require set equality between the exact legal UCI set and the Stockfish table's unique root moves at
each depth, plus requested-depth reach for every row. Fixtures must omit one legal move while keeping
the two counts equal, duplicate/replace a move, and exercise castling and promotion identity. This
prevents a 308/308 green result produced by the same omission on both sides of the assertion.

### 6. The rules producer would recompute registered inputs without retaining them ([[D1657]])

The draft says it “adds no detector” and derives targets from
`rules.tactic.consequence.threat@1` and `rules.exchange.predicate.legal_exchange@1`, but the
implementation table instead calls `threats`/`legalExchangeForMove` directly and the registration
table gives no literal derivation members. That creates a second target authority: one sealed
registered threat can travel beside a separately recomputed bounded target with no identity join.

Compile the named-target projection from the admitted threat/exchange items, retaining their exact
before-FEN, attacker, victim and capture identity. Immediate and bounded-return projections then
derive from that sealed target plus their declared position/line authorities. An input mutation or
cross-position target swap must fail rather than merely produce a different digest.

### 7. Multi-node provider work has no bounded scheduler or cache identity ([[D1658]])

One row can cost two complete Stockfish depths and up to nine Maia calls. The draft gives measured
latency and says no hover may trigger it, but it does not bound concurrent requests, retained work,
deduplication, retries or stale results. A Review consumer can later multiply this by every target
on every node; “explicit request” is not a resource bound.

Define one request identity per raw provider exchange, FEN-level deduplication only where complete
request identity permits it, a maximum outstanding/retained-work budget and terminal cancellation
semantics. Actual engine/model identity must come from the same exchange, reusing [[D1647]] rather
than constructor snapshots. Also repair [[D1390]] before declaring the derived provider-backed
producer `sync`; manifest latency is a product input, not a prose footnote.

## Required amendment order

1. Split generic raw Stockfish and Maia source records from named-target derivations (D1652/D1653).
2. Publish literal F1 declarations, including weakest confidence and exact retained inputs
   (D1654/D1657).
3. Define complete legal-root set equality and same-exchange provider identities (D1656/D1647).
4. Name the real operations, composition root, request/cancellation protocol, scheduling and cache
   bounds (D1655/D1658/D1390).
5. Re-run the existing D1023 fixture population through the resulting production symbols. Preserve
   the negative destination result and all typed abstentions.
6. Repeat independent buildability review before acceptance or implementation.

## Able-to-fail fixtures owed by the amendment

- a live Stockfish record containing `nextExecution` is impossible to declare; the derived target
  category retains both a raw legal-root table and an exact named target;
- equal FEN with different Maia histories/request conventions cannot alias, while deliberately
  identical hypothetical exact-FEN requests may deduplicate;
- all six literal declaration rows compile, and changing a provider-derived confidence to `exact`
  fails;
- the named-target adapter refuses a threat/exchange item from another position or target identity;
- a root table with `moves === entryCount` but one legal move replaced is incomplete;
- no provider operation exists solely as a manifest anchor: the named production operation reaches
  its composed client and returns a sealed raw source/derived receipt;
- bursts above the declared bound stay bounded, cancel stale work, and never relabel results from a
  restarted engine or changed Maia model.

No owner ruling is required. Open question 1 remains a later bot-consumer choice and does not block
this collector foundation. No production, schema, content or protected design byte changed in this
review.
