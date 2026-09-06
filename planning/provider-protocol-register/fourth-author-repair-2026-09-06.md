# Provider-protocol register — fourth author repair

**Date:** 2026-09-06

## Outcome

The composed checkpoint closes [[D2909]]–[[D2911]] and [[D2920]]/[[D2921]] at contract tier without changing the generic
catalogue, human register, provider product, schema, storage, content, archive or protected-design
bytes.

- build orchestration derives an opaque acceptance authority from the unique complete first-parent
  transition where the product RFC enters `accepted` and pins the receipt bytes at that commit;
- current receipt bytes and staged state must still match that accepted preimage, so a later
  self-consistent replacement fails;
- receipt and canonical-resource populations are strictly sorted and unique by unsigned
  lexicographic UTF-8 bytes of each RFC-8785 row, then compared in order; and
- the receipt wire image admits one literal schema and one domain-separated, lowercase,
  `sha256:`-prefixed digest grammar with a fixed reference vector; and
- the maintained fourth review reads its RFC/descriptor bytes from exact commit `ae7fe5b3`, so a
  later author repair cannot mutate its historical subject; and
- a history suffix beginning at `accepted` cannot invent the missing draft predecessor required to
  issue acceptance authority.

## Executable evidence

`make provider-protocol-fourth-author-repair` retains all previous review/repair rounds and the
fourth-review descriptor positive control plus 3/3 falsifiers. It then passes 4/4 direct inversions:
replacement after acceptance is rejected, permutation cannot retain a different resource image,
incompatible schema/digest encodings do not parse, and shallow history cannot mint authority.

## Boundary

This is author-contract evidence, not acceptance or implementation. Another genuinely fresh review
and the accepted/implemented generic shared-resource bootstrap still gate the absent descriptor and
register population; provider product bytes remain a later D4 obligation.
