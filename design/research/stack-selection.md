# Stack selection — server/client languages, board & engine interop

- **Date:** 2026-08-12
- **Fed:** `rfc/archive/branch-runtime.md` (server-language decision), deferred-decisions register
- **Owner constraints (rulings 2026-08-12):** backend **Go or Node/TS only** (Python, Rust excluded);
  client framework open (Svelte vs React vs vanilla/lit); AGPL-3.0 project licensing; hybrid
  execution with backend capability parity (browser gets progressive enhancements).
- **Prior fluency (legitimate factor):** owner runs cloud-clicker — Go backend + Svelte client
  with a Makefile verify gate. `[V]` owner statement, not externally cited.

## 1. The decisive requirement: dual-bound runtime contract

`rfc/archive/branch-runtime.md` §API surface required the *same* transport-agnostic contract
(`createRun · commitMove · rewind · fork · graph · compare · exportPgn · events`) bound
**both** server-side and client-side, with property-tested invariants and deterministic
replay (same packDigest/policyConfig/seed/user-moves → same opponent moves). `[V]` repo file.

Consequence: a TypeScript implementation of the branch runtime is **mandatory regardless of
backend choice** — the client-side binding cannot be anything else, and the latency budgets
(rewind <100 ms, branch switch <50 ms, `design/02`) rule out a thin client that round-trips
every cursor move to the server. `[M]` analysis. So the real question is not "Go vs TS" but:

- **Node/TS backend:** one shared package (`@chess-drills/runtime`) is the single canonical
  implementation; server and browser import the same code. Replay determinism is tested once.
- **Go backend:** the runtime's core invariants exist **twice** (Go + TS). Deterministic replay —
  the product's foundation — must then be proven equivalent across two implementations
  (shared JSON fixtures, golden event logs, cross-language CI). Feasible, but it is permanent
  ongoing tax on the exact code that "IS the product" (RFC's words). Go→WASM to reuse Go code
  in-browser is not a serious escape: multi-MB binaries, GC pauses, poor JS interop. `[M]`

## 2. Engine & Maia serving reality

- **Stockfish (server):** plain UCI child process. Go `os/exec` + context cancellation and Node
  `child_process` + `AbortController` are both fully adequate; the RFC's invariant 4 (rewind
  cancels stale analysis jobs) is expressible in either. Go is somewhat nicer (goroutines,
  context tree); Node is proven for this (many UCI wrappers exist). `[M]`
- **Maia-3 (server): it is a Python/PyTorch program.** The released engine installs via
  `pip install .`, runs as `maia3-5m` / `python -m maia3.uci`, auto-downloads weights from
  Hugging Face, speaks standard UCI, AGPL-3.0; 5M (CPU-friendly) / 23M / 79M variants.
  `[V]` https://github.com/CSSLab/maia3
  - **FLAG for owner:** the "no Python backend" ruling is satisfiable **only** with a
    *Python-sidecar-worker vs Python-backend* distinction. Maia-3 unavoidably brings a Python
    runtime onto the homeserver — but as a UCI **child process** spawned exactly like Stockfish
    (own venv/uv env, stdin/stdout UCI, supervised by the Go/Node backend). No backend logic is
    written in Python. If the ruling means "no Python process at all," Maia-3 cannot be served
    and the design changes materially. Recommend recording the sidecar distinction in the
    deferred-decisions register. This does not discriminate between Go and Node.
- **Maia in browser (progressive enhancement):** proven pattern — CSSLab's own
  maia-platform-frontend runs Maia models (maia_kdd_1100–1900, the Maia-1 CNN family)
  client-side via onnxruntime-web. `[P]` https://github.com/csslab/maia-platform-frontend
  Whether the maia3 *transformer* exports cleanly to ONNX at usable browser size is
  **unverified** `[M]` — treat browser-Maia as Maia-1-class until tested; it is opt-in anyway.
