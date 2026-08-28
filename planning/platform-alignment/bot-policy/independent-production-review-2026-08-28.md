# Bot policy production-safety amendment — independent buildability return

**Reviewed:** 2026-08-28

**Reviewer:** codex

**Document:** `rfc/bot-policy.md` after the D1601–D1609 author amendment

**Verdict:** **RETURNED.** The measured layer stack, guarded-trait dependency, server-owned route
direction and honest-card rule survive. Implementation is not authorised from the current
contract. Seven able-to-fail findings are reproduced by
`make bot-policy-independent-review`.

## Method

The pass read the complete amended RFC, the three author-repair handoffs, the D969 production-route
and selection-budget dossier, and the current shared provider and candidate-packet RFCs. It then
traced the live production symbols for:

- Maia request width, provider execution and the current `#humanCommon` path;
- the legal-root Stockfish operation and its exact score/move identity;
- candidate-packet population, cache, scope and score joins;
- `OpponentSelection`, `opponent.move_selected`, `appendOpponentPly` and event replay;
- `RunService.opponentPly`, lease checks and `SQLiteRunStorage.save`;
- the proposed decision record, degradation algebra and determinism criteria; and
- every implementation-surface row that claims acquisition, atomicity, persistence or shared
  evidence consumption.

The review did not edit the concurrent D872 tactical files or untracked `planning/review/` work.

## What survives

The policy stack should remain a catalog, not a definitions table. The three Stage-A behavior
families remain the correct bounded roster seed. The server, not the browser, must own profile
resolution, provider acquisition, seeded composition and append. A pawn preference must never run
when its severe-error guard abstains. Profile copy must describe measured mechanisms and absences,
not invent chess personality claims. Exact-digest calibration, owner use and release-concurrency
measurement remain real completion discharges rather than prose substitutes.

Those decisions are useful. The production boundary around them is not yet one coherent contract.

## Blockers

### 1. The bot forks both shared provider sources ([[D1970]])

The bot amendment sends Maia through `OpponentSelector`'s private acquisition and defines
`stockfish-guard@1` as a new supervised engine request plus receipt. The shared provider RFC now
defines the one scheduler, the `maia.policy_page@1` and `stockfish.legal_root_table@1` operations,
their same-exchange provenance and their sealed `ProviderEvidenceDelivery` projections. It also
forbids private queues, caches and receipt constructors.

The bot needs a bot-local **derived guard view**, not a sixth provider operation. Its production
operation must consume admitted deliveries for `human.maia.policy_page@1` and
`live.stockfish.legal_root_table@1`; the guard projection may select the exact Maia-admitted rows,
derive losses and abstentions, and retain both source identities. The bot policy cache must key on
the complete delivered source identities plus the profile/root inputs. It may not key on health or
reconstruct provenance after execution.

### 2. Probability mass is called legal-set completeness ([[D1971]])

The bot says a requested full-width Maia vector is legal-complete “by construction.” The shared
provider result deliberately says `coverage: "bounded_top_k"`; requested width and a 0.99 returned
mass do not prove that every legal move is present. The counterexample in the review harness passes
the bot's 0.97 mass threshold while omitting one of three legal moves.

Keep two separate facts:

1. returned probability mass, used by the sampler's measured reconstruction threshold; and
2. legal-set coverage, established only by set equality against the exact legal-move authority.

The shared Stockfish table is all-legal by contract. The guard can derive the exact Maia-candidate
view from it, while any layer requiring legal completeness must abstain unless the Maia identities
also equal the legal set. D969 measured one private sequential shape; the release receipt must
measure the exact shared-delivery join before guarded profiles register.

### 3. The persisted record launders sealed inputs back into free strings ([[D1972]])

The proposed record closes acquisition inputs, then reopens the durable claims as
`degradedReason?: string`, `rootIdentity: string`, free classifier/layer/feature ids, free reasons
and `Record<string, number|string>` parameters. `considered` is not required to be set-equal to the
admitted candidate identities. A type-correct stored event can therefore claim a different guard,
trait, abstention, feature or root than the seals actually established.

Publish generated literal maps for profile/layer/classifier/feature ids and reason vocabularies.
Replace `rootIdentity` with a closed root identity carrying run, branch, node and event-head
authority plus exact history/FEN digests. One private validating projector must be the only way to
construct `BotPolicyDecisionRecord`; it consumes the admitted provider/guard/trait values, verifies
candidate set equality, and emits the durable projection. The REST parser never accepts this
record.

