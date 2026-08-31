# RFC: Assistance shared-resource registers

- **Status:** draft — **RETURNED by sixth fresh independent review 2026-08-31 on
  [[D2450]]–[[D2454]].** The truthful workflow-v1 and one-way absence repairs survive, but the
  workflow/permission deltas omit their own authorities, exchange has no landed semantic tree,
  permission operation identity has no same-membership lifecycle, and the RFC conflicts with the
  active generic register bootstrap. `make assistance-register-sixth-fresh-review` reproduces
  5/5. C9/register/v5 implementation remains forbidden.
- **Author:** codex
- **Created:** 2026-08-26
- **Design refs:** none. This is repository process over an already-ruled assistance contract; it
  chooses no preset, permission, disclosure or UX behavior.
- **Exploration gate:** passed by `design/research/assistance-config-shared-resource.md`,
  `design/research/assistance-shared-resource-boundaries.md`, [[D1581]] and [[D2328]]. The live
  types, historical heads, browser persistence/migration boundary, absent exchange, current
  claimants and exact checker delta are verified at HEAD.
- **Depends on:** implemented `rfc/archive/shared-resource-registers.md`; RFC-0000 rule 7
- **Parent / amends:** follows up immutable `rfc/archive/shared-resource-registers.md`; amends
  `rfc/README.md` with its register and `tools/register-check.mjs` with the derived reader/check.
  RFC-0000 rule 7 is already generic and is not edited ([[D1628]])
- **Supersedes / superseded by:** —
- **Planning:** `planning/assistance-config-register/`

```tabiya-claims
none
```

## Fifth fresh independent return (2026-08-30)

The extension is returned on [[D2355]], [[D2356]], [[D2357]], [[D2358]], [[D2359]] and
[[D2360]]. The live workflow-v1 grammar is open/context-dependent; workflow and exchange lack
exact resource roots/trees; landed→absent is unguarded; permission semantics exceed its claim; and
the positive test proves only prose. `make assistance-register-fifth-fresh-review` reproduces all
six. No implementation is authorised.

## Fifth-return author repair (2026-08-31)

The repair keeps historical bytes honest rather than silently upgrading them. Workflow-v1 is an
open object whose recognised `preset` is admitted against the requested context's live policy;
unknown keys are ignored and invalid input falls back to that context's default. Workflow-v2 is
the first strict, self-describing durable preference. Both states have exact roots and authority
populations below.

The future exchange is absent only when
`packages/runtime/src/presets.ts#ASSISTANCE_EXCHANGE_VERSION` has never landed. Once any landed
history exists, deletion or rename is a fatal regression, not a return to absence. The `legal`
permission claim covers the union and all four operations that construct or project it. The
disposable model in `tools/d2355-assistance-register-author-repair/` executes the valid first
landing plus the invalid empty, skipped-lane and landed→absent paths. It specifies this RFC only;
it is not production register code.

## Sixth fresh independent return (2026-08-31)

The fifth-return repair's truthful workflow-v1 and landed-to-absent rules survive. The amended
resource boundaries remain unbuildable on five seams:

- [[D2450]] — workflow-v2's eight-symbol delta omits changed authority nodes and transitive grammar;
- [[D2451]] — the permission delta omits `ConfigClamp` and pointwise composition;
- [[D2452]] — exchange has no landed authority graph or canonical contract-digest image;
- [[D2453]] — permission operation semantics can change without a representable member claim; and
- [[D2454]] — this bespoke `RESOURCE_NAMES`/C9 architecture conflicts with the active catalogue
  bootstrap that deletes `RESOURCE_NAMES`.

`make assistance-register-sixth-fresh-review` reproduces 5/5. Exact evidence is in
`planning/assistance-config-register/sixth-fresh-independent-buildability-review-2026-08-31.md`.
An author repair must reconcile the process dependency and close the complete before/after
authority graphs before another independent review.

## Summary

Register the four assistance resources at their actual boundaries. `AssistanceConfig` remains the
shared effective configuration it already is. The tree half is the
numeric version plus a normalized digest of its closed field domains **and every operation that
constructs, permits, persists or configures that shape**. The future half is one live head+1 claim
over the exact authority-graph delta. Guided Hint owns v5; `intent-presets` depends on and
exhaustively projects that shape without claiming it independently. Durable workflow intent,
web/server exchange stages and the permission vocabulary receive separate identities because they
have different readers, change triggers and transition rules.

This RFC changes no assistance value and authorizes no v5 runtime implementation. It makes the
existing v5 intent visible to the same collision/drift machinery that already guards schemas,
migrations and `EVIDENCE_KINDS`.

## Motivation

RFC-0000 rule 7 registers a resource when it is versioned or closed, can be moved incompatibly by
parallel drafts, and crosses a package/schema boundary. `AssistanceConfig` satisfies all three:
runtime exports literal head 4 and nine closed axes; web persists the complete object and migrates
v1-v3; Guided Hint proposes head 5 while presets must add the same field to two exhaustive tables.
The evidence and symbol census are in `design/research/assistance-config-shared-resource.md`.

The defect is active, not hypothetical. Both current RFC claim blocks say `none`, and
`register-check`'s `RESOURCE_NAMES` cannot express `assistance-config`. A second draft could reserve
a different v5 meaning and every governance gate would stay green.

The declaration census does not close this. It records 32 assistance property/string subjects but
omits numeric `version=4`; its token-level producer counts deliberately answer reach, not persisted
shape identity. Importing its output would make the register appear more complete while leaving the
version invisible.

The scope is deliberately process-only: register identity, claims, drift and fixtures. Preset
defaults, permission algebra, v5 migration bytes, UI and hint semantics stay in their product RFCs.

## Specification

### 1. Canonical resource and claim grammar

`tools/register-check.mjs` adds the literal canonical resource `assistance-config` to
`RESOURCE_NAMES`. RFC-0000 rule 7 already defines the predicate and gains no hand-maintained
resource example; the executable resource↔README bijection remains the inventory ([[D1628]]). The
claim grammar adds exactly:

```text
assistance-config | lane <positive integer> | <non-empty changed symbols>
```

Unlike schema lanes, this resource is a **single-writer sequential payload**:

- at most one active RFC may claim it;
- its claim must be exactly `tree head + 1`;
- a bare member claim, same-head claim or skipped head is refused;
- generic C3 declaration↔README set equality still applies.

The stronger rule is required because one browser migrator parses the complete object. A v6
author cannot correctly implement v5→v6 against an unlanded v5 shape, and two v5 authors cannot
both own the same discriminator.

For this resource, `changed symbols` is machine-readable rather than descriptive prose: one or
more ASCII-sorted unique tokens separated by `; `, each matching
`^[A-Za-z0-9_./-]+\.(?:ts|svelte)#[A-Za-z_$][A-Za-z0-9_$.]*$`. The transition reader derives these tokens from
the previous and current source trees; no caller supplies a supposedly complete list.

The closed authority census is one executable graph, not a list of trusted roots. Its node and edge
kinds are closed and exhaustive:

