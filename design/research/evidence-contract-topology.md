# Evidence contract topology — what is actually pooled, selectable and renderable?

**Question:** Does the shipped foundation already provide one evidence pool that can power bounded
support, dynamic hints, review, theory links and an explicit inspector, or do those consumers see
different partial products?

**Ledger:** D634; re-verifies D145, D147, D318, D546 and D630.

**Method:** static executable contract audit over production source plus the disposable
`tools/evidence-topology-harness/`. The harness pins every current namespace count, fourteen
producer paths, the server/client capability mismatch, the sentence allow-list boundary and the
absence of production joins to the R3 module/workflow vocabulary. It ran at commit `9b1ee0a`; the
uncommitted feedback-delivery work changes neither the audited production anchors nor the
`Capabilities` interface region. `[V]`

**Command:**

```text
./node_modules/.bin/vitest run --config tools/evidence-topology-harness/vitest.config.ts
```

**Result:** 3/3 tests pass. A passing audit describes a negative product result: the namespaces and
side channels are pinned accurately; it does not bless them as the desired architecture. `[V]`

## 1. Verdict

There is no shared evidence pool in production today. There are several useful evidence planes,
but the joins that would turn them into one product contract are research-only. Fourteen audited
producer paths terminate in five different states: four are renderer-visible, four are typed but
cannot participate in LLM selection/rendering, three are runtime side channels, two are standalone
source panels and one is sourcing-only. `[V]` (`tools/evidence-topology-harness/output.md`)

The most important distinction is not backend versus frontend. It is:

1. **produced** — some computation or source returned a fact;
2. **semantically retained** — its subject, object, sign, squares, source and uncertainty survived;
3. **eligible for a named consumer** — the fact may support this module at this timing;
4. **selected** — it survived local relevance and the module's fact budget;
5. **rendered** — sentence, square, arrow, timeline, audio or inspector row;
6. **composed into a workflow** — a preset requests it and the session ceiling permits it.

Production has pieces of steps 1, 2 and 5. The disposable R3 prototype has synthetic versions of
steps 3, 4 and 6. No compiled join connects them. `[V]` (`apps/server/src/guidance.ts`;
`packages/runtime/src/voice.ts`; `tools/r3-presentation-harness/module-contract.ts`;
`tools/r3-presentation-harness/workflow-contract.ts`)

This directly confirms the owner's concern: exposing more toggles over current sources would make
the raw-dump UX richer without making support more helpful. The foundation needs a compiler
boundary before it needs another settings surface. `[M]`

## 2. Namespace census

| Contract | Members | Actual join |
|---|---:|---|
| Runtime event payload kinds | 4: `eval`, `wdl`, `bestline`, `tablebase` | **0/4** names match the sourcing-ledger vocabulary |
| Sourcing-ledger evidence kinds | 7 | only `engine_eval` and `tablebase_result` are admitted as recorded readings |
| Rules evidence facts | 34 | family-name refs; structural/transition operands are not encoded in the ref |
| Capability dispositions | 39 | their 8 free-text `surface` values match **0/7** canonical surface IDs |
| Production assistance axes | 9 | no compiled join to a producer or module registry |
| R3 research contracts | 9 modules, 5 presets, 6 workflows | **0** module IDs and **0** workflow IDs occur in production source |

All counts and zero-intersection results are executable `[V]` controls in
`tools/evidence-topology-harness/audit.test.ts`. The zero name intersection between runtime events
and sourcing records does not itself imply a bug—`eval` and `engine_eval` can be deliberate
projections. The defect is that no declaration records that relationship, version, narrowing or
consumer consequence. `[M]`

## 3. The fourteen producer paths

| Producer | What survives | Where it ends |
|---|---|---|
| Structural rules | uneven typed observations; rules refs keep only family | generic board/compare dumps; only named structures enter the voice sentence allow-list |
| Transition rules | direction/subkind/count locally; no affected square in 3,371/3,371 observations | client-local raw transition dump; absent from `EvidencePacket` |
| Phase | phase and author/detector source | packet + deterministic/LLM-visible sentence |
| Pivotal markers | marker kind/node and frozen sentence | packet + marker UI/voice |
| Endgame reader | typed position reading | packet + deterministic/LLM-visible sentences |
| Shape/theory matcher | shape ID, name, attribution | typed `plans` field and separate story/guided paths; no sentence/applicable passage |
| Authored feedback | text, ID and reveal attribution | packet + sentence |
| Recorded Stockfish | score, depth, identity/version/date | packet `readings`, appended after LLM checking |
| Recorded Syzygy | category, distances, terminal facts/date | packet `readings`, appended after LLM checking |
| Live Stockfish | generic event values and evidence ref | guard/compare/story/analysis side channel; absent from packet |
| Live Syzygy | generic event values and evidence ref | opponent/guard/ref-rendering side channel; absent from packet |
| Maia | candidate moves, policy mass, band and identity | opponent selection + raw on-request human-split panel |
| Lichess Explorer | population, outcome/move counts, shares, recency or abstention | raw on-request corpus panel |
| Opening identity | ECO, name, SAN and source | sidecar only; runtime recorded-reading policy explicitly refuses it |

