# RFC: Evidence contract manifest — every producer has a declared consumer or an honest home

- **Status:** implementing — 2026-08-21 author-return amendment landed (return choice 1, typed
  rendered items; [[D662]]/[[D663]]/[[D665]]/[[D666]]); the implementation branch resumes at
  stage 2
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

#### 4.3 Derived producers and projections (2026-08-21 author-return amendment)

The bind-stage return found provider text whose sentences represent compositions of other
evidence — comparison deltas, story evaluation shifts, a suggested title — with no declared
identity ([[D662]]). The return's choice 1 (typed rendered items, §6.1) is adopted; this section
supplies the vocabulary that choice requires, so implementation does not invent its semantics.

**Rendering versus derivation.** Rendering turns ONE declared item's payload into a form
(sentence, marker, lit squares) and creates no new evidence identity: "Checkpoint c2 was
reached." over one `run.record.checkpoint_hit` payload is rendering. Derivation computes a NEW
payload from the payloads of one or more declared projections: an eval delta across two recorded
evaluations, the changed-observation set between two positions, a title ranked over moments.
Derived values need their own projection identity before any consumer — the LLM included — may
receive them.

A **derived producer** is a named deterministic pure function whose evidence inputs are
exclusively the payloads of other declared projections at exact versions. It declares
`plane: "derived"` and `availability: "local"`. A **derived projection** is an output of a
derived producer; it carries `derivation.inputs`, the literal `{ id, version }` list of the
projections its payload is computed from. Derivation may chain (the story title consumes the
story rank projection, itself derived over the eval-shift); identity and versioning follow §4.2 —
re-pinning an input to a different projection version is a semantic change and increments the
derived projection's version. A non-evidence orientation parameter that only signs or orders a
composition without contributing payload content (the learner's side, a board orientation) is
named in `semantics`, not in `derivation.inputs`; a value whose *payload* gates or feeds the
computation is an input and must be listed.

**Derivation composes evidence; it never composes judgement** (law-8 corollary). A derived
projection over grounded facts is grounded exactly as far as its inputs are: it may count,
difference, rank or threshold them deterministically; it cannot add grounding, grade a move, or
introduce a strategic claim no input carries. A derived projection over two grounded facts is
grounded; prose ABOUT them is rendering, never a projection of its own.

The compiler enforces:

- `derivation.inputs` is non-empty (`EVIDENCE_PROJECTION_INCOMPLETE` otherwise — the same
  completeness family that refuses empty semantics, matching criterion 25), and every entry
  names a declared projection at its exact version (`EVIDENCE_DEPENDENCY_MISSING` otherwise);
  derivation edges join the §8 cycle walk (`EVIDENCE_DEPENDENCY_CYCLE`).
- A derived projection cannot claim more exactness than its inputs: `exactness: "exact"` is legal
  only when every input is exact and the composition is total; otherwise it declares `measured`
  or `convention` (`EVIDENCE_DERIVATION_WIDENS`).
- Grounding is inherited, never invented: when all inputs share one grounding the derived
  projection carries it; when inputs mix groundings it carries `declared_convention` and its
  `semantics` names the composition rule (`EVIDENCE_DERIVATION_WIDENS` otherwise).
- `answerContent` is a subset of the union of the inputs' `answerContent`
  (`EVIDENCE_DERIVATION_WIDENS`) — a derived projection over facts cannot disclose a move.
- If any input can abstain, the derived projection declares `abstention.possible: true` carrying
  at least the reason `input_abstained` (`EVIDENCE_DERIVATION_WIDENS`).

The generic escape hatch stays refused (the return's choice 3): a `derived.sentence` projection —
free prose with unenumerated inputs — is unrepresentable, because a derived projection without a
non-empty literal `derivation.inputs` list does not compile. This is the wildcard refusal of
`EVIDENCE_BINDING_WILDCARD`, applied to composition.

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
  | "authored"
  | "record"   // facts of the persisted run/imported document (2026-08-21, §10.2)
  | "derived"; // deterministic compositions of other declared projections (§4.3)

type ProjectionRole = "predicate" | "reading" | "event" | "source_record";
type EvidenceGrounding =
  | "position_rules"
  | "declared_convention"
  | "bounded_search"
  | "tablebase_exact"
  | "human_model"
  | "human_corpus"
  | "cited_theory"
  | "authored_claim"
  | "recorded_run"; // a fact mechanically read from the persisted run/imported document (2026-08-21)

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
  readonly derivation?: { readonly inputs: readonly { readonly id: string; readonly version: number }[] }; // §4.3; 2026-08-21
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
  readonly disposition?: { readonly kind: EvidenceDisposition; readonly reason: string };
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
wrapped and voice/deterministic consumers receive only items bound to them. The 2026-08-21
amendment goes further: `EvidencePacket.sentences` is deleted and `EvidencePacket.declared`
becomes required (§6.1); no consumer reads a parallel sentence array.

#### 6.1 Typed rendered items and the admitted view (2026-08-21 author-return amendment)

The checkpoint's `VoiceEvidenceView` carried a filtered `evidence` list AND a `sentences` array
copied independently from `EvidencePacket.sentences`, while `voiceCheck` treated that same array
as its allow-list — one undeclared mutation widened both provider input and the output checker
([[D662]]). The manifest must not be bypassable by a parallel array, so provider text becomes
typed rendered items and the parallel array is deleted.

```ts
interface RenderedEvidenceItem<T = unknown> {
  readonly evidence: DeclaredEvidence<T>;
  readonly sentences: readonly string[];
}

// ADMITTED is a non-exported unique symbol used as a REAL runtime property, set only by the two
// constructors in packages/runtime/src/evidence-contract.ts. A structural literal cannot name it,
// and an `as`-cast satisfies the type without producing the runtime property, so every reader
// asserts the property (via the exported assertion) before trusting a view.
interface ConsumerEvidenceView<T = unknown> {
  readonly [ADMITTED]: true;
  readonly consumer: VersionedEvidenceId;
  readonly items: readonly DeclaredEvidence<T>[];
}

// The sentence-bearing layer is sealed by the same brand. RenderedEvidenceItem itself is a plain
// pair, so the ONLY way a pair reaches a reader is inside this view, and the only constructor of
// this view is renderEvidenceItems(view: ConsumerEvidenceView, renderers) in evidence-contract.ts,
// which maps each admitted item through the renderer registered for its literal projection id.
// Without this seal the [[D662]] side channel is reborn one level up: an ad-hoc
// { evidence, sentences } literal would widen provider input and the checker together, fully
// typechecked. Sentences therefore exist only as a registered renderer's output over an admitted
// item's payload — what binds sentences[i] to its evidence.
interface RenderedEvidenceView<T = unknown> {
  readonly [ADMITTED]: true;
  readonly consumer: VersionedEvidenceId;
  readonly items: readonly RenderedEvidenceItem<T>[];
}
```

- `evidenceForConsumer` returns the branded `ConsumerEvidenceView`. This is what upgrades the
  §10.1 census from anchors to consumption ([[D666]]): every registered operation entrypoint
  accepts `ConsumerEvidenceView`, `RenderedEvidenceView` or `DeclaredEvidence<T>`, and a bare
  packet/reading/ref no
  longer typechecks. Each package hosting operations carries a type fixture that passes each
  operation its pre-F1 bare payload under `@ts-expect-error`; TypeScript fails the build when a
  directive is unused, so the fixture is red exactly while a bare payload still compiles — it is
  red at the checkpoint, which is what [[D444]]/[[D451]] demand of an instrument.
- `apps/server/src/guidance.ts` gains `renderedEvidenceItems(manifest, consumer, declared)`: it
  admits `declared` through `evidenceForConsumer` FIRST, then obtains the sealed
  `RenderedEvidenceView` from `renderEvidenceItems(view, renderers)` — the brand-owning
  module's sole constructor — passing an exact per-projection renderer table (literal projection
  id → deterministic render function; no catch-all arm). The result is the only sentence
  authority — deterministic guidance text is the join of item sentences, provider input is the
  item list, and `voiceCheck`'s allow-list is derived from the same admitted items. One
  authority, three readers, one constructor.
- `VoiceEvidenceView` becomes `{ scope, rendered: RenderedEvidenceView }` with no `sentences`
  field; `voiceCheck(rendered, output)` replaces `voiceCheck(packet, output)` in
  `packages/runtime/src/voice.ts`, and both `voiceCheck` and the provider-body assembly assert
  the runtime brand before reading items, so an `as`-cast forge fails at runtime, not only in
  review. The external provider body (`apps/server/src/external-voice.ts`) is
  `{ personaPrompt, scope, items: [{ evidence: { producer, projection, payload }, sentences }] }`,
  serialized only from a brand-asserted view.
- Residual, named: `declareEvidence` stays exported, so a call site can still fabricate a
  payload under a declared projection id; the seal binds sentences to `(projection, payload)`
  via registered renderers, and the §10.1 census plus criterion 7 keep declare-sites enumerable.
  Sealing `declareEvidence` behind producer adapters is deliberately left to F2 if its semantic
  events need it.
- Any surviving sentence list elsewhere (`StoryMoment`, `ComparisonNarrative` groups) is a
  flatMap over rendered items at the use site, never a second stored array.
- Byte-compatibility: for a fixed input, the joined item sentences reproduce the checkpoint's
  deterministic output byte-for-byte in the current assembly order (phase, structures, markers,
  endgame, authored; compare and story keep their §10.2 orders). Criterion 11 pins this.

The sentinel fixture the return demands: write a unique sentinel into the only place raw prose
could previously travel (raw `packet.sentences` at the checkpoint); it must neither enter
provider input nor become allowed output. At the checkpoint it does both, so the fixture starts
red. After the field is deleted, the fixture keeps its output arm: a provider response containing
a token absent from the admitted items is refused by `voiceCheck` (criterion 21).

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
| `EVIDENCE_CONSUMER_ORPHANED` | every consumer accepts at least one existing projection or carries one explicit disposition with a reason | name only a missing projection; give one consumer two dispositions |
| `EVIDENCE_BINDING_UNDECLARED` | adapter, producer, projection and consumer all exist at exact versions | change one version by one |
| `EVIDENCE_BINDING_WILDCARD` | IDs and versions are literal; no prefix, range or “latest” | use `rules.*` or omit a version |
| `EVIDENCE_BINDING_WIDENS` | binding timing/role/session/form/answer sets, latency and budgets only narrow both endpoints | add `principal_variation` to a fact-only consumer or raise its fact budget |
| `EVIDENCE_PROJECTION_INCOMPLETE` | semantics, payload type, operands/signs, grounding, exactness, abstention, limitations and any disposition reason are complete | delete abstention reasons from a provider projection |
| `EVIDENCE_DEPENDENCY_MISSING` | every semantic dependency names an existing exact projection | delete `pawn_safe_square` while `outpost` depends on it |
| `EVIDENCE_DEPENDENCY_CYCLE` | the projection dependency graph is acyclic | make A depend on B and B on A |
| `EVIDENCE_GENERIC_BYPASS` | registered consumer call sites cannot accept a bare reading/ref/packet field | invoke a guarded renderer with a raw payload |
| `EVIDENCE_PROVIDER_FALLBACK_MISSING` | every provider-backed consumer declares available, honest-empty or unavailable behavior | omit the Maia-off arm |
| `EVIDENCE_DERIVATION_WIDENS` | a derived projection inherits grounding, cannot exceed its inputs' exactness or answer content, and preserves input abstention (§4.3) | declare `derived.compare.eval_delta` as `exact`, give it an answer distance no input carries, or drop `input_abstained` |

These are thirteen **compiler error families** (twelve at acceptance; `EVIDENCE_DERIVATION_WIDENS`
added by the 2026-08-21 author-return amendment). Tests assert set equality between the exported error
code list and the negative-fixture table so a new invariant cannot exist only in prose.

### 9. Initial projection closure

F1 registers current truth, including its limitations. It does not bless current names as learner
semantics.

1. `STRUCTURAL_FEATURE_KINDS` is set-equal to structural **predicate** declarations.
2. Every actually emitted structural reading kind has a separate **reading** declaration. The seven
   matcher/reader mismatches are explicit dependencies or limitations, not one shared version.
   **"Actually emitted" is established by an executable emission census over the committed fixture
   corpus** (the D548 measurement style, `tools/d542-classifier-audit-harness/`), never by the
   declaration under test — a closure test that reads only the declarations would share the
   defect's assumption. A declared kind with zero census emissions (`pawn_count` at HEAD, 0
   observations over 643 positions) compiles only with an explicit disposition naming that state.
