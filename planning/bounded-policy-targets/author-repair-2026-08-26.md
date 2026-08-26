# Bounded policy targets — D1652–D1658 author repair handoff

**Target:** `rfc/bounded-policy-targets.md`

**Authority:** `design/research/bounded-policy-target-contract-closure.md`,
`tools/d1652-bounded-target-repair-harness/`,
`design/research/evidence-execution-and-confidence-closure.md`,
`planning/evidence-foundation-ux/f1-execution-metadata-author-repair-2026-08-26.md`, and the
independent return in this directory. No owner
ruling is required. Do not implement from this handoff. Amend/split, cross-review, accept only after
the provider dependency is buildable, then queue implementation.

## Required author decision: split the landing, not the 1.0 obligation

The current six-projection wave crosses three reusable layers. Rewrite it in this dependency order:

1. exact local target derivation;
2. shared Stockfish/Maia/Syzygy provider receipts, scheduler and per-projection execution metadata;
3. target-policy composition.

Preferred shape: narrow the current RFC to layer 1 and draft one shared provider-exchange RFC for
layer 2; layer 3 may be a short follow-on RFC or a clearly blocked later stage. Do not accept one RFC
partially. Do not descope layers 2/3 from 1.0.

## 1. Replace the false Stockfish source ([[D1652]], [[D1656]])

- Delete `live.stockfish.target_policy@1`.
- Register generic `live.stockfish.legal_root_table@1` using the literal source row in the dossier.
- The payload contains canonical full FEN, exact depth bound, all-legal width, normalized request
  digest, timeout contract, same-exchange actual receipt and per-root typed score/depth/PV.
- Normalize engine UCI to `chessops-king-takes-rook@1` before validation.
- Completeness is unique set equality against `exactLegalMoves(fen).map(.uci)` plus reached depth.
- Permanent negatives: equal-count replacement, duplicate, missing row, short depth; positives:
  ordinary, `e1a1`/`e1h1` castling and all four promotion identities.
- Raw payload/source names cannot carry target/execution/opportunity interpretation.

## 2. Add the generic Maia page and migrate run occurrence ([[D1653]])

- Register `human.maia.policy_page@1` using the literal source row in the dossier.
- Request union is exactly `history_conditioned(startFen, historyUci)` or `exact_fen(fen)`.
- Retain requested/actual model identity, applied band, temperature, top-p, width, candidates,
  request/output digests and exchange generation.
- Key every request field. Equal FEN with different history or convention must not alias; identical
  exact-FEN requests may dedupe.
- Do not reuse `HumanSplitPage` for hypothetical nodes and do not invent node ids.
- Add a derived run occurrence joining the raw page to `run.record.position@1`, migrate
  `inspector.human_split`, then retire the old node-shaped source only when no consumer remains.

## 3. Put every target fact on the derived plane ([[D1657]])

- Replace `rules.bounded_target.*` with:
  - `derived.bounded_target.named_material_target@1`;
  - `derived.bounded_target.immediate@1`;
  - `derived.bounded_target.bounded_return@1`.
- `named_material_target` derives from and retains the declared threat and legal-exchange items.
- Join exact passed-position FEN, attacker, victim, capture UCI and literal exchange identity.
- Immediate/bounded-return also take the complete legal-move item for the source position; candidate
  UCI must be present and after-FEN is computed from its canonical identity.
- Cross-position/cross-target/copy-spread substitution must fail.
- Preserve D1023's separate immediate, exists-exists and exists-for-all fields, witnesses,
  refutations, causes, visited count and `budget_exhausted` abstention.
- Do not call `threats()`/`legalExchange()` again inside the derivation adapter.

## 4. Publish literal F1 rows and repair compiler invariants ([[D1654]], [[D1390]])

- Publish every field for the two raw sources, three local derivations and two policy derivations:
  payload, semantics, operands, signs, grounding, exactness, confidence, answers, forms, abstention,
  limitations, dispositions and full literal derivation members.
- Add weakest-input confidence validation to `compileEvidenceManifest`; the completed census has
  49 immediate violations and a four-projection fixed point. A `reported` input cannot become
  `exact` or `not_applicable`.
