# Provider-protocol process cut — author repair (2026-09-07)

## Outcome

The active RFC is reduced to one process population: the already-authored absent
`provider-protocol` catalogue descriptor and its checked README register. Its eight active criteria
contain no provider-specific repository reader, acceptance issuer, canonicalizer, receipt issuer or
product validator.

## Why the cut is required

The sixth fresh review left four failures ([[D2956]]–[[D2959]]). Three concern the generic
repository/lifecycle/staged-transition authority. The fourth concerns the future product root.
Keeping them in the process population RFC would require a seventh provider-local model of shared
machinery around one absent catalogue row ([[D3128]]).

## Routing

- [[D2956]]–[[D2958]]: `shared-resource-register-bootstrap.md`, whose generic engine must own legal
  RFC successors, build-owned repository identity and staged source observation.
- [[D2959]]: `provider-exchange-and-execution.md`, whose product landing consumes the generic opaque
  staged projection.
- [[D3030]]: `provider-exchange-and-execution.md`, which now specifies the sole durable
  operation-specific parser before bot decision reconstruction.

## Build boundary

The process implementation may add only the descriptor source, checked README register, focused
population fixture, documentation and required ledger/log/roadmap closeout. It may not add runtime
provider bytes, schemas, APIs, migrations, content, web surfaces or provider-specific Git logic.

`make provider-protocol-cut-contract` checks the bounded active criteria, exact descriptor,
provider-exchange handoff and opt-in test-tier placement. One fresh review of this cut and the
accepted/implemented generic bootstrap still precede implementation.