- **Stockfish WASM (browser):** `@lichess-org/stockfish-web` npm package ships SF 18 /
  smallnet / Fairy-Stockfish builds, GPL-3.0; README warns it is "not straight-forward to
  load" (COOP/COEP/SharedArrayBuffer hosting requirements apply). `[V]`
  https://github.com/lichess-org/lila-stockfish-web — AGPL-3.0 project ⟂ GPL-3.0 dep: compatible. `[M]`

## 3. Chess library ecosystem

| Need | TypeScript | Go |
|---|---|---|
| Rules/FEN/SAN/UCI | **chessops** — lichess-adjacent, streaming PGN parser with game-tree + comments/evals, chessground compat module, GPL-3.0+, active. `[V]` https://github.com/niklasf/chessops. chess.js as permissive alternative. `[M]` | **notnil/chess archived Jan 2025** ("unable to maintain"). `[V]` https://github.com/notnil/chess |
| PGN with variations (RFC invariant 5) | chessops game-tree model, purpose-built for this. `[V]` | Successor **corentings/chess** (v2): PGN variations, FEN, UCI pkg, MIT — but 98 stars, single maintainer, "maintained for my current work," breaking-change warning. `[V]` https://github.com/corentings/chess |
| JSON Schema Draft 2020-12 (pack format) | Ajv (supports 2020-12). `[M]` | santhosh-tekuri/jsonschema v6 (supports 2020-12). `[M]` |
| WebSocket sync | ws / native. `[M]` | coder/websocket or gorilla. `[M]` |
| Property testing (RFC names "fast-check style") | **fast-check** — the literal library the RFC's acceptance criteria reference. `[V]` repo file | gopter / flyingmutant-rapid — capable, less rich shrinking ergonomics. `[M]` |

The Go chess-library situation is the second material finding: the canonical library is dead
and its successor is a one-person fork. Not disqualifying, but the TS side (chessops, battle-
tested under lichess-scale usage) is clearly more mature for exactly the PGN-variations and
game-tree work this product centers on. `[M]` synthesis of `[V]` rows above.

## 4. Board component

**chessground is framework-agnostic**: zero dependencies, ~10 KB gzipped, mounts on a DOM
element, "no chess logic inside"; README lists maintained wrappers for React (2), Svelte (3),
Vue, Angular — and direct vanilla use is the primary API. GPL-3.0+. `[V]`
https://github.com/lichess-org/chessground. The board therefore exerts **no pressure** on the
framework choice; the framework only manages the chrome around it (branch cards, timeline,
compare view, keyboard dispatch).

## 5. Backend comparison (honest tally)

| Criterion | Go + TS client | Node/TS everywhere |
|---|---|---|
| Dual-bound runtime contract | Two implementations of the core; cross-language determinism harness forever | **One shared package; the requirement dissolves** |
| UCI child-process orchestration | Slightly nicer (goroutines/context) | Fully adequate (child_process/AbortController) |
| Maia-3 serving | Python sidecar either way — tie | tie |
| Chess libs | corentings/chess: young fork, solo maintainer | chessops: mature, lichess-adjacent |
| Deploy on homeserver | Single static binary (best) | Node runtime + node_modules (fine, containerize) |
| Owner fluency | **Yes — cloud-clicker precedent** | TS fluent via clients; less backend precedent |
| Solo + AI-agent dev | Two languages/toolchains to keep consistent | One language, one test runner, one lint gate; agents refactor across client/server atomically |
| Test tooling for RFC criteria | rapid/gopter + fast-check (split) | fast-check + Vitest end-to-end |

## 6. Client framework (for board-heavy, low-chrome, keyboard-first UI)

- **Svelte 5:** fine-grained runes reactivity fits the branch-graph/cursor/objective state
  model; smallest chrome overhead; owner fluent (cloud-clicker); chessground wrappers exist
  (or trivial `onMount` integration). `[M]` + `[V]` wrapper listing above.
