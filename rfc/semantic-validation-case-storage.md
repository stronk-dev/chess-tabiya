# RFC: Semantic validation case storage

- **Status:** implementing — 2026-11-11; canonical parts, compiler, current readers and Git guard migrated; complete software/performance verification remains.
- **Author:** codex, under the full-foundation and pre-launch zero-legacy rulings.
- **Created:** 2026-11-11
- **Parent / amends:** semantic-validation-authority.md §§4,6 and its owner-authority temporal guard.
- **Work:** [[D4215]], within [[D1716]].
- **Planning:** planning/foundation-source-identity/plan.md.
- **Exploration gate:** executed complete attack-count populations and measured case sizes below.
- **Design refs:** design/02-product-shape.md adoption posture; design/03-product-breadth.md structural reading; ADR-0005.

```tabiya-claims
none
```

## Summary

At drafting, the single canonical case file was 4,913,962 bytes. The prepared 68 king cases would take it to
5,146,462 bytes, leaving 96,418 bytes under the existing 5 MiB guard. Each starting-position
attack-count proof has 20 legal moves, 128 subjects and 43 exact outcome events. The complete
expected events alone require 85,438 bytes per color. Both populations were executed and
compared with independent piece-step and ray arithmetic.

The next two absolute cases already exceed the available space before their inputs or mirror
rules are included. This is a storage dependency of the remaining three source families.
The existing source guard and complete expectations remain requirements.

The initial reader census found 32 direct reader files using the exact case filename or its path constant, plus
the temporal guard CLI as an indirect consumer. The similarly named retired-fixture reader is
independent. Every current reader must use the same case set.

## Implementation checkpoint — 2026-11-11

The index now names two schema-1 parts containing exactly the original 1,524 cases in
order. Thirty consumer files, the compiler and the extracted build/test Git guard use the
shared loader. The pure runtime module has no filesystem or tree-reading dependency.

All 1,524 canonical cases pass over 89 subjects, 19 qualified. The complete receipt comparison
preserves all case outcomes/targets, 63 population inputs/results, eight external receipts,
89 verdicts and every other field except the three independently clarified hash fields.
The unchanged hashing algorithm recomputes one case digest, 11 operation implementation
hashes and 63 population implementation hashes; operation file lists remain identical.

The migrated reader suite passes 4,754 tests in 28 files. Forty-eight storage/temporal
checks include actual staged and first-parent Git CLI controls. Workspace types and production build pass. D4218 fixes the original Git-reader 1 MiB
buffer failure with explicit NUL-delimited blob reads; a reproduced large-blob regression
and the actual repository staged transition pass.
D4217 separately records two obsolete inventory assertions in the disposable D4167
proposal model; no frozen fixture or original assertion was rewritten.

The complete pre-migration software gate on `847d9ab0` passes 19,272 tests in 573 files
and seven performance tests in four files. The cutover still needs its own complete
software/performance verification and D1 remains open.

## Contract

Keep the public case record schema and all case ids, ordering, authorities, expectations and
profile references. Change only the storage envelope at
`packages/runtime/src/semantic-validation-cases.json`.

The current envelope becomes a closed index.

```json
{
  "schemaVersion": 2,
  "parts": [
    "semantic-validation-cases/foundation.json",
    "semantic-validation-cases/original-pawns.json",
    "semantic-validation-cases/kings.json"
  ]
}
```

Each part has the existing `{ schemaVersion: 1, cases: [...] }` shape. Index order followed by
case order in each part is the registry order. The initial split preserves the exact current
ordered case sequence. Further source waves may add parts under the same directory.

One build/test storage module reads the index and its parts through a repository-relative
text reader. A filesystem wrapper uses that module for the compiler and tests. Git history
and staged checks supply their existing base or candidate tree reader. The module has no
dependency on the runtime evidence issuers and is absent from client and HTTP runtime graphs.

The tree-reading temporal functions currently exported by `semantic-validation.ts` move to
a build/test module. That module imports the existing pure case/profile/authority parsers and
the shared case loader. The CLI and tests migrate to this boundary. The pure runtime module
must not import the storage module, filesystem wrapper or Git-tree transition module.

The index admits only schemaVersion and parts, with version exactly 2 and a nonempty list.
Part references must be unique relative paths directly within the named case directory,
ending in `.json`. Absolute paths, backslashes, traversal, empty names and nested directories
refuse. Missing or malformed parts refuse the entire read. Part envelopes contain exactly
schemaVersion and cases, with version exactly 1 and an array. Every entry is parsed by the
existing case parser. Duplicate case id/version pairs across or within parts refuse.

