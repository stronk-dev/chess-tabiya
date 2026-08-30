# Module registration — second author repair

- **Date:** 2026-08-30
- **Scope:** [[D2120]]–[[D2126]] only
- **Verdict:** author repair complete; fresh independent review still required
- **Production status:** unchanged; no module implementation is authorized

The repair turns the returned prose populations into two generated, digest-sealed artifacts:

- `rfc/contracts/module-execution-plan-v1.json`: 117 unique compiled projections, each with its
  subject stage, producer family, source file, operation symbol, source family and derived-input
  declaration where applicable;
- `rfc/contracts/module-binding-plan-v1.json`: 205 compiled module/projection pairs carrying every
  mandatory F1 binding field. The two honest-awaiting dependencies remain
  `derived.explorer.population_summary` and `pack.authored.classifier`.

The artifact generator derives both from the current F1 manifest and the literal author acceptance
image. The older D1865 assembly harness imports that same image and asserts exact equality, so the
117-projection execution population, 205 compiled bindings and 207-pair dependency target cannot
drift independently. Operation selection is projection-specific, not a producer-wide shortcut:
the author pass caught and removed false mappings such as castling legality to castling rights and
all tactic projections to loose-piece reading. Every declared source/symbol dynamically resolves
to a runtime callable, and positive fixtures exercise all eight source families through local and
deterministic provider seams.

The RFC now additionally specifies an atomic post-adapter fact-bundle fit across exact fact, word,
mark and arrow identities; a loud `ModuleBudgetReceipt`; an immutable Review prefix with 1..32
paging, 5-second whole-job and 500-ms optional-source budgets, cancellation and final bytes equal
to the single-pass oracle; one total runtime-role projection reused by module and F1 admission;
the closed eight-family Inspector availability algebra; and an acyclic AND/OR same-subject
derivation graph whose inputs cannot be recollected privately.

Verification at the author boundary:

- `make module-registration-author-contract`: 9/9 green;
- `make module-evidence-assembly`: 13/13 green, including exact shared acceptance-image equality.

This is not acceptance. Fresh review must attack callable positive reach, full binding derivation,
post-adapter fit, paged/single-pass equivalence, role refusal, mixed Inspector availability and
derivation failure propagation before implementation may begin.
