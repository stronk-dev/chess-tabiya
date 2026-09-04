# Longitudinal store — sixth fresh independent buildability review

- **Date:** 2026-09-04
- **Reviewer:** codex, independent of the sixth author repair
- **Input:** `rfc/longitudinal-store.md` after the [[D2570]]–[[D2574]] repair
- **Verdict:** **returned on [[D2598]]–[[D2602]]; no migration, worker, reader, consumer, API or
  client implementation is authorized**
- **Executable reproduction:** `make longitudinal-store-sixth-fresh-review` — 5/5 blocker controls
  plus strict TypeScript pass

## What survived re-review

The sixth repair closes the four fifth-return seams it names. It records a monotone three-state
structure disposition, gives all three read-row families exact surface types, keeps revision-1
imports observed-only, and defines deterministic query/filter syntax. The earlier author controls
remain valuable evidence for those bounded properties.

The complete store still is not buildable. Applying the new row parser to the denominator algebra,
the source digest to hostile process input, the operation census to production symbols, and
same-head invalidation to the RFC's full durable job lifecycle found five new false-green
boundaries.

## Blocking findings

### [[D2598]] — family opportunities can exceed decisions

Both the proposed STRICT DDL and `parseLongitudinalObservationRow` enforce
`occurred <= opportunities`, but neither enforces `opportunities <= decisions`. The executable
control constructs one owner decision with two distinct family-opportunity references; it passes
the parser. That state contradicts the RFC's own denominator meaning—one family opportunity is
counted at most once per decision—and can inflate every downstream rate, skill and style feature.

Repair the SQL CHECK, parser and authoritative projector-equality tests together. Cross the exact
`0 < opportunities <= decisions` boundary and retain independent family denominators.

### [[D2599]] — callers can invent the projection/sign registry

Both public parsers take `ProjectionAdmission[]` from their caller. Passing a fabricated
`invented.editorial.grade@77` declaration admits both a stored observation and a matching read
filter. The parser therefore proves consistency with supplied data, not membership in the literal
ingest registry promised by the RFC.

Bind read and row parsing to one compiled, immutable registry authority. A JSON/process caller may
choose filter values but must have no operand capable of widening valid projection/version/sign
pairs.

### [[D2600]] — the source identity has no parser or sealed constructor

`LongitudinalSourceImageV2.runPrefix` is `unknown`, its other operands have no exact parser or join,
and `sourceDigestV2` accepts the caller object directly. The control gives it an invented run
prefix, duplicate event authorship and negative import length; those bytes receive an authoritative
digest. Mutating the same nested object changes the digest after acceptance. Nothing proves replay
equality, authorship-to-prefix correspondence, canonical ordering, uniqueness or immutability.

Construct one brand-sealed recursively immutable source image from the exact replay authority and
resolved storage inputs. The digest constructor must accept only that image, and negative fixtures
must cross malformed, extra, duplicate, unsorted, foreign-prefix and post-construction mutation
arms.

### [[D2601]] — the source-mutation closure is not set-equal

`LONGITUDINAL_SOURCE_MUTATION_OPERATIONS` is a hand-written tuple. The new author tests check only
that `createLiveSession` and `grantRole` are members; no test derives or compares the production
transaction population. The tuple even contains `startupLegacyClassification`, which has no
production symbol. Omissions, surplus labels and renames all remain green.

Derive the exact population from production storage/application transaction symbols, classify
each as always/conditional/suppression/reconciliation, and fail both missing and surplus entries.
The same operation must prove it updates the source watermark atomically, rather than merely share
a spelling with the register.

### [[D2602]] — same-head invalidation excludes most durable job states

The RFC promises a changed source digest resets **any non-pending job**, clears its claim/failure
schedule and invalidates an old lease. The sixth model's `ModeledJob` contains only
`pending | complete` and omits claim token, worker, lease, retry and failure fields. Its new test
therefore cannot represent `running`, `retry_wait` or `quarantined`, let alone prove full cleanup
and stale-token refusal for collaboration-only source changes. The strict type fixture makes that
exclusion executable.

Reuse the exact durable job state union and reset/CAS tuple already required elsewhere in the RFC.
Cross pending no-op plus complete, running, retry-wait and quarantined invalidation at an unchanged
event head; old claims must fail renew, fail and publish.

## Required next author round

Treat the repair as one authoritative derivation boundary, not five local checks:

1. make rate algebra impossible to corrupt at SQL, parser and projector layers;
2. remove caller authority over admitted projections/signs;
3. parse, seal and construct source identity from replay/storage truth;
4. derive source-mutating operations from production transactions; and
5. apply the exact full-state reset/CAS on every event-head or source-digest change.

Retain every earlier author control and these five fresh negatives. Another genuinely fresh
independent review remains mandatory before acceptance or implementation.
