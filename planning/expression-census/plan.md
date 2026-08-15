# Expression census implementation plan

1. Reuse the shipped authored-spine walker and structural evaluator to enumerate all six host sites.
2. Implement separate coverage and three-valued satisfiability results, including the corrected R1/R6 rules, played witnesses, evaluator faults, and degeneracy probes.
3. Add the report-only CLI and opt-in shape-check corpus/probe/multi-file surfaces without changing pack-check or the verification gate.
4. Update canonical docs and lifecycle records; run both gates before and after archival.
