# RFC: Semantic claim anchors

- **Status:** draft 2026-08-23 — bounded follow-up to the implemented claim-backing contract;
  ready for independent cross-review after the in-flight F3 capability RFC supplies its literal
  compatibility declaration syntax
- **Author:** codex, on the owner's foundation-first continuation instruction and D1008 research
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md` §3b (validated patterns, never invented
  recommendation), §5 (detection versus significance); `design/03-product-breadth.md`
  §Intelligence and explanation; ADR-0005 / AGENTS law 8
- **Exploration gate:** opened by the 2026-08-23 D1008 research verdict in
  `planning/exploration/log.md`; evidence is
  `design/research/claim-semantic-anchors.md` plus the executable D1007/D1008 falsifier
- **Depends on:** the F1 compiled evidence contract (`rfc/archive/evidence-contract-manifest.md`)
  and its sealed renderer amendment; the in-flight F3 semantic-capability contract described by
  `planning/platform-alignment/f3-derivation.md` must land or provide its final declaration syntax
  before this RFC can be accepted
- **Parent / amends:** `rfc/archive/claim-backing.md`; narrows the machine-backed admission path
  without changing authored-principle provenance
- **Supersedes / superseded by:** —
- **Planning:** `planning/claim-semantic-anchors/` (once implementing)

```tabiya-claims
none
```

**Why `none`:** this draft claims no pack schema, run schema, shape-entry schema,
principle-entry schema, `EVIDENCE_KINDS` member, or storage migration. Its projection and renderer
ids are catalogue-local under the implemented F1 machinery. The evidence-ledger compatibility
declaration is deliberately written in §7 as an F3 seam, not as an invented seventh register.
Refresh this block if F3's accepted contract makes that seam a registered resource.

## Summary

The implemented claim binder can prove that a word equals a recorded value without proving what
the word means. Its only automatically discovered validator-green candidate binds *one* in “the
one common mate” to DTM 1. This RFC removes arbitrary token matching as a machine-backing licence.
A machine-backed clause becomes a full selected clause whose meaning is an ordered tuple of typed,
compiled evidence facts and whose exact learner-visible bytes are produced by one registered
deterministic clause renderer. Authored clauses remain separately attributed. The one committed
legacy binding migrates explicitly; all other arbitrary prose stays unbound until an author reviews
a rewrite. No LLM participates in admission.

## Motivation

Feedback Delivery Stage 2 is commissioned but stopped. The first executable audit found only one
validator-green candidate among 43 record-kind co-presence rows, and that one is semantically false
(`design/BACKLOG.md` D1007/D1008). Continuing with token heuristics would turn coincident values
into “grounded” content and then distribute that false authority to Support, Review, voice, social
stories and later player analysis.

The current implementation already has the right two surrounding systems:

- claim text identity, pack reachability, evidence records and authored-principle attribution in
  `apps/server/src/sourcing/claim-binding.ts`; and
- typed projection admission plus sealed registered rendering in
  `packages/runtime/src/evidence-contract.ts`.

The missing system is the join between them. This RFC adds only that join.

**Out of scope:** new chess collectors; new evidence kinds; grading; hint selection; module layout;
LLM prompting or retrieval; bulk claim authoring; the 60 explorer fetches; graduation transitions;
and any rule for deciding strategic significance. This contract says what a machine clause means,
not whether it is a useful thing to tell the learner.

## Specification

### 1. Vocabulary: fact, proposition, clause, binding

A **claim fact** is one admitted F1 projection evaluated from evidence records already present in
the pack's ledger. The projection identity supplies the predicate and object domain; typed arguments
supply subject and qualifiers. A fact never contains learner prose.

A **claim proposition** is a non-empty ordered tuple of claim facts. Tuple order is semantic and
renderer-visible. It allows one clause such as a position result plus piece count without joining
sentences in unsealed caller code.

A **machine clause** is exactly one registered deterministic rendering of one proposition. An
**authored clause** is explicit prose attributed under the existing principle/citation rules. A
**claim binding** partitions all non-whitespace bytes of one feedback claim into ordered,
non-overlapping machine and authored clauses.

### 2. Closed data shapes

The server replaces the loose `ClaimAssertion`/`ClaimSpan` production shape with these structural
equivalents (names may follow local style; fields and invariants are normative):

```ts
interface ClaimClauseSelectorV1 {
  readonly start: number;
  readonly end: number;
  readonly exact: string;
}