```ts
type AssistanceSemanticKind =
  | "shape_field" | "constructor" | "permission_projection"
  | "storage_key" | "storage_read" | "codec" | "migration"
  | "storage_write" | "serializer" | "advanced_projection" | "run_projection";

type AssistanceTraversalKind =
  | "callable" | "import_alias" | "reexport_alias"
  | "component" | "template_operation" | "typed_field_write";

type AssistanceObservationKind = "declaration_observer";
type AssistanceAuthorityKind =
  | AssistanceSemanticKind | AssistanceTraversalKind | AssistanceObservationKind;

interface AssistanceAuthorityNode {
  readonly kind: AssistanceAuthorityKind;
  readonly module: string;       // workspace-relative production path
  readonly symbol: string;       // declaration or generated Svelte operation identity
  readonly bodyDigest: string;   // canonical semantic subtree, 24 lowercase hex
  readonly influence: "authority" | "product_consumer" | "observer";
}

type AssistanceAuthorityEdgeKind =
  | "imports" | "calls" | "reads" | "writes" | "serializes"
  | "parses" | "migrates" | "constructs" | "permits" | "projects";

interface AssistanceAuthorityEdge {
  readonly from: string;         // `${module}#${symbol}`
  readonly kind: AssistanceAuthorityEdgeKind;
  readonly to: string;
}
```

The graph builder derives the production workspace from `pnpm-workspace.yaml`, resolves every
matched package's `package.json` plus TypeScript project, and scans every non-test production
`.ts` and `.svelte` module reachable from that package's build/export roots. It does not hard-code
web, runtime, server or a current package count. Test/config/generated-output roots are classified
and excluded by one literal policy; a new workspace package is inside discovery on its first
committed production source file. TypeScript nodes come from one pinned compiler `Program` and
`TypeChecker` spanning those projects. For Svelte, the pinned `svelte/compiler` parser extracts the
instance script into a virtual TypeScript source and walks every template expression separately;
a component and each assistance-relevant template operation receive stable generated symbols.
Thus every non-test production `.ts` and `.svelte` module in the derived workspace is either
reachable/classified or explicitly outside the build/export roots; no package-local scan list is
an authority.

Every resolved assistance reach receives exactly one `influence`. `authority` constructs,
permits, persists, parses, migrates or serializes values. `product_consumer` reads a value to alter
runtime/UI behavior or forwards it into another product operation. `observer` may inspect the
declaration/type to emit a census or developer report but cannot read a runtime value or influence
permissions, persistence or rendering. The current server
`declaration-census.ts#assistanceEntries` is an explicit observer positive: it remains in the
closure receipt but its body does not move the contract digest. Turning that same module into a
runtime `config.guided` reader reclassifies it as a product consumer and moves identity.
Unknown/mixed influence is a named refusal; “server” or “tooling” is never itself an exemption.

Imports, re-exports, ordinary callables, wrapper helpers, components and template operations are
literal traversal nodes, not edges whose endpoints cannot be represented. The current
`packages/runtime/src/index.ts#AssistanceConfig` re-export therefore remains visible between the
runtime declaration and both web imports. Two aliases may converge on the one storage writer
without becoming two writers. Traversal uses resolved symbol identity plus a visited set; a cycle
is retained as a sorted strongly connected component and terminates, while an unresolved dynamic
call or ambiguous symbol is a named failure. Every source-to-semantic-target path is retained in
the receipt; no transparent-edge contraction or hand-built shortcut exists.

An unsupported script language, unresolved import/call target or template expression the walker
cannot classify is a named hard failure, never an omitted node. A computed assistance field is
admitted only as a `typed_field_write` when the TypeChecker proves all of the following:

1. its key type is set-equal to `keyof Omit<AssistanceConfig,"version">`, not merely assignable;
2. its value type is exactly `AssistanceConfig[Key]` under that same type parameter;
3. the object update spreads exactly one resolved `AssistanceConfig` value and writes no other
   computed property; and
4. every production call site supplies one literal member of that closed key set and is represented
   by its own call/template-operation edge.

This admits the current `AssistanceSettings.set` and `DrillScreen.setAssistance` definitions and
their literal UI calls. A `string`-widened key, `version`, an unknown literal, `any`, a cast used to
erase the constraint or an unregistered indirect call fails. No generic “dynamic key” exception is
introduced ([[D2190]]).

Canonical subtree bytes are a recursive tuple of TypeScript/Svelte syntax kind, resolved symbol
identity, operator and literal value. They exclude trivia, source offsets, local binding names and
formatting, but retain called operation identity, property identity, control-flow branches and
literal defaults. Nodes are sorted by `(module,symbol,kind)`; edges by `(from,kind,to)`; duplicate
node identities and edges fail. The graph digest is SHA-256 over canonical JSON of both arrays,
truncated to 24 lowercase hex. Renaming a local variable or reformatting is stable; changing a
storage namespace, version branch, migration default, unknown-field rule, serializer, constructor,
permission field or Advanced/run projection changes the graph.

Discovery begins at every resolved `AssistanceConfig` declaration, import, field reference and every literal or
computed access to the `tabiya.assistance.` namespace, then follows imports, calls and property
reads/writes in both directions until closed. It must contain exactly one storage-key constructor,
one production reader and one writer; every namespace access must be dominated by those operations.
The reader and writer call the same key constructor. The writer serializes the current-head object;
the reader parses/migrates to that same head. `SILENT_ASSISTANCE`, `PROFILE_DEFAULTS`,
`permittedAssistance`, the Advanced settings projection and the run-screen projection are mandatory
semantic nodes. `AssistanceSettings.set`, `DrillScreen.setAssistance`, their literal calls, the
runtime barrel re-export and every classified workspace reach are mandatory traversal/observation
nodes. A second namespace reader/writer, validator, migrator, serializer or unresolved alias fails
closure before transition comparison, as does any unclassified assistance-property consumer. An
unimported file with no assistance field or namespace reach is outside the graph; a resolved type
import is a reach and must be classified. Tests/docs are ignored by the explicit root policy, not
by substring accident.

The graph is explicitly phase-aware ([[D2113]]). Bootstrap v4 admits and seals the current
`validV4` plus `migrate` operations in `assistance-preference.ts`; it does **not** pretend the future
runtime codec exists. The v5 transition must delete both local operations, add the sole
`packages/runtime/src/assistance-codec.ts#parseAssistanceConfig` codec/migrator, and make
`loadAssistance` delegate parsed unknown bytes to it. A v5 landing retaining either local operation
or adding a second codec fails even if the field matrix is correct.

For claims and transitions, a changed-symbol token is derived from the symmetric difference of
prior/current node identities, body digests and incident edges. A deletion uses the prior node's
`module#symbol`; an addition uses the current node; a body/edge change uses that identity once.
Callers never supply this set. C9.6 compares it set-equal to the prior claim; the human-readable
README change column remains separate.

This process RFC itself claims `none`: it changes the register system, not `AssistanceConfig`.
On this RFC's implementation, `hint-distance.md` changes its block atomically to:

```text
assistance-config | lane 5 | apps/web/src/lib/AssistanceSettings.svelte#AssistanceSettings.hintDistance; apps/web/src/lib/DrillScreen.svelte#DrillScreen.hintDistance; apps/web/src/lib/GuidedHintSeat.svelte#GuidedHintSeat.requestHint; apps/web/src/lib/assistance-preference.ts#loadAssistance; apps/web/src/lib/assistance-preference.ts#migrate; apps/web/src/lib/assistance-preference.ts#saveAssistance; apps/web/src/lib/assistance-preference.ts#validV4; apps/web/src/lib/run-state.ts#RunStateStore.requestHint; packages/runtime/src/assistance-codec.ts#parseAssistanceConfig; packages/runtime/src/assistance.ts#AssistanceConfig.hintDistance; packages/runtime/src/assistance.ts#AssistanceConfig.version; packages/runtime/src/assistance.ts#SILENT_ASSISTANCE; packages/runtime/src/assistance.ts#permittedAssistance; packages/runtime/src/presets.ts#PRESET_DECLARATIONS.config.hintDistance; packages/runtime/src/presets.ts#WORKFLOW_CONTEXT_POLICIES.configClamp.hintDistance
```

