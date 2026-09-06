# Provider-protocol register — fifth author repair

**Date:** 2026-09-06

## Outcome

The bounded repair closes [[D2950]]–[[D2955]] at author-contract tier without changing the generic
catalogue, human register, provider product, schema, storage, content, archive or protected-design
bytes.

- one build-owned operation resolves an actual repository and walks `git rev-list --first-parent
  --reverse HEAD`; no history-shaped public input exists;
- source status and receipt bytes are read from each resolved commit object, while landing re-reads
  the current HEAD, index and worktree itself;
- acceptance authority retains the digest of the exact accepted receipt bytes separately from the
  receipt's semantic obligations digest;
- receipt files must equal their RFC-8785 canonical bytes plus one final newline before semantic
  parsing, so duplicate keys, whitespace, key-order and newline drift fail;
- the repository's shipped `canonicalizeJson` supplies Unicode-scalar and finite-number semantics;
  and
- every first-parent image after v1 acceptance must retain the exact accepted receipt bytes, so
  mutation, disappearance and mutate-then-restore fail.

## Executable evidence

`make provider-protocol-fifth-author-repair` retains every earlier review/repair stage, passes the
six fifth-review counterexamples, then passes 6/6 direct repair groups plus the repository's strict
TypeScript configuration. The positive path creates a real temporary Git repository with separate
draft and accepted commits. Negative paths cross fake/non-repository input, exact worktree drift,
staged substitution, committed mutation, duplicate raw keys, both lone-surrogate directions and a
mutate/restore history.

## Boundary

This is author-contract evidence, not acceptance or implementation. The model demonstrates the
required build-orchestration boundary; production process bytes still wait for a genuinely fresh
review and the owner's acceptance plus implementation of the generic shared-resource bootstrap.
Provider operation/domain population and consumer closure remain the later D4 obligation of
`provider-exchange-and-execution.md`.
