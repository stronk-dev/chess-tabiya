# AssistanceConfig register — repeat independent process/buildability return

**Reviewed:** 2026-08-28

**Reviewer:** codex

**Document:** `rfc/assistance-config-register.md` after the [[D1916]] amendment

**Verdict:** **RETURNED AGAIN.** The current-head drift repair works, but C9 still does not preserve
the history or enforce the single writer across the actual landing transition, and the required
claim/status edits contradict their owning product RFCs. Implementation remains unauthorised.

**Executable reproduction:** `make assistance-register-repeat-review` — 4/4. The repaired D1916
author contract is stable at `make assistance-register-contract` — 7/7.

## Method

The pass re-derived the amended C9 snapshot algebra against the live register checker, the four
historical `AssistanceConfig` commits, current runtime/web codec split, and exact `hint-distance` and
`intent-presets` bytes this process RFC says to edit. All four historical commit anchors and the
current 4/9/22 tree counts are correct.

## What survives

- `AssistanceConfig` is a rule-7 shared resource with one sequential writer;
- TypeChecker-resolved literal domains are the right formatting-insensitive tree authority;
- a live claim cannot mask current-head/digest drift after [[D1916]];
- the recovered v1–v4 commit history is factually correct;
- v5 belongs to Guided Hint and presets depend rather than competing for a second claim;
- browser codec parity remains correctly in D1629 rather than widening this process RFC;
- the dedicated derived-output arm and product-byte-free implementation boundary remain sound.

## Blockers

### 1. Historical landed rows are not closed ([[D2009]])

C9.5 and generic C4 require only that the current head occur in the Landed table. Deleting heads
1–3, inserting a gap or duplicating a historical row leaves head 4, digest and lane-5 checks green,
despite criteria 7/11 promising the recovered four-row history.

**Repair:** require unique contiguous numeric heads `1..head`; initialize the four rows against the
pinned commit identities and enforce append-only staged/first-parent transitions thereafter.

### 2. The v5 claim names a forbidden symbol ([[D2010]])

The exact claim reserves `validV5/migrate v1-v4 to v5`. Guided Hint §5 instead deletes the web
validator and specifies one runtime `parseAssistanceConfig`/migration operation; criterion 19 fails
if a parallel `validV5` exists.

**Repair:** name the literal runtime codec/export and migration authority from the owning RFC in
both the declaration and README row. Do not use an implementation name that acceptance forbids.

### 3. The mandatory status correction is itself stale ([[D2011]])

The process RFC orders three `intent-presets` passages from “returned to research” to “awaiting
independent review.” Guided Hint's D1639 owner ceiling table remains proposed and criterion 20 is
red; its register status says the owner ruling blocks repeat review.

**Repair:** write the exact current state—awaiting the owner ceiling ruling, then repeat review—and
tie the wording to the registered status rather than introducing a second hand-maintained phase.

### 4. Snapshot C9 cannot prove the single writer at landing ([[D2012]])

The positive head-5 fixture contains no live claim. The final snapshot is identical whether the
previous commit contained the valid lane-5 reservation or no reservation at all. C9 therefore
accepts an unclaimed implementation while claiming to enforce one writer.

**Repair:** add a staged/first-parent transition check: the previous committed state must contain
exactly one matching claimant; the staged state may remove it only while adding the next contiguous
landed row and changing the declared symbols. Cross absent, wrong-lane, wrong-owner and valid
claim-to-landing transitions.

## Resume order

1. Add contiguous/append-only Landed history and the previous-state transition receipt
   ([[D2009]], [[D2012]]).
2. Correct the literal Guided Hint claim and preset status edits ([[D2010]], [[D2011]]).
3. Replace the four review arms with crossed author fixtures; run both stable targets, governance
   and `make verify`; then request fresh review.

No runtime, web, schema, storage, content, archive or protected design byte changed.
