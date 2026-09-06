# Concept registry — third author repair

**Date:** 2026-09-06

## Outcome

The bounded author repair closes [[D2878]]–[[D2884]] at contract tier and closes the historical
review defect [[D2898]] without changing product
schema, storage, registry content, pack content, API, client, archive or protected design bytes.

- the migration uses the shipped `(run_id, branch_id, concept_key)` source identity, reconstructs
  stored runs through `readBackReplay`, and resolves exact full-document digests through
  `PackRegistry.byDigest`;
- `BEGIN IMMEDIATE` precedes receipt, population and artifact reads, and registered, quarantine and
  receipt writes roll back together;
- restart strictly parses its receipt and revalidates registry, input, referenced artifacts,
  disjoint partition and complete output bytes;
- `compileConceptRegistry(headBytes, revisionFiles)` validates the canonical current head and full
  reachable immutable history while retaining exact historical labels/status;
- the six consumer obligations are `path#operation` identities resolved through TypeScript symbols,
  so aliases and barrels work while dead imports fail; and
- label uniqueness uses the literal locale-free `labelCollisionKeyV1`, pinned to Unicode data 17.0,
  with German sharp-s and Greek final-sigma collision fixtures.
- the predecessor review reads its reviewed RFC/storage/model text from exact commit `da3fde39`,
  so a repair cannot mutate the historical evidence and break ordinary verification.

## Executable evidence

`make concept-registry-third-author-repair` retains all predecessor returns and repairs, then passes
7/7 current behavioral groups plus strict TypeScript. The current groups include rollback, malformed
run quarantine, changed registry/artifact/output restart failures, malformed receipt refusal,
historical revision resolution and dead-import/barrel controls.

The target is enrolled in `verify-governance`, so the same contract runs under ordinary local
`make verify` and GitHub's software-independent governance job.

## Boundary

This is author-contract evidence, not acceptance or production implementation. Another genuinely
fresh independent review and the shared-resource-register bootstrap dependency still precede both.
