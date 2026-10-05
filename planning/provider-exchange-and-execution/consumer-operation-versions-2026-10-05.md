# Exact consumer versions and callable registration

Consumer operations can now register a declared successor without replacing their
version-1 predecessor. The assertion checks exact id/version identities and requires
every declared version in each expected operation family to have its callable.
This implements D3400 under the implemented evidence manifest contract and the
implementing provider-exchange-and-execution §§1–2. It is a prerequisite for the
Explorer migration, not completion of the provider RFC or the full 1.0 foundation.

## Registration behavior

`evidenceConsumerOperation` retains its version-1 default and permits an explicit
positive safe-integer version. Registration and assertion reject malformed versions;
assertion also rejects a non-callable object carrying the expected implementation name.
Exact duplicate declarations cannot overwrite one another. Two versions of one family
may coexist, but a missing successor, wrong callable, duplicate operation or unrelated
replacement cannot satisfy the census.

Current production consumer declarations and bindings are unchanged. No existing
source projection, standalone path or provider operation is retired. The actual
manifest retains 47 producers, 285 projections, 38 consumers and 552 bindings,
with its existing semantic-event and eligibility declarations.

## Canonical maintenance

The shared contract belongs to nine semantic-validation import closures. Its source
change therefore requires the normal generated-receipt refresh even though all
case outcomes, population inputs/results and other receipt fields are unchanged.
The preservation comparison verifies exactly nine implementation digests and 53
population implementation digests, excluding the unrelated held test edits.

Seven dependent capability source stamps require explicit successor versions.
`make consumer-operation-version-metadata-update` performs the existing canonical
sequence: semantic validation, declarations, then the complete preservation proof
before metadata writes. All 942 predecessor declarations and 278 factory outcomes
remain intact. Seven successors produce 949 declarations; only requirement stamps
in 104 documents and 68 ledger hashes change. Authored fields, 192 other source
documents and guard/objective/opponent computations are unchanged. This maintenance
requires no owner ruling and is not additional feature progress. The adjacent
metadata JSON records the actual preservation reading.

## Verification

`make consumer-operation-version-check` passes 61 tests across four files; workspace
types pass with zero Svelte errors or warnings. The actual production manifest check
passes with the unchanged declaration tuple. The adjacent negatives JSON retains
the predecessor failures, sandbox restriction, stale semantic receipt, dependent
capability mismatch and cancelled incomplete retry. No deadline, performance
threshold, source policy or retry count is weakened.

Complete exact-index software passes 3073 tests across 329 files, seven isolated
performance tests across four files and downstream build, packaging, source/value,
history, lifecycle and migration gates. The verified source tree is
`8d58a423c418016694a18d03af18072ba189d243`; the adjacent software JSON retains its exact
receipt. Content passes 223 tests across 23 files, all 104 derived requirements and
zero clearance errors. Complete rebuilt browser CI passes 119 journeys with one
existing optional real-Maia latency skip and zero retries. Complete governance,
final staged-process checks and normal commit hooks validate the tracking closeout.
Source, tests, canonical metadata and tooling remain frozen throughout that closeout.
The tracker closes only D3400; no RFC, capability, milestone or official-content
graduation is claimed. The full 1.0 goal remains active.

## Next Explorer migration

Inspector, repertoire scanning and return frequency still accept different modern
and standalone contracts under their older consumer identities. Their modern paths
currently compile a single projection, not the complete consumer binding image.
Repertoire also acquires its page before that compilation. The next wave must give
modern execution an explicit successor identity and preflight every binding before
provider I/O, while preserving standalone compatibility as its own declared contract.

Do not skip invalid legacy bindings to make the full consumer compile. Do not mint a
sealed whole source from bare statistics, infer availability from one projection or
claim source retirement without its zero-consumer census. Complete manifest execution
and digest integration, exact occurrence resolution, authenticated availability,
whole-source persistence and the other recorded source-contract holds remain open.
