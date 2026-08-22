# Tactical collector measurement harness

Permanent acceptance instrument for `rfc/tactical-collectors.md` A5, A7, A8 and A18.
It runs production collectors over the authored pack spine and the sealed
`r2-imported-sample` separately, comparing played moves with the complete legal-alternative
population from each source position. Rare state-shaped collectors are reported as censuses;
capture is reported only as frequency and local-exchange class distribution, never as lift.

Run with:

```sh
make tactical-collector-measurement
```

The deterministic report is written to `output.md`. A zero is a measurement result, not
permission to weaken a predicate or manufacture content.
