# Shared-resource register engine — second author repair

- **Date:** 2026-09-01
- **Subjects:** generic bootstrap plus assistance, provider and semantic-convention population RFCs
- **Status:** author repair complete; fresh independent review required
- **Product/protected design:** unchanged

## Repairs

- [[D2442]]: `canonical_resource@1` now has exact `{ id, version, payload, digest }` shape and hashes
  every payload semantic, including resolver and missing-field policy.
- [[D2443]]: absence and uniqueness use exact structural selector identity; paths may be shared and
  partial roots fail.
- [[D2444]]: one named canonical byte/digest authority has an exact admitted value domain, encoding,
  UTF-8 prefix and digest representation.
- [[D2454]]/[[D2455]]/[[D2466]]: assistance, provider and semantic conventions now populate the
  generic catalogue. They add no C9/C10/C11, `RESOURCE_NAMES`, Git reader or canonicalizer.
- [[D2465]]: one-time adoption truthfully registers already-landed authorities without product
  mutation or invented earlier history.
- [[D2467]]: assistance permission adoption reads the live type union through a generic
  `literal_string_union@1` adapter rather than rewriting it into a tuple.

## Cross-RFC result

Assistance adopts config v4, workflow preference v1 and the four permission values; operation
semantics become a separate sequential contract and exchange becomes one atomic absent resource.
Provider protocol becomes one atomic absent resource with compile-only type relations and an
independent accepted product-obligation join. Semantic conventions retain their per-base lineage
and semantic-history hook while depending directly on the generic engine.

## Executable author checks

- `make shared-resource-bootstrap-second-author-repair`: 8/8 green.
- `make shared-register-reconciliation-author-repair`: verifies the one-engine dependency,
  assistance split/adoptions, provider independent population, semantic lineage and review
  boundaries.

The checks are author controls, not independent acceptance. No checker/register/product
implementation is authorized until fresh review.
