# Longitudinal store — fifth author repair

- **Date:** 2026-09-02
- **Scope:** RFC contract and disposable falsifier only; no product migration, worker, reader,
  consumer, API, client or content bytes
- **Rows:** [[D2514]], [[D2515]], [[D2516]], [[D2517]]
- **Gate:** genuinely fresh independent buildability review still required

## Result

The fourth fresh return's four findings are repaired as one production snapshot service.

1. The multi-run reader now returns one discriminated outcome per stable run cut. Mixed failures,
   retry deadlines and unavailable causes retain their own fields; any incomplete vector returns no
   derived rows.
2. HTTP and worker receive one canonical absolute file-backed SQLite identity. Required-worker
   memory databases fail configuration; the isolated memory composition is an explicit test-only,
   worker-free helper that advertises `disabled_test`.
3. `longitudinalSourceImageV1` fixes the replayed prefix and resolved attribution inputs;
   `longitudinalSourceDigestV1` hashes its RFC-8785 bytes behind a literal UTF-8 domain prefix. All
   writers/reconciliation/worker/rebuild must call the same constructor.
4. Lifecycle is mapped onto the application that exists: composition reconciles and awaits ready,
   `main.ts` then listens, `close()` drains before databases close, `/healthz` reflects worker
   degradation, and build/container verification requires the separate worker artifact from
   `dist`.

## Executable evidence

`make longitudinal-store-fifth-author-repair` retains the original 24-arm contract and the fourth
repair's 8 arms, then runs 4 new able-to-fail controls plus strict TypeScript. The new controls
exercise mixed-cut cardinality, two real connections to one SQLite file, canonical/domain-separated
digest mutation behavior, and the closed lifecycle/build vocabulary.

This is author evidence, not acceptance. Another reviewer must reconstruct the source image,
database/lifecycle boundary and packaged worker from live production symbols before implementation
is lawful.
