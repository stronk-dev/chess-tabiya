# Module registration — third fresh independent buildability review

**Date:** 2026-08-30

**Reviewer:** Codex, independent of the third author repair

**Verdict:** **RETURNED.** Making the artifacts requirements-only is the correct architectural
boundary: learner modules consume sealed evidence pools and do not become another collector.
Five executable inconsistencies still prevent those requirements from describing a buildable
producer→module→seat path. No production implementation is authorised.

## Reproduction

`make module-registration-third-fresh-review` passes 5/5 and reproduces the blockers below.
`make module-registration-author-contract` remains green 11/11. The RFC's separately named
`make module-evidence-assembly` target is red on the Guided Hint image mismatch, which is itself
[[D2343]]. The fresh harness is disposable review evidence, not production code.

## Blocking findings

### D2343 — the repaired author image breaks its named assembly authority

The third repair correctly makes `guided_hint` an explicit empty key so a missing family×rung
registry cannot pass by omission. `tools/d1865-evidence-assembly-harness`, which the RFC calls the
current exact source, still omits that key and asserts its local `MODULE_ACCEPTS` deeply equals
`AUTHOR_MODULE_ACCEPTS`. `make module-evidence-assembly` now fails one of thirteen tests.

Use one canonical algebra that can distinguish non-hint pairs from an explicitly blocked hint
population, and make the author and assembly targets agree. Do not delete the explicit key or turn
zero into success.

### D2344 — subject grain is inferred from producer family

`subjectFor(producer, stage)` assigns grain by broad producer id. Consequently
`derived.material.reading.role_signature@1`, an exact FEN/position reading in
`breadth-collectors`, is stamped `edge/same_edge_context`; `derived.grade.move_quality@1`, a
per-played-move comparison used by Post-commit Nudge as well as Review, is stamped
`run_prefix/same_frozen_prefix` solely because its producer is `derived.grade`.

Subject grain must be declared by the exact projection or sealed operation profile. Cross a
position reading, a played edge, a branch pair and a frozen Review prefix; producer family is not
an identity authority.

### D2345 — the external source-input node cannot inhabit its consumers

The one `run.record.move@1` source-input row declares `subjectKind: run_prefix`. Nine derived rows
consume it: eight join on `edge/same_edge_context`, while `derived.compare.piece_route@1` joins on
`branch_pair/declared_branch_pair`. The current graph closure checks only that the id exists, so
all incompatible joins pass.

Declare grain-specific sealed views or one explicit, typed projection between grains. Graph
validation must compare each input node's grain to the derivation join and reject this image.

### D2346 — pair timing ignores upstream operation applicability

The RFC requires `module timing ∩ projection/operation timing`, but the generator writes
`timing: policy.timings`. None of the five sealed-pool contracts declares timing or subject
applicability. The artifact therefore advertises `derived.tactic.defender_exposure@1`, acquired
from the recorded semantic path, in Threat Radar's `precommit` arm as well as `postcommit`.

Each upstream sealed operation needs a typed timing/subject image. Compile the complete non-empty
intersection per consumer/projection pair and make a recorded-only event at pre-commit fail.

### D2347 — the form requirements silently remove `list`

The shipped module contract maps `card` to both `panel` and `list`. The disposable
`AUTHOR_MODULE_POLICIES` table copies expanded evidence forms but omits `list` for every module
that declares a card. The generator intersects against that copy, so, for example,
`module.threat_radar × rules.tactic.consequence.threat` requires only `panel` even though the
projection and module admit the full card image.

Derive forms from the actual module declaration through `MODULE_FORM_IMAGE`, then intersect with
the projection and exact pair adapter. Choosing a smaller convenient subset must fail exactly as
§2.5.2 says.

## Required author return

Repair [[D2343]]–[[D2347]], regenerate both artifacts, and run the author contract, the D1865
assembly contract and this fresh falsifier. Another fresh independent review is required before
acceptance or implementation.
