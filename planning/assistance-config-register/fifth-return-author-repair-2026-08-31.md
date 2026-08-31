# Assistance register fifth-return author repair — 2026-08-31

## Verdict

Author-repaired [[D2355]]–[[D2360]]. The RFC remains draft and implementation remains forbidden
until a sixth fresh independent review accepts the amended contract.

## What changed

- Historical workflow-v1 is recorded as it ships: unknown object keys are ignored, preset
  admission depends on the requested context, and invalid input falls back to that context's
  default. Strict durable parsing begins at workflow-v2.
- Workflow preference now has one named root, an exact six-symbol head-1 authority population and
  an exact eight-symbol v1→v2 transition.
- Assistance exchange now derives absence from one named future version root plus empty history.
  Its first transition contains ten exact symbols.
- Once an exchange has landed history, a missing or renamed root is a fatal regression. It cannot
  become absent again or acquire a second first claim.
- The `legal` permission transition contains the union plus all four semantic operations that
  return, clamp or compile it.
- Mutation classes 52–57 and a disposable executable model cross valid first landing, empty first
  claims, skipped next lanes and landed→absent regression.

## Evidence

`make assistance-register-fourth-author-repair` passes 6/6. The instrument lives at
`tools/d2355-assistance-register-author-repair/` and specifies process semantics only; it is not
the production register implementation.

The historical fifth-review harness now fails five of six pre-repair assertions, the expected
inversion for every RFC-text predicate. D2360 deliberately continues to inspect the superseded
D2178 prose-only harness rather than this repair's executable model. It remains a reproduction
artifact, not a success gate for the repaired document; fresh review must inspect the new model
directly.

## Boundary

No production register, runtime, web, schema, content, archive or protected design byte changed.
The next action is a fresh independent buildability review, not C9 implementation.
