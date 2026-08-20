# Pack primitive stability and migration cost

**Question:** Is the drill-pack foundation stable enough to expand authored content without repeatedly
rewriting it as evidence, guidance and theory primitives improve?

**Verdict:** **No — Gate F correctly remains closed.** The current schema admits every current pack
and most evolution has been additive, but JSON-schema validity is being used as a proxy for semantic
capability compatibility when it cannot establish that. Packs do not identify the format or evaluator
capabilities they require; one schema ID named both invalid and valid artifacts; no reusable pack
migration ladder exists; and four declared primitive families have zero pack witnesses. The safe next
step is a capability/version and migration contract plus a deliberately small sacrificial pilot, not a
large content wave. `[V]` (`tools/r6-pack-stability-harness/output.json`; `planning/platform-alignment/plan.md` Gate F)

## Method and population

The disposable R6 instrument reads every Git revision of `schemas/drill_pack.schema.json`, extracts
the pack corpus at each revision, compiles every valid historical schema with Ajv, and validates in
both directions: historical documents under today's schema and today's documents under each
historical schema. It never checks out or rewrites an old tree. It also counts content co-changes,
current primitive use, version stamps and sidecar populations. `[V]`
(`tools/r6-pack-stability-harness/README.md`; `tools/r6-pack-stability-harness/analyze.mjs`)

The current population is **92 schema-governed pack documents**: 56 under `content/drafts/` (50
product drafts plus six browser fixtures) and 36 candidates. All 92 validate under pack schema 0.27.
The compatibility results below are syntax results only; evaluator behaviour and ignored fields are a
separate axis. `[V]` (`tools/r6-pack-stability-harness/output.json#/current`)

## 1. The syntax history is mostly additive, but not immutable

The schema file changed **27** times and names **25** distinct IDs from 0.2 through 0.27. Fifteen
schema changes also changed content and fourteen changed pack documents. Across those commits the
scoped history records 199 pack-document touches, 103 evidence-sidecar touches, 40 source-sidecar
touches, 39 job-sidecar touches, 13 principle-file touches and 9 shape-file touches; these are file
touches, not unique files or a claim that every touch was caused by migration. `[V]`
(`tools/r6-pack-stability-harness/output.json#/history/mutations`)

Schema 0.13 breaks the immutability premise exactly. Commit `ade1d98` changed the exported constant
and `$id` to 0.13 while the schema contained three literal leading `+` characters and could not be
parsed as JSON. Commit `4f526c3`, 21 minutes later, repaired the artifact while retaining the same
constant and `$id`. A consumer naming 0.13 therefore cannot identify a unique contract. The other
same-ID mutation, `4e40caa` under 0.9, changed only the description; that is still artifact drift but
not a validation-contract change. `[V]` (`tools/r6-pack-stability-harness/output.json#/history`;
`git show ade1d98:schemas/drill_pack.schema.json`; `git show 4f526c3:schemas/drill_pack.schema.json`)

The same class is present, harmlessly, at HEAD: the constant and `$id` say 0.27 while the schema
description says “Living v0.25”. The existing test binds the first two copies, not the description.
`[V]` (`schemas/drill_pack.schema.json:3-5`; `packages/schema/src/drill-pack.test.ts`)

## 2. Compatibility has two different meanings

Backward syntax admission is strong after the evidence-sidecar rewrite. Pack snapshots at 0.16,
0.17 and 0.18 each contain 79 documents, of which the same 20 are rejected by today's schema because
they carry inline `/provenance` properties. Commit `f3cdfe0` (0.20) moved that evidence into sidecars;
from that snapshot onward every historical pack document validates under today's schema. `[V]`
(`tools/r6-pack-stability-harness/output.json#/history/mutations`; `rfc/archive/opening-evidence-path.md` §8)

Forward syntax admission rises from 16/92 under schema 0.2 to 44/92 at 0.14, 61/92 at 0.18,
86/92 at 0.21 and 89/92 at 0.22–0.23. The three documents rejected by 0.23 use the structural success
conditions added at 0.24. From 0.24 onward, however, **all 92 current documents validate**. `[V]`
(`tools/r6-pack-stability-harness/output.json#/history/mutations`)