### 4. Node-only preconditions do not make the awaited operation atomic ([[D1973]])

`{ expectedNodeId, requestId }` misses branch and event-head identity. The same node can be active
on two branch cursors with different seeds, or can be revisited after later events. More seriously,
provider acquisition awaits outside the storage mutation. Current `SQLiteRunStorage.save` checks
only run id and active writer/learner; two requests by the same writer can derive from one snapshot
and overwrite each other, because no expected event head participates in the update.

The operation needs:

- a closed request carrying `expectedNodeId`, `expectedBranchId`, `expectedEventHeadDigest` and a
  bounded request-id grammar;
- one durable idempotency receipt binding request id, run/root identity, writer-lease identity,
  profile digest and committed selection/event sequence;
- a re-read and compare-and-swap (or per-run serialized commit) after provider work; and
- closed outcomes for committed, replayed-idempotent, stale-root, request-reused-with-different-
  operands, unavailable and provider failure.

The successful append may still persist `opponent.move_selected` and `move.committed` in one run
snapshot. What it may not do is hold a database transaction across engine work or trust the
pre-await snapshot at save time.

### 5. Policy determinism and operation bytes are conflated ([[D1974]])

Section 4.2 says position/history/seed/profile/model identity reproduce the same section-6 record
byte-for-byte. That record contains a caller request id and measured elapsed milliseconds, and the
equivalence relation omits both delivered provider payload digests. Two executions can make the
same policy decision while their audit envelopes differ, and two equal model identities can return
different bytes.

Define a deterministic `BotPolicyDerivation`/digest over exact root, profile, seed and delivered
payload identities. Keep request id, delivery/acquisition receipts and timings in a surrounding
operation receipt. Retry idempotency returns the previously committed envelope; recomputation is
not how a retry becomes equal. Timing never enters the policy-decision digest.

### 6. Base-provider failure has no fallback distribution ([[D1975]])

The degradation paragraph combines incomplete-but-delivered policy, omitted mass and base-model
failure, then promises an `applied:false` move through “Maia/base-mode behavior.” Maia is the base
distribution. If its operation is unavailable, no declared move distribution exists.

Split the algebra. A delivered page below the profile completeness threshold may follow the exact
recorded base-mode path if that path has a legal selected move. Guard failure passes the unchanged
delivered Maia distribution and skips dependent traits. Maia unavailability returns the typed
unavailable/failure operation result, commits no opponent event and leaves the request retryable.
Capability projection must distinguish “profile currently unavailable” from “optional guard
abstained.” A non-Maia CPU fallback is separate measured bot policy work, not an implicit branch.

### 7. Stage B duplicates the shared candidate packet and score source ([[D1976]])

Bot section 5 still says its adapter applies collectors to each child with one evaluation per
candidate. The shared candidate-packet RFC owns the complete exact legal population, one cache and
collector closure for Support, Review and bots. It explicitly refuses N child evaluations and
joins one delivered all-legal root table—the operation D969 measured.

Stage B must consume one admitted `CandidatePopulationReceipt` with the exact scope it declares,
plus one admitted legal-root delivery, and derive only
`derived.opponent.candidate_feature_vector@1`. It neither enumerates moves nor invokes collectors or
Stockfish itself. This is the required D10 join in the packet RFC and is the architectural reason
the foundation work exists.

## Required author order

1. Make `provider-exchange-and-execution` and `shared-candidate-evidence-packet` explicit bot
   dependencies; replace private acquisition/guard operations with admitted deliveries and derived
   views (D1970, D1976).
2. Separate probability mass, legal-set coverage and candidate-view coverage, then restate the
   exact release benchmark over the shared delivery path (D1971).
3. Publish the closed root, decision, reason/id and operation receipt algebras plus their private
   constructors (D1972, D1974).
4. Specify the post-provider compare-and-swap/idempotency operation and closed wire protocol
   (D1973).
5. Split incomplete-delivery, optional-guard abstention and base-source-unavailable outcomes
   (D1975).
6. Re-run the seven review arms plus the existing D1601–D1609 falsifiers, then send the amended RFC
   through a fresh independent buildability review.

No owner ruling is required. These are contradictions or missing technical contracts inside the
already ruled bot direction. No profile, schema, migration, provider operation or production route
is authorised by this return.