interface ClaimFactRefV1 {
  readonly projection: VersionedEvidenceId;
  readonly args: ClaimFactArgs; // closed discriminated union keyed by projection.id/version
}

type ClaimClauseV2 =
  | {
      readonly selector: ClaimClauseSelectorV1;
      readonly proposition: {
        readonly facts: readonly [ClaimFactRefV1, ...ClaimFactRefV1[]];
        readonly renderer: VersionedEvidenceId;
      };
    }
  | {
      readonly selector: ClaimClauseSelectorV1;
      readonly authored: true;
    };

interface ClaimBindingV2 {
  readonly contract: { readonly id: "claim.binding"; readonly version: 2 };
  readonly claimId: string;
  readonly pointer: string;
  readonly textSha256: string;
  readonly clauses: readonly [ClaimClauseV2, ...ClaimClauseV2[]];
}
```

`ClaimFactArgs` is not `Record<string, unknown>`. It is a discriminated union whose member for
each Appendix-A projection has the exact required/optional key set and literal selector values.
Unknown keys, missing keys, projection/version mismatch and wrong argument types fail structural
validation before any record lookup.

Selectors use Unicode code-point offsets. `start >= 0`, `end > start`, and `exact` must equal the
claim slice at those offsets. The claim digest remains the first drift fence. Clauses must be in
ascending order, must not overlap, and together must cover every non-whitespace code point of the
claim. Punctuation belongs to one adjacent clause. The old unique-substring search and the
`segments()` heuristic are removed from production validation.

### Appendix A — Canonical claim-fact projections

One canonical list in `packages/runtime/src/evidence-catalog.ts` replaces
`CLAIM_ASSERTION_KINDS`; the server imports the typed identities instead of copying strings. The
table's unit is **one currently supported claim assertion meaning**; total **15**, set-equal to the
15 members shipped by `CLAIM_ASSERTION_KINDS` at drafting HEAD.

| Projection id (all version 1) | Typed args | Source projection / retained object |
|---|---|---|
| `sourcing.claim.tablebase.category` | `{fen}` | tablebase record / learner-relative category |
| `sourcing.claim.tablebase.dtm` | `{fen}` | tablebase record / signed DTM domain |
| `sourcing.claim.tablebase.dtz` | `{fen}` | tablebase record / signed DTZ domain |
| `sourcing.claim.tablebase.piece_count` | `{fen}` | tablebase record / integer pieces |
| `sourcing.claim.tablebase.move_category` | `{fen,uci}` | successor tablebase / SAN + category |
| `sourcing.claim.tablebase.line_uniform_category` | `{fens}` | exact authored line / category + count |
| `sourcing.claim.tablebase.move_census` | `{fen,select}` | complete legal successors / selected + total count |
| `sourcing.claim.tablebase.unique_move_of_category` | `{fen,category}` | complete legal successors / SAN + category |
| `sourcing.claim.engine.centipawns` | `{fen}` | engine record / cp + perspective + depth |
| `sourcing.claim.engine.depth` | `{fen}` | engine record / depth + engine identity |
| `sourcing.claim.explorer.total` | `{fen}` | census / total + population qualifiers |
| `sourcing.claim.explorer.score_pct` | `{fen,side}` | census / percentage + side + population |
| `sourcing.claim.explorer.move_share_pct` | `{fen,san}` | census / SAN, UCI, percentage + population |
| `sourcing.claim.explorer.window` | `{fen,select:"since"|"until"}` | census / boundary + population |
| `sourcing.claim.explorer.rating_band` | `{fen}` | census / min/max rating + population |

Every projection declaration names semantics, operands, grounding, exactness, limitations and its
raw sourcing dependency under F1. `authoring.claim_binding@1` stops accepting raw
`sourcing.ledger.*` projections and accepts only `sourcing.claim.*` projections. A source record
cannot therefore bypass proposition evaluation merely because its kind is admitted.

Evaluation preserves the current reachability, unique-record, complete-census, authored-line and
learner-relative-category rules. It additionally retains every qualifier needed to interpret the
object: side/perspective, population, window, rating band, engine identity/depth and selected
category. A renderer cannot read a ledger or pack directly.

### 4. Registered proposition renderers

The runtime adds a small sealed grouped-rendering primitive beside `renderEvidenceItems`:

```ts
interface ClaimClauseRendererDeclaration {
  readonly id: string;
  readonly version: number;
  readonly accepts: readonly [VersionedEvidenceId, ...VersionedEvidenceId[]];
  readonly render: (facts: ConsumerEvidenceView) => string;
}

