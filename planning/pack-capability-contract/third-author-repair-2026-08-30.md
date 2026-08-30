# Pack capability contract — D2070–D2076 author repair

- **Repaired:** 2026-08-30
- **Input:** `second-fresh-independent-review-2026-08-30.md`
- **Rows:** [[D2070]]–[[D2076]]
- **RFC state:** draft; fresh independent buildability review required
- **Production/corpus state:** untouched; lane 0.30 and [[D560]] remain held

## Result

The seven landing-boundary contradictions are repaired as one staged operation rather than seven
local exceptions.

1. The software landing has a real 0.27→0.30 compatibility transition. Only the exact 92
   repository catalogue documents sealed by sorted path + raw SHA-256 may use the internal legacy
   reader. New, uploaded, Studio and API packs require a 0.30 stamp. The 0.27 arm and allowlist
   retire in the same later D560-authorized corpus apply.
2. `migration-plan-check` validates a complete deterministic plan and remains green with honest
   judgement debt. `migration-apply-ready` alone refuses that debt, and the applier writes nothing.
3. `rfc/contracts/pack-capability-schema-transition-v1.json` carries the ordered author patch and
   exact target bytes: schema 0.30, 83,841 bytes,
   `sha256:450d54dd2c77b8fe83173221640628a4da7c0c0d66cce1c2fc6edc6a5c44cb0c`.
4. Every closed member has an exact schema-member source; seven author-owned interpreter families
   add all entry sites and close through TypeScript symbol references, imported helpers and tables.
5. `/requires`, `capabilityRequirement` and `capabilityVersion` are exact metadata exclusions, so
   the stamp contributes zero requirements to itself.
6. Declarations are unique by subject+version. Histories retain obsolete rows, name one active
   current row, and require same-subject acyclic successor chains.
7. `stable-schema-member-v2` uses semantic owner, discriminator and member. Branch ordinal, `$defs`
   container depth and source-file location are forbidden inputs. Duplicate `kind=quantified`
   branches use `over.files` versus `over.squares` as their closed structural discriminator.

## Executable evidence

- `make pack-capability-closure`: **7/7 pass**.
- `make pack-capability-repeat-review`: **11/11 pass**.
- `make pack-capability-fresh-review`: **6/6 pass**.
- `make pack-capability-second-fresh-review`: **7/7 pass**.

The second-fresh target is now a positive author contract. It computes the sealed legacy
population, applies the ordered schema patch in memory and verifies the exact post-image; the other
arms check source closure, metadata non-self-reference, history and stable identity.

## Boundary

This is author repair only. It changes no production schema, runtime registry, pack, sidecar,
digest, API, content, archive or protected-design byte. Fresh independent review remains required
before acceptance; accepted status remains required before lane-0.30 implementation.