Deleted legacy operations are valid tokens because the transition reader resolves the union of
parent and current graphs. This list is not guessed from filenames: the author repair derives it
from the exact v5 obligations and current graph. C9 implementation must reproduce it from source
snapshots before installing the claim. If it finds another changed constructor, permission,
persistence, traversal or product-consumer node, the claim and this RFC are amended before
implementation rather than weakening set equality. The last five added consumer tokens close one
non-vacuous path: `DrillScreen.hintDistance` passes the effective rung ceiling into
`GuidedHintSeat.requestHint`, which invokes `RunStateStore.requestHint`;
`PRESET_DECLARATIONS.config.hintDistance` supplies every preset value and
`WORKFLOW_CONTEXT_POLICIES.configClamp.hintDistance` supplies every context ceiling. Removing the
seat/store edge or either exhaustive column fails C9.6. This process contract does not choose their
values: [[D1639]] must be owner-ruled and mirrored in both product RFCs before this exact claim may
land.

`intent-presets.md` retains its current claim disposition, names `hint-distance` as the v5
AssistanceConfig owner/dependency, and updates its stale “returned to research” prose to “awaiting
the [[D1639]] owner ceiling ruling, then repeat independent review.” Its product implementation
adds the exhaustive preset/clamp columns in the same v5 landing; dependency is not a second
AssistanceConfig claim. Any separate shared wires or vocabularies that `intent-presets` must
register remain its own returned [[D2178]] work and are not laundered here.

The dependent phase remains: awaiting the [[D1639]] owner ceiling ruling, then repeat independent review.
This sentence is deliberately literal so cross-RFC status checks do not infer acceptance from the
process repair.

### 1a. Three adjacent resources and the absent-head transition ([[D2178]], [[D2328]])

The original scope registered only effective `AssistanceConfig`. The intent-presets return proved
that three adjacent contracts independently satisfy RFC-0000 rule 7. They are registered here,
using the same executable resource↔README bijection, without changing their product bytes:

| resource | landed tree state | transition grammar |
|---|---|---|
| `assistance-config` | head 4, derived from the exported versioned nine-axis interface and its complete authority graph | numeric single-writer lane; hint-distance reserves lane 5 |
| `workflow-preference` | head 1, rooted at `apps/web/src/lib/assistance-preference.ts#loadWorkflowPreset`; open unknown-key grammar plus context-dependent preset admission | numeric single-writer lane; intent-presets reserves strict lane 2 over the exact eight-symbol transition |
| `assistance-exchange` | **absent**, derived only from absence of `packages/runtime/src/presets.ts#ASSISTANCE_EXCHANGE_VERSION` and empty landed history | exactly one `first lane 1` claimant over the exact ten-symbol first transition; absence can never recur after landing |
| `assistance-permission` | members `evidence, free, locked_off, sight`, derived from the exported union and every operation that returns/projects it | closed member claims; intent-presets claims `legal` over the exact five-symbol transition |

`RESOURCE_NAMES` gains all three literal names. `workflow-preference` uses the existing numeric lane
rules. Its historical head-1 grammar is exactly:

```text
root: apps/web/src/lib/assistance-preference.ts#loadWorkflowPreset
version: 1
recognised preset values: packages/runtime/src/presets.ts#PRESET_IDS
unknown object keys: ignored
context admission: WORKFLOW_CONTEXT_POLICIES[context].allowedPresets
invalid/missing input: workflowContextPolicy(context).defaultPreset
```

This is a description of shipped compatibility, not an endorsement of open protocols. The v1
digest contains the following ASCII-sorted authority population exactly:

```ts
interface WorkflowPreferenceTree {
  readonly kind: "landed";
  readonly head: 1;
  readonly root: "apps/web/src/lib/assistance-preference.ts#loadWorkflowPreset";
  readonly authorityNodes: readonly AssistanceAuthorityNode[];
  readonly authorityEdges: readonly AssistanceAuthorityEdge[];
  readonly authorityDigest: string;
  readonly digest: string;
}
```

`WORKFLOW_PREFERENCE_ROOTS` is the following closed authority population; it is executable input
to tree derivation rather than a documentation-only census:

```text
apps/web/src/lib/assistance-preference.ts#loadWorkflowPreset
apps/web/src/lib/assistance-preference.ts#saveWorkflowPreset
apps/web/src/lib/assistance-preference.ts#workflowKey
packages/runtime/src/presets.ts#PRESET_IDS
packages/runtime/src/presets.ts#WORKFLOW_CONTEXT_POLICIES
packages/runtime/src/presets.ts#workflowContextPolicy
```

Workflow-v2 is the first strict grammar and its claim/transition population is exactly:

```text
apps/web/src/lib/assistance-preference.ts#loadWorkflowPreference
apps/web/src/lib/assistance-preference.ts#loadWorkflowPreset
apps/web/src/lib/assistance-preference.ts#saveWorkflowPreference
apps/web/src/lib/assistance-preference.ts#saveWorkflowPreset
apps/web/src/lib/assistance-preference.ts#workflowKey
packages/runtime/src/presets.ts#WorkflowPreferenceV2
packages/runtime/src/presets.ts#parseWorkflowPreferenceV2
packages/runtime/src/presets.ts#serializeWorkflowPreferenceV2
```

Its tree stores `head`, the named root, the authority nodes/edges and their canonical digest. A
change to v1 preset membership, context admission/defaulting, storage key, loader or writer moves
head-1 identity; a v2 landing must consume exactly the eight-symbol claim above. Unknown-key
rejection belongs to v2 and is never retroactively asserted for v1.

`assistance-permission` uses `evidence-kinds`-style member set equality, but its tree reader resolves
both the exported TypeScript union and every semantic operation that returns, clamps or compiles it.
The exact `legal` transition population is:

```text
packages/runtime/src/assistance.ts#AssistancePermission
packages/runtime/src/assistance.ts#accessPermission
packages/runtime/src/assistance.ts#permittedAssistance
packages/runtime/src/presets.ts#compileAuthoritativeAssistance
packages/runtime/src/presets.ts#contextClamp
```

`assistance-exchange` adds one new claim form:

```text
assistance-exchange | first lane 1 | <derived changed symbols>
```

The landed state is a discriminated union, never a magic integer:

```ts
type NumericResourceTreeState =
  | { readonly kind: "absent"; readonly history: readonly []; readonly contractDigest: "absent" }
  | { readonly kind: "landed"; readonly head: number; readonly history: readonly number[]; readonly contractDigest: string };
```

For an absent resource, the exact registered root
`packages/runtime/src/presets.ts#ASSISTANCE_EXCHANGE_VERSION` must not resolve and landed history
must be empty. Exactly one active first claim is allowed. Two claimants, `lane 1`, `lane 2`, a
member claim, or a claim with no derived changed-symbol closure fail. The implementation commit
atomically creates the version-1 root,
changes the derived state to `{kind:"landed",head:1}`, appends the history row and removes the live
claim. A landed head 1 with a lingering `first lane 1` claim fails. The CLI prints `head absent;
next <owner> (first lane 1)`, never `head 0`.

Absence is one-way. If the previous state contains any landed history, a current missing/renamed
root is `LANDED_RESOURCE_CANNOT_BECOME_ABSENT`; it cannot validate as a withdrawal. A successor
root is a new versioned transition from the existing resource, not deletion plus a fresh first
claim. The exact first-lane exchange transition is:

