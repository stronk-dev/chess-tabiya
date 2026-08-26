# Promotion race — exact inputs, Syzygy identity and effective provider metadata

**Question:** What literal evidence graph closes the two held Wave-C promotion-race projections
without recomputing pawn truth, joining a Syzygy result from another position, treating provider
absence as refutation, or falsifying latency?

**Rows:** [[D963]], [[D1390]], [[D1699]], [[D1700]]

**Date:** 2026-08-26

**Verdict:** The descriptive geometry can land from one existing complete pawn reading. The outcome
join additionally needs the exact legal-move map and a same-position recorded-or-live Syzygy source.
The existing live source lacks request FEN, and F1's producer-wide latency/availability cannot
describe a local geometry output beside an optional-provider outcome. Six executable arms pass.
`[V]`

## Method

- Read the accepted/partially implemented `semantic-collectors` contract, its D963 hold, the D931
  promotion-pressure seam and Stage-0 promotion/Syzygy measurement. `[V]`
- Re-derived the two production helpers against `pawnContactsReading`, exact legal moves, recorded
  tablebase readings, live `TablebaseSource`, F1 `anyOf`, producer metadata and source adapters. `[V]`
- Built `tools/d1699-promotion-race-contract-harness/` as a separate disposable instrument so the
  concurrent D872 harness remains untouched. `[V]`
- Preserved D909's measured conclusion: stride ordering is description only; Syzygy is the sole
  outcome authority in domain. No new chess verdict is introduced. `[V]`

## 1. The current geometry emits a race its evidence says is not one ([[D1699]])

`promotionRaceGeometry(fen)` scans every pawn with a clear forward file. It never consumes the
registered passed-pawn/pawn-contact evidence and never tests the “capturable” half of its own
`blocked_or_capturable_path_outside_convention` reason. `[V]`

Permanent counterexample: `[V]`

```text
4k3/1p6/8/8/8/8/P7/4K3 w - - 0 1
```

The current helper returns `available` with White a2 and Black b7. The shipped
`pawnContactsReading` marks both `passed: false`: each opposing pawn lies ahead on an adjacent file.
The repair filters the race population to exact declared passed pawns with clear forward paths and
correctly returns unavailable. `[V]`

The complete exact input is `rules.pawn.reading.contacts@1`: its payload retains canonical full
FEN, every pawn identity, passed state and enemy-pawn blockers for both colors. The one-sided
`derived.tactic.promotion_pressure@1` is not a complete participant source because it describes
passed pawns belonging to the player who just moved. Requiring it as the sole input would silently
drop the other runner. `[V]`

`promotion_race_geometry@1` therefore derives from the declared contacts item, not a raw FEN and
not a second call to the contacts constructor. It may parse the retained FEN to calculate clear
forward paths, initial double-push use and alternating arrival ply, but every emitted pawn must join
an exact `passed: true` row by color/square/role. `[M]`

The abstention should be renamed before registration to
`no_opposing_passed_clear_paths`; “capturable path” overclaims a general piece-attack proof the
convention does not compute. Other-piece captures, checks, king access and promotion effect remain
explicit reasons geometry is not outcome. `[M]`

## 2. Literal geometry declaration

The exact compileable row is: `[V]`/`[M]`

| field | value |
|---|---|
| id | `derived.pawn.promotion_race_geometry@1` |
| role / plane | `reading` / `derived` |
| payload | `PromotionRaceGeometryResult` |
| grounding / exactness / confidence | `position_rules` / `convention` / `not_applicable` |
| operands | `fen`, `pawns`, `arrivalConvention`, `ordering`, `sideToMove` |
| answers / forms | `fact`; list, panel, lit squares, machine condition |
| derivation | `inputs: [rules.pawn.reading.contacts@1]` |
| abstention | no opposing passed clear paths; input abstained |
| limitation | stride order is never win/loss/draw, inevitability, quality or recommendation |
| disposition | inspector-only pending module/bot selection |

Grounding remains `position_rules`: with one exact rules input the current compiler rejects a change
to `declared_convention`; `exactness: convention` is the disclosed arrival arithmetic. This is both
compileable and more truthful than the RFC's current “mixed exact inputs” sentence, because there
is one participant authority. `[V]`

The established a2-versus-h7 fixture retains arrival plies 9 and 10; input absence remains typed
`input_abstained`. `[V]`

## 3. The current outcome join has no position identity ([[D1699]])

`PromotionRaceTablebaseInput` carries category, distances, provider and piece count but no FEN.
`promotionRaceTablebase` checks only that actual and reported piece counts agree. The harness gives
it a category from another four-piece position and the current function returns `available`. `[V]`

The same-position rule is exact: geometry FEN, exact-legal-map FEN and tablebase source FEN must be
byte-equal canonical full FEN. Full FEN is conservative and preserves the halfmove clock that the
live tablebase cache already adds to its transpose key for DTZ/fifty-move semantics. A mismatch is
an invalid join, not provider absence. `[V]`/`[M]`

The existing recorded arm already retains FEN:
`recorded.tablebase.result@1` wraps `RecordedReading(kind=tablebase_result, fen, sourceId,
retrievedAt, values)`. The live raw `TablebasePosition` does not. Add one reusable source receipt:
`[V]`/`[M]`

