# Shared-resource register bootstrap — fourth fresh independent buildability review

- **Date:** 2026-09-02
- **Reviewer:** Codex, independent of the fourth author repair
- **Verdict:** **RETURNED** on [[D2537]]–[[D2541]]
- **Executable receipt:** `make shared-resource-bootstrap-fourth-fresh-review` — 5/5 findings

## What survives

The catalogue-first architecture still holds: resource ids select data rather than checker code;
absence, partiality, invalidity and landing are distinct; lifecycle policy is closed; adoption
preserves already-live bytes; descriptor candidates make process authorization reviewable; and the
README remains checked rather than generated. The repaired assistance selectors resolve, the ten
bootstrap descriptors and seven follow-on descriptors validate under one union, and static parsing
is the right boundary for canonical resources.

This return does not request another register, canonicalizer, Git reader, adapter family or product
surface. It closes five places where the promised generic image is still ambiguous or where the
fourth author receipt accepts a forbidden image.

## Blocking findings

### [[D2537]] — the canonical-resource repair is not executable

The RFC requires a literal resource digest equal to the shared digest of `{ id, version, payload }`
and forbids templates and non-JSON literals. The author parser merely returns the supplied digest;
its own positive fixture uses `sha256:abc`. It also accepts no-substitution templates and hexadecimal
numeric syntax. Therefore `make shared-resource-bootstrap-fourth-author-repair` stays green for
three shapes the repaired contract explicitly refuses. The repair must import the one author-model
canonical byte function, validate the exact lowercase digest, and reject templates, hexadecimal
numbers and negative zero.

### [[D2538]] — graph identity includes unrelated declarations

A repository node id is `path + preorder ordinal among AST declarations`. Prepending one declaration
that is neither a root nor reachable from a root changes the retained declaration's id and all its
incident edges. The selected contract graph is unchanged, yet its digest moves. This is not the
deliberately semantic local/import binding rename: it is an out-of-graph edit becoming authority by
position. Node ids need a stable symbol/declaration identity, with overload/declaration ordinals
scoped to that symbol rather than to every declaration in the file. The implementation fixtures need
both controls: unrelated insertion is invariant; a retained binding/member rename still moves.

### [[D2539]] — the compiler is pinned but the compiler program is not

The assistance resource spans `apps/web` and `packages/runtime`, which have distinct tsconfigs. The
RFC pins the TypeScript package version but names no root config, project-reference composition,
compiler options, module-resolution host or importer context. Those choices determine package
exports, path aliases, standard libraries, workspace links and which lockfile package instance an
external declaration means. Two implementations can therefore build different graphs from the same
selectors and compiler version. Define one program-construction algorithm over the repository's
project graph, including exact failure behavior for a root outside that graph.

### [[D2540]] — migration callback roots are unrepresentable

`migration_sequence@1` says every anonymous `apply` callback is the sole root of an exact
`TypeScriptGraphV1`, while that graph defines `roots` as structural selector strings. The descriptor
owns one selector for the whole `migrations` array and the selector grammar has no array-entry or
callback segment. There is no conforming string to place in `roots`. Define a deterministic callback
root identity derived from the resolved sequence entry (for example the migration version plus the
static `apply` property) and state whether it is a selector or a distinct graph-node id.

### [[D2541]] — two adapters do not map into `ProjectedResourceV1`

The atomic adapter defines a parsed object and its embedded digest; the TypeScript adapter defines a
version selector and graph. Neither states the exact `identity`, `semantic`, projection `digest` or
sequential head returned to the lifecycle engine. In particular, the atomic embedded digest may be
used directly or placed inside a second digest, and the TypeScript version may or may not enter its
digest. Both choices satisfy the current prose and produce different transition histories. Give
each adapter one literal four-field output image and define the head extraction.

## Required bounded repair

1. Make the canonical-resource author parser enforce the contract it claims to test.
2. Replace file-global declaration ordinals with stable retained-symbol identities and add the two
   drift controls.
3. Specify exact multi-project TypeScript program construction and module resolution.
4. Give migration callback graphs a representable deterministic root.
5. Define complete `ProjectedResourceV1` outputs and lifecycle heads for canonical and TypeScript
   adapters.

Then rerun all prior author controls and this review, followed by another genuinely fresh review.
No generic engine, catalogue, register or product implementation is authorized by this receipt.