```text
packages/runtime/src/presets.ts#ASSISTANCE_EXCHANGE_VERSION
packages/runtime/src/presets.ts#AuthoritativeAssistanceV1
packages/runtime/src/presets.ts#BrowserNarrowedAssistanceV1
packages/runtime/src/presets.ts#FinalizedAssistanceV1
packages/runtime/src/presets.ts#RequestedAssistanceV1
packages/runtime/src/presets.ts#compileAssistanceRequest
packages/runtime/src/presets.ts#compileAuthoritativeAssistance
packages/runtime/src/presets.ts#finalizeAssistanceEffects
packages/runtime/src/presets.ts#narrowBrowserChannels
packages/runtime/src/presets.ts#parseAssistanceExchange
```

README gains three register sections (they may share one heading but each keeps its own machine
marker):

```text
<!-- register: workflow-preference head=1 -->
<!-- contract-digest: workflow-preference <derived-12-hex> -->
<!-- register: assistance-exchange head=absent -->
<!-- contract-digest: assistance-exchange absent -->
<!-- register: assistance-permission members=evidence,free,locked_off,sight -->
<!-- contract-digest: assistance-permission <derived-12-hex> -->
```

The workflow-preference v1 history row names the existing web-local storage grammar and explicitly
says it has no production caller. The exchange history is empty while absent. Permission history
records the bootstrap member set rather than inventing a numeric version.

After this process RFC lands, `intent-presets.md` replaces `none` with three claims in one atomic
author amendment:

```text
workflow-preference | lane 2 | apps/web/src/lib/assistance-preference.ts#loadWorkflowPreference; apps/web/src/lib/assistance-preference.ts#loadWorkflowPreset; apps/web/src/lib/assistance-preference.ts#saveWorkflowPreference; apps/web/src/lib/assistance-preference.ts#saveWorkflowPreset; apps/web/src/lib/assistance-preference.ts#workflowKey; packages/runtime/src/presets.ts#WorkflowPreferenceV2; packages/runtime/src/presets.ts#parseWorkflowPreferenceV2; packages/runtime/src/presets.ts#serializeWorkflowPreferenceV2
assistance-exchange | first lane 1 | packages/runtime/src/presets.ts#ASSISTANCE_EXCHANGE_VERSION; packages/runtime/src/presets.ts#AuthoritativeAssistanceV1; packages/runtime/src/presets.ts#BrowserNarrowedAssistanceV1; packages/runtime/src/presets.ts#FinalizedAssistanceV1; packages/runtime/src/presets.ts#RequestedAssistanceV1; packages/runtime/src/presets.ts#compileAssistanceRequest; packages/runtime/src/presets.ts#compileAuthoritativeAssistance; packages/runtime/src/presets.ts#finalizeAssistanceEffects; packages/runtime/src/presets.ts#narrowBrowserChannels; packages/runtime/src/presets.ts#parseAssistanceExchange
assistance-permission | members legal | packages/runtime/src/assistance.ts#AssistancePermission; packages/runtime/src/assistance.ts#accessPermission; packages/runtime/src/assistance.ts#permittedAssistance; packages/runtime/src/presets.ts#compileAuthoritativeAssistance; packages/runtime/src/presets.ts#contextClamp
```

These are specification literals and checker outputs, not caller-authored approximations. The
register implementation derives the source-graph populations and installs the intent-presets
claims only when set equality succeeds. This RFC specifies the grammar and ownership transition,
not product implementation bytes.

The four resource identities are independent. Moving workflow preference does not implicitly move
effective config; changing a wire stage does not silently widen permission; adding `legal` does
not claim AssistanceConfig v5. Cross-resource implementation may land atomically, but every moved
resource still needs its own exact claim and digest transition.

### 2. Tree derivation is semantic and formatting-insensitive

The register reader builds a workspace TypeScript `Program` with the pinned compiler and resolves
`packages/runtime/src/assistance.ts` through its `TypeChecker`. It locates exactly one exported
`AssistanceConfig` interface and derives:

```ts
interface AssistanceConfigTree {
  readonly head: number;
  readonly fields: Readonly<Record<string, readonly string[]>>;
  readonly authorityNodes: readonly AssistanceAuthorityNode[];
  readonly authorityEdges: readonly AssistanceAuthorityEdge[];
  readonly authorityDigest: string;
  readonly closureDigest: string;
  readonly digest: string;
}
```

The parser requires:

1. one required readonly property named `version` whose type is one positive integer literal;
2. every other property required and readonly;
3. every other property's **resolved semantic type** a non-empty union containing only unique
   string-literal members;
4. no index signature, method, call/construct signature, inheritance or duplicate property.

Anything else fails with the unsupported node/property named. It is not silently omitted.

Resolution is semantic rather than syntax-only because the already-specified v5 field is
`"off" | HintRung`, where `HintRung = (typeof HINT_RUNGS)[number]`. The checker must resolve local
and imported aliases, `as const` readonly-tuple indexed access and nested unions to the literal
domain. It then refuses `string`, `unknown`, `any`, `never`, numeric/object members, generics whose
instantiation is not a closed literal set, or a union retaining any non-string-literal residue.
The normalized digest contains the resolved values, not alias names or source spelling: replacing
an inline union with an equivalent alias is formatting-equivalent; changing the tuple behind that
alias is semantic drift.

The closure receipt retains every node/edge and hashes them as `closureDigest`. The authority graph
and `authorityDigest` filter out only nodes with `influence:"observer"` and their observation-only
edges; authority, traversal and product-consumer nodes all remain. This makes declaration-census
refactoring visible to closure without spuriously versioning AssistanceConfig, while a consumer
reclassification or new product path necessarily changes authority identity.

For the contract digest, field names and each member domain are sorted and encoded as canonical
JSON together with `head` and the filtered authority graph/digest, then hashed with SHA-256 and
truncated to the existing register convention's 12 lowercase hex characters. Comments, whitespace,
local binding names and source ordering therefore do not move the digest; adding/removing/renaming a
field, changing a literal, changing the numeric head, or changing any authority node/edge does.

There is no legal fixed-head semantic drift ([[D2115]]). Any authority-graph change—key, codec,
migration, unknown-field policy, serializer, constructor, permission, typed field write, preset
column or UI/run product projection—changes
the registered digest and is rejected unless the same atomic commit advances the head through the
prior exact claim. A refactor that is genuinely semantic-equivalent leaves canonical graph bytes
unchanged. A refactor the grammar cannot prove equivalent takes a new lane; the checker does not
guess.

The current derived shape is ten properties total: `version: 4` plus nine axes containing 22
string values. These integers are drift tripwires, not a second declaration; the AST projection is
the authority.

### 3. README register

`rfc/README.md` gains:

```text
## Assistance-config register

<!-- register: assistance-config head=4 -->
<!-- contract-digest: assistance-config <derived-12-hex> -->
```

Its **Landed** table has unit `payload head`, total four, recovered from git history:

| head | owner/landing | change |
|---|---|---|
| 1 | adaptive guidance runtime, `e78e7238` | markers, guided, humanSplit, voice |
| 2 | runtime corpus evidence, `f90d0771` | corpus |
| 3 | adoption wave one, `9e99a541` | spoken off/on |
| 4 | polish surfaces, `765efb56` | spoken domain replacement; boardLighting, arrows, ambient |

Historical commit descriptions are facts, not retroactive RFC ownership. The table says so rather
than attributing a version to an archived RFC that did not govern it.

