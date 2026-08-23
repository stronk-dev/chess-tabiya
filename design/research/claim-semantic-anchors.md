# Semantic anchors for machine-backed prose

**Question:** what must a claim binding prove beyond text identity, span location, value equality
and evidence provenance before authored prose may be called machine-backed?

**Feeds:** D1007, D1008, Feedback Delivery Stage 2, the claim-backing follow-up, F1/F3,
and learner modules that render authored claims.

**Verdict:** the current contract proves where a token came from, not what proposition the token
expresses. Its only automatically discovered validator-green join binds the cardinal *one* in
“the one common mate” to a later position's DTM of 1, even though the word modifies *mate* rather
than distance-to-mate `[V]` (`tools/feedback-binding-wave/candidate-audit.test.ts:114-141`,
`design/BACKLOG.md:D1008`). A selector, digest, record reference, or provenance chain cannot repair
this class because none identifies the sentence's subject-predicate-object relation. Automatic
binding must begin with a typed proposition and render the machine-backed clause through a
registered deterministic renderer. Existing arbitrary prose may migrate automatically only when
the complete clause is byte-equal to that renderer's output; every other case requires an explicit
author rewrite or reviewed semantic annotation. The stopped 43-row wave must remain stopped.

## Method

This pass used four arms:

1. executed the committed D1007/D1008 corpus falsifier and traced the accepted candidate through
   `validateClaimBindings` `[V]` (`tools/feedback-binding-wave/candidate-audit.test.ts`);
2. read the complete claim-binding type, structural validator, evaluator, normalizer and compiled
   evidence consumer at HEAD `[V]` (`apps/server/src/sourcing/types.ts:87-121`,
   `apps/server/src/sourcing/ledger-validation.ts:342-354`,
   `apps/server/src/sourcing/claim-binding.ts:15-279`);
