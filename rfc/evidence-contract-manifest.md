# RFC: Evidence contract manifest — every producer has a declared consumer or an honest home

- **Status:** draft
- **Author:** codex (agent), for Marco
- **Created:** 2026-08-21
- **Design refs:** `design/03-product-breadth.md` §Intelligence and explanation and gate B4;
  `design/04-content-architecture.md` §What is actually primitive; `design/05-in-run-experience.md`
  §§3, 3-forms, 3b and 3b-i
- **Exploration gate:** O1 owner ruling [[D617]], after A0-A4 and R1-R2; sufficiency recorded in
  `planning/platform-alignment/research-sufficiency.md` and the intent amendments landed
  2026-08-21
- **Depends on:** `rfc/archive/shared-resource-registers.md` (implemented); A3
  `design/research/detector-semantic-conformance.md`; A4
  `design/research/evidence-contract-topology.md`
- **Parent / amends:** reconciles the evidence seams left by
  `rfc/archive/authored-explanation-surface.md`, `rfc/archive/evidence-at-runtime.md`,
  `rfc/archive/structural-reading.md`, `rfc/archive/transition-primitives.md`,
  `rfc/archive/runtime-corpus-evidence.md`, and `rfc/archive/engine-leverage.md`
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-contract-manifest/` (once implementing)

```tabiya-claims
none
```

## Summary

Tabiya currently has fourteen useful evidence-producing paths and no authoritative declaration of
which output may reach which consumer. This RFC introduces a compiled, versioned
producer → projection → consumer manifest. Producers declare what they emit and what semantics
survive; consumers declare the exact projection versions, timing, role/session, presentation forms
and answer distance they accept. The compiler derives both directions, refuses unexplained
producers and consumers, and requires every non-consumed projection to have an explicit inspector,
authoring, operator, experimental or retired disposition.

This is the wiring foundation, not the learner-guidance algorithm. It does not declare a raw atom
important, good or bad; does not select evidence; does not define presets; and does not send every
source to the LLM. It makes those later decisions enforceable instead of leaving them as prose.

## Motivation

### 1. The measured failure is a missing join

A4 audited fourteen production producer paths. They end in five different delivery states: four
are renderer-visible, four are typed but outside the normative sentence source, three are runtime
side channels, two are standalone raw panels, and opening identity is sourcing-only. Runtime event
kinds and sourcing-ledger kinds have zero name intersection; only two of seven sidecar kinds become
recorded readings; eight free-text capability surfaces match none of seven canonical surface IDs;
and no production source names an R3 module or workflow. `[V]`

The fourteen rows below are **producer paths**, not individual detector families or payload kinds.
The total is fourteen, matching `tools/evidence-topology-harness/registry.ts`.

| # | producer path | current output boundary | required F1 result |
|---:|---|---|---|
| 1 | `rules.structural` | predicates, readings and family-only refs disagree | separate predicate and reading projections; explicit family closure |
| 2 | `rules.transition` | client-local counts erase affected identities | declare the lossy reading; do not admit it as a semantic event |
| 3 | `rules.phase` | packet plus deterministic sentence | declare detector/author projections and current deterministic consumer |
| 4 | `rules.pivotal` | packet, marker UI and voice | declare marker projection and both consumers |
| 5 | `rules.endgame` | packet plus deterministic sentences | declare material-family reading, including its limits |
| 6 | `theory.shapes` | typed plans and separate story/guided paths | declare shape-match projection; no invented applicable passage |
| 7 | `pack.authored` | packet and authored-feedback surfaces | declare authored claim identity, provenance and disclosure boundary |
| 8 | `recorded.engine` | reading appended after LLM checking | declare recorded measurement; keep best move narrowed out |
| 9 | `recorded.tablebase` | reading appended after LLM checking | declare exact-domain measurement and abstention |
| 10 | `live.stockfish` | event, guard, compare/story and analysis | declare distinct evaluation/WDL/PV projections and consumer bindings |
| 11 | `live.syzygy` | event, opponent/guard/ref rendering | declare category/distance projections and domain abstention |
| 12 | `human.maia` | opponent selection and raw split panel | declare human-policy measurement, never advice |
| 13 | `human.explorer` | raw corpus panel or abstention | declare population measurement and abstention, never quality |
| 14 | `theory.opening_identity` | sourcing sidecar only | declare authoring/theory key; no runtime claim until F4/F7 binds one |

The A3 conformance pass explains why a namespace rename cannot solve this. Only eleven of eighteen
structural families round-trip between matcher and reader; seven are subset, lossy or matcher-only.
All six transition families are lossy, and zero of 3,371 observations retain an affected square.
One enum value therefore cannot truthfully identify an author predicate, an inspector reading and
a learner event. `[V]`

### 2. The product consequence

Without a compiled join, the UI can expose a raw dump merely because a value is serializable, a
settings checkbox can exist with no producer, and a producer can have no user or authoring home.
The result is precisely the failure the owner described: lots of evidence, little support, and no
way to prove that a nudge or highlight is grounded in the evidence it claims to use.

The desired sequence has six independent stages:

```text
produce → retain semantics → establish consumer eligibility → select locally → render → compose
```

F1 owns the first three only as a static contract. F2 owns instance-level semantic events and
selection. F5 owns modules, presets, workflow ceilings and interaction. F4/F7 own theory retrieval
and theory↔drill composition. F6 owns Review Map moment selection. F8 and F9 consume the same
manifest for bots and player metrics rather than creating parallel evidence systems.

### 3. Scope boundaries

This RFC does **not**:

- add or grade chess concepts, tactics, plans or move labels;
- decide that a detector result is interesting because it is rare or locally distinctive;
- define F2's semantic event payload, valence rules, counterfactual selector or card budget;
- name or persist F5 presets/workflows, or choose Campaign/Coach/Streamer defaults;
- introduce a theory scraper, retrieval index or runtime knowledge bundle;
- change a drill-pack, run, shape-entry or principle-entry schema;
- mutate the 92-document corpus or lift D560/Gate F;
- make a provider or the LLM mandatory.

## Specification

### 4. Vocabulary

#### 4.1 Producer, projection, consumer and binding

A **producer** is a named implementation that can emit or abstain from emitting evidence. A
producer version changes when its provider protocol, grounding population or availability contract
changes.

A **projection** is a versioned semantic view of a producer output. Predicate, reading, event and
source-record projections are different identities even when they share an implementation. A
projection version changes whenever an existing consumer could interpret the same bytes
differently.

A **consumer** is a named product or authoring operation that requests evidence under declared
constraints. It is not a route name and not a future workflow preset. `analysis.inspector`,
`guidance.deterministic`, `guidance.voice`, `board.overlay`, `compare.raw`,
`runtime.condition`, `opponent.selection` and `authoring.validation` are examples of current
consumer classes; the implementation census fixes the complete initial set.

A **binding** is an explicit edge from one exact producer/projection version to one consumer. It
states what the consumer may receive and under which constraints. There is no wildcard binding and
no “all structural readings” binding.

#### 4.2 Version identities

Producer, projection, adapter and consumer IDs are lowercase dotted identifiers. Each declaration
carries a positive integer `version`. A consumer accepts explicit `{ id, version }` pairs. There is
no implicit “latest,” version range or string-prefix match.

An additive implementation change that does not alter declared semantics need not increment a
version. Any change to meaning, operands, exactness, grounding, abstention, answer content or
availability does. During migration, old and new versions may coexist as distinct declarations;
the compiler refuses two declarations with the same `(id, version)`.

There is deliberately no global `EVIDENCE_MANIFEST_VERSION` and no new shared-resource lane. The
manifest is an extensible set of independently versioned declarations, not a single-writer schema
head or closed vocabulary. Two RFCs adding different IDs can merge. A collision on the same ID and
version fails compilation. Therefore this RFC truthfully declares `tabiya-claims: none` while
remaining consistent with RFC-0000 rule 7.

### 5. Contract types

`packages/runtime/src/evidence-contract.ts` owns dependency-free types and the pure compiler. The
names below are normative; field spelling may change only during author review before acceptance.

```ts
type EvidencePlane =
  | "rules"
  | "transition"
  | "search"
  | "human"
  | "theory"
  | "authored";

