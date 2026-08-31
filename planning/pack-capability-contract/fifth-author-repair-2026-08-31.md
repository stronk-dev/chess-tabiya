# Pack capability contract — fifth author repair — 2026-08-31

## Verdict

Author repair complete for [[D2334]]–[[D2339]]. This is not acceptance or implementation. A fifth
fresh independent buildability review is required, and [[D560]] continues to hold the 92-pack apply.

## Repaired authority

- Transition artifact v3 contains the exact 92 sorted path/raw-SHA rows and the author contract
  independently rediscovers/recomputes them.
- Software admission and post-D560 corpus admission are sequential gates: projected requirements
  cannot masquerade as authored bytes, and the post-apply tree cannot retain the legacy reader.
- Applicability authority v2 carries all 14 unconditional rows as structured/versioned `always`
  selectors.
- Declaration history has one subject/structured-capability identity and is compiled through
  successor, no-successor, cross-subject and cycle fixtures.
- One safe public projection is shared by server serializer and web parser; semantic disposition and
  reachability cannot alias.
- Routes supply operation/run identity only. Requirements derive from registered pack and registry
  bindings, every mutation is provider-bound or explicit-no-provider, and first-flight/replay order
  prevents post-write enforcement.

## Verification

`make pack-capability-author-repair` passes the cumulative three-stage transition, 397 checked
applicability mappings, six new D2334–D2339 executable arms and strict TypeScript positive/negative
cases. No production schema, registry, API, client, pack, content or digest byte changed.