3. `TRANSITION_FEATURE_KINDS` and every emitted subkind/direction leaf are covered by reading
   declarations. The initial versions state that affected squares/subjects are absent; none is
   admitted as an operand-preserving learner event.
4. `RULES_EVIDENCE_FACTS`, runtime `EvidenceKind`, sourcing `EVIDENCE_KINDS`,
   `RECORDED_READING_DISPOSITIONS` and the actual packet fields each have set-equality or explicit
   projection-map tests. Namespace equality is not required; every deliberate narrowing is.
5. The fourteen A4 producer paths each resolve to at least one producer declaration and at least
   one output projection or explicit retired disposition.
6. **The phase wrapper carries the payload its projection promises** ([[D665]], 2026-08-21).
   `rules.phase.reading@1` declares `payloadType: "PhaseReading"`, so `evidencePacket`
   (`apps/server/src/guidance.ts`) always wraps the actual `classifyPhase(fen)` result — never
   the `{ source, value }` transport pair — and an authored pack's declared phase is a DIFFERENT
   projection, `pack.authored.phase@1` (producer `pack.authored`, `payloadType: "PackPhase"`,
   grounding `authored_claim`, exactness `authored`). Both are declared when a pack is present.
   Current sentence behavior is preserved as a deterministic rendering rule in
   `renderedEvidenceItems`: when a `pack.authored.phase` item is admitted it renders
   "This pack declares: X." and the detector phase item renders no sentence; with no pack the
   detector item renders `renderPhaseReading`. That registers current shipped behavior; it is not
   F2 selection. `guidance.deterministic@1` and `guidance.voice@1` accepts gain
   `pack.authored.phase@1`.

