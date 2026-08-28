# Pack-capability contract — repeat independent buildability review

- **Reviewed:** 2026-08-28
- **Input:** `rfc/pack-capability-contract.md` after the [[D1620]]–[[D1626]] author amendment
- **Reviewer:** codex
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Executable reproduction:** `make pack-capability-repeat-review` — 11/11
- **Production status:** untouched; lane 0.30 and corpus application remain forbidden

The previous seven-blocker amendment is materially better. It separates semantic disposition from
deployment health, defines token-based symbol/arm images, preserves D566 as the decisive regression,
uses a planner/applier split, retains the D560 hold and replaces several copied counts with checked
roots. Those decisions survive this review.

The document is still not buildable without the implementer choosing public grammar, versioning,
registry population, schema integration and lifecycle authority. The repeat-review harness encodes
eleven independent counterexamples against the amended bytes. Its green result means the blockers
are present and reproducible; it is a review instrument, not an implementation test.

## B1 — the namespace rejects its own inventory ([[D1982]])

`CapabilityId.id` is described as “dotted, lowercase,” but normative identifiers include
`structuralFeature.outpost` and `error.SIMULATE_BUDGET_EXCEEDED`; shipped format identities also use
colon separators. There is no regex or parser contract. An implementation must either reject the
RFC inventory or silently widen the declared grammar.

**Required repair:** publish one exact id grammar, migration map and typed parser. Cross accepted
dotted ids, every retained mixed-case/colon legacy family and version-suffix rejection.

## B2 — resolved semver cannot inhabit the capability version field ([[D1983]])

The public `CapabilityId.version` and lane-0.30 requirement schema require an integer. §2.6 assigns
generated `shape.<id>` and `principle.<id>` capabilities the referenced entry's structured semver.
Those schemas and committed documents use semver strings such as `0.1.3`. No encoding or mapping is
specified, and coercing this to one integer loses identity.

**Required repair:** publish one version algebra shared by registry keys, pack requirements and
resolved artifacts. It must round-trip both current integer ids and structured semver without an
unversioned conversion convention.

## B3 — the complete applicability authority is still absent ([[D1984]])

The amended RFC declares a `CAPABILITY_APPLICABILITY` type and four minimum fixture rows. No
normative complete table maps the schema/default/reference population. The disposable D1620 harness
also hard-codes only those four examples and does not implement the RFC-6901 wildcard grammar. Thus
criterion 3 still asks the implementer to author the authority that its set-equality check is meant
to verify.

**Required repair:** publish the complete executable mapping or an independently checked source
from which it is generated. Every schema/named root must map or carry an explicit exclusion, and
the graph itself must participate in the digest.

## B4 — the F1 manifest cannot satisfy F3's declaration shape ([[D1985]])

Every F3 `CapabilityDeclaration` requires at least one `CapabilitySite` and one semantics digest.
F1's `ProjectionDeclaration` carries neither. Its manifest digest seals a different declaration
image; it is not a producer-AST site digest. Saying 193 projections are absorbed by `{id,version}`
reference therefore cannot construct the required F3 declarations.

**Required repair:** define and test the generated F1→F3 bridge, including exact sites, semantic
digest authority, subject and dependencies; or publish a subject-specific declaration algebra that
does not pretend all projections have the same site contract.

## B5 — existing refusals lack lawful migration authority ([[D1986]])

`CAPABILITY_DISPOSITIONS` contains 17 refused rows and `FORMAT_DISPOSITIONS` contains 3. Neither
source carries `ruledBy`, while the new semantic type and criterion 10 require every refusal to name
a resolving ⚖ ledger row. The RFC supplies no row mapping. Several reasons are absence of a product
question or authorized surface, not an owner ruling an implementer may manufacture.

**Required repair:** author-review all 20 rows and publish a total mapping to existing rulings. If
some are research gaps, unsupported deployment choices or unanswered decisions, represent those
states honestly instead of laundering them into `refused`.

## B6 — mandatory annotations break both strict schema compilers ([[D1987]])