type ProjectionRole = "predicate" | "reading" | "event" | "source_record";
type EvidenceGrounding =
  | "position_rules"
  | "declared_convention"
  | "bounded_search"
  | "tablebase_exact"
  | "human_model"
  | "human_corpus"
  | "cited_theory"
  | "authored_claim";

type EvidenceDisposition =
  | "inspector_only"
  | "author_only"
  | "operator_only"
  | "experimental"
  | "retired";

type EvidenceTiming =
  | "precommit"
  | "postcommit"
  | "checkpoint"
  | "attempt_end"
  | "terminal"
  | "review"
  | "analysis";

type EvidenceForm =
  | "sentence"
  | "list"
  | "timeline_marker"
  | "lit_squares"
  | "arrows"
  | "piece_halo"
  | "panel"
  | "audio"
  | "machine_condition";

type AnswerDistance =
  | "fact"
  | "pattern"
  | "threat"
  | "theory"
  | "evaluation"
  | "principle"
  | "plan"
  | "candidate_moves"
  | "ranked_moves"
  | "move"
  | "principal_variation";
```

`AnswerDistance` describes what the bytes disclose, not whether they are good assistance. The
order above is not a permission ladder: a consumer lists allowed values explicitly. In particular,
`fact` can still be noisy or misleading and `plan` can still be forbidden pre-commit.

```ts
interface ProjectionDeclaration {
  readonly id: string;
  readonly version: number;
  readonly producer: { readonly id: string; readonly version: number };
  readonly role: ProjectionRole;
  readonly plane: EvidencePlane;
  readonly payloadType: string;
  readonly semantics: string;
  readonly operands: readonly string[];
  readonly signs: readonly ("state" | "gained" | "lost" | "preserved" | "removed" | "avoided" | "enabled" | "threatened")[];
  readonly grounding: EvidenceGrounding;
  readonly exactness: "exact" | "convention" | "measured" | "authored";
  readonly confidence: "not_applicable" | "exact" | "reported";
  readonly abstention: { readonly possible: boolean; readonly reasons: readonly string[] };
  readonly answerContent: readonly AnswerDistance[];
  readonly forms: readonly EvidenceForm[];
  readonly dependsOn: readonly { readonly id: string; readonly version: number }[];
  readonly limitations: readonly string[];
  readonly disposition?: { readonly kind: EvidenceDisposition; readonly reason: string };
}

