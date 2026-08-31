# Shared-resource register bootstrap author contract — 2026-08-31

## Verdict

Draft complete for [[D2363]]. This is not acceptance or implementation. The current checker and
registers remain unchanged until fresh independent process/buildability review.

## Contract

- One README catalogue replaces hard-coded resource and schema-slug lists.
- New resources enter through an accepted process RFC that lands a product-byte-free `absent` root.
- A later product RFC alone may declare the unique `first lane 1` claim.
- First implementation atomically creates tree authority, landed row, digest and non-absent head;
  partial landing and return to absent fail.
- The first instance is `release-manifest-schema`, unblocking the runtime-distribution D2206 claim
  without creating its schema early.

## Verification

`make shared-resource-bootstrap-author-contract` passes five executable draft-contract arms. Fresh
review must attack catalogue authorization, absent→landed atomicity and one-way history.
