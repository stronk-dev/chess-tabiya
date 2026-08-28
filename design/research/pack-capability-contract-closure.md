# Pack-capability contract closure: dependency, digest and reachability

- **Date:** 2026-08-28
- **Question:** Can the returned pack-capability contract derive exact requirements, detect the
  helper-only D566 semantic change at capability grain, and represent semantic status separately
  from deployment availability?
- **Feeds:** Gate F, F3, [[D1620]], [[D1621]], [[D1622]],
  `rfc/pack-capability-contract.md`
- **Instrument:** `make pack-capability-closure`
- **Scope:** disposable research harness only; no runtime, schema, pack or content mutation

## Result

The returned foundations are implementable with one literal graph, independently checked census
roots, a typed version boundary and two independent state axes. The disposable seven-arm
instrument passes at HEAD `b43e6d18`. [V]

1. A capability site can name either a whole TypeScript function or one discriminant arm inside a
   named function. The source image is the ordered stream of `(SyntaxKind, tokenText)` pairs from
   the TypeScript scanner, excluding trivia. This makes comments and formatting irrelevant while
   retaining executable tokens. [V] `tools/d1620-pack-capability-closure/capability-closure.test.ts`
2. `CapabilityDeclaration.dependsOn` closes semantics digests transitively. Reversing the historical
   D566 helper repair only changes the `pawnSafetyOnPosition` body; the instrument invalidates
   `structuralFeature.pawn_safe_square` and dependent `structuralFeature.outpost`, while leaving
   unrelated `structuralFeature.isolated_pawn` unchanged. [V] Same instrument, fixture 1;
   `packages/runtime/src/structure.ts`
3. Literal selectors plus explicit absent-root selectors derive a pack's direct requirements, and
   dependency closure derives inherited requirements. A pack using `outpost` and omitting `guard`
   derives exactly `guard.defaults`, `structuralFeature.outpost`, and
   `structuralFeature.pawn_safe_square`; adding `isolated_pawn` or omitting the helper fails set
   equality. [V] Same instrument, fixtures 2–3.
4. Semantic disposition and deployment reachability must remain separate. Every current
   `FORMAT_DISPOSITIONS` and `CAPABILITY_DISPOSITIONS` value maps losslessly into the semantic axis,
   including `retired` and `impossible`. Only an active/deprecated, configured provider capability
   may be `temporarily_unavailable`; local, recorded and build-time capabilities cannot acquire that
   transient state. [V] Same instrument, fixtures 4–5;
   `packages/schema/src/drill-pack/dispositions.ts`; `apps/server/src/capabilities.ts`.
5. An annotated-root census can distinguish an unannotated schema union, orphan interpreter,
   missing named evaluator, extra declaration and count-preserving swapped identity; a set or count
   equality alone cannot. [V] Same instrument, fixture 6.
6. A TypeScript-AST rule can reject suffix strings at typed current-authority sites while permitting
   a named legacy-wire fixture and ignoring unrelated artifact-schema ids. [V] Same instrument,
   fixture 7.

## Contract consequences

The implementing contract needs these literal types rather than prose conventions: [M]

```ts
type CapabilitySite =
  | { kind: "symbol"; module: string; symbol: string }
  | {
      kind: "discriminant_arm";
      module: string;
      owner: string;
      property: string;
      value: string;
    };

interface CapabilityDeclaration {
  id: string;
  version: number;
  sites: readonly CapabilitySite[];
  dependsOn: readonly string[];
}

type SemanticDisposition =
  | "active"
  | "deprecated"
  | "withdrawn"
  | "refused"
  | "unmeasured"
  | "impossible";

type DeploymentReachability =
  | "supported"
  | "unsupported"
  | "temporarily_unavailable";
```

The registry must also own a literal applicability table. A selector identifies authored use or
absence-driven defaults; its capability and transitive dependencies form the exact required set.
Resolved shape/principle content digests remain an additional typed edge, not something this narrow
instrument claims to have exercised. [M]

## Current measured baselines

`make evidence-manifest-check` reports **37 producers / 193 projections / 25 consumers / 210
bindings** for the core manifest and **67 events / 67 projections / 15 consumers / 1 provider** for
the semantic manifest. [V] Reproduced 2026-08-28 from
`apps/server/src/evidence-manifest-check.ts`.

`FORMAT_DISPOSITIONS` contains **12** rows: **7 reached / 3 refused / 1 retired / 1 unmeasured**.
[V] `packages/schema/src/drill-pack/dispositions.ts`.

## Boundary and remaining work

This pass supplies executable candidate semantics for [[D1620]]–[[D1623]] and [[D1625]]; the RFC
amendment owns the literal 13-evaluator/16-table inventory, baseline refresh and lifecycle routing.
It does **not** constitute independent buildability acceptance. A fresh reviewer must still test the
amended document as one contract. No lane-0.30 implementation and no corpus application are
authorised; [[D560]] remains in force. [V]
`planning/pack-capability-contract/independent-rereview-2026-08-26.md`.