interface ProducerDeclaration {
  readonly id: string;
  readonly version: number;
  readonly plane: EvidencePlane;
  readonly implementation: string;
  readonly availability: "local" | "recorded" | "provider" | "build_time";
  readonly latency: "sync" | "interactive" | "background" | "offline";
  readonly outputs: readonly ProjectionDeclaration[];
}

interface ConsumerDeclaration {
  readonly id: string;
  readonly version: number;
  readonly implementation: string;
  readonly accepts: readonly { readonly id: string; readonly version: number }[];
  readonly timing: readonly EvidenceTiming[];
  readonly roles: readonly ("learner" | "host" | "participant" | "spectator" | "author" | "operator")[];
  readonly sessions: readonly string[];
  readonly forms: readonly EvidenceForm[];
  readonly answerContent: readonly AnswerDistance[];
  readonly latency: { readonly mode: "sync" | "interactive" | "background" | "offline"; readonly maxMs: number | null };
  readonly budget: { readonly maxFacts: number | null; readonly maxForms: number | null };
  readonly providerOff: "available" | "honest_empty" | "unavailable";
}

interface EvidenceBinding {
  readonly producer: { readonly id: string; readonly version: number };
  readonly projection: { readonly id: string; readonly version: number };
  readonly consumer: { readonly id: string; readonly version: number };
  readonly adapter: { readonly id: string; readonly version: number };
  readonly timing: readonly EvidenceTiming[];
  readonly roles: readonly ConsumerDeclaration["roles"];
  readonly sessions: readonly string[];
  readonly forms: readonly EvidenceForm[];
  readonly answerContent: readonly AnswerDistance[];
  readonly latency: ConsumerDeclaration["latency"];
  readonly budget: ConsumerDeclaration["budget"];
}
```

The compiler derives each binding by intersection; each term may only narrow:

```text
producer/projection capability
  ∩ consumer declaration
  ∩ honesty/disclosure/access contract
  ∩ provider availability
