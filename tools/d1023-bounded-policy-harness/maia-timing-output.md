# D1023 Maia request timing

Both passes used the 96-row sealed provider sample at bands 1000/1400/1800/2200, temperature 0.8,
top-p 0.92 and the same local server/sidecar identity recorded in `maia-output.json`. The sample
digest was `6cdddbffd72d8af93504f808bf012d5ea68b5f9103277bb493e2d1c92984748b`; each pass made
2,596 distinct harness requests.

| server cache state | p50 | p90 | p99 | max |
|---|---:|---:|---:|---:|
| first full pass after a one-row smoke (36 possible cache hits) | 91.0 ms | 161.7 ms | 279.2 ms | 1,185.0 ms |
| immediate warm replay | 0.4 ms | 0.7 ms | 1.0 ms | 2.7 ms |

The first full pass was run after `make up-engines` and a one-row smoke pass; up to 36 of its 2,596
requests could therefore already be cached. The second repeated the identical sample against the
still-running service. These are HTTP request timings observed by the disposable harness, not a
claim about end-user interaction latency or a cold model/container-start measurement. A true cold
distribution is unmeasured. The compact JSON artifact retains the warm replay timings; this file
retains both observations so rerunning the harness cannot silently replace the first-full-pass
measurement with a cache hit.