The table is a history, not merely a current-head witness. C9 requires exactly one row for every
integer head `1..registered head`, in ascending order. The process landing is the only bootstrap:
it must publish exactly the four rows above with those four pinned commits. After bootstrap, the
staged checker compares the index with `HEAD` and permits only an exact prefix plus, on a head
advance, one appended row; committed CI compares the current file with its first parent and applies
the same rule. Deletion, rewrite, reorder, duplication or a gap fails even when the final row still
matches the current head.

The repository-governance job's checkout is part of this RFC and sets `fetch-depth: 2`. The
committed checker resolves exactly `HEAD^1` with `git rev-parse --verify`; absence is a named hard
failure whenever `HEAD` is not the repository's root commit. Fixture repositories pass explicit
previous/current snapshots to the pure checker and do not share the production Git fallback. The
staged arm reads `HEAD` plus the index. Neither arm catches a missing Git object as “not a Git
fixture”; `tools/status-parity.mjs`'s current silent catch is a negative example, not a precedent.

Its **Live claims** table contains the exact Guided Hint lane-5 declaration and no preset claim.
No hand-written “next free” row exists; `register-check` prints it.

`parseRegisterSections` accepts `contract-digest` only for this resource and retains
`schema-digest` for schema resources. A digest of the wrong kind/resource is treated as absent.

### 4. C9 — assistance contract identity and transition

The existing C1-C8 meanings stay byte-for-byte. New check C9 has six arms:

| arm | failure |
|---|---|
| C9.1 | no/multiple AssistanceConfig interface, unsupported member shape, incomplete/ambiguous authority graph, or phase rule violation |
| C9.2 | README head differs from the AST-derived numeric version |
| C9.3 | README contract digest is absent or differs from the AST-derived digest |
| C9.4 | more than one live claim, or the sole claim is not registered head+1 |
| C9.5 | landed heads are not the unique contiguous sequence `1..head`, a pinned bootstrap row differs, or append-only history is violated |
| C9.6 | a head advance does not consume exactly one matching prior claimant into one owner-bound Landed row |

Tree head and digest must always equal the checked register bytes. A live claim reserves only the
registered head+1 owner; it never excuses current-tree drift ([[D1916]]). The legitimate v5 landing
is one atomic commit: runtime head/domain, README head/digest, landed table and claim surfaces all
move together, and the live claim disappears. There is no valid committed midpoint. If owner-use
validation keeps the product RFC active afterward, its block returns to `none`.

Snapshot equality is necessary but not sufficient for that landing ([[D2012]]). C9 also evaluates
the staged/first-parent transition. A head advance is legal only when all of these hold:

1. the previous committed head is exactly `current head - 1` and its tree/register/digest are valid;
2. the previous state contains exactly one declaration/register claimant for the current lane;
3. the current state removes that claim, appends exactly one Landed row and names the same RFC as
   owner; and
4. the complete graph-derived assistance source changes are set-equal to the prior claim's exact
   fifteen path/symbol tokens in §1. Additions, removals, body changes and incident-edge changes all
   participate; an unrelated assistance symbol, undeclared path or omitted deletion fails.

At v4, C9.1 requires the exact legacy shape: `validV4` and `migrate` are the parser/migration
authority and there is no runtime assistance codec. At v5 and later, C9.1 requires exactly one
runtime `parseAssistanceConfig`, no web-local validator/version switch/migrator, and one reader plus
one writer sharing `assistanceKey`. Thus bootstrap validates bytes that exist today, while the head
transition proves the centralization rather than assuming it already landed ([[D2113]], [[D2114]]).

A no-prior-claim, wrong lane, wrong claimant, partial symbol set, rewritten old row or head skip
fails. Adding or withdrawing an unimplemented claim at an unchanged valid head remains a normal C3
declaration/register transition and changes no Landed history. The process RFC's first registration
is a named bootstrap, not a fake head transition: absent previous resource → exact pinned v1-v4
history + exact Guided Hint v5 claim.

C3 remains the authority for declaration/register bijection. C4/C6 are generalized only enough to
include the new numeric-head register; their schema/evidence/migration semantics do not change.
The command's terminal success line becomes `C1-C9 green`.

`derivedOutput` gains an explicit branch rather than falling through its current assumption that
every non-schema/non-migration resource is `evidence-kinds` ([[D1630]]). At the registered
checkpoint it prints:

```text
assistance-config: head 4; next hint-distance.md (lane 5)
```

With no live claimant it prints `next lane 5`; it never reads `.members` from the assistance tree
or parses a lane claim as an evidence member.

### 5. Able-to-fail fixtures

`tools/register-check.test.mjs` supplies source strings/temporary trees for every branch. The
fixture table's unit is **mutation class**; total fifty-seven:

