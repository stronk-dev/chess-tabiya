# Shared-resource register bootstrap — fifth author repair

- **Date:** 2026-09-02
- **Repairs:** [[D2537]]–[[D2541]]
- **Status:** author repair complete; another fresh independent review is required
- **Executable receipt:** `make shared-resource-bootstrap-fifth-author-repair` — 5/5 green

## What changed

Canonical-resource parsing now uses the previously defined shared byte/digest authority rather than
merely returning an authored digest string. Its author fixture uses a real digest and permanently
refuses arbitrary digest, template, hexadecimal and negative-zero inputs.

TypeScript graph identity is now two-pass: reachability closes first, then repository declarations
receive ordinals only among retained declarations in the same source path. An unrelated declaration
outside the graph is therefore invisible, while adding/removing/renaming a retained declaration
still changes the graph.

Compiler setup is data and part of the semantic graph. Both adopted assistance descriptors and the
migration descriptor pin `tsconfig.base.json`; one repository-root program disables implicit type
acquisition, resolves workspace sources and external identities in importer context, and records
compiler/config/options/root identities in `TypeScriptProgramIdentityV1`.

Graph roots are no longer overloaded strings. Selector roots carry their exact selector and node;
each migration callback carries its sequence selector, literal migration version, `apply` property
and retained node. The callback does not pretend to have a selector the grammar cannot express.

Finally, canonical and TypeScript adapters each map to one literal `ProjectedResourceV1`, including
identity, semantic, digest and resolved selectors, and both name the exact sequential head.

## Verification

- `make shared-resource-bootstrap-fifth-author-repair` — 5/5
- `make shared-resource-bootstrap-fourth-author-repair` — retained 4/4
- `make shared-resource-bootstrap-third-author-repair` — retained 8/8
- `make shared-resource-bootstrap-second-author-repair` — retained 8/8
- `make shared-register-reconciliation-author-repair` — retained 6/6

## Boundary

No catalogue engine, runtime register, README resource section, product authority, schema, API,
storage migration, content, web or protected-design byte landed. This is a bounded author repair;
fresh independent review still gates acceptance, and acceptance still gates implementation.
