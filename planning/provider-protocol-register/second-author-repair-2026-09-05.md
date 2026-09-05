# Provider-protocol register — second author repair

**Date:** 2026-09-05

## Outcome

The bounded repair closes [[D2809]]–[[D2814]] at contract tier without creating catalogue,
register or provider product bytes.

- Both historical reviews load the exact Git revision they examined, so later amendments cannot
  invert their expected result.
- `make provider-protocol-second-author-repair` is the maintained successor and normal verification
  invokes it.
- README ownership matches the generic parent: human-owned and mechanically checked, never
  generated.
- `ProviderProtocolTypeRelations` is a mapped type; the complete two-operation control typechecks
  and a missing operation produces TS2741.
- The nonexistent generic validation hook is deleted. Exact obligation/consumer population and its
  validator remain a named `provider-exchange-and-execution.md` product discharge.
- The former seventeen fixtures are split into ten process-owned and seven product-owned families.
- The `canonical_resource@1` routing summary uses `none` for a separate version selector, matching
  the parsed descriptor and generic parent.

## Executable evidence

`make provider-protocol-second-author-repair` retains both prior reviews and passes 5/5 repair
groups. The full repository gate remains required before landing.

## Boundary

This is disposable author evidence. Generic-bootstrap acceptance and implementation, another
genuinely fresh review, and the process implementation still precede the provider product RFC's
lane-1 claim and atomic runtime image.
