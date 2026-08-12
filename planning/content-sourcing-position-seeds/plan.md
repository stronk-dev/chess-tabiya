# Position-seed sourcing — implementation plan

RFC: `rfc/content-sourcing-position-seeds.md` (accepted by owner 2026-08-12).

- [x] Exact eleven-column CSV parser and full legal UCI/SAN replay
- [x] Spine-less consequence-pack emitter with opponent-first parity and honest grading
- [x] Private puzzle-provenance sidecar, strict replay validation, and no served solution
- [x] Streamed zstd source path, headers-only metadata, selection boundaries, and deterministic IDs
- [x] CLI/Make integration, committed candidates, canonical docs, repository and browser verification

Each checkbox is exercised by tests in the implementation commit.