The loader returns one normalized case document. All current compiler, test, tooling and
history readers migrate to it. No current caller may read the index as a case array or fall
back to a second registry. The deployed reader accepts only the index envelope.

The compiler's existing case digest covers deterministic JSON serialization of that complete
normalized document. A change to an expectation, input, authority or case order changes this
digest. Moving an identical ordered sequence between parts preserves the semantic document.
Per-case execution, authority resolution, population proof and qualification remain as specified
by the parent. The generated receipt retains its existing complete record schema and writer.

## Git history and temporal authority

The temporal guard reads the candidate index and every declared part from its candidate tree.
It independently reads the base tree's own index and parts. Candidate files must never satisfy
base reads, and working-tree files must never satisfy staged reads.
Each complete registry read receives one tree reader for both its index and all parts.
Missing index, profile or part bytes throw before authority comparison. The present helper's
empty-set shortcut for missing candidate data is removed.

The one transition from the existing layout needs a base-only decoder for the historical
schema-1 single-file envelope. It is confined to the guard's base-tree read. Candidate reads
and ordinary compiler/test reads require index version 2. Saved historical case cuts and
archived documents remain byte-identical.

The existing owner-authority requirements remain. An admitted case must resolve to the exact
subject and profile arm, authority row and ruling. A new owner row and admission in the same
commit still refuse. Repartitioning cases cannot hide a changed authority or a new present arm.
Missing parts, duplicate cases and changed case identities must refuse before authority comparison.
There is no caller-supplied list of admitted cases or authority refs.

## Verification

1. Flatten the current cases before and after the split and require exact ordered equality.
   Execute the full canonical writer. Existing case outcomes, target values, population/external
   receipts and verdicts remain equal apart from the three recomputed hash fields below.
   Record the expected storage-digest change.

   Independent clarification, 2026-11-11: extracting the Git guard changes bytes in the
   existing operation import closures. Compare the complete receipts allowing changes only
   to `caseDigest`, `operations[*].implementationDigest` and
   `populations[*].predicateImplementationDigest`. Recompute all three using the existing
   hash rules, require each population hash to match its exact operation, and preserve
   every other field, including operation file lists and all population inputs/results.
   Keeping stale implementation hashes would violate the existing source check.
2. Exercise index and part shape/version failures, missing files, duplicate parts and case
   identities, path escapes and partial reads. Each failure rejects the complete document.
3. Run the actual owner-authority guard across the schema-1 base and version-2 candidate.
   Repeat against staged and committed tree readers. Its existing negative fixtures remain red
   for same-commit authority admission, changed/missing owner rows and crossed subjects/arms.
4. Move a case between parts, change its authority and profile to admit a new row, and require
   the actual temporal guard to refuse. Prove a staged part cannot be replaced by its working copy.
5. Census and migrate the 32 direct references and indirect CLI, with the retired fixture
   reader excluded. Check the new helper's
   absence from client and HTTP runtime graphs. Frozen historical fixtures remain independent.
6. Every part and generated file stays under the existing source-size guard. No raw recording,
   external artifact store or new source-size exception is required.
7. Normal types, canonical validation, governance, production build and complete software/
   performance gates pass. The new source-family qualification waves remain separate.

## Deviations from design

No product behavior or chess convention changes. This follow-up replaces the parent's single
case-file assumption at its explicit registry and Git-history boundaries.

## Open questions

None for the owner. Independent contract and bounded loader reviews are accepted.
The source/temporal adoption is implemented. Complete cutover verification and D1 remain open.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
| --- | --- | --- | --- | --- |
| D1 | Complete storage migration, all reader adoption and temporal guard proof | semantic-validation-case-storage.md | Existing foundation plan and exploration log | |

## Changelog

- 2026-11-11 — drafted from the executed direct-attack case-size finding.
- 2026-11-11 — first independent return corrected the exact reader census, placed the
  tree-reading guard in build/test tooling and required complete reads to refuse missing data.
- 2026-11-11 — independent reviewer accepts the repaired bounded contract. Implementation and all listed proofs remain.
- 2026-11-11 — independently reviewed unconnected loader kernel passes 34 focused tests; full migration and D1 remain open.
- 2026-11-11 — independent review accepts the required guard extraction and the exact three-field hash clarification; all semantic outputs and other receipt fields remain pinned.
- 2026-11-11 — canonical index/parts, compiler,30 consumers and Git guard adopted with exact receipt preservation,4754 reader tests and actual temporal controls. Full cutover gates/D1 remain.
- 2026-11-11 — D4218 transport repair independently accepted after a real staged-gate ENOBUFS failure; large-blob regression red→green and actual HEAD→index pass.
