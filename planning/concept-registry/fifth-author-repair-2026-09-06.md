# Concept registry — fifth author repair

**Date:** 2026-09-06
**Scope:** [[D2923]]–[[D2928]]
**Verdict:** repaired at requirements tier; another genuinely fresh independent review is required.

## What changed

- Service readiness is now an opaque runtime capability minted only by the successful coordinator.
  There is no exported class, constructor or issuer; structural and cast forgeries fail the private
  authority check at the first storage operation.
- The concept migration receives one frozen, operation-specific repository capability. It receives
  no `DatabaseSync`, SQL executor, transaction method or pragma authority; the coordinator alone
  owns begin, rollback, version stamp and commit.
- Historical pack admission runs the shipped complete-document validator before computing and
  comparing the canonical digest. A matching digest cannot turn an invalid pack into authority.
- Initial migration and restart are distinct paths. Initial migration writes an exact canonical
  receipt inside the transaction; restart requires it and recomputes registry, input, artifact and
  output digests before readiness can be minted.
- The repository graph loads committed `.svelte` files, extracts their instance scripts and follows
  the real `main.ts → App.svelte → api.ts` edge while TypeScript compilation retains a typed virtual
  component boundary.
- Each registered concept operation must return from its owning wrapper and that exact wrapper call
  must feed its declared product boundary. Bare expression calls and disconnected web modules fail.

## Executable evidence

`make concept-registry-fifth-author-repair` retains the complete predecessor chain, executes the
fifth review's six counterexamples, then passes 6/6 direct repair groups plus strict TypeScript.

The model is disposable contract evidence under the exploration gate. It changes no production,
schema, storage, content, archive or protected-design byte.

## Next

Another genuinely fresh reviewer must attack the composed capability, receipt, validator, Svelte
graph and value-flow boundaries. Acceptance and implementation also remain blocked on the
independently-passed shared-resource bootstrap.
