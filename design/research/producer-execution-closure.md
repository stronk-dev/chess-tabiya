# Producer execution closure — compiled evidence is not emitted evidence

**Question.** At HEAD, can every compiled evidence projection be reached through a real
constructor, non-test caller, application operation and sealed emitted item, or has the manifest
made the foundation look more integrated than it is?

**Verdict.** No. The catalogue is a useful authority register, but it is not an execution graph.
The 193 projections divide into 93 admitted by current consumers, 67 admitted only to the research
selector and 33 unbound. One of the 93 current-admitted projections has no production caller. None
of the 67 semantic projections can reach a live learner, Review, bot, drill or longitudinal
operation. Eleven of those 67 cannot even reach the registered research selector. `[V]`

This is not evidence that the chess mechanics are absent. Most mechanics exist and many have good
positive/hard-negative measurements. It is evidence that the application cannot yet *receive*
the foundation it is supposed to present, summarize, learn from or use for opponent behavior.

## Method

The disposable Node-24 instrument in `tools/d1710-producer-execution-harness/` compiles
`EVIDENCE_CONTRACT_DECLARATIONS`, classifies every projection from its literal bindings and scans
all non-test TypeScript/Svelte files under runtime, server and web for constructor/caller roots.
It treats exports, catalogue declarations and operation registries as declarations rather than
execution. `[V]`

The scan asks four separate questions because collapsing them recreated [[D666]]:

1. Does the projection compile?
2. Does a declared adapter or constructor exist?
3. Does a non-test operation call that constructor?
4. Can the resulting sealed item reach an application consumer?

Conditional chess events are not required to fire in every position. A live path is established by
an executable operation reaching the constructor with position/run/provider inputs; the event's
own predicate still decides whether it emits.

## Complete manifest partition

| Deepest declared binding | Projections | What the number proves |
|---|---:|---|
| Current consumer | 93 | At least one binding names one of `CURRENT_CONSUMER_OPERATION_IDS`; it does **not** prove that a producer calls the adapter |
| Research selector only | 67 | The only declared consumer is `research.semantic_selection@1` |
| Experimental consumer only | 0 | `assistance.arrows` accepts no projection |
| Unbound | 33 | 30 `inspector_only`, two `experimental`, one `retired`; none has a consumer binding |
| **Total** | **193** | Set-equal to `PRIMARY_EVIDENCE_MANIFEST.projections` |

The exact counts and all 33 unbound ids are executable output, not hand-maintained prose
(`packages/runtime/src/evidence-catalog.ts:EVIDENCE_PRODUCERS`,
`tools/d1710-producer-execution-harness/producer-execution.test.ts`). `[V]`

Nineteen producer families account for 92 current-admitted projections with a family-level live or
offline production root: authored structural conditions; structural predicates/readings;
transition readings; phase, pivotal, endgame and shape evidence; Compare and Story derivations;
recorded engine/tablebase; live Stockfish/Syzygy; Maia and Explorer pages; authored claims; run
records; and sourcing-ledger records. Their roots are exercised through objective/shape validation,
`DrillScreen`, `CompareView`, Story service generation, opponent selection, evidence-reference
rendering, repertoire scanning and claim validation. `[V]`

The 93rd is the counterexample: `derived.opponent.candidate_feature_vector@1` is admitted to
`opponent.selection@1`, yet `candidateFeatureVector` has zero non-definition production callers.
The live `OpponentSelector` admits only Maia, Stockfish and Syzygy provider responses. This
reproduces [[D1072]]/[[D1633]] at the complete-manifest boundary
(`apps/server/src/candidate-evidence.ts:candidateFeatureVector`,
`apps/server/src/opponent-selector.ts:opponentProviderEvidence`). `[V]`

## The 67 semantic projections: exact execution partition

The semantic registry is set-equal to three execution classes. `[V]`

| Deepest executable root | Count | Projection families | Why it stops |
|---|---:|---|---|
| Operator selector only | 45 | 32 one-edge structural/transition/tactical/castling/exchange/discovered events plus 13 counterfactual-avoidance events | `selectLocalSemanticEvidence` is called only by `apps/server/src/semantic-evidence-check.ts`; no application/service/REST operation calls it |
| Unused candidate helper only | 11 | nine one-edge breadth events plus defender-removed and defender-duty-relocated | `localSemanticEvents` can construct them, but its only non-definition caller is `candidateFeatureVector`, which itself has no production caller; the inline research selector omits `breadthSemanticEvents` and `semanticDutyEvents` ([[D1386]]) |
| Isolated sequence helper only | 11 | trade completion; pawn-contact timing; harassment pressure; defender consequence; observed deflection, attraction, line clearance, square clearance, interference, check zwischenzug and overload exploitation | Constructors exist, but no non-test path/window compiler invokes them ([[D1067]]) |
| **Total** | **67** | Set-equal to `SEMANTIC_EVENT_PROJECTION_IDS` | **Zero live application roots** |

