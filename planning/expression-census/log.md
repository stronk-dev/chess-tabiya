# Expression census implementation log

## 2026-08-15 — implementation

- Adversarial review approved the corrected leaf-local R1 and scalar-only R6. The register claim remains empty.
- Implementation found one polarity error in acceptance criterion 5: the vacuously true expression is `piece_reach_count(scope: every) atLeast 0`; its surrounding `not` is false on an empty set. The criterion was corrected mechanically rather than teaching the tool a false fixture.
- Added the deterministic `tabiya.authoring.census.v1` report, all six expression host sites, corpus/in-pack/in-shape coverage, evaluator-fault isolation, R1–R8 sound refutations, played SAN witnesses, and legal degenerate probes.
- The current corpus reproduces 43 packs, 694 positions, 159 subjects, 36 corpus-zero subjects, 30 outside-only subjects, and 40 empty in-shape denominators. The committed witness raises one zero-coverage subject to satisfiable, leaving 35 unknown rather than the RFC's empty-fixture estimate of 36.
- `shape-check` now supports `PROBE=`, comma/glob multi-file input, and opt-in `CORPUS=` warnings. A first implementation reran the entire census once per file; a live all-shapes check exposed the multiplicative cost, and the CLI was changed to census the selected set once.
- Pre-archive gates passed: 576 tests across 94 files; 24 browser tests at zero retries (one optional Maia test skipped); Svelte reported 0 errors and 0 warnings.
