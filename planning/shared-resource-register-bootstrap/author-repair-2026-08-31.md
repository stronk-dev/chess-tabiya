# Shared-resource register bootstrap — author repair

- **Date:** 2026-08-31
- **Subject:** `rfc/shared-resource-register-bootstrap.md`
- **Input:** fresh independent return D2381–D2384
- **Disposition:** repaired in draft; implementation remains unauthorized pending another
  independent process/buildability review

## Response

The repair changes no checker, register or product byte.

- D2381: the absent image now uses header-only tables. No sentinel syntax exists.
- D2382: `schema`, `migration`, `closed_vocabulary` and the [[D2401]] extension
  `versioned_registry` each define the complete claim, head,
  landed-parity and output behavior. A second synthetic resource of each kind must traverse the
  same implementation; resource-name branches are refused.
- D2383: the RFC publishes the complete current seven-resource population plus three absent roots.
  Each row carries an exact path and structural selector, including campaign's intentional `none`,
  the private-method migration array and the exported evidence tuple.
- D2384: `assertSharedResourceTransition` receives exact before/after trees. Pre-commit uses
  committed `HEAD` versus the staged virtual tree; CI walks the required `REGISTER_BASE_SHA..HEAD`
  first-parent range commit by commit. The three lifecycle transitions have distinct preimages,
  and landed regression is refused before snapshot validation.

## Boundary

The author contract checks that these specifications exist and that the old false images are gone.
It is not an implementation test. Another independent review must challenge the catalogue syntax,
the generic kind algebra, the preimage/range policy and able-to-fail matrix before acceptance.

## D2401 extension

Evidence presentation proved a third absent-root consumer after this repair was first written. The
same draft now declares `source-attribution-registry` as the first `versioned_registry`: one frozen
`{id,version,digest,rows}` authority, positive integer head, canonical row digest and exact version
symbol. The process implementation creates only the absent root. Evidence presentation later owns
the first-lane claim and every product byte. This changes the catalogue from nine to ten normative
rows and expands the generic-kind negative matrix from three to four; it does not authorize either
process or product implementation before another independent review.