That final green result is not semantic compatibility. After 0.24 the current corpus gained **82
principle references** and **436 typed graduation entries**; it also carries 147 deviation-cost
records whose meaning depends on a reader, not only a validator. All 92 documents still validate
against 0.24 because older nested shapes were permissive and a validator does not prove that an
older runtime reads a newer optional field. An older self-host can therefore accept a document whose
intended capability it silently ignores. `[V]` (`tools/r6-pack-stability-harness/output.json#/current`;
`rfc/archive/claim-backing.md` §3.10; `rfc/archive/pack-graduation.md` §4)

**DESIGN-GAP:** “valid JSON under this schema” is necessary but is not a deployment capability
handshake. A pack needs a machine-readable requirement set (or a bundle version from which that set
is derived), and a runtime must publish what it implements and refuse the missing requirement by
name. `[M]` synthesis from the measured false-green case above.

## 3. Current primitive coverage is not a v1 pilot

| Primitive family | Occurrences / packs | Gate-F reading |
|---|---:|---|
| feedback claims | 196 / 50 | Broadly populated; delivery/grounding remains separate |
| deviation cost | 147 / 27 | Machine-stamped path has real use |
| shape references | 44 / 38 | Broad reference coverage, not consumer usefulness |
| timing windows | 4 / 4 | Thin pilot only |
| deviation mistake | 7 / 7 | Human-judgment field; migration must not infer it |
| transition feature | 4 / 3 | Thin pilot only |
| plan consequence | 3 / 3 | Thin pilot only |
| variant/retry relations | 11 / 9 | Sparse; `retryVariants` is already refused by disposition |
| stated reasoning | 1 / 1 | Browser fixture only |
| engine condition | **0 / 0** | Unexercised |
| per-leg shapes | **0 / 0** | Unexercised |
| per-leg opponent policy | **0 / 0** | Unexercised |
| prediction | **0 / 0** | Unexercised |

All counts are over the 92-document population and come from structure-aware traversal, not text
search. `[V]` (`tools/r6-pack-stability-harness/output.json#/current/capabilityUse`)

This is the failure mode the content hold anticipated: `FORMAT_DISPOSITIONS` says per-leg shapes and
opponent policy are reached and names code sites, but no committed pack exercises either declaration.
A declaration census can prove a reader exists; it cannot prove the authoring/runtime/client chain
works. `[V]` (`packages/schema/src/drill-pack/dispositions.ts`; output above)

## 4. Migration cost splits at the law-8 boundary

The historical migrations give three distinct classes:

| Change | Measured content exposure | Nature |
|---|---:|---|
| 0.20 evidence relocation (`f3cdfe0`) | 20 packs plus 20 each evidence/source/job sidecars; ~240 s re-measurement budget in its RFC | Mechanical traversal plus a real engine run; explicitly no reclassification and no new prose |
| 0.23 engine leverage (`18d2832`) | 20 packs plus 59 sidecars; 147 current cost records across 27 packs | Instrument derives and stamps numeric cost; `mistake` remains human-only |
| 0.26 principle backing (`5a63225`) | 35 packs, 29 ledgers, 13 principle entries | Semantic assignment: the RFC calls the partition an authoring judgment |
| 0.27 graduation typing (`2ce89c2`) | all 92 pack documents and 32 ledgers | Mixed: deterministic wrappers/default-blocking are mechanical; 203 entries required hand audit in the RFC |

`[V]` (`tools/r6-pack-stability-harness/output.json#/history/mutations`;
`rfc/archive/opening-evidence-path.md` §8; `rfc/archive/engine-leverage.md` §2.2;
`rfc/archive/claim-backing.md` §3.10; `rfc/archive/pack-graduation.md` §4)

No reusable pack migration ladder exists at HEAD. The production run/storage side provides the
counterexample: snapshots carry `schemaVersion`, storage migrations are contiguous and ordered, and
tests exercise historical stamps. Pack changes instead land as one-off scripts or in-commit rewrites,
and current pack documents carry no `$schema`, `schemaVersion` or required-capability field. `[V]`
(`apps/server/src/storage.ts` `assertContiguousMigrationVersions` and migrations;
`apps/server/src/storage.test.ts`; `schemas/drill_pack.schema.json`)

The honest budget is therefore not one invented number of minutes. Mechanical migration must be
**100% plan-able and dry-runnable over all 92 packs plus sidecars with zero chess judgments**.
Semantic migration must enumerate its judgment population, refuse automatic assignment, and remain
pilot-sized until the owner sets a maximum re-author budget. The observed upper exposure is already
all 92 documents plus 32 ledgers in one format wave; the observed judgment wave touched 35 packs and
13 principles. `[V]` for populations; `[M]` for the proposed budget rule.