The selector's 45 does not mean all 45 fire in the one e2e4 smoke command. It means the operator
operation can construct their required population when a qualifying position is supplied. The two
11-row classes cannot reach that operation at all. `[V]`

Two additional unbound bounded predicates have the same helper-only shape:
`rules.tactic.consequence.forced_mate_after_move@1` and
`derived.tactic.overloaded_defender_response_conflict@1`. Their functions are exported and tested,
but have zero non-test integration callers (`packages/runtime/src/mate-proof.ts`,
`packages/runtime/src/tactics.ts`). `[V]`

## What the 33 unbound projections mean

“Unbound” is not one product state. The 33 rows include four materially different states. `[V]`

| State | Examples | Consequence |
|---|---|---|
| Mechanics gathered only inside the unused candidate helper | castling rights/legality, legal exchange, loose/ray/threat, fork survival, space/development, mobility/pawn/king/material readings | The bot vector can compute them in isolation, but no bot request calls the vector and no module/Review consumer admits the individual evidence |
| Live raw result without a sealed consumer path | `theory.opening.current_endpoint`, `theory.opening.catalogue_membership` | `/opening-identity` serves typed raw values, while F1 still sees both as inspector-only unbound projections |
| Helper/adapter only | move quality, deepest opening reached, exact legal-move projection, Maia candidate WDL, recorded opening position, bounded mate and overload conflict | A mechanic, renderer or adapter exists, but the projection has no complete producer→consumer operation |
| Intentionally impossible | `rules.structural.reading.pawn_count` | Retired; `structuralReading` cannot emit it and the exact adapter rejects it |

This distinction matters for repair. A live raw endpoint needs an F1 adapter/consumer join; an
unused mechanic needs an operation; a sequence event needs a path compiler; a retired projection
needs no resurrection.

## Why this blocks Phase 3 rather than merely reducing polish

`learner-modules` and `module-registration` can compile eligibility for semantic ids, but today
there is no application event population to reduce or render. Wiring a module directly to
`structuralReading`, `localSemanticEvents`, or a Svelte recomputation would create a second
authority and bypass the exact selector/grounding/abstention contract. `[V]`

The same break affects all downstream promises:

- **Support/hints:** no live semantic packet exists at commit/postcommit; hint-distance cannot
  select a grounded nudge from application state.
- **Review:** no recorded-path compiler emits the seven observed tactic families, and current
  one-edge events are not compiled for a whole game.
- **Bots:** provider responses reach `OpponentSelector`, but the evidence-aware candidate vector
  does not; the installed bot therefore cannot use the shared primitives.
- **Longitudinal/player classification:** the 67-row taxonomy is larger than the reachable event
  compiler; opportunity denominators cannot be populated honestly from current operations.
- **Drills/content:** packs may reference structural predicates, but new guidance cannot assume the
  semantic event foundation will arrive merely because the ids compile.

## Required repair order

1. Amend `shared-candidate-evidence-packet` from [[D1633]]/[[D1072]]/[[D1386]] so one production
   service operation constructs the complete legal-candidate packet, retaining original sealed
   events/readings, and bot/hint/Review consumers derive from it rather than from the obsolete
   vector.
2. Give [[D1067]] an accepted recorded-path compiler contract. It must compile contiguous branch
   windows, exact `run.record.move@1` inputs, all eleven sequence families and typed abstentions.
   Engine-PV horizons use different source identities per [[D1068]].
3. Make module registration depend on emitted populations, not catalogue membership. A module row
   is activation-red until its producer operation, trigger and sealed item are exercised at the
   production boundary.
4. Bind Review, bots and longitudinal ingestion to those two compilers through their own narrowed
   consumer projections. No consumer may call detector helpers directly.
5. Add a generated production-emission receipt to the evidence verification tier: every
   non-retired projection has exactly one declared execution disposition (`live_application`,
   `offline_authoring`, `operator_research`, `helper_awaiting_owner`, or
   `intentionally_unbound`) and any claimed live row has an able-to-fail production-boundary test.

No new chess predicate is required by this repair. It makes the already-built foundation usable
without weakening grounding or inventing prose.

## Gate result

The exploration gate for a producer-execution closure is open: the failure is reproduced at HEAD,
the existing RFC owners and source splits are named, and the negative fixtures are able to fail.
Implementation remains prohibited until the affected RFCs are amended and accepted. `[V]`
