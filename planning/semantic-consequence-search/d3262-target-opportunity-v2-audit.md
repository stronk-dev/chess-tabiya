# D3492 — versioned target opportunity and complete current-population audit

2026-10-06. Disposable RFC-0000 research; no production search authorization.

## What is fixed

`target-opportunity-v2.ts` introduces `d3262-target-opportunity@2` without editing
the historical observer. Material opportunities enumerate the named actor's legal
moves and match **the actual captured piece's square**, not the landing square.
All legal positive-local-exchange promotion choices remain separate actions with
their promotion role, landing square, captured square and exchange value.
Execution accepts any such action, not only a canonical first witness.

Permanent controls demonstrate positive en-passant, all four capture-promotions,
execution of each promotion, expired/pinned/equal-exchange EP refusal, ordinary
equal/losing captures, off-turn/terminal refusal and preserved destination behavior.
The original observer remains unchanged and its known-gap controls remain true.

## Complete audit scope

The scope is the **current corrected 193-candidate / 66-root / 182-cell /
64-definition population**, including all four controls. The original 196-candidate
population is explicitly preserved and excluded, not relabelled or silently fixed.
No new engine/model source is captured or rank/order/weight changed.

The node pool contains **339,764 distinct board/identity/terminal states**. All
**1,519,144 snapshot occurrences** are counted separately, including immediate,
preparation, learner-defence and actual fourth-ply states where present:

| Scope | Ply 1 | Ply 2 | Ply 3 | Ply 4 | Changed availability/outcomes |
|---|---:|---:|---:|---:|---:|
| Complete legal baseline | 182 | 5,886 | 189,651 | 0 | 0 / 0 |
| Actual model observations | 6,647 | 6,647 | 6,647 | 5,387 | 0 / 0 |
| Actual engine and first-reply reserve | 166,835 | 166,835 | 166,835 | 149,927 | 0 / 0 |
| Actual recursive observations | 166,137 | 166,137 | 166,137 | 149,254 | 0 / 0 |

The complete legal baseline is recomputed under v2, rather than copied from the
old verdict. Every offered candidate's legal preparation/defence graph is checked;
every named cell's eligible preparation and nonempty defence set is replayed.
Absorbing terminals are not extended or used as vacuous universal positives.
Per-cell node references, preparations, defences, omissions, old/new values and
changed fields remain in the artifact.

**Zero of 182 baseline outcomes changes.** There are still **58 possible named
reintroductions and eight cells with a preparation surviving every legal defence at this
bound**. There are no affected selected snapshot/action/outcome rows. This clears
the immediate/earlier-stage uncertainty for this fixed current population; it
does not prove the old predicate correct in general or clear arbitrary future
packs. Model occurrences include retained arm-specific duplicate observations;
none of these counts is an independent-game count or human probability.

## Verification

- `make semantic-search-target-v2-audit-check`: TypeScript check; six special-move,
  execution, legality/terminal and ordinary-predicate controls; two audit controls,
  including **nine actual input corruption refusals** for source joins, populations,
  controls and omitted legal decisions; the change detector also receives real EP
  and plural-promotion positive controls so a zero affected-case count cannot come
  from an inert comparison; full **byte-identical reconstruction**.
- `make semantic-search-target-v2-independent`: five Python boundary controls;
  full independently reconstructed node pool, legal baseline, snapshot counts,
  opportunity sets, plural witnesses, execution and changes; **12 actual output
  corruption refusals** for forged authority/convention/quantifiers, population,
  missing nodes/cells, false actions/boards/captured squares, boolean node identity,
  universal survival and erased stages.
- python-chess separately implements the literal legal local-exchange minimax:
  fixed piece values, promotion gain, legal recaptures at the landing square and
  optional zero-valued stopping. It re-infers the numerical convention rather than
  accepting JS exchange scores. This is computational independence, **not independent
  strategic truth**, arbitrary-depth minimax or an engine reason.
- Previously checked selected state inputs are pinned by literal physical hashes.
  The complete legal baseline is independently enumerated/replayed. This audit does
  not claim a new engine-PV/model-policy source re-inference or fresh production
  software/browser/GitHub result.

Artifact `d3262-target-opportunity-v2-audit.json.gz`: **16,911,774 bytes**, physical
SHA-256 `95295ad43ef1e41ade4eb4405aaf9302490bf5533837b74148ecba5e065bd144`.
It binds all seven immutable source hashes and the historical/v2 evaluator hashes.
Old sources, selector preregistration, artifacts and result populations are unchanged.

## Closeout and next

D3492 closes the research-oracle repair, all-stage affected-case audit and separately
versioned bounded baseline. Future search calibration must use v2's plural action
contract rather than promoting the known-incomplete scalar observer. Current
frozen results remain valid within their explicitly bounded population and convention.

D3262 remains doing: finish the complete five-arm proof/refutation/abstention join,
joint-policy stopping, phase/focus and controlled cold/warm/offline cost before
choosing a production profile. No draft RFC acceptance, production consumer,
capability/milestone promotion or official content graduation is claimed. Routine
tracker/hash closeout is automatic.