## 5. Sidecars are not coordinated with pack capabilities

There are 96 current sourcing sidecars: 32 each naming `tabiya.sourcing.evidence.v1`,
`tabiya.sourcing.job.v1` and `tabiya.sourcing.manifest.v1`. Only one claim binding exists. The
evidence string remains v1 while record kinds and the optional `claimBindings` shape evolve; no
register coordinates that contract with the pack schema or evaluator version. This confirms D499
rather than creating a separate duplicate defect. `[V]`
(`tools/r6-pack-stability-harness/output.json#/current`; `design/BACKLOG.md` D499)

Digest coupling is useful but insufficient. Pack changes stale evidence `packDigest`, which makes
re-binding visible, but a fresh digest says only “this sidecar names these bytes”; it does not say the
runtime implements the semantic capability those bytes invoke. `[V]` for current digest mechanism
(`packages/schema/src/drill-pack/digest.ts`; `rfc/archive/pack-graduation.md` §4.5); `[M]` distinction.

## 6. Stable extension and migration model for F3

R6 supports the following input to a future RFC; it does not itself authorize implementation:

1. **Immutable released artifacts.** Each resource version maps to one parseable digest. CI replays
   every released schema fixture and refuses same-version drift. Human descriptions derive from the
   same build info rather than carrying a third version copy.
2. **Capability requirements, not validator optimism.** A pack bundle declares or deterministically
   derives required capability IDs with semantic versions. A deployment publishes supported IDs and
   refuses a missing/unsupported requirement before registration.
3. **Version behaviour, not only fields.** Evaluator semantics such as structural predicates and
   evidence-kind meanings receive identifiers independent of the JSON property that refers to them.
   Adding an optional capability is additive; changing the meaning of an existing ID is forbidden.
4. **One migration registry.** Every format/capability transition has a pure read-only planner and a
   separately invoked applier. The planner reports pack, sidecar, digest and refusal consequences.
   Mechanical steps are reproducible; chess/provenance judgments are emitted as unresolved work,
   never guessed.
5. **Deprecation has a successor or a refusal.** The existing `FORMAT_DISPOSITIONS` model is the
   precedent, but coverage expands to every pack capability and evidence resource. A removed value
   keeps its meaning until migrated; it is never silently reinterpreted.
6. **A sacrificial official pilot proves the chain.** The smallest varied set exercises every
   required v1 primitive through authoring, validation, runtime, consumer, responsive interaction and
   provider-off/abstention paths. Zero-use primitives are either exercised or removed from v1.

`[M]` synthesis constrained by the measured failures and the run-storage precedent above.

## Gate F result

| Gate-F clause in R6 scope | Result at 2026-08-20 |
|---|---|
| No active drill-pack schema lane | **FAIL** — accepted `graduation-clearance` holds 0.28; 0.29 is next free. The draft `pack-population-provenance` proposes 0.29 but has no live claim until accepted/registered. |
| Shared resource/register agrees with tree | **FAIL** — D499 and draft `shared-resource-registers` remain open. |
| Capability/deprecation policy | **PARTIAL** — 12 `FORMAT_DISPOSITIONS` rows exist, not a general pack/runtime handshake. |
| Whole-corpus automatic migration dry-run | **FAIL** — compatibility census exists; a selectable migration ladder does not. |
| Non-mechanical re-author budget | **FAIL** — exposure is measured, owner limit is unset. |
| Pilot exercises every required primitive | **FAIL** — four declared families have zero documents and several have only one to four. |
| Current syntax validity | **PASS, necessary only** — 92/92 validate under 0.27. |

`[V]` (`rfc/README.md` pack register; `packages/schema/src/drill-pack/dispositions.ts`;
`tools/r6-pack-stability-harness/output.json`).

R6 is answered as a negative gate result. It unlocks the **shape** of F3 and narrows O6, but it does
not unlock an RFC, lift D560, or authorize pilot content beyond the already-permitted disposable
sacrificial set. R8/R10 and owner rulings remain O6 dependencies. `[M]` process consequence from
`rfc/0000-rfc-process.md` and `planning/platform-alignment/decision-queue.md` O6.
