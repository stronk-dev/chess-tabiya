# Work-state implementation plan

Authority: `rfc/archive/work-state.md`.

1. Extend the one ledger parser with exact source rows and glyphs without changing its existing
   public result or routing behavior.
2. Bootstrap `planning/work-state.json` from closure glyphs and unambiguous live UX ownership.
   Infer neither activity nor blockers from prose.
3. Enforce population, vocabulary, state fields, live blockers, closure parity, exact digests,
   UX reverse references and the one-way untriaged ratchet through `make work-state`.
4. Wire the check into ordinary governance and staged process checks.
5. Close the RFC, ledger and exploration log together after full verification.

The initial census is a baseline, not a success metric. The next program is to classify the 1,395
untriaged rows by 1.0 capability and dependency wave without producing another snapshot queue.