| # | mutation | required result |
|---|---|---|
| 1 | whitespace/comment/property-order only | digest unchanged |
| 2 | add one literal member | digest changes; unclaimed C9 failure |
| 3 | add one field | digest changes; unclaimed C9 failure |
| 4 | remove/rename one field | digest changes; unclaimed C9 failure |
| 5 | change head 4→5 only | head and digest change; unclaimed failure |
| 6 | optional or mutable property | extractor refusal |
| 7 | non-string domain or index signature | extractor refusal |
| 8 | missing/wrong `contract-digest` | C9 failure |
| 9 | claim lane 4 | C9 failure |
| 10 | claim lane 6 at head 4 | C9 failure |
| 11 | two claimant RFCs, whether same or different lanes | C9 failure |
| 12 | unchanged head-4 tree/register plus one lane-5 claim and matching README row | pass |
| 13 | replace a direct union with an equivalent local alias | same derived domain and digest |
| 14 | resolve an imported `as const` tuple through `(typeof VALUES)[number]` | exact literal domain; changing one tuple value changes digest |
| 15 | widen one alias/tuple-derived arm to `string` (or leave another non-literal residue) | named extractor refusal |
| 16 | render derived output with/without the lane-5 claimant | exact assistance line; no evidence-kinds fallthrough |
| 17 | same-head field/member drift plus lane-5 claim | fail head/digest equality; claim cannot mask drift |
| 18 | tree head 5 with register head 4 plus lane-5 claim | fail head equality |
| 19 | complete head-5 snapshot with claim removed | snapshot arms pass; transition arm separately requires row 24 |
| 20 | landed history `[4]`, `[1,3,4]`, duplicate 3 or reordered rows | fail C9.5 |
| 21 | exact pinned v1-v4 bootstrap plus exact Guided Hint v5 claim | pass; changed commit/row/claim fails |
| 22 | head-5 landing with no prior claim, wrong lane or wrong claimant | fail C9.6 |
| 23 | head-5 landing rewrites an older row, skips a head or appends two rows | fail C9.5/C9.6 |
| 24 | prior exact Guided Hint lane-5 claim → head-5 tree/digest + one owner-bound row + no claim | pass |
| 25 | prior claim omits a changed assistance symbol or names `validV5` | fail C9.6/claim grammar |
| 26 | governance checkout lacks `HEAD^1`, or production parent resolution throws | fail closed; never skip the committed arm |
| 27 | exact two-commit governance checkout plus valid prior claim→landing | pass committed C9.5/C9.6 |
| 28 | v4 bootstrap with current `validV4`/`migrate`, one reader, one writer and no runtime codec | pass; requiring the future codec here fails the fixture |
| 29 | unrelated production `.ts` change or unimported dead helper | unchanged assistance authority set; no false claim requirement |
| 30 | add a second writer or make read/write use different key constructors | fail C9.1 |
| 31 | change `tabiya.assistance.v1`, `JSON.stringify`, a legacy default, unknown-field rule or migration branch at head 4 | graph/contract digest changes; fixed-head C9 failure |
| 32 | formatting, comments or local-binding rename inside an authority node | canonical graph and contract digest unchanged |
| 33 | v5 leaves `validV4` or `migrate` beside the runtime codec | fail phase rule even when both accept the same values |
| 34 | v5 has one runtime codec, no local parser/migrator and load/save share key plus codec | pass C9.1 before transition comparison |
| 35 | v5 changes all fifteen declared graph nodes | exact symmetric-difference set and C9.6 pass |
| 36 | v5 claim omits `saveAssistance`, `SILENT_ASSISTANCE`, `permittedAssistance`, Advanced projection or either deleted legacy operation | fail C9.6 |
| 37 | add an AssistanceConfig consumer in TS/Svelte, or use an unproved/broad computed field | discovered node or named hard failure; never silently absent |
| 38 | Svelte Advanced and run projections add `hintDistance`, while an unsupported script/template construct is crossed separately | exact generated operation nodes; unsupported arm fails closed |
| 39 | both current generic writers have `Key extends keyof Omit<AssistanceConfig,"version">`, `AssistanceConfig[Key]`, one config spread and literal registered calls | both `typed_field_write` nodes and all call edges pass v4 closure |
| 40 | widen either generic key to `string`, `PropertyKey`, `any` or a strict superset | named computed-write refusal |
| 41 | call either writer with `version` | named excluded-key refusal |
| 42 | call either writer with an unknown literal | named unknown-key refusal |
| 43 | add an indirect/unregistered call to either writer | closure changes or fails unresolved; never omitted |
| 44 | traverse the current runtime package-root re-export | exact `reexport_alias` path retained |
| 45 | insert one wrapper helper and two aliases converging on `saveAssistance` | one semantic writer, all traversal nodes/edges retained |
| 46 | add a resolvable call/import cycle | traversal terminates, retains one sorted SCC and preserves source-to-target paths |
| 47 | replace a resolved helper call with an unresolved dynamic dispatch | named closure failure |
| 48 | omit `DrillScreen.hintDistance`, `GuidedHintSeat.requestHint`, `RunStateStore.requestHint` or either connecting edge at v5 | C9.6 fails; configured hint cannot pass without gameplay use |
| 49 | omit either `PRESET_DECLARATIONS.config.hintDistance` or `WORKFLOW_CONTEXT_POLICIES.configClamp.hintDistance`, or leave an old nine-field row | C9.6/shape equality fails |
| 50 | classify the real server declaration census as observer, then mutate it into a runtime field reader | observer-only refactor leaves contract digest stable; runtime read reclassifies and moves it |
| 51 | add a workspace package with one production AssistanceConfig consumer | package is discovered and changes closure/authority; hard-coded-root implementations fail |
| 52 | workflow-v1 object includes arbitrary extra keys while its preset is valid for the requested context | head-1 parser admits the preset and ignores extras; a checker claiming strict rejection fails |
| 53 | change one context's allowed/default preset without changing the v1 loader | workflow-preference authority digest moves and fixed-head validation fails |
| 54 | absent exchange root is missing, then exact named root lands or is renamed | missing+empty history is absent; exact landing is head 1; rename after landing is failure, never a new absence |
| 55 | staged and committed transitions each compare landed exchange history with a current missing root | both fail `LANDED_RESOURCE_CANNOT_BECOME_ABSENT` before accepting any first claim |
| 56 | permission `legal` claim omits the union or any one of `accessPermission`, `permittedAssistance`, `compileAuthoritativeAssistance`, `contextClamp` | changed-symbol set inequality fails |
| 57 | execute valid absent→head-1, empty first-claim, skipped next-lane and landed→absent state transitions | only the valid first landing passes; every invalid state throws its named error |

The implementation also runs the real repository and asserts derived head 4, nine axes, 22 values,
the v4 legacy parser/migrator, one shared-key reader/writer pair, both proved generic field writes,
the runtime barrel path, the server observer and mandatory constructor/permission/Advanced/run
nodes, the current shape/graph/closure digests, exact contiguous pinned history and exactly one
lane-5 claimant. The explicit counts and operation identities are drift tripwires; a future
intentional version changes them through the checked claim-to-landing transition.

### 6. Files and boundaries

Implementation changes exactly these authority classes:

- `tools/register-check.mjs` and `tools/register-check.test.mjs`;
- `.github/workflows/verify.yml` (repository-governance checkout only: `fetch-depth: 2`);
- `rfc/README.md`;
- claim/status/dependency prose in `rfc/hint-distance.md` and `rfc/intent-presets.md`;
- current-tense fixed register counts in active RFC/register prose ([[D1584]]), rewritten to
  “the registered resources” while explicitly dated historical counts remain untouched;
- `docs/development.md` command output/registered-resource description;
- ledger, planning log and this RFC's closeout records.

It does **not** edit `packages/runtime/src/assistance.ts`, browser storage, presets, settings,
schemas, database migrations, content, or any archive file. If implementation needs one of those,
this RFC is returned rather than widened.

## Deviations from design

None. No design intent changes.

## Acceptance criteria

1. **Rule-7 coverage.** `RESOURCE_NAMES` and the README register set each gain exactly
   `assistance-config`; deleting either fails C6/C9.
2. **Semantic derivation.** The real tree derives head 4, nine axes and 22 string members; the
   normalized digest is stable under mutation-classes 1 and 13, resolves class 14, and changes
   under classes 2-5 and the changed-tuple arm of 14. It also derives the complete v4 authority
   graph; class 32 is graph-stable and classes 30-31/37-51 either change identity, retain the
   declared traversal/observer result, or fail closed exactly as specified.
3. **Fail closed.** Mutation classes 6-7 and 15 throw a named extractor error; no property or
   non-literal union residue disappears from the normalized shape.
4. **Register binding.** C9.2/C9.3 fail on wrong head and wrong/missing digest. C9.5 requires one
   unique contiguous Landed row for every head and refuses mutation classes 20/23.
5. **Single writer and no drift exception.** Same-lane and different-lane two-claim fixtures both
   fail. Lane 4 and lane 6 fail at head 4; one lane 5 passes only with unchanged head-4 tree/register
   bytes. Same-head or head-only drift still fails. A complete head-5 snapshot is accepted only
   when C9.6 proves the prior exact lane-5 claimant, owner-bound appended row and declared symbol
   transition; the symbol set is derived from the closed authority graph rather than supplied by
   the caller. Mutation classes 22/25/30-31/33/36-43/47-49/51 fail where specified and classes
   24/28-29/32/34-35/39/44-46/50 pass.
6. **Bijection.** Deleting either the Guided Hint declaration or README live row fails C3.
7. **Historical truth.** The four landed rows cite the four commits recovered by `git log -S`; no
   archived RFC is invented as their owner. Bootstrap requires those exact four rows, and later
   staged/first-parent checks permit only prefix-preserving one-head appends.
8. **No product change.** `git diff` contains no runtime/web/schema/storage/content/archive file
   except the two active RFC prose/claim blocks explicitly listed in §6. The governance workflow's
   exact `fetch-depth: 2` change is the sole non-document/checker addition.
9. **Existing registers unchanged.** Every pre-existing C1-C8 fixture remains green and the real
   derived heads/digests for seven existing resources are byte-identical.
