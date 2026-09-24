# Bot policy

Tabiya's bots are compiled, versioned compositions over the Maia human-move model
(`rfc/bot-policy.md`, `rfc/bot-roster.md`). A bot's name or avatar can never change a move, and a
card can only say what a registered measurement says.

## The registered roster: `bot-profile-catalog@1`

`packages/runtime/src/bot-profile-catalog.ts` is the one catalogue. Server, capabilities, cards
and the web client import it; none declares its own family, band, layer, classifier or reason
list.

- **Twelve profiles, derived.** `BOT_PROFILE_CATALOG` is `BOT_PROFILE_FAMILIES × BOT_MODEL_BANDS`:
  three families (`human-baseline`, `guarded-human`, `pawn-forward`) crossed with the four
  pre-registered Maia bands (1000, 1400, 1800, 2200). Ids are `family.band@1`. Band 2400 and
  interpolated bands are not registered.
- **Three layers.** `sampler.maia_reconstruction@1` (temperature 0.8, top-p 0.92, requested width
  20, returned-mass floor 0.97); `guard.severe_error@1` (Stockfish `stockfish-guard@1`, depth 8,
  250 cp, 500 ms deadline, reference = best all-legal centipawn row); `trait.pawn_preference@1`
  (`pawn_move@1` ×4, `dependsOn: guard.severe_error@1`). Baseline = sampler; guarded = sampler +
  guard; pawn-forward = sampler + guard + trait. There is no unguarded pawn profile.
- **Two digests.** Each profile carries a `behaviorDigest` (model, band, sampler, layer
  declarations, and the null repertoire/memory/timing slots) and a profile `digest` over the whole
  declaration including the presentation slot. Calibration keys the behaviour digest, so a future
  name/avatar change keeps a measurement while any move-affecting change loses it. Digests are
  pinned literals in the runtime module (it also runs in the browser);
  `apps/server/src/bot-profile-catalog.test.ts` recomputes them as RFC-8785 SHA-256 and fails on
  drift.
- **Complete identity.** `resolveBotProfileReference` is the only way bytes become a profile. The
  whole reference — id, family, band, version, digest, model, sampler and ordered layers — must
  equal one catalogue member; a genuine id with a substituted family or layer list is refused.
- **Composition refusals.** `assertBotLayerComposition` refuses duplicate authorities, delay or
  timing layers, memory and repertoire instances, learner-derived inputs or parameter citations,
  unregistered classifiers, unmeasured or gate-failing traits (forcing ×3 and quiet ×3 are
  permanent negatives read from the depth-8 artifact), a trait without its guard, and a
  legal-set-equality transform over the bounded Maia page.
- **No decorative identity yet.** Final names/avatars are owner-authored (D1610). Every profile's
  presentation slot is `null`; titles are the family label and band.

## The compiler

`apps/server/src/bot-policy-compiler.ts` is the one execution path.

1. `sealBotRootAuthority` replays the run's start FEN and history to the root position and derives
   the root and history digests itself. `compileBotLegalMoveMap` and `compileBotClassifierView`
   derive the exact legal map and the `pawn_move@1` legal-board view from that root. All three are
   runtime-sealed; structurally equal plain objects are refused.
2. `compileBotPolicyExecution` admits the Maia `maia.policy_page@1` payload (band, model, sampler,
   root and history must equal the profile and root; moves unique and inside the legal map) or
   returns a typed no-move: `base_provider_unavailable` or `provider_failed`. There is no base
   fallback once Maia fails.
3. It reconstructs the played distribution as `p^(1/T)`, normalises the whole tempered page, applies
   cumulative top-p forcing top-1 with the position-pure `neutralTiebreak`, and records
   `degraded` (not a different algorithm) when returned mass is below 0.97.
4. The guard reads the all-legal `stockfish.legal_root_table@1`. It applies only when every legal
   move has a depth-8 centipawn row; any mate row, duplicate/missing/extra row, wrong root, failed
   or late delivery, or a mask that would empty the distribution abstains the whole guard with a
   closed reason and leaves Maia's distribution byte-identical. The pawn trait runs only after an
   applied guard; otherwise it records `guard_dependency_abstained`.
