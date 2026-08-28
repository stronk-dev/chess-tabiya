# Semantic-convention value authority

**Date:** 2026-08-27
**Question:** Can the convention RFC bind one derived evidence value to the exact inputs and
derivation member that produced it, and can every live instance convention operand be validated
before sealing?
**Feeds:** D1921–D1926, D1934–D1937; `rfc/semantic-convention-provenance.md`;
`rfc/recorded-semantic-path.md`

## Method

`tools/d1921-semantic-convention-review-harness/semantic-convention-contract.test.ts` is a
disposable exploration instrument. It retains the six live-boundary falsifiers from the independent
review and adds executable candidates rather than changing runtime code. The candidate is tested
against spread/JSON forgery, alternative derivation paths, missing/extra/ambiguous inputs, repeated
projection instances, all current convention-operand shapes and the manifest-derived population of
instance-varying projections. `[V]`

The population is derived from `PRIMARY_EVIDENCE_MANIFEST`: a projection is instance-varying when
one of its declared operands names a convention identity under the D1722 grammar. The extractor
catalogue is compared set-for-set with that population on every extraction. `[V]`

Command:

```sh
pnpm exec vitest run --config tools/d1921-semantic-convention-review-harness/vitest.config.ts
```

Result after the persistence/limitation/history extension: **21/21 passing** on 2026-08-27. `[V]`

## Findings

### 1. A value receipt must identify both the declared route and the concrete inputs

The current semantic compiler reduces `derivationInputs` to a set of projection refs before it
selects an `anyOf` member, and its event id includes only that projection set for alternatives.
Input payload identity and repeated inputs of one projection are absent from the identity
(`packages/runtime/src/semantic-evidence.ts`, `compileSemanticEvidenceEvent`). `[V]`

The candidate closes the two different questions separately:

- `member` is the canonical, sorted exact-ref identity of the uniquely selected declaration member,
  never a caller-controlled array index; and
- `inputs` is a canonical multiset of every sealed input's exact producer/projection/payload digest.

Two identical output payloads produced through `fixture.source_a@1` and
`fixture.source_b@1` consequently have different receipts and different inherited convention
closures. Reversing input order preserves the receipt; two distinct values of one projection remain
distinct; supplying the same value twice retains multiplicity. Missing, extra and ambiguous member
selection fails. `[V]`

A WeakSet-backed runtime seal rejects object spread, JSON round-trip and double-cast-shaped plain
objects. The candidate constructs the evidence/receipt wrapper in one compiler-owned operation;
there is no post-freeze attachment step. `[V]`

**Contract consequence:** the production receipt needs a canonical member key plus exact input
value identities. `path: number` is insufficient and order-sensitive. Convention closure is the
union of the exact inputs actually used plus the output's declared direct/instance refs; unused
alternative paths contribute nothing. `[V]`

### 2. There are fourteen live instance-varying projections, not three

The review named three *shapes*. The manifest-derived population contains **14 projections**:

- twelve single-string identities: material role reading/event, harassment pressure, defender
  exposure, legal exchange, piece destinations, candidate majority, development, space, threat,
  back-rank susceptibility and trapped piece;
- one two-string identity: king-zone plus king-shelter; and
- one structured identity: grade `{id, version, context}`, where `context` remains a validated
  non-identity operand rather than becoming a pseudo-ref.

The executable catalogue is set-equal to this population. Removing an extractor or adding an
unowned one fails before an operand is admitted. Every exact ref is checked against the compiled
registry; absent, broad, version-zero, malformed, unregistered and invalid grade-context values
fail. `tools/d1921-semantic-convention-review-harness/semantic-convention-contract.test.ts`. `[V]`

**Contract consequence:** D1922 cannot close with three example validators. The projection
declaration names instance operands; a typed extractor catalogue owns their value grammar and must
be set-equal to every instance-varying projection compiled from the manifest. `[V]`