10. **Governance/CI.** Node-24 `make verify-governance`, `git diff --check`, the staged
    process-contract hook and CI's governance job pass on committed bytes; success reports C1-C9.
    Mutation 26 proves required parent absence is fatal and mutation 27 crosses the real
    two-commit shape. The workflow file is parsed by scaffold verification so removing or lowering
    its governance `fetch-depth` fails locally before push.
11. **Docs/closeout.** Development docs, README status, [[D1581]], exploration log and this RFC's
    plan/log are updated in the implementing commit. Archive remains untouched until all
    discharges close.
12. **No hand-count recurrence.** Current-tense active prose contains no assertion that the live
    register set has six, seven or eight members; [[D1584]] closes while dated historical facts
    remain byte-identifiable as history.
13. **Generic process law stays generic.** `rfc/0000-rfc-process.md` is byte-identical; deleting
    `assistance-config` from `RESOURCE_NAMES` or its README section still fails criteria 1/4, so no
    prose inventory is needed.
14. **Derived output has a typed assistance arm ([[D1630]]).** With the Guided Hint claim it prints
   `assistance-config: head 4; next hint-distance.md (lane 5)`; without one it prints
   `assistance-config: head 4; next lane 5`. Neither path accesses `.members` or uses the
   evidence-kind claim parser.
15. **Literal claim and source-closure truth ([[D2010]], [[D2038]], [[D2113]]–[[D2117]],
    [[D2190]]–[[D2193]]).** The sole row contains the exact fifteen-node v5 graph delta, including
    the writer, constructor, permission projection, Advanced projection, complete in-run hint path,
    exhaustive preset/context columns and deletion of both legacy local codec operations. Bootstrap
    derives the actual v4 graph without requiring future files. At v5, load/save share one key and
    runtime codec; a local/indirect validator, second reader/writer/serializer/migrator, fixed-head
    semantic change, undeclared workspace consumer or unclassifiable TS/Svelte operation fails even
    when a caller reports only the expected tokens. The current two constrained generic writes,
    barrel re-export and server declaration observer are crossed rather than omitted.
16. **Dependent phase truth ([[D2011]]).** Every implementation-owned stale Hint status says
    “awaiting the D1639 owner ruling, then repeat independent review”; nothing claims that review is
    already open or changes the owner table.
17. **Non-vacuous v5 handoff ([[D2191]]).** C9 refuses the transition if the effective
    `hintDistance` does not reach `DrillScreen` → `GuidedHintSeat` → `RunStateStore.requestHint`, or
    if either the five-preset value column or eight-context clamp column is absent/incomplete. This
    is structural reach only; the owner-ratified [[D1639]] values and the hint RFC's complete
    server/provider journey remain separate product acceptance gates.
18. **Four-resource identity ([[D2178]]).** The executable inventory and README markers are
    set-equal over `assistance-config`, `workflow-preference`, `assistance-exchange` and
    `assistance-permission`. Removing, merging or renaming one fails. Mutating one resource without
    its own claim fails even when another assistance resource has a live claim.
19. **Absent first-head transition ([[D2328]], [[D2357]], [[D2358]]).** An absent exchange means
    the exact `ASSISTANCE_EXCHANGE_VERSION` root is missing and landed history is empty. With one
    exact ten-symbol `first lane 1` claim it passes; two claimants, numeric/member claims,
    fictional head 0, missing `absent` digest, implementation bytes with no claim, or landed head 1
    with a lingering first claim fail independently. Any landed-history→missing-root transition
    fails in staged and committed modes. CLI output contains `head absent` and never `head 0`.
20. **Preference and permission bootstrap.** The reader derives workflow-preference head 1 from
    the live open/context-dependent storage grammar and exact six-symbol authority tree, and
    derives exactly four sorted permission members plus all semantic return/projection operations.
    Equivalent formatting/alias refactors preserve digests; preset/context admission,
    parser/serializer, member, return-site or package-export changes move them and require their
    own claim. Workflow-v2 is the first strict grammar and consumes the exact eight-symbol delta.
21. **Intent handoff.** After the register lands, intent-presets carries exactly three claims:
    workflow-preference lane 2, assistance-exchange first lane 1 and permission member `legal`.
    Their changed-symbol sets are set-equal to the literal eight-, ten- and five-symbol populations
    in §1a; a placeholder, duplicate, omitted semantic operation or hand-written plausible path
    fails. Mutation classes 52–57 and the executable author model prove these extension semantics.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Independent process/buildability review re-derives the rule-7 predicate, phase-aware graph grammar, read/write closure, fixed-head policy, exact v5 delta and file boundary | claude | `planning/assistance-config-register/log.md` + corrections/acceptance | |
| D2 | Implement C9, register/history, claim transfer, docs and able-to-fail fixtures without product bytes | codex | implementing SHA + green governance output | |
| D3 | Guided Hint v5 product implementation later moves the landed head/digest, removes its live claim and preserves v1-v4 migrations | codex | `hint-distance` implementing SHA/receipt | |
| D4 | Implement the workflow-preference, absent exchange and permission register readers/markers plus first-lane transition fixtures | codex | process implementation SHA + green criteria 18–21 | |

## Independent-review routing

| finding | blocker | repair owner |
|---|---|---|
| [[D1916]] | lane-5 claim masks same-head v4 digest drift | amend §4, mutation table and criteria 2/4/5 |
| [[D2009]] | repaired in §§3–4 by exact contiguous bootstrap plus append-only staged/first-parent history | repeat independent review |
| [[D2010]] | repaired in §1/criterion 15 by the exact runtime fields and `parseAssistanceConfig` claim | cross-RFC symbol review |
| [[D2011]] | repaired in §1/criterion 16 by the actual D1639-blocked phase | cross-RFC status review |
| [[D2012]] | repaired in §4 by previous-claimant→owner-bound-landing transition semantics | transition-capable repeat review |
| [[D2037]] | repaired in §§3–6/criteria 8/10: governance checks out exactly two commits and required-parent resolution fails closed | fresh independent review |
| [[D2038]] | repaired in §§1/4/criteria 5/15: transition tokens derive from the closed runtime-codec/browser-persistence census | fresh independent review |
| [[D2113]] | repaired in §§1/4/classes 28/33-34: v4 seals its real local migrator; v5 must replace it with the runtime codec | fresh independent review |
| [[D2114]] | repaired in §1/classes 30/34: one graph contains reader, writer, shared key, codec and serializer | fresh independent review |
| [[D2115]] | repaired in §2/class 31: graph bytes enter contract identity and any fixed-head semantic drift fails | fresh independent review |
| [[D2116]] | repaired in §1/classes 35-36/criterion 15: exact fifteen-node delta includes the preset compiler and live run path | fresh independent review |
| [[D2117]] | repaired in §1/classes 32/37-47: closed TS/Svelte semantic and traversal nodes, edges, canonical bytes and failure grammar | fresh independent review |
| [[D2190]] | repaired in §1/classes 39-43: exact generic-key/value/spread proof plus every literal call edge; broad/version/unknown/indirect fail | fourth fresh independent review |
| [[D2191]] | repaired in §1/classes 48-49/criterion 17: one fifteen-token claim includes run seat/store and both exhaustive preset/clamp columns | fourth fresh independent review after [[D1639]] owner ruling |
| [[D2192]] | repaired in §1/classes 44-47: explicit callable/import/re-export/component/template/write nodes, converging aliases and SCC cycle rule | fourth fresh independent review |
| [[D2193]] | repaired in §§1-2/classes 50-51: workspace-derived roots and explicit authority/product/observer influence | fourth fresh independent review |
| [[D2178]] | amended in §1a/criteria 18/20/21: three distinct shared resources, truthful claims only after their register lands | fifth fresh independent review |
| [[D2328]] | specified in §1a/criterion 19: derived absent state and unique first-lane-1 transition; fictional head 0 refused | fifth fresh independent review |
| [[D2355]] | repaired in §1a/class 52: workflow-v1 is explicitly open/context-dependent; strictness begins at v2 | sixth fresh independent review |
| [[D2356]] | repaired in §1a/classes 52–53: exact root, six-symbol v1 authority tree, eight-symbol v2 transition and digest inputs | sixth fresh independent review |
| [[D2357]] | repaired in §1a/class 54: absence derives from one named future version root and exact ten-symbol first delta | sixth fresh independent review |
| [[D2358]] | repaired in §1a/classes 54–55: landed history makes current absence a fatal regression in both transition modes | sixth fresh independent review |
| [[D2359]] | repaired in §1a/class 56: `legal` claims the union plus every semantic projection/compiler operation | sixth fresh independent review |
| [[D2360]] | repaired by class 57 and `make assistance-register-fourth-author-repair`: executable valid/invalid lifecycle model | sixth fresh independent review |