5. The move is drawn from the branch seed keyed on the history digest.
   `projectBotPolicyDecisionRecord` adds the canonical derivation digest to the sealed execution.
6. `parseBotPolicyDecisionRecord` and `parseBotPolicyEventEnvelope` never trust stored digests:
   they recompile from a sealed replay authority (root, legal/classifier views, catalogue profile,
   provider payloads) and require byte equality. `compileBotPolicyEventEnvelope` binds a decision to
   its request id, writer-lease digest and event sequence; its operation digest excludes timing,
   the resulting event head and itself.

`packages/runtime/src/bot-opponent-ply.ts` holds the closed grammar of
`POST /runs/:runId/opponent-ply`: the exact four-field request parser, the eight-row
result/status/code/retry/action table, and `runEventHeadDigest`, the event-head CAS token server
and browser both compute.

## Playing a bot: run lane 0.18 and the opponent-ply operation

**Persistence (run schema 0.18, migration 29).** `RunOpponentPolicy.profile` stores the exact
catalogue reference in `run.started`; it is valid only with `human_common` and without
`targetElo`/`temperature`/`topP`, is resolved as a whole catalogue member at create
(`RunService.create`) and at every projection (`projectRun`), and is read byte-for-byte on resume.
Rematch (`POST /runs/:id/duplicate`) and flip copy the same reference with a new seed. Every bot
move's `opponent.move_selected` carries `OpponentSelection.policy = { decision, operation,
deliveries }`: the sealed decision, the non-circular operation record, and the shared
`tabiya.provider-delivery.v1` images it was compiled from. Migration 29 is stamp-only
(`"0.17"`→`"0.18"`, frozen literals); historical runs gain nothing. The public projection shows
the profile but never the envelope (it holds guard scores and provider bytes); the recorded
`candidates` carry Maia's reconstructed mass, not the guard-masked distribution.

**The operation** (`RunService.botOpponentPly`, `apps/server/src/bot-opponent-operation.ts`,
`apps/server/src/bot-opponent-source.ts`). The browser sends exactly `{ requestId,
expectedNodeId, expectedBranchId, expectedEventHeadDigest }`. The server then:

1. checks the writer lease and looks the request id up in the run's own event log **before any
   provider call** — a match with the same pre-provider operand digest (root, writer lease,
   profile digest, branch seed, all recomputed from the run) returns the stored reply after the
   durable parse; a different digest returns `request_reused_with_different_operands`;
2. refuses a moved root (`stale_root`) — cursor node and branch plus the event-head token;
3. seals the root, legal map and `pawn_move@1` view from the run's own path, and asks the ONE
   shared `ProviderExchangeScheduler` for `maia.policy_page@1` and, for guarded families,
   `stockfish.legal_root_table@1` under the guard's 500 ms opportunity deadline — with no
   transaction open and no bot-private fetch, queue or cache;
4. compiles the decision; a Maia failure returns `base_provider_unavailable`/`provider_failed` and
   writes nothing;
5. re-reads the run: an existing winner for the request id with equal pre-provider and commit
   operand digests is `replayed_concurrent_winner`, different delivered bytes are
   `concurrent_commit_conflict`; only then the root CAS (`stale_root`);
6. appends move + decision + operation + deliveries in one `opponent.move_selected`.

`parseStoredBotEnvelope` is the one durable parser: deliveries re-enter through
`parsePersistedProviderDelivery`, the decision is recompiled from the run's root, the run's
catalogue profile and those deliveries, and the whole stored decision and operation must be equal
([[D3027]]). A tampered mass, move or delivery byte fails as `STORAGE_FAILURE`. `/moves` refuses
caller selection bytes on a profile run, and branch groups are refused on profile runs until their
wrapper calls the same core.

**Availability** (`BotProviderAvailability`). The roster reads the provider-health registry
(`docs/provider-health.md`); there is no bot-private health state and no configuration input.
`maia.policy_page@1` takes the state of `maia-inference`, gated by its container identity.
`stockfish.legal_root_table@1` takes the state of `stockfish-analysis`, the instance the exchange
runs it on. `available` maps to available and `unavailable` to unavailable. Every other state maps
to `unverified`, because a roster card has no request with which to prove a cached hit. Every shared-exchange outcome
the bot observes (the startup probe and every bot move) settles into that registry. A sealed live
delivery heals the instance; a retained hit or a local-domain answer does not change it. The §4.3 join
(`botProfileStartability`): baseline needs only Maia. Guarded and pawn-forward also need Stockfish,
and they stay `conditional` (`guard_release_receipt_absent`) until a current provider-health
release receipt exists. A forged, cross-registry or stale receipt makes them unavailable
(`guard_release_receipt_invalid`). An `unavailable` profile cannot be created. In
`ENGINE_MODE=maia` the networked sidecar reports its injected OCI identity (`maiaContainerProbe`).
Without that identity, Maia deliveries, and therefore every bot, are unavailable (`protocol`).
Mock-engine deployments serve a labelled "Mock Maia" through the same exchange.

**Play.** `apps/web/src/lib/JustPlayStarter.svelte` shows the roster as three family sections of
four band cards from `/capabilities` (title, one compiled mechanism sentence, `Uncalibrated`,
availability copy) with the full grounded card for the selection; raw Maia rungs and the engine
test sit under **Advanced**. Nothing is preselected (the first-use default is the owner's D1611
decision) and no display name is invented (D1610). A profile run shows "Bot · <family> · model band
<band>" in the status bar, a degraded/abstained note when the last reply's guard stood aside, "Ask
the bot again" after a failure (reusing the idempotency key for the same root), and "Play this bot
again" (rematch).

## Cards and `/capabilities`

`apps/server/src/bot-card.ts` compiles a card from a catalogue member, the registered measurements
in `apps/server/src/bot-policy-measurements.ts` (each bound to a committed artifact and re-read by
its test) and an optional calibration receipt for the same behaviour digest. Every statement has
a closed id and at least one source id. Cards state the model band as a model setting (not a
rating), the sampler and its reconstruction fidelity, the raw band-ladder ordering (explicitly not
this profile's strength), the guard as an engine information advantage with its depth-8
measurement and whole-move abstention, the pawn trait with its +12.3-point depth-8 measurement and
guard dependency, and the absences: no opening book, no cross-game memory, no fake thinking time,
no measured behaviour beyond the first 20 plies. No calibration receipt exists, so every card is
`uncalibrated` and shows no strength number; a receipt renders its three verdicts, and
`humanLikeLabelAllowed` needs all three favourable.

`/capabilities` advertises the roster as `policyProfiles.human_common.profiles`: each row's exact
reference, behaviour digest, card and `startable` (`available` | `conditional` with closed
conditions | `unavailable` with closed blockers). The web parser
(`apps/web/src/lib/capability-response.ts`) requires the rows to be set-equal to the runtime
catalogue and uses the runtime's closed card/source/availability vocabularies. `/capabilities` also
carries the two refused dispositions: multi-band runtime Maia queries (D817) and artificial move
delay (D820).

## Stage B candidate evidence

The one-edge candidate-evidence boundary predates the roster and is unchanged.
`candidateFeatureVector` accepts legal candidate moves with one finite, fixed-bound Stockfish score
in the root mover's frame, plays each move on a cloned position, and applies the existing tactical
and breadth collectors to that child and edge. Every retained result carries its literal registered
projection id. It is admitted only to `opponent.selection@1`, and no registered layer consumes it:
the compiler's `features` rows are empty until a Stage-B trait passes its own measurement.

## What is not wired yet

- No provider-health release receipt is issued yet (it needs the release-concurrency benchmark),
  so guarded families stay `conditional`. The A11 shared-route latency benchmark and calibration receipts do not exist, so every
  card is `uncalibrated`.
- Branch groups, simulations and live matches do not play profile replies.
- The `bot-profile-catalog` shared-resource register row waits on absent-source admission
  ([[D3082]]); Stage B trait consumption, owner names/art (D1610) and the first-use default (D1611)
  remain open.

The legacy `BOT_POLICY_PROFILES` behind public `/select-move` stays empty, so no profile can be
played through the browser-authoritative path. The old caller-fed `composeBotPolicySelection`
(bare guard losses and trait strings) is deleted.
