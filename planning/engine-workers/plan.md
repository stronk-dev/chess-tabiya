# Engine Workers & Opponent Service — implementation plan

RFC: `rfc/engine-workers.md` (accepted 2026-08-12). Assignee: codex.
`[x]` flips only in commits carrying the exercising test. Append sessions to log.md.

## 1. Run schema v0.3 (the declared branch-runtime amendment)

- [x] `evidence.attached` event in schemas/drill_run.schema.json (v0.3) +
      projection appends node evidenceRefs + negative fixture
- [x] Schema/docs version references updated (packages/schema constant)

## 2. Engine supervisor (apps/server)

- [x] UCI child lifecycle: spawn, handshake, isready warmup, options, health,
      restart w/ backoff, graceful shutdown
- [x] Transcript ring buffer per engine (bounded)
- [x] Engine identity capture (name/version/model/containerDigest/seedHonored)
- [x] Typed ENGINE_UNAVAILABLE + POLICY_MODE_UNSUPPORTED (+ HTTP 503/422)
- [x] Stockfish tests (CI installs binary)

## 3. Maia sidecar (workers/maia)

- [x] Container def promoted from tools/maia-harness lineage (prebaked 5M,
      maia3-uci --use-uci-history); supervisor drives it via docker run/exec
      or configured command
- [x] First contact: record seed exposure → seedHonored; pin versions

## 4. Opponent selector

- [x] POST /select-move (pure; appends nothing): human_common, strong_engine,
      theory_strict per RFC (transposeKey membership, MultiPV mechanism,
      zero-mass fallback, off-spine → human_common)
- [x] Selection cache (policyConfigDigest, branchSeed, historyHash)
- [x] Writer-side helper in @chess-tabiya/runtime: appendOpponentPly(selection)
      → opponent.move_selected + commitMove (strict adjacency)
- [x] Seam test: full ply via REST; server-side direct append gets
      NOT_ACTIVE_WRITER

## 5. Evidence job queue

- [ ] FIFO queue, bounded concurrency; staged results; GET /runs/:id/evidence
- [ ] JobObserver.onRewound cancellation incl. late-result discard test
- [ ] Writer applies evidence.attached / objective upgrades; typing test
      (engine_validated vs human_model_predicted never merged)

## 6. Capabilities + measurements

- [ ] GET /capabilities per RFC shape (superset of policyConfig.locus)
- [ ] INTEGRATION=maia tagged test (20-ply continuation, transcript-proven
      history conditioning); not in make verify; optional CI job
- [ ] Uncached Maia latency measured → log.md
- [ ] Planning proposals for owner: strong_engine strength profile;
      Docker-required vs venv fallback
