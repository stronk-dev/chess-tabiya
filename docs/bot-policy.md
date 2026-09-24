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

`packages/runtime/src/bot-opponent-ply.ts` holds the closed grammar of the future
`POST /runs/:runId/opponent-ply`: the exact four-field request parser and the eight-row
result/status/code/retry/action table.

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
reference, behaviour digest, card and `startable`. The web parser
(`apps/web/src/lib/capability-response.ts`) requires the rows to be set-equal to the runtime
catalogue and uses the runtime's closed card/source/blocker vocabularies. `/capabilities` also
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

Every roster row is `not_startable`, blocked by `run-schema-0.18`, `provider-exchange` and
`provider-health`, and the Play picker still offers the raw Maia rungs:

- the run's exact profile reference (`RunOpponentPolicy.profile`) and the decision/operation
  envelope (`OpponentSelection.policy`) persist under run lane 0.18, whose stamp-only migration is
  registered behind `concept-registry` (itself behind `evidence-job-durability` and
  `longitudinal-store`);
- the Maia page and Stockfish root table must arrive as shared provider deliveries
  (`rfc/provider-exchange-and-execution.md`), not a bot-private acquisition;
- profile availability joins provider health's snapshot and release receipt
  (`rfc/provider-health-degradation.md`).

Until then the route is not mounted, and the legacy `BOT_POLICY_PROFILES` behind public
`/select-move` stays empty so no profile can be played through the browser-authoritative path.
The old caller-fed `composeBotPolicySelection` (bare guard losses and trait strings) is deleted.
