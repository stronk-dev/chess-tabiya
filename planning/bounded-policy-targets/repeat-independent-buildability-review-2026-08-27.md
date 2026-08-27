# Exact bounded material targets — repeat independent buildability return

**Reviewed:** 2026-08-27

**Reviewer:** codex

**Document:** `rfc/bounded-policy-targets.md` after the 2026-08-27 local-layer amendment

**Verdict:** **RETURNED.** Narrowing the RFC to the exact local layer is the correct landing
boundary, and the D1023 population result remains useful. The amended declaration image, source
chronology and operation result types are not yet buildable.

## Method

This pass did not inherit the prior provider-focused return. It checked the amended three-row
contract against the current F1 compiler, exact source adapters, threat/pass convention, legal-move
authority and the executable D1023 algorithm. The disposable D1652 repair harness now includes the
literal amended declaration image and a source-versus-passed-position control. It passes 11/11,
including two negatives which demonstrate the current blockers.

The following parts survive:

- target identity remains a local derived fact, not a Stockfish/Maia source field;
- the exact immediate, exists-exists and exists-for-all-defences facts remain separate;
- provider receipts and consumer policy correctly remain outside this RFC;
- all three initial dispositions remain `inspector_only` rather than licensing a raw learner dump;
- the 25,000-position cap, terminal distinction and permanent destination negative remain required.

## Blocking findings

### 1. The literal F1 image does not compile ([[D1904]])

The amended RFC declares `named_material_target@1` and `immediate@1` as
`position_rules / exact`. Their source authorities do not have that strength:

- `rules.tactic.consequence.threat@1` is `declared_convention / convention`;
- `rules.exchange.predicate.legal_exchange@1` is `declared_convention / convention`;
- `rules.mobility.reading.legal_moves@1` is `position_rules / exact`.

`compileEvidenceManifest` correctly rejects the first derived row for widening both grounding and
exactness. If the first row is repaired to inherit convention grounding/exactness, the second row
must also conservatively inherit the mixed/convention path. The new harness test transcribes all
three normative rows and receives `EVIDENCE_DERIVATION_WIDENS`. Criterion 2 is therefore red at the
literal checkpoint; prose cannot call these facts exact while their legal-exchange meaning remains
a declared local convention.

Repair by publishing rows whose grounding/exactness truthfully inherit the inputs, or by defining
and reviewing a different exact rules authority. Do not weaken the compiler.

### 2. The sealed source chronology cannot validate the candidate legal map ([[D1905]])

`threats(sourceFen)` flips the turn and clears en-passant before enumerating the opponent capture.
`ThreatResult` retains neither `sourceFen` nor the passed FEN. Its embedded
`LegalExchangeResult.beforeFen` is the **passed** opponent-turn position. `NamedMaterialTarget`
retains only that `passedFen`.

The candidate and `legal_moves@1` item, however, belong to the original learner-turn source
position. That original FEN is absent from both retained target inputs and is not reconstructible:
turn was flipped and en-passant was intentionally erased. In the harness control the target's
retained FEN is Black-to-move, the legal candidate map is White-to-move, and the sealed threat has
no `fen` field at all.

Consequently criterion 4's wrong-position refusal has no truthful equality to check. Add the exact
source FEN to the threat source authority (with its own adapter/catalogue amendment), or retain a
separate declared source-position authority in the derivation. A caller-supplied unsealed FEN is
not a repair.

### 3. Budget exhaustion has no closed operation result ([[D1906]])

`BoundedTargetReturn` always contains both booleans. The prose says a capped traversal emits
`budget_exhausted` and that no partial boolean escapes, while the request/operation signature says
only that `derive()` returns sealed derived items. It publishes no result union, no abstention
receipt and no adapter return for the capped arm.

The research harness has a distinct `kind: "budget_exhausted"`, but it also carries partial
booleans; copying that shape into the declared payload would violate the RFC's own refusal. Define
one closed operation result such as declared evidence versus typed abstention, name what evidence
and visited count the abstention may retain, and make it impossible to seal a
`bounded_return@1` payload on cap. Criterion 8 must test the production return type, not only the
search helper.

### 4. The result/cause relation contradicts the identity rule ([[D1907]])

Section 2.1 says that when either tracked piece ceases to be the same piece, the later result is
`identity_lost`. Section 2.2 says `attacker_captured` pairs only with `result: "removed"`. Capturing
the tracked attacker is exactly a case where that tracked piece ceases to exist, and the executable
D1023 algorithm currently returns `removed/attacker_captured`.

Choose one exhaustive precedence rule and state it literally. A useful distinction may be an
observed capture of the tracked attacker versus unexplainable identity loss/replacement, but that
distinction must live in the type and fixtures. Criterion 6 cannot enumerate “every legal
combination” while the governing prose defines the same position twice.

### 5. The normative operation type names a type that does not exist ([[D1908]])

`DeclaredEvidenceItem` appears in the payload and request snippets, but no such type exists in the
runtime. The real sealed type is `DeclaredEvidence<T>`. Leaving every input unparameterized also
removes compile-time projection/payload distinctions from the operation boundary; only runtime id
checks would remain.

Publish literal aliases or exact generic input types for threat, legal exchange, legal moves and
each derived payload, plus the closed output/abstention union. Criterion 11 should compile the
normative signatures verbatim and fail on swapped input projections.

### 6. `local/sync` has no measured production cost gate ([[D1909]])

D1023 measured visited-position counts, not elapsed local runtime. Normal maxima already reach
2,527 visited positions and the RFC permits 25,000 for one target/candidate. Support, Review and bot
consumers can multiply that across legal candidates and targets. Declaring the operation
`local/sync` without a per-call and whole-set latency budget recreates the execution-budget defect
at a smaller layer, even though learner bindings are initially absent.

Add a production-symbol cold/warm latency census over the fixed populations and cap fixture. State
whether `sync` means safe on the request thread, and give downstream consumers a declared
per-position multiplication bound. If it is not interaction-safe, declare a truthful execution
class before any module or bot binding.

## Required amendment order

1. Repair the literal F1 grounding/exactness rows and make their compilation a real test.
2. Preserve an exact original source-position authority across the threat pass convention.
3. Publish typed sealed inputs and one closed evidence/abstention output union.
4. Resolve identity-loss versus observed-capture precedence and fixture the full relation.
5. Measure production-symbol local cost and declare per-call/whole-set execution bounds.
6. Re-run the D1023 census through those production symbols, then repeat independent review.

No owner ruling is required. No production, schema, content or protected design byte changed in
this review.