3. compared that contract with the W3C Web Annotation selector/body/target model and PROV-O's
   provenance entities, activities and derivations `[V]`
   ([Web Annotation Data Model](https://www.w3.org/TR/annotation-model/),
   [PROV-O](https://www.w3.org/TR/prov-o/)); and
4. checked the Nanopublication model and the primary “Genuine Semantic Publishing” paper for the
   established separation between a formal assertion, provenance of that assertion, and its human
   publication `[V]`
   ([Nanopublication Guidelines](https://nanopub.net/guidelines/working_draft/),
   [Kuhn and Dumontier 2017](https://journals.sagepub.com/doi/10.3233/DS-170010)).

This is a contract study over the current corpus and implementation. It does not recommend adding
RDF, Web Annotation or nanopublication dependencies to Tabiya; their separation of concerns is a
falsifier and design precedent.

## What the shipped binding proves

| Property | Shipped proof | Able to fail? | Proves meaning? |
|---|---|---:|---:|
| claim identity | `claimId`, pointer and `sha256(text)` resolve together | yes | no |
| text location | each `span` occurs exactly once | yes | no |
| pack scope | assertion FEN is reachable from the pack or one legal successor | yes | position only |
| evidence existence | one ledger record of the expected kind exists at the FEN | yes | no |
| value equality | `normalizes` equates the span with the evaluated number/category | yes | no |
| token coverage | unbound numerals, moves, squares and result words are refused | yes | no |
| label earning | a machine label has at least one mapped record kind | yes | no |
| proposition identity | no subject, predicate, object, scope or clause renderer is represented | **no** | **no** |

Hashes and pointers are checked at `claim-binding.ts:216-224`; occurrences at `:228-233`;
records and values at `:66-160`; normalization at `:166-177`; token residue and label earning at
`:245-251` `[V]`. `ClaimAssertion` carries only a free `kind`, untyped arguments and optional
`select`; `ClaimSpan` pairs it with an arbitrary substring (`sourcing/types.ts:87-101`) `[V]`.

The evaluator already computes a human-readable `rendered` sentence for each assertion, but the
validator never compares the claim clause with that sentence. It appends the sentence to
`ValidatedClaimBinding.rendered` only after the arbitrary span passes value equality
(`claim-binding.ts:30-37,238-242`) `[V]`. The implementation therefore contains the beginnings of
proposition-first rendering while continuing to admit token-first binding.

## What the standards do—and do not—supply

The W3C Web Annotation model separates an annotation's body from its target and lets a selector
identify an exact text segment, including prefix and suffix `[V]`
([model §§3.1, 4.2.4](https://www.w3.org/TR/annotation-model/)). That is a stronger locator than the
current unique substring, but it identifies **which characters** are targeted; domain meaning
belongs in the body or an application vocabulary. A TextQuoteSelector improves drift/location
safety and leaves D1008 intact.

PROV-O represents entities, activities that used/generated them, derivations and responsible
agents `[V]` ([PROV-O §3.1](https://www.w3.org/TR/prov-o/)). Tabiya's ledger already covers much of
this provenance role through source, engine, timestamp, anchor and record identity. A richer
derivation chain would make origin more auditable but still would not say that *one* means DTM
rather than number-of-mates.

Nanopublications make the missing layer explicit: an assertion graph contains formal
subject-predicate-object statements, while a separate provenance graph records how the assertion
came to be `[V]` ([guidelines, Basic Elements](https://nanopub.net/guidelines/working_draft/)).
Kuhn and Dumontier argue for authors to capture formal semantics as a primary component and allow
narrative text to verbalize those formal statements, instead of extracting semantics after prose
is published `[V]` ([2017 paper](https://journals.sagepub.com/doi/10.3233/DS-170010)). This maps to
law 8: validated evidence may be rendered into prose; arbitrary prose cannot acquire a machine
meaning from coincident tokens.

## Refused repairs

### More provenance, stronger hashes, or a better selector

These strengthen origin and location only. D1008 already has the right pack, reachable FEN, unique
record, exact digest and equal value. Any repair leaving the sentence relation implicit accepts
the same false join `[V]`.

### A typed predicate beside an arbitrary span

Adding `predicate:"distance_to_mate"` records a stronger author claim but does not bind that
predicate to the noun phrase. A generator can write the same false predicate and the validator has
no able-to-fail relation to the prose. This may support an explicitly reviewed annotation, but it
cannot license an automatic migration `[M]`.

### LLM entailment as the admission gate

An LLM could reject the known example, but would turn evidence admission into a probabilistic
judgement with no stable replay contract. It would also ask an LLM to decide chess-claim meaning
at the law-8 boundary. An LLM remains appropriate downstream for bounded phrasing over an admitted
proposition, never as the authority that creates the proposition `[M]`.

### A generic “derived sentence” escape hatch

F1 already learned this at runtime: a sealed evidence view is insufficient if a caller can pair
admitted evidence with arbitrary prose. Claim backing must not recreate that bypass. A
machine-backed sentence needs a registered renderer whose inputs are the exact proposition; an
unregistered paraphrase is authored prose, even when true `[V]`
(`packages/runtime/src/evidence-catalog.ts:753,864-880`; `design/BACKLOG.md:D662,D668`).

## Required primitive

The minimum truthful unit is a proposition-first `ClaimFact`, conceptually:

```ts
interface ClaimFactV1 {
  readonly projection: { readonly id: string; readonly version: number };
  readonly subject: Readonly<Record<string, string>>;
  readonly predicate: string;
  readonly object: { readonly kind: string; readonly value: unknown; readonly unit?: string };
  readonly qualifiers: Readonly<Record<string, unknown>>;
  readonly evidence: readonly { readonly recordKind: string; readonly anchor: Readonly<Record<string, string>> }[];
  readonly renderer: { readonly id: string; readonly version: number };
}
```

This is a semantic shape, not a final TypeScript API. The follow-up RFC must derive its literals
from the compiled evidence vocabulary instead of creating a second assertion registry `[M]`. The
load-bearing requirements are:

- **subject:** exact position, move, line or population;
- **predicate:** a closed relation such as DTM, legal-move count or move share—not a record kind;
- **object:** typed value and unit/domain, retaining cp versus mate;
- **qualifiers:** side, rating band, time window, selection and interpretive scope;
- **evidence:** declared record identities from which the proposition is evaluated;
- **renderer:** one registered deterministic function from the proposition to the backed clause.

The human claim becomes a composition of machine-rendered clauses and separately attributed
authored clauses. The same fact can feed Support, Review, voice, inspector and authoring without
letting each consumer reinterpret raw records. This follows F1's existing
producer→projection→consumer direction across the authored-claim boundary `[V]`
(`packages/runtime/src/evidence-catalog.ts`).

## Migration boundary

The corpus contains one committed claim binding and 43 stopped automatic candidates `[V]`
(`make expression-census`; `tools/feedback-binding-wave/candidate-audit.test.ts`). The conservative
migration rule is:

1. evaluate a typed proposition from admitted records;
2. render its complete clause through the registered renderer;
3. auto-bind only when that clause is byte-equal to a complete authored clause and its scope agrees;
4. otherwise emit a proposed rewrite/annotation for human review and make no binding;
5. keep authored strategy under principle/citation provenance and never infer it from the fact.

The existing Philidor binding must use the new form or remain behind an explicit legacy reader.
Extending `ClaimSpan` in place without a compatibility decision changes the meaning of
`tabiya.sourcing.evidence.v1`, whose validator uses exact key sets and whose archived RFC called
`claimBindings` additive within v1 `[V]` (`ledger-validation.ts:342-354`,
`rfc/archive/claim-backing.md:1601-1605`). F3's capability/version contract must own that transition
or the follow-up must claim it explicitly; it may not be a silent optional-field edit.

## Able-to-fail acceptance matrix

| Fixture | Required result |
|---|---|
| right value, wrong predicate: “the one common mate” → DTM 1 | refuse |
| right predicate/value, wrong FEN or population | refuse |
| right record kind, unsupported selector or qualifier | refuse |
| right proposition, arbitrary unregistered paraphrase | refuse automatic binding; explicit reviewed author path only |
| provenance or record reference with no proposition | refuse |
| renderer/projection version changes after binding | fail closed or require explicit migration |

A positive control must render and bind one tablebase fact, one engine fact and one explorer fact,
then prove each reaches authoring validation and a learner-facing compiled consumer without a raw
sentence side channel.

## Consequence

D1008's exploration question is answered: the repair is a typed proposition plus registered
rendering, not stronger token matching. This opens a bounded follow-up RFC to the implemented
claim-backing contract. It must reconcile with F1/F3, declare compatibility for the one live
binding, and preserve explicit human review for legacy prose. Feedback Delivery Stage 2 remains
blocked until that follow-up is accepted and implemented; the 43 candidates are evidence for the
need, not a migration queue.
