# Stack selection — server/client languages, board & engine interop

- **Date:** 2026-08-12
- **Feeds:** `rfc/branch-runtime.md` (open question: server language), deferred-decisions register
- **Owner constraints (rulings 2026-08-12):** backend **Go or Node/TS only** (Python, Rust excluded);
  client framework open (Svelte vs React vs vanilla/lit); AGPL-3.0 project licensing; hybrid
  execution with backend capability parity (browser gets progressive enhancements).
- **Prior fluency (legitimate factor):** owner runs cloud-clicker — Go backend + Svelte client
  with a Makefile verify gate. `[V]` owner statement, not externally cited.

## 1. The decisive requirement: dual-bound runtime contract

`rfc/branch-runtime.md` §API surface requires the *same* transport-agnostic contract
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
