# Provider-protocol register — third fresh independent buildability review

**Verdict:** return the RFC on [[D2874]]–[[D2877]]. The second repair resolves its five named
findings, but the process/product boundary still has no executable authority chain from an accepted
obligation to the future atomic resource.

## Reproduced blockers

1. **[[D2874]] The promised partial state is unreachable.** The canonical resource owns exactly one
   selector. Once that export resolves, a version-only, payload-only or digest-only value reaches
   projection and is `invalid`; it cannot be `partial`, which requires a strict non-zero subset of
   multiple selectors. Both §1 and fixture family 8 prescribe the wrong state.
2. **[[D2875]] The accepted obligation preimage has no lawful reader.** The product check is required
   to parse the prior accepted RFC block, but §4 forbids it from reading Git. The generic API exposes
   resource before/after projections, not RFC metadata, and the descriptor intentionally has no
   hook. No immutable accepted artifact/digest or operation supplies the missing preimage.
3. **[[D2876]] Process closeout claims product-only repairs.** Criterion 10 says [[D2456]] and
   [[D2457]] close when the process fixtures pass. Yet the exact runtime image/type relation and the
   independent obligation validator are explicitly deferred to product discharge D4. Closing those
   rows during descriptor/register implementation would record remedies that do not yet exist.
4. **[[D2877]] Endpoint identity has no canonical representation.** The resource row declares
   `endpoint: string`; the normative product RFC declares closed structured UCI and HTTPS endpoint
   objects. It defines no endpoint id or lossless string encoding, so the future set-equality check
   has no exact value to compare.

## Evidence and required repair

`make provider-protocol-third-fresh-review` retains both historical returns and the second author
repair, then passes 4/4 falsifiers. A green review target means the four failures reproduce; it is
not acceptance.

The next author repair must use the generic `invalid` state for malformed one-root resources;
define one immutable, reader-visible accepted obligation authority without a parallel mutable
registry; leave product-only defects open through product landing; and make endpoint identity a
lossless canonical value shared by obligation, resource and product endpoint maps. Generic
bootstrap acceptance/implementation and another genuinely fresh review still precede process
implementation.
