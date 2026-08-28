# Semantic-convention register — repeat independent process/buildability return

**Reviewed:** 2026-08-28

**Reviewer:** codex

**Document:** `rfc/semantic-convention-register.md` after the [[D1917]]–[[D1920]] amendment

**Verdict:** **RETURNED AGAIN.** The base-id lineage, honest identity-only scope and durable initial
seed survive. C10 still cannot enforce the product landing it exists to govern, and two of its
required authorities are not mutually buildable. Implementation remains unauthorised.

**Executable reproduction:** `make semantic-register-repeat-review` — 6/6. The amended author and
research contracts remain stable at `make semantic-register-contract` — 19/19.

## Method

The pass re-derived the amended C10 contract against the current seven-resource checker, its
required assistance-register predecessor, the exact 39-member seed and source-recovery artifact,
the proposed convention compiler/history contract and the legal empty→landed transition. It also
exercised the version grammar at the JavaScript numeric boundary rather than assuming integer text
maps injectively to `number`.

## What survives

- semantic conventions require a registered, serialized base-id lineage;
- the initial population is exactly 39 sorted unique refs, backed by a stable seed and a separate
  literal declaration/source-recovery artifact;
- membership equality is correctly limited to identities, while semantic bytes need a separate
  append-only authority;
- the empty-tree exception is necessary to preserve no-product-code-before-acceptance;
- prior versions must remain readable, and independent base ids may advance concurrently;
- raw convention ids remain an Advanced-inspector concern rather than learner settings.

## Blockers

### 1. Dependency order makes this the ninth resource ([[D2013]])

The live checker has seven resources. This RFC explicitly waits for assistance-config, which adds
the eighth, then repeatedly calls semantic conventions the eighth. The prior D1920 correction was
right only before the dependency order changed.

**Repair:** derive the count after the predecessor and say ninth everywhere the future state is
described. Do not rewrite the historical D1920 observation.

### 2. Snapshot C10 cannot prove the claimant at product landing ([[D2014]])

The legal product commit removes the live claim while adding the 39 tree declarations and Landed
rows. Its final snapshot is byte-identical whether the previous commit contained the sole exact
claim or no claim at all. C10 therefore cannot enforce the ownership transition it promises.

**Repair:** reuse the transition-capable staged/first-parent primitive repaired for C9. Require the
previous committed register to contain exactly one claimant whose exact refs and changed-symbol
authority bind the new declarations/Landed owner. Cross absent, wrong-owner, partial-set and valid
39-member claim→landing transitions.

### 3. Tree authority and product source are incompatible ([[D2015]])

C10 requires one exported **literal** `CONVENTION_DECLARATIONS` array and refuses computed refs.
The product RFC instead makes `initial-declarations.json` the reviewed declaration authority and
says the compiler expands each row. It never publishes the exact exported array construction. A
straightforward JSON map is computed and therefore fails C10; a second literal array duplicates the
authority with no generator/equality contract.

**Repair:** choose one buildable source boundary. Either define a checked generator that emits the
literal tree authority from the reviewed artifact, or teach C10 to inspect one canonical compiled
declaration source whose schema and product compiler both validate. Cross missing/extra/swapped
members without introducing a third hand-maintained list.

### 4. The semantic-history authority is unnamed ([[D2016]])

C10 says a product/history artifact and check must appear at first landing, while the product RFC
only says “one line records” and describes staged/first-parent behavior. No repository path, row
encoding, canonical byte image, command, Make target or CI integration is named. The only executable
candidate is an in-memory function inside a disposable harness.

**Repair:** publish the exact artifact path and schema/line encoding, canonical digest inputs,
staged checker, first-parent checker and stable Make/CI target. C10 can then require those literal
authorities rather than searching for something history-like.

### 5. Version grammar is not safe for its numeric representation ([[D2017]])

`[1-9][0-9]*` admits arbitrarily large versions, while the product type and review parser use
JavaScript `number`. `9007199254740992` and `9007199254740993` are distinct valid refs but parse to
the same number, breaking head+1, collision and digest identity.

**Repair:** require a positive safe integer at parse and runtime boundaries (or use one canonical
BigInt/string representation everywhere). Cross the maximum safe value, maximum+1 and the first
two aliased decimal strings.

### 6. Seed/live-claim equality has no phase guard ([[D2018]])

C10 requires the durable seed to equal the “sole initial live claim,” but its own legal post-product
state is 39 landed and zero claimed. As written, an implementer either rejects the required landing
or disables the durable seed check after landing.

**Repair:** specify the state machine explicitly. At landed count zero, require seed = census = sole
initial claim. At landed count greater than zero, retain seed/census immutability and require the
initial set to be a subset of landed/tree, but require no live initial claim. Cross both phases and
the transition.

## Resume order

1. Rebase the future count and transition primitive on the repaired assistance register
   ([[D2013]], [[D2014]]).
2. Reconcile the product declaration and semantic-history authorities ([[D2015]], [[D2016]]).
3. Close version representation and the two C10 phases ([[D2017]], [[D2018]]).
4. Replace the six review arms with able-to-fail author fixtures; run both stable targets,
   governance and `make verify`; then request fresh review.

No runtime, web, schema, storage, content, archive or protected design byte changed.
