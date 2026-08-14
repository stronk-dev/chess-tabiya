# Structural reading implementation log

Append-only.

## 2026-08-14 — Codex adversarial review

The draft survived only after revision. D26 was already specified correctly and the pack/run
version registers were current. Five blockers were corrected before implementation: author queries
were incorrectly treated as a finitely enumerable reading; pseudo-attack margins and pseudo-legal
mobility exceeded rung-0 scope; conjunctive evidence retained only its first leaf; existing
evidence refs cannot carry position parameters; and Pack B's central-break alternative made the
minority grade non-specific. The objective-empty exemption audit found no additional legitimate
exemption: deployment-only evidence upgraders are not a pack contract.

## 2026-08-14 — Codex implementation

Implemented pack schema 0.10, the twelve author predicates, a separate finite observation
projection, exhaustive FEN and success-condition dispatch, structural validation, generic durable
grounds, and the closed-by-default client reading. Pack B now grades only its minority-attack
signature and records both conjunctive evidence refs. The terminal browser fixture now honestly uses
`play_until_checkpoint`.

Measured 200 reading+delta samples on the Carlsbad position: median **3.285 ms**, maximum
**5.441 ms**, below the 100 ms worry threshold. Browser acceptance measured board ready 89.1 ms,
rewind 88.5 ms, and branch switch 45.4 ms on the final zero-retry run.

The first browser gate found a real fitted-layout regression: adding the disclosure reduced the
available board row while width-based sizing clipped the final rank, so legal drags landed outside
Chessground. A dedicated grid slot now sizes the board conservatively against viewport height; the
full zero-retry suite then passed. No route, server error code, run schema, storage migration, review
workflow, publication-channel field, LLM renderer, or significance model was added.