### 3. The shared “exact” adapter is not exact

`exactObject` compares the manifest's operand list with its hard-coded required list and checks that
the payload contains every required key. It never rejects additional payload keys
(`packages/runtime/src/evidence-source-adapters.ts:18-29`). A fixed projection can therefore carry
an undeclared `conventionId: "unregistered@999"`; the same channel can retain arbitrary caller data.
This is D1934, a broader exact-adapter defect rather than only a convention-extractor issue. `[V]`

The candidate requires sorted payload-key equality before any value extractor or evidence seal.
Both an undeclared convention ref and an unrelated extra field fail; the exact key set passes.
`tools/d1921-semantic-convention-review-harness/semantic-convention-contract.test.ts`. `[V]`

### 4. The initial 39 meanings can be recovered without inventing chess prose

The stable membership seed is joined against the live manifest, convention-bearing operands and
literal implementation/catalogue witnesses. The published result is
`planning/semantic-convention-provenance/initial-declarations.json`: **39/39** members have a
definition, one or more mandatory limitations and at least one resolvable source witness; the
declaration and membership sets are exactly equal. The disposable D1923 harness fails on missing or
extra members, blank clauses, unresolved projections, missing source files and absent symbol
fragments. Result: **4/4 passing** on 2026-08-27. `[V]`

The join found two seed defects before publication. `mover-turn-ep-cleared@1` and
`race-arrival@1` were classified as shipped identities but their seed witnesses did not contain the
literal refs; the stable seed now names the actual implementation/catalogue bytes and the harness
keeps that distinction executable (D1935). `[V]`

It also refuted the RFC's original authority union. Bounded search, recorded-run semantics and
deterministic Story composition are shipped contracts, but they are neither position-rule
implementations nor owner product rulings. The migration therefore uses a checked
`landed_contract` authority over exact witnesses at immutable snapshot `62a5731f`. It can recover an
existing meaning but cannot authorize new chess truth (D1936). `[V]`

### 5. Durable resealing needs a trusted origin, not another unkeyed digest

The live `evidence.attached` event persists engine-style `payload` bytes and reference strings. It
does not persist the sealed semantic payload/input graph, and the run has no signed event hash
chain (`packages/runtime/src/types.ts`, `schemas/drill_run.schema.json`). A loader can therefore
check that an unkeyed receipt digest agrees with caller-supplied bytes, but a caller can alter an
input value digest and recompute the outer digest. That proves consistency, not that the evidence
compiler originally sealed it (D1937). `[V]`

The disposable candidate signs the canonical persisted envelope with an Ed25519 origin key. Load
verifies the signature before historical-registry/member checks and runtime resealing. Ref/input
mutation still fails after every unkeyed digest is recomputed; an unknown origin fails typed; a
JSON-round-tripped genuine v1 receipt reseals against retained history after a v2 head exists.
Legacy absence returns an empty history rather than manufactured provenance. The candidate also
proves deterministic limitation assembly and append-only same-version/reorder/delete negatives.
`tools/d1921-semantic-convention-review-harness/semantic-convention-contract.test.ts`. `[V]`

The signature establishes unchanged bytes from a trusted installation compiler, not universal
trust in an arbitrary export signer. A cross-install import therefore needs an explicit public-key
fingerprint trust action or must keep convention history unavailable. `[M]`

## Verdict

**D1921 and D1922 are author-buildable, with D1934 inside the same implementation boundary.** The
proved shape is one compiler-owned source/derived value seal, canonical exact-input receipts, a
typed extractor catalogue set-equal to all fourteen applicable projections, and exact adapter-key
equality. No chess judgement is needed for those mechanics. `[V]`

This result does **not** make the product RFC acceptable by itself. The process predecessor and
repeat independent review still block it, and production implementation must discharge the full
schema/save/reload/export/delete matrix. No production or protected-design byte changed in this
pass. `[V]`