The `outpost` reading/predicate declaration names its dependency on the current
`pawn_safe_square` predicate projection. A dependency census walks transitive edges, then content
references. At the drafting baseline it must report 23 `outpost` expressions across three content
documents as indirect users of `pawn_safe_square`; a zero-result direct-token scan fails the test.
F3 consumes this graph for migration planning.

### 10. Current consumer closure

The implementation first derives the full current consumer census from production call sites and
checks it in as literal declarations. At minimum it covers the five generic sinks pinned by A3 and
the other A4 paths: server guidance packet assembly, deterministic voice, external voice,
authored-claim delivery sheets, evidence-reference rendering, in-run structural/transition rows,
selected-square lighting, comparison rows/strips, marker/story output, engine/tablebase
conditions, explicit analysis, human-split/corpus panels, repertoire gap scanning, opponent
selection and sourcing/claim-binding validation.

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

A producerless surface is registered, never deleted and never left out. The known instance is
[[D546]]'s `assistance.arrows`: `AssistanceConfig.arrows` (`assistance-preference.ts`) has four
version migrations, values `sight`/`evidence`, and at HEAD no producer and no renderer — the
token appears only in `AssistanceSettings.svelte` and the preference migration. It is declared as
a consumer with an explicit `experimental` disposition whose reason names D546; whether it later
gains a producer or is retired is F5's/the owner's decision, recorded then. Leaving it
unregistered would re-create the register-that-cannot-see-its-own-state failure; deleting the
control would be a behavior change this RFC does not scope.

#### 10.1 Initial consumer-symbol census

