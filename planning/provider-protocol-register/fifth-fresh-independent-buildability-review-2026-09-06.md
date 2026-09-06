# Provider-protocol fifth fresh independent buildability review — 2026-09-06

## Verdict

**Return.** The fourth repair fixes population ordering and the receipt's value-level schema/digest
grammar, but its acceptance authority is still constructed from history-shaped caller data and
parsed objects rather than from repository-owned first-parent history and exact file bytes. Six
independent counterexamples cross the claimed boundary.

No owner ruling is needed. These are build-authority and canonical-input defects, not provider
semantics. The generic bootstrap dependency remains unimplemented, so this review changes no
catalogue, register or product byte and authorizes no implementation.

## Findings

### [[D2950]] — caller-shaped history mints repository authority

`projectAcceptedAuthority(firstParentHistory)` accepts a plain array. Each image carries only a
nonempty `commit` string, status and already-materialized receipt (`contract.mjs:30-58`); there is no
repository identity, resolved Git object, parent edge, required base or source-RFC byte image. Two
rows named `not-a-git-object` and `also-not-a-git-object` mint a live authority and validate a
product resource. The repair has modeled history syntax, not history authority.

### [[D2951]] — exact accepted bytes collapse to semantic value

The RFC requires the SHA-256 digest of the exact receipt bytes (`provider-protocol-register.md:
172-180`). The model parses the receipt and hashes `canonical(accepted.receipt)` instead
(`contract.mjs:47-56`). Compact accepted JSON and reordered, pretty-printed JSON with a final
newline therefore share one authority and pass current validation. Parsing and semantic equality
cannot substitute for exact-file identity.

### [[D2952]] — current and staged checkout state are caller claims

`validateProductLanding` receives only `(authority, currentReceipt, candidateResource)` and reads no
HEAD, index or worktree state (`contract.mjs:67-77`). A caller can supply the accepted A object while
the modeled committed, staged and working receipt are B, and the product landing succeeds. The RFC
explicitly requires current committed bytes and staged identity (`provider-protocol-register.md:
178-192`); build composition must own and seal those observations.

### [[D2953]] — duplicate keys are already erased

The exact receipt grammar says no alternate or extra key parses, and canonical file identity
requires duplicate-key refusal before ordinary JSON materialization. `parseReceipt(value)` accepts
an object (`contract.mjs:18-28`). Raw bytes with two `schema` keys collapse to the valid last value
under `JSON.parse`, after which the model accepts them. A byte reader, duplicate-key-aware parser and
canonical byte comparison must precede the object parser.

### [[D2954]] — partial canonicalizer accepts invalid Unicode

The model's `canonical()` delegates strings directly to `JSON.stringify` (`contract.mjs:133-137`).
An operation id containing a lone high surrogate therefore receives a valid-looking receipt and
resource digest and completes product validation. The repository's shipped RFC-8785 authority
rejects lone high and low surrogates (`packages/schema/src/drill-pack/digest.ts:9-22`). This process
contract must reuse that authority instead of defining a weaker local dialect.

### [[D2955]] — accepted receipt mutation inside history is ignored

Once the first accepted image is captured, later accepted images are checked only for status;
their receipt fields are ignored (`contract.mjs:43-50`). A history with accepted A followed by
accepted B still mints authority for A and validates A. That contradicts the explicit rule that an
accepted receipt version is immutable and never rewritten (`provider-protocol-register.md:201-205`).
Every later first-parent image must preserve exact bytes; mutation, deletion and mutate-then-restore
must all fail.

## Executable evidence

`make provider-protocol-fifth-fresh-review` retains every earlier return and repair and passes six
fresh counterexamples. The fifth suite proves that fake commit labels mint authority, byte-distinct
receipts compare equal, stale caller input bypasses checkout state, duplicate keys collapse, lone
surrogates hash, and post-accept mutation is ignored.

A bounded author repair must introduce one repository-owned complete-history reader, exact
accepted/current/index/worktree byte identities, pre-materialization duplicate/canonical checks,
the shared RFC-8785 implementation and post-accept immutability. Another genuinely fresh review and
the accepted/implemented generic bootstrap still precede process implementation.
