# Shared-resource register bootstrap — eighth fresh independent buildability review

**Date:** 2026-09-04

**Verdict:** **RETURN TO AUTHOR** on [[D2645]]–[[D2649]].

**Production authorization:** none. No register engine, catalogue, shared-resource schema, migration,
or product byte may be implemented from this draft.

## Scope and method

This review attacked the seventh author repair as a new implementation brief rather than trusting
its prose. It retained the sixth-author 4/4 controls and seventh-author 5/5 controls, then exercised
five independent contradictions in the disposable
`tools/d2645-shared-resource-bootstrap-eighth-fresh-review/` harness.

`make shared-resource-bootstrap-eighth-fresh-review` passes **4 retained + 5 retained + 5 new**
tests. The five new green tests mean the defects are reproducible; they are not acceptance evidence.

## Findings

1. **[[D2645]] — the promised complete TypeScript graph has no dependency traversal.**
   `projectConstructedTypeScriptContract` emits only explicitly selected nodes, always emits
   `edges: []`, and omits a referenced interface from an exported contract. It does not implement
   the RFC's type, call, property, heritage or re-export graph.
2. **[[D2646]] — the pinned program authority is caller-authored.** The projector accepts arbitrary
   `{path, sourceText}`, labels it with `sha512:author-fixture`, hashes empty compiler configuration,
   and records no real project options. It can certify bytes absent from the repository under an
   identity a production compiler cannot reproduce.
3. **[[D2647]] — re-export reach stops at the alias declaration.** An exported alias retains only
   its `ExportSpecifier`; it neither resolves the target symbol/declarations nor emits the required
   `re_export` edge.
4. **[[D2648]] — deep sealing accepts values outside the canonical byte domain.** Fractions, unsafe
   integers and lone UTF-16 surrogates pass even though §2.1 requires safe integers and paired
   Unicode. The model can therefore seal and digest a value the production canonicalizer must
   reject.
5. **[[D2649]] — normal TypeScript overloads cannot be roots.** The resolver requires one function
   declaration, so an overload set fails with `selector:root-count:3`; the singular
   `ContractRootV1.node` also has no deterministic mapping rule for the retained declaration set.

## Retained controls

The prior controls remain useful and must survive repair: graph structural validation, unified
selector parsing, global `Object.freeze` identity, symbol-based retention intent, recursive sealing,
canonical descriptor/payload binding and overload-safe *retention*. None supplies the missing
repository-program construction and transitive traversal found here.

## Required bounded repair

- Construct the program from pinned repository revision, lockfile/compiler integrity and the real
  project configuration; do not accept caller source bytes or caller program identity.
- Traverse the closed compiler-symbol graph required by §2 and emit validated typed edges,
  including alias/re-export targets and referenced declarations.
- Enforce exactly the canonical scalar domain before sealing or digesting.
- Define an overload root as one resolved symbol with all declarations retained and one deterministic
  root-node rule; cross source-order and unrelated-overload mutations.
- Retain all earlier controls, add the five inversions above, then obtain another genuinely fresh
  independent buildability review before acceptance or implementation.
