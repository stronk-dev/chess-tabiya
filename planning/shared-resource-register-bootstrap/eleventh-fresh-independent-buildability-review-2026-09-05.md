# Shared-resource register bootstrap — eleventh fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewed:** tenth author repair for [[D2701]]–[[D2708]]
- **Gate:** `make shared-resource-bootstrap-eleventh-fresh-review` — retained 49 controls, new 7/7
- **Verdict:** **RETURNED on [[D2795]], [[D2796]], [[D2797]], [[D2798]], [[D2799]],
  [[D2800]], [[D2801]]**

## What survives

Duplicate-key configuration refusal, selected declaration source digests, origin/root/edge-arm
shape checks, unresolved-call refusal, dynamic-import refusal and literal element-access checks all
survive the retained chain. This return is at the remaining semantic closure and representability
boundary; it does not reopen the repaired tenth-review defects.

## Return

External traversal stops after retaining the directly referenced declaration. If that declaration
refers to a sibling declaration in the same package, changing the sibling's meaning leaves the
graph, digest and complete retained dependency identity unchanged ([[D2795]]). An `any`-based
property read is also published without an edge for the selected member ([[D2796]]), despite the
RFC's explicit refusal of `any`/`unknown` member resolution.

Two explicit relation classes do not match the compiler operations they claim to represent.
Constructor edges enumerate call signatures rather than construct signatures, so a valid `new`
expression fails `graph:call-arm` ([[D2797]]). The explicitly refused global `eval` call publishes
as an ordinary TypeScript-library call ([[D2798]]).

The public graph assertion checks shapes rather than the compiler-derived relations it seals. An
external declaration tree can be replaced while its old `sourceDigest` remains accepted
([[D2799]]), and a call's compiler-selected signature can be replaced by an arbitrary syntax tree
while the assertion still returns true ([[D2800]]). Finally, enriching external identity and then
stripping it for the predecessor assertion changes edge serialization without re-canonicalizing;
an ordinary repository-local function call is therefore rejected by `graph:edge-order`
([[D2801]]).

## Required repair

Traverse every retained external declaration's semantic dependencies or bind the installed
artifact bytes at a boundary that makes omitted nested meaning impossible. Fail closed on
`any`/`unknown` property resolution and `eval`. Enumerate construct signatures for construct edges.
Make graph assertion recompute and compare source digests, bind selected signatures to their exact
compiler relation, and canonicalize at the asserted ABI rather than before identity enrichment.
Then run another genuinely fresh independent review.

No catalogue, checker, register, schema, product or content implementation is authorized.
