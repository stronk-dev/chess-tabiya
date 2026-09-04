# Shared-resource register bootstrap — sixth fresh independent buildability review

- **Date:** 2026-09-04
- **Scope:** fifth author repair [[D2537]]–[[D2541]]
- **Gate:** `make shared-resource-bootstrap-sixth-fresh-review` — 4/4
- **Verdict:** **RETURNED** on [[D2559]]–[[D2562]]

## What survives

The generic direction remains sound. Catalogue rows select adapters as data; absent, partial,
invalid and landed remain distinct; canonical bytes have one digest domain; TypeScript program
configuration is now explicit; selector and migration roots are different values; and the README
remains checked rather than generated. The fifth repair also correctly rejects arbitrary digests,
templates, non-decimal integers and negative zero, and ignores a genuinely unrelated declaration
when assigning retained ordinals.

Those improvements do not yet make the pre-acceptance image buildable. Four green cases accept
states the amended RFC explicitly forbids or cannot represent.

## Blocking findings

### [[D2559]] — resource identity is checked against itself

`parseCanonicalResource` calls `assertCanonicalResource(parsed.id, parsed)`, while
`projectCanonicalResource` receives only a selector and the parsed object. A descriptor for
`provider-protocol` therefore accepts a correctly self-digested `assistance-exchange` object. The
result retains only `{version}` in identity, so the crossed resource name disappears before the
lifecycle engine sees it.

The parser/projector must receive the descriptor id, require exact equality before digest
agreement, and retain a crossed-resource negative.

### [[D2560]] — the closed payload object is not closed

The RFC requires `payload` to be a canonical JSON object. The shared canonicalizer correctly has a
wider value domain, and the adapter fails to narrow it: array, string and null payloads all receive
valid digests and pass the author parser/projector. Enforce a plain-object payload at the adapter
boundary and retain all three negatives. This does not narrow the shared canonical byte function.

### [[D2561]] — selected roots are not bound to graph roots

`projectTypeScriptContract` copies caller-provided selector strings into `resolvedSelectors` beside
an arbitrary `graph`. Its own positive fixture supplies a semantic graph with `roots: []`,
`nodes: []` and `edges: []` while claiming a non-empty assistance root and version selector. No
check joins descriptor selectors to `ContractRootV1.node`, retained nodes, or the program root set.

Projection must fail unless every descriptor root has exactly one selector root, every root node is
retained, the version selector is resolved by the same program, and there are no extra graph roots.

### [[D2562]] — overload declarations collapse by exported name

`retainedRepositoryNodeIds` returns `Object.fromEntries` keyed by declaration name. Three retained
declarations for one overloaded function overwrite each other, leaving one id, even though the RFC
requires every local overload signature plus its implementation. Replace the name-keyed map with
an ordered declaration identity that preserves every retained declaration. The existing unrelated-
prefix control must remain, and the new fixture must retain all overloads distinctly.

## Required bounded repair

Bind canonical resources to their descriptors, enforce the adapter's object payload, make the
TypeScript projected root set exact, and represent every same-name retained declaration. Then rerun
all retained author controls and this review, followed by another genuinely fresh review.

No catalogue engine, register transition, product authority, schema, API, storage, content, web or
protected-design implementation is authorized by this receipt. The status sentence preserves the
retained machine-readable `fresh independent review ... required; no implementation is authorized`
form.