The table is a condensed projection of executable source anchors in
`tools/evidence-topology-harness/registry.ts`. `[V]`

### 3.1 The packet is not the pool

`EvidencePacket` looks comprehensive: FEN, phase, structures, observations, markers, endgame,
plans, authored items, readings and sentences. But `voiceCheck()` treats only
`packet.sentences.join("\n")` as the normative evidence source. `evidencePacket()` adds named
structures, phase, markers, endgame and authored text to that array; it does not add generic
structural observations or matched plans. `[V]` (`packages/runtime/src/voice.ts:51-61,109-117`;
`apps/server/src/guidance.ts:33-49`)

Recorded engine/tablebase readings are different again: they are deterministically rendered and
appended **after** provider output passes `voiceCheck`. That is safe against LLM embellishment, but
it means the LLM cannot translate, combine or select those readings. `[V]`
(`apps/server/src/guidance.ts:52-69`)

Transition readings, Maia human splits, Explorer corpus results and opening identity never enter
the packet at all. The first is recomputed by the web client; Maia and Explorer have separate REST
pages; opening identity stays in sourcing. `[V]` (`apps/web/src/lib/DrillScreen.svelte:334-338`;
`apps/server/src/rest.ts:1140-1179`; `apps/server/src/sourcing/openings.ts:135`)

So “let the LLM translate all pooled evidence into a hint” is not a description of the current
system. Today it rewrites a selected subset of deterministic sentences, while other evidence is
appended verbatim or displayed in separate raw panels. `[V]`

### 3.2 Evidence refs are citations to a family, not semantic events

The 34 rules refs include all 18 structural and six transition family names plus terminal/material
facts. A structural or transition ref does not carry the observed pawn, piece, square, ray,
direction, count or subkind. `renderEvidenceRef()` can therefore return only a fixed family sentence
unless another payload path happens to exist. Unknown refs fall back to “Evidence recorded.” `[V]`
(`packages/runtime/src/evidence-ref.ts:1-93`; `apps/web/src/lib/evidence-sentences.ts:137-190`)

This is a separate loss from D630. D630 proves the transition reader itself drops affected squares;
the ref layer then drops even the operands that do survive the reader. A future highlight cannot
recover them from the family name, and law 8 forbids asking an LLM to guess them. `[M]`

### 3.3 Capability disposition is missing the decisive dimensions

The server's 39-row capability table gives an instrument one global disposition and an optional
free-text surface. It cannot state “refused as a pre-commit condition, admitted in an explicit
analysis inspector, withheld from a participant, available after disclosure.” Its eight surface
strings match none of the seven canonical `SurfaceId`s, and the web `Capabilities` interface omits
`capabilityDispositions` entirely. `[V]` (`apps/server/src/capabilities.ts:36-45,82-154`;
`apps/web/src/lib/api.ts:294-352`)

The Stockfish row makes the missing dimension observable: `bestmove / MultiPV rank / bestline` is
globally `refused` because move verdicts are not condition measurements, while `/analysis` accepts
`bestline`, the web analysis method requests it, and even an `eval` payload carries
`bestMoveUci`. `[V]` (`apps/server/src/capabilities.ts:115`; `apps/server/src/rest.ts:1474-1486`;
`apps/web/src/lib/api.ts:963-968`; `apps/server/src/evidence-queue.ts:395-414`)

This re-verifies D318 rather than opening a duplicate defect: the reason can correctly refuse one
consumer and still be false as a product-wide verdict. The production manifest needs consumer,
timing/disclosure, role/session ceiling, permitted forms and answer-distance—not only instrument
and surface prose. `[M]`

## 4. What the “shared evidence plane” must mean

The compiler should not flatten every source into one lowest-common-denominator blob. “Shared”
means a module can query a common typed envelope and the registry can answer both directions:

- which producer/version can supply this evidence kind;
- which semantics are retained or deliberately projected away;
- which modules may consume it at which timing and disclosure;
- which forms are legal (sentence, square, arrow, timeline, panel, audio);
- whether it may contain a move, ranking or principal variation;
- what confidence/exactness, freshness, cost and abstention apply;
- which advanced inspector/author/operator surface exposes the raw primitive;
- which packs depend on the semantic version.

This preserves source-specific payloads while making their eligibility and projections explicit.
It also satisfies the owner's ruling that every primitive be configurable **somewhere** without
making ordinary players configure engines, classifiers or data sources. `[M]`

