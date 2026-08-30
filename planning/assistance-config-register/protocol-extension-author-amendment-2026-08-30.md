# Assistance shared-resource registers — protocol extension author amendment

**Date:** 2026-08-30

**Rows:** [[D2178]], [[D2328]]

## Amendment

The existing AssistanceConfig register RFC now owns four distinct assistance resources rather
than letting intent-presets invent three unregistered protocols:

- effective AssistanceConfig, landed head 4;
- durable workflow preference, landed web-local head 1 and claimed future lane 2;
- staged assistance exchange, currently absent and claimed first lane 1; and
- assistance permission, the current four-member exported vocabulary with a future `legal` member
  claim.

The important process addition is a real absent state. A new cross-package wire must be reservable
before its first implementation, but absence cannot be called head 0. The proposed checker derives
`{kind:"absent",contractDigest:"absent"}`, permits exactly one `first lane 1` claimant and requires
the landing commit to create head 1, append history and remove the claim atomically.

## Verification

The extended positive author contract covers distinct identity, exact intent-presets claim shapes,
absent/landed discrimination, unique first claim, fictional-head-0 refusal and lingering-claim
refusal. `make assistance-register-third-author-repair` is the maintained target.

No checker, README register, product type, schema, content or archive byte is implemented by this
amendment. A fifth fresh independent review is required before process implementation.
