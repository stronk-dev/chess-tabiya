# Semantic convention provenance — independent buildability return

**Reviewed:** 2026-08-27

**Reviewer:** codex

**Document:** `rfc/semantic-convention-provenance.md`

**Verdict:** **RETURNED on six executable contract gaps ([[D1921]]–[[D1926]]).** Separating
primary grounding from semantic convention identity is the right foundation. The proposed runtime
cannot yet construct, validate, preserve or durably reload the closure it promises, and the 39
declarations themselves have not been authored.

## Method

The pass re-derived the current declared/admitted/rendered evidence types, exact adapters, `anyOf`
derivation model, voice guard, run schema and initial 39-member census. A disposable six-arm harness
executes the live boundaries instead of assuming the new interfaces make them true.

## What survives

- convention identity is independent of primary grounding;
- fixed direct refs and instance-selected refs are distinct cases;
- derived convention closure must be path-specific and may add an explicit composition convention;
- convention changes and projection truth-set changes need separate version identities;
- raw ids belong in Advanced inspection, not ordinary learner UX;
- deterministic and provider presentation must share one admitted authority;
- opposition/backward-pawn migration remains an explicit successor rather than an in-place rewrite;
- conventions may never promote grounding, exactness, confidence or answer distance.

## 1. No runtime value identifies the selected derivation member ([[D1921]])

The manifest knows possible `derivation.anyOf` members, but `DeclaredEvidence` contains only
producer, projection and payload. `declareEvidence` accepts no sealed input values or member key.
Two outputs produced from different alternative paths are therefore byte-equivalent. The proposed
`ConventionReceipt.path: number` can only be supplied by a caller, and reordering declaration
members changes its meaning. The claim that the compiler “attaches” a receipt after admission also
conflicts with the live object: declared evidence is recursively frozen before admission.

Add one internal derived-evidence constructor that accepts the exact sealed input values actually
used, resolves them to one canonical declared member, derives the closure, and seals evidence plus
receipt in one operation before freezing. Source adapters similarly seal their direct and validated
instance closure at construction. Use a canonical member identity, not a caller-controlled numeric
index. Negative fixtures must cover swapped, missing, extra, spread and same-payload/different-path
inputs.

## 2. Instance convention values pass unvalidated ([[D1922]])

The live `exactObject` adapter verifies only that required keys exist and match the manifest operand
names. It does not validate values. `declareSpaceEvidence` therefore returns sealed evidence for an
invalid FEN and `conventionId: "unregistered@999"`. The proposed `instanceOperands?: string[]`
names keys but supplies no value grammar or extractor for the three shapes already present: string
refs, multiple ref fields, and grade's `{id, version, context}` object.

Register a typed extractor/validator per instance-varying projection, set-equal to the applicable
adapters. It must parse exact refs, retain allowed non-identity operands such as grade context,
reject absent/broad/unregistered values before the evidence seal, and prove that a fixed projection
cannot smuggle an undeclared instance ref.

## 3. Membership is published; the 39 required meanings are not ([[D1923]])

The RFC lists 39 refs, but contains only the `ConventionDeclaration` interface—not the literal
definitions, limitations, authorities and disclosures the compiler is supposed to ingest. Sixteen
refs assign new identities to shipped meanings. Implementing this draft would require the
implementer to write chess/product truth and citations that no accepted artifact currently states.
That is exactly what law 8 prohibits.

Before acceptance, publish the exact 39 declaration rows in a stable machine-readable artifact.
Each must cite an implementation, owner ruling, measured record or reviewed published source that
actually establishes its definition; “position rules” cannot stand in for an ungrounded strategic
label. Review the definitions as content/authority work, then make the registry, census and compiler
consume that one population.

## 4. The provider guard cannot detect omission ([[D1924]])

`voiceCheck` is an allow-list: it catches unsupported squares, moves, chess nouns, judgements and
prescriptions. It accepts any subset of the rendered text. A provider can remove “Required
limitation” and return only “Detected definition” with a valid result. Therefore “may not strip a
limitation” is not implemented by adding disclosure text to the allow-list.

Keep mandatory limitations outside provider-authored prose and append/render them deterministically
from the registered declaration, or define a structured required-clause receipt with an executable
completeness check. Provider paraphrase may decorate the bounded summary; it must not be responsible
for retaining the safety clause.

## 5. The previous snapshot is co-mutable ([[D1925]])

The RFC names a “checked previous-release snapshot” but gives it no file, lifecycle or immutable
authority. If it is a normal repo file, the same commit can update both `space@1` and its snapshot;
comparison and every refreshed digest pass. That is the bypass criterion 3 explicitly says must
fail.

Put each landed ref's semantic digest behind an append-only/non-co-mutable authority—such as landed
register rows whose existing bytes the staged governance check refuses to edit—or specify another
release artifact with equivalent able-to-fail semantics. A next-version claim may add `space@2`; it
must never authorize editing `space@1` or its historical digest.

## 6. Historical receipts are not persisted ([[D1926]])

The RFC motivates old/new convention distinction in Review and imported/stored evidence. The run
schema persists opaque string `evidenceRefs` and an `evidence.attached` provider payload; neither
contains projection version, convention refs, registry digest or derivation member. Runtime seals
also cannot survive JSON. Recomputing after a definition change silently gives historical moves the
current closure.

Either narrow the guarantee explicitly to transient evidence in one process, or—consistent with the
stated Review/history vision—claim the exact run/persistence lane and define a serializable receipt
that is validated against historical declarations and re-sealed on load. Specify import, export,
save/reload, deletion and old-version fixtures. Do not retain `tabiya-claims: none` while promising
durable receipts.

## Required next pass

Repair the declaration population and value authority first; those choices determine the process
register's digest and the persistence shape. Then amend provider presentation and claims, reconcile
the returned semantic-register RFC, and repeat independent buildability review. No owner UX choice
is needed, but the declaration population requires source-backed authoring rather than mechanical
implementation.

No production, protected design, schema, content or archive byte changed in this review.
