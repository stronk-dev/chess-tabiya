# F9 readiness — longitudinal evidence store at HEAD

**Audited:** 2026-08-22  
**State:** pre-RFC buildability handoff; no implementation or migration is authorized  
**Authority:** R12/R13, D699–D702 and D842–D844  
**Decision gate:** O9 remains `READY FOR OWNER`

## Verdict

The research is sufficient to choose the 1.0 architecture. It is not sufficient to publish
universal metric floors, player archetypes, weakness rankings or advice.

F9 needs one personal, versioned observation plane with two record classes:

1. **atomic observations** preserve one declared projection, its occurrence/opportunity operands
   and its exact source decision or position; and
2. **metric snapshots** are reproducible aggregates over named observation versions, windows and
   populations, with their own floor and interval.

They must not be collapsed. An occurrence row is evidence about one position. A metric snapshot
is arithmetic over a declared population. Neither is prose, a diagnosis or a training priority.

The remaining blocker is O9, not more collector research. Once the owner approves the conservative
handoff, an F9 RFC can specify the store and three longitudinal modules. Exact pack/theory
applicability remains F7-owned, UI composition remains F5-owned, Review moment selection remains
F6-owned and adaptive bot memory remains F8-owned.

## 1. What persists now

| Plane | Durable source at HEAD | What survives | What is missing for F9 |
|---|---|---|---|
| Native rehearsal attempts | `attempts`, migration 6 | learner, run/branch, exact root node/key, pack, objective result, retry number and timestamps | semantic evidence identity, per-decision source, occurrence/opportunity and metric version |
| Pack concept tags | `attempt_concepts` | pack-scoped concept string and label | cross-pack registered identity and source node; labels cannot be used as a join |
| Imported games | `drill_runs` + `imported_games`, migration 12 | complete run event log, PGN/source metadata and exact positions | `projectAttempts` returns an empty projection for `sessionKind === "imported"`; no observations or habits are produced |
| Current progress aggregates | `RunStorage.metrics()` | voluntary concept-return counts and second-attempt results | contributing source rows, opportunity denominator, window, population, floor and uncertainty |
| Shape recommendations | recomputed from the latest 50 visible runs | run ids and applicable pack ids | exact firing node ids; no persisted evidence version |
| Review Story | run-local derived projection | selected run nodes and some evidence | no cross-game store; current Story does not consume the semantic transition family |
| R12 habit research | external frozen artifact + committed aggregate results | twelve retained literal metrics and measured short-session floors | production observations, ordinary-cadence/rapid transfer and versioned recomputation |

`[V]` `apps/server/src/progress.ts:75-141`, `apps/server/src/storage.ts:1533-1737`,
`apps/server/src/storage.ts:3090-3150`, `apps/server/src/service.ts:819-840`,
`design/research/grounded-coaching-aggregation.md` §§1–2 and
`design/research/player-style-metrics.md` §§3–8.

This confirms R13 at current HEAD: the app has useful durable ancestors, but no table can honestly
answer “in which exact decisions did this registered fact occur, compared with which opportunities,
under which producer version?”

## 2. Minimum logical records

Names below are handoff vocabulary, not production schema names.

### 2.1 Atomic observation

```text
PersonalObservation
  observation id
  learner id
  projection id + projection version
  producer id + producer version + registry build
  source kind {run_node | imported_game_ply}
  source run/game id + node id/ply + immutable source digest
  population unit id (the exact decision/position)
  occurred value
  opportunity numerator + denominator, or explicit not-applicable
  phase/time-control/context operands required by the declared projection
  validated evidence payload + payload digest
  computed at
```

The occurrence and opportunity fields travel together whenever a rate, avoidance or choice
residual is possible. For R12-style choice metrics, the per-decision contribution is the played
indicator minus the share of legal alternatives carrying the same declared projection. A row with
no opportunity contract may support a literal occurrence count and nothing stronger.

The validated payload remains projection-specific. F9 must consume the compiled F1/F2 evidence
view; it must not create a second free-form evidence vocabulary or persist renderer sentences.

### 2.2 Metric snapshot

```text
PersonalMetricSnapshot
  learner id
  metric id + metric version
  observation projection/version set
  source window + phase/time-control population
  reference population id + version, when used
  numerator + denominator + game/decision count
  measured value + interval
  metric-specific sample floor + admission/abstention state
  input high-water mark/digest + computed at
```

A snapshot is a rebuildable read model. Exact contributing observations remain queryable; a UI
that shows three examples says “3 shown of 17.” No snapshot stores a cached sentence, weakness,
archetype, prescribed action, grade or priority rank.

