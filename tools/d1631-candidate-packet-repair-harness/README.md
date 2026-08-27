# D1631–D1636 shared-candidate repair harness

Disposable exploration instrument under `rfc/0000-rfc-process.md` §Exploration gate. It tests the
six contradictions returned by the independent buildability review; it is not production code.

The harness imports the shipped legal-move authority, semantic collectors, candidate adapter and
F1 compiler. Its local models are prospective contract falsifiers for terminal/adjudication
separation, three cache identities and typed White-to-root score comparison. The repeat-review arm
also compiles the amended 47-event/22-reading scope-wide F1 tuple literally, so the original D1634
static failure is not carried forward after it was repaired.

Run with the repository's Node 24 toolchain:

```sh
pnpm exec vitest run --config tools/d1631-candidate-packet-repair-harness/vitest.config.ts
```
