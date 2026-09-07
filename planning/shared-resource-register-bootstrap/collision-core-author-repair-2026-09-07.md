# Shared-resource register bootstrap — bounded collision-core author repair

- **Date:** 2026-09-07
- **Repairs:** [[D3116]], [[D3117]], [[D3118]], [[D3119]]
- **Gate:** `make shared-resource-bootstrap-collision-core-author-repair`
- **Verdict:** author repair complete; another genuinely fresh review still gates acceptance

The cut remains seven resources and three retained readers. Catalogue admission now rejects two ids
for one canonical authority, using schema slug or resolved repository path plus export. Schema lane
components have one spelling, and a shared exported resource-id grammar must drive catalogue,
claim, and README marker parsing. The synthetic extension control deliberately carries a digit.

The author gate now compares each schema row's complete `(slug, id, versionExport)` tuple to the
hard-coded inventory it will replace. Every non-null export must occur exactly once as a literal in
`packages/schema/src/index.ts` and equal the matching schema `$id` version. The old fresh-review
harness keeps its pre-repair counterexamples self-contained so it remains historical executable
evidence instead of turning red when the living contract is repaired.

No production checker, catalogue, register, schema, migration, evidence vocabulary, product or
client bytes changed. Implementation and staged consumer rebases remain unauthorized until another
fresh review and owner acceptance.