## Open questions

None. Product choices remain in their product RFCs; this document only registers their shared
contract.

## Changelog

- 2026-08-31: sixth fresh independent review returned the fifth repair on [[D2450]]–[[D2454]].
  Workflow and permission deltas omit semantic authorities, exchange lacks its landed tree,
  permission lifecycle cannot express same-membership semantic changes, and the bespoke register
  architecture conflicts with the active generic bootstrap. No implementation is authorized.
- 2026-08-31: author-repaired [[D2355]]–[[D2360]]. Historical workflow-v1 is now specified as
  open/context-dependent over an exact six-symbol authority tree; v2 owns the exact strict
  eight-symbol transition. The absent exchange is rooted at `ASSISTANCE_EXCHANGE_VERSION`, its
  first delta has ten symbols and any landed→absent regression fails. Permission `legal` claims
  five semantic symbols. Mutation classes 52–57 and `make
  assistance-register-fourth-author-repair` execute the repair. Fresh independent review remains
  required; no register or product implementation is authorised.
- 2026-08-30: returned by fifth fresh independent review on [[D2355]]–[[D2360]]. The new
  resources lack exact executable roots/trees/transitions, workflow-v1 strictness is false,
  landed→absent is unguarded, permission semantics exceed the claim and the positive extension
  test is prose-only. `make assistance-register-fifth-fresh-review` passes 6/6.
- 2026-08-30: amended for [[D2178]]/[[D2328]] from
  `design/research/assistance-shared-resource-boundaries.md`. Registered workflow preference,
  assistance exchange and permission as resources distinct from effective AssistanceConfig. Added
  a derived `absent` state and unique `first lane 1` transition so a new cross-package wire can be
  reserved before it lands without inventing head 0. Criteria 18–21 and the positive author
  contract cover identity, bootstrap, collision and intent handoff. Fifth fresh independent review
  is required; no register or product implementation is authorised.
- 2026-08-30: author-repaired [[D2190]]–[[D2193]]. Proved the two current generic writes against
  the exact non-version key set and literal call sites; expanded the v5 claim from ten to fifteen
  symbols so gameplay and both preset/clamp columns cannot be absent; represented aliases,
  components, helpers and cycles as literal graph nodes; and replaced two hard-coded roots with a
  workspace-derived closure plus observer/product classification. Fifty-one mutation classes and
  the positive author contract cover the repair. Fresh independent review remains required; no C9
  or product implementation is authorized.
- 2026-08-30: third fresh independent review returned the fourth repair on
  [[D2190]]–[[D2193]]. The four-arm reproduction covers current computed writes rejected by the
  bootstrap grammar, omitted v5 run/preset consumers, an unrepresentable intermediate graph and
  production packages outside the scan roots. Earlier repairs survive; no implementation is
  authorized.
- 2026-08-30: fourth-return author repair. Replaced the three-root list with one phase-aware
  TypeScript/Svelte authority graph. Bootstrap now validates the actual v4 `validV4`/`migrate`
  state; v5 deletes it for the central codec. Read, write, key, serializer, constructors,
  permissions and Advanced/run projections share one graph; its digest joins resource identity so
  fixed-head semantic drift fails. The exact v5 claim expands from four guessed tokens to ten
  derived additions/changes/deletions. Thirty-eight mutation classes and an eight-arm author
  contract cover [[D2113]]–[[D2117]]. Fresh independent review remains required.
- 2026-08-30: second fresh independent review returned the third repair on [[D2113]]–[[D2117]].
  Current-v4 versus post-v5 authority, the writer, fixed-head semantic drift, the complete v5
  transition and the source-graph algorithm remain open. Prior 7 + 7 + 6 contracts survive; no
  implementation is authorised.
- 2026-08-30: third-return author repair. The governance job now owns an exact two-commit checkout,
  production resolves `HEAD^1` explicitly and missing required history is fatal. Transition tokens
  derive from the closed `AssistanceConfig` fields/runtime-codec/web-persistence source closure;
  callers cannot omit a parallel validator, migration authority or namespace reader. The six-arm
  author contract replaces the four return reproductions. Fresh independent review remains.
- 2026-08-30: fresh independent review returned the repaired draft on [[D2037]]/[[D2038]]. The
  first-parent contract has no CI history and its workflow repair is outside the file boundary;
  the claimed three-token transition can also omit a parallel browser codec because no closed
  assistance-authority census derives the token population. Prior repairs survive.
- 2026-08-28: amended after the second return. Landed heads are exact contiguous append-only
  history; head advancement consumes one prior exact claimant through staged/first-parent checks;
  the v5 claim names only the runtime `AssistanceConfig` fields and `parseAssistanceConfig`; and
  dependent status prose stays at “awaiting D1639 owner ruling, then repeat review.” The 25-arm
  author contract replaces the four review reproductions. Fresh independent review remains.
- 2026-08-27: amended after the D1916 return. Removed the live-claim digest exception: head and
  digest always equal tree authority; a claim only reserves registered head+1. Added crossed
  same-head/head-only drift negatives and atomic next-head/unchanged-reservation positives.

- 2026-08-27: independent review returned C9 on [[D1916]]. A live next-head claim may reserve
  ownership but must never excuse current-tree head/digest drift. Exact return:
  `planning/assistance-config-register/independent-buildability-review-2026-08-27.md`.
- 2026-08-26: pre-review [[D1630]] correction. Added the exact `derivedOutput` branch and fixture;
  the shipped fallback treats every non-schema/non-migration resource as `evidence-kinds` and
  would otherwise crash or misparse the new lane claim.
- 2026-08-26: pre-review [[D1628]] scope correction. Removed the unnecessary RFC-0000 amendment:
  rule 7 is already generic, while `RESOURCE_NAMES` plus the README bijection are the executable
  inventory. Added criterion 13 and removed the process-law file from §6.
- 2026-08-26: pre-review [[D1627]] correction. The syntax-only direct-union extractor would have
  rejected the already-specified v5 `"off" | HintRung` field. Derivation now uses a workspace
  TypeScript `Program`/`TypeChecker`, resolves local/imported and readonly-tuple aliases to their
  semantic literal domains, and fails on any broad/non-literal residue. Added mutation classes
  13-15 and rebound criteria 2-3; no product byte or assistance value changed.
- 2026-08-26: drafted from `design/research/assistance-config-shared-resource.md` and [[D1581]].
