# Shared-resource register bootstrap — seventh fresh independent buildability review

- **Date:** 2026-09-04
- **Scope:** sixth author repair [[D2559]]–[[D2562]]
- **Gate:** `make shared-resource-bootstrap-seventh-fresh-review` — 5/5
- **Verdict:** **RETURNED** on [[D2593]]–[[D2597]]

## Scope and method

The review retained the complete prior catalogue, lifecycle, adoption, canonical-byte and temporal
direction, then attacked the sixth repair where descriptor bytes become projected semantic bytes.
It used the author models themselves plus a runtime import of a shadowed canonical resource. Green
tests are reproductions of blockers, not acceptance.

No catalogue engine, register transition, product authority, schema, API, storage, content, web or
protected-design byte was implemented.

## Blocking findings

### [[D2593]] — the TypeScript projector does not validate `TypeScriptGraphV1`

`projectTypeScriptContract` checks that selector roots exist, that their node ids occur somewhere,
and that selector source paths equal `program.rootNames`. It does not validate the declared program,
node or edge ABI. The reproducer supplies a program missing compiler package/version/integrity,
config digest and compiler options; duplicate node ids; malformed nodes; and a dangling edge of an
invented kind. The projector assigns an authoritative shared-resource digest to all of it.

The repair must parse the complete graph, prove node identity uniqueness and ordering, bind every
edge endpoint/kind/signature, and construct the graph from the pinned compiler program rather than
accepting caller-controlled semantic bytes.

### [[D2594]] — selector admission and selector resolution are different grammars

Catalogue validation accepts an HTTPS URL, a backslash path, and a root-only `export:` segment in a
descent position. None is a normalized repository-relative POSIX selector. In the other direction,
the author resolver implements only interface and function roots; it cannot resolve the initial
catalogue's valid `export:EVIDENCE_KINDS` selector, before reaching the seed's `$id`, type,
class/private-method/local and other forms.

One parser/state machine must define normalized paths, legal root kinds and legal descent kinds,
and that same authority must resolve every selector in the ten-row seed and follow-on descriptor
files. Descriptor admission cannot succeed for a selector the projector cannot represent.

### [[D2595]] — `Object.freeze` is recognized by text, not symbol identity

The static canonical-resource parser treats any property access whose receiver text is `Object`
and member is `freeze` as the admitted wrapper. A module-local `Object.freeze` can return arbitrary
runtime bytes. The reproducer certifies a `{rows:["certified"]}` payload/digest from the AST while
importing the same module yields `{rows:["runtime"]}` and another digest.

Resolve the global intrinsic with the pinned TypeScript program or reject a shadowed binding. The
adapter's static projection must agree with the runtime authority it registers.

### [[D2596]] — retained declaration identity is name-based, not graph-based

`retainedRepositoryNodeIds` accepts a set of identifier strings and walks every declaration. An
unrelated nested declaration named `choose` is retained merely because the selected overload root
has that spelling; it inserts a fourth node and renumbers all three real overload declarations.
The previous different-name control did not test symbol identity.

Derive retained declarations from exact compiler-symbol reachability. Same spelling in another
scope must not enter the graph, and representable declaration identity cannot be limited to simple
identifier names.

### [[D2597]] — semantic graphs and payloads mutate behind sealed digests

Both projectors freeze only the outer result while retaining caller-owned nested objects. The
reproducer appends a canonical-resource row and a TypeScript graph node after projection. In each
case the stored `digest` remains fixed while recomputing the canonical bytes changes it.

Return a recursively immutable canonical copy or accept only a deep immutable branded parser
result. A projected resource cannot be an immutable before/after transition operand while its
semantic value remains mutable.

## What survives

The sixth repair does close its direct predecessor defects: canonical resource ids are checked
against descriptors, payload roots must be objects, selector-root membership is no longer empty,
and same-name overload declarations are represented separately in the bounded example. The generic
catalogue, data-selected adapters, distinct absence states, lifecycle profiles, adoption rules,
canonical byte domain, README check-not-generate policy and first-parent transition direction all
remain sound and must be retained.

## Required bounded repair

Parse and construct the complete TypeScript graph; unify selector admission with structural
resolution over every real descriptor; bind `Object.freeze` to the global intrinsic; derive nodes
from compiler-symbol reachability; and deep-seal projected semantics. Retain all prior author gates,
then obtain another genuinely fresh independent review.

Implementation remains unauthorized while [[D2593]]–[[D2597]] are open.
