# D1664 sealed component-adapter harness

Disposable research instrument for the `evidence-presentation` return. It tests one real
`pack.authored.claim_delivery@1` item across admission, a registered component adapter, a
process-local seal, a closed digest-bound wire receipt and a client parser.

It does not modify production evidence, choose UI copy, or authorize the RFC. Its purpose is to
show which trust boundaries must exist for a typed component to preserve F1 admission.

```sh
pnpm exec vitest run --config tools/d1664-component-adapter-harness/vitest.config.ts
```
