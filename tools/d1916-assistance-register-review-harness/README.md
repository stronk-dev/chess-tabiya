# D1916 assistance-register review harness

Disposable process/buildability instrument under `rfc/0000-rfc-process.md` §Exploration gate. It
tests the proposed C9 drift exception and carries two nonblocking controls for the already-routed
D1629 browser persistence seam. It is not production code.

Run from the repository root:

```sh
pnpm exec vitest run --config tools/d1916-assistance-register-review-harness/vitest.config.ts
```
