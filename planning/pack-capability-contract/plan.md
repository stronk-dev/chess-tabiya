# Pack-capability contract independent re-review

- **RFC:** `rfc/pack-capability-contract.md`
- **Reviewer:** codex
- **Started:** 2026-08-26
- **State:** returned to author; no implementation authorised

## Objective

Independently test whether the repaired F3 draft can be implemented without inventing capability
identity, dependency, digest, deployment-state, migration or lifecycle semantics. The review is a
buildability pass over the current tree, not a new product-scope decision and not an implementation
wave.

## Checks

1. Re-derive every executable baseline named by the RFC from HEAD.
2. Trace the mandatory pack `requires` set from authored bytes through every evaluator and default.
3. Test the source-region digest against the actual D566 repair rather than the RFC's description.
4. Type-check the semantic-disposition and deployment-reachability algebra on paper against current
   registries and provider availability.
5. Reduce `make capability-census` to literal inputs, identity rules and able-to-fail closure tests.
6. Trace legacy suffix identifiers through persisted/API/test boundaries.
7. Audit every discharge and deferred obligation for an existing accountable destination.
8. Record blockers in `design/BACKLOG.md`, route them, update RFC/register status, append the
   exploration log and run governance gates. Do not implement lane 0.30.

## Exit

The RFC may return to acceptance review only after [[D1620]]–[[D1626]] are repaired in the contract
and an independent pass can derive the same registry, requirements, digests, deployment projection
and migration results without consulting author intent.