§3.1 mandates `x-tabiya-capability` or `x-tabiya-capability-excluded` on every closed vocabulary.
Both the schema package test and production pack validator construct AJV 2020 with `strict:true`.
Neither registers these keywords, and a direct compile control throws `unknown keyword`.

**Required repair:** name one shared AJV factory or meta-schema extension, define schemas for both
annotation values and route every pack-schema compiler through it. Invalid and misspelled
annotations must fail distinctly rather than being ignored.

## B7 — criterion 15 creates an RFC dependency cycle ([[D1988]])

F3 criterion 15 imports Stage-A/Stage-B dispatch and `CLAIM_BINDING_VERSION_UNSUPPORTED` from
`claim-semantic-anchors`. That RFC is draft and explicitly cannot be accepted until F3 supplies its
final syntax. F3 does not list it as a dependency. Implementing criterion 15 would therefore depend
on an unaccepted consumer contract, contrary to law 1.

**Required repair:** keep only the structured compatibility primitive and compile-time handoff in
F3, then let the subsequently accepted consumer RFC own dispatch and migration; or break and record
a different explicit acceptance order.

## B8 — several normative roots are not representable sites ([[D1989]])

`CapabilitySite` selects a named declaration or a string-equality arm. The literal root inventory
names a property (`GRADE_CONVENTION.constants`), unnamed material/range thresholds, several phase
constants, an inline `.slice(0, 4)` practical-resistance limit and “registered R2 selection
constants.” Those are not named declarations and are not discriminant arms.

**Required repair:** refactor every semantic root to an exact named symbol before listing it, or
widen the site selector with canonical AST forms and zero/multiple-match failures. The inventory
must contain literal representable records, not prose locations.

## B9 — the declaration and criteria use incompatible disposition types ([[D1990]])

`CapabilityDeclaration` refers to undefined `CapabilityDisposition`. §5 defines
`SemanticDisposition` with `active`, `deprecated`, `withdrawn`, `refused`, `unmeasured` and
`impossible`. §4.3 and criteria 2/9 still require declaration rows with `reached`, a legacy source
value absent from the new type.

**Required repair:** use one semantic declaration type throughout. Keep `reached` only as input to
the explicit legacy→semantic projection; rewrite module invariants and fixtures against the new
arms.

## B10 — resolved-reference closure stops at content bytes ([[D1991]])

The generated shape/principle capability digest covers referenced content bytes and version, but
§2.6 does not derive dependencies from the semantic expressions inside that content.
`maroczy-bind` embeds an `outpost` feature. A helper-only outpost evaluator change can therefore
leave `shape.maroczy-bind` unchanged when a pack stamps only the resolved shape capability.

**Required repair:** parse semantic expressions in every resolved shape/principle into explicit
capability dependencies and include their closed digests. Reproduce D566 through a pack that reaches
outpost only through a referenced shape.

## B11 — `requires` has no canonical artifact encoding ([[D1992]])

Derivation sorts a unique set and acceptance checks set equality, but the proposed schema says only
that `requires` is an array of closed `{id,version}` objects. It declares neither duplicate refusal
nor canonical ordering. Reordering or duplicating an equivalent requirement can therefore validate
while changing `digestDrillPack`.

**Required repair:** reject duplicate tuples and specify canonical tuple ordering at parse and write
boundaries. Cross reordered and duplicate fixtures, and prove deterministic pack digests.

## Resume order

1. Settle the public id and version algebras, then use them consistently in schema and registry.
2. Publish the complete applicability graph and the F1 projection bridge.
3. Make every declared root representable; close resolved content over embedded evaluators.
4. Reconcile the semantic disposition type and author-review the 20 refusals.
5. Register schema annotations through one strict compiler authority.
6. Break the claim-anchor cycle and canonicalize `requires` bytes.
7. Re-run `make pack-capability-closure`, `make pack-capability-repeat-review` and `make verify`, then
   request another independent buildability review. Do not implement lane 0.30 or mutate the corpus.