- **React:** largest agent training corpus; maia-platform-frontend is React (reference code for
  browser-Maia). `[P]` repo above. Heavier for a UI that is mostly one board + keyboard handling.
- **Vanilla/lit:** viable since chessground owns the board DOM, but compare mode (dual boards,
  difference strip) and branch-card rail mean hand-rolled reactivity with no compensating gain. `[M]`

## RECOMMENDATION

**Primary: Node/TS everywhere + Svelte 5.** TypeScript monorepo: shared `runtime` package
(branch graph, replay, objective state machine — the RFC contract) imported by both the Node
backend (Fastify or stdlib http + ws, UCI child processes incl. the Python Maia-3 sidecar,
SQLite event log) and the Svelte 5 client (chessground, `@lichess-org/stockfish-web`,
optional onnxruntime-web Maia). Decisive reasons: (1) the dual-binding requirement is served
by *sharing* the canonical runtime rather than proving two implementations equivalent — the
single highest-risk correctness surface in the product; (2) TS chess ecosystem (chessops,
fast-check, chessground) is where all the mature pieces already live, while Go's canonical
chess lib died in Jan 2025; (3) one language halves the consistency surface for solo+agent
development. Keep the cloud-clicker Makefile-verify-gate workflow — it is stack-independent.

**Runner-up: Go backend + Svelte/TS client.** Choose this only if the owner rules that the
server-side runtime is *authoritative* and the client-side binding is a thin optimistic
predictor (server echo corrects divergence) — that demotion of the client runtime shrinks the
dual-implementation tax to tolerable, and buys Go's static-binary deploy, stronger process
supervision, and the owner's backend fluency. As specified today (client must satisfy latency
budgets standalone), the tax stays large; hence runner-up.

Both combos are AGPL-3.0-clean: GPL-3.0+ deps (chessground, chessops, stockfish builds) and
AGPL-3.0 Maia-3 are compatible with an AGPL-3.0 project. `[M]` — full licensing pass remains
queue 10 in the coverage matrix.

---

## Owner decision memo (2026-08-12): Go vs Node, and the Maia path — full reasoning

### What the backend actually does

Four jobs: (1) UCI child-process orchestration (Stockfish, Maia) — Go and Node
equally fine; (2) event-log store + WebSocket sync + single-writer lease — both
fine at our scale (~one concurrent user); (3) serving client/models — trivial in
both; Go's real win here is a single static binary with embedded assets, a nicer
self-host story than Node+pnpm (Docker mostly equalizes); (4) **chess-aware
computation** — move validation on append, objective predicates, PGN-with-
variations export, pack spine validation/linting, session→pack distillation,
future feature extractors and compare payloads. The whole decision lives in (4).

### The real cost is not porting chessops

Porting movegen to Go is doable (corentings/chess exists — young, single-
maintainer fork of the archived notnil/chess). But SAN disambiguation, e.p.
legality, castling-rights edge cases, and PGN variation/NAG parsing are exactly
the subtle-bug-rich territory where mature beats portable — and a wrongly
validated move poisons the immutable event log forever.

The bigger half is OUR runtime: branch-graph semantics, objective state machine,
deviation classification, timing windows, feature extractors. **Latency budgets
force all of it to run in the browser in TS regardless of backend choice**
(rewind <100 ms cannot round-trip). So the question is never "Go or TS?" — it is
"TS, or TS plus a Go twin?" A chess-aware Go backend means every new trigger
type and extractor is implemented twice and property-tested for
replay-equivalence across languages, forever.

### The one honest Go architecture and its catch

**Go-thin**: Go does ZERO chess — event store + engine orchestrator + static
binary; all chess logic client-side TS; replay reads back logged moves
(BR-C2 ruling already makes them authoritative). Plays to Go's strengths and the
owner's cloud-clicker fluency. The catch: server-side chess tasks don't
disappear (pack lint on upload, distillation, batch evidence jobs, headless
replay for the streamer overlay, corpus features). Under Go-thin each either
moves awkwardly into the browser or requires a Node/TS tool process running the
same runtime package — at which point Node is back in the stack, just less
honestly.

