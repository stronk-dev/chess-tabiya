# Recorded path and edge authority

**Question.** What exact graph and evidence authority can prove a complete recorded branch without
duplicating shared ancestry or rewriting the existing move-narrative projection?

**Verdict.** **Use one total graph-derived branch resolver and a new path-independent exact-edge
source.** `[V]` A disposable candidate resolves both sides of a real fork identically under reversed
node-array order and refuses missing parents, cycles, duplicate ids and multiple same-branch tips.
The shared ancestral `e2e4` edge produces one byte-identical authority from both descendant paths
only when requested-branch context stays on the path/window receipt rather than inside the edge.
Instrument: `tools/d1927-recorded-path-review-harness/authority-candidate.test.ts` (6/6 candidate
arms; 11/11 including the original return arms).

## 1. Live authority gap

`[V]` `packages/runtime/src/branch-path.ts` chooses the last same-branch node in `run.nodes`, then
walks parents until lookup fails. The existing return harness demonstrates both false completion
shapes: reordering nodes selects a non-leaf, while a missing parent yields a one-node path rather
than a refusal. The helper also has no visited-set cycle guard. These are graph-authority defects,
not detector failures.

`[V]` The run itself contains enough authority to repair them without a schema migration. Each
branch declares a fork node; each node declares id, parent, actual branch and ply; the single
`run.started` event retains the root node. A total resolver can therefore require unique branch and
node ids, one declared root, an existing fork, every same-branch node reaching that fork, exactly
one same-branch tip, and one cycle-free tip-to-root chain containing every same-branch node.

## 2. Edge identity

`[V]` A forked run produced by the shipped runtime has these paths:

- main: root → `e2e4` → `e7e5`;
- alternative: root → `e2e4` → `c7c5`.

The `e2e4` child retains the main branch as its actual `Node.branchId`, even when it appears as
ancestry of the alternative. An edge authority containing `requestedBranchId` consequently has two
different serialized identities for the same parent/child record. The path-independent candidate
instead retains `runId`, the child's actual `edgeBranchId`, both node ids, both canonical FENs,
canonical UCI, canonical SAN and absolute child ply; it is byte-equal from both requests. This is
[[D1932]].

Branch-relative offset is likewise path context, not edge identity. The path result already retains
the requested branch, and each window receipt retains its start/end nodes and horizon. Duplicating
those fields into every edge would weaken shared Review/longitudinal identity rather than add
source truth.

## 3. Exact adapter boundary

`[V]` `run.record.move@1` is a learner-facing narrative with operands only `context`, `offset` and
`moveSan`; its generic adapter accepts any object containing those keys. It cannot become the exact
edge authority without changing its payload and semantics in place. The candidate therefore uses a
new `run.record.edge@1` machine source whose adapter accepts the run plus actual parent/child nodes,
not caller-authored payload bytes. It replays the move and refuses wrong parent, missing move,
illegal UCI, non-canonical/resulting FEN, SAN or ply.

The source change is not free downstream. `[V]` All eleven recorded-sequence semantic declarations
currently name `run.record.move@1` in their derivation members. Replacing that dependency under the
same `@1` identities would rewrite declared provenance in place. The honest migration is a v2
successor population for those eleven outputs deriving from `run.record.edge@1`; v1 remains
historical/non-production. Detector predicates and convention meanings do not change.

`[V]` The shipped closed inventory cannot yet represent that coexistence. Its authority is
`SEMANTIC_EVENT_PROJECTION_IDS: string[]`; both server checks append `@1`, and catalogue/tests compare
`semanticEvents.map(item => item.projection.id)` as a set. The disposable arm demonstrates the
failure directly: `{deflection@1, deflection@2}` has two exact keys and one base-id member. A
base-id set-equality can therefore pass while an exact version is absent. This is [[D1933]], and it
is a production/governance problem rather than a documentation count.

`[V]` A minimal real `compileEvidenceManifest` arm then registers both v1 (narrative move source)
and v2 (exact edge source) under the same base semantic id and receives two exact compiled event
keys. The manifest compiler already supports the honest migration; the current catalogue helper,
inventory and consumers are the parts that hard-code v1.

## 4. Contract consequence

- Replace order-sensitive `branchPath` behavior with the total graph contract; `branchPaths` must
  delegate to the same authority rather than carry a second head-selection algorithm.
- Add `run.record.edge@1` as exact, recorded-run, machine-condition/inspector input with no ordinary
  sentence renderer.
- Emit only v2 successors of the eleven recorded-sequence projections from the production compiler;
  migrate later module/Review/longitudinal bindings to v2 explicitly.
- Replace `SEMANTIC_EVENT_PROJECTION_IDS` with one literal exact
  `SEMANTIC_EVENT_PROJECTION_REFS: VersionedEvidenceId[]` authority used to build declarations and
  by production/governance consumers. A separately named derived `SEMANTIC_EVENT_FAMILY_IDS` may
  collapse versions only for analysis that explicitly wants logical families.
- Keep requested branch and branch-relative window position in the result/receipt, outside the edge
  payload.
- The value-level source seal and convention receipt remain predecessor work under
  [[D1921]]/[[D1929]]; this result does not invent a private replacement.

## 5. Limits

`[V]` The candidate is disposable and does not mutate production runtime or the manifest. It uses
standard-variant legal replay, matching the current run runtime; variant widening remains owned by
the variants RFC. It does not settle durable convention receipts. Those limits block implementation
acceptance, not the graph or edge-identity decision measured here.
