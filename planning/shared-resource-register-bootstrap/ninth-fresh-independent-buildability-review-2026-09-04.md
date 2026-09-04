# Shared-resource register bootstrap — ninth fresh independent buildability review

- **Date:** 2026-09-04
- **Reviewed:** eighth author repair for [[D2645]]–[[D2649]]
- **Gate:** `make shared-resource-bootstrap-ninth-fresh-review` — retained 19 controls, new 7/7
- **Verdict:** **RETURNED on [[D2667]], [[D2668]], [[D2669]], [[D2670]], [[D2671]], [[D2672]]**

## What survives

The eighth repair correctly moved the projector toward compiler-symbol reach over committed source,
retains re-export targets and overload declarations, and closes the canonical scalar domain. Those
controls remain green. The failure is now at the boundary between the pinned Git tree, installed
dependencies and the supposedly exact semantic graph.

## Return

The program host is not commit-closed. For any repository-relative path absent from the Git tree,
`fileExists`, `readFile` and `getSourceFile` fall back to the standard filesystem host. A committed
root can therefore import an untracked local file; changing that file changes the projection digest
for the same commit. The same bug is worse for explicit package imports: a mutable untracked
`node_modules/fake-package` is classified as `origin: "repository"`, receives no package identity,
and changes the supposedly repository-pinned graph without a commit or lockfile change.

External identity is not portable even when resolution succeeds. TypeScript-library node IDs embed
the absolute installation path, contradicting the normalized library-name/export-path contract and
making equal sources hash differently across machines. A normal `Promise<string>` reference fails
altogether: all declarations of the merged library symbol are retained, but only the chosen target
gets an edge, so the projector creates its own unreachable nodes and throws `graph:orphan`.

Repository reach is also incomplete. For `holder.run(value)`, both the call and property symbol are
recorded while the receiver identifier is explicitly skipped because its parent is a property
access; the `holder` declaration and its initializer authority disappear from the graph. Finally,
`assertTypeScriptGraphV2` checks node/edge keys and endpoints but not the promised nested ABI. It
accepts a string instead of `SyntaxTreeV1`, a string `exportPath`, numeric `resolvedSignature` and
string `overloads` simultaneously.

## Required repair

Make the host refuse every repository-relative byte absent from the selected Git tree and classify
`node_modules` before repository containment; resolve external packages through one lockfile-backed
identity. Build portable external IDs from normalized module/library/export identities, not absolute
paths. Emit reach to every retained merged declaration, traverse property receivers independently,
and recursively validate the complete syntax/program/node/edge/dependency ABI before sealing. Then
run another genuinely fresh review. No catalogue, checker or shared-resource implementation is
authorized by this return.