**Go unlocks:** single-binary embedded-asset deploy, lower idle memory, owner
fluency + reusable cloud-clicker scaffolding (Makefile gates, boundary checks),
no node_modules. **Node unlocks:** ONE implementation of the product's core
invariants shared browser/server, mature chessops, fast-check, zero
cross-language equivalence surface. Weighing: for a product whose identity IS a
deterministic replayable runtime, minimizing implementations of that runtime
outweighs deploy elegance. Go-thin is a legitimate runner-up, not a strawman.

### Maia-3: what "properly integrating" would take

Maia-3 = PyTorch transformer (5M/23M/79M) shipped as a pip package with a UCI
wrapper. Options:

- **(a) Containerized sidecar** — UCI child process, same pattern as the
  Stockfish binary (nobody "integrates" Stockfish either). Cost ≈ zero;
  unblocks the E4 coherence harness immediately. Self-hosters never touch pip.
- **(b) ONNX export** — run in onnxruntime from Node (or browser; CSSLab ran
  Maia-1-class models in-browser this way). Real work, real risk: transformer
  export unverified for their architecture, and the sampling layer (Elo
  conditioning, temperature/top-p over legal moves, board/history encoding)
  must be reimplemented outside Python and validated to match. Weeks.
- **(c) Fork/rewrite** — months, no benefit; the weights are the asset (AGPL,
  same as us).

Recommended: (a) now, (b) tracked as later optimization (also enables browser
Maia in the capability negotiation). Scoped exception to "no Python": Python may
exist only inside worker containers speaking UCI/JSON, never in server code.

### Addendum (2026-08-12): scaling honestly, and the polyglot-by-boundary resolution

**What actually stresses at scale.** If usage ever grows (hosted community
instance, streamer bursts), the bottleneck is never the web/event layer — it is
**engine compute**: Stockfish analysis and Maia inference per move, CPU/GPU-bound
worker fleets. That is language-independent (containers + queue). Node handles
thousands of websocket sessions; we would saturate engine workers at dozens of
concurrent drills long before either runtime blinks. "Go for scale" solves the
wrong bottleneck.

**Where Go genuinely wins in THIS system:** CPU-bound streaming/batch work —
above all the **future corpus pipeline** (Stage 1+: streaming multi-GB .pgn.zst
Lichess dumps, parsing millions of games into Parquet). Real threads, low GC
pressure, single binaries. Node is painful there (worker_threads clunkiness);
the archive brief suggested "Rust stream processor later" — Rust is excluded, so
**Go is the natural corpus-worker language**. Crucially, the corpus worker never
touches drill-runtime semantics: it consumes games and emits position/transition
statistics. No shared-runtime tax.

**The hole asymmetry.** Node-core keeps every door open: if server compute ever
hurts, shard it into Go workers behind data-format boundaries. Go-core closes a
door permanently: the runtime is double-implemented (full Go) or the server is
chess-blind (Go-thin) until a TS tool process sneaks Node back in. One hole has
an escape ladder, the other compounds.

**On "developing the de facto Go chess lib":** a lichess-grade movegen/SAN/PGN-
variations library is months of correctness work (perft suites, disambiguation,
e.p./castling edge cases) — a second product. Fine OSS ambition; extract it
later from stable needs rather than couple the drill product's critical path to
it.

**Resolution — polyglot by boundary (doctrine, if adopted):** everything that
touches drill semantics (runtime, packs, objective machine, feedback, server
API) is TypeScript with the one shared runtime package; **any self-contained
worker that speaks only data formats (UCI, JSON events, Parquet) SHOULD be Go**
— flagship: the corpus pipeline; candidates: engine-pool supervisor, PGN bulk
tooling. Owner writes Go where Go is best, cloud-clicker scaffolding carries
over, zero double implementation of invariants.
