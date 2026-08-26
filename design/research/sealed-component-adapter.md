# Sealed projection-to-component adapter — executable feasibility pass

**Date:** 2026-08-26
**Question:** Can one F1-admitted evidence item become a typed visual operand, cross JSON, and
remain bound to the admitted fact without making a Svelte component a second chess authority?
**Instrument:** `tools/d1664-component-adapter-harness/` (disposable research code)
**Feeds:** [[D1664]], [[D1588]], `rfc/evidence-presentation.md`,
`rfc/module-registration.md`

## Verdict

**Feasible, with two explicit trust boundaries—not with manifest strings alone.** `[V]`

The executable shape is:

```text
F1-admitted item
  → registered projection-specific adapter
  → process-local sealed component item (WeakSet + evidence-identity WeakMap)
  → closed versioned wire body + digest
  → exact client parser + new client-local seal
  → component
```

The harness runs this path over the real `pack.authored.claim_delivery@1` projection admitted by
the real `guidance.authored_claim@1` consumer in `PRIMARY_EVIDENCE_MANIFEST`. Five tests pass in
Vitest: the positive round trip plus literal/spread/JSON process-seal forges, cross-evidence owner
swap, wire tamper/extra-field/unparsed JSON, and unregistered-projection refusal. `[V]`
`tools/d1664-component-adapter-harness/adapter.test.ts`; command and scope are pinned in its
`README.md`.

## What the pass establishes

1. **A component item needs its own private membership seal.** A copied F1 symbol would repeat the
   already-fixed D1637 defect; a non-enumerable/private `WeakSet` membership is the relevant
   process-local authority. `[V]` The literal, spread and JSON arms all fail with
   `COMPONENT_ADAPTER_UNSEALED`.
2. **The seal also needs an owner identity.** Membership alone says “an adapter built this”; the
   `WeakMap<componentItem, admittedEvidence>` makes a component from one admitted item fail when it
   is paired with another. `[V]` The cross-evidence arm fails with
   `COMPONENT_ADAPTER_OWNER_MISMATCH`.
3. **A process seal does not cross JSON.** The browser needs a separate closed receipt and parser;
   pretending the F1 brand survived serialization is false. `[V]` Direct parsed JSON fails
   `COMPONENT_RECEIPT_UNPARSED`; parsing a digest-valid closed receipt creates a new local seal.
4. **The wire parser must reject both mutation and widening.** Changing only the claim text trips
   the digest, while an added field trips the exact-key check. `[V]`
5. **An admitted projection without a registered adapter must stay admitted-but-unrenderable and
   fail explicitly.** It must not fall through to a generic component. `[V]`

## What the pass does not establish

- The registered adapter remains trusted product code. A seal proves which constructor ran; it
  cannot prove that a malicious or incorrect adapter copied only literal payload operands. Each
  projection family still needs a typed/validated constructor and able-to-fail operand-retention
  fixtures. `[V]` The production boundary today is `DeclaredEvidence<unknown>` plus casts in
  `apps/server/src/guidance.ts`, exactly as [[D1664]] records.
- One authored-claim projection does not validate relation edges, chart scale, citation content,
  abstention state, module budgets, Svelte rendering, or the route-to-seat operation. `[V]`
- The digest is an integrity/join receipt from the trusted server, not a signature against a
  malicious server. `[M]` That is sufficient for the product's current same-service JSON boundary;
  federation would need a separately ruled authenticity contract.
- No performance, bundle-size, accessibility or participant-comprehension conclusion is drawn.

## Contract consequence

`evidence-presentation` should replace its `payloadType`/`operands`-string coverage claim with a
literal registry over exact projection ids and constructors. Module delivery should serialize a
closed component receipt rather than an F1 process object; the client must parse that receipt
before a component can render. The registry should fail both ways: every learner-bound projection
has a constructor, and every constructor names a learner-bound projection. `[M]` This is the
smallest shape consistent with the executable result and the existing F1 trust model.
