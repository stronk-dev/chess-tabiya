# D3262 — exact target-identity join

**2026-09-23 · source registration, not a search-arm result.** The sealed D1023 sample
(`sha256:6cdddbffd72d8af93504f808bf012d5ea68b5f9103277bb493e2d1c92984748b`)
contains exact target identities for all 96 selected source rows: 64 material attacker/victim/
baseline-capture records and 32 pawn-controlled minor-destination records. The frozen D3262
manifest carried only `targetFamily`, so passing that manifest directly to a semantic-target
frontier would silently erase the relation the arm must preserve. `[V]`

`d3262-target-register.json` is a byte-checked, source-keyed join alongside—not an amendment to—
the frozen manifest. Its digest is
`sha256:52fc381b0178b84ea0b8ff1b22f097b060ca663ad434c39bfbdfc739c509fc21`.
All 96 source rows join uniquely; none are missing or leftover. They represent **94 distinct
source root-candidates on 62 roots**; two candidates carry two different source rows. A target
belongs to a source observation. Other selected moves at the same root may be tested against
that target, but must not inherit the source row's outcome as their own. The register deliberately
does not copy D1023's `exact` result or convert it into a search verdict. `[V]`

Three of the four additional roots have separate predeclared relation controls: the paired forks
and the bishop-pressure line. The fourth, Carlsbad, has an authored `Nf8` regroup route but no
autonomous semantic-target predicate. Its semantic arm is therefore `no_target`, not a fabricated
plan from knight distance. The target register points at these declarations; it does not
reinterpret them as a common target schema. `[V]`

`make semantic-search-target-register` checks the sealed manifest and exact bytes and runs three
negative-fixture tests. Missing, duplicated, unknown-family, or unjoined source targets fail.
This closes the target-identity input seam only. The five-arm reach/cost/abstention experiment,
including contrastive reasons, remains open under [[D3262]].
