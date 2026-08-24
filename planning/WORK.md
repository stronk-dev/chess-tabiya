# WORK — start here

This file is navigation. The authoritative strategic rollup is
[`planning/roadmap-to-done.md`](roadmap-to-done.md); its checked ownership map is
[`planning/roadmap-1.0.json`](roadmap-1.0.json).

## Four different questions, four authorities

| Question | Authority | Check |
|---|---|---|
| What does full 1.0 require, and in what dependency order? | `planning/roadmap-to-done.md` | `make roadmap-check` |
| What ideas, defects and rulings exist? | `design/BACKLOG.md` | `make work-index` |
| Which RFC owns a contract/resource and what state is it in? | `rfc/README.md` | `make status-parity register-check` |
| What does the learner-facing audit require item by item? | `planning/ux-implementation-index.md` | covered by `make roadmap-check` |

Do not copy counts from these registers into a new queue. Run the checks. A row being cited is not
the same as being assigned, and an RFC being implemented is not the same as its capability being
complete.

## Taking work

1. Pick the next lawful item from the capability wave in `roadmap-to-done.md`.
2. Follow its source row/RFC/research link. `make work-index` prints the complete current join.
3. Respect the exploration/RFC gate and all resource claims in `rfc/README.md`.
4. Deliver a vertical slice through evidence, state, production API, UX/defaults, content fixture,
   verification and release impact. If a dimension is intentionally absent, record why.
5. Close out the ledger and required log in the same commit. Update docs and propose protected
   intent flow-back where shipped reality changed. Update the roadmap if capability state changed.

## Source lanes

These documents retain detail and evidence. They do not compete with the roadmap:

- Implementation history/tactical orders: `planning/codex-queue.md`, `codex-wave-2.md`,
  `codex-wave-3.md`, `review-return-plan.md`.
- Defects and routing: `planning/defect-triage.md`, `routing-queue.md`,
  `rfc-drafting-queue.md`.
- Research: `planning/exploration/plan.md`, `research-queue.md`,
  `platform-alignment/research-queue.md`, and the program directories beneath `planning/`.
- Integrated evidence and dependency synthesis: `planning/platform-alignment/plan.md`,
  `1.0-capability-map.md`, `execution-queue.md`, `rfc-graph.md`.
- UX evidence: the twelve `design/research/ux-*.md` dossiers and
  `planning/ux-implementation-index.md`.
- Content: `planning/content-era/plan.md`, `content-wave-work-order.md`, graduation/provenance RFCs.
- Release/platform: `planning/platform-alignment/release-platform/` and the Operations capability.

Historical snapshot claims inside those files remain useful as receipts. They cannot override a
live register or declare a 1.0 capability complete.

## Non-negotiable completion rule

“Backend exists”, “endpoint exists”, “component exists”, and “tests pass” are checkpoints, not
product completion. A 1.0 capability closes only when its complete learner/operator journey passes
all eight roadmap dimensions and the release artifact proves it. Bare schemas, orphan reducers,
unreachable endpoints, raw evidence dumps, hidden campaign modes, primitive-first settings, empty
content shelves, and test-only configurations therefore remain open work.