## 3. Rebuild and historical-data policy

The migration creates storage; it does not silently manufacture history.

- Pure rules projections may be rebuilt from preserved current-schema run events by an explicit,
  idempotent job that pins the projection/producer/registry versions and reports processed,
  admitted, abstained and unavailable counts.
- Imported runs participate only under the O9 opt-in rule. Their exact game/ply sources are retained;
  they are not converted into pack attempts.
- External-source evidence is rebuilt only from a recorded source response or immutable artifact.
  The rebuild never silently refetches Explorer, Maia, engine or theory and calls the new answer
  historical evidence.
- Existing `attempt_concepts` rows remain pack-scoped unless an exact registered identity mapping
  exists. No migration groups labels or assumes identical raw strings are identical concepts.
- A new producer or metric version writes a new versioned result. It does not overwrite old rows or
  make historical cards change without a visible recomputation event.

This is the same stale-claim discipline used by the evidence manifest, applied to learner data.

## 4. Ownership boundaries

| Concern | Owner | F9 relationship |
|---|---|---|
| Evidence identity, operands and renderer sealing | F1/F2 + collector RFCs | consume; do not fork |
| Exact pack/theory applicability | F7 | join current exact sets; honestly empty when absent |
| Per-game Review moments and grade/value normalization | F6 | F9 may ingest admitted observations; it does not rank the game |
| Longitudinal Observed habit / Recurring situation / Rehearsal result | F9 | own store and factual card contracts |
| Module seats, reducers, presets and answer distance | F5 | render F9 cards through ordinary workflow composition |
| Bot policy and adaptive opponent memory | F8 | **separate state**; O8 deferred memory and F9 data may not silently personalize a bot |
| Learner rating | `learner-rating` RFC | byte-separated; neither becomes an input to the other |

Bot memory does not belong in `PersonalObservation`. It changes future opponent policy, has a
different disclosure and reproducibility burden, and O8 explicitly deferred it pending measurement.
The shared part is the projection vocabulary, not the persistence or authority.

## 5. Migration, privacy and account lifecycle

A persistent ledger requires a storage migration. Per the migration register it claims a landing
position, never an integer. `learner-rating.md` currently holds the next position but is not
accept-ready; the two RFCs must declare their order when both are executable. Neither may reserve a
hole or combine unrelated tables merely to avoid coordination. `[V]` `rfc/README.md` §Migration
register and `rfc/learner-rating.md` §9.1.

Every observation/profile row is behavioral personal data. The F9 RFC therefore must amend the
portable-account inventory in the same landing:

- account export includes observation and metric versions, values, sources, floors and sharing
  state;
- account deletion hard-deletes them;
- per-run deletion removes source observations and invalidates/recomputes affected snapshots;
- imported-game profiling defaults off until the owner enables it;
- sharing defaults off and exports only explicitly selected measured cards; and
- no provider receives raw history—the optional LLM receives only a sealed admitted card.

`[V]` R12 re-identifies 35/36 accounts across disjoint halves
(`design/research/player-style-metrics.md` §6); `rfc/portable-account-data.md` §§2–5 already requires
future behavioral profiles to join its exhaustive inventory.

## 6. RFC opening condition and first implementation slice

The RFC may open when O9 approves or changes the seven-part owner handoff. No further classifier
wave is required for the store contract.

The smallest end-to-end implementation slice is:

1. the versioned observation tables and idempotent rules-only projector;
2. imported-game opt-in plus exact game/ply drill-down;
3. two already-validated literal metrics—opening surprisal and opening-family entropy—with their
   distinct floors and honest abstention;
4. one Recurring situation card with exact source replay and honest-empty F7 actions; and
5. export/delete/per-run invalidation tests in the same landing.

The loose-piece skill credit follows the tactical collector landing. Archetypes, GM twins,
aggressive/solid composites, weakness ranking, prescriptions and adaptive bot memory remain out of
that first slice.

## 7. Owner ruling still required

The recommended O9 ruling is already written in `o9-handoff.md`: approve continuous literal habit
cards, the versioned observation ledger, the three separate modules, description-before-advice,
deterministic-first/optional sealed LLM wording, opt-in imports and private-by-default lifecycle;
refuse natural archetypes, diagnoses and priority ranking for 1.0.

Approval opens F9 authoring. Owner use still tests whether the cards are calm and useful; it does
not authorize changing the measured floors or inventing longitudinal transfer.