The minimal flow is:

```text
producer/version
  → typed evidence event (anchor + sign + operands + grounding + abstention)
  → consumer eligibility
  → local selector / module budget
  → renderer(s)
  → preset request ∩ session ceiling
  → workflow surface
```

Raw data may terminate at an inspector. Authored predicates may terminate at authoring validation.
Experimental outputs may terminate at a research harness. Those are explicit dispositions, not
orphans disguised as feature toggles. `[M]`

## 5. Consequences for support, theory and review

### Support and hints

The nine-module R3 prototype is the right abstraction boundary but presently synthetic. A
`postcommit_nudge` needs a signed event with retained squares; `blunder_prevention` needs bounded
counterfactual consequence evidence without an alternative move; `guided_hint` needs a progressive
answer-distance policy. None may consume a whole structural reading or raw `bestMoveUci` merely
because the producer returned it. `[V]` for the research contract; product admission remains
unvalidated (`tools/r3-presentation-harness/module-contract.ts`).

### Theory

Opening identity and shape matches already exist, but they terminate on opposite sides of the
runtime boundary. A theory breadcrumb needs a typed applicability key and cited passage joined to
the selected evidence event; an ECO/name record or shape ID alone is not a strategic explanation.
The separate R4 result remains binding: deterministic typed retrieval, provenance and abstention,
not a live scraper or semantic agent inside a hint request. `[V]`
(`design/research/theory-knowledge-pipeline.md`)

### Review

Review cannot be “all evidence after the game.” It needs a consumer-specific moment selector, then
links each selected moment to retry/branch/drill/theory actions. Live Stockfish, Maia and corpus
paths are mechanically available, but there is no shared event identity or review consumer binding
across them. R7 remains a real research question; this audit removes the false premise that the
backend pool is already ready for it. `[M]`

### Full analysis

The explicit inspector is the correct home for raw engine lines, WDL, human move mass, corpus rows,
tablebase distances and low-level classifier atoms. It should expose source, version, population,
uncertainty and abstention. It must not be the default support UX, and its existence must not grant
those values to another module. `[M]`

## 6. RFC and roadmap consequence

F1 is not an aspirational cleanup. It is the missing compilation boundary between already-shipped
producers and every later consumer. It must reconcile the existing `shared-resource-registers`
draft and derive these joins from primary declarations rather than create another handwritten
table. `[M]`

F1 acceptance needs at least:

1. separately versioned predicate, reading and learner-event projections;
2. one producer/module declaration source with derived bidirectional joins;
3. typed source, anchor, sign, operands/squares, exactness/confidence, freshness/cost and abstention;
4. consumer/timing/disclosure/role/session/form/answer-distance dispositions;
5. explicit `inspector_only`, `author_only`, `operator_only`, `experimental` and `retired` homes;
6. derived pack dependency/migration impact, including indirect semantic dependencies;
7. failure on unexplained producer or consumer or on a generic-reader bypass;
8. an adapter/migration plan for runtime events, sidecar records, evidence refs and packet fields;
9. provider-off and unavailable-source composition tests;
10. proof that R3's module IDs/presets can bind without becoming the primitive registry.

F2 then owns semantic learner events and selection; F5 owns modules/presets/interaction. Putting
eligibility, selection or default UX into F1 would recreate the coupling this audit found. `[M]`

## 7. Refusals and limits

- **Refuse one universal payload shape.** Stockfish PVs, corpus populations, exact rules events and
  cited theory passages have different semantics; the envelope is shared, not every value field.
- **Refuse “everything reaches the LLM.”** The LLM remains an optional renderer after eligibility
  and selection. Deterministic rendering is normative and provider-off must retain the workflow.
- **Refuse a settings-first repair.** Advanced configuration must expose every primitive's legal
  disposition, but ordinary workflows choose presets/modules.
- **Refuse treating namespace equality as the fix.** `eval`→`engine_eval` is a valid narrowing if
  it is declared and tested. Renaming without projection semantics produces a prettier false join.
- **This pass does not validate module usefulness.** R3 participant work and R7/R8 workflows still
  decide exact module admission/defaults. It proves only that production cannot currently enforce
  the intended boundary.

## 8. Gate effect

- **B4 remains unmet and is narrowed:** every named evidence source has some mechanical path, but
  the “layers with timing controls” do not share a consumer contract. Fourteen paths produce five
  incompatible delivery states; no production module/workflow join exists. `[V]`
- **Gate F remains closed:** its versioned producer→evidence→consumer manifest clause is now backed
  by an executable negative baseline rather than a design assertion. `[V]`
- **No kill criterion is called.** The failure is a named architectural defect with a routed repair,
  not evidence that grounded rehearsal cannot work. `[M]`