The initial closure is **twenty-five consumer operations**: the twenty-three below plus rows
24–25, added in §10.2 by the 2026-08-21 author return when the bind stage measured that compare
and story revoice carry permission contracts the base voice operation does not. A row is one
operation with a distinct permission or output consequence, not one call site; multiple call
sites using the same renderer stay one row. The implementation plan must refresh the anchors and split a row if one operation
actually carries two permission contracts. It may not silently drop a row to make closure green.
Rows 19–23 were added by the 2026-08-21 cross-review: the author census of eighteen omitted five
operations its own §10 enumeration partly names — the marker UI (producer path 4 promises "both
consumers" and the census carried only voice), story output, the feedback-delivery stage-1
authored-claim sheets, repertoire gap scanning, and claim-binding validation.

| # | consumer id | current implementation anchors | initial home |
|---:|---|---|---|
| 1 | `authoring.predicate` | `matchesStructuralExpression`; objective/pack/shape validators and expression census | `author_only` |
| 2 | `runtime.objective_condition` | `objective.ts`; `pack-orchestrator.ts` evidence refs | `machine_condition` |
| 3 | `runtime.guard_condition` | `guard.ts`; queued engine/tablebase condition evidence | `machine_condition` |
| 4 | `guidance.packet` | `guidance.ts:evidencePacket` | internal aggregate, no direct learner form |
| 5 | `guidance.deterministic` | `guidance.ts` sentence assembly and fallback | bound sentence consumer |
| 6 | `guidance.voice` | `renderVoice`; `voiceCheck`; `external-voice.ts` | optional renderer over admitted rendered items (§6.1); marker/reading/steering scopes only after the §10.2 split |
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
| 19 | `guidance.authored_claim` | `claim-presentation.ts:claimProvenance`; `CheckpointSheet.svelte`; `TerminalSheet.svelte` | bound authored-claim text with binding/earned-evidence disclosure |
| 20 | `board.pivotal_marker` | `DrillScreen.svelte` pivotal rows; `renderPivotalMarker` | timeline marker plus opened marker sentences |
| 21 | `review.story` | `storyMoments`; `service.story`; `/story` and `/api/shared/…/story` routes; `GameStoryScreen.svelte` | Review consumer over recorded eval events, pivotal kinds, shape spans; spectator-reachable via share token |
| 22 | `runtime.repertoire_scan` | `repertoire.ts:scanRepertoire`; `corpusPopulation`; `REPERTOIRE_CORPUS_GUARD` | machine consumer of the Explorer population; guard/abstention learner-visible |
| 23 | `authoring.claim_binding` | `claim-binding.ts:validateClaimBindings`; `MACHINE_LABEL_EVIDENCE_KINDS` | `author_only` validation of claims against source records |

The two on-request panels and the manually opened structural/transition/compare detail sections are
the current **contextual analysis inspector**, even though they live inside the run layout. Their
headings gain “Evidence inspector” semantics/labels at F1 landing so they cannot be mistaken for
guidance modules. This is a classification of already-visible raw evidence under the O1 amendment,
not an F5 preset/default decision. They remain explicitly opened and keep current disclosure gates.

#### 10.2 Compare and story provider text: declared sources (2026-08-21 author-return amendment)

The bind-stage return (§1 of `planning/evidence-contract-manifest/author-return.md`) enumerated
what compare and story prose actually represents. None of it is invented here; all of it is
registered. Facts of the persisted run/imported document gain one producer, and the values that
are genuinely composed gain derived projections (§4.3).

**`run.record@1`** — plane `record`, grounding `recorded_run`, availability `recorded`;
implementation `packages/runtime/src/compare-strips.ts; packages/runtime/src/story.ts;
packages/runtime/src/branch-path.ts`:

| projection | payload | represented prose |
|---|---|---|
| `run.record.fork@1` | fork node, shared ply count, per-branch fork offsets | "The recorded branches share N plies through the fork." |
| `run.record.move@1` | recorded SAN/UCI committed at a node | "Branch at offset k begins with recorded move X." — `answerContent: ["fact", "move"]` with the limitation *recorded already-played move, never a recommendation*; `review` timing only |
| `run.record.checkpoint_hit@1` | checkpoint id and ply offset | "Checkpoint X was reached." |
| `run.record.objective_transition@1` | from/to objective state at a node | "The recorded objective changed from A to B." |
| `run.record.consequence@1` | plies reached, objective state, terminal flag, learner outcome | branch consequence/terminal sentences; the story outcome moment |
| `run.record.imported_result@1` | the imported PGN result tag | "The PGN records the game result as R…" — limitation: a claim of the imported document, not a rules-derived outcome |

**`derived.compare_narrative@1`** — plane `derived`, implementation
`packages/runtime/src/compare-strips.ts:comparisonNarrative`:

| projection | derivation.inputs | grounding / exactness |
|---|---|---|
| `derived.compare.structure_delta@1` | the seventeen emitted `rules.structural.reading.*@1` | `position_rules` / `exact` (all inputs exact; set difference is total) |
| `derived.compare.eval_delta@1` | `live.stockfish.eval@1` | `bounded_search` / `measured`; abstains (`input_abstained`, `no_recorded_trail`) |

**`derived.story@1`** — plane `derived`, implementation
`packages/runtime/src/story.ts:storyMoments; suggestTitle`:

| projection | derivation.inputs | grounding / exactness |
|---|---|---|
| `derived.story.eval_shift@1` | `live.stockfish.eval@1` | `bounded_search` / `measured`; the learner-side sign normalization is an orientation parameter named in `semantics` (§4.3) |
| `derived.story.last_level@1` | `live.stockfish.eval@1`, `run.record.imported_result@1` | mixed ⇒ `declared_convention` / `convention` — the within-a-pawn threshold AND the learner-lost gate that reads the imported result tag (`learnerLost` at `story.ts`) are Tabiya's declared conventions, named in `semantics` |
| `derived.story.rank@1` | `derived.story.eval_shift@1`, `derived.story.last_level@1`, `run.record.consequence@1`, `run.record.imported_result@1`, `rules.pivotal.marker@1`, `rules.endgame.reading@1`, `theory.shapes.firing@1` | mixed ⇒ `declared_convention` / `convention` — the `storyMoments` kind-priority order with the recorded-\|Δcp\| tiebreak. A presentation-prominence ordering by declared product convention, never a chess-significance claim (the R3/R11 refusal covers statistical lift/synergy rankings as selection mechanisms; a fixed declared ordering is the pivotal-marker legal class). Consumed today by `review.story` (`/story` JSON, `GameStoryScreen.svelte` top-8 moment selection, the shared story page) and by the title |
| `derived.story.title@1` | `derived.story.rank@1`, `run.record.consequence@1`, `run.record.imported_result@1`, `rules.endgame.reading@1` | mixed ⇒ `declared_convention` / `convention`; `semantics` names the title composition rule — including that the verb is White-relative for an imported result tag (`suggestTitle` never consults the learner side): current shipped behavior, preserved by criterion 11 and registered, not endorsed. This is the chained case: it consumes a derived projection through the rank |

Everything else in compare/story prose is rendering over an already-declared projection:
timing-strip pivotal entries over `rules.pivotal.marker@1`, story endgame-entry sentences over
`rules.endgame.reading@1`, shape spans over `theory.shapes.firing@1`, and outcome sentences over
the two `run.record` outcome projections. No producer beyond `run.record` and the two derived
producers is added, and the raw `live.stockfish.eval` payload is NOT admitted to any voice
consumer — only its derived deltas are. That narrowing is the manifest doing its job.

**Consumer split.** Compare and story revoice admit `run.record` and derived projections the
base voice must not (compare additionally discloses a recorded `move` token), so per §10.1's own
rule they become their own operations:

| # | consumer id | current implementation anchors | accepts ceiling and constraints |
|---:|---|---|---|
| 24 | `guidance.voice_compare@1` | `rest.ts` `scope === "compare"` branch; `comparisonNarrative` | `run.record.fork@1`, `run.record.move@1`, `run.record.checkpoint_hit@1`, `run.record.objective_transition@1`, `run.record.consequence@1`, `rules.pivotal.marker@1`, `derived.compare.structure_delta@1`, `derived.compare.eval_delta@1`; `timing: ["review"]`, `forms: ["sentence"]`, `answerContent: ["fact", "evaluation", "move"]`, `providerOff: "available"` |
| 25 | `guidance.voice_story@1` | `rest.ts` story arm of the `voice`/`speech` actions; `storyMoments`; `suggestTitle` | the five base `guidance.voice` projections plus `pack.authored.phase@1`, `theory.shapes.firing@1`, `run.record.consequence@1`, `run.record.imported_result@1`, `derived.story.eval_shift@1`, `derived.story.last_level@1`, `derived.story.title@1`; `timing: ["review"]`, `forms: ["sentence", "audio"]`, `providerOff: "available"` |

The census is therefore **twenty-five operations**; `CURRENT_CONSUMER_OPERATION_IDS`, the anchor
census in `evidence-manifest-check.ts` and the declared consumers move to twenty-five together.
The accepts lists above are ceilings: implementation may narrow them, never widen. The compare
view carries ONLY items produced by the comparison assembly — `run.record`, `derived.compare`
and the compared branches' pivotal markers from the timing strip; no item of the base packet
aggregate is admitted (`rules.pivotal.marker` appears in both accept sets, so the exclusion is
of base-packet *items*, not of the projection id) — which encodes in the manifest what the
checkpoint did by ad-hoc packet surgery at `rest.ts`. The story view carries base items plus
story items. Registering `theory.shapes.firing` and the story/run-record
projections for revoice does not broaden learner visibility: those sentences already reach the
provider today through the undeclared array; this declares them and makes the widening path
refusable.

**The deterministic Review surfaces consume the same declarations.** The §10.2 projections do
not reach only the voice split: `/story` and the shared story page serve moment sentences, the
rank ordering and the suggested title, and `CompareView`'s timing strip serves the `run.record`
and pivotal entries. At stage 2, `review.story@1`'s accepts therefore gain
`run.record.consequence@1`, `run.record.imported_result@1`, `rules.endgame.reading@1`,
`derived.story.eval_shift@1`, `derived.story.last_level@1`, `derived.story.rank@1` and
`derived.story.title@1`, and the compare strip consumers (`compare.structure_strip@1` at
minimum; the stage-2 census splits a row if the timing strip carries a distinct permission
contract, per §10.1's rule) gain `run.record.fork@1`, `run.record.move@1`,
`run.record.checkpoint_hit@1`, `run.record.objective_transition@1`, `run.record.consequence@1`
and `rules.pivotal.marker@1` — as ceilings, like rows 24–25. Leaving these accepts un-amended
while criterion 7 forces admission through `evidenceForConsumer` would silently drop
learner-visible story/compare content and break criterion 11's byte-identity; this paragraph
exists so that failure is a spec breach, not a discovered surprise.

`guidance.packet` is permitted as an internal aggregate only when its fields are
`DeclaredEvidence`; it is not itself a consumer binding and cannot be passed wholesale to a
renderer. The external voice receives the exact compiled `guidance.voice` view rather than the
aggregate; compare and story revoice receive their own §10.2 views under their own consumer
contracts.

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

The LLM is a consumer/renderer, never a producer of chess truth. The voice consumers accept only
evidence already bound to them. Their input is a selected subset when F2 exists; until then it is
the current deterministic set, carried as §6.1 rendered items — `packet.sentences` no longer
exists to be inferred from, and `voiceCheck`'s allow-list derives from the same admitted items
the provider receives.

Recorded engine/tablebase readings may remain deterministically appended outside provider output.
Maia, Explorer, transitions, plans and opening identity do not enter the LLM merely because the
manifest can name them. Adding any one requires a new exact binding plus the later semantic and
selection gates.

Provider failure preserves the current deterministic fallback. The manifest must report voice as
available with deterministic rendering when no external provider exists; “LLM unavailable” is not
“evidence unavailable.”

#### 12.1 Reasoning review is not chess evidence ([[D663]], 2026-08-21 author-return amendment)

The reasoning-review operation (`rest.ts`, `route.action === "reasoning-review"`) asks the
external provider to quote contiguous learner text: its input is the learner transcript, the
authored key points and the deterministic detections. At the checkpoint its task travels in the
legacy `deterministicText` argument that `ExternalHttpVoiceProvider.render` ignores, so a
configured provider receives chess sentences instead of the task — a live wrong-content leak to
an external service, and a non-chess operation smuggled through `guidance.voice`.

The fix is a separate typed contract, not a manifest binding:

- `"reasoning"` is removed from `VoiceScope` (`apps/server/src/guidance.ts`).
- `apps/server/src/external-voice.ts` gains `ReasoningReviewProvider` with
  `review(request: ReasoningReviewRequest): Promise<string>`, where `ReasoningReviewRequest`
  carries `{ task, transcript, keyPoints, detections }` — pinned to the exact fields the route
  already assembles at `rest.ts` (`task`, `access.event.data.transcript`,
  `access.keyPoints` id/label/phrases, `access.event.data.detections`). The HTTP body is
  `{ personaPrompt, task, transcript, keyPoints, detections }`: no evidence items, no chess
  sentences.
- The route stops building an `EvidencePacket` for this operation entirely.
  `reasoningMatchCheck` remains the deterministic acceptance gate over the provider's proposals,
  unchanged, and the learner-facing proposal text is unchanged.
- The operation is deliberately NOT a manifest consumer: it consumes no chess-evidence
  projection, and declaring it one would launder learner text through the evidence vocabulary.
  Its guard is acceptance criterion 23, which starts red at the checkpoint.

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
  explicit adapter/projection; the manifest does not copy or rename the enum. **Named seam:** the
  evidence-kinds register carries a live `citable_text` claim by `pack-population-provenance.md`.
  F1's set-equality test is over the seven landed members; when that claim lands, the landing
  commit must add the new member's projection or disposition declaration or the compile fails —
  that failure is this design working, and RFC-5's implementer inherits the obligation from this
  sentence rather than discovering it as a red build.
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
2. **Bind:** wrap all seventeen producer paths (the fourteen A4 paths plus `run.record` and the
   two derived producers of §10.2) and require the branded `ConsumerEvidenceView`, the branded
   `RenderedEvidenceView` or `DeclaredEvidence<T>` at every registered operation entrypoint — a literal consumer ID string
   next to a bare payload is an anchor, not consumption ([[D666]]). Remove generic bypasses,
   including the `packet.sentences` side channel ([[D662]]) and the reasoning-review smuggling
   (§12.1); do not broaden learner visibility.
3. **Expose:** add the derived digest/availability/binding summary to server and web capabilities,
   document the contract, and put the compiler in `make verify` and startup.

The branch may not merge after checkpoint 1 or 2. A shadow compiler that logs errors while serving
is permitted only inside the implementation branch; the landed build is strict and green.

No content is edited. The dependency report is read-only. Any semantic or pack re-authoring it
finds is output for F2/F3 and remains under D560.

### 16. Implementation surface

The table below enumerates **implementation areas**, total sixteen (fourteen at acceptance; 15
and 16 added by the 2026-08-21 author return); it does not claim sixteen files. The implementing
plan must replace each area with an exact file/symbol list before coding.

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
| 15 | run-record and derived producers | `run.record`/`derived.*` declarations; `comparisonNarrative` and `storyMoments`/`suggestTitle` refactored to rendered items (§10.2) |
| 16 | reasoning-review contract | `ReasoningReviewProvider`; `rest.ts` reasoning-review route; `VoiceScope` narrowing (§12.1) |

## Deviations from design

None. This RFC deliberately keeps exact module/preset/default choices out of F1, as the 2026-08-21
intent amendments require.

## Acceptance criteria

Each criterion names the failure it is intended to catch.

1. **The compiler exposes the thirteen error families in §8, and thirteen negative fixtures each
   raise the named code.** Fails if a prose invariant has no executable reader or if a fixture
   passes for a different reason.
2. **All fourteen A4 producer paths resolve to declarations and remain asserted as a subset, and
   the full producer set is asserted set-equal to the seventeen ids** (the fourteen plus
   `run.record`, `derived.compare_narrative`, `derived.story` — 2026-08-21 amendment). Fails if
   the implementer registers only the four paths already visible to voice/rendering, or if an
   eighteenth producer appears without an amendment.
3. **Structural predicates and readings are separately versioned, with closure against all eighteen
   `STRUCTURAL_FEATURE_KINDS`.** Fails if `outpost` predicate and reading share one identity or if
   `pawn_count` is advertised as an emitted reading. The emitted/declared distinction is read from
   the executable emission census of §9, not from the declarations under test.
4. **Every transition family/leaf has a reading declaration whose initial version records the
   missing operands and is not learner-event eligible.** Fails if count-only output gains a square
   form or semantic-event binding without retaining squares.
5. **The dependency walk reports the current `outpost` → `pawn_safe_square` indirect population as
   23 expressions in three documents, and a fixture with only an indirect reference remains
   selected.** Fails on literal-token-only migration discovery.
6. **Runtime event kinds, sourcing evidence kinds, evidence refs, recorded-reading dispositions and
   packet fields each have an explicit set-equality or projection-map assertion.** Fails if a new
   member silently becomes unmanifested; namespace equality is not asserted.
7. **Every registered consumer operation's entrypoint accepts only the branded
   `ConsumerEvidenceView`, the branded `RenderedEvidenceView` or `DeclaredEvidence<T>`, and a
   per-package type fixture passes each
   operation its pre-F1 bare payload under `@ts-expect-error`.** The build fails when a directive
   is unused — i.e. while a bare packet/reading/ref still typechecks anywhere — so the fixture is
   red at checkpoint `2b68103`…`aaea3e4` and green only when consumption is real. Fails the way
   the checkpoint failed ([[D666]]): a source file retains the named function, its raw input
   bypasses every compiled binding, and a needle census stays green.
8. **Every projection has at least one binding or exactly one allowed disposition with a non-empty
   reason.** Fails on both an orphan and two conflicting dispositions.
9. **Every consumer has a non-empty exact accepted-projection set or exactly one explicit
   disposition with a non-empty reason.** Fails if a checkbox, renderer or route has no producer
   and no disposition, or accepts `rules.*`/latest. The required positive fixture is
   `assistance.arrows` compiling under its `experimental` disposition; the negative fixture strips
   that disposition and must raise `EVIDENCE_CONSUMER_ORPHANED`.
10. **A binding cannot widen timing, roles, sessions, forms, answer content, latency or fact/form
    budgets.** The required
    negative fixture attempts to pass `bestMoveUci` from an eval payload to a fact-only precommit
    consumer and to raise its fact budget; both are refused.
11. **The current deterministic voice output and provider-off fallback remain byte-identical for a
    fixed packet, while adding an unbound Maia/Explorer/transition/plan item changes neither provider
    input nor output.** The same byte-identity holds for the compare and story deterministic
    fallbacks: the joined admitted-item sentences reproduce the checkpoint's narrative/story
    output for a fixed run, in the same order. Fails if “compiled pool” becomes “everything
    reaches the LLM,” or if the items refactor silently reorders or rewrites learner-visible
    prose.
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
21. **The sentinel side-channel fixture exists and started red at the checkpoint** ([[D662]]). A
    unique sentinel written only to the raw packet sentence array must neither enter provider
    input nor become allowed voice output; at checkpoint `2b68103`…`aaea3e4` it does both. After
    `EvidencePacket.sentences` is deleted the fixture keeps its output arm: provider output
    containing a token absent from the admitted items is refused by `voiceCheck`. Fails if one
    undeclared mutation can ever again widen provider input and the output checker together.
22. **`voiceCheck` and provider input share one authority, and the sentence layer is sealed.**
    `voiceCheck` takes the brand-asserted `RenderedEvidenceView` — its packet parameter is
    gone — and a test asserts, for every voice scope, that its allow-list equals the flatMap of
    the exact item list sent to the provider. Two forge fixtures guard the seal (§6.1): an
    ad-hoc `{ evidence, sentences }` literal fails to typecheck at every registered voice
    entrypoint (`@ts-expect-error`), and a cast-forged view lacking the runtime brand property
    is refused at runtime by `voiceCheck` and by the provider-body assembly. Fails if the
    checker and the provider input are computed from different sources, or if any call site can
    pair admitted evidence with prose no registered renderer produced.
23. **The reasoning-review request body carries the task and no chess evidence** ([[D663]]). A
    fixture captures the external HTTP body for `reasoning-review` and asserts it contains
    `task`, `transcript`, `keyPoints` and `detections` and contains no evidence items and no
    chess sentences; `"reasoning"` is absent from `VoiceScope`. This fixture starts red: at the
    checkpoint the provider receives chess sentences and never sees the task.
24. **The phase wrapper's bytes match its projection** ([[D665]]). For a detector packet the
    `rules.phase.reading@1` payload is the `classifyPhase` result; for an authored pack the
    packet declares BOTH the detector `PhaseReading` under `rules.phase.reading@1` AND the
    authored phase under `pack.authored.phase@1`, with deterministic output byte-identical to
    the checkpoint. Fails if a `{ source, value }` transport pair is attributed to the detector
    producer.
25. **Derived projections cannot lie about their inputs** (§4.3). Negative fixtures: an `exact`
    claim over a `measured` input, an answer distance no input carries, and a dropped
    `input_abstained` reason each raise `EVIDENCE_DERIVATION_WIDENS`; a derivation input absent
    from the catalogue raises `EVIDENCE_DEPENDENCY_MISSING`; a derivation cycle raises
    `EVIDENCE_DEPENDENCY_CYCLE`; and a derived projection with empty `derivation.inputs` — the
    refused generic `derived.sentence` escape hatch — raises `EVIDENCE_PROJECTION_INCOMPLETE`.
    Fails if free prose can become a projection.
26. **The consumer census is twenty-five and the voice split is real.**
    `CURRENT_CONSUMER_OPERATION_IDS`, the anchor census and the declared consumers are
    set/order-equal at twenty-five; `guidance.voice_compare@1` and `guidance.voice_story@1` have
    non-identical accepts sets; and the compare view admits no item of the base packet
    aggregate — for a fixed run whose base packet carries phase, named-structure and authored
    items, none of those items appears in the compare view, while `rules.pivotal.marker` items
    may appear only via the comparison timing strip, produced by the compare assembly, never
    copied from the base packet. Fails if compare or story prose reaches the provider under the
    base `guidance.voice` contract.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | [[D546]] producer→feature binding and orphan producers/consumers | `evidence-contract-manifest` | implementation commit | |
| D2 | [[D568]] six-plane consumer join, manifest half only; semantic record remains F2 | `evidence-contract-manifest` | implementation commit | |
| D3 | [[D572]] compiled eligibility before selection, manifest half only; selector remains F2 | `evidence-contract-manifest` | implementation commit | |
| D4 | [[D631]] distinct predicate/reading projection identities; semantic learner events remain F2 | `evidence-contract-manifest` | implementation commit | |
| D5 | [[D632]] transitive semantic dependency discovery; corpus migration remains F3 | `evidence-contract-manifest` | implementation commit | |
| D6 | [[D662]] one sentence authority: §6.1 rendered items, the branded view, `packet.sentences` deleted, sentinel fixture (criteria 21–22) | `evidence-contract-manifest` | implementation commit | |
| D7 | [[D663]] reasoning-review typed non-evidence contract; `"reasoning"` removed from `VoiceScope` (§12.1, criterion 23) | `evidence-contract-manifest` | implementation commit | |
| D8 | [[D665]] phase wrapper carries `PhaseReading`; `pack.authored.phase@1` declared (§9 clause 6, criterion 24) | `evidence-contract-manifest` | implementation commit | |
| D9 | [[D666]] closure proves consumption, not anchors: branded `ConsumerEvidenceView` at all twenty-five entrypoints plus the `@ts-expect-error` type fixtures (criteria 7, 26) | `evidence-contract-manifest` | implementation commit | |

## Open questions

No owner/product question remains: O1–O4 already rule the authority, semantic boundary and UX
layering. The drafting census resolves the four initial implementation questions in §§7, 10.1 and
14: shared static catalogue in runtime plus server availability aggregate; twenty-five current
consumer operations (the author census said eighteen; the 2026-08-21 cross-review re-derivation
refuted that count at the symbol and added rows 19–23; the 2026-08-21 author return split
compare/story revoice into rows 24–25 when the bind stage measured their distinct permission
contracts, §10.2); one set-equal transition release for
`RECORDED_READING_DISPOSITIONS`; and current manually opened raw panels classified as the
contextual inspector, never as learner guidance. Cross-review must re-derive those answers and
return the RFC if the dependency graph or symbol census refutes them; it may not substitute a
wildcard or legacy bypass.

The 2026-08-21 author return raised no owner question either: choice 1 preserves shipped
learner-visible behavior byte-for-byte (criteria 11, 24), the consumer split and the
`run.record`/derived declarations register current truth rather than deciding new presentation,
and the refusal of a generic `derived.sentence` re-affirms the return's own choice-3 refusal.
The §10.1 "Evidence inspector" relabel is **owner-approved (nod recorded 2026-08-21)** — it
lands with implementation; no item awaits an owner.

## Changelog

- 2026-08-21: initial draft from A0-A4, R1-R2 and owner rulings O1-O4. Scope fixed to declaration,
  compilation and current-path adapters; semantic selection, presets, workflows, theory retrieval
  and content migration explicitly remain downstream.
- 2026-08-21: author buildability pass resolved the package home and published an eighteen-operation
  current-consumer census. Raw manually opened in-run/compare panels are the contextual inspector;
  server/provider availability joins the shared runtime catalogue without redeclaring semantics.
- 2026-08-21: adversarial cross-review. The consumer census was refuted at the symbol and corrected
  to twenty-three operations (added: authored-claim delivery sheets, pivotal marker UI, story,
  repertoire gap scanning, claim-binding validation). Consumer declarations gained the disposition
  arm O1's orphan rule requires, with `assistance.arrows` as the named producerless fixture;
  `EVIDENCE_CONSUMER_ORPHANED` and criterion 9 updated to match. §9's "actually emitted" is now
  pinned to the executable emission census rather than the declarations under test (criterion 3
  updated). §14 names the live `citable_text` claim seam with `pack-population-provenance`.
- 2026-08-21: author round on the bind-stage implementation return
  (`planning/evidence-contract-manifest/author-return.md`). Adopted return choice 1 — typed
  rendered items — and re-refused choice 3. Added: §4.3 derived producers/projections with
  `derivation.inputs` and the law-8 corollary (derivation composes evidence, never judgement);
  the thirteenth error family `EVIDENCE_DERIVATION_WIDENS`; planes `record`/`derived` and
  grounding `recorded_run`; §6.1 rendered items, the branded `ConsumerEvidenceView`,
  `renderedEvidenceItems`, deletion of `EvidencePacket.sentences`, and the red-first sentinel
  fixture ([[D662]]/[[D666]]); §9 clause 6 and `pack.authored.phase@1` ([[D665]]); §10.2
  `run.record` plus derived compare/story declarations and the twenty-five-operation census
  (`guidance.voice_compare@1`, `guidance.voice_story@1`); §12.1 reasoning-review typed
  non-evidence contract ([[D663]]); implementation areas 15–16; criteria 1, 2, 7 and 11 amended
  and 21–26 added; discharges D6–D9. Contract types amended in place under RFC-0000 rule 3 (the
  RFC is implementing, not implemented; the checkpoint branch has not merged).
- 2026-08-21: adversarial cross-review of the author-return amendment. The rendered layer is now
  sealed too: an unbranded `RenderedEvidenceItem[]` was the [[D662]] side channel reborn inside
  the item — an ad-hoc `{ evidence, sentences }` literal would have widened provider input and
  the checker together, fully typechecked. `RenderedEvidenceView` is brand-constructed by the
  sole runtime constructor, the brand is a runtime symbol property asserted by `voiceCheck` and
  the provider-body assembly (closing the `as`-cast forge), and criterion 22 gains both forge
  fixtures; the exported-`declareEvidence` payload-fabrication residual is named rather than
  hidden. §10.2's derived-story inputs were re-derived at the symbol and corrected:
  `derived.story.rank@1` declared (the title, the story screen's top-8 selection, `/story` and
  the shared page all consume it; its inputs include the pivotal and shape projections the
  title's list omitted), `derived.story.last_level@1` gains `run.record.imported_result@1` (its
  learner-lost gate reads the result tag), the title re-pins to the rank, and its White-relative
  verb convention is registered explicitly. The deterministic Review surfaces (`review.story@1`,
  the compare strips) are named as gaining the §10.2 projections at stage 2 so criterion 7's
  admission cannot silently drop learner-visible content. §4.3's empty-inputs error code aligned
  with criterion 25 (`EVIDENCE_PROJECTION_INCOMPLETE`); §4.3 gains the orientation-parameter
  rule; criterion 26's "no base-packet projection" corrected to "no base-packet item"
  (`rules.pivotal.marker` legitimately sits in both accept sets); criterion 7/§15 admit the
  sealed rendered view at entrypoints; Open-questions garbled residue repaired.
