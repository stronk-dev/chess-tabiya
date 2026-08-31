# Named-structure occurrence and module successor alignment (2026-08-31)

## Re-derived seams

- [[D2372]]: `DeclaredEvidence` contains producer, projection and payload only. The
  `evidence-value-authority` successor `rules.structural.reading.named_structure@2` deliberately
  carries exactly `id`, `name`, and `provenanceNote`; it cannot itself prove which preserved run node
  supplied the FEN. Campaign needs a derived same-position join with `run.record.position@1`.
- [[D2373]]: `module-registration` calls its accepts image final while consuming four v1 families
  that `evidence-value-authority` retires. The replacement is 4 retired refs to 8 successor refs.
  Across consumers this changes 207+R declared pairs to 215+R, while the two existing awaiting rows
  preserve the compiled delta at 213+R. The unique projection population changes 117 to 121.

## Ownership

`evidence-value-authority` owns the position-level `named_structure@2` factory and all generic
consumer migration. `campaign-catalogue-progression` owns a narrower run-bound derived sighting.
`module-registration` consumes the complete successor image only after the value-authority contract
lands, regenerating its sealed artifacts from the manifest rather than hand-editing JSON.

No lane introduces learner judgement, new chess detection, or content migration.
