# Bot policy — playable landing receipt (2026-09-24, second landing)

Owner-directed, no review round (consolidation and review come later). Genuine RFC defects were
fixed inline with a changelog line; every other finding became a test. This receipt continues
`implementation-receipt-2026-09-24.md` (the non-persistent half) and states what now exists.

**What a learner can now do.** Open Play, see the twelve registered bots as three family sections of
four model-band cards (grounded card text, `Uncalibrated`, live availability), choose one, start a
game, and play it: every bot reply is computed and committed by the server from the shared Maia
page (plus, for guarded families, the Stockfish root table). Reload resumes the same bot; "Play this
bot again" starts a new run with the identical profile reference and a new seed; "Ask the bot
again" retries a failed reply with the same idempotency key. Raw Maia rungs and the engine test are
under **Advanced**. In mock-engine deployments (development, CI, browser smoke) the exchange serves
a labelled "Mock Maia"; in `ENGINE_MODE=maia` the networked Maia sidecar exposes no container
identity to the exchange, so bots are honestly shown **unavailable** there until it does (see
"Remains").

## Landed

| Surface | Home | Tests |
|---|---|---|
| Run lane 0.18: `RunOpponentPolicy.profile`, `OpponentSelection.policy` | `packages/runtime/src/types.ts`, `schemas/drill_run.schema.json`, `packages/schema/src/index.ts`; `projectRun` resolves the whole reference and refuses an envelope on a non-profile run | `apps/server/src/bot-opponent-ply.test.ts` (A1 arms), `packages/schema/src/drill-run.test.ts` |
| Migration 29 (stamp-only `"0.17"`→`"0.18"`, frozen literals) | `apps/server/src/storage.ts` `#upgradeV017Runs` | prior-release upgrade + reopen-idempotence test in `bot-opponent-ply.test.ts`; every existing migration-log test extended |
| Create/resume/rematch/flip keep the exact reference | `RunService.create` → `#positionOpponentPolicy`; `duplicate`; `flip` | substituted band/layers, unregistered id, bare id, `targetElo`/`temperature`/`strong_engine` combinations refuse; rematch keeps reference, new seed |
| `POST /runs/:runId/opponent-ply` (op 3–10) | `apps/server/src/rest.ts`, `RunService.botOpponentPly`, `apps/server/src/bot-opponent-operation.ts` | committed; extra FEN/profile/seed, non-canonical digest, empty node, bare request id → 400 with zero provider calls; stale node/branch/head → `stale_root`, nothing written; identical retry → `replayed_idempotent`, zero provider calls, same operation; reused id with another root → `request_reused_with_different_operands`; other writer → lease refusal; two identical first flights → `committed` + `replayed_concurrent_winner`; different delivered bytes → `concurrent_commit_conflict`, one event |
| Shared exchange only (ops 5–7) | `BotOpponentProviders` over the application's one `ProviderExchangeScheduler`; `bot-opponent-source.ts` adapts shared deliveries and carries their exact source identity into the payload digest | census: `capability-operations.test.ts` binds `opponent-ply` and requires both opponent writers to commit through `#commitOpponentSelection` → `#commitWithEnrichment` |
| Durable replay by reconstruction ([[D3027]], [[D3030]]) | `parseStoredBotEnvelope`: deliveries through `parsePersistedProviderDelivery`, root from the run's path, profile from `run.started`, decision recompiled and compared whole | save → restart → retry returns the same operation with zero provider calls; a coordinated mass rewrite, a rewritten operation move, mutated response bytes and a relabelled delivery each fail `STORAGE_FAILURE` (the code left the refusal-debt fixture) |
| Degradation (A10) | compiler + adapter | Maia down → 503 `base_provider_unavailable`, no event; guarded profile with Stockfish down → guard/trait abstain and the final distribution equals the baseline sampler's for the same page; guard applied masks 400-cp-losing candidates and never draws one |
| Availability (§4.3) without provider health | `BotProviderAvailability` (exchange outcomes only) + `botProfileStartability` in the runtime catalogue; startup probe; `/capabilities` roster | four-arm provider matrix (Maia on/off × Stockfish on/off) per family in `bot-card.test.ts`; unobserved → conditional; create refused when unavailable; the composed application flips baseline to `available` from the probe's delivery |
| Event-head CAS token | `runEventHeadDigest` (runtime) | moves on every append, ignores payload redaction |
| Play picker, in-run identity, retry, rematch | `JustPlayStarter.svelte`, `bot-picker.ts`, `session-controller.ts`, `run-state.ts`, `api.ts`, `DrillScreen.svelte`, `opponent-copy.ts` | `screens.test.ts` (12 cards in 3 sections, nothing preselected, disabled Start explains itself, unavailable card disabled with reason, full card on select, exact reference to `onStart`); `session-controller.test.ts` (four request keys, no `/select-move`, key reused after a retryable failure, new key after `stale_root`, created run must echo the chosen profile); `capability-response.test.ts` (closed availability union) |
| Browser journey | `tests/browser/drill.spec.ts` "a learner chooses a registered bot, plays it, reloads, and the same bot continues" | choose → play two moves (four-field bodies, zero `/select-move`) → reload → same bot label, third move answered → rematch keeps the bot |

