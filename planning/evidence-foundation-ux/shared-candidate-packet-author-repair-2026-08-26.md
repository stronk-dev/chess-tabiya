# Shared candidate packet — D1631–D1636 author repair handoff

**Target:** `rfc/shared-candidate-evidence-packet.md`

**Authority:**
`design/research/shared-candidate-packet-contract-closure.md` and
`tools/d1631-candidate-packet-repair-harness/`. No owner ruling is required; this is a technical
repair of the independent return. Do not implement from this handoff. Amend, cross-review, accept
only if buildable, then queue implementation.

## Required author changes, in order

### 1. Repair terminal identity ([[D1631]])

- Replace `terminal?: checkmate | stalemate | insufficient_material` with
  `status: playable | no_legal_moves(checkmate | stalemate)`.
- Derive exact legal moves first. Non-empty always means `playable`, including insufficient
  material and fifty/repetition-adjudicated positions.
- Put `GameAdjudication` outside the packet; include explicit insufficient-material, fifty-move and
  threefold fixtures.
- Do not use `position.isEnd()` as packet emptiness authority.

### 2. Publish the three cache identities ([[D1632]])

- Packet: canonical full FEN + legal/move conventions + manifest + compiler + scope.
- Provider: provider/engine/model + exact normalized request bytes, including start/history,
  options and bound.
- Policy: packet id + admitted provider receipt/output digest + profile/policy/seed and all authored
  inputs.
- Keep the current history-shaped `selectionCacheKey` for the existing combined final cache and
  make its single-flight map a bounded configurable LRU. Do not rekey it on packet id in this RFC.
- State that later provider/policy cache separation belongs to the live bot integration.

### 3. Narrow the executable landing to real operations ([[D1633]])

Name these literal first-landing operations:

- `CandidatePopulationCompiler.compile(beforeFen, scope, signal?)`;
- `CandidatePopulationCache.get(request, signal?)`;
- `CandidatePopulationService.get(request, signal?)`;
- `selectLocalSemanticEvidenceFromPopulation(packet, playedMove, policy)`;
- `semantic-evidence-check.ts` as the first actual composition root;
- `candidateFeatureVector` refactored to consume the packet but still explicitly not live;
- bounded `OpponentSelector.#cache` with current key retained.

Delete first-landing claims for `createApplication` injection, a live bot consumer, a server REST
semantic operation, Guided Hint and Review. Add discharges: the first live consumer RFC constructs
one service in `createApplication` and shares it with every live consumer landing in that wave.

Cancellation is cooperative between candidate rows; abort/rejection is not memoized. Provider
timeouts never enter packet construction.

### 4. Remove the false F1 wrapper ([[D1634]])

- Delete `derived.candidate@1`, `derived.candidate.event_population@1`, its derivation tuple and its
  two consumer bindings.
- Define a private-symbol/process-sealed, deeply frozen `CandidatePopulationReceipt` containing the
  original legal-move evidence, semantic events and declared readings.
- State explicitly that it is an internal container/index, not a chess assertion, never renderer or
  LLM input.
- Every consumer continues to admit the exact constituent projections it uses through F1. The
  receipt is passed beside those views only to index the complete population.
- Add must-fail copy/spread/JSON/brand-forge tests and reference-identity retention tests.
- Retain manifest compilation of the constituent declarations. Do not invent a generic aggregate
  derivation or generic-payload adapter.

### 5. Publish both literal closures ([[D1635]])

- Export a code-derived 47-id `LOCAL_CANDIDATE_EVENT_PROJECTION_IDS` from the exact nine collector
  groups named in the dossier.
- Export a 22-id reading identity closure: current 20 constructors plus conditional
  `legal_exchange` and `fork_survives_reply`.
- Preserve occurrence multiplicity and original references.
- Require sorted id@version multiset equality between current and repaired vector results on the
  four harness fixtures: ordinary, capture, double attack and abstention.
- The packet retains all 47 events; a consumer may intersect with its own declared allow-list.

### 6. Separate White score from root comparison ([[D1636]])

- Keep `live.stockfish.position_eval@1` node-free, White-perspective, typed cp/mate with exact FEN,
  engine identity and fixed bound.
- Define the White→root projection for both colors.
- Define cp loss and the four typed mate relations exactly as the dossier does.
- Require set-wide engine/bound equality, positive safe-integer mate distance, and exact after-FEN
  equality.
- Mixed cp/mate and measurement mismatch abstain for the whole comparison.
- The cp guard consumes cp loss only; Review consumes the original White source only.
- Never place `scoreFrame: root_side` next to an unprojected White item.

## Implementation surface to derive in the amended RFC

At minimum:

1. `packages/runtime/src/candidate-population.ts` (new)
2. `packages/runtime/src/semantic-evidence.ts`
3. `packages/runtime/src/evidence-catalog.ts` (closure constants and deletion/correction of false
   aggregate declaration, not a new wrapper)
4. `packages/runtime/src/evidence-contract.ts` only if a real compiler defect is independently
   proven; no widening is authorized by this handoff
5. `packages/runtime/src/index.ts`
6. `apps/server/src/candidate-evidence.ts`
7. `apps/server/src/semantic-evidence-check.ts`
8. `apps/server/src/opponent-selector.ts` (bounded existing final cache only)
9. `apps/server/src/evidence-consumer-operations.ts` / runtime operation census if function names
   change
10. focused runtime/server tests, closure check, docs and Makefile target

`application.ts`, REST routes, web UI and schema files are **not** first-landing files unless the
amendment names a real live consumer authorized by its own accepted RFC. If any schema file becomes
necessary, stop: the current `tabiya-claims: none` decision is no longer true.

## Able-to-fail acceptance additions

Carry the eight harness arms into permanent tests and add:

- packet receipt copy/spread/JSON/forged-brand refusal;
- every retained semantic event passes its original seal and is reference-identical;
- exact closure additions/removals fail set equality;
- current final cache evicts LRU settled entries while keeping in-flight single-flight and deleting
  rejected flights;
- two histories with equal final full FEN share a packet but not provider/policy keys;
- `semantic-evidence-check` executes through the service rather than constructing alternatives;
- source census proves no claimed live consumer is missing and no unclaimed live consumer exists;
- Node-24 cold/warm and weighted-cache receipt rerun against production symbols;
- `register-check` C1–C8 green and no schema byte changed.

## Refusals

- no game-adjudication bit inside factual population identity;
- no Maia/history input inside the packet;
- no packet-id-only final bot cache;
- no evidence wrapper whose derivation omits retained inputs;
- no mate-to-cp conversion;
- no raw packet renderer/LLM path;
- no claim that a constructor, manifest anchor or unused injection is a production consumer;
- no live Support/Review/bot integration smuggled into this foundation amendment.

After the author changes, commission a fresh independent buildability review. Implementation stays
blocked until that review passes and the RFC is accepted.
