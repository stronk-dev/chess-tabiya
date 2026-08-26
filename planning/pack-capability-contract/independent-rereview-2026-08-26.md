# Pack-capability contract — independent buildability re-review

- **Reviewed:** 2026-08-26
- **Input:** `rfc/pack-capability-contract.md` after its six-blocker repair
- **Reviewer:** codex
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Scope:** requirement derivation, digest closure, census identity, deployment state, version
  migration and lifecycle ownership

The first repair genuinely fixed its six named findings. In particular, the per-binding
`claim.binding` grammar now agrees with its consumer, the supported projection replaces the former
whole-registry contradiction, and the D566 case remains the correct falsifier to design around.

The draft is still not implementable without inventing the most important semantics. The mandatory
pack stamp has no dependency graph; the proposed source-region identity cannot isolate the actual
D566 helper change; deployment states used by criteria 8/16 do not exist in the declared type; the
census has no reproducible identity procedure; and the version assertion rule has no precise
migration boundary. Later process audits also found completion work whose destinations still do not
exist. No lane-0.30 implementation or corpus mutation was started.

## What survives unchanged

- Pack/runtime semantic compatibility is a real foundation requirement. A pack that depends on an
  evaluator version the deployment cannot provide must fail honestly before use.
- Capability identity must be structured data, not a second collection of free suffix strings.
- Evaluator ordering, default tables, resolved shapes/principles and prose conventions are semantic
  inputs; versioning JSON vocabulary alone would repeat [[D566]].
- A read-only planner and separately invoked applier are the correct separation.
- The corpus write remains held by [[D560]]; review and mechanism design may proceed, application may
  not.
- `unsupported` and transient provider failure are different operational facts. The owner's two-cause
  ruling stands; this return requires making it representable.

## B1 — no graph can derive the mandatory pack requirement set ([[D1620]])

`CapabilityDeclaration` contains `id`, `version`, `subject`, `sites`, optional convention text,
digest and disposition. It has no applicability predicate and no dependency edges. The pack stamp
contains only `{id, version}`. Section 3 narrows manifest requirements to three consumers, but a
consumer's accepted projections do not say which authored pack construct invokes which projection,
verdict producer, default table or transitive helper.

That makes criterion 3 impossible to implement from the contract:

- stamp only the authored leaf and inherited objective/guard/default semantics are omitted;
- stamp every registered capability and the explicit “declares one capability it does not use”
  negative fixture fails;
- infer the mapping in code and the derivation function becomes the unversioned authority the RFC
  says it is avoiding.

This is especially visible for omitted fields. Eighty-five packs inherit guard defaults according
to the source derivation, so absence itself invokes semantic tables. `objective.state_machine` and
its first-match ordering can affect a pack without appearing as a literal vocabulary member.

**Required amendment:** publish a literal, versioned capability dependency/applicability graph. A
leaf maps to the exact direct evaluator capabilities it invokes; dependencies close transitively;
defaults have explicit absence selectors; resolved shape/principle identities join through typed
edges. The graph participates in its own digest. Negative fixtures must fail both one omitted
transitive dependency and one extra unrelated capability, including an omitted-field/default case.

## B2 — module + symbol cannot provide the promised D566 digest grain ([[D1621]])

The actual conservative pawn-reach repair is commit `e3c239ce`. In
`packages/runtime/src/structure.ts` it changed `pawnSafetyOnPosition` (`safe` gained the
`captureAttackers` condition) while the `pawn_safe_square` and `outpost` branches in
`matchesStructuralFeature` continued to call `pawnSafety`. That is precisely the helper-change
shape a semantic digest must catch.

The RFC never defines `CapabilitySite`; its only normative description is “module + symbol”. At
that grain:

- digest `matchesStructuralFeature` and one branch edit changes the digest for all eighteen
  structural-feature declarations sharing that symbol;
