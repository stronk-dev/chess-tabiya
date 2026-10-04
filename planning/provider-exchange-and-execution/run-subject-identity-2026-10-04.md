# Exact run-subject authority — 2026-10-04

## Scope

Implements the run identity prerequisite of `rfc/provider-exchange-and-execution.md` §2,
tracked by D3360. The byte constructors, historical resolution, recorded-item membership and
authorized `RunService` boundary are implemented. **Not implemented by this checkpoint:**
`POST /evidence/availability`, compiled execution paths, binding source-absence aggregation,
the closed occurrence/source resolver census, Maia occurrence projections or Inspector migration.
No whole RFC, capability or 1.0 milestone is complete.

## Production authority

- `packages/runtime/src/run-subject-digest.ts` owns the three literal domains:
  `run.event_head.v1`, `run.evidence_item.v1`, `run.subject.v1`. Independent Node SHA-256 plus
  the canonical RFC-8785 serializer verifies all three, including their literal domain framing.
  Historical lookup lives in that same byte authority and returns a sequence cut, not a fourth
  wire constructor or a caller-selected domain.
- Event images are validated by the **existing canonical drill-run JSON schema**, not a copied
  event union. The already-pinned Ajv dependencies move to the schema package's production
  dependency list, retaining versions/integrities. Validation never coerces, removes fields or
  supplies defaults. Runtime projection additionally checks the existing state-machine invariants.
- The resolver scans the authorized run's actual historical prefixes. Empty/future heads,
  non-contiguous sequences, crossed runs, unknown heads and corrupt nested events are refused.
  Nodes resolve the named branch/path at that head, without reading the live cursor. Edges resolve
  the exact move event and replay its canonical FEN/UCI/SAN through the shipped recorded-edge
  authority. Equal-FEN/equal-UCI branch occurrences retain different subject identities.
- Resolved subjects are deeply frozen copies of the selected prefix with a private runtime seal.
  A spread/double-assertion clone cannot satisfy a recorded-item lookup. Attachment lookup scans
  only that sealed prefix and recomputes the complete attachment event digest, not just its payload.
  Cross-head and post-head items cannot resolve. The byte constructor is not an authorization grant;
  membership and ordering are proved by the resolver from server-owned events.
- `RunService.evidenceSubjectAccess` and `evidenceItemAccess` call the shipped `requireRead`
  authority before event resolution. Unauthorized reads touch zero events. Actual grant/revoke
  tests prove access is rechecked, not cached. Absent/crossed/corrupt heads and missing recorded
  items use generic `RUN_NOT_FOUND`; malformed reference shapes use `INVALID_REQUEST`.
  No public provider/cache probe or caller-FEN endpoint is introduced.

## Serialization cleanup and compatibility

D3361 removes one adjacent, identical `minItems: 1` duplicate in the canonical run schema,
exposed by the first production build. Independent comparison of the HEAD and working schema
through the canonical serializer proves **zero parsed-schema change**. The schema version,
all authored content remain unchanged. `make setup` accepts the frozen lockfile. The full software
gate required canonical semantic-validation receipt regeneration: only nine implementation digests
and 53 population predicate-implementation digests changed; all cases, populations, external
evidence and verdicts are unchanged. Freshness of this broad receipt changes seven transitive
capability closures (the coupling already owned by D3358).

Routine compatibility updates retain all 835 prior declarations and append seven version-4
successors (842 total). Independent comparison against **77afe7a7** proves unchanged source and
dependency identities and byte-identical evaluator modules covering 19 unique roots. Canonical
requirements change on 104 documents (92 content packs, 12 schema example/fixtures), with 129
version transitions. Only `packDigest` changes on 68 ledgers; every authored pack/ledger field is
unchanged. `make migration-plan-check` reads 352 documents with zero mechanical, judgement, refusal
or ledger-restamp rows. No checker was weakened and no further owner decision was requested.
See `run-subject-metadata-2026-10-04.json` for the independently derived counts.

The literal package-export inventory admits only the new identity subpath, retaining all evidence
mint/dispatcher/factory exposure prohibitions. The first full software run caught this missing
inventory entry; it was not weakened into a wildcard. An intermediate run overlapped a helper
rename and was discarded. Final verification runs against frozen source/test bytes.

## Verification

`make run-subject-check`: 12 tests pass (six runtime, six real-storage server boundary tests).
They cover independent digest vectors, historical/current heads, equivalent board occurrences,
complete nested event corruption, caller fields, forged seals, cross-head/post-head attachment
membership, stranger reads and actual grant revocation. The normal software CI tier discovers both
files; `make provider-exchange-check` also depends on this focused target.

`make verify-software`: 2782 tests/320 files, seven performance tests/four files, zero type errors
or Svelte warnings, and all downstream software/source/history/migration checks pass on frozen
source/test bytes. `make verify-content`: 223 tests/23 files, zero clearance errors and all 104
requirement declarations pass. Semantic validation is current: 81 subjects, 38/38 cases, 53
population receipts, eight external receipts and zero fully validated profiles. `make build`
passes for the production server and web; the duplicate-schema-key warning is gone. The existing
web chunk-size advisory remains, not a claimed repair.

`make provider-exchange-check`: 178 focused tests pass, including the 12 new authority tests.
`make test-browser-ci` completes smoke, content, 49 viewport/input-matrix journeys and the
production-default rehearsal: 111 passed, one optional real-Maia latency skip, zero retries.
`make verify-governance` passes, with 3110 durable ledger rows, zero untriaged/unrouted items,
current RFC/work-state/roadmap anchors and unchanged whole capability/milestone states.

Exact-index closeout and normal commit hooks run before commit. No GitHub run, deployment,
full learner availability or latency result is claimed. Unrelated shared edits remain excluded.
