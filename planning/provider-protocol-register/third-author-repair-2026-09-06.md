# Provider-protocol register — third author repair

**Date:** 2026-09-06

## Verdict

[[D2874]]–[[D2877]] are closed at contract tier. [[D2897]], found while executing the repair, is
also closed by pinning the predecessor review to the exact commit it reviewed. The RFC remains
draft and implementation remains unauthorized pending a genuinely fresh review and the generic
bootstrap dependency.

## Repairs

- [[D2874]]: every malformed version-only, payload-only or digest-only atomic root now expects the
  generic engine's reachable `invalid` state. The one-selector resource no longer claims `partial`.
- [[D2875]]: product-RFC acceptance writes a canonical build-only
  `accepted-obligations.v1.json` receipt in a commit before product implementation. Build
  orchestration passes those committed bytes to the pure product validator, and the product landing
  refuses a staged receipt change. Runtime code reads neither the receipt, RFC prose nor Git.
- [[D2876]]: process closeout owns [[D2189]], [[D2455]], [[D2458]] and [[D2459]] only. Product-only
  [[D2456]]/[[D2457]] remain open through the D4 product landing.
- [[D2877]]: the operation row now carries the exact closed structured UCI/HTTPS endpoint value
  already defined by `ProviderEndpointMap`; canonical JSON row equality is lossless.
- [[D2897]]: the third fresh-review harness reads the RFC, bootstrap, product RFC and descriptor
  from commit `3597176a`, so later repairs cannot rewrite historical evidence.

## Executable evidence

`make provider-protocol-third-author-repair` retains both earlier returns, the second repair and the
commit-pinned third return, then passes 4/4 new repair groups. The maintained target is in
`verify-governance` alongside the predecessor target required by its own historical contract.

## Next

Run another genuinely fresh independent buildability review. Even if it passes, acceptance and
implementation still wait on owner acceptance and implementation of
`shared-resource-register-bootstrap.md`.