- digest only that symbol's call text and a helper-only semantic change is invisible;
- add `pawnSafetyOnPosition` manually and the registry needs the dependency graph and closure rule
  missing in B1;
- name a switch arm as a pseudo-symbol and the source extractor/canonical identity is invented by
  the implementer.

The RFC also omits canonical byte selection, symbol/arm ordering and whether formatting, comments,
imports, constants and transitive callees participate. Two conforming implementations can therefore
compute different digests from the same tree.

**Required amendment:** define a canonical AST-backed `CapabilitySite` that can identify a whole
symbol or a specific exhaustive arm, plus declared semantic dependency edges. Specify canonical
serialization and ordering. The D566 fixture must change only the helper body and prove that
`pawn_safe_square` and its dependent `outpost` capability invalidate while an unrelated structural
arm does not. A count-only or whole-function digest does not satisfy the criterion.

## B3 — semantic disposition and deployment reachability are conflated ([[D1622]])

Section 5 declares:

```
reached | deprecated | withdrawn | refused | unmeasured
```

Sections 4.2, 5.1 and criteria 8/16 then read registry rows whose kinds are `unsupported` and
`temporarily_unavailable`. Neither kind is representable. No separate deployment-state record is
defined.

The claimed reuse of existing vocabulary does not close this:

- `AvailabilityMode` is static producer provenance (`local | recorded | provider | build_time`);
- `ProviderOffBehavior` is a consumer behavior (`available | honest_empty | unavailable`);
- `FORMAT_DISPOSITIONS` currently carries `reached | refused | retired | unmeasured`;
- `CAPABILITY_DISPOSITIONS` currently carries `reached | refused | unmeasured | impossible`.

Those are four different axes. The draft neither maps `retired`/`impossible` into its semantic
union nor migrates the 44 instrument rows in `CAPABILITY_DISPOSITIONS`. Criterion 8 additionally
calls all twelve `FORMAT_DISPOSITIONS` entries `vocabulary_arm` declarations, although five are
assistance/error/container/reference records rather than union arms.

The request-time consequence is also unspecified. “503, retryable, run survives” names an outcome
but no operation boundary, typed error payload, event/state transition or recovery rule. A provider
can disappear after registration and every pack consumer does not share one HTTP request shape.

**Required amendment:** separate immutable semantic disposition from deployment reachability. Give
both closed types, a total projection from both current registries, and a per-capability provider
binding. Define the operation-level unavailable result and run-preservation transition. Fixtures
cover boot-without-provider, provider dies after registration, recovers in-process, local/build-time
impossibility of transient state, and migration of `retired` and `impossible` without semantic loss.

## B4 — the census still cannot be independently generated ([[D1623]])

`make capability-census` is described through four roots, but the identity procedure is absent:

- the schema has 52 `$defs`, many of which are objects rather than closed vocabularies;
- there is no canonical function mapping a JSON pointer/member to the dotted capability id;
- an exhaustive `never` switch does not encode which pack vocabulary it interprets;
- searching every such switch in the tree includes unrelated runtime/UI unions;
- root 3 cites “§3e (13)” and “§3f (16)”, but those subsections do not exist in the RFC and the
  29 identities are not enumerated there;
- the manifest is absorbable by reference, but it has moved since drafting.

Set equality between a generated set and declarations cannot detect a subject omitted from both
sets. A baseline cardinality catches movement, not a semantically misjoined or swapped identity.

**Required amendment:** publish the exact root inventory and id-generation grammar, or introduce
checked source annotations from which both sides derive. Named evaluators/tables must be literal
normative rows, not a count in a planning dossier. Negative fixtures add an unannotated schema union,
an orphan interpreter switch, a missing named evaluator, an extra declaration and a count-preserving
swapped id; all must fail differently.

## B5 — the live baselines have drifted and one headline count is false ([[D1624]])

Re-derived at HEAD with the RFC's named instruments:

