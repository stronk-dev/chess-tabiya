# AssistanceConfig register — independent process/buildability return

**Reviewed:** 2026-08-27

**Reviewer:** codex

**Document:** `rfc/assistance-config-register.md`

**Verdict:** **RETURNED on one process false-green ([[D1916]]).** The rule-7 predicate, semantic
TypeChecker extraction, one head+1 writer, historical heads, alias correction and dedicated output
branch are buildable. C9's live-claim digest exception is not.

## Method

The pass re-derived the runtime interface, browser persistence/migrations, proposed C9 algebra,
register checker structure and Guided Hint/preset ownership. A disposable three-arm harness:

1. executes the proposed C9.2–C9.5 logic on same-head drift with the live lane-5 claim;
2. confirms the current browser parser accepts unknown persisted fields; and
3. confirms the register digest intentionally covers the runtime type rather than the parser.

The latter two reproduce already-routed [[D1629]]. They do not create a duplicate blocker for this
process-only RFC: Guided Hint already owns the runtime codec and persistence conformance matrix, and
the register may land before product v5.

## What survives

- `AssistanceConfig` meets rule 7 and needs one register;
- a semantic TypeChecker projection is the correct way to resolve aliases and readonly tuple
  indexed access;
- head+1 single-writer ownership correctly gives v5 to Guided Hint while presets depend;
- four historical heads and the nine-axis/22-member current shape re-derive;
- the register implementation remains product-byte-free; D1629 remains a v5 product dependency;
- no owner UX/preset/permission decision is introduced by this process RFC.

## Blocker: a future claim masks unversioned current-head drift ([[D1916]])

C9.3 fails a digest mismatch only **while no live claim exists**. C9.4 then accepts exactly one
lane-5 claim at head 4. The proposed logic therefore accepts this state:

```text
README head/digest = v4/original
tree head          = 4
tree digest        = changed
live claim         = lane 5
```

That is not a v5 implementation. It is an incompatible mutation of the currently persisted v4
shape with no version bump, masked by a reservation for a future version. Mutation classes 2–5
test only the **unclaimed** failure, and class 12 tests the claim against an unchanged tree; no
crossed fixture exposes the false green.

The exception is also unnecessary. C9.2 always rejects tree head 5 while the README remains head 4.
The legitimate v5 landing must already move runtime head/domain, README head/digest, landed table,
claim block and live row atomically in one staged commit. There is no valid committed midpoint for a
claim to excuse.

Repair C9 so head and digest always equal the tree on the bytes being checked. A live claim reserves
only `registered head + 1`; it never authorizes current-tree drift. Add crossed fixtures for:

- same-head field/member drift + lane head+1 → fail;
- head-only drift + lane head+1 → fail;
- complete atomic next-head tree/register/landed update with claim removed → pass;
- unchanged current tree/register plus one next-head reservation → pass.

Then repeat the focused independent check. No owner ruling is required.

No production, protected design, schema, content or archive byte changed in this review.