## RFC corrections (inline, with changelog lines)

1. `bot-policy.md` §0 rationale called the profile reference "six-field"; §4.1's interface has eight.
2. §4.1 never defined the event-head digest. A digest over event payloads cannot be the browser's
   CAS token because the public projection redacts payloads before disclosure; it is the head
   event's `(seq, type, at)` under the run id over the append-only, gap-free log.
3. §4.1's `{ decision, operation }` envelope could not meet A3 ("retains each admitted delivery and
   validates it after save/reload"); the persisted envelope also carries the shared delivery images.

## Decisions taken inside the RFC's latitude (reported, not ruled)

- **No default opponent.** D1611 is unruled, so Play preselects nothing: the learner picks a bot (or
  a raw rung under Advanced). Start explains why it is disabled.
- **Public selection candidates carry Maia's reconstructed mass**, not the guard-masked final
  distribution: the latter is engine-derived and the whole envelope (guard scores, provider bytes)
  is server-only in every public projection.
- **Mock Maia reports the registered model identity** under the name "Mock Maia" and a labelled
  stand-in container digest, because the shared exchange admits only a page whose model equals the
  request. It exists only in mock-engine deployments.
- **Application provider bounds** raise `maxActive` to 2 (Maia and the guard's Stockfish run as
  separate processes; each engine still serializes its own exchanges) and `maxQueued` to 8.
- **Branch groups refuse profile runs** until their wrapper calls the same core (§4.1's
  "group-specific wrapper" is unbuilt); `flip` carries the profile.

## Remains

1. **Production Maia identity.** The networked sidecar exposes no OCI identity, so in
   `ENGINE_MODE=maia` every Maia delivery — and so every bot — is `unavailable`. The sidecar (or its
   supervisor spec) must report its container identity to the exchange; a configured digest would
   be a declared, unverified identity and was not added.
2. **Provider health** (`rfc/provider-health-degradation.md`, draft): its snapshot/release receipt
   replaces the exchange observer behind the same `BotProviderAvailabilitySnapshot`; until then
   guarded/pawn-forward families stay `conditional` (`guard_release_receipt_absent`).
3. **A11 release benchmark and calibration (D3/D6)**: no shared-route latency benchmark and no
   calibration receipt; every card is `uncalibrated`.
4. **Branch groups / simulations / live matches** do not play profile replies.
5. **`bot-profile-catalog` shared-resource row** (absent-source admission, [[D3082]]), **Stage B**
   trait consumption, **D1610** names/art and **D1611** default.
6. `opponent-experience.md` items outside this bounded picker: `GET /opponents`, the fixed identity
   bar/companion card composition ([[D2239]]), withdrawn-persona rendering ([[D2240]]),
   recommendation and analytics ([[D2242]]).

## Verification (this worktree, 2026-09-24)

- `make typecheck` — green.
- `make verify-software` — green; software suite 268 files / 2,190 tests (36 in
  `apps/server/src/bot-opponent-ply.test.ts`), plus performance, schema, manifest and census targets.
- `make register-check` — 36/36 checker tests; 72 active RFCs, 27 live claims, C1–C8 green; run-schema
  head 0.18, migration head 29.
- `make verify-content` — 19 files / 190 tests (the `STORAGE_FAILURE` refusal left the debt fixture
  because the durable-parse arms now test it directly).
- `CI=1 PLAYWRIGHT_PORT=4393 make test-browser-smoke` — 47 passed, 1 skipped (the Maia-latency spec
  needs a live Maia), including the choose → play → reload → continue → rematch bot journey.