| Claim | HEAD on 2026-08-26 |
|---|---|
| evidence manifest | `make evidence-manifest-check` = **37/193/25/210 core**, 67/67/15/1 semantic; the RFC still says 188 projections |
| `FORMAT_DISPOSITIONS` | **7 reached / 3 refused / 1 retired / 1 unmeasured**; the status paragraph says 5 refused |
| primary repaired census | 206 before manifest projections; §4.3 still calls the handshake a generalisation from 7 to **191** |
| sidecars | 68 carrying `tabiya.sourcing.evidence.v1`; this repaired number still reproduces |
| schema `$defs` | 52; this repaired number still reproduces |

The existence of unsupported capabilities remains true; the asserted evidence for it is wrong.
The manifest movement is exactly the drift this RFC says should redden a baseline, so an acceptance
review cannot waive it as editorial.

**Required amendment:** regenerate every baseline from executable output in one author round and
state separately: subject-census size, manifest-projection size, union/deduplicated registry size,
and pack-requirement scope. The status line and `rfc/README.md` must not hand-copy current totals
unless a checker binds them.

## B6 — the version migration boundary is undefined ([[D1625]])

Section 2.1 says existing `name@1`/`name@v1` identifiers migrate by parse, not rewrite, while also
stating that version is never a suffix inside a string literal. Criterion 5 demands zero hardcoded
suffixes in a test/checker assertion. A tree scan currently finds 135 `@1`/`@v1` occurrences in
test/checker files under `apps`, `packages` and `tools`, including exact wire payloads, compatibility
fixtures, current-id constructors and disposable research instruments.

Some of those should remain exact serialized-compatibility tests; some should construct from
structured data; some are outside production scope. The RFC provides no AST definition of
“inside an assertion”, no legacy boundary and no migration inventory. A grep cannot implement the
criterion, and two reviewers cannot reproduce the same result.

**Required amendment:** list the persisted/API fields that remain legacy serialized strings, the
internal fields that become structured, and the compatibility lifetime. Define an AST-level rule
that bans suffix literals only where a current id should be constructed from structured authority,
while permitting named legacy-wire fixtures. Bake the migration population and negative fixtures.

## B7 — completion ownership still has dead destinations ([[D1626]])

The later scope/deferral audits correctly identified lifecycle residue that the six-blocker repair
did not address:

- Discharge D2 points to F7 pilot membership, but no F7 RFC exists;
- D4 promises “the follow-up RFC” for `EVIDENCE_KINDS`, but that RFC does not exist;
- seven row outcomes live in §8's free-prose lifecycle table instead of the checked Discharges
  register because the owner vocabulary was inconvenient;
- digest-staleness fatality remains “deferred” with no id/owner;
- `checkpointInteraction` arity is assigned to “whoever next edits that row”.

An accepted RFC may have open discharges. It may not claim a completion protocol while pointing
those discharges at absent or anonymous actors.

**Required amendment:** give every obligation an existing file/id and accountable register owner.
If F7 or an evidence-kind contract is real, draft/register its gated work before naming it; otherwise
keep the obligation in this RFC. Move implementation effects into Discharges or a machine-checked
equivalent. Reconcile the checkpoint row now or assign it to a literal existing document.

## Owner decisions

None are newly required. The owner already ruled declaration in the pack, the two deployment
causes, and the D560 hold. All seven blockers are specification, derivation or lifecycle work.

## Resume order

1. Amend the contract with the literal capability inventory, id grammar and dependency/applicability
   graph.
2. Define capability-grain AST regions plus semantic dependency closure; make the helper-only D566
   fixture pass at exact grain.
3. Separate semantic disposition from deployment reachability and map both shipped registries.
4. Pin the legacy/structured version migration and refresh all executable baselines.
5. Re-home every discharge and update the active register.
6. Repeat independent buildability review. Only after owner acceptance may planning for lane 0.30
   begin, and corpus application remains held by [[D560]].
