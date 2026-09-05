# Shared-resource register bootstrap — eleventh author repair

- **Date:** 2026-09-05
- **Repairs:** [[D2795]], [[D2796]], [[D2797]], [[D2798]], [[D2799]], [[D2800]],
  [[D2801]]
- **Gate:** `make shared-resource-bootstrap-eleventh-author-repair` — retained 56 controls, new 7/7
- **Verdict:** author repair complete; another genuinely fresh independent review required

## Repair

Every non-repository node now carries one digest over the complete importer-visible package
declaration artifact: canonical relative paths and exact bytes for package metadata and semantic
source files, with nested dependency stores and symlinks refused. A sibling or cross-file type
meaning change therefore moves the dependency identity and graph even when the directly retained
declaration is byte-identical ([[D2795]]).

Repository property access must resolve to an exact retained property edge; the missing relation
left by `any`/`unknown` fails before publication ([[D2796]]). Construct relations derive their
overload arm from constructor declarations rather than call signatures ([[D2797]]). The
compiler-resolved global `eval` intrinsic is refused by target authority, while a legal object
method named `eval` remains representable ([[D2798]]).

The compiler-backed projector is now the sole issuer of asserted graph authority. Validation runs
before deep sealing and the exact sealed graph is capability-bound to that projector; a cloned or
rewritten declaration tree/signature cannot enter the assertion boundary merely by preserving
shape ([[D2799]], [[D2800]]). Enriched edges are canonicalized at the final ABI, and the stripped
predecessor compatibility image is independently re-canonicalized before its retained assertion,
so normal local function calls no longer fail due to order drift ([[D2801]]).

## Evidence and hold

`make shared-resource-bootstrap-eleventh-author-repair` retains all 56 predecessor controls and
passes 7/7 new repair groups. This is bounded contract evidence only. It changes no production
catalogue, checker, register, schema, product or content byte and authorizes none before another
genuinely fresh independent review.