```

Workflow ceilings and requested presets are not inputs yet. F5 adds them after the static binding
exists; it may only narrow the result.

`null` budgets mean deliberately unbounded and are legal only for inspector, authoring, operator or
machine consumers. A learner guidance consumer declares positive finite limits even before F2 adds
local relevance selection. `maxMs: null` is legal only for offline/background authoring work; an
interactive consumer always carries a finite ceiling and an honest unavailable/empty path.

### 6. Typed evidence wrapper

F1 does not flatten Stockfish, Maia, corpus, rules and authored payloads into one union. Each
adapter wraps the source-specific payload without erasing it:

```ts
interface DeclaredEvidence<T> {
  readonly producer: { readonly id: string; readonly version: number };
  readonly projection: { readonly id: string; readonly version: number };
  readonly payload: T;
}
```

The wrapper is the proof that a value passed through a declared adapter. It is not F2's semantic
event. No adapter may invent operands absent from its payload. Missing identities stay declared as
limitations and force an inspector/experimental disposition until a later version retains them.

Every API that hands evidence to a consumer takes `DeclaredEvidence<T>` or a compiled binding view,
never bare `unknown`, a family-name string or a whole `EvidencePacket` field by convention. The
existing packet may remain as a transport aggregate during migration, but each item inside it is
wrapped and voice/deterministic consumers receive only items bound to them.

### 7. Primary declarations and compilation

The dependency graph fixes the declaration home. Both apps already depend on
`@chess-tabiya/runtime`; neither may depend on the other, and the runtime package may not import an
app. Therefore `packages/runtime/src/evidence-contract.ts` owns the dependency-free types and pure
compiler, while `packages/runtime/src/evidence-catalog.ts` is the **one primary static catalogue**
of producer, projection and consumer contracts. Server and web implementations import literal
typed IDs from that catalogue. Each catalogue declaration names one or more implementation anchors,
and verification proves every anchor still exists; this is mechanically joined central authority,
not a prose capability table.

`apps/server/src/evidence-manifest.ts` adds runtime provider availability and adapter registrations
to the shared static catalogue, then compiles it once. It does not redeclare semantics or web
consumers. A third package is refused unless implementation demonstrates that runtime cannot remain
dependency-free; the current package graph provides no such need.

`compileEvidenceManifest()` is pure and deterministic. It returns sorted frozen arrays plus a
SHA-256 digest over canonical JSON. The digest identifies the exact landed contract for diagnostics;
it is not a semantic version and is never hand-written into a register.

`make evidence-manifest-check` imports the aggregate and runs the compiler in `make verify`.
Application startup compiles the same aggregate and fails with a typed configuration error before
serving traffic. `/capabilities` exposes the digest, declared producer availability and the
consumer-safe binding summary; the web type carries the same fields. It does not expose provider
secrets, authored text, engine lines or corpus rows.

No generated manifest file is committed. A hand-copied JSON snapshot would recreate the stale
register problem this architecture exists to remove.

### 8. Compiler invariants

The compiler raises one stable code per invariant and prints both declaration sites involved.

| code | invariant | negative fixture |
|---|---|---|
| `EVIDENCE_PRODUCER_DUPLICATE` | `(producer id, version)` is unique | duplicate one producer |
| `EVIDENCE_PROJECTION_DUPLICATE` | `(projection id, version)` is unique | two producers claim one projection version |
| `EVIDENCE_PROJECTION_ORPHANED` | every projection has a binding or one explicit disposition with a reason | remove the final binding/disposition |
| `EVIDENCE_CONSUMER_ORPHANED` | every consumer accepts at least one existing projection | name only a missing projection |
| `EVIDENCE_BINDING_UNDECLARED` | adapter, producer, projection and consumer all exist at exact versions | change one version by one |
| `EVIDENCE_BINDING_WILDCARD` | IDs and versions are literal; no prefix, range or “latest” | use `rules.*` or omit a version |
| `EVIDENCE_BINDING_WIDENS` | binding timing/role/session/form/answer sets, latency and budgets only narrow both endpoints | add `principal_variation` to a fact-only consumer or raise its fact budget |
| `EVIDENCE_PROJECTION_INCOMPLETE` | semantics, payload type, operands/signs, grounding, exactness, abstention, limitations and any disposition reason are complete | delete abstention reasons from a provider projection |
| `EVIDENCE_DEPENDENCY_MISSING` | every semantic dependency names an existing exact projection | delete `pawn_safe_square` while `outpost` depends on it |
| `EVIDENCE_DEPENDENCY_CYCLE` | the projection dependency graph is acyclic | make A depend on B and B on A |
| `EVIDENCE_GENERIC_BYPASS` | registered consumer call sites cannot accept a bare reading/ref/packet field | invoke a guarded renderer with a raw payload |
| `EVIDENCE_PROVIDER_FALLBACK_MISSING` | every provider-backed consumer declares available, honest-empty or unavailable behavior | omit the Maia-off arm |

These are twelve **compiler error families**. Tests assert set equality between the exported error
code list and the negative-fixture table so a new invariant cannot exist only in prose.

### 9. Initial projection closure

F1 registers current truth, including its limitations. It does not bless current names as learner
semantics.

1. `STRUCTURAL_FEATURE_KINDS` is set-equal to structural **predicate** declarations.
2. Every actually emitted structural reading kind has a separate **reading** declaration. The seven
   matcher/reader mismatches are explicit dependencies or limitations, not one shared version.
3. `TRANSITION_FEATURE_KINDS` and every emitted subkind/direction leaf are covered by reading
   declarations. The initial versions state that affected squares/subjects are absent; none is
   admitted as an operand-preserving learner event.
4. `RULES_EVIDENCE_FACTS`, runtime `EvidenceKind`, sourcing `EVIDENCE_KINDS`,
   `RECORDED_READING_DISPOSITIONS` and the actual packet fields each have set-equality or explicit
   projection-map tests. Namespace equality is not required; every deliberate narrowing is.
5. The fourteen A4 producer paths each resolve to at least one producer declaration and at least
   one output projection or explicit retired disposition.

The `outpost` reading/predicate declaration names its dependency on the current
`pawn_safe_square` predicate projection. A dependency census walks transitive edges, then content
references. At the drafting baseline it must report 23 `outpost` expressions across three content
documents as indirect users of `pawn_safe_square`; a zero-result direct-token scan fails the test.
F3 consumes this graph for migration planning.

### 10. Current consumer closure

The implementation first derives the full current consumer census from production call sites and
checks it in as literal declarations. At minimum it covers the five generic sinks pinned by A3 and
the other A4 paths: server guidance packet assembly, deterministic voice, external voice,
evidence-reference rendering, in-run structural/transition rows, selected-square lighting,
comparison rows/strips, marker/story output, engine/tablebase conditions, explicit analysis,
human-split/corpus panels, opponent selection and sourcing validation.

Raw structural/transition tables, Maia splits, Explorer rows, engine lines and tablebase detail are
bound to `analysis.inspector` (or author/operator consumers) rather than to a generic learner
consumer. Existing deterministic phase/marker/endgame/authored sentences retain their current
bindings. Current UI behavior is not broadened by registration. If implementation discovers a
current learner-visible path whose source cannot honestly satisfy a consumer declaration, it must
return this RFC for a named decision; it may not add `legacy`, `any` or `temporary_bypass`.

The compiler also checks the reverse direction: every consumer call site must name one literal
consumer ID/version. A rendered surface with no producer is therefore visible as an orphaned
consumer, and a producer with no surface is visible as a disposition—not hidden by separate
tables.

#### 10.1 Initial consumer-symbol census

The initial closure is **eighteen consumer operations**. A row is one operation with a distinct
permission or output consequence, not one call site; multiple call sites using the same renderer
stay one row. The implementation plan must refresh the anchors and split a row if one operation
actually carries two permission contracts. It may not silently drop a row to make closure green.

| # | consumer id | current implementation anchors | initial home |
|---:|---|---|---|
| 1 | `authoring.predicate` | `matchesStructuralExpression`; objective/pack/shape validators and expression census | `author_only` |
| 2 | `runtime.objective_condition` | `objective.ts`; `pack-orchestrator.ts` evidence refs | `machine_condition` |
| 3 | `runtime.guard_condition` | `guard.ts`; queued engine/tablebase condition evidence | `machine_condition` |
| 4 | `guidance.packet` | `guidance.ts:evidencePacket` | internal aggregate, no direct learner form |
| 5 | `guidance.deterministic` | `guidance.ts` sentence assembly and fallback | bound sentence consumer |
| 6 | `guidance.voice` | `renderVoice`; `voiceCheck`; `external-voice.ts` | optional renderer over bound sentences |
| 7 | `guidance.recorded_reading` | `appendRecordedReadings`; `renderRecordedReading` | deterministic post-provider sentence |
| 8 | `runtime.evidence_ref` | `renderEvidenceRef`; guard/objective/compare grounds | exact ref projection by prefix/fact |
| 9 | `inspector.position_structure` | `DrillScreen.svelte` structural reading section | contextual inspector |
| 10 | `inspector.move_transition` | `DrillScreen.svelte` “What changed” section | contextual inspector |
| 11 | `board.selected_square_sight` | `selectedObservations`; `boardOverlays`; overlay caption | bound square-bearing sight only |
| 12 | `theory.shape_firing` | `shapeFirings`; Story/guided shape paths; `ShapePanel.svelte` | author/theory identity; no inferred advice |
| 13 | `compare.structure_strip` | `compare-strips.ts`; `CompareView.svelte` leaf and strip details | Review inspector |
| 14 | `compare.engine_trajectory` | comparison evidence trail, sparkline and deepest score | Review inspector |
| 15 | `inspector.human_split` | `/human-split`; `DrillScreen.svelte` on-request panel | post-disclosure contextual inspector |
| 16 | `inspector.corpus` | `/corpus`; `renderCorpusPage`; on-request panel | post-disclosure contextual inspector |
| 17 | `analysis.engine` | `/analysis`; `service.analysis`; evidence jobs | explicit Analyze consumer; moves/PVs legal only here |
| 18 | `opponent.selection` | `selectMove`; `opponent-selector`; live Syzygy/Maia inputs | machine consumer, never learner advice |

The two on-request panels and the manually opened structural/transition/compare detail sections are
the current **contextual analysis inspector**, even though they live inside the run layout. Their
headings gain “Evidence inspector” semantics/labels at F1 landing so they cannot be mistaken for
guidance modules. This is a classification of already-visible raw evidence under the O1 amendment,
not an F5 preset/default decision. They remain explicitly opened and keep current disclosure gates.

`guidance.packet` is permitted as an internal aggregate only when its fields are
`DeclaredEvidence`; it is not itself a consumer binding and cannot be passed wholesale to a
renderer. The external voice receives the exact compiled `guidance.voice` view rather than the
aggregate.

### 11. Consumer constraints and answer distance

Timing is explicit and uses the shipped disclosure boundaries. A binding may state `precommit`
only if its evidence content and the consumer both allow it. `postcommit` does not imply
`checkpoint`; each is listed.

Forms are independent of grounding but not automatically permitted. A projection that retains
square operands may still be refused for lit squares; a family-only ref cannot claim square or
arrow forms. Changing sentence → arrow never raises the allowed answer distance.

Recommendations, ranked moves, a move and a principal variation are distinct `answerContent`
values. A consumer accepting an evaluation fact does not thereby accept `bestMoveUci` carried in
the same engine payload. Adapters must project or redact disallowed fields before wrapping them.

Role and session constraints are real dimensions, not free-text surface labels. The declaration
uses current literal runtime role/session vocabularies and set-equality tests so the manifest fails
when either grows without a disposition. This does not choose future per-kind ceilings; F5/F11 own
those choices.

### 12. LLM boundary

The LLM is a consumer/renderer, never a producer of chess truth. `guidance.voice` accepts only
evidence already bound to the requested scope. Its input is a selected subset when F2 exists; until
then it remains the current deterministic sentence subset, now declared rather than inferred from
`packet.sentences`.

Recorded engine/tablebase readings may remain deterministically appended outside provider output.
Maia, Explorer, transitions, plans and opening identity do not enter the LLM merely because the
manifest can name them. Adding any one requires a new exact binding plus the later semantic and
selection gates.

Provider failure preserves the current deterministic fallback. The manifest must report voice as
available with deterministic rendering when no external provider exists; “LLM unavailable” is not
“evidence unavailable.”

### 13. Availability and abstention

Availability is runtime state joined to static capability. A provider declaration states how it
can be absent; `/capabilities` reports current availability separately from the compiled binding.
Stopping Maia, Stockfish, Syzygy, Explorer or the LLM cannot leave a provider-backed consumer
advertised as live for new requests.

Abstention belongs to the projection. Tablebase abstains outside its domain, Explorer on an empty
or unavailable population, Maia on provider/model failure, opening identity on no catalogue match,
and theory on no applicable cited passage. Consumers must render `honest_empty` or `unavailable`
when declared; they may not fall through to another source with different semantics without a
separate binding.

### 14. Reconciliation with existing registries

- `CAPABILITY_DISPOSITIONS` remains an engine/provider option audit. Evidence-relevant rows gain
  references to manifest producer/consumer IDs; its free-text `surface` field is not an authority.
- `EVIDENCE_KINDS` remains the sourcing-ledger record vocabulary. Each admitted record kind has an
  explicit adapter/projection; the manifest does not copy or rename the enum.
- runtime `EvidenceKind` remains the event transport vocabulary until a later schema RFC changes
  it. Its four members map explicitly to projections.
- `RULES_EVIDENCE_FACTS` remains the persisted/ref grammar. A ref is not a semantic event; its
  renderer must resolve through a declared projection and consumer.
- `RECORDED_READING_DISPOSITIONS` remains for one guarded transition release, checked set-equal
  against source-record projection dispositions. F2 removes or derives it when its semantic record
  migration lands. Two unchecked authorities are forbidden, but F1 does not create an import cycle
  between the server catalogue/aggregate and `position-evidence.ts` merely to delete the old name.
- `SURFACE_IDS` is navigation, not evidence consumption. Consumer IDs may map to a surface but are
  not renamed to make the old free-text intersection non-empty.

### 15. Migration and landing stages

This RFC is one code landing but has three implementation checkpoints:

1. **Declare:** add types/compiler, literal declarations, closure tests and a read-only report while
   preserving current behavior.
2. **Bind:** wrap all fourteen producer paths and require literal consumer IDs at every registered
   consumer call site. Remove generic bypasses; do not broaden learner visibility.
3. **Expose:** add the derived digest/availability/binding summary to server and web capabilities,
   document the contract, and put the compiler in `make verify` and startup.

The branch may not merge after checkpoint 1 or 2. A shadow compiler that logs errors while serving
is permitted only inside the implementation branch; the landed build is strict and green.

No content is edited. The dependency report is read-only. Any semantic or pack re-authoring it
finds is output for F2/F3 and remains under D560.

### 16. Implementation surface

The table below enumerates **implementation areas**, total fourteen; it does not claim fourteen
files. The implementing plan must replace each area with an exact file/symbol list before coding.

| # | area | required change |
|---:|---|---|
| 1 | runtime contract core | types, compiler, canonicalization, digest, error codes |
| 2 | runtime structural producers | separate predicate/reading declarations and dependencies |
| 3 | runtime transition producers | leaf declarations and lossy limitations |
| 4 | runtime phase/endgame/pivotal producers | current exact/convention declarations |
| 5 | runtime evidence refs/voice | declared wrappers and consumer bindings |
| 6 | server recorded evidence | source-record adapters and narrowing |
| 7 | server live Stockfish/Syzygy | split eval/WDL/PV/category/distance projections |
| 8 | server Maia/Explorer | population/model declarations and availability |
| 9 | server authored/shape/opening producers | authored/theory/source-only dispositions |
| 10 | server manifest aggregate | one compiler invocation and exported derived view |
| 11 | server capabilities/startup | digest, live availability and fail-fast validation |
| 12 | web API/rendering consumers | typed consumer IDs; inspector/raw paths explicit |
| 13 | verification tooling | closure, bypass, dependency and provider-off tests |
| 14 | canonical docs | `docs/evidence-contract.md` and existing evidence docs cross-links |

## Deviations from design

None. This RFC deliberately keeps exact module/preset/default choices out of F1, as the 2026-08-21
intent amendments require.

## Acceptance criteria

Each criterion names the failure it is intended to catch.

1. **The compiler exposes the twelve error families in §8, and twelve negative fixtures each raise
   the named code.** Fails if a prose invariant has no executable reader or if a fixture passes for
   a different reason.
2. **All fourteen A4 producer paths resolve to declarations, and set equality against the audited
   ID list is asserted.** Fails if the implementer registers only the four paths already visible to
   voice/rendering.
3. **Structural predicates and readings are separately versioned, with closure against all eighteen
   `STRUCTURAL_FEATURE_KINDS`.** Fails if `outpost` predicate and reading share one identity or if
   `pawn_count` is advertised as an emitted reading.
4. **Every transition family/leaf has a reading declaration whose initial version records the
   missing operands and is not learner-event eligible.** Fails if count-only output gains a square
   form or semantic-event binding without retaining squares.
5. **The dependency walk reports the current `outpost` → `pawn_safe_square` indirect population as
   23 expressions in three documents, and a fixture with only an indirect reference remains
   selected.** Fails on literal-token-only migration discovery.
6. **Runtime event kinds, sourcing evidence kinds, evidence refs, recorded-reading dispositions and
   packet fields each have an explicit set-equality or projection-map assertion.** Fails if a new
   member silently becomes unmanifested; namespace equality is not asserted.
7. **Every current evidence consumer call site names an exact consumer ID/version and accepts only
   `DeclaredEvidence` or a compiled binding view.** Fails if one generic reader can still accept a
   bare whole reading/packet field.
8. **Every projection has at least one binding or exactly one allowed disposition with a non-empty
   reason.** Fails on both an orphan and two conflicting dispositions.
9. **Every consumer has a non-empty exact accepted-projection set.** Fails if a checkbox, renderer or
   route has no producer, or accepts `rules.*`/latest.
10. **A binding cannot widen timing, roles, sessions, forms, answer content, latency or fact/form
    budgets.** The required
    negative fixture attempts to pass `bestMoveUci` from an eval payload to a fact-only precommit
    consumer and to raise its fact budget; both are refused.
11. **The current deterministic voice output and provider-off fallback remain byte-identical for a
    fixed packet, while adding an unbound Maia/Explorer/transition/plan item changes neither provider
    input nor output.** Fails if “compiled pool” becomes “everything reaches the LLM.”
12. **Recorded engine/tablebase prose remains deterministic and outside provider-authored text.**
    Fails if provider output can introduce or reorder an engine move/PV or citation.
13. **Provider-off tests cover Maia, Stockfish, Syzygy, Explorer and external voice separately.**
    Each becomes `honest_empty` or `unavailable` as declared; local rules/authored evidence and the
    deterministic voice path remain usable.
14. **`/capabilities` and the web `Capabilities` type expose the same manifest digest, availability
    and consumer-safe binding summary.** Fails on the current server-only capability-disposition
    shape.
15. **Canonicalization is deterministic across declaration order.** Shuffling producers,
    projections and consumers yields the same digest and sorted manifest; changing one semantic
    version changes it.
16. **`make evidence-manifest-check` is part of `make verify`, and application startup runs the same
    compiler.** Fails if CI and production compile different declaration sets.
17. **No committed generated manifest snapshot exists.** Fails if verification requires updating a
    checked-in derived JSON file.
18. **`DRILL_PACK_SCHEMA_VERSION`, `DRILL_RUN_SCHEMA_VERSION`, `SHAPE_ENTRY_SCHEMA_VERSION`,
    `PRINCIPLE_ENTRY_SCHEMA_VERSION` and `STORAGE_VERSION` are byte-identical across the
    implementation diff; no content file changes.** Fails if F1 absorbs F2/F3 or bypasses D560.
19. **`docs/evidence-contract.md` explains the producer/projection/consumer distinction, explicit
    dispositions, LLM boundary, provider-off behavior and how later RFCs add a declaration without
    adding a raw user setting.** Fails if the implementation is only discoverable by reading code.
20. **The existing A3/A4/A5 research harnesses still pass or are replaced by stricter equivalent
    assertions with their negative baseline preserved in history.** Fails if implementation merely
    deletes the instrument that demonstrated the gap.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | [[D546]] producer→feature binding and orphan producers/consumers | `evidence-contract-manifest` | implementation commit | |
| D2 | [[D568]] six-plane consumer join, manifest half only; semantic record remains F2 | `evidence-contract-manifest` | implementation commit | |
| D3 | [[D572]] compiled eligibility before selection, manifest half only; selector remains F2 | `evidence-contract-manifest` | implementation commit | |
| D4 | [[D631]] distinct predicate/reading projection identities; semantic learner events remain F2 | `evidence-contract-manifest` | implementation commit | |
| D5 | [[D632]] transitive semantic dependency discovery; corpus migration remains F3 | `evidence-contract-manifest` | implementation commit | |

## Open questions

No owner/product question remains: O1–O4 already rule the authority, semantic boundary and UX
layering. The drafting census resolves the four initial implementation questions in §§7, 10.1 and
14: shared static catalogue in runtime plus server availability aggregate; eighteen current
consumer operations; one set-equal transition release for `RECORDED_READING_DISPOSITIONS`; and
current manually opened raw panels classified as the contextual inspector, never as learner
guidance. Cross-review must re-derive those answers and return the RFC if the dependency graph or
symbol census refutes them; it may not substitute a wildcard or legacy bypass.

## Changelog

- 2026-08-21: initial draft from A0-A4, R1-R2 and owner rulings O1-O4. Scope fixed to declaration,
  compilation and current-path adapters; semantic selection, presets, workflows, theory retrieval
  and content migration explicitly remain downstream.
- 2026-08-21: author buildability pass resolved the package home and published an eighteen-operation
  current-consumer census. Raw manually opened in-run/compare panels are the contextual inspector;
  server/provider availability joins the shared runtime catalogue without redeclaring semantics.
