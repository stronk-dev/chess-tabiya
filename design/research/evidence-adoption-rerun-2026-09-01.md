# Evidence adoption rerun — mechanisms still have no corpus reach

- **Date:** 2026-09-01
- **Question:** Q-08 / [[D403]] — do the corpus's evidence claims have backing now?
- **Method:** rerun the shipped, read-only graduation and expression-census instruments at
  `1336fc92`, then read the evidence totals rather than inferring adoption from implemented
  schemas or APIs. `[V]`
- **Commands:** `make graduation-report`; `make expression-census` (the latter's single JSON
  document was filtered only for the `corpus`, `evidence.totals`, and `totals` objects after the
  complete command passed). `[V]`

## Result

The adoption gap is unchanged at the product boundary. `make graduation-report` finds 56 draft
documents, 220 blocking entries, and **zero graduable drafts or published packs**. The same run
finds 68 paired evidence ledgers: 42 fresh, 26 stale, zero invalid, and zero otherwise-graduable
packs withheld only by freshness. `[V]` `apps/server/src/graduation-report.ts` and command output
from this pass.

`make expression-census` excludes the six named browser fixtures and reports the 50-pack authored
population: **196 claims, one backed claim, and zero recorded populations**. By rung, backing is
0/43 at rung 0, 1/37 at rung 1, 0/8 at rung 2, 0/60 at rung 4, and 0/106 at rung 5. `[V]`

| Product question | Measured answer |
|---|---:|
| Can any authored pack graduate now? | **No: 0/50** |
| Does machine backing reach more than the worked example? | **No: 1/196 claims** |
| Does any corpus-labelled claim carry a recorded population? | **No: 0/60** |
| Is this result explained by invalid ledgers? | **No: 0 invalid** |
| Is digest staleness itself being hidden? | **No: 26/68 are named stale and fail closed** |

The denominator distinction matters. Graduation prints 56 draft documents because it includes the
six browser fixtures; the expression census reports 50 authored packs after naming and excluding
those fixtures. The figures are consistent, not competing corpus counts. `[V]`

## Interpretation

The three mechanisms named by [[D403]] are implemented, but adoption still stops before authored
content. The freshness gate added under [[D1508]] is working and cannot explain the zero: no pack
would otherwise graduate if the 26 stale ledgers were merely re-stamped. `[V]`

The next executable work is therefore not another evidence schema. It is the existing binding and
population path: commission the ownerless [[D476]] content wave, attach recorded explorer evidence
where the source/rationale exists, and keep claims withheld where law 8 requires human authorship.
That work must report a named reason for every still-unbound claim; a percentage target would hide
the intentionally permanent authored residue. `[V]` `rfc/feedback-delivery.md` §0 and acceptance
criterion 21.

The policy question bundled into [[D403]]—whether a mechanism may land with no exercising
customer—is not answered by this measurement. It is split into [[D2475]] so the completed research
does not masquerade as an owner ruling. `[V]`

## Gate impact and honest limits

- **B4 / official content:** unchanged and unmet. No content-side evidence adoption credit. `[V]`
- **K6:** this rerun cannot test delivered-feedback discrimination because the binding wave has not
  happened. It strengthens the stated prerequisite; it is not a third K6 reading. `[V]`
- **Q-08:** answered. The adoption share is 1/196 and the population-backed share is 0/60. `[V]`
- This pass does not decide which principle, citation, engine result, or corpus population grounds
  any claim. Doing so would manufacture chess truth, which law 8 forbids. `[V]`
