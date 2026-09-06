# Provider-protocol register — sixth fresh independent buildability review

**Date:** 2026-09-06

## Verdict

**Return to author.** The fifth repair closes [[D2950]]–[[D2955]] around exact accepted receipt
bytes, but its repository/product boundary cannot survive the product lifecycle and is not yet
owned by the generic staged transition authority. No process or product implementation is
authorized.

## Executable findings

- [[D2956]]: a legal `accepted` → `implementing` commit throws `SOURCE_STATUS`; a later archive move
  throws `ACCEPTANCE_REGRESSION`. The accepted transition cannot be retained by requiring the source
  file to stay eternally accepted at its active path.
- [[D2957]]: the public raw-path issuer accepts an independently created lookalike Git repository.
  Git-backed is not the same as build-composition-owned.
- [[D2958]]: the landing check observes receipt bytes in HEAD/index/worktree but does not observe the
  source RFC in index/worktree. A withdrawn worktree source validates before commit and fails after
  it, which makes the pre-commit decision false-green.
- [[D2959]]: `issueResource` creates the resource from caller arrays and the landing check accepts it
  while the declared product source file is absent. The generic engine's opaque staged projection
  must be the only product operand.

## Evidence

`make provider-protocol-sixth-fresh-review` retains every previous review/repair target, reproduces
all five new controls and passes the repository TypeScript contract. The controls use real temporary
Git repositories and real commits; none replaces Git history with a hand-written row array.

## Repair boundary

The next author repair must compose the provider-specific acceptance check with the generic
repository/transition authority rather than creating another parallel reader. It must retain the
unique accepted preimage while recognizing exact legal later lifecycle states and archive movement,
bind current source state at landing, and consume an opaque staged `canonical_resource@1`
projection. The generic bootstrap remains a real dependency; this return does not authorize
implementing around it.