```ts
interface LiveSyzygyPositionReceipt {
  fen: string;
  sourceId: string;
  retrievedAt: string;
  requestDigest: string;
  responseDigest: string;
  result: TablebasePosition;
}
```

`live.syzygy.position_result@1` is node-free and belongs to the shared provider-source layer. It is
useful to Review, exact endgame modules and bots independently of promotion races. Direct
`TablebaseSource.probe(fen)` and queue-backed tablebase evidence must use the same constructor; a
manifest path alone is not a live operation. `[M]`

Syzygy exactness carries `confidence: not_applicable`; category/DTZ are exact within the tablebase
domain, while network/source failure is availability, not uncertain chess truth. `[M]`

## 4. Exact legal moves are a required third input ([[D963]])

The outcome payload also publishes `immediatePromotion` and `promotionWithCheck`. Geometry does not
contain the complete actual legal move set, and a tablebase category does not supply those moves.
The derivation must therefore retain `rules.mobility.reading.legal_moves@1` for the same FEN. `[V]`

The literal alternatives are: `[M]`

```ts
anyOf: [
  [promotion_race_geometry@1, rules.mobility.reading.legal_moves@1,
   recorded.tablebase.result@1],
  [promotion_race_geometry@1, rules.mobility.reading.legal_moves@1,
   live.syzygy.position_result@1],
]
```

This compiles through the shipped F1 `anyOf` implementation in the harness. Omitting legal moves is
an incomplete source graph even if the current function can recompute them from FEN. `[V]`

Literal outcome row: `[M]`

| field | value |
|---|---|
| id | `derived.pawn.promotion_race_tablebase@1` |
| role / plane | `event` / `derived` |
| payload | `PromotionRaceTablebaseResult` |
| grounding / exactness / confidence | `declared_convention` / `convention` / `not_applicable` |
| operands | `geometry`, `category`, `dtz`, `preciseDtz`, `source`, `immediatePromotion`, `promotionFirst`, `promotionWithCheck` |
| answers / forms | fact + evaluation; list, panel, timeline marker, machine condition |
| derivation | the two literal three-input alternatives above |
| abstention | outside domain, provider unavailable, input abstained |
| limitation | only the tablebase input supplies outcome; absent source never refutes geometry/outcome |
| disposition | inspector-only pending module/bot selection |

Geometry unavailable returns `input_abstained`; no source returns `provider_unavailable`; outside
seven pieces returns `outside_tablebase_domain`. These states never become a `false`, `draw` or
empty race. Both recorded and live same-position source arms pass the harness. `[V]`

## 5. Producer-wide latency/availability is structurally insufficient ([[D1700]])

`derived.pawn` currently advertises one `local/sync` producer row. Its three shipped outputs are
local. The held outcome projection has two alternative dependency paths: `[V]`

- geometry + exact legal moves + recorded tablebase: synchronous once recorded bytes exist;
- geometry + exact legal moves + live Syzygy: interactive provider work.

The harness compiles the graph and derives member latencies `[sync, interactive]`, while the only
published producer latency remains `sync`. Changing the whole producer to interactive would make
the local geometry and all existing pawn transitions lie in the other direction. `[V]`

The same contradiction exists in the bounded-target repair: one proposed derived producer contains
three local exact outputs and two provider-backed policy outputs. Therefore the prior D1390 repair
cannot be “set the derived producer to the slowest input.” `[V]`

F1 must distinguish **own operation metadata** from **effective projection dependency metadata**:
`[M]`

```ts
interface CompiledProjectionExecution {
  ownLatency: LatencyMode;
  dependencyAnyOf: readonly {
    inputs: readonly VersionedEvidenceId[];
    effectiveLatency: LatencyMode;
    availability: readonly SourceRequirement[];
  }[];
  worstCaseLatency: LatencyMode;
}
```

Consumers decide whether they accept a recorded-only arm, may request a provider arm, or must show
honest empty. One scalar producer availability is not substituted for that literal dependency
expression. If F1 is not extended, the only truthful alternative is a separate producer id for
every provider-backed family; that proliferates ownership and loses the shared derivation graph, so
it is the fallback, not the recommendation. `[M]`

## 6. Build order and closeout

1. Amend `semantic-collectors` §3.7 and its literal declarations to the exact geometry input and
   three-input `anyOf` graph. `[M]`
2. The shared provider-source/F1 RFC adds node-free Syzygy position receipt plus projection-effective
   execution metadata alongside Stockfish/Maia receipts. `[M]`
3. Implement geometry after its amendment/review; implement the outcome only after the provider/F1
   dependency lands. `[M]`
4. Port the six arms, the D909 geometric inversion and the 288-FEN measurement through production
   declarations; only then close 14/14 and archive the RFC with ledger/log closeout. `[M]`

This staged implementation does not weaken 1.0 or declare 13/14 complete as 14/14. It prevents one
missing source primitive from encouraging a private Syzygy join inside pawn code. `[M]`

## Limits

- This pass did not edit or rerun the concurrent D872 measurement files; it reuses their recorded
  population and adds contract falsifiers. `[V]`
- “Passed with clear forward path” excludes enemy-pawn contest under the shipped passed convention;
  it does not prove safety from every piece. The renamed abstention/limitation must say so. `[M]`
- A production load/default policy for live Syzygy belongs to the provider layer; the existing
  source already bounds one active plus four queued requests, but its receipt/consumer composition
  remains to be unified. `[V]`