- Repair [[D1700]] rather than replacing one producer-wide lie with another: compile effective
  availability/latency per projection and per `anyOf` member, retaining the producer scalar only as
  own-operation metadata. The three local target outputs remain sync while the two policy outputs
  retain provider-bearing dependency paths. `derived.grade` cannot advertise effective `sync`.
- Apply [[D1701]]/[[D1702]] exactly as the shared F1 handoff specifies: preserve all 99 current
  expanded path identities, validate provider/source absence at the binding path rather than only
  the immediate producer, and migrate candidate/story confidence transitively before adding new
  target-policy rows.
- Include the node-free `live.syzygy.position_result@1` source required by the promotion-race
  closure; the shared layer serves Stockfish, Maia and Syzygy rather than leaving pawn/Review code
  to invent a private tablebase adapter.
- Add able-to-fail negatives before claiming the declaration image compiles.

## 5. Make identity come from the exchange ([[D1647]])

- Extend the engine execution boundary to return UCI lines plus actual identity, generation,
  normalized request digest and output digest from the same serialized task.
- Increment generation on each successful spawned-engine handshake.
- Cache key uses requested identity; admitted payload uses actual identity.
- Refuse/requeue an identity mismatch and discard any response whose generation changed.
- Never stamp a health or constructor snapshot onto later bytes.

## 6. Name real operations and one shared bounded scheduler ([[D1655]], [[D1658]])

At minimum name:

- `StockfishLegalRootTableOperation.execute(request, signal)`;
- `MaiaPolicyPageOperation.execute(request, signal)`;
- `ProviderExchangeScheduler.get(request, scope, signal)`;
- the application/server composition root constructing them;
- one operator/research caller that actually traverses each operation before learner bindings.

Constructor configuration must require positive max-active, max-queued, weighted-retention and TTL
bounds. Exact complete request keys dedupe; FEN-only keys do not. Rejection/timeout/abort do not
cache. Scope cancellation removes queued work, aborts active work and drops late results. Provider
generation/model changes make retained results stale. The first product consumer supplies and
load-tests deployment defaults; no hover or pointer event may enqueue work.

## 7. Rebuild the two target-policy derivations

- `derived.bounded_target.engine_target_policy@1` derives from raw Stockfish table(s), named target,
  immediate and bounded return. Retain candidate/counterfactual pair and D1023 depth disagreement.
- `derived.bounded_target.policy_bounds@1` derives from raw Maia page receipt(s) plus the same exact
  target facts. Retain request convention, band denominator, mass completeness and expansion
  parameters.
- Both are `reported`, carry provider-bearing effective dependency metadata and are inspector-only.
- Preserve all three Maia absence arms, mass-less refusal, no summing of the two quantities, one
  band per request and the negative destination result.
- Raw provider rows remain reusable by Review, candidate scoring and bots; target interpretations
  live only in the derived rows.

## Acceptance additions

Port all nine disposable arms and require:

- source payload with target interpretation cannot be constructed;
- every literal declaration compiles and confidence/latency widening fails;
- legal-root equal-count replacement/castling/promotion controls;
- history/equal-FEN/exact-FEN request-key controls;
- same-exchange restart/model-change stale-result controls;
- threat/exchange/position/target swap controls;
- actual operation census from composition root to provider client;
- burst/dedupe/queue/weighted-retention/TTL/cancel/retry controls;
- D1023 sealed populations rerun through production symbols with unchanged measured verdicts;
- true cold Maia latency before choosing production defaults;
- zero learner bindings until the relevant module/Review/bot RFC admits each projection.

## Refusals

- no source record containing derived target facts;
- no counterfactual fake node ids;
- no FEN-only Maia cache;
- no provider-owned count used as legal completeness;
- no constructor/health snapshot as exchange provenance;
- no recomputation beside sealed evidence;
- no implicit `sync` derived latency;
- no arbitrary unbounded promise map;
- no strategy/intent/prophylaxis/quality sentence from these mechanics;
- no partial RFC acceptance and no layer 2/3 descope from the 1.0 roadmap.

After amendment, commission a fresh independent buildability review. Production implementation
remains blocked until the exact RFC being implemented is accepted.
