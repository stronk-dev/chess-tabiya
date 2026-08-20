# Detector semantic conformance harness (D629)

Disposable research instrument. It audits the shipped detector vocabulary; it does not authorize
product code, define chess truth, or replace a future compiled evidence manifest.

Run:

```sh
./node_modules/.bin/vitest run --config tools/detector-conformance-harness/vitest.config.ts
```

The harness checks enum/register closure, one positive and one hard-negative predicate fixture for
all 18 structural kinds, corpus witness coverage for all readers and transition leaves, retained
operand fields, and the generic reader sinks that currently bypass per-family consumer admission.
It writes the reproducible census to `output.md`.