function renderClaimClause(
  admittedFacts: ConsumerEvidenceView,
  renderer: VersionedEvidenceId,
): RenderedClaimClause;
```

The registry compiler proves the admitted facts' ordered projection tuple is set-and-order equal
to the renderer declaration. `renderClaimClause` returns a brand-sealed value not constructible by
callers. The renderer returns exactly one non-empty string. The server compares that string byte
for byte with `selector.exact`; no normalization, token equivalence, stemming, number-word
conversion or LLM judgement is permitted.

The initial registry contains one single-fact renderer per Appendix-A projection plus these
compound tuples needed by real authored prose:

| Renderer | Accepted ordered facts | Canonical output |
|---|---|---|
| `claim.clause.tablebase.position_summary@1` | category, piece count | `This exact position is a tablebase {category} (Syzygy, {n} pieces).` |
| `claim.clause.engine.reading@1` | centipawns, depth | `The engine records {signed-pawn-eval} at depth {depth}.` |
| `claim.clause.explorer.move_population@1` | move share, rating band, window | `{SAN} appears in {share}% of the recorded {min}–{max} games from {since} to {until}.` |

Single-fact outputs use fixed, source-naming sentences defined beside the registry and snapshot
tested. They may hide FEN from learner text because the subject remains in the proposition; they
may not hide a population or engine depth when omission would widen the fact. Changing output
bytes or semantics requires a renderer version bump under F3 and a dry-run over bound clauses.

### 5. Validation algorithm

For each `ClaimBindingV2`, validation runs in this order:

1. resolve pointer/id/text digest and structural shape;
2. validate selector order, exact slices and complete non-whitespace coverage;
3. validate each fact reference against the canonical typed union;
4. apply the existing pack-scope and evidence-record rules;
5. declare each evaluated fact through F1 and admit it only to `authoring.claim_binding`;
6. compile the ordered proposition against its registered renderer;
7. render the sealed clause and require byte equality with the selected clause;
8. require every authored clause to satisfy the existing `author_principle` label and principle
   resolution rules;
9. earn machine labels from the validated fact projections, never from record-kind co-presence;
10. expose the original claim text to delivery only after all clauses pass.

Any failure rejects the whole binding. There is no partially admitted machine claim. Diagnostic
issues name the clause index, fact index, projection and record anchor; they never substitute an
authored fallback.

The old `MACHINE_TOKEN`, `wordNumber`, `normalizes`, substring-occurrence and inferred `segments()`
paths are deleted from production admission. A disposable migration tool may read the old shape;
the server registry may not.

### 6. LLM and consumer boundary

The original feedback claim remains the deterministic learner-visible source for Feedback
Delivery. An optional LLM may later paraphrase only a sealed rendered proposition through the
existing bounded voice path. It may not:

- infer a `ClaimFactRefV1` from prose;
- choose or reorder proposition facts;
- select a renderer;
- decide clause equality or entailment;
- add strategic significance, a move grade or a recommendation; or
- retrieve outside the admitted evidence view.

Authoring tools may show a proposed canonical rewrite. Applying it is an explicit content edit,
not an automatic binding.

### 7. Compatibility and migration

The landing has two atomic stages:

**Stage A — mechanism:** land the canonical projections, grouped renderer seal, V2 parser/validator,
dry-run migration planner and negative fixtures on the implementation branch. The one known legacy
binding continues through its existing path only until Stage B; no new legacy binding may be added,
and Stage A is not independently releasable.

**Stage B — one-binding content migration:** rewrite
`philidor-third-rank-hold/philidor-is-drawn` into registered canonical clauses, replace its ledger
binding with V2, re-stamp the pack digest, run the complete corpus dry-run, and delete the legacy
production parser in the same commit. Because this changes pack content, Stage B follows the
content-wave closeout: flip its ledger rows and append `planning/content-era/log.md` in the commit.

F3 must supply the accepted compatibility declaration that distinguishes the old and new binding
semantics while the top-level evidence sidecar remains `tabiya.sourcing.evidence.v1`, or require a
top-level move. This RFC does not choose a competing syntax. Acceptance is blocked until §7 can
name the literal F3 declaration and refusal behavior.

The migration planner scans the server-defined full sidecar population. It reports legacy, V2,
unbound and invalid documents separately. It may auto-propose V2 only when a complete existing
clause is byte-equal to a registered renderer output. It never writes arbitrary prose and never
uses an LLM. Apply mode requires an explicit file list and is all-or-nothing.

### 8. Failure codes

The implementation adds typed, stable issue codes for at least:

- `CLAIM_CLAUSE_RANGE_INVALID`
- `CLAIM_CLAUSE_COVERAGE_INCOMPLETE`
- `CLAIM_FACT_PROJECTION_UNKNOWN`
- `CLAIM_FACT_ARGS_INVALID`
- `CLAIM_PROPOSITION_RENDERER_UNDECLARED`
- `CLAIM_PROPOSITION_INPUT_MISMATCH`
- `CLAIM_CLAUSE_RENDER_MISMATCH`
- `CLAIM_BINDING_VERSION_UNSUPPORTED`

Existing FEN, record, census, label and principle errors remain. No new error is a warning for a
published pack.

## Deviations from design

None. This is a foundation repair implementing law 8 and the existing F1 evidence separation. It
does not add a learner surface or change assistance policy.

## Acceptance criteria

1. The canonical claim-fact projection list is set-equal to Appendix A (15/15), and the old
   `CLAIM_ASSERTION_KINDS` definition has zero production occurrences.
2. Every fact argument variant is exact-key validated; one missing, one extra and one wrong-typed
   field fail for every family (tablebase, engine, explorer).
3. The exact D1008 fixture—“the one common mate” paired with DTM 1—fails with
   `CLAIM_CLAUSE_RENDER_MISMATCH`.
4. A right predicate/value at the wrong FEN, and a right record kind with the wrong qualifier, each
   fail before rendering.
5. A right proposition paired with an arbitrary unregistered paraphrase fails automatic binding.
6. A provenance/record reference with no typed proposition cannot inhabit `ClaimClauseV2` and
   fails the raw-JSON validator.
7. Changing a renderer or projection version makes the previous binding fail closed or appear in
   the explicit F3 migration plan; no “latest” lookup exists.
8. Positive fixtures bind one tablebase, one engine and one explorer proposition and pass the same
   facts through authoring validation plus one learner-facing compiled consumer without a raw
   packet-sentence side channel.
9. A compound renderer fails when inputs are permuted, omitted, added or substituted with a raw
   sourcing projection.
10. Clause ranges cover all non-whitespace claim bytes exactly once; overlap, gaps, drift and
    Unicode code-unit/code-point confusion each fail.
11. The existing Philidor binding is the only legacy binding at Stage-A HEAD; Stage B leaves zero
    legacy bindings and preserves one admitted `philidor-is-drawn` claim.
12. The corpus candidate audit still reports the 43 legacy candidates as unbound; no heuristic
    attachment occurs during migration.
13. `make sourcing-check`, `make expression-census`, `make verify`, `make test-browser`,
    `make register-check`, `make status-parity` and `make work-index` pass after Stage B.
14. The implementation updates `docs/claim-backing.md`, the RFC register, D1007/D1008, Feedback
    Delivery's log, the exploration log and the content-era log in their owning commits.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Name the literal F3 capability/version declaration and top-level ledger compatibility rule | `planning/platform-alignment/` | the F3 RFC refresh commit | |
| D2 | Resume Feedback Delivery Stage 2 only after Stage B and the six negative fixture classes pass | `feedback-delivery` | the resumed Stage-2 content commit | |

## Open questions

None for product intent. D1 is a dependency syntax seam, not an owner choice: refresh this draft
against the accepted F3 contract and return it if the required representation cannot be expressed.

## Changelog

- 2026-08-23: created from D1008's code/standards research; proposition-first binding, grouped
  registered rendering, whole-clause equality and one-binding migration specified.
