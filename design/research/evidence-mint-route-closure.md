# Evidence mint-route closure — generic adapters are not the complete boundary

**Question.** Does the D2144 74-row generic-adapter census cover every production path that can mint
`DeclaredEvidence`, and does every non-retired manifest projection have such a path?

**Disposition.** Answered negatively `[V]` at 2026-08-30 HEAD. The corrected generic population is
75, not 74. Together with sixteen specialized/dynamic operations expanded over their closed branch
sets, production exposes **191 mint routes over 187 distinct projections**. Four projections have
two mint routes. The compiled manifest contains 193 projections; six have no mint route, five of
them non-retired but currently unbound.

**Instrument.** The fifth D2144 test expands every specialized operation over the literal schema /
catalogue id sets, joins all routes to `PRIMARY_EVIDENCE_MANIFEST`, freezes duplicate routes and
the no-route population, and fails on an undeclared route or unreviewed manifest addition. `[V]`
(`tools/d2144-evidence-seal-audit/value-authority.test.ts`; `make evidence-seal-audit`)

## The first census was wrong by one

The original regex required an exported adapter name ending in `Evidence`. The source also exports
`declareEvidenceReferenceResolution`, a generic `exactObject` adapter for
`run.record.evidence_ref_resolution@1`; its name ends in `Resolution`, so it was excluded. It is
bound to `runtime.evidence_ref@1`. `[V]`
(`packages/runtime/src/evidence-source-adapters.ts:94`;
`packages/runtime/src/evidence-catalog.ts:802,883`)

The corrected counts are therefore **75 generic / 51 bound**, not 74 / 50. This is not cosmetic:
the missed row is ordinary consumer-reachable evidence, exactly the population the audit was meant
to protect. The permanent regex now matches every exported generic `exactObject` const rather than
a naming convention. `[V]` (D2144 first test)

## Complete production route population

Unit: one `(exported mint operation, projection id)` path. A dynamic operation contributes one row
per admitted projection branch. Total: 191. `[V]`

| Route family | Routes |
|---|---:|
| generic one-projection object adapters | 75 |
| primitive/specialized single projections (pack phase, Maia candidate WDL, legal moves, pawn contacts) | 4 |
| structural reading / transition reading / structural feature predicate routers | 49 |
| opponent provider / live packet / sourcing record routers | 12 |
| compare / run / story derived routers | 14 |
| structural event / transition event / avoidance routers | 37 |
| **Total** | **191** |

`[V]` The sixteen specialized operations and their admitted branch sets are literal in
`packages/runtime/src/evidence-source-adapters.ts:40-42,66-87,122-151,180-268`. The executable
table expands structural ids from the shared schema and event/reading ids from the compiled
catalogue rather than hand-copying their counts.

## Four projections have two authorities that are actually one weak shape

| Projection | Mint routes |
|---|---|
| `human.maia.event@1` | `declareMaiaEventEvidence`; `declareLivePacketEvidence` |
| `live.stockfish.eval@1` | `declareStockfishEvalEvidence`; `declareLivePacketEvidence` |
| `live.syzygy.result@1` | `declareSyzygyResultEvidence`; `declareLivePacketEvidence` |
| `rules.structural.reading.named_structure@1` | `declareNamedStructureEvidence`; `declareStructuralReadingSourceEvidence` |

All four paths accept caller payload values and converge only at `exactObject`; none is an
independent authority. `[V]` (`packages/runtime/src/evidence-source-adapters.ts:44,89-91,210-217,
180-183`). The successor must collapse each to one projection-specific factory. Leaving a
“legacy” route would preserve the bypass even if the preferred route recomputed correctly.

## Six declared projections have no mint route

| Projection | Disposition | Current bindings | Finding |
|---|---|---:|---|
| `rules.structural.reading.pawn_count@1` | retired | 0 | intentionally unminted |
| `derived.grade.move_quality@1` | experimental | 0 | operation specified/implemented elsewhere, never enters declared evidence |
| `theory.opening.current_endpoint@1` | inspector-only | 0 | typed server result exists, no evidence factory |
| `theory.opening.catalogue_membership@1` | inspector-only | 0 | typed server result exists, no evidence factory |
| `run.record.position@1` | inspector-only | 0 | typed server result exists, no evidence factory |
| `derived.opening.deepest_reached@1` | inspector-only | 0 | typed server result exists, no evidence factory |

`[V]` The manifest declarations/dispositions are
`packages/runtime/src/evidence-catalog.ts:248,792-793,803,818,821-830`; the opening operations are
`apps/server/src/opening-catalogue.ts:231-279` and no non-test `declareEvidence` call exists outside
`evidence-source-adapters.ts`.

The five non-retired rows are honest-unreachable today because they have no bindings. A future
module binding must not turn them on by calling a generic mint. The value-authority contract must
give every non-retired row a projection-specific factory and validation profile; honest emptiness
is a typed unavailable result, not an absent authority boundary. `[M]`

## Required successor correction

The RFC closure unit is not “75 old adapters” and not “193 declarations.” It is three joined sets:

1. **191 current mint routes** — all must migrate or disappear;
2. **187 currently mintable projection identities** — each must have exactly one final factory;
3. **6 currently unminted declarations** — retired `pawn_count` stays without a factory; each of
   the other five gains one independently validated factory/profile, whose valid output may be an
   explicit typed unavailable arm until its upstream authority exists.

After the RFC's five old projection retirements and nine successors, the baseline simulation is
202 declarations: six retired (the existing pawn-count row plus the five replaced v1 rows) and 196
non-retired targets. Concurrent catalogue additions must re-derive, not copy, those counts. `[M]`

`DESIGN-GAP:` F1 catalogue presence is not production reach. A projection can be declared with no
mint route, while a projection with two routes has two opportunities to bypass value authority.
Gate B4 needs route/factory closure in addition to producer/projection/consumer closure.
